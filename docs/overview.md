# Project overview

Finance Tracker helps people track income and expenses, plan and analyze spending, set savings goals, and be reminded of upcoming events (e.g., birthdays and holidays) and recurring payments.

The initial product goals (from `README.md`):
- Daily budget tracking
- Calculations relative to income date(s)
- Debts (given/received) with schedules
- Recurring/mandatory payments
- Payment schedules for debts
- Available credit tracking
- Savings formation and progress tracking

## Core capabilities
- Record transactions (income, expense, transfer) per account and category
- Categorize spending and analyze by time window
- Define budgets by period and allocate per category
- Create recurring items that auto-generate planned or actual transactions
- Track debts and repayments with amortization and reminders
- Track credit facilities and available credit vs. limits
- Create and track savings goals with forecasts
- Maintain a calendar of events that may affect spending

## Non-functional baseline
- Security: token-based auth (JWT), per-user data isolation
- Data integrity: typed entities with validation; idempotency for creation
- Observability: request IDs, structured error responses
- Internationalization: currency-aware formatting, time zones
- Extensibility: event-driven hooks for scheduled operations (cron/queue)

## Glossary
- Account: a money container (cash, bank, card, etc.)
- Category: a label to classify transactions; income or expense type
- Transaction: a money movement (income/expense/transfer)
- Budget: planned allocations per period and category
- Recurring: scheduled income/expense definition
- Debt: money lent or borrowed with a payment plan
- Credit facility: a line of credit with a limit and cycle
- Saving goal: a target amount to accumulate by a date
- Event: a calendar item that may imply planned spending
