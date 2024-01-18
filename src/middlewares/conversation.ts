import { createConversation } from '@grammyjs/conversations'
import { Anime, STATUS, updateSingleAnime } from '../models/Anime.js'
import type { AnimeContext, AnimeConversation } from '#root/types/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import { createNewAnime } from '#root/models/Anime.js'

async function greeting(conversation: AnimeConversation, ctx: AnimeContext) {
  await ctx.reply('Hello, what do you want to do?')
  const titleCtx = await conversation.waitFor(':text')
  await ctx.reply(`You said: ${titleCtx.update.message?.text}`)
}

async function updateCurrentEpisodeConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  function unwrapTypedMessageAsNumber(typedInfo: any): number {
    return Number(typedInfo.update.message?.text)
  }

  function abnormalTypedMessage(typedInfo: any): boolean {
    return !typedInfo || unwrapTypedMessageAsNumber(typedInfo) < 0 || !Number.isInteger(unwrapTypedMessageAsNumber(typedInfo))
  }
  const id = store.operatingAnimeID
  if (!id)
    return ctx.reply('animeID is null.')
  await ctx.reply('请输入频道内的显示的最新集数, 输入/exit退出')
  let typedInfo = await conversation.waitFor(':text')
  let episode = 0
  let wrongInput: boolean = abnormalTypedMessage(typedInfo)
  while (wrongInput) {
    if (typedInfo.update.message?.text === '/exit')
      return ctx.reply('退出成功')

    if (wrongInput) {
      await ctx.reply('输入有误，请重新输入')
      typedInfo = await conversation.waitFor(':text')
      wrongInput = abnormalTypedMessage(typedInfo)
    }
  }
  episode = unwrapTypedMessageAsNumber(typedInfo)
  await updateSingleAnime(id, { current_episode: episode }).then(() => {
    return ctx.reply('更新成功')
  }).catch((err) => {
    return ctx.reply('更新失败', err)
  })
}

async function createNewConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  await ctx.reply('ハロー～请输入BangumiID，群话题ID，中文名称，使用逗号隔开就好哦！ 输入/exit退出新增')
  const typedInfo = await conversation.waitFor(':text')
  let info = typedInfo.update.message?.text?.split(',')
  while (!info || info.length !== 3) {
    if (info && info[0] === '/exit')
      return ctx.reply('退出成功')
    await ctx.reply('输入有误，请重新输入')
    const typedInfo = await conversation.waitFor(':text')
    info = typedInfo.update.message?.text?.split(',')
    if (info && info.length === 3)
      break
  }
  const id = Number(info[0])
  const threadID = Number(info[1])
  const name_cn = info[2]
  await ctx.reply('现在输入动画仓库的查询串：')
  const typedInfo2 = await conversation.waitFor(':text')
  let query = typedInfo2.update.message?.text
  while (!query && query === undefined) {
    if (query === '/exit')
      return ctx.reply('退出成功')
    await ctx.reply('输入有误，请重新输入')
    const typedInfo2 = await conversation.waitFor(':text')
    query = typedInfo2.update.message?.text
    if (query)
      break
  }

  conversation.external(async () => {
    if (!query)
      query = ''
    const res = await createNewAnime({ id, threadID, name_cn, query }).then((res) => {
      console.log('res :>> ', res)
      return ctx.reply('创建成功')
    }).catch((err) => {
      console.log('err :>> ', err)
      return ctx.reply('创建失败', err)
    })
  })
}

// async function editPostConversation(conversation: AnimeConversation, ctx: AnimeContext) {
//   const id = ctx.session.postID
//   if (!id) {
//     Logger.logError('editPostConversation: id is null')
//     return
//   }
//   await ctx.reply('Enter the new post content')
//   const contentCtx = await conversation.waitFor(':text')
//   if (contentCtx.msg.text) {
//     conversation.external(() => {
//       editPost(id, contentCtx.msg.text).then(() => {
//         ctx.reply('Post edited successfully')
//       })
//     })
//   }
// }

// async function createPostConversation(conversation: AnimeConversation, ctx: AnimeContext) {
//   await ctx.reply('Enter the post id: ')
//   const id = await conversation.form.number()
//   if (id) {
//     conversation.external(() => {
//       const res = findOrCreateUser(id)
//       ctx.reply(`Post created successfully: ${res}`)
//     })
//   }
// }

const conversations = [greeting, createNewConversation, updateCurrentEpisodeConversation]

export default conversations

export function createAllConversations() {
  const { bot } = store
  if (!bot)
    return
  for (const conversation of conversations)
    bot.use(createConversation(conversation))
  Logger.logSuccess('All conversations initialized')
}
