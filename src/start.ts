import { Bot } from 'grammy'
import 'dotenv/config'
import { run } from '@grammyjs/runner'
import { apiThrottler } from '@grammyjs/transformer-throttler'
import { autoRetry } from '@grammyjs/auto-retry'
import Logger from './utils/logger.js'
import db from './databases/store.js'
import { init } from './bot/index.js'
import type { AnimeContext } from './types/index.js'
import { connectMongodb } from './utils/mongodb.js'
import throttlerConfig from '#root/config/throttler.js'

const botToken = process.env.BOT_TOKEN!

const throttler = apiThrottler(throttlerConfig)

try {
  if (!db.bot)
    db.bot = new Bot<AnimeContext>(botToken)
  await connectMongodb()
  db.bot.api.config.use(throttler)
  db.bot.api.config.use(autoRetry())
  await init()
  run(db.bot)
  setTimeout(() => {
    Logger.logInfo(`store.AT', ${JSON.stringify(db.AT)}`)
  }, 3000)
}
catch (error: any) {
  Logger.logError(error)
}
