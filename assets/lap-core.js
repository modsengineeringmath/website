/* LapCore — Laplace-transform engine for the lessons in /learn/laplace-transform/ (no DOM).
   Needs cs-core.js (window.CS: polynomial helpers and the Aberth root finder) and mathkit.js (MK.nice for TeX).
   - LapCore.parse("(s+3)/((s+1)(s+2)^2) - 2e^(-s)/s")  → { terms: [{ T, N, D }] }  (sum of delayed rational functions)
   - LapCore.pfe(N, D)      → partial-fraction expansion: { k: quotient poly, poles: [{ p, m, c:[c1..cm] }], lead }
   - LapCore.timeTerms(pf)  → the inverse transform term by term (complex pairs combined into e^{σt}(A cos ωt + B sin ωt))
   - LapCore.evalTerms(tt, t, T) → f(t) at time t (delay T applied)
   - LapCore.solve(src)     → everything the inverse-Laplace calculator shows (TeX for each step)
   Polynomials: arrays of real numbers, highest power first (same as CS). window.LapCore / module.exports. */
(function (root) {
  "use strict";
  var CS = root.CS || (typeof require !== "undefined" ? require("./cs-core.cjs") : null);
  var MK = root.MK || (typeof require !== "undefined" ? require("./mathkit.cjs") : null);
  var LC = {};
  var pmul = CS.pmul, padd = CS.padd, pscale = CS.pscale, trim = CS.trim;

  /* ------------------------------------------------------------ complex helpers */
  var C = function (re, im) { return { re: re, im: im || 0 }; };
  var cadd = function (a, b) { return C(a.re + b.re, a.im + b.im); };
  var csub = function (a, b) { return C(a.re - b.re, a.im - b.im); };
  var cmul = function (a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); };
  var cdiv = function (a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  var cabs = function (a) { return Math.hypot(a.re, a.im); };
  LC.C = C; LC.cadd = cadd; LC.csub = csub; LC.cmul = cmul; LC.cdiv = cdiv; LC.cabs = cabs;

  /* ------------------------------------------------- parser: sums of e^{-Ts} R(s) */
  // value = array of { T, n, d } (n, d real polynomials).  e^(-T s) is allowed anywhere as a factor.
  function vnum(x) { return [{ T: 0, n: [x], d: [1] }]; }
  function vs() { return [{ T: 0, n: [1, 0], d: [1] }]; }
  function vexp(T) { return [{ T: T, n: [1], d: [1] }]; }
  function norm(v) { // merge terms with the same delay
    var out = [];
    v.forEach(function (t) {
      var k = out.find(function (o) { return Math.abs(o.T - t.T) < 1e-12; });
      if (!k) out.push({ T: t.T, n: t.n.slice(), d: t.d.slice() });
      else { var n = padd(pmul(k.n, t.d), pmul(t.n, k.d)); k.n = n; k.d = pmul(k.d, t.d); }
    });
    return out.filter(function (t) { return trim(t.n, 1e-13).some(function (c) { return Math.abs(c) > 1e-13; }); });
  }
  function vadd(a, b) { return norm(a.concat(b)); }
  function vneg(a) { return a.map(function (t) { return { T: t.T, n: pscale(t.n, -1), d: t.d }; }); }
  function vmul(a, b) {
    var out = [];
    a.forEach(function (x) { b.forEach(function (y) { out.push({ T: x.T + y.T, n: pmul(x.n, y.n), d: pmul(x.d, y.d) }); }); });
    return norm(out);
  }
  function vinv(a) {
    if (a.length !== 1) throw new Error("หารด้วยผลบวกที่มี e^(−Ts) หลายพจน์ไม่ได้ (เช่น 1/(1 − e^(−s)) ให้ใช้สูตรฟังก์ชันคาบแทน)");
    var t = a[0];
    if (!trim(t.n, 1e-13).some(function (c) { return Math.abs(c) > 1e-13; })) throw new Error("หารด้วยศูนย์");
    return [{ T: -t.T, n: t.d, d: t.n }];
  }
  function tokenize(src) {
    var str = String(src).replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4").replace(/\*\*/g, "^");
    var toks = [], i = 0, m;
    while (i < str.length) {
      var ch = str[i];
      if (/\s/.test(ch)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(str.slice(i)))) { toks.push({ t: "num", v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^(exp|[a-zA-Z])/.exec(str.slice(i)))) { toks.push({ t: "id", v: m[0] }); i += m[0].length; continue; }
      if ("+-*/^()".indexOf(ch) >= 0) { toks.push({ t: ch }); i++; continue; }
      throw new Error("อักขระที่ไม่รู้จัก “" + ch + "”");
    }
    return toks;
  }
  LC.parse = function (src) {
    var toks = tokenize(src), pos = 0;
    var peek = function () { return toks[pos]; };
    var expect = function (t) { if (!toks[pos] || toks[pos].t !== t) throw new Error(t === ")" ? "วงเล็บไม่ครบ" : "พิมพ์ไม่ถูกต้อง: คาดว่าจะเป็น " + t); return toks[pos++]; };
    var starts = function (t) { return t && (t.t === "num" || t.t === "id" || t.t === "("); };
    function expr() {
      var v = term();
      while (peek() && (peek().t === "+" || peek().t === "-")) { var op = toks[pos++].t, w = term(); v = vadd(v, op === "+" ? w : vneg(w)); }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var t = peek();
        if (t && (t.t === "*" || t.t === "/")) { pos++; var w = unary(); v = t.t === "*" ? vmul(v, w) : vmul(v, vinv(w)); }
        else if (starts(t)) v = vmul(v, power());
        else return v;
      }
    }
    function unary() {
      if (peek() && peek().t === "-") { pos++; return vneg(unary()); }
      if (peek() && peek().t === "+") { pos++; return unary(); }
      return power();
    }
    function power() {
      var b = atom();
      if (peek() && peek().t === "^") {
        pos++;
        var neg = false;
        if (peek() && peek().t === "-") { neg = true; pos++; }
        var e;
        if (peek() && peek().t === "(") { pos++; e = expect("num").v; expect(")"); } else e = expect("num").v;
        if (e !== Math.round(e) || e > 12) throw new Error("เลขชี้กำลังต้องเป็นจำนวนเต็มไม่เกิน 12");
        var r = vnum(1);
        for (var i = 0; i < e; i++) r = vmul(r, b);
        return neg ? vinv(r) : r;
      }
      return b;
    }
    function delayArg(inner) {
      if (inner.length !== 1 || Math.abs(inner[0].T) > 1e-12) throw new Error("ใน e^( ) ใส่ได้เฉพาะ −T·s");
      var n = trim(inner[0].n, 1e-14), d = trim(inner[0].d, 1e-14);
      if (d.length !== 1 || n.length > 2 || (n.length === 2 && Math.abs(n[1]) > 1e-12)) throw new Error("ใน e^( ) ใส่ได้เฉพาะ −T·s เช่น e^(-2s)");
      var a = n.length === 2 ? n[0] / d[0] : 0;
      if (a > 1e-12) throw new Error("ต้องเป็น e^(−Ts) ที่ T ≥ 0 (สัญญาณที่เลื่อนไปทางขวา)");
      return -a;
    }
    function atom() {
      var t = peek();
      if (!t) throw new Error("นิพจน์ยังไม่จบ");
      if (t.t === "num") { pos++; return vnum(t.v); }
      if (t.t === "(") { pos++; var v = expr(); expect(")"); return v; }
      if (t.t === "id") {
        pos++;
        if (t.v === "s") return vs();
        if (t.v === "exp") { expect("("); var a = expr(); expect(")"); return vexp(delayArg(a)); }
        if (t.v === "e") {
          if (!peek() || peek().t !== "^") return vnum(Math.E);
          pos++;
          var inner;
          if (peek() && peek().t === "(") { pos++; inner = expr(); expect(")"); } else inner = unary();
          return vexp(delayArg(inner));
        }
        throw new Error("ตัวแปรที่ใช้ได้มีแค่ s (พบ “" + t.v + "”)");
      }
      throw new Error("พิมพ์ไม่ถูกต้อง");
    }
    var v = expr();
    if (pos < toks.length) throw new Error("มีส่วนเกินท้ายนิพจน์");
    if (!v.length) return { terms: [] };
    return {
      terms: v.map(function (x) {
        var n = trim(x.n, 0), d = trim(x.d, 0), k = d[0];
        return { T: x.T, N: n.map(function (c) { return c / k; }), D: d.map(function (c) { return c / k; }) };
      }).sort(function (a, b) { return a.T - b.T; })
    };
  };

  /* ------------------------------------------------------------- polynomials */
  function pdiv(N, D) { // real long division → { q, r }
    var n = N.slice(), d = trim(D), q = [];
    if (n.length < d.length) return { q: [0], r: n };
    for (var i = 0; i <= n.length - d.length; i++) {
      var c = n[i] / d[0];
      q.push(c);
      for (var j = 0; j < d.length; j++) n[i + j] -= c * d[j];
    }
    var r = n.slice(n.length - d.length + 1);
    return { q: q, r: r.length ? r : [0] };
  }
  LC.pdiv = pdiv;
  function snap(x) { // round to a nearby simple number (integers, halves, thirds …)
    for (var q = 1; q <= 12; q++) { var p = Math.round(x * q); if (Math.abs(x - p / q) < 1e-7 * Math.max(1, Math.abs(x))) return p / q; }
    return x;
  }
  LC.snap = snap;
  // distinct roots with multiplicities
  LC.poleList = function (D) {
    var rs = CS.roots(trim(D)), used = new Array(rs.length).fill(false), out = [];
    for (var i = 0; i < rs.length; i++) {
      if (used[i]) continue;
      var grp = [rs[i]]; used[i] = true;
      var tol = 3e-3 * (1 + cabs(rs[i]));
      for (var j = i + 1; j < rs.length; j++) if (!used[j] && cabs(csub(rs[j], rs[i])) < tol) { grp.push(rs[j]); used[j] = true; }
      var re = grp.reduce(function (a, z) { return a + z.re; }, 0) / grp.length, im = grp.reduce(function (a, z) { return a + z.im; }, 0) / grp.length;
      if (Math.abs(im) < 1e-5 * (1 + Math.abs(re))) im = 0;
      if (grp.length > 1) { // a root of multiplicity m is a simple root of D^(m−1): polish it with Newton steps
        var Dk = trim(D);
        for (var q = 1; q < grp.length; q++) Dk = CS.pderiv(Dk);
        var dD = CS.pderiv(Dk), z = C(re, im);
        for (var it = 0; it < 30; it++) {
          var fz = CS.peval(Dk, z), dz = CS.peval(dD, z);
          if (cabs(dz) === 0) break;
          var stp = cdiv(fz, dz);
          z = csub(z, stp);
          if (cabs(stp) < 1e-15 * (1 + cabs(z))) break;
        }
        re = z.re; im = im === 0 ? 0 : z.im;
      }
      out.push({ p: C(snap(re), snap(im)), m: grp.length });
    }
    // sort: real first by value descending (closest to the jω axis first), then complex with im > 0
    out.sort(function (a, b) { return (Math.abs(a.p.im) > 0) - (Math.abs(b.p.im) > 0) || b.p.re - a.p.re || b.p.im - a.p.im; });
    return out;
  };
  // ascending Taylor coefficients of real polynomial P (highest first) about complex point a, first m of them
  function taylor(P, a, m) {
    var asc = P.slice().reverse(), out = [];
    for (var k = 0; k < m; k++) {
      var s = C(0, 0), binom = 1;
      // Σ_{i≥k} a_i C(i,k) a^{i−k}
      var pw = C(1, 0);
      for (var i = k; i < asc.length; i++) {
        if (i > k) { binom = binom * i / (i - k); pw = cmul(pw, a); }
        s = cadd(s, C(asc[i] * binom * pw.re, asc[i] * binom * pw.im));
      }
      out.push(s);
    }
    return out;
  }
  function ctaylor(Pc, a, m) { // complex polynomial (array of C, highest first)
    var asc = Pc.slice().reverse(), out = [];
    for (var k = 0; k < m; k++) {
      var s = C(0, 0), binom = 1, pw = C(1, 0);
      for (var i = k; i < asc.length; i++) {
        if (i > k) { binom = binom * i / (i - k); pw = cmul(pw, a); }
        var t = cmul(asc[i], pw);
        s = cadd(s, C(t.re * binom, t.im * binom));
      }
      out.push(s);
    }
    return out;
  }
  function cpmulLin(P, r) { // P(s)·(s − r), complex
    var out = P.map(function (x) { return x; }).concat([C(0, 0)]);
    for (var i = P.length - 1; i >= 0; i--) out[i + 1] = csub(out[i + 1], cmul(P[i], r));
    return out;
  }
  /* Partial fractions of N/D. Returns quotient k (poly), lead = D[0], poles [{p, m, c:[c1..cm]}] with c_j the coefficient of 1/(s−p)^j */
  LC.pfe = function (N0, D0) {
    var D = trim(D0), N = trim(N0);
    var lead = D[0];
    var Dm = D.map(function (c) { return c / lead; }), Nm = N.map(function (c) { return c / lead; });
    var qr = Nm.length >= Dm.length ? pdiv(Nm, Dm) : { q: [0], r: Nm };
    var R = qr.r, poles = LC.poleList(Dm);
    poles.forEach(function (P, idx) {
      var m = P.m;
      // E(s) = Π_{other poles} (s − q)^{m_q}
      var E = [C(1, 0)];
      poles.forEach(function (Q, j) { if (j !== idx) for (var k = 0; k < Q.m; k++) E = cpmulLin(E, Q.p); });
      var r = taylor(R, P.p, m), e = ctaylor(E, P.p, m), g = [];
      for (var k = 0; k < m; k++) {
        var acc = r[k];
        for (var j = 1; j <= k; j++) acc = csub(acc, cmul(e[j], g[k - j]));
        g.push(cdiv(acc, e[0]));
      }
      P.c = []; // c[j-1] ↔ 1/(s−p)^j
      for (var jj = 1; jj <= m; jj++) {
        var v = g[m - jj];
        P.c.push(C(Math.abs(v.re) < 1e-10 ? 0 : v.re, Math.abs(v.im) < 1e-10 ? 0 : v.im));
      }
    });
    return { k: trim(qr.q, 1e-12), R: R, poles: poles, lead: lead, N: N, D: D };
  };

  /* inverse transform term by term.  Each term: { kind:"delta", order, a } a·δ^{(order)}(t)
     or { kind:"exp", sigma, omega, pw, A, B } meaning t^pw/pw! e^{σt}(A cos ωt + B sin ωt) — for ω = 0 only A is used */
  LC.timeTerms = function (pf) {
    var out = [], q = pf.k, n = q.length - 1;
    q.forEach(function (c, i) { if (Math.abs(c) > 1e-12) out.push({ kind: "delta", order: n - i, a: c }); });
    pf.poles.forEach(function (P) {
      if (P.p.im < 0) return; // conjugate handled with its partner
      P.c.forEach(function (c, j) {
        if (P.p.im === 0) { if (Math.abs(c.re) > 1e-12) out.push({ kind: "exp", sigma: P.p.re, omega: 0, pw: j, A: c.re, B: 0 }); }
        else if (cabs(c) > 1e-12) out.push({ kind: "exp", sigma: P.p.re, omega: P.p.im, pw: j, A: 2 * c.re, B: -2 * c.im, c: c });
      });
    });
    return out;
  };
  var fact = function (n) { var f = 1; for (var i = 2; i <= n; i++) f *= i; return f; };
  LC.evalTerms = function (tt, t, T) {
    T = T || 0;
    var x = t - T;
    if (x < 0) return 0;
    var y = 0;
    tt.forEach(function (k) {
      if (k.kind !== "exp") return;
      var base = Math.pow(x, k.pw) / fact(k.pw) * Math.exp(k.sigma * x);
      y += base * (k.omega ? k.A * Math.cos(k.omega * x) + k.B * Math.sin(k.omega * x) : k.A);
    });
    return y;
  };

  /* ------------------------------------------------------------------- TeX */
  var nice = function (x) { return MK.nice(x); };
  function sTerm(p) { // (s − p) for real p
    if (Math.abs(p) < 1e-12) return "s";
    return "s " + (p < 0 ? "+ " + nice(-p) : "- " + nice(p));
  }
  LC.sTerm = sTerm;
  // factored denominator from the pole list (lead factored out)
  LC.factorTex = function (poles, lead) {
    var parts = [];
    poles.forEach(function (P) {
      if (P.p.im < 0) return;
      var f, pw = P.m > 1 ? "^{" + P.m + "}" : "";
      if (P.p.im === 0) f = P.p.re === 0 ? "s" + pw : "(" + sTerm(P.p.re) + ")" + pw;
      else {
        var a = -2 * P.p.re, b = P.p.re * P.p.re + P.p.im * P.p.im;
        f = "(" + MK.polyTex([1, a, b]) + ")" + pw;
      }
      parts.push(f);
    });
    var L = Math.abs(lead - 1) < 1e-12 ? "" : nice(lead);
    return L + parts.join("");
  };
  LC.ratTex = function (N, D) {
    var n = MK.polyTex(trim(N)), d = MK.polyTex(trim(D));
    return d === "1" ? n : "\\dfrac{" + n + "}{" + d + "}";
  };
  function cTex(c) { return MK.niceC(c.re, c.im); }
  function poleTex(p) { return MK.niceC(p.re, p.im); }
  LC.poleTex = poleTex;
  function linTex(p) { // s − p for complex p
    if (p.im === 0) return sTerm(p.re);
    var re = p.re, im = p.im;
    var a = re === 0 ? "" : (re < 0 ? " + " + nice(-re) : " - " + nice(re));
    var b = (im > 0 ? " - j" : " + j") + (Math.abs(Math.abs(im) - 1) < 1e-12 ? "" : nice(Math.abs(im)));
    return "s" + a + b;
  }
  LC.linTex = linTex;
  // one PFE term c/(s−p)^j
  function denTex(p, j) { // (s − p)^j with brackets only when needed
    var lin = linTex(p), simple = lin === "s";
    if (j === 1) return lin;
    return (simple ? "s" : "(" + lin + ")") + "^{" + j + "}";
  }
  LC.denTex = denTex;
  function pfeTermTex(c, p, j) {
    if (p.im === 0) {
      var a = c.re, neg = a < 0;
      return (neg ? "-" : "") + "\\dfrac{" + nice(Math.abs(a)) + "}{" + denTex(p, j) + "}";
    }
    return "\\dfrac{" + cTex(c) + "}{" + denTex(p, j) + "}";
  }
  LC.pfeTermTex = pfeTermTex;
  // the time-domain term in TeX (without u(t))
  function timeTermTex(k, v) {
    v = v || "t";
    if (k.kind === "delta") return MK.coef(k.a) + "\\delta" + (k.order === 1 ? "'" : k.order === 2 ? "''" : k.order ? "^{(" + k.order + ")}" : "") + "(" + v + ")";
    var tp = k.pw === 0 ? "" : k.pw === 1 ? v : v + "^{" + k.pw + "}";
    var fct = fact(k.pw);
    var ex = k.sigma === 0 ? "" : "e^{" + (k.sigma < 0 ? "-" + (Math.abs(k.sigma + 1) < 1e-12 ? "" : nice(-k.sigma)) : (Math.abs(k.sigma - 1) < 1e-12 ? "" : nice(k.sigma))) + v + "}";
    var pre = tp + ex;
    if (!k.omega) {
      var a = k.A / fct;
      if (!pre) return nice(a);
      return MK.coef(a) + pre;
    }
    var w = Math.abs(k.omega - 1) < 1e-12 ? "" : nice(k.omega);
    var A = k.A / fct, B = k.B / fct, parts = [];
    if (Math.abs(A) > 1e-12) parts.push(MK.coef(A) + "\\cos " + w + v);
    if (Math.abs(B) > 1e-12) parts.push((parts.length && B > 0 ? "+" : "") + MK.coef(B) + "\\sin " + w + v);
    var trig = parts.join(" ");
    if (!pre) return trig;
    if (parts.length === 1) { // c·t^k e^{σt} cos ωt
      var cc = Math.abs(A) > 1e-12 ? A : B, fn = Math.abs(A) > 1e-12 ? "\\cos " : "\\sin ";
      return MK.coef(cc) + pre + fn + w + v;
    }
    return pre + "\\left(" + trig + "\\right)";
  }
  LC.timeTermTex = timeTermTex;
  // amplitude–phase form of a complex-pair term: 2|c| e^{σt} cos(ωt + ∠c)
  LC.polarTex = function (k) {
    var M = Math.hypot(k.A, k.B), ph = Math.atan2(-k.B, k.A); // A cos − (−B) … : A cos x + B sin x = M cos(x − atan2(B, A))
    var fct = fact(k.pw), tp = k.pw === 0 ? "" : k.pw === 1 ? "t" : "t^{" + k.pw + "}";
    var ex = k.sigma === 0 ? "" : "e^{" + MK.coef(k.sigma) + "t}";
    var w = Math.abs(k.omega - 1) < 1e-12 ? "" : nice(k.omega);
    var deg = ph * 180 / Math.PI;
    return MK.coef(M / fct) + tp + ex + "\\cos\\left(" + w + "t " + (deg < 0 ? "- " : "+ ") + MK.sig(Math.abs(deg), 4) + "^\\circ\\right)";
  };
  function joinTerms(arr) {
    var s = "";
    arr.forEach(function (t, i) { s += i === 0 ? t : (t.charAt(0) === "-" ? " " + t : " + " + t); });
    return s || "0";
  }
  LC.joinTerms = joinTerms;

  /* ------------------------------------------------------ the full worked solution */
  LC.solve = function (src) {
    var parsed = LC.parse(src);
    if (!parsed.terms.length) throw new Error("F(s) = 0");
    var blocks = [], allTerms = [];
    parsed.terms.forEach(function (term, ti) {
      var pf = LC.pfe(term.N, term.D);
      var tt = LC.timeTerms(pf);
      var degN = trim(term.N).length - 1, degD = trim(term.D).length - 1;
      var steps = [];
      var Ftex = LC.ratTex(term.N, term.D);
      // 1. proper or improper
      if (degN >= degD) {
        steps.push({ h: "เศษส่วนไม่แท้ (deg N = " + degN + " ≥ deg D = " + degD + ") → หารยาวก่อน", tex: Ftex + " = " + MK.polyTex(pf.k) + " + " + LC.ratTex(pf.R.map(function (c) { return c * pf.lead; }), term.D) });
      } else steps.push({ h: "เศษส่วนแท้ (deg N = " + degN + " < deg D = " + degD + ") แยกเศษส่วนย่อยได้ทันที", tex: "" });
      // 2. factor the denominator
      steps.push({ h: "แยกตัวประกอบตัวส่วน หาโพล", tex: "D(s) = " + MK.polyTex(term.D) + " = " + LC.factorTex(pf.poles, pf.lead), poles: pf.poles });
      // 3. form
      var form = [];
      if (pf.k.some(function (c) { return Math.abs(c) > 1e-12; })) form.push(MK.polyTex(pf.k));
      pf.poles.forEach(function (P, pi) {
        for (var j = 1; j <= P.m; j++) {
          var name = String.fromCharCode(65 + pi) + (P.m > 1 ? "_{" + j + "}" : "");
          if (P.p.im < 0) name = "\\overline{" + String.fromCharCode(65 + pf.poles.findIndex(function (Q) { return Math.abs(Q.p.re - P.p.re) < 1e-9 && Math.abs(Q.p.im + P.p.im) < 1e-9; })) + (P.m > 1 ? "_{" + j + "}" : "") + "}";
          form.push("\\dfrac{" + name + "}{" + denTex(P.p, j) + "}");
        }
      });
      steps.push({ h: "เขียนรูปเศษส่วนย่อย", tex: "F(s) = " + form.join(" + ") });
      // 4. coefficients
      var coefTex = [];
      pf.poles.forEach(function (P, pi) {
        if (P.p.im < 0) return;
        var L = String.fromCharCode(65 + pi);
        if (P.m === 1) {
          var how = "\\left[" + (linTex(P.p) === "s" ? "s" : "(" + linTex(P.p) + ")") + "F(s)\\right]_{s=" + poleTex(P.p) + "}";
          coefTex.push({ tex: L + " = " + how + " = " + (P.p.im === 0 ? nice(P.c[0].re) : cTex(P.c[0])), pole: P, simple: true });
        } else {
          for (var j = P.m; j >= 1; j--) {
            var r = P.m - j;
            var how2 = (r === 0 ? "" : "\\dfrac{1}{" + (r > 1 ? r + "!" : "1!") + "}\\dfrac{d" + (r > 1 ? "^{" + r + "}" : "") + "}{ds" + (r > 1 ? "^{" + r + "}" : "") + "}") + "\\left[" + denTex(P.p, P.m) + "F(s)\\right]_{s=" + poleTex(P.p) + "}";
            coefTex.push({ tex: L + "_{" + j + "} = " + how2 + " = " + (P.p.im === 0 ? nice(P.c[j - 1].re) : cTex(P.c[j - 1])), pole: P, simple: false });
          }
        }
      });
      steps.push({ h: "หาสัมประสิทธิ์ (เรซิดิว)", list: coefTex });
      // 5. expanded
      var exp = [];
      if (pf.k.some(function (c) { return Math.abs(c) > 1e-12; })) exp.push(MK.polyTex(pf.k));
      pf.poles.forEach(function (P) {
        P.c.forEach(function (c, j) { if (cabs(c) > 1e-12) exp.push(pfeTermTex(c, P.p, j + 1)); });
      });
      steps.push({ h: "ได้เศษส่วนย่อย", tex: "F(s) = " + joinTerms(exp) });
      // 6. time domain
      var ttex = tt.map(function (k) { return timeTermTex(k); });
      steps.push({ h: "แปลงกลับทีละพจน์จากตาราง (คู่เชิงซ้อนรวมเป็น cos / sin)", tex: "f(t) = " + joinTerms(ttex) + (tt.some(function (k) { return k.kind === "exp"; }) ? ",\\quad t \\ge 0" : "") });
      var polar = tt.filter(function (k) { return k.kind === "exp" && k.omega; });
      if (polar.length) steps.push({ h: "เขียนพจน์แกว่งในรูปแอมพลิจูด–มุมเฟส", tex: polar.map(function (k) { return timeTermTex(k) + " = " + LC.polarTex(k); }).join(",\\quad ") });
      blocks.push({ T: term.T, N: term.N, D: term.D, pf: pf, tt: tt, steps: steps, ttex: ttex });
      allTerms.push({ T: term.T, tt: tt });
    });
    // final answer
    var finalParts = blocks.map(function (b) {
      var body = joinTerms(b.ttex);
      if (!b.T) return { tex: body, T: 0 };
      var arg = "t - " + nice(b.T);
      var sh = body.split("(t)").join("(\u0001)").replace(/(^|[^a-z])t(?![a-z])/g, function (m0, pre) { return pre + "(\u0001)"; }).split("\u0001").join(arg);
      var single = !/[^{(\[]\s[+-]\s?/.test(body.replace(/\{[^{}]*\}/g, "{}").replace(/\\left\([^]*?\\right\)/g, "()").slice(1));
      return { tex: (single ? sh : "\\left[" + sh + "\\right]") + "u(t - " + nice(b.T) + ")", T: b.T };
    });
    var hasDelay = blocks.some(function (b) { return b.T > 0; });
    var finalTex = "f(t) = " + finalParts.map(function (p, i) {
      var single0 = !/\s[+-]\s?/.test(p.tex.replace(/\{[^{}]*\}/g, "{}").replace(/\\left\([^]*?\\right\)/g, "()").slice(1));
      var t = p.T ? p.tex : (hasDelay ? (single0 ? p.tex + "\\,u(t)" : "\\left[" + p.tex + "\\right]u(t)") : p.tex);
      return i === 0 ? t : (t.charAt(0) === "-" ? " " + t : " + " + t);
    }).join("") + (hasDelay ? "" : (blocks.some(function (b) { return b.tt.some(function (k) { return k.kind === "exp"; }); }) ? ",\\quad t \\ge 0" : ""));
    return {
      blocks: blocks,
      finalTex: finalTex,
      f: function (t) { return allTerms.reduce(function (a, b) { return a + LC.evalTerms(b.tt, t, b.T); }, 0); },
      deltas: blocks.reduce(function (a, b) { return a.concat(b.tt.filter(function (k) { return k.kind === "delta"; }).map(function (k) { return { T: b.T, a: k.a, order: k.order }; })); }, []),
      maxT: Math.max.apply(null, blocks.map(function (b) { return b.T; }))
    };
  };

  /* --------------------------------------------- evaluation of F(s) on the s-plane */
  LC.evalRat = function (N, D, s) { return cdiv(CS.peval(N, s), CS.peval(D, s)); };

  root.LapCore = LC;
  if (typeof module !== "undefined" && module.exports) module.exports = LC;
})(typeof window !== "undefined" ? window : globalThis);
