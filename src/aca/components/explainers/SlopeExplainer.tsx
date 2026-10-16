import type { PtcAssessment } from '../../lib/aca';
import { formatFpl, formatPercent } from '../../lib/format';
import { Explainer } from '../../../shared/components/Explainer';

export interface SlopeExplainerProps {
  here: PtcAssessment;
}

/**
 * Marginal against effective: why a single-digit share of income costs more on
 * the next dollar. On the slope the effective rate is the table's percentage,
 * which is what the household pays; past the 400% line the table no longer
 * applies and it is the whole premium as a share of income.
 */
export const SlopeExplainer: React.FC<SlopeExplainerProps> = ({ here }) => {
  const premiumShare =
    here.netPremiumAnnual === null || here.magi <= 0 ? null : here.netPremiumAnnual / here.magi;
  const effectiveRate = here.credit > 0 ? here.applicablePercentage : premiumShare;
  return (
    <Explainer id="slope-heading" title="Effective and Marginal Rates">
      <p>
        Things like tax rates are often described as <strong>marginal</strong> rates, e.g. a 22% tax
        bracket means earning one more dollar increases taxes by 22&cent;. The corresponding
        effective rate is lower.
      </p>
      <p>
        However, ACA costs are often described as <strong>effective</strong> rates, e.g. an 8% ACA
        cost means 8% of all income is paid as ACA premiums.
      </p>
      {effectiveRate !== null ? (
        <p>
          At <strong>{formatFpl(here.fplMultiple)}</strong> of FPL, this household&rsquo;s effective
          rate is <strong>{formatPercent(effectiveRate)}</strong>
          {!here.overCliff && (
            <>
              {' '}
              and marginal rate is <strong>{formatPercent(here.slope)}</strong>
            </>
          )}
          .
        </p>
      ) : here.floorMultiple > 1 ? (
        <p>
          At <strong>{formatFpl(here.fplMultiple)}</strong> of FPL this household is on Medicaid,
          which has no premium: there is no ACA cost to rate.
        </p>
      ) : (
        <p>
          At <strong>{formatFpl(here.fplMultiple)}</strong> of FPL there is no subsidy, so the next
          dollar of income costs nothing.
        </p>
      )}
    </Explainer>
  );
};
