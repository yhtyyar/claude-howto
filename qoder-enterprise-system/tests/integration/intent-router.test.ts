/**
 * Intent Router Integration Tests
 * End-to-end tests for MCP Intent Router
 *
 * @module integration/intent-router
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

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

describe('MCP Intent Router Integration', () => {
  let serverProcess: ChildProcess;
  let requestId = 0;
  const pendingRequests = new Map<number, (response: MCPResponse) => void>();

  beforeAll(async () => {
    // Build the server first
    const buildResult = await new Promise<{ success: boolean; output: string }>((resolve) => {
      const proc = spawn('npm', ['run', 'build'], {
        cwd: path.join(__dirname, '../../core/mcp-intent-router'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data.toString(); });
      proc.stderr?.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({ success: code === 0, output: stdout + stderr });
      });
    });

    if (!buildResult.success) {
      console.log('Build output:', buildResult.output);
    }

    // Start MCP server
    serverProcess = spawn('node', ['dist/server.js'], {
      cwd: path.join(__dirname, '../../core/mcp-intent-router'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        QODER_SPECS_PATH: path.join(__dirname, '../../specs'),
        QODER_CACHE_ENABLED: 'true',
        QODER_CACHE_TTL: '300',
      },
    });

    // Handle responses
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
            // Ignore non-JSON output
          }
        }
      }
    });

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(() => {
    serverProcess?.kill();
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
      expect(response.result).toBeDefined();
      
      const tools = (response.result as { tools: Array<{ name: string }> }).tools;
      const toolNames = tools.map((t) => t.name);
      
      expect(toolNames).toContain('detect_intent');
      expect(toolNames).toContain('list_intents');
      expect(toolNames).toContain('get_intent');
      expect(toolNames).toContain('reload_intents');
      expect(toolNames).toContain('get_stats');
    });
  });

  describe('Intent Detection', () => {
    it('should detect code-review intent', async () => {
      const response = await sendRequest('tools/call', {
        name: 'detect_intent',
        arguments: {
          input: 'check this code for bugs',
          context: {},
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.intent).toBeDefined();
      expect(data.intent.id).toBe('code-review');
      expect(data.confidence).toBeGreaterThan(0.7);
    });

    it('should detect checkpoint intent', async () => {
      const response = await sendRequest('tools/call', {
        name: 'detect_intent',
        arguments: {
          input: 'create checkpoint before changes',
          context: {},
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.intent?.id).toBe('checkpoint');
    });

    it('should handle unknown input gracefully', async () => {
      const response = await sendRequest('tools/call', {
        name: 'detect_intent',
        arguments: {
          input: 'random gibberish xyz123',
          context: {},
          options: {
            minConfidence: 0.9,
          },
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.intent).toBeNull();
    });

    it('should use context for boosting', async () => {
      const response = await sendRequest('tools/call', {
        name: 'detect_intent',
        arguments: {
          input: 'analyze code',
          context: {
            currentFile: '/test/file.test.ts',
            selection: 'test code',
          },
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Intent Management', () => {
    it('should list all intents', async () => {
      const response = await sendRequest('tools/call', {
        name: 'list_intents',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.intents).toBeInstanceOf(Array);
      expect(data.intents.length).toBeGreaterThan(0);
      expect(data.total).toBeGreaterThan(0);
    });

    it('should get specific intent details', async () => {
      const response = await sendRequest('tools/call', {
        name: 'get_intent',
        arguments: {
          intentId: 'code-review',
        },
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.intent).toBeDefined();
      expect(data.intent.id).toBe('code-review');
      expect(data.intent.name).toBe('Code Review');
      expect(data.intent.patterns).toBeInstanceOf(Array);
    });

    it('should reload intents without errors', async () => {
      const response = await sendRequest('tools/call', {
        name: 'reload_intents',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });
  });

  describe('Statistics & Monitoring', () => {
    it('should return server statistics', async () => {
      // Make some requests to generate stats
      await sendRequest('tools/call', {
        name: 'detect_intent',
        arguments: { input: 'review code', context: {} },
      });

      const response = await sendRequest('tools/call', {
        name: 'get_stats',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats.totalRequests).toBeGreaterThanOrEqual(1);
      expect(data.stats.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache successfully', async () => {
      const response = await sendRequest('tools/call', {
        name: 'clear_cache',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool name', async () => {
      const response = await sendRequest('tools/call', {
        name: 'nonexistent_tool',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should handle missing required parameters', async () => {
      const response = await sendRequest('tools/call', {
        name: 'detect_intent',
        arguments: {},
      });

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const data = JSON.parse(result.content[0].text);

      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});
