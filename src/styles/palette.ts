/**
 * The colours the chart paints with, as literals, because an SVG attribute is
 * the one place on this page a `var()` cannot reach.
 *
 * Recharts paints with SVG attributes — `stroke`, `fill`, `stopColor` — and
 * while a browser will resolve `var(--accent)` in most of them, jsdom will
 * not: every chart test would then be asserting on the string `var(--accent)`
 * rather than on a colour. So the values are literals here and the two copies
 * are held together by a test (`the palette` in guards/styles.test.tsx), which
 * reads `:root` off disk and fails if either side moves without the other.
 *
 * This is therefore a *subset* of the ground `:root` declares, and the rule
 * for what belongs is exact: a colour some chart hands to an SVG attribute.
 */
export const PALETTE = {
  /** The paper the plot is drawn on, which a marker cuts itself out of. */
  surface: '#f7f3eb',
  /** Hairlines — the grid, and the rule between the tooltip's sections. */
  edge: '#c9c3ba',
  /** The one edge drawn in ink: an axis, which frames the plot. */
  edgeStrong: '#261d16',

  /** What an edge of the subsidy is drawn in: the Medicaid line, the 400% line. */
  inkMuted: '#6c6158',
  /** What those edges are labelled in. */
  inkSoft: '#50453d',
  /** The italic word over a stretch of axis the curve does not cross. */
  inkDim: '#756960',

  /** The curve: what the household pays, and the hatch under it. */
  accent: '#2769b7',

  /** The "you are here" marker: the line and the dot. */
  amber: '#b76100',
  /** The same marker's words, which are small enough to need the darker one. */
  amberBright: '#9f4600',
  /** What the subsidy pays: the tint between the curve and the full premium. */
  emerald: '#1d7d3e',
} as const;

/**
 * The chart's own measures, in the one form an SVG attribute can take.
 *
 * Same argument as `PALETTE` above, made about numbers instead of colours: a
 * `stroke-width` and a `font-size` on an SVG element are attributes, and an
 * attribute holds a number rather than a `var(--…)` the browser resolves.
 */
export const CHART = {
  /** Every word the plot says: a tick label, a line's name. */
  label: 13,
  /** A curve: the lines in the plot that are the data. */
  line: 3,
  /** The ring the marker's dot is cut with. */
  rule: 2,
  /** The one line that is the reader rather than the data. */
  marker: 1.5,
  /** The dot the marker stands on. */
  dot: 5,
  /** The grid, the axis, and each stroke of the hatching. */
  hairline: 1,
  /** The hatching under the curve, an engraver's diagonal at this alpha. */
  fill: 0.3,
  /** The wash over what the subsidy pays, which every other mark reads through. */
  tint: 0.1,
  /** The wash under income tax on the rate page: ink, thinned to a band the hatch above it stands out from. */
  wash: 0.16,
  /**
   * The gutter the y-axis takes out of the plot's left edge; `--chart-axis`
   * is the same 76. The widest label this axis draws is `$2,000`, and the
   * rotated title stands to the left of it.
   */
  axis: 76,
} as const;
