import type { Context, SessionFlavor } from 'grammy'
import type { BangumiSubjectInfoResponseData } from './response.js'

export interface SessionData {
  activeAnimeCount: number
  animes?: AnimeData[]
}
export type AnimeContext = Context & SessionFlavor<SessionData>

export interface Command {
  command: string
  description: string
}

export interface AnimeThread {
  bangumiID: number
  title: string
  threadID: number
  debut: string
  query: string
}

export interface AnimeData extends AnimeThread {
  imageURL?: string
  lastEpisode?: number
  totalEpisodes?: number
  metaInfo?: BangumiSubjectInfoResponseData | null
}
