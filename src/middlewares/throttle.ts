import { limit } from '@grammyjs/ratelimiter'
import type { Context, NextFunction } from 'grammy'
import Logger from '#root/utils/logger.js'

/**
 * Throttle middleware for user inputs and menu clicks (issue #44).
 *
 * Uses two fixed-window limiters keyed per-user:
 *  - Command limiter: at most 3 slash-commands per 10s.
 *  - Menu/callback limiter: at most 2 callback queries per 3s.
 *
 * Updates that don't match (e.g. plain text without `/`) bypass each limiter
 * via `keyGenerator` returning `undefined`, so only the relevant traffic is
 * counted. This is the v1.2.1 equivalent of the `onlyIf` filter.
 */

const commandLimiter = limit({
  timeFrame: 10_000,
  limit: 3,
  keyPrefix: 'afanime-cmd',
  keyGenerator: (ctx: Context): string | undefined => {
    const text = ctx.message?.text
    if (text && text.startsWith('/'))
      return ctx.from?.id?.toString()
    return undefined
  },
  onLimitExceeded: (ctx: Context) => {
    Logger.logProgress(`[throttle] command rate limit exceeded by user ${ctx.from?.id}`)
    return ctx.reply('操作过于频繁，请稍后再试。')
  },
})

const menuLimiter = limit({
  timeFrame: 3_000,
  limit: 2,
  keyPrefix: 'afanime-menu',
  keyGenerator: (ctx: Context): string | undefined => {
    if (ctx.callbackQuery)
      return ctx.from?.id?.toString()
    return undefined
  },
  onLimitExceeded: (ctx: Context) => {
    Logger.logProgress(`[throttle] menu rate limit exceeded by user ${ctx.from?.id}`)
    if (ctx.callbackQuery) {
      return ctx.answerCallbackQuery('请勿重复点击')
        .catch(() => {})
    }
  },
})

export default async function throttle(ctx: Context, next: NextFunction): Promise<void> {
  // Compose the two limiters: command check first, then menu check, then downstream.
  await commandLimiter(ctx, async () => menuLimiter(ctx, next))
}

export { commandLimiter, menuLimiter }
