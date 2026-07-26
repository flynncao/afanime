import type { IAnime } from '#root/types/index.js'
import { LocalDate } from '@js-joda/core'
import { getEpisodes, getSubject } from '#root/api/bangumi.js'
import { mergeSubjectIntoAnime } from '#root/core/subject-merge.js'
import store from '#root/databases/store.js'
import { isEmpty } from '#root/utils/index.js'
import Logger from '#root/utils/logger.js'

export async function fetchBangumiSubjectInfoFromID(animeData: IAnime): Promise<IAnime> {
  const animeID = animeData.id
  const subjectInfo = await getSubject(animeID)

  if (store.AT.getRelations().length !== 0 && store.AT.getThreadIDAndTitleFromID(animeID).title.trim() === '')
    store.AT.updateTitle(animeID, subjectInfo.name_cn)

  const emptyEpisodeList = isEmpty(animeData.episodes)
  const needUpdateBangumiEpisodeInfo = (emptyEpisodeList || animeData.episodes?.at(-1)?.name === '')
  const updatedAnime = mergeSubjectIntoAnime(animeData, subjectInfo, store.clock ? LocalDate.now() : undefined)

  if (!needUpdateBangumiEpisodeInfo) {
    delete updatedAnime.episodes
    return updatedAnime
  }

  try {
    const episodes = await getEpisodes(animeID)
    if (emptyEpisodeList) {
      updatedAnime.episodes = episodes
    }
    else {
      // fill in names that were missing when the episodes were first saved
      for (const item of updatedAnime.episodes!) {
        if (item.name === '') {
          const fetched = episodes.find(episode => episode.id === item.id)
          if (fetched) {
            item.name = fetched.name
            item.name_cn = fetched.name_cn
          }
        }
      }
    }
  }
  catch (error) {
    // episode fetch failure is non-fatal: keep the subject metadata
    Logger.logError(`getEpisodes failed for ${animeID}: ${error}`)
  }
  return updatedAnime
}
