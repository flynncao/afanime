import mongoose from 'mongoose'
import Logger from './logger.js'
import { config } from '#root/config/index.js'

const url = config.mongodbURL || 'mongodb://localhost:27017/afanime'

export async function connectMongodb() {
  if (mongoose.connection.readyState >= 1)
    return
  await mongoose.connect(url).then(() => {
    Logger.logSuccess('MongoDB connected')
  }).catch((err) => {
    Logger.logError(err.message)
  })
}
