import { CHART } from '../styles/palette';

/**
 * The frame a plot is drawn in: the gutter the y-axis takes and the margins
 * around the plot. The chart's caption is HTML under the plot rather than an
 * axis title inside it, so there is no title for a frame to carry or drop.
 */
export interface Frame {
  axis: number;
  margin: { top: number; right: number; left: number; bottom: number };
}

/** The plot's margins on a wide screen: room for a cliff's name above the top edge. */
export const MARGIN = { top: 22, right: 28, left: 10, bottom: 0 } as const;

/** The frame on a wide screen. */
export const WIDE_FRAME: Frame = { axis: CHART.axis, margin: MARGIN };

/**
 * The frame on a phone. On a 390px screen the wide frame left the curve
 * about 260px to be drawn in, so here the margins close up around the plot.
 * The gutter stays: it is already only as wide as its labels, there being
 * no rotated title beside them to drop. The right margin stays wide enough
 * for half of the axis's last label — `199.9K` is six characters of the
 * mono, and a 16px margin cut it off.
 */
export const NARROW_FRAME: Frame = {
  axis: CHART.axis,
  margin: { top: 22, right: 24, left: 4, bottom: 0 },
};

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

export const frameFor = (narrow: boolean): Frame => (narrow ? NARROW_FRAME : WIDE_FRAME);

/** The plot area's width, from the width of the box the chart is drawn in: the y-axis gutter and the margins taken off. */
export const plotWidthOf = (width: number, frame: Frame = WIDE_FRAME): number =>
  Math.max(0, width - frame.axis - frame.margin.left - frame.margin.right);

/**
 * The other income under a pointer: `x` is its distance from the left edge
 * of the box the chart is drawn in, `width` the box's width, and `step` the
 * slider's own step, which is what the answer is rounded to. The axis is
 * drawn in total income, but the fixed half of it — the benefit, the
 * tax-exempt interest — is the same at every point, so a share of the plot
 * is the same share of the other income swept across it. Off the plot to
 * either side is the end of the slider on that side; before the box has a
 * width there is no answer.
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
