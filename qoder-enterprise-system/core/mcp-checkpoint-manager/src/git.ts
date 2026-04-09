/**
 * Git Operations Module
 * Handles all git-related operations for checkpoint management
 *
 * @module git
 * @version 1.0.0
 */

import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitOperationResult, CommitInfo } from './types.js';

/**
 * Execute git command
 */
export async function execGit(
  args: string[],
  cwd?: string
): Promise<GitOperationResult> {
  return new Promise((resolve) => {
    const git = spawn('git', args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    git.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    git.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    git.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
        exitCode: code ?? -1,
      });
    });

    git.on('error', (error) => {
      resolve({
        success: false,
        output: stdout.trim(),
        error: error.message,
        exitCode: -1,
      });
    });
  });
}

/**
 * Check if directory is a git repository
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  const result = await execGit(['rev-parse', '--git-dir'], cwd);
  return result.success;
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  const result = await execGit(['branch', '--show-current'], cwd);
  if (!result.success) {
    throw new Error(`Failed to get current branch: ${result.error}`);
  }
  return result.output;
}

/**
 * Get HEAD commit hash
 */
export async function getHeadCommit(cwd?: string): Promise<string> {
  const result = await execGit(['rev-parse', 'HEAD'], cwd);
  if (!result.success) {
    throw new Error(`Failed to get HEAD commit: ${result.error}`);
  }
  return result.output;
}

/**
 * Check if working directory is clean
 */
export async function isWorkingDirectoryClean(cwd?: string): Promise<boolean> {
  const result = await execGit(['status', '--porcelain'], cwd);
  return result.success && result.output === '';
}

/**
 * Get git status
 */
export async function getGitStatus(cwd?: string): Promise<string> {
  const result = await execGit(['status', '--short'], cwd);
  return result.output;
}

/**
 * Get list of tracked files
 */
export async function getTrackedFiles(cwd?: string): Promise<string[]> {
  const result = await execGit(['ls-files'], cwd);
  if (!result.success) {
    return [];
  }
  return result.output.split('\n').filter(Boolean);
}

/**
 * Stash changes
 */
export async function stashChanges(
  message?: string,
  cwd?: string
): Promise<string> {
  const args = ['stash', 'push'];
  if (message) {
    args.push('-m', message);
  }

  const result = await execGit(args, cwd);
  if (!result.success) {
    throw new Error(`Failed to stash changes: ${result.error}`);
  }

  // Get stash ref
  const stashResult = await execGit(['stash', 'list'], cwd);
  const lines = stashResult.output.split('\n');
  if (lines.length > 0 && lines[0]) {
    const match = lines[0].match(/^(stash@\{\d+\})/);
    if (match) {
      return match[1];
    }
  }

  return '';
}

/**
 * Pop stash
 */
export async function popStash(cwd?: string): Promise<void> {
  const result = await execGit(['stash', 'pop'], cwd);
  if (!result.success) {
    throw new Error(`Failed to pop stash: ${result.error}`);
  }
}

/**
 * Create empty commit
 */
export async function createEmptyCommit(
  message: string,
  cwd?: string
): Promise<string> {
  const result = await execGit(
    ['commit', '--allow-empty', '-m', message],
    cwd
  );
  if (!result.success) {
    throw new Error(`Failed to create commit: ${result.error}`);
  }

  // Return new commit hash
  return getHeadCommit(cwd);
}

/**
 * Checkout commit
 */
export async function checkoutCommit(
  commitHash: string,
  createBranch?: string,
  cwd?: string
): Promise<void> {
  const args = ['checkout'];

  if (createBranch) {
    args.push('-b', createBranch);
  }

  args.push(commitHash);

  const result = await execGit(args, cwd);
  if (!result.success) {
    throw new Error(`Failed to checkout ${commitHash}: ${result.error}`);
  }
}

/**
 * Get commits between two commits
 */
export async function getCommitsBetween(
  fromCommit: string,
  toCommit: string,
  cwd?: string
): Promise<CommitInfo[]> {
  const format = '%H|%h|%s|%an|%ai';
  const result = await execGit(
    ['log', '--format=' + format, `${fromCommit}..${toCommit}`],
    cwd
  );

  if (!result.success) {
    return [];
  }

  return result.output.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('|');
    return {
      hash: parts[0] || '',
      shortHash: parts[1] || '',
      message: parts[2] || '',
      author: parts[3] || '',
      date: parts[4] || '',
    };
  });
}

/**
 * Get diff between two commits
 */
export async function getDiff(
  fromCommit: string,
  toCommit: string,
  cwd?: string
): Promise<string> {
  const result = await execGit(
    ['diff', '--stat', fromCommit, toCommit],
    cwd
  );
  return result.output;
}

/**
 * Parse diff stat output
 */
export function parseDiffStat(diffOutput: string): Array<{
  path: string;
  additions: number;
  deletions: number;
}> {
  const files: Array<{ path: string; additions: number; deletions: number }> =
    [];

  for (const line of diffOutput.split('\n')) {
    // Match lines like: "src/file.ts | 10 +++++-----"
    const match = line.match(
      /^\s*(.+?)\s*\|\s*(\d+)\s*([+-]*)([+-]*)$/
    );
    if (match) {
      const path = match[1].trim();
      const changes = parseInt(match[2], 10);
      const additions = (match[3] || '').length;
      const deletions = (match[4] || '').length;

      files.push({
        path,
        additions,
        deletions,
      });
    }
  }

  return files;
}

/**
 * Search commits by message pattern
 */
export async function searchCommits(
  pattern: string,
  cwd?: string
): Promise<CommitInfo[]> {
  const format = '%H|%h|%s|%an|%ai';
  const result = await execGit(
    ['log', '--all', '--grep', pattern, '--format=' + format],
    cwd
  );

  if (!result.success) {
    return [];
  }

  return result.output.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('|');
    return {
      hash: parts[0] || '',
      shortHash: parts[1] || '',
      message: parts[2] || '',
      author: parts[3] || '',
      date: parts[4] || '',
    };
  });
}

/**
 * Get repository root
 */
export async function getRepositoryRoot(cwd?: string): Promise<string> {
  const result = await execGit(['rev-parse', '--show-toplevel'], cwd);
  if (!result.success) {
    throw new Error(`Failed to get repository root: ${result.error}`);
  }
  return result.output;
}

/**
 * Check if commit exists
 */
export async function commitExists(
  commitHash: string,
  cwd?: string
): Promise<boolean> {
  const result = await execGit(
    ['cat-file', '-t', commitHash],
    cwd
  );
  return result.success && result.output === 'commit';
}

/**
 * Get commit message
 */
export async function getCommitMessage(
  commitHash: string,
  cwd?: string
): Promise<string> {
  const result = await execGit(
    ['log', '-1', '--format=%B', commitHash],
    cwd
  );
  if (!result.success) {
    throw new Error(`Failed to get commit message: ${result.error}`);
  }
  return result.output;
}
