import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Afanime',
  description: 'A powerful ani-library forwarding Bot for Telegram.',
  srcDir: 'src',
  locales: {
    root: {
      label: 'Chinese',
      lang: 'zh',
      themeConfig: {
        nav: [
          { text: '主页', link: '/' },
          { text: '部署', link: '/deployment' },
          { text: '开发', link: '/development' },
        ],
        socialLinks: [
          {
            icon: 'github',
            link: 'https://github.com/flynncao/afanime',
          },
          {
            icon: 'telegram',
            link: 'https://t.me/majimaydev',
          },
        ],
      },
    },
  },
})
