# Example: Budgets with rollover and recurring transactions

This example demonstrates budget rollover and automatic transaction generation from recurring items.

## 1. Create a budget with rollover
```bash
curl -X POST https://api.example.com/budgets -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "period":"monthly",
  "startDate":"2025-10-01",
  "allocations":[{"categoryId":"<gro>","limitAmount":45000}],
  "rollover": true
}'
```

## 2. Set up recurring groceries top-up (weekly)
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

## 3. Run the recurring generator for this week
```bash
curl -X POST https://api.example.com/recurring/<recurringId>/run -H 'Authorization: Bearer <JWT>'
```

## 4. Check budget performance
```bash
curl -X GET 'https://api.example.com/reports/budget-performance?budgetId=<budgetId>' -H 'Authorization: Bearer <JWT>'
```
