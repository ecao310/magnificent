import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PTC_CLIFF_PERCENT } from '../lib/tax';
import type {
  FilingStatus,
  IrmaaCliff,
  MarginalRatePoint,
  PtcCliff,
  TaxYear,
} from '../lib/tax';
import { formatCompact } from '../lib/format';
import { CHART, PALETTE } from '../styles/palette';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { usePlotPointer } from '../../shared/hooks/usePlotPointer';
import { HOVER_QUERY, NARROW_QUERY, frameFor } from './chartFrame';
import { ChartTooltip } from './ChartTooltip';

/**
 * How the axis is drawn, in one object rather than two copies.
 *
 * Three tiers, each spending a token the stylesheet already declares: the
 * frame is `--edge-strong`, the mesh behind it is `--edge`, and the words are
 * `--ink-muted`. recharts defaults a tick label's `fill` to the axis's own
 * `stroke`, which is what made the axis line and its labels the same colour
 * before — an axis line as bright as its numbers, in a register whose whole
 * point is that chrome is quieter than content.
 *
 * `tickLine` is off because the grid already says where a tick is, and
 * `fontSize` is set on the axis rather than only on `tick` because recharts
 * measures label widths with it when it decides how many ticks fit.
 */
const AXIS_PROPS = {
  stroke: PALETTE.edgeStrong,
  strokeWidth: CHART.hairline,
  fontSize: CHART.label,
  tickLine: false,
  tick: { fill: PALETTE.inkMuted },
} as const;

/**
 * What a hover draws: the rule that follows the pointer down the plot, and
 * the dot it puts on the curve.
 *
 * The one part of the chart no test here can read back, because recharts
 * decides a hover from `getBoundingClientRect` and jsdom reports every box as
 * zero — so this is the one place the register is held by having been looked
 * at rather than by an assertion. Both were recharts' own defaults until now,
 * which is to say `#ccc` and `#fff`: two colours nothing else declares, and
 * the brightest things on a plot whose whole point is that chrome is quieter
 * than content.
 *
 * The dot's ring is the ground rather than a colour, so it reads as the curve
 * being cut away from under the dot rather than as a second mark on top of it.
 */
const HOVER_CURSOR = {
  stroke: PALETTE.inkMuted,
  strokeWidth: CHART.hairline,
} as const;

const HOVER_DOT = {
  stroke: PALETTE.surface,
  strokeWidth: CHART.rule,
} as const;

/**
 * The dashed vertical marking the reader's own place on the chart.
 *
 * The slider underneath is a *position* on a curve that is already drawn, not
 * an input to it, and nothing on screen said so: an "Other Income" slider
 * sitting under a chart reads as the control that draws the curve. The line is
 * what says otherwise. It takes the colour of the slider that drives it —
 * amber — so the pairing is legible without reading a word, and a heavier dash
 * than the IRMAA cliffs it shares the chart with.
 *
 * It carries no label. It used to say "You are here" and then name both halves
 * of the axis figure in three stacked lines inside the plot, which is a strip
 * of curve about 250px wide spent on words that are said twice underneath
 * anyway: the caption under the axis names the benefit that does not move, the
 * slider beside it names the income that does, and the readout below says
 * which point on the curve this is and what it costs. The line only has to
 * point at it.
 *
 * A plain function, not a component: recharts identifies its children by
 * element type, and a wrapper component would render as an unknown child.
 */
const hereLine = (value: number, colour: string) => (
  <ReferenceLine
    className="here-line"
    x={value}
    stroke={colour}
    strokeDasharray="6 4"
    strokeWidth={CHART.rule}
  />
);

export interface TorpedoChartProps {
  curve: MarginalRatePoint[];
  /** The x-axis span, read off the curve's own ends. */
  axisDomain: [number, number];
  /** The right edge of the other income swept across the axis. */
  axisMax: number;
  /** The slider's step, which a tap or a drag on the plot is rounded to. */
  incomeStep: number;
  /** Moves the reader's marker: a tap, a click, or a finger drawn along the plot. */
  onIncome: (next: number) => void;
  /** Where the reader is standing, in the total income the axis is drawn in. */
  here: number;
  /** Places a threshold given in other income on the axis the chart plots. */
  totalIncomeAt: (otherIncome: number) => number;
  cliffs: IrmaaCliff[];
  subsidyCliff: PtcCliff | null;
  /** The plot's accessible name, which describes the span end to end. */
  label: string;
  /** The caption under the axis: what a figure on it has inside it. */
  caption: string;
  ssBenefit: number;
  filingStatus: FilingStatus;
  muniInterest: number;
  beneficiaries: number;
  year: TaxYear;
}

/**
 * The marginal rate on the next dollar, swept across every dollar that is not
 * Social Security, drawn against the income the return actually takes in.
 *
 * The cliffs it is handed are already filtered to the ones this axis reaches
 * and to the switches that are on, so everything here draws what it is given.
 *
 * On a phone it takes the narrow frame — the margins closed up around the
 * plot — so the curve gets the width the screen has. The plot is its own
 * cursor: a click or a tap moves the marker to the income under the pointer,
 * and a finger drawn along the plot drags it. The hover reading is drawn
 * only where there is a pointer that can hover.
 */
export const TorpedoChart: React.FC<TorpedoChartProps> = ({
  curve,
  axisDomain,
  axisMax,
  incomeStep,
  onIncome,
  here,
  totalIncomeAt,
  cliffs,
  subsidyCliff,
  label,
  caption,
  ssBenefit,
  filingStatus,
  muniInterest,
  beneficiaries,
  year,
}) => {
  const narrow = useMediaQuery(NARROW_QUERY);
  const frame = frameFor(narrow);
  const hoverable = useMediaQuery(HOVER_QUERY, true);
  const pointer = usePlotPointer({ axisMax, step: incomeStep, frame, onIncome });

  return (
  <>
    <div
      className="chart-container"
      role="img"
      aria-label={label}
      ref={pointer.ref}
      onPointerDown={pointer.onPointerDown}
      onPointerMove={pointer.onPointerMove}
      onPointerUp={pointer.onPointerUp}
      onPointerCancel={pointer.onPointerCancel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curve} margin={frame.margin}>
          <defs>
            {/* The engraver's hatch under the curve: a diagonal hairline in
                the curve's own blue, at `CHART.fill`. A pattern rather than a
                gradient because a broadsheet's plot is drawn in lines, and
                because `the chart register` reads the alpha back off it. */}
            <pattern
              id="rateHatch"
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
          <CartesianGrid
            stroke={PALETTE.edge}
            strokeWidth={CHART.hairline}
            vertical={false}
          />
          <XAxis
            {...AXIS_PROPS}
            dataKey="totalIncome"
            type="number"
            domain={axisDomain}
            tickFormatter={formatCompact}
          />
          <YAxis
            {...AXIS_PROPS}
            tickFormatter={(value) => `${value}%`}
            width={frame.axis}
            domain={[0, 'auto']}
          />
          {hoverable && (
            <Tooltip
              cursor={HOVER_CURSOR}
              content={
                <ChartTooltip
                  ssBenefit={ssBenefit}
                  filingStatus={filingStatus}
                  muniInterest={muniInterest}
                  beneficiaries={beneficiaries}
                  year={year}
                />
              }
            />
          )}
          {cliffs.map((cliff) => (
            <ReferenceLine
              className="irmaa-cliff"
              key={cliff.tier}
              x={totalIncomeAt(cliff.otherIncome)}
              stroke={PALETTE.rose}
              strokeDasharray="4 4"
              strokeWidth={CHART.rule}
              label={{
                value: `IRMAA ${cliff.tier}`,
                position: 'top',
                fill: PALETTE.roseBright,
                fontSize: CHART.label,
              }}
            />
          ))}
          {/* Pink rather than a second red: it is a cliff like the IRMAA ones,
              but it belongs to a different reader — the one still buying their
              own coverage — and the panel that switches them on tells them
              apart by colour before it tells them apart in words. Fuchsia is
              what was left: the sky curve, the rose cliffs, the amber marker
              and every slider already own a colour, muni interest's violet
              included. */}
          {subsidyCliff && (
            <ReferenceLine
              className="subsidy-cliff"
              x={totalIncomeAt(subsidyCliff.otherIncome)}
              stroke={PALETTE.fuchsia}
              strokeDasharray="4 4"
              strokeWidth={CHART.rule}
              label={{
                value: `${PTC_CLIFF_PERCENT * 100}% FPL`,
                position: 'top',
                fill: PALETTE.fuchsiaBright,
                fontSize: CHART.label,
              }}
            />
          )}
          {hereLine(here, PALETTE.amber)}
          <Area
            type="stepAfter"
            dataKey="marginalRate"
            stroke={PALETTE.accent}
            strokeWidth={CHART.line}
            fill="url(#rateHatch)"
            fillOpacity={1}
            activeDot={hoverable ? HOVER_DOT : false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="chart-axis-label">{caption}</p>
  </>
  );
};
