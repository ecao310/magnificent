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
  <Explainer id="floor-heading" title="The Medicaid line">
      {expansionState ? (
        <p>
          <strong>The Medicaid line.</strong> In a state that expanded Medicaid, a household
          under {formatFpl(EXPANSION_FLOOR_MULTIPLE)} of the poverty line &mdash;{' '}
          {formatCurrency(Math.round(here.floorMagi))} for this one &mdash; gets Medicaid, and
          anyone eligible for Medicaid gets no subsidy. Medicaid has no premium, so the chart
          is blank below the line.
        </p>
      ) : (
        <p>
          <strong>The 100% line.</strong> In a state that did not expand Medicaid the subsidy
          starts at 100% of the poverty line &mdash;{' '}
          {formatCurrency(Math.round(here.floorMagi))} for this household. Under it there is
          no subsidy and no Medicaid: the coverage gap, where you pay the full premium.
        </p>
      )}
    </Explainer>
);
