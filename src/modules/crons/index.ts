import 'dotenv/config'
import { type AnimeJob, instantiateJobs } from './jobs.js'
import db from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'

export function initCrons() {
  try {
    // allow asynchronous
    instantiateJobs()
      .then((r) => {
        r.filter((item: any) => item.enabled).forEach((job: any) => job.start())
        Logger.logSuccess('Crons initialized')
        db.cronInstance = r
      }).catch((e) => {
        throw e
      })
  }
  catch (error) {
    Logger.logError(`Error while initializing crons', ${error}`)
  }
}
