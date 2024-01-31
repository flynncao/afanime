import { getModelForClass, prop } from '@typegoose/typegoose'
import { ChronoUnit, LocalDate } from '@js-joda/core'
import type { Bot } from 'grammy'
import type { Image } from './Image.js'
import type { Rating } from './Rating.js'
import type { Episode } from './Episode.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import store from '#root/databases/store.js'
import type { possibleResult } from '#root/api/nep.js'
import { useFetchNEP } from '#root/api/nep.js'
import { extractEpisodeNumber } from '#root/utils/string.js'
import type { AnimeContext } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import type { IEpisode } from '#root/types/response.js'
import BotLogger from '#root/bot/logger.js'

/**
 * EVERYDAY TYPES
 */
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

/**
 * MONGOOSE SCHEMAS
 */
export class Anime {
  /** Critical Information */
  @prop({ required: true, unique: true, index: true })
  public id!: number

  @prop({ required: true })
  public name_cn!: string

  @prop({ required: true })
  public query!: string

  @prop({ required: true })
  public threadID!: number

  /** Basic  Information */
  @prop({ required: false, default: null })
  public images?: Image

  @prop({ required: false, default: '' })
  public summary!: string

  @prop({ required: false, default: '' })
  public name!: string

  @prop({ required: false, default: 'TV' })
  public platform!: string

  /** Progress Mangement */
  @prop({ required: false, default: 0 })
  public total_episodes!: number

  @prop({ required: false, default: 0 })
  public current_episode!: number

  @prop({ required: false, default: 0 })
  public last_episode!: number

  @prop({ required: false, enum: STATUS, default: STATUS.ARCHIVED })

  public status!: STATUS
  /** Additional Information */

  @prop({ required: false, default: null })
  public rating?: Rating

  @prop({ required: false, default: null })
  public episodes?: Episode[]

  /** Required: False */
  @prop({ required: false })
  public date!: string

  @prop({ required: false })
  public active!: boolean

  @prop({ required: false })
  public eps!: number

  @prop({ required: false })
  public volumes!: number

  @prop({ required: false })
  public locked!: boolean

  @prop({ required: false })
  public nsfw!: boolean
}

const AnimeModel = getModelForClass(Anime)

/**
 *
 *
 * MODEL CONTROLLER
 *
 *
 *
 */

export async function createNewAnime(anime: IAnimeCritical): Promise<any> {
  anime.status = STATUS.ARCHIVED
  return new AnimeModel(anime).save()
}
export async function updateAnimeMetaAndEpisodes(animeID: number, successMessage: string = '更新成功'): Promise<any> {
  return new Promise((resolve, reject) => {
    let updatedAnime: any = null
    // p1
    const readSingleAnimePromise = () => readSingleAnime(animeID).then((data) => {
      updatedAnime = data
      console.log('p1: updatedAnime :>> ', updatedAnime)
      return Promise.resolve()
    }).catch((err) => {
      Logger.logError(`p1: ${err}`)
      return Promise.reject(err)
    })
    // p2
    const fetchBangumiSubjectInfoPromise = () => useFetchBangumiSubjectInfo(animeID).then(async (subjectInfo) => {
      console.log('p2 start')
      const needUpdateBangumiEpisodeInfo = updatedAnime.episodes.length === 0
      console.log('subjectInfo :>> ', subjectInfo)
      console.log('needUpdateBangumiEpisodeInfo start :>> ', needUpdateBangumiEpisodeInfo)
      if (store.clock && subjectInfo.date) {
        const timeDistancebyDay = LocalDate.parse(subjectInfo.date).until(store.clock.now(), ChronoUnit.DAYS)
        updatedAnime.status = timeDistancebyDay >= 0 ? STATUS.AIRED : STATUS.UNAIRED
      }
      console.log('p2: updatedAnime :>> ', updatedAnime)
      if (needUpdateBangumiEpisodeInfo) {
        console.log('start fetching episodes info from bangumi...')
        return useFetchBangumiEpisodesInfo(animeID).then((res) => {
          const localEpisodes: any = res
          console.log('localEpisodes in updating meta:>> ', localEpisodes)
          updatedAnime.episodes = localEpisodes
          console.log('updatedAnime :>> ', updatedAnime)
        })
      }
      else {
        delete updatedAnime.episodes
        console.log('p2 NO NEED: updatedAnime :>> ', updatedAnime)

        return Promise.resolve()
      }
    }).catch((err) => {
      Logger.logError(`p2: ${err}`)
      return Promise.reject(err)
    })
    // p3
    const findOneAndUpdatePromise = () => AnimeModel.findOneAndUpdate({ id: animeID }, updatedAnime).then((res) => {
      console.log('DB res :>> ', res)
      return Promise.resolve()
    }).catch((err) => {
      Logger.logError(`p3: ${err}`)
      return Promise.reject(err)
    })
    const promiseArr: any = [readSingleAnimePromise, fetchBangumiSubjectInfoPromise, findOneAndUpdatePromise]
    function runSequentially(promiseArr: Promise<any>[]) {
      return promiseArr.reduce((accum, p: any) => accum.then(p), Promise.resolve())
    }
    runSequentially(promiseArr).then(() => {
      Logger.logSuccess(`All done`)
      resolve(successMessage)
    }).catch((err) => {
      Logger.logError(`更新失败: ${err}`)
      reject(err)
    })
  })
}

export async function updateSingleAnimeQuick(animeID: number, anime: any, successMessage: string = '更新成功'): Promise<any> {
  return new Promise((resolve, reject) => {
    AnimeModel.updateOne({
      id: animeID,
    }, anime).then((res) => {
      Logger.logSuccess(`更新成功: ${res}`)
      resolve(successMessage)
    }).catch((err) => {
      reject(err)
    })
  })
}

export async function readAnimes(): Promise<Anime[]> {
  return AnimeModel.find({})
}

export async function readSingleAnime(animeID: number): Promise<any> {
  return AnimeModel.findOne({ id: animeID })
}

export async function updateCurrentEpisode(id: number, current_episode: number) {
  return AnimeModel.findOneAndUpdate({ id }, {
    current_episode,
  })
}

/**
 *
 *
 * MENU & CONVERSATION & MESSAGES SERVICES
 *
 *
 */
// MENU ACTION1: Update Subject and Episode info from bangumi
export async function fetchAndUpdateAnimeMetaInfo(animeID: number): Promise<string> {
  return new Promise((resolve) => {
    updateAnimeMetaAndEpisodes(animeID, '更新动画元信息及剧集成功').then((res) => {
      console.log('updateAnimeMetaAndEpisodes --- res :>> ', res)
      resolve('更新动画元信息及剧集成功')
    }).catch(() => {
      resolve('更新动画元信息及剧集失败')
    })
  })
}
// MENU ACTION2: Update Episode info only from bangumi
export async function fetchAndUpdateAnimeEpisodesInfo(animeID: number, ctx?: AnimeContext): Promise<string | Error> {
  return new Promise((resolve, reject) => {
    readSingleAnime(animeID).then((anime) => {
      const query: string = anime?.query
      const threadID: number = anime?.threadID
      const last_episode: number = anime?.last_episode
      const name = anime?.name_cn
      const episodes = anime?.episodes
      if (!episodes || episodes.length === 0)
        reject(new Error('本地数据库中没有剧集信息，请查询番剧是否开通，或者使用菜单中的【拉取Bangumi剧集信息】功能'))
      if (query && threadID && last_episode >= 0 && name) {
        useFetchNEP(query).then((res: possibleResult) => {
          // TODO: (refactor) use subDocument (ref) for better performance
          if (!('data' in res) || res.data.length === 0)
            return reject(new Error('讀取動畫倉庫時發生錯誤！'))

          let maxInNEP = 0
          for (let i = (res.data.length - 1); i >= 0; i--) {
            const item = res.data[i]
            const episodeNum = extractEpisodeNumber(item.text)
            if (episodeNum !== null && episodeNum > maxInNEP) {
              maxInNEP = episodeNum // update ready for last episode
              const isValid = item.link && item.link !== ''
              episodes[episodeNum - 1].videoLink = isValid ? item.link : ''
              if (isValid)
                episodes[episodeNum - 1].pushed = true
            }
          }
          if (last_episode === maxInNEP) {
            resolve(`${name} 无需更新!`)
          }
          else {
            const pushList: any[] = []
            // TODO: (error) avoid sending too many messages
            // GrammyError: Call to 'sendMessage' failed! (429: Too Many Requests: retry after 5)
            for (let i = last_episode === 0 ? 1 : last_episode; i <= maxInNEP; i++) {
              pushList.push({
                link: episodes[i - 1].videoLink,
                pushEpisodeNum: i,
              })
            }
            updateSingleAnimeQuick(animeID, { episodes, last_episode: maxInNEP, status: (last_episode === anime.total_episodes ? STATUS.COMPLETED : STATUS.AIRED) }).then((res) => {
              console.log('pushList :>> ', pushList)
              Logger.logSuccess(`更新成功: ${res}`)
              if (pushList.length !== 0) {
                if (!ctx) {
                  for (const item of pushList) {
                    BotLogger.sendServerMessage(item, {
                      message_thread_id: threadID,
                    })
                  }
                  resolve('进度管理更新成功,自动推送中...')
                }
                else {
                  store.pushCenter.list = pushList
                  store.pushCenter.threadID = threadID
                  resolve('进度管理更新成功,手动推送中...')
                }
              }
            }).catch((err) => {
              Logger.logError(`更新失败: ${err}`)

              reject(err)
            })
          }
        }).catch((err) => {
          Logger.logError(`更新失败: ${err}`)
          reject(err)
        })
      }
      else {
        reject(new Error('不合理的查询语句，话题ID或进度管理信息'))
      }
    }).catch((err) => {
      Logger.logError(`更新失败: ${err}`)
      reject(err)
    })
  })
}
