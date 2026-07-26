import { getConfig } from '#root/config/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'

export default class BotLogger {
  static sendServerMessage = (message: string, otherConfig?: any): void => {
    const { bot } = store
    const { groupChatID } = getConfig()
    if (bot && groupChatID)
      bot.api.sendMessage(groupChatID, message, otherConfig)

    else
      Logger.logError('FATAL: Bot is not initialized or env file not found, cannot send message')
  }

  static sendServerMessageAsync = (message: string, otherConfig?: any, getInstance: boolean = false): Promise<any> | void => {
    const { bot } = store
    const { groupChatID } = getConfig()
    if (bot && groupChatID) {
      if (!getInstance)
        bot.api.sendMessage(groupChatID, message, otherConfig)
      else
        return bot.api.sendMessage(groupChatID, message, otherConfig)
    }
    else {
      Logger.logError('FATAL: Bot is not initialized or env file not found, cannot send message')
    }
  }
}
