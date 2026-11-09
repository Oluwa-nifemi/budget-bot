import test from 'node:test'
import assert from 'node:assert/strict'
import {parseAmount, parseMessage} from '../src/parseMessage'

test('plain, comma and suffixed amounts all parse', () => {
  assert.equal(parseAmount('2500').amount, 2500)
  assert.equal(parseAmount('1,200').amount, 1200)
  assert.equal(parseAmount('2.5k').amount, 2500)
  assert.equal(parseAmount('₦3,000').amount, 3000)
  assert.equal(parseAmount('1.2m').amount, 1200000)
})

test('a missing amount asks for it', () => {
  const result = parseAmount(undefined)

  assert.equal(result.ok, false)
  assert.match(result.error, /second line/)
})

test('text that is not a number is rejected with the text in the error', () => {
  const result = parseAmount('lots')

  assert.equal(result.ok, false)
  assert.match(result.error, /"lots"/)
})

test('zero is rejected', () => {
  assert.equal(parseAmount('0').ok, false)
  assert.equal(parseAmount('0k').ok, false)
})

test('a three line message gives the name, amount and comment', () => {
  assert.deepEqual(parseMessage('Lunch\n4,500\nwith Tolu'), {
    ok: true,
    expense: 'Lunch',
    amount: 4500,
    comment: 'with Tolu'
  })
})

test('the comment is optional and longer comments are joined', () => {
  assert.equal(parseMessage('Bus\n300').comment, '')
  assert.equal(parseMessage('Bus\n300\nto work\nand back').comment, 'to work and back')
})

test('empty text, missing text and a blank name are rejected', () => {
  assert.equal(parseMessage(undefined).ok, false)
  assert.equal(parseMessage('   ').ok, false)
  assert.equal(parseMessage('\n500').ok, false)
})

test('a message with a bad amount returns the amount error', () => {
  const result = parseMessage('Lunch\nfree')

  assert.equal(result.ok, false)
  assert.match(result.error, /"free"/)
})
