"""
Workflow Executor
High-performance workflow execution with Celery and asyncio
"""

import asyncio
import os
import subprocess
import time
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from concurrent.futures import ThreadPoolExecutor, as_completed

import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from .models import (
    ExecutionContext,
    StepResult,
    StepType,
    Workflow,
    WorkflowResult,
    WorkflowStep,
)
from .validator import SecurityValidator

logger = structlog.get_logger(__name__)


class WorkflowExecutor:
    """Execute workflows with dependency resolution and parallel execution"""

    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.security = SecurityValidator()
        self._step_results: Dict[str, StepResult] = {}
        self._execution_logs: List[str] = []

    def execute(
        self,
        workflow: Workflow,
        context: ExecutionContext,
    ) -> WorkflowResult:
        """
        Execute a workflow with full dependency resolution

        Args:
            workflow: Workflow definition
            context: Execution context

        Returns:
            WorkflowResult with execution details
        """
        start_time = time.time()
        self._step_results = {}
        self._execution_logs = []

        self._log(f"Starting workflow: {workflow.name}")
        self._log(f"Type: {workflow.type}, Steps: {len(workflow.steps)}")

        try:
            # Check workflow condition
            if workflow.condition and not self._evaluate_condition(
                workflow.condition, context
            ):
                self._log("Workflow condition not met, skipping")
                return WorkflowResult(
                    success=True,
                    workflow=workflow.name,
                    execution_time_ms=0,
                    steps=[],
                    logs=self._execution_logs,
                )

            # Build execution graph
            execution_levels = self._build_execution_graph(workflow.steps)

            # Execute levels
            for level_index, level in enumerate(execution_levels):
                self._log(f"Executing level {level_index + 1}/{len(execution_levels)}: {len(level)} steps")

                if workflow.config.parallel and len(level) > 1:
                    # Parallel execution
                    results = self._execute_level_parallel(
                        level, workflow, context
                    )
                else:
                    # Sequential execution
                    results = self._execute_level_sequential(
                        level, workflow, context
                    )

                # Store results
                for result in results:
                    self._step_results[result.step_id] = result

                # Check for failures
                failures = [r for r in results if not r.success and not r.skipped]
                if failures and workflow.config.fail_fast:
                    self._log(f"Fail-fast triggered, stopping workflow")
                    break

            # Collect all results
            all_results = list(self._step_results.values())
            success = all(r.success or r.skipped for r in all_results)

            execution_time_ms = int((time.time() - start_time) * 1000)

            self._log(f"Workflow {'completed' if success else 'failed'} in {execution_time_ms}ms")

            return WorkflowResult(
                success=success,
                workflow=workflow.name,
                execution_time_ms=execution_time_ms,
                steps=all_results,
                logs=self._execution_logs,
                completed_at=datetime.utcnow(),
            )

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            self._log(f"Workflow error: {str(e)}")

            return WorkflowResult(
                success=False,
                workflow=workflow.name,
                execution_time_ms=execution_time_ms,
                steps=list(self._step_results.values()),
                logs=self._execution_logs,
                error=str(e),
                completed_at=datetime.utcnow(),
            )

    def _build_execution_graph(
        self, steps: List[WorkflowStep]
    ) -> List[List[WorkflowStep]]:
        """
        Build execution levels using topological sort

        Returns list of levels where each level can be executed in parallel
        """
        # Build dependency graph
        graph: Dict[str, Set[str]] = {step.id: set() for step in steps}
        in_degree: Dict[str, int] = {step.id: 0 for step in steps}
        step_map: Dict[str, WorkflowStep] = {step.id: step for step in steps}

        # Populate dependencies
        for step in steps:
            for dep in step.depends_on:
                if dep in graph:
                    graph[dep].add(step.id)
                    in_degree[step.id] += 1

        # Topological sort into levels
        levels: List[List[WorkflowStep]] = []
        remaining = set(step.id for step in steps)

        while remaining:
            # Find all steps with no remaining dependencies
            current_level = [
                step_id for step_id in remaining
                if in_degree[step_id] == 0
            ]

            if not current_level:
                raise ValueError("Circular dependency detected in workflow")

            # Add to levels
            levels.append([step_map[step_id] for step_id in current_level])

            # Update in-degrees
            for step_id in current_level:
                remaining.remove(step_id)
                for dependent in graph[step_id]:
                    in_degree[dependent] -= 1

        return levels

    def _execute_level_sequential(
        self,
        steps: List[WorkflowStep],
        workflow: Workflow,
        context: ExecutionContext,
    ) -> List[StepResult]:
        """Execute steps sequentially"""
        results: List[StepResult] = []
        for step in steps:
            result = self._execute_step(step, workflow, context)
            results.append(result)
        return results

    def _execute_level_parallel(
        self,
        steps: List[WorkflowStep],
        workflow: Workflow,
        context: ExecutionContext,
    ) -> List[StepResult]:
        """Execute steps in parallel with thread pool"""
        max_workers = min(len(steps), workflow.config.max_concurrent)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(self._execute_step, step, workflow, context): step
                for step in steps
            }

            results: List[StepResult] = []
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    step = futures[future]
                    results.append(
                        StepResult(
                            step_id=step.id,
                            success=False,
                            execution_time_ms=0,
                            error=str(e),
                        )
                    )

        return results

    def _execute_step(
        self,
        step: WorkflowStep,
        workflow: Workflow,
        context: ExecutionContext,
    ) -> StepResult:
        """Execute a single step"""
        start_time = time.time()

        self._log(f"Executing step: {step.name} ({step.id})")

        # Check condition
        if step.condition and not self._evaluate_condition(step.condition, context):
            self._log(f"  Condition not met, skipping")
            return StepResult(
                step_id=step.id,
                success=True,
                execution_time_ms=0,
                skipped=True,
            )

        try:
            timeout = step.timeout or workflow.config.timeout

            if step.type == StepType.COMMAND:
                result = self._execute_command_step(step, context, timeout)
            elif step.type == StepType.SCRIPT:
                result = self._execute_script_step(step, context, timeout)
            elif step.type == StepType.CONDITION:
                result = self._execute_condition_step(step, context)
            elif step.type == StepType.PARALLEL:
                result = self._execute_parallel_step(step, workflow, context)
            else:
                result = StepResult(
                    step_id=step.id,
                    success=False,
                    execution_time_ms=0,
                    error=f"Unsupported step type: {step.type}",
                )

            execution_time_ms = int((time.time() - start_time) * 1000)
            result.execution_time_ms = execution_time_ms

            if not result.success and step.continue_on_error:
                self._log(f"  Failed but continue_on_error=true")
                result.success = True  # Treat as success for workflow continuation

            self._log(f"  Exit code: {result.exit_code}, Time: {execution_time_ms}ms")

            return result

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            self._log(f"  Error: {str(e)}")

            return StepResult(
                step_id=step.id,
                success=step.continue_on_error,
                execution_time_ms=execution_time_ms,
                error=str(e),
            )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    def _execute_command_step(
        self,
        step: WorkflowStep,
        context: ExecutionContext,
        timeout: int,
    ) -> StepResult:
        """Execute a command step"""
        config = step.config
        command = config.get("command", "")
        args = config.get("args", [])
        cwd = config.get("cwd") or context.cwd

        # Validate security
        validation = self.security.validate_command(command, args)
        if not validation.valid:
            return StepResult(
                step_id=step.id,
                success=False,
                execution_time_ms=0,
                error=f"Security validation failed: {validation.errors}",
            )

        # Prepare environment
        env = {**os.environ, **context.env, **config.get("env", {})}

        # Execute
        full_command = [command, *args]

        try:
            result = subprocess.run(
                full_command,
                cwd=cwd,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            return StepResult(
                step_id=step.id,
                success=result.returncode == 0,
                exit_code=result.returncode,
                output=result.stdout.strip(),
                error=result.stderr.strip() if result.stderr else None,
            )

        except subprocess.TimeoutExpired:
            return StepResult(
                step_id=step.id,
                success=False,
                exit_code=-1,
                error=f"Timeout after {timeout}s",
            )

    def _execute_script_step(
        self,
        step: WorkflowStep,
        context: ExecutionContext,
        timeout: int,
    ) -> StepResult:
        """Execute a script step"""
        config = step.config
        script_path = config.get("path", "")
        interpreter = config.get("interpreter", "bash")
        args = config.get("args", [])

        # Validate path
        cwd = context.cwd
        full_path = os.path.join(cwd, script_path)

        if not os.path.exists(full_path):
            return StepResult(
                step_id=step.id,
                success=False,
                error=f"Script not found: {full_path}",
            )

        # Execute
        full_command = [interpreter, full_path, *args]

        try:
            result = subprocess.run(
                full_command,
                cwd=cwd,
                env={**os.environ, **context.env},
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            return StepResult(
                step_id=step.id,
                success=result.returncode == 0,
                exit_code=result.returncode,
                output=result.stdout.strip(),
                error=result.stderr.strip() if result.stderr else None,
            )

        except subprocess.TimeoutExpired:
            return StepResult(
                step_id=step.id,
                success=False,
                error=f"Timeout after {timeout}s",
            )

    def _execute_condition_step(
        self,
        step: WorkflowStep,
        context: ExecutionContext,
    ) -> StepResult:
        """Execute a condition step"""
        config = step.config
        expression = config.get("expression", "")

        # Simple expression evaluation
        # In production, use a proper expression engine like `simpleeval`
        condition_met = self._evaluate_condition(expression, context)

        return StepResult(
            step_id=step.id,
            success=True,
            output=f"Condition evaluated: {condition_met}",
        )

    def _execute_parallel_step(
        self,
        step: WorkflowStep,
        workflow: Workflow,
        context: ExecutionContext,
    ) -> StepResult:
        """Execute a parallel step"""
        config = step.config
        sub_steps_data = config.get("steps", [])

        # Create workflow steps from config
        from .parser import WorkflowParser
        parser = WorkflowParser()
        sub_steps = [parser._parse_step(s) for s in sub_steps_data]

        # Execute in parallel
        max_concurrent = config.get("max_concurrent", 4)
        results = self._execute_level_parallel(sub_steps, workflow, context)

        all_success = all(r.success or r.skipped for r in results)

        return StepResult(
            step_id=step.id,
            success=all_success,
            output=f"Executed {len(results)} parallel steps",
        )

    def _evaluate_condition(self, expression: str, context: ExecutionContext) -> bool:
        """
        Evaluate a condition expression safely using simpleeval.

        Supports:
        - env.VAR_NAME: Environment variables
        - git.branch: Current git branch
        - git.commit: Current git commit
        - Standard Python operators: ==, !=, <, >, in, not in, etc.
        """
        try:
            from simpleeval import SimpleEval

            # Build safe namespace
            names = {
                "env": context.env,
                "git": {
                    "branch": context.git_branch or "",
                    "commit": context.git_commit or "",
                },
                "true": True,
                "false": False,
                "null": None,
            }

            # Add string methods that are safe
            for name in ["len", "str", "int", "bool"]:
                names[name] = __builtins__.get(name) if isinstance(__builtins__, dict) else getattr(__builtins__, name, None)

            evaluator = SimpleEval(names=names)
            result = evaluator.eval(expression)

            return bool(result)

        except ImportError:
            # Fallback: basic placeholder replacement with safe evaluation
            self._log("Warning: simpleeval not installed, using limited evaluation")
            return self._evaluate_condition_fallback(expression, context)

        except Exception as e:
            self._log(f"Condition evaluation error: {e}")
            return False

    def _evaluate_condition_fallback(
        self, expression: str, context: ExecutionContext
    ) -> bool:
        """
        Fallback evaluation without simpleeval.
        Only supports basic equality checks.
        """
        try:
            # Simple pattern: env.VAR == "value" or git.branch == "main"
            import re

            # Replace env.VAR
            for key, value in context.env.items():
                expression = expression.replace(f"env.{key}", f"'{value}'")

            # Replace git.*
            if context.git_branch:
                expression = expression.replace("git.branch", f"'{context.git_branch}'")
            if context.git_commit:
                expression = expression.replace("git.commit", f"'{context.git_commit}'")

            # Only allow safe characters
            if not re.match(r"^[\w\s'\"=!<>.]+$"):
                self._log(f"Unsafe characters in expression: {expression}")
                return False

            # Very limited eval with no builtins
            allowed = {"__builtins__": {}}
            result = eval(expression, allowed, {})  # nosec: B307 - validated above
            return bool(result)

        except Exception as e:
            self._log(f"Fallback evaluation error: {e}")
            return False

    def _log(self, message: str) -> None:
        """Add log entry"""
        timestamp = datetime.utcnow().isoformat()
        self._execution_logs.append(f"[{timestamp}] {message}")
