import type { CoverageYear, PtcAssessment, Scenario } from '../lib/aca';
import type { ChartId } from '../lib/charts';
import type { AllInAssessment } from '../lib/tax';
import { CliffExplainer } from './explainers/CliffExplainer';
import { CreditExplainer } from './explainers/CreditExplainer';
import { FloorExplainer } from './explainers/FloorExplainer';
import { LeftOutExplainer } from './explainers/LeftOutExplainer';
import { SlopeExplainer } from './explainers/SlopeExplainer';
import { PremiumAsTaxExplainer } from './rate/explainers/PremiumAsTaxExplainer';
import { RateExplainer } from './rate/explainers/RateExplainer';

export interface NotesProps {
  /** Which chart is showing, and so which notes are its working. */
  chart: ChartId;
  year: CoverageYear;
  scenario: Scenario;
  /** Where the household stands against the subsidy, so every note is priced at the reader's own income. */
  here: PtcAssessment;
  cliffCost: number | null;
  /** The same standing with the tax added, for the rate chart's notes. */
  rate: AllInAssessment;
}

/**
 * The notes behind whichever chart is showing, in the order a reader meets
 * what they describe. Under the cost chart: how the subsidy is figured, what
 * the next dollar costs, the line the whole thing ends at, the line it
 * starts at, and what is not priced. Under the rate chart: how the tax is
 * added, why the premium is on that side of the ledger, and what is not
 * priced on either side.
 *
 * Below the figures rather than beside them: the figures are the answer, and
 * these are the working. Each is numbered by the stylesheet, so a note added
 * or dropped renumbers the rest.
 */
export const Notes: React.FC<NotesProps> = ({ chart, year, scenario, here, cliffCost, rate }) => (
  <section className="notes-section" aria-label="Notes">
    <p className="notes-kicker">Notes</p>
    {chart === 'cost' ? (
      <>
        <CreditExplainer here={here} year={year} />
        <SlopeExplainer here={here} year={year} />
        {here.cliffApplies && <CliffExplainer here={here} cliffCost={cliffCost} year={year} />}
        <FloorExplainer here={here} expansionState={scenario.expansionState !== false} />
        <LeftOutExplainer />
      </>
    ) : (
      <>
        <RateExplainer here={rate} year={year} />
        <PremiumAsTaxExplainer here={rate} />
        <LeftOutExplainer tax />
      </>
    )}
  </section>
);
