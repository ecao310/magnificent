# Published figures the engine is checked against

Every percentage, threshold and premium in `src/lib/aca/` traces to one of these.
The tests beside each module assert the corners of each table; this file says
where the corners came from.

## Poverty guidelines (HHS)

Coverage year *N* is priced off the guidelines published the January before
it (26 CFR 1.36B-1(h)). Contiguous 48 states and DC.

| Guidelines | Price coverage in | First person | Each additional | Source |
| --- | --- | --- | --- | --- |
| 2024 | 2025 | $15,060 | $5,380 | 89 Fed. Reg. 2961 (January 17 2024) |
| 2025 | 2026 | $15,650 | $5,500 | 90 Fed. Reg. 5917 (January 17 2025) |
| 2026 | 2027 | $15,960 | $5,680 | 91 Fed. Reg. 1797 (January 15 2026) |

Alaska and Hawaii, from the same notices. The engine reads these when the
household's state is one of the two.

| Guidelines | Price coverage in | Alaska, first person | Alaska, each additional | Hawaii, first person | Hawaii, each additional |
| --- | --- | --- | --- | --- | --- |
| 2024 | 2025 | $18,810 | $6,730 | $17,310 | $6,190 |
| 2025 | 2026 | $19,550 | $6,880 | $17,990 | $6,330 |
| 2026 | 2027 | $19,950 | $7,100 | $18,360 | $6,530 |

## Applicable percentage table (IRC 36B(b)(3)(A))

| Household income, % of FPL | 2025 (ARPA 9661, IRA 12001) | 2026 (Rev. Proc. 2025-25) | 2027 (Rev. Proc. 2026-26) |
| --- | --- | --- | --- |
| Under 133% | 0% | 2.10% | 2.15% |
| 133% – 150% | 0% | 3.14% – 4.19% | 3.23% – 4.30% |
| 150% – 200% | 0% – 2.00% | 4.19% – 6.60% | 4.30% – 6.78% |
| 200% – 250% | 2.00% – 4.00% | 6.60% – 8.44% | 6.78% – 8.66% |
| 250% – 300% | 4.00% – 6.00% | 8.44% – 9.96% | 8.66% – 10.22% |
| 300% – 400% | 6.00% – 8.50% | 9.96% | 10.22% |
| Over 400% | 8.50% | no credit | no credit |

The 2021–2025 table came from ARPA section 9661 and was extended through
2025 by section 12001 of the Inflation Reduction Act. It expired for tax
years beginning after 31 December 2025; the House passed H.R. 7 (a
three-year extension) on 8 January 2026, 230–196, and the Senate has not
taken it up as of September 2026.

## Floor and cost-sharing tiers

| Line | Multiple of FPL | Source |
| --- | --- | --- |
| Medicaid expansion floor | 138% (133% + 5% disregard) | 42 USC 1396a(a)(10)(A)(i)(VIII), 1396a(e)(14)(I) |
| Statutory floor (no expansion) | 100% | IRC 36B(c)(1)(A) |
| CSR 94% actuarial value | ≤ 150% | ACA §1402(c)(2) |
| CSR 87% | ≤ 200% | ACA §1402(c)(2) |
| CSR 73% | ≤ 250% | ACA §1402(c)(2) |
| Ceiling | 400% | IRC 36B(c)(1)(A) |

Forty states and DC had expanded Medicaid as of 2026; the ten that had not
are Alabama, Florida, Georgia (a partial waiver), Kansas, Mississippi, South
Carolina, Tennessee, Texas, Wisconsin and Wyoming.

## Repayment of excess advance credit (IRC 36B(f)(2)(B))

Through tax year 2025 the repayment was capped for households under 400% of
the line: $375/$750 under 200%, $975/$1,950 from 200% to 300%, $1,625/$3,250
from 300% to 400% (single / all other statuses; Rev. Proc. 2024-40). Section
71305 of Pub. L. 119-21 (the One Big Beautiful Bill Act, July 4 2025) struck
the cap for tax years beginning after 31 December 2025. The page has a note
on this; the engine does not model advance payments.

## Benchmark premium (KFF, Marketplace Average Benchmark Premiums)

Average monthly premium of the second-lowest-cost silver plan for a
40-year-old, weighted by county plan selections, from
https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
(read September 8 2026). The US row is the national figure; the state rows
are `src/lib/aca/states.ts`.

| Coverage year | Monthly at 40, US |
| --- | --- |
| 2025 | $497 |
| 2026 | $625 |

| Code | State | 2025 | 2026 |
| --- | --- | --- | --- |
| AL | Alabama | $535 | $645 |
| AK | Alaska | $1,045 | $1,032 |
| AZ | Arizona | $410 | $532 |
| AR | Arkansas | $458 | $774 |
| CA | California | $512 | $570 |
| CO | Colorado | $463 | $557 |
| CT | Connecticut | $693 | $870 |
| DE | Delaware | $534 | $691 |
| DC | District of Columbia | $578 | $610 |
| FL | Florida | $515 | $683 |
| GA | Georgia | $493 | $615 |
| HI | Hawaii | $493 | $541 |
| ID | Idaho | $436 | $490 |
| IL | Illinois | $474 | $646 |
| IN | Indiana | $382 | $474 |
| IA | Iowa | $429 | $501 |
| KS | Kansas | $513 | $670 |
| KY | Kentucky | $442 | $590 |
| LA | Louisiana | $524 | $646 |
| ME | Maine | $546 | $709 |
| MD | Maryland | $365 | $414 |
| MA | Massachusetts | $447 | $494 |
| MI | Michigan | $404 | $523 |
| MN | Minnesota | $363 | $448 |
| MS | Mississippi | $485 | $662 |
| MO | Missouri | $489 | $605 |
| MT | Montana | $554 | $692 |
| NE | Nebraska | $600 | $710 |
| NV | Nevada | $414 | $497 |
| NH | New Hampshire | $325 | $401 |
| NJ | New Jersey | $492 | $545 |
| NM | New Mexico | $515 | $623 |
| NY | New York | $790 | $817 |
| NC | North Carolina | $507 | $638 |
| ND | North Dakota | $537 | $570 |
| OH | Ohio | $441 | $513 |
| OK | Oklahoma | $501 | $604 |
| OR | Oregon | $510 | $543 |
| PA | Pennsylvania | $461 | $572 |
| RI | Rhode Island | $425 | $506 |
| SC | South Carolina | $471 | $564 |
| SD | South Dakota | $619 | $655 |
| TN | Tennessee | $516 | $711 |
| TX | Texas | $489 | $661 |
| UT | Utah | $547 | $640 |
| VT | Vermont | $1,277 | $1,299 |
| VA | Virginia | $372 | $455 |
| WA | Washington | $434 | $612 |
| WV | West Virginia | $919 | $1,073 |
| WI | Wisconsin | $495 | $611 |
| WY | Wyoming | $871 | $1,090 |

Two rows look wrong and are not: Alaska's benchmark fell from 2025 to 2026
while every other state's rose, and Arkansas's rose 69% against a national
26%. Both are as KFF published them.

## Federal default standard age curve (45 CFR 147.102, CMS guidance of December 16 2016, Appendix I)

| Age | Ratio | Age | Ratio | Age | Ratio |
| --- | --- | --- | --- | --- | --- |
| 0–14 | 0.765 | 31 | 1.159 | 48 | 1.635 |
| 15 | 0.833 | 32 | 1.183 | 49 | 1.706 |
| 16 | 0.859 | 33 | 1.198 | 50 | 1.786 |
| 17 | 0.885 | 34 | 1.214 | 51 | 1.865 |
| 18 | 0.913 | 35 | 1.222 | 52 | 1.952 |
| 19 | 0.941 | 36 | 1.230 | 53 | 2.040 |
| 20 | 0.970 | 37 | 1.238 | 54 | 2.135 |
| 21–24 | 1.000 | 38 | 1.246 | 55 | 2.230 |
| 25 | 1.004 | 39 | 1.262 | 56 | 2.333 |
| 26 | 1.024 | 40 | 1.278 | 57 | 2.437 |
| 27 | 1.048 | 41 | 1.302 | 58 | 2.548 |
| 28 | 1.087 | 42 | 1.325 | 59 | 2.603 |
| 29 | 1.119 | 43 | 1.357 | 60 | 2.714 |
| 30 | 1.135 | 44 | 1.397 | 61 | 2.810 |
| | | 45 | 1.444 | 62 | 2.873 |
| | | 46 | 1.500 | 63 | 2.952 |
| | | 47 | 1.563 | 64+ | 3.000 |

At most three children under 21 are rated on one policy (45 CFR
147.102(c)(1)). States with curves of their own: Alabama, DC, Massachusetts,
Minnesota, Mississippi, Oregon, Utah — priced on the federal curve here.
States with no age rating: New York, Vermont — priced flat at the 40-year-old
figure. CMS, State Specific Age Curve Variations.
