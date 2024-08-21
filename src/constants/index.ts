import type { Command } from '#root/types/index.js'
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
  { command: 'schedule', description: '显示本周动画放送时间表' },
]

// TODO: Consider mobilizing OpenAI to generate anime girl messages
export const welcomeMessages: string[] = [
  '你好！',
  'こんにちは！',
  'Hello! ',
]
