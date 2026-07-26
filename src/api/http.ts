import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios, { AxiosError } from 'axios'

/** Error kept rich on purpose: status, URL and body survive to the logs. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function toApiError(service: string, error: unknown): ApiError {
  if (error instanceof AxiosError)
    return new ApiError(`${service}: ${error.message}`, error.response?.status, error.config?.url, error.response?.data)
  return new ApiError(`${service}: ${error instanceof Error ? error.message : String(error)}`)
}

export interface ClientOptions {
  timeoutMs?: number
  headers?: Record<string, string>
  /** Test seam: a stub adapter serves fixtures through the real axios pipeline. */
  adapter?: AxiosRequestConfig['adapter']
}

export function makeClient(baseURL: string, options: ClientOptions = {}): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: options.timeoutMs ?? 10_000,
    headers: options.headers,
    adapter: options.adapter,
  })
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof AxiosError))
    return false
  // network error (no response), server error, or rate limit
  return !error.response || error.response.status >= 500 || error.response.status === 429
}

export async function withRetry<T>(fn: () => Promise<T>, { retries = 2, baseDelayMs = 500 } = {}): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error
      if (attempt === retries || !isRetryable(error))
        break
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * 2 ** attempt))
    }
  }
  throw lastError
}
