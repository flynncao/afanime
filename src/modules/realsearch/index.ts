import moment from 'moment'
import { Context } from 'grammy'
import { useFetchSchedule } from '#root/api/realsearch.js'
import { isAdminChatID } from '@/modules/user/index.js'
import BotLogger from '#root/bot/logger.js'
import type { AnimeContext } from '#root/types/index.js'

export default function displayWeeklyScheduleFromRealsearch(weekday = -1, ctx?: AnimeContext) {
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
    const escapeMarkdownV2 = (text: string) => {
      return text.replace(/([_*[\]()~`>#+=\-|{}.!])/g, '\\$1')
    }
    res.data.sort(
      (a, b) => {
        // compare based on their daily schedule like 00:00 > 13:00, not actual date
        const aDate = moment.unix(a.date_start).format('HH:mm')
        const bDate = moment.unix(b.date_start).format('HH:mm')
        if (aDate < bDate) {
          return -1
        }
        else {
          return 1
        }
      },
    ).forEach((item: any) => {
      const housouDate = moment.unix(item.date_end)
      const housouTime: string = replaceCharAt(housouDate.format('HH:mm'), 4, '0')
      const housouWeekday: number = housouDate.day()
      const cnName = item.name_cn
      // const jpName = item.name
      const status = item.status
      if (weekday !== -1 && weekday !== housouWeekday)
        return
      const name = escapeMarkdownV2(cnName)
      const isSuspended = status === 'suspended'
      const isNew = status === 'new'
      const title = `${isSuspended ? '~' : ''}${housouTime} \\- **${name}**${isSuspended ? '~' : ''} ${isNew ? '🆕' : ''}`
      timetable[housouWeekday].push(title)
    })
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    let message = ''
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
    if (ctx && ctx.message && !isAdminChatID(ctx.message.from.id)) {
      ctx.reply(message)
    }
    else {
      BotLogger.sendServerMessage(message, {
        parse_mode: 'MarkdownV2',
      })
    }
  }).catch((error) => {
    console.log('=>(command-handler.ts:125) error', error)
  })
}
