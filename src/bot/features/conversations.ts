import type { Bot } from 'grammy'
import type { AnimeContext, AnimeConversation, AnimeConversationContext } from '#root/types/index.js'
import { createConversation } from '@grammyjs/conversations'
import { isValidCronExpr } from '#root/core/cron.js'
import { createNewAnime, readSingleAnime, updateSingleAnimeQuick } from '#root/models/Anime.js'
import { updateMultipleCronQuick } from '#root/models/Cron.js'
import { updateAnimeMetaAndEpisodes } from '#root/modules/anime/index.js'
import Logger from '#root/utils/logger.js'

interface AskOptions {
  parse_mode?: 'MarkdownV2'
  link_preview_options?: { is_disabled: boolean }
}

/**
 * Prompt until `validate` accepts the reply. Returns undefined when the
 * user sends /exit (a farewell is already replied).
 */
async function askUntil(
  conversation: AnimeConversation,
  ctx: AnimeConversationContext,
  prompt: string,
  validate: (text: string) => boolean,
  options: AskOptions = {},
): Promise<string | undefined> {
  await ctx.reply(prompt, options)
  for (;;) {
    const typedCtx = await conversation.waitFor(':text')
    const text = typedCtx.message?.text ?? ''
    if (text === '/exit') {
      await ctx.reply('退出成功')
      return undefined
    }
    if (validate(text))
      return text
    await ctx.reply('输入有误，请重新输入')
  }
}

const isNonNegativeInt = (text: string) => Number.isInteger(Number(text)) && Number(text) >= 0

async function updateAnimeQueryConversation(conversation: AnimeConversation, ctx: AnimeConversationContext, animeID: number) {
  const anime = await conversation.external(() => readSingleAnime(animeID))
  if (!anime)
    return ctx.reply('找不到动画信息')
  const previousQuery = anime.query ? `现在的查询串为：\`${anime.query}\`` : ''
  const query = await askUntil(conversation, ctx, `${previousQuery}\n请输入动画仓库的查询串，输入/exit退出`, text => text.length > 0, { parse_mode: 'MarkdownV2' })
  if (query === undefined)
    return
  await conversation.external(() => updateSingleAnimeQuick(animeID, { query }))
    .then(() => ctx.reply('更新成功'))
    .catch(() => ctx.reply('更新失败'))
}

async function updateCurrentEpisodeConversation(conversation: AnimeConversation, ctx: AnimeConversationContext, animeID: number) {
  const text = await askUntil(conversation, ctx, '请输入频道内的显示的最新集数, 输入/exit退出', isNonNegativeInt)
  if (text === undefined)
    return
  await conversation.external(() => updateSingleAnimeQuick(animeID, { current_episode: Number(text) }))
    .then(() => ctx.reply('更新成功'))
    .catch(() => ctx.reply('更新失败'))
}

async function updateAnimeStartEpisodeConversation(conversation: AnimeConversation, ctx: AnimeConversationContext, animeID: number) {
  const text = await askUntil(conversation, ctx, '请输入此动画的开始集数，默认为1, 输入/exit退出', isNonNegativeInt)
  if (text === undefined)
    return
  await conversation.external(() => updateSingleAnimeQuick(animeID, { eps: Number(text) }))
    .then(() => ctx.reply('更新成功'))
    .catch(() => ctx.reply('更新失败'))
}

async function updateAnimeNamePhantomConversation(conversation: AnimeConversation, ctx: AnimeConversationContext, animeID: number) {
  const anime = await conversation.external(() => readSingleAnime(animeID))
  if (!anime)
    return ctx.reply('找不到动画信息')
  const previousPhantom = anime.name_phantom ? `现在的匹配串为：\`${anime.name_phantom}\`` : ''
  const phantom = await askUntil(
    conversation,
    ctx,
    `${previousPhantom}\n请输入以竖线分割的匹配要素，除去动画名和字幕组外可以匹配分辨率、字幕格式等，剔除动画仓库推送消息标题中不包含集数的部分可以得到较为精准的匹配串，如\`ANi | 孤獨搖滾 | 1080P | CHS\`\n输入/exit退出`,
    text => text.length > 0,
    { parse_mode: 'MarkdownV2' },
  )
  if (phantom === undefined)
    return
  await conversation.external(() => updateSingleAnimeQuick(animeID, { name_phantom: phantom }))
    .then(() => ctx.reply('更新成功'))
    .catch(() => ctx.reply('更新失败'))
}

async function createNewConversation(conversation: AnimeConversation, ctx: AnimeConversationContext) {
  const isIdPair = (text: string) => {
    const parts = text.split(',')
    return parts.length === 2 && parts.every(part => Number.isInteger(Number(part.trim())))
  }
  const info = await askUntil(conversation, ctx, '嗨！请输入BangumiID，群话题ID，使用逗号隔开就好哦！ 输入/exit退出新增', isIdPair)
  if (info === undefined)
    return
  const [id, threadID] = info.split(',').map(part => Number(part.trim()))

  const query = await askUntil(
    conversation,
    ctx,
    '现在输入动画仓库的查询串,输入1表示使用默认中文名搜索，你可以稍后使用dashboard命令进入子菜单并中修改这个查询串，具体来源：[Real Search](https://search.acgn.es/)：',
    text => text.length > 0,
    { parse_mode: 'MarkdownV2', link_preview_options: { is_disabled: true } },
  )
  if (query === undefined)
    return

  try {
    await conversation.external(() => createNewAnime({ id, threadID, name_cn: ' ', query }))
    await ctx.reply('创建成功, 拉取Bangumi主题信息中...')
    const message = await conversation.external(() => updateAnimeMetaAndEpisodes(id))
    await ctx.reply(message)
  }
  catch (error) {
    Logger.logError(`创建失败: ${error}`)
    await ctx.reply('创建失败')
  }
}

async function updateAnimeUpdateFrequency(conversation: AnimeConversation, ctx: AnimeConversationContext) {
  await ctx.reply('输入[Cron格式](https://crontab.cronhub.io/)的表达式来规定以下拉取频率，输入/exit退出', {
    parse_mode: 'MarkdownV2',
  })
  const daily = await askUntil(conversation, ctx, '正在修改：动画仓库拉取频率，默认为每天8时，即\`0 0 8 * * *\`', isValidCronExpr)
  if (daily === undefined)
    return ctx.reply('拉取频率将保持不变。')
  const weekly = await askUntil(conversation, ctx, '正在修改：动画元信息拉取频率，默认为每天0时，即\`0 0 0 * * *\`', isValidCronExpr)
  if (weekly === undefined)
    return ctx.reply('拉取频率将保持不变。')

  await ctx.reply(`日推cron: ${daily}\n周拉取cron: ${weekly}，修改中...`)
  await conversation.external(() => updateMultipleCronQuick(['updateAnimeLibraryEpisodesInfo', 'updateAnimeLibraryMetaInfo'], [daily, weekly]))
    .then(() => ctx.reply('修改成功！请手动重启服务！'))
    .catch(() => ctx.reply('修改失败'))
}

const conversationBuilders = [
  updateAnimeQueryConversation,
  updateCurrentEpisodeConversation,
  updateAnimeStartEpisodeConversation,
  updateAnimeNamePhantomConversation,
  createNewConversation,
  updateAnimeUpdateFrequency,
]

export function registerConversations(bot: Bot<AnimeContext>) {
  for (const builder of conversationBuilders)
    bot.use(createConversation(builder))
  Logger.logSuccess('All conversations initialized')
}
