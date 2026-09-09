import type { Scenario, SubsidyLine } from '../../lib/aca';
import type { AllInAssessment, RatePoint } from '../../lib/tax';
import { formatCurrency } from '../../lib/format';
import { rateReadoutParts } from '../../lib/rateReadout';
import { IncomeSlider } from '../IncomeSlider';
import { RateChart } from './RateChart';

/** The plot's accessible name: the axis, end to end. */
const chartLabel = (axisMax: number): string =>
  'Chart: federal income tax and the benchmark plan’s premium after the subsidy, as shares of ' +
  `household income, stacked, against household income from $0 to ${formatCurrency(axisMax)}.`;

export interface RateStepProps {
  scenario: Scenario;
  curve: RatePoint[];
  axisMax: number;
  rateAxis: { max: number; ticks: number[] };
  income: number;
  onIncome: (next: number) => void;
  incomeSliderStep: number;
  /** The subsidy's two edges on this axis. */
  lines: SubsidyLine[];
  /** Where the household stands at its own income. */
  here: AllInAssessment;
}

/**
 * What you hand over, all in, across every income, and where on that curve
 * you are standing: the second chart of the same household, in the first
 * one's place when the reader chooses it.
 *
 * The chart, a key under it — three marks is one more than a plot can name
 * in place — and then the one control that says where on it you are. The
 * sentence under the slider prices the point the marker is on, in this
 * chart's terms.
 */
export const RateStep: React.FC<RateStepProps> = ({
  scenario,
  curve,
  axisMax,
  rateAxis,
  income,
  onIncome,
  incomeSliderStep,
  lines,
  here,
}) => {
  const axisDomain: [number, number] = [curve[0].magi, curve[curve.length - 1].magi];
  const drawn = lines.filter((line) => line.magi <= axisMax);

  return (
    <section className="step" id="step-rate" tabIndex={-1} aria-labelledby="step-rate-heading">
      <h2 className="step-heading" id="step-rate-heading">
        Your effective rate
      </h2>
      <p className="step-deck">
        Federal income tax and the benchmark plan&rsquo;s premium after the subsidy, together,
        as a share of household income at every income. Tap or hover the curve for the split
        at any income.
      </p>

      <figure className="chart-figure">
        <RateChart
          curve={curve}
          axisDomain={axisDomain}
          rateAxis={rateAxis}
          here={income}
          hereRate={here.allInShare}
          lines={drawn}
          label={chartLabel(axisMax)}
          scenario={scenario}
          onIncome={onIncome}
        />
        <figcaption className="chart-key">
          <span className="chart-key-item">
            <span className="chart-key-swatch chart-key-line" aria-hidden="true" />
            All in
          </span>
          <span className="chart-key-item">
            <span className="chart-key-swatch chart-key-hatch" aria-hidden="true" />
            Premium after subsidy
          </span>
          <span className="chart-key-item">
            <span className="chart-key-swatch chart-key-wash" aria-hidden="true" />
            Federal income tax
          </span>
        </figcaption>
      </figure>

      <IncomeSlider
        income={income}
        onIncome={onIncome}
        axisMax={axisMax}
        step={incomeSliderStep}
        readout={rateReadoutParts(here)}
      />
    </section>
  );
};
