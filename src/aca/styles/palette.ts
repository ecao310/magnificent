import { SITE_CHART, SITE_PALETTE } from '../../shared/styles/palette';

/**
 * The colours this page's charts paint with, as literals: the site's, and
 * then the shades only these plots spend — see src/shared/styles/palette.ts
 * for why an SVG attribute takes a literal, and `the palette` in
 * guards/styles.test.tsx for what holds these to `:root`.
 *
 * This is a *subset* of the ground the two sheets declare, and the rule for
 * what belongs is exact: a colour some chart hands to an SVG attribute.
 */
export const PALETTE = {
  ...SITE_PALETTE,
  /** What the edges of the subsidy are labelled in. */
  inkSoft: '#50453d',
  /** The italic word over a stretch of axis the curve does not cross. */
  inkDim: '#756960',
  /** The marker's words, which are small enough to need the darker amber. */
  amberBright: '#9f4600',
  /** What the subsidy pays: the tint between the curve and the full premium. */
  emerald: '#1d7d3e',
} as const;

/**
 * The chart's measures: the site's, and the ones these two plots add.
 */
export const CHART = {
  ...SITE_CHART,
  /** The one line that is the reader rather than the data. */
  marker: 1.5,
  /** The dot the marker stands on. */
  dot: 5,
  /** The wash over what the subsidy pays, which every other mark reads through. */
  tint: 0.1,
  /** The wash under income tax on the rate chart: ink, thinned to a band the hatch above it stands out from. */
  wash: 0.16,
  /**
   * The gutter the y-axis takes out of the plot's left edge; `--chart-axis`
   * is the same 76. The widest label this axis draws is `$2,000`, and the
   * rotated title stands to the left of it.
   */
  axis: 76,
  /**
   * The same gutter on a phone, where the rotated title is dropped and the
   * gutter is only as wide as `$5,000` and a tick's breathing room;
   * `--chart-axis-narrow` is the same 56.
   */
  axisNarrow: 56,
} as const;
