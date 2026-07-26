import { prop } from '@typegoose/typegoose'

export class Rating {
  @prop({ required: true, default: 0, type: () => Number })
  public rank!: number

  @prop({ required: true, default: 0, type: () => Number })
  public total!: number

  @prop({ required: true, default: 0, type: () => Number })
  public score!: number
}
