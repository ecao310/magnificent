import { FPL_YEAR_PARAMS } from '../../lib/aca';
import type { CoverageYear, PtcAssessment } from '../../lib/aca';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { Explainer } from '../../../shared/components/Explainer';

export interface SlopeExplainerProps {
  here: PtcAssessment;
  year: CoverageYear;
}

/** Why a single-digit share of income costs double digits on the next dollar, at your own point. */
export const SlopeExplainer: React.FC<SlopeExplainerProps> = ({ here, year }) => {
  const { table } = FPL_YEAR_PARAMS[year];
  const band = table.find((b) => here.fplMultiple >= b.from && here.fplMultiple < b.to);
  const rise = band && Number.isFinite(band.to) ? band.final - band.initial : 0;
  const width = band && Number.isFinite(band.to) ? (band.to - band.from) * here.povertyLine : 0;
  const fromRise = width > 0 ? (here.magi * rise) / width : 0;
  const onSlope = !here.belowFloor && !here.overCliff && here.credit > 0;
  return (
    <Explainer id="slope-heading" title="The slope: why 8% of income costs 17% of the next dollar">
        <p>
          When your income rises by a dollar, two things move. You are a dollar further up
          the band, so your <strong>share</strong> is a little higher &mdash; and that share
          now applies to a dollar <strong>more income</strong>. What you pay rises by the sum
          of the two; the subsidy falls by the same amount.
        </p>
        {onSlope && band ? (
          <p>
            <strong>At {formatFpl(here.fplMultiple)}.</strong> Your share is{' '}
            {formatPercent(here.applicablePercentage)}, so the next dollar costs{' '}
            {formatCents(here.applicablePercentage)} outright.{' '}
            {rise > 0 ? (
              <>
                In this band the share climbs {formatPercent(rise)} across{' '}
                {formatCurrency(width)} of income; applied to the{' '}
                {formatCurrency(Math.round(here.magi))} already there, that climb costs
                another {formatCents(fromRise)}. Together:{' '}
                <strong>{formatCents(here.slope)}</strong> on the dollar.
              </>
            ) : (
              <>
                In this band the share is flat at {formatPercent(band.initial)}, so that is
                the whole of it: <strong>{formatCents(here.slope)}</strong> on the dollar.
              </>
            )}
          </p>
        ) : (
          <p>
            <strong>Not on the slope.</strong>{' '}
            {here.belowFloor
              ? 'Under the Medicaid line there is no subsidy to lose.'
              : here.overCliff
                ? 'Over the 400% line the subsidy is already gone.'
                : 'Your share already covers the full premium, so there is no subsidy left to lose.'}
          </p>
        )}
      </Explainer>
  );
};
