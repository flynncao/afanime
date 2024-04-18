import { Bot, session } from 'grammy'
import 'dotenv/config'
import { run } from '@grammyjs/runner'
import { apiThrottler } from '@grammyjs/transformer-throttler'
import { autoRetry } from '@grammyjs/auto-retry'
import Logger from './utils/logger.js'
import db from './databases/store.js'
import { init } from './bot/index.js'
import type { AnimeContext } from './types/index.js'
import { connectMongodb } from './utils/mongodb.js'

const botToken = process.env.BOT_TOKEN!

const throttler = apiThrottler({
  out: {
    maxInflight: 1,
    minTime: 2000,
  },
})

try {
  if (!db.bot)
    db.bot = new Bot<AnimeContext>(botToken)
  // await initDB()
  await connectMongodb()
  db.bot.api.config.use(throttler) // throttle all API calls
  db.bot.api.config.use(autoRetry({
    retryOnInternalServerErrors: true,
    maxRetryAttempts: 20,
  })) // automatically retry failed requests

  await init()
  run(db.bot)
}
catch (error: any) {
  Logger.logError(error)
}
