import type { AllInAssessment } from '../../../lib/tax';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../../../lib/format';
import { torpedoLink } from '../../../lib/torpedoLink';
import { Explainer } from '../../../../shared/components/Explainer';

export interface PremiumAsTaxExplainerProps {
  here: AllInAssessment;
}

/** Why the premium is on the same side of the ledger as the tax. */
export const PremiumAsTaxExplainer: React.FC<PremiumAsTaxExplainerProps> = ({ here }) => {
  const { ptc } = here;
  return (
    <Explainer id="premium-as-tax-heading" title="Effective Rate">
        <p>
          At {formatCurrency(Math.round(here.magi))}{' '}
          the next dollar costs <strong>{formatCents(here.incomeTaxSlope)}</strong> in income
          tax and <strong>{formatCents(here.premiumSlope)}</strong> in subsidy given back:{' '}
          <strong>{formatCents(here.allInSlope)}</strong> together. In the
          middle of the table, ACA premiums are more expensive than the income tax.
        </p>
        <p>
          The dollar that crosses the line costs the whole subsidy at once,{' '}
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
          .
        </p>
        <p>
          The rate on the chart is the <strong>effective</strong> rate &mdash; everything paid,
          divided by everything earned. At{' '}
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
        <p>
          <strong>The same shape comes back with Social Security.</strong> Once a household is
          on Medicare the subsidy is gone, and another phase-in takes its place: the share of a
          Social Security benefit that is taxed rises with other income, so the income tax on the
          next dollar climbs and then falls.{' '}
          <a href={torpedoLink(here.filingStatus)}>Income Tax in Retirement</a> draws that curve
          for {here.filingStatus === 'mfj' ? 'a joint return' : 'a single return'}.
        </p>
      </Explainer>
  );
};
