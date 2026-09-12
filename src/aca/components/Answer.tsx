import type { Adults, CoverageYear, PtcAssessment, StateCode } from '../lib/aca';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { householdPhrase } from '../lib/householdProse';
import { Answer as Figures, Figure } from '../../shared/components/Answer';
import type { ShareLinkProps } from '../../shared/components/ShareLink';

export interface AnswerProps {
  year: CoverageYear;
  adults: Adults;
  ages: number[];
  /** Named in the subline when the household has one. */
  state: StateCode | null;
  income: number;
  here: PtcAssessment;
  /** What the next block of income costs in subsidy, and how big the block is. */
  nextBlock: number;
  nextBlockCost: number;
  nextBlockCrossesCliff: boolean;
  cliffCost: number | null;
  /** The button that sends the household as a link. */
  share: ShareLinkProps;
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
  state,
  income,
  here,
  nextBlock,
  nextBlockCost,
  nextBlockCrossesCliff,
  cliffCost,
  share,
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
    <Figures
      heading={<>Your numbers at {formatCurrency(income)}</>}
      subline={
        <>
          {formatFpl(here.fplMultiple)} of the poverty line · {householdPhrase(adults, ages, state)}{' '}
          · {year} coverage
        </>
      }
      share={share}
    >
      {monthly === null ? (
        <Figure
          label="You pay"
          value="Medicaid"
          gloss="No Marketplace premium under the Medicaid line."
        />
      ) : (
        <Figure
          label="You pay"
          value={formatCurrency(monthly)}
          of="/mo"
          gloss={
            noSubsidy
              ? `${formatCurrency(annual)} a year — the full premium.`
              : `${formatCurrency(annual)} a year · ${formatPercent(
                  here.applicablePercentage,
                )} of income. A cheaper plan costs less; the subsidy is the same.`
          }
        />
      )}

      {here.credit > 0 ? (
        <Figure
          label="Subsidy"
          value={formatCurrency(Math.round(here.credit / 12))}
          of="/mo"
          gloss={
            <>
              {formatCurrency(here.credit)} a year, off a full premium of{' '}
              {formatCurrency(here.benchmarkMonthly)}/mo.
            </>
          }
        />
      ) : (
        <Figure label="Subsidy" value="None" gloss={subsidyGloss} />
      )}

      <Figure
        label="Each extra $1 of income costs"
        value={formatCents(here.slope)}
        of="of subsidy"
        gloss={
          here.slope === 0
            ? 'No subsidy left to lose.'
            : `${formatCurrency(nextBlock)} more income → ${formatCurrency(
                nextBlockCost,
              )} less subsidy for the year${
                nextBlockCrossesCliff ? ' — it crosses the 400% line' : ''
              }.`
        }
      />

      {here.cliffMagi === null ? (
        <Figure label="Room before the cliff" value="No cliff" gloss="No 400% line this year." />
      ) : here.overCliff ? (
        <Figure
          label="Over the cliff by"
          value={formatCurrency(Math.round(here.magi - here.cliffMagi))}
          gloss={
            <>
              Get back under {formatCurrency(here.cliffMagi)} and the subsidy is{' '}
              {formatCurrency(cliffCost ?? 0)}.
            </>
          }
        />
      ) : (
        <Figure
          label="Room before the cliff"
          value={formatCurrency(Math.round(here.headroom ?? 0))}
          gloss={
            <>
              Up to {formatCurrency(here.cliffMagi)} the subsidy shrinks gradually; the next
              dollar loses all {formatCurrency(cliffCost ?? 0)}.
            </>
          }
        />
      )}
    </Figures>
  );
};
