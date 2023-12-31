import type { CommandContext } from 'grammy'
import { GrammyError, HttpError } from 'grammy'
import 'dotenv/config'
import { Timer } from 'easytimer.js'
import type { Timer as ITimer } from 'easytimer.js'
import { AxiosError } from 'axios'
import Logger from '../utils/logger.js'
import db from '../databases/db.js'
import { responseTime } from '../middlewares/timestamp.js'
import { TIMER_INTERVAL_IN_SECONDS, commandList, welcomeMessages } from '../constants/index.js'
import { useFetchNEP } from '../modules/acgn.js'
import { threadQueries } from '#root/constants/index.js'
import type { TelegramMessageResponse } from '#root/modules/response.js'
import type { AnimeThread } from '#root/types/commands.js'

const userChatID = process.env.USER_CHAT_ID!

export async function init() {
  Logger.logSuccess('Bot started')
  const bot = db.bot
  if (!bot) {
    Logger.logError('Bot is not initialized')
    return
  }

  // bot.api.sendMessage(userChatID, 'こんにちは！ココアです～')
  /**
   * Set high-priority middleware
   *
   */
  await bot.api.setMyCommands(commandList)
  /**
   * Message handlers
   */
  bot.command('start', async (ctx) => {
    const index = Math.floor(Math.random() * welcomeMessages.length)
    ctx.reply(welcomeMessages[index])
  })

  bot.command('help', async (ctx) => {
    ctx.reply('You wanna some help?')
  })

  bot.command('about', async (ctx) => {
    const me = await bot.api.getMe()
    console.log('me :>> ', me)
    ctx.reply(`<b>Hi!</b> <i>Welcome</i> to <a href="https://t.me/${me.username}">${me.first_name}</a><span class="tg-spoiler"> id:${me.id}</span>`, { parse_mode: 'HTML' })
  })

  bot.command('update', async (ctx) => {
    if (ctx.message?.is_topic_message) {
      const theadID = ctx.message?.message_thread_id
      const thread = threadQueries.find((thread: AnimeThread) => thread.threadID === theadID)
      if (!thread) {
        ctx.reply('No such thread found')
        return
      }
      const data = await useFetchNEP(thread.query)
      if ('data' in data) {
        bot.api.sendMessage(userChatID, String(data.data[0].link), {
          message_thread_id: theadID,
        })
      }
      else {
        bot.api.sendMessage(userChatID, 'Error while requesting data from NEP')
      }
    }
    else {
      ctx.reply('Please reply to the thread message')
    }
  })

  bot.command('all', async (ctx) => {
    ctx.reply(`更新全部動畫中..`)
    threadQueries.forEach(async (thread) => {
      setTimeout(async () => {
        const data = await useFetchNEP(thread.query)
        if ('data' in data) {
          bot.api.sendMessage(userChatID, String(data.data[0].link), {
            message_thread_id: thread.threadID,
          })
        }
        else {
          bot.api.sendMessage(userChatID, 'Error while requesting data from NEP')
        }
      }, 5000)
    })
  })

  /**
   * Repetitive message handlers
   */
  if (!db.timer) {
    const timer = new Timer()
    db.timer = timer
  }
  db.timer?.start({ callback(timer: ITimer) {
    if (timer.getTotalTimeValues().seconds === TIMER_INTERVAL_IN_SECONDS) {
      bot.api.sendMessage(userChatID, `Timer ${TIMER_INTERVAL_IN_SECONDS} seconds passed!`)
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
  /**
   * Custom middlewares
   */
  bot.use(responseTime)
}
