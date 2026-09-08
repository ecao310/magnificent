import { PTC_CLIFF_PERCENT, fplGuidelineYear } from '../../lib/aca';
import type { CoverageYear, PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl } from '../../lib/format';
import { householdProse } from '../../lib/householdProse';

export interface CliffExplainerProps {
  here: PtcAssessment;
  /** What the dollar past the line costs this household, or null in a year without a line. */
  cliffCost: number | null;
  year: CoverageYear;
}

/** The 400% line: back since 2026, and priced in dollars for this household. */
export const CliffExplainer: React.FC<CliffExplainerProps> = ({ here, cliffCost, year }) => (
  <details className="explainer">
    <summary>
      <h3 id="cliff-heading">The {PTC_CLIFF_PERCENT * 100}% cliff, back since 2026</h3>
    </summary>
    <div className="explainer-content">
      <p>
        The subsidy goes to a household with income from 100% to 400% of the poverty line.
        Past 400% it is not smaller &mdash; it is gone. For{' '}
        {householdProse(here.householdSize)} the line is{' '}
        <strong>{here.cliffMagi !== null ? formatCurrency(here.cliffMagi) : '—'}</strong>,
        400% of the {formatCurrency(here.povertyLine)} poverty line.
      </p>
      {cliffCost !== null && (
        <p>
          <strong>The dollar over it.</strong> Just under the line you pay 10% of income and
          the subsidy pays the other <strong>{formatCurrency(cliffCost)}</strong>. One dollar
          over, you pay the full {formatCurrency(here.benchmarkAnnual)}. That dollar costs{' '}
          {formatCurrency(cliffCost)}.
          {cliffCost === 0 &&
            ' For this household the figure is zero: your share reaches the full premium before income reaches the line.'}
        </p>
      )}
      <p>
        <strong>Where you are.</strong> At {formatCurrency(Math.round(here.magi))},{' '}
        {formatFpl(here.fplMultiple)} of the poverty line,{' '}
        {here.overCliff
          ? `you are ${formatCurrency(
              Math.round(here.magi - (here.cliffMagi ?? 0)),
            )} over the line: no subsidy this year.`
          : here.headroom !== null
            ? `another ${formatCurrency(
                Math.round(here.headroom),
              )} of income reaches the line, and the dollar after that is the one that costs.`
            : 'there is no line this year.'}
      </p>
      <p>
        <strong>Gone from 2021 to 2025, back in 2026.</strong> For those years there was no
        400% ceiling, and your share was capped at 8.5% of income however high income went.
        That expired at the end of 2025; a three-year extension passed the House in January
        2026 and stalled in the Senate.
      </p>
      <p>
        <strong>The poverty line runs a year behind.</strong> {year} coverage uses the{' '}
        {fplGuidelineYear(year)} guidelines, the ones in force when open enrollment began.
      </p>
    </div>
  </details>
);
