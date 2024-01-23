import type { Ref } from '@typegoose/typegoose'
import { PropType, getModelForClass, prop } from '@typegoose/typegoose'

export class Image {
  @prop({ required: true })
  public bangumiID!: number

  @prop({ required: true, default: '' })
  public small!: string

  @prop({ required: true, default: '' })
  public great!: string

  @prop({ required: true, default: '' })
  public large!: string

  @prop({ required: true, default: '' })
  public medium!: string

  @prop({ required: true, default: '' })
  public common!: string
}
