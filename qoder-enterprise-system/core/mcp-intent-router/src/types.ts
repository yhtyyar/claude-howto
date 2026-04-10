/**
 * Intent Router Types
 * Type definitions for the MCP Intent Router Server
 *
 * @module types
 * @version 1.0.0
 * @author CTO Architecture Team
 */

/**
 * Pattern matching types
 */
export type PatternType = 'exact' | 'regex' | 'semantic' | 'fuzzy';

/**
 * Pattern definition for intent matching
 */
export interface Pattern {
  /** Type of pattern matching to use */
  type: PatternType;
  /** Pattern value (string, regex, or semantic keywords) */
  value: string;
  /** Weight multiplier for this pattern (0.0 - 1.0) */
  weight: number;
  /** Optional intent ID for pattern */
  intentId?: string;
}

/**
 * Intent metadata
 */
export interface IntentMetadata {
  /** When the intent was created */
  created?: string;
  /** Last modified timestamp */
  modified?: string;
  /** Author of the intent */
  author?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Additional custom properties */
  [key: string]: unknown;
}

/**
 * Intent definition
 */
export interface Intent {
  /** Unique identifier for the intent */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this intent does */
  description: string;
  /** Category for grouping */
  category: string;
  /** Priority for routing (lower = higher priority) */
  priority: number;
  /** Path to the spec file */
  spec_path: string;
  /** Array of patterns for matching */
  patterns: Pattern[];
  /** Required context elements */
  context_requirements?: string[];
  /** Minimum confidence threshold (0.0 - 1.0) */
  confidence_threshold: number;
  /** Metadata */
  metadata?: IntentMetadata;
}

/**
 * Scored intent result
 */
export interface ScoredIntent {
  /** The matched intent */
  intent: Intent;
  /** Confidence score (0.0 - 1.0) */
  confidence: number;
  /** The pattern that matched */
  matchedPattern: Pattern;
  /** Alternative interpretations */
  alternatives?: ScoredIntent[];
}

/**
 * Routing result
 */
export interface RoutingResult {
  /** Matched intent */
  intent: Intent;
  /** Confidence score */
  confidence: number;
  /** Matched pattern */
  matchedPattern: Pattern;
  /** Top alternative intents */
  alternativeIntents: Intent[];
  /** Spec file content (if loaded) */
  specContent?: string;
  /** Error message if routing failed */
  error?: string;
  /** Routing timestamp */
  timestamp: number;
}

/**
 * Routing context
 */
export interface RoutingContext {
  /** Currently open file */
  currentFile?: string;
  /** Selected code snippet */
  selectedCode?: string;
  /** Project type (detected or configured) */
  projectType?: string;
  /** Previous intent in session */
  previousIntent?: string;
  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Path to specs directory */
  specsPath: string;
  /** Enable caching */
  cacheEnabled: boolean;
  /** Cache TTL in seconds */
  cacheTTL: number;
  /** Maximum cache size */
  cacheMaxSize: number;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Enable fallback suggestions */
  fallbackEnabled: boolean;
  /** Number of suggestions for fallback */
  fallbackSuggestions: number;
}

/**
 * Cache entry
 */
export interface CacheEntry {
  /** Cached result */
  result: RoutingResult;
  /** Timestamp when cached */
  timestamp: number;
  /** Access count for LRU */
  accessCount: number;
}

/**
 * Pattern match result
 */
export interface PatternMatchResult {
  /** Whether pattern matched */
  matched: boolean;
  /** Confidence score (0.0 - 1.0) */
  confidence: number;
  /** Matching details */
  details?: {
    matchedText?: string;
    matchIndex?: number;
    groups?: string[];
  };
}

/**
 * Spec file structure
 */
export interface SpecFile {
  /** Frontmatter metadata */
  frontmatter: {
    type: string;
    name?: string;
    version?: string;
    triggers?: string[];
    [key: string]: unknown;
  };
  /** Markdown content */
  content: string;
  /** File path */
  path: string;
  /** Last modified */
  modified: number;
}

/**
 * MCP Tool call result
 */
export interface ToolResult {
  /** Whether the call succeeded */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    executionTime?: number;
    cacheHit?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Intent detection options
 */
export interface DetectIntentOptions {
  /** Include spec content in result */
  includeSpec?: boolean;
  /** Override min confidence */
  minConfidence?: number;
  /** Maximum alternatives to return */
  maxAlternatives?: number;
  /** Enable fuzzy matching */
  enableFuzzy?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path to invalid field */
  path: string;
  /** Intent ID if applicable */
  intentId?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Path to field */
  path: string;
}

/**
 * Router statistics
 */
export interface RouterStats {
  /** Total routing requests */
  totalRequests: number;
  /** Successful routings */
  successfulRoutings: number;
  /** Failed routings */
  failedRoutings: number;
  /** Cache hits */
  cacheHits: number;
  /** Cache misses */
  cacheMisses: number;
  /** Average routing time (ms) */
  averageRoutingTime: number;
  /** Most used intents */
  topIntents: Array<{ id: string; count: number }>;
  /** Unmatched patterns (for analysis) */
  unmatchedInputs: string[];
}

/**
 * Log entry
 */
export interface LogEntry {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
  /** Source component */
  source?: string;
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  /** Supported pattern types */
  supportedPatternTypes: PatternType[];
  /** Maximum cache size */
  maxCacheSize: number;
  /** Supported features */
  features: string[];
  /** Version */
  version: string;
}
