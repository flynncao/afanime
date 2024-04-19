import 'dotenv/config'
import { jobs } from './jobs.js'
import Logger from '#root/utils/logger.js'

export function initCrons() {
  try {
    jobs.filter((item: any) => item.enabled).forEach(job => job.start())

    Logger.logSuccess('Crons initialized')
  }
  catch (error) {
    Logger.logError(`Error while initializing crons', ${error}`)
  }
}
