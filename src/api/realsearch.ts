import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import type { TelegramMessageResponse } from '../types/response.js'
import { config } from '#root/config/index.js'

const realSearchAPI = config.realSearchAPI

// const NEP_BASE_URL = realSearchAPI.uri
const NEP_TOKEN = realSearchAPI.token
export type possibleResult = TelegramMessageResponse | AxiosError
export async function useFetchNEP(word: string, page = 0): Promise<possibleResult> {
  return new Promise ((resolve: any, reject: any) => {
    axios.get(`https://open-search.acgn.es/search/regular`, {
      headers: {
        Authorization: `Bearer ${NEP_TOKEN}`,
      },
      params: {
        cid: 0,
        page,
        limit: 24,
        word,
        sort: 'time',
      },
    }).then((response: AxiosResponse<TelegramMessageResponse>) => {
      const { data } = response
      resolve(data)
    }).catch((error: AxiosError) => {
      reject(error)
    })
  })
}

export async function useFetchSchedule(): Promise<any> {
  return new Promise ((resolve: any, reject: any) => {
    axios.get(`https://search.acgn.es/api/public/schedule/v2?rule_id=5`, {
      headers: {
        Authorization: `Bearer ${NEP_TOKEN}`,
      },
    }).then((response: AxiosResponse<TelegramMessageResponse>) => {
      const { data } = response
      resolve(data)
    }).catch((error: AxiosError) => {
      reject(error)
    })
  })
}
