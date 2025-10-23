# Example: First-time setup and daily use

This example walks through creating an account, categories, recording transactions, and viewing reports.

## 1. Register and login
See REST guide for `POST /auth/register` and `POST /auth/login`.

## 2. Create an account
```bash
curl -X POST https://api.example.com/accounts \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Main Card","type":"card","currency":"USD"}'
```

## 3. Create categories
```bash
curl -X POST https://api.example.com/categories -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"name":"Salary","type":"income"}'

curl -X POST https://api.example.com/categories -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"name":"Groceries","type":"expense"}'
```

## 4. Record income and expenses
```bash
# Income
curl -X POST https://api.example.com/transactions -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"type":"income","accountId":"<acc>","categoryId":"<sal>","amount":350000,"currency":"USD","occurredAt":"2025-10-01T09:00:00Z","notes":"October salary"}'

# Expense
curl -X POST https://api.example.com/transactions -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"type":"expense","accountId":"<acc>","categoryId":"<gro>","amount":8200,"currency":"USD","occurredAt":"2025-10-02T18:30:00Z","notes":"Grocery run"}'
```

## 5. View cashflow report
```bash
curl -X GET 'https://api.example.com/reports/cashflow?from=2025-10-01&to=2025-10-31' -H 'Authorization: Bearer <JWT>'
```

## 6. Define a monthly budget
```bash
curl -X POST https://api.example.com/budgets -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "period":"monthly",
  "startDate":"2025-10-01",
  "allocations":[{"categoryId":"<gro>","limitAmount":40000}],
  "rollover": true
}'
```

## 7. Set up a recurring rent expense
```bash
curl -X POST https://api.example.com/recurring -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "type":"expense",
  "categoryId":"<rentCat>",
  "accountId":"<acc>",
  "amount":120000,
  "currency":"USD",
  "schedule":"0 9 1 * *"  
}'
```

## 8. Add an event reminder (birthday)
```bash
curl -X POST https://api.example.com/events -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"name":"Sister birthday","date":"2025-12-10","expectedSpendAmount":5000}'
```
