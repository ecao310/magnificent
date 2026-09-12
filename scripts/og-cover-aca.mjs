/**
 * Draws `public/aca/og-cover.png`, the 1200x630 card Messages, Slack and a forum
 * post render in place of the link, and `public/aca/apple-touch-icon.png`.
 *
 * These are the two assets in the repo that are generated rather than
 * written, and the two the deploy workflow cannot generate: rasterising needs
 * a browser, and the workflow does not install one. So the PNGs are committed,
 * and this script is how they are re-made when the page they stand for
 * changes. Run it by hand:
 *
 *     node scripts/og-cover.mjs
 *
 * Two things it leans on are outside `package.json`. `rolldown`, which vite
 * brings, bundles `src/lib` so a plain node script can import it. The browser
 * is whatever the last `npx playwright install chromium` left in the
 * Playwright cache — the headless shell is driven directly, by its own
 * command line; `CHROME_PATH` points at any other Chromium build instead.
 *
 * The curve on the card is the real one: `costCurve` is bundled out of
 * `src/lib` and sampled for the household the page opens on, so the shape a
 * reader sees in the preview is the shape they land on.
 */
import { build } from 'rolldown';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public/aca');

/* ── The arithmetic ──────────────────────────────────────────────────────── */

async function loadTaxModule() {
  const dir = mkdtempSync(join(tmpdir(), 'og-cover-'));
  const entry = join(dir, 'entry.ts');
  const out = join(dir, 'bundle.mjs');
  writeFileSync(
    entry,
    `export * from ${JSON.stringify(join(ROOT, 'src/aca/lib/aca/index'))};\n` +
      `export * from ${JSON.stringify(join(ROOT, 'src/aca/lib/scenarioUrl'))};\n`,
  );
  await build({ input: entry, output: { file: out, format: 'esm' }, platform: 'node', logLevel: 'silent' });
  const mod = await import(pathToFileURL(out).href);
  rmSync(dir, { recursive: true, force: true });
  return mod;
}

/* ── The browser ─────────────────────────────────────────────────────────── */

function chromiumPath() {
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

const FONTS =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap';

function rasterise(executablePath, svg, { width, height, path }) {
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

/** The page's own tokens. */
const SURFACE = '#f7f3eb';
const INK = '#261d16';
const INK_BRIGHT = '#160d07';
const INK_SOFT = '#50453d';
const INK_MUTED = '#6c6158';
const EDGE = '#c9c3ba';
const ACCENT = '#2769b7';
const AMBER = '#b76100';
const EMERALD = '#1d7d3e';

const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";

const WIDTH = 1200;
const HEIGHT = 630;
const PLOT = { left: 84, right: 1128, top: 300, bottom: 540 };

const money = (n) => `$${Math.round(n / 1000)}K`;

function cover(curve, hook) {
  const minX = curve[0].magi;
  const maxX = curve[curve.length - 1].magi;
  const maxY = Math.ceil(hook.benchmark / 500) * 500;
  const x = (magi) => PLOT.left + ((magi - minX) / (maxX - minX)) * (PLOT.right - PLOT.left);
  const y = (cost) => PLOT.bottom - (Math.min(cost, maxY) / maxY) * (PLOT.bottom - PLOT.top);

  // The curve, in runs: a gap where the household is on Medicaid.
  const runs = [];
  let run = [];
  for (const p of curve) {
    if (p.cost === null) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push(p);
  }
  if (run.length) runs.push(run);
  const linePath = runs
    .map((r) => 'M' + r.map((p) => `${x(p.magi).toFixed(1)},${y(p.cost).toFixed(1)}`).join('L'))
    .join('');
  const areaPath = runs
    .map(
      (r) =>
        `M${x(r[0].magi).toFixed(1)},${PLOT.bottom}L` +
        r.map((p) => `${x(p.magi).toFixed(1)},${y(p.cost).toFixed(1)}`).join('L') +
        `L${x(r[r.length - 1].magi).toFixed(1)},${PLOT.bottom}Z`,
    )
    .join('');

  // Subsidy pays: the flat band between the cost curve and the full-premium
  // line. `fullPremium` is null wherever `cost` is (Medicaid), and equal to
  // `cost` past the cliff, so the band vanishes on its own in both places.
  const bandPath = runs
    .map((r) => {
      const top = y(r[0].fullPremium);
      return (
        `M${x(r[0].magi).toFixed(1)},${top.toFixed(1)}` +
        `L${x(r[r.length - 1].magi).toFixed(1)},${top.toFixed(1)}` +
        [...r]
          .reverse()
          .map((p) => `L${x(p.magi).toFixed(1)},${y(p.cost).toFixed(1)}`)
          .join('') +
        'Z'
      );
    })
    .join('');

  const gridCosts = [];
  for (let c = 0; c <= maxY; c += 500) gridCosts.push(c);
  const ticks = [50_000, 100_000].filter((v) => v > minX && v < maxX);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${SERIF}">
  <defs>
    <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="${ACCENT}" stroke-width="1.2" stroke-opacity="0.32"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${SURFACE}"/>
  <rect width="${WIDTH}" height="8" fill="${INK}"/>

  <text x="72" y="52" fill="${INK}" font-family="${MONO}" font-size="15" letter-spacing="3">SUBSIDY SLOPE</text>
  <text x="1128" y="52" fill="${INK_MUTED}" font-family="${MONO}" font-size="15" letter-spacing="3" text-anchor="end">COVERAGE YEAR ${hook.year} · MARKETPLACE</text>
  <line x1="72" y1="64" x2="1128" y2="64" stroke="${INK}" stroke-width="1"/>

  <text x="72" y="140" fill="${INK_BRIGHT}" font-size="66" font-weight="500" letter-spacing="-1.4" style="font-variation-settings: 'opsz' 72">How much subsidy does</text>
  <text x="72" y="204" fill="${INK_BRIGHT}" font-size="66" font-weight="500" letter-spacing="-1.4" style="font-variation-settings: 'opsz' 72">the next dollar cost?</text>
  <text x="72" y="250" fill="${INK_SOFT}" font-size="21">What you pay for a Marketplace plan at every household income,</text>
  <text x="72" y="279" fill="${INK_SOFT}" font-size="21">and what each extra dollar costs you in subsidy — priced for your household.</text>

  <text x="1128" y="112" fill="${INK_MUTED}" font-family="${MONO}" font-size="13" letter-spacing="2.6" text-anchor="end">YOU PAY AT ${money(hook.income)}</text>
  <text x="1128" y="172" fill="${INK_MUTED}" font-size="62" text-anchor="end" style="font-variation-settings: 'opsz' 72">$${hook.monthly}/mo</text>
  <text x="1128" y="204" fill="${INK_MUTED}" font-family="${MONO}" font-size="13" letter-spacing="2.6" text-anchor="end">EACH EXTRA DOLLAR COSTS</text>
  <text x="1128" y="284" fill="${AMBER}" font-size="88" font-weight="500" letter-spacing="-2.6" text-anchor="end" style="font-variation-settings: 'opsz' 72">${hook.slope}</text>

  ${gridCosts
    .map(
      (cost) =>
        `<line x1="${PLOT.left}" y1="${y(cost).toFixed(1)}" x2="${PLOT.right}" y2="${y(cost).toFixed(1)}" stroke="${cost === 0 ? INK : EDGE}" stroke-width="1"/>` +
        `<text x="${PLOT.left - 12}" y="${(y(cost) + 5).toFixed(1)}" fill="${INK_MUTED}" font-family="${MONO}" font-size="15" text-anchor="end">$${cost.toLocaleString('en-US')}</text>`,
    )
    .join('\n  ')}

  <path d="${bandPath}" fill="${EMERALD}" fill-opacity="0.10"/>
  <path d="${areaPath}" fill="url(#hatch)"/>

  <line x1="${PLOT.left}" y1="${y(hook.benchmark).toFixed(1)}" x2="${PLOT.right}" y2="${y(hook.benchmark).toFixed(1)}" stroke="${INK_MUTED}" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="${PLOT.left + 6}" y="${(y(hook.benchmark) - 8).toFixed(1)}" fill="${INK_SOFT}" font-family="${MONO}" font-size="13">Full premium $${hook.benchmark.toLocaleString('en-US')}/mo</text>

  <line x1="${x(hook.floor).toFixed(1)}" y1="${PLOT.top}" x2="${x(hook.floor).toFixed(1)}" y2="${PLOT.bottom}" stroke="${INK_MUTED}" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="${(x(hook.floor) + 6).toFixed(1)}" y="${PLOT.top + 20}" fill="${INK_SOFT}" font-family="${MONO}" font-size="13">${hook.floorLabel}</text>

  <line x1="${x(hook.cliff).toFixed(1)}" y1="${PLOT.top}" x2="${x(hook.cliff).toFixed(1)}" y2="${PLOT.bottom}" stroke="${INK_MUTED}" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="${(x(hook.cliff) - 6).toFixed(1)}" y="${PLOT.top + 20}" fill="${INK_SOFT}" font-family="${MONO}" font-size="13" text-anchor="end">${hook.cliffLabel}</text>

  <path d="${linePath}" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="${x(hook.income).toFixed(1)}" y1="${PLOT.top + 40}" x2="${x(hook.income).toFixed(1)}" y2="${PLOT.bottom}" stroke="${AMBER}" stroke-width="2.5" stroke-dasharray="8 5"/>
  <circle cx="${x(hook.income).toFixed(1)}" cy="${y(hook.monthly).toFixed(1)}" r="8" fill="${AMBER}" stroke="${SURFACE}" stroke-width="2.5"/>
  <text x="${(x(hook.income) + 16).toFixed(1)}" y="${(y(hook.monthly) - 14).toFixed(1)}" fill="${AMBER}" font-size="28" font-weight="500" style="font-variation-settings: 'opsz' 72">$${hook.monthly}/mo</text>

  ${ticks
    .map(
      (magi) =>
        `<line x1="${x(magi).toFixed(1)}" y1="${PLOT.bottom}" x2="${x(magi).toFixed(1)}" y2="${PLOT.bottom + 8}" stroke="${INK}" stroke-width="1"/>` +
        `<text x="${x(magi).toFixed(1)}" y="${PLOT.bottom + 30}" fill="${INK_MUTED}" font-family="${MONO}" font-size="15" text-anchor="middle">${money(magi)}</text>`,
    )
    .join('\n  ')}

  <text x="72" y="608" fill="${INK_MUTED}" font-family="${MONO}" font-size="15">ecao310.github.io/magnificent/aca</text>
  <text x="1128" y="608" fill="${INK_MUTED}" font-size="17" font-style="italic" text-anchor="end">Household income →</text>
</svg>`;
}

/** The favicon, at the one size iOS asks for as a PNG. Paper with an ink edge. */
function touchIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${SURFACE}"/>
  <rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="${INK}" stroke-width="1"/>
  <path d="M4 25H8V17L12 13V19L16 15V21L20 17V21H25V26H28" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
}

/* ── The run ─────────────────────────────────────────────────────────────── */

const {
  costCurve,
  axisMax,
  ptcFor,
  ptcCliffMagi,
  defaultScenario,
  engineScenario,
  PAGE_COVERAGE_YEAR,
  creditSlopeAt,
  subsidyLines,
} = await loadTaxModule();

const scenario = { ...engineScenario(defaultScenario()), year: PAGE_COVERAGE_YEAR };
const curve = costCurve(scenario, { maxMagi: axisMax(scenario), step: 250 });
const here = ptcFor(scenario.income, scenario);
const lines = subsidyLines(scenario);
const floorLine = lines.find((line) => line.id === 'floor');
const cliffLine = lines.find((line) => line.id === 'cliff');
const hook = {
  year: PAGE_COVERAGE_YEAR,
  income: scenario.income,
  cliff: ptcCliffMagi(scenario),
  floor: floorLine.magi,
  floorLabel: floorLine.label,
  cliffLabel: cliffLine?.label ?? 'No cliff this year',
  benchmark: here.benchmarkMonthly,
  monthly: Math.round((here.netPremiumAnnual ?? 0) / 12),
  slope: `${Math.round(creditSlopeAt(scenario.income, scenario) * 1000) / 10}¢`,
};
console.log(`curve: ${curve.length} points to ${money(curve.at(-1).magi)}; at ${money(hook.income)} pays $${hook.monthly}/mo, next dollar ${hook.slope}`);

const executablePath = chromiumPath();
if (!executablePath) {
  console.error('No chromium in the playwright cache. `npx playwright install chromium`, or set CHROME_PATH.');
  process.exit(1);
}

rasterise(executablePath, cover(curve, hook), { width: WIDTH, height: HEIGHT, path: join(PUBLIC, 'og-cover.png') });
rasterise(executablePath, touchIcon(), { width: 180, height: 180, path: join(PUBLIC, 'apple-touch-icon.png') });
