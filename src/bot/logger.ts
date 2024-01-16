import store from '#root/databases/store.js'

export default class BotLogger {
  static sendServerMessage = (message: string, ...args: any[]): void => {
    const { bot } = store
    if (bot && process.env.USER_CHAT_ID)
      bot.api.sendMessage(process.env.USER_CHAT_ID, message, ...args)
  }
}
