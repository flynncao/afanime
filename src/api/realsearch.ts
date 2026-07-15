import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import type { TelegramMessageResponse } from '../types/response.js'
import { config } from '#root/config/index.js'

const realSearchAPI = config.realSearchAPI

export type possibleResult = TelegramMessageResponse | AxiosError
export async function useFetchNEP(word: string, page = 0): Promise<possibleResult> {
  return new Promise ((resolve: any, reject: any) => {
    axios.get(`${realSearchAPI.uri}/api/`, {
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
    axios.get(`${realSearchAPI.uri}/api/public/schedule/v2?rule_id=5`)
      .then((response: AxiosResponse<TelegramMessageResponse>) => {
        const { data } = response
        resolve(data)
      }).catch((error: AxiosError) => {
        reject(error)
      })
  })
}
