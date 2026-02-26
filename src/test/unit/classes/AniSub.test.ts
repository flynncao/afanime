import { describe, it, expect, beforeEach } from 'vitest'
import { AniSub } from '#root/classes/AniSub.js'
import type { IAnime } from '#root/types/index.js'

describe('AniSub', () => {
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

  describe('constructor', () => {
    it('should create AniSub instance with valid anime', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub).toBeInstanceOf(AniSub)
      expect(aniSub.getAnimeInstance()).toBe(anime)
    })

    it('should initialize pushList as empty array', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub.getPushList()).toEqual([])
    })

    it('should initialize maxInNEP to max of valid episodes or pushedMaxNum', () => {
      const anime = createMockAnime({ current_episode: 5, episodes: [
        { id: 1, name: 'Ep1', name_cn: '第一集', videoLink: 'link1', pushed: true },
        { id: 2, name: 'Ep2', name_cn: '第二集', videoLink: 'link2', pushed: true },
        { id: 3, name: 'Ep3', name_cn: '第三集', videoLink: '', pushed: false },
      ] })
      const aniSub = new AniSub(anime)

      // maxInNEP should be 2 (two episodes with videoLink) or current_episode (5), whichever is larger
      expect(aniSub.maxInNEP).toBe(5)
    })

    it('should calculate maxInBangumi correctly', () => {
      const anime = createMockAnime({ eps: 1, total_episodes: 12 })
      const aniSub = new AniSub(anime)

      expect(aniSub.maxInBangumi).toBe(12) // 1 + 12 - 1
    })
  })

  describe('getAnimeInstance', () => {
    it('should return the anime instance', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub.getAnimeInstance()).toBe(anime)
    })
  })

  describe('getPushList', () => {
    it('should return the push list', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub.getPushList()).toEqual([])
    })
  })

  describe('emptyPushList', () => {
    it('should clear the push list', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)
      aniSub.addToPushList({ bangumiID: 1, link: 'test' })
      expect(aniSub.getPushList()).toHaveLength(1)

      aniSub.emptyPushList()
      expect(aniSub.getPushList()).toEqual([])
    })
  })

  describe('addToPushList', () => {
    it('should add new item to push list', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })

      expect(aniSub.getPushList()).toHaveLength(1)
      expect(aniSub.getPushList()[0].bangumiID).toBe(1)
    })

    it('should update existing item with same bangumiID', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/updated' })

      expect(aniSub.getPushList()).toHaveLength(1)
      expect(aniSub.getPushList()[0].link).toBe('https://example.com/updated')
    })

    it('should handle multiple different items', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 2, link: 'https://example.com/2' })
      aniSub.addToPushList({ bangumiID: 3, link: 'https://example.com/3' })

      expect(aniSub.getPushList()).toHaveLength(3)
    })
  })

  describe('isPushListConsistent', () => {
    it('should return true for empty push list', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub.isPushListConsisitent()).toBe(true)
    })

    it('should return true when all items have valid links', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 2, link: 'https://example.com/2' })

      expect(aniSub.isPushListConsisitent()).toBe(true)
    })

    it('should return false when any item has empty link', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 2, link: '' })

      expect(aniSub.isPushListConsisitent()).toBe(false)
    })

    it('should return false when any item has null link', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      aniSub.addToPushList({ bangumiID: 1, link: 'https://example.com/1' })
      aniSub.addToPushList({ bangumiID: 2, link: null as any })

      expect(aniSub.isPushListConsisitent()).toBe(false)
    })
  })

  describe('isValidDBEpisodeIndex', () => {
    it('should return true for valid index', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub.isValidDBEpisodeIndex(0)).toBe(true)
      expect(aniSub.isValidDBEpisodeIndex(5)).toBe(true)
      expect(aniSub.isValidDBEpisodeIndex(11)).toBe(true)
    })

    it('should return false for out of bounds index', () => {
      const anime = createMockAnime()
      const aniSub = new AniSub(anime)

      expect(aniSub.isValidDBEpisodeIndex(-1)).toBe(false)
      expect(aniSub.isValidDBEpisodeIndex(12)).toBe(false)
      expect(aniSub.isValidDBEpisodeIndex(100)).toBe(false)
    })
  })

  describe('isValidBroadEpisodeNum', () => {
    it('should return true for valid episode number in range', () => {
      const anime = createMockAnime({ eps: 1, total_episodes: 12 })
      const aniSub = new AniSub(anime)

      expect(aniSub.isValidBroadEpisodeNum(1)).toBe(true)
      expect(aniSub.isValidBroadEpisodeNum(6)).toBe(true)
      expect(aniSub.isValidBroadEpisodeNum(12)).toBe(true)
    })

    it('should return false for episode number below range', () => {
      const anime = createMockAnime({ eps: 1, total_episodes: 12 })
      const aniSub = new AniSub(anime)

      expect(aniSub.isValidBroadEpisodeNum(0)).toBe(false)
      expect(aniSub.isValidBroadEpisodeNum(-1)).toBe(false)
    })

    it('should return false for episode number above range', () => {
      const anime = createMockAnime({ eps: 1, total_episodes: 12 })
      const aniSub = new AniSub(anime)

      expect(aniSub.isValidBroadEpisodeNum(13)).toBe(false)
      expect(aniSub.isValidBroadEpisodeNum(100)).toBe(false)
    })

    it('should handle different start episode numbers', () => {
      const anime = createMockAnime({ eps: 0, total_episodes: 24 })
      const aniSub = new AniSub(anime)

      expect(aniSub.isValidBroadEpisodeNum(0)).toBe(true)
      expect(aniSub.isValidBroadEpisodeNum(12)).toBe(true)
      expect(aniSub.isValidBroadEpisodeNum(23)).toBe(true)
      expect(aniSub.isValidBroadEpisodeNum(-1)).toBe(false)
      expect(aniSub.isValidBroadEpisodeNum(24)).toBe(false)
    })
  })
})
