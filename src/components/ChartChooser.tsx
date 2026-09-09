import { CHARTS } from '../lib/charts';
import type { ChartId } from '../lib/charts';

export interface ChartChooserProps {
  chart: ChartId;
  onChart: (next: ChartId) => void;
}

/**
 * Which chart is on the page: two stamped boxes in the segmented control's
 * vocabulary, the one showing filled with ink, directly above the chart
 * they choose between. A name in mono over a gloss in the serif — what the
 * chart is called, and what it draws — so a reader knows what the other
 * one is for before choosing it.
 *
 * Radios rather than tabs, as the rail's own choosers are: the arrow keys
 * move the choice and the choice moves the chart, and the group needs no
 * script to be keyboard-complete.
 */
export const ChartChooser: React.FC<ChartChooserProps> = ({ chart, onChart }) => (
  <fieldset className="chart-chooser">
    <legend className="visually-hidden">Chart</legend>
    <div className="chart-choices">
      {CHARTS.map((option) => (
        <label key={option.id} className="chart-choice">
          <input
            type="radio"
            name="chart"
            value={option.id}
            aria-label={option.name}
            aria-describedby={`chart-choice-gloss-${option.id}`}
            checked={chart === option.id}
            onChange={() => onChart(option.id)}
          />
          <span className="chart-choice-box">
            <span className="chart-choice-name" aria-hidden="true">
              {option.name}
            </span>
            <span className="chart-choice-gloss" id={`chart-choice-gloss-${option.id}`}>
              {option.gloss}
            </span>
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);
