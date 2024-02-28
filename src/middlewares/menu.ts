import type { Context } from 'grammy'
import type { MenuRange } from '@grammyjs/menu'
import { Menu } from '@grammyjs/menu'
import { STATES } from 'mongoose'
import type { AnimeContext } from '#root/types/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import { Anime, STATUS, fetchAndUpdateAnimeEpisodesInfo, fetchAndUpdateAnimeMetaInfo, readAnimes, updateAnimeMetaAndEpisodes } from '#root/models/Anime.js'
import BotLogger from '#root/bot/logger.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'

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
      {
        text: '更新bangumi基础信息',
        callback: async (ctx: AnimeContext) => {
          if (!store.operatingAnimeID)
            return ctx.reply('找不到操作中的动画ID，请重试！')
          const msg = await updateAnimeMetaAndEpisodes(store.operatingAnimeID)
          await ctx.reply(msg)
        },
        newLine: true,
      },
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
            const res = await fetchAndUpdateAnimeEpisodesInfo(store.operatingAnimeID, ctx)
            if (typeof res === 'string') {
              await ctx.reply(res)
              if (store.pushCenter.list.length > 0) {
                const list = store.pushCenter.list
                for (const item of list) {
                  if (item.link && item.link !== '') {
                    const videoLink = item.link
                    const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
                    await BotLogger.sendServerMessageAsync(`原视频：${videoLink}\n评论区：${episodePageLink}`, {
                      message_thread_id: store.pushCenter.threadID,
                    })
                  }
                }
              }
            }
            else {
              return ctx.reply('更新失败')
            }
          }
        },
        newLine: true,
      },
      { text: '调整数据库中查询字符串(初始用)', callback: async (ctx: AnimeContext) => {
        if (!store.operatingAnimeID)
          return ctx.reply('找不到操作中的动画ID，请重试！')
        await ctx.conversation.enter('updateAnimeQueryConversation')
      }, newLine: true },
      { text: '调整数据库中最新集(初始用)', callback: async (ctx: AnimeContext) => {
        if (!store.operatingAnimeID)
          return ctx.reply('找不到操作中的动画ID，请重试！')
        await ctx.conversation.enter('updateCurrentEpisodeConversation')
      }, newLine: true },
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
  '💯',
  '⭕',
]

export function initAnimeDashboardMenu(): ProducedMenu<AnimeContext> | Error {
  try {
    const rangedMenu = new Menu<AnimeContext>('anime-dashboard', { autoAnswer: true }).dynamic(async (ctx: AnimeContext, range: MenuRange<AnimeContext>) => {
      const res = await readAnimes()
      for (const item of res) {
        range.text(`${item.name_cn}  (${item.current_episode}/${item.total_episodes}) ${statusLabelArr[item.status]}`, (ctx) => {
          store.operatingAnimeID = item.id
          return ctx.reply(`${item.name_cn}:`, { reply_markup: store.menus['anime-action'] })
        }).row()
      }
    })
    return rangedMenu
  }
  catch (error: any) {
    return error
  }
}
