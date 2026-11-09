const MULTIPLIERS = {k: 1000, m: 1000000}

export const parseAmount = (raw) => {
  if (raw === undefined || !raw.trim()) {
    return {ok: false, error: "Put the amount on the second line."}
  }

  const cleaned = raw.trim().toLowerCase().replace(/[,\s₦$]/g, '')
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([km])?$/)

  if (!match) {
    return {ok: false, error: `"${raw.trim()}" is not an amount. Try 2500, 2.5k or 1,200.`}
  }

  const amount = Math.round(parseFloat(match[1]) * (MULTIPLIERS[match[2]] || 1))

  if (amount <= 0) {
    return {ok: false, error: "The amount has to be more than zero."}
  }

  return {ok: true, amount}
}

export const parseMessage = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return {ok: false, error: "Send the expense as text. Name on the first line, amount on the second."}
  }

  const [expense, amountLine, ...commentLines] = text.split('\n')

  if (!expense.trim()) {
    return {ok: false, error: "The first line should be the name of the expense."}
  }

  const amount = parseAmount(amountLine)

  if (!amount.ok) {
    return amount
  }

  return {
    ok: true,
    expense: expense.trim(),
    amount: amount.amount,
    comment: commentLines.join(' ').trim()
  }
}
