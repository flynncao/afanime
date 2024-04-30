import type { AnimeThread, Command } from '#root/types/index.js'
import 'dotenv/config'

export const TIMER_INTERVAL_IN_SECONDS = 60 * 60 * 24

export const commandList: Command[] = [
  { command: 'start', description: '欢迎信息.' },
  { command: 'help', description: '显示所有命令' },
  { command: 'settings', description: '打开机器人设置' },
  { command: 'about', description: `关于${process.env.BOT_NAME ? process.env.BOT_NAME : '这个机器人'}` },
  { command: 'create', description: '创建一个新的动画, 使用/getid命令可以获取当前频道的id' },
  { command: 'dashboard', description: '显示数据库中所有动画的统计信息(推荐私聊！）' },
  { command: 'info', description: '显示当前动画的元信息' },
  { command: 'menu', description: '显示当前频道绑定动画的菜单' },
  { command: 'getid', description: '获取当前频道ID，请先打开群组的频道并且创建频道！' },
]

// TODO: Consider mobilizing OpenAI to generate anime girl messages
export const welcomeMessages: string[] = [
	'你好！',
	'こんにちは！',
	'Hello! ',
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
