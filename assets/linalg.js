/* Linear algebra pages: formula search, practice mode, step reveal, formula index,
   matrix-product explainer, 2×2 transformation / eigen lab, and an exact-fraction matrix calculator with steps. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var art = $("laArticle");
  var MINUS = "−";
  var SUB = "₀₁₂₃₄₅₆₇₈₉";
  var sub = function (n) { return String(n).replace(/\d/g, function (d) { return SUB[+d]; }); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };

  // ======================================================================= formula filter (per page)
  (function () {
    var inp = $("tfFilter");
    if (!inp || !art) return;
    var secs = Array.prototype.slice.call(art.querySelectorAll(".tsec"));
    var hay = new Map();
    secs.forEach(function (sec) {
      sec.querySelectorAll(".tf").forEach(function (card) {
        var n = card.querySelector(".tf-n"), t = (card.getAttribute("data-k") || "") + " " + (card.id || "") + " " + (n ? n.textContent : "");
        card.querySelectorAll("annotation").forEach(function (a) { t += " " + a.textContent.replace(/\\[a-z]+/gi, function (w) { return " " + w.slice(1) + " "; }); });
        hay.set(card, t.toLowerCase());
      });
    });
    function run() {
      var terms = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) {
        art.classList.remove("is-filtering");
        secs.forEach(function (s) { s.hidden = false; s.classList.remove("tsec-all"); });
        art.querySelectorAll(".tf-off").forEach(function (c) { c.classList.remove("tf-off"); });
        $("tfCount").textContent = "";
        return;
      }
      art.classList.add("is-filtering");
      var total = 0;
      secs.forEach(function (sec) {
        var h2 = sec.querySelector("h2"), title = h2 ? h2.textContent.toLowerCase() : "";
        var all = terms.every(function (t) { return title.indexOf(t) >= 0; }), n = 0;
        sec.querySelectorAll(".tf").forEach(function (card) {
          var ok = all || terms.every(function (t) { return hay.get(card).indexOf(t) >= 0; });
          card.classList.toggle("tf-off", !ok);
          if (ok) n++;
        });
        sec.classList.toggle("tsec-all", all);
        sec.hidden = !all && n === 0;
        total += n;
      });
      $("tfCount").textContent = total ? "พบ " + total + " สูตร" : "ไม่พบในหน้านี้ ลองค้นทุกหน้าที่หน้าภาพรวม";
    }
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; run(); } });
  })();

  // ======================================================================= worked examples: step mode + practice mode
  (function () {
    if (!art) return;
    var examples = Array.prototype.slice.call(art.querySelectorAll(".wx"));
    examples.forEach(function (wx) {
      var steps = Array.prototype.slice.call(wx.querySelectorAll(".steps > li"));
      var head = wx.querySelector(".wx-head");
      if (!head || !steps.length) return;
      var bar = document.createElement("div");
      bar.className = "wx-bar";
      bar.innerHTML = '<button type="button" class="wx-btn" data-act="step">▶ ดูทีละขั้น</button><button type="button" class="wx-btn" data-act="show" hidden>ดูวิธีทำ</button>';
      var go = head.querySelector(".calc-go");
      if (go) bar.appendChild(go);
      head.appendChild(bar);
      var stepBtn = bar.querySelector('[data-act="step"]'), showBtn = bar.querySelector('[data-act="show"]');
      var shown = -1;
      function paint() {
        steps.forEach(function (li, i) { li.classList.toggle("st-hide", shown >= 0 && i > shown); });
        var done = shown < 0 || shown >= steps.length - 1;
        wx.classList.toggle("st-pending", !done);
        stepBtn.textContent = shown < 0 ? "▶ ดูทีละขั้น" : !done ? "ขั้นถัดไป (" + (shown + 2) + "/" + steps.length + ") ▶" : "↺ เริ่มใหม่";
      }
      stepBtn.addEventListener("click", function () {
        wx.classList.add("open");
        if (shown < 0 || shown >= steps.length - 1) shown = 0; else shown++;
        paint();
        if (shown > 0) steps[shown].scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      showBtn.addEventListener("click", function () { wx.classList.toggle("open"); showBtn.textContent = wx.classList.contains("open") ? "ซ่อนวิธีทำ" : "ดูวิธีทำ"; });
      wx._reset = function (practice) { shown = -1; paint(); showBtn.hidden = !practice; showBtn.textContent = "ดูวิธีทำ"; wx.classList.remove("open"); };
    });
    var pb = $("practiceBtn");
    if (pb) pb.addEventListener("click", function () {
      var on = !art.classList.contains("practice");
      art.classList.toggle("practice", on);
      pb.setAttribute("aria-pressed", on ? "true" : "false");
      pb.textContent = on ? "ออกจากโหมดฝึกทำ" : "โหมดฝึกทำ: ซ่อนวิธีทำ";
      examples.forEach(function (wx) { if (wx._reset) wx._reset(on); });
    });
  })();

  // ======================================================================= formula index (hub)
  (function () {
    var box = $("fxIndex");
    if (!box) return;
    var inp = $("fxFilter"), items = Array.prototype.slice.call(box.querySelectorAll(".fx")), chips = box.querySelectorAll(".fx-chips button");
    var page = "", LIMIT = 12, expanded = false;
    var more = document.createElement("button");
    more.type = "button"; more.className = "btn btn-ghost btn-sm fx-more";
    box.appendChild(more);
    more.addEventListener("click", function () { expanded = !expanded; run(); if (!expanded) box.scrollIntoView({ block: "start" }); });
    items.forEach(function (li) {
      var t = li.getAttribute("data-k") || "";
      li.querySelectorAll("annotation").forEach(function (a) { t += " " + a.textContent.toLowerCase(); });
      li._hay = t;
    });
    function run() {
      var raw = inp.value.trim().toLowerCase().replace(/×/g, "x");
      var terms = raw.split(/\s+/).filter(Boolean), n = 0, limited = !terms.length && !page && !expanded;
      items.forEach(function (li) {
        var idm = terms.length === 1 && /^[a-z]\d+[a-z]?$/.test(terms[0]);
        var ok = (!page || li.getAttribute("data-p") === page) &&
          (idm ? li.querySelector(".fid").textContent.toLowerCase() === terms[0] || li._hay.indexOf(terms[0] + " ") >= 0 : terms.every(function (t) { return li._hay.indexOf(t) >= 0; }));
        if (ok) n++;
        li.hidden = !ok || (limited && n > LIMIT);
      });
      more.hidden = !!terms.length || !!page;
      more.textContent = expanded ? "ย่อรายการ ↑" : "แสดงทั้งหมด " + items.length + " สูตร ↓";
      $("fxCount").textContent = (terms.length || page ? "พบ " : "ทั้งหมด ") + n + " สูตร";
      $("fxEmpty").hidden = n > 0;
    }
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; run(); } });
    chips.forEach(function (b) {
      b.addEventListener("click", function () {
        page = b.getAttribute("data-p");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        run();
      });
    });
    run();
  })();

  // ======================================================================= exact rational arithmetic (BigInt)
  function bgcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { var t = a % b; a = b; b = t; } return a; }
  function Q(n, d) {
    if (d === undefined) d = 1n;
    if (d === 0n) throw new Error("division by zero");
    if (d < 0n) { n = -n; d = -d; }
    var g = bgcd(n, d);
    if (g > 1n) { n /= g; d /= g; }
    if (n === 0n) d = 1n;
    this.n = n; this.d = d;
  }
  Q.prototype.add = function (o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); };
  Q.prototype.sub = function (o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); };
  Q.prototype.mul = function (o) { return new Q(this.n * o.n, this.d * o.d); };
  Q.prototype.div = function (o) { return new Q(this.n * o.d, this.d * o.n); };
  Q.prototype.neg = function () { return new Q(-this.n, this.d); };
  Q.prototype.isZero = function () { return this.n === 0n; };
  Q.prototype.isOne = function () { return this.n === 1n && this.d === 1n; };
  Q.prototype.eq = function (o) { return this.n === o.n && this.d === o.d; };
  Q.prototype.sign = function () { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; };
  Q.prototype.abs = function () { return new Q(this.n < 0n ? -this.n : this.n, this.d); };
  Q.prototype.num = function () { return Number(this.n) / Number(this.d); };
  Q.prototype.isInt = function () { return this.d === 1n; };
  Q.prototype.str = function () { var s = (this.n < 0n ? MINUS : "") + (this.n < 0n ? -this.n : this.n).toString(); return this.d === 1n ? s : s + "/" + this.d.toString(); };
  Q.prototype.html = function () {
    if (this.d === 1n) return (this.n < 0n ? MINUS : "") + (this.n < 0n ? -this.n : this.n).toString();
    var a = this.n < 0n ? -this.n : this.n;
    return (this.n < 0n ? MINUS : "") + '<span class="fr"><i>' + a + "</i><i>" + this.d + "</i></span>";
  };
  var ZERO = new Q(0n), ONE = new Q(1n);
  function qi(k) { return new Q(BigInt(k)); }
  function parseQ(s) {
    s = String(s).trim().replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/,/g, ".");
    if (s === "" || s === "-" || s === "+") return ZERO;
    var parts = s.split("/");
    if (parts.length > 2) return null;
    var dec = function (t) {
      var m = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(t);
      if (!m || (m[2] === "" && (m[3] === undefined || m[3] === ""))) return null;
      var frac = m[3] || "", n = BigInt((m[2] || "0") + frac), d = 10n ** BigInt(frac.length);
      var e = m[4] ? parseInt(m[4], 10) : 0;
      if (Math.abs(e) > 30) return null;
      if (e > 0) n *= 10n ** BigInt(e); else if (e < 0) d *= 10n ** BigInt(-e);
      return new Q(m[1] === "-" ? -n : n, d);
    };
    var a = dec(parts[0]);
    if (!a) return null;
    if (parts.length === 2) { var b = dec(parts[1]); if (!b || b.isZero()) return null; return a.div(b); }
    return a;
  }

  // ======================================================================= small complex helpers (numeric)
  var C = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1]]; },
    mul: function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; },
    div: function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    abs: function (a) { return Math.hypot(a[0], a[1]); }
  };
  function fmtNum(x) {
    if (Math.abs(x) < 5e-10) return "0";
    var s = Math.abs(x) >= 1e5 || Math.abs(x) < 1e-4 ? x.toExponential(5) : (+x.toFixed(6)).toString();
    return s.replace("-", MINUS);
  }
  function fmtC(z) {
    var re = Math.abs(z[0]) < 5e-10 ? 0 : z[0], im = Math.abs(z[1]) < 5e-10 ? 0 : z[1];
    if (!im) return fmtNum(re);
    var ims = fmtNum(Math.abs(im)) === "1" ? "" : fmtNum(Math.abs(im));
    if (!re) return (im < 0 ? MINUS : "") + ims + "j";
    return fmtNum(re) + (im < 0 ? " " + MINUS + " " : " + ") + ims + "j";
  }

  // ======================================================================= matrix helpers
  function clone(M) { return M.map(function (r) { return r.slice(); }); }
  function mxHtml(M, opt) {
    opt = opt || {};
    var cols = M[0].length, bar = opt.bar, hl = opt.hl || {}, h = "";
    M.forEach(function (row, i) {
      row.forEach(function (v, j) {
        var cls = [];
        if (bar && j === bar) cls.push("sep");
        if (hl[i + "," + j]) cls.push(hl[i + "," + j]);
        if (opt.hlRow != null && opt.hlRow === i) cls.push("hr");
        h += "<span" + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ">" + (typeof v === "string" ? v : v.html()) + "</span>";
      });
    });
    return '<div class="mxv' + (opt.vbar ? " vbar" : "") + '" style="--c:' + cols + '">' + h + "</div>";
  }
  function rowName(i) { return "R" + sub(i + 1); }
  function opScale(k, i) {
    // R_i ← k R_i
    var t = k.eq(ONE.neg()) ? MINUS : k.isInt() ? k.str() : "(" + k.str() + ")";
    return rowName(i) + " ← " + t + rowName(i);
  }
  function opAdd(i, k, j) {
    // R_i ← R_i + k R_j  (k may be negative)
    var mag = k.abs(), m = mag.isOne() ? "" : mag.isInt() ? mag.str() : "(" + mag.str() + ")";
    return rowName(i) + " ← " + rowName(i) + (k.sign() < 0 ? " " + MINUS + " " : " + ") + m + rowName(j);
  }
  function opSwap(i, j) { return rowName(i) + " ↔ " + rowName(j); }

  // Gauss–Jordan on an augmented matrix; left = number of coefficient columns
  function gaussJordan(M0, left) {
    var M = clone(M0), rows = M.length, cols = M[0].length, r = 0, steps = [], pivots = [];
    for (var c = 0; c < left && r < rows; c++) {
      var p = -1;
      for (var i = r; i < rows; i++) if (!M[i][c].isZero() && M[i][c].abs().isOne()) { p = i; break; }
      if (p < 0) for (i = r; i < rows; i++) if (!M[i][c].isZero()) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) { var t = M[p]; M[p] = M[r]; M[r] = t; steps.push({ ops: [opSwap(r, p)], M: clone(M), piv: [r, c] }); }
      var pv = M[r][c];
      if (!pv.isOne()) {
        var k = ONE.div(pv);
        M[r] = M[r].map(function (v) { return v.mul(k); });
        steps.push({ ops: [opScale(k, r)], M: clone(M), piv: [r, c] });
      }
      var ops = [];
      for (i = 0; i < rows; i++) {
        if (i === r || M[i][c].isZero()) continue;
        var f = M[i][c];
        M[i] = M[i].map(function (v, j) { return v.sub(f.mul(M[r][j])); });
        ops.push(opAdd(i, f.neg(), r));
      }
      if (ops.length) steps.push({ ops: ops, M: clone(M), piv: [r, c] });
      pivots.push(c); r++;
    }
    return { M: M, steps: steps, pivots: pivots, rank: r, cols: cols };
  }

  // determinant by fraction-exact elimination (no scaling), returns {det, steps}
  function detElim(A) {
    var M = clone(A), n = M.length, sign = 1, steps = [];
    for (var c = 0; c < n; c++) {
      var p = -1;
      for (var i = c; i < n; i++) if (!M[i][c].isZero() && M[i][c].abs().isOne()) { p = i; break; }
      if (p < 0) for (i = c; i < n; i++) if (!M[i][c].isZero()) { p = i; break; }
      if (p < 0) { steps.push({ ops: ["หลักที่ " + (c + 1) + " ใต้แนวทแยงเป็นศูนย์ทั้งหมด"], M: clone(M), zero: true }); return { det: ZERO, steps: steps, zeroCol: c }; }
      if (p !== c) { var t = M[p]; M[p] = M[c]; M[c] = t; sign = -sign; steps.push({ ops: [opSwap(c, p) + "  (เครื่องหมายเปลี่ยน)"], M: clone(M), piv: [c, c] }); }
      var ops = [];
      for (i = c + 1; i < n; i++) {
        if (M[i][c].isZero()) continue;
        var f = M[i][c].div(M[c][c]);
        M[i] = M[i].map(function (v, j) { return v.sub(f.mul(M[c][j])); });
        ops.push(opAdd(i, f.neg(), c));
      }
      if (ops.length) steps.push({ ops: ops, M: clone(M), piv: [c, c] });
    }
    var d = sign < 0 ? ONE.neg() : ONE;
    for (i = 0; i < n; i++) d = d.mul(M[i][i]);
    return { det: d, steps: steps, U: M, sign: sign };
  }
  function det(A) { return detElim(A).det; }
  function minor(A, r, c) { return A.filter(function (_, i) { return i !== r; }).map(function (row) { return row.filter(function (_, j) { return j !== c; }); }); }
  function matMul(A, B) {
    return A.map(function (row) { return B[0].map(function (_, j) { var s = ZERO; for (var k = 0; k < row.length; k++) s = s.add(row[k].mul(B[k][j])); return s; }); });
  }
  function ident(n) { var I = []; for (var i = 0; i < n; i++) { I.push([]); for (var j = 0; j < n; j++) I[i].push(i === j ? ONE : ZERO); } return I; }
  function lcmBig(a, b) { return a / bgcd(a, b) * b; }
  // scale a rational vector to the smallest integer vector (keeps direction; first nonzero made positive)
  function intVec(v) {
    var L = 1n; v.forEach(function (x) { L = lcmBig(L, x.d); });
    var w = v.map(function (x) { return x.n * (L / x.d); });
    var g = 0n; w.forEach(function (x) { g = bgcd(g, x); });
    if (g === 0n) g = 1n;
    w = w.map(function (x) { return x / g; });
    var first = w.find(function (x) { return x !== 0n; });
    if (first !== undefined && first < 0n) w = w.map(function (x) { return -x; });
    return w.map(function (x) { return new Q(x); });
  }

  // ---------------------------------------------------------------- polynomial tools (coeffs low→high, rational)
  function charPoly(A) {
    // Faddeev–LeVerrier: p(λ) = det(λI − A) = Σ c_k λ^k, c_n = 1
    var n = A.length, c = new Array(n + 1); c[n] = ONE;
    var Mk = ident(n);
    for (var k = 1; k <= n; k++) {
      if (k > 1) { Mk = matMul(A, Mk); for (var i = 0; i < n; i++) Mk[i][i] = Mk[i][i].add(c[n - k + 1]); }
      var AM = matMul(A, Mk), tr = ZERO;
      for (i = 0; i < n; i++) tr = tr.add(AM[i][i]);
      c[n - k] = tr.neg().div(qi(k));
    }
    return c;
  }
  function polyHtml(c, v) {
    v = v || "λ";
    var s = "", deg = c.length - 1;
    for (var k = deg; k >= 0; k--) {
      var a = c[k]; if (a.isZero()) continue;
      var mag = a.abs(), neg = a.sign() < 0;
      var coef = k > 0 && mag.isOne() ? "" : mag.html();
      var term = coef + (k > 0 ? v + (k > 1 ? "<sup>" + k + "</sup>" : "") : "");
      s += s ? (neg ? " " + MINUS + " " : " + ") + term : (neg ? MINUS : "") + term;
    }
    return s || "0";
  }
  function polyEval(c, x) { var r = ZERO; for (var k = c.length - 1; k >= 0; k--) r = r.mul(x).add(c[k]); return r; }
  function polyDivRoot(c, r) { // divide by (λ − r), exact
    var n = c.length - 1, q = new Array(n), acc = ZERO;
    for (var k = n; k >= 1; k--) { acc = acc.mul(r).add(c[k]); q[k - 1] = acc; }
    return q;
  }
  function divisors(N) {
    if (N < 0n) N = -N;
    if (N === 0n) return [];
    if (N > 1000000000000n) return null;
    var out = [], small = [], large = [];
    for (var i = 1n; i * i <= N; i++) if (N % i === 0n) { small.push(i); if (i * i !== N) large.push(N / i); }
    out = small.concat(large.reverse());
    return out;
  }
  function rationalRoots(c) {
    // returns {roots:[Q with multiplicity repeats], rest: poly}
    var roots = [], p = c.slice();
    while (p.length > 1 && p[0].isZero()) { roots.push(ZERO); p = p.slice(1); }
    var guard = 0;
    while (p.length > 1 && guard++ < 12) {
      if (p.length === 2) { roots.push(p[0].neg().div(p[1])); p = [p[1]]; break; }
      var L = 1n; p.forEach(function (x) { L = lcmBig(L, x.d); });
      var ints = p.map(function (x) { return x.n * (L / x.d); });
      var a0 = divisors(ints[0]), an = divisors(ints[ints.length - 1]);
      if (!a0 || !an) break;
      var found = null;
      outer: for (var i = 0; i < a0.length; i++) for (var j = 0; j < an.length; j++) for (var s = 0; s < 2; s++) {
        var cand = new Q(s ? -a0[i] : a0[i], an[j]);
        if (polyEval(p, cand).isZero()) { found = cand; break outer; }
      }
      if (!found) break;
      roots.push(found); p = polyDivRoot(p, found);
    }
    return { roots: roots, rest: p };
  }
  function squareFree(N) { // N = s² r, returns [s, r] or null if too large
    if (N > 1000000000000000n) return null;
    var s = 1n, r = 1n, m = N;
    for (var f = 2n; f * f <= m; f++) { var e = 0; while (m % f === 0n) { m /= f; e++; } if (e) { s *= f ** BigInt(e >> 1); if (e & 1) r *= f; } }
    r *= m;
    return [s, r];
  }
  function quadExact(p) { // p = [c0, c1, c2] rational, no rational roots; returns {txt, vals:[[re,im],[re,im]]}
    var a = p[2], b = p[1], c = p[0];
    var D = b.mul(b).sub(qi(4).mul(a).mul(c));
    var center = b.neg().div(qi(2).mul(a));
    var neg = D.sign() < 0, Dabs = D.abs();
    var sf = squareFree(Dabs.n * Dabs.d);
    var two_a = qi(2).mul(a).abs();
    var rootAbs = Math.sqrt(Dabs.num()) / two_a.num();
    var vals = neg ? [[center.num(), rootAbs], [center.num(), -rootAbs]] : [[center.num() + rootAbs, 0], [center.num() - rootAbs, 0]];
    if (!sf) return { txt: null, vals: vals };
    var k = new Q(sf[0], Dabs.d).div(two_a), r = sf[1]; // root = center ± k √r
    var L = lcmBig(center.d, k.d), N1 = center.n * (L / center.d), N2 = k.n * (L / k.d);
    var rad = neg
      ? (N2 === 1n ? "" : N2.toString()) + "j" + (r === 1n ? "" : "√" + r)
      : (N2 === 1n && r !== 1n ? "" : N2.toString()) + (r === 1n ? "" : "√" + r);
    var core = (N1 !== 0n ? (N1 < 0n ? MINUS + (-N1) : N1.toString()) + " ± " : "±") + rad;
    var txt = L === 1n ? core : "(" + core + ")/" + L;
    return { txt: txt, vals: vals };
  }
  function durandKerner(cf) { // cf: float coeffs low→high; returns complex roots
    var n = cf.length - 1, an = cf[n], a = cf.map(function (x) { return x / an; });
    var z = [], i, k;
    for (i = 0; i < n; i++) z.push([Math.pow(0.4, i) * Math.cos(0.9 * i + 0.3) * 1.3, Math.pow(0.4, i) * Math.sin(0.9 * i + 0.3) * 1.3]);
    var R = 1 + Math.max.apply(null, a.slice(0, n).map(Math.abs));
    z = z.map(function (w, i2) { var t = 2 * Math.PI * i2 / n + 0.4; return [R * 0.7 * Math.cos(t), R * 0.7 * Math.sin(t)]; });
    var ev = function (x) { var r = [1, 0]; for (var kk = n - 1; kk >= 0; kk--) r = C.add(C.mul(r, x), [a[kk], 0]); return r; };
    for (var it = 0; it < 800; it++) {
      var delta = 0;
      for (i = 0; i < n; i++) {
        var den = [1, 0];
        for (k = 0; k < n; k++) if (k !== i) den = C.mul(den, C.sub(z[i], z[k]));
        var step = C.div(ev(z[i]), den);
        z[i] = C.sub(z[i], step); delta = Math.max(delta, C.abs(step));
      }
      if (delta < 1e-15) break;
    }
    return z.map(function (w) { var s = 1 + C.abs(w); return [Math.abs(w[0]) < 1e-10 * s ? 0 : w[0], Math.abs(w[1]) < 1e-9 * s ? 0 : w[1]]; });
  }
  // numeric null-space vector of (A − λI), λ complex
  function nullVecNumeric(A, lam) {
    var n = A.length, M = A.map(function (row, i) { return row.map(function (v, j) { var x = [v.num(), 0]; return i === j ? C.sub(x, lam) : x; }); });
    var scale = 0; M.forEach(function (r) { r.forEach(function (x) { scale = Math.max(scale, C.abs(x)); }); });
    var tol = 1e-7 * Math.max(1, scale), piv = [], r = 0;
    for (var c = 0; c < n && r < n; c++) {
      var p = -1, best = tol;
      for (var i = r; i < n; i++) if (C.abs(M[i][c]) > best) { best = C.abs(M[i][c]); p = i; }
      if (p < 0) continue;
      var t = M[p]; M[p] = M[r]; M[r] = t;
      var pv = M[r][c];
      M[r] = M[r].map(function (x) { return C.div(x, pv); });
      for (i = 0; i < n; i++) if (i !== r) { var f = M[i][c]; M[i] = M[i].map(function (x, j) { return C.sub(x, C.mul(f, M[r][j])); }); }
      piv.push(c); r++;
    }
    var free = []; for (c = 0; c < n; c++) if (piv.indexOf(c) < 0) free.push(c);
    if (!free.length) return null;
    var vecs = free.map(function (fc) {
      var v = []; for (var j = 0; j < n; j++) v.push([0, 0]);
      v[fc] = [1, 0];
      piv.forEach(function (pc, ri) { v[pc] = C.sub([0, 0], M[ri][fc]); });
      var big = v.reduce(function (m, x) { return C.abs(x) > C.abs(m) ? x : m; }, [0, 0]);
      return v.map(function (x) { return C.div(x, big); });
    });
    return vecs;
  }

  // ======================================================================= matrix-product explainer
  document.querySelectorAll(".mx-prod").forEach(function (box) {
    var parse = function (s) { return s.split(";").map(function (r) { return r.split(",").map(function (x) { return parseQ(x); }); }); };
    var A = parse(box.getAttribute("data-a")), B = parse(box.getAttribute("data-b"));
    var Cm = matMul(A, B), sel = [0, 0];
    var row = box.querySelector(".mxp-row"), out = box.querySelector(".mxp-sum");
    function grid(M, kind) {
      var h = "";
      M.forEach(function (r, i) { r.forEach(function (v, j) {
        var on = (kind === "a" && i === sel[0]) || (kind === "b" && j === sel[1]) || (kind === "c" && i === sel[0] && j === sel[1]);
        h += kind === "c" ? '<button type="button" data-i="' + i + '" data-j="' + j + '"' + (on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ' aria-label="ช่อง ' + (i + 1) + "," + (j + 1) + '">' + v.html() + "</button>" : "<span" + (on ? ' class="on"' : "") + ">" + v.html() + "</span>";
      }); });
      return '<div class="mxv mxp-' + kind + '" style="--c:' + M[0].length + '">' + h + "</div>";
    }
    function paint() {
      row.innerHTML = '<div class="mxp-cell"><span class="mono">A (' + A.length + "×" + A[0].length + ")</span>" + grid(A, "a") + '</div><span class="mxp-op">×</span><div class="mxp-cell"><span class="mono">B (' + B.length + "×" + B[0].length + ")</span>" + grid(B, "b") + '</div><span class="mxp-op">=</span><div class="mxp-cell"><span class="mono">AB (' + Cm.length + "×" + Cm[0].length + ")</span>" + grid(Cm, "c") + "</div>";
      var i = sel[0], j = sel[1], parts = A[i].map(function (a, k) { return "(" + a.str() + ")(" + B[k][j].str() + ")"; });
      out.innerHTML = "c" + sub(i + 1) + sub(j + 1) + " = แถว " + (i + 1) + " ของ A · หลัก " + (j + 1) + " ของ B = " + parts.join(" + ") + " = <b>" + Cm[i][j].str() + "</b>";
    }
    row.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]"); if (!b) return;
      sel = [+b.getAttribute("data-i"), +b.getAttribute("data-j")]; paint();
      var nb = row.querySelector('button[data-i="' + sel[0] + '"][data-j="' + sel[1] + '"]'); if (nb) nb.focus();
    });
    paint();
  });

  // ======================================================================= 2×2 transformation / eigen lab
  document.querySelectorAll(".la-lab").forEach(function (box) {
    var mode = box.getAttribute("data-mode") || "det";
    var m0 = (box.getAttribute("data-m") || "2,1;1,2").split(/[;,]/).map(Number);
    var st = { a: m0[0], b: m0[1], c: m0[2], d: m0[3], th: 0.35 };
    var presets = mode === "det"
      ? [["ตัวอย่าง", [3, 1, 1, 2]], ["หมุน 90°", [0, -1, 1, 0]], ["เฉือน", [1, 1, 0, 1]], ["สะท้อน", [1, 0, 0, -1]], ["ขยาย 2 เท่า", [2, 0, 0, 2]], ["บีบแบน", [2, 1, 4, 2]]]
      : [["สมมาตร", [2, 1, 1, 2]], ["E-1", [4, 1, 2, 3]], ["หมุน (เชิงซ้อน)", [0, -1, 1, 0]], ["เฉือน (ไม่ครบ)", [1, 1, 0, 1]], ["สะท้อน", [1, 0, 0, -1]], ["ฉาย", [1, 0, 0, 0]]];
    box.innerHTML =
      '<div class="lab-fig"><svg viewBox="0 0 360 360" role="img" aria-label="การแปลงเชิงเส้น 2 คูณ 2"></svg>' +
      '<p class="hint">' + (mode === "det" ? "ลากหัวลูกศรสีส้ม (หลัก 1) และสีฟ้า (หลัก 2)" : "ลากจุดดำบนวงกลมเพื่อหมุน v · ลากหัวลูกศรหลักเพื่อเปลี่ยนเมทริกซ์") + "</p></div>" +
      '<div class="lab-side">' +
      '<div class="lab-mx"><span class="mono">A =</span><div class="lab-in">' +
      ["a", "b", "c", "d"].map(function (k) { return '<input class="num" type="number" step="0.5" data-k="' + k + '" aria-label="สมาชิก ' + k + '">'; }).join("") +
      "</div></div>" +
      '<div class="lab-pre">' + presets.map(function (p, i) { return '<button type="button" data-p="' + i + '">' + p[0] + "</button>"; }).join("") + "</div>" +
      '<div class="lab-read" aria-live="polite"></div></div>';
    var svg = box.querySelector("svg"), inputs = box.querySelectorAll(".lab-in input"), read = box.querySelector(".lab-read");
    var NS = "http://www.w3.org/2000/svg", S = 360, drag = null, R = 3;
    function toScr(x, y) { return [S / 2 + x * S / (2 * R), S / 2 - y * S / (2 * R)]; }
    function fromEvt(e) { var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [(p.x - S / 2) * 2 * R / S, (S / 2 - p.y) * 2 * R / S]; }
    function eig2() {
      var a = st.a, b = st.b, c = st.c, d = st.d, tr = a + d, dt = a * d - b * c, disc = tr * tr - 4 * dt;
      var out = { tr: tr, det: dt, disc: disc, vecs: [] };
      if (disc < -1e-9) { out.complex = [tr / 2, Math.sqrt(-disc) / 2]; return out; }
      var s = Math.sqrt(Math.max(disc, 0)), l1 = (tr + s) / 2, l2 = (tr - s) / 2;
      out.l = Math.abs(disc) < 1e-9 ? [tr / 2] : [l1, l2];
      if (Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9) {
        if (Math.abs(a - d) < 1e-9) { out.all = true; return out; }
        out.vecs = [[a, [1, 0]], [d, [0, 1]]]; return out;
      }
      out.l.forEach(function (l) { var v = Math.abs(b) > 1e-9 ? [b, l - a] : [l - d, c]; var n = Math.hypot(v[0], v[1]); out.vecs.push([l, [v[0] / n, v[1] / n]]); });
      return out;
    }
    function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; }
    function line(x1, y1, x2, y2, cls) { var p = toScr(x1, y1), q = toScr(x2, y2); return el("line", { x1: p[0].toFixed(1), y1: p[1].toFixed(1), x2: q[0].toFixed(1), y2: q[1].toFixed(1), class: cls }); }
    function arrow(x, y, cls, label) {
      var o = toScr(0, 0), p = toScr(x, y), ang = Math.atan2(p[1] - o[1], p[0] - o[0]), L = Math.hypot(p[0] - o[0], p[1] - o[1]);
      if (L < 1) return;
      el("line", { x1: o[0], y1: o[1], x2: (p[0] - 9 * Math.cos(ang)).toFixed(1), y2: (p[1] - 9 * Math.sin(ang)).toFixed(1), class: "lv-arr " + cls });
      el("path", { d: "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " L" + (p[0] - 12 * Math.cos(ang - 0.4)).toFixed(1) + " " + (p[1] - 12 * Math.sin(ang - 0.4)).toFixed(1) + " L" + (p[0] - 12 * Math.cos(ang + 0.4)).toFixed(1) + " " + (p[1] - 12 * Math.sin(ang + 0.4)).toFixed(1) + "Z", class: "lv-head " + cls });
      if (label) { var t = el("text", { x: (p[0] + 8 * Math.cos(ang) + (Math.cos(ang) < 0 ? -10 : 2)).toFixed(1), y: (p[1] + 8 * Math.sin(ang) + 12 * (Math.sin(ang) > 0 ? 1 : 0) - 2).toFixed(1), class: "lv-lab " + cls }); t.textContent = label; }
    }
    function draw() {
      var a = st.a, b = st.b, c = st.c, d = st.d, E = eig2();
      var span = Math.max(Math.hypot(a, c), Math.hypot(b, d), Math.abs(a + b) + 0.1, Math.abs(c + d) + 0.1, 1.2);
      if (mode === "eig") E.l && E.l.forEach(function (l) { span = Math.max(span, Math.abs(l)); });
      R = Math.min(10, Math.max(2.5, Math.ceil(span * 1.15 * 2) / 2));
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // background grid
      for (var g = -Math.floor(R); g <= Math.floor(R); g++) { line(g, -R, g, R, g === 0 ? "lg-ax" : "lg-g"); line(-R, g, R, g, g === 0 ? "lg-ax" : "lg-g"); }
      // transformed grid
      var K = Math.ceil(R) + 2;
      for (g = -K; g <= K; g++) {
        line(a * g - b * K, c * g - d * K, a * g + b * K, c * g + d * K, "lg-tg");
        line(b * g - a * K, d * g - c * K, b * g + a * K, d * g + c * K, "lg-tg");
      }
      var dt = a * d - b * c;
      if (mode === "det") {
        var p0 = toScr(0, 0), p1 = toScr(a, c), p2 = toScr(a + b, c + d), p3 = toScr(b, d), u1 = toScr(1, 0), u2 = toScr(1, 1), u3 = toScr(0, 1);
        el("path", { d: "M" + p0 + "L" + u1 + "L" + u2 + "L" + u3 + "Z", class: "lg-unit" });
        el("path", { d: "M" + p0 + "L" + p1 + "L" + p2 + "L" + p3 + "Z", class: "lg-par " + (dt < -1e-9 ? "neg" : dt > 1e-9 ? "pos" : "zero") });
        var cx = toScr((a + b) / 2, (c + d) / 2), t = el("text", { x: cx[0].toFixed(1), y: (cx[1] + 5).toFixed(1), class: "lv-area", "text-anchor": "middle" });
        t.textContent = "det = " + fmtNum(dt);
      } else {
        // unit circle and its image
        var dc = "", di = "";
        for (var k = 0; k <= 96; k++) { var th = 2 * Math.PI * k / 96, x = Math.cos(th), y = Math.sin(th), q = toScr(x, y), w = toScr(a * x + b * y, c * x + d * y); dc += (k ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); di += (k ? "L" : "M") + w[0].toFixed(1) + " " + w[1].toFixed(1); }
        el("path", { d: dc, class: "lg-circ" }); el("path", { d: di, class: "lg-ell" });
        E.vecs.forEach(function (ev) { var v = ev[1]; line(-v[0] * R * 2, -v[1] * R * 2, v[0] * R * 2, v[1] * R * 2, "lg-eig"); var p = toScr(v[0] * (R - 0.5), v[1] * (R - 0.5)); var tt = el("text", { x: p[0].toFixed(1), y: (p[1] - 6).toFixed(1), class: "lv-eiglab", "text-anchor": "middle" }); tt.textContent = "λ = " + fmtNum(ev[0]); });
        var vx = Math.cos(st.th), vy = Math.sin(st.th);
        arrow(a * vx + b * vy, c * vx + d * vy, "c-av", "Av");
        arrow(vx, vy, "c-v", "v");
        var hv = toScr(vx, vy);
        el("circle", { cx: hv[0].toFixed(1), cy: hv[1].toFixed(1), r: 7, class: "lg-vh" });
        var hit = el("circle", { cx: hv[0].toFixed(1), cy: hv[1].toFixed(1), r: 18, class: "lg-hit", "data-h": "v" });
        hit.style.cursor = "grab";
      }
      arrow(a, c, "c-a1", "หลัก 1"); arrow(b, d, "c-a2", "หลัก 2");
      [["a1", a, c], ["a2", b, d]].forEach(function (h) { var p = toScr(h[1], h[2]); el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 16, class: "lg-hit", "data-h": h[0] }).style.cursor = "grab"; });
      // readout
      var html = '<div class="lr"><span>det A</span><b>' + fmtNum(dt) + "</b></div><div class=\"lr\"><span>tr A</span><b>" + fmtNum(a + d) + "</b></div>";
      if (mode === "det") {
        html += '<p class="lr-note">' + (Math.abs(dt) < 1e-9 ? "พื้นที่ถูกบีบเหลือศูนย์ หลักทั้งสองอยู่บนเส้นเดียวกัน เมทริกซ์ไม่มีอินเวอร์ส" : "พื้นที่เพิ่มเป็น " + fmtNum(Math.abs(dt)) + " เท่า " + (dt > 0 ? "ทิศการวางเดิม" : "รูปถูกพลิกกลับด้าน (det ติดลบ)")) + "</p>";
      } else {
        if (E.complex) html += '<div class="lr"><span>λ</span><b>' + fmtC([E.complex[0], E.complex[1]]) + ", " + fmtC([E.complex[0], -E.complex[1]]) + '</b></div><p class="lr-note">ค่าเฉพาะเชิงซ้อน ไม่มีทิศจริงที่ไม่ถูกหมุน (ไม่มีเส้นสีเขียว)</p>';
        else if (E.all) html += '<div class="lr"><span>λ</span><b>' + fmtNum(E.l[0]) + ' (ทุกทิศ)</b></div><p class="lr-note">A = kI ทุกเวกเตอร์เป็นเวกเตอร์เฉพาะ</p>';
        else html += '<div class="lr"><span>λ</span><b>' + E.l.map(fmtNum).join(", ") + "</b></div>" + (E.l.length === 1 ? '<p class="lr-note">ค่าซ้ำแต่มีทิศเฉพาะเดียว (defective)</p>' : "");
        var vx2 = Math.cos(st.th), vy2 = Math.sin(st.th), ax = a * vx2 + b * vy2, ay = c * vx2 + d * vy2, nAv = Math.hypot(ax, ay);
        var cross = vx2 * ay - vy2 * ax, dot = vx2 * ax + vy2 * ay, ang = Math.atan2(cross, dot) * 180 / Math.PI;
        var aligned = nAv < 1e-6 || Math.abs(Math.sin(ang * Math.PI / 180)) < 0.035;
        html += '<div class="lr"><span>มุมจาก v ไป Av</span><b>' + (nAv < 1e-6 ? "Av = 0" : ang.toFixed(1) + "°") + "</b></div>";
        html += '<p class="lr-note' + (aligned ? " ok" : "") + '">' + (aligned ? "✓ v อยู่บนทิศเฉพาะ: Av = " + fmtNum(nAv < 1e-6 ? 0 : (dot >= 0 ? 1 : -1) * nAv) + " v" : "Av ไม่ขนานกับ v ลองหมุน v ให้ตรงเส้นสีเขียว") + "</p>";
      }
      read.innerHTML = html;
      inputs.forEach(function (inp) { if (document.activeElement !== inp) inp.value = +(+st[inp.getAttribute("data-k")]).toFixed(3); });
    }
    svg.addEventListener("pointerdown", function (e) {
      var h = e.target.getAttribute && e.target.getAttribute("data-h"); if (!h) return;
      drag = h; svg.setPointerCapture(e.pointerId); e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = fromEvt(e);
      if (drag === "v") { st.th = Math.atan2(p[1], p[0]); }
      else {
        var sx = Math.round(p[0] * 2) / 2, sy = Math.round(p[1] * 2) / 2;
        sx = Math.max(-4, Math.min(4, sx)); sy = Math.max(-4, Math.min(4, sy));
        if (drag === "a1") { st.a = sx; st.c = sy; } else { st.b = sx; st.d = sy; }
      }
      draw();
    });
    var end = function () { drag = null; };
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
    inputs.forEach(function (inp) { inp.addEventListener("input", function () { var v = parseFloat(inp.value); if (isFinite(v) && Math.abs(v) <= 50) { st[inp.getAttribute("data-k")] = v; draw(); } }); });
    box.querySelector(".lab-pre").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-p]"); if (!b) return;
      var p = presets[+b.getAttribute("data-p")][1]; st.a = p[0]; st.b = p[1]; st.c = p[2]; st.d = p[3]; draw();
    });
    draw();
  });

  // ======================================================================= matrix calculator
  var MODE_LABEL = { solve: "แก้ระบบ Ax = b", det: "ดีเทอร์มิแนนต์", inv: "อินเวอร์ส", eig: "ค่าเฉพาะ λ" };
  var calcs = [];
  document.querySelectorAll(".mx-calc").forEach(function (box) {
    var modes = (box.getAttribute("data-modes") || "solve,det,inv,eig").split(",");
    var st = { mode: box.getAttribute("data-mode") || modes[0], n: +(box.getAttribute("data-n") || 3) };
    var A0 = (box.getAttribute("data-a") || "").split(";").map(function (r) { return r.split(","); });
    var b0 = (box.getAttribute("data-b") || "").split(",");
    box.innerHTML =
      '<div class="mc-top"><div class="seg mc-modes" role="group" aria-label="เลือกสิ่งที่ต้องการคำนวณ">' +
      modes.map(function (m) { return '<button type="button" data-m="' + m + '" aria-pressed="false">' + MODE_LABEL[m] + "</button>"; }).join("") +
      '</div><label class="mc-size">ขนาด <select aria-label="ขนาดเมทริกซ์"><option value="2">2×2</option><option value="3">3×3</option><option value="4">4×4</option></select></label></div>' +
      '<div class="mc-in"><div class="mc-blk"><span class="mono">A</span><div class="mc-grid"></div></div><div class="mc-blk mc-bb"><span class="mono">b</span><div class="mc-bgrid"></div></div></div>' +
      '<div class="mc-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="clear">ล้างค่า</button><button type="button" class="btn btn-ghost btn-sm" data-act="rand">สุ่มโจทย์</button><span class="hint">รับ 3, −2, 0.5, 3/4 · วางเมทริกซ์ทั้งก้อนลงช่องแรกได้</span></div>' +
      '<div class="mc-out" aria-live="polite"></div>';
    var grid = box.querySelector(".mc-grid"), bgrid = box.querySelector(".mc-bgrid"), out = box.querySelector(".mc-out"), sel = box.querySelector("select");
    var vals = { A: [], b: [] };
    for (var i = 0; i < 4; i++) { vals.A.push([]); for (var j = 0; j < 4; j++) vals.A[i].push(A0[i] && A0[i][j] !== undefined ? A0[i][j].trim() : i === j ? "1" : "0"); vals.b.push(b0[i] !== undefined && b0[i] !== "" ? b0[i].trim() : "0"); }
    function build() {
      var n = st.n, h = "", hb = "";
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) h += '<input class="num" inputmode="text" autocomplete="off" spellcheck="false" data-i="' + i + '" data-j="' + j + '" aria-label="a' + (i + 1) + (j + 1) + '" value="' + esc(vals.A[i][j]) + '">';
        hb += '<input class="num" inputmode="text" autocomplete="off" spellcheck="false" data-b="' + i + '" aria-label="b' + (i + 1) + '" value="' + esc(vals.b[i]) + '">';
      }
      grid.style.setProperty("--n", n); grid.innerHTML = h; bgrid.innerHTML = hb;
      box.querySelector(".mc-bb").hidden = st.mode !== "solve";
      box.querySelectorAll(".mc-modes button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-m") === st.mode ? "true" : "false"); });
      sel.value = String(n);
      compute();
    }
    function readMatrix() {
      var n = st.n, A = [], b = [], bad = false;
      box.querySelectorAll(".mc-in input").forEach(function (inp) { inp.classList.remove("bad"); });
      for (var i = 0; i < n; i++) {
        A.push([]);
        for (var j = 0; j < n; j++) { var q = parseQ(vals.A[i][j]); if (!q) { bad = true; var e = grid.querySelector('[data-i="' + i + '"][data-j="' + j + '"]'); if (e) e.classList.add("bad"); q = ZERO; } A[i].push(q); }
        var qb = parseQ(vals.b[i]); if (!qb) { bad = st.mode === "solve" || bad; var eb = bgrid.querySelector('[data-b="' + i + '"]'); if (eb) eb.classList.add("bad"); qb = ZERO; } b.push(qb);
      }
      return { A: A, b: b, bad: bad };
    }
    function stepsHtml(list, opt) {
      if (!list.length) return '<p class="hint">ไม่ต้องดำเนินการแถว เมทริกซ์อยู่ในรูปที่ต้องการแล้ว</p>';
      return '<ol class="mc-steps">' + list.map(function (s) {
        var hl = {}; if (s.piv) hl[s.piv[0] + "," + s.piv[1]] = "pv";
        return '<li><p class="mc-op">' + s.ops.map(esc).join("<br>") + "</p>" + mxHtml(s.M, { bar: opt && opt.bar, hl: hl }) + "</li>";
      }).join("") + "</ol>";
    }
    function compute() {
      var r = readMatrix(), A = r.A, b = r.b, n = st.n, h = "";
      if (r.bad) { out.innerHTML = '<p class="mc-err">มีช่องที่อ่านค่าไม่ได้ (กรอบสีแดง) ใช้ตัวเลข ทศนิยม หรือเศษส่วนแบบ 3/4</p>'; return; }
      try {
        if (st.mode === "det") h = doDet(A);
        else if (st.mode === "inv") h = doInv(A);
        else if (st.mode === "solve") h = doSolve(A, b);
        else h = doEig(A);
      } catch (e) { h = '<p class="mc-err">คำนวณไม่สำเร็จ: ' + esc(e.message) + "</p>"; }
      out.innerHTML = h;
    }
    function doDet(A) {
      var n = A.length, D = det(A), h = '<div class="mc-ans"><span class="mono">ผลลัพธ์</span><div>det A = <b>' + D.html() + "</b>" + (D.isInt() ? "" : ' <span class="hint">≈ ' + fmtNum(D.num()) + "</span>") + '</div><p class="hint">' + (D.isZero() ? "det A = 0 เมทริกซ์เอกฐาน ไม่มีอินเวอร์ส ระบบ Ax = b ไม่มีคำตอบเดียว" : "det A ≠ 0 มีอินเวอร์ส ระบบ Ax = b มีคำตอบเดียว") + "</p></div>";
      h += '<details class="mc-det" open><summary>ดูวิธีทำทีละขั้น</summary>';
      if (n === 2) {
        h += "<p>สูตร D1: ad − bc</p><p class=\"mc-line\">(" + A[0][0].str() + ")(" + A[1][1].str() + ") " + MINUS + " (" + A[0][1].str() + ")(" + A[1][0].str() + ") = " + A[0][0].mul(A[1][1]).str() + " " + MINUS + " (" + A[0][1].mul(A[1][0]).str() + ") = <b>" + D.str() + "</b></p>";
      } else if (n === 3) {
        // choose the row or column with most zeros
        var best = { z: -1 };
        for (var k = 0; k < 3; k++) {
          var zr = A[k].filter(function (x) { return x.isZero(); }).length, zc = A.filter(function (row) { return row[k].isZero(); }).length;
          if (zr > best.z) best = { z: zr, t: "r", k: k };
          if (zc > best.z) best = { z: zc, t: "c", k: k };
        }
        h += "<p>กระจายโคแฟกเตอร์ตาม" + (best.t === "r" ? "แถว" : "หลัก") + "ที่ " + (best.k + 1) + (best.z > 0 ? " (มีศูนย์ " + best.z + " ตัว)" : "") + " ด้วยสูตร D4 เครื่องหมายแบบกระดานหมากรุก</p><ul class=\"mc-terms\">";
        var sum = ZERO;
        for (var t = 0; t < 3; t++) {
          var i = best.t === "r" ? best.k : t, j = best.t === "r" ? t : best.k, a = A[i][j];
          var sg = (i + j) % 2 ? "−" : "+";
          if (a.isZero()) { h += "<li>" + sg + " a" + sub(i + 1) + sub(j + 1) + " = 0 → พจน์นี้หายไป</li>"; continue; }
          var Mi = minor(A, i, j), md = Mi[0][0].mul(Mi[1][1]).sub(Mi[0][1].mul(Mi[1][0])), term = (i + j) % 2 ? a.mul(md).neg() : a.mul(md);
          sum = sum.add(term);
          h += "<li>" + sg + " (" + a.str() + ") × " + mxHtml(Mi, { vbar: true }) + " = " + sg + " (" + a.str() + ")(" + md.str() + ") = <b>" + term.str() + "</b></li>";
        }
        h += "</ul><p class=\"mc-line\">รวม: det A = <b>" + sum.str() + "</b></p>";
      } else {
        var E = detElim(A);
        h += "<p>ลดแถวให้เป็นสามเหลี่ยมบนด้วยการบวกพหุคูณ (D8 ค่าไม่เปลี่ยน) และสลับแถว (D6 เปลี่ยนเครื่องหมาย)</p>" + stepsHtml(E.steps);
        if (E.zeroCol != null) h += "<p class=\"mc-line\">มีหลักที่ไม่มีตัวหลัก เมทริกซ์สามเหลี่ยมจะมีศูนย์บนเส้นทแยง จึงได้ det A = <b>0</b></p>";
        else h += "<p class=\"mc-line\">det A = " + (E.sign < 0 ? "(−1) × " : "") + E.U.map(function (row, i) { return "(" + row[i].str() + ")"; }).join("") + " = <b>" + E.det.str() + "</b> (D10)</p>";
      }
      return h + "</details>";
    }
    function factoredMatrix(M) {
      var L = 1n; M.forEach(function (r) { r.forEach(function (x) { L = lcmBig(L, x.d); }); });
      if (L === 1n) return mxHtml(M);
      var ints = M.map(function (r) { return r.map(function (x) { return new Q(x.n * (L / x.d)); }); });
      return '<span class="mc-frac">1/' + L + "</span> × " + mxHtml(ints);
    }
    function doInv(A) {
      var n = A.length, D = det(A);
      if (D.isZero()) {
        var aug0 = A.map(function (r, i) { return r.concat(ident(n)[i]); }), G0 = gaussJordan(aug0, n);
        return '<div class="mc-ans bad"><span class="mono">ผลลัพธ์</span><div>det A = 0 → <b>ไม่มีอินเวอร์ส</b></div><p class="hint">เมทริกซ์เอกฐาน (I1, I10) ลดแถวแล้วครึ่งซ้ายมีแถวศูนย์ ทำให้เป็น I ไม่ได้ (แรงก์ = ' + G0.rank + " &lt; " + n + ')</p></div><details class="mc-det" open><summary>ดูการลดแถว</summary>' + stepsHtml(G0.steps, { bar: n }) + "</details>";
      }
      var aug = A.map(function (r, i) { return r.concat(ident(n)[i]); }), G = gaussJordan(aug, n);
      var inv = G.M.map(function (r) { return r.slice(n); });
      var check = matMul(A, inv), ok = check.every(function (r, i) { return r.every(function (x, j) { return x.eq(i === j ? ONE : ZERO); }); });
      var h = '<div class="mc-ans"><span class="mono">ผลลัพธ์</span><div class="mc-row">A⁻¹ = ' + factoredMatrix(inv) + "</div>" + (factoredMatrix(inv).indexOf("mc-frac") >= 0 ? '<div class="mc-row hint">= ' + mxHtml(inv) + "</div>" : "") + '<p class="hint">det A = ' + D.str() + (ok ? " · ตรวจแล้ว A·A⁻¹ = I ✓" : "") + "</p></div>";
      h += '<details class="mc-det" open><summary>ดูวิธีทำทีละขั้น</summary>';
      if (n === 2) {
        h += '<p>สูตร I2: สลับทแยงหลัก เปลี่ยนเครื่องหมายทแยงรอง หารด้วย det = ' + D.str() + "</p><div class=\"mc-row\">A⁻¹ = 1/(" + D.str() + ") × " + mxHtml([[A[1][1], A[0][1].neg()], [A[1][0].neg(), A[0][0]]]) + "</div><p>หรือด้วยเกาส์-จอร์แดน:</p>";
      } else h += "<p>วิธี I4: ลดแถว [A | I] จนครึ่งซ้ายเป็น I ครึ่งขวาคือ A⁻¹</p>";
      h += mxHtml(aug, { bar: n }) + stepsHtml(G.steps, { bar: n });
      return h + "</details>";
    }
    function doSolve(A, b) {
      var n = A.length, aug = A.map(function (r, i) { return r.concat([b[i]]); }), G = gaussJordan(aug, n), M = G.M;
      var incons = M.some(function (r) { return r.slice(0, n).every(function (x) { return x.isZero(); }) && !r[n].isZero(); });
      var h = '<div class="mc-ans' + (incons ? " bad" : "") + '"><span class="mono">ผลลัพธ์</span>';
      var names = n <= 3 ? ["x", "y", "z"] : ["x₁", "x₂", "x₃", "x₄"];
      if (incons) h += "<div><b>ไม่มีคำตอบ</b> (ระบบขัดแย้งกัน)</div><p class=\"hint\">ลดแถวแล้วมีแถว [0 ⋯ 0 | c] ที่ c ≠ 0 แปลว่า 0 = c · rank A = " + G.rank + " &lt; rank [A | b] (L6)</p>";
      else if (G.rank === n) {
        var x = M.map(function (r) { return r[n]; });
        h += '<div class="mc-sol">' + x.map(function (v, i) { return "<span>" + names[i] + " = <b>" + v.html() + "</b></span>"; }).join("") + "</div><p class=\"hint\">คำตอบเดียว (rank = " + n + ")" + (x.some(function (v) { return !v.isInt(); }) ? " · ทศนิยม: " + x.map(function (v) { return fmtNum(v.num()); }).join(", ") : "") + "</p>";
      } else {
        var free = []; for (var c = 0; c < n; c++) if (G.pivots.indexOf(c) < 0) free.push(c);
        var tn = free.length === 1 ? ["t"] : free.map(function (_, k) { return "t" + sub(k + 1); });
        var xp = [], vs = free.map(function () { return []; });
        for (c = 0; c < n; c++) { xp.push(ZERO); vs.forEach(function (v) { v.push(ZERO); }); }
        G.pivots.forEach(function (pc, ri) { xp[pc] = M[ri][n]; free.forEach(function (fc, k) { vs[k][pc] = M[ri][fc].neg(); }); });
        free.forEach(function (fc, k) { vs[k][fc] = ONE; });
        var col = function (v) { return mxHtml(v.map(function (x) { return [x]; })); };
        h += "<div><b>มีคำตอบไม่จำกัด</b> · ตัวแปรอิสระ " + free.map(function (fc, k) { return names[fc] + " = " + tn[k]; }).join(", ") + "</div>";
        h += '<div class="mc-row">' + mxHtml(names.slice(0, n).map(function (s) { return [s]; })) + " = " + col(xp) + vs.map(function (v, k) { return " + " + tn[k] + " " + col(v); }).join("") + "</div>";
        h += '<p class="hint">rank A = rank [A | b] = ' + G.rank + " &lt; " + n + " จึงมีพารามิเตอร์ " + (n - G.rank) + " ตัว (L6, L12)</p>";
      }
      h += "</div><details class=\"mc-det\" open><summary>ดูวิธีทำทีละขั้น (เกาส์-จอร์แดน)</summary>" + mxHtml(aug, { bar: n }) + stepsHtml(G.steps, { bar: n }) + "</details>";
      var D = det(A);
      if (!D.isZero()) {
        h += '<details class="mc-det"><summary>ดูวิธีคราเมอร์ (C1)</summary><p>Δ = det A = <b>' + D.str() + '</b></p><ul class="mc-terms">';
        for (var i = 0; i < n; i++) {
          var Ai = A.map(function (r, k) { var rr = r.slice(); rr[i] = b[k]; return rr; }), Di = det(Ai), hl = {};
          for (var k = 0; k < n; k++) hl[k + "," + i] = "rep";
          h += "<li>Δ" + sub(i + 1) + " = det " + mxHtml(Ai, { hl: hl }) + " = " + Di.str() + " → " + names[i] + " = " + Di.str() + " / " + D.str() + " = <b>" + Di.div(D).html() + "</b></li>";
        }
        h += "</ul></details>";
      }
      return h;
    }
    function doEig(A) {
      var n = A.length, cp = charPoly(A), tr = ZERO, i;
      for (i = 0; i < n; i++) tr = tr.add(A[i][i]);
      var D = det(A);
      var rr = rationalRoots(cp), groups = [];
      rr.roots.forEach(function (r) { var g = groups.find(function (x) { return x.exact && x.q.eq(r); }); if (g) g.m++; else groups.push({ exact: true, q: r, m: 1, val: [r.num(), 0] }); });
      var rest = rr.rest, restTxt = null;
      if (rest.length === 3) {
        var qd = quadExact(rest);
        restTxt = qd.txt;
        qd.vals.forEach(function (v, k) { groups.push({ exact: false, val: v, m: 1, txt: qd.txt ? qd.txt.replace("±", k ? MINUS : "+") : null }); });
      } else if (rest.length > 3) {
        durandKerner(rest.map(function (x) { return x.num(); })).forEach(function (v) {
          var g = groups.find(function (x) { return !x.exact && C.abs(C.sub(x.val, v)) < 1e-6 * (1 + C.abs(v)); });
          if (g) g.m++; else groups.push({ exact: false, val: v, m: 1 });
        });
      }
      // factored form
      var fac = groups.filter(function (g) { return g.exact; }).map(function (g) {
        var f = g.q.isZero() ? "λ" : "(λ " + (g.q.sign() > 0 ? MINUS + " " + g.q.str() : "+ " + g.q.abs().str()) + ")";
        return f + (g.m > 1 ? "<sup>" + g.m + "</sup>" : "");
      }).join("");
      if (rest.length > 1) fac += "(" + polyHtml(rest.map(function (x) { return x.div(rest[rest.length - 1]); })) + ")" + (rest[rest.length - 1].isOne() ? "" : " × " + rest[rest.length - 1].str());
      var h = '<div class="mc-ans"><span class="mono">ผลลัพธ์</span><div class="mc-eigs">' + groups.map(function (g) {
        var txt = g.exact ? g.q.html() : g.txt ? esc(g.txt) : fmtC(g.val);
        return '<span>λ = <b>' + txt + "</b>" + (g.exact || !g.txt || g.txt.indexOf("√") < 0 ? "" : ' <small>≈ ' + fmtC(g.val) + "</small>") + (g.m > 1 ? " <small>(ซ้ำ " + g.m + " ครั้ง)</small>" : "") + "</span>";
      }).join("") + "</div>";
      var sumNum = groups.reduce(function (s, g) { return C.add(s, [g.val[0] * g.m, g.val[1] * g.m]); }, [0, 0]);
      h += '<p class="hint">ตรวจ (E6): ผลบวก ≈ ' + fmtC(sumNum) + " = tr A = " + tr.str() + " · ผลคูณ = det A = " + D.str() + "</p></div>";
      h += '<details class="mc-det" open><summary>ดูวิธีทำทีละขั้น</summary>';
      h += "<p><b>ขั้น 1</b> พหุนามลักษณะเฉพาะ p(λ) = det(λI − A)" + (n === 2 ? " (สูตร E3: λ² − (tr A)λ + det A)" : "") + "</p><p class=\"mc-line\">p(λ) = " + polyHtml(cp) + "</p>";
      if (fac && groups.some(function (g) { return g.exact; })) h += '<p class="mc-line">= ' + fac + "</p>";
      if (rest.length === 3 && restTxt) h += '<p class="hint">ตัวประกอบกำลังสองที่เหลือแก้ด้วยสูตร λ = [−b ± √(b² − 4ac)] / 2a ได้ ' + esc(restTxt) + "</p>";
      if (rest.length > 3) h += '<p class="hint">ส่วนที่เหลือไม่มีรากตรรกยะ จึงหารากเชิงตัวเลข (Durand–Kerner) ความละเอียดประมาณ 10⁻⁹</p>';
      h += "<p><b>ขั้น 2</b> แต่ละ λ ลดแถว (A − λI)v = 0 หาเวกเตอร์เฉพาะ</p><ul class=\"mc-terms\">";
      groups.forEach(function (g) {
        if (g.exact) {
          var B = A.map(function (row, i2) { return row.map(function (x, j) { return i2 === j ? x.sub(g.q) : x; }); });
          var GJ = gaussJordan(B, n), M = GJ.M, free = [];
          for (var c = 0; c < n; c++) if (GJ.pivots.indexOf(c) < 0) free.push(c);
          var vecs = free.map(function (fc) { var v = []; for (var k = 0; k < n; k++) v.push(ZERO); v[fc] = ONE; GJ.pivots.forEach(function (pc, ri) { v[pc] = M[ri][fc].neg(); }); return intVec(v); });
          h += "<li><b>λ = " + g.q.str() + "</b>: A − λI " + mxHtml(B) + " → RREF " + mxHtml(M) + "<br>เวกเตอร์เฉพาะ: " + vecs.map(function (v) { return mxHtml(v.map(function (x) { return [x]; })); }).join(" , ") +
            ' <span class="hint">ภาวะซ้ำเชิงพีชคณิต ' + g.m + " · เชิงเรขาคณิต " + vecs.length + (vecs.length < g.m ? " → ไม่ครบ (defective) ทำเป็นทแยงมุมไม่ได้" : "") + "</span></li>";
        } else {
          var vs = nullVecNumeric(A, g.val);
          h += "<li><b>λ ≈ " + fmtC(g.val) + "</b>: " + (vs ? "เวกเตอร์เฉพาะ (ปรับให้สมาชิกที่ใหญ่สุดเป็น 1) " + vs.map(function (v) { return mxHtml(v.map(function (x) { return [fmtC(x)]; })); }).join(" , ") : "หาเวกเตอร์เชิงตัวเลขไม่สำเร็จ") + (g.val[1] ? ' <span class="hint">ค่าเชิงซ้อนมาเป็นคู่สังยุค เวกเตอร์ก็สังยุคกัน (E8)</span>' : "") + "</li>";
        }
      });
      return h + "</ul></details>";
    }
    // events
    box.querySelector(".mc-modes").addEventListener("click", function (e) { var b = e.target.closest("button[data-m]"); if (!b) return; st.mode = b.getAttribute("data-m"); build(); });
    sel.addEventListener("change", function () { st.n = +sel.value; build(); });
    box.querySelector(".mc-in").addEventListener("input", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-i")) vals.A[+t.getAttribute("data-i")][+t.getAttribute("data-j")] = t.value;
      else if (t.hasAttribute("data-b")) vals.b[+t.getAttribute("data-b")] = t.value;
      compute();
    });
    box.querySelector(".mc-in").addEventListener("paste", function (e) {
      var text = (e.clipboardData || window.clipboardData).getData("text");
      var rows = text.replace(/[\[\]{}]/g, "\n").split(/[\n;]+/).map(function (r) { return r.trim(); }).filter(Boolean).map(function (r) { return r.split(/[\s,\t]+/).filter(Boolean); });
      if (rows.length < 2 || rows.some(function (r) { return r.length < 2; })) return;
      e.preventDefault();
      var n = Math.min(4, rows.length), withB = rows[0].length === n + 1;
      for (var i = 0; i < n; i++) { for (var j = 0; j < n; j++) vals.A[i][j] = rows[i][j] !== undefined ? rows[i][j] : "0"; if (withB) vals.b[i] = rows[i][n]; }
      st.n = Math.max(2, n); build();
    });
    box.querySelector(".mc-in").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var list = Array.prototype.slice.call(box.querySelectorAll(".mc-in input")), k = list.indexOf(e.target);
      if (k >= 0) { e.preventDefault(); (list[k + 1] || list[0]).focus(); (list[k + 1] || list[0]).select(); }
    });
    box.querySelector(".mc-actions").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        if (act === "clear") vals.A[i][j] = "0";
        else vals.A[i][j] = String(Math.floor(Math.random() * 11) - 5);
      }
      for (i = 0; i < 4; i++) vals.b[i] = act === "clear" ? "0" : String(Math.floor(Math.random() * 21) - 10);
      build();
    });
    box._load = function (q) {
      var p = {}; q.split("&").forEach(function (kv) { var a = kv.split("="); p[a[0]] = decodeURIComponent(a[1] || ""); });
      if (p.A) { var rows = p.A.split(";").map(function (r) { return r.split(","); }); st.n = rows.length; for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) vals.A[i][j] = rows[i] && rows[i][j] !== undefined ? rows[i][j] : i === j ? "1" : "0"; }
      if (p.b) { var bb = p.b.split(","); for (i = 0; i < 4; i++) vals.b[i] = bb[i] !== undefined ? bb[i] : "0"; }
      if (p.mode && modes.indexOf(p.mode) >= 0) st.mode = p.mode;
      build();
    };
    build();
    calcs.push(box);
  });
  // "ลองในเครื่องคิดเลข" buttons fill the page's calculator
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".calc-go"); if (!b) return;
    var box = calcs[0];
    if (!box) { location.href = "/learn/linear-algebra/matrix-lab/#calc=" + encodeURIComponent(b.getAttribute("data-calc")); return; }
    box._load(b.getAttribute("data-calc"));
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  // a link to …/matrix-lab/#calc=mode=inv&A=… opens the matrix lab with that problem loaded
  (function () {
    var m = /^#calc=(.+)$/.exec(location.hash);
    if (!m || !calcs[0]) return;
    try { calcs[0]._load(decodeURIComponent(m[1])); } catch (e) { return; }
    setTimeout(function () { calcs[0].scrollIntoView({ block: "start" }); }, 60);
  })();
})();
