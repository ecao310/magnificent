import type { TaxYear } from '../../lib/tax';

export interface ReconciliationExplainerProps {
  year: TaxYear;
}

/** Form 8962, the advance credit it reconciles, and the repayment cap that no longer protects an underestimate. */
export const ReconciliationExplainer: React.FC<ReconciliationExplainerProps> = ({ year }) => (
  <details className="explainer">
    <summary>
      <h3 id="reconciliation-heading">Form 8962, and the repayment cap that is gone</h3>
    </summary>
    <div className="explainer-content">
      <p>
        <strong>The credit is settled on the return.</strong> The Marketplace pays it in
        advance, month by month, on the income the household estimated at enrollment.
        Form 8962 then recomputes it on the income the household actually had, and the
        difference goes on the 1040: a refund if the estimate was high, a repayment if
        it was low. A conversion or a harvest in December is income the estimate did
        not have, and it comes out of the refund or goes onto the bill.
      </p>
      <p>
        <strong>The cap is gone from {year}.</strong> Through 2025 a household under 400%
        of the line repaid at most a set amount &mdash; $1,625 for a single filer and
        $3,250 for anyone else between 300% and 400%, less below that &mdash; however
        far the estimate had missed. The One Big Beautiful Bill Act repealed the cap
        for tax years beginning after 2025, so an advance credit paid on an
        underestimate is repaid in full. A household that took the credit all year on
        an estimate of $50,000 and then converted $40,000 in December repays every
        dollar the extra income costs, and if the conversion carried it over the line,
        the whole year&apos;s advance.
      </p>
      <p>
        <strong>What that means for timing.</strong> The strategy the thread describes
        &mdash; wait until the year&apos;s dividends and gains are known, then fill
        whatever room is left &mdash; still works, and this chart is what the room is
        measured with. What no longer works is guessing low and settling up cheaply.
        Report the estimate the household actually expects, update it on the
        Marketplace when the plan changes, and treat the 400% line as a wall with no
        cap on the far side of it.
      </p>
    </div>
  </details>
);
