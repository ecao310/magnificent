import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AddedKind, Scenario, SlopePoint, SubsidyLine } from '../lib/tax';
import { formatCompact } from '../lib/format';
import { ADDED_KIND_LABELS } from '../lib/returnProse';
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

/** What a hover draws: the rule down the plot, and the dot on each curve. */
const HOVER_CURSOR = { stroke: PALETTE.inkMuted, strokeWidth: CHART.hairline } as const;
const HOVER_DOT = { stroke: PALETTE.surface, strokeWidth: CHART.rule } as const;

/**
 * Where the two curves sit among recharts' layers: a line's own default is
 * 400, the reference lines' 600, so the curve beneath stays a line and the
 * curve on top stays under the marker.
 */
const CURVE_BENEATH = 400;
const CURVE_ON_TOP = 450;

/** The two curves, and how each is drawn. */
const CURVES: readonly { kind: AddedKind; dataKey: 'conversionRate' | 'harvestRate'; stroke: string }[] = [
  { kind: 'conversion', dataKey: 'conversionRate', stroke: PALETTE.accent },
  { kind: 'harvest', dataKey: 'harvestRate', stroke: PALETTE.emerald },
];

/** One point of the sweep with the block's own curve picked out of it. */
export type BlockPoint = SlopePoint & { blockRate?: number };

export interface SlopeChartProps {
  curve: BlockPoint[];
  axisDomain: [number, number];
  /** Where the block ends: the household's income with it added. */
  here: number;
  /** The vertical lines to draw, already filtered to the switches that are on. */
  lines: SubsidyLine[];
  /** Which curve the block is priced under, for the key. */
  kind: AddedKind;
  label: string;
  caption: string;
  scenario: Scenario;
}

/**
 * The two curves, the block under one of them, and the lines the credit puts
 * on the axis.
 *
 * Two curves rather than a toggle, because the comparison is the page: the
 * gap between them at any income is exactly the tax the conversion dollar
 * pays and the gain dollar does not, and the slope both share is the credit.
 * The block is the one area drawn — a hatch under the current curve from the
 * base to the base plus the block — because the area under a marginal curve
 * *is* the cost, and this is the one stretch of it the reader is buying.
 */
export const SlopeChart: React.FC<SlopeChartProps> = ({
  curve,
  axisDomain,
  here,
  lines,
  kind,
  label,
  caption,
  scenario,
}) => (
  <>
    <div className="chart-container" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={curve} margin={{ top: 22, right: 28, left: 10, bottom: 0 }}>
          <defs>
            {/* The engraver's hatch under the block, in the marker's amber: it
                is the reader's own stretch of the curve, and it takes the
                reader's own colour. */}
            <pattern
              id="blockHatch"
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
                stroke={PALETTE.amber}
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
            tickFormatter={(value) => `${value}%`}
            width={CHART.axis}
            domain={[0, 'auto']}
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
            type="stepAfter"
            dataKey="blockRate"
            name="block"
            stroke="none"
            fill="url(#blockHatch)"
            fillOpacity={1}
            activeDot={false}
            isAnimationActive={false}
          />
          {/* The curve the block is priced under is raised a layer, so it is
              the one on top wherever the two coincide — which for a household
              under the standard deduction is everywhere. Recharts orders its
              layers by `zIndex` rather than by child order, so the order is
              stated rather than arranged. */}
          {CURVES.map((curve) => (
            <Line
              key={curve.kind}
              className={`curve-${curve.kind}`}
              type="stepAfter"
              dataKey={curve.dataKey}
              name={ADDED_KIND_LABELS[curve.kind]}
              stroke={curve.stroke}
              strokeWidth={CHART.line}
              dot={false}
              activeDot={HOVER_DOT}
              isAnimationActive={false}
              zIndex={curve.kind === kind ? CURVE_ON_TOP : CURVE_BENEATH}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <p className="chart-axis-label">{caption}</p>
    <ul className="chart-key" aria-label="Key">
      <li className={kind === 'conversion' ? 'chart-key-current' : undefined}>
        <span className="chart-key-swatch chart-key-swatch-conversion" aria-hidden="true" />
        <span>Next dollar as a Roth conversion</span>
      </li>
      <li className={kind === 'harvest' ? 'chart-key-current' : undefined}>
        <span className="chart-key-swatch chart-key-swatch-harvest" aria-hidden="true" />
        <span>Next dollar as a harvested gain</span>
      </li>
    </ul>
  </>
);
