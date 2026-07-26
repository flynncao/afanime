import type { Context, NextFunction } from 'grammy'
import { getConfig } from '#root/config/index.js'

/** Commands only admins (config.adminChatIDs) may run. */
const restrictedCommands = ['dashboard', 'settings', 'info', 'create', 'dailytask', 'getid', 'meta', 'weeklytask', 'cron']
export default async function authorization(
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  let isAuthorized = true
  if (ctx.message) {
    const senderId = ctx.message.from?.id
    const message = ctx.message.text
    if (message && restrictedCommands.includes(`${message.trim().replace('/', '')}`)) {
      const { adminChatIDs } = getConfig()
      if (adminChatIDs.length > 0 && !adminChatIDs.includes(senderId.toString())) {
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
