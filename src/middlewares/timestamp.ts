import type { Context, NextFunction } from 'grammy'

/** Measures the response time of the bot, and logs it to `console` */
export default async function responseTime(
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  const before = Date.now()
  await next()
  const after = Date.now()
  console.log(`Response time: ${after - before} ms`)
}
