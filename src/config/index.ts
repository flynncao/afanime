import 'dotenv/config'
import { env } from 'node:process'
import Utilities from '../utils/index.js'

const envs = process.env
const values: Config = {
  botToken: '',
  groupChatID: '',
  mongodbURL: '',
  botName: '',
  translatorBlacklist: [],
  adminChatIDs: [],
  commandWhiteList: [],
  realSearchAPI: {
    uri: '',
    token: '',
  },
  proxyAddress: '',
}
export interface Config {
  botToken: string
  groupChatID: string
  mongodbURL: string
  botName: string
  translatorBlacklist?: string[]
  adminChatIDs?: string[]
  commandWhiteList?: string[]
  realSearchAPI: {
    uri: string
    token: string
  }
  proxyAddress: string
}

function calculateValue() {
  const requiredEnvKeys = ['BOT_TOKEN', 'GROUP_CHAT_ID', 'MONGO_DB_URL', 'REAL_SEARCH_TOKEN', 'REAL_SEARCH_URI'] as const

  // Type-safe environment mapping
  const envMapping = {
    botToken: 'BOT_TOKEN',
    groupChatID: 'GROUP_CHAT_ID',
    mongodbURL: 'MONGO_DB_URL',
    botName: 'BOT_NAME',
    translatorBlacklist: 'GROUP_BLACKLIST',
    adminChatIDs: 'ADMIN_CHAT_IDS',
    commandWhiteList: 'COMMAND_WHITE_LIST',
    proxyAddress: 'PROXY_ADDRESS',
  } as const

  // Helper function to split comma-separated strings
  const splitEnvValue = (value: string | undefined): string[] =>
    value ? value.split(',').map(item => item.trim()) : []

  // Assign values with proper type checking
  values.botToken = envs[envMapping.botToken] ?? values.botToken
  values.groupChatID = envs[envMapping.groupChatID] ?? values.groupChatID
  values.mongodbURL = envs[envMapping.mongodbURL] ?? values.mongodbURL
  values.botName = envs[envMapping.botName] ?? values.botName
  values.translatorBlacklist = splitEnvValue(envs[envMapping.translatorBlacklist])
  values.adminChatIDs = splitEnvValue(envs[envMapping.adminChatIDs])
  values.commandWhiteList = splitEnvValue(envs[envMapping.commandWhiteList])
  values.proxyAddress = envs[envMapping.proxyAddress] ?? values.proxyAddress

  // Handle realSearchAPI separately for better structure
  values.realSearchAPI = envs.REAL_SEARCH_TOKEN
    ? {
        uri: envs.REAL_SEARCH_URI ?? '',
        token: envs.REAL_SEARCH_TOKEN,
      }
    : {
        uri: '',
        token: '',
      }

  // Validate required environment variables
  const missingEnvs = requiredEnvKeys.filter(key => !envs[key])
  if (missingEnvs.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`)
  }

  console.log('Configuration loaded successfully:', values)
  return values
}

calculateValue()

export const config: Config = calculateValue()
