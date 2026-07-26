import type { AnimeContext } from '#root/types/index.js'
import { Menu } from '@grammyjs/menu'
import { getConfig } from '#root/config/index.js'
import { dailyEpisodeTask, weeklyMetaTask } from '#root/jobs.js'
import { deleteAnime, readAnimes, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { pushEpisodes, updateAnimeEpisodes, updateAnimeMeta } from '#root/modules/anime/index.js'
import { STATUS } from '#root/types/index.js'
import { createNotifier } from '../notifier.js'

const statusLabels = ['🟡', '🟢', '✅', '⭕']

function notifier(ctx: AnimeContext) {
  return createNotifier(ctx.api, getConfig().groupChatID)
}

/** Guard: every action button needs the anime picked in the dashboard (per-chat session). */
function withOperatingAnime(handler: (ctx: AnimeContext, animeID: number) => Promise<unknown>) {
  return async (ctx: AnimeContext) => {
    const animeID = ctx.session.operatingAnimeID
    if (!animeID)
      return ctx.reply('找不到操作中的动画ID，请重试！')
    return handler(ctx, animeID)
  }
}

function enterConversation(name: string) {
  return withOperatingAnime(async (ctx, animeID) => {
    await ctx.conversation.enter(name, animeID)
  })
}

export const animeActionMenu = new Menu<AnimeContext>('anime-action')
  .text('拉取bangumi剧集信息(周常)', withOperatingAnime(async (ctx, animeID) => {
    const message = await updateAnimeMeta(animeID).catch((error: Error) => error.message)
    return ctx.reply(message)
  }))
  .row()
  .text('从NEP仓库拉取动画并推送(日常)', withOperatingAnime(async (ctx, animeID) => {
    try {
      const outcome = await updateAnimeEpisodes(animeID)
      if (outcome.status === 'up-to-date')
        return ctx.reply(`「${outcome.title}」无需更新！`)
      await ctx.reply(`「${outcome.title}」推送中！`)
      await pushEpisodes(outcome, notifier(ctx))
    }
    catch (error) {
      return ctx.reply(error instanceof Error ? error.message : '更新失败')
    }
  }))
  .row()
  .text('调整动画查询字符串', enterConversation('updateAnimeQueryConversation'))
  .row()
  .text('调整推送完的最新集', enterConversation('updateCurrentEpisodeConversation'))
  .row()
  .text('调整动画名匹配串', enterConversation('updateAnimeNamePhantomConversation'))
  .row()
  .text('[特殊]动画开始的集数（默认为1）', enterConversation('updateAnimeStartEpisodeConversation'))
  .row()
  .text('✅标记为完成', withOperatingAnime(async (ctx, animeID) => {
    await updateSingleAnimeQuick(animeID, { status: STATUS.COMPLETED })
    return ctx.reply('标记成功！')
  }))
  .text('❌删除动画', withOperatingAnime(async (ctx, animeID) => {
    await deleteAnime(animeID)
    return ctx.reply('删除完成')
  }))
  .row()
  .text('取消', ctx => ctx.deleteMessage())

export const animeDashboardMenu = new Menu<AnimeContext>('anime-dashboard', {
  autoAnswer: true,
  onMenuOutdated: async (ctx) => {
    await ctx.menu.update()
  },
})
  .dynamic(async (ctx, range) => {
    const animes = await readAnimes()
    const showAll = ctx.session.dashboardShowAll ?? false
    for (const anime of animes) {
      if (showAll || anime.status === STATUS.AIRED) {
        const label = `${anime.name_cn}  (${anime.current_episode < anime.eps! ? '~' : anime.current_episode}/${anime.total_episodes + anime.eps! - 1}) ${statusLabels[anime.status]}`
        range.text(label, (ctx) => {
          ctx.session.operatingAnimeID = anime.id
          return ctx.reply(`${anime.name_cn} :第${anime.current_episode}集已推送`, { reply_markup: animeActionMenu })
        }).row()
      }
    }
  })
  .row()
  .text(
    ctx => `🔄当前显示${(ctx.session.dashboardShowAll ?? false) ? '全部' : '追番中'}动画信息`,
    async (ctx) => {
      ctx.session.dashboardShowAll = !(ctx.session.dashboardShowAll ?? false)
      await ctx.answerCallbackQuery('切换成功')
      await ctx.menu.update()
    },
  )
  .row()
  .text('🔆执行日常番剧放送任务', async (ctx) => {
    void dailyEpisodeTask(notifier(ctx), ctx)
    await ctx.answerCallbackQuery('执行成功')
  })
  .text('📥执行周常元信息拉取任务', async (ctx) => {
    void weeklyMetaTask(notifier(ctx), ctx)
    await ctx.answerCallbackQuery('执行成功')
  })
  .row()
  .text('取消', ctx => ctx.deleteMessage())
