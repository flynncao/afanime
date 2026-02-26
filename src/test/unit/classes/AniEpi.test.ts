import { describe, it, expect, beforeEach } from 'vitest'
import { AniEpi } from '#root/classes/AniEpi.js'
import { AniSub } from '#root/classes/AniSub.js'
import type { IAnime } from '#root/types/index.js'

// Mock config for translator blacklist
vi.mock('#root/config/index.js', () => ({
  config: {
    translatorBlacklist: ['BadSub'],
  },
}))

describe('AniEpi', () => {
  const mockAnime: IAnime = {
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
  }

  let aniSub: AniSub

  beforeEach(() => {
    aniSub = new AniSub(mockAnime)
  })

  describe('constructor', () => {
    it('should create AniEpi instance with valid data', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect(aniEpi).toBeInstanceOf(AniEpi)
    })
  })

  describe('isAllInfoValid', () => {
    it('should return true for valid episode', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect(aniEpi.isAllInfoValid()).toBe(true)
    })

    it('should return false for episode with invalid number', () => {
      const aniEpi = new AniEpi({
        num: 99, // Way out of range - episode at index 98 doesn't exist
        title: '[SubGroup] Test Anime - 99',
        link: 'https://example.com/video',
      }, aniSub)

      // isValidEpisode returns undefined when episode name doesn't exist
      // isValidNum also returns false for out-of-range numbers
      // isAllInfoValid uses && so any falsy value makes it return falsy (undefined or false)
      expect(aniEpi.isAllInfoValid()).toBeFalsy()
    })

    it('should return false for episode with empty link', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: '',
      }, aniSub)

      expect(aniEpi.isAllInfoValid()).toBe(false)
    })

    it('should return false for episode with title not matching phantom name', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Wrong Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect(aniEpi.isAllInfoValid()).toBe(false)
    })

    it('should return false for episode from blacklisted translator', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[BadSub] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect(aniEpi.isAllInfoValid()).toBe(false)
    })
  })

  describe('isValidTitle', () => {
    it('should return true when title contains phantom name', () => {
      const animeWithPhantom: IAnime = {
        ...mockAnime,
        name_phantom: 'Test|Anime',
      }
      const aniSubWithPhantom = new AniSub(animeWithPhantom)
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSubWithPhantom)

      // Access private method via any cast for testing
      expect((aniEpi as any).isValidTitle()).toBe(true)
    })

    it('should return true when title contains name_cn without phantom', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidTitle()).toBe(true)
    })

    it('should handle comma-separated phantom names', () => {
      const animeWithCommaPhantom: IAnime = {
        ...mockAnime,
        name_phantom: 'Test,Anime',
      }
      const aniSubWithComma = new AniSub(animeWithCommaPhantom)
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSubWithComma)

      expect((aniEpi as any).isValidTitle()).toBe(true)
    })

    it('should return false when title does not contain phantom name', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Different Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidTitle()).toBe(false)
    })
  })

  describe('isValidEpisode', () => {
    it('should return episode name for valid episode number', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      // The implementation returns the episode name, not boolean
      expect((aniEpi as any).isValidEpisode()).toBe('Episode 1')
    })

    it('should return undefined for episode number out of range', () => {
      const aniEpi = new AniEpi({
        num: 15,
        title: '[SubGroup] Test Anime - 15',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidEpisode()).toBeUndefined()
    })

    it('should return undefined when episodes array is empty', () => {
      const animeNoEpisodes: IAnime = {
        ...mockAnime,
        episodes: [],
      }
      const aniSubNoEpisodes = new AniSub(animeNoEpisodes)
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSubNoEpisodes)

      expect((aniEpi as any).isValidEpisode()).toBeUndefined()
    })
  })

  describe('isValidNum', () => {
    it('should return true for valid episode number in range', () => {
      const aniEpi = new AniEpi({
        num: 5,
        title: '[SubGroup] Test Anime - 05',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidNum()).toBe(true)
    })

    it('should return false for episode number below start', () => {
      const aniEpi = new AniEpi({
        num: 0,
        title: '[SubGroup] Test Anime - 00',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidNum()).toBe(false)
    })

    it('should return false for episode number above max', () => {
      const aniEpi = new AniEpi({
        num: 20,
        title: '[SubGroup] Test Anime - 20',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidNum()).toBe(false)
    })
  })

  describe('isValidLink', () => {
    it('should return true for valid link', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: 'https://example.com/video',
      }, aniSub)

      expect((aniEpi as any).isValidLink()).toBe(true)
    })

    it('should return false for empty link', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: '',
      }, aniSub)

      expect((aniEpi as any).isValidLink()).toBe(false)
    })

    it('should return false for null link', () => {
      const aniEpi = new AniEpi({
        num: 1,
        title: '[SubGroup] Test Anime - 01',
        link: null as any,
      }, aniSub)

      expect((aniEpi as any).isValidLink()).toBe(false)
    })
  })

  describe('getTitle', () => {
    it('should return the episode title', () => {
      const title = '[SubGroup] Test Anime - 01'
      const aniEpi = new AniEpi({
        num: 1,
        title,
        link: 'https://example.com/video',
      }, aniSub)

      expect(aniEpi.getTitle()).toBe(title)
    })
  })
})
