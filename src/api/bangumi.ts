import type { AxiosInstance } from 'axios'
import type { IEpisode } from '#root/types/response.js'
import type { BangumiSubject } from './schemas.js'
import { makeClient, toApiError, withRetry } from './http.js'
import { BangumiEpisodeListSchema, BangumiSubjectSchema } from './schemas.js'

const BANGUMI_BASE_URL = 'https://api.bgm.tv'

// https://github.com/bangumi/api — identify the client per their guidelines
const defaultClient = makeClient(BANGUMI_BASE_URL, {
  headers: { 'User-Agent': 'flynncao/afanime (https://github.com/flynncao/afanime)' },
})

export async function getSubject(subjectID: number, client: AxiosInstance = defaultClient): Promise<BangumiSubject> {
  const res = await withRetry(() => client.get(`/v0/subjects/${subjectID}`))
    .catch((error) => {
      throw toApiError('Bangumi', error)
    })
  return BangumiSubjectSchema.parse(res.data)
}

/** Regular episodes only (type=0 excludes SPs); empty array when unaired. */
export async function getEpisodes(subjectID: number, client: AxiosInstance = defaultClient): Promise<IEpisode[]> {
  const res = await withRetry(() => client.get('/v0/episodes', {
    params: { subject_id: subjectID, type: 0, limit: 100, offset: 0 },
  })).catch((error) => {
    throw toApiError('Bangumi', error)
  })
  const parsed = BangumiEpisodeListSchema.parse(res.data)
  return parsed.data.map(item => ({
    id: item.id,
    name: item.name,
    name_cn: item.name_cn,
    videoLink: '',
    pushed: false,
  }))
}
