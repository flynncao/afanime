import type { Ref } from '@typegoose/typegoose'
import { PropType, getModelForClass, prop } from '@typegoose/typegoose'
import type { Image } from './Image.js'
import type { Rating } from './Rating.js'
import type { Episode } from './Episode.js'

export class Anime {
  /** Critical Information */
  @prop({ required: true, unique: true, index: true })
  public id!: string

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

export async function createNewAnime() {
  const anime = {
    id: 400602,
    threadID: 3,
    name_cn: '葬送的芙莉莲',
    query: 'KitaujiSub+北宇治字幕組+%7C+Sousou+no+Frieren+CHS_JP&sort=time&file_suffix=',
  }
  const anime2 = {
    id: 303186,
    threadID: 31,
    name_cn: '我推的孩子',
    query: 'KitaujiSub+北宇治字幕組+%7C+Sousou+no+Frieren+CHS_JP&sort=time&file_suffix=',
  }
  new AnimeModel(anime2).save().then((doc) => {
    console.log(doc)
  }).catch((err) => {
    console.log('err :>> ', err)
  })
}
