import type { LocalDate } from '@js-joda/core'
import type { BangumiSubject } from '#root/api/schemas.js'
import type { IAnime } from '#root/types/index.js'
import { ChronoUnit, LocalDate as JodaLocalDate } from '@js-joda/core'
import { STATUS } from '#root/types/index.js'

/**
 * Merge a Bangumi subject payload into the local anime record with an
 * explicit field mapping (previously a blind for...in copy that relied on
 * mongoose strict mode to strip unknown fields such as tags/infobox).
 * Mutates and returns `anime`.
 */
export function mergeSubjectIntoAnime(anime: IAnime, subjectInfo: BangumiSubject, today?: LocalDate): IAnime {
  if (today && subjectInfo.date && anime.status !== STATUS.COMPLETED) {
    const timeDistanceByDay = JodaLocalDate.parse(subjectInfo.date).until(today, ChronoUnit.DAYS)
    anime.status = timeDistanceByDay >= 0 ? STATUS.AIRED : STATUS.UNAIRED
  }

  if (anime.query === '1')
    anime.query = subjectInfo.name_cn

  anime.name = subjectInfo.name
  anime.summary = subjectInfo.summary
  anime.platform = subjectInfo.platform ?? anime.platform
  anime.date = subjectInfo.date ?? anime.date
  anime.volumes = subjectInfo.volumes ?? anime.volumes
  anime.locked = subjectInfo.locked ?? anime.locked
  anime.nsfw = subjectInfo.nsfw ?? anime.nsfw
  if (subjectInfo.images) {
    // the schema has no `grid` field, so only these four are persisted
    anime.images = {
      ...anime.images,
      small: subjectInfo.images.small,
      large: subjectInfo.images.large,
      medium: subjectInfo.images.medium,
      common: subjectInfo.images.common,
    } as IAnime['images']
  }
  if (subjectInfo.rating) {
    anime.rating = {
      rank: subjectInfo.rating.rank,
      total: subjectInfo.rating.total,
      score: subjectInfo.rating.score,
    }
  }

  if (!anime.name_cn)
    anime.name_cn = `${subjectInfo.name}`
  if (!anime.name_phantom)
    anime.name_phantom = `${subjectInfo.name_cn}`
  // Bangumi quirk: subjects WITH SP episodes store the regular-episode count
  // in `eps` and the full count in `total_episodes`; subjects WITHOUT SPs
  // often have eps=0 and only total_episodes populated.
  if (!anime.total_episodes)
    anime.total_episodes = subjectInfo.eps === 0 ? subjectInfo.total_episodes : Math.min(subjectInfo.eps, subjectInfo.total_episodes)

  return anime
}
