import { threadQueries } from '#root/constants/index.js'
import type { AnimeContext, AnimeData, AnimeThread } from '#root/types/index.js'
import { useFetchNEP } from '#root/modules/acgn.js'
import db from '#root/databases/db.js'

// TODO: (feat) Periodically update anime without context?
const userChatID = process.env.USER_CHAT_ID!
type possibleContext = AnimeContext | undefined
function botSendMessage(ctx: possibleContext, message: string) {
  if (ctx)
    ctx.reply(message)
  else
    db.bot?.api.sendMessage(userChatID, message)
}

export async function updateAnimePerThread(ctx: AnimeContext, threadID: number, feedBack = true) {
  const thread = threadQueries.find((thread: AnimeThread) => thread.threadID === threadID)
  // TODO: (refactor) Better error handling
  if (!thread) {
    ctx.reply('沒找到這個動畫！')
    return
  }

  const data = await useFetchNEP(thread.query)
  if (!('data' in data) || ctx.session.animes === undefined) {
    ctx.reply('讀取動畫倉庫時發生錯誤！')
    return
  }

  const matchedAnime = ctx.session.animes.find((anime: AnimeData) => anime.threadID === threadID)
  if (matchedAnime === undefined) {
    ctx.reply('沒找到這個動畫！')
    return
  }

  const lastUpdateEpisodeNum = matchedAnime.lastEpisode!
  const list = data.data.filter((item: any) => item.episode > lastUpdateEpisodeNum)
  if (list.length === 0) {
    if (feedBack) {
      ctx.reply(`${matchedAnime.title} 已經更新到最新!`, {
        message_thread_id: threadID,
      })
    }
  }
  else {
    list.forEach((item: any) => {
      ctx.reply(String(item.link), {
        message_thread_id: threadID,
      })
    })
  }
}
