// Tests the pure engines of assets/seq-calc.js (exact sequence & series calculators, 26.11) and assets/strong-ind.js (26.12).
// Every expected value was checked with sympy. Usage: node scripts/test-seq-calc.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["seq-lab.js", "seq-calc.js", "strong-ind.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, "assets", f), "utf8"), ctx, { filename: f });
const { SC, SQ, SI } = ctx;
let fails = 0, n = 0;
const eq = (name, got, want) => {
  n++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log(`✗ ${name}: got ${g} want ${w}`); }
};
const near = (name, got, want, tol = 1e-12) => { n++; if (!(Math.abs(got - want) <= tol * Math.max(1, Math.abs(want)))) { fails++; console.log(`✗ ${name}: got ${got} want ${want}`); } };
const Q = SC.Q, s = SC.qstr;
const sumClosed = (f, m = 1) => SC.sumEP(SC.epOf(SC.parseExpr(f, ["k"]), "k"), m);

// rationals and parsing
eq("qparse 0.125", s(SC.qparse("0.125")), "1/8");
eq("qparse -3/12", s(SC.qparse("-3/12")), "-1/4");
eq("qdec 1.5e-3", s(SC.qdec("1.5e-3")), "3/2000");

// power sums (Faulhaber) and factored display
eq("Σk²", SC.ptexFactored(SC.powerSum(2), "n"), "\\dfrac{n(n + 1)(2n + 1)}{6}");
eq("Σk³", SC.ptexFactored(SC.powerSum(3), "n"), "\\dfrac{n^{2}(n + 1)^{2}}{4}");
eq("Σk⁴ value n=10", s(SC.pevalQ(SC.powerSum(4), Q(10))), "25333");
eq("Σ k(k+1)(k+2)", SC.ptexFactored(sumClosed("k(k+1)(k+2)").poly, "n"), "\\dfrac{n(n + 1)(n + 2)(n + 3)}{4}");
eq("Σ (2k-1)^2 at n=7", s(SC.evalSumEP(sumClosed("(2k-1)^2"), 7)), "455");
eq("Σ k^2 from 5 to 10", s(SC.evalSumEP(sumClosed("k^2", 5), 10)), "355");
// polynomial × r^k
const kg = sumClosed("k*2^k");
eq("Σ k2^k n=5", s(SC.evalSumEP(kg, 5)), "258");
eq("Σ k/2^k infinite", s(sumClosed("k/2^k").C), "2");
eq("Σ 3·2^(k-1) n=8", s(SC.evalSumEP(sumClosed("3*2^(k-1)"), 8)), "765");
eq("Σ (-1)^k k^2 n=6", s(SC.evalSumEP(sumClosed("(-1)^k*k^2"), 6)), "21");
// telescoping
const tel = (f, m = 1) => SC.telescope(SC.partialFractions(SC.rfOf(SC.parseExpr(f, ["k"]), "k")), m);
eq("1/(k(k+1)) S∞", s(tel("1/(k(k+1))").C), "1");
eq("1/((2k-1)(2k+1)) closed", SC.rftex(tel("1/((2k-1)(2k+1))").rf, "n"), "\\dfrac{n}{2n + 1}");
eq("1/(k(k+2)) S∞", s(tel("1/(k(k+2))").C), "3/4");
eq("1/(k(k+1)(k+2)) S∞", s(tel("1/(k(k+1)(k+2))").C), "1/4");
eq("1/(k²-1) from 2", s(tel("1/(k^2-1)", 2).C), "3/4");
eq("1/k² not telescoping", !!SC.partialFractions(SC.rfOf(SC.parseExpr("1/k^2", ["k"]), "k")).repeated, true);

// formula finder
const T = (str) => str.split(",").map((x) => SC.qparse(x));
eq("finder 3,10,29,66,127", SC.ptex(SC.findPoly(T("3,10,29,66,127"), 1).poly, "n"), "n^{3} + 2");
eq("finder Σ of 2,6,12,20", SC.ptexFactored(SC.findPoly(T("2,6,12,20,30"), 1).spoly, "n"), "\\dfrac{n(n + 1)(n + 2)}{3}");
eq("finder circle division a7", s(SC.pevalQ(SC.findPoly(T("1,2,4,8,16,31"), 1).poly, Q(7))), "57");
const bm = SC.berlekamp(T("1,1,2,3,5,8,13,21"));
eq("Berlekamp–Massey Fibonacci", [bm.L, bm.c.map(s)], [2, ["1", "1"]]);

// linear recurrences
let r = SC.solveRecurrence({ c: [Q(1), Q(1)], init: [Q(0), Q(1)], n0: 0 });
eq("Fibonacci roots", r.CR.roots.map((x) => r.F.tex(x.x)), ["\\dfrac{1 + \\sqrt{5}}{2}", "\\dfrac{1 - \\sqrt{5}}{2}"]);
near("Binet F30", r.F.num(r.closedAt(30))[0], 832040, 1e-12);
eq("Fibonacci GF", [SC.ptexAsc(r.gf.num, "x"), SC.ptexAsc(r.gf.den, "x")], ["x", "1 - x - x^{2}"]);
r = SC.solveRecurrence({ c: [Q(5), Q(-6)], init: [Q(1), Q(4)], n0: 0 });
eq("5,-6 constants (3ⁿ, 2ⁿ)", r.consts.map((x) => r.F.tex(x)), ["2", "-1"]);
r = SC.solveRecurrence({ c: [Q(4), Q(-4)], init: [Q(1), Q(4)], n0: 0 });
eq("repeated root (n+1)2ⁿ", s(r.closedAt(9).a), String(10 * 512));
r = SC.solveRecurrence({ c: [Q(2), Q(-2)], init: [Q(1), Q(2)], n0: 0 });
near("complex roots a8", r.F.num(r.closedAt(8))[0], 16, 1e-12);
let pr = SC.parseRecRHS("3a(n-1) - 2a(n-2) + 2^n");
r = SC.solveRecurrence({ c: pr.c, forcing: pr.forcing, init: [Q(0), Q(1)], n0: 0 });
eq("resonance particular 2n·2ⁿ", [SC.qstr(r.part[0].r), SC.ptex(r.part[0].p, "n"), r.part[0].m], ["2", "2n", 1]);
eq("resonance a10", s(r.closedAt(10).a), String((2 * 10 - 3) * 1024 + 3));
pr = SC.parseRecRHS("2a(n-1) + 1");
r = SC.solveRecurrence({ c: pr.c, forcing: pr.forcing, init: [Q(1)], n0: 1 });
eq("Hanoi a20", s(r.closedAt(20).a), String(2 ** 20 - 1));
r = SC.solveRecurrence({ c: [Q(1), Q(1), Q(1)], init: [Q(0), Q(0), Q(1)], n0: 0, count: 20 });
near("tribonacci dominant root", Math.max(...r.numRoots.map((z) => Math.hypot(z[0], z[1]))), 1.8392867552141612, 1e-12);
eq("tribonacci a15 exact by recurrence", s(r.terms[15]), "1705");

// arithmetic / geometric solvers
eq("arith a30, S30 from two terms", (() => { const v = SC.solveArith({ a1: Q(5), d: Q(3), n: Q(30) }).vals; return [s(v.an), s(v.Sn)]; })(), ["92", "1455"]);
eq("arith n from Sn (two answers)", (() => { const res = SC.solveArith({ a1: Q(-9), d: Q(2), Sn: Q(-21) }); return [s(res.vals.n), res.warn.length]; })(), ["7", 1]);
eq("geo S6 r=3", s(SC.solveGeo({ a1: Q(2), r: Q(3), n: Q(6) }).vals.Sn), "728");
eq("geo S6 r=-3", s(SC.solveGeo({ a1: Q(-2), r: Q(-3), n: Q(6) }).vals.Sn), "364");
eq("geo r from S∞", s(SC.solveGeo({ a1: Q(8), Sinf: Q(12) }).vals.r), "1/3");
eq("geo S∞ from a1, r only", s(SC.solveGeo({ a1: Q(4), r: Q(1, 3) }).vals.Sinf), "6");
eq("exact root (r = ±3)", SC.exactRoot(Q(9), 2).map(s), ["3", "-3"]);

// repeating decimals
eq("0.1(23)", s(SC.repeatingToFrac("0.1(23)").q), "61/495");
eq("1.2(45)", s(SC.repeatingToFrac("1.2(45)").q), "137/110");
eq("0.(9)", s(SC.repeatingToFrac("0.(9)").q), "1");

// Euler–Maclaurin and CVZ
const em = (f, m, N) => { const c = SQ.compile(f, ["k"]); return SC.eulerMaclaurin({ f: c, tree: c.tree, m, N }); };
near("ζ(2)", em("1/k^2", 1, Infinity).S, Math.PI ** 2 / 6, 1e-14);
near("ζ(3)", em("1/k^3", 1, Infinity).S, 1.2020569031595942, 1e-14);
near("H_1e12", em("1/k", 1, 1e12).S, 28.208236780830582, 1e-13);
eq("Σ1/k diverges (integral unconverged)", em("1/k", 1, Infinity).integ.unconverged, true);
near("CVZ ln 2", SC.cvz((j) => 1 / (j + 1), 25), Math.LN2, 1e-15);
eq("identify π²/6", SC.identify(Math.PI ** 2 / 6), "\\dfrac{\\pi^2}{6} = \\zeta(2)");

// ?q= parser
eq("query sum", JSON.stringify(SC.parseQuery("sum k^2, k=1..n")), JSON.stringify({ widget: "sigma", f: "k^2", m: "1", n: "n" }));
eq("query recurrence", SC.parseQuery("a(n)=a(n-1)+a(n-2), a(0)=0, a(1)=1").init, ["0", "1"]);
eq("query terms", SC.parseQuery("2, 6, 12, 20, 30").widget, "find");

// strong induction engine
eq("Frobenius 3,5", SI.stamps([3, 5], 40).frob, 7);
eq("Frobenius 4,7", SI.stamps([4, 7], 50).frob, 17);
eq("Frobenius 6,9,20", SI.stamps([6, 9, 20], 80).frob, 43);
eq("stamps rep 23 (3,5)", (() => { const r2 = SI.stamps([3, 5], 40).rep(23); return 3 * (r2[3] || 0) + 5 * (r2[5] || 0); })(), 23);
eq("Fibonacci with one base case fails at 3", SI.propagate(SI.DEP.fib.deps, 1, 1, 10).st[2], "fail");
eq("Fibonacci with two base cases all ok", Object.values(SI.propagate(SI.DEP.fib.deps, 1, 2, 30).st).every((x) => x === "base" || x === "ok"), true);
eq("stamp35 needs 3 base cases", SI.propagate(SI.DEP.stamp35.deps, 8, 2, 10).st[10], "fail");
eq("factor preset: primes direct", SI.propagate(SI.DEP.factor.deps, 2, 0, 20, true).st[13], "prime");
eq("prime factors 360", JSON.stringify(SI.primeFactors(360)), JSON.stringify({ 2: 3, 3: 2, 5: 1 }));
eq("take-away {1,2,3} losing", SI.gameTable([1, 2, 3], 16).filter((x) => !x.w).map((x) => x.n), [0, 4, 8, 12, 16]);
eq("take-away {1,3,4} losing", SI.gameTable([1, 3, 4], 16).filter((x) => !x.w).map((x) => x.n), [0, 2, 7, 9, 14, 16]);
eq("Zeckendorf 100", SI.zeckendorf(100).map((x) => x.f), [89, 8, 3]);
eq("tilings 2×5", SI.tilings(5).length, 8);
near("dominant root Fibonacci = φ", SI.dominantRoot([1, 1]), (1 + Math.sqrt(5)) / 2, 1e-12);
near("dominant root control 0.5, 0.3", SI.dominantRoot([0.5, 0.3]), 0.8520797289396148, 1e-10);

console.log(fails ? `\n${fails} of ${n} checks failed` : `✓ all ${n} checks passed`);
process.exit(fails ? 1 : 0);
