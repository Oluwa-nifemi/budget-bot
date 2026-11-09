export const UNDO_WINDOW_MINUTES = 10

const KNOWN_COMMANDS = ['/start', '/summary', '/undo']

export const HELP_TEXT = [
  "Send an expense in up to three lines:",
  "name",
  "amount (2500, 2.5k or 1,200)",
  "comment (optional)",
  "",
  "/summary shows this month. /undo removes the last expense."
].join('\n')

export const parseCommand = (text) => {
  if (typeof text !== 'string' || !text.startsWith('/')) {
    return null
  }

  const [first] = text.trim().split(/\s+/)
  const name = first.split('@')[0].toLowerCase()

  if (KNOWN_COMMANDS.includes(name)) {
    return name.slice(1)
  }

  return 'unknown'
}

export const canUndo = ({createdAt, now = Date.now()}) => {
  const ageMinutes = (now - new Date(createdAt).getTime()) / 60000

  return ageMinutes <= UNDO_WINDOW_MINUTES
}
