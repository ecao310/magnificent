import type { AddedKind, BlockCost, FilingStatus, NextDollar, PtcAssessment, TaxYear } from '../lib/tax';
import { formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { ADDED_KIND_PROSE, FILING_STATUS_PROSE, agesProse, householdProse, otherKind } from '../lib/returnProse';
import type { CopyState } from '../hooks/useScenarioAddress';

/** The most a harvested gain can save later: the rate it would otherwise be taxed at. */
const HARVEST_CEILING = 0.15;

export interface AnswerProps {
  year: TaxYear;
  filingStatus: FilingStatus;
  ages: number[];
  ordinaryIncome: number;
  qualifiedIncome: number;
  addedKind: AddedKind;
  here: PtcAssessment;
  block: BlockCost;
  otherBlock: BlockCost;
  next: NextDollar;
  /** The year's federal tax with the block in it. */
  tax: number;
  canCopy: boolean;
  copyState: CopyState;
  onCopy: () => void;
}

/**
 * The close: the reader's own answer, in one place.
 *
 * The mirror of the recap that closes step 1. That one names what was set;
 * this one says what came of it, and it is the first place the six figures a
 * reader leaves with sit together. Last before the disclaimer because it is
 * the thing a reader would screenshot, which is why it restates the household
 * above the figures.
 */
export const Answer: React.FC<AnswerProps> = ({
  year,
  filingStatus,
  ages,
  ordinaryIncome,
  qualifiedIncome,
  addedKind,
  here,
  block,
  otherBlock,
  next,
  tax,
  canCopy,
  copyState,
  onCopy,
}) => {
  const sized = block.added > 0;
  const nextRate = (kind: AddedKind): number =>
    (kind === 'conversion' ? next.conversionTax : next.harvestTax) + next.credit;
  const costRate = sized ? block.rate ?? 0 : nextRate(addedKind);
  const creditGloss = here.belowFloor
    ? 'Under the floor there is no credit: this household is on Medicaid, or in the gap.'
    : here.overCliff
      ? `Over the ${formatFpl(4)} line there is no credit at all.`
      : here.credit === 0
        ? 'The household’s share already reaches the benchmark, so nothing is left to credit.'
        : `The benchmark less ${formatPercent(here.applicablePercentage)} of income, the household’s share at ${formatFpl(here.fplMultiple)}.`;

  return (
    <section className="answer" id="answer" aria-labelledby="answer-heading">
      <p className="answer-kicker">The answer</p>
      <h2 className="answer-heading" id="answer-heading">
        What this year costs
      </h2>
      <p className="answer-intro">
        Priced for {year}: {FILING_STATUS_PROSE[filingStatus]}, {agesProse(ages)}, with{' '}
        {formatCurrency(ordinaryIncome)} of ordinary income and{' '}
        {formatCurrency(qualifiedIncome)} of qualified dividends and gains
        {sized
          ? `, adding ${formatCurrency(block.added)} as ${ADDED_KIND_PROSE[addedKind]}`
          : ', adding nothing'}
        .
      </p>

      <dl className="answer-figures">
        <div className="answer-figure">
          <dt>
            Household income<span className="answer-line">8962 L3</span>
          </dt>
          <dd>
            <strong>{formatCurrency(Math.round(here.magi))}</strong>
            <span className="answer-gloss">
              {formatFpl(here.fplMultiple)} of the {formatCurrency(here.povertyLine)} poverty
              line for {householdProse(here.householdSize)}.
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>
            Premium tax credit<span className="answer-line">8962 L24</span>
          </dt>
          <dd>
            <strong>{here.credit > 0 ? formatCurrency(here.credit) : 'None'}</strong>{' '}
            <span className="answer-of">of {formatCurrency(here.benchmarkAnnual)}</span>
            <span className="answer-gloss">{creditGloss}</span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Your share of the benchmark</dt>
          <dd>
            <strong>{formatCurrency(here.netPremiumAnnual)}</strong>{' '}
            <span className="answer-of">/yr</span>
            <span className="answer-gloss">
              {formatCurrency(Math.round(here.netPremiumAnnual / 12))} a month for the
              second-lowest-cost silver plan. A cheaper plan costs less; the credit is the
              same.
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>
            Federal tax<span className="answer-line">1040 L16</span>
          </dt>
          <dd>
            <strong>{formatCurrency(tax)}</strong>
            <span className="answer-gloss">What this {year} return owes. Federal only.</span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>{sized ? 'Cost of the block' : 'Cost of the next dollar'}</dt>
          <dd>
            {sized ? (
              <>
                <strong>{formatCurrency(block.total)}</strong>{' '}
                <span className="answer-of">
                  {formatPercent(costRate)} of {formatCurrency(block.added)}
                </span>
                <span className="answer-gloss">
                  {formatCurrency(block.tax)} of tax and {formatCurrency(block.credit)} of
                  credit given back
                  {block.crossesCliff ? ', the whole credit among it' : ''}. As{' '}
                  {ADDED_KIND_PROSE[otherKind(addedKind)]}: {formatCurrency(otherBlock.total)}
                  {otherBlock.rate !== null ? `, ${formatPercent(otherBlock.rate)}` : ''}.
                </span>
              </>
            ) : (
              <>
                <strong>{formatPercent(costRate)}</strong>
                <span className="answer-gloss">
                  As {ADDED_KIND_PROSE[addedKind]}: {formatPercent(costRate - next.credit)} in
                  tax and {formatPercent(next.credit)} in credit given back. As{' '}
                  {ADDED_KIND_PROSE[otherKind(addedKind)]}:{' '}
                  {formatPercent(nextRate(otherKind(addedKind)))}.
                </span>
              </>
            )}
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Future rate to beat</dt>
          <dd>
            {addedKind === 'conversion' ? (
              <>
                <strong>{formatPercent(costRate)}</strong>
                <span className="answer-gloss">
                  A conversion pays off only if these dollars would otherwise come out
                  above this &mdash; brackets, the torpedo after 65 and Medicare&apos;s
                  surcharges included.
                </span>
              </>
            ) : (
              <>
                <strong>{formatPercent(HARVEST_CEILING)}</strong>{' '}
                <span className="answer-of">at most</span>
                <span className="answer-gloss">
                  The most a harvested gain saves later is the {formatPercent(HARVEST_CEILING)}{' '}
                  it would have been taxed at, and nothing if the shares are held to a
                  basis step-up. Today it costs {formatPercent(costRate)}.
                </span>
              </>
            )}
          </dd>
        </div>
      </dl>

      <div className="answer-share">
        {canCopy && (
          <button type="button" className="answer-share-button" onClick={onCopy}>
            Copy link to this household
          </button>
        )}
        <p className="answer-share-status" aria-live="polite" aria-atomic="true">
          {copyState === 'copied'
            ? 'Copied. That link opens this page on this household.'
            : copyState === 'failed'
              ? 'This browser would not take the copy. Select the address bar and copy it — it is the same link.'
              : ''}
        </p>
      </div>
    </section>
  );
};
