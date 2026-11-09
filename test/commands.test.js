import test from 'node:test'
import assert from 'node:assert/strict'
import {UNDO_WINDOW_MINUTES, canUndo, parseCommand} from '../src/commands'

test('plain text is not a command', () => {
  assert.equal(parseCommand('Lunch\n500'), null)
  assert.equal(parseCommand(undefined), null)
})

test('known commands parse, including a bot suffix and extra words', () => {
  assert.equal(parseCommand('/start'), 'start')
  assert.equal(parseCommand('/summary@my_budget_bot'), 'summary')
  assert.equal(parseCommand('/UNDO now'), 'undo')
})

test('anything else that starts with a slash is unknown', () => {
  assert.equal(parseCommand('/delete'), 'unknown')
})

test('an expense can be undone inside the window and not after it', () => {
  const now = Date.parse('2026-11-18T12:00:00Z')
  const minutesAgo = (minutes) => new Date(now - minutes * 60000).toISOString()

  assert.equal(canUndo({createdAt: minutesAgo(1), now}), true)
  assert.equal(canUndo({createdAt: minutesAgo(UNDO_WINDOW_MINUTES), now}), true)
  assert.equal(canUndo({createdAt: minutesAgo(UNDO_WINDOW_MINUTES + 1), now}), false)
})
