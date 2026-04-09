/**
 * Workflow Executor
 * Executes workflow steps
 *
 * @module executor
 * @version 1.0.0
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  Workflow,
  Step,
  WorkflowResult,
  StepResult,
  ExecutionContext,
  CommandResult,
} from './types.js';

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflow: Workflow,
  context: ExecutionContext
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const stepResults: StepResult[] = [];
  const logs: string[] = [];

  log(logs, `Starting workflow: ${workflow.name}`);
  log(logs, `Type: ${workflow.type}`);
  log(logs, `Steps: ${workflow.steps.length}`);

  // Check condition if present
  if (workflow.condition && !evaluateCondition(workflow.condition, context)) {
    log(logs, 'Workflow condition not met, skipping');
    return {
      success: true,
      workflow: workflow.name,
      executionTime: Date.now() - startTime,
      steps: [],
      logs,
    };
  }

  // Build execution graph
  const executionGraph = buildExecutionGraph(workflow.steps);

  try {
    for (const level of executionGraph) {
      // Execute steps in this level (in parallel if configured)
      const levelResults = await executeLevel(
        level,
        workflow,
        context,
        stepResults,
        logs
      );

      stepResults.push(...levelResults);

      // Check for failures
      const failures = levelResults.filter((r) => !r.success && !r.skipped);
      if (failures.length > 0 && workflow.config.failFast) {
        log(logs, `Fail-fast triggered, stopping workflow`);
        break;
      }
    }

    const success = stepResults.every((r) => r.success || r.skipped);

    log(logs, `Workflow ${success ? 'completed' : 'failed'}`);

    return {
      success,
      workflow: workflow.name,
      executionTime: Date.now() - startTime,
      steps: stepResults,
      logs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(logs, `Workflow error: ${errorMessage}`);

    return {
      success: false,
      workflow: workflow.name,
      executionTime: Date.now() - startTime,
      steps: stepResults,
      error: errorMessage,
      logs,
    };
  }
}

/**
 * Build execution graph (levels based on dependencies)
 */
function buildExecutionGraph(steps: Step[]): Step[][] {
  const graph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const step of steps) {
    graph.set(step.id, new Set());
    inDegree.set(step.id, 0);
  }

  // Build graph
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        graph.get(dep)?.add(step.id);
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
      }
    }
  }

  // Topological sort into levels
  const levels: Step[][] = [];
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  while (stepMap.size > 0) {
    const currentLevel: Step[] = [];

    for (const [id, step] of stepMap) {
      if ((inDegree.get(id) || 0) === 0) {
        currentLevel.push(step);
      }
    }

    if (currentLevel.length === 0) {
      throw new Error('Circular dependency detected');
    }

    levels.push(currentLevel);

    // Remove processed steps
    for (const step of currentLevel) {
      stepMap.delete(step.id);

      // Update in-degrees
      for (const dependent of graph.get(step.id) || []) {
        inDegree.set(dependent, (inDegree.get(dependent) || 0) - 1);
      }
    }
  }

  return levels;
}

/**
 * Execute a level of steps
 */
async function executeLevel(
  steps: Step[],
  workflow: Workflow,
  context: ExecutionContext,
  previousResults: StepResult[],
  logs: string[]
): Promise<StepResult[]> {
  if (workflow.config.parallel && steps.length > 1) {
    // Execute in parallel with concurrency limit
    const maxConcurrent = workflow.config.maxConcurrent;
    const results: StepResult[] = [];

    for (let i = 0; i < steps.length; i += maxConcurrent) {
      const batch = steps.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map((step) => executeStep(step, context, previousResults, logs))
      );
      results.push(...batchResults);
    }

    return results;
  } else {
    // Execute sequentially
    const results: StepResult[] = [];

    for (const step of steps) {
      const result = await executeStep(step, context, previousResults, logs);
      results.push(result);
    }

    return results;
  }
}

/**
 * Execute a single step
 */
async function executeStep(
  step: Step,
  context: ExecutionContext,
  previousResults: StepResult[],
  logs: string[]
): Promise<StepResult> {
  const startTime = Date.now();

  log(logs, `Executing step: ${step.name} (${step.id})`);

  // Check condition
  if (step.condition && !evaluateCondition(step.condition, context)) {
    log(logs, `  Condition not met, skipping`);
    return {
      stepId: step.id,
      success: true,
      executionTime: Date.now() - startTime,
      output: '',
      skipped: true,
    };
  }

  try {
    let result: CommandResult;

    switch (step.type) {
      case 'command':
        result = await executeCommandStep(step, context);
        break;

      case 'script':
        result = await executeScriptStep(step, context);
        break;

      case 'hook':
        result = await executeHookStep(step, context);
        break;

      case 'condition':
        result = await executeConditionStep(step, context, previousResults, logs);
        break;

      case 'parallel':
        result = await executeParallelStep(step, context, previousResults, logs);
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    log(logs, `  Exit code: ${result.exitCode}`);

    const success = result.success || step.continueOnError === true;

    return {
      stepId: step.id,
      success,
      executionTime: Date.now() - startTime,
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(logs, `  Error: ${errorMessage}`);

    return {
      stepId: step.id,
      success: step.continueOnError === true,
      executionTime: Date.now() - startTime,
      output: '',
      error: errorMessage,
    };
  }
}

/**
 * Execute command step
 */
async function executeCommandStep(
  step: Step,
  context: ExecutionContext
): Promise<CommandResult> {
  const config = step.config as { command: string; args?: string[]; cwd?: string; env?: Record<string, string> };
  const command = config.command;
  const args = config.args || [];
  const cwd = config.cwd || context.cwd;
  const env = { ...process.env, ...context.env, ...config.env };

  return runCommand(command, args, { cwd, env, timeout: step.timeout });
}

/**
 * Execute script step
 */
async function executeScriptStep(
  step: Step,
  context: ExecutionContext
): Promise<CommandResult> {
  const config = step.config as { path: string; interpreter?: string; args?: string[] };
  const scriptPath = path.resolve(context.cwd, config.path);

  // Check if script exists
  try {
    await fs.access(scriptPath);
  } catch {
    return {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: `Script not found: ${scriptPath}`,
      executionTime: 0,
    };
  }

  // Make script executable
  try {
    await fs.chmod(scriptPath, 0o755);
  } catch {
    // Ignore chmod errors
  }

  const interpreter = config.interpreter || 'bash';
  const args = config.args || [];

  return runCommand(interpreter, [scriptPath, ...args], {
    cwd: context.cwd,
    env: context.env,
    timeout: step.timeout,
  });
}

/**
 * Execute hook step
 */
async function executeHookStep(
  step: Step,
  context: ExecutionContext
): Promise<CommandResult> {
  // Hook steps reference other workflows - for now, return success
  // This would need the workflow registry to execute nested workflows
  return {
    success: true,
    exitCode: 0,
    stdout: `Hook ${(step.config as { hook: string }).hook} called`,
    stderr: '',
    executionTime: 0,
  };
}

/**
 * Execute condition step
 */
async function executeConditionStep(
  step: Step,
  context: ExecutionContext,
  previousResults: StepResult[],
  logs: string[]
): Promise<CommandResult> {
  const config = step.config as {
    expression: string;
    then: string[];
    else?: string[];
  };

  const condition = evaluateCondition(config.expression, context);

  log(logs, `  Condition ${config.expression}: ${condition}`);

  // Return success, actual branches would be separate steps
  return {
    success: true,
    exitCode: 0,
    stdout: `Condition evaluated: ${condition}`,
    stderr: '',
    executionTime: 0,
  };
}

/**
 * Execute parallel step
 */
async function executeParallelStep(
  step: Step,
  context: ExecutionContext,
  previousResults: StepResult[],
  logs: string[]
): Promise<CommandResult> {
  const config = step.config as { steps: Step[]; maxConcurrent?: number };

  // Execute sub-steps in parallel
  const results = await Promise.all(
    config.steps.map((subStep) => executeStep(subStep, context, previousResults, logs))
  );

  const allSuccess = results.every((r) => r.success);

  return {
    success: allSuccess,
    exitCode: allSuccess ? 0 : 1,
    stdout: `Executed ${results.length} parallel steps`,
    stderr: '',
    executionTime: Math.max(...results.map((r) => r.executionTime)),
  };
}

/**
 * Run a command
 */
function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env: Record<string, string>;
    timeout?: number;
  }
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeoutMs = (options.timeout || 300) * 1000;

    const proc = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
    }, timeoutMs);

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);

      resolve({
        success: code === 0 && !killed,
        exitCode: code ?? -1,
        stdout: stdout.trim(),
        stderr: stderr.trim() || (killed ? 'Timeout exceeded' : ''),
        executionTime: Date.now() - startTime,
      });
    });

    proc.on('error', (error) => {
      clearTimeout(timeoutId);

      resolve({
        success: false,
        exitCode: -1,
        stdout: stdout.trim(),
        stderr: error.message,
        executionTime: Date.now() - startTime,
      });
    });
  });
}

/**
 * Evaluate condition expression
 */
function evaluateCondition(expression: string, context: ExecutionContext): boolean {
  // Simple condition evaluation
  // Supports: env.VAR_NAME, git.branch, git.commit, etc.

  try {
    // Replace placeholders with actual values
    let evaluated = expression;

    // Replace env.*
    evaluated = evaluated.replace(/env\.(\w+)/g, (_, key) => {
      return JSON.stringify(context.env[key] || '');
    });

    // Replace git.*
    if (context.git) {
      evaluated = evaluated.replace(/git\.(\w+)/g, (_, key) => {
        const value = (context.git as Record<string, unknown>)[key];
        return JSON.stringify(value || '');
      });
    }

    // Evaluate as JavaScript (safe for simple expressions)
    return new Function(`return ${evaluated}`)();
  } catch {
    return false;
  }
}

/**
 * Log message
 */
function log(logs: string[], message: string): void {
  const timestamp = new Date().toISOString();
  logs.push(`[${timestamp}] ${message}`);
}
