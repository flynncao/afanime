import { prop } from '@typegoose/typegoose'

export class Tag {
  @prop({ required: true, default: '' })
  public name!: string

  @prop({ required: true, default: 0 })
  public count!: number
}
