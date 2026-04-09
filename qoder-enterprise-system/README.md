# Qoder Enterprise System

Enterprise-grade adaptation of [claude-howto](https://github.com/luongnv89/claude-howto) patterns for [Qoder IDE](https://qoder.com/).

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## Overview

This system brings the power of Claude Code's advanced features (slash commands, subagents, skills, hooks, checkpoints) to Qoder IDE through a sophisticated MCP-based architecture.

### What It Solves

| Claude Code Feature | Qoder Limitation | Our Solution |
|---------------------|------------------|--------------|
| `/slash` commands | Not available | Intent Router MCP + Spec files |
| Auto-invoke skills | Not available | Intent detection with 90%+ accuracy |
| Subagents | Not available | Expert Panel specs + Quest Mode |
| Checkpoints / Rewind | Not available | Git-based checkpoint manager |
| Hooks (pre/post) | Not available | Hook Runner MCP server |
| CLAUDE.md memory | Repo Wiki | Enhanced project specs |

## Quick Start

```bash
# 1. Clone and enter directory
git clone <repository>
cd qoder-enterprise-system

# 2. Run installer
bash scripts/install.sh

# 3. Configure MCP in Qoder
# Add config/mcp-servers.json to Qoder MCP settings

# 4. Start using
# In Qoder: "Create checkpoint before refactoring"
# In Qoder: "Run code review on this file"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         QODER IDE                               │
├─────────────────────────────────────────────────────────────────┤
│  Chat Mode │ Agent Mode │ Quest Mode │ Expert Panel            │
└────────────────────┬──────────────────────────────────────────┘
                     │
┌────────────────────┴──────────────────────────────────────────┐
│                      MCP SERVERS                                │
├─────────────────┬──────────────────┬──────────────────────────┤
│ Intent Router   │ Checkpoint       │ Hook Runner              │
│ - Pattern match │ - Git snapshots  │ - Workflow automation    │
│ - Routing       │ - Restore state  │ - Pre/post actions       │
│ - Caching       │ - Context save   │ - Validation            │
└─────────────────┴──────────────────┴──────────────────────────┘
                     │
┌────────────────────┴──────────────────────────────────────────┐
│                      SPECIFICATIONS                             │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ System       │ Skills       │ Agents       │ Tasks              │
│ - Config     │ - Code Review│ - Security   │ - Create PR        │
│ - Routing    │ - Optimize   │ - Performance│ - Setup CI/CD      │
│ - Workflows  │ - Docs       │ - Testing    │ - Refactor         │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

## Components

### MCP Servers

#### 1. Intent Router (`core/mcp-intent-router/`)
Detects user intent and routes to appropriate specifications.

**Features:**
- 4 pattern types: exact, regex, semantic, fuzzy
- Context-aware confidence boosting
- LRU caching for performance
- Hot reload of intents

**Tools:**
- `detect_intent` - Main intent detection
- `list_intents` - Browse available intents
- `reload_intents` - Hot reload
- `get_stats` - Performance metrics

#### 2. Checkpoint Manager (`core/mcp-checkpoint-manager/`)
Git-based state management for safe experimentation.

**Features:**
- Create named checkpoints
- Restore to any point
- Full context preservation
- Automatic cleanup

**Tools:**
- `create_checkpoint` - Save state
- `restore_checkpoint` - Restore state
- `list_checkpoints` - Browse history
- `diff_checkpoints` - Compare states

#### 3. Hook Runner (`core/mcp-hook-runner/`)
Automation workflows for development tasks.

**Features:**
- Pre-commit validation
- Post-merge actions
- Custom workflow definitions
- Parallel execution

**Tools:**
- `run_hook` - Execute workflow
- `list_hooks` - Browse workflows
- `validate_workflow` - Check YAML syntax

## Specifications

### Intent Definitions

```yaml
---
id: "code-review"
name: "Code Review"
description: "Comprehensive code review"
category: "quality"
priority: 1
spec_path: "specs/skills/code-review.md"

patterns:
  - type: "exact"
    value: "code review"
    weight: 1.0
  - type: "regex"
    value: "(review|check)\s+(this|the)\s+code"
    weight: 0.9

confidence_threshold: 0.8
```

### Skill Specifications

Located in `specs/skills/`, define capabilities for:
- Code Review
- Performance Optimization
- Test Generation
- Documentation
- Refactoring

### Agent Specifications

Located in `specs/agents/`, define specialized agents for:
- Security Reviewer
- Performance Analyzer
- Test Engineer
- Documentation Writer

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QODER_SPECS_PATH` | Path to specs | `./specs` |
| `QODER_CACHE_ENABLED` | Enable caching | `true` |
| `QODER_CACHE_TTL` | Cache TTL | `300` |
| `QODER_MIN_CONFIDENCE` | Min confidence | `0.8` |

### Project Spec

Create `.qoder/project-spec.md` in your project:

```markdown
---
type: project-spec
version: 1.0
---

# My Project

## Overview
- Stack: TypeScript, Node.js
- Team: 5 developers

## Standards
- Prettier, ESLint
- Jest for testing
- Conventional commits
```

## Usage Examples

### Intent Detection
```
User: "check this code"
→ Intent Router detects: code-review (confidence: 0.95)
→ Loads: specs/skills/code-review.md
→ Executes review workflow
```

### Checkpoint Management
```
User: "Create checkpoint before-refactoring"
→ Checkpoint Manager:
  1. Stashes changes
  2. Creates empty commit with metadata
  3. Saves context to .qoder/checkpoints/
→ Returns: checkpoint ID

User: "Restore checkpoint before-refactoring"
→ Checkpoint Manager:
  1. Finds checkpoint by name
  2. git reset --hard <commit>
  3. Restores context
→ Project restored to previous state
```

### Hook Automation
```yaml
# workflows/pre-commit.yaml
name: pre-commit
steps:
  - name: Run tests
    command: npm test
    fail_fast: true
  
  - name: Check linting
    command: npm run lint
  
  - name: Security audit
    command: npm audit --audit-level moderate
```

## Development

```bash
# Install dependencies
npm ci

# Build all MCP servers
npm run build:all

# Run tests
npm test

# Validate specs
npm run validate:specs

# Development mode
npm run dev:intent  # Intent Router
npm run dev:checkpoint  # Checkpoint Manager
npm run dev:hooks  # Hook Runner
```

## Project Structure

```
qoder-enterprise-system/
├── config/                    # Configuration files
│   ├── mcp-servers.json      # MCP server registry
│   ├── qoder.yaml            # System configuration
│   └── intents.yaml          # Intent definitions
├── core/                      # MCP servers
│   ├── mcp-intent-router/   # Intent detection
│   ├── mcp-checkpoint-manager/ # State management
│   └── mcp-hook-runner/     # Automation
├── specs/                     # Specifications
│   ├── _templates/           # Reusable templates
│   ├── system/              # System specs
│   ├── skills/              # Skill specs
│   ├── agents/              # Agent specs
│   ├── tasks/               # Task specs
│   └── panels/              # Multi-agent panels
├── workflows/                 # Workflow definitions
├── scripts/                   # Utility scripts
└── docs/                      # Documentation
```

## Roadmap

- [x] Phase 1: Foundation (MCP Registry, Bootstrap)
- [x] Phase 1: Intent Router Core
- [ ] Phase 2: Checkpoint System
- [ ] Phase 3: Hook Automation
- [ ] Phase 4: Skill Library
- [ ] Phase 5: Advanced Features
- [ ] Phase 6: Testing & Documentation

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file.

---

**Built with ❤️ by CTO Architecture Team**

*Bridging the gap between Claude Code and Qoder IDE*
