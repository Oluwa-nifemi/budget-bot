export const WARN_AT = 0.8

const money = (value) => Math.abs(value).toLocaleString('en-US')

export const parseBudgets = (raw) => {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)

    return Object.fromEntries(
      Object.entries(parsed).filter(([, limit]) => Number.isFinite(limit) && limit > 0)
    )
  } catch (error) {
    console.error("MONTHLY_BUDGETS is not valid JSON, ignoring it")
    return {}
  }
}

export const budgetStatus = ({spent, limit}) => {
  if (!limit) {
    return {level: 'none', left: null}
  }

  const left = limit - spent

  if (spent > limit) {
    return {level: 'over', left}
  }

  if (spent >= limit * WARN_AT) {
    return {level: 'warn', left}
  }

  return {level: 'ok', left}
}

export const totalsByCategory = (expenses) => expenses.reduce((totals, {category, amount}) => {
  const name = category || 'Uncategorised'

  return {...totals, [name]: (totals[name] || 0) + amount}
}, {})

export const monthStart = (now = new Date()) => {
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${now.getFullYear()}-${month}-01`
}

export const alertText = ({category, spent, limit}) => {
  const {level, left} = budgetStatus({spent, limit})

  if (level === 'over') {
    return `${category} is over budget by ${money(left)}. You have spent ${money(spent)} of ${money(limit)} this month.`
  }

  if (level === 'warn') {
    return `${category} is almost used up. ${money(left)} left of ${money(limit)} this month.`
  }

  return null
}

export const formatSummary = ({totals, budgets}) => {
  const names = Object.keys(totals)

  if (names.length === 0) {
    return "Nothing spent this month yet."
  }

  const lines = names
    .sort((a, b) => totals[b] - totals[a])
    .map((name) => {
      const limit = budgets[name]
      const suffix = limit ? ` of ${money(limit)}` : ''

      return `${name}: ${money(totals[name])}${suffix}`
    })

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0)

  return [`This month so far: ${money(total)}`, ...lines].join('\n')
}
