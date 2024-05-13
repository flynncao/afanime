import { ChronoUnit, LocalDate, ZoneId, use } from '@js-joda/core'
import BotLogger from './logger.js'
import { threadQueries, welcomeMessages } from '#root/constants/index.js'
import Logger from '#root/utils/logger.js'
import store from '#root/databases/store.js'
import type { AnimeContext, AnimeData, IAnime } from '#root/types/index.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import { fetchAndUpdateAnimeEpisodesInfo, fetchAndUpdateAnimeMetaInfo } from '#root/modules/anime/index.js'
import { initAnimeDashboardMenu } from '#root/middlewares/menu.js'
import { readSingleAnime } from '#root/models/Anime.js'
import { objToString } from '#root/utils/string.js'
import * as animeJobs from '#root/modules/crons/jobs.js'

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
    let threadID: number | undefined = Number.NaN
    if (ctx.message?.is_topic_message)
      threadID = ctx.message.message_thread_id
    if (!threadID) {
      ctx.reply('请在频道内使用此命令！')
      return
    }
    const animeID = store.AT.getAnimeIDFromThreadID(threadID)
    readSingleAnime(animeID).catch((err) => {
      throw new Error(err)
    }).then((anime: IAnime) => {
      if (anime && anime.images) {
        ctx.replyWithPhoto(anime.images.common, {
          caption: `动画名称: ${anime.name}\n總集數: ${anime?.total_episodes}\n当前更新到：${anime.current_episode}\n信息页： https://bgm.tv/subject/${anime.id}`,
          message_thread_id: threadID,
        })
      }
      else {
        ctx.reply('动画信息不全！')
      }
    })
  })

  bot.command('getid', async (ctx) => {
    const messageThreadID = ctx.message?.message_thread_id
    if (messageThreadID)
      await ctx.reply(`此频道ID为:\`${messageThreadID}\``, { message_thread_id: messageThreadID, parse_mode: 'MarkdownV2' })
    else
      ctx.reply(ctx.message?.message_thread_id?.toString() ?? '请在频道内发消息来获取ID！')
  })

  bot.command('meta', async (ctx) => {
    const messageThreadID = ctx.message?.message_thread_id
    if (!messageThreadID) {
      ctx.reply(ctx.message?.message_thread_id?.toString() ?? '请在频道内发消息来获取ID！')
      return
    }
    const animeID = store.AT.getAnimeIDFromThreadID(messageThreadID)
    if (!animeID)
      return
    const animeData: IAnime = await readSingleAnime(animeID)
    if (animeData) {
      delete animeData.episodes
      await ctx.reply(objToString(animeData), {
        message_thread_id: messageThreadID,
      })
    }
  })

  bot.command('dailytask', async (ctx: AnimeContext) => {
    animeJobs.updateAnimeLibraryEpisodesInfo(ctx)
  })

  bot.command('weeklytask', async (ctx: AnimeContext) => {
    animeJobs.updateAnimeLibraryMetaInfo(ctx)
  })

  bot.command('group', async (ctx) => {
    ctx.reply('hello group', {
      message_thread_id: 1563,
    })
  })

	bot.command('test', async (ctx) => {
		if(store.AT){
			console.log('AT', store.AT.getRelations())
		}

	})
  Logger.logSuccess('Command handler regisred')
}
