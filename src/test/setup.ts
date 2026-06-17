import { afterEach, vi } from 'vitest'

// Ensure mocks are cleared between tests (matches AGENTS.md testing conventions).
afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})
