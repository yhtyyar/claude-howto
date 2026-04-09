/**
 * MCP Checkpoint Manager
 * Main entry point for the checkpoint management module
 *
 * @packageDocumentation
 * @module index
 * @version 1.0.0
 */

export {
  CheckpointManager,
  getCheckpointManager,
  resetCheckpointManager,
} from './checkpoint-manager.js';

export {
  execGit,
  isGitRepository,
  getCurrentBranch,
  getHeadCommit,
  isWorkingDirectoryClean,
  getGitStatus,
  getTrackedFiles,
  stashChanges,
  popStash,
  createEmptyCommit,
  checkoutCommit,
  getCommitsBetween,
  getDiff,
  parseDiffStat,
  searchCommits,
  getRepositoryRoot,
  commitExists,
  getCommitMessage,
} from './git.js';

export type {
  Checkpoint,
  CheckpointMetadata,
  CreateCheckpointOptions,
  RestoreCheckpointOptions,
  ListCheckpointsOptions,
  CheckpointDiff,
  DiffFile,
  CommitInfo,
  DiffStats,
  CheckpointFilter,
  CheckpointManagerConfig,
  RetentionPolicy,
  CheckpointResult,
  CheckpointListResult,
  CleanupResult,
  CheckpointStats,
  GitOperationResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types.js';

/**
 * Library version
 */
export const VERSION = '1.0.0';

/**
 * Library name
 */
export const NAME = '@qoder-enterprise/mcp-checkpoint-manager';
