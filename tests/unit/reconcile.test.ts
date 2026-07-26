import type { IAnime } from '#root/types/index.js'
import { describe, expect, it } from 'vitest'
import { reconcile } from '#root/core/reconcile.js'

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

describe('reconcile', () => {
  it('returns up-to-date when the feed brings nothing new', () => {
    const anime = makeAnime({ current_episode: 10 })
    const result = reconcile(anime, [feedItem(10)])
    expect(result.status).toBe('up-to-date')
    expect(result.pushList).toEqual([])
  })

  it('collects newly available episodes into the push list, oldest first', () => {
    const anime = makeAnime({ current_episode: 10 })
    const result = reconcile(anime, [feedItem(12), feedItem(11)])
    expect(result.status).toBe('advanced')
    expect(result.pushList.map(item => item.pushEpisodeNum)).toEqual([11, 12])
    expect(result.pushedMaxNum).toBe(12)
    expect(result.maxInNEP).toBe(12)
    expect(anime.episodes![10].videoLink).toBe('https://t.me/nep/11')
    expect(anime.episodes![10].pushed).toBe(true)
  })

  it('skips a gap and pushes only linked episodes', () => {
    const anime = makeAnime({ current_episode: 10 })
    // feed only has episode 12; episode 11 never appeared
    const result = reconcile(anime, [feedItem(12)])
    expect(result.status).toBe('advanced')
    expect(result.pushList.map(item => item.pushEpisodeNum)).toEqual([12])
  })

  it('ignores feed items whose title does not match the phantom pattern', () => {
    const anime = makeAnime({ current_episode: 10 })
    // 720P does not satisfy the 1080P pattern component
    const result = reconcile(anime, [{ text: '某科学的超电磁炮 11 | 720P | CHS', link: 'https://t.me/nep/other' }])
    expect(result.status).toBe('up-to-date')
    expect(anime.episodes![10].videoLink).toBe('')
  })

  it('kNOWN WEAKNESS: CJK pattern components normalize to empty and match anything', () => {
    // normalizedAnimeTitle strips all CJK, so a pure-Chinese phantom like
    // 孤独摇滚 constrains nothing — only Latin tokens (1080P, CHS, group
    // names) actually discriminate. A wrong anime with matching Latin
    // tokens IS accepted; this documents the current matcher behavior.
    const anime = makeAnime({ current_episode: 10 })
    const result = reconcile(anime, [{ text: '某科学的超电磁炮 11 | 1080P | CHS | MP4', link: 'https://t.me/nep/wrong-anime' }])
    expect(result.status).toBe('advanced')
    expect(anime.episodes![10].videoLink).toBe('https://t.me/nep/wrong-anime')
  })

  it('respects the translator blacklist', () => {
    const anime = makeAnime({ current_episode: 10 })
    const result = reconcile(anime, [feedItem(11)], ['CHS'])
    expect(result.status).toBe('up-to-date')
    expect(anime.episodes![10].videoLink).toBe('')
  })

  it('ignores feed items beyond the Bangumi episode range', () => {
    const anime = makeAnime({ current_episode: 12, total_episodes: 12 })
    anime.episodes!.forEach((episode, i) => {
      episode.videoLink = `https://t.me/nep/${i + 1}`
    })
    const result = reconcile(anime, [feedItem(13)])
    expect(result.status).toBe('up-to-date')
  })

  it('handles an anime with a non-1 start episode', () => {
    // e.g. season 2 continuing at episode 13
    const anime = makeAnime({
      eps: 13,
      current_episode: 13,
      total_episodes: 12,
      episodes: Array.from({ length: 12 }, (_, i) => ({
        id: 2000 + i,
        name: `Episode ${i + 13}`,
        name_cn: `第${i + 13}集`,
        videoLink: i < 1 ? 'https://t.me/nep/13' : '',
        pushed: i < 1,
      })),
    })
    const result = reconcile(anime, [feedItem(14)])
    expect(result.status).toBe('advanced')
    expect(result.pushList.map(item => item.pushEpisodeNum)).toEqual([14])
    expect(result.pushList[0].bangumiID).toBe(2001)
  })
})
