import { CHART } from '../styles/palette';
import type { Frame } from '../../shared/lib/chartFrame';

/**
 * This page's frames, on the shape the site shares: the gutter the y-axis
 * takes and the margins around the plot. The chart's caption is HTML under
 * the plot rather than an axis title inside it, so there is no title for a
 * frame to carry or drop. The width the narrow frame turns on at, where a
 * hover means something, how the axis and a hover are drawn, and the
 * pointer arithmetic are the site's, and are re-exported here so a chart
 * imports from one place.
 */
export type { Frame };
export {
  AXIS_PROPS,
  HOVER_CURSOR,
  HOVER_DOT,
  HOVER_QUERY,
  NARROW_MAX_WIDTH,
  NARROW_QUERY,
  incomeAtX,
  plotWidthOf,
} from '../../shared/lib/chartFrame';

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

export const frameFor = (narrow: boolean): Frame => (narrow ? NARROW_FRAME : WIDE_FRAME);
