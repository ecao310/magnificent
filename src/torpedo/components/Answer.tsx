import { IRMAA_LOOKBACK_YEARS } from '../lib/tax';
import type { FilingStatus, IrmaaAssessment, TaxYear } from '../lib/tax';
import { formatCurrency, formatPercent } from '../lib/format';
import { FILING_STATUS_PROSE } from '../lib/returnProse';
import type { CopyState } from '../../shared/hooks/useScenarioAddress';
import { ShareLink } from '../../shared/components/ShareLink';

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
  canCopy: boolean;
  copyState: CopyState;
  onCopy: () => void;
}

/**
 * The six figures the page is for, at the income the marker is standing on:
 * the total, the tax, the two rates, how much of the benefit is taxable, and
 * the Medicare tier.
 *
 * The mirror of the recap that closes the rail. That one names what was set;
 * this one says what came of it — and it is the first place the six figures a
 * reader actually leaves with sit together. Under the chart and over the
 * notes, because it is the thing a reader would screenshot, which is also why
 * it restates the return in a status line above the figures: a screenshot of
 * an answer with no question in it is worth nothing.
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
  canCopy,
  copyState,
  onCopy,
}) => (
  <section className="answer" id="answer" aria-labelledby="answer-heading">
    <h2 className="answer-heading" id="answer-heading">
      What this return costs
    </h2>
    <p className="answer-subline">
      {year} return · {FILING_STATUS_PROSE[filingStatus]} · {ageProse} ·{' '}
      {ssBenefit > 0
        ? `${formatCurrency(ssBenefit)} of Social Security`
        : 'no Social Security'}{' '}
      · {formatCurrency(ordinaryIncome)} of other income
      {muniInterest > 0
        ? ` · ${formatCurrency(muniInterest)} of tax-exempt interest`
        : ''}
    </p>

    <dl className="answer-figures">
      <div className="answer-figure">
        <dt>Total income</dt>
        <dd>
          <strong>{formatCurrency(totalIncome)}</strong>
          <span className="answer-gloss">
            Social security plus other income
            {muniInterest > 0
              ? `, plus ${formatCurrency(muniInterest)} of tax-exempt interest`
              : ''}
            .
          </span>
        </dd>
      </div>

      <div className="answer-figure">
        <dt>Federal tax</dt>
        <dd>
          <strong>{formatCurrency(tax)}</strong>
          <span className="answer-gloss">
            What this {year} return owes. Federal only.
          </span>
        </dd>
      </div>

      <div className="answer-figure">
        <dt>Effective rate</dt>
        <dd>
          <strong>
            {totalIncome > 0 ? formatPercent(tax / totalIncome) : '—'}
          </strong>
          <span className="answer-gloss">
            {totalIncome > 0
              ? 'Percentage of total income paid in tax.'
              : 'No tax on no income.'}
          </span>
        </dd>
      </div>

      <div className="answer-figure">
        <dt>Marginal rate</dt>
        <dd>
          <strong>{marginalRate !== null ? `${marginalRate}%` : '—'}</strong>
          <span className="answer-gloss">
            What one more dollar of ordinary income costs.
          </span>
        </dd>
      </div>

      <div className="answer-figure">
        <dt>Taxable social security</dt>
        <dd>
          <strong>{ssBenefit > 0 ? formatCurrency(taxableSS) : 'None'}</strong>
          {ssBenefit > 0 && (
            <>
              {' '}
              <span className="answer-of">of {formatCurrency(ssBenefit)}</span>
            </>
          )}
          <span className="answer-gloss">
            {ssBenefit > 0
              ? `${formatPercent(taxableSS / ssBenefit)} of it. 86(a) can never make more than 85% taxable.`
              : 'Step 1 sets no benefit, so there is nothing for other income to drag in — the rate follows the ordinary brackets and nothing else.'}
          </span>
        </dd>
      </div>

      <div className="answer-figure">
        <dt>Medicare surcharge</dt>
        <dd>
          <strong>{irmaa.tier > 0 ? `Tier ${irmaa.tier} of 5` : 'None'}</strong>{' '}
          <span className="answer-of">
            {irmaa.tier > 0
              ? `${formatCurrency(irmaa.annualSurcharge)}/yr`
              : 'the standard premium'}
          </span>
          <span className="answer-gloss">
            Billed on a {IRMAA_LOOKBACK_YEARS}-year lag, so this is what{' '}
            {year} income sets for {year + IRMAA_LOOKBACK_YEARS}.
          </span>
        </dd>
      </div>
    </dl>

    {/* ───── The link is the return ─────

        The address bar has carried the whole return since the query string
        went in, and the only other place it is named is the failure case: the
        note that appears when a link asked for something that could not be
        shown. It belongs here rather than in the header, because what is
        worth sending is the answer, and this is the one place the answer sits
        together. */}
    <ShareLink
      canCopy={canCopy}
      copyState={copyState}
      onCopy={onCopy}
      label="Copy link to this return"
      copied="Copied. That link opens this page on this return."
      failed="This browser would not take the copy. Select the address bar and copy it — it is the same link."
    />
  </section>
);
