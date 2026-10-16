import {
  SENIOR_DEDUCTION_PHASEOUT_RATE,
  SENIOR_DEDUCTION_PHASEOUT_START,
  seniorDeductionPhaseoutEnd,
} from '../lib/tax';
import type {
  FilingStatus,
  PtcAssessment,
  PtcCliff,
  TaxYear,
} from '../lib/tax';
import { NotesSection } from '../../shared/components/NotesSection';
import { MitigationExplainer } from './explainers/MitigationExplainer';
import { SeniorDeductionExplainer } from './explainers/SeniorDeductionExplainer';
import { SubsidyCliffExplainer } from './explainers/SubsidyCliffExplainer';
import { TorpedoExplainer } from './explainers/TorpedoExplainer';

export interface NotesProps {
  year: TaxYear;
  filingStatus: FilingStatus;
  ssBenefit: number;
  /** How many people on the return have reached 65: 0, 1 or 2. */
  seniors: number;
  /** The 400% line when it is this return's to meet, and null when it is not. */
  subsidyCliff: PtcCliff | null;
  hereSubsidy: PtcAssessment;
}

/**
 * The notes, in the order a reader meets what they describe: the torpedo
 * itself, what can be done about it, the 400% line, and the senior deduction's
 * phaseout.
 */
export const Notes: React.FC<NotesProps> = ({
  year,
  filingStatus,
  ssBenefit,
  seniors,
  subsidyCliff,
  hereSubsidy,
}) => {
  const phaseoutStart = SENIOR_DEDUCTION_PHASEOUT_START[filingStatus];
  const phaseoutEnd = seniorDeductionPhaseoutEnd(filingStatus);
  // With the age toggle off there is nothing to phase out, but the explainer
  // still needs a rate to talk about, so describe one qualifying person.
  const phaseoutRate = SENIOR_DEDUCTION_PHASEOUT_RATE * Math.max(1, seniors);

  return (
    <NotesSection>
      <TorpedoExplainer filingStatus={filingStatus} />
      <MitigationExplainer />
      {/* Both halves of the condition, the same pair the Breakpoints panel
          uses. Whether anyone on the return is still buying their own coverage
          is the reader: nobody enrolled in Medicare can claim the credit. The
          cliff being non-null is the statute: the 400% ceiling was suspended
          from 2021 through 2025 and there is nothing to explain in a year
          without one. `PAGE_TAX_YEAR` has one — but the engine still prices
          both, so the guard stays. */}
      {subsidyCliff && (
        <SubsidyCliffExplainer
          cliff={subsidyCliff}
          here={hereSubsidy}
          ssBenefit={ssBenefit}
          filingStatus={filingStatus}
          year={year}
        />
      )}
      <SeniorDeductionExplainer
        phaseoutStart={phaseoutStart}
        phaseoutEnd={phaseoutEnd}
        phaseoutRate={phaseoutRate}
      />
    </NotesSection>
  );
};
