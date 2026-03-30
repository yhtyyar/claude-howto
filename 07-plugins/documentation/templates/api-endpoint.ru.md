# [МЕТОД] /api/v1/[эндпоинт]

## Описание
Краткое объяснение того, что делает этот эндпоинт.

## Аутентификация
Требуемый метод аутентификации (например, Bearer-токен).

## Параметры

### Параметры пути
| Имя | Тип | Обязательный | Описание |
|-----|-----|-------------|---------|
| id | string | Да | ID ресурса |

### Параметры запроса
| Имя | Тип | Обязательный | Описание |
|-----|-----|-------------|---------|
| page | integer | Нет | Номер страницы (по умолчанию: 1) |
| limit | integer | Нет | Элементов на странице (по умолчанию: 20) |

### Тело запроса
```json
{
  "поле": "значение"
}
```

## Ответы

### 200 OK
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Пример"
  }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные входные данные"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ресурс не найден"
  }
}
```

## Примеры

### cURL
```bash
curl -X GET "https://api.example.com/api/v1/endpoint" \
  -H "Authorization: Bearer ВАШ_ТОКЕН" \
  -H "Content-Type: application/json"
```

### JavaScript
```javascript
const response = await fetch('/api/v1/endpoint', {
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Python
```python
import requests

response = requests.get(
    'https://api.example.com/api/v1/endpoint',
    headers={'Authorization': 'Bearer token'}
)
data = response.json()
```

## Лимиты запросов
- 1000 запросов в час для аутентифицированных пользователей
- 100 запросов в час для публичных эндпоинтов

## Связанные эндпоинты
- [GET /api/v1/related](#)
- [POST /api/v1/related](#)
