import { useState } from 'react';
import { MAX_INCOME } from '../lib/scenarioUrl';
import type { CoverageYear, CostPoint, PtcAssessment, Scenario, SubsidyLine } from '../lib/aca';
import { formatCents, formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { BreakpointsMenu } from './BreakpointsMenu';
import { CostChart } from './CostChart';
import { AdvanceExplainer } from './explainers/AdvanceExplainer';
import { CliffExplainer } from './explainers/CliffExplainer';
import { CreditExplainer } from './explainers/CreditExplainer';
import { FloorExplainer } from './explainers/FloorExplainer';
import { LeftOutExplainer } from './explainers/LeftOutExplainer';
import { SlopeExplainer } from './explainers/SlopeExplainer';

/** How far past the household's income the readout looks, to give the slope a figure in dollars. */
export const NEXT_BLOCK = 10_000;

/** The two sentences that describe the axis end to end: the plot's accessible name, and the caption under it. */
const axisProse = (axisMax: number, benchmark: number): { label: string; caption: string } => ({
  caption: `Household income ($), the MAGI the subsidy is measured on. The benchmark plan costs ${formatCurrency(
    benchmark,
  )} a month before any subsidy; hover for the subsidy at any income.`,
  label:
    'Chart: what this household pays each month for the benchmark silver plan after the ' +
    `subsidy, plotted against household income from $0 to ${formatCurrency(axisMax)}.`,
});

export interface CostStepProps {
  stepNumber: number;
  stepCount: number;
  year: CoverageYear;
  scenario: Scenario;
  curve: CostPoint[];
  axisMax: number;
  income: number;
  onIncome: (next: number) => void;
  incomeSliderStep: number;
  /** Every line the subsidy puts on this axis; which are drawn is this step's own state. */
  lines: SubsidyLine[];
  /** Where the household stands at its own income. */
  here: PtcAssessment;
  /** What the next `NEXT_BLOCK` dollars of income would cost in subsidy. */
  nextBlockCost: number;
  /** Whether that block crosses the line. */
  nextBlockCrossesCliff: boolean;
  cliffCost: number | null;
}

/**
 * Step 2: what the household pays for its plan, across every income, and
 * where on that curve it is standing.
 *
 * The chart, then the one control that says where on it the reader is, then
 * the collapsed notes. Which lines are drawn is the one piece of state that
 * belongs to this step: the subsidy's edges start on, because every reader
 * meets them; the cost-sharing tiers start off, because they belong only to
 * a reader buying silver.
 */
export const CostStep: React.FC<CostStepProps> = ({
  stepNumber,
  stepCount,
  year,
  scenario,
  curve,
  axisMax,
  income,
  onIncome,
  incomeSliderStep,
  lines,
  here,
  nextBlockCost,
  nextBlockCrossesCliff,
  cliffCost,
}) => {
  const [showEdges, setShowEdges] = useState(true);
  const [showCsr, setShowCsr] = useState(false);

  const axisDomain: [number, number] = [curve[0].magi, curve[curve.length - 1].magi];
  const { label, caption } = axisProse(axisMax, here.benchmarkMonthly);
  const drawn = lines.filter(
    (line) =>
      line.magi <= axisMax &&
      ((line.kind === 'edge' && showEdges) || (line.kind === 'csr' && showCsr)),
  );
  const floor = lines.find((line) => line.id === 'floor');
  const monthly = here.netPremiumAnnual === null ? null : Math.round(here.netPremiumAnnual / 12);
  const subsidyMonthly = Math.round(here.credit / 12);

  return (
    <section className="step" id="step-cost" tabIndex={-1} aria-labelledby="step-cost-heading">
      <p className="step-kicker">
        Step {stepNumber} of {stepCount}
      </p>
      <h2 className="step-heading" id="step-cost-heading">
        What the plan costs
      </h2>
      <p className="step-deck">
        What this household pays each month for the benchmark silver plan, after the
        subsidy, at every household income.
      </p>

      <figure className="chart-figure">
        <BreakpointsMenu
          linesShown={drawn.length}
          showEdges={showEdges}
          onShowEdges={setShowEdges}
          showCsr={showCsr}
          onShowCsr={setShowCsr}
          floorLabel={floor?.label ?? ''}
          hasCliff={lines.some((line) => line.id === 'cliff')}
        />
        <CostChart
          curve={curve}
          axisDomain={axisDomain}
          here={income}
          lines={drawn}
          label={label}
          caption={caption}
          scenario={scenario}
        />
      </figure>

      <div className="input-group chart-slider">
        <div className="slider-header">
          <label htmlFor="income">Household income for the year</label>
          <span className="slider-value amber">{formatCurrency(income)}</span>
        </div>
        <input
          id="income"
          type="range"
          min={0}
          max={MAX_INCOME}
          step={incomeSliderStep}
          value={income}
          onChange={(e) => onIncome(Number(e.target.value))}
          className="slider-amber"
        />
        <div className="slider-range-labels">
          <span>$0</span>
          <span>{formatCurrency(MAX_INCOME)}</span>
        </div>

        <p className="slider-readout">
          {monthly === null ? (
            <>
              At {formatCurrency(income)} of household income ({formatFpl(here.fplMultiple)} of
              the poverty line) this household is under the floor: it is eligible for{' '}
              <strong>Medicaid</strong>, and the Marketplace subsidy begins at{' '}
              <strong>{formatCurrency(Math.round(here.floorMagi))}</strong>.
            </>
          ) : here.credit > 0 ? (
            <>
              At {formatCurrency(income)} of household income ({formatFpl(here.fplMultiple)} of
              the poverty line) this household pays <strong>{formatCurrency(monthly)}</strong> a
              month for the benchmark plan &mdash;{' '}
              <strong>{formatPercent(here.applicablePercentage)}</strong> of its income &mdash;
              and the subsidy pays the other <strong>{formatCurrency(subsidyMonthly)}</strong>:{' '}
              <strong>{formatCurrency(here.credit)}</strong> a year. The next dollar of income
              costs <strong>{formatCents(here.slope)}</strong> of subsidy; the next{' '}
              {formatCurrency(NEXT_BLOCK)} costs <strong>{formatCurrency(nextBlockCost)}</strong>
              {nextBlockCrossesCliff ? ', because it crosses the 400% line' : ''}.
            </>
          ) : (
            <>
              At {formatCurrency(income)} of household income ({formatFpl(here.fplMultiple)} of
              the poverty line) this household pays <strong>{formatCurrency(monthly)}</strong> a
              month for the benchmark plan &mdash; the whole premium. There is{' '}
              <strong>no subsidy</strong>{' '}
              {here.overCliff
                ? `over the 400% line, and coming back under it takes ${formatCurrency(
                    Math.round(here.magi - (here.cliffMagi ?? 0)),
                  )} less income`
                : here.belowFloor
                  ? 'under 100% of the poverty line, and no Medicaid either'
                  : 'because the household’s share already reaches the benchmark'}
              .
            </>
          )}
        </p>
      </div>

      <p className="notes-kicker">Notes</p>
      <CreditExplainer here={here} year={year} />
      <SlopeExplainer here={here} year={year} />
      {here.cliffApplies && <CliffExplainer here={here} cliffCost={cliffCost} year={year} />}
      <FloorExplainer here={here} expansionState={scenario.expansionState !== false} />
      <AdvanceExplainer year={year} />
      <LeftOutExplainer />
    </section>
  );
};
