/**
 * NLP Service Client
 * HTTP client for Python NLP microservice
 *
 * @module nlp-client
 * @version 1.0.0
 */

import type { Pattern, RoutingContext } from './types.js';

/**
 * NLP match result from Python service
 */
export interface NLPMatchResult {
  best_match: string | null;
  confidence: number;
  all_scores: Record<string, number>;
  pattern_matches: Array<{
    pattern_type: string;
    pattern_value: string;
    confidence: number;
    matched: boolean;
  }>;
  processing_time_ms: number;
}

/**
 * NLP Service configuration
 */
interface NLPClientConfig {
  baseUrl: string;
  timeout: number;
  enabled: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: NLPClientConfig = {
  baseUrl: process.env.NLP_SERVICE_URL || 'http://localhost:8002',
  timeout: 5000,
  enabled: process.env.NLP_SERVICE_ENABLED !== 'false',
};

/**
 * Check if NLP service is available
 */
export async function isNLPServiceAvailable(config: NLPClientConfig = defaultConfig): Promise<boolean> {
  if (!config.enabled) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Match intents using Python NLP service
 */
export async function matchWithNLP(
  input: string,
  patterns: Pattern[],
  context: RoutingContext,
  config: NLPClientConfig = defaultConfig
): Promise<NLPMatchResult | null> {
  if (!config.enabled) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(`${config.baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        patterns: patterns.map(p => ({
          type: p.type,
          value: p.value,
          weight: p.weight,
          intent_id: p.intentId,
        })),
        context: {
          current_file: context.currentFile,
          selection: context.selection,
          mode: context.mode,
        },
        min_confidence: 0.5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NLP service error: ${response.status}`);
    }

    return await response.json() as NLPMatchResult;
  } catch (error) {
    // Log error but don't throw - caller should fallback
    console.warn('NLP service unavailable, falling back to local matching:', error);
    return null;
  }
}

/**
 * Get embeddings for texts (for advanced caching)
 */
export async function getEmbeddings(
  texts: string[],
  config: NLPClientConfig = defaultConfig
): Promise<number[][] | null> {
  if (!config.enabled) {
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`NLP service error: ${response.status}`);
    }

    const data = await response.json() as { embeddings: number[][] };
    return data.embeddings;
  } catch {
    return null;
  }
}

/**
 * Clear NLP cache
 */
export async function clearNLPCache(config: NLPClientConfig = defaultConfig): Promise<boolean> {
  if (!config.enabled) {
    return false;
  }

  try {
    const response = await fetch(`${config.baseUrl}/cache/clear`, {
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export { defaultConfig as nlpClientConfig };
export type { NLPClientConfig };
