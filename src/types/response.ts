export interface TelegramMessageResponse {
  data: TelegramMessageResponseData[]
  code: number

}

interface TelegramMessageResponseData {
  id: number
  channel_id: number
  channel_name: string
  size: number
  text: string
  file_suffix: string
  msg_id: number
  supports_streaming: boolean
  link: string
  date: number
}

export interface BangumiSubjectInfoResponseData {
  date: string
  platform: string
  images: Images
  summary: string
  name: string
  name_cn: string
  tags: Tag[]
  infobox: Infobox[]
  rating: Rating
  total_episodes: number
  collection: Collection
  id: number
  eps: number
  volumes: number
  locked: boolean
  nsfw: boolean
  type: number
  episodes: IEpisode[]
}

export interface IEpisode {
  id: number
  bangumiID: number
  name: string
  name_cn: string
  videoLink: string
  pushed: boolean
}

interface Collection {
  on_hold: number
  dropped: number
  wish: number
  collect: number
  doing: number
}

interface Rating {
  rank: number
  total: number
  count: Count
  score: number
}

interface Count {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
  '6': number
  '7': number
  '8': number
  '9': number
  '10': number
}

interface Infobox {
  key: string
  value: Value[] | string
}

interface Value {
  v: string
}

interface Tag {
  name: string
  count: number
}

interface Images {
  small: string
  grid: string
  large: string
  medium: string
  common: string
}
