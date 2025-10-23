# Пример: Первичная настройка и повседневное использование

Этот пример показывает создание счёта, категорий, запись транзакций и просмотр отчётов.

## 1. Регистрация и вход
См. руководство по REST для `POST /auth/register` и `POST /auth/login`.

## 2. Создайте счёт
```bash
curl -X POST https://api.example.com/accounts \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Main Card","type":"card","currency":"USD"}'
```

## 3. Создайте категории
```bash
curl -X POST https://api.example.com/categories -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"name":"Salary","type":"income"}'

curl -X POST https://api.example.com/categories -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"name":"Groceries","type":"expense"}'
```

## 4. Запишите доход и расход
```bash
# Доход
curl -X POST https://api.example.com/transactions -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"type":"income","accountId":"<acc>","categoryId":"<sal>","amount":350000,"currency":"USD","occurredAt":"2025-10-01T09:00:00Z","notes":"October salary"}'

# Расход
curl -X POST https://api.example.com/transactions -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"type":"expense","accountId":"<acc>","categoryId":"<gro>","amount":8200,"currency":"USD","occurredAt":"2025-10-02T18:30:00Z","notes":"Grocery run"}'
```

## 5. Посмотрите отчёт по денежному потоку
```bash
curl -X GET 'https://api.example.com/reports/cashflow?from=2025-10-01&to=2025-10-31' -H 'Authorization: Bearer <JWT>'
```

## 6. Определите месячный бюджет
```bash
curl -X POST https://api.example.com/budgets -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "period":"monthly",
  "startDate":"2025-10-01",
  "allocations":[{"categoryId":"<gro>","limitAmount":40000}],
  "rollover": true
}'
```

## 7. Настройте регулярный расход на аренду
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

## 8. Добавьте напоминание о событии (день рождения)
```bash
curl -X POST https://api.example.com/events -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{"name":"Sister birthday","date":"2025-12-10","expectedSpendAmount":5000}'
```