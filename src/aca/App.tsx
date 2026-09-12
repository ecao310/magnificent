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
import { formatCurrency } from './lib/format';
import { householdPhrase } from './lib/householdProse';
import { rateReadoutText } from './lib/rateReadout';
import { readoutText } from './lib/readout';
import { useHousehold } from './hooks/useHousehold';
import type { Moved } from './hooks/useHousehold';
import { useSettledReading } from '../shared/hooks/useSettledReading';
import { Answer } from './components/Answer';
import { ChartChooser } from './components/ChartChooser';
import { CostStep, NEXT_BLOCK } from './components/CostStep';
import { FurtherReading } from './components/FurtherReading';
import { Header } from './components/Header';
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
  /**
   * Whose reading the live region is carrying, or null before the reader has
   * moved anything. One region, keyed to the control last touched, so a drag
   * is one announcement and arrival is none.
   */
  const [announceFrom, announce] = useState<Moved | null>(null);

  /** Which chart is showing: what the fragment asked for, the cost chart by default. */
  const [chart, setChart] = useState<ChartId>(() => chartFromFragment(window.location.hash));
  const choose = (next: ChartId): void => {
    setChart(next);
    writeChart(next);
  };

  const h = useHousehold({ onMove: announce });
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

  /** What the live region will read out, once whatever changed it has settled. */
  const reading = ((): string => {
    switch (announceFrom) {
      case 'household':
        return `${year} coverage for ${householdPhrase(h.adults, h.ages, h.state)}, benchmark ${formatCurrency(
          here.benchmarkMonthly,
        )} a month.`;
      case 'income':
        return chart === 'rate' ? rateReadoutText(rate) : readoutText(here);
      default:
        return '';
    }
  })();

  const announcement = useSettledReading(reading);

  return (
    <div className="card">
      <a className="skip-link" href={`#${chartFor(chart).section}`}>
        Skip to the chart
      </a>

      <Header linkNotes={h.linkNotes} onDismissNotes={h.dismissNotes} />

      <p className="live-reading" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <main className="shell">
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
                canCopy={h.address.canCopy}
                copyState={h.address.copyState}
                onCopy={h.address.copy}
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
                canCopy={h.address.canCopy}
                copyState={h.address.copyState}
                onCopy={h.address.copy}
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
      </main>

      <footer>
        <FurtherReading />
        <p>
          Educational only; not insurance, tax or financial advice. Figures are modelled
          from published HHS, IRS and CMS numbers and a national- or state-average premium
          unless you enter your own.
        </p>
      </footer>
    </div>
  );
};

export default App;
