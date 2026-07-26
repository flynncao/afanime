import type { IAnime } from '#root/types/index.js'
import { extractEpisodeNumber, titleMatches } from './episode.js'

export interface NepFeedItem {
  text: string
  link: string
}

export interface PushItem {
  link: string
  pushEpisodeNum: number
  bangumiID: number
}

export interface ReconcileResult {
  /** 'advanced' means the local record is stale and needs a DB write */
  status: 'up-to-date' | 'advanced'
  /** newly available episodes to push, oldest first (may be empty even when advanced) */
  pushList: PushItem[]
  /** highest episode number available in the NEP library */
  maxInNEP: number
  /** highest episode number that will have been pushed after this run */
  pushedMaxNum: number
}

/**
 * Reconcile the NEP feed against the local episode list. Mutates
 * `anime.episodes` (fills videoLink/pushed) and returns what changed.
 * Pure logic — no I/O; callers persist and push.
 */
export function reconcile(anime: IAnime, nepItems: NepFeedItem[], blacklist: string[] = []): ReconcileResult {
  const episodes = anime.episodes ?? []
  const epStart = anime.eps ?? 1
  const maxInBangumi = epStart + anime.total_episodes - 1
  const pattern = anime.name_phantom ? anime.name_phantom : anime.name_cn
  let maxInNEP = Math.max(episodes.filter(episode => episode.videoLink).length, anime.current_episode)
  let pushedMaxNum = anime.current_episode

  // oldest feed entries first
  for (let i = nepItems.length - 1; i >= 0; i--) {
    const item = nepItems[i]
    const episodeNum = extractEpisodeNumber(item.text)
    if (!episodeNum)
      continue
    const episode = episodes[episodeNum - epStart]
    const isValid = Boolean(episode?.name || episode?.name_cn)
      && episodeNum >= epStart && episodeNum <= maxInBangumi
      && Boolean(item.link)
      && titleMatches(item.text, pattern, blacklist)
    if (!isValid)
      continue
    episode.videoLink = item.link
    episode.pushed = true
    if (episodeNum >= maxInNEP)
      maxInNEP = episodeNum
  }

  if (anime.current_episode === maxInNEP)
    return { status: 'up-to-date', pushList: [], maxInNEP, pushedMaxNum }

  const pushList: PushItem[] = []
  for (let episodeNum = pushedMaxNum + 1; episodeNum <= maxInNEP; episodeNum++) {
    const episode = episodes[episodeNum - epStart]
    if (episode?.videoLink) {
      pushList.push({ link: episode.videoLink, pushEpisodeNum: episodeNum, bangumiID: episode.id })
      pushedMaxNum = episodeNum
    }
  }
  return { status: 'advanced', pushList, maxInNEP, pushedMaxNum }
}
