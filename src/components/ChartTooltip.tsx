import { ptcFor } from '../lib/aca';
import type { CostPoint, Scenario } from '../lib/aca';
import { formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { PALETTE } from '../styles/palette';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CostPoint }>;
  /** The household, so the hovered point can be assessed against the credit. */
  scenario: Scenario;
}

/**
 * What one point on the axis is worth: the income that makes it and where it
 * stands against the poverty line, the subsidy there, what the household
 * pays, and the share of income that is.
 *
 * Figures and no advice: a recommendation about wherever a mouse happened to
 * land is nobody's point in particular. What a hover is good for is the
 * subsidy *at this point*, which is what the reader asked to see.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, scenario }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const here = ptcFor(point.magi, scenario);
  const standing = here.belowFloor
    ? scenario.expansionState === false
      ? 'under 100%: no subsidy, no Medicaid'
      : 'under the floor: Medicaid'
    : here.overCliff
      ? 'over the line: no subsidy'
      : here.csrTier
        ? `silver upgraded to ${here.csrTier.actuarialValue}%`
        : 'standard silver';
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-head">
        Household income {formatCurrency(point.magi)} · {formatFpl(here.fplMultiple)} of the
        poverty line · {standing}
      </div>
      <div>
        Subsidy:{' '}
        <strong style={{ color: PALETTE.fuchsiaBright }}>
          {formatCurrency(point.credit)}/yr
        </strong>
        {point.credit > 0 ? ` (${formatCurrency(Math.round(point.credit / 12))}/mo)` : ''}
      </div>
      <div>
        You pay:{' '}
        <strong style={{ color: PALETTE.accent }}>
          {point.cost === null ? 'Medicaid' : `${formatCurrency(point.cost)}/mo`}
        </strong>
        {point.costAnnual !== null ? ` (${formatCurrency(point.costAnnual)}/yr)` : ''}
      </div>
      <div>
        Share of income:{' '}
        <strong style={{ color: PALETTE.inkMuted }}>
          {point.cost === null
            ? '—'
            : here.overCliff
              ? formatPercent(point.magi > 0 ? (point.costAnnual ?? 0) / point.magi : 0)
              : formatPercent(point.share)}
        </strong>
      </div>
    </div>
  );
};
