import type { Config } from '#root/config/index.js'
import type { AnimeContext, IAnime } from '#root/types/index.js'
import { Composer } from 'grammy'
import { welcomeMessages } from '#root/constants/index.js'
import { dailyEpisodeTask, weeklyMetaTask } from '#root/jobs.js'
import { getAnimeByThreadID } from '#root/models/Anime.js'
import displayWeeklyScheduleFromRealsearch from '#root/modules/realsearch/index.js'
import Logger from '#root/utils/logger.js'
import { objToString } from '#root/utils/string.js'
import { createNotifier } from '../notifier.js'
import { animeDashboardMenu } from './dashboard.js'

export function createCommands(config: Config): Composer<AnimeContext> {
  const composer = new Composer<AnimeContext>()
  const notifier = (ctx: AnimeContext) => createNotifier(ctx.api, config.groupChatID)

  composer.command('start', async (ctx) => {
    const index = Math.floor(Math.random() * welcomeMessages.length)
    return ctx.reply(welcomeMessages[index])
  })

  composer.command('help', async (ctx) => {
    return ctx.reply('You wanna some help?')
  })

  composer.command('create', async (ctx) => {
    await ctx.conversation.enter('createNewConversation')
  })

  composer.command('about', async (ctx) => {
    const me = await ctx.api.getMe()
    Logger.logInput(String(me))
    return ctx.reply(`<b>Hi!</b> <i>Welcome</i> to <a href="https://t.me/${me.username}">${me.first_name}</a><span class="tg-spoiler"> id:${me.id}</span>`, { parse_mode: 'HTML' })
  })

  composer.command('settings', async (ctx) => {
    return ctx.reply('Settings')
  })

  composer.command('dashboard', async (ctx) => {
    return ctx.reply('所有动画信息：', { reply_markup: animeDashboardMenu })
  })

  composer.command('info', async (ctx) => {
    const threadID = ctx.message?.is_topic_message ? ctx.message.message_thread_id : undefined
    if (!threadID)
      return ctx.reply('请在频道内使用此命令！')
    const anime = await getAnimeByThreadID(threadID) as IAnime | null
    if (anime && anime.images) {
      return ctx.replyWithPhoto(anime.images.common, {
        caption: `动画名称: ${anime.name}\n總集數: ${anime.total_episodes}\n当前更新到：${anime.current_episode}\n信息页： https://bgm.tv/subject/${anime.id}`,
        message_thread_id: threadID,
      })
    }
    return ctx.reply('动画信息不全！')
  })

  composer.command('getid', async (ctx) => {
    const messageThreadID = ctx.message?.message_thread_id
    if (messageThreadID)
      return ctx.reply(`此频道ID为:\`${messageThreadID}\``, { message_thread_id: messageThreadID, parse_mode: 'MarkdownV2' })
    return ctx.reply('请在频道内发消息来获取ID！')
  })

  composer.command('meta', async (ctx) => {
    const messageThreadID = ctx.message?.message_thread_id
    if (!messageThreadID)
      return ctx.reply('请在频道内发消息来获取ID！')
    const anime = await getAnimeByThreadID(messageThreadID)
    if (!anime)
      return
    const animeData: Record<string, unknown> = (anime as any).toObject?.() ?? anime
    delete animeData.episodes
    return ctx.reply(objToString(animeData), { message_thread_id: messageThreadID })
  })

  composer.command('dailytask', async (ctx) => {
    void dailyEpisodeTask(notifier(ctx), ctx)
  })

  composer.command('weeklytask', async (ctx) => {
    void weeklyMetaTask(notifier(ctx), ctx)
  })

  composer.command('schedule', async (ctx) => {
    displayWeeklyScheduleFromRealsearch(-1, notifier(ctx), ctx)
  })

  composer.command('cron', async (ctx) => {
    await ctx.conversation.enter('updateAnimeUpdateFrequency')
  })

  return composer
}
