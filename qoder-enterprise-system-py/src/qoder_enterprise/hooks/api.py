"""
Hook Runner API
FastAPI server for workflow management and execution
"""

import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

import structlog
import yaml
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .models import (
    ExecutionContext,
    HookType,
    ValidationError,
    Workflow,
    WorkflowResult,
    WorkflowValidationResult,
)
from .executor import WorkflowExecutor
from .parser import WorkflowParser
from .validator import SecurityValidator

logger = structlog.get_logger(__name__)


# Simple rate limiter (for production, use Redis)
class RateLimiter:
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - 60
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        if len(self.requests[key]) >= self.requests_per_minute:
            return False
        self.requests[key].append(now)
        return True


rate_limiter = RateLimiter(
    requests_per_minute=int(os.getenv("HOOK_RATE_LIMIT_PER_MINUTE", "30"))
)


class WorkflowService:
    """Service for managing and executing workflows"""

    def __init__(self, workflows_path: str = "./workflows"):
        self.workflows_path = workflows_path
        self.parser = WorkflowParser()
        self.executor = WorkflowExecutor()
        self.security = SecurityValidator()
        self._workflows: dict[str, Workflow] = {}
        self._load_workflows()

    def _load_workflows(self) -> None:
        """Load all workflow definitions from disk"""
        self._workflows = {}

        if not os.path.exists(self.workflows_path):
            logger.warning(f"Workflows path does not exist: {self.workflows_path}")
            return

        for filename in os.listdir(self.workflows_path):
            if filename.endswith(('.yaml', '.yml')):
                filepath = os.path.join(self.workflows_path, filename)
                try:
                    with open(filepath, 'r') as f:
                        data = yaml.safe_load(f)
                        workflow = self.parser.parse(data)
                        self._workflows[workflow.name] = workflow
                        logger.info(f"Loaded workflow: {workflow.name}")
                except Exception as e:
                    logger.error(f"Failed to load workflow {filename}: {e}")

    def get_workflow(self, name: str) -> Optional[Workflow]:
        """Get a workflow by name"""
        return self._workflows.get(name)

    def list_workflows(
        self,
        hook_type: Optional[HookType] = None,
    ) -> List[Workflow]:
        """List all workflows, optionally filtered by type"""
        workflows = list(self._workflows.values())
        if hook_type:
            workflows = [w for w in workflows if w.type == hook_type]
        return workflows

    def reload_workflows(self) -> dict:
        """Reload all workflows from disk"""
        count_before = len(self._workflows)
        self._load_workflows()
        count_after = len(self._workflows)

        return {
            "success": True,
            "previous_count": count_before,
            "current_count": count_after,
            "loaded": list(self._workflows.keys()),
        }

    def validate_workflow(self, data: dict) -> WorkflowValidationResult:
        """Validate a workflow definition"""
        errors: List[ValidationError] = []
        warnings: List[ValidationError] = []

        try:
            workflow = self.parser.parse(data)

            # Check for circular dependencies
            try:
                self.executor._build_execution_graph(workflow.steps)
            except ValueError as e:
                errors.append(
                    ValidationError(
                        path="steps",
                        message=str(e),
                        code="CIRCULAR_DEPENDENCY",
                    )
                )

            # Check step configs
            for step in workflow.steps:
                if step.type.value == "command":
                    command = step.config.get("command", "")
                    args = step.config.get("args", [])
                    validation = self.security.validate_command(command, args)
                    if not validation.valid:
                        warnings.append(
                            ValidationError(
                                path=f"steps.{step.id}.config",
                                message=f"Security warning: {validation.errors}",
                                code="SECURITY_WARNING",
                            )
                        )

            return WorkflowValidationResult(
                valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
            )

        except Exception as e:
            errors.append(
                ValidationError(
                    path="root",
                    message=str(e),
                    code="PARSE_ERROR",
                )
            )
            return WorkflowValidationResult(valid=False, errors=errors)

    def run_workflow(
        self,
        name: str,
        context: ExecutionContext,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> WorkflowResult:
        """Execute a workflow"""
        workflow = self.get_workflow(name)
        if not workflow:
            raise HTTPException(status_code=404, detail=f"Workflow not found: {name}")

        logger.info(f"Executing workflow: {name}", context=context.model_dump())

        result = self.executor.execute(workflow, context)

        return result

    def run_hook(
        self,
        hook_type: HookType,
        context: ExecutionContext,
    ) -> dict:
        """Execute all workflows for a hook type"""
        workflows = self.list_workflows(hook_type)

        if not workflows:
            return {
                "success": True,
                "message": f"No workflows for hook type: {hook_type}",
                "results": [],
            }

        results: List[WorkflowResult] = []
        for workflow in workflows:
            result = self.executor.execute(workflow, context)
            results.append(result)

        all_success = all(r.success for r in results)

        return {
            "success": all_success,
            "workflows": results,
        }


# Global service instance
_workflow_service: Optional[WorkflowService] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global _workflow_service

    # Startup
    workflows_path = os.getenv("QODER_WORKFLOWS_PATH", "./workflows")
    _workflow_service = WorkflowService(workflows_path)

    logger.info("Hook Runner API started", workflows_path=workflows_path)

    yield

    # Shutdown
    logger.info("Hook Runner API shutting down")


app = FastAPI(
    title="Qoder Hook Runner API",
    description="Python-based workflow automation service for Qoder IDE",
    version="1.0.0",
    lifespan=lifespan,
)

# Security middleware
# 1. Trusted Host validation (production only)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["qoder.com", "*.qoder.com", "localhost", "127.0.0.1"]
    )

# 2. CORS - restricted origins
_ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
).split(",")

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

    client_key = request.headers.get("X-API-Key") or request.client.host

    if not rate_limiter.is_allowed(client_key):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={"Retry-After": "60"}
        )

    response = await call_next(request)
    return response


def get_service() -> WorkflowService:
    """Get workflow service instance"""
    if _workflow_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return _workflow_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "hook-runner",
        "version": "1.0.0",
    }


@app.get("/workflows", response_model=List[dict])
async def list_workflows(hook_type: Optional[str] = None):
    """List all workflows"""
    service = get_service()

    hook_type_enum = None
    if hook_type:
        try:
            hook_type_enum = HookType(hook_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid hook type: {hook_type}")

    workflows = service.list_workflows(hook_type_enum)

    return [
        {
            "name": w.name,
            "type": w.type.value,
            "description": w.description,
            "steps": len(w.steps),
        }
        for w in workflows
    ]


@app.get("/workflows/{name}")
async def get_workflow(name: str):
    """Get workflow details"""
    service = get_service()
    workflow = service.get_workflow(name)

    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {name}")

    return workflow.model_dump()


@app.post("/workflows/{name}/run", response_model=WorkflowResult)
async def run_workflow(
    name: str,
    context: ExecutionContext,
    background_tasks: BackgroundTasks,
):
    """Execute a workflow"""
    service = get_service()
    return service.run_workflow(name, context, background_tasks)


@app.post("/hooks/{hook_type}/run")
async def run_hook(hook_type: str, context: ExecutionContext):
    """Execute all workflows for a hook type"""
    service = get_service()

    try:
        hook_type_enum = HookType(hook_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid hook type: {hook_type}")

    return service.run_hook(hook_type_enum, context)


@app.post("/workflows/validate", response_model=WorkflowValidationResult)
async def validate_workflow(data: dict):
    """Validate a workflow definition"""
    service = get_service()
    return service.validate_workflow(data)


@app.post("/workflows/reload")
async def reload_workflows():
    """Reload workflows from disk"""
    service = get_service()
    return service.reload_workflows()


@app.get("/stats")
async def get_stats():
    """Get service statistics"""
    service = get_service()
    workflows = service.list_workflows()

    by_type: dict[str, int] = {}
    for w in workflows:
        by_type[w.type.value] = by_type.get(w.type.value, 0) + 1

    return {
        "total_workflows": len(workflows),
        "by_type": by_type,
    }
