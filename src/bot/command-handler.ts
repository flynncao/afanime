import { ChronoUnit, LocalDate, ZoneId, use } from '@js-joda/core'
import { updateAnimePerThread } from './thread.js'
import { threadQueries, welcomeMessages } from '#root/constants/index.js'
import Logger from '#root/utils/logger.js'
import store from '#root/databases/store.js'
import type { AnimeData } from '#root/types/index.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'

export default function registerCommandHandler() {
  const { bot, menus } = store
  if (!process.env || bot === null || menus === null) {
    Logger.logError('registerCommandHandler: env, bot or menus is null')
    return
  }

  bot.command('test', async (ctx) => {
    return ctx.reply('added!?...')
  })

  bot.command('start', async (ctx) => {
    const index = Math.floor(Math.random() * welcomeMessages.length)
    ctx.reply(welcomeMessages[index])
  })

  bot.command('help', async (ctx) => {
    ctx.reply('You wanna some help?')
  })

  bot.command('create', async (ctx) => {
    await ctx.conversation.enter('createNewConversation')
  })

  bot.command('about', async (ctx) => {
    const me = await bot.api.getMe()
    Logger.logInput(String(me))
    return ctx.reply(`<b>Hi!</b> <i>Welcome</i> to <a href="https://t.me/${me.username}">${me.first_name}</a><span class="tg-spoiler"> id:${me.id}</span>`, { parse_mode: 'HTML' })
  })

  bot.command('settings', async (ctx) => {
    return ctx.reply('Settings')
  })

  bot.command('dashboard', async (ctx) => {
    if (store.menus) {
      return await ctx.reply('所有动画信息：', {
        reply_markup: store.menus['anime-dashboard'],
      })
    }
    else {
      return ctx.reply('沒有動畫資料')
    }
  })

  // bot.command('update', async (ctx) => {
  //   if (ctx.message?.is_topic_message) {
  //     const theadID = ctx.message?.message_thread_id
  //     updateAnimePerThread(ctx, theadID!)
  //   }
  //   else {
  //     return ctx.reply('Please reply to the thread message')
  //   }
  // })

  // bot.command('all', async (ctx) => {
  //   ctx.reply(`更新全部動畫中..`)
  //   threadQueries.forEach(async (thread) => {
  //     updateAnimePerThread(ctx, thread.threadID, false)
  //   })
  // })

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

  Logger.logSuccess('Command handler registered')
}
