import type { CostPoint, PtcAssessment, Scenario, SubsidyLine } from '../lib/aca';
import { formatCurrency } from '../lib/format';
import { readoutParts } from '../lib/readout';
import { CostChart } from './CostChart';
import { IncomeSlider } from './IncomeSlider';

/** How far past the household's income the figures look, to price the slope in dollars. */
export const NEXT_BLOCK = 10_000;

/** The plot's accessible name: the axis, end to end. */
const chartLabel = (axisMax: number): string =>
  'Chart: what you pay each month for the benchmark plan after the subsidy, against ' +
  `household income from $0 to ${formatCurrency(axisMax)}.`;

export interface CostStepProps {
  scenario: Scenario;
  curve: CostPoint[];
  axisMax: number;
  income: number;
  onIncome: (next: number) => void;
  incomeSliderStep: number;
  /** The subsidy's two edges on this axis. */
  lines: SubsidyLine[];
  /** Where the household stands at its own income. */
  here: PtcAssessment;
}

/**
 * What you pay for the plan, across every income, and where on that curve you
 * are standing.
 *
 * The chart, then the one control that says where on it you are: a slider
 * inset to the plot area, so the thumb stands under the marker, and a field
 * for a figure nobody wants to drag to. The sentence under them prices the
 * point the marker is on.
 */
export const CostStep: React.FC<CostStepProps> = ({
  scenario,
  curve,
  axisMax,
  income,
  onIncome,
  incomeSliderStep,
  lines,
  here,
}) => {
  const axisDomain: [number, number] = [curve[0].magi, curve[curve.length - 1].magi];
  const drawn = lines.filter((line) => line.magi <= axisMax);
  const monthly = here.netPremiumAnnual === null ? null : Math.round(here.netPremiumAnnual / 12);

  return (
    <section className="step" id="step-cost" tabIndex={-1} aria-labelledby="step-cost-heading">
      <h2 className="step-heading" id="step-cost-heading">
        What you pay
      </h2>
      <p className="step-deck">
        Monthly cost of the benchmark plan after the subsidy, at every household income.
        Tap or hover the curve for the subsidy at any income.
      </p>

      <figure className="chart-figure">
        <CostChart
          curve={curve}
          axisDomain={axisDomain}
          here={income}
          hereCost={monthly}
          lines={drawn}
          label={chartLabel(axisMax)}
          scenario={scenario}
          onIncome={onIncome}
        />
      </figure>

      <IncomeSlider
        income={income}
        onIncome={onIncome}
        axisMax={axisMax}
        step={incomeSliderStep}
        readout={readoutParts(here)}
      />
    </section>
  );
};
