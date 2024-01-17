import type { Context } from 'grammy'
import type { MenuRange } from '@grammyjs/menu'
import { Menu } from '@grammyjs/menu'
import { STATES } from 'mongoose'
import type { AnimeContext } from '#root/types/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import { Anime, STATUS, fetchAndUpdateAnimeMetaInfo, readAnimes } from '#root/models/Anime.js'
import BotLogger from '#root/bot/logger.js'
import { useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'

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
      { text: '拉取bangumi信息', callback: async (ctx: AnimeContext) => {
        if (!store.operatingAnimeID)
          return ctx.reply('找不到操作中的动画ID，请重试！')
        await fetchAndUpdateAnimeMetaInfo(store.operatingAnimeID).then((res) => {
          ctx.reply(res)
        }).catch((err) => {
          console.log('err :>> ', err)
          ctx.reply(err)
        })
      }, newLine: true },
      {
        text: '从NEP仓库拉取动画',
        callback: async (ctx: AnimeContext) => {
          if (!store.operatingAnimeID)
            return ctx.reply('找不到操作中的动画ID，请重试！')
          else
            return ctx.reply('TODO')
        },
        newLine: true,
      },
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
    const dashboardMenu = await initAnimeDashboardMenu()
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
  '未放送',
  '已放送',
  '已完结',
  '已归档',
]

export async function initAnimeDashboardMenu(): Promise<Menu<AnimeContext>> {
  return new Promise ((resolve, reject) => {
    readAnimes().then((res) => {
      const rangedMenu = new Menu<AnimeContext>('anime-dashboard', { autoAnswer: true, fingerprint: (ctx: AnimeContext) => sharedIdent() }).dynamic(async (ctx: AnimeContext, range: MenuRange<AnimeContext>) => {
        for (const item of res) {
          range.text(`${item.name_cn}:${statusLabelArr[item.status]}`, (ctx) => {
            store.dashboardFingerprint = store.clock ? store.clock?.now().toString() : new Date().toISOString()
            // TODO: refactor: use conversation & payload to pass value
            store.operatingAnimeID = item.id
            return ctx.reply(`${item.name_cn}:`, { reply_markup: store.menus['anime-action'] })
          }).row()
        }
      })
      resolve(rangedMenu)
    }).catch((err) => {
      reject(err)
      BotLogger.sendServerMessage('createDashboardMenu: readAnimes failed')
    })
  })
}
