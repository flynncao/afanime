import { CronJob } from 'cron'
import 'dotenv/config'
import {  executeAnimeEpisodeInfoTaskInOrder } from '../anime/task.js'
import { fetchAndUpdateAnimeMetaInfo } from '../anime/index.js'
import BotLogger from '#root/bot/logger.js'
import db from '#root/databases/store.js'

import { readAnimes } from '#root/models/Anime.js'
import type { AnimeContext } from '#root/types/index.js'

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
}
function optionalMessenger(msg: string, ctx?: AnimeContext, otherConfig: { message_thread_id?: number } = {}): any {
  return ctx ? ctx.reply(msg, otherConfig) : BotLogger.sendServerMessageAsync(msg, otherConfig, true)
}

export function updateAnimeLibraryEpisodesInfo() {
  console.log('running a task every 8:00')
  optionalMessenger('早上好~现在开始推送动画更新', undefined, {}).then(() => {
    readAnimes().then((res) => {
      const activeAnimes = res.filter(item => item.status === 1)
      optionalMessenger(`放送中的动画数：${activeAnimes.length}`, undefined, {})
			type EAEIPromise = Promise<string | Promise<any>>
			type cbFn = () => EAEIPromise
			const promises: EAEIPromise[] = []
      activeAnimes.forEach(async (anime) => {
				executeAnimeEpisodeInfoTaskInOrder(anime.id, anime.name_cn)
      })
    })
  })
}

export function updateAnimeLibraryMetaInfo() {
  console.log('running a task every Monday 0:00:00')

  optionalMessenger('新的一周开始了！~拉取新的推送日程', undefined, {}).then(() => {
    readAnimes().then((res) => {
      res.forEach(async (anime) => {
        const msg = await fetchAndUpdateAnimeMetaInfo(anime.id)
        BotLogger.sendServerMessageAsync(msg)
      })
    })
  },
  )
}

export function timestamp() {
  console.log('⌛Timestamp:', new Date().toLocaleString())
}
export const jobs: CronJob[] = [
  new AnimeJob('updateAnimeLibraryEpisodesInfo', '0 0 8 * * *', updateAnimeLibraryEpisodesInfo, true),
  new AnimeJob('updateAnimeLibraryMetaInfo', '0 0 0 * * 1', updateAnimeLibraryMetaInfo, true),
  new AnimeJob('timestamp', '*/1 * * * *', timestamp, false),
]
