import type { CoverageYear, PtcAssessment, Scenario } from '../lib/aca';
import { CliffExplainer } from './explainers/CliffExplainer';
import { CreditExplainer } from './explainers/CreditExplainer';
import { FloorExplainer } from './explainers/FloorExplainer';
import { LeftOutExplainer } from './explainers/LeftOutExplainer';
import { SlopeExplainer } from './explainers/SlopeExplainer';

export interface NotesProps {
  year: CoverageYear;
  scenario: Scenario;
  /** Where the household stands, so every note is priced at the reader's own income. */
  here: PtcAssessment;
  cliffCost: number | null;
}

/**
 * The notes, in the order a reader meets what they describe: how the subsidy
 * is figured, what the next dollar costs, the line the whole thing ends at,
 * the line it starts at, and what is not priced here at all.
 *
 * Below the figures rather than beside them: the figures are the answer, and
 * these are the working. Each is numbered by the stylesheet, so a note added
 * or dropped renumbers the rest.
 */
export const Notes: React.FC<NotesProps> = ({ year, scenario, here, cliffCost }) => (
  <section className="notes-section" aria-label="Notes">
    <p className="notes-kicker">Notes</p>
    <CreditExplainer here={here} year={year} />
    <SlopeExplainer here={here} year={year} />
    {here.cliffApplies && <CliffExplainer here={here} cliffCost={cliffCost} year={year} />}
    <FloorExplainer here={here} expansionState={scenario.expansionState !== false} />
    <LeftOutExplainer />
  </section>
);
