import { useMemo, useState } from 'react';
import {
  PAGE_COVERAGE_YEAR,
  axisMax as axisMaxFor,
  cliffCost as cliffCostFor,
  costCurve,
  creditLostBetween,
  ptcCliffMagi,
  ptcFor,
  subsidyLines,
} from './lib/aca';
import type { Adults, Scenario } from './lib/aca';
import { decodeScenario, engineScenario } from './lib/scenarioUrl';
import type { PageScenario } from './lib/scenarioUrl';
import { formatCents, formatCurrency, formatFpl } from './lib/format';
import { ADULTS_PROSE, agesProse } from './lib/householdProse';
import { useScenarioAddress } from './hooks/useScenarioAddress';
import { useSettledReading } from './hooks/useSettledReading';
import { Answer } from './components/Answer';
import { CostStep, NEXT_BLOCK } from './components/CostStep';
import { FurtherReading } from './components/FurtherReading';
import { Header } from './components/Header';
import { HouseholdStep } from './components/HouseholdStep';

/**
 * One worked example in two steps, in the order a reader builds it: the
 * household, then what its plan costs at every income and where on that curve
 * it stands. Both steps price the same household, so a figure set in step 1
 * is still set in step 2. The steps stay mounted and the window scrolls.
 */
const STEPS = ['household', 'cost'] as const;

type StepId = (typeof STEPS)[number];

/**
 * Sampling interval for the swept curve, and the step of the slider walking
 * it. The interval doubles once the axis does, so the widest chart a link can
 * ask for samples no more points than the narrowest always did.
 */
const curveStepFor = (axisMax: number): number => (axisMax > 200_000 ? 500 : 250);

const App: React.FC = () => {
  /** The household this opened with, read out of the address bar once. */
  const [openedWith] = useState(() => decodeScenario(window.location.search));
  const opening = openedWith.scenario;

  const [linkNotes, setLinkNotes] = useState<string[]>(() => openedWith.notes);

  /** The year every figure below is priced for. See `PAGE_COVERAGE_YEAR`. */
  const year = PAGE_COVERAGE_YEAR;
  const [adults, setAdults] = useState<Adults>(opening.adults);
  const [age, setAge] = useState<number>(opening.age);
  const [spouseAge, setSpouseAge] = useState<number>(opening.spouseAge);
  const [income, setIncome] = useState<number>(opening.income);
  const [dependents, setDependents] = useState<number>(opening.dependents);
  const [benchmarkPremium, setBenchmarkPremium] = useState<number | null>(opening.benchmarkPremium);
  const [expansionState, setExpansionState] = useState<boolean>(opening.expansionState);

  /**
   * Whose reading the live region is carrying, or null before the reader has
   * moved anything. One region, keyed to the control last touched, so a drag
   * is one announcement and arrival is none.
   */
  const [announceFrom, announce] = useState<StepId | null>(null);

  /** The household as the page holds it: what the address bar carries. */
  const pageScenario: PageScenario = useMemo(
    () => ({ adults, age, spouseAge, income, dependents, benchmarkPremium, expansionState }),
    [adults, age, spouseAge, income, dependents, benchmarkPremium, expansionState],
  );
  const address = useScenarioAddress(pageScenario);

  const household = (setter: () => void): void => {
    setter();
    announce('household');
  };

  /** The household in the shape the engine reads it: one object everything below prices off. */
  const scenario: Scenario = useMemo(
    () => ({ ...engineScenario(pageScenario), year }),
    [pageScenario, year],
  );

  const axisMax = useMemo(() => axisMaxFor(scenario), [scenario]);
  const curveStep = curveStepFor(axisMax);

  /** The one curve: what the household pays, month by month, across every income. */
  const curve = useMemo(
    () => costCurve(scenario, { maxMagi: axisMax, step: curveStep }),
    [scenario, axisMax, curveStep],
  );

  const here = useMemo(() => ptcFor(income, scenario), [income, scenario]);
  const lines = useMemo(() => subsidyLines(scenario), [scenario]);
  const cliffCost = useMemo(() => cliffCostFor(scenario), [scenario]);

  /** What the next $10,000 of income would cost in subsidy, cliff included if it is crossed. */
  const nextBlockCost = Math.round(creditLostBetween(income, income + NEXT_BLOCK, scenario));
  const cliffMagi = ptcCliffMagi(scenario);
  const nextBlockCrossesCliff =
    cliffMagi !== null && income <= cliffMagi && income + NEXT_BLOCK > cliffMagi;

  const ages = adults === 2 ? [age, spouseAge] : [age];

  /** What the live region will read out, once whatever changed it has settled. */
  const reading = ((): string => {
    switch (announceFrom) {
      case 'household':
        return `${year} coverage for ${ADULTS_PROSE[adults]}, ${agesProse(ages)}, on a benchmark silver plan at ${formatCurrency(
          here.benchmarkMonthly,
        )} a month.`;
      case 'cost':
        return here.netPremiumAnnual === null
          ? `At ${formatCurrency(income)} of household income, ${formatFpl(
              here.fplMultiple,
            )} of the poverty line, this household is under the floor and eligible for Medicaid.`
          : `At ${formatCurrency(income)} of household income, ${formatFpl(
              here.fplMultiple,
            )} of the poverty line, this household pays ${formatCurrency(
              Math.round(here.netPremiumAnnual / 12),
            )} a month for the benchmark plan and the subsidy is ${formatCurrency(
              here.credit,
            )} a year. The next dollar costs ${formatCents(here.slope)} of subsidy.`;
      default:
        return '';
    }
  })();

  const announcement = useSettledReading(reading);

  return (
    <div className="card">
      <a className="skip-link" href="#step-cost">
        Skip to the chart
      </a>

      <Header linkNotes={linkNotes} onDismissNotes={() => setLinkNotes([])} />

      <p className="live-reading" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <main className="shell">
        <HouseholdStep
          stepNumber={1}
          stepCount={STEPS.length}
          year={year}
          scenario={scenario}
          adults={adults}
          onAdults={(next) => household(() => setAdults(next))}
          age={age}
          onAge={(next) => household(() => setAge(next))}
          spouseAge={spouseAge}
          onSpouseAge={(next) => household(() => setSpouseAge(next))}
          dependents={dependents}
          onDependents={(next) => household(() => setDependents(next))}
          benchmarkPremium={benchmarkPremium}
          onBenchmarkPremium={(next) => household(() => setBenchmarkPremium(next))}
          expansionState={expansionState}
          onExpansionState={(next) => household(() => setExpansionState(next))}
        />

        <div className="flow">
          <CostStep
            stepNumber={2}
            stepCount={STEPS.length}
            year={year}
            scenario={scenario}
            curve={curve}
            axisMax={axisMax}
            income={income}
            onIncome={(next) => {
              setIncome(next);
              announce('cost');
            }}
            incomeSliderStep={Math.max(500, curveStep)}
            lines={lines}
            here={here}
            nextBlockCost={nextBlockCost}
            nextBlockCrossesCliff={nextBlockCrossesCliff}
            cliffCost={cliffCost}
          />

          <Answer
            year={year}
            adults={adults}
            ages={ages}
            income={income}
            here={here}
            nextBlock={NEXT_BLOCK}
            nextBlockCost={nextBlockCost}
            nextBlockCrossesCliff={nextBlockCrossesCliff}
            cliffCost={cliffCost}
            canCopy={address.canCopy}
            copyState={address.copyState}
            onCopy={address.copy}
          />
        </div>
      </main>

      <footer>
        <FurtherReading />
        <p>
          This tool is for educational purposes only and does not constitute
          insurance, tax or financial advice. Every figure is a model of published
          IRS, HHS and CMS numbers and a national-average premium; your Marketplace
          has facts a page like this never asks for.
        </p>
      </footer>
    </div>
  );
};

export default App;
