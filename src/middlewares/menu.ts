import type { Context } from 'grammy'
import type { MenuRange } from '@grammyjs/menu'
import { Menu } from '@grammyjs/menu'
import { STATES } from 'mongoose'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import type { AnimeContext, AnimeConversation } from '#root/types/index.js'
import { STATUS } from '#root/types/index.js';

import { fetchAndUpdateAnimeEpisodesInfo, fetchAndUpdateAnimeMetaInfo, updateAnimeMetaAndEpisodes } from '#root/modules/anime/index.js'
import BotLogger from '#root/bot/logger.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import { deleteAnime, readAnimes, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { handleAnimeResolve } from '#root/modules/anime/event.js'
import * as animeJobs from '#root/modules/crons/jobs.js';

 
interface MenuButton {
  text: string
  callback: (ctx: AnimeContext) => Promise<any> | void
  newLine?: boolean
}

export interface MenuList {
  identifier: string
  buttons: MenuButton[]
}

export interface IMyMenu {
  insertButtons(buttons: MenuButton[]): void | Promise<any>
  registerInBot(): void
}

export class ProducedMenu<C extends Context = Context> extends Menu<C> {
  constructor(menuIdentifier: string) {
    super(menuIdentifier)
  }
}

class ClassicMenuBuilder implements IMyMenu {
  private menu!: ProducedMenu<AnimeContext>
  private identifier: string
  constructor(identifier: string) {
    this.identifier = identifier
    this.reset(identifier)
  }

  public reset(menuIdentifier: string) {
    this.identifier = menuIdentifier
    this.menu = new ProducedMenu<AnimeContext>(menuIdentifier)
  }

  public insertButtons(buttons: MenuButton[]): void {
    for (const button of buttons) {
      this.menu.text(button.text, (ctx: AnimeContext) => button.callback(ctx))
      if (button.newLine)
        this.menu.row()
    }
    this.menu.text('取消', ctx => ctx.deleteMessage())
  }

  public getIdentifier() {
    return this.identifier
  }

  public registerInBot() {
    if (!store.bot) {
      Logger.logError('registerInBot: bot is null')
      return
    }
    store.bot?.use(this.menu)
  }

  public getMenu() {
    return this.menu
  }
}

const menuList: MenuList[] = [
  {
    identifier: 'anime-action',
    buttons: [
      { text: '拉取bangumi剧集信息(周常)', callback: async (ctx: AnimeContext) => {
        if (!store.operatingAnimeID)
          return ctx.reply('找不到操作中的动画ID，请重试！')
        const msg = await fetchAndUpdateAnimeMetaInfo(store.operatingAnimeID)
        return await ctx.reply(msg)
      }, newLine: true },
      {
        text: '从NEP仓库拉取动画并推送(日常)',
        callback: async (ctx: AnimeContext) => {
          if (!store.operatingAnimeID) {
            // TODO: fix: consider store animeID and other useful information in context instead of memory.
            return ctx.reply('找不到操作中的动画ID，请重试！')
          }

          else {
            const res = await fetchAndUpdateAnimeEpisodesInfo(store.operatingAnimeID)
            if (typeof res === 'string')
              handleAnimeResolve(res, ctx)

            else
              return ctx.reply('更新失败')
          }
        },
        newLine: true,
      },
      { text: '调整动画查询字符串', callback: async (ctx: AnimeContext) => {
        if (!store.operatingAnimeID)
          return ctx.reply('找不到操作中的动画ID，请重试！')
        await ctx.conversation.enter('updateAnimeQueryConversation')
      }, newLine: true },
      { text: '调整推送完的最新集', callback: async (ctx: AnimeContext) => {
        if (!store.operatingAnimeID)
          return ctx.reply('找不到操作中的动画ID，请重试！')
        await ctx.conversation.enter('updateCurrentEpisodeConversation')
      }, newLine: true },
			{
				text: '调整动画名匹配串',
				callback: async(ctx: AnimeContext)=>{
					if (!store.operatingAnimeID)
						return ctx.reply('找不到操作中的动画ID，请重试！')
					await ctx.conversation.enter('updateAnimeNamePhantomConversation')
				},
				newLine: true
			},
			{
				text: '[特殊]动画开始的集数（默认为1）',
				callback: async(ctx: AnimeContext)=>{
					if (!store.operatingAnimeID)
						return ctx.reply('找不到操作中的动画ID，请重试！')
					await ctx.conversation.enter('updateAnimeStartEpisodeConversation')
				},
				newLine: true
			},
			{
				text: '✅标记为完成',
				callback: async(ctx: AnimeContext)=>{
					if (!store.operatingAnimeID)
						return ctx.reply('找不到操作中的动画ID，请重试！')
					await updateSingleAnimeQuick(store.operatingAnimeID, {status: STATUS.COMPLETED}).then((res)=>{
						ctx.reply('标记成功！')
					})	
				},
				newLine: false
			},
      {
        text: '❌删除动画',
        callback: async (ctx: AnimeContext) => {
          if (!store.operatingAnimeID)
            return ctx.reply('找不到操作中的动画ID，请重试！')
          await deleteAnime(store.operatingAnimeID).then((res) => {
            ctx.reply('删除完成')
          })
        },
        newLine: true,
      },
    ],
  },
]

function sharedIdent(): string {
  return store.dashboardFingerprint  
}

export async function createAllMenus(): Promise<string | Error> {
  const init = async (resolve: any) => {
    const builder = new ClassicMenuBuilder('my-menu-identifier')
    const globalMenuObj: Record<string, ProducedMenu<AnimeContext>> = {}
    const dashboardMenu = initAnimeDashboardMenu()
    // Auto-register
    // TODO: refactor: add composer for builder
    for (const item of menuList) {
      builder.reset(item.identifier)
      builder.insertButtons(item.buttons)
      builder.registerInBot()
      globalMenuObj[item.identifier] = builder.getMenu()
    }

    // Self-register
    if (!(dashboardMenu instanceof Error)) {
      globalMenuObj['anime-dashboard'] = dashboardMenu
      store.bot?.use(dashboardMenu)
    }

    store.menus = globalMenuObj
    Logger.logSuccess('All menus initialized')
    resolve('success')
  }
  return new Promise((resolve, reject) => {
    try {
      init(resolve)
    }
    catch (error) {
      reject(error)
    }
  })
}

const statusLabelArr: string[] = [
  '🟡',
  '🟢',
  '✅',
  '⭕',
]

export function initAnimeDashboardMenu(): ProducedMenu<AnimeContext> | Error {
  try {
    const rangedMenu = new Menu<AnimeContext>('anime-dashboard', { autoAnswer: true }).dynamic(async (ctx: AnimeContext, range: MenuRange<AnimeContext>) => {
      const res = await readAnimes()
      for (const item of res) {
				if(store.dashboardVisibility === 0 || (store.dashboardVisibility === 1 && item.status === STATUS.AIRED)){
					range.text(`${item.name_cn}  (${item.current_episode < item.eps ? '~' : item.current_episode }/${item.total_episodes + item.eps - 1}) ${statusLabelArr[item.status]}`, (ctx) => {
						store.operatingAnimeID = item.id
							return ctx.reply(`操作中的动画：${item.name_cn}`, { reply_markup: store.menus['anime-action'] })
					}).row()
				}

      }
    })
    return rangedMenu.row().text(
			()=> `🔄当前显示${store.dashboardVisibility===0?'全部':'追番中'}动画信息`,
			(ctx)=> {
				store.dashboardVisibility=store.dashboardVisibility===0?1:0
				ctx.answerCallbackQuery('切换成功')
				ctx.editMessageReplyMarkup(store.menus['anime-dashboard'].reply_markup)
			}
		).row().text(
			()=> `🔆执行日常番剧放送任务`,
			(ctx)=> {
				animeJobs.updateAnimeLibraryEpisodesInfo(ctx)
				ctx.answerCallbackQuery('执行成功')
			}
		).text(
			()=> `📥执行周常元信息拉取任务`,
			(ctx)=> {
				animeJobs.updateAnimeLibraryMetaInfo(ctx)
				ctx.answerCallbackQuery('执行成功')
			}
			).row().text('取消', ctx => ctx.deleteMessage())
  }
  catch (error: any) {
    return error
  }
}
