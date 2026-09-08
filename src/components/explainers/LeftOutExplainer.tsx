/** What this page does not price, so the reader knows what to add back. */
export const LeftOutExplainer: React.FC = () => (
  <details className="explainer">
    <summary>
      <h3 id="left-out-heading">What this page leaves out</h3>
    </summary>
    <div className="explainer-content">
      <ul>
        <li>
          <strong>A whole year on one plan.</strong> The subsidy is computed monthly and
          this page prices twelve identical months. A household that starts coverage
          mid-year, changes plans, or has one person turn 65 in the autumn owes and
          receives by the month.
        </li>
        <li>
          <strong>The Marketplace&apos;s rounding.</strong> Form 8962 rounds household
          income down to a whole percent of the poverty line before the lookup and the
          percentage to four places after it. Both are steps of a few dollars; the
          smooth line is drawn instead, and the settled figure will differ from it by
          that much.
        </li>
        <li>
          <strong>Where you live.</strong> The benchmark is a national average until you
          set your own; New York and Vermont do not rate premiums by age; Alaska and
          Hawaii have higher poverty lines than the one drawn. Georgia&apos;s partial
          expansion and the states with their own age curves are priced as the default
          here, which is wrong for them in their own directions.
        </li>
        <li>
          <strong>What the plan actually costs you.</strong> The subsidy is the same
          whichever metal the household buys, so a bronze plan costs the benchmark less
          the subsidy less the gap between silver and bronze, and a gold plan costs
          more. The curve is the benchmark&apos;s.
        </li>
        <li>
          <strong>Coverage from anywhere else.</strong> An employer plan that meets the
          affordability test, a spouse&apos;s plan, Medicare or Medicaid each take the
          subsidy away, and none of them is a field here.
        </li>
        <li>
          <strong>Everything else a dollar of income does.</strong> The curve is the
          subsidy alone. What the same dollar owes anywhere else is another page.
        </li>
      </ul>
    </div>
  </details>
);
