import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#root': path.join(__dirname, 'src'),
      '@': path.join(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/unit/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'src/test/integration/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules', 'dist', 'src/test/**/*', '**/*.d.ts', 'src/start.ts'],
    },
  },
})
