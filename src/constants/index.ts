import type { AnimeThread, Command } from '#root/types/commands.js'

export const TIMER_INTERVAL_IN_SECONDS = 60 * 60 * 12

export const commandList: Command[] = [
  { command: 'start', description: 'Welcome! Up and running.' },
  { command: 'help', description: 'Show help text' },
  { command: 'settings', description: 'Open settings' },
  { command: 'about', description: 'Show information about the bot' },
  { command: 'wallpaper', description: 'Show random wallpaper' },
  { command: 'email', description: 'Send email to someone' },
  { command: 'update', description: 'Update latest anime of this thread' },
  { command: 'all', description: 'Update latest anime of all active threads' },
]

export const welcomeMessages: string[] = [
  'もふもふ気持ちいい・・いけないよだれが（鬆軟的感覺好舒服...不行啊，流口水了）',
  '笑ってください・・お願いします・・！（請笑一笑...拜託了...!)',
  'いいね！いいですね！こんなまぶしい笑顔見た事ないよ！（讚！真不錯！從來沒見過這麼耀眼的笑容！）',
  '苦手を克服しようとがんばってるんだね！えらいえらい！（你正在努力克服自己的弱點啊！了不起了不起！）',
  'かわいい妹たちのためなら石膏像になる覚悟もあるよ！（為了可愛的妹妹們，我甚至準備成為石膏像呢！）',
]

export const threadQueries: AnimeThread[] = [
  {
    title: '葬送的芙莉蓮',
    threadID: 8,
    debut: '2023-10',
    query: 'KitaujiSub+北宇治字幕組+%7C+Sousou+no+Frieren+CHS_JP&sort=time&file_suffix=',
  },
  {
    title: '16Bit的感動',
    threadID: 23,
    debut: '2023-10',
    query: 'SweetSub | 16bit Sensation - Another Layer - 16bit的感動 #16bit WebRip | 1080P | AVC 8bit | CHT',
  },
  {
    title: '藥屋少女的呢喃',
    threadID: 32,
    debut: '2023-10',
    query: 'Comicat&Romanticat | Kusuriya no Hitorigoto 藥屋少女的呢喃 #kusuriya GB&JP  | 1080P  MP4',
  },
  {
    title: '地下忍者',
    threadID: 6,
    debut: '2023-10',
    query: 'orion origin | Under Ninja CHS',
  },
  {
    title: '不死不幸',
    threadID: 43,
    debut: '2023-10',
    query: 'orion origin | Undead Unluck CHS＆JPN',
  },

]
