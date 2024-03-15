import { CronJob } from 'cron'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import 'dotenv/config'
import { fetchAndUpdateAnimeEpisodesInfo, readAnimes, updateAnimeMetaAndEpisodes } from '#root/models/Anime.js'
import BotLogger from '#root/bot/logger.js'

export function initCrons() {
  try {
    const botInstance = store.bot!
    const userChatId = process.env.USER_CHAT_ID!
    const timeZone = 'Asia/Shanghai'

    const job = new CronJob('*/5 * * * * *', () => {
      console.log('running a task every 5 seconds')
    }, null, false, timeZone)

    const dailyJob = new CronJob('0 0 8 * * *', () => {
      console.log('running a task every 8:00')
      botInstance.api.sendMessage(userChatId, '早上好~现在开始推送动画更新').then(() => {
        readAnimes().then((res) => {
          res.filter(item => item.status === 1).forEach(async (anime) => {
            const res = await fetchAndUpdateAnimeEpisodesInfo(anime.id)
            if (typeof res === 'string') {
              await BotLogger.sendServerMessageAsync(res)
              if (store.pushCenter.list.length > 0) {
                const list = store.pushCenter.list
                for (const item of list) {
                  if (item.link && item.link !== '') {
                    const videoLink = item.link
                    const episodePageLink = `https://bangumi.tv/ep/${item.bangumiID}`
                    await BotLogger.sendServerMessageAsync(`原视频：${videoLink}\n评论区：${episodePageLink}`, {
                      message_thread_id: store.pushCenter.threadID,
                    })
                  }
                }
                store.pushCenter.list = []
              }
            }
          })
        })
      })
    })

    const weeklyJob = new CronJob('0 0 0 * * 1', () => {
      console.log('running a task every Monday 0:00:00')
      botInstance.api.sendMessage(userChatId, '新的一周开始了！~').then(() => {
        readAnimes().then((res) => {
          res.forEach(async (anime) => {
            const msg = await updateAnimeMetaAndEpisodes(anime.id)
            BotLogger.sendServerMessage(msg)
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
