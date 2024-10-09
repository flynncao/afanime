import { config } from '@/config/index.js'

export function isAdminChatID(senderId: number): boolean {
  return !!(config.adminChatIDs && config.adminChatIDs.includes(senderId.toString()))
}
