import type { Context } from 'grammy'
import { Menu } from '@grammyjs/menu'
import type { AnimeContext } from '#root/types/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import { readAnimes } from '#root/models/Anime.js'
import BotLogger from '#root/bot/logger.js'

interface MenuButton {
  text: string
  callback: (ctx: AnimeContext) => Promise<any>
}

export interface MenuList {
  identifier: string
  buttons: MenuButton[]
}

export interface IMyMenu {
  insertButtons(buttons: MenuButton[]): void
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
    for (const button of buttons)
      this.menu.text(button.text, (ctx: AnimeContext) => button.callback(ctx))
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
    identifier: 'simple-menu',
    buttons: [
      { text: 'Female', callback: (ctx: AnimeContext) => ctx.reply('You pressed female!') },
      { text: 'Male', callback: (ctx: AnimeContext) => ctx.reply('You pressed male!') },
    ],
  },
  {
    identifier: 'edit-post',
    buttons: [
      { text: 'Edit', callback: async (ctx: AnimeContext) => await ctx.conversation.enter('editPostConversation') },
      { text: 'Create', callback: async (ctx: AnimeContext) => await ctx.conversation.enter('createPostConversation') },
    ],
  },
]

export async function createAllMenus(): Promise<string | Error> {
  const init = async (resolve: any) => {
    console.log('begin init menus')
    const builder = new ClassicMenuBuilder('my-menu-identifier')
    const presetMenuList: Record<string, ProducedMenu<AnimeContext>> = {}
    const dashboardMenu = await initAnimeDashboardMenu()
    if (!(dashboardMenu instanceof Error))
      menuList.push(dashboardMenu)

    // TODO: refactor: add composer for builder
    for (const item of menuList) {
      builder.reset(item.identifier)
      builder.insertButtons(item.buttons)
      builder.registerInBot()
      presetMenuList[item.identifier] = builder.getMenu()
    }
    store.menus = presetMenuList
    Logger.logSuccess('All menus initialized')
    console.log('end init menus')
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

export async function initAnimeDashboardMenu(): Promise<MenuList> {
  return new Promise ((resolve, reject) => {
    readAnimes().then((res) => {
      const buttons = []
      for (const item of res)
        buttons.push({ text: `${item.name_cn}:${item.status}`, callback: (ctx: AnimeContext) => ctx.reply(item.name_cn) })
      resolve({ identifier: 'anime-dashboard', buttons })
    }).catch((err) => {
      reject(err)
      BotLogger.sendServerMessage('createDashboardMenu: readAnimes failed')
    })
  })
}
