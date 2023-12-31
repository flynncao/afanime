import type { Context, NextFunction } from 'grammy'

/** Measures the response time of the bot, and logs it to `console` */
export async function responseTime(
  ctx: Context,
  next: NextFunction, // is an alias for: () => Promise<void>
): Promise<void> {
  const before = Date.now()
  await next() // Always call `next()`!
  const after = Date.now()
  console.log(`Response time: ${after - before} ms`)
}
