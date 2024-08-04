import { createConversation } from '@grammyjs/conversations'
import { readSingleAnime, updateSingleAnimeQuick } from '../models/Anime.js'
import type { AnimeContext, AnimeConversation } from '#root/types/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import { createNewAnime } from '#root/models/Anime.js'
import { updateAnimeMetaAndEpisodes } from '#root/modules/anime/index.js'

/**
 * CONVERSATIONS
 */
async function greeting(conversation: AnimeConversation, ctx: AnimeContext) {
  await ctx.reply('Hello, what do you want to do?')
  const titleCtx = await conversation.waitFor(':text')
  await ctx.reply(`You said: ${titleCtx.update.message?.text}`)
}

async function updateAnimeQueryConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  if (!store.operatingAnimeID)
    return ctx.reply('animeID is null.')
  const anime = await readSingleAnime(store.operatingAnimeID)
  if (!anime) {
    await ctx.reply('找不到动画信息')
    return
  }
  // TODO: (fix) conversation only works in the same layer, WHY?
  let msg: string | undefined = ''
  do {
    const previousQuery = anime.query ? `现在的查询串为：\`${anime.query}\`` : ''
    await ctx.reply(`${previousQuery}\n请输入动画仓库的查询串，输入/exit退出`, {
      parse_mode: 'MarkdownV2',
    })
    const typedCtx = await conversation.waitFor(':text')
    msg = typedCtx?.update.message?.text
    if (!msg)
      await ctx.reply('输入有误，请重新输入')
    if (msg === '/exit')
      return ctx.reply('退出成功')
  } while (!msg)
  await updateSingleAnimeQuick(store.operatingAnimeID, { query: msg }).then(() => {
    return ctx.reply('更新成功')
  }).catch((err) => {
    return ctx.reply('更新失败', err)
  })
}

async function updateCurrentEpisodeConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  function unwrapTypedMessageAsNumber(typedInfo: any): number {
    return Number(typedInfo.update.message?.text)
  }

  function abnormalTypedMessage(typedInfo: any): boolean {
    return !typedInfo || unwrapTypedMessageAsNumber(typedInfo) < 0 || !Number.isInteger(unwrapTypedMessageAsNumber(typedInfo))
  }
  // TODO: (refactor) Better error handling
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
  await updateSingleAnimeQuick(id, { current_episode: episode }).then(() => {
    return ctx.reply('更新成功')
  }).catch((err) => {
    return ctx.reply('更新失败', err)
  })
}

async function createNewConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  await ctx.reply('嗨！请输入BangumiID，群话题ID，使用逗号隔开就好哦！ 输入/exit退出新增')
  const typedInfo = await conversation.waitFor(':text')
  let info = typedInfo.update.message?.text?.split(',')
  while (!info || info.length !== 2) {
    if (info && info[0] === '/exit')
      return ctx.reply('退出成功')
    await ctx.reply('输入有误，请重新输入')
    const typedInfo = await conversation.waitFor(':text')
    info = typedInfo.update.message?.text?.split(',')
    if (info && info.length === 2)
      break
  }
  const id = Number(info[0])
  const threadID = Number(info[1])
  const name_cn = ' '
  await ctx.reply('现在输入动画仓库的查询串,输入1表示使用默认中文名搜索，你可以稍后使用dashboard命令进入子菜单并中修改这个查询串，具体来源：[Real Search](https://search.acgn.es/)：', {
    parse_mode: 'MarkdownV2',
    disable_web_page_preview: true,
  })
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
    await createNewAnime({ id, threadID, name_cn, query }).then(async (res) => {
      Logger.logSuccess(`创建成功: ${res} `)
      store.AT.insertOne(id, threadID, name_cn)
      ctx.reply('创建成功, 拉取Bangumi主题信息中...')
      const msg = await updateAnimeMetaAndEpisodes(id)
      await ctx.reply(msg)
    }).catch((err) => {
      Logger.logError(`创建失败: ${err}`)
      return ctx.reply('创建失败')
    })
  })
}

async function updateAnimeNamePhantomConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  if (!store.operatingAnimeID) {
    return ctx.reply('animeID is null.')
  }
  const operatingAnimeID: number = store.operatingAnimeID
  const anime = await readSingleAnime(operatingAnimeID)
  if (!anime) {
    await ctx.reply('找不到动画信息')
    return
  }
  let msg: string | undefined = ''
  do {
    const previousPhantom = anime.name_phantom ? `现在的匹配串为：\`${anime.name_phantom}\`` : ''
    await ctx.reply(`${previousPhantom}\n请输入以竖线分割的匹配要素，除去动画名和字幕组外可以匹配分辨率、字幕格式等，剔除动画仓库推送消息标题中不包含集数的部分可以得到较为精准的匹配串，如\`ANi | 孤獨搖滾 | 1080P | CHS\`\n输入/exit退出`,{
      parse_mode: 'MarkdownV2',
    });
    const typedCtx = await conversation.waitFor(':text')
    msg = typedCtx?.update.message?.text
    if (!msg)
      await ctx.reply('输入有误，请重新输入')
    if (msg === '/exit')
      return ctx.reply('退出成功')
  } while (!msg)
  await updateSingleAnimeQuick(operatingAnimeID, { name_phantom: msg }).then(() => {
    return ctx.reply('更新成功')
  }).catch((err) => {
    return ctx.reply('更新失败', err)
  })
}

async function updateAnimeStartEpisodeConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  function unwrapTypedMessageAsNumber(typedInfo: any): number {
    return Number(typedInfo.update.message?.text)
  }

  function abnormalTypedMessage(typedInfo: any): boolean {
    return !typedInfo || unwrapTypedMessageAsNumber(typedInfo) < 0 || !Number.isInteger(unwrapTypedMessageAsNumber(typedInfo))
  }
  // TODO: (refactor) Better error handling
  const id = store.operatingAnimeID
  if (!id)
    return ctx.reply('animeID is null.')
  await ctx.reply('请输入此动画的开始集数，默认为1, 输入/exit退出')
  let typedInfo = await conversation.waitFor(':text')
  let episode = 1
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
  await updateSingleAnimeQuick(id, { eps: episode }).then(() => {
    return ctx.reply('更新成功')
  }).catch((err) => {
    return ctx.reply('更新失败', err)
  })
}
const conversations = [
  greeting,
  updateAnimeQueryConversation,
  updateCurrentEpisodeConversation,
  createNewConversation,
  updateAnimeNamePhantomConversation,
  updateAnimeStartEpisodeConversation,
]
export function createAllConversations() {
  const { bot } = store
  if (!bot)
    return
  for (const conversation of conversations)
    bot.use(createConversation(conversation))
  Logger.logSuccess('All conversations initialized')
}
