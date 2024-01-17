import type { Timer as ITimer } from 'easytimer.js'
import type { Bot } from 'grammy'
import type { ZonedDateTime } from '@js-joda/core'
import type { AnimeContext } from '#root/types/index.js'

interface SharedDB {
  timer: ITimer | null
  bot: Bot<AnimeContext> | null
  menus: any
  clock: typeof ZonedDateTime | null
  operatingAnimeID: number | null
  dashboardFingerprint: string
}

const db: SharedDB = {
  timer: null,
  bot: null,
  menus: null,
  clock: null,
  operatingAnimeID: null,
  dashboardFingerprint: 'default',
}

export default db
