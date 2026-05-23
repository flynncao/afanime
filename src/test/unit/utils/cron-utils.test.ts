import { describe, expect, it } from 'vitest'
import { buildDailyCron, buildIntervalCron, isValidCron, parseCronToState } from '../../../utils/cron-utils.js'

describe('cron utils', () => {
  describe('isValidCron', () => {
    it('should validate 5-field cron', () => {
      expect(isValidCron('0 8 * * *')).toBe(true)
    })

    it('should validate 6-field cron', () => {
      expect(isValidCron('0 0 8 * * *')).toBe(true)
    })

    it('should invalidate incorrect cron', () => {
      expect(isValidCron('99 8 * * *')).toBe(false)
      expect(isValidCron('abc')).toBe(false)
    })

    it('should invalidate Quartz syntax with ?', () => {
      expect(isValidCron('0 0 */12 ? * *')).toBe(false)
    })

    it('should invalidate empty string', () => {
      expect(isValidCron('')).toBe(false)
    })

    it('should invalidate non-cron string', () => {
      expect(isValidCron('hello world!')).toBe(false)
    })
  })

  describe('buildDailyCron', () => {
    it('should build daily cron at 08:00', () => {
      expect(buildDailyCron(8, 0)).toBe('0 8 * * *')
    })

    it('should build daily cron at 23:59', () => {
      expect(buildDailyCron(23, 59)).toBe('59 23 * * *')
    })
  })

  describe('buildIntervalCron', () => {
    it('should build interval cron every 12 hours', () => {
      expect(buildIntervalCron(12)).toBe('0 */12 * * *')
    })
  })

  describe('parseCronToState', () => {
    it('should parse 5-field daily cron', () => {
      expect(parseCronToState('0 8 * * *')).toEqual({ mode: 'daily', hour: 8, minute: 0 })
    })

    it('should parse 6-field daily cron', () => {
      expect(parseCronToState('0 0 8 * * *')).toEqual({ mode: 'daily', hour: 8, minute: 0 })
    })

    it('should parse interval cron', () => {
      expect(parseCronToState('0 */12 * * *')).toEqual({ mode: 'interval', intervalHours: 12 })
    })

    it('should return custom for complex cron', () => {
      expect(parseCronToState('0 8 * * 1-5')).toEqual({ mode: 'custom', raw: '0 8 * * 1-5' })
    })
  })
})
