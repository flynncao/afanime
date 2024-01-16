import { GrammyError, HttpError } from 'grammy'
import 'dotenv/config'
import { Timer } from 'easytimer.js'
import type { Timer as ITimer } from 'easytimer.js'
import db from '../databases/store.js'
import { TIMER_INTERVAL_IN_SECONDS, commandList } from '../constants/index.js'
import registerCommandHandler from './command-handler.js'
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
  registerCriticalMiddlewares()
  await bot.api.setMyCommands(commandList)
  createAllConversations()
  await createAllMenus()
  registerCommandHandler()
  /**
   * Repetitive message handlers
   */
  if (!db.timer) {
    const timer = new Timer()
    db.timer = timer
  }
  db.timer?.start({ callback(timer: ITimer) {
    if (timer.getTotalTimeValues().seconds === TIMER_INTERVAL_IN_SECONDS) {
      bot.api.sendMessage(userChatID, `地球已經過去了24小時，爲什麽不使用/all來看看有沒有新的動畫呢！`)
      // threadQueries.forEach(async (thread) => {
      // updateAnimePerThread(ctx, thread.threadID, false)
      // })
      timer.reset()
    }
  }, countdown: false, startValues: { seconds: 0 }, target: { seconds: TIMER_INTERVAL_IN_SECONDS } })

  /**
   * Error handling
   */
  bot.catch((err) => {
    const ctx = err.ctx
    console.error(`Error while handling update ${ctx.update.update_id}:`)
    const e = err.error
    if (e instanceof GrammyError)
      console.error('Error in request:', e.description)

    else if (e instanceof HttpError)
      console.error('Could not contact Telegram:', e)

    else
      console.error('Unknown error:', e)
  })
}
