import type { Notifier } from '#root/bot/notifier.js'
import type { AnimeContext } from '#root/types/index.js'
import { getSchedule } from '#root/api/realsearch.js'
import { isAdminChatID } from '#root/modules/user/index.js'
import Logger from '#root/utils/logger.js'

/** HH:mm in the process timezone (TZ=Asia/Shanghai in the container) */
function formatTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function displayWeeklyScheduleFromRealsearch(weekday: number, notifier: Notifier, ctx?: AnimeContext) {
  getSchedule().then((res) => {
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
      // compare based on their daily schedule like 00:00 > 13:00, not actual date
      (a, b) => formatTime(a.date_start) < formatTime(b.date_start) ? -1 : 1,
    ).forEach((item) => {
      const housouDate = new Date((item.date_end ?? 0) * 1000)
      const housouTime: string = replaceCharAt(formatTime(item.date_end ?? 0), 4, '0')
      const housouWeekday: number = housouDate.getDay()
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
      notifier.send(message, {
        parse_mode: 'MarkdownV2',
      })
    }
  }).catch((error) => {
    Logger.logError('displayWeeklyScheduleFromRealsearch failed:', error)
  })
}
