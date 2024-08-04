import BotLogger from '#root/bot/logger.js'
import type { AnimeContext } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import store from '#root/databases/store.js'

export const AcronymMap = {
  UAEI: 'fetchAndUpdateAnimeEpisodesInfo',
}

async function messenger(msg: string, otherConfig: { message_thread_id?: number, parse_mode?: string } = {}): Promise<any> {
  await BotLogger.sendServerMessageAsync(msg, otherConfig, true)
}

const handlers: {
  [key: string]: {
    [key: string]: (animeID: number, ctx?: AnimeContext) => any
  }
} = {
  UAEI: {
    'no-need-update': async (animeID: number, ctx?: AnimeContext) => {
      const animeObject = store.AT.getThreadIDAndTitleFromID(animeID)
      const msg = `「${animeObject.title}」无需更新！`
      if (ctx) {
        await ctx.reply(msg)
      }
      return Promise.resolve(false)
    },
    'update-available': async (animeID: number, ctx?: AnimeContext) => {
      const list = store.pushCenter.list
      const animeObject = store.AT.getThreadIDAndTitleFromID(animeID)
      const animeTitle = animeObject.title
      const threadID = animeObject.threadID
      if (list.length === 0) {
        const msg = `「${animeTitle}」无需更新！`
        if (ctx) {
          await ctx.reply(msg)
        }
        return Promise.resolve(false)
      }
      const msg = `「${animeTitle}」推送中！`
      if (ctx) {
        await ctx.reply(msg)
      }
      for (const item of list) {
        if (item.link && item.link !== '') {
          const videoLink = item.link
          const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
          await messenger(`原视频：${videoLink}\n评论区：${episodePageLink}`, {
            message_thread_id: threadID,
            parse_mode: 'HTML',
          }).catch((err: Error) => {
            BotLogger.sendServerMessageAsync(`Error in sending telegram message: ${err}`)
          }).finally(() => {
            store.pushCenter.list = []
            store.pushCenter.threadID = 0
          })
        }
      }
      return Promise.resolve(true)
    },
  },
}
// resolve TRUE if the anime will update
export function handleAnimeResolve(str: string, ctx?: AnimeContext): Promise<boolean> {
  const actions = str.split('#')
  const callerFn: string = actions[0]
  const callbackFn: string = actions[1]
  const currentAnimeID: number = Number.parseInt(actions[2])
  Logger.logProgress(`[handleResolve] callerFn: ${callerFn}, callbackFn: ${callbackFn}, opertaingAnimeID: ${currentAnimeID}`)
  const cb = handlers[callerFn][callbackFn]
  if (typeof cb !== 'function') {
    throw new TypeError(`[handleResolve] callback function ${callbackFn} not found!`)
  }
  else {
    return cb(currentAnimeID, ctx)
  }
}
