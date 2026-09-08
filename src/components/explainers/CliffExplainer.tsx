import { FPL_GUIDELINE_LOOKBACK_YEARS, PTC_CLIFF_PERCENT, fplGuidelineYear } from '../../lib/tax';
import type { PtcAssessment, TaxYear } from '../../lib/tax';
import { formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdProse } from '../../lib/returnProse';

export interface CliffExplainerProps {
  here: PtcAssessment;
  /** What the dollar past the line costs this household, or null in a year without a line. */
  cliffCost: number | null;
  year: TaxYear;
}

/** The 400% line: back since 2026, and priced in dollars for this household. */
export const CliffExplainer: React.FC<CliffExplainerProps> = ({ here, cliffCost, year }) => (
  <details className="explainer">
    <summary>
      <h3 id="cliff-heading">The {PTC_CLIFF_PERCENT * 100}% cliff, back since 2026</h3>
    </summary>
    <div className="explainer-content">
      <p>
        36B(c)(1)(A) allows the credit to a household whose income is &ldquo;at least
        100 percent but not more than 400 percent&rdquo; of the poverty line. Past 400%
        there is no row in the table, so the credit is not smaller &mdash; it is nothing.
        For {householdProse(here.householdSize)} the line is{' '}
        <strong>{here.cliffMagi !== null ? formatCurrency(here.cliffMagi) : '—'}</strong>,
        which is {PTC_CLIFF_PERCENT * 100}% of the {formatCurrency(here.povertyLine)}{' '}
        poverty line.
      </p>
      {cliffCost !== null && (
        <p>
          <strong>What the dollar over it costs.</strong> Just under the line this
          household pays 9.96% of its income for the benchmark and the credit pays the
          other <strong>{formatCurrency(cliffCost)}</strong>. One dollar over, it pays
          the whole {formatCurrency(here.benchmarkAnnual)}. That is the cost of the
          dollar: {formatCurrency(cliffCost)}, which is why the chart draws it as a line
          rather than as a point on the curve &mdash; no y-axis holds it.
          {cliffCost === 0 &&
            ' For this household the figure is zero: its share of the benchmark reaches the premium before income reaches the line, so there is nothing left to fall off.'}
        </p>
      )}
      <p>
        <strong>You are here.</strong> Household income is{' '}
        {formatCurrency(Math.round(here.magi))}, {formatFpl(here.fplMultiple)} of the
        line.{' '}
        {here.overCliff
          ? `That is past the cliff: there is no credit this year, and coming back under it takes ${formatCurrency(
              Math.round(here.magi - (here.cliffMagi ?? 0)),
            )} less income.`
          : here.headroom !== null
            ? `Another ${formatCurrency(Math.round(here.headroom))} of it reaches the line, and the dollar after that is the one that costs.`
            : 'There is no line this year.'}
      </p>
      <p>
        <strong>It was gone, and it is back.</strong> From 2021 through 2025 there was
        no 400% ceiling: ARPA section 9661, extended by the Inflation Reduction Act,
        replaced the table with one that ran past 400% and capped the household&apos;s
        share at 8.5% of income however high income went. That expired for tax years
        beginning after 2025. The House passed a three-year extension on 8 January
        2026, 230 to 196; the Senate did not take it up, and {year} returns are filed
        under the table this page prices. On a 2025 return this household&apos;s
        slope ran from nothing to about {formatPercent(0.085 + 0.025 * 3.5)} and never
        fell off anything.
      </p>
      <p>
        <strong>The line runs a year behind.</strong> 26 CFR 1.36B-1(h) fixes the
        poverty line at the guidelines in effect when open enrollment began, the
        previous 1 November, so {year} coverage is priced off the {fplGuidelineYear(year)}{' '}
        guidelines &mdash; {FPL_GUIDELINE_LOOKBACK_YEARS} year old when the year starts.
        The 2026 guidelines, which price 2027, put a one-person line at $15,960 and add
        $5,680 a person.
      </p>
    </div>
  </details>
);
