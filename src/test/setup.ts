import { afterEach, vi } from 'vitest'

// Mock external APIs
vi.mock('#root/api/bangumi.js', () => ({
  fetchBangumiSubjectInfoFromID: vi.fn(),
}))

vi.mock('#root/api/realsearch.js', () => ({
  useFetchNEP: vi.fn(),
}))

// Mock grammy
vi.mock('grammy', () => ({
  Bot: vi.fn().mockImplementation(() => ({
    use: vi.fn(),
    catch: vi.fn(),
    start: vi.fn(),
    command: vi.fn(),
    on: vi.fn(),
    api: {
      getMe: vi.fn(),
      sendMessage: vi.fn(),
      editMessageText: vi.fn(),
      deleteMessage: vi.fn(),
    },
  })),
  Context: vi.fn(),
  GrammyError: class GrammyError extends Error {},
  HttpError: class HttpError extends Error {},
}))

// Mock logger to suppress output during tests
vi.mock('#root/utils/logger.js', () => ({
  default: {
    logInfo: vi.fn(),
    logError: vi.fn(),
    logSuccess: vi.fn(),
    logWarning: vi.fn(),
    logDebug: vi.fn(),
  },
}))

// Mock config for translator blacklist
vi.mock('#root/config/index.js', () => ({
  config: {
    translatorBlacklist: ['BadSub'],
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})
