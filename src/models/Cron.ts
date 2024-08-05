import {getModelForClass, prop} from '@typegoose/typegoose'

export class Cron {
    @prop({ required: true })
    public key!: string

    @prop({ required: true })
    public value!: string

    @prop({ required: false, default: false })
    public enabled!: boolean
}

export const CronModel = getModelForClass(Cron)

// generate CRUD
export function getSingleCron(key: string) {
    return CronModel.findOne({ key })
}

export function updateSingleCron(key: string, value: string) {
    return CronModel.findOneAndUpdate({ key }, { value })
}

export function createNewCron(key: string, value: string) {
    return new CronModel({ key, value }).save()
}

export function deleteSingleCron(key: string) {
    return CronModel.deleteOne({ key })
}

export function readCrons() {
    return CronModel.find({})
}

export function readSingleCron(key: string) {
    return CronModel.findOne({ key })
}

export function updateSingleCronQuick(key: string, value: string) {
    return CronModel.updateOne({ key }, {
        value
    })
}