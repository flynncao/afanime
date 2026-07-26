import { getConfig } from '#root/config/index.js'

export function isAdminChatID(senderId: number): boolean {
  const { adminChatIDs } = getConfig()
  return adminChatIDs.includes(senderId.toString())
}
