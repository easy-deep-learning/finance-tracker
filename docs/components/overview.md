# Компоненты (план)

В репозитории пока нет UI‑компонентов. Этот раздел описывает предлагаемую архитектуру компонентов будущего веб‑приложения (в стиле React), которая будет уточнена при старте реализации.

## Компоновка и навигация
- AppShell: шапка, боковая панель, область контента
- NavMenu: разделы (Панель, Транзакции, Бюджеты, Долги, Цели, Настройки)

## Панель
- BalanceSummaryCard
- CashflowChart
- UpcomingEventsList
- BudgetProgressList

## Транзакции
- TransactionList (виртуализированный)
- TransactionFilters (дата, счёт, категория, сумма)
- TransactionForm (создание/редактирование доход|расход|перевод)
- CategoryBadge
- AccountSelector

## Бюджеты
- BudgetOverview
- BudgetEditor (распределения по категориям)
- BudgetProgressBar

## Регулярные операции и календарь
- RecurringList
- RecurringEditor
- CalendarView (события, даты платежей)

## Долги и кредит
- DebtList
- DebtDetail (таблица амортизации)
- CreditFacilityCard

## Накопления
- SavingGoalsList
- SavingGoalEditor
- SavingsProjectionChart

## Общие компоненты
- MoneyInput (минорные единицы, учёт валюты)
- DateTimePicker (корректная работа с часовыми поясами)
- TagInput
- ConfirmDialog

Документируйте каждый компонент: пропсы, состояние, события и примеры. Замените этот файл конкретной документацией, когда компоненты появятся.