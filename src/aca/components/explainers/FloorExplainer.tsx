import { EXPANSION_FLOOR_MULTIPLE } from '../../lib/aca';
import type { PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl } from '../../lib/format';
import { Explainer } from '../../../shared/components/Explainer';

export interface FloorExplainerProps {
  here: PtcAssessment;
  expansionState: boolean;
}

/** Where the subsidy starts. */
export const FloorExplainer: React.FC<FloorExplainerProps> = ({ here, expansionState }) => (
  <Explainer id="floor-heading" title="Medicaid">
    {expansionState ? (
      <p>
        In states that expanded Medicaid, a household under{' '}
        <strong>{formatFpl(EXPANSION_FLOOR_MULTIPLE)}</strong> of the poverty line qualifies for
        Medicaid, which has no premium.
      </p>
    ) : (
      <p>
        <strong>The 100% line.</strong> In a state that did not expand Medicaid the subsidy starts
        at 100% of the poverty line &mdash;{' '}
        {formatCurrency(Math.round(here.floorMagi))} for this household. Under it there is no
        subsidy and no Medicaid: the coverage gap, where you pay the full premium.
      </p>
    )}
  </Explainer>
);
