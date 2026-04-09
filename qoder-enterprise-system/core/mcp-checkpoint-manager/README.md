# MCP Checkpoint Manager

Git-based checkpoint management for Qoder IDE.

## Overview

The Checkpoint Manager provides Claude Code's checkpoint/rewind functionality for Qoder IDE using Git as the underlying storage mechanism.

## Features

- **Create Checkpoints**: Save project state with metadata
- **Restore Checkpoints**: Return to any previous state
- **Diff Checkpoints**: Compare different states
- **Automatic Cleanup**: Retention policy management
- **Context Preservation**: Save and restore conversation context

## Architecture

```
Checkpoint Manager
├── Git Operations (git.ts)
│   ├── execGit
│   ├── stashChanges
│   ├── createEmptyCommit
│   └── checkoutCommit
├── Checkpoint Manager (checkpoint-manager.ts)
│   ├── create()
│   ├── restore()
│   ├── list()
│   ├── diff()
│   └── cleanup()
└── MCP Server (server.ts)
    └── 8 tools for checkpoint management
```

## Checkpoint Format

Checkpoints are stored as:
1. **Git commits** with `[qoder-chk]` prefix
2. **JSON metadata** in `.qoder/checkpoints/`

### Commit Message Format

```
[qoder-chk] checkpoint-name

Description of the checkpoint

CHECKPOINT_ID: abc123xyz789
TAGS: refactoring, pre-merge
```

## MCP Tools

### `create_checkpoint`

Create a new checkpoint.

```json
{
  "name": "before-refactoring",
  "description": "State before major refactoring",
  "tags": ["refactoring", "backup"],
  "prompt": "Refactor the auth module"
}
```

### `restore_checkpoint`

Restore to a checkpoint.

```json
{
  "checkpointId": "abc123",
  "force": false,
  "createBranch": true,
  "branchName": "restore-attempt-1"
}
```

### `list_checkpoints`

List all checkpoints with filtering.

```json
{
  "branch": "main",
  "tags": ["refactoring"],
  "limit": 10
}
```

### `diff_checkpoints`

Compare two checkpoints.

```json
{
  "checkpointIdA": "abc123",
  "checkpointIdB": "def456"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QODER_GIT_AUTO_COMMIT` | Auto-create commits | `true` |
| `QODER_CHECKPOINT_PREFIX` | Commit message prefix | `[qoder-chk]` |
| `QODER_METADATA_DIR` | Metadata storage path | `.qoder/checkpoints` |

## Usage Example

```typescript
import { CheckpointManager } from '@qoder-enterprise/mcp-checkpoint-manager';

const manager = new CheckpointManager();
await manager.initialize();

// Create checkpoint
const result = await manager.create(
  'before-refactoring',
  'State before auth module refactoring',
  { tags: ['refactoring'], prompt: 'Current task context' }
);

// Later, restore it
await manager.restore(result.checkpoint!.id, {
  createBranch: true,
  branchName: 'restore-attempt'
});
```

## Testing

```bash
npm test
```

## License

MIT
