/* MTCore — math engine behind the calculators in /tools/ and /en/tools/ (no DOM, no dependencies).
   window.MTCore in the browser, module.exports in Node (copy to .cjs because package.json is "type": "module").
   - MT.parse("x^2 sin(3x)/(1+x)")        → simplified expression tree (throws MT.Err with a code, see ERR in mt-ui.js)
   - MT.tex(node) / MT.text(node)          → LaTeX / plain text
   - MT.evalf(node, {x: 2})                → number
   - MT.diff(node, "x")                    → derivative (exact rules) · MT.diffSteps → term-by-term working
   - MT.integrate(node, "x")               → antiderivative from the rule table, or null (the UI then tries nerdamer)
   - MT.checkDeriv(F, f, "x")              → true when F′ = f numerically (every antiderivative is checked before it is shown)
   - MT.quad(f, a, b)                      → adaptive Gauss–Kronrod integral
   - MT.laplace(node, "t")                 → F(s) of sums/products of tⁿ, e^{at}, sin, cos, sinh, cosh, u(t−a), δ(t−a)
   - MT.fourier(pieces, T, N)              → a0, aₙ, bₙ, cₙ, RMS, THD of a periodic piecewise function
   - MT.niceTex(x)                         → TeX of a number, recognising fractions and multiples of π, 1/π, 1/π², √2, √3
   Checked by scripts/test-tools.mjs. */
(function (root) {
  "use strict";
  var MT = {};
  function Err(code, info) { this.code = code; this.info = info; this.message = code + (info ? ": " + info : ""); }
  Err.prototype = Object.create(Error.prototype);
  MT.Err = Err;

  /* ------------------------------------------------------------------ tree: n number · s symbol · + sum · * product · ^ power · f function */
  function N(v) { return { k: "n", v: v }; }
  function S(n) { return { k: "s", n: n }; }
  var ZERO = N(0), ONE = N(1);
  function isN(a, v) { return a.k === "n" && (v === undefined || a.v === v); }
  function isInt(x) { return Math.abs(x - Math.round(x)) < 1e-12; }
  function str(a) {
    switch (a.k) {
      case "n": return String(+a.v.toPrecision(13));
      case "s": return a.n;
      case "+": return "(" + a.a.map(str).join("+") + ")";
      case "*": return "(" + a.a.map(str).join("*") + ")";
      case "^": return "(" + str(a.b) + "^" + str(a.e) + ")";
      default: return a.n + "(" + str(a.a) + ")";
    }
  }
  MT.key = str;
  function add(list) {
    var flat = [];
    list.forEach(function (t) { if (t.k === "+") flat.push.apply(flat, t.a); else flat.push(t); });
    var c = 0, map = {}, order = [];
    flat.forEach(function (t) {
      if (t.k === "n") { c += t.v; return; }
      var co = 1, rest = t;
      if (t.k === "*" && t.a[0].k === "n") { co = t.a[0].v; rest = t.a.length === 2 ? t.a[1] : { k: "*", a: t.a.slice(1) }; }
      var key = str(rest);
      if (!(key in map)) { map[key] = { co: 0, rest: rest }; order.push(key); }
      map[key].co += co;
    });
    var out = [];
    order.forEach(function (k) { var m = map[k]; if (Math.abs(m.co) < 1e-13) return; out.push(m.co === 1 ? m.rest : mul([N(m.co), m.rest])); });
    if (Math.abs(c) > 1e-13) out.push(N(c));
    if (!out.length) return ZERO;
    return out.length === 1 ? out[0] : { k: "+", a: out };
  }
  var RANK = { s: 1, "^": 2, "+": 3, f: 4 };
  function mul(list) {
    var flat = [];
    (function push(l) { l.forEach(function (t) { if (t.k === "*") push(t.a); else flat.push(t); }); })(list);
    var c = 1, map = {}, order = [];
    for (var i = 0; i < flat.length; i++) {
      var t = flat[i];
      if (t.k === "n") { c *= t.v; continue; }
      var b = t, e = ONE;
      if (t.k === "^") { b = t.b; e = t.e; }
      var key = str(b);
      if (!(key in map)) { map[key] = { b: b, e: [] }; order.push(key); }
      map[key].e.push(e);
    }
    if (c === 0) return ZERO;
    var fs = [];
    order.forEach(function (k) {
      var m = map[k], e = add(m.e);
      if (isN(e, 0)) return;
      var p = m.e.length === 1 && m.e[0] === e && e !== ONE ? { k: "^", b: m.b, e: e } : pow(m.b, e);
      if (p.k === "n") c *= p.v; else if (p.k === "*") { p.a.forEach(function (q) { if (q.k === "n") c *= q.v; else fs.push(q); }); } else fs.push(p);
    });
    if (c === 0) return ZERO;
    fs.sort(function (x, y) {
      var rx = RANK[x.k], ry = RANK[y.k];
      if (x.k === "^") rx = x.b.k === "f" ? 4 : x.b.k === "+" ? 3 : x.b.k === "n" ? 0.5 : x.b.n === "e" ? 2.5 : 1;
      if (y.k === "^") ry = y.b.k === "f" ? 4 : y.b.k === "+" ? 3 : y.b.k === "n" ? 0.5 : y.b.n === "e" ? 2.5 : 1;
      if (x.k === "s" && x.n === "pi") rx = 0.6; if (y.k === "s" && y.n === "pi") ry = 0.6;
      if (x.k === "s" && x.n === "e") rx = 2.5; if (y.k === "s" && y.n === "e") ry = 2.5;
      if (rx !== ry) return rx - ry;
      var kx = str(x.k === "^" ? x.b : x), ky = str(y.k === "^" ? y.b : y);
      return kx < ky ? -1 : kx > ky ? 1 : 0;
    });
    if (!fs.length) return N(c);
    if (fs.length === 1 && fs[0].k === "+" && c !== 1) return add(fs[0].a.map(function (t) { return mul([N(c), t]); }));
    if (c === 1) return fs.length === 1 ? fs[0] : { k: "*", a: fs };
    return { k: "*", a: [N(c)].concat(fs) };
  }
  function pow(b, e) {
    if (isN(e, 0)) return ONE;
    if (isN(e, 1)) return b;
    if (isN(b, 1)) return ONE;
    if (b.k === "n" && e.k === "n") {
      if (b.v === 0) { if (e.v > 0) return ZERO; throw new Err("div0"); }
      if (isInt(e.v) && Math.abs(e.v) <= 64) { var v = Math.pow(b.v, Math.round(e.v)); if (isFinite(v)) return N(v); }
      else if (b.v > 0) { var r = Math.pow(b.v, e.v); if (isInt(r) || (isInt(b.v * 4) && isInt(1 / r) )) return N(r); var q = rat(b.v); if (q && q[1] !== 1 && e.v === 0.5) { var rn = Math.sqrt(q[0]), rd = Math.sqrt(q[1]); if (isInt(rd)) return mul([N(1 / rd), pow(N(q[0]), N(0.5))]); if (isInt(rn)) return mul([N(rn), pow(N(q[1]), N(-0.5))]); } }
    }
    if (b.k === "^" && e.k === "n" && isInt(e.v)) return pow(b.b, mul([b.e, e]));
    if (b.k === "^" && b.b.k === "s" && b.b.n === "e") return pow(b.b, mul([b.e, e]));
    if (b.k === "*" && e.k === "n" && isInt(e.v)) return mul(b.a.map(function (f) { return pow(f, e); }));
    if (b.k === "*" && e.k === "n" && b.a[0].k === "n" && b.a[0].v > 0) return mul([pow(b.a[0], e), { k: "^", b: mul(b.a.slice(1)), e: e }]);
    if (b.k === "s" && b.n === "e" && e.k === "f" && e.n === "ln") return e.a;
    return { k: "^", b: b, e: e };
  }
  var ODD = { sin: 1, tan: 1, sinh: 1, tanh: 1, asin: 1, atan: 1, asinh: 1, csc: 1, cot: 1, erf: 1 }, EVEN = { cos: 1, cosh: 1, sec: 1, abs: 1 };
  function negLead(a) { return (a.k === "n" && a.v < 0) || (a.k === "*" && a.a[0].k === "n" && a.a[0].v < 0); }
  function fn(n, a) {
    if (n === "exp") return pow(S("e"), a);
    if (n === "sqrt") return pow(a, N(0.5));
    if (n === "log10") return mul([fn("ln", a), pow(fn("ln", N(10)), N(-1))]);
    if (n === "ln") {
      if (isN(a, 1)) return ZERO;
      if (a.k === "s" && a.n === "e") return ONE;
      if (a.k === "^" && a.b.k === "s" && a.b.n === "e") return a.e;
    }
    if (isN(a, 0)) {
      if (ODD[n] && n !== "csc" && n !== "cot") return ZERO;
      if (n === "cos" || n === "cosh" || n === "sec") return ONE;
      if (n === "abs") return ZERO;
    }
    if (n === "abs" && a.k === "n") return N(Math.abs(a.v));
    if (negLead(a)) {
      if (ODD[n]) return mul([N(-1), fn(n, mul([N(-1), a]))]);
      if (EVEN[n]) return fn(n, mul([N(-1), a]));
    }
    return { k: "f", n: n, a: a };
  }
  function neg(a) { return mul([N(-1), a]); }
  function div(a, b) { return mul([a, pow(b, N(-1))]); }
  MT.N = N; MT.S = S; MT.add = add; MT.mul = mul; MT.pow = pow; MT.fn = fn; MT.neg = neg; MT.div = div;

  /* ------------------------------------------------------------------ parser */
  var FUNCS = ["heaviside", "arcsinh", "arccosh", "arctanh", "arcsin", "arccos", "arctan", "asinh", "acosh", "atanh", "log10", "delta", "sqrt", "sinh", "cosh", "tanh", "asin", "acos", "atan", "step", "sin", "cos", "tan", "sec", "csc", "cot", "exp", "abs", "erf", "ln", "log"];
  var ALIAS = { arcsin: "asin", arccos: "acos", arctan: "atan", arcsinh: "asinh", arccosh: "acosh", arctanh: "atanh", heaviside: "u", step: "u" };
  var GREEK = ["alpha", "beta", "gamma", "theta", "lambda", "omega", "sigma", "zeta", "phi", "tau", "mu", "rho"];
  /* opts: { step: true } treats u(…) as the unit step · { lnlog: true } reads log as the natural logarithm (nerdamer output) */
  MT.parse = function (src, opts) {
    opts = opts || {};
    var s = String(src == null ? "" : src).replace(/[−–—]/g, "-").replace(/[×·∙]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/√/g, "sqrt").replace(/\*\*/g, "^").replace(/ω/g, "omega").replace(/θ/g, "theta").replace(/α/g, "alpha").replace(/β/g, "beta").replace(/τ/g, "tau").replace(/δ/g, "delta")
      .replace(/[\[{]/g, "(").replace(/[\]}]/g, ")").replace(/,/g, ".").toLowerCase();
    if (!s.trim()) throw new Err("empty");
    if (s.length > 400) throw new Err("long");
    var toks = [], i = 0, m;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) { toks.push({ t: "num", v: parseFloat(m[1]) }); i += m[1].length; continue; }
      if (/[a-z]/.test(ch)) {
        m = /^[a-z0-9]*/.exec(s.slice(i))[0];
        var w = /^[a-z]+/.exec(m)[0], j = 0;
        while (j < w.length) {
          var rest = w.slice(j), hit = null;
          for (var q = 0; q < FUNCS.length; q++) if (rest.indexOf(FUNCS[q]) === 0) { hit = FUNCS[q]; break; }
          if (hit === "log" && s.slice(i + j + 3, i + j + 5) === "10") { toks.push({ t: "fn", v: "log10" }); j += 3; i += 2; continue; }
          if (hit) { toks.push({ t: "fn", v: ALIAS[hit] || hit }); j += hit.length; continue; }
          if (rest.indexOf("pi") === 0) { toks.push({ t: "sym", v: "pi" }); j += 2; continue; }
          var g = null;
          for (q = 0; q < GREEK.length; q++) if (rest.indexOf(GREEK[q]) === 0) { g = GREEK[q]; break; }
          if (g) { toks.push({ t: "sym", v: g }); j += g.length; continue; }
          if (opts.step && rest[0] === "u" && j === w.length - 1 && s[i + w.length] === "(") { toks.push({ t: "fn", v: "u" }); j++; continue; }
          toks.push({ t: "sym", v: rest[0] }); j++;
        }
        i += w.length; continue;
      }
      if ("+-*/^()|".indexOf(ch) >= 0) { toks.push({ t: ch }); i++; continue; }
      throw new Err("char", ch);
    }
    var p = 0, bars = 0;
    function peek() { return toks[p]; }
    function eat(t) { if (!toks[p] || toks[p].t !== t) throw new Err(t === ")" ? "paren" : "syntax", toks[p] ? toks[p].t : "end"); p++; }
    function expr() {
      var terms = [term()];
      while (peek() && (peek().t === "+" || peek().t === "-")) { var op = toks[p++].t, t = term(); terms.push(op === "-" ? neg(t) : t); }
      return add(terms);
    }
    function startsPrimary(t) { return t && (t.t === "num" || t.t === "sym" || t.t === "fn" || t.t === "(" || (t.t === "|" && bars === 0)); }
    function term() {
      var fs = [unary()];
      for (;;) {
        var t = peek();
        if (t && t.t === "*") { p++; fs.push(unary()); }
        else if (t && t.t === "/") { p++; fs.push(pow(unary(), N(-1))); }
        else if (startsPrimary(t)) fs.push(power());
        else break;
      }
      return mul(fs);
    }
    function unary() {
      var t = peek();
      if (t && t.t === "-") { p++; return neg(unary()); }
      if (t && t.t === "+") { p++; return unary(); }
      return power();
    }
    function power() {
      var b = primary();
      if (peek() && peek().t === "^") { p++; return pow(b, unary()); }
      return b;
    }
    function implicitArg() { // sin 2x → sin(2x)
      var fs = [], t;
      while ((t = peek()) && (t.t === "num" || t.t === "sym")) { var b = t.t === "num" ? N(t.v) : S(t.v); p++; if (peek() && peek().t === "^") { p++; b = pow(b, unary()); } fs.push(b); }
      if (!fs.length) throw new Err("arg");
      return mul(fs);
    }
    function primary() {
      var t = toks[p];
      if (!t) throw new Err("syntax", "end");
      if (t.t === "num") { p++; return N(t.v); }
      if (t.t === "sym") { p++; return S(t.v); }
      if (t.t === "(") { p++; var e = expr(); eat(")"); return e; }
      if (t.t === "|") { p++; bars++; var a = expr(); bars--; eat("|"); return fn("abs", a); }
      if (t.t === "fn") {
        p++;
        var name = t.v, ex = null;
        if (name === "log" && opts.lnlog) name = "ln"; else if (name === "log") name = "log10";
        if (peek() && peek().t === "^") { p++; if (peek() && peek().t === "-") { p++; ex = neg(primary()); } else ex = primary(); }
        var arg;
        if (peek() && peek().t === "(") { p++; arg = expr(); eat(")"); } else arg = implicitArg();
        var f = fn(name, arg);
        if (ex) { if (isN(ex, -1) && /^(sin|cos|tan)$/.test(name)) f = fn("a" + name, arg); else f = pow(f, ex); }
        return f;
      }
      throw new Err("syntax", t.t);
    }
    var out = expr();
    if (p < toks.length) throw new Err(toks[p].t === ")" ? "paren" : "syntax", toks[p].t);
    return out;
  };

  /* ------------------------------------------------------------------ evaluation */
  var MF = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: function (x) { return 1 / Math.cos(x); }, csc: function (x) { return 1 / Math.sin(x); }, cot: function (x) { return Math.cos(x) / Math.sin(x); },
    asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    ln: Math.log, abs: Math.abs, u: function (x) { return x >= 0 ? 1 : 0; }, delta: function () { return 0; },
    erf: function (x) {
      var ax = Math.abs(x), r;
      if (ax < 2.5) { var sum = ax, term = ax; for (var n = 1; n < 80; n++) { term *= -ax * ax / n; var add1 = term / (2 * n + 1); sum += add1; if (Math.abs(add1) < 1e-17) break; } r = 2 / Math.sqrt(Math.PI) * sum; }
      else { var f = 0; for (var k = 60; k >= 1; k--) f = k / 2 / (ax + f); r = 1 - Math.exp(-ax * ax) / (Math.sqrt(Math.PI) * (ax + f)); }
      return x >= 0 ? r : -r;
    }
  };
  function evalf(a, env) {
    switch (a.k) {
      case "n": return a.v;
      case "s": if (a.n in env) return env[a.n]; if (a.n === "pi") return Math.PI; if (a.n === "e") return Math.E; throw new Err("var", a.n);
      case "+": for (var s = 0, i = 0; i < a.a.length; i++) s += evalf(a.a[i], env); return s;
      case "*": for (var q = 1, j = 0; j < a.a.length; j++) q *= evalf(a.a[j], env); return q;
      case "^":
        var b = evalf(a.b, env), e = evalf(a.e, env);
        if (b < 0 && !isInt(e)) { var r = rat(e); if (r && r[1] % 2 === 1) return (r[0] % 2 ? -1 : 1) * Math.pow(-b, e); }
        return Math.pow(b, e);
      default: if (!MF[a.n]) throw new Err("fn", a.n); return MF[a.n](evalf(a.a, env));
    }
  }
  MT.evalf = evalf;
  MT.compile = function (node, v) { var env = {}; return function (x) { env[v] = x; return evalf(node, env); }; };
  function symbols(a, out) {
    out = out || {};
    if (a.k === "s") { if (a.n !== "pi" && a.n !== "e") out[a.n] = 1; }
    else if (a.k === "+" || a.k === "*") a.a.forEach(function (x) { symbols(x, out); });
    else if (a.k === "^") { symbols(a.b, out); symbols(a.e, out); }
    else if (a.k === "f") symbols(a.a, out);
    return out;
  }
  MT.symbols = function (a) { return Object.keys(symbols(a)).sort(); };
  function dep(a, v) {
    switch (a.k) {
      case "n": return false;
      case "s": return a.n === v;
      case "+": case "*": return a.a.some(function (x) { return dep(x, v); });
      case "^": return dep(a.b, v) || dep(a.e, v);
      default: return dep(a.a, v);
    }
  }
  MT.dep = dep;
  function subst(a, key, by) {
    if (str(a) === key) return by;
    switch (a.k) {
      case "+": return add(a.a.map(function (x) { return subst(x, key, by); }));
      case "*": return mul(a.a.map(function (x) { return subst(x, key, by); }));
      case "^": return pow(subst(a.b, key, by), subst(a.e, key, by));
      case "f": return fn(a.n, subst(a.a, key, by));
      default: return a;
    }
  }
  MT.subst = function (a, v, by) { return subst(a, v, by); };

  /* ------------------------------------------------------------------ numbers → TeX */
  function rat(x, maxDen, tol) {
    maxDen = maxDen || 10000; tol = tol || 1e-11;
    if (!isFinite(x)) return null;
    var sgn = x < 0 ? -1 : 1, a = Math.abs(x), h0 = 0, h1 = 1, k0 = 1, k1 = 0, y = a;
    for (var i = 0; i < 24; i++) {
      var f = Math.floor(y), h2 = f * h1 + h0, k2 = f * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(a - h1 / k1) <= tol * Math.max(1, a)) return [sgn * h1, k1];
      var fr = y - f; if (fr < 1e-13) break; y = 1 / fr;
    }
    return null;
  }
  MT.rat = rat;
  function fmt(x, sig) {
    if (!isFinite(x)) return isNaN(x) ? "\\text{–}" : (x < 0 ? "-" : "") + "\\infty";
    var ax = Math.abs(x);
    if (ax !== 0 && (ax >= 1e7 || ax < 1e-4)) { var e = Math.floor(Math.log10(ax)), mant = +(x / Math.pow(10, e)).toPrecision(sig || 5); return mant + "\\times 10^{" + e + "}"; }
    return String(+x.toPrecision(sig || 6));
  }
  function numTex(v) {
    if (isInt(v) && Math.abs(v) < 1e15) return String(Math.round(v));
    var r = rat(v, 5000);
    if (r) return (r[0] < 0 ? "-" : "") + "\\frac{" + Math.abs(r[0]) + "}{" + r[1] + "}";
    return fmt(v);
  }
  MT.numTex = numTex; MT.fmt = fmt;
  MT.niceTex = function (x, sig) {
    if (Math.abs(x) < 1e-12) return "0";
    var r = rat(x, 1000);
    if (r && Math.abs(r[0]) < 100000) return numTex(x);
    var forms = [[Math.PI, "\\pi", 1], [1 / Math.PI, "\\pi", -1], [Math.PI * Math.PI, "\\pi^{2}", 1], [1 / (Math.PI * Math.PI), "\\pi^{2}", -1], [Math.SQRT2, "\\sqrt{2}", 1], [Math.sqrt(3), "\\sqrt{3}", 1], [Math.sqrt(3) / Math.PI, "\\sqrt{3}|\\pi", 2], [Math.SQRT2 / Math.PI, "\\sqrt{2}|\\pi", 2], [Math.E, "e", 1], [1 / Math.E, "e", -1]];
    if (x > 0) { var lq = rat(Math.log(x), 4); if (lq && lq[0] !== 0 && Math.abs(lq[0]) <= 40) return "e^{" + numTex(lq[0] / lq[1]) + "}"; }
    for (var i = 0; i < forms.length; i++) {
      var q = rat(x / forms[i][0], 400);
      if (!q || Math.abs(q[0]) > 2000) continue;
      var sg = q[0] < 0 ? "-" : "", p = Math.abs(q[0]), d = q[1], sym = forms[i][1], mode = forms[i][2];
      if (mode === 1) return sg + (d === 1 ? (p === 1 ? "" : p) + sym : "\\frac{" + (p === 1 ? "" : p) + sym + "}{" + d + "}");
      if (mode === -1) return sg + "\\frac{" + p + "}{" + (d === 1 ? "" : d) + sym + "}";
      var parts = sym.split("|");
      return sg + "\\frac{" + (p === 1 ? "" : p) + parts[0] + "}{" + (d === 1 ? "" : d) + parts[1] + "}";
    }
    return fmt(x, sig || 5);
  };

  /* ------------------------------------------------------------------ TeX printer */
  var FT = { sin: "\\sin", cos: "\\cos", tan: "\\tan", sec: "\\sec", csc: "\\csc", cot: "\\cot", asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh",
    asinh: "\\operatorname{arsinh}", acosh: "\\operatorname{arcosh}", atanh: "\\operatorname{artanh}", ln: "\\ln", u: "u", delta: "\\delta", erf: "\\operatorname{erf}" };
  function symTex(n) { return n === "pi" ? "\\pi" : GREEK.indexOf(n) >= 0 ? "\\" + n : n; }
  function par(s) { return "\\left(" + s + "\\right)"; }
  function texSigned(a) { // → { neg, body }
    if (a.k === "n") return { neg: a.v < 0, body: numTex(Math.abs(a.v)) };
    if (a.k === "*") return prodTex(a);
    if (a.k === "^" && a.e.k === "n" && a.e.v < 0) return prodTex({ k: "*", a: [a] });
    return { neg: false, body: tex(a) };
  }
  function tex(a) {
    switch (a.k) {
      case "n": return numTex(a.v);
      case "s": return symTex(a.n);
      case "+":
        var ts = a.a.map(texSigned);
        if (ts[0].neg) { var fp = ts.findIndex(function (r) { return !r.neg; }); if (fp > 0) ts.unshift(ts.splice(fp, 1)[0]); }
        return ts.map(function (r, i) { return (r.neg ? (i ? " - " : "-") : i ? " + " : "") + r.body; }).join("");
      case "*": var r = prodTex(a); return (r.neg ? "-" : "") + r.body;
      case "^": return powTex(a);
      default:
        if (a.n === "abs") return "\\left|" + tex(a.a) + "\\right|";
        if (a.a.k === "f" && a.a.n === "abs") return (FT[a.n] || "\\operatorname{" + a.n + "}") + tex(a.a);
        return (FT[a.n] || "\\operatorname{" + a.n + "}") + par(tex(a.a));
    }
  }
  function atomic(a) { return a.k === "s" || (a.k === "n" && a.v >= 0 && isInt(a.v)) || (a.k === "f"); }
  function powTex(a) {
    var b = a.b, e = a.e;
    if (e.k === "n" && e.v < 0) { var pr = prodTex({ k: "*", a: [a] }); return (pr.neg ? "-" : "") + pr.body; }
    if (e.k === "n" && e.v === 0.5) return "\\sqrt{" + tex(b) + "}";
    if (e.k === "n") { var q = rat(e.v, 12); if (q && q[0] === 1 && q[1] > 2) return "\\sqrt[" + q[1] + "]{" + tex(b) + "}"; }
    var et = tex(e);
    if (b.k === "f" && FT[b.n] && b.n !== "abs" && b.n !== "u" && b.n !== "delta" && e.k === "n" && isInt(e.v) && e.v > 1) return FT[b.n] + "^{" + et + "}" + par(tex(b.a));
    return (atomic(b) && b.k !== "f" ? tex(b) : b.k === "f" && b.n === "abs" ? tex(b) : par(tex(b))) + "^{" + et + "}";
  }
  function prodTex(a) {
    var c = 1, num = [], den = [];
    a.a.forEach(function (f) {
      if (f.k === "n") c *= f.v;
      else if (f.k === "^" && f.e.k === "n" && f.e.v < 0) den.push(pow(f.b, N(-f.e.v)));
      else if (f.k === "^" && f.e.k === "*" && f.e.a[0].k === "n" && f.e.a[0].v < 0 && !(f.b.k === "s" && f.b.n === "e")) den.push({ k: "^", b: f.b, e: neg(f.e) });
      else num.push(f);
    });
    var isNeg = c < 0; c = Math.abs(c);
    var cn = c, cd = 1, r = rat(c, 5000);
    if (!isInt(c) && r) { cn = Math.abs(r[0]); cd = r[1]; }
    function join(list, lead) {
      var out = lead || "";
      list.forEach(function (f, i) {
        var t = f.k === "+" ? par(tex(f)) : tex(f);
        var prev = i ? list[i - 1] : null;
        var numLead = (f.k === "^" && f.b.k === "n") || f.k === "n";
        if (out && numLead) out += " \\cdot ";
        else if (prev && (prev.k === "f" || (prev.k === "^" && prev.b.k === "f")) ) out += "\\,";
        else if (out && /\d$/.test(out) && f.k === "^" && f.e.k === "n" && f.e.v === 0.5) out += "";
        out += t;
      });
      return out;
    }
    var body;
    if (!den.length) {
      if (cd === 1) body = num.length ? join(num, cn === 1 ? "" : numTex(cn)) : numTex(cn);
      else if (!num.length) body = "\\frac{" + cn + "}{" + cd + "}";
      else if (num.length === 1 && num[0].k !== "+" && !(num[0].k === "f") && tex(num[0]).length < 12) body = "\\frac{" + join(num, cn === 1 ? "" : String(cn)) + "}{" + cd + "}";
      else body = "\\frac{" + cn + "}{" + cd + "}" + (num[0].k === "^" && num[0].b.k === "n" ? " \\cdot " : "\\,") + join(num, "");
    } else {
      var top = num.length ? (num.length === 1 && num[0].k === "+" && cn === 1 ? tex(num[0]) : join(num, cn === 1 ? "" : numTex(cn))) : numTex(cn);
      var bot = den.length === 1 && den[0].k === "+" && cd === 1 ? tex(den[0]) : join(den, cd === 1 ? "" : String(cd));
      body = "\\frac{" + top + "}{" + bot + "}";
    }
    return { neg: isNeg, body: body };
  }
  MT.tex = tex;
  /* plain text (for copying into other software) */
  function text(a, prec) {
    prec = prec || 0;
    var s, p;
    switch (a.k) {
      case "n": s = String(+a.v.toPrecision(12)); p = a.v < 0 ? 1 : 9; break;
      case "s": s = a.n; p = 9; break;
      case "+": s = a.a.map(function (t, i) { var x = text(t, 1); return i ? (x[0] === "-" ? " - " + x.slice(1) : " + " + x) : x; }).join(""); p = 1; break;
      case "*":
        if (a.a[0].k === "n" && a.a[0].v === -1) { s = "-" + text(mul(a.a.slice(1)), 2); p = 1; }
        else { s = a.a.map(function (t) { return text(t, 2); }).join("*"); p = 2; }
        break;
      case "^": s = text(a.b, 4) + "^" + text(a.e, 4); p = 3; break;
      default: s = (a.n === "ln" ? "ln" : a.n) + "(" + text(a.a) + ")"; p = 9;
    }
    return p < prec || (prec === 4 && p < 9) ? "(" + s + ")" : s;
  }
  MT.text = text;
  /* nerdamer syntax (ln → log) */
  MT.nerd = function (a) { return text(a).replace(/\bln\(/g, "log("); };

  /* ------------------------------------------------------------------ differentiation */
  function diff(a, v) {
    if (!dep(a, v)) return ZERO;
    switch (a.k) {
      case "s": return ONE;
      case "+": return add(a.a.map(function (x) { return diff(x, v); }));
      case "*":
        return add(a.a.map(function (f, i) {
          if (!dep(f, v)) return ZERO;
          return mul([diff(f, v)].concat(a.a.filter(function (_, j) { return j !== i; })));
        }));
      case "^":
        var b = a.b, e = a.e;
        if (!dep(e, v)) return mul([e, pow(b, add([e, N(-1)])), diff(b, v)]);
        if (!dep(b, v)) return mul([a, fn("ln", b), diff(e, v)]);
        return mul([a, add([mul([diff(e, v), fn("ln", b)]), mul([e, diff(b, v), pow(b, N(-1))])])]);
      default:
        var u = a.a, du = diff(u, v), o;
        switch (a.n) {
          case "sin": o = fn("cos", u); break;
          case "cos": o = neg(fn("sin", u)); break;
          case "tan": o = pow(fn("sec", u), N(2)); break;
          case "sec": o = mul([fn("sec", u), fn("tan", u)]); break;
          case "csc": o = neg(mul([fn("csc", u), fn("cot", u)])); break;
          case "cot": o = neg(pow(fn("csc", u), N(2))); break;
          case "asin": o = pow(add([ONE, neg(pow(u, N(2)))]), N(-0.5)); break;
          case "acos": o = neg(pow(add([ONE, neg(pow(u, N(2)))]), N(-0.5))); break;
          case "atan": o = pow(add([ONE, pow(u, N(2))]), N(-1)); break;
          case "sinh": o = fn("cosh", u); break;
          case "cosh": o = fn("sinh", u); break;
          case "tanh": o = pow(fn("cosh", u), N(-2)); break;
          case "asinh": o = pow(add([pow(u, N(2)), ONE]), N(-0.5)); break;
          case "acosh": o = pow(add([pow(u, N(2)), N(-1)]), N(-0.5)); break;
          case "atanh": o = pow(add([ONE, neg(pow(u, N(2)))]), N(-1)); break;
          case "ln": o = pow(u, N(-1)); break;
          case "abs": o = mul([u, pow(fn("abs", u), N(-1))]); break;
          case "u": o = fn("delta", u); break;
          case "erf": o = mul([N(2), pow(S("pi"), N(-0.5)), pow(S("e"), neg(pow(u, N(2))))]); break;
          default: throw new Err("nodiff", a.n);
        }
        return mul([o, du]);
    }
  }
  MT.diff = diff;
  /* rules used by one term (labels are translated in the UI) */
  function rulesOf(a, v, set) {
    if (!dep(a, v)) { set.const = 1; return; }
    if (a.k === "s") { set.x = 1; return; }
    if (a.k === "+") { set.sum = 1; a.a.forEach(function (x) { rulesOf(x, v, set); }); return; }
    if (a.k === "*") {
      var d = a.a.filter(function (f) { return dep(f, v); });
      if (d.length < a.a.length) set.cmul = 1;
      if (d.length > 1) { if (d.some(function (f) { return f.k === "^" && f.e.k === "n" && f.e.v < 0; })) set.quot = 1; else set.prod = 1; }
      d.forEach(function (f) { rulesOf(f, v, set); });
      return;
    }
    if (a.k === "^") {
      var bd = dep(a.b, v), ed = dep(a.e, v);
      if (bd && !ed) { set.power = 1; if (a.b.k !== "s") { set.chain = 1; rulesOf(a.b, v, set); } }
      else if (!bd && ed) { set.exp = 1; if (a.e.k !== "s") { set.chain = 1; rulesOf(a.e, v, set); } }
      else { set.logd = 1; }
      return;
    }
    set[/^(sin|cos|tan|sec|csc|cot)$/.test(a.n) ? "trig" : /^a(sin|cos|tan)$/.test(a.n) ? "atrig" : /h$/.test(a.n) ? "hyp" : a.n === "ln" ? "ln" : "other"] = 1;
    if (a.a.k !== "s") { set.chain = 1; rulesOf(a.a, v, set); }
  }
  MT.diffSteps = function (a, v) {
    var terms = a.k === "+" ? a.a : [a];
    return terms.map(function (t) { var set = {}; rulesOf(t, v, set); delete set.sum; return { term: t, d: diff(t, v), rules: Object.keys(set) }; });
  };
  var SAMPLE = [0.37, 0.83, 1.29, 1.91, 2.63, -0.71, -1.43, 3.7, 0.11, 5.3];
  function envFor(node, v, x) { var env = {}, i = 0; MT.symbols(node).forEach(function (n) { env[n] = n === v ? x : 1.3 + 0.37 * (i++); }); env[v] = x; return env; }
  /* true when dF/dv = f at the sample points where both are defined (needs at least 3 such points) */
  MT.checkDeriv = function (F, f, v) {
    var ok = 0;
    for (var i = 0; i < SAMPLE.length; i++) {
      var x = SAMPLE[i], h = 1e-4, env = envFor(add([F, f]), v, x), e1 = Object.assign({}, env), e2 = Object.assign({}, env), e3 = Object.assign({}, env), e4 = Object.assign({}, env);
      e1[v] = x + h; e2[v] = x - h; e3[v] = x + 2 * h; e4[v] = x - 2 * h;
      var d, fx;
      try { d = (8 * (evalf(F, e1) - evalf(F, e2)) - (evalf(F, e3) - evalf(F, e4))) / (12 * h); fx = evalf(f, env); } catch (e) { return false; }
      if (!isFinite(d) || !isFinite(fx)) continue;
      if (Math.abs(d - fx) > 1e-6 * Math.max(1, Math.abs(fx), Math.abs(d))) return false;
      ok++;
    }
    return ok >= 3;
  };
  MT.sameFn = function (A, B, v) {
    var ok = 0;
    for (var i = 0; i < SAMPLE.length; i++) {
      var env = envFor(add([A, B]), v, SAMPLE[i]), a, b;
      try { a = evalf(A, env); b = evalf(B, env); } catch (e) { return false; }
      if (!isFinite(a) || !isFinite(b)) continue;
      if (Math.abs(a - b) > 1e-8 * Math.max(1, Math.abs(a), Math.abs(b))) return false;
      ok++;
    }
    return ok >= 3;
  };

  /* ------------------------------------------------------------------ polynomials (real, lowest power first) */
  function polyOf(a, v) {
    if (!dep(a, v)) { if (MT.symbols(a).length) return null; return [evalf(a, {})]; }
    switch (a.k) {
      case "s": return [0, 1];
      case "+": var s = [0]; for (var i = 0; i < a.a.length; i++) { var p = polyOf(a.a[i], v); if (!p) return null; s = padd(s, p); } return s;
      case "*": var m = [1]; for (var j = 0; j < a.a.length; j++) { var q = polyOf(a.a[j], v); if (!q) return null; m = pmul(m, q); } return m;
      case "^":
        if (a.e.k !== "n" || !isInt(a.e.v) || a.e.v < 0 || a.e.v > 24) return null;
        var b = polyOf(a.b, v); if (!b) return null;
        var r = [1]; for (var k = 0; k < Math.round(a.e.v); k++) r = pmul(r, b);
        return r;
      default: return null;
    }
  }
  function padd(a, b) { var n = Math.max(a.length, b.length), r = []; for (var i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0)); return ptrim(r); }
  function pmul(a, b) { var r = new Array(a.length + b.length - 1).fill(0); for (var i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]; return ptrim(r); }
  function ptrim(p) { var r = p.slice(); while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop(); return r; }
  function pval(p, x) { for (var s = 0, i = p.length - 1; i >= 0; i--) s = s * x + p[i]; return s; }
  function pnode(p, v) { return add(p.map(function (c, i) { return mul([N(snap(c)), pow(S(v), N(i))]); }).reverse()); }
  function snap(x) { var r = rat(x, 2000, 2e-8); return r ? r[0] / r[1] : x; }
  function pdivmod(a, b) { // a = q b + r
    a = a.slice(); var q = new Array(Math.max(1, a.length - b.length + 1)).fill(0), db = b.length - 1, lb = b[db];
    for (var i = a.length - 1; i >= db; i--) { var c = a[i] / lb; q[i - db] = c; for (var j = 0; j <= db; j++) a[i - db + j] -= c * b[j]; }
    return [ptrim(q), ptrim(a.slice(0, Math.max(1, db)))];
  }
  MT.polyOf = polyOf; MT.pval = pval;
  function linear(a, v) { var p = polyOf(a, v); return p && p.length === 2 ? [p[1], p[0]] : null; }
  /* complex roots of a real polynomial (Durand–Kerner), clustered into { re, im, m } with im ≥ 0 */
  function roots(p) {
    var n = p.length - 1, lead = p[n], c = p.map(function (x) { return x / lead; }), z = [], i, j, it;
    for (i = 0; i < n; i++) { var ang = 2 * Math.PI * i / n + 0.4, rad = 1 + Math.abs(c[0]) ** (1 / n); z.push([rad * Math.cos(ang), rad * Math.sin(ang)]); }
    for (it = 0; it < 600; it++) {
      var moved = 0;
      for (i = 0; i < n; i++) {
        var fr = 1, fi = 0;
        for (j = n - 1; j >= 0; j--) { var tr = fr * z[i][0] - fi * z[i][1] + c[j], ti = fr * z[i][1] + fi * z[i][0]; fr = tr; fi = ti; }
        var dr = 1, di = 0;
        for (j = 0; j < n; j++) if (j !== i) { var ar = z[i][0] - z[j][0], ai = z[i][1] - z[j][1], xr = dr * ar - di * ai; di = dr * ai + di * ar; dr = xr; }
        var den = dr * dr + di * di || 1e-300, qr = (fr * dr + fi * di) / den, qi = (fi * dr - fr * di) / den;
        z[i][0] -= qr; z[i][1] -= qi; moved = Math.max(moved, Math.abs(qr) + Math.abs(qi));
      }
      if (moved < 1e-14) break;
    }
    var cl = [];
    z.forEach(function (r) {
      var hit = cl.find(function (g) { return Math.hypot(g.re / g.m - r[0], g.im / g.m - r[1]) < 2e-3 * Math.max(1, Math.hypot(r[0], r[1])); });
      if (hit) { hit.re += r[0]; hit.im += r[1]; hit.m++; } else cl.push({ re: r[0], im: r[1], m: 1 });
    });
    var out = [];
    cl.forEach(function (g) {
      var re = snap(g.re / g.m), im = g.im / g.m;
      if (Math.abs(im) < 1e-6 * Math.max(1, Math.abs(re))) out.push({ re: re, im: 0, m: g.m });
      else if (im > 0) out.push({ re: re, im: Math.sqrt(snap(im * im)), m: g.m });
    });
    return out;
  }
  MT.roots = roots;
  function solveLin(A, b) {
    var n = b.length, i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i; for (j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[piv][i])) piv = j;
      if (Math.abs(A[piv][i]) < 1e-12) return null;
      var t = A[i]; A[i] = A[piv]; A[piv] = t; var tb = b[i]; b[i] = b[piv]; b[piv] = tb;
      for (j = i + 1; j < n; j++) { var f = A[j][i] / A[i][i]; for (k = i; k < n; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) { var s = b[i]; for (j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    return x;
  }

  /* ------------------------------------------------------------------ integration by rules (returns a tree or null; never trusted without checkDeriv) */
  function integrate(a, v, depth) {
    depth = depth || 0;
    if (depth > 6) return null;
    var X = S(v);
    if (!dep(a, v)) return mul([a, X]);
    if (a.k === "+") { var parts = []; for (var i = 0; i < a.a.length; i++) { var r = integrate(a.a[i], v, depth); if (!r) return null; parts.push(r); } return add(parts); }
    if (a.k === "*") {
      var cs = a.a.filter(function (f) { return !dep(f, v); }), ds = a.a.filter(function (f) { return dep(f, v); });
      if (cs.length) { var in1 = integrate(mul(ds), v, depth); return in1 ? mul(cs.concat([in1])) : null; }
    }
    if (a.k === "^" && !dep(a.e, v) && linear(a.b, v) && !isN(a.e, 1)) return table(a, v);
    var p = polyOf(a, v);
    if (p) return add(p.map(function (c, i) { return mul([N(snap(c / (i + 1))), pow(X, N(i + 1))]); }).reverse());
    var res = table(a, v) || prodRules(a, v, depth) || rational(a, v) || usub(a, v, depth);
    if (res) return res;
    // expand a product/power of sums and try term by term
    var ex = expand(a);
    if (ex.k === "+" && str(ex) !== str(a)) return integrate(ex, v, depth + 1);
    return null;
  }
  function expand(a) {
    if (a.k === "*") {
      var terms = [ONE];
      a.a.forEach(function (f) {
        var g = expand(f), list = g.k === "+" ? g.a : [g], nt = [];
        terms.forEach(function (t) { list.forEach(function (u) { nt.push(mul([t, u])); }); });
        terms = nt;
      });
      return add(terms);
    }
    if (a.k === "^" && a.b.k === "+" && a.e.k === "n" && isInt(a.e.v) && a.e.v > 1 && a.e.v <= 6) { var r = ONE; for (var i = 0; i < a.e.v; i++) r = expand(mul([r, a.b])); return r; }
    if (a.k === "+") return add(a.a.map(expand));
    return a;
  }
  MT.expand = expand;
  function table(a, v) {
    var X = S(v), l, u, k;
    if (a.k === "^") {
      var b = a.b, e = a.e;
      if (!dep(e, v) && (l = linear(b, v))) { // (ax+b)^n
        if (isN(e, -1)) return mul([N(1 / l[0]), fn("ln", fn("abs", b))]);
        return mul([pow(b, add([e, ONE])), pow(mul([N(l[0]), add([e, ONE])]), N(-1))]);
      }
      if (!dep(b, v) && (l = linear(e, v))) return mul([a, pow(mul([N(l[0]), fn("ln", b)]), N(-1))]); // c^(ax+b)
      var pe = b.k === "s" && b.n === "e" ? polyOf(e, v) : null; // e^{-a x²} → erf
      if (pe && pe.length === 3 && pe[0] === 0 && pe[1] === 0 && pe[2] < 0) { var ra = pow(N(-pe[2]), N(0.5)); return mul([N(0.5), pow(S("pi"), N(0.5)), pow(ra, N(-1)), fn("erf", mul([ra, X]))]); }
      var q = polyOf(b, v);
      if (q && q.length === 3 && e.k === "n") {
        var A = q[2], B = q[1], C = q[0], disc = B * B - 4 * A * C, sh = add([X, N(snap(B / (2 * A)))]), kk = snap((4 * A * C - B * B) / (4 * A * A)); // A((x+B/2A)² + kk)
        if (e.v === -1) {
          if (disc < -1e-12) { var rt = pow(N(kk), N(0.5)); return mul([N(1 / A), pow(rt, N(-1)), fn("atan", mul([sh, pow(rt, N(-1))]))]); }
          if (disc > 1e-12) { var r1 = snap((-B + Math.sqrt(disc)) / (2 * A)), r2 = snap((-B - Math.sqrt(disc)) / (2 * A)); return mul([N(1 / (A * (r1 - r2))), fn("ln", fn("abs", mul([add([X, N(-r1)]), pow(add([X, N(-r2)]), N(-1))])))]); }
          return mul([N(-1 / A), pow(sh, N(-1))]);
        }
        if (e.v === -0.5) {
          if (A > 0) return mul([pow(N(A), N(-0.5)), fn("ln", fn("abs", add([sh, pow(add([pow(sh, N(2)), N(kk)]), N(0.5))])))]);
          if (A < 0 && kk < 0) return mul([pow(N(-A), N(-0.5)), fn("asin", mul([sh, pow(N(-kk), N(-0.5))]))]);
        }
        if (e.v === 0.5 && B === 0) {
          if (A < 0 && C > 0) { var a2 = C / -A; return mul([pow(N(-A), N(0.5)), add([mul([N(0.5), X, pow(add([N(a2), neg(pow(X, N(2)))]), N(0.5))]), mul([N(a2 / 2), fn("asin", mul([X, pow(N(a2), N(-0.5))]))])])]); }
          if (A > 0) { var k2 = C / A, sq = pow(add([pow(X, N(2)), N(k2)]), N(0.5)); return mul([pow(N(A), N(0.5)), add([mul([N(0.5), X, sq]), mul([N(k2 / 2), fn("ln", fn("abs", add([X, sq])))])])]); }
        }
      }
      if (b.k === "f" && e.k === "n" && (l = linear(b.a, v))) {
        u = b.a; k = N(1 / l[0]);
        if (e.v === 2) {
          if (b.n === "sec") return mul([k, fn("tan", u)]);
          if (b.n === "csc") return mul([k, neg(fn("cot", u))]);
          if (b.n === "sin") return mul([k, add([mul([N(0.5), u]), mul([N(-0.25), fn("sin", mul([N(2), u]))])])]);
          if (b.n === "cos") return mul([k, add([mul([N(0.5), u]), mul([N(0.25), fn("sin", mul([N(2), u]))])])]);
          if (b.n === "tan") return mul([k, add([fn("tan", u), neg(u)])]);
          if (b.n === "cot") return mul([k, add([neg(fn("cot", u)), neg(u)])]);
          if (b.n === "sinh") return mul([k, add([mul([N(0.25), fn("sinh", mul([N(2), u]))]), mul([N(-0.5), u])])]);
          if (b.n === "cosh") return mul([k, add([mul([N(0.25), fn("sinh", mul([N(2), u]))]), mul([N(0.5), u])])]);
        }
        if (e.v === 3 && b.n === "sin") return mul([k, add([neg(fn("cos", u)), mul([N(1 / 3), pow(fn("cos", u), N(3))])])]);
        if (e.v === 3 && b.n === "cos") return mul([k, add([fn("sin", u), mul([N(-1 / 3), pow(fn("sin", u), N(3))])])]);
        if (e.v === -1 && b.n === "cos") return mul([k, fn("ln", fn("abs", add([fn("sec", u), fn("tan", u)])))]);
        if (e.v === -1 && b.n === "sin") return mul([k, neg(fn("ln", fn("abs", add([fn("csc", u), fn("cot", u)]))))]);
        if (e.v === -2 && b.n === "cos") return mul([k, fn("tan", u)]);
        if (e.v === -2 && b.n === "sin") return mul([k, neg(fn("cot", u))]);
        if (e.v === -2 && b.n === "cosh") return mul([k, fn("tanh", u)]);
      }
      return null;
    }
    if (a.k === "f" && (l = linear(a.a, v))) {
      u = a.a; k = N(1 / l[0]);
      switch (a.n) {
        case "sin": return mul([k, neg(fn("cos", u))]);
        case "cos": return mul([k, fn("sin", u)]);
        case "tan": return mul([k, neg(fn("ln", fn("abs", fn("cos", u))))]);
        case "cot": return mul([k, fn("ln", fn("abs", fn("sin", u)))]);
        case "sec": return mul([k, fn("ln", fn("abs", add([fn("sec", u), fn("tan", u)])))]);
        case "csc": return mul([k, neg(fn("ln", fn("abs", add([fn("csc", u), fn("cot", u)]))))]);
        case "sinh": return mul([k, fn("cosh", u)]);
        case "cosh": return mul([k, fn("sinh", u)]);
        case "tanh": return mul([k, fn("ln", fn("cosh", u))]);
        case "ln": return mul([k, add([mul([u, fn("ln", u)]), neg(u)])]);
        case "atan": return mul([k, add([mul([u, fn("atan", u)]), mul([N(-0.5), fn("ln", add([ONE, pow(u, N(2))]))])])]);
        case "asin": return mul([k, add([mul([u, fn("asin", u)]), pow(add([ONE, neg(pow(u, N(2)))]), N(0.5))])]);
        case "acos": return mul([k, add([mul([u, fn("acos", u)]), neg(pow(add([ONE, neg(pow(u, N(2)))]), N(0.5)))])]);
      }
    }
    return null;
  }
  function isExpLin(f, v) { return f.k === "^" && !dep(f.b, v) && linear(f.e, v); }
  function isTrigLin(f, v, names) { return f.k === "f" && names.indexOf(f.n) >= 0 && linear(f.a, v); }
  function prodRules(a, v, depth) {
    if (a.k !== "*") return null;
    var fs = a.a, X = S(v), i, l, m;
    if (fs.length === 2) {
      var f = fs[0], g = fs[1];
      // sec·tan, csc·cot
      var pair = function (n1, n2) { var x = fs.find(function (t) { return t.k === "f" && t.n === n1; }), y = fs.find(function (t) { return t.k === "f" && t.n === n2; }); return x && y && str(x.a) === str(y.a) && linear(x.a, v) ? x : null; };
      var st = pair("sec", "tan"); if (st) return mul([N(1 / linear(st.a, v)[0]), fn("sec", st.a)]);
      var cc = pair("csc", "cot"); if (cc) return mul([N(-1 / linear(cc.a, v)[0]), fn("csc", cc.a)]);
      // e^{ax+c} sin/cos(bx+d)
      var E = fs.find(function (t) { return isExpLin(t, v) && t.b.k === "s" && t.b.n === "e"; }), T = fs.find(function (t) { return isTrigLin(t, v, ["sin", "cos"]); });
      if (E && T) {
        var al = linear(E.e, v)[0], be = linear(T.a, v)[0], d = al * al + be * be;
        var sn = fn("sin", T.a), cn = fn("cos", T.a);
        return T.n === "sin" ? mul([N(1 / d), E, add([mul([N(al), sn]), mul([N(-be), cn])])]) : mul([N(1 / d), E, add([mul([N(al), cn]), mul([N(be), sn])])]);
      }
      // sin·cos, sin·sin, cos·cos with linear arguments → product to sum
      if (isTrigLin(f, v, ["sin", "cos"]) && isTrigLin(g, v, ["sin", "cos"])) {
        var A = f.a, B = g.a, sum = add([A, B]), dif = add([A, neg(B)]), ps;
        if (f.n === "sin" && g.n === "sin") ps = add([mul([N(0.5), fn("cos", dif)]), mul([N(-0.5), fn("cos", sum)])]);
        else if (f.n === "cos" && g.n === "cos") ps = add([mul([N(0.5), fn("cos", dif)]), mul([N(0.5), fn("cos", sum)])]);
        else if (f.n === "sin") ps = add([mul([N(0.5), fn("sin", sum)]), mul([N(0.5), fn("sin", dif)])]);
        else ps = add([mul([N(0.5), fn("sin", sum)]), mul([N(-0.5), fn("sin", dif)])]);
        return integrate(ps, v, depth + 1);
      }
    }
    // polynomial × (e^{lin} | sin | cos | sinh | cosh)(lin): tabular integration by parts
    var polyFs = [], other = [];
    fs.forEach(function (t) { (polyOf(t, v) ? polyFs : other).push(t); });
    if (polyFs.length && other.length === 1) {
      var G = other[0], P = polyOf(mul(polyFs), v);
      if (isExpLin(G, v) || isTrigLin(G, v, ["sin", "cos", "sinh", "cosh"])) {
        var terms = [], Gi = G, sign = 1, Pk = P;
        for (i = 0; i < P.length; i++) {
          Gi = integrate(Gi, v, depth + 1); if (!Gi) return null;
          terms.push(mul([N(sign), pnode(Pk, v), Gi]));
          Pk = Pk.slice(1).map(function (c, j) { return c * (j + 1); }); if (!Pk.length) break; sign = -sign;
        }
        return add(terms);
      }
      // polynomial × ln(lin) or atan(x): ∫P·g = Q·g − ∫Q·g′
      if (G.k === "f" && (G.n === "ln" || G.n === "atan" || G.n === "asin") && (l = linear(G.a, v))) {
        var Q = pnode([0].concat(P.map(function (c, j) { return c / (j + 1); })), v);
        var rest = integrate(expandRat(mul([Q, diff(G, v)]), v), v, depth + 1);
        return rest ? add([mul([Q, G]), neg(rest)]) : null;
      }
    }
    // polynomial × (ax+b)^e with e not a positive integer: substitute U = ax + b
    if (polyFs.length && other.length === 1 && other[0].k === "^" && other[0].e.k === "n" && (l = linear(other[0].b, v))) {
      var PU = polyOf(subst(mul(polyFs), v, mul([N(1 / l[0]), add([S("U_"), N(-l[1])])])), "U_"), ee = other[0].e.v, Ub = other[0].b;
      return mul([N(1 / l[0]), add(PU.map(function (c, j) { var ex = j + ee + 1; return Math.abs(ex) < 1e-12 ? mul([N(c), fn("ln", fn("abs", Ub))]) : mul([N(snap(c / ex)), pow(Ub, N(ex))]); }))]);
    }
    // x^n × ln(x)^m handled by parts once
    if (other.length === 1 && other[0].k === "^" && other[0].b.k === "f" && other[0].b.n === "ln" && isN(other[0].e, 2) && polyFs.length <= 1 && str(other[0].b.a) === v) {
      var Pq = polyFs.length ? polyOf(polyFs[0], v) : [1], Qn = pnode([0].concat(Pq.map(function (c, j) { return c / (j + 1); })), v);
      var r2 = integrate(mul([Qn, N(2), other[0].b, pow(S(v), N(-1))]), v, depth + 1);
      return r2 ? add([mul([Qn, other[0]]), neg(r2)]) : null;
    }
    return null;
  }
  function expandRat(a, v) { // divide polynomial numerator by polynomial denominator when possible
    var nd = numDen(a, v);
    if (!nd) return a;
    var qr = pdivmod(nd[0], nd[1]);
    return add([pnode(qr[0], v), mul([pnode(qr[1], v), pow(pnode(nd[1], v), N(-1))])]);
  }
  function numDen(a, v) {
    var fs = a.k === "*" ? a.a : [a], num = [1], den = [1];
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i];
      if (f.k === "^" && f.e.k === "n" && isInt(f.e.v) && f.e.v < 0) { var d = polyOf(pow(f.b, N(-f.e.v)), v); if (!d) return null; den = pmul(den, d); }
      else { var n = polyOf(f, v); if (!n) return null; num = pmul(num, n); }
    }
    return den.length > 1 ? [num, den] : null;
  }
  MT.numDen = numDen;
  /* rational function by partial fractions (numeric roots, snapped to fractions) */
  function rational(a, v) {
    var nd = numDen(a, v);
    if (!nd || nd[1].length > 9) return null;
    var X = S(v), num = nd[0], den = nd[1], qr = pdivmod(num, den), out = [], rs = roots(den), lead = den[den.length - 1];
    if (qr[0].some(function (c) { return Math.abs(c) > 1e-12; })) out.push(integrate(pnode(qr[0], v), v, 0));
    var R = qr[1];
    if (!R.some(function (c) { return Math.abs(c) > 1e-12; })) return add(out);
    var basis = [];
    rs.forEach(function (r) {
      for (var k = 1; k <= r.m; k++) {
        if (r.im === 0) basis.push({ r: r, k: k, t: 0 });
        else { basis.push({ r: r, k: k, t: 1 }); basis.push({ r: r, k: k, t: 2 }); }
      }
    });
    var n = basis.length;
    if (n !== den.length - 1) return null;
    var qd = function (r, x) { return (x - r.re) * (x - r.re) + r.im * r.im; };
    var bf = function (bs, x) { return bs.t === 0 ? 1 / Math.pow(x - bs.r.re, bs.k) : (bs.t === 1 ? x : 1) / Math.pow(qd(bs.r, x), bs.k); };
    var A = [], b = [], x0 = -2.317;
    for (var i = 0; i < n; i++) { var x = x0 + i * 4.71 / n + (i % 2 ? 0.137 : 0); A.push(basis.map(function (bs) { return bf(bs, x); })); b.push(pval(R, x) / pval(den, x)); }
    var co = solveLin(A, b);
    if (!co) return null;
    for (i = 0; i < n; i++) {
      var bs = basis[i], c = snap(co[i]);
      if (Math.abs(c) < 1e-10 && bs.t !== 1) continue;
      if (bs.t === 0) {
        var lin = add([X, N(-bs.r.re)]);
        out.push(bs.k === 1 ? mul([N(c), fn("ln", fn("abs", lin))]) : mul([N(c / (1 - bs.k)), pow(lin, N(1 - bs.k))]));
      } else if (bs.t === 1) {
        if (bs.k > 2) return null;
        var Bc = snap(co[i + 1]), ar = bs.r.re, br = bs.r.im, quad = add([pow(add([X, N(-ar)]), N(2)), N(snap(br * br))]);
        var bb = pow(N(snap(br * br)), N(0.5));
        if (bs.k === 2) { // ∫(Ax+B)/q² = −A/(2q) + (B + Aa)·[(x−a)/(2b²q) + atan((x−a)/b)/(2b³)]
          var kq = snap(Bc + c * ar), b2 = snap(br * br);
          if (Math.abs(c) > 1e-10) out.push(mul([N(-c / 2), pow(quad, N(-1))]));
          if (Math.abs(kq) > 1e-10) { out.push(mul([N(kq / (2 * b2)), add([X, N(-ar)]), pow(quad, N(-1))])); out.push(mul([N(kq / (2 * b2)), pow(bb, N(-1)), fn("atan", mul([add([X, N(-ar)]), pow(bb, N(-1))]))])); }
          i++; continue;
        }
        if (Math.abs(c) > 1e-10) out.push(mul([N(c / 2), fn("ln", quad)]));
        var k2 = snap(Bc + c * ar);
        if (Math.abs(k2) > 1e-10) out.push(mul([N(k2), pow(bb, N(-1)), fn("atan", mul([add([X, N(-ar)]), pow(bb, N(-1))]))]));
        i++;
      }
    }
    return add(out);
  }
  /* u-substitution: ∫ h(g(x)) g′(x) dx for every sub-expression g */
  function subexprs(a, v, out) {
    if (!dep(a, v) || a.k === "s") return;
    if (a.k === "+" || a.k === "*") a.a.forEach(function (x) { subexprs(x, v, out); });
    else if (a.k === "^") { subexprs(a.b, v, out); subexprs(a.e, v, out); }
    else if (a.k === "f") subexprs(a.a, v, out);
    out.push(a);
  }
  function usub(a, v, depth) {
    var list = []; subexprs(a, v, list);
    var seen = {}, U = S("U_"), key = str(a);
    for (var i = 0; i < list.length; i++) {
      var g = list[i], gk = str(g);
      if (gk === key || seen[gk] || linear(g, v)) continue;
      seen[gk] = 1;
      var dg = diff(g, v);
      if (isN(dg, 0)) continue;
      var q;
      try { q = subst(mul([a, pow(dg, N(-1))]), gk, U); } catch (e) { continue; }
      if (dep(q, v)) { // try after cancelling polynomial factors numerically (e.g. x³/(x²+1) is not of this form)
        continue;
      }
      var r = integrate(q, "U_", depth + 1);
      if (r) return subst(r, "U_", g);
    }
    return null;
  }
  MT.integrate = function (a, v) { try { return integrate(a, v, 0); } catch (e) { return null; } };

  /* ------------------------------------------------------------------ numerical integration: adaptive Gauss–Kronrod (7, 15) */
  var XK = [0.991455371120812639, 0.949107912342758525, 0.864864423359769073, 0.741531185599394440, 0.586087235467691130, 0.405845151377397167, 0.207784955007898468, 0],
    WK = [0.022935322010529225, 0.063092092629978553, 0.104790010322250184, 0.140653259715525919, 0.169004726639267903, 0.190350578064785410, 0.204432940075298892, 0.209482141084727828],
    WG = [0.129484966168869693, 0.279705391489276668, 0.381830050505118945, 0.417959183673469388];
  function gk(f, a, b) {
    var c = (a + b) / 2, h = (b - a) / 2, fc = f(c), rk = fc * WK[7], rg = fc * WG[3];
    for (var i = 0; i < 7; i++) { var dx = h * XK[i], s = f(c - dx) + f(c + dx); rk += WK[i] * s; if (i % 2) rg += WG[(i - 1) / 2] * s; }
    return [rk * h, Math.abs((rk - rg) * h)];
  }
  MT.quad = function (f, a, b, tol) {
    if (a === b) return { v: 0, err: 0 };
    var sgn = 1; if (a > b) { var t = a; a = b; b = t; sgn = -1; }
    tol = tol || 1e-10;
    var total = 0, err = 0, evals = 0, bad = false;
    (function rec(lo, hi, depth, tl) {
      var r = gk(f, lo, hi); evals += 15;
      if (!isFinite(r[0])) { bad = true; return; }
      if (r[1] <= Math.max(tl, 1e-13 * Math.abs(r[0])) || depth > 44 || evals > 150000) { total += r[0]; err += r[1]; return; }
      var m = (lo + hi) / 2; rec(lo, m, depth + 1, tl / 2); rec(m, hi, depth + 1, tl / 2);
    })(a, b, 0, tol * Math.max(1, b - a));
    return { v: sgn * total, err: err, bad: bad || evals > 150000 };
  };
  /* zeros of f on [a, b] by scanning + bisection */
  MT.zeros = function (f, a, b, n) {
    n = n || 800; var out = [], px = a, py = f(a);
    if (py === 0) out.push(a);
    for (var i = 1; i <= n; i++) {
      var x = a + (b - a) * i / n, y = f(x);
      if (y === 0) out.push(x);
      else if (isFinite(py) && isFinite(y) && py * y < 0) {
        var lo = px, hi = x, flo = py;
        for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
        if (Math.abs(f((lo + hi) / 2)) < 1e-6 * (1 + Math.abs(py) + Math.abs(y))) out.push((lo + hi) / 2);
      }
      px = x; py = y;
    }
    return out;
  };

  /* ------------------------------------------------------------------ Laplace transform of exponential-polynomials */
  function C(re, im) { return { re: re, im: im || 0 }; }
  function cmul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cadd(a, b) { return C(a.re + b.re, a.im + b.im); }
  function cexp(a) { var m = Math.exp(a.re); return C(m * Math.cos(a.im), m * Math.sin(a.im)); }
  function cdiv(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cpow(a, n) { var r = Math.pow(Math.hypot(a.re, a.im), n), th = Math.atan2(a.im, a.re) * n; return C(r * Math.cos(th), r * Math.sin(th)); }
  function gamma(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1; var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7], x = c[0];
    for (var i = 1; i < g + 2; i++) x += c[i] / (z + i);
    var t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  MT.gamma = gamma;
  /* term: c·tⁿ·e^{pt}·u(t−T)   (c, p complex; T ≥ 0)   or   { d: true, c, T }: c·δ(t−T) */
  function epMul(A, B) {
    var out = [];
    A.forEach(function (x) { B.forEach(function (y) {
      if (x.d && y.d) throw new Err("lap-delta2");
      if (x.d || y.d) { var dl = x.d ? x : y, g = x.d ? y : x; if (dl.T < g.T) return; var val = cmul(cmul(dl.c, g.c), cmul(C(Math.pow(dl.T, g.n) || (g.n === 0 ? 1 : 0)), cexp(C(g.p.re * dl.T, g.p.im * dl.T)))); out.push({ d: true, c: val, T: dl.T }); return; }
      out.push({ c: cmul(x.c, y.c), n: x.n + y.n, p: cadd(x.p, y.p), T: Math.max(x.T, y.T) });
    }); });
    return out;
  }
  function toEP(a, v) {
    var l, th;
    if (!dep(a, v)) { if (MT.symbols(a).length) throw new Err("lap-sym", MT.symbols(a).join(", ")); return [{ c: C(evalf(a, {})), n: 0, p: C(0), T: 0 }]; }
    switch (a.k) {
      case "s": return [{ c: C(1), n: 1, p: C(0), T: 0 }];
      case "+": return [].concat.apply([], a.a.map(function (x) { return toEP(x, v); }));
      case "*": return a.a.map(function (x) { return toEP(x, v); }).reduce(epMul);
      case "^":
        if (!dep(a.e, v)) {
          if (MT.symbols(a.e).length) throw new Err("lap-sym", MT.symbols(a.e).join(", "));
          var ev = evalf(a.e, {});
          if (isInt(ev) && ev >= 0 && ev <= 12) { var base = toEP(a.b, v), r = [{ c: C(1), n: 0, p: C(0), T: 0 }]; for (var i = 0; i < Math.round(ev); i++) r = epMul(r, base); return r; }
          if (a.b.k === "s" && a.b.n === v && ev > -1) return [{ c: C(1), n: ev, p: C(0), T: 0 }];
          throw new Err("lap-form", tex(a));
        }
        if (!dep(a.b, v)) {
          var p = polyOf(a.e, v);
          if (!p || p.length !== 2) throw new Err("lap-form", tex(a));
          if (MT.symbols(a.b).length) throw new Err("lap-sym", MT.symbols(a.b).join(", "));
          var lb = Math.log(evalf(a.b, {}));
          return [{ c: C(Math.exp(lb * p[0])), n: 0, p: C(lb * p[1]), T: 0 }];
        }
        throw new Err("lap-form", tex(a));
      default:
        l = linear(a.a, v);
        if (!l && /^(sin|cos|sinh|cosh|u|delta)$/.test(a.n) && MT.symbols(a.a).length > 1) throw new Err("lap-sym", MT.symbols(a.a).filter(function (n) { return n !== v; }).join(", "));
        if (!l) throw new Err("lap-form", tex(a));
        var w = l[0], ph = l[1];
        switch (a.n) {
          case "sin": th = cexp(C(0, ph)); return [{ c: cmul(C(0, -0.5), th), n: 0, p: C(0, w), T: 0 }, { c: cmul(C(0, 0.5), C(th.re, -th.im)), n: 0, p: C(0, -w), T: 0 }];
          case "cos": th = cexp(C(0, ph)); return [{ c: cmul(C(0.5), th), n: 0, p: C(0, w), T: 0 }, { c: cmul(C(0.5), C(th.re, -th.im)), n: 0, p: C(0, -w), T: 0 }];
          case "sinh": return [{ c: C(0.5 * Math.exp(ph)), n: 0, p: C(w), T: 0 }, { c: C(-0.5 * Math.exp(-ph)), n: 0, p: C(-w), T: 0 }];
          case "cosh": return [{ c: C(0.5 * Math.exp(ph)), n: 0, p: C(w), T: 0 }, { c: C(0.5 * Math.exp(-ph)), n: 0, p: C(-w), T: 0 }];
          case "u":
            var T0 = -ph / w;
            if (w > 0) return [{ c: C(1), n: 0, p: C(0), T: Math.max(0, T0) }];
            return T0 <= 0 ? [] : [{ c: C(1), n: 0, p: C(0), T: 0 }, { c: C(-1), n: 0, p: C(0), T: T0 }];
          case "delta":
            var Td = -ph / w; if (Td < 0) return [];
            return [{ d: true, c: C(1 / Math.abs(w)), T: Td }];
        }
        throw new Err("lap-form", tex(a));
    }
  }
  function cpolyMul(a, b) { var r = []; for (var i = 0; i < a.length + b.length - 1; i++) r.push(C(0)); for (i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] = cadd(r[i + j], cmul(a[i], b[j])); return r; }
  function fact(n) { for (var r = 1, i = 2; i <= n; i++) r *= i; return r; }
  function binom(n, k) { return fact(n) / (fact(k) * fact(n - k)); }
  function cleanNum(x) { var s = snap(x); return Math.abs(s) < 1e-11 ? 0 : s; }
  /* TeX of a real polynomial in s, highest power first */
  function polyTex(p, v) {
    v = v || "s"; var out = "";
    for (var i = p.length - 1; i >= 0; i--) {
      var c = cleanNum(p[i]); if (c === 0) continue;
      var mag = Math.abs(c), ct = (mag === 1 && i > 0) ? "" : MT.niceTex(mag);
      out += (c < 0 ? (out ? " - " : "-") : out ? " + " : "") + ct + (i === 0 ? "" : i === 1 ? v : v + "^{" + i + "}");
    }
    return out || "0";
  }
  MT.polyTex = polyTex;
  function shiftTex(a) { a = cleanNum(a); return a === 0 ? "s" : "s" + (a > 0 ? " - " : " + ") + MT.niceTex(Math.abs(a)); } // s − a
  function quadTex(a, b) { a = cleanNum(a); var b2 = cleanNum(b * b); return (a === 0 ? "s^{2}" : "\\left(" + shiftTex(a) + "\\right)^{2}") + " + " + MT.niceTex(b2); }
  MT.laplace = function (node, v) {
    var raw = toEP(node, v);
    // merge equal terms
    var reg = [], dels = [];
    raw.forEach(function (t) {
      if (t.d) { var h = dels.find(function (x) { return Math.abs(x.T - t.T) < 1e-12; }); if (h) h.c = cadd(h.c, t.c); else dels.push({ d: true, c: t.c, T: t.T }); return; }
      // shifted form: c tⁿ e^{pt} u(t−T) = c e^{pT} Σ C(n,k) T^{n−k} τ^k e^{pτ} u(τ), τ = t − T
      var list = [];
      if (t.T > 0) {
        if (!isInt(t.n)) throw new Err("lap-form", "t^{" + t.n + "}u(t-" + t.T + ")");
        var cT = cmul(t.c, cexp(C(t.p.re * t.T, t.p.im * t.T)));
        for (var k = 0; k <= t.n; k++) list.push({ c: cmul(cT, C(binom(t.n, k) * Math.pow(t.T, t.n - k))), n: k, p: t.p, T: t.T });
      } else list.push(t);
      list.forEach(function (q) {
        var h2 = reg.find(function (x) { return Math.abs(x.T - q.T) < 1e-12 && Math.abs(x.n - q.n) < 1e-12 && Math.hypot(x.p.re - q.p.re, x.p.im - q.p.im) < 1e-10; });
        if (h2) h2.c = cadd(h2.c, q.c); else reg.push({ c: q.c, n: q.n, p: q.p, T: q.T });
      });
    });
    reg = reg.filter(function (t) { return Math.hypot(t.c.re, t.c.im) > 1e-12; });
    dels = dels.filter(function (t) { return Math.hypot(t.c.re, t.c.im) > 1e-12; });
    if (!reg.length && !dels.length) return { zero: true, tex: "0", groups: [], pairs: [], poles: [], sigma: -Infinity, value: function () { return C(0); } };
    var frac = reg.some(function (t) { return !isInt(t.n); });
    if (frac && reg.some(function (t) { return t.p.im !== 0 || t.T > 0; })) throw new Err("lap-form", "t^{a}");
    // standard real terms (pairs for the "table" step)
    var pairs = [];
    reg.forEach(function (t) {
      if (t.p.im < -1e-12) return;
      var a = cleanNum(t.p.re), b = cleanNum(t.p.im), n = t.n, A, B;
      var tn = n === 0 ? "" : n === 1 ? "t" : isInt(n) ? "t^{" + n + "}" : n === 0.5 ? "\\sqrt{t}" : n === -0.5 ? "\\frac{1}{\\sqrt{t}}" : "t^{" + numTex(n) + "}";
      var ex = a === 0 ? "" : "e^{" + (a === 1 ? "" : a === -1 ? "-" : MT.niceTex(a)) + "t}";
      var uT = t.T > 0 ? "u(t - " + MT.niceTex(t.T) + ")" : "";
      var tt = function (s) { return s.replace(/t(?![a-z{^])/g, "(t - " + MT.niceTex(t.T) + ")"); };
      if (b === 0) {
        A = cleanNum(t.c.re); if (A === 0) return;
        var ft = (tn + ex) || "1", Ftex;
        if (!isInt(n)) { var gm = n === -0.5 ? "\\sqrt{\\pi}" : n === 0.5 ? "\\sqrt{\\pi}" : MT.niceTex(gamma(n + 1)), dn = n === -0.5 ? "\\sqrt{" + shiftTex(a) + "}" : (a === 0 ? "s" : "\\left(" + shiftTex(a) + "\\right)") + "^{" + numTex(n + 1) + "}"; Ftex = "\\frac{" + gm + "}{" + (n === 0.5 ? "2" : "") + dn + "}"; }
        else Ftex = "\\frac{" + (n > 1 ? fact(n) : 1) + "}{" + (n === 0 ? shiftTex(a) : (a === 0 ? "s" : "\\left(" + shiftTex(a) + "\\right)") + "^{" + (n + 1) + "}") + "}";
        pairs.push({ co: A, f: t.T > 0 ? tt(ft === "1" ? "" : ft) + uT : ft, F: (t.T > 0 ? "e^{-" + (t.T === 1 ? "" : MT.niceTex(t.T)) + "s}" : "") + Ftex, rule: n === 0 ? (a === 0 ? "const" : "exp") : a === 0 ? "tn" : "tnexp", delay: t.T > 0 });
        return;
      }
      A = cleanNum(2 * t.c.re); B = cleanNum(-2 * t.c.im);
      // (σ + jb)^{n+1} with σ = s − a  →  real and imaginary parts as polynomials in s
      var one = [C(-a, b), C(1)], pw = [C(1)];
      for (var i = 0; i <= n; i++) pw = cpolyMul(pw, one);
      var reP = pw.map(function (z) { return z.re * fact(n); }), imP = pw.map(function (z) { return z.im * fact(n); });
      var den = (n === 0 ? quadTex(a, b) : "\\left(" + quadTex(a, b) + "\\right)^{" + (n + 1) + "}"), bt = b === 1 ? "" : MT.niceTex(b);
      var pre = t.T > 0 ? "e^{-" + (t.T === 1 ? "" : MT.niceTex(t.T)) + "s}" : "";
      if (A !== 0) pairs.push({ co: A, f: (t.T > 0 ? tt(tn + ex + "\\cos " + bt + "t") + uT : tn + ex + "\\cos " + bt + "t"), F: pre + "\\frac{" + polyTex(reP) + "}{" + den + "}", rule: a === 0 && n === 0 ? "cos" : n === 0 ? "expcos" : "tncos", delay: t.T > 0 });
      if (B !== 0) pairs.push({ co: B, f: (t.T > 0 ? tt(tn + ex + "\\sin " + bt + "t") + uT : tn + ex + "\\sin " + bt + "t"), F: pre + "\\frac{" + polyTex(imP) + "}{" + den + "}", rule: a === 0 && n === 0 ? "sin" : n === 0 ? "expsin" : "tnsin", delay: t.T > 0 });
    });
    dels.forEach(function (t) { pairs.push({ co: cleanNum(t.c.re), f: "\\delta(t" + (t.T > 0 ? " - " + MT.niceTex(t.T) : "") + ")", F: t.T > 0 ? "e^{-" + (t.T === 1 ? "" : MT.niceTex(t.T)) + "s}" : "1", rule: "delta", delay: t.T > 0 }); });
    // one rational function per delay
    var Ts = []; reg.concat(dels).forEach(function (t) { if (!Ts.some(function (x) { return Math.abs(x - t.T) < 1e-12; })) Ts.push(t.T); }); Ts.sort(function (x, y) { return x - y; });
    var groups = [];
    if (!frac) Ts.forEach(function (T) {
      var ts = reg.filter(function (t) { return Math.abs(t.T - T) < 1e-12; }), dl = dels.find(function (t) { return Math.abs(t.T - T) < 1e-12; });
      var poles = [];
      ts.forEach(function (t) { var h = poles.find(function (q) { return Math.hypot(q.p.re - t.p.re, q.p.im - t.p.im) < 1e-10; }); if (h) h.m = Math.max(h.m, t.n + 1); else poles.push({ p: t.p, m: t.n + 1 }); });
      var D = [C(1)];
      poles.forEach(function (q) { for (var i = 0; i < q.m; i++) D = cpolyMul(D, [C(-q.p.re, -q.p.im), C(1)]); });
      var Np = D.map(function () { return C(0); });
      ts.forEach(function (t) {
        var part = [cmul(t.c, C(fact(t.n)))];
        poles.forEach(function (q) { var same = Math.hypot(q.p.re - t.p.re, q.p.im - t.p.im) < 1e-10, times = same ? q.m - (t.n + 1) : q.m; for (var i = 0; i < times; i++) part = cpolyMul(part, [C(-q.p.re, -q.p.im), C(1)]); });
        part.forEach(function (z, i) { Np[i] = cadd(Np[i], z); });
      });
      if (dl) D.forEach(function (z, i) { Np[i] = cadd(Np[i], cmul(z, dl.c)); });
      var Nr = ptrim(Np.map(function (z) { return cleanNum(z.re); })), Dr = D.map(function (z) { return cleanNum(z.re); });
      // factored denominator
      var fac = "";
      poles.filter(function (q) { return q.p.im >= -1e-12; }).sort(function (x, y) { return y.p.re - x.p.re || x.p.im - y.p.im; }).forEach(function (q) {
        var a = cleanNum(q.p.re), b = cleanNum(q.p.im), base = b === 0 ? shiftTex(a) : quadTex(a, b), simple = b === 0 && a === 0;
        fac += q.m === 1 ? (simple ? "s" : "\\left(" + base + "\\right)") : (simple ? "s" : "\\left(" + base + "\\right)") + "^{" + q.m + "}";
      });
      var single = poles.filter(function (q) { return q.p.im >= -1e-12; }).length === 1 && poles[0].m === 1;
      if (single) fac = fac.replace(/^\\left\((.*)\\right\)$/, "$1");
      groups.push({ T: T, N: Nr, D: Dr, facTex: fac || "1", poles: poles });
    });
    var allPoles = [];
    reg.forEach(function (t) { if (!allPoles.some(function (q) { return Math.hypot(q.re - t.p.re, q.im - t.p.im) < 1e-10; })) allPoles.push(C(cleanNum(t.p.re), cleanNum(t.p.im))); });
    var sigma = reg.length ? Math.max.apply(null, reg.map(function (t) { return t.p.re; })) : -Infinity;
    function gTex(g, factored) {
      var pre = g.T > 0 ? "e^{-" + (g.T === 1 ? "" : MT.niceTex(g.T)) + "s}" : "";
      if (g.D.length === 1) return pre ? pre + (g.N.length === 1 && cleanNum(g.N[0]) === 1 ? "" : "\\left(" + polyTex(g.N) + "\\right)").replace(/^\\left\((\d+)\\right\)$/, "$1 ") : polyTex(g.N);
      var neg = g.N.length && cleanNum(g.N[g.N.length - 1]) < 0 && g.N.filter(function (c) { return cleanNum(c) !== 0; }).length === 1;
      var Nn = neg ? g.N.map(function (c) { return -c; }) : g.N;
      var nt = polyTex(Nn), multi = Nn.filter(function (c) { return cleanNum(c) !== 0; }).length > 1;
      var top = !pre ? nt : nt === "1" ? pre : (multi ? "\\left(" + nt + "\\right)" : nt) + "\\,e" + pre.slice(1);
      return (neg ? "-" : "") + "\\frac{" + top + "}{" + (factored ? g.facTex : polyTex(g.D)) + "}";
    }
    function joinG(factored) { return groups.map(function (g, i) { var t = gTex(g, factored); return i && t[0] !== "-" ? " + " + t : (i ? " - " + t.slice(1) : t); }).join(""); }
    var texF, texE;
    if (frac) { texF = texE = pairs.map(function (q, i) { var c = Math.abs(q.co), s = q.co < 0 ? (i ? " - " : "-") : i ? " + " : ""; return s + (c === 1 ? "" : MT.niceTex(c) + "\\cdot") + q.F; }).join(""); }
    else { texF = joinG(true); texE = joinG(false); }
    return {
      pairs: pairs, groups: groups, poles: allPoles, sigma: sigma, tex: texF, texExpanded: texE, frac: frac, hasDelta: dels.length > 0,
      value: function (s) { // numeric F(s) straight from the term list
        var sum = C(0);
        reg.forEach(function (t) { var d = cpow(C(s.re - t.p.re, s.im - t.p.im), t.n + 1), term = cdiv(cmul(t.c, C(gamma(t.n + 1))), d); if (t.T > 0) term = cmul(term, cexp(C(-s.re * t.T, -s.im * t.T))); sum = cadd(sum, term); });
        dels.forEach(function (t) { sum = cadd(sum, cmul(t.c, cexp(C(-s.re * t.T, -s.im * t.T)))); });
        return sum;
      },
      valueRational: function (s) { // numeric F(s) from the displayed N(s)/D(s) (independent of value())
        if (frac) return null;
        var sum = 0;
        groups.forEach(function (g) { sum += pval(g.N, s) / pval(g.D, s) * Math.exp(-s * g.T); });
        return sum;
      }
    };
  };
  /* ∫₀^∞ f(t) e^{−st} dt by quadrature (real s) — the independent check shown under every answer */
  MT.laplaceNumeric = function (node, v, s, sigma) {
    var f = MT.compile(node, v), span = 46 / Math.max(0.2, s - Math.max(sigma, -50)), n = 60, total = 0;
    for (var i = 0; i < n; i++) total += MT.quad(function (t) { return f(t) * Math.exp(-s * t); }, span * i / n, span * (i + 1) / n, 1e-11).v;
    return total;
  };

  /* ------------------------------------------------------------------ Fourier series of a periodic piecewise function */
  /* pieces: [{ f: function(t), a, b }] covering one period of length T */
  MT.fourier = function (pieces, T, Nmax) {
    var w0 = 2 * Math.PI / T, a = [0], b = [0], a0 = 0, ms = 0;
    function I(g) {
      var s = 0;
      pieces.forEach(function (p) { var m = Math.max(8, Math.ceil(4 * Nmax * (p.b - p.a) / T)); for (var i = 0; i < m; i++) s += MT.quad(function (t) { return g(t, p.f(t)); }, p.a + (p.b - p.a) * i / m, p.a + (p.b - p.a) * (i + 1) / m, 1e-12).v; });
      return s;
    }
    a0 = I(function (t, y) { return y; }) / T;
    ms = I(function (t, y) { return y * y; }) / T;
    for (var n = 1; n <= Nmax; n++) {
      a.push(2 / T * I(function (t, y) { return y * Math.cos(n * w0 * t); }));
      b.push(2 / T * I(function (t, y) { return y * Math.sin(n * w0 * t); }));
    }
    var z = function (x) { return Math.abs(x) < 1e-9 ? 0 : x; };
    a = a.map(z); b = b.map(z); a0 = z(a0);
    var c = a.map(function (x, i) { return Math.hypot(x, b[i]); });
    var odd = a0 === 0 && a.every(function (x) { return x === 0; }), even = b.every(function (x) { return x === 0; });
    var half = a0 === 0 && a.every(function (x, i) { return i % 2 === 1 || x === 0; }) && b.every(function (x, i) { return i % 2 === 1 || x === 0; });
    var acrms2 = ms - a0 * a0, c1 = c[1] || 0, thd = c1 > 1e-9 ? Math.sqrt(Math.max(0, acrms2 - c1 * c1 / 2)) / (c1 / Math.SQRT2) : NaN;
    var sumsq = a0 * a0; for (n = 1; n <= Nmax; n++) sumsq += c[n] * c[n] / 2;
    return { a0: a0, a: a, b: b, c: c, w0: w0, T: T, rms: Math.sqrt(ms), odd: odd, even: even, half: half, thd: thd, captured: ms > 0 ? sumsq / ms : 1,
      partial: function (t, N) { var s = a0; for (var k = 1; k <= N; k++) s += a[k] * Math.cos(k * w0 * t) + b[k] * Math.sin(k * w0 * t); return s; } };
  };

  /* ------------------------------------------------------------------ plain maths → LaTeX for the equation editor (keeps "y = …", "f(x) = …", several sides) */
  MT.toLatex = function (src) {
    return String(src).split("=").map(function (side) {
      var m = /^\s*([a-zA-Z])\s*\(\s*([a-zA-Z])\s*\)\s*$/.exec(side);
      if (m) return m[1] + "(" + m[2] + ")";
      return tex(MT.parse(side, { step: false }));
    }).join(" = ");
  };

  if (typeof module !== "undefined" && module.exports) module.exports = MT; else root.MTCore = MT;
})(typeof self !== "undefined" ? self : this);
