import { PTC_CLIFF_PERCENT } from '../../lib/aca';
import type { PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdProse } from '../../lib/householdProse';
import { Explainer } from '../../../shared/components/Explainer';

export interface CreditExplainerProps {
  here: PtcAssessment;
}

/**
 * The subsidy's formula, and this household's own line through it. The two
 * bullets are the doc's, and hold wherever the household is on the slope; a
 * household the subsidy leaves out altogether is priced by what it pays
 * instead, since there is no share of income to quote it.
 */
export const CreditExplainer: React.FC<CreditExplainerProps> = ({ here }) => {
  const share = here.applicablePercentage * here.magi;
  const fullBenchmark = (
    <>
      <strong>{formatCurrency(here.benchmarkAnnual)}</strong> per year (
      {formatCurrency(here.benchmarkMonthly)} per month)
    </>
  );
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
      {here.credit > 0 ? (
        <>
          <p>Your share is determined by your income as a percentage of the federal poverty line.</p>
          <ul>
            <li>
              {formatFpl(here.fplMultiple)} of FPL =&gt; {formatPercent(here.applicablePercentage)} of
              income = <strong>{formatCurrency(share)}</strong> per year (
              {formatCurrency(share / 12)} per month)
            </li>
            <li>
              Subsidy pays the rest: <strong>{formatCurrency(here.credit)}</strong>.
            </li>
          </ul>
        </>
      ) : here.overCliff ? (
        <p>
          Over {PTC_CLIFF_PERCENT * 100}% of the federal poverty line the subsidy is gone: this
          household pays the full benchmark of {fullBenchmark}.
        </p>
      ) : here.belowFloor && here.floorMultiple > 1 ? (
        <p>This income is under the Medicaid line: there is no subsidy and no premium to pay.</p>
      ) : here.belowFloor ? (
        <p>
          This income is under 100% of the poverty line in a state that did not expand Medicaid, so
          there is no subsidy: this household pays the full benchmark of {fullBenchmark}.
        </p>
      ) : (
        <p>
          Your share of income already covers the full benchmark, so the subsidy is nothing: this
          household pays the full {fullBenchmark}.
        </p>
      )}
    </Explainer>
  );
};
