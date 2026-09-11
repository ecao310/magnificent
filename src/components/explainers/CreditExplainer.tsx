import { FPL_YEAR_PARAMS, PTC_CLIFF_PERCENT } from '../../lib/aca';
import type { CoverageYear, PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdProse } from '../../lib/householdProse';

export interface CreditExplainerProps {
  here: PtcAssessment;
  year: CoverageYear;
}

/** How the subsidy is figured: the formula, the year's table, and your own line through it. */
export const CreditExplainer: React.FC<CreditExplainerProps> = ({ here, year }) => {
  const { table } = FPL_YEAR_PARAMS[year];
  const bands = table.filter((band) => Number.isFinite(band.to) || band.from < PTC_CLIFF_PERCENT);
  return (
    <details className="explainer">
      <summary>
        <h3 id="credit-heading">How the subsidy is figured</h3>
      </summary>
      <div className="explainer-content">
        <p>
          For ACA plans, you pay a percentage of your income as your premium, and a subsidy pays the rest.
          Your share is determined by a table based on your income as a percentage of the federal poverty line.
        </p>
        <p>
          For this household: benchmark <strong>{formatCurrency(here.benchmarkAnnual)}</strong>{' '}
          a year ({formatCurrency(here.benchmarkMonthly)} a month); poverty line for{' '}
          {householdProse(here.householdSize)} {formatCurrency(here.povertyLine)}; income{' '}
          {formatCurrency(Math.round(here.magi))} is <strong>{formatFpl(here.fplMultiple)}</strong>{' '}
          of it. Your share at {formatFpl(here.fplMultiple)} is{' '}
          <strong>{formatPercent(here.applicablePercentage)}</strong> of income,{' '}
          {formatCurrency(here.applicablePercentage * here.magi)} a year, and the subsidy is
          the rest:{' '}
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
        </p>
        <p>
          <strong>The {year} table.</strong> Income as a share of the poverty line, and your
          share of income at the bottom and top of each band:
        </p>
        <ul>
          {bands.map((band) => (
            <li key={band.from}>
              {band.from === 0 ? 'Under' : `${formatFpl(band.from)} to`}{' '}
              {Number.isFinite(band.to) ? formatFpl(band.to) : 'anything'}:{' '}
              {band.initial === band.final
                ? formatPercent(band.initial)
                : `${formatPercent(band.initial)} rising to ${formatPercent(band.final)}`}
            </li>
          ))}
        </ul>
        <p>
          <strong>The benchmark.</strong> Your state&rsquo;s average, scaled to your ages on the age curve.
          A different benchmark changes the subsidy dollar for dollar, but not what
          you pay under the 400% line &mdash; your share is a share of income.
        </p>
        <p>
          <strong>Paid in advance, settled after the year.</strong> The Marketplace pays the
          subsidy month by month on the income you estimated at enrollment. After the year
          it is refigured on your actual income, and the difference is refunded or repaid.
          Through 2025 repayment was capped for a household under 400% of the line; from{' '}
          {year} there is no cap: an advance paid on a low estimate is repaid in full, and
          if the extra income carried you over the 400% line, the whole year&rsquo;s
          advance. Update your estimate on the Marketplace when your income changes.
        </p>
      </div>
    </details>
  );
};
