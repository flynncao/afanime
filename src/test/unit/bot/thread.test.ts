import { describe, it, expect, beforeEach } from 'vitest'
import { ATRelation } from '#root/bot/thread.js'

// Mock the readAnimes function
vi.mock('#root/models/Anime.js', () => ({
  readAnimes: vi.fn(),
}))

describe('ATRelation', () => {
  let relation: ATRelation

  beforeEach(() => {
    // Get a fresh instance by accessing the singleton
    relation = ATRelation.getInstance()
    // Clear relations for each test
    ;(relation as any).relations = []
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ATRelation.getInstance()
      const instance2 = ATRelation.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create instance if not exists', () => {
      const instance = ATRelation.getInstance()
      expect(instance).toBeInstanceOf(ATRelation)
    })
  })

  describe('getRelations', () => {
    it('should return empty array initially', () => {
      const relations = relation.getRelations()
      expect(relations).toEqual([])
    })

    it('should return all relations after insertion', () => {
      relation.insertOne(1, 100, 'Anime 1')
      relation.insertOne(2, 200, 'Anime 2')

      const relations = relation.getRelations()
      expect(relations).toHaveLength(2)
    })
  })

  describe('insertOne', () => {
    it('should insert a new relation', () => {
      relation.insertOne(1, 100, 'Test Anime')

      const relations = relation.getRelations()
      expect(relations).toHaveLength(1)
      expect(relations[0]).toEqual({
        id: 1,
        threadID: 100,
        title: 'Test Anime',
      })
    })

    it('should insert multiple relations', () => {
      relation.insertOne(1, 100, 'Anime 1')
      relation.insertOne(2, 200, 'Anime 2')
      relation.insertOne(3, 300, 'Anime 3')

      const relations = relation.getRelations()
      expect(relations).toHaveLength(3)
      expect(relations[0].id).toBe(1)
      expect(relations[1].id).toBe(2)
      expect(relations[2].id).toBe(3)
    })
  })

  describe('updateTitle', () => {
    it('should update title for existing anime ID', () => {
      relation.insertOne(1, 100, 'Old Title')
      relation.updateTitle(1, 'New Title')

      const relations = relation.getRelations()
      expect(relations[0].title).toBe('New Title')
    })

    it('should not update if anime ID not found', () => {
      relation.insertOne(1, 100, 'Existing Title')
      relation.updateTitle(999, 'New Title')

      const relations = relation.getRelations()
      expect(relations).toHaveLength(1)
      expect(relations[0].title).toBe('Existing Title')
    })

    it('should not throw when relations is empty', () => {
      expect(() => relation.updateTitle(1, 'Title')).not.toThrow()
    })
  })

  describe('getAnimeIDFromThreadID', () => {
    it('should return anime ID for valid thread ID', () => {
      relation.insertOne(1, 100, 'Anime 1')
      relation.insertOne(2, 200, 'Anime 2')

      expect(relation.getAnimeIDFromThreadID(100)).toBe(1)
      expect(relation.getAnimeIDFromThreadID(200)).toBe(2)
    })

    it('should return -1 for invalid thread ID', () => {
      relation.insertOne(1, 100, 'Anime 1')

      expect(relation.getAnimeIDFromThreadID(999)).toBe(-1)
    })

    it('should return -1 when relations is empty', () => {
      expect(relation.getAnimeIDFromThreadID(100)).toBe(-1)
    })
  })

  describe('getAnimeTitleFromThreadID', () => {
    it('should return anime title for valid thread ID', () => {
      relation.insertOne(1, 100, 'Test Anime')

      expect(relation.getAnimeTitleFromThreadID(100)).toBe('Test Anime')
    })

    it('should return empty string for invalid thread ID', () => {
      relation.insertOne(1, 100, 'Test Anime')

      expect(relation.getAnimeTitleFromThreadID(999)).toBe('')
    })

    it('should return empty string when relations is empty', () => {
      expect(relation.getAnimeTitleFromThreadID(100)).toBe('')
    })
  })

  describe('getThreadIDAndTitleFromID', () => {
    it('should return thread ID and title for valid anime ID', () => {
      relation.insertOne(1, 100, 'Test Anime')

      const result = relation.getThreadIDAndTitleFromID(1)
      expect(result).toEqual({ threadID: 100, title: 'Test Anime' })
    })

    it('should return default values for invalid anime ID', () => {
      relation.insertOne(1, 100, 'Test Anime')

      const result = relation.getThreadIDAndTitleFromID(999)
      expect(result).toEqual({ threadID: 0, title: '' })
    })

    it('should return default values when relations is empty', () => {
      const result = relation.getThreadIDAndTitleFromID(1)
      expect(result).toEqual({ threadID: 0, title: '' })
    })
  })

  describe('initRelations', () => {
    it('should initialize relations from database', async () => {
      const { readAnimes } = await import('#root/models/Anime.js')
      const mockAnimes = [
        { id: 1, name_cn: 'Anime 1', threadID: 100 },
        { id: 2, name_cn: 'Anime 2', threadID: 200 },
        { id: 3, name_cn: 'Anime 3', threadID: 300 },
      ]
      vi.mocked(readAnimes).mockResolvedValue(mockAnimes as any)

      await relation.initRelations()

      const relations = relation.getRelations()
      expect(relations).toHaveLength(3)
      expect(relations[0]).toEqual({ id: 1, threadID: 100, title: 'Anime 1' })
      expect(relations[1]).toEqual({ id: 2, threadID: 200, title: 'Anime 2' })
      expect(relations[2]).toEqual({ id: 3, threadID: 300, title: 'Anime 3' })
    })

    it('should handle empty database result', async () => {
      const { readAnimes } = await import('#root/models/Anime.js')
      vi.mocked(readAnimes).mockResolvedValue([])

      await relation.initRelations()

      const relations = relation.getRelations()
      expect(relations).toHaveLength(0)
    })

    it('should handle database error', async () => {
      const { readAnimes } = await import('#root/models/Anime.js')
      vi.mocked(readAnimes).mockRejectedValue(new Error('DB Error'))

      await expect(relation.initRelations()).resolves.toBeUndefined()
    })
  })
})
