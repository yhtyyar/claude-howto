/**
 * Workflow Parser
 * Parses YAML workflow definitions
 *
 * @module workflow-parser
 * @version 1.0.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import type { Workflow, WorkflowConfig, Step, ValidationResult } from './types.js';

/** Step schema */
const StepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['command', 'script', 'hook', 'condition', 'parallel']),
  config: z.record(z.unknown()),
  condition: z.string().optional(),
  continueOnError: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  dependsOn: z.array(z.string()).optional(),
});

/** Workflow schema */
const WorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum([
    'pre-commit',
    'post-commit',
    'pre-push',
    'post-push',
    'pre-merge',
    'post-merge',
    'pre-rebase',
    'post-rebase',
    'manual',
    'scheduled',
  ]),
  steps: z.array(StepSchema).min(1),
  config: z
    .object({
      failFast: z.boolean().optional(),
      timeout: z.number().int().positive().optional(),
      parallel: z.boolean().optional(),
      maxConcurrent: z.number().int().positive().optional(),
      workingDirectory: z.string().optional(),
      env: z.record(z.string()).optional(),
    })
    .optional(),
  condition: z.string().optional(),
});

/**
 * Parse workflow from YAML file
 */
export async function parseWorkflowFile(filePath: string): Promise<{
  workflow: Workflow;
  validation: ValidationResult;
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseWorkflowYaml(content, filePath);
  } catch (error) {
    return {
      workflow: {} as Workflow,
      validation: {
        valid: false,
        errors: [
          {
            path: filePath,
            message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
            code: 'FILE_READ_ERROR',
          },
        ],
        warnings: [],
      },
    };
  }
}

/**
 * Parse workflow from YAML string
 */
export function parseWorkflowYaml(
  yamlContent: string,
  source?: string
): { workflow: Workflow; validation: ValidationResult } {
  try {
    // Parse YAML
    const parsed = yaml.load(yamlContent) as Record<string, unknown>;

    // Validate with Zod
    const result = WorkflowSchema.safeParse(parsed);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      return {
        workflow: {} as Workflow,
        validation: {
          valid: false,
          errors,
          warnings: [],
        },
      };
    }

    // Transform to Workflow type
    const workflow: Workflow = {
      name: result.data.name,
      description: result.data.description,
      type: result.data.type,
      steps: result.data.steps as unknown as Step[],
      condition: result.data.condition,
      config: {
        failFast: result.data.config?.failFast ?? true,
        timeout: result.data.config?.timeout ?? 300,
        parallel: result.data.config?.parallel ?? false,
        maxConcurrent: result.data.config?.maxConcurrent ?? 4,
        workingDirectory: result.data.config?.workingDirectory,
        env: result.data.config?.env,
      },
    };

    // Additional validation
    const validation = validateWorkflow(workflow);

    return { workflow, validation };
  } catch (error) {
    return {
      workflow: {} as Workflow,
      validation: {
        valid: false,
        errors: [
          {
            path: source || 'unknown',
            message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
            code: 'PARSE_ERROR',
          },
        ],
        warnings: [],
      },
    };
  }
}

/**
 * Validate workflow for logical errors
 */
function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  // Check for duplicate step IDs
  const stepIds = new Set<string>();
  for (const step of workflow.steps) {
    if (stepIds.has(step.id)) {
      errors.push({
        path: `steps.${step.id}`,
        message: `Duplicate step ID: ${step.id}`,
        code: 'DUPLICATE_STEP_ID',
      });
    }
    stepIds.add(step.id);
  }

  // Check dependencies exist
  for (const step of workflow.steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepIds.has(dep)) {
          errors.push({
            path: `steps.${step.id}.dependsOn`,
            message: `Dependency not found: ${dep}`,
            code: 'MISSING_DEPENDENCY',
          });
        }
      }
    }
  }

  // Check for circular dependencies
  const circular = detectCircularDependencies(workflow.steps);
  if (circular) {
    errors.push({
      path: 'steps',
      message: `Circular dependency detected: ${circular.join(' -> ')}`,
      code: 'CIRCULAR_DEPENDENCY',
    });
  }

  // Validate step configs
  for (const step of workflow.steps) {
    const stepValidation = validateStepConfig(step);
    errors.push(...stepValidation.errors.map((e) => ({ ...e, path: `steps.${step.id}.${e.path}` })));
    warnings.push(...stepValidation.warnings.map((w) => ({ ...w, path: `steps.${step.id}.${w.path}` })));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate step configuration
 */
function validateStepConfig(step: Step): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  switch (step.type) {
    case 'command':
      if (!(step.config as any).command || typeof (step.config as any).command !== 'string') {
        errors.push({
          path: 'config.command',
          message: 'Command step requires config.command',
          code: 'MISSING_COMMAND',
        });
      }
      break;

    case 'script':
      if (!(step.config as any).path || typeof (step.config as any).path !== 'string') {
        errors.push({
          path: 'config.path',
          message: 'Script step requires config.path',
          code: 'MISSING_SCRIPT_PATH',
        });
      }
      break;

    case 'hook':
      if (!(step.config as any).hook || typeof (step.config as any).hook !== 'string') {
        errors.push({
          path: 'config.hook',
          message: 'Hook step requires config.hook',
          code: 'MISSING_HOOK_NAME',
        });
      }
      break;

    case 'condition':
      if (!(step.config as any).expression || typeof (step.config as any).expression !== 'string') {
        errors.push({
          path: 'config.expression',
          message: 'Condition step requires config.expression',
          code: 'MISSING_EXPRESSION',
        });
      }
      if (!(step.config as any).then || !Array.isArray((step.config as any).then)) {
        errors.push({
          path: 'config.then',
          message: 'Condition step requires config.then array',
          code: 'MISSING_THEN_BRANCH',
        });
      }
      break;

    case 'parallel':
      if (!(step.config as any).steps || !Array.isArray((step.config as any).steps)) {
        errors.push({
          path: 'config.steps',
          message: 'Parallel step requires config.steps array',
          code: 'MISSING_PARALLEL_STEPS',
        });
      }
      break;
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Detect circular dependencies in steps
 */
function detectCircularDependencies(steps: Step[]): string[] | null {
  const graph = new Map<string, Set<string>>();

  // Build graph
  for (const step of steps) {
    graph.set(step.id, new Set(step.dependsOn || []));
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const deps = graph.get(node) || new Set();
    for (const dep of deps) {
      if (!visited.has(dep)) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      } else if (recursionStack.has(dep)) {
        // Found cycle
        const cycleStart = path.indexOf(dep);
        return path.slice(cycleStart).concat([dep]);
      }
    }

    path.pop();
    recursionStack.delete(node);
    return null;
  }

  for (const step of steps) {
    if (!visited.has(step.id)) {
      const cycle = dfs(step.id);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * Load all workflows from directory
 */
export async function loadWorkflows(workflowsPath: string): Promise<{
  workflows: Workflow[];
  errors: Array<{ file: string; error: string }>;
}> {
  const workflows: Workflow[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  try {
    const entries = await fs.readdir(workflowsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        const filePath = path.join(workflowsPath, entry.name);

        try {
          const { workflow, validation } = await parseWorkflowFile(filePath);

          if (validation.valid) {
            workflows.push(workflow);
          } else {
            const errorMessages = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
            errors.push({ file: entry.name, error: errorMessages });
          }
        } catch (error) {
          errors.push({
            file: entry.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    errors.push({
      file: workflowsPath,
      error: `Failed to read workflows directory: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return { workflows, errors };
}

/**
 * Get workflow by name
 */
export function getWorkflowByName(workflows: Workflow[], name: string): Workflow | undefined {
  return workflows.find((w) => w.name === name);
}

/**
 * Get workflows by type
 */
export function getWorkflowsByType(workflows: Workflow[], type: string): Workflow[] {
  return workflows.filter((w) => w.type === type);
}
