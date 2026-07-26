import { describe, expect, it } from 'vitest'
import { loadConfig } from '#root/config/index.js'

const baseEnv = {
  BOT_TOKEN: 'token',
  GROUP_CHAT_ID: '-100999',
  MONGO_DB_URL: 'mongodb://localhost:27017/afanime',
  REAL_SEARCH_URI: 'https://search.example.test',
}

describe('loadConfig', () => {
  it('throws naming every missing required variable', () => {
    expect(() => loadConfig({})).toThrow('BOT_TOKEN, GROUP_CHAT_ID, MONGO_DB_URL, REAL_SEARCH_URI')
    expect(() => loadConfig({ BOT_TOKEN: 'x', MONGO_DB_URL: 'y' })).toThrow('GROUP_CHAT_ID, REAL_SEARCH_URI')
  })

  it('does not read process.env implicitly', () => {
    // process.env has valid test values (tests/setup.ts); an explicit empty env must still throw
    expect(() => loadConfig({})).toThrow()
  })

  it('maps required values and defaults optional ones', () => {
    const config = loadConfig(baseEnv)
    expect(config.botToken).toBe('token')
    expect(config.groupChatID).toBe('-100999')
    expect(config.mongodbURL).toBe('mongodb://localhost:27017/afanime')
    expect(config.botName).toBe('')
    expect(config.translatorBlacklist).toEqual([])
    expect(config.adminChatIDs).toEqual([])
  })

  it('splits comma-separated lists and trims items', () => {
    const config = loadConfig({
      ...baseEnv,
      TRANSLATOR_BLACK_LIST: 'ANi, 桜都字幕组 ,LoliHouse',
      ADMIN_CHAT_IDS: '111, 222',
    })
    expect(config.translatorBlacklist).toEqual(['ANi', '桜都字幕组', 'LoliHouse'])
    expect(config.adminChatIDs).toEqual(['111', '222'])
  })

  it('strips trailing slashes from the RealSearch URI', () => {
    const config = loadConfig({ ...baseEnv, REAL_SEARCH_URI: 'https://search.example.test///' })
    expect(config.realSearchAPI.uri).toBe('https://search.example.test')
  })
})
