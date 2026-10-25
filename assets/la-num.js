/* Linear algebra labs for the rank (7.10), numerical-methods (7.11) and exam-practice (7.12) pages.
   No dependencies; uses window.MK (assets/mathkit.js) for plots and window.katex for TeX when present.
   window.LANum in the browser, module.exports in Node (pure functions are tested by scripts/test-la-num.mjs).
   Widgets (the page writes an empty div, this file fills it):
     <div class="ln-rank" data-m="1,2,-1;2,3,1;3,5,0" [data-aug]>     rank explorer: exact REF/RREF, pivots, bases, Rouché–Capelli
     <div class="ln-krank" data-p="sym|vdm|hom|sys">                 rank and det as the parameter k moves
     <div class="ln-planes" data-p="unique|line|prism|par|same|ab">  three planes in 3-D (drag to rotate)
     <div class="ln-pivot" data-p="eps|zero">                        round-off: Gaussian elimination with/without partial pivoting
     <div class="ln-lu" data-a="1,2,4;3,8,14;2,6,13" data-b="3,13,4" data-mode="lu|plu|chol">  LU / PA=LU / Cholesky with steps
     <div class="ln-iter" data-p="bf3|c3|g2|g2bad|tri10">             Jacobi · Gauss–Seidel · SOR simulator
     <div class="ln-cond">                                           condition number: nearly parallel lines + Hilbert table
     <div class="ln-heat">                                           Laplace equation on a plate solved by relaxation
     <div class="ln-drill">                                          random exam problems with checking and solutions
   A button <button data-ln-set='{"p":"tri10","method":"sor"}' data-ln-target="lab-id"> loads a setting into a widget. */
(function (root) {
  "use strict";
  var inBrowser = typeof document !== "undefined";
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var MINUS = "−";
  var SUB = "₀₁₂₃₄₅₆₇₈₉";
  var sub = function (n) { return String(n).replace(/\d/g, function (d) { return SUB[+d]; }); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var MK = function () { return root.MK; };

  function tex(src, display) {
    if (root.katex) { try { return root.katex.renderToString(src, { displayMode: !!display, throwOnError: false, strict: "ignore" }); } catch (e) { /* fall through */ } }
    return "<code>" + esc(src) + "</code>";
  }
  function flag(ok, text) { return '<span class="lap-flag ' + (ok ? "ok" : "no") + '">' + text + "</span>"; }
  function chips(items, attr, cur, cls) {
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
  // fit a plot to the widget so its 10–11 px labels stay readable on phones (viewBox ≈ CSS pixels)
  function plotIn(box, o) {
    var cw = box && box.clientWidth ? box.clientWidth - 26 : o.w, w = Math.round(Math.max(290, Math.min(o.w, cw)));
    if (w < o.w) { o.h = Math.round(Math.max(o.h * w / o.w, Math.min(o.h, w * 0.72))); o.w = w; }
    return MK().plot(o);
  }
  function fmt(x, s) {
    if (!isFinite(x)) return isNaN(x) ? "—" : (x > 0 ? "∞" : MINUS + "∞");
    if (Math.abs(x) < 1e-14) return "0";
    var a = Math.abs(x), out;
    if (a >= 1e6 || a < 1e-4) {
      var p = x.toExponential(Math.min((s || 4) - 1, 4)).split("e"), m = String(+p[0]);
      out = m + "×10" + String(+p[1]).replace(/-/g, "⁻").replace(/\d/g, function (dg) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+dg]; });
    } else out = String(+x.toPrecision(s || 6));
    return out.replace(/^-/, MINUS);
  }
  function p10(v) { return "10" + ("−" + v).replace(/\d/g, function (dg) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+dg]; }).replace("−", "⁻"); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ======================================================================= exact fractions (BigInt)
  function bgcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { var t = a % b; a = b; b = t; } return a; }
  function Q(n, d) {
    if (!(this instanceof Q)) return new Q(n, d);
    n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
    if (d === 0n) throw new Error("หารด้วยศูนย์");
    if (d < 0n) { n = -n; d = -d; }
    var g = bgcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  Q.prototype = {
    add: function (o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); },
    sub: function (o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); },
    mul: function (o) { return new Q(this.n * o.n, this.d * o.d); },
    div: function (o) { return new Q(this.n * o.d, this.d * o.n); },
    neg: function () { return new Q(-this.n, this.d); },
    abs: function () { return new Q(this.n < 0n ? -this.n : this.n, this.d); },
    isZero: function () { return this.n === 0n; },
    isOne: function () { return this.n === 1n && this.d === 1n; },
    isInt: function () { return this.d === 1n; },
    sign: function () { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; },
    eq: function (o) { return this.n === o.n && this.d === o.d; },
    num: function () { return Number(this.n) / Number(this.d); },
    str: function () { var s = this.d === 1n ? String(this.n) : this.n + "/" + this.d; return s.replace("-", MINUS); },
    tex: function () { if (this.d === 1n) return String(this.n); return (this.n < 0n ? "-" : "") + "\\tfrac{" + (this.n < 0n ? -this.n : this.n) + "}{" + this.d + "}"; },
    html: function () {
      if (this.d === 1n) return String(this.n).replace("-", MINUS);
      return (this.n < 0n ? MINUS : "") + '<span class="fr"><i>' + (this.n < 0n ? -this.n : this.n) + "</i><i>" + this.d + "</i></span>";
    }
  };
  var ZERO = new Q(0), ONE = new Q(1);
  function qi(k) { return new Q(BigInt(k)); }
  function parseQ(s) {
    s = String(s).trim().replace(/−/g, "-").replace(/\s+/g, "");
    if (!s) throw new Error("ช่องว่าง");
    var m;
    if ((m = /^([+-]?\d+)\/([+-]?\d+)$/.exec(s))) return new Q(BigInt(m[1]), BigInt(m[2]));
    if ((m = /^([+-]?)(\d*)\.(\d+)$/.exec(s))) { var dd = 10n ** BigInt(m[3].length); var nn = BigInt((m[2] || "0") + m[3]); return new Q(m[1] === "-" ? -nn : nn, dd); }
    if (/^[+-]?\d+$/.test(s)) return new Q(BigInt(s));
    throw new Error("อ่านค่า “" + s + "” ไม่ได้ (ใช้จำนวนเต็ม ทศนิยม หรือเศษส่วน เช่น 3/4)");
  }
  function parseMatrix(text) {
    var rows = String(text).trim().split(/\s*[;\n]\s*/).filter(Boolean).map(function (r) { return r.trim().split(/[\s,]+/).filter(Boolean).map(parseQ); });
    if (!rows.length) throw new Error("ยังไม่ได้ใส่เมทริกซ์");
    var n = rows[0].length;
    rows.forEach(function (r, i) { if (r.length !== n) throw new Error("แถวที่ " + (i + 1) + " มี " + r.length + " ตัว แต่แถวแรกมี " + n + " ตัว"); });
    return rows;
  }
  function clone(M) { return M.map(function (r) { return r.slice(); }); }
  function matText(M) { return M.map(function (r) { return r.map(function (v) { return v.str().replace(MINUS, "-"); }).join(", "); }).join("\n"); }
  function mxHtml(M, opt) {
    opt = opt || {};
    var cols = M[0].length, h = "", pv = {};
    (opt.piv || []).forEach(function (p) { pv[p[0] + "," + p[1]] = 1; });
    M.forEach(function (row, i) {
      var zr = opt.dimZero && row.every(function (v) { return typeof v !== "string" && v.isZero(); });
      row.forEach(function (v, j) {
        var cls = [];
        if (opt.bar != null && j === opt.bar) cls.push("sep");
        if (pv[i + "," + j]) cls.push("pv");
        if (zr) cls.push("zr");
        if (opt.hlRow != null && opt.hlRow === i) cls.push("hr");
        h += "<span" + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ">" + (typeof v === "string" ? v : v.html()) + "</span>";
      });
    });
    return '<div class="mxv" style="--c:' + cols + '">' + h + "</div>";
  }
  function rowName(i) { return "R" + sub(i + 1); }
  function opSwap(i, j) { return rowName(i) + " ↔ " + rowName(j); }
  function opAdd(i, k, j) { // R_i ← R_i + k R_j
    var mag = k.abs(), m = mag.isOne() ? "" : mag.isInt() ? mag.str() : "(" + mag.str() + ")";
    return rowName(i) + " ← " + rowName(i) + (k.sign() < 0 ? " " + MINUS + " " : " + ") + m + rowName(j);
  }
  function opScale(k, i) { var t = k.eq(ONE.neg()) ? MINUS : k.isInt() ? k.str() : "(" + k.str() + ")"; return rowName(i) + " ← " + t + rowName(i); }

  // row echelon form by Gaussian elimination (exact); pivots may be searched in the first `lim` columns only
  function ref(M0) {
    var M = clone(M0), m = M.length, n = M[0].length, r = 0, steps = [], piv = [];
    for (var c = 0; c < n && r < m; c++) {
      var p = -1, i;
      for (i = r; i < m; i++) if (!M[i][c].isZero() && M[i][c].abs().isOne()) { p = i; break; }
      if (p < 0) for (i = r; i < m; i++) if (!M[i][c].isZero()) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) { var t = M[p]; M[p] = M[r]; M[r] = t; steps.push({ ops: [opSwap(r, p)], M: clone(M), piv: piv.concat([[r, c]]) }); }
      var ops = [];
      for (i = r + 1; i < m; i++) {
        if (M[i][c].isZero()) continue;
        var f = M[i][c].div(M[r][c]);
        M[i] = M[i].map(function (v, j) { return v.sub(f.mul(M[r][j])); });
        ops.push(opAdd(i, f.neg(), r));
      }
      piv.push([r, c]);
      if (ops.length) steps.push({ ops: ops, M: clone(M), piv: piv.slice() });
      r++;
    }
    return { M: M, steps: steps, piv: piv, rank: r };
  }
  function rrefFrom(R) { // R in echelon form with pivots → reduced form
    var M = clone(R.M), steps = [];
    for (var q = R.piv.length - 1; q >= 0; q--) {
      var r = R.piv[q][0], c = R.piv[q][1], ops = [];
      if (!M[r][c].isOne()) { var k = ONE.div(M[r][c]); M[r] = M[r].map(function (v) { return v.mul(k); }); ops.push(opScale(k, r)); }
      for (var i = 0; i < r; i++) {
        if (M[i][c].isZero()) continue;
        var f = M[i][c];
        M[i] = M[i].map(function (v, j) { return v.sub(f.mul(M[r][j])); });
        ops.push(opAdd(i, f.neg(), r));
      }
      if (ops.length) steps.push({ ops: ops, M: clone(M), piv: R.piv });
    }
    return { M: M, steps: steps, piv: R.piv };
  }
  function rankOf(M) { return ref(M).rank; }
  function detQ(A) {
    var M = clone(A), n = M.length, d = ONE;
    for (var c = 0; c < n; c++) {
      var p = -1;
      for (var i = c; i < n; i++) if (!M[i][c].isZero()) { p = i; break; }
      if (p < 0) return ZERO;
      if (p !== c) { var t = M[p]; M[p] = M[c]; M[c] = t; d = d.neg(); }
      d = d.mul(M[c][c]);
      for (i = c + 1; i < n; i++) {
        if (M[i][c].isZero()) continue;
        var f = M[i][c].div(M[c][c]);
        for (var j = c; j < n; j++) M[i][j] = M[i][j].sub(f.mul(M[c][j]));
      }
    }
    return d;
  }
  function invQ(A) {
    var n = A.length, M = A.map(function (r, i) { return r.concat(A.map(function (_, j) { return i === j ? ONE : ZERO; })); });
    var R = rrefFrom(ref(M));
    if (R.piv.length < n || R.piv[n - 1][1] >= n) return null;
    return R.M.map(function (r) { return r.slice(n); });
  }
  function lcmBig(a, b) { return a / bgcd(a, b) * b; }
  function intVec(v) { // scale a rational vector to coprime integers (direction only)
    var L = 1n; v.forEach(function (x) { L = lcmBig(L, x.d); });
    var w = v.map(function (x) { return x.n * (L / x.d); }), g = 0n;
    w.forEach(function (x) { g = bgcd(g, x); });
    if (g > 1n) w = w.map(function (x) { return x / g; });
    return w.map(function (x) { return new Q(x); });
  }
  function colHtml(v) { return mxHtml(v.map(function (x) { return [x]; })); }

  // ======================================================================= 1. rank explorer
  var RANK_PRE = [
    { id: "r1", l: "3×3 แรงก์ 2", m: "1,2,-1;2,3,1;3,5,0" },
    { id: "r2", l: "3×4 แรงก์ 2", m: "1,2,0,3;2,4,1,7;-1,-2,2,-1" },
    { id: "r3", l: "4×4 แรงก์ 3", m: "1,1,1,1;1,2,3,4;1,3,6,10;2,3,4,5" },
    { id: "r4", l: "1 2 3 / 4 5 6 / 7 8 9", m: "1,2,3;4,5,6;7,8,9" },
    { id: "s1", l: "ระบบ: คำตอบเดียว", m: "1,1,1,1;1,2,3,2;1,3,6,4", aug: true },
    { id: "s2", l: "ระบบ: คำตอบไม่จำกัด", m: "1,1,1,1;1,2,3,2;1,3,5,3", aug: true },
    { id: "s3", l: "ระบบ: ไม่มีคำตอบ", m: "1,1,1,1;1,2,3,2;1,3,5,4", aug: true }
  ];
  function rankReport(A, aug) {
    var m = A.length, n = A[0].length, nA = aug ? n - 1 : n;
    var R = ref(A), RR = rrefFrom(R);
    var pivA = R.piv.filter(function (p) { return p[1] < nA; }), rA = pivA.length, rAb = R.rank;
    var out = { R: R, RR: RR, m: m, n: n, nA: nA, rankA: rA, rankAug: aug ? rAb : null, pivCols: pivA.map(function (p) { return p[1]; }) };
    var free = [];
    for (var c = 0; c < nA; c++) if (out.pivCols.indexOf(c) < 0) free.push(c);
    out.free = free;
    out.nullity = nA - rA;
    // null-space basis (of the coefficient part) from RREF
    out.nullBasis = free.map(function (f) {
      var v = []; for (var j = 0; j < nA; j++) v.push(ZERO);
      v[f] = ONE;
      RR.piv.forEach(function (p) { if (p[1] < nA) v[p[1]] = RR.M[p[0]][f].neg(); });
      return intVec(v);
    });
    if (aug) {
      out.kind = rA < rAb ? "none" : rA === nA ? "unique" : "inf";
      if (out.kind !== "none") {
        var xp = []; for (var j = 0; j < nA; j++) xp.push(ZERO);
        RR.piv.forEach(function (p) { if (p[1] < nA) xp[p[1]] = RR.M[p[0]][n - 1]; });
        out.xp = xp;
        out.dirs = free.map(function (f) {
          var v = []; for (var j = 0; j < nA; j++) v.push(ZERO);
          v[f] = ONE;
          RR.piv.forEach(function (p) { if (p[1] < nA) v[p[1]] = RR.M[p[0]][f].neg(); });
          return v;
        });
      }
    }
    return out;
  }
  function stepsHtml(steps, bar, cls) {
    return '<ol class="mc-steps ' + (cls || "") + '">' + steps.map(function (s) {
      return '<li><p class="mc-op">' + s.ops.map(esc).join("<br>") + "</p>" + mxHtml(s.M, { bar: bar, piv: s.piv, dimZero: true }) + "</li>";
    }).join("") + "</ol>";
  }
  function initRank(box) {
    var d = box.dataset, st = { pre: "", aug: d.aug != null };
    box.innerHTML = chips(RANK_PRE, "pre", "", "sr-pre ln-scroll") +
      '<label class="ln-ta-l"><span class="lap-lbl">เมทริกซ์ (หนึ่งบรรทัดต่อหนึ่งแถว คั่นด้วยจุลภาคหรือเว้นวรรค ใช้เศษส่วน 3/4 ได้)</span><textarea class="lap-in ln-ta" rows="4" spellcheck="false" aria-label="matrix entries"></textarea></label>' +
      '<div class="lap-row"><label class="ln-chk"><input type="checkbox" data-aug> หลักสุดท้ายคือ <b>b</b> (เมทริกซ์แต่งเติม [A | b])</label><button type="button" class="btn btn-primary btn-sm" data-go>หาแรงก์ ▶</button></div>' +
      '<div class="ln-out" aria-live="polite"></div>';
    var ta = box.querySelector("textarea"), cb = box.querySelector("[data-aug]"), out = box.querySelector(".ln-out");
    ta.value = (d.m || RANK_PRE[0].m).split(";").join("\n").replace(/,/g, ", ");
    cb.checked = st.aug;
    function run() {
      var A;
      try { A = parseMatrix(ta.value); } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; return; }
      if (A.length > 6 || A[0].length > 7) { out.innerHTML = '<p class="lap-err">⚠ รองรับสูงสุด 6 แถว 7 หลัก</p>'; return; }
      var aug = cb.checked && A[0].length > 1, r = rankReport(A, aug), bar = aug ? r.n - 1 : null, h = "";
      h += '<div class="ln-res">';
      h += '<div class="ln-res-mx"><span class="mono">' + (aug ? "[A | b]" : "A") + " ขนาด " + r.m + "×" + r.n + "</span>" + mxHtml(A, { bar: bar }) + "</div>";
      h += '<div class="ln-res-mx"><span class="mono">ขั้นบันได (REF) · ตัวหลักแรเงา</span>' + mxHtml(r.R.M, { bar: bar, piv: r.R.piv, dimZero: true }) + "</div></div>";
      h += '<p class="ln-big">' + (aug ? "rank A = <b>" + r.rankA + "</b> · rank [A | b] = <b>" + r.rankAug + "</b>" : "rank A = <b>" + r.rankA + "</b>") + "</p>";
      h += '<p class="lap-note">แรงก์ = จำนวนแถวที่ไม่เป็นศูนย์หลังลดเป็นขั้นบันได = จำนวนตัวหลัก · หลักตัวหลัก: ' + (r.pivCols.length ? r.pivCols.map(function (c) { return "หลัก " + (c + 1); }).join(", ") : "ไม่มี (เมทริกซ์ศูนย์)") + " · ภาวะศูนย์ (nullity) = " + r.nA + " − " + r.rankA + " = <b>" + r.nullity + "</b></p>";
      if (r.m === r.nA && !aug && r.m <= 5) {
        var dt = detQ(A);
        h += '<p class="lap-note">ตรวจด้วยดีเทอร์มิแนนต์: det A = ' + dt.html() + (dt.isZero() ? " → แรงก์ต่ำกว่า " + r.m : " ≠ 0 → แรงก์เต็ม " + r.m) + "</p>";
      }
      if (aug) {
        var nn = r.nA;
        if (r.kind === "none") h += "<p>" + flag(false, "ไม่มีคำตอบ") + " เพราะ rank A &lt; rank [A | b] มีแถว [0 ⋯ 0 | c] ที่ c ≠ 0</p>";
        else if (r.kind === "unique") h += "<p>" + flag(true, "คำตอบเดียว") + " rank A = rank [A | b] = จำนวนตัวแปร " + nn + "</p>";
        else h += "<p>" + flag(true, "คำตอบไม่จำกัด") + " rank A = rank [A | b] = " + r.rankA + " &lt; " + nn + " จึงมีตัวแปรอิสระ " + (nn - r.rankA) + " ตัว</p>";
        if (r.kind !== "none") {
          var vars = r.free.map(function (f, i) { return "t" + sub(i + 1) + " = x" + sub(f + 1); });
          h += '<div class="ln-sol"><span class="mono">x =</span>' + colHtml(r.xp) + r.dirs.map(function (v, i) { return '<span class="mono">+ t' + sub(i + 1) + "</span>" + colHtml(v); }).join("") + "</div>";
          if (vars.length) h += '<p class="lap-help">ตัวแปรอิสระ: ' + vars.join(", ") + " (เลือกค่าใดก็ได้)</p>";
        }
      } else {
        if (r.nullBasis.length) h += '<div class="ln-sol"><span class="mono">ฐานของปริภูมิศูนย์ N(A):</span>' + r.nullBasis.map(colHtml).join("") + "</div>";
        if (r.pivCols.length) h += '<div class="ln-sol"><span class="mono">ฐานของปริภูมิหลัก C(A) = หลักตัวหลักของ A เดิม:</span>' + r.pivCols.map(function (c) { return colHtml(A.map(function (row) { return row[c]; })); }).join("") + "</div>";
      }
      h += '<details class="mc-det" open><summary>วิธีทำทีละขั้น: ลดแถวเป็นขั้นบันได (' + r.R.steps.length + " ขั้น)</summary>" + (r.R.steps.length ? stepsHtml(r.R.steps, bar) : '<p class="lap-help">เมทริกซ์อยู่ในรูปขั้นบันไดอยู่แล้ว</p>') + "</details>";
      h += '<details class="mc-det"><summary>ทำต่อจนเป็นขั้นบันไดลดรูป (RREF)</summary>' + (r.RR.steps.length ? stepsHtml(r.RR.steps, bar) : "") + '<div class="ln-res-mx"><span class="mono">RREF</span>' + mxHtml(r.RR.M, { bar: bar, piv: r.RR.piv, dimZero: true }) + "</div></details>";
      out.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]");
      if (b) { var P = RANK_PRE.filter(function (q) { return q.id === b.getAttribute("data-pre"); })[0]; ta.value = P.m.split(";").join("\n").replace(/,/g, ", "); cb.checked = !!P.aug; setOn(box, "pre", P.id); run(); return; }
      if (e.target.closest("[data-go]")) run();
    });
    cb.addEventListener("change", run);
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); });
    box._set = function (o) { if (o.m) { ta.value = o.m.split(";").join("\n").replace(/,/g, ", "); cb.checked = !!o.aug; } run(); };
    run();
  }

  // ======================================================================= 2. parameter k: rank and det
  // entries are small polynomials in k written as strings ("k", "k^2", "k-1", "2", "-3k+1")
  function polyParse(s) {
    s = String(s).replace(/\s+/g, "").replace(/−/g, "-");
    var c = [0, 0, 0], re = /([+-]?)(\d*)(k(\^(\d))?)?/g, m, any = false;
    while ((m = re.exec(s)) && m[0] !== "") {
      any = true;
      var sg = m[1] === "-" ? -1 : 1, co = m[2] === "" ? 1 : +m[2], pw = m[3] ? (m[5] ? +m[5] : 1) : 0;
      if (!m[3] && m[2] === "") throw new Error("bad poly " + s);
      c[pw] += sg * co;
    }
    if (!any) throw new Error("bad poly " + s);
    while (c.length > 1 && c[c.length - 1] === 0) c.pop();
    return c;
  }
  function pAdd(a, b) { var r = []; for (var i = 0; i < Math.max(a.length, b.length); i++) r.push((a[i] || 0) + (b[i] || 0)); return r; }
  function pMul(a, b) { var r = []; for (var i = 0; i < a.length + b.length - 1; i++) r.push(0); a.forEach(function (x, i) { b.forEach(function (y, j) { r[i + j] += x * y; }); }); return r; }
  function pScale(a, k) { return a.map(function (x) { return x * k; }); }
  function pTrim(a) { a = a.slice(); while (a.length > 1 && a[a.length - 1] === 0) a.pop(); return a; }
  function pDet(M) {
    var n = M.length;
    if (n === 1) return M[0][0];
    var r = [0];
    for (var j = 0; j < n; j++) {
      var mi = M.slice(1).map(function (row) { return row.filter(function (_, c) { return c !== j; }); });
      r = pAdd(r, pScale(pMul(M[0][j], pDet(mi)), j % 2 ? -1 : 1));
    }
    return pTrim(r);
  }
  function pEvalQ(c, k) { var r = ZERO; for (var i = c.length - 1; i >= 0; i--) r = r.mul(k).add(qi(c[i])); return r; }
  function pEval(c, x) { var r = 0; for (var i = c.length - 1; i >= 0; i--) r = r * x + c[i]; return r; }
  function pTex(c, v) {
    v = v || "k"; var s = "";
    for (var i = c.length - 1; i >= 0; i--) {
      var a = c[i]; if (!a) continue;
      var mag = Math.abs(a), t = i === 0 ? String(mag) : (mag === 1 ? "" : mag) + v + (i > 1 ? "^{" + i + "}" : "");
      s += (s ? (a < 0 ? " - " : " + ") : (a < 0 ? "-" : "")) + t;
    }
    return s || "0";
  }
  function ratRoots(c) { // rational roots (with multiplicity) of an integer polynomial
    c = pTrim(c); var roots = [];
    if (c.length === 1) return roots;
    while (c.length > 1 && c[0] === 0) { roots.push(ZERO); c = c.slice(1); }
    var cand = [], a0 = Math.abs(c[0]), an = Math.abs(c[c.length - 1]);
    var divs = function (N) { var r = []; for (var i = 1; i <= N; i++) if (N % i === 0) r.push(i); return r; };
    divs(a0).forEach(function (p) { divs(an).forEach(function (q) { cand.push(new Q(p, q)); cand.push(new Q(-p, q)); }); });
    var changed = true;
    while (changed && c.length > 1) {
      changed = false;
      for (var i = 0; i < cand.length; i++) {
        if (pEvalQ(c, cand[i]).isZero()) {
          roots.push(cand[i]);
          // synthetic division by (k − r) with rationals → keep integer coefficients by multiplying with r.d
          var r = cand[i], q = [], acc = ZERO, cq = c.map(qi);
          for (var j = cq.length - 1; j >= 1; j--) { acc = acc.mul(r).add(cq[j]); q.unshift(acc); }
          var L = 1n; q.forEach(function (x) { L = lcmBig(L, x.d); });
          c = q.map(function (x) { return Number(x.n * (L / x.d)); });
          changed = true; break;
        }
      }
    }
    return roots;
  }
  var KPRE = [
    { id: "sym", l: "[[1,1,k],[1,k,1],[k,1,1]]", m: [["1", "1", "k"], ["1", "k", "1"], ["k", "1", "1"]] },
    { id: "vdm", l: "[[1,1,1],[1,2,k],[1,4,k²]]", m: [["1", "1", "1"], ["1", "2", "k"], ["1", "4", "k^2"]] },
    { id: "hom", l: "ระบบเอกพันธ์ (det = −3k)", m: [["1", "2", "1"], ["2", "1", "1"], ["1", "-1", "k"]], hom: true },
    { id: "sys", l: "ระบบ [A | b] มีพารามิเตอร์", m: [["1", "1", "k", "1"], ["1", "k", "1", "1"], ["k", "1", "1", "1"]], aug: true }
  ];
  function initKrank(box) {
    var d = box.dataset, st = { p: d.p || "sym", k: d.k != null ? +d.k : 0 };
    box.innerHTML = chips(KPRE, "p", st.p, "sr-pre ln-scroll") +
      slider("k", "ค่าพารามิเตอร์ k", -4, 4, 0.25, st.k) +
      '<div class="sr-two"><div class="ln-kplot"></div><div class="ln-kinfo" aria-live="polite"></div></div>';
    var plot = box.querySelector(".ln-kplot"), info = box.querySelector(".ln-kinfo");
    function draw() {
      var P = KPRE.filter(function (q) { return q.id === st.p; })[0];
      var PM = P.m.map(function (r) { return r.map(polyParse); }), nA = P.aug ? PM[0].length - 1 : PM[0].length;
      var coef = PM.map(function (r) { return r.slice(0, nA); }), dp = pDet(coef), roots = ratRoots(dp);
      var uniq = []; roots.forEach(function (r) { if (!uniq.some(function (u) { return u.eq(r); })) uniq.push(r); });
      var kq = parseQ(String(st.k)), Mk = PM.map(function (r) { return r.map(function (c) { return pEvalQ(c, kq); }); });
      var A = Mk.map(function (r) { return r.slice(0, nA); }), rA = rankOf(A), rAb = P.aug ? rankOf(Mk) : null, dk = pEvalQ(dp, kq);
      var mtex = "\\begin{pmatrix}" + P.m.map(function (r) { return r.map(function (s, j) { return (P.aug && j === nA ? "\\,\\big|\\," : "") + pTex(polyParse(s)); }).join(" & ").replace(/& \\,\\big\|\\,/g, "\\,\\big|\\,"); }).join(" \\\\ ") + "\\end{pmatrix}";
      var h = '<div class="lap-eq">' + tex((P.aug ? "[A\\mid\\mathbf b] = " : "A = ") + mtex, true) + "</div>";
      h += '<div class="lap-eq">' + tex("\\det " + (P.aug ? "A" : "A") + " = " + pTex(dp) + (uniq.length ? "\\quad\\Rightarrow\\quad \\det = 0 \\text{ เมื่อ } k = " + uniq.map(function (r) { return r.tex(); }).join(",\\ ") : ""), true) + "</div>";
      h += '<p class="ln-big">k = ' + kq.html() + " · det = " + dk.html() + " · rank A = <b>" + rA + "</b>" + (P.aug ? " · rank [A | b] = <b>" + rAb + "</b>" : "") + "</p>";
      h += '<div class="ln-res-mx">' + mxHtml(Mk, { bar: P.aug ? nA : null }) + "</div>";
      if (P.aug) {
        h += "<p>" + (rA < rAb ? flag(false, "ไม่มีคำตอบ") : rA === nA ? flag(true, "คำตอบเดียว") : flag(true, "คำตอบไม่จำกัด (ตัวแปรอิสระ " + (nA - rA) + " ตัว)")) + "</p>";
      } else if (P.hom) {
        h += "<p>" + (rA < nA ? flag(true, "มีคำตอบไม่ชัด (nontrivial) เพราะ rank < 3") : flag(false, "มีแต่คำตอบชัด x = 0")) + "</p>";
      } else {
        h += "<p>" + (rA === nA ? flag(true, "แรงก์เต็ม มีอินเวอร์ส") : flag(false, "แรงก์ลดลงเหลือ " + rA + " ไม่มีอินเวอร์ส")) + "</p>";
      }
      h += '<p class="lap-help">ลองเลื่อน k ไปที่ ' + uniq.map(function (r) { return r.str(); }).join(" และ ") + " แล้วดูว่าแรงก์ลดลงเท่าไร ค่า det เป็นศูนย์บอกแค่ว่าแรงก์ไม่เต็ม ต้องลดแถวจึงรู้ว่าเหลือเท่าไร</p>";
      info.innerHTML = h;
      var pts = []; for (var i = 0; i <= 160; i++) { var x = -4 + 8 * i / 160; pts.push([x, pEval(dp, x)]); }
      var ys = pts.map(function (p) { return p[1]; }), lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      var span = Math.max(hi - lo, 1), cl = Math.min(span, 15);
      plot.innerHTML = plotIn(plot, { w: 420, h: 250, xmin: -4, xmax: 4, ymin: Math.max(lo, -cl), ymax: Math.min(hi, cl) + 0.5, series: [{ pts: pts, color: "var(--signal)", width: 2 }],
        vlines: [{ x: st.k, color: "var(--accent)", label: "k = " + kq.str() }], marks: uniq.map(function (r) { return { x: r.num(), y: 0, color: "var(--accent)", open: true }; }).concat([{ x: st.k, y: dk.num(), color: "var(--accent)" }]),
        xlabel: "k", ylabel: "det A(k)", id: MK().uid("lnk"), label: "determinant as a function of k" });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b) return; st.p = b.getAttribute("data-p"); setOn(box, "p", st.p); draw(); });
    bindSliders(box, st, draw);
    box._set = function (o) { if (o.p) { st.p = o.p; setOn(box, "p", st.p); } if (o.k != null) { st.k = o.k; setSlider(box, "k", o.k); } draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 3. three planes in 3-D
  var PLANES = [
    { id: "unique", l: "ตัดกันที่จุดเดียว", eq: [[1, 1, 1, 2], [2, -1, 1, 5], [1, 2, -1, -3]] },
    { id: "line", l: "ตัดกันเป็นเส้นตรง (สันหนังสือ)", eq: [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, 3]] },
    { id: "prism", l: "ปริซึม (ไม่มีคำตอบ)", eq: [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, 4]] },
    { id: "par", l: "สองระนาบขนาน", eq: [[1, 1, 1, 1], [1, 1, 1, 3], [1, -1, 0, 0]] },
    { id: "same", l: "ระนาบเดียวกันทั้งสาม", eq: [[1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3]] },
    { id: "ab", l: "x + 3y + az = b (เลื่อน a, b)", ab: true }
  ];
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vlen(a) { return Math.sqrt(dot(a, a)); }
  function planePoly(n, d, L) {
    var V = [], E = [], pts = [];
    for (var i = 0; i < 8; i++) V.push([i & 1 ? L : -L, i & 2 ? L : -L, i & 4 ? L : -L]);
    for (i = 0; i < 8; i++) for (var b = 0; b < 3; b++) { var j = i | (1 << b); if (j !== i) E.push([i, j]); }
    E.forEach(function (e) {
      var p = V[e[0]], q = V[e[1]], f1 = dot(n, p) - d, f2 = dot(n, q) - d;
      if (Math.abs(f1) < 1e-12) pts.push(p);
      if (f1 * f2 < 0) { var t = f1 / (f1 - f2); pts.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), p[2] + t * (q[2] - p[2])]); }
      if (Math.abs(f2) < 1e-12) pts.push(q);
    });
    var u = []; pts.forEach(function (p) { if (!u.some(function (q) { return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 1e-9; })) u.push(p); });
    if (u.length < 3) return [];
    var c = [0, 0, 0]; u.forEach(function (p) { c[0] += p[0] / u.length; c[1] += p[1] / u.length; c[2] += p[2] / u.length; });
    var nn = n.map(function (x) { return x / vlen(n); }), ax = Math.abs(nn[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    var e1 = cross(nn, ax); e1 = e1.map(function (x) { return x / vlen(e1); }); var e2 = cross(nn, e1);
    u.sort(function (p, q) {
      var dp = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], dq = [q[0] - c[0], q[1] - c[1], q[2] - c[2]];
      return Math.atan2(dot(dp, e2), dot(dp, e1)) - Math.atan2(dot(dq, e2), dot(dq, e1));
    });
    return u;
  }
  function clipLine(p0, dir, L) {
    var t0 = -Infinity, t1 = Infinity;
    for (var i = 0; i < 3; i++) {
      if (Math.abs(dir[i]) < 1e-12) { if (p0[i] < -L - 1e-9 || p0[i] > L + 1e-9) return null; continue; }
      var a = (-L - p0[i]) / dir[i], b = (L - p0[i]) / dir[i];
      if (a > b) { var t = a; a = b; b = t; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    if (t0 > t1) return null;
    return [[p0[0] + t0 * dir[0], p0[1] + t0 * dir[1], p0[2] + t0 * dir[2]], [p0[0] + t1 * dir[0], p0[1] + t1 * dir[1], p0[2] + t1 * dir[2]]];
  }
  function eqTex(e) {
    var s = "", vars = ["x", "y", "z"];
    for (var i = 0; i < 3; i++) {
      var a = e[i]; if (!a) continue;
      var mag = Math.abs(a), t = (mag === 1 ? "" : fmt(mag, 4)) + vars[i];
      s += (s ? (a < 0 ? " - " : " + ") : (a < 0 ? "-" : "")) + t;
    }
    return (s || "0") + " = " + fmt(e[3], 4).replace(MINUS, "-");
  }
  function initPlanes(box) {
    var d = box.dataset, st = { p: d.p || "unique", yaw: -38, tilt: 22, a: 6, b: 4 };
    var show = { yaw: function (v) { return v + "°"; }, tilt: function (v) { return v + "°"; } };
    box.innerHTML = chips(PLANES.map(function (q) { return { id: q.id, l: q.l }; }), "p", st.p, "sr-pre ln-scroll") +
      '<div class="ln-ab">' + slider("a", "a", 1, 9, 0.5, st.a) + slider("b", "b", 0, 6, 0.5, st.b) + "</div>" +
      '<div class="sr-two"><div class="ln-3d-wrap"><svg class="ln-3d" viewBox="0 0 400 340" role="img" aria-label="three planes in space; drag to rotate"></svg>' +
      '<div class="ln-3d-ctl">' + slider("yaw", "หมุน", -180, 180, 2, st.yaw) + slider("tilt", "มุมก้ม", -10, 80, 2, st.tilt) + "</div></div>" +
      '<div class="ln-pinfo" aria-live="polite"></div></div>';
    var svg = box.querySelector("svg"), info = box.querySelector(".ln-pinfo"), abBox = box.querySelector(".ln-ab"), L = 4;
    function eqs() {
      var P = PLANES.filter(function (q) { return q.id === st.p; })[0];
      return P.ab ? [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, st.a, st.b]] : P.eq;
    }
    function proj(p) {
      var th = st.yaw * Math.PI / 180, ph = st.tilt * Math.PI / 180;
      var x1 = p[0] * Math.cos(th) - p[1] * Math.sin(th), y1 = p[0] * Math.sin(th) + p[1] * Math.cos(th), z1 = p[2];
      var up = z1 * Math.cos(ph) + y1 * Math.sin(ph), depth = y1 * Math.cos(ph) - z1 * Math.sin(ph);
      return [200 + 27 * x1, 168 - 27 * up, depth];
    }
    function P2(p) { var q = proj(p); return q[0].toFixed(1) + " " + q[1].toFixed(1); }
    function draw() {
      abBox.hidden = st.p !== "ab";
      var E = eqs(), A = E.map(function (e) { return e.slice(0, 3).map(function (v) { return parseQ(String(v)); }); });
      var Ab = E.map(function (e) { return e.map(function (v) { return parseQ(String(v)); }); });
      var rA = rankOf(A), rAb = rankOf(Ab), h = "";
      // cube, axes
      var s = '<g class="ln-cube">';
      var V = []; for (var i = 0; i < 8; i++) V.push([i & 1 ? L : -L, i & 2 ? L : -L, i & 4 ? L : -L]);
      for (i = 0; i < 8; i++) for (var bb = 0; bb < 3; bb++) { var j = i | (1 << bb); if (j !== i) s += '<path d="M' + P2(V[i]) + "L" + P2(V[j]) + '"/>'; }
      s += "</g><g class=\"ln-axes\">";
      [["x", [L + 0.9, 0, 0]], ["y", [0, L + 0.9, 0]], ["z", [0, 0, L + 0.9]]].forEach(function (a) {
        var o = [0, 0, 0], q = proj(a[1]);
        s += '<path d="M' + P2(o) + "L" + P2(a[1]) + '"/><text x="' + q[0].toFixed(1) + '" y="' + (q[1] + 4).toFixed(1) + '" text-anchor="middle">' + a[0] + "</text>";
      });
      s += "</g>";
      var polys = E.map(function (e, k) {
        var pts = planePoly(e.slice(0, 3), e[3], L);
        var dep = pts.reduce(function (m, p) { return m + proj(p)[2]; }, 0) / Math.max(1, pts.length);
        return { k: k, pts: pts, dep: dep };
      }).filter(function (o) { return o.pts.length >= 3; }).sort(function (a, b) { return b.dep - a.dep; });
      polys.forEach(function (o) {
        s += '<path class="ln-pl ln-pl' + (o.k + 1) + '" d="M' + o.pts.map(P2).join("L") + 'Z"/>';
      });
      // pairwise intersection lines
      var segs = [];
      for (i = 0; i < 3; i++) for (j = i + 1; j < 3; j++) {
        var n1 = E[i].slice(0, 3), n2 = E[j].slice(0, 3), dv = cross(n1, n2), dd = dot(dv, dv);
        if (dd < 1e-10) continue;
        var a1 = E[i][3], a2 = E[j][3], n11 = dot(n1, n1), n22 = dot(n2, n2), n12 = dot(n1, n2);
        var c1 = (a1 * n22 - a2 * n12) / dd, c2 = (a2 * n11 - a1 * n12) / dd, p0 = [c1 * n1[0] + c2 * n2[0], c1 * n1[1] + c2 * n2[1], c1 * n1[2] + c2 * n2[2]];
        var sg = clipLine(p0, dv, L);
        if (sg) segs.push(sg);
      }
      segs.forEach(function (g) { s += '<path class="ln-ix" d="M' + P2(g[0]) + "L" + P2(g[1]) + '"/>'; });
      // labels on planes
      polys.forEach(function (o) {
        var c = [0, 0]; o.pts.forEach(function (p) { var q = proj(p); c[0] += q[0] / o.pts.length; c[1] += q[1] / o.pts.length; });
        var q0 = proj(o.pts[0]), lx = c[0] + (q0[0] - c[0]) * 0.62, ly = c[1] + (q0[1] - c[1]) * 0.62;
        s += '<g class="ln-plab ln-pl' + (o.k + 1) + '"><circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="9"/><text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle">' + (o.k + 1) + "</text></g>";
      });
      var sol = null;
      if (rA === 3) {
        var Af = E.map(function (e) { return e.slice(0, 3); }), D = dot(Af[0], cross(Af[1], Af[2]));
        var bv = E.map(function (e) { return e[3]; });
        var col = function (c) { return Af.map(function (r, i) { var t = r.slice(); t[c] = bv[i]; return t; }); };
        sol = [0, 1, 2].map(function (c) { var M = col(c); return dot(M[0], cross(M[1], M[2])) / D; });
        if (Math.max(Math.abs(sol[0]), Math.abs(sol[1]), Math.abs(sol[2])) <= L) {
          var q = proj(sol);
          s += '<circle class="ln-sol-pt" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="6"/>';
        }
      }
      svg.innerHTML = s;
      h += '<ol class="ln-eqs">' + E.map(function (e, k) { return '<li><span class="ln-sw ln-pl' + (k + 1) + '">' + (k + 1) + "</span>" + tex(eqTex(e)) + "</li>"; }).join("") + "</ol>";
      h += '<p class="ln-big">rank A = <b>' + rA + "</b> · rank [A | b] = <b>" + rAb + "</b></p>";
      if (rA < rAb) h += "<p>" + flag(false, "ไม่มีคำตอบ") + " ไม่มีจุดที่อยู่บนทั้งสามระนาบพร้อมกัน" + (segs.length === 3 ? " (เส้นตัดคู่ละเส้นขนานกันสามเส้น เป็นปริซึม)" : "") + "</p>";
      else if (rA === 3) h += "<p>" + flag(true, "คำตอบเดียว") + " จุดตัด " + tex("(x, y, z) = (" + sol.map(function (v) { return fmt(v, 5).replace(MINUS, "-"); }).join(",\\ ") + ")") + "</p>";
      else if (rA === 2) h += "<p>" + flag(true, "คำตอบไม่จำกัด: เส้นตรงหนึ่งเส้น") + " ตัวแปรอิสระ 1 ตัว ทั้งสามระนาบผ่านเส้นเดียวกัน</p>";
      else h += "<p>" + flag(true, "คำตอบไม่จำกัด: ทั้งระนาบ") + " ตัวแปรอิสระ 2 ตัว</p>";
      if (st.p === "ab") h += '<p class="lap-help">ลดแถวได้แถวสุดท้าย ' + tex("[\\,0\\ \\ 0\\ \\ a-5 \\mid b-3\\,]") + " · a ≠ 5 คำตอบเดียว · a = 5, b = 3 ไม่จำกัด · a = 5, b ≠ 3 ไม่มีคำตอบ</p>";
      h += '<p class="lap-help">ลากที่ภาพเพื่อหมุน (บนมือถือปัดซ้าย-ขวา) หรือใช้แถบเลื่อนด้านล่างภาพ</p>';
      info.innerHTML = h;
    }
    var drag = null;
    svg.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, tilt: st.tilt, t: e.pointerType }; });
    root.addEventListener && root.addEventListener("pointerup", function () { drag = null; });
    svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      st.yaw = Math.round(((drag.yaw + (e.clientX - drag.x) * 0.6 + 540) % 360) - 180);
      if (drag.t !== "touch") st.tilt = Math.round(Math.max(-10, Math.min(80, drag.tilt + (e.clientY - drag.y) * 0.4)));
      setSlider(box, "yaw", st.yaw, show); setSlider(box, "tilt", st.tilt, show);
      draw();
    });
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b) return; st.p = b.getAttribute("data-p"); setOn(box, "p", st.p); draw(); });
    bindSliders(box, st, draw, show);
    box._set = function (o) { if (o.p) { st.p = o.p; setOn(box, "p", st.p); } if (o.a != null) { st.a = o.a; setSlider(box, "a", o.a); } if (o.b != null) { st.b = o.b; setSlider(box, "b", o.b); } draw(); };
    draw();
  }

  // ======================================================================= 4. pivoting and round-off
  function fl(x, s) {
    if (!isFinite(x) || x === 0) return x;
    var e = Math.floor(Math.log10(Math.abs(x))), q = Math.pow(10, s - 1 - e);
    var r = Math.round(x * q) / q;
    return +r.toPrecision(s);
  }
  function gaussFl(A0, b0, s, pivot) {
    var n = A0.length, A = A0.map(function (r) { return r.slice(); }), b = b0.slice(), steps = [];
    for (var c = 0; c < n; c++) {
      var p = c;
      if (pivot) { for (var i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i; }
      if (p !== c) { var t = A[p]; A[p] = A[c]; A[c] = t; var tb = b[p]; b[p] = b[c]; b[c] = tb; steps.push({ op: opSwap(c, p) + " (เลือกตัวหลักที่ค่าสัมบูรณ์มากสุด)", A: A.map(function (r) { return r.slice(); }), b: b.slice() }); }
      if (A[c][c] === 0) return { fail: "ตัวหลักแถว " + (c + 1) + " เป็นศูนย์ หารไม่ได้ ต้องสลับแถว", steps: steps };
      var ops = [];
      for (i = c + 1; i < n; i++) {
        var m = fl(A[i][c] / A[c][c], s);
        if (m === 0) continue;
        for (var j = c; j < n; j++) A[i][j] = j === c ? 0 : fl(A[i][j] - fl(m * A[c][j], s), s);
        b[i] = fl(b[i] - fl(m * b[c], s), s);
        ops.push(rowName(i) + " ← " + rowName(i) + " − (" + fmt(m, s) + ")" + rowName(c));
      }
      if (ops.length) steps.push({ op: ops.join("<br>"), A: A.map(function (r) { return r.slice(); }), b: b.slice() });
    }
    var x = []; for (i = 0; i < n; i++) x.push(0);
    for (i = n - 1; i >= 0; i--) {
      var acc = b[i];
      for (j = i + 1; j < n; j++) acc = fl(acc - fl(A[i][j] * x[j], s), s);
      if (A[i][i] === 0) return { fail: "ตัวหลักแถว " + (i + 1) + " เป็นศูนย์", steps: steps };
      x[i] = fl(acc / A[i][i], s);
    }
    return { x: x, steps: steps };
  }
  function solveExact(A, b) { // float solve by partial pivoting in double precision (reference)
    var n = A.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      var t = M[p]; M[p] = M[c]; M[c] = t;
      if (Math.abs(M[c][c]) < 1e-300) return null;
      for (i = c + 1; i < n; i++) { var f = M[i][c] / M[c][c]; for (var j = c; j <= n; j++) M[i][j] -= f * M[c][j]; }
    }
    var x = []; for (i = 0; i < n; i++) x.push(0);
    for (i = n - 1; i >= 0; i--) { var acc = M[i][n]; for (j = i + 1; j < n; j++) acc -= M[i][j] * x[j]; x[i] = acc / M[i][i]; }
    return x;
  }
  function numMx(A, b, s) {
    var rows = A.map(function (r, i) { return r.map(function (v) { return fmt(v, s); }).concat([fmt(b[i], s)]); });
    return mxHtml(rows, { bar: A[0].length });
  }
  function initPivot(box) {
    var d = box.dataset, st = { p: d.p || "eps", e: +(d.e || 6), s: +(d.s || 4), piv: 0 };
    var show = { e: function (v) { return "ε = " + p10(v); }, s: function (v) { return v + " หลัก"; } };
    box.innerHTML = chips([{ id: "eps", l: "εx + y = 1, x + y = 2" }, { id: "zero", l: "ตัวหลักเป็นศูนย์ 3×3" }], "p", st.p, "sr-pre") +
      '<div class="ln-eps">' + slider("e", "ขนาดตัวหลักแรก ε", 1, 10, 1, st.e) + "</div>" +
      slider("s", "เครื่องคิดเลขเก็บเลขนัยสำคัญ", 2, 10, 1, st.s) +
      chips([{ id: 0, l: "ไม่สลับแถว (naive)" }, { id: 1, l: "สลับแถว (partial pivoting)" }], "piv", st.piv) +
      '<div class="ln-pout" aria-live="polite"></div>';
    var out = box.querySelector(".ln-pout"), epsBox = box.querySelector(".ln-eps");
    function sys() {
      if (st.p === "zero") return { A: [[0, 2, 1], [1, -2, -3], [-1, 1, 2]], b: [7, -12, 7], names: ["x", "y", "z"] };
      var e = Math.pow(10, -st.e);
      return { A: [[e, 1], [1, 1]], b: [1, 2], names: ["x", "y"] };
    }
    function draw() {
      epsBox.hidden = st.p !== "eps";
      var S = sys(), ex = solveExact(S.A, S.b), R = gaussFl(S.A, S.b, st.s, !!st.piv), h = "";
      h += '<div class="ln-res"><div class="ln-res-mx"><span class="mono">[A | b] เริ่มต้น</span>' + numMx(S.A, S.b, Math.max(st.s, 3)) + "</div>";
      if (R.steps.length) h += '<div class="ln-res-mx"><span class="mono">หลังกำจัด (ปัดทุกครั้งเหลือ ' + st.s + " หลัก)</span>" + numMx(R.steps[R.steps.length - 1].A, R.steps[R.steps.length - 1].b, st.s) + "</div>";
      h += "</div>";
      h += '<ol class="mc-steps">' + R.steps.map(function (q) { return '<li><p class="mc-op">' + q.op + "</p>" + numMx(q.A, q.b, st.s) + "</li>"; }).join("") + "</ol>";
      if (R.fail) h += "<p>" + flag(false, "ล้มเหลว") + " " + esc(R.fail) + "</p>";
      else {
        var err = R.x.map(function (v, i) { return Math.abs(v - ex[i]) / Math.max(Math.abs(ex[i]), 1e-300); }), worst = Math.max.apply(null, err);
        h += '<div class="table-wrap"><table class="lap-pt"><thead><tr><th>ตัวแปร</th><th>ได้ (' + st.s + " หลัก)</th><th>ค่าจริง</th><th>คลาดเคลื่อนสัมพัทธ์</th></tr></thead><tbody>" +
          R.x.map(function (v, i) { return "<tr" + (err[i] > 0.01 ? ' class="ln-bad"' : "") + "><td>" + S.names[i] + "</td><td>" + fmt(v, st.s) + "</td><td>" + fmt(ex[i], 10) + "</td><td>" + (err[i] * 100).toFixed(err[i] < 0.001 ? 4 : 1) + " %</td></tr>"; }).join("") + "</tbody></table></div>";
        h += "<p>" + (worst > 0.01 ? flag(false, "คำตอบเพี้ยน " + (worst * 100).toFixed(0) + " %") : flag(true, "คำตอบถูกต้องตามจำนวนหลัก")) + "</p>";
      }
      if (st.p === "eps") {
        var rows = "";
        for (var s = 3; s <= 10; s++) {
          var a = gaussFl(S.A, S.b, s, false), b = gaussFl(S.A, S.b, s, true);
          var ea = a.fail ? NaN : Math.abs(a.x[0] - ex[0]) / ex[0], eb = Math.abs(b.x[0] - ex[0]) / ex[0];
          rows += "<tr" + (s === st.s ? ' class="in"' : "") + "><td>" + s + "</td><td" + (ea > 0.01 ? ' class="ln-badc"' : "") + ">" + fmt(a.x[0], s) + " (" + (ea * 100).toFixed(ea < 0.001 ? 3 : 0) + " %)</td><td>" + fmt(b.x[0], s) + " (" + (eb * 100).toFixed(eb < 0.001 ? 3 : 0) + " %)</td></tr>";
        }
        h += '<details class="mc-det"><summary>เทียบทุกจำนวนหลัก: ค่า x ที่ได้</summary><div class="table-wrap"><table class="lap-pt"><thead><tr><th>หลัก</th><th>ไม่สลับแถว</th><th>สลับแถว</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
          '<p class="lap-help">ตัวคูณ m = 1/ε ใหญ่มาก ทำให้ 1 − m กลืนเลข 1 หายไปเมื่อเก็บหลักไม่พอ การสลับแถวทำให้ |m| ≤ 1 เสมอ ความคลาดเคลื่อนจึงไม่ถูกขยาย</p></details>';
      }
      out.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (b) { st.p = b.getAttribute("data-p"); setOn(box, "p", st.p); draw(); return; }
      var c = e.target.closest("[data-piv]"); if (c) { st.piv = +c.getAttribute("data-piv"); setOn(box, "piv", st.piv); draw(); }
    });
    bindSliders(box, st, draw, show);
    box._set = function (o) { ["e", "s"].forEach(function (k) { if (o[k] != null) { st[k] = o[k]; setSlider(box, k, o[k], show); } }); if (o.piv != null) { st.piv = o.piv; setOn(box, "piv", st.piv); } if (o.p) { st.p = o.p; setOn(box, "p", st.p); } draw(); };
    draw();
  }

  // ======================================================================= 5. LU / PA = LU / Cholesky
  function luExact(A0, pivot) {
    var n = A0.length, U = clone(A0), L = [], P = [], steps = [], swaps = 0;
    for (var i = 0; i < n; i++) { L.push([]); P.push(i); for (var j = 0; j < n; j++) L[i].push(i === j ? ONE : ZERO); }
    for (var c = 0; c < n; c++) {
      var p = c;
      if (pivot) { for (i = c + 1; i < n; i++) if (U[i][c].abs().num() > U[p][c].abs().num()) p = i; }
      else if (U[c][c].isZero()) { for (i = c + 1; i < n; i++) if (!U[i][c].isZero()) { p = -1; break; } if (p === -1) return { fail: "ตัวหลัก u" + sub(c + 1) + sub(c + 1) + " = 0 แยก LU แบบไม่สลับแถวไม่ได้ ใช้ PA = LU แทน", steps: steps }; }
      if (p !== c) {
        var t = U[p]; U[p] = U[c]; U[c] = t; t = P[p]; P[p] = P[c]; P[c] = t; swaps++;
        for (j = 0; j < c; j++) { var tl = L[p][j]; L[p][j] = L[c][j]; L[c][j] = tl; }
        steps.push({ ops: [opSwap(c, p) + " (สลับใน P และใน L ส่วนที่ทำแล้วด้วย)"], U: clone(U), L: clone(L), c: c });
      }
      if (U[c][c].isZero()) { if (c === n - 1) break; continue; }
      var ops = [];
      for (i = c + 1; i < n; i++) {
        var f = U[i][c].div(U[c][c]);
        L[i][c] = f;
        if (f.isZero()) continue;
        U[i] = U[i].map(function (v, j) { return v.sub(f.mul(U[c][j])); });
        ops.push("ℓ" + sub(i + 1) + sub(c + 1) + " = " + f.str() + " · " + opAdd(i, f.neg(), c));
      }
      if (ops.length) steps.push({ ops: ops, U: clone(U), L: clone(L), c: c });
    }
    var det = swaps % 2 ? ONE.neg() : ONE; for (i = 0; i < n; i++) det = det.mul(U[i][i]);
    return { L: L, U: U, P: P, steps: steps, det: det, swaps: swaps };
  }
  function cholesky(A) {
    var n = A.length, L = [];
    for (var i = 0; i < n; i++) { L.push([]); for (var j = 0; j < n; j++) L[i].push(0); }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (Math.abs(A[i][j] - A[j][i]) > 1e-12) return { fail: "เมทริกซ์ไม่สมมาตร (a" + sub(i + 1) + sub(j + 1) + " ≠ a" + sub(j + 1) + sub(i + 1) + ") ใช้ Cholesky ไม่ได้" };
    var lines = [];
    for (j = 0; j < n; j++) {
      var s = A[j][j]; for (var k = 0; k < j; k++) s -= L[j][k] * L[j][k];
      if (s <= 1e-14) return { fail: "ได้ค่าใต้รากของ ℓ" + sub(j + 1) + sub(j + 1) + " = " + fmt(s, 5) + " ≤ 0 จึงไม่เป็นเมทริกซ์บวกแน่นอน (positive definite)" };
      L[j][j] = Math.sqrt(s);
      lines.push("ℓ" + sub(j + 1) + sub(j + 1) + " = √(" + fmt(A[j][j], 6) + (j ? " − Σℓ²" : "") + ") = " + fmt(L[j][j], 6));
      for (i = j + 1; i < n; i++) {
        var t = A[i][j]; for (k = 0; k < j; k++) t -= L[i][k] * L[j][k];
        L[i][j] = t / L[j][j];
        lines.push("ℓ" + sub(i + 1) + sub(j + 1) + " = (" + fmt(A[i][j], 6) + (j ? " − Σℓℓ" : "") + ") / ℓ" + sub(j + 1) + sub(j + 1) + " = " + fmt(L[i][j], 6));
      }
    }
    return { L: L, lines: lines };
  }
  function initLU(box) {
    var d = box.dataset, st = { mode: d.mode || "lu" };
    box.innerHTML = chips([{ id: "lu", l: "A = LU (ดูลิตเติล)" }, { id: "plu", l: "PA = LU (สลับแถว)" }, { id: "chol", l: "A = LLᵀ (โชเลสกี)" }], "mode", st.mode) +
      '<div class="ln-two-in"><label class="ln-ta-l"><span class="lap-lbl">A (n×n, n ≤ 5)</span><textarea class="lap-in ln-ta" rows="4" data-a spellcheck="false" aria-label="matrix A"></textarea></label>' +
      '<label class="ln-ta-l ln-ta-b"><span class="lap-lbl">b</span><textarea class="lap-in ln-ta" rows="4" data-b spellcheck="false" aria-label="vector b"></textarea></label></div>' +
      '<div class="lap-row"><button type="button" class="btn btn-primary btn-sm" data-go>แยกตัวประกอบและแก้ระบบ ▶</button><span class="lap-help">b ใส่ทีละบรรทัด หรือคั่นด้วยจุลภาค</span></div><div class="ln-luout" aria-live="polite"></div>';
    var ta = box.querySelector("[data-a]"), tb = box.querySelector("[data-b]"), out = box.querySelector(".ln-luout");
    ta.value = (d.a || "1,2,4;3,8,14;2,6,13").split(";").join("\n").replace(/,/g, ", ");
    tb.value = (d.b || "3,13,4").split(/[,;]/).join("\n");
    function run() {
      var A, b;
      try { A = parseMatrix(ta.value); b = String(tb.value).trim().split(/[\s,;]+/).filter(Boolean).map(parseQ); } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; return; }
      var n = A.length;
      if (A[0].length !== n) { out.innerHTML = '<p class="lap-err">⚠ A ต้องเป็นเมทริกซ์จัตุรัส</p>'; return; }
      if (n > 5) { out.innerHTML = '<p class="lap-err">⚠ รองรับถึง 5×5</p>'; return; }
      if (b.length !== n) { out.innerHTML = '<p class="lap-err">⚠ b ต้องมี ' + n + " ค่า</p>"; return; }
      var h = "";
      if (st.mode === "chol") {
        var Af = A.map(function (r) { return r.map(function (v) { return v.num(); }); }), bf = b.map(function (v) { return v.num(); }), C = cholesky(Af);
        if (C.fail) { out.innerHTML = "<p>" + flag(false, "ใช้ไม่ได้") + " " + esc(C.fail) + "</p>"; return; }
        var Ls = C.L.map(function (r) { return r.map(function (v) { return fmt(v, 5); }); });
        h += '<div class="ln-res"><div class="ln-res-mx"><span class="mono">L</span>' + mxHtml(Ls) + '</div><div class="ln-res-mx"><span class="mono">Lᵀ</span>' + mxHtml(Ls[0].map(function (_, j) { return Ls.map(function (r) { return r[j]; }); })) + "</div></div>";
        h += '<details class="mc-det" open><summary>คำนวณ ℓᵢⱼ ทีละหลัก</summary><p class="mc-line">' + C.lines.map(esc).join("<br>") + "</p></details>";
        var y = [], x = [];
        for (var i = 0; i < n; i++) { var s = bf[i]; for (var k = 0; k < i; k++) s -= C.L[i][k] * y[k]; y.push(s / C.L[i][i]); }
        for (i = n - 1; i >= 0; i--) { s = y[i]; for (k = i + 1; k < n; k++) s -= C.L[k][i] * x[k]; x[i] = s / C.L[i][i]; }
        h += '<p class="mc-line">Ly = b → y = (' + y.map(function (v) { return fmt(v, 6); }).join(", ") + ")<br>Lᵀx = y → x = (" + x.map(function (v) { return fmt(v, 6); }).join(", ") + ")</p>";
        h += '<p class="lap-help">ใช้ได้กับเมทริกซ์สมมาตรบวกแน่นอน เช่น เมทริกซ์ความนำ G ของวงจรตัวต้านทาน ทำงานครึ่งหนึ่งของ LU (≈ n³/6 การคูณ) และไม่ต้องสลับแถว</p>';
        out.innerHTML = h; return;
      }
      var R = luExact(A, st.mode === "plu");
      if (R.fail) { out.innerHTML = "<p>" + flag(false, "แยกไม่ได้") + " " + esc(R.fail) + "</p>" + (R.steps.length ? stepsLU(R.steps) : ""); return; }
      var singular = R.U.some(function (r, i) { return r[i].isZero(); });
      h += '<div class="ln-res">' + (st.mode === "plu" ? '<div class="ln-res-mx"><span class="mono">P (ลำดับแถว ' + R.P.map(function (p) { return p + 1; }).join(", ") + ")</span>" + mxHtml(R.P.map(function (p) { return A.map(function (_, j) { return j === p ? ONE : ZERO; }); })) + "</div>" : "") +
        '<div class="ln-res-mx"><span class="mono">L</span>' + mxHtml(R.L) + '</div><div class="ln-res-mx"><span class="mono">U</span>' + mxHtml(R.U, { piv: R.U.map(function (_, i) { return [i, i]; }) }) + "</div></div>";
      h += '<p class="lap-note">det A = ' + (R.swaps % 2 ? "(−1) × " : "") + "ผลคูณแนวทแยงของ U = <b>" + R.det.html() + "</b>" + (R.swaps ? " (สลับแถว " + R.swaps + " ครั้ง)" : "") + "</p>";
      h += '<details class="mc-det" open><summary>ขั้นการกำจัด: ตัวคูณ ℓᵢⱼ ไปอยู่ใน L (' + R.steps.length + " ขั้น)</summary>" + stepsLU(R.steps) + "</details>";
      if (singular) { h += "<p>" + flag(false, "U มีศูนย์บนแนวทแยง") + " A เป็นเมทริกซ์เอกฐาน แก้ระบบด้วยการแทนค่าย้อนกลับไม่ได้</p>"; out.innerHTML = h; return; }
      var pb = R.P.map(function (p) { return b[p]; }), y2 = [], x2 = [], fw = [], bw = [];
      for (i = 0; i < n; i++) { var acc = pb[i], terms = []; for (k = 0; k < i; k++) { acc = acc.sub(R.L[i][k].mul(y2[k])); if (!R.L[i][k].isZero()) terms.push(R.L[i][k].str() + "·y" + sub(k + 1)); } y2.push(acc); fw.push("y" + sub(i + 1) + " = " + pb[i].str() + (terms.length ? " − (" + terms.join(" + ") + ")" : "") + " = " + acc.str()); }
      for (i = n - 1; i >= 0; i--) { acc = y2[i]; terms = []; for (k = i + 1; k < n; k++) { acc = acc.sub(R.U[i][k].mul(x2[k])); if (!R.U[i][k].isZero()) terms.push(R.U[i][k].str() + "·x" + sub(k + 1)); } x2[i] = acc.div(R.U[i][i]); bw.unshift("x" + sub(i + 1) + " = (" + y2[i].str() + (terms.length ? " − (" + terms.join(" + ") + ")" : "") + ") / " + R.U[i][i].str() + " = " + x2[i].str()); }
      h += '<div class="ln-luss"><div><span class="mono">① แทนค่าไปข้างหน้า L y = ' + (st.mode === "plu" ? "P b" : "b") + '</span><p class="mc-line">' + fw.join("<br>") + '</p></div><div><span class="mono">② แทนค่าย้อนกลับ U x = y</span><p class="mc-line">' + bw.join("<br>") + "</p></div></div>";
      h += '<div class="mc-ans"><span class="mono">คำตอบ</span><div class="mc-sol">' + x2.map(function (v, i) { return "<span>x" + sub(i + 1) + " = <b>" + v.html() + "</b></span>"; }).join("") + "</div></div>";
      h += '<p class="lap-help">แยก A ครั้งเดียว (≈ n³/3 การคูณ) แล้วแก้ b ใหม่ได้ทุกตัวด้วยการแทนค่าสองรอบ (≈ n² การคูณ) ลองเปลี่ยน b แล้วกดอีกครั้ง</p>';
      out.innerHTML = h;
    }
    function stepsLU(steps) {
      return '<ol class="mc-steps">' + steps.map(function (s) {
        return '<li><p class="mc-op">' + s.ops.map(esc).join("<br>") + '</p><div class="ln-res"><div class="ln-res-mx"><span class="mono">L</span>' + mxHtml(s.L) + '</div><div class="ln-res-mx"><span class="mono">U</span>' + mxHtml(s.U, { piv: [[s.c, s.c]] }) + "</div></div></li>";
      }).join("") + "</ol>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]"); if (b) { st.mode = b.getAttribute("data-mode"); setOn(box, "mode", st.mode); run(); return; }
      if (e.target.closest("[data-go]")) run();
    });
    box._set = function (o) { if (o.a) ta.value = o.a.split(";").join("\n").replace(/,/g, ", "); if (o.b) tb.value = o.b.split(/[,;]/).join("\n"); if (o.mode) { st.mode = o.mode; setOn(box, "mode", st.mode); } run(); };
    run();
  }

  // ======================================================================= 6. Jacobi · Gauss–Seidel · SOR
  function tri(n) { var A = [], b = []; for (var i = 0; i < n; i++) { var r = []; for (var j = 0; j < n; j++) r.push(i === j ? 2 : Math.abs(i - j) === 1 ? -1 : 0); A.push(r); b.push(i === 0 || i === n - 1 ? 1 : 0); } return { A: A, b: b }; }
  var ITER = [
    { id: "bf3", l: "3×3 ทแยงเด่น", A: [[4, -1, 1], [4, -8, 1], [-2, 1, 5]], b: [7, -21, 15], x0: [1, 2, 2] },
    { id: "c3", l: "3×3 ชุด C", A: [[5, -1, 1], [2, 8, -1], [-1, 1, 4]], b: [10, 11, 3], x0: [0, 0, 0] },
    { id: "g2", l: "2×2 ดูภาพ (ลู่เข้า)", A: [[3, 1], [1, 2]], b: [5, 5], x0: [-1, -1] },
    { id: "g2bad", l: "2×2 สลับสมการ (ลู่ออก)", A: [[1, 2], [3, 1]], b: [5, 5], x0: [0.6, 1.4] },
    { id: "tri10", l: "10×10 แท่งความร้อน", tri: 10, x0: null }
  ];
  function iterStep(A, b, x, method, w) {
    var n = b.length, y = x.slice();
    for (var i = 0; i < n; i++) {
      var s = b[i];
      for (var j = 0; j < n; j++) if (j !== i) s -= A[i][j] * (method === "jacobi" ? x[j] : y[j]);
      var gs = s / A[i][i];
      y[i] = method === "sor" ? (1 - w) * x[i] + w * gs : gs;
    }
    return y;
  }
  function norm(v) { return v.reduce(function (m, x) { return Math.max(m, Math.abs(x)); }, 0); }
  function iterRun(A, b, x0, method, w, tol, maxit, xs) {
    var x = x0.slice(), hist = [x.slice()], err = [xs ? norm(x.map(function (v, i) { return v - xs[i]; })) : NaN], dx = [NaN], k = 0, conv = false, div = false;
    while (k < maxit) {
      var y = iterStep(A, b, x, method, w); k++;
      var d = norm(y.map(function (v, i) { return v - x[i]; }));
      x = y; hist.push(x.slice()); dx.push(d);
      err.push(xs ? norm(x.map(function (v, i) { return v - xs[i]; })) : NaN);
      if (!isFinite(d) || norm(x) > 1e12) { div = true; break; }
      if (d <= tol * Math.max(norm(x), 1e-300)) { conv = true; break; }
    }
    return { hist: hist, err: err, dx: dx, k: k, conv: conv, div: div };
  }
  function iterMatrix(A, method, w) {
    var n = A.length, T = [], zero = A.map(function () { return 0; });
    for (var j = 0; j < n; j++) { var e = zero.slice(); e[j] = 1; T.push(iterStep(A, zero, e, method, w)); }
    return T[0].map(function (_, i) { return T.map(function (c) { return c[i]; }); }); // columns → rows
  }
  function specRad(T) { // Gelfand: ρ = lim ‖T^m‖^(1/m), m = 2^K with renormalisation
    var n = T.length, mm = function (A, B) { return A.map(function (r) { return B[0].map(function (_, j) { var s = 0; for (var k = 0; k < n; k++) s += r[k] * B[k][j]; return s; }); }); };
    var fro = function (A) { var s = 0; A.forEach(function (r) { r.forEach(function (v) { s += v * v; }); }); return Math.sqrt(s); };
    var q = fro(T); if (q === 0) return 0;
    var M = T.map(function (r) { return r.map(function (v) { return v / q; }); }), Lg = Math.log(q), K = 16;
    for (var k = 0; k < K; k++) { var S = mm(M, M); q = fro(S); if (q === 0) return 0; Lg = 2 * Lg + Math.log(q); M = S.map(function (r) { return r.map(function (v) { return v / q; }); }); }
    return Math.exp(Lg / Math.pow(2, K));
  }
  function diagDom(A) { return A.every(function (r, i) { var s = 0; r.forEach(function (v, j) { if (j !== i) s += Math.abs(v); }); return Math.abs(r[i]) > s; }); }
  var METH = [{ id: "jacobi", l: "จาโคบี (Jacobi)" }, { id: "gs", l: "เกาส์-ไซเดล (Gauss–Seidel)" }, { id: "sor", l: "SOR (ω)" }];
  var MCOL = { jacobi: { c: "var(--signal)", dash: "6 4", w: 2 }, gs: { c: "var(--accent)", dash: "", w: 2.2 }, sor: { c: "var(--ok)", dash: "2 3", w: 2.6 } };
  function initIter(box) {
    var d = box.dataset, st = { p: d.p || "bf3", m: d.method || "gs", w: +(d.w || 1.2), t: +(d.tol || 6) };
    var show = { w: function (v) { return v.toFixed(2); }, t: function (v) { return p10(v); } };
    box.innerHTML = chips(ITER, "p", st.p, "sr-pre ln-scroll") + chips(METH, "m", st.m) +
      slider("w", "ตัวประกอบผ่อนปรน ω (ใช้กับ SOR)", 0.05, 1.95, 0.05, st.w) + slider("t", "เกณฑ์หยุด ‖Δx‖/‖x‖ <", 2, 10, 1, st.t) +
      '<div class="ln-ibadge" aria-live="polite"></div>' +
      '<div class="sr-two"><div><div class="ln-iplot"></div><div class="ln-tip" hidden></div><div class="ln-geo"></div></div><div class="ln-itab"></div></div>' +
      '<details class="mc-det"><summary>สแกนหา ω ที่ดีที่สุดของ SOR</summary><div class="ln-wscan"></div></details>';
    var plot = box.querySelector(".ln-iplot"), tab = box.querySelector(".ln-itab"), geo = box.querySelector(".ln-geo"), badge = box.querySelector(".ln-ibadge"), wscan = box.querySelector(".ln-wscan"), tip = box.querySelector(".ln-tip");
    var last = null;
    function sysOf(P) { if (P.tri) { var T = tri(P.tri); return { A: T.A, b: T.b, x0: T.b.map(function () { return 0; }) }; } return { A: P.A, b: P.b, x0: P.x0 }; }
    function draw() {
      var P = ITER.filter(function (q) { return q.id === st.p; })[0], S = sysOf(P), n = S.b.length, tol = Math.pow(10, -st.t), xs = solveExact(S.A, S.b);
      var runs = {}, maxit = 600;
      METH.forEach(function (M) { runs[M.id] = iterRun(S.A, S.b, S.x0, M.id, st.w, tol, maxit, xs); });
      var rho = {}; METH.forEach(function (M) { rho[M.id] = specRad(iterMatrix(S.A, M.id, st.w)); });
      var dd = diagDom(S.A);
      badge.innerHTML = '<p class="lap-note">' + (dd ? flag(true, "ทแยงเด่นแท้ทุกแถว → จาโคบีและเกาส์-ไซเดลลู่เข้าแน่นอน") : flag(false, "ไม่ทแยงเด่น → ไม่รับประกันการลู่เข้า")) + "</p>" +
        '<div class="ln-rho">' + METH.map(function (M) { var R = runs[M.id]; return '<span class="ln-rc"><i class="ln-key ln-key-' + M.id + '"></i><b>' + (M.id === "sor" ? "SOR ω=" + st.w.toFixed(2) : M.id === "gs" ? "เกาส์-ไซเดล" : "จาโคบี") + "</b> ρ(T) ≈ " + rho[M.id].toFixed(3) + " · " + (R.conv ? R.k + " รอบ" : R.div ? "ลู่ออก" : "> " + maxit + " รอบ") + "</span>"; }).join("") + "</div>";
      // convergence plot
      var kmax = 2; METH.forEach(function (M) { kmax = Math.max(kmax, Math.min(runs[M.id].k, 400)); });
      var series = [], ymin = Math.log10(tol) - 1, ymax = 1;
      METH.forEach(function (M) {
        var pts = runs[M.id].err.slice(0, 401).map(function (e, k) { return [k, Math.log10(Math.max(e, 1e-16))]; });
        pts.forEach(function (p) { if (isFinite(p[1])) ymax = Math.max(ymax, Math.min(p[1], 8)); });
        series.push({ pts: pts, color: MCOL[M.id].c, dash: MCOL[M.id].dash, width: M.id === st.m ? 3 : MCOL[M.id].w });
      });
      ymin = Math.max(ymin, -16);
      plot.innerHTML = '<p class="ln-cap">ความคลาดเคลื่อน ‖x⁽ᵏ⁾ − x*‖∞ (สเกล log) · เส้นหนาคือวิธีที่เลือก</p>' + plotIn(plot, { w: 460, h: 250, xmin: 0, xmax: kmax, ymin: ymin, ymax: ymax + 0.3, series: series,
        hlines: [{ y: Math.log10(tol), color: "var(--ink-3)", label: "เกณฑ์" }], xlabel: "รอบที่ k", ylabel: "log₁₀ error", id: MK().uid("lni"), label: "error versus iteration for Jacobi, Gauss–Seidel and SOR" }) +
        '<div class="ln-legend">' + METH.map(function (M) { return '<span><i class="ln-key ln-key-' + M.id + '"></i>' + M.l + "</span>"; }).join("") + "</div>";
      last = { runs: runs, map: MK().lastMap(), kmax: kmax };
      // table of the selected method
      var R = runs[st.m], H = R.hist, show = [], nshow = Math.min(n, 4);
      for (var k = 0; k < H.length; k++) if (k < 8 || k >= H.length - 2) show.push(k);
      tab.innerHTML = '<div class="table-wrap"><table class="lap-pt ln-it"><thead><tr><th>k</th>' + H[0].slice(0, nshow).map(function (_, i) { return "<th>x" + sub(i + 1) + "</th>"; }).join("") + (n > nshow ? "<th>…</th>" : "") + "<th>‖Δx‖∞</th></tr></thead><tbody>" +
        show.map(function (k, idx) { return (idx > 0 && k - show[idx - 1] > 1 ? '<tr><td colspan="' + (nshow + 3) + '" class="ln-gap">⋮</td></tr>' : "") + "<tr" + (k === R.k && R.conv ? ' class="in"' : "") + "><td>" + k + "</td>" + H[k].slice(0, nshow).map(function (v) { return "<td>" + fmt(v, 7) + "</td>"; }).join("") + (n > nshow ? "<td></td>" : "") + "<td>" + (k ? fmt(R.dx[k], 3) : "—") + "</td></tr>"; }).join("") +
        "</tbody></table></div><p class=\"lap-help\">คำตอบจริง x* = (" + xs.slice(0, nshow).map(function (v) { return fmt(v, 6); }).join(", ") + (n > nshow ? ", …" : "") + ")" + (R.conv ? " · หยุดที่รอบ " + R.k : R.div ? " · ค่าโตขึ้นเรื่อย ๆ (ลู่ออก)" : "") + "</p>";
      // geometry for 2×2
      if (n === 2) {
        var lo = -1.5, hi = 4.5, lines = [];
        S.A.forEach(function (r, i) {
          var pts = [];
          if (Math.abs(r[1]) > 1e-12) { for (var q = 0; q <= 1; q++) { var X = lo + (hi - lo) * q; pts.push([X, (S.b[i] - r[0] * X) / r[1]]); } }
          lines.push({ pts: pts, color: "var(--ink-3)", width: 1.6 });
        });
        var path = R.hist.slice(0, 30).map(function (v) { return [v[0], v[1]]; }), segs = [];
        for (k = 1; k < path.length; k++) segs.push({ x1: path[k - 1][0], y1: path[k - 1][1], x2: path[k][0], y2: path[k][1], color: MCOL[st.m].c, width: 1.8 });
        geo.innerHTML = '<p class="ln-cap">ภาพเรขาคณิต: เส้นตรงสองเส้นและเส้นทางของค่าประมาณ (' + METH.filter(function (M) { return M.id === st.m; })[0].l + ")</p>" +
          plotIn(geo, { w: 360, h: 300, xmin: lo, xmax: hi, ymin: lo, ymax: hi, series: lines, segs: segs, marks: path.slice(0, 12).map(function (p, i) { return { x: p[0], y: p[1], r: i ? 3.2 : 4.5, color: MCOL[st.m].c, open: i === 0 }; }).concat([{ x: xs[0], y: xs[1], r: 5.5, color: "var(--ink)", label: "คำตอบ" }]), xlabel: "x₁", ylabel: "x₂", id: MK().uid("lng"), label: "two lines and the iterates" }) +
          '<p class="lap-help">เกาส์-ไซเดลเดินเป็นขั้นบันได แกนละครั้ง: ปรับ x₁ ให้อยู่บนเส้นแรก แล้วปรับ x₂ ให้อยู่บนเส้นที่สอง ถ้าสลับสมการ ขั้นบันไดจะเดินออกห่างคำตอบ</p>';
      } else geo.innerHTML = "";
      // ω scan (lazy)
      if (box.querySelector("details.mc-det").open) scan(S, tol, xs);
    }
    function scan(S, tol, xs) {
      var pts = [], best = { w: 1, k: Infinity };
      for (var w = 0.05; w <= 1.951; w += 0.05) { var R = iterRun(S.A, S.b, S.x0, "sor", w, tol, 600, null); var kk = R.conv ? R.k : 600; pts.push([w, kk]); if (kk < best.k) best = { w: w, k: kk }; }
      wscan.innerHTML = plotIn(wscan, { w: 460, h: 200, xmin: 0, xmax: 2, ymin: 0, ymax: Math.min(600, Math.max.apply(null, pts.map(function (p) { return p[1]; })) * 1.1 + 1), series: [{ pts: pts, color: "var(--ok)", width: 2.2 }],
        vlines: [{ x: st.w, color: "var(--accent)", label: "ω = " + st.w.toFixed(2) }, { x: 1, color: "var(--ink-3)", label: "GS" }], marks: [{ x: best.w, y: best.k, color: "var(--ok)", label: "ดีที่สุด ω ≈ " + best.w.toFixed(2) + " (" + best.k + " รอบ)" }],
        xlabel: "ω", ylabel: "รอบที่ใช้", id: MK().uid("lnw"), label: "iterations versus relaxation factor" }) +
        '<p class="lap-help">ω = 1 คือเกาส์-ไซเดล · 1 < ω < 2 คือผ่อนปรนเกิน (over-relaxation) · ω ≥ 2 ลู่ออกเสมอ · ระบบแท่งความร้อน 10×10 มี ω ที่ดีที่สุด = 2/(1 + sin(π/11)) ≈ 1.56</p>';
    }
    box.querySelector("details.mc-det").addEventListener("toggle", function () { if (this.open) draw(); });
    plot.addEventListener("pointermove", function (e) {
      if (!last || !last.map) return;
      var svgEl = plot.querySelector("svg"); if (!svgEl) return;
      var pt = MK().svgPoint(svgEl, e), k = Math.round(last.map.ix(pt.x));
      if (k < 0 || k > last.kmax) { tip.hidden = true; return; }
      tip.hidden = false;
      tip.innerHTML = "<b>รอบ " + k + "</b> " + METH.map(function (M) { var er = last.runs[M.id].err[k]; return '<span><i class="ln-key ln-key-' + M.id + '"></i>' + (er == null ? "หยุดแล้ว" : fmt(er, 3)) + "</span>"; }).join("");
    });
    plot.addEventListener("pointerleave", function () { tip.hidden = true; });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (b) { st.p = b.getAttribute("data-p"); setOn(box, "p", st.p); draw(); return; }
      var m = e.target.closest("[data-m]"); if (m) { st.m = m.getAttribute("data-m"); setOn(box, "m", st.m); draw(); }
    });
    bindSliders(box, st, draw, show);
    box._set = function (o) { if (o.p) { st.p = o.p; setOn(box, "p", st.p); } if (o.method) { st.m = o.method; setOn(box, "m", st.m); } if (o.w != null) { st.w = o.w; setSlider(box, "w", o.w, show); } draw(); };
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 7. condition number
  function hilbertCond(n) {
    var H = []; for (var i = 0; i < n; i++) { H.push([]); for (var j = 0; j < n; j++) H[i].push(new Q(1, i + j + 1)); }
    var Hi = invQ(H), ninf = function (M) { return M.reduce(function (m, r) { var s = r.reduce(function (a, v) { return a.add(v.abs()); }, ZERO); return s.num() > m.num() ? s : m; }, ZERO); };
    return ninf(H).mul(ninf(Hi));
  }
  function initCond(box) {
    var st = { t: -1.3, dl: 0.02 };
    var mOf = function (t) { return 1 + Math.pow(10, t); };
    var show = { t: function (v) { return "m = " + fmt(mOf(v), 6); }, dl: function (v) { return (v >= 0 ? "+" : "") + v.toFixed(3); } };
    box.innerHTML = '<div class="lap-eq ln-ceq"></div>' + slider("t", "ความชันเส้นที่สอง (m → 1 = ขนานกันมากขึ้น)", -4, 0.3, 0.05, st.t) + slider("dl", "รบกวนค่าทางขวา δ ของสมการที่ 2", -0.1, 0.1, 0.005, st.dl) +
      '<div class="sr-two"><div class="ln-cplot"></div><div class="ln-cinfo" aria-live="polite"></div></div>' +
      '<details class="mc-det"><summary>เมทริกซ์ฮิลเบิร์ต: เลขเงื่อนไขโตเร็วแค่ไหน</summary><div class="ln-hil"></div></details>';
    var plot = box.querySelector(".ln-cplot"), info = box.querySelector(".ln-cinfo"), eq = box.querySelector(".ln-ceq");
    function draw() {
      var m = mOf(st.t), dl = st.dl, kap = (m + 1) * (m + 1) / (m - 1);
      var shift = dl / (m - 1), xn = 1 - shift, yn = 1 + shift;
      eq.innerHTML = tex("\\begin{aligned} x + y &= 2 \\\\ x + " + fmt(m, 6) + "\\,y &= " + fmt(1 + m, 7) + (dl ? (dl > 0 ? " + " : " - ") + Math.abs(dl).toFixed(3) : "") + "\\end{aligned}", true);
      var lo = -1, hi = 3, pts = function (a, c, rhs) { return [[lo, (rhs - a * lo) / c], [hi, (rhs - a * hi) / c]]; };
      var out = Math.max(Math.abs(xn - 1), Math.abs(yn - 1)) > 1.9;
      plot.innerHTML = plotIn(plot, { w: 380, h: 320, xmin: lo, xmax: hi, ymin: lo, ymax: hi, series: [
        { pts: pts(1, 1, 2), color: "var(--signal)", width: 2 }, { pts: pts(1, m, 1 + m), color: "var(--accent)", width: 2 }, { pts: pts(1, m, 1 + m + dl), color: "var(--accent)", width: 1.6, dash: "5 4" }],
        marks: [{ x: 1, y: 1, color: "var(--ink)", label: "เดิม (1, 1)" }].concat(out ? [] : [{ x: xn, y: yn, color: "var(--accent)", open: true, label: "ใหม่" }]), xlabel: "x", ylabel: "y", id: MK().uid("lnc"), label: "two nearly parallel lines and the moved intersection" }) +
        '<div class="ln-legend"><span><i class="ln-key ln-key-jacobi" style="border-top-style:solid"></i>x + y = 2</span><span><i class="ln-key ln-key-gs"></i>สมการที่ 2</span><span><i class="ln-key ln-key-gs" style="border-top-style:dashed"></i>หลังรบกวน δ</span></div>';
      var relb = Math.abs(dl) / (1 + m), relx = Math.abs(shift);
      info.innerHTML = '<p class="ln-big">κ∞(A) = ' + fmt(kap, 4) + "</p>" +
        '<div class="table-wrap"><table class="lap-pt"><tbody>' +
        "<tr><td>จุดตัดใหม่</td><td>(" + fmt(xn, 6) + ", " + fmt(yn, 6) + ")" + (out ? " <b>หลุดกรอบภาพ</b>" : "") + "</td></tr>" +
        "<tr><td>‖δb‖/‖b‖</td><td>" + fmt(relb, 3) + "</td></tr>" +
        "<tr><td>‖δx‖/‖x‖</td><td>" + fmt(relx, 3) + "</td></tr>" +
        "<tr><td>ขยายความคลาดเคลื่อน</td><td>" + (relb ? fmt(relx / relb, 4) + " เท่า" : "—") + " (ไม่เกิน κ)</td></tr>" +
        "<tr><td>หลักที่อาจเสีย</td><td>≈ log₁₀ κ = " + Math.log10(kap).toFixed(1) + " หลัก</td></tr>" +
        "</tbody></table></div>" +
        '<p class="lap-help">' + tex("\\dfrac{\\lVert\\delta\\mathbf x\\rVert}{\\lVert\\mathbf x\\rVert} \\le \\kappa(A)\\,\\dfrac{\\lVert\\delta\\mathbf b\\rVert}{\\lVert\\mathbf b\\rVert}") + " · เส้นยิ่งขนาน det = m − 1 ยิ่งเล็ก κ ยิ่งโต ข้อมูลผิดนิดเดียวคำตอบเปลี่ยนมาก (ระบบป่วย ill-conditioned)</p>";
    }
    box.querySelector("details").addEventListener("toggle", function () {
      if (!this.open || this._done) return; this._done = true;
      var rows = "";
      for (var n = 2; n <= 10; n++) { var k = hilbertCond(n).num(); rows += "<tr><td>" + n + "</td><td>" + fmt(k, 4) + "</td><td>" + Math.log10(k).toFixed(1) + "</td></tr>"; }
      box.querySelector(".ln-hil").innerHTML = '<div class="table-wrap"><table class="lap-pt"><thead><tr><th>n</th><th>κ∞(Hₙ) คำนวณแม่นตรง</th><th>หลักที่เสีย</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
        '<p class="lap-help">Hᵢⱼ = 1/(i + j − 1) ดูไม่มีพิษภัย แต่ H₁₀ มี κ ≈ 3.5 × 10¹³ คอมพิวเตอร์ double เก็บราว 16 หลัก จึงเหลือหลักที่เชื่อได้เพียง 2–3 หลัก</p>';
    });
    bindSliders(box, st, draw, show);
    box._redraw = draw;
    draw();
  }

  // ======================================================================= 8. heat plate (Laplace) by relaxation
  function heatSweep(T, N, bc, method, w) {
    var maxd = 0, old = method === "jacobi" ? T.map(function (r) { return r.slice(); }) : T;
    var val = function (G, i, j) {
      if (i < 0) return bc.top; if (i >= N) return bc.bottom; if (j < 0) return bc.left; if (j >= N) return bc.right; return G[i][j];
    };
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
      var src = method === "jacobi" ? old : T;
      var avg = (val(src, i - 1, j) + val(src, i + 1, j) + val(src, i, j - 1) + val(src, i, j + 1)) / 4;
      var nv = method === "sor" ? T[i][j] + w * (avg - T[i][j]) : avg;
      maxd = Math.max(maxd, Math.abs(nv - T[i][j]));
      T[i][j] = nv;
    }
    return maxd;
  }
  function heatCount(N, bc, method, w, tol) {
    var T = []; for (var i = 0; i < N; i++) { T.push([]); for (var j = 0; j < N; j++) T[i].push(0); }
    for (var k = 1; k <= 5000; k++) if (heatSweep(T, N, bc, method, w) < tol) return k;
    return Infinity;
  }
  function initHeat(box) {
    var st = { N: 12, top: 100, bottom: 0, left: 25, right: 50, m: "gs", w: 1.6, it: 0, run: false };
    var T = [];
    function reset() { T = []; for (var i = 0; i < st.N; i++) { T.push([]); for (var j = 0; j < st.N; j++) T[i].push(0); } st.it = 0; st.d = NaN; }
    box.innerHTML = '<div class="ln-hbc">' + slider("top", "ขอบบน °C", 0, 100, 5, st.top) + slider("bottom", "ขอบล่าง °C", 0, 100, 5, st.bottom) + slider("left", "ขอบซ้าย °C", 0, 100, 5, st.left) + slider("right", "ขอบขวา °C", 0, 100, 5, st.right) + "</div>" +
      chips(METH, "m", st.m) + slider("w", "ω ของ SOR", 1, 1.95, 0.05, st.w) +
      chips([{ id: 8, l: "8×8 = 64 สมการ" }, { id: 12, l: "12×12 = 144 สมการ" }, { id: 20, l: "20×20 = 400 สมการ" }], "n", st.N) +
      '<div class="lap-row"><button type="button" class="btn btn-primary btn-sm" data-act="run">▶ เริ่ม</button><button type="button" class="btn btn-ghost btn-sm" data-act="one">+1 รอบ</button><button type="button" class="btn btn-ghost btn-sm" data-act="reset">↺ เริ่มใหม่</button><span class="ln-hstat mono" aria-live="polite"></span></div>' +
      '<div class="sr-two"><div class="ln-hgrid"></div><div class="ln-hinfo"></div></div>';
    var grid = box.querySelector(".ln-hgrid"), stat = box.querySelector(".ln-hstat"), info = box.querySelector(".ln-hinfo"), runBtn = box.querySelector('[data-act="run"]');
    var tol = 1e-3, raf = 0;
    function paint() {
      var N = st.N, S = 320, c = S / (N + 2), s = '<svg class="ln-heat-svg" viewBox="0 0 ' + S + " " + S + '" role="img" aria-label="temperature on a plate">';
      var cell = function (x, y, v, title) { return '<rect x="' + (x * c).toFixed(2) + '" y="' + (y * c).toFixed(2) + '" width="' + (c - 0.6).toFixed(2) + '" height="' + (c - 0.6).toFixed(2) + '" style="fill:color-mix(in oklab, var(--accent) ' + Math.round(v) + '%, var(--paper))"><title>' + title + "</title></rect>"; };
      for (var j = 0; j < N; j++) { s += cell(j + 1, 0, st.top, "ขอบบน " + st.top + " °C"); s += cell(j + 1, N + 1, st.bottom, "ขอบล่าง " + st.bottom + " °C"); }
      for (var i = 0; i < N; i++) { s += cell(0, i + 1, st.left, "ขอบซ้าย " + st.left + " °C"); s += cell(N + 1, i + 1, st.right, "ขอบขวา " + st.right + " °C"); }
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) s += cell(j + 1, i + 1, T[i][j], "โหนด (" + (i + 1) + ", " + (j + 1) + ") = " + T[i][j].toFixed(2) + " °C");
      s += '<rect class="ln-hframe" x="' + c.toFixed(2) + '" y="' + c.toFixed(2) + '" width="' + (N * c).toFixed(2) + '" height="' + (N * c).toFixed(2) + '"/></svg>';
      s += '<div class="ln-hscale"><span>0 °C</span><i></i><span>100 °C</span></div>';
      grid.innerHTML = s;
      var mid = T[Math.floor(N / 2)][Math.floor(N / 2)];
      stat.textContent = "รอบที่ " + st.it + " · เปลี่ยนสูงสุด " + (isFinite(st.d) ? st.d.toFixed(4) : "—") + " °C · กลางแผ่น " + mid.toFixed(2) + " °C";
    }
    function counts() {
      var bc = { top: st.top, bottom: st.bottom, left: st.left, right: st.right }, N = st.N;
      var cJ = heatCount(N, bc, "jacobi", 1, tol), cG = heatCount(N, bc, "gs", 1, tol), cS = heatCount(N, bc, "sor", st.w, tol), wopt = 2 / (1 + Math.sin(Math.PI / (N + 1)));
      var cO = heatCount(N, bc, "sor", wopt, tol);
      info.innerHTML = '<p class="lap-note">สมการต่อโหนด: ' + tex("T_{i,j} = \\tfrac14\\left(T_{i-1,j} + T_{i+1,j} + T_{i,j-1} + T_{i,j+1}\\right)") + "</p>" +
        '<div class="table-wrap"><table class="lap-pt"><thead><tr><th>วิธี</th><th>รอบจนเปลี่ยน &lt; 0.001 °C</th></tr></thead><tbody>' +
        "<tr><td>จาโคบี</td><td>" + cJ + "</td></tr><tr><td>เกาส์-ไซเดล</td><td>" + cG + "</td></tr><tr><td>SOR ω = " + st.w.toFixed(2) + "</td><td>" + (isFinite(cS) ? cS : "ลู่ออก/ช้า") + "</td></tr><tr class=\"in\"><td>SOR ω* ≈ " + wopt.toFixed(3) + "</td><td>" + cO + "</td></tr></tbody></table></div>" +
        '<p class="lap-help">ระบบนี้มี ' + N * N + " ตัวแปร ถ้าใช้เกาส์แบบเต็มต้องคูณราว " + Math.round(Math.pow(N * N, 3) / 3).toLocaleString("en-US") + " ครั้ง แต่รอบหนึ่งของวิธีทำซ้ำใช้แค่ราว " + (5 * N * N).toLocaleString("en-US") + " ครั้ง และไม่ต้องเก็บเมทริกซ์เลย นี่คือเหตุผลที่โปรแกรม FEM และจำลองวงจรขนาดใหญ่ใช้วิธีทำซ้ำ</p>";
    }
    function step(n) {
      var bc = { top: st.top, bottom: st.bottom, left: st.left, right: st.right };
      for (var q = 0; q < n; q++) { st.d = heatSweep(T, st.N, bc, st.m, st.w); st.it++; if (st.d < tol) { stop(); break; } }
      paint();
    }
    function loop() { if (!st.run) return; step(1); if (st.run) raf = root.requestAnimationFrame(loop); }
    function stop() { st.run = false; runBtn.textContent = "▶ เริ่ม"; if (raf) root.cancelAnimationFrame(raf); }
    box.addEventListener("click", function (e) {
      var a = e.target.closest("[data-act]");
      if (a) {
        var act = a.getAttribute("data-act");
        if (act === "run") { if (st.run) stop(); else { if (st.d < tol) reset(); st.run = true; runBtn.textContent = "⏸ หยุด"; loop(); } }
        else if (act === "one") { stop(); step(1); }
        else { stop(); reset(); paint(); }
        return;
      }
      var m = e.target.closest("[data-m]"); if (m) { st.m = m.getAttribute("data-m"); setOn(box, "m", st.m); return; }
      var nb = e.target.closest("[data-n]"); if (nb) { stop(); st.N = +nb.getAttribute("data-n"); setOn(box, "n", st.N); reset(); paint(); counts(); }
    });
    bindSliders(box, st, function () { paint(); counts(); });
    reset(); paint(); counts();
  }

  // ======================================================================= 9. exam drill
  function randMat(n, lo, hi) { var M = []; for (var i = 0; i < n; i++) { M.push([]); for (var j = 0; j < n; j++) M[i].push(rnd(lo, hi)); } return M; }
  function mtex(M, v) { return "\\begin{" + (v || "pmatrix") + "}" + M.map(function (r) { return r.map(function (x) { return typeof x === "number" ? String(x) : x.tex ? x.tex() : x; }).join(" & "); }).join(" \\\\ ") + "\\end{" + (v || "pmatrix") + "}"; }
  function toQ(M) { return M.map(function (r) { return r.map(function (v) { return qi(v); }); }); }
  function sysTex(A, b) {
    var vars = ["x", "y", "z", "w"];
    return "\\begin{aligned}" + A.map(function (r, i) {
      var s = "";
      r.forEach(function (a, j) { if (!a) return; var mag = Math.abs(a), t = (mag === 1 ? "" : mag) + vars[j]; s += (s ? (a < 0 ? " - " : " + ") : (a < 0 ? "-" : "")) + t; });
      return (s || "0") + " &= " + b[i];
    }).join(" \\\\ ") + "\\end{aligned}";
  }
  var DRILL = {
    det2: { lv: 1, l: "det 2×2", gen: function () {
      var A = randMat(2, -6, 9), d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      return { q: "หา \\(\\det A\\) เมื่อ \\(A = " + mtex(A) + "\\)", ans: qi(d), sol: "\\det A = (" + A[0][0] + ")(" + A[1][1] + ") - (" + A[0][1] + ")(" + A[1][0] + ") = " + d };
    } },
    det3: { lv: 1, l: "det 3×3", gen: function () {
      var A = randMat(3, -3, 4), d = detQ(toQ(A));
      var t1 = A[0][0] * A[1][1] * A[2][2] + A[0][1] * A[1][2] * A[2][0] + A[0][2] * A[1][0] * A[2][1], t2 = A[0][2] * A[1][1] * A[2][0] + A[0][0] * A[1][2] * A[2][1] + A[0][1] * A[1][0] * A[2][2];
      return { q: "หา \\(\\det A\\) เมื่อ \\(A = " + mtex(A) + "\\)", ans: d, sol: "\\text{ซาร์รัส: ลงขวา } " + t1 + ",\\ \\text{ขึ้นขวา } " + t2 + "\\ \\Rightarrow\\ \\det A = " + t1 + " - (" + t2 + ") = " + d.tex() };
    } },
    inv2: { lv: 1, l: "อินเวอร์ส 2×2", gen: function () {
      var A, d; do { A = randMat(2, -5, 7); d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; } while (!d || Math.abs(d) > 12);
      var i = rnd(0, 1), j = rnd(0, 1), adj = [[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]], v = new Q(adj[i][j], d);
      return { q: "ให้ \\(A = " + mtex(A) + "\\) หาสมาชิกแถว " + (i + 1) + " หลัก " + (j + 1) + " ของ \\(A^{-1}\\)", ans: v, sol: "A^{-1} = \\frac{1}{" + d + "}" + mtex(adj) + "\\ \\Rightarrow\\ (A^{-1})_{" + (i + 1) + (j + 1) + "} = " + v.tex() };
    } },
    detprop: { lv: 2, l: "สมบัติ det", gen: function () {
      var n = pick([2, 3, 3, 4]), dA = pick([-3, -2, 2, 3, 5]), k = pick([2, 3, -1, -2]), D = qi(dA), kt = k === -1 ? "-" : String(k);
      var forms = [
        { t: "\\det(" + kt + "A)", v: qi(Math.pow(k, n)).mul(D), s: "\\det(kA) = k^n\\det A = (" + k + ")^{" + n + "}(" + dA + ")" },
        { t: "\\det(A^{-1})", v: ONE.div(D), s: "\\det(A^{-1}) = \\frac{1}{\\det A} = \\frac{1}{" + dA + "}" },
        { t: "\\det(\\operatorname{adj}A)", v: new Q(BigInt(dA) ** BigInt(n - 1)), s: "\\det(\\operatorname{adj}A) = (\\det A)^{n-1} = (" + dA + ")^{" + (n - 1) + "}" },
        { t: "\\det(" + kt + "A^{T}A^{-1})", v: qi(Math.pow(k, n)), s: "\\det(kA^TA^{-1}) = k^n\\det A^T\\cdot\\frac{1}{\\det A} = (" + k + ")^{" + n + "}" },
        { t: "\\det(A^{3})", v: new Q(BigInt(dA) ** 3n), s: "\\det(A^3) = (\\det A)^3 = (" + dA + ")^3" },
        { t: "\\det(" + kt + "\\operatorname{adj}A)", v: qi(Math.pow(k, n)).mul(new Q(BigInt(dA) ** BigInt(n - 1))), s: "\\det(k\\operatorname{adj}A) = k^n(\\det A)^{n-1} = (" + k + ")^{" + n + "}(" + dA + ")^{" + (n - 1) + "}" }
      ], f = pick(forms);
      return { q: "\\(A\\) เป็นเมทริกซ์ \\(" + n + "\\times" + n + "\\) ที่ \\(\\det A = " + dA + "\\) จงหา \\(" + f.t + "\\)", ans: f.v, sol: f.s + " = " + f.v.tex() };
    } },
    cramer: { lv: 2, l: "คราเมอร์ หาตัวแปรเดียว", gen: function () {
      var A, d, x; do { A = randMat(3, -3, 4); d = detQ(toQ(A)); } while (d.isZero() || Math.abs(d.num()) > 40);
      x = [rnd(-3, 4), rnd(-3, 4), rnd(-3, 4)];
      var b = A.map(function (r) { return r[0] * x[0] + r[1] * x[1] + r[2] * x[2]; }), v = rnd(0, 2), names = ["x", "y", "z"];
      var Av = A.map(function (r, i) { var t = r.slice(); t[v] = b[i]; return t; }), dv = detQ(toQ(Av));
      return { q: "ใช้กฎของคราเมอร์หา \\(" + names[v] + "\\) จากระบบ \\(" + sysTex(A, b) + "\\)", ans: qi(x[v]), sol: "\\Delta = " + d.tex() + ",\\ \\Delta_{" + names[v] + "} = \\det" + mtex(Av) + " = " + dv.tex() + "\\ \\Rightarrow\\ " + names[v] + " = \\frac{" + dv.tex() + "}{" + d.tex() + "} = " + x[v] };
    } },
    rank: { lv: 2, l: "หาแรงก์", gen: function () {
      var r = pick([1, 2, 2, 3]), m = 3, n = pick([3, 4]), B, C, M, rr;
      do {
        B = []; C = [];
        for (var i = 0; i < m; i++) { B.push([]); for (var j = 0; j < r; j++) B[i].push(rnd(-2, 2)); }
        for (i = 0; i < r; i++) { C.push([]); for (j = 0; j < n; j++) C[i].push(rnd(-2, 3)); }
        M = B.map(function (row) { return C[0].map(function (_, j) { var s = 0; for (var k = 0; k < r; k++) s += row[k] * C[k][j]; return s; }); });
        rr = rankOf(toQ(M));
      } while (rr !== r || M.some(function (row) { return row.some(function (v) { return Math.abs(v) > 12; }); }));
      var R = ref(toQ(M));
      return { q: "หาแรงก์ของ \\(" + mtex(M) + "\\)", ans: qi(r), sol: "\\text{ลดแถวเป็นขั้นบันได: } " + mtex(R.M.map(function (row) { return row.map(function (v) { return v.tex(); }); })) + "\\ \\Rightarrow\\ \\text{แถวไม่เป็นศูนย์ } " + r + " \\text{ แถว}" };
    } },
    krank: { lv: 3, l: "พารามิเตอร์ k", gen: function () {
      var p = rnd(-3, 3), q; do { q = rnd(-3, 4); } while (q === p);
      return { q: "ให้ \\(A = " + mtex([[1, 1, 1], [p, q, "k"], [p * p, q * q, "k^2"]]) + "\\) ผลบวกของค่า \\(k\\) ทั้งหมดที่ทำให้ \\(A\\) ไม่มีอินเวอร์สเท่ากับเท่าใด", ans: qi(p + q), sol: "\\text{แวนเดอร์มอนด์: } \\det A = (" + q + " - (" + p + "))(k - (" + p + "))(k - " + q + ")\\ \\Rightarrow\\ k = " + p + ",\\ " + q + "\\ \\Rightarrow\\ \\text{ผลบวก } " + (p + q) };
    } },
    sysk: { lv: 3, l: "ระบบไม่มีคำตอบ", gen: function () {
      var c = pick([4, 9, 16, 25]), s = Math.sqrt(c), m = pick([2, 3]), r1 = rnd(1, 5);
      // kx + m s y = r1 ;  m s x + k y = r1*? → det = k² − m² s²; choose rhs so one root gives none
      var a = m * s, rhs2 = r1 * 2 + 1;
      return { q: "หาค่า \\(k\\) ที่ทำให้ระบบ \\(\\begin{aligned} kx + " + a + "y &= " + r1 + " \\\\ " + a + "x + ky &= " + rhs2 + "\\end{aligned}\\) ไม่มีคำตอบ (ถ้ามีสองค่า ตอบผลคูณ)", ans: qi(-a * a),
        sol: "\\Delta = k^2 - " + a * a + " = 0 \\Rightarrow k = \\pm" + a + "\\text{ ทั้งสองค่าเส้นขนาน ค่าคงที่ไม่เป็นสัดส่วนเดียวกันจึงไม่มีคำตอบทั้งคู่ (ตรวจ: } " + r1 + "/" + rhs2 + " \\ne \\pm1)\\Rightarrow\\ \\text{ผลคูณ } = " + (-a * a) };
    } },
    jac: { lv: 3, l: "จาโคบี/เกาส์-ไซเดล 1 รอบ", gen: function () {
      var A = [], x = [rnd(-2, 3), rnd(-2, 3), rnd(-2, 3)];
      for (var i = 0; i < 3; i++) { var row = [rnd(-2, 2), rnd(-2, 2), rnd(-2, 2)], s = Math.abs(row[0]) + Math.abs(row[1]) + Math.abs(row[2]) - Math.abs(row[i]); row[i] = pick([1, -1]) * (s + rnd(2, 5)); A.push(row); }
      var b = A.map(function (r) { return r[0] * x[0] + r[1] * x[1] + r[2] * x[2]; }), meth = pick(["jacobi", "gs"]), comp = rnd(1, 2), names = ["x", "y", "z"];
      var Aq = toQ(A), bq = b.map(qi), y = [ZERO, ZERO, ZERO];
      for (i = 0; i < 3; i++) { var acc = bq[i]; for (var j = 0; j < 3; j++) if (j !== i) acc = acc.sub(Aq[i][j].mul(meth === "gs" ? y[j] : ZERO)); y[i] = acc.div(Aq[i][i]); }
      return { q: "เริ่มที่ \\(\\mathbf x^{(0)} = (0, 0, 0)\\) ทำ" + (meth === "gs" ? "เกาส์-ไซเดล" : "จาโคบี") + " 1 รอบกับระบบ \\(" + sysTex(A, b) + "\\) ค่า \\(" + names[comp] + "^{(1)}\\) เท่าใด", ans: y[comp],
        sol: "x^{(1)} = " + y[0].tex() + ",\\ y^{(1)} = " + y[1].tex() + ",\\ z^{(1)} = " + y[2].tex() + (meth === "gs" ? "\\ \\text{(เกาส์-ไซเดลใช้ค่าใหม่ทันที)}" : "\\ \\text{(จาโคบีใช้ค่าเก่าทั้งหมด } = 0)") };
    } },
    cond: { lv: 3, l: "เลขเงื่อนไข κ∞", gen: function () {
      var A, d; do { A = randMat(2, -4, 6); d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; } while (!d);
      var Aq = toQ(A), Ai = invQ(Aq), ninf = function (M) { return M.reduce(function (m, r) { var s = r.reduce(function (a, v) { return a.add(v.abs()); }, ZERO); return s.num() > m.num() ? s : m; }, ZERO); };
      var nA = ninf(Aq), nI = ninf(Ai), k = nA.mul(nI);
      return { q: "หา \\(\\kappa_\\infty(A) = \\lVert A\\rVert_\\infty\\lVert A^{-1}\\rVert_\\infty\\) เมื่อ \\(A = " + mtex(A) + "\\)", ans: k, sol: "\\lVert A\\rVert_\\infty = " + nA.tex() + "\\ (\\text{ผลรวมแถวมากสุด}),\\ A^{-1} = " + mtex(Ai.map(function (r) { return r.map(function (v) { return v.tex(); }); })) + ",\\ \\lVert A^{-1}\\rVert_\\infty = " + nI.tex() + "\\ \\Rightarrow\\ \\kappa = " + k.tex() };
    } }
  };
  function checkAns(input, ans) {
    var v;
    try { v = parseQ(input); } catch (e) { return null; }
    if (v.eq(ans)) return true;
    if (/\./.test(input)) { var a = ans.num(); return Math.abs(v.num() - a) <= Math.max(5e-3 * Math.abs(a), 5e-4); }
    return false;
  }
  function initDrill(box) {
    var st = { lv: 0, right: 0, total: 0, streak: 0, cur: null, done: false };
    try { var sv = JSON.parse(root.localStorage.getItem("ln-drill-v1") || "{}"); st.right = sv.right || 0; st.total = sv.total || 0; } catch (e) { /* storage blocked */ }
    var LV = [{ id: 0, l: "ทุกระดับ" }, { id: 1, l: "พื้นฐาน (เข้ามหาวิทยาลัย)" }, { id: 2, l: "กลาง (ป.ตรี)" }, { id: 3, l: "เข้มข้น" }];
    box.innerHTML = '<div class="lap-row">' + chips(LV, "lv", st.lv) + '<span class="sr-score mono" aria-live="polite"></span></div>' +
      '<div class="sr-dq ln-dq"></div><div class="lap-row"><label class="lap-lbl" for="lnAns' + (box.id || "") + '">คำตอบ</label><input class="lap-in sm" id="lnAns' + (box.id || "") + '" inputmode="text" autocomplete="off" placeholder="เช่น 12, -3/4, 0.25">' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="check">ตรวจ</button><button type="button" class="btn btn-ghost btn-sm" data-act="show">ดูเฉลย</button><button type="button" class="btn btn-ghost btn-sm" data-act="next">ข้อใหม่ →</button></div><div class="ln-dfb" aria-live="polite"></div>';
    var qEl = box.querySelector(".ln-dq"), inp = box.querySelector("input"), fb = box.querySelector(".ln-dfb"), score = box.querySelector(".sr-score");
    function paintScore() { score.textContent = "ถูก " + st.right + "/" + st.total + (st.streak > 1 ? " · ติดกัน " + st.streak : ""); }
    function save() { try { root.localStorage.setItem("ln-drill-v1", JSON.stringify({ right: st.right, total: st.total })); } catch (e) { /* ignore */ } }
    function render(el, s) { // text with \( \) inline math
      el.innerHTML = s.split(/(\\\(.*?\\\))/).map(function (part) { return /^\\\(/.test(part) ? tex(part.slice(2, -2)) : esc(part); }).join("");
    }
    function next() {
      var keys = Object.keys(DRILL).filter(function (k) { return !st.lv || DRILL[k].lv === st.lv; }), key = pick(keys), P = DRILL[key].gen();
      st.cur = P; st.done = false; P.key = key;
      qEl.innerHTML = '<p class="sr-qh"><span class="lv ' + ["", "lv-b", "lv-i", "lv-a"][DRILL[key].lv] + '">' + ["", "พื้นฐาน", "กลาง", "เข้มข้น"][DRILL[key].lv] + "</span> " + esc(DRILL[key].l) + '</p><div class="ln-qt"></div>';
      render(qEl.querySelector(".ln-qt"), P.q);
      inp.value = ""; fb.innerHTML = ""; paintScore();
    }
    function showSol(ok) {
      var P = st.cur;
      fb.innerHTML = (ok === true ? flag(true, "ถูกต้อง") : ok === false ? flag(false, "ยังไม่ถูก") : "") + ' <span class="lap-note">คำตอบ: <b>' + P.ans.html() + "</b>" + (P.ans.isInt() ? "" : " ≈ " + fmt(P.ans.num(), 6)) + '</span><div class="lap-eq">' + tex(P.sol, true) + "</div>";
    }
    box.addEventListener("click", function (e) {
      var l = e.target.closest("[data-lv]"); if (l) { st.lv = +l.getAttribute("data-lv"); setOn(box, "lv", st.lv); next(); return; }
      var a = e.target.closest("[data-act]"); if (!a) return;
      var act = a.getAttribute("data-act");
      if (act === "next") next();
      else if (act === "show") { showSol(null); if (!st.done) { st.done = true; st.total++; st.streak = 0; save(); paintScore(); } }
      else {
        var r = checkAns(inp.value, st.cur.ans);
        if (r === null) { fb.innerHTML = '<p class="lap-err">⚠ พิมพ์จำนวนเต็ม ทศนิยม หรือเศษส่วน เช่น -3/4</p>'; return; }
        if (!st.done) { st.done = true; st.total++; if (r) { st.right++; st.streak++; } else st.streak = 0; save(); }
        showSol(r); paintScore();
      }
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") box.querySelector('[data-act="check"]').click(); });
    next();
  }

  // ======================================================================= boot
  var INIT = { "ln-rank": initRank, "ln-krank": initKrank, "ln-planes": initPlanes, "ln-pivot": initPivot, "ln-lu": initLU, "ln-iter": initIter, "ln-cond": initCond, "ln-heat": initHeat, "ln-drill": initDrill };
  var lastW = [];
  function onResize() { $$(".ln-lab").forEach(function (box, i) { var w = box.clientWidth; if (box._redraw && Math.abs(w - (lastW[i] || w)) > 40) box._redraw(); lastW[i] = w; }); }
  function boot() {
    var rt = null;
    root.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(onResize, 250); });
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls).forEach(function (box) {
        if (box.__ln) return; box.__ln = true;
        box.classList.add("cl-lab", "sr-lab", "ln-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">แล็บโหลดไม่สำเร็จ: ' + esc(e.message) + "</p>"; if (root.console) console.error(e); }
      });
    });
    // labs inside a closed <details> were drawn at the default width; redraw them at the real width when opened
    document.addEventListener("toggle", function (e) {
      if (!e.target.open || !e.target.querySelectorAll) return;
      $$(".ln-lab", e.target).forEach(function (box) { if (box._redraw) box._redraw(); });
    }, true);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ln-set]"); if (!b) return;
      var box = document.getElementById(b.getAttribute("data-ln-target"));
      var dt = box && box.closest("details"); if (dt && !dt.open) dt.open = true;
      if (box && box._set) { try { box._set(JSON.parse(b.getAttribute("data-ln-set"))); } catch (er) { if (root.console) console.error(er); } box.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  }
  var API = { Q: Q, parseQ: parseQ, parseMatrix: parseMatrix, ref: ref, rrefFrom: rrefFrom, rankOf: rankOf, rankReport: rankReport, detQ: detQ, invQ: invQ, pDet: pDet, polyParse: polyParse, ratRoots: ratRoots,
    planePoly: planePoly, fl: fl, gaussFl: gaussFl, solveExact: solveExact, luExact: luExact, cholesky: cholesky, iterRun: iterRun, iterMatrix: iterMatrix, specRad: specRad, diagDom: diagDom, tri: tri,
    hilbertCond: hilbertCond, heatCount: heatCount, DRILL: DRILL, checkAns: checkAns, KPRE: KPRE, ITER: ITER };
  root.LANum = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (inBrowser) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot(); }
})(typeof window !== "undefined" ? window : globalThis);
