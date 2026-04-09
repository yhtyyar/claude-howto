# Qoder Enterprise System - Usage Examples

This directory contains practical examples for using the Qoder Enterprise System.

## Quick Start Examples

### 1. Intent Detection (Chat Mode)

```
User: "check this code"
→ Intent Router detects: code-review (confidence: 0.92)
→ Loads: specs/skills/code-review.md
→ Executes: Comprehensive code review

User: "create checkpoint"
→ Intent Router detects: checkpoint (confidence: 0.95)
→ Loads: specs/skills/checkpoint.md
→ Executes: Git-based checkpoint creation
```

### 2. Checkpoint Management (Agent Mode)

```
1. User: "Create checkpoint before refactoring"
2. Qoder: Activates checkpoint skill
3. MCP Server:
   - Stashes current changes
   - Creates git commit with metadata
   - Saves context to .qoder/checkpoints/
4. Returns: Checkpoint ID for later restoration
```

### 3. Workflow Automation (Quest Mode)

```
1. User: "Run pre-commit checks"
2. Hook Runner:
   - Loads workflows/pre-commit.yaml
   - Executes: lint → typecheck → test
   - Parallel execution with dependency graph
3. Returns: Success/failure with logs
```

## Integration with Qoder IDE

### Setting up MCP Servers

1. Open Qoder IDE settings
2. Add MCP server configuration:

```json
{
  "mcpServers": {
    "intent-router": {
      "command": "node",
      "args": [
        "/path/to/qoder-enterprise-system/core/mcp-intent-router/dist/server.js"
      ],
      "env": {
        "QODER_SPECS_PATH": "/path/to/qoder-enterprise-system/specs"
      }
    },
    "checkpoint-manager": {
      "command": "node",
      "args": [
        "/path/to/qoder-enterprise-system/core/mcp-checkpoint-manager/dist/server.js"
      ]
    },
    "hook-runner": {
      "command": "node",
      "args": [
        "/path/to/qoder-enterprise-system/core/mcp-hook-runner/dist/server.js"
      ],
      "env": {
        "QODER_HOOKS_PATH": "/path/to/qoder-enterprise-system/workflows"
      }
    }
  }
}
```

### Using Skills in Chat Mode

Simply type natural language commands:

```
"Review this code for security issues"
"Optimize this function for performance"
"Generate unit tests for this module"
"Create checkpoint before major changes"
"Refactor this to reduce complexity"
"Document this API endpoint"
```

### Using Skills in Agent Mode

1. Select code or files
2. Use the agent panel
3. Activate specific skill:
   - `/code-review` - Code analysis
   - `/optimize` - Performance optimization
   - `/test` - Test generation
   - `/refactor` - Code refactoring
   - `/docs` - Documentation generation

### Using Skills in Quest Mode

For complex tasks requiring multiple steps:

1. Start quest with skill activation
2. Set duration and checkpoints
3. Monitor progress
4. Review deliverables

## Example Workflows

### Pre-Commit Validation

```yaml
# workflows/pre-commit.yaml
name: pre-commit-checks
description: Run validation before commit
type: pre-commit

steps:
  - id: lint
    name: Run linter
    type: command
    config:
      command: npm
      args: ['run', 'lint']
  
  - id: test
    name: Run tests
    type: command
    config:
      command: npm
      args: ['test']
    dependsOn: [lint]
```

Usage:
```bash
# Automatically runs before git commit
# Or manually trigger via MCP:
# tools/call: run_hook with hookType: "pre-commit"
```

### Code Review Workflow

```typescript
// Example: Using Intent Router programmatically
const intentRouter = await connectMCPServer('intent-router');

const result = await intentRouter.callTool('detect_intent', {
  input: 'check this code',
  context: {
    currentFile: '/project/src/auth.ts',
    selection: 'login function'
  }
});

if (result.intent?.id === 'code-review') {
  // Load and execute code-review skill
  const skill = await loadSkill(result.intent.specPath);
  await executeSkill(skill, context);
}
```

### Checkpoint Creation

```typescript
// Example: Creating checkpoint before refactoring
const checkpointManager = await connectMCPServer('checkpoint-manager');

const checkpoint = await checkpointManager.callTool('create_checkpoint', {
  name: 'before-refactoring',
  description: 'Stable state before auth module refactoring',
  tags: ['refactoring', 'auth', 'pre-change'],
  prompt: 'Refactoring authentication module',
  keepStash: false
});

// Later: Restore if needed
await checkpointManager.callTool('restore_checkpoint', {
  checkpointId: checkpoint.checkpoint.id,
  force: false,
  createBranch: true,
  branchName: 'refactoring-rollback'
});
```

## Language-Specific Examples

### TypeScript/JavaScript Projects

```bash
# Setup
npm install
bash scripts/install.sh

# Run pre-commit hooks
npm run hooks:pre-commit

# Code review specific file
npx qoder skill code-review src/auth.ts

# Create checkpoint
npx qoder checkpoint create "before-refactoring"
```

### Python Projects

```bash
# Setup
pip install -r requirements.txt
bash scripts/install.sh

# Run pre-commit hooks
pre-commit run --all-files

# Code review
qoder skill code-review src/auth.py

# Create checkpoint
qoder checkpoint create "before-refactoring"
```

## Best Practices

### 1. Always Create Checkpoints Before Major Changes

```
Before: Start refactoring
After: "Create checkpoint refactoring-start"

If something goes wrong:
"Restore checkpoint refactoring-start"
```

### 2. Use Skills for Code Quality

```
Before: Commit code
After: "Run code review on changed files"

Before: Merge PR
After: "Check for security issues"
```

### 3. Automate with Workflows

```yaml
# workflows/pre-push.yaml
name: pre-push-validation
type: pre-push

steps:
  - id: security-scan
    name: Security audit
    type: command
    config:
      command: npm
      args: ['audit', '--audit-level=moderate']
    failFast: true
  
  - id: test-coverage
    name: Check coverage
    type: command
    config:
      command: npm
      args: ['run', 'test:coverage']
```

### 4. Chain Multiple Skills

```
1. "Create checkpoint before-optimization"
2. "Optimize this algorithm"
3. "Generate tests for optimized code"
4. "Review the changes"
5. If issues: "Restore checkpoint before-optimization"
```

## Troubleshooting

### MCP Server Not Responding

```bash
# Check if server is running
ps aux | grep mcp

# Restart specific server
cd core/mcp-intent-router && npm start
```

### Intent Not Detected

```bash
# Check intent patterns
qoder intents list

# Test detection manually
qoder intents test "your input here"
```

### Workflow Failing

```bash
# Validate workflow
qoder workflows validate workflows/pre-commit.yaml

# Run with verbose output
qoder workflows run pre-commit --verbose
```

## Additional Resources

- [Full Documentation](../README.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Skill Specifications](../specs/skills/)
- [API Reference](../docs/api.md)

---

**Need Help?** Open an issue or check the troubleshooting guide.
