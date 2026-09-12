import { allInFor } from '../../lib/tax';
import type { RatePoint } from '../../lib/tax';
import type { Scenario } from '../../lib/aca';
import { formatCurrency, formatFpl, formatPercent } from '../../lib/format';

export interface RateTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RatePoint }>;
  /** The household, so the hovered point can be priced whole. */
  scenario: Scenario;
}

/**
 * What one point on the axis is worth: the income that makes it, where it
 * stands against the poverty line, and the rate there split into its two
 * parts. The second line of the head appears only where the plain reading —
 * you on the slope — does not hold.
 */
export const RateTooltip: React.FC<RateTooltipProps> = ({ active, payload, scenario }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const here = allInFor(point.magi, scenario);
  const { ptc } = here;
  const standing = ptc.belowFloor
    ? scenario.expansionState === false
      ? 'No subsidy or Medicaid'
      : 'Medicaid'
    : ptc.overCliff
      ? 'No subsidy — over the 400% line'
      : null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-head">
        {formatCurrency(point.magi)} · {formatFpl(ptc.fplMultiple)} of poverty line
        {standing !== null && <span className="chart-tooltip-standing">{standing}</span>}
      </div>
      <dl className="chart-tooltip-rows">
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
      </dl>
    </div>
  );
};
