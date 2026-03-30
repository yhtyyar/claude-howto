---
name: api-documentation-generator
description: Генерировать подробную и точную API-документацию из исходного кода. Использовать при создании или обновлении API-документации, генерации OpenAPI-спецификаций или когда пользователи упоминают API-документы, эндпоинты или документацию.
---

# Навык генератора API-документации

## Генерирует

- Спецификации OpenAPI/Swagger
- Документацию API-эндпоинтов
- Примеры использования SDK
- Руководства по интеграции
- Справочники кодов ошибок
- Руководства по аутентификации

## Структура документации

### Для каждого эндпоинта

```markdown
## GET /api/v1/users/:id

### Описание
Краткое объяснение того, что делает этот эндпоинт

### Параметры

| Имя | Тип | Обязательный | Описание |
|-----|-----|-------------|---------|
| id | string | Да | ID пользователя |

### Ответ

**200 Успешно**
```json
{
  "id": "usr_123",
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**404 Не найдено**
```json
{
  "error": "USER_NOT_FOUND",
  "message": "Пользователь не существует"
}
```

### Примеры

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/users/usr_123" \
  -H "Authorization: Bearer ВАШ_ТОКЕН"
```

**JavaScript**
```javascript
const user = await fetch('/api/v1/users/usr_123', {
  headers: { 'Authorization': 'Bearer token' }
}).then(r => r.json());
```

**Python**
```python
response = requests.get(
    'https://api.example.com/api/v1/users/usr_123',
    headers={'Authorization': 'Bearer token'}
)
user = response.json()
```
```
