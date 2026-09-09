import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { creditFloorMagi, ptcCliffMagi } from '../../lib/aca';
import type { Scenario, SubsidyLine } from '../../lib/aca';
import type { RatePoint } from '../../lib/tax';
import { formatAxisMoney, formatAxisPercent, formatFpl, formatPercent } from '../../lib/format';
import { CHART, PALETTE } from '../../styles/palette';
import {
  AXIS_PROPS,
  AXIS_TITLE,
  HOVER_CURSOR,
  HOVER_DOT,
  LABEL_GAP,
  MARGIN,
  edgeLabelsFit,
  incomeTicks,
  plotWidthOf,
  textWidth,
  wordStandsUpright,
} from '../chartFrame';
import { RateTooltip } from './RateTooltip';

/**
 * The premium after the subsidy, as the band stacked on income tax: from
 * the top of the tax to the all-in line. A range, so the hatch starts where
 * the wash under it stops. Null under the floor, where there is no premium
 * to stack.
 */
const premiumBand = (point: RatePoint): [number, number] | null =>
  point.allInShare === null ? null : [point.incomeTaxShare, point.allInShare];

export interface RateChartProps {
  curve: RatePoint[];
  axisDomain: [number, number];
  /** The top of the rate axis and its ticks, sized to the curve. */
  rateAxis: { max: number; ticks: number[] };
  /** Where the reader is standing: the household's own income. */
  here: number;
  /** The all-in rate there, or null under the floor. */
  hereRate: number | null;
  /** The subsidy's two edges, where they fall on this axis. */
  lines: SubsidyLine[];
  label: string;
  scenario: Scenario;
  /** Clicking the plot moves the reader, so the chart is its own cursor. */
  onIncome: (next: number) => void;
}

/**
 * Income tax and the premium after the subsidy, each as a share of household
 * income, stacked, and the line along the top of the stack: the all-in rate.
 *
 * Three marks. The wash at the bottom is federal income tax — ink, because
 * it is the part every reader already knows about. The hatch over it is the
 * premium, in the same blue and the same hatch the cost page draws it in.
 * The line along the top of both is the whole, drawn in ink the way a total
 * is ruled in a ledger. The jump in that line at the 400% line is the page.
 *
 * Under the floor there is no premium to stack — Medicaid, or the coverage
 * gap — so the hatch and the line stop and the wash runs on alone. The
 * same labels the cost page fits to its plot are fitted here the same way.
 */
export const RateChart: React.FC<RateChartProps> = ({
  curve,
  axisDomain,
  rateAxis,
  here,
  hereRate,
  lines,
  label,
  scenario,
  onIncome,
}) => {
  const axisMax = axisDomain[1];
  const expansion = scenario.expansionState !== false;
  const floorMagi = Math.round(creditFloorMagi(scenario));
  const cliffMagi = ptcCliffMagi(scenario);

  /** The plot area's width in pixels once measured, or null before the first measurement. */
  const [plotWidth, setPlotWidth] = useState<number | null>(null);
  const px = (magi: number): number | null =>
    plotWidth === null ? null : (magi / axisMax) * plotWidth;

  const edges = lines;
  const edgesFit = edgeLabelsFit(edges, px, plotWidth);

  /* The word over the gap stands upright when the gap is narrower than it. */
  const gapWord = expansion ? 'Medicaid' : 'No subsidy, no Medicaid';
  const gapPx = px(floorMagi);
  const gapUpright = wordStandsUpright(gapWord, gapPx);

  /* The marker's label goes on the clear side of the line. Under the 400%
     line the rate climbs with income, so the clear side is the left, where
     the line has already fallen away below the dot; over it the rate falls
     with income, so the clear side is the right and above. Either way the
     other side is taken when the plot's edge — or an upright word in the
     gap — is too near. */
  const hereLabel = hereRate === null ? '' : `You · ${formatPercent(hereRate)}`;
  const pastCliff = cliffMagi !== null && here > cliffMagi;
  const herePx = px(here);
  const hereSide = ((): 'left' | 'right' => {
    const need = textWidth(hereLabel) + CHART.dot + LABEL_GAP;
    if (herePx === null || plotWidth === null) {
      return pastCliff && here <= 0.78 * axisMax ? 'right' : 'left';
    }
    if (pastCliff) return plotWidth - herePx >= need ? 'right' : 'left';
    return herePx - need >= (gapUpright ? (gapPx ?? 0) : 0) ? 'left' : 'right';
  })();
  /* Under the line, a label sent right goes under the dot, where the line
     climbs away above it — unless the dot is so near the axis that under
     it is the axis, in which case it goes over and takes its chances. */
  const nearAxis = hereRate !== null && hereRate < 0.12 * rateAxis.max;
  const hereLift =
    pastCliff || (hereSide === 'right' && nearAxis)
      ? -(CHART.dot + 7)
      : hereSide === 'right'
        ? CHART.dot + 9
        : 0;

  return (
    <div className="chart-container" role="img" aria-label={label}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        onResize={(width) => setPlotWidth(plotWidthOf(width))}
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
            {/* The cost page's hatch, for the same thing it stands for there:
                what the household pays for the plan. */}
            <pattern
              id="premiumHatch"
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
            tickFormatter={formatAxisPercent}
            width={CHART.axis}
            domain={[0, rateAxis.max]}
            ticks={rateAxis.ticks}
            label={{
              ...AXIS_TITLE,
              value: 'Share of income',
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip
            cursor={HOVER_CURSOR}
            allowEscapeViewBox={{ x: false, y: true }}
            wrapperStyle={{ maxWidth: 'calc(100vw - 3rem)' }}
            content={<RateTooltip scenario={scenario} />}
          />

          {/* Federal income tax, at the bottom of the stack. */}
          <Area
            type="linear"
            dataKey="incomeTaxShare"
            name="Federal income tax"
            stroke={PALETTE.inkMuted}
            strokeWidth={CHART.hairline}
            fill={PALETTE.inkMuted}
            fillOpacity={CHART.wash}
            activeDot={false}
            isAnimationActive={false}
          />
          {/* The premium after the subsidy, stacked on it. */}
          <Area
            type="linear"
            dataKey={premiumBand}
            name="Premium after subsidy"
            stroke="none"
            fill="url(#premiumHatch)"
            fillOpacity={1}
            connectNulls={false}
            activeDot={false}
            isAnimationActive={false}
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

          {/* The whole: tax and premium together, ruled along the top. */}
          <Line
            type="linear"
            dataKey="allInShare"
            name="All in"
            stroke={PALETTE.edgeStrong}
            strokeWidth={CHART.line}
            dot={false}
            activeDot={HOVER_DOT}
            connectNulls={false}
            isAnimationActive={false}
          />

          {hereRate !== null && (
            <ReferenceDot
              className="here-dot"
              x={here}
              y={hereRate}
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
