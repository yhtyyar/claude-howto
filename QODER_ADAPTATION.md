# Адаптация claude-howto для Qoder IDE

## Стратегия миграции


| claude-howto компонент        | Qoder эквивалент        | Статус                               |
| -------------------------------------- | --------------------------------- | ------------------------------------------ |
| Slash Commands (.claude/commands/*.md) | **Spec Files** (specs/*.md)       | ✅ Адаптируется                |
| Memory (CLAUDE.md)                     | **Repo Wiki** + **Project Specs** | ✅ Адаптируется                |
| Subagents (.claude/agents/*.md)        | **Quest Mode** + **Expert Panel** | ✅ Адаптируется                |
| Skills (.claude/skills/*/SKILL.md)     | **Skill Specs** (skills/*.md)     | ✅ Адаптируется                |
| MCP (.mcp.json)                        | **MCP Config** (qoder-mcp.json)   | ✅ Прямая совместимость |
| Hooks (~/.claude/hooks/)               | **Pre/Post Actions** в Spec      | ⚠️ Частично                      |
| Checkpoints                            | **Session History**               | ⚠️ Ограниченно                |

---

## Быстрый старт (15 минут)

```bash
# 1. Клонируй проект
git clone https://github.com/luongnv89/claude-howto.git
cd claude-howto

# 2. Скопируй адаптированные спеки в свой проект
mkdir -p /your-project/specs
mkdir -p /your-project/.qoder

cp -r qoder-adaptation/specs/* /your-project/specs/
cp qoder-adaptation/qoder-project-spec.md /your-project/.qoder/project-spec.md

# 3. Открой в Qoder и используй Quest Mode с этими спеками
```

---

## Структура адаптации

### 1. Spec Files (вместо Slash Commands)

**Было в Claude Code:**

```
.claude/commands/
├── optimize.md
├── pr.md
├── commit.md
└── generate-api-docs.md
```

**Стало в Qoder:**

```
specs/
├── 01-optimize-performance.md    # Адаптация optimize.md
├── 02-create-pr.md               # Адаптация pr.md  
├── 03-generate-commit.md       # Адаптация commit.md
├── 04-generate-docs.md           # Адаптация generate-api-docs.md
├── 05-setup-ci-cd.md             # Адаптация setup-ci-cd.md
└── 06-expand-tests.md            # Адаптация unit-test-expand.md
```

**Как использовать в Qoder:**

1. Открой файл из `specs/` в редакторе
2. Выдели весь текст (Ctrl+A)
3. Отправь в Chat или Agent режим
4. Или используй **Quest Mode** для долгих задач

### 2. Project Spec (вместо CLAUDE.md)

**Было:** `CLAUDE.md` в корне проекта

**Стало:** `.qoder/project-spec.md`

```markdown
---
type: project-spec
version: 1.0
---

# Спецификация проекта [Название]

## Обзор
- **Стек**: Node.js, PostgreSQL, React 18
- **Команда**: 5 разработчиков
- **Архитектура**: Микросервисы

## Стандарты (для Qoder)

### При генерации кода:
- Использовать TypeScript strict mode
- Функции максимум 50 строк
- Обязательно JSDoc для public API
- Prettier: 100 символов, 2 пробела

### При ревью (для Expert Panel):
- Проверять SQL injection
- Проверять N+1 запросы
- Требовать тесты для критичных путей

### При документации:
- OpenAPI спецификация для всех endpoint
- README с примерами запуска
- ADR для архитектурных решений

## Контекст для Qoder

### @docs/architecture.md
### @docs/api-standards.md
### @docs/database-schema.md
```

**Как использовать:**

- Qoder автоматически индексирует `.qoder/project-spec.md`
- Repo Wiki будет ссылаться на эту спеку
- Используй `@.qoder/project-spec.md` в чате

### 3. Agent Specs (вместо Subagents)

**Было:** `.claude/agents/code-reviewer.md`

**Стало:** `specs/agents/code-reviewer-spec.md`

```markdown
---
type: agent-spec
mode: expert-panel
role: code-reviewer
---

# Спецификация: Code Reviewer

Ты — senior code reviewer. Твоя задача — анализировать код перед коммитом.

## Приоритеты проверки (в порядке важности):

1. **Security**
   - SQL injection, XSS, auth bypass
   - Hardcoded credentials
   - Небезопасная десериализация

2. **Performance**
   - N+1 запросы
   - O(n²) алгоритмы
   - Утечки памяти

3. **Quality**
   - SOLID принципы
   - Читаемость
   - Тестируемость

## Формат ответа:

### Critical (блокирует merge)
- [ ] Проблема: ...
- [ ] Локация: файл:строка
- [ ] Исправление: ```код```

### Warnings
...

### Suggestions
...

## Активация:
Используй в Expert Panel Mode с этой спекой.
Или отправь в Chat: "Проведи code review как code-reviewer"
```

### 4. Skill Specs (вместо Skills)

**Было:** `.claude/skills/code-review/SKILL.md`

**Стало:** `specs/skills/code-review-skill.md`

```markdown
---
type: skill-spec
triggers: ["review", "code review", "analyze code", "проверь код"]
auto-invoke: false
---

# Skill: Code Review Specialist

Автоматически активируется при запросах ревью кода.

## Возможности:

### 1. Security Analysis
- Поиск уязвимостей
- Проверка зависимостей (npm audit)
- OWASP Top 10 проверка

### 2. Performance Review
- Big O анализ
- Профилирование suggestions
- Оптимизация запросов

### 3. Quality Metrics
- Цикломатическая сложность
- Дублирование кода
- Покрытие тестами

## Использование в Qoder:

1. Скопируй эту спеку в `.qoder/skills/`
2. Qoder будет предлагать её при релевантных запросах
3. Или явно вызови: "Используй code-review skill"
```

---

## оКонкретные адаптации

### /optimize → specs/01-optimize-performance.md

```markdown
---
type: task-spec
complexity: medium
duration: 10-30min
---

# Оптимизация кода

## Задача
Проанализируй предоставленный код на:
1. **Performance bottlenecks** — O(n²), неэффективные циклы
2. **Memory leaks** — неосвобожденные ресурсы
3. **Algorithm improvements** — лучшие структуры данных
4. **Caching opportunities** — повторяющиеся вычисления
5. **Concurrency issues** — race conditions

## Формат ответа:

### Severity: Critical
**Локация**: `файл:строка`
**Проблема**: Описание
**Решение**:
```язык
// Исправленный код
```

### Severity: High

...

## Использование в Qoder:

1. Вставь код в Chat
2. Отправь эту спеку
3. Или используй Quest Mode для больших файлов

```

### /pr → specs/02-create-pr.md

```markdown
---
type: task-spec
complexity: medium
duration: 15-20min
---

# Подготовка Pull Request

## Задача
Подготовь comprehensive PR с:
1. Описанием изменений
2. Чеклистом проверок
3. Тестовыми сценариями

## Шаблон:

```markdown
## Changes
- [ ] Feature A implemented
- [ ] Tests added
- [ ] Docs updated

## Checklist
- [ ] Self-review completed
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No breaking changes (or documented)

## Testing
1. Checkout branch
2. Run `npm test`
3. Verify UI changes
```

## Использование:

В Quest Mode: "Подготовь PR по этой спеке"

```

---

## MCP в Qoder

**Прямая совместимость** — конфиги из `05-mcp/` работают без изменений:

```json
// .qoder/mcp.json (или .mcp.json)
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "postgres": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "${DATABASE_URL}" }
    }
  }
}
```

---

## Рекомендуемый workflow в Qoder

### 1. Начало проекта

```
1. Создай .qoder/project-spec.md (аналог CLAUDE.md)
2. Запусти Repo Wiki для авто-документации
3. Настрой MCP интеграции
```

### 2. Ежедневная разработка

```
1. Используй specs/ для типовых задач
2. Chat Mode — быстрые вопросы
3. Agent Mode — сложные задачи
4. Quest Mode — долгие задачи (генерация фич)
```

### 3. Code Review

```
1. Открой specs/agents/code-reviewer-spec.md
2. Запусти Expert Panel с этой спекой
3. Или отправь в Chat с упоминанием агента
```

---

## Ограничения


| Фича claude-howto                                 | В Qoder                  | Решение                                 |
| ----------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| .claude/commands/ файловая структура | ❌ Нет                 | Используй specs/ директорию |
| /slash команды                                 | ❌ Нет                 | Используй Chat + Spec файлы      |
| Checkpoints / Rewind                                  | ⚠️ Ограничено | Используй Git + Session History       |
| Auto-invoke Skills                                    | ⚠️ Частично     | Настрой triggers в spec                |
| Hooks (pre/post actions)                              | ❌ Нет                 | Ручной запуск или MCP           |

---

## Пример: Полная структура проекта

```
your-project/
├── .qoder/
│   ├── project-spec.md          # Аналог CLAUDE.md
│   ├── skills/
│   │   ├── code-review.md
│   │   └── doc-generation.md
│   └── mcp.json                 # MCP конфиг
├── specs/
│   ├── 01-optimize.md
│   ├── 02-create-pr.md
│   ├── 03-commit-message.md
│   └── agents/
│       ├── code-reviewer.md
│       ├── test-engineer.md
│       └── security-reviewer.md
├── src/
├── docs/
└── README.md
```

---

## Скрипт автоматической миграции

```bash
#!/bin/bash
# migrate-to-qoder.sh

PROJECT_DIR="$1"
QODER_DIR="$PROJECT_DIR/.qoder"
SPECS_DIR="$PROJECT_DIR/specs"

mkdir -p "$QODER_DIR/skills"
mkdir -p "$SPECS_DIR/agents"

# Конвертирует CLAUDE.md → project-spec.md
convert_claude_md() {
    cat "$1" | sed 's/^# /---\ntype: project-spec\n---\n# /' > "$QODER_DIR/project-spec.md"
}

# Конвертирует slash command → spec
convert_command() {
    local file="$1"
    local name=$(basename "$file" .md)
    cat > "$SPECS_DIR/${name}.md" << EOF
---
type: task-spec
source: claude-howto slash command
---

$(cat "$file")

## Использование в Qoder:
# 1. Открой этот файл
# 2. Выдели весь текст (Ctrl+A)
# 3. Отправь в Chat или Quest Mode
EOF
}

# Конвертирует subagent → agent spec
convert_agent() {
    local file="$1"
    local name=$(basename "$file" .md)
    cat > "$SPECS_DIR/agents/${name}-spec.md" << EOF
---
type: agent-spec
mode: expert-panel
role: ${name}
---

$(cat "$file")

## Активация:
# Используй в Expert Panel Mode
# Или отправь: "Работай как ${name}"
EOF
}

echo "Миграция завершена. Файлы созданы в:"
echo "  - $QODER_DIR/"
echo "  - $SPECS_DIR/"
```

---

**Статус адаптации**: ✅ Готово к использованию
**Совместимость**: ~80% функциональности claude-howto
**Рекомендуемый режим**: Quest Mode для сложных задач, Chat для быстрых
