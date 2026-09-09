import { useMemo, useState } from 'react';
import { subsidyLines } from './lib/aca';
import { FILING_STATUS_PROSE, allInFor, rateAxis as rateAxisFor, rateCurve } from './lib/tax';
import { householdPhrase } from './lib/householdProse';
import { pageHref } from './lib/pages';
import { rateReadoutText } from './lib/rateReadout';
import { useHousehold } from './hooks/useHousehold';
import type { Moved } from './hooks/useHousehold';
import { useSettledReading } from './hooks/useSettledReading';
import { FurtherReading } from './components/FurtherReading';
import { Header } from './components/Header';
import { HouseholdStep } from './components/HouseholdStep';
import { RateAnswer } from './components/rate/RateAnswer';
import { RateNotes } from './components/rate/RateNotes';
import { RateStep } from './components/rate/RateStep';

/**
 * The second page: the same household, and what it hands over all in —
 * federal income tax and the premium after the subsidy — as a share of its
 * income, across every income. The rail, the address bar and the household
 * are the cost page's; the curve, the figures and the notes are this one's.
 */
const RateApp: React.FC = () => {
  const [announceFrom, announce] = useState<Moved | null>(null);

  const h = useHousehold({ onMove: announce });
  const { year, income, scenario, axisMax, curveStep } = h;

  /** The one curve: tax and premium as shares of income, across every income. */
  const curve = useMemo(
    () => rateCurve(scenario, { maxMagi: axisMax, step: curveStep }),
    [scenario, axisMax, curveStep],
  );

  const here = useMemo(() => allInFor(income, scenario), [income, scenario]);
  const lines = useMemo(() => subsidyLines(scenario), [scenario]);
  const rateAxis = useMemo(() => rateAxisFor(curve, here.allInShare), [curve, here.allInShare]);

  const reading = ((): string => {
    switch (announceFrom) {
      case 'household':
        return `${year} for ${householdPhrase(h.adults, h.ages, h.state)}, ${
          FILING_STATUS_PROSE[here.filingStatus]
        }.`;
      case 'income':
        return rateReadoutText(here);
      default:
        return '';
    }
  })();

  const announcement = useSettledReading(reading);

  return (
    <div className="card">
      <a className="skip-link" href="#step-rate">
        Skip to the chart
      </a>

      <Header
        title="The All-In Rate"
        deck={
          <>
            On an ACA plan, what you pay for coverage is a set share of your income, and
            the subsidy takes back a slice of every dollar you earn. Add that to federal
            income tax and this is what a household really hands over at every income
            &mdash; and what happens to it at the 400% line.
          </>
        }
        sibling={{
          href: pageHref('cost', h.pageScenario),
          label: '← Back to the subsidy slope: what you pay each month',
        }}
        linkNotes={h.linkNotes}
        onDismissNotes={h.dismissNotes}
      />

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
          <RateStep
            scenario={scenario}
            curve={curve}
            axisMax={axisMax}
            rateAxis={rateAxis}
            income={income}
            onIncome={h.setIncome}
            incomeSliderStep={Math.max(500, curveStep)}
            lines={lines}
            here={here}
          />

          <RateAnswer
            year={year}
            adults={h.adults}
            ages={h.ages}
            state={h.state}
            income={income}
            here={here}
            canCopy={h.address.canCopy}
            copyState={h.address.copyState}
            onCopy={h.address.copy}
          />
        </div>

        <RateNotes year={year} here={here} />
      </main>

      <footer>
        <FurtherReading />
        <p>
          Educational only; not insurance, tax or financial advice. Figures are modelled
          from published HHS, IRS and CMS numbers and a national- or state-average premium
          unless you enter your own. The tax is the federal return with nothing unusual on
          it; see the notes for what is left out.
        </p>
      </footer>
    </div>
  );
};

export default RateApp;
