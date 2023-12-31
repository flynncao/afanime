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
