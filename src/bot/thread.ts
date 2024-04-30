import { threadQueries } from '#root/constants/index.js'
import type { AnimeContext, AnimeData, AnimeThread, IAnime } from '#root/types/index.js'
import { readAnimes } from '#root/models/Anime.js'
import Logger from '#root/utils/logger.js'


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
	
	public updateTitle(animeID: number, title: string) {
		const relations = this.relations
		const matched = relations.find((relation: IATRelation) => relation.id === animeID)
		if (relations.length === 0 || !matched)
			return
		matched.title = title
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
