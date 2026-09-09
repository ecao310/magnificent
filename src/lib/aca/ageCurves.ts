/**
 * The age curves: how much more each age pays than a 21-year-old, on the
 * federal default curve and on the seven a state filed instead.
 *
 * 45 CFR 147.102 lets an insurer vary a premium by age within a 3:1 band,
 * along one curve every insurer in the state shares. The default is CMS's,
 * and most states use it. Seven jurisdictions established curves of their
 * own under 147.102(e) — Alabama, the District of Columbia, Massachusetts,
 * Minnesota, Mississippi, Oregon and Utah — and CMS publishes all seven
 * beside the default in one table, State Specific Age Curve Variations
 * (the 2018 edition, of 31 May 2017, is the latest). Every figure here is
 * a cell of that table; `docs/published-figures.md` reproduces it.
 *
 * Four of the seven are the default from 21 up and differ only for
 * children, whom they rate at one flat factor from birth to 20 rather than
 * along the default's steps from 15. The other three are curves of their
 * own from end to end: the District's runs 3:1 but on a different shape,
 * Massachusetts's runs 2:1, and Utah's climbs steeply through the twenties
 * and reaches the top of the band at 59.
 */
import type { StateCode } from './states';

/** One curve: a factor for everyone under 15, one for each age from 15 to 63, and one from 64 up. */
export interface AgeCurve {
  /** Everyone 0 through 14. */
  child: number;
  /** Ages 15 through 63, by age. */
  ratios: Readonly<Record<number, number>>;
  /** 64 and older: the top of the band. */
  top: number;
}

/**
 * The federal default standard age curve, 45 CFR 147.102(e) as set in CMS's
 * guidance of 16 December 2016 (Appendix I), which every state without a curve
 * of its own has used since plan year 2018.
 *
 * Age 21 is 1.000 and 64 and older is 3.000 — the 3:1 ratio the statute
 * allows — and everyone under 15 is 0.765. Indexed by age from 15 to 63, with
 * the two flat ends in `CHILD_AGE_FACTOR` and `TOP_AGE_FACTOR`.
 */
export const AGE_CURVE: Readonly<Record<number, number>> = {
  15: 0.833, 16: 0.859, 17: 0.885, 18: 0.913, 19: 0.941, 20: 0.97,
  21: 1.0, 22: 1.0, 23: 1.0, 24: 1.0, 25: 1.004, 26: 1.024, 27: 1.048,
  28: 1.087, 29: 1.119, 30: 1.135, 31: 1.159, 32: 1.183, 33: 1.198,
  34: 1.214, 35: 1.222, 36: 1.23, 37: 1.238, 38: 1.246, 39: 1.262,
  40: 1.278, 41: 1.302, 42: 1.325, 43: 1.357, 44: 1.397, 45: 1.444,
  46: 1.5, 47: 1.563, 48: 1.635, 49: 1.706, 50: 1.786, 51: 1.865,
  52: 1.952, 53: 2.04, 54: 2.135, 55: 2.23, 56: 2.333, 57: 2.437,
  58: 2.548, 59: 2.603, 60: 2.714, 61: 2.81, 62: 2.873, 63: 2.952,
};

/** The default curve's factor for anyone 0 through 14. */
export const CHILD_AGE_FACTOR = 0.765;

/** The default curve's factor for anyone 64 or older: the top of the 3:1 band. */
export const TOP_AGE_FACTOR = 3.0;

/** The default curve, whole. */
export const DEFAULT_AGE_CURVE: AgeCurve = {
  child: CHILD_AGE_FACTOR,
  ratios: AGE_CURVE,
  top: TOP_AGE_FACTOR,
};

/** A curve's 15-to-63 table with everyone under 21 at one flat factor, as every state curve has. */
const flatUnder21 = (child: number, from21: Readonly<Record<number, number>>): Record<number, number> => ({
  ...from21,
  15: child, 16: child, 17: child, 18: child, 19: child, 20: child,
});

/** The default curve from 21 up, with everyone under 21 at `child`: what four of the seven states filed. */
const defaultFrom21 = (child: number): AgeCurve => ({
  child,
  ratios: flatUnder21(child, AGE_CURVE),
  top: TOP_AGE_FACTOR,
});

/**
 * The seven curves that are not the default, by state. Alabama's applies to
 * the individual market, which is the one this page prices; New Jersey's
 * own curve applies to its small-group market only, so New Jersey is not
 * here and is priced on the default.
 */
export const STATE_AGE_CURVES: Readonly<Partial<Record<StateCode, AgeCurve>>> = {
  AL: defaultFrom21(0.635),
  MS: defaultFrom21(0.635),
  OR: defaultFrom21(0.635),
  MN: defaultFrom21(0.89),
  // 3:1 from 21 to 61, but on a shape of its own: a 40-year-old is 1.34
  // times a 21-year-old here against 1.28 on the default, and the top is
  // reached at 61.
  DC: {
    child: 0.654,
    ratios: flatUnder21(0.654, {
      21: 0.727, 22: 0.727, 23: 0.727, 24: 0.727, 25: 0.727, 26: 0.727, 27: 0.727,
      28: 0.744, 29: 0.76, 30: 0.779, 31: 0.799, 32: 0.817, 33: 0.836, 34: 0.856,
      35: 0.876, 36: 0.896, 37: 0.916, 38: 0.927, 39: 0.938, 40: 0.975, 41: 1.013,
      42: 1.053, 43: 1.094, 44: 1.137, 45: 1.181, 46: 1.227, 47: 1.275, 48: 1.325,
      49: 1.377, 50: 1.431, 51: 1.487, 52: 1.545, 53: 1.605, 54: 1.668, 55: 1.733,
      56: 1.801, 57: 1.871, 58: 1.944, 59: 2.02, 60: 2.099, 61: 2.181, 62: 2.181,
      63: 2.181,
    }),
    top: 2.181,
  },
  // 2:1, the narrowest band in the country: 1.183 at 21 to 2.365 from 60.
  MA: {
    child: 0.751,
    ratios: flatUnder21(0.751, {
      21: 1.183, 22: 1.183, 23: 1.183, 24: 1.183, 25: 1.183, 26: 1.183, 27: 1.22,
      28: 1.25, 29: 1.275, 30: 1.287, 31: 1.305, 32: 1.323, 33: 1.334, 34: 1.346,
      35: 1.352, 36: 1.358, 37: 1.363, 38: 1.369, 39: 1.381, 40: 1.393, 41: 1.41,
      42: 1.427, 43: 1.45, 44: 1.478, 45: 1.511, 46: 1.55, 47: 1.593, 48: 1.641,
      49: 1.688, 50: 1.741, 51: 1.792, 52: 1.847, 53: 1.902, 54: 1.961, 55: 2.019,
      56: 2.08, 57: 2.142, 58: 2.206, 59: 2.28, 60: 2.365, 61: 2.365, 62: 2.365,
      63: 2.365,
    }),
    top: 2.365,
  },
  // 3:1, reached at 59 rather than 64, after a climb through the twenties
  // that the default does not have: a 26-year-old is 1.363 here and 1.024
  // on the default.
  UT: {
    child: 0.793,
    ratios: flatUnder21(0.793, {
      21: 1, 22: 1.05, 23: 1.113, 24: 1.191, 25: 1.298, 26: 1.363, 27: 1.39,
      28: 1.39, 29: 1.39, 30: 1.39, 31: 1.39, 32: 1.39, 33: 1.39, 34: 1.39,
      35: 1.39, 36: 1.39, 37: 1.404, 38: 1.425, 39: 1.45, 40: 1.479, 41: 1.516,
      42: 1.562, 43: 1.616, 44: 1.681, 45: 1.748, 46: 1.818, 47: 1.891, 48: 1.966,
      49: 2.045, 50: 2.127, 51: 2.212, 52: 2.3, 53: 2.392, 54: 2.488, 55: 2.588,
      56: 2.691, 57: 2.799, 58: 2.911, 59: 3, 60: 3, 61: 3, 62: 3,
      63: 3,
    }),
    top: 3,
  },
};

/** The curve a state's insurers price on: its own where it has one, the default everywhere else and with no state. */
export function ageCurveFor(state: StateCode | null = null): AgeCurve {
  return (state !== null && STATE_AGE_CURVES[state]) || DEFAULT_AGE_CURVE;
}

/** The premium ratio for one person of a given age, on a curve — the default unless another is given. */
export function ageFactor(age: number, curve: AgeCurve = DEFAULT_AGE_CURVE): number {
  const whole = Math.floor(age);
  if (whole < 15) return curve.child;
  if (whole >= 64) return curve.top;
  return curve.ratios[whole];
}
