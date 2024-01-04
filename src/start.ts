import { Bot, session } from 'grammy'
import 'dotenv/config'
import Logger from './utils/logger.js'
import db from './databases/db.js'
import { init } from './bot/index.js'
import type { AnimeContext } from './types/index.js'
import { initDB } from './bot/storage.js'

const botToken = process.env.BOT_TOKEN!

try {
  if (!db.bot)
    db.bot = new Bot<AnimeContext>(botToken)
  await initDB()
  await init()
  db.bot.start()
}
catch (error: any) {
  Logger.logError(error)
}
