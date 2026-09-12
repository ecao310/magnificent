import type { CoverageYear } from '../../../lib/aca';
import { TAX_YEAR_PARAMS } from '../../../lib/tax';
import type { AllInAssessment } from '../../../lib/tax';
import { FILING_STATUS_PROSE } from '../../../lib/tax';
import { formatCurrency, formatPercent } from '../../../lib/format';

export interface RateExplainerProps {
  here: AllInAssessment;
  year: CoverageYear;
}

/** How the rate is figured: the return, the premium, and the two added up at the reader's own income. */
export const RateExplainer: React.FC<RateExplainerProps> = ({ here, year }) => {
  const { perChild, phaseoutStart } = TAX_YEAR_PARAMS[year].childTaxCredit;
  const { ptc } = here;
  return (
    <details className="explainer">
      <summary>
        <h3 id="rate-heading">How the rate is figured</h3>
      </summary>
      <div className="explainer-content">
        <p>
          Everyone on the return&rsquo;s income before
          any deduction, called modified adjusted gross income (MAGI).
        </p>
        <p>
          <strong>Federal income tax. </strong>
          Standard deduction and the child tax credit. This household is {FILING_STATUS_PROSE[here.filingStatus]}, so the
          standard deduction is <strong>{formatCurrency(here.standardDeduction)}</strong>;{' '}
          {formatCurrency(Math.round(here.magi))} of income leaves{' '}
          <strong>{formatCurrency(here.taxableIncome)}</strong> taxable, which the schedule
          taxes at {formatCurrency(Math.round(here.bracketTax))}
          {here.childTaxCredit > 0 && (
            <>
              , less {formatCurrency(Math.round(here.childTaxCredit))} of child tax credit
            </>
          )}
          : <strong>{formatCurrency(Math.round(here.incomeTax))}</strong>,{' '}
          {formatPercent(here.incomeTaxShare)} of income.
        </p>
        <p>
          The child tax credit is {formatCurrency(perChild)} for each child, and shrinks by
          five cents for every dollar of income over{' '}
          {formatCurrency(phaseoutStart[here.filingStatus])}. Every child on the plan is
          taken to qualify.
        </p>
        <p>
          <strong>The premium. </strong> What the household
          pays for the benchmark plan after the subsidy, which under the 400% line is a set
          share of income from the year&rsquo;s table and over it is the whole premium. Here
          it is{' '}
          {here.premium === null || here.premiumShare === null ? (
            <>
              nothing &mdash;{' '}
              {ptc.floorMultiple > 1
                ? 'this income is under the Medicaid line, where there is no Marketplace premium'
                : 'this income is under the poverty line in a state that did not expand Medicaid, and the full premium is left unpriced'}
            </>
          ) : (
            <>
              <strong>{formatCurrency(Math.round(here.premium))}</strong> a year,{' '}
              {formatPercent(here.premiumShare)} of income
            </>
          )}
          .
        </p>
        {here.allIn !== null && here.allInShare !== null && (
          <p>
            <strong>All in:</strong> {formatCurrency(Math.round(here.incomeTax))} and{' '}
            {formatCurrency(Math.round(here.premium ?? 0))} make{' '}
            {formatCurrency(Math.round(here.allIn))} on {formatCurrency(Math.round(here.magi))}
            , which is <strong>{formatPercent(here.allInShare)}</strong>.
          </p>
        )}
      </div>
    </details>
  );
};
