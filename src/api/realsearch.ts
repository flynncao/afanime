import type { AxiosInstance } from 'axios'
import type { NepResult, Schedule } from './schemas.js'
import { getConfig } from '#root/config/index.js'
import { makeClient, toApiError, withRetry } from './http.js'
import { NepResultSchema, ScheduleSchema } from './schemas.js'

let defaultClient: AxiosInstance | undefined

function client(): AxiosInstance {
  defaultClient ??= makeClient(getConfig().realSearchAPI.uri)
  return defaultClient
}

export async function searchNep(word: string, page = 0, override?: AxiosInstance): Promise<NepResult> {
  const res = await withRetry(() => (override ?? client()).get('/api/', {
    params: { cid: 0, page, limit: 24, word, sort: 'time' },
  })).catch((error) => {
    throw toApiError('RealSearch', error)
  })
  return NepResultSchema.parse(res.data)
}

export async function getSchedule(override?: AxiosInstance): Promise<Schedule> {
  const res = await withRetry(() => (override ?? client()).get('/api/public/schedule/v2', {
    params: { rule_id: 5 },
  })).catch((error) => {
    throw toApiError('RealSearch', error)
  })
  return ScheduleSchema.parse(res.data)
}
