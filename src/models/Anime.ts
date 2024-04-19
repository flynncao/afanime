import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { ChronoUnit, LocalDate } from '@js-joda/core'
import type { Bot } from 'grammy'
import type { Image } from './Image.js'
import type { Rating } from './Rating.js'
import type { Episode } from './Episode.js'
import { useFetchBangumiEpisodesInfo, useFetchBangumiSubjectInfo } from '#root/api/bangumi.js'
import { useFetchNEP } from '#root/api/nep.js'
import type { IAnimeCritical } from '#root/types/index.js'
import { AnimeContext, IAnime, STATUS } from '#root/types/index.js'

import Logger from '#root/utils/logger.js'
import BotLogger from '#root/bot/logger.js'
import { getLocalAnimeDataByID } from '#root/modules/anime/index.js'
import { fetchBangumiSubjectInfoFromID } from '#root/modules/bangumi/index.js'

/**
 * MONGOOSE SCHEMAS
 */
@modelOptions({ options: {
  allowMixed: 0,
} })
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
  public current_episode!: number // newest episode shown in Telegram group

  @prop({ required: false, default: 0 })
  public last_episode!: number // newest espisode in the NEP database

  @prop({ required: false, enum: STATUS, default: STATUS.ARCHIVED })
  public status!: number
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

export const AnimeModel = getModelForClass(Anime)

/**
 *
 *
 * MODEL CONTROLLER & Implementations
 *
 *
 *
 */

export async function createNewAnime(anime: IAnimeCritical): Promise<any> {
  anime.status = STATUS.ARCHIVED
  return new AnimeModel(anime).save()
}

export async function readAnimes(): Promise<Anime[]> {
  return AnimeModel.find({})
}

export async function readSingleAnime(animeID: number): Promise<any> {
  return AnimeModel.findOne({ id: animeID })
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

export async function updateCurrentEpisode(id: number, current_episode: number) {
  return AnimeModel.findOneAndUpdate({ id }, {
    current_episode,
  })
}

export async function deleteAnime(id: number) {
  return AnimeModel.deleteOne({ id })
}
