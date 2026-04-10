/**
 * MCP Checkpoint Manager Server
 * Entry point for the checkpoint management MCP server
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
import { CheckpointManager, getCheckpointManager } from './checkpoint-manager.js';

const SERVER_VERSION = '1.0.0';
const SERVER_NAME = 'qoder-checkpoint';

const TOOLS = [
  {
    name: 'create_checkpoint',
    description: 'Create a new git-based checkpoint',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Checkpoint name',
        },
        description: {
          type: 'string',
          description: 'Detailed description',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        prompt: {
          type: 'string',
          description: 'User prompt to save with checkpoint',
        },
        keepStash: {
          type: 'boolean',
          description: 'Keep changes stashed after checkpoint',
          default: false,
        },
        includeContext: {
          type: 'boolean',
          description: 'Include current context',
          default: true,
        },
      },
      required: ['name', 'description'],
    },
  },
  {
    name: 'restore_checkpoint',
    description: 'Restore project to checkpoint state',
    inputSchema: {
      type: 'object',
      properties: {
        checkpointId: {
          type: 'string',
          description: 'Checkpoint ID to restore',
        },
        force: {
          type: 'boolean',
          description: 'Force restore even with uncommitted changes',
          default: false,
        },
        createBranch: {
          type: 'boolean',
          description: 'Create new branch after restore',
          default: false,
        },
        branchName: {
          type: 'string',
          description: 'New branch name (if createBranch is true)',
        },
        restoreContext: {
          type: 'boolean',
          description: 'Restore saved context',
          default: true,
        },
      },
      required: ['checkpointId'],
    },
  },
  {
    name: 'list_checkpoints',
    description: 'List all checkpoints with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Filter by branch',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum results',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Include full metadata',
          default: true,
        },
      },
    },
  },
  {
    name: 'delete_checkpoint',
    description: 'Delete a checkpoint',
    inputSchema: {
      type: 'object',
      properties: {
        checkpointId: {
          type: 'string',
          description: 'Checkpoint ID to delete',
        },
      },
      required: ['checkpointId'],
    },
  },
  {
    name: 'diff_checkpoints',
    description: 'Compare two checkpoints',
    inputSchema: {
      type: 'object',
      properties: {
        checkpointIdA: {
          type: 'string',
          description: 'First checkpoint ID',
        },
        checkpointIdB: {
          type: 'string',
          description: 'Second checkpoint ID',
        },
      },
      required: ['checkpointIdA', 'checkpointIdB'],
    },
  },
  {
    name: 'get_checkpoint_metadata',
    description: 'Get checkpoint metadata',
    inputSchema: {
      type: 'object',
      properties: {
        checkpointId: {
          type: 'string',
          description: 'Checkpoint ID',
        },
      },
      required: ['checkpointId'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get checkpoint statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cleanup',
    description: 'Clean up old checkpoints based on retention policy',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

async function main(): Promise<void> {
  try {
    const manager = getCheckpointManager();
    await manager.initialize();

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
          case 'create_checkpoint':
            return await handleCreateCheckpoint(manager, args || {});

          case 'restore_checkpoint':
            return await handleRestoreCheckpoint(manager, args || {});

          case 'list_checkpoints':
            return await handleListCheckpoints(manager, args || {});

          case 'delete_checkpoint':
            return await handleDeleteCheckpoint(manager, args || {});

          case 'diff_checkpoints':
            return await handleDiffCheckpoints(manager, args || {});

          case 'get_checkpoint_metadata':
            return await handleGetMetadata(manager, args || {});

          case 'get_stats':
            return await handleGetStats(manager);

          case 'cleanup':
            return await handleCleanup(manager);

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

async function handleCreateCheckpoint(
  manager: CheckpointManager,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.name !== 'string' || typeof args.description !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing name or description');
  }

  const result = await manager.create(args.name, args.description, {
    tags: Array.isArray(args.tags) ? (args.tags as string[]) : undefined,
    prompt: typeof args.prompt === 'string' ? args.prompt : undefined,
    keepStash: args.keepStash === true,
    includeContext: args.includeContext !== false,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleRestoreCheckpoint(
  manager: CheckpointManager,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.checkpointId !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing checkpointId');
  }

  const result = await manager.restore(args.checkpointId, {
    force: args.force === true,
    createBranch: args.createBranch === true,
    branchName: typeof args.branchName === 'string' ? args.branchName : undefined,
    restoreContext: args.restoreContext !== false,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleListCheckpoints(
  manager: CheckpointManager,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const result = await manager.list({
    branch: typeof args.branch === 'string' ? args.branch : undefined,
    tags: Array.isArray(args.tags) ? (args.tags as string[]) : undefined,
    limit: typeof args.limit === 'number' ? args.limit : undefined,
    includeMetadata: args.includeMetadata !== false,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleDeleteCheckpoint(
  manager: CheckpointManager,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.checkpointId !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing checkpointId');
  }

  const result = await manager.delete(args.checkpointId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleDiffCheckpoints(
  manager: CheckpointManager,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.checkpointIdA !== 'string' || typeof args.checkpointIdB !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing checkpoint IDs');
  }

  const result = await manager.diff(args.checkpointIdA, args.checkpointIdB);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleGetMetadata(
  manager: CheckpointManager,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (typeof args.checkpointId !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Missing checkpointId');
  }

  const checkpoint = await manager.getMetadata(args.checkpointId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: !!checkpoint, checkpoint }, null, 2),
      },
    ],
  };
}

async function handleGetStats(
  manager: CheckpointManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const stats = await manager.getStats();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
}

async function handleCleanup(
  manager: CheckpointManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const result = await manager.cleanup();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
