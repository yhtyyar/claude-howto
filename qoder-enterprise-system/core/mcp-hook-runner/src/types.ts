/**
 * Hook Runner Types
 * Type definitions for the MCP Hook Runner Server
 *
 * @module types
 * @version 1.0.0
 */

/**
 * Supported hook types
 */
export type HookType =
  | 'pre-commit'
  | 'post-commit'
  | 'pre-push'
  | 'post-push'
  | 'pre-merge'
  | 'post-merge'
  | 'pre-rebase'
  | 'post-rebase'
  | 'manual'
  | 'scheduled';

/**
 * Step execution type
 */
export type StepType = 'command' | 'script' | 'hook' | 'condition' | 'parallel';

/**
 * Workflow definition
 */
export interface Workflow {
  /** Workflow name */
  name: string;
  /** Description */
  description: string;
  /** Hook type trigger */
  type: HookType;
  /** Execution steps */
  steps: Step[];
  /** Configuration */
  config?: WorkflowConfig;
  /** Condition for execution */
  condition?: string;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  /** Stop on first failure */
  failFast: boolean;
  /** Maximum execution time (seconds) */
  timeout: number;
  /** Enable parallel execution */
  parallel: boolean;
  /** Max concurrent steps */
  maxConcurrent: number;
  /** Working directory */
  workingDirectory?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Workflow step
 */
export interface Step {
  /** Step ID */
  id: string;
  /** Step name */
  name: string;
  /** Step type */
  type: StepType;
  /** Step configuration */
  config: StepConfig;
  /** Condition for execution */
  condition?: string;
  /** Continue on failure */
  continueOnError?: boolean;
  /** Timeout (seconds) */
  timeout?: number;
  /** Dependencies (step IDs) */
  dependsOn?: string[];
}

/**
 * Step configuration
 */
export type StepConfig =
  | CommandStepConfig
  | ScriptStepConfig
  | HookStepConfig
  | ConditionStepConfig
  | ParallelStepConfig;

/**
 * Command step configuration
 */
export interface CommandStepConfig {
  /** Command to execute */
  command: string;
  /** Arguments */
  args?: string[];
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Script step configuration
 */
export interface ScriptStepConfig {
  /** Script path */
  path: string;
  /** Interpreter */
  interpreter?: string;
  /** Arguments */
  args?: string[];
}

/**
 * Hook step configuration
 */
export interface HookStepConfig {
  /** Hook name to call */
  hook: string;
  /** Arguments */
  args?: Record<string, unknown>;
}

/**
 * Condition step configuration
 */
export interface ConditionStepConfig {
  /** Expression to evaluate */
  expression: string;
  /** True branch */
  then: string[];
  /** False branch */
  else?: string[];
}

/**
 * Parallel step configuration
 */
export interface ParallelStepConfig {
  /** Steps to run in parallel */
  steps: Step[];
  /** Max concurrent */
  maxConcurrent?: number;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  /** Success flag */
  success: boolean;
  /** Workflow name */
  workflow: string;
  /** Execution time (ms) */
  executionTime: number;
  /** Step results */
  steps: StepResult[];
  /** Error message */
  error?: string;
  /** Output logs */
  logs: string[];
}

/**
 * Step execution result
 */
export interface StepResult {
  /** Step ID */
  stepId: string;
  /** Success flag */
  success: boolean;
  /** Execution time (ms) */
  executionTime: number;
  /** Exit code */
  exitCode?: number;
  /** Output */
  output: string;
  /** Error output */
  error?: string;
  /** Skipped */
  skipped?: boolean;
}

/**
 * Execution context
 */
export interface ExecutionContext {
  /** Working directory */
  cwd: string;
  /** Environment variables */
  env: Record<string, string>;
  /** Git information */
  git?: GitContext;
  /** Trigger information */
  trigger?: TriggerContext;
}

/**
 * Git context
 */
export interface GitContext {
  /** Current branch */
  branch: string;
  /** Commit hash */
  commit: string;
  /** Repository root */
  root: string;
  /** Staged files */
  stagedFiles: string[];
  /** Modified files */
  modifiedFiles: string[];
}

/**
 * Trigger context
 */
export interface TriggerContext {
  /** Hook type */
  type: HookType;
  /** Trigger time */
  timestamp: number;
  /** User info */
  user: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Runner configuration
 */
export interface RunnerConfig {
  /** Workflows directory */
  workflowsPath: string;
  /** Default timeout */
  defaultTimeout: number;
  /** Max concurrent steps */
  maxConcurrent: number;
  /** Enable logging */
  logging: boolean;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Workflow validation result
 */
export interface ValidationResult {
  /** Valid flag */
  valid: boolean;
  /** Errors */
  errors: ValidationError[];
  /** Warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Path to error */
  path: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Path to warning */
  path: string;
  /** Warning message */
  message: string;
}

/**
 * Runner statistics
 */
export interface RunnerStats {
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successfulExecutions: number;
  /** Failed executions */
  failedExecutions: number;
  /** Average execution time (ms) */
  averageExecutionTime: number;
  /** Workflows loaded */
  workflowsLoaded: number;
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Success flag */
  success: boolean;
  /** Exit code */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Execution time (ms) */
  executionTime: number;
}
