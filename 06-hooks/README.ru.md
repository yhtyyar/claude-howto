<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="../resources/logos/claude-howto-logo.svg">
</picture>

# Хуки

Хуки — это автоматизированные скрипты, выполняемые в ответ на конкретные события во время сессий Claude Code. Они обеспечивают автоматизацию, валидацию, управление разрешениями и кастомные рабочие процессы.

## Обзор

Хуки — автоматизированные действия (shell-команды, HTTP-вебхуки, LLM-промпты или оценки субагентов), выполняемые автоматически при наступлении конкретных событий в Claude Code. Они получают JSON-ввод и передают результаты через коды выхода и JSON-вывод.

**Ключевые функции:**
- Автоматизация на основе событий
- JSON-базированный ввод/вывод
- Поддержка типов хуков: command, prompt, HTTP и agent
- Сопоставление паттернов для хуков конкретных инструментов

## Конфигурация

Хуки настраиваются в файлах настроек:

- `~/.claude/settings.json` — Пользовательские настройки (все проекты)
- `.claude/settings.json` — Настройки проекта (для шаринга, фиксируются в git)
- `.claude/settings.local.json` — Локальные настройки проекта (не фиксируются)
- Managed policy — Организационные настройки
- Plugin `hooks/hooks.json` — Хуки уровня плагина
- Frontmatter навыка/агента — Хуки времени жизни компонента

### Базовая структура конфигурации

```json
{
  "hooks": {
    "НазваниеСобытия": [
      {
        "matcher": "ПаттернИнструмента",
        "hooks": [
          {
            "type": "command",
            "command": "твоя-команда-здесь",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Ключевые поля:**

| Поле | Описание | Пример |
|------|---------|--------|
| `matcher` | Паттерн для сопоставления имён инструментов (чувствителен к регистру) | `"Write"`, `"Edit\|Write"`, `"*"` |
| `hooks` | Массив определений хуков | `[{ "type": "command", ... }]` |
| `type` | Тип хука: `"command"` (bash), `"prompt"` (LLM), `"http"` (webhook), или `"agent"` (субагент) | `"command"` |
| `command` | Shell-команда для выполнения | `"$CLAUDE_PROJECT_DIR/.claude/hooks/format.sh"` |
| `timeout` | Необязательный таймаут в секундах (по умолчанию 60) | `30` |
| `once` | Если `true`, запускать хук только один раз за сессию | `true` |

## Типы хуков

### Хуки команд (Command)

Тип по умолчанию. Выполняет shell-команду и взаимодействует через JSON stdin/stdout и коды выхода.

```json
{
  "type": "command",
  "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate.py\"",
  "timeout": 60
}
```

### HTTP-хуки

> Добавлены в v2.1.63.

Удалённые webhook-эндпоинты, получающие такой же JSON-ввод, как хуки команд. HTTP-хуки отправляют POST с JSON на URL и получают JSON-ответ.

```json
{
  "hooks": {
    "PostToolUse": [{
      "type": "http",
      "url": "https://my-webhook.example.com/hook",
      "matcher": "Write"
    }]
  }
}
```

### Промпт-хуки (Prompt)

LLM-оцениваемые промпты, где содержимое хука — это промпт, который Claude оценивает. В основном используются с событиями `Stop` и `SubagentStop` для интеллектуальной проверки завершения задачи.

```json
{
  "type": "prompt",
  "prompt": "Оцени, завершил ли Claude все запрошенные задачи.",
  "timeout": 30
}
```

### Хуки агентов (Agent)

Хуки проверки на основе субагентов, порождающие выделенного агента для оценки условий или выполнения сложных проверок. В отличие от промпт-хуков (одноходовая оценка LLM), хуки агентов могут использовать инструменты и выполнять многошаговые рассуждения.

```json
{
  "type": "agent",
  "prompt": "Проверь, следуют ли изменения кода нашим архитектурным руководящим принципам. Проверь соответствующие документы проектирования и сравни.",
  "timeout": 120
}
```

## События хуков

Claude Code поддерживает **25 событий хуков**:

| Событие | Когда срабатывает | Ввод matcher | Может блокировать | Распространённое использование |
|---------|------------------|-------------|-------------------|-------------------------------|
| **SessionStart** | Начало/возобновление/очистка/компактизация сессии | startup/resume/clear/compact | Нет | Настройка окружения |
| **InstructionsLoaded** | После загрузки CLAUDE.md или файла правил | (нет) | Нет | Изменение/фильтрация инструкций |
| **UserPromptSubmit** | Пользователь отправляет промпт | (нет) | Да | Валидация промптов |
| **PreToolUse** | Перед выполнением инструмента | Имя инструмента | Да (allow/deny/ask) | Валидация, изменение входных данных |
| **PermissionRequest** | Показан диалог разрешений | Имя инструмента | Да | Автоодобрение/отклонение |
| **PostToolUse** | После успешного выполнения инструмента | Имя инструмента | Нет | Добавление контекста, обратная связь |
| **PostToolUseFailure** | Выполнение инструмента не удалось | Имя инструмента | Нет | Обработка ошибок, логирование |
| **Notification** | Отправлено уведомление | Тип уведомления | Нет | Кастомные уведомления |
| **SubagentStart** | Порождён субагент | Имя типа агента | Нет | Настройка субагента |
| **SubagentStop** | Субагент завершился | Имя типа агента | Да | Валидация субагента |
| **Stop** | Claude заканчивает ответ | (нет) | Да | Проверка завершения задачи |
| **StopFailure** | Ошибка API завершает ход | (нет) | Нет | Восстановление после ошибок |
| **TeammateIdle** | Член команды агентов простаивает | (нет) | Да | Координация членов команды |
| **TaskCompleted** | Задача помечена как выполненная | (нет) | Да | Действия после задачи |
| **TaskCreated** | Задача создана через TaskCreate | (нет) | Нет | Отслеживание задач, логирование |
| **ConfigChange** | Изменения файла конфигурации | (нет) | Да (кроме политики) | Реакция на обновления конфигурации |
| **CwdChanged** | Изменение рабочей директории | (нет) | Нет | Настройка для конкретной директории |
| **FileChanged** | Изменение отслеживаемого файла | (нет) | Нет | Мониторинг файлов, пересборка |
| **PreCompact** | Перед компактизацией контекста | manual/auto | Нет | Действия перед компактизацией |
| **PostCompact** | После завершения компактизации | (нет) | Нет | Действия после компактизации |
| **WorktreeCreate** | Создаётся worktree | (нет) | Да (возврат пути) | Инициализация worktree |
| **WorktreeRemove** | Удаляется worktree | (нет) | Нет | Очистка worktree |
| **Elicitation** | MCP-сервер запрашивает ввод пользователя | (нет) | Да | Валидация ввода |
| **ElicitationResult** | Пользователь ответил на запрос | (нет) | Да | Обработка ответа |
| **SessionEnd** | Сессия завершается | (нет) | Нет | Очистка, финальное логирование |

### PreToolUse

Выполняется после того, как Claude создал параметры инструмента, и до обработки. Используй для валидации или изменения входных данных инструмента.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ]
  }
}
```

**Управление выводом:**
- `permissionDecision`: `"allow"`, `"deny"`, или `"ask"`
- `permissionDecisionReason`: Объяснение решения
- `updatedInput`: Изменённые параметры входных данных инструмента

### PostToolUse

Выполняется сразу после завершения инструмента. Используй для верификации, логирования или предоставления контекста обратно Claude.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/security-scan.py"
          }
        ]
      }
    ]
  }
}
```

### Stop и SubagentStop

Выполняются, когда Claude заканчивает ответ (Stop) или субагент завершается (SubagentStop). Поддерживает промпт-оценку для интеллектуальной проверки завершения задачи.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Оцени, завершил ли Claude все запрошенные задачи.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### SessionStart

Выполняется при запуске или возобновлении сессии. Может сохранять переменные окружения.

**Matchers:** `startup`, `resume`, `clear`, `compact`

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
fi
exit 0
```

## Хуки уровня компонента

Хуки можно прикреплять к конкретным компонентам (навыкам, агентам, командам) в их frontmatter:

```yaml
---
name: secure-operations
description: Выполнять операции с проверками безопасности
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
          once: true  # Запускать только один раз за сессию
---
```

**Поддерживаемые события для хуков компонентов:** `PreToolUse`, `PostToolUse`, `Stop`

## Ввод и вывод хуков

### JSON-ввод (через stdin)

Все хуки получают JSON-ввод через stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/путь/к/транскрипту.jsonl",
  "cwd": "/текущая/рабочая/директория",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/путь/к/файлу.js",
    "content": "..."
  }
}
```

### Коды выхода

| Код выхода | Значение | Поведение |
|-----------|---------|----------|
| **0** | Успех | Продолжить, разобрать JSON stdout |
| **2** | Блокирующая ошибка | Заблокировать операцию, stderr показан как ошибка |
| **Другой** | Неблокирующая ошибка | Продолжить, stderr показан в verbose-режиме |

### JSON-вывод (stdout, код выхода 0)

```json
{
  "continue": true,
  "stopReason": "Необязательное сообщение при остановке",
  "suppressOutput": false,
  "systemMessage": "Необязательное предупреждение",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Файл в разрешённой директории",
    "updatedInput": {
      "file_path": "/изменённый/путь.js"
    }
  }
}
```

## Переменные окружения

| Переменная | Доступность | Описание |
|-----------|------------|---------|
| `CLAUDE_PROJECT_DIR` | Все хуки | Абсолютный путь к корню проекта |
| `CLAUDE_ENV_FILE` | SessionStart, CwdChanged, FileChanged | Путь к файлу для сохранения переменных окружения |
| `CLAUDE_CODE_REMOTE` | Все хуки | `"true"` при работе в удалённых окружениях |
| `${CLAUDE_PLUGIN_ROOT}` | Хуки плагинов | Путь к директории плагина |
| `${CLAUDE_PLUGIN_DATA}` | Хуки плагинов | Путь к директории данных плагина |

## Примеры

### Пример 1: Валидатор Bash-команд (PreToolUse)

**Файл:** `.claude/hooks/validate-bash.py`

```python
#!/usr/bin/env python3
import json
import sys
import re

BLOCKED_PATTERNS = [
    (r"\brm\s+-rf\s+/", "Блокировка опасной команды rm -rf /"),
    (r"\bsudo\s+rm", "Блокировка команды sudo rm"),
]

def main():
    input_data = json.load(sys.stdin)

    tool_name = input_data.get("tool_name", "")
    if tool_name != "Bash":
        sys.exit(0)

    command = input_data.get("tool_input", {}).get("command", "")

    for pattern, message in BLOCKED_PATTERNS:
        if re.search(pattern, command):
            print(message, file=sys.stderr)
            sys.exit(2)  # Код выхода 2 = блокирующая ошибка

    sys.exit(0)

if __name__ == "__main__":
    main()
```

**Конфигурация:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.py\""
          }
        ]
      }
    ]
  }
}
```

### Пример 2: Сканер безопасности (PostToolUse)

**Файл:** `.claude/hooks/security-scan.py`

```python
#!/usr/bin/env python3
import json
import sys
import re

SECRET_PATTERNS = [
    (r"password\s*=\s*['\"][^'\"]+['\"]", "Возможный жёстко закодированный пароль"),
    (r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]", "Возможный жёстко закодированный API-ключ"),
]

def main():
    input_data = json.load(sys.stdin)

    tool_name = input_data.get("tool_name", "")
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    content = tool_input.get("content", "") or tool_input.get("new_string", "")
    file_path = tool_input.get("file_path", "")

    warnings = []
    for pattern, message in SECRET_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            warnings.append(message)

    if warnings:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": f"Предупреждения безопасности для {file_path}: " + "; ".join(warnings)
            }
        }
        print(json.dumps(output))

    sys.exit(0)

if __name__ == "__main__":
    main()
```

### Пример 3: Авто-форматирование кода (PostToolUse)

**Файл:** `.claude/hooks/format-code.sh`

```bash
#!/bin/bash
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_name', ''))")
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_input', {}).get('file_path', ''))")

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
    exit 0
fi

# Форматировать на основе расширения файла
case "$FILE_PATH" in
    *.js|*.jsx|*.ts|*.tsx|*.json)
        command -v prettier &>/dev/null && prettier --write "$FILE_PATH" 2>/dev/null
        ;;
    *.py)
        command -v black &>/dev/null && black "$FILE_PATH" 2>/dev/null
        ;;
    *.go)
        command -v gofmt &>/dev/null && gofmt -w "$FILE_PATH" 2>/dev/null
        ;;
esac

exit 0
```

### Пример 4: Интеллектуальный хук Stop (на основе промпта)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Проверь, завершил ли Claude все запрошенные задачи. Проверь: 1) Все ли файлы созданы/изменены? 2) Есть ли неразрешённые ошибки? Если не завершено, объясни, что отсутствует.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Пример 5: Отслеживание использования контекста (пара хуков)

Отслеживай потребление токенов на запрос, используя хуки `UserPromptSubmit` (до сообщения) и `Stop` (после ответа) вместе.

```python
#!/usr/bin/env python3
"""Трекер использования контекста — отслеживает потребление токенов на запрос."""
import json
import os
import sys
import tempfile

CONTEXT_LIMIT = 128000  # Контекстное окно Claude

def count_tokens(text: str) -> int:
    """Приблизительный подсчёт токенов (~4 символа на токен)."""
    return len(text) // 4

def read_transcript(transcript_path: str) -> str:
    """Читает весь контент из файла транскрипта."""
    if not transcript_path or not os.path.exists(transcript_path):
        return ""
    content = []
    with open(transcript_path, "r") as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                if "message" in entry:
                    msg = entry["message"]
                    if isinstance(msg.get("content"), str):
                        content.append(msg["content"])
                    elif isinstance(msg.get("content"), list):
                        for block in msg["content"]:
                            if isinstance(block, dict) and block.get("type") == "text":
                                content.append(block.get("text", ""))
            except json.JSONDecodeError:
                continue
    return "\n".join(content)

def main():
    data = json.load(sys.stdin)
    event = data.get("hook_event_name", "")
    session_id = data.get("session_id", "unknown")
    transcript_path = data.get("transcript_path", "")
    state_file = os.path.join(tempfile.gettempdir(), f"claude-context-{session_id}.json")

    if event == "UserPromptSubmit":
        current_tokens = count_tokens(read_transcript(transcript_path))
        with open(state_file, "w") as f:
            json.dump({"pre_tokens": current_tokens}, f)
    elif event == "Stop":
        current_tokens = count_tokens(read_transcript(transcript_path))
        pre_tokens = 0
        if os.path.exists(state_file):
            try:
                with open(state_file, "r") as f:
                    pre_tokens = json.load(f).get("pre_tokens", 0)
            except (json.JSONDecodeError, IOError):
                pass
        delta = current_tokens - pre_tokens
        pct = (current_tokens / CONTEXT_LIMIT) * 100
        print(f"Контекст: ~{current_tokens:,} токенов ({pct:.1f}% использовано)", file=sys.stderr)
        if delta > 0:
            print(f"Этот запрос: ~{delta:,} токенов", file=sys.stderr)

    sys.exit(0)

if __name__ == "__main__":
    main()
```

## Устранение неполадок

| Проблема | Решение |
|---------|---------|
| Хук не запускается | Проверить синтаксис конфигурации и имя события |
| Скрипт не выполняется | Проверить права: `chmod +x script.py` |
| JSON-разбор не удаётся | Проверить формат вывода скрипта |
| Таймаут слишком долгий | Уменьшить `timeout` в конфигурации |
| Хук блокирует слишком много | Уточнить паттерн matcher |

## Лучшие практики

### Рекомендуется

- Проверяй имя инструмента перед обработкой в хуках (повышает производительность)
- Используй коды выхода правильно (0 = успех, 2 = блокировка)
- Возвращай структурированный JSON для сложных взаимодействий
- Держи хуки быстрыми и сфокусированными
- Тестируй хуки с известными входными данными перед развёртыванием

### Не рекомендуется

- Не создавай хуки с длительным временем выполнения для критических событий
- Не игнорируй коды выхода
- Не используй хуки для задач, которые можно решить другими способами
- Не добавляй слишком много хуков — это замедляет работу

## Связанные концепции

- [Навыки](../03-skills/) — Хуки уровня компонента в навыках
- [Субагенты](../04-subagents/) — Хуки SubagentStart и SubagentStop
- [Плагины](../07-plugins/) — Хуки, поставляемые с плагинами
- [Память](../02-memory/) — Постоянный контекст между сессиями
- [MCP](../05-mcp/) — Хуки для MCP-взаимодействий

---

*Часть серии руководств [Claude How To](../)*
