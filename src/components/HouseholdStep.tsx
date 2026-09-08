import {
  MAX_ADULT_AGE,
  MIN_ADULT_AGE,
  STATES,
  STATE_CODES,
  averageBenchmarkMonthly,
  isStateCode,
  perAdditionalPersonFor,
} from '../lib/aca';
import type { Adults, CoverageYear, StateCode } from '../lib/aca';
import { ADULT_COUNTS, MAX_DEPENDENTS, MAX_PREMIUM_MONTHLY } from '../lib/scenarioUrl';
import { formatCurrency } from '../lib/format';
import { ADULTS_LABELS } from '../lib/householdProse';
import { MoneyField } from './MoneyField';

export interface HouseholdStepProps {
  year: CoverageYear;
  adults: Adults;
  onAdults: (next: Adults) => void;
  age: number;
  onAge: (next: number) => void;
  spouseAge: number;
  onSpouseAge: (next: number) => void;
  dependents: number;
  onDependents: (next: number) => void;
  /** The household's state, or null for the national average. */
  state: StateCode | null;
  onState: (next: StateCode | null) => void;
  /** Your own monthly benchmark, or null for the state's average, or the national one. */
  benchmarkPremium: number | null;
  onBenchmarkPremium: (next: number | null) => void;
  expansionState: boolean;
  onExpansionState: (next: boolean) => void;
}

/** The counts the strip of children offers. */
const CHILD_COUNTS = Array.from({ length: MAX_DEPENDENTS + 1 }, (_, n) => n);

/** The value the select carries for no state: the option the page opens on. */
const NATIONAL = '';

/**
 * The household every figure on the page is priced for: who is on the plan,
 * how old they are, where they live, what the benchmark costs and where the
 * subsidy starts.
 *
 * Everything is visible. Nothing here is advanced — each control moves a
 * figure the reader can see move — and a control behind a disclosure is a
 * control nobody finds. Income is not here: it is the axis of the chart, and
 * the field under the chart sets it.
 */
export const HouseholdStep: React.FC<HouseholdStepProps> = ({
  year,
  adults,
  onAdults,
  age,
  onAge,
  spouseAge,
  onSpouseAge,
  dependents,
  onDependents,
  state,
  onState,
  benchmarkPremium,
  onBenchmarkPremium,
  expansionState,
  onExpansionState,
}) => {
  const couple = adults === 2;
  const ages = couple ? [age, spouseAge] : [age];
  const average = averageBenchmarkMonthly(ages, dependents, year, state);
  const benchmark = benchmarkPremium ?? average;
  const here = state === null ? null : STATES[state];
  const perChild = perAdditionalPersonFor({ state, year });

  return (
    <section
      className="step step-config"
      id="step-household"
      tabIndex={-1}
      aria-labelledby="step-household-heading"
    >
      <h2 className="step-heading" id="step-household-heading">
        Your household
      </h2>

      <fieldset className="input-group filing-status">
        <legend>Adults on the plan</legend>
        <div className="segmented">
          {ADULT_COUNTS.map((value) => (
            <label key={value} className="segmented-option">
              <input
                type="radio"
                name="adults"
                value={value}
                checked={adults === value}
                onChange={() => onAdults(value)}
              />
              <span>{ADULTS_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="input-group filing-status">
        <legend>Children on the plan</legend>
        <div className="segmented">
          {CHILD_COUNTS.map((value) => (
            <label key={value} className="segmented-option">
              <input
                type="radio"
                name="dependents"
                value={value}
                aria-label={`${value} ${value === 1 ? 'child' : 'children'}`}
                checked={dependents === value}
                onChange={() => onDependents(value)}
              />
              <span aria-hidden="true">{value}</span>
            </label>
          ))}
        </div>
        <p className="field-note">
          Each child raises the poverty line by about {formatCurrency(perChild)} and adds a
          child&rsquo;s premium.
        </p>
      </fieldset>

      <div className="input-group">
        <div className="slider-header">
          <label htmlFor="age">Age</label>
          <span className="slider-value">{age}</span>
        </div>
        <input
          id="age"
          type="range"
          min={MIN_ADULT_AGE}
          max={MAX_ADULT_AGE}
          step={1}
          value={age}
          aria-valuetext={`${age} years old`}
          onChange={(e) => onAge(Number(e.target.value))}
        />
        <div className="slider-range-labels">
          <span>{MIN_ADULT_AGE}</span>
          <span>{MAX_ADULT_AGE}</span>
        </div>
        {couple && (
          <>
            <div className="slider-header">
              <label htmlFor="spouse-age">Spouse&apos;s age</label>
              <span className="slider-value">{spouseAge}</span>
            </div>
            <input
              id="spouse-age"
              type="range"
              min={MIN_ADULT_AGE}
              max={MAX_ADULT_AGE}
              step={1}
              value={spouseAge}
              aria-valuetext={`${spouseAge} years old`}
              onChange={(e) => onSpouseAge(Number(e.target.value))}
            />
            <div className="slider-range-labels">
              <span>{MIN_ADULT_AGE}</span>
              <span>{MAX_ADULT_AGE}</span>
            </div>
          </>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="state">State</label>
        <span className="select-field">
          <select
            id="state"
            value={state ?? NATIONAL}
            aria-describedby="state-note"
            onChange={(e) => onState(isStateCode(e.target.value) ? e.target.value : null)}
          >
            <option value={NATIONAL}>National average</option>
            {STATE_CODES.map((code) => (
              <option key={code} value={code}>
                {STATES[code].name}
              </option>
            ))}
          </select>
        </span>
        <p className="field-note" id="state-note">
          Sets the average premium and the Medicaid line for your state, and the poverty
          line in Alaska and Hawaii.
        </p>
      </div>

      <div className="input-group">
        <div className="slider-header">
          <label htmlFor="benchmark-premium">Benchmark plan premium, per month</label>
          <MoneyField
            id="benchmark-premium"
            value={benchmark}
            min={0}
            max={MAX_PREMIUM_MONTHLY}
            step={25}
            onCommit={onBenchmarkPremium}
            describedBy="benchmark-premium-note"
          />
        </div>
        <p className="field-note" id="benchmark-premium-note">
          {here === null
            ? `Prefilled with the ${year} national average for these ages.`
            : here.ageRating === 'none'
              ? `Prefilled with the ${year} average for ${here.name}, which does not price by age.`
              : `Prefilled with the ${year} average for ${here.name} for these ages.`}{' '}
          Your Marketplace quotes your area&rsquo;s figure.
        </p>
        {benchmarkPremium !== null && benchmarkPremium !== average && (
          <p className="field-reset">
            <button
              type="button"
              className="reset-button"
              onClick={() => onBenchmarkPremium(null)}
            >
              Use the average
            </button>
          </p>
        )}
      </div>

      <div className="input-group">
        <div className="checkbox-group">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={expansionState}
              onChange={(e) => onExpansionState(e.target.checked)}
            />
            <span>My state expanded Medicaid</span>
          </label>
        </div>
        <p className="field-note">
          {here === null
            ? '40 states and DC have.'
            : `${here.name} has${here.expandedMedicaid ? '' : ' not'}.`}{' '}
          If yours has, the subsidy starts at 138% of the poverty line; otherwise at 100%.
        </p>
      </div>
    </section>
  );
};
