import type { AxiosError, AxiosInstance, AxiosResponse, CreateAxiosDefaults } from 'axios'
import axios from 'axios'
import type { BangumiSubjectInfoResponseData, IEpisode } from '#root/types/response.js'
import Logger from '#root/utils/logger.js'
import { updateSingleAnimeQuick } from '#root/models/Anime.js'
import type { AnimeContext } from '#root/types/index.js'

/**
 * AXIOS INSTANCES
 */
const BANGUMI_BASE_URL = 'https://api.bgm.tv'

const axiosInstanceConfig: CreateAxiosDefaults = {
  baseURL: BANGUMI_BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  // validateStatus(status) {
  //   return status === 200
  // },
}

const axiosInstanceRquestInterceptors = [(config: any) => {
  return config
}, (error: AxiosError) => {
  Logger.logError(`Bangumi API error:${error.message}`)
  return Promise.reject(new Error(`Bangumi API request error`))
}]

const axiosInstanceResponseInterceptors = [(response: AxiosResponse) => {
  return response
}, (error: AxiosError) => {
  Logger.logError(`Bangumi API error:${error.message}`)
  return Promise.reject(new Error(`Bangumi API error`))
}]

type HTTP_REQUEST_TYPE = 'get' | 'post' | 'put' | 'delete' | 'patch'
class DedicatedAxios {
  private instance: AxiosInstance
  private url?: string
  private namespace: string
  constructor(config?: CreateAxiosDefaults, requestInterceptors?: any, responseInterceptors?: any, namespace?: string) {
    this.instance = axios.create(config)
    if (requestInterceptors)
      this.instance.interceptors.request.use(requestInterceptors)

    if (responseInterceptors)
      this.instance.interceptors.response.use(responseInterceptors[0], responseInterceptors[1])

    this.namespace = `${namespace} API` || 'API'
  }

  private reset(url: string) {
    this.url = url
  }

  private async sendRequest(type: HTTP_REQUEST_TYPE, userParams?: object, userBody?: object) {
    return new Promise((resolve, reject) => {
      this.instance({
        method: type,
        url: this.url,
        params: userParams,
        data: userBody,
      }).then((res: AxiosResponse) => {
        resolve(res)
      }).catch((err: AxiosError) => {
        reject(err)
      })
    })
  }

  public async get(url: string, params?: any) {
    this.reset(url)
    return this.sendRequest('get', params)
  }

  public async post(params?: any) {
  }

  public async put(params?: any) {
    return this.sendRequest('put', params)
  }
}

const dedicatedAxios = new DedicatedAxios(axiosInstanceConfig, axiosInstanceRquestInterceptors, axiosInstanceResponseInterceptors)

/**
 * APIS
 */

export async function useFetchBangumiSubjectInfo(subject_id: number): Promise<BangumiSubjectInfoResponseData> {
  return new Promise ((resolve: any, reject: any) => {
    dedicatedAxios.get(`/v0/subjects/${subject_id}`, {
    }).then((res: any) => {
      const { data } = res
      Logger.logInfo(`useFetchBangumiSubjectInfo->data: ${data}`)
      resolve(data)
    }).catch((error: AxiosError) => {
      reject(error)
    })
  })
}
// weekly: update subject and episode info; daily: update episode info only
export async function useFetchBangumiEpisodesInfo(id: number, ctx?: AnimeContext, dailyTask: boolean = false): Promise<string | IEpisode[] | Promise<any>> {
  return new Promise((resolve, reject) => {
    dedicatedAxios.get(`/v0/episodes`, {
      subject_id: id,
      type: 0,
      limit: 100,
      offset: 0,
    }).then((res: any): any => {
      if (res?.data?.data?.length === 0)
        reject(new Error('没有找到剧集信息，是否是未开播番剧？'))

      const localEpisodes: IEpisode[] = []
      for (const item of res?.data?.data) {
        localEpisodes.push({
          id: item.id,
          name: item.name,
          name_cn: item.name_cn,
          videoLink: '',
          pushed: false,
        })
      }
      if (dailyTask === false) {
        // DEFAULT: return episodes info only
        resolve(localEpisodes)
      }
      else {
        updateSingleAnimeQuick(id, { episodes: localEpisodes }).then((res) => {
          if (ctx) {
            ctx.session.message = '更新成功'
            resolve(ctx.session.message)
          }
        }).catch((err: any) => {
          Logger.logError(`更新本地数据库失败: ${err}`)
          if (ctx)
            ctx.session.message = err?.message ? err?.message : '更新本地数据库失败'
          reject(err)
        })
      }
    }).catch((resInterceptorError: AxiosError) => {
      reject(new Error(`Bangumi API error: ${resInterceptorError.message}`))
    })
  })
}
