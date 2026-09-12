/**
 * What both link-preview cards are drawn on: the arithmetic bundled out of
 * `src`, the browser that rasterises, the site's faces and tokens, and the
 * card's frame — the kicker and the rule, the headline and the deck, the
 * two-line hook at the right, the address at the foot. Each page's script,
 * `og-cover.mjs` and `og-cover-aca.mjs`, samples its own curve, draws its
 * own plot inside the frame, and hands the result to `publish`.
 *
 * These are the assets in the repo that are generated rather than written,
 * and the ones no deploy workflow can generate: rasterising needs a browser,
 * and neither workflow installs one. So the PNGs are committed, and the
 * scripts are how they are re-made when the page they stand for changes.
 *
 * Two things this leans on are outside `package.json`. `rolldown`, which vite
 * brings, bundles `src` so a plain node script can import it. The browser is
 * whatever the last `npx playwright install chromium` left in the Playwright
 * cache — the headless shell is driven directly, by its own command line, so
 * nothing has to be installed to talk to it; `CHROME_PATH` points at any
 * other Chromium build instead.
 *
 * The faces are the page's own, fetched from Google Fonts while the card is
 * drawn, which is why this needs a network as well as a browser: a card set
 * in Georgia would be a different page's card.
 */
import { build } from 'rolldown';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ── The arithmetic ──────────────────────────────────────────────────────── */

/**
 * `src` is TypeScript and these are plain node scripts, so a module has to be
 * bundled before it can be imported. `entries` are the modules the card
 * needs, relative to the repo root — a page's engine and the file the page
 * reads its opening state out of — re-exported together.
 */
export async function loadModule(entries) {
  const dir = mkdtempSync(join(tmpdir(), 'og-cover-'));
  const entry = join(dir, 'entry.ts');
  const out = join(dir, 'bundle.mjs');
  writeFileSync(
    entry,
    entries.map((path) => `export * from ${JSON.stringify(join(ROOT, path))};\n`).join(''),
  );
  await build({ input: entry, output: { file: out, format: 'esm' }, platform: 'node', logLevel: 'silent' });
  const mod = await import(pathToFileURL(out).href);
  rmSync(dir, { recursive: true, force: true });
  return mod;
}

/* ── The browser ─────────────────────────────────────────────────────────── */

/**
 * The newest Chromium build in the Playwright cache, headless shell first,
 * and `CHROME_PATH` ahead of all of it.
 */
export function chromiumPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache =
    process.platform === 'darwin'
      ? join(homedir(), 'Library/Caches/ms-playwright')
      : join(homedir(), '.cache/ms-playwright');
  if (!existsSync(cache)) return null;
  const leaves = [
    'chrome-headless-shell-mac-arm64/chrome-headless-shell',
    'chrome-headless-shell-linux64/chrome-headless-shell',
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-linux/chrome',
  ];
  const builds = readdirSync(cache)
    .filter((name) => /^chromium(_headless_shell)?-\d+$/.test(name))
    .sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()));
  for (const dir of builds) {
    for (const leaf of leaves) {
      const candidate = join(cache, dir, leaf);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** The page's own faces, from the one host it loads them from. */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap';

/**
 * Rasterise one SVG string at its own size.
 *
 * The SVG is wrapped in a page that links the fonts, and the browser is given
 * a virtual-time budget long enough for them to arrive before the screenshot
 * is taken — the same shell flag that lets a headless capture wait out a
 * network fetch without a driver.
 */
export function rasterise(executablePath, svg, { width, height, path }) {
  const dir = mkdtempSync(join(tmpdir(), 'og-cover-page-'));
  const page = join(dir, 'page.html');
  writeFileSync(
    page,
    `<!doctype html><html><head><meta charset="utf-8">` +
      `<link rel="stylesheet" href="${FONTS}"></head>` +
      `<body style="margin:0;background:transparent">${svg}</body></html>`,
  );
  execFileSync(
    executablePath,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=15000',
      `--screenshot=${path}`,
      pathToFileURL(page).href,
    ],
    { stdio: 'ignore' },
  );
  rmSync(dir, { recursive: true, force: true });
  console.log(`wrote ${path.replace(`${ROOT}/`, '')}  ${width}x${height}`);
}

/* ── The card ────────────────────────────────────────────────────────────── */

/**
 * The site's own tokens: `:root` in src/shared/styles/site.css, written a
 * second time because an SVG attribute takes a literal. `the cover` in
 * src/guards/meta.test.ts holds them to the sheet.
 */
export const SURFACE = '#f7f3eb';
export const INK = '#261d16';
export const INK_BRIGHT = '#160d07';
export const INK_SOFT = '#50453d';
export const INK_MUTED = '#6c6158';
export const EDGE = '#c9c3ba';
export const ACCENT = '#2769b7';
export const AMBER = '#b76100';

export const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
export const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";

export const WIDTH = 1200;
export const HEIGHT = 630;

/** An axis figure, short enough for a tick: $150,000 as `$150K`. */
export const money = (n) => `$${Math.round(n / 1000)}K`;

/**
 * The horizontal rules of the plot, each labelled at the left, the one at
 * zero drawn in ink. `y` places a value on the card; `label` names it.
 */
export const gridLines = (plot, values, y, label) =>
  values
    .map(
      (value) =>
        `<line x1="${plot.left}" y1="${y(value).toFixed(1)}" x2="${plot.right}" y2="${y(value).toFixed(1)}" stroke="${value === 0 ? INK : EDGE}" stroke-width="1"/>` +
        `<text x="${plot.left - 12}" y="${(y(value) + 5).toFixed(1)}" fill="${INK_MUTED}" font-family="${MONO}" font-size="15" text-anchor="end">${label(value)}</text>`,
    )
    .join('\n  ');

/** The income axis's ticks, under the plot, in `money`. */
export const axisTicks = (plot, values, x) =>
  values
    .map(
      (value) =>
        `<line x1="${x(value).toFixed(1)}" y1="${plot.bottom}" x2="${x(value).toFixed(1)}" y2="${plot.bottom + 8}" stroke="${INK}" stroke-width="1"/>` +
        `<text x="${x(value).toFixed(1)}" y="${plot.bottom + 30}" fill="${INK_MUTED}" font-family="${MONO}" font-size="15" text-anchor="middle">${money(value)}</text>`,
    )
    .join('\n  ');

/**
 * The card: the frame both pages share, around the plot each draws.
 *
 * `kicker` and `tag` sit either end of the top rule; `title` and `deck` are
 * two lines each under it. The hook at the right is two labelled figures,
 * the second in amber — the one the card exists to quote; `struck` draws
 * the first with a line through it, in the colour given. `plot` is the
 * page's own SVG, drawn between the hook and the address at the foot, and
 * `axis` names the axis it runs along.
 */
export function card({ kicker, tag, title, deck, hook, plot, path, axis }) {
  const [title1, title2] = title;
  const [deck1, deck2] = deck;
  const struck = hook.struck
    ? `; text-decoration: line-through; text-decoration-color: ${hook.struck}; text-decoration-thickness: 2.5px`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${SERIF}">
  <defs>
    <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="${ACCENT}" stroke-width="1.2" stroke-opacity="0.32"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${SURFACE}"/>
  <rect width="${WIDTH}" height="8" fill="${INK}"/>

  <text x="72" y="52" fill="${INK}" font-family="${MONO}" font-size="15" letter-spacing="3">${kicker}</text>
  <text x="1128" y="52" fill="${INK_MUTED}" font-family="${MONO}" font-size="15" letter-spacing="3" text-anchor="end">${tag}</text>
  <line x1="72" y1="64" x2="1128" y2="64" stroke="${INK}" stroke-width="1"/>

  <text x="72" y="140" fill="${INK_BRIGHT}" font-size="66" font-weight="500" letter-spacing="-1.4" style="font-variation-settings: 'opsz' 72">${title1}</text>
  <text x="72" y="204" fill="${INK_BRIGHT}" font-size="66" font-weight="500" letter-spacing="-1.4" style="font-variation-settings: 'opsz' 72">${title2}</text>
  <text x="72" y="250" fill="${INK_SOFT}" font-size="21">${deck1}</text>
  <text x="72" y="279" fill="${INK_SOFT}" font-size="21">${deck2}</text>

  <text x="1128" y="112" fill="${INK_MUTED}" font-family="${MONO}" font-size="13" letter-spacing="2.6" text-anchor="end">${hook.label}</text>
  <text x="1128" y="172" fill="${INK_MUTED}" font-size="62" text-anchor="end" style="font-variation-settings: 'opsz' 72${struck}">${hook.value}</text>
  <text x="1128" y="204" fill="${INK_MUTED}" font-family="${MONO}" font-size="13" letter-spacing="2.6" text-anchor="end">${hook.thenLabel}</text>
  <text x="1128" y="284" fill="${AMBER}" font-size="88" font-weight="500" letter-spacing="-2.6" text-anchor="end" style="font-variation-settings: 'opsz' 72">${hook.thenValue}</text>

  ${plot}

  <text x="72" y="608" fill="${INK_MUTED}" font-family="${MONO}" font-size="15">magnificent-fi.netlify.app${path}</text>
  <text x="1128" y="608" fill="${INK_MUTED}" font-size="17" font-style="italic" text-anchor="end">${axis} →</text>
</svg>`;
}

/**
 * The favicon, at the one size iOS asks for as a PNG: paper with an ink
 * edge, and the page's mark drawn across it in the accent.
 */
export function touchIcon(mark) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${SURFACE}"/>
  <rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="${INK}" stroke-width="1"/>
  <path d="${mark}" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
}

/* ── The run ─────────────────────────────────────────────────────────────── */

/**
 * Write a page's two assets into its public directory: the card, and the
 * touch icon. Exits rather than throws when there is no browser, which is
 * the one way this is expected to fail.
 */
export function publish(publicDir, { cover, icon }) {
  const executablePath = chromiumPath();
  if (!executablePath) {
    console.error('No chromium in the playwright cache. `npx playwright install chromium`, or set CHROME_PATH.');
    process.exit(1);
  }
  const out = join(ROOT, publicDir);
  rasterise(executablePath, cover, { width: WIDTH, height: HEIGHT, path: join(out, 'og-cover.png') });
  rasterise(executablePath, icon, { width: 180, height: 180, path: join(out, 'apple-touch-icon.png') });
}
