import {useFetchSchedule} from "#root/api/realsearch.js";
import moment from "moment";
import store from "#root/databases/store.js";
import BotLogger from "#root/bot/logger.js";


export default function displayWeeklyScheduleFromRealsearch() {
    useFetchSchedule().then((res) => {
        const timetable: string[][] = [[], [], [], [], [], [], []]
        res.data.forEach((item: any) => {
            console.log('item.date', item.date)
            const date: moment.Moment = moment.unix(item.date)
            const housouTime: string = date.format('dddd HH:mm:ss')
            const housouWeekday: number = date.day()
            const mainName = item.name
            const enName = item.name_en
            timetable[housouWeekday].push(`${housouTime} | ${mainName} | ${enName}`)
        })
        console.log('timetable', timetable)
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        let message = ''
        for (let i = 0; i < timetable.length; i++) {
            message += `${weekdays[i]}\n`
            for (const item of timetable[i]) {
                  message += `${item}\n`
            }
            message += '----------------\n'
        }
        BotLogger.sendServerMessage(message)
    }).catch((error) => {
        console.log('=>(command-handler.ts:125) error', error)
    })

}