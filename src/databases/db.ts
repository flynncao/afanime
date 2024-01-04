import type { Timer as ITimer } from 'easytimer.js'
import type { Bot } from 'grammy'
import type { AnimeContext } from '#root/types/index.js'

interface SharedDB {
  timer: ITimer | null
  bot: Bot<AnimeContext> | null
}

const db: SharedDB = {
  timer: null,
  bot: null,
}

export default db
