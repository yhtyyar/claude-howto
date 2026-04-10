# 📘 Qoder Enterprise System - Полная Инструкция по Использованию

## 📋 Содержание

1. [Обзор системы](#обзор-системы)
2. [Текущий статус](#текущий-статус)
3. [Быстрый старт](#быстрый-старт)
4. [Использование Python сервисов](#использование-python-сервисов)
5. [Использование TypeScript MCP серверов](#использование-typescript-mcp-серверов)
6. [Интеграция в ваши проекты](#интеграция-в-ваши-проекты)
7. [API документация](#api-документация)
8. [Создание workflows](#создание-workflows)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Обзор системы

**Qoder Enterprise System** - это гибридная система для автоматизации разработки, состоящая из:

### Python микросервисы (HTTP API)
- **Hook Runner** (порт 8001) - выполнение workflows и автоматизация задач
- **NLP Service** (порт 8002) - распознавание намерений с ИИ

### TypeScript MCP серверы (для Qoder IDE)
- **Intent Router** - маршрутизация намерений
- **Checkpoint Manager** - управление состояниями git
- **Hook Runner** - клиент для workflow автоматизации

---

## ✅ Текущий статус

| Компонент | Статус | Порт/Путь |
|-----------|--------|-----------|
| Python Hook Runner | ✅ Работает | http://localhost:8001 |
| Python NLP Service | ✅ Работает | http://localhost:8002 |
| TypeScript Intent Router | ✅ Собран | core/mcp-intent-router/dist |
| TypeScript Checkpoint Manager | ✅ Собран | core/mcp-checkpoint-manager/dist |
| TypeScript Hook Runner | ✅ Собран | core/mcp-hook-runner/dist |

---

## 🚀 Быстрый старт

### 1. Запуск Python сервисов

```powershell
# Перейти в директорию Python проекта
cd C:\Users\User\ClaudeCode\claude-howto\qoder-enterprise-system-py

# Запустить Hook Runner (в первом терминале)
poetry run qoder-hooks --port 8001 --workflows-path workflows

# Запустить NLP Service (во втором терминале)
poetry run qoder-nlp --port 8002
```

### 2. Проверка работоспособности

```powershell
# Проверить Hook Runner
curl.exe http://localhost:8001/health

# Проверить NLP Service
curl.exe http://localhost:8002/health
```

**Ожидаемый ответ:**
```json
{"status":"healthy","service":"hook-runner","version":"1.0.0"}
{"status":"healthy","service":"intent-nlp","version":"1.0.0","model":"all-MiniLM-L6-v2"}
```

---

## 🔧 Использование Python сервисов

### Hook Runner API (порт 8001)

#### 1. Запуск workflow

```powershell
$body = @{
    workflow_name = "pre-commit"
    context = @{
        cwd = "C:\path\to\your\project"
    }
} | ConvertTo-Json

(Invoke-WebRequest -Uri http://localhost:8001/run_workflow -Method POST -ContentType "application/json" -Body $body).Content
```

#### 2. Запуск отдельного hook

```powershell
$body = @{
    hook_name = "lint"
    context = @{
        cwd = "C:\path\to\your\project"
    }
} | ConvertTo-Json

(Invoke-WebRequest -Uri http://localhost:8001/run_hook -Method POST -ContentType "application/json" -Body $body).Content
```

#### 3. Список доступных workflows

```powershell
(Invoke-WebRequest -Uri http://localhost:8001/list_workflows -Method POST -ContentType "application/json").Content
```

### NLP Service API (порт 8002)

#### 1. Распознавание намерений

```powershell
$body = @{
    input = "code review please"
    patterns = @(
        @{
            type = "semantic"
            value = "review code"
            weight = 1.0
            intent_id = "code-review"
        }
    )
    min_confidence = 0.5
} | ConvertTo-Json -Depth 4

$result = (Invoke-WebRequest -Uri http://localhost:8002/match -Method POST -ContentType "application/json" -Body $body).Content
$result
```

**Пример ответа:**
```json
{
  "best_match": "code-review",
  "confidence": 0.7539854049682617,
  "all_scores": {
    "code-review": 0.7539854049682617
  },
  "pattern_matches": [
    {
      "pattern_type": "semantic",
      "pattern_value": "review code",
      "confidence": 0.7539854049682617,
      "matched": true
    }
  ],
  "processing_time_ms": 52
}
```

---

## 📘 Использование TypeScript MCP серверов

### Для Qoder IDE интеграции

TypeScript MCP серверы предназначены для работы с Qoder IDE через протокол MCP (Model Context Protocol).

#### 1. Настройка MCP в Qoder IDE

Создайте файл `.claude/mcp.json` в вашем проекте:

```json
{
  "mcpServers": {
    "intent-router": {
      "command": "node",
      "args": ["C:/Users/User/ClaudeCode/claude-howto/qoder-enterprise-system/core/mcp-intent-router/dist/index.js"]
    },
    "checkpoint-manager": {
      "command": "node",
      "args": ["C:/Users/User/ClaudeCode/claude-howto/qoder-enterprise-system/core/mcp-checkpoint-manager/dist/index.js"]
    },
    "hook-runner": {
      "command": "node",
      "args": ["C:/Users/User/ClaudeCode/claude-howto/qoder-enterprise-system/core/mcp-hook-runner/dist/index.js"]
    }
  }
}
```

#### 2. Доступные MCP методы

**Intent Router:**
- `detect_intent` - распознать намерение
- `list_intents` - список всех намерений
- `get_intent` - получить конкретное намерение
- `reload_intents` - перезагрузить намерения

**Checkpoint Manager:**
- `create_checkpoint` - создать checkpoint
- `restore_checkpoint` - восстановить checkpoint
- `list_checkpoints` - список checkpoint'ов
- `delete_checkpoint` - удалить checkpoint
- `diff_checkpoints` - сравнить checkpoint'ы

**Hook Runner:**
- `run_workflow` - запустить workflow
- `run_hook` - запустить hook
- `list_workflows` - список workflows
- `validate_workflow` - валидировать workflow

---

## 🔌 Интеграция в ваши проекты

### Когда можно интегрировать?

**✅ СЕЙЧАС!** Система полностью готова к использованию:

1. **Python API** - можно использовать сразу через HTTP запросы
2. **TypeScript MCP** - можно интегрировать в Qoder IDE

### Варианты интеграции

#### Вариант 1: Использование Python API (Рекомендуется для начала)

**Преимущества:**
- ✅ Простая интеграция через HTTP
- ✅ Работает с любым языком программирования
- ✅ Не требует настройки MCP

**Пример интеграции в CI/CD:**

```yaml
# .github/workflows/ci.yml
jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run pre-commit workflow
        run: |
          curl -X POST http://your-server:8001/run_workflow \
            -H "Content-Type: application/json" \
            -d '{
              "workflow_name": "pre-commit",
              "context": {"cwd": "${{ github.workspace }}"}
            }'
```

**Пример интеграции в Python проект:**

```python
import requests

# Запуск workflow
response = requests.post('http://localhost:8001/run_workflow', json={
    'workflow_name': 'pre-commit',
    'context': {'cwd': '/path/to/project'}
})

print(response.json())

# Распознавание намерений
response = requests.post('http://localhost:8002/match', json={
    'input': 'run tests',
    'patterns': [
        {
            'type': 'semantic',
            'value': 'test code',
            'weight': 1.0,
            'intent_id': 'run-tests'
        }
    ],
    'min_confidence': 0.5
})

print(response.json())
```

#### Вариант 2: Интеграция через MCP (Для Qoder IDE)

**Преимущества:**
- ✅ Нативная интеграция с Qoder IDE
- ✅ Автоматическое распознавание намерений
- ✅ Управление checkpoint'ами

**Шаги интеграции:**

1. Скопируйте собраные MCP серверы в ваш проект:
```powershell
cp -r qoder-enterprise-system/core/mcp-intent-router/dist your-project/mcp-servers/intent-router
cp -r qoder-enterprise-system/core/mcp-checkpoint-manager/dist your-project/mcp-servers/checkpoint-manager
cp -r qoder-enterprise-system/core/mcp-hook-runner/dist your-project/mcp-servers/hook-runner
```

2. Создайте конфигурацию MCP в вашем проекте:
```json
{
  "mcpServers": {
    "intent-router": {
      "command": "node",
      "args": ["./mcp-servers/intent-router/index.js"]
    }
  }
}
```

#### Вариант 3: Гибридная интеграция (Полная мощь)

Используйте оба подхода вместе:
- Python сервисы для CI/CD и автоматизации
- MCP серверы для работы в IDE

---

## 📝 Создание workflows

### Базовый workflow

Создайте файл `workflows/my-workflow.yaml`:

```yaml
name: my-workflow
description: My custom workflow
type: pre-commit

config:
  fail_fast: true
  timeout: 180
  parallel: true

steps:
  - id: lint
    name: Run linter
    type: command
    config:
      command: npm
      args: ["run", "lint"]
    timeout: 60

  - id: test
    name: Run tests
    type: command
    config:
      command: npm
      args: ["test"]
    depends_on: [lint]
    timeout: 120

  - id: build
    name: Build project
    type: command
    config:
      command: npm
      args: ["run", "build"]
    depends_on: [test]
    timeout: 180
```

### Workflow с условиями

```yaml
name: conditional-workflow
description: Workflow with conditions
type: custom

steps:
  - id: check-branch
    name: Check if develop branch
    type: condition
    config:
      expression: "git.branch == 'develop'"
      then:
        - id: run-tests
          name: Run tests on develop
          type: command
          config:
            command: npm
            args: ["test"]
```

### Parallel workflow

```yaml
name: parallel-workflow
description: Parallel execution
type: custom

steps:
  - id: parallel-tasks
    name: Run tasks in parallel
    type: parallel
    config:
      maxConcurrent: 3
      steps:
        - id: lint
          name: Lint
          type: command
          config:
            command: npm
            args: ["run", "lint"]
        
        - id: typecheck
          name: Type check
          type: command
          config:
            command: npm
            args: ["run", "typecheck"]
        
        - id: test-unit
          name: Unit tests
          type: command
          config:
            command: npm
            args: ["test", "--", "--testMatch=**/*.test.ts"]
```

---

## 🔍 API документация

### Hook Runner Endpoints

#### POST /run_workflow
Запуск workflow по имени.

**Request:**
```json
{
  "workflow_name": "pre-commit",
  "context": {
    "cwd": "/path/to/project",
    "env": {"NODE_ENV": "production"}
  }
}
```

**Response:**
```json
{
  "success": true,
  "workflow": "pre-commit",
  "results": [
    {
      "step_id": "lint",
      "success": true,
      "output": "Linting passed",
      "duration_ms": 1234
    }
  ],
  "duration_ms": 2345
}
```

#### POST /run_hook
Запуск отдельного hook.

**Request:**
```json
{
  "hook_name": "lint",
  "context": {
    "cwd": "/path/to/project"
  }
}
```

#### POST /list_workflows
Список всех загруженных workflows.

#### POST /validate_workflow
Валидация workflow без запуска.

### NLP Service Endpoints

#### POST /match
Распознавание намерения.

**Request:**
```json
{
  "input": "run tests please",
  "patterns": [
    {
      "type": "semantic",
      "value": "test code",
      "weight": 1.0,
      "intent_id": "run-tests"
    },
    {
      "type": "exact",
      "value": "lint",
      "weight": 1.0,
      "intent_id": "lint-code"
    }
  ],
  "min_confidence": 0.5
}
```

**Response:**
```json
{
  "best_match": "run-tests",
  "confidence": 0.78,
  "all_scores": {
    "run-tests": 0.78,
    "lint-code": 0.23
  },
  "pattern_matches": [
    {
      "pattern_type": "semantic",
      "pattern_value": "test code",
      "confidence": 0.78,
      "matched": true
    }
  ],
  "processing_time_ms": 45
}
```

#### POST /health
Проверка здоровья сервиса.

---

## 🛠 Troubleshooting

### Python сервисы не запускаются

**Проблема:** Poetry не найден
```powershell
# Решение - добавить Poetry в PATH
$env:Path += ";C:\Users\User\AppData\Roaming\Python\Scripts"
```

**Проблема:** Порт уже используется
```powershell
# Найти процесс на порту
netstat -ano | findstr :8001

# Убить процесс
taskkill /PID <PID> /F
```

### TypeScript серверы не собираются

**Проблема:** Ошибки компиляции
```powershell
# Переустановить зависимости
cd core/mcp-intent-router
rm -rf node_modules package-lock.json
npm install
npm run build
```

### NLP модель не загружается

**Проблема:** Медленная загрузка модели
- При первом запуске загружается модель ~90MB
- Это нормально, последующие запуски будут быстрее
- Модель кэшируется в `~/.cache/huggingface`

### Workflows не загружаются

**Проблема:** Workflow не найден
- Проверьте путь к директории workflows
- Убедитесь, что YAML файл валидный
- Проверьте логи Hook Runner

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервисов
2. Убедитесь, что все зависимости установлены
3. Проверьте конфигурацию workflows
4. Создайте Issue в репозитории

---

## 🎓 Примеры использования

### 1. Автоматический pre-commit hook

```python
import subprocess
import requests

def pre_commit_hook():
    # Запустить pre-commit workflow
    response = requests.post('http://localhost:8001/run_workflow', json={
        'workflow_name': 'pre-commit',
        'context': {'cwd': subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()}
    })
    
    result = response.json()
    
    if not result['success']:
        print("Pre-commit checks failed!")
        for step in result['results']:
            if not step['success']:
                print(f"  ❌ {step['step_id']}: {step.get('error', 'Unknown error')}")
        exit(1)
    
    print("✅ All pre-commit checks passed!")

if __name__ == '__main__':
    pre_commit_hook()
```

### 2. Умный ассистент для разработки

```python
import requests

class DevAssistant:
    def __init__(self):
        self.intents = {
            'run-tests': {
                'patterns': [
                    {'type': 'semantic', 'value': 'test code', 'weight': 1.0},
                    {'type': 'exact', 'value': 'run tests', 'weight': 1.0}
                ],
                'intent_id': 'run-tests'
            },
            'lint-code': {
                'patterns': [
                    {'type': 'semantic', 'value': 'check code quality', 'weight': 1.0},
                    {'type': 'exact', 'value': 'lint', 'weight': 1.0}
                ],
                'intent_id': 'lint-code'
            }
        }
    
    def process_command(self, user_input):
        # Распознать намерение
        patterns = []
        for intent in self.intents.values():
            patterns.extend(intent['patterns'])
            patterns[-1]['intent_id'] = intent['intent_id']
        
        response = requests.post('http://localhost:8002/match', json={
            'input': user_input,
            'patterns': patterns,
            'min_confidence': 0.5
        })
        
        result = response.json()
        
        if result['confidence'] > 0.5:
            intent_id = result['best_match']
            print(f"✅ Распознано намерение: {intent_id} (точность: {result['confidence']:.2%})")
            
            # Выполнить соответствующее действие
            if intent_id == 'run-tests':
                self.run_tests()
            elif intent_id == 'lint-code':
                self.lint_code()
        else:
            print("❌ Не удалось распознать намерение")
    
    def run_tests(self):
        print("🧪 Запуск тестов...")
        # Вызвать API для запуска тестов
    
    def lint_code(self):
        print("🔍 Запуск линтера...")
        # Вызвать API для запуска линтера

# Использование
assistant = DevAssistant()
assistant.process_command("run tests please")
assistant.process_command("check code quality")
```

---

## 🚀 Следующие шаги

1. **Создайте свои workflows** для вашего проекта
2. **Интегрируйте API** в ваш CI/CD pipeline
3. **Настройте MCP серверы** в Qoder IDE
4. **Расширьте систему** новыми intents и hooks

---

**Версия:** 1.0.0  
**Последнее обновление:** Апрель 2026  
**Статус:** ✅ Production Ready
