import type { IAnime } from '#root/types/index.js'
import type { BangumiSubjectInfoResponseData } from '#root/types/response.js'
import { LocalDate } from '@js-joda/core'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import { mergeSubjectIntoAnime } from '#root/core/subject-merge.js'
import store from '#root/databases/store.js'
import { isEmpty } from '#root/utils/index.js'
import Logger from '#root/utils/logger.js'

export function fetchBangumiSubjectInfoFromID(animeData: IAnime): Promise<IAnime> {
  return new Promise((resolve, reject) => {
    const animeID = animeData.id
    useFetchBangumiSubjectInfo(animeID).then(async (subjectInfo: BangumiSubjectInfoResponseData) => {
      if (store.AT.getRelations().length !== 0 && store.AT.getThreadIDAndTitleFromID(animeID).title.trim() === '') {
        store.AT.updateTitle(animeID, subjectInfo.name_cn)
      }
      const emptyEpisodeList = isEmpty(animeData.episodes)
      const needUpdateBangumiEpisodeInfo = (emptyEpisodeList || animeData.episodes?.at(-1)?.name === '')
      const updatedAnime = mergeSubjectIntoAnime(animeData, subjectInfo, store.clock ? LocalDate.now() : undefined)
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
