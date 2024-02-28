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
    console.log('animeData', animeData)
    const animeID = animeData.id
    useFetchBangumiSubjectInfo(animeID).then(async (subjectInfo: BangumiSubjectInfoResponseData) => {
      const updatedAnime: IAnime = animeData
      console.log('p2 start')
      const needUpdateBangumiEpisodeInfo = updatedAnime.episodes?.length === 0
      console.log('subjectInfo :>> ', subjectInfo)
      console.log('needUpdateBangumiEpisodeInfo start :>> ', needUpdateBangumiEpisodeInfo)
      if (store.clock && subjectInfo.date) {
        const timeDistancebyDay = LocalDate.parse(subjectInfo.date).until(store.clock.now(), ChronoUnit.DAYS)
        updatedAnime.status = timeDistancebyDay >= 0 ? STATUS.AIRED : STATUS.UNAIRED
      }
      for (const key in subjectInfo) {
        if (Object.prototype.hasOwnProperty.call(subjectInfo, key))
          (updatedAnime as any)[key] = (subjectInfo as any)[key]
      }
      if (needUpdateBangumiEpisodeInfo) {
        console.log('start fetching episodes info from bangumi...')
        useFetchBangumiEpisodesInfo(animeID).then((res) => {
          const localEpisodes: any = res
          console.log('localEpisodes in updating meta:>> ', localEpisodes)
          updatedAnime.episodes = localEpisodes
          resolve(updatedAnime)
        }).catch((err) => {
          Logger.logError(`useFetchBangumiEpisodesInfo err: ${err}`)
          resolve(updatedAnime)
        })
      }
      else {
        delete updatedAnime.episodes
        console.log('p2 NO NEED: updatedAnime :>> ', updatedAnime)
        resolve(updatedAnime)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}
