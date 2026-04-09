# Руководство по тестированию

Этот документ описывает инфраструктуру тестирования для Claude How To.

## Обзор

Проект использует GitHub Actions для автоматического запуска тестов на каждый push и pull request. Тесты охватывают:

- **Unit-тесты**: Python-тесты с использованием pytest
- **Качество кода**: Линтинг и форматирование с Ruff
- **Безопасность**: Сканирование уязвимостей с Bandit
- **Проверка типов**: Статический анализ типов с mypy
- **Проверка сборки**: Тест генерации EPUB

## Запуск тестов локально

### Предварительные требования

```bash
# Установить uv (быстрый менеджер Python-пакетов)
pip install uv

# Или на macOS с Homebrew
brew install uv
```

### Настройка окружения

```bash
# Клонировать репозиторий
git clone https://github.com/luongnv89/claude-howto.git
cd claude-howto

# Создать виртуальное окружение
uv venv

# Активировать
source .venv/bin/activate  # macOS/Linux
# или
.venv\Scripts\activate     # Windows

# Установить зависимости разработки
uv pip install -r requirements-dev.txt
```

### Запуск тестов

```bash
# Запустить все unit-тесты
pytest scripts/tests/ -v

# Запустить тесты с покрытием
pytest scripts/tests/ -v --cov=scripts --cov-report=html

# Запустить конкретный тестовый файл
pytest scripts/tests/test_build_epub.py -v

# Запустить конкретную тестовую функцию
pytest scripts/tests/test_build_epub.py::test_function_name -v

# Запустить тесты в режиме watch (требуется pytest-watch)
ptw scripts/tests/
```

### Запуск линтинга

```bash
# Проверить форматирование кода
ruff format --check scripts/

# Авто-исправление проблем форматирования
ruff format scripts/

# Запустить линтер
ruff check scripts/

# Авто-исправление проблем линтера
ruff check --fix scripts/
```

### Запуск сканирования безопасности

```bash
# Запустить сканирование безопасности Bandit
bandit -c pyproject.toml -r scripts/ --exclude scripts/tests/

# Сгенерировать JSON-отчёт
bandit -c pyproject.toml -r scripts/ --exclude scripts/tests/ -f json -o bandit-report.json
```

### Запуск проверки типов

```bash
# Проверить типы с mypy
mypy scripts/ --ignore-missing-imports --no-implicit-optional
```

## GitHub Actions Workflow

### Триггеры

- **Push** в ветки `main` или `develop` (при изменении скриптов)
- **Pull Request** в `main` (при изменении скриптов)
- Ручной запуск workflow

### Задачи

#### 1. Unit-тесты (pytest)

- **Запускается на**: Ubuntu latest
- **Версии Python**: 3.10, 3.11, 3.12
- **Что делает**:
  - Устанавливает зависимости из `requirements-dev.txt`
  - Запускает pytest с отчётом о покрытии
  - Загружает покрытие в Codecov
  - Архивирует результаты тестов и HTML покрытия

**Результат**: Если любой тест не проходит, workflow не проходит (критично)

#### 2. Качество кода (Ruff)

- **Запускается на**: Ubuntu latest
- **Версия Python**: 3.11
- **Что делает**:
  - Проверяет форматирование кода с `ruff format`
  - Запускает линтер с `ruff check`
  - Отчитывается о проблемах, но не фейлит workflow

**Результат**: Не блокирующий (только предупреждение)

#### 3. Сканирование безопасности (Bandit)

- **Запускается на**: Ubuntu latest
- **Версия Python**: 3.11
- **Что делает**:
  - Сканирует на уязвимости безопасности
  - Генерирует JSON-отчёт
  - Загружает отчёт как артефакт

**Результат**: Не блокирующий (только предупреждение)

#### 4. Проверка типов (mypy)

- **Запускается на**: Ubuntu latest
- **Версия Python**: 3.11
- **Что делает**:
  - Выполняет статический анализ типов
  - Отчитывается о несоответствиях типов
  - Помогает отлавливать баги на ранней стадии

**Результат**: Не блокирующий (только предупреждение)

#### 5. Сборка EPUB

- **Запускается на**: Ubuntu latest
- **Зависит от**: pytest, lint, security (все должны пройти)
- **Что делает**:
  - Собирает EPUB-файл с использованием `scripts/build_epub.py`
  - Проверяет, что EPUB был создан успешно
  - Загружает EPUB как артефакт

**Результат**: Если сборка не проходит, workflow не проходит (критично)

#### 6. Сводка

- **Запускается на**: Ubuntu latest
- **Зависит от**: Всех других задач
- **Что делает**:
  - Генерирует сводку workflow
  - Перечисляет все артефакты
  - Отчитывается об общем статусе

## Написание тестов

### Структура тестов

Тесты должны размещаться в `scripts/tests/` с именами `test_*.py`:

```python
# scripts/tests/test_example.py
import pytest
from scripts.example_module import some_function

def test_basic_functionality():
    """Test that some_function works correctly."""
    result = some_function("input")
    assert result == "expected_output"

def test_error_handling():
    """Test that some_function handles errors gracefully."""
    with pytest.raises(ValueError):
        some_function("invalid_input")

@pytest.mark.asyncio
async def test_async_function():
    """Test async functions."""
    result = await async_function()
    assert result is not None
```

### Лучшие практики тестирования

- **Используйте описательные имена**: `test_function_returns_correct_value()`
- **Одна проверка на тест** (когда возможно): Легче отлаживать ошибки
- **Используйте фикстуры** для переиспользуемого setup: См. `scripts/tests/conftest.py`
- **Мокайте внешние сервисы**: Используйте `unittest.mock` или `pytest-mock`
- **Тестируйте крайние случаи**: Пустые входы, значения None, ошибки
- **Держите тесты быстрыми**: Избегайте sleep() и внешнего I/O
- **Используйте маркеры pytest**: `@pytest.mark.slow` для медленных тестов

### Фикстуры

Общие фикстуры определены в `scripts/tests/conftest.py`:

```python
# Используйте фикстуры в ваших тестах
def test_something(tmp_path):
    """tmp_path fixture provides temporary directory."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("content")
    assert test_file.read_text() == "content"
```

## Отчёты о покрытии

### Локальное покрытие

```bash
# Сгенерировать отчёт о покрытии
pytest scripts/tests/ --cov=scripts --cov-report=html

# Открыть отчёт о покрытии в браузере
open htmlcov/index.html
```

### Цели покрытия

- **Минимальное покрытие**: 80%
- **Покрытие веток**: Включено
- **Приоритетные области**: Основной функционал и пути ошибок

## Pre-commit хуки

Проект использует pre-commit хуки для автоматического запуска проверок перед коммитами:

```bash
# Установить pre-commit хуки
pre-commit install

# Запустить хуки вручную
pre-commit run --all-files

# Пропустить хуки для коммита (не рекомендуется)
git commit --no-verify
```

Настроенные хуки в `.pre-commit-config.yaml`:
- Ruff formatter
- Ruff linter
- Bandit security scanner
- YAML validation
- Проверки размера файлов
- Обнаружение конфликтов слияния

## Устранение неполадок

### Тесты проходят локально, но падают в CI

Типичные причины:
1. **Разница версий Python**: CI использует 3.10, 3.11, 3.12
2. **Отсутствующие зависимости**: Обновите `requirements-dev.txt`
3. **Различия платформ**: Разделители путей, переменные окружения
4. **Нестабильные тесты**: Тесты, зависящие от времени или порядка

Решение:
```bash
# Тестируйте с теми же версиями Python
uv python install 3.10 3.11 3.12

# Тестируйте с чистым окружением
rm -rf .venv
uv venv
uv pip install -r requirements-dev.txt
pytest scripts/tests/
```

### Bandit сообщает о ложных срабатываниях

Некоторые предупреждения безопасности могут быть ложными срабатываниями. Настройте в `pyproject.toml`:

```toml
[tool.bandit]
exclude_dirs = ["scripts/tests"]
skips = ["B101"]  # Пропустить предупреждение assert_used
```

### Проверка типов слишком строгая

Ослабьте проверку типов для конкретных файлов:

```python
# Добавьте в начало файла
# type: ignore

# Или для конкретных строк
some_dynamic_code()  # type: ignore
```

## Лучшие практики непрерывной интеграции

1. **Держите тесты быстрыми**: Каждый тест должен выполняться <1 секунды
2. **Не тестируйте внешние API**: Мокайте внешние сервисы
3. **Тестируйте изолированно**: Каждый тест должен быть независимым
4. **Используйте чёткие проверки**: `assert x == 5` не `assert x`
5. **Обрабатывайте async-тесты**: Используйте `@pytest.mark.asyncio`
6. **Генерируйте отчёты**: Покрытие, безопасность, проверка типов

## Ресурсы

- [Документация pytest](https://docs.pytest.org/)
- [Документация Ruff](https://docs.astral.sh/ruff/)
- [Документация Bandit](https://bandit.readthedocs.io/)
- [Документация mypy](https://mypy.readthedocs.io/)
- [Документация GitHub Actions](https://docs.github.com/en/actions)

## Внесение тестов

При отправке PR:

1. **Пишите тесты** для нового функционала
2. **Запускайте тесты локально**: `pytest scripts/tests/ -v`
3. **Проверяйте покрытие**: `pytest scripts/tests/ --cov=scripts`
4. **Запускайте линтинг**: `ruff check scripts/`
5. **Сканирование безопасности**: `bandit -r scripts/ --exclude scripts/tests/`
6. **Обновляйте документацию** если тесты меняются

Тесты обязательны для всех PR! 🧪

---

По вопросам или проблемам с тестированием откройте GitHub issue или discussion.
