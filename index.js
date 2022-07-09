import 'dotenv/config'
import {Client} from "@notionhq/client";
import express from 'express';
import cors from 'cors';
import {generateData} from "./generateData";
import {generateOptions} from "./generateOptions";

const databaseId = process.env.NOTION_DATABASE_ID;

const notion = new Client({auth: process.env.NOTION_KEY})

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.post('/message', async (req, res) => {
  const { message, callback_query } = req.body;

  if(message){
    if(message.chat.username !== process.env.USER_ID){
      return res.status(200).json({
        method: "sendMessage",
        chat_id: message.chat.id,
        text: "Ngl bro that's kinda sus highkey lowkey"
      });
    }

    if(message.text === '/start'){
      return res.status(200).json({
        method: "sendMessage",
        chat_id: message.chat.id,
        text: "Hey. Time to start budgeting like a responsible (lol) adult"
      });
    }

    //todo: handle help and the other one
    const [expense, amount, comment] = message.text.split('\n');

    const data = generateData({amount, comment, expense, id: message.message_id});

    await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: data
    });

    const response = await notion.databases.retrieve({ database_id: databaseId });
    const labelOptions = response.properties.Category.select.options;

    return res.status(200).json({
      method: "sendMessage",
      chat_id: message.chat.id,
      text: "Thanks",
      reply_to_message_id: message.message_id,
      reply_markup: {
        inline_keyboard: generateOptions(labelOptions)
      }
    });
  }

  if(callback_query){
    const { message, data } = callback_query

    res.status(200).json({
      method: "editMessageText",
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: "Thank you <3",
      reply_markup: {
        inline_keyboard: []
      }
    });

    const targetMessage = message.reply_to_message.message_id;

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "ID",
            number: {
              equals: targetMessage
            }
          }
        ]
      }
    })

    if(response.results.length > 0){
      const [result] = response.results;

      await notion.pages.update({
        page_id: result.id,
        properties: {
          Category: {
            select: {
              id: data
            }
          },
        }
      })
    }

    //TODO: if issue ping FE that there's an issue saving
    return
  }

  return res.status(200).send();
})

app.listen(PORT, () => {
  console.log("Remember. Sapa comes like a thief in the night");
})

