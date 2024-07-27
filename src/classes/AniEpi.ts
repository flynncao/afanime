import type { AniSub } from './AniSub.js'
import Logger from '#root/utils/logger.js'
import { normalizedAnimeTitle } from '#root/utils/string.js'

const blacklist = [
  'Up to 21°C',
]
interface RSEpiInfo {
  num: number
  title: string
  link: string
}
export class AniEpi {
  private num: number
  private title: string
  private parent: AniSub
  private link: string

  public setParent(parent: AniSub) {
    this.parent = parent
  }

  public setLink(link: string) {
    this.link = link
  }

  constructor(rsEpisodeInfo: RSEpiInfo, parent: AniSub) {
    this.num = rsEpisodeInfo.num
    this.title = rsEpisodeInfo.title
    this.link = rsEpisodeInfo.link
    this.parent = parent
  }

  public isAllInfoValid(): boolean {
    return this.isValidEpisode() && this.isValidLink() && this.isValidNum() && this.isValidTitle()
  }

  private isValidEpisode(): boolean {
    const episodes = this.parent.getAnimeInstance().episodes
    const epStartNum = this.parent.getAnimeInstance().eps!
    if (!episodes || !epStartNum)
      return false
    const isValidEpisode = episodes[this.num - epStartNum]?.name || episodes[this.num - epStartNum]?.name_cn
    if (!isValidEpisode)
      Logger.logError('isValidEpisode Error', this.num, this.title, this.link)
    return isValidEpisode
  }

  private isValidLink(): boolean {
    const isValidLink = this.link !== null && this.link !== ''
    if (!isValidLink)
      Logger.logError('isValidLink Error', this.num, this.title, this.link)
    return isValidLink
  }

  private isValidNum(): boolean {
    const epStartNum = this.parent.getAnimeInstance().eps!
    const totalEpisodesCount = this.parent.getAnimeInstance().episodes?.length
    if (!totalEpisodesCount || !epStartNum)
      return false
    const isValidNum = this.num !== null && this.num >= epStartNum && this.num <= (totalEpisodesCount + epStartNum - 1)
    if (!isValidNum)
      Logger.logError('isValidNum Error', this.num, this.title, this.link)
    return isValidNum
  }

  private isValidTitle(): boolean {
    const anime = this.parent.getAnimeInstance()
    let phantomNameStr = anime.name_phantom ? anime.name_phantom : anime.name_cn
    if (!phantomNameStr.includes('|') && phantomNameStr.includes(',')) {
      phantomNameStr = phantomNameStr.replaceAll(',', '|');
    }
    function containsAllSubstrings(text: string, pattern: string): boolean {
      const patternComponents = pattern.split('|').map(part => part.trim());
      const normalizedText = normalizedAnimeTitle(text);
      const normalizedPatternComponents = patternComponents.map(component => normalizedAnimeTitle(component));
      return normalizedPatternComponents.every(component => normalizedText.includes(component));
    }
    if (!anime)
      return false
    let isValidTitle = false
    isValidTitle = containsAllSubstrings(this.title, phantomNameStr)
    if (blacklist.some(substring => this.title.includes(substring))) {
      isValidTitle = false
    }
    if (this.title) {
      if (!isValidTitle)
        Logger.logError('isValidTitle Error', this.num, this.title, this.link)
    }
    return isValidTitle
  }

  public printResult() {
    Logger.logInfo(`${this.isAllInfoValid()}-Episode ${this.num} - ${this.title} - ${this.link}`, 'validLink:', this.isValidLink(), 'validNum:', this.isValidNum(), 'validTitle:', this.isValidTitle())
  }

  public getTitle(): string {
    return this.title
  }
}
