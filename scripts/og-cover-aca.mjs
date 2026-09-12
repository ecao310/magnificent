/**
 * Draws `public/aca/og-cover.png`, the 1200x630 card Messages, Slack and a
 * forum post render in place of the link, and `public/aca/apple-touch-icon.png`.
 * Run it by hand:
 *
 *     node scripts/og-cover-aca.mjs
 *
 * The frame, the faces, the tokens and the browser are `card.mjs`, which
 * both pages' cards are drawn on; what is here is this page's plot.
 *
 * The curve on the card is the real one: `costCurve` is bundled out of
 * `src/aca/lib` and sampled for the household the page opens on, so the shape
 * a reader sees in the preview is the shape they land on.
 */
import {
  ACCENT,
  AMBER,
  INK_MUTED,
  INK_SOFT,
  MONO,
  SURFACE,
  axisTicks,
  card,
  gridLines,
  loadModule,
  money,
  publish,
  touchIcon,
} from './card.mjs';

/** The one hue of this page's the card spends: what the subsidy pays. */
const EMERALD = '#1d7d3e';

/** The plot, in card coordinates. */
const PLOT = { left: 84, right: 1128, top: 300, bottom: 540 };

function plot(curve, hook) {
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

  return `${gridLines(PLOT, gridCosts, y, (cost) => `$${cost.toLocaleString('en-US')}`)}

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

  ${axisTicks(PLOT, ticks, x)}`;
}

const cover = (curve, hook) =>
  card({
    kicker: 'SUBSIDY SLOPE',
    tag: `COVERAGE YEAR ${hook.year} · MARKETPLACE`,
    title: ['How much subsidy does', 'the next dollar cost?'],
    deck: [
      'What you pay for a Marketplace plan at every household income,',
      'and what each extra dollar costs you in subsidy — priced for your household.',
    ],
    hook: {
      label: `YOU PAY AT ${money(hook.income)}`,
      value: `$${hook.monthly}/mo`,
      thenLabel: 'EACH EXTRA DOLLAR COSTS',
      thenValue: hook.slope,
    },
    plot: plot(curve, hook),
    path: '/aca',
    axis: 'Household income',
  });

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
} = await loadModule(['src/aca/lib/aca/index', 'src/aca/lib/scenarioUrl']);

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

publish('public/aca', {
  cover: cover(curve, hook),
  icon: touchIcon('M4 25H8V17L12 13V19L16 15V21L20 17V21H25V26H28'),
});
