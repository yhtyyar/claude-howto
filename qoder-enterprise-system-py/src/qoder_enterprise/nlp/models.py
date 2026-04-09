"""
NLP Models
Pydantic models for intent matching
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class PatternMatch(BaseModel):
    """Individual pattern match result"""
    pattern_type: str = Field(..., description="Type of pattern: exact, regex, semantic, fuzzy")
    pattern_value: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    matched: bool
    details: Optional[Dict] = None


class IntentMatchRequest(BaseModel):
    """Request for intent matching"""
    input: str = Field(..., min_length=1, description="User input text")
    patterns: List[Dict] = Field(..., description="Intent patterns to match against")
    context: Optional[Dict] = Field(default=None, description="Context information")
    min_confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    include_details: bool = Field(default=True)


class IntentMatchResponse(BaseModel):
    """Response for intent matching"""
    best_match: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    all_scores: Dict[str, float] = Field(default_factory=dict)
    pattern_matches: List[PatternMatch] = Field(default_factory=list)
    semantic_score: Optional[float] = None
    processing_time_ms: int


class SemanticEmbeddingRequest(BaseModel):
    """Request for semantic embedding"""
    texts: List[str] = Field(..., min_length=1)


class SemanticEmbeddingResponse(BaseModel):
    """Response for semantic embedding"""
    embeddings: List[List[float]]
    model: str
    dimensions: int
