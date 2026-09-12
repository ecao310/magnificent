import type { ReactNode } from 'react';
import type { PtcAssessment, Scenario } from '../lib/aca';
import { formatCurrency, formatFpl } from '../lib/format';
import { TooltipCard } from '../../shared/components/TooltipCard';

export interface HouseholdTooltipProps {
  /** The hovered income. */
  magi: number;
  /** Where the household stands against the subsidy there. */
  ptc: PtcAssessment;
  scenario: Scenario;
  /** The rows: a `dt` and a `dd` per figure, the figures aligned down the right. */
  children: ReactNode;
}

/**
 * The head both of this page's hover readings share: the income that makes
 * the point, where it stands against the poverty line, and — only where the
 * plain reading, you on the slope, does not hold — a second line saying so.
 * Under it, whichever figures the chart showing is drawn in.
 */
export const HouseholdTooltip: React.FC<HouseholdTooltipProps> = ({
  magi,
  ptc,
  scenario,
  children,
}) => {
  const standing = ptc.belowFloor
    ? scenario.expansionState === false
      ? 'No subsidy or Medicaid'
      : 'Medicaid'
    : ptc.overCliff
      ? 'No subsidy — over the 400% line'
      : null;

  return (
    <TooltipCard
      head={
        <>
          {formatCurrency(magi)} · {formatFpl(ptc.fplMultiple)} of poverty line
          {standing !== null && <span className="chart-tooltip-standing">{standing}</span>}
        </>
      }
    >
      <dl className="chart-tooltip-rows">{children}</dl>
    </TooltipCard>
  );
};
