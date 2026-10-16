import { PTC_CLIFF_PERCENT } from '../../lib/aca';
import type { PtcAssessment } from '../../lib/aca';
import { formatCurrency } from '../../lib/format';
import { householdProse } from '../../lib/householdProse';
import { Explainer } from '../../../shared/components/Explainer';

export interface CliffExplainerProps {
  here: PtcAssessment;
  /** What the dollar past the line costs this household, or null in a year without a line. */
  cliffCost: number | null;
}

/** The 400% line: back since 2026, and priced in dollars for this household. */
export const CliffExplainer: React.FC<CliffExplainerProps> = ({ here, cliffCost }) => (
  <Explainer
    id="cliff-heading"
    title={<>The {PTC_CLIFF_PERCENT * 100}% Cliff, back since 2026</>}
  >
    <p>
      Once household income passes {PTC_CLIFF_PERCENT * 100}% of FPL, the subsidy completely
      disappears. For {householdProse(here.householdSize)} the line is{' '}
      <strong>{here.cliffMagi !== null ? formatCurrency(here.cliffMagi) : '—'}</strong>, 400% of
      the {formatCurrency(here.povertyLine)} poverty line.
    </p>
    {cliffCost !== null && cliffCost > 0 && (
      <p>
        Under this value, you pay at most 10% of your income as your premium. One dollar over, you pay the full{' '}
        <strong>{formatCurrency(here.benchmarkAnnual)}</strong>. Earning an extra $1 actually loses
        you {formatCurrency(cliffCost - 1)}.
      </p>
    )}
    <p>
      The cliff came back in 2026. Between 2021 and 2025, there was no 400% ceiling, and your share
      was capped at 8.5% of income. A vote to extend the subsidy failed in
      the Senate largely along party lines, with Republicans against an extension.
    </p>
  </Explainer>
);
