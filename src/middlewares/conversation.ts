import { createConversation } from '@grammyjs/conversations'
import { readSingleAnime, updateSingleAnimeQuick } from '../models/Anime.js'
import type { AnimeContext, AnimeConversation } from '#root/types/index.js'
import store from '#root/databases/store.js'
import Logger from '#root/utils/logger.js'
import { createNewAnime, deleteAnime } from '#root/models/Anime.js'
import { updateAnimeMetaAndEpisodes } from '#root/modules/anime/index.js'
import type { AniConversationContext } from '#root/classes/grammy/CustomConversation.js'
import { AniConversationBuilder } from '#root/classes/grammy/CustomConversation.js'
import { isValidCron } from '#root/utils/cron-utils.js'
import { updateMultipleCronQuick } from '#root/models/Cron.js'
/**
 * CONVERSATIONS
 */
async function greeting(conversation: AnimeConversation, ctx: AnimeContext) {
  await ctx.reply('Hello, what do you want to do?')
  const titleCtx = await conversation.waitFor(':text')
  await ctx.reply(`You said: ${titleCtx.update.message?.text}`)
}

async function updateAnimeQueryConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  if (!ctx.session.operatingAnimeID)
    return ctx.reply('animeID is null.')
  const anime = await readSingleAnime(ctx.session.operatingAnimeID)
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
  await updateSingleAnimeQuick(ctx.session.operatingAnimeID, { query: msg }).then(() => {
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
  const id = ctx.session.operatingAnimeID
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

/**
 * Core create-with-rollback logic for `createNewConversation` (issue #42).
 * Extracted so it can be unit-tested without a full grammy conversations
 * harness. Performs the DB insert, metadata fetch, and compensating delete on
 * failure.
 *
 * @param id Bangumi subject id.
 * @param threadID Telegram group topic id.
 * @param query NEP search query string.
 * @param reply Stand-in for `ctx.reply` (so the function is ctx-shape agnostic).
 */
export async function performCreateWithRollback(
  id: number,
  threadID: number,
  query: string | undefined,
  reply: (text: string) => Promise<unknown>,
): Promise<void> {
  const resolvedQuery = query ?? ''
  let createdInDb = false
  try {
    await createNewAnime({ id, threadID, name_cn: ' ', query: resolvedQuery })
    createdInDb = true
    store.AT.insertOne(id, threadID, ' ')
    Logger.logSuccess(`创建成功: id=${id} threadID=${threadID}`)
    await reply('创建成功, 拉取Bangumi主题信息中...')
    const msg = await updateAnimeMetaAndEpisodes(id)
    await reply(msg)
  }
  catch (err) {
    Logger.logError(`创建失败，开始回滚 (id=${id}): ${err}`)
    if (createdInDb) {
      await deleteAnime(id).catch(e => Logger.logError(`回滚删除DB记录失败: ${e}`))
    }
    store.AT.removeOne(id)
    await reply('创建失败，已清理无效记录，请稍后重试。')
  }
}

async function createNewConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  await ctx.reply('嗨！请输入BangumiID，群话题ID，使用逗号隔开就好哦！ 输入/exit退出新增')
  const typedInfo = await conversation.waitFor(':text')
  let info = typedInfo.update.message?.text?.split(',').map(s => s.trim())
  // Stricter validation (issue #44): both parts must be positive integers.
  // This rejects accidental double-paste like "123, 456, 123, 456".
  function isValidCreateInput(parts: string[] | undefined): parts is [string, string] {
    if (!parts || parts.length !== 2)
      return false
    const a = Number(parts[0])
    const b = Number(parts[1])
    return Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0
  }
  while (!isValidCreateInput(info)) {
    if (info && info[0] === '/exit')
      return ctx.reply('退出成功')
    await ctx.reply('输入有误，请重新输入（格式：BangumiID, 群话题ID，均为正整数）')
    const typedInfo = await conversation.waitFor(':text')
    info = typedInfo.update.message?.text?.split(',').map(s => s.trim())
    if (isValidCreateInput(info))
      break
  }
  const id = Number(info[0])
  const threadID = Number(info[1])
  await ctx.reply('现在输入动画仓库的查询串,输入1表示使用默认中文名搜索，你可以稍后使用dashboard命令进入子菜单并中修改这个查询串，具体来源：[Real Search](https://search.acgn.es/)：', {
    parse_mode: 'MarkdownV2',
    link_preview_options: {
      is_disabled: true,
    },
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
    await performCreateWithRollback(id, threadID, query, msg => ctx.reply(msg))
  })
}

async function updateAnimeNamePhantomConversation(conversation: AnimeConversation, ctx: AnimeContext) {
  if (!ctx.session.operatingAnimeID) {
    return ctx.reply('animeID is null.')
  }
  const operatingAnimeID: number = ctx.session.operatingAnimeID
  const anime = await readSingleAnime(operatingAnimeID)
  if (!anime) {
    await ctx.reply('找不到动画信息')
    return
  }
  let msg: string | undefined = ''
  do {
    const previousPhantom = anime.name_phantom ? `现在的匹配串为：\`${anime.name_phantom}\`` : ''
    await ctx.reply(`${previousPhantom}\n请输入以竖线分割的匹配要素，除去动画名和字幕组外可以匹配分辨率、字幕格式等，剔除动画仓库推送消息标题中不包含集数的部分可以得到较为精准的匹配串，如\`ANi | 孤獨搖滾 | 1080P | CHS\`\n输入/exit退出`, {
      parse_mode: 'MarkdownV2',
    })
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
  const id = ctx.session.operatingAnimeID
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

async function updateAnimeUpdateFrequency(conversation: AnimeConversation, ctx: AnimeContext) {
  const testCron = (input: string) => {
    if (input.includes('?')) {
      return false
    }
    return isValidCron(input)
  }
  const userCrons: string[] = []
  ctx.reply('输入[Cron格式](https://crontab.cronhub.io/)的表达式来规定以下拉取频率，输入/exit退出', {
    parse_mode: 'MarkdownV2',
  })
  await new AniConversationBuilder().addContext(conversation, ctx).addStep('updateAnimeLibraryEpisodesInfo', testCron, {
    hint: '正在修改：动画仓库拉取频率，默认为每天8时，即`0 8 * * *` \\(或旧版的 `0 0 8 * * *`\\)',
    error: 'cron格式输入有误 \\(注意不支持 `?`，请使用 `*`\\)，请重新输入',
  }, ({ context, conversation }: AniConversationContext, data: string) => {
    userCrons.push(data)
  }).addStep(
    'updateAnimeLibraryMetaInfo',
    testCron,
    {
      hint: '正在修改：动画元信息拉取频率，默认为每天0时，即`0 0 * * *`，或旧版的 `0 0 0 * * *`',
      error: 'cron格式输入有误，请重新输入。',
    },
    ({ context, conversation }: AniConversationContext, data: string) => {
      if (data !== '/exit') {
        userCrons.push(data)
      }
    },
  ).build().start()
  // output
  if (userCrons.length === 0) {
    return ctx.reply('拉取频率将保持不变。')
  }
  else {
    await ctx.reply(`日推cron: ${userCrons[0]}\n周拉取cron: ${userCrons[1]}，修改中...`)
    updateMultipleCronQuick(['updateAnimeLibraryEpisodesInfo', 'updateAnimeLibraryMetaInfo'], userCrons).then(() => {
      ctx.reply('修改成功！请手动重启服务！')
      // https://github.com/node-cron/node-cron/issues/388 Not working
      // if (store.cronInstance) {
      //   store.cronInstance.forEach((job) => {
      //     job.restart()
      //   })
      // }
    }).catch((err: any) => {
      return ctx.reply('修改失败', err)
    })
  }
}

const conversations = [
  greeting,
  updateAnimeQueryConversation,
  updateCurrentEpisodeConversation,
  createNewConversation,
  updateAnimeNamePhantomConversation,
  updateAnimeStartEpisodeConversation,
  updateAnimeUpdateFrequency,
]
export function createAllConversations() {
  const { bot } = store
  if (!bot)
    return
  for (const conversation of conversations)
    bot.use(createConversation(conversation))
  Logger.logSuccess('All conversations initialized')
}
