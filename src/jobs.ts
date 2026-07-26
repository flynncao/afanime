import type { Notifier } from '#root/bot/notifier.js'
import type { AnimeContext } from '#root/types/index.js'
import { CronJob } from 'cron'
import { readAnimes } from '#root/models/Anime.js'
import { CronModel, readCrons } from '#root/models/Cron.js'
import { pushEpisodes, updateAnimeEpisodes, updateAnimeMeta } from '#root/modules/anime/index.js'
import displayWeeklyScheduleFromRealsearch from '#root/modules/realsearch/index.js'
import { STATUS } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'

const TIMEZONE = 'Asia/Shanghai'

/** YYYY-MM-DD HH:mm:ss in the process timezone */
function now(): string {
  return new Date().toLocaleString('sv-SE')
}

/** Daily: search NEP for every airing anime and push new episodes. */
export async function dailyEpisodeTask(notifier: Notifier, ctx?: AnimeContext): Promise<void> {
  displayWeeklyScheduleFromRealsearch(new Date().getDay(), notifier)
  await notifier.send(`现在是${now()}！拉取动画仓库中～`)
  const animes = await readAnimes()
  const activeAnimes = animes.filter(anime => anime.status === STATUS.AIRED)
  const inactiveAnimeNum = animes.length - activeAnimes.length
  let pushedCount = 0
  for (const anime of activeAnimes) {
    try {
      const outcome = await updateAnimeEpisodes(anime.id)
      if (outcome.status === 'update-available') {
        await notifier.send(`「${outcome.title}」推送中！`)
        await pushEpisodes(outcome, notifier)
        pushedCount++
      }
      else if (ctx) {
        await ctx.reply(`「${outcome.title}」无需更新！`)
      }
    }
    catch (error) {
      // one broken anime must not abort the whole run
      Logger.logError(`dailyEpisodeTask(${anime.id}):`, error)
      await notifier.send(`❗「${anime.name_cn}」${error instanceof Error ? error.message : error}`)
    }
  }
  const message = `${pushedCount}部动画推送中，有${activeAnimes.length - pushedCount}部动画无需更新，有${inactiveAnimeNum}部动画已归档或者放送结束`
  if (ctx)
    await ctx.reply(message)
  await notifier.send(message)
}

/** Weekly: refresh subject metadata from Bangumi for every unfinished anime. */
export async function weeklyMetaTask(notifier: Notifier, ctx?: AnimeContext): Promise<void> {
  await notifier.send(`现在是${now()}！拉取动画元信息中～`)
  const animes = await readAnimes()
  let success = 0
  let total = animes.length
  for (const anime of animes) {
    if (anime.status === STATUS.COMPLETED || anime.status === STATUS.ARCHIVED) {
      total--
      continue
    }
    try {
      await updateAnimeMeta(anime.id)
      success++
    }
    catch (error) {
      await notifier.send(`❗${error instanceof Error ? error.message : error}`)
    }
  }
  const rate = total > 0 ? (success / total * 100).toFixed(0) : '100'
  const message = `✅${success}部动画元信息拉取完成！成功率${rate}%。`
  if (ctx)
    await ctx.reply(message)
  await notifier.send(message)
}

interface JobSpec {
  name: string
  schedule: string
  enabled: boolean
  run: () => void
}

/**
 * Seed the Cron collection on first run, then start every enabled job with
 * its stored schedule. Job names double as Cron collection keys — keep them
 * stable, the /cron conversation updates those records.
 */
export async function startJobs(notifier: Notifier): Promise<void> {
  const specs: JobSpec[] = [
    { name: 'updateAnimeLibraryEpisodesInfo', schedule: '0 0 8 * * *', enabled: true, run: () => void dailyEpisodeTask(notifier) },
    { name: 'updateAnimeLibraryMetaInfo', schedule: '0 0 0 * * 1', enabled: true, run: () => void weeklyMetaTask(notifier) },
    { name: 'timestamp', schedule: '*/1 * * * *', enabled: false, run: () => console.log('⌛Timestamp:', new Date().valueOf()) },
  ]
  try {
    const stored = await readCrons()
    if (stored.length === 0)
      await CronModel.create(specs.map(spec => ({ key: spec.name, value: spec.schedule, enabled: spec.enabled })))
    let started = 0
    for (const spec of specs) {
      const record = stored.find(item => item.key === spec.name)
      const schedule = record?.value ?? spec.schedule
      const enabled = record?.enabled ?? spec.enabled
      if (!enabled)
        continue
      // eslint-disable-next-line no-new
      new CronJob(schedule, spec.run, null, true, TIMEZONE)
      started++
    }
    Logger.logSuccess(`Crons initialized (${started} running)`)
  }
  catch (error) {
    Logger.logError('Error while loading or saving crons from DB:', error)
  }
}
