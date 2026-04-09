"""
Workflow Parser
Parse YAML workflow definitions into Pydantic models
"""

from typing import Any, Dict
import structlog

from .models import (
    Workflow,
    WorkflowStep,
    WorkflowConfig,
    StepType,
    HookType,
    CommandStepConfig,
    ScriptStepConfig,
    ConditionStepConfig,
    ParallelStepConfig,
)

logger = structlog.get_logger(__name__)


class WorkflowParser:
    """Parse workflow definitions from YAML/JSON"""

    def parse(self, data: Dict[str, Any]) -> Workflow:
        """
        Parse raw workflow data into Workflow model

        Args:
            data: Raw dictionary from YAML/JSON

        Returns:
            Validated Workflow model
        """
        # Parse steps
        steps_data = data.get("steps", [])
        steps = [self._parse_step(s) for s in steps_data]

        # Parse config
        config_data = data.get("config", {})
        config = WorkflowConfig(**config_data)

        # Build workflow
        workflow = Workflow(
            name=data["name"],
            description=data["description"],
            type=HookType(data["type"]),
            steps=steps,
            config=config,
            condition=data.get("condition"),
        )

        return workflow

    def _parse_step(self, data: Dict[str, Any]) -> WorkflowStep:
        """Parse a workflow step"""
        step_type = StepType(data["type"])

        # Parse config based on type
        config: Dict[str, Any]
        if step_type == StepType.COMMAND:
            config = CommandStepConfig(**data["config"]).model_dump()
        elif step_type == StepType.SCRIPT:
            config = ScriptStepConfig(**data["config"]).model_dump()
        elif step_type == StepType.CONDITION:
            config = ConditionStepConfig(**data["config"]).model_dump()
        elif step_type == StepType.PARALLEL:
            # Parse nested steps
            nested_steps = [
                self._parse_step(s) for s in data["config"].get("steps", [])
            ]
            config = ParallelStepConfig(
                steps=nested_steps,
                max_concurrent=data["config"].get("max_concurrent"),
            ).model_dump()
        else:
            config = data.get("config", {})

        return WorkflowStep(
            id=data["id"],
            name=data["name"],
            type=step_type,
            config=config,
            condition=data.get("condition"),
            continue_on_error=data.get("continue_on_error", False),
            timeout=data.get("timeout"),
            depends_on=data.get("depends_on", []),
        )
