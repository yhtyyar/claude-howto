# Стратегический план внедрения: Claude-Howto Adaptation for Qoder

**Версия:** 1.0  
**Автор:** CTO Architecture Team  
**Статус:** Draft for Review  
**Timeline:** 6-8 недель (MVP 2 недели)

---

## Executive Summary

### Цель
Создание enterprise-grade системы адаптации claude-howto паттернов для Qoder IDE с компенсацией критических пробелов через custom MCP servers и spec-driven architecture.

### Business Value
- **Снижение затрат:** Переход с Claude Code ($20/мес) на Qoder (Free-$15/мес) с сохранением 90%+ функционала
- **Повышение эффективности:** Автоматизация рутинных операций через Intent Router и Hooks Replacement
- **Risk Mitigation:** Git-based checkpoints для безопасного экспериментирования

### Key Metrics (KPIs)
| Метрика | Baseline | Target | Measurement |
|---------|----------|--------|-------------|
| Time-to-task (code review) | 15 min | 5 min | Average task completion |
| Automation coverage | 0% | 60% | % tasks with auto-trigger |
| Context switch overhead | High | Low | Developer satisfaction |
| Error recovery time | 30 min | 5 min | Checkpoint restore time |

---

## Phase 0: Архитектура и Стратегия (Week 1)

### 0.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QODER ECOSYSTEM LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     USER INTERFACE LAYER                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Chat Mode  │  │  Agent Mode  │  │  Quest Mode  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────┬─────────────────────────────────────┘   │
│                                │                                           │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                     ORCHESTRATION LAYER                            │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │              INTENT ROUTER SYSTEM (Core)                   │  │   │
│  │  │  • Pattern Matching Engine                                │  │   │
│  │  │  • Context-Aware Dispatcher                               │  │   │
│  │  │  • Skill Registry                                         │  │   │
│  │  └─────────────────────────┬──────────────────────────────────┘  │   │
│  │                            │                                     │   │
│  │  ┌─────────────────────────▼──────────────────────────────────┐  │   │
│  │  │              SPECIFICATION RUNTIME                       │  │   │
│  │  │  • YAML Frontmatter Parser                                │  │   │
│  │  │  • Template Engine                                        │  │   │
│  │  │  • Context Injector                                       │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                │                                           │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                     SERVICE LAYER                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │   CHECKPOINT │  │   HOOK       │  │   CONTEXT    │            │   │
│  │  │   MANAGER    │  │   RUNNER     │  │   MANAGER    │            │   │
│  │  │  (MCP)       │  │  (MCP)       │  │  (MCP)       │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                │                                           │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                     STORAGE LAYER                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │  Spec Files  │  │  Git Hooks   │  │  Checkpoints │            │   │
│  │  │  (.md)       │  │  (scripts)   │  │  (git+meta)  │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 0.2 Technology Stack

| Компонент | Технология | Justification |
|-----------|-----------|---------------|
| MCP Servers | Node.js 18+ / Python 3.10+ | Native Qoder MCP support |
| Spec Engine | YAML Frontmatter + Markdown | Human-readable, versionable |
| Intent Router | TypeScript | Type safety, maintainability |
| Checkpoint Storage | Git + JSON metadata | Existing infrastructure |
| Hook System | Shell scripts + MCP | Cross-platform compatibility |
| Context Management | JSON + Markdown | Simplicity, portability |

### 0.3 Project Structure

```
qoder-enterprise-system/
├── README.md                          # Executive summary & quick start
├── ARCHITECTURE.md                    # Detailed architecture docs
├── package.json                       # Node dependencies (MCP servers)
├── requirements.txt                   # Python dependencies (optional tools)
│
├── config/                            # Global configuration
│   ├── qoder.yaml                     # Main Qoder config
│   ├── mcp-servers.json               # MCP server registry
│   └── intents.yaml                   # Intent mapping definitions
│
├── core/                              # Core runtime (MCP servers)
│   ├── mcp-intent-router/             # Intent detection & routing
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├──
│   ├── mcp-checkpoint-manager/          # Git-based checkpoint system
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── mcp-hook-runner/               # Hook automation system
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── specs/                             # Specification Library
│   ├── _templates/                    # Reusable spec templates
│   │   ├── agent-spec.template.md
│   │   ├── skill-spec.template.md
│   │   └── task-spec.template.md
│   ├──
│   ├── system/                          # System-level specs
│   │   ├── intent-router.md           # Router configuration
│   │   ├── checkpoint-manager.md      # Checkpoint workflows
│   │   └── hook-automation.md         # Hook definitions
│   │
│   ├── skills/                        # Skill specifications
│   │   ├── code-review.md
│   │   ├── performance-optimization.md
│   │   ├── documentation-generation.md
│   │   └── test-generation.md
│   │
│   ├── agents/                        # Agent specifications
│   │   ├── security-reviewer.md
│   │   ├── performance-analyzer.md
│   │   ├── test-engineer.md
│   │   └── refactoring-specialist.md
│   │
│   ├── tasks/                         # Task specifications
│   │   ├── optimize-code.md
│   │   ├── create-pull-request.md
│   │   ├── security-audit.md
│   │   └── refactor-module.md
│   │
│   └── panels/                        # Multi-agent panels
│       ├── code-review-panel.md
│       └── architecture-review-panel.md
│
├── workflows/                         # Workflow definitions
│   ├── pre-commit.yaml
│   ├── pre-push.yaml
│   └── daily-cleanup.yaml
│
├── scripts/                           # Utility scripts
│   ├── install.sh                     # System installer
│   ├── migrate-from-claude.sh         # Migration tool
│   └── validate-specs.sh              # Spec validator
│
└── docs/                              # Documentation
    ├── setup-guide.md
    ├── developer-guide.md
    ├── troubleshooting.md
    └── examples/
```

### 0.4 Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Qoder API changes | Medium | High | Abstract layer, version pinning |
| MCP compatibility issues | Low | Medium | Test with multiple Qoder versions |
| Performance degradation | Low | High | Caching, lazy loading |
| Developer adoption resistance | Medium | Medium | Training, documentation, gradual rollout |
| Git conflicts in checkpoints | Medium | Low | Clear naming convention, auto-cleanup |

### 0.5 Success Criteria

**Phase 1 (MVP) Success:**
- [ ] Intent Router распознаёт 5+ базовых паттернов
- [ ] Checkpoint create/restore < 10 секунд
- [ ] Pre-commit hook запускается без ошибок
- [ ] 3 skills работают через router

**Phase 2 (Production) Success:**
- [ ] 15+ skills активны
- [ ] 80%+ accuracy intent detection
- [ ] Zero manual hook interventions
- [ ] < 5% context switch overhead

---

## Phase 1: Foundation Layer (Week 1-2)

### 1.1 MCP Infrastructure Setup

#### 1.1.1 Task: MCP Server Registry
**Priority:** P0  
**Effort:** 4 hours  
**Owner:** DevOps/Platform Team

**TODO:**
- [ ] Create `config/mcp-servers.json` with server definitions
- [ ] Define environment variable mappings
- [ ] Create installation script for MCP servers
- [ ] Test connectivity with Qoder

**Implementation:**
```json
{
  "mcpServers": {
    "qoder-intent-router": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/core/mcp-intent-router/dist/index.js"],
      "env": {
        "QODER_SPECS_PATH": "${PROJECT_ROOT}/specs",
        "QODER_LOG_LEVEL": "info"
      }
    },
    "qoder-checkpoint": {
      "command": "node", 
      "args": ["${PROJECT_ROOT}/core/mcp-checkpoint-manager/dist/index.js"],
      "env": {
        "QODER_GIT_AUTO_COMMIT": "true",
        "QODER_CHECKPOINT_PREFIX": "[qoder-chk]"
      }
    },
    "qoder-hooks": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/core/mcp-hook-runner/dist/index.js"],
      "env": {
        "QODER_HOOKS_PATH": "${PROJECT_ROOT}/workflows"
      }
    }
  }
}
```

**Acceptance Criteria:**
- All 3 MCP servers start without errors
- Qoder recognizes and connects to servers
- Environment variables resolve correctly

---

#### 1.1.2 Task: Project Bootstrap Script
**Priority:** P0  
**Effort:** 6 hours  
**Owner:** Platform Team

**TODO:**
- [ ] Create `scripts/install.sh` - automated setup
- [ ] Create `scripts/validate.sh` - pre-flight checks
- [ ] Create `scripts/migrate-from-claude.sh` - migration tool
- [ ] Write setup documentation

**Implementation Details:**
```bash
#!/bin/bash
# scripts/install.sh

set -euo pipefail

QODER_SYSTEM_VERSION="1.0.0"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { echo "[$(date +%H:%M:%S)] $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

# 1. Validate prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v node >/dev/null 2>&1 || error "Node.js 18+ required"
    command -v git >/dev/null 2>&1 || error "Git required"
    command -v qoder >/dev/null 2>&1 || { log "WARN: Qoder CLI not found"; }
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    [[ "$node_version" -ge 18 ]] || error "Node.js 18+ required, found $(node --version)"
    
    log "✓ Prerequisites met"
}

# 2. Install MCP server dependencies
install_mcp_servers() {
    log "Installing MCP servers..."
    
    for server in core/mcp-*; do
        if [[ -d "$server" && -f "$server/package.json" ]]; then
            log "Installing $server..."
            (cd "$server" && npm ci && npm run build)
        fi
    done
    
    log "✓ MCP servers installed"
}

# 3. Create project structure
create_project_structure() {
    log "Creating project structure..."
    
    mkdir -p specs/{system,skills,agents,tasks,panels}
    mkdir -p workflows
    mkdir -p .qoder/{checkpoints,context}
    
    # Copy templates
    cp "${PROJECT_ROOT}/specs/_templates/agent-spec.template.md" \
       "${PWD}/specs/agents/my-first-agent.md"
    
    log "✓ Project structure created"
}

# 4. Install git hooks (optional)
install_git_hooks() {
    log "Setting up git hooks..."
    
    # Create hook runner wrapper
    cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
# Auto-generated by Qoder System
exec "${PROJECT_ROOT}/core/mcp-hook-runner/dist/hook-wrapper.js" pre-commit
HOOK
    chmod +x .git/hooks/pre-commit
    
    log "✓ Git hooks installed"
}

# 5. Validate installation
validate_installation() {
    log "Validating installation..."
    
    # Check MCP servers
    # Check specs directory
    # Run test specs
    
    log "✓ Installation validated"
}

main() {
    log "Qoder Enterprise System v${QODER_SYSTEM_VERSION}"
    log "Installing to: ${PWD}"
    
    check_prerequisites
    install_mcp_servers
    create_project_structure
    install_git_hooks
    validate_installation
    
    log "Installation complete!"
    log "Next steps:"
    log "  1. Configure .qoder/project-spec.md"
    log "  2. Run 'qoder' and test connection"
    log "  3. Try: 'Создай чекпоинт тест'"
}

main "$@"
```

**Acceptance Criteria:**
- Clean install on fresh project < 5 minutes
- Idempotent (повторный запрос не ломает)
- Clear error messages on failure
- Creates working example

---

### 1.2 Core Infrastructure Specs

#### 1.2.1 Task: System Configuration Specs
**Priority:** P1  
**Effort:** 8 hours  
**Owner:** Architecture Team

**TODO:**
- [ ] Create `specs/system/intent-router.md` - Router configuration
- [ ] Create `specs/system/checkpoint-manager.md` - Checkpoint workflows
- [ ] Create `specs/system/hook-automation.md` - Hook definitions
- [ ] Define system-wide constants and patterns

**Spec Template:**
```markdown
---
type: system-spec
version: 1.0
status: active
---

# Intent Router System Configuration

## Overview
Центральный компонент распределения intent'ов пользователя на соответствующие specs.

## Intent Patterns

### code-review
**Patterns:**
- "проверь код"
- "review this"
- "code review"
- "analyze code"
- "найди баги"

**Action:** Load `specs/skills/code-review.md`
**Confidence threshold:** 0.8

### performance-optimization
**Patterns:**
- "оптимизируй"
- "ускорь"
- "performance"
- "bottleneck"
- "slow"

**Action:** Load `specs/skills/performance-optimization.md`
**Confidence threshold:** 0.85

### [Additional intents...]

## Routing Logic

```yaml
routing_strategy: best_match
fallback_behavior: suggest_top_3
cache_intents: true
cache_ttl: 300
```

## Error Handling

### No match found
1. Suggest closest matches with confidence scores
2. Offer generic assistant mode
3. Log unmatched pattern for analysis

### Multiple high-confidence matches
1. Present options to user
2. Allow disambiguation
3. Learn from user choice
```

---

#### 1.2.2 Task: Template Library
**Priority:** P1  
**Effort:** 6 hours  
**Owner:** Platform Team

**TODO:**
- [ ] Create `specs/_templates/agent-spec.template.md`
- [ ] Create `specs/_templates/skill-spec.template.md`
- [ ] Create `specs/_templates/task-spec.template.md`
- [ ] Create `specs/_templates/panel-spec.template.md`

**Template Example (skill):**
```markdown
---
type: skill-spec
name: {{skill_name}}
version: 1.0
triggers:
  - "{{trigger_phrase_1}}"
  - "{{trigger_phrase_2}}"
confidence_threshold: 0.8
auto_invoke: false
dependencies: []
---

# {{skill_name}} Skill

## Purpose
{{skill_description}}

## Activation Criteria
- Trigger phrases: {{trigger_phrases}}
- Context requirements: {{context_requirements}}

## Execution Steps
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

## Output Format
```
{{output_format}}
```

## Error Handling
{{error_handling_strategy}}

## Examples

### Example 1: {{example_name}}
**Input:** {{example_input}}
**Output:** {{example_output}}

## Metadata
- Created: {{creation_date}}
- Author: {{author}}
- Reviewed: {{review_date}}
```

**Acceptance Criteria:**
- All templates validated against schema
- Clear placeholder syntax
- Usage examples included

---

## Phase 2: Intent Router System (Week 2-3)

### 2.1 MCP Intent Router Server

#### 2.1.1 Task: Core Router Implementation
**Priority:** P0  
**Effort:** 16 hours  
**Owner:** Senior Engineer

**TODO:**
- [ ] Initialize MCP server project structure
- [ ] Implement intent detection engine
- [ ] Implement pattern matching (regex + semantic)
- [ ] Create spec loading mechanism
- [ ] Build routing decision tree
- [ ] Add confidence scoring
- [ ] Implement caching layer
- [ ] Write comprehensive tests

**Architecture:**
```typescript
// core/mcp-intent-router/src/types.ts

interface Intent {
  id: string;
  name: string;
  patterns: Pattern[];
  targetSpec: string;
  confidence: number;
  priority: number;
  metadata: IntentMetadata;
}

interface Pattern {
  type: 'exact' | 'regex' | 'semantic' | 'fuzzy';
  value: string;
  weight: number;
}

interface RoutingResult {
  intent: Intent;
  confidence: number;
  matchedPattern: Pattern;
  alternativeIntents: Intent[];
  specContent: string;
}

interface IntentRouterConfig {
  specsPath: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  minConfidence: number;
  fallbackEnabled: boolean;
}
```

```typescript
// core/mcp-intent-router/src/router.ts

class IntentRouter {
  private intents: Map<string, Intent> = new Map();
  private cache: LRUCache<string, RoutingResult>;
  private config: IntentRouterConfig;

  constructor(config: IntentRouterConfig) {
    this.config = config;
    this.cache = new LRUCache({ max: 1000, ttl: config.cacheTTL });
    this.loadIntents();
  }

  async route(input: string, context?: Context): Promise<RoutingResult> {
    // 1. Check cache
    const cacheKey = this.hashInput(input, context);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 2. Score all intents
    const scoredIntents = await this.scoreIntents(input, context);
    
    // 3. Select best match
    const bestMatch = this.selectBestMatch(scoredIntents);
    
    if (!bestMatch || bestMatch.confidence < this.config.minConfidence) {
      return this.handleNoMatch(input, scoredIntents);
    }

    // 4. Load spec content
    const specContent = await this.loadSpec(bestMatch.intent.targetSpec);
    
    const result: RoutingResult = {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      matchedPattern: bestMatch.pattern,
      alternativeIntents: scoredIntents.slice(1, 4),
      specContent
    };

    // 5. Cache and return
    this.cache.set(cacheKey, result);
    return result;
  }

  private async scoreIntents(input: string, context?: Context): Promise<ScoredIntent[]> {
    const scored: ScoredIntent[] = [];
    
    for (const intent of this.intents.values()) {
      const score = await this.scoreIntent(intent, input, context);
      scored.push({ intent, ...score });
    }
    
    return scored.sort((a, b) => b.confidence - a.confidence);
  }

  private scoreIntent(intent: Intent, input: string, context?: Context): ScoreResult {
    let maxConfidence = 0;
    let bestPattern: Pattern | null = null;

    for (const pattern of intent.patterns) {
      const confidence = this.matchPattern(pattern, input, context);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestPattern = pattern;
      }
    }

    return { confidence: maxConfidence, pattern: bestPattern! };
  }

  private matchPattern(pattern: Pattern, input: string, context?: Context): number {
    switch (pattern.type) {
      case 'exact':
        return input.toLowerCase() === pattern.value.toLowerCase() ? 1.0 : 0;
      
      case 'regex':
        const regex = new RegExp(pattern.value, 'i');
        return regex.test(input) ? pattern.weight : 0;
      
      case 'semantic':
        // Use embeddings or keyword extraction
        return this.semanticMatch(pattern.value, input);
      
      case 'fuzzy':
        return this.fuzzyMatch(pattern.value, input);
      
      default:
        return 0;
    }
  }
}
```

**Acceptance Criteria:**
- Intent detection < 100ms
- 90%+ accuracy on test dataset
- Graceful fallback on unknown intents
- LRU cache hit rate > 60%

---

#### 2.1.2 Task: MCP Tool Definitions
**Priority:** P1  
**Effort:** 4 hours  
**Owner:** Platform Engineer

**TODO:**
- [ ] Define MCP tools schema
- [ ] Implement `detect_intent` tool
- [ ] Implement `list_intents` tool
- [ ] Implement `reload_specs` tool
- [ ] Add error handling

**MCP Tools:**
```typescript
// core/mcp-intent-router/src/tools.ts

export const tools = [
  {
    name: 'detect_intent',
    description: 'Detect user intent and return matching spec',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'User input text' },
        context: { 
          type: 'object',
          properties: {
            currentFile: { type: 'string' },
            selectedCode: { type: 'string' },
            projectType: { type: 'string' }
          }
        },
        includeSpec: { type: 'boolean', default: true }
      },
      required: ['input']
    }
  },
  {
    name: 'list_intents',
    description: 'List all available intents with patterns',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['skills', 'agents', 'tasks'] }
      }
    }
  },
  {
    name: 'reload_specs',
    description: 'Reload all specs from disk',
    inputSchema: {
      type: 'object',
      properties: {
        validate: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'get_spec',
    description: 'Get specific spec content by path',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        renderTemplate: { type: 'boolean', default: true }
      },
      required: ['path']
    }
  }
];
```

**Acceptance Criteria:**
- All tools callable from Qoder
- Proper error messages
- JSON schema validation

---

## Phase 3: Checkpoint System (Week 3-4)

### 3.1 Git-Based Checkpoint Manager

#### 3.1.1 Task: Checkpoint MCP Server
**Priority:** P0  
**Effort:** 12 hours  
**Owner:** Senior Engineer

**TODO:**
- [ ] Implement checkpoint creation
- [ ] Implement checkpoint restoration
- [ ] Implement checkpoint listing
- [ ] Implement checkpoint diff
- [ ] Add metadata management
- [ ] Create garbage collection
- [ ] Build tests

**Implementation:**
```typescript
// core/mcp-checkpoint-manager/src/checkpoint.ts

interface Checkpoint {
  id: string;
  name: string;
  description: string;
  gitCommit: string;
  gitBranch: string;
  timestamp: number;
  metadata: {
    files: string[];
    prompt?: string;
    context?: any;
  };
  tags: string[];
}

class CheckpointManager {
  private readonly CHECKPOINT_PREFIX = '[qoder-chk]';
  private readonly METADATA_DIR = '.qoder/checkpoints';

  async create(
    name: string, 
    description: string,
    options?: CreateOptions
  ): Promise<Checkpoint> {
    const id = this.generateId();
    const timestamp = Date.now();
    
    // 1. Stash uncommitted changes
    const stashResult = await this.execGit(['stash', 'push', '-m', `checkpoint-${id}`]);
    
    // 2. Create empty commit with metadata
    const commitMsg = `${this.CHECKPOINT_PREFIX} ${name}\n\n${description}\n\nCHECKPOINT_ID: ${id}`;
    await this.execGit(['commit', '--allow-empty', '-m', commitMsg]);
    
    const commitHash = await this.getHeadCommit();
    
    // 3. Save metadata
    const checkpoint: Checkpoint = {
      id,
      name,
      description,
      gitCommit: commitHash,
      gitBranch: await this.getCurrentBranch(),
      timestamp,
      metadata: {
        files: await this.getTrackedFiles(),
        prompt: options?.prompt,
        context: options?.context
      },
      tags: options?.tags || []
    };
    
    await this.saveMetadata(checkpoint);
    
    // 4. Restore stash if needed
    if (!options?.keepStash) {
      await this.execGit(['stash', 'pop']);
    }
    
    return checkpoint;
  }

  async restore(checkpointId: string, options?: RestoreOptions): Promise<void> {
    const checkpoint = await this.loadMetadata(checkpointId);
    
    // 1. Validate clean working directory or stash
    if (!options?.force && !(await this.isWorkingDirectoryClean())) {
      throw new Error('Working directory not clean. Use force: true or stash changes first.');
    }
    
    // 2. Checkout to checkpoint commit
    await this.execGit(['checkout', checkpoint.gitCommit]);
    
    // 3. Restore context if available
    if (checkpoint.metadata.prompt && options?.restoreContext) {
      await this.saveContextToFile(checkpoint.metadata.prompt);
    }
    
    // 4. Create branch if needed
    if (options?.createBranch) {
      const branchName = `restore-${checkpoint.name}-${Date.now()}`;
      await this.execGit(['checkout', '-b', branchName]);
    }
  }

  async list(filter?: ListFilter): Promise<Checkpoint[]> {
    // Get all checkpoint commits
    const log = await this.execGit([
      'log', '--all', '--grep', this.CHECKPOINT_PREFIX,
      '--format=%H|%s|%ci'
    ]);
    
    const checkpoints: Checkpoint[] = [];
    
    for (const line of log.split('\n').filter(Boolean)) {
      const [hash, subject, date] = line.split('|');
      const checkpoint = await this.loadMetadataByCommit(hash);
      if (checkpoint && this.matchesFilter(checkpoint, filter)) {
        checkpoints.push(checkpoint);
      }
    }
    
    return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
  }

  async diff(checkpointIdA: string, checkpointIdB: string): Promise<DiffResult> {
    const chkA = await this.loadMetadata(checkpointIdA);
    const chkB = await this.loadMetadata(checkpointIdB);
    
    const diff = await this.execGit([
      'diff', '--stat', chkA.gitCommit, chkB.gitCommit
    ]);
    
    return {
      files: this.parseDiffStat(diff),
      commits: await this.getCommitsBetween(chkA.gitCommit, chkB.gitCommit)
    };
  }

  private async saveMetadata(checkpoint: Checkpoint): Promise<void> {
    const filepath = `${this.METADATA_DIR}/${checkpoint.id}.json`;
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(checkpoint, null, 2));
  }

  private async loadMetadata(id: string): Promise<Checkpoint> {
    const filepath = `${this.METADATA_DIR}/${id}.json`;
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }
}
```

**Acceptance Criteria:**
- Checkpoint create < 3 seconds
- Checkpoint restore < 5 seconds
- List 100 checkpoints < 1 second
- Metadata survives git operations

---

## Phase 4: Hook Automation (Week 4-5)

### 4.1 Hook Runner MCP Server

#### 4.1.1 Task: Hook Runner Implementation
**Priority:** P1  
**Effort:** 10 hours  
**Owner:** Platform Engineer

**TODO:**
- [ ] Implement hook execution engine
- [ ] Create workflow parser (YAML)
- [ ] Add step runner (shell, node, python)
- [ ] Implement conditional logic
- [ ] Add error handling and notifications
- [ ] Create parallel execution support
- [ ] Build tests

---

## Phase 5: Skill Library (Week 5-6)

### 5.1 Core Skills Migration

#### 5.1.1 Task: Migrate 5 Essential Skills
**Priority:** P0  
**Effort:** 16 hours  
**Owner:** Senior Engineer + QA

**TODO:**
- [ ] Migrate `code-review` skill
- [ ] Migrate `performance-optimization` skill  
- [ ] Migrate `documentation-generation` skill
- [ ] Migrate `test-generation` skill
- [ ] Migrate `refactoring` skill

---

## Phase 6: Integration (Week 6-7)

### 6.1 End-to-End Testing

#### 6.1.1 Task: Integration Test Suite
**Priority:** P0  
**Effort:** 12 hours  
**Owner:** QA Engineer

**TODO:**
- [ ] Create E2E test scenarios
- [ ] Automate Qoder interaction tests
- [ ] Performance benchmarking
- [ ] Load testing for MCP servers

---

## Phase 7: Documentation (Week 7-8)

### 7.1 Developer Documentation

#### 7.1.1 Task: Complete Documentation
**Priority:** P1  
**Effort:** 10 hours  
**Owner:** Technical Writer

**TODO:**
- [ ] Setup guide
- [ ] Developer guide
- [ ] API documentation
- [ ] Troubleshooting guide
- [ ] Video tutorials (optional)

---

## Appendices

### Appendix A: Resource Requirements

| Resource | Phase 1 | Phase 2 | Total |
|----------|---------|---------|-------|
| Senior Engineer | 1 FTE | 0.5 FTE | 240 hours |
| Platform Engineer | 0.5 FTE | 0.5 FTE | 160 hours |
| QA Engineer | 0 | 1 FTE | 80 hours |
| Technical Writer | 0 | 0.5 FTE | 40 hours |

### Appendix B: Timeline

```
Week 1:  [Foundation] ████████░░░░░░░░░░
Week 2:  [Foundation] [Router] ████████████████░░
Week 3:  [Router] [Checkpoint] █████████████░░░░░
Week 4:  [Checkpoint] [Hooks] █████████████░░░░░
Week 5:  [Hooks] [Skills] █████████████░░░░░
Week 6:  [Skills] [Integration] █████████████░░░░░
Week 7:  [Integration] [Docs] █████████████░░░░░
Week 8:  [Docs] [Launch] ████████░░░░░░░░░░
```

### Appendix C: Risk Register

| ID | Risk | Mitigation | Owner | Status |
|----|------|------------|-------|--------|
| R1 | Qoder API breaking changes | Abstraction layer, version pinning | Arch | Open |
| R2 | Performance issues with large specs | Pagination, lazy loading | Platform | Open |
| R3 | Developer adoption resistance | Training, gradual rollout | PM | Open |

---

**Next Step:** Начать с Phase 1.1.1 - MCP Server Registry?
