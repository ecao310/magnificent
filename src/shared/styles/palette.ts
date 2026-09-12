/**
 * The colours and measures every chart on the site paints with, as
 * literals, because an SVG attribute is the one place a `var()` cannot reach.
 *
 * Recharts paints with SVG attributes — `stroke`, `fill`, `stopColor` — and
 * while a browser will resolve `var(--accent)` in most of them, jsdom will
 * not: every chart test would then be asserting on the string `var(--accent)`
 * rather than on a colour. So the values are literals here, and each page's
 * `styles/palette.ts` spreads them into its own `PALETTE` and `CHART` ahead
 * of the hues and measures only its charts spend. The copies are held to
 * `:root` by `the palette` in guards/styles.test.tsx, which reads the site's
 * sheet off disk and fails if either side moves without the other.
 *
 * What belongs here is exact: a colour or a measure that a chart on *both*
 * pages hands to an SVG attribute. A hue one page draws with is that page's,
 * in its own palette and its own sheet.
 */
export const SITE_PALETTE = {
  /** The paper the plot is drawn on, which a marker cuts itself out of. */
  surface: '#f7f3eb',
  /** Hairlines — the grid, and the rule between the tooltip's sections. */
  edge: '#c9c3ba',
  /** The one edge drawn in ink: an axis, which frames the plot. */
  edgeStrong: '#261d16',
  /** Tick labels, and the rule a hover draws down the plot. */
  inkMuted: '#6c6158',
  /** The curve, and the hatching under it. */
  accent: '#2769b7',
  /** The "you are here" marker. */
  amber: '#b76100',
} as const;

/**
 * The plot's own measures, in the one form an SVG attribute can take.
 *
 * Same argument as `SITE_PALETTE`, made about numbers instead of colours: a
 * `stroke-width` and a `font-size` on an SVG element are attributes, and an
 * attribute holds a number rather than a `var(--…)` the browser resolves.
 */
export const SITE_CHART = {
  /**
   * Every word the plot says: a tick label, a line's name. 13px is
   * `0.8125rem` on the type scale — the caption step — so the chart and the
   * notes under it read at one size; `the chart metrics` in
   * guards/styles.test.tsx holds the two together.
   */
  label: 13,
  /** A curve: the lines in the plot that are the data. */
  line: 3,
  /** A reference line, and the ring the marker's dot is cut with. */
  rule: 2,
  /** The grid, the axis, and each stroke of the hatching. */
  hairline: 1,
  /**
   * The hatching under a curve: an engraver's diagonal in the curve's own
   * blue, at this alpha. A hatch rather than a wash because a broadsheet's
   * plot is drawn in lines, and because a wash over warm paper reads as a
   * second area rather than a tint of the first.
   */
  fill: 0.3,
} as const;
