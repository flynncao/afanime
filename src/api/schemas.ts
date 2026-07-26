import { z } from 'zod'

/**
 * Narrow schemas: only the fields this bot consumes are validated; unknown
 * fields pass through untouched. A drift in a consumed field fails loudly
 * with the offending path in the error instead of corrupting the database.
 */

export const BangumiSubjectSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  name_cn: z.string(),
  summary: z.string(),
  // Bangumi quirk (see core/subject-merge.ts): subjects with SP episodes
  // keep the regular count in `eps`; subjects without often have eps=0.
  eps: z.number(),
  total_episodes: z.number(),
  date: z.string().nullish(),
  platform: z.string().nullish(),
  images: z.looseObject({
    small: z.string(),
    large: z.string(),
    medium: z.string(),
    common: z.string(),
  }).nullish(),
  rating: z.looseObject({
    rank: z.number(),
    total: z.number(),
    score: z.number(),
  }).nullish(),
  volumes: z.number().nullish(),
  locked: z.boolean().nullish(),
  nsfw: z.boolean().nullish(),
})
export type BangumiSubject = z.infer<typeof BangumiSubjectSchema>

export const BangumiEpisodeListSchema = z.looseObject({
  data: z.array(z.looseObject({
    id: z.number(),
    name: z.string(),
    name_cn: z.string(),
  })),
  total: z.number(),
})

export const NepResultSchema = z.looseObject({
  code: z.number(),
  data: z.array(z.looseObject({
    text: z.string(),
    link: z.string(),
    date: z.number(),
  })),
})
export type NepResult = z.infer<typeof NepResultSchema>

export const ScheduleSchema = z.looseObject({
  code: z.number(),
  data: z.array(z.looseObject({
    name_cn: z.string(),
    status: z.string(),
    date_start: z.number(),
    date_end: z.number().nullish(),
  })),
})
export type Schedule = z.infer<typeof ScheduleSchema>
