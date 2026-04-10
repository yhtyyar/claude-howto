#!/bin/bash
#
# Qoder Enterprise System - Professional Setup Script
# Automatically configures development environment for hybrid TS/Python architecture
#
# Usage: ./scripts/setup-qoder.sh [--quick|--full]
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PYTHON_PROJECT="$PROJECT_ROOT/../qoder-enterprise-system-py"

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Section header
section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Step 1: Check prerequisites
check_prerequisites() {
    section "1. Проверка prerequisites"

    local missing=()

    if ! command_exists node; then
        missing+=("Node.js (18+)")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            log_warn "Node.js $NODE_VERSION detected, требуется 18+"
        else
            log_success "Node.js $(node --version)"
        fi
    fi

    if ! command_exists npm; then
        missing+=("npm")
    else
        log_success "npm $(npm --version)"
    fi

    if ! command_exists python3; then
        missing+=("Python 3.11+")
    else
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        log_success "Python $PYTHON_VERSION"
    fi

    if ! command_exists poetry; then
        log_warn "Poetry не установлен, будет установлен автоматически"
    else
        log_success "Poetry $(poetry --version)"
    fi

    if ! command_exists curl; then
        missing+=("curl")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Отсутствуют обязательные компоненты:"
        for item in "${missing[@]}"; do
            echo "  - $item"
        done
        echo ""
        echo "Установите их и запустите скрипт снова."
        exit 1
    fi
}

# Step 2: Install Poetry if needed
install_poetry() {
    section "2. Установка Poetry (если нужно)"

    if command_exists poetry; then
        log_success "Poetry уже установлен"
        return 0
    fi

    log_info "Установка Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -

    # Add to PATH for current session
    export PATH="$HOME/.local/bin:$PATH"

    if command_exists poetry; then
        log_success "Poetry установлен: $(poetry --version)"
    else
        log_error "Не удалось установить Poetry"
        exit 1
    fi
}

# Step 3: Setup TypeScript project
setup_typescript() {
    section "3. Настройка TypeScript проекта"

    cd "$PROJECT_ROOT"

    if [ -d "node_modules" ]; then
        log_info "node_modules найдена, пропускаем npm install"
    else
        log_info "Установка npm зависимостей..."
        npm ci
    fi

    log_info "Сборка TypeScript проекта..."
    npm run build

    log_success "TypeScript проект готов"
}

# Step 4: Setup Python project
setup_python() {
    section "4. Настройка Python проекта"

    if [ ! -d "$PYTHON_PROJECT" ]; then
        log_error "Python проект не найден: $PYTHON_PROJECT"
        exit 1
    fi

    cd "$PYTHON_PROJECT"

    # Check if dependencies already installed
    if poetry run python -c "import qoder_enterprise" 2>/dev/null; then
        log_info "Python зависимости уже установлены"
    else
        log_info "Установка Poetry зависимостей..."
        poetry install --no-interaction
    fi

    # Verify installation
    log_info "Проверка Python модулей..."
    poetry run python -c "
from qoder_enterprise.hooks.validator import SecurityValidator
from qoder_enterprise.hooks.executor import WorkflowExecutor
from qoder_enterprise.nlp.service import IntentNLPService
print('✅ Все модули импортируются корректно')
"

    log_success "Python проект готов"
}

# Step 5: Create workflows directory
setup_workflows() {
    section "5. Настройка workflows"

    cd "$PYTHON_PROJECT"

    if [ ! -d "workflows" ]; then
        log_info "Создание директории workflows..."
        mkdir -p workflows
    fi

    # Create sample workflow if doesn't exist
    if [ ! -f "workflows/pre-commit.yaml" ]; then
        log_info "Создание примера workflow..."
        cat > workflows/pre-commit.yaml << 'EOF'
name: pre-commit
description: Run pre-commit checks
type: pre-commit

config:
  fail_fast: true
  timeout: 180
  parallel: true
  max_concurrent: 4

steps:
  - id: lint
    name: Run linter
    type: command
    config:
      command: echo
      args: ["Linting complete"]
    timeout: 30

  - id: test
    name: Run tests
    type: command
    config:
      command: echo
      args: ["Tests passed"]
    depends_on: [lint]
    timeout: 60
EOF
    fi

    log_success "Workflows настроены"
}

# Step 6: Test services
test_services() {
    section "6. Тестирование сервисов"

    cd "$PYTHON_PROJECT"

    # Start services in background
    log_info "Запуск Python сервисов для тестирования..."

    poetry run python -m qoder_enterprise hooks --port 8001 > /tmp/hook-runner.log 2>&1 &
    HOOK_PID=$!

    poetry run python -m qoder_enterprise nlp --port 8002 > /tmp/nlp-service.log 2>&1 &
    NLP_PID=$!

    # Wait for startup
    log_info "Ожидание запуска сервисов (10 секунд)..."
    sleep 10

    # Test Hook Runner
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        log_success "Hook Runner: http://localhost:8001 (PID: $HOOK_PID)"
    else
        log_error "Hook Runner не запустился (см. /tmp/hook-runner.log)"
        kill $HOOK_PID 2>/dev/null || true
        HOOK_PID=""
    fi

    # Test NLP Service
    if curl -s http://localhost:8002/health > /dev/null 2>&1; then
        log_success "NLP Service: http://localhost:8002 (PID: $NLP_PID)"
    else
        log_error "NLP Service не запустился (см. /tmp/nlp-service.log)"
        kill $NLP_PID 2>/dev/null || true
        NLP_PID=""
    fi

    # Test NLP matching
    if [ -n "$NLP_PID" ]; then
        log_info "Тестирование NLP matching..."
        RESULT=$(curl -s -X POST http://localhost:8002/match \
            -H "Content-Type: application/json" \
            -d '{"input": "check this code", "patterns": [{"type": "semantic", "value": "code review", "weight": 1.0, "intent_id": "review"}], "min_confidence": 0.5}' 2>/dev/null)

        if echo "$RESULT" | grep -q "best_match"; then
            log_success "NLP matching работает корректно"
        else
            log_warn "NLP matching вернул неожиданный результат"
        fi
    fi

    # Stop test services
    if [ -n "$HOOK_PID" ]; then
        kill $HOOK_PID 2>/dev/null || true
    fi
    if [ -n "$NLP_PID" ]; then
        kill $NLP_PID 2>/dev/null || true
    fi

    log_info "Тестовые сервисы остановлены"
}

# Step 7: Generate summary
generate_summary() {
    section "7. Итог настройки"

    echo ""
    echo -e "${GREEN}🎉 Qoder Enterprise System настроена и готова к работе!${NC}"
    echo ""
    echo "📁 Структура проекта:"
    echo "  TypeScript MCP: $PROJECT_ROOT"
    echo "  Python Services: $PYTHON_PROJECT"
    echo ""
    echo "🚀 Быстрый старт:"
    echo ""
    echo -e "${BLUE}  # Запуск Python сервисов:${NC}"
    echo "  cd $PYTHON_PROJECT"
    echo "  poetry run python -m qoder_enterprise hooks"
    echo "  poetry run python -m qoder_enterprise nlp"
    echo ""
    echo -e "${BLUE}  # Запуск TypeScript MCP (в другом терминале):${NC}"
    echo "  cd $PROJECT_ROOT"
    echo "  make dev"
    echo ""
    echo -e "${BLUE}  # Проверка работы:${NC}"
    echo "  curl http://localhost:8001/health"
    echo "  curl http://localhost:8002/health"
    echo ""
    echo "📚 Документация:"
    echo "  README: $PROJECT_ROOT/README.md"
    echo "  Architecture: $PROJECT_ROOT/ARCHITECTURE.md"
    echo ""
    echo "🔧 Полезные команды:"
    echo "  make build     - Сборка TypeScript"
    echo "  make test      - Запуск тестов"
    echo "  make lint      - Проверка кода"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Qoder Enterprise System - Professional Setup               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    install_poetry
    setup_typescript
    setup_python
    setup_workflows
    test_services
    generate_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--quick|--full|--help]"
        echo ""
        echo "Options:"
        echo "  --quick    Быстрая настройка (пропустить тесты)"
        echo "  --full     Полная настройка с тестами (по умолчанию)"
        echo "  --help     Показать эту справку"
        exit 0
        ;;
    --quick)
        check_prerequisites
        install_poetry
        setup_typescript
        setup_python
        setup_workflows
        generate_summary
        ;;
    --full|"")
        main
        ;;
    *)
        log_error "Неизвестный аргумент: $1"
        echo "Используйте --help для справки"
        exit 1
        ;;
esac
