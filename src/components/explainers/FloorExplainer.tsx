import { EXPANSION_FLOOR_MULTIPLE } from '../../lib/aca';
import type { PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl } from '../../lib/format';

export interface FloorExplainerProps {
  here: PtcAssessment;
  expansionState: boolean;
}

/** Where the subsidy starts, and the three tiers that step down on the way up. */
export const FloorExplainer: React.FC<FloorExplainerProps> = ({ here, expansionState }) => (
  <details className="explainer">
    <summary>
      <h3 id="floor-heading">The Medicaid line and the cost-sharing tiers</h3>
    </summary>
    <div className="explainer-content">
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
      <p>
        <strong>The tiers.</strong> Under 250% of the line a silver plan is upgraded at no
        extra premium, from covering about 70% of costs to 94% under 150%, 87% under 200%,
        73% under 250% &mdash; a deductible of a few hundred dollars instead of a few
        thousand. Each step is lost whole on the dollar that crosses it; for a household
        that uses its coverage, the step at 200% can be worth more than the slope around
        it.{' '}
        {here.csrTier
          ? `You are in the ${here.csrTier.actuarialValue}% tier.`
          : here.belowFloor
            ? expansionState
              ? 'You are under the Medicaid line.'
              : 'You are under 100% of the poverty line.'
            : 'You are above all three.'}
      </p>
    </div>
  </details>
);
