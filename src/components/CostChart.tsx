import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { benchmarkMonthlyFor, creditFloorMagi, ptcCliffMagi } from '../lib/aca';
import type { CostPoint, Scenario, SubsidyLine } from '../lib/aca';
import { formatAxisMoney, formatCurrency, formatFpl } from '../lib/format';
import { CHART, PALETTE } from '../styles/palette';
import { ChartTooltip } from './ChartTooltip';

/**
 * How the axis is drawn, in one object rather than two copies: the frame is
 * `--edge-strong`, the mesh behind it is `--edge`, and the words are
 * `--ink-muted`.
 */
const AXIS_PROPS = {
  stroke: PALETTE.edgeStrong,
  strokeWidth: CHART.hairline,
  fontSize: CHART.label,
  tickLine: false,
  tick: { fill: PALETTE.inkMuted },
} as const;

/** What a hover draws: the rule down the plot, and the dot on the curve. */
const HOVER_CURSOR = { stroke: PALETTE.inkMuted, strokeWidth: CHART.hairline } as const;
const HOVER_DOT = { stroke: PALETTE.surface, strokeWidth: CHART.rule } as const;

/** How an axis title is set, wherever one is hung. */
const AXIS_TITLE = { fontSize: CHART.label, fill: PALETTE.inkMuted } as const;

/** The plot's margins: room for a label above the top edge and a title under the axis. */
const MARGIN = { top: 22, right: 28, left: 10, bottom: 24 } as const;

/**
 * What the subsidy pays, as the band between what you pay and the full
 * premium: a range, so the tint stops at the curve rather than running under
 * it, and closes to nothing wherever the two meet — over the 400% line, and
 * under 100% of the poverty line in a state that did not expand Medicaid.
 * Null on Medicaid, where there is no premium at all.
 */
const subsidyBand = (point: CostPoint): [number, number] | null =>
  point.cost === null || point.fullPremium === null ? null : [point.cost, point.fullPremium];

/**
 * The width of a run of text in the plot's mono, in pixels. IBM Plex Mono
 * advances six tenths of an em, as most monospaces do, and every label on
 * the plot is set at `CHART.label`.
 */
const textWidth = (text: string): number => text.length * CHART.label * 0.6;

/** Breathing room between two labels, or a label and an edge. */
const LABEL_GAP = 12;

/**
 * The y-axis, in round dollars: up to the benchmark rounded up to the next
 * step, ticked every $500 — or every $1,000 once the benchmark is past
 * $3,000, so the axis never carries more than seven labels. Fixed rather
 * than left to recharts, whose "nice" ticks land on $450 and $1,350.
 */
function costAxis(benchmarkMonthly: number): { max: number; ticks: number[] } {
  const step = benchmarkMonthly > 3_000 ? 1_000 : 500;
  const max = Math.max(step, Math.ceil(benchmarkMonthly / step) * step);
  const ticks: number[] = [];
  for (let tick = 0; tick <= max; tick += step) ticks.push(tick);
  return { max, ticks };
}

/**
 * The income axis, in round $25,000s — $50,000s once the axis runs past
 * $150,000, or once the plot is too narrow for a `$125K` every $25,000.
 */
function incomeTicks(axisMax: number, plotWidth: number | null): number[] {
  const crowded =
    plotWidth !== null && (axisMax / 25_000 + 1) * (textWidth('$125K') + LABEL_GAP) > plotWidth;
  const step = axisMax > 150_000 || crowded ? 50_000 : 25_000;
  const ticks: number[] = [];
  for (let tick = 0; tick <= axisMax; tick += step) ticks.push(tick);
  return ticks;
}

export interface CostChartProps {
  curve: CostPoint[];
  axisDomain: [number, number];
  /** Where the reader is standing: the household's own income. */
  here: number;
  /** What the household pays a month there, or null on Medicaid. */
  hereCost: number | null;
  /** The subsidy's two edges, where they fall on this axis. */
  lines: SubsidyLine[];
  label: string;
  scenario: Scenario;
  /** Clicking the plot moves the reader, so the chart is its own cursor. */
  onIncome: (next: number) => void;
}

/**
 * What the household pays for the benchmark plan each month, swept across
 * household income, with the lines the subsidy puts on the axis.
 *
 * Two bands, and the whole page is in the pair of them: the hatch under the
 * curve is what you pay, and the green above it, up to the dashed full
 * premium, is what the subsidy pays. The tint closes to nothing at the 400%
 * line, which is the picture the page is named for.
 *
 * The curve is drawn as a straight line between samples rather than as steps:
 * your share is a continuous function of income everywhere but the two edges,
 * and both edges are sampled exactly so a jump is drawn as a jump. Under the
 * Medicaid line in an expansion state there is no Marketplace premium at all,
 * so the plot is a gap rather than a zero.
 *
 * The plot measures itself and sets its labels to fit: the two edges are
 * named in full where there is room for both names and by their percentage
 * where there is not, and a gap too narrow for its word turns the word
 * upright. Before the first measurement everything is set as if the plot
 * were wide.
 */
export const CostChart: React.FC<CostChartProps> = ({
  curve,
  axisDomain,
  here,
  hereCost,
  lines,
  label,
  scenario,
  onIncome,
}) => {
  const monthly = benchmarkMonthlyFor(scenario);
  const yAxis = costAxis(monthly);
  const axisMax = axisDomain[1];
  const expansion = scenario.expansionState !== false;
  const floorMagi = Math.round(creditFloorMagi(scenario));
  const cliffMagi = ptcCliffMagi(scenario);

  /** The plot area's width in pixels once measured, or null before the first measurement. */
  const [plotWidth, setPlotWidth] = useState<number | null>(null);
  const px = (magi: number): number | null =>
    plotWidth === null ? null : (magi / axisMax) * plotWidth;

  /* The edges are named in full when both names fit between and inside the
     plot's edges, and by their percentage otherwise. */
  const edges = lines;
  const edgesFit = ((): boolean => {
    if (plotWidth === null) return true;
    const spans = edges.map((line) => ({ at: px(line.magi) as number, half: textWidth(line.label) / 2 }));
    if (spans.some((s) => s.at - s.half < 0 || s.at + s.half > plotWidth)) return false;
    for (let i = 1; i < spans.length; i += 1) {
      if (spans[i].at - spans[i - 1].at < spans[i].half + spans[i - 1].half + LABEL_GAP) return false;
    }
    return true;
  })();

  /* The premium's name wraps to the band it is hung in, so a narrow band
     gets it on two or three lines rather than running across the cliff. */
  const bandEnd = cliffMagi ?? axisMax;
  const premiumLabel = `Full premium ${formatCurrency(monthly)}/mo`;
  const bandPx = plotWidth === null ? null : ((bandEnd - floorMagi) / axisMax) * plotWidth;
  const premiumLabelWidth =
    bandPx === null
      ? undefined
      : Math.max(textWidth(`${formatCurrency(monthly)}/mo`), bandPx - LABEL_GAP);

  /* The word over the gap stands upright when the gap is narrower than it. */
  const gapWord = expansion ? 'Medicaid' : 'No subsidy, no Medicaid';
  const gapPx = px(floorMagi);
  const gapUpright = gapPx !== null && gapPx < textWidth(gapWord) + LABEL_GAP;

  /* The marker's label goes on the clear side of the curve. On the slope
     that is the left, where the curve has already fallen away below it; when
     the plot's left edge — or an upright word in the gap — is too near, it
     goes right and under the curve, which climbs away above it. On the premium plateau it
     goes right and above the line it would otherwise sit on, or left when
     the plot's right edge is too near. */
  const hereLabel = hereCost === null ? '' : `You · ${formatCurrency(hereCost)}/mo`;
  const onPlateau = hereCost !== null && hereCost >= monthly - 0.5;
  const herePx = px(here);
  const hereSide = ((): 'left' | 'right' => {
    const need = textWidth(hereLabel) + CHART.dot + LABEL_GAP;
    if (herePx === null || plotWidth === null) {
      return onPlateau && here <= 0.78 * axisMax ? 'right' : 'left';
    }
    if (onPlateau) return plotWidth - herePx >= need ? 'right' : 'left';
    /* A word standing upright in the gap runs the plot's full height, so the
       label stays out of the gap; a word lying across it, at mid-height, is
       nowhere near a label on the slope. */
    return herePx - need >= (gapUpright ? (gapPx ?? 0) : 0) ? 'left' : 'right';
  })();
  const hereLift = onPlateau ? -(CHART.dot + 7) : hereSide === 'right' ? CHART.dot + 9 : 0;

  return (
    <div className="chart-container" role="img" aria-label={label}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        onResize={(width) => setPlotWidth(Math.max(0, width - CHART.axis - MARGIN.left - MARGIN.right))}
      >
        <ComposedChart
          data={curve}
          margin={MARGIN}
          onClick={(e: { activeLabel?: string | number }) => {
            const at = Number(e?.activeLabel);
            if (Number.isFinite(at)) onIncome(Math.round(at / 500) * 500);
          }}
        >
          <defs>
            {/* The engraver's hatch under the curve: a diagonal hairline in
                the curve's own blue, at `CHART.fill`. */}
            <pattern
              id="costHatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke={PALETTE.accent}
                strokeWidth={CHART.hairline}
                strokeOpacity={CHART.fill}
              />
            </pattern>
          </defs>
          <CartesianGrid stroke={PALETTE.edge} strokeWidth={CHART.hairline} vertical={false} />
          <XAxis
            {...AXIS_PROPS}
            dataKey="magi"
            type="number"
            domain={axisDomain}
            ticks={incomeTicks(axisMax, plotWidth)}
            tickFormatter={formatAxisMoney}
            label={{
              ...AXIS_TITLE,
              value: 'Household income for the year',
              position: 'insideBottom',
              offset: -4,
            }}
          />
          <YAxis
            {...AXIS_PROPS}
            tickFormatter={formatCurrency}
            width={CHART.axis}
            domain={[0, yAxis.max]}
            ticks={yAxis.ticks}
            label={{
              ...AXIS_TITLE,
              value: 'You pay per month',
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip
            cursor={HOVER_CURSOR}
            allowEscapeViewBox={{ x: false, y: true }}
            wrapperStyle={{ maxWidth: 'calc(100vw - 3rem)' }}
            content={<ChartTooltip scenario={scenario} />}
          />

          {/* What the subsidy pays: everything between the curve and the
              premium. Drawn first, so the hatch stands on top of it. */}
          <Area
            type="linear"
            dataKey={subsidyBand}
            name="Subsidy pays"
            stroke="none"
            fill={PALETTE.emerald}
            fillOpacity={CHART.tint}
            connectNulls={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <ReferenceLine
            className="premium-line"
            y={monthly}
            stroke={PALETTE.inkMuted}
            strokeDasharray="2 4"
            strokeWidth={CHART.hairline}
          />
          {/* The premium line's name, hung inside the band it is the ceiling
              of — the one stretch of the plot the curve never reaches. */}
          <ReferenceArea
            className="premium-label"
            x1={floorMagi}
            x2={cliffMagi ?? axisMax}
            y1={0}
            y2={monthly}
            fill="none"
            label={{
              value: premiumLabel,
              position: 'insideTop',
              offset: 6,
              width: premiumLabelWidth,
              fill: PALETTE.inkSoft,
              fontSize: CHART.label,
            }}
          />

          {/* The stretch of axis with no Marketplace plan on it, named once. */}
          <ReferenceArea
            className="gap-area"
            x1={0}
            x2={floorMagi}
            fill="none"
            label={{
              value: gapWord,
              fill: PALETTE.inkDim,
              fontSize: CHART.label,
              fontStyle: 'italic',
              angle: gapUpright ? -90 : 0,
            }}
          />

          {edges.map((line) => (
            <ReferenceLine
              className="credit-edge"
              key={line.id}
              x={line.magi}
              stroke={PALETTE.inkMuted}
              strokeDasharray="2 3"
              strokeWidth={CHART.hairline}
              label={{
                value: edgesFit ? line.label : formatFpl(line.multiple),
                position: 'top',
                fill: PALETTE.inkSoft,
                fontSize: CHART.label,
              }}
            />
          ))}

          <ReferenceLine
            className="here-line"
            x={here}
            stroke={PALETTE.amber}
            strokeDasharray="3 3"
            strokeWidth={CHART.marker}
          />

          <Area
            type="linear"
            dataKey="cost"
            name="You pay"
            stroke={PALETTE.accent}
            strokeWidth={CHART.line}
            fill="url(#costHatch)"
            fillOpacity={1}
            connectNulls={false}
            activeDot={HOVER_DOT}
            isAnimationActive={false}
          />

          {hereCost !== null && (
            <ReferenceDot
              className="here-dot"
              x={here}
              y={hereCost}
              r={CHART.dot}
              fill={PALETTE.amber}
              stroke={PALETTE.surface}
              strokeWidth={CHART.rule}
              label={{
                value: hereLabel,
                position: hereSide,
                offset: CHART.dot + 5,
                dy: hereLift,
                fill: PALETTE.amberBright,
                fontSize: CHART.label,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
