"""
NLP Intent API
FastAPI server for advanced intent detection
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Optional, Dict, List
from collections import defaultdict

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .models import (
    IntentMatchRequest,
    IntentMatchResponse,
    SemanticEmbeddingRequest,
    SemanticEmbeddingResponse,
)
from .service import IntentNLPService

logger = structlog.get_logger(__name__)


# Simple in-memory rate limiter (for production, use Redis)
class RateLimiter:
    """Simple sliding window rate limiter"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed"""
        now = time.time()
        window_start = now - 60  # 1 minute window

        # Clean old requests
        self.requests[key] = [
            t for t in self.requests[key] if t > window_start
        ]

        # Check limit
        if len(self.requests[key]) >= self.requests_per_minute:
            return False

        # Record request
        self.requests[key].append(now)
        return True

    def get_remaining(self, key: str) -> int:
        """Get remaining requests in window"""
        now = time.time()
        window_start = now - 60
        self.requests[key] = [
            t for t in self.requests[key] if t > window_start
        ]
        return max(0, self.requests_per_minute - len(self.requests[key]))


# Initialize rate limiter
rate_limiter = RateLimiter(
    requests_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
)


# Global service instance
_nlp_service: Optional[IntentNLPService] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global _nlp_service

    # Startup
    model_name = os.getenv("NLP_MODEL", "all-MiniLM-L6-v2")
    device = os.getenv("NLP_DEVICE", None)

    logger.info("Loading NLP model...", model=model_name, device=device)
    _nlp_service = IntentNLPService(model_name=model_name, device=device)
    logger.info("NLP service ready")

    yield

    # Shutdown
    logger.info("NLP service shutting down")
    _nlp_service = None


app = FastAPI(
    title="Qoder Intent NLP API",
    description="Advanced intent detection using transformer models",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - restricted for security
# In production, configure via environment variable
_ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
).split(",")

# Security middleware
# 1. Trusted Host validation
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["qoder.com", "*.qoder.com"]
    )

# 2. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    max_age=600,
)

# 3. Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all requests"""
    # Skip health checks
    if request.url.path == "/health":
        return await call_next(request)

    # Use client IP or API key as rate limit key
    client_key = request.headers.get("X-API-Key") or request.client.host

    if not rate_limiter.is_allowed(client_key):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={"Retry-After": "60"}
        )

    response = await call_next(request)

    # Add rate limit headers
    remaining = rate_limiter.get_remaining(client_key)
    response.headers["X-RateLimit-Limit"] = str(rate_limiter.requests_per_minute)
    response.headers["X-RateLimit-Remaining"] = str(remaining)

    return response


def get_service() -> IntentNLPService:
    """Get NLP service instance"""
    if _nlp_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return _nlp_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    service = get_service()
    return {
        "status": "healthy",
        "service": "intent-nlp",
        "version": "1.0.0",
        "model": service.model_name,
        "device": service.device,
    }


@app.post("/match", response_model=IntentMatchResponse)
async def match_intents(request: IntentMatchRequest):
    """
    Match user input against intent patterns

    This endpoint performs:
    - Semantic similarity matching
    - Fuzzy pattern matching
    - Context-aware confidence boosting
    """
    service = get_service()
    return service.match_intents(request)


@app.post("/embeddings", response_model=SemanticEmbeddingResponse)
async def get_embeddings(request: SemanticEmbeddingRequest):
    """
    Get semantic embeddings for texts

    Useful for caching embeddings locally
    """
    service = get_service()
    return service.get_embeddings(request)


@app.post("/cache/clear")
async def clear_cache():
    """Clear embedding cache"""
    service = get_service()
    service.clear_cache()
    return {"success": True, "message": "Cache cleared"}


@app.get("/model/info")
async def model_info():
    """Get model information with cache metrics"""
    service = get_service()
    total_requests = service._cache_hits + service._cache_misses
    hit_rate = (
        service._cache_hits / total_requests * 100
        if total_requests > 0 else 0
    )

    return {
        "model": service.model_name,
        "device": service.device,
        "cache": {
            "size": len(service._cache),
            "max_size": service.MAX_CACHE_SIZE,
            "hits": service._cache_hits,
            "misses": service._cache_misses,
            "hit_rate_percent": round(hit_rate, 2),
        },
        "limits": {
            "max_input_length": service.MAX_INPUT_LENGTH,
            "max_patterns": service.MAX_PATTERNS,
            "max_batch_size": service.MAX_BATCH_SIZE,
        },
    }
