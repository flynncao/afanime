import type { IAnimeCritical } from '#root/types/index.js'
import type { Episode } from './Episode.js'
import type { Image } from './Image.js'
import type { Rating } from './Rating.js'
import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import mongoose from 'mongoose'
import { STATUS } from '#root/types/index.js'

/**
 * MONGOOSE SCHEMAS
 *
 * All @prop declarations carry an explicit `type` so the schema no longer
 * depends on emitDecoratorMetadata (which esbuild/tsx/vitest cannot emit).
 * images/rating/episodes are deliberately Mixed: that is what the reflected
 * schema always was (type-only class imports were never reflectable), and
 * changing them to real subdocuments would alter persisted behavior.
 * Guarded by tests/unit/schema-shape.test.ts against a pre-change baseline.
 */
const Mixed = mongoose.Schema.Types.Mixed

@modelOptions({ options: {
  allowMixed: 0,
} })
export class Anime {
  /** Critical Information */
  @prop({ required: true, unique: true, index: true, type: () => Number })
  public id!: number

  @prop({ required: true, type: () => String })
  public name_cn!: string

  @prop({ required: true, type: () => String })
  public query!: string

  @prop({ required: true, type: () => Number })
  public threadID!: number

  /** Basic  Information */
  @prop({ required: false, default: null, type: () => Mixed })
  public images?: Image

  @prop({ required: false, default: '', type: () => String })
  public summary!: string

  @prop({ required: false, default: '', type: () => String })
  public name!: string

  @prop({ required: false, default: 'TV', type: () => String })
  public platform!: string

  /** Progress Mangement */
  @prop({ required: false, default: 0, type: () => Number })
  public total_episodes!: number

  @prop({ required: false, default: 0, type: () => Number })
  public current_episode!: number // newest episode shown in Telegram group

  @prop({ required: false, default: 0, type: () => Number })
  public last_episode!: number // newest espisode in the NEP database

  @prop({ required: false, enum: STATUS, default: STATUS.ARCHIVED, type: () => Number })
  public status!: number

  @prop({ required: false, default: 1, type: () => Number })
  public eps!: number

  /** Additional Information */

  @prop({ required: false, default: null, type: () => Mixed })
  public rating?: Rating

  @prop({ required: false, default: null, type: () => Array })
  public episodes?: Episode[]

  @prop({ required: false, default: '', type: () => String })
  public name_phantom?: string

  /** Required: False */
  @prop({ required: false, type: () => String })
  public date!: string

  @prop({ required: false, type: () => Boolean })
  public active!: boolean

  @prop({ required: false, type: () => Number })
  public volumes!: number

  @prop({ required: false, type: () => Boolean })
  public locked!: boolean

  @prop({ required: false, type: () => Boolean })
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
