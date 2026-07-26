import type { Api } from 'grammy'

/** Sends messages to the configured ops group chat (optionally into a topic thread). */
export interface Notifier {
  send: (message: string, otherConfig?: object) => Promise<unknown>
  sendToThread: (threadID: number, message: string, otherConfig?: object) => Promise<unknown>
}

export function createNotifier(api: Api, groupChatID: string): Notifier {
  return {
    send: (message, otherConfig) => api.sendMessage(groupChatID, message, otherConfig),
    sendToThread: (threadID, message, otherConfig) =>
      api.sendMessage(groupChatID, message, { ...otherConfig, message_thread_id: threadID }),
  }
}
