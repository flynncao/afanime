import type { Notifier } from '#root/bot/notifier.js'
import type { PushItem } from '#root/core/reconcile.js'
import type { IAnime } from '#root/types/index.js'
import { searchNep } from '#root/api/realsearch.js'
import { getConfig } from '#root/config/index.js'
import { reconcile } from '#root/core/reconcile.js'
import { AnimeModel, readSingleAnime, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { STATUS } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import { fetchBangumiSubjectInfoFromID } from '../bangumi/index.js'

/** Refresh subject metadata (and missing episode names) from Bangumi. */
export async function updateAnimeMetaAndEpisodes(animeID: number, successMessage: string = '更新成功'): Promise<string> {
  const anime: IAnime | null = await readSingleAnime(animeID)
  if (!anime)
    throw new Error(`找不到动画信息: ${animeID}`)
  const updatedAnime = await fetchBangumiSubjectInfoFromID(anime)
  await AnimeModel.findOneAndUpdate({ id: animeID }, updatedAnime)
  return successMessage
}

/** Menu action / weekly task: returns a user-facing message, throws one on failure. */
export async function updateAnimeMeta(animeID: number): Promise<string> {
  const anime: IAnime | null = await readSingleAnime(animeID)
  const title = anime?.name_cn ?? String(animeID)
  try {
    await updateAnimeMetaAndEpisodes(animeID, '更新动画元信息及剧集成功')
    return `更新「${title}」元信息成功`
  }
  catch (error) {
    Logger.logError(`updateAnimeMeta(${animeID}):`, error)
    throw new Error(`更新「${title}」元信息失败`)
  }
}

export interface AnimeUpdateOutcome {
  animeID: number
  title: string
  threadID: number
  status: 'up-to-date' | 'update-available'
  pushList: PushItem[]
}

/**
 * Menu action / daily task: search the NEP library, reconcile against the
 * local episode list, persist progress, and report what became available.
 */
export async function updateAnimeEpisodes(animeID: number): Promise<AnimeUpdateOutcome> {
  const anime: IAnime | null = await readSingleAnime(animeID)
  if (!anime)
    throw new Error(`找不到动画信息: ${animeID}`)
  if (!anime.episodes || anime.episodes.length === 0)
    throw new Error('本地数据库中没有剧集信息，请查询番剧是否开通，或者使用菜单中的【拉取Bangumi剧集信息】功能')
  if (!(anime.query && anime.threadID && anime.current_episode >= 0 && anime.name_cn && anime.eps))
    throw new Error('query, threadID, current_episode, name, eps字段不能为空')

  const nepResult = await searchNep(anime.query, 0)
  if (nepResult.data.length === 0)
    throw new Error('读取NEP仓库时发生错误！')

  const result = reconcile(anime, nepResult.data, getConfig().translatorBlacklist)
  if (result.status === 'advanced') {
    await updateSingleAnimeQuick(animeID, {
      episodes: anime.episodes,
      current_episode: result.pushedMaxNum,
      last_episode: result.maxInNEP,
      status: (result.maxInNEP - anime.eps! + 1 === anime.total_episodes ? STATUS.COMPLETED : STATUS.AIRED),
    })
  }
  return {
    animeID,
    title: anime.name_cn,
    threadID: anime.threadID,
    status: result.pushList.length > 0 ? 'update-available' : 'up-to-date',
    pushList: result.pushList,
  }
}

/** Send every newly available episode into the anime's topic thread. */
export async function pushEpisodes(outcome: AnimeUpdateOutcome, notifier: Notifier): Promise<void> {
  for (const item of outcome.pushList) {
    if (!item.link)
      continue
    const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
    await notifier.sendToThread(outcome.threadID, `原视频：${item.link}\n评论区：${episodePageLink}`, { parse_mode: 'HTML' })
      .catch((error: Error) => notifier.send(`Error in sending telegram message: ${error}`))
  }
}
