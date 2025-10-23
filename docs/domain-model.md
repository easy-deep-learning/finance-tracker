# Domain model

The system revolves around financial events recorded by users, categorized for analysis and planning.

## Entities

- User
  - id, email, name, defaultCurrency, createdAt
- Account
  - id, userId, name, type (cash|bank|card|investment), currency, createdAt, archived
- Category
  - id, userId, name, type (income|expense), parentId?, color?, archived
- Transaction
  - id, userId, accountId, categoryId?, type (income|expense|transfer), amount, currency, occurredAt, notes?, tags[]
  - For transfer: fromAccountId, toAccountId, feeAmount?
- Budget
  - id, userId, period (monthly|weekly|custom), startDate, endDate, allocations[{categoryId, limitAmount}], rollover (bool)
- RecurringItem
  - id, userId, type (income|expense), categoryId, accountId, amount, currency, schedule (cron or RRULE), nextRunAt, lastRunAt, status
- Debt
  - id, userId, role (lent|borrowed), counterparty, principal, interestRateAPR, startDate, dueDate?, schedule (monthly|custom), status
  - payments[]: {id, amount, occurredAt, interestPortion, principalPortion}
- CreditFacility
  - id, userId, name, limitAmount, availableAmount, apr, statementDay, paymentDueDay
- SavingGoal
  - id, userId, name, targetAmount, currentAmount, dueDate?, priority
- Event
  - id, userId, name, date, expectedSpendAmount?, notes?

## Relationships
- User 1..* Account
- User 1..* Category
- User 1..* Transaction
- User 1..* Budget
- User 1..* RecurringItem
- User 1..* Debt
- User 1..* CreditFacility
- User 1..* SavingGoal
- User 1..* Event

## Invariants and notes
- All monetary values are stored in minor units (e.g., cents) to avoid FP errors.
- Currency on `Transaction` must match `Account.currency` unless a conversion step is introduced.
- `Transaction.categoryId` is optional for transfers.
- `Budget.allocations` categories must be `type=expense`.
- `RecurringItem` generation is idempotent per period.

## Diagram
```mermaid
classDiagram
  class User {
    uuid id
    string email
    string name
    string defaultCurrency
    datetime createdAt
  }
  class Account {
    uuid id
    uuid userId
    string name
    enum type
    string currency
    datetime createdAt
    bool archived
  }
  class Category {
    uuid id
    uuid userId
    string name
    enum type
    uuid parentId
    string color
    bool archived
  }
  class Transaction {
    uuid id
    uuid userId
    uuid accountId
    uuid categoryId
    enum type
    int amountMinor
    string currency
    datetime occurredAt
    string notes
    string[] tags
  }
  class Budget {
    uuid id
    uuid userId
    enum period
    date startDate
    date endDate
    Allocation[] allocations
    bool rollover
  }
  class Allocation {
    uuid categoryId
    int limitAmountMinor
  }
  class RecurringItem {
    uuid id
    uuid userId
    enum type
    uuid categoryId
    uuid accountId
    int amountMinor
    string currency
    string schedule
    datetime nextRunAt
    datetime lastRunAt
    enum status
  }
  class Debt {
    uuid id
    uuid userId
    enum role
    string counterparty
    int principalMinor
    float apr
    date startDate
    date dueDate
    enum schedule
    enum status
  }
  class CreditFacility {
    uuid id
    uuid userId
    string name
    int limitAmountMinor
    int availableAmountMinor
    float apr
    int statementDay
    int paymentDueDay
  }
  class SavingGoal {
    uuid id
    uuid userId
    string name
    int targetAmountMinor
    int currentAmountMinor
    date dueDate
    int priority
  }
  class Event {
    uuid id
    uuid userId
    string name
    date date
    int expectedSpendAmountMinor
    string notes
  }

  User --> Account
  User --> Category
  User --> Transaction
  User --> Budget
  User --> RecurringItem
  User --> Debt
  User --> CreditFacility
  User --> SavingGoal
  User --> Event
  Budget --> Allocation
```
