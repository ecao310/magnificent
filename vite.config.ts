import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/** A file in this repo, absolute, the way rolldown wants an entry named. */
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * The two pages, one HTML entry each: the Tax Torpedo at the site's root and
 * the ACA Subsidy Slope under aca/. Vite writes each to the same path under
 * dist/, and Netlify serves a directory's index.html at the directory's
 * address, so aca/index.html is /aca/ with nothing to configure, and a plain
 * link between them is enough.
 *
 * `%BASE_URL%` inside either file is the *site's* base, not the page's
 * directory, so aca/index.html spells its own icons and card `%BASE_URL%aca/…`.
 */
const PAGES = {
  torpedo: here('index.html'),
  aca: here('aca/index.html'),
}

/**
 * Which chunk a bundled module belongs in.
 *
 * Left alone, this app builds as one ~565 kB file and every build closes with
 * Vite's "some chunks are larger than 500 kB" warning. Three quarters of that
 * file is recharts and the tree under it — the chart library, its redux store,
 * its d3 scales — and none of it is app code.
 *
 * The fix is not to defer it. The chart is the top of the main column and it
 * is the answer the page exists to give, so a dynamic `import()` would buy a
 * faster first paint of an empty box and pay for it with a render waterfall in
 * front of the one thing the reader came for — a chunk behind an `import()`
 * cannot be asked for until React has mounted the component that asks. What is
 * wrong with a single ~565 kB chunk is its granularity, not its size: every
 * deploy of this repo changes app code and nothing else, and undivided that
 * re-downloads recharts and React along with it.
 *
 * So: static chunks, layered app -> charts -> react, plus the 0.7 kB runtime
 * rolldown emits to link them. Vite writes a `modulepreload` for each into
 * index.html, so a first-time reader still fetches them in parallel off one
 * HTML parse and pays nothing for the split; a returning one fetches the
 * ~47 kB that changed and keeps the rest, which netlify.toml serves as
 * immutable for a year on the strength of the content hash in each name. Both vendor chunks
 * are under the 500 kB line, which is what retires the warning rather than
 * silencing it with `chunkSizeWarningLimit`.
 *
 * The rule reads "everything in node_modules that is not React is the chart
 * library" because recharts is the only other runtime dependency in
 * package.json. That is an invariant, not an observation, and `the build's
 * chunking` in src/guards/build.test.ts fails the moment a fourth dependency makes it
 * untrue — at which point this rule needs a name that is still honest.
 */
function chunkFor(id: string): string | undefined {
  if (/[/\\]src[/\\]shared[/\\]/.test(id)) return 'site'
  if (!id.includes('node_modules')) return undefined
  return /node_modules[/\\](react|react-dom|react-is|scheduler)[/\\]/.test(id)
    ? 'react'
    : 'charts'
}

/**
 * The rule above, in the shape rolldown wants: one group per chunk name, each
 * capturing the modules `chunkFor` sends to it.
 *
 * The obvious spelling is one group whose `name` is `chunkFor` itself —
 * rolldown accepts a name function and treats each string it returns as its
 * own group. Do not use it. Under that form rolldown emits a `react` chunk
 * holding only react-dom's 0.8 kB ESM wrapper and leaves react-dom itself in
 * `charts`, which is the exact split this rule exists to prevent and which no
 * assertion about `chunkFor` can see. One group per name, matched in order, is
 * the form that actually separates them: measured at 139.83 / 357.37 kB
 * against the name-function form's 0.80 / 496.78.
 *
 * `site` is the third layer: src/shared, which both pages import — the
 * page shell and its masthead, the rail's fold, the figures, the notes, the
 * plot's box and marks, the address-bar and pointer hooks. Rolldown would
 * split it out on its own, since two entries share it, but under a name
 * derived from whichever module it met first; naming the group is what lets
 * `the build it emits` find it.
 */
const CHUNKS = ['react', 'charts', 'site'] as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /* The site is the whole of its domain. It lived under /magnificent/ on
     GitHub Pages until September 2026, which is why nothing in a page writes
     a bare `/`: every address goes through this. */
  base: '/',
  /* Two pages, no client-side routes: an address neither page owns is a 404
     in dev and preview, as it is on Netlify. */
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: PAGES,
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
