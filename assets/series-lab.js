/* Sequences & series chapter labs (chapter 26, /learn/sequences-and-series/) — plain JS.
   Needs /assets/mathkit.js (MK) and /assets/seq-lab.js (SQ: safe expression parser + Taylor jets); KaTeX (/assets/vendor/katex.min.js) for live TeX.
   Every widget reads its start state from data-* attributes; a page button
     <button data-sr-target="<widget id>" data-sr-set='{"preset":"basel","n":20}'>
   reloads a widget through box._set(obj) and scrolls to it.
   <div class="sr-sums" data-preset="geo|geoneg|tele|harmonic|basel|altharm|leibniz|e|n2n|grandi|custom" [data-a="1/n^2"] [data-n0="1"] [data-n="12"]>
        partial sums S_N with the bars a_n, the exact sum, the error and a remainder bound
   <div class="sr-integral" data-preset="p|nlog|nlog2|x21|exp" [data-p="2"] [data-n="10"]>
        integral test: rectangles below / above y = f(x), bounds S_N + ∫_{N+1}^∞ f ≤ S ≤ S_N + ∫_N^∞ f
   <div class="sr-alt" data-mode="error|rearrange" [data-preset="altharm|leibniz|altp2|einv|altsqrt"] [data-target="1.5"]>
        alternating-series error bound |S − S_N| ≤ b_{N+1}; Riemann rearrangement of the alternating harmonic series
   <div class="sr-quiz" [data-level="all|b|i|a"]>   choose the test and the verdict for 40 series (with worked reasoning)
   <div class="sr-power" data-preset="geo|log1|ln1p|inv1x2|atan|exp|cos|fact|shift|li2|shift2|geo2|sqrt|custom" [data-n="8"]>
        interval of convergence, partial sums against f(x), endpoint status and the disc of convergence in the complex plane
   <div class="sr-need" data-f="exp|sin|cos|ln1p|atan" [data-x="1"] [data-tol="6"]>   how many Taylor terms are needed for a target accuracy
   <div class="sr-laurent" data-preset="r12|z1|z2z3|zz1|dbl|zt|zt2|exp1z|sinz4|remov" [data-center="0"] [data-region="0"]>
        Laurent series of each annulus, principal part, residue, test point that converges only inside the annulus, z-transform view
   <div class="sr-drill" [data-cats="arith,geo,dec,tele,verdict,radius,taylor,limit,residue"]>   unlimited random practice with answer checking
   <div class="sr-approx" data-mode="pendulum|mcu|diode">   engineering approximations built from Taylor series
   Node: module.exports exposes the pure helpers (zeta, laurentCoeffs, regionsFor, QUIZ, drill generators) for tests. */
(function (root) {
  "use strict";
  var MK = root.MK, SQ = root.SQ;
  var inBrowser = typeof document !== "undefined";
  if (!MK || !SQ) { if (root.console) console.error("series-lab.js needs mathkit.js and seq-lab.js"); return; }
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var fmt = MK.fmt, esc = MK.esc;
  var T = function (s, d) {
    if (root.katex) { try { return root.katex.renderToString(s, { displayMode: !!d, throwOnError: false, strict: "ignore" }); } catch (e) { /* fall through */ } }
    return "<code>" + esc(s) + "</code>";
  };
  function rich(s) { return String(s).replace(/\\\(([\s\S]+?)\\\)/g, function (_, t) { return T(t, false); }); }
  function chipRow(items, attr, cur, cls) {
    return '<div class="lap-chips' + (cls ? " " + cls : "") + '">' + items.map(function (it) {
      return '<button type="button" class="lap-chip' + (String(it.id) === String(cur) ? " on" : "") + '" data-' + attr + '="' + it.id + '">' + it.l + "</button>";
    }).join("") + "</div>";
  }
  function setOn(box, attr, val) { $$("[data-" + attr + "]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-" + attr) === String(val)); }); }
  function slider(key, label, min, max, step, val) {
    return '<label class="lap-row cl-sl"><span class="lap-lbl">' + label + '</span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output></output></label>';
  }
  function bindSliders(box, st, draw, show) {
    $$("input[type=range][data-k]", box).forEach(function (r) {
      var k = r.getAttribute("data-k"), out = r.parentNode.querySelector("output");
      var upd = function () { out.textContent = show && show[k] ? show[k](+r.value) : r.value; };
      upd();
      r.addEventListener("input", function () { st[k] = +r.value; upd(); draw(); });
    });
  }
  function setSlider(box, k, v, show) {
    var r = box.querySelector('input[data-k="' + k + '"]'); if (!r) return;
    r.value = v; var out = r.parentNode.querySelector("output");
    out.textContent = show && show[k] ? show[k](+r.value) : r.value;
  }
  function texLines(el, lines) { el.innerHTML = lines.map(function (l) { return T(l, true); }).join(""); }
  function flag(ok, text) { return '<span class="lap-flag ' + (ok ? "ok" : "no") + '">' + text + "</span>"; }
  function numIn(s) { var c = SQ.compile(String(s), []); var v = c.fn({}); if (!isFinite(v)) throw new Error("ตัวเลขไม่ถูกต้อง"); return v; }
  var fact = SQ.fact;
  // fit a plot to the widget width so its 10–11 px labels stay readable on phones (viewBox ≈ CSS pixels)
  function plotIn(box, o) {
    var cw = box && box.clientWidth ? box.clientWidth - 24 : o.w, w = Math.round(Math.max(300, Math.min(o.w, cw)));
    if (w < o.w) { o.h = Math.round(Math.max(o.h * w / o.w, Math.min(o.h, w * 0.7))); o.w = w; }
    return MK.plot(o);
  }
  var GAMMA = 0.5772156649015329;
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function fracTex(p, q) { if (q < 0) { p = -p; q = -q; } var g = gcd(p, q) || 1; p /= g; q /= g; return q === 1 ? String(p) : (p < 0 ? "-" : "") + "\\tfrac{" + Math.abs(p) + "}{" + q + "}"; }
  function binom(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }

  // Riemann zeta for p > 1 (Euler–Maclaurin with N = 20, error < 1e-13)
  function zeta(p) {
    if (!(p > 1)) return Infinity;
    var N = 20, s = 0;
    for (var n = 1; n < N; n++) s += Math.pow(n, -p);
    s += Math.pow(N, 1 - p) / (p - 1) + Math.pow(N, -p) / 2 + p / (12 * Math.pow(N, p + 1)) -
      p * (p + 1) * (p + 2) / (720 * Math.pow(N, p + 3)) + p * (p + 1) * (p + 2) * (p + 3) * (p + 4) / (30240 * Math.pow(N, p + 5));
    return s;
  }

  // complex numbers as [re, im]
  var C = {
    c: function (re, im) { return [re, im || 0]; },
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1]]; },
    mul: function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; },
    div: function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    scale: function (a, s) { return [a[0] * s, a[1] * s]; },
    abs: function (a) { return Math.hypot(a[0], a[1]); },
    pow: function (a, n) {
      var r = [1, 0], b = a, k = Math.abs(n);
      while (k) { if (k & 1) r = C.mul(r, b); b = C.mul(b, b); k >>= 1; }
      return n < 0 ? C.div([1, 0], r) : r;
    },
    exp: function (a) { var m = Math.exp(a[0]); return [m * Math.cos(a[1]), m * Math.sin(a[1])]; },
    sin: function (a) { return [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])]; },
    cos: function (a) { return [Math.cos(a[0]) * Math.cosh(a[1]), -Math.sin(a[0]) * Math.sinh(a[1])]; }
  };
  function cTex(z, opt) { return MK.niceC(Math.abs(z[0]) < 1e-12 ? 0 : z[0], Math.abs(z[1]) < 1e-12 ? 0 : z[1], Object.assign({ i: true, qmax: 4000 }, opt || {})); }

  // ======================================================================= 1. partial sums
  var SUMS = [
    { id: "geo", l: "Σ (1/2)ⁿ", a: "(1/2)^n", n0: 0, S: 2, St: "2", kind: "conv", tex: "\\sum_{n=0}^{\\infty}\\left(\\tfrac12\\right)^{n}",
      rem: function (N) { return { v: Math.pow(0.5, N) / 0.5, exact: true, t: "R_N = \\dfrac{a r^{N}}{1-r} = \\left(\\tfrac12\\right)^{N-1}" }; } },
    { id: "geoneg", l: "Σ (−1/2)ⁿ", a: "(-1/2)^n", n0: 0, S: 2 / 3, St: "\\tfrac23", kind: "conv", tex: "\\sum_{n=0}^{\\infty}\\left(-\\tfrac12\\right)^{n}",
      rem: function (N) { return { v: Math.abs(Math.pow(-0.5, N) / 1.5), exact: true, t: "|R_N| = \\dfrac{|r|^{N}}{1-r} = \\tfrac23\\left(\\tfrac12\\right)^{N}" }; } },
    { id: "tele", l: "Σ 1/(n(n+1))", a: "1/(n(n+1))", n0: 1, S: 1, St: "1", kind: "conv", tex: "\\sum_{n=1}^{\\infty}\\frac{1}{n(n+1)}",
      rem: function (N) { return { v: 1 / (N + 1), exact: true, t: "S_N = 1 - \\dfrac{1}{N+1},\\ R_N = \\dfrac{1}{N+1}" }; } },
    { id: "harmonic", l: "Σ 1/n ฮาร์มอนิก", a: "1/n", n0: 1, S: Infinity, kind: "div", tex: "\\sum_{n=1}^{\\infty}\\frac1n",
      guide: function (n) { return Math.log(n) + GAMMA; }, guideL: "ln N + γ" },
    { id: "basel", l: "Σ 1/n²", a: "1/n^2", n0: 1, S: Math.PI * Math.PI / 6, St: "\\tfrac{\\pi^2}{6}", kind: "conv", tex: "\\sum_{n=1}^{\\infty}\\frac{1}{n^2}",
      rem: function (N) { return { lo: 1 / (N + 1), hi: 1 / N, t: "\\dfrac{1}{N+1} \\le R_N \\le \\dfrac1N\\ \\text{(ปริพันธ์)}" }; } },
    { id: "altharm", l: "Σ (−1)ⁿ⁺¹/n", a: "(-1)^(n+1)/n", n0: 1, S: Math.LN2, St: "\\ln 2", kind: "conv", tex: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n+1}}{n}",
      rem: function (N) { return { v: 1 / (N + 1), bound: true, t: "|R_N| \\le b_{N+1} = \\dfrac{1}{N+1}\\ \\text{(อนุกรมสลับ)}" }; } },
    { id: "leibniz", l: "Σ (−1)ⁿ/(2n+1) → π/4", a: "(-1)^n/(2n+1)", n0: 0, S: Math.PI / 4, St: "\\tfrac{\\pi}{4}", kind: "conv", tex: "\\sum_{n=0}^{\\infty}\\frac{(-1)^{n}}{2n+1}",
      rem: function (N) { return { v: 1 / (2 * N + 1), bound: true, t: "|R_N| \\le \\dfrac{1}{2N+1}" }; } },
    { id: "e", l: "Σ 1/n! → e", a: "1/n!", n0: 0, S: Math.E, St: "e", kind: "conv", tex: "\\sum_{n=0}^{\\infty}\\frac{1}{n!}",
      rem: function (N) { return { v: N >= 1 ? (N + 1) / (N * fact(N)) : Infinity, bound: true, t: "R_N \\le \\dfrac{1}{N!}\\cdot\\dfrac{N+1}{N}" }; } },
    { id: "n2n", l: "Σ n/2ⁿ", a: "n/2^n", n0: 1, S: 2, St: "2", kind: "conv", tex: "\\sum_{n=1}^{\\infty}\\frac{n}{2^n}",
      rem: function (N) { return { v: (N + 2) / Math.pow(2, N), exact: true, t: "R_N = \\dfrac{N+2}{2^{N}}" }; } },
    { id: "grandi", l: "Σ (−1)ⁿ แกว่ง", a: "(-1)^n", n0: 0, S: NaN, kind: "osc", tex: "\\sum_{n=0}^{\\infty}(-1)^{n}" },
    { id: "custom", l: "✎ พิมพ์เอง", a: "1/n^3", n0: 1, kind: "custom" }
  ];
  function initSums(box) {
    var d = box.dataset;
    var st = { pre: d.preset || "geo", N: +(d.n || 12), a: d.a || "1/n^3", n0: d.n0 != null ? +d.n0 : 1 };
    box.innerHTML = chipRow(SUMS, "p", st.pre, "sr-pre") +
      '<div class="lap-row sr-cus"><label class="lap-lbl">aₙ =</label><input class="lap-in" data-in="a" spellcheck="false" aria-label="term a_n"><label class="lap-lbl">เริ่มที่ n =</label><input class="lap-in sm" data-in="n0" inputmode="numeric" aria-label="first index"></div>' +
      slider("N", "จำนวนพจน์ N", 1, 80, 1, st.N) +
      '<div class="lap-eq sr-eq"></div><div class="sr-plot"></div><div class="sr-info"></div>';
    var eq = box.querySelector(".sr-eq"), plot = box.querySelector(".sr-plot"), info = box.querySelector(".sr-info"), cus = box.querySelector(".sr-cus");
    function preset() { return SUMS.filter(function (p) { return p.id === st.pre; })[0] || SUMS[0]; }
    function draw() {
      var P = preset(), src = P.kind === "custom" ? st.a : P.a, n0 = P.kind === "custom" ? st.n0 : P.n0, f;
      cus.hidden = P.kind !== "custom";
      try { var cc = SQ.compile(src, ["n"], { n: "n" }); f = function (n) { return cc.fn({ n: n }); }; }
      catch (e) { info.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; plot.innerHTML = ""; return; }
      var N = st.N, terms = [], sums = [], S = 0;
      for (var k = 0; k < N; k++) { var t = f(n0 + k); terms.push(t); S += t; sums.push(S); }
      var SN = S;
      var Sx = P.S, Stex = P.St;
      if (P.kind === "custom") { // numerical evidence only
        var big = 0, bigN = 20000; for (var m = n0; m < n0 + bigN; m++) { var tv = f(m); if (!isFinite(tv)) break; big += tv; }
        var big2 = big; for (var m2 = n0 + bigN; m2 < n0 + 2 * bigN; m2++) { var tv2 = f(m2); if (!isFinite(tv2)) break; big2 += tv2; }
        Sx = Math.abs(big2 - big) < 1e-6 * Math.max(1, Math.abs(big2)) ? big2 : NaN;
        Stex = isFinite(Sx) ? "\\approx " + MK.sig(Sx, 7) : null;
      }
      MK.tex(eq, (P.tex || "\\sum_{n=" + n0 + "}^{\\infty} " + SQ.compile(src, ["n"]).tex) + (Stex ? " = " + Stex : P.kind === "div" ? " = \\infty\\ (\\text{ลู่ออก})" : ""), true);
      var xs = terms.map(function (_, i) { return n0 + i; });
      var series = [{ pts: xs.map(function (x, i) { return [x, sums[i]]; }), color: "var(--accent)", width: 2.4 }];
      if (P.guide) series.push({ pts: MK.sample(P.guide, Math.max(1, n0), n0 + N, 200), color: "var(--ink-3)", dash: "4 4", width: 1.4 });
      var segs = xs.map(function (x, i) { return { x1: x, y1: 0, x2: x, y2: terms[i], color: "var(--signal)", width: N > 40 ? 2 : 4 }; });
      var lo = Math.min(0, Math.min.apply(null, sums), Math.min.apply(null, terms)), hi = Math.max(Math.max.apply(null, sums), Math.max.apply(null, terms));
      if (isFinite(Sx)) { lo = Math.min(lo, Sx); hi = Math.max(hi, Sx); }
      var pad = (hi - lo) * 0.12 + 1e-9;
      plot.innerHTML = plotIn(box, { w: 640, h: 290, xmin: n0 - 0.8, xmax: n0 + N - 0.2 + (N < 4 ? 1 : 0), ymin: lo - pad * 0.4, ymax: hi + pad, series: series, segs: segs,
        hlines: isFinite(Sx) ? [{ y: Sx, color: "var(--ok)", label: "S" }] : [],
        marks: [{ x: n0 + N - 1, y: SN, color: "var(--accent)" }], xlabel: "n", id: MK.uid("srs"), label: "partial sums of a series" });
      var rows = "<tr><td>ผลบวกย่อย " + T("S_{" + N + "}", false) + " (บวก " + N + " พจน์แรก)</td><td><b>" + fmt(SN, 10) + "</b></td></tr>";
      if (isFinite(Sx)) {
        rows += "<tr><td>ผลบวกจริง " + T("S", false) + "</td><td>" + (Stex && P.kind !== "custom" && !/^[\d.]+$/.test(Stex) ? T(Stex, false) + " = " : "") + fmt(Sx, 10) + "</td></tr>" +
          "<tr><td>ความคลาดเคลื่อน " + T("|S - S_N|", false) + "</td><td><b>" + fmt(Math.abs(Sx - SN), 3) + "</b></td></tr>";
        if (P.rem) {
          var R = P.rem(N), rv = R.lo != null ? fmt(R.lo, 3) + " ≤ R ≤ " + fmt(R.hi, 3) : fmt(R.v, 3) + (R.exact ? " (ค่าแม่นตรง)" : " (ขอบเขตบน)");
          rows += "<tr><td>สูตรเศษเหลือ " + T(R.t, false) + "</td><td>" + rv + "</td></tr>";
        }
      } else if (P.kind === "div") {
        rows += "<tr><td>เทียบกับ " + (P.guideL || "") + "</td><td>" + fmt(P.guide(n0 + N - 1), 8) + " (เส้นประ)</td></tr>";
      }
      var note = P.kind === "div" ? "พจน์ " + T("a_n \\to 0", false) + " แต่ผลบวกย่อยโตไม่หยุดแบบ " + T("\\ln N", false) + " — บวกล้านพจน์ได้แค่ราว 14.39 ก็ยังลู่ออก เพราะไม่มีค่าใดที่ผลบวกย่อยเข้าใกล้"
        : P.kind === "osc" ? "ผลบวกย่อยสลับ 1, 0, 1, 0, … ไม่เข้าใกล้ค่าใดค่าหนึ่ง และพจน์ " + T("(-1)^n", false) + " ไม่เข้าใกล้ 0 จึงลู่ออกตาม nth-term test"
        : P.kind === "custom" ? "ค่า S ที่แสดงคือผลบวก 40,000 พจน์ใช้เป็น<b>หลักฐานเชิงตัวเลข</b> ไม่ใช่บทพิสูจน์ (Σ 1/(n ln n) ดูเหมือนนิ่งบนจอแต่ลู่ออก) ให้ยืนยันด้วยการทดสอบในบทเรียน"
        : "แท่งสีฟ้า = พจน์ " + T("a_n", false) + " · เส้นสีส้ม = ผลบวกย่อย " + T("S_n", false) + " · เส้นเขียว = ผลบวกจริง ยิ่ง N มาก " + T("S_N", false) + " ยิ่งเข้าใกล้เส้นเขียว";
      info.innerHTML = '<table class="lap-pt"><tbody>' + rows + '</tbody></table><p class="lap-help">' + note + "</p>";
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b) return; st.pre = b.getAttribute("data-p"); setOn(box, "p", st.pre); draw(); });
    $$(".lap-in", box).forEach(function (inp) {
      var go = function () { if (inp.getAttribute("data-in") === "a") st.a = inp.value; else { var v = parseInt(inp.value, 10); if (isFinite(v)) st.n0 = v; } draw(); };
      inp.addEventListener("change", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    box.querySelector('[data-in="a"]').value = st.a; box.querySelector('[data-in="n0"]').value = st.n0;
    bindSliders(box, st, draw);
    box._set = function (o) {
      if (o.preset) st.pre = o.preset; if (o.n) { st.N = o.n; setSlider(box, "N", o.n); }
      if (o.a) { st.a = o.a; st.pre = "custom"; box.querySelector('[data-in="a"]').value = o.a; }
      if (o.n0 != null) { st.n0 = o.n0; box.querySelector('[data-in="n0"]').value = o.n0; }
      setOn(box, "p", st.pre); draw();
    };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 2. integral test
  var INTS = [
    { id: "p", l: "1/xᵖ (อนุกรม p)", n0: 1, f: function (x, p) { return Math.pow(x, -p); }, tail: function (a, p) { return p > 1 ? Math.pow(a, 1 - p) / (p - 1) : Infinity; },
      area: function (a, b, p) { return Math.abs(p - 1) < 1e-12 ? Math.log(b / a) : (Math.pow(b, 1 - p) - Math.pow(a, 1 - p)) / (1 - p); }, sum: function (p) { return zeta(p); },
      tex: function (p) { return "\\sum_{n=1}^{\\infty}\\frac{1}{n^{" + p + "}}"; }, ftex: function (p) { return "f(x) = x^{-" + p + "}"; } },
    { id: "nlog", l: "1/(x ln x)", n0: 2, f: function (x) { return 1 / (x * Math.log(x)); }, tail: function () { return Infinity; },
      area: function (a, b) { return Math.log(Math.log(b)) - Math.log(Math.log(a)); }, sum: function () { return Infinity; },
      tex: function () { return "\\sum_{n=2}^{\\infty}\\frac{1}{n\\ln n}"; }, ftex: function () { return "\\int \\frac{dx}{x\\ln x} = \\ln(\\ln x)"; } },
    { id: "nlog2", l: "1/(x (ln x)²)", n0: 2, f: function (x) { var L = Math.log(x); return 1 / (x * L * L); }, tail: function (a) { return 1 / Math.log(a); },
      area: function (a, b) { return 1 / Math.log(a) - 1 / Math.log(b); }, sum: function () { return 2.1097428012369; },
      tex: function () { return "\\sum_{n=2}^{\\infty}\\frac{1}{n(\\ln n)^2}"; }, ftex: function () { return "\\int \\frac{dx}{x(\\ln x)^2} = -\\frac{1}{\\ln x}"; } },
    { id: "x21", l: "1/(x² + 1)", n0: 1, f: function (x) { return 1 / (x * x + 1); }, tail: function (a) { return Math.PI / 2 - Math.atan(a); },
      area: function (a, b) { return Math.atan(b) - Math.atan(a); }, sum: function () { return (Math.PI / Math.tanh(Math.PI) - 1) / 2; },
      tex: function () { return "\\sum_{n=1}^{\\infty}\\frac{1}{n^2+1}"; }, ftex: function () { return "\\int \\frac{dx}{x^2+1} = \\arctan x"; } },
    { id: "exp", l: "e⁻ˣ", n0: 1, f: function (x) { return Math.exp(-x); }, tail: function (a) { return Math.exp(-a); },
      area: function (a, b) { return Math.exp(-a) - Math.exp(-b); }, sum: function () { return 1 / (Math.E - 1); },
      tex: function () { return "\\sum_{n=1}^{\\infty}e^{-n}"; }, ftex: function () { return "\\int e^{-x}dx = -e^{-x}"; } }
  ];
  function initIntegral(box) {
    var d = box.dataset;
    var st = { pre: d.preset || "p", p: +(d.p || 2), N: +(d.n || 10), view: "both" };
    box.innerHTML = chipRow(INTS, "p", st.pre, "sr-pre") +
      chipRow([{ id: "below", l: "สี่เหลี่ยมใต้กราฟ" }, { id: "above", l: "สี่เหลี่ยมเหนือกราฟ" }, { id: "both", l: "ทั้งสองแบบ" }], "v", st.view) +
      '<div class="sr-pwrap">' + slider("p", "เลขชี้กำลัง p", 0.5, 3, 0.05, st.p) + "</div>" +
      slider("N", "บวกจริงถึง n = N", 2, 200, 1, st.N) +
      '<div class="lap-eq sr-eq"></div><div class="sr-plot"></div><div class="sr-info"></div>';
    var eq = box.querySelector(".sr-eq"), plot = box.querySelector(".sr-plot"), info = box.querySelector(".sr-info"), pw = box.querySelector(".sr-pwrap");
    function draw() {
      var P = INTS.filter(function (q) { return q.id === st.pre; })[0] || INTS[0], p = st.p, n0 = P.n0;
      pw.hidden = P.id !== "p";
      var f = function (x) { return P.f(x, p); };
      MK.tex(eq, P.tex(+p.toFixed(2)) + "\\quad\\longleftrightarrow\\quad " + P.ftex(+p.toFixed(2)), true);
      var M = n0 + 10, x0 = n0 - 0.3, x1 = M + 0.5;
      var lower = [], upper = [];
      for (var n = n0; n < M; n++) {
        lower.push([n, f(n + 1)], [n + 1, f(n + 1)]);
        upper.push([n, f(n)], [n + 1, f(n)]);
      }
      var series = [];
      if (st.view !== "below") series.push({ pts: upper, color: "var(--signal)", width: 1.3, fill: 0.14 });
      if (st.view !== "above") series.push({ pts: lower, color: "var(--accent)", width: 1.3, fill: 0.22 });
      series.push({ pts: MK.sample(f, n0, x1, 300), color: "var(--ink)", width: 2.4 });
      var ymax = f(n0) * 1.12;
      plot.innerHTML = plotIn(box, { w: 640, h: 280, xmin: x0, xmax: x1, ymin: 0, ymax: ymax, series: series, xlabel: "x", ylabel: "y = f(x)", id: MK.uid("sri"), label: "integral test rectangles" });
      var N = Math.max(st.N, n0), SN = 0;
      for (var k = n0; k <= N; k++) SN += f(k);
      var lo = SN + P.tail(N + 1, p), hi = SN + P.tail(N, p), S = P.sum(p), conv = isFinite(P.tail(n0, p));
      var rows = "<tr><td>" + T("S_N = \\sum_{n=" + n0 + "}^{N} a_n", false) + " (N = " + N + ")</td><td>" + fmt(SN, 9) + "</td></tr>";
      if (conv) {
        rows += "<tr><td>ขอบล่าง " + T("S_N + \\int_{N+1}^{\\infty} f\\,dx", false) + "</td><td>" + fmt(lo, 10) + "</td></tr>" +
          "<tr><td>ขอบบน " + T("S_N + \\int_{N}^{\\infty} f\\,dx", false) + "</td><td>" + fmt(hi, 10) + "</td></tr>" +
          "<tr><td>ค่ากลาง (ประมาณ S)</td><td><b>" + fmt((lo + hi) / 2, 10) + "</b> ± " + fmt((hi - lo) / 2, 2) + "</td></tr>" +
          "<tr><td>ผลบวกจริง S</td><td>" + fmt(S, 10) + (lo <= S + 1e-12 && S <= hi + 1e-12 ? " ✓ อยู่ในช่วง" : "") + "</td></tr>";
      } else {
        rows += "<tr><td>" + T("\\int_{" + n0 + "}^{N} f\\,dx", false) + "</td><td>" + fmt(P.area(n0, N, p), 6) + " → ∞ เมื่อ N → ∞</td></tr>";
      }
      info.innerHTML = '<p class="lap-note">' + flag(conv, conv ? "ปริพันธ์ลู่เข้า ⇒ อนุกรมลู่เข้า" : "ปริพันธ์ลู่ออก ⇒ อนุกรมลู่ออก") + "</p>" +
        '<table class="lap-pt"><tbody>' + rows + "</tbody></table>" +
        '<p class="lap-help">สีส้ม: สี่เหลี่ยมสูง ' + T("f(n+1)", false) + " อยู่ใต้กราฟ ⇒ " + T("\\sum_{n\\ge " + (n0 + 1) + "} a_n \\le \\int_{" + n0 + "}^{\\infty} f", false) +
        " · สีฟ้า: สูง " + T("f(n)", false) + " อยู่เหนือกราฟ ⇒ " + T("\\sum_{n\\ge " + n0 + "} a_n \\ge \\int_{" + n0 + "}^{\\infty} f", false) +
        (P.id === "p" ? " · ลองเลื่อน p ผ่าน 1: ช่วง p ≤ 1 พื้นที่ไม่จำกัด" : "") + "</p>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); setOn(box, "p", st.pre); draw(); return; }
      b = e.target.closest("[data-v]"); if (b) { st.view = b.getAttribute("data-v"); setOn(box, "v", st.view); draw(); }
    });
    bindSliders(box, st, draw);
    box._set = function (o) { if (o.preset) st.pre = o.preset; if (o.p) { st.p = o.p; setSlider(box, "p", o.p); } if (o.n) { st.N = o.n; setSlider(box, "N", o.n); } setOn(box, "p", st.pre); draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 3. alternating series: error bound + Riemann rearrangement
  var ALTS = [
    { id: "altharm", l: "Σ (−1)ⁿ⁺¹/n → ln 2", n0: 1, b: function (n) { return 1 / n; }, sg: function (n) { return n % 2 ? 1 : -1; }, S: Math.LN2, St: "\\ln 2", tex: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n+1}}{n}", bt: "\\frac{1}{n}" },
    { id: "leibniz", l: "Σ (−1)ⁿ/(2n+1) → π/4", n0: 0, b: function (n) { return 1 / (2 * n + 1); }, sg: function (n) { return n % 2 ? -1 : 1; }, S: Math.PI / 4, St: "\\frac{\\pi}{4}", tex: "\\sum_{n=0}^{\\infty}\\frac{(-1)^{n}}{2n+1}", bt: "\\frac{1}{2n+1}" },
    { id: "altp2", l: "Σ (−1)ⁿ⁺¹/n² → π²/12", n0: 1, b: function (n) { return 1 / (n * n); }, sg: function (n) { return n % 2 ? 1 : -1; }, S: Math.PI * Math.PI / 12, St: "\\frac{\\pi^2}{12}", tex: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n+1}}{n^2}", bt: "\\frac{1}{n^2}" },
    { id: "einv", l: "Σ (−1)ⁿ/n! → 1/e", n0: 0, b: function (n) { return 1 / fact(n); }, sg: function (n) { return n % 2 ? -1 : 1; }, S: 1 / Math.E, St: "\\frac{1}{e}", tex: "\\sum_{n=0}^{\\infty}\\frac{(-1)^{n}}{n!}", bt: "\\frac{1}{n!}" },
    { id: "altsqrt", l: "Σ (−1)ⁿ⁺¹/√n", n0: 1, b: function (n) { return 1 / Math.sqrt(n); }, sg: function (n) { return n % 2 ? 1 : -1; }, S: 0.6048986434216304, St: "(1-\\sqrt2)\\,\\zeta(\\tfrac12)", tex: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n+1}}{\\sqrt n}", bt: "\\frac{1}{\\sqrt n}" }
  ];
  var REARR = [{ id: "1:1", l: "เดิม 1 : 1", p: 1, q: 1 }, { id: "2:1", l: "บวก 2 : ลบ 1", p: 2, q: 1 }, { id: "1:2", l: "บวก 1 : ลบ 2", p: 1, q: 2 }, { id: "1:4", l: "บวก 1 : ลบ 4 → 0", p: 1, q: 4 }, { id: "4:1", l: "บวก 4 : ลบ 1", p: 4, q: 1 }, { id: "T", l: "ไล่ตามเป้า T", p: 0, q: 0 }];
  function initAlt(box) {
    var d = box.dataset;
    var st = { mode: d.mode || "error", pre: d.preset || "altharm", N: +(d.n || 8), k: +(d.tol || 3), rr: d.target != null ? "T" : "2:1", target: d.target != null ? +d.target : 1.5, M: 400 };
    box.innerHTML = chipRow([{ id: "error", l: "ขอบเขตความคลาดเคลื่อน" }, { id: "rearrange", l: "จัดเรียงใหม่ (รีมันน์)" }], "m", st.mode, "sr-modes") +
      '<div class="sr-err">' + chipRow(ALTS, "p", st.pre) + slider("N", "บวก N พจน์", 1, 40, 1, st.N) + slider("k", "ความแม่นยำที่ต้องการ 10^−k", 1, 8, 1, st.k) + "</div>" +
      '<div class="sr-rea">' + chipRow(REARR, "r", st.rr) + slider("target", "เป้าหมาย T", -1.5, 2.5, 0.01, st.target) + slider("M", "จำนวนพจน์ที่ใช้", 40, 3000, 10, st.M) + "</div>" +
      '<div class="lap-eq sr-eq"></div><div class="sr-plot"></div><div class="sr-info"></div>';
    var eq = box.querySelector(".sr-eq"), plot = box.querySelector(".sr-plot"), info = box.querySelector(".sr-info"), pe = box.querySelector(".sr-err"), pr = box.querySelector(".sr-rea");
    function drawErr() {
      var P = ALTS.filter(function (q) { return q.id === st.pre; })[0] || ALTS[0], N = st.N, n0 = P.n0, S = 0, pts = [];
      for (var i = 0; i < N; i++) { var n = n0 + i; S += P.sg(n) * P.b(n); pts.push([i + 1, S]); }
      var bnext = P.b(n0 + N), err = Math.abs(P.S - S);
      MK.tex(eq, P.tex + " = " + P.St + "\\approx " + MK.sig(P.S, 7) + ",\\qquad b_n = " + P.bt, true);
      var lo = Math.min.apply(null, pts.map(function (q) { return q[1]; })), hi = Math.max.apply(null, pts.map(function (q) { return q[1]; }));
      lo = Math.min(lo, S - bnext, P.S); hi = Math.max(hi, S + bnext, P.S); var pad = (hi - lo) * 0.1;
      plot.innerHTML = plotIn(box, { w: 640, h: 280, xmin: 0.4, xmax: N + 0.8, ymin: lo - pad, ymax: hi + pad,
        series: [{ pts: pts, color: "var(--accent)", width: 1.8 }], hlines: [{ y: P.S, color: "var(--ok)", label: "S" }],
        segs: [{ x1: N + 0.35, y1: S - bnext, x2: N + 0.35, y2: S + bnext, color: "var(--signal)", width: 3 }],
        marks: pts.map(function (q, i) { return { x: q[0], y: q[1], r: N > 25 ? 2.5 : 3.6, color: i % 2 ? "var(--signal)" : "var(--accent)" }; }),
        xlabel: "N", id: MK.uid("sra"), label: "alternating series partial sums" });
      var tol = Math.pow(10, -st.k), need = null;
      for (var m = 1; m <= 2000000; m = m < 200 ? m + 1 : Math.ceil(m * 1.02)) { if (P.b(n0 + m) <= tol) { need = m; break; } }
      if (need && need > 200) { var lo2 = Math.floor(need / 1.02) - 1, hi2 = need; while (hi2 - lo2 > 1) { var mid = (lo2 + hi2) >> 1; if (P.b(n0 + mid) <= tol) hi2 = mid; else lo2 = mid; } need = hi2; }
      info.innerHTML = '<table class="lap-pt"><tbody>' +
        "<tr><td>" + T("S_{" + N + "}", false) + "</td><td>" + fmt(S, 10) + "</td></tr>" +
        "<tr><td>ความคลาดเคลื่อนจริง " + T("|S - S_N|", false) + "</td><td><b>" + fmt(err, 3) + "</b></td></tr>" +
        "<tr><td>ขอบเขต " + T("b_{N+1}", false) + "</td><td>" + fmt(bnext, 3) + (err <= bnext + 1e-15 ? " ✓ ครอบค่าจริง" : "") + "</td></tr>" +
        "<tr><td>ทิศของความคลาด</td><td>" + (P.S - S > 0 ? T("S > S_N", false) + " (พจน์ถัดไปเป็นบวก)" : T("S < S_N", false) + " (พจน์ถัดไปเป็นลบ)") + "</td></tr>" +
        "<tr><td>ต้องบวกอย่างน้อยกี่พจน์ให้ผิดไม่เกิน " + T("10^{-" + st.k + "}", false) + "</td><td><b>" + (need ? need.toLocaleString("en-US") : "> 2,000,000") + "</b> พจน์ (จาก " + T("b_{N+1} \\le 10^{-" + st.k + "}", false) + ")</td></tr>" +
        '</tbody></table><p class="lap-help">จุดผลบวกย่อยกระโดดข้ามเส้น S ไปมา (ส้ม-ฟ้าสลับกัน) ผลบวกจริงจึงอยู่ระหว่างผลบวกย่อยสองตัวติดกันเสมอ แถบสีฟ้าทางขวาคือ ' + T("S_N \\pm b_{N+1}", false) + " ซึ่งต้องครอบเส้นเขียว · ลองเลือก 1/√n ดูว่าต้องใช้พจน์มหาศาลแค่ไหน</p>";
    }
    function drawRe() {
      var R = REARR.filter(function (q) { return q.id === st.rr; })[0] || REARR[1], M = st.M, S = 0, pts = [], used = [], pi = 1, ni = 2;
      $$(".sr-rea .cl-sl", box)[0].hidden = R.id !== "T";
      var take = function (pos) { var v = pos ? 1 / pi : -1 / ni; if (pos) pi += 2; else ni += 2; S += v; if (used.length < 18) used.push(v); return v; };
      if (R.id === "T") {
        for (var k = 0; k < M; k++) { take(S <= st.target); pts.push([k + 1, S]); }
      } else {
        var k2 = 0;
        while (k2 < M) {
          for (var a = 0; a < R.p && k2 < M; a++) { take(true); pts.push([++k2, S]); }
          for (var b = 0; b < R.q && k2 < M; b++) { take(false); pts.push([++k2, S]); }
        }
      }
      var goal = R.id === "T" ? st.target : Math.LN2 + 0.5 * Math.log(R.p / R.q);
      var txt = used.map(function (v, i) { var den = Math.round(1 / Math.abs(v)); return (i === 0 ? (v < 0 ? "-" : "") : v < 0 ? " - " : " + ") + "\\tfrac{1}{" + den + "}"; }).join("") + " + \\cdots";
      MK.tex(eq, txt + (R.id === "T" ? "\\ \\longrightarrow\\ T = " + st.target.toFixed(2) : "\\ \\longrightarrow\\ \\ln 2 + \\tfrac12\\ln\\tfrac{" + R.p + "}{" + R.q + "}"), true);
      var ys = pts.map(function (q) { return q[1]; }), lo = Math.min(Math.min.apply(null, ys), goal, Math.LN2), hi = Math.max(Math.max.apply(null, ys), goal, Math.LN2), pad = (hi - lo) * 0.1 + 0.05;
      plot.innerHTML = plotIn(box, { w: 640, h: 280, xmin: 0, xmax: M, ymin: lo - pad, ymax: hi + pad, series: [{ pts: pts, color: "var(--accent)", width: 1.4 }],
        hlines: [{ y: goal, color: "var(--ok)", label: R.id === "T" ? "T" : "ลิมิต" }, { y: Math.LN2, color: "var(--ink-3)", label: "ln 2 (ลำดับเดิม)" }], xlabel: "จำนวนพจน์", id: MK.uid("srr"), label: "Riemann rearrangement" });
      info.innerHTML = '<table class="lap-pt"><tbody><tr><td>ผลบวกย่อยหลัง ' + M + " พจน์</td><td><b>" + fmt(S, 8) + "</b></td></tr><tr><td>ค่าที่ทฤษฎีบอก</td><td>" + fmt(goal, 8) + "</td></tr>" +
        "<tr><td>ใช้พจน์บวก / ลบ ไป</td><td>" + ((pi - 1) / 2) + " / " + ((ni - 2) / 2) + "</td></tr></tbody></table>" +
        '<p class="lap-help">พจน์ชุดเดียวกันทุกตัว (1, ½, ⅓, … ครบทุกตัว) แต่เปลี่ยนลำดับการบวก ผลบวกก็เปลี่ยน เพราะ ' + T("\\sum 1/n", false) + " ลู่ออก (ลู่เข้าแบบมีเงื่อนไข) — ทฤษฎีบทการจัดเรียงใหม่ของรีมันน์บอกว่าจัดให้ได้<b>ทุกค่า</b> อนุกรมที่ลู่เข้าแบบสัมบูรณ์จะไม่เกิดเรื่องนี้</p>";
    }
    function draw() { pe.hidden = st.mode !== "error"; pr.hidden = st.mode !== "rearrange"; if (st.mode === "error") drawErr(); else drawRe(); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-m]"); if (b) { st.mode = b.getAttribute("data-m"); setOn(box, "m", st.mode); draw(); return; }
      b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); setOn(box, "p", st.pre); draw(); return; }
      b = e.target.closest("[data-r]"); if (b) { st.rr = b.getAttribute("data-r"); setOn(box, "r", st.rr); draw(); }
    });
    bindSliders(box, st, draw, { k: function (v) { return "10^−" + v; }, target: function (v) { return v.toFixed(2); } });
    box._set = function (o) { Object.keys(o).forEach(function (k) { if (k === "preset") st.pre = o.preset; else st[k] = o[k]; }); if (o.target != null) { st.rr = "T"; setSlider(box, "target", o.target, { target: function (v) { return v.toFixed(2); } }); } if (o.n) { st.N = o.n; setSlider(box, "N", o.n); } setOn(box, "m", st.mode); setOn(box, "p", st.pre); setOn(box, "r", st.rr); draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 4. test-choice trainer
  var TESTN = [
    { id: "nth", l: "พจน์ที่ n (nth-term)" }, { id: "geo", l: "เรขาคณิต" }, { id: "p", l: "อนุกรม p" }, { id: "tele", l: "กล้องส่องทางไกล" },
    { id: "int", l: "ปริพันธ์" }, { id: "comp", l: "เปรียบเทียบตรง" }, { id: "lcomp", l: "เปรียบเทียบลิมิต" }, { id: "ratio", l: "อัตราส่วน" },
    { id: "root", l: "ราก" }, { id: "alt", l: "อนุกรมสลับ" }, { id: "adv", l: "สเตอร์ลิง · ราบี · อื่น ๆ" }
  ];
  var VERD = [{ id: "abs", l: "ลู่เข้าแบบสัมบูรณ์" }, { id: "cond", l: "ลู่เข้าแบบมีเงื่อนไข" }, { id: "div", l: "ลู่ออก" }];
  // lv: b basic (entrance exam), i intermediate (Calculus 2), a advanced (engineering mathematics / analysis)
  var QUIZ = [
    { s: "\\sum_{n=0}^{\\infty}\\left(\\tfrac23\\right)^{n}", v: "abs", t: ["geo"], lv: "b", w: "อนุกรมเรขาคณิต \\(r = \\tfrac23\\), \\(|r| < 1\\) ⇒ ลู่เข้า ผลบวก \\(\\dfrac{1}{1 - 2/3} = 3\\) (พจน์บวกทั้งหมด จึงลู่เข้าแบบสัมบูรณ์)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{3^{n}}{2^{n}}", v: "div", t: ["geo", "nth"], lv: "b", w: "เรขาคณิต \\(r = \\tfrac32 \\ge 1\\) ⇒ ลู่ออก หรือดูว่า \\((3/2)^n \\to \\infty \\ne 0\\)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n}{n+1}", v: "div", t: ["nth"], lv: "b", w: "\\(\\lim \\dfrac{n}{n+1} = 1 \\ne 0\\) ⇒ ลู่ออกทันทีด้วย nth-term test" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{1}{n^{3}}", v: "abs", t: ["p"], lv: "b", w: "อนุกรม p ที่ \\(p = 3 > 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{1}{\\sqrt n}", v: "div", t: ["p"], lv: "b", w: "อนุกรม p ที่ \\(p = \\tfrac12 \\le 1\\) ⇒ ลู่ออก" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{1}{n(n+1)}", v: "abs", t: ["tele"], lv: "b", w: "\\(\\dfrac{1}{n(n+1)} = \\dfrac1n - \\dfrac{1}{n+1}\\) ⇒ \\(S_N = 1 - \\dfrac{1}{N+1} \\to 1\\)" },
    { s: "\\sum_{n=0}^{\\infty}(-1)^{n}", v: "div", t: ["nth"], lv: "b", w: "\\((-1)^n\\) ไม่เข้าใกล้ 0 (สลับ ±1) ⇒ ลู่ออก ผลบวกย่อยแกว่ง 1, 0, 1, 0" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{1}{2n+1}", v: "div", t: ["lcomp", "int"], lv: "b", w: "เทียบกับ \\(\\sum 1/n\\): \\(\\lim \\dfrac{1/(2n+1)}{1/n} = \\tfrac12 > 0\\) ฮาร์มอนิกลู่ออก ⇒ ลู่ออก" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{5}{4^{n}}", v: "abs", t: ["geo"], lv: "b", w: "เรขาคณิต \\(a = \\tfrac54,\\ r = \\tfrac14\\) ⇒ \\(S = \\dfrac{5/4}{1 - 1/4} = \\dfrac53\\)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{\\cos(n\\pi)}{n}", v: "cond", t: ["alt"], lv: "b", w: "\\(\\cos n\\pi = (-1)^n\\) จึงเป็นอนุกรมฮาร์มอนิกสลับ: \\(1/n\\) ลดลง → 0 ⇒ ลู่เข้า (Leibniz) แต่ \\(\\sum 1/n\\) ลู่ออก ⇒ มีเงื่อนไข" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n}{2^{n}}", v: "abs", t: ["ratio"], lv: "i", w: "\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac{n+1}{2n} \\to \\tfrac12 < 1\\) ⇒ ลู่เข้า (ผลบวก = 2)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{1}{n^{2}+1}", v: "abs", t: ["comp", "lcomp", "int"], lv: "i", w: "\\(0 < \\dfrac{1}{n^2+1} < \\dfrac{1}{n^2}\\) และ \\(\\sum 1/n^2\\) ลู่เข้า ⇒ ลู่เข้า" },
    { s: "\\sum_{n=2}^{\\infty}\\frac{3n+5}{n^{3}-2}", v: "abs", t: ["lcomp"], lv: "i", w: "พจน์ประพฤติเหมือน \\(3n/n^3 = 3/n^2\\): \\(\\lim \\dfrac{(3n+5)/(n^3-2)}{1/n^2} = 3\\) ⇒ ลู่เข้าเหมือน \\(\\sum 1/n^2\\)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n!}{n^{n}}", v: "abs", t: ["ratio"], lv: "i", w: "\\(\\dfrac{a_{n+1}}{a_n} = \\left(\\dfrac{n}{n+1}\\right)^n \\to \\dfrac1e < 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=0}^{\\infty}\\frac{2^{n}}{n!}", v: "abs", t: ["ratio"], lv: "i", w: "\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac{2}{n+1} \\to 0\\) ⇒ ลู่เข้า (ผลบวก \\(e^2\\))" },
    { s: "\\sum_{n=1}^{\\infty}\\left(\\frac{n}{2n+1}\\right)^{n}", v: "abs", t: ["root"], lv: "i", w: "\\(\\sqrt[n]{a_n} = \\dfrac{n}{2n+1} \\to \\tfrac12 < 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=2}^{\\infty}\\frac{1}{n\\ln n}", v: "div", t: ["int"], lv: "i", w: "\\(\\int_2^\\infty \\dfrac{dx}{x\\ln x} = [\\ln\\ln x]_2^\\infty = \\infty\\) ⇒ ลู่ออก (ช้ามาก)" },
    { s: "\\sum_{n=2}^{\\infty}\\frac{1}{n(\\ln n)^{2}}", v: "abs", t: ["int"], lv: "i", w: "\\(\\int_2^\\infty \\dfrac{dx}{x(\\ln x)^2} = \\dfrac{1}{\\ln 2}\\) จำกัด ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n+1}}{\\sqrt n}", v: "cond", t: ["alt"], lv: "i", w: "\\(1/\\sqrt n\\) ลดลง → 0 ⇒ ลู่เข้า แต่ \\(\\sum 1/\\sqrt n\\) (p = ½) ลู่ออก ⇒ มีเงื่อนไข" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n}\\,n}{n+1}", v: "div", t: ["nth"], lv: "i", w: "\\(|a_n| = \\dfrac{n}{n+1} \\to 1\\) พจน์ไม่เข้าใกล้ 0 ⇒ ลู่ออก (การทดสอบอนุกรมสลับใช้ไม่ได้เพราะ \\(b_n \\not\\to 0\\))" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{\\sin n}{n^{2}}", v: "abs", t: ["comp"], lv: "i", w: "\\(\\left|\\dfrac{\\sin n}{n^2}\\right| \\le \\dfrac{1}{n^2}\\) ⇒ \\(\\sum |a_n|\\) ลู่เข้า ⇒ ลู่เข้าแบบสัมบูรณ์" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{\\ln n}{n}", v: "div", t: ["comp", "int"], lv: "i", w: "เมื่อ \\(n \\ge 3\\): \\(\\dfrac{\\ln n}{n} > \\dfrac1n\\) และ \\(\\sum 1/n\\) ลู่ออก ⇒ ลู่ออก" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{\\ln n}{n^{2}}", v: "abs", t: ["lcomp", "int", "comp"], lv: "i", w: "\\(\\ln n < \\sqrt n\\) ⇒ \\(\\dfrac{\\ln n}{n^2} < \\dfrac{1}{n^{3/2}}\\) อนุกรม p = 3/2 ลู่เข้า ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n^{2}}{3^{n}}", v: "abs", t: ["ratio"], lv: "i", w: "\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac{(n+1)^2}{3n^2} \\to \\tfrac13 < 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=2}^{\\infty}\\frac{(-1)^{n}}{n\\ln n}", v: "cond", t: ["alt", "int"], lv: "i", w: "\\(1/(n\\ln n)\\) ลดลง → 0 ⇒ ลู่เข้า แต่ \\(\\sum \\dfrac{1}{n\\ln n}\\) ลู่ออก (ปริพันธ์) ⇒ มีเงื่อนไข" },
    { s: "\\sum_{n=1}^{\\infty}\\left(1+\\frac1n\\right)^{n}", v: "div", t: ["nth"], lv: "i", w: "\\(\\left(1 + \\tfrac1n\\right)^n \\to e \\ne 0\\) ⇒ ลู่ออก (กับดัก: ไม่ใช่การทดสอบราก)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n^{2}+1}{n^{4}+n}", v: "abs", t: ["lcomp"], lv: "i", w: "\\(\\sim \\dfrac{n^2}{n^4} = \\dfrac{1}{n^2}\\): \\(\\lim \\dfrac{a_n}{1/n^2} = 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\left(\\sqrt{n+1}-\\sqrt n\\right)", v: "div", t: ["tele"], lv: "i", w: "กล้องส่องทางไกล: \\(S_N = \\sqrt{N+1} - 1 \\to \\infty\\) ⇒ ลู่ออก ทั้งที่พจน์ \\(\\to 0\\)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{3^{n}}{n\\,4^{n}}", v: "abs", t: ["ratio", "comp"], lv: "i", w: "\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac34\\cdot\\dfrac{n}{n+1} \\to \\tfrac34 < 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\left(1-\\frac1n\\right)^{n^{2}}", v: "abs", t: ["root"], lv: "a", w: "\\(\\sqrt[n]{a_n} = \\left(1 - \\tfrac1n\\right)^n \\to \\dfrac1e < 1\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n^{100}}{1.01^{n}}", v: "abs", t: ["ratio", "root"], lv: "a", w: "\\(\\dfrac{a_{n+1}}{a_n} = \\left(\\dfrac{n+1}{n}\\right)^{100}\\dfrac{1}{1.01} \\to \\dfrac{1}{1.01} < 1\\) ⇒ ลู่เข้า (เลขชี้กำลังชนะพหุนามเสมอ แม้ช่วงแรกพจน์จะโตมหาศาล)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{1}{n^{1+1/n}}", v: "div", t: ["lcomp"], lv: "a", w: "\\(\\dfrac{1/n^{1+1/n}}{1/n} = \\dfrac{1}{n^{1/n}} \\to 1\\) ⇒ ประพฤติเหมือนฮาร์มอนิก ⇒ ลู่ออก (กับดัก: เลขชี้กำลัง > 1 ทุกพจน์ แต่ไม่ได้ > 1 อย่างสม่ำเสมอ)" },
    { s: "\\sum_{n=1}^{\\infty}\\sin\\frac1n", v: "div", t: ["lcomp"], lv: "a", w: "\\(\\lim \\dfrac{\\sin(1/n)}{1/n} = 1\\) ⇒ เหมือน \\(\\sum 1/n\\) ⇒ ลู่ออก" },
    { s: "\\sum_{n=1}^{\\infty}\\left(1-\\cos\\frac1n\\right)", v: "abs", t: ["lcomp"], lv: "a", w: "\\(1 - \\cos u \\approx \\dfrac{u^2}{2}\\) ⇒ \\(\\lim \\dfrac{1-\\cos(1/n)}{1/n^2} = \\tfrac12\\) ⇒ ลู่เข้าเหมือน \\(\\sum 1/n^2\\)" },
    { s: "\\sum_{n=1}^{\\infty}(-1)^{n}\\sin\\frac1n", v: "cond", t: ["alt", "lcomp"], lv: "a", w: "\\(\\sin(1/n)\\) ลดลง → 0 ⇒ ลู่เข้า แต่ \\(\\sum \\sin(1/n)\\) ลู่ออก (เปรียบเทียบลิมิตกับ 1/n) ⇒ มีเงื่อนไข" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{(2n)!}{(n!)^{2}\\,4^{n}}", v: "div", t: ["adv"], lv: "a", w: "อัตราส่วน \\(\\dfrac{(2n+1)(2n+2)}{4(n+1)^2} = \\dfrac{2n+1}{2n+2} \\to 1\\) สรุปไม่ได้ · สเตอร์ลิงให้ \\(a_n \\sim \\dfrac{1}{\\sqrt{\\pi n}}\\) (หรือราบี: \\(n(1 - a_{n+1}/a_n) \\to \\tfrac12 < 1\\)) ⇒ ลู่ออก" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{n!\\,e^{n}}{n^{n}}", v: "div", t: ["adv", "nth"], lv: "a", w: "อัตราส่วน \\(e\\left(\\tfrac{n}{n+1}\\right)^n \\to 1\\) สรุปไม่ได้ · สเตอร์ลิง \\(n! \\approx \\sqrt{2\\pi n}\\,(n/e)^n\\) ⇒ \\(a_n \\approx \\sqrt{2\\pi n} \\to \\infty\\) ⇒ ลู่ออก (nth-term)" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{\\sqrt{n+1}-\\sqrt n}{n}", v: "abs", t: ["lcomp"], lv: "a", w: "คูณคอนจูเกต: \\(a_n = \\dfrac{1}{n(\\sqrt{n+1} + \\sqrt n)} \\sim \\dfrac{1}{2n^{3/2}}\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=3}^{\\infty}\\frac{1}{(\\ln n)^{\\ln n}}", v: "abs", t: ["comp", "adv"], lv: "a", w: "\\((\\ln n)^{\\ln n} = e^{\\ln n\\,\\ln\\ln n} = n^{\\ln\\ln n}\\) เมื่อ \\(n > e^{e^2} \\approx 1619\\) ได้ \\(\\ln\\ln n > 2\\) ⇒ \\(a_n < 1/n^2\\) ⇒ ลู่เข้า" },
    { s: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n}}{n^{1/3}}\\cdot\\frac{n+1}{n}", v: "cond", t: ["alt"], lv: "a", w: "\\(b_n = \\dfrac{n+1}{n^{4/3}}\\) ลดลง → 0 (ตรวจ \\(f'(x) < 0\\)) ⇒ ลู่เข้า แต่ \\(b_n \\sim n^{-1/3}\\) ทำให้ \\(\\sum b_n\\) ลู่ออก ⇒ มีเงื่อนไข" }
  ];
  function initQuiz(box) {
    var st = { lv: box.dataset.level || "all", i: -1, test: null, verd: null, score: 0, done: 0, order: [] };
    box.innerHTML = chipRow([{ id: "all", l: "ทุกระดับ" }, { id: "b", l: "พื้นฐาน · เตรียมสอบเข้า" }, { id: "i", l: "กลาง · แคลคูลัส 2" }, { id: "a", l: "ขั้นสูง" }], "lv", st.lv) +
      '<div class="sr-qs"></div><p class="sr-qh">① การทดสอบที่เหมาะที่สุด</p>' + chipRow(TESTN, "t", null, "sr-qt") +
      '<p class="sr-qh">② ผลสรุป</p>' + chipRow(VERD, "vd", null, "sr-qv") +
      '<div class="lap-row"><button type="button" class="btn btn-primary btn-sm" data-go="check">ตรวจคำตอบ</button><button type="button" class="btn btn-ghost btn-sm" data-go="next">ข้อต่อไป →</button><span class="mono sr-score"></span></div><div class="sr-qf"></div>';
    var qs = box.querySelector(".sr-qs"), qf = box.querySelector(".sr-qf"), sc = box.querySelector(".sr-score");
    function pool() { return QUIZ.map(function (q, i) { return i; }).filter(function (i) { return st.lv === "all" || QUIZ[i].lv === st.lv; }); }
    function next() {
      if (!st.order.length) { st.order = pool(); for (var k = st.order.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = st.order[k]; st.order[k] = st.order[j]; st.order[j] = t; } }
      st.i = st.order.pop(); st.test = st.verd = null; setOn(box, "t", ""); setOn(box, "vd", "");
      var q = QUIZ[st.i];
      qs.innerHTML = '<span class="lv lv-' + q.lv + '">' + { b: "พื้นฐาน", i: "กลาง", a: "ขั้นสูง" }[q.lv] + "</span>" + T(q.s, true);
      qf.innerHTML = "";
      $$("[data-t],[data-vd]", box).forEach(function (b) { b.classList.remove("good", "bad"); });
    }
    function check() {
      var q = QUIZ[st.i]; if (!q) return;
      if (!st.test || !st.verd) { qf.innerHTML = '<p class="lap-err">เลือกทั้งการทดสอบและผลสรุปก่อน</p>'; return; }
      var okT = q.t.indexOf(st.test) >= 0, okV = q.v === st.verd;
      $$("[data-t]", box).forEach(function (b) { var id = b.getAttribute("data-t"); b.classList.toggle("good", q.t.indexOf(id) >= 0); b.classList.toggle("bad", id === st.test && !okT); });
      $$("[data-vd]", box).forEach(function (b) { var id = b.getAttribute("data-vd"); b.classList.toggle("good", id === q.v); b.classList.toggle("bad", id === st.verd && !okV); });
      st.done++; if (okT && okV) st.score++;
      sc.textContent = "ถูก " + st.score + " / " + st.done;
      qf.innerHTML = '<div class="fl-why ' + (okV ? "ok" : "no") + '">' + flag(okV, okV ? "ผลสรุปถูก" : "ผลสรุปยังไม่ถูก") + flag(okT, okT ? "เลือกการทดสอบได้ดี" : "มีการทดสอบที่เหมาะกว่า") +
        "<p>" + rich(q.w) + "</p></div>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lv]"); if (b) { st.lv = b.getAttribute("data-lv"); setOn(box, "lv", st.lv); st.order = []; next(); return; }
      b = e.target.closest("[data-t]"); if (b) { st.test = b.getAttribute("data-t"); setOn(box, "t", st.test); return; }
      b = e.target.closest("[data-vd]"); if (b) { st.verd = b.getAttribute("data-vd"); setOn(box, "vd", st.verd); return; }
      b = e.target.closest("[data-go]"); if (b) { if (b.getAttribute("data-go") === "check") check(); else next(); }
    });
    box._set = function (o) { if (o.level) { st.lv = o.level; setOn(box, "lv", st.lv); st.order = []; } next(); };
    next();
  }

  // ======================================================================= 5. power series explorer
  // c(k): coefficient of (x − a)^k ; ends: status at x = a − R and a + R ("abs" | "cond" | "div")
  var POWS = [
    { id: "geo", l: "Σ xⁿ", a: 0, R: 1, c: function () { return 1; }, f: function (x) { return 1 / (1 - x); }, ft: "\\frac{1}{1-x}", tex: "\\sum_{n=0}^{\\infty} x^{n}", sing: [[1, 0]], ends: ["div", "div"],
      why: "\\left|\\frac{c_{n+1}}{c_n}\\right| = 1 \\Rightarrow R = 1", endw: ["x = -1:\\ \\sum(-1)^n\\ \\text{ลู่ออก}", "x = 1:\\ \\sum 1\\ \\text{ลู่ออก}"] },
    { id: "log1", l: "Σ xⁿ/n", a: 0, R: 1, c: function (k) { return k ? 1 / k : 0; }, f: function (x) { return -Math.log(1 - x); }, ft: "-\\ln(1-x)", tex: "\\sum_{n=1}^{\\infty}\\frac{x^{n}}{n}", sing: [[1, 0]], ends: ["cond", "div"],
      why: "\\left|\\frac{c_{n+1}}{c_n}\\right| = \\frac{n}{n+1} \\to 1 \\Rightarrow R = 1", endw: ["x = -1:\\ \\sum\\frac{(-1)^n}{n}\\ \\text{ลู่เข้า (มีเงื่อนไข)}", "x = 1:\\ \\sum\\frac1n\\ \\text{ลู่ออก}"] },
    { id: "ln1p", l: "ln(1 + x)", a: 0, R: 1, c: function (k) { return k ? (k % 2 ? 1 : -1) / k : 0; }, f: function (x) { return Math.log(1 + x); }, ft: "\\ln(1+x)", tex: "\\sum_{n=1}^{\\infty}\\frac{(-1)^{n+1}x^{n}}{n}", sing: [[-1, 0]], ends: ["div", "cond"],
      why: "\\frac{n}{n+1} \\to 1 \\Rightarrow R = 1", endw: ["x = -1:\\ -\\sum\\frac1n\\ \\text{ลู่ออก}", "x = 1:\\ \\sum\\frac{(-1)^{n+1}}{n} = \\ln 2"] },
    { id: "inv1x2", l: "1/(1 + x²)", a: 0, R: 1, c: function (k) { return k % 2 ? 0 : (k / 2) % 2 ? -1 : 1; }, f: function (x) { return 1 / (1 + x * x); }, ft: "\\frac{1}{1+x^2}", tex: "\\sum_{n=0}^{\\infty}(-1)^{n}x^{2n}", sing: [[0, 1], [0, -1]], ends: ["div", "div"],
      why: "\\text{เรขาคณิตใน } u = -x^2:\\ |x^2| < 1 \\Rightarrow R = 1", endw: ["x = \\pm1:\\ \\sum(-1)^n\\ \\text{ลู่ออก}", ""], note: "บนแกนจริงฟังก์ชันนี้เรียบทุกจุด แต่ R = 1 เพราะโพลเชิงซ้อนที่ z = ±i อยู่ห่างจากจุดศูนย์กลาง 1 หน่วย" },
    { id: "atan", l: "arctan x", a: 0, R: 1, c: function (k) { return k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) / k : 0; }, f: Math.atan, ft: "\\arctan x", tex: "\\sum_{n=0}^{\\infty}\\frac{(-1)^{n}x^{2n+1}}{2n+1}", sing: [[0, 1], [0, -1]], ends: ["cond", "cond"],
      why: "\\left|\\frac{x^{2n+3}/(2n+3)}{x^{2n+1}/(2n+1)}\\right| \\to x^2 < 1 \\Rightarrow R = 1", endw: ["x = \\pm1:\\ \\pm\\left(1 - \\tfrac13 + \\tfrac15 - \\cdots\\right) = \\pm\\tfrac{\\pi}{4}", ""] },
    { id: "exp", l: "eˣ", a: 0, R: Infinity, c: function (k) { return 1 / fact(k); }, f: Math.exp, ft: "e^{x}", tex: "\\sum_{n=0}^{\\infty}\\frac{x^{n}}{n!}", sing: [], ends: [],
      why: "\\left|\\frac{c_{n+1}}{c_n}\\right| = \\frac{1}{n+1} \\to 0 \\Rightarrow R = \\infty", endw: ["\\text{ลู่เข้าทุก } x \\in \\mathbb R", ""] },
    { id: "cos", l: "cos x", a: 0, R: Infinity, c: function (k) { return k % 2 ? 0 : ((k / 2) % 2 ? -1 : 1) / fact(k); }, f: Math.cos, ft: "\\cos x", tex: "\\sum_{n=0}^{\\infty}\\frac{(-1)^{n}x^{2n}}{(2n)!}", sing: [], ends: [],
      why: "\\frac{x^2}{(2n+1)(2n+2)} \\to 0 \\Rightarrow R = \\infty", endw: ["\\text{ลู่เข้าทุก } x", ""] },
    { id: "fact", l: "Σ n! xⁿ (R = 0)", a: 0, R: 0, c: function (k) { return fact(k); }, f: null, tex: "\\sum_{n=0}^{\\infty} n!\\,x^{n}", sing: [], ends: [],
      why: "\\left|\\frac{c_{n+1}}{c_n}\\right| = n+1 \\to \\infty \\Rightarrow R = 0", endw: ["\\text{ลู่เข้าเฉพาะ } x = 0", ""] },
    { id: "shift", l: "Σ (x−2)ⁿ/(n·3ⁿ)", a: 2, R: 3, c: function (k) { return k ? 1 / (k * Math.pow(3, k)) : 0; }, f: function (x) { return -Math.log(1 - (x - 2) / 3); }, ft: "-\\ln\\!\\left(1 - \\tfrac{x-2}{3}\\right)", tex: "\\sum_{n=1}^{\\infty}\\frac{(x-2)^{n}}{n\\,3^{n}}", sing: [[5, 0]], ends: ["cond", "div"],
      why: "\\left|\\frac{c_{n+1}}{c_n}\\right| = \\frac{n}{3(n+1)} \\to \\tfrac13 \\Rightarrow R = 3", endw: ["x = -1:\\ \\sum\\frac{(-1)^n}{n}\\ \\text{ลู่เข้า}", "x = 5:\\ \\sum\\frac1n\\ \\text{ลู่ออก}"] },
    { id: "li2", l: "Σ xⁿ/n²", a: 0, R: 1, c: function (k) { return k ? 1 / (k * k) : 0; }, f: null, tex: "\\sum_{n=1}^{\\infty}\\frac{x^{n}}{n^{2}}", sing: [[1, 0]], ends: ["abs", "abs"],
      why: "\\frac{n^2}{(n+1)^2} \\to 1 \\Rightarrow R = 1", endw: ["x = \\pm1:\\ \\sum\\frac{(\\pm1)^n}{n^2}\\ \\text{ลู่เข้าแบบสัมบูรณ์}", ""] },
    { id: "shift2", l: "2/(x + 1) รอบ a = 1", a: 1, R: 2, c: function (k) { return (k % 2 ? -1 : 1) / Math.pow(2, k); }, f: function (x) { return 2 / (x + 1); }, ft: "\\frac{2}{x+1}", tex: "\\sum_{n=0}^{\\infty}\\frac{(-1)^{n}(x-1)^{n}}{2^{n}}", sing: [[-1, 0]], ends: ["div", "div"],
      why: "\\frac{1}{1 + (x-1)/2}:\\ \\left|\\tfrac{x-1}{2}\\right| < 1 \\Rightarrow R = 2", endw: ["x = -1, 3:\\ \\text{พจน์ไม่เข้าใกล้ 0}", ""] },
    { id: "geo2", l: "1/(1 − x)²", a: 0, R: 1, c: function (k) { return k + 1; }, f: function (x) { return 1 / ((1 - x) * (1 - x)); }, ft: "\\frac{1}{(1-x)^2}", tex: "\\sum_{n=0}^{\\infty}(n+1)x^{n}", sing: [[1, 0]], ends: ["div", "div"],
      why: "\\text{หาอนุพันธ์ของ } \\sum x^n \\text{ ทีละพจน์ — } R \\text{ ไม่เปลี่ยน} = 1", endw: ["x = \\pm1:\\ \\text{พจน์ไม่เข้าใกล้ 0}", ""] },
    { id: "sqrt", l: "√(1 + x) (ทวินาม)", a: 0, R: 1, c: function (k) { return binom(0.5, k); }, f: function (x) { return Math.sqrt(1 + x); }, ft: "\\sqrt{1+x}", tex: "\\sum_{n=0}^{\\infty}\\binom{1/2}{n}x^{n}", sing: [[-1, 0]], ends: ["abs", "abs"],
      why: "\\left|\\frac{\\binom{1/2}{n+1}}{\\binom{1/2}{n}}\\right| = \\frac{|n - 1/2|}{n+1} \\to 1 \\Rightarrow R = 1", endw: ["x = \\pm1:\\ |c_n| \\sim \\frac{1}{2\\sqrt\\pi\\,n^{3/2}}\\ \\text{ลู่เข้าแบบสัมบูรณ์}", ""], note: "จุด z = −1 เป็นจุดแตกกิ่ง (branch point) ของรากที่สอง จึงกำหนดรัศมี" },
    { id: "custom", l: "✎ พิมพ์ cₙ เอง", a: 0, custom: true }
  ];
  function initPower(box) {
    var d = box.dataset;
    var st = { pre: d.preset || "geo", N: +(d.n || 8), c: d.c || "1/(n*2^n)", a: d.a != null ? +d.a : 0 };
    box.innerHTML = chipRow(POWS, "p", st.pre, "sr-pre") +
      '<div class="lap-row sr-cus"><label class="lap-lbl">cₙ =</label><input class="lap-in" data-in="c" spellcheck="false" aria-label="coefficient c_n"><label class="lap-lbl">รอบ a =</label><input class="lap-in sm" data-in="a" aria-label="center a"></div>' +
      slider("N", "ดีกรีของผลบวกย่อย N", 0, 40, 1, st.N) +
      '<div class="lap-eq sr-eq"></div><div class="sr-two"><div class="sr-plot"></div><div class="sr-cp"></div></div><div class="sr-info"></div>';
    var eq = box.querySelector(".sr-eq"), plot = box.querySelector(".sr-plot"), cp = box.querySelector(".sr-cp"), info = box.querySelector(".sr-info"), cus = box.querySelector(".sr-cus");
    function draw() {
      var P = POWS.filter(function (q) { return q.id === st.pre; })[0] || POWS[0], a, R, c, f = null, sing = [], ends = [];
      cus.hidden = !P.custom;
      if (P.custom) {
        try { var cc = SQ.compile(st.c, ["n"], { n: "n" }); c = function (k) { var v = cc.fn({ n: k }); return isFinite(v) ? v : 0; }; }
        catch (e) { info.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; return; }
        a = st.a;
        var est = [];
        [200, 400].forEach(function (m) { var c1 = c(m), c2 = c(m + 1); if (c1 && c2) est.push(Math.abs(c1 / c2)); });
        var root = Math.pow(Math.abs(c(300)), -1 / 300);
        R = est.length ? est[est.length - 1] : root;
        if (!isFinite(R) || R > 1e6) R = Infinity; else if (R < 1e-6) R = 0;
        MK.tex(eq, "\\sum_{n=0}^{\\infty}" + "\\left(" + cc.tex + "\\right)(x" + (a ? (a > 0 ? "-" : "+") + Math.abs(a) : "") + ")^{n},\\quad R \\approx " + (R === Infinity ? "\\infty" : MK.sig(R, 4)), true);
      } else {
        a = P.a; R = P.R; c = P.c; f = P.f; sing = P.sing; ends = P.ends;
        texLines(eq, [(P.ft ? P.ft + " = " : "") + P.tex, P.why]);
      }
      var w = R === Infinity ? 6 : R === 0 ? 1 : Math.max(1.6 * R, 1.2), x0 = a - w, x1 = a + w, N = st.N;
      var SN = function (x) { var s = 0, h = x - a, p = 1; for (var k = 0; k <= N; k++) { s += c(k) * p; p *= h; } return s; };
      var series = [];
      if (f) series.push({ pts: MK.sample(f, x0, x1, 500), color: "var(--ink)", width: 2.4 });
      series.push({ pts: MK.sample(SN, x0, x1, 500), color: "var(--accent)", width: 2.2 });
      if (R === 0) { x0 = a - 0.4; x1 = a + 0.4; }
      var yv = f ? MK.sample(f, isFinite(R) ? Math.max(x0, a - 0.95 * R) : x0, isFinite(R) ? Math.min(x1, a + 0.95 * R) : x1, 200).map(function (q) { return q[1]; }).filter(isFinite)
        : MK.sample(SN, isFinite(R) && R > 0 ? a - 0.9 * R : x0, isFinite(R) && R > 0 ? a + 0.9 * R : x1, 200).map(function (q) { return q[1]; }).filter(isFinite);
      var lo = Math.min.apply(null, yv), hi = Math.max.apply(null, yv), span = Math.max(hi - lo, 1);
      var marks = [];
      if (isFinite(R) && R > 0 && ends.length) {
        [[a - R, ends[0]], [a + R, ends[1]]].forEach(function (e) { marks.push({ x: e[0], y: lo - span * 0.25, r: 6, open: e[1] === "div", color: e[1] === "div" ? "#c43c3c" : "var(--ok)" }); });
      }
      plot.innerHTML = plotIn(box, { w: 520, h: 300, xmin: x0, xmax: x1, ymin: lo - span * 0.45, ymax: hi + span * 0.35, series: series,
        bands: isFinite(R) && R > 0 ? [{ x0: a - R, x1: a + R, color: "var(--ok)", op: 0.1 }] : [], marks: marks, vlines: [{ x: a, color: "var(--ink-3)", label: "a" }],
        xlabel: "x", id: MK.uid("srp"), label: "power series partial sums and interval of convergence" });
      // complex plane: disc of convergence and singularities
      var Rv = !isFinite(R) ? null : R, ext = Math.max(Rv ? Rv * 1.6 : 3, 1.5);
      sing.forEach(function (z) { ext = Math.max(ext, Math.abs(z[0] - a) * 1.3, Math.abs(z[1]) * 1.3); });
      var W = 300, H = 270, sc = (H / 2 - 18) / ext, cx = W / 2, cy = H / 2;
      var X = function (re) { return cx + (re - a) * sc; }, Y = function (im) { return cy - im * sc; };
      var g = '<svg class="lap-sp sr-cplane" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="disc of convergence in the complex plane">';
      g += '<line class="lap-ax" x1="0" y1="' + cy + '" x2="' + W + '" y2="' + cy + '"/><line class="lap-ax" x1="' + X(0) + '" y1="0" x2="' + X(0) + '" y2="' + H + '"/>';
      if (Rv === null) g += '<rect x="0" y="0" width="' + W + '" height="' + H + '" class="lap-roc"/><text class="lap-ptl" x="8" y="18">ลู่เข้าทั้งระนาบ (R = ∞)</text>';
      else if (Rv > 0) g += '<circle class="lap-roc" cx="' + cx + '" cy="' + cy + '" r="' + (Rv * sc).toFixed(1) + '"/><circle class="lap-rocb" fill="none" cx="' + cx + '" cy="' + cy + '" r="' + (Rv * sc).toFixed(1) + '"/>' +
        '<line class="lap-vec b dash" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Rv * sc * Math.cos(-0.7)).toFixed(1) + '" y2="' + (cy + Rv * sc * Math.sin(-0.7)).toFixed(1) + '"/><text class="lap-ptl" x="' + (cx + Rv * sc * 0.5 * Math.cos(-0.7) + 6).toFixed(1) + '" y="' + (cy + Rv * sc * 0.5 * Math.sin(-0.7) - 4).toFixed(1) + '">R</text>';
      sing.forEach(function (z) { var px = X(z[0]), py = Y(z[1]); g += '<g class="lap-pole"><path d="M' + (px - 6) + " " + (py - 6) + "L" + (px + 6) + " " + (py + 6) + "M" + (px + 6) + " " + (py - 6) + "L" + (px - 6) + " " + (py + 6) + '"/></g><text class="lap-ptl" x="' + (px + 8) + '" y="' + (py - 8) + '">' + (z[1] ? (z[0] ? z[0] + (z[1] > 0 ? "+" : "−") : z[1] > 0 ? "" : "−") + "i" : z[0]) + "</text>"; });
      g += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--ink)"/><text class="lap-tk" x="' + (cx + 6) + '" y="' + (cy + 14) + '">a = ' + a + '</text><text class="lap-axl" x="' + (W - 22) + '" y="' + (cy - 6) + '">Re</text><text class="lap-axl" x="' + (X(0) + 6) + '" y="14">Im</text></svg>';
      cp.innerHTML = g;
      var xs = isFinite(R) && R > 0 ? [a + 0.5 * R, a + 0.9 * R, a + 1.1 * R] : R === 0 ? [a + 0.1] : [a + 2, a + 5];
      var rows = xs.map(function (x) {
        var v = SN(x), tv = f ? f(x) : NaN, inside = !isFinite(R) || Math.abs(x - a) < R;
        return "<tr><td>x = " + fmt(x, 4) + (inside ? " (ใน)" : " (นอก)") + "</td><td>" + T("S_{" + N + "}", false) + " = " + fmt(v, 8) + "</td><td>" + (f ? "f = " + fmt(tv, 8) : "") + "</td></tr>";
      }).join("");
      var endText = P.custom ? "ปลายช่วงต้องตรวจเองด้วยการทดสอบในบทเรียน (ค่า R เป็นค่าประมาณจากอัตราส่วนของสัมประสิทธิ์)"
        : P.endw.filter(Boolean).map(function (s) { return T(s, false); }).join(" · ");
      var interval = !isFinite(R) ? "(−∞, ∞)" : R === 0 ? "{" + a + "}" : (ends[0] === "div" ? "(" : "[") + fmt(a - R, 4) + ", " + fmt(a + R, 4) + (ends[1] === "div" ? ")" : "]");
      info.innerHTML = '<p class="lap-note"><span class="lap-key" style="border-top-color:var(--ink)"></span> f(x) · <span class="lap-key k2"></span> ผลบวกย่อย S<sub>' + N + "</sub>(x) · แถบเขียว = |x − a| &lt; R · วงกลมเขียวทึบ/แดงโปร่ง = ปลายช่วงลู่เข้า/ลู่ออก</p>" +
        '<table class="lap-pt"><tbody><tr><td>รัศมี R</td><td colspan="2"><b>' + (R === Infinity ? "∞" : fmt(R, 5)) + "</b></td></tr><tr><td>ช่วงการลู่เข้า</td><td colspan=\"2\"><b>" + (P.custom ? "≈ " : "") + interval + "</b></td></tr>" + rows + "</tbody></table>" +
        '<p class="lap-help">' + endText + (P.note ? " · " + P.note : "") + " · ลองเลื่อน N: ในแถบเขียวเส้นส้มเกาะเส้นดำแน่นขึ้น นอกแถบเส้นส้มแกว่งหนีออกไป</p>";
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b) return; st.pre = b.getAttribute("data-p"); setOn(box, "p", st.pre); draw(); });
    $$(".lap-in", box).forEach(function (inp) {
      var go = function () { if (inp.getAttribute("data-in") === "c") st.c = inp.value; else { try { st.a = numIn(inp.value); } catch (e2) { return; } } draw(); };
      inp.addEventListener("change", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    box.querySelector('[data-in="c"]').value = st.c; box.querySelector('[data-in="a"]').value = st.a;
    bindSliders(box, st, draw);
    box._set = function (o) { if (o.preset) st.pre = o.preset; if (o.n != null) { st.N = o.n; setSlider(box, "N", o.n); } if (o.c) { st.c = o.c; st.pre = "custom"; box.querySelector('[data-in="c"]').value = o.c; } if (o.a != null) { st.a = o.a; box.querySelector('[data-in="a"]').value = o.a; } setOn(box, "p", st.pre); draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 6. how many terms?
  var NEEDS = [
    { id: "exp", l: "eˣ", f: Math.exp, ft: "e^{x}", term: function (k, x) { return Math.pow(x, k) / fact(k); }, deg: function (k) { return k; },
      bound: function (n, x) { return Math.exp(Math.max(0, x)) * Math.pow(Math.abs(x), n + 1) / fact(n + 1); }, bt: "e^{\\max(0,x)}\\dfrac{|x|^{n+1}}{(n+1)!}" },
    { id: "sin", l: "sin x", f: Math.sin, ft: "\\sin x", term: function (k, x) { return (k % 2 ? -1 : 1) * Math.pow(x, 2 * k + 1) / fact(2 * k + 1); }, deg: function (k) { return 2 * k + 1; },
      bound: function (n, x) { return Math.pow(Math.abs(x), n + 2) / fact(n + 2); }, bt: "\\dfrac{|x|^{n+2}}{(n+2)!}" },
    { id: "cos", l: "cos x", f: Math.cos, ft: "\\cos x", term: function (k, x) { return (k % 2 ? -1 : 1) * Math.pow(x, 2 * k) / fact(2 * k); }, deg: function (k) { return 2 * k; },
      bound: function (n, x) { return Math.pow(Math.abs(x), n + 2) / fact(n + 2); }, bt: "\\dfrac{|x|^{n+2}}{(n+2)!}" },
    { id: "ln1p", l: "ln(1 + x)", f: function (x) { return Math.log(1 + x); }, ft: "\\ln(1+x)", term: function (k, x) { return (k % 2 ? -1 : 1) * Math.pow(x, k + 1) / (k + 1); }, deg: function (k) { return k + 1; },
      bound: function (n, x) { return x >= 0 ? Math.pow(x, n + 1) / (n + 1) : Math.pow(-x, n + 1) / ((n + 1) * (1 + x)); }, bt: "\\dfrac{x^{n+1}}{n+1}\\ (0 \\le x \\le 1)", dom: [-0.99, 1] },
    { id: "atan", l: "arctan x", f: Math.atan, ft: "\\arctan x", term: function (k, x) { return (k % 2 ? -1 : 1) * Math.pow(x, 2 * k + 1) / (2 * k + 1); }, deg: function (k) { return 2 * k + 1; },
      bound: function (n, x) { return Math.pow(Math.abs(x), n + 2) / (n + 2); }, bt: "\\dfrac{|x|^{n+2}}{n+2}\\ (|x| \\le 1)", dom: [-1, 1] }
  ];
  function initNeed(box) {
    var d = box.dataset;
    var st = { f: d.f || "exp", x: d.x || "1", k: +(d.tol || 6) };
    box.innerHTML = chipRow(NEEDS, "f", st.f, "sr-pre") +
      '<div class="lap-row"><label class="lap-lbl">ที่ x =</label><input class="lap-in sm" data-in="x" aria-label="x value"><span class="lap-help">พิมพ์ได้ เช่น 0.5, pi/6, 1/3</span></div>' +
      slider("k", "ต้องการความแม่น ±0.5 × 10^−k (ทศนิยม k ตำแหน่ง)", 1, 12, 1, st.k) +
      '<div class="lap-eq sr-eq"></div><div class="sr-info"></div><div class="sr-plot"></div>';
    var eq = box.querySelector(".sr-eq"), plot = box.querySelector(".sr-plot"), info = box.querySelector(".sr-info");
    function draw() {
      var F = NEEDS.filter(function (q) { return q.id === st.f; })[0] || NEEDS[0], x;
      try { x = numIn(st.x); } catch (e) { info.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; return; }
      if (F.dom && (x < F.dom[0] || x > F.dom[1])) { info.innerHTML = '<p class="lap-err">⚠ อนุกรมของ ' + F.l + " ลู่เข้าเฉพาะ " + F.dom[0] + " ≤ x ≤ " + F.dom[1] + " (นอกช่วงเพิ่มพจน์เท่าไรก็ไม่ลู่เข้า)</p>"; plot.innerHTML = ""; eq.innerHTML = ""; return; }
      var tol = 0.5 * Math.pow(10, -st.k), fx = F.f(x), S = 0, rows = [], nB = null, nA = null, pts = [], ptsB = [];
      for (var k = 0; k < 400; k++) {
        S += F.term(k, x);
        var n = F.deg(k), B = F.bound(n, x), E = Math.abs(fx - S);
        if (nB === null && B <= tol) nB = { k: k, n: n, S: S, E: E, B: B };
        if (nA === null && E <= tol) nA = { k: k, n: n };
        rows.push({ k: k, n: n, S: S, E: E, B: B });
        pts.push([k + 1, Math.log10(Math.max(E, 1e-17))]); ptsB.push([k + 1, Math.log10(Math.max(B, 1e-17))]);
        if (nB && k >= nB.k + 1) break;
      }
      MK.tex(eq, F.ft + "\\ \\text{ที่ } x = " + MK.sig(x, 6) + ",\\quad |R_n(x)| \\le " + F.bt + " \\le " + MK.sig(tol, 2).replace("\\times", "\\times"), true);
      var show = rows.slice(Math.max(0, rows.length - 7));
      info.innerHTML = (nB ? '<p class="lap-note">' + flag(true, "ใช้ " + (nB.k + 1) + " พจน์ (ดีกรี " + nB.n + ") ตามขอบเขตเศษเหลือ") + (nA ? flag(true, "ค่าจริงถึงเกณฑ์ตั้งแต่ " + (nA.k + 1) + " พจน์") : "") + "</p>" : "") +
        '<div class="table-wrap"><table class="lap-pt"><thead><tr><th>พจน์</th><th>ดีกรี n</th><th>ผลบวก Pₙ(x)</th><th>|f − Pₙ| จริง</th><th>ขอบเขต</th></tr></thead><tbody>' +
        show.map(function (r) { return '<tr class="' + (nB && r.k === nB.k ? "in" : "") + '"><td>' + (r.k + 1) + "</td><td>" + r.n + "</td><td>" + fmt(r.S, 12) + "</td><td>" + fmt(r.E, 2) + "</td><td>" + fmt(r.B, 2) + "</td></tr>"; }).join("") +
        "</tbody></table></div><p class=\"lap-help\">ค่าจริง f(x) = " + fmt(fx, 14) + " · ขอบเขตใช้ได้แม้ไม่รู้ค่าจริง (นี่คือสิ่งที่ข้อสอบถาม) ส่วนค่าจริงมักถึงเกณฑ์เร็วกว่าหนึ่งพจน์" + (Math.abs(x) > 2 && (F.id === "sin" || F.id === "cos") ? " · x ใหญ่ใช้พจน์มาก ในทางปฏิบัติจึงลดช่วง (range reduction) ก่อน ดูแล็บไมโครคอนโทรลเลอร์ในบทการประยุกต์" : "") + "</p>";
      plot.innerHTML = plotIn(box, { w: 640, h: 220, xmin: 0.5, xmax: rows.length + 0.5, ymin: Math.min(-st.k - 2, Math.min.apply(null, pts.map(function (q) { return q[1]; }))), ymax: Math.max(1, Math.max.apply(null, ptsB.map(function (q) { return q[1]; })) + 0.5),
        series: [{ pts: ptsB, color: "var(--signal)", width: 1.8, dash: "5 4" }, { pts: pts, color: "var(--accent)", width: 2.2 }], hlines: [{ y: Math.log10(tol), color: "var(--ok)", label: "เกณฑ์" }],
        xlabel: "จำนวนพจน์", ylabel: "log₁₀ ความคลาดเคลื่อน", id: MK.uid("srn"), label: "error versus number of terms" });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (!b) return; st.f = b.getAttribute("data-f"); setOn(box, "f", st.f); draw(); });
    var xi = box.querySelector('[data-in="x"]'); xi.value = st.x;
    var go = function () { st.x = xi.value; draw(); };
    xi.addEventListener("change", go); xi.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    bindSliders(box, st, draw);
    box._set = function (o) { if (o.f) st.f = o.f; if (o.x != null) { st.x = String(o.x); xi.value = st.x; } if (o.tol) { st.k = o.tol; setSlider(box, "k", o.tol); } setOn(box, "f", st.f); draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 7. Laurent series explorer
  // rational presets in partial-fraction form: f(z) = Σ poly[k] z^k + Σ A/(z − p)^m
  var LAU = [
    { id: "r12", l: "1/((z−1)(z−2))", tex: "\\frac{1}{(z-1)(z-2)}", pf: "\\frac{1}{z-2} - \\frac{1}{z-1}", terms: [{ A: [-1, 0], p: [1, 0], m: 1 }, { A: [1, 0], p: [2, 0], m: 1 }], centers: [[0, 0], [1, 0]] },
    { id: "z1", l: "1/(z(z−1))", tex: "\\frac{1}{z(z-1)}", pf: "\\frac{1}{z-1} - \\frac{1}{z}", terms: [{ A: [-1, 0], p: [0, 0], m: 1 }, { A: [1, 0], p: [1, 0], m: 1 }], centers: [[0, 0], [1, 0]] },
    { id: "z2z3", l: "1/(z²(z−3))", tex: "\\frac{1}{z^{2}(z-3)}", pf: "-\\frac{1}{9z} - \\frac{1}{3z^{2}} + \\frac{1}{9(z-3)}", terms: [{ A: [-1 / 9, 0], p: [0, 0], m: 1 }, { A: [-1 / 3, 0], p: [0, 0], m: 2 }, { A: [1 / 9, 0], p: [3, 0], m: 1 }], centers: [[0, 0], [3, 0]] },
    { id: "zz1", l: "z/(z² + 1)", tex: "\\frac{z}{z^{2}+1}", pf: "\\frac{1/2}{z-i} + \\frac{1/2}{z+i}", terms: [{ A: [0.5, 0], p: [0, 1], m: 1 }, { A: [0.5, 0], p: [0, -1], m: 1 }], centers: [[0, 0], [0, 1]] },
    { id: "dbl", l: "1/(z(z−1)²)", tex: "\\frac{1}{z(z-1)^{2}}", pf: "\\frac{1}{z} - \\frac{1}{z-1} + \\frac{1}{(z-1)^{2}}", terms: [{ A: [1, 0], p: [0, 0], m: 1 }, { A: [-1, 0], p: [1, 0], m: 1 }, { A: [1, 0], p: [1, 0], m: 2 }], centers: [[1, 0], [0, 0]] },
    { id: "zt", l: "การแปลง Z: z/(z − ½)", tex: "X(z) = \\frac{z}{z-\\frac12}", pf: "1 + \\frac{1/2}{z-\\frac12}", poly: [1], terms: [{ A: [0.5, 0], p: [0.5, 0], m: 1 }], centers: [[0, 0]], zt: true },
    { id: "zt2", l: "การแปลง Z: z/((z−½)(z−2))", tex: "X(z) = \\frac{z}{(z-\\frac12)(z-2)}", pf: "\\frac{4/3}{z-2} - \\frac{1/3}{z-\\frac12}", terms: [{ A: [-1 / 3, 0], p: [0.5, 0], m: 1 }, { A: [4 / 3, 0], p: [2, 0], m: 1 }], centers: [[0, 0]], zt: true },
    { id: "exp1z", l: "e^(1/z) เอกฐานแท้", tex: "e^{1/z}", fixed: { kind: "ess", coef: function (n) { return n <= 0 ? [1 / fact(-n), 0] : [0, 0]; }, f: function (z) { return C.exp(C.div([1, 0], z)); }, neg: "inf", pos: "fin" } },
    { id: "sinz4", l: "sin z / z⁴ โพลอันดับ 3", tex: "\\frac{\\sin z}{z^{4}}", fixed: { kind: "pole", order: 3, coef: function (n) { var k = n + 4; return k >= 0 && k % 2 === 1 ? [((k - 1) / 2 % 2 ? -1 : 1) / fact(k), 0] : [0, 0]; }, f: function (z) { return C.div(C.sin(z), C.pow(z, 4)); }, neg: "fin", pos: "inf" } },
    { id: "remov", l: "(eᶻ − 1)/z ถอดได้", tex: "\\frac{e^{z}-1}{z}", fixed: { kind: "rem", coef: function (n) { return n >= 0 ? [1 / fact(n + 1), 0] : [0, 0]; }, f: function (z) { return C.div(C.sub(C.exp(z), [1, 0]), z); }, neg: "none", pos: "inf" } }
  ];
  var EPS = 1e-9;
  function regionsFor(P, c) {
    if (P.fixed) return [{ rin: 0, rout: Infinity, punct: true }];
    var ds = [];
    P.terms.forEach(function (t) { var dd = C.abs(C.sub(t.p, c)); if (!ds.some(function (q) { return Math.abs(q - dd) < EPS; })) ds.push(dd); });
    ds.sort(function (x, y) { return x - y; });
    var out = [], prev = 0, punct = false;
    if (ds.length && ds[0] < EPS) { punct = true; ds.shift(); }
    ds.forEach(function (r) { out.push({ rin: prev, rout: r, punct: punct && prev === 0 }); prev = r; });
    out.push({ rin: prev, rout: Infinity, punct: punct && prev === 0 });
    return out;
  }
  // coefficients a_n of Σ a_n (z − c)^n for n = −K..K on the region {rin < |z − c| < rout}
  function laurentCoeffs(P, c, reg, K) {
    var a = {}; for (var n = -K; n <= K; n++) a[n] = [0, 0];
    if (P.fixed) { for (var n2 = -K; n2 <= K; n2++) a[n2] = P.fixed.coef(n2); return a; }
    (P.poly || []).forEach(function (b, k) { // b z^k = b (w + c)^k
      for (var j = 0; j <= k; j++) { var co = C.scale(C.pow(c, k - j), b * binom(k, j)); a[j] = C.add(a[j], co); }
    });
    P.terms.forEach(function (t) {
      var dd = C.sub(t.p, c), r = C.abs(dd), m = t.m;
      if (r < EPS) { if (m <= K) a[-m] = C.add(a[-m], t.A); return; }
      if (r <= reg.rin + EPS) { // pole inside: A/(w − d)^m = A Σ_j C(m+j−1, j) d^j w^{−m−j}
        for (var j = 0; m + j <= K; j++) a[-m - j] = C.add(a[-m - j], C.scale(C.mul(t.A, C.pow(dd, j)), binom(m + j - 1, j)));
      } else { // pole outside: A (−1)^m d^{−m} Σ_j C(m+j−1, j) (w/d)^j
        for (var j2 = 0; j2 <= K; j2++) a[j2] = C.add(a[j2], C.scale(C.mul(t.A, C.pow(dd, -m - j2)), (m % 2 ? -1 : 1) * binom(m + j2 - 1, j2)));
      }
    });
    return a;
  }
  function evalRational(P, z) {
    var s = [0, 0];
    (P.poly || []).forEach(function (b, k) { s = C.add(s, C.scale(C.pow(z, k), b)); });
    P.terms.forEach(function (t) { s = C.add(s, C.div(t.A, C.pow(C.sub(z, t.p), t.m))); });
    return s;
  }
  function initLaurent(box) {
    var d = box.dataset;
    var st = { pre: d.preset || "r12", ci: +(d.center || 0), ri: +(d.region || 0), z: null, drag: false };
    box.innerHTML = chipRow(LAU, "p", st.pre, "sr-pre") + '<div class="sr-lc"></div><div class="sr-lr"></div>' +
      '<div class="lap-eq sr-eq"></div><div class="sr-two"><div class="sr-cp"></div><div class="sr-side"></div></div><div class="sr-plot"></div><div class="sr-info"></div>';
    var lc = box.querySelector(".sr-lc"), lr = box.querySelector(".sr-lr"), eq = box.querySelector(".sr-eq"), cp = box.querySelector(".sr-cp"), side = box.querySelector(".sr-side"), plot = box.querySelector(".sr-plot"), info = box.querySelector(".sr-info");
    var Pc, center, regs, reg, coef, K = 60, view;
    function wName(c) { return c[0] === 0 && c[1] === 0 ? "z" : "(z " + (C.abs(c) ? "- " + (c[1] ? cTex(c) : MK.nice(c[0])) : "") + ")"; }
    function wPlain(c) { return c[0] === 0 && c[1] === 0 ? "z" : "z − " + (c[1] ? (c[0] ? c[0] + "+" : "") + (c[1] === 1 ? "" : c[1]) + "i" : c[0]); }
    function regLabel(r) {
      var w = "|" + wPlain(center) + "|";
      if (r.rout === Infinity) return r.rin === 0 ? (r.punct ? "0 < " + w : "ทุก z") : w + " > " + fmt(r.rin, 3);
      return (r.rin === 0 ? (r.punct ? "0 < " : "") : fmt(r.rin, 3) + " < ") + w + " < " + fmt(r.rout, 3);
    }
    function regTex(r) {
      var w = "|" + wName(center).replace(/^\(|\)$/g, "") + "|";
      if (r.rout === Infinity) return r.rin === 0 ? (r.punct ? "0 < " + w : "\\text{ทุก } z") : w + " > " + MK.nice(r.rin);
      return (r.rin === 0 ? (r.punct ? "0 < " : "") : MK.nice(r.rin) + " < ") + w + " < " + MK.nice(r.rout);
    }
    function setup() {
      Pc = LAU.filter(function (q) { return q.id === st.pre; })[0] || LAU[0];
      var cs = Pc.fixed ? [[0, 0]] : Pc.centers; if (st.ci >= cs.length) st.ci = 0; center = cs[st.ci];
      regs = regionsFor(Pc, center); if (st.ri >= regs.length) st.ri = 0; reg = regs[st.ri];
      lc.innerHTML = cs.length > 1 ? '<span class="lap-lbl">จุดศูนย์กลาง</span>' + chipRow(cs.map(function (c, i) { return { id: i, l: "c = " + (c[1] ? (c[0] ? c[0] + " + " : "") + (c[1] === 1 ? "" : c[1]) + "i" : c[0]) }; }), "c", st.ci) : "";
      lr.innerHTML = '<span class="lap-lbl">บริเวณ</span>' + chipRow(regs.map(function (r, i) { return { id: i, l: regLabel(r) }; }), "r", st.ri);
      coef = laurentCoeffs(Pc, center, reg, K);
      var rr = reg.rout === Infinity ? Math.max(reg.rin * 1.6, 1.2) : reg.rin > 0 ? (reg.rin + reg.rout) / 2 : reg.rout * 0.55;
      st.z = [center[0] + rr * Math.cos(0.6), center[1] + rr * Math.sin(0.6)];
    }
    function fval(z) { return Pc.fixed ? Pc.fixed.f(z) : evalRational(Pc, z); }
    function partial(z, N) { var w = C.sub(z, center), s = [0, 0]; for (var n = -N; n <= N; n++) { if (C.abs(coef[n]) > 1e-300) s = C.add(s, C.mul(coef[n], C.pow(w, n))); } return s; }
    function seriesTex() {
      var wn = wName(center), neg = [], pos = [], negInf = false, posInf = false;
      for (var n = -K; n < 0; n++) if (C.abs(coef[n]) > 1e-12) neg.push(n);
      for (var p = 0; p <= K; p++) if (C.abs(coef[p]) > 1e-12) pos.push(p);
      if (Pc.fixed) { negInf = Pc.fixed.neg === "inf"; posInf = Pc.fixed.pos === "inf"; }
      else { negInf = neg.length && neg[0] < -K + 8; posInf = pos.length && pos[pos.length - 1] > K - 8; }
      var term = function (n) {
        var cv = coef[n], cs = cTex(cv), isC = Math.abs(cv[1]) > 1e-12 && Math.abs(cv[0]) > 1e-12;
        var pw = n === 0 ? "" : n === 1 ? wn : wn + "^{" + n + "}";
        if (n !== 0 && cs === "1") cs = ""; else if (n !== 0 && cs === "-1") cs = "-";
        if (isC) cs = "\\left(" + cs + "\\right)";
        return { s: cs + pw, neg: !isC && cs.charAt(0) === "-" };
      };
      var parts = [];
      var negShow = negInf ? neg.slice(-4) : neg, posShow = posInf ? pos.slice(0, 4) : pos;
      if (negInf) parts.push("\\cdots");
      negShow.forEach(function (n) { parts.push(term(n)); });
      posShow.forEach(function (n) { parts.push(term(n)); });
      if (posInf) parts.push("\\cdots");
      var s = "";
      parts.forEach(function (t, i) {
        if (t === "\\cdots") { s += (i ? " + " : "") + "\\cdots"; return; }
        var body = t.s;
        if (i === 0) s += body; else s += t.neg ? " - " + body.replace(/^-/, "") : " + " + body;
      });
      return { s: s || "0", principal: neg.length, negInf: negInf, posInf: posInf, neg: neg };
    }
    function draw() {
      var info0 = seriesTex();
      texLines(eq, [(Pc.fixed ? Pc.tex : Pc.tex + " = " + Pc.pf), "= " + info0.s, "\\text{บริเวณ } " + regTex(reg)]);
      // complex plane
      var poles = Pc.fixed ? [[0, 0]] : Pc.terms.map(function (t) { return t.p; });
      var ext = 1.5; poles.concat([center]).forEach(function (p) { ext = Math.max(ext, Math.abs(p[0]) * 1.35 + 0.4, Math.abs(p[1]) * 1.35 + 0.4); });
      if (isFinite(reg.rout)) ext = Math.max(ext, Math.abs(center[0]) + reg.rout * 1.15, Math.abs(center[1]) + reg.rout * 1.15); else ext = Math.max(ext, Math.abs(center[0]) + reg.rin * 1.5 + 0.5);
      var W = 320, H = 300, sc = (H / 2 - 16) / ext, cx = W / 2, cy = H / 2;
      var X = function (re) { return cx + re * sc; }, Y = function (im) { return cy - im * sc; };
      var g = '<svg class="lap-sp sr-cplane" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="annulus of convergence in the complex plane">';
      var ccx = X(center[0]), ccy = Y(center[1]), ri = reg.rin * sc, ro = isFinite(reg.rout) ? reg.rout * sc : 2000;
      g += '<path class="lap-roc" fill-rule="evenodd" d="M' + (ccx - ro) + " " + ccy + "a" + ro + " " + ro + " 0 1 0 " + 2 * ro + " 0a" + ro + " " + ro + " 0 1 0 " + -2 * ro + " 0Z" +
        (ri > 0 ? "M" + (ccx - ri) + " " + ccy + "a" + ri + " " + ri + " 0 1 0 " + 2 * ri + " 0a" + ri + " " + ri + " 0 1 0 " + -2 * ri + " 0Z" : "") + '"/>';
      if (ri > 0) g += '<circle class="lap-rocb" fill="none" cx="' + ccx + '" cy="' + ccy + '" r="' + ri.toFixed(1) + '"/>';
      if (isFinite(reg.rout)) g += '<circle class="lap-rocb" fill="none" cx="' + ccx + '" cy="' + ccy + '" r="' + ro.toFixed(1) + '"/>';
      g += '<line class="lap-ax" x1="0" y1="' + cy + '" x2="' + W + '" y2="' + cy + '"/><line class="lap-ax" x1="' + cx + '" y1="0" x2="' + cx + '" y2="' + H + '"/>';
      poles.forEach(function (p) { var px = X(p[0]), py = Y(p[1]); g += '<g class="lap-pole"><path d="M' + (px - 6) + " " + (py - 6) + "L" + (px + 6) + " " + (py + 6) + "M" + (px + 6) + " " + (py - 6) + "L" + (px - 6) + " " + (py + 6) + '"/></g>'; });
      g += '<circle cx="' + ccx + '" cy="' + ccy + '" r="3.5" fill="var(--ink)"/><text class="lap-tk" x="' + (ccx + 6) + '" y="' + (ccy + 14) + '">c</text>';
      var zx = X(st.z[0]), zy = Y(st.z[1]);
      g += '<line class="lap-vec c dash" x1="' + ccx + '" y1="' + ccy + '" x2="' + zx.toFixed(1) + '" y2="' + zy.toFixed(1) + '"/><circle class="mk-drag sr-zpt" cx="' + zx.toFixed(1) + '" cy="' + zy.toFixed(1) + '" r="8" fill="var(--ok)" stroke="var(--card)" stroke-width="2"/><text class="lap-ptl" x="' + (zx + 10).toFixed(1) + '" y="' + (zy - 8).toFixed(1) + '">z</text>';
      g += '<text class="lap-axl" x="' + (W - 22) + '" y="' + (cy - 6) + '">Re</text><text class="lap-axl" x="' + (cx + 6) + '" y="14">Im</text></svg>';
      cp.innerHTML = g;
      var svg = cp.querySelector("svg");
      var move = function (e) {
        if (!st.drag) return; e.preventDefault();
        var pt = MK.svgPoint(svg, e); st.z = [(pt.x - cx) / sc, (cy - pt.y) / sc];
        if (C.abs(C.sub(st.z, center)) < 1e-3) st.z[0] += 0.01;
        drawSide(); var c2 = svg.querySelector(".sr-zpt"); c2.setAttribute("cx", pt.x); c2.setAttribute("cy", pt.y);
        var ln = svg.querySelector(".lap-vec"); ln.setAttribute("x2", pt.x); ln.setAttribute("y2", pt.y);
        var tx = svg.querySelector(".sr-zpt + text"); tx.setAttribute("x", pt.x + 10); tx.setAttribute("y", pt.y - 8);
      };
      svg.addEventListener("pointerdown", function (e) { st.drag = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } move(e); });
      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerup", function () { st.drag = false; });
      svg.addEventListener("pointercancel", function () { st.drag = false; });
      drawSide();
      // coefficient stem plot
      var ns = []; for (var n = -10; n <= 10; n++) ns.push(n);
      var isZ = !!Pc.zt, cplx = ns.some(function (n) { return Math.abs(coef[n][1]) > 1e-12; });
      var val = function (n) { return isZ ? coef[-n][0] : cplx ? C.abs(coef[n]) : coef[n][0]; };
      var vs = ns.map(val), mx = Math.max.apply(null, vs.map(Math.abs).filter(isFinite)) || 1;
      var clip = Math.min(mx, 50);
      plot.innerHTML = plotIn(box, { w: 640, h: 200, xmin: -10.6, xmax: 10.6, ymin: Math.min(0, Math.min.apply(null, vs.map(function (v) { return Math.max(v, -clip); }))) * 1.15 - 0.02, ymax: Math.max(0, Math.max.apply(null, vs.map(function (v) { return Math.min(v, clip); }))) * 1.15 + 0.02,
        segs: ns.map(function (n, i) { var neg = isZ ? n > 0 : n < 0; return { x1: n, y1: 0, x2: n, y2: Math.max(-clip, Math.min(clip, vs[i])), color: neg ? "var(--accent)" : "var(--signal)", width: 3 }; }),
        marks: ns.map(function (n, i) { var neg = isZ ? n > 0 : n < 0; return { x: n, y: Math.max(-clip, Math.min(clip, vs[i])), r: 3.2, color: neg ? "var(--accent)" : "var(--signal)" }; }),
        xlabel: isZ ? "n (สัญญาณ x[n] = สัมประสิทธิ์ของ z⁻ⁿ)" : "n", ylabel: isZ ? "x[n]" : cplx ? "|aₙ|" : "aₙ", id: MK.uid("srl"), label: "Laurent coefficients" });
      // classification
      var cIsPole = poles.some(function (p) { return C.abs(C.sub(p, center)) < EPS; });
      var txt = "";
      if (Pc.fixed) {
        txt = Pc.fixed.kind === "ess" ? "ส่วนหลักมี<b>อนันต์พจน์</b> ⇒ z = 0 เป็น<b>จุดเอกฐานแท้ (essential singularity)</b> · เรซิดิว " + T("a_{-1} = 1", false)
          : Pc.fixed.kind === "pole" ? "ส่วนหลักมี " + T("z^{-3}", false) + " เป็นกำลังลบสูงสุด ⇒ <b>โพลอันดับ 3</b> · เรซิดิว " + T("a_{-1} = -\\tfrac16", false)
          : "ไม่มีพจน์กำลังลบเลย ⇒ <b>จุดเอกฐานที่ถอดได้ (removable)</b> นิยาม f(0) = 1 แล้วฟังก์ชันวิเคราะห์ที่ 0 · เรซิดิว 0";
      } else if (reg.rin === 0 && !cIsPole) txt = "f วิเคราะห์ที่ c จึงไม่มีพจน์กำลังลบ อนุกรมโลรองต์ในดิสก์นี้<b>คืออนุกรมเทย์เลอร์</b> (รัศมี = ระยะถึงโพลที่ใกล้ที่สุด)";
      else if (reg.rin === 0 && cIsPole) {
        var ord = -Math.min.apply(null, info0.neg);
        txt = "วงแหวนเจาะรอบโพล c: ส่วนหลักมี " + info0.principal + " พจน์ กำลังลบสูงสุดคือ " + ord + " ⇒ <b>โพลอันดับ " + ord + "</b> · เรซิดิว " + T("\\operatorname{Res}_{z=c} f = a_{-1} = " + cTex(coef[-1]), false);
      } else txt = "วงแหวนนี้มีโพลอยู่ข้างใน " + T("|z - c| \\le " + fmt(reg.rin, 3), false) + " พจน์กำลังลบมาจากโพลด้านใน พจน์กำลังบวกมาจากโพลด้านนอก · " + T("a_{-1} = " + cTex(coef[-1]), false) + " = ผลรวมเรซิดิวของโพลข้างใน (ใช้กับ " + T("\\oint", false) + " รอบวงกลมในวงแหวน)";
      if (isZ) txt += "<br>มุมมองการแปลง Z: " + T("X(z) = \\sum x[n] z^{-n}", false) + " ดังนั้น x[n] = สัมประสิทธิ์ของ " + T("z^{-n}", false) + " · บริเวณ " + T("|z| > r", false) + " ให้สัญญาณ<b>ข้างขวา (causal)</b> · " + T("|z| < r", false) + " ให้สัญญาณ<b>ข้างซ้าย</b> · วงแหวนระหว่างโพลให้สัญญาณ<b>สองด้าน</b> — บริเวณนี้คือ ROC นั่นเอง";
      info.innerHTML = '<p class="lap-note">' + txt + "</p>" + '<p class="lap-help">ลากจุดเขียว z ไปรอบ ๆ: ในแถบสีฟ้า (วงแหวน) ผลบวกย่อยลู่เข้าหา f(z) ออกนอกแถบแล้วลู่ออก · กราฟแท่ง: สีส้ม = ' + (isZ ? "n > 0 (ไม่เป็นศูนย์แปลว่าสัญญาณมีค่าหลัง n = 0)" : "ส่วนหลัก (กำลังลบ)") + " สีฟ้า = " + (isZ ? "n ≤ 0" : "ส่วนวิเคราะห์ (กำลังไม่ลบ)") + "</p>";
    }
    function drawSide() {
      var w = C.sub(st.z, center), r = C.abs(w), inside = r > reg.rin + 1e-9 && r < reg.rout - 1e-9, fz = fval(st.z);
      var rows = [2, 5, 10, 20, 40].map(function (N) { var s = partial(st.z, N), e = C.abs(C.sub(s, fz)); return "<tr><td>N = " + N + "</td><td>" + (isFinite(e) && e < 1e12 ? fmt(e, 2) : "∞") + "</td></tr>"; }).join("");
      side.innerHTML = '<p class="lap-note">' + flag(inside, inside ? "z อยู่ในวงแหวน: ลู่เข้า" : "z อยู่นอกวงแหวน: ลู่ออก") + "</p>" +
        '<table class="lap-pt"><tbody><tr><td>z</td><td>' + fmt(st.z[0], 3) + (st.z[1] >= 0 ? " + " : " − ") + fmt(Math.abs(st.z[1]), 3) + "i</td></tr><tr><td>|z − c|</td><td>" + fmt(r, 4) + "</td></tr>" +
        "<tr><td>f(z)</td><td>" + fmt(fz[0], 6) + (fz[1] >= 0 ? " + " : " − ") + fmt(Math.abs(fz[1]), 6) + "i</td></tr></tbody></table>" +
        '<table class="lap-pt"><thead><tr><th>พจน์ −N…N</th><th>|f(z) − Sₙ(z)|</th></tr></thead><tbody>' + rows + "</tbody></table>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); st.ci = 0; st.ri = 0; setOn(box, "p", st.pre); setup(); draw(); return; }
      b = e.target.closest("[data-c]"); if (b) { st.ci = +b.getAttribute("data-c"); st.ri = 0; setup(); draw(); return; }
      b = e.target.closest("[data-r]"); if (b) { st.ri = +b.getAttribute("data-r"); setup(); draw(); }
    });
    box._set = function (o) { if (o.preset) { st.pre = o.preset; st.ci = 0; st.ri = 0; } if (o.center != null) st.ci = o.center; if (o.region != null) st.ri = o.region; setOn(box, "p", st.pre); setup(); draw(); };
    box._redraw = draw;
    setup(); draw();
  }

  // ======================================================================= 8. random practice
  function R(min, max) { return rnd(min, max); }
  function nz(min, max) { var v = 0; while (!v) v = R(min, max); return v; }
  var DRILL = {
    arith: { l: "เลขคณิต", gen: function () {
      var a1 = R(-9, 12), dd = nz(-5, 7), n = R(10, 40), an = a1 + (n - 1) * dd, S = n * (a1 + an) / 2;
      return pick([
        { q: "ลำดับเลขคณิตมี \\(a_1 = " + a1 + "\\) และผลต่างร่วม \\(d = " + dd + "\\) จงหา \\(a_{" + n + "}\\)", ans: an, steps: ["\\(a_n = a_1 + (n-1)d = " + a1 + " + (" + n + " - 1)(" + dd + ") = " + an + "\\)"] },
        { q: "จงหาผลบวก " + n + " พจน์แรกของลำดับเลขคณิต \\(" + a1 + ", " + (a1 + dd) + ", " + (a1 + 2 * dd) + ", \\dots\\)", ans: S, steps: ["\\(d = " + dd + ",\\ a_{" + n + "} = " + a1 + " + " + (n - 1) + "(" + dd + ") = " + an + "\\)", "\\(S_{" + n + "} = \\dfrac{n}{2}(a_1 + a_n) = \\dfrac{" + n + "}{2}(" + a1 + " + " + an + ") = " + S + "\\)"] }
      ]); } },
    geo: { l: "เรขาคณิต", gen: function () {
      var a = nz(-6, 9), q = pick([2, 3, 4, 5]), p = pick([1, -1]) * R(1, q - 1);
      if (gcd(p, q) !== 1) p = p > 0 ? 1 : -1;
      var Sn = a * q / (q - p); // a / (1 − p/q)
      var n = R(4, 7), Spart = 0; for (var k = 0; k < n; k++) Spart += a * Math.pow(p / q, k);
      return pick([
        { q: "จงหาผลบวกของอนุกรมเรขาคณิตอนันต์ \\(\\displaystyle\\sum_{n=0}^{\\infty} " + a + "\\left(" + fracTex(p, q) + "\\right)^{n}\\)", ans: Sn, steps: ["\\(a = " + a + ",\\ r = " + fracTex(p, q) + "\\) และ \\(|r| < 1\\) จึงลู่เข้า", "\\(S = \\dfrac{a}{1-r} = \\dfrac{" + a + "}{1 - (" + fracTex(p, q) + ")} = " + MK.nice(Sn) + "\\)"] },
        { q: "จงหา \\(S_{" + n + "}\\) ของอนุกรมเรขาคณิตที่ \\(a_1 = " + a + "\\) และ \\(r = " + fracTex(p, q) + "\\) (ตอบเป็นเศษส่วนหรือทศนิยม)", ans: Spart, steps: ["\\(S_n = a_1\\dfrac{1 - r^n}{1 - r} = " + a + "\\cdot\\dfrac{1 - (" + fracTex(p, q) + ")^{" + n + "}}{1 - (" + fracTex(p, q) + ")} = " + MK.nice(Spart, { qmax: 100000 }) + "\\)"] }
      ]); } },
    dec: { l: "ทศนิยมซ้ำ", gen: function () {
      var len = R(1, 2), rep = len === 1 ? R(1, 9) : R(10, 98), pre = R(0, 1) ? R(0, 9) : null;
      var den = len === 1 ? 9 : 99, num, txt;
      if (pre === null) { num = rep; txt = "0.\\overline{" + (len === 2 && rep < 10 ? "0" + rep : rep) + "}"; }
      else { num = pre * den + rep; den *= 10; txt = "0." + pre + "\\overline{" + (len === 2 && rep < 10 ? "0" + rep : rep) + "}"; }
      var v = num / den;
      return { q: "เขียน \\(" + txt + "\\) เป็นเศษส่วนอย่างต่ำ", ans: v, steps: [pre === null ? "เป็นอนุกรมเรขาคณิต \\(\\dfrac{" + rep + "}{" + (len === 1 ? 10 : 100) + "} + \\dfrac{" + rep + "}{" + (len === 1 ? 100 : 10000) + "} + \\cdots\\) มี \\(r = " + fracTex(1, len === 1 ? 10 : 100) + "\\)" : "แยก \\(" + txt + " = \\dfrac{" + pre + "}{10} + \\dfrac{1}{10}\\cdot 0.\\overline{" + rep + "}\\)", "ได้ \\(" + fracTex(num, den) + "\\)"] };
    } },
    tele: { l: "กล้องส่องทางไกล", gen: function () {
      var c = R(1, 4), k0 = 1, val = 0; for (var j = 1; j <= c; j++) val += 1 / j; val /= c;
      return { q: "จงหา \\(\\displaystyle\\sum_{k=1}^{\\infty}\\frac{1}{k(k+" + c + ")}\\)", ans: val, steps: ["\\(\\dfrac{1}{k(k+" + c + ")} = \\dfrac{1}{" + c + "}\\left(\\dfrac1k - \\dfrac{1}{k+" + c + "}\\right)\\)", "พจน์หักล้างกันเหลือ " + c + " พจน์แรกของ \\(\\tfrac1k\\): \\(\\dfrac{1}{" + c + "}\\left(" + Array.apply(null, { length: c }).map(function (_, j) { return j ? "\\tfrac{1}{" + (j + 1) + "}" : "1"; }).join(" + ") + "\\right) = " + MK.nice(val) + "\\)"], k0: k0 };
    } },
    verdict: { l: "ลู่เข้า/ลู่ออก", gen: function () {
      var q = pick(QUIZ.filter(function (x) { return x.lv !== "a"; }));
      return { q: "อนุกรม \\(" + q.s + "\\) ลู่เข้าแบบใด", type: "choice", choices: VERD, ans: q.v, steps: [q.w] };
    } },
    radius: { l: "รัศมีการลู่เข้า", gen: function () {
      var b = R(2, 6), a = R(-3, 4), k = R(0, 2), pow = k === 0 ? "" : k === 1 ? "n" : "n^{2}";
      var aTex = a === 0 ? "x" : "(x " + (a > 0 ? "- " + a : "+ " + -a) + ")";
      return { q: "จงหารัศมีการลู่เข้าของ \\(\\displaystyle\\sum_{n=1}^{\\infty}\\frac{" + (pow || "1") + "\\," + aTex + "^{n}}{" + b + "^{n}}\\)", ans: b,
        steps: ["อัตราส่วน: \\(\\left|\\dfrac{a_{n+1}}{a_n}\\right| = " + (k ? "\\left(\\dfrac{n+1}{n}\\right)^{" + k + "}" : "") + "\\dfrac{|" + aTex.replace(/[()]/g, "") + "|}{" + b + "} \\to \\dfrac{|" + aTex.replace(/[()]/g, "") + "|}{" + b + "}\\)", "ลู่เข้าเมื่อ \\(|" + aTex.replace(/[()]/g, "") + "| < " + b + "\\) ⇒ \\(R = " + b + "\\) (ช่วงเปิด \\((" + (a - b) + ", " + (a + b) + ")\\); ปลายช่วงพจน์มีขนาด \\(" + (pow || "1") + "\\) ไม่เข้าใกล้ 0 จึงลู่ออกทั้งสองปลาย)"] };
    } },
    taylor: { l: "สัมประสิทธิ์เทย์เลอร์", gen: function () {
      var a = nz(-3, 3), k = R(2, 5), f = pick(["exp", "sin", "geo", "ln"]), ans, tex, steps;
      if (f === "sin" && k % 2 === 0) k++;
      if (f === "exp") { ans = Math.pow(a, k) / fact(k); tex = "e^{" + a + "x}"; steps = ["\\(e^{u} = \\sum \\dfrac{u^n}{n!}\\) แทน \\(u = " + a + "x\\)", "สัมประสิทธิ์ของ \\(x^{" + k + "}\\) คือ \\(\\dfrac{(" + a + ")^{" + k + "}}{" + k + "!} = " + MK.nice(ans, { qmax: 100000 }) + "\\)"]; }
      else if (f === "sin") { var m = (k - 1) / 2; ans = (m % 2 ? -1 : 1) * Math.pow(a, k) / fact(k); tex = "\\sin(" + a + "x)"; steps = ["\\(\\sin u = u - \\dfrac{u^3}{3!} + \\dfrac{u^5}{5!} - \\cdots\\) แทน \\(u = " + a + "x\\)", "พจน์ \\(x^{" + k + "}\\): \\(\\dfrac{(-1)^{" + m + "}(" + a + ")^{" + k + "}}{" + k + "!} = " + MK.nice(ans, { qmax: 100000 }) + "\\)"]; }
      else if (f === "geo") { ans = Math.pow(a, k); tex = "\\dfrac{1}{1 - " + (a === 1 ? "" : a === -1 ? "(-1)" : "(" + a + ")") + "x}"; steps = ["\\(\\dfrac{1}{1-u} = \\sum u^n\\) แทน \\(u = " + a + "x\\)", "สัมประสิทธิ์ของ \\(x^{" + k + "}\\) คือ \\((" + a + ")^{" + k + "} = " + ans + "\\)"]; }
      else { ans = (k % 2 ? 1 : -1) * Math.pow(a, k) / k; tex = "\\ln(1 + " + (a === 1 ? "" : "(" + a + ")") + "x)"; steps = ["\\(\\ln(1+u) = u - \\dfrac{u^2}{2} + \\dfrac{u^3}{3} - \\cdots\\) แทน \\(u = " + a + "x\\)", "พจน์ \\(x^{" + k + "}\\): \\(\\dfrac{(-1)^{" + (k + 1) + "}(" + a + ")^{" + k + "}}{" + k + "} = " + MK.nice(ans) + "\\)"]; }
      return { q: "จงหาสัมประสิทธิ์ของ \\(x^{" + k + "}\\) ในอนุกรมแมคลอรินของ \\(" + tex + "\\)", ans: ans, steps: steps };
    } },
    limit: { l: "ลิมิตด้วยอนุกรม", gen: function () {
      var a = nz(-4, 4), t = R(0, 3), ax = (a === 1 ? "" : a === -1 ? "-" : a) + "x", A = a === 1 ? "x" : "(" + ax + ")";
      var minus = function (v) { return (v > 0 ? "- " : "+ ") + (Math.abs(v) === 1 ? "" : Math.abs(v)) + "x"; }; // "− a x"
      var plus = function (v) { return (v > 0 ? "+ " : "- ") + (Math.abs(v) === 1 ? "" : Math.abs(v)) + "x"; };   // "+ a x"
      var L = [
        { q: "\\lim_{x\\to0}\\frac{e^{" + ax + "} - 1 " + minus(a) + "}{x^{2}}", v: a * a / 2, s: "\\(e^{u} = 1 + u + \\tfrac{u^2}{2} + \\cdots\\) กับ \\(u = " + ax + "\\) ⇒ ตัวเศษ \\(= \\tfrac{" + a * a + "x^2}{2} + \\cdots\\) ⇒ ลิมิต \\(" + MK.nice(a * a / 2) + "\\)" },
        { q: "\\lim_{x\\to0}\\frac{1 - \\cos " + A + "}{x^{2}}", v: a * a / 2, s: "\\(1 - \\cos u = \\tfrac{u^2}{2} - \\tfrac{u^4}{24} + \\cdots\\) ⇒ \\(\\dfrac{" + a * a + "x^2/2}{x^2}\\) ⇒ ลิมิต \\(" + MK.nice(a * a / 2) + "\\)" },
        { q: "\\lim_{x\\to0}\\frac{" + ax + " - \\sin " + A + "}{x^{3}}", v: a * a * a / 6, s: "\\(\\sin u = u - \\tfrac{u^3}{6} + \\cdots\\) ⇒ ตัวเศษ \\(= \\tfrac{(" + a + ")^3 x^3}{6} + \\cdots\\) ⇒ ลิมิต \\(" + MK.nice(a * a * a / 6) + "\\)" },
        { q: "\\lim_{x\\to0}\\frac{\\ln(1 " + plus(a) + ") " + minus(a) + "}{x^{2}}", v: -a * a / 2, s: "\\(\\ln(1+u) = u - \\tfrac{u^2}{2} + \\cdots\\) ⇒ ตัวเศษ \\(= -\\tfrac{" + a * a + "x^2}{2} + \\cdots\\) ⇒ ลิมิต \\(" + MK.nice(-a * a / 2) + "\\)" }
      ];
      var r = L[t];
      return { q: "จงหา \\(\\displaystyle " + r.q + "\\)", ans: r.v, steps: [r.s] };
    } },
    residue: { l: "เรซิดิว", gen: function () {
      var t = R(0, 2), p, q, k, a;
      if (t === 0) { p = nz(-4, 4); q = p; while (q === p) q = nz(-4, 4);
        return { q: "จงหาเรซิดิวของ \\(f(z) = \\dfrac{1}{(z " + (p > 0 ? "- " + p : "+ " + -p) + ")(z " + (q > 0 ? "- " + q : "+ " + -q) + ")}\\) ที่ \\(z = " + p + "\\)", ans: 1 / (p - q), steps: ["โพลอย่างง่าย: \\(\\operatorname{Res} = \\lim_{z\\to " + p + "}(z - " + p + ")f(z) = \\dfrac{1}{" + p + " - (" + q + ")} = " + MK.nice(1 / (p - q)) + "\\)"] }; }
      if (t === 1) { k = R(1, 4); a = nz(-3, 3);
        return { q: "จงหาเรซิดิวของ \\(f(z) = \\dfrac{e^{" + (a === 1 ? "" : a) + "z}}{z^{" + (k + 1) + "}}\\) ที่ \\(z = 0\\)", ans: Math.pow(a, k) / fact(k), steps: ["\\(e^{" + a + "z} = \\sum \\dfrac{(" + a + ")^n z^n}{n!}\\) หารด้วย \\(z^{" + (k + 1) + "}\\)", "\\(a_{-1}\\) มาจาก \\(n = " + k + "\\): \\(\\dfrac{(" + a + ")^{" + k + "}}{" + k + "!} = " + MK.nice(Math.pow(a, k) / fact(k), { qmax: 10000 }) + "\\)"] }; }
      k = R(1, 3); var odd = 2 * k + 1;
      return { q: "จงหาเรซิดิวของ \\(f(z) = \\dfrac{\\sin z}{z^{" + (odd + 1) + "}}\\) ที่ \\(z = 0\\)", ans: (k % 2 ? -1 : 1) / fact(odd), steps: ["\\(\\sin z = \\sum \\dfrac{(-1)^m z^{2m+1}}{(2m+1)!}\\) หารด้วย \\(z^{" + (odd + 1) + "}\\)", "\\(a_{-1}\\) มาจาก \\(2m + 1 = " + odd + "\\): \\(\\dfrac{(-1)^{" + k + "}}{" + odd + "!} = " + MK.nice((k % 2 ? -1 : 1) / fact(odd), { qmax: 10000 }) + "\\)"] };
    } }
  };
  function initDrill(box) {
    var cats = (box.dataset.cats || Object.keys(DRILL).join(",")).split(",").filter(function (c) { return DRILL[c]; });
    var st = { on: cats.slice(), cur: null, score: 0, done: 0, ans: null };
    try { var sv = JSON.parse(localStorage.getItem("sr-drill-v1") || "null"); if (sv) { st.score = sv.s || 0; st.done = sv.d || 0; } } catch (e) { /* storage blocked */ }
    box.innerHTML = '<div class="lap-chips sr-dc">' + cats.map(function (c) { return '<button type="button" class="lap-chip on" data-dc="' + c + '">' + DRILL[c].l + "</button>"; }).join("") + "</div>" +
      '<div class="sr-dq"></div><div class="sr-da"></div><div class="lap-row"><button type="button" class="btn btn-primary btn-sm" data-go="check">ตรวจ</button><button type="button" class="btn btn-ghost btn-sm" data-go="show">ดูเฉลย</button><button type="button" class="btn btn-ghost btn-sm" data-go="next">ข้อใหม่ →</button><span class="mono sr-score"></span></div><div class="sr-df"></div>';
    var dq = box.querySelector(".sr-dq"), da = box.querySelector(".sr-da"), df = box.querySelector(".sr-df"), sc = box.querySelector(".sr-score");
    function score() { sc.textContent = "ถูก " + st.score + " / " + st.done; try { localStorage.setItem("sr-drill-v1", JSON.stringify({ s: st.score, d: st.done })); } catch (e) { /* ignore */ } }
    function next() {
      var c = pick(st.on.length ? st.on : cats); st.cur = DRILL[c].gen(); st.cur.cat = c; st.ans = null; st.checked = false;
      dq.innerHTML = '<span class="lap-chip on sr-tag">' + DRILL[c].l + "</span><p>" + rich(st.cur.q) + "</p>";
      da.innerHTML = st.cur.type === "choice" ? chipRow(st.cur.choices, "ch", null) : '<div class="lap-row"><label class="lap-lbl">คำตอบ</label><input class="lap-in sm" data-in="ans" inputmode="text" autocomplete="off" placeholder="เช่น 3/4, -2, 0.125" aria-label="answer"></div>';
      df.innerHTML = ""; var inp = da.querySelector("input"); if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
    }
    function solution() { return '<ol class="lap-steps">' + st.cur.steps.map(function (s) { return "<li>" + rich(s) + "</li>"; }).join("") + "</ol>"; }
    function check() {
      var q = st.cur, ok;
      if (q.type === "choice") { if (!st.ans) { df.innerHTML = '<p class="lap-err">เลือกคำตอบก่อน</p>'; return; } ok = st.ans === q.ans; }
      else { var v; try { v = numIn(da.querySelector("input").value); } catch (e) { df.innerHTML = '<p class="lap-err">พิมพ์ตัวเลขหรือเศษส่วน เช่น 3/4</p>'; return; } ok = Math.abs(v - q.ans) <= 1e-6 * Math.max(1, Math.abs(q.ans)); }
      if (!st.checked) { st.done++; if (ok) st.score++; st.checked = true; score(); }
      df.innerHTML = '<div class="fl-why ' + (ok ? "ok" : "no") + '">' + flag(ok, ok ? "ถูกต้อง" : "ยังไม่ถูก") + (ok ? "" : " คำตอบคือ " + (q.type === "choice" ? VERD.filter(function (x) { return x.id === q.ans; })[0].l : T(MK.nice(q.ans, { qmax: 100000 }), false))) + solution() + "</div>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-dc]");
      if (b) { var c = b.getAttribute("data-dc"), i = st.on.indexOf(c); if (i >= 0 && st.on.length > 1) st.on.splice(i, 1); else if (i < 0) st.on.push(c); b.classList.toggle("on", st.on.indexOf(c) >= 0); return; }
      b = e.target.closest("[data-ch]"); if (b) { st.ans = b.getAttribute("data-ch"); setOn(box, "ch", st.ans); return; }
      b = e.target.closest("[data-go]"); if (!b) return;
      var g = b.getAttribute("data-go");
      if (g === "check") check(); else if (g === "show") df.innerHTML = '<div class="fl-why ok">คำตอบ: ' + (st.cur.type === "choice" ? VERD.filter(function (x) { return x.id === st.cur.ans; })[0].l : T(MK.nice(st.cur.ans, { qmax: 100000 }), false)) + solution() + "</div>"; else next();
    });
    box._set = function (o) { if (o.cats) { st.on = o.cats.split(",").filter(function (c) { return DRILL[c]; }); $$("[data-dc]", box).forEach(function (b) { b.classList.toggle("on", st.on.indexOf(b.getAttribute("data-dc")) >= 0); }); } next(); };
    score(); next();
  }

  // ======================================================================= 9. engineering approximations
  function agm(a, b) { for (var i = 0; i < 40 && Math.abs(a - b) > 1e-15 * a; i++) { var t = (a + b) / 2; b = Math.sqrt(a * b); a = t; } return a; }
  function initApprox(box) {
    var d = box.dataset;
    var st = { mode: d.mode || "pendulum", th: 60, K: 3, red: 1, I: 1, dv: 10 };
    box.innerHTML = chipRow([{ id: "pendulum", l: "คาบลูกตุ้มมุมกว้าง" }, { id: "mcu", l: "sin x ในไมโครคอนโทรลเลอร์" }, { id: "diode", l: "ไดโอดสัญญาณเล็ก" }], "m", st.mode, "sr-modes") +
      '<div class="sr-ap" data-pane="pendulum">' + slider("th", "มุมเริ่มต้น θ₀ (องศา)", 1, 170, 1, st.th) + "</div>" +
      '<div class="sr-ap" data-pane="mcu">' + slider("K", "จำนวนพจน์ของอนุกรม", 1, 7, 1, st.K) + chipRow([{ id: 1, l: "ลดช่วงเป็น [−π/2, π/2]" }, { id: 0, l: "ไม่ลดช่วง" }], "rd", st.red) + "</div>" +
      '<div class="sr-ap" data-pane="diode">' + slider("I", "กระแสไบแอส I_D (mA)", 0.1, 10, 0.1, st.I) + slider("dv", "สัญญาณ Δv (mV)", -40, 40, 1, st.dv) + "</div>" +
      '<div class="lap-eq sr-eq"></div><div class="sr-plot"></div><div class="sr-info"></div>';
    var eq = box.querySelector(".sr-eq"), plot = box.querySelector(".sr-plot"), info = box.querySelector(".sr-info");
    var PEN = [1, 1 / 16, 11 / 3072, 173 / 737280, 22931 / 1321205760];
    function penExact(t) { return 1 / agm(1, Math.cos(t / 2)); }
    function penSer(t, n) { var s = 0; for (var k = 0; k < n; k++) s += PEN[k] * Math.pow(t, 2 * k); return s; }
    function drawPen() {
      var th = st.th * Math.PI / 180, ex = penExact(th);
      MK.tex(eq, "\\frac{T}{T_0} = \\frac{2}{\\pi}K\\!\\left(\\sin\\tfrac{\\theta_0}{2}\\right) = 1 + \\frac{\\theta_0^2}{16} + \\frac{11\\,\\theta_0^4}{3072} + \\frac{173\\,\\theta_0^6}{737280} + \\cdots,\\quad T_0 = 2\\pi\\sqrt{L/g}", true);
      var deg = function (fn) { return MK.sample(function (x) { return fn(x * Math.PI / 180); }, 0.5, 170, 300); };
      plot.innerHTML = plotIn(box, { w: 640, h: 280, xmin: 0, xmax: 172, ymin: 0.95, ymax: Math.min(3.2, penExact(172 * Math.PI / 180)) + 0.05,
        series: [{ pts: deg(penExact), color: "var(--ink)", width: 2.6 }, { pts: deg(function (t) { return penSer(t, 1); }), color: "var(--ink-3)", dash: "4 4", width: 1.4 },
          { pts: deg(function (t) { return penSer(t, 2); }), color: "var(--signal)", width: 1.8 }, { pts: deg(function (t) { return penSer(t, 3); }), color: "var(--accent)", width: 1.8 }, { pts: deg(function (t) { return penSer(t, 5); }), color: "var(--ok)", width: 1.8 }],
        vlines: [{ x: st.th, color: "var(--signal)" }], xlabel: "θ₀ (องศา)", ylabel: "T / T₀", id: MK.uid("srp"), label: "pendulum period versus amplitude" });
      var rows = [1, 2, 3, 5].map(function (n) { var v = penSer(th, n); return "<tr><td>" + n + " พจน์</td><td>" + fmt(v, 7) + "</td><td>" + fmt(100 * (v - ex) / ex, 3) + " %</td></tr>"; }).join("");
      info.innerHTML = '<p class="lap-note"><span class="lap-key" style="border-top-color:var(--ink)"></span> ค่าแม่นตรง (อินทิกรัลวงรี) · <span class="lap-key k1"></span> 1 พจน์ (มุมเล็ก) · <span class="lap-key k3"></span> 2 พจน์ · <span class="lap-key k2"></span> 3 พจน์ · เขียว 5 พจน์</p>' +
        '<table class="lap-pt"><thead><tr><th>θ₀ = ' + st.th + '°</th><th>T/T₀</th><th>ผิดจากค่าจริง</th></tr></thead><tbody><tr><td>ค่าแม่นตรง</td><td><b>' + fmt(ex, 7) + "</b></td><td>—</td></tr>" + rows + "</tbody></table>" +
        '<p class="lap-help">สูตร \\(T_0 = 2\\pi\\sqrt{L/g}\\) มาจากการประมาณ sin θ ≈ θ (พจน์แรกของอนุกรมเทย์เลอร์) ที่ 10° ผิดเพียง 0.19 % แต่ที่ 60° ผิดราว 7 % · อนุกรมลู่เข้าทุก θ₀ &lt; 180° แต่ใกล้ 180° ต้องใช้พจน์จำนวนมาก (คาบ → ∞)</p>'.replace("\\(T_0 = 2\\pi\\sqrt{L/g}\\)", T("T_0 = 2\\pi\\sqrt{L/g}", false));
    }
    function sinPoly(x, K) { var s = 0, t = x, x2 = x * x; for (var k = 0; k < K; k++) { s += t; t *= -x2 / ((2 * k + 2) * (2 * k + 3)); } return s; }
    function sinRed(x, K) { // reduce to [−π/2, π/2] using sin(π − x) = sin x
      var y = x; if (y > Math.PI / 2) y = Math.PI - y; else if (y < -Math.PI / 2) y = -Math.PI - y; return sinPoly(y, K);
    }
    function drawMcu() {
      var K = st.K, red = !!st.red, ap = red ? function (x) { return sinRed(x, K); } : function (x) { return sinPoly(x, K); };
      var pts = MK.sample(function (x) { return Math.log10(Math.max(Math.abs(Math.sin(x) - ap(x)), 1e-17)); }, -Math.PI, Math.PI, 600);
      var mx = 0; pts.forEach(function (q) { mx = Math.max(mx, Math.pow(10, q[1])); });
      var coefs = []; for (var k = 0; k < K; k++) coefs.push((k % 2 ? -1 : 1) / fact(2 * k + 1));
      MK.tex(eq, "\\sin x \\approx " + coefs.map(function (cf, k) { var deg = 2 * k + 1; return (k ? (cf < 0 ? " - " : " + ") : "") + (deg === 1 ? "x" : "\\frac{x^{" + deg + "}}{" + deg + "!}"); }).join("") + (red ? ",\\quad x \\in [-\\tfrac{\\pi}{2}, \\tfrac{\\pi}{2}]" : ""), true);
      plot.innerHTML = plotIn(box, { w: 640, h: 260, xmin: -Math.PI, xmax: Math.PI, ymin: -17, ymax: 1, series: [{ pts: pts, color: "var(--accent)", width: 1.8 }],
        hlines: [{ y: Math.log10(1.19e-7), color: "var(--ok)", label: "float32 ε ≈ 1.2e−7" }, { y: Math.log10(2.2e-16), color: "var(--ink-3)", label: "double ε" }], vlines: red ? [{ x: Math.PI / 2, color: "var(--ink-3)" }, { x: -Math.PI / 2, color: "var(--ink-3)" }] : [],
        xlabel: "x (rad)", ylabel: "log₁₀|sin x − P(x)|", id: MK.uid("srm"), label: "error of Taylor sine approximation" });
      var x2 = "x2", code = "float sin_approx(float x) {   /* " + (red ? "ลดช่วงก่อน: |x| ≤ π/2 */" : "ไม่ลดช่วง */") + "\n" + (red ? "  if (x >  1.5707963f) x =  3.1415927f - x;\n  if (x < -1.5707963f) x = -3.1415927f - x;\n" : "") +
        "  float " + x2 + " = x * x;\n  return x * (" + horner(coefs) + ");\n}";
      info.innerHTML = '<table class="lap-pt"><tbody><tr><td>ความคลาดเคลื่อนสูงสุดบน [−π, π]</td><td><b>' + fmt(mx, 3) + "</b></td></tr><tr><td>เพียงพอสำหรับ float32?</td><td>" + (mx < 1.2e-7 ? "ใช่" : "ยัง — เพิ่มพจน์" + (red ? "" : " หรือลดช่วง")) + "</td></tr><tr><td>การคูณที่ใช้ (Horner)</td><td>" + (K + 1) + " ครั้ง</td></tr></tbody></table>" +
        '<pre class="sr-code"><code>' + esc(code) + '</code></pre><p class="lap-help">ความคลาดเคลื่อนโตเร็วเมื่อ |x| ใหญ่ เพราะเศษเหลือแปรตาม \\(|x|^{2K+1}/(2K+1)!\\) การลดช่วงทำให้ |x| ≤ π/2 จึงใช้พจน์น้อยลงมากสำหรับความแม่นเท่าเดิม ไลบรารีจริงยังลดช่วงต่อเหลือ [−π/4, π/4] และปรับสัมประสิทธิ์แบบ minimax</p>'.replace("\\(|x|^{2K+1}/(2K+1)!\\)", T("|x|^{2K+1}/(2K+1)!", false));
    }
    function horner(cf) { // x*(c0 + x2*(c1 + x2*(c2 + …)))
      var s = ""; for (var k = cf.length - 1; k >= 0; k--) { var v = cf[k].toExponential(9).replace("e+0", "e0") + "f"; s = k === cf.length - 1 ? v : v + " + x2 * (" + s + ")"; }
      return s;
    }
    function drawDiode() {
      var VT = 25.85, I = st.I, dv = st.dv;
      var ex = function (v) { return I * (Math.exp(v / VT) - 1); }, l1 = function (v) { return I * v / VT; }, l2 = function (v) { return I * (v / VT + v * v / (2 * VT * VT)); };
      MK.tex(eq, "i_D = I_S\\left(e^{v_D/V_T} - 1\\right) \\Rightarrow \\Delta i = I_D\\left(e^{\\Delta v/V_T} - 1\\right) = I_D\\left(\\frac{\\Delta v}{V_T} + \\frac{\\Delta v^2}{2V_T^2} + \\cdots\\right),\\ \\ g_m = \\frac{I_D}{V_T}", true);
      plot.innerHTML = plotIn(box, { w: 640, h: 270, xmin: -50, xmax: 50, series: [{ pts: MK.sample(ex, -50, 50, 300), color: "var(--ink)", width: 2.6 }, { pts: MK.sample(l1, -50, 50, 50), color: "var(--signal)", width: 1.8 }, { pts: MK.sample(l2, -50, 50, 200), color: "var(--accent)", width: 1.8, dash: "5 4" }],
        vlines: [{ x: dv, color: "var(--ok)" }], marks: [{ x: dv, y: ex(dv), color: "var(--ink)" }], xlabel: "Δv (mV)", ylabel: "Δi (mA)", id: MK.uid("srd"), label: "diode small-signal approximation" });
      var e1 = ex(dv), a1 = l1(dv), a2 = l2(dv);
      info.innerHTML = '<p class="lap-note"><span class="lap-key" style="border-top-color:var(--ink)"></span> ค่าจริง · <span class="lap-key k3" style="border-top-style:solid"></span> เชิงเส้น (g_m Δv) · <span class="lap-key k2"></span> อันดับสอง</p>' +
        '<table class="lap-pt"><tbody><tr><td>g_m = I_D/V_T · r_d = V_T/I_D</td><td>' + fmt(I / VT * 1000, 4) + " mS · " + fmt(VT / I, 4) + " Ω</td></tr>" +
        "<tr><td>Δi จริง ที่ Δv = " + dv + " mV</td><td><b>" + fmt(e1, 5) + " mA</b></td></tr><tr><td>เชิงเส้น</td><td>" + fmt(a1, 5) + " mA (ผิด " + (e1 ? fmt(100 * (a1 - e1) / e1, 3) : "0") + " %)</td></tr>" +
        "<tr><td>อันดับสอง</td><td>" + fmt(a2, 5) + " mA (ผิด " + (e1 ? fmt(100 * (a2 - e1) / e1, 3) : "0") + " %)</td></tr></tbody></table>" +
        '<p class="lap-help">แบบจำลองสัญญาณเล็กคือพหุนามเทย์เลอร์ดีกรี 1 ของเอกซ์โพเนนเชียล ใช้ได้ดีเมื่อ |Δv| ≪ V_T ≈ 25.9 mV (ที่ 300 K) พจน์อันดับสองคือที่มาของความเพี้ยนฮาร์มอนิกที่สอง</p>';
    }
    function draw() { $$(".sr-ap", box).forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== st.mode; }); if (st.mode === "pendulum") drawPen(); else if (st.mode === "mcu") drawMcu(); else drawDiode(); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-m]"); if (b) { st.mode = b.getAttribute("data-m"); setOn(box, "m", st.mode); draw(); return; }
      b = e.target.closest("[data-rd]"); if (b) { st.red = +b.getAttribute("data-rd"); setOn(box, "rd", st.red); draw(); }
    });
    bindSliders(box, st, draw, { I: function (v) { return v.toFixed(1); } });
    box._set = function (o) { if (o.mode) st.mode = o.mode; Object.keys(o).forEach(function (k) { if (k !== "mode") { st[k] = o[k]; setSlider(box, k, o[k]); } }); setOn(box, "m", st.mode); draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= boot
  var INIT = { "sr-sums": initSums, "sr-integral": initIntegral, "sr-alt": initAlt, "sr-quiz": initQuiz, "sr-power": initPower, "sr-need": initNeed, "sr-laurent": initLaurent, "sr-drill": initDrill, "sr-approx": initApprox };
  var lastW = {};
  function onResize() {
    $$(".sr-lab").forEach(function (box, i) { var w = box.clientWidth; if (box._redraw && Math.abs(w - (lastW[i] || w)) > 40) box._redraw(); lastW[i] = w; });
  }
  function boot() {
    var rt = null;
    if (root.addEventListener) root.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(onResize, 250); });
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls).forEach(function (box) {
        if (box.__sr) return; box.__sr = true;
        box.classList.add("cl-lab", "sr-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">แล็บโหลดไม่สำเร็จ: ' + esc(e.message) + "</p>"; if (root.console) console.error(e); }
      });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sr-set]"); if (!b) return;
      var box = document.getElementById(b.getAttribute("data-sr-target"));
      if (box && box._set) { try { box._set(JSON.parse(b.getAttribute("data-sr-set"))); } catch (er) { if (root.console) console.error(er); } box.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  }
  var API = { zeta: zeta, regionsFor: regionsFor, laurentCoeffs: laurentCoeffs, evalRational: evalRational, LAU: LAU, QUIZ: QUIZ, DRILL: DRILL, POWS: POWS, C: C, agm: agm };
  root.SRLab = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (inBrowser) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot(); }
})(typeof window !== "undefined" ? window : globalThis);
