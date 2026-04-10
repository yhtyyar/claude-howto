/**
 * Pattern Matching Engine
 * Handles different pattern types for intent detection
 *
 * @module pattern-matcher
 * @version 1.0.0
 */

import { default as Fuse } from 'fuse.js';
import type { Pattern, PatternMatchResult, PatternType } from './types.js';

/**
 * Pattern matching engine
 */
export class PatternMatcher {
  private fuseOptions: any;

  constructor() {
    this.fuseOptions = {
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };
  }

  /**
   * Match input against a pattern
   */
  match(pattern: Pattern, input: string): PatternMatchResult {
    switch (pattern.type) {
      case 'exact':
        return this.matchExact(pattern.value, input, pattern.weight);

      case 'regex':
        return this.matchRegex(pattern.value, input, pattern.weight);

      case 'semantic':
        return this.matchSemantic(pattern.value, input, pattern.weight);

      case 'fuzzy':
        return this.matchFuzzy(pattern.value, input, pattern.weight);

      default:
        return { matched: false, confidence: 0 };
    }
  }

  /**
   * Exact string matching (case-insensitive)
   */
  private matchExact(pattern: string, input: string, weight: number): PatternMatchResult {
    const normalizedPattern = pattern.toLowerCase().trim();
    const normalizedInput = input.toLowerCase().trim();

    if (normalizedPattern === normalizedInput) {
      return {
        matched: true,
        confidence: 1.0 * weight,
        details: {
          matchedText: pattern,
          matchIndex: normalizedInput.indexOf(normalizedPattern),
        },
      };
    }

    // Check if pattern is contained within input
    if (normalizedInput.includes(normalizedPattern)) {
      const coverage = normalizedPattern.length / normalizedInput.length;
      return {
        matched: true,
        confidence: coverage * weight * 0.8, // Slightly lower confidence for partial match
        details: {
          matchedText: pattern,
          matchIndex: normalizedInput.indexOf(normalizedPattern),
        },
      };
    }

    return { matched: false, confidence: 0 };
  }

  /**
   * Regex pattern matching
   */
  private matchRegex(pattern: string, input: string, weight: number): PatternMatchResult {
    try {
      const regex = new RegExp(pattern, 'i');
      const match = input.match(regex);

      if (match) {
        return {
          matched: true,
          confidence: weight,
          details: {
            matchedText: match[0],
            matchIndex: match.index,
            groups: match.slice(1),
          },
        };
      }

      return { matched: false, confidence: 0 };
    } catch (error) {
      // Invalid regex pattern
      console.warn(`Invalid regex pattern: ${pattern}`, error);
      return { matched: false, confidence: 0 };
    }
  }

  /**
   * Semantic keyword matching
   * Uses keyword extraction and weighted matching
   */
  private matchSemantic(pattern: string, input: string, weight: number): PatternMatchResult {
    const keywords = pattern.toLowerCase().split(/\s+/);
    const inputLower = input.toLowerCase();

    let matchedKeywords = 0;
    let totalKeywordWeight = 0;
    const matches: Array<{ keyword: string; position: number }> = [];

    for (const keyword of keywords) {
      const keywordWeight = this.getKeywordWeight(keyword);
      totalKeywordWeight += keywordWeight;

      const position = inputLower.indexOf(keyword);
      if (position !== -1) {
        matchedKeywords++;
        matches.push({ keyword, position });
      }
    }

    if (matchedKeywords === 0) {
      return { matched: false, confidence: 0 };
    }

    // Calculate confidence based on:
    // 1. Percentage of keywords matched
    // 2. Weight of matched keywords
    // 3. Proximity of matches (bonus if keywords are close together)

    const matchRatio = matchedKeywords / keywords.length;
    const proximityBonus = this.calculateProximityBonus(matches, input.length);

    const confidence = (matchRatio * 0.6 + proximityBonus * 0.4) * weight;

    return {
      matched: true,
      confidence: Math.min(confidence, weight),
      details: {
        matchedText: matches.map((m) => m.keyword).join(', '),
        matchIndex: matches[0]?.position ?? 0,
      },
    };
  }

  /**
   * Fuzzy string matching using Fuse.js
   */
  private matchFuzzy(pattern: string, input: string, weight: number): PatternMatchResult {
    // For fuzzy matching, we treat the pattern as the search target
    // and create a list containing just the input as our "haystack"
    const fuse = new Fuse([input], this.fuseOptions);
    const results = fuse.search(pattern);

    if (results.length > 0) {
      const firstResult = results[0];
      const score = firstResult?.score ?? 0;
      // Fuse score is 0-1 where 0 is perfect match
      // Convert to our confidence format (0-1 where 1 is perfect)
      const confidence = (1 - score) * weight;

      if (confidence > 0.3) {
        // Minimum threshold for fuzzy
        return {
          matched: true,
          confidence,
          details: {
            matchedText: firstResult?.item ?? '',
            matchIndex: 0,
          },
        };
      }
    }

    return { matched: false, confidence: 0 };
  }

  /**
   * Get weight for a keyword based on its rarity/specificity
   */
  private getKeywordWeight(keyword: string): number {
    // Common words get lower weight
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'to',
      'for',
      'in',
      'on',
      'at',
      'with',
      'by',
      'this',
      'that',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'shall',
    ]);

    if (commonWords.has(keyword)) {
      return 0.3;
    }

    // Technical/domain-specific terms get higher weight
    const technicalTerms = new Set([
      'code',
      'function',
      'class',
      'method',
      'test',
      'bug',
      'fix',
      'refactor',
      'optimize',
      'performance',
      'security',
      'vulnerability',
      'database',
      'api',
      'endpoint',
      'async',
      'promise',
      'component',
      'module',
      'dependency',
      'review',
      'audit',
      'analysis',
    ]);

    if (technicalTerms.has(keyword)) {
      return 1.5;
    }

    // Default weight
    return 1.0;
  }

  /**
   * Calculate proximity bonus for matched keywords
   * Keywords closer together get higher bonus
   */
  private calculateProximityBonus(
    matches: Array<{ keyword: string; position: number }>,
    inputLength: number
  ): number {
    if (matches.length < 2) {
      return 1.0;
    }

    // Sort by position
    const sorted = [...matches].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Calculate average distance between consecutive matches
    let totalDistance = 0;
    for (let i = 1; i < sorted.length; i++) {
      const currentPos = sorted[i]?.position ?? 0;
      const prevPos = sorted[i - 1]?.position ?? 0;
      totalDistance += currentPos - prevPos;
    }

    const averageDistance = totalDistance / (sorted.length - 1);

    // Normalize by input length
    const normalizedDistance = averageDistance / inputLength;

    // Closer matches = higher bonus (inverse relationship)
    // Use exponential decay for smoother curve
    const bonus = Math.exp(-normalizedDistance * 3);

    return Math.max(0.3, Math.min(1.0, bonus));
  }

  /**
   * Find all matches for a pattern in input
   */
  findAllMatches(pattern: Pattern, input: string): PatternMatchResult[] {
    if (pattern.type !== 'regex') {
      // For non-regex, just return single match result
      const result = this.match(pattern, input);
      return result.matched ? [result] : [];
    }

    // For regex, find all matches
    const results: PatternMatchResult[] = [];
    try {
      const regex = new RegExp(pattern.value, 'gi');
      let match;

      while ((match = regex.exec(input)) !== null) {
        results.push({
          matched: true,
          confidence: pattern.weight,
          details: {
            matchedText: match[0],
            matchIndex: match.index,
            groups: match.slice(1),
          },
        });

        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } catch (error) {
      console.warn(`Error in findAllMatches: ${error}`);
    }

    return results;
  }

  /**
   * Preprocess input for better matching
   */
  preprocessInput(input: string): string {
    // Remove extra whitespace
    let processed = input.trim().replace(/\s+/g, ' ');

    // Normalize punctuation
    processed = processed.replace(/[.,!?;:]$/, '');

    // Normalize common variations
    const normalizations: Record<string, string> = {
      wanna: 'want to',
      gonna: 'going to',
      gotta: 'got to',
      kinda: 'kind of',
      sorta: 'sort of',
      dunno: 'do not know',
      lemme: 'let me',
      gimme: 'give me',
      tellme: 'tell me',
      showme: 'show me',
    };

    for (const [abbr, full] of Object.entries(normalizations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processed = processed.replace(regex, full);
    }

    return processed;
  }

  /**
   * Calculate match quality score for ranking
   */
  calculateMatchQuality(result: PatternMatchResult, pattern: Pattern): number {
    if (!result.matched) {
      return 0;
    }

    let quality = result.confidence;

    // Boost for exact matches
    if (pattern.type === 'exact' && result.confidence >= 0.9) {
      quality *= 1.2;
    }

    // Boost for regex with groups (more specific)
    if (pattern.type === 'regex' && result.details?.groups && result.details.groups.length > 0) {
      quality *= 1.1;
    }

    // Slight boost for semantic matches (domain understanding)
    if (pattern.type === 'semantic') {
      quality *= 1.05;
    }

    return quality;
  }
}

/** Singleton instance */
let patternMatcherInstance: PatternMatcher | null = null;

/**
 * Get or create PatternMatcher instance
 */
export function getPatternMatcher(): PatternMatcher {
  if (!patternMatcherInstance) {
    patternMatcherInstance = new PatternMatcher();
  }
  return patternMatcherInstance;
}

/**
 * Reset PatternMatcher instance (for testing)
 */
export function resetPatternMatcher(): void {
  patternMatcherInstance = null;
}
