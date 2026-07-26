import type { Config } from '#root/config/index.js'
import type { AnimeContext, SessionData } from '#root/types/index.js'
import { autoRetry } from '@grammyjs/auto-retry'
import { conversations } from '@grammyjs/conversations'
import { Bot, GrammyError, HttpError, session } from 'grammy'
import { SocksProxyAgent } from 'socks-proxy-agent'
import authorization from '#root/middlewares/authorization.js'
import Logger from '#root/utils/logger.js'
import { createCommands } from './features/commands.js'
import { registerConversations } from './features/conversations.js'
import { animeActionMenu, animeDashboardMenu } from './features/dashboard.js'

export function createBot(config: Config): Bot<AnimeContext> {
  const socksAgent = config.proxyAddress ? new SocksProxyAgent(config.proxyAddress) : undefined
  const bot = new Bot<AnimeContext>(config.botToken, {
    client: {
      baseFetchConfig: {
        agent: socksAgent,
      },
    },
  })
  bot.api.config.use(autoRetry())

  // order matters: session → authorization → conversations → menus → commands
  bot.use(session({ initial: (): SessionData => ({}) }))
  bot.use(authorization)
  bot.use(conversations())
  registerConversations(bot)
  bot.use(animeDashboardMenu)
  bot.use(animeActionMenu)
  bot.use(createCommands(config))

  bot.catch((err) => {
    const ctx = err.ctx
    Logger.logError(`Error while handling update ${ctx.update.update_id}:`)
    const e = err.error
    if (e instanceof GrammyError)
      Logger.logError('Error in request:', e.description)

    else if (e instanceof HttpError)
      Logger.logError('Could not contact Telegram:', e)

    else
      Logger.logError('Unknown error:', e)
  })

  return bot
}
