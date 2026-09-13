import { SITE_CHART, SITE_PALETTE } from '../../shared/styles/palette';

/**
 * The colours this page's charts paint with, as literals: the site's, and
 * then its own hues — see src/shared/styles/palette.ts for why an SVG
 * attribute takes a literal, and `the palette` in guards/styles.test.tsx
 * for what holds these to `:root`.
 *
 * This is a *subset* of the ground the two sheets declare, and the rule for
 * what belongs is exact: a colour some chart hands to an SVG attribute.
 * `--violet` is a colour on this page and is not here, because CSS paints
 * it. Anything that has stopped being spent on either
 * side is deleted from both rather than kept against a use that might come
 * back.
 */
export const PALETTE = {
  ...SITE_PALETTE,
  /** What the return owes in total, which is a different quantity from a rate. */
  orange: '#b64700',
  /** A Medicare IRMAA cliff. */
  rose: '#c03a51',
  roseBright: '#9d1135',
  /** The 400% FPL cliff: the same kind of thing, for a reader not yet on Medicare. */
  fuchsia: '#a644a0',
  fuchsiaBright: '#852381',
} as const;

/**
 * The chart's measures: the site's, and the one this page sets itself.
 *
 * `the chart register` in App.chart.test.tsx holds the set closed, by
 * reading the numbers back off the rendered SVG rather than off this file:
 * a `font-size` or a `stroke-width` that is not one of these fails there.
 */
export const CHART = {
  ...SITE_CHART,
  /**
   * The gutter the y-axis takes out of the plot's left edge, which
   * `--chart-axis` sets a second time so the caption and the slider under
   * the plot can start where the plot area does. The widest label this axis
   * draws is `100%`.
   */
  axis: 44,
} as const;
