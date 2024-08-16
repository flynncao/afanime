import { CronJob, CronTime } from 'cron'
import 'dotenv/config'
import moment from 'moment'
import { executeAnimeEpisodeInfoTaskInOrder } from '../anime/task.js'
import { fetchAndUpdateAnimeMetaInfo } from '../anime/index.js'
import { handleAnimeResolve } from '../anime/event.js'
import displayWeeklyScheduleFromRealsearch from '../realsearch/index.js'
import BotLogger from '#root/bot/logger.js'

import { readAnimes } from '#root/models/Anime.js'
import type { AnimeContext } from '#root/types/index.js'
import { CronModel, readCrons } from '#root/models/Cron.js'
import Logger from '#root/utils/logger.js'

const locale = 'Asia/Shanghai'

interface IAnimeJob {
  name: string
  schedule: string
  handler: () => void
  instance: CronJob
  enabled: boolean
}

class AnimeJob extends CronJob {
  name: string
  schedule: string
  handler: () => void
  instance: CronJob
  enabled: boolean

  constructor(name: string, schedule: string, handler: () => void, enabled: boolean) {
    super(schedule, handler, null, false, locale)
    this.name = name
    this.schedule = schedule
    this.handler = handler
    this.enabled = enabled
    this.instance = new CronJob(schedule, handler, null, false, locale)
  }

  start() {
    this.instance.start()
  }

  stop() {
    this.instance.stop()
  }

  setName(name: string) {
    this.name = name
  }

  setTime(time: CronTime) {
    super.setTime(time)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
}

function optionalMessenger(msg: string, ctx?: AnimeContext, otherConfig: { message_thread_id?: number } = {}): any {
  return ctx ? ctx.reply(msg, otherConfig) : BotLogger.sendServerMessageAsync(msg, otherConfig, true)
}

export function updateAnimeLibraryEpisodesInfo(ctx?: AnimeContext) {
  const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss')
  displayWeeklyScheduleFromRealsearch(moment().day())
  BotLogger.sendServerMessageAsync(`现在是${formattedDate}！拉取动画仓库中～`, {}, true)!.then(() => {
    readAnimes().then(async (res) => {
      const activeAnimes = res.filter(item => item.status === 1)
      const inactiveAnimeNum = res.length - activeAnimes.length
      let willUpdateAnimeNum = 0
      for (const anime of activeAnimes) {
        const actions: string = await executeAnimeEpisodeInfoTaskInOrder(anime.id, anime.name_cn)
        const willUpdate = await handleAnimeResolve(actions, undefined)
        if (willUpdate) {
          willUpdateAnimeNum += 1
        }
      }
      const msg = `${willUpdateAnimeNum}部动画推送中，有${activeAnimes.length - willUpdateAnimeNum}部动画无需更新，有${inactiveAnimeNum}部动画已归档或者放送结束`
      if (ctx) {
        await ctx.reply(msg)
      }
      BotLogger.sendServerMessageAsync(msg)
    })
  })
}

export function updateAnimeLibraryMetaInfo(ctx?: AnimeContext) {
  const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss')
  optionalMessenger(`现在是${formattedDate}！拉取动画元信息中～`, undefined, {}).then(() => {
    readAnimes().then(async (res) => {
      let success = 0
      const total = res.length
      for (const anime of res) {
        const actions = (await fetchAndUpdateAnimeMetaInfo(anime.id)).split('#')
        if (actions[0] === 'error') {
          BotLogger.sendServerMessageAsync(`❗${actions[1]}`, undefined, true)
        }
        else {
          success += 1
        }
      }
      const message = `✅${success}部动画元信息拉取完成！成功率${(success / total * 100.0).toFixed(0)}%。`
      if (ctx) {
        await ctx.reply(message)
      }
      BotLogger.sendServerMessageAsync(`✅${success}部动画元信息拉取完成！成功率${(success / total * 100.0).toFixed(0)}%。`)
    })
  },
  )
}

export function timestamp() {
  console.log('⌛Timestamp:', new Date().valueOf())
}

export async function instantiateJobs(): Promise<AnimeJob[]> {
  const jobs: AnimeJob[] = [
    new AnimeJob('updateAnimeLibraryEpisodesInfo', '0 0 8 * * *', updateAnimeLibraryEpisodesInfo, true),
    new AnimeJob('updateAnimeLibraryMetaInfo', '0 0 0 * * 1', updateAnimeLibraryMetaInfo, true),
    new AnimeJob('timestamp', '*/1 * * * *', timestamp, false),
  ]
  const jobInstances: AnimeJob[] = []

  try {
    const data = await readCrons()
    if (data.length === 0) {
      await CronModel.create(jobs.map((job: any) => {
        return { key: job.name, value: job.schedule, enabled: job.enabled }
      }))
    }
    for (const job of jobs) {
      const jobData = data.find(item => item.key === job.name)
      if (jobData) {
        job.setTime(new CronTime(jobData.value))
        job.setEnabled(jobData.enabled)
      }
      jobInstances.push(job)
    }
    return jobInstances
  }
  catch (error) {
    Logger.logError(`Error while loading or saving crons from DB', ${error}`)
    return []
  }
}

export function setCronTime(jobName: string, time: string) {
  CronModel.findOneAndUpdate({ key: jobName }, { value: time }).then(() => {
    Logger.logSuccess(`Cron ${jobName} time updated to ${time}`)
  }).catch((err) => {
    Logger.logError(err.message)
  })
}
