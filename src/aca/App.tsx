import { useMemo, useState } from 'react';
import {
  cliffCost as cliffCostFor,
  costCurve,
  creditLostBetween,
  creditRunsOutMagi,
  ptcCliffMagi,
  ptcFor,
  subsidyLines,
} from './lib/aca';
import { chartFor, chartFromFragment, fragmentFor } from './lib/charts';
import type { ChartId } from './lib/charts';
import { allInFor, rateAxis as rateAxisFor, rateCurve } from './lib/tax';
import { FURTHER_READING } from './lib/furtherReading';
import { useHousehold } from './hooks/useHousehold';
import { Page } from '../shared/components/Page';
import { Answer } from './components/Answer';
import { ChartChooser } from './components/ChartChooser';
import { CostStep, NEXT_BLOCK } from './components/CostStep';
import { HouseholdStep } from './components/HouseholdStep';
import { Notes } from './components/Notes';
import { RateAnswer } from './components/rate/RateAnswer';
import { RateStep } from './components/rate/RateStep';

/**
 * Put the chosen chart in the address bar as the fragment, and never take
 * the document down over it: `replaceState`, so Back still leaves and
 * nothing scrolls, and a `catch` because the address bar is a convenience.
 */
const writeChart = (chart: ChartId): void => {
  try {
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, '', `${pathname}${search}${fragmentFor(chart)}`);
  } catch {
    /* The address bar is a convenience, and the reading outranks it. */
  }
};

/**
 * One household, priced down the page: the chart the reader has chosen —
 * what the household pays, or what that comes to with income tax on top —
 * the figures at the point it stands on that chart, and the notes behind
 * them. The rail that describes the household stays beside all three, and
 * the other chart is one click away, in place.
 */
const App: React.FC = () => {
  /** Which chart is showing: what the fragment asked for, the cost chart by default. */
  const [chart, setChart] = useState<ChartId>(() => chartFromFragment(window.location.hash));
  const choose = (next: ChartId): void => {
    setChart(next);
    writeChart(next);
  };

  const h = useHousehold();
  const { year, income, scenario, axisMax, curveStep } = h;

  /** The first curve: what you pay, month by month, across every income. */
  const curve = useMemo(
    () => costCurve(scenario, { maxMagi: axisMax, step: curveStep }),
    [scenario, axisMax, curveStep],
  );
  /** The second: tax and premium as shares of income, across the same axis. */
  const rates = useMemo(
    () => rateCurve(scenario, { maxMagi: axisMax, step: curveStep }),
    [scenario, axisMax, curveStep],
  );

  const here = useMemo(() => ptcFor(income, scenario), [income, scenario]);
  const rate = useMemo(() => allInFor(income, scenario), [income, scenario]);
  const lines = useMemo(() => subsidyLines(scenario), [scenario]);
  const cliffCost = useMemo(() => cliffCostFor(scenario), [scenario]);
  const runsOutMagi = useMemo(() => creditRunsOutMagi(scenario), [scenario]);
  const rateAxis = useMemo(() => rateAxisFor(rates, rate.allInShare), [rates, rate.allInShare]);

  /** What the next $10,000 of income would cost in subsidy, cliff included if it is crossed. */
  const nextBlockCost = Math.round(creditLostBetween(income, income + NEXT_BLOCK, scenario));
  const cliffMagi = ptcCliffMagi(scenario);
  const nextBlockCrossesCliff =
    cliffMagi !== null && income <= cliffMagi && income + NEXT_BLOCK > cliffMagi;

  const incomeSliderStep = Math.max(500, curveStep);

  /** The button under the figures that sends the household as a link, whichever chart is showing. */
  const share = {
    canCopy: h.address.canCopy,
    copyState: h.address.copyState,
    onCopy: h.address.copy,
    label: 'Copy link',
    copied: 'Link copied.',
    failed: 'Couldn’t copy — the address bar holds the same link.',
  };

  return (
    <Page
      page="aca"
      title="The ACA Subsidy Slope"
      subtitle="On an ACA plan, you pay a set share of your household income and the subsidy pays the rest. When household income reaches 400% of the poverty line, the subsidy ends abruptly (the ACA subsidy cliff)."
      linkNotes={h.linkNotes}
      onDismissNotes={h.dismissNotes}
      skipTo={chartFor(chart).section}
      readings={FURTHER_READING}
      disclaimer="Educational only; not insurance, tax or financial advice. Figures are modelled from published HHS, IRS and CMS numbers and a national- or state-average premium unless you enter your own."
    >
      <HouseholdStep
        year={year}
        adults={h.adults}
        onAdults={h.setAdults}
        age={h.age}
        onAge={h.setAge}
        spouseAge={h.spouseAge}
        onSpouseAge={h.setSpouseAge}
        dependents={h.dependents}
        onDependents={h.setDependents}
        state={h.state}
        onState={h.setState}
        benchmarkPremium={h.benchmarkPremium}
        onBenchmarkPremium={h.setBenchmarkPremium}
      />

      <div className="flow">
        <ChartChooser chart={chart} onChart={choose} />

        {chart === 'cost' ? (
          <>
            <CostStep
              scenario={scenario}
              curve={curve}
              axisMax={axisMax}
              income={income}
              onIncome={h.setIncome}
              incomeSliderStep={incomeSliderStep}
              lines={lines}
              here={here}
            />

            <Answer
              year={year}
              adults={h.adults}
              ages={h.ages}
              state={h.state}
              income={income}
              here={here}
              nextBlock={NEXT_BLOCK}
              nextBlockCost={nextBlockCost}
              nextBlockCrossesCliff={nextBlockCrossesCliff}
              cliffCost={cliffCost}
              share={share}
            />
          </>
        ) : (
          <>
            <RateStep
              scenario={scenario}
              curve={rates}
              axisMax={axisMax}
              rateAxis={rateAxis}
              income={income}
              onIncome={h.setIncome}
              incomeSliderStep={incomeSliderStep}
              lines={lines}
              here={rate}
            />

            <RateAnswer
              year={year}
              adults={h.adults}
              ages={h.ages}
              state={h.state}
              income={income}
              here={rate}
              share={share}
            />
          </>
        )}
      </div>

      <Notes
        chart={chart}
        year={year}
        scenario={scenario}
        here={here}
        cliffCost={cliffCost}
        runsOutMagi={runsOutMagi}
        rate={rate}
      />
    </Page>
  );
};

export default App;
