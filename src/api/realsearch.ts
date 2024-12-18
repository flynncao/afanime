import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import type { TelegramMessageResponse } from '../types/response.js'
import { config } from '#root/config/index.js'

const realSearchAPI = config.realSearchAPI

const NEP_BASE_URL = realSearchAPI.uri
const NEP_TOKEN = realSearchAPI.token
export type possibleResult = TelegramMessageResponse | AxiosError
export async function useFetchNEP(word: string, page = 0): Promise<possibleResult> {
  return new Promise ((resolve: any, reject: any) => {
    console.log('NEP_BASE_URL', NEP_BASE_URL)
    axios.get(`${NEP_BASE_URL}/search/regular`, {
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
    axios.get(`https://search.acgn.es/api/schedule`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }).then((response: AxiosResponse<TelegramMessageResponse>) => {
      const { data } = response
      resolve(data)
    }).catch((error: AxiosError) => {
      reject(error)
    })
  })
}
