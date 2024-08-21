import { fetchAndUpdateAnimeEpisodesInfo } from './index.js'

export async function executeAnimeEpisodeInfoTaskInOrder(animeID: number, animeName: string): Promise<string> {
  const res = await fetchAndUpdateAnimeEpisodesInfo(animeID)
  if (res && typeof res === 'string') {
    return res
  }
  else {
    return `UAEI#error#${animeID}`
  }
}
