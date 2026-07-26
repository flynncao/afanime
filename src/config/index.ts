export interface Config {
  botToken: string
  groupChatID: string
  mongodbURL: string
  botName: string
  translatorBlacklist: string[]
  adminChatIDs: string[]
  commandWhiteList: string[]
  realSearchAPI: {
    uri: string
  }
  proxyAddress?: string
}

/**
 * Pure: reads only the env object it is given and throws on missing keys
 * when called — never at import time, so modules stay importable in tests.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const requiredEnvKeys = ['BOT_TOKEN', 'GROUP_CHAT_ID', 'MONGO_DB_URL', 'REAL_SEARCH_URI'] as const
  const missingEnvs = requiredEnvKeys.filter(key => !env[key])
  if (missingEnvs.length > 0)
    throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`)

  const splitEnvValue = (value: string | undefined): string[] =>
    value ? value.split(',').map(item => item.trim()) : []

  return {
    botToken: env.BOT_TOKEN!,
    groupChatID: env.GROUP_CHAT_ID!,
    mongodbURL: env.MONGO_DB_URL!,
    botName: env.BOT_NAME ?? '',
    translatorBlacklist: splitEnvValue(env.TRANSLATOR_BLACK_LIST),
    adminChatIDs: splitEnvValue(env.ADMIN_CHAT_IDS),
    commandWhiteList: splitEnvValue(env.COMMAND_WHITE_LIST),
    // Strip trailing slashes to avoid double slashes when building request URLs
    realSearchAPI: {
      uri: (env.REAL_SEARCH_URI ?? '').replace(/\/+$/, ''),
    },
    proxyAddress: env.PROXY_ADDRESS ?? '',
  }
}

let cached: Config | undefined

/** Loads .env and validates on first use. */
export function getConfig(): Config {
  if (!cached) {
    // Load .env if present; env vars may also come from the runtime (Docker, CI).
    try {
      process.loadEnvFile()
    }
    catch {}
    cached = loadConfig()
  }
  return cached
}
