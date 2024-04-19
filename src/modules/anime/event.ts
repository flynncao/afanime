import BotLogger from '#root/bot/logger.js'
import type { AnimeContext } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import store from '#root/databases/store.js'

export const AcronymMap = {
  UAEI: 'fetchAndUpdateAnimeEpisodesInfo',
}

function optionalMessenger(msg: string, ctx?: AnimeContext, otherConfig: { message_thread_id?: number } = {}): any {
  return ctx ? ctx.reply(msg, otherConfig) : BotLogger.sendServerMessageAsync(msg, otherConfig, true)
}

const handlers: {
  [key: string]: {
    [key: string]: (ctx?: AnimeContext) => any
  }
} = {
  UAEI: {
    'no-need-update': async (ctx?: AnimeContext) => {
      const threadID = store.pushCenter.threadID
      if (!threadID) {
        optionalMessenger('threadID不能为空！', ctx)
        return
      }
      const animeTitle = store.AT.getAnimeTitleFromThreadID(threadID)
      const msg = `「${animeTitle}」无需更新！`
      await optionalMessenger(msg, ctx)
    },
    'update-available': async (ctx?: AnimeContext) => {
      const threadID = store.pushCenter.threadID
      if (!threadID) {
        optionalMessenger('threadID不能为空！', ctx)
        return
      }
      const list = store.pushCenter.list
      const animeTitle = store.AT.getAnimeTitleFromThreadID(threadID)

      if (list.length === 0) {
        const msg = `「${animeTitle}」无需更新！`
        optionalMessenger(msg, ctx)
        return
      }
      console.log('threadID::::', threadID)
      const msg = `「${animeTitle}」推送中！`
      optionalMessenger(msg, ctx)

      for (const item of list) {
        if (item.link && item.link !== '') {
          const videoLink = item.link
          const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
          await optionalMessenger(`原视频：${videoLink}\n评论区：${episodePageLink}`, ctx, {
            message_thread_id: threadID,
          }).catch((err: Error) => {
            BotLogger.sendServerMessageAsync(`Error in sending telegram message: ${err}`)
          }).finally(() => {
            store.pushCenter.list = []
            store.pushCenter.threadID = -100
          })
        }
      }
    },
  },
}
export function handleAnimeResolve(str: string, ctx?: AnimeContext) {
  const actions = str.split('#')
  const callerFn: string = actions[0]
  const callbackFn: string = actions[1]
  const opertaingAnimeID: number = Number.parseInt(actions[2])
  Logger.logProgress(`[handleResolve] callerFn: ${callerFn}, callbackFn: ${callbackFn}, opertaingAnimeID: ${opertaingAnimeID}`)
  const cb = handlers[callerFn][callbackFn](ctx)
  typeof (cb) === 'function' && cb()
}
