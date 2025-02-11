import type { Timer as ITimer } from 'easytimer.js'
import type { Bot } from 'grammy'
import type { ZonedDateTime } from '@js-joda/core'
import { ATRelation } from '../bot/thread.js'
import type { AnimeJob } from '../modules/crons/jobs.js'
import type { AnimeContext, RealSearchAPI } from '#root/types/index.js'
import type { IATRelationInstance } from '#root/bot/thread.js'

enum CRON_JOB_STATUS {
  IDLE = 0,
  PUSHING = 1,
}
enum DASHBOARD_VISIBILITY {
  ALL = 0,
  AIRED = 1,
}
interface SharedDB {
  timer: ITimer | null
  bot: Bot<AnimeContext> | null
  userChatID: string | null
  menus: any
  clock: typeof ZonedDateTime | null
  operatingAnimeID: number | null
  dashboardVisibility: DASHBOARD_VISIBILITY
  pushCenter: { list: any[], threadID: number | null }
  dashboardFingerprint: string
  botContextMessage: string | null
  AT: IATRelationInstance
  cronStatus: CRON_JOB_STATUS
  cronInstance: AnimeJob | AnimeJob[] | null
  realSearchAPI: RealSearchAPI
  proxyAddress: string | null
}

const db: SharedDB = {
  timer: null,
  bot: null,
  userChatID: null,
  menus: null,
  clock: null,
  operatingAnimeID: null,
  dashboardVisibility: DASHBOARD_VISIBILITY.AIRED,
  dashboardFingerprint: 'default',
  botContextMessage: '',
  pushCenter: {
    threadID: null,
    list: [],
  },
  AT: ATRelation.getInstance(),
  cronStatus: 0,
  cronInstance: null,
  realSearchAPI: {
    uri: '',
    token: '',
  },
  proxyAddress: null,
}

export default db
