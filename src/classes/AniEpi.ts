import { AniSub } from "./AniSub.js";
import Logger from '#root/utils/logger.js';
import { normalizedAnimeTitle } from "#root/utils/string.js";
type RSEpiInfo = {
	num: number,
	title: string,
	link: string
}
export class AniEpi {
		private num: number;
		private title: string;
		private parent: AniSub
		private link: string;

		public setParent(parent: AniSub){
			this.parent = parent
		}

		public setLink(link: string){
			this.link = link
		}
		constructor(rsEpisodeInfo: RSEpiInfo, parent: AniSub) {
			this.num = rsEpisodeInfo.num
			this.title = rsEpisodeInfo.title
			this.link = rsEpisodeInfo.link
			this.parent = parent
		}

		public isAllInfoValid( ): boolean {
			return this.isValidEpisode() && this.isValidLink() && this.isValidNum() && this.isValidTitle()
		}

		private isValidEpisode(): boolean {
			const episodes = this.parent.getAnimeInstance().episodes
			const epStartNum = this.parent.getAnimeInstance().eps!
			if(!episodes || !epStartNum) return false
			return episodes[ this.num - epStartNum]?.name || episodes[this.num - epStartNum]?.name_cn
		}
		private isValidLink(): boolean {
			return this.link !== null && this.link !== ''
		}

		private isValidNum(): boolean {
			const epStartNum = this.parent.getAnimeInstance().eps!
			const totalEpisodesCount = this.parent.getAnimeInstance().episodes?.length
			if(!totalEpisodesCount || !epStartNum)return false
			return this.num !== null && this.num >= epStartNum && this.num <= (totalEpisodesCount+ epStartNum - 1)
			
		}
		
		private isValidTitle(): boolean {
			 const anime = this.parent.getAnimeInstance()
			 const phantomNames =  anime.name_phantom ? anime.name_phantom.split(',') : [anime.name_cn, anime.name]
			 if(!anime || phantomNames.length === 0) return false
			 return phantomNames.some((name: string) =>  normalizedAnimeTitle(this.title).includes(normalizedAnimeTitle(name)))
		}

		public printResult(){
			Logger.logInfo(`${this.isAllInfoValid()}-Episode ${this.num} - ${this.title} - ${this.link}`, 'validLink:', this.isValidLink(), 'validNum:', this.isValidNum(), 'validTitle:', this.isValidTitle())
		}
}
