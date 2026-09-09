import type { Adults, CoverageYear, StateCode } from '../../lib/aca';
import { FILING_STATUS_PROSE } from '../../lib/tax';
import type { AllInAssessment } from '../../lib/tax';
import { formatAxisPercent, formatCents, formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdPhrase } from '../../lib/householdProse';
import type { CopyState } from '../../hooks/useScenarioAddress';
import { ShareLink } from '../ShareLink';

export interface RateAnswerProps {
  year: CoverageYear;
  adults: Adults;
  ages: number[];
  state: StateCode | null;
  income: number;
  here: AllInAssessment;
  canCopy: boolean;
  copyState: CopyState;
  onCopy: () => void;
}

/**
 * The four figures the page is for, at the income the marker is standing
 * on: the rate all in, the income tax in it, what the next dollar costs in
 * tax and subsidy together, and the premium in it.
 */
export const RateAnswer: React.FC<RateAnswerProps> = ({
  year,
  adults,
  ages,
  state,
  income,
  here,
  canCopy,
  copyState,
  onCopy,
}) => {
  const { ptc } = here;
  const monthly = here.premium === null ? null : Math.round(here.premium / 12);

  const premiumGloss =
    here.premium === null || here.premiumShare === null
      ? ''
      : ptc.overCliff
        ? `${formatPercent(here.premiumShare)} of income: the full premium, over the 400% line.`
        : ptc.credit === 0
          ? `${formatPercent(here.premiumShare)} of income: your share already covers the full premium.`
          : `${formatPercent(here.premiumShare)} of income after a subsidy of ${formatCurrency(
              Math.round(ptc.credit / 12),
            )}/mo.`;

  return (
    <section className="answer" id="answer" aria-labelledby="answer-heading">
      <h2 className="answer-heading" id="answer-heading">
        Your numbers at {formatCurrency(income)}
      </h2>
      <p className="answer-subline">
        {formatFpl(ptc.fplMultiple)} of the poverty line · {householdPhrase(adults, ages, state)} ·{' '}
        {FILING_STATUS_PROSE[here.filingStatus]} · {year}
      </p>

      <dl className="answer-figures">
        <div className="answer-figure">
          <dt>All in</dt>
          <dd>
            {here.allIn === null || here.allInShare === null ? (
              <>
                <strong>{formatPercent(here.incomeTaxShare)}</strong>
                <span className="answer-of">of income, tax alone</span>
                <span className="answer-gloss">
                  {ptc.floorMultiple > 1
                    ? 'Under the Medicaid line: no premium to add.'
                    : 'Under 100% of the poverty line: no subsidy, and no Medicaid.'}
                </span>
              </>
            ) : (
              <>
                <strong>{formatPercent(here.allInShare)}</strong>
                <span className="answer-of">of income</span>
                <span className="answer-gloss">
                  {formatCurrency(Math.round(here.allIn))} for the year:{' '}
                  {formatCurrency(Math.round(here.incomeTax))} in income tax and{' '}
                  {formatCurrency(Math.round(here.premium ?? 0))} for the plan.
                </span>
              </>
            )}
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Federal income tax</dt>
          <dd>
            <strong>{formatCurrency(Math.round(here.incomeTax))}</strong>
            <span className="answer-of">for the year</span>
            <span className="answer-gloss">
              {formatPercent(here.incomeTaxShare)} of income
              {here.taxableIncome === 0
                ? `: the ${formatCurrency(here.standardDeduction)} standard deduction covers it all.`
                : `, on ${formatCurrency(here.taxableIncome)} after the ${formatCurrency(
                    here.standardDeduction,
                  )} standard deduction; the last dollar is in the ${formatAxisPercent(
                    here.bracketRate,
                  )} bracket${
                    here.childTaxCredit > 0
                      ? `, and ${formatCurrency(Math.round(here.childTaxCredit))} of child tax credit is taken off`
                      : ''
                  }.`}
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Each extra $1 of income costs</dt>
          <dd>
            <strong>{formatCents(here.allInSlope)}</strong>
            <span className="answer-of">of tax and subsidy</span>
            <span className="answer-gloss">
              {formatCents(here.incomeTaxSlope)} in income tax
              {here.premiumSlope > 0
                ? ` and ${formatCents(here.premiumSlope)} of subsidy given back.`
                : ptc.overCliff
                  ? '; no subsidy left to lose.'
                  : ptc.belowFloor
                    ? '; no subsidy yet to lose.'
                    : '; the subsidy is already gone.'}
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Premium after subsidy</dt>
          <dd>
            {monthly === null ? (
              <>
                <strong>{ptc.floorMultiple > 1 ? 'Medicaid' : 'None'}</strong>
                <span className="answer-gloss">
                  {ptc.floorMultiple > 1
                    ? 'No Marketplace premium under the Medicaid line.'
                    : `No subsidy under 100% of the poverty line; the full premium would be ${formatCurrency(
                        ptc.benchmarkMonthly,
                      )}/mo.`}
                </span>
              </>
            ) : (
              <>
                <strong>{formatCurrency(monthly)}</strong>
                <span className="answer-of">/mo</span>
                <span className="answer-gloss">{premiumGloss}</span>
              </>
            )}
          </dd>
        </div>
      </dl>

      <ShareLink canCopy={canCopy} copyState={copyState} onCopy={onCopy} />
    </section>
  );
};
