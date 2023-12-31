import { Bot } from 'grammy'
import 'dotenv/config'
import Logger from './utils/logger.js'
import db from './databases/db.js'
import { init } from './bot/index.js'

const botToken = process.env.BOT_TOKEN!

try {
  if (!db.bot)
    db.bot = new Bot(botToken)
  await init()
  db.bot.start()
}
catch (error: any) {
  Logger.logError(error)
}
