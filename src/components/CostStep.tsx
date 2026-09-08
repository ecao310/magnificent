import { Fragment, useState } from 'react';
import { MAX_INCOME } from '../lib/scenarioUrl';
import type { CostPoint, PtcAssessment, Scenario, SubsidyLine } from '../lib/aca';
import { formatCurrency } from '../lib/format';
import { readoutParts } from '../lib/readout';
import { CostChart } from './CostChart';
import { MoneyField } from './MoneyField';

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
  /** Every line the subsidy puts on this axis; the tiers are drawn on request. */
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
  const [showTiers, setShowTiers] = useState(false);

  const axisDomain: [number, number] = [curve[0].magi, curve[curve.length - 1].magi];
  const drawn = lines.filter(
    (line) => line.magi <= axisMax && (line.kind === 'edge' || showTiers),
  );
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

        <figcaption className="chart-legend">
          <span className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-cost" aria-hidden="true" />
            You pay per month
          </span>
          <span className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-subsidy" aria-hidden="true" />
            Subsidy pays
          </span>
          <span className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-here" aria-hidden="true" />
            Your income
          </span>
          <span className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-edge" aria-hidden="true" />
            Subsidy starts / ends
          </span>
          <label className="checkbox-option chart-legend-toggle">
            <input
              type="checkbox"
              checked={showTiers}
              onChange={(e) => setShowTiers(e.target.checked)}
            />
            <span className="chart-legend-swatch chart-legend-tier" aria-hidden="true" />
            <span>Show cost-sharing tiers (150%, 200%, 250%)</span>
          </label>
        </figcaption>
      </figure>

      <div className="input-group chart-slider">
        <div className="slider-header">
          <label htmlFor="income">Household income for the year</label>
          <MoneyField
            id="income"
            className="amber"
            value={income}
            min={0}
            max={MAX_INCOME}
            step={100}
            onCommit={onIncome}
          />
        </div>
        <input
          id="income-slider"
          aria-label="Household income for the year"
          aria-valuetext={formatCurrency(income)}
          type="range"
          min={0}
          max={axisMax}
          step={incomeSliderStep}
          value={Math.min(income, axisMax)}
          onChange={(e) => onIncome(Number(e.target.value))}
          className="slider-amber"
        />
        <div className="slider-range-labels">
          <span>$0</span>
          <span>{formatCurrency(axisMax)}</span>
        </div>

        <p className="slider-readout">
          {readoutParts(here).map((part, i) => (
            <Fragment key={i}>{part.strong ? <strong>{part.text}</strong> : part.text}</Fragment>
          ))}
        </p>
      </div>
    </section>
  );
};
