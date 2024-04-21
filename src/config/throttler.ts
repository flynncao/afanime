import type { APIThrottlerOptions } from '@grammyjs/transformer-throttler'

const throttlerConfig: APIThrottlerOptions = {
  global: {
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 60 * 1000,
  },
  out: {
    maxInflight: 1,
    minTime: 2000,
  },
}

export default throttlerConfig
