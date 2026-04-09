<picture>
  <source media="(prefers-color-scheme: dark)" srcset="resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="resources/logos/claude-howto-logo.svg">
</picture>

# Примеры Claude Code — Полный индекс

Этот документ содержит полный индекс всех примеров, организованных по типам функций.

## Сводная статистика

- **Всего файлов**: 100+ файлов
- **Категорий**: 10 категорий функций
- **Плагинов**: 3 готовых плагина
- **Навыков (Skills)**: 6 готовых навыков
- **Хуков (Hooks)**: 8 примеров хуков
- **Готовы к использованию**: Все примеры

---

## 01. Слеш-команды (Slash Commands) — 10 файлов

Вызываемые пользователем сочетания клавиш для часто используемых рабочих процессов.

| Файл | Описание | Сценарий использования |
|------|-------------|----------|
| `optimize.md` | Анализатор оптимизации кода | Поиск проблем с производительностью |
| `pr.md` | Подготовка pull request | Автоматизация рабочего процесса PR |
| `generate-api-docs.md` | Генератор документации API | Генерация API-документации |
| `commit.md` | Помощник по сообщениям коммитов | Стандартизированные коммиты |
| `setup-ci-cd.md` | Настройка CI/CD-конвейера | Автоматизация DevOps |
| `push-all.md` | Отправка всех изменений | Быстрый рабочий процесс push |
| `unit-test-expand.md` | Расширение покрытия unit-тестами | Автоматизация тестирования |
| `doc-refactor.md` | Рефакторинг документации | Улучшение документации |
| `pr-slash-command.png` | Скриншот-пример | Визуальная справка |
| `README.md` | Документация | Руководство по настройке и использованию |

**Путь установки**: `.claude/commands/`

**Использование**: `/optimize`, `/pr`, `/generate-api-docs`, `/commit`, `/setup-ci-cd`, `/push-all`, `/unit-test-expand`, `/doc-refactor`

---

## 02. Память (Memory) — 6 файлов

Постоянный контекст и стандарты проекта.

| Файл | Описание | Область | Расположение |
|------|-------------|-------|----------|
| `project-CLAUDE.md` | Команды стандарты проекта | Весь проект | `./CLAUDE.md` |
| `directory-api-CLAUDE.md` | Правила для API | Директория | `./src/api/CLAUDE.md` |
| `personal-CLAUDE.md` | Персональные настройки | Пользователь | `~/.claude/CLAUDE.md` |
| `memory-saved.png` | Скриншот: память сохранена | - | Визуальная справка |
| `memory-ask-claude.png` | Скриншот: спросить Claude | - | Визуальная справка |
| `README.md` | Документация | - | Справочник |

**Установка**: Копировать в соответствующее расположение

**Использование**: Автоматически загружается Claude

---

## 03. Навыки (Skills) — 28 файлов

Автоматически вызываемые возможности со скриптами и шаблонами.

### Навык Code Review (5 файлов)
```
code-review/
├── SKILL.md                          # Определение навыка
├── scripts/
│   ├── analyze-metrics.py            # Анализатор метрик кода
│   └── compare-complexity.py         # Сравнение сложности
└── templates/
    ├── review-checklist.md           # Чеклист ревью
    └── finding-template.md           # Шаблон документирования находок
```

**Назначение**: Комплексный обзор кода с анализом безопасности, производительности и качества

**Автоматический вызов**: При ревью кода

---

### Навык Brand Voice (4 файла)
```
brand-voice/
├── SKILL.md                          # Определение навыка
├── templates/
│   ├── email-template.txt            # Формат email
│   └── social-post-template.txt      # Формат социальных сетей
└── tone-examples.md                  # Примеры сообщений
```

**Назначение**: Обеспечение единого голоса бренда в коммуникациях

**Автоматический вызов**: При создании маркетинговых материалов

---

### Навык Documentation Generator (2 файла)
```
doc-generator/
├── SKILL.md                          # Определение навыка
└── generate-docs.py                  # Python-экстрактор документации
```

**Назначение**: Генерация комплексной API-документации из исходного кода

**Автоматический вызов**: При создании/обновлении API-документации

---

### Навык Refactor (5 файлов)
```
refactor/
├── SKILL.md                          # Определение навыка
├── scripts/
│   ├── analyze-complexity.py         # Анализатор сложности
│   └── detect-smells.py              # Детектор запахов кода
├── references/
│   ├── code-smells.md                # Каталог запахов кода
│   └── refactoring-catalog.md        # Паттерны рефакторинга
└── templates/
    └── refactoring-plan.md           # Шаблон плана рефакторинга
```

**Назначение**: Систематический рефакторинг кода с анализом сложности

**Автоматический вызов**: При рефакторинге кода

---

### Навык Claude MD (1 файл)
```
claude-md/
└── SKILL.md                          # Определение навыка
```

**Назначение**: Управление и оптимизация файлов CLAUDE.md

---

### Навык Blog Draft (3 файла)
```
blog-draft/
├── SKILL.md                          # Определение навыка
└── templates/
    ├── draft-template.md             # Шаблон черновика блога
    └── outline-template.md           # Шаблон структуры блога
```

**Назначение**: Создание черновиков постов блога с единой структурой

**Плюс**: `README.md` — Обзор навыков и руководство по использованию

**Путь установки**: `~/.claude/skills/` или `.claude/skills/`

---

## 04. Субагенты (Subagents) — 9 файлов

Специализированные ИИ-ассистенты с пользовательскими возможностями.

| Файл | Описание | Инструменты | Сценарий использования |
|------|-------------|-------|----------|
| `code-reviewer.md` | Анализ качества кода | read, grep, diff, lint_runner | Комплексные обзоры |
| `test-engineer.md` | Анализ покрытия тестами | read, write, bash, grep | Автоматизация тестирования |
| `documentation-writer.md` | Создание документации | read, write, grep | Генерация документации |
| `secure-reviewer.md` | Проверка безопасности (только чтение) | read, grep | Аудиты безопасности |
| `implementation-agent.md` | Полная реализация | read, write, bash, grep, edit, glob | Разработка функций |
| `debugger.md` | Специалист по отладке | read, bash, grep | Расследование багов |
| `data-scientist.md` | Специалист по анализу данных | read, write, bash | Рабочие процессы с данными |
| `clean-code-reviewer.md` | Стандарты чистого кода | read, grep | Качество кода |
| `README.md` | Документация | - | Руководство по настройке и использованию |

**Путь установки**: `.claude/agents/`

**Использование**: Автоматически делегируются основным агентом

---

## 05. Протокол MCP (5 файлов)

Интеграции внешних инструментов и API.

| Файл | Описание | Интеграция | Сценарий использования |
|------|-------------|-----------------|----------|
| `github-mcp.json` | Интеграция с GitHub | GitHub API | Управление PR/задачами |
| `database-mcp.json` | Запросы к базе данных | PostgreSQL/MySQL | Запросы к живым данным |
| `filesystem-mcp.json` | Операции с файлами | Локальная файловая система | Управление файлами |
| `multi-mcp.json` | Несколько серверов | GitHub + DB + Slack | Комплексная интеграция |
| `README.md` | Документация | - | Руководство по настройке и использованию |

**Путь установки**: `.mcp.json` (уровень проекта) или `~/.claude.json` (уровень пользователя)

**Использование**: `/mcp__github__list_prs` и т.д.

---

## 06. Хуки (Hooks) — 9 файлов

Скрипты автоматизации с управлением по событиям, выполняющиеся автоматически.

| Файл | Описание | Событие | Сценарий использования |
|------|-------------|-------|----------|
| `format-code.sh` | Автоформатирование кода | PreToolUse:Write | Форматирование кода |
| `pre-commit.sh` | Запуск тестов перед коммитом | PreToolUse:Bash | Автоматизация тестирования |
| `security-scan.sh` | Сканирование безопасности | PostToolUse:Write | Проверки безопасности |
| `log-bash.sh` | Логирование bash-команд | PostToolUse:Bash | Логирование команд |
| `validate-prompt.sh` | Валидация промптов | PreToolUse | Валидация ввода |
| `notify-team.sh` | Отправка уведомлений | Notification | Уведомления команды |
| `context-tracker.py` | Отслеживание использования контекстного окна | PostToolUse | Мониторинг контекста |
| `context-tracker-tiktoken.py` | Отслеживание контекста на основе токенов | PostToolUse | Точный подсчёт токенов |
| `README.md` | Документация | - | Руководство по настройке и использованию |

**Путь установки**: Настраивается в `~/.claude/settings.json`

**Использование**: Настроены в settings, выполняются автоматически

**Типы хуков** (4 типа, 25 событий):
- Хуки инструментов: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest
- Хуки сессий: SessionStart, SessionEnd, Stop, StopFailure, SubagentStart, SubagentStop
- Хуки задач: UserPromptSubmit, TaskCompleted, TaskCreated, TeammateIdle
- Хуки жизненного цикла: ConfigChange, CwdChanged, FileChanged, PreCompact, PostCompact, WorktreeCreate, WorktreeRemove, Notification, InstructionsLoaded, Elicitation, ElicitationResult

---

## 07. Плагины (Plugins) — 3 готовых плагина, 40 файлов

Связанные коллекции функций.

### Плагин PR Review (10 файлов)
```
pr-review/
├── .claude-plugin/
│   └── plugin.json                   # Манифест плагина
├── commands/
│   ├── review-pr.md                  # Комплексный обзор
│   ├── check-security.md             # Проверка безопасности
│   └── check-tests.md                # Проверка покрытия тестами
├── agents/
│   ├── security-reviewer.md          # Специалист по безопасности
│   ├── test-checker.md               # Специалист по тестам
│   └── performance-analyzer.md       # Специалист по производительности
├── mcp/
│   └── github-config.json            # Интеграция с GitHub
├── hooks/
│   └── pre-review.js                 # Предварительная валидация ревью
└── README.md                         # Документация плагина
```

**Возможности**: Анализ безопасности, покрытие тестами, влияние на производительность

**Команды**: `/review-pr`, `/check-security`, `/check-tests`

**Установка**: `/plugin install pr-review`

---

### Плагин DevOps Automation (15 файлов)
```
devops-automation/
├── .claude-plugin/
│   └── plugin.json                   # Манифест плагина
├── commands/
│   ├── deploy.md                     # Развёртывание
│   ├── rollback.md                   # Откат
│   ├── status.md                     # Статус системы
│   └── incident.md                   # Реагирование на инциденты
├── agents/
│   ├── deployment-specialist.md      # Эксперт по развёртыванию
│   ├── incident-commander.md         # Координатор инцидентов
│   └── alert-analyzer.md             # Анализатор алертов
├── mcp/
│   └── kubernetes-config.json        # Интеграция с Kubernetes
├── hooks/
│   ├── pre-deploy.js                 # Преддеплойные проверки
│   └── post-deploy.js                # Постдеплойные задачи
├── scripts/
│   ├── deploy.sh                     # Автоматизация развёртывания
│   ├── rollback.sh                   # Автоматизация отката
│   └── health-check.sh               # Проверки здоровья
└── README.md                         # Документация плагина
```

**Возможности**: Развёртывание Kubernetes, откат, мониторинг, реагирование на инциденты

**Команды**: `/deploy`, `/rollback`, `/status`, `/incident`

**Установка**: `/plugin install devops-automation`

---

### Плагин Documentation (14 файлов)
```
documentation/
├── .claude-plugin/
│   └── plugin.json                   # Манифест плагина
├── commands/
│   ├── generate-api-docs.md          # Генерация API-документации
│   ├── generate-readme.md            # Создание README
│   ├── sync-docs.md                  # Синхронизация документации
│   └── validate-docs.md              # Валидация документации
├── agents/
│   ├── api-documenter.md             # Специалист по API-документации
│   ├── code-commentator.md           # Специалист по комментариям к коду
│   └── example-generator.md          # Создатель примеров
├── mcp/
│   └── github-docs-config.json       # Интеграция с GitHub
├── templates/
│   ├── api-endpoint.md               # Шаблон API-эндпоинта
│   ├── function-docs.md              # Шаблон документации функции
│   └── adr-template.md               # Шаблон ADR
└── README.md                         # Документация плагина
```

**Возможности**: API-документация, генерация README, синхронизация документов, валидация

**Команды**: `/generate-api-docs`, `/generate-readme`, `/sync-docs`, `/validate-docs`

**Установка**: `/plugin install documentation`

**Плюс**: `README.md` — Обзор плагинов и руководство по использованию

---

## 08. Контрольные точки и перемотка (Checkpoints and Rewind) — 2 файла

Сохранение состояния разговора и исследование альтернативных подходов.

| Файл | Описание | Содержание |
|------|-------------|----------|
| `README.md` | Документация | Комплексное руководство по контрольным точкам |
| `checkpoint-examples.md` | Реальные примеры | Миграция баз данных, оптимизация производительности, итерации UI, отладка |
| | | |

**Ключевые концепции**:
- **Checkpoint**: Снимок состояния разговора
- **Rewind (Перемотка)**: Возврат к предыдущей контрольной точке
- **Branch Point (Точка ветвления)**: Исследование нескольких подходов

**Использование**:
```
# Контрольные точки создаются автоматически с каждым промптом пользователя
# Для перемотки нажмите Esc дважды или используйте:
/rewind
# Затем выберите: Восстановить код и разговор, Восстановить разговор,
# Восстановить код, Суммировать отсюда или Отмена
```

**Сценарии использования**:
- Пробовать разные реализации
- Восстановление после ошибок
- Безопасные эксперименты
- Сравнение решений
- A/B тестирование

---

## 09. Расширенные функции (Advanced Features) — 3 файла

Продвинутые возможности для комплексных рабочих процессов.

| Файл | Описание | Возможности |
|------|-------------|----------|
| `README.md` | Полное руководство | Документация всех расширенных функций |
| `config-examples.json` | Примеры конфигураций | 10+ сценариев использования |
| `planning-mode-examples.md` | Примеры планирования | REST API, миграция баз данных, рефакторинг |
| Scheduled Tasks | Регулярные задачи с `/loop` и cron-инструментами | Автоматизированные повторяющиеся рабочие процессы |
| Chrome Integration | Автоматизация браузера через headless Chromium | Веб-тестирование и скрейпинг |
| Remote Control (расширенный) | Методы подключения, безопасность, таблица сравнения | Управление удалёнными сессиями |
| Keyboard Customization | Пользовательские сочетания клавиш, поддержка аккордов, контексты | Персонализированные горячие клавиши |
| Desktop App (расширенный) | Коннекторы, launch.json, enterprise-функции | Интеграция с десктопом |
| | | |

**Охватываемые расширенные функции**:

### Режим планирования (Planning Mode)
- Создание детальных планов реализации
- Оценки времени и оценка рисков
- Систематическое разбиение задач

### Extended Thinking (Расширенное мышление)
- Глубокое рассуждение для комплексных проблем
- Анализ архитектурных решений
- Оценка компромиссов

### Фоновые задачи (Background Tasks)
- Долгосрочные операции без блокировки
- Параллельные рабочие процессы разработки
- Управление задачами и мониторинг

### Режимы разрешений (Permission Modes)
- **default**: Запрашивать разрешение на рискованные действия
- **acceptEdits**: Авто-принятие правок файлов, запрашивать остальное
- **plan**: Анализ только для чтения, без модификаций
- **auto**: Автоматически одобрять безопасные действия, запрашивать рискованные
- **dontAsk**: Принимать все действия, кроме рискованных
- **bypassPermissions**: Принимать всё (требуется `--dangerously-skip-permissions`)

### Headless-режим (`claude -p`)
- Интеграция CI/CD
- Автоматизированное выполнение задач
- Пакетная обработка

### Управление сессиями (Session Management)
- Несколько рабочих сессий
- Переключение и сохранение сессий
- Персистентность сессий

### Интерактивные функции (Interactive Features)
- Горячие клавиши
- История команд
- Автодополнение Tab
- Многострочный ввод

### Конфигурация (Configuration)
- Комплексное управление настройками
- Конфиги для специфичных окружений
- Пользовательские настройки для каждого проекта

### Запланированные задачи (Scheduled Tasks)
- Повторяющиеся задачи с командой `/loop`
- Cron-инструменты: CronCreate, CronList, CronDelete
- Автоматизированные повторяющиеся рабочие процессы

### Интеграция Chrome
- Автоматизация браузера через headless Chromium
- Возможности веб-тестирования и скрейпинга
- Взаимодействие со страницами и извлечение данных

### Удалённое управление (расширенное)
- Методы подключения и протоколы
- Вопросы безопасности и лучшие практики
- Таблица сравнения опций удалённого доступа

### Настройка клавиатуры
- Конфигурация пользовательских сочетаний клавиш
- Поддержка аккордов для многоклавишных сочетаний
- Контекстно-зависимая активация сочетаний клавиш

### Desktop-приложение (расширенное)
- Коннекторы для интеграции IDE
- Конфигурация launch.json
- Enterprise-функции и развёртывание

---

## 10. Использование CLI — 1 файл

Шаблоны использования командной строки и справочник.

| Файл | Описание | Содержание |
|------|-------------|----------|
| `README.md` | CLI-документация | Флаги, опции и шаблоны использования |

**Ключевые возможности CLI**:
- `claude` — Запуск интерактивной сессии
- `claude -p "prompt"` — Headless/неинтерактивный режим
- `claude web` — Запуск веб-сессии
- `claude --model` — Выбор модели (Sonnet 4.6, Opus 4.6)
- `claude --permission-mode` — Установка режима разрешений
- `claude --remote` — Включение удалённого управления через WebSocket

---

## Файлы документации — 13 файлов

| Файл | Расположение | Описание |
|------|----------|-------------|
| `README.md` | `/` | Обзор примеров |
| `INDEX.md` | `/` | Этот полный индекс |
| `QUICK_REFERENCE.md` | `/` | Карточка быстрой справки |
| `README.md` | `/01-slash-commands/` | Руководство по слеш-командам |
| `README.md` | `/02-memory/` | Руководство по памяти |
| `README.md` | `/03-skills/` | Руководство по навыкам |
| `README.md` | `/04-subagents/` | Руководство по субагентам |
| `README.md` | `/05-mcp/` | Руководство по MCP |
| `README.md` | `/06-hooks/` | Руководство по хукам |
| `README.md` | `/07-plugins/` | Руководство по плагинам |
| `README.md` | `/08-checkpoints/` | Руководство по контрольным точкам |
| `README.md` | `/09-advanced-features/` | Руководство по расширенным функциям |
| `README.md` | `/10-cli/` | Руководство по CLI |

---

## Полное дерево файлов

```
claude-howto/
├── README.md                                    # Главный обзор
├── INDEX.md                                     # Этот файл
├── QUICK_REFERENCE.md                           # Карточка быстрой справки
├── claude_concepts_guide.md                     # Оригинальное руководство
│
├── 01-slash-commands/                           # Слеш-команды
│   ├── optimize.md
│   ├── pr.md
│   ├── generate-api-docs.md
│   ├── commit.md
│   ├── setup-ci-cd.md
│   ├── push-all.md
│   ├── unit-test-expand.md
│   ├── doc-refactor.md
│   ├── pr-slash-command.png
│   └── README.md
│
├── 02-memory/                                   # Память
│   ├── project-CLAUDE.md
│   ├── directory-api-CLAUDE.md
│   ├── personal-CLAUDE.md
│   ├── memory-saved.png
│   ├── memory-ask-claude.png
│   └── README.md
│
├── 03-skills/                                   # Навыки
│   ├── code-review/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── analyze-metrics.py
│   │   │   └── compare-complexity.py
│   │   └── templates/
│   │       ├── review-checklist.md
│   │       └── finding-template.md
│   ├── brand-voice/
│   │   ├── SKILL.md
│   │   ├── templates/
│   │   │   ├── email-template.txt
│   │   │   └── social-post-template.txt
│   │   └── tone-examples.md
│   ├── doc-generator/
│   │   ├── SKILL.md
│   │   └── generate-docs.py
│   ├── refactor/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── analyze-complexity.py
│   │   │   └── detect-smells.py
│   │   ├── references/
│   │   │   ├── code-smells.md
│   │   │   └── refactoring-catalog.md
│   │   └── templates/
│   │       └── refactoring-plan.md
│   ├── claude-md/
│   │   └── SKILL.md
│   ├── blog-draft/
│   │   ├── SKILL.md
│   │   └── templates/
│   │       ├── draft-template.md
│   │       └── outline-template.md
│   └── README.md
│
├── 04-subagents/                                # Субагенты
│   ├── code-reviewer.md
│   ├── test-engineer.md
│   ├── documentation-writer.md
│   ├── secure-reviewer.md
│   ├── implementation-agent.md
│   ├── debugger.md
│   ├── data-scientist.md
│   ├── clean-code-reviewer.md
│   └── README.md
│
├── 05-mcp/                                      # Протокол MCP
│   ├── github-mcp.json
│   ├── database-mcp.json
│   ├── filesystem-mcp.json
│   ├── multi-mcp.json
│   └── README.md
│
├── 06-hooks/                                    # Хуки
│   ├── format-code.sh
│   ├── pre-commit.sh
│   ├── security-scan.sh
│   ├── log-bash.sh
│   ├── validate-prompt.sh
│   ├── notify-team.sh
│   ├── context-tracker.py
│   ├── context-tracker-tiktoken.py
│   └── README.md
│
├── 07-plugins/                                  # Плагины
│   ├── pr-review/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── commands/
│   │   │   ├── review-pr.md
│   │   │   ├── check-security.md
│   │   │   └── check-tests.md
│   │   ├── agents/
│   │   │   ├── security-reviewer.md
│   │   │   ├── test-checker.md
│   │   │   └── performance-analyzer.md
│   │   ├── mcp/
│   │   │   └── github-config.json
│   │   ├── hooks/
│   │   │   └── pre-review.js
│   │   └── README.md
│   ├── devops-automation/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── commands/
│   │   │   ├── deploy.md
│   │   │   ├── rollback.md
│   │   │   ├── status.md
│   │   │   └── incident.md
│   │   ├── agents/
│   │   │   ├── deployment-specialist.md
│   │   │   ├── incident-commander.md
│   │   │   └── alert-analyzer.md
│   │   ├── mcp/
│   │   │   └── kubernetes-config.json
│   │   ├── hooks/
│   │   │   ├── pre-deploy.js
│   │   │   └── post-deploy.js
│   │   ├── scripts/
│   │   │   ├── deploy.sh
│   │   │   ├── rollback.sh
│   │   │   └── health-check.sh
│   │   └── README.md
│   ├── documentation/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── commands/
│   │   │   ├── generate-api-docs.md
│   │   │   ├── generate-readme.md
│   │   │   ├── sync-docs.md
│   │   │   └── validate-docs.md
│   │   ├── agents/
│   │   │   ├── api-documenter.md
│   │   │   ├── code-commentator.md
│   │   │   └── example-generator.md
│   │   ├── mcp/
│   │   │   └── github-docs-config.json
│   │   ├── templates/
│   │   │   ├── api-endpoint.md
│   │   │   ├── function-docs.md
│   │   │   └── adr-template.md
│   │   └── README.md
│   └── README.md
│
├── 08-checkpoints/                              # Контрольные точки
│   ├── checkpoint-examples.md
│   └── README.md
│
├── 09-advanced-features/                        # Расширенные функции
│   ├── config-examples.json
│   ├── planning-mode-examples.md
│   └── README.md
│
└── 10-cli/                                      # Использование CLI
    └── README.md
```

---

## Быстрый старт по сценарию использования

### Качество кода и ревью
```bash
# Установить слеш-команду
cp 01-slash-commands/optimize.md .claude/commands/

# Установить субагента
cp 04-subagents/code-reviewer.md .claude/agents/

# Установить навык
cp -r 03-skills/code-review ~/.claude/skills/

# Или установить готовый плагин
/plugin install pr-review
```

### DevOps и развёртывание
```bash
# Установить плагин (включает всё)
/plugin install devops-automation
```

### Документация
```bash
# Установить слеш-команду
cp 01-slash-commands/generate-api-docs.md .claude/commands/

# Установить субагента
cp 04-subagents/documentation-writer.md .claude/agents/

# Установить навык
cp -r 03-skills/doc-generator ~/.claude/skills/

# Или установить готовый плагин
/plugin install documentation
```

### Команды стандарты
```bash
# Настроить память проекта
cp 02-memory/project-CLAUDE.md ./CLAUDE.md

# Отредактировать в соответствии со стандартами команды
```

### Внешние интеграции
```bash
# Установить переменные окружения
export GITHUB_TOKEN="your_token"
export DATABASE_URL="postgresql://..."

# Установить MCP-конфиг (уровень проекта)
cp 05-mcp/multi-mcp.json .mcp.json
```

### Автоматизация и валидация
```bash
# Установить хуки
mkdir -p ~/.claude/hooks
cp 06-hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh

# Настроить хуки в settings (~/.claude/settings.json)
# См. 06-hooks/README.md
```

### Безопасные эксперименты
```bash
# Контрольные точки создаются автоматически с каждым промптом пользователя
# Для перемотки: нажмите Esc+Esc или используйте /rewind
# Затем выберите что восстановить из меню перемотки

# См. 08-checkpoints/README.md для примеров
```

### Продвинутые рабочие процессы
```bash
# Настроить расширенные функции
# См. 09-advanced-features/config-examples.json

# Использовать режим планирования
/plan Implement feature X

# Использовать режимы разрешений
claude --permission-mode plan          # Для ревью кода (только чтение)
claude --permission-mode acceptEdits   # Авто-принятие правок
claude --permission-mode auto          # Авто-одобрение безопасных действий

# Запустить в headless-режиме для CI/CD
claude -p "Run tests and report results"

# Запустить фоновые задачи
Run tests in background

# См. 09-advanced-features/README.md для полного руководства
```

---

## Матрица покрытия функций

| Категория | Команды | Агенты | MCP | Хуки | Скрипты | Шаблоны | Доки | Изображения | Итого |
|----------|----------|--------|-----|-------|---------|-----------|------|--------|-------|
| **01 Слеш-команды** | 8 | - | - | - | - | - | 1 | 1 | **10** |
| **02 Память** | - | - | - | - | - | 3 | 1 | 2 | **6** |
| **03 Навыки** | - | - | - | - | 5 | 9 | 1 | - | **28** |
| **04 Субагенты** | - | 8 | - | - | - | - | 1 | - | **9** |
| **05 MCP** | - | - | 4 | - | - | - | 1 | - | **5** |
| **06 Хуки** | - | - | - | 8 | - | - | 1 | - | **9** |
| **07 Плагины** | 11 | 9 | 3 | 3 | 3 | 3 | 4 | - | **40** |
| **08 Контрольные точки** | - | - | - | - | - | - | 1 | 1 | **2** |
| **09 Расширенные** | - | - | - | - | - | - | 1 | 2 | **3** |
| **10 CLI** | - | - | - | - | - | - | 1 | - | **1** |

---

## Путь обучения

### Начинающий (Неделя 1)
1. ✅ Прочитать `README.md`
2. ✅ Установить 1-2 слеш-команды
3. ✅ Создать файл памяти проекта
4. ✅ Попробовать базовые команды

### Средний уровень (Недели 2-3)
1. ✅ Настроить GitHub MCP
2. ✅ Установить субагента
3. ✅ Попробовать делегировать задачи
4. ✅ Установить навык

### Продвинутый уровень (Неделя 4+)
1. ✅ Установить готовый плагин
2. ✅ Создать пользовательские слеш-команды
3. ✅ Создать пользовательского субагента
4. ✅ Создать пользовательский навык
5. ✅ Собрать свой плагин

### Эксперт (Неделя 5+)
1. ✅ Настроить хуки для автоматизации
2. ✅ Использовать контрольные точки для экспериментов
3. ✅ Настроить режим планирования
4. ✅ Эффективно использовать режимы разрешений
5. ✅ Настроить headless-режим для CI/CD
6. ✅ Освоить управление сессиями

---

## Поиск по ключевым словам

### Производительность
- `01-slash-commands/optimize.md` — Анализ производительности
- `04-subagents/code-reviewer.md` — Ревью производительности
- `03-skills/code-review/` — Метрики производительности
- `07-plugins/pr-review/agents/performance-analyzer.md` — Специалист по производительности

### Безопасность
- `04-subagents/secure-reviewer.md` — Ревью безопасности
- `03-skills/code-review/` — Анализ безопасности
- `07-plugins/pr-review/` — Проверки безопасности

### Тестирование
- `04-subagents/test-engineer.md` — Тест-инженер
- `07-plugins/pr-review/commands/check-tests.md` — Покрытие тестами

### Документация
- `01-slash-commands/generate-api-docs.md` — Команда API-документации
- `04-subagents/documentation-writer.md` — Агент-документалист
- `03-skills/doc-generator/` — Навык генератора документации
- `07-plugins/documentation/` — Готовый плагин документации

### Развёртывание
- `07-plugins/devops-automation/` — Полное решение DevOps

### Автоматизация
- `06-hooks/` — Автоматизация с управлением по событиям
- `06-hooks/pre-commit.sh` — Предкоммитная автоматизация
- `06-hooks/format-code.sh` — Автоформатирование
- `09-advanced-features/` — Headless-режим для CI/CD

### Валидация
- `06-hooks/security-scan.sh` — Валидация безопасности
- `06-hooks/validate-prompt.sh` — Валидация промптов

### Эксперименты
- `08-checkpoints/` — Безопасные эксперименты с перемоткой
- `08-checkpoints/checkpoint-examples.md` — Реальные примеры

### Планирование
- `09-advanced-features/planning-mode-examples.md` — Примеры режима планирования
- `09-advanced-features/README.md` — Extended thinking

### Конфигурация
- `09-advanced-features/config-examples.json` — Примеры конфигураций

---

## Примечания

- Все примеры готовы к использованию
- Модифицируйте под ваши конкретные нужды
- Примеры следуют лучшим практикам Claude Code
- Каждая категория имеет свой README с детальными инструкциями
- Скрипты включают надлежащую обработку ошибок
- Шаблоны настраиваемы

---

## Вклад в проект

Хотите добавить больше примеров? Следуйте структуре:
1. Создать соответствующий подкаталог
2. Включить README.md с инструкциями по использованию
3. Следовать соглашениям об именовании
4. Тщательно тестировать
5. Обновить этот индекс

---

**Последнее обновление**: Март 2026
**Всего примеров**: 100+ файлов
**Категорий**: 10 функций
**Хуков**: 8 скриптов автоматизации
**Примеров конфигураций**: 10+ сценариев
**Готовы к использованию**: Все примеры

</picture>
