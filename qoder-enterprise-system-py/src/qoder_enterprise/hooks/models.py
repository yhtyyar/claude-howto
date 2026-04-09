"""
Workflow Models
Pydantic models for workflow definitions and execution
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class StepType(str, Enum):
    """Supported step types"""
    COMMAND = "command"
    SCRIPT = "script"
    HOOK = "hook"
    CONDITION = "condition"
    PARALLEL = "parallel"


class HookType(str, Enum):
    """Supported hook types"""
    PRE_COMMIT = "pre-commit"
    POST_COMMIT = "post-commit"
    PRE_PUSH = "pre-push"
    POST_PUSH = "post-push"
    PRE_MERGE = "pre-merge"
    POST_MERGE = "post-merge"
    PRE_REBASE = "pre-rebase"
    POST_REBASE = "post-rebase"
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class WorkflowConfig(BaseModel):
    """Workflow execution configuration"""
    fail_fast: bool = Field(default=True, description="Stop on first failure")
    timeout: int = Field(default=300, ge=1, description="Timeout in seconds")
    parallel: bool = Field(default=False, description="Enable parallel execution")
    max_concurrent: int = Field(default=4, ge=1, description="Max concurrent steps")
    working_directory: Optional[str] = None
    env: Dict[str, str] = Field(default_factory=dict)


class CommandStepConfig(BaseModel):
    """Command step configuration"""
    command: str = Field(..., min_length=1)
    args: List[str] = Field(default_factory=list)
    cwd: Optional[str] = None
    env: Dict[str, str] = Field(default_factory=dict)


class ScriptStepConfig(BaseModel):
    """Script step configuration"""
    path: str = Field(..., min_length=1)
    interpreter: Optional[str] = "bash"
    args: List[str] = Field(default_factory=list)


class ConditionStepConfig(BaseModel):
    """Condition step configuration"""
    expression: str = Field(..., min_length=1)
    then_steps: List[str] = Field(..., min_length=1)
    else_steps: Optional[List[str]] = None


class ParallelStepConfig(BaseModel):
    """Parallel step configuration"""
    steps: List["WorkflowStep"] = Field(..., min_length=2)
    max_concurrent: Optional[int] = None


class WorkflowStep(BaseModel):
    """Workflow step definition"""
    id: str = Field(..., min_length=1, pattern=r"^[a-zA-Z0-9_-]+$")
    name: str = Field(..., min_length=1)
    type: StepType
    config: Dict[str, Any] = Field(...)
    condition: Optional[str] = None
    continue_on_error: bool = False
    timeout: Optional[int] = Field(None, ge=1)
    depends_on: List[str] = Field(default_factory=list)

    @field_validator("depends_on")
    @classmethod
    def validate_depends_on(cls, v: List[str]) -> List[str]:
        """Ensure no circular dependencies in simple cases"""
        if len(v) != len(set(v)):
            raise ValueError("Duplicate dependencies found")
        return v


class Workflow(BaseModel):
    """Workflow definition"""
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    type: HookType
    steps: List[WorkflowStep] = Field(..., min_length=1)
    config: WorkflowConfig = Field(default_factory=WorkflowConfig)
    condition: Optional[str] = None

    @field_validator("steps")
    @classmethod
    def validate_steps(cls, v: List[WorkflowStep]) -> List[WorkflowStep]:
        """Validate step IDs are unique"""
        step_ids = [step.id for step in v]
        if len(step_ids) != len(set(step_ids)):
            raise ValueError("Duplicate step IDs found")
        return v


class StepResult(BaseModel):
    """Individual step execution result"""
    step_id: str
    success: bool
    execution_time_ms: int
    exit_code: Optional[int] = None
    output: str = ""
    error: Optional[str] = None
    skipped: bool = False


class WorkflowResult(BaseModel):
    """Complete workflow execution result"""
    success: bool
    workflow: str
    execution_time_ms: int
    steps: List[StepResult]
    logs: List[str] = Field(default_factory=list)
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class ExecutionContext(BaseModel):
    """Execution context for workflows"""
    cwd: str
    env: Dict[str, str] = Field(default_factory=dict)
    git_branch: Optional[str] = None
    git_commit: Optional[str] = None
    trigger_type: Optional[HookType] = None


class ValidationError(BaseModel):
    """Validation error details"""
    path: str
    message: str
    code: str


class WorkflowValidationResult(BaseModel):
    """Workflow validation result"""
    valid: bool
    errors: List[ValidationError] = Field(default_factory=list)
    warnings: List[ValidationError] = Field(default_factory=list)
