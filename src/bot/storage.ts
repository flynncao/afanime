import { freeStorage } from '@grammyjs/storage-free'
import type { Enhance } from 'grammy'
import { enhanceStorage, session } from 'grammy'
import { ISession, MongoDBAdapter } from '@grammyjs/storage-mongodb'
import { MongoClient } from 'mongodb'
import Logger from '#root/utils/logger.js'
import db from '#root/databases/store.js'
import type { AnimeData, AnimeThread, SessionData } from '#root/types/index.js'
import { threadQueries } from '#root/constants/index.js'

const botToken = process.env.BOT_TOKEN!
const fixedAnimeExtraData = [
  { bangumiID: 400602, lastEpisode: 17, metaInfo: null },
  { bangumiID: 413741, lastEpisode: 13, metaInfo: null },
  { bangumiID: 420628, lastEpisode: 12, metaInfo: null },
  { bangumiID: 348220, lastEpisode: 11, metaInfo: null },
  { bangumiID: 397808, lastEpisode: 12, metaInfo: null },
  { bangumiID: 404115, lastEpisode: 7, metaInfo: null },
]

function getFixedAnimeData(rawAnimes: AnimeThread[]): AnimeData[] {
  fixedAnimeExtraData.forEach((fixedAnime: any) => {
    const index = rawAnimes.findIndex((anime: AnimeThread) => anime.bangumiID === fixedAnime.bangumiID)
    rawAnimes[index] = { ...rawAnimes[index], ...fixedAnime }
  })
  return rawAnimes
}

// Storage Migrations

function addAnimesToSession(): SessionData {
  return { activeAnimeCount: threadQueries.length, animes: getFixedAnimeData(threadQueries) }
}

export async function initDB() {
  // const client = new MongoClient('mongodb://localhost:27017')
  // await client.connect()
  Logger.logProgress('Initializing database')
  const bot = db.bot
  if (!bot) {
    Logger.logError('Bot is not initialized')
    return
  }
  function initSession(): SessionData {
    return addAnimesToSession()
  }
  // const storageAdapter = freeStorage<SessionData>(botToken)
  const sessionMiddleware = session({ initial: initSession })
  db.bot?.use(sessionMiddleware)
}
