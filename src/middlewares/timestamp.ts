import type { Context, NextFunction } from 'grammy'
import { Instant } from '@js-joda/core'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'

/** Measures the response time of the bot, and logs it to `console` */
export default async function responseTime(
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  if (!store.clock)
    Logger.logError('Clock is not initialized')

  const before = Instant.now().toEpochMilli()
  await next()
  const after = Instant.now().toEpochMilli()
  Logger.logDebug(`Response time: ${after - before} ms`)
  if (store.menus['anime-dashboard'].update)
    store.menus['anime-dashboard'].update()
}
