import { PTC_CLIFF_PERCENT, applicablePercentage, fplGuidelineYear } from '../../lib/aca';
import type { CoverageYear, PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl } from '../../lib/format';
import { householdProse } from '../../lib/householdProse';
import { Explainer } from '../../../shared/components/Explainer';

export interface CliffExplainerProps {
  here: PtcAssessment;
  /** What the dollar past the line costs this household, or null in a year without a line. */
  cliffCost: number | null;
  /**
   * The income at which the household's share reaches the full premium under
   * the line, or null where the credit lasts to the line. Not null exactly
   * when `cliffCost` is zero: the two are the same fact from either end.
   */
  runsOutMagi: number | null;
  year: CoverageYear;
}

/** The 400% line: back since 2026, and priced in dollars for this household. */
export const CliffExplainer: React.FC<CliffExplainerProps> = ({
  here,
  cliffCost,
  runsOutMagi,
  year,
}) => {
  const magi = Math.round(here.magi);
  const cliffMagi = here.cliffMagi ?? 0;
  /** The household's share of income at the line itself: what the premium has to exceed for the line to cost anything. */
  const shareAtLine = applicablePercentage(PTC_CLIFF_PERCENT, year) * cliffMagi;
  const whereYouAre = here.overCliff
    ? runsOutMagi === null
      ? `you are ${formatCurrency(magi - cliffMagi)} over the line: no subsidy this year.`
      : `you are ${formatCurrency(magi - cliffMagi)} over the line, and the subsidy had run out at ${formatCurrency(
          runsOutMagi,
        )} anyway: no subsidy this year.`
    : here.headroom === null
      ? 'there is no line this year.'
      : runsOutMagi === null
        ? `another ${formatCurrency(Math.round(here.headroom))} of income reaches the line, and the dollar after that is the one that costs.`
        : magi < runsOutMagi
          ? `another ${formatCurrency(runsOutMagi - magi)} of income and your share covers the full premium; the line, ${formatCurrency(
              Math.round(here.headroom),
            )} away, then costs nothing to cross.`
          : `your share already covers the full premium; the line, another ${formatCurrency(
              Math.round(here.headroom),
            )} away, costs nothing to cross.`;
  return (
    <Explainer id="cliff-heading" title={<>The {PTC_CLIFF_PERCENT * 100}% cliff, back since 2026</>}>
        <p>
          The subsidy goes to a household with income from 100% to 400% of the poverty line.
          Past 400% it is not smaller &mdash; it is gone. For{' '}
          {householdProse(here.householdSize)} the line is{' '}
          <strong>{here.cliffMagi !== null ? formatCurrency(here.cliffMagi) : '—'}</strong>,
          400% of the {formatCurrency(here.povertyLine)} poverty line.
        </p>
        {cliffCost !== null && cliffCost > 0 && (
          <p>
            <strong>The dollar over it.</strong> Just under the line you pay 10% of income and
            the subsidy pays the other <strong>{formatCurrency(cliffCost)}</strong>. One dollar
            over, you pay the full {formatCurrency(here.benchmarkAnnual)}. Earning an extra $1
            actually loses you {formatCurrency(cliffCost - 1)}.
          </p>
        )}
        {runsOutMagi !== null && (
          <p>
            <strong>The dollar over it costs this household nothing.</strong> Your share of
            income reaches the full {formatCurrency(here.benchmarkAnnual)} premium at{' '}
            <strong>{formatCurrency(runsOutMagi)}</strong>, {formatFpl(runsOutMagi / here.povertyLine)}{' '}
            of the poverty line, so the subsidy is already gone before income reaches the
            line. At the line the share is 10% of income, {formatCurrency(Math.round(shareAtLine))};
            the line only bites a household whose premium is more than that &mdash; older,
            larger, or in a pricier state.
          </p>
        )}
        <p>
          <strong>Where you are.</strong> At {formatCurrency(magi)},{' '}
          {formatFpl(here.fplMultiple)} of the poverty line, {whereYouAre}
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
      </Explainer>
  );
};
