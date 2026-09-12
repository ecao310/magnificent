/**
 * Draws `public/og-cover.png`, the 1200x630 card Messages, Slack and a forum
 * post render in place of the link, and `public/apple-touch-icon.png`. Run
 * it by hand:
 *
 *     node scripts/og-cover.mjs
 *
 * The frame, the faces, the tokens and the browser are `card.mjs`, which
 * both pages' cards are drawn on; what is here is this page's plot.
 *
 * The curve on the card is the real one. `marginalRateCurve` is bundled out
 * of `src/torpedo/lib` and sampled for the scenario the page opens on, so the
 * shape a reader sees in the preview is the shape they land on — and if the
 * arithmetic under it ever moves, re-running this moves the picture with it.
 * A drawn-by-hand hump would go on claiming 22.2% long after the statute
 * stopped saying so.
 */
import {
  ACCENT,
  AMBER,
  INK_MUTED,
  INK_SOFT,
  SURFACE,
  axisTicks,
  card,
  gridLines,
  loadModule,
  money,
  publish,
  touchIcon,
} from './card.mjs';

/** The one hue of this page's the card spends: a Medicare cliff, striking through the bracket's claim. */
const ROSE = '#c03a51';

/** The plot, in card coordinates. */
const PLOT = { left: 72, right: 1128, top: 300, bottom: 540 };

function plot(curve, hook) {
  const xs = curve.map((p) => p.totalIncome);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  // A fixed ceiling rather than the curve's own peak: the card is one picture
  // of one scenario, and a y-axis that rescales itself would redraw the same
  // 22.2% hump at a different height every time the default moved.
  const maxY = 30;

  const x = (income) => PLOT.left + ((income - minX) / (maxX - minX)) * (PLOT.right - PLOT.left);
  const y = (rate) => PLOT.bottom - (rate / maxY) * (PLOT.bottom - PLOT.top);

  const line = curve.map((p) => `${x(p.totalIncome).toFixed(1)},${y(p.marginalRate).toFixed(1)}`);
  const path = `M${line.join('L')}`;
  const area = `${path}L${x(maxX).toFixed(1)},${PLOT.bottom}L${x(minX).toFixed(1)},${PLOT.bottom}Z`;

  // The hump, not the high ground: the point worth labelling is the local
  // maximum the benefit's inclusion makes — the highest rate reached *before*
  // the curve falls back — and the valley is where it falls back to. Both
  // are plateaux, so each label is pinned to the middle of its own run.
  const fallBack = curve.findIndex((p, i) => i > 0 && p.marginalRate < curve[i - 1].marginalRate);
  const humpIndex =
    fallBack > 0
      ? fallBack - 1
      : curve.indexOf(curve.reduce((a, b) => (b.marginalRate > a.marginalRate ? b : a)));
  const valleyIndex =
    fallBack > 0
      ? curve.reduce((best, p, i) => (i > humpIndex && p.marginalRate < curve[best].marginalRate ? i : best), humpIndex + 1)
      : humpIndex;

  const middleOfRun = (index) => {
    const rate = curve[index].marginalRate;
    let first = index;
    let last = index;
    while (first > 0 && curve[first - 1].marginalRate === rate) first -= 1;
    while (last < curve.length - 1 && curve[last + 1].marginalRate === rate) last += 1;
    return curve[Math.round((first + last) / 2)];
  };

  const hump = middleOfRun(humpIndex);
  const valley = middleOfRun(valleyIndex);

  const gridRates = [0, 10, 20, 30];
  const ticks = [50_000, 100_000, 150_000].filter((v) => v > minX && v < maxX);

  return `${gridLines(PLOT, gridRates, y, (rate) => `${rate}%`)}

  <path d="${area}" fill="url(#hatch)"/>
  <path d="${path}" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>

  ${axisTicks(PLOT, ticks, x)}

  <circle cx="${x(hump.totalIncome).toFixed(1)}" cy="${y(hump.marginalRate).toFixed(1)}" r="8" fill="${AMBER}" stroke="${SURFACE}" stroke-width="2.5"/>
  <text x="${x(hump.totalIncome).toFixed(1)}" y="${(y(hump.marginalRate) - 24).toFixed(1)}" fill="${AMBER}" font-size="34" font-weight="500" text-anchor="middle" style="font-variation-settings: 'opsz' 72">${hump.marginalRate}%</text>
  <circle cx="${x(valley.totalIncome).toFixed(1)}" cy="${y(valley.marginalRate).toFixed(1)}" r="6.5" fill="${INK_MUTED}" stroke="${SURFACE}" stroke-width="2"/>
  <text x="${(x(valley.totalIncome) + 20).toFixed(1)}" y="${(y(valley.marginalRate) + 32).toFixed(1)}" fill="${INK_SOFT}" font-size="24" font-style="italic">back to ${valley.marginalRate}%</text>`;
}

const cover = (curve, hook) =>
  card({
    kicker: 'TAX TORPEDO',
    tag: `TAX YEAR ${hook.year} · FEDERAL ONLY`,
    title: ['How much can you', 'take out this year?'],
    deck: [
      'What the next dollar out of an IRA actually costs, drawn across every',
      'income level — with Social Security dragged into the tax base behind it.',
    ],
    hook: {
      label: 'YOUR BRACKET SAYS',
      value: `${hook.valley}%`,
      struck: ROSE,
      thenLabel: 'THE NEXT DOLLAR COSTS',
      thenValue: `${hook.hump}%`,
    },
    plot: plot(curve, hook),
    path: '',
    axis: 'Total income',
  });

/* ── The run ─────────────────────────────────────────────────────────────── */

const { marginalRateCurve, incomeAxisMax, torpedoPeak, defaultScenario, PAGE_TAX_YEAR } =
  await loadModule(['src/torpedo/lib/tax/index', 'src/torpedo/lib/scenarioUrl']);

const opening = defaultScenario();
const scenario = {
  filingStatus: opening.filingStatus,
  ssBenefit: opening.ssBenefit,
  // What the engine reads is a count, not the two boxes.
  seniors: opening.isSenior ? (opening.spouseIsSenior ? 2 : 1) : 0,
  muniInterest: opening.muniInterest,
};
const curve = marginalRateCurve(scenario, { maxIncome: incomeAxisMax(scenario), step: 250 });
const peak = torpedoPeak(curve);
if (!peak) {
  console.error('The opening scenario draws no torpedo, so there is nothing for the card to say.');
  process.exit(1);
}
const hook = { ...peak, year: PAGE_TAX_YEAR };
console.log(`curve: ${curve.length} points, ${money(curve[0].totalIncome)}–${money(curve.at(-1).totalIncome)} total income; ${hook.valley}% → ${hook.hump}%`);

publish('public', {
  cover: cover(curve, hook),
  icon: touchIcon('M4 25H9L12 10H16L19 18H23L27 7'),
});
