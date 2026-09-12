/**
 * What every plot on the site shares: the shape of the frame it is drawn
 * in, the width under which it takes the narrow one, where a hover means
 * something, and the arithmetic that turns a pointer's position into an
 * income. Each page builds its own frames on this — its own gutter, its
 * own margins, and on the ACA page whether the axes carry titles — in its
 * own `components/chartFrame.ts`, and re-exports what is here so a chart
 * imports from one place.
 */
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
