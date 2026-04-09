"""
NLP Intent API
FastAPI server for advanced intent detection
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    IntentMatchRequest,
    IntentMatchResponse,
    SemanticEmbeddingRequest,
    SemanticEmbeddingResponse,
)
from .service import IntentNLPService

logger = structlog.get_logger(__name__)


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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    """Get model information"""
    service = get_service()
    return {
        "model": service.model_name,
        "device": service.device,
        "cache_size": len(service._cache),
    }
