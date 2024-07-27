import {useFetchSchedule} from "#root/api/realsearch.js";
import moment from "moment";


export default function displayWeeklyScheduleFromRealsearch(){
    useFetchSchedule().then((res) => {
        const timetable: string[][] = [[], [], [], [],[],[],[]]
        const weeklyScheduleListFormatted = res.data.forEach((item: any) => {
            console.log('item.date', item.date)
            const date: moment.Moment = moment.unix(item.date)
            const housouTime: string = date.format('dddd HH:mm:ss')
            const housouWeekday: number = date.day()
            const mainName = item.name
            const enName = item.name_en
            timetable[housouWeekday].push(`${housouTime} | ${mainName} | ${enName}`)
        })
        console.log('timetable', timetable)

    }).catch((error) => {
        console.log('=>(command-handler.ts:125) error', error)
    })

}