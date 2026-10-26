/* Strong induction workbench (chapter 26.12, /learn/sequences-and-series/strong-induction/). Plain JS, KaTeX for live TeX.
   Engine (window.SI in the browser, module.exports in Node): dependency propagation, postage stamps / Frobenius, factor trees,
   take-away games (P/N positions), binary and Zeckendorf representations, 2×n domino tilings, bounds aₙ ≤ C·rⁿ.
   Widgets:
   <div class="si-deps" data-preset="fib">       which earlier cases each P(n) needs, how many base cases, animated proof sweep
   <div class="si-stamps" data-a="3" data-b="5">  postage stamps: reachable amounts, Frobenius number, generated proof
   <div class="si-fact" data-n="360">            factor tree built by strong induction
   <div class="si-choc" data-m="3" data-n="4">   chocolate bar: every break adds one piece ⇒ mn − 1 breaks
   <div class="si-nim" data-moves="1,2,3" data-n="21">  take-away game vs computer + W/L table proved by strong induction
   <div class="si-rep" data-mode="zeck" data-n="100">   binary and Zeckendorf representations step by step
   <div class="si-tile" data-n="5">              all 2×n domino tilings split by the last piece
   <div class="si-bound" data-preset="fib">      aₙ ≤ C·rⁿ: choose r and see the base cases and the inductive step pass or fail
   <div class="si-order" data-preset="stamps">   build a proof by tapping lines in order (one decoy line)
   <div class="si-flaw" data-preset="power">     find the wrong line in a flawed strong-induction proof
   Buttons: <button data-si-set='{…}' data-si-target="id">. */
(function (root) {
  "use strict";

  // ======================================================================= engine
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function smallestFactor(n) { if (n % 2 === 0) return 2; for (var d = 3; d * d <= n; d += 2) if (n % d === 0) return d; return n; }
  function isPrime(n) { return n >= 2 && smallestFactor(n) === n; }
  // dependencies of P(n) for a preset
  var DEP = {
    weak: { l: "อุปนัยธรรมดา", deps: function (n) { return [n - 1]; }, base: 1, n0: 1, rule: "P(n−1) ⇒ P(n)" },
    fib: { l: "ฟีโบนัชชี (ย้อน 2 ขั้น)", deps: function (n) { return [n - 1, n - 2]; }, base: 2, n0: 1, rule: "P(n−1) ∧ P(n−2) ⇒ P(n)" },
    trib: { l: "ไตรโบนัชชี (ย้อน 3 ขั้น)", deps: function (n) { return [n - 1, n - 2, n - 3]; }, base: 3, n0: 1, rule: "P(n−1) ∧ P(n−2) ∧ P(n−3) ⇒ P(n)" },
    stamp35: { l: "แสตมป์ 3 กับ 5 บาท", deps: function (n) { return [n - 3]; }, base: 3, n0: 8, rule: "P(n−3) ⇒ P(n) (เติมแสตมป์ 3 บาท)" },
    stamp45: { l: "แสตมป์ 4 กับ 5 บาท", deps: function (n) { return [n - 4]; }, base: 4, n0: 12, rule: "P(n−4) ⇒ P(n) (เติมแสตมป์ 4 บาท)" },
    half: { l: "เลขฐานสอง ⌊n/2⌋", deps: function (n) { return [Math.floor(n / 2)]; }, base: 1, n0: 1, rule: "P(⌊n/2⌋) ⇒ P(n)" },
    merge: { l: "แบ่งครึ่ง (merge sort)", deps: function (n) { return n < 2 ? [] : [Math.floor(n / 2), Math.ceil(n / 2)].filter(function (x, i, a) { return a.indexOf(x) === i; }); }, base: 1, n0: 1, rule: "P(⌊n/2⌋) ∧ P(⌈n/2⌉) ⇒ P(n)" },
    factor: { l: "แยกตัวประกอบ n = ab", deps: function (n) { var p = smallestFactor(n); return p === n ? [] : [p, n / p].filter(function (x, i, a) { return a.indexOf(x) === i; }); }, base: 0, n0: 2, rule: "n ประกอบ: P(a) ∧ P(b) ⇒ P(ab) · n เฉพาะ: จริงทันที", primeDirect: true }
  };
  function propagate(depsFn, n0, base, N, primeDirect) {
    var st = {}, why = {};
    for (var n = n0; n < n0 + N; n++) {
      if (n < n0 + base) { st[n] = "base"; continue; }
      var d = depsFn(n);
      if (!d.length) { st[n] = primeDirect ? "prime" : "fail"; continue; }
      var bad = d.filter(function (x) { return x < n0 || !(st[x] === "base" || st[x] === "ok" || st[x] === "prime"); });
      st[n] = bad.length ? "fail" : "ok"; if (bad.length) why[n] = bad;
    }
    return { st: st, why: why };
  }
  // postage stamps: smallest number of stamps for every amount up to L (DP), Frobenius number
  function stamps(vals, L) {
    var best = [0], from = [-1];
    for (var x = 1; x <= L; x++) {
      best[x] = Infinity; from[x] = -1;
      vals.forEach(function (v) { if (v <= x && best[x - v] + 1 < best[x]) { best[x] = best[x - v] + 1; from[x] = v; } });
    }
    var g = vals.reduce(gcd);
    var frob = null;
    if (g === 1) { frob = -1; for (var y = L; y >= 1; y--) if (best[y] === Infinity) { frob = y; break; } }
    function rep(x) { var cnt = {}; while (x > 0 && from[x] > 0) { cnt[from[x]] = (cnt[from[x]] || 0) + 1; x -= from[x]; } return x === 0 ? cnt : null; }
    return { best: best, frob: frob, g: g, rep: rep };
  }
  function factorTree(n, balanced) {
    var p = smallestFactor(n);
    if (p === n) return { n: n };
    var a = p;
    if (balanced) { for (var d = Math.floor(Math.sqrt(n)); d >= 2; d--) if (n % d === 0) { a = d; break; } }
    return { n: n, a: factorTree(a, balanced), b: factorTree(n / a, balanced) };
  }
  function primeFactors(n) { var out = {}; while (n > 1) { var p = smallestFactor(n); out[p] = (out[p] || 0) + 1; n /= p; } return out; }
  // take-away game: W (winning for the player to move) / L positions
  function gameTable(moves, N) {
    var res = [];
    for (var n = 0; n <= N; n++) {
      var win = null;
      moves.forEach(function (m) { if (win === null && m <= n && res[n - m].w === false) win = m; });
      res.push({ n: n, w: win !== null, by: win });
    }
    return res;
  }
  function fibs(limit) { var f = [1, 2]; while (f[f.length - 1] + f[f.length - 2] <= limit) f.push(f[f.length - 1] + f[f.length - 2]); return f; }
  function zeckendorf(n) {
    var F = fibs(n), steps = [], x = n;
    while (x > 0) { var k = F.length - 1; while (F[k] > x) k--; steps.push({ x: x, f: F[k], k: k, r: x - F[k], next: k > 0 ? F[k - 1] : 1 }); x -= F[k]; }
    return steps;
  }
  // all tilings of a 2×n board: strings of "|" (vertical) and "=" (two horizontals)
  function tilings(n) { if (n === 0) return [""]; if (n === 1) return ["|"]; return tilings(n - 1).map(function (t) { return t + "|"; }).concat(tilings(n - 2).map(function (t) { return t + "="; })); }
  // smallest r > 0 with Σ c_i r^{-i} = 1 (dominant root of tᵏ = Σ c_i t^{k−i}, c_i ≥ 0)
  function dominantRoot(c) {
    var g = function (r) { var s = 0; c.forEach(function (ci, i) { s += ci * Math.pow(r, -(i + 1)); }); return s - 1; };
    var lo = 1e-6, hi = 1; while (g(hi) > 0) hi *= 2;
    for (var it = 0; it < 200; it++) { var mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  var SI = { DEP: DEP, propagate: propagate, stamps: stamps, factorTree: factorTree, primeFactors: primeFactors, smallestFactor: smallestFactor, isPrime: isPrime, gameTable: gameTable, zeckendorf: zeckendorf, fibs: fibs, tilings: tilings, dominantRoot: dominantRoot, gcd: gcd };
  if (typeof module !== "undefined" && module.exports) module.exports = SI;
  root.SI = SI;
  if (typeof document === "undefined") return;

  // ======================================================================= UI helpers
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function T(s, d) {
    if (root.katex) { try { return root.katex.renderToString(s, { displayMode: !!d, throwOnError: false, strict: "ignore" }); } catch (e) { /* fall through */ } }
    return "<code>" + esc(s) + "</code>";
  }
  function rich(s) { return String(s).replace(/\\\(([\s\S]+?)\\\)/g, function (_, t) { return T(t, false); }); }
  function chipRow(list, attr, cur, cls) {
    return '<div class="lap-chips ' + (cls || "si-pre") + '">' + list.map(function (c) { return '<button type="button" class="lap-chip' + (String(c[0]) === String(cur) ? " on" : "") + '" ' + attr + '="' + esc(c[0]) + '">' + esc(c[1]) + "</button>"; }).join("") + "</div>";
  }
  function numIn(key, label, val, min, max) { return '<label class="sc-f si-num"><span>' + label + '</span><input class="lap-in" type="number" inputmode="numeric" data-k="' + key + '" value="' + val + '" min="' + min + '" max="' + max + '"></label>'; }
  function clampInt(v, a, b, d) { v = parseInt(v, 10); if (!isFinite(v)) v = d; return Math.max(a, Math.min(b, v)); }
  function flag(ok, t) { return '<span class="lap-flag ' + (ok ? "ok" : "no") + '">' + t + "</span>"; }

  // ======================================================================= 1. dependency grid
  function initDeps(box) {
    var st = { pre: box.dataset.preset || "fib", base: null, n0: null, sel: null, custom: "1,3", timer: null, shown: Infinity };
    var COUNT = 30;
    function P() {
      if (st.pre === "custom") {
        var offs = st.custom.split(/[,\s]+/).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0 && x <= 9; });
        if (!offs.length) offs = [1];
        return { l: "กำหนดเอง", deps: function (n) { return offs.map(function (o) { return n - o; }); }, base: Math.max.apply(null, offs), n0: 1, rule: offs.map(function (o) { return "P(n−" + o + ")"; }).join(" ∧ ") + " ⇒ P(n)", offs: offs };
      }
      return DEP[st.pre];
    }
    function render() {
      clearTimeout(st.timer);
      var p = P(), base = st.base === null ? p.base : st.base, n0 = st.n0 === null ? p.n0 : st.n0;
      var res = propagate(p.deps, n0, base, COUNT, p.primeDirect);
      var html = chipRow(Object.keys(DEP).map(function (k) { return [k, DEP[k].l]; }).concat([["custom", "กำหนดเอง"]]), "data-p", st.pre) +
        '<div class="si-ctl">' + numIn("base", "จำนวนกรณีฐาน", base, 0, 6) + numIn("n0", "เริ่มที่ n₀ =", n0, 0, 20) +
        (st.pre === "custom" ? '<label class="sc-f"><span>ย้อนกลับกี่ขั้น (คั่นด้วยจุลภาค)</span><input class="lap-in" data-k="custom" value="' + esc(st.custom) + '"></label>' : "") +
        '<button type="button" class="btn btn-primary btn-sm" data-go>▶ ไล่พิสูจน์ทีละตัว</button></div>' +
        '<p class="si-rule"><b>ขั้นอุปนัย:</b> ' + esc(p.rule) + " · กรณีฐานที่ต้องการน้อยที่สุด: <b>" + p.base + "</b>" + (p.primeDirect ? " (จำนวนเฉพาะเป็นกรณีที่พิสูจน์ได้ตรง ๆ)" : "") + "</p>";
      html += '<div class="si-grid" role="list">';
      var firstFail = null;
      for (var n = n0; n < n0 + COUNT; n++) {
        var s = res.st[n], hidden = n - n0 >= st.shown;
        if (s === "fail" && firstFail === null) firstFail = n;
        var depOf = st.sel !== null && p.deps(st.sel).indexOf(n) >= 0;
        html += '<button type="button" role="listitem" class="si-cell ' + (hidden ? "pend" : s) + (st.sel === n ? " sel" : "") + (depOf ? " dep" : "") + '" data-n="' + n + '" aria-label="P(' + n + ') ' + s + '"><span>' + n + "</span></button>";
      }
      html += "</div>";
      html += '<div class="si-legend"><span class="si-key base"></span>กรณีฐาน <span class="si-key ok"></span>ได้จากขั้นอุปนัย' + (p.primeDirect ? ' <span class="si-key prime"></span>จำนวนเฉพาะ' : "") + ' <span class="si-key fail"></span>พิสูจน์ไม่ได้</div>';
      var msg;
      if (st.sel !== null) {
        var d = p.deps(st.sel), stS = res.st[st.sel];
        msg = "<b>P(" + st.sel + ")</b> " + (stS === "base" ? "เป็นกรณีฐาน: ต้องพิสูจน์ตรง ๆ" : stS === "prime" ? "เป็นจำนวนเฉพาะ: จริงทันทีโดยไม่ต้องใช้กรณีก่อนหน้า" : "อาศัย " + d.map(function (x) { return "P(" + x + ")" + (x < n0 ? " (อยู่นอกโดเมน!)" : ""); }).join(" และ ") + (stS === "fail" ? " ซึ่งยังไม่ถูกพิสูจน์ → <b>ล้มไม่ได้</b>" : " ซึ่งพิสูจน์แล้วทั้งหมด → ล้มได้ ✓"));
      } else if (firstFail !== null && st.shown >= COUNT) {
        msg = flag(false, "ไม่ครบ") + " หยุดที่ <b>P(" + firstFail + ")</b> เพราะต้องใช้ " + res.why[firstFail].map(function (x) { return "P(" + x + ")"; }).join(", ") + " ที่ยังไม่ถูกพิสูจน์ → ต้องมีกรณีฐานอย่างน้อย " + p.base + " ตัว (เท่ากับจำนวนขั้นที่ย้อนกลับไกลที่สุด)";
      } else if (st.shown >= COUNT) {
        msg = flag(true, "ครบ") + " ทุก P(n) ตั้งแต่ n = " + n0 + " ล้มหมด (เห็น " + COUNT + " ตัว แต่เหตุผลเดียวกันใช้ได้ทุก n) · แตะตัวเลขเพื่อดูว่าแต่ละตัวอาศัยกรณีใด";
        if (base > p.base && p.base > 0) msg += " · มีกรณีฐานเกินจำเป็น " + (base - p.base) + " ตัว (ไม่ผิด แต่ต้องพิสูจน์มากขึ้น)";
      } else msg = "กำลังไล่…";
      html += '<p class="lap-note si-msg">' + msg + "</p>";
      box.innerHTML = html;
    }
    function animate() { st.sel = null; st.shown = 0; render(); (function step() { st.shown++; render(); if (st.shown < COUNT) st.timer = setTimeout(step, 70); })(); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); st.base = null; st.n0 = null; st.sel = null; st.shown = COUNT; render(); return; }
      var c = e.target.closest("[data-n]"); if (c) { var n = +c.getAttribute("data-n"); st.sel = st.sel === n ? null : n; st.shown = COUNT; render(); return; }
      if (e.target.closest("[data-go]")) animate();
    });
    box.addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      if (k === "base") st.base = clampInt(e.target.value, 0, 6, 1);
      if (k === "n0") st.n0 = clampInt(e.target.value, 0, 20, 1);
      if (k === "custom") { st.custom = e.target.value; st.base = null; }
      st.sel = null; st.shown = COUNT; render();
    });
    box._set = function (o) { if (o.preset) st.pre = o.preset; st.base = o.base === undefined ? null : o.base; st.n0 = o.n0 === undefined ? null : o.n0; if (o.custom) st.custom = o.custom; st.sel = null; st.shown = COUNT; render(); };
    st.shown = COUNT; render();
  }

  // ======================================================================= 2. postage stamps
  function initStamps(box) {
    var st = { a: clampInt(box.dataset.a, 2, 20, 3), b: clampInt(box.dataset.b, 2, 30, 5), c: box.dataset.c ? clampInt(box.dataset.c, 2, 40, 0) : 0, sel: null };
    function render() {
      var vals = [st.a, st.b].concat(st.c ? [st.c] : []).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort(function (x, y) { return x - y; });
      var s0 = vals[0], g = vals.reduce(gcd);
      var guess = vals.length === 2 ? vals[0] * vals[1] - vals[0] - vals[1] : vals[0] * vals[1];
      var L = Math.min(150, Math.max(40, guess + s0 + 12));
      var S = stamps(vals, L), F = S.frob;
      var html = '<div class="lap-chips si-pre">' + [[3, 5, 0], [4, 5, 0], [3, 7, 0], [5, 8, 0], [6, 9, 20], [6, 10, 15], [4, 6, 0]].map(function (t) { return '<button type="button" class="lap-chip' + (t[0] === st.a && t[1] === st.b && t[2] === st.c ? " on" : "") + '" data-v="' + t.join(",") + '">' + t.filter(Boolean).join(" กับ ") + " บาท" + (t[2] ? " (สามชนิด)" : "") + "</button>"; }).join("") + "</div>" +
        '<div class="si-ctl">' + numIn("a", "ราคาแสตมป์ a", st.a, 2, 20) + numIn("b", "ราคาแสตมป์ b", st.b, 2, 30) + numIn("c", "ชนิดที่สาม (0 = ไม่มี)", st.c, 0, 40) + "</div>";
      if (g > 1) {
        html += '<p class="sc-warn">ห.ร.ม. ของราคาแสตมป์คือ ' + g + " จึงรวมได้เฉพาะจำนวนที่หาร " + g + " ลงตัว มีราคาที่รวมไม่ได้ไม่จำกัด (ไม่มีค่าใหญ่สุดที่รวมไม่ได้)</p>";
      }
      html += '<div class="si-grid si-sgrid">';
      for (var x = 1; x <= L; x++) {
        var ok = S.best[x] !== Infinity, isBase = F !== null && x > F && x <= F + s0;
        html += '<button type="button" class="si-cell ' + (ok ? (isBase ? "base" : "ok") : "fail") + (x === F ? " frob" : "") + (st.sel === x ? " sel" : "") + '" data-x="' + x + '"><span>' + x + "</span></button>";
      }
      html += "</div>";
      html += '<div class="si-legend"><span class="si-key fail"></span>รวมไม่ได้ <span class="si-key base"></span>กรณีฐาน ' + s0 + ' ตัว <span class="si-key ok"></span>ได้จากขั้นอุปนัย ' + (F !== null ? '<span class="si-key frob"></span>ค่าใหญ่สุดที่รวมไม่ได้' : "") + "</div>";
      if (st.sel !== null) {
        var r = S.rep(st.sel);
        html += '<p class="lap-note si-msg"><b>' + st.sel + " บาท</b> " + (r ? "= " + Object.keys(r).map(function (v) { return r[v] + "×" + v; }).join(" + ") + (F !== null && st.sel > F + s0 ? " · จากขั้นอุปนัย: " + st.sel + " = " + (st.sel - s0) + " + " + s0 + " และ P(" + (st.sel - s0) + ") จริงตามสมมติฐานอุปนัย" : "") : "รวมไม่ได้ด้วยแสตมป์ชุดนี้") + "</p>";
      }
      if (F !== null) {
        var unreach = 0; for (var y = 1; y <= F; y++) if (S.best[y] === Infinity) unreach++;
        var lines = [];
        if (vals.length === 2) lines.push("แสตมป์สองชนิดที่ ห.ร.ม. = 1: ค่าใหญ่สุดที่รวมไม่ได้คือ \\(ab - a - b = " + vals[0] + "\\cdot" + vals[1] + " - " + vals[0] + " - " + vals[1] + " = " + F + "\\) (จำนวนโฟรเบเนียส) และมีราคาที่รวมไม่ได้ \\(\\tfrac{(a-1)(b-1)}{2} = " + unreach + "\\) ค่า");
        else lines.push("ค่าใหญ่สุดที่รวมไม่ได้คือ " + F + " (สามชนิดขึ้นไปไม่มีสูตรปิดทั่วไป หาได้ด้วยการไล่ตาราง) และมีราคาที่รวมไม่ได้ " + unreach + " ค่า");
        lines.push("<b>ข้อความ</b> \\(P(n)\\): ราคา n บาทรวมได้พอดีด้วยแสตมป์ " + vals.join(", ") + " บาท · ต้องการพิสูจน์ทุก \\(n \\ge " + (F + 1) + "\\)");
        lines.push("<b>กรณีฐาน</b> (" + s0 + " ตัว เพราะขั้นอุปนัยย้อนกลับ " + s0 + " บาท): " + range(F + 1, F + s0).map(function (n) { var r = S.rep(n); return n + " = " + Object.keys(r).map(function (v) { return r[v] + "×" + v; }).join(" + "); }).join(" · "));
        lines.push("<b>ขั้นอุปนัยแบบเข้ม</b>: ให้ \\(n \\ge " + (F + s0 + 1) + "\\) และ \\(P(j)\\) จริงทุก \\(" + (F + 1) + " \\le j < n\\) เพราะ \\(n - " + s0 + " \\ge " + (F + 1) + "\\) จึงมี \\(P(n - " + s0 + ")\\) เติมแสตมป์ " + s0 + " บาทอีกหนึ่งดวงได้ n บาท ∎");
        html += '<details class="sc-steps" open><summary>บทพิสูจน์ที่สร้างจากค่าที่เลือก</summary><ol class="lap-steps">' + lines.map(function (l) { return "<li><p>" + rich(l) + "</p></li>"; }).join("") + "</ol></details>";
      }
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) {
      var v = e.target.closest("[data-v]"); if (v) { var t = v.getAttribute("data-v").split(",").map(Number); st.a = t[0]; st.b = t[1]; st.c = t[2]; st.sel = null; render(); return; }
      var x = e.target.closest("[data-x]"); if (x) { var n = +x.getAttribute("data-x"); st.sel = st.sel === n ? null : n; render(); }
    });
    box.addEventListener("change", function (e) { var k = e.target.getAttribute("data-k"); if (!k) return; st[k] = k === "c" ? clampInt(e.target.value, 0, 40, 0) : clampInt(e.target.value, 2, k === "a" ? 20 : 30, 3); if (st.c && st.c < 2) st.c = 0; st.sel = null; render(); });
    box._set = function (o) { ["a", "b", "c"].forEach(function (k) { if (o[k] !== undefined) st[k] = o[k]; }); st.sel = null; render(); };
    render();
  }
  function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }

  // ======================================================================= 3. factor tree
  function initFact(box) {
    var st = { n: clampInt(box.dataset.n, 2, 1e12, 360), bal: true };
    function tree(t, depth) {
      if (!t.a) return '<li><span class="si-leaf">' + t.n + "</span></li>";
      return '<li><span class="si-node">' + t.n.toLocaleString("en-US") + '</span><small>= ' + t.a.n.toLocaleString("en-US") + " × " + t.b.n.toLocaleString("en-US") + "</small><ul>" + tree(t.a, depth + 1) + tree(t.b, depth + 1) + "</ul></li>";
    }
    function render() {
      var n = st.n, t = factorTree(n, st.bal), pf = primeFactors(n);
      var pfT = Object.keys(pf).map(function (p) { return p + (pf[p] > 1 ? "^{" + pf[p] + "}" : ""); }).join(" \\cdot ");
      var html = '<div class="lap-chips si-pre">' + [360, 1001, 1024, 97, 9699690, 600851475143].map(function (v) { return '<button type="button" class="lap-chip' + (v === n ? " on" : "") + '" data-v="' + v + '">' + v.toLocaleString("en-US") + "</button>"; }).join("") + "</div>" +
        '<div class="si-ctl">' + numIn("n", "จำนวนเต็ม n (2 ถึง 10¹²)", n, 2, 1e12) + '<label class="sc-f"><span>วิธีแยก</span><select class="lap-in" data-k="bal"><option value="1"' + (st.bal ? " selected" : "") + '>แบ่งใกล้ √n (ต้นไม้สมดุล)</option><option value="0"' + (st.bal ? "" : " selected") + ">ตัวประกอบเฉพาะที่เล็กที่สุดก่อน</option></select></label></div>";
      html += '<div class="lap-ans">' + '<div class="lap-eq">' + T(n.toLocaleString("en-US").replace(/,/g, "{,}") + " = " + pfT, true) + "</div>" + (isPrime(n) ? "<p>" + n + " เป็นจำนวนเฉพาะ: ข้อความจริงทันที (ผลคูณของจำนวนเฉพาะหนึ่งตัว)</p>" : "") + "</div>";
      html += '<ul class="si-tree">' + tree(t, 0) + "</ul>";
      html += '<p class="lap-help">ทุกโหนดที่ไม่ใช่จำนวนเฉพาะแตกเป็นสองตัวที่<b>เล็กกว่า</b> n แต่ไม่จำเป็นต้องเป็น n − 1 อุปนัยธรรมดา (รู้แค่ P(n−1)) จึงใช้ไม่ได้ ต้องใช้อุปนัยแบบเข้มที่สมมติ P(j) ทุก j &lt; n</p>';
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) { var v = e.target.closest("[data-v]"); if (v) { st.n = +v.getAttribute("data-v"); render(); } });
    box.addEventListener("change", function (e) { var k = e.target.getAttribute("data-k"); if (k === "n") st.n = clampInt(e.target.value, 2, 1e12, 360); if (k === "bal") st.bal = e.target.value === "1"; render(); });
    box._set = function (o) { if (o.n) st.n = o.n; render(); };
    render();
  }

  // ======================================================================= 4. chocolate bar
  function initChoc(box) {
    var st = { m: clampInt(box.dataset.m, 1, 8, 3), n: clampInt(box.dataset.n, 1, 8, 4), dir: "v", pieces: [], breaks: 0, log: [] };
    function reset() { st.pieces = [{ x: 0, y: 0, w: st.n, h: st.m }]; st.breaks = 0; st.log = []; render(); }
    function cut(pi, at) {
      var p = st.pieces[pi], q;
      if (st.dir === "v" && p.w > 1) { var k = Math.max(1, Math.min(p.w - 1, Math.round(at.x - p.x))); q = [{ x: p.x, y: p.y, w: k, h: p.h }, { x: p.x + k, y: p.y, w: p.w - k, h: p.h }]; }
      else if (p.h > 1) { var j = Math.max(1, Math.min(p.h - 1, Math.round(at.y - p.y))); q = [{ x: p.x, y: p.y, w: p.w, h: j }, { x: p.x, y: p.y + j, w: p.w, h: p.h - j }]; }
      else if (p.w > 1) { var k2 = Math.max(1, Math.min(p.w - 1, Math.round(at.x - p.x))); q = [{ x: p.x, y: p.y, w: k2, h: p.h }, { x: p.x + k2, y: p.y, w: p.w - k2, h: p.h }]; }
      if (!q) return false;
      st.pieces.splice(pi, 1, q[0], q[1]); st.breaks++;
      st.log.push(p.w + "×" + p.h + " → " + q[0].w + "×" + q[0].h + " + " + q[1].w + "×" + q[1].h);
      return true;
    }
    function render() {
      var U = 40, gap = 6, W = st.n * U + (st.n - 1) * 0, H = st.m * U;
      var s = '<svg class="si-choc-svg" viewBox="-6 -6 ' + (W + 12) + " " + (H + 12) + '" role="img" aria-label="แท่งช็อกโกแลต ' + st.m + " × " + st.n + '">';
      st.pieces.forEach(function (p, i) {
        var off = 2;
        s += '<g class="si-piece" data-i="' + i + '"><rect x="' + (p.x * U + off) + '" y="' + (p.y * U + off) + '" width="' + (p.w * U - 2 * off) + '" height="' + (p.h * U - 2 * off) + '" rx="4"/>';
        for (var a = 1; a < p.w; a++) s += '<line x1="' + ((p.x + a) * U) + '" y1="' + (p.y * U + 6) + '" x2="' + ((p.x + a) * U) + '" y2="' + ((p.y + p.h) * U - 6) + '"/>';
        for (var b = 1; b < p.h; b++) s += '<line x1="' + (p.x * U + 6) + '" y1="' + ((p.y + b) * U) + '" x2="' + ((p.x + p.w) * U - 6) + '" y2="' + ((p.y + b) * U) + '"/>';
        s += "</g>";
      });
      s += "</svg>";
      var done = st.pieces.length === st.m * st.n;
      var html = '<div class="si-ctl">' + numIn("m", "แถว m", st.m, 1, 8) + numIn("n", "คอลัมน์ n", st.n, 1, 8) +
        '<div class="lap-chips"><button type="button" class="lap-chip' + (st.dir === "v" ? " on" : "") + '" data-dir="v">หักแนวตั้ง ┃</button><button type="button" class="lap-chip' + (st.dir === "h" ? " on" : "") + '" data-dir="h">หักแนวนอน ━</button></div></div>' +
        '<p class="lap-help">แตะที่ชิ้นช็อกโกแลตเพื่อหักตามเส้นที่ใกล้จุดแตะที่สุด (หักได้ทีละชิ้น ห้ามซ้อนกัน)</p>' +
        '<div class="si-choc">' + s + "</div>" +
        '<div class="si-count"><span>หักไป <b>' + st.breaks + "</b> ครั้ง</span><span>มี <b>" + st.pieces.length + "</b> ชิ้น</span><span>ชิ้น − ครั้ง = <b>" + (st.pieces.length - st.breaks) + "</b></span></div>" +
        '<div class="sc-act"><button type="button" class="btn btn-ghost btn-sm" data-auto>สุ่มหักจนจบ</button><button type="button" class="btn btn-ghost btn-sm" data-reset>↺ เริ่มใหม่</button></div>' +
        (done ? '<p class="sc-ok">หักครบ ' + st.m * st.n + " ชิ้นด้วย " + st.breaks + " ครั้ง = mn − 1 พอดี ลองหักแบบอื่นก็ได้คำตอบเดิมทุกครั้ง</p>" : "") +
        (st.log.length ? '<p class="lap-help si-log">' + st.log.slice(-4).map(esc).join(" · ") + "</p>" : "");
      box.innerHTML = html;
    }
    function autoAll() {
      var guard = 0;
      while (st.pieces.length < st.m * st.n && guard++ < 200) {
        var cand = st.pieces.map(function (p, i) { return i; }).filter(function (i) { return st.pieces[i].w * st.pieces[i].h > 1; });
        var i = cand[Math.floor(Math.random() * cand.length)], p = st.pieces[i], save = st.dir;
        st.dir = p.w > 1 && (p.h === 1 || Math.random() < 0.5) ? "v" : "h";
        cut(i, { x: p.x + 1 + Math.floor(Math.random() * Math.max(1, p.w - 1)), y: p.y + 1 + Math.floor(Math.random() * Math.max(1, p.h - 1)) });
        st.dir = save;
      }
      render();
    }
    box.addEventListener("click", function (e) {
      var d = e.target.closest("[data-dir]"); if (d) { st.dir = d.getAttribute("data-dir"); render(); return; }
      if (e.target.closest("[data-reset]")) { reset(); return; }
      if (e.target.closest("[data-auto]")) { autoAll(); return; }
      var g = e.target.closest(".si-piece"); if (g) {
        var svg = g.ownerSVGElement, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
        if (cut(+g.getAttribute("data-i"), { x: loc.x / 40, y: loc.y / 40 })) render();
      }
    });
    box.addEventListener("change", function (e) { var k = e.target.getAttribute("data-k"); if (k) { st[k] = clampInt(e.target.value, 1, 8, 3); reset(); } });
    reset();
  }

  // ======================================================================= 5. take-away game
  function initNim(box) {
    var st = { moves: (box.dataset.moves || "1,2,3").split(",").map(Number), n: clampInt(box.dataset.n, 5, 40, 21), left: null, turn: "you", msg: "", sel: null, view: "play" };
    function parseMoves(s) { var m = String(s).split(/[,\s]+/).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0 && x <= 9; }); m = m.filter(function (x, i) { return m.indexOf(x) === i; }).sort(function (a, b) { return a - b; }); return m.length ? m : [1, 2, 3]; }
    function newGame() { st.left = st.n; st.turn = "you"; st.msg = "ตาคุณก่อน ผู้ที่หยิบเหรียญอันสุดท้ายเป็นผู้ชนะ"; render(); }
    function cpu() {
      var tab = gameTable(st.moves, st.left), mv = tab[st.left].by;
      if (mv === null) mv = st.moves.filter(function (m) { return m <= st.left; })[0];
      st.left -= mv;
      st.msg = "คอมพิวเตอร์หยิบ " + mv + " เหรียญ" + (tab[st.left] && !tab[st.left].w ? " (ทิ้งให้คุณอยู่ตำแหน่งแพ้ L)" : "");
      if (st.left === 0) { st.msg += " และหยิบอันสุดท้าย → คอมพิวเตอร์ชนะ"; st.turn = "over"; }
      else st.turn = "you";
    }
    function render() {
      var tab = gameTable(st.moves, Math.max(st.n, 40));
      var html = '<div class="lap-chips si-pre">' + [["1,2,3", "หยิบ 1–3"], ["1,2", "หยิบ 1–2"], ["1,3,4", "หยิบ 1, 3 หรือ 4"], ["2,5", "หยิบ 2 หรือ 5"], ["1,2,3,4,5", "หยิบ 1–5"]].map(function (c) { return '<button type="button" class="lap-chip' + (c[0] === st.moves.join(",") ? " on" : "") + '" data-mv="' + c[0] + '">' + c[1] + "</button>"; }).join("") + "</div>" +
        '<div class="si-ctl">' + numIn("n", "เหรียญเริ่มต้น", st.n, 5, 40) + '<label class="sc-f"><span>หยิบได้ครั้งละ (คั่นด้วยจุลภาค)</span><input class="lap-in" data-k="moves" value="' + st.moves.join(",") + '"></label>' +
        '<div class="lap-chips"><button type="button" class="lap-chip' + (st.view === "play" ? " on" : "") + '" data-view="play">เล่นกับคอมพิวเตอร์</button><button type="button" class="lap-chip' + (st.view === "table" ? " on" : "") + '" data-view="table">ตาราง W/L (พิสูจน์)</button></div></div>';
      if (st.view === "play") {
        var coins = ""; for (var i = 0; i < st.left; i++) coins += '<span class="si-coin"></span>';
        html += '<div class="si-pile" aria-label="เหลือ ' + st.left + ' เหรียญ">' + coins + "</div><p class=\"si-left\">เหลือ <b>" + st.left + "</b> เหรียญ</p>";
        if (st.turn === "you") html += '<div class="sc-act">' + st.moves.map(function (m) { return '<button type="button" class="btn btn-primary btn-sm" data-take="' + m + '"' + (m > st.left ? " disabled" : "") + ">หยิบ " + m + "</button>"; }).join("") + "</div>";
        html += '<p class="lap-note si-msg">' + esc(st.msg) + '</p><div class="sc-act"><button type="button" class="btn btn-ghost btn-sm" data-new>↺ เกมใหม่</button></div>';
        html += '<p class="lap-help">เคล็ดลับ: ดูตาราง W/L แล้วพยายามทิ้งจำนวนเหรียญที่เป็น L ให้คู่แข่งทุกครั้ง' + (tab[st.n].w ? "" : " · จำนวนเริ่มต้น " + st.n + " เป็น L สำหรับคนเริ่มก่อน ถ้าคอมพิวเตอร์ไม่พลาด คุณแพ้แน่นอน ลองเปลี่ยนจำนวนเริ่มต้น") + "</p>";
      } else {
        html += '<div class="si-grid si-ngrid">';
        tab.forEach(function (r) { html += '<button type="button" class="si-cell ' + (r.w ? "ok" : "fail") + (st.sel === r.n ? " sel" : "") + '" data-x="' + r.n + '"><span>' + r.n + "</span><small>" + (r.w ? "W" : "L") + "</small></button>"; });
        html += "</div>";
        var Ls = tab.filter(function (r) { return !r.w; }).map(function (r) { return r.n; }), per = period(tab);
        html += '<div class="si-legend"><span class="si-key fail"></span>L: คนที่ต้องเดินแพ้ (ถ้าอีกฝ่ายเล่นถูก) <span class="si-key ok"></span>W: คนที่ต้องเดินชนะได้</div>';
        if (st.sel !== null) {
          var r = tab[st.sel];
          html += '<p class="lap-note si-msg"><b>' + st.sel + "</b> " + (st.sel === 0 ? "ไม่มีเหรียญให้หยิบ คนที่ต้องเดินแพ้ (อีกฝ่ายหยิบอันสุดท้ายไปแล้ว) → L เป็นกรณีฐาน" : r.w ? "เป็น W เพราะหยิบ " + r.by + " แล้วเหลือ " + (st.sel - r.by) + " ซึ่งเป็น L" : "เป็น L เพราะทุกทางหยิบ (" + st.moves.filter(function (m) { return m <= st.sel; }).map(function (m) { return "เหลือ " + (st.sel - m); }).join(", ") + ") ไปถึงตำแหน่ง W ทั้งหมด") + " · ใช้ผลของตำแหน่งที่เล็กกว่าหลายตำแหน่งพร้อมกัน = อุปนัยแบบเข้ม</p>";
        }
        html += '<p class="lap-note">ตำแหน่ง L: ' + Ls.slice(0, 12).join(", ") + (Ls.length > 12 ? ", …" : "") + (per ? " · รูปแบบซ้ำทุก " + per + " ตำแหน่ง" : "") + (st.moves.join(",") === "1,2,3" ? " · ข้อความ \\(P(n)\\): n เป็น L ⇔ 4 | n พิสูจน์ด้วยอุปนัยแบบเข้ม" : "") + "</p>";
      }
      box.innerHTML = html.replace(/\\\((.+?)\\\)/g, function (_, t) { return T(t); });
    }
    function period(tab) { for (var p = 1; p <= 12; p++) { var ok = true; for (var i = 10; i + p < tab.length; i++) if (tab[i].w !== tab[i + p].w) { ok = false; break; } if (ok) return p; } return null; }
    box.addEventListener("click", function (e) {
      var mv = e.target.closest("[data-mv]"); if (mv) { st.moves = parseMoves(mv.getAttribute("data-mv")); st.sel = null; newGame(); return; }
      var v = e.target.closest("[data-view]"); if (v) { st.view = v.getAttribute("data-view"); render(); return; }
      var t = e.target.closest("[data-take]"); if (t && st.turn === "you") {
        var m = +t.getAttribute("data-take"); if (m > st.left) return;
        st.left -= m;
        if (st.left === 0) { st.msg = "คุณหยิบ " + m + " เหรียญ เป็นอันสุดท้าย → คุณชนะ! 🎉"; st.turn = "over"; render(); return; }
        st.msg = "คุณหยิบ " + m + " เหรียญ"; st.turn = "cpu"; render();
        setTimeout(function () { cpu(); render(); }, 450);
        return;
      }
      if (e.target.closest("[data-new]")) { newGame(); return; }
      var x = e.target.closest("[data-x]"); if (x) { var n = +x.getAttribute("data-x"); st.sel = st.sel === n ? null : n; render(); }
    });
    box.addEventListener("change", function (e) { var k = e.target.getAttribute("data-k"); if (k === "n") { st.n = clampInt(e.target.value, 5, 40, 21); newGame(); } if (k === "moves") { st.moves = parseMoves(e.target.value); newGame(); } });
    newGame();
  }

  // ======================================================================= 6. binary / Zeckendorf
  function initRep(box) {
    var st = { mode: box.dataset.mode || "zeck", n: clampInt(box.dataset.n, 1, 1e9, 100) };
    function render() {
      var n = st.n, html = '<div class="lap-chips si-pre"><button type="button" class="lap-chip' + (st.mode === "zeck" ? " on" : "") + '" data-m="zeck">ผลบวกฟีโบนัชชี (เซกเคนดอร์ฟ)</button><button type="button" class="lap-chip' + (st.mode === "bin" ? " on" : "") + '" data-m="bin">เลขฐานสอง</button></div>' +
        '<div class="si-ctl">' + numIn("n", "จำนวนนับ n", n, 1, 1e9) + "</div>";
      if (st.mode === "zeck") {
        var steps = zeckendorf(n), used = steps.map(function (s) { return s.f; });
        html += '<div class="lap-ans"><div class="lap-eq">' + T(n + " = " + used.join(" + "), true) + "</div><p>ใช้เลขฟีโบนัชชี " + used.length + " ตัว ไม่มีสองตัวที่ติดกันในลำดับ</p></div>";
        html += '<ol class="lap-steps si-zsteps">' + steps.map(function (s) {
          return "<li>" + rich("เลขฟีโบนัชชีที่ใหญ่สุดที่ไม่เกิน \\(" + s.x + "\\) คือ \\(F = " + s.f + "\\) เหลือ \\(" + s.x + " - " + s.f + " = " + s.r + "\\)" + (s.r > 0 ? " และ \\(" + s.r + " < " + s.next + "\\) (ตัวก่อนหน้า F) ⇒ ตัวต่อไปที่เลือกต้องเล็กกว่า " + s.next + " จึงไม่ติดกับ F · ใช้สมมติฐานอุปนัยกับ \\(" + s.r + " < " + s.x + "\\)" : " ⇒ จบ")) + "</li>";
        }).join("") + "</ol>";
        var F = fibs(Math.max(n, 2));
        html += '<div class="si-fibbar">' + F.map(function (f) { return '<span class="' + (used.indexOf(f) >= 0 ? "on" : "") + '">' + f + "</span>"; }).join("") + "</div>";
        html += '<p class="lap-help">ทำไมต้องอุปนัยแบบเข้ม: ส่วนที่เหลือ \\(n - F_k\\) เป็นจำนวนใดก็ได้ที่เล็กกว่า n ไม่ใช่ n − 1</p>'.replace(/\\\((.+?)\\\)/g, function (_, t) { return T(t); });
      } else {
        var chain = [], x = n; while (x >= 1) { chain.push(x); x = Math.floor(x / 2); }
        var bits = n.toString(2);
        html += '<div class="lap-ans"><div class="lap-eq">' + T(n + " = " + bits + "_2 = " + bits.split("").map(function (b, i) { return b === "1" ? "2^{" + (bits.length - 1 - i) + "}" : null; }).filter(Boolean).join(" + "), true) + "</div></div>";
        html += '<div class="table-wrap"><table class="lap-pt"><thead><tr><th>n</th><th>n = 2m + b</th><th>ใช้</th></tr></thead><tbody>' + chain.map(function (c) { return "<tr><td>" + c + "</td><td>" + (c === 1 ? "กรณีฐาน 1 = 1₂" : c + " = 2·" + Math.floor(c / 2) + " + " + (c % 2)) + "</td><td>" + (c === 1 ? "—" : "P(" + Math.floor(c / 2) + ")") + "</td></tr>"; }).join("") + "</tbody></table></div>";
        html += '<p class="lap-help">ขั้นอุปนัยย้อนไปที่ ⌊n/2⌋ ซึ่งไกลกว่า n − 1 มาก จึงต้องสมมติว่า P(j) จริงทุก j &lt; n · ลำดับนี้คือการหารสองซ้ำ ๆ เพื่อแปลงเป็นฐานสอง (และเป็นเหตุผลที่ binary search ใช้ ⌊log₂ n⌋ + 1 รอบ)</p>';
      }
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) { var m = e.target.closest("[data-m]"); if (m) { st.mode = m.getAttribute("data-m"); render(); } });
    box.addEventListener("change", function (e) { if (e.target.getAttribute("data-k") === "n") { st.n = clampInt(e.target.value, 1, 1e9, 100); render(); } });
    box._set = function (o) { if (o.mode) st.mode = o.mode; if (o.n) st.n = o.n; render(); };
    render();
  }

  // ======================================================================= 7. 2×n domino tilings
  function initTile(box) {
    var st = { n: clampInt(box.dataset.n, 1, 7, 5) };
    function svgOf(t, n) {
      var U = 14, s = '<svg class="si-til" viewBox="-1 -1 ' + (n * U + 2) + " " + (2 * U + 2) + '" width="' + (n * U + 2) + '" role="img" aria-label="tiling ' + t + '">', x = 0;
      t.split("").forEach(function (c) {
        if (c === "|") { s += '<rect class="v" x="' + x * U + '" y="0" width="' + U + '" height="' + 2 * U + '" rx="2"/>'; x += 1; }
        else { s += '<rect class="h" x="' + x * U + '" y="0" width="' + 2 * U + '" height="' + U + '" rx="2"/><rect class="h" x="' + x * U + '" y="' + U + '" width="' + 2 * U + '" height="' + U + '" rx="2"/>'; x += 2; }
      });
      return s + "</svg>";
    }
    function render() {
      var n = st.n, all = tilings(n), v = all.filter(function (t) { return t.slice(-1) === "|"; }), h = all.filter(function (t) { return t.slice(-1) === "="; });
      var counts = [1, 1]; for (var i = 2; i <= 8; i++) counts.push(counts[i - 1] + counts[i - 2]);
      var html = '<div class="si-ctl">' + '<div class="lap-chips si-pre">' + [1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<button type="button" class="lap-chip' + (k === n ? " on" : "") + '" data-v="' + k + '">n = ' + k + "</button>"; }).join("") + "</div></div>";
      html += '<p class="lap-note">กระดาน 2 × ' + n + " ปูด้วยโดมิโน 1 × 2 ได้ <b>" + all.length + "</b> แบบ = T(" + (n - 1) + ") + T(" + (n - 2 < 0 ? 0 : n - 2) + ")</p>";
      html += '<div class="si-tgroups"><div><p class="si-th">ชิ้นท้ายเป็นโดมิโนตั้ง (เหลือกระดาน 2 × ' + (n - 1) + ") · " + v.length + ' แบบ</p><div class="si-tiles">' + v.map(function (t) { return svgOf(t, n); }).join("") + "</div></div>" +
        (n >= 2 ? '<div><p class="si-th">ชิ้นท้ายเป็นโดมิโนนอนสองชิ้น (เหลือ 2 × ' + (n - 2) + ") · " + h.length + ' แบบ</p><div class="si-tiles">' + h.map(function (t) { return svgOf(t, n); }).join("") + "</div></div>" : "") + "</div>";
      html += '<p class="lap-help">' + rich("จึงได้ \\(T(n) = T(n-1) + T(n-2)\\) โดย \\(T(1) = 1,\\ T(2) = 2\\) ⇒ \\(T(n) = F_{n+1}\\): 1, 2, 3, 5, 8, 13, 21, … พิสูจน์สูตรด้วยอุปนัยแบบเข้มที่มีกรณีฐานสองตัว") + "</p>";
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) { var v = e.target.closest("[data-v]"); if (v) { st.n = +v.getAttribute("data-v"); render(); } });
    render();
  }

  // ======================================================================= 8. bounds aₙ ≤ C·rⁿ
  var BD = {
    fib: { l: "ฟีโบนัชชี", c: [1, 1], init: [1, 1], n0: 1, name: "F_n" },
    trib: { l: "ไตรโบนัชชี", c: [1, 1, 1], init: [1, 1, 1], n0: 1, name: "T_n" },
    a12: { l: "aₙ = aₙ₋₁ + 2aₙ₋₂", c: [1, 2], init: [1, 5], n0: 1, name: "a_n" },
    a201: { l: "aₙ = 2aₙ₋₁ + aₙ₋₃", c: [2, 0, 1], init: [1, 2, 3], n0: 1, name: "a_n" }
  };
  function initBound(box) {
    var st = { pre: box.dataset.preset || "fib", r: 2 };
    function render() {
      var P = BD[st.pre], k = P.c.length, rstar = dominantRoot(P.c), r = st.r;
      var a = P.init.slice(); while (a.length < 26) { var v = 0; for (var j = 1; j <= k; j++) v += P.c[j - 1] * a[a.length - j]; a.push(v); }
      var C = 0; for (var i = 0; i < k; i++) C = Math.max(C, a[i] / Math.pow(r, P.n0 + i));
      var sum = 0; P.c.forEach(function (ci, j) { sum += ci * Math.pow(r, -(j + 1)); });
      var stepOK = sum <= 1 + 1e-12;
      var recT = P.c.map(function (ci, j) { return ci ? (ci === 1 ? "" : ci) + "a_{n-" + (j + 1) + "}" : null; }).filter(Boolean).join(" + ");
      var html = '<div class="lap-chips si-pre">' + Object.keys(BD).map(function (key) { return '<button type="button" class="lap-chip' + (key === st.pre ? " on" : "") + '" data-p="' + key + '">' + BD[key].l + "</button>"; }).join("") + "</div>" +
        '<label class="lap-row cl-sl"><span class="lap-lbl">ฐาน r =</span><input type="range" min="1.05" max="3" step="0.01" value="' + r + '" data-k="r"><output>' + r.toFixed(2) + "</output></label>";
      html += '<div class="lap-ans"><div class="lap-eq">' + T("\\text{อ้างว่า } a_n \\le C\\,r^{n} = " + C.toPrecision(4) + "\\cdot " + r.toFixed(2) + "^{n}\\ \\ \\text{ทุก } n \\ge " + P.n0, true) + "</div>";
      html += "<p>" + flag(true, "กรณีฐาน") + " เลือก C เล็กที่สุดที่ครอบคลุม " + range(P.n0, P.n0 + k - 1).map(function (n) { return "a" + n; }).join(", ") + " เสมอ</p>";
      html += "<p>" + flag(stepOK, stepOK ? "ขั้นอุปนัยผ่าน" : "ขั้นอุปนัยไม่ผ่าน") + " " + T("a_n = " + recT + " \\le C r^{n}\\left(" + P.c.map(function (ci, j) { return ci ? (ci === 1 ? "" : ci) + "r^{-" + (j + 1) + "}" : null; }).filter(Boolean).join(" + ") + "\\right) = C r^n \\cdot " + sum.toFixed(4)) + " ต้องการ ≤ " + T("C r^n") + " จึงต้องมี " + T("\\textstyle\\sum c_i r^{-i} \\le 1") + "</p>";
      html += '<p class="lap-note">ขอบเขตต่ำสุดของ r ที่ขั้นอุปนัยผ่านคือรากใหญ่สุดของสมการลักษณะเฉพาะ ' + T("r^* \\approx " + rstar.toFixed(6)) + (st.pre === "fib" ? " = φ (อัตราส่วนทองคำ)" : "") + " · r ต่ำกว่านี้ ขั้นอุปนัยพังทันที ไม่ว่า C จะใหญ่แค่ไหน</p></div>";
      // log plot
      var Wd = 340, Ht = 160, N = 24, ymax = Math.log10(Math.max(a[N - 1], C * Math.pow(r, N))) * 1.02, ymin = 0;
      var X = function (n) { return 28 + (n - 1) / (N - 1) * (Wd - 36); }, Y = function (v) { return Ht - 18 - (Math.log10(Math.max(v, 1e-9)) - ymin) / (ymax - ymin) * (Ht - 30); };
      var pa = "", pb = "";
      for (var n = 1; n <= N; n++) { pa += (n === 1 ? "M" : "L") + X(n).toFixed(1) + "," + Y(a[n - P.n0]).toFixed(1); pb += (n === 1 ? "M" : "L") + X(n).toFixed(1) + "," + Y(C * Math.pow(r, n)).toFixed(1); }
      var svg = '<svg class="mk-plot si-bplot" viewBox="0 0 ' + Wd + " " + Ht + '" role="img" aria-label="log plot"><line class="mk-axis" x1="28" y1="' + (Ht - 18) + '" x2="' + (Wd - 6) + '" y2="' + (Ht - 18) + '"/><line class="mk-axis" x1="28" y1="8" x2="28" y2="' + (Ht - 18) + '"/>' +
        '<path d="' + pb + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/><path d="' + pa + '" fill="none" stroke="var(--signal)" stroke-width="2.2"/>' +
        '<text class="mk-lab" x="32" y="16">log₁₀ (สเกลลอการิทึม)</text><text class="mk-lab" x="' + (Wd - 8) + '" y="' + (Ht - 4) + '" text-anchor="end">n = ' + N + "</text></svg>";
      html += svg + '<p class="lap-help"><span class="lap-key k2"></span> C·rⁿ (เส้นประ) · <span class="lap-key" style="border-top-color:var(--signal)"></span> ' + T(P.name) + " จริง · " + (stepOK ? "เส้นจริงอยู่ใต้เส้นประตลอด" : "เส้นจริงโตเร็วกว่า สุดท้ายจะข้ามเส้นประ") + "</p>";
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) { var p = e.target.closest("[data-p]"); if (p) { st.pre = p.getAttribute("data-p"); render(); } });
    box.addEventListener("input", function (e) { if (e.target.getAttribute("data-k") === "r") { st.r = +e.target.value; render(); var r = box.querySelector('[data-k="r"]'); if (r) r.focus(); } });
    box._set = function (o) { if (o.preset) st.pre = o.preset; if (o.r) st.r = o.r; render(); };
    render();
  }

  // ======================================================================= 9. proof builder
  var ORDER = {
    stamps: { l: "แสตมป์ 3 กับ 5", claim: "ทุกราคา \\(n \\ge 8\\) บาท รวมได้ด้วยแสตมป์ 3 และ 5 บาท", lines: [
      "ให้ \\(P(n)\\): ราคา n บาทรวมได้ด้วยแสตมป์ 3 และ 5 บาท",
      "กรณีฐาน: \\(8 = 3 + 5,\\ 9 = 3 + 3 + 3,\\ 10 = 5 + 5\\)",
      "ให้ \\(n \\ge 11\\) และสมมติ \\(P(j)\\) จริงทุก \\(8 \\le j \\le n - 1\\)",
      "เพราะ \\(8 \\le n - 3 \\le n - 1\\) จึงได้ \\(P(n - 3)\\) จากสมมติฐาน",
      "เติมแสตมป์ 3 บาทอีกหนึ่งดวง ได้ราคา n บาท ⇒ \\(P(n)\\) จริง",
      "โดยหลักอุปนัยแบบเข้ม \\(P(n)\\) จริงทุก \\(n \\ge 8\\) ∎"], decoy: "ให้ \\(n \\ge 9\\) และสมมติ \\(P(n-1)\\) จริงเพียงตัวเดียว" },
    primes: { l: "ผลคูณจำนวนเฉพาะ", claim: "จำนวนเต็ม \\(n \\ge 2\\) ทุกตัวเขียนเป็นผลคูณของจำนวนเฉพาะได้", lines: [
      "ให้ \\(P(n)\\): n เขียนเป็นผลคูณของจำนวนเฉพาะได้",
      "กรณีฐาน: \\(n = 2\\) เป็นจำนวนเฉพาะ จึงเป็นผลคูณของจำนวนเฉพาะหนึ่งตัว",
      "ให้ \\(n \\ge 3\\) และสมมติ \\(P(j)\\) จริงทุก \\(2 \\le j < n\\)",
      "ถ้า n เป็นจำนวนเฉพาะ \\(P(n)\\) จริงทันที",
      "ถ้า n ไม่เป็นจำนวนเฉพาะ \\(n = ab\\) โดย \\(2 \\le a, b < n\\) จึงมี \\(P(a)\\) และ \\(P(b)\\)",
      "นำผลคูณจำนวนเฉพาะของ a และ b มาคูณกัน ได้ผลคูณจำนวนเฉพาะของ n ⇒ \\(P(n)\\) ∎"], decoy: "เพราะ \\(n - 1 < n\\) จึงใช้ \\(P(n - 1)\\) แล้วคูณด้วย n" },
    fib: { l: "Fₙ < 2ⁿ", claim: "\\(F_1 = F_2 = 1,\\ F_n = F_{n-1} + F_{n-2}\\) แสดงว่า \\(F_n < 2^n\\) ทุก \\(n \\ge 1\\)", lines: [
      "ให้ \\(P(n)\\): \\(F_n < 2^n\\)",
      "กรณีฐาน: \\(F_1 = 1 < 2\\) และ \\(F_2 = 1 < 4\\)",
      "ให้ \\(n \\ge 3\\) และสมมติ \\(P(j)\\) จริงทุก \\(1 \\le j \\le n-1\\)",
      "\\(F_n = F_{n-1} + F_{n-2} < 2^{n-1} + 2^{n-2}\\)",
      "\\(2^{n-1} + 2^{n-2} = 3\\cdot 2^{n-2} < 4 \\cdot 2^{n-2} = 2^n\\) ⇒ \\(P(n)\\)",
      "โดยหลักอุปนัยแบบเข้ม \\(F_n < 2^n\\) ทุก \\(n \\ge 1\\) ∎"], decoy: "กรณีฐาน: \\(F_1 = 1 < 2\\) เพียงกรณีเดียวก็พอ" },
    rec: { l: "aₙ = 2ⁿ + (−1)ⁿ", claim: "\\(a_1 = 1,\\ a_2 = 5,\\ a_n = a_{n-1} + 2a_{n-2}\\) แสดงว่า \\(a_n = 2^n + (-1)^n\\)", lines: [
      "ให้ \\(P(n)\\): \\(a_n = 2^n + (-1)^n\\)",
      "กรณีฐาน: \\(a_1 = 2 - 1 = 1\\) และ \\(a_2 = 4 + 1 = 5\\) ✓",
      "ให้ \\(n \\ge 3\\) และสมมติ \\(P(n-1)\\) และ \\(P(n-2)\\) จริง",
      "\\(a_n = \\big(2^{n-1} + (-1)^{n-1}\\big) + 2\\big(2^{n-2} + (-1)^{n-2}\\big)\\)",
      "\\(= 2^{n-1} + 2^{n-1} + (-1)^{n-2}\\big(-1 + 2\\big) = 2^n + (-1)^n\\)",
      "ดังนั้น \\(P(n)\\) จริงทุก \\(n \\ge 1\\) ∎"], decoy: "\\(a_n = 2a_{n-1}\\) ดังนั้น \\(a_n = 2^n\\)" },
    choc: { l: "หักช็อกโกแลต", claim: "แท่งช็อกโกแลต m × n ต้องหัก \\(mn - 1\\) ครั้งพอดีจึงได้ชิ้นเล็กทั้งหมด (หักทีละชิ้น)", lines: [
      "ให้ \\(P(k)\\): แท่งที่มี k ช่องต้องหัก \\(k - 1\\) ครั้งเสมอ",
      "กรณีฐาน: \\(k = 1\\) ไม่ต้องหักเลย \\(0 = 1 - 1\\)",
      "ให้ \\(k \\ge 2\\) และสมมติ \\(P(j)\\) จริงทุก \\(1 \\le j < k\\)",
      "การหักครั้งแรกแบ่งเป็นสองชิ้นขนาด \\(p\\) และ \\(q\\) ช่อง โดย \\(p + q = k,\\ 1 \\le p, q < k\\)",
      "จากสมมติฐาน ชิ้นแรกต้องหัก \\(p - 1\\) และชิ้นที่สอง \\(q - 1\\) ครั้ง รวม \\(1 + (p-1) + (q-1) = k - 1\\)",
      "ดังนั้น \\(P(k)\\) จริงทุก k และแท่ง m × n ใช้ \\(mn - 1\\) ครั้ง ∎"], decoy: "สมมติ \\(P(k-1)\\) แล้วหักออกทีละหนึ่งช่องเสมอ" }
  };
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function initOrder(box) {
    var st = { pre: box.dataset.preset || "stamps", pool: [], chosen: [], checked: null };
    function reset() {
      var P = ORDER[st.pre];
      var items = P.lines.map(function (l, i) { return { t: l, i: i }; }).concat([{ t: P.decoy, i: -1 }]);
      st.pool = shuffle(items); st.chosen = []; st.checked = null; render();
    }
    function render() {
      var P = ORDER[st.pre];
      var html = chipRow(Object.keys(ORDER).map(function (k) { return [k, ORDER[k].l]; }), "data-p", st.pre) +
        '<p class="fl-claim"><b>พิสูจน์ว่า</b> ' + rich(P.claim) + '</p><p class="lap-help">แตะบรรทัดด้านล่างเรียงตามลำดับที่ถูกต้อง มี <b>บรรทัดหลอก 1 บรรทัด</b> ที่ไม่ควรใช้ แตะบรรทัดในบทพิสูจน์เพื่อนำออก</p>';
      html += '<div class="si-ord"><p class="si-th">บทพิสูจน์ของคุณ (' + st.chosen.length + "/" + P.lines.length + ')</p><ol class="si-chosen">' + st.chosen.map(function (it, k) {
        var cls = st.checked ? (it.i === k ? " ok" : " bad") : "";
        return '<li><button type="button" class="fl-line' + cls + '" data-back="' + k + '">' + rich(it.t) + "</button></li>";
      }).join("") + (st.chosen.length ? "" : '<li class="si-empty">ยังไม่มีบรรทัด</li>') + "</ol>";
      html += '<p class="si-th">บรรทัดที่เหลือ</p><div class="si-pool">' + st.pool.map(function (it, k) { return '<button type="button" class="fl-line" data-pick="' + k + '">' + rich(it.t) + "</button>"; }).join("") + "</div></div>";
      html += '<div class="sc-act"><button type="button" class="btn btn-primary btn-sm" data-check' + (st.chosen.length === P.lines.length ? "" : " disabled") + '>ตรวจ</button><button type="button" class="btn btn-ghost btn-sm" data-reset>↺ สุ่มใหม่</button></div>';
      if (st.checked) {
        var ok = st.chosen.every(function (it, k) { return it.i === k; });
        var usedDecoy = st.chosen.some(function (it) { return it.i === -1; });
        html += ok ? '<p class="sc-ok">✓ เรียงถูกต้องครบทุกบรรทัด</p>' : '<p class="sc-no">✗ ' + (usedDecoy ? "มีบรรทัดหลอกปนอยู่: “" + rich(P.decoy) + "” ใช้ไม่ได้" : "ลำดับยังไม่ถูก บรรทัดสีแดงอยู่ผิดตำแหน่ง") + "</p>";
      }
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) {
      var p = e.target.closest("[data-p]"); if (p) { st.pre = p.getAttribute("data-p"); reset(); return; }
      var k = e.target.closest("[data-pick]"); if (k) { var it = st.pool.splice(+k.getAttribute("data-pick"), 1)[0]; st.chosen.push(it); st.checked = null; render(); return; }
      var b = e.target.closest("[data-back]"); if (b) { var it2 = st.chosen.splice(+b.getAttribute("data-back"), 1)[0]; st.pool.push(it2); st.checked = null; render(); return; }
      if (e.target.closest("[data-check]")) { st.checked = true; render(); return; }
      if (e.target.closest("[data-reset]")) reset();
    });
    box._set = function (o) { if (o.preset) { st.pre = o.preset; reset(); } };
    reset();
  }

  // ======================================================================= 10. find the flaw
  var FLAWS = {
    power: { l: "aⁿ = 1 ทุก n", claim: "ถ้า \\(a \\ne 0\\) แล้ว \\(a^n = 1\\) ทุก \\(n \\ge 0\\)", lines: [
      "กรณีฐาน: \\(a^0 = 1\\) จริง",
      "สมมติว่า \\(a^j = 1\\) ทุก \\(0 \\le j \\le k\\)",
      "\\(a^{k+1} = \\dfrac{a^k \\cdot a^k}{a^{k-1}} = \\dfrac{1 \\cdot 1}{1} = 1\\)",
      "ดังนั้น \\(a^n = 1\\) ทุก n"], bad: 2, why: "เมื่อ \\(k = 0\\) สูตรใช้ \\(a^{k-1} = a^{-1}\\) ซึ่งไม่อยู่ในสมมติฐาน (ครอบคลุมแค่ \\(j \\ge 0\\)) ขั้นอุปนัยจึงใช้ไม่ได้ที่ k = 0 และพังตั้งแต่ \\(a^1\\) ต้องมีกรณีฐาน \\(a^1 = 1\\) ด้วย ซึ่งเป็นเท็จ" },
    fibeven: { l: "Fₙ เป็นเลขคู่ทุกตัว", claim: "\\(F_0 = 0,\\ F_1 = 1,\\ F_n = F_{n-1} + F_{n-2}\\) ทุก \\(F_n\\) เป็นเลขคู่", lines: [
      "กรณีฐาน: \\(F_0 = 0\\) เป็นเลขคู่",
      "สมมติว่า \\(F_j\\) เป็นเลขคู่ทุก \\(0 \\le j < n\\)",
      "\\(F_n = F_{n-1} + F_{n-2}\\) เป็นผลบวกของเลขคู่สองจำนวน จึงเป็นเลขคู่",
      "ดังนั้น \\(F_n\\) เป็นเลขคู่ทุก n"], bad: 2, why: "ขั้นอุปนัยใช้ \\(F_{n-2}\\) จึงใช้ได้ตั้งแต่ \\(n \\ge 2\\) เท่านั้น สำหรับ \\(n = 1\\) ไม่มี \\(F_{-1}\\) ต้องตรวจ \\(F_1\\) เป็นกรณีฐานที่สอง ซึ่ง \\(F_1 = 1\\) เป็นเลขคี่ ข้อความจึงเท็จ" },
    stamps: { l: "แสตมป์ กรณีฐานไม่พอ", claim: "ทุกราคา \\(n \\ge 8\\) บาทรวมได้ด้วยแสตมป์ 3 และ 5 บาท", lines: [
      "กรณีฐาน: \\(8 = 3 + 5\\) และ \\(9 = 3 + 3 + 3\\)",
      "ให้ \\(n \\ge 10\\) และสมมติ \\(P(j)\\) จริงทุก \\(8 \\le j < n\\)",
      "\\(P(n - 3)\\) จริงตามสมมติฐาน เติมแสตมป์ 3 บาทได้ n บาท",
      "ดังนั้นรวมได้ทุก \\(n \\ge 8\\)"], bad: 2, why: "เมื่อ \\(n = 10\\) ต้องใช้ \\(P(7)\\) ซึ่งไม่อยู่ในช่วง \\(8 \\le j\\) (และ 7 บาทรวมไม่ได้จริง) ขั้นอุปนัยย้อนกลับ 3 ขั้น จึงต้องมีกรณีฐาน 3 ตัว: 8, 9 และ \\(10 = 5 + 5\\) ข้อความจริง แต่บทพิสูจน์นี้ไม่สมบูรณ์" },
    primes: { l: "ทุกจำนวนเป็นจำนวนเฉพาะ", claim: "จำนวนเต็ม \\(n \\ge 2\\) ทุกตัวเป็นจำนวนเฉพาะ", lines: [
      "กรณีฐาน: 2 เป็นจำนวนเฉพาะ",
      "สมมติว่า j เป็นจำนวนเฉพาะทุก \\(2 \\le j < n\\)",
      "ถ้า n ไม่เป็นจำนวนเฉพาะ \\(n = ab\\) โดย \\(a, b < n\\) จึงเป็นจำนวนเฉพาะทั้งคู่ ดังนั้น n เป็นจำนวนเฉพาะ",
      "ดังนั้นทุก n เป็นจำนวนเฉพาะ"], bad: 2, why: "ข้อสรุป “ผลคูณของจำนวนเฉพาะสองตัวเป็นจำนวนเฉพาะ” ผิด (เช่น \\(2\\cdot 2 = 4\\)) การใช้สมมติฐานอุปนัยถูกต้อง แต่ตรรกะจากสมมติฐานไปสู่ \\(P(n)\\) ไม่จริง เป็นความผิดพลาดที่เกิดได้แม้โครงสร้างอุปนัยครบ" },
    allsame: { l: "ทุกจำนวนเท่ากัน", claim: "สำหรับจำนวนนับ \\(a, b\\) ใดๆ ที่ \\(\\max(a, b) = n\\) จะได้ \\(a = b\\)", lines: [
      "กรณีฐาน \\(n = 1\\): \\(\\max(a, b) = 1\\) ⇒ \\(a = b = 1\\)",
      "สมมติข้อความจริงทุก \\(\\max\\) ที่น้อยกว่า n",
      "ถ้า \\(\\max(a, b) = n\\) แล้ว \\(\\max(a-1, b-1) = n - 1\\) จึงได้ \\(a - 1 = b - 1\\)",
      "ดังนั้น \\(a = b\\) เสมอ"], bad: 2, why: "ถ้า \\(a = 1\\) หรือ \\(b = 1\\) แล้ว \\(a - 1 = 0\\) ไม่ใช่จำนวนนับ จึงอยู่นอกโดเมนของข้อความ สมมติฐานอุปนัยใช้กับคู่ \\((a-1, b-1)\\) ไม่ได้ เช่น \\(a = 1, b = 2\\)" }
  };
  function initFlaw(box) {
    var st = { pre: box.dataset.preset || "power", pick: null };
    function render() {
      var P = FLAWS[st.pre];
      var html = chipRow(Object.keys(FLAWS).map(function (k) { return [k, FLAWS[k].l]; }), "data-p", st.pre) + '<p class="fl-claim"><b>ข้อความ:</b> ' + rich(P.claim) + '</p><p class="lap-help">“บทพิสูจน์” ด้านล่างผิดหนึ่งบรรทัด แตะบรรทัดที่คิดว่าผิด</p><ol class="fl-lines">';
      P.lines.forEach(function (l, i) { var cls = st.pick === null ? "" : i === P.bad ? " bad" : i === st.pick ? " wrong" : ""; html += '<li><button type="button" class="fl-line' + cls + '" data-i="' + i + '">' + rich(l) + "</button></li>"; });
      html += "</ol>";
      if (st.pick !== null) html += '<div class="fl-why ' + (st.pick === P.bad ? "ok" : "no") + '"><b>' + (st.pick === P.bad ? "ถูกต้อง! " : "ยังไม่ใช่ บรรทัดที่ผิดคือบรรทัดที่ " + (P.bad + 1) + " · ") + "</b>" + rich(P.why) + '</div><button type="button" class="btn btn-ghost btn-sm" data-again>↺ ลองใหม่</button>';
      box.innerHTML = html;
    }
    box.addEventListener("click", function (e) {
      var p = e.target.closest("[data-p]"); if (p) { st.pre = p.getAttribute("data-p"); st.pick = null; render(); return; }
      var l = e.target.closest("[data-i]"); if (l && st.pick === null) { st.pick = +l.getAttribute("data-i"); render(); return; }
      if (e.target.closest("[data-again]")) { st.pick = null; render(); }
    });
    box._set = function (o) { if (o.preset) st.pre = o.preset; st.pick = null; render(); };
    render();
  }

  // ======================================================================= boot
  var INIT = { "si-deps": initDeps, "si-stamps": initStamps, "si-fact": initFact, "si-choc": initChoc, "si-nim": initNim, "si-rep": initRep, "si-tile": initTile, "si-bound": initBound, "si-order": initOrder, "si-flaw": initFlaw };
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls).forEach(function (box) {
        if (box.__si) return; box.__si = true;
        box.classList.add("cl-lab", "si-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">เครื่องมือโหลดไม่สำเร็จ: ' + esc(e.message) + "</p>"; if (root.console) console.error(e); }
      });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-si-set]"); if (!b) return;
      var id = b.getAttribute("data-si-target"), box = id ? document.getElementById(id) : null;
      if (box && box._set) { box._set(JSON.parse(b.getAttribute("data-si-set"))); box.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
