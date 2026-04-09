/**
 * MCP Hook Runner
 * Main entry point for the hook automation module
 *
 * @packageDocumentation
 * @module index
 * @version 1.0.0
 */

export { executeWorkflow } from './executor.js';
export {
  parseWorkflowFile,
  parseWorkflowYaml,
  loadWorkflows,
  getWorkflowByName,
  getWorkflowsByType,
} from './workflow-parser.js';

export type {
  Workflow,
  WorkflowConfig,
  Step,
  StepConfig,
  StepType,
  HookType,
  WorkflowResult,
  StepResult,
  ExecutionContext,
  GitContext,
  TriggerContext,
  RunnerConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  RunnerStats,
  CommandResult,
} from './types.js';

/**
 * Library version
 */
export const VERSION = '1.0.0';

/**
 * Library name
 */
export const NAME = '@qoder-enterprise/mcp-hook-runner';
