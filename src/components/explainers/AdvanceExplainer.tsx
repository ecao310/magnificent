import type { CoverageYear } from '../../lib/aca';

export interface AdvanceExplainerProps {
  year: CoverageYear;
}

/** The subsidy paid in advance, the settling-up at year end, and the repayment cap that no longer protects an underestimate. */
export const AdvanceExplainer: React.FC<AdvanceExplainerProps> = ({ year }) => (
  <details className="explainer">
    <summary>
      <h3 id="advance-heading">The advance, and the repayment cap that is gone</h3>
    </summary>
    <div className="explainer-content">
      <p>
        <strong>The subsidy is paid on an estimate and settled on the facts.</strong> The
        Marketplace pays it in advance, month by month, on the income the household
        estimated at enrollment. After the year ends it is recomputed on the income the
        household actually had &mdash; that is what Form 8962 does &mdash; and the
        difference is refunded if the estimate was high or repaid if it was low. Income
        the estimate did not have, whenever in the year it arrives, comes out of the
        refund or goes onto the bill.
      </p>
      <p>
        <strong>The cap is gone from {year}.</strong> Through 2025 a household under 400%
        of the line repaid at most a set amount &mdash; $1,625 for one person and $3,250
        for a household between 300% and 400%, less below that &mdash; however far the
        estimate had missed. The One Big Beautiful Bill Act repealed the cap for years
        after 2025, so an advance paid on an underestimate is repaid in full. A
        household that took the subsidy all year on an estimate of $50,000 and then had
        $40,000 more income in December repays every dollar the extra income costs on
        the curve above, and if the income carried it over the line, the whole
        year&apos;s advance.
      </p>
      <p>
        <strong>What that means in practice.</strong> Report the estimate the household
        actually expects, update it on the Marketplace when the picture changes, and
        treat the 400% line as a wall with no cap on the far side of it. The curve
        above is the same whether the subsidy arrives in advance or as a refund; what
        changed is that guessing low no longer makes it cheaper.
      </p>
    </div>
  </details>
);
