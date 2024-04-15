import { fetchBangumiSubjectInfoFromID } from '../bangumi/index.js'
import { normalizedAnimeTitle } from '../../utils/string'
import { AnimeModel, readSingleAnime, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { type AnimeContext, type IAnime, STATUS } from '#root/types/index.js'
import Logger from '#root/utils/logger.js'
import { type possibleResult, useFetchNEP } from '#root/api/nep.js'
import { extractEpisodeNumber } from '#root/utils/string.js'
import store from '#root/databases/store.js'

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
      Logger.logSuccess(`All done`)
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
    updateAnimeMetaAndEpisodes(animeID, '更新动画元信息及剧集成功').then((res) => {
      resolve('更新动画元信息及剧集成功')
    }).catch(() => {
      resolve('更新动画元信息及剧集失败')
    })
  })
}
// MENU ACTION2: Update Episode info only from bangumi
export async function fetchAndUpdateAnimeEpisodesInfo(animeID: number): Promise<string | Error> {
  return new Promise((resolve, reject) => {
    readSingleAnime(animeID).then((anime: IAnime) => {
      const query: string = anime?.query
      const threadID: number = anime?.threadID
      const last_episode: number = anime?.last_episode
      const current_episode: number = anime?.current_episode

      const name = anime?.name_cn
      const episodes = anime?.episodes
      if (!episodes || episodes.length === 0) {
        reject(new Error('本地数据库中没有剧集信息，请查询番剧是否开通，或者使用菜单中的【拉取Bangumi剧集信息】功能'))
        return
      }

      if (query && threadID && current_episode >= 0 && name) {
        useFetchNEP(query).then((res: possibleResult) => {
          // TODO: (refactor) use subDocument (ref) for better performance
          if (!('data' in res) || res.data.length === 0)
            return reject(new Error('讀取動畫倉庫時發生錯誤！'))
          let maxInNEP = 0
          console.log('res.data', res.data)
          console.log('episodes', episodes)
          for (let i = (res.data.length - 1); i >= 0; i--) {
            const item = res.data[i]
            const episodeNum = extractEpisodeNumber(item.text)

            const isValidLink = item.link && item.link !== '' && item.link !== null
            const isValiadNum = episodeNum !== null && episodeNum > 0 && episodeNum < episodes.length
            console.log(`${item.text}/${episodeNum}/${isValidLink}/${isValiadNum}`)
            const doubleCheck = normalizedAnimeTitle(item.text).includes(normalizedAnimeTitle(anime.name)) || normalizedAnimeTitle(item.text).includes(normalizedAnimeTitle(anime.name_cn))
            if (isValiadNum && isValidLink && episodeNum !== null && doubleCheck && episodes[episodeNum - 1].name && episodes[episodeNum - 1].name_cn) {
              console.log('item.text', item.text)
              console.log('item.', episodeNum)
              episodes[episodeNum - 1].videoLink = item.link
              episodes[episodeNum - 1].pushed = true
              if (episodeNum !== null && episodeNum > maxInNEP)
                maxInNEP = episodeNum
            }
          }
          if (current_episode === maxInNEP) {
            resolve(`${name} 无需更新!`)
          }
          else {
            const pushList: any[] = []
            let pushedMaxNum = current_episode + 1
            for (let i = pushedMaxNum; i <= maxInNEP; i++) {
              const pushedLink = episodes[i - 1].videoLink
              pushList.push({
                link: pushedLink,
                pushEpisodeNum: i,
                bangumiID: episodes[i - 1].id,
              })
              if (i > pushedMaxNum && pushedLink)
                pushedMaxNum = i
            }
            updateSingleAnimeQuick(animeID, { episodes, current_episode: pushedMaxNum, last_episode: maxInNEP, status: (last_episode === anime.total_episodes ? STATUS.COMPLETED : STATUS.AIRED) }).then((res) => {
              Logger.logSuccess(`更新成功: ${res}`)
              if (pushList.length !== 0) {
                store.pushCenter.list = pushList
                store.pushCenter.threadID = threadID
                resolve('进度管理更新成功,手动推送中...')
              }
            }).catch((err) => {
              Logger.logError(`更新失败: ${err}`)

              reject(err)
            })
          }
        }).catch((err) => {
          Logger.logError(`更新失败: ${err}`)
          reject(err)
        })
      }
      else {
        reject(new Error('不合理的查询语句，话题ID或进度管理信息'))
      }
    }).catch((err) => {
      Logger.logError(`更新失败: ${err}`)
      reject(err)
    })
  })
}
