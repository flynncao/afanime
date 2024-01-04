import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import type { BangumiSubjectInfoResponseData } from '#root/types/response.js'

const BANGUMI_BASE_URL = 'https://api.bgm.tv'

export async function useFetchBangumiSubjectInfo(subject_id: number): Promise<BangumiSubjectInfoResponseData> {
  return new Promise ((resolve: any, reject: any) => {
    axios.get(`${BANGUMI_BASE_URL}/v0/subjects/${subject_id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }).then((response: AxiosResponse<BangumiSubjectInfoResponseData>) => {
      const { data } = response
      resolve(data)
    }).catch((error: AxiosError) => {
      reject(error)
    })
  })
}
