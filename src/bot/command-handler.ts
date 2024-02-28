import { ChronoUnit, LocalDate, ZoneId, use } from '@js-joda/core'
import { updateAnimePerThread } from './thread.js'
import BotLogger from './logger.js'
import { threadQueries, welcomeMessages } from '#root/constants/index.js'
import Logger from '#root/utils/logger.js'
import store from '#root/databases/store.js'
import type { AnimeData } from '#root/types/index.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import { fetchAndUpdateAnimeEpisodesInfo, fetchAndUpdateAnimeMetaInfo } from '#root/modules/anime/index.js'
import { initAnimeDashboardMenu } from '#root/middlewares/menu.js'

export default function registerCommandHandler() {
  const { bot, menus } = store
  if (!process.env || bot === null || menus === null) {
    Logger.logError('registerCommandHandler: env, bot or menus is null')
    return
  }

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

  bot.command('info', async (ctx) => {
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
      ctx.reply('动画元信息不全或者未更新，请使用/menu打开菜单并更新元信息！', { message_thread_id: threadID })
    }
  })

  bot.command('getid', async (ctx) => {
    const messageThreadID = ctx.message?.message_thread_id
    if (messageThreadID)
      await ctx.reply(`此频道ID为:\`${messageThreadID}\``, { message_thread_id: messageThreadID, parse_mode: 'MarkdownV2' })
    else
      ctx.reply(ctx.message?.message_thread_id?.toString() ?? '请在频道内发消息来获取ID！')
  })

  Logger.logSuccess('Command handler registered')
}
