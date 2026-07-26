import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/start.ts',
  ],
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  format: ['esm'],
  minify: false,
})
