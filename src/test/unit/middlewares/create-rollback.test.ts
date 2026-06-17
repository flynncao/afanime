import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createNewAnime, deleteAnime } from '#root/models/Anime.js'
import { updateAnimeMetaAndEpisodes } from '#root/modules/anime/index.js'
import { performCreateWithRollback } from '#root/middlewares/conversation.js'
import { ATRelation } from '#root/bot/thread.js'

// Mock the Anime model before importing the function under test.
vi.mock('#root/models/Anime.js', () => ({
  createNewAnime: vi.fn(),
  deleteAnime: vi.fn().mockResolvedValue({ deletedCount: 1 }),
  readSingleAnime: vi.fn(),
  updateSingleAnimeQuick: vi.fn(),
}))

// Mock the Cron model — its module calls getModelForClass at import time,
// which fails without a live mongoose connection.
vi.mock('#root/models/Cron.js', () => ({
  CronModel: {},
  getSingleCron: vi.fn(),
  updateSingleCron: vi.fn(),
  createNewCron: vi.fn(),
  deleteSingleCron: vi.fn(),
  readCrons: vi.fn(),
  readSingleCron: vi.fn(),
  updateSingleCronQuick: vi.fn(),
  updateMultipleCronQuick: vi.fn(),
}))

// Mock the bangumi/anime module to avoid hitting the network.
vi.mock('#root/modules/anime/index.js', () => ({
  updateAnimeMetaAndEpisodes: vi.fn(),
  fetchAndUpdateAnimeMetaInfo: vi.fn(),
  fetchAndUpdateAnimeEpisodesInfo: vi.fn(),
}))

// Mock the conversation builder to avoid pulling in conversations plugin at import.
vi.mock('#root/classes/grammy/CustomConversation.js', () => ({
  AniConversationBuilder: class {
    addContext() { return this }
    addStep() { return this }
    build() { return { start: async () => {} } }
  },
}))

// Mock logger to keep test output clean.
vi.mock('#root/utils/logger.js', () => ({
  default: {
    logSuccess: vi.fn(),
    logError: vi.fn(),
    logProgress: vi.fn(),
    logInfo: vi.fn(),
    logDebug: vi.fn(),
  },
}))

const mockedCreateNewAnime = vi.mocked(createNewAnime)
const mockedDeleteAnime = vi.mocked(deleteAnime)
const mockedUpdateMeta = vi.mocked(updateAnimeMetaAndEpisodes)

function makeReplyRecorder(): { reply: (text: string) => Promise<unknown>, replies: string[] } {
  const replies: string[] = []
  const reply = async (text: string) => {
    replies.push(text)
    return {}
  }
  return { reply, replies }
}

describe('performCreateWithRollback (issue #42)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT call deleteAnime on the happy path', async () => {
    mockedCreateNewAnime.mockResolvedValueOnce({} as any)
    mockedUpdateMeta.mockResolvedValueOnce('更新动画元信息及剧集成功')

    const { reply, replies } = makeReplyRecorder()

    await performCreateWithRollback(42, 7, 'some-query', reply)

    expect(mockedCreateNewAnime).toHaveBeenCalledOnce()
    expect(mockedUpdateMeta).toHaveBeenCalledOnce()
    expect(mockedDeleteAnime).not.toHaveBeenCalled()
    expect(replies[0]).toContain('创建成功')
  })

  it('rolls back DB record + AT relation when metadata fetch fails', async () => {
    // Insert succeeds, then metadata fetch throws.
    mockedCreateNewAnime.mockResolvedValueOnce({} as any)
    mockedUpdateMeta.mockRejectedValueOnce(new Error('bangumi down'))

    const { reply, replies } = makeReplyRecorder()

    // Seed AT relation will be inserted then removed during rollback.
    const rel = ATRelation.getInstance()
    const before = rel.getRelations().filter(r => r.id === 8888).length

    await performCreateWithRollback(8888, 9, 'q', reply)

    expect(mockedCreateNewAnime).toHaveBeenCalledOnce()
    expect(mockedUpdateMeta).toHaveBeenCalledOnce()
    // Compensating delete must have been called.
    expect(mockedDeleteAnime).toHaveBeenCalledWith(8888)
    // AT relation must be removed.
    const after = rel.getRelations().filter(r => r.id === 8888).length
    expect(after).toBe(before)
    // User-facing message.
    expect(replies.at(-1)).toContain('创建失败')
    expect(replies.at(-1)).toContain('清理无效记录')
  })

  it('does NOT call deleteAnime when the insert itself throws (nothing to delete)', async () => {
    // Insert fails (e.g. duplicate id).
    mockedCreateNewAnime.mockRejectedValueOnce(new Error('duplicate key'))

    const { reply, replies } = makeReplyRecorder()

    await performCreateWithRollback(7777, 3, 'q', reply)

    expect(mockedCreateNewAnime).toHaveBeenCalledOnce()
    expect(mockedUpdateMeta).not.toHaveBeenCalled()
    expect(mockedDeleteAnime).not.toHaveBeenCalled()
    expect(replies.at(-1)).toContain('创建失败')
  })
})
