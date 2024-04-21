import type { AutoRetryOptions } from '@grammyjs/auto-retry'

const AutoRetryConfig: AutoRetryOptions = {
  maxDelaySeconds: 3600,
  maxRetryAttempts: Number.POSITIVE_INFINITY,
  retryOnInternalServerErrors: false,
}

export default AutoRetryConfig
