/* Precalculus labs — chapter 27 (/learn/precalculus/, /learn/en/precalculus/).
   window.PC in the browser; in Node `require` gives the engine (parser, numbers, polynomials, distributions, statistics)
   for scripts/test-precalc.mjs. No dependencies; uses window.katex for TeX when the page loads it.
   This file: engine + plot + UI helpers + function widgets
     .pc-quad  quadratic explorer (roots exact, vertex, inequality)       data-a data-b data-c data-rel
     .pc-fn    function lab (f, g, f±g, fg, f/g, f∘g, g∘f, secant)        data-f data-g data-op data-x0 data-x1 data-xmin data-xmax
     .pc-tr    transformations y = a·f(b(x − h)) + k                       data-parent data-a data-b data-h data-k
     .pc-poly  polynomial from zeros · synthetic division                  data-mode=build|synth data-zeros data-lead data-p data-c
     .pc-rat   rational function analyzer                                   data-num data-den
     .pc-inv   inverse / horizontal-line test                               data-f data-lo data-hi
     .pc-exp   exponential graph · compound interest · half-life            data-mode=graph|interest|decay
     .pc-log   log graph · calculator · exponential equation solver         data-mode=graph|calc|solve
   precalc-trig.js and precalc-data.js add the trigonometry and data widgets through PC.widget().
   A page button <button data-pc-set='{"a":2}' data-pc-target="<id>"> loads values into a widget. */
(function (root) {
  "use strict";
  var PC = root.PC || {};
  var DOC = typeof document !== "undefined" ? document : null;
  var EN = !!(DOC && /^en/i.test(DOC.documentElement.lang || ""));
  PC.EN = EN;
  function L(th, en) { return EN ? en : th; }
  PC.L = L;

  // ======================================================================= numbers
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b > 1e-9) { var t = a % b; a = b; b = t; } return a; }
  PC.gcd = gcd;
  function rat(x, qmax, tol) { // best p/q with q ≤ qmax
    if (!isFinite(x)) return null;
    qmax = qmax || 1000; tol = tol == null ? 1e-9 : tol;
    for (var q = 1; q <= qmax; q++) {
      var p = Math.round(x * q);
      if (Math.abs(x - p / q) <= tol * Math.max(1, Math.abs(x))) { var g = gcd(p, q) || 1; return [p / g, q / g]; }
    }
    return null;
  }
  PC.rat = rat;
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  // plain-text number: up to d decimals, Unicode minus, thousands separators from 10 000
  function fmt(x, d) {
    if (x === Infinity) return "∞";
    if (x === -Infinity) return "−∞";
    if (typeof x !== "number" || isNaN(x)) return "—";
    d = d == null ? 4 : d;
    var a = Math.abs(x);
    if (a < 1e-12) return "0";
    var s;
    if (a >= 1e12 || a < Math.pow(10, -d)) {
      var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
      s = (+m.toFixed(3)) + "×10" + String(e).split("").map(function (c) { return SUP[c]; }).join("");
    } else if (a >= 1e4) s = x.toLocaleString("en-US", { maximumFractionDigits: Math.min(d, 2) });
    else s = String(+x.toFixed(d));
    return s.replace(/-/g, "−");
  }
  PC.fmt = fmt;
  function fracTex(p, q) {
    if (q < 0) { p = -p; q = -q; }
    var g = gcd(p, q) || 1; p = Math.round(p / g); q = Math.round(q / g);
    if (q === 1) return String(p);
    return (p < 0 ? "-" : "") + "\\tfrac{" + Math.abs(p) + "}{" + q + "}";
  }
  PC.fracTex = fracTex;
  // TeX for a real number: integer, fraction, a√b/q, or decimal
  function nice(x, d) {
    if (!isFinite(x)) return isNaN(x) ? "\\text{—}" : (x > 0 ? "\\infty" : "-\\infty");
    if (Math.abs(x) < 1e-11) return "0";
    var r = rat(x, 120, 1e-10);
    if (r) return fracTex(r[0], r[1]);
    var r2 = rat(x * x, 120, 1e-10);
    if (r2 && r2[0] < 1e7) {
      var pq = r2[0] * r2[1], k = 1, m = pq;
      for (var f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
      var g = gcd(k, r2[1]); k /= g; var q = r2[1] / g;
      var num = (k === 1 ? "" : k) + "\\sqrt{" + m + "}";
      return (x < 0 ? "-" : "") + (q === 1 ? num : "\\tfrac{" + num + "}{" + q + "}");
    }
    return fmt(x, d == null ? 4 : d).replace(/−/g, "-").replace(/,/g, "{,}").replace(/×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, function (_, e) {
      return "\\times10^{" + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { for (var k in SUP) if (SUP[k] === c) return k; return c; }) + "}";
    });
  }
  PC.nice = nice;
  // squarefree split of a positive integer: n = k²·m
  function sqf(n) { var k = 1, m = n; for (var f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; } return [k, m]; }
  PC.sqf = sqf;
  // exact TeX of (B0 ± s√m)/(den) with integers
  function surdTex(B0, s, m, den, sign) {
    var g = gcd(gcd(B0, s), den) || 1;
    B0 /= g; s /= g; den /= g;
    if (den < 0) { den = -den; B0 = -B0; s = -s; }
    var rad = (Math.abs(s) === 1 ? "" : Math.abs(s)) + "\\sqrt{" + m + "}";
    var top = (B0 ? B0 + (sign < 0 ? " - " : " + ") : (sign < 0 ? "-" : "")) + rad;
    if (sign === 0) top = (B0 ? B0 + " \\pm " : "\\pm ") + rad;
    return den === 1 ? top : "\\dfrac{" + top + "}{" + den + "}";
  }
  // smallest k making all values integers (k ≤ 1000) or 0
  function intScale(arr) {
    for (var k = 1; k <= 1000; k++) {
      if (arr.every(function (v) { return Math.abs(v * k - Math.round(v * k)) < 1e-9; })) return k;
    }
    return 0;
  }
  PC.intScale = intScale;
  function piTex(rad) { // multiple of π as TeX, or null
    var r = rat(rad / Math.PI, 48, 1e-9);
    if (!r) return null;
    if (r[0] === 0) return "0";
    var p = r[0], q = r[1], sg = p < 0 ? "-" : "", a = Math.abs(p);
    var top = (a === 1 ? "" : a) + "\\pi";
    return sg + (q === 1 ? top : "\\tfrac{" + top + "}{" + q + "}");
  }
  PC.piTex = piTex;
  function piTxt(rad) {
    var r = rat(rad / Math.PI, 48, 1e-9);
    if (!r) return null;
    if (r[0] === 0) return "0";
    var a = Math.abs(r[0]);
    return (r[0] < 0 ? "−" : "") + (a === 1 ? "" : a) + "π" + (r[1] === 1 ? "" : "/" + r[1]);
  }
  PC.piTxt = piTxt;

  // ======================================================================= expression parser (no eval)
  // log = base 10, ln = natural, log2; sin^2(x); |x|; n!; implicit products 2x, 3(x+1), x sin(x)
  var FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sec: function (v) { return 1 / Math.cos(v); }, csc: function (v) { return 1 / Math.sin(v); }, cot: function (v) { return 1 / Math.tan(v); },
    asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    sgn: function (v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }
  };
  FN.sign = FN.sgn;
  var CONST = { pi: Math.PI, e: Math.E };
  function perr(msg, pos) { var e = new Error(msg + (pos != null ? L(" (ตำแหน่ง ", " (position ") + (pos + 1) + ")" : "")); e.pos = pos; return e; }
  function fact(n) {
    if (n < 0 || Math.abs(n - Math.round(n)) > 1e-9) return NaN;
    n = Math.round(n); if (n > 170) return Infinity;
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  PC.fact = fact;
  function tokenize(src, vars) {
    var s = String(src).replace(/[−–—]/g, "-").replace(/[×·∙]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi")
      .replace(/²/g, "^2").replace(/³/g, "^3").replace(/√/g, "sqrt").replace(/\*\*/g, "^").replace(/\s+/g, " ");
    var names = Object.keys(FN).concat(Object.keys(CONST), vars).sort(function (a, b) { return b.length - a.length; });
    var out = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (ch === " ") { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        var m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
        if (!m) throw perr(L("ตัวเลขไม่ถูกต้อง", "Bad number"), i);
        out.push({ k: "num", v: parseFloat(m[0]), p: i }); i += m[0].length; continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        var run = s.slice(i).match(/^[a-zA-Z_][a-zA-Z_0-9]*/)[0], j = 0;
        while (j < run.length) {
          var hit = null;
          for (var q = 0; q < names.length; q++) if (run.substr(j, names[q].length).toLowerCase() === names[q]) { hit = names[q]; break; }
          if (!hit) throw perr(L("ไม่รู้จักชื่อ “", "Unknown name “") + run.slice(j) + "”", i + j);
          out.push({ k: FN[hit] && vars.indexOf(hit) < 0 ? "fn" : CONST[hit] != null && vars.indexOf(hit) < 0 ? "const" : "var", v: hit, p: i + j });
          j += hit.length;
        }
        i += run.length; continue;
      }
      if ("+-*/^(),|!".indexOf(ch) >= 0) { out.push({ k: ch, p: i }); i++; continue; }
      throw perr(L("อักขระไม่รู้จัก “", "Unexpected character “") + ch + "”", i);
    }
    return out;
  }
  function compile(src, vars) {
    vars = vars || ["x"];
    if (!String(src).trim()) throw perr(L("ยังไม่ได้พิมพ์นิพจน์", "Type an expression"));
    var tk = tokenize(src, vars), i = 0, absDepth = 0;
    function peek() { return tk[i]; }
    function eat(k) { var t = tk[i]; if (!t || t.k !== k) throw perr(L("คาดว่าจะเป็น “", "Expected “") + k + "”", t ? t.p : String(src).length); i++; return t; }
    function startsPrimary(t) { return t && (t.k === "num" || t.k === "var" || t.k === "const" || t.k === "fn" || t.k === "(" || (t.k === "|" && absDepth === 0)); }
    function expr() {
      var a = term();
      while (peek() && (peek().k === "+" || peek().k === "-")) {
        var op = tk[i++].k, b = term();
        a = op === "+" ? (function (a, b) { return function (e) { return a(e) + b(e); }; })(a, b) : (function (a, b) { return function (e) { return a(e) - b(e); }; })(a, b);
      }
      return a;
    }
    function term() {
      var a = unary();
      for (;;) {
        var t = peek();
        if (t && (t.k === "*" || t.k === "/")) {
          i++; var b = unary();
          a = t.k === "*" ? (function (a, b) { return function (e) { return a(e) * b(e); }; })(a, b) : (function (a, b) { return function (e) { return a(e) / b(e); }; })(a, b);
        } else if (startsPrimary(t)) {
          var c = power();
          a = (function (a, b) { return function (e) { return a(e) * b(e); }; })(a, c);
        } else break;
      }
      return a;
    }
    function unary() {
      var t = peek();
      if (t && t.k === "-") { i++; var a = unary(); return function (e) { return -a(e); }; }
      if (t && t.k === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var b = postfix();
      if (peek() && peek().k === "^") {
        i++; var ex = unary();
        return function (e) { return Math.pow(b(e), ex(e)); };
      }
      return b;
    }
    function postfix() {
      var a = primary();
      while (peek() && peek().k === "!") { i++; a = (function (a) { return function (e) { return fact(a(e)); }; })(a); }
      return a;
    }
    function primary() {
      var t = tk[i];
      if (!t) throw perr(L("นิพจน์ไม่ครบ", "Incomplete expression"), String(src).length);
      if (t.k === "num") { i++; var v = t.v; return function () { return v; }; }
      if (t.k === "const") { i++; var c = CONST[t.v]; return function () { return c; }; }
      if (t.k === "var") { i++; var nm = t.v; return function (e) { return e[nm]; }; }
      if (t.k === "(") { i++; var a = expr(); eat(")"); return a; }
      if (t.k === "|") { i++; absDepth++; var b = expr(); absDepth--; eat("|"); return function (e) { return Math.abs(b(e)); }; }
      if (t.k === "fn") {
        i++; var f = FN[t.v], pw = null;
        if (peek() && peek().k === "^") { i++; pw = primary(); }
        var arg;
        if (peek() && peek().k === "(") { i++; arg = expr(); eat(")"); } else arg = postfix();
        if (pw) return function (e) { return Math.pow(f(arg(e)), pw(e)); };
        return function (e) { return f(arg(e)); };
      }
      throw perr(L("วางตำแหน่ง “", "Unexpected “") + t.k + L("” ไม่ถูกต้อง", "”"), t.p);
    }
    var root = expr();
    if (i < tk.length) throw perr(L("อ่านต่อไม่ได้ที่ “", "Cannot continue at “") + (tk[i].v || tk[i].k) + "”", tk[i].p);
    return root;
  }
  PC.compile = compile;
  // one-variable function f(x) with .src
  PC.parse = function (src, v) {
    v = v || "x";
    var c = compile(src, [v]), env = {};
    var f = function (x) { env[v] = x; var y = c(env); return typeof y === "number" ? y : NaN; };
    f.src = String(src);
    return f;
  };
  PC.evalNum = function (src) { var c = compile(src, []); return c({}); };

  // ======================================================================= polynomials (coefficients, highest power first)
  function ptrim(p) { var i = 0; while (i < p.length - 1 && Math.abs(p[i]) < 1e-12) i++; return p.slice(i); }
  function peval(p, x) { var y = 0; for (var i = 0; i < p.length; i++) y = y * x + p[i]; return y; }
  function pmul(a, b) { var r = []; for (var i = 0; i < a.length + b.length - 1; i++) r.push(0); for (i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]; return r; }
  function pder(p) { var n = p.length - 1, r = []; for (var i = 0; i < n; i++) r.push(p[i] * (n - i)); return r.length ? r : [0]; }
  function pdiv(a, b) { // long division a ÷ b → [q, r]
    a = ptrim(a.slice()); b = ptrim(b);
    if (a.length < b.length) return [[0], a];
    var q = [], r = a.slice();
    for (var i = 0; i <= a.length - b.length; i++) {
      var c = r[i] / b[0]; q.push(c);
      for (var j = 0; j < b.length; j++) r[i + j] -= c * b[j];
    }
    var rem = ptrim(r.slice(a.length - b.length + 1));
    return [q, rem.length ? rem.map(function (v) { return Math.abs(v) < 1e-10 ? 0 : v; }) : [0]];
  }
  function synth(p, c) { // synthetic division table
    var prod = [null], sum = [p[0]];
    for (var i = 1; i < p.length; i++) { var m = sum[i - 1] * c; prod.push(m); sum.push(p[i] + m); }
    return { prod: prod, sum: sum, q: sum.slice(0, -1), r: sum[sum.length - 1] };
  }
  function fromRoots(rs, a) { var p = [a == null ? 1 : a]; rs.forEach(function (r) { p = pmul(p, [1, -r]); }); return p; }
  // all complex roots (Durand–Kerner) → [{re, im}]
  function proots(p) {
    p = ptrim(p);
    var n = p.length - 1;
    if (n < 1) return [];
    var lead = p[0], c = p.map(function (v) { return v / lead; });
    var zr = [], zi = [], R = 1 + Math.max.apply(null, c.slice(1).map(Math.abs));
    for (var k = 0; k < n; k++) { var ang = 2 * Math.PI * k / n + 0.4; zr.push(R * 0.6 * Math.cos(ang)); zi.push(R * 0.6 * Math.sin(ang)); }
    for (var it = 0; it < 800; it++) {
      var delta = 0;
      for (k = 0; k < n; k++) {
        var vr = 1, vi = 0; // horner of monic c at z_k
        var pr = c[0], pi = 0;
        for (var j = 1; j <= n; j++) { var tr = pr * zr[k] - pi * zi[k] + c[j], ti = pr * zi[k] + pi * zr[k]; pr = tr; pi = ti; }
        for (j = 0; j < n; j++) if (j !== k) { var dr = zr[k] - zr[j], di = zi[k] - zi[j]; var tr2 = vr * dr - vi * di, ti2 = vr * di + vi * dr; vr = tr2; vi = ti2; }
        var den = vr * vr + vi * vi || 1e-300, qr = (pr * vr + pi * vi) / den, qi = (pi * vr - pr * vi) / den;
        zr[k] -= qr; zi[k] -= qi; delta = Math.max(delta, Math.abs(qr) + Math.abs(qi));
      }
      if (delta < 1e-14) break;
    }
    var out = [];
    for (k = 0; k < n; k++) out.push({ re: zr[k], im: zi[k] });
    return out;
  }
  // real roots with multiplicity, snapped to nice values: [{x, m}]
  function realRoots(p) {
    var rs = proots(p).filter(function (z) { return Math.abs(z.im) < 1e-5 * Math.max(1, Math.abs(z.re)); }).map(function (z) { return z.re; }).sort(function (a, b) { return a - b; });
    var groups = [];
    rs.forEach(function (x) {
      var g = groups[groups.length - 1];
      if (g && Math.abs(x - g.s / g.m) < 2e-4 * Math.max(1, Math.abs(x))) { g.s += x; g.m++; } else groups.push({ s: x, m: 1 });
    });
    return groups.map(function (g) {
      var x = g.s / g.m, r = rat(x, 24, 1e-6);
      if (r && Math.abs(peval(p, r[0] / r[1])) < 1e-6 * Math.max(1, Math.abs(p[0]))) x = r[0] / r[1];
      else if (g.m === 1) { for (var it = 0; it < 30; it++) { var d = peval(pder(p), x); if (!d) break; var dx = peval(p, x) / d; x -= dx; if (Math.abs(dx) < 1e-15) break; } }
      return { x: x, m: g.m };
    });
  }
  // polynomial coefficients from text: "1, 0, -4" or "x^2 - 4" or "(x-1)(x+2)^2"
  function parsePoly(src) {
    var s = String(src).trim();
    if (!s) throw perr(L("ยังไม่ได้ใส่พหุนาม", "Enter a polynomial"));
    if (!/[a-zA-Z]/.test(s) && /[,;]/.test(s)) {
      var cs = s.split(/[,;]+/).map(function (t) { return PC.evalNum(t.trim()); });
      if (cs.some(function (v) { return !isFinite(v); })) throw perr(L("สัมประสิทธิ์ไม่ถูกต้อง", "Bad coefficient"));
      return ptrim(cs);
    }
    var f = PC.parse(s), N = 9, xs = [], ys = [];
    for (var i = 0; i < N; i++) { xs.push(i - 4); ys.push(f(i - 4)); }
    if (ys.some(function (v) { return !isFinite(v); })) throw perr(L("นิพจน์นี้ไม่ใช่พหุนาม", "This is not a polynomial"));
    // Newton divided differences → monomial coefficients
    var dd = ys.slice(), coef = [dd[0]];
    for (var k = 1; k < N; k++) { for (i = N - 1; i >= k; i--) dd[i] = (dd[i] - dd[i - 1]) / (xs[i] - xs[i - k]); coef.push(dd[k]); }
    var p = [coef[N - 1]];
    for (k = N - 2; k >= 0; k--) { p = pmul(p, [1, -xs[k]]); p[p.length - 1] += coef[k]; }
    p = p.map(function (v) { var r = Math.round(v); return Math.abs(v - r) < 1e-7 ? r : (Math.abs(v) < 1e-9 ? 0 : v); });
    p = ptrim(p);
    [5.5, -3.7, 0.37].forEach(function (x) {
      var a = f(x), b = peval(p, x);
      if (!(Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a)))) throw perr(L("นิพจน์นี้ไม่ใช่พหุนาม (หรือดีกรีเกิน 8)", "Not a polynomial (or degree above 8)"));
    });
    return p;
  }
  function polyTex(p, v) {
    v = v || "x"; p = ptrim(p);
    var out = "", n = p.length - 1;
    for (var i = 0; i < p.length; i++) {
      var c = p[i], pw = n - i;
      if (Math.abs(c) < 1e-12) continue;
      var a = Math.abs(c), cs = (Math.abs(a - 1) < 1e-12 && pw > 0) ? "" : nice(a);
      if (pw > 0 && /frac|sqrt/.test(cs)) cs = cs.replace("\\tfrac", "\\tfrac");
      var term = cs + (pw > 0 ? v + (pw > 1 ? "^{" + pw + "}" : "") : "");
      out += (c < 0 ? (out ? " - " : "-") : (out ? " + " : "")) + term;
    }
    return out || "0";
  }
  function factorTex(rs, a, v) { // a(x − r1)^m …
    v = v || "x";
    var s = Math.abs(a - 1) < 1e-12 ? "" : Math.abs(a + 1) < 1e-12 ? "-" : nice(a);
    rs.forEach(function (r) {
      var t = Math.abs(r.x) < 1e-12 ? v : "(" + v + (r.x < 0 ? " + " + nice(-r.x) : " - " + nice(r.x)) + ")";
      s += t + (r.m > 1 ? "^{" + r.m + "}" : "");
    });
    return s;
  }
  PC.poly = { trim: ptrim, eval: peval, mul: pmul, der: pder, div: pdiv, synth: synth, fromRoots: fromRoots, roots: proots, realRoots: realRoots, parse: parsePoly, tex: polyTex, factorTex: factorTex };

  // ======================================================================= distributions
  var SQ2 = Math.SQRT2, SQ2PI = Math.sqrt(2 * Math.PI);
  function lgamma(x) { // Numerical Recipes 3rd ed. gammln (relative error ~1e-15)
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    var cof = [57.1562356658629235, -59.5979603554754912, 14.1360979747417471, -0.491913816097620199, 0.339946499848118887e-4, 0.465236289270485756e-4,
      -0.983744753048795646e-4, 0.158088703224912494e-3, -0.210264441724104883e-3, 0.217439618115212643e-3, -0.164318106536763890e-3,
      0.844182239838527433e-4, -0.261908384015814087e-4, 0.368991826595316234e-5];
    var y = x, tmp = x + 5.24218750000000000, ser = 0.999999999999997092;
    tmp = (x + 0.5) * Math.log(tmp) - tmp;
    for (var j = 0; j < 14; j++) ser += cof[j] / ++y;
    return tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function erfc(x) { // Chebyshev (W. J. Cody style via continued fraction for large x) — |rel err| < 1e-12 after refinement below
    var z = Math.abs(x), r;
    if (z < 0.5) { // series for erf
      var s = 0, term = z, n = 0; do { s += term / (2 * n + 1); n++; term *= -z * z / n; } while (Math.abs(term) > 1e-17 * Math.abs(s) && n < 60);
      r = 1 - 2 / Math.sqrt(Math.PI) * s;
    } else if (z < 6) { // continued fraction (Lentz) for erfc
      var tiny = 1e-300, f = z, C = z, D = 0, k;
      for (k = 1; k < 300; k++) {
        var an = k / 2; D = z + an * D; D = D || tiny; C = z + an / C; C = C || tiny; D = 1 / D; var del = C * D; f *= del; if (Math.abs(del - 1) < 1e-16) break;
      }
      r = Math.exp(-z * z) / Math.sqrt(Math.PI) / f;
    } else r = Math.exp(-z * z) / (z * Math.sqrt(Math.PI)) * (1 - 1 / (2 * z * z));
    return x >= 0 ? r : 2 - r;
  }
  function Phi(z) { return 0.5 * erfc(-z / SQ2); }
  function phi(z) { return Math.exp(-z * z / 2) / SQ2PI; }
  function invPhi(p) {
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00],
      b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01],
      c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00],
      d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00], q, r, x;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    for (var it = 0; it < 2; it++) { var e = Phi(x) - p, u = e * SQ2PI * Math.exp(x * x / 2); x = x - u / (1 + x * u / 2); }
    return x;
  }
  function betacf(a, b, x) {
    var MAXIT = 400, EPS = 3e-16, FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function ibeta(x, a, b) { // regularized incomplete beta I_x(a, b)
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function gammaP(a, x) { // regularized lower incomplete gamma
    if (x <= 0) return 0;
    var gln = lgamma(a);
    if (x < a + 1) {
      var ap = a, sum = 1 / a, del = sum;
      for (var n = 0; n < 1000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; }
      return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    var b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (var i = 1; i < 1000; i++) {
      var an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; var dl = d * c; h *= dl; if (Math.abs(dl - 1) < 1e-16) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
  }
  function tCDF(t, v) {
    if (!isFinite(v)) return Phi(t);
    var x = v / (v + t * t), tail = 0.5 * ibeta(x, v / 2, 0.5);
    return t >= 0 ? 1 - tail : tail;
  }
  function tPDF(t, v) { if (!isFinite(v)) return phi(t); return Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2) - 0.5 * Math.log(v * Math.PI) - (v + 1) / 2 * Math.log(1 + t * t / v)); }
  function chi2CDF(x, k) { return x <= 0 ? 0 : gammaP(k / 2, x / 2); }
  function chi2PDF(x, k) { if (x <= 0) return k === 2 ? (x === 0 ? 0.5 : 0) : 0; return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)); }
  function fCDF(x, d1, d2) { if (x <= 0) return 0; if (!isFinite(d2)) return chi2CDF(x * d1, d1); return ibeta(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2); }
  function fPDF(x, d1, d2) {
    if (x <= 0) return 0;
    if (!isFinite(d2)) return d1 * chi2PDF(d1 * x, d1);
    return Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2)));
  }
  function invert(cdf, p, lo, hi) { // monotone increasing cdf
    var it = 0;
    while (cdf(hi) < p && it++ < 200) hi *= 2;
    for (it = 0; it < 300; it++) { var mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; if (hi - lo < 1e-13 * Math.max(1, Math.abs(mid))) break; }
    return (lo + hi) / 2;
  }
  function tInv(p, v) { if (!isFinite(v)) return invPhi(p); if (p === 0.5) return 0; return p < 0.5 ? -tInv(1 - p, v) : invert(function (t) { return tCDF(t, v); }, p, 0, 10); }
  function chi2Inv(p, k) { return invert(function (x) { return chi2CDF(x, k); }, p, 0, Math.max(10, 2 * k)); }
  function fInv(p, d1, d2) { return invert(function (x) { return fCDF(x, d1, d2); }, p, 0, 10); }
  function binomPMF(k, n, p) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0; if (p === 1) return k === n ? 1 : 0;
    return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  PC.dist = { lgamma: lgamma, erfc: erfc, Phi: Phi, phi: phi, invPhi: invPhi, ibeta: ibeta, gammaP: gammaP, tCDF: tCDF, tPDF: tPDF, tInv: tInv,
    chi2CDF: chi2CDF, chi2PDF: chi2PDF, chi2Inv: chi2Inv, fCDF: fCDF, fPDF: fPDF, fInv: fInv, binomPMF: binomPMF };

  // ======================================================================= descriptive statistics
  function parseData(src) {
    return String(src).replace(/[−–]/g, "-").split(/[\s,;]+/).filter(Boolean).map(Number).filter(function (v) { return isFinite(v); });
  }
  function quantPos(sorted, pos) { // 1-based position with linear interpolation
    var n = sorted.length;
    if (pos <= 1) return sorted[0];
    if (pos >= n) return sorted[n - 1];
    var i = Math.floor(pos), f = pos - i;
    return sorted[i - 1] + f * (sorted[i] - sorted[i - 1]);
  }
  function describe(xs) {
    var n = xs.length; if (!n) return null;
    var s = xs.slice().sort(function (a, b) { return a - b; }), sum = 0, i;
    for (i = 0; i < n; i++) sum += s[i];
    var mean = sum / n, ss = 0, mad = 0;
    for (i = 0; i < n; i++) { ss += (s[i] - mean) * (s[i] - mean); mad += Math.abs(s[i] - mean); }
    var cnt = {}, best = 0; s.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; best = Math.max(best, cnt[v]); });
    var modes = best > 1 ? Object.keys(cnt).filter(function (k) { return cnt[k] === best; }).map(Number).sort(function (a, b) { return a - b; }) : [];
    var q1 = quantPos(s, (n + 1) / 4), q2 = quantPos(s, (n + 1) / 2), q3 = quantPos(s, 3 * (n + 1) / 4), iqr = q3 - q1;
    var lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    return { n: n, sorted: s, sum: sum, mean: mean, median: q2, modes: modes, modeCount: best, min: s[0], max: s[n - 1], range: s[n - 1] - s[0],
      varP: ss / n, sdP: Math.sqrt(ss / n), varS: n > 1 ? ss / (n - 1) : NaN, sdS: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, mad: mad / n,
      q1: q1, q3: q3, iqr: iqr, fenceLo: lo, fenceHi: hi, outliers: s.filter(function (v) { return v < lo || v > hi; }),
      whiskerLo: s.filter(function (v) { return v >= lo; })[0], whiskerHi: s.filter(function (v) { return v <= hi; }).slice(-1)[0] };
  }
  function regress(xs, ys) {
    var n = Math.min(xs.length, ys.length), sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxy += xs[i] * ys[i]; sxx += xs[i] * xs[i]; syy += ys[i] * ys[i]; }
    var Sxx = sxx - sx * sx / n, Syy = syy - sy * sy / n, Sxy = sxy - sx * sy / n, b = Sxy / Sxx, a = sy / n - b * sx / n;
    return { n: n, sx: sx, sy: sy, sxy: sxy, sxx: sxx, syy: syy, Sxx: Sxx, Syy: Syy, Sxy: Sxy, slope: b, icpt: a, r: Sxy / Math.sqrt(Sxx * Syy) };
  }
  PC.stat = { parse: parseData, describe: describe, quantPos: quantPos, regress: regress };

  if (!DOC) { if (typeof module !== "undefined" && module.exports) module.exports = PC; return; }

  // ======================================================================= SVG plot (sized to its box)
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) hi = lo + 1;
    var raw = (hi - lo) / (n || 6), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p, out = [];
    for (var t = Math.ceil(lo / step - 1e-9) * step; t <= hi + 1e-9 * step; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : +t.toPrecision(10));
    return out;
  }
  PC.niceTicks = niceTicks;
  var uidN = 0;
  function plot(o) {
    var W = o.w, H = o.h, Lm = o.left || 38, R = 10, T = 10, B = o.xlabel ? 34 : 24;
    var pw = W - Lm - R, ph = H - T - B, xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax;
    if (o.equal) { var yc = (ymin + ymax) / 2, span = (xmax - xmin) * ph / pw; ymin = yc - span / 2; ymax = yc + span / 2; }
    var sx = function (x) { return Lm + (x - xmin) / (xmax - xmin) * pw; };
    var sy = function (y) { return T + (ymax - y) / (ymax - ymin) * ph; };
    var f1 = function (v) { return (Math.round(v * 10) / 10).toString(); };
    var id = "pcc" + (++uidN);
    var s = '<svg class="pc-plot" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : "") + ">";
    var xt = o.xt || niceTicks(xmin, xmax, Math.max(3, Math.round(pw / 70))).map(function (t) { return [t, fmt(t, 3)]; });
    var yt = o.yt || niceTicks(ymin, ymax, Math.max(3, Math.round(ph / 45))).map(function (t) { return [t, fmt(t, 3)]; });
    s += '<g class="pc-grid">';
    xt.forEach(function (t) { s += '<line x1="' + f1(sx(t[0])) + '" x2="' + f1(sx(t[0])) + '" y1="' + T + '" y2="' + (H - B) + '"/>'; });
    yt.forEach(function (t) { s += '<line x1="' + Lm + '" x2="' + (W - R) + '" y1="' + f1(sy(t[0])) + '" y2="' + f1(sy(t[0])) + '"/>'; });
    s += "</g>";
    var x0 = o.xaxisAt == null ? 0 : o.xaxisAt;
    if (ymin <= 0 && ymax >= 0) s += '<line class="pc-axis" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + f1(sy(0)) + '" y2="' + f1(sy(0)) + '"/>';
    if (xmin <= x0 && xmax >= x0 && !o.noYaxis) s += '<line class="pc-axis" x1="' + f1(sx(x0)) + '" x2="' + f1(sx(x0)) + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    s += '<g class="pc-tick">';
    xt.forEach(function (t) { s += '<text x="' + f1(sx(t[0])) + '" y="' + (H - B + 15) + '" text-anchor="middle">' + t[1] + "</text>"; });
    yt.forEach(function (t) { s += '<text x="' + (Lm - 5) + '" y="' + f1(sy(t[0]) + 4) + '" text-anchor="end">' + t[1] + "</text>"; });
    s += "</g>";
    if (o.xlabel) s += '<text class="pc-axl" x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end">' + o.xlabel + "</text>";
    if (o.ylabel) s += '<text class="pc-axl" x="' + (Lm + 4) + '" y="' + (T + 12) + '">' + o.ylabel + "</text>";
    s += '<clipPath id="' + id + '"><rect x="' + Lm + '" y="' + T + '" width="' + pw + '" height="' + ph + '"/></clipPath><g clip-path="url(#' + id + ')">';
    (o.bands || []).forEach(function (b) {
      var a = sx(Math.max(b.x0, xmin)), c = sx(Math.min(b.x1, xmax));
      if (c > a) s += '<rect x="' + f1(a) + '" y="' + T + '" width="' + f1(c - a) + '" height="' + ph + '" fill="' + (b.color || "var(--signal)") + '" opacity="' + (b.op || 0.1) + '"/>';
    });
    (o.areas || []).forEach(function (ar) {
      var pts = ar.pts.filter(function (p) { return isFinite(p[1]); });
      if (pts.length < 2) return;
      var base = ar.base || 0, d = "M" + f1(sx(pts[0][0])) + " " + f1(sy(base));
      pts.forEach(function (p) { d += "L" + f1(sx(p[0])) + " " + f1(sy(Math.max(ymin - 1, Math.min(ymax + 1, p[1])))); });
      d += "L" + f1(sx(pts[pts.length - 1][0])) + " " + f1(sy(base)) + "Z";
      s += '<path d="' + d + '" fill="' + (ar.color || "var(--accent)") + '" opacity="' + (ar.op || 0.2) + '" stroke="none"/>';
    });
    (o.polys || []).forEach(function (pg) {
      s += '<polygon points="' + pg.pts.map(function (p) { return f1(sx(p[0])) + "," + f1(sy(p[1])); }).join(" ") + '" fill="' + (pg.fill || "none") + '" stroke="' + (pg.color || "var(--ink-3)") + '" stroke-width="' + (pg.width || 1.5) + '"' + (pg.op ? ' fill-opacity="' + pg.op + '"' : "") + "/>";
    });
    var span = ymax - ymin;
    (o.series || []).forEach(function (se) {
      var d = "", pen = false, prev = null;
      se.pts.forEach(function (p) {
        var ok = isFinite(p[1]) && p[1] > ymin - 4 * span && p[1] < ymax + 4 * span;
        if (ok && pen && prev && Math.abs(p[1] - prev[1]) > 2.5 * span) pen = false;
        if (!ok) { pen = false; prev = null; return; }
        d += (pen ? "L" : "M") + f1(sx(p[0])) + " " + f1(sy(p[1]));
        pen = true; prev = p;
      });
      if (d) s += '<path d="' + d + '" fill="none" stroke="' + (se.color || "var(--accent)") + '" stroke-width="' + (se.width || 2.2) + '"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : "") + ' stroke-linejoin="round" stroke-linecap="round"/>';
    });
    (o.vlines || []).forEach(function (v) { if (v.x < xmin || v.x > xmax) return; s += '<line x1="' + f1(sx(v.x)) + '" x2="' + f1(sx(v.x)) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + (v.color || "var(--ink-3)") + '" stroke-dasharray="' + (v.dash || "5 4") + '" stroke-width="' + (v.width || 1.3) + '"/>' + (v.label ? '<text class="pc-ann" x="' + f1(sx(v.x) + 4) + '" y="' + (T + 12) + '" fill="' + (v.color || "var(--ink-2)") + '">' + v.label + "</text>" : ""); });
    (o.hlines || []).forEach(function (v) { if (v.y < ymin || v.y > ymax) return; s += '<line x1="' + Lm + '" x2="' + (W - R) + '" y1="' + f1(sy(v.y)) + '" y2="' + f1(sy(v.y)) + '" stroke="' + (v.color || "var(--ink-3)") + '" stroke-dasharray="' + (v.dash || "5 4") + '" stroke-width="' + (v.width || 1.3) + '"/>' + (v.label ? '<text class="pc-ann" x="' + (W - R - 4) + '" y="' + f1(sy(v.y) - 5) + '" text-anchor="end" fill="' + (v.color || "var(--ink-2)") + '">' + v.label + "</text>" : ""); });
    (o.segs || []).forEach(function (g) { s += '<line x1="' + f1(sx(g.x1)) + '" y1="' + f1(sy(g.y1)) + '" x2="' + f1(sx(g.x2)) + '" y2="' + f1(sy(g.y2)) + '" stroke="' + (g.color || "var(--signal)") + '" stroke-width="' + (g.width || 1.8) + '"' + (g.dash ? ' stroke-dasharray="' + g.dash + '"' : "") + "/>"; });
    s += "</g>";
    (o.marks || []).forEach(function (m) {
      if (!isFinite(m.y) || m.y < ymin || m.y > ymax || m.x < xmin || m.x > xmax) return;
      var X = sx(m.x), Y = sy(m.y);
      s += '<circle cx="' + f1(X) + '" cy="' + f1(Y) + '" r="' + (m.r || 4.5) + '" fill="' + (m.open ? "var(--paper)" : (m.color || "var(--accent)")) + '" stroke="' + (m.color || "var(--accent)") + '" stroke-width="2"' + (m.cls ? ' class="' + m.cls + '"' : "") + "/>";
      if (m.label) {
        var right = X < W - 90, up = Y > T + 18;
        s += '<text class="pc-ann pc-mk" x="' + f1(X + (right ? 7 : -7)) + '" y="' + f1(Y + (up ? -8 : 16)) + '" text-anchor="' + (right ? "start" : "end") + '">' + m.label + "</text>";
      }
    });
    (o.texts || []).forEach(function (t) { s += '<text class="pc-ann" x="' + f1(sx(t.x)) + '" y="' + f1(sy(t.y)) + '" text-anchor="' + (t.anchor || "middle") + '"' + (t.color ? ' fill="' + t.color + '"' : "") + ">" + t.s + "</text>"; });
    s += "</svg>";
    return { svg: s, sx: sx, sy: sy, ix: function (px) { return xmin + (px - Lm) / pw * (xmax - xmin); }, iy: function (py) { return ymax - (py - T) / ph * (ymax - ymin); }, ymin: ymin, ymax: ymax };
  }
  PC.plot = plot;
  // size a plot to its host: real pixels, so labels stay readable on phones
  function plotIn(host, o) {
    var cw = host.clientWidth || 600;
    o.w = Math.round(Math.max(260, Math.min(o.maxW || 760, cw)));
    var ratio = o.ratio || 0.6;
    o.h = Math.round(Math.max(o.minH || 210, Math.min(o.maxH || 400, o.w * (o.w < 480 ? Math.max(ratio, 0.72) : ratio))));
    var r = plot(o);
    host.innerHTML = r.svg;
    return r;
  }
  PC.plotIn = plotIn;
  function sample(f, a, b, n) {
    var out = [], i, x; n = n || 600;
    for (i = 0; i <= n; i++) { x = a + (b - a) * i / n; var y; try { y = f(x); } catch (e) { y = NaN; } out.push([x, y]); }
    return out;
  }
  PC.sample = sample;
  // y-range of finite samples, clipped, with padding
  function yRange(series, clip, pad) {
    var lo = Infinity, hi = -Infinity;
    series.forEach(function (pts) { pts.forEach(function (p) { if (isFinite(p[1]) && Math.abs(p[1]) <= clip) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); } }); });
    if (!isFinite(lo)) { lo = -5; hi = 5; }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var p = (hi - lo) * (pad == null ? 0.1 : pad);
    return [lo - p, hi + p];
  }
  PC.yRange = yRange;

  // ======================================================================= UI helpers
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  PC.esc = esc;
  function tex(src, display) {
    if (root.katex) { try { return root.katex.renderToString(src, { displayMode: !!display, throwOnError: false, strict: "ignore" }); } catch (e) { /* fall through */ } }
    return "<code>" + esc(src) + "</code>";
  }
  PC.tex = tex;
  var nid = 0;
  // controls: defs = [{k, t:"range"|"num"|"text"|"sel"|"chk"|"area", lab, min, max, step, opts:[[v, label]], wide, ph, show}]
  function controls(box, defs, st, onChange) {
    var wrap = document.createElement("div");
    wrap.className = "pc-ctl";
    var sync = {};
    defs.forEach(function (d) {
      var id = "pci" + (++nid), row = document.createElement("div");
      row.className = "pc-f pc-f-" + d.t + (d.wide ? " pc-wide" : "");
      if (d.t === "range") {
        row.innerHTML = '<label for="' + id + '"><span>' + d.lab + '</span><input type="number" class="pc-n" aria-label="' + esc(stripTags(d.lab)) + '" step="any"></label><input id="' + id + '" type="range" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '">';
        var rg = row.querySelector("input[type=range]"), nm = row.querySelector(".pc-n");
        rg.addEventListener("input", function () { st[d.k] = +rg.value; nm.value = +(+rg.value).toFixed(6); onChange(d.k); });
        nm.addEventListener("change", function () { var v = parseFloat(String(nm.value).replace("−", "-")); if (!isFinite(v)) return; st[d.k] = v; rg.value = v; onChange(d.k); });
        sync[d.k] = function () { rg.value = st[d.k]; nm.value = +(+st[d.k]).toFixed(6); };
      } else if (d.t === "sel") {
        row.innerHTML = '<label for="' + id + '"><span>' + d.lab + '</span></label><select id="' + id + '">' + d.opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + o[1] + "</option>"; }).join("") + "</select>";
        var se = row.querySelector("select");
        se.addEventListener("change", function () { st[d.k] = se.value; onChange(d.k); });
        sync[d.k] = function () { se.value = st[d.k]; };
      } else if (d.t === "chk") {
        row.innerHTML = '<label class="pc-chk"><input id="' + id + '" type="checkbox"> <span>' + d.lab + "</span></label>";
        var cb = row.querySelector("input");
        cb.addEventListener("change", function () { st[d.k] = cb.checked; onChange(d.k); });
        sync[d.k] = function () { cb.checked = !!st[d.k]; };
      } else if (d.t === "area") {
        row.innerHTML = '<label for="' + id + '"><span>' + d.lab + '</span></label><textarea id="' + id + '" rows="' + (d.rows || 3) + '" spellcheck="false"' + (d.ph ? ' placeholder="' + esc(d.ph) + '"' : "") + "></textarea>";
        var ta = row.querySelector("textarea");
        ta.addEventListener("input", function () { st[d.k] = ta.value; onChange(d.k); });
        sync[d.k] = function () { if (ta.value !== st[d.k]) ta.value = st[d.k]; };
      } else { // text / num
        row.innerHTML = '<label for="' + id + '"><span>' + d.lab + '</span></label><input id="' + id + '" type="' + (d.t === "num" ? "number" : "text") + '"' + (d.t === "num" ? ' step="any"' : ' autocomplete="off" spellcheck="false" autocapitalize="off"') + (d.ph ? ' placeholder="' + esc(d.ph) + '"' : "") + ">";
        var ip = row.querySelector("input");
        ip.addEventListener("input", function () { st[d.k] = d.t === "num" ? parseFloat(ip.value) : ip.value; onChange(d.k); });
        sync[d.k] = function () { if (String(ip.value) !== String(st[d.k])) ip.value = st[d.k]; };
      }
      if (d.show) row.setAttribute("data-show", d.show);
      wrap.appendChild(row);
    });
    box.appendChild(wrap);
    var api = {
      el: wrap,
      sync: function () { Object.keys(sync).forEach(function (k) { if (st[k] != null) sync[k](); }); api.vis(); },
      vis: function () { // rows with data-show="key:v1|v2"
        wrap.querySelectorAll("[data-show]").forEach(function (r) {
          var sp = r.getAttribute("data-show").split(":"), ok = sp[1].split("|").indexOf(String(st[sp[0]])) >= 0;
          r.hidden = !ok;
        });
      }
    };
    api.sync();
    return api;
  }
  PC.controls = controls;
  function stripTags(s) { return String(s).replace(/<[^>]+>/g, ""); }
  function attrs(box, defaults) { // data-* → state (numbers where the default is a number)
    var st = {};
    Object.keys(defaults).forEach(function (k) {
      var v = box.getAttribute("data-" + k);
      if (v == null) st[k] = defaults[k];
      else if (typeof defaults[k] === "number") st[k] = parseFloat(v);
      else if (typeof defaults[k] === "boolean") st[k] = v !== "false";
      else st[k] = v;
    });
    return st;
  }
  PC.attrs = attrs;
  function part(box, cls, tag) { var e = document.createElement(tag || "div"); e.className = cls; box.appendChild(e); return e; }
  PC.part = part;
  function head(box, title, hint) {
    var h = part(box, "pc-head");
    h.innerHTML = "<b>" + title + "</b>" + (hint ? '<span class="pc-hint">' + hint + "</span>" : "");
    return h;
  }
  PC.head = head;
  function dl(rows) { // [[label, value-html], …]
    return '<dl class="pc-dl">' + rows.filter(Boolean).map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") + "</dl>";
  }
  PC.dl = dl;
  function errBox(msg) { return '<p class="pc-err" role="alert">' + esc(msg) + "</p>"; }
  PC.errBox = errBox;
  function interval(a, b, ca, cb) { // interval TeX
    var l = a === -Infinity ? "(-\\infty" : (ca ? "[" : "(") + nice(a);
    var r = b === Infinity ? "\\infty)" : nice(b) + (cb ? "]" : ")");
    return l + ",\\ " + r;
  }
  PC.interval = interval;

  // widget registry + boot
  var REG = {};
  PC.widget = function (cls, init) { REG[cls] = init; };
  function mount(box, cls) {
    if (box._pc) return;
    box._pc = true;
    box.classList.add("pc-lab");
    box.innerHTML = "";
    var redraw = null, lastW = 0, raf = 0;
    var api = REG[cls](box) || {};
    redraw = api.render;
    box._set = function (o) { if (api.set) api.set(o); };
    if (redraw && root.ResizeObserver) {
      new ResizeObserver(function () {
        var w = box.clientWidth;
        if (Math.abs(w - lastW) < 16) return;
        lastW = w;
        cancelAnimationFrame(raf); raf = requestAnimationFrame(redraw);
      }).observe(box);
    }
  }
  // standard widget skeleton: state from data-*, controls, figure, output, render throttled to one frame
  PC.make = function (box, defaults, defs, draw, opt) {
    opt = opt || {};
    var st = attrs(box, defaults);
    if (opt.title) head(box, opt.title, opt.hint);
    var raf = 0, ctl;
    function render() { ctl.vis(); try { draw(st, ui); } catch (e) { ui.out.innerHTML = errBox(e.message); if (ui.fig) ui.fig.innerHTML = ""; } }
    function later() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
    ctl = controls(box, typeof defs === "function" ? defs(st) : defs, st, function (k) { if (opt.onKey) opt.onKey(k, st, ctl); later(); });
    var ui = { st: st, ctl: ctl, fig: opt.noFig ? null : part(box, "pc-fig"), out: part(box, "pc-out"), extra: opt.extra ? part(box, "pc-extra") : null };
    if (opt.after) opt.after(st, ui, later);
    render();
    return { render: render, set: function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); ctl.sync(); if (opt.onSet) opt.onSet(st, ui); render(); }, st: st, ui: ui };
  };
  PC.boot = function () {
    Object.keys(REG).forEach(function (cls) { document.querySelectorAll("." + cls).forEach(function (b) { mount(b, cls); }); });
  };
  if (!PC._btn) {
    PC._btn = true;
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-pc-set]");
      if (!b) return;
      var t = document.getElementById(b.getAttribute("data-pc-target"));
      if (!t || !t._set) return;
      var d = t.closest("details"); if (d && !d.open) d.open = true;
      try { t._set(JSON.parse(b.getAttribute("data-pc-set"))); } catch (err) { return; }
      t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ======================================================================= widgets: algebra & functions
  var C = { a: "var(--accent)", b: "var(--signal)", c: "var(--ok)", d: "#8a5cc2", m: "var(--ink-3)" };
  PC.C = C;

  // ---------------------------------------------------------------- quadratic explorer
  PC.widget("pc-quad", function (box) {
    var REL = [["none", L("ไม่มีอสมการ", "no inequality")], [">", "> 0"], [">=", "≥ 0"], ["<", "< 0"], ["<=", "≤ 0"]];
    return PC.make(box, { a: 1, b: -2, c: -3, rel: "none" }, [
      { k: "a", t: "range", lab: "a", min: -5, max: 5, step: 0.5 },
      { k: "b", t: "range", lab: "b", min: -10, max: 10, step: 0.5 },
      { k: "c", t: "range", lab: "c", min: -10, max: 10, step: 0.5 },
      { k: "rel", t: "sel", lab: L("อสมการ ax² + bx + c", "Inequality ax² + bx + c"), opts: REL }
    ], function (st, ui) {
      var a = st.a, b = st.b, c = st.c, rows = [];
      if (![a, b, c].every(isFinite)) throw new Error(L("ใส่ค่า a b c เป็นตัวเลข", "Enter numbers for a, b, c"));
      var fTex = "f(x) = " + polyTex([a, b, c]);
      var roots = [], xs, verdict, sol = null;
      if (Math.abs(a) < 1e-12) {
        if (Math.abs(b) < 1e-12) throw new Error(L("a = b = 0 ไม่ใช่สมการตัวแปร x", "With a = b = 0 there is no x left"));
        roots = [-c / b];
        rows.push([L("ชนิด", "Type"), L("a = 0 จึงเป็นฟังก์ชันเชิงเส้น ไม่ใช่กำลังสอง", "a = 0, so this is linear, not quadratic")]);
        rows.push([L("ราก", "Root"), tex("x = " + nice(-c / b))]);
      } else {
        var D = b * b - 4 * a * c, k = intScale([a, b, c]);
        var h = -b / (2 * a), kv = c - b * b / (4 * a);
        rows.push([L("ดิสคริมิแนนต์", "Discriminant"), tex("D = b^2 - 4ac = " + nice(D))]);
        if (D > 1e-12) verdict = L("D > 0 → มีรากจริงสองค่าที่ต่างกัน กราฟตัดแกน x สองจุด", "D > 0 → two distinct real roots, the graph crosses the x-axis twice");
        else if (D > -1e-12) verdict = L("D = 0 → มีรากจริงซ้ำหนึ่งค่า จุดยอดแตะแกน x", "D = 0 → one repeated real root, the vertex touches the x-axis");
        else verdict = L("D < 0 → ไม่มีรากจริง (รากเป็นจำนวนเชิงซ้อน) กราฟไม่ตัดแกน x", "D < 0 → no real roots (complex roots), the graph misses the x-axis");
        rows.push(["", verdict]);
        var rootTex;
        if (k) {
          var A = Math.round(a * k), B = Math.round(b * k), Cc = Math.round(c * k), DD = B * B - 4 * A * Cc;
          if (DD >= 0) {
            var sq = sqf(DD);
            rootTex = sq[1] === 1 ? (DD === 0 ? "x = " + fracTex(-B, 2 * A) : "x = " + fracTex(-B + sq[0], 2 * A) + ",\\ " + fracTex(-B - sq[0], 2 * A)) : "x = " + surdTex(-B, sq[0], sq[1], 2 * A, 0);
          } else {
            var sq2 = sqf(-DD), g = gcd(gcd(B, sq2[0]), 2 * A) || 1, re = fracTex(-B, 2 * A), imk = sq2[0] / g, den = Math.abs(2 * A / g);
            var im = (imk === 1 ? "" : imk) + (sq2[1] === 1 ? "" : "\\sqrt{" + sq2[1] + "}") + "\\,i";
            if (sq2[1] === 1 && imk === 1) im = "i";
            rootTex = "x = " + (B ? re + " \\pm " : "\\pm ") + (den === 1 ? im : "\\tfrac{" + im + "}{" + den + "}");
          }
        } else rootTex = D >= 0 ? "x = " + nice((-b + Math.sqrt(D)) / (2 * a)) + ",\\ " + nice((-b - Math.sqrt(D)) / (2 * a)) : "x = " + nice(-b / (2 * a)) + " \\pm " + nice(Math.sqrt(-D) / Math.abs(2 * a)) + "i";
        rows.push([L("ราก (สูตรกำลังสอง)", "Roots (quadratic formula)"), tex(rootTex)]);
        if (D >= -1e-12) { var sD = Math.sqrt(Math.max(0, D)); roots = [(-b - sD) / (2 * a), (-b + sD) / (2 * a)].sort(function (p, q) { return p - q; }); }
        rows.push([L("จุดยอด", "Vertex"), tex("(h, k) = \\left(" + nice(h) + ",\\ " + nice(kv) + "\\right)") + " · " + L("แกนสมมาตร ", "axis ") + tex("x = " + nice(h))]);
        rows.push([L("รูปจุดยอด", "Vertex form"), tex("f(x) = " + (a === 1 ? "" : a === -1 ? "-" : nice(a)) + "\\left(x " + (h < 0 ? "+ " + nice(-h) : "- " + nice(h)) + "\\right)^2 " + (kv < 0 ? "- " + nice(-kv) : "+ " + nice(kv)))]);
        if (roots.length === 2 && D >= 0) rows.push([L("รูปแยกตัวประกอบ", "Factored form"), tex("f(x) = " + factorTex(D < 1e-12 ? [{ x: roots[0], m: 2 }] : [{ x: roots[0], m: 1 }, { x: roots[1], m: 1 }], a))]);
        rows.push([L("ผลบวก · ผลคูณราก", "Sum · product of roots"), tex("x_1 + x_2 = -\\tfrac{b}{a} = " + nice(-b / a) + ",\\quad x_1 x_2 = \\tfrac{c}{a} = " + nice(c / a))]);
        rows.push([a > 0 ? L("ค่าต่ำสุด", "Minimum value") : L("ค่าสูงสุด", "Maximum value"), tex(nice(kv)) + L(" ที่ x = ", " at x = ") + tex(nice(h)) + " · " + L("เรนจ์ ", "range ") + tex(a > 0 ? "[" + nice(kv) + ", \\infty)" : "(-\\infty, " + nice(kv) + "]")]);
        // inequality
        if (st.rel !== "none") {
          var strict = st.rel === ">" || st.rel === "<", want = st.rel[0] === ">" ? 1 : -1;
          var sgnOut = a > 0 ? 1 : -1, parts = [];
          if (D > 1e-12) {
            var r1 = roots[0], r2 = roots[1];
            if (want === sgnOut) { parts = [[-Infinity, r1, false, !strict], [r2, Infinity, !strict, false]]; }
            else parts = [[r1, r2, !strict, !strict]];
          } else if (D > -1e-12) {
            var r0 = h;
            if (want === sgnOut) parts = strict ? [[-Infinity, r0, false, false], [r0, Infinity, false, false]] : [[-Infinity, Infinity, false, false]];
            else parts = strict ? [] : [[r0, r0, true, true]];
          } else parts = want === sgnOut ? [[-Infinity, Infinity, false, false]] : [];
          var setTex = !parts.length ? "\\varnothing" : parts.map(function (p) { return p[0] === p[1] ? "\\{" + nice(p[0]) + "\\}" : p[0] === -Infinity && p[1] === Infinity ? "\\mathbb{R}" : interval(p[0], p[1], p[2], p[3]); }).join(" \\cup ");
          rows.push([L("คำตอบอสมการ", "Solution set"), tex(polyTex([a, b, c]) + (st.rel === ">" ? " > " : st.rel === ">=" ? " \\ge " : st.rel === "<" ? " < " : " \\le ") + "0 \\iff x \\in " + setTex)]);
          sol = parts;
        }
      }
      // plot
      var spread = roots.length > 1 ? Math.max(2.5, Math.abs(roots[1] - roots[0]) * 0.8 + 1) : 3;
      var cx = Math.abs(a) > 1e-12 ? -b / (2 * a) : roots[0];
      var x0 = cx - spread, x1 = cx + spread;
      var f = function (x) { return a * x * x + b * x + c; }, pts = sample(f, x0, x1, 300);
      var yr = yRange([pts], 1e6, 0.12);
      var marks = roots.map(function (r) { return { x: r, y: 0, color: C.b, label: "x = " + fmt(r, 3) }; });
      if (Math.abs(a) > 1e-12) marks.push({ x: cx, y: f(cx), color: C.a, label: L("จุดยอด", "vertex") });
      marks.push({ x: 0, y: c, color: C.c, r: 3.5 });
      plotIn(ui.fig, { xmin: x0, xmax: x1, ymin: yr[0], ymax: yr[1], series: [{ pts: pts }], marks: marks,
        vlines: Math.abs(a) > 1e-12 ? [{ x: cx, color: C.m }] : [],
        bands: (sol || []).map(function (p) { return { x0: p[0] === p[1] ? p[0] - 0.05 : p[0], x1: p[0] === p[1] ? p[0] + 0.05 : p[1], color: C.c, op: 0.16 }; }),
        label: "parabola", xlabel: "x", ylabel: "y" });
      ui.out.innerHTML = '<p class="pc-eq">' + tex(fTex, false) + "</p>" + dl(rows);
    }, { title: L("แล็บพาราโบลา y = ax² + bx + c", "Parabola lab y = ax² + bx + c"), hint: L("เลื่อนสไลเดอร์หรือพิมพ์ค่า", "drag a slider or type a value") });
  });

  // ---------------------------------------------------------------- function lab
  PC.widget("pc-fn", function (box) {
    var OPS = [["f", "f(x)"], ["g", "g(x)"], ["sum", "(f + g)(x)"], ["diff", "(f − g)(x)"], ["prod", "(f · g)(x)"], ["quot", "(f / g)(x)"], ["fog", "(f ∘ g)(x) = f(g(x))"], ["gof", "(g ∘ f)(x) = g(f(x))"]];
    return PC.make(box, { f: "sqrt(x+2)", g: "x^2-1", op: "f", x0: 1, x1: 3, xmin: -6, xmax: 6, sec: true }, [
      { k: "f", t: "text", lab: "f(x) =", ph: "sqrt(x+2)" },
      { k: "g", t: "text", lab: "g(x) =", ph: "x^2-1" },
      { k: "op", t: "sel", lab: L("ฟังก์ชันที่วาด", "Plot"), opts: OPS },
      { k: "x0", t: "range", lab: "x₁", min: -10, max: 10, step: 0.1 },
      { k: "x1", t: "range", lab: "x₂", min: -10, max: 10, step: 0.1 },
      { k: "xmin", t: "num", lab: L("x ต่ำสุด", "x min") },
      { k: "xmax", t: "num", lab: L("x สูงสุด", "x max") },
      { k: "sec", t: "chk", lab: L("แสดงเส้นตัดและอัตราการเปลี่ยนแปลงเฉลี่ย", "show the secant line and average rate of change") }
    ], function (st, ui) {
      var f = PC.parse(st.f), g = PC.parse(st.g), op = st.op;
      var H = { f: f, g: g, sum: function (x) { return f(x) + g(x); }, diff: function (x) { return f(x) - g(x); }, prod: function (x) { return f(x) * g(x); },
        quot: function (x) { var d = g(x); return Math.abs(d) < 1e-14 ? NaN : f(x) / d; }, fog: function (x) { return f(g(x)); }, gof: function (x) { return g(f(x)); } }[op];
      var xmin = isFinite(st.xmin) ? st.xmin : -6, xmax = isFinite(st.xmax) && st.xmax > xmin ? st.xmax : xmin + 12;
      var pts = sample(H, xmin, xmax, 700), yr = yRange([pts], 60, 0.1);
      // undefined stretches → shaded bands
      var bands = [], st0 = null;
      pts.forEach(function (p, i) {
        var bad = !isFinite(p[1]);
        if (bad && st0 == null) st0 = p[0];
        if ((!bad || i === pts.length - 1) && st0 != null) { bands.push({ x0: st0 - (xmax - xmin) / 1400, x1: bad ? p[0] : pts[i - 1][0] + (xmax - xmin) / 1400, color: "var(--ink-3)", op: 0.12 }); st0 = null; }
      });
      var series = [{ pts: pts }];
      if (op !== "f" && op !== "g") { series.unshift({ pts: sample(f, xmin, xmax, 400), color: C.m, width: 1.2, dash: "4 4" }); series.unshift({ pts: sample(g, xmin, xmax, 400), color: C.b, width: 1.2, dash: "2 3" }); }
      var y0 = H(st.x0), y1 = H(st.x1), marks = [], segs = [];
      if (isFinite(y0)) marks.push({ x: st.x0, y: y0, color: C.a, label: "(" + fmt(st.x0, 2) + ", " + fmt(y0, 3) + ")" });
      if (st.sec && isFinite(y1)) {
        marks.push({ x: st.x1, y: y1, color: C.c, label: "(" + fmt(st.x1, 2) + ", " + fmt(y1, 3) + ")" });
        if (isFinite(y0) && st.x1 !== st.x0) { var m = (y1 - y0) / (st.x1 - st.x0); segs.push({ x1: xmin, y1: y0 + m * (xmin - st.x0), x2: xmax, y2: y0 + m * (xmax - st.x0), color: C.c, dash: "6 4", width: 1.5 }); }
      }
      plotIn(ui.fig, { xmin: xmin, xmax: xmax, ymin: yr[0], ymax: yr[1], series: series, marks: marks, segs: segs, bands: bands, xlabel: "x", ylabel: "y", label: "function graph" });
      var name = OPS.filter(function (o) { return o[0] === op; })[0][1].split(" =")[0];
      var rows = [];
      var chain = function (x) {
        if (op === "fog") { var gi = g(x); return "g(" + fmt(x, 3) + ") = " + fmt(gi, 4) + " → f(" + fmt(gi, 4) + ") = " + fmt(f(gi), 4); }
        if (op === "gof") { var fi = f(x); return "f(" + fmt(x, 3) + ") = " + fmt(fi, 4) + " → g(" + fmt(fi, 4) + ") = " + fmt(g(fi), 4); }
        return name.replace("(x)", "(" + fmt(x, 3) + ")") + " = " + (isFinite(H(x)) ? fmt(H(x), 5) : L("ไม่นิยาม (อยู่นอกโดเมน)", "undefined (outside the domain)"));
      };
      rows.push([L("ที่ x₁", "At x₁"), chain(st.x0)]);
      if (st.sec) {
        rows.push([L("ที่ x₂", "At x₂"), chain(st.x1)]);
        if (isFinite(y0) && isFinite(y1) && st.x1 !== st.x0) rows.push([L("อัตราการเปลี่ยนแปลงเฉลี่ย", "Average rate of change"), tex("\\dfrac{" + "f(x_2) - f(x_1)}{x_2 - x_1} = \\dfrac{" + nice(y1) + " - (" + nice(y0) + ")}{" + nice(st.x1) + " - (" + nice(st.x0) + ")} = " + nice((y1 - y0) / (st.x1 - st.x0)))]);
      }
      var fin = pts.filter(function (p) { return isFinite(p[1]); });
      if (fin.length) {
        var lo = Math.min.apply(null, fin.map(function (p) { return p[1]; })), hi = Math.max.apply(null, fin.map(function (p) { return p[1]; }));
        rows.push([L("y ต่ำสุด–สูงสุดในกรอบนี้", "Lowest–highest y in this window"), fmt(lo, 3) + " … " + fmt(hi, 3)]);
      }
      if (bands.length) rows.push([L("แถบสีเทา", "Grey bands"), L("ช่วงของ x ที่ฟังก์ชันไม่นิยาม คือส่วนที่อยู่นอกโดเมน", "values of x where the function is undefined, i.e. outside its domain")]);
      ui.out.innerHTML = dl(rows);
    }, { title: L("แล็บฟังก์ชัน: พิมพ์ f และ g", "Function lab: type f and g"), hint: L("รองรับ sqrt abs ln log sin cos ^ เช่น 2x^2-3, 1/(x-1), |x|", "supports sqrt abs ln log sin cos ^, e.g. 2x^2-3, 1/(x-1), |x|") });
  });

  // ---------------------------------------------------------------- transformations y = a·f(b(x − h)) + k
  var PARENTS = {
    x2: { f: function (x) { return x * x; }, tex: "x^2", name: "x²", pts: [-2, -1, 0, 1, 2], dom: "R", rng: [0, Infinity, true] },
    x3: { f: function (x) { return x * x * x; }, tex: "x^3", name: "x³", pts: [-1, 0, 1], dom: "R", rng: "R" },
    abs: { f: Math.abs, tex: "|x|", name: "|x|", pts: [-2, 0, 2], dom: "R", rng: [0, Infinity, true] },
    sqrt: { f: Math.sqrt, tex: "\\sqrt{x}", name: "√x", pts: [0, 1, 4], dom: [0, Infinity, true], rng: [0, Infinity, true] },
    cbrt: { f: Math.cbrt, tex: "\\sqrt[3]{x}", name: "∛x", pts: [-1, 0, 1], dom: "R", rng: "R" },
    recip: { f: function (x) { return Math.abs(x) < 1e-12 ? NaN : 1 / x; }, tex: "\\tfrac{1}{x}", name: "1/x", pts: [-1, 1, 2], dom: "x≠", rng: "y≠", va: 0, ha: 0 },
    exp2: { f: function (x) { return Math.pow(2, x); }, tex: "2^{x}", name: "2ˣ", pts: [-1, 0, 1, 2], dom: "R", rng: [0, Infinity, false], ha: 0 },
    log2: { f: function (x) { return x > 0 ? Math.log2(x) : NaN; }, tex: "\\log_2 x", name: "log₂x", pts: [0.5, 1, 2, 4], dom: [0, Infinity, false], rng: "R", va: 0 },
    sin: { f: Math.sin, tex: "\\sin x", name: "sin x", pts: [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2], dom: "R", rng: [-1, 1, true] },
    floor: { f: Math.floor, tex: "\\lfloor x \\rfloor", name: "⌊x⌋", pts: [0, 1, 2], dom: "R", rng: "Z" }
  };
  PC.PARENTS = PARENTS;
  PC.widget("pc-tr", function (box) {
    return PC.make(box, { parent: "x2", a: 1, b: 1, h: 0, k: 0 }, [
      { k: "parent", t: "sel", lab: L("ฟังก์ชันต้นแบบ f(x)", "Parent function f(x)"), opts: Object.keys(PARENTS).map(function (k) { return [k, PARENTS[k].name]; }) },
      { k: "a", t: "range", lab: L("a (ยืดแนวตั้ง · สะท้อนแกน x)", "a (vertical stretch · reflect in x-axis)"), min: -4, max: 4, step: 0.25 },
      { k: "b", t: "range", lab: L("b (ยืด-หดแนวนอน · สะท้อนแกน y)", "b (horizontal stretch · reflect in y-axis)"), min: -4, max: 4, step: 0.25 },
      { k: "h", t: "range", lab: L("h (เลื่อนซ้าย-ขวา)", "h (shift left/right)"), min: -6, max: 6, step: 0.5 },
      { k: "k", t: "range", lab: L("k (เลื่อนขึ้น-ลง)", "k (shift up/down)"), min: -6, max: 6, step: 0.5 }
    ], function (st, ui) {
      var P = PARENTS[st.parent], a = st.a, b = st.b, h = st.h, k = st.k;
      if (Math.abs(b) < 1e-9) throw new Error(L("b ต้องไม่เป็นศูนย์", "b must not be zero"));
      var g = function (x) { return a * P.f(b * (x - h)) + k; };
      var X0 = -9, X1 = 9, n = st.parent === "floor" ? 1800 : 700;
      var series = [{ pts: sample(P.f, X0, X1, n), color: C.m, width: 1.4, dash: "5 4" }, { pts: sample(g, X0, X1, n) }];
      var marks = [], tableRows = [];
      P.pts.forEach(function (x) {
        var y = P.f(x), X = x / b + h, Y = a * y + k;
        marks.push({ x: x, y: y, color: C.m, r: 3, open: true });
        marks.push({ x: X, y: Y, color: C.a, r: 4 });
        tableRows.push("<tr><td>(" + (st.parent === "sin" ? PC.piTxt(x) : fmt(x, 3)) + ", " + fmt(y, 3) + ")</td><td>→</td><td>(" + fmt(X, 3) + ", " + fmt(Y, 3) + ")</td></tr>");
      });
      var vl = [], hl = [];
      if (P.va != null) vl.push({ x: P.va / b + h, color: C.b, label: "x = " + fmt(P.va / b + h, 3) });
      if (P.ha != null) hl.push({ y: a * P.ha + k, color: C.b, label: "y = " + fmt(a * P.ha + k, 3) });
      plotIn(ui.fig, { xmin: X0, xmax: X1, ymin: -7, ymax: 7, equal: true, series: series, marks: marks, vlines: vl, hlines: hl, xlabel: "x", ylabel: "y", label: "transformation" });
      // equation
      var inner = (b === 1 ? "" : b === -1 ? "-" : nice(b)) + (h === 0 ? "x" : "(x " + (h > 0 ? "- " + nice(h) : "+ " + nice(-h)) + ")");
      if (b !== 1 && h === 0) inner = (b === -1 ? "-" : nice(b)) + "x";
      var body = P.tex.indexOf("x") >= 0 ? P.tex : P.tex;
      var sub = inner === "x" ? P.tex : st.parent === "x2" ? "\\left(" + inner + "\\right)^2" : st.parent === "x3" ? "\\left(" + inner + "\\right)^3" : st.parent === "abs" ? "\\left|" + inner + "\\right|" : st.parent === "sqrt" ? "\\sqrt{" + inner + "}" : st.parent === "cbrt" ? "\\sqrt[3]{" + inner + "}" : st.parent === "recip" ? "\\dfrac{1}{" + inner + "}" : st.parent === "exp2" ? "2^{" + inner + "}" : st.parent === "log2" ? "\\log_2\\left(" + inner + "\\right)" : st.parent === "sin" ? "\\sin\\left(" + inner + "\\right)" : "\\left\\lfloor " + inner + "\\right\\rfloor";
      var eq = "y = " + (a === 1 ? "" : a === -1 ? "-" : nice(a)) + sub + (k === 0 ? "" : k > 0 ? " + " + nice(k) : " - " + nice(-k));
      var steps = [];
      if (h !== 0) steps.push(L("เลื่อนกราฟไปทาง" + (h > 0 ? "ขวา " : "ซ้าย ") + fmt(Math.abs(h)) + " หน่วย (แทน x ด้วย x − h)", "shift " + (h > 0 ? "right " : "left ") + fmt(Math.abs(h)) + (Math.abs(h) === 1 ? " unit" : " units") + " (replace x with x − h)"));
      if (Math.abs(b) !== 1) steps.push(Math.abs(b) > 1 ? L("หดเข้าหาแกน y ในแนวนอน เหลือ 1/" + fmt(Math.abs(b)) + " เท่า", "compress horizontally toward the y-axis by a factor 1/" + fmt(Math.abs(b))) : L("ยืดออกจากแกน y ในแนวนอน " + fmt(1 / Math.abs(b), 3) + " เท่า", "stretch horizontally away from the y-axis by a factor " + fmt(1 / Math.abs(b), 3)));
      if (b < 0) steps.push(L("สะท้อนกับแกน y (เพราะ b < 0)", "reflect in the y-axis (b < 0)"));
      if (Math.abs(a) !== 1) steps.push(Math.abs(a) > 1 ? L("ยืดในแนวตั้ง " + fmt(Math.abs(a)) + " เท่า", "stretch vertically by a factor " + fmt(Math.abs(a))) : L("หดในแนวตั้งเหลือ " + fmt(Math.abs(a)) + " เท่า", "compress vertically by a factor " + fmt(Math.abs(a))));
      if (a < 0) steps.push(L("สะท้อนกับแกน x (เพราะ a < 0)", "reflect in the x-axis (a < 0)"));
      if (k !== 0) steps.push(L("เลื่อนกราฟ" + (k > 0 ? "ขึ้น " : "ลง ") + fmt(Math.abs(k)) + " หน่วย", "shift " + (k > 0 ? "up " : "down ") + fmt(Math.abs(k)) + (Math.abs(k) === 1 ? " unit" : " units")));
      if (!steps.length) steps.push(L("ยังไม่มีการแปลง กราฟทับกราฟต้นแบบ", "no transformation yet, the graph is the parent"));
      var domTxt = function (d, isRange) {
        if (d === "R") return "\\mathbb{R}";
        if (d === "Z") return "\\mathbb{Z}" + (a !== 1 || k !== 0 ? "\\ (" + L("ปรับตาม a, k", "scaled by a, k") + ")" : "");
        if (d === "x≠") return "x \\ne " + nice(P.va / b + h);
        if (d === "y≠") return "y \\ne " + nice(a * P.ha + k);
        var lo, hi, cl = d[2];
        if (isRange) { lo = a > 0 ? a * d[0] + k : a * d[1] + k; hi = a > 0 ? a * d[1] + k : a * d[0] + k; if (st.parent === "exp2" && a < 0) { lo = -Infinity; hi = k; } }
        else { var e1 = d[0] / b + h, e2 = d[1] / b + h; lo = Math.min(e1, e2); hi = Math.max(e1, e2); if (!isFinite(d[1])) { lo = b > 0 ? e1 : -Infinity; hi = b > 0 ? Infinity : e1; } }
        if (isRange && st.parent === "sin") { lo = k - Math.abs(a); hi = k + Math.abs(a); }
        return interval(lo, hi, cl && isFinite(lo), cl && isFinite(hi));
      };
      ui.out.innerHTML = '<p class="pc-eq">' + tex(eq) + "</p>" + dl([
        [L("ลำดับการแปลง", "Order of steps"), "<ol class=\"pc-steps\">" + steps.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol>"],
        [L("จุด (x, y) ไปที่", "Point (x, y) maps to"), tex("\\left(\\dfrac{x}{b} + h,\\ a y + k\\right) = \\left(\\dfrac{x}{" + nice(b) + "} " + (h < 0 ? "- " + nice(-h) : "+ " + nice(h)) + ",\\ " + nice(a) + "y " + (k < 0 ? "- " + nice(-k) : "+ " + nice(k)) + "\\right)")],
        [L("โดเมน", "Domain"), tex(domTxt(P.dom, false))],
        [L("เรนจ์", "Range"), tex(domTxt(P.rng, true))]
      ]) + '<div class="pc-tw"><table class="pc-mini"><thead><tr><th>' + L("จุดบนกราฟต้นแบบ", "Point on the parent") + "</th><th></th><th>" + L("จุดหลังแปลง", "Image point") + "</th></tr></thead><tbody>" + tableRows.join("") + "</tbody></table></div>";
    }, { title: L("แล็บแปลงกราฟ y = a·f(b(x − h)) + k", "Transformation lab y = a·f(b(x − h)) + k"), hint: L("เส้นประ = กราฟต้นแบบ · เส้นทึบ = กราฟหลังแปลง", "dashed = parent · solid = transformed") });
  });

  // ---------------------------------------------------------------- polynomial: build from zeros · synthetic division
  PC.widget("pc-poly", function (box) {
    return PC.make(box, { mode: "build", zeros: "-2, 1, 1, 3", lead: 1, p: "2x^3 - 3x^2 - 11x + 6", c: 3 }, [
      { k: "mode", t: "sel", lab: L("โหมด", "Mode"), opts: [["build", L("สร้างพหุนามจากราก", "Build from zeros")], ["synth", L("หารสังเคราะห์ · หาราก", "Synthetic division · find zeros")]] },
      { k: "zeros", t: "text", lab: L("ราก (ใส่ซ้ำ = รากซ้ำ)", "Zeros (repeat = multiplicity)"), ph: "-2, 1, 1, 3", show: "mode:build" },
      { k: "lead", t: "range", lab: L("สัมประสิทธิ์นำ a", "Leading coefficient a"), min: -3, max: 3, step: 0.25, show: "mode:build" },
      { k: "p", t: "text", lab: L("พหุนามตัวตั้ง P(x)", "Dividend P(x)"), ph: "2x^3 - 3x^2 - 11x + 6", wide: true, show: "mode:synth" },
      { k: "c", t: "num", lab: L("หารด้วย x − c, c =", "Divide by x − c, c ="), show: "mode:synth" }
    ], function (st, ui) {
      var p, rs, a;
      if (st.mode === "build") {
        var zs = String(st.zeros).split(/[,;\s]+/).filter(Boolean).map(function (t) { return PC.evalNum(t); });
        if (!zs.length || zs.some(function (v) { return !isFinite(v); })) throw new Error(L("ใส่รากเป็นตัวเลขคั่นด้วยจุลภาค เช่น -2, 1, 1, 3", "Enter zeros separated by commas, e.g. -2, 1, 1, 3"));
        if (zs.length > 8) throw new Error(L("ใส่รากได้ไม่เกิน 8 ค่า", "At most 8 zeros"));
        a = st.lead; if (!a) throw new Error(L("a ต้องไม่เป็นศูนย์", "a must not be zero"));
        p = fromRoots(zs, a);
        var cnt = {}; zs.forEach(function (z) { var key = +z.toFixed(9); cnt[key] = (cnt[key] || 0) + 1; });
        rs = Object.keys(cnt).map(Number).sort(function (x, y) { return x - y; }).map(function (x) { return { x: x, m: cnt[x] }; });
      } else {
        p = parsePoly(st.p); a = p[0]; rs = realRoots(p);
      }
      var n = p.length - 1, rows = [];
      rows.push(["P(x)", tex(polyTex(p))]);
      if (rs.length && rs.reduce(function (s, r) { return s + r.m; }, 0) === n) rows.push([L("รูปแยกตัวประกอบ", "Factored form"), tex(factorTex(rs, a))]);
      var even = n % 2 === 0, up = a > 0;
      var ends = even ? (up ? "↖ ↗" : "↙ ↘") : (up ? "↙ ↗" : "↖ ↘");
      rows.push([L("ดีกรี · สัมประสิทธิ์นำ", "Degree · leading coefficient"), n + " · " + fmt(a)]);
      rows.push([L("พฤติกรรมปลายกราฟ", "End behavior"), '<span class="pc-ends">' + ends + "</span> " + tex("x\\to-\\infty:\\ y\\to" + (even === up ? "+" : "-") + "\\infty,\\quad x\\to+\\infty:\\ y\\to" + (up ? "+" : "-") + "\\infty")]);
      rows.push([L("จุดตัดแกน y", "y-intercept"), tex("P(0) = " + nice(p[p.length - 1]))]);
      rows.push([L("รากจริงและภาวะรากซ้ำ", "Real zeros and multiplicity"), rs.length ? rs.map(function (r) {
        return tex("x = " + nice(r.x)) + " (" + (r.m === 1 ? L("ตัดผ่านแกน", "crosses") : r.m % 2 === 0 ? L("ซ้ำ " + r.m + " สัมผัสแกนแล้ววกกลับ", "multiplicity " + r.m + ", touches and turns") : L("ซ้ำ " + r.m + " ตัดผ่านแบบแบนราบ", "multiplicity " + r.m + ", crosses flattening out")) + ")";
      }).join("<br>") : L("ไม่มีรากจริง", "no real zeros")]);
      var crit = realRoots(pder(p)).map(function (r) { return r.x; });
      rows.push([L("จุดวกกลับ (ไม่เกิน n − 1 = " + (n - 1) + ")", "Turning points (at most n − 1 = " + (n - 1) + ")"), crit.filter(function (x, i) { var d2 = peval(pder(pder(p)), x); return Math.abs(d2) > 1e-9; }).map(function (x) { return "(" + fmt(x, 3) + ", " + fmt(peval(p, x), 3) + ")"; }).join(" · ") || "—"]);
      var html = "";
      if (st.mode === "synth") {
        var c = isFinite(st.c) ? st.c : 0, S = synth(p, c);
        html += '<div class="pc-tw"><table class="pc-syn"><tbody><tr><th rowspan="3">' + fmt(c) + "</th>" + p.map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") + "</tr><tr>" + S.prod.map(function (v) { return "<td>" + (v == null ? "" : fmt(v)) + "</td>"; }).join("") + "</tr><tr class=\"pc-sum\">" + S.sum.map(function (v, i) { return "<td" + (i === S.sum.length - 1 ? ' class="pc-rem"' : "") + ">" + fmt(v) + "</td>"; }).join("") + "</tr></tbody></table></div>";
        rows.push([L("ผลหาร Q(x)", "Quotient Q(x)"), tex(polyTex(S.q))]);
        rows.push([L("เศษ R", "Remainder R"), tex("R = P(" + nice(c) + ") = " + nice(S.r))]);
        rows.push([L("สรุป", "So"), tex("P(x) = (x " + (c < 0 ? "+ " + nice(-c) : "- " + nice(c)) + ")\\left(" + polyTex(S.q) + "\\right) " + (S.r < 0 ? "- " + nice(-S.r) : "+ " + nice(S.r))) + "<br>" + (Math.abs(S.r) < 1e-9 ? L("เศษเป็นศูนย์ ⇒ x − c เป็นตัวประกอบ และ c เป็นราก (ทฤษฎีบทตัวประกอบ)", "Remainder 0 ⇒ x − c is a factor and c is a zero (factor theorem)") : L("เศษไม่เป็นศูนย์ ⇒ c ไม่ใช่ราก", "Nonzero remainder ⇒ c is not a zero"))]);
        // rational root candidates
        if (p.every(function (v) { return Math.abs(v - Math.round(v)) < 1e-9; }) && Math.abs(p[n]) > 0 && Math.abs(p[n]) <= 360 && Math.abs(p[0]) <= 360) {
          var divs = function (m) { m = Math.abs(Math.round(m)); var d = []; for (var i = 1; i <= m; i++) if (m % i === 0) d.push(i); return d; };
          var cand = {}; divs(p[n]).forEach(function (pp) { divs(p[0]).forEach(function (qq) { var v = pp / qq; cand[v] = 1; cand[-v] = 1; }); });
          var list = Object.keys(cand).map(Number).sort(function (x, y) { return x - y; });
          rows.push([L("ผู้ท้าชิงรากตรรกยะ ±p/q", "Rational candidates ±p/q"), '<span class="pc-wrapnum">' + list.map(function (v) { var hit = Math.abs(peval(p, v)) < 1e-9; return (hit ? "<b class=\"pc-hit\">" : "") + tex(nice(v)) + (hit ? "</b>" : ""); }).join(", ") + "</span><br><small>" + L("ตัวหนา = แทนแล้วได้ศูนย์ (เป็นราก)", "bold = gives zero (a root)") + "</small>"]);
        }
      }
      var X = rs.length ? rs.map(function (r) { return r.x; }) : [0], x0 = Math.min.apply(null, X.concat(crit)) - 1.5, x1 = Math.max.apply(null, X.concat(crit)) + 1.5;
      if (x1 - x0 < 6) { var mid = (x0 + x1) / 2; x0 = mid - 3; x1 = mid + 3; }
      var pts = sample(function (x) { return peval(p, x); }, x0, x1, 500), yr = yRange([pts], 1e9, 0.12);
      var ys = [peval(p, 0)].concat(crit.map(function (x) { return peval(p, x); }));
      var ylo = Math.min.apply(null, ys.concat([0])), yhi = Math.max.apply(null, ys.concat([0])), pad = Math.max(1, (yhi - ylo) * 0.35);
      plotIn(ui.fig, { xmin: x0, xmax: x1, ymin: Math.max(yr[0], ylo - pad), ymax: Math.min(yr[1], yhi + pad), series: [{ pts: pts }],
        marks: rs.map(function (r) { return { x: r.x, y: 0, color: r.m % 2 ? C.b : C.d, label: r.m > 1 ? "×" + r.m : "" }; }).concat(crit.map(function (x) { return { x: x, y: peval(p, x), color: C.c, r: 3.5, open: true }; })),
        xlabel: "x", ylabel: "P(x)", label: "polynomial graph" });
      ui.out.innerHTML = html + dl(rows);
    }, { title: L("แล็บพหุนาม", "Polynomial lab"), hint: L("จุดสีน้ำเงิน = รากตัดแกน · สีม่วง = รากซ้ำคู่ · วงกลมเขียว = จุดวกกลับ", "blue = crossing zero · purple = even multiplicity · green ring = turning point") });
  });

  // ---------------------------------------------------------------- rational function analyzer
  function analyzeRational(num, den) {
    num = ptrim(num); den = ptrim(den);
    if (den.length === 1 && Math.abs(den[0]) < 1e-12) throw new Error(L("ตัวส่วนเป็นศูนย์", "The denominator is zero"));
    var nr = realRoots(num), dr = realRoots(den), holes = [], N = num.slice(), D = den.slice();
    dr.forEach(function (d) {
      var hit = nr.filter(function (z) { return Math.abs(z.x - d.x) < 1e-6 * Math.max(1, Math.abs(d.x)); })[0];
      if (!hit) return;
      var m = Math.min(hit.m, d.m);
      for (var i = 0; i < m; i++) { N = synth(N, d.x).q; D = synth(D, d.x).q; }
      if (hit.m <= d.m) holes.push({ x: d.x, cancel: m, left: d.m - m });
      else holes.push({ x: d.x, cancel: m, left: 0 });
    });
    N = ptrim(N.map(function (v) { var r = Math.round(v); return Math.abs(v - r) < 1e-9 ? r : v; }));
    D = ptrim(D.map(function (v) { var r = Math.round(v); return Math.abs(v - r) < 1e-9 ? r : v; }));
    var va = realRoots(D).map(function (r) { return r.x; });
    var holePts = holes.filter(function (hh) { return va.every(function (v) { return Math.abs(v - hh.x) > 1e-6; }); }).map(function (hh) { return { x: hh.x, y: peval(N, hh.x) / peval(D, hh.x) }; });
    var dn = num.length - 1, dd = den.length - 1, ha = null, slant = null, endPoly = null;
    if (dn < dd) ha = 0;
    else if (dn === dd) ha = num[0] / den[0];
    else { var q = pdiv(N, D)[0]; if (q.length === 2) slant = q; else endPoly = q; }
    return { num: num, den: den, N: N, D: D, holes: holePts, va: va, ha: ha, slant: slant, endPoly: endPoly, zeros: realRoots(N).map(function (r) { return r.x; }), dn: dn, dd: dd,
      f: function (x) { var d = peval(den, x); return Math.abs(d) < 1e-13 ? NaN : peval(num, x) / d; } };
  }
  PC.analyzeRational = analyzeRational;
  PC.widget("pc-rat", function (box) {
    return PC.make(box, { num: "x^2 - 4", den: "x^2 - x - 2" }, [
      { k: "num", t: "text", lab: L("ตัวเศษ p(x)", "Numerator p(x)"), ph: "x^2 - 4 " + L("หรือ", "or") + " 1, 0, -4" },
      { k: "den", t: "text", lab: L("ตัวส่วน q(x)", "Denominator q(x)"), ph: "x^2 - x - 2" }
    ], function (st, ui) {
      var R = analyzeRational(parsePoly(st.num), parsePoly(st.den)), rows = [];
      rows.push(["f(x)", tex("\\dfrac{" + polyTex(R.num) + "}{" + polyTex(R.den) + "}" + (R.holes.length ? " = \\dfrac{" + polyTex(R.N) + "}{" + polyTex(R.D) + "}\\ \\ (x \\ne " + R.holes.map(function (h) { return nice(h.x); }).join(", ") + ")" : ""))]);
      var excl = realRoots(R.den).map(function (r) { return r.x; });
      rows.push([L("โดเมน", "Domain"), tex(excl.length ? "\\{x \\in \\mathbb{R} : x \\ne " + excl.map(function (v) { return nice(v); }).join(",\\ ") + "\\}" : "\\mathbb{R}")]);
      rows.push([L("จุดเว้น (hole)", "Holes"), R.holes.length ? R.holes.map(function (h) { return tex("\\left(" + nice(h.x) + ",\\ " + nice(h.y) + "\\right)"); }).join(" · ") : L("ไม่มี", "none")]);
      rows.push([L("เส้นกำกับแนวดิ่ง", "Vertical asymptotes"), R.va.length ? R.va.map(function (v) { return tex("x = " + nice(v)); }).join(" · ") : L("ไม่มี", "none")]);
      rows.push([L("เส้นกำกับแนวนอน / เฉียง", "Horizontal / slant asymptote"),
        R.ha != null ? tex("y = " + nice(R.ha)) + " — " + (R.dn < R.dd ? L("ดีกรีเศษ < ดีกรีส่วน", "deg p < deg q") : L("ดีกรีเท่ากัน ใช้อัตราส่วนสัมประสิทธิ์นำ", "equal degrees, ratio of leading coefficients")) :
        R.slant ? tex("y = " + polyTex(R.slant)) + " — " + L("ดีกรีเศษมากกว่าส่วน 1 จึงหารยาวได้เส้นกำกับแนวเฉียง", "deg p = deg q + 1, long division gives a slant asymptote") :
        L("ไม่มีเส้นกำกับแนวนอนหรือเฉียง ปลายกราฟเหมือน ", "none; the ends behave like ") + tex("y = " + polyTex(R.endPoly))]);
      rows.push([L("จุดตัดแกน x", "x-intercepts"), R.zeros.length ? R.zeros.map(function (v) { return tex("(" + nice(v) + ", 0)"); }).join(" · ") : L("ไม่มี", "none")]);
      var y0 = R.f(0); rows.push([L("จุดตัดแกน y", "y-intercept"), isFinite(y0) ? tex("(0,\\ " + nice(y0) + ")") : L("ไม่มี (x = 0 ไม่อยู่ในโดเมน)", "none (x = 0 is not in the domain)")]);
      // sign chart
      var cps = R.zeros.concat(R.va).sort(function (p, q) { return p - q; }).filter(function (v, i, a) { return i === 0 || Math.abs(v - a[i - 1]) > 1e-9; });
      var cuts = [-Infinity].concat(cps, [Infinity]), signs = [];
      for (var i = 0; i < cuts.length - 1; i++) {
        var lo = cuts[i], hi = cuts[i + 1], t = !isFinite(lo) ? hi - 1 : !isFinite(hi) ? lo + 1 : (lo + hi) / 2;
        if (!isFinite(lo) && !isFinite(hi)) t = 0.123;
        var hp = R.holes.some(function (h) { return Math.abs(h.x - t) < 1e-9; }); if (hp) t += 1e-3;
        signs.push([lo, hi, R.f(t) > 0 ? "+" : "−"]);
      }
      rows.push([L("ตารางเครื่องหมาย", "Sign chart"), '<span class="pc-sign">' + signs.map(function (s) { return tex(interval(s[0], s[1], false, false)) + " <b class=\"" + (s[2] === "+" ? "pc-pos" : "pc-neg") + "\">" + s[2] + "</b>"; }).join(" ") + "</span>"]);
      // plot
      var keys = R.va.concat(R.zeros, R.holes.map(function (h) { return h.x; }), [0]);
      var x0 = Math.min.apply(null, keys) - 4, x1 = Math.max.apply(null, keys) + 4;
      var cutsX = R.va.slice().sort(function (p, q) { return p - q; }), series = [], segL = [x0].concat(cutsX), segR = cutsX.concat([x1]);
      for (i = 0; i < segL.length; i++) {
        var e = (x1 - x0) * 1e-4;
        series.push({ pts: sample(R.f, segL[i] + (i ? e : 0), segR[i] - (i < segR.length - 1 ? e : 0), 260) });
      }
      var finite = []; series.forEach(function (s) { s.pts.forEach(function (p) { if (isFinite(p[1])) finite.push(p[1]); }); });
      finite.sort(function (p, q) { return p - q; });
      var q1 = finite[Math.floor(finite.length * 0.12)] || -5, q9 = finite[Math.floor(finite.length * 0.88)] || 5;
      var ylo = Math.min(q1, 0, R.ha || 0, y0 || 0) - 2, yhi = Math.max(q9, 0, R.ha || 0, isFinite(y0) ? y0 : 0) + 2;
      ylo = Math.max(ylo, -40); yhi = Math.min(yhi, 40);
      var segs = R.slant ? [{ x1: x0, y1: peval(R.slant, x0), x2: x1, y2: peval(R.slant, x1), color: C.b, dash: "6 4", width: 1.4 }] : [];
      plotIn(ui.fig, { xmin: x0, xmax: x1, ymin: ylo, ymax: yhi, series: series, segs: segs,
        vlines: R.va.map(function (v) { return { x: v, color: C.b }; }), hlines: R.ha != null ? [{ y: R.ha, color: C.b, label: "y = " + fmt(R.ha, 3) }] : [],
        marks: R.holes.map(function (h) { return { x: h.x, y: h.y, open: true, color: C.a, label: L("จุดเว้น", "hole") }; }).concat(R.zeros.map(function (z) { return { x: z, y: 0, color: C.c, r: 3.5 }; })),
        xlabel: "x", ylabel: "y", label: "rational function" });
      ui.out.innerHTML = dl(rows);
    }, { title: L("เครื่องวิเคราะห์ฟังก์ชันตรรกยะ", "Rational function analyzer"), hint: L("พิมพ์พหุนาม เช่น x^2-4 หรือ (x-1)(x+2) หรือสัมประสิทธิ์ 1, 0, -4", "type a polynomial such as x^2-4 or (x-1)(x+2), or coefficients 1, 0, -4") });
  });

  // ---------------------------------------------------------------- inverse functions
  var INV = {
    lin: { f: "2x+3", inv: "\\dfrac{x - 3}{2}", lo: -Infinity, hi: Infinity },
    cube: { f: "x^3+1", inv: "\\sqrt[3]{x - 1}", lo: -Infinity, hi: Infinity },
    sq: { f: "x^2", inv: null, lo: -Infinity, hi: Infinity },
    sqr: { f: "x^2", inv: "\\sqrt{x}", lo: 0, hi: Infinity },
    sqrt: { f: "sqrt(x-1)", inv: "x^2 + 1,\\ x \\ge 0", lo: 1, hi: Infinity },
    exp: { f: "2^x", inv: "\\log_2 x", lo: -Infinity, hi: Infinity },
    rat: { f: "(2x+1)/(x-3)", inv: "\\dfrac{3x + 1}{x - 2}", lo: -Infinity, hi: Infinity },
    sin: { f: "sin(x)", inv: null, lo: -Infinity, hi: Infinity },
    asin: { f: "sin(x)", inv: "\\arcsin x", lo: -Math.PI / 2, hi: Math.PI / 2 },
    custom: { f: null, inv: null }
  };
  PC.widget("pc-inv", function (box) {
    var OPTS = [["lin", "2x + 3"], ["cube", "x³ + 1"], ["sq", "x² " + L("(ทุก x)", "(all x)")], ["sqr", "x², x ≥ 0"], ["sqrt", "√(x − 1)"], ["exp", "2ˣ"], ["rat", "(2x + 1)/(x − 3)"], ["sin", "sin x " + L("(ทุก x)", "(all x)")], ["asin", "sin x, −π/2 ≤ x ≤ π/2"], ["custom", L("พิมพ์เอง", "type your own")]];
    return PC.make(box, { pre: "lin", f: "x^3 - 3x", lo: -3, hi: 3, c: 1, t: 1 }, [
      { k: "pre", t: "sel", lab: L("ฟังก์ชัน", "Function"), opts: OPTS },
      { k: "f", t: "text", lab: "f(x) =", show: "pre:custom" },
      { k: "lo", t: "num", lab: L("โดเมนเริ่ม", "domain from"), show: "pre:custom" },
      { k: "hi", t: "num", lab: L("ถึง", "to"), show: "pre:custom" },
      { k: "c", t: "range", lab: L("เส้นแนวนอน y = c", "Horizontal line y = c"), min: -6, max: 6, step: 0.1 },
      { k: "t", t: "range", lab: L("จุด P(t, f(t)) t =", "Point P(t, f(t)) t ="), min: -4, max: 4, step: 0.1 }
    ], function (st, ui) {
      var D = INV[st.pre], src = st.pre === "custom" ? st.f : D.f, f = PC.parse(src);
      var lo = st.pre === "custom" ? (isFinite(st.lo) ? st.lo : -Infinity) : D.lo, hi = st.pre === "custom" ? (isFinite(st.hi) ? st.hi : Infinity) : D.hi;
      var X0 = -7, X1 = 7, a = Math.max(X0 - 3, lo), b = Math.min(X1 + 3, hi);
      var g = function (x) { return x < lo - 1e-12 || x > hi + 1e-12 ? NaN : f(x); };
      var pts = sample(g, a, b, 900);
      var mirror = pts.map(function (p) { return [p[1], p[0]]; });
      // mirror as polyline: split on non-finite
      var crosses = 0, xs = [];
      for (var i = 1; i < pts.length; i++) {
        var y0 = pts[i - 1][1] - st.c, y1 = pts[i][1] - st.c;
        if (!isFinite(y0) || !isFinite(y1)) continue;
        if (y0 === 0 || y0 * y1 < 0) { crosses++; xs.push(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * (y0 / (y0 - y1))); }
      }
      // one-to-one check on the window: monotone samples
      var fin = pts.filter(function (p) { return isFinite(p[1]); }), inc = 0, dec = 0;
      for (i = 1; i < fin.length; i++) { var d = fin[i][1] - fin[i - 1][1]; if (d > 1e-12) inc++; else if (d < -1e-12) dec++; }
      var one = !(inc && dec);
      var t = Math.min(Math.max(st.t, a), b), ft = g(t), marks = [];
      if (isFinite(ft)) { marks.push({ x: t, y: ft, color: C.a, label: "P(" + fmt(t, 2) + ", " + fmt(ft, 2) + ")" }); marks.push({ x: ft, y: t, color: C.b, label: "P′(" + fmt(ft, 2) + ", " + fmt(t, 2) + ")" }); }
      xs.forEach(function (x) { marks.push({ x: x, y: st.c, color: one ? C.c : "var(--bad, #c43c3c)", r: 4 }); });
      plotIn(ui.fig, { xmin: X0, xmax: X1, ymin: -7, ymax: 7, equal: true, series: [{ pts: sample(function (x) { return x; }, X0, X1, 2), color: C.m, width: 1.2, dash: "3 4" }, { pts: pts }, { pts: mirror, color: C.b, width: 2 }],
        hlines: [{ y: st.c, color: one ? C.c : "#c43c3c", dash: "2 3", label: "y = " + fmt(st.c, 2) }],
        segs: isFinite(ft) ? [{ x1: t, y1: ft, x2: ft, y2: t, color: C.m, dash: "2 3", width: 1.2 }] : [], marks: marks, xlabel: "x", ylabel: "y", label: "inverse function reflection" });
      var rows = [];
      rows.push([L("การทดสอบเส้นแนวนอน", "Horizontal line test"), L("เส้น y = " + fmt(st.c, 2) + " ตัดกราฟ " + crosses + " จุด", "the line y = " + fmt(st.c, 2) + " meets the graph " + crosses + (crosses === 1 ? " time" : " times"))]);
      rows.push([L("สรุป", "Verdict"), one ? "<b class=\"pc-pos\">" + L("เป็นฟังก์ชันหนึ่งต่อหนึ่งบนโดเมนนี้ → มีฟังก์ชันผกผัน", "one-to-one on this domain → the inverse is a function") + "</b>" : "<b class=\"pc-neg\">" + L("ไม่เป็นหนึ่งต่อหนึ่ง (มีเส้นแนวนอนที่ตัดมากกว่า 1 จุด) → ตัวผกผันไม่ใช่ฟังก์ชัน ต้องจำกัดโดเมนก่อน", "not one-to-one (some horizontal line meets it twice) → the inverse is not a function; restrict the domain first") + "</b>"]);
      if (D.inv) rows.push([tex("f^{-1}(x)"), tex(D.inv)]);
      rows.push([L("เส้นสีน้ำเงิน", "Blue curve"), L("ภาพสะท้อนของกราฟ f ในเส้น y = x คือกราฟของตัวผกผัน (สลับพิกัด (a, b) → (b, a))", "the mirror image of f in y = x, the graph of the inverse (swap (a, b) → (b, a))")]);
      ui.out.innerHTML = dl(rows);
    }, { title: L("แล็บฟังก์ชันผกผันและเงาสะท้อน y = x", "Inverse function and reflection lab"), hint: L("ส้ม = f · น้ำเงิน = ตัวผกผัน · เส้นประ = y = x", "orange = f · blue = inverse · dotted = y = x") });
  });

  // ---------------------------------------------------------------- exponential: graph · interest · decay
  PC.widget("pc-exp", function (box) {
    var NS = [["1", L("ปีละครั้ง", "yearly")], ["2", L("ครึ่งปี", "half-yearly")], ["4", L("รายไตรมาส", "quarterly")], ["12", L("รายเดือน", "monthly")], ["365", L("รายวัน", "daily")], ["0", L("ต่อเนื่อง (e)", "continuous (e)")]];
    return PC.make(box, { mode: "graph", a: 1, b: 2, k: 0, P: 10000, r: 5, t: 10, n: "12", N0: 100, half: 5.27, tt: 12 }, [
      { k: "mode", t: "sel", lab: L("โหมด", "Mode"), opts: [["graph", L("กราฟ y = a·bˣ + k", "Graph y = a·bˣ + k")], ["interest", L("ดอกเบี้ยทบต้น", "Compound interest")], ["decay", L("ครึ่งชีวิต", "Half-life")]] },
      { k: "a", t: "range", lab: "a", min: -3, max: 3, step: 0.25, show: "mode:graph" },
      { k: "b", t: "range", lab: L("ฐาน b", "base b"), min: 0.1, max: 4, step: 0.05, show: "mode:graph" },
      { k: "k", t: "range", lab: "k", min: -4, max: 4, step: 0.5, show: "mode:graph" },
      { k: "P", t: "num", lab: L("เงินต้น P", "Principal P"), show: "mode:interest" },
      { k: "r", t: "num", lab: L("อัตราดอกเบี้ยต่อปี r (%)", "Annual rate r (%)"), show: "mode:interest" },
      { k: "t", t: "num", lab: L("ระยะเวลา t (ปี)", "Time t (years)"), show: "mode:interest" },
      { k: "n", t: "sel", lab: L("ทบต้น", "Compounded"), opts: NS, show: "mode:interest" },
      { k: "N0", t: "num", lab: L("ปริมาณเริ่มต้น N₀", "Initial amount N₀"), show: "mode:decay" },
      { k: "half", t: "num", lab: L("ครึ่งชีวิต T½", "Half-life T½"), show: "mode:decay" },
      { k: "tt", t: "num", lab: L("เวลา t (หน่วยเดียวกับ T½)", "Time t (same unit as T½)"), show: "mode:decay" }
    ], function (st, ui) {
      var rows = [];
      if (st.mode === "graph") {
        var a = st.a, b = st.b, k = st.k;
        if (!(b > 0) || Math.abs(b - 1) < 1e-9) throw new Error(L("ฐานต้องเป็นบวกและไม่เท่ากับ 1", "The base must be positive and not 1"));
        var f = function (x) { return a * Math.pow(b, x) + k; };
        plotIn(ui.fig, { xmin: -5, xmax: 5, ymin: Math.min(-2, k - 3), ymax: Math.max(8, k + 3), series: [{ pts: sample(function (x) { return Math.pow(2.718281828459045, x); }, -5, 5, 200), color: C.m, width: 1.2, dash: "3 4" }, { pts: sample(f, -5, 5, 400) }],
          hlines: [{ y: k, color: C.b, label: "y = " + fmt(k) }], marks: [{ x: 0, y: a + k, color: C.a, label: "(0, " + fmt(a + k, 3) + ")" }, { x: 1, y: a * b + k, color: C.c, r: 3.5, label: "(1, " + fmt(a * b + k, 3) + ")" }], xlabel: "x", ylabel: "y", label: "exponential graph" });
        rows.push(["y", tex("y = " + (a === 1 ? "" : nice(a) + "\\cdot ") + "(" + nice(b) + ")^{x}" + (k ? (k > 0 ? " + " : " - ") + nice(Math.abs(k)) : "")) + ' <small class="pc-mutei">' + L("เส้นประ = eˣ", "dashed = eˣ") + "</small>"]);
        rows.push([L("ชนิด", "Type"), (b > 1) === (a > 0) ? L("เพิ่มขึ้นเมื่อ x เพิ่ม", "increasing") : L("ลดลงเมื่อ x เพิ่ม", "decreasing") + "", ]);
        rows.push([L("การเติบโต / สลาย", "Growth / decay"), b > 1 ? L("b > 1 การเติบโต: ทุกครั้งที่ x เพิ่ม 1 ค่า (y − k) คูณด้วย " + fmt(b, 3), "b > 1, growth: each step of +1 in x multiplies (y − k) by " + fmt(b, 3)) : L("0 < b < 1 การสลาย: ทุกครั้งที่ x เพิ่ม 1 ค่า (y − k) เหลือ " + fmt(b * 100, 3) + "%", "0 < b < 1, decay: each step of +1 in x leaves " + fmt(b * 100, 3) + "% of (y − k)")]);
        rows.push([L("เส้นกำกับแนวนอน", "Horizontal asymptote"), tex("y = " + nice(k))]);
        rows.push([L("เรนจ์", "Range"), tex(a > 0 ? "(" + nice(k) + ", \\infty)" : "(-\\infty, " + nice(k) + ")")]);
        rows.push([L("จุดตัดแกน y", "y-intercept"), tex("(0,\\ " + nice(a + k) + ")")]);
      } else if (st.mode === "interest") {
        var P = st.P, r = st.r / 100, t = st.t, n = +st.n;
        if (!(P > 0) || !(r >= 0) || !(t >= 0)) throw new Error(L("ใส่เงินต้น อัตรา และเวลาเป็นค่าบวก", "Enter a positive principal, rate and time"));
        var A = function (tt) { return n ? P * Math.pow(1 + r / n, n * tt) : P * Math.exp(r * tt); };
        var cont = function (tt) { return P * Math.exp(r * tt); }, simple = function (tt) { return P * (1 + r * tt); };
        var At = A(t), dbl = r > 0 ? (n ? Math.log(2) / (n * Math.log(1 + r / n)) : Math.log(2) / r) : Infinity;
        var T1 = Math.max(t, 1) * 1.15;
        plotIn(ui.fig, { xmin: 0, xmax: T1, ymin: 0, ymax: cont(T1) * 1.08, series: [{ pts: sample(simple, 0, T1, 50), color: C.m, width: 1.3, dash: "4 4" }, { pts: sample(cont, 0, T1, 200), color: C.b, width: 1.3, dash: "2 3" }, { pts: sample(A, 0, T1, 300) }],
          marks: [{ x: t, y: At, color: C.a, label: fmt(At, 2) }], xlabel: L("ปี", "years"), ylabel: L("เงิน", "amount"), label: "compound interest" });
        rows.push([L("สูตร", "Formula"), tex(n ? "A = P\\left(1 + \\tfrac{r}{n}\\right)^{nt} = " + fmt(P, 2).replace(/,/g, "{,}") + "\\left(1 + \\tfrac{" + nice(r) + "}{" + n + "}\\right)^{" + nice(n * t) + "}" : "A = Pe^{rt} = " + fmt(P, 2).replace(/,/g, "{,}") + "\\,e^{" + nice(r * t) + "}")]);
        rows.push([L("เงินรวม A", "Amount A"), "<b>" + fmt(At, 2) + "</b>"]);
        rows.push([L("ดอกเบี้ย", "Interest earned"), fmt(At - P, 2)]);
        rows.push([L("เทียบดอกเบี้ยแบบต่อเนื่อง", "Continuous compounding"), fmt(cont(t), 2)]);
        rows.push([L("เทียบดอกเบี้ยเชิงเดียว", "Simple interest"), fmt(simple(t), 2)]);
        rows.push([L("อัตราผลตอบแทนที่แท้จริงต่อปี (EAR)", "Effective annual rate (EAR)"), fmt(((n ? Math.pow(1 + r / n, n) : Math.exp(r)) - 1) * 100, 4) + "%"]);
        rows.push([L("เวลาให้เงินเพิ่มเป็นสองเท่า", "Doubling time"), fmt(dbl, 2) + L(" ปี · กฎ 72 ประมาณ ", " years · rule of 72 gives ") + (r > 0 ? fmt(72 / (r * 100), 2) : "—")]);
      } else {
        var N0 = st.N0, T = st.half, tt = st.tt;
        if (!(N0 > 0) || !(T > 0)) throw new Error(L("ใส่ N₀ และครึ่งชีวิตเป็นค่าบวก", "Enter positive N₀ and half-life"));
        var N = function (x) { return N0 * Math.pow(0.5, x / T); }, kk = Math.log(2) / T, X1 = Math.max(tt, 4 * T) * 1.05;
        var halves = []; for (var j = 1; j <= 4; j++) halves.push({ x: j * T, y: N0 / Math.pow(2, j), color: C.m, r: 3, open: true });
        plotIn(ui.fig, { xmin: 0, xmax: X1, ymin: 0, ymax: N0 * 1.08, series: [{ pts: sample(N, 0, X1, 300) }], marks: halves.concat([{ x: tt, y: N(tt), color: C.a, label: fmt(N(tt), 3) }]), xlabel: "t", ylabel: "N", label: "half-life decay" });
        rows.push([L("สูตร", "Formula"), tex("N(t) = N_0\\left(\\tfrac12\\right)^{t/T_{1/2}} = N_0 e^{-kt},\\quad k = \\dfrac{\\ln 2}{T_{1/2}} = " + nice(kk))]);
        rows.push(["N(" + fmt(tt) + ")", "<b>" + fmt(N(tt), 4) + "</b> (" + fmt(N(tt) / N0 * 100, 3) + "% " + L("ของเดิม", "remaining") + ")"]);
        rows.push([L("จำนวนครึ่งชีวิตที่ผ่านไป", "Half-lives elapsed"), tex("t/T_{1/2} = " + nice(tt / T))]);
        rows.push([L("เวลาให้เหลือ 10%", "Time to reach 10%"), fmt(T * Math.log2(10), 3)]);
      }
      ui.out.innerHTML = dl(rows);
    }, { title: L("แล็บเอกซ์โพเนนเชียล", "Exponential lab"), hint: L("เลือกโหมดกราฟ ดอกเบี้ย หรือครึ่งชีวิต", "graph, interest or half-life") });
  });

  // ---------------------------------------------------------------- logarithms: graph · calculator · solver
  PC.widget("pc-log", function (box) {
    return PC.make(box, { mode: "graph", b: 2, x: "8", base: "2", sa: 3, sb: 2, sk: 1, sc: 48 }, [
      { k: "mode", t: "sel", lab: L("โหมด", "Mode"), opts: [["graph", L("กราฟ log_b x กับ bˣ", "Graph log_b x and bˣ")], ["calc", L("คำนวณ log_b x", "Evaluate log_b x")], ["solve", L("แก้ A·B^(Kx) = C", "Solve A·B^(Kx) = C")]] },
      { k: "b", t: "range", lab: L("ฐาน b", "base b"), min: 0.2, max: 5, step: 0.1, show: "mode:graph" },
      { k: "base", t: "text", lab: L("ฐาน b", "base b"), show: "mode:calc" },
      { k: "x", t: "text", lab: "x", show: "mode:calc" },
      { k: "sa", t: "num", lab: "A", show: "mode:solve" }, { k: "sb", t: "num", lab: L("ฐาน B", "base B"), show: "mode:solve" },
      { k: "sk", t: "num", lab: "K", show: "mode:solve" }, { k: "sc", t: "num", lab: "C", show: "mode:solve" }
    ], function (st, ui) {
      var rows = [];
      if (st.mode === "graph") {
        var b = st.b; if (!(b > 0) || Math.abs(b - 1) < 1e-9) throw new Error(L("ฐานต้องเป็นบวกและไม่เท่ากับ 1", "The base must be positive and not 1"));
        var lg = function (x) { return x > 0 ? Math.log(x) / Math.log(b) : NaN; }, ex = function (x) { return Math.pow(b, x); };
        plotIn(ui.fig, { xmin: -5, xmax: 7, ymin: -5, ymax: 7, equal: true, series: [{ pts: sample(function (x) { return x; }, -6, 8, 2), color: C.m, width: 1.2, dash: "3 4" }, { pts: sample(ex, -6, 8, 300), color: C.b, width: 1.6 }, { pts: sample(lg, 0.0005, 8, 600) }],
          vlines: [{ x: 0, color: C.a, dash: "2 3" }], marks: [{ x: 1, y: 0, color: C.a, label: "(1, 0)" }, { x: b, y: 1, color: C.a, label: "(" + fmt(b, 2) + ", 1)" }, { x: 0, y: 1, color: C.b, r: 3.5 }], xlabel: "x", ylabel: "y", label: "logarithm graph" });
        rows.push([L("ส้ม", "Orange"), tex("y = \\log_{" + nice(b) + "} x") + L(" · โดเมน x > 0 · เรนจ์ ℝ · เส้นกำกับ x = 0", " · domain x > 0 · range ℝ · asymptote x = 0")]);
        rows.push([L("น้ำเงิน", "Blue"), tex("y = " + nice(b) + "^{x}") + L(" — สองกราฟสะท้อนกันในเส้น y = x", " — the two graphs mirror each other in y = x")]);
        rows.push([L("ทิศทาง", "Direction"), b > 1 ? L("b > 1: log เพิ่มขึ้น แต่ช้าลงเรื่อย ๆ", "b > 1: log increases, ever more slowly") : L("0 < b < 1: log ลดลง", "0 < b < 1: log decreases")]);
      } else if (st.mode === "calc") {
        var B = PC.evalNum(st.base), X = PC.evalNum(st.x);
        if (!(B > 0) || Math.abs(B - 1) < 1e-12) throw new Error(L("ฐานต้องเป็นบวกและไม่เท่ากับ 1", "The base must be positive and not 1"));
        if (!(X > 0)) throw new Error(L("log นิยามเฉพาะ x > 0", "log is defined only for x > 0"));
        var v = Math.log(X) / Math.log(B), r = rat(v, 60, 1e-10);
        rows.push([L("ผลลัพธ์", "Result"), tex("\\log_{" + nice(B) + "} " + nice(X) + " = " + (r ? fracTex(r[0], r[1]) : fmt(v, 10)))]);
        rows.push([L("เปลี่ยนฐานเป็น ln", "Change of base (ln)"), tex("\\dfrac{\\ln " + nice(X) + "}{\\ln " + nice(B) + "} = \\dfrac{" + fmt(Math.log(X), 8) + "}{" + fmt(Math.log(B), 8) + "}")]);
        rows.push([L("เปลี่ยนฐานเป็น log", "Change of base (log)"), tex("\\dfrac{\\log " + nice(X) + "}{\\log " + nice(B) + "} = \\dfrac{" + fmt(Math.log10(X), 8) + "}{" + fmt(Math.log10(B), 8) + "}")]);
        rows.push([L("ตรวจกลับ", "Check"), tex(nice(B) + "^{" + (r ? fracTex(r[0], r[1]) : fmt(v, 6)) + "} = " + fmt(Math.pow(B, v), 8))]);
        if (r) rows.push([L("ทำไมได้เศษส่วน", "Why a fraction"), L("เพราะ x เขียนเป็นกำลังของฐานได้ จึงตอบค่าแม่นตรง", "because x is an exact power of the base")]);
      } else {
        var A = st.sa, Bb = st.sb, K = st.sk, Cv = st.sc;
        if (!(Bb > 0) || Math.abs(Bb - 1) < 1e-12 || !A || !K) throw new Error(L("ต้องมี A ≠ 0, K ≠ 0 และฐาน B > 0, B ≠ 1", "Need A ≠ 0, K ≠ 0 and base B > 0, B ≠ 1"));
        var q = Cv / A;
        rows.push([L("ขั้นที่ 1 หารด้วย A", "Step 1 divide by A"), tex(nice(Bb) + "^{" + (K === 1 ? "" : nice(K)) + "x} = \\dfrac{" + nice(Cv) + "}{" + nice(A) + "} = " + nice(q))]);
        if (!(q > 0)) { rows.push([L("สรุป", "So"), L("ด้านขวาไม่เป็นบวก แต่ Bᵏˣ > 0 เสมอ → ไม่มีคำตอบจริง", "the right side is not positive but Bᵏˣ > 0 always → no real solution")]); }
        else {
          var xx = Math.log(q) / (K * Math.log(Bb)), rr = rat(xx, 60, 1e-10);
          rows.push([L("ขั้นที่ 2 ใส่ ln ทั้งสองข้าง", "Step 2 take ln of both sides"), tex((K === 1 ? "" : nice(K)) + "x\\,\\ln " + nice(Bb) + " = \\ln " + nice(q))]);
          rows.push([L("ขั้นที่ 3 แก้หา x", "Step 3 solve for x"), tex("x = \\dfrac{\\ln " + nice(q) + "}{" + (K === 1 ? "" : nice(K)) + "\\ln " + nice(Bb) + "} = " + (rr ? fracTex(rr[0], rr[1]) : fmt(xx, 8)))]);
          rows.push([L("ตรวจ", "Check"), tex(nice(A) + "\\cdot " + nice(Bb) + "^{" + nice(K * xx) + "} = " + fmt(A * Math.pow(Bb, K * xx), 8))]);
        }
        plotIn(ui.fig, { xmin: -4, xmax: 6, ymin: Math.min(0, Cv) - 5, ymax: Math.max(Cv, A) * 1.3 + 5, series: [{ pts: sample(function (x) { return A * Math.pow(Bb, K * x); }, -4, 6, 300) }], hlines: [{ y: Cv, color: C.b, label: "y = " + fmt(Cv) }], xlabel: "x", ylabel: "y", label: "exponential equation" });
      }
      if (st.mode === "calc") ui.fig.innerHTML = "";
      ui.out.innerHTML = dl(rows);
    }, { title: L("แล็บลอการิทึม", "Logarithm lab"), hint: L("พิมพ์ได้ทั้ง 8, 1/9, sqrt(2), e^3", "accepts 8, 1/9, sqrt(2), e^3") });
  });

  root.PC = PC;
  if (DOC.readyState === "loading") DOC.addEventListener("DOMContentLoaded", PC.boot); else PC.boot();
})(typeof window !== "undefined" ? window : globalThis);
