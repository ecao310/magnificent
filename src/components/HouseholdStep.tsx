import {
  BENCHMARK_REFERENCE_AGE,
  BENCHMARK_YEAR_PARAMS,
  MAX_ADULT_AGE,
  MIN_ADULT_AGE,
  averageBenchmarkMonthly,
  householdSizeFor,
  povertyLineFor,
} from '../lib/aca';
import type { Adults, CoverageYear, Scenario } from '../lib/aca';
import { ADULT_COUNTS, MAX_DEPENDENTS, MAX_PREMIUM_MONTHLY } from '../lib/scenarioUrl';
import { formatCurrency } from '../lib/format';
import { ADULTS_LABELS, ADULTS_PROSE, agesProse, householdProse } from '../lib/householdProse';
import { ProseList } from './ProseList';

export interface HouseholdStepProps {
  stepNumber: number;
  stepCount: number;
  year: CoverageYear;
  /** The household as the engine reads it, for the figures the rail quotes back. */
  scenario: Scenario;
  adults: Adults;
  onAdults: (next: Adults) => void;
  age: number;
  onAge: (next: number) => void;
  spouseAge: number;
  onSpouseAge: (next: number) => void;
  dependents: number;
  onDependents: (next: number) => void;
  /** The reader's own monthly benchmark, or null for the national average. */
  benchmarkPremium: number | null;
  onBenchmarkPremium: (next: number | null) => void;
  expansionState: boolean;
  onExpansionState: (next: boolean) => void;
}

/**
 * Step 1: the household every figure after it prices — who is on the plan,
 * how old they are, and what the benchmark plan costs where they live.
 *
 * With no curve of its own, the household itself stands where the chart
 * stands in step 2. The ages are here because they are what sets the
 * premium. Income is not: it is the axis of step 2's chart, and the slider
 * under that chart sets it. The three advanced inputs sit in the collapsed
 * block at the end because each starts at its default and at its default
 * leaves the chart identical.
 */
export const HouseholdStep: React.FC<HouseholdStepProps> = ({
  stepNumber,
  stepCount,
  year,
  scenario,
  adults,
  onAdults,
  age,
  onAge,
  spouseAge,
  onSpouseAge,
  dependents,
  onDependents,
  benchmarkPremium,
  onBenchmarkPremium,
  expansionState,
  onExpansionState,
}) => {
  const couple = adults === 2;
  const ages = couple ? [age, spouseAge] : [age];
  const average = averageBenchmarkMonthly(ages, dependents, year);
  const benchmark = benchmarkPremium ?? average;
  const ownPremium = benchmarkPremium !== null;
  const householdSize = householdSizeFor(scenario);
  const line = povertyLineFor(scenario);

  /** The advanced inputs that have been moved off their defaults, for the strip and the recap. */
  const advanced: { key: string; strip: string; node: React.ReactNode }[] = [];
  if (ownPremium) {
    advanced.push({
      key: 'premium',
      strip: `Premium ${formatCurrency(benchmark)}/mo`,
      node: (
        <>
          a benchmark premium of <strong>{formatCurrency(benchmark)}</strong> a month, set by hand
        </>
      ),
    });
  }
  if (dependents > 0) {
    advanced.push({
      key: 'dependents',
      strip: `${dependents} dependent${dependents === 1 ? '' : 's'}`,
      node: (
        <>
          <strong>{dependents}</strong> dependent{dependents === 1 ? '' : 's'}
        </>
      ),
    });
  }
  if (!expansionState) {
    advanced.push({
      key: 'expansion',
      strip: 'No expansion',
      node: <>a state that did <strong>not</strong> expand Medicaid</>,
    });
  }

  return (
    <section
      className="step step-config"
      id="step-household"
      tabIndex={-1}
      aria-labelledby="step-household-heading"
    >
      <p className="step-kicker">
        Step {stepNumber} of {stepCount}
      </p>
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

      <div className="input-group">
        <div className="slider-header">
          <label htmlFor="age">{couple ? 'Your age' : 'Age'}</label>
          <span className="slider-value">{age}</span>
        </div>
        <input
          id="age"
          type="range"
          min={MIN_ADULT_AGE}
          max={MAX_ADULT_AGE}
          step={1}
          value={age}
          onChange={(e) => onAge(Number(e.target.value))}
        />
        <div className="slider-range-labels">
          <span>{MIN_ADULT_AGE}</span>
          <span>{MAX_ADULT_AGE} (the last year before Medicare)</span>
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
              onChange={(e) => onSpouseAge(Number(e.target.value))}
            />
          </>
        )}
        <p className="field-note">
          Benchmark silver plan <strong>{formatCurrency(benchmark)}</strong> a month
          {ownPremium
            ? `, set by hand under Advanced inputs; the ${year} national average for ${
                couple ? 'these ages' : 'this age'
              } is ${formatCurrency(average)}.`
            : `: the ${year} national average for ${
                couple ? 'these ages' : 'this age'
              } — KFF’s ${formatCurrency(
                BENCHMARK_YEAR_PARAMS[year].monthlyAt40,
              )} for a ${BENCHMARK_REFERENCE_AGE}-year-old, scaled on the federal age curve. Your own county’s figure goes under Advanced inputs.`}{' '}
          Age sets the premium and nothing else here; the subsidy is a share of it.
        </p>
      </div>

      <details className="advanced-inputs">
        <summary>
          {/* Form 8962 line 11: the benchmark, and the household the line is sized for. */}
          <span className="line-ref" aria-hidden="true">
            8962
          </span>
          <span className="advanced-label">Advanced inputs</span>
          {advanced.length > 0 ? (
            <span className="advanced-state advanced-state-set">
              {advanced.map(({ strip }) => strip).join(' · ')}
            </span>
          ) : (
            <span className="advanced-state">At the defaults</span>
          )}
        </summary>

        <div className="input-group">
          <div className="checkbox-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={ownPremium}
                onChange={(e) => onBenchmarkPremium(e.target.checked ? average : null)}
              />
              <span>Set the benchmark premium myself</span>
            </label>
          </div>
          <div className="slider-header">
            <label htmlFor="benchmark-premium">Benchmark silver premium, per month</label>
            <span className="slider-value violet">{formatCurrency(benchmark)}</span>
          </div>
          <input
            id="benchmark-premium"
            type="range"
            min={0}
            max={MAX_PREMIUM_MONTHLY}
            step={25}
            value={benchmark}
            disabled={!ownPremium}
            onChange={(e) => onBenchmarkPremium(Number(e.target.value))}
            className="slider-violet"
          />
          <div className="slider-range-labels">
            <span>$0</span>
            <span>{formatCurrency(MAX_PREMIUM_MONTHLY)}</span>
          </div>
          <p className="field-note">
            The second-lowest-cost silver plan for everyone on the policy, before
            any subsidy. Your Marketplace shows it; so does KFF&apos;s calculator.
            New York and Vermont do not rate on age, and Alaska and Hawaii have
            higher poverty lines than the one drawn here.
          </p>
        </div>

        <div className="input-group">
          <div className="slider-header">
            <label htmlFor="dependents">Dependents on the plan</label>
            <span className="slider-value">{dependents}</span>
          </div>
          <input
            id="dependents"
            type="range"
            min={0}
            max={MAX_DEPENDENTS}
            step={1}
            value={dependents}
            onChange={(e) => onDependents(Number(e.target.value))}
          />
          <div className="slider-range-labels">
            <span>0</span>
            <span>{MAX_DEPENDENTS}</span>
          </div>
          <p className="field-note">
            Each one moves the poverty line by about {formatCurrency(5_500)} of income
            and adds a child&apos;s premium to the benchmark.
          </p>
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
            Forty states and DC have. There the subsidy begins at 138% of the
            poverty line, and under it the household is on Medicaid. In the ten
            that have not, it begins at 100%, and under that there is neither.
          </p>
        </div>
      </details>

      <p className="scenario-recap">
        One year&rsquo;s household: <strong>{year}</strong> coverage for{' '}
        <strong>{ADULTS_PROSE[adults]}</strong>, {agesProse(ages)}, on a benchmark silver plan
        at <strong>{formatCurrency(benchmark)}</strong> a month. The poverty line for{' '}
        {householdProse(householdSize)} is {formatCurrency(line)}.
        {advanced.length > 0 && (
          <>
            {' '}
            Plus <ProseList items={advanced.map(({ key, node }) => ({ key, node }))} />.
          </>
        )}
      </p>
    </section>
  );
};
