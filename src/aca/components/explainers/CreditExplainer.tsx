import type { PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdProse } from '../../lib/householdProse';
import { Explainer } from '../../../shared/components/Explainer';

export interface CreditExplainerProps {
  here: PtcAssessment;
}

/** The subsidy's formula, and this household's own line through it. */
export const CreditExplainer: React.FC<CreditExplainerProps> = ({ here }) => {
  const share = here.applicablePercentage * here.magi;
  return (
    <Explainer id="credit-heading" title="The ACA Subsidy">
      <p>For ACA plans, qualifying households pay a percentage of income as their premium.</p>
      <p>For this household:</p>
      <ul>
        <li>
          Benchmark plan is <strong>{formatCurrency(here.benchmarkAnnual)}</strong> per year (
          {formatCurrency(here.benchmarkMonthly)} per month)
        </li>
        <li>
          Federal poverty line for <strong>{householdProse(here.householdSize)}</strong> is{' '}
          {formatCurrency(here.povertyLine)}
        </li>
        <li>
          Income of {formatCurrency(Math.round(here.magi))} is{' '}
          <strong>{formatFpl(here.fplMultiple)}</strong> of FPL
        </li>
      </ul>
      <p>
        Your share is determined by your income as a percentage of the federal poverty line.
      </p>
      <ul>
        <li>
          {formatFpl(here.fplMultiple)} of FPL =&gt; {formatPercent(here.applicablePercentage)} of
          income = <strong>{formatCurrency(share)}</strong> per year (
          {formatCurrency(share / 12)} per month)
        </li>
        <li>
          Subsidy pays the rest:{' '}
          {here.credit > 0 ? (
            <strong>{formatCurrency(here.credit)}</strong>
          ) : here.belowFloor ? (
            <>nothing &mdash; this income is under the Medicaid line</>
          ) : here.overCliff ? (
            <>nothing &mdash; this income is over the 400% line</>
          ) : (
            <>nothing &mdash; your share already covers the full premium</>
          )}
          .
        </li>
      </ul>
    </Explainer>
  );
};
