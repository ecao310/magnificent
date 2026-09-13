import type { Adults, CoverageYear, StateCode } from '../../lib/aca';
import { FILING_STATUS_PROSE } from '../../lib/tax';
import type { AllInAssessment } from '../../lib/tax';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../../lib/format';
import { householdPhrase } from '../../lib/householdProse';
import { Answer as Figures, Figure } from '../../../shared/components/Answer';
import type { ShareLinkProps } from '../../../shared/components/ShareLink';

export interface RateAnswerProps {
  year: CoverageYear;
  adults: Adults;
  ages: number[];
  state: StateCode | null;
  income: number;
  here: AllInAssessment;
  /** The button that sends the household as a link. */
  share: ShareLinkProps;
}

/**
 * The four figures under the rate chart, at the income the marker is
 * standing on: the rate all in, the income tax in it, what the next dollar
 * costs in tax and subsidy together, and the premium's share of income.
 *
 * The premium is a share here rather than the monthly figure the cost
 * chart's block gives: this block is about what the rate is made of, and
 * the figure that answers that is the share. The monthly figure is in the
 * gloss under it.
 */
export const RateAnswer: React.FC<RateAnswerProps> = ({
  year,
  adults,
  ages,
  state,
  income,
  here,
  share,
}) => {
  const { ptc } = here;
  const monthly = here.premium === null ? null : Math.round(here.premium / 12);

  const premiumGloss =
    monthly === null
      ? ''
      : ptc.overCliff
        ? `${formatCurrency(monthly)}/mo: the full premium, over the 400% line.`
        : ptc.credit === 0
          ? `${formatCurrency(monthly)}/mo: your share already covers the full premium.`
          : `${formatCurrency(monthly)}/mo, ${formatCurrency(
            Math.round(here.premium ?? 0),
          )} a year, after a subsidy of ${formatCurrency(Math.round(ptc.credit / 12))}/mo.`;

  return (
    <Figures
      heading={<>Your numbers at {formatCurrency(income)}</>}
      subline={
        <>
          {formatFpl(ptc.fplMultiple)} of the poverty line · {householdPhrase(adults, ages, state)} ·{' '}
          {FILING_STATUS_PROSE[here.filingStatus]} · {year}
        </>
      }
      share={share}
    >
      {here.allIn === null || here.allInShare === null ? (
        <Figure
          label="All in"
          value={formatPercent(here.incomeTaxShare)}
          of="of income, tax alone"
          gloss={
            ptc.floorMultiple > 1
              ? 'Under the Medicaid line: no premium to add.'
              : 'Under 100% of the poverty line: no subsidy, and no Medicaid.'
          }
        />
      ) : (
        <Figure
          label="All in"
          value={formatPercent(here.allInShare)}
          of="of income"
          gloss={
            <>
              {formatCurrency(Math.round(here.allIn))} for the year:{' '}
              {formatCurrency(Math.round(here.incomeTax))} in income tax and{' '}
              {formatCurrency(Math.round(here.premium ?? 0))} for the plan.
            </>
          }
        />
      )}

      <Figure
        label="Federal income tax"
        value={formatCurrency(Math.round(here.incomeTax))}
        of="for the year"
        gloss={`${formatPercent(here.incomeTaxShare)} of income.`}
      />

      <Figure
        label="Each extra $1 of income costs"
        value={formatCents(here.allInSlope)}
        of="of tax and subsidy"
        gloss={
          <>
            {formatCents(here.incomeTaxSlope)} in income tax
            {here.premiumSlope > 0
              ? ` and ${formatCents(here.premiumSlope)} of subsidy given back.`
              : ptc.overCliff
                ? '; no subsidy left to lose.'
                : ptc.belowFloor
                  ? '; no subsidy yet to lose.'
                  : '; the subsidy is already gone.'}
          </>
        }
      />

      {monthly === null || here.premiumShare === null ? (
        <Figure
          label="The plan’s share of income"
          value={ptc.floorMultiple > 1 ? 'Medicaid' : 'None'}
          gloss={
            ptc.floorMultiple > 1
              ? 'No Marketplace premium under the Medicaid line.'
              : `No subsidy under 100% of the poverty line; the full premium would be ${formatCurrency(
                ptc.benchmarkMonthly,
              )}/mo.`
          }
        />
      ) : (
        <Figure
          label="The plan’s share of income"
          value={formatPercent(here.premiumShare)}
          of="of income"
          gloss={premiumGloss}
        />
      )}
    </Figures>
  );
};
