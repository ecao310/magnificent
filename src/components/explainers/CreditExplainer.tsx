import { FPL_YEAR_PARAMS, PTC_CLIFF_PERCENT } from '../../lib/tax';
import type { PtcAssessment, TaxYear } from '../../lib/tax';
import { formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdProse } from '../../lib/returnProse';

export interface CreditExplainerProps {
  here: PtcAssessment;
  year: TaxYear;
}

/** How the credit is figured: the formula, the table for the year, and this household's own line through it. */
export const CreditExplainer: React.FC<CreditExplainerProps> = ({ here, year }) => {
  const { table } = FPL_YEAR_PARAMS[year];
  const bands = table.filter((band) => Number.isFinite(band.to) || band.from < PTC_CLIFF_PERCENT);
  return (
    <details className="explainer">
      <summary>
        <h3 id="credit-heading">How the premium tax credit is figured</h3>
      </summary>
      <div className="explainer-content">
        <p>
          Coverage bought on the Marketplace comes with a credit under IRC 36B that
          pays whatever the <strong>benchmark plan</strong> &mdash; the second-lowest-cost
          silver plan for the household&apos;s ages and county &mdash; costs above a set
          share of household income. The share is the <strong>applicable
          percentage</strong>, read off a table by where income falls against the
          federal poverty line, and it rises with income. So the credit is the
          benchmark, less that percentage of income:
        </p>
        <p>
          For this household the benchmark is{' '}
          <strong>{formatCurrency(here.benchmarkAnnual)}</strong> a year (
          {formatCurrency(here.benchmarkMonthly)} a month), the poverty line for{' '}
          {householdProse(here.householdSize)} is {formatCurrency(here.povertyLine)}, and
          household income of {formatCurrency(Math.round(here.magi))} is{' '}
          <strong>{formatFpl(here.fplMultiple)}</strong> of it. The table asks for{' '}
          <strong>{formatPercent(here.applicablePercentage)}</strong> of income there &mdash;{' '}
          {formatCurrency(here.applicablePercentage * here.magi)} &mdash; and the credit is
          what is left of the benchmark:{' '}
          {here.credit > 0 ? (
            <strong>{formatCurrency(here.credit)}</strong>
          ) : here.belowFloor ? (
            <>nothing, because this income is under the floor &mdash; see the note on the floor</>
          ) : here.overCliff ? (
            <>nothing, because this income is over the {PTC_CLIFF_PERCENT * 100}% line</>
          ) : (
            <>nothing, because the household&apos;s share already reaches the benchmark</>
          )}
          .
        </p>
        <p>
          <strong>The {year} table.</strong> Household income as a share of the poverty
          line, and the percentage of income the household pays at the bottom and the
          top of each band:
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
          Inside a band the percentage rises in a straight line, which is why the slope
          in the next note is steeper than the percentage itself. The table is indexed
          each summer &mdash; Rev. Proc. 2025-25 for {year}, Rev. Proc. 2026-26 for 2027,
          where the top row is 10.22% &mdash; and the poverty line is the one HHS
          published the January before the coverage year began.
        </p>
        <p>
          <strong>Where the benchmark comes from.</strong> Unless you set it under
          Advanced inputs, the figure here is KFF&apos;s national average for a
          40-year-old, scaled to the household&apos;s ages on the federal age curve
          every default-curve state uses: a 64-year-old pays three times what a
          21-year-old does, a 50-year-old 1.79 times. Your county&apos;s benchmark may
          be half or double the average, and the credit moves dollar for dollar with
          it, so the one figure worth looking up before trusting anything on this page
          is that one.
        </p>
      </div>
    </details>
  );
};
