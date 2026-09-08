import type { Adults, CoverageYear, PtcAssessment } from '../lib/aca';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { ADULTS_PROSE, agesProse } from '../lib/householdProse';
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
 * The four figures the page is for, at the income the marker is standing on:
 * what you pay, what the subsidy pays, what the next dollar of income costs,
 * and how far the 400% line is.
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
  const annual = Math.round(here.netPremiumAnnual ?? 0);
  const noSubsidy = here.credit === 0;

  const subsidyGloss = here.overCliff
    ? 'Over the 400% line.'
    : here.belowFloor
      ? here.floorMultiple > 1
        ? 'Under the Medicaid line.'
        : 'Under 100% of the poverty line, and no Medicaid.'
      : 'Your share of income covers the full premium.';

  return (
    <section className="answer" id="answer" aria-labelledby="answer-heading">
      <h2 className="answer-heading" id="answer-heading">
        Your numbers at {formatCurrency(income)}
      </h2>
      <p className="answer-subline">
        {formatFpl(here.fplMultiple)} of the poverty line · {ADULTS_PROSE[adults]},{' '}
        {agesProse(ages)} · {year} coverage
      </p>

      <dl className="answer-figures">
        <div className="answer-figure">
          <dt>You pay</dt>
          <dd>
            {monthly === null ? (
              <>
                <strong>Medicaid</strong>
                <span className="answer-gloss">
                  No Marketplace premium under the Medicaid line.
                </span>
              </>
            ) : (
              <>
                <strong>{formatCurrency(monthly)}</strong>
                <span className="answer-of">/mo</span>
                <span className="answer-gloss">
                  {noSubsidy
                    ? `${formatCurrency(annual)} a year — the full premium.`
                    : `${formatCurrency(annual)} a year · ${formatPercent(
                        here.applicablePercentage,
                      )} of income. A cheaper plan costs less; the subsidy is the same.`}
                </span>
              </>
            )}
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Subsidy</dt>
          <dd>
            {here.credit > 0 ? (
              <>
                <strong>{formatCurrency(Math.round(here.credit / 12))}</strong>
                <span className="answer-of">/mo</span>
                <span className="answer-gloss">
                  {formatCurrency(here.credit)} a year, off a full premium of{' '}
                  {formatCurrency(here.benchmarkMonthly)}/mo.
                </span>
              </>
            ) : (
              <>
                <strong>None</strong>
                <span className="answer-gloss">{subsidyGloss}</span>
              </>
            )}
          </dd>
        </div>

        <div className="answer-figure">
          <dt>Each extra $1 of income costs</dt>
          <dd>
            <strong>{formatCents(here.slope)}</strong>
            <span className="answer-of">of subsidy</span>
            <span className="answer-gloss">
              {here.slope === 0
                ? 'No subsidy left to lose.'
                : `${formatCurrency(nextBlock)} more income → ${formatCurrency(
                    nextBlockCost,
                  )} less subsidy for the year${
                    nextBlockCrossesCliff ? ' — it crosses the 400% line' : ''
                  }.`}
            </span>
          </dd>
        </div>

        <div className="answer-figure">
          {here.cliffMagi === null ? (
            <>
              <dt>Room before the cliff</dt>
              <dd>
                <strong>No cliff</strong>
                <span className="answer-gloss">No 400% line this year.</span>
              </dd>
            </>
          ) : here.overCliff ? (
            <>
              <dt>Over the cliff by</dt>
              <dd>
                <strong>{formatCurrency(Math.round(here.magi - here.cliffMagi))}</strong>
                <span className="answer-gloss">
                  Get back under {formatCurrency(here.cliffMagi)} and the subsidy is{' '}
                  {formatCurrency(cliffCost ?? 0)}.
                </span>
              </dd>
            </>
          ) : (
            <>
              <dt>Room before the cliff</dt>
              <dd>
                <strong>{formatCurrency(Math.round(here.headroom ?? 0))}</strong>
                <span className="answer-gloss">
                  Up to {formatCurrency(here.cliffMagi)} the subsidy shrinks gradually; the
                  next dollar loses all {formatCurrency(cliffCost ?? 0)}.
                </span>
              </dd>
            </>
          )}
        </div>
      </dl>

      <div className="answer-share">
        {canCopy && (
          <button type="button" className="answer-share-button" onClick={onCopy}>
            Copy link
          </button>
        )}
        <p className="answer-share-status" aria-live="polite" aria-atomic="true">
          {copyState === 'copied'
            ? 'Link copied.'
            : copyState === 'failed'
              ? 'Couldn’t copy — the address bar holds the same link.'
              : ''}
        </p>
      </div>
    </section>
  );
};
