// Tests the pure functions of assets/la-num.js (rank, LU, Cholesky, iterative methods, pivoting, drill generators).
// Usage: node scripts/test-la-num.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/la-num.js"), "utf8"), ctx);
const L = ctx.LANum;
let fails = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log(`✗ ${name}: got ${g} want ${w}`); } else console.log(`✓ ${name}`);
};
const S = (M) => M.map((r) => r.map((x) => x.str().replace("−", "-")));
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

// rank explorer
let r = L.rankReport(L.parseMatrix("1,2,0,3;2,4,1,7;-1,-2,2,-1"), false);
eq("R-2 rank", r.rankA, 2);
eq("R-2 null basis", r.nullBasis.map((v) => v.map((x) => x.str().replace("−", "-"))), [["-2", "1", "0", "0"], ["-3", "0", "-1", "1"]]);
eq("R-3 rank", L.rankOf(L.parseMatrix("1,1,1,1;1,2,3,4;1,3,6,10;2,3,4,5")), 3);
eq("R-6 a=5,b=3", L.rankReport(L.parseMatrix("1,1,1,1;1,2,3,2;1,3,5,3"), true).kind, "inf");
eq("R-6 a=5,b=4", L.rankReport(L.parseMatrix("1,1,1,1;1,2,3,2;1,3,5,4"), true).kind, "none");
eq("R-6 a=6,b=4", L.rankReport(L.parseMatrix("1,1,1,1;1,2,3,2;1,3,6,4"), true).xp.map((x) => x.str().replace("−", "-")), ["1", "-1", "1"]);
eq("fractions", L.parseQ("-0.25").str().replace("−", "-"), "-1/4");
// parameter k
const dp = L.pDet([["1", "1", "k"], ["1", "k", "1"], ["k", "1", "1"]].map((row) => row.map(L.polyParse)));
eq("det poly", dp, [-2, 3, 0, -1]);
eq("critical k", L.ratRoots(dp).map((x) => x.str().replace("−", "-")), ["1", "1", "-2"]);
// pivoting
eq("no pivot eps=1e-4 s=3", L.gaussFl([[1e-4, 1], [1, 1]], [1, 2], 3, false).x, [0, 1]);
eq("pivot eps=1e-4 s=3", L.gaussFl([[1e-4, 1], [1, 1]], [1, 2], 3, true).x, [1, 1]);
eq("no pivot eps=1e-5 s=4", L.gaussFl([[1e-5, 1], [1, 1]], [1, 2], 4, false).x, [0, 1]);
// LU
let lu = L.luExact(L.parseMatrix("1,2,4;3,8,14;2,6,13"), false);
eq("N-2 L", S(lu.L), [["1", "0", "0"], ["3", "1", "0"], ["2", "1", "1"]]);
eq("N-2 U", S(lu.U), [["1", "2", "4"], ["0", "2", "2"], ["0", "0", "3"]]);
eq("N-2 det", lu.det.str(), "6");
lu = L.luExact(L.parseMatrix("2,1,1;4,-6,0;-2,7,2"), true);
eq("N-3 P", lu.P, [1, 0, 2]);
eq("N-3 det", lu.det.str().replace("−", "-"), "-16");
eq("N-4 cholesky", L.cholesky([[4, 2, 2], [2, 5, 3], [2, 3, 6]]).L, [[2, 0, 0], [1, 2, 0], [1, 1, 2]]);
eq("cholesky rejects", !!L.cholesky([[1, 2], [2, 1]]).fail, true);
// iterative methods
const A = [[4, -1, 1], [4, -8, 1], [-2, 1, 5]], b = [7, -21, 15], xs = L.solveExact(A, b);
const J = L.iterRun(A, b, [1, 2, 2], "jacobi", 1, 1e-6, 500, xs), G = L.iterRun(A, b, [1, 2, 2], "gs", 1, 1e-6, 500, xs);
eq("N-6 jacobi x1", J.hist[1], [1.75, 3.375, 3]);
eq("N-6 gs x1", G.hist[1], [1.75, 3.75, 2.95]);
eq("rho J", near(L.specRad(L.iterMatrix(A, "jacobi", 1)), 0.33471647504, 2e-3), true);
eq("rho GS", near(L.specRad(L.iterMatrix(A, "gs", 1)), 0.125, 2e-3), true);
const T = L.tri(10);
eq("tri10 rhoJ", near(L.specRad(L.iterMatrix(T.A, "jacobi", 1)), Math.cos(Math.PI / 11), 2e-3), true);
eq("diag dominant", [L.diagDom(A), L.diagDom([[1, 2], [3, 1]])], [true, false]);
eq("diverges when swapped", L.iterRun([[1, 2], [3, 1]], [5, 5], [0.6, 1.4], "gs", 1, 1e-8, 500, null).div, true);
// condition numbers (exact)
eq("kappa H4", L.hilbertCond(4).str(), "28375");
// drill generators produce consistent answers
let bad = 0;
for (const k of Object.keys(L.DRILL)) for (let i = 0; i < 400; i++) { const P = L.DRILL[k].gen(); if (!P.ans || !P.q || !P.sol || !P.ans.str) bad++; }
eq("drill generators", bad, 0);
eq("check answers", [L.checkAns("-3/4", new L.Q(-3, 4)), L.checkAns("0.333", new L.Q(1, 3)), L.checkAns("0.3", new L.Q(1, 3)), L.checkAns("x", new L.Q(1))], [true, true, false, null]);

console.log(fails ? `\n${fails} failure(s)` : "\nall la-num checks passed");
process.exit(fails ? 1 : 0);
