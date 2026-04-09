# MCP Hook Runner

Workflow automation and hook management for Qoder IDE.

## Overview

The Hook Runner provides automation capabilities similar to Claude Code's hooks system, enabling pre/post actions and custom workflows for development tasks.

## Features

- **YAML Workflow Definitions**: Define complex automation in YAML
- **Multiple Step Types**: Command, script, condition, parallel execution
- **Dependency Graph**: Automatic dependency resolution with parallel execution
- **10 Hook Types**: pre-commit, post-commit, pre-push, etc.
- **Validation**: Schema validation with detailed error messages

## Workflow Format

```yaml
name: pre-commit-checks
description: Run pre-commit validation
type: pre-commit

config:
  failFast: true
  timeout: 300
  parallel: true
  maxConcurrent: 4

steps:
  - id: lint
    name: Run linter
    type: command
    config:
      command: npm
      args: ['run', 'lint']
    continueOnError: false

  - id: test
    name: Run tests
    type: command
    config:
      command: npm
      args: ['test']
    dependsOn: [lint]

  - id: security
    name: Security audit
    type: command
    config:
      command: npm
      args: ['audit', '--audit-level=moderate']
```

## Step Types

### Command Step

Execute a shell command:

```yaml
type: command
config:
  command: npm
  args: ['run', 'build']
  cwd: ./src
  env:
    NODE_ENV: production
```

### Script Step

Execute a script file:

```yaml
type: script
config:
  path: ./scripts/validate.sh
  interpreter: bash
  args: ['--strict']
```

### Condition Step

Conditional execution:

```yaml
type: condition
config:
  expression: "env.BRANCH === 'main'"
  then: ['deploy']
  else: ['skip-deploy']
```

### Parallel Step

Execute steps in parallel:

```yaml
type: parallel
config:
  steps:
    - id: test-unit
      name: Unit tests
      type: command
      config:
        command: npm
        args: ['run', 'test:unit']

    - id: test-integration
      name: Integration tests
      type: command
      config:
        command: npm
        args: ['run', 'test:integration']
  maxConcurrent: 2
```

## MCP Tools

### `run_workflow`

Execute a workflow by name.

```json
{
  "workflowName": "pre-commit-checks",
  "context": {
    "cwd": "/project",
    "env": { "NODE_ENV": "test" }
  }
}
```

### `run_hook`

Execute all workflows for a hook type.

```json
{
  "hookType": "pre-commit",
  "context": {
    "cwd": "/project"
  }
}
```

### `list_workflows`

List all available workflows.

```json
{
  "type": "pre-commit"
}
```

### `validate_workflow`

Validate a workflow YAML file.

```json
{
  "workflowPath": "./workflows/pre-commit.yaml"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QODER_HOOKS_PATH` | Workflows directory | `./workflows` |
| `QODER_HOOKS_TIMEOUT` | Default timeout (seconds) | `300` |
| `QODER_HOOKS_MAX_CONCURRENT` | Max parallel steps | `4` |
| `QODER_HOOKS_LOG_LEVEL` | Log level | `info` |

## License

MIT
