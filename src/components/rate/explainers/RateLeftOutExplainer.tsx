/** What the rate does not include, so a reader can add their own. */
export const RateLeftOutExplainer: React.FC = () => (
  <details className="explainer">
    <summary>
      <h3 id="rate-left-out-heading">What is left out</h3>
    </summary>
    <div className="explainer-content">
      <p>
        The tax is the federal return with nothing unusual on it, and the income is taken
        as all ordinary and all in the tax base. Anything below moves the rate, and none of
        it is priced here:
      </p>
      <ul>
        <li>
          <strong>Payroll and self-employment tax.</strong> Wages carry 7.65% in Social
          Security and Medicare tax, and self-employment income about twice that. Neither
          is in the figure; a wage earner can add 7.65 points, a freelancer more.
        </li>
        <li>
          <strong>State and local income tax</strong>, which runs from nothing to over 10%.
        </li>
        <li>
          <strong>Refundable credits.</strong> The child tax credit is taken only against tax
          owed; the refundable part of it, and the earned income credit, are left out, so
          the rate is never negative. A family with children and a low income gets more
          back than this page shows.
        </li>
        <li>
          <strong>Anything but the standard deduction.</strong> Itemized deductions, the
          deduction for self-employed health insurance premiums, retirement and HSA
          contributions and the rest all lower taxable income &mdash; and some of them lower
          the income the subsidy is measured on too, which moves the premium as well.
        </li>
        <li>
          <strong>Capital gains and qualified dividends</strong>, which are taxed at their own
          lower rates; every dollar here is taxed as ordinary income.
        </li>
        <li>
          <strong>The return itself.</strong> Two adults file jointly, one adult with children
          files as head of household, and every child on the plan is under 17 and at home.
          A household that files differently has a different deduction and different
          brackets.
        </li>
      </ul>
      <p>
        The premium side leaves out what the cost page leaves out: a plan other than the
        benchmark, cost-sharing reductions, and a premium other than the state or national
        average unless you enter your own.
      </p>
    </div>
  </details>
);
