/**
 * Configuration Module
 * Handles loading and validation of router configuration
 *
 * @module config
 * @version 1.0.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import type { RouterConfig, Intent, RouterStats } from './types.js';

/** Default configuration values */
const DEFAULT_CONFIG: RouterConfig = {
  specsPath: './specs',
  cacheEnabled: true,
  cacheTTL: 300,
  cacheMaxSize: 1000,
  minConfidence: 0.8,
  fallbackEnabled: true,
  fallbackSuggestions: 3,
};

/** Configuration schema for validation */
const ConfigSchema = z.object({
  specsPath: z.string().min(1),
  cacheEnabled: z.boolean(),
  cacheTTL: z.number().int().min(1).max(3600),
  cacheMaxSize: z.number().int().min(1).max(10000),
  minConfidence: z.number().min(0).max(1),
  fallbackEnabled: z.boolean(),
  fallbackSuggestions: z.number().int().min(1).max(10),
});

/** Intent schema for validation */
const IntentSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priority: z.number().int().min(0),
  spec_path: z.string().min(1),
  patterns: z.array(
    z.object({
      type: z.enum(['exact', 'regex', 'semantic', 'fuzzy']),
      value: z.string().min(1),
      weight: z.number().min(0).max(1),
    })
  ).min(1),
  context_requirements: z.array(z.string()).optional(),
  confidence_threshold: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Configuration manager class
 */
export class ConfigManager {
  private config: RouterConfig;
  private configPath: string;
  private stats: RouterStats;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.configPath = '';
    this.stats = this.initializeStats();
  }

  /**
   * Initialize default stats
   */
  private initializeStats(): RouterStats {
    return {
      totalRequests: 0,
      successfulRoutings: 0,
      failedRoutings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageRoutingTime: 0,
      topIntents: [],
      unmatchedInputs: [],
    };
  }

  /**
   * Load configuration from environment and files
   */
  async load(): Promise<RouterConfig> {
    try {
      // 1. Start with defaults
      let config: Partial<RouterConfig> = { ...DEFAULT_CONFIG };

      // 2. Load from environment variables
      config = this.loadFromEnvironment(config);

      // 3. Load from config file if exists
      const configFile = await this.findConfigFile();
      if (configFile) {
        this.configPath = configFile;
        const fileConfig = await this.loadFromFile(configFile);
        config = { ...config, ...fileConfig };
      }

      // 4. Validate final config
      this.config = this.validateConfig(config as RouterConfig);

      return this.config;
    } catch (error) {
      throw new Error(
        `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(config: Partial<RouterConfig>): Partial<RouterConfig> {
    const env = process.env;

    if (env.QODER_SPECS_PATH) {
      config.specsPath = env.QODER_SPECS_PATH;
    }
    if (env.QODER_CACHE_ENABLED !== undefined) {
      config.cacheEnabled = env.QODER_CACHE_ENABLED === 'true';
    }
    if (env.QODER_CACHE_TTL) {
      config.cacheTTL = parseInt(env.QODER_CACHE_TTL, 10);
    }
    if (env.QODER_CACHE_MAX_SIZE) {
      config.cacheMaxSize = parseInt(env.QODER_CACHE_MAX_SIZE, 10);
    }
    if (env.QODER_MIN_CONFIDENCE) {
      config.minConfidence = parseFloat(env.QODER_MIN_CONFIDENCE);
    }
    if (env.QODER_FALLBACK_ENABLED !== undefined) {
      config.fallbackEnabled = env.QODER_FALLBACK_ENABLED === 'true';
    }
    if (env.QODER_FALLBACK_SUGGESTIONS) {
      config.fallbackSuggestions = parseInt(env.QODER_FALLBACK_SUGGESTIONS, 10);
    }

    return config;
  }

  /**
   * Find configuration file
   */
  private async findConfigFile(): Promise<string | null> {
    const possiblePaths = [
      './config/qoder.yaml',
      './config/qoder.yml',
      './config/intents.yaml',
      './config/intents.yml',
      './.qoder/config.yaml',
      './.qoder/intents.yaml',
      './qoder.yaml',
    ];

    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Load configuration from YAML file
   */
  private async loadFromFile(configPath: string): Promise<Partial<RouterConfig>> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = yaml.load(content) as Record<string, unknown>;

      // Extract router-specific config
      if (parsed.intent_router || parsed.intentRouter) {
        const routerConfig = (parsed.intent_router || parsed.intentRouter) as Record<
          string,
          unknown
        >;
        return this.extractRouterConfig(routerConfig);
      }

      return {};
    } catch (error) {
      throw new Error(
        `Failed to parse config file ${configPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Extract router configuration from parsed YAML
   */
  private extractRouterConfig(routerConfig: Record<string, unknown>): Partial<RouterConfig> {
    const config: Partial<RouterConfig> = {};

    if (routerConfig.matching && typeof routerConfig.matching === 'object') {
      const matching = routerConfig.matching as Record<string, unknown>;
      if (typeof matching.confidence_threshold === 'number') {
        config.minConfidence = matching.confidence_threshold;
      }
    }

    if (routerConfig.cache && typeof routerConfig.cache === 'object') {
      const cache = routerConfig.cache as Record<string, unknown>;
      if (typeof cache.enabled === 'boolean') {
        config.cacheEnabled = cache.enabled;
      }
      if (typeof cache.ttl === 'number') {
        config.cacheTTL = cache.ttl;
      }
      if (typeof cache.max_size === 'number') {
        config.cacheMaxSize = cache.max_size;
      }
    }

    if (routerConfig.fallback && typeof routerConfig.fallback === 'object') {
      const fallback = routerConfig.fallback as Record<string, unknown>;
      if (typeof fallback.enabled === 'boolean') {
        config.fallbackEnabled = fallback.enabled;
      }
      if (typeof fallback.suggest_top_n === 'number') {
        config.fallbackSuggestions = fallback.suggest_top_n;
      }
    }

    return config;
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: RouterConfig): RouterConfig {
    try {
      return ConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new Error(`Configuration validation failed: ${issues}`);
      }
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }

  /**
   * Load intents from specs directory
   */
  async loadIntents(): Promise<Intent[]> {
    const intents: Intent[] = [];
    const specsPath = path.resolve(this.config.specsPath);

    try {
      // Check if specs directory exists
      try {
        await fs.access(specsPath);
      } catch {
        console.warn(`Specs directory not found: ${specsPath}`);
        return intents;
      }

      // Find all YAML files in specs directory
      const files = await this.findSpecFiles(specsPath);

      for (const file of files) {
        try {
          const intent = await this.loadIntentFromFile(file);
          if (intent) {
            intents.push(intent);
          }
        } catch (error) {
          console.warn(`Failed to load intent from ${file}: ${error}`);
        }
      }

      return intents.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      throw new Error(
        `Failed to load intents: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find all spec files recursively
   */
  private async findSpecFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip special directories
          if (entry.name.startsWith('_') || entry.name === 'node_modules') {
            continue;
          }
          const subFiles = await this.findSpecFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}: ${error}`);
    }

    return files;
  }

  /**
   * Load intent from YAML file
   */
  private async loadIntentFromFile(filePath: string): Promise<Intent | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.load(content) as Record<string, unknown>;

      // Check if this is an intents config file
      if (parsed.intents && Array.isArray(parsed.intents)) {
        // This is a config file with multiple intents
        const validated = parsed.intents
          .map((intent: unknown) => this.validateIntent(intent))
          .filter((intent): intent is Intent => intent !== null);
        return null; // Config files don't return single intent
      }

      // Check if this is a single intent
      if (parsed.id && parsed.patterns) {
        return this.validateIntent(parsed);
      }

      return null;
    } catch (error) {
      console.warn(`Failed to parse ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Validate a single intent
   */
  private validateIntent(data: unknown): Intent | null {
    try {
      return IntentSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        console.warn(`Intent validation failed: ${issues}`);
      }
      return null;
    }
  }

  /**
   * Get router statistics
   */
  getStats(): RouterStats {
    return { ...this.stats };
  }

  /**
   * Update statistics
   */
  updateStats(update: Partial<RouterStats>): void {
    this.stats = { ...this.stats, ...update };
  }

  /**
   * Record routing request
   */
  recordRequest(success: boolean, executionTime: number): void {
    this.stats.totalRequests++;
    if (success) {
      this.stats.successfulRoutings++;
    } else {
      this.stats.failedRoutings++;
    }

    // Update average routing time
    const totalTime = this.stats.averageRoutingTime * (this.stats.totalRequests - 1) + executionTime;
    this.stats.averageRoutingTime = totalTime / this.stats.totalRequests;
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.stats.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.stats.cacheMisses++;
  }

  /**
   * Record unmatched input
   */
  recordUnmatched(input: string): void {
    // Keep only last 100 unmatched inputs
    this.stats.unmatchedInputs.push(input);
    if (this.stats.unmatchedInputs.length > 100) {
      this.stats.unmatchedInputs.shift();
    }
  }
}

/** Singleton instance */
let configManagerInstance: ConfigManager | null = null;

/**
 * Get or create ConfigManager instance
 */
export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}

/**
 * Reset ConfigManager instance (for testing)
 */
export function resetConfigManager(): void {
  configManagerInstance = null;
}
