import { prop } from '@typegoose/typegoose'

export class Episode {
  @prop({ required: true, type: () => Number })
  public id!: number

  @prop({ required: true, type: () => Number })
  public bangumiID!: number

  @prop({ required: false, default: '', type: () => String })
  public name!: string

  @prop({ required: false, default: '', type: () => String })
  public name_cn!: string

  @prop({ required: false, default: '', type: () => String })
  public videoLink!: string

  @prop({ required: false, default: false, type: () => Boolean })
  public pushed!: boolean
}
