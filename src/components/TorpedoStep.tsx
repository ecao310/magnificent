import type {
  FilingStatus,
  IrmaaCliff,
  MarginalRatePoint,
  PtcCliff,
  TaxYear,
} from '../lib/tax';
import { formatCurrency, formatPercent } from '../lib/format';
import { BreakpointsMenu } from './BreakpointsMenu';
import { TorpedoChart } from './TorpedoChart';
import { useState } from 'react';

/**
 * The two sentences that describe the axis end to end rather than a figure on
 * it: the plot's accessible name, and the caption under it.
 *
 * Both offered the reader an addition — a benefit that does not move, plus $0
 * to the right edge of other income — and both named the benefit and stopped
 * there, so both stopped adding up the moment the muni slider moved. At $3,750
 * of municipal interest the opening line said the axis began at $28,602 while
 * the arithmetic beside it reached $24,852. They are built from one list now.
 *
 * Each part appears only when it is non-zero, so a return with no benefit and
 * no municipal interest gets the bare axis name rather than a sentence about
 * two zeroes.
 */
const axisProse = (
  ssBenefit: number,
  muniInterest: number,
  axisDomain: [number, number],
  axisMax: number,
): { label: string; caption: string } => {
  const includes = [
    ssBenefit > 0 ? `${formatCurrency(ssBenefit)} of Social Security` : '',
    muniInterest > 0 ? `${formatCurrency(muniInterest)} of municipal interest` : '',
  ].filter(Boolean);

  const fixed =
    includes.length > 0
      ? includes.join(' and ')
      : `${formatCurrency(ssBenefit)} of Social Security`;

  return {
    caption:
      'Total income ($)' +
      (includes.length > 0 ? `, including ${includes.join(' and ')}.` : ''),
    label:
      'Chart: the marginal tax rate on the next dollar of other income, plotted ' +
      `against total income from ${formatCurrency(axisDomain[0])} to ` +
      `${formatCurrency(axisDomain[1])} — a fixed ${fixed} plus $0 to ` +
      `${formatCurrency(axisMax)} of other income.`,
  };
};

export interface TorpedoStepProps {
  year: TaxYear;
  filingStatus: FilingStatus;
  ssBenefit: number;
  muniInterest: number;
  beneficiaries: number;
  ordinaryIncome: number;
  onOrdinaryIncome: (next: number) => void;
  /** The swept curve, and the axis it was swept across. */
  curve: MarginalRatePoint[];
  axisMax: number;
  incomeSliderStep: number;
  /** Where the reader is standing, read back off the curve. */
  herePoint: MarginalRatePoint | undefined;
  totalIncome: number;
  totalIncomeAt: (otherIncome: number) => number;
  /** The IRMAA cliffs the axis reaches. */
  cliffsOnChart: IrmaaCliff[];
  /** The 400% line when it is this return's to meet, and null when it is not. */
  subsidyCliff: PtcCliff | null;
  subsidyCliffOnChart: PtcCliff | null;
}

/**
 * What other income does to the benefit the rail set.
 *
 * The chart, then the one control that says where on that chart the reader is
 * standing: a slider inset to the plot area, so the thumb stands under the
 * marker, and the sentence under it prices the point the marker is on. The
 * plot is a cursor too — a tap, a click or a finger drawn along it moves the
 * same marker — so on a phone the slider is the second way rather than the
 * only one. The
 * notes are a section of their own, under the figures. Which of the two
 * threshold lines are drawn is the one piece of state that belongs to this
 * step and nowhere else — neither is income tax. The Medicare cliffs start on, because every
 * reader meets them sooner or later; the 400% line starts off, because it
 * belongs only to a reader still buying their own coverage. What each costs *this*
 * return is in the close rather than on the plot. Not in the query string
 * either: every key there describes the return, and a link carries a scenario
 * rather than a view of it. See `scenarioUrl`.
 */
export const TorpedoStep: React.FC<TorpedoStepProps> = ({
  year,
  filingStatus,
  ssBenefit,
  muniInterest,
  beneficiaries,
  ordinaryIncome,
  onOrdinaryIncome,
  curve,
  axisMax,
  incomeSliderStep,
  herePoint,
  totalIncome,
  totalIncomeAt,
  cliffsOnChart,
  subsidyCliff,
  subsidyCliffOnChart,
}) => {
  const [showIrmaaLines, setShowIrmaaLines] = useState(false);
  const [showSubsidyLine, setShowSubsidyLine] = useState(false);

  /**
   * The chart's x-axis, in the income the return actually takes in.
   *
   * The sweep is still every dollar of *other* income from nothing to the
   * right edge — that is the one figure the reader sets, and the slider, the
   * segments and every threshold are still measured in it. What changed is
   * what the axis is drawn in: a reader looking at the hump wants to know what
   * income puts them on it, and "$41,000" was only ever half an answer,
   * because the benefit sitting underneath it is income too.
   *
   * Read off the curve's own ends rather than recomputed, so the axis cannot
   * span anything the plot does not.
   */
  const axisDomain: [number, number] = [
    curve[0].totalIncome,
    curve[curve.length - 1].totalIncome,
  ];
  const { label, caption } = axisProse(ssBenefit, muniInterest, axisDomain, axisMax);

  const drawnCliffs = showIrmaaLines ? cliffsOnChart : [];
  const drawnSubsidyCliff = showSubsidyLine ? subsidyCliffOnChart : null;

  const effectiveRate = (tax: number): number =>
    totalIncome > 0 ? tax / totalIncome : 0;

  return (
    <section
      className="step"
      id="step-torpedo"
      tabIndex={-1}
      aria-labelledby="step-torpedo-heading"
    >
      <h2 className="step-heading" id="step-torpedo-heading">
        The tax torpedo
      </h2>
      <p className="step-deck">
        The marginal rate on the next dollar of other income, plotted against
        total income. Tap or drag along the curve to move your marker; hover it
        for the figures at any income.
      </p>

      <figure className="chart-figure">
        <BreakpointsMenu
          linesShown={drawnCliffs.length + (drawnSubsidyCliff ? 1 : 0)}
          showIrmaaLines={showIrmaaLines}
          onShowIrmaaLines={setShowIrmaaLines}
          offerSubsidyLine={subsidyCliff !== null}
          showSubsidyLine={showSubsidyLine}
          onShowSubsidyLine={setShowSubsidyLine}
        />
        <TorpedoChart
          curve={curve}
          axisDomain={axisDomain}
          axisMax={axisMax}
          incomeStep={incomeSliderStep}
          onIncome={onOrdinaryIncome}
          here={totalIncome}
          totalIncomeAt={totalIncomeAt}
          cliffs={drawnCliffs}
          subsidyCliff={drawnSubsidyCliff}
          label={label}
          caption={caption}
          ssBenefit={ssBenefit}
          filingStatus={filingStatus}
          muniInterest={muniInterest}
          beneficiaries={beneficiaries}
          year={year}
        />
      </figure>

      <div className="input-group chart-slider">
        <div className="slider-header">
          <label htmlFor="ordinary-income">Other Income (excluding Social Security)</label>
          <span className="slider-value amber">{formatCurrency(ordinaryIncome)}</span>
        </div>
        {/* The track and its end labels, in a box of their own so the phone
            rules can keep them inset to the plot while the label above and
            the sentence below take the whole measure. */}
        <div className="chart-slider-track">
          <input
            id="ordinary-income"
            type="range"
            min={0}
            max={axisMax}
            step={incomeSliderStep}
            value={ordinaryIncome}
            onChange={(e) => onOrdinaryIncome(Number(e.target.value))}
            className="slider-amber"
          />
          <div className="slider-range-labels">
            <span>$0</span>
            <span>{formatCurrency(axisMax)}</span>
          </div>
        </div>

        {/* No "You are here." lead. Three things already say that this
            sentence is about the reader's own point and not the chart's:
            the dashed amber marker, the amber slider directly above, and
            the amber figure beside its label — and the sentence names
            the income the reader set in its first five words. The label
            was a fourth telling, and it was set in the same bold as the
            three figures below it, so the one phrase the paragraph
            stressed hardest was the one carrying no figure at all. */}
        <p className="slider-readout">
          At {formatCurrency(ordinaryIncome)} of other income the next
          dollar is taxed at{' '}
          <strong>{herePoint ? `${herePoint.marginalRate}%` : '—'}</strong>.
          {herePoint && totalIncome > 0 ? (
            <>
              {' '}
              This return owes{' '}
              <strong>{formatCurrency(herePoint.totalTax)}</strong> in federal
              tax on {formatCurrency(totalIncome)} of total income &mdash; an
              effective rate of{' '}
              <strong>{formatPercent(effectiveRate(herePoint.totalTax))}</strong>
              .
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
};
