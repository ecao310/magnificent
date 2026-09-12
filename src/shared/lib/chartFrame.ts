/**
 * What every plot on the site shares: the shape of the frame it is drawn
 * in, the width under which it takes the narrow one, where a hover means
 * something, how the axis and a hover are drawn, and the arithmetic that
 * turns a pointer's position into an income. Each page builds its own
 * frames on this — its own gutter, its own margins, and on the ACA page
 * whether the axes carry titles — in its own `components/chartFrame.ts`,
 * and re-exports what is here so a chart imports from one place.
 */
import { SITE_CHART, SITE_PALETTE } from '../styles/palette';

export interface Frame {
  /** The gutter recharts holds back for the y-axis. */
  axis: number;
  margin: { top: number; right: number; left: number; bottom: number };
}

/**
 * The width under which a plot takes the narrow frame: the same 640 the
 * stylesheet's phone rules turn on at, so the slider's inset under the
 * plot and the gutter it is inset to change together. `the fold` in
 * styles.test.tsx holds the two to one number.
 */
export const NARROW_MAX_WIDTH = 640;
export const NARROW_QUERY = `(max-width: ${NARROW_MAX_WIDTH}px)`;

/**
 * Where a hover means something: a pointer that can rest on the curve
 * without pressing it. A finger cannot, so on a touchscreen the plot draws
 * no hover reading and a touch moves the marker instead.
 */
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

/**
 * How an axis is drawn, in one object rather than a copy per chart.
 *
 * Three tiers, each spending a token the stylesheet already declares: the
 * frame is `--edge-strong`, the mesh behind it is `--edge`, and the words are
 * `--ink-muted`. recharts defaults a tick label's `fill` to the axis's own
 * `stroke`, which is what made the axis line and its labels the same colour
 * before — an axis line as bright as its numbers, in a register whose whole
 * point is that chrome is quieter than content.
 *
 * `tickLine` is off because the grid already says where a tick is, and
 * `fontSize` is set on the axis rather than only on `tick` because recharts
 * measures label widths with it when it decides how many ticks fit.
 */
export const AXIS_PROPS = {
  stroke: SITE_PALETTE.edgeStrong,
  strokeWidth: SITE_CHART.hairline,
  fontSize: SITE_CHART.label,
  tickLine: false,
  tick: { fill: SITE_PALETTE.inkMuted },
} as const;

/**
 * What a hover draws: the rule that follows the pointer down the plot, and
 * the dot it puts on the curve.
 *
 * The one part of a chart no test can read back, because recharts decides a
 * hover from `getBoundingClientRect` and jsdom reports every box as zero —
 * so this is the one place the register is held by having been looked at
 * rather than by an assertion. Both were recharts' own defaults once, which
 * is to say `#ccc` and `#fff`: two colours nothing else declares, and the
 * brightest things on a plot whose whole point is that chrome is quieter
 * than content. The dot's ring is the ground rather than a colour, so it
 * reads as the curve being cut away from under the dot rather than as a
 * second mark on top of it.
 */
export const HOVER_CURSOR = {
  stroke: SITE_PALETTE.inkMuted,
  strokeWidth: SITE_CHART.hairline,
} as const;

export const HOVER_DOT = {
  stroke: SITE_PALETTE.surface,
  strokeWidth: SITE_CHART.rule,
} as const;

/** The plot area's width, from the width of the box the chart is drawn in: the y-axis gutter and the margins taken off. */
export const plotWidthOf = (width: number, frame: Frame): number =>
  Math.max(0, width - frame.axis - frame.margin.left - frame.margin.right);

/**
 * The income under a pointer: `x` is its distance from the left edge of the
 * box the chart is drawn in, `width` the box's width, and `step` what the
 * answer is rounded to — the slider's own step on one page, a flat $500 on
 * the other. Off the plot to either side is the end of the axis on that
 * side; before the box has a width there is no answer.
 */
export function incomeAtX(
  x: number,
  width: number,
  axisMax: number,
  step: number,
  frame: Frame,
): number | null {
  const plot = plotWidthOf(width, frame);
  if (plot <= 0) return null;
  const share = (x - frame.margin.left - frame.axis) / plot;
  const raw = Math.min(1, Math.max(0, share)) * axisMax;
  return Math.min(axisMax, Math.round(raw / step) * step);
}
