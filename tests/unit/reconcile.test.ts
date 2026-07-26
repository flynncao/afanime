import type { IAnime } from '#root/types/index.js'
import { describe, expect, it } from 'vitest'
import { AniSub } from '#root/classes/AniSub.js'
import { dealNEPResult, RECONCILE } from '#root/core/reconcile.js'

/**
 * These tests call the REAL dealNEPResult (previously module-private; the
 * old branch test duplicated its loop body inline and could never fail).
 */

function makeAnime(overrides: Partial<IAnime> = {}): IAnime {
  return {
    id: 1,
    name_cn: '孤独摇滚',
    name_phantom: '孤独摇滚 | 1080P',
    query: '孤独摇滚',
    threadID: 123,
    total_episodes: 12,
    current_episode: 10,
    last_episode: 10,
    status: 1,
    eps: 1,
    name: 'ぼっち・ざ・ろっく！',
    summary: '',
    platform: 'TV',
    episodes: Array.from({ length: 12 }, (_, i) => ({
      id: 1000 + i,
      name: `Episode ${i + 1}`,
      name_cn: `第${i + 1}集`,
      videoLink: i < 10 ? `https://t.me/nep/${i + 1}` : '',
      pushed: i < 10,
    })),
    ...overrides,
  }
}

function feedItem(num: number) {
  return {
    text: `孤独摇滚! ${String(num).padStart(2, '0')} | 1080P | CHS | MP4`,
    link: `https://t.me/nep/${num}`,
  }
}

describe('dealNEPResult', () => {
  it('returns UP_TO_DATE when the feed brings nothing new', () => {
    const anime = makeAnime({ current_episode: 10 })
    const subject = new AniSub(anime)
    const code = dealNEPResult({ data: [feedItem(10)] }, subject)
    expect(code).toBe(RECONCILE.UP_TO_DATE)
    expect(subject.getPushList()).toEqual([])
  })

  it('collects newly available episodes into the push list', () => {
    const anime = makeAnime({ current_episode: 10 })
    const subject = new AniSub(anime)
    const code = dealNEPResult({ data: [feedItem(11), feedItem(12)] }, subject)
    expect(code).toBe(RECONCILE.PUSH)
    expect(subject.getPushList().map((item: any) => item.pushEpisodeNum)).toEqual([11, 12])
    expect(subject.pushedMaxNum).toBe(12)
    expect(subject.maxInNEP).toBe(12)
    expect(anime.episodes![10].videoLink).toBe('https://t.me/nep/11')
    expect(anime.episodes![10].pushed).toBe(true)
  })

  it('skips a gap and pushes only linked episodes', () => {
    const anime = makeAnime({ current_episode: 10 })
    const subject = new AniSub(anime)
    // feed only has episode 12; episode 11 never appeared
    const code = dealNEPResult({ data: [feedItem(12)] }, subject)
    expect(code).toBe(RECONCILE.PUSH)
    expect(subject.getPushList().map((item: any) => item.pushEpisodeNum)).toEqual([12])
  })

  it('ignores feed items whose title does not match the phantom pattern', () => {
    const anime = makeAnime({ current_episode: 10 })
    const subject = new AniSub(anime)
    // 720P does not satisfy the 1080P pattern component
    const code = dealNEPResult({
      data: [{ text: '某科学的超电磁炮 11 | 720P | CHS', link: 'https://t.me/nep/other' }],
    }, subject)
    expect(code).toBe(RECONCILE.UP_TO_DATE)
    expect(anime.episodes![10].videoLink).toBe('')
  })

  it('kNOWN WEAKNESS: CJK pattern components normalize to empty and match anything', () => {
    // normalizedAnimeTitle strips all CJK, so a pure-Chinese phantom like
    // 孤独摇滚 constrains nothing — only Latin tokens (1080P, CHS, group
    // names) actually discriminate. A wrong anime with matching Latin
    // tokens IS accepted; this documents the current matcher behavior.
    const anime = makeAnime({ current_episode: 10 })
    const subject = new AniSub(anime)
    const code = dealNEPResult({
      data: [{ text: '某科学的超电磁炮 11 | 1080P | CHS | MP4', link: 'https://t.me/nep/wrong-anime' }],
    }, subject)
    expect(code).toBe(RECONCILE.PUSH)
    expect(anime.episodes![10].videoLink).toBe('https://t.me/nep/wrong-anime')
  })

  it('ignores feed items beyond the Bangumi episode range', () => {
    const anime = makeAnime({ current_episode: 12, total_episodes: 12 })
    anime.episodes!.forEach((ep, i) => {
      ep.videoLink = `https://t.me/nep/${i + 1}`
    })
    const subject = new AniSub(anime)
    const code = dealNEPResult({ data: [feedItem(13)] }, subject)
    expect(code).toBe(RECONCILE.UP_TO_DATE)
  })

  it('returns ERROR on a malformed feed payload', () => {
    const subject = new AniSub(makeAnime())
    expect(dealNEPResult({ data: null }, subject)).toBe(RECONCILE.ERROR)
    expect(dealNEPResult(undefined, subject)).toBe(RECONCILE.ERROR)
  })
})
