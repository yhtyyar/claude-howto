/**
 * MCP Intent Router
 * Main entry point for the intent routing module
 *
 * @packageDocumentation
 * @module index
 * @version 1.0.0
 */

export { IntentRouter, getRouter, resetRouter } from './router.js';
export { ConfigManager, getConfigManager, resetConfigManager } from './config.js';
export { PatternMatcher, getPatternMatcher, resetPatternMatcher } from './pattern-matcher.js';

export type {
  Intent,
  IntentMetadata,
  Pattern,
  PatternType,
  PatternMatchResult,
  RoutingResult,
  RoutingContext,
  RouterConfig,
  ScoredIntent,
  DetectIntentOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  RouterStats,
  ServerCapabilities,
  SpecFile,
  ToolResult,
  CacheEntry,
} from './types.js';

/**
 * Library version
 */
export const VERSION = '1.0.0';

/**
 * Library name
 */
export const NAME = '@qoder-enterprise/mcp-intent-router';
