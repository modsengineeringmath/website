// Tests the engine of assets/precalc.js (precalculus chapter 27): expression parser, polynomials, distributions and statistics.
// Expected values come from scipy / sympy / math.lgamma (see the comments). Usage: node scripts/test-precalc.mjs
// The trigonometry and data widgets (precalc-trig.js, precalc-data.js) need a DOM and are checked in the browser.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { console, module: { exports: {} } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/precalc.js"), "utf8"), ctx, { filename: "precalc.js" });
const PC = ctx.module.exports;
let fails = 0, n = 0;
const near = (name, got, want, tol = 1e-9) => {
  n++;
  if (!(Math.abs(got - want) <= tol * Math.max(1, Math.abs(want)))) { fails++; console.log(`✗ ${name}: got ${got} want ${want}`); }
};
const eq = (name, got, want) => {
  n++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log(`✗ ${name}: got ${g} want ${w}`); }
};

// ---- parser: implicit multiplication, log = base 10, ln, |x|, n!, powers of functions
near("2(3+1)^2", PC.evalNum("2(3+1)^2"), 32);
near("log 1000", PC.evalNum("log(1000)"), 3);
near("ln e^3", PC.evalNum("ln(e^3)"), 3);
near("log2 8", PC.evalNum("log2(8)"), 3);
near("sqrt(3)/2", PC.evalNum("sqrt(3)/2"), Math.sqrt(3) / 2);
near("5!", PC.evalNum("5!"), 120);
near("|−4|+2pi", PC.evalNum("|-4|+2pi"), 4 + 2 * Math.PI);
near("sin^2 + cos^2 at 0.7", PC.parse("sin^2(x)+cos^2(x)")(0.7), 1);
near("(2x+1)/(x-3) at 5", PC.parse("(2x+1)/(x-3)")(5), 5.5);
near("3x^2-2x at -1", PC.parse("3x^2-2x")(-1), 5);

// ---- polynomials (coefficients, highest power first)
const P = PC.poly;
eq("fromRoots 1,2,3", P.fromRoots([1, 2, 3]), [1, -6, 11, -6]);
eq("synth x^3-6x^2+11x-6 ÷ (x-1)", P.synth([1, -6, 11, -6], 1).q, [1, -5, 6]);
eq("synth remainder P(2) of x^3-2x+5", P.synth([1, 0, -2, 5], 2).r, 9);
const dv = P.div([2, -3, 0, 5], [1, -2]);
eq("long division 2x^3-3x^2+5 ÷ (x-2)", [dv[0], dv[1]], [[2, 1, 2], [9]]);
eq("real roots x^4-5x^2+4", P.realRoots([1, 0, -5, 0, 4]).map((r) => Math.round(r.x * 1e9) / 1e9), [-2, -1, 1, 2]);
eq("double root (x-1)^2(x+2)", P.realRoots(P.fromRoots([1, 1, -2])).map((r) => [Math.round(r.x * 1e6) / 1e6, r.m]), [[-2, 1], [1, 2]]);
eq("parse polynomial text", P.parse("x^3-2x+5"), [1, 0, -2, 5]);

// ---- distributions (scipy.stats values)
const D = PC.dist;
near("Phi(1.96)", D.Phi(1.96), 0.9750021048517795, 1e-12);
near("Phi(-1.23)", D.Phi(-1.23), 0.10934855242569191, 1e-12);
near("invPhi(0.9)", D.invPhi(0.9), 1.2815515655446004, 1e-10);
near("invPhi(0.975)", D.invPhi(0.975), 1.959963984540054, 1e-10);
near("invPhi(1e-6)", D.invPhi(1e-6), -4.753424308822899, 1e-9);
near("tCDF(2, 15)", D.tCDF(2, 15), 0.96802749635764, 1e-10);
near("tInv(0.975, 15)", D.tInv(0.975, 15), 2.131449545559776, 1e-9);
near("tInv(0.975, 24)", D.tInv(0.975, 24), 2.0638985616280245, 1e-9);
near("tInv(0.995, 1)", D.tInv(0.995, 1), 63.656741162871526, 1e-8);
near("chi2CDF(4.2, 5)", D.chi2CDF(4.2, 5), 0.47900504656859483, 1e-10);
near("chi2Inv(0.95, 5)", D.chi2Inv(0.95, 5), 11.070497693516351, 1e-9);
near("chi2Inv(0.005, 1)", D.chi2Inv(0.005, 1), 3.9270422220515944e-05, 1e-6);
near("chi2Inv(0.99, 30)", D.chi2Inv(0.99, 30), 50.89218131151707, 1e-9);
near("fCDF(2.4, 10, 12)", D.fCDF(2.4, 10, 12), 0.9234364680180867, 1e-10);
near("fInv(0.95, 10, 12)", D.fInv(0.95, 10, 12), 2.753386768835849, 1e-9);
near("fInv(0.99, 3, 20)", D.fInv(0.99, 3, 20), 4.938193382310538, 1e-9);
near("binomPMF(6, 10, 0.25)", D.binomPMF(6, 10, 0.25), 0.016222000122070295, 1e-12);
let tail = 0; for (let k = 6; k <= 10; k++) tail += D.binomPMF(k, 10, 0.25);
near("P(X ≥ 6), B(10, 0.25)", tail, 0.019727706909179688, 1e-12);
near("lgamma(0.5)", D.lgamma(0.5), 0.5723649429247004, 1e-13);
near("lgamma(10.3)", D.lgamma(10.3), 13.48203678613836, 1e-13);

// ---- descriptive statistics (worked examples D-1, D-3, D-7 on /learn/precalculus/statistics/)
const S = PC.stat.describe([12, 15, 11, 18, 15, 20, 14]);
near("mean", S.mean, 15); near("median", S.median, 15); eq("mode", S.modes, [15]);
near("σ", S.sdP, Math.sqrt(60 / 7)); near("s", S.sdS, Math.sqrt(10));
near("Q1 (n+1)/4", S.q1, 12); near("Q3", S.q3, 18); eq("no outliers", S.outliers, []);
const Q = PC.stat.describe([3, 5, 7, 8, 10, 12]);
near("median of 6 values", Q.median, 7.5);
near("Q1 interpolated (pos 1.75)", Q.q1, 4.5);
const R = PC.stat.regress([1, 2, 3, 4, 5, 6, 7, 8], [52, 55, 61, 64, 70, 71, 78, 80]);
near("slope 173.5/42", R.slope, 173.5 / 42); near("intercept", R.icpt, 66.375 - (173.5 / 42) * 4.5);
near("r (numpy corrcoef)", R.r, 0.9936739724998042, 1e-12);
eq("parse pasted column", PC.stat.parse("12\n15, 11\t18;15 20 14"), [12, 15, 11, 18, 15, 20, 14]);

console.log(fails ? `${fails} of ${n} checks failed` : `all ${n} precalculus engine checks passed`);
process.exit(fails ? 1 : 0);
