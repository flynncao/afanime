import type { AniSub } from '#root/classes/AniSub.js'
import { AniEpi } from '#root/classes/AniEpi.js'
import Logger from '#root/utils/logger.js'
import { extractEpisodeNumber } from './episode.js'

export const RECONCILE = {
  ERROR: 0,
  UP_TO_DATE: 1,
  PARTIAL: 2,
  PUSH: 3,
} as const

export type ReconcileCode = typeof RECONCILE[keyof typeof RECONCILE]

/**
 * Reconcile the NEP feed result against the local episode list: marks
 * episodes with video links, advances maxInNEP/pushedMaxNum on `subject`,
 * and fills the subject's push list with newly available episodes.
 */
export function dealNEPResult(nepResult: any, subject: AniSub): ReconcileCode {
  try {
    for (let i = (nepResult.data.length - 1); i >= 0; i--) {
      const item = nepResult.data[i]
      const episodeNum = extractEpisodeNumber(item.text)
      if (!episodeNum)
        continue
      const aniEpisodeEntity = new AniEpi({
        num: episodeNum,
        title: item.text,
        link: item.link,
      }, subject)
      if (aniEpisodeEntity.isAllInfoValid()) {
        const dbEpisodeIndex = episodeNum - subject.getAnimeInstance().eps!
        if (subject.isValidDBEpisodeIndex(dbEpisodeIndex)) {
          subject.episodes[dbEpisodeIndex].videoLink = item.link
          subject.episodes[dbEpisodeIndex].pushed = true
        }

        if (subject.isValidBroadEpisodeNum(episodeNum) && episodeNum >= subject.maxInNEP && episodeNum <= subject.maxInBangumi) {
          subject.maxInNEP = episodeNum
        }
      }
    }

    const current_episode = subject.getAnimeInstance().current_episode
    const startEpiNum = subject.getAnimeInstance().eps!
    if (current_episode === subject.maxInNEP) {
      return RECONCILE.UP_TO_DATE
    }
    else {
      for (let i = subject.pushedMaxNum + 1; i <= subject.maxInNEP; i++) {
        if (subject.isValidDBEpisodeIndex(i - startEpiNum)) {
          const pushedLink = subject.episodes[i - startEpiNum].videoLink
          if (pushedLink) {
            subject.addToPushList(
              {
                link: pushedLink,
                pushEpisodeNum: i,
                bangumiID: subject.episodes[i - startEpiNum].id,
              },
            )
            if (i > subject.pushedMaxNum)
              subject.pushedMaxNum = i
          }
        }
      }

      Logger.logInfo(`current pushList: ${JSON.stringify(subject.getPushList())}`)
      return subject.isPushListConsisitent() ? RECONCILE.PUSH : RECONCILE.PARTIAL
    }
  }
  catch (error) {
    Logger.logError(`Error in dealNEPResult: ${error}`)
    return RECONCILE.ERROR
  }
}
