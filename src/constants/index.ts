import type { Command } from '#root/types/index.js'

export const TIMER_INTERVAL_IN_SECONDS = 60 * 60 * 24

export function buildCommandList(botName?: string): Command[] {
  return [
    { command: 'start', description: '欢迎信息.' },
    { command: 'help', description: '显示所有命令' },
    { command: 'settings', description: '打开机器人设置' },
    { command: 'about', description: `关于${botName || '这个机器人'}` },
    { command: 'create', description: '创建一个新的动画, 使用/getid命令可以获取当前频道的id' },
    { command: 'dashboard', description: '显示数据库中所有动画的统计信息(推荐私聊！）' },
    { command: 'info', description: '显示当前动画的元信息' },
    { command: 'meta', description: '显示当前频道绑定动画的原始数据' },
    { command: 'getid', description: '获取当前频道ID，请先打开群组的频道并且创建频道！' },
    { command: 'schedule', description: '显示本周动画放送时间表' },
    { command: 'cron', description: '通过cron表达式设定定时任务的频率' },
    { command: 'dailytask', description: '手动触发每日剧集更新任务' },
    { command: 'weeklytask', description: '手动触发每周元数据更新任务' },
  ]
}

export const welcomeMessages: string[] = [
  '你好！',
  'こんにちは！',
  'Hello! ',
]
