import { IRMAA_LOOKBACK_YEARS } from '../lib/tax';
import type { FilingStatus, IrmaaAssessment, TaxYear } from '../lib/tax';
import { formatCurrency, formatPercent } from '../lib/format';
import { FILING_STATUS_PROSE } from '../lib/returnProse';
import { Answer as Figures, Figure } from '../../shared/components/Answer';
import type { ShareLinkProps } from '../../shared/components/ShareLink';

export interface AnswerProps {
  year: TaxYear;
  filingStatus: FilingStatus;
  ageProse: string;
  ssBenefit: number;
  ordinaryIncome: number;
  muniInterest: number;
  totalIncome: number;
  /** The year's federal tax at the reader's own point on the curve. */
  tax: number;
  /** The rate on the next dollar there, or null below the curve's first sample. */
  marginalRate: number | null;
  /** How much of the benefit 86(a) actually taxes. */
  taxableSS: number;
  irmaa: IrmaaAssessment;
  /** The button that sends the return as a link. */
  share: ShareLinkProps;
}

/**
 * The six figures the page is for, at the income the marker is standing on:
 * the total, the tax, the two rates, how much of the benefit is taxable, and
 * the Medicare tier.
 *
 * The mirror of the recap that closes the rail. That one names what was set;
 * this one says what came of it — and it is the first place the six figures a
 * reader actually leaves with sit together. The status line above them
 * restates the return, so a screenshot of the answer carries its question.
 */
export const Answer: React.FC<AnswerProps> = ({
  year,
  filingStatus,
  ageProse,
  ssBenefit,
  ordinaryIncome,
  muniInterest,
  totalIncome,
  tax,
  marginalRate,
  taxableSS,
  irmaa,
  share,
}) => (
  <Figures
    heading="What this return costs"
    subline={
      <>
        {year} return · {FILING_STATUS_PROSE[filingStatus]} · {ageProse} ·{' '}
        {ssBenefit > 0
          ? `${formatCurrency(ssBenefit)} of Social Security`
          : 'no Social Security'}{' '}
        · {formatCurrency(ordinaryIncome)} of other income
        {muniInterest > 0
          ? ` · ${formatCurrency(muniInterest)} of tax-exempt interest`
          : ''}
      </>
    }
    share={share}
  >
    <Figure
      label="Total income"
      value={formatCurrency(totalIncome)}
      gloss={
        <>
          Social security plus other income.
        </>
      }
    />

    <Figure
      label="Federal tax"
      value={formatCurrency(tax)}
      gloss={<>What this {year} return owes.</>}
    />

    <Figure
      label="Effective rate"
      value={totalIncome > 0 ? formatPercent(tax / totalIncome) : '—'}
      gloss={
        totalIncome > 0
          ? 'Percentage of total income paid in tax.'
          : 'No tax on no income.'
      }
    />

    <Figure
      label="Marginal rate"
      value={marginalRate !== null ? `${marginalRate}%` : '—'}
      gloss="What one more dollar of ordinary income costs."
    />

    <Figure
      label="Taxable social security"
      value={ssBenefit > 0 ? formatCurrency(taxableSS) : 'None'}
      of={ssBenefit > 0 ? `of ${formatCurrency(ssBenefit)}` : undefined}
      gloss={
        ssBenefit > 0
          ? `${formatPercent(taxableSS / ssBenefit)} of it. 86(a) can never make more than 85% taxable.`
          : 'Step 1 sets no benefit, so there is nothing for other income to drag in — the rate follows the ordinary brackets and nothing else.'
      }
    />

    <Figure
      label="Medicare surcharge"
      value={irmaa.tier > 0 ? `Tier ${irmaa.tier} of 5` : 'None'}
      of={
        irmaa.tier > 0
          ? `${formatCurrency(irmaa.annualSurcharge)}/yr`
          : 'the standard premium'
      }
      gloss={
        <>
          Billed on a {IRMAA_LOOKBACK_YEARS}-year lag, so this is what{' '}
          {year} income sets for {year + IRMAA_LOOKBACK_YEARS}.
        </>
      }
    />
  </Figures>
);
