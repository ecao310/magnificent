import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { benchmarkMonthlyFor } from '../lib/aca';
import type { CostPoint, Scenario, SubsidyLine } from '../lib/aca';
import { formatCompact, formatCurrency } from '../lib/format';
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
  /** The vertical lines to draw, already filtered to the switches that are on. */
  lines: SubsidyLine[];
  label: string;
  caption: string;
  scenario: Scenario;
}

/**
 * What the household pays for the benchmark plan each month, swept across
 * household income, with the lines the subsidy puts on the axis.
 *
 * One curve, hatched underneath, because the area is money the household
 * pays. It is drawn as a straight line between samples rather than as steps:
 * the household's share is a continuous function of income everywhere but
 * the two edges, and both edges are sampled exactly so the jump is drawn as a
 * jump. Under the floor in an expansion state the household is on Medicaid
 * and the curve is a gap, not a zero.
 */
export const CostChart: React.FC<CostChartProps> = ({
  curve,
  axisDomain,
  here,
  lines,
  label,
  caption,
  scenario,
}) => {
  const yAxis = costAxis(benchmarkMonthlyFor(scenario));
  return (
  <>
    <div className="chart-container" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={curve} margin={{ top: 22, right: 28, left: 10, bottom: 0 }}>
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
            tickFormatter={formatCompact}
          />
          <YAxis
            {...AXIS_PROPS}
            tickFormatter={formatCurrency}
            width={CHART.axis}
            domain={[0, yAxis.max]}
            ticks={yAxis.ticks}
          />
          <Tooltip cursor={HOVER_CURSOR} content={<ChartTooltip scenario={scenario} />} />
          {lines.map((line) => (
            <ReferenceLine
              className={line.kind === 'edge' ? 'credit-edge' : 'csr-tier'}
              key={line.id}
              x={line.magi}
              stroke={line.kind === 'edge' ? PALETTE.fuchsia : PALETTE.violet}
              strokeDasharray="4 4"
              strokeWidth={CHART.rule}
              label={{
                value: line.label,
                position: 'top',
                fill: line.kind === 'edge' ? PALETTE.fuchsiaBright : PALETTE.violetDeep,
                fontSize: CHART.label,
              }}
            />
          ))}
          <ReferenceLine
            className="here-line"
            x={here}
            stroke={PALETTE.amber}
            strokeDasharray="6 4"
            strokeWidth={CHART.rule}
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <p className="chart-axis-label">{caption}</p>
  </>
  );
};
