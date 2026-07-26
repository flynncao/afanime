import { describe, expect, it } from 'vitest'
import { AnimeModel } from '#root/models/Anime.js'
import { CronModel } from '#root/models/Cron.js'
import baseline from '../fixtures/schema-baseline.json'

/**
 * Guards the persisted schema shape: the baseline was generated from the
 * pre-refactor build (emitDecoratorMetadata + SWC). The explicit `type`
 * options on every @prop must produce the exact same mongoose schema.
 */

function dumpSchema(schema: any): any {
  const out: any = {}
  for (const [key, path] of Object.entries<any>(schema.paths)) {
    const options = path.options ?? {}
    out[key] = {
      instance: path.instance,
      required: !!options.required,
      unique: !!options.unique,
      index: !!options.index,
      default: 'default' in options ? options.default : '__none__',
      enum: options.enum ?? null,
    }
    if (path.schema)
      out[key].nested = dumpSchema(path.schema)
  }
  return out
}

describe('typegoose schema shape', () => {
  it('matches the pre-refactor metadata-emitted baseline exactly', () => {
    const current = JSON.parse(JSON.stringify({
      Anime: dumpSchema(AnimeModel.schema),
      Cron: dumpSchema(CronModel.schema),
    }))
    expect(current).toEqual(baseline)
  })
})
