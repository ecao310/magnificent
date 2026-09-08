import { ptcFor } from '../lib/aca';
import type { CostPoint, Scenario } from '../lib/aca';
import { formatCurrency, formatFpl, formatPercent } from '../lib/format';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CostPoint }>;
  /** The household, so the hovered point can be priced against the subsidy. */
  scenario: Scenario;
}

/**
 * What one point on the axis is worth: the income that makes it, where it
 * stands against the poverty line, what you pay there and what the subsidy
 * pays. The second line of the head appears only where the plain reading —
 * you on the slope — does not hold.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, scenario }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const here = ptcFor(point.magi, scenario);
  const standing = here.belowFloor
    ? scenario.expansionState === false
      ? 'No subsidy or Medicaid'
      : 'Medicaid'
    : here.overCliff
      ? 'No subsidy — over the 400% line'
      : null;
  const share =
    point.cost === null
      ? null
      : here.overCliff || here.credit === 0
        ? formatPercent(point.magi > 0 ? (point.costAnnual ?? 0) / point.magi : 0)
        : formatPercent(point.share);

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-head">
        {formatCurrency(point.magi)} · {formatFpl(here.fplMultiple)} of poverty line
        {standing !== null && <span className="chart-tooltip-standing">{standing}</span>}
      </div>
      <dl className="chart-tooltip-rows">
        <dt>You pay</dt>
        <dd>{point.cost === null ? '—' : `${formatCurrency(point.cost)}/mo`}</dd>
        <dt>Subsidy</dt>
        <dd>
          {point.credit > 0 ? `${formatCurrency(Math.round(point.credit / 12))}/mo` : 'None'}
        </dd>
        <dt>Share of income</dt>
        <dd>{share ?? '—'}</dd>
      </dl>
    </div>
  );
};
