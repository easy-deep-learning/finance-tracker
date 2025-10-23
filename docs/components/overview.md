# Components (planned)

No UI components are present in the repository yet. This section outlines a proposed component architecture for a future web app (React-like), to be refined when implementation starts.

## Layout and navigation
- AppShell: header, sidebar, content area
- NavMenu: sections (Dashboard, Transactions, Budgets, Debts, Goals, Settings)

## Dashboard
- BalanceSummaryCard
- CashflowChart
- UpcomingEventsList
- BudgetProgressList

## Transactions
- TransactionList (virtualized)
- TransactionFilters (date, account, category, amount)
- TransactionForm (create/edit income|expense|transfer)
- CategoryBadge
- AccountSelector

## Budgets
- BudgetOverview
- BudgetEditor (allocations per category)
- BudgetProgressBar

## Recurring & calendar
- RecurringList
- RecurringEditor
- CalendarView (events, due dates)

## Debts & credit
- DebtList
- DebtDetail (amortization table)
- CreditFacilityCard

## Savings
- SavingGoalsList
- SavingGoalEditor
- SavingsProjectionChart

## Shared
- MoneyInput (minor units, currency-aware)
- DateTimePicker (TZ-safe)
- TagInput
- ConfirmDialog

Document each component with: props, state, events, and examples. Replace this file with concrete docs once components exist.
