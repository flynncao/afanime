import { handleAnimeResolve } from './event.js'
import { fetchAndUpdateAnimeEpisodesInfo } from './index.js'
import BotLogger from '#root/bot/logger.js'

export async function executeAnimeEpisodeInfoTask(animeID: number, animeName: string) {
  const res = await fetchAndUpdateAnimeEpisodesInfo(animeID)
  if (typeof res === 'string')
    handleAnimeResolve(res)

  else
    BotLogger.sendServerMessageAsync(`${animeName}：更新剧集信息失败`)
}
