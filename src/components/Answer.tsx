import type { Adults, CoverageYear, PtcAssessment } from '../lib/aca';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { ADULTS_PROSE, agesProse, householdProse } from '../lib/householdProse';
import type { CopyState } from '../hooks/useScenarioAddress';

export interface AnswerProps {
  year: CoverageYear;
  adults: Adults;
  ages: number[];
  income: number;
  here: PtcAssessment;
  /** What the next block of income costs in subsidy, and how big the block is. */
  nextBlock: number;
  nextBlockCost: number;
  nextBlockCrossesCliff: boolean;
  cliffCost: number | null;
  canCopy: boolean;
  copyState: CopyState;
  onCopy: () => void;
}

/**
 * The close: the reader's own answer, in one place. The mirror of the recap
 * that closes step 1: that one names what was set; this one says what came of
 * it. Last before the disclaimer because it is the thing a reader would
 * screenshot, which is why it restates the household above the figures.
 */
export const Answer: React.FC<AnswerProps> = ({
  year,
  adults,
  ages,
  income,
  here,
  nextBlock,
  nextBlockCost,
  nextBlockCrossesCliff,
  cliffCost,
  canCopy,
  copyState,
  onCopy,
}) => {
  const monthly = here.netPremiumAnnual === null ? null : Math.round(here.netPremiumAnnual / 12);
  const subsidyGloss = here.belowFloor
    ? here.floorMultiple > 1
      ? 'Under the floor: this household is eligible for Medicaid, not the subsidy.'
      : 'Under 100% of the poverty line: no subsidy, and no Medicaid either.'
    : here.overCliff
      ? `Over the ${formatFpl(4)} line there is no subsidy at all.`
      : here.credit === 0
        ? 'The household’s share already reaches the benchmark, so nothing is left to subsidise.'
        : `The benchmark less ${formatPercent(here.applicablePercentage)} of income, the share the table asks for at ${formatFpl(here.fplMultiple)}.`;

  return (
    <section className="answer" id="answer" aria-labelledby="answer-heading">
      <p className="answer-kicker">The answer</p>
      <h2 className="answer-heading" id="answer-heading">
        What this year costs
      </h2>
      <p className="answer-intro">
        Priced for {year}: {ADULTS_PROSE[adults]}, {agesProse(ages)}, on{' '}
        {formatCurrency(income)} of household income.
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
            Subsidy<span className="answer-line">8962 L24</span>
          </dt>
          <dd>
            <strong>{here.credit > 0 ? formatCurrency(here.credit) : 'None'}</strong>{' '}
            <span className="answer-of">of {formatCurrency(here.benchmarkAnnual)}</span>
            <span className="answer-gloss">{subsidyGloss}</span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>You pay</dt>
          <dd>
            {monthly === null ? (
              <>
                <strong>Medicaid</strong>
                <span className="answer-gloss">
                  No Marketplace premium to quote under the floor.
                </span>
              </>
            ) : (
              <>
                <strong>{formatCurrency(monthly)}</strong>{' '}
                <span className="answer-of">/mo</span>
                <span className="answer-gloss">
                  {formatCurrency(Math.round(here.netPremiumAnnual ?? 0))} a year for the
                  second-lowest-cost silver plan. A cheaper plan costs less; the subsidy is
                  the same.
                </span>
              </>
            )}
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Share of income</dt>
          <dd>
            <strong>
              {monthly === null
                ? '—'
                : here.overCliff || here.credit === 0
                  ? formatPercent(income > 0 ? (here.netPremiumAnnual ?? 0) / income : 0)
                  : formatPercent(here.applicablePercentage)}
            </strong>
            <span className="answer-gloss">
              {monthly === null
                ? 'Nothing is owed for Medicaid.'
                : here.overCliff || here.credit === 0
                  ? 'The whole premium, as a share of this income.'
                  : `What the table asks a household at ${formatFpl(here.fplMultiple)} to pay toward the benchmark.`}
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Next dollar</dt>
          <dd>
            <strong>{formatCents(here.slope)}</strong>
            <span className="answer-gloss">
              Of subsidy given back for each extra dollar of income. The next{' '}
              {formatCurrency(nextBlock)} costs {formatCurrency(nextBlockCost)}
              {nextBlockCrossesCliff ? ' — it crosses the 400% line' : ''}.
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Room under the cliff</dt>
          <dd>
            {here.cliffMagi === null ? (
              <>
                <strong>No cliff</strong>
                <span className="answer-gloss">This year’s table has no 400% line.</span>
              </>
            ) : here.overCliff ? (
              <>
                <strong>{formatCurrency(Math.round(here.magi - here.cliffMagi))}</strong>{' '}
                <span className="answer-of">over</span>
                <span className="answer-gloss">
                  Coming back under {formatCurrency(here.cliffMagi)} restores a subsidy of{' '}
                  {formatCurrency(cliffCost ?? 0)} at the line.
                </span>
              </>
            ) : (
              <>
                <strong>{formatCurrency(Math.round(here.headroom ?? 0))}</strong>
                <span className="answer-gloss">
                  Income can rise this far, to {formatCurrency(here.cliffMagi)}, before the
                  dollar after it costs the {formatCurrency(cliffCost ?? 0)} of subsidy
                  left at the line.
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
