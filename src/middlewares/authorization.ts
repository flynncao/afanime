import type { Context, NextFunction } from 'grammy'
import { config } from '@/config/index.js'
/** Measures the response time of the bot, and logs it to `console` */
const restrictedCommands = ['dashboard', 'settings', 'info', 'create', 'dailytask', 'getid', 'meta', 'dailytask', 'weeklytask', 'cron', 'relation']
export default async function authorization(
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  let isAuthorized = true
  if (ctx.message) {
    const senderId = ctx.message.from?.id
    const message = ctx.message.text
    if (message && restrictedCommands.includes(`${message.trim().replace('/', '')}`)) {
      if (config.adminChatIDs && !config.adminChatIDs.includes(senderId.toString())) {
        isAuthorized = false
      }
    }
  }
  if (!isAuthorized) {
    ctx.reply('权限不足，请联系管理员！')
    return undefined
  }
  await next()
}
