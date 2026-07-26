import { describe, expect, it } from 'vitest'
import { isValidCronExpr } from '#root/core/cron.js'

describe('isValidCronExpr (six-field, seconds first)', () => {
  it('accepts the default job schedules', () => {
    expect(isValidCronExpr('0 0 8 * * *')).toBe(true)
    expect(isValidCronExpr('0 0 0 * * 1')).toBe(true)
    expect(isValidCronExpr('*/1 * * * * *')).toBe(true)
  })

  it('accepts @-shorthands', () => {
    expect(isValidCronExpr('@daily')).toBe(true)
    expect(isValidCronExpr('@weekly')).toBe(true)
  })

  it('rejects invalid expressions', () => {
    expect(isValidCronExpr('not a cron')).toBe(false)
    expect(isValidCronExpr('61 * * * * *')).toBe(false)
    expect(isValidCronExpr('* * 25 * * *')).toBe(false)
    expect(isValidCronExpr('')).toBe(false)
  })
})
