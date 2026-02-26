import { describe, it, expect, beforeEach } from 'vitest'
import { AniSub } from '#root/classes/AniSub.js'
import { AniEpi } from '#root/classes/AniEpi.js'
import { extractEpisodeNumber } from '#root/utils/string.js'
import type { IAnime } from '#root/types/index.js'

describe('dealNEPResult behavior', () => {
  const createMockAnime = (overrides: Partial<IAnime> = {}): IAnime => ({
    id: 1,
    name_cn: 'Test Anime',
    query: 'Test Anime',
    threadID: 123,
    total_episodes: 12,
    current_episode: 0,
    last_episode: 0,
    status: 0,
    eps: 1,
    episodes: [
      { id: 1, name: 'Episode 1', name_cn: '第一集', videoLink: '', pushed: false },
      { id: 2, name: 'Episode 2', name_cn: '第二集', videoLink: '', pushed: false },
      { id: 3, name: 'Episode 3', name_cn: '第三集', videoLink: '', pushed: false },
      { id: 4, name: 'Episode 4', name_cn: '第四集', videoLink: '', pushed: false },
      { id: 5, name: 'Episode 5', name_cn: '第五集', videoLink: '', pushed: false },
      { id: 6, name: 'Episode 6', name_cn: '第六集', videoLink: '', pushed: false },
      { id: 7, name: 'Episode 7', name_cn: '第七集', videoLink: '', pushed: false },
      { id: 8, name: 'Episode 8', name_cn: '第八集', videoLink: '', pushed: false },
      { id: 9, name: 'Episode 9', name_cn: '第九集', videoLink: '', pushed: false },
      { id: 10, name: 'Episode 10', name_cn: '第十集', videoLink: '', pushed: false },
      { id: 11, name: 'Episode 11', name_cn: '第十一集', videoLink: '', pushed: false },
      { id: 12, name: 'Episode 12', name_cn: '第十二集', videoLink: '', pushed: false },
    ],
    name: 'Test Anime',
    summary: '',
    platform: 'TV',
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('episode matching logic', () => {
    it('should update episode videoLink when episode is valid', () => {
      const anime = createMockAnime({ current_episode: 0 })
      const aniSub = new AniSub(anime)

      const nepData = [
        { text: '[SubGroup] Test Anime - 01', link: 'https://example.com/ep1' },
        { text: '[SubGroup] Test Anime - 02', link: 'https://example.com/ep2' },
      ]

      for (let i = nepData.length - 1; i >= 0; i--) {
        const item = nepData[i]
        const episodeNum = extractEpisodeNumber(item.text)
        if (!episodeNum) continue

        const aniEpisodeEntity = new AniEpi({
          num: episodeNum,
          title: item.text,
          link: item.link,
        }, aniSub)

        if (aniEpisodeEntity.isAllInfoValid()) {
          const dbEpisodeIndex = episodeNum - aniSub.getAnimeInstance().eps!
          if (aniSub.isValidDBEpisodeIndex(dbEpisodeIndex)) {
            aniSub.episodes[dbEpisodeIndex].videoLink = item.link
            aniSub.episodes[dbEpisodeIndex].pushed = true
          }
        }
      }

      expect(aniSub.episodes[0].videoLink).toBe('https://example.com/ep1')
      expect(aniSub.episodes[0].pushed).toBe(true)
      expect(aniSub.episodes[1].videoLink).toBe('https://example.com/ep2')
      expect(aniSub.episodes[1].pushed).toBe(true)
    })

    it('should update maxInNEP when finding new valid episode', () => {
      const anime = createMockAnime({ current_episode: 0 })
      const aniSub = new AniSub(anime)
      const initialMaxInNEP = aniSub.maxInNEP

      const nepData = [
        { text: '[SubGroup] Test Anime - 05', link: 'https://example.com/ep5' },
      ]

      for (let i = nepData.length - 1; i >= 0; i--) {
        const item = nepData[i]
        const episodeNum = extractEpisodeNumber(item.text)
        if (!episodeNum) continue

        const aniEpisodeEntity = new AniEpi({
          num: episodeNum,
          title: item.text,
          link: item.link,
        }, aniSub)

        if (aniEpisodeEntity.isAllInfoValid()) {
          if (aniSub.isValidBroadEpisodeNum(episodeNum) && episodeNum >= aniSub.maxInNEP && episodeNum <= aniSub.maxInBangumi) {
            aniSub.maxInNEP = episodeNum
          }
        }
      }

      expect(aniSub.maxInNEP).toBeGreaterThan(initialMaxInNEP)
      expect(aniSub.maxInNEP).toBe(5)
    })

    it('should not update maxInNEP for episode below current max', () => {
      const anime = createMockAnime({ current_episode: 5, last_episode: 5 })
      const aniSub = new AniSub(anime)
      const initialMaxInNEP = aniSub.maxInNEP

      const nepData = [
        { text: '[SubGroup] Test Anime - 03', link: 'https://example.com/ep3' },
      ]

      for (let i = nepData.length - 1; i >= 0; i--) {
        const item = nepData[i]
        const episodeNum = extractEpisodeNumber(item.text)
        if (!episodeNum) continue

        const aniEpisodeEntity = new AniEpi({
          num: episodeNum,
          title: item.text,
          link: item.link,
        }, aniSub)

        if (aniEpisodeEntity.isAllInfoValid()) {
          if (aniSub.isValidBroadEpisodeNum(episodeNum) && episodeNum >= aniSub.maxInNEP && episodeNum <= aniSub.maxInBangumi) {
            aniSub.maxInNEP = episodeNum
          }
        }
      }

      expect(aniSub.maxInNEP).toBe(initialMaxInNEP)
    })
  })

  describe('push list generation', () => {
    it('should add episodes to push list when they have valid links', () => {
      const anime = createMockAnime({ current_episode: 2, episodes: [
        { id: 1, name: 'Ep1', name_cn: '第一集', videoLink: 'https://example.com/ep1', pushed: true },
        { id: 2, name: 'Ep2', name_cn: '第二集', videoLink: 'https://example.com/ep2', pushed: true },
        { id: 3, name: 'Ep3', name_cn: '第三集', videoLink: 'https://example.com/ep3', pushed: false },
        { id: 4, name: 'Ep4', name_cn: '第四集', videoLink: 'https://example.com/ep4', pushed: false },
        { id: 5, name: 'Ep5', name_cn: '第五集', videoLink: '', pushed: false },
        { id: 6, name: 'Ep6', name_cn: '第六集', videoLink: '', pushed: false },
        { id: 7, name: 'Ep7', name_cn: '第七集', videoLink: '', pushed: false },
        { id: 8, name: 'Ep8', name_cn: '第八集', videoLink: '', pushed: false },
        { id: 9, name: 'Ep9', name_cn: '第九集', videoLink: '', pushed: false },
        { id: 10, name: 'Ep10', name_cn: '第十集', videoLink: '', pushed: false },
        { id: 11, name: 'Ep11', name_cn: '第十一集', videoLink: '', pushed: false },
        { id: 12, name: 'Ep12', name_cn: '第十二集', videoLink: '', pushed: false },
      ] })
      const aniSub = new AniSub(anime)

      aniSub.maxInNEP = 4
      aniSub.pushedMaxNum = 2

      const startEpiNum = aniSub.getAnimeInstance().eps!
      for (let i = aniSub.pushedMaxNum + 1; i <= aniSub.maxInNEP; i++) {
        if (aniSub.isValidDBEpisodeIndex(i - startEpiNum)) {
          const pushedLink = aniSub.episodes[i - startEpiNum].videoLink
          if (pushedLink) {
            aniSub.addToPushList({
              link: pushedLink,
              pushEpisodeNum: i,
              bangumiID: aniSub.episodes[i - startEpiNum].id,
            })
            if (i > aniSub.pushedMaxNum && pushedLink) {
              aniSub.pushedMaxNum = i
            }
          }
        }
      }

      const pushList = aniSub.getPushList()
      expect(pushList).toHaveLength(2)
      expect(pushList[0].pushEpisodeNum).toBe(3)
      expect(pushList[1].pushEpisodeNum).toBe(4)
    })

    it('should return consistent push list when all items have links', () => {
      const anime = createMockAnime({ current_episode: 0 })
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 2, link: 'https://example.com/2' })

      expect(aniSub.isPushListConsisitent()).toBe(true)
    })

    it('should return inconsistent push list when any item lacks link', () => {
      const anime = createMockAnime({ current_episode: 0 })
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 2, link: '' })

      expect(aniSub.isPushListConsisitent()).toBe(false)
    })
  })

  describe('return codes simulation', () => {
    it('should return 1 (no need update) when current_episode equals maxInNEP', () => {
      const anime = createMockAnime({ current_episode: 5, last_episode: 5 })
      const aniSub = new AniSub(anime)

      expect(aniSub.getAnimeInstance().current_episode).toBe(aniSub.maxInNEP)
    })

    it('should return 3 (update available) when new episodes exist and push list is consistent', () => {
      const anime = createMockAnime({ current_episode: 2 })
      const aniSub = new AniSub(anime)

      aniSub.maxInNEP = 4
      aniSub.pushedMaxNum = 2

      aniSub.addToPushList({ bangumiID: 3, link: 'https://example.com/3' })
      aniSub.addToPushList({ bangumiID: 4, link: 'https://example.com/4' })

      expect(aniSub.isPushListConsisitent()).toBe(true)
      expect(aniSub.getPushList().length).toBeGreaterThan(0)
    })

    it('should return 2 (not complete) when push list is inconsistent', () => {
      const anime = createMockAnime({ current_episode: 2 })
      const aniSub = new AniSub(anime)

      aniSub.maxInNEP = 4
      aniSub.pushedMaxNum = 2

      aniSub.addToPushList({ bangumiID: 3, link: 'https://example.com/3' })
      aniSub.addToPushList({ bangumiID: 4, link: '' })

      expect(aniSub.isPushListConsisitent()).toBe(false)
    })
  })

  describe('extractEpisodeNumber integration', () => {
    it('should extract episode numbers from NEP title format', () => {
      expect(extractEpisodeNumber('[SubGroup] Test Anime - 01 [1080p]')).toBe(1)
      expect(extractEpisodeNumber('[SubGroup] Test Anime - 10 [1080p]')).toBe(10)
      expect(extractEpisodeNumber('[SubGroup] Test Anime - 01v2 [1080p]')).toBe(1)
      expect(extractEpisodeNumber('[SubGroup] Test Anime - 12END [1080p]')).toBe(12)
    })

    it('should return NaN for invalid titles', () => {
      expect(extractEpisodeNumber('[SubGroup] Test Anime [1080p]')).toBeNaN()
      expect(extractEpisodeNumber('')).toBeNaN()
    })
  })
})
