import type { AllInAssessment } from '../../../lib/tax';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../../../lib/format';

export interface PremiumAsTaxExplainerProps {
  here: AllInAssessment;
}

/** Why the premium is on the same side of the ledger as the tax. */
export const PremiumAsTaxExplainer: React.FC<PremiumAsTaxExplainerProps> = ({ here }) => {
  const { ptc } = here;
  return (
    <details className="explainer">
      <summary>
        <h3 id="premium-as-tax-heading">Why the premium counts as a tax</h3>
      </summary>
      <div className="explainer-content">
        <p>
          Under the 400% line the subsidy does not pay a fixed sum toward the plan; it pays
          whatever the benchmark costs over a set share of your income. The share is set by
          law, it rises with income, and every extra dollar you earn gives some of the
          subsidy back. What you pay for the plan is therefore a percentage of income that
          the statute sets and the return settles &mdash; the subsidy is reconciled on Form
          8962, with the rest of the return &mdash; and a percentage of income set by law
          and collected through the return is a tax in everything but the name.
        </p>
        <p>
          It has a marginal rate like one, too. At {formatCurrency(Math.round(here.magi))}{' '}
          the next dollar costs <strong>{formatCents(here.incomeTaxSlope)}</strong> in income
          tax and <strong>{formatCents(here.premiumSlope)}</strong> in subsidy given back:{' '}
          <strong>{formatCents(here.allInSlope)}</strong> together. The income tax side is the
          bracket; the subsidy side is the slope the cost page is named for, and in the
          middle of the table it is bigger than the bracket.
        </p>
        <p>
          Two things it does that an income tax does not. It stops: over the 400% line the
          premium is the whole premium, so the share of income it takes falls as income
          rises, which is why the line on the chart slopes down after the jump. And it
          jumps: the dollar that crosses the line costs the whole subsidy at once,{' '}
          {ptc.cliffMagi !== null && ptc.headroom !== null && ptc.headroom > 0 ? (
            <>
              which for this household is {formatCurrency(Math.round(ptc.headroom))} away, at{' '}
              {formatCurrency(ptc.cliffMagi)}
            </>
          ) : ptc.overCliff ? (
            <>which this household has already crossed</>
          ) : (
            <>which in {ptc.cliffApplies ? 'this year' : 'this year does not happen'}</>
          )}
          . No bracket does that.
        </p>
        <p>
          The rate on the chart is the <strong>average</strong> rate &mdash; everything paid,
          divided by everything earned &mdash; which is the figure a household feels. At{' '}
          {formatFpl(ptc.fplMultiple)} of the poverty line this one is{' '}
          {here.allInShare === null ? (
            <>{formatPercent(here.incomeTaxShare)} of income, all of it income tax</>
          ) : (
            <>
              <strong>{formatPercent(here.allInShare)}</strong>, of which{' '}
              {formatPercent(here.premiumShare ?? 0)} is the plan
            </>
          )}
          .
        </p>
      </div>
    </details>
  );
};
