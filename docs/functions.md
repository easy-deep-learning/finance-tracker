# Functions and services

Because the repository currently contains no implementation code, this document specifies the core domain services and algorithms expected in the Finance Tracker backend. When the implementation begins, replace the pseudo-code with concrete references to modules and functions.

## Money utilities
- parseMoney(input: string|number, currency: string) -> minor units
- formatMoney(minor: number, currency: string) -> string
- convertCurrency(amountMinor: number, from: string, to: string, rate: number) -> number

## Transactions
- createTransaction(input) -> Transaction
  - Validates account/category, type-specific constraints
  - For transfer: create two legs with fee handling
- listTransactions(filters) -> { data, meta }
- summarizeTransactionsByDay(range, filters) -> { byDay }
- summarizeTransactionsByCategory(range, filters) -> { byCategory }

## Budgets
- createBudget(definition) -> Budget
- computeBudgetPerformance(budgetId) -> { allocations, summary }
- rolloverBudget(previousBudgetId) -> Budget

## Recurring items
- scheduleToDates(schedule, start, end) -> Date[]
- generateTransactionsForRecurring(recurringItem, atDate) -> Transaction[] (idempotent)

## Debts
- createDebt(definition) -> Debt
- amortizationSchedule(principalMinor, apr, frequency, startDate, nPayments?) -> Payment[]
- applyDebtPayment(debtId, payment) -> { updatedDebt, entry }

## Credit facilities
- computeAvailableCredit(limitMinor, postedMinor, pendingMinor) -> number
- statementPeriod(date, statementDay) -> { start, end }

## Savings
- projectSavings(currentMinor, monthlyContributionMinor, targetMinor, apr?, horizonMonths?) -> Projection

## Events
- upcomingEvents(range) -> Event[]

## Pseudo-code examples

```pseudo
function computeBudgetPerformance(budgetId):
  budget = repo.getBudget(budgetId)
  actuals = repo.sumTransactionsByCategory(budget.userId, budget.startDate, budget.endDate)
  allocations = []
  for alloc in budget.allocations:
    actual = actuals.get(alloc.categoryId, 0)
    remaining = alloc.limitAmount - actual
    allocations.push({
      categoryId: alloc.categoryId,
      limitAmount: alloc.limitAmount,
      actualAmount: actual,
      remainingAmount: remaining
    })
  summary = {
    totalLimit: sum(alloc.limitAmount for alloc in budget.allocations),
    totalActual: sum(a.actualAmount for a in allocations),
    totalRemaining: totalLimit - totalActual
  }
  return { allocations, summary }
```

```pseudo
function amortizationSchedule(principal, apr, frequency, startDate, nPayments):
  r = apr / 100 / frequency
  payment = principal * r / (1 - (1 + r)^(-nPayments))
  balance = principal
  date = startDate
  schedule = []
  for i in 1..nPayments:
    interest = round(balance * r)
    principalPortion = payment - interest
    balance = balance - principalPortion
    date = addMonths(date, 1)  // if monthly
    schedule.push({ amount: payment, interestPortion: interest, principalPortion, date })
  return schedule
```
