# Example: Debts and repayment schedule

This example walks through setting up a borrowed debt and scheduling repayments.

## 1. Create a debt
```bash
curl -X POST https://api.example.com/debts -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "role":"borrowed",
  "principal":500000,
  "interestRateAPR":12.0,
  "startDate":"2025-10-01",
  "schedule":"monthly"
}'
```

## 2. Add a payment
```bash
curl -X POST https://api.example.com/debts/<debtId>/payments -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' -d '{
  "amount":45000,
  "occurredAt":"2025-10-15T10:00:00Z"
}'
```

## 3. List payments
```bash
curl -X GET https://api.example.com/debts/<debtId>/payments -H 'Authorization: Bearer <JWT>'
```
