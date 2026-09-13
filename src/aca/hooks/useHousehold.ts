import { useMemo, useState } from 'react';
import { PAGE_COVERAGE_YEAR, axisMax as axisMaxFor } from '../lib/aca';
import type { Adults, CoverageYear, Scenario, StateCode } from '../lib/aca';
import { decodeScenario, engineScenario, scenarioUrl } from '../lib/scenarioUrl';
import type { PageScenario } from '../lib/scenarioUrl';
import { useScenarioAddress } from '../../shared/hooks/useScenarioAddress';
import type { ScenarioAddress } from '../../shared/hooks/useScenarioAddress';

/**
 * Sampling interval for a swept curve, and the step of the slider walking
 * it. The interval doubles once the axis does, so the widest chart a link can
 * ask for samples no more points than the narrowest always did.
 */
export const curveStepFor = (axisMax: number): number => (axisMax > 200_000 ? 500 : 250);

/** The household as the page holds it, with everything both charts derive from it. */
export interface Household {
  /** The year every figure on the page is priced for. See `PAGE_COVERAGE_YEAR`. */
  year: CoverageYear;
  /** What the link that opened the page asked for and could not have, until dismissed. */
  linkNotes: string[];
  dismissNotes: () => void;

  adults: Adults;
  age: number;
  spouseAge: number;
  income: number;
  dependents: number;
  state: StateCode | null;
  benchmarkPremium: number | null;

  setAdults: (next: Adults) => void;
  setAge: (next: number) => void;
  setSpouseAge: (next: number) => void;
  setIncome: (next: number) => void;
  setDependents: (next: number) => void;
  setState: (next: StateCode | null) => void;
  setBenchmarkPremium: (next: number | null) => void;

  /** The adults' ages, as many as there are adults. */
  ages: number[];
  /** The household as the address bar carries it. */
  pageScenario: PageScenario;
  /** The household in the shape the engine reads it. */
  scenario: Scenario;
  /** The right edge of the income axis for this household. */
  axisMax: number;
  /** How finely the curve is sampled, and the slider's step. */
  curveStep: number;
  address: ScenarioAddress;
}

/**
 * One household, read out of the address bar once and held in state, with
 * the derived figures both charts price from it: the engine's view of it,
 * the axis they share, and the address bar kept in step.
 *
 * Apart from the composition root because what is here is the household
 * and what is there is the page.
 */
export function useHousehold(): Household {
  /** The household this opened with, read out of the address bar once. */
  const [openedWith] = useState(() => decodeScenario(window.location.search));
  const opening = openedWith.scenario;

  const [linkNotes, setLinkNotes] = useState<string[]>(() => openedWith.notes);

  const year = PAGE_COVERAGE_YEAR;
  const [adults, setAdults] = useState<Adults>(opening.adults);
  const [age, setAge] = useState<number>(opening.age);
  const [spouseAge, setSpouseAge] = useState<number>(opening.spouseAge);
  const [income, setIncome] = useState<number>(opening.income);
  const [dependents, setDependents] = useState<number>(opening.dependents);
  const [state, setState] = useState<StateCode | null>(opening.state);
  const [benchmarkPremium, setBenchmarkPremium] = useState<number | null>(opening.benchmarkPremium);

  const pageScenario: PageScenario = useMemo(
    () => ({ adults, age, spouseAge, income, dependents, state, benchmarkPremium }),
    [adults, age, spouseAge, income, dependents, state, benchmarkPremium],
  );
  const address = useScenarioAddress(pageScenario, scenarioUrl);

  const scenario: Scenario = useMemo(
    () => ({ ...engineScenario(pageScenario), year }),
    [pageScenario, year],
  );

  const axisMax = useMemo(() => axisMaxFor(scenario), [scenario]);

  return {
    year,
    linkNotes,
    dismissNotes: () => setLinkNotes([]),
    adults,
    age,
    spouseAge,
    income,
    dependents,
    state,
    benchmarkPremium,
    setAdults,
    setAge,
    setSpouseAge,
    setIncome,
    setDependents,
    setState,
    setBenchmarkPremium,
    ages: adults === 2 ? [age, spouseAge] : [age],
    pageScenario,
    scenario,
    axisMax,
    curveStep: curveStepFor(axisMax),
    address,
  };
}
