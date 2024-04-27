import { threadQueries } from '#root/constants/index.js'
import type { AnimeContext, AnimeData, AnimeThread, IAnime } from '#root/types/index.js'
import db from '#root/databases/store.js'
import { extractEpisodeNumber } from '#root/utils/string.js'
import { readAnimes } from '#root/models/Anime.js'
import Logger from '#root/utils/logger.js'
import { useFetchNEP } from '#root/api/nep.js'

// TODO: (feat) Periodically update anime without context?
const userChatID = process.env.USER_CHAT_ID!
type possibleContext = AnimeContext | undefined
function botSendMessage(ctx: possibleContext, message: string) {
  if (ctx)
    ctx.reply(message)
  else
    db.bot?.api.sendMessage(userChatID, message)
}
// Deprecated function
export async function updateAnimePerThread(ctx: AnimeContext, threadID: number, feedBack = true) {
  const thread = threadQueries.find((thread: AnimeThread) => thread.threadID === threadID)
  // TODO: (refactor) Better error handling
  if (!thread)
    return ctx.reply('沒找到這個動畫！')

  const data = await useFetchNEP(thread.query)
  if (!('data' in data) || ctx.session.animes === undefined || data.data.length === 0)
    return ctx.reply('讀取動畫倉庫時發生錯誤！')

  const matchedAnime = ctx.session.animes.find((anime: AnimeData) => anime.threadID === threadID)
  if (matchedAnime === undefined) {
    return ctx.reply(`未找到這個動畫`, {
      message_thread_id: threadID,
    })
  }

  const localLastEpisode = matchedAnime.lastEpisode!
  const cloudLastEpisode = extractEpisodeNumber(data.data[0].text)
  if (!cloudLastEpisode) {
    return ctx.reply(`標題解析失敗`, {
      message_thread_id: threadID,
    })
  }
  const filteredList: any[] = []
  let max = localLastEpisode
  for (let i = 0; i < data.data.length; i++) {
    const item = data.data[i]
    const episodeNum = extractEpisodeNumber(item.text)
    if (episodeNum && episodeNum > localLastEpisode) {
      filteredList.unshift(item)
      if (episodeNum > max)
        max = episodeNum
    }
    else {
      break
    }
  }

  if (filteredList.length === 0) {
    return ctx.reply(`${matchedAnime.title} 已經更新到最新!`, {
      message_thread_id: threadID,
    })
  }
  else {
    for (const item of filteredList) {
      ctx.reply(String(item.link), {
        message_thread_id: threadID,
      })
    }
    matchedAnime.lastEpisode = max
  }
}


interface IATRelation {
  threadID: number
  id: number
  title: string
}
export class ATRelation {
  private static Instance: ATRelation
  private relations: IATRelation[]

  private constructor() {
    this.relations = []
  }

  public static getInstance() {
    if (!ATRelation.Instance)
      ATRelation.Instance = new ATRelation()

    return ATRelation.Instance
  }

  public getRelations() {
    return this.relations
  }

  public insertOne(animeID: number, threadID: number, title: string) {
    this.relations.push({
      threadID,
      id: animeID,
      title,
    })
  }

  public getAnimeIDFromThreadID(threadID: number): number {
    const relations = this.relations
    const matched = relations.find((relation: IATRelation) => relation.threadID === threadID)
    if (relations.length === 0 || !matched)
      return -1
    return matched.id
  }

  public getAnimeTitleFromThreadID(threadID: number): string {
    const relations = this.relations
    const matched = relations.find((relation: IATRelation) => relation.threadID === threadID)
    if (relations.length === 0 || !matched)
      return ''
    return matched.title
  }

	public getThreadIDAndTitleFromID(animeID: number): { threadID: number, title: string } {
		const relations = this.relations
		const matched = relations.find((relation: IATRelation) => relation.id === animeID)
		if (relations.length === 0 || !matched)
			return { threadID: 0, title: '' }
		else
			return { threadID: matched.threadID, title: matched.title }
	}



  public async initRelations() {
    const res = await readAnimes().catch((err) => {
      Logger.logError(`ATRelation: ${err}`)
      return []
    })
    if (res.length === 0)
      return
    res.forEach((anime: IAnime) => {
      this.insertOne(anime.id, anime.threadID, anime.name_cn)
    })
  }
}

export type IATRelationInstance = ATRelation
