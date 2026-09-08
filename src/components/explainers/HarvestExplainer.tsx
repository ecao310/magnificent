import type { BlockCost, PtcAssessment } from '../../lib/tax';
import { formatCurrency, formatPercent } from '../../lib/format';

export interface HarvestExplainerProps {
  /** The reader's block, priced as a harvested gain whatever the strip says. */
  block: BlockCost;
  here: PtcAssessment;
  /** The top of the 0% gain band, in household income, for this household's base. */
  zeroBandTop: number;
}

/**
 * The question the thread asked: whether a gain harvested in the 0% band is
 * worth the credit it costs. Mostly not, and here is the arithmetic.
 */
export const HarvestExplainer: React.FC<HarvestExplainerProps> = ({ block, here, zeroBandTop }) => (
  <details className="explainer">
    <summary>
      <h3 id="harvest-heading">Harvesting gains against the credit</h3>
    </summary>
    <div className="explainer-content">
      <p>
        <strong>The idea.</strong> A household whose taxable income is under the top of
        the 0% capital-gains band can sell appreciated shares, pay no federal tax on
        the gain, and buy them straight back at a higher basis. The gain is gone for
        good; when the shares are finally sold, less of the proceeds is gain, and
        whatever is left is taxed at 15% instead of &mdash; nothing. For this household
        the 0% band runs to {formatCurrency(zeroBandTop)} of household income.
      </p>
      <p>
        <strong>What it costs this year.</strong>{' '}
        {block.added > 0 ? (
          <>
            Harvesting {formatCurrency(block.added)} on top of{' '}
            {formatCurrency(block.from)} costs <strong>{formatCurrency(block.total)}</strong>:{' '}
            {formatCurrency(block.tax)} of federal tax and {formatCurrency(block.credit)} of
            premium tax credit given back &mdash;{' '}
            <strong>{block.rate !== null ? formatPercent(block.rate) : '—'}</strong> of the
            gain.
            {block.crossesCliff &&
              ' That figure has the whole credit in it, because the block crosses the 400% line.'}
          </>
        ) : (
          <>
            Move the slider under the chart to size a harvest; at{' '}
            {formatCurrency(Math.round(here.magi))} the next dollar of gain gives back{' '}
            {formatPercent(here.slope)} in credit.
          </>
        )}
      </p>
      <p>
        <strong>What it saves later.</strong> At most 15% of the gain &mdash; the rate
        it would have been taxed at when the shares were sold &mdash; and that is the
        ceiling, not the expectation. If the household is still under the 0% band
        when it sells, the harvest saved nothing. If it never sells and the shares
        pass at death, the basis steps up and the harvest saved nothing. If it moves
        to a state without an income tax, the state share of the saving goes too. The
        cost is certain and this year; the benefit is a deferred maximum.
      </p>
      <p>
        <strong>So the answer the thread reached is mostly right.</strong> Anywhere the
        slope is over 15 cents on the dollar &mdash; which on the 2026 table is most of
        the ground between 200% and 300% of the poverty line &mdash; a harvested gain
        costs more today than it can ever save. There are two places it is cheaper.
        Between 300% and 400% the slope is a flat 9.96 cents, under the 15% it can
        save, and the arithmetic turns in the harvest&apos;s favour if the household
        does expect to sell at 15%. And under the floor, or in a year with income low
        enough that the credit is already zero, a harvest costs nothing at all &mdash;
        which is the year to do it. Everywhere, the dollar that crosses 400% costs the
        whole credit and no gain is worth that.
      </p>
      <p>
        <strong>One thing a harvest does that a conversion does not.</strong> It moves
        no money out of a tax-deferred account, so it leaves the future required
        minimum distributions &mdash; and the tax torpedo they set off against Social
        Security after 65 &mdash; exactly where they were. If the household has a large
        IRA, the conversion in the next note is the block that changes something.
      </p>
    </div>
  </details>
);
