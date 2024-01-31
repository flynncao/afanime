import type { Timer as ITimer } from 'easytimer.js'
import type { Bot } from 'grammy'
import type { ZonedDateTime } from '@js-joda/core'
import type { AnimeContext } from '#root/types/index.js'

interface SharedDB {
  timer: ITimer | null
  bot: Bot<AnimeContext> | null
  userChatID: string | null
  menus: any
  clock: typeof ZonedDateTime | null
  operatingAnimeID: number | null
  pushCenter: { list: any[], threadID: number | null }
  dashboardFingerprint: string
  botContextMessage: string | null
}

const db: SharedDB = {
  timer: null,
  bot: null,
  userChatID: null,
  menus: null,
  clock: null,
  operatingAnimeID: null,
  dashboardFingerprint: 'default',
  botContextMessage: '',
  pushCenter: {
    threadID: null,
    list: [],
  },
}

export default db
