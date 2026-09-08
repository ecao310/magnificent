import { useMemo, useState } from 'react';
import {
  PAGE_TAX_YEAR,
  axisMax as axisMaxFor,
  blockCost,
  cliffCost as cliffCostFor,
  filingParams,
  householdIncomeFor,
  nextDollarAt,
  ptcFor,
  slopeCurve,
  subsidyLines,
  totalTax,
} from './lib/tax';
import type { AddedKind, FilingStatus, Scenario } from './lib/tax';
import { decodeScenario, engineScenario } from './lib/scenarioUrl';
import type { PageScenario } from './lib/scenarioUrl';
import { formatCurrency, formatFpl, formatPercent } from './lib/format';
import { ADDED_KIND_PROSE, FILING_STATUS_PROSE, agesProse, otherKind } from './lib/returnProse';
import { useScenarioAddress } from './hooks/useScenarioAddress';
import { useSettledReading } from './hooks/useSettledReading';
import { Answer } from './components/Answer';
import { FurtherReading } from './components/FurtherReading';
import { Header } from './components/Header';
import { HouseholdStep } from './components/HouseholdStep';
import { SlopeStep } from './components/SlopeStep';
import type { BlockPoint } from './components/SlopeChart';

/**
 * One worked example in two steps, in the order a reader builds it: the
 * household and what it has regardless, then the block it is thinking of
 * adding and what that block costs. Both steps price the same household, so a
 * figure set in step 1 is still set in step 2.
 *
 * The steps stay mounted and the window scrolls, for the reasons the page
 * before this one gave: a step you have to click into existence reads as
 * optional, step 2 quotes figures the reader set in step 1, and printing or
 * Ctrl-F reaches everything. What is left of the list is the pair of facts
 * nothing else can supply — `StepId`, which the live region is keyed to, and
 * the count the step kickers number themselves out of.
 */
const STEPS = ['household', 'slope'] as const;

type StepId = (typeof STEPS)[number];

/**
 * Sampling interval for the swept curves, and the step of the slider walking
 * them. The interval doubles once the axis does, so the widest chart a link
 * can ask for samples no more points than the narrowest always did.
 */
const curveStepFor = (axisMax: number): number => (axisMax > 200_000 ? 500 : 250);

const App: React.FC = () => {
  /** The household this opened with, read out of the address bar once. */
  const [openedWith] = useState(() => decodeScenario(window.location.search));
  const opening = openedWith.scenario;

  const [linkNotes, setLinkNotes] = useState<string[]>(() => openedWith.notes);

  /** The year every figure below is priced for. See `PAGE_TAX_YEAR`. */
  const year = PAGE_TAX_YEAR;
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(opening.filingStatus);
  const [age, setAge] = useState<number>(opening.age);
  const [spouseAge, setSpouseAge] = useState<number>(opening.spouseAge);
  const [ordinaryIncome, setOrdinaryIncome] = useState<number>(opening.ordinaryIncome);
  const [qualifiedIncome, setQualifiedIncome] = useState<number>(opening.qualifiedIncome);
  const [added, setAdded] = useState<number>(opening.added);
  const [addedKind, setAddedKind] = useState<AddedKind>(opening.addedKind);
  const [dependents, setDependents] = useState<number>(opening.dependents);
  const [benchmarkPremium, setBenchmarkPremium] = useState<number | null>(opening.benchmarkPremium);
  const [expansionState, setExpansionState] = useState<boolean>(opening.expansionState);

  /**
   * Whose reading the live region is carrying, or null before the reader has
   * moved anything. One region, keyed to the control last touched, so a drag
   * is one announcement and arrival is none.
   */
  const [announceFrom, announce] = useState<StepId | null>(null);

  /**
   * The household as the page holds it, which is what the address bar carries
   * and what the engine's view is built from.
   */
  const pageScenario: PageScenario = useMemo(
    () => ({
      filingStatus,
      age,
      spouseAge,
      ordinaryIncome,
      qualifiedIncome,
      added,
      addedKind,
      dependents,
      benchmarkPremium,
      expansionState,
    }),
    [
      filingStatus,
      age,
      spouseAge,
      ordinaryIncome,
      qualifiedIncome,
      added,
      addedKind,
      dependents,
      benchmarkPremium,
      expansionState,
    ],
  );
  const address = useScenarioAddress(pageScenario);

  const household = (setter: () => void): void => {
    setter();
    announce('household');
  };

  /**
   * The household in the shape the engine reads it: one object that
   * everything below prices off, rather than a different subset of the state
   * at each call site.
   */
  const scenario: Scenario = useMemo(
    () => ({ ...engineScenario(pageScenario), year }),
    [pageScenario, year],
  );

  const axisMax = useMemo(() => axisMaxFor(scenario), [scenario]);
  const curveStep = curveStepFor(axisMax);

  /** The block priced as the strip says, and as the other kind. */
  const block = useMemo(() => blockCost(scenario), [scenario]);
  const otherBlock = useMemo(() => blockCost(scenario, otherKind(addedKind)), [scenario, addedKind]);

  /**
   * Both curves, with the block picked out under the current one: the hatch
   * is drawn from the base to the base plus the block, and nowhere else.
   */
  const curve: BlockPoint[] = useMemo(() => {
    const key = addedKind === 'conversion' ? 'conversionRate' : 'harvestRate';
    return slopeCurve(scenario, { maxMagi: axisMax, step: curveStep }).map((point) => ({
      ...point,
      blockRate:
        block.added > 0 && point.magi >= block.from && point.magi <= block.to
          ? point[key]
          : undefined,
    }));
  }, [scenario, axisMax, curveStep, addedKind, block]);

  const magi = householdIncomeFor(scenario);
  const here = useMemo(() => ptcFor(magi, scenario), [magi, scenario]);
  const next = useMemo(() => nextDollarAt(magi, scenario), [magi, scenario]);
  const lines = useMemo(() => subsidyLines(scenario), [scenario]);
  const cliffCost = useMemo(() => cliffCostFor(scenario), [scenario]);
  const tax = Math.round(totalTax(scenario));

  /**
   * The top of the 0% gain band in household income for this household: the
   * standard deduction plus the band, which holds as long as ordinary income
   * does not itself run past the band.
   */
  const zeroBandTop = ((): number => {
    const { standardDeduction, ltcgBrackets } = filingParams(year, filingStatus);
    return standardDeduction + ltcgBrackets[0].upTo;
  })();

  const ages = filingStatus === 'mfj' ? [age, spouseAge] : [age];

  /** What the live region will read out, once whatever changed it has settled. */
  const reading = ((): string => {
    switch (announceFrom) {
      case 'household':
        return `${year}, ${FILING_STATUS_PROSE[filingStatus]}, ${agesProse(ages)}, with ${formatCurrency(
          ordinaryIncome,
        )} of ordinary income and ${formatCurrency(
          qualifiedIncome,
        )} of qualified dividends and gains, on a benchmark silver plan at ${formatCurrency(
          here.benchmarkMonthly,
        )} a month.`;
      case 'slope':
        return added > 0
          ? `Adding ${formatCurrency(added)} as ${ADDED_KIND_PROSE[addedKind]} takes household income to ${formatCurrency(
              block.to,
            )}, ${formatFpl(here.fplMultiple)} of the poverty line, and costs ${formatCurrency(
              block.total,
            )}: ${formatCurrency(block.tax)} of federal tax and ${formatCurrency(
              block.credit,
            )} of premium tax credit, ${block.rate !== null ? formatPercent(block.rate) : '0%'} of what was added.`
          : `At ${formatCurrency(block.from)} of household income the next dollar as ${
              ADDED_KIND_PROSE[addedKind]
            } costs ${formatPercent(
              (addedKind === 'conversion' ? next.conversionTax : next.harvestTax) + next.credit,
            )}.`;
      default:
        return '';
    }
  })();

  const announcement = useSettledReading(reading);

  return (
    <div className="card">
      <a className="skip-link" href="#step-slope">
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
          filingStatus={filingStatus}
          onFilingStatus={(next) => household(() => setFilingStatus(next))}
          age={age}
          onAge={(next) => household(() => setAge(next))}
          spouseAge={spouseAge}
          onSpouseAge={(next) => household(() => setSpouseAge(next))}
          ordinaryIncome={ordinaryIncome}
          onOrdinaryIncome={(next) => household(() => setOrdinaryIncome(next))}
          qualifiedIncome={qualifiedIncome}
          onQualifiedIncome={(next) => household(() => setQualifiedIncome(next))}
          dependents={dependents}
          onDependents={(next) => household(() => setDependents(next))}
          benchmarkPremium={benchmarkPremium}
          onBenchmarkPremium={(next) => household(() => setBenchmarkPremium(next))}
          expansionState={expansionState}
          onExpansionState={(next) => household(() => setExpansionState(next))}
        />

        <div className="flow">
          <SlopeStep
            stepNumber={2}
            stepCount={STEPS.length}
            year={year}
            scenario={scenario}
            curve={curve}
            axisMax={axisMax}
            added={added}
            onAdded={(next) => {
              setAdded(next);
              announce('slope');
            }}
            addedKind={addedKind}
            onAddedKind={(next) => {
              setAddedKind(next);
              announce('slope');
            }}
            addedSliderStep={Math.max(500, curveStep)}
            lines={lines}
            here={here}
            block={block}
            otherBlock={otherBlock}
            next={next}
            cliffCost={cliffCost}
            zeroBandTop={zeroBandTop}
          />

          <Answer
            year={year}
            filingStatus={filingStatus}
            ages={ages}
            ordinaryIncome={ordinaryIncome}
            qualifiedIncome={qualifiedIncome}
            addedKind={addedKind}
            here={here}
            block={block}
            otherBlock={otherBlock}
            next={next}
            tax={tax}
            canCopy={address.canCopy}
            copyState={address.copyState}
            onCopy={address.copy}
          />
        </div>
      </main>

      <footer>
        <FurtherReading />
        <p>
          This tool is for educational purposes only and does not constitute tax,
          insurance or financial advice. Every figure is a model of published IRS, HHS
          and CMS numbers and a national-average premium; your Marketplace and your
          return have facts a page like this never asks for.
        </p>
      </footer>
    </div>
  );
};

export default App;
