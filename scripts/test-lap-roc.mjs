// Checks for assets/lap-roc.js (the "why Re s > 0" labs) and every number printed on /learn/laplace-transform/why-re-s-positive/.
// Run: node scripts/test-lap-roc.mjs   (exits 1 on failure)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
fs.copyFileSync(new URL("../assets/lap-roc.js", import.meta.url), "/tmp/lap-roc-test.cjs");
const R = require("/tmp/lap-roc-test.cjs");
let bad = 0;
const near = (a, b, tol, msg) => { if (!(Math.abs(a - b) <= tol)) { bad++; console.log("FAIL", msg, a, b); } };

// closed form of the partial integral vs Simpson, inside, on and outside the ROC, with a ≠ 0 too
for (const [c, a, s, w, T] of [[1, 0, 0.3, 2, 5], [5, 0, 2, 3, 50], [2, 0, 0, 3, 1.7], [1, 0, -0.4, 1, 3], [3, 1, 2, -1, 4], [1, 0, 0, 0, 2.5], [1, 0, 1, 0, 7], [4, 2, 1, 1, 2]]) {
  const p = R.partial(c, a, s, w, T), q = R.simpson(c, a, s, w, T, 20000);
  near(Math.hypot(p[0] - q[0], p[1] - q[1]), 0, 1e-8, `partial vs simpson ${[c, a, s, w, T]}`);
}
// U-3: 5/(2+3j) = 10/13 − 15/13 j
const u3 = R.limit(5, 0, 2, 3); near(u3[0], 10 / 13, 1e-12, "U-3 re"); near(u3[1], -15 / 13, 1e-12, "U-3 im");
// U4 / U-2: relative error = e^(−σT) for any ω
for (const [s, w, T] of [[0.3, 2, 5], [0.1, 7, 9], [1.2, -3, 2]]) {
  const I = R.partial(1, 0, s, w, T), L = R.limit(1, 0, s, w);
  near(Math.hypot(I[0] - L[0], I[1] - L[1]) / Math.hypot(L[0], L[1]), Math.exp(-s * T), 1e-12, `relative error ${s},${w}`);
}
near(Math.log(100) / 0.1, 46.05, 0.01, "T for 1 % at σ = 0.1");
near(Math.log(1000) / 2, 3.45, 0.01, "U-3 T for 0.1 %");
near(Math.log(1000) / 0.2, 34.54, 0.01, "exercise 5");
// U-5: s = 3j on the circle centre −j/3 radius 1/3
for (const [T, re, im] of [[Math.PI / 6, 1 / 3, -1 / 3], [Math.PI / 3, 0, -2 / 3], [2 * Math.PI / 3, 0, 0]]) {
  const I = R.partial(1, 0, 0, 3, T); near(I[0], re, 1e-12, "U-5 re " + T); near(I[1], im, 1e-12, "U-5 im " + T);
  near(Math.hypot(I[0], I[1] + 1 / 3), 1 / 3, 1e-12, "U-5 radius");
}
if (R.limit(1, 0, 0, 3) !== null || R.limit(1, 0, -0.1, 2) !== null) { bad++; console.log("FAIL limit outside ROC should be null"); }
if (R.state(0, 0, 2) !== "axis" || R.state(0, 0, 0) !== "zero" || R.state(0.1, 0, 0) !== "conv" || R.state(1.5, 2, 0) !== "div") { bad++; console.log("FAIL state"); }
// exercises 2, 9, U-6 and the figure note 1/(0.3+2j)
const e2 = R.limit(3, 0, 1, -1); near(e2[0], 1.5, 1e-12, "ex 2 re"); near(e2[1], 1.5, 1e-12, "ex 2 im");
const e9 = R.limit(1, 0, 3, 4); near(e9[0], 0.12, 1e-12, "ex 9 re"); near(e9[1], -0.16, 1e-12, "ex 9 im");
const f = R.limit(1, 0, 0.3, 2); near(f[0], 0.07, 0.005, "fig re"); near(f[1], -0.49, 0.005, "fig im");
near(Math.exp(-2), 0.1353, 5e-5, "exercise 4");
// U-8: y(t) = 15(1 − e^(−t/2)) and the final value 15
near(15 * (1 - Math.exp(-40)), 15, 1e-9, "U-8 final value");

// the page: built, no KaTeX errors, all figures filled, labs present
const html = fs.readFileSync(new URL("../learn/laplace-transform/why-re-s-positive/index.html", import.meta.url), "utf8");
if (/katex-error/.test(html)) { bad++; console.log("FAIL katex error on page"); }
if (/<!--FIG:roc-[\w-]+--><!--\/FIG-->/.test(fs.readFileSync(new URL("../src/pages/learn/laplace-transform/why-re-s-positive.html", import.meta.url), "utf8"))) { bad++; console.log("FAIL empty figure block: run python3 scripts/roc_figs.py"); }
for (const k of ['class="roc-real"', 'class="roc-euler"', 'lap-roc.js', 'application/ld+json', 'FAQPage']) if (!html.includes(k)) { bad++; console.log("FAIL page lacks", k); }
console.log(bad ? `${bad} failure(s)` : "lap-roc: all checks passed");
process.exit(bad ? 1 : 0);
