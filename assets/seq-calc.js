/* Sequence & series calculators (chapter 26.11, /learn/sequences-and-series/calculators/).
   Exact arithmetic with BigInt fractions and the quadratic fields Q(√D), so answers come out as fractions and surds, not decimals.
   Engine (window.SC in the browser, module.exports in Node; needs assets/seq-lab.js for the expression parser):
   - rationals Q, polynomials over Q, rational roots, factoring for display, Q(√D) arithmetic, exact Gaussian elimination
   - exact evaluation of an expression tree, exponential-polynomial form Σ P(k)·rᵏ, rational functions N(k)/D(k)
   - solvers: arithmetic/geometric (any 3 of a₁, d|r, n, aₙ, Sₙ), Σ closed forms (Faulhaber, P(k)rᵏ, telescoping by partial fractions),
     formula finder (difference table / Newton, geometric, hypergeometric ratio, Berlekamp–Massey), linear recurrences with constant
     coefficients up to order 3 + forcing P(n)sⁿ (characteristic roots, particular solution, constants, generating function, proof),
     Euler–Maclaurin and Cohen–Villegas–Zagier for high-precision sums, repeating decimals, means, annuities
   Widgets (each has worked steps and a 🎯 practice mode with answer checking):
   <div class="sc-ag" data-mode="arith|geo|two">            arithmetic / geometric solver
   <div class="sc-sigma" data-f="k^2" data-m="1" data-n="n">  Σ calculator with method detection
   <div class="sc-find" data-terms="2,6,12,20,30">            find the formula from terms
   <div class="sc-rec" data-c="1,1" data-a="0,1" data-n0="0" data-f="0">  linear recurrence solver
   <div class="sc-em" data-f="1/k^2" data-m="1" data-n="inf">  high-precision sums
   <div class="sc-misc" data-mode="decimal|means|annuity">    repeating decimal, inserting means, deposits and loans
   Buttons: <button data-sc-set='{"f":"k^3"}' data-sc-target="id">. The page reads ?q=… (MathSolver target) and fills the right widget. */
(function (root) {
  "use strict";
  var SQ = root.SQ || (typeof require === "function" ? require("./seq-lab.js") : null);

  // ======================================================================= BigInt rationals
  var Z = BigInt(0), O = BigInt(1), TWO = BigInt(2), TEN = BigInt(10);
  function err(msg) { var e = new Error(msg); e.user = true; return e; }
  var NE = function (why) { var e = new Error(why || "not exact"); e.notExact = true; return e; };
  function babs(a) { return a < Z ? -a : a; }
  function bgcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function blcm(a, b) { return a === Z || b === Z ? Z : babs(a / bgcd(a, b) * b); }
  function Q(n, d) {
    n = typeof n === "bigint" ? n : BigInt(n);
    d = d === undefined ? O : typeof d === "bigint" ? d : BigInt(d);
    if (d === Z) throw err("หารด้วยศูนย์");
    if (d < Z) { n = -n; d = -d; }
    var g = bgcd(n, d);
    if (g > O) { n /= g; d /= g; }
    return { n: n, d: d };
  }
  var Q0 = Q(0), Q1 = Q(1);
  function qadd(a, b) { return a.d === b.d ? Q(a.n + b.n, a.d) : Q(a.n * b.d + b.n * a.d, a.d * b.d); }
  function qsub(a, b) { return a.d === b.d ? Q(a.n - b.n, a.d) : Q(a.n * b.d - b.n * a.d, a.d * b.d); }
  function qmul(a, b) { return Q(a.n * b.n, a.d * b.d); }
  function qdiv(a, b) { if (b.n === Z) throw err("หารด้วยศูนย์"); return Q(a.n * b.d, a.d * b.n); }
  function qneg(a) { return { n: -a.n, d: a.d }; }
  function qinv(a) { return qdiv(Q1, a); }
  function qz(a) { return a.n === Z; }
  function qeq(a, b) { return a.n === b.n && a.d === b.d; }
  function qcmp(a, b) { var s = a.n * b.d - b.n * a.d; return s > Z ? 1 : s < Z ? -1 : 0; }
  function qsign(a) { return a.n > Z ? 1 : a.n < Z ? -1 : 0; }
  function qint(a) { return a.d === O; }
  function qabs(a) { return a.n < Z ? qneg(a) : a; }
  function qpow(a, e) {
    e = typeof e === "bigint" ? Number(e) : e;
    if (e < 0) return qpow(qinv(a), -e);
    if (e > 4000) throw err("เลขชี้กำลังใหญ่เกินไป");
    var r = Q1, b = a;
    while (e > 0) { if (e & 1) r = qmul(r, b); b = qmul(b, b); e = e >> 1; }
    return r;
  }
  function digits(b) { return babs(b).toString().length; }
  function qnum(a) {
    var x = Number(a.n) / Number(a.d);
    if (isFinite(x) && (Math.abs(x) > 1e-300 || a.n === Z)) return x;
    var neg = a.n < Z, n = babs(a.n), k = 18 - (digits(n) - digits(a.d));
    var q = k >= 0 ? n * TEN ** BigInt(k) / a.d : n / (a.d * TEN ** BigInt(-k));
    return (neg ? -1 : 1) * Number(q) * Math.pow(10, -k);
  }
  // exact value of a decimal literal "−12.5e-3" (also a JS number via its shortest round-trip string)
  function qdec(s) {
    var m = String(s).trim().replace(/[−–]/g, "-").match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
    if (!m || (m[2] === "" && (m[3] === undefined || m[3] === ""))) return null;
    var frac = m[3] || "", n = BigInt((m[2] || "0") + frac), d = TEN ** BigInt(frac.length), e = m[4] ? parseInt(m[4], 10) : 0;
    if (e > 0) n *= TEN ** BigInt(e); else if (e < 0) d *= TEN ** BigInt(-e);
    return Q(m[1] === "-" ? -n : n, d);
  }
  function qfromNum(x) {
    if (!isFinite(x)) throw NE("ค่าไม่จำกัด");
    if (Number.isInteger(x) && Math.abs(x) < 9e15) return Q(x);
    return qdec(String(x));
  }
  // "3/4", "-2", "0.125", "1 1/2" is not supported (write 3/2)
  function qparse(s) {
    s = String(s).trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
    if (!s) return null;
    var m = s.match(/^([+-]?[\d.]+(?:e[+-]?\d+)?)\/([+-]?[\d.]+(?:e[+-]?\d+)?)$/i);
    if (m) { var a = qdec(m[1]), b = qdec(m[2]); return a && b && !qz(b) ? qdiv(a, b) : null; }
    return qdec(s);
  }
  // TeX of a rational; o.inline → a/b, o.big → \dfrac
  function qtex(a, o) {
    o = o || {};
    if (a.d === O) return a.n.toString();
    var s = a.n < Z ? "-" : "", n = babs(a.n).toString(), d = a.d.toString();
    if (o.inline) return s + n + "/" + d;
    return s + (o.big ? "\\dfrac{" : "\\tfrac{") + n + "}{" + d + "}";
  }
  function qstr(a) { return a.d === O ? a.n.toString() : a.n.toString() + "/" + a.d.toString(); }
  function qdecStr(a, sig) { return fmtNum(qnum(a), sig || 10); }
  function fmtNum(x, sig) {
    if (!isFinite(x)) return isNaN(x) ? "—" : x > 0 ? "∞" : "−∞";
    if (x === 0) return "0";
    var ax = Math.abs(x);
    var t = ax >= 1e12 || ax < 1e-6 ? x.toExponential(Math.max(0, (sig || 10) - 1)) : String(+x.toPrecision(sig || 10));
    return t.replace(/e\+?/, "×10^").replace("-", "−");
  }
  function texNumF(x, sig) {
    if (!isFinite(x)) return isNaN(x) ? "\\text{—}" : x > 0 ? "\\infty" : "-\\infty";
    if (x === 0) return "0";
    var ax = Math.abs(x);
    if (ax >= 1e12 || ax < 1e-6) { var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e); return (+m.toPrecision(sig || 10)) + "\\times 10^{" + e + "}"; }
    return String(+x.toPrecision(sig || 10));
  }

  // ======================================================================= polynomials over Q (index = power)
  function ptrim(p) { p = p.slice(); while (p.length && qz(p[p.length - 1])) p.pop(); return p; }
  function pdeg(p) { return ptrim(p).length - 1; }
  function padd(a, b) { var n = Math.max(a.length, b.length), r = []; for (var i = 0; i < n; i++) r.push(qadd(a[i] || Q0, b[i] || Q0)); return ptrim(r); }
  function pneg(a) { return a.map(qneg); }
  function psub(a, b) { return padd(a, pneg(b)); }
  function pscale(a, c) { return ptrim(a.map(function (x) { return qmul(x, c); })); }
  function pmul(a, b) {
    if (!a.length || !b.length) return [];
    var r = []; for (var i = 0; i < a.length + b.length - 1; i++) r.push(Q0);
    for (i = 0; i < a.length; i++) if (!qz(a[i])) for (var j = 0; j < b.length; j++) r[i + j] = qadd(r[i + j], qmul(a[i], b[j]));
    return ptrim(r);
  }
  function ppow(a, e) { var r = [Q1]; for (var i = 0; i < e; i++) r = pmul(r, a); return r; }
  function pconst(c) { return qz(c) ? [] : [c]; }
  function pevalQ(p, x) { var r = Q0; for (var i = p.length - 1; i >= 0; i--) r = qadd(qmul(r, x), p[i]); return r; }
  function pevalN(p, x) { var r = 0; for (var i = p.length - 1; i >= 0; i--) r = r * x + qnum(p[i]); return r; }
  function pderiv(p) { var r = []; for (var i = 1; i < p.length; i++) r.push(qmul(p[i], Q(i))); return ptrim(r); }
  function pdivmod(a, b) {
    a = ptrim(a); b = ptrim(b);
    if (!b.length) throw err("หารพหุนามด้วยศูนย์");
    var q = [], r = a.slice(), db = b.length - 1, lb = b[db];
    for (var i = 0; i <= r.length - 1 - db; i++) q.push(Q0);
    while (r.length - 1 >= db && r.length) {
      var k = r.length - 1 - db, c = qdiv(r[r.length - 1], lb);
      q[k] = c;
      for (var j = 0; j <= db; j++) r[j + k] = qsub(r[j + k], qmul(c, b[j]));
      r = ptrim(r);
    }
    return { q: ptrim(q), r: r };
  }
  function pmonic(p) { p = ptrim(p); return p.length ? pscale(p, qinv(p[p.length - 1])) : p; }
  function pgcd(a, b) { a = ptrim(a); b = ptrim(b); while (b.length) { var r = pdivmod(a, b).r; a = b; b = r; } return pmonic(a); }
  // substitute x → x + h
  function pshift(p, h) {
    var r = [], base = [Q1];
    for (var i = 0; i < p.length; i++) { r = padd(r, pscale(base, p[i])); base = pmul(base, [h, Q1]); }
    return r;
  }
  function pcompose(p, q) { var r = []; for (var i = p.length - 1; i >= 0; i--) r = padd(pmul(r, q), pconst(p[i])); return r; }
  // integer content: c·(primitive integer polynomial)
  function pinteger(p) {
    p = ptrim(p);
    var L = O; p.forEach(function (c) { L = blcm(L, c.d); });
    var ints = p.map(function (c) { return c.n * (L / c.d); }), g = Z;
    ints.forEach(function (v) { g = bgcd(g, v); });
    if (g === Z) g = O;
    if (ints.length && ints[ints.length - 1] < Z) g = -g;
    return { c: Q(g, L), ints: ints.map(function (v) { return v / g; }) };
  }
  function divisors(n) {
    n = babs(n);
    if (n === Z) return [O];
    if (n > BigInt("1000000000000")) return null;
    var small = [], big = [];
    for (var d = O; d * d <= n; d++) if (n % d === Z) { small.push(d); if (d * d !== n) big.unshift(n / d); }
    return small.concat(big);
  }
  // rational roots with multiplicity: { roots: [{r, m}], rest: poly with no rational root }
  function prationalRoots(p) {
    p = ptrim(p);
    var roots = [], rest = p;
    if (rest.length <= 1) return { roots: roots, rest: rest };
    var m0 = 0; while (rest.length > 1 && qz(rest[0])) { rest = rest.slice(1); m0++; }
    if (m0) roots.push({ r: Q0, m: m0 });
    var guard = 0;
    for (;;) {
      if (rest.length <= 1 || ++guard > 40) break;
      var I = pinteger(rest).ints, a0 = I[0], an = I[I.length - 1];
      var dp = divisors(a0), dq = divisors(an);
      if (!dp || !dq) break;
      var found = null;
      for (var i = 0; i < dq.length && !found; i++) for (var j = 0; j < dp.length && !found; j++) {
        var cands = [Q(dp[j], dq[i]), Q(-dp[j], dq[i])];
        for (var c = 0; c < 2; c++) if (qz(pevalQ(rest, cands[c]))) { found = cands[c]; break; }
      }
      if (!found) break;
      var mult = 0;
      while (rest.length > 1 && qz(pevalQ(rest, found))) { rest = pdivmod(rest, [qneg(found), Q1]).q; mult++; }
      roots.push({ r: found, m: mult });
    }
    // display order: 0 first, then integer roots (descending), then fractions
    roots.sort(function (a, b) {
      var ka = qz(a.r) ? 0 : qint(a.r) ? 1 : 2, kb = qz(b.r) ? 0 : qint(b.r) ? 1 : 2;
      return ka !== kb ? ka - kb : qcmp(b.r, a.r);
    });
    return { roots: roots, rest: rest };
  }
  // TeX of a polynomial in v (highest power first); o.paren wraps sums in parentheses when not a monomial
  function ptex(p, v, o) {
    o = o || {}; p = ptrim(p); v = v || "n";
    if (!p.length) return "0";
    var s = "", first = true;
    for (var i = p.length - 1; i >= 0; i--) {
      var c = p[i]; if (qz(c)) continue;
      var neg = qsign(c) < 0, a = qabs(c), mono = i === 0 ? "" : i === 1 ? v : v + "^{" + i + "}";
      var coef = qeq(a, Q1) && i > 0 ? "" : qtex(a, o) + (i > 0 && a.d === O ? "" : "");
      if (i > 0 && !qeq(a, Q1) && a.d !== O) coef = qtex(a, o);
      s += (first ? (neg ? "-" : "") : neg ? " - " : " + ") + coef + mono;
      first = false;
    }
    return s;
  }
  // lowest power first (generating functions): 1 − x − x²
  function ptexAsc(p, v) {
    p = ptrim(p); v = v || "x";
    if (!p.length) return "0";
    var s = "", first = true;
    for (var i = 0; i < p.length; i++) {
      var c = p[i]; if (qz(c)) continue;
      var neg = qsign(c) < 0, a = qabs(c), mono = i === 0 ? "" : i === 1 ? v : v + "^{" + i + "}";
      var coef = qeq(a, Q1) && i > 0 ? "" : qtex(a);
      s += (first ? (neg ? "-" : "") : neg ? " - " : " + ") + coef + mono;
      first = false;
    }
    return s;
  }
  // as one fraction over the common denominator: (2n³ + 3n² + n)/6
  function ptexFrac(p, v) {
    p = ptrim(p);
    if (!p.length) return "0";
    var L = O; p.forEach(function (c) { L = blcm(L, c.d); });
    if (L === O) return ptex(p, v);
    var ip = p.map(function (c) { return Q(c.n * (L / c.d)); });
    return "\\dfrac{" + ptex(ip, v) + "}{" + L.toString() + "}";
  }
  // factored form via rational roots: n(n+1)(2n+1)/6; returns null when it would not be nicer
  function ptexFactored(p, v) {
    p = ptrim(p); v = v || "n";
    if (p.length <= 2) return null;
    var fr = prationalRoots(p);
    if (!fr.roots.length) return null;
    var factors = [], lead = Q1;
    fr.roots.forEach(function (rt) {
      // root a/b → factor (b·v − a), integer coefficients
      var f = qz(rt.r) ? v : rt.r.d === O ? "(" + v + (rt.r.n < Z ? " + " + (-rt.r.n).toString() : " - " + rt.r.n.toString()) + ")"
        : "(" + rt.r.d.toString() + v + (rt.r.n < Z ? " + " + (-rt.r.n).toString() : " - " + rt.r.n.toString()) + ")";
      for (var k = 0; k < rt.m; k++) lead = qmul(lead, Q(rt.r.d));
      factors.push(rt.m > 1 ? (f === v ? v + "^{" + rt.m + "}" : f + "^{" + rt.m + "}") : f);
    });
    var restI = pinteger(fr.rest), restTex = fr.rest.length > 1 ? "(" + ptex(restI.ints.map(function (x) { return Q(x); }), v) + ")" : "";
    var c = qdiv(fr.rest.length > 1 ? restI.c : fr.rest[0], lead);
    var body = factors.join("") + restTex;
    var sgn = qsign(c) < 0 ? "-" : "", ac = qabs(c);
    if (ac.d === O) return sgn + (ac.n === O ? "" : ac.n.toString()) + body;
    return sgn + (ac.n === O ? "" : "") + "\\dfrac{" + (ac.n === O ? "" : ac.n.toString()) + body + "}{" + ac.d.toString() + "}";
  }

  // ======================================================================= Q(√D): a + b√D (D square-free, D ≠ 0, 1); D = 0 → plain Q
  function squarefree(n) {
    // n: BigInt (≠ 0) → [s, D] with n = s²·D, D square-free
    var sign = n < Z ? -O : O, m = babs(n), s = O;
    for (var f = TWO; f * f <= m && f < BigInt(200000); f++) while (m % (f * f) === Z) { m /= f * f; s *= f; }
    return [s, sign * m];
  }
  function Field(D) {
    D = typeof D === "bigint" ? D : BigInt(D || 0);
    var F = { D: D };
    F.of = function (a, b) { return { a: a, b: b || Q0 }; };
    F.q = function (a) { return { a: a, b: Q0 }; };
    F.add = function (x, y) { return { a: qadd(x.a, y.a), b: qadd(x.b, y.b) }; };
    F.sub = function (x, y) { return { a: qsub(x.a, y.a), b: qsub(x.b, y.b) }; };
    F.neg = function (x) { return { a: qneg(x.a), b: qneg(x.b) }; };
    F.mul = function (x, y) { var Dq = Q(D); return { a: qadd(qmul(x.a, y.a), qmul(Dq, qmul(x.b, y.b))), b: qadd(qmul(x.a, y.b), qmul(x.b, y.a)) }; };
    F.inv = function (x) {
      var den = qsub(qmul(x.a, x.a), qmul(Q(D), qmul(x.b, x.b)));
      if (qz(den)) throw err("หารด้วยศูนย์");
      return { a: qdiv(x.a, den), b: qneg(qdiv(x.b, den)) };
    };
    F.div = function (x, y) { return F.mul(x, F.inv(y)); };
    F.zero = function (x) { return qz(x.a) && qz(x.b); };
    F.eq = function (x, y) { return qeq(x.a, y.a) && qeq(x.b, y.b); };
    F.isQ = function (x) { return qz(x.b); };
    F.pow = function (x, e) { var r = F.q(Q1), b = x; if (e < 0) { b = F.inv(x); e = -e; } while (e > 0) { if (e & 1) r = F.mul(r, b); b = F.mul(b, b); e >>= 1; } return r; };
    // numeric value: [re, im]
    F.num = function (x) {
      var a = qnum(x.a), b = qnum(x.b);
      if (D === Z || b === 0) return [a, 0];
      var r = Math.sqrt(Math.abs(Number(D)));
      return D > Z ? [a + b * r, 0] : [a, b * r];
    };
    F.sq = D < Z ? (D === -O ? "i" : "i\\sqrt{" + (-D).toString() + "}") : "\\sqrt{" + D.toString() + "}";
    F.tex = function (x, o) {
      o = o || {};
      if (qz(x.b) || D === Z) return qtex(x.a, o);
      var bt = qabs(x.b), surd = qeq(bt, Q1) ? F.sq : bt.d === O ? bt.n.toString() + F.sq : "\\tfrac{" + (bt.n === O ? "" : bt.n.toString()) + F.sq + "}{" + bt.d.toString() + "}";
      if (D < Z && D !== -O && !qeq(bt, Q1)) surd = (bt.d === O ? bt.n.toString() : "\\tfrac{" + bt.n.toString() + "}{" + bt.d.toString() + "}") + "\\sqrt{" + (-D).toString() + "}\\,i";
      if (D < Z && D !== -O && qeq(bt, Q1)) surd = "\\sqrt{" + (-D).toString() + "}\\,i";
      if (qz(x.a)) return (qsign(x.b) < 0 ? "-" : "") + surd;
      // common denominator form (p ± q√D)/r when both parts have the same denominator
      if (x.a.d === x.b.d && x.a.d !== O && !o.split) {
        var r = x.a.d, an = x.a.n, bn = babs(x.b.n);
        var sr = D < Z ? (D === -O ? "i" : "\\sqrt{" + (-D).toString() + "}\\,i") : "\\sqrt{" + D.toString() + "}";
        return "\\dfrac{" + an.toString() + (qsign(x.b) < 0 ? " - " : " + ") + (bn === O ? "" : bn.toString()) + sr + "}{" + r.toString() + "}";
      }
      return qtex(x.a, o) + (qsign(x.b) < 0 ? " - " : " + ") + surd;
    };
    return F;
  }
  var FQ = Field(0);
  // solve M·x = rhs over a field (Gaussian elimination with exact pivots)
  function solveLinear(F, M, rhs) {
    var n = M.length, A = M.map(function (row, i) { return row.slice().concat([rhs[i]]); });
    for (var c = 0; c < n; c++) {
      var p = -1; for (var r = c; r < n; r++) if (!F.zero(A[r][c])) { p = r; break; }
      if (p < 0) throw err("ระบบสมการไม่มีคำตอบเดียว");
      var t = A[c]; A[c] = A[p]; A[p] = t;
      var inv = F.inv(A[c][c]);
      for (var j = c; j <= n; j++) A[c][j] = F.mul(A[c][j], inv);
      for (r = 0; r < n; r++) if (r !== c && !F.zero(A[r][c])) {
        var f = A[r][c];
        for (j = c; j <= n; j++) A[r][j] = F.sub(A[r][j], F.mul(f, A[c][j]));
      }
    }
    return A.map(function (row) { return row[n]; });
  }
  // the same over Q with plain rationals
  function solveQ(M, rhs) {
    return solveLinear(FQ, M.map(function (r) { return r.map(FQ.q); }), rhs.map(FQ.q)).map(function (x) { return x.a; });
  }

  // ======================================================================= expressions: exact evaluation, P(k)rᵏ form, rational functions
  function parseExpr(src, vars) { return SQ.parse(String(src), vars); }
  function factBig(n) { var r = O; for (var i = TWO; i <= BigInt(n); i++) r *= i; return r; }
  function evalQ(node, env) {
    switch (node.t) {
      case "num": return qfromNum(node.v);
      case "var": if (!env || !(node.n in env)) throw NE(); return env[node.n];
      case "const": throw NE();
      case "neg": return qneg(evalQ(node.a, env));
      case "fact":
        var fv = evalQ(node.a, env);
        if (!qint(fv) || fv.n < Z || fv.n > BigInt(3000)) throw NE();
        return Q(factBig(fv.n));
      case "fn":
        var u = evalQ(node.a, env);
        if (node.f === "abs") return qabs(u);
        if (node.f === "fact") { if (!qint(u) || u.n < Z || u.n > BigInt(3000)) throw NE(); return Q(factBig(u.n)); }
        if (node.f === "floor" || node.f === "ceil") {
          var fl = u.n / u.d; if (u.n < Z && fl * u.d !== u.n) fl -= O;
          return Q(node.f === "floor" ? fl : fl * u.d === u.n ? fl : fl + O);
        }
        if (node.f === "sgn") return Q(qsign(u));
        throw NE();
      case "bin":
        var A = evalQ(node.a, env), B = evalQ(node.b, env);
        switch (node.op) {
          case "+": return qadd(A, B);
          case "-": return qsub(A, B);
          case "*": return qmul(A, B);
          case "/": return qdiv(A, B);
          case "^":
            if (!qint(B)) throw NE();
            if (qz(A) && B.n < Z) throw err("หารด้วยศูนย์");
            return qpow(A, B.n);
        }
    }
    throw NE();
  }
  function NotForm() { var e = new Error("form"); e.notForm = true; return e; }
  // exponential-polynomial: [{r: Q, p: poly}] meaning Σ p(v)·rᵛ
  function epMerge(list) {
    var out = [];
    list.forEach(function (t) {
      if (!t.p.length) return;
      for (var i = 0; i < out.length; i++) if (qeq(out[i].r, t.r)) { out[i].p = padd(out[i].p, t.p); return; }
      out.push({ r: t.r, p: t.p });
    });
    return out.filter(function (t) { return t.p.length; });
  }
  function epOf(node, v) {
    switch (node.t) {
      case "num": return epMerge([{ r: Q1, p: pconst(qfromNum(node.v)) }]);
      case "var": if (node.n !== v) throw NotForm(); return [{ r: Q1, p: [Q0, Q1] }];
      case "neg": return epOf(node.a, v).map(function (t) { return { r: t.r, p: pneg(t.p) }; });
      case "bin":
        var A = epOf(node.a, v);
        if (node.op === "^") {
          var E = epOf(node.b, v);
          var econst = E.length === 0 || (E.length === 1 && qeq(E[0].r, Q1) && E[0].p.length <= 1);
          if (econst) {
            var e = E.length ? E[0].p[0] : Q0;
            if (!qint(e) || e.n < Z || e.n > BigInt(12)) throw NotForm();
            var r = [{ r: Q1, p: [Q1] }];
            for (var i = 0; i < Number(e.n); i++) r = epMul(r, A);
            return r;
          }
          // c^(αv + β) with integer α, β and a constant base c
          if (E.length === 1 && qeq(E[0].r, Q1) && E[0].p.length === 2 && A.length === 1 && qeq(A[0].r, Q1) && A[0].p.length === 1) {
            var al = E[0].p[1], be = E[0].p[0], c = A[0].p[0];
            if (!qint(al) || !qint(be) || qz(c)) throw NotForm();
            return [{ r: qpow(c, al.n), p: [qpow(c, be.n)] }];
          }
          throw NotForm();
        }
        var Bv = epOf(node.b, v);
        if (node.op === "+") return epMerge(A.concat(Bv));
        if (node.op === "-") return epMerge(A.concat(Bv.map(function (t) { return { r: t.r, p: pneg(t.p) }; })));
        if (node.op === "*") return epMul(A, Bv);
        if (node.op === "/") {
          if (Bv.length === 1 && Bv[0].p.length === 1) { var s = Bv[0].r, k = Bv[0].p[0]; return A.map(function (t) { return { r: qdiv(t.r, s), p: pscale(t.p, qinv(k)) }; }); }
          throw NotForm();
        }
    }
    throw NotForm();
  }
  function epMul(A, B) { var out = []; A.forEach(function (a) { B.forEach(function (b) { out.push({ r: qmul(a.r, b.r), p: pmul(a.p, b.p) }); }); }); return epMerge(out); }
  // rational function {num, den}
  function rfNorm(f) {
    var g = pgcd(f.num, f.den);
    var num = pdivmod(f.num, g).q, den = pdivmod(f.den, g).q;
    var lc = den[den.length - 1];
    return { num: pscale(num, qinv(lc)), den: pscale(den, qinv(lc)) };
  }
  function rfOf(node, v) {
    switch (node.t) {
      case "num": return { num: pconst(qfromNum(node.v)), den: [Q1] };
      case "var": if (node.n !== v) throw NotForm(); return { num: [Q0, Q1], den: [Q1] };
      case "neg": var a0 = rfOf(node.a, v); return { num: pneg(a0.num), den: a0.den };
      case "bin":
        var A = rfOf(node.a, v);
        if (node.op === "^") {
          var e;
          try { e = evalQ(node.b, {}); } catch (x) { throw NotForm(); }
          if (!qint(e) || babs(e.n) > BigInt(12)) throw NotForm();
          var k = Number(e.n), r = { num: [Q1], den: [Q1] };
          for (var i = 0; i < Math.abs(k); i++) r = { num: pmul(r.num, A.num), den: pmul(r.den, A.den) };
          return rfNorm(k < 0 ? { num: r.den, den: r.num } : r);
        }
        var B = rfOf(node.b, v);
        if (node.op === "+") return rfNorm({ num: padd(pmul(A.num, B.den), pmul(B.num, A.den)), den: pmul(A.den, B.den) });
        if (node.op === "-") return rfNorm({ num: psub(pmul(A.num, B.den), pmul(B.num, A.den)), den: pmul(A.den, B.den) });
        if (node.op === "*") return rfNorm({ num: pmul(A.num, B.num), den: pmul(A.den, B.den) });
        if (node.op === "/") { if (!B.num.length) throw err("หารด้วยศูนย์"); return rfNorm({ num: pmul(A.num, B.den), den: pmul(A.den, B.num) }); }
    }
    throw NotForm();
  }

  // ======================================================================= Σ of P(k)rᵏ: S(n) = Q(n)rⁿ + C
  // r = 1: Q(n) − Q(n−1) = P(n), deg Q = deg P + 1, Q(m−1) = 0
  // r ≠ 1: Q(n) − Q(n−1)/r = P(n), deg Q = deg P
  function antiDiff(P, r) {
    var d = pdeg(P), one = qeq(r, Q1), dq = one ? d + 1 : d, rinv = one ? Q1 : qinv(r);
    if (d < 0) return [];
    // columns: coefficients q_0..q_dq (r = 1: q_0 is free, set 0); rows: powers 0..dq
    var unknowns = [], M = [], rhs = [];
    for (var j = one ? 1 : 0; j <= dq; j++) unknowns.push(j);
    var colPolys = unknowns.map(function (j) {
      var mono = []; for (var t = 0; t < j; t++) mono.push(Q0); mono.push(Q1);
      return psub(mono, pscale(pshift(mono, Q(-1)), rinv));
    });
    var rows = one ? dq : dq + 1;
    for (var row = 0; row < rows; row++) { M.push(colPolys.map(function (cp) { return cp[row] || Q0; })); rhs.push(P[row] || Q0); }
    var sol = solveQ(M, rhs), Qp = [];
    for (var t = 0; t <= dq; t++) Qp.push(Q0);
    unknowns.forEach(function (j, i) { Qp[j] = sol[i]; });
    return ptrim(Qp);
  }
  // closed form of Σ_{k=m}^{n} f(k) for f in exponential-polynomial form
  function sumEP(ep, m) {
    var parts = [], C = Q0, poly = [];
    ep.forEach(function (t) {
      var Qp = antiDiff(t.p, t.r);
      var c = qneg(qmul(pevalQ(Qp, Q(m - 1)), qpow(t.r, m - 1)));
      if (qeq(t.r, Q1)) { poly = padd(poly, padd(Qp, pconst(c))); }
      else { parts.push({ r: t.r, Q: Qp }); C = qadd(C, c); }
    });
    return { poly: poly, parts: parts, C: C };
  }
  function evalSumEP(S, n) {
    var v = pevalQ(S.poly, Q(n));
    S.parts.forEach(function (p) { v = qadd(v, qmul(pevalQ(p.Q, Q(n)), qpow(p.r, n))); });
    return qadd(v, S.C);
  }
  // Σ_{k=1}^{n} k^j as a polynomial in n
  function powerSum(j) { var P = []; for (var t = 0; t < j; t++) P.push(Q0); P.push(Q1); var S = sumEP([{ r: Q1, p: P }], 1); return S.poly; }

  // ======================================================================= telescoping by partial fractions
  // f = num/den with den splitting into distinct rational linear factors
  function partialFractions(rf) {
    var dd = pdeg(rf.den);
    if (dd < 1) return null;
    var fr = prationalRoots(rf.den);
    if (fr.rest.length > 1) return null;
    if (fr.roots.some(function (r) { return r.m > 1; })) return { repeated: true, roots: fr.roots };
    var dm = pdivmod(rf.num, rf.den), dp = pderiv(rf.den);
    var terms = fr.roots.map(function (rt) { return { r: rt.r, A: qdiv(pevalQ(dm.r, rt.r), pevalQ(dp, rt.r)) }; });
    return { poly: dm.q, terms: terms };
  }
  function telescope(pf, m) {
    // group roots whose differences are integers
    var classes = [];
    pf.terms.forEach(function (t) {
      for (var i = 0; i < classes.length; i++) { var d = qsub(classes[i][0].r, t.r); if (qint(d)) { classes[i].push(t); return; } }
      classes.push([t]);
    });
    var ok = true, poles = [];
    classes.forEach(function (cl) {
      var s = Q0; cl.forEach(function (t) { s = qadd(s, t.A); });
      cl.sumA = s; if (!qz(s)) ok = false;
      var rho = cl[0].r; cl.forEach(function (t) { if (qcmp(t.r, rho) > 0) rho = t.r; });
      cl.rho = rho;
      cl.forEach(function (t) { t.t = Number(qsub(rho, t.r).n); if (qint(t.r) && t.r.n >= BigInt(m)) poles.push(t.r); });
    });
    if (poles.length) return { pole: poles[0] };
    if (!ok) return { classes: classes, ok: false };
    // S(n) = C + Σ_i A_i Σ_{j=1}^{t_i} 1/(n + j − ρ)
    var C = Q0, tail = [];
    classes.forEach(function (cl) {
      cl.forEach(function (t) {
        for (var j = 1; j <= t.t; j++) {
          C = qsub(C, qdiv(t.A, qsub(Q(m - 1 + j), cl.rho)));
          tail.push({ A: t.A, shift: qsub(Q(j), cl.rho) }); // A/(n + shift)
        }
      });
    });
    // merge tail into one rational function of n
    var rf = { num: pconst(C), den: [Q1] };
    tail.forEach(function (tt) { rf = rfNorm({ num: padd(pmul(rf.num, [tt.shift, Q1]), pscale(rf.den, tt.A)), den: pmul(rf.den, [tt.shift, Q1]) }); });
    return { ok: true, classes: classes, C: C, tail: tail, rf: rf };
  }
  function rftex(rf, v) {
    if (pdeg(rf.den) <= 0) return ptex(pscale(rf.num, qinv(rf.den[0] || Q1)), v);
    var a = pinteger(rf.num), b = pinteger(rf.den), c = qdiv(a.c, b.c);
    var numP = a.ints.map(function (x) { return Q(x); }), denP = b.ints.map(function (x) { return Q(x); });
    numP = pscale(numP, Q(c.n)); denP = pscale(denP, Q(c.d));
    var nf = ptexFactored(numP, v), df = ptexFactored(denP, v);
    var nt = nf && nf.indexOf("dfrac") < 0 ? nf : ptex(numP, v), dt = df && df.indexOf("dfrac") < 0 ? df : ptex(denP, v);
    return "\\dfrac{" + nt + "}{" + dt + "}";
  }

  // ======================================================================= formula finder
  function diffTable(a) {
    var rows = [a.slice()];
    while (rows[rows.length - 1].length > 1 && rows.length < 12) {
      var last = rows[rows.length - 1], nx = [];
      for (var i = 1; i < last.length; i++) nx.push(qsub(last[i], last[i - 1]));
      rows.push(nx);
      if (nx.every(function (x) { return qeq(x, nx[0]); })) break;
    }
    return rows;
  }
  // binomial C(n − n0, j) as a polynomial in n
  function binomPoly(j, shift) {
    var p = [Q1], f = Q1;
    for (var i = 0; i < j; i++) { p = pmul(p, [Q(-shift - i), Q1]); f = qmul(f, Q(i + 1)); }
    return pscale(p, qinv(f));
  }
  function findPoly(a, n0) {
    var rows = diffTable(a), L = rows[rows.length - 1];
    var d = rows.length - 1;
    var constRow = L.length >= 2 && L.every(function (x) { return qeq(x, L[0]); });
    if (!constRow) return null;
    var poly = [];
    for (var j = 0; j <= d; j++) poly = padd(poly, pscale(binomPoly(j, n0), rows[j][0]));
    // sum from n0 to n: Σ_j Δʲa · C(n − n0 + 1, j + 1)
    var spoly = [];
    for (j = 0; j <= d; j++) spoly = padd(spoly, pscale(binomPoly(j + 1, n0 - 1), rows[j][0]));
    return { rows: rows, deg: pdeg(poly), poly: poly, spoly: spoly, conf: L.length - 1 };
  }
  // Berlekamp–Massey over Q: smallest L, c with a_n = c1 a_{n−1} + … + cL a_{n−L}
  function berlekamp(s) {
    var C = [Q1], B = [Q1], L = 0, m = 1, b = Q1;
    for (var n = 0; n < s.length; n++) {
      var d = s[n];
      for (var i = 1; i <= L; i++) d = qadd(d, qmul(C[i] || Q0, s[n - i]));
      if (qz(d)) { m++; continue; }
      var T = C.slice(), coef = qdiv(d, b), sh = [];
      for (i = 0; i < m; i++) sh.push(Q0);
      var Bs = sh.concat(B);
      var len = Math.max(C.length, Bs.length), Cn = [];
      for (i = 0; i < len; i++) Cn.push(qsub(C[i] || Q0, qmul(coef, Bs[i] || Q0)));
      C = Cn;
      if (2 * L <= n) { L = n + 1 - L; B = T; b = d; m = 1; } else m++;
    }
    var c = []; for (var i2 = 1; i2 <= L; i2++) c.push(qneg(C[i2] || Q0));
    return { L: L, c: c };
  }

  // ======================================================================= linear recurrences a_n = Σ c_j a_{n−j} + Σ P(n)sⁿ
  function charPoly(c) { // t^k − c1 t^{k−1} − … − ck  (low → high)
    var k = c.length, p = [];
    for (var i = 0; i <= k; i++) p.push(Q0);
    p[k] = Q1;
    for (var j = 1; j <= k; j++) p[k - j] = qneg(c[j - 1]);
    return ptrim(p);
  }
  // roots of the characteristic polynomial in one field Q(√D): [{x: field element, m, rational: bool}]
  function charRoots(cp) {
    var fr = prationalRoots(cp), out = { field: FQ, roots: [], numeric: false };
    fr.roots.forEach(function (rt) { out.roots.push({ x: FQ.q(rt.r), m: rt.m, q: rt.r }); });
    var rest = fr.rest;
    if (rest.length === 3) {
      // a t² + b t + c: t = (−b ± √disc)/(2a), disc = s²·D
      var a = rest[2], b = rest[1], c = rest[0];
      var disc = qsub(qmul(b, b), qmul(Q(4), qmul(a, c)));
      // disc = N/Dd → √disc = √(N·Dd)/Dd
      var N = disc.n * disc.d, sf = squarefree(N), s = Q(sf[0], disc.d), D = sf[1];
      var F = Field(D);
      out.field = F; out.D = D;
      out.roots = out.roots.map(function (r) { return { x: F.q(r.q), m: r.m, q: r.q }; });
      var p0 = qdiv(qneg(b), qmul(Q(2), a)), q0 = qdiv(s, qmul(Q(2), a));
      out.roots.push({ x: F.of(p0, q0), m: 1, conj: 1 });
      out.roots.push({ x: F.of(p0, qneg(q0)), m: 1, conj: -1 });
      out.quad = { a: a, b: b, c: c, disc: disc };
    } else if (rest.length > 3) {
      out.numeric = true; out.rest = rest;
    }
    return out;
  }
  // numeric roots of a real polynomial (Durand–Kerner), complex pairs
  function numericRoots(p) {
    var n = p.length - 1, lc = qnum(p[n]), a = p.map(function (c) { return qnum(c) / lc; });
    var z = []; for (var i = 0; i < n; i++) z.push([Math.cos(2 * Math.PI * i / n + 0.4) * 1.3, Math.sin(2 * Math.PI * i / n + 0.4) * 1.3]);
    function ev(x) { var re = 1, im = 0; for (var k = n - 1; k >= 0; k--) { var r2 = re * x[0] - im * x[1] + a[k], i2 = re * x[1] + im * x[0]; re = r2; im = i2; } return [re, im]; }
    for (var it = 0; it < 500; it++) {
      var mx = 0;
      for (i = 0; i < n; i++) {
        var num = ev(z[i]), den = [1, 0];
        for (var j = 0; j < n; j++) if (j !== i) { var dx = z[i][0] - z[j][0], dy = z[i][1] - z[j][1]; den = [den[0] * dx - den[1] * dy, den[0] * dy + den[1] * dx]; }
        var dd = den[0] * den[0] + den[1] * den[1]; if (dd === 0) dd = 1e-300;
        var w = [(num[0] * den[0] + num[1] * den[1]) / dd, (num[1] * den[0] - num[0] * den[1]) / dd];
        z[i] = [z[i][0] - w[0], z[i][1] - w[1]];
        mx = Math.max(mx, Math.abs(w[0]) + Math.abs(w[1]));
      }
      if (mx < 1e-15) break;
    }
    return z.map(function (x) { return [x[0], Math.abs(x[1]) < 1e-10 ? 0 : x[1]]; });
  }
  // L[nᵖ sⁿ](n) / sⁿ = nᵖ − Σ_j c_j (n−j)ᵖ s^{−j}
  function opOnMono(c, p, s) {
    var mono = []; for (var t = 0; t < p; t++) mono.push(Q0); mono.push(Q1);
    var r = mono.slice(), sinv = qinv(s);
    for (var j = 1; j <= c.length; j++) r = psub(r, pscale(pshift(mono, Q(-j)), qmul(c[j - 1], qpow(sinv, j))));
    return r;
  }
  function particular(c, forcing, rootsQ) {
    // forcing: [{r: s, p: P}] → [{r: s, p: poly incl. nᵐ factor, m}]
    return forcing.map(function (t) {
      var m = 0;
      rootsQ.forEach(function (rt) { if (rt.q && qeq(rt.q, t.r)) m = rt.m; });
      var d = pdeg(t.p), cols = [], M = [], rhs = [];
      for (var e = 0; e <= d; e++) cols.push(opOnMono(c, m + e, t.r));
      for (var row = 0; row <= d; row++) { M.push(cols.map(function (cp) { return cp[row] || Q0; })); rhs.push(t.p[row] || Q0); }
      var sol = solveQ(M, rhs), P = [];
      for (var k = 0; k < m + d + 1; k++) P.push(Q0);
      sol.forEach(function (v, i) { P[m + i] = v; });
      return { r: t.r, p: ptrim(P), m: m };
    });
  }
  function solveRecurrence(o) {
    // o: {c: [Q], forcing: [{r, p}], init: [Q] (length k), n0}
    var c = o.c, k = c.length, n0 = o.n0 || 0, forcing = o.forcing || [];
    if (k < 1 || k > 3) throw err("รองรับอันดับ 1 ถึง 3");
    if (qz(c[k - 1])) throw err("สัมประสิทธิ์ตัวสุดท้าย c" + k + " ต้องไม่เป็นศูนย์ (ไม่อย่างนั้นอันดับจะลดลง)");
    if (o.init.length !== k) throw err("ต้องมีค่าเริ่มต้น " + k + " ค่า");
    var cp = charPoly(c), CR = charRoots(cp);
    // exact terms by the recurrence
    function fAt(n) { var v = Q0; forcing.forEach(function (t) { v = qadd(v, qmul(pevalQ(t.p, Q(n)), qpow(t.r, n))); }); return v; }
    var terms = o.init.slice();
    var N = Math.max(o.count || 14, 3 * k + 6);
    for (var i = k; i < N; i++) {
      var v = fAt(n0 + i);
      for (var j = 1; j <= k; j++) v = qadd(v, qmul(c[j - 1], terms[i - j]));
      terms.push(v);
    }
    var res = { cp: cp, CR: CR, terms: terms, n0: n0, k: k, c: c, forcing: forcing };
    var rootsQ = CR.roots.filter(function (r) { return r.q; });
    var part = forcing.length ? particular(c, forcing, rootsQ) : [];
    res.part = part;
    function partAt(n) { var v = Q0; part.forEach(function (t) { v = qadd(v, qmul(pevalQ(t.p, Q(n)), qpow(t.r, n))); }); return v; }
    res.partAt = partAt;
    if (CR.numeric) {
      // numeric fallback: complex roots, constants by complex Gaussian elimination
      var zr = numericRoots(cp);
      res.numRoots = zr;
      var basisN = zr.map(function (z) { return { z: z, j: 0 }; });
      // complex solve
      var M = [], rhs = [];
      for (var r = 0; r < k; r++) {
        var n = n0 + r, row = basisN.map(function (b) { return cpow(b.z, n); });
        M.push(row); var pr = qnum(qsub(o.init[r], partAt(n))); rhs.push([pr, 0]);
      }
      res.numConst = csolve(M, rhs);
      res.basisN = basisN;
      return res;
    }
    var F = CR.field, basis = [];
    CR.roots.forEach(function (rt) { for (var j = 0; j < rt.m; j++) basis.push({ x: rt.x, j: j, root: rt }); });
    var Mx = [], rh = [];
    for (var r2 = 0; r2 < k; r2++) {
      var nn = n0 + r2;
      Mx.push(basis.map(function (b) { return F.mul(F.q(qpow(Q(nn), b.j)), F.pow(b.x, nn)); }));
      rh.push(F.q(qsub(o.init[r2], partAt(nn))));
    }
    var consts = solveLinear(F, Mx, rh);
    res.F = F; res.basis = basis; res.consts = consts;
    // closed-form evaluation (field element; rational when exact)
    res.closedAt = function (n) {
      var v = F.q(partAt(n));
      basis.forEach(function (b, i) { v = F.add(v, F.mul(consts[i], F.mul(F.q(qpow(Q(n), b.j)), F.pow(b.x, n)))); });
      return v;
    };
    // generating function G(x) = Σ_{j≥0} a_{n0+j} x^j = Num/Den
    var A = cp.slice();
    forcing.forEach(function (t) { var lin = [qneg(t.r), Q1]; for (var e = 0; e <= pdeg(t.p); e++) A = pmul(A, lin); });
    var K = pdeg(A), Den = [];
    for (var t2 = 0; t2 <= K; t2++) Den.push(A[K - t2] || Q0);
    var G = terms.slice(0, K), Num = pmul(Den, G).slice(0, K);
    var g = { num: ptrim(Num), den: ptrim(Den) };
    var gg = pgcd(g.num, g.den);
    if (pdeg(gg) > 0) { g.num = pdivmod(g.num, gg).q; g.den = pdivmod(g.den, gg).q; }
    var lc0 = g.den[0]; if (lc0 && !qz(lc0)) { g.num = pscale(g.num, qinv(lc0)); g.den = pscale(g.den, qinv(lc0)); }
    res.gf = g;
    return res;
  }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cpow(z, n) { var r = [1, 0]; for (var i = 0; i < n; i++) r = cmul(r, z); return r; }
  function csolve(M, rhs) {
    var n = M.length, A = M.map(function (row, i) { return row.map(function (z) { return z.slice(); }).concat([rhs[i].slice()]); });
    for (var c = 0; c < n; c++) {
      var p = c, best = 0;
      for (var r = c; r < n; r++) { var mag = Math.hypot(A[r][c][0], A[r][c][1]); if (mag > best) { best = mag; p = r; } }
      var t = A[c]; A[c] = A[p]; A[p] = t;
      var d = A[c][c], dd = d[0] * d[0] + d[1] * d[1], inv = [d[0] / dd, -d[1] / dd];
      for (var j = c; j <= n; j++) A[c][j] = cmul(A[c][j], inv);
      for (r = 0; r < n; r++) if (r !== c) { var f = A[r][c]; for (j = c; j <= n; j++) { var pr = cmul(f, A[c][j]); A[r][j] = [A[r][j][0] - pr[0], A[r][j][1] - pr[1]]; } }
    }
    return A.map(function (row) { return row[n]; });
  }

  // ======================================================================= arithmetic / geometric solver
  // known: {a1, d|r, n, an, Sn, Sinf} as Q or Number (numeric) — returns {vals, steps, warn}
  function isQ(x) { return x && typeof x === "object" && "n" in x && "d" in x; }
  function N(x) { return isQ(x) ? qnum(x) : x; }
  function intQ(x) { return isQ(x) ? qint(x) && x.n > Z : Number.isInteger(x) && x > 0; }
  function A(x) { return isQ(x) ? qtex(x) : texNumF(x, 10); } // TeX of a value
  function solveArith(k) {
    var s = [], v = {}, w = [];
    var has = function (key) { return k[key] !== undefined && k[key] !== null; };
    Object.keys(k).forEach(function (key) { if (has(key)) v[key] = k[key]; });
    var exact = Object.keys(v).every(function (key) { return isQ(v[key]); });
    var add = exact ? qadd : function (a, b) { return N(a) + N(b); };
    var sub = exact ? qsub : function (a, b) { return N(a) - N(b); };
    var mul = exact ? qmul : function (a, b) { return N(a) * N(b); };
    var div = exact ? qdiv : function (a, b) { return N(a) / N(b); };
    var c = function (x) { return exact ? Q(x) : x; };
    var known = ["a1", "d", "n", "an", "Sn"].filter(has);
    if (known.length < 3) throw err("กรอกค่าที่รู้อย่างน้อย 3 ช่อง (จาก a₁, d, n, aₙ, Sₙ)");
    if (has("n") && !intQ(v.n)) throw err("n ต้องเป็นจำนวนเต็มบวก");
    // find n first when it is unknown
    if (!has("n")) {
      if (has("a1") && has("d") && has("an")) {
        if (N(v.d) === 0) throw err("d = 0 ทุกพจน์เท่ากัน หา n จาก aₙ ไม่ได้");
        v.n = add(div(sub(v.an, v.a1), v.d), c(1));
        s.push("จาก \\(a_n = a_1 + (n-1)d\\): \\(" + A(v.an) + " = " + A(v.a1) + " + (n-1)(" + A(v.d) + ")\\) ⇒ \\(n - 1 = " + A(sub(v.n, c(1))) + "\\) ⇒ \\(n = " + A(v.n) + "\\)");
      } else if (has("a1") && has("an") && has("Sn")) {
        if (N(add(v.a1, v.an)) === 0) throw err("a₁ + aₙ = 0 หา n จาก Sₙ ไม่ได้");
        v.n = div(mul(c(2), v.Sn), add(v.a1, v.an));
        s.push("จาก \\(S_n = \\tfrac{n}{2}(a_1 + a_n)\\): \\(" + A(v.Sn) + " = \\tfrac{n}{2}(" + A(v.a1) + " + " + A(v.an) + ")\\) ⇒ \\(n = " + A(v.n) + "\\)");
      } else if (has("d") && (has("a1") || has("an")) && has("Sn")) {
        // a1 known: d n² + (2a1 − d) n − 2Sn = 0 ; an known: d n² − (2an + d) n + 2Sn = 0
        var qa = v.d, qb = has("a1") ? sub(mul(c(2), v.a1), v.d) : qneg2(add(mul(c(2), v.an), v.d), exact), qc = has("a1") ? qneg2(mul(c(2), v.Sn), exact) : mul(c(2), v.Sn);
        s.push("แทนลงใน " + (has("a1") ? "\\(S_n = \\tfrac{n}{2}[2a_1 + (n-1)d]\\)" : "\\(S_n = \\tfrac{n}{2}[2a_n - (n-1)d]\\)") + " ได้สมการกำลังสอง \\(" + quadTex(qa, qb, qc) + " = 0\\)");
        var rs = quadRootsNum(N(qa), N(qb), N(qc));
        var good = rs.filter(function (x) { return x > 0 && Math.abs(x - Math.round(x)) < 1e-9; }).map(Math.round);
        s.push("รากของสมการ: \\(n = " + rs.map(function (x) { return texNumF(x, 8); }).join(",\\ ") + "\\) · n ต้องเป็นจำนวนเต็มบวก");
        if (!good.length) throw err("ไม่มีจำนวนเต็มบวก n ที่ทำให้ได้ Sₙ ตามที่กำหนด");
        if (good.length > 1) w.push("มีคำตอบ n สองค่า (" + good.join(" และ ") + ") เพราะเมื่อพจน์ติดลบ ผลบวกย้อนกลับมาเท่าเดิมได้ แสดงผลของ n = " + good[0]);
        v.n = c(good[0]);
      } else throw err("ข้อมูลชุดนี้หา n ไม่ได้");
      if (!intQ(v.n)) throw err("ได้ n = " + fmtNum(N(v.n)) + " ไม่ใช่จำนวนเต็มบวก ข้อมูลไม่สอดคล้องกับลำดับเลขคณิต");
    }
    var n = v.n, n1 = sub(n, c(1));
    if (!has("a1") || !has("d")) {
      if (has("a1") && has("an")) { v.d = div(sub(v.an, v.a1), n1); s.push("\\(d = \\dfrac{a_n - a_1}{n-1} = \\dfrac{" + A(v.an) + " - (" + A(v.a1) + ")}{" + A(n1) + "} = " + A(v.d) + "\\)"); }
      else if (has("a1") && has("Sn")) { v.an = sub(div(mul(c(2), v.Sn), n), v.a1); s.push("\\(a_n = \\dfrac{2S_n}{n} - a_1 = " + A(v.an) + "\\)"); v.d = N(n1) === 0 ? c(0) : div(sub(v.an, v.a1), n1); s.push("\\(d = \\dfrac{a_n - a_1}{n-1} = " + A(v.d) + "\\)"); }
      else if (has("d") && has("an")) { v.a1 = sub(v.an, mul(n1, v.d)); s.push("\\(a_1 = a_n - (n-1)d = " + A(v.an) + " - (" + A(n1) + ")(" + A(v.d) + ") = " + A(v.a1) + "\\)"); }
      else if (has("d") && has("Sn")) { v.a1 = sub(div(v.Sn, n), div(mul(n1, v.d), c(2))); s.push("\\(a_1 = \\dfrac{S_n}{n} - \\dfrac{(n-1)d}{2} = " + A(v.a1) + "\\)"); }
      else if (has("an") && has("Sn")) { v.a1 = sub(div(mul(c(2), v.Sn), n), v.an); s.push("\\(a_1 = \\dfrac{2S_n}{n} - a_n = " + A(v.a1) + "\\)"); v.d = N(n1) === 0 ? c(0) : div(sub(v.an, v.a1), n1); s.push("\\(d = \\dfrac{a_n - a_1}{n-1} = " + A(v.d) + "\\)"); }
      else throw err("ข้อมูลไม่พอ");
    }
    var an = add(v.a1, mul(n1, v.d)), Sn = div(mul(n, add(v.a1, an)), c(2));
    if (!has("an") || k.an === undefined) s.push("\\(a_n = a_1 + (n-1)d = " + A(v.a1) + " + (" + A(n1) + ")(" + A(v.d) + ") = " + A(an) + "\\)");
    s.push("\\(S_n = \\dfrac{n}{2}(a_1 + a_n) = \\dfrac{" + A(n) + "}{2}\\left(" + A(v.a1) + " + " + A(an) + "\\right) = " + A(Sn) + "\\)");
    // consistency check for over-determined input
    if (has("an") && Math.abs(N(an) - N(k.an)) > 1e-9 * Math.max(1, Math.abs(N(an)))) w.push("ค่า aₙ ที่กรอก (" + fmtNum(N(k.an)) + ") ไม่ตรงกับที่คำนวณได้ (" + fmtNum(N(an)) + ") ข้อมูลขัดกันเอง");
    if (has("Sn") && Math.abs(N(Sn) - N(k.Sn)) > 1e-9 * Math.max(1, Math.abs(N(Sn)))) w.push("ค่า Sₙ ที่กรอก (" + fmtNum(N(k.Sn)) + ") ไม่ตรงกับที่คำนวณได้ (" + fmtNum(N(Sn)) + ") ข้อมูลขัดกันเอง");
    return { vals: { a1: v.a1, d: v.d, n: n, an: an, Sn: Sn }, steps: s, warn: w, exact: exact };
  }
  function qneg2(x, exact) { return exact ? qneg(x) : -x; }
  function quadTex(a, b, c) {
    var t = [[a, "n^2"], [b, "n"], [c, ""]], s = "";
    t.forEach(function (p) {
      var x = N(p[0]); if (x === 0) return;
      var neg = x < 0, mag = isQ(p[0]) ? qtex(qabs(p[0])) : texNumF(Math.abs(x), 10);
      if (mag === "1" && p[1]) mag = "";
      s += (s ? (neg ? " - " : " + ") : neg ? "-" : "") + mag + p[1];
    });
    return s || "0";
  }
  function quadRootsNum(a, b, c) {
    if (a === 0) return b === 0 ? [] : [-c / b];
    var D = b * b - 4 * a * c; if (D < 0) return [];
    var sd = Math.sqrt(D), q = -0.5 * (b + (b >= 0 ? sd : -sd));
    var r1 = q / a, r2 = q === 0 ? r1 : c / q;
    return r1 === r2 ? [r1] : [Math.max(r1, r2), Math.min(r1, r2)];
  }
  function solveGeo(k) {
    var s = [], v = {}, w = [];
    var has = function (key) { return k[key] !== undefined && k[key] !== null; };
    Object.keys(k).forEach(function (key) { if (has(key)) v[key] = k[key]; });
    var known = ["a1", "r", "n", "an", "Sn"].filter(has);
    // S∞ shortcuts
    if (has("Sinf") && known.length < 3) {
      if (has("a1") && !has("r")) { v.r = isQ(v.a1) && isQ(v.Sinf) ? qsub(Q1, qdiv(v.a1, v.Sinf)) : 1 - N(v.a1) / N(v.Sinf); s.push("จาก \\(S_\\infty = \\dfrac{a_1}{1-r}\\) ⇒ \\(r = 1 - \\dfrac{a_1}{S_\\infty} = " + A(v.r) + "\\)"); }
      else if (has("r") && !has("a1")) { v.a1 = isQ(v.r) && isQ(v.Sinf) ? qmul(v.Sinf, qsub(Q1, v.r)) : N(v.Sinf) * (1 - N(v.r)); s.push("\\(a_1 = S_\\infty(1 - r) = " + A(v.a1) + "\\)"); }
      else throw err("กับ S∞ ต้องรู้ a₁ หรือ r อีกหนึ่งค่า");
      if (!(Math.abs(N(v.r)) < 1)) throw err("ได้ |r| ≥ 1 อนุกรมเรขาคณิตอนันต์ลู่ออก ไม่มี S∞");
      if (!has("n")) return { vals: { a1: v.a1, r: v.r, Sinf: v.Sinf }, steps: s, warn: w, exact: isQ(v.a1) && isQ(v.r), noN: true };
      known = ["a1", "r", "n"];
    }
    if (known.length < 3 && !has("Sinf") && has("a1") && has("r") && !has("n")) {
      var exr = isQ(v.a1) && isQ(v.r);
      if (!(Math.abs(N(v.r)) < 1)) throw err("รู้ a₁ และ r แต่ไม่รู้ n: หา S∞ ได้เมื่อ |r| < 1 เท่านั้น (หรือกรอก n เพิ่ม)");
      var Si = exr ? qdiv(v.a1, qsub(Q1, v.r)) : N(v.a1) / (1 - N(v.r));
      s.push("\\(|r| = " + A(isQ(v.r) ? qabs(v.r) : Math.abs(v.r)) + " < 1\\) อนุกรมเรขาคณิตอนันต์ลู่เข้า ⇒ \\(S_\\infty = \\dfrac{a_1}{1 - r} = \\dfrac{" + A(v.a1) + "}{1 - \\left(" + A(v.r) + "\\right)} = " + A(Si) + "\\)");
      return { vals: { a1: v.a1, r: v.r, Sinf: Si }, steps: s, warn: w, exact: exr, noN: true };
    }
    if (known.length < 3) throw err("กรอกค่าที่รู้อย่างน้อย 3 ช่อง (จาก a₁, r, n, aₙ, Sₙ) หรือ a₁/r คู่กับ S∞");
    if (has("n") && !intQ(v.n)) throw err("n ต้องเป็นจำนวนเต็มบวก");
    var alts = null;
    if (!has("n")) {
      if (has("a1") && has("r") && has("an")) {
        var ratio = N(v.an) / N(v.a1), lr = Math.log(Math.abs(N(v.r)));
        if (lr === 0) throw err("|r| = 1 หา n ไม่ได้");
        var nn = 1 + Math.log(Math.abs(ratio)) / lr;
        s.push("\\(a_n = a_1 r^{n-1}\\) ⇒ \\(r^{n-1} = \\dfrac{a_n}{a_1} = " + texNumF(ratio, 10) + "\\) ⇒ \\(n - 1 = \\dfrac{\\ln|" + texNumF(ratio, 8) + "|}{\\ln|" + A(v.r) + "|} = " + texNumF(nn - 1, 10) + "\\)");
        v.n = Math.round(nn);
        if (Math.abs(nn - v.n) > 1e-7 || v.n < 1) throw err("ได้ n = " + fmtNum(nn) + " ไม่ใช่จำนวนเต็มบวก ข้อมูลไม่สอดคล้องกับลำดับเรขาคณิต");
        if (Math.abs(Math.pow(N(v.r), v.n - 1) - ratio) > 1e-9 * Math.max(1, Math.abs(ratio))) throw err("เครื่องหมายไม่สอดคล้อง: r^(n−1) ให้ค่าติดลบ/บวกไม่ตรงกับ aₙ/a₁");
      } else if (has("a1") && has("an") && has("Sn")) {
        if (N(v.Sn) === N(v.an)) throw err("Sₙ = aₙ ใช้สูตรนี้ไม่ได้");
        v.r = isQ(v.a1) && isQ(v.an) && isQ(v.Sn) ? qdiv(qsub(v.Sn, v.a1), qsub(v.Sn, v.an)) : (N(v.Sn) - N(v.a1)) / (N(v.Sn) - N(v.an));
        s.push("จาก \\(S_n = \\dfrac{a_1 - a_n r}{1 - r}\\) ⇒ \\(r = \\dfrac{S_n - a_1}{S_n - a_n} = " + A(v.r) + "\\)");
        return solveGeo({ a1: v.a1, r: v.r, an: v.an, _pre: s });
      } else if (has("a1") && has("r") && has("Sn")) {
        if (N(v.r) === 1) { v.n = N(v.Sn) / N(v.a1); s.push("r = 1 ⇒ \\(S_n = na_1\\) ⇒ \\(n = " + texNumF(v.n) + "\\)"); }
        else {
          var X = 1 - N(v.Sn) * (1 - N(v.r)) / N(v.a1);
          s.push("\\(S_n = \\dfrac{a_1(1 - r^n)}{1 - r}\\) ⇒ \\(r^n = 1 - \\dfrac{S_n(1-r)}{a_1} = " + texNumF(X, 10) + "\\)");
          if (!(X > 0) && N(v.r) > 0) throw err("ได้ rⁿ ≤ 0 ซึ่งเป็นไปไม่ได้เมื่อ r > 0");
          var nn2 = Math.log(Math.abs(X)) / Math.log(Math.abs(N(v.r)));
          s.push("\\(n = \\dfrac{\\ln|" + texNumF(X, 8) + "|}{\\ln|" + A(v.r) + "|} = " + texNumF(nn2, 10) + "\\)");
          v.n = Math.round(nn2);
        }
        if (Math.abs(N(v.n) - Math.round(N(v.n))) > 1e-7 || N(v.n) < 1) throw err("ได้ n ไม่ใช่จำนวนเต็มบวก ข้อมูลไม่สอดคล้องกัน");
        v.n = Math.round(N(v.n));
      } else if (has("r") && has("an") && has("Sn")) {
        v.a1 = isQ(v.r) && isQ(v.an) && isQ(v.Sn) ? qadd(qmul(v.Sn, qsub(Q1, v.r)), qmul(v.an, v.r)) : N(v.Sn) * (1 - N(v.r)) + N(v.an) * N(v.r);
        s.push("จาก \\(S_n = \\dfrac{a_1 - a_n r}{1 - r}\\) ⇒ \\(a_1 = S_n(1-r) + a_n r = " + A(v.a1) + "\\)");
        return solveGeo({ a1: v.a1, r: v.r, an: v.an, _pre: s });
      } else throw err("ข้อมูลชุดนี้หา n ไม่ได้ ลองกรอก a₁ กับ r เพิ่ม");
      v.n = Q(v.n);
    }
    var n = v.n, nI = Number(isQ(n) ? n.n : n);
    if (!has("r") || v.r === undefined) {
      if (has("a1") && has("an")) {
        var ratio2 = N(v.an) / N(v.a1), e = nI - 1;
        if (e === 0) throw err("n = 1 หา r ไม่ได้");
        var cands = [];
        if (isQ(v.an) && isQ(v.a1)) { var ex = exactRoot(qdiv(v.an, v.a1), e); if (ex) cands = ex; }
        if (!cands.length) {
          if (ratio2 > 0) { var rr = Math.pow(ratio2, 1 / e); cands = e % 2 === 0 ? [rr, -rr] : [rr]; }
          else if (e % 2 === 1) cands = [-Math.pow(-ratio2, 1 / e)];
          else throw err("rⁿ⁻¹ = " + fmtNum(ratio2) + " < 0 กับเลขชี้กำลังคู่ ไม่มี r จริง");
        }
        s.push("\\(r^{" + e + "} = \\dfrac{a_n}{a_1} = " + (isQ(v.an) && isQ(v.a1) ? qtex(qdiv(v.an, v.a1)) : texNumF(ratio2, 10)) + "\\) ⇒ \\(r = " + cands.map(A).join("\\ \\text{หรือ}\\ ") + "\\)");
        if (cands.length > 1) { w.push("มี r สองค่า (บวกและลบ) แสดงผลของ r = " + (isQ(cands[0]) ? qstr(cands[0]) : fmtNum(cands[0])) + " ส่วน r = " + (isQ(cands[1]) ? qstr(cands[1]) : fmtNum(cands[1])) + " ให้ Sₙ ต่างกัน"); alts = cands.slice(1); }
        v.r = cands[0];
      } else if (has("a1") && has("Sn")) {
        v.r = geoRatioFromSum(N(v.a1), N(v.Sn), nI, s); if (Array.isArray(v.r)) { if (v.r.length > 1) { w.push("มี r มากกว่าหนึ่งค่าที่ให้ Sₙ นี้: " + v.r.map(function (x) { return fmtNum(x, 8); }).join(", ")); alts = v.r.slice(1); } v.r = v.r[0]; }
      } else if (has("an") && has("Sn")) {
        v.r = geoRatioFromSumEnd(N(v.an), N(v.Sn), nI, s); if (Array.isArray(v.r)) { if (v.r.length > 1) { w.push("มี r มากกว่าหนึ่งค่า: " + v.r.map(function (x) { return fmtNum(x, 8); }).join(", ")); alts = v.r.slice(1); } v.r = v.r[0]; }
      } else throw err("ข้อมูลไม่พอ");
    }
    var exact = [v.a1, v.r, v.an, v.Sn].every(function (x) { return x === undefined || isQ(x); });
    var pw = function (x, e) { return isQ(x) ? qpow(x, e) : Math.pow(N(x), e); };
    if (!has("a1") || v.a1 === undefined) {
      if (v.an !== undefined && has("an")) { v.a1 = isQ(v.an) && isQ(v.r) ? qdiv(v.an, qpow(v.r, nI - 1)) : N(v.an) / Math.pow(N(v.r), nI - 1); s.push("\\(a_1 = \\dfrac{a_n}{r^{n-1}} = " + A(v.a1) + "\\)"); }
      else if (has("Sn")) {
        var rN = N(v.r);
        if (rN === 1) v.a1 = isQ(v.Sn) ? qdiv(v.Sn, Q(nI)) : N(v.Sn) / nI;
        else v.a1 = isQ(v.Sn) && isQ(v.r) ? qdiv(qmul(v.Sn, qsub(Q1, v.r)), qsub(Q1, qpow(v.r, nI))) : N(v.Sn) * (1 - rN) / (1 - Math.pow(rN, nI));
        s.push("\\(a_1 = \\dfrac{S_n(1 - r)}{1 - r^n} = " + A(v.a1) + "\\)");
      }
    }
    exact = [v.a1, v.r].every(isQ);
    var an = exact ? qmul(v.a1, qpow(v.r, nI - 1)) : N(v.a1) * Math.pow(N(v.r), nI - 1);
    var one = N(v.r) === 1;
    var Sn = one ? (exact ? qmul(v.a1, Q(nI)) : N(v.a1) * nI) : exact ? qdiv(qmul(v.a1, qsub(Q1, qpow(v.r, nI))), qsub(Q1, v.r)) : N(v.a1) * (1 - Math.pow(N(v.r), nI)) / (1 - N(v.r));
    if (k._pre) s = k._pre.concat(s);
    s.push("\\(a_n = a_1 r^{n-1} = " + A(v.a1) + "\\cdot\\left(" + A(v.r) + "\\right)^{" + (nI - 1) + "} = " + A(an) + "\\)");
    s.push(one ? "r = 1 ⇒ \\(S_n = na_1 = " + A(Sn) + "\\)" : "\\(S_n = \\dfrac{a_1(1 - r^n)}{1 - r} = \\dfrac{" + A(v.a1) + "\\left(1 - \\left(" + A(v.r) + "\\right)^{" + nI + "}\\right)}{1 - \\left(" + A(v.r) + "\\right)} = " + A(Sn) + "\\)");
    var out = { a1: v.a1, r: v.r, n: Q(nI), an: an, Sn: Sn };
    if (Math.abs(N(v.r)) < 1) { out.Sinf = exact ? qdiv(v.a1, qsub(Q1, v.r)) : N(v.a1) / (1 - N(v.r)); s.push("|r| < 1 ⇒ \\(S_\\infty = \\dfrac{a_1}{1 - r} = " + A(out.Sinf) + "\\)"); }
    if (has("an") && k.an !== undefined && Math.abs(N(an) - N(k.an)) > 1e-9 * Math.max(1, Math.abs(N(an)))) w.push("ค่า aₙ ที่กรอกไม่ตรงกับที่คำนวณได้ ข้อมูลขัดกันเอง");
    if (has("Sn") && Math.abs(N(Sn) - N(k.Sn)) > 1e-7 * Math.max(1, Math.abs(N(Sn)))) w.push("ค่า Sₙ ที่กรอกไม่ตรงกับที่คำนวณได้ (" + fmtNum(N(Sn)) + ")");
    return { vals: out, steps: s, warn: w, exact: exact, alts: alts };
  }
  // exact rational e-th roots of a rational (both signs when e is even)
  function exactRoot(q, e) {
    if (qz(q)) return [Q0];
    var neg = q.n < Z;
    if (neg && e % 2 === 0) return null;
    function iroot(b) { if (b < Z) return null; var x = BigInt(Math.round(Math.pow(Number(b), 1 / e))); for (var t = x - TWO; t <= x + TWO; t++) if (t >= Z && t ** BigInt(e) === b) return t; return null; }
    var a = iroot(babs(q.n)), b = iroot(q.d);
    if (a === null || b === null) return null;
    var r = Q(neg ? -a : a, b);
    return e % 2 === 0 ? [r, qneg(r)] : [r];
  }
  function geoRatioFromSum(a1, Sn, n, s) {
    // a1(1 + r + … + r^{n−1}) = Sn  → real roots
    var p = []; for (var i = 0; i < n; i++) p.push(Q(1)); p[0] = qsub(Q1, qfromNum(Sn / a1));
    var roots = realRootsNum(p.map(qnum));
    s.push("\\(S_n = a_1(1 + r + \\dots + r^{n-1})\\) ⇒ แก้สมการพหุนามดีกรี " + (n - 1) + " หาค่า r เชิงตัวเลข");
    if (!roots.length) throw err("ไม่มีค่า r จริงที่ให้ผลบวกนี้");
    s.push("ได้ \\(r = " + roots.map(function (x) { return texNumF(x, 10); }).join(",\\ ") + "\\)");
    return roots.map(function (x) { var sn = MK_snap(x); return sn; });
  }
  function geoRatioFromSumEnd(an, Sn, n, s) {
    // an(1 + r^{-1} + … ) : Sn = an(r^{n−1} + … + 1)/r^{n−1}  → Sn r^{n−1} − an(1 + r + … + r^{n−1}) = 0
    var p = []; for (var i = 0; i < n; i++) p.push(-an); p[n - 1] = Sn - an;
    var roots = realRootsNum(p).filter(function (x) { return Math.abs(x) > 1e-12; });
    s.push("\\(S_n = a_n\\left(1 + \\tfrac1r + \\dots + \\tfrac{1}{r^{n-1}}\\right)\\) ⇒ แก้สมการพหุนามหาค่า r เชิงตัวเลข");
    if (!roots.length) throw err("ไม่มีค่า r จริงที่ให้ผลบวกนี้");
    s.push("ได้ \\(r = " + roots.map(function (x) { return texNumF(x, 10); }).join(",\\ ") + "\\)");
    return roots.map(MK_snap);
  }
  function MK_snap(x) { for (var q = 1; q <= 64; q++) { var p = Math.round(x * q); if (Math.abs(x - p / q) < 1e-10) return Q(p, q); } return x; }
  // real roots of a polynomial with Number coefficients (low → high)
  function realRootsNum(a) {
    while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-300) a.pop();
    var n = a.length - 1; if (n < 1) return [];
    var qs = a.map(function (x) { return qfromNum(x); });
    var z = numericRoots(qs);
    var r = z.filter(function (x) { return Math.abs(x[1]) < 1e-7; }).map(function (x) { return x[0]; });
    // polish by Newton
    r = r.map(function (x) {
      for (var it = 0; it < 30; it++) { var f = 0, df = 0; for (var k = n; k >= 0; k--) { df = df * x + f; f = f * x + a[k]; } if (df === 0) break; var dx = f / df; x -= dx; if (Math.abs(dx) < 1e-16 * Math.max(1, Math.abs(x))) break; }
      return x;
    });
    r.sort(function (p, q) { return q - p; });
    return r.filter(function (x, i) { return i === 0 || Math.abs(x - r[i - 1]) > 1e-9; });
  }

  // ======================================================================= repeating decimals, means, annuities
  // "0.1(23)", "2.(142857)", "-0.(9)", "1.25"
  function repeatingToFrac(s) {
    var m = String(s).replace(/\s+/g, "").replace(/[−–]/g, "-").match(/^([+-]?)(\d*)\.(\d*)\((\d+)\)$/);
    if (!m) { var q = qdec(s); if (!q) throw err("พิมพ์แบบ 0.1(23) โดยใส่ส่วนที่ซ้ำในวงเล็บ"); return { q: q, plain: true }; }
    var ip = m[2] || "0", pre = m[3], rep = m[4];
    var a = BigInt(ip + pre + rep) - BigInt(ip + pre);
    var d = (TEN ** BigInt(rep.length) - O) * TEN ** BigInt(pre.length);
    var q2 = Q(m[1] === "-" ? -a : a, d);
    return { q: q2, ip: ip, pre: pre, rep: rep, neg: m[1] === "-" };
  }

  // ======================================================================= high-precision sums
  var BERN = [Q(1, 6), Q(-1, 30), Q(1, 42), Q(-1, 30), Q(5, 66), Q(-691, 2730), Q(7, 6)];
  // tanh–sinh on [a, b]
  function quadTS(f, a, b) {
    var c = (a + b) / 2, h2 = (b - a) / 2;
    function level(h, offset) {
      var s = 0;
      for (var k = offset ? 1 : 0; ; k += offset ? 2 : 1) {
        var t = k * h; if (t > 4.2) break;
        var e = Math.exp(Math.PI / 2 * Math.sinh(t)), ch = Math.cosh(t), den = e + 1 / e;
        var w = Math.PI / 2 * ch * 4 / (den * den), dist = h2 * 2 / (e * e + 1);
        var term;
        if (k === 0) term = w * f(c);
        else term = w * (f(b - dist) + f(a + dist));
        if (!isFinite(term)) { if (t > 2.5) break; term = 0; }
        s += term;
        if (t > 1 && Math.abs(term) < 1e-18 * Math.abs(s)) break;
      }
      return s;
    }
    var h = 0.5, S = level(h, false) * h, prev;
    for (var it = 0; it < 7; it++) { prev = S; h /= 2; S = S / 2 + level(h, true) * h; if (Math.abs(S - prev) < 1e-15 * Math.abs(S) && it > 1) break; }
    return { v: S * h2, err: Math.abs(S - prev) * Math.abs(h2) };
  }
  // exp–sinh on [a, ∞): x = a + exp(π/2·sinh t)
  function quadES(f, a) {
    function level(h, offset) {
      var s = 0, tail = 0;
      for (var dir = -1; dir <= 1; dir += 2) {
        for (var k = offset ? 1 : (dir < 0 ? 0 : 1); ; k += offset ? 2 : 1) {
          var t = dir * k * h; if (Math.abs(t) > 6.7) { if (dir > 0) tail = Math.abs(lastTerm); break; }
          var e = Math.exp(Math.PI / 2 * Math.sinh(t)), w = Math.PI / 2 * Math.cosh(t) * e;
          var term = w * f(a + e);
          if (!isFinite(term)) term = 0;
          var lastTerm = term;
          s += term;
          if (Math.abs(t) > 1 && Math.abs(term) < 1e-17 * Math.abs(s)) break;
        }
      }
      return { s: s, tail: tail };
    }
    var h = 0.5, L = level(h, false), S = L.s * h, prev, tail = L.tail;
    for (var it = 0; it < 6; it++) { prev = S; h /= 2; L = level(h, true); S = S / 2 + L.s * h; tail = Math.max(tail, L.tail); if (Math.abs(S - prev) < 1e-15 * Math.abs(S) && it > 1) break; }
    return { v: S, err: Math.abs(S - prev), unconverged: tail * h > 1e-9 * Math.max(1, Math.abs(S)) };
  }
  // Euler–Maclaurin: o = {f: compiled expr (vars ["k"]), tree, m, N (Infinity allowed), M (switch point), p (number of Bernoulli terms)}
  function eulerMaclaurin(o) {
    var f = function (x) { return o.f.fn({ k: x }); }, m = o.m, N = o.N, M = o.M || m + 10, p = o.p || 6;
    if (isFinite(N) && N - m <= 200) {
      var s0 = 0, c = 0; for (var k = m; k <= N; k++) { var y = f(k) - c, t = s0 + y; c = t - s0 - y; s0 = t; }
      return { direct: true, S: s0, terms: N - m + 1 };
    }
    var head = 0, cc = 0; for (var k2 = m; k2 < M; k2++) { var y2 = f(k2) - cc, t2 = head + y2; cc = t2 - head - y2; head = t2; }
    var integ;
    if (isFinite(N)) integ = quadTS(function (u) { var x = Math.exp(u); return f(x) * x; }, Math.log(M), Math.log(N));
    else integ = quadES(f, M);
    var dM = SQ.jet(o.tree, M, 2 * p), dN = isFinite(N) ? SQ.jet(o.tree, N, 2 * p) : null;
    var fM = dM[0], fN = isFinite(N) ? dN[0] : 0;
    var corr = [];
    for (var j = 1; j <= p; j++) {
      var order = 2 * j - 1, fact = 1; for (var i = 2; i <= order; i++) fact *= i;
      var dfm = dM[order] * fact, dfn = isFinite(N) ? dN[order] * fact : 0;
      var B = qnum(BERN[j - 1]), f2 = 1; for (i = 2; i <= 2 * j; i++) f2 *= i;
      corr.push({ j: j, B: BERN[j - 1], val: B / f2 * (dfn - dfm) });
    }
    var S = head + integ.v + (fM + fN) / 2;
    corr.forEach(function (cv) { S += cv.val; });
    return { S: S, head: head, M: M, integ: integ, half: (fM + fN) / 2, corr: corr, fM: fM, fN: fN };
  }
  // Cohen–Villegas–Zagier: Σ_{j≥0} (−1)^j b_j with n terms (error ≈ 5.8^{−n})
  function cvz(b, n) {
    var d = Math.pow(3 + Math.sqrt(8), n); d = (d + 1 / d) / 2;
    var bb = -1, c = -d, s = 0;
    for (var k = 0; k < n; k++) { c = bb - c; s += c * b(k); bb = (k + n) * (k - n) * bb / ((k + 0.5) * (k + 1)); }
    return s / d;
  }
  var KNOWN = [
    [Math.PI * Math.PI / 6, "\\dfrac{\\pi^2}{6} = \\zeta(2)"], [Math.PI * Math.PI * Math.PI * Math.PI / 90, "\\dfrac{\\pi^4}{90} = \\zeta(4)"],
    [1.2020569031595942, "\\zeta(3)\\ (\\text{ค่าคงตัวอาเปรี})"], [Math.LN2, "\\ln 2"], [Math.PI / 4, "\\dfrac{\\pi}{4}"], [Math.PI * Math.PI / 12, "\\dfrac{\\pi^2}{12}"],
    [Math.PI * Math.PI / 8, "\\dfrac{\\pi^2}{8}"], [0.915965594177219, "G\\ (\\text{ค่าคงตัวคาตาลัน})"], [Math.E, "e"], [Math.E - 1, "e - 1"], [1 / Math.E, "\\dfrac1e"],
    [Math.PI, "\\pi"], [0.5772156649015329, "\\gamma\\ (\\text{ออยเลอร์–มาสเคโรนี})"], [Math.PI * Math.PI * Math.PI / 32, "\\dfrac{\\pi^3}{32}"], [0.75 * 1.2020569031595942, "\\tfrac34\\zeta(3)"],
    [Math.sqrt(2), "\\sqrt2"], [(1 + Math.sqrt(5)) / 2, "\\varphi"], [Math.log(3) / 2, "\\tfrac12\\ln 3"], [Math.PI / (2 * Math.sqrt(3)) , "\\dfrac{\\pi}{2\\sqrt3}"], [Math.PI / Math.sqrt(27) * 3 / 3, "\\dfrac{\\pi}{3\\sqrt3}"]
  ];
  function identify(x) {
    if (!isFinite(x)) return null;
    for (var i = 0; i < KNOWN.length; i++) if (Math.abs(x - KNOWN[i][0]) < 1e-10 * Math.max(1, Math.abs(x))) return KNOWN[i][1];
    var r = MK_snap(x); if (isQ(r) && r.d <= BigInt(64)) return qtex(r, { big: true });
    for (i = 0; i < KNOWN.length; i++) for (var q = 2; q <= 12; q++) for (var p = -12; p <= 12; p++) if (p && Math.abs(x - KNOWN[i][0] * p / q) < 1e-11 * Math.max(1, Math.abs(x)) && i < 9) return "\\tfrac{" + p + "}{" + q + "}\\cdot " + KNOWN[i][1].replace(/\\ \(\\text\{[^}]*\}\)/, "");
    return null;
  }

  // ======================================================================= ?q= parser (MathSolver target)
  function parseQuery(q) {
    q = String(q || "").trim();
    if (!q) return null;
    var s = q.replace(/[Σ∑]/g, "sum ").replace(/∞/g, "inf").replace(/≤/g, "<=").replace(/\s+/g, " ").trim();
    var m = s.match(/^sum\s*\(?\s*(.+?)\s*(?:,\s*|\s+)(?:for\s+|from\s+)?k\s*=\s*([-\d]+)\s*(?:\.\.|to|,|…|ถึง)\s*([^\s)]+)\s*\)?$/i) ||
            s.match(/^sum\s*\(\s*(.+?)\s*,\s*k\s*,\s*([-\d]+)\s*,\s*([^\s)]+)\s*\)$/i);
    if (m) return { widget: "sigma", f: m[1], m: m[2], n: m[3] };
    if (/^sum\s+/i.test(s)) return { widget: "sigma", f: s.replace(/^sum\s+/i, ""), m: "1", n: "n" };
    if (/^[\s\d.,/−-]+$/.test(s) && s.split(/[,\s]+/).filter(Boolean).length >= 4) return { widget: "find", terms: s };
    var rm = s.match(/^a\s*[(_]?\s*n\s*\)?\s*=\s*([^;]+?)(?:[;,]\s*(a.*))?$/i);
    if (rm) {
      var rhs = rm[1], init = [], n0 = 0;
      (rm[2] || "").replace(/a\s*[(_]?\s*(\d+)\s*\)?\s*=\s*([-\d./]+)/gi, function (_, i, v) { init.push([+i, v]); return ""; });
      init.sort(function (x, y) { return x[0] - y[0]; });
      if (init.length) n0 = init[0][0];
      return { widget: "rec", rhs: rhs, init: init.map(function (x) { return x[1]; }), n0: n0 };
    }
    return { widget: "sigma", f: s, m: "1", n: "n" };
  }
  // right-hand side "2a(n-1) + 3a(n-2) + n^2" → {c: [Q], forcing EP}
  function parseRecRHS(rhs) {
    var src = String(rhs).replace(/a\s*[(_{]\s*n\s*-\s*(\d)\s*[)}]?/gi, function (_, j) { return "(" + "uvw"[+j - 1] + ")"; });
    if (/a\s*[(_{]/i.test(src)) throw err("เขียนพจน์ก่อนหน้าเป็น a(n-1), a(n-2), a(n-3)");
    var tree = parseExpr(src, ["n", "u", "v", "w"]);
    function at(u, v, w, n) { return evalQ(tree, { u: u, v: v, w: w, n: n }); }
    var c = [];
    for (var j = 0; j < 3; j++) {
      var e = [Q0, Q0, Q0]; e[j] = Q1;
      var c1 = qsub(at(e[0], e[1], e[2], Q(7)), at(Q0, Q0, Q0, Q(7))), c2 = qsub(at(e[0], e[1], e[2], Q(11)), at(Q0, Q0, Q0, Q(11)));
      if (!qeq(c1, c2)) throw err("สัมประสิทธิ์หน้า a(n−j) ต้องเป็นค่าคงที่");
      c.push(c1);
    }
    while (c.length && qz(c[c.length - 1])) c.pop();
    // forcing = rhs with u = v = w = 0
    var forcingTree = subst(tree, { u: 0, v: 0, w: 0 });
    var forcing = [];
    try { forcing = epOf(forcingTree, "n"); } catch (e2) { throw err("พจน์ไม่เอกพันธ์ f(n) ต้องอยู่ในรูปพหุนาม × rⁿ เช่น 3, n², 2ⁿ, n·3ⁿ"); }
    return { c: c, forcing: forcing, forcingTree: forcingTree };
  }
  function subst(node, vals) {
    if (!node) return node;
    if (node.t === "var" && node.n in vals) return { t: "num", v: vals[node.n] };
    var o = {}; for (var key in node) o[key] = node[key];
    if (node.a) o.a = subst(node.a, vals);
    if (node.b) o.b = subst(node.b, vals);
    return o;
  }

  var SC = {
    Q: Q, Q0: Q0, Q1: Q1, qadd: qadd, qsub: qsub, qmul: qmul, qdiv: qdiv, qneg: qneg, qinv: qinv, qpow: qpow, qeq: qeq, qcmp: qcmp, qz: qz, qint: qint,
    qnum: qnum, qdec: qdec, qparse: qparse, qfromNum: qfromNum, qtex: qtex, qstr: qstr, fmtNum: fmtNum, texNumF: texNumF, qdecStr: qdecStr,
    padd: padd, psub: psub, pmul: pmul, pscale: pscale, pevalQ: pevalQ, pevalN: pevalN, pdivmod: pdivmod, pgcd: pgcd, pshift: pshift, pderiv: pderiv, pdeg: pdeg,
    prationalRoots: prationalRoots, ptex: ptex, ptexAsc: ptexAsc, ptexFrac: ptexFrac, ptexFactored: ptexFactored, pinteger: pinteger, ptrim: ptrim, pcompose: pcompose,
    Field: Field, squarefree: squarefree, solveLinear: solveLinear, solveQ: solveQ,
    parseExpr: parseExpr, evalQ: evalQ, epOf: epOf, rfOf: rfOf, rfNorm: rfNorm, rftex: rftex, subst: subst,
    antiDiff: antiDiff, sumEP: sumEP, evalSumEP: evalSumEP, powerSum: powerSum, partialFractions: partialFractions, telescope: telescope,
    diffTable: diffTable, findPoly: findPoly, berlekamp: berlekamp, binomPoly: binomPoly,
    charPoly: charPoly, charRoots: charRoots, numericRoots: numericRoots, solveRecurrence: solveRecurrence, parseRecRHS: parseRecRHS,
    solveArith: solveArith, solveGeo: solveGeo, exactRoot: exactRoot, realRootsNum: realRootsNum, repeatingToFrac: repeatingToFrac,
    quadTS: quadTS, quadES: quadES, eulerMaclaurin: eulerMaclaurin, cvz: cvz, identify: identify, parseQuery: parseQuery, BERN: BERN,
    isQ: isQ, N: N, snap: MK_snap
  };
  if (typeof module !== "undefined" && module.exports) module.exports = SC;
  root.SC = SC;
  if (typeof document === "undefined") return;
  // ======================================================================= UI
  var MK = root.MK;
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function T(s, d) {
    if (root.katex) { try { return root.katex.renderToString(s, { displayMode: !!d, throwOnError: false, strict: "ignore" }); } catch (e) { /* fall through */ } }
    return "<code>" + esc(s) + "</code>";
  }
  function rich(s) { return String(s).replace(/\\\(([\s\S]+?)\\\)/g, function (_, t) { return T(t, false); }); }
  function D(s) { return '<div class="lap-eq">' + T(s, true) + "</div>"; }
  // one line on wide screens, one term per line on phones
  function DL(lhs, terms) {
    terms = terms.filter(function (t) { return t !== ""; });
    var one = terms.join(" + ").replace(/\+ -/g, "- ");
    if (terms.length < 2) return D(lhs + " = " + (one || "0"));
    var ml = "\\begin{aligned}" + lhs + " &= " + terms[0] + terms.slice(1).map(function (t) { return "\\\\ &\\quad " + (t.charAt(0) === "-" ? "- " + t.slice(1) : "+ " + t); }).join("") + "\\end{aligned}";
    return '<div class="sc-1l">' + D(lhs + " = " + one) + '</div><div class="sc-ml">' + D(ml) + "</div>";
  }
  function fmtH(x, sig) {
    var t = fmtNum(x, sig || 10), m = t.match(/^(.*)×10\^(.*)$/);
    return m ? m[1] + "×10<sup>" + m[2] + "</sup>" : t;
  }
  function stepsHtml(list, title, open) {
    if (!list.length) return "";
    return '<details class="sc-steps"' + (open === false ? "" : " open") + "><summary>" + (title || "วิธีทำทีละขั้น") + '</summary><ol class="lap-steps">' +
      list.map(function (s) { return "<li>" + (s.charAt(0) === "<" ? s : "<p>" + rich(s) + "</p>") + "</li>"; }).join("") + "</ol></details>";
  }
  function warnHtml(w) { return w && w.length ? w.map(function (x) { return '<p class="sc-warn">⚠ ' + rich(x) + "</p>"; }).join("") : ""; }
  function errHtml(e) { return '<p class="lap-err">' + esc(e && e.message ? e.message : String(e)) + "</p>"; }
  function field(key, label, ph, val, cls) {
    return '<label class="sc-f' + (cls ? " " + cls : "") + '"><span>' + label + '</span><input class="lap-in" data-k="' + key + '" placeholder="' + esc(ph || "") + '" value="' + esc(val == null ? "" : val) + '" autocomplete="off" spellcheck="false" inputmode="text"></label>';
  }
  function select(key, label, opts, val) {
    return '<label class="sc-f"><span>' + label + '</span><select class="lap-in" data-k="' + key + '">' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></label>";
  }
  function chips(list, attr, cls) {
    return '<div class="lap-chips ' + (cls || "sc-ex") + '">' + list.map(function (c, i) { return '<button type="button" class="lap-chip" ' + attr + '="' + i + '">' + esc(c.l) + "</button>"; }).join("") + "</div>";
  }
  function getVals(box) { var o = {}; $$("[data-k]", box).forEach(function (el) { o[el.getAttribute("data-k")] = el.value.trim(); }); return o; }
  function setVals(box, o) { Object.keys(o).forEach(function (k) { var el = box.querySelector('[data-k="' + k + '"]'); if (el) el.value = o[k] == null ? "" : o[k]; }); }
  // value: exact rational when possible, otherwise a number (sqrt(2), pi…); "" → undefined
  function readNum(s, label) {
    s = String(s || "").trim();
    if (!s) return undefined;
    var q = qparse(s);
    if (q) return q;
    try {
      var tree = parseExpr(s, []);
      try { return evalQ(tree, {}); } catch (e) { if (!e.notExact) throw e; }
      var v = SQ.compile(s, []).fn({});
      if (!isFinite(v)) throw err("ค่า " + label + " ไม่ถูกต้อง");
      return v;
    } catch (e) { throw err("อ่านค่า " + (label || "") + " ไม่ได้: " + (e.message || e)); }
  }
  function numOf(s) { var v = readNum(s, "คำตอบ"); return v === undefined ? NaN : N(v); }
  function close(a, b) { return isFinite(a) && isFinite(b) && Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b)); }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rtex(r) { var t = qtex(r); return qint(r) && qsign(r) >= 0 ? t : "\\left(" + t + "\\right)"; }
  function epTex(ep, v) {
    var parts = ep.map(function (t) {
      var pt = ptex(t.p, v), one = qeq(t.r, Q1);
      if (one) return pt;
      var pw = rtex(t.r) + "^{" + v + "}";
      if (t.p.length === 1) return qeq(t.p[0], Q1) ? pw : qeq(t.p[0], qneg(Q1)) ? "-" + pw : qtex(t.p[0]) + "\\cdot " + pw;
      var nz = t.p.filter(function (c) { return !qz(c); }).length;
      if (nz === 1) return pt + "\\cdot " + pw; // monomial: 2n·2ⁿ
      return "\\left(" + pt + "\\right)" + pw;
    });
    return parts.join(" + ").replace(/\+ -/g, "- ") || "0";
  }
  // score + practice panel shared by all widgets
  var SKEY = "sc-score-v1";
  function loadScore(id) { try { var o = JSON.parse(localStorage.getItem(SKEY) || "{}"); return o[id] || [0, 0]; } catch (e) { return [0, 0]; } }
  function saveScore(id, s) { try { var o = JSON.parse(localStorage.getItem(SKEY) || "{}"); o[id] = s; localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) { /* storage off */ } }
  function practicePanel(box, id, gen, reveal) {
    var panel = box.querySelector(".sc-prac"), cur = null, score = loadScore(id);
    function head() { return '<div class="sc-ph"><b>🎯 ฝึกทำ</b><span class="sc-score">ถูก ' + score[0] + " / " + score[1] + " ข้อ</span></div>"; }
    function show() {
      cur = gen();
      panel.hidden = false;
      panel.innerHTML = head() + '<div class="sc-pq">' + rich(cur.q) + "</div>" +
        '<div class="lap-row"><input class="lap-in sc-pa" placeholder="' + esc(cur.ph || "พิมพ์คำตอบ เช่น 3/4, 2^10, sqrt(5)") + '" autocomplete="off"><button type="button" class="btn btn-primary btn-sm" data-pc>ตรวจ</button><button type="button" class="btn btn-ghost btn-sm" data-pr>ดูเฉลย</button><button type="button" class="btn btn-ghost btn-sm" data-pn>ข้อใหม่</button></div><div class="sc-pf" aria-live="polite"></div>';
      box.querySelector(".sc-out").innerHTML = "";
      var inp = panel.querySelector(".sc-pa"); if (inp && window.matchMedia && !window.matchMedia("(pointer:coarse)").matches) inp.focus();
    }
    panel.addEventListener("click", function (e) {
      if (!cur) return;
      var fb = panel.querySelector(".sc-pf");
      if (e.target.closest("[data-pc]")) {
        var got; try { got = cur.check ? cur.check(panel.querySelector(".sc-pa").value) : close(numOf(panel.querySelector(".sc-pa").value), cur.a); } catch (x) { fb.innerHTML = errHtml(x); return; }
        if (!cur.done) { score[1]++; if (got) score[0]++; saveScore(id, score); cur.done = true; panel.querySelector(".sc-score").textContent = "ถูก " + score[0] + " / " + score[1] + " ข้อ"; }
        fb.innerHTML = got ? '<p class="sc-ok">✓ ถูกต้อง! ' + (cur.why ? rich(cur.why) : "") + "</p>" : '<p class="sc-no">✗ ยังไม่ถูก ลองอีกครั้ง หรือกด “ดูเฉลย”</p>';
        if (got) reveal(cur);
      } else if (e.target.closest("[data-pr]")) {
        if (!cur.done) { score[1]++; saveScore(id, score); cur.done = true; panel.querySelector(".sc-score").textContent = "ถูก " + score[0] + " / " + score[1] + " ข้อ"; }
        fb.innerHTML = '<p class="sc-no">คำตอบ: ' + rich(cur.ans) + "</p>"; reveal(cur);
      } else if (e.target.closest("[data-pn]")) show();
    });
    panel.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("sc-pa")) { e.preventDefault(); var b = panel.querySelector("[data-pc]"); if (b) b.click(); } });
    return show;
  }
  function shell(box, top, opts) {
    opts = opts || {};
    box.innerHTML = top +
      '<div class="sc-act"><button type="button" class="btn btn-primary btn-sm" data-go>คำนวณ</button>' +
      (opts.practice === false ? "" : '<button type="button" class="btn btn-ghost btn-sm" data-practice>🎯 ฝึกทำ</button>') +
      (opts.share ? '<button type="button" class="btn btn-ghost btn-sm" data-share>🔗 ลิงก์โจทย์นี้</button>' : "") + "</div>" +
      '<div class="sc-prac" hidden></div><div class="sc-out" aria-live="polite"></div>';
  }
  function bindEnter(box, go) {
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.matches("input[data-k]")) { e.preventDefault(); go(); } });
  }
  function shareLink(box, q) {
    var url = location.origin + location.pathname + "?q=" + encodeURIComponent(q) + "#" + (box.closest("section") && box.closest("section").querySelector("h2") ? box.closest("section").querySelector("h2").id : "");
    var done = function () { var b = box.querySelector("[data-share]"); if (b) { var t = b.textContent; b.textContent = "✓ คัดลอกลิงก์แล้ว"; setTimeout(function () { b.textContent = t; }, 1800); } };
    try { if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt("คัดลอกลิงก์", url); }); else prompt("คัดลอกลิงก์", url); } catch (e) { prompt("คัดลอกลิงก์", url); }
  }

  // ======================================================================= 1. arithmetic / geometric solver
  var AG_EX = {
    arith: [
      { l: "a₁ = 3, d = 4, n = 20", v: { a1: "3", d: "4", n: "20", an: "", Sn: "" } },
      { l: "a₁ = 5, aₙ = 95, n = 31 → d", v: { a1: "5", d: "", n: "31", an: "95", Sn: "" } },
      { l: "a₁ = 3, d = 4, Sₙ = 820 → n", v: { a1: "3", d: "4", n: "", an: "", Sn: "820" } },
      { l: "a₁ = −9, d = 2, Sₙ = −21 (สองคำตอบ)", v: { a1: "-9", d: "2", n: "", an: "", Sn: "-21" } },
      { l: "d = 1/2, n = 10, Sₙ = 45/2 → a₁", v: { a1: "", d: "1/2", n: "10", an: "", Sn: "45/2" } }
    ],
    geo: [
      { l: "a₁ = 3, r = 2, n = 8", v: { a1: "3", r: "2", n: "8", an: "", Sn: "", Sinf: "" } },
      { l: "a₁ = 2, aₙ = 162, n = 5 → r", v: { a1: "2", r: "", n: "5", an: "162", Sn: "", Sinf: "" } },
      { l: "a₁ = 5, S∞ = 10 → r", v: { a1: "5", r: "", n: "", an: "", Sn: "", Sinf: "10" } },
      { l: "a₁ = 1, n = 4, Sₙ = 40 → r", v: { a1: "1", r: "", n: "4", an: "", Sn: "40", Sinf: "" } },
      { l: "a₁ = 64, r = −1/2, n = 7", v: { a1: "64", r: "-1/2", n: "7", an: "", Sn: "", Sinf: "" } }
    ],
    two: [
      { l: "a₅ = 17, a₁₂ = 38 (เลขคณิต)", v: { kind: "arith", p: "5", ap: "17", q: "12", aq: "38", N: "30" } },
      { l: "a₃ = 12, a₆ = 96 (เรขาคณิต)", v: { kind: "geo", p: "3", ap: "12", q: "6", aq: "96", N: "10" } },
      { l: "a₂ = 6, a₄ = 54 (r = ±3)", v: { kind: "geo", p: "2", ap: "6", q: "4", aq: "54", N: "6" } },
      { l: "a₄ = 10, a₁₀ = −8 (เลขคณิต)", v: { kind: "arith", p: "4", ap: "10", q: "10", aq: "-8", N: "20" } }
    ]
  };
  function initAG(box) {
    var st = { mode: box.dataset.mode || "arith" };
    function form() {
      var f = st.mode === "arith" ? field("a1", "a₁ พจน์แรก", "เช่น 3") + field("d", "d ผลต่างร่วม", "เช่น 4 หรือ 1/2") + field("n", "n จำนวนพจน์", "จำนวนเต็มบวก") + field("an", "aₙ พจน์ที่ n", "") + field("Sn", "Sₙ ผลบวก n พจน์", "")
        : st.mode === "geo" ? field("a1", "a₁ พจน์แรก", "เช่น 3") + field("r", "r อัตราส่วนร่วม", "เช่น 2 หรือ −1/2") + field("n", "n จำนวนพจน์", "") + field("an", "aₙ พจน์ที่ n", "") + field("Sn", "Sₙ ผลบวก n พจน์", "") + field("Sinf", "S∞ ผลบวกอนันต์", "ถ้ามี")
        : select("kind", "ชนิดลำดับ", [["arith", "เลขคณิต"], ["geo", "เรขาคณิต"]], "arith") + field("p", "ตำแหน่ง p", "เช่น 5") + field("ap", "aₚ", "เช่น 17") + field("q", "ตำแหน่ง q", "เช่น 12") + field("aq", "a_q", "เช่น 38") + field("N", "หา a_N และ S_N ที่ N =", "ไม่บังคับ");
      return '<div class="lap-chips sc-modes"><button type="button" class="lap-chip" data-m="arith">ลำดับเลขคณิต</button><button type="button" class="lap-chip" data-m="geo">ลำดับเรขาคณิต</button><button type="button" class="lap-chip" data-m="two">รู้สองพจน์ใดๆ</button></div>' +
        '<p class="lap-help">' + (st.mode === "two" ? "กรอกพจน์ที่รู้สองพจน์ (ตำแหน่งและค่า) แล้วเลือกชนิดลำดับ" : "กรอกค่าที่รู้อย่างน้อย 3 ช่อง เว้นช่องที่ต้องการหาไว้ (รับเศษส่วน เช่น 1/2 และนิพจน์ เช่น sqrt(2))") + "</p>" +
        '<div class="sc-form">' + f + "</div>" + chips(AG_EX[st.mode], "data-ex");
    }
    function render() {
      shell(box, form(), {});
      $$("[data-m]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-m") === st.mode); });
      startPractice = practicePanel(box, "ag-" + st.mode, gen, function (p) { setVals(box, p.fill); solve(true); });
    }
    var startPractice;
    function resultGrid(vals, keys) {
      var lab = { a1: "a_1", d: "d", r: "r", n: "n", an: "a_n", Sn: "S_n", Sinf: "S_\\infty", aN: "a_N", SN: "S_N" };
      return '<div class="sc-grid">' + keys.filter(function (k) { return vals[k] !== undefined; }).map(function (k) {
        var v = vals[k], t = isQ(v) ? qtex(v) : texNumF(v, 10), dec = isQ(v) && !qint(v) ? '<small>≈ ' + fmtNum(qnum(v), 8) + "</small>" : "";
        return '<div class="sc-cell"><span>' + T(lab[k]) + "</span><b>" + T(t) + "</b>" + dec + "</div>";
      }).join("") + "</div>";
    }
    function firstTerms(a1, step, geo, count) {
      var out = [], x = a1;
      for (var i = 0; i < count; i++) { out.push(isQ(x) ? qtex(x) : texNumF(x, 8)); x = geo ? (isQ(x) && isQ(step) ? qmul(x, step) : N(x) * N(step)) : (isQ(x) && isQ(step) ? qadd(x, step) : N(x) + N(step)); }
      return out.join(",\\ ") + ",\\ \\dots";
    }
    function generalTerm(a1, step, geo) {
      if (geo) return isQ(a1) && isQ(step) ? (qeq(a1, Q1) ? "" : qtex(a1) + "\\cdot ") + rtex(step) + "^{n-1}" : texNumF(N(a1)) + "\\cdot(" + texNumF(N(step)) + ")^{n-1}";
      if (isQ(a1) && isQ(step)) return ptex([qsub(a1, step), step], "n");
      return texNumF(N(a1)) + " + (n-1)(" + texNumF(N(step)) + ")";
    }
    function solve(fromPractice) {
      var out = box.querySelector(".sc-out"), v = getVals(box);
      try {
        var res, html = "";
        if (st.mode === "two") {
          var p = readNum(v.p, "p"), q = readNum(v.q, "q"), ap = readNum(v.ap, "aₚ"), aq = readNum(v.aq, "a_q"), NN = readNum(v.N, "N");
          if (!p || !q || ap === undefined || aq === undefined) throw err("กรอก p, aₚ, q และ a_q ให้ครบ");
          if (!intQ(p) || !intQ(q) || qeq(p, q)) throw err("p และ q ต้องเป็นจำนวนเต็มบวกที่ต่างกัน");
          var pi = Number(p.n), qi = Number(q.n), steps = [], warn = [], a1, step;
          if (v.kind === "geo") {
            var e = qi - pi, ratio = isQ(ap) && isQ(aq) ? qdiv(aq, ap) : N(aq) / N(ap);
            steps.push("\\(\\dfrac{a_q}{a_p} = r^{q-p}\\) ⇒ \\(r^{" + e + "} = " + (isQ(ratio) ? qtex(ratio) : texNumF(ratio)) + "\\)");
            var rs = isQ(ratio) ? exactRoot(e > 0 ? ratio : qinv(ratio), Math.abs(e)) : null;
            if (!rs) { var rv = N(ratio); if (e < 0) { rv = 1 / rv; } var ae = Math.abs(e); if (rv > 0) { var rr = Math.pow(rv, 1 / ae); rs = ae % 2 === 0 ? [rr, -rr] : [rr]; } else if (ae % 2) rs = [-Math.pow(-rv, 1 / ae)]; else throw err("ไม่มี r จริง (ยกกำลังคู่ได้ค่าลบ)"); }
            steps.push("⇒ \\(r = " + rs.map(function (x) { return isQ(x) ? qtex(x) : texNumF(x); }).join("\\ \\text{หรือ}\\ ") + "\\)");
            if (rs.length > 1) warn.push("ได้ r สองค่า เลขชี้กำลัง " + Math.abs(e) + " เป็นเลขคู่ จึงมีลำดับที่สอดคล้องสองชุด แสดงชุด r = " + (isQ(rs[0]) ? qstr(rs[0]) : fmtNum(rs[0])) + " (อีกชุดคือ r = " + (isQ(rs[1]) ? qstr(rs[1]) : fmtNum(rs[1])) + ")");
            step = rs[0];
            a1 = isQ(ap) && isQ(step) ? qdiv(ap, qpow(step, pi - 1)) : N(ap) / Math.pow(N(step), pi - 1);
            steps.push("\\(a_1 = \\dfrac{a_p}{r^{p-1}} = \\dfrac{" + A(ap) + "}{" + (isQ(step) ? rtex(step) : "(" + texNumF(N(step)) + ")") + "^{" + (pi - 1) + "}} = " + A(a1) + "\\)");
          } else {
            step = isQ(ap) && isQ(aq) ? qdiv(qsub(aq, ap), Q(qi - pi)) : (N(aq) - N(ap)) / (qi - pi);
            steps.push("\\(a_q - a_p = (q - p)d\\) ⇒ \\(d = \\dfrac{" + A(aq) + " - (" + A(ap) + ")}{" + qi + " - " + pi + "} = " + A(step) + "\\)");
            a1 = isQ(ap) && isQ(step) ? qsub(ap, qmul(Q(pi - 1), step)) : N(ap) - (pi - 1) * N(step);
            steps.push("\\(a_1 = a_p - (p-1)d = " + A(ap) + " - " + (pi - 1) + "(" + A(step) + ") = " + A(a1) + "\\)");
          }
          var geo = v.kind === "geo";
          steps.push("พจน์ทั่วไป \\(a_n = " + generalTerm(a1, step, geo) + "\\)");
          var vals = { a1: a1 }; vals[geo ? "r" : "d"] = step;
          if (NN !== undefined) {
            if (!intQ(NN)) throw err("N ต้องเป็นจำนวนเต็มบวก");
            var sub = geo ? solveGeo({ a1: a1, r: step, n: NN }) : solveArith({ a1: a1, d: step, n: NN });
            vals.aN = sub.vals.an; vals.SN = sub.vals.Sn;
            steps = steps.concat(sub.steps.map(function (s) { return s.replace(/a_n/g, "a_{" + Number(NN.n) + "}").replace(/S_n/g, "S_{" + Number(NN.n) + "}"); }));
          }
          html = resultGrid(vals, ["a1", geo ? "r" : "d", "aN", "SN"]) + D("a_n = " + generalTerm(a1, step, geo)) + '<p class="sc-terms">' + T(firstTerms(a1, step, geo, 7)) + "</p>" + warnHtml(warn) + stepsHtml(steps);
        } else {
          var known = {}, keys = st.mode === "arith" ? ["a1", "d", "n", "an", "Sn"] : ["a1", "r", "n", "an", "Sn", "Sinf"];
          var labels = { a1: "a₁", d: "d", r: "r", n: "n", an: "aₙ", Sn: "Sₙ", Sinf: "S∞" };
          keys.forEach(function (k) { var x = readNum(v[k], labels[k]); if (x !== undefined) known[k] = x; });
          res = st.mode === "arith" ? solveArith(known) : solveGeo(known);
          var gk = st.mode === "arith" ? "d" : "r";
          html = resultGrid(res.vals, ["a1", gk, "n", "an", "Sn", "Sinf"]) +
            D("a_n = " + generalTerm(res.vals.a1, res.vals[gk], st.mode === "geo")) +
            '<p class="sc-terms">' + T(firstTerms(res.vals.a1, res.vals[gk], st.mode === "geo", 7)) + "</p>" + warnHtml(res.warn) + stepsHtml(res.steps);
        }
        out.innerHTML = html;
      } catch (e) { out.innerHTML = errHtml(e); if (!e.user && root.console) console.error(e); }
      if (!fromPractice) box.querySelector(".sc-prac").hidden = true;
    }
    function gen() {
      var a1, d, n, r, kind = st.mode;
      if (kind === "arith") {
        a1 = ri(-12, 15); d = pick([-5, -3, -2, 2, 3, 4, 5, 6, 7]); n = ri(8, 40);
        var an = a1 + (n - 1) * d, Sn = n * (a1 + an) / 2, t = ri(0, 3);
        if (t === 0) return { q: "ลำดับเลขคณิตมี \\(a_1 = " + a1 + ",\\ d = " + d + "\\) จงหาผลบวก " + n + " พจน์แรก \\(S_{" + n + "}\\)", a: Sn, ans: "\\(S_{" + n + "} = " + Sn + "\\)", fill: { a1: a1, d: d, n: n, an: "", Sn: "" } };
        if (t === 1) return { q: "ลำดับเลขคณิตมี \\(a_1 = " + a1 + "\\) และ \\(a_{" + n + "} = " + an + "\\) จงหาผลต่างร่วม \\(d\\)", a: d, ans: "\\(d = " + d + "\\)", fill: { a1: a1, d: "", n: n, an: an, Sn: "" } };
        if (t === 2) return { q: "ลำดับเลขคณิต \\(" + a1 + ", " + (a1 + d) + ", " + (a1 + 2 * d) + ", \\dots\\) พจน์ใดมีค่าเท่ากับ \\(" + an + "\\) (หา n)", a: n, ans: "\\(n = " + n + "\\)", fill: { a1: a1, d: d, n: "", an: an, Sn: "" } };
        var dd = Math.abs(d), a = Math.abs(a1) + 1;
        Sn = n * (2 * a + (n - 1) * dd) / 2;
        return { q: "ลำดับเลขคณิตมี \\(a_1 = " + a + ",\\ d = " + dd + "\\) ต้องบวกกี่พจน์จึงได้ผลบวกเท่ากับ \\(" + Sn + "\\)", a: n, ans: "\\(n = " + n + "\\)", fill: { a1: a, d: dd, n: "", an: "", Sn: Sn } };
      }
      if (kind === "geo") {
        a1 = pick([1, 2, 3, 4, 5, -2, 6]); r = pick([2, 3, -2, -3, 2, 4]); n = ri(4, 9);
        var t2 = ri(0, 3), anG = a1 * Math.pow(r, n - 1), SnG = a1 * (1 - Math.pow(r, n)) / (1 - r);
        if (t2 === 0) return { q: "ลำดับเรขาคณิตมี \\(a_1 = " + a1 + ",\\ r = " + r + "\\) จงหา \\(S_{" + n + "}\\)", a: SnG, ans: "\\(S_{" + n + "} = " + SnG + "\\)", fill: { a1: a1, r: r, n: n, an: "", Sn: "", Sinf: "" } };
        if (t2 === 1) { var rp = Math.abs(r); anG = a1 * Math.pow(rp, n - 1); return { q: "ลำดับเรขาคณิตที่ทุกพจน์มีเครื่องหมายเดียวกัน \\(a_1 = " + a1 + ",\\ a_{" + n + "} = " + anG + "\\) จงหา \\(r\\)", a: rp, ans: "\\(r = " + rp + "\\)", fill: { a1: a1, r: "", n: n, an: anG, Sn: "", Sinf: "" } }; }
        if (t2 === 2) { var den = pick([2, 3, 4, 5]), num = pick([1, -1, 2, -2]); if (Math.abs(num) >= den) num = 1; var a0 = pick([4, 6, 8, 9, 12]); var Sinf = a0 / (1 - num / den); var rq = Q(num, den); return { q: "อนุกรมเรขาคณิตอนันต์มี \\(a_1 = " + a0 + "\\) และ \\(r = " + qtex(rq) + "\\) จงหาผลบวก \\(S_\\infty\\)", a: Sinf, ans: "\\(S_\\infty = " + qtex(qdiv(Q(a0), qsub(Q1, rq))) + "\\)", fill: { a1: a0, r: qstr(rq), n: "", an: "", Sn: "", Sinf: "" }, }; }
        return { q: "ลำดับเรขาคณิต \\(" + a1 + ", " + a1 * r + ", " + a1 * r * r + ", \\dots\\) จงหาพจน์ที่ " + n, a: anG, ans: "\\(a_{" + n + "} = " + anG + "\\)", fill: { a1: a1, r: r, n: n, an: "", Sn: "", Sinf: "" } };
      }
      // two terms
      var g = Math.random() < 0.5;
      if (!g) { a1 = ri(-10, 12); d = pick([-4, -3, 2, 3, 5, 6]); var p = ri(2, 6), q = p + ri(3, 9), Nn = ri(15, 30); return { q: "ลำดับเลขคณิตมี \\(a_{" + p + "} = " + (a1 + (p - 1) * d) + "\\) และ \\(a_{" + q + "} = " + (a1 + (q - 1) * d) + "\\) จงหา \\(a_{" + Nn + "}\\)", a: a1 + (Nn - 1) * d, ans: "\\(a_{" + Nn + "} = " + (a1 + (Nn - 1) * d) + "\\)", fill: { kind: "arith", p: p, ap: a1 + (p - 1) * d, q: q, aq: a1 + (q - 1) * d, N: Nn } }; }
      a1 = pick([1, 2, 3, 5]); r = pick([2, 3]); var p2 = ri(2, 3), q2 = p2 + pick([1, 3]), N2 = ri(6, 8);
      return { q: "ลำดับเรขาคณิตที่ r เป็นบวก มี \\(a_{" + p2 + "} = " + a1 * Math.pow(r, p2 - 1) + "\\) และ \\(a_{" + q2 + "} = " + a1 * Math.pow(r, q2 - 1) + "\\) จงหา \\(a_{" + N2 + "}\\)", a: a1 * Math.pow(r, N2 - 1), ans: "\\(a_{" + N2 + "} = " + a1 * Math.pow(r, N2 - 1) + "\\)", fill: { kind: "geo", p: p2, ap: a1 * Math.pow(r, p2 - 1), q: q2, aq: a1 * Math.pow(r, q2 - 1), N: N2 } };
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]"); if (m) { st.mode = m.getAttribute("data-m"); render(); return; }
      var x = e.target.closest("[data-ex]"); if (x) { setVals(box, AG_EX[st.mode][+x.getAttribute("data-ex")].v); solve(); return; }
      if (e.target.closest("[data-go]")) solve();
      if (e.target.closest("[data-practice]")) startPractice();
    });
    bindEnter(box, function () { solve(); });
    box._set = function (o) { if (o.mode) { st.mode = o.mode; render(); } setVals(box, o); solve(); };
    render();
    setVals(box, AG_EX[st.mode][0].v); solve();
  }
  // ======================================================================= 2. Σ calculator
  var SG_EX = [
    { l: "Σ k² (สูตรผลบวกกำลังสอง)", v: { f: "k^2", m: "1", n: "n" } },
    { l: "Σ k(k+1)", v: { f: "k(k+1)", m: "1", n: "n" } },
    { l: "Σ (2k − 1)³", v: { f: "(2k-1)^3", m: "1", n: "n" } },
    { l: "Σ k³ ถึง 20", v: { f: "k^3", m: "1", n: "20" } },
    { l: "Σ 3·2ᵏ⁻¹", v: { f: "3*2^(k-1)", m: "1", n: "n" } },
    { l: "Σ k·2ᵏ (เลขคณิต-เรขาคณิต)", v: { f: "k*2^k", m: "1", n: "n" } },
    { l: "Σ k/2ᵏ ถึง ∞", v: { f: "k/2^k", m: "1", n: "inf" } },
    { l: "Σ 1/(k(k+1))", v: { f: "1/(k(k+1))", m: "1", n: "n" } },
    { l: "Σ 1/((2k−1)(2k+1)) ถึง ∞", v: { f: "1/((2k-1)(2k+1))", m: "1", n: "inf" } },
    { l: "Σ 1/(k(k+1)(k+2))", v: { f: "1/(k(k+1)(k+2))", m: "1", n: "n" } },
    { l: "Σ 1/(k² − 1), k ≥ 2", v: { f: "1/(k^2-1)", m: "2", n: "inf" } },
    { l: "Σ (−1)ᵏ k²", v: { f: "(-1)^k*k^2", m: "1", n: "n" } },
    { l: "Σ 1/k² ถึง ∞ (ไม่มีรูปปิดแบบนี้)", v: { f: "1/k^2", m: "1", n: "inf" } }
  ];
  function initSigma(box) {
    var d = box.dataset;
    var top = '<div class="sc-form sc-form-sigma">' + field("f", "พจน์ f(k)", "เช่น k^2, 1/(k(k+1)), k*2^k", d.f || "k^2", "sc-wide") + field("m", "จาก k =", "1", d.m || "1", "sc-sm") + field("n", "ถึง", "n, 20 หรือ inf", d.n || "n", "sc-sm") + "</div>" +
      '<div class="sc-preview"></div>' +
      '<p class="lap-help">ตัวแปรคือ k · ขอบบนพิมพ์ <code>n</code> เพื่อหาสูตร Sₙ, ตัวเลขเพื่อหาค่า, หรือ <code>inf</code> สำหรับอนุกรมอนันต์ · คูณติดกันได้ เช่น <code>3k(k+1)</code></p>' + chips(SG_EX, "data-ex");
    shell(box, top, { share: true });
    var prev = box.querySelector(".sc-preview");
    function preview() {
      var v = getVals(box);
      try { var c = SQ.compile(v.f || "0", ["k"]); var up = /^(inf|∞|infinity)$/i.test(v.n) ? "\\infty" : v.n || "n"; prev.innerHTML = T("\\sum_{k=" + (v.m || "1") + "}^{" + up + "} " + c.tex, true); } catch (e) { prev.innerHTML = '<span class="lap-help">' + esc(e.message) + "</span>"; }
    }
    function solve(fromPractice) {
      var out = box.querySelector(".sc-out"), v = getVals(box);
      try { out.innerHTML = sigmaHtml(v.f, v.m, v.n); } catch (e) { out.innerHTML = errHtml(e); if (!e.user && root.console) console.error(e); }
      if (!fromPractice) box.querySelector(".sc-prac").hidden = true;
    }
    function gen() {
      var t = ri(0, 4), n = ri(10, 25);
      if (t === 0) { var a = ri(1, 4), b = ri(-3, 5); var f = a + "k" + (b < 0 ? "" : "+") + b; var S = 0; for (var k = 1; k <= n; k++) S += a * k + b; return { q: "จงหา \\(\\displaystyle\\sum_{k=1}^{" + n + "} (" + a + "k " + (b < 0 ? "- " + (-b) : "+ " + b) + ")\\)", a: S, ans: "\\(" + S + "\\)", fill: { f: f, m: 1, n: n } }; }
      if (t === 1) { var S2 = 0; for (var k2 = 1; k2 <= n; k2++) S2 += k2 * (k2 + 1); return { q: "จงหา \\(1\\cdot2 + 2\\cdot3 + 3\\cdot4 + \\dots + " + n + "\\cdot" + (n + 1) + "\\)", a: S2, ans: "\\(" + S2 + "\\)", fill: { f: "k(k+1)", m: 1, n: n } }; }
      if (t === 2) { var m = ri(3, 8), S3 = 0; for (var k3 = m; k3 <= n + m; k3++) S3 += k3 * k3; return { q: "จงหา \\(\\displaystyle\\sum_{k=" + m + "}^{" + (n + m) + "} k^2\\)", a: S3, ans: "\\(" + S3 + "\\)", fill: { f: "k^2", m: m, n: n + m } }; }
      if (t === 3) { var c = pick([1, 2, 3]); var S4 = Q0; for (var k4 = 1; k4 <= n; k4++) S4 = qadd(S4, Q(1, k4 * (k4 + c))); return { q: "จงหา \\(\\displaystyle\\sum_{k=1}^{" + n + "} \\frac{1}{k(k+" + c + ")}\\) (ตอบเป็นเศษส่วน)", a: qnum(S4), ans: "\\(" + qtex(S4) + "\\)", fill: { f: "1/(k(k+" + c + "))", m: 1, n: n } }; }
      var r = pick([2, 3]), b2 = pick([1, 2, 3]);
      var val = qnum(qdiv(Q(b2 * r), Q((r - 1) * (r - 1))));
      return { q: "จงหาผลบวกอนันต์ \\(\\displaystyle\\sum_{k=1}^{\\infty} \\frac{" + b2 + "k}{" + r + "^{k}}\\)", a: val, ans: "\\(" + qtex(qdiv(Q(b2 * r), Q((r - 1) * (r - 1)))) + "\\)", fill: { f: b2 + "k/" + r + "^k", m: 1, n: "inf" } };
    }
    var startPractice = practicePanel(box, "sigma", gen, function (p) { setVals(box, p.fill); preview(); solve(true); });
    box.addEventListener("input", function (e) { if (e.target.matches("[data-k]")) preview(); });
    box.addEventListener("click", function (e) {
      var x = e.target.closest("[data-ex]"); if (x) { setVals(box, SG_EX[+x.getAttribute("data-ex")].v); preview(); solve(); return; }
      if (e.target.closest("[data-go]")) solve();
      if (e.target.closest("[data-practice]")) startPractice();
      if (e.target.closest("[data-share]")) { var v = getVals(box); shareLink(box, "sum " + v.f + ", k=" + v.m + ".." + v.n); }
    });
    bindEnter(box, function () { solve(); });
    box._set = function (o) { setVals(box, o); preview(); solve(); };
    preview(); solve();
  }
  function sigmaHtml(fs, ms, ns) {
    var m = parseInt(ms, 10);
    if (!isFinite(m) || String(m) !== String(ms).trim()) throw err("ขอบล่างต้องเป็นจำนวนเต็ม");
    var inf = /^(inf|∞|infinity)$/i.test(String(ns).trim()), sym = /^n$/i.test(String(ns).trim()), nNum = null;
    if (!inf && !sym) { nNum = parseInt(ns, 10); if (!isFinite(nNum) || String(nNum) !== String(ns).trim()) throw err("ขอบบนต้องเป็น n, จำนวนเต็ม หรือ inf"); if (nNum < m) throw err("ขอบบนต้องไม่น้อยกว่าขอบล่าง"); }
    var tree = parseExpr(fs, ["k"]), ftex = SQ.toTex(tree, {});
    var up = inf ? "\\infty" : sym ? "n" : String(nNum), head = "\\sum_{k=" + m + "}^{" + up + "} " + ftex;
    var steps = [], html = "", method = "";
    var ep = null, rf = null;
    try { ep = epOf(tree, "k"); } catch (e) { if (!e.notForm) throw e; }
    if (ep) {
      var hasPoly = ep.some(function (t) { return qeq(t.r, Q1); }), hasExp = ep.some(function (t) { return !qeq(t.r, Q1); });
      method = hasExp ? (ep.every(function (t) { return t.p.length === 1; }) && !hasPoly ? "อนุกรมเรขาคณิต (geometric series)" : "พหุนาม × rᵏ (arithmetico-geometric) ด้วยผลต่างถอยหลังแบบไม่ต่อเนื่อง") : "สูตรผลบวกกำลัง (Faulhaber) + สมบัติเชิงเส้น";
      var S = sumEP(ep, m);
      // steps
      var expanded = epTex(ep, "k");
      if (expanded.replace(/\s/g, "") !== ftex.replace(/\s/g, "")) steps.push("เขียนพจน์ใหม่ให้อยู่ในรูปมาตรฐาน: \\(f(k) = " + expanded + "\\)");
      ep.forEach(function (t) {
        if (qeq(t.r, Q1)) {
          var lines = [];
          for (var j = pdeg(t.p); j >= 0; j--) if (t.p[j] && !qz(t.p[j])) {
            if (j === 0) lines.push("\\sum_{k=1}^{n} 1 = n");
            else lines.push("\\sum_{k=1}^{n} k" + (j > 1 ? "^{" + j + "}" : "") + " = " + (ptexFactored(powerSum(j), "n") || ptex(powerSum(j), "n")));
          }
          steps.push("ส่วนพหุนาม \\(" + ptex(t.p, "k") + "\\): แยกด้วยสมบัติเชิงเส้น \\(\\sum (\\alpha f + \\beta g) = \\alpha\\sum f + \\beta\\sum g\\) แล้วใช้สูตร" + '<div class="lap-eq">' + T("\\begin{aligned}" + lines.join("\\\\") + "\\end{aligned}", true) + "</div>");
          if (m !== 1) steps.push("เริ่มที่ \\(k = " + m + "\\) ไม่ใช่ 1: \\(\\sum_{k=" + m + "}^{n} = \\sum_{k=1}^{n} - \\sum_{k=1}^{" + (m - 1) + "}\\)" + (m - 1 >= 1 ? " และ \\(\\sum_{k=1}^{" + (m - 1) + "} " + ptex(t.p, "k") + " = " + qtex(pevalQ(sumEP([{ r: Q1, p: t.p }], 1).poly, Q(m - 1))) + "\\)" : ""));
        } else {
          var Qp = antiDiff(t.p, t.r);
          if (t.p.length === 1) {
            var a = qmul(t.p[0], qpow(t.r, m));
            steps.push("ส่วน \\(" + epTex([t], "k") + "\\) เป็นอนุกรมเรขาคณิต: พจน์แรก \\(a = f(" + m + ") = " + qtex(a) + "\\) อัตราส่วน \\(r = " + qtex(t.r) + "\\) จำนวนพจน์ \\(N = n - " + (m - 1) + "\\) ⇒ \\(\\sum = \\dfrac{a(1 - r^{N})}{1 - r}\\)");
          } else {
            steps.push("ส่วน \\(" + epTex([t], "k") + "\\): หาพหุนาม \\(Q(k)\\) ดีกรีเท่า \\(P(k) = " + ptex(t.p, "k") + "\\) ที่ทำให้ \\(Q(k)r^{k} - Q(k-1)r^{k-1} = P(k)r^{k}\\) (เท่ากับวิธี \\(S - rS\\) ในตำรา) ได้ \\(Q(k) = " + ptex(Qp, "k") + "\\) แล้วผลบวกยุบเหลือ \\(Q(n)r^{n} - Q(" + (m - 1) + ")r^{" + (m - 1) + "}\\)");
          }
        }
      });
      var polyT = S.poly.length ? (ptexFactored(S.poly, "n") || ptex(S.poly, "n")) : "";
      var expT = S.parts.map(function (p) {
        if (p.Q.length === 1) { var c = p.Q[0]; return (qeq(c, Q1) ? "" : qeq(c, qneg(Q1)) ? "-" : qtex(c) + "\\cdot ") + rtex(p.r) + "^{n}"; }
        var fq = ptexFactored(p.Q, "n");
        return (fq ? fq : "\\left(" + ptex(p.Q, "n") + "\\right)") + "\\cdot " + rtex(p.r) + "^{n}";
      });
      var cT = qz(S.C) ? "" : qtex(S.C);
      var closed = [polyT].concat(expT).concat([cT]).filter(Boolean).join(" + ").replace(/\+ -/g, "- ") || "0";
      if (sym) {
        html += '<div class="lap-ans">' + D(head + " = " + closed) + (S.poly.length > 1 && polyT !== ptex(S.poly, "n") ? D("= " + [ptex(S.poly, "n")].concat(expT).concat([cT]).filter(Boolean).join(" + ").replace(/\+ -/g, "- ")) : "") + "</div>";
        // check table
        var rows = []; for (var nn = m; nn < m + 5; nn++) { var direct = Q0; for (var k = m; k <= nn; k++) direct = qadd(direct, evalQ(tree, { k: Q(k) })); rows.push([nn, qtex(direct), qtex(evalSumEP(S, nn))]); }
        steps.push("ตรวจคำตอบ: แทน n ค่าเล็ก ๆ เทียบกับการบวกตรง" + tableHtml(["n", "บวกตรง", "จากสูตร"], rows.map(function (r) { return [r[0], T(r[1]), T(r[2]) + " ✓"]; })));
      } else if (inf) {
        var div = S.poly.length || S.parts.some(function (p) { return qcmp(qabs(p.r), Q1) >= 0; });
        if (div) {
          html += '<div class="lap-ans">' + D(head) + "<p><b>ลู่ออก</b> " + (S.poly.length ? "เพราะผลบวกย่อยมีส่วนพหุนามที่โตไม่จำกัด (พจน์ไม่เข้าใกล้ 0)" : "เพราะมีพจน์ \\(r^k\\) ที่ \\(|r| \\ge 1\\)") + "</p></div>";
          steps.push("ผลบวกย่อย \\(S_n = " + closed + "\\) ไม่มีลิมิตจำกัดเมื่อ \\(n \\to \\infty\\)");
        } else {
          html += '<div class="lap-ans">' + D(head + " = " + qtex(S.C, { big: true })) + '<p class="sc-dec">≈ ' + fmtNum(qnum(S.C), 12) + "</p></div>";
          steps.push("ผลบวกย่อย \\(S_n = " + closed + "\\) และเพราะ \\(|r| < 1\\) ทำให้ \\(n^j r^n \\to 0\\) ⇒ \\(\\lim_{n\\to\\infty} S_n = " + qtex(S.C) + "\\)");
        }
      } else {
        var val = evalSumEP(S, nNum);
        html += '<div class="lap-ans">' + D(head + " = " + qtex(val, { big: true })) + (qint(val) ? "" : '<p class="sc-dec">≈ ' + fmtNum(qnum(val), 12) + "</p>") + "</div>";
        steps.push("สูตรผลบวก \\(S_n = " + closed + "\\) แทน \\(n = " + nNum + "\\) ได้ \\(" + qtex(val) + "\\)");
        if (nNum - m <= 2000) { var direct2 = Q0; for (var k2 = m; k2 <= nNum; k2++) direct2 = qadd(direct2, evalQ(tree, { k: Q(k2) })); steps.push("ตรวจด้วยการบวกตรงทุกพจน์ (เลขแม่นตรง): " + (qeq(direct2, val) ? "ตรงกัน ✓" : "ไม่ตรง ✗")); }
      }
      return '<p class="sc-method"><span class="lap-flag ok">วิธี</span> ' + method + "</p>" + html + stepsHtml(steps);
    }
    try { rf = rfOf(tree, "k"); } catch (e) { if (!e.notForm) throw e; }
    if (rf && pdeg(rf.den) >= 1) {
      var pf = partialFractions(rf);
      if (pf && !pf.repeated && pf.poly.length === 0) {
        var tl = telescope(pf, m);
        if (tl.pole) throw err("พจน์ไม่นิยามที่ k = " + qstr(tl.pole) + " (ตัวส่วนเป็นศูนย์) ให้เริ่ม k ที่ค่ามากกว่านี้");
        var pfTex = pf.terms.map(function (t) { return (qsign(t.A) < 0 ? "-" : "+") + "\\dfrac{" + qtex(qabs(t.A)).replace(/\\tfrac/g, "\\frac") + "}{" + ptex([qneg(t.r), Q1], "k") + "}"; }).join(" ").replace(/^\+/, "");
        steps.push("แยกเศษส่วนย่อย (partial fractions): \\(" + ftex + " = " + pfTex + "\\)");
        if (tl.ok) {
          method = "อนุกรมกล้องส่องทางไกล (telescoping) จากเศษส่วนย่อย";
          var show = [];
          var kk = [m, m + 1, m + 2];
          kk.forEach(function (k) { show.push("\\left(" + pf.terms.map(function (t) { var v = qdiv(t.A, qsub(Q(k), t.r)); return (qsign(v) < 0 ? "-" : "+") + qtex(qabs(v)); }).join(" ").replace(/^\+/, "") + "\\right)"); });
          steps.push("เขียนพจน์ออกมาให้เห็นการหักล้าง: \\(" + show.join(" + ") + " + \\cdots\\) ชิ้นส่วนที่ห่างกันเป็นจำนวนเต็มจะหักล้างกันเป็นคู่ เหลือเพียงพจน์หัวและท้าย");
          var closedT = rftex(tl.rf, "n");
          if (sym) {
            html += '<div class="lap-ans">' + D(head + " = " + closedT) + "</div>";
            steps.push("เหลือพจน์ต้น (ค่าคงตัว \\(" + qtex(tl.C) + "\\)) ลบด้วยพจน์ท้ายที่ขึ้นกับ n ⇒ \\(S_n = " + closedT + "\\)");
            var rows2 = []; for (var n2 = m; n2 < m + 4; n2++) { var dsum = Q0; for (var k3 = m; k3 <= n2; k3++) dsum = qadd(dsum, evalQ(tree, { k: Q(k3) })); var fv = qdiv(pevalQ(tl.rf.num, Q(n2)), pevalQ(tl.rf.den, Q(n2))); rows2.push([n2, T(qtex(dsum)), T(qtex(fv)) + (qeq(dsum, fv) ? " ✓" : " ✗")]); }
            steps.push("ตรวจคำตอบ" + tableHtml(["n", "บวกตรง", "จากสูตร"], rows2));
          } else if (inf) {
            html += '<div class="lap-ans">' + D(head + " = " + qtex(tl.C, { big: true })) + '<p class="sc-dec">≈ ' + fmtNum(qnum(tl.C), 12) + "</p></div>";
            steps.push("\\(S_n = " + closedT + "\\) และพจน์ท้ายที่มี n อยู่ในตัวส่วนเข้าใกล้ 0 ⇒ \\(S_\\infty = " + qtex(tl.C) + "\\)");
          } else {
            var v2 = qdiv(pevalQ(tl.rf.num, Q(nNum)), pevalQ(tl.rf.den, Q(nNum)));
            html += '<div class="lap-ans">' + D(head + " = " + qtex(v2, { big: true })) + '<p class="sc-dec">≈ ' + fmtNum(qnum(v2), 12) + "</p></div>";
            steps.push("\\(S_n = " + closedT + "\\) แทน \\(n = " + nNum + "\\)");
          }
          return '<p class="sc-method"><span class="lap-flag ok">วิธี</span> ' + method + "</p>" + html + stepsHtml(steps);
        }
        steps.push("ผลรวมของสัมประสิทธิ์ในกลุ่มเดียวกันไม่เป็นศูนย์ จึงหักล้างไม่หมด เหลือส่วนที่โตแบบอนุกรมฮาร์มอนิก \\(\\sum \\tfrac1k\\)");
        method = "เศษส่วนย่อยที่หักล้างไม่หมด (ไม่ใช่กล้องส่องทางไกล)";
        if (inf) { html += '<div class="lap-ans">' + D(head) + "<p><b>ลู่ออก</b> ส่วนที่เหลือเทียบได้กับอนุกรมฮาร์มอนิก</p></div>"; return '<p class="sc-method"><span class="lap-flag no">วิธี</span> ' + method + "</p>" + html + stepsHtml(steps); }
      } else if (pf && pf.repeated) {
        steps.push("ตัวส่วนมีรากซ้ำ เช่น \\(k^2\\) จึงไม่ยุบแบบกล้องส่องทางไกล");
      }
    }
    // numeric fallback
    if (sym) {
      var rows3 = [], f = SQ.compile(fs, ["k"]).fn, s = 0;
      for (var n3 = m; n3 < m + 8; n3++) { s += f({ k: n3 }); rows3.push([n3, fmtNum(s, 10)]); }
      return '<p class="sc-method"><span class="lap-flag no">วิธี</span> ไม่พบรูปปิดด้วยวิธีในเครื่องมือนี้</p><div class="lap-ans"><p>พจน์นี้ไม่อยู่ในรูปพหุนาม พหุนาม×rᵏ หรือเศษส่วนที่ยุบได้ ลองหาค่าที่ n เป็นตัวเลข หรือใช้ <a href="#em">เครื่องมือผลบวกความแม่นยำสูง</a> สำหรับอนุกรมอนันต์</p></div>' + stepsHtml(steps.concat(["ผลบวกย่อยเชิงตัวเลข" + tableHtml(["n", "Sₙ"], rows3)]));
    }
    if (inf) {
      var c = SQ.compile(fs, ["k"]), em;
      try { em = eulerMaclaurin({ f: c, tree: c.tree, m: m, N: Infinity }); } catch (e) { em = null; }
      var idt = em && !em.integ.unconverged ? identify(em.S) : null;
      if (!em || em.integ.unconverged) return '<p class="sc-method"><span class="lap-flag no">วิธี</span> เชิงตัวเลข</p><div class="lap-ans">' + D(head) + "<p>ประเมินเชิงตัวเลขไม่ได้ อนุกรมนี้อาจลู่ออก ให้ทดสอบด้วย <a href=\"/learn/sequences-and-series/convergence-tests/\">การทดสอบการลู่เข้า</a></p></div>" + stepsHtml(steps);
      return '<p class="sc-method"><span class="lap-flag no">วิธี</span> ไม่มีรูปปิดแบบพหุนามหรือกล้องส่องทางไกล → คำนวณด้วยออยเลอร์–แมคลอริน</p><div class="lap-ans">' + D(head + " \\approx " + texNumF(em.S, 14) + (idt ? " = " + idt : "")) + '<p class="lap-help">ค่าเชิงตัวเลข 14 หลัก' + (idt ? " · ตรงกับค่าคงตัวที่รู้จัก (หลักฐานเชิงตัวเลข ไม่ใช่บทพิสูจน์)" : "") + ' · ดูรายละเอียดใน <a href="#em">เครื่องมือผลบวกความแม่นยำสูง</a></p></div>' + stepsHtml(steps, null, false);
    }
    var direct = null; try { direct = Q0; for (var k4 = m; k4 <= nNum; k4++) direct = qadd(direct, evalQ(tree, { k: Q(k4) })); } catch (e) { if (!e.notExact) throw e; direct = null; }
    if (direct && nNum - m <= 5000) return '<p class="sc-method"><span class="lap-flag no">วิธี</span> บวกตรงทุกพจน์แบบเลขแม่นตรง (ไม่มีรูปปิดในเครื่องมือนี้)</p><div class="lap-ans">' + D(head + " = " + qtex(direct, { big: true })) + '<p class="sc-dec">≈ ' + fmtNum(qnum(direct), 12) + "</p></div>" + stepsHtml(steps);
    var fn = SQ.compile(fs, ["k"]), tot = 0, cc = 0;
    if (nNum - m > 2e6) { var em2 = eulerMaclaurin({ f: fn, tree: fn.tree, m: m, N: nNum }); return '<div class="lap-ans">' + D(head + " \\approx " + texNumF(em2.S, 14)) + "</div>"; }
    for (var k5 = m; k5 <= nNum; k5++) { var y = fn.fn({ k: k5 }) - cc, t2 = tot + y; cc = t2 - tot - y; tot = t2; }
    return '<p class="sc-method"><span class="lap-flag no">วิธี</span> บวกเชิงตัวเลข</p><div class="lap-ans">' + D(head + " \\approx " + texNumF(tot, 14)) + "</div>" + stepsHtml(steps);
  }
  function tableHtml(head, rows, cls) {
    return '<div class="table-wrap"><table class="lap-pt ' + (cls || "") + '"><thead><tr>' + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }

  // ======================================================================= 3. formula finder
  var FD_EX = [
    { l: "2, 6, 12, 20, 30", v: { terms: "2, 6, 12, 20, 30", n0: "1" } },
    { l: "1, 5, 14, 30, 55 (ผลบวกกำลังสอง)", v: { terms: "1, 5, 14, 30, 55, 91", n0: "1" } },
    { l: "3, 10, 29, 66, 127", v: { terms: "3, 10, 29, 66, 127, 218", n0: "1" } },
    { l: "5, 15, 45, 135", v: { terms: "5, 15, 45, 135, 405", n0: "1" } },
    { l: "1, 1, 2, 3, 5, 8, 13", v: { terms: "1, 1, 2, 3, 5, 8, 13, 21", n0: "1" } },
    { l: "1, 2, 6, 24, 120 (แฟกทอเรียล)", v: { terms: "1, 2, 6, 24, 120, 720", n0: "1" } },
    { l: "1, 2, 4, 8, 16, 31 (กับดัก)", v: { terms: "1, 2, 4, 8, 16, 31", n0: "1" } },
    { l: "0, 1, 3, 7, 15, 31", v: { terms: "0, 1, 3, 7, 15, 31, 63", n0: "0" } }
  ];
  function initFind(box) {
    var d = box.dataset;
    var top = '<div class="sc-form">' + field("terms", "พจน์ที่รู้ (คั่นด้วยจุลภาค)", "เช่น 2, 6, 12, 20, 30", d.terms || "2, 6, 12, 20, 30", "sc-wide") + select("n0", "พจน์แรกคือ", [["1", "a₁"], ["0", "a₀"]], d.n0 || "1") + "</div>" +
      '<p class="lap-help">ใส่อย่างน้อย 4 พจน์ (ยิ่งมากยิ่งมั่นใจ) รับเศษส่วน เช่น 1/2</p>' + chips(FD_EX, "data-ex");
    shell(box, top, { share: true });
    function solve(fromPractice) {
      var out = box.querySelector(".sc-out"), v = getVals(box);
      try { out.innerHTML = findHtml(v.terms, parseInt(v.n0, 10) || 0); } catch (e) { out.innerHTML = errHtml(e); if (!e.user && root.console) console.error(e); }
      if (!fromPractice) box.querySelector(".sc-prac").hidden = true;
    }
    function gen() {
      var t = ri(0, 2), terms = [], target = ri(10, 15), ans;
      if (t === 0) { var a = ri(1, 3), b = ri(-4, 4), c = ri(-3, 5); for (var n = 1; n <= 6; n++) terms.push(a * n * n + b * n + c); ans = a * target * target + b * target + c; }
      else if (t === 1) { var a3 = pick([1, 2]), c3 = ri(-2, 3); for (var n3 = 1; n3 <= 6; n3++) terms.push(a3 * n3 * n3 * n3 + c3 * n3); ans = a3 * target * target * target + c3 * target; }
      else { var x = ri(1, 3), y = ri(2, 4); terms = [x, y]; while (terms.length < 7) terms.push(terms[terms.length - 1] + terms[terms.length - 2]); var s = terms.slice(); target = 12; while (s.length < target) s.push(s[s.length - 1] + s[s.length - 2]); ans = s[target - 1]; }
      return { q: "ลำดับ \\(" + terms.join(",\\ ") + ",\\ \\dots\\) (พจน์แรกคือ \\(a_1\\)) จงหา \\(a_{" + target + "}\\)", a: ans, ans: "\\(a_{" + target + "} = " + ans + "\\)", fill: { terms: terms.join(", "), n0: "1" } };
    }
    var startPractice = practicePanel(box, "find", gen, function (p) { setVals(box, p.fill); solve(true); });
    box.addEventListener("click", function (e) {
      var x = e.target.closest("[data-ex]"); if (x) { setVals(box, FD_EX[+x.getAttribute("data-ex")].v); solve(); return; }
      if (e.target.closest("[data-go]")) solve();
      if (e.target.closest("[data-practice]")) startPractice();
      if (e.target.closest("[data-share]")) shareLink(box, getVals(box).terms);
    });
    bindEnter(box, function () { solve(); });
    box._set = function (o) { setVals(box, o); solve(); };
    solve();
  }
  function findHtml(src, n0) {
    var parts = String(src).split(/[,\s;]+/).filter(Boolean);
    var a = parts.map(function (s) { var q = qparse(s); if (!q) throw err("อ่านพจน์ “" + s + "” ไม่ได้ (ใช้จำนวนเต็ม ทศนิยม หรือเศษส่วน)"); return q; });
    if (a.length < 4) throw err("ใส่อย่างน้อย 4 พจน์");
    var idx = function (i) { return "a_{" + (n0 + i) + "}"; };
    var html = "", steps = [], warn = ["พจน์จำนวนจำกัดไม่ได้กำหนดลำดับเพียงหนึ่งเดียว: สูตรที่ได้คือสูตร “ง่ายที่สุด” ที่เข้ากับข้อมูล ในข้อสอบต้องยืนยันด้วยกฎของโจทย์หรือพิสูจน์ (เช่นด้วยอุปนัย)"];
    // difference table
    var rows = diffTable(a);
    var tbl = '<div class="table-wrap"><table class="lap-pt sc-diff"><tbody>' + rows.map(function (r, i) {
      var isC = i > 0 && i === rows.length - 1 && r.length >= 2 && r.every(function (x) { return qeq(x, r[0]); });
      return '<tr' + (isC ? ' class="in"' : "") + "><th>" + (i === 0 ? "aₙ" : "Δ" + (i > 1 ? sup(i) : "")) + "</th>" + r.map(function (x) { return "<td>" + T(qtex(x)) + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
    var fp = findPoly(a, n0);
    if (fp && fp.deg <= a.length - 2) {
      var fact = ptexFactored(fp.poly, "n"), sfact = ptexFactored(fp.spoly, "n");
      html += '<p class="sc-method"><span class="lap-flag ok">พบ</span> พหุนามดีกรี ' + fp.deg + " (ผลต่างอันดับ " + Math.max(fp.deg, 0) + " คงที่" + (fp.conf > 0 ? " · ยืนยันด้วยข้อมูลเกิน " + fp.conf + " ค่า" : "") + ")</p>";
      html += '<div class="lap-ans">' + D("a_n = " + ptex(fp.poly, "n") + (fact && fact !== ptex(fp.poly, "n") ? " = " + fact : "")) +
        D("S_n = \\sum_{k=" + n0 + "}^{n} a_k = " + (sfact || ptex(fp.spoly, "n"))) +
        '<p class="sc-terms">พจน์ถัดไป: ' + T([0, 1, 2].map(function (j) { var n = n0 + a.length + j; return "a_{" + n + "} = " + qtex(pevalQ(fp.poly, Q(n))); }).join(",\\ ")) + "</p></div>";
      steps.push("ตารางผลต่าง (difference table): ลบพจน์ติดกันซ้ำ ๆ จนได้แถวที่คงที่" + tbl);
      steps.push("แถวที่ " + fp.deg + " คงที่ ⇒ \\(a_n\\) เป็นพหุนามดีกรี " + fp.deg + " (เหมือนอนุพันธ์อันดับ " + fp.deg + " ของพหุนามดีกรี " + fp.deg + " เป็นค่าคงที่)");
      var newton = fp.rows.slice(0, fp.deg + 1).map(function (r, j) { var c = r[0]; if (qz(c)) return null; return (j === 0 ? qtex(c) : qtex(c) + "\\binom{n-" + n0 + "}{" + j + "}"); }).filter(Boolean).join(" + ").replace(/\+ -/g, "- ");
      steps.push("สูตรผลต่างเดินหน้าของนิวตัน (Newton forward difference) ใช้ตัวแรกของแต่ละแถว: \\(a_n = \\sum_j \\Delta^j a_{" + n0 + "}\\binom{n-" + n0 + "}{j} = " + newton + "\\)");
      steps.push("กระจายแล้วได้ \\(a_n = " + ptex(fp.poly, "n") + "\\) · ตรวจ: \\(" + [0, 1, 2].map(function (i) { return idx(i) + " = " + qtex(pevalQ(fp.poly, Q(n0 + i))); }).join(",\\ ") + "\\) ✓");
      steps.push("ผลบวก n พจน์ใช้ตัวแรกของแต่ละแถวเช่นกัน: \\(S_n = \\sum_j \\Delta^j a_{" + n0 + "}\\binom{n-" + (n0 - 1) + "}{j+1} = " + ptex(fp.spoly, "n") + "\\)");
      return html + warnHtml(warn) + stepsHtml(steps);
    }
    // geometric
    var nz = a.every(function (x) { return !qz(x); });
    if (nz) {
      var r = qdiv(a[1], a[0]), geo = a.every(function (x, i) { return i === 0 || qeq(qdiv(x, a[i - 1]), r); });
      if (geo) {
        html = '<p class="sc-method"><span class="lap-flag ok">พบ</span> ลำดับเรขาคณิต อัตราส่วนร่วม ' + T("r = " + qtex(r)) + "</p>";
        var gt = (qeq(a[0], Q1) ? "" : qtex(a[0]) + "\\cdot ") + rtex(r) + "^{n" + (n0 ? "-" + n0 : "") + "}";
        var nxt = [0, 1, 2].map(function (j) { var n = n0 + a.length + j; return "a_{" + n + "} = " + qtex(qmul(a[0], qpow(r, n - n0))); }).join(",\\ ");
        html += '<div class="lap-ans">' + D("a_n = " + gt) + (qeq(r, Q1) ? "" : D("S_n = \\dfrac{" + qtex(a[0]) + "\\left(1 - " + rtex(r) + "^{N}\\right)}{1 - " + rtex(r) + "},\\quad N = n" + (n0 === 0 ? " + 1" : ""))) + '<p class="sc-terms">พจน์ถัดไป: ' + T(nxt) + "</p></div>";
        steps.push("อัตราส่วนพจน์ติดกันคงที่: \\(" + a.slice(1, 4).map(function (x, i) { return "\\tfrac{" + qtex(x).replace(/\\tfrac/g, "\\frac") + "}{" + qtex(a[i]).replace(/\\tfrac/g, "\\frac") + "}"; }).join(" = ") + " = " + qtex(r) + "\\)");
        return html + warnHtml(warn) + stepsHtml(steps);
      }
    }
    // hypergeometric: ratio is a polynomial (deg ≤ 2) in n
    if (nz && a.length >= 5) {
      var ratios = a.slice(1).map(function (x, i) { return qdiv(x, a[i]); });
      var rp = findPoly(ratios, n0 + 1);
      if (rp && rp.deg >= 1 && rp.deg <= 2 && rp.deg <= ratios.length - 2) {
        var q = rp.poly;
        html += '<p class="sc-method"><span class="lap-flag ok">พบ</span> อัตราส่วนพจน์ติดกันเป็นพหุนามใน n (ลำดับแบบผลคูณ หรือ hypergeometric)</p>';
        var prodT = "a_n = " + qtex(a[0]) + "\\prod_{j=" + (n0 + 1) + "}^{n} \\left(" + ptex(q, "j") + "\\right)";
        var special = "";
        if (qeq(a[0], Q1) && n0 === 1 && q.length === 2 && qz(q[0]) && qeq(q[1], Q1)) special = " = n!";
        if (n0 === 0 && qeq(a[0], Q1) && q.length === 2 && qz(q[0]) && qeq(q[1], Q1)) special = " = n!";
        var nxt2 = [], last = a[a.length - 1];
        for (var j = 0; j < 3; j++) { var nn = n0 + a.length + j; last = qmul(last, pevalQ(q, Q(nn))); nxt2.push("a_{" + nn + "} = " + qtex(last)); }
        html += '<div class="lap-ans">' + D("\\frac{a_n}{a_{n-1}} = " + ptex(q, "n")) + D(prodT + special) + '<p class="sc-terms">พจน์ถัดไป: ' + T(nxt2.join(",\\ ")) + "</p></div>";
        steps.push("ผลต่างไม่คงที่และอัตราส่วนไม่คงที่ จึงลองดูอัตราส่วน \\(a_n/a_{n-1}\\): " + T(ratios.map(qtex).join(",\\ ")));
        steps.push("ใช้ตารางผลต่างกับอัตราส่วนเหล่านี้ พบว่าเป็นพหุนาม \\(" + ptex(q, "n") + "\\) จึงได้ \\(a_n = a_{n-1}\\cdot(" + ptex(q, "n") + ")\\) แล้วคูณไล่ลงมา");
        return html + warnHtml(warn) + stepsHtml(steps);
      }
    }
    // linear recurrence (Berlekamp–Massey)
    var bm = berlekamp(a);
    if (bm.L >= 1 && bm.L <= 3 && a.length >= 2 * bm.L + 2) {
      var recT = "a_n = " + bm.c.map(function (c, i) { if (qz(c)) return null; var s = qeq(c, Q1) ? "" : qeq(c, qneg(Q1)) ? "-" : qtex(c); return s + "a_{n-" + (i + 1) + "}"; }).filter(Boolean).join(" + ").replace(/\+ -/g, "- ");
      var nxt3 = a.slice(), out3 = [];
      for (var t = 0; t < 3; t++) { var v = Q0; for (var i = 1; i <= bm.L; i++) v = qadd(v, qmul(bm.c[i - 1], nxt3[nxt3.length - i])); nxt3.push(v); out3.push("a_{" + (n0 + nxt3.length - 1) + "} = " + qtex(v)); }
      var setRec = JSON.stringify({ rhs: bm.c.map(function (c, i) { return qz(c) ? null : "(" + qstr(c) + ")a(n-" + (i + 1) + ")"; }).filter(Boolean).join(" + "), init: a.slice(0, bm.L).map(qstr).join(", "), n0: String(n0) });
      html += '<p class="sc-method"><span class="lap-flag ok">พบ</span> ความสัมพันธ์เวียนเกิดเชิงเส้นอันดับ ' + bm.L + " (อัลกอริทึม Berlekamp–Massey)</p>";
      html += '<div class="lap-ans">' + D(recT) + '<p class="sc-terms">พจน์ถัดไป: ' + T(out3.join(",\\ ")) + '</p><button type="button" class="btn btn-ghost btn-sm" data-sc-target="calc-rec" data-sc-set=\'' + esc(setRec) + "'>หาสูตรปิดด้วยเครื่องแก้ความสัมพันธ์เวียนเกิด →</button></div>";
      steps.push("ตารางผลต่างไม่คงที่ และอัตราส่วนไม่คงที่" + tbl);
      steps.push("หาความสัมพันธ์เชิงเส้นที่สั้นที่สุด \\(a_n = c_1a_{n-1} + \\dots + c_La_{n-L}\\) ที่เข้ากับทุกพจน์ ได้ \\(L = " + bm.L + "\\) และตรวจกับข้อมูลที่เหลืออีก " + (a.length - 2 * bm.L) + " พจน์แล้ว");
      return html + warnHtml(warn) + stepsHtml(steps);
    }
    html += '<p class="sc-method"><span class="lap-flag no">ไม่พบ</span> รูปแบบพหุนาม เรขาคณิต ผลคูณ หรือเวียนเกิดอันดับ ≤ 3 จากข้อมูลชุดนี้</p>';
    steps.push("ตารางผลต่าง" + tbl);
    if (fp && fp.deg > a.length - 2) steps.push("ผลต่างคงที่เพียงค่าเดียวยังสรุปไม่ได้ ต้องการข้อมูลเพิ่มอย่างน้อยหนึ่งพจน์");
    steps.push("ลองเพิ่มพจน์ ตรวจว่าเป็นผลรวม/ผลคูณของสองลำดับ หรือเป็นลำดับเลขโดดพิเศษ (จำนวนเฉพาะ จำนวนสามเหลี่ยม ฯลฯ)");
    return html + warnHtml(warn) + stepsHtml(steps);
  }
  function sup(i) { return String(i).split("").map(function (c) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]; }).join(""); }

  // ======================================================================= 4. linear recurrence solver
  var RC_EX = [
    { l: "ฟีโบนัชชี Fₙ = Fₙ₋₁ + Fₙ₋₂", v: { rhs: "a(n-1) + a(n-2)", init: "0, 1", n0: "0" } },
    { l: "aₙ = 5aₙ₋₁ − 6aₙ₋₂", v: { rhs: "5a(n-1) - 6a(n-2)", init: "1, 4", n0: "0" } },
    { l: "รากซ้ำ aₙ = 4aₙ₋₁ − 4aₙ₋₂", v: { rhs: "4a(n-1) - 4a(n-2)", init: "1, 4", n0: "0" } },
    { l: "รากเชิงซ้อน aₙ = 2aₙ₋₁ − 2aₙ₋₂", v: { rhs: "2a(n-1) - 2a(n-2)", init: "1, 2", n0: "0" } },
    { l: "หอคอยฮานอย aₙ = 2aₙ₋₁ + 1", v: { rhs: "2a(n-1) + 1", init: "1", n0: "1" } },
    { l: "aₙ = aₙ₋₁ + n (เรโซแนนซ์)", v: { rhs: "a(n-1) + n", init: "1", n0: "1" } },
    { l: "aₙ = 3aₙ₋₁ − 2aₙ₋₂ + 2ⁿ", v: { rhs: "3a(n-1) - 2a(n-2) + 2^n", init: "0, 1", n0: "0" } },
    { l: "อันดับสาม 2,1,−2", v: { rhs: "2a(n-1) + a(n-2) - 2a(n-3)", init: "3, 2, 6", n0: "0" } },
    { l: "ไตรโบนัชชี (รากไม่เป็นตรรกยะ)", v: { rhs: "a(n-1) + a(n-2) + a(n-3)", init: "0, 0, 1", n0: "0" } },
    { l: "ไลบ์นิซ aₙ = −aₙ₋₁ + 3", v: { rhs: "-a(n-1) + 3", init: "1", n0: "1" } }
  ];
  function initRec(box) {
    var d = box.dataset;
    var top = '<div class="sc-form">' + field("rhs", "aₙ =", "เช่น 5a(n-1) - 6a(n-2) + 2^n", d.rhs || "a(n-1) + a(n-2)", "sc-wide") + field("init", "ค่าเริ่มต้น (คั่นด้วยจุลภาค)", "เช่น 0, 1", d.init || "0, 1") + select("n0", "เริ่มที่", [["0", "a₀"], ["1", "a₁"]], d.n0 || "0") + "</div>" +
      '<p class="lap-help">พิมพ์พจน์ก่อนหน้าเป็น <code>a(n-1)</code>, <code>a(n-2)</code>, <code>a(n-3)</code> สัมประสิทธิ์คงที่ และเติมพจน์ไม่เอกพันธ์ได้ เช่น <code>+ 3</code>, <code>+ n^2</code>, <code>+ 2^n</code>, <code>+ n*3^n</code></p>' + chips(RC_EX, "data-ex");
    shell(box, top, { share: true });
    function solve(fromPractice) {
      var out = box.querySelector(".sc-out"), v = getVals(box);
      try { out.innerHTML = recHtml(v.rhs, v.init, parseInt(v.n0, 10) || 0); } catch (e) { out.innerHTML = errHtml(e); if (!e.user && root.console) console.error(e); }
      if (!fromPractice) box.querySelector(".sc-prac").hidden = true;
    }
    function gen() {
      var t = ri(0, 2), rhs, init, n0 = 0, target = ri(9, 12), ans;
      if (t === 0) { var r1 = pick([2, 3, -1, 4]), r2 = pick([1, -2, 2, -3]); if (r1 === r2) r2 = r1 === 2 ? -1 : 2; var p = r1 + r2, q = -r1 * r2; rhs = p + "a(n-1) " + (q < 0 ? "- " + (-q) : "+ " + q) + "a(n-2)"; init = [ri(0, 3), ri(1, 5)]; }
      else if (t === 1) { var rr = pick([2, 3, -2]); rhs = 2 * rr + "a(n-1) - " + rr * rr + "a(n-2)"; init = [ri(1, 3), ri(1, 6)]; }
      else { var c = pick([2, 3]), k = pick([1, 2, -1]); rhs = c + "a(n-1) " + (k < 0 ? "- " + (-k) : "+ " + k); init = [ri(0, 3)]; n0 = 1; target = ri(8, 10); }
      var pr = parseRecRHS(rhs), res = solveRecurrence({ c: pr.c, forcing: pr.forcing, init: init.map(function (x) { return Q(x); }), n0: n0, count: target + 2 });
      ans = res.terms[target - n0];
      return { q: "กำหนด \\(a_n = " + recTex(pr) + "\\) โดย " + init.map(function (x, i) { return "\\(a_{" + (n0 + i) + "} = " + x + "\\)"; }).join(", ") + " จงหา \\(a_{" + target + "}\\) (ใช้สูตรปิดหรือไล่ทีละพจน์ก็ได้)", a: qnum(ans), ans: "\\(a_{" + target + "} = " + qtex(ans) + "\\)", fill: { rhs: rhs, init: init.join(", "), n0: String(n0) } };
    }
    var startPractice = practicePanel(box, "rec", gen, function (p) { setVals(box, p.fill); solve(true); });
    box.addEventListener("click", function (e) {
      var x = e.target.closest("[data-ex]"); if (x) { setVals(box, RC_EX[+x.getAttribute("data-ex")].v); solve(); return; }
      if (e.target.closest("[data-go]")) solve();
      if (e.target.closest("[data-practice]")) startPractice();
      if (e.target.closest("[data-share]")) { var v = getVals(box); var ini = v.init.split(/[,\s]+/).filter(Boolean).map(function (x, i) { return "a(" + ((parseInt(v.n0, 10) || 0) + i) + ")=" + x; }).join(", "); shareLink(box, "a(n)=" + v.rhs + ", " + ini); }
    });
    bindEnter(box, function () { solve(); });
    box._set = function (o) { setVals(box, o); solve(); };
    solve();
  }
  function recTex(pr) {
    var s = pr.c.map(function (c, i) { if (qz(c)) return null; var t = qeq(c, Q1) ? "" : qeq(c, qneg(Q1)) ? "-" : qtex(c); return t + "a_{n-" + (i + 1) + "}"; }).filter(Boolean).join(" + ");
    if (pr.forcing.length) s += " + " + epTex(pr.forcing, "n");
    return s.replace(/\+ -/g, "- ") || "0";
  }
  function recHtml(rhs, initS, n0) {
    var pr = parseRecRHS(rhs), k = pr.c.length;
    if (k === 0) throw err("ต้องมีพจน์ a(n-1) อย่างน้อยหนึ่งพจน์");
    var init = String(initS).split(/[,\s;]+/).filter(Boolean).map(function (s) { var q = qparse(s); if (!q) throw err("ค่าเริ่มต้น “" + s + "” ต้องเป็นจำนวนตรรกยะ"); return q; });
    if (init.length < k) throw err("อันดับ " + k + " ต้องมีค่าเริ่มต้น " + k + " ค่า (" + [0, 1, 2].slice(0, k).map(function (i) { return "a" + sub(n0 + i); }).join(", ") + ")");
    init = init.slice(0, k);
    var res = solveRecurrence({ c: pr.c, forcing: pr.forcing, init: init, n0: n0, count: 16 });
    var steps = [], html = "", F = res.F;
    var eqT = "a_n = " + recTex(pr) + ",\\quad " + init.map(function (x, i) { return "a_{" + (n0 + i) + "} = " + qtex(x); }).join(",\\ ");
    // 1 characteristic equation
    var cpT = ptex(res.cp, "t") + " = 0";
    steps.push("สมการลักษณะเฉพาะ (characteristic equation): ลองคำตอบรูป \\(a_n = t^n\\) ในส่วนเอกพันธ์ \\(a_n = " + recTex({ c: pr.c, forcing: [] }) + "\\) ⇒ \\(" + cpT + "\\)" + (ptexFactored(res.cp, "t") ? " ⇒ \\(" + ptexFactored(res.cp, "t") + " = 0\\)" : ""));
    if (res.CR.numeric) {
      var zr = res.numRoots;
      steps.push("พหุนามดีกรีสามนี้ไม่มีรากตรรกยะ จึงหารากเชิงตัวเลข: \\(t \\approx " + zr.map(function (z) { return cTex(z); }).join(",\\ ") + "\\)");
      var basisT = zr.map(function (z, i) { return "C_{" + (i + 1) + "}(" + cTex(z) + ")^n"; }).join(" + ");
      steps.push("คำตอบทั่วไป \\(a_n = " + basisT + (res.part.length ? " + a_n^{(p)}" : "") + "\\) แล้วแก้ระบบสมการจากค่าเริ่มต้น ได้ \\(" + res.numConst.map(function (z, i) { return "C_{" + (i + 1) + "} \\approx " + cTex(z); }).join(",\\ ") + "\\)");
      var dom = zr.reduce(function (b, z) { return Math.hypot(z[0], z[1]) > Math.hypot(b[0], b[1]) ? z : b; }, zr[0]);
      var dIdx = zr.indexOf(dom);
      var partT = res.part.length ? " + " + res.part.map(function (p) { return epTex([{ r: p.r, p: p.p }], "n"); }).join(" + ") : "";
      html += '<p class="sc-method"><span class="lap-flag no">รากไม่เป็นตรรกยะ</span> สูตรปิดเป็นค่าประมาณ (ทศนิยม)</p><div class="lap-ans">' + D(eqT) +
        D("a_n \\approx " + zr.map(function (z, i) { return "(" + cTex(res.numConst[i]) + ")(" + cTex(z) + ")^n"; }).join(" + ") + partT) +
        "<p>เมื่อ n ใหญ่ " + T("a_n \\approx (" + cTex(res.numConst[dIdx]) + ")\\cdot(" + cTex(dom) + ")^n") + " (รากที่มีขนาดใหญ่ที่สุดครอบงำ)</p></div>";
      var rowsN = res.terms.slice(0, 10).map(function (t, i) { var n = n0 + i, v = 0; res.basisN.forEach(function (b, j) { var p = cmul(res.numConst[j], cpow(b.z, n)); v += p[0]; }); v += qnum(res.partAt(n)); return [n, T(qtex(t)), fmtNum(v, 10)]; });
      steps.push("ตรวจ: พจน์จากการไล่ความสัมพันธ์เทียบกับสูตรประมาณ" + tableHtml(["n", "aₙ", "สูตร (ประมาณ)"], rowsN));
      return html + stepsHtml(steps);
    }
    // roots
    var rootsT = res.CR.roots.map(function (rt) { return "t = " + F.tex(rt.x) + (rt.m > 1 ? "\\ (\\text{ซ้ำ } " + rt.m + "\\text{ ครั้ง})" : ""); }).join(",\\quad ");
    steps.push("ราก: \\(" + rootsT + "\\)" + (res.CR.quad ? " (สูตรกำลังสอง ดิสคริมิแนนต์ \\(" + qtex(res.CR.quad.disc) + "\\)" + (qsign(res.CR.quad.disc) < 0 ? " &lt; 0 ⇒ รากเชิงซ้อนสังยุค" : "") + ")" : ""));
    var bT = res.basis.map(function (b, i) { return "C_{" + (i + 1) + "}" + (b.j ? (b.j === 1 ? "n" : "n^{" + b.j + "}") : "") + "\\left(" + F.tex(b.x) + "\\right)^{n}"; }).join(" + ").replace(/\\left\((\d+)\\right\)/g, "$1");
    steps.push("คำตอบเอกพันธ์ (homogeneous): " + (res.basis.some(function (b) { return b.j; }) ? "รากซ้ำ m ครั้งให้ \\(t^n, nt^n, \\dots, n^{m-1}t^n\\) · " : "") + "\\(a_n^{(h)} = " + bT + "\\)");
    if (res.part.length) {
      var pT = res.part.map(function (p) { return epTex([{ r: p.r, p: p.p }], "n"); }).join(" + ").replace(/\+ -/g, "- ");
      var notes = res.part.map(function (p) { return p.m ? "\\(" + qtex(p.r) + "\\) เป็นรากของสมการลักษณะเฉพาะ " + p.m + " ครั้ง จึงคูณการเดาด้วย \\(n^{" + p.m + "}\\) (เรโซแนนซ์)" : null; }).filter(Boolean);
      steps.push("คำตอบเฉพาะ (particular) ด้วยวิธีเดาสัมประสิทธิ์ (undetermined coefficients) ตามรูปของ \\(f(n) = " + epTex(pr.forcing, "n") + "\\): " + (notes.length ? notes.join(" · ") + " · " : "") + "แทนลงสมการแล้วเทียบสัมประสิทธิ์ ได้ \\(a_n^{(p)} = " + pT + "\\)");
    }
    var cT = res.consts.map(function (c, i) { return "C_{" + (i + 1) + "} = " + F.tex(c); }).join(",\\ ");
    steps.push("หาค่าคงตัวจากค่าเริ่มต้น " + init.map(function (x, i) { return "\\(a_{" + (n0 + i) + "} = " + qtex(x) + "\\)"; }).join(", ") + " (ระบบสมการเชิงเส้น " + k + " ตัวแปร) ได้ \\(" + cT + "\\)");
    // closed form
    var terms = [];
    res.basis.forEach(function (b, i) {
      var c = res.consts[i]; if (F.zero(c)) return;
      var base = F.isQ(b.x) ? rtex(b.x.a) : "\\left(" + F.tex(b.x) + "\\right)";
      var nj = b.j ? (b.j === 1 ? "n" : "n^{" + b.j + "}") : "";
      var isOne = F.isQ(b.x) && qeq(b.x.a, Q1);
      var ct = F.isQ(c) ? qtex(c.a) : "\\left(" + F.tex(c) + "\\right)";
      if (F.isQ(c) && qeq(c.a, Q1) && (nj || !isOne)) ct = "";
      if (F.isQ(c) && qeq(c.a, qneg(Q1)) && (nj || !isOne)) ct = "-";
      var pw = isOne ? "" : base + "^{n}";
      var head = ct + nj;
      // 2·3ⁿ, 2n·3ⁿ: a number written next to a numeric base needs a dot
      if (pw && head && head !== "-" && /^[0-9]/.test(pw)) head += "\\cdot ";
      terms.push(head + pw);
    });
    res.part.forEach(function (p) { terms.push(epTex([{ r: p.r, p: p.p }], "n")); });
    var closed = terms.filter(function (t) { return t !== ""; }).join(" + ").replace(/\+ -/g, "- ") || "0";
    closed = closed.replace(/(^|[ +-])1\^\{n\}/g, "$1");
    html += '<p class="sc-method"><span class="lap-flag ok">สูตรปิด</span> ' + (res.CR.D && res.CR.D < BigInt(0) ? "รากเชิงซ้อน" : res.CR.D ? "รากอตรรกยะ (เขียนเป็นกรณฑ์แม่นตรง)" : "รากตรรกยะ ค่าคงตัวเป็นเศษส่วนแม่นตรง") + "</p>";
    html += '<div class="lap-ans">' + D(eqT) + DL("a_n", terms.filter(function (t) { return t !== ""; }).map(function (t) { return t.replace(/(^|[ +-])1\^\{n\}/g, "$1"); }));
    // complex → real form
    if (res.CR.D && res.CR.D < BigInt(0)) {
      var rts = res.basis.filter(function (b) { return b.root.conj === 1; })[0];
      var idx = res.basis.indexOf(rts), Cc = res.consts[idx];
      var z = F.num(rts.x), rmod = Math.hypot(z[0], z[1]), th = Math.atan2(z[1], z[0]);
      var cz = F.num(Cc), Ar = 2 * cz[0], Br = -2 * cz[1];
      var r2 = qadd(qmul(rts.x.a, rts.x.a), qmul(Q(-res.CR.D), qmul(rts.x.b, rts.x.b)));
      var rT = sqrtTex(r2), thT = piTex(th);
      html += D("a_n = " + (rT === "1" ? "" : "\\left(" + rT + "\\right)^{n}") + "\\left(" + texNumF(Ar, 8) + "\\cos " + thT + " " + (Br < 0 ? "-" : "+") + " " + texNumF(Math.abs(Br), 8) + "\\sin " + thT + "\\right)");
      steps.push("รากเชิงซ้อน \\(t = re^{\\pm i\\theta}\\) โดย \\(r = |t| = " + rT + ",\\ \\theta = " + thT.replace("n", "") + "\\) รวมคู่สังยุคเป็นรูปจริง \\(r^n(A\\cos n\\theta + B\\sin n\\theta)\\) เมื่อ \\(A = 2\\operatorname{Re}C_1,\\ B = -2\\operatorname{Im}C_1\\)");
    }
    html += "</div>";
    // verification
    var rows = res.terms.slice(0, 10).map(function (t, i) {
      var n = n0 + i, cv = res.closedAt(n), ok = F.isQ(cv) ? qeq(cv.a, t) : Math.abs(F.num(cv)[0] - qnum(t)) < 1e-9 * Math.max(1, Math.abs(qnum(t)));
      return [n, T(qtex(t)), (F.isQ(cv) ? T(qtex(cv.a)) : fmtNum(F.num(cv)[0], 12)) + (ok ? " ✓" : " ✗")];
    });
    steps.push("ตรวจ: ไล่ความสัมพันธ์ทีละพจน์ (เลขแม่นตรง) เทียบกับสูตรปิด" + tableHtml(["n", "aₙ จากความสัมพันธ์", "จากสูตรปิด"], rows));
    // generating function
    var gfT = "G(x) = \\sum_{j\\ge 0} a_{" + (n0 ? "j+1" : "j") + "}x^{j} = \\dfrac{" + ptexAsc(res.gf.num, "x") + "}{" + ptexAsc(res.gf.den, "x") + "}";
    var gf = '<div class="sc-adv"><p class="lap-bh">ฟังก์ชันก่อกำเนิด (generating function) <span class="lv lv-a">ขั้นสูง</span></p>' + D(gfT) + '<p class="lap-help">ตัวส่วนคือพหุนามลักษณะเฉพาะเขียนกลับด้าน' + (res.part.length ? " คูณด้วยตัวทำลายของ f(n)" : "") + " · แยกเศษส่วนย่อยแล้วกระจายเป็นอนุกรมเรขาคณิตจะได้สูตรปิดเดียวกัน</p></div>";
    // proof by strong induction
    var proof = proofHtml(res, pr, init, n0, closed);
    return html + stepsHtml(steps) + gf + proof;
  }
  function sub(i) { return String(i).split("").map(function (c) { return "₀₁₂₃₄₅₆₇₈₉"[+c]; }).join(""); }
  function cTex(z) { var re = texNumF(z[0], 7), im = Math.abs(z[1]); if (!im) return re; return re + (z[1] < 0 ? " - " : " + ") + texNumF(im, 7) + "i"; }
  function sqrtTex(q) { var ex = exactRoot(q, 2); if (ex) return qtex(ex[0]); var sf = squarefree(q.n * q.d), s = Q(sf[0], q.d); return (qeq(s, Q1) ? "" : qtex(s)) + "\\sqrt{" + sf[1].toString() + "}"; }
  function piTex(th) {
    for (var q = 1; q <= 12; q++) { var p = Math.round(th / Math.PI * q); if (Math.abs(th - p * Math.PI / q) < 1e-9 && p) { var g = gcdN(Math.abs(p), q); p /= g; var qq = q / g; return (qq === 1 ? (p === 1 ? "" : p === -1 ? "-" : p) + "n\\pi" : "\\tfrac{" + (p === 1 ? "" : p === -1 ? "-" : p) + "n\\pi}{" + qq + "}"); } }
    return "(" + texNumF(th, 8) + "n)";
  }
  function gcdN(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function proofHtml(res, pr, init, n0, closed) {
    var k = res.k, F = res.F, P = [];
    var nb = [];
    for (var i = 0; i < k; i++) nb.push(n0 + i);
    P.push("ให้ \\(P(n)\\) แทนข้อความ “\\(a_n = " + closed + "\\)” ต้องการพิสูจน์ว่า \\(P(n)\\) จริงทุก \\(n \\ge " + n0 + "\\)");
    P.push("<b>กรณีฐาน</b> (ต้องมี " + k + " กรณี เพราะความสัมพันธ์ย้อนกลับไป " + k + " ขั้น): " + nb.map(function (n) { var cv = res.closedAt(n); return "\\(n = " + n + "\\): สูตรให้ \\(" + (F.isQ(cv) ? qtex(cv.a) : F.tex(cv)) + " = a_{" + n + "}\\) ✓"; }).join(" · "));
    P.push("<b>สมมติฐานอุปนัยแบบเข้ม</b>: ให้ \\(n \\ge " + (n0 + k) + "\\) และสมมติว่า \\(P(j)\\) จริงทุก \\(" + n0 + " \\le j \\le n - 1\\) โดยเฉพาะ \\(" + [1, 2, 3].slice(0, k).map(function (j) { return "P(n-" + j + ")"; }).join(", ") + "\\)");
    var homo = res.basis.map(function (b) { return F.isQ(b.x) ? qtex(b.x.a) : F.tex(b.x); });
    P.push("<b>ขั้นอุปนัย</b>: \\(a_n = " + recTex(pr) + "\\) แทนสูตรของ \\(" + [1, 2, 3].slice(0, k).map(function (j) { return "a_{n-" + j + "}"; }).join(", ") + "\\) จากสมมติฐาน แต่ละพจน์ \\(t^n\\) ของคำตอบเอกพันธ์ (\\(t = " + homo.filter(function (x, i) { return homo.indexOf(x) === i; }).join(",\\ ") + "\\)) สอดคล้อง \\(t^n - " + res.c.map(function (c, j) { return (j === 0 ? "" : "") + "(" + qtex(c) + ")t^{n-" + (j + 1) + "}"; }).join(" - ") + " = t^{n-" + k + "}\\chi(t) = 0\\) เพราะ \\(t\\) เป็นรากของ \\(\\chi\\)" + (res.basis.some(function (b) { return b.j; }) ? " (พจน์ \\(nt^n\\) ของรากซ้ำใช้ \\(\\chi'(t) = 0\\) ด้วย)" : "") + (res.part.length ? " และ \\(a_n^{(p)}\\) ถูกสร้างให้สอดคล้องความสัมพันธ์ที่มี f(n) พอดี" : "") + " ดังนั้นผลรวมได้ \\(" + closed + "\\) คือ \\(P(n)\\) จริง");
    P.push("โดยหลักอุปนัยแบบเข้ม \\(P(n)\\) จริงทุก \\(n \\ge " + n0 + "\\) ∎");
    return '<details class="sc-steps sc-proof"><summary>พิสูจน์สูตรด้วยอุปนัยแบบเข้ม (strong induction)</summary><ol class="lap-steps">' + P.map(function (s) { return "<li><p>" + rich(s) + "</p></li>"; }).join("") + '</ol><p class="lap-help">ดูหลักการและตัวอย่างอีกมากที่ <a href="/learn/sequences-and-series/strong-induction/">อุปนัยแบบเข้ม (26.12)</a></p></details>';
  }

  // ======================================================================= 5. high-precision sums
  var EM_EX = [
    { l: "Σ 1/k² = π²/6", v: { mode: "em", f: "1/k^2", m: "1", n: "inf" } },
    { l: "Σ 1/k³ = ζ(3)", v: { mode: "em", f: "1/k^3", m: "1", n: "inf" } },
    { l: "Σ 1/k^1.5", v: { mode: "em", f: "1/k^1.5", m: "1", n: "inf" } },
    { l: "Hₙ, n = 10¹²", v: { mode: "em", f: "1/k", m: "1", n: "1e12" } },
    { l: "Σ √k ถึง 10⁹", v: { mode: "em", f: "sqrt(k)", m: "1", n: "1e9" } },
    { l: "Σ 1/(k ln²k)", v: { mode: "em", f: "1/(k*ln(k)^2)", m: "2", n: "inf" } },
    { l: "Σ 1/k (ลู่ออก)", v: { mode: "em", f: "1/k", m: "1", n: "inf" } },
    { l: "สลับ: 1 − ½ + ⅓ − … = ln 2", v: { mode: "alt", f: "1/k", m: "1", n: "inf" } },
    { l: "สลับ: 1 − ⅓ + ⅕ − … = π/4", v: { mode: "alt", f: "1/(2k-1)", m: "1", n: "inf" } },
    { l: "สลับ: 1/k² ⇒ π²/12", v: { mode: "alt", f: "1/k^2", m: "1", n: "inf" } }
  ];
  function initEM(box) {
    var d = box.dataset, st = { mode: d.mode || "em" };
    var top = '<div class="lap-chips sc-modes"><button type="button" class="lap-chip" data-m="em">อนุกรมพจน์บวก (ออยเลอร์–แมคลอริน)</button><button type="button" class="lap-chip" data-m="alt">อนุกรมสลับ (CVZ)</button></div>' +
      '<div class="sc-form sc-form-sigma">' + field("f", "พจน์ f(k) / bₖ", "เช่น 1/k^2", d.f || "1/k^2", "sc-wide") + field("m", "จาก k =", "1", d.m || "1", "sc-sm") + field("n", "ถึง", "inf หรือ 1e12", d.n || "inf", "sc-sm") + "</div>" +
      '<p class="lap-help sc-emhelp"></p>' + chips(EM_EX, "data-ex");
    shell(box, top, { practice: false });
    function modeUI() {
      $$("[data-m]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-m") === st.mode); });
      box.querySelector(".sc-emhelp").innerHTML = st.mode === "em" ? "f(k) ต้องเรียบและเป็นบวกช่วงท้าย ขอบบนเป็นตัวเลขใหญ่มากได้ (เช่น <code>1e15</code>) หรือ <code>inf</code>" : "พิมพ์ส่วนบวก bₖ ของอนุกรม " + T("b_m - b_{m+1} + b_{m+2} - \\cdots") + " (bₖ ลดลงสู่ 0) เครื่องมือเร่งการลู่เข้าแบบ Cohen–Villegas–Zagier";
    }
    function solve() {
      var out = box.querySelector(".sc-out"), v = getVals(box);
      try { out.innerHTML = st.mode === "em" ? emHtml(v.f, v.m, v.n) : cvzHtml(v.f, v.m); } catch (e) { out.innerHTML = errHtml(e); if (!e.user && root.console) console.error(e); }
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]"); if (m) { st.mode = m.getAttribute("data-m"); modeUI(); solve(); return; }
      var x = e.target.closest("[data-ex]"); if (x) { var ex = EM_EX[+x.getAttribute("data-ex")].v; st.mode = ex.mode; setVals(box, ex); modeUI(); solve(); return; }
      if (e.target.closest("[data-go]")) solve();
    });
    bindEnter(box, solve);
    box._set = function (o) { if (o.mode) st.mode = o.mode; setVals(box, o); modeUI(); solve(); };
    modeUI(); solve();
  }
  function emHtml(fs, ms, ns) {
    var m = parseInt(ms, 10); if (!isFinite(m)) throw err("ขอบล่างต้องเป็นจำนวนเต็ม");
    var inf = /^(inf|∞|infinity)$/i.test(String(ns).trim()), Nn = inf ? Infinity : Number(String(ns).replace(/\s/g, ""));
    if (!inf && (!isFinite(Nn) || Nn < m || Math.floor(Nn) !== Nn)) throw err("ขอบบนต้องเป็นจำนวนเต็ม ≥ ขอบล่าง หรือ inf");
    var c = SQ.compile(fs, ["k"]), f = function (x) { return c.fn({ k: x }); };
    var M = m + 10;
    for (var k = m; k <= M + 2; k++) if (!isFinite(f(k))) throw err("f(" + k + ") ไม่นิยาม ให้เริ่ม k ที่ค่าอื่น");
    var em = eulerMaclaurin({ f: c, tree: c.tree, m: m, N: Nn, M: M, p: 6 });
    var head = "\\sum_{k=" + m + "}^{" + (inf ? "\\infty" : texNumF(Nn, 12)) + "} " + c.tex;
    if (em.direct) return '<div class="lap-ans">' + D(head + " \\approx " + texNumF(em.S, 15)) + '<p class="lap-help">มีเพียง ' + em.terms + " พจน์ จึงบวกตรงทั้งหมด</p></div>";
    if (inf && em.integ.unconverged) {
      var xf = Math.abs(1e8 * f(1e8));
      return '<div class="lap-ans">' + D(head) + "<p><b>" + (xf > 1e-3 ? "ลู่ออก" : "ลู่ออกหรือลู่เข้าช้าเกินกว่าจะคำนวณ") + "</b>: ปริพันธ์ " + T("\\int_{" + M + "}^{\\infty} f(x)\\,dx") + " ไม่ลู่เข้าในช่วงที่คำนวณได้" + (xf > 1e-3 ? " (เพราะ " + T("x f(x)") + " ไม่เข้าใกล้ 0 จึงเทียบได้กับ " + T("\\sum 1/k") + ")" : "") + " ตามการทดสอบด้วยปริพันธ์ อนุกรมพจน์บวกที่ลดลงลู่เข้าก็ต่อเมื่อปริพันธ์ลู่เข้า</p></div>";
    }
    var idt = inf ? identify(em.S) : null;
    var naive = 0; for (var k2 = m; k2 < M; k2++) naive += f(k2);
    var big = 0, cnt = inf ? 100000 : Math.min(Nn - m + 1, 100000); for (var k3 = m; k3 < m + cnt; k3++) big += f(k3);
    var rows = [["\\sum_{k=" + m + "}^{" + (M - 1) + "} f(k)", em.head, "บวกตรง " + (M - m) + " พจน์"],
      ["\\int_{" + M + "}^{" + (inf ? "\\infty" : "N") + "} f(x)\\,dx", em.integ.v, "ปริพันธ์เชิงตัวเลข (double exponential)"],
      [inf ? "\\tfrac12 f(" + M + ")" : "\\tfrac12[f(" + M + ") + f(N)]", em.half, "แก้ด้วยสี่เหลี่ยมคางหมู"]];
    em.corr.forEach(function (cv) { rows.push(["\\tfrac{B_{" + 2 * cv.j + "}}{(" + 2 * cv.j + ")!}\\,\\Delta f^{(" + (2 * cv.j - 1) + ")}", cv.val, "B" + sub(2 * cv.j) + " = " + qstr(cv.B)]); });
    var tbl = tableHtml(["พจน์", "ค่า"], rows.map(function (r) { return [T(r[0]) + '<small class="sc-note">' + r[2] + "</small>", '<span class="mono">' + fmtH(r[1], 12) + "</span>"]; }).concat([["<b>รวม</b>", '<b class="mono">' + fmtH(em.S, 15) + "</b>"]]), "sc-em-t");
    var html = '<div class="lap-ans">' + D(head + " \\approx " + texNumF(em.S, 15)) + (idt ? D("= " + idt) + '<p class="lap-help">ตรงกับค่าคงตัวที่รู้จักถึง 10 หลักขึ้นไป (หลักฐานเชิงตัวเลข ไม่ใช่บทพิสูจน์)</p>' : "") + "</div>";
    var cmp = [["บวกตรง " + (M - m) + " พจน์", naive], ["บวกตรง " + cnt.toLocaleString("en-US") + " พจน์", big], ["ออยเลอร์–แมคลอริน (ใช้ " + (M - m) + " พจน์ + การแก้)", em.S]];
    var steps = ['<p>สูตรออยเลอร์–แมคลอริน (อนุพันธ์คำนวณแม่นตรงด้วย automatic differentiation)</p>' + D("\\begin{aligned}\\sum_{k=M}^{N} f(k) &= \\int_M^N f\\,dx + \\tfrac{f(M)+f(N)}{2} \\\\ &\\quad + \\sum_{j\\ge1} \\tfrac{B_{2j}}{(2j)!}\\Big(f^{(2j-1)}(N) - f^{(2j-1)}(M)\\Big)\\end{aligned}"),
      "ส่วนประกอบของคำตอบ" + tbl,
      "เปรียบเทียบความเร็วการลู่เข้า" + tableHtml(["วิธี", "ค่า · ต่างจากค่าที่ดีที่สุด"], cmp.map(function (r) { return [r[0], '<span class="mono">' + fmtH(r[1], 13) + '</span><small class="sc-note">±' + fmtH(Math.abs(r[1] - em.S), 2) + "</small>"]; }), "sc-cmp")];
    if (!inf && /^1\/k$/.test(fs.replace(/\s/g, ""))) steps.push("เทียบกับ \\(\\ln N + \\gamma + \\tfrac{1}{2N} = " + texNumF(Math.log(Nn) + 0.5772156649015329 + 0.5 / Nn, 15) + "\\) (สูตรเชิงเส้นกำกับของจำนวนฮาร์มอนิก ได้จากออยเลอร์–แมคลอรินเช่นกัน)");
    return html + stepsHtml(steps);
  }
  function cvzHtml(fs, ms) {
    var m = parseInt(ms, 10); if (!isFinite(m)) throw err("ขอบล่างต้องเป็นจำนวนเต็ม");
    var c = SQ.compile(fs, ["k"]), b = function (j) { return c.fn({ k: m + j }); };
    for (var j = 0; j < 40; j++) if (!isFinite(b(j))) throw err("bₖ ไม่นิยามที่ k = " + (m + j));
    var best = cvz(b, 40), idt = identify(best);
    var head = "\\sum_{k=" + m + "}^{\\infty} (-1)^{k" + (m ? "-" + m : "") + "}" + (/^[a-z0-9.]+$/i.test(c.tex) ? c.tex : "\\left(" + c.tex + "\\right)");
    var rowsC = [5, 10, 15, 20, 30].map(function (n) { var v = cvz(b, n); return ["CVZ " + n + " พจน์", v]; });
    var rowsP = [10, 100, 1000, 100000].map(function (n) { var s = 0; for (var i = 0; i < n; i++) s += (i % 2 ? -1 : 1) * b(i); return ["ผลบวกย่อย " + n.toLocaleString("en-US") + " พจน์", s]; });
    var html = '<div class="lap-ans">' + D(head + " \\approx " + texNumF(best, 15)) + (idt ? D("= " + idt) : "") + "</div>";
    var steps = ["อนุกรมสลับลู่เข้าช้า: ผลบวกย่อย N พจน์คลาดราว \\(b_{N+1}\\) (ไลบ์นิซ) เช่น \\(\\sum (-1)^{k+1}/k\\) ต้องใช้ล้านพจน์เพื่อทศนิยม 6 ตำแหน่ง",
      "อัลกอริทึม Cohen–Villegas–Zagier ถ่วงน้ำหนักพจน์ด้วยพหุนามเชบีเชฟ ความคลาดลดลงราว \\(5.8^{-n}\\) เมื่อใช้ n พจน์" + tableHtml(["วิธี", "ค่า · ต่างจากค่าที่ดีที่สุด"], rowsC.concat(rowsP).map(function (r) { return [r[0], '<span class="mono">' + fmtH(r[1], 13) + '</span><small class="sc-note">±' + fmtH(Math.abs(r[1] - best), 2) + "</small>"]; }), "sc-cmp")];
    return html + stepsHtml(steps);
  }

  // ======================================================================= 6. repeating decimals, means, annuities
  var MS_EX = {
    decimal: [{ l: "0.(3)", v: { x: "0.(3)" } }, { l: "0.1(23)", v: { x: "0.1(23)" } }, { l: "2.(142857)", v: { x: "2.(142857)" } }, { l: "0.(9) = 1 ?", v: { x: "0.(9)" } }, { l: "1.2(45)", v: { x: "1.2(45)" } }],
    means: [{ l: "แทรก 4 จำนวนระหว่าง 3 กับ 18 (เลขคณิต)", v: { a: "3", b: "18", k: "4", kind: "arith" } }, { l: "แทรก 3 จำนวนระหว่าง 2 กับ 162 (เรขาคณิต)", v: { a: "2", b: "162", k: "3", kind: "geo" } }, { l: "ฮาร์มอนิก 1 จำนวน ระหว่าง 3 กับ 6", v: { a: "3", b: "6", k: "1", kind: "harm" } }],
    annuity: [{ l: "ฝากปลายเดือน 2,000 บาท 5% ต่อปี 10 ปี", v: { P: "2000", rate: "5", per: "12", years: "10", when: "end", kind: "fv" } }, { l: "ฝากต้นปี 10,000 บาท 3% 15 ปี", v: { P: "10000", rate: "3", per: "1", years: "15", when: "begin", kind: "fv" } }, { l: "กู้ 1,500,000 บาท 6% 20 ปี ผ่อนรายเดือน", v: { P: "1500000", rate: "6", per: "12", years: "20", when: "end", kind: "loan" } }]
  };
  function initMisc(box) {
    var st = { mode: box.dataset.mode || "decimal" };
    function form() {
      var f = st.mode === "decimal" ? field("x", "ทศนิยมซ้ำ (ส่วนที่ซ้ำอยู่ในวงเล็บ)", "เช่น 0.1(23) แทน 0.1232323…", "0.1(23)", "sc-wide")
        : st.mode === "means" ? field("a", "จำนวนแรก a", "3", "3") + field("b", "จำนวนสุดท้าย b", "18", "18") + field("k", "จำนวนที่แทรก", "4", "4") + select("kind", "ชนิด", [["arith", "เลขคณิต"], ["geo", "เรขาคณิต"], ["harm", "ฮาร์มอนิก"]], "arith")
        : select("kind", "โจทย์", [["fv", "เงินฝากรายงวด (มูลค่าอนาคต)"], ["loan", "เงินกู้ (ค่างวดผ่อน)"]], "fv") + field("P", "เงินต่องวด / เงินต้นกู้ (บาท)", "2000", "2000") + field("rate", "ดอกเบี้ยต่อปี (%)", "5", "5") + select("per", "งวดต่อปี", [["12", "รายเดือน (12)"], ["4", "รายไตรมาส (4)"], ["1", "รายปี (1)"]], "12") + field("years", "จำนวนปี", "10", "10") + select("when", "ฝาก/จ่าย", [["end", "ปลายงวด"], ["begin", "ต้นงวด"]], "end");
      return '<div class="lap-chips sc-modes"><button type="button" class="lap-chip" data-m="decimal">ทศนิยมซ้ำ → เศษส่วน</button><button type="button" class="lap-chip" data-m="means">แทรกค่าเฉลี่ย</button><button type="button" class="lap-chip" data-m="annuity">เงินฝาก · เงินกู้</button></div><div class="sc-form">' + f + "</div>" + chips(MS_EX[st.mode], "data-ex");
    }
    var startPractice;
    function render() {
      shell(box, form(), {});
      $$("[data-m]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-m") === st.mode); });
      startPractice = practicePanel(box, "misc-" + st.mode, gen, function (p) { setVals(box, p.fill); solve(true); });
    }
    function solve(fromPractice) {
      var out = box.querySelector(".sc-out"), v = getVals(box);
      try { out.innerHTML = st.mode === "decimal" ? decimalHtml(v.x) : st.mode === "means" ? meansHtml(v) : annuityHtml(v); } catch (e) { out.innerHTML = errHtml(e); if (!e.user && root.console) console.error(e); }
      if (!fromPractice) box.querySelector(".sc-prac").hidden = true;
    }
    function gen() {
      if (st.mode === "decimal") {
        var pre = Math.random() < 0.5 ? "" : String(ri(1, 9)), rep = String(ri(1, 98)); if (rep.length === 1 && Math.random() < 0.5) rep = rep + String(ri(0, 9));
        var x = "0." + pre + "(" + rep + ")", q = repeatingToFrac(x).q;
        return { q: "เขียน \\(" + "0." + pre + "\\overline{" + rep + "}" + "\\) เป็นเศษส่วนอย่างต่ำ", a: qnum(q), check: function (s) { var g = qparse(s); return g && qeq(g, q); }, ph: "เช่น 61/495", ans: "\\(" + qtex(q) + "\\)", fill: { x: x } };
      }
      if (st.mode === "means") {
        var a = ri(1, 9), d = ri(2, 7), k = ri(2, 5);
        return { q: "แทรกจำนวน " + k + " จำนวนระหว่าง " + a + " กับ " + (a + (k + 1) * d) + " ให้เป็นลำดับเลขคณิต จงหาผลต่างร่วม", a: d, ans: "\\(d = " + d + "\\)", fill: { a: a, b: a + (k + 1) * d, k: k, kind: "arith" } };
      }
      var P = pick([1000, 2000, 5000]), rate = pick([2, 3, 4, 5, 6]), years = ri(3, 10);
      var i = rate / 100, fv = P * (Math.pow(1 + i, years) - 1) / i;
      return { q: "ฝากเงินปลายปีทุกปี ปีละ " + P.toLocaleString("en-US") + " บาท ดอกเบี้ยทบต้น " + rate + "% ต่อปี ครบ " + years + " ปี มีเงินรวมกี่บาท (ตอบทศนิยม 2 ตำแหน่ง)", a: fv, check: function (s) { return Math.abs(numOf(s) - fv) < 0.011; }, ans: fmtNum(Math.round(fv * 100) / 100, 12) + " บาท", fill: { kind: "fv", P: P, rate: rate, per: "1", years: years, when: "end" } };
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]"); if (m) { st.mode = m.getAttribute("data-m"); render(); solve(); return; }
      var x = e.target.closest("[data-ex]"); if (x) { setVals(box, MS_EX[st.mode][+x.getAttribute("data-ex")].v); solve(); return; }
      if (e.target.closest("[data-go]")) solve();
      if (e.target.closest("[data-practice]")) startPractice();
    });
    bindEnter(box, function () { solve(); });
    box._set = function (o) { if (o.mode) { st.mode = o.mode; render(); } setVals(box, o); solve(); };
    render(); solve();
  }
  function decimalHtml(x) {
    var r = repeatingToFrac(x);
    if (r.plain) return '<div class="lap-ans">' + D(qdecStr(r.q, 15) + " = " + qtex(r.q, { big: true })) + '<p class="lap-help">ทศนิยมรู้จบเป็นเศษส่วนที่ตัวส่วนเป็น 10ᵏ ได้ทันที ใส่วงเล็บรอบส่วนที่ซ้ำ เช่น 0.(3)</p></div>';
    var L = r.pre.length, p = r.rep.length;
    var shown = (r.neg ? "-" : "") + r.ip + "." + r.pre + "\\overline{" + r.rep + "}";
    var nonrep = qdec((r.neg ? "-" : "") + r.ip + "." + (r.pre || "0"));
    var first = Q(BigInt(r.rep) * (r.neg ? -O : O), TEN ** BigInt(L + p)), ratio = Q(1, TEN ** BigInt(p));
    var tail = qdiv(first, qsub(Q1, ratio));
    var steps = [
      "แยกส่วนที่ไม่ซ้ำกับส่วนที่ซ้ำ: \\(" + shown + " = " + qtex(nonrep) + " + \\left(" + qtex(first) + " + " + qtex(qmul(first, ratio)) + " + \\cdots\\right)\\)",
      "วงเล็บเป็นอนุกรมเรขาคณิตอนันต์ \\(a = " + qtex(first) + ",\\ r = " + qtex(ratio) + "\\) (\\(|r| < 1\\)) ⇒ \\(\\dfrac{a}{1-r} = " + qtex(tail) + "\\)",
      "รวม: \\(" + qtex(nonrep) + " + " + qtex(tail) + " = " + qtex(r.q) + "\\)",
      "วิธีลัดแบบพีชคณิต: ให้ \\(x = " + shown + "\\) คูณ \\(10^{" + (L + p) + "}\\) และ \\(10^{" + L + "}\\) แล้วลบกัน ส่วนที่ซ้ำหายไป ⇒ \\(x = \\dfrac{" + (r.ip + r.pre + r.rep).replace(/^0+(?=\d)/, "") + " - " + ((r.ip + r.pre).replace(/^0+(?=\d)/, "") || "0") + "}{" + "9".repeat(p) + "0".repeat(L) + "}\\)"
    ];
    var extra = qeq(r.q, Q1) || (qint(r.q) && /\(9+\)/.test(x)) ? '<p class="sc-warn">' + T("0.\\overline{9} = 1") + " พอดี ไม่ใช่ “เกือบ 1” เพราะผลบวกอนุกรมนิยามเป็นลิมิตของผลบวกย่อย</p>" : "";
    return '<div class="lap-ans">' + D(shown + " = " + qtex(r.q, { big: true })) + "</div>" + extra + stepsHtml(steps);
  }
  function meansHtml(v) {
    var a = readNum(v.a, "a"), b = readNum(v.b, "b"), k = readNum(v.k, "จำนวนที่แทรก");
    if (a === undefined || b === undefined || !k || !intQ(k)) throw err("กรอก a, b และจำนวนที่แทรก (จำนวนเต็มบวก)");
    var kk = Number(k.n), list = [], steps = [], res;
    if (v.kind === "arith") {
      var d = isQ(a) && isQ(b) ? qdiv(qsub(b, a), Q(kk + 1)) : (N(b) - N(a)) / (kk + 1);
      for (var i = 1; i <= kk; i++) list.push(isQ(d) ? qadd(a, qmul(d, Q(i))) : N(a) + i * d);
      steps.push("มีทั้งหมด \\(" + (kk + 2) + "\\) พจน์ \\(b = a + (k+1)d\\) ⇒ \\(d = \\dfrac{b - a}{k + 1} = \\dfrac{" + A(b) + " - " + A(a) + "}{" + (kk + 1) + "} = " + A(d) + "\\)");
      res = "d = " + A(d);
    } else if (v.kind === "geo") {
      var ratio = isQ(a) && isQ(b) ? qdiv(b, a) : N(b) / N(a), rs = isQ(ratio) ? exactRoot(ratio, kk + 1) : null, r;
      if (rs) r = rs[0]; else { if (N(ratio) < 0 && (kk + 1) % 2 === 0) throw err("ไม่มี r จริง"); r = Math.sign(N(ratio)) * Math.pow(Math.abs(N(ratio)), 1 / (kk + 1)); }
      for (var j = 1; j <= kk; j++) list.push(isQ(r) && isQ(a) ? qmul(a, qpow(r, j)) : N(a) * Math.pow(N(r), j));
      steps.push("\\(b = ar^{k+1}\\) ⇒ \\(r^{" + (kk + 1) + "} = " + (isQ(ratio) ? qtex(ratio) : texNumF(ratio)) + "\\) ⇒ \\(r = " + A(r) + "\\)" + (rs && rs.length > 1 ? " (หรือ \\(r = " + A(rs[1]) + "\\) ได้อีกชุด)" : ""));
      res = "r = " + A(r);
    } else {
      if (!isQ(a) || !isQ(b) || qz(a) || qz(b)) throw err("ฮาร์มอนิกต้องใช้จำนวนตรรกยะที่ไม่เป็นศูนย์");
      var ia = qinv(a), ib = qinv(b), dh = qdiv(qsub(ib, ia), Q(kk + 1));
      for (var t = 1; t <= kk; t++) list.push(qinv(qadd(ia, qmul(dh, Q(t)))));
      steps.push("ส่วนกลับของลำดับฮาร์มอนิกเป็นเลขคณิต: \\(\\tfrac1a = " + qtex(ia) + ",\\ \\tfrac1b = " + qtex(ib) + "\\) ⇒ ผลต่างร่วมของส่วนกลับ \\(d = " + qtex(dh) + "\\) แล้วกลับเศษส่วนอีกครั้ง");
      res = "d_{1/x} = " + qtex(dh);
    }
    var seq = [a].concat(list).concat([b]).map(A).join(",\\ ");
    steps.push("ลำดับที่ได้: \\(" + seq + "\\)");
    return '<div class="lap-ans">' + D(res) + D(seq) + "</div>" + stepsHtml(steps);
  }
  function annuityHtml(v) {
    var P = N(readNum(v.P, "เงิน")), rate = N(readNum(v.rate, "ดอกเบี้ย")), per = +v.per, years = N(readNum(v.years, "จำนวนปี"));
    if (!(P > 0) || !(rate >= 0) || !(years > 0)) throw err("กรอกเงิน ดอกเบี้ย และจำนวนปีให้ถูกต้อง");
    var i = rate / 100 / per, n = Math.round(years * per), due = v.when === "begin";
    var money = function (x) { return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var steps = [], html;
    if (v.kind === "loan") {
      var pmt = i === 0 ? P / n : P * i / (1 - Math.pow(1 + i, -n)); if (due) pmt /= 1 + i;
      steps.push("ดอกเบี้ยต่องวด \\(i = " + texNumF(i, 8) + "\\), จำนวนงวด \\(n = " + n + "\\)");
      steps.push("เงินกู้ = มูลค่าปัจจุบันของค่างวดทุกงวด: \\(P = R\\left[\\tfrac{1}{1+i} + \\tfrac{1}{(1+i)^2} + \\dots + \\tfrac{1}{(1+i)^n}\\right]\\) วงเล็บเป็นอนุกรมเรขาคณิต \\(a = r = \\tfrac{1}{1+i}\\) ⇒ \\(P = R\\,\\dfrac{1 - (1+i)^{-n}}{i}\\)");
      steps.push("ดังนั้น \\(R = \\dfrac{Pi}{1 - (1+i)^{-n}}" + (due ? "\\cdot\\dfrac{1}{1+i}" : "") + " = " + texNumF(pmt, 10) + "\\) บาทต่องวด");
      steps.push("จ่ายรวม \\(" + n + " \\times R = " + money(pmt * n) + "\\) บาท เป็นดอกเบี้ย " + money(pmt * n - P) + " บาท");
      html = '<div class="lap-ans"><p class="sc-big">ค่างวด ≈ <b>' + money(pmt) + "</b> บาท</p><p>จ่ายรวม " + money(pmt * n) + " บาท · ดอกเบี้ยรวม " + money(pmt * n - P) + " บาท</p></div>";
    } else {
      var fv = i === 0 ? P * n : P * (Math.pow(1 + i, n) - 1) / i; if (due) fv *= 1 + i;
      steps.push("ดอกเบี้ยต่องวด \\(i = " + texNumF(i, 8) + "\\), จำนวนงวด \\(n = " + n + "\\)");
      steps.push("เงินที่ฝากงวดสุดท้ายได้ดอกเบี้ย " + (due ? "1" : "0") + " งวด งวดแรกได้ " + (due ? "n" : "n − 1") + " งวด ⇒ ยอดรวม \\(= P\\left[" + (due ? "(1+i) + (1+i)^2 + \\dots + (1+i)^n" : "1 + (1+i) + \\dots + (1+i)^{n-1}") + "\\right]\\)");
      steps.push("อนุกรมเรขาคณิต \\(r = 1 + i\\) ⇒ \\(S = P\\,\\dfrac{(1+i)^n - 1}{i}" + (due ? "(1+i)" : "") + " = " + texNumF(fv, 12) + "\\) บาท");
      steps.push("เงินต้นที่ฝากรวม \\(" + n + " \\times " + money(P) + " = " + money(P * n) + "\\) บาท ดอกเบี้ยรวม " + money(fv - P * n) + " บาท");
      html = '<div class="lap-ans"><p class="sc-big">ยอดเงินรวม ≈ <b>' + money(fv) + "</b> บาท</p><p>เงินต้น " + money(P * n) + " บาท · ดอกเบี้ย " + money(fv - P * n) + " บาท</p></div>";
    }
    return html + stepsHtml(steps) + '<p class="lap-help">ตัวเลขเพื่อการเรียนรู้ ดอกเบี้ยจริงขึ้นกับเงื่อนไขของสถาบันการเงิน</p>';
  }

  // ======================================================================= boot, page buttons, ?q=
  var INIT = { "sc-ag": initAG, "sc-sigma": initSigma, "sc-find": initFind, "sc-rec": initRec, "sc-em": initEM, "sc-misc": initMisc };
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls).forEach(function (box) {
        if (box.__sc) return; box.__sc = true;
        box.classList.add("cl-lab", "sc-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">เครื่องมือโหลดไม่สำเร็จ: ' + esc(e.message) + "</p>"; if (root.console) console.error(e); }
      });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sc-set]"); if (!b) return;
      var id = b.getAttribute("data-sc-target"), box = id ? document.getElementById(id) : null;
      if (!box) { var cls = b.getAttribute("data-sc-cls"); box = cls ? document.querySelector("." + cls) : null; }
      if (box && box._set) { box._set(JSON.parse(b.getAttribute("data-sc-set"))); box.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    // ?q= (MathSolver target and share links)
    try {
      var q = new URLSearchParams(location.search).get("q");
      if (q) {
        var P = parseQuery(q), box = null;
        if (P && P.widget === "sigma") { box = document.querySelector(".sc-sigma"); if (box && box._set) box._set({ f: P.f, m: P.m, n: P.n }); }
        else if (P && P.widget === "find") { box = document.querySelector(".sc-find"); if (box && box._set) box._set({ terms: P.terms }); }
        else if (P && P.widget === "rec") { box = document.querySelector(".sc-rec"); if (box && box._set) box._set({ rhs: P.rhs, init: P.init.join(", "), n0: String(P.n0) }); }
        if (box) setTimeout(function () { box.scrollIntoView({ block: "start" }); }, 60);
      }
    } catch (e) { /* ignore malformed query */ }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
