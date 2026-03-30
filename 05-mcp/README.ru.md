<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="../resources/logos/claude-howto-logo.svg">
</picture>

# MCP (Model Context Protocol)

Эта папка содержит полную документацию и примеры конфигураций MCP-серверов и их использования с Claude Code.

## Обзор

MCP (Model Context Protocol) — стандартизированный способ доступа Claude к внешним инструментам, API и источникам данных в реальном времени. В отличие от Памяти, MCP обеспечивает живой доступ к изменяющимся данным.

Ключевые характеристики:
- Доступ к внешним сервисам в реальном времени
- Синхронизация данных в реальном времени
- Расширяемая архитектура
- Безопасная аутентификация
- Взаимодействия на основе инструментов

## Архитектура MCP

```mermaid
graph TB
    A["Claude"]
    B["MCP-сервер"]
    C["Внешний сервис"]

    A -->|Запрос: list_issues| B
    B -->|Запрос| C
    C -->|Данные| B
    B -->|Ответ| A

    A -->|Запрос: create_issue| B
    B -->|Действие| C
    C -->|Результат| B
    B -->|Ответ| A
```

## Экосистема MCP

```mermaid
graph TB
    A["Claude"] -->|MCP| B["Filesystem\nMCP Server"]
    A -->|MCP| C["GitHub\nMCP Server"]
    A -->|MCP| D["Database\nMCP Server"]
    A -->|MCP| E["Slack\nMCP Server"]
    A -->|MCP| F["Google Docs\nMCP Server"]

    B -->|File I/O| G["Локальные файлы"]
    C -->|API| H["GitHub Репозитории"]
    D -->|Query| I["PostgreSQL/MySQL"]
    E -->|Messages| J["Slack Workspace"]
    F -->|Docs| K["Google Drive"]
```

## Методы установки MCP

Claude Code поддерживает несколько транспортных протоколов для MCP-соединений:

### HTTP-транспорт (Рекомендуется)

```bash
# Базовое HTTP-соединение
claude mcp add --transport http notion https://mcp.notion.com/mcp

# HTTP с заголовком аутентификации
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer твой-токен"
```

### Stdio-транспорт (Локальный)

Для локально запущенных MCP-серверов:

```bash
# Локальный Node.js-сервер
claude mcp add --transport stdio myserver -- npx @myorg/mcp-server

# С переменными окружения
claude mcp add --transport stdio myserver --env KEY=value -- npx server
```

### SSE-транспорт (Устарел)

Server-Sent Events-транспорт устарел в пользу `http`, но всё ещё поддерживается:

```bash
claude mcp add --transport sse legacy-server https://example.com/sse
```

### WebSocket-транспорт

WebSocket-транспорт для постоянных двунаправленных соединений:

```bash
claude mcp add --transport ws realtime-server wss://example.com/mcp
```

### Примечание для Windows

На нативном Windows (не WSL) используй `cmd /c` для команд npx:

```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

### Аутентификация OAuth 2.0

Claude Code поддерживает OAuth 2.0 для MCP-серверов, которые его требуют. При подключении к OAuth-серверу Claude Code обрабатывает весь процесс аутентификации:

```bash
# Подключиться к OAuth-серверу (интерактивный процесс)
claude mcp add --transport http my-service https://my-service.example.com/mcp

# Предварительная настройка учётных данных OAuth для неинтерактивной установки
claude mcp add --transport http my-service https://my-service.example.com/mcp \
  --client-id "твой-client-id" \
  --client-secret "твой-client-secret" \
  --callback-port 8080
```

### MCP-коннекторы Claude.ai

MCP-серверы, настроенные в аккаунте Claude.ai, автоматически доступны в Claude Code. Любые MCP-соединения, настроенные через веб-интерфейс Claude.ai, будут доступны без дополнительной конфигурации.

Для отключения MCP-серверов Claude.ai в Claude Code:

```bash
ENABLE_CLAUDEAI_MCP_SERVERS=false claude
```

## Области MCP

Конфигурации MCP можно хранить в разных областях:

| Область | Расположение | Описание | Доступно | Требует одобрения |
|---------|-------------|---------|---------|-----------------|
| **Local** (по умолчанию) | `~/.claude.json` (под путём проекта) | Только для текущего пользователя и проекта | Только тебе | Нет |
| **Project** | `.mcp.json` | Зафиксировано в git-репозитории | Члены команды | Да (первый раз) |
| **User** | `~/.claude.json` | Доступно во всех проектах | Только тебе | Нет |

### Использование области Project

Храни специфичные для проекта конфигурации MCP в `.mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.github.com/mcp"
    }
  }
}
```

Члены команды увидят запрос на одобрение при первом использовании MCP проекта.

## Управление конфигурацией MCP

### Добавление MCP-серверов

```bash
# Добавить HTTP-сервер
claude mcp add --transport http github https://api.github.com/mcp

# Добавить локальный stdio-сервер
claude mcp add --transport stdio database -- npx @company/db-server

# Список всех MCP-серверов
claude mcp list

# Получить подробности о конкретном сервере
claude mcp get github

# Удалить MCP-сервер
claude mcp remove github

# Сбросить выборы одобрения для конкретного проекта
claude mcp reset-project-choices

# Импортировать из Claude Desktop
claude mcp add-from-claude-desktop
```

## Таблица доступных MCP-серверов

| MCP-сервер | Назначение | Общие инструменты | Аутентификация | Реальное время |
|------------|-----------|------------------|---------------|----------------|
| **Filesystem** | Операции с файлами | read, write, delete | OS-разрешения | ✅ Да |
| **GitHub** | Управление репозиторием | list_prs, create_issue, push | OAuth | ✅ Да |
| **Slack** | Командная коммуникация | send_message, list_channels | Токен | ✅ Да |
| **Database** | SQL-запросы | query, insert, update | Учётные данные | ✅ Да |
| **Google Docs** | Доступ к документам | read, write, share | OAuth | ✅ Да |
| **Stripe** | Данные платежей | list_charges, create_invoice | API Key | ✅ Да |
| **Memory** | Постоянная память | store, retrieve, delete | Локальный | ❌ Нет |

## Практические примеры

### Пример 1: Конфигурация GitHub MCP

**Файл:** `.mcp.json` (корень проекта)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Доступные инструменты GitHub MCP:**

#### Управление Pull Request
- `list_prs` — Список всех PR в репозитории
- `get_pr` — Получить детали PR включая diff
- `create_pr` — Создать новый PR
- `merge_pr` — Слить PR с главной веткой
- `review_pr` — Добавить комментарии к ревью

#### Управление задачами (Issues)
- `list_issues` — Список всех задач
- `create_issue` — Создать новую задачу
- `close_issue` — Закрыть задачу
- `add_comment` — Добавить комментарий к задаче

**Настройка**:
```bash
export GITHUB_TOKEN="твой_github_токен"
# Или использовать CLI для прямого добавления:
claude mcp add --transport stdio github -- npx @modelcontextprotocol/server-github
```

### Пример 2: Настройка Database MCP

**Конфигурация:**

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-database"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/mydb"
      }
    }
  }
}
```

**Пример использования:**

```markdown
Пользователь: Получи всех пользователей с более чем 10 заказами

Claude: Запрошу базу данных для нахождения этой информации.

SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
HAVING COUNT(o.id) > 10
ORDER BY order_count DESC;

Результаты:
- Алиса: 15 заказов
- Боб: 12 заказов
- Чарли: 11 заказов
```

### Пример 3: Многомодульный рабочий процесс

**Сценарий: Генерация ежедневного отчёта**

```markdown
# Рабочий процесс ежедневного отчёта с несколькими MCP

## Настройка
1. GitHub MCP — получить метрики PR
2. Database MCP — запросить данные продаж
3. Slack MCP — опубликовать отчёт
4. Filesystem MCP — сохранить отчёт

## Шаги
1. /mcp__github__list_prs completed:true last:7days → 42 PR, среднее время слияния: 2.3ч
2. SELECT COUNT(*) as sales, SUM(amount) as revenue FROM orders WHERE ... → 247 продаж, $12,450
3. Сгенерировать HTML-отчёт
4. Записать report.html в /reports/
5. Отправить краткое изложение в канал #daily-reports

Итог: ✅ Отчёт сгенерирован и опубликован
```

## Расширение понятия через переменные окружения

Конфигурации MCP поддерживают раскрытие переменных окружения с резервными значениями по умолчанию:

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}",
        "X-Custom-Header": "${CUSTOM_HEADER:-default-value}"
      }
    }
  }
}
```

- `${VAR}` — Использует переменную окружения, ошибка если не установлена
- `${VAR:-default}` — Использует переменную окружения, возвращается к default если не установлена

## Матрица решений: MCP vs Память

```mermaid
graph TD
    A["Нужны внешние данные?"]
    A -->|Нет| B["Использовать Память"]
    A -->|Да| C["Данные часто меняются?"]
    C -->|Нет/Редко| B
    C -->|Да/Часто| D["Использовать MCP"]

    B -->|Хранит| E["Предпочтения\nКонтекст\nИстория"]
    D -->|Обращается к| F["Живые API\nБазы данных\nСервисы"]
```

## Переменные окружения

Храни чувствительные учётные данные в переменных окружения:

```bash
# ~/.bashrc или ~/.zshrc
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"
export DATABASE_URL="postgresql://user:pass@localhost/mydb"
export SLACK_TOKEN="xoxb-xxxxxxxxxxxxx"
```

Затем ссылайся на них в конфигурации MCP:

```json
{
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

## Claude как MCP-сервер (`claude mcp serve`)

Claude Code сам может выступать как MCP-сервер для других приложений. Это позволяет внешним инструментам, редакторам и системам автоматизации использовать возможности Claude через стандартный MCP-протокол.

```bash
# Запустить Claude Code как MCP-сервер на stdio
claude mcp serve
```

Это полезно для построения многоагентных рабочих процессов, где один экземпляр Claude оркеструет другой.

## Управляемая конфигурация MCP (Enterprise)

Для корпоративных развёртываний ИТ-администраторы могут применять политики MCP-серверов через файл конфигурации `managed-mcp.json`. Этот файл обеспечивает эксклюзивный контроль над тем, какие MCP-серверы разрешены или заблокированы в масштабе организации.

**Расположение:**
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux: `~/.config/ClaudeCode/managed-mcp.json`
- Windows: `%APPDATA%\ClaudeCode\managed-mcp.json`

## Ограничения вывода MCP

Claude Code применяет ограничения к выводу инструментов MCP для предотвращения переполнения контекста:

| Ограничение | Порог | Поведение |
|------------|-------|----------|
| **Предупреждение** | 10,000 токенов | Отображается предупреждение о большом выводе |
| **Максимум по умолчанию** | 25,000 токенов | Вывод обрезается сверх этого предела |
| **Хранение на диске** | 50,000 символов | Результаты инструментов, превышающие 50K символов, сохраняются на диск |

```bash
# Увеличить максимальный вывод до 50,000 токенов
export MAX_MCP_OUTPUT_TOKENS=50000
```

## Связанные руководства

- [Руководство по памяти](../02-memory/) — Постоянный контекст
- [Субагенты](../04-subagents/) — Делегированные ИИ-агенты
- [Плагины](../07-plugins/) — Бандлированные расширения
- [Слэш-команды](../01-slash-commands/) — MCP-промпты как команды

---

*Часть серии руководств [Claude How To](../)*
