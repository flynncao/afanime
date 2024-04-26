import { prop } from '@typegoose/typegoose'

export class Episode {
  @prop({ required: true })
  public id!: number

  @prop({ required: true })
  public bangumiID!: number

  @prop({ required: false, default: '' })
  public name!: string

  @prop({ required: false, default: '' })
  public name_cn!: string

  @prop({ required: false, default: '' })
  public videoLink!: string

  @prop({ required: false, default: false })
  public pushed!: boolean
}
