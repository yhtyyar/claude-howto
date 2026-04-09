/**
 * MCP Server Entry Point
 * Model Context Protocol server for intent routing
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
import { getRouter } from './router.js';
import { getConfigManager } from './config.js';
import type { RoutingContext, DetectIntentOptions } from './types.js';

/**
 * Server version
 */
const SERVER_VERSION = '1.0.0';

/**
 * Server name
 */
const SERVER_NAME = 'qoder-intent-router';

/**
 * Tool definitions
 */
const TOOLS = [
  {
    name: 'detect_intent',
    description:
      'Detect user intent from input text and return the best matching ' +
      'intent with confidence score and optional spec content',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'User input text to analyze',
        },
        context: {
          type: 'object',
          description: 'Optional context information',
          properties: {
            currentFile: {
              type: 'string',
              description: 'Currently open file path',
            },
            selectedCode: {
              type: 'string',
              description: 'Selected code snippet',
            },
            projectType: {
              type: 'string',
              description: 'Project type (e.g., nodejs, python)',
            },
            previousIntent: {
              type: 'string',
              description: 'Previous intent ID in session',
            },
          },
        },
        includeSpec: {
          type: 'boolean',
          description: 'Include spec content in response',
          default: true,
        },
        minConfidence: {
          type: 'number',
          description: 'Minimum confidence threshold (0.0-1.0)',
          minimum: 0,
          maximum: 1,
        },
        maxAlternatives: {
          type: 'number',
          description: 'Maximum number of alternative intents to return',
          minimum: 0,
          maximum: 10,
          default: 3,
        },
      },
      required: ['input'],
    },
  },
  {
    name: 'list_intents',
    description: 'List all available intents with optional filtering by category',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category (e.g., quality, testing, documentation)',
        },
        includePatterns: {
          type: 'boolean',
          description: 'Include pattern definitions in response',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_intent',
    description: 'Get detailed information about a specific intent by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Intent ID',
        },
        includeSpec: {
          type: 'boolean',
          description: 'Include spec content',
          default: true,
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'reload_intents',
    description: 'Reload all intents from specs directory (hot reload)',
    inputSchema: {
      type: 'object',
      properties: {
        validate: {
          type: 'boolean',
          description: 'Validate intents after reload',
          default: true,
        },
      },
    },
  },
  {
    name: 'get_spec',
    description: 'Get spec file content by path',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to spec file (relative to specs directory)',
        },
        renderTemplate: {
          type: 'boolean',
          description: 'Render template variables',
          default: true,
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get router statistics including cache metrics and intent usage',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'clear_cache',
    description: 'Clear the intent routing cache',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Initialize and start MCP server
 */
async function main(): Promise<void> {
  try {
    // Initialize router
    const router = getRouter();
    await router.initialize();

    // Create server
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

    // Handle tool listing
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOLS };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'detect_intent':
            return await handleDetectIntent(router, args);

          case 'list_intents':
            return await handleListIntents(router, args);

          case 'get_intent':
            return await handleGetIntent(router, args);

          case 'reload_intents':
            return await handleReloadIntents(router, args);

          case 'get_spec':
            return await handleGetSpec(router, args);

          case 'get_stats':
            return await handleGetStats(router);

          case 'clear_cache':
            return await handleClearCache(router);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
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

    // Create transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error(`[${SERVER_NAME}] Server running on stdio`);
  } catch (error) {
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    process.exit(1);
  }
}

/**
 * Handle detect_intent tool call
 */
async function handleDetectIntent(
  router: ReturnType<typeof getRouter>,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.input !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing or invalid "input" parameter');
  }

  const input = args.input;
  const context = (args.context as RoutingContext) || undefined;
  const options: DetectIntentOptions = {
    includeSpec: args.includeSpec !== false,
    minConfidence: typeof args.minConfidence === 'number' ? args.minConfidence : undefined,
    maxAlternatives: typeof args.maxAlternatives === 'number' ? args.maxAlternatives : undefined,
  };

  const result = await router.detectIntent(input, context, options);

  const response = {
    success: !result.error,
    intent: result.error
      ? null
      : {
          id: result.intent.id,
          name: result.intent.name,
          description: result.intent.description,
          category: result.intent.category,
          spec_path: result.intent.spec_path,
        },
    confidence: result.confidence,
    matched_pattern: result.error
      ? null
      : {
          type: result.matchedPattern.type,
          value: result.matchedPattern.value,
        },
    alternatives: result.alternativeIntents.map((intent) => ({
      id: intent.id,
      name: intent.name,
      description: intent.description,
    })),
    spec_content: result.specContent,
    error: result.error,
    timestamp: result.timestamp,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

/**
 * Handle list_intents tool call
 */
async function handleListIntents(
  router: ReturnType<typeof getRouter>,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const category = typeof args.category === 'string' ? args.category : undefined;
  const includePatterns = args.includePatterns === true;

  const intents = router.listIntents(category);

  const response = intents.map((intent) => ({
    id: intent.id,
    name: intent.name,
    description: intent.description,
    category: intent.category,
    priority: intent.priority,
    confidence_threshold: intent.confidence_threshold,
    patterns: includePatterns
      ? intent.patterns.map((p) => ({ type: p.type, value: p.value, weight: p.weight }))
      : undefined,
    spec_path: intent.spec_path,
  }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

/**
 * Handle get_intent tool call
 */
async function handleGetIntent(
  router: ReturnType<typeof getRouter>,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.id !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing or invalid "id" parameter');
  }

  const intent = router.getIntent(args.id);

  if (!intent) {
    throw new McpError(ErrorCode.InvalidRequest, `Intent not found: ${args.id}`);
  }

  const includeSpec = args.includeSpec !== false;
  let specContent: string | undefined;

  if (includeSpec) {
    const result = await router.detectIntent(intent.patterns[0]?.value || '', undefined, {
      includeSpec: true,
    });
    specContent = result.specContent;
  }

  const response = {
    id: intent.id,
    name: intent.name,
    description: intent.description,
    category: intent.category,
    priority: intent.priority,
    confidence_threshold: intent.confidence_threshold,
    patterns: intent.patterns.map((p) => ({
      type: p.type,
      value: p.value,
      weight: p.weight,
    })),
    context_requirements: intent.context_requirements,
    spec_path: intent.spec_path,
    metadata: intent.metadata,
    spec_content: specContent,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

/**
 * Handle reload_intents tool call
 */
async function handleReloadIntents(
  router: ReturnType<typeof getRouter>,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const validate = args.validate !== false;

  await router.reloadIntents();

  const stats = router.getStats();

  const response = {
    success: true,
    intents_loaded: stats.intentsLoaded,
    cache_cleared: true,
    validate,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

/**
 * Handle get_spec tool call
 */
async function handleGetSpec(
  router: ReturnType<typeof getRouter>,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.path !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing or invalid "path" parameter');
  }

  // Use router's spec loading via detectIntent with dummy pattern
  const result = await router.detectIntent('__get_spec__', undefined, {
    includeSpec: true,
  });

  // Actually, we need to implement proper spec loading
  // For now, return error - this needs proper implementation
  throw new McpError(ErrorCode.InternalError, 'get_spec not yet fully implemented');
}

/**
 * Handle get_stats tool call
 */
async function handleGetStats(
  router: ReturnType<typeof getRouter>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const stats = router.getStats();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
}

/**
 * Handle clear_cache tool call
 */
async function handleClearCache(
  router: ReturnType<typeof getRouter>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  router.clearCache();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, message: 'Cache cleared' }, null, 2),
      },
    ],
  };
}

// Start server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
