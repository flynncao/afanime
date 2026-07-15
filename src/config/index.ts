import 'dotenv/config'

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
  }
  proxyAddress?: string
}

function calculateValue() {
  const requiredEnvKeys = ['BOT_TOKEN', 'GROUP_CHAT_ID', 'MONGO_DB_URL', 'REAL_SEARCH_URI'] as const

  // Type-safe environment mapping
  const envMapping = {
    botToken: 'BOT_TOKEN',
    groupChatID: 'GROUP_CHAT_ID',
    mongodbURL: 'MONGO_DB_URL',
    botName: 'BOT_NAME',
    translatorBlacklist: 'TRANSLATOR_BLACK_LIST',
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
  // Normalize URI by stripping trailing slashes to avoid double slashes when building request URLs
  values.realSearchAPI = {
    uri: (envs.REAL_SEARCH_URI ?? '').replace(/\/+$/, ''),
  }

  // Validate required environment variables
  const missingEnvs = requiredEnvKeys.filter(key => !envs[key])
  if (missingEnvs.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`)
  }

  return values
}

export const config: Config = calculateValue()
