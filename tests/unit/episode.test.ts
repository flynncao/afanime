import { describe, expect, it } from 'vitest'
import { extractEpisodeNumber, normalizedAnimeTitle, titleMatches } from '#root/core/episode.js'

describe('extractEpisodeNumber', () => {
  it('should extract episode number from standard format', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime - 01 [1080p]')).toBe(1)
    expect(extractEpisodeNumber('[SubGroup] Anime - 02 [1080p]')).toBe(2)
  })

  it('should extract episode number from a real NEP feed title', () => {
    expect(extractEpisodeNumber('北宇治字幕组 Bocchi the Rock! 孤独摇滚 #bocchirock 孤独摇滚! 12 | HEVC_AAC | CHS | MP4')).toBe(12)
  })

  it('should extract episode number with v2 suffix', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime - 01v2 [1080p]')).toBe(1)
    expect(extractEpisodeNumber('[SubGroup] Anime - 05v2 [1080p]')).toBe(5)
  })

  it('should extract episode number with END suffix', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime - 12END [1080p]')).toBe(12)
    expect(extractEpisodeNumber('[SubGroup] Anime - 24END [1080p]')).toBe(24)
  })

  // Note: The implementation regex only handles 01v2, not 01v2END combined
  it('should return NaN for combined v2END suffix (implementation limitation)', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime - 01v2END [1080p]')).toBeNaN()
  })

  it('should return NaN when no episode number found', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime [1080p]')).toBeNaN()
    expect(extractEpisodeNumber('')).toBeNaN()
    expect(extractEpisodeNumber('no numbers here')).toBeNaN()
  })

  // Note: The implementation requires 2-digit numbers (\d{2}), so single digits return NaN
  it('should return NaN for single digit episode numbers (implementation limitation)', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime - 1 [1080p]')).toBeNaN()
    expect(extractEpisodeNumber('[SubGroup] Anime - 5 [1080p]')).toBeNaN()
  })

  it('should handle double digit episode numbers', () => {
    expect(extractEpisodeNumber('[SubGroup] Anime - 10 [1080p]')).toBe(10)
    expect(extractEpisodeNumber('[SubGroup] Anime - 24 [1080p]')).toBe(24)
  })
})

describe('normalizedAnimeTitle', () => {
  it('should remove spaces and fullwidth brackets', () => {
    expect(normalizedAnimeTitle('[SubGroup] Anime Title')).toBe('[SubGroup]AnimeTitle')
    expect(normalizedAnimeTitle('【Anime】Title')).toBe('AnimeTitle')
  })

  it('should remove spaces', () => {
    expect(normalizedAnimeTitle('Anime Title')).toBe('AnimeTitle')
    expect(normalizedAnimeTitle('A n i m e')).toBe('Anime')
  })

  it('should remove dots and slashes but keep ASCII hyphen', () => {
    expect(normalizedAnimeTitle('Anime-Title')).toBe('Anime-Title')
    expect(normalizedAnimeTitle('Anime.Title')).toBe('AnimeTitle')
    expect(normalizedAnimeTitle('Anime/Title')).toBe('AnimeTitle')
    expect(normalizedAnimeTitle('Anime\\Title')).toBe('AnimeTitle')
  })

  it('should keep digits and Latin characters', () => {
    expect(normalizedAnimeTitle('Anime123')).toBe('Anime123')
    expect(normalizedAnimeTitle('[SubGroup]')).toBe('[SubGroup]')
    expect(normalizedAnimeTitle('')).toBe('')
  })

  // The regex character range .-（ unintentionally covers Japanese kana/CJK;
  // this documents actual behavior relied on by titleMatches.
  it('should remove Japanese characters due to regex range', () => {
    expect(normalizedAnimeTitle('アニメ')).toBe('')
    expect(normalizedAnimeTitle('東京')).toBe('')
  })
})

describe('titleMatches', () => {
  const realTitle = 'ANi 孤獨搖滾！ - 12 [1080P][Baha][WEB-DL][AAC AVC][CHT][MP4]'

  it('matches when every pipe-separated component is present', () => {
    expect(titleMatches(realTitle, 'ANi | 1080P | CHT')).toBe(true)
  })

  it('accepts comma-separated patterns', () => {
    expect(titleMatches(realTitle, 'ANi, 1080P, CHT')).toBe(true)
  })

  it('rejects when any component is missing', () => {
    expect(titleMatches(realTitle, 'ANi | 1080P | CHS')).toBe(false)
  })

  it('rejects titles containing a blacklisted translator', () => {
    expect(titleMatches(realTitle, 'ANi | 1080P', ['ANi'])).toBe(false)
    expect(titleMatches(realTitle, 'ANi | 1080P', ['SomeoneElse'])).toBe(true)
  })

  it('matches with an empty blacklist by default', () => {
    expect(titleMatches(realTitle, '1080P')).toBe(true)
  })
})
