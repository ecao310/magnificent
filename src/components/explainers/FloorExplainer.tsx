import { CSR_TIERS, EXPANSION_FLOOR_MULTIPLE } from '../../lib/aca';
import type { PtcAssessment } from '../../lib/aca';
import { formatCurrency, formatFpl } from '../../lib/format';

export interface FloorExplainerProps {
  here: PtcAssessment;
  expansionState: boolean;
}

/** The floor under the subsidy, and the three tiers that step down on the way up. */
export const FloorExplainer: React.FC<FloorExplainerProps> = ({ here, expansionState }) => (
  <details className="explainer">
    <summary>
      <h3 id="floor-heading">The floor, and the cost-sharing tiers</h3>
    </summary>
    <div className="explainer-content">
      <p>
        <strong>The floor.</strong>{' '}
        {expansionState ? (
          <>
            In a state that expanded Medicaid, a household under{' '}
            {formatFpl(EXPANSION_FLOOR_MULTIPLE)} of the poverty line &mdash;{' '}
            {formatCurrency(Math.round(here.floorMagi))} for this one &mdash; is eligible for
            Medicaid, and 36B(c)(2)(B) makes anyone eligible for Medicaid ineligible for
            the subsidy. Medicaid has no premium, so the curve above stops at the floor
            rather than dropping to zero: under it the household is not buying a
            Marketplace plan at all, and whether it wants Medicaid is a different
            question from what it costs.
          </>
        ) : (
          <>
            In a state that did not expand Medicaid the subsidy begins at 100% of the
            poverty line &mdash; {formatCurrency(Math.round(here.floorMagi))} for this
            household &mdash; and under it there is neither a subsidy nor Medicaid: the
            coverage gap, where the curve above sits at the full benchmark. A household
            there has to <em>reach</em> the line, which is the one place on this page
            where more income buys cheaper coverage.
          </>
        )}
      </p>
      <p>
        <strong>The tiers.</strong> Section 1402 of the ACA upgrades a silver plan
        bought under 250% of the line, at no premium: from a plan that covers about 70%
        of costs to one that covers{' '}
        {CSR_TIERS.map((tier) => `${tier.actuarialValue}% under ${formatFpl(tier.upTo)}`).join(
          ', ',
        )}
        . In practice that is a deductible of a few hundred dollars instead of a few
        thousand, and each step is lost whole on the dollar that crosses it. Switch
        them on under <strong>Breakpoints</strong> as violet lines.{' '}
        {here.csrTier
          ? `This household is in the ${here.csrTier.actuarialValue}% tier.`
          : here.belowFloor
            ? 'This household is under the floor.'
            : 'This household is above all three.'}
      </p>
      <p>
        <strong>Why they are lines and not part of the curve.</strong> The premium is
        dollars, and its curve can be drawn. A deductible is worth what the household
        would have spent under it, which depends on how ill anyone gets: a healthy
        couple on the 73% plan loses nothing they would have used, and a couple with
        one hospital stay loses several thousand dollars. So the boundary is drawn and
        the price is left to the reader. For a household that uses its coverage, the
        drop at 200% is often worth more than the slope on either side of it.
      </p>
    </div>
  </details>
);
