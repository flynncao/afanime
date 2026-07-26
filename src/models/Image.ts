import { prop } from '@typegoose/typegoose'

export class Image {
  @prop({ required: true, type: () => Number })
  public bangumiID!: number

  @prop({ required: true, default: '', type: () => String })
  public small!: string

  @prop({ required: true, default: '', type: () => String })
  public great!: string

  @prop({ required: true, default: '', type: () => String })
  public large!: string

  @prop({ required: true, default: '', type: () => String })
  public medium!: string

  @prop({ required: true, default: '', type: () => String })
  public common!: string
}
