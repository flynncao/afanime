import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: [
      'src/start.ts',
    ],
    splitting: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    format: ['esm', 'cjs'],
    minify: !options.watch,
  }
})
