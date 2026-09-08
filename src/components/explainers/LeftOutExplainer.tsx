/** What this page does not price, so the reader knows what to add back. */
export const LeftOutExplainer: React.FC = () => (
  <details className="explainer">
    <summary>
      <h3 id="left-out-heading">What this page leaves out</h3>
    </summary>
    <div className="explainer-content">
      <ul>
        <li>
          <strong>State income tax.</strong> Every figure here is federal. A state that
          taxes conversions and gains adds its own rate to both curves, and one that
          taxes neither adds nothing.
        </li>
        <li>
          <strong>The rest of the return.</strong> No Social Security, no tax-exempt
          interest, no itemising, no credits for dependents, no 3.8% net investment
          income tax &mdash; which starts at $200,000 single and $250,000 joint, past
          the right edge of most of these charts. The page this one follows carries
          the benefit and the interest for a reader who has either before 65.
        </li>
        <li>
          <strong>A whole year on one plan.</strong> The credit is computed monthly and
          this page prices twelve identical months. A household that starts coverage
          mid-year, changes plans, or has one spouse turn 65 in the autumn owes and
          receives by the month.
        </li>
        <li>
          <strong>Form 8962&apos;s rounding.</strong> The form rounds household income
          to a whole percent of the poverty line before the lookup and the percentage
          to four places after it. Both are steps of a few dollars; the smooth line is
          drawn instead, and the return will differ from it by that much.
        </li>
        <li>
          <strong>Where you live.</strong> The benchmark is a national average until you
          set your own; New York and Vermont do not rate premiums by age; Alaska and
          Hawaii have higher poverty lines than the one drawn. Georgia&apos;s partial
          expansion and the states with their own age curves are priced as the default
          here, which is wrong for them in their own directions.
        </li>
        <li>
          <strong>What the credit is worth in a plan.</strong> The credit is the same
          whichever metal the household buys, so a bronze plan costs the benchmark less
          the credit less the gap between silver and bronze. The net premium quoted in
          the close is the benchmark&apos;s.
        </li>
      </ul>
    </div>
  </details>
);
