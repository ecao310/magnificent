import type { PtcAssessment, Scenario } from '../lib/aca';
import { NotesSection } from '../../shared/components/NotesSection';
import { CliffExplainer } from './explainers/CliffExplainer';
import { CreditExplainer } from './explainers/CreditExplainer';
import { FloorExplainer } from './explainers/FloorExplainer';
import { LeftOutExplainer } from './explainers/LeftOutExplainer';
import { SlopeExplainer } from './explainers/SlopeExplainer';

export interface NotesProps {
  scenario: Scenario;
  /** Where the household stands against the subsidy, so every note is priced at the reader's own income. */
  here: PtcAssessment;
  cliffCost: number | null;
}

/**
 * The notes behind the figures, in the order a reader meets what they
 * describe: how the subsidy is figured, what the next dollar costs, the line
 * the whole thing ends at, the line it starts at, and what is not priced.
 * Both charts price the same subsidy, so both carry the same notes.
 */
export const Notes: React.FC<NotesProps> = ({ scenario, here, cliffCost }) => (
  <NotesSection>
    <CreditExplainer here={here} />
    <SlopeExplainer here={here} />
    {here.cliffApplies && <CliffExplainer here={here} cliffCost={cliffCost} />}
    <FloorExplainer here={here} expansionState={scenario.expansionState !== false} />
    <LeftOutExplainer />
  </NotesSection>
);
