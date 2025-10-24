# Функции и сервисы

Поскольку в репозитории пока нет реализационного кода, этот документ описывает ключевые доменные сервисы и алгоритмы, ожидаемые в бэкенде Finance Tracker. Когда начнётся реализация, замените псевдокод конкретными ссылками на модули и функции.

## Денежные утилиты
- parseMoney(input: string|number, currency: string) -> сумма в минорных единицах
- formatMoney(minor: number, currency: string) -> строка
- convertCurrency(amountMinor: number, from: string, to: string, rate: number) -> число

## Транзакции
- createTransaction(input) -> Transaction
  - Валидирует счёт/категорию и ограничения по типу
  - Для перевода: создаёт две проводки с учётом комиссии
- listTransactions(filters) -> { data, meta }
- summarizeTransactionsByDay(range, filters) -> { byDay }
- summarizeTransactionsByCategory(range, filters) -> { byCategory }

## Бюджеты
- createBudget(definition) -> Budget
- computeBudgetPerformance(budgetId) -> { allocations, summary }
- rolloverBudget(previousBudgetId) -> Budget

## Регулярные элементы
- scheduleToDates(schedule, start, end) -> Date[]
- generateTransactionsForRecurring(recurringItem, atDate) -> Transaction[] (идемпотентно)

## Долги
- createDebt(definition) -> Debt
- amortizationSchedule(principalMinor, apr, frequency, startDate, nPayments?) -> Payment[]
- applyDebtPayment(debtId, payment) -> { updatedDebt, entry }

## Кредитные продукты
- computeAvailableCredit(limitMinor, postedMinor, pendingMinor) -> number
- statementPeriod(date, statementDay) -> { start, end }

## Накопления
- projectSavings(currentMinor, monthlyContributionMinor, targetMinor, apr?, horizonMonths?) -> Projection

## События
- upcomingEvents(range) -> Event[]

## Примеры псевдокода

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
    date = addMonths(date, 1)  // если помесячно
    schedule.push({ amount: payment, interestPortion: interest, principalPortion, date })
  return schedule
```