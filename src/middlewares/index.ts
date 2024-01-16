import { conversations } from '@grammyjs/conversations'
import timestamp from './timestamp.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'

export default function registerCriticalMiddlewares() {
  const { bot } = store
  if (!bot)
    return
  const middlewares = [
    timestamp,
    conversations(),
  ]
  for (const item of middlewares) {
    if (item)
      bot.use(item)
  }
  Logger.logSuccess('Critial middwares registered')
}
