import 'dotenv/config'

const envs = process.env
const value: Config = {
  botToken: '',
  groupChatID: '',
  mongodbURL: '',
}
export interface Config {
  botToken: string
  groupChatID: string
  mongodbURL: string
  botName?: string
  translatorBlacklist?: string[]
  adminChatIDs?: string[]
  commandWhiteList?: string[]
}

function calculateValue() {
  const botToken: string | undefined = envs.BOT_TOKEN
  const groupChatID: string | undefined = envs.GROUP_CHAT_ID
  const botName: string | undefined = envs.BOT_NAME
  const translatorBlacklist: string | undefined = envs.GROUP_BLACKLIST
  const mongodbURL: string | undefined = envs.MONGO_DB_URL
  const adminChatIDs: string | undefined = envs.ADMIN_CHAT_IDS
  if (!botToken || !groupChatID || !mongodbURL) {
    throw new Error('Environment variables: Bot token, group chat ID and mongoDB url cannot be empty')
  }
  value.botToken = botToken
  value.groupChatID = groupChatID
  value.mongodbURL = mongodbURL
  if (botName)
    value.botName = botName
  if (translatorBlacklist)
    value.translatorBlacklist = translatorBlacklist.split(',')
  if (adminChatIDs)
    value.adminChatIDs = adminChatIDs.split(',')
}

calculateValue()

export const config: Config = value

// export const setConfig = (env: Record<string, any>) => {
//     envs = Object.assign(process.env, env);
//     calculateValue();
// };
