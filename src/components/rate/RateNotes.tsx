import type { CoverageYear } from '../../lib/aca';
import type { AllInAssessment } from '../../lib/tax';
import { PremiumAsTaxExplainer } from './explainers/PremiumAsTaxExplainer';
import { RateExplainer } from './explainers/RateExplainer';
import { RateLeftOutExplainer } from './explainers/RateLeftOutExplainer';

export interface RateNotesProps {
  year: CoverageYear;
  /** Where the household stands, so every note is priced at the reader's own income. */
  here: AllInAssessment;
}

/**
 * The notes, in the order a reader meets what they describe: how the rate
 * is figured, why the premium is in it, and what is not.
 */
export const RateNotes: React.FC<RateNotesProps> = ({ year, here }) => (
  <section className="notes-section" aria-label="Notes">
    <p className="notes-kicker">Notes</p>
    <RateExplainer here={here} year={year} />
    <PremiumAsTaxExplainer here={here} />
    <RateLeftOutExplainer />
  </section>
);
