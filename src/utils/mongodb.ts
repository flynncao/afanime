import mongoose from 'mongoose'
import { getConfig } from '#root/config/index.js'
import Logger from './logger.js'

export async function connectMongodb() {
  if (mongoose.connection.readyState >= 1)
    return
  const url = getConfig().mongodbURL || 'mongodb://localhost:27017/afanime'
  await mongoose.connect(url)
  Logger.logSuccess('MongoDB connected')
}
