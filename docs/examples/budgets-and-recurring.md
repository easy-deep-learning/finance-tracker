# Пример: Бюджеты с переносом остатков и регулярные транзакции

Этот пример демонстрирует перенос остатков бюджета и автоматическую генерацию транзакций из регулярных элементов.

## 1. Создайте бюджет с переносом остатков
```bash
curl -X POST https://api.example.com/budgets -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "period":"monthly",
  "startDate":"2025-10-01",
  "allocations":[{"categoryId":"<gro>","limitAmount":45000}],
  "rollover": true
}'
```

## 2. Настройте регулярное пополнение на продукты (еженедельно)
```bash
curl -X POST https://api.example.com/recurring -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "type":"expense",
  "categoryId":"<gro>",
  "accountId":"<acc>",
  "amount":10000,
  "currency":"USD",
  "schedule":"0 9 * * 1"  
}'
```

## 3. Запустите генерацию регулярных на текущую неделю
```bash
curl -X POST https://api.example.com/recurring/<recurringId>/run -H 'Authorization: Bearer <JWT>'
```

## 4. Проверьте эффективность бюджета
```bash
curl -X GET 'https://api.example.com/reports/budget-performance?budgetId=<budgetId>' -H 'Authorization: Bearer <JWT>'
```