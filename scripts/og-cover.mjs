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
 * The plot is drawn with no callout: the curve, the grid, and the rates down
 * its left, and nothing else.
 */
import {
  ACCENT,
  AMBER,
  INK_MUTED,
  SURFACE,
  card,
  gridLines,
  loadModule,
  money,
  publish,
  touchIcon,
} from './card.mjs';

/** The plot, in card coordinates: the whole band between the headline and the address. */
const PLOT = { left: 72, right: 1128, top: 200, bottom: 570 };

function plot(curve) {
  const xs = curve.map((p) => p.totalIncome);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  // A fixed ceiling rather than the curve's own peak: the card is one picture
  // of one scenario, and a y-axis that rescales itself would redraw the same
  // hump at a different height every time the default moved.
  const maxY = 30;

  const x = (income) => PLOT.left + ((income - minX) / (maxX - minX)) * (PLOT.right - PLOT.left);
  const y = (rate) => PLOT.bottom - (rate / maxY) * (PLOT.bottom - PLOT.top);

  const line = curve.map((p) => `${x(p.totalIncome).toFixed(1)},${y(p.marginalRate).toFixed(1)}`);
  const path = `M${line.join('L')}`;
  const area = `${path}L${x(maxX).toFixed(1)},${PLOT.bottom}L${x(minX).toFixed(1)},${PLOT.bottom}Z`;

  // The hump, not the high ground: the point worth marking is the local
  // maximum the benefit's inclusion makes — the highest rate reached *before*
  // the curve falls back — and the valley is where it falls back to. Both
  // are plateaux, so each dot is pinned to the middle of its own run.
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

  return `${gridLines(PLOT, gridRates, y, (rate) => `${rate}%`)}

  <path d="${area}" fill="url(#hatch)"/>
  <path d="${path}" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>

  <circle cx="${x(hump.totalIncome).toFixed(1)}" cy="${y(hump.marginalRate).toFixed(1)}" r="8" fill="${AMBER}" stroke="${SURFACE}" stroke-width="2.5"/>
  <circle cx="${x(valley.totalIncome).toFixed(1)}" cy="${y(valley.marginalRate).toFixed(1)}" r="6.5" fill="${INK_MUTED}" stroke="${SURFACE}" stroke-width="2"/>`;
}

const cover = (curve) =>
  card({
    kicker: 'TAX TORPEDO',
    title: 'Social Security Tax Torpedo',
    plot: plot(curve),
    path: '',
  });

/* ── The run ─────────────────────────────────────────────────────────────── */

const { marginalRateCurve, incomeAxisMax, torpedoPeak, defaultScenario } = await loadModule([
  'src/torpedo/lib/tax/index',
  'src/torpedo/lib/scenarioUrl',
]);

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
  console.error('The opening scenario draws no torpedo, so there is nothing for the card to draw.');
  process.exit(1);
}
console.log(`curve: ${curve.length} points, ${money(curve[0].totalIncome)}–${money(curve.at(-1).totalIncome)} total income; ${peak.valley}% → ${peak.hump}%`);

publish('public', {
  cover: cover(curve),
  icon: touchIcon('M4 25H9L12 10H16L19 18H23L27 7'),
});
