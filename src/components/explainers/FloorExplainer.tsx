import { CSR_TIERS, EXPANSION_FLOOR_MULTIPLE } from '../../lib/tax';
import type { PtcAssessment } from '../../lib/tax';
import { formatCurrency, formatFpl } from '../../lib/format';

export interface FloorExplainerProps {
  here: PtcAssessment;
  expansionState: boolean;
}

/** The floor under the credit, and the three tiers that step down on the way up. */
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
            the credit. Medicaid has no premium, so in pure dollars it is cheaper still;
            whether a household wants it is a different question, and one this page
            does not price. What it draws is the line, because a household managing its
            income to the credit needs to know where the credit begins.
          </>
        ) : (
          <>
            In a state that did not expand Medicaid the credit begins at 100% of the
            poverty line &mdash; {formatCurrency(Math.round(here.floorMagi))} for this
            household &mdash; and under it there is neither a credit nor Medicaid: the
            coverage gap. A household there has to <em>reach</em> the line, which is the
            one place on this page where more income buys more coverage.
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
        <strong>Why they are lines and not part of the curve.</strong> The credit is
        dollars, and its slope can be drawn. A deductible is worth what the household
        would have spent under it, which depends on how ill anyone gets: a healthy
        couple on the 73% plan loses nothing they would have used, and a couple with
        one hospital stay loses several thousand dollars. So the boundary is drawn and
        the price is left to the reader, who knows the household&apos;s health and
        this page does not. For a household that uses its coverage, the drop at 200%
        is often worth more than the credit slope on either side of it.
      </p>
    </div>
  </details>
);
