import type { Context, SessionFlavor } from 'grammy'
import type {
  Conversation,
  ConversationFlavor,
} from '@grammyjs/conversations'
import type { BangumiSubjectInfoResponseData } from './response.js'

export interface SessionData {
  activeAnimeCount: number
  animes?: AnimeData[]
  message?: string
}
export type AnimeContext = Context & SessionFlavor<SessionData> & ConversationFlavor

export type AnimeConversation = Conversation<AnimeContext>

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

export enum STATUS {
  UNAIRED = 0,
  AIRED = 1,
  COMPLETED = 2,
  ARCHIVED = 3,
}

export interface IAnimeCritical {
  id: number
  name_cn: string
  query: string
  threadID: number
  status?: STATUS
}

export interface IAnime {
  /** Critical Information */
  id: number
  name_cn: string
  query: string
  threadID: number

  /** Basic Information */
  images?: IImage
  summary: string
  name: string
  platform: string

  /** Progress Management */
  total_episodes: number
  current_episode: number
  last_episode: number
  status: STATUS

  /** Additional Information */
  rating?: IRating
  episodes?: any[]

  /** Required: False */
  date?: string
  active?: boolean
  eps?: number
  volumes?: number
  locked?: boolean
  nsfw?: boolean

}

export interface IRating {
  rank: number

  total: number

  score: number
}

export interface IImage {
  bangumiID: number
  small: string
  great: string
  large: string
  medium: string
  common: string
}
