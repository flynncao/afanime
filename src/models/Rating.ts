import { prop } from '@typegoose/typegoose'

export class Rating {
  @prop({ required: true, default: 0 })
  public rank!: number

  @prop({ required: true, default: 0 })
  public total!: number

  @prop({ required: true, default: 0 })
  public score!: number
}
