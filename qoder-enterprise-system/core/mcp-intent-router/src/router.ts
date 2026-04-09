/**
 * Intent Router Core
 * Main routing logic for intent detection and dispatch
 *
 * @module router
 * @version 1.0.0
 */

import { LRUCache } from 'lru-cache';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  Intent,
  RoutingResult,
  RoutingContext,
  RouterConfig,
  ScoredIntent,
  DetectIntentOptions,
  CacheEntry,
} from './types.js';
import { getConfigManager } from './config.js';
import { getPatternMatcher } from './pattern-matcher.js';

/**
 * Intent Router class
 */
export class IntentRouter {
  private config: RouterConfig;
  private intents: Map<string, Intent> = new Map();
  private cache: LRUCache<string, CacheEntry>;
  private patternMatcher = getPatternMatcher();
  private configManager = getConfigManager();

  constructor() {
    // Initialize with default config (will be overridden by load)
    this.config = {
      specsPath: './specs',
      cacheEnabled: true,
      cacheTTL: 300,
      cacheMaxSize: 1000,
      minConfidence: 0.8,
      fallbackEnabled: true,
      fallbackSuggestions: 3,
    };

    this.cache = new LRUCache({
      max: this.config.cacheMaxSize,
      ttl: this.config.cacheTTL * 1000,
      updateAgeOnGet: true,
    });
  }

  /**
   * Initialize the router with configuration
   */
  async initialize(): Promise<void> {
    // Load configuration
    this.config = await this.configManager.load();

    // Reinitialize cache with loaded config
    if (this.config.cacheEnabled) {
      this.cache = new LRUCache({
        max: this.config.cacheMaxSize,
        ttl: this.config.cacheTTL * 1000,
        updateAgeOnGet: true,
      });
    }

    // Load intents
    await this.loadIntents();

    console.log(
      `[IntentRouter] Initialized with ${this.intents.size} intents, ` +
        `cache: ${this.config.cacheEnabled ? 'enabled' : 'disabled'}`
    );
  }

  /**
   * Load intents from specs directory
   */
  async loadIntents(): Promise<void> {
    const intents = await this.configManager.loadIntents();

    this.intents.clear();
    for (const intent of intents) {
      this.intents.set(intent.id, intent);
    }

    console.log(`[IntentRouter] Loaded ${this.intents.size} intents`);
  }

  /**
   * Reload intents (for hot reload)
   */
  async reloadIntents(): Promise<void> {
    await this.loadIntents();
    this.cache.clear();
    console.log('[IntentRouter] Intents reloaded, cache cleared');
  }

  /**
   * Detect intent from user input
   */
  async detectIntent(
    input: string,
    context?: RoutingContext,
    options: DetectIntentOptions = {}
  ): Promise<RoutingResult> {
    const startTime = Date.now();

    try {
      // Preprocess input
      const processedInput = this.patternMatcher.preprocessInput(input);

      // Generate cache key
      const cacheKey = this.generateCacheKey(processedInput, context);

      // Check cache
      if (this.config.cacheEnabled && !options.includeSpec) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.configManager.recordCacheHit();
          this.configManager.recordRequest(true, Date.now() - startTime);
          return cached.result;
        }
      }

      this.configManager.recordCacheMiss();

      // Score all intents
      const scoredIntents = this.scoreIntents(processedInput, context);

      // Filter by confidence
      const minConfidence = options.minConfidence ?? this.config.minConfidence;
      const validIntents = scoredIntents.filter((si) => si.confidence >= minConfidence);

      // Get best match
      const bestMatch = validIntents[0];

      let result: RoutingResult;

      if (!bestMatch) {
        // No confident match found
        result = this.createFallbackResult(
          scoredIntents,
          processedInput,
          `No intent matched with confidence >= ${minConfidence}`
        );
      } else {
        // Load spec content if requested
        let specContent: string | undefined;
        if (options.includeSpec) {
          specContent = await this.loadSpecContent(bestMatch.intent.spec_path);
        }

        result = {
          intent: bestMatch.intent,
          confidence: bestMatch.confidence,
          matchedPattern: bestMatch.matchedPattern,
          alternativeIntents: validIntents
            .slice(1, (options.maxAlternatives ?? this.config.fallbackSuggestions) + 1)
            .map((si) => si.intent),
          specContent,
          timestamp: Date.now(),
        };
      }

      // Cache result
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, { result, timestamp: Date.now(), accessCount: 1 });
      }

      // Record success
      this.configManager.recordRequest(true, Date.now() - startTime);

      return result;
    } catch (error) {
      // Record failure
      this.configManager.recordRequest(false, Date.now() - startTime);

      return {
        intent: {} as Intent,
        confidence: 0,
        matchedPattern: { type: 'exact', value: '', weight: 0 },
        alternativeIntents: [],
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Score all intents against input
   */
  private scoreIntents(input: string, context?: RoutingContext): ScoredIntent[] {
    const scored: ScoredIntent[] = [];

    for (const intent of this.intents.values()) {
      const score = this.scoreIntent(intent, input, context);
      scored.push(score);
    }

    // Sort by confidence (descending)
    return scored.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Score a single intent
   */
  private scoreIntent(intent: Intent, input: string, context?: RoutingContext): ScoredIntent {
    let maxConfidence = 0;
    let bestPattern = intent.patterns[0];

    for (const pattern of intent.patterns) {
      const matchResult = this.patternMatcher.match(pattern, input);

      if (matchResult.matched) {
        let confidence = matchResult.confidence;

        // Apply context boosts if available
        if (context) {
          confidence = this.applyContextBoosts(confidence, pattern, intent, context);
        }

        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestPattern = pattern;
        }
      }
    }

    return {
      intent,
      confidence: maxConfidence,
      matchedPattern: bestPattern,
    };
  }

  /**
   * Apply context-based confidence boosts
   */
  private applyContextBoosts(
    confidence: number,
    pattern: Intent['patterns'][0],
    intent: Intent,
    context: RoutingContext
  ): number {
    let boostedConfidence = confidence;

    // Boost if current file extension matches intent category
    if (context.currentFile) {
      const ext = path.extname(context.currentFile).toLowerCase();
      const categoryBoosts: Record<string, string[]> = {
        quality: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java'],
        testing: ['.test.js', '.test.ts', '.spec.js', '.spec.ts'],
        documentation: ['.md', '.mdx', '.rst'],
      };

      const relevantExts = categoryBoosts[intent.category] || [];
      if (relevantExts.some((e) => ext.includes(e))) {
        boostedConfidence += 0.05;
      }
    }

    // Boost if code is selected (relevant for code-related intents)
    if (context.selectedCode && ['quality', 'refactoring'].includes(intent.category)) {
      boostedConfidence += 0.1;
    }

    // Boost if previous intent was related (context continuation)
    if (context.previousIntent) {
      const prevIntent = this.intents.get(context.previousIntent);
      if (prevIntent && prevIntent.category === intent.category) {
        boostedConfidence += 0.08;
      }
    }

    // Cap at 1.0
    return Math.min(boostedConfidence, 1.0);
  }

  /**
   * Create fallback result when no intent matches
   */
  private createFallbackResult(
    allScored: ScoredIntent[],
    input: string,
    reason: string
  ): RoutingResult {
    // Get top suggestions even if below threshold
    const suggestions = allScored.slice(0, this.config.fallbackSuggestions);

    // Record unmatched input for analysis
    this.configManager.recordUnmatched(input);

    return {
      intent: {} as Intent,
      confidence: 0,
      matchedPattern: { type: 'exact', value: '', weight: 0 },
      alternativeIntents: suggestions.map((s) => s.intent),
      error: `No matching intent found. ${reason}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Load spec content from file
   */
  private async loadSpecContent(specPath: string): Promise<string | undefined> {
    try {
      const fullPath = path.isAbsolute(specPath)
        ? specPath
        : path.join(this.config.specsPath, specPath);

      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.warn(`[IntentRouter] Failed to load spec from ${specPath}: ${error}`);
      return undefined;
    }
  }

  /**
   * Generate cache key from input and context
   */
  private generateCacheKey(input: string, context?: RoutingContext): string {
    // Normalize input for better cache hits
    const normalizedInput = input.toLowerCase().trim();

    // Include relevant context factors
    const contextFactors: string[] = [];
    if (context?.currentFile) {
      contextFactors.push(`file:${path.extname(context.currentFile)}`);
    }
    if (context?.previousIntent) {
      contextFactors.push(`prev:${context.previousIntent}`);
    }

    const contextHash = contextFactors.length > 0 ? `|${contextFactors.join(',')}` : '';

    return `${normalizedInput}${contextHash}`;
  }

  /**
   * List all available intents
   */
  listIntents(category?: string): Intent[] {
    const intents = Array.from(this.intents.values());

    if (category) {
      return intents.filter((i) => i.category === category);
    }

    return intents.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get a specific intent by ID
   */
  getIntent(id: string): Intent | undefined {
    return this.intents.get(id);
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      ...this.configManager.getStats(),
      cacheSize: this.cache.size,
      intentsLoaded: this.intents.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[IntentRouter] Cache cleared');
  }

  /**
   * Dispose router resources
   */
  dispose(): void {
    this.cache.clear();
    this.intents.clear();
  }
}

/** Singleton instance */
let routerInstance: IntentRouter | null = null;

/**
 * Get or create IntentRouter instance
 */
export function getRouter(): IntentRouter {
  if (!routerInstance) {
    routerInstance = new IntentRouter();
  }
  return routerInstance;
}

/**
 * Reset IntentRouter instance (for testing)
 */
export function resetRouter(): void {
  if (routerInstance) {
    routerInstance.dispose();
  }
  routerInstance = null;
}
