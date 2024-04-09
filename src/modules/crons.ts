import { CronJob } from 'cron'
import 'dotenv/config'
import { executeAnimeEpisodeInfoTask } from './anime/task.js'
import { fetchAndUpdateAnimeMetaInfo } from './anime/index.js'
import Logger from '#root/utils/logger.js'

import { readAnimes } from '#root/models/Anime.js'
import BotLogger from '#root/bot/logger.js'

export function initCrons() {
  try {
    const timeZone = 'Asia/Shanghai'

    const job = new CronJob('*/5 * * * * *', () => {
      console.log('running a task every 5 seconds')
    }, null, false, timeZone)

    const dailyJob = new CronJob('0 0 8 * * *', () => {
      console.log('running a task every 8:00')
      BotLogger.sendServerMessageAsync('早上好~现在开始推送动画更新').then(() => {
        readAnimes().then((res) => {
          res.filter(item => item.status === 1).forEach(async (anime) => {
            await executeAnimeEpisodeInfoTask(anime.id, anime.name_cn)
          })
        })
      })
    })

    const weeklyJob = new CronJob('0 0 0 * * 1', () => {
      console.log('running a task every Monday 0:00:00')
      BotLogger.sendServerMessageAsync('新的一周开始了！~拉取新的推送日程').then(() => {
        readAnimes().then((res) => {
          res.forEach(async (anime) => {
            const msg = await fetchAndUpdateAnimeMetaInfo(anime.id)
            BotLogger.sendServerMessageAsync(msg)
          })
        })
      })
    })

    const jobs = [job, dailyJob, weeklyJob]
    jobs.forEach(job => job.start())
    Logger.logSuccess('Crons initialized')
  }
  catch (error) {
    Logger.logError(`Error while initializing crons', ${error}`)
  }
}
