/**
 * Checkpoint Manager Types
 * Type definitions for the MCP Checkpoint Manager Server
 *
 * @module types
 * @version 1.0.0
 */

/**
 * Checkpoint metadata
 */
export interface Checkpoint {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Git commit hash */
  gitCommit: string;
  /** Git branch name */
  gitBranch: string;
  /** Creation timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata: CheckpointMetadata;
  /** Tags for categorization */
  tags: string[];
}

/**
 * Checkpoint metadata details
 */
export interface CheckpointMetadata {
  /** Files tracked at checkpoint */
  files: string[];
  /** Original user prompt */
  prompt?: string;
  /** Context data */
  context?: Record<string, unknown>;
  /** Stash reference if used */
  stashRef?: string;
  /** User who created checkpoint */
  author?: string;
  /** Git status output */
  gitStatus?: string;
}

/**
 * Options for creating a checkpoint
 */
export interface CreateCheckpointOptions {
  /** Keep changes in stash */
  keepStash?: boolean;
  /** Include current context */
  includeContext?: boolean;
  /** User prompt to save */
  prompt?: string;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Tags to apply */
  tags?: string[];
}

/**
 * Options for restoring a checkpoint
 */
export interface RestoreCheckpointOptions {
  /** Force restore even with uncommitted changes */
  force?: boolean;
  /** Create new branch after restore */
  createBranch?: boolean;
  /** Branch name (if createBranch is true) */
  branchName?: string;
  /** Restore saved context */
  restoreContext?: boolean;
  /** Keep current stash */
  keepStash?: boolean;
}

/**
 * Options for listing checkpoints
 */
export interface ListCheckpointsOptions {
  /** Filter by branch */
  branch?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by date range */
  since?: number;
  until?: number;
  /** Limit results */
  limit?: number;
  /** Include metadata */
  includeMetadata?: boolean;
}

/**
 * Diff between two checkpoints
 */
export interface CheckpointDiff {
  /** Files changed */
  files: DiffFile[];
  /** Commit messages between checkpoints */
  commits: CommitInfo[];
  /** Statistics */
  stats: DiffStats;
}

/**
 * File in diff
 */
export interface DiffFile {
  /** File path */
  path: string;
  /** Change type */
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  /** Lines added */
  additions: number;
  /** Lines deleted */
  deletions: number;
  /** Old path (for renames) */
  oldPath?: string;
}

/**
 * Commit information
 */
export interface CommitInfo {
  /** Commit hash */
  hash: string;
  /** Short hash */
  shortHash: string;
  /** Commit message */
  message: string;
  /** Author */
  author: string;
  /** Date */
  date: string;
}

/**
 * Diff statistics
 */
export interface DiffStats {
  /** Files changed */
  filesChanged: number;
  /** Insertions */
  insertions: number;
  /** Deletions */
  deletions: number;
  /** Commits between */
  commits: number;
}

/**
 * Checkpoint filter
 */
export interface CheckpointFilter {
  /** Filter by name pattern */
  namePattern?: string;
  /** Filter by branch */
  branch?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by date range */
  since?: number;
  until?: number;
}

/**
 * Manager configuration
 */
export interface CheckpointManagerConfig {
  /** Prefix for checkpoint commits */
  commitPrefix: string;
  /** Metadata directory */
  metadataDir: string;
  /** Auto-commit enabled */
  autoCommit: boolean;
  /** Stash changes */
  stashChanges: boolean;
  /** Retention policy */
  retention: RetentionPolicy;
}

/**
 * Retention policy
 */
export interface RetentionPolicy {
  /** Enable automatic cleanup */
  enabled: boolean;
  /** Maximum age in days */
  maxAgeDays: number;
  /** Maximum number of checkpoints */
  maxCount: number;
  /** Auto-cleanup interval */
  cleanupInterval: number;
}

/**
 * Operation result
 */
export interface CheckpointResult {
  /** Success flag */
  success: boolean;
  /** Checkpoint data (if applicable) */
  checkpoint?: Checkpoint;
  /** Error message */
  error?: string;
  /** Operation metadata */
  metadata?: {
    executionTime: number;
    gitOperations: string[];
  };
}

/**
 * List result
 */
export interface CheckpointListResult {
  /** Checkpoints */
  checkpoints: Checkpoint[];
  /** Total count */
  total: number;
  /** Filter applied */
  filter?: CheckpointFilter;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  /** Checkpoints removed */
  removed: string[];
  /** Checkpoints kept */
  kept: number;
  /** Space freed (bytes) */
  spaceFreed: number;
}

/**
 * Git operation result
 */
export interface GitOperationResult {
  /** Success */
  success: boolean;
  /** Output */
  output: string;
  /** Error output */
  error?: string;
  /** Exit code */
  exitCode: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Valid flag */
  valid: boolean;
  /** Errors */
  errors: ValidationError[];
  /** Warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Field */
  field: string;
  /** Message */
  message: string;
  /** Code */
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Field */
  field: string;
  /** Message */
  message: string;
}

/**
 * Manager statistics
 */
export interface CheckpointStats {
  /** Total checkpoints */
  total: number;
  /** Checkpoints by branch */
  byBranch: Record<string, number>;
  /** Checkpoints by tag */
  byTag: Record<string, number>;
  /** Oldest checkpoint */
  oldest?: number;
  /** Newest checkpoint */
  newest?: number;
  /** Storage size (bytes) */
  storageSize: number;
}
