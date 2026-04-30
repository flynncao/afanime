import { CronTime } from 'cron'

export type ParsedCronState =
  | { mode: 'daily', hour: number, minute: number }
  | { mode: 'interval', intervalHours: number }
  | { mode: 'custom', raw: string }

/**
 * Validates a cron expression using the cron package parser.
 * @param cronStr The cron expression to validate.
 */
export function isValidCron(cronStr: string): boolean {
  try {
    new CronTime(cronStr)
    return true
  }
  catch {
    return false
  }
}

/**
 * Builds a daily cron expression at a specific hour and minute.
 */
export function buildDailyCron(hour: number, minute: number): string {
  // Ensuring hour and minute are within bounds
  const h = Math.max(0, Math.min(23, hour))
  const m = Math.max(0, Math.min(59, minute))
  return `${m} ${h} * * *`
}

/**
 * Builds an interval cron expression (every X hours).
 */
export function buildIntervalCron(intervalHours: number): string {
  const h = Math.max(1, Math.min(23, intervalHours))
  return `0 */${h} * * *`
}

/**
 * Parses a cron string into a structured state for the UI.
 */
export function parseCronToState(cronStr: string): ParsedCronState {
  const parts = cronStr.trim().split(/\s+/)

  // 5-field daily: "0 8 * * *"
  if (parts.length === 5 && !cronStr.includes('/')) {
    const minute = Number(parts[0])
    const hour = Number(parts[1])
    if (!isNaN(minute) && !isNaN(hour) && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      return { mode: 'daily', hour, minute }
    }
  }

  // 6-field daily (standard in this bot): "0 0 8 * * *"
  if (parts.length === 6 && !cronStr.includes('/')) {
    const second = Number(parts[0])
    const minute = Number(parts[1])
    const hour = Number(parts[2])
    if (second === 0 && !isNaN(minute) && !isNaN(hour) && parts[3] === '*' && parts[4] === '*' && parts[5] === '*') {
      return { mode: 'daily', hour, minute }
    }
  }

  // Interval: "0 */12 * * *"
  if (parts.length === 5 && parts[1].startsWith('*/')) {
    const intervalHours = Number(parts[1].replace('*/', ''))
    if (!isNaN(intervalHours) && parts[0] === '0' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      return { mode: 'interval', intervalHours }
    }
  }

  return { mode: 'custom', raw: cronStr }
}
