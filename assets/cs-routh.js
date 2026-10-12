/* Routh–Hurwitz calculator with steps.
   Markup: <div class="rh-calc" data-p="s^3+3s^2+2s+K" data-presets='[{"n":"…","p":"…"}]'></div>
   The polynomial may contain one gain symbol K (entries become rational functions of K and the stable K range is found),
   or be written as a characteristic equation such as 1 + K/(s(s+1)(s+2)) (it is multiplied out).
   Special cases: a zero first element (ε method, done symbolically in ε) and a row of zeros (auxiliary polynomial).
   Uses CS.roots / CS.fmt from assets/cs-core.js when present. */
(function () {
  "use strict";
  var CS = window.CS || {};
  var EPS = 1e-9;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmtN(v) {
    if (!isFinite(v)) return v > 0 ? "∞" : "−∞";
    if (Math.abs(v) < 1e-10) return "0";
    var r = Math.round(v);
    if (Math.abs(v - r) < 1e-9 * Math.max(1, Math.abs(v))) return String(r).replace("-", "−");
    // simple fractions with small denominators
    for (var d = 2; d <= 12; d++) { var n = Math.round(v * d); if (Math.abs(v * d - n) < 1e-9 * Math.max(1, Math.abs(v * d))) return (n < 0 ? "−" : "") + Math.abs(n) + "/" + d; }
    var a = Math.abs(v), s = a >= 100 ? a.toFixed(2) : a >= 1 ? a.toPrecision(5) : a.toPrecision(4);
    s = s.indexOf("e") < 0 && s.indexOf(".") >= 0 ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
    return (v < 0 ? "−" : "") + s;
  }

  /* ---------------- univariate polynomials (ascending coefficients) in one parameter v (K or ε) */
  function ptrim(p) { var q = p.slice(); while (q.length > 1 && Math.abs(q[q.length - 1]) < 1e-12) q.pop(); if (!q.length) q = [0]; return q; }
  function padd(a, b) { var n = Math.max(a.length, b.length), r = []; for (var i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0)); return ptrim(r); }
  function pneg(a) { return a.map(function (x) { return -x; }); }
  function pmul(a, b) { var r = new Array(a.length + b.length - 1).fill(0); for (var i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]; return ptrim(r); }
  function pzero(a) { a = ptrim(a); return a.length === 1 && Math.abs(a[0]) < 1e-11; }
  function pdeg(a) { a = ptrim(a); return pzero(a) ? -1 : a.length - 1; }
  function peval(a, x) { var s = 0; for (var i = a.length - 1; i >= 0; i--) s = s * x + a[i]; return s; }
  function pscale(a, k) { return ptrim(a.map(function (x) { return x * k; })); }
  function pmax(a) { var m = 0; a.forEach(function (x) { m = Math.max(m, Math.abs(x)); }); return m; }
  function pnorm(a) { var m = 0; a.forEach(function (x) { m = Math.max(m, Math.abs(x)); }); return m || 1; }
  function pdivmod(a, b) {
    a = ptrim(a).slice(); b = ptrim(b);
    var db = b.length - 1, q = new Array(Math.max(1, a.length - db)).fill(0);
    while (a.length - 1 >= db && !pzero(a)) {
      var k = a.length - 1 - db, c = a[a.length - 1] / b[db];
      q[k] = c;
      for (var i = 0; i <= db; i++) a[i + k] -= c * b[i];
      a.pop(); if (!a.length) a = [0];
      a = ptrim(a);
      if (a.length - 1 < db) break;
    }
    return { q: ptrim(q), r: ptrim(a) };
  }
  function pgcd(a, b) {
    a = ptrim(a); b = ptrim(b);
    var scale = Math.max(pnorm(a), pnorm(b));
    for (var it = 0; it < 20 && !pzero(b); it++) {
      var r = pdivmod(a, b).r;
      if (pmax(r) < 1e-8 * scale) r = [0];
      a = b; b = r;
    }
    var lc = a[a.length - 1];
    return pscale(a, 1 / lc);
  }
  // rational functions in v
  function R(n, d) { return { n: ptrim(n), d: ptrim(d || [1]) }; }
  function rsimp(r) {
    if (pzero(r.n)) return R([0], [1]);
    if (pdeg(r.d) > 0 && pdeg(r.n) >= 0) {
      var g = pgcd(r.n, r.d);
      if (pdeg(g) > 0) { var n2 = pdivmod(r.n, g), d2 = pdivmod(r.d, g); if (pmax(n2.r) < 1e-7 * pnorm(r.n) && pmax(d2.r) < 1e-7 * pnorm(r.d)) r = R(n2.q, d2.q); }
    }
    // make the denominator's leading coefficient positive and 1 when it is a constant
    var lc = r.d[r.d.length - 1];
    if (pdeg(r.d) === 0) return R(pscale(r.n, 1 / lc), [1]);
    if (lc < 0) r = R(pneg(r.n), pneg(r.d));
    return r;
  }
  function rsub(a, b) { return rsimp(R(padd(pmul(a.n, b.d), pneg(pmul(b.n, a.d))), pmul(a.d, b.d))); }
  function rmul(a, b) { return rsimp(R(pmul(a.n, b.n), pmul(a.d, b.d))); }
  function rdiv(a, b) { return rsimp(R(pmul(a.n, b.d), pmul(a.d, b.n))); }
  function rzero(a) { return pzero(a.n); }
  function reval(a, x) { return peval(a.n, x) / peval(a.d, x); }
  // sign as v -> 0+ (ε method): sign of the lowest non-zero coefficient of n·d
  function rsign0(a) {
    var lo = function (p) { for (var i = 0; i < p.length; i++) if (Math.abs(p[i]) > 1e-11) return p[i]; return 0; };
    return Math.sign(lo(a.n) * lo(a.d));
  }

  /* ---------------- display of polynomials in v */
  function fracParts(a) { // a > 0 → [num, den] when a is a simple fraction
    for (var d = 1; d <= 12; d++) { var n = Math.round(a * d); if (n > 0 && Math.abs(a * d - n) < 1e-9 * Math.max(1, a * d)) return [n, d]; }
    return null;
  }
  function polyStr(p, v) {
    p = ptrim(p);
    var out = "", idx = [];
    for (var i = 0; i < p.length; i++) idx.push(i);
    if (v === "ε") idx.reverse(); // K: ascending (2 − K/3), ε: descending (4ε − 12)
    idx.forEach(function (i) {
      var c = p[i];
      if (Math.abs(c) < 1e-11) return;
      var a = Math.abs(c), term, vv = v + (i > 1 ? "<sup>" + i + "</sup>" : "");
      if (i === 0) term = fmtN(a);
      else {
        var f = fracParts(a);
        if (f) term = (f[0] === 1 ? "" : f[0]) + vv + (f[1] === 1 ? "" : "/" + f[1]);
        else term = fmtN(a) + vv;
      }
      out += out ? (c < 0 ? " − " : " + ") + term : (c < 0 ? "−" : "") + term;
    });
    return out || "0";
  }
  function ratStr(r, v) {
    var n = polyStr(r.n, v);
    if (pdeg(r.d) <= 0) return n;
    var nt = ptrim(r.n).filter(function (x) { return Math.abs(x) > 1e-11; }).length > 1;
    var dt = ptrim(r.d).filter(function (x) { return Math.abs(x) > 1e-11; }).length > 1, ds = polyStr(r.d, v);
    return (nt ? "(" + n + ")" : n) + " / " + (dt ? "(" + ds + ")" : ds);
  }

  /* ---------------- expression parser: polynomials in s and K, with division (multiplied out) */
  // bivariate poly: P[i][j] = coef of s^i K^j
  function B(c) { return [[c]]; }
  function bt(P) { // trim
    var Q = P.map(function (row) { var r = row.slice(); while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop(); return r; });
    while (Q.length > 1 && Q[Q.length - 1].every(function (x) { return Math.abs(x) < 1e-12; })) Q.pop();
    return Q;
  }
  function badd(A, C) { var n = Math.max(A.length, C.length), R2 = []; for (var i = 0; i < n; i++) { var a = A[i] || [0], c = C[i] || [0], m = Math.max(a.length, c.length), row = []; for (var j = 0; j < m; j++) row.push((a[j] || 0) + (c[j] || 0)); R2.push(row); } return bt(R2); }
  function bneg(A) { return A.map(function (r) { return r.map(function (x) { return -x; }); }); }
  function bmul(A, C) {
    var R2 = [];
    for (var i = 0; i < A.length; i++) for (var k = 0; k < C.length; k++) {
      var ri = i + k; R2[ri] = R2[ri] || [];
      for (var j = 0; j < A[i].length; j++) for (var l = 0; l < C[k].length; l++) R2[ri][j + l] = (R2[ri][j + l] || 0) + A[i][j] * C[k][l];
    }
    for (var t = 0; t < R2.length; t++) { R2[t] = R2[t] || [0]; for (var u = 0; u < R2[t].length; u++) R2[t][u] = R2[t][u] || 0; }
    return bt(R2);
  }
  function bconst(A) { return A.length === 1 && A[0].length === 1 ? A[0][0] : null; }
  function parse(src) {
    var s = src.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/×|·/g, "*").replace(/\*\*/g, "^").replace(/=0$/, "");
    var i = 0;
    function peek() { return s[i]; }
    function num() { var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (!m) return null; i += m[0].length; return parseFloat(m[0]); }
    function expr() { var v = term(); while (peek() === "+" || peek() === "-") { var op = s[i++], w = term(); v = op === "+" ? radd(v, w) : radd(v, rneg(w)); } return v; }
    function term() {
      var v = unary();
      for (;;) {
        var c = peek();
        if (c === "*") { i++; v = rm(v, unary()); }
        else if (c === "/") { i++; v = rd(v, unary()); }
        else if (c === "(" || c === "s" || c === "K" || c === "k" || (c && /[\d.]/.test(c))) v = rm(v, unary());
        else break;
      }
      return v;
    }
    function unary() { if (peek() === "-") { i++; return rneg(unary()); } if (peek() === "+") { i++; return unary(); } return power(); }
    function power() {
      var b = atom();
      if (peek() === "^") { i++; var e = num(); if (e == null || e !== Math.floor(e) || e < 0 || e > 20) throw new Error("เลขชี้กำลังต้องเป็นจำนวนเต็ม 0–20"); var r = { n: B(1), d: B(1) }; for (var k = 0; k < e; k++) r = rm(r, b); return r; }
      return b;
    }
    function atom() {
      var c = peek();
      if (c === "(") { i++; var v = expr(); if (s[i] !== ")") throw new Error("วงเล็บไม่ครบ"); i++; return v; }
      if (c === "s") { i++; return { n: [[0], [1]], d: B(1) }; }
      if (c === "K" || c === "k") { i++; return { n: [[0, 1]], d: B(1) }; }
      var n = num(); if (n != null) return { n: B(n), d: B(1) };
      throw new Error("อ่านไม่ออกที่ตำแหน่ง " + (i + 1) + (c ? " (“" + c + "”)" : ""));
    }
    function radd(a, b) { return { n: badd(bmul(a.n, b.d), bmul(b.n, a.d)), d: bmul(a.d, b.d) }; }
    function rneg(a) { return { n: bneg(a.n), d: a.d }; }
    function rm(a, b) { return { n: bmul(a.n, b.n), d: bmul(a.d, b.d) }; }
    function rd(a, b) { return { n: bmul(a.n, b.d), d: bmul(a.d, b.n) }; }
    var v = expr();
    if (i < s.length) throw new Error("อ่านไม่ออกที่ตำแหน่ง " + (i + 1) + " (“" + s[i] + "”)");
    // characteristic polynomial = numerator; divide out a constant denominator
    var dc = bconst(v.d), P = v.n;
    if (dc != null) P = P.map(function (r) { return r.map(function (x) { return x / dc; }); });
    P = bt(P);
    // descending list of coefficients, each a polynomial in K
    var n = P.length - 1, co = [];
    for (var d = n; d >= 0; d--) co.push(ptrim(P[d] || [0]));
    // strip leading zero coefficients and factors of s (zero roots)
    while (co.length > 1 && pzero(co[0])) co.shift();
    var zeroRoots = 0;
    while (co.length > 1 && pzero(co[co.length - 1])) { co.pop(); zeroRoots++; }
    var hasK = co.some(function (c) { return pdeg(c) > 0; });
    // make the leading coefficient positive when it is a constant
    if (pdeg(co[0]) === 0 && co[0][0] < 0) co = co.map(pneg);
    return { co: co, hasK: hasK, zeroRoots: zeroRoots, rational: dc == null };
  }

  /* ---------------- the Routh array */
  // co: descending coefficients, each a polynomial in v. Returns rows of rationals plus notes.
  function routh(co, opt) {
    opt = opt || {};
    var n = co.length - 1, cols = Math.floor(n / 2) + 1, rows = [], notes = [], usedEps = false, aux = null;
    var r0 = [], r1 = [];
    for (var j = 0; j < cols; j++) { r0.push(R(co[2 * j] || [0])); r1.push(R(co[2 * j + 1] || [0])); }
    rows.push(r0); if (n >= 1) rows.push(r1);
    var tags = [[], []];
    function allZero(row) { return row.every(rzero); }
    function fixRow(idx) {
      var row = rows[idx], power = n - idx;
      if (allZero(row) && power >= 1) {
        // auxiliary polynomial from the row above
        var prev = rows[idx - 1], p = power + 1, A = [];
        prev.forEach(function (c, k) { var e = p - 2 * k; if (e >= 0) A.push({ e: e, c: c }); });
        aux = { power: p, terms: A, row: idx - 1 };
        notes.push({ t: "aux", idx: idx, power: p, terms: A });
        rows[idx] = row.map(function (_, k) { var t = A[k]; return t && t.e > 0 ? rmul(t.c, R([t.e])) : R([0]); });
        tags[idx] = rows[idx].map(function () { return "aux"; });
        return;
      }
      if (rzero(row[0]) && !allZero(row)) {
        if (opt.v === "K") { notes.push({ t: "zeroK", idx: idx }); return; }
        row[0] = R([0, 1]); usedEps = true; tags[idx][0] = "eps";
        notes.push({ t: "eps", idx: idx });
      }
    }
    if (n >= 1) fixRow(1);
    for (var i = 2; i <= n; i++) {
      var a = rows[i - 2], b = rows[i - 1], row = [];
      tags[i] = [];
      for (var k = 0; k < cols; k++) {
        if (rzero(b[0])) { row.push(R([0])); continue; }
        var num = rsub(rmul(b[0], a[k + 1] || R([0])), rmul(a[0], b[k + 1] || R([0])));
        row.push(rdiv(num, b[0]));
      }
      rows.push(row);
      fixRow(i);
    }
    return { rows: rows, n: n, cols: cols, notes: notes, usedEps: usedEps, aux: aux, tags: tags };
  }

  /* ---------------- real roots of a polynomial (ascending) via CS.roots or companion-free bisection */
  function realRoots(p) {
    p = ptrim(p);
    var d = p.length - 1;
    if (d < 1) return [];
    if (d === 1) return [-p[0] / p[1]];
    var out = [];
    if (CS.roots) {
      CS.roots(p.slice().reverse()).forEach(function (r) { if (Math.abs(r.im) < 1e-7 * (1 + Math.abs(r.re))) out.push(r.re); });
    } else {
      // dense scan fallback
      var lo = -1e4, hi = 1e4, N = 40000, prev = peval(p, lo);
      for (var k = 1; k <= N; k++) { var x = lo + (hi - lo) * k / N, v = peval(p, x); if (prev * v <= 0) out.push(x); prev = v; }
    }
    return out;
  }

  function signChanges(signs) { var c = 0, last = 0; signs.forEach(function (s) { if (s === 0) return; if (last && s !== last) c++; last = s; }); return c; }

  /* ---------------- stable K range */
  function kRange(co, tab) {
    var crit = [0];
    tab.rows.forEach(function (row) { [row[0]].forEach(function (c) { crit = crit.concat(realRoots(c.n), realRoots(c.d)); }); });
    crit = crit.filter(function (x) { return isFinite(x); }).sort(function (a, b) { return a - b; });
    var uniq = [];
    crit.forEach(function (x) { if (!uniq.length || Math.abs(x - uniq[uniq.length - 1]) > 1e-7 * (1 + Math.abs(x))) uniq.push(x); });
    var pts = [uniq[0] - 1 - Math.abs(uniq[0])].concat(uniq), test = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = i + 1 < pts.length ? pts[i + 1] : pts[i] + 1 + Math.abs(pts[i]);
      var m = (a + b) / 2;
      var ok = tab.rows.every(function (row) { var v = reval(row[0], m); return isFinite(v) && v > 0; });
      // coefficients must also keep the leading coefficient positive (all first-column positive covers it)
      test.push({ a: i === 0 ? -Infinity : a, b: i + 1 < pts.length ? b : Infinity, ok: ok });
    }
    // merge adjacent stable intervals
    var iv = [];
    test.forEach(function (t) { if (!t.ok) return; if (iv.length && Math.abs(iv[iv.length - 1].b - t.a) < 1e-9) iv[iv.length - 1].b = t.b; else iv.push({ a: t.a, b: t.b }); });
    return { iv: iv, crit: uniq };
  }
  function polyAt(co, K) { return co.map(function (c) { return [peval(c, K)]; }); }
  function jwRoots(co, K) {
    if (!CS.roots) return [];
    var p = co.map(function (c) { return peval(c, K); });
    return CS.roots(p).filter(function (r) { return Math.abs(r.re) < 1e-5 * (1 + Math.abs(r.im)) && r.im > 1e-6; }).map(function (r) { return r.im; });
  }

  /* ---------------- UI */
  function Calc(root) {
    this.root = root; root._calc = this;
    var d = root.dataset, self = this;
    this.presets = [];
    try { if (d.presets) this.presets = JSON.parse(d.presets); } catch (e) {}
    var html = '<div class="cs-bar"><label class="cs-f cs-f-tf"><span class="mono">พหุนาม =</span><input class="cs-tf rh-in" type="text" spellcheck="false" autocomplete="off" aria-label="พหุนามลักษณะเฉพาะ"></label>';
    if (this.presets.length) html += '<label class="cs-f"><span class="mono">ตัวอย่าง</span><select class="cs-pre rh-pre">' + this.presets.map(function (p, i) { return '<option value="' + i + '">' + esc(p.n) + "</option>"; }).join("") + "</select></label>";
    html += '<button type="button" class="cs-btn rh-go">สร้างตาราง</button></div>';
    html += '<p class="hint rh-help">พิมพ์ได้ทั้งพหุนาม เช่น <code>s^4+2s^3+3s^2+4s+5</code> มีเกน <code>s^3+3s^2+2s+K</code> หรือสมการ <code>1+K/(s(s+1)(s+2))</code> ระบบจะคูณกระจายให้</p>';
    html += '<div class="cs-err rh-err" role="alert" hidden></div><div class="rh-out" aria-live="polite"></div>';
    root.innerHTML = html;
    this.inp = root.querySelector(".rh-in"); this.out = root.querySelector(".rh-out"); this.err = root.querySelector(".rh-err");
    this.inp.value = d.p || (this.presets[0] && this.presets[0].p) || "s^4+2s^3+3s^2+4s+5";
    this.inp.addEventListener("keydown", function (e) { if (e.key === "Enter") self.run(); });
    root.querySelector(".rh-go").addEventListener("click", function () { self.run(); });
    var pre = root.querySelector(".rh-pre");
    if (pre) pre.addEventListener("change", function () { self.inp.value = self.presets[+pre.value].p; self.run(); });
    root.addEventListener("click", function (e) { var b = e.target.closest("[data-kt]"); if (b) { self.kTest = parseFloat(b.dataset.kt); self.run(true); } });
    root.addEventListener("change", function (e) { if (e.target.classList.contains("rh-k")) { var v = parseFloat(e.target.value); if (isFinite(v)) { self.kTest = v; self.run(true); } } });
    this.run();
  }
  Calc.prototype.run = function (keepK) {
    var P;
    this.err.hidden = true;
    try { P = parse(this.inp.value); } catch (e) { this.err.hidden = false; this.err.textContent = "อ่านพหุนามไม่ได้: " + e.message; return; }
    if (P.co.length < 2) { this.err.hidden = false; this.err.textContent = "ต้องเป็นพหุนามดีกรีอย่างน้อย 1"; return; }
    if (P.co.length > 13) { this.err.hidden = false; this.err.textContent = "รองรับดีกรีไม่เกิน 12"; return; }
    if (!keepK) this.kTest = null;
    var o = "";
    var v = P.hasK ? "K" : "ε";
    var n = P.co.length - 1;
    o += '<p class="rh-poly">พหุนามลักษณะเฉพาะ (ดีกรี ' + n + "): <b class=\"mono\">" + charStr(P.co, P.hasK) + " = 0</b>" + (P.zeroRoots ? ' <span class="mono">(ดึงตัวประกอบ s<sup>' + P.zeroRoots + "</sup> ออกแล้ว: มีราก s = 0 จำนวน " + P.zeroRoots + " ตัว)</span>" : "") + "</p>";
    // necessary condition
    if (!P.hasK) {
      var cs = P.co.map(function (c) { return c[0]; });
      var miss = cs.some(function (c) { return Math.abs(c) < 1e-12; }), neg = cs.some(function (c) { return c < 0; });
      if (miss || neg) o += '<p class="rh-steps">เงื่อนไขจำเป็น: ' + (neg ? "มีสัมประสิทธิ์เป็นลบ" : "มีพจน์ที่หายไป") + " จึง<b>ไม่เสถียรแน่นอน</b>ก่อนสร้างตาราง (ยังสร้างต่อเพื่อนับจำนวนรากฝั่งขวา)</p>";
    }
    var tab = routh(P.co, { v: v });
    o += tableHTML(tab, v);
    if (!P.hasK) o += this.verdictNum(P, tab);
    else o += this.verdictK(P, tab);
    this.out.innerHTML = o;
  };
  function charStr(co, hasK) {
    var n = co.length - 1, out = "";
    co.forEach(function (c, k) {
      var e = n - k;
      if (pzero(c)) return;
      var cs, sign = "+";
      var nz = ptrim(c).filter(function (x) { return Math.abs(x) > 1e-11; }).length;
      if (nz === 1) {
        var lead = ptrim(c), val = lead[lead.length - 1];
        sign = val < 0 ? "−" : "+";
        var abs = R(pscale(c, val < 0 ? -1 : 1));
        cs = polyStr(abs.n, "K");
        if (cs === "1" && e > 0) cs = "";
      } else { cs = "(" + polyStr(c, "K") + ")"; }
      var term = cs + (e > 0 ? "s" + (e > 1 ? "<sup>" + e + "</sup>" : "") : "");
      if (e === 0 && !cs) term = "1";
      out += out ? " " + sign + " " + term : (sign === "−" ? "−" : "") + term;
    });
    return out;
  }
  function tableHTML(tab, v) {
    var o = '<div class="table-wrap"><table class="rh-tab"><thead><tr><th>แถว</th>';
    for (var j = 0; j < tab.cols; j++) o += "<th>" + (j === 0 ? "หลักแรก" : "หลัก " + (j + 1)) + "</th>";
    o += "</tr></thead><tbody>";
    tab.rows.forEach(function (row, i) {
      var p = tab.n - i;
      o += "<tr><th>s<sup>" + p + "</sup></th>";
      row.forEach(function (c, j) {
        var cls = [];
        var tag = tab.tags[i] && tab.tags[i][j];
        if (tag === "eps") cls.push("eps");
        if (tag === "aux") cls.push("eps");
        var txt = ratStr(c, v);
        if (j === 0 && v === "ε") { var sg = rsign0(c); if (sg < 0) cls.push("neg"); }
        else if (j === 0 && pdeg(c.n) <= 0 && pdeg(c.d) <= 0 && reval(c, 0) < 0) cls.push("neg");
        o += '<td class="' + cls.join(" ") + '">' + (j > 0 && rzero(c) && j >= Math.ceil((p + 1) / 2) ? '<span style="opacity:.35">0</span>' : txt) + "</td>";
      });
      o += "</tr>";
    });
    o += "</tbody></table></div>";
    var notes = tab.notes.map(function (nt) {
      var p = tab.n - nt.idx;
      if (nt.t === "eps") return "แถว s<sup>" + p + "</sup>: หลักแรกเป็นศูนย์แต่แถวไม่เป็นศูนย์ทั้งแถว แทนด้วย ε (บวกเล็กมาก) แล้วคำนวณต่อ เครื่องหมายดูตอน ε → 0⁺";
      if (nt.t === "aux") return "แถว s<sup>" + p + "</sup> เป็นศูนย์ทั้งแถว: สร้างพหุนามช่วย A(s) จากแถว s<sup>" + nt.power + "</sup> = " + auxStr(nt.terms, v) + " แล้วแทนแถวด้วยสัมประสิทธิ์ของ dA/ds";
      if (nt.t === "zeroK") return "แถว s<sup>" + p + "</sup>: หลักแรกเป็นศูนย์สำหรับทุก K ลองทดสอบที่ค่า K เฉพาะด้านล่าง";
      return "";
    });
    if (notes.length) o += '<ul class="rh-steps">' + notes.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
    return o;
  }
  function auxStr(terms, v) {
    return terms.map(function (t, k) {
      var c = ratStr(t.c, v), sv = t.e > 0 ? "s" + (t.e > 1 ? "<sup>" + t.e + "</sup>" : "") : "";
      if (sv && c === "1") c = "";
      return (k ? " + " : "") + (c.indexOf(" ") > 0 && sv ? "(" + c + ")" : c) + sv;
    }).join("").replace(/\+ −/g, "− ");
  }
  Calc.prototype.verdictNum = function (P, tab) {
    var signs = tab.rows.map(function (row) { return rsign0(row[0]); });
    var rhp = signChanges(signs), o = '<div class="rh-out">';
    var colTxt = tab.rows.map(function (row) { return ratStr(row[0], "ε"); }).join(", ");
    o += "<p>หลักแรก: <span class=\"mono\">" + colTxt + "</span> · เครื่องหมาย " + signs.map(function (s) { return s > 0 ? "+" : s < 0 ? "−" : "0"; }).join(" ") + " · เปลี่ยนเครื่องหมาย <b>" + rhp + "</b> ครั้ง</p>";
    var jw = 0, auxRoots = [];
    if (tab.aux && CS.roots) {
      // roots of the auxiliary polynomial are roots of the original too (symmetric about the origin)
      var deg = tab.aux.power, A = new Array(deg + 1).fill(0);
      tab.aux.terms.forEach(function (t) { A[deg - t.e] = reval(t.c, 0); });
      auxRoots = CS.roots(A);
      auxRoots.forEach(function (r) { if (Math.abs(r.re) < 1e-6) jw++; });
    }
    var z = P.zeroRoots;
    var lhp = P.co.length - 1 - rhp - jw;
    var verdict;
    if (rhp > 0) verdict = '<b class="cs-bad">ไม่เสถียร</b> มีราก ' + rhp + " ตัวอยู่ฝั่งขวาของระนาบ s";
    else if (jw > 0 || z > 0) verdict = '<b class="cs-warn">เสถียรวิกฤต (marginally stable)</b> ไม่มีรากฝั่งขวา แต่มีรากบนแกน jω ' + (jw + z) + " ตัว" + (z > 1 || hasRepeated(auxRoots) ? " (ถ้ารากบนแกนซ้ำ ระบบไม่เสถียร)" : "");
    else verdict = '<b class="cs-ok">เสถียร</b> รากทั้งหมดอยู่ฝั่งซ้าย';
    o += "<p>สรุป: " + verdict + "</p>";
    o += '<p class="rh-steps">ฝั่งซ้าย ' + lhp + " · บนแกน jω " + (jw + z) + " · ฝั่งขวา " + rhp + (tab.usedEps ? " · ใช้วิธี ε" : "") + (tab.aux ? " · ใช้พหุนามช่วย" : "") + "</p>";
    if (CS.roots) {
      var p = P.co.map(function (c) { return c[0]; });
      var rs = CS.roots(p).sort(function (a, b) { return b.re - a.re; });
      o += '<p class="rh-steps">ตรวจด้วยรากจริง: ' + rs.filter(function (r) { return r.im >= -1e-9; }).map(function (r) { return '<span class="mono">' + (Math.abs(r.im) > 1e-7 ? fmtN(round(r.re)) + " ± j" + fmtN(round(r.im)) : fmtN(round(r.re))) + "</span>"; }).join(" , ") + (P.zeroRoots ? " , 0" : "") + "</p>";
    }
    return o + "</div>";
  };
  function round(x) { return Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e4) / 1e4; }
  function hasRepeated(rs) { for (var i = 0; i < rs.length; i++) for (var j = i + 1; j < rs.length; j++) if (Math.abs(rs[i].re - rs[j].re) + Math.abs(rs[i].im - rs[j].im) < 1e-4 && Math.abs(rs[i].re) < 1e-6) return true; return false; }
  Calc.prototype.verdictK = function (P, tab) {
    var o = '<div class="rh-out">';
    var conds = [];
    tab.rows.forEach(function (row, i) {
      var c = row[0];
      if (pdeg(c.n) <= 0 && pdeg(c.d) <= 0) return;
      conds.push('<li>แถว s<sup>' + (tab.n - i) + '</sup>: <span class="mono">' + ratStr(c, "K") + " &gt; 0</span></li>");
    });
    if (conds.length) o += "<p>ให้หลักแรกเป็นบวกทุกตัว:</p><ul class=\"rh-steps\">" + conds.join("") + "</ul>";
    var kr = kRange(P.co, tab), self = this;
    var ivs = kr.iv.map(function (iv) { return (isFinite(iv.a) ? fmtN(round(iv.a)) + " &lt; " : "") + "K" + (isFinite(iv.b) ? " &lt; " + fmtN(round(iv.b)) : ""); });
    o += "<p>ช่วงที่เสถียร: " + (ivs.length ? '<b class="cs-ok mono">' + ivs.join(" หรือ ") + "</b>" : '<b class="cs-bad">ไม่มีค่า K ใดที่ทำให้เสถียร</b>') + "</p>";
    // critical gains: finite interval ends, with oscillation frequency from the jω roots
    var ends = [];
    kr.iv.forEach(function (iv) { [iv.a, iv.b].forEach(function (k) { if (isFinite(k) && ends.every(function (e) { return Math.abs(e - k) > 1e-7; })) ends.push(k); }); });
    if (ends.length) {
      o += '<p class="rh-steps">ที่ขอบช่วง: ' + ends.map(function (k) {
        var w = jwRoots(P.co, k);
        return '<button type="button" class="cs-btn cs-sm" data-kt="' + k + '">K = ' + fmtN(round(k)) + "</button> " + (w.length ? "ระบบแกว่งค้างที่ ω = " + w.map(function (x) { return fmtN(round(x)); }).join(", ") + " rad/s" : (Math.abs(k) < 1e-9 ? "มีรากที่ s = 0" : "รากผ่านแกน jω"));
      }).join(" · ") + "</p>";
    }
    // test at a specific K
    var iv0 = kr.iv[0], kt = this.kTest;
    if (kt == null) kt = !iv0 ? 1 : isFinite(iv0.a) && isFinite(iv0.b) ? (Math.max(iv0.a, 0) + iv0.b) / 2 : isFinite(iv0.a) ? Math.max(1, 2 * iv0.a) : isFinite(iv0.b) ? iv0.b / 2 : 1;
    o += '<div class="cs-bar"><label class="cs-f"><span class="mono">ทดสอบที่ K =</span><input class="cs-kn rh-k" type="number" step="any" value="' + round(kt) + '"></label></div>';
    var co2 = polyAt(P.co, kt), tab2 = routh(co2, { v: "ε" });
    var P2 = { co: co2, zeroRoots: P.zeroRoots };
    o += tableHTML(tab2, "ε") + this.verdictNum(P2, tab2);
    return o + "</div>";
  };

  // buttons in worked examples: <button class="wx-btn" data-rh="s^3+3s^2+2s+K">ลองในเครื่องคิดเลข</button>
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rh]");
    if (!b) return;
    var el = document.querySelector("#calculator ~ .rh-calc, .rh-calc");
    if (!el || !el._calc) return;
    el._calc.inp.value = b.dataset.rh; el._calc.run();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  function init() { var els = document.querySelectorAll(".rh-calc"); for (var i = 0; i < els.length; i++) { try { new Calc(els[i]); } catch (e) { els[i].textContent = "โหลดเครื่องคิดเลขไม่สำเร็จ: " + e.message; } } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  CS.routh = { parse: parse, routh: routh, kRange: kRange, ratStr: ratStr, rsign0: rsign0 };
  window.CS = CS;
})();
