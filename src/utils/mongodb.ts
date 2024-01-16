import mongoose from 'mongoose'
import Logger from './logger.js'

const url = process.env.MONGO_DB_URL || 'mongodb://localhost:27017/afanime'

if (!url) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local',
  )
}

export async function connectMongodb() {
  if (mongoose.connection.readyState >= 1)
    return
  await mongoose.connect(url).then(() => {
    Logger.logSuccess('MongoDB connected')
  }).catch((err) => {
    Logger.logError(err.message)
  })
}
