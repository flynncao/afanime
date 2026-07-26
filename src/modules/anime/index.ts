import type { IAnime } from '#root/types/index.js'
import { searchNep } from '#root/api/realsearch.js'
import { AniSub } from '#root/classes/AniSub.js'
import { dealNEPResult, RECONCILE } from '#root/core/reconcile.js'
import store from '#root/databases/store.js'
import { AnimeModel, readSingleAnime, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { STATUS } from '#root/types/index.js'

import Logger from '#root/utils/logger.js'
import { fetchBangumiSubjectInfoFromID } from '../bangumi/index.js'

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
    (async () => {
      try {
        const anime: IAnime = await readSingleAnime(animeID)
        const query: string = anime?.query
        const threadID: number = anime?.threadID
        const last_episode: number = anime?.last_episode
        const current_episode: number = anime?.current_episode
        const id = anime?.id
        const name = anime?.name_cn
        const episodes = anime?.episodes
        Logger.logInfo(`Anime Info: ${query}, threadID: ${threadID}, last_episode: ${last_episode}, current_episode: ${current_episode}, id: ${id}, name: ${name}, episodes: ${episodes}`)
        if (!episodes || episodes.length === 0) {
          reject(new Error('本地数据库中没有剧集信息，请查询番剧是否开通，或者使用菜单中的【拉取Bangumi剧集信息】功能'))
        }
        if (!(query && threadID && current_episode >= 0 && name && anime.eps)) {
          reject(new Error('query, threadID, current_episode, name, eps字段不能为空'))
        }
        const queryPageNo = 0
        const aniSubjectEntity = new AniSub(anime)
        const nepResult = await searchNep(query, queryPageNo)
        if (nepResult.data.length === 0) {
          reject(new Error('读取NEP仓库时发生错误！'))
          return
        }
        const dealtCode = dealNEPResult(nepResult, aniSubjectEntity)
        if (dealtCode === RECONCILE.ERROR) {
          reject(new Error('Error in dealNEPResult'))
          return
        }
        if (dealtCode === RECONCILE.UP_TO_DATE) {
          resolve(`UAEI#no-need-update#${id}`)
          return
        }
        if (dealtCode === RECONCILE.PARTIAL || dealtCode === RECONCILE.PUSH) {
          const dbRes = await updateSingleAnimeQuick(animeID, { episodes, current_episode: aniSubjectEntity.pushedMaxNum, last_episode: aniSubjectEntity.maxInNEP, status: (aniSubjectEntity.maxInNEP - anime.eps! + 1 === anime.total_episodes ? STATUS.COMPLETED : STATUS.AIRED) })
          if (dbRes) {
            Logger.logSuccess(`更新成功: ${dbRes}`)
            if (aniSubjectEntity.getPushList().length !== 0) {
              store.pushCenter.list = aniSubjectEntity.getPushList()
              resolve(`UAEI#update-available#${id}`)
            }
            else {
              resolve(`UAEI#no-need-update#${id}`)
            }
          }
          else {
            Logger.logError(`更新失败`)
            reject(new Error('更新失败'))
          }
        }
      }
      catch (error) {
        Logger.logError(`Error in fetchAndUpdateAnimeEpisodesInfo: ${error}`)
        // previously only logged, leaving the outer promise pending forever
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })()
  })
}
