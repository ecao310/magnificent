import { SS_BASES } from '../../lib/tax';
import type { FilingStatus } from '../../lib/tax';
import { formatCurrency } from '../../lib/format';
import { Explainer } from '../../../shared/components/Explainer';

/** What the torpedo is. */
export const TorpedoExplainer: React.FC<{ filingStatus: FilingStatus }> = ({
  filingStatus,
}) => {
  // Never read off the tax year: IRC 86(c) has never been indexed. See SS_BASES.
  const { ssBase50, ssBase85 } = SS_BASES[filingStatus];
  return (
    <Explainer id="tax-torpedo-heading" title="What is the tax torpedo?">
        <p>
          Only a percentage of Social Security benefits are subject to income
          tax. The taxable share depends on{' '}
          <strong>provisional income</strong> (100% of other income plus 50% of
          your social security benefit). Once PI passes{' '}
          {formatCurrency(ssBase50)} and {formatCurrency(ssBase85)}, it also
          starts dragging in up to 50&cent; and 85&cent; of benefits into
          taxable income.
        </p>
        <p>
          Therefore, one more dollar earned can raise taxable income by as much
          as $1.85, and the marginal rate jumps to up to 1.85&times; the
          statutory bracket: income in the 12% bracket is effectively taxed at{' '}
          <strong>22.2%</strong>, and income in the 22% bracket at{' '}
          <strong>40.7%</strong>. That spike above the ordinary bracket rates is
          the <strong>tax torpedo</strong>.
        </p>
        <p>
          Since at most 85% of benefits can ever be taxable, the marginal rate
          falls straight back to the ordinary bracket on the right side of the
          spike. Larger benefits stretch the torpedo across a wider income
          range.
        </p>
      </Explainer>
  );
};
