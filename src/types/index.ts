import type {
  Conversation,
  ConversationFlavor,
} from '@grammyjs/conversations'
import type { Context, SessionFlavor } from 'grammy'

export interface SessionData {
  /** anime currently being operated on via the dashboard menus (per chat) */
  operatingAnimeID?: number
  /** dashboard filter: show all animes instead of only airing ones */
  dashboardShowAll?: boolean
}
/** Context outside conversations (has ctx.conversation.enter) */
export type AnimeContext = ConversationFlavor<Context & SessionFlavor<SessionData>>
/** Context inside conversation builder functions */
export type AnimeConversationContext = Context

export type AnimeConversation = Conversation<AnimeContext, AnimeConversationContext>

export interface Command {
  command: string
  description: string
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
  episodes?: IEpisode[]
  name_phantom?: string

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

export interface IEpisode {
  id: number
  name: string
  name_cn: string
  videoLink: string
  pushed: boolean
}
