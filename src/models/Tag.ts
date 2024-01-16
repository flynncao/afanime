import type { Ref } from '@typegoose/typegoose'
import { PropType, getModelForClass, prop } from '@typegoose/typegoose'

export class Tag {
  @prop({ required: true, default: '' })
  public name!: string

  @prop({ required: true, default: 0 })
  public count!: number
}
