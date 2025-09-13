import { Bot } from 'grammy'
import 'dotenv/config'
import { run } from '@grammyjs/runner'
import { apiThrottler } from '@grammyjs/transformer-throttler'
import { autoRetry } from '@grammyjs/auto-retry'
import { SocksProxyAgent } from 'socks-proxy-agent'
import Logger from './utils/logger.js'
import db from './databases/store.js'
import { init } from './bot/index.js'
import type { AnimeContext } from './types/index.js'
import { connectMongodb } from './utils/mongodb.js'
import { config } from '@/config/index.js'
import throttlerConfig from '#root/config/throttler.js'

function setupBot() {
  const botToken = config.botToken
  const throttler = apiThrottler(throttlerConfig)
  const socksAgent = config.proxyAddress ? new SocksProxyAgent(config.proxyAddress!) : false

  if (!db.bot) {
    db.bot = new Bot<AnimeContext>(botToken, {
      client: {
        baseFetchConfig: {
          agent: socksAgent,
        },
      },
    })
  }

  db.bot.api.config.use(throttler)
  db.bot.api.config.use(autoRetry())

  return db.bot
}

async function startBot() {
  try {
    const bot = setupBot()
    await connectMongodb()
    await init()
    run(bot)
    Logger.logInfo('Bot started successfully')
  }
  catch (error) {
    Logger.logError('Failed to start bot:', error)
  }
}

// Start the bot
startBot()
