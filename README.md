# How to deploy
- Deploy on a node js server
- Use https://api.telegram.org/bot(mytoken)/setWebhook?url={serverurl}/message to point your telegram bot to the deployment
- mytoken is gotten from the Bot Father and serverurl is the url of the server you just deployed 
# Environment variables
- NOTION_KEY and NOTION_DATABASE_ID: the Notion database that stores expenses
- TELEGRAM_BOT_TOKEN: used to send replies
- USER_ID: the Telegram username allowed to use the bot
- MONTHLY_BUDGETS: optional category budgets, used for budget alerts

# Commands
- /start shows the help text
- /summary shows this month's spending
- /undo removes the last expense, within 10 minutes of adding it

# Tests
- npm test
