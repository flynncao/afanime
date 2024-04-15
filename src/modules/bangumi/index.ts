import { ChronoUnit, LocalDate } from '@js-joda/core'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import store from '#root/databases/store.js'
import { STATUS } from '#root/types/index.js'
import type { AnimeContext, IAnime } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import type { BangumiSubjectInfoResponseData, IEpisode } from '#root/types/response.js'
import BotLogger from '#root/bot/logger.js'
import type { Anime } from '#root/models/Anime.js'

export function fetchBangumiSubjectInfoFromID(animeData: IAnime): Promise<IAnime> {
  return new Promise((resolve, reject) => {
    const animeID = animeData.id
    useFetchBangumiSubjectInfo(animeID).then(async (subjectInfo: BangumiSubjectInfoResponseData) => {
      const updatedAnime: IAnime = animeData
      updatedAnime.query = updatedAnime.query === '1' ? subjectInfo.name_cn : updatedAnime.query
      const needUpdateBangumiEpisodeInfo = updatedAnime.episodes?.length === 0
      if (store.clock && subjectInfo.date) {
        const timeDistancebyDay = LocalDate.parse(subjectInfo.date).until(store.clock.now(), ChronoUnit.DAYS)
        updatedAnime.status = timeDistancebyDay >= 0 ? STATUS.AIRED : STATUS.UNAIRED
      }
      for (const key in subjectInfo) {
        if (Object.prototype.hasOwnProperty.call(subjectInfo, key))
          (updatedAnime as any)[key] = (subjectInfo as any)[key]
      }
      if (needUpdateBangumiEpisodeInfo) {
        useFetchBangumiEpisodesInfo(animeID).then((res: any) => {
          // TODO: OOP design pattern: Encapsulation
          if (Array.isArray(res)) {
            const localEpisodes: any = res
            updatedAnime.episodes = localEpisodes
            console.log('updatedAnime', updatedAnime)
            resolve(updatedAnime)
          }
        }).catch((err) => {
          Logger.logError(`useFetchBangumiEpisodesInfo err: ${err}`)
          resolve(updatedAnime)
        })
      }
      else {
        delete updatedAnime.episodes
        resolve(updatedAnime)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}
