import { Fragment } from 'react';
import { MAX_INCOME } from '../lib/scenarioUrl';
import { formatCurrency } from '../lib/format';
import type { ReadoutPart } from '../lib/readout';
import { MoneyField } from './MoneyField';

/** What the control is called, on the page and to a screen reader. */
export const INCOME_LABEL = 'Household income for the year';

export interface IncomeSliderProps {
  income: number;
  onIncome: (next: number) => void;
  /** The right edge of the chart's axis, which is the slider's too. */
  axisMax: number;
  step: number;
  /** The sentence under the slider that prices the point it is on, in pieces. */
  readout: ReadoutPart[];
}

/**
 * The one control that says where on the chart you are: a slider inset to
 * the plot area, so the thumb stands under the marker, and a field for a
 * figure nobody wants to drag to. The sentence under them prices the point
 * the marker is on, in whatever terms the chart above it is drawn in.
 *
 * There is one household income and two charts of it, but one chart on the
 * page at a time, so this stands under whichever is showing and the income
 * it sets is the same one the other chart will open on.
 */
export const IncomeSlider: React.FC<IncomeSliderProps> = ({
  income,
  onIncome,
  axisMax,
  step,
  readout,
}) => (
  <div className="input-group chart-slider">
    <div className="slider-header">
      <label htmlFor="income">{INCOME_LABEL}</label>
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
      aria-label={INCOME_LABEL}
      aria-valuetext={formatCurrency(income)}
      type="range"
      min={0}
      max={axisMax}
      step={step}
      value={Math.min(income, axisMax)}
      onChange={(e) => onIncome(Number(e.target.value))}
      className="slider-amber"
    />
    <div className="slider-range-labels">
      <span>$0</span>
      <span>{formatCurrency(axisMax)}</span>
    </div>

    <p className="slider-readout">
      {readout.map((part, i) => (
        <Fragment key={i}>{part.strong ? <strong>{part.text}</strong> : part.text}</Fragment>
      ))}
    </p>
  </div>
);
