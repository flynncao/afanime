import { GrammyError, HttpError } from 'grammy'
import 'dotenv/config'
import { Timer } from 'easytimer.js'
import type { Timer as ITimer } from 'easytimer.js'
import { ZonedDateTime } from '@js-joda/core'
import db from '../databases/store.js'
import { TIMER_INTERVAL_IN_SECONDS, commandList } from '../constants/index.js'
import registerCommandHandler from './command-handler.js'
import BotLogger from './logger.js'
import Logger from '#root/utils/logger.js'
import { createAllConversations } from '#root/middlewares/conversation.js'
import { createAllMenus } from '#root/middlewares/menu.js'
import registerCriticalMiddlewares from '#root/middlewares/index.js'

const userChatID = process.env.USER_CHAT_ID!

export async function init() {
  Logger.logSuccess('Bot started')
  const bot = db.bot
  if (!bot) {
    Logger.logError('Bot is not initialized')
    return
  }
  // TODO: refactor: run all the register functions sequentially via await promise and apply suitable patterns to reduce duplicate code
  try {
    registerCriticalMiddlewares()
    createAllConversations()
    await createAllMenus()
    registerCommandHandler()
    await bot.api.setMyCommands(commandList).catch((err) => {
      Logger.logError(err)
    })
    if (!db.clock) {
      const zdt = ZonedDateTime
      db.clock = zdt
    }
    await db.AT.initRelations()
  }
  catch (error) {
    Logger.logError('Bot failed to start', error)
    BotLogger.sendServerMessage('Bot failed to start', error)
  }

  /**
   * Error handling
   */
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
}
