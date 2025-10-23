# REST API guide

This guide describes the REST conventions for the Finance Tracker API and provides usage examples.

Base URL: `https://api.example.com`

## Authentication
- Scheme: Bearer token (JWT)
- Include: `Authorization: Bearer <token>` header
- Obtain a token via `POST /auth/login` or `POST /auth/register`

## Versioning
- Path-based: `/v1/...` in production (omitted here for brevity)

## Common headers
- `Idempotency-Key`: optional, recommended for POST to prevent duplicates
- `X-Request-Id`: optional client-supplied correlation ID
- `Content-Type: application/json`

## Pagination
- Cursor-based via `?limit` and `?cursor`
- Response includes `meta`: `{ nextCursor, prevCursor, total? }`

## Filtering & sorting
- Date range: `?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Category: `?categoryId=...`
- Account: `?accountId=...`
- Sort: `?sort=occurredAt:desc,amount:asc`

## Error format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'amount' must be > 0",
    "details": {"field": "amount"}
  }
}
```

## Examples

### Register and login
```bash
curl -X POST https://api.example.com/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Str0ng!Pass","name":"Demo"}'

curl -X POST https://api.example.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Str0ng!Pass"}'
```
Response:
```json
{"accessToken":"<JWT>","user":{"id":"...","email":"demo@example.com"}}
```

### Create an account
```bash
curl -X POST https://api.example.com/accounts \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Main Card","type":"card","currency":"USD"}'
```

### Create categories
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

### Record income and expense
```bash
# Income
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

# Expense
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

### List transactions
```bash
curl -X GET 'https://api.example.com/transactions?from=2025-10-01&to=2025-10-31&limit=50' \
  -H 'Authorization: Bearer <JWT>'
```

## Idempotency
- Provide a unique `Idempotency-Key` for POST requests you might retry.
- Server returns the same result for duplicates within a 24h window.

## Rate limiting
- 60 req/min default; `429` with `Retry-After` on exceed.
