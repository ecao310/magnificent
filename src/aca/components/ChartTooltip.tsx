import { ptcFor } from '../lib/aca';
import type { CostPoint, Scenario } from '../lib/aca';
import { formatCurrency, formatPercent } from '../lib/format';
import type { TooltipProps } from '../../shared/components/TooltipCard';
import { HouseholdTooltip } from './HouseholdTooltip';

export interface ChartTooltipProps extends TooltipProps<CostPoint> {
  /** The household, so the hovered point can be priced against the subsidy. */
  scenario: Scenario;
}

/**
 * What one point on the axis is worth: the income that makes it, where it
 * stands against the poverty line, what you pay there and what the subsidy
 * pays.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, scenario }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const here = ptcFor(point.magi, scenario);
  const share =
    point.cost === null
      ? null
      : here.overCliff || here.credit === 0
        ? formatPercent(point.magi > 0 ? (point.costAnnual ?? 0) / point.magi : 0)
        : formatPercent(point.share);

  return (
    <HouseholdTooltip magi={point.magi} ptc={here} scenario={scenario}>
      <dt>You pay</dt>
      <dd>{point.cost === null ? '—' : `${formatCurrency(point.cost)}/mo`}</dd>
      <dt>Subsidy</dt>
      <dd>{point.credit > 0 ? `${formatCurrency(Math.round(point.credit / 12))}/mo` : 'None'}</dd>
      <dt>Share of income</dt>
      <dd>{share ?? '—'}</dd>
    </HouseholdTooltip>
  );
};
