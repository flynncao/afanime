import type { IAnime } from '#root/types/index.js'
import { LocalDate } from '@js-joda/core'
import { describe, expect, it } from 'vitest'
import { mergeSubjectIntoAnime } from '#root/core/subject-merge.js'
import { STATUS } from '#root/types/index.js'
import subjectEpsZero from '../fixtures/bangumi/subject-eps-zero.json'
import subjectNormal from '../fixtures/bangumi/subject-normal.json'
import subjectWithSp from '../fixtures/bangumi/subject-with-sp.json'

function makeAnime(overrides: Partial<IAnime> = {}): IAnime {
  return {
    id: 0,
    name_cn: '',
    query: '1',
    threadID: 123,
    total_episodes: 0,
    current_episode: 0,
    last_episode: 0,
    status: STATUS.ARCHIVED,
    name: '',
    summary: '',
    platform: 'TV',
    ...overrides,
  }
}

describe('mergeSubjectIntoAnime (recorded real API payloads)', () => {
  it('uses eps (regular episodes) when the subject has SP episodes', () => {
    // 末日列车去哪里？— eps=12 regular episodes, total_episodes=13 includes an SP
    const anime = mergeSubjectIntoAnime(makeAnime(), subjectWithSp as any)
    expect(subjectWithSp.eps).toBe(12)
    expect(subjectWithSp.total_episodes).toBe(13)
    expect(anime.total_episodes).toBe(12)
  })

  it('falls back to total_episodes when eps is 0', () => {
    const anime = mergeSubjectIntoAnime(makeAnime(), subjectEpsZero as any)
    expect(subjectEpsZero.eps).toBe(0)
    expect(anime.total_episodes).toBe(subjectEpsZero.total_episodes)
  })

  it('keeps an already-set total_episodes untouched', () => {
    const anime = mergeSubjectIntoAnime(makeAnime({ total_episodes: 22 }), subjectNormal as any)
    expect(anime.total_episodes).toBe(22)
  })

  it('replaces the "1" query placeholder with the Chinese name', () => {
    const anime = mergeSubjectIntoAnime(makeAnime({ query: '1' }), subjectNormal as any)
    expect(anime.query).toBe(subjectNormal.name_cn)
  })

  it('fills name_cn and name_phantom fallbacks', () => {
    const anime = mergeSubjectIntoAnime(makeAnime(), subjectWithSp as any)
    // historical behavior: empty name_cn falls back to the JAPANESE name,
    // while name_phantom falls back to the Chinese name
    expect(anime.name_cn).toBe(subjectWithSp.name)
    expect(anime.name_phantom).toBe(subjectWithSp.name_cn)
    expect(anime.name).toBe(subjectWithSp.name)
  })

  it('copies only mapped fields — no tags/infobox/collection pollution', () => {
    const anime = mergeSubjectIntoAnime(makeAnime(), subjectNormal as any)
    expect((anime as any).tags).toBeUndefined()
    expect((anime as any).infobox).toBeUndefined()
    expect((anime as any).collection).toBeUndefined()
    expect(anime.images?.common).toBe(subjectNormal.images.common)
    expect(anime.rating).toEqual({
      rank: subjectNormal.rating.rank,
      total: subjectNormal.rating.total,
      score: subjectNormal.rating.score,
    })
  })

  it('derives AIRED/UNAIRED status from the air date', () => {
    const aired = mergeSubjectIntoAnime(makeAnime({ status: STATUS.UNAIRED }), subjectNormal as any, LocalDate.parse('2026-07-26'))
    expect(aired.status).toBe(STATUS.AIRED)

    const unaired = mergeSubjectIntoAnime(makeAnime({ status: STATUS.ARCHIVED }), subjectNormal as any, LocalDate.parse('2010-01-01'))
    expect(unaired.status).toBe(STATUS.UNAIRED)
  })

  it('never demotes a COMPLETED anime', () => {
    const anime = mergeSubjectIntoAnime(makeAnime({ status: STATUS.COMPLETED }), subjectNormal as any, LocalDate.parse('2026-07-26'))
    expect(anime.status).toBe(STATUS.COMPLETED)
  })

  it('skips status derivation when no reference date is given', () => {
    const anime = mergeSubjectIntoAnime(makeAnime({ status: STATUS.ARCHIVED }), subjectNormal as any)
    expect(anime.status).toBe(STATUS.ARCHIVED)
  })
})
