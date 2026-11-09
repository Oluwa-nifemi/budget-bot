import 'dotenv/config'
import {Client} from "@notionhq/client";
import express from 'express';
import cors from 'cors';
import {generateData} from "./generateData";
import {generateOptions} from "./generateOptions";
import {parseMessage} from "./parseMessage";
import {HELP_TEXT, UNDO_WINDOW_MINUTES, canUndo, parseCommand} from "./commands";
import {alertText, formatSummary, monthStart, parseBudgets, totalsByCategory} from "./budget";
import {createStore} from "./notionStore";
import {sendMessage} from "./telegram";

const store = createStore({
  notion: new Client({auth: process.env.NOTION_KEY}),
  databaseId: process.env.NOTION_DATABASE_ID
})

const budgets = parseBudgets(process.env.MONTHLY_BUDGETS)

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

const reply = (res, chatId, text, extra = {}) => res.status(200).json({
  method: "sendMessage",
  chat_id: chatId,
  text,
  ...extra
})

const handleEdit = async (edited, res) => {
  if (edited.chat.username !== process.env.USER_ID) {
    return res.status(200).send()
  }

  const parsed = parseMessage(edited.text)

  if (!parsed.ok) {
    return reply(res, edited.chat.id, parsed.error)
  }

  const page = await store.findByMessageId(edited.message_id)

  if (page) {
    await store.update(page.id, generateData({
      amount: parsed.amount,
      comment: parsed.comment,
      expense: parsed.expense,
      id: edited.message_id
    }))
  }

  return res.status(200).send()
}

const handleCommand = async (command, message, res) => {
  const chatId = message.chat.id

  if (command === 'start') {
    return reply(res, chatId, "Hey. Time to start budgeting like a responsible (lol) adult")
  }

  if (command === 'summary') {
    const totals = totalsByCategory(await store.expensesSince(monthStart()))

    return reply(res, chatId, formatSummary({totals, budgets}))
  }

  if (command === 'undo') {
    const last = await store.lastExpense()

    if (!last) {
      return reply(res, chatId, "There is nothing to undo.")
    }

    if (!canUndo({createdAt: last.created_time})) {
      return reply(res, chatId, `The last expense is older than ${UNDO_WINDOW_MINUTES} minutes, so I left it alone.`)
    }

    await store.archive(last.id)

    return reply(res, chatId, "Removed your last expense.")
  }

  return reply(res, chatId, HELP_TEXT)
}

const handleMessage = async (message, res) => {
  if (message.chat.username !== process.env.USER_ID) {
    return reply(res, message.chat.id, "Ngl bro that's kinda sus lowkey highkey")
  }

  const command = parseCommand(message.text)

  if (command) {
    return handleCommand(command, message, res)
  }

  const parsed = parseMessage(message.text)

  if (!parsed.ok) {
    return reply(res, message.chat.id, `${parsed.error}\n\n${HELP_TEXT}`)
  }

  await store.create(generateData({
    amount: parsed.amount,
    comment: parsed.comment,
    expense: parsed.expense,
    id: message.message_id
  }))

  const labelOptions = await store.categoryOptions()

  return reply(res, message.chat.id, "Thanks", {
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: generateOptions(labelOptions)
    }
  })
}

const warnIfOverBudget = async ({chatId, optionId}) => {
  const options = await store.categoryOptions()
  const category = options.find((option) => option.id === optionId)?.name
  const limit = category && budgets[category]

  if (!limit) {
    return
  }

  const totals = totalsByCategory(await store.expensesSince(monthStart()))
  const text = alertText({category, spent: totals[category] || 0, limit})

  if (text) {
    await sendMessage({token: process.env.TELEGRAM_BOT_TOKEN, chatId, text})
  }
}

const handleCallback = async (callback, res) => {
  const {message, data} = callback

  res.status(200).json({
    method: "editMessageText",
    chat_id: message.chat.id,
    message_id: message.message_id,
    text: "Thank you <3",
    reply_markup: {
      inline_keyboard: []
    }
  });

  const page = await store.findByMessageId(message.reply_to_message.message_id)

  if (!page) {
    return
  }

  await store.update(page.id, {
    Category: {
      select: {
        id: data
      }
    }
  })

  await warnIfOverBudget({chatId: message.chat.id, optionId: data})
}

app.post('/message', async (req, res) => {
  const { message, callback_query, edited_message } = req.body;

  try {
    if (edited_message) {
      return await handleEdit(edited_message, res)
    }

    if (message) {
      return await handleMessage(message, res)
    }

    if (callback_query) {
      return await handleCallback(callback_query, res)
    }
  } catch (error) {
    console.error("Could not handle the update", error)
  }

  if (!res.headersSent) {
    res.status(200).send()
  }
})

app.listen(PORT, () => {
  console.log("Remember. Sapa comes like a thief in the night which is why I'm listening for it at PORT: " + PORT);
})
