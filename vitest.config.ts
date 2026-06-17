import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#root': resolve(__dirname, 'src'),
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    globals: false,
  },
})
