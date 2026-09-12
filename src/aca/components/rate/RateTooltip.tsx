import { allInFor } from '../../lib/tax';
import type { RatePoint } from '../../lib/tax';
import type { Scenario } from '../../lib/aca';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { TooltipProps } from '../../../shared/components/TooltipCard';
import { HouseholdTooltip } from '../HouseholdTooltip';

export interface RateTooltipProps extends TooltipProps<RatePoint> {
  /** The household, so the hovered point can be priced whole. */
  scenario: Scenario;
}

/**
 * What one point on the axis is worth: the income that makes it, where it
 * stands against the poverty line, and the rate there split into its two
 * parts.
 */
export const RateTooltip: React.FC<RateTooltipProps> = ({ active, payload, scenario }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const here = allInFor(point.magi, scenario);

  return (
    <HouseholdTooltip magi={point.magi} ptc={here.ptc} scenario={scenario}>
      <dt>All in</dt>
      <dd>{here.allInShare === null ? '—' : formatPercent(here.allInShare)}</dd>
      <dt>Income tax</dt>
      <dd>
        {formatPercent(here.incomeTaxShare)} · {formatCurrency(Math.round(here.incomeTax))}
      </dd>
      <dt>Premium</dt>
      <dd>
        {here.premium === null || here.premiumShare === null
          ? '—'
          : `${formatPercent(here.premiumShare)} · ${formatCurrency(Math.round(here.premium / 12))}/mo`}
      </dd>
    </HouseholdTooltip>
  );
};
