import { useState } from 'react';
import { ADDED_KINDS, MAX_ADDED } from '../lib/scenarioUrl';
import type {
  AddedKind,
  BlockCost,
  NextDollar,
  PtcAssessment,
  Scenario,
  SubsidyLine,
  TaxYear,
} from '../lib/tax';
import { formatCurrency, formatFpl, formatPercent } from '../lib/format';
import { ADDED_KIND_LABELS, ADDED_KIND_PROSE, otherKind } from '../lib/returnProse';
import { BreakpointsMenu } from './BreakpointsMenu';
import { SlopeChart } from './SlopeChart';
import type { BlockPoint } from './SlopeChart';
import { CliffExplainer } from './explainers/CliffExplainer';
import { ConversionExplainer } from './explainers/ConversionExplainer';
import { CreditExplainer } from './explainers/CreditExplainer';
import { FloorExplainer } from './explainers/FloorExplainer';
import { HarvestExplainer } from './explainers/HarvestExplainer';
import { LeftOutExplainer } from './explainers/LeftOutExplainer';
import { ReconciliationExplainer } from './explainers/ReconciliationExplainer';
import { SlopeExplainer } from './explainers/SlopeExplainer';

/**
 * The two sentences that describe the axis end to end: the plot's accessible
 * name, and the caption under it.
 */
const axisProse = (axisMax: number, base: number): { label: string; caption: string } => ({
  caption: `Household income ($), the MAGI the credit is measured on. The base — ${formatCurrency(
    base,
  )} — is what this household has before the block.`,
  label:
    'Chart: the all-in rate on the next dollar of household income — federal tax plus ' +
    'premium tax credit given back — as a Roth conversion and as a harvested gain, ' +
    `plotted against household income from $0 to ${formatCurrency(axisMax)}, with the ` +
    `block the reader is adding hatched from ${formatCurrency(base)}.`,
});

/** "$0 of federal tax and $1,709 of premium tax credit given back", with the figures bolded. */
const splitProse = (block: BlockCost): React.ReactNode =>
  block.tax === 0 ? (
    <>
      all of it premium tax credit given back and none of it federal tax
    </>
  ) : block.credit === 0 ? (
    <>
      all of it federal tax and none of it premium tax credit
    </>
  ) : (
    <>
      <strong>{formatCurrency(block.tax)}</strong> of federal tax and{' '}
      <strong>{formatCurrency(block.credit)}</strong> of premium tax credit given back
    </>
  );

export interface SlopeStepProps {
  stepNumber: number;
  stepCount: number;
  year: TaxYear;
  scenario: Scenario;
  curve: BlockPoint[];
  axisMax: number;
  added: number;
  onAdded: (next: number) => void;
  addedKind: AddedKind;
  onAddedKind: (next: AddedKind) => void;
  addedSliderStep: number;
  /** Every line the credit puts on this axis; which are drawn is this step's own state. */
  lines: SubsidyLine[];
  /** Where the household stands with the block added. */
  here: PtcAssessment;
  /** The block priced as the strip says, and as the other kind. */
  block: BlockCost;
  otherBlock: BlockCost;
  /** The next dollar at the household's own point, for a block of nothing. */
  next: NextDollar;
  cliffCost: number | null;
  zeroBandTop: number;
}

/**
 * Step 2: what the block does to the credit step 1's household collects.
 *
 * The chart, then the strip that says what the block is and the slider that
 * says how big, then the collapsed notes. Which lines are drawn is the one
 * piece of state that belongs to this step and nowhere else: the credit's
 * edges start on, because every reader meets them; the cost-sharing tiers
 * start off, because they belong only to a reader buying silver.
 */
export const SlopeStep: React.FC<SlopeStepProps> = ({
  stepNumber,
  stepCount,
  year,
  scenario,
  curve,
  axisMax,
  added,
  onAdded,
  addedKind,
  onAddedKind,
  addedSliderStep,
  lines,
  here,
  block,
  otherBlock,
  next,
  cliffCost,
  zeroBandTop,
}) => {
  const [showEdges, setShowEdges] = useState(true);
  const [showCsr, setShowCsr] = useState(false);

  const axisDomain: [number, number] = [curve[0].magi, curve[curve.length - 1].magi];
  const { label, caption } = axisProse(axisMax, block.from);
  const drawn = lines.filter(
    (line) =>
      line.magi <= axisMax && ((line.kind === 'edge' && showEdges) || (line.kind === 'csr' && showCsr)),
  );
  const floor = lines.find((line) => line.id === 'floor');
  const nextRate = (kind: AddedKind): number =>
    (kind === 'conversion' ? next.conversionTax : next.harvestTax) + next.credit;

  return (
    <section className="step" id="step-slope" tabIndex={-1} aria-labelledby="step-slope-heading">
      <p className="step-kicker">
        Step {stepNumber} of {stepCount}
      </p>
      <h2 className="step-heading" id="step-slope-heading">
        The subsidy slope
      </h2>
      <p className="step-deck">
        The all-in rate on the next dollar of household income &mdash; federal tax plus
        premium tax credit given back &mdash; for a conversion and for a harvested gain.
      </p>

      <figure className="chart-figure">
        <BreakpointsMenu
          linesShown={drawn.length}
          showEdges={showEdges}
          onShowEdges={setShowEdges}
          showCsr={showCsr}
          onShowCsr={setShowCsr}
          floorLabel={floor?.label ?? ''}
          hasCliff={lines.some((line) => line.id === 'cliff')}
        />
        <SlopeChart
          curve={curve}
          axisDomain={axisDomain}
          here={block.to}
          lines={drawn}
          kind={addedKind}
          label={label}
          caption={caption}
          scenario={scenario}
        />
      </figure>

      <div className="input-group chart-slider">
        <fieldset className="kind-strip">
          <legend>What are you adding this year?</legend>
          <div className="segmented">
            {ADDED_KINDS.map((value) => (
              <label key={value} className="segmented-option">
                <input
                  type="radio"
                  name="added-kind"
                  value={value}
                  checked={addedKind === value}
                  onChange={() => onAddedKind(value)}
                />
                <span>{ADDED_KIND_LABELS[value]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="slider-header">
          <label htmlFor="added">Amount to add</label>
          <span className="slider-value amber">{formatCurrency(added)}</span>
        </div>
        <input
          id="added"
          type="range"
          min={0}
          max={MAX_ADDED}
          step={addedSliderStep}
          value={added}
          onChange={(e) => onAdded(Number(e.target.value))}
          className="slider-amber"
        />
        <div className="slider-range-labels">
          <span>$0</span>
          <span>{formatCurrency(MAX_ADDED)}</span>
        </div>

        <p className="slider-readout">
          {added > 0 ? (
            <>
              Adding {formatCurrency(added)} as {ADDED_KIND_PROSE[addedKind]}, from{' '}
              {formatCurrency(block.from)} to {formatCurrency(block.to)} of household income
              ({formatFpl(here.fplMultiple)} of the poverty line), costs{' '}
              <strong>{block.rate !== null ? formatPercent(block.rate) : '—'}</strong> of it
              &mdash; <strong>{formatCurrency(block.total)}</strong>, {splitProse(block)}.
              {block.crossesCliff ? (
                <>
                  {' '}
                  The block crosses the 400% line, so the whole credit is in that figure.
                </>
              ) : null}{' '}
              As {ADDED_KIND_PROSE[otherKind(addedKind)]} it would cost{' '}
              <strong>{formatCurrency(otherBlock.total)}</strong>
              {otherBlock.rate !== null ? `, ${formatPercent(otherBlock.rate)}` : ''}.
            </>
          ) : (
            <>
              At {formatCurrency(block.from)} of household income (
              {formatFpl(here.fplMultiple)} of the poverty line) the next dollar as{' '}
              {ADDED_KIND_PROSE[addedKind]} costs{' '}
              <strong>{formatPercent(nextRate(addedKind))}</strong>:{' '}
              <strong>
                {formatPercent(addedKind === 'conversion' ? next.conversionTax : next.harvestTax)}
              </strong>{' '}
              in federal tax and <strong>{formatPercent(next.credit)}</strong> in credit given
              back. As {ADDED_KIND_PROSE[otherKind(addedKind)]},{' '}
              <strong>{formatPercent(nextRate(otherKind(addedKind)))}</strong>.
            </>
          )}
        </p>
      </div>

      <p className="notes-kicker">Notes</p>
      <CreditExplainer here={here} year={year} />
      <SlopeExplainer here={here} year={year} />
      {here.cliffApplies && <CliffExplainer here={here} cliffCost={cliffCost} year={year} />}
      <HarvestExplainer
        block={addedKind === 'harvest' ? block : otherBlock}
        here={here}
        zeroBandTop={zeroBandTop}
      />
      <ConversionExplainer
        block={addedKind === 'conversion' ? block : otherBlock}
        here={here}
        cliffCost={cliffCost}
      />
      <FloorExplainer here={here} expansionState={scenario.expansionState !== false} />
      <ReconciliationExplainer year={year} />
      <LeftOutExplainer />
    </section>
  );
};
