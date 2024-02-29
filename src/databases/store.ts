import type { Timer as ITimer } from 'easytimer.js'
import type { Bot } from 'grammy'
import type { ZonedDateTime } from '@js-joda/core'
import { ATRelation } from '../bot/thread'
import type { AnimeContext, IAnime } from '#root/types/index.js'
import type { IATRelationInstance } from '#root/bot/thread.js'

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
  AT: IATRelationInstance
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
  AT: ATRelation.getInstance(),
}

export default db
