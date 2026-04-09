<picture>
  <source media="(prefers-color-scheme: dark)" srcset="resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="resources/logos/claude-howto-logo.svg">
</picture>

# Примеры Claude Code — Карточка быстрой справки

## 🚀 Быстрые команды установки

### Слеш-команды
```bash
# Установить все
cp 01-slash-commands/*.md .claude/commands/

# Установить конкретную
cp 01-slash-commands/optimize.md .claude/commands/
```

### Память
```bash
# Память проекта
cp 02-memory/project-CLAUDE.md ./CLAUDE.md

# Персональная память
cp 02-memory/personal-CLAUDE.md ~/.claude/CLAUDE.md
```

### Навыки
```bash
# Персональные навыки
cp -r 03-skills/code-review ~/.claude/skills/

# Навыки проекта
cp -r 03-skills/code-review .claude/skills/
```

### Субагенты
```bash
# Установить все
cp 04-subagents/*.md .claude/agents/

# Установить конкретного
cp 04-subagents/code-reviewer.md .claude/agents/
```

### MCP
```bash
# Установить учётные данные
export GITHUB_TOKEN="your_token"
export DATABASE_URL="postgresql://..."

# Установить конфиг (уровень проекта)
cp 05-mcp/github-mcp.json .mcp.json

# Или уровень пользователя: добавить в ~/.claude.json
```

### Хуки
```bash
# Установить хуки
mkdir -p ~/.claude/hooks
cp 06-hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh

# Настроить в settings (~/.claude/settings.json)
```

### Плагины
```bash
# Установить из примеров (если опубликованы)
/plugin install pr-review
/plugin install devops-automation
/plugin install documentation
```

### Контрольные точки
```bash
# Контрольные точки создаются автоматически с каждым промптом пользователя
# Для перемотки нажмите Esc дважды или используйте:
/rewind

# Затем выберите: Восстановить код и разговор, Восстановить разговор,
# Восстановить код, Суммировать отсюда или Отмена
```

### Расширенные функции
```bash
# Настроить в settings (.claude/settings.json)
# См. 09-advanced-features/config-examples.json

# Режим планирования
/plan Описание задачи

# Режимы разрешений (использовать флаг --permission-mode)
# default        - Запрашивать разрешение на рискованные действия
# acceptEdits    - Авто-принятие правок файлов, запрашивать остальное
# plan           - Анализ только для чтения, без модификаций
# dontAsk        - Принимать все действия, кроме рискованных
# auto           - Фоновый классификатор автоматически решает разрешения
# bypassPermissions - Принимать все действия (требуется --dangerously-skip-permissions)

# Управление сессиями
/resume                # Возобновить предыдущий разговор
/rename "name"         # Назвать текущую сессию
/fork                  # Форкнуть текущую сессию
claude -c              # Продолжить самый последний разговор
claude -r "session"    # Возобновить сессию по имени/ID
```

---

## 📋 Шпаргалка по функциям

| Функция | Путь установки | Использование |
|---------|-------------|-------|
| **Слеш-команды (55+)** | `.claude/commands/*.md` | `/command-name` |
| **Память** | `./CLAUDE.md` | Авто-загрузка |
| **Навыки** | `.claude/skills/*/SKILL.md` | Авто-вызов |
| **Субагенты** | `.claude/agents/*.md` | Авто-делегирование |
| **MCP** | `.mcp.json` (проект) или `~/.claude.json` (пользователь) | `/mcp__server__action` |
| **Хуки (25 событий)** | `~/.claude/hooks/*.sh` | Управление по событиям (4 типа) |
| **Плагины** | Через `/plugin install` | Связки всего |
| **Контрольные точки** | Встроенно | `Esc+Esc` или `/rewind` |
| **Режим планирования** | Встроенно | `/plan <task>` |
| **Режимы разрешений (6)** | Встроенно | `--allowedTools`, `--permission-mode` |
| **Сессии** | Встроенно | `/session <command>` |
| **Фоновые задачи** | Встроенно | Запуск в фоне |
| **Удалённое управление** | Встроенно | WebSocket API |
| **Веб-сессии** | Встроенно | `claude web` |
| **Git Worktrees** | Встроенно | `/worktree` |
| **Авто-память** | Встроенно | Авто-сохранение в CLAUDE.md |
| **Список задач** | Встроенно | `/task list` |
| **Встроенные навыки (5)** | Встроенно | `/simplify`, `/loop`, `/claude-api`, `/voice`, `/browse` |

---

## 🎯 Типичные сценарии использования

### Ревью кода
```bash
# Метод 1: Слеш-команда
cp 01-slash-commands/optimize.md .claude/commands/
# Использование: /optimize

# Метод 2: Субагент
cp 04-subagents/code-reviewer.md .claude/agents/
# Использование: Авто-делегирование

# Метод 3: Навык
cp -r 03-skills/code-review ~/.claude/skills/
# Использование: Авто-вызов

# Метод 4: Плагин (лучший)
/plugin install pr-review
# Использование: /review-pr
```

### Документация
```bash
# Слеш-команда
cp 01-slash-commands/generate-api-docs.md .claude/commands/

# Субагент
cp 04-subagents/documentation-writer.md .claude/agents/

# Навык
cp -r 03-skills/doc-generator ~/.claude/skills/

# Плагин (полное решение)
/plugin install documentation
```

### DevOps
```bash
# Готовый плагин
/plugin install devops-automation

# Команды: /deploy, /rollback, /status, /incident
```

### Команды стандарты
```bash
# Память проекта
cp 02-memory/project-CLAUDE.md ./CLAUDE.md

# Отредактировать под команду
vim CLAUDE.md
```

### Автоматизация и хуки
```bash
# Установить хуки (25 событий, 4 типа: command, http, prompt, agent)
mkdir -p ~/.claude/hooks
cp 06-hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh

# Примеры:
# - Предкоммитные тесты: pre-commit.sh
# - Автоформатирование кода: format-code.sh
# - Сканирование безопасности: security-scan.sh

# Auto Mode для полностью автономных рабочих процессов
claude --enable-auto-mode -p "Refactor and test the auth module"
# Или переключайте режимы интерактивно с помощью Shift+Tab
```

### Безопасный рефакторинг
```bash
# Контрольные точки создаются автоматически перед каждым промптом
# Попробуйте рефакторинг
# Если работает: продолжайте
# Если нет: нажмите Esc+Esc или используйте /rewind для возврата
```

### Сложная реализация
```bash
# Использовать режим планирования
/plan Implement user authentication system

# Claude создаёт детальный план
# Проверьте и одобрите
# Claude систематически реализует
```

### Интеграция CI/CD
```bash
# Запуск в headless-режиме (неинтерактивный)
claude -p "Run all tests and generate report"

# С режимом разрешений для CI
claude -p "Run tests" --permission-mode dontAsk

# С Auto Mode для полностью автономных CI-задач
claude --enable-auto-mode -p "Run tests and fix failures"

# С хуками для автоматизации
# См. 09-advanced-features/README.md
```

### Обучение и эксперименты
```bash
# Использовать режим plan для безопасного анализа
claude --permission-mode plan

# Экспериментируйте безопасно - контрольные точки создаются автоматически
# Если нужно перемотать: нажмите Esc+Esc или используйте /rewind
```

### Команды агентов
```bash
# Включить команды агентов
export CLAUDE_AGENT_TEAMS=1

# Или в settings.json
{ "agentTeams": { "enabled": true } }

# Начните с: "Implement feature X using a team approach"
```

### Запланированные задачи
```bash
# Запускать команду каждые 5 минут
/loop 5m /check-status

# Разовое напоминание
/loop 30m "remind me to check the deploy"
```

---

## 📁 Справочник расположения файлов

```
Ваш проект/
├── .claude/
│   ├── commands/              # Слеш-команды
│   ├── agents/                # Субагенты
│   ├── skills/                # Навыки проекта
│   └── settings.json          # Настройки проекта (хуки и т.д.)
├── .mcp.json                  # MCP-конфигурация (уровень проекта)
├── CLAUDE.md                  # Память проекта
└── src/
    └── api/
        └── CLAUDE.md          # Память для конкретной директории

Домашняя директория/
├── .claude/
│   ├── commands/              # Персональные команды
│   ├── agents/                # Персональные агенты
│   ├── skills/                # Персональные навыки
│   ├── hooks/                 # Скрипты хуков
│   ├── settings.json          # Пользовательские настройки
│   ├── managed-settings.d/    # Управляемые настройки (enterprise/org)
│   └── CLAUDE.md              # Персональная память
└── .claude.json               # Персональный MCP-конфиг (уровень пользователя)
```

---

## 🔍 Поиск примеров

### По категориям
- **Слеш-команды**: `01-slash-commands/`
- **Память**: `02-memory/`
- **Навыки**: `03-skills/`
- **Субагенты**: `04-subagents/`
- **MCP**: `05-mcp/`
- **Хуки**: `06-hooks/`
- **Плагины**: `07-plugins/`
- **Контрольные точки**: `08-checkpoints/`
- **Расширенные функции**: `09-advanced-features/`
- **CLI**: `10-cli/`

### По сценарию использования
- **Производительность**: `01-slash-commands/optimize.md`
- **Безопасность**: `04-subagents/secure-reviewer.md`
- **Тестирование**: `04-subagents/test-engineer.md`
- **Документация**: `03-skills/doc-generator/`
- **DevOps**: `07-plugins/devops-automation/`

### По сложности
- **Просто**: Слеш-команды
- **Средне**: Субагенты, Память
- **Продвинуто**: Навыки, Хуки
- **Полное**: Плагины

---

## 🎓 Путь обучения

### День 1
```bash
# Прочитать обзор
cat README.md

# Установить команду
cp 01-slash-commands/optimize.md .claude/commands/

# Попробовать
/optimize
```

### День 2-3
```bash
# Настроить память
cp 02-memory/project-CLAUDE.md ./CLAUDE.md
vim CLAUDE.md

# Установить субагента
cp 04-subagents/code-reviewer.md .claude/agents/
```

### День 4-5
```bash
# Настроить MCP
export GITHUB_TOKEN="your_token"
cp 05-mcp/github-mcp.json .mcp.json

# Попробовать MCP-команды
/mcp__github__list_prs
```

### Неделя 2
```bash
# Установить навык
cp -r 03-skills/code-review ~/.claude/skills/

# Позвольте ему авто-вызваться
# Просто скажите: "Review this code for issues"
```

### Неделя 3+
```bash
# Установить готовый плагин
/plugin install pr-review

# Использовать связанные функции
/review-pr
/check-security
/check-tests
```

---

## Новые функции (март 2026)

| Функция | Описание | Использование |
|---------|-------------|-------|
| **Auto Mode** | Полностью автономная работа с фоновым классификатором | Флаг `--enable-auto-mode`, `Shift+Tab` для переключения режимов |
| **Channels** | Интеграция Discord и Telegram | Флаг `--channels`, боты Discord/Telegram |
| **Voice Dictation** | Голосовой ввод команд и контекста | Команда `/voice` |
| **Хуки (25 событий)** | Расширенная система хуков с 4 типами | Типы хуков: command, http, prompt, agent |
| **MCP Elicitation** | MCP-серверы могут запрашивать ввод пользователя во время работы | Авто-запрос когда серверу нужны уточнения |
| **WebSocket MCP** | WebSocket-транспорт для MCP-подключений | Настроить в `.mcp.json` с URL `ws://` |
| **Plugin LSP** | Поддержка Language Server Protocol для плагинов | `userConfig`, переменная `${CLAUDE_PLUGIN_DATA}` |
| **Удалённое управление** | Управление Claude Code через WebSocket API | `claude --remote` для внешних интеграций |
| **Веб-сессии** | Браузерный интерфейс Claude Code | `claude web` для запуска |
| **Desktop-приложение** | Нативное десктоп-приложение | Скачать с claude.ai/download |
| **Список задач** | Управление фоновыми задачами | `/task list`, `/task status <id>` |
| **Авто-память** | Автоматическое сохранение памяти из разговоров | Claude автоматически сохраняет ключевой контекст в CLAUDE.md |
| **Git Worktrees** | Изолированные рабочие пространства для параллельной разработки | `/worktree` для создания изолированного пространства |
| **Выбор модели** | Переключение между Sonnet 4.6 и Opus 4.6 | `/model` или флаг `--model` |
| **Команды агентов** | Координация нескольких агентов в задачах | Включить с помощью переменной окружения `CLAUDE_AGENT_TEAMS=1` |
| **Запланированные задачи** | Повторяющиеся задачи с `/loop` | `/loop 5m /command` или инструмент CronCreate |
| **Интеграция Chrome** | Автоматизация браузера | Флаг `--chrome` или команда `/chrome` |
| **Настройка клавиатуры** | Пользовательские сочетания клавиш | Команда `/keybindings` |

---

## Советы и хитрости

### Кастомизация
- Начните с примеров как есть
- Модифицируйте под ваши нужды
- Тестируйте перед распространением в команде
- Используйте версионирование для конфигураций

### Лучшие практики
- Используйте память для командных стандартов
- Используйте плагины для полных рабочих процессов
- Используйте субагентов для сложных задач
- Используйте слеш-команды для быстрых задач

### Устранение неполадок
```bash
# Проверить расположение файлов
ls -la .claude/commands/
ls -la .claude/agents/

# Проверить YAML-синтаксис
head -20 .claude/agents/code-reviewer.md

# Проверить MCP-подключение
echo $GITHUB_TOKEN
```

---

## 📊 Матрица функций

| Потребность | Использовать | Пример |
|------|----------|---------|
| Быстрая комбинация | Слеш-команда (55+) | `01-slash-commands/optimize.md` |
| Команды стандарты | Память | `02-memory/project-CLAUDE.md` |
| Авто-рабочий процесс | Навык | `03-skills/code-review/` |
| Специализированная задача | Субагент | `04-subagents/code-reviewer.md` |
| Внешние данные | MCP (+ Elicitation, WebSocket) | `05-mcp/github-mcp.json` |
| Событийная автоматизация | Хук (25 событий, 4 типа) | `06-hooks/pre-commit.sh` |
| Полное решение | Плагин (+ LSP-поддержка) | `07-plugins/pr-review/` |
| Безопасный эксперимент | Контрольная точка | `08-checkpoints/checkpoint-examples.md` |
| Полностью автономно | Auto Mode | `--enable-auto-mode` или `Shift+Tab` |
| Интеграция чатов | Channels | `--channels` (Discord, Telegram) |
| CI/CD-конвейер | CLI | `10-cli/README.md` |

---

## 🔗 Быстрые ссылки

- **Главное руководство**: `README.md`
- **Полный индекс**: `INDEX.md`
- **Сводка**: `EXAMPLES_SUMMARY.md`
- **Оригинальное руководство**: `claude_concepts_guide.md`

---

## 📞 Частые вопросы

**В: Что мне использовать?**
О: Начните со слеш-команд, добавляйте функции по мере необходимости.

**В: Можно ли смешивать функции?**
О: Да! Они работают вместе. Память + Команды + MCP = мощь.

**В: Как поделиться с командой?**
О: Закоммитьте директорию `.claude/` в git.

**В: Что насчёт секретов?**
О: Используйте переменные окружения, никогда не хардкодьте.

**В: Можно ли модифицировать примеры?**
О: Абсолютно! Это шаблоны для кастомизации.

---

## ✅ Чеклист

Чеклист для начала работы:

- [ ] Прочитать `README.md`
- [ ] Установить 1 слеш-команду
- [ ] Попробовать команду
- [ ] Создать `CLAUDE.md` проекта
- [ ] Установить 1 субагента
- [ ] Настроить 1 MCP-интеграцию
- [ ] Установить 1 навык
- [ ] Попробовать готовый плагин
- [ ] Кастомизировать под нужды
- [ ] Поделиться с командой

---

**Быстрый старт**: `cat README.md`

**Полный индекс**: `cat INDEX.md`

**Эта карточка**: Держите под рукой для быстрой справки!
