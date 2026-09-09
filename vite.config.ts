import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Which chunk a bundled module belongs in: app -> charts -> react, so a
 * deploy that changes app code re-downloads app code and nothing else. The
 * rule reads "everything in node_modules that is not React is the chart
 * library" because recharts is the only other runtime dependency; `the
 * build's chunking` in src/guards/build.test.ts fails the moment that stops
 * being true.
 */
function chunkFor(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  return /node_modules[/\\](react|react-dom|react-is|scheduler)[/\\]/.test(id)
    ? 'react'
    : 'charts'
}

const CHUNKS = ['react', 'charts'] as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/super-duper-broccoli/',
  build: {
    rollupOptions: {
      /* Two pages, two entries: the site's root and the rate page under it.
         Each is an html file at the path it is served from, so the build
         writes dist/effective-rate/index.html and Pages serves the
         directory. `the front door` in src/guards/meta.test.tsx reads this
         list to learn which URLs under the site the README may name. */
      input: {
        cost: 'index.html',
        rate: 'effective-rate/index.html',
      },
      output: {
        codeSplitting: {
          groups: CHUNKS.map((name) => ({
            name,
            test: (id: string) => chunkFor(id) === name,
          })),
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
