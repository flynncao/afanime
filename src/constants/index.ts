import type { AnimeThread, Command } from '#root/types/index.js'
import 'dotenv/config'

export const TIMER_INTERVAL_IN_SECONDS = 60 * 60 * 24

export const commandList: Command[] = [
  { command: 'start', description: '欢迎信息.' },
  { command: 'help', description: '显示所有命令' },
  { command: 'settings', description: '打开机器人设置' },
  { command: 'about', description: `关于${process.env.BOT_NAME ? process.env.BOT_NAME : '这个机器人'}` },
  { command: 'update', description: '更新当前频道的动画' },
  { command: 'update_all', description: '更新所有频道的动画，默认每天更新' },
  { command: 'dashboard', description: '显示数据库中所有动画的统计信息' },
  { command: 'info', description: '显示当前动画的元信息' },
  { command: 'get_info', description: '抓取当前动画的原信息，请先使用/create命令在数据库中添加这个动画！' },
  { command: 'get_info_all', description: '抓取所有动画的元信息，请先使用/create命令在数据库中添加这个动画！' },
]

// TODO: Consider mobilizing OpenAI to generate anime girl messages
export const welcomeMessages: string[] = [
  'おはよう！',
]

// TODO: Set as mongodb database initial value
export const threadQueries: AnimeThread[] = [
  {
    bangumiID: 400602,
    title: '葬送的芙莉蓮',
    threadID: 8,
    debut: '2023-10',
    query: 'KitaujiSub+北宇治字幕組+%7C+Sousou+no+Frieren+CHS_JP&sort=time&file_suffix=',
  },
  {
    bangumiID: 413741,
    title: '16Bit的感動',
    threadID: 23,
    debut: '2023-10',
    query: 'SweetSub | 16bit Sensation - Another Layer - 16bit的感動 #16bit WebRip | 1080P | AVC 8bit | CHT',
  },
  {
    bangumiID: 420628,
    title: '藥屋少女的呢喃',
    threadID: 32,
    debut: '2023-10',
    query: 'Comicat&Romanticat | Kusuriya no Hitorigoto 藥屋少女的呢喃 #kusuriya GB&JP  | 1080P  MP4',
  },
  {
    bangumiID: 348220,
    title: '地下忍者',
    threadID: 6,
    debut: '2023-10',
    query: 'orion origin | Under Ninja CHS',
  },
  {
    bangumiID: 397808,
    title: '不死不幸',
    threadID: 43,
    debut: '2023-10',
    query: 'orion origin | Undead Unluck CHS＆JPN',
  },
  {
    bangumiID: 404115,
    title: '星灵感应',
    threadID: 3,
    debut: '2023-10',
    query: 'Nekomoe kissaten | Hoshikuzu Telepath  1080p | JPSC',
  },

]
