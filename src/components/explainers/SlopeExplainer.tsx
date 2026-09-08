import { FPL_YEAR_PARAMS } from '../../lib/aca';
import type { CoverageYear, PtcAssessment } from '../../lib/aca';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../../lib/format';

export interface SlopeExplainerProps {
  here: PtcAssessment;
  year: CoverageYear;
}

/** Why a single-digit share of income becomes a double-digit cost on the next dollar, derived at the reader's own point. */
export const SlopeExplainer: React.FC<SlopeExplainerProps> = ({ here, year }) => {
  const { table } = FPL_YEAR_PARAMS[year];
  const band = table.find((b) => here.fplMultiple >= b.from && here.fplMultiple < b.to);
  const rise = band && Number.isFinite(band.to) ? band.final - band.initial : 0;
  const width = band && Number.isFinite(band.to) ? (band.to - band.from) * here.povertyLine : 0;
  const fromPercentage = here.applicablePercentage;
  const fromRise = width > 0 ? (here.magi * rise) / width : 0;
  const onSlope = !here.belowFloor && !here.overCliff && here.credit > 0;
  return (
    <details className="explainer">
      <summary>
        <h3 id="slope-heading">The slope: why 8% of income becomes 17% of the next dollar</h3>
      </summary>
      <div className="explainer-content">
        <p>
          Two things move when household income rises by a dollar. The household is a
          dollar further up its band, so the <strong>percentage</strong> it owes is a
          little higher &mdash; and that percentage now applies to a dollar{' '}
          <strong>more income</strong>. What the household pays rises by the sum of the
          two, and the subsidy falls by exactly that much. That sum is the steepness of
          the curve above.
        </p>
        {onSlope && band ? (
          <p>
            <strong>At this household&apos;s {formatFpl(here.fplMultiple)}.</strong> The
            percentage is {formatPercent(fromPercentage)}, so the next dollar of income
            costs {formatCents(fromPercentage)} of it outright.{' '}
            {rise > 0 ? (
              <>
                In this band the percentage climbs {formatPercent(rise)} across{' '}
                {formatCurrency(width)} of income, and applied to the{' '}
                {formatCurrency(Math.round(here.magi))} already there that climb costs
                another {formatCents(fromRise)}. Together:{' '}
                <strong>{formatCents(here.slope)}</strong> on the dollar.
              </>
            ) : (
              <>
                In this band the percentage does not climb &mdash; it is flat at{' '}
                {formatPercent(band.initial)} &mdash; so that is the whole of it:{' '}
                <strong>{formatCents(here.slope)}</strong> on the dollar.
              </>
            )}
          </p>
        ) : (
          <p>
            <strong>This household is not on the slope.</strong>{' '}
            {here.belowFloor
              ? 'Under the floor there is no subsidy to give back, so the next dollar costs nothing in subsidy.'
              : here.overCliff
                ? 'Over the 400% line the subsidy is already gone, so the next dollar costs nothing more.'
                : 'Its share already covers the whole benchmark, so there is no subsidy left to lose.'}{' '}
            Move the slider under the chart and the figures in this note follow it.
          </p>
        )}
        <p>
          <strong>The shape.</strong> Because the second term grows with income and
          resets at the top of each band, the cost of the next dollar is a sawtooth: it
          climbs through each band and drops back at the boundary. On the {year} table
          for a couple it runs from about 11 cents at 150% of the line to 16 cents at
          200%, drops to 14, climbs to nearly 18 by 250%, drops to 16, climbs to 19 by
          300% &mdash; and then falls to a flat 9.96 cents, because from 300% to 400% the
          percentage stops rising. The cheapest place on the slope to add a dollar is the
          top of it, and the dearest is the dollar just before 300%. On the chart these
          are the kinks in the curve: it steepens through each band and eases at each
          boundary.
        </p>
        <p>
          <strong>What that means for a decision.</strong> Anything that raises household
          income by a dollar &mdash; a withdrawal, a conversion, a realised gain, a bonus,
          a second job &mdash; hands back that many cents of subsidy on top of whatever
          else it costs. A household deciding how much of something to take in a year
          can read the price of each extra dollar straight off this slope, and the price
          of the last one straight off the cliff.
        </p>
      </div>
    </details>
  );
};
