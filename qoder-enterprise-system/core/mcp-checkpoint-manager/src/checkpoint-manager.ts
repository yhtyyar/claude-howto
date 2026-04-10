/**
 * Checkpoint Manager
 * Core class for managing git-based checkpoints
 *
 * @module checkpoint-manager
 * @version 1.0.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  Checkpoint,
  CheckpointMetadata,
  CreateCheckpointOptions,
  RestoreCheckpointOptions,
  ListCheckpointsOptions,
  CheckpointDiff,
  CheckpointFilter,
  CheckpointManagerConfig,
  CheckpointResult,
  CheckpointListResult,
  CleanupResult,
  CheckpointStats,
} from './types.js';
import {
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

/**
 * Checkpoint Manager class
 */
export class CheckpointManager {
  private config: CheckpointManagerConfig;
  private repoRoot: string;
  private initialized: boolean = false;

  constructor(config?: Partial<CheckpointManagerConfig>) {
    this.config = {
      commitPrefix: '[qoder-chk]',
      metadataDir: '.qoder/checkpoints',
      autoCommit: true,
      stashChanges: true,
      retention: {
        enabled: true,
        maxAgeDays: 30,
        maxCount: 100,
        cleanupInterval: 86400, // 24 hours
      },
      ...config,
    };
    this.repoRoot = process.cwd();
  }

  /**
   * Initialize the manager
   */
  async initialize(cwd?: string): Promise<void> {
    if (cwd) {
      this.repoRoot = cwd;
    } else {
      this.repoRoot = await getRepositoryRoot();
    }

    // Check if git repository
    if (!(await isGitRepository(this.repoRoot))) {
      throw new Error('Not a git repository');
    }

    // Ensure metadata directory exists
    const metadataPath = this.getMetadataPath();
    await fs.mkdir(metadataPath, { recursive: true });

    this.initialized = true;

    // Run cleanup if needed
    if (this.config.retention.enabled) {
      await this.cleanup();
    }
  }

  /**
   * Create a new checkpoint
   */
  async create(
    name: string,
    description: string,
    options: CreateCheckpointOptions = {}
  ): Promise<CheckpointResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // Generate checkpoint ID
      const id = this.generateId();

      // Get current state
      const branch = await getCurrentBranch(this.repoRoot);
      const isClean = await isWorkingDirectoryClean(this.repoRoot);
      let stashRef: string | undefined;

      // Stash changes if needed
      if (!isClean && this.config.stashChanges) {
        stashRef = await stashChanges(
          `checkpoint-${id}-stash`,
          this.repoRoot
        );
      }

      // Create commit with metadata
      const commitMessage = this.buildCommitMessage(
        id,
        name,
        description,
        options.tags
      );
      const commitHash = await createEmptyCommit(
        commitMessage,
        this.repoRoot
      );

      // Prepare metadata
      const metadata: CheckpointMetadata = {
        files: await getTrackedFiles(this.repoRoot),
        prompt: options.prompt,
        context: options.context,
        stashRef,
        author: process.env.USER || process.env.USERNAME || 'unknown',
        gitStatus: await getGitStatus(this.repoRoot),
      };

      // Create checkpoint object
      const checkpoint: Checkpoint = {
        id,
        name,
        description,
        gitCommit: commitHash,
        gitBranch: branch,
        timestamp: Date.now(),
        metadata,
        tags: options.tags || [],
      };

      // Save metadata
      await this.saveMetadata(checkpoint);

      // Restore stash if not keeping
      if (stashRef && !options.keepStash) {
        await popStash(this.repoRoot);
      }

      return {
        success: true,
        checkpoint,
        metadata: {
          executionTime: Date.now() - startTime,
          gitOperations: ['stash', 'commit'],
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create checkpoint',
        metadata: {
          executionTime: Date.now() - startTime,
          gitOperations: [],
        },
      };
    }
  }

  /**
   * Restore checkpoint
   */
  async restore(
    checkpointId: string,
    options: RestoreCheckpointOptions = {}
  ): Promise<CheckpointResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // Load checkpoint
      const checkpoint = await this.loadMetadata(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      // Verify commit exists
      if (!(await commitExists(checkpoint.gitCommit, this.repoRoot))) {
        throw new Error(
          `Commit ${checkpoint.gitCommit} not found. Checkpoint may be corrupted.`
        );
      }

      // Check working directory
      if (!options.force && !(await isWorkingDirectoryClean(this.repoRoot))) {
        throw new Error(
          'Working directory not clean. Use force: true to override or stash changes first.'
        );
      }

      // Checkout commit
      await checkoutCommit(
        checkpoint.gitCommit,
        options.createBranch ? options.branchName : undefined,
        this.repoRoot
      );

      // Restore context if available
      if (options.restoreContext && checkpoint.metadata.context) {
        // Context is stored in metadata, can be used by caller
      }

      return {
        success: true,
        checkpoint,
        metadata: {
          executionTime: Date.now() - startTime,
          gitOperations: ['checkout'],
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to restore checkpoint',
        metadata: {
          executionTime: Date.now() - startTime,
          gitOperations: [],
        },
      };
    }
  }

  /**
   * List checkpoints
   */
  async list(options: ListCheckpointsOptions = {}): Promise<CheckpointListResult> {
    this.ensureInitialized();

    // Search for checkpoint commits
    const commits = await searchCommits(
      this.config.commitPrefix,
      this.repoRoot
    );

    const checkpoints: Checkpoint[] = [];

    for (const commit of commits) {
      // Try to load metadata
      const checkpointId = this.extractCheckpointId(commit.message);
      if (!checkpointId) {
        continue;
      }

      const checkpoint = await this.loadMetadata(checkpointId);
      if (!checkpoint) {
        // Create checkpoint from commit info only
        checkpoints.push({
          id: checkpointId,
          name: this.extractCheckpointName(commit.message) || 'unnamed',
          description: commit.message,
          gitCommit: commit.hash,
          gitBranch: 'unknown',
          timestamp: new Date(commit.date).getTime(),
          metadata: {
            files: [],
            author: commit.author,
          },
          tags: [],
        });
      } else {
        checkpoints.push(checkpoint);
      }
    }

    // Apply filters
    let filtered = checkpoints;

    if (options.branch) {
      filtered = filtered.filter((c) => c.gitBranch === options.branch);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((c) =>
        options.tags!.some((tag) => c.tags.includes(tag))
      );
    }

    if (options.since) {
      filtered = filtered.filter((c) => c.timestamp >= options.since!);
    }

    if (options.until) {
      filtered = filtered.filter((c) => c.timestamp <= options.until!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      checkpoints: filtered,
      total: filtered.length,
    };
  }

  /**
   * Delete checkpoint
   */
  async delete(checkpointId: string): Promise<CheckpointResult> {
    this.ensureInitialized();

    try {
      const checkpoint = await this.loadMetadata(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      // Delete metadata file
      const metadataPath = this.getCheckpointPath(checkpointId);
      await fs.unlink(metadataPath);

      return {
        success: true,
        checkpoint,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete checkpoint',
      };
    }
  }

  /**
   * Get checkpoint diff
   */
  async diff(
    checkpointIdA: string,
    checkpointIdB: string
  ): Promise<CheckpointDiff> {
    this.ensureInitialized();

    const checkpointA = await this.loadMetadata(checkpointIdA);
    const checkpointB = await this.loadMetadata(checkpointIdB);

    if (!checkpointA || !checkpointB) {
      throw new Error('One or both checkpoints not found');
    }

    // Get commits between
    const commits = await getCommitsBetween(
      checkpointA.gitCommit,
      checkpointB.gitCommit,
      this.repoRoot
    );

    // Get diff
    const diffOutput = await getDiff(
      checkpointA.gitCommit,
      checkpointB.gitCommit,
      this.repoRoot
    );

    // Parse diff stat
    const fileStats = parseDiffStat(diffOutput);

    return {
      files: fileStats.map((f) => ({
        path: f.path,
        changeType: 'modified',
        additions: f.additions,
        deletions: f.deletions,
      })),
      commits,
      stats: {
        filesChanged: fileStats.length,
        insertions: fileStats.reduce((sum, f) => sum + f.additions, 0),
        deletions: fileStats.reduce((sum, f) => sum + f.deletions, 0),
        commits: commits.length,
      },
    };
  }

  /**
   * Get checkpoint metadata
   */
  async getMetadata(checkpointId: string): Promise<Checkpoint | null> {
    this.ensureInitialized();
    return this.loadMetadata(checkpointId);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<CheckpointStats> {
    this.ensureInitialized();

    const all = await this.list();

    const byBranch: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    for (const checkpoint of all.checkpoints) {
      // Count by branch
      byBranch[checkpoint.gitBranch] = (byBranch[checkpoint.gitBranch] || 0) + 1;

      // Count by tag
      for (const tag of checkpoint.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
    }

    // Calculate storage size
    const metadataPath = this.getMetadataPath();
    let storageSize = 0;

    try {
      const files = await fs.readdir(metadataPath);
      for (const file of files) {
        const stat = await fs.stat(path.join(metadataPath, file));
        storageSize += stat.size;
      }
    } catch {
      // Ignore errors
    }

    return {
      total: all.checkpoints.length,
      byBranch,
      byTag,
      oldest: all.checkpoints[all.checkpoints.length - 1]?.timestamp,
      newest: all.checkpoints[0]?.timestamp,
      storageSize,
    };
  }

  /**
   * Cleanup old checkpoints
   */
  async cleanup(): Promise<CleanupResult> {
    this.ensureInitialized();

    if (!this.config.retention.enabled) {
      return { removed: [], kept: 0, spaceFreed: 0 };
    }

    const all = await this.list();
    const toRemove: string[] = [];
    let spaceFreed = 0;

    const now = Date.now();
    const maxAge = this.config.retention.maxAgeDays * 24 * 60 * 60 * 1000;

    for (const checkpoint of all.checkpoints) {
      let shouldRemove = false;

      // Check age
      if (now - checkpoint.timestamp > maxAge) {
        shouldRemove = true;
      }

      // Check count (remove oldest if over limit)
      if (all.checkpoints.indexOf(checkpoint) >= this.config.retention.maxCount) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        toRemove.push(checkpoint.id);

        // Calculate space
        try {
          const metadataPath = this.getCheckpointPath(checkpoint.id);
          const stat = await fs.stat(metadataPath);
          spaceFreed += stat.size;
        } catch {
          // Ignore errors
        }
      }
    }

    // Remove checkpoints
    for (const id of toRemove) {
      await this.delete(id);
    }

    return {
      removed: toRemove,
      kept: all.checkpoints.length - toRemove.length,
      spaceFreed,
    };
  }

  /**
   * Save checkpoint metadata to file
   */
  private async saveMetadata(checkpoint: Checkpoint): Promise<void> {
    const filePath = this.getCheckpointPath(checkpoint.id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2));
  }

  /**
   * Load checkpoint metadata from file
   */
  private async loadMetadata(checkpointId: string): Promise<Checkpoint | null> {
    try {
      const filePath = this.getCheckpointPath(checkpointId);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Checkpoint;
    } catch {
      return null;
    }
  }

  /**
   * Get metadata directory path
   */
  private getMetadataPath(): string {
    return path.join(this.repoRoot, this.config.metadataDir);
  }

  /**
   * Get checkpoint file path
   */
  private getCheckpointPath(checkpointId: string): string {
    return path.join(this.getMetadataPath(), `${checkpointId}.json`);
  }

  /**
   * Generate unique checkpoint ID
   */
  private generateId(): string {
    return randomUUID().replace(/-/g, '').substring(0, 12);
  }

  /**
   * Build commit message
   */
  private buildCommitMessage(
    id: string,
    name: string,
    description: string,
    tags?: string[]
  ): string {
    let message = `${this.config.commitPrefix} ${name}\n\n${description}\n\nCHECKPOINT_ID: ${id}`;

    if (tags && tags.length > 0) {
      message += `\nTAGS: ${tags.join(', ')}`;
    }

    return message;
  }

  /**
   * Extract checkpoint ID from commit message
   */
  private extractCheckpointId(message: string): string | null {
    const match = message.match(/CHECKPOINT_ID:\s*(\w+)/);
    return match ? (match[1] ?? null) : null;
  }

  /**
   * Extract checkpoint name from commit message
   */
  private extractCheckpointName(message: string): string | null {
    const lines = message.split('\n');
    for (const line of lines) {
      const match = line.match(/\[qoder-chk\]\s*(.+)/);
      if (match) {
        return (match[1] ?? '').trim();
      }
    }
    return null;
  }

  /**
   * Ensure manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CheckpointManager not initialized. Call initialize() first.');
    }
  }
}

/** Singleton instance */
let managerInstance: CheckpointManager | null = null;

/**
 * Get or create CheckpointManager instance
 */
export function getCheckpointManager(
  config?: Partial<CheckpointManagerConfig>
): CheckpointManager {
  if (!managerInstance) {
    managerInstance = new CheckpointManager(config);
  }
  return managerInstance;
}

/**
 * Reset CheckpointManager instance (for testing)
 */
export function resetCheckpointManager(): void {
  managerInstance = null;
}
