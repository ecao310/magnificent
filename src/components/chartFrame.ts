/**
 * What both plots share: the frame they are drawn in, the way a hover is
 * drawn on them, and the arithmetic that fits a label to the room it has.
 *
 * One module rather than two copies because the two charts are the same
 * chart with a different y-axis — the same income runs along the bottom of
 * each, the same two edges of the subsidy cut across each, and the same
 * marker stands on each — and a reader moving from one page to the other
 * should not be able to tell that the plots were drawn twice.
 */
import type { SubsidyLine } from '../lib/aca';
import { CHART, PALETTE } from '../styles/palette';

/**
 * How the axis is drawn, in one object rather than two copies: the frame is
 * `--edge-strong`, the mesh behind it is `--edge`, and the words are
 * `--ink-muted`.
 */
export const AXIS_PROPS = {
  stroke: PALETTE.edgeStrong,
  strokeWidth: CHART.hairline,
  fontSize: CHART.label,
  tickLine: false,
  tick: { fill: PALETTE.inkMuted },
} as const;

/** What a hover draws: the rule down the plot, and the dot on the curve. */
export const HOVER_CURSOR = { stroke: PALETTE.inkMuted, strokeWidth: CHART.hairline } as const;
export const HOVER_DOT = { stroke: PALETTE.surface, strokeWidth: CHART.rule } as const;

/** How an axis title is set, wherever one is hung. */
export const AXIS_TITLE = { fontSize: CHART.label, fill: PALETTE.inkMuted } as const;

/** The plot's margins: room for a label above the top edge and a title under the axis. */
export const MARGIN = { top: 22, right: 28, left: 10, bottom: 24 } as const;

/**
 * The width of a run of text in the plot's mono, in pixels. IBM Plex Mono
 * advances six tenths of an em, as most monospaces do, and every label on
 * the plot is set at `CHART.label`.
 */
export const textWidth = (text: string): number => text.length * CHART.label * 0.6;

/** Breathing room between two labels, or a label and an edge. */
export const LABEL_GAP = 12;

/**
 * The income axis, in round $25,000s — $50,000s once the axis runs past
 * $150,000, or once the plot is too narrow for a `$125K` every $25,000.
 */
export function incomeTicks(axisMax: number, plotWidth: number | null): number[] {
  const crowded =
    plotWidth !== null && (axisMax / 25_000 + 1) * (textWidth('$125K') + LABEL_GAP) > plotWidth;
  const step = axisMax > 150_000 || crowded ? 50_000 : 25_000;
  const ticks: number[] = [];
  for (let tick = 0; tick <= axisMax; tick += step) ticks.push(tick);
  return ticks;
}

/**
 * Whether the subsidy's edges can be named in full: both names fit inside
 * the plot's edges and clear of each other. Before the first measurement,
 * yes. Where they cannot, each edge is labelled by its percentage instead.
 */
export function edgeLabelsFit(
  lines: SubsidyLine[],
  px: (magi: number) => number | null,
  plotWidth: number | null,
): boolean {
  if (plotWidth === null) return true;
  const spans = lines.map((line) => ({ at: px(line.magi) as number, half: textWidth(line.label) / 2 }));
  if (spans.some((s) => s.at - s.half < 0 || s.at + s.half > plotWidth)) return false;
  for (let i = 1; i < spans.length; i += 1) {
    if (spans[i].at - spans[i - 1].at < spans[i].half + spans[i - 1].half + LABEL_GAP) return false;
  }
  return true;
}

/** A word laid over a stretch of axis stands upright when the stretch is narrower than it. */
export const wordStandsUpright = (word: string, stretchPx: number | null): boolean =>
  stretchPx !== null && stretchPx < textWidth(word) + LABEL_GAP;

/** The plot area's width, from the width recharts measured: the y-axis gutter and the margins taken off. */
export const plotWidthOf = (width: number): number =>
  Math.max(0, width - CHART.axis - MARGIN.left - MARGIN.right);
