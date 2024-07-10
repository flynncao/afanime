import type { IAnime } from '#root/types/index.js'

export class AniSub {
  animeInstance: IAnime
  private pushList: any[]
  episodes: any[]
  maxInNEP: number
  pushedMaxNum: number

  constructor(anime: IAnime) {
    this.animeInstance = anime
    this.pushList = []
    this.episodes = anime.episodes || []
    this.pushedMaxNum = anime.current_episode
    // maxInNEP assigned to maxed valid episode number in episodes list
    this.maxInNEP = Math.max(this.episodes.filter(ep => ep.name || ep.name_cn).length, this.pushedMaxNum)
  }

  public getAnimeInstance(): IAnime {
    return this.animeInstance
  }

  public getPushList(): any[] {
    return this.pushList
  }

  public emptyPushList() {
    this.pushList = []
  }

  public addToPushList(item: any) {
    console.log('addToPushList trigged')
    const index = this.pushList.findIndex(pushItem => pushItem.bangumiID === item.bangumiID)
    if (index === -1) {
      this.pushList.push(item)
    }
    else {
      this.pushList[index] = item
    }
  }

  public isPushListConsisitent(): boolean {
    // return true if all items in pushlist has a valid link
    return this.pushList.every(item => item.link !== null && item.link !== '')
  }

  public isValidDBEpisodeIndex(index: number): boolean {
    return this.episodes[index] !== undefined
  }

  public isValidBroadEpisodeNum(episodeNum: number): boolean {
    return episodeNum >= this.animeInstance.eps! && episodeNum <= this.animeInstance.eps! + this.animeInstance.total_episodes - 1
  }
}
