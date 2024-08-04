import { fetchBangumiSubjectInfoFromID } from '../bangumi/index.js'
import { extractEpisodeNumber } from '#root/utils/string.js'
import { AnimeModel, readSingleAnime, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { type IAnime, STATUS } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import { type possibleResult, useFetchNEP } from '#root/api/realsearch.js'

import store from '#root/databases/store.js'
import { AniSub } from '#root/classes/AniSub.js'
import { AniEpi } from '#root/classes/AniEpi.js'

export async function getLocalAnimeDataByID(animeID: number): Promise<any> {
  return new Promise((resolve, reject) => {
    readSingleAnime(animeID).then((data) => {
      resolve(data)
    }).catch((err) => {
      reject(err)
    })
  })
}

export async function updateAnimeMetaAndEpisodes(animeID: number, successMessage: string = '更新成功'): Promise<any> {
  return new Promise((resolve, reject) => {
    const findOneAndUpdatePromise = (updatedAnime: IAnime) => AnimeModel.findOneAndUpdate({ id: animeID }, updatedAnime).then(() => {
      return Promise.resolve()
    }).catch((err: Error) => {
      Logger.logError('Error while updateAnimeMetaAndEpisodes: ', err)
      return Promise.reject(err)
    })
    const promiseArr: Array<any> = [getLocalAnimeDataByID, fetchBangumiSubjectInfoFromID, findOneAndUpdatePromise]
    function runSequentially(promises: any[]) {
      return promises.reduce((accum, p) => accum.then((res: any) => {
        return p(res)
      }), Promise.resolve(animeID))
    }
    runSequentially(promiseArr).then(() => {
      resolve(successMessage)
    }).catch((err: Error) => {
      Logger.logError(`更新失败: ${err}`)
      reject(err)
    })
  })
}

// MENU ACTION1: Update Subject and Episode info from bangumi
export async function fetchAndUpdateAnimeMetaInfo(animeID: number): Promise<string> {
  return new Promise((resolve) => {
    const title = store.AT!.getThreadIDAndTitleFromID(animeID).title
    updateAnimeMetaAndEpisodes(animeID, '更新动画元信息及剧集成功').then((res) => {
      resolve(`success#更新「${title}」元信息成功`)
    }).catch(() => {
      resolve(`error#更新「${title}」元信息失败`)
    })
  })
}
// MENU ACTION2: Update Episode info only from bangumi
export async function fetchAndUpdateAnimeEpisodesInfo(animeID: number): Promise<string> {
	return new Promise((resolve, reject) => {
		(async ()=>{
			try {
				const anime: IAnime = await readSingleAnime(animeID)
				const query: string = anime?.query
				const threadID: number = anime?.threadID
				const last_episode: number = anime?.last_episode
				const current_episode: number = anime?.current_episode
				const id = anime?.id
				const name = anime?.name_cn
				const episodes = anime?.episodes!
				Logger.logInfo(`Anime Info: ${query}, threadID: ${threadID}, last_episode: ${last_episode}, current_episode: ${current_episode}, id: ${id}, name: ${name}, episodes: ${episodes}`)
				if (!episodes || episodes.length === 0) {
					 reject(new Error('本地数据库中没有剧集信息，请查询番剧是否开通，或者使用菜单中的【拉取Bangumi剧集信息】功能'))
				}
				if (!(query && threadID && current_episode >= 0 && name && anime.eps)) {
					reject(new Error('query, threadID, current_episode, name, eps字段不能为空'))	
				}
				let queryPageNo = 0, isPushListConsistent = false
				const aniSubjectEntity = new AniSub(anime)
				const nepResult: possibleResult = await useFetchNEP(query, queryPageNo)
					if (!('data' in nepResult) || nepResult.data.length === 0) {
						reject(new Error('读取NEP仓库时发生错误！'))
						return
					}
					 const dealtCode = dealNEPResult(nepResult, aniSubjectEntity)
					 console.log('dealtCode:', dealtCode)
					 if(dealtCode === 0){
						 reject(new Error('Error in dealNEPResult'))
						 return 
					 }
					 if(dealtCode === 1){
						 resolve(`UAEI#no-need-update#${id}`)
						 return
					 }
					 if(dealtCode === 3 || 2){
						const dbRes = await updateSingleAnimeQuick(animeID, { episodes, current_episode: aniSubjectEntity.pushedMaxNum, last_episode: aniSubjectEntity.maxInNEP, status: (aniSubjectEntity.maxInNEP - anime.eps! + 1 === anime.total_episodes ? STATUS.COMPLETED : STATUS.AIRED) })
						if(dbRes){
							Logger.logSuccess(`更新成功: ${dbRes}`)
							console.log('resolve func:', resolve)
							if (aniSubjectEntity.getPushList().length !== 0) {
								store.pushCenter.list = aniSubjectEntity.getPushList()
								resolve(`UAEI#update-available#${id}`)
							} else {
								resolve(`UAEI#no-need-update#${id}`)
							}
						}else{
							Logger.logError(`更新失败`)
							reject(new Error('更新失败'))
						}	
	
					 }
				// do{
					
					 
				// 	queryPageNo++
				// }while(queryPageNo <=5 && isPushListConsistent === false)
			} catch (error) {
				console.log('error in fetchAndUpdateAnimeEpisodesInfo:', error)
			}
		})()
	
	
	})

}



const dealNEPResult =  (nepResult: any, subject: AniSub): number =>{
	// 0 - error; 1 - no need update; 2 - not complete ; 3- update
	try {
	 for (let i = (nepResult.data.length - 1); i >= 0; i--) {
		const item = nepResult.data[i]
		const episodeNum = extractEpisodeNumber(item.text)
		if(!episodeNum) continue
		const aniEpisodeEntity = new AniEpi({
			num: episodeNum,
			title: item.text,
			link: item.link
		}, subject)
		console.log(`${aniEpisodeEntity.isAllInfoValid()}-Episode ${episodeNum} - ${item.text} - ${item.link}`)
		if (aniEpisodeEntity.isAllInfoValid()) {
			const dbEpisodeIndex = episodeNum - subject.getAnimeInstance().eps!
			subject.episodes[dbEpisodeIndex].videoLink = item.link
			subject.episodes[dbEpisodeIndex].pushed = true
			if (episodeNum !== null && episodeNum > subject.maxInNEP )
				subject.maxInNEP = episodeNum
		}
	}

	Logger.logInfo(`maxInNEP: ${subject.maxInNEP}`)
	const current_episode = subject.getAnimeInstance().current_episode, startEpiNum = subject.getAnimeInstance().eps!
	if (current_episode === subject.maxInNEP) {
		return 1
	}
	else {
		Logger.logInfo(`pushedMaxNum: ${subject.pushedMaxNum}`)

		for (let i = subject.pushedMaxNum; i <= subject.maxInNEP; i++) {
			const pushedLink = subject.episodes[i - startEpiNum].videoLink
			// const mannualSearchLink = `https://search.acgn.es/?cid=0&word=${encodeURIComponent(`${anime.query}`)}`
			subject.addToPushList(
				{
					link: pushedLink,
					pushEpisodeNum: i,
					bangumiID: subject.episodes[i - startEpiNum!].id,
				}
			)
			if (i > subject.pushedMaxNum && pushedLink)
				subject.pushedMaxNum = i
		}
		Logger.logInfo(`current pushList: ${JSON.stringify(subject.getPushList())}`)
		return subject.isPushListConsisitent() ? 3 : 2
	 }
	} catch (error) {
		Logger.logError(`Error in dealNEPResult: ${error}`)
		return 0	
	}

}
