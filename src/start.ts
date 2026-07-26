import { run } from '@grammyjs/runner'
import { createBot } from './bot/bot.js'
import { createNotifier } from './bot/notifier.js'
import { loadConfig } from './config/index.js'
import { buildCommandList } from './constants/index.js'
import { startJobs } from './jobs.js'
import Logger from './utils/logger.js'
import { connectMongodb } from './utils/mongodb.js'

// Load .env if present; env vars may also come from the runtime (Docker, CI).
try {
  process.loadEnvFile()
}
catch {}

try {
  const config = loadConfig()
  await connectMongodb()
  const bot = createBot(config)
  await bot.api.setMyCommands(buildCommandList(config.botName))
  run(bot)
  Logger.logSuccess('Bot started')
  await startJobs(createNotifier(bot.api, config.groupChatID))
}
catch (error) {
  Logger.logError('Bot failed to start:', error)
  process.exitCode = 1
}
