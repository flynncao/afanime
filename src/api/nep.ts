import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import type { TelegramMessageResponse } from '../types/response.js'

const NEP_BASE_URL = 'https://search.acgn.es/api/'

export type possibleResult = TelegramMessageResponse | AxiosError
export async function useFetchNEP(word: string, page = 0): Promise<possibleResult> {
  return new Promise ((resolve: any, reject: any) => {
    axios.get(NEP_BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      params: {
        cid: 1,
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
