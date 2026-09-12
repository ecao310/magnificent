import { useState } from 'react';
import {
  Area,
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
import { usePlot } from '../../shared/hooks/usePlot';
import { PlotBox } from '../../shared/components/PlotBox';
import { grid, hatch } from '../../shared/components/marks';
import {
  AXIS_PROPS,
  AXIS_TITLE,
  HOVER_CURSOR,
  HOVER_DOT,
  LABEL_GAP,
  POINTER_STEP,
  edgeLabelsFit,
  frameFor,
  incomeTicks,
  labelMeetsEdge,
  plotWidthOf,
  textWidth,
  wordStandsUpright,
} from './chartFrame';
import { ChartTooltip } from './ChartTooltip';

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
 * were wide. On a phone it takes the narrow frame — no axis titles, a
 * gutter no wider than its labels — and the premium's name comes off the
 * plot and into the key under it.
 *
 * The plot is its own cursor: a click or a tap moves the marker to the
 * income under the pointer, and a finger drawn along the plot drags it. The
 * hover reading is drawn only where there is a pointer that can hover.
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

  const { narrow, frame, hoverable, pointer } = usePlot({ axisMax, step: POINTER_STEP, onIncome, frameFor });

  /** The width of the box the chart is drawn in, or null before the first measurement. */
  const [width, setWidth] = useState<number | null>(null);
  /** The plot area's width in pixels: the box less the frame. */
  const plotWidth = width === null ? null : plotWidthOf(width, frame);
  const px = (magi: number): number | null =>
    plotWidth === null ? null : (magi / axisMax) * plotWidth;

  /* The edges are named in full when both names fit between and inside the
     plot's edges, and by their percentage otherwise. */
  const edges = lines;
  const edgesFit = edgeLabelsFit(edges, px, plotWidth);
  const edgeLabel = (line: SubsidyLine): string =>
    edgesFit ? line.label : formatFpl(line.multiple);

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
  const gapUpright = wordStandsUpright(gapWord, gapPx);

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
  /* On the slope, a label sent right goes under the dot, where the curve
     climbs away above it — unless the dot is so near the axis that under
     it is the axis, in which case it goes over and takes its chances. On
     the plateau it goes over the line — unless the line runs so near the
     top of the plot that the label would meet the name of an edge there,
     in which case it goes under. */
  const nearAxis = hereCost !== null && hereCost < 0.12 * yAxis.max;
  const nearTop = monthly > 0.85 * yAxis.max;
  const meetsEdge =
    onPlateau &&
    nearTop &&
    herePx !== null &&
    labelMeetsEdge(hereSide, herePx, textWidth(hereLabel) + CHART.dot + 5, edges, edgeLabel, px);
  const hereLift = onPlateau
    ? meetsEdge
      ? CHART.dot + 9
      : -(CHART.dot + 7)
    : hereSide === 'right'
      ? nearAxis
        ? -(CHART.dot + 7)
        : CHART.dot + 9
      : 0;

  return (
    <PlotBox label={label} pointer={pointer}>
      <ResponsiveContainer width="100%" height="100%" onResize={(w) => setWidth(w)}>
        <ComposedChart data={curve} margin={frame.margin}>
          {hatch('costHatch')}
          {grid()}
          <XAxis
            {...AXIS_PROPS}
            dataKey="magi"
            type="number"
            domain={axisDomain}
            ticks={incomeTicks(axisMax, plotWidth)}
            tickFormatter={formatAxisMoney}
            label={
              frame.titles
                ? {
                    ...AXIS_TITLE,
                    value: 'Household income for the year',
                    position: 'insideBottom',
                    offset: -4,
                  }
                : undefined
            }
          />
          <YAxis
            {...AXIS_PROPS}
            tickFormatter={formatCurrency}
            width={frame.axis}
            domain={[0, yAxis.max]}
            ticks={yAxis.ticks}
            label={
              frame.titles
                ? {
                    ...AXIS_TITLE,
                    value: 'You pay per month',
                    angle: -90,
                    position: 'insideLeft',
                  }
                : undefined
            }
          />
          {hoverable && (
            <Tooltip
              cursor={HOVER_CURSOR}
              allowEscapeViewBox={{ x: false, y: true }}
              wrapperStyle={{ maxWidth: 'calc(100vw - 3rem)' }}
              content={<ChartTooltip scenario={scenario} />}
            />
          )}

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
              of — the one stretch of the plot the curve never reaches. On a
              phone the band is too narrow to hang anything in, and the key
              under the plot names the line instead. */}
          {!narrow && (
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
          )}

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
                value: edgeLabel(line),
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
            activeDot={hoverable ? HOVER_DOT : false}
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
    </PlotBox>
  );
};
