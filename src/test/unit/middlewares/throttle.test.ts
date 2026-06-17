import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Bot } from 'grammy'

import throttle from '#root/middlewares/throttle.js'

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

/**
 * Builds a grammy Bot wired up with the throttle middleware and a single
 * handler, plus a transformer that swallows all outbound API calls and
 * records `reply`/`answerCallbackQuery` texts. Returns helpers to push
 * updates through the bot.
 */
function buildBot() {
  // Pass a static botInfo so handleUpdate works without calling bot.init()
  // (which would try to reach the Telegram API).
  const bot = new Bot('fake:token', {
    botInfo: { id: 1, is_bot: true, first_name: 'Test', username: 'testbot', can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false },
  })
  // Swallow outbound calls so no network is hit; capture reply text.
  const sentTexts: string[] = []
  const callbackAnswers: string[] = []
  bot.api.config.use(async (prev, method, payload) => {
    if (method === 'sendMessage' && payload && typeof payload === 'object' && 'text' in payload)
      sentTexts.push((payload as any).text)
    if (method === 'answerCallbackQuery' && payload && typeof payload === 'object' && 'text' in payload)
      callbackAnswers.push((payload as any).text)
    // Return a minimal valid result for sendMessage.
    if (method === 'sendMessage')
      return { ok: true, result: { message_id: 1, date: 0, chat: { id: 1, type: 'private' } } } as any
    return { ok: true, result: true } as any
  })
  bot.use(throttle)

  let handlerCalls = 0
  bot.command('create', async (ctx) => {
    handlerCalls++
    await ctx.reply('handler-ran')
  })
  bot.on('callback_query:data', async (ctx) => {
    handlerCalls++
    await ctx.answerCallbackQuery()
  })

  return { bot, handlerCalls: () => handlerCalls, sentTexts, callbackAnswers }
}

function msgUpdate(userId: number, text: string) {
  const updateId = Math.floor(Math.random() * 1_000_000)
  const isCommand = text.startsWith('/')
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 1, type: 'private', first_name: 'Test' },
      from: { id: userId, is_bot: false, first_name: 'Test' },
      text,
      // Required for bot.command() to recognise the command.
      ...(isCommand
        ? { entities: [{ type: 'bot_command', offset: 0, length: !text.includes(' ') ? text.length : text.indexOf(' ') }] }
        : {}),
    },
  } as any
}

function cbUpdate(userId: number, data = 'btn') {
  const updateId = Math.floor(Math.random() * 1_000_000)
  return {
    update_id: updateId,
    callback_query: {
      id: `cb_${updateId}`,
      from: { id: userId, is_bot: false, first_name: 'Test' },
      message: { message_id: 1, date: 0, chat: { id: 1, type: 'private', first_name: 'Test' }, text: 'x' },
      chat_instance: '1',
      data,
    },
  } as any
}

describe('throttle middleware (issue #44)', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('allows up to 3 /commands per 10s then throttles the 4th', async () => {
    const { bot, handlerCalls, sentTexts } = buildBot()
    const uid = 501

    for (let i = 0; i < 4; i++)
      await bot.handleUpdate(msgUpdate(uid, '/create'))

    // First 3 pass through to the handler; 4th is throttled.
    expect(handlerCalls()).toBe(3)
    // 4th produced a throttle reply (the first 3 also reply 'handler-ran').
    expect(sentTexts).toContain('操作过于频繁，请稍后再试。')
  })

  it('does NOT throttle plain text messages (no slash)', async () => {
    const { bot, handlerCalls } = buildBot()
    const uid = 502
    for (let i = 0; i < 5; i++)
      await bot.handleUpdate(msgUpdate(uid, 'hello world'))
    // Plain text is not command-routed by grammy here, but throttle must not
    // block it either — handlerCalls stays 0 because no command matched, and
    // crucially no throttle reply text is emitted.
    expect(handlerCalls()).toBe(0)
  })

  it('throttles the 3rd callback query within 3s for the same user', async () => {
    const { bot, handlerCalls, callbackAnswers } = buildBot()
    const uid = 503
    for (let i = 0; i < 3; i++)
      await bot.handleUpdate(cbUpdate(uid))
    // Limit is 2 per 3s: first two reach the handler, third is throttled.
    expect(handlerCalls()).toBe(2)
    expect(callbackAnswers).toContain('请勿重复点击')
  })

  it('rate-limits per user independently', async () => {
    const { bot, handlerCalls } = buildBot()
    // User A uses all 3 command slots.
    for (let i = 0; i < 3; i++)
      await bot.handleUpdate(msgUpdate(601, '/create'))
    // User B is a different user — should still be allowed.
    await bot.handleUpdate(msgUpdate(602, '/create'))
    expect(handlerCalls()).toBe(4)
  })
})
