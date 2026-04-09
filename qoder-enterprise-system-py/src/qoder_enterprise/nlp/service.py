"""
Intent NLP Service
Advanced intent detection using sentence transformers and semantic similarity
"""

import re
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import structlog
from sentence_transformers import SentenceTransformer, util

from .models import (
    IntentMatchRequest,
    IntentMatchResponse,
    PatternMatch,
    SemanticEmbeddingRequest,
    SemanticEmbeddingResponse,
)

logger = structlog.get_logger(__name__)


class IntentNLPService:
    """
    High-performance intent detection using transformer models

    Supports:
    - Semantic similarity with embeddings
    - Fuzzy matching with confidence scores
    - Context-aware boosting
    - Input validation and DoS protection
    """

    # Security limits
    MAX_INPUT_LENGTH = 10000  # characters
    MAX_CACHE_SIZE = 1000     # embeddings
    MAX_PATTERNS = 50         # patterns per request
    MAX_BATCH_SIZE = 100      # texts per embedding request

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        device: Optional[str] = None,
    ):
        """
        Initialize NLP service

        Args:
            model_name: Sentence transformer model to use
            device: Device to run on (cpu/cuda), auto-detected if None
        """
        self.model_name = model_name
        self.device = device or ("cuda" if self._check_cuda() else "cpu")

        logger.info(
            "Loading transformer model",
            model=model_name,
            device=self.device,
        )

        self.model = SentenceTransformer(model_name, device=self.device)
        self._cache: Dict[str, np.ndarray] = {}
        self._cache_hits = 0
        self._cache_misses = 0

        logger.info("Model loaded successfully")

    def _validate_input(self, text: str, max_length: int = MAX_INPUT_LENGTH) -> None:
        """Validate input text for security"""
        if not isinstance(text, str):
            raise ValueError(f"Input must be string, got {type(text)}")

        if not text or not text.strip():
            raise ValueError("Input cannot be empty")

        if len(text) > max_length:
            raise ValueError(
                f"Input too long: {len(text)} chars (max {max_length})"
            )

        # Check for potentially malicious content
        if self._contains_dangerous_content(text):
            raise ValueError("Input contains potentially dangerous content")

    def _contains_dangerous_content(self, text: str) -> bool:
        """Check for dangerous content patterns"""
        import re

        # Check for extremely long repeated patterns (DoS attempt)
        repeated_pattern = re.search(r"(.{100,})\1{10,}", text)
        if repeated_pattern:
            return True

        # Check for null bytes or control characters
        if any(ord(c) < 32 and c not in "\t\n\r" for c in text):
            return True

        return False

    def _check_cuda(self) -> bool:
        """Check if CUDA is available"""
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False

    def match_intents(self, request: IntentMatchRequest) -> IntentMatchResponse:
        """
        Match input against multiple intent patterns

        Args:
            request: Match request with input and patterns

        Returns:
            Best matching intent with confidence scores
        """
        start_time = time.time()

        # Validate input
        self._validate_input(request.input, self.MAX_INPUT_LENGTH)

        # Validate pattern count
        if len(request.patterns) > self.MAX_PATTERNS:
            raise ValueError(
                f"Too many patterns: {len(request.patterns)} (max {self.MAX_PATTERNS})"
            )

        input_text = request.input.lower().strip()
        pattern_matches: List[PatternMatch] = []
        all_scores: Dict[str, float] = {}

        best_match: Optional[str] = None
        best_confidence = 0.0

        for pattern in request.patterns:
            pattern_type = pattern.get("type", "semantic")
            pattern_value = pattern.get("value", "")
            weight = pattern.get("weight", 1.0)
            intent_id = pattern.get("intent_id", "unknown")

            # Match based on type
            if pattern_type == "exact":
                match = self._match_exact(input_text, pattern_value, weight)
            elif pattern_type == "regex":
                match = self._match_regex(input_text, pattern_value, weight)
            elif pattern_type == "fuzzy":
                match = self._match_fuzzy(input_text, pattern_value, weight)
            else:  # semantic (default)
                match = self._match_semantic(input_text, pattern_value, weight)

            pattern_matches.append(match)

            # Aggregate by intent
            current_score = all_scores.get(intent_id, 0.0)
            all_scores[intent_id] = max(current_score, match.confidence)

            # Track best match
            if match.confidence > best_confidence:
                best_confidence = match.confidence
                best_match = intent_id

        # Apply context boosting
        if request.context:
            best_match, best_confidence = self._apply_context_boost(
                best_match, best_confidence, request.context, all_scores
            )

        # Filter by minimum confidence
        if best_confidence < request.min_confidence:
            best_match = None

        processing_time_ms = int((time.time() - start_time) * 1000)

        return IntentMatchResponse(
            best_match=best_match,
            confidence=best_confidence,
            all_scores=all_scores,
            pattern_matches=pattern_matches if request.include_details else [],
            processing_time_ms=processing_time_ms,
        )

    def _match_exact(
        self, input_text: str, pattern: str, weight: float
    ) -> PatternMatch:
        """Exact string matching"""
        pattern_lower = pattern.lower().strip()

        if input_text == pattern_lower:
            confidence = 1.0 * weight
        elif pattern_lower in input_text:
            coverage = len(pattern_lower) / len(input_text)
            confidence = coverage * weight * 0.8
        else:
            confidence = 0.0

        return PatternMatch(
            pattern_type="exact",
            pattern_value=pattern,
            confidence=confidence,
            matched=confidence > 0,
        )

    def _match_regex(
        self, input_text: str, pattern: str, weight: float
    ) -> PatternMatch:
        """Regex pattern matching"""
        try:
            match = re.search(pattern, input_text, re.IGNORECASE)
            if match:
                return PatternMatch(
                    pattern_type="regex",
                    pattern_value=pattern,
                    confidence=weight,
                    matched=True,
                    details={
                        "matched_text": match.group(0),
                        "groups": match.groups(),
                    },
                )
        except re.error:
            pass

        return PatternMatch(
            pattern_type="regex",
            pattern_value=pattern,
            confidence=0.0,
            matched=False,
        )

    def _match_fuzzy(
        self, input_text: str, pattern: str, weight: float
    ) -> PatternMatch:
        """
        Fuzzy matching using semantic similarity
        (More accurate than Levenshtein for intent detection)
        """
        # Use embeddings for fuzzy semantic matching
        embeddings = self.model.encode([input_text, pattern])
        similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

        # Adjust threshold for fuzzy matching
        confidence = similarity * weight if similarity > 0.6 else 0.0

        return PatternMatch(
            pattern_type="fuzzy",
            pattern_value=pattern,
            confidence=confidence,
            matched=confidence > 0,
            details={"similarity": similarity},
        )

    def _match_semantic(
        self, input_text: str, pattern: str, weight: float
    ) -> PatternMatch:
        """
        Semantic matching using sentence embeddings
        """
        # Get or compute embeddings
        emb1 = self._get_embedding(input_text)
        emb2 = self._get_embedding(pattern)

        # Cosine similarity
        similarity = util.cos_sim(emb1, emb2).item()

        # Boost confidence for high similarity
        confidence = similarity * weight

        return PatternMatch(
            pattern_type="semantic",
            pattern_value=pattern,
            confidence=confidence,
            matched=confidence > 0.5,
            details={"similarity": similarity},
        )

    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding with caching and validation"""
        # Validate input
        self._validate_input(text, self.MAX_INPUT_LENGTH)

        # Check cache
        if text in self._cache:
            self._cache_hits += 1
            return self._cache[text]

        self._cache_misses += 1

        # Compute embedding
        embedding = self.model.encode(text)

        # Manage cache size (simple LRU via dict ordering in Python 3.7+)
        if len(self._cache) >= self.MAX_CACHE_SIZE:
            # Remove oldest item
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        self._cache[text] = embedding
        return embedding

    def _apply_context_boost(
        self,
        best_match: Optional[str],
        confidence: float,
        context: Dict[str, Any],
        all_scores: Dict[str, float],
    ) -> Tuple[Optional[str], float]:
        """
        Apply context-based confidence boosting
        """
        # File extension boosting
        current_file = context.get("current_file", "")
        if current_file:
            ext = current_file.split(".")[-1].lower()

            # Boost test-related intents for test files
            if ext in ("test.js", "spec.js", "test.py", "_test.go"):
                if best_match and "test" in best_match.lower():
                    confidence = min(1.0, confidence * 1.2)

            # Boost doc-related intents for markdown
            if ext == "md":
                if best_match and "doc" in best_match.lower():
                    confidence = min(1.0, confidence * 1.15)

        # Selection-based boosting
        selection = context.get("selection", "")
        if selection and len(selection) > 0:
            # Code selection boosts code-related intents
            if best_match and any(x in best_match for x in ["code", "review", "refactor"]):
                confidence = min(1.0, confidence * 1.1)

        return best_match, confidence

    def get_embeddings(
        self, request: SemanticEmbeddingRequest
    ) -> SemanticEmbeddingResponse:
        """
        Get embeddings for texts with validation
        """
        # Validate batch size
        if len(request.texts) > self.MAX_BATCH_SIZE:
            raise ValueError(
                f"Batch too large: {len(request.texts)} (max {self.MAX_BATCH_SIZE})"
            )

        # Validate each text
        for text in request.texts:
            self._validate_input(text, self.MAX_INPUT_LENGTH)

        embeddings = self.model.encode(request.texts)

        return SemanticEmbeddingResponse(
            embeddings=embeddings.tolist(),
            model=self.model_name,
            dimensions=embeddings.shape[1],
        )

    def clear_cache(self) -> None:
        """Clear embedding cache"""
        self._cache.clear()
        logger.info("Embedding cache cleared")
