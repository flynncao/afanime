import { conversations } from '@grammyjs/conversations'
import { session } from 'grammy'
import timestamp from './timestamp.js'
import authorization from './authorization.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import type { SessionData } from '#root/types/index.js'

function initial(): SessionData {
  return {
    activeAnimeCount: 0,
    animes: [],
    message: '',
  }
}
export default function registerCriticalMiddlewares() {
  const { bot } = store
  if (!bot)
    return
  const middlewares = [
    session({ initial }),
    timestamp,
    authorization,
    conversations(),
  ]
  for (const item of middlewares) {
    if (item)
      bot.use(item)
  }
  Logger.logSuccess('Critial middwares registered')
}
