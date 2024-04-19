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
  global: {
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 60 * 1000,
  },
  out: {
    maxInflight: 1,
    minTime: 2000,
  },
})

try {
  if (!db.bot)
    db.bot = new Bot<AnimeContext>(botToken)
  await connectMongodb()
  db.bot.api.config.use(throttler)
  db.bot.api.config.use(autoRetry({
    maxRetryAttempts: 10,
    retryOnInternalServerErrors: false,
  }))

  await init()
  run(db.bot)
  setTimeout(() => {
    console.log('store.AT', db.AT)
  }, 3000)
}
catch (error: any) {
  Logger.logError(error)
}
