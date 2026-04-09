/**
 * Test Setup
 * Configuration and utilities for tests
 *
 * @module test-setup
 * @version 1.0.0
 */

import { jest } from '@jest/globals';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
  // Suppress log and info
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Environment validation
const requiredEnvVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    waitFor: (ms: number) => Promise<void>;
    retry: <T>(fn: () => Promise<T>, maxAttempts?: number, delay?: number) => Promise<T>;
    createTempDir: () => Promise<string>;
  };
}

global.testUtils = {
  waitFor: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  
  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxAttempts) {
          await global.testUtils.waitFor(delay);
        }
      }
    }
    
    throw lastError;
  },
  
  createTempDir: async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    
    return mkdtemp(join(tmpdir(), 'qoder-test-'));
  },
};

// Cleanup after all tests
afterAll(async () => {
  // Add any global cleanup here
});
