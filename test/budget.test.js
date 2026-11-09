import test from 'node:test'
import assert from 'node:assert/strict'
import {
  alertText,
  budgetStatus,
  formatSummary,
  monthStart,
  parseBudgets,
  totalsByCategory
} from '../src/budget'

test('budgets parse from JSON and drop bad limits', () => {
  assert.deepEqual(parseBudgets('{"Food": 40000, "Fun": -5, "Rent": "a lot"}'), {Food: 40000})
})

test('missing or broken budgets give no limits', () => {
  assert.deepEqual(parseBudgets(undefined), {})
  assert.deepEqual(parseBudgets('not json'), {})
})

test('a category with no limit is never flagged', () => {
  assert.equal(budgetStatus({spent: 999, limit: undefined}).level, 'none')
})

test('status moves from ok to warn to over', () => {
  assert.equal(budgetStatus({spent: 7900, limit: 10000}).level, 'ok')
  assert.equal(budgetStatus({spent: 8000, limit: 10000}).level, 'warn')
  assert.equal(budgetStatus({spent: 10000, limit: 10000}).level, 'warn')
  assert.equal(budgetStatus({spent: 10001, limit: 10000}).level, 'over')
})

test('alerts only say something when the budget is close or passed', () => {
  assert.equal(alertText({category: 'Food', spent: 100, limit: 10000}), null)
  assert.match(alertText({category: 'Food', spent: 9000, limit: 10000}), /almost used up. 1,000 left/)
  assert.match(alertText({category: 'Food', spent: 12500, limit: 10000}), /over budget by 2,500/)
})

test('totals are grouped by category with a name for the uncategorised', () => {
  const totals = totalsByCategory([
    {category: 'Food', amount: 1000},
    {category: 'Food', amount: 500},
    {category: null, amount: 300}
  ])

  assert.deepEqual(totals, {Food: 1500, Uncategorised: 300})
})

test('the month starts on the first', () => {
  assert.equal(monthStart(new Date(2026, 10, 18)), '2026-11-01')
  assert.equal(monthStart(new Date(2026, 0, 3)), '2026-01-01')
})

test('the summary is empty, sorted by spend, and shows limits', () => {
  assert.equal(formatSummary({totals: {}, budgets: {}}), 'Nothing spent this month yet.')

  const text = formatSummary({totals: {Fun: 2000, Food: 9000}, budgets: {Food: 10000}})

  assert.equal(text, 'This month so far: 11,000\nFood: 9,000 of 10,000\nFun: 2,000')
})
