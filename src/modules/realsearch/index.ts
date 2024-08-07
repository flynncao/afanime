import moment from 'moment'
import { useFetchSchedule } from '#root/api/realsearch.js'
import BotLogger from '#root/bot/logger.js'

export default function displayWeeklyScheduleFromRealsearch(weekday = -1) {
  useFetchSchedule().then((res) => {
    const timetable: string[][] = [[], [], [], [], [], [], []]
    const replaceCharAt = (str: string, index: number, char: string) => {
      if (index < 0 || index >= str.length) {
        throw new Error('Index out of bounds')
      }
      const strArray = str.split('')
      strArray[index] = char
      return strArray.join('')
    }

    res.data.forEach((item: any) => {
      const date: moment.Moment = moment.unix(item.date)
      const housouTime: string = replaceCharAt(date.format('HH:mm'), 4, '0')
      const housouWeekday: number = date.day()
      const mainName = item.name
      const enName = item.name_en
      if (weekday !== -1 && weekday !== housouWeekday)
        return
      timetable[housouWeekday].push(`${housouTime} | ${mainName} | ${enName}`)
    })
    console.log('timetable', timetable)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    let message = ''
    console.log('weekday', weekday)
    if (weekday === -1) {
      for (let i = 0; i < 7; i++) {
        message += `🎬${weekdays[i]}的放送表：\n`
        timetable[i].forEach((item) => {
          message += `${item}\n`
        })
      }
    }
    else {
      message += `🎬${weekdays[weekday]}的放送表：\n`
      timetable[weekday].forEach((item) => {
        message += `${item}\n`
      })
    }

    BotLogger.sendServerMessage(message)
  }).catch((error) => {
    console.log('=>(command-handler.ts:125) error', error)
  })
}
