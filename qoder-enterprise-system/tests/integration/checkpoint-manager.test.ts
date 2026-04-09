/**
 * Checkpoint Manager Integration Tests
 * End-to-end tests for MCP Checkpoint Manager
 *
 * @module integration/checkpoint-manager
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

describe('MCP Checkpoint Manager Integration', () => {
  let serverProcess: ChildProcess;
  let requestId = 0;
  let testRepoPath: string;
  const pendingRequests = new Map<number, (response: MCPResponse) => void>();

  beforeAll(async () => {
    // Create test repository
    testRepoPath = await fs.mkdtemp(path.join(os.tmpdir(), 'checkpoint-test-'));
    
    // Initialize git repo
    execSync('git init', { cwd: testRepoPath });
    execSync('git config user.email "test@test.com"', { cwd: testRepoPath });
    execSync('git config user.name "Test User"', { cwd: testRepoPath });
    
    // Create initial commit
    await fs.writeFile(path.join(testRepoPath, 'README.md'), '# Test Repo');
    execSync('git add .', { cwd: testRepoPath });
    execSync('git commit -m "Initial commit"', { cwd: testRepoPath });

    // Build server
    const buildResult = await new Promise<{ success: boolean }>((resolve) => {
      const proc = spawn('npm', ['run', 'build'], {
        cwd: path.join(__dirname, '../../core/mcp-checkpoint-manager'),
        stdio: 'pipe',
      });

      proc.on('close', (code) => {
        resolve({ success: code === 0 });
      });
    });

    expect(buildResult.success).toBe(true);

    // Start server with test repo
    serverProcess = spawn('node', ['dist/server.js'], {
      cwd: path.join(__dirname, '../../core/mcp-checkpoint-manager'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        QODER_CHECKPOINT_PREFIX: '[test-chk]',
      },
    });

    serverProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line) as MCPResponse;
            const resolver = pendingRequests.get(response.id);
            if (resolver) {
              resolver(response);
              pendingRequests.delete(response.id);
            }
          } catch {
            // Ignore non-JSON
          }
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    serverProcess?.kill();
    
    // Cleanup test repo
    await fs.rm(testRepoPath, { recursive: true, force: true });
  });

  beforeEach(() => {
    requestId = 0;
    pendingRequests.clear();
  });

  function sendRequest(method: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return new Promise((resolve) => {
      requestId++;
      pendingRequests.set(requestId, resolve);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      };

      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  describe('Server Initialization', () => {
    it('should list available tools', async () => {
      const response = await sendRequest('tools/list');
      
      expect(response.error).toBeUndefined();
      
      const tools = (response.result as { tools: Array<{ name: string }> }).tools;
      const toolNames = tools.map((t) => t.name);
      
      expect(toolNames).toContain('create_checkpoint');
      expect(toolNames).toContain('restore_checkpoint');
      expect(toolNames).toContain('list_checkpoints');
      expect(toolNames).toContain('delete_checkpoint');
      expect(toolNames).toContain('diff_checkpoints');
      expect(toolNames).toContain('get_checkpoint_metadata');
      expect(toolNames).toContain('get_stats');
      expect(toolNames).toContain('cleanup');
    });
  });

  describe('Checkpoint Lifecycle', () => {
    let checkpointId: string;

    it('should create a checkpoint', async () => {
      // Add a file to commit
      await fs.writeFile(
        path.join(testRepoPath, 'test-file.txt'),
        'test content'
      );

      const response = await sendRequest('tools/call', {
        name: 'create_checkpoint',
        arguments: {
          name: 'test-checkpoint',
          description: 'Test checkpoint for integration tests',
          tags: ['test', 'integration'],
          keepStash: false,
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.checkpoint).toBeDefined();
      expect(data.checkpoint.name).toBe('test-checkpoint');
      expect(data.checkpoint.tags).toContain('test');
      
      checkpointId = data.checkpoint.id;
    });

    it('should list checkpoints', async () => {
      const response = await sendRequest('tools/call', {
        name: 'list_checkpoints',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.checkpoints).toBeInstanceOf(Array);
      expect(data.checkpoints.length).toBeGreaterThan(0);
      expect(data.total).toBeGreaterThan(0);
    });

    it('should get checkpoint metadata', async () => {
      const response = await sendRequest('tools/call', {
        name: 'get_checkpoint_metadata',
        arguments: {
          checkpointId,
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.checkpoint).toBeDefined();
      expect(data.checkpoint.id).toBe(checkpointId);
      expect(data.checkpoint.name).toBe('test-checkpoint');
    });

    it('should get checkpoint statistics', async () => {
      const response = await sendRequest('tools/call', {
        name: 'get_stats',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.byBranch).toBeDefined();
      expect(data.storageSize).toBeGreaterThanOrEqual(0);
    });

    it('should restore checkpoint', async () => {
      const response = await sendRequest('tools/call', {
        name: 'restore_checkpoint',
        arguments: {
          checkpointId,
          force: true,
          restoreContext: true,
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.checkpoint.id).toBe(checkpointId);
    });

    it('should delete checkpoint', async () => {
      const response = await sendRequest('tools/call', {
        name: 'delete_checkpoint',
        arguments: {
          checkpointId,
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.checkpoint.id).toBe(checkpointId);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent checkpoint', async () => {
      const response = await sendRequest('tools/call', {
        name: 'get_checkpoint_metadata',
        arguments: {
          checkpointId: 'non-existent-id',
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(false);
    });

    it('should handle missing checkpoint name', async () => {
      const response = await sendRequest('tools/call', {
        name: 'create_checkpoint',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(false);
      expect(data.error).toContain('name');
    });
  });
});
