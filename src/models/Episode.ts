import { prop } from '@typegoose/typegoose'

export class Episode {
  @prop({ required: true })
  public id!: number

  @prop({ required: true })
  public bangumiID!: number

  @prop({ required: false })
  public name!: string

  @prop({ required: false })
  public name_cn!: string

  @prop({ required: false })
  public videoLink!: string

  @prop({ required: false })
  public pushed!: boolean
}
