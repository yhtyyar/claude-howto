# Qoder Enterprise System - Professional Setup Prompt

## 🎯 Что нужно сделать

Автоматически настроить гибридную систему Qoder Enterprise (TypeScript + Python) для профессиональной разработки с полной интеграцией MCP серверов.

## 📋 Пошаговые инструкции для Qoder

### Шаг 1: Проверка окружения

1. Проверить установлены ли:
   - Node.js 18+
   - npm 9+
   - Python 3.11+
   - Poetry (или установить)
   - curl

### Шаг 2: Настройка TypeScript проекта

```bash
cd /home/tester/CascadeProjects/claude-howto/qoder-enterprise-system

# Установка зависимостей (если node_modules нет)
if [ ! -d "node_modules" ]; then
    npm ci
fi

# Сборка проекта
npm run build

# Проверка сборки
ls -la core/mcp-intent-router/dist/index.js
ls -la core/mcp-checkpoint-manager/dist/index.js
```

### Шаг 3: Настройка Python проекта

```bash
cd /home/tester/CascadeProjects/claude-howto/qoder-enterprise-system-py

# Установка Poetry (если нет)
if ! command -v poetry &> /dev/null; then
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

# Установка зависимостей
poetry install --no-interaction

# Проверка импорта модулей
poetry run python -c "
from qoder_enterprise.hooks.validator import SecurityValidator
from qoder_enterprise.hooks.executor import WorkflowExecutor
from qoder_enterprise.hooks.parser import WorkflowParser
from qoder_enterprise.nlp.service import IntentNLPService
print('✅ Python modules OK')
"
```

### Шаг 4: Создание workflows (если нет)

```bash
cd /home/tester/CascadeProjects/claude-howto/qoder-enterprise-system-py
mkdir -p workflows

# Создать пример workflow если нет
cat > workflows/pre-commit.yaml << 'EOF'
name: pre-commit
description: Run pre-commit checks
type: pre-commit

config:
  fail_fast: true
  timeout: 180
  parallel: true

steps:
  - id: lint
    name: Lint check
    type: command
    config:
      command: echo
      args: ["Linting passed"]
EOF
```

### Шаг 5: Запуск и тестирование Python сервисов

```bash
cd /home/tester/CascadeProjects/claude-howto/qoder-enterprise-system-py

# Запуск Hook Runner (background)
poetry run python -m qoder_enterprise hooks --port 8001 &
HOOK_PID=$!

# Запуск NLP Service (background)
poetry run python -m qoder_enterprise nlp --port 8002 &
NLP_PID=$!

# Ожидание запуска
sleep 10

# Проверка health
curl http://localhost:8001/health
curl http://localhost:8002/health

# Тест NLP matching
curl -X POST http://localhost:8002/match \
  -H "Content-Type: application/json" \
  -d '{"input": "code review please", "patterns": [{"type": "semantic", "value": "review code", "weight": 1.0, "intent_id": "code-review"}], "min_confidence": 0.5}'
```

### Шаг 6: Отображение статуса

Показать пользователю:
- ✅ TypeScript MCP: готов (build OK)
- ✅ Python Hook Runner: http://localhost:8001
- ✅ Python NLP: http://localhost:8002
- ✅ Workflows: настроены

### Шаг 7: Инструкции для работы

Сказать пользователю:

```
🎉 Qoder Enterprise System готова к работе!

Python сервисы запущены и работают:
- Hook Runner: http://localhost:8001
- NLP Service: http://localhost:8002

Для работы с MCP серверами TypeScript:
1. Оставьте Python сервисы запущенными
2. В другом терминале запустите: make dev

Команды:
- curl http://localhost:8001/health  # Hook Runner health
- curl http://localhost:8002/health  # NLP health
```

## 🔧 Альтернатива: Использование setup скрипта

Если есть готовый скрипт, можно запустить:

```bash
cd /home/tester/CascadeProjects/claude-howto/qoder-enterprise-system
./scripts/setup-qoder.sh
```

## ⚠️ Важные замечания

1. **NLP модель**: При первом запуске скачивается ~400MB модель (all-MiniLM-L6-v2). Это нормально, занимает 10-30 секунд.

2. **Порты**: Убедитесь что порты 8001 и 8002 свободны:
   ```bash
   lsof -i :8001 || echo "Port 8001 free"
   lsof -i :8002 || echo "Port 8002 free"
   ```

3. **Python версия**: Требуется Python 3.11+. Проверить:
   ```bash
   python3 --version  # Должно быть 3.11.x или выше
   ```

4. **Poetry**: Если Poetry не установлен глобально, он будет установлен в ~/.local/bin/

## 🎯 Что должно работать после настройки

- [ ] TypeScript компилируется без ошибок
- [ ] Python модули импортируются без ошибок
- [ ] Hook Runner отвечает на /health
- [ ] NLP Service отвечает на /health
- [ ] NLP matching работает (возвращает JSON с best_match)
- [ ] Workflows загружены (каталог workflows/ с YAML файлами)

## 📚 Полезные ссылки после настройки

- README: `/home/tester/CascadeProjects/claude-howto/qoder-enterprise-system/README.md`
- Architecture: `/home/tester/CascadeProjects/claude-howto/qoder-enterprise-system/ARCHITECTURE.md`
- Python README: `/home/tester/CascadeProjects/claude-howto/qoder-enterprise-system-py/README.md`

## 🚀 Режим работы

После настройки система работает в гибридном режиме:

1. **Qoder IDE** ↔ **TypeScript MCP Servers** (stdio)
   - Intent Router: распознавание намерений
   - Checkpoint Manager: git-based состояния

2. **TypeScript Intent Router** ↔ **Python NLP Service** (HTTP API)
   - Для semantic matching используется BERT модель
   - Fallback на Fuse.js если Python недоступен

3. **TypeScript Hook Runner Client** ↔ **Python Hook Runner** (HTTP API)
   - Workflow execution
   - Parallel task execution

---

**Важно**: После выполнения всех шагов, скажи пользователю что система готова и покажи статус всех компонентов!
