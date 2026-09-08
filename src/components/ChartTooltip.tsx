import { ptcFor } from '../lib/tax';
import type { Scenario, SlopePoint } from '../lib/tax';
import { formatCurrency, formatFpl } from '../lib/format';
import { PALETTE } from '../styles/palette';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SlopePoint }>;
  /** The household, so the hovered point can be assessed against the credit. */
  scenario: Scenario;
}

/**
 * What one point on the axis is worth: the income that makes it and where it
 * stands against the poverty line, the next dollar priced both ways with the
 * credit's share of each, and the year's credit and tax there.
 *
 * Figures and no advice, for the reason the page before this one gave: a
 * recommendation about wherever a mouse happened to land is nobody's point in
 * particular. What a hover is good for is the assessment *at this point*,
 * which no other reading of the household can give.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, scenario }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const here = ptcFor(point.magi, scenario);
  const standing = here.belowFloor
    ? scenario.expansionState === false
      ? 'under 100%: no credit, no Medicaid'
      : 'under the floor: Medicaid'
    : here.overCliff
      ? 'over the line: no credit'
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
        Next dollar as a conversion:{' '}
        <strong style={{ color: PALETTE.accent }}>{point.conversionRate}%</strong>
      </div>
      <div>
        Next dollar as a gain:{' '}
        <strong style={{ color: PALETTE.emerald }}>{point.harvestRate}%</strong>
      </div>
      <div>
        Of which credit given back:{' '}
        <strong style={{ color: PALETTE.fuchsiaBright }}>{point.creditRate}%</strong>
      </div>
      <div>
        Premium tax credit:{' '}
        <strong style={{ color: PALETTE.fuchsiaBright }}>{formatCurrency(point.credit)}/yr</strong>
      </div>
      <div>
        Federal tax: <strong style={{ color: PALETTE.orange }}>{formatCurrency(point.tax)}</strong>
      </div>
    </div>
  );
};
