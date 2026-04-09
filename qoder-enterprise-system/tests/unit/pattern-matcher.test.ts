/**
 * Pattern Matcher Unit Tests
 * Testing pattern matching algorithms
 *
 * @module unit/pattern-matcher
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PatternMatcher } from '../../core/mcp-intent-router/src/pattern-matcher.js';
import type { Pattern } from '../../core/mcp-intent-router/src/types.js';

describe('PatternMatcher', () => {
  let matcher: PatternMatcher;

  beforeEach(() => {
    matcher = new PatternMatcher();
  });

  describe('Exact Pattern Matching', () => {
    it('should match exact strings case-insensitively', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'code review',
        weight: 1.0,
      };

      const result1 = matcher.match(pattern, 'code review');
      expect(result1.matched).toBe(true);
      expect(result1.confidence).toBe(1.0);

      const result2 = matcher.match(pattern, 'Code Review');
      expect(result2.matched).toBe(true);
      expect(result2.confidence).toBe(1.0);
    });

    it('should not match different strings', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'code review',
        weight: 1.0,
      };

      const result = matcher.match(pattern, 'optimize code');
      expect(result.matched).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Regex Pattern Matching', () => {
    it('should match regex patterns', () => {
      const pattern: Pattern = {
        type: 'regex',
        value: 'review\\s+(this|the)\\s+code',
        weight: 0.9,
      };

      const result1 = matcher.match(pattern, 'review this code');
      expect(result1.matched).toBe(true);
      expect(result1.confidence).toBeGreaterThan(0);

      const result2 = matcher.match(pattern, 'review the code');
      expect(result2.matched).toBe(true);
    });

    it('should handle invalid regex gracefully', () => {
      const pattern: Pattern = {
        type: 'regex',
        value: '[invalid(regex',
        weight: 0.9,
      };

      const result = matcher.match(pattern, 'test');
      expect(result.matched).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Semantic Pattern Matching', () => {
    it('should match based on keyword overlap', () => {
      const pattern: Pattern = {
        type: 'semantic',
        value: 'code analysis security check',
        weight: 0.8,
      };

      const result = matcher.match(pattern, 'check code security');
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return 0 for no keyword overlap', () => {
      const pattern: Pattern = {
        type: 'semantic',
        value: 'code review analysis',
        weight: 0.8,
      };

      const result = matcher.match(pattern, 'deploy to production');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Fuzzy Pattern Matching', () => {
    it('should match similar strings with Fuse.js', () => {
      const pattern: Pattern = {
        type: 'fuzzy',
        value: 'optimization',
        weight: 0.6,
      };

      const result = matcher.match(pattern, 'optimize code');
      // Should match "optimize" with "optimization"
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should match typos', () => {
      const pattern: Pattern = {
        type: 'fuzzy',
        value: 'checkpoint',
        weight: 0.6,
      };

      const result = matcher.match(pattern, 'chekpoint');
      expect(result.confidence).toBeGreaterThan(0.3); // Should match with typo
    });
  });

  describe('Confidence Calculation', () => {
    it('should apply weight to confidence', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'test',
        weight: 0.5,
      };

      const result = matcher.match(pattern, 'test');
      expect(result.confidence).toBe(0.5); // 1.0 * 0.5
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'test',
        weight: 1.0,
      };

      const result = matcher.match(pattern, '');
      expect(result.matched).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle empty pattern', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: '',
        weight: 1.0,
      };

      const result = matcher.match(pattern, 'test');
      expect(result.matched).toBe(true); // Empty string matches everything
    });

    it('should handle very long input', () => {
      const pattern: Pattern = {
        type: 'semantic',
        value: 'performance',
        weight: 1.0,
      };

      const longInput = 'performance '.repeat(1000);
      const result = matcher.match(pattern, longInput);
      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'test@#$%^&*()',
        weight: 1.0,
      };

      const result = matcher.match(pattern, 'test@#$%^&*()');
      expect(result.matched).toBe(true);
    });
  });

  describe('Preprocessing', () => {
    it('should normalize input', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'hello world',
        weight: 1.0,
      };

      // Should match despite extra spaces
      const result = matcher.match(pattern, '  hello   world  ');
      expect(result.matched).toBe(true);
    });

    it('should handle unicode characters', () => {
      const pattern: Pattern = {
        type: 'exact',
        value: 'привет мир',
        weight: 1.0,
      };

      const result = matcher.match(pattern, 'привет мир');
      expect(result.matched).toBe(true);
    });
  });
});
