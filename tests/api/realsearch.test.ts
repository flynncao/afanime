import type { AxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { makeClient } from '#root/api/http.js'
import { getSchedule, searchNep } from '#root/api/realsearch.js'
import nepSearch from '../fixtures/realsearch/nep-search.json'
import schedule from '../fixtures/realsearch/schedule.json'

function fixtureAdapter(fixture: unknown) {
  return async (config: AxiosRequestConfig) => ({
    data: fixture,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as any,
  })
}

const stubClient = (fixture: unknown) => makeClient('https://realsearch.test', { adapter: fixtureAdapter(fixture) })

describe('searchNep', () => {
  it('parses a recorded real NEP search result', async () => {
    const result = await searchNep('孤独摇滚', 0, stubClient(nepSearch))
    expect(result.code).toBe(0)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].text).toContain('孤独摇滚')
    expect(result.data[0].link).toMatch(/^https:\/\/t\.me\//)
  })

  it('fails loudly when a consumed field goes missing (endpoint drift)', async () => {
    const drifted = { code: 0, data: [{ text: 'x 12 | 1080P', url: 'renamed-link-field' }] }
    const error = await searchNep('x', 0, stubClient(drifted)).catch(e => e)
    expect(error).toBeInstanceOf(ZodError)
    expect(JSON.stringify(error.issues)).toContain('link')
  })
})

describe('getSchedule', () => {
  it('parses a recorded real schedule payload', async () => {
    const result = await getSchedule(stubClient(schedule))
    expect(result.data.length).toBeGreaterThan(0)
    const item = result.data[0]
    expect(typeof item.name_cn).toBe('string')
    expect(typeof item.status).toBe('string')
    expect(typeof item.date_start).toBe('number')
  })
})
