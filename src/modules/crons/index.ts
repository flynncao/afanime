import 'dotenv/config'
import {instantiateJobs} from './jobs.js'
import Logger from '#root/utils/logger.js'

export function initCrons() {
  try {
    // allow asynchronous
    instantiateJobs().then(r =>{
      r.filter((item: any) => item.enabled).forEach((job:any) => job.start())
      Logger.logSuccess('Crons initialized')
    }).catch(e => {
      throw e
    })
  }
  catch (error) {
    Logger.logError(`Error while initializing crons', ${error}`)
  }
}
