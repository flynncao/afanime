import type { AxiosRequestConfig } from 'axios'
import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { getEpisodes, getSubject } from '#root/api/bangumi.js'
import { ApiError, makeClient } from '#root/api/http.js'
import episodesEmpty from '../fixtures/bangumi/episodes-empty.json'
import episodesWithSp from '../fixtures/bangumi/episodes-with-sp.json'
import subjectNormal from '../fixtures/bangumi/subject-normal.json'
import subjectWithSp from '../fixtures/bangumi/subject-with-sp.json'

function fixtureAdapter(fixture: unknown) {
  return async (config: AxiosRequestConfig) => ({
    data: fixture,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as any,
  })
}

function failingAdapter(status: number, failures = Number.POSITIVE_INFINITY, fixture: unknown = {}) {
  let calls = 0
  const adapter = async (config: AxiosRequestConfig) => {
    calls++
    if (calls <= failures) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_RESPONSE,
        { headers: new AxiosHeaders(), ...config } as any,
        null,
        { status, statusText: 'ERR', data: { error: 'boom' }, headers: {}, config: config as any },
      )
    }
    return { data: fixture, status: 200, statusText: 'OK', headers: {}, config: config as any }
  }
  return { adapter, callCount: () => calls }
}

const stubClient = (fixture: unknown) => makeClient('https://bangumi.test', { adapter: fixtureAdapter(fixture) })

describe('getSubject', () => {
  it('parses a recorded real subject payload', async () => {
    const subject = await getSubject(100444, stubClient(subjectNormal))
    expect(subject.name_cn).toBe('四月是你的谎言')
    expect(subject.eps).toBe(22)
    expect(subject.total_episodes).toBe(22)
    expect(subject.images?.common).toContain('https://')
  })

  it('fails loudly with the offending path when the payload shape drifts', async () => {
    const broken = { ...subjectNormal, eps: 'twelve' }
    const error = await getSubject(1, stubClient(broken)).catch(e => e)
    expect(error).toBeInstanceOf(ZodError)
    expect(JSON.stringify(error.issues)).toContain('eps')
  })

  it('retries on 5xx and succeeds when the server recovers', async () => {
    const { adapter, callCount } = failingAdapter(503, 2, subjectWithSp)
    const client = makeClient('https://bangumi.test', { adapter })
    const subject = await getSubject(404809, client)
    expect(subject.eps).toBe(12)
    expect(callCount()).toBe(3)
  })

  it('throws an ApiError carrying status and body after retries are exhausted', async () => {
    const { adapter, callCount } = failingAdapter(500)
    const client = makeClient('https://bangumi.test', { adapter })
    const error = await getSubject(1, client).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.body).toEqual({ error: 'boom' })
    expect(callCount()).toBe(3) // initial + 2 retries
  })

  it('does not retry client errors', async () => {
    const { adapter, callCount } = failingAdapter(404)
    const client = makeClient('https://bangumi.test', { adapter })
    const error = await getSubject(1, client).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(callCount()).toBe(1)
  })
})

describe('getEpisodes', () => {
  it('maps a recorded real episode list into local episode records', async () => {
    const episodes = await getEpisodes(404809, stubClient(episodesWithSp))
    expect(episodes.length).toBeGreaterThan(0)
    expect(episodes[0]).toMatchObject({ videoLink: '', pushed: false })
    expect(typeof episodes[0].id).toBe('number')
    expect(typeof episodes[0].name).toBe('string')
  })

  it('returns an empty array for an unaired subject (recorded envelope)', async () => {
    const episodes = await getEpisodes(520011, stubClient(episodesEmpty))
    expect(episodes).toEqual([])
  })
})
