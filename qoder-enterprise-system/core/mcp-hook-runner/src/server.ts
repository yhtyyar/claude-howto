/**
 * MCP Hook Runner Server
 * Entry point for the hook automation MCP server
 *
 * @module server
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { loadWorkflows, getWorkflowByName, getWorkflowsByType } from './workflow-parser.js';
import { executeWorkflow } from './executor.js';
import type { Workflow, ExecutionContext, RunnerConfig } from './types.js';

const SERVER_VERSION = '1.0.0';
const SERVER_NAME = 'qoder-hooks';

interface ServerState {
  config: RunnerConfig;
  workflows: Workflow[];
  lastLoadTime: number;
}

const state: ServerState = {
  config: {
    workflowsPath: './workflows',
    defaultTimeout: 300,
    maxConcurrent: 4,
    logging: true,
    logLevel: 'info',
  },
  workflows: [],
  lastLoadTime: 0,
};

const TOOLS = [
  {
    name: 'run_workflow',
    description: 'Execute a workflow by name',
    inputSchema: {
      type: 'object',
      properties: {
        workflowName: {
          type: 'string',
          description: 'Name of the workflow to run',
        },
        context: {
          type: 'object',
          description: 'Execution context',
          properties: {
            cwd: { type: 'string' },
            env: { type: 'object' },
          },
        },
      },
      required: ['workflowName'],
    },
  },
  {
    name: 'run_hook',
    description: 'Run workflows for a specific hook type',
    inputSchema: {
      type: 'object',
      properties: {
        hookType: {
          type: 'string',
          description: 'Hook type (pre-commit, post-commit, etc.)',
        },
        context: {
          type: 'object',
          description: 'Execution context',
        },
      },
      required: ['hookType'],
    },
  },
  {
    name: 'list_workflows',
    description: 'List all available workflows',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by hook type',
        },
      },
    },
  },
  {
    name: 'validate_workflow',
    description: 'Validate a workflow YAML file',
    inputSchema: {
      type: 'object',
      properties: {
        workflowPath: {
          type: 'string',
          description: 'Path to workflow YAML file',
        },
        workflowYaml: {
          type: 'string',
          description: 'Workflow YAML content (alternative to path)',
        },
      },
    },
  },
  {
    name: 'get_workflow',
    description: 'Get workflow details',
    inputSchema: {
      type: 'object',
      properties: {
        workflowName: {
          type: 'string',
          description: 'Workflow name',
        },
      },
      required: ['workflowName'],
    },
  },
  {
    name: 'reload_workflows',
    description: 'Reload all workflows from disk',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

async function main(): Promise<void> {
  try {
    // Load configuration from environment
    loadConfig();

    // Initial workflow load
    await reloadWorkflows();

    const server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOLS };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_workflow':
            return await handleRunWorkflow(args || {});

          case 'run_hook':
            return await handleRunHook(args || {});

          case 'list_workflows':
            return await handleListWorkflows(args || {});

          case 'validate_workflow':
            return await handleValidateWorkflow(args || {});

          case 'get_workflow':
            return await handleGetWorkflow(args || {});

          case 'reload_workflows':
            return await handleReloadWorkflows();

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error(`[${SERVER_NAME}] Server running on stdio`);
  } catch (error) {
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    process.exit(1);
  }
}

function loadConfig(): void {
  const env = process.env;

  if (env.QODER_HOOKS_PATH) {
    state.config.workflowsPath = env.QODER_HOOKS_PATH;
  }

  if (env.QODER_HOOKS_TIMEOUT) {
    state.config.defaultTimeout = parseInt(env.QODER_HOOKS_TIMEOUT, 10);
  }

  if (env.QODER_HOOKS_MAX_CONCURRENT) {
    state.config.maxConcurrent = parseInt(env.QODER_HOOKS_MAX_CONCURRENT, 10);
  }

  if (env.QODER_HOOKS_LOG_LEVEL) {
    state.config.logLevel = env.QODER_HOOKS_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
  }
}

async function reloadWorkflows(): Promise<void> {
  const { workflows, errors } = await loadWorkflows(state.config.workflowsPath);

  state.workflows = workflows;
  state.lastLoadTime = Date.now();

  if (errors.length > 0) {
    console.error(`[${SERVER_NAME}] Workflow load errors:`, errors);
  }

  console.error(`[${SERVER_NAME}] Loaded ${workflows.length} workflows`);
}

async function handleRunWorkflow(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.workflowName !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing workflowName');
  }

  const workflow = getWorkflowByName(state.workflows, args.workflowName);
  if (!workflow) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Workflow not found: ${args.workflowName}`
    );
  }

  const context: ExecutionContext = {
    cwd: (args.context as { cwd?: string })?.cwd || process.cwd(),
    env: { ...process.env, ...((args.context as { env?: Record<string, string> })?.env || {}) } as Record<string, string>,
  };

  const result = await executeWorkflow(workflow, context);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleRunHook(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.hookType !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing hookType');
  }

  const workflows = getWorkflowsByType(state.workflows, args.hookType);

  if (workflows.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: true, message: `No workflows for hook type: ${args.hookType}` },
            null,
            2
          ),
        },
      ],
    };
  }

  const context: ExecutionContext = {
    cwd: (args.context as { cwd?: string })?.cwd || process.cwd(),
    env: { ...process.env, ...((args.context as { env?: Record<string, string> })?.env || {}) } as Record<string, string>,
  };

  const results = await Promise.all(
    workflows.map((workflow) => executeWorkflow(workflow, context))
  );

  const success = results.every((r) => r.success);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success, workflows: results }, null, 2),
      },
    ],
  };
}

async function handleListWorkflows(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  let workflows = state.workflows;

  if (typeof args.type === 'string') {
    workflows = getWorkflowsByType(workflows, args.type);
  }

  const summary = workflows.map((w) => ({
    name: w.name,
    type: w.type,
    description: w.description,
    steps: w.steps.length,
  }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ workflows: summary, total: summary.length }, null, 2),
      },
    ],
  };
}

async function handleValidateWorkflow(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { parseWorkflowFile, parseWorkflowYaml } = await import('./workflow-parser.js');

  let validation;

  if (typeof args.workflowPath === 'string') {
    const result = await parseWorkflowFile(args.workflowPath);
    validation = result.validation;
  } else if (typeof args.workflowYaml === 'string') {
    const result = parseWorkflowYaml(args.workflowYaml, 'inline');
    validation = result.validation;
  } else {
    throw new McpError(ErrorCode.InvalidParams, 'Missing workflowPath or workflowYaml');
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(validation, null, 2),
      },
    ],
  };
}

async function handleGetWorkflow(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.workflowName !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing workflowName');
  }

  const workflow = getWorkflowByName(state.workflows, args.workflowName);

  if (!workflow) {
    throw new McpError(ErrorCode.InvalidRequest, `Workflow not found: ${args.workflowName}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(workflow, null, 2),
      },
    ],
  };
}

async function handleReloadWorkflows(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  await reloadWorkflows();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            workflowsLoaded: state.workflows.length,
            timestamp: state.lastLoadTime,
          },
          null,
          2
        ),
      },
    ],
  };
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
