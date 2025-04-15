import { ChronoUnit, LocalDate } from '@js-joda/core'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import store from '#root/databases/store.js'
import { STATUS } from '#root/types/index.js'
import type { IAnime } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import type { BangumiSubjectInfoResponseData } from '#root/types/response.js'
import { isEmpty } from '#root/utils/index.js'

export function fetchBangumiSubjectInfoFromID(animeData: IAnime): Promise<IAnime> {
  return new Promise((resolve, reject) => {
    const animeID = animeData.id
    useFetchBangumiSubjectInfo(animeID).then(async (subjectInfo: BangumiSubjectInfoResponseData) => {
      const updatedAnime: IAnime = animeData
      if (store.AT.getRelations().length !== 0 && store.AT.getThreadIDAndTitleFromID(animeID).title.trim() === '') {
        store.AT.updateTitle(animeID, subjectInfo.name_cn)
      }
      updatedAnime.query = updatedAnime.query === '1' ? subjectInfo.name_cn : updatedAnime.query
      const emptyEpisodeList = isEmpty(updatedAnime.episodes)
      const needUpdateBangumiEpisodeInfo = (emptyEpisodeList || updatedAnime.episodes?.at(-1)?.name === '')
      if (store.clock && subjectInfo.date) {
        const timeDistancebyDay = LocalDate.parse(subjectInfo.date).until(store.clock.now(), ChronoUnit.DAYS)
        if (updatedAnime.status !== STATUS.COMPLETED) {
          updatedAnime.status = timeDistancebyDay >= 0 ? STATUS.AIRED : STATUS.UNAIRED
        }
      }
      for (const key in subjectInfo) {
        if (Object.prototype.hasOwnProperty.call(subjectInfo, key) && key !== 'eps' && key !== 'total_episodes')
          (updatedAnime as any)[key] = (subjectInfo as any)[key]
      }
      if (!updatedAnime.name_cn) {
        updatedAnime.name_cn = `${subjectInfo.name}`
      }
      if (!updatedAnime.name_phantom) {
        updatedAnime.name_phantom = `${subjectInfo.name_cn}`
      }
      if (!updatedAnime.total_episodes) {
        updatedAnime.total_episodes = subjectInfo.eps === 0 ? subjectInfo.total_episodes : Math.min(subjectInfo.eps, subjectInfo.total_episodes)
      }
      if (needUpdateBangumiEpisodeInfo) {
        useFetchBangumiEpisodesInfo(animeID).then((res: any) => {
          // TODO: OOP design pattern: Encapsulation
          Logger.logInfo('local episode without link videos>res', res)
          if (Array.isArray(res)) {
            if (emptyEpisodeList) {
              updatedAnime.episodes = res
            }
            else {
              const localEpisodes: any = res
              for (const item of updatedAnime.episodes!) {
                if (item.name === '') {
                  const newItem = localEpisodes.find((episode: any) => episode.id === item.id)
                  if (newItem) {
                    item.name = newItem.name
                    item.name_cn = newItem.name_cn
                  }
                }
              }
            }
          }
          resolve(updatedAnime)
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
