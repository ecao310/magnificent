import type { PtcAssessment } from '../../lib/aca';
import { formatFpl, formatPercent } from '../../lib/format';
import { Explainer } from '../../../shared/components/Explainer';

export interface SlopeExplainerProps {
  here: PtcAssessment;
}

/** Marginal against effective: why a single-digit share of income costs more on the next dollar. */
export const SlopeExplainer: React.FC<SlopeExplainerProps> = ({ here }) => (
  <Explainer id="slope-heading" title="Effective and Marginal Rates">
    <p>
      Things like tax rates are often described as <strong>marginal</strong> rates, e.g. a 22% tax
      bracket means earning one more dollar increases taxes by 22&cent;. The corresponding effective
      rate is lower.
    </p>
    <p>
      However, ACA costs are often described as <strong>effective</strong> rates, e.g. an 8% ACA
      cost means 8% of all income is paid as ACA premiums.
    </p>
    <p>
      At <strong>{formatFpl(here.fplMultiple)}</strong> of FPL, this household&rsquo;s effective rate
      is <strong>{formatPercent(here.applicablePercentage)}</strong> and marginal rate is{' '}
      <strong>{formatPercent(here.slope)}</strong>.
    </p>
  </Explainer>
);
