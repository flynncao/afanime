import type { ZonedDateTime } from '@js-joda/core'
import type { Bot } from 'grammy'
import type { IATRelationInstance } from '#root/bot/thread.js'
import type { AnimeContext, RealSearchAPI } from '#root/types/index.js'
import type { AnimeJob } from '../modules/crons/jobs.js'
import { ATRelation } from '../bot/thread.js'

enum CRON_JOB_STATUS {
  IDLE = 0,
  PUSHING = 1,
}
enum DASHBOARD_VISIBILITY {
  ALL = 0,
  AIRED = 1,
}
interface SharedDB {
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
  cronInstance: AnimeJob[] | null
  realSearchAPI: RealSearchAPI
  proxyAddress: string | null
}

const db: SharedDB = {
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
  },
  proxyAddress: null,
}

export default db
