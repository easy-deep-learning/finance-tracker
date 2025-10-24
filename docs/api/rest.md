# Руководство по REST API

В этом руководстве описаны конвенции REST для API Finance Tracker и приводятся примеры использования.

Базовый URL: `https://api.example.com`

## Аутентификация
- Схема: Bearer токен (JWT)
- Добавляйте заголовок: `Authorization: Bearer <token>`
- Получение токена через `POST /auth/login` или `POST /auth/register`

## Версионирование
- В продакшне — префикс пути: `/v1/...` (для краткости здесь опущено)

## Общие заголовки
- `Idempotency-Key`: необязателен, рекомендуется для POST для предотвращения дубликатов
- `X-Request-Id`: необязательный корреляционный ID клиента
- `Content-Type: application/json`

## Пагинация
- На курсорах через `?limit` и `?cursor`
- В ответе поле `meta`: `{ nextCursor, prevCursor, total? }`

## Фильтрация и сортировка
- Диапазон дат: `?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Категория: `?categoryId=...`
- Счёт: `?accountId=...`
- Сортировка: `?sort=occurredAt:desc,amount:asc`

## Формат ошибки
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'amount' must be > 0",
    "details": {"field": "amount"}
  }
}
```

## Примеры

### Регистрация и вход
```bash
curl -X POST https://api.example.com/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Str0ng!Pass","name":"Demo"}'

curl -X POST https://api.example.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Str0ng!Pass"}'
```
Ответ:
```json
{"accessToken":"<JWT>","user":{"id":"...","email":"demo@example.com"}}
```

### Создание счёта
```bash
curl -X POST https://api.example.com/accounts \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Main Card","type":"card","currency":"USD"}'
```

### Создание категорий
```bash
curl -X POST https://api.example.com/categories \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Salary","type":"income"}'

curl -X POST https://api.example.com/categories \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Groceries","type":"expense"}'
```

### Запись дохода и расхода
```bash
# Доход
curl -X POST https://api.example.com/transactions \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"income",
    "accountId":"<account>",
    "categoryId":"<salaryCat>",
    "amount": 350000,
    "currency":"USD",
    "occurredAt":"2025-10-01T09:00:00Z",
    "notes":"October salary"
  }'

# Расход
curl -X POST https://api.example.com/transactions \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"expense",
    "accountId":"<account>",
    "categoryId":"<groceriesCat>",
    "amount": 8200,
    "currency":"USD",
    "occurredAt":"2025-10-02T18:30:00Z",
    "notes":"Grocery run"
  }'
```

### Список транзакций
```bash
curl -X GET 'https://api.example.com/transactions?from=2025-10-01&to=2025-10-31&limit=50' \
  -H 'Authorization: Bearer <JWT>'
```

## Идемпотентность
- Передавайте уникальный `Idempotency-Key` для POST‑запросов, которые могут быть повторены.
- Сервер возвращает тот же результат для дубликатов в течение 24 часов.

## Лимитирование
- По умолчанию 60 запросов/мин; при превышении — `429` с `Retry-After`.