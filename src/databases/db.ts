import type { Timer as ITimer } from 'easytimer.js'
import type { Bot } from 'grammy'

interface SharedDB {
  timer: ITimer | null
  bot: Bot | null
}

const db: SharedDB = {
  timer: null,
  bot: null,
}

export default db
