import BotLogger from '#root/bot/logger.js'
import type { AnimeContext } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import store from '#root/databases/store.js'

export const AcronymMap = {
  UAEI: 'fetchAndUpdateAnimeEpisodesInfo',
}

async function messenger(msg: string, otherConfig: { message_thread_id?: number } = {}): Promise<any> {
  await BotLogger.sendServerMessageAsync(msg, otherConfig, true)
}

const handlers: {
  [key: string]: {
    [key: string]: (animeID: number) => any
  }
} = {
  UAEI: {
    'no-need-update': async (animeID:number) => {
      const animeObject = store.AT.getThreadIDAndTitleFromID(animeID)
      const msg = `「${animeObject.title}」无需更新！`
      messenger(msg)
    },
    'update-available': async (animeID: number) => {
      const list = store.pushCenter.list
      const animeObject = store.AT.getThreadIDAndTitleFromID(animeID)
			const animeTitle = animeObject.title
			const threadID = animeObject.threadID
      if (list.length === 0) {
        const msg = `「${animeTitle}」无需更新！`
        messenger(msg)
        return
      }
      const msg = `「${animeTitle}」推送中！`
      messenger(msg)
      for (const item of list) {
        if (item.link && item.link !== '') {
          const videoLink = item.link
          const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
          messenger(`原视频：${videoLink}\n评论区：${episodePageLink}`, {
            message_thread_id: threadID,
          }).catch((err: Error) => {
            BotLogger.sendServerMessageAsync(`Error in sending telegram message: ${err}`)
          }).finally(() => {
            store.pushCenter.list = []
            store.pushCenter.threadID = 0
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
  const currentAnimeID: number = Number.parseInt(actions[2])
  Logger.logProgress(`[handleResolve] callerFn: ${callerFn}, callbackFn: ${callbackFn}, opertaingAnimeID: ${currentAnimeID}`)
  if (ctx)
    console.log(JSON.stringify(ctx))
  const cb = handlers[callerFn][callbackFn](currentAnimeID)
  typeof (cb) === 'function' && cb()
}
