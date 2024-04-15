import { fetchAndUpdateAnimeEpisodesInfo } from './index.js'
import store from '#root/databases/store.js'
import BotLogger from '#root/bot/logger.js'

export async function executeAnimeEpisodeInfoTask(animeID: number, animeName: string) {
  const res = await fetchAndUpdateAnimeEpisodesInfo(animeID)
  if (typeof res === 'string') {
    await BotLogger.sendServerMessageAsync(res)
    if (store.pushCenter.list.length > 0) {
      const list = store.pushCenter.list
      for (const item of list) {
        if (item.link && item.link !== '') {
          const videoLink = item.link
          const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
          await BotLogger.sendServerMessageAsync(`原视频：${videoLink}\n评论区：${episodePageLink}`, {
            message_thread_id: store.pushCenter.threadID,
          }).catch((err) => {
            BotLogger.sendServerMessageAsync(`Error in sending telegram message: ${err}`)
          }).finally(() => {
            store.pushCenter.list = []
          })
        }
      }
    }
  }
  else {
    BotLogger.sendServerMessageAsync(`${animeName}：更新剧集信息失败`)
  }
}
