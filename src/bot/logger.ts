import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'

export default class BotLogger {
  static sendServerMessage = (message: string, otherConfig?: any): void => {
    const { bot } = store
    if (bot && process.env.USER_CHAT_ID)
      bot.api.sendMessage(process.env.USER_CHAT_ID, message, otherConfig)

    else
      Logger.logError('FATAL: Bot is not initialized or env file not found, cannot send message')
  }

  static sendServerMessageAsync = async (message: string, otherConfig?: any): Promise<void> => {
    const { bot } = store
    if (bot && process.env.USER_CHAT_ID)
      await bot.api.sendMessage(process.env.USER_CHAT_ID, message, otherConfig)

    else
      Logger.logError('FATAL: Bot is not initialized or env file not found, cannot send message')
  }
}
