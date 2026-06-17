import { describe, expect, it, vi } from 'vitest'

import { ATRelation } from '../../../bot/thread.js'

// Mock the Anime model — thread.ts imports readAnimes from it at module load,
// which would otherwise trigger typegoose's getModelForClass and require a
// live mongoose connection.
vi.mock('#root/models/Anime.js', () => ({
  AnimeModel: {},
  readAnimes: vi.fn().mockResolvedValue([]),
  readSingleAnime: vi.fn(),
  createNewAnime: vi.fn(),
  updateSingleAnimeQuick: vi.fn(),
  updateCurrentEpisode: vi.fn(),
  deleteAnime: vi.fn(),
}))

describe('aTRelation.removeOne', () => {
  it('removes the matching relation by animeID', () => {
    const rel = ATRelation.getInstance()
    // Seed deterministic state for the test.
    rel.insertOne(1001, 11, 'Anime A')
    rel.insertOne(1002, 22, 'Anime B')

    const removed = rel.removeOne(1001)

    expect(removed).toBe(true)
    expect(rel.getThreadIDAndTitleFromID(1001)).toEqual({ threadID: 0, title: '' })
    // Other relation untouched.
    expect(rel.getThreadIDAndTitleFromID(1002)).toEqual({ threadID: 22, title: 'Anime B' })

    // Cleanup so the singleton doesn't leak into other tests.
    rel.removeOne(1002)
  })

  it('returns false when the animeID does not exist', () => {
    const rel = ATRelation.getInstance()
    const removed = rel.removeOne(999_999)
    expect(removed).toBe(false)
  })
})
