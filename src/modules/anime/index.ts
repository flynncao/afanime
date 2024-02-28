import { readSingleAnime } from '#root/models/Anime.js'

export async function getLocalAnimeDataByID(animeID: number): Promise<any> {
  return new Promise((resolve, reject) => {
    readSingleAnime(animeID).then((data) => {
      resolve(data)
    }).catch((err) => {
      reject(err)
    })
  })
}
