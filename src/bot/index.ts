import { GrammyError, HttpError } from 'grammy'
import 'dotenv/config'
import { Timer } from 'easytimer.js'
import type { Timer as ITimer } from 'easytimer.js'
import db from '../databases/db.js'
import { responseTime } from '../middlewares/timestamp.js'
import { TIMER_INTERVAL_IN_SECONDS, commandList, welcomeMessages } from '../constants/index.js'
import { updateAnimePerThread } from './thread.js'
import Logger from '#root/utils/logger.js'
import { threadQueries } from '#root/constants/index.js'
import { useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import type { AnimeData } from '#root/types/index.js'

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

  bot.command('settings', async (ctx) => {
    ctx.reply('Settings')
  })

  bot.command('dashboard', async (ctx) => {
    console.log('ctx.session :>> ', ctx.session)
    ctx.reply(JSON.stringify(ctx.session.animes))
  })

  bot.command('update', async (ctx) => {
    if (ctx.message?.is_topic_message) {
      const theadID = ctx.message?.message_thread_id
      updateAnimePerThread(ctx, theadID!)
    }
    else {
      ctx.reply('Please reply to the thread message')
    }
  })

  bot.command('all', async (ctx) => {
    ctx.reply(`更新全部動畫中..`)
    threadQueries.forEach(async (thread) => {
      updateAnimePerThread(ctx, thread.threadID, false)
    })
  })

  bot.command('metainfo', async (ctx) => {
    if (ctx.session.animes === undefined) {
      ctx.reply('沒有動畫資料')
      return
    }
    const length = ctx.session.animes.length
    ctx.reply(`正在更新動畫元信息，共${length}個`)
    for (let i = 0; i < length; i++) {
      const anime: AnimeData = ctx.session.animes[i]!
      if (anime && anime.metaInfo === null) {
        // TODO: https://github.com/flynncao/telegram-bot-auto-forward-acgn/issues/2
        await useFetchBangumiSubjectInfo(anime.bangumiID).then((data) => {
          console.log('updatingd meta data :>> ', data)
          anime.totalEpisodes = data.total_episodes
          anime.imageURL = data.images.small
        })
      }
    }
    ctx.reply(`更新動畫元信息完成。`)
  })

  bot.command('meta', async (ctx) => {
    let threadID = 8
    if (ctx.message?.is_topic_message)
      threadID = ctx.message.message_thread_id!

    if (ctx.session.animes === undefined) {
      ctx.reply('沒找到這個動畫！')
      return
    }
    const anime = ctx.session.animes.find((anime: AnimeData) => anime.threadID === threadID)
    console.log('anime :>> ', anime)
    if (anime && typeof anime.imageURL !== 'undefined') {
      ctx.replyWithPhoto(anime.imageURL, {
        caption: `動畫名稱: ${anime?.title}\nBangumiID: ${anime?.bangumiID}\n總集數: ${anime?.totalEpisodes}\n當前集數：${anime.lastEpisode}\n動畫信息： https://bgm.tv/subject/${anime?.bangumiID}`,
        message_thread_id: threadID,
      })
    }
    else {
      ctx.reply('動畫元信息不全！請使用`/metainfo`更新！')
    }
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
  /**
   * Custom middlewares
   */
  bot.use(responseTime)
}
