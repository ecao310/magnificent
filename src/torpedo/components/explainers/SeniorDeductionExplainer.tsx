import {
  SENIOR_DEDUCTION,
  SENIOR_DEDUCTION_FIRST_YEAR,
  SENIOR_DEDUCTION_LAST_YEAR,
  SENIOR_DEDUCTION_PHASEOUT_RATE,
} from '../../lib/tax';
import { formatCents, formatCurrency, formatPercent } from '../../lib/format';
import { Explainer } from '../../../shared/components/Explainer';

export interface SeniorDeductionExplainerProps {
  /** MAGI at which each qualifying person's $6,000 starts shrinking. */
  phaseoutStart: number;
  /** MAGI at which it is gone. */
  phaseoutEnd: number;
  /** 6% per qualifying person: 12% on a joint return where both qualify. */
  phaseoutRate: number;
}

/**
 * The extra deduction and the phaseout that erases it: inside that range every
 * dollar earned also destroys deduction, a surtax on top of the bracket.
 */
export const SeniorDeductionExplainer: React.FC<SeniorDeductionExplainerProps> = ({
  phaseoutStart,
  phaseoutEnd,
  phaseoutRate,
}) => {
  const taxableIncomePerDollar = 1 + phaseoutRate;
  return (
    <Explainer id="senior-deduction-heading" title={<>The senior deduction phaseout ({SENIOR_DEDUCTION_FIRST_YEAR}&ndash;{SENIOR_DEDUCTION_LAST_YEAR})</>}>
        <p>
          For tax years {SENIOR_DEDUCTION_FIRST_YEAR} through{' '}
          {SENIOR_DEDUCTION_LAST_YEAR} only, anyone who reaches age 65 gets an
          extra <strong>{formatCurrency(SENIOR_DEDUCTION)}</strong> deduction on
          top of the standard deduction and the age-65 addition. A couple filing
          jointly with both spouses over 65 gets{' '}
          {formatCurrency(2 * SENIOR_DEDUCTION)}.
        </p>
        <p>
          Each qualifying person&apos;s {formatCurrency(SENIOR_DEDUCTION)}{' '}
          shrinks by {formatCents(SENIOR_DEDUCTION_PHASEOUT_RATE)} for every
          dollar of MAGI above {formatCurrency(phaseoutStart)}, so it is gone at{' '}
          {formatCurrency(phaseoutEnd)}.
        </p>
        <p>
          Inside that range, that means taxable income rises by{' '}
          <strong>${taxableIncomePerDollar.toFixed(2)}</strong> per dollar
          earned, and the 22% bracket becomes{' '}
          <strong>{formatPercent(0.22 * taxableIncomePerDollar)}</strong>.
        </p>
      </Explainer>
  );
};
