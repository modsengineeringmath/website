/* Sequences, series & mathematical induction labs (plain JS, no dependencies besides mathkit.js; KaTeX for live TeX).
   Engine (window.SQ in the browser, module.exports in Node): a small safe expression language with variables n, a, k, x
   (implicit multiplication, n!, fact(), floor…), exact Taylor coefficients by Taylor-mode automatic differentiation (jets),
   and the numerical analysis of sequences and partial sums used by the widgets.
   Widgets:
   <div class="sq-lab" [data-mode="explicit|recursive"] [data-f="1/n"] [data-g="sqrt(2+a)"] [data-a1="1.41421356"] [data-n="30"] [data-eps="0.05"] [data-view="terms|sums|cobweb"]>
        sequence explorer: terms, ε–N band, partial sums, cobweb diagram for recurrences, arithmetic/geometric detection
   <div class="sq-test" [data-preset="harmonic"]>        series convergence tester (14 presets with exact reasoning + any aₙ you type)
   <div class="sq-taylor" [data-f="sin(x)"] [data-a="0"] [data-n="5"] [data-x="1"]>   Taylor / Maclaurin polynomial, error, Lagrange bound, radius
   <div class="in-domino">                               dominoes: base case + inductive step (ordinary / strong)
   <div class="in-check" [data-preset="sum-k"]>          induction checker: table P(n), the step P(k) ⇒ P(k+1) with numbers, custom Σ with a proof certificate
   <div class="in-flaw" [data-preset="horses"]>          find the wrong line in a flawed induction proof
   Buttons anywhere on the page: <button data-sq-set='{"mode":"recursive","g":"1+a/(1+a)","a1":2}' [data-sq-target="id"]>,
   <button data-sqt="pseries">, <button data-ty-set='{"f":"exp(x)","n":3}'>, <button data-in-preset="div6">, <button data-flaw="horses">. */
(function (root) {
  "use strict";

  // ======================================================================= expression language
  var FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10,
    sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, sgn: function (v) { return v > 0 ? 1 : v < 0 ? -1 : 0; },
    fact: function (v) { return fact(v); }
  };
  var CONST = { pi: Math.PI, e: Math.E };
  function fact(v) {
    if (v < 0 || v !== Math.floor(v)) return NaN;
    if (v > 170) return Infinity;
    var r = 1; for (var i = 2; i <= v; i++) r *= i; return r;
  }
  function err(msg) { var e = new Error(msg); e.user = true; return e; }

  function tokenize(src) {
    var s = String(src).replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi")
      .replace(/√/g, "sqrt").replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*\*/g, "^").replace(/aₙ|a_n/g, "a");
    var out = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        var m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
        if (!m) throw err("ตัวเลขไม่ถูกต้อง");
        out.push({ k: "num", v: parseFloat(m[0]) }); i += m[0].length; continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        var w = s.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)[0];
        out.push({ k: "id", v: w }); i += w.length; continue;
      }
      if ("+-*/^(),!".indexOf(ch) >= 0) { out.push({ k: ch }); i++; continue; }
      throw err("ไม่รู้จักเครื่องหมาย “" + ch + "”");
    }
    out.push({ k: "end" });
    return out;
  }

  // vars: array of allowed variable names, e.g. ["n"], ["n","a"], ["x"]
  function parse(src, vars) {
    var tk = tokenize(src), i = 0;
    var peek = function () { return tk[i]; };
    function expect(k) { if (tk[i].k !== k) throw err(k === ")" ? "วงเล็บไม่ครบ" : "พิมพ์ไม่ถูกต้อง"); i++; }
    function startsPrimary(t) { return t.k === "num" || t.k === "id" || t.k === "("; }
    function expr() {
      var a = term();
      while (peek().k === "+" || peek().k === "-") { var op = tk[i++].k; a = { t: "bin", op: op, a: a, b: term() }; }
      return a;
    }
    function term() {
      var a = unary();
      for (;;) {
        var t = peek();
        if (t.k === "*" || t.k === "/") { i++; a = { t: "bin", op: t.k, a: a, b: unary() }; }
        else if (startsPrimary(t)) a = { t: "bin", op: "*", a: a, b: unary(), imp: true };
        else return a;
      }
    }
    function unary() {
      if (peek().k === "-") { i++; return { t: "neg", a: unary() }; }
      if (peek().k === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var b = postfix();
      if (peek().k === "^") { i++; return { t: "bin", op: "^", a: b, b: unary() }; }
      return b;
    }
    function postfix() {
      var p = primary();
      while (peek().k === "!") { i++; p = { t: "fact", a: p }; }
      return p;
    }
    function primary() {
      var t = tk[i];
      if (t.k === "num") { i++; return { t: "num", v: t.v }; }
      if (t.k === "(") { i++; var e = expr(); expect(")"); return e; }
      if (t.k === "id") {
        i++;
        var name = t.v;
        if (FN[name]) {
          if (peek().k !== "(") throw err("ฟังก์ชัน " + name + " ต้องตามด้วยวงเล็บ เช่น " + name + "(n)");
          i++; var arg = expr(); expect(")");
          return { t: "fn", f: name, a: arg };
        }
        if (vars.indexOf(name) >= 0) return { t: "var", n: name };
        if (name in CONST) return { t: "const", n: name };
        // allow products of single letters written together, e.g. "an" or "nx"
        if (name.length > 1 && name.split("").every(function (c) { return vars.indexOf(c) >= 0 || c in CONST; })) {
          var node = null;
          name.split("").forEach(function (c) { var leaf = vars.indexOf(c) >= 0 ? { t: "var", n: c } : { t: "const", n: c }; node = node ? { t: "bin", op: "*", a: node, b: leaf, imp: true } : leaf; });
          return node;
        }
        throw err("ไม่รู้จัก “" + name + "” (ใช้ตัวแปร " + vars.join(", ") + ")");
      }
      if (t.k === "end") throw err("สูตรยังไม่จบ");
      throw err("พิมพ์ไม่ถูกต้องตรงนี้");
    }
    var tree = expr();
    if (peek().k !== "end") throw err("มีส่วนเกินที่อ่านไม่ได้");
    return tree;
  }

  function evaluator(node) {
    switch (node.t) {
      case "num": var v = node.v; return function () { return v; };
      case "const": var c = CONST[node.n]; return function () { return c; };
      case "var": var nm = node.n; return function (env) { return env[nm]; };
      case "neg": var na = evaluator(node.a); return function (env) { return -na(env); };
      case "fact": var fa = evaluator(node.a); return function (env) { return fact(fa(env)); };
      case "fn": var f = FN[node.f], ga = evaluator(node.a); return function (env) { return f(ga(env)); };
      case "bin":
        var A = evaluator(node.a), B = evaluator(node.b);
        switch (node.op) {
          case "+": return function (e) { return A(e) + B(e); };
          case "-": return function (e) { return A(e) - B(e); };
          case "*": return function (e) { return A(e) * B(e); };
          case "/": return function (e) { return A(e) / B(e); };
          case "^": return function (e) { return Math.pow(A(e), B(e)); };
        }
    }
    throw err("สูตรไม่ถูกต้อง");
  }

  // ---- TeX
  var TEXFN = { sin: "\\sin", cos: "\\cos", tan: "\\tan", asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan", arctan: "\\arctan", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", ln: "\\ln", log: "\\ln", log10: "\\log_{10}" };
  function prec(n) { if (n.t === "bin") return n.op === "+" || n.op === "-" ? 1 : n.op === "^" ? 4 : 2; if (n.t === "neg") return 1.5; return 5; }
  function toTex(n, names) {
    names = names || {};
    var T = function (m) { return toTex(m, names); };
    var wrap = function (m, p) { return prec(m) < p ? "\\left(" + T(m) + "\\right)" : T(m); };
    switch (n.t) {
      case "num": return String(+n.v.toPrecision(12));
      case "const": return n.n === "pi" ? "\\pi" : "e";
      case "var": return names[n.n] || n.n;
      case "neg": return "-" + wrap(n.a, 2);
      case "fact": return (n.a.t === "num" || n.a.t === "var" ? T(n.a) : "\\left(" + T(n.a) + "\\right)") + "!";
      case "fn":
        if (n.f === "sqrt") return "\\sqrt{" + T(n.a) + "}";
        if (n.f === "abs") return "\\left|" + T(n.a) + "\\right|";
        if (n.f === "exp") return "e^{" + T(n.a) + "}";
        if (n.f === "fact") return wrap(n.a, 5) + "!";
        if (n.f === "floor") return "\\lfloor " + T(n.a) + "\\rfloor";
        if (n.f === "ceil") return "\\lceil " + T(n.a) + "\\rceil";
        if (n.f === "sgn") return "\\operatorname{sgn}\\left(" + T(n.a) + "\\right)";
        return (TEXFN[n.f] || "\\operatorname{" + n.f + "}") + "\\left(" + T(n.a) + "\\right)";
      case "bin":
        if (n.op === "/") return "\\dfrac{" + T(n.a) + "}{" + T(n.b) + "}";
        if (n.op === "^") return wrap(n.a, 5) + "^{" + T(n.b) + "}";
        if (n.op === "*") {
          var l = wrap(n.a, 2), r = wrap(n.b, 2);
          var needDot = n.b.t === "num" || (n.b.t === "neg") || (/[0-9.]$/.test(l) && /^[0-9.]/.test(r));
          return l + (needDot ? " \\cdot " : " ") + r;
        }
        return T(n.a) + " " + n.op + " " + (n.op === "-" && prec(n.b) <= 1 ? "\\left(" + T(n.b) + "\\right)" : T(n.b));
    }
    return "";
  }
  function usesVar(n, v) {
    if (!n) return false;
    if (n.t === "var") return n.n === v;
    return usesVar(n.a, v) || usesVar(n.b, v);
  }

  function compile(src, vars, names) {
    var tree = parse(src, vars);
    var f = evaluator(tree);
    return { fn: f, tex: toTex(tree, names), tree: tree, uses: function (v) { return usesVar(tree, v); } };
  }

  // ======================================================================= Taylor-mode AD (jets)
  // a jet is an array c[0..d] of Taylor coefficients of a function about the expansion point
  function jconst(v, d) { var j = new Array(d + 1).fill(0); j[0] = v; return j; }
  function jadd(a, b) { return a.map(function (v, i) { return v + b[i]; }); }
  function jsub(a, b) { return a.map(function (v, i) { return v - b[i]; }); }
  function jscale(a, s) { return a.map(function (v) { return v * s; }); }
  function jmul(a, b) {
    var d = a.length - 1, c = new Array(d + 1).fill(0);
    for (var k = 0; k <= d; k++) { var s = 0; for (var j = 0; j <= k; j++) s += a[j] * b[k - j]; c[k] = s; }
    return c;
  }
  function jdiv(a, b) {
    var d = a.length - 1, c = new Array(d + 1).fill(0);
    if (b[0] === 0) throw err("หารด้วยศูนย์ที่จุดกระจาย");
    for (var k = 0; k <= d; k++) { var s = a[k]; for (var j = 1; j <= k; j++) s -= b[j] * c[k - j]; c[k] = s / b[0]; }
    return c;
  }
  function jexp(u) {
    var d = u.length - 1, e = new Array(d + 1).fill(0);
    e[0] = Math.exp(u[0]);
    for (var k = 1; k <= d; k++) { var s = 0; for (var j = 1; j <= k; j++) s += j * u[j] * e[k - j]; e[k] = s / k; }
    return e;
  }
  function jlog(u) {
    var d = u.length - 1, l = new Array(d + 1).fill(0);
    if (!(u[0] > 0)) throw err("ln ของค่าที่ไม่เป็นบวก ณ จุดกระจาย");
    l[0] = Math.log(u[0]);
    for (var k = 1; k <= d; k++) { var s = 0; for (var j = 1; j < k; j++) s += j * l[j] * u[k - j]; l[k] = (u[k] - s / k) / u[0]; }
    return l;
  }
  function jsincos(u) {
    var d = u.length - 1, s = new Array(d + 1).fill(0), c = new Array(d + 1).fill(0);
    s[0] = Math.sin(u[0]); c[0] = Math.cos(u[0]);
    for (var k = 1; k <= d; k++) {
      var ss = 0, cc = 0;
      for (var j = 1; j <= k; j++) { ss += j * u[j] * c[k - j]; cc += j * u[j] * s[k - j]; }
      s[k] = ss / k; c[k] = -cc / k;
    }
    return [s, c];
  }
  function jpowc(u, al) {
    var d = u.length - 1, p = new Array(d + 1).fill(0);
    if (al === Math.round(al) && al >= 0 && al <= 30) { // integer power: repeated multiplication (works at u0 = 0)
      var r = jconst(1, d); for (var i = 0; i < al; i++) r = jmul(r, u); return r;
    }
    if (u[0] === 0) throw err("ยกกำลังที่ไม่ใช่จำนวนเต็มของศูนย์ (หาอนุพันธ์ไม่ได้ ณ จุดนี้)");
    if (u[0] < 0 && al !== Math.round(al)) throw err("ยกกำลังเศษส่วนของค่าลบ ณ จุดกระจาย");
    p[0] = Math.pow(u[0], al);
    for (var k = 1; k <= d; k++) { var s = 0; for (var j = 1; j <= k; j++) s += ((al + 1) * j - k) * u[j] * p[k - j]; p[k] = s / (k * u[0]); }
    return p;
  }
  function jderiv(u) { var d = u.length - 1, r = new Array(d + 1).fill(0); for (var k = 0; k < d; k++) r[k] = (k + 1) * u[k + 1]; return r; }
  function jinteg(v, c0) { var d = v.length - 1, r = new Array(d + 1).fill(0); r[0] = c0; for (var k = 1; k <= d; k++) r[k] = v[k - 1] / k; return r; }
  function jet(node, x0, d) {
    var J = function (m) { return jet(m, x0, d); };
    switch (node.t) {
      case "num": return jconst(node.v, d);
      case "const": return jconst(CONST[node.n], d);
      case "var": var v = jconst(x0, d); if (d >= 1) v[1] = 1; return v;
      case "neg": return jscale(J(node.a), -1);
      case "fact": throw err("แฟกทอเรียลใช้ในแล็บเทย์เลอร์ไม่ได้");
      case "bin":
        var A = J(node.a);
        if (node.op === "^") {
          var B = J(node.b), bconst = B.slice(1).every(function (q) { return q === 0; });
          if (bconst) return jpowc(A, B[0]);
          if (A.slice(1).every(function (q) { return q === 0; })) { if (!(A[0] > 0)) throw err("ฐานต้องเป็นบวก"); return jexp(jscale(B, Math.log(A[0]))); }
          return jexp(jmul(B, jlog(A)));
        }
        var Bv = J(node.b);
        return node.op === "+" ? jadd(A, Bv) : node.op === "-" ? jsub(A, Bv) : node.op === "*" ? jmul(A, Bv) : jdiv(A, Bv);
      case "fn":
        var u = J(node.a), sc;
        switch (node.f) {
          case "exp": return jexp(u);
          case "ln": case "log": return jlog(u);
          case "log10": return jscale(jlog(u), 1 / Math.LN10);
          case "sqrt": return jpowc(u, 0.5);
          case "sin": return jsincos(u)[0];
          case "cos": return jsincos(u)[1];
          case "tan": sc = jsincos(u); return jdiv(sc[0], sc[1]);
          case "sinh": return jscale(jsub(jexp(u), jexp(jscale(u, -1))), 0.5);
          case "cosh": return jscale(jadd(jexp(u), jexp(jscale(u, -1))), 0.5);
          case "tanh": var ep = jexp(u), em = jexp(jscale(u, -1)); return jdiv(jsub(ep, em), jadd(ep, em));
          case "atan": case "arctan": return jinteg(jdiv(jderiv(u), jadd(jconst(1, d), jmul(u, u))), Math.atan(u[0]));
          case "asin": return jinteg(jdiv(jderiv(u), jpowc(jsub(jconst(1, d), jmul(u, u)), 0.5)), Math.asin(u[0]));
          case "acos": return jscale(jinteg(jdiv(jderiv(u), jpowc(jsub(jconst(1, d), jmul(u, u)), 0.5)), -Math.acos(u[0])), -1);
          case "abs": if (u[0] === 0) throw err("|x| หาอนุพันธ์ไม่ได้ที่ 0"); return jscale(u, u[0] > 0 ? 1 : -1);
        }
        throw err("ฟังก์ชัน " + node.f + " ใช้ในแล็บเทย์เลอร์ไม่ได้");
    }
    throw err("สูตรไม่ถูกต้อง");
  }

  // radius of convergence from Taylor coefficients (heuristic, Richardson-corrected ratio estimate)
  function radius(c) {
    var nz = []; for (var k = 0; k < c.length; k++) if (Math.abs(c[k]) > 1e-300 && isFinite(c[k])) nz.push(k);
    if (nz.length < 6) return { R: Infinity, poly: nz.length > 0 && nz[nz.length - 1] < c.length - 4 };
    function est(upTo) {
      var idx = nz.filter(function (k) { return k <= upTo; });
      if (idx.length < 2) return NaN;
      var i = idx[idx.length - 2], j = idx[idx.length - 1];
      return Math.pow(Math.abs(c[i] / c[j]), 1 / (j - i));
    }
    var last = nz[nz.length - 1];
    if (last < c.length - 4) return { R: Infinity, poly: true };
    var r2 = est(last), r1 = est(Math.floor(last / 2));
    if (!isFinite(r1) || !isFinite(r2)) return { R: NaN };
    if (r2 > 1.6 * r1) return { R: Infinity };
    var R = 2 * r2 - r1;
    if (!(R > 0)) R = r2;
    var snaps = [[1, "1"], [2, "2"], [0.5, "1/2"], [Math.PI / 2, "π/2"], [Math.PI, "π"], [3, "3"], [Math.SQRT2, "√2"]];
    for (var s = 0; s < snaps.length; s++) if (Math.abs(R - snaps[s][0]) < 0.03 * snaps[s][0]) return { R: snaps[s][0], label: snaps[s][1] };
    if (R > 1 && Math.abs(R - Math.round(R)) < 0.03 * R) return { R: Math.round(R), label: String(Math.round(R)) };
    return { R: R, approx: true };
  }

  // ======================================================================= sequence analysis
  function aitken(x0, x1, x2) {
    var den = x2 - 2 * x1 + x0;
    if (!isFinite(den) || Math.abs(den) < 1e-300) return x2;
    return x2 - (x2 - x1) * (x2 - x1) / den;
  }
  function snapNice(L) {
    if (!isFinite(L)) return L;
    if (Math.abs(L) < 1e-5) return 0;
    var r = Math.round(L);
    if (Math.abs(L - r) < 1e-7) return r;
    for (var q = 2; q <= 64; q++) { var p = Math.round(L * q); if (Math.abs(L - p / q) < 1e-8) return p / q; }
    var cands = [Math.E, Math.E * Math.E, 1 / Math.E, Math.PI, Math.PI * Math.PI / 6, Math.LN2, Math.SQRT2, (1 + Math.sqrt(5)) / 2, Math.sqrt(3), Math.PI / 4, Math.E - 1, Math.E * Math.E - 1];
    for (var i = 0; i < cands.length; i++) if (Math.abs(L - cands[i]) < 2e-6 * Math.max(1, Math.abs(L))) return cands[i];
    return L;
  }
  var NAMED = [[Math.E, "e"], [Math.E * Math.E, "e^2"], [1 / Math.E, "1/e"], [Math.PI, "\\pi"], [Math.PI * Math.PI / 6, "\\pi^2/6"], [Math.LN2, "\\ln 2"], [Math.SQRT2, "\\sqrt2"], [(1 + Math.sqrt(5)) / 2, "\\varphi = \\tfrac{1+\\sqrt5}{2}"], [Math.sqrt(3), "\\sqrt3"], [Math.PI / 4, "\\pi/4"], [Math.E - 1, "e-1"], [Math.E * Math.E - 1, "e^2-1"]];
  function namedTex(L) { for (var i = 0; i < NAMED.length; i++) if (L === NAMED[i][0]) return NAMED[i][1]; return null; }

  // classify the long-run behaviour from samples at increasing n (pairs n, n+1 to expose oscillation)
  // pts: [[n, value], ...] sorted by n; returns {kind: "conv"|"inf"|"-inf"|"osc"|"slow"|"undef", L}
  function longRun(pts) {
    var vals = pts.map(function (p) { return p[1]; });
    if (vals.some(function (v) { return isNaN(v); })) return { kind: "undef" };
    var last = vals.slice(-4), big = Math.max.apply(null, last.map(Math.abs));
    if (!isFinite(big) || big > 1e9) {
      var allPos = last.every(function (v) { return v > 0; }), allNeg = last.every(function (v) { return v < 0; });
      var grow = Math.abs(last[last.length - 1]) >= Math.abs(vals[0]);
      if (grow && allPos) return { kind: "inf" };
      if (grow && allNeg) return { kind: "-inf" };
      return { kind: "osc", unbounded: true };
    }
    var lo = Math.min.apply(null, last), hi = Math.max.apply(null, last), scale = Math.max(1, Math.abs(hi), Math.abs(lo));
    if (hi - lo < 2e-5 * scale) {
      // extrapolate with Aitken on the even-index samples (n = 10^3, 10^4, 10^5, …)
      var ev = pts.filter(function (p, i) { return i % 2 === 0; }).map(function (p) { return p[1]; });
      var L = ev.length >= 3 ? aitken(ev[ev.length - 3], ev[ev.length - 2], ev[ev.length - 1]) : last[last.length - 1];
      if (!isFinite(L) || Math.abs(L - last[last.length - 1]) > 1e-3 * scale) L = last[last.length - 1];
      return { kind: "conv", L: snapNice(L) };
    }
    // still moving: trending (slow growth such as ln n) or oscillating
    var a = vals.filter(function (v, i) { return i % 2 === 0; }), b = vals.filter(function (v, i) { return i % 2 === 1; });
    var spreadPair = Math.max.apply(null, a.map(function (v, i) { return Math.abs(v - b[i]); }));
    if (spreadPair > 0.05 * scale) return { kind: "osc" };
    var d1 = a[a.length - 2] - a[a.length - 3], d2 = a[a.length - 1] - a[a.length - 2];
    // power-law growth (value ×3 or more from n = 10⁵ to 10⁶, same sign): unbounded
    var vA = a[a.length - 2], vB = a[a.length - 1];
    if (vA * vB > 0 && Math.abs(vB) >= 3 * Math.abs(vA) && Math.abs(vB) > 10) return { kind: vB > 0 ? "inf" : "-inf" };
    if (Math.abs(d2) > 0.5 * Math.abs(d1) && Math.abs(d2) > 1e-3 * scale) return { kind: "slow", dir: d2 > 0 ? 1 : -1, d1: d1, d2: d2 };
    return { kind: "slow", dir: d2 > 0 ? 1 : -1, d1: d1, d2: d2, maybe: true };
  }

  var CHECK = [1000, 10000, 100000, 1000000];
  function analyzeExplicit(f, n0) {
    var pts = [];
    CHECK.forEach(function (m) { pts.push([m, f({ n: m })]); pts.push([m + 1, f({ n: m + 1 })]); });
    return longRun(pts);
  }
  // partial sums of an explicit term: returns samples for longRun and the stopping point if terms overflow
  function partialSums(f, n0, upto) {
    var S = 0, out = [], stop = null, marks = {};
    CHECK.forEach(function (m) { marks[m] = 1; marks[m + 1] = 1; });
    var c = 0; // Kahan summation
    for (var m = n0; m <= upto; m++) {
      var t = f({ n: m });
      if (!isFinite(t)) { stop = m; break; }
      var y = t - c, s2 = S + y; c = (s2 - S) - y; S = s2;
      if (marks[m]) out.push([m, S]);
    }
    if (stop !== null) { // terms overflowed (e.g. n!/nⁿ beyond n ≈ 140): the sum is frozen at its last value
      CHECK.forEach(function (mm) { if (mm >= stop) { out.push([mm, S]); out.push([mm + 1, S]); } });
    }
    return { pts: out, stop: stop, S: S };
  }
  function iterate(g, a1, N, n0) {
    var a = [a1], cur = a1;
    for (var i = 1; i < N; i++) { cur = g({ a: cur, n: n0 + i - 1 }); a.push(cur); if (!isFinite(cur) || Math.abs(cur) > 1e15) break; }
    return a;
  }
  function analyzeRecursive(seq) {
    var n = seq.length, last = seq[n - 1];
    if (!isFinite(last) || Math.abs(last) > 1e12) return { kind: last > 0 ? "inf" : last < 0 ? "-inf" : "undef" };
    var lo = Infinity, hi = -Infinity;
    for (var i = Math.floor(n * 0.9); i < n; i++) { lo = Math.min(lo, seq[i]); hi = Math.max(hi, seq[i]); }
    var scale = Math.max(1, Math.abs(last));
    if (hi - lo < 1e-9 * scale) return { kind: "conv", L: snapNice(last) };
    if (Math.abs(seq[n - 1] - seq[n - 3]) < 1e-9 * scale && Math.abs(seq[n - 1] - seq[n - 2]) > 1e-6 * scale) return { kind: "cycle2", p: [seq[n - 2], seq[n - 1]] };
    var d1 = seq[n - 1] - seq[Math.floor(n / 2)];
    if (Math.abs(d1) > 1e-3 * scale && (seq[n - 1] - seq[n - 2]) * d1 > 0) return { kind: "slow", dir: d1 > 0 ? 1 : -1 };
    return { kind: "osc" };
  }

  var SQ = {
    parse: parse, compile: compile, toTex: toTex, fact: fact, jet: jet, radius: radius, aitken: aitken, snapNice: snapNice,
    namedTex: namedTex, longRun: longRun, analyzeExplicit: analyzeExplicit, partialSums: partialSums, iterate: iterate, analyzeRecursive: analyzeRecursive,
    jmul: jmul, jdiv: jdiv, jexp: jexp, jlog: jlog, jsincos: jsincos, jpowc: jpowc
  };
  if (typeof module !== "undefined" && module.exports) module.exports = SQ;
  root.SQ = SQ;
  if (typeof document === "undefined") return;

  // ======================================================================= UI helpers
  var MK = root.MK;
  if (!MK) return;
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var fmt = MK.fmt, esc = MK.esc;
  // KaTeX with the site's lecture macro \hlP{…} (blue: where the induction hypothesis is used)
  var KM = { "\\hlP": "\\htmlClass{hl-p}{#1}" };
  var T = function (s, d) {
    if (root.katex) { try { return root.katex.renderToString(s, { displayMode: !!d, throwOnError: false, strict: "ignore", trust: function (c) { return c.command === "\\htmlClass"; }, macros: KM }); } catch (e) { /* fall through */ } }
    return "<code>" + esc(s) + "</code>";
  };
  // render a Thai sentence that contains \( … \) TeX
  function rich(s) {
    return String(s).replace(/\\\(([\s\S]+?)\\\)/g, function (_, t) { return T(t, false); });
  }
  function slider(key, label, min, max, step, val) {
    return '<label class="lap-row cl-sl"><span class="lap-lbl">' + label + '</span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output>' + val + "</output></label>";
  }
  function bindSliders(box, st, draw, fmtOut) {
    $$("input[type=range][data-k]", box).forEach(function (r) {
      var k = r.getAttribute("data-k");
      var show = function () { r.parentNode.querySelector("output").textContent = fmtOut && fmtOut[k] ? fmtOut[k](+r.value) : r.value; };
      show();
      r.addEventListener("input", function () { st[k] = +r.value; show(); draw(); });
    });
  }
  function setSlider(box, k, v, fmtOut) { var r = box.querySelector('input[data-k="' + k + '"]'); if (r) { r.value = v; r.parentNode.querySelector("output").textContent = fmtOut && fmtOut[k] ? fmtOut[k](+r.value) : r.value; } }
  function num(s) {
    // number field: accepts expressions such as sqrt(2), 1/3, pi
    var c = compile(String(s), []);
    var v = c.fn({});
    if (!isFinite(v)) throw err("ค่าเริ่มต้นไม่ถูกต้อง");
    return v;
  }
  function flag(ok, text) { return '<span class="lap-flag ' + (ok ? "ok" : "no") + '">' + text + "</span>"; }
  function texNum(v) {
    if (!isFinite(v)) return isNaN(v) ? "\\text{ไม่นิยาม}" : v > 0 ? "\\infty" : "-\\infty";
    var nm = namedTex(v); if (nm) return nm;
    return MK.nice(v);
  }

  // ======================================================================= 1. sequence explorer
  var SQ_PRE = [
    { l: "3n − 1 (เลขคณิต)", m: "explicit", f: "3n-1" },
    { l: "5·(1/2)ⁿ⁻¹ (เรขาคณิต)", m: "explicit", f: "5*(1/2)^(n-1)" },
    { l: "(3n²+1)/(2n²−n)", m: "explicit", f: "(3n^2+1)/(2n^2-n)" },
    { l: "(−1)ⁿ/n", m: "explicit", f: "(-1)^n/n" },
    { l: "(−1)ⁿ แกว่ง", m: "explicit", f: "(-1)^n" },
    { l: "(1 + 1/n)ⁿ → e", m: "explicit", f: "(1+1/n)^n" },
    { l: "n/2ⁿ", m: "explicit", f: "n/2^n" },
    { l: "1/n (ฮาร์มอนิก)", m: "explicit", f: "1/n" },
    { l: "aₙ₊₁ = √(2 + aₙ)", m: "recursive", g: "sqrt(2+a)", a1: "sqrt(2)" },
    { l: "บันไดตัวต้านทาน", m: "recursive", g: "1+a/(1+a)", a1: "2" },
    { l: "นิวตัน √2", m: "recursive", g: "(a+2/a)/2", a1: "1" },
    { l: "ฟิลเตอร์ดิจิทัล", m: "recursive", g: "0.8a+0.2", a1: "0.2" },
    { l: "ลอจิสติก r = 3.2", m: "recursive", g: "3.2a(1-a)", a1: "0.3" }
  ];
  function initSeq(box) {
    var d = box.dataset;
    var st = { mode: d.mode || "explicit", f: d.f || "(3n^2+1)/(2n^2-n)", g: d.g || "sqrt(2+a)", a1: d.a1 || "sqrt(2)", N: +(d.n || 30), le: Math.log10(+(d.eps || 0.05)), view: d.view || "terms" };
    box.innerHTML =
      '<div class="lap-chips sq-modes"><button type="button" class="lap-chip" data-mode="explicit">สูตรพจน์ทั่วไป aₙ = f(n)</button><button type="button" class="lap-chip" data-mode="recursive">ความสัมพันธ์เวียนเกิด aₙ₊₁ = g(aₙ)</button></div>' +
      '<div class="lap-row sq-ex"><label class="lap-lbl">aₙ =</label><input class="lap-in" data-in="f" spellcheck="false" aria-label="general term a_n"></div>' +
      '<div class="lap-row sq-rc"><label class="lap-lbl">aₙ₊₁ =</label><input class="lap-in" data-in="g" spellcheck="false" aria-label="recurrence"><label class="lap-lbl">a₁ =</label><input class="lap-in sm" data-in="a1" spellcheck="false" aria-label="first term"></div>' +
      '<p class="lap-help">พิมพ์ได้: <code>n^2</code> <code>2n+1</code> <code>(1/2)^n</code> <code>sqrt(n)</code> <code>n!</code> <code>ln(n)</code> <code>sin(n)</code> <code>(-1)^n</code> · โหมดเวียนเกิดใช้ <code>a</code> แทนพจน์ก่อนหน้า และใช้ <code>n</code> ได้</p>' +
      '<div class="lap-chips sq-pre">' + SQ_PRE.map(function (p, i) { return '<button type="button" class="lap-chip" data-pre="' + i + '">' + p.l + "</button>"; }).join("") + "</div>" +
      slider("N", "จำนวนพจน์ที่แสดง", 5, 120, 1, st.N) + slider("le", "ε (ความกว้างแถบรอบลิมิต)", -4, 0, 0.05, st.le) +
      '<div class="lap-chips sq-views"><button type="button" class="lap-chip" data-view="terms">กราฟพจน์ aₙ + แถบ ε</button><button type="button" class="lap-chip" data-view="sums">ผลบวกย่อย Sₙ (อนุกรม)</button><button type="button" class="lap-chip" data-view="cobweb">ใยแมงมุม (cobweb)</button></div>' +
      '<div class="lap-eq sq-eq"></div><div class="sq-flags"></div><div class="cl-plot sq-plot"></div><div class="sq-info"></div>';
    var eq = box.querySelector(".sq-eq"), flags = box.querySelector(".sq-flags"), plot = box.querySelector(".sq-plot"), info = box.querySelector(".sq-info");
    var fmtOut = { le: function (v) { return "ε = " + fmt(Math.pow(10, v), 2); } };
    function syncInputs() {
      box.querySelector('[data-in="f"]').value = st.f; box.querySelector('[data-in="g"]').value = st.g; box.querySelector('[data-in="a1"]').value = st.a1;
    }
    function draw() {
      $$("[data-mode]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-mode") === st.mode); });
      $$("[data-view]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-view") === st.view); });
      box.querySelector(".sq-ex").hidden = st.mode !== "explicit";
      box.querySelector(".sq-rc").hidden = st.mode !== "recursive";
      var cob = box.querySelector('[data-view="cobweb"]'); cob.hidden = st.mode !== "recursive";
      if (st.mode !== "recursive" && st.view === "cobweb") st.view = "terms";
      var eps = Math.pow(10, st.le), N = st.N, a = [], c, res, gdep = false, a1v;
      try {
        if (st.mode === "explicit") {
          c = compile(st.f, ["n"], { n: "n" });
          for (var i = 1; i <= 2000; i++) a.push(c.fn({ n: i }));
          res = analyzeExplicit(c.fn, 1);
          MK.tex(eq, "a_n = " + c.tex + ",\\qquad n = 1, 2, 3, \\dots", true);
        } else {
          c = compile(st.g, ["a", "n"], { a: "a_n", n: "n" });
          a1v = num(st.a1);
          gdep = c.uses("n");
          a = iterate(c.fn, a1v, 6000, 1);
          res = analyzeRecursive(a);
          MK.tex(eq, "a_{n+1} = " + c.tex + ",\\qquad a_1 = " + texNum(a1v), true);
        }
      } catch (e) { info.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; flags.innerHTML = ""; plot.innerHTML = ""; return; }

      // arithmetic / geometric / monotone / bounded
      var head = a.slice(0, 12).filter(isFinite), fl = [];
      if (head.length >= 4) {
        var dd = head[1] - head[0], isA = head.every(function (v, i) { return i === 0 || Math.abs(v - head[i - 1] - dd) < 1e-9 * Math.max(1, Math.abs(v)); });
        var rr = head[0] !== 0 ? head[1] / head[0] : NaN, isG = isFinite(rr) && head.every(function (v, i) { return i === 0 || Math.abs(v - head[i - 1] * rr) < 1e-9 * Math.max(1, Math.abs(v)); });
        if (isA) fl.push(flag(true, "ลำดับเลขคณิต d = " + fmt(dd)));
        if (isG && !isA) fl.push(flag(true, "ลำดับเรขาคณิต r = " + fmt(rr)));
      }
      var M = Math.min(a.length, 2000), inc = true, dec = true;
      for (var j = 1; j < M; j++) { if (!(a[j] >= a[j - 1] - 1e-15 * Math.abs(a[j]))) inc = false; if (!(a[j] <= a[j - 1] + 1e-15 * Math.abs(a[j]))) dec = false; }
      if (inc && !dec) fl.push(flag(true, "เพิ่มขึ้น (increasing)")); else if (dec && !inc) fl.push(flag(true, "ลดลง (decreasing)")); else if (!inc && !dec) fl.push(flag(false, "ไม่เป็นทางเดียว"));
      var bounded = res.kind === "conv" || res.kind === "osc" && !res.unbounded || res.kind === "cycle2";
      fl.push(flag(bounded, bounded ? "มีขอบเขต (bounded)" : res.kind === "slow" ? "ยังโตอยู่" : "ไม่มีขอบเขต"));
      var verdict;
      if (res.kind === "conv") verdict = flag(true, "ลู่เข้า (convergent) → " + (namedTex(res.L) ? namedTex(res.L).replace(/\\varphi = \\tfrac\{1\+\\sqrt5\}\{2\}/, "φ").replace(/\\/g, "") : fmt(res.L, 6)));
      else if (res.kind === "inf") verdict = flag(false, "ลู่ออกสู่ +∞");
      else if (res.kind === "-inf") verdict = flag(false, "ลู่ออกสู่ −∞");
      else if (res.kind === "cycle2") verdict = flag(false, "แกว่งเป็นวัฏจักรคาบ 2 (ลู่ออก)");
      else if (res.kind === "osc") verdict = flag(false, "แกว่ง ไม่ลู่เข้า (divergent)");
      else if (res.kind === "slow") verdict = flag(false, "ยังเปลี่ยนอยู่ที่ n = 10⁶: อาจลู่ออกช้า ๆ หรือลู่เข้าช้ามาก");
      else verdict = flag(false, "หาค่าไม่ได้บางพจน์");
      flags.innerHTML = '<div class="lap-row">' + verdict + fl.join("") + "</div>";

      var L = res.kind === "conv" ? res.L : NaN, shown = a.slice(0, N), Ne = null, scanTo = 0;
      if (isFinite(L)) {
        // ε–N: smallest N with |aₙ − L| < ε for every n checked from N on
        var arr = a;
        if (st.mode === "explicit") { arr = []; for (var q = 1; q <= 100000; q++) arr.push(c.fn({ n: q })); }
        scanTo = arr.length;
        var lastBad = 0;
        for (var p = arr.length - 1; p >= 0; p--) if (!(Math.abs(arr[p] - L) < eps)) { lastBad = p + 1; break; }
        Ne = lastBad + 1;
        if (Ne > arr.length) Ne = null;
      }
      var S = [], s = 0; shown.forEach(function (v) { s += v; S.push(s); });

      if (st.view === "cobweb" && st.mode === "recursive") {
        if (gdep) { plot.innerHTML = '<p class="lap-note">ใยแมงมุมใช้ได้เมื่อ g ขึ้นกับ aₙ อย่างเดียว (สูตรนี้มี n อยู่ด้วย)</p>'; }
        else {
          var fin = shown.filter(isFinite), lo = Math.min.apply(null, fin.concat([isFinite(L) ? L : fin[0]])), hi = Math.max.apply(null, fin.concat([isFinite(L) ? L : fin[0]]));
          var pad = (hi - lo) * 0.25 + 0.2; lo -= pad; hi += pad;
          var gfun = function (x) { return c.fn({ a: x, n: 1 }); };
          var segs = [], x0 = shown[0];
          for (var t = 0; t < Math.min(shown.length - 1, 40); t++) {
            var y = shown[t + 1];
            if (!isFinite(y)) break;
            segs.push({ x1: x0, y1: t === 0 ? lo : x0, x2: x0, y2: y, color: "var(--signal)", width: 1.4 });
            segs.push({ x1: x0, y1: y, x2: y, y2: y, color: "var(--signal)", width: 1.4 });
            x0 = y;
          }
          plot.innerHTML = MK.plot({ w: 680, h: 380, xmin: lo, xmax: hi, ymin: lo, ymax: hi, series: [{ pts: MK.sample(gfun, lo, hi, 400), color: "var(--accent)" }, { pts: [[lo, lo], [hi, hi]], color: "var(--ink-3)", dash: "4 4", width: 1.3 }], segs: segs, marks: isFinite(L) ? [{ x: L, y: L, color: "var(--ok)", label: "จุดตรึง L" }] : [], xlabel: "aₙ", ylabel: "aₙ₊₁", id: MK.uid("cw"), zero: false, label: "Cobweb diagram of a recurrence" });
        }
      } else {
        var isSum = st.view === "sums", ys = isSum ? S : shown;
        var fin2 = ys.filter(isFinite), clip = fin2.length ? Math.max.apply(null, fin2.map(Math.abs)) : 1;
        var marks = ys.map(function (v, i) {
          var inside = !isSum && isFinite(L) && Math.abs(v - L) < eps;
          return { x: i + 1, y: v, r: N > 60 ? 2.4 : 3.6, color: isSum ? "var(--signal)" : inside ? "var(--ok)" : "var(--accent)" };
        });
        var ymin = Math.min(0, Math.min.apply(null, fin2.length ? fin2 : [0])), ymax = Math.max(0, Math.max.apply(null, fin2.length ? fin2 : [1]));
        if (!isSum && isFinite(L)) { ymin = Math.min(ymin, L - eps); ymax = Math.max(ymax, L + eps); }
        var padY = (ymax - ymin) * 0.08 || 1; ymin -= padY; ymax += padY;
        if (clip > 1e6) { ymin = Math.max(ymin, -1e6); ymax = Math.min(ymax, 1e6); }
        var hl = [], vl = [], ser = [];
        if (!isSum && isFinite(L)) {
          ser.push({ pts: [[0, L + eps], [N + 1, L + eps]], color: "var(--signal)", fill: 0.13, base: L - eps, width: 0.8 });
          ser.push({ pts: [[0, L - eps], [N + 1, L - eps]], color: "var(--signal)", width: 0.8 });
          hl.push({ y: L, color: "var(--ok)", label: "L = " + fmt(L, 5) + " · แถบ L ± ε" });
          if (Ne && Ne <= N) vl.push({ x: Ne, color: "var(--ok)", label: "N = " + Ne });
        }
        ser.push({ pts: ys.map(function (v, i) { return [i + 1, v]; }), color: isSum ? "var(--signal)" : "var(--ink-3)", width: 1, dash: "2 3" });
        plot.innerHTML = MK.plot({ w: 680, h: 340, xmin: 0, xmax: N + 1, ymin: ymin, ymax: ymax, series: ser, marks: marks, hlines: hl, vlines: vl, xlabel: "n", ylabel: isSum ? "Sₙ" : "aₙ", id: MK.uid("sq"), label: isSum ? "Partial sums S_n" : "Terms of the sequence a_n" });
      }

      // explanation + table
      var msg = "";
      if (isFinite(L)) {
        msg = Ne ? "เลือก ε = " + fmt(eps, 3) + " ได้ <b>N = " + Ne + "</b>: ทุกพจน์ตั้งแต่ n = " + Ne + " (ตรวจถึง n = " + scanTo.toLocaleString("en-US") + ") อยู่ในแถบ |aₙ − L| &lt; ε จุดสีเขียวคือพจน์ที่อยู่ในแถบแล้ว ลองลด ε แล้วดูว่า N ต้องใหญ่ขึ้น นี่คือนิยาม ε–N ของลิมิตลำดับ" :
          "ε เล็กมากจน N เกินช่วงที่ตรวจ (" + scanTo.toLocaleString("en-US") + " พจน์) ลองเพิ่ม ε";
      } else if (res.kind === "osc" || res.kind === "cycle2") msg = "ไม่มีจำนวน L ใดที่พจน์เข้าไปอยู่ในแถบ ε รอบมันได้ตลอด จึงไม่ลู่เข้า";
      else if (res.kind === "inf" || res.kind === "-inf") msg = "พจน์โตเกินทุกขอบเขต: เขียนว่า lim aₙ = " + (res.kind === "inf" ? "∞" : "−∞") + " (ลู่ออก)";
      else if (res.kind === "slow") msg = "ตัวเลขยังเปลี่ยนอยู่แม้ n = 1,000,000 การคำนวณจึงตัดสินไม่ได้ ต้องใช้ทฤษฎี เช่นเปรียบเทียบกับ ln n หรือ 1/ln n";
      if (st.view === "sums") {
        msg = "ผลบวกย่อย Sₙ = a₁ + a₂ + … + aₙ คือ “ลำดับใหม่” อนุกรม Σaₙ ลู่เข้าก็ต่อเมื่อ Sₙ ลู่เข้า · S" + N + " = " + fmt(S[S.length - 1], 7) +
          (isFinite(L) && Math.abs(L) > 1e-9 ? ' · พจน์ไม่เข้าใกล้ 0 (L = ' + fmt(L, 4) + ") อนุกรมจึงลู่ออกแน่นอน (nth-term test)" : "") +
          ' · ใช้ <a href="#tests">ตัวทดสอบอนุกรม</a> เพื่อดูว่าลู่เข้าหรือไม่';
      }
      if (st.view === "cobweb") {
        msg = "เริ่มที่ a₁ บนแกนนอน ขึ้นไปชนกราฟ y = g(x) ได้ a₂ แล้วเลี้ยวไปชนเส้น y = x เพื่อนำ a₂ กลับมาเป็นอินพุต ทำซ้ำ บันไดหรือเกลียวที่วิ่งเข้าจุดตัดแสดงว่าลู่เข้าสู่จุดตรึง L = g(L) ซึ่งเกิดเมื่อ |g′(L)| &lt; 1";
        if (res.kind === "cycle2") msg += " · กรณีนี้จุดตรึงมี |g′(L)| &gt; 1 (ไม่เสถียร) ใยแมงมุมจึงไม่เข้าจุดตัด แต่วนเป็นสี่เหลี่ยมระหว่าง " + fmt(Math.min(res.p[0], res.p[1]), 4) + " กับ " + fmt(Math.max(res.p[0], res.p[1]), 4) + " (วัฏจักรคาบ 2)";
        else if (isFinite(L) && !gdep) { var hh = 1e-6, gp = (c.fn({ a: L + hh, n: 1 }) - c.fn({ a: L - hh, n: 1 })) / (2 * hh); msg += " · ที่นี่ g′(L) ≈ " + fmt(gp, 3) + (Math.abs(gp) < 1e-3 ? " (ลู่เข้าเร็วมากแบบกำลังสอง เหมือนวิธีนิวตัน)" : gp < 0 ? " (ติดลบ: เกลียวเข้า)" : " (บวก: บันไดเข้า)"); }
      }
      var rows = "";
      for (var r2 = 0; r2 < Math.min(N, 10); r2++) rows += "<tr><td>" + (r2 + 1) + "</td><td>" + fmt(shown[r2], 8) + "</td><td>" + fmt(S[r2], 8) + "</td>" + (isFinite(L) ? "<td>" + fmt(Math.abs(shown[r2] - L), 3) + "</td>" : "") + "</tr>";
      info.innerHTML = '<p class="lap-note">' + msg + '</p><div class="table-wrap"><table class="lap-pt sq-tab"><thead><tr><th>n</th><th>aₙ</th><th>Sₙ</th>' + (isFinite(L) ? "<th>|aₙ − L|</th>" : "") + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-mode]"); if (m) { st.mode = m.getAttribute("data-mode"); draw(); return; }
      var v = e.target.closest("[data-view]"); if (v) { st.view = v.getAttribute("data-view"); draw(); return; }
      var p = e.target.closest("[data-pre]");
      if (p) { var P = SQ_PRE[+p.getAttribute("data-pre")]; st.mode = P.m; if (P.f) st.f = P.f; if (P.g) { st.g = P.g; st.a1 = P.a1; } syncInputs(); draw(); }
    });
    $$(".lap-in", box).forEach(function (inp) {
      var go = function () { st[inp.getAttribute("data-in")] = inp.value; draw(); };
      inp.addEventListener("change", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    bindSliders(box, st, draw, fmtOut);
    box._set = function (o) {
      Object.keys(o).forEach(function (k) { if (k === "eps") { st.le = Math.log10(o.eps); setSlider(box, "le", st.le, fmtOut); } else { st[k] = o[k]; if (k === "N") setSlider(box, "N", o.N); } });
      syncInputs(); draw();
    };
    syncInputs(); draw();
  }

  // ======================================================================= 2. series convergence tester
  var TESTS = [
    { id: "geo", l: "Σ (1/2)ⁿ", a: "(1/2)^n", n0: 0, v: "conv", t: "อนุกรมเรขาคณิต", sum: "2",
      s: ["อนุกรมเรขาคณิต \\(a = 1,\\ r = \\tfrac12\\)", "\\(|r| < 1\\) จึงลู่เข้า และ \\(S = \\dfrac{a}{1-r} = \\dfrac{1}{1-\\frac12} = 2\\)"] },
    { id: "harmonic", l: "Σ 1/n ฮาร์มอนิก", a: "1/n", n0: 1, v: "div", t: "การทดสอบด้วยปริพันธ์ (p = 1)",
      s: ["\\(a_n = 1/n \\to 0\\) แต่ nth-term test สรุปไม่ได้ (ไม่ได้รับประกันว่าลู่เข้า)", "เปรียบเทียบกับพื้นที่: \\(S_N \\ge \\int_1^{N+1}\\frac{dx}{x} = \\ln(N+1) \\to \\infty\\)", "ผลบวกโตช้ามากแบบ \\(\\ln N\\): หนึ่งล้านพจน์ได้แค่ราว 14.39 แต่ไม่มีขอบเขต จึงลู่ออก"] },
    { id: "pseries", l: "Σ 1/n²", a: "1/n^2", n0: 1, v: "conv", t: "อนุกรม p (p = 2 > 1)", sum: "\\pi^2/6",
      s: ["อนุกรม p: \\(\\sum 1/n^p\\) ลู่เข้าเมื่อ \\(p > 1\\) ตรงนี้ \\(p = 2\\)", "ผลบวกจริงคือ \\(\\pi^2/6 \\approx 1.644934\\) (ปัญหาบาเซิล แก้โดยออยเลอร์ หรือหาได้จากอนุกรมฟูริเยร์)"] },
    { id: "n2n", l: "Σ n/2ⁿ", a: "n/2^n", n0: 1, v: "conv", t: "การทดสอบอัตราส่วน", sum: "2",
      s: ["\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac{n+1}{2^{n+1}}\\cdot\\dfrac{2^n}{n} = \\dfrac{n+1}{2n} \\to \\tfrac12\\)", "\\(\\rho = \\tfrac12 < 1\\) ลู่เข้า · ผลบวก \\(\\sum n x^n = \\dfrac{x}{(1-x)^2}\\) ที่ \\(x = \\tfrac12\\) ได้ 2"] },
    { id: "nth", l: "Σ n/(n+1)", a: "n/(n+1)", n0: 1, v: "div", t: "nth-term test",
      s: ["\\(\\lim a_n = \\lim \\dfrac{n}{n+1} = 1 \\ne 0\\)", "พจน์ไม่เข้าใกล้ศูนย์ ผลบวกเพิ่มเกือบ 1 ทุกพจน์ จึงลู่ออก (ไม่ต้องทดสอบอื่น)"] },
    { id: "comp", l: "Σ 1/(n²+1)", a: "1/(n^2+1)", n0: 1, v: "conv", t: "การทดสอบโดยการเปรียบเทียบ", sum: "\\tfrac{\\pi\\coth\\pi - 1}{2}",
      s: ["\\(0 < \\dfrac{1}{n^2+1} < \\dfrac{1}{n^2}\\) ทุก \\(n\\)", "\\(\\sum 1/n^2\\) ลู่เข้า อนุกรมที่เล็กกว่าจึงลู่เข้าด้วย · ผลบวก ≈ 1.076674"] },
    { id: "alt", l: "Σ (−1)ⁿ⁺¹/n", a: "(-1)^(n+1)/n", n0: 1, v: "cond", t: "การทดสอบอนุกรมสลับ", sum: "\\ln 2",
      s: ["\\(b_n = 1/n\\) ลดลงและ \\(\\to 0\\) จึงลู่เข้าตามการทดสอบอนุกรมสลับ (Leibniz)", "แต่ \\(\\sum |a_n| = \\sum 1/n\\) ลู่ออก จึงเป็นการลู่เข้าแบบมีเงื่อนไข (conditionally convergent)", "ผลบวก \\(= \\ln 2\\) และความคลาดหลังบวก N พจน์ไม่เกิน \\(1/(N+1)\\)"] },
    { id: "factn", l: "Σ n!/nⁿ", a: "n!/n^n", n0: 1, v: "conv", t: "การทดสอบอัตราส่วน",
      s: ["\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac{(n+1)!}{(n+1)^{n+1}}\\cdot\\dfrac{n^n}{n!} = \\left(\\dfrac{n}{n+1}\\right)^n \\to \\dfrac1e\\)", "\\(\\rho = 1/e \\approx 0.368 < 1\\) ลู่เข้า · ผลบวก ≈ 1.879854"] },
    { id: "nlogn", l: "Σ 1/(n ln n)", a: "1/(n ln(n))", n0: 2, v: "div", t: "การทดสอบด้วยปริพันธ์",
      s: ["\\(f(x) = \\dfrac{1}{x\\ln x}\\) เป็นบวก ต่อเนื่อง ลดลงเมื่อ \\(x \\ge 2\\)", "\\(\\int_2^{\\infty}\\dfrac{dx}{x\\ln x} = \\Big[\\ln(\\ln x)\\Big]_2^{\\infty} = \\infty\\) ลู่ออก", "โตช้ายิ่งกว่าฮาร์มอนิก (แบบ ln ln N) ตัวเลขจากคอมพิวเตอร์ดูเหมือนนิ่ง แต่ทฤษฎีบอกว่าลู่ออก"] },
    { id: "exp2", l: "Σ 2ⁿ/n!", a: "2^n/n!", n0: 1, v: "conv", t: "การทดสอบอัตราส่วน", sum: "e^2-1",
      s: ["\\(\\dfrac{a_{n+1}}{a_n} = \\dfrac{2}{n+1} \\to 0\\) ลู่เข้า", "จากอนุกรมแมคลอริน \\(e^x = \\sum x^n/n!\\) ได้ผลบวก \\(e^2 - 1 \\approx 6.389056\\)"] },
    { id: "root", l: "Σ (n/(2n+1))ⁿ", a: "(n/(2n+1))^n", n0: 1, v: "conv", t: "การทดสอบราก",
      s: ["\\(\\sqrt[n]{a_n} = \\dfrac{n}{2n+1} \\to \\tfrac12\\)", "\\(\\tfrac12 < 1\\) ลู่เข้า · การทดสอบรากเหมาะกับพจน์ที่ยกกำลัง n ทั้งก้อน"] },
    { id: "tele", l: "Σ 1/(n(n+1))", a: "1/(n(n+1))", n0: 1, v: "conv", t: "อนุกรมกล้องส่องทางไกล", sum: "1",
      s: ["แยกเศษส่วนย่อย \\(\\dfrac{1}{n(n+1)} = \\dfrac1n - \\dfrac1{n+1}\\)", "\\(S_N = 1 - \\dfrac{1}{N+1} \\to 1\\) (พจน์กลางหักล้างกันหมด)"] },
    { id: "sin", l: "Σ sin(n)/n²", a: "sin(n)/n^2", n0: 1, v: "abs", t: "เปรียบเทียบค่าสัมบูรณ์",
      s: ["\\(\\left|\\dfrac{\\sin n}{n^2}\\right| \\le \\dfrac{1}{n^2}\\) และ \\(\\sum 1/n^2\\) ลู่เข้า", "จึงลู่เข้าแบบสัมบูรณ์ (absolutely convergent) ซึ่งทำให้ลู่เข้าด้วย ทั้งที่เครื่องหมายสลับไม่เป็นระเบียบ"] },
    { id: "sqrtn", l: "Σ 1/√n", a: "1/sqrt(n)", n0: 1, v: "div", t: "อนุกรม p (p = ½ ≤ 1)",
      s: ["\\(\\sum 1/n^{1/2}\\) เป็นอนุกรม p ที่ \\(p = \\tfrac12 \\le 1\\) ลู่ออก", "หรือเปรียบเทียบ: \\(1/\\sqrt n \\ge 1/n\\) ซึ่งฮาร์มอนิกลู่ออกอยู่แล้ว"] }
  ];
  var VERD = { conv: ["ok", "ลู่เข้า (convergent)"], abs: ["ok", "ลู่เข้าแบบสัมบูรณ์ (absolutely)"], cond: ["ok", "ลู่เข้าแบบมีเงื่อนไข (conditionally)"], div: ["no", "ลู่ออก (divergent)"] };
  function ratioAt(f, n0) {
    var tries = [1000, 500, 300, 200, 140, 100, 60, 30];
    for (var i = 0; i < tries.length; i++) {
      var m = Math.max(tries[i], n0 + 2), x = f({ n: m }), y = f({ n: m + 1 });
      if (isFinite(x) && isFinite(y) && x !== 0) return { n: m, rho: Math.abs(y / x), root: Math.pow(Math.abs(x), 1 / m) };
    }
    return null;
  }
  function initTest(box) {
    var st = { pre: box.dataset.preset || "harmonic", custom: "", N: 50 }, cache = {};
    box.innerHTML = '<div class="lap-chips sqt-pre">' + TESTS.map(function (p) { return '<button type="button" class="lap-chip" data-p="' + p.id + '">' + p.l + "</button>"; }).join("") + '<button type="button" class="lap-chip" data-p="custom">✎ พิมพ์เอง</button></div>' +
      '<div class="lap-row sqt-in"><label class="lap-lbl">aₙ =</label><input class="lap-in" spellcheck="false" placeholder="เช่น 1/n^1.5 หรือ n^2/3^n" aria-label="term a_n"><label class="lap-lbl">เริ่ม n =</label><input class="lap-in sm" data-n0 value="1" aria-label="first n"></div>' +
      slider("N", "แสดงผลบวกย่อยถึง N =", 10, 200, 1, st.N) +
      '<div class="lap-eq sqt-eq"></div><div class="sqt-verdict"></div><div class="cl-plot sqt-plot"></div><div class="sqt-why"></div>';
    var eqEl = box.querySelector(".sqt-eq"), ver = box.querySelector(".sqt-verdict"), plot = box.querySelector(".sqt-plot"), why = box.querySelector(".sqt-why");
    var inp = box.querySelector(".sqt-in input"), n0in = box.querySelector("[data-n0]");
    function draw() {
      $$("[data-p]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-p") === st.pre); });
      var P = TESTS.filter(function (p) { return p.id === st.pre; })[0];
      box.querySelector(".sqt-in").hidden = !!P;
      var src = P ? P.a : st.custom, n0 = P ? P.n0 : Math.max(0, Math.round(+n0in.value || 1)), c;
      if (!src) { eqEl.innerHTML = ""; ver.innerHTML = '<p class="lap-note">พิมพ์พจน์ aₙ แล้วกด Enter</p>'; plot.innerHTML = ""; why.innerHTML = ""; return; }
      try { c = compile(src, ["n"], { n: "n" }); } catch (e) { ver.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; plot.innerHTML = why.innerHTML = ""; return; }
      MK.tex(eqEl, "\\sum_{n=" + n0 + "}^{\\infty} " + c.tex, true);
      // numerics
      var key = src + "@" + n0;
      if (cache.key !== key) cache = { key: key, lim: analyzeExplicit(c.fn, n0), ra: ratioAt(c.fn, n0), ps: partialSums(c.fn, n0, 1000001) };
      var lim = cache.lim, ra = cache.ra, ps = cache.ps, sr = longRun(ps.pts);
      var S = [], s = 0, terms = [];
      for (var m = n0; m < n0 + st.N; m++) { var t = c.fn({ n: m }); terms.push([m, t]); s += isFinite(t) ? t : 0; S.push([m, s]); }
      var lines = [];
      lines.push("lim aₙ ≈ " + (lim.kind === "conv" ? fmt(lim.L, 5) : lim.kind === "inf" ? "∞" : lim.kind === "-inf" ? "−∞" : "ไม่มี (แกว่ง)"));
      if (ra) lines.push("|aₙ₊₁/aₙ| ที่ n = " + ra.n + " ≈ " + fmt(ra.rho, 5) + " · ⁿ√|aₙ| ≈ " + fmt(ra.root, 5));
      lines.push("S ที่ n = 10⁶ ≈ " + fmt(ps.S, 9) + (ps.stop ? " (พจน์เล็กจนคอมพิวเตอร์คำนวณต่อไม่ได้ตั้งแต่ n = " + ps.stop + " ผลบวกนิ่งแล้ว)" : ""));
      var head;
      if (P) {
        var V = VERD[P.v];
        head = '<div class="lap-row"><span class="lap-flag ' + V[0] + '">' + V[1] + '</span><span class="lap-flag sqt-test">ใช้: ' + P.t + "</span>" + (P.sum ? '<span class="sqt-sum">' + T("S = " + P.sum + (sr.kind === "conv" ? "\\approx " + MK.sig(sr.L, 7) : ""), false) + "</span>" : "") + "</div>";
        why.innerHTML = '<ol class="lap-steps">' + P.s.map(function (x) { return "<li>" + rich(x) + "</li>"; }).join("") + '</ol><p class="lap-help">ตัวเลขประกอบ (ไม่ใช่บทพิสูจน์): ' + lines.join(" · ") + "</p>";
      } else {
        var verdict, kind;
        if (lim.kind === "conv" && Math.abs(lim.L) > 1e-6) { kind = "no"; verdict = "ลู่ออกแน่นอน: lim aₙ ≈ " + fmt(lim.L, 4) + " ≠ 0 (nth-term test)"; }
        else if (lim.kind === "osc" || lim.kind === "inf" || lim.kind === "-inf") { kind = "no"; verdict = "ลู่ออกแน่นอน: aₙ ไม่เข้าใกล้ 0 (nth-term test)"; }
        else if (ra && ra.rho < 0.97) { kind = "ok"; verdict = "น่าจะลู่เข้า: อัตราส่วน ρ ≈ " + fmt(ra.rho, 3) + " < 1"; }
        else if (ra && ra.rho > 1.03) { kind = "no"; verdict = "น่าจะลู่ออก: อัตราส่วน ρ ≈ " + fmt(ra.rho, 3) + " > 1"; }
        else if (sr.kind === "conv") { kind = "ok"; verdict = "ρ ≈ 1 ทดสอบอัตราส่วนไม่ได้ แต่ผลบวกย่อยนิ่งที่ ≈ " + fmt(sr.L, 7) + " ลองพิสูจน์ด้วยการเปรียบเทียบกับอนุกรม p"; }
        else { kind = "no"; verdict = "ρ ≈ 1 ทดสอบอัตราส่วนไม่ได้ และผลบวกย่อยยังเพิ่มอยู่ที่ n = 10⁶ ต้องใช้การเปรียบเทียบหรือปริพันธ์ตัดสิน"; }
        head = '<div class="lap-row"><span class="lap-flag ' + kind + '">' + verdict + "</span></div>";
        why.innerHTML = '<p class="lap-note">' + lines.join(" · ") + '</p><p class="lap-help">ผลจากการคำนวณตัวเลขเป็นแค่หลักฐาน ไม่ใช่บทพิสูจน์: อนุกรมอย่าง Σ1/(n ln n) ดูเหมือนนิ่งบนคอมพิวเตอร์แต่ลู่ออก ส่วน ρ ≈ 1 แปลว่าการทดสอบอัตราส่วนสรุปไม่ได้ ใช้ผังเลือกการทดสอบด้านบนประกอบ</p>';
      }
      ver.innerHTML = head;
      var allY = terms.map(function (p) { return p[1]; }).concat(S.map(function (p) { return p[1]; })).filter(isFinite);
      var ymin = Math.min(0, Math.min.apply(null, allY)), ymax = Math.max(0, Math.max.apply(null, allY)), pad = (ymax - ymin) * 0.08 || 1;
      var hl = []; if (P && P.sum && sr.kind === "conv") hl.push({ y: sr.L, color: "var(--ok)", label: "ผลบวก ≈ " + fmt(sr.L, 6) });
      plot.innerHTML = MK.plot({ w: 680, h: 320, xmin: n0 - 0.5, xmax: n0 + st.N, ymin: ymin - pad, ymax: ymax + pad,
        series: [{ pts: S, color: "var(--signal)", width: 2.2 }],
        marks: terms.map(function (p) { return { x: p[0], y: p[1], r: st.N > 80 ? 2 : 3, color: "var(--accent)" }; }).concat(S.length ? [{ x: S[S.length - 1][0], y: S[S.length - 1][1], color: "var(--signal)" }] : []),
        hlines: hl, xlabel: "n", ylabel: "จุด = aₙ · เส้น = Sₙ" + (S.length ? " · S" + S[S.length - 1][0] + " = " + fmt(S[S.length - 1][1], 6) : ""), id: MK.uid("st"), label: "Terms and partial sums of the series" });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); draw(); if (st.pre === "custom") inp.focus(); } });
    var go = function () { st.custom = inp.value; draw(); };
    inp.addEventListener("change", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    n0in.addEventListener("change", go);
    bindSliders(box, st, draw);
    box._set = function (id) { st.pre = id; draw(); };
    draw();
  }

  // ======================================================================= 3. Taylor polynomial lab
  var TY_PRE = [
    { l: "eˣ", f: "exp(x)", a: 0, x0: -3, x1: 3, R: "∞" },
    { l: "sin x", f: "sin(x)", a: 0, x0: -8, x1: 8, R: "∞" },
    { l: "cos x", f: "cos(x)", a: 0, x0: -8, x1: 8, R: "∞" },
    { l: "ln(1 + x)", f: "ln(1+x)", a: 0, x0: -0.95, x1: 2.5, R: "1" },
    { l: "1/(1 − x)", f: "1/(1-x)", a: 0, x0: -2, x1: 1.6, R: "1" },
    { l: "√(1 + x)", f: "sqrt(1+x)", a: 0, x0: -1, x1: 3, R: "1" },
    { l: "arctan x", f: "atan(x)", a: 0, x0: -2.5, x1: 2.5, R: "1" },
    { l: "1/(1 + x²)", f: "1/(1+x^2)", a: 0, x0: -2.5, x1: 2.5, R: "1 (เพราะโพล ±j บนระนาบเชิงซ้อน)" },
    { l: "√x รอบ x = 4", f: "sqrt(x)", a: 4, x0: 0, x1: 10, R: "4" },
    { l: "ไดโอด e^(x/0.026)", f: "exp(x/0.026)", a: 0.6, x0: 0.55, x1: 0.65, R: "∞" }
  ];
  function initTaylor(box) {
    var d = box.dataset;
    var st = { f: d.f || "sin(x)", a: +(d.a || 0), n: +(d.n || 5), x: d.x != null ? +d.x : 1, x0: -8, x1: 8 };
    var pre0 = TY_PRE.filter(function (p) { return p.f === st.f; })[0]; if (pre0) { st.x0 = pre0.x0; st.x1 = pre0.x1; }
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">f(x) =</label><input class="lap-in" data-in="f" spellcheck="false" aria-label="function f(x)"><label class="lap-lbl">กระจายรอบ a =</label><input class="lap-in sm" data-in="a" aria-label="center a"></div>' +
      '<div class="lap-chips ty-pre">' + TY_PRE.map(function (p, i) { return '<button type="button" class="lap-chip" data-pre="' + i + '">' + p.l + "</button>"; }).join("") + "</div>" +
      slider("n", "ดีกรีพหุนาม n", 0, 24, 1, st.n) + slider("x", "ประเมินที่ x =", -8, 8, 0.01, st.x) +
      '<div class="lap-eq ty-eq"></div><div class="cl-plot ty-plot"></div><div class="ty-info"></div>';
    var eq = box.querySelector(".ty-eq"), plot = box.querySelector(".ty-plot"), info = box.querySelector(".ty-info");
    function syncRange() {
      var r = box.querySelector('input[data-k="x"]'); r.min = st.x0; r.max = st.x1; r.step = (st.x1 - st.x0) / 800;
      if (st.x < st.x0 || st.x > st.x1) st.x = +(st.a + (st.x1 - st.x0) * 0.15).toPrecision(4);
      setSlider(box, "x", st.x);
      box.querySelector('[data-in="f"]').value = st.f; box.querySelector('[data-in="a"]').value = st.a;
    }
    function polyTex(c, a, n) {
      var xs = a === 0 ? "x" : "(x " + (a > 0 ? "- " + MK.nice(a) : "+ " + MK.nice(-a)) + ")", out = "", shownTerms = 0;
      for (var k = 0; k <= n; k++) {
        var v = c[k]; if (Math.abs(v) < 1e-13) continue;
        if (shownTerms >= 6 && k < n) { out += " + \\cdots"; while (k < n && Math.abs(c[n]) < 1e-13) n--; k = n; v = c[k]; if (Math.abs(v) < 1e-13) break; }
        var mag = Math.abs(v), co = MK.nice(mag, { qmax: 50000 });
        if (co.length > 14) co = MK.sig(mag, 5);
        var pw = k === 0 ? "" : xs + (k > 1 ? "^{" + k + "}" : "");
        var term = (k > 0 && Math.abs(mag - 1) < 1e-12 ? "" : co) + pw;
        out += (v < 0 ? (out ? " - " : "-") : (out ? " + " : "")) + term;
        shownTerms++;
      }
      return out || "0";
    }
    function draw() {
      var c, tree, coef, f;
      try {
        c = compile(st.f, ["x"], { x: "x" }); tree = c.tree; f = function (x) { return c.fn({ x: x }); };
        coef = jet(tree, st.a, Math.max(st.n + 1, 26));
        if (coef.slice(0, st.n + 2).some(function (v) { return !isFinite(v); })) throw err("หาอนุพันธ์ที่ a = " + st.a + " ไม่ได้ (อยู่นอกโดเมนหรือเป็นจุดเอกฐาน)");
      } catch (e) { info.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; plot.innerHTML = ""; eq.innerHTML = ""; return; }
      var n = st.n, a = st.a;
      var Pn = function (x) { var s = 0, h = x - a, p = 1; for (var k = 0; k <= n; k++) { s += coef[k] * p; p *= h; } return s; };
      var Pm = n > 0 ? function (x) { var s = 0, h = x - a, p = 1; for (var k = 0; k < n; k++) { s += coef[k] * p; p *= h; } return s; } : null;
      MK.tex(eq, "P_{" + n + "}(x) = " + polyTex(coef, a, n) + ",\\qquad c_k = \\frac{f^{(k)}(" + MK.nice(a) + ")}{k!}", true);
      var rad = radius(coef), bands = [];
      if (isFinite(rad.R)) bands.push({ x0: a - rad.R, x1: a + rad.R, color: "var(--ok)", op: 0.08 });
      var fv = f(st.x), pv = Pn(st.x), errv = Math.abs(fv - pv);
      // Lagrange bound: max over [a, x] of |f^(n+1)(t)|/(n+1)! · |x − a|^(n+1)  =  max |c_{n+1}(t)| · |x − a|^(n+1)
      var M = 0, okM = true;
      for (var i = 0; i <= 40; i++) {
        var t = a + (st.x - a) * i / 40;
        try { var cj = jet(tree, t, n + 1); var v = Math.abs(cj[n + 1]); if (!isFinite(v)) okM = false; else M = Math.max(M, v); } catch (e2) { okM = false; }
      }
      var bound = M * Math.pow(Math.abs(st.x - a), n + 1);
      var ys = MK.sample(f, st.x0, st.x1, 500).map(function (p) { return p[1]; }).filter(isFinite);
      var ylo = Math.min.apply(null, ys), yhi = Math.max.apply(null, ys), pad = (yhi - ylo) * 0.35 + 0.1;
      var series = [{ pts: MK.sample(f, st.x0, st.x1, 600), color: "var(--ink)", width: 2.4 }];
      if (Pm) series.push({ pts: MK.sample(Pm, st.x0, st.x1, 600), color: "var(--ink-3)", dash: "3 4", width: 1.3 });
      series.push({ pts: MK.sample(Pn, st.x0, st.x1, 600), color: "var(--accent)", width: 2.4 });
      plot.innerHTML = MK.plot({ w: 680, h: 360, xmin: st.x0, xmax: st.x1, ymin: ylo - pad, ymax: yhi + pad, series: series, bands: bands,
        marks: [{ x: a, y: f(a), color: "var(--ok)", label: "a" }, { x: st.x, y: fv, color: "var(--ink)" }, { x: st.x, y: pv, color: "var(--accent)" }],
        vlines: [{ x: st.x, color: "var(--signal)" }], xlabel: "x", ylabel: "y", id: MK.uid("ty"), label: "Taylor polynomial approximation of f(x)" });
      var Rtxt = rad.R === Infinity ? "∞ (ใช้ได้ทุก x)" : isFinite(rad.R) ? (rad.label ? rad.label : "≈ " + fmt(rad.R, 3)) : "—";
      var preset = TY_PRE.filter(function (p) { return p.f === st.f && p.a === st.a; })[0];
      var inside = !isFinite(rad.R) || Math.abs(st.x - a) < rad.R;
      info.innerHTML = '<p class="lap-note"><span class="lap-key" style="border-top-color:var(--ink)"></span> f(x) · <span class="lap-key k2"></span> P<sub>' + n + "</sub>(x)" + (Pm ? ' · <span class="lap-key k1"></span> P<sub>' + (n - 1) + "</sub>" : "") + ' · แถบเขียว = ช่วงลู่เข้า |x − a| &lt; R</p>' +
        '<table class="lap-pt"><tbody>' +
        "<tr><td>f(" + fmt(st.x, 4) + ")</td><td>" + fmt(fv, 10) + "</td></tr>" +
        "<tr><td>P<sub>" + n + "</sub>(" + fmt(st.x, 4) + ")</td><td>" + fmt(pv, 10) + "</td></tr>" +
        "<tr><td>ความคลาดเคลื่อนจริง |f − P<sub>" + n + "</sub>|</td><td><b>" + fmt(errv, 3) + "</b>" + (Math.abs(fv) > 1e-12 ? " (" + fmt(100 * errv / Math.abs(fv), 3) + " %)" : "") + "</td></tr>" +
        "<tr><td>ขอบเขตลากรองจ์ " + T("\\max|f^{(n+1)}|\\,\\frac{|x-a|^{n+1}}{(n+1)!}", false) + "</td><td>" + (okM ? fmt(bound, 3) + (errv <= bound * (1 + 1e-6) + 1e-15 ? " ✓ ครอบคลุมค่าจริง" : " (ค่าสุ่มจุดต่ำไป)") : "—") + "</td></tr>" +
        "<tr><td>รัศมีการลู่เข้า R</td><td>" + (preset ? preset.R : Rtxt) + (preset ? "" : rad.approx ? " (ประมาณจากสัมประสิทธิ์)" : "") + "</td></tr></tbody></table>" +
        '<p class="lap-help">' + (inside ? "x อยู่ในช่วงลู่เข้า: เพิ่มดีกรี n แล้วความคลาดเคลื่อนจะลดลงเข้าหา 0" : "x อยู่นอกช่วงลู่เข้า: เพิ่มดีกรีเท่าไรพหุนามก็ไม่เข้าใกล้ f(x) (ลองเลื่อน n ดู)") +
        " · สัมประสิทธิ์คำนวณแบบแม่นตรงด้วยการหาอนุพันธ์อัตโนมัติ (Taylor-mode AD) ไม่ได้ประมาณด้วยผลต่างจำกัด</p>";
    }
    box.addEventListener("click", function (e) {
      var p = e.target.closest("[data-pre]"); if (!p) return;
      var P = TY_PRE[+p.getAttribute("data-pre")]; st.f = P.f; st.a = P.a; st.x0 = P.x0; st.x1 = P.x1; st.x = Math.round((P.a + (P.x1 - P.x0) * 0.2) * 100) / 100;
      syncRange(); draw();
    });
    $$(".lap-in", box).forEach(function (inp) {
      var go = function () {
        var k = inp.getAttribute("data-in");
        if (k === "a") { try { st.a = num(inp.value); } catch (e) { return; } var w = (st.x1 - st.x0) / 2; st.x0 = st.a - w; st.x1 = st.a + w; }
        else st.f = inp.value;
        syncRange(); draw();
      };
      inp.addEventListener("change", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    bindSliders(box, st, draw);
    box._set = function (o) {
      Object.keys(o).forEach(function (k) { st[k] = o[k]; });
      var P = TY_PRE.filter(function (p) { return p.f === st.f; })[0];
      if (o.x0 == null && P) { st.x0 = P.x0 + (st.a - P.a); st.x1 = P.x1 + (st.a - P.a); }
      setSlider(box, "n", st.n); syncRange(); if (o.x != null) { st.x = o.x; setSlider(box, "x", st.x); } draw();
    };
    syncRange(); draw();
  }

  // ======================================================================= 4. dominoes
  function initDomino(box) {
    var st = { base: true, base2: true, n0: 1, brk: 0, strong: false, fallen: [], timer: null };
    var COUNT = 14;
    box.innerHTML = '<div class="lap-chips"><button type="button" class="lap-chip" data-m="weak">อุปนัยธรรมดา</button><button type="button" class="lap-chip" data-m="strong">อุปนัยแบบเข้ม (ต้องล้มสองตัวก่อนหน้า)</button></div>' +
      '<div class="lap-row"><label class="lap-row"><input type="checkbox" data-c="base" checked> <span>กรณีฐาน: ผลักตัวแรกให้ล้ม</span></label><label class="lap-row in-b2"><input type="checkbox" data-c="base2" checked> <span>กรณีฐานตัวที่สอง</span></label>' +
      '<label class="lap-lbl">เริ่มที่ n₀ =</label><select class="lap-in sm" data-c="n0" aria-label="base index"><option>1</option><option>2</option><option>3</option></select>' +
      '<label class="lap-lbl">ขั้นอุปนัย:</label><select class="lap-in" data-c="brk" aria-label="inductive step"><option value="0">ตัวที่ k ล้ม ⇒ ตัวที่ k+1 ล้ม (ทุก k)</option><option value="4">ขั้นอุปนัยพังที่ k = 4 (ห่างเกินไป)</option><option value="7">ขั้นอุปนัยพังที่ k = 7</option></select></div>' +
      '<div class="lap-row"><button type="button" class="btn btn-primary btn-sm" data-go>▶ ผลักโดมิโน</button><button type="button" class="btn btn-ghost btn-sm" data-reset>↺ ตั้งใหม่</button></div>' +
      '<div class="in-dom-svg"></div><p class="lap-note in-dom-msg"></p>';
    var svgBox = box.querySelector(".in-dom-svg"), msg = box.querySelector(".in-dom-msg");
    function X(i) { return 24 + i * 50 + (st.brk && i + st.n0 > st.brk ? 60 : 0); }
    function render() {
      $$("[data-m]", box).forEach(function (b) { b.classList.toggle("on", (b.getAttribute("data-m") === "strong") === st.strong); });
      box.querySelector(".in-b2").hidden = !st.strong;
      var s = '<svg class="in-dom" viewBox="0 0 790 190" role="img" aria-label="Dominoes illustrating mathematical induction: base case and inductive step">';
      s += '<line class="in-floor" x1="10" y1="150" x2="780" y2="150"/>';
      for (var i = 0; i < COUNT; i++) {
        var n = i + st.n0, x = X(i), down = st.fallen[i], gap = st.brk && n === st.brk;
        var cls = "in-tile" + (down ? " down" : "") + (i === 0 || (st.strong && st.base2 && i === 1) ? " base" : "");
        s += '<g class="' + cls + '" style="transform-origin:' + (x + 12) + "px 150px;" + (down ? "transform:rotate(" + (gap ? 84 : i === COUNT - 1 ? 62 : 52) + "deg)" : "") + '"><rect x="' + x + '" y="70" width="12" height="80" rx="2"/></g>';
        s += '<text class="in-lab" x="' + (x + 6) + '" y="172" text-anchor="middle">P(' + n + ")</text>";
        if (gap) s += '<text class="in-gap" x="' + (x + 101) + '" y="62" text-anchor="middle">✕</text><line class="in-gapl" x1="' + (x + 101) + '" y1="66" x2="' + (x + 101) + '" y2="150"/><text class="in-lab" x="' + (x + 101) + '" y="50" text-anchor="middle">P(' + n + ') ⇏ P(' + (n + 1) + ')</text>';
      }
      s += "</svg>";
      svgBox.innerHTML = s;
    }
    function explain(done) {
      var n0 = st.n0, parts = [], two = st.strong && st.base2;
      if (!st.base) parts.push("ไม่มีกรณีฐาน: ไม่มีตัวแรกที่ล้ม ขั้นอุปนัยดีแค่ไหนก็ไม่เกิดอะไรขึ้น → <b>สรุปอะไรไม่ได้</b>");
      else if (st.strong && !st.base2) parts.push("แบบเข้มที่มีกรณีฐานค่าเดียว: P(" + (n0 + 1) + ") ต้องอาศัยทั้ง P(" + n0 + ") และ P(" + (n0 - 1) + ") ซึ่งไม่มีใครพิสูจน์ → หยุดที่ P(" + n0 + ") <b>ต้องมีกรณีฐานเท่าจำนวนขั้นที่ย้อน</b> (ฟีโบนัชชีต้องรู้ทั้ง F₁ และ F₂)");
      else if (st.brk) parts.push("ขั้นอุปนัยไม่จริงที่ k = " + st.brk + ": ล้มถึง P(" + st.brk + ") แล้วหยุด → พิสูจน์ได้แค่ P(" + n0 + ") ถึง P(" + st.brk + ") <b>ไม่ใช่ทุก n</b>");
      else parts.push("มีครบทั้งกรณีฐาน " + (two ? "P(" + n0 + ") และ P(" + (n0 + 1) + ")" : "P(" + n0 + ")") + " และขั้นอุปนัย " + (st.strong ? "P(k−1) ∧ P(k) ⇒ P(k+1)" : "P(k) ⇒ P(k+1)") + " ทุก k → <b>P(n) จริงทุก n ≥ " + n0 + "</b> (ไม่ใช่แค่ 14 ตัวที่เห็น แต่ทุกจำนวนนับ)");
      if (st.strong && st.base2 && st.base && !st.brk) parts.push("แบบเข้ม: ตัวที่ k + 1 ล้มเมื่อตัว k และ k − 1 ล้มทั้งคู่ จึงต้องผลักกรณีฐาน<b>สองตัว</b>");
      msg.innerHTML = (done ? "" : "กด ▶ เพื่อผลัก · ") + parts.join(" · ");
    }
    function reset() { clearTimeout(st.timer); st.fallen = []; render(); explain(false); }
    function go() {
      reset();
      if (!st.base) { explain(true); return; }
      var i = 0;
      (function step() {
        // index i falls if: base (i = 0, or i = 1 for strong) or predecessor(s) fallen and the step works between them
        var n = i + st.n0, ok;
        if (i === 0 || (st.strong && st.base2 && i === 1)) ok = true;
        else ok = st.fallen[i - 1] && (!st.strong || st.fallen[i - 2]) && !(st.brk && n - 1 === st.brk);
        if (!ok || i >= COUNT) { explain(true); return; }
        st.fallen[i] = true; render(); i++;
        st.timer = setTimeout(step, 170);
      })();
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]"); if (m) { st.strong = m.getAttribute("data-m") === "strong"; reset(); return; }
      if (e.target.closest("[data-go]")) go();
      if (e.target.closest("[data-reset]")) reset();
    });
    box.querySelector('[data-c="base"]').addEventListener("change", function (e) { st.base = e.target.checked; reset(); });
    box.querySelector('[data-c="base2"]').addEventListener("change", function (e) { st.base2 = e.target.checked; reset(); });
    box.querySelector('[data-c="n0"]').addEventListener("change", function (e) { st.n0 = +e.target.value; reset(); });
    box.querySelector('[data-c="brk"]').addEventListener("change", function (e) { st.brk = +e.target.value; reset(); });
    reset();
  }

  // ======================================================================= 5. induction checker
  function fib(n) { var a = 0, b = 1; for (var i = 0; i < n; i++) { var t = a + b; a = b; b = t; } return a; }
  function gcdN(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function frac(p, q) { var g = gcdN(p, q) || 1; p /= g; q /= g; return q === 1 ? String(p) : "\\tfrac{" + p + "}{" + q + "}"; }
  var big = function (v) { return typeof BigInt === "function" ? BigInt(v) : v; };
  var IN_PRE = [
    { id: "sum-k", l: "Σk = n(n+1)/2", st: "1 + 2 + \\cdots + n = \\dfrac{n(n+1)}{2}", n0: 1,
      L: function (n) { return n * (n + 1) / 2; }, R: function (n) { return n * (n + 1) / 2; }, rel: "=",
      lhsTex: function (n) { return n <= 4 ? Array.from({ length: n }, function (_, i) { return i + 1; }).join(" + ") : "1 + 2 + \\cdots + " + n; },
      gen: ["\\underbrace{1 + 2 + \\cdots + k}_{\\text{สมมติฐาน}} + (k+1) = \\hlP{\\dfrac{k(k+1)}{2}} + (k+1)", "= \\dfrac{k(k+1) + 2(k+1)}{2} = \\dfrac{(k+1)(k+2)}{2} \\checkmark"],
      num: function (k) { var h = k * (k + 1) / 2; return ["(1 + \\cdots + " + k + ") + " + (k + 1) + " = \\hlP{" + h + "} + " + (k + 1) + " = " + (h + k + 1), "\\dfrac{(k+1)(k+2)}{2} = \\dfrac{" + (k + 1) + "\\cdot" + (k + 2) + "}{2} = " + ((k + 1) * (k + 2) / 2) + "\\ \\checkmark"]; } },
    { id: "sum-k2", l: "Σk² = n(n+1)(2n+1)/6", st: "1^2 + 2^2 + \\cdots + n^2 = \\dfrac{n(n+1)(2n+1)}{6}", n0: 1,
      L: function (n) { var s = 0; for (var i = 1; i <= n; i++) s += i * i; return s; }, R: function (n) { return n * (n + 1) * (2 * n + 1) / 6; }, rel: "=",
      gen: ["\\sum_{i=1}^{k+1} i^2 = \\hlP{\\dfrac{k(k+1)(2k+1)}{6}} + (k+1)^2 = \\dfrac{(k+1)\\left[k(2k+1) + 6(k+1)\\right]}{6}", "= \\dfrac{(k+1)(2k^2 + 7k + 6)}{6} = \\dfrac{(k+1)(k+2)(2k+3)}{6} \\checkmark"],
      num: function (k) { var h = k * (k + 1) * (2 * k + 1) / 6; return ["\\hlP{" + h + "} + " + (k + 1) + "^2 = " + (h + (k + 1) * (k + 1)), "\\dfrac{" + (k + 1) + "\\cdot" + (k + 2) + "\\cdot" + (2 * k + 3) + "}{6} = " + ((k + 1) * (k + 2) * (2 * k + 3) / 6) + "\\ \\checkmark"]; } },
    { id: "sum-k3", l: "Σk³ = [n(n+1)/2]²", st: "1^3 + 2^3 + \\cdots + n^3 = \\left[\\dfrac{n(n+1)}{2}\\right]^2", n0: 1,
      L: function (n) { var s = 0; for (var i = 1; i <= n; i++) s += i * i * i; return s; }, R: function (n) { var h = n * (n + 1) / 2; return h * h; }, rel: "=",
      gen: ["\\hlP{\\dfrac{k^2(k+1)^2}{4}} + (k+1)^3 = \\dfrac{(k+1)^2\\left[k^2 + 4(k+1)\\right]}{4} = \\dfrac{(k+1)^2(k+2)^2}{4} \\checkmark"],
      num: function (k) { var h = Math.pow(k * (k + 1) / 2, 2); return ["\\hlP{" + h + "} + " + (k + 1) + "^3 = " + (h + Math.pow(k + 1, 3)), "\\left[\\dfrac{" + (k + 1) + "\\cdot" + (k + 2) + "}{2}\\right]^2 = " + Math.pow((k + 1) * (k + 2) / 2, 2) + "\\ \\checkmark"]; } },
    { id: "odd", l: "Σ(2k−1) = n²", st: "1 + 3 + 5 + \\cdots + (2n-1) = n^2", n0: 1,
      L: function (n) { return n * n; }, R: function (n) { return n * n; }, rel: "=",
      gen: ["\\hlP{k^2} + (2k + 1) = (k+1)^2 \\checkmark"],
      num: function (k) { return ["\\hlP{" + k * k + "} + " + (2 * k + 1) + " = " + (k * k + 2 * k + 1) + " = " + (k + 1) + "^2\\ \\checkmark"]; } },
    { id: "geo2", l: "Σ2ᵏ = 2ⁿ − 1 (ค่าสูงสุด n บิต)", st: "1 + 2 + 4 + \\cdots + 2^{n-1} = 2^n - 1", n0: 1,
      L: function (n) { return Math.pow(2, n) - 1; }, R: function (n) { return Math.pow(2, n) - 1; }, rel: "=",
      gen: ["\\hlP{(2^k - 1)} + 2^k = 2\\cdot 2^k - 1 = 2^{k+1} - 1 \\checkmark"],
      num: function (k) { var h = Math.pow(2, k) - 1; return ["\\hlP{" + h + "} + 2^{" + k + "} = " + h + " + " + Math.pow(2, k) + " = " + (2 * h + 1) + " = 2^{" + (k + 1) + "} - 1\\ \\checkmark"]; } },
    { id: "tele", l: "Σ1/(k(k+1)) = n/(n+1)", st: "\\dfrac{1}{1\\cdot2} + \\dfrac{1}{2\\cdot3} + \\cdots + \\dfrac{1}{n(n+1)} = \\dfrac{n}{n+1}", n0: 1,
      L: function (n) { return n / (n + 1); }, R: function (n) { return n / (n + 1); }, rel: "=", show: function (n) { return frac(n, n + 1); },
      gen: ["\\hlP{\\dfrac{k}{k+1}} + \\dfrac{1}{(k+1)(k+2)} = \\dfrac{k(k+2) + 1}{(k+1)(k+2)} = \\dfrac{(k+1)^2}{(k+1)(k+2)} = \\dfrac{k+1}{k+2} \\checkmark"],
      num: function (k) { return ["\\hlP{" + frac(k, k + 1) + "} + " + frac(1, (k + 1) * (k + 2)) + " = " + frac(k * (k + 2) + 1, (k + 1) * (k + 2)) + " = " + frac(k + 1, k + 2) + "\\ \\checkmark"]; } },
    { id: "div6", l: "6 หาร n³ − n ลงตัว", st: "6 \\mid n^3 - n", n0: 1, rel: "|",
      L: function (n) { return big(n) * big(n) * big(n) - big(n); }, R: function () { return big(6); },
      gen: ["(k+1)^3 - (k+1) = \\hlP{(k^3 - k)} + 3k(k+1)", "\\hlP{k^3 - k = 6m} \\text{ ตามสมมติฐาน และ } k(k+1) \\text{ เป็นจำนวนคู่ จึง } 6 \\mid 3k(k+1) \\checkmark"],
      num: function (k) { var a = k * k * k - k, b = 3 * k * (k + 1); return [(k + 1) + "^3 - " + (k + 1) + " = \\hlP{" + a + "} + " + b + " = " + (a + b), "\\hlP{" + a + " = 6\\cdot" + a / 6 + "},\\ " + b + " = 6\\cdot" + b / 6 + "\\ \\Rightarrow\\ " + (a + b) + " = 6\\cdot" + (a + b) / 6 + "\\ \\checkmark"]; } },
    { id: "div3", l: "3 หาร 4ⁿ − 1 ลงตัว", st: "3 \\mid 4^n - 1", n0: 1, rel: "|",
      L: function (n) { return big(4) ** big(n) - big(1); }, R: function () { return big(3); },
      gen: ["4^{k+1} - 1 = 4\\cdot 4^k - 1 = 4\\hlP{(4^k - 1)} + 3 = 4\\cdot\\hlP{3m} + 3 = 3(4m + 1) \\checkmark"],
      num: function (k) { var a = big(4) ** big(k) - big(1); return ["4^{" + (k + 1) + "} - 1 = 4\\cdot\\hlP{" + a + "} + 3 = " + (big(4) * a + big(3)), "= 3 \\cdot " + ((big(4) * a + big(3)) / big(3)) + "\\ \\checkmark"]; } },
    { id: "pow2", l: "2ⁿ > n² (n ≥ 5)", st: "2^n > n^2 \\quad (n \\ge 5)", n0: 5, rel: ">",
      L: function (n) { return Math.pow(2, n); }, R: function (n) { return n * n; },
      gen: ["2^{k+1} = 2\\cdot 2^k > 2\\hlP{k^2}", "2k^2 - (k+1)^2 = k^2 - 2k - 1 = (k-1)^2 - 2 > 0 \\text{ เมื่อ } k \\ge 3 \\ \\Rightarrow\\ 2^{k+1} > (k+1)^2 \\checkmark"],
      num: function (k) { return ["2^{" + (k + 1) + "} = 2\\cdot\\hlP{" + Math.pow(2, k) + "} = " + Math.pow(2, k + 1) + " > 2\\cdot\\hlP{" + k * k + "} = " + 2 * k * k, 2 * k * k + " \\ge " + (k + 1) + "^2 = " + (k + 1) * (k + 1) + "\\ \\checkmark"]; } },
    { id: "fact", l: "n! > 2ⁿ (n ≥ 4)", st: "n! > 2^n \\quad (n \\ge 4)", n0: 4, rel: ">",
      L: function (n) { return fact(n); }, R: function (n) { return Math.pow(2, n); },
      gen: ["(k+1)! = (k+1)\\cdot \\hlP{k!} > (k+1)\\cdot \\hlP{2^k} \\ge 2\\cdot 2^k = 2^{k+1} \\checkmark \\quad (\\text{เพราะ } k + 1 \\ge 2)"],
      num: function (k) { return ["(" + (k + 1) + ")! = " + (k + 1) + "\\cdot\\hlP{" + fact(k) + "} = " + fact(k + 1) + " > " + (k + 1) + "\\cdot\\hlP{" + Math.pow(2, k) + "} = " + (k + 1) * Math.pow(2, k) + " \\ge 2^{" + (k + 1) + "} = " + Math.pow(2, k + 1) + "\\ \\checkmark"]; } },
    { id: "bern", l: "(1+x)ⁿ ≥ 1 + nx (เบอร์นูลลี)", st: "(1 + x)^n \\ge 1 + nx \\quad (x \\ge -1)", n0: 1, rel: "≥", x: 0.05,
      L: function (n, x) { return Math.pow(1 + x, n); }, R: function (n, x) { return 1 + n * x; },
      gen: ["(1+x)^{k+1} = (1+x)^k(1+x) \\ge \\hlP{(1+kx)}(1+x) \\quad (\\text{คูณด้วย } 1 + x \\ge 0)", "= 1 + (k+1)x + kx^2 \\ge 1 + (k+1)x \\checkmark"],
      num: function (k, x) { var a = Math.pow(1 + x, k); return ["(1+x)^{" + (k + 1) + "} = \\hlP{" + MK.sig(a, 8) + "}\\times" + MK.sig(1 + x, 6) + " = " + MK.sig(a * (1 + x), 8), "\\ge \\hlP{" + MK.sig(1 + k * x, 8) + "}\\times" + MK.sig(1 + x, 6) + " = " + MK.sig((1 + k * x) * (1 + x), 8) + " \\ge 1 + " + (k + 1) + "x = " + MK.sig(1 + (k + 1) * x, 8) + "\\ \\checkmark"]; } },
    { id: "ladder", l: "บันได Rₙ = F₂ₙ₊₁/F₂ₙ", st: "R_n = \\dfrac{F_{2n+1}}{F_{2n}}\\ (R = 1\\,\\Omega),\\quad R_{n+1} = 1 + \\dfrac{R_n}{1 + R_n}", n0: 1, rel: "=",
      L: function (n) { var r = 2; for (var i = 1; i < n; i++) r = 1 + r / (1 + r); return r; }, R: function (n) { return fib(2 * n + 1) / fib(2 * n); }, show: function (n) { return frac(fib(2 * n + 1), fib(2 * n)); },
      gen: ["R_{k+1} = 1 + \\dfrac{\\hlP{F_{2k+1}/F_{2k}}}{1 + \\hlP{F_{2k+1}/F_{2k}}} = \\dfrac{F_{2k} + 2F_{2k+1}}{F_{2k} + F_{2k+1}}", "= \\dfrac{F_{2k+2} + F_{2k+1}}{F_{2k+2}} = \\dfrac{F_{2k+3}}{F_{2k+2}} \\checkmark \\quad (F_{m+1} = F_m + F_{m-1})"],
      num: function (k) { var p = fib(2 * k + 1), q = fib(2 * k); return ["R_{" + (k + 1) + "} = 1 + \\dfrac{\\hlP{" + frac(p, q) + "}}{1 + \\hlP{" + frac(p, q) + "}} = \\dfrac{" + q + " + 2\\cdot" + p + "}{" + q + " + " + p + "} = " + frac(q + 2 * p, q + p), "\\dfrac{F_{" + (2 * k + 3) + "}}{F_{" + (2 * k + 2) + "}} = " + frac(fib(2 * k + 3), fib(2 * k + 2)) + "\\ \\checkmark"]; } }
  ];
  // syntactic check: built only from numbers, the variable, + − ×, division by a constant, and non-negative integer powers
  function isPolyAST(n) {
    switch (n.t) {
      case "num": case "var": case "const": return true;
      case "neg": return isPolyAST(n.a);
      case "bin":
        if (n.op === "+" || n.op === "-" || n.op === "*") return isPolyAST(n.a) && isPolyAST(n.b);
        if (n.op === "/") return isPolyAST(n.a) && !usesVar(n.b, "n") && !usesVar(n.b, "k");
        if (n.op === "^") return isPolyAST(n.a) && n.b.t === "num" && n.b.v >= 0 && n.b.v === Math.round(n.b.v);
        return false;
    }
    return false;
  }
  function finiteDiffDegree(vals) {
    // degree of the polynomial that fits integer samples (or -1 when not a polynomial of degree ≤ 12)
    var d = vals.slice();
    for (var deg = 0; deg <= 12; deg++) {
      var scale = Math.max(1, Math.max.apply(null, d.map(Math.abs)));
      if (d.every(function (v) { return Math.abs(v) < 1e-7 * scale; })) return deg - 1;
      var nd = []; for (var i = 1; i < d.length; i++) nd.push(d[i] - d[i - 1]); d = nd;
      if (d.length < 3) break;
    }
    return -2;
  }
  function initCheck(box) {
    var st = { pre: box.dataset.preset || "sum-k", N: 12, k: 5, x: 0.05, f: "k^2", g: "n(n+1)(2n+1)/6", c0: 1 };
    box.innerHTML = '<div class="lap-chips ic-pre">' + IN_PRE.map(function (p) { return '<button type="button" class="lap-chip" data-p="' + p.id + '">' + p.l + "</button>"; }).join("") + '<button type="button" class="lap-chip" data-p="custom">✎ สูตรผลบวกของฉัน</button></div>' +
      '<div class="ic-custom"><div class="lap-row"><label class="lap-lbl">Σ พจน์ f(k) =</label><input class="lap-in" data-in="f" spellcheck="false" aria-label="term f(k)"><label class="lap-lbl">เริ่ม k =</label><input class="lap-in sm" data-in="c0" aria-label="first k"></div><div class="lap-row"><label class="lap-lbl">สูตรที่อ้าง g(n) =</label><input class="lap-in" data-in="g" spellcheck="false" aria-label="claimed closed form g(n)"></div></div>' +
      '<div class="lap-eq ic-eq"></div>' + slider("N", "ตรวจ P(n) ถึง n₀ +", 4, 30, 1, st.N) +
      '<div class="ic-bern">' + slider("x", "ค่า x ในอสมการเบอร์นูลลี", -1, 2, 0.01, st.x) + "</div>" +
      '<div class="ic-table"></div><div class="ic-step"></div>';
    var eq = box.querySelector(".ic-eq"), tab = box.querySelector(".ic-table"), stepEl = box.querySelector(".ic-step");
    function relOk(P, l, r) {
      if (P.rel === "=") return Math.abs(l - r) <= 1e-9 * Math.max(1, Math.abs(r));
      if (P.rel === ">") return l > r;
      if (P.rel === "≥") return l >= r - 1e-12 * Math.max(1, Math.abs(r));
      if (P.rel === "|") return l % r === (typeof l === "bigint" ? big(0) : 0);
      return false;
    }
    function draw() {
      $$("[data-p]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-p") === st.pre); });
      var P = IN_PRE.filter(function (p) { return p.id === st.pre; })[0];
      box.querySelector(".ic-custom").hidden = !!P;
      box.querySelector(".ic-bern").hidden = !(P && P.id === "bern");
      if (!P) return drawCustom();
      MK.tex(eq, "P(n):\\ " + P.st + ",\\qquad n \\ge " + P.n0, true);
      var rows = "", allOk = true;
      for (var n = P.n0; n <= P.n0 + st.N; n++) {
        var l = P.L(n, st.x), r = P.R(n, st.x), ok = relOk(P, l, r);
        allOk = allOk && ok;
        var shL = P.rel === "|" ? String(l) : P.show ? T(P.show(n), false) : fmt(l, 10), shR = P.rel === "|" ? (ok ? "= " + r + " × " + (l / r) : "เหลือเศษ " + (l % r)) : P.show ? T(P.show(n), false) : fmt(r, 10);
        rows += '<tr class="' + (ok ? "in" : "") + '"><td>' + n + "</td><td>" + shL + "</td><td>" + (P.rel === "|" ? "" : ok ? P.rel : P.rel === "=" ? "≠" : P.rel === ">" ? "≯" : "≱") + "</td><td>" + shR + "</td><td>" + (ok ? "✓" : "✗") + "</td></tr>";
      }
      var before = "";
      if (P.n0 > 1) { // show why the statement starts later
        var badList = []; for (var m = 1; m < P.n0; m++) if (!relOk(P, P.L(m, st.x), P.R(m, st.x))) badList.push(m);
        before = badList.length ? '<p class="lap-note">ก่อน n₀: n = ' + badList.join(", ") + " ไม่จริง กรณีฐานจึงต้องเริ่มที่ n = " + P.n0 + " (ขั้นอุปนัยด้านล่างใช้ได้เมื่อ k ≥ " + P.n0 + ")</p>" : "";
      }
      tab.innerHTML = before + '<div class="table-wrap"><table class="lap-pt ic-tab"><thead><tr><th>n</th><th>' + (P.rel === "|" ? "ค่า" : "ซ้าย") + "</th><th></th><th>" + (P.rel === "|" ? "หารด้วย " + P.R(1) : "ขวา") + "</th><th>P(n)</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
        '<p class="lap-help">' + (allOk ? "จริงครบทุกแถว — แต่การตรวจ " + (st.N + 1) + " ค่ายังไม่ใช่บทพิสูจน์ (ดูตัวอย่าง n² + n + 41) ต้องมีขั้นอุปนัยด้านล่าง" : "มีแถวที่ไม่จริง: ข้อความนี้ใช้ไม่ได้ทุก n") + "</p>";
      var kmax = P.n0 + 25, k = Math.min(Math.max(st.k, P.n0), kmax);
      stepEl.innerHTML = '<p class="lap-bh">ขั้นอุปนัย: สมมติ P(k) จริง แล้วแสดงว่า P(k + 1) จริง</p><div class="lap-eq">' + P.gen.map(function (g) { return T(g, true); }).join("") + "</div>" +
        '<label class="lap-row cl-sl"><span class="lap-lbl">ลองแทนตัวเลข k =</span><input type="range" data-kk min="' + P.n0 + '" max="' + kmax + '" step="1" value="' + k + '"><output>' + k + "</output></label>" +
        '<div class="lap-ans">' + P.num(k, st.x).map(function (g, i, all) {
          var pre = P.rel === "=" && all.length === 2 ? (i === 0 ? "\\text{ซ้ายของ } P(" + (k + 1) + "):\\quad " : "\\text{ขวาของ } P(" + (k + 1) + "):\\quad ") : "";
          return T(pre + g, true);
        }).join("") + "</div>" +
        '<p class="lap-help"><span class="hl-p">สีน้ำเงิน</span> = จุดที่ใช้สมมติฐานการอุปนัย P(k) · ตัวเลขช่วยให้เห็นว่าแต่ละบรรทัดทำอะไร แต่บทพิสูจน์จริงคือบรรทัดตัวแปร k ด้านบน ซึ่งใช้ได้กับทุก k</p>';
      var rk = stepEl.querySelector("[data-kk]");
      rk.addEventListener("input", function () { st.k = +rk.value; draw(); });
    }
    function drawCustom() {
      var fc, gc, c0;
      try { fc = compile(st.f, ["k"], { k: "k" }); gc = compile(st.g, ["n"], { n: "n" }); c0 = Math.round(num(st.c0)); }
      catch (e) { tab.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; stepEl.innerHTML = ""; return; }
      MK.tex(eq, "P(n):\\ \\sum_{k=" + c0 + "}^{n} " + fc.tex + " = " + gc.tex, true);
      var F = function (k) { return fc.fn({ k: k }); }, G = function (n) { return gc.fn({ n: n }); };
      var tol = function (v) { return 1e-9 * Math.max(1, Math.abs(v)); };
      var baseOk = Math.abs(G(c0) - F(c0)) <= tol(F(c0));
      var rows = "", s = 0, firstBad = null;
      for (var n = c0; n <= c0 + st.N; n++) {
        s += F(n); var g = G(n), ok = Math.abs(s - g) <= tol(g);
        if (!ok && firstBad === null) firstBad = n;
        rows += '<tr class="' + (ok ? "in" : "") + '"><td>' + n + "</td><td>" + fmt(s, 10) + "</td><td>" + (ok ? "=" : "≠") + "</td><td>" + fmt(g, 10) + "</td><td>" + (ok ? "✓" : "✗") + "</td></tr>";
      }
      var stepFails = [];
      for (var k = c0; k < c0 + 60; k++) { var dlt = G(k + 1) - G(k) - F(k + 1); if (!(Math.abs(dlt) <= tol(G(k + 1)))) stepFails.push(k); }
      var gs = [], fs = []; for (var q = 0; q < 26; q++) { gs.push(G(c0 + q)); fs.push(F(c0 + q)); }
      var dg = finiteDiffDegree(gs), df = finiteDiffDegree(fs);
      var polyOK = isPolyAST(gc.tree) && isPolyAST(fc.tree) && dg >= 0 && df >= -1 && Math.max(dg, df) < 60;
      tab.innerHTML = '<div class="table-wrap"><table class="lap-pt ic-tab"><thead><tr><th>n</th><th>ผลบวกจริง</th><th></th><th>g(n)</th><th>P(n)</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
      var verdict;
      if (!baseOk) verdict = flag(false, "กรณีฐานไม่จริง: g(" + c0 + ") = " + fmt(G(c0), 8) + " แต่พจน์แรก = " + fmt(F(c0), 8)) + (stepFails.length ? "" : flag(true, "ขั้นอุปนัยผ่านครบ 60 ค่า — แต่ไม่มีโดมิโนตัวแรก"));
      else if (stepFails.length) verdict = flag(false, "ขั้นอุปนัยไม่จริงที่ k = " + stepFails.slice(0, 5).join(", ") + (stepFails.length > 5 ? ", …" : "") + ": g(k+1) − g(k) ≠ f(k+1)");
      else if (polyOK) verdict = flag(true, "พิสูจน์แล้ว ✓ (มีใบรับรองพหุนาม)");
      else verdict = flag(true, "ผ่านการตรวจเชิงตัวเลข 60 ค่า (ยังไม่ใช่บทพิสูจน์)");
      stepEl.innerHTML = '<div class="lap-row">' + verdict + '</div><div class="lap-eq">' + T("\\text{ขั้นอุปนัยของสูตรผลบวก}\\iff g(k+1) - g(k) = f(k+1)", true) + "</div>" +
        '<p class="lap-note">' + (baseOk && !stepFails.length ? (polyOK ? "g(n) เป็นพหุนามดีกรี " + dg + " และ f(k) เป็นพหุนามดีกรี " + Math.max(df, 0) + " ผลต่าง g(k+1) − g(k) − f(k+1) จึงเป็นพหุนามดีกรีไม่เกิน " + Math.max(dg, df) + " ที่เป็นศูนย์ครบ 60 ค่า พหุนามที่ไม่ใช่ศูนย์มีรากได้ไม่เกินดีกรีของมัน ผลต่างจึงเป็นศูนย์ทุก k: ขั้นอุปนัยจริงทุก k และพร้อมกรณีฐาน สูตรจึงจริงทุก n ≥ " + c0 : "ตรวจ g(k+1) − g(k) = f(k+1) ผ่าน 60 ค่า แต่ f หรือ g ไม่ได้เขียนเป็นพหุนาม (มีเลขชี้กำลังเป็นตัวแปร การหารด้วยตัวแปร หรือฟังก์ชันอื่น) การตรวจตัวเลขจึงเป็นแค่หลักฐาน ต้องจัดรูปพีชคณิตพิสูจน์เอง") :
          "แก้สูตรแล้วกด Enter ลองตัวอย่างผิด เช่น g(n) = (n^2+n+2)/2 กับ f(k) = k: ขั้นอุปนัยผ่านแต่กรณีฐานพัง") + "</p>";
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); draw(); } });
    $$(".ic-custom .lap-in", box).forEach(function (inp) {
      var k = inp.getAttribute("data-in"); inp.value = st[k];
      var go = function () { st[k] = inp.value; draw(); };
      inp.addEventListener("change", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    bindSliders(box, st, draw);
    box._set = function (id) { st.pre = id; draw(); };
    draw();
  }

  // ======================================================================= 6. find the flaw
  var FLAWS = [
    { id: "horses", l: "ม้าทุกตัวสีเดียวกัน", claim: "“ม้าทุกกลุ่มที่มี n ตัว มีสีเดียวกัน” สำหรับทุก \\(n \\ge 1\\)",
      lines: ["กรณีฐาน \\(n = 1\\): ม้าตัวเดียวย่อมมีสีเดียว จริง", "สมมติว่าม้าทุกกลุ่มที่มี \\(k\\) ตัว มีสีเดียวกัน", "ม้า \\(k + 1\\) ตัว: เอาตัวสุดท้ายออก เหลือ \\(k\\) ตัว จึงสีเดียวกันตามสมมติฐาน", "เอาตัวแรกออกแทน เหลือ \\(k\\) ตัว ก็สีเดียวกันเช่นกัน", "สองกลุ่มนี้มีม้าตัวกลางร่วมกัน ทุกตัวจึงสีเดียวกับม้าตัวกลาง", "สรุป: ม้าทุกตัวในโลกสีเดียวกัน"],
      bad: 4, why: "บรรทัดที่ 5 ใช้ไม่ได้เมื่อ \\(k = 1\\): ม้า 2 ตัว กลุ่มแรกคือ {ตัวที่ 1} กลุ่มที่สองคือ {ตัวที่ 2} ไม่มีตัวกลางร่วมกันเลย ขั้นอุปนัยจึงพังที่ P(1) ⇒ P(2) โดมิโนตัวที่สองไม่ล้ม บทเรียน: ขั้นอุปนัยต้องจริงสำหรับ<b>ทุก</b> \\(k \\ge n_0\\) รวม k ที่เล็กที่สุดด้วย" },
    { id: "nobase", l: "ลืมกรณีฐาน", claim: "\\(1 + 2 + \\cdots + n = \\dfrac{n^2 + n + 2}{2}\\) สำหรับทุก \\(n \\ge 1\\)",
      lines: ["สมมติว่า \\(1 + 2 + \\cdots + k = \\dfrac{k^2 + k + 2}{2}\\)", "บวก \\(k + 1\\) ทั้งสองข้าง: \\(1 + \\cdots + (k+1) = \\dfrac{k^2 + k + 2}{2} + (k + 1)\\)", "\\(= \\dfrac{k^2 + 3k + 4}{2} = \\dfrac{(k+1)^2 + (k+1) + 2}{2}\\)", "ดังนั้น P(k) ⇒ P(k+1) จริงทุก \\(k\\)", "สรุป: สูตรจริงทุก \\(n \\ge 1\\)"],
      bad: 4, why: "พีชคณิตทุกบรรทัดถูก แต่ไม่เคยตรวจกรณีฐาน ที่ \\(n = 1\\): ซ้าย = 1 ขวา = \\(\\tfrac{1 + 1 + 2}{2} = 2\\) ไม่จริง ข้อสรุปในบรรทัดสุดท้ายจึงไม่มีอะไรรองรับ เหมือนแถวโดมิโนที่ตั้งชิดกันดีแต่ไม่มีใครผลักตัวแรก (สูตรจริงคือ \\(n(n+1)/2\\) ต่างกันอยู่ 1 ทุก n)" },
    { id: "power", l: "aⁿ = 1 ทุก n (แบบเข้ม)", claim: "สำหรับ \\(a \\ne 0\\) ใด ๆ \\(a^n = 1\\) ทุก \\(n \\ge 0\\) (ใช้อุปนัยแบบเข้ม)",
      lines: ["กรณีฐาน \\(n = 0\\): \\(a^0 = 1\\) จริง", "สมมติว่า \\(a^j = 1\\) ทุก \\(0 \\le j \\le k\\)", "\\(a^{k+1} = \\dfrac{a^k\\cdot a^k}{a^{k-1}}\\)", "\\(= \\dfrac{1\\cdot 1}{1} = 1\\) ตามสมมติฐาน", "สรุป: \\(a^n = 1\\) ทุก \\(n\\)"],
      bad: 3, why: "บรรทัดที่ 4 ใช้สมมติฐานกับ \\(a^{k-1}\\) แต่เมื่อ \\(k = 0\\) ตัวนี้คือ \\(a^{-1}\\) ซึ่งไม่อยู่ในช่วง \\(0 \\le j \\le k\\) ของสมมติฐาน ขั้น P(0) ⇒ P(1) จึงพัง อุปนัยแบบเข้มที่ใช้ย้อนไปสองขั้นต้องมีกรณีฐานสองค่า (n = 0 และ n = 1) ซึ่งที่นี่ \\(a^1 = 1\\) ไม่จริง" },
    { id: "prime41", l: "n² + n + 41 เป็นจำนวนเฉพาะ", claim: "\\(n^2 + n + 41\\) เป็นจำนวนเฉพาะทุก \\(n \\ge 0\\)",
      lines: ["\\(n = 0\\): 41 เป็นจำนวนเฉพาะ", "\\(n = 1, 2, 3\\): 43, 47, 53 เป็นจำนวนเฉพาะ", "ตรวจด้วยคอมพิวเตอร์ \\(n = 0\\) ถึง \\(39\\) ได้จำนวนเฉพาะทั้ง 40 ค่า", "รูปแบบชัดเจนมาก จึงสรุปว่าเป็นจำนวนเฉพาะทุก \\(n\\)"],
      bad: 3, why: "ไม่มีขั้นอุปนัยเลย การเห็นรูปแบบ 40 ครั้งไม่ใช่บทพิสูจน์ ที่ \\(n = 40\\): \\(40^2 + 40 + 41 = 1681 = 41^2\\) ไม่เป็นจำนวนเฉพาะ นี่คือเหตุผลที่คณิตศาสตร์ต้องมีอุปนัย ไม่ใช่การอุปมานจากตัวอย่าง (inductive reasoning ในภาษาทั่วไป)" },
    { id: "smallk", l: "2ⁿ > n² ทุก n ≥ 1", claim: "\\(2^n > n^2\\) สำหรับทุก \\(n \\ge 1\\)",
      lines: ["กรณีฐาน \\(n = 1\\): \\(2 > 1\\) จริง", "สมมติว่า \\(2^k > k^2\\)", "\\(2^{k+1} = 2\\cdot 2^k > 2k^2\\)", "และ \\(2k^2 \\ge (k+1)^2\\) จึงได้ \\(2^{k+1} > (k+1)^2\\)", "สรุป: จริงทุก \\(n \\ge 1\\)"],
      bad: 3, why: "\\(2k^2 \\ge (k+1)^2 \\iff k^2 - 2k - 1 \\ge 0\\) ซึ่งจริงเฉพาะ \\(k \\ge 3\\) ที่ \\(k = 1, 2\\) ขั้นนี้พัง และจริง ๆ \\(n = 2, 3, 4\\) ไม่เป็นจริง (\\(4 = 4\\), \\(8 < 9\\), \\(16 = 16\\)) ต้องเริ่มกรณีฐานที่ \\(n = 5\\)" }
  ];
  function initFlaw(box) {
    var st = { pre: box.dataset.preset || "horses", pick: null };
    box.innerHTML = '<div class="lap-chips fl-pre">' + FLAWS.map(function (p) { return '<button type="button" class="lap-chip" data-p="' + p.id + '">' + p.l + "</button>"; }).join("") + "</div>" +
      '<div class="fl-body"></div>';
    var body = box.querySelector(".fl-body");
    function draw() {
      $$("[data-p]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-p") === st.pre); });
      var P = FLAWS.filter(function (p) { return p.id === st.pre; })[0];
      var html = '<p class="fl-claim"><b>ข้อความ:</b> ' + rich(P.claim) + '</p><p class="lap-help">“บทพิสูจน์” ด้านล่างมีบรรทัดที่ผิดหนึ่งบรรทัด คลิกบรรทัดที่คิดว่าผิด</p><ol class="fl-lines">';
      P.lines.forEach(function (l, i) {
        var cls = st.pick === null ? "" : i === P.bad ? " bad" : i === st.pick ? " wrong" : "";
        html += '<li><button type="button" class="fl-line' + cls + '" data-i="' + i + '">' + rich(l) + "</button></li>";
      });
      html += "</ol>";
      if (st.pick !== null) html += '<div class="fl-why ' + (st.pick === P.bad ? "ok" : "no") + '"><b>' + (st.pick === P.bad ? "ถูกต้อง! " : "ยังไม่ใช่ บรรทัดที่ผิดคือบรรทัดที่ " + (P.bad + 1) + " · ") + "</b>" + rich(P.why) + '</div><button type="button" class="btn btn-ghost btn-sm" data-again>↺ ลองใหม่</button>';
      body.innerHTML = html;
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (b) { st.pre = b.getAttribute("data-p"); st.pick = null; draw(); return; }
      var l = e.target.closest("[data-i]"); if (l && st.pick === null) { st.pick = +l.getAttribute("data-i"); draw(); return; }
      if (e.target.closest("[data-again]")) { st.pick = null; draw(); }
    });
    box._set = function (id) { st.pre = id; st.pick = null; draw(); };
    draw();
  }

  // ======================================================================= boot + page buttons
  var INIT = { "sq-lab": initSeq, "sq-test": initTest, "sq-taylor": initTaylor, "in-domino": initDomino, "in-check": initCheck, "in-flaw": initFlaw };
  function target(cls, b, attr) {
    var id = b.getAttribute(attr);
    return id ? document.getElementById(id) : document.querySelector("." + cls);
  }
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls).forEach(function (box) {
        if (box.__sq) return; box.__sq = true;
        box.classList.add("cl-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">แล็บโหลดไม่สำเร็จ: ' + esc(e.message) + "</p>"; if (root.console) console.error(e); }
      });
    });
    document.addEventListener("click", function (e) {
      var b, box;
      if ((b = e.target.closest("[data-sq-set]"))) { box = target("sq-lab", b, "data-sq-target"); if (box && box._set) { box._set(JSON.parse(b.getAttribute("data-sq-set"))); box.scrollIntoView({ behavior: "smooth", block: "start" }); } }
      else if ((b = e.target.closest("[data-sqt]"))) { box = target("sq-test", b, "data-sqt-target"); if (box && box._set) { box._set(b.getAttribute("data-sqt")); box.scrollIntoView({ behavior: "smooth", block: "start" }); } }
      else if ((b = e.target.closest("[data-ty-set]"))) { box = target("sq-taylor", b, "data-ty-target"); if (box && box._set) { box._set(JSON.parse(b.getAttribute("data-ty-set"))); box.scrollIntoView({ behavior: "smooth", block: "start" }); } }
      else if ((b = e.target.closest("[data-in-preset]"))) { box = target("in-check", b, "data-in-target"); if (box && box._set) { box._set(b.getAttribute("data-in-preset")); box.scrollIntoView({ behavior: "smooth", block: "start" }); } }
      else if ((b = e.target.closest("[data-flaw]"))) { box = target("in-flaw", b, "data-flaw-target"); if (box && box._set) { box._set(b.getAttribute("data-flaw")); box.scrollIntoView({ behavior: "smooth", block: "start" }); } }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
