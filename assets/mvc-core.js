/* MVC — multivariable & vector calculus engine for /learn/multivariable-calculus/ (no dependencies, no eval).
   window.MVC in the browser, module.exports in Node (tests: scripts/test-mvc.mjs).
   Expressions:  MVC.parse("x^2*y + sin(x*y)", ["x","y"])  → AST   (implicit products 2x, xy, 3sin(y), (x+1)(x-1) work; log = ln)
                 MVC.fn(src, vars) → { f(x,y,…), ast, tex, vars }          compiled closure tree
                 MVC.d(ast, "x")   → ∂/∂x as a simplified AST            MVC.tex(ast) → TeX
   Vector calculus: MVC.grad, MVC.div, MVC.curl, MVC.curl2, MVC.lap       (symbolic, on component ASTs)
   Numerics: quad (Gauss–Legendre with a cosine map so √-type endpoints converge), quad2, quad3, contours (marching squares),
             curve (T N B κ τ), lineInt, lineScalar, surfFlux, surfArea, critical points, gradient descent.
   Every number quoted in the lessons was cross-checked with sympy/scipy (scripts/test-mvc.mjs). */
(function (root) {
  "use strict";
  var MVC = {};
  var PI = Math.PI;

  /* ================================================================== AST + smart constructors */
  function Num(v) { return { t: "num", v: v }; }
  function Var(n) { return { t: "var", n: n }; }
  function Const(n) { return { t: "const", n: n, v: n === "pi" ? PI : Math.E }; }
  var isNum = function (a, v) { return a.t === "num" && (v === undefined || a.v === v); };
  function key(a) {
    switch (a.t) {
      case "num": return "#" + a.v;
      case "var": return "$" + a.n;
      case "const": return "@" + a.n;
      case "neg": return "-(" + key(a.a) + ")";
      case "fn": return a.n + "(" + a.a.map(key).join(",") + ")";
      default: return a.t[0] + "(" + key(a.a) + "," + key(a.b) + ")";
    }
  }
  var same = function (a, b) { return key(a) === key(b); };
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  var isInt = function (a) { return a.t === "num" && Math.abs(a.v - Math.round(a.v)) < 1e-12; };

  function Neg(a) {
    if (a.t === "num") return Num(-a.v);
    if (a.t === "neg") return a.a;
    return { t: "neg", a: a };
  }
  function Add(a, b) {
    if (isNum(a, 0)) return b;
    if (isNum(b, 0)) return a;
    if (a.t === "num" && b.t === "num") return Num(a.v + b.v);
    if (b.t === "neg") return Sub(a, b.a);
    if (b.t === "num" && b.v < 0) return Sub(a, Num(-b.v));
    if (a.t === "neg") return Sub(b, a.a);
    return { t: "add", a: a, b: b };
  }
  function Sub(a, b) {
    if (isNum(b, 0)) return a;
    if (isNum(a, 0)) return Neg(b);
    if (a.t === "num" && b.t === "num") return Num(a.v - b.v);
    if (b.t === "neg") return Add(a, b.a);
    if (b.t === "num" && b.v < 0) return Add(a, Num(-b.v));
    if (same(a, b)) return Num(0);
    return { t: "sub", a: a, b: b };
  }
  // product: flatten, fold numbers, merge equal bases, put number first then variables then other factors
  function mulFactors(n, out) { if (n.t === "mul") { mulFactors(n.a, out); mulFactors(n.b, out); } else out.push(n); }
  function baseExp(f) { return f.t === "pow" && f.b.t === "num" ? [f.a, f.b.v] : [f, 1]; }
  function rank(f) {
    var b = baseExp(f)[0];
    if (f.t === "num") return 0;
    if (b.t === "var") return 1;
    if (b.t === "const") return 1.5;
    if (b.t === "add" || b.t === "sub") return 2;
    return 3;
  }
  function Mul(a, b) {
    if (isNum(a, 0) || isNum(b, 0)) return Num(0);
    if (isNum(a, 1)) return b;
    if (isNum(b, 1)) return a;
    if (a.t === "neg") return Neg(Mul(a.a, b));
    if (b.t === "neg") return Neg(Mul(a, b.a));
    if (a.t === "div") return Div(Mul(a.a, b), a.b);
    if (b.t === "div") return Div(Mul(a, b.a), b.b);
    var fs = [];
    mulFactors(a, fs); mulFactors(b, fs);
    var c = 1, rest = [];
    fs.forEach(function (f) {
      if (f.t === "num") { c *= f.v; return; }
      var be = baseExp(f), k = key(be[0]), hit = null;
      if (be[0].t !== "num") for (var i = 0; i < rest.length; i++) if (rest[i].k === k) { hit = rest[i]; break; }
      if (hit) hit.e += be[1]; else rest.push({ k: k, b: be[0], e: be[1], o: f });
    });
    if (c === 0) return Num(0);
    var list = rest.filter(function (r) { return r.e !== 0; }).map(function (r) { return r.e === 1 ? (r.o.t === "pow" && r.o.b.t === "num" ? r.b : r.o) : Pow(r.b, Num(r.e)); });
    list = list.map(function (f, i) { return { f: f, i: i }; }).sort(function (p, q) {
      var rp = rank(p.f), rq = rank(q.f);
      if (rp !== rq) return rp - rq;
      if (rp === 1) { var np = baseExp(p.f)[0].n, nq = baseExp(q.f)[0].n; if (np !== nq) return np < nq ? -1 : 1; }
      return p.i - q.i;
    }).map(function (p) { return p.f; });
    var neg = c < 0; c = Math.abs(c);
    if (c !== 1 || !list.length) list.unshift(Num(c));
    var out = list[0];
    for (var j = 1; j < list.length; j++) out = { t: "mul", a: out, b: list[j] };
    return neg ? Neg(out) : out;
  }
  function splitCoef(n) {
    var fs = []; mulFactors(n, fs);
    return fs[0].t === "num" ? { c: fs[0].v, rest: fs.slice(1) } : { c: 1, rest: fs };
  }
  function prod(list) { var o = Num(1); list.forEach(function (f) { o = Mul(o, f); }); return o; }
  function Div(a, b) {
    if (isNum(a, 0)) return Num(0);
    if (isNum(b, 1)) return a;
    if (a.t === "neg") return Neg(Div(a.a, b));
    if (b.t === "neg") return Neg(Div(a, b.a));
    if (a.t === "num" && b.t === "num") {
      if (isInt(a) && isInt(b)) {
        var g = gcd(a.v, b.v), p = a.v / g, q = b.v / g;
        if (q < 0) { p = -p; q = -q; }
        if (p < 0) return Neg(Div(Num(-p), Num(q)));
        return q === 1 ? Num(p) : { t: "div", a: Num(p), b: Num(q) };
      }
      return Num(a.v / b.v);
    }
    if (a.t === "div") return Div(a.a, Mul(a.b, b));
    if (b.t === "div") return Div(Mul(a, b.b), b.a);
    if (same(a, b)) return Num(1);
    // cancel numeric content: (6x)/(4) → (3x)/2 ;  2x/(2√u) → x/√u
    var A = splitCoef(a), Bc = splitCoef(b);
    if (Number.isInteger(A.c) && Number.isInteger(Bc.c) && A.c !== 0) {
      var g2 = gcd(A.c, Bc.c);
      if (g2 > 1) {
        var na = Mul(Num(A.c / g2), prod(A.rest)), nb = Mul(Num(Bc.c / g2), prod(Bc.rest));
        return isNum(nb, 1) ? na : { t: "div", a: na, b: nb };
      }
    }
    return { t: "div", a: a, b: b };
  }
  function Pow(a, b) {
    if (isNum(b, 0)) return Num(1);
    if (isNum(b, 1)) return a;
    if (isNum(a, 1)) return Num(1);
    if (a.t === "num" && b.t === "num") { var v = Math.pow(a.v, b.v); if (isFinite(v)) return Num(v); }
    if (a.t === "pow" && a.b.t === "num" && b.t === "num" && Number.isInteger(a.b.v) && Number.isInteger(b.v)) return Pow(a.a, Num(a.b.v * b.v));
    return { t: "pow", a: a, b: b };
  }
  function Fn(n, args) {
    var a = args[0];
    if (args.length === 1) {
      if (a.t === "num") {
        var v = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, atan: Math.atan, asin: Math.asin, acos: Math.acos }[n];
        if (v) { var r = v(a.v); if (isFinite(r) && (Math.abs(r - Math.round(r)) < 1e-12 || n === "sqrt" && false)) return Num(Math.round(r)); }
      }
      if (n === "ln" && a.t === "const" && a.n === "e") return Num(1);
      if (n === "exp" && a.t === "fn" && a.n === "ln") return a.a[0];
      if (n === "ln" && a.t === "fn" && a.n === "exp") return a.a[0];
      if (n === "abs" && a.t === "neg") return Fn("abs", [a.a]);
    }
    return { t: "fn", n: n, a: args };
  }
  MVC.Num = Num; MVC.Var = Var; MVC.Add = Add; MVC.Sub = Sub; MVC.Mul = Mul; MVC.Div = Div; MVC.Pow = Pow; MVC.Neg = Neg; MVC.Fn = Fn;

  /* ================================================================== tokenizer + parser */
  var FN1 = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: function (v) { return 1 / Math.cos(v); }, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log10: Math.log10,
    sqrt: Math.sqrt, abs: Math.abs, sign: Math.sign
  };
  var FN2 = { atan2: Math.atan2, min: Math.min, max: Math.max };
  var ALIAS = { log: "ln", sgn: "sign", arcsin: "asin", arccos: "acos", arctan: "atan", ln: "ln" };
  var GREEK = { "π": "pi", "θ": "theta", "φ": "phi", "ρ": "rho", "ω": "omega", "α": "alpha", "β": "beta", "λ": "lambda", "μ": "mu", "σ": "sigma" };

  function err(msg, pos) { var e = new Error(msg); e.pos = pos; return e; }
  function tokenize(src) {
    var s = String(src).replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/\*\*/g, "^").replace(/[π θφρωαβλμσ]/g, function (c) { return c === " " ? " " : " " + GREEK[c] + " "; });
    var out = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        var m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
        if (!m) throw err("ตัวเลขไม่ถูกต้อง", i);
        out.push({ k: "num", v: parseFloat(m[0]), p: i }); i += m[0].length; continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        var w = s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)[0];
        out.push({ k: "id", v: w, p: i }); i += w.length; continue;
      }
      if ("+-*/^(),[]".indexOf(ch) >= 0) { out.push({ k: ch === "[" ? "(" : ch === "]" ? ")" : ch, p: i }); i++; continue; }
      throw err("ไม่รู้จักเครื่องหมาย “" + ch + "”", i);
    }
    out.push({ k: "end", p: s.length });
    return out;
  }

  // split a run of letters such as "xy", "xsin", "pix" into known names (greedy longest first)
  function splitWord(w, names) {
    if (names[w]) return [w];
    var memo = {};
    function go(i) {
      if (i === w.length) return [];
      if (memo[i] !== undefined) return memo[i];
      var best = null;
      for (var j = w.length; j > i; j--) {
        var piece = w.slice(i, j);
        if (names[piece]) { var r = go(j); if (r) { var cand = [piece].concat(r); if (!best || cand.length < best.length) best = cand; } }
      }
      return (memo[i] = best);
    }
    return go(0);
  }

  function parse(src, vars) {
    vars = vars || ["x"];
    var names = {};
    vars.forEach(function (v) { names[v] = "var"; });
    ["pi", "e"].forEach(function (c) { if (!names[c]) names[c] = "const"; });
    Object.keys(FN1).concat(Object.keys(FN2), Object.keys(ALIAS)).forEach(function (f) { if (!names[f]) names[f] = "fn"; });
    // isolated Greek letters mapped to the variable names the page declared
    var tk = tokenize(src), toks = [];
    tk.forEach(function (t) {
      if (t.k !== "id") { toks.push(t); return; }
      var lw = t.v;
      if (!names[lw] && names[lw.toLowerCase()] && lw.length > 1) lw = lw.toLowerCase();
      var parts = splitWord(lw, names);
      if (!parts) throw err("ไม่รู้จัก “" + t.v + "” (ตัวแปรที่ใช้ได้: " + vars.join(", ") + ")", t.p);
      parts.forEach(function (p, i) {
        if (i > 0) toks.push({ k: "*", p: t.p, implicit: true });
        toks.push({ k: "id", v: p, p: t.p });
      });
    });
    var i = 0;
    var peek = function () { return toks[i]; };
    function eat(k) { if (toks[i].k !== k) throw err(k === ")" ? "วงเล็บไม่ครบ" : "คาดว่าจะเป็น “" + k + "”", toks[i].p); return toks[i++]; }
    function expr() {
      var n = term();
      while (peek().k === "+" || peek().k === "-") { var op = toks[i++].k; var r = term(); n = op === "+" ? Add(n, r) : Sub(n, r); }
      return n;
    }
    function startsAtom(t) { return t.k === "num" || t.k === "id" || t.k === "("; }
    function term() {
      var n = unary();
      for (;;) {
        var t = peek();
        if (t.k === "*") { i++; n = Mul(n, unary()); }
        else if (t.k === "/") { i++; n = Div(n, unary()); }
        else if (startsAtom(t)) { n = Mul(n, power()); }
        else break;
      }
      return n;
    }
    function unary() {
      if (peek().k === "-") { i++; return Neg(unary()); }
      if (peek().k === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var base = atom();
      if (peek().k === "^") {
        i++;
        var neg = false;
        if (peek().k === "-") { i++; neg = true; } else if (peek().k === "+") i++;
        var ex = power();
        return Pow(base, neg ? Neg(ex) : ex);
      }
      return base;
    }
    function atom() {
      var t = toks[i];
      if (t.k === "num") { i++; return Num(t.v); }
      if (t.k === "(") { i++; var e = expr(); eat(")"); return e; }
      if (t.k === "id") {
        i++;
        var kind = names[t.v];
        if (kind === "var") return Var(t.v);
        if (kind === "const") return Const(t.v);
        var nm = ALIAS[t.v] || t.v;
        if (peek().k !== "(") throw err("ฟังก์ชัน " + t.v + " ต้องมีวงเล็บ เช่น " + t.v + "(x)", t.p);
        eat("(");
        var args = [expr()];
        while (peek().k === ",") { i++; args.push(expr()); }
        eat(")");
        if (FN2[nm]) { if (args.length !== 2) throw err(nm + " ต้องมี 2 อาร์กิวเมนต์", t.p); return Fn(nm, args); }
        if (args.length !== 1) throw err(nm + " รับอาร์กิวเมนต์เดียว", t.p);
        return Fn(nm, args);
      }
      if (t.k === "end") throw err("นิพจน์ไม่สมบูรณ์", t.p);
      throw err("ตำแหน่งนี้ไม่ควรมี “" + t.k + "”", t.p);
    }
    var ast = expr();
    if (peek().k !== "end") throw err("เหลือส่วนที่อ่านไม่ออก: “" + (peek().v !== undefined ? peek().v : peek().k) + "”", peek().p);
    return ast;
  }

  /* ================================================================== derivative */
  function dep(a, v) {
    switch (a.t) {
      case "num": case "const": return false;
      case "var": return a.n === v;
      case "neg": return dep(a.a, v);
      case "fn": return a.a.some(function (x) { return dep(x, v); });
      default: return dep(a.a, v) || dep(a.b, v);
    }
  }
  MVC.depends = dep;
  function minus1(w) {
    if (w.t === "num") return Num(w.v - 1);
    if (w.t === "div" && w.a.t === "num" && w.b.t === "num") return Div(Num(w.a.v - w.b.v), w.b);
    if (w.t === "neg" && w.a.t === "div" && w.a.a.t === "num" && w.a.b.t === "num") return Neg(Div(Num(w.a.a.v + w.a.b.v), w.a.b));
    return Sub(w, Num(1));
  }
  function d(a, v) {
    if (!dep(a, v)) return Num(0);
    switch (a.t) {
      case "var": return Num(1);
      case "neg": return Neg(d(a.a, v));
      case "add": return Add(d(a.a, v), d(a.b, v));
      case "sub": return Sub(d(a.a, v), d(a.b, v));
      case "mul": return Add(Mul(d(a.a, v), a.b), Mul(a.a, d(a.b, v)));
      case "div": {
        var da = d(a.a, v), db = d(a.b, v);
        if (isNum(db, 0)) return Div(da, a.b);
        if (isNum(da, 0)) return Neg(Div(Mul(a.a, db), Pow(a.b, Num(2))));
        return Div(Sub(Mul(da, a.b), Mul(a.a, db)), Pow(a.b, Num(2)));
      }
      case "pow": {
        var u = a.a, w = a.b;
        if (!dep(w, v)) return Mul(Mul(w, Pow(u, minus1(w))), d(u, v));
        if (!dep(u, v)) return Mul(Mul(a, u.t === "const" && u.n === "e" ? Num(1) : Fn("ln", [u])), d(w, v));
        return Mul(a, Add(Mul(d(w, v), Fn("ln", [u])), Div(Mul(w, d(u, v)), u)));
      }
      case "fn": {
        var n = a.n, x = a.a[0], p;
        if (n === "atan2") {
          var y1 = a.a[0], x1 = a.a[1];
          return Div(Sub(Mul(x1, d(y1, v)), Mul(y1, d(x1, v))), Add(Pow(x1, Num(2)), Pow(y1, Num(2))));
        }
        if (n === "min" || n === "max") throw err("ไม่รองรับการหาอนุพันธ์ของ " + n);
        switch (n) {
          case "sin": p = Fn("cos", [x]); break;
          case "cos": p = Neg(Fn("sin", [x])); break;
          case "tan": p = Pow(Fn("sec", [x]), Num(2)); break;
          case "sec": p = Mul(Fn("sec", [x]), Fn("tan", [x])); break;
          case "exp": p = a; break;
          case "ln": p = Div(Num(1), x); break;
          case "log10": p = Div(Num(1), Mul(x, Fn("ln", [Num(10)]))); break;
          case "sqrt": p = Div(Num(1), Mul(Num(2), a)); break;
          case "abs": p = Fn("sign", [x]); break;
          case "sign": return Num(0);
          case "asin": p = Div(Num(1), Fn("sqrt", [Sub(Num(1), Pow(x, Num(2)))])); break;
          case "acos": p = Neg(Div(Num(1), Fn("sqrt", [Sub(Num(1), Pow(x, Num(2)))]))); break;
          case "atan": p = Div(Num(1), Add(Num(1), Pow(x, Num(2)))); break;
          case "sinh": p = Fn("cosh", [x]); break;
          case "cosh": p = Fn("sinh", [x]); break;
          case "tanh": p = Div(Num(1), Pow(Fn("cosh", [x]), Num(2))); break;
          default: throw err("ไม่รู้จักฟังก์ชัน " + n);
        }
        return Mul(p, d(x, v));
      }
    }
    return Num(0);
  }
  MVC.d = d;
  MVC.dd = function (a, v1, v2) { return d(d(a, v1), v2); };

  /* ================================================================== TeX */
  var TEXVAR = { theta: "\\theta", phi: "\\varphi", rho: "\\rho", omega: "\\omega", alpha: "\\alpha", beta: "\\beta", lambda: "\\lambda", mu: "\\mu", sigma: "\\sigma", th: "\\theta", ph: "\\varphi" };
  var TEXFN = { sin: "\\sin", cos: "\\cos", tan: "\\tan", sec: "\\sec", asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", ln: "\\ln", log10: "\\log_{10}", sign: "\\operatorname{sgn}", atan2: "\\operatorname{atan2}", min: "\\min", max: "\\max" };
  function numTex(v) {
    if (Math.abs(v - Math.round(v)) < 1e-12) return String(Math.round(v));
    var s = String(+v.toPrecision(10));
    return /e/.test(s) ? v.toExponential(4).replace(/e\+?(-?)0*(\d+)/, "\\times10^{$1$2}") : s;
  }
  // precedence: 1 add/sub, 2 mul, 3 neg-in-product, 4 pow, 5 atom
  function prec(a) {
    switch (a.t) {
      case "add": case "sub": return 1;
      case "neg": return 1;
      case "mul": return 2;
      case "div": return 5;
      case "pow": return 4;
      case "num": return a.v < 0 ? 1 : 5;
      default: return 5;
    }
  }
  function tex(a, p) {
    p = p || 0;
    var s, q = prec(a);
    switch (a.t) {
      case "num": s = numTex(a.v); break;
      case "var": s = TEXVAR[a.n] || a.n; break;
      case "const": s = a.n === "pi" ? "\\pi" : "e"; break;
      case "neg": s = "-" + tex(a.a, 1.5); q = 1; break;
      case "add": s = tex(a.a, 1) + " + " + tex(a.b, 1.2); break;
      case "sub": s = tex(a.a, 1) + " - " + tex(a.b, 1.2); break;
      case "mul": {
        var fs = []; mulFactors(a, fs);
        s = fs.map(function (f, i) {
          var t = tex(f, 2.1);
          if (i === 0) return t;
          var prev = fs[i - 1];
          var needDot = f.t === "num" || (prev.t === "num" && /^[0-9.]/.test(t)) || (/^[0-9]/.test(t) && prev.t === "num") || (f.t === "pow" && f.a.t === "num");
          return (needDot ? "\\cdot " : (prev.t === "fn" && f.t !== "fn" ? "\\," : f.t === "fn" || (f.t === "pow" && (f.a.t === "fn" || f.a.t === "const")) ? "\\," : "")) + t;
        }).join("");
        break;
      }
      case "div": s = "\\frac{" + tex(a.a) + "}{" + tex(a.b) + "}"; break;
      case "pow": {
        var b = a.a, e = a.b;
        if (b.t === "const" && b.n === "e") { s = "e^{" + tex(e) + "}"; break; }
        if (b.t === "fn" && b.a.length === 1 && TEXFN[b.n] && e.t === "num") {
          var arg = b.a[0];
          s = TEXFN[b.n] + "^{" + tex(e) + "}" + (arg.t === "var" || arg.t === "num" ? " " + tex(arg) : "\\left(" + tex(arg) + "\\right)");
          q = 3; break;
        }
        var bt = (b.t === "var" || b.t === "const" || (b.t === "num" && b.v >= 0) || (b.t === "fn" && (b.n === "sqrt" || b.n === "abs"))) ? tex(b) : "\\left(" + tex(b) + "\\right)";
        s = bt + "^{" + tex(e) + "}";
        break;
      }
      case "fn": {
        var n = a.n, ar = a.a[0];
        if (n === "exp") { s = "e^{" + tex(ar) + "}"; q = 4; break; }
        if (n === "sqrt") { s = "\\sqrt{" + tex(ar) + "}"; break; }
        if (n === "abs") { s = "\\left|" + tex(ar) + "\\right|"; break; }
        if (a.a.length === 2) { s = TEXFN[n] + "\\left(" + a.a.map(function (z) { return tex(z); }).join(", ") + "\\right)"; break; }
        var nm = TEXFN[n] || "\\operatorname{" + n + "}";
        s = nm + (ar.t === "var" || (ar.t === "num" && ar.v >= 0) || (ar.t === "const") ? " " + tex(ar) : "\\left(" + tex(ar) + "\\right)");
        q = 3; break;
      }
      default: s = "?";
    }
    return q < p ? "\\left(" + s + "\\right)" : s;
  }
  MVC.tex = function (a) { return tex(a, 0); };

  /* ================================================================== compile to closures */
  function comp(a, idx) {
    switch (a.t) {
      case "num": { var v = a.v; return function () { return v; }; }
      case "const": { var c = a.v; return function () { return c; }; }
      case "var": { var i = idx[a.n]; if (i === undefined) throw err("ตัวแปร " + a.n + " ไม่อยู่ในรายการ"); return function (e) { return e[i]; }; }
      case "neg": { var f0 = comp(a.a, idx); return function (e) { return -f0(e); }; }
      case "add": { var fa = comp(a.a, idx), fb = comp(a.b, idx); return function (e) { return fa(e) + fb(e); }; }
      case "sub": { var sa = comp(a.a, idx), sb = comp(a.b, idx); return function (e) { return sa(e) - sb(e); }; }
      case "mul": { var ma = comp(a.a, idx), mb = comp(a.b, idx); return function (e) { return ma(e) * mb(e); }; }
      case "div": { var da = comp(a.a, idx), db = comp(a.b, idx); return function (e) { return da(e) / db(e); }; }
      case "pow": {
        var pa = comp(a.a, idx);
        if (a.b.t === "num") {
          var n = a.b.v;
          if (n === 2) return function (e) { var x = pa(e); return x * x; };
          if (n === 3) return function (e) { var x = pa(e); return x * x * x; };
          if (n === 0.5) return function (e) { return Math.sqrt(pa(e)); };
          if (Number.isInteger(n)) return function (e) { return Math.pow(pa(e), n); };
          return function (e) { var x = pa(e); return x < 0 && !Number.isInteger(n) ? NaN : Math.pow(x, n); };
        }
        var pb = comp(a.b, idx);
        return function (e) { return Math.pow(pa(e), pb(e)); };
      }
      case "fn": {
        if (a.a.length === 2) { var g2 = FN2[a.n], c1 = comp(a.a[0], idx), c2 = comp(a.a[1], idx); return function (e) { return g2(c1(e), c2(e)); }; }
        var g = FN1[a.n], c0 = comp(a.a[0], idx);
        if (!g) throw err("ไม่รู้จักฟังก์ชัน " + a.n);
        return function (e) { return g(c0(e)); };
      }
    }
    throw err("node?");
  }
  // compile an AST for the given ordered variable list → f(x1, x2, …)
  function compile(ast, vars) {
    var idx = {};
    vars.forEach(function (v, i) { idx[v] = i; });
    var c = comp(ast, idx), env = new Array(vars.length), n = vars.length;
    var f = function () { for (var i = 0; i < n; i++) env[i] = arguments[i]; return c(env); };
    f.ast = ast; f.vars = vars; f.tex = tex(ast, 0);
    return f;
  }
  MVC.compile = compile;
  MVC.parse = parse;
  // fn("x^2 y", ["x","y"]) → compiled function with .ast .tex .vars
  MVC.fn = function (src, vars) { vars = vars || ["x"]; return compile(parse(src, vars), vars); };
  // compiled partial derivative of an AST
  MVC.partial = function (ast, v, vars) { return compile(d(ast, v), vars); };
  // substitute variables by ASTs
  function subst(a, map) {
    switch (a.t) {
      case "num": case "const": return a;
      case "var": return map[a.n] || a;
      case "neg": return Neg(subst(a.a, map));
      case "add": return Add(subst(a.a, map), subst(a.b, map));
      case "sub": return Sub(subst(a.a, map), subst(a.b, map));
      case "mul": return Mul(subst(a.a, map), subst(a.b, map));
      case "div": return Div(subst(a.a, map), subst(a.b, map));
      case "pow": return Pow(subst(a.a, map), subst(a.b, map));
      case "fn": return Fn(a.n, a.a.map(function (x) { return subst(x, map); }));
    }
  }
  MVC.subst = subst;

  /* ================================================================== vector calculus (symbolic) */
  MVC.grad = function (f, vars) { return vars.map(function (v) { return d(f, v); }); };
  MVC.div = function (F, vars) { return F.reduce(function (s, c, i) { return Add(s, d(c, vars[i])); }, Num(0)); };
  MVC.curl = function (F, v) { // 3-D curl, v = [x,y,z]
    return [Sub(d(F[2], v[1]), d(F[1], v[2])), Sub(d(F[0], v[2]), d(F[2], v[0])), Sub(d(F[1], v[0]), d(F[0], v[1]))];
  };
  MVC.curl2 = function (F, v) { return Sub(d(F[1], v[0]), d(F[0], v[1])); }; // scalar 2-D curl  Q_x − P_y
  MVC.lap = function (f, vars) { return vars.reduce(function (s, v) { return Add(s, d(d(f, v), v)); }, Num(0)); };
  MVC.hessian = function (f, vars) { return vars.map(function (a) { return vars.map(function (b) { return d(d(f, a), b); }); }); };
  MVC.jacobian = function (F, vars) { return F.map(function (c) { return vars.map(function (v) { return d(c, v); }); }); };

  /* ================================================================== quadrature */
  var GL = {};
  function gaussLegendre(n) {
    if (GL[n]) return GL[n];
    var x = [], w = [];
    for (var i = 0; i < n; i++) {
      var z = Math.cos(PI * (i + 0.75) / (n + 0.5)), pp = 0;
      for (var it = 0; it < 100; it++) {
        var p1 = 1, p2 = 0;
        for (var j = 0; j < n; j++) { var p3 = p2; p2 = p1; p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1); }
        pp = n * (z * p1 - p2) / (z * z - 1);
        var z1 = z; z = z1 - p1 / pp;
        if (Math.abs(z - z1) < 1e-15) break;
      }
      x[i] = -z; w[i] = 2 / ((1 - z * z) * pp * pp);
    }
    return (GL[n] = { x: x, w: w });
  }
  MVC.gl = gaussLegendre;
  // ∫_a^b f — Gauss–Legendre after the map x = a + (b−a)(1 − cos πs)/2, which makes √-type endpoint behaviour analytic
  function quad(f, a, b, n, panels) {
    n = n || 24; panels = panels || 1;
    if (a === b) return 0;
    var g = gaussLegendre(n), tot = 0;
    for (var p = 0; p < panels; p++) {
      var s0 = p / panels, s1 = (p + 1) / panels, hs = (s1 - s0) / 2, cs = (s0 + s1) / 2;
      for (var i = 0; i < n; i++) {
        var s = cs + hs * g.x[i], x = a + (b - a) * (1 - Math.cos(PI * s)) / 2;
        var jac = (b - a) * PI * Math.sin(PI * s) / 2;
        tot += g.w[i] * hs * f(x) * jac;
      }
    }
    return tot;
  }
  MVC.quad = quad;
  // iterated integrals: lo/hi may be numbers or functions of the outer variables
  var val = function (b, args) { return typeof b === "function" ? b.apply(null, args) : b; };
  MVC.quad2 = function (f, x0, x1, y0, y1, n, panels) { // ∫_{x0}^{x1} ∫_{y0(x)}^{y1(x)} f(x,y) dy dx
    return quad(function (x) { return quad(function (y) { return f(x, y); }, val(y0, [x]), val(y1, [x]), n, panels); }, x0, x1, n, panels);
  };
  MVC.quad3 = function (f, x0, x1, y0, y1, z0, z1, n, panels) { // ∫∫∫ f dz dy dx  (z bounds may depend on x,y; y bounds on x)
    n = n || 14;
    return quad(function (x) {
      return quad(function (y) {
        return quad(function (z) { return f(x, y, z); }, val(z0, [x, y]), val(z1, [x, y]), n, panels);
      }, val(y0, [x]), val(y1, [x]), n, panels);
    }, x0, x1, n, panels);
  };

  /* ================================================================== numerical derivatives */
  MVC.numGrad = function (f, p, h) {
    h = h || 1e-5;
    return p.map(function (_, i) { var a = p.slice(), b = p.slice(); a[i] += h; b[i] -= h; return (f.apply(null, a) - f.apply(null, b)) / (2 * h); });
  };

  /* ================================================================== contour lines (marching squares) → SVG path data */
  // returns an array of segments [[x1,y1,x2,y2],…] for level c on the grid z[j][i] (rows = y)
  MVC.contourSegs = function (z, xs, ys, c) {
    var segs = [], nx = xs.length, ny = ys.length;
    function lerp(a, b, za, zb) { var t = (c - za) / (zb - za); return a + (b - a) * t; }
    for (var j = 0; j < ny - 1; j++) for (var i = 0; i < nx - 1; i++) {
      var z00 = z[j][i], z10 = z[j][i + 1], z11 = z[j + 1][i + 1], z01 = z[j + 1][i];
      if (!(isFinite(z00) && isFinite(z10) && isFinite(z11) && isFinite(z01))) continue;
      var code = (z00 > c ? 1 : 0) | (z10 > c ? 2 : 0) | (z11 > c ? 4 : 0) | (z01 > c ? 8 : 0);
      if (code === 0 || code === 15) continue;
      var x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
      var B = [lerp(x0, x1, z00, z10), y0], R = [x1, lerp(y0, y1, z10, z11)], T = [lerp(x0, x1, z01, z11), y1], L = [x0, lerp(y0, y1, z00, z01)];
      var P = function (a, b) { segs.push([a[0], a[1], b[0], b[1]]); };
      switch (code) {
        case 1: case 14: P(L, B); break;
        case 2: case 13: P(B, R); break;
        case 3: case 12: P(L, R); break;
        case 4: case 11: P(R, T); break;
        case 6: case 9: P(B, T); break;
        case 7: case 8: P(L, T); break;
        case 5: case 10: { var mid = (z00 + z10 + z11 + z01) / 4; if ((mid > c) === (code === 5)) { P(L, T); P(B, R); } else { P(L, B); P(R, T); } break; }
      }
    }
    return segs;
  };
  MVC.grid = function (f, x0, x1, y0, y1, nx, ny) {
    var xs = [], ys = [], z = [], i, j;
    for (i = 0; i < nx; i++) xs.push(x0 + (x1 - x0) * i / (nx - 1));
    for (j = 0; j < ny; j++) ys.push(y0 + (y1 - y0) * j / (ny - 1));
    for (j = 0; j < ny; j++) { var row = []; for (i = 0; i < nx; i++) { var v; try { v = f(xs[i], ys[j]); } catch (e) { v = NaN; } row.push(isFinite(v) ? v : NaN); } z.push(row); }
    return { xs: xs, ys: ys, z: z };
  };
  MVC.range = function (g) {
    var lo = Infinity, hi = -Infinity;
    g.z.forEach(function (r) { r.forEach(function (v) { if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }); });
    return isFinite(lo) ? [lo, hi] : [0, 1];
  };
  // "nice" contour levels covering [lo, hi]
  MVC.levels = function (lo, hi, n) {
    n = n || 10;
    if (!(hi > lo)) return [lo];
    var raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), fr = raw / p;
    var step = (fr <= 1 ? 1 : fr <= 2 ? 2 : fr <= 2.5 ? 2.5 : fr <= 5 ? 5 : 10) * p, out = [];
    for (var t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : +t.toPrecision(12));
    return out;
  };

  /* ================================================================== optimisation helpers */
  function solve2(a, b, c, d2, e, f) { // a x + b y = e ; c x + d y = f
    var det = a * d2 - b * c;
    return Math.abs(det) < 1e-14 ? null : [(e * d2 - b * f) / det, (a * f - e * c) / det];
  }
  MVC.solve2 = solve2;
  // critical points of f(x,y) in a box: Newton from a grid of seeds on ∇f = 0, classified with the second-derivative test
  MVC.critical = function (ast, vars, box, seeds) {
    var X = vars[0], Y = vars[1];
    var f = compile(ast, vars), fx = compile(d(ast, X), vars), fy = compile(d(ast, Y), vars);
    var fxx = compile(d(d(ast, X), X), vars), fxy = compile(d(d(ast, X), Y), vars), fyy = compile(d(d(ast, Y), Y), vars);
    var pts = [], n = seeds || 13;
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) {
      var x = box[0] + (box[1] - box[0]) * (a + 0.5) / n, y = box[2] + (box[3] - box[2]) * (b + 0.5) / n, ok = false;
      for (var it = 0; it < 60; it++) {
        var gx = fx(x, y), gy = fy(x, y);
        if (!isFinite(gx) || !isFinite(gy)) break;
        if (Math.hypot(gx, gy) < 1e-11) { ok = true; break; }
        var s = solve2(fxx(x, y), fxy(x, y), fxy(x, y), fyy(x, y), -gx, -gy);
        if (!s) break;
        var step = Math.hypot(s[0], s[1]), damp = step > 1 ? 1 / step : 1;
        x += s[0] * damp; y += s[1] * damp;
        if (Math.abs(x) > 1e6 || Math.abs(y) > 1e6) break;
      }
      if (!ok || x < box[0] - 1e-9 || x > box[1] + 1e-9 || y < box[2] - 1e-9 || y > box[3] + 1e-9) continue;
      if (pts.some(function (p) { return Math.hypot(p.x - x, p.y - y) < 1e-6; })) continue;
      var A = fxx(x, y), B = fxy(x, y), C = fyy(x, y), D = A * C - B * B, kind;
      if (Math.abs(D) < 1e-9) kind = "ไม่สรุป (D = 0)"; else if (D < 0) kind = "จุดอานม้า (saddle)"; else kind = A > 0 ? "ค่าต่ำสุดสัมพัทธ์ (local min)" : "ค่าสูงสุดสัมพัทธ์ (local max)";
      pts.push({ x: Math.abs(x) < 1e-10 ? 0 : x, y: Math.abs(y) < 1e-10 ? 0 : y, z: f(x, y), fxx: A, fxy: B, fyy: C, D: D, kind: kind, type: Math.abs(D) < 1e-9 ? "flat" : D < 0 ? "saddle" : A > 0 ? "min" : "max" });
    }
    return pts.sort(function (p, q) { return p.x - q.x || p.y - q.y; });
  };
  // gradient descent / ascent from (x,y) with learning rate a
  MVC.descent = function (ast, vars, p0, alpha, steps, ascend) {
    var fx = compile(d(ast, vars[0]), vars), fy = compile(d(ast, vars[1]), vars), f = compile(ast, vars), x = p0[0], y = p0[1], out = [[x, y, f(x, y)]];
    for (var k = 0; k < (steps || 30); k++) {
      var gx = fx(x, y), gy = fy(x, y);
      if (!isFinite(gx) || !isFinite(gy)) break;
      var sgn = ascend ? 1 : -1;
      x += sgn * alpha * gx; y += sgn * alpha * gy;
      var v = f(x, y);
      if (!isFinite(v) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) { out.push([x, y, v]); break; }
      out.push([x, y, v]);
      if (Math.hypot(gx, gy) < 1e-9) break;
    }
    return out;
  };

  /* ================================================================== space curves */
  // curve = { x, y, z: ASTs in t }  →  numeric functions and symbolic derivatives
  MVC.curve = function (xs, ys, zs) {
    var asts = [xs, ys, zs], vars = ["t"];
    var r = asts.map(function (a) { return compile(a, vars); });
    var r1a = asts.map(function (a) { return d(a, "t"); }), r2a = r1a.map(function (a) { return d(a, "t"); }), r3a = r2a.map(function (a) { return d(a, "t"); });
    var r1 = r1a.map(function (a) { return compile(a, vars); }), r2 = r2a.map(function (a) { return compile(a, vars); }), r3 = r3a.map(function (a) { return compile(a, vars); });
    var ev = function (fs, t) { return fs.map(function (f) { return f(t); }); };
    var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
    var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var norm = function (a) { return Math.hypot(a[0], a[1], a[2]); };
    var unit = function (a) { var n = norm(a); return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0]; };
    var C = {
      asts: asts, d1: r1a, d2: r2a, d3: r3a,
      r: function (t) { return ev(r, t); }, v: function (t) { return ev(r1, t); }, a: function (t) { return ev(r2, t); }, j: function (t) { return ev(r3, t); },
      speed: function (t) { return norm(ev(r1, t)); },
      at: function (t) {
        var v = ev(r1, t), a = ev(r2, t), j = ev(r3, t), sp = norm(v), cr = cross(v, a), ncr = norm(cr);
        var T = unit(v), B = unit(cr), kappa = sp > 1e-12 ? ncr / (sp * sp * sp) : NaN;
        var N = ncr > 1e-9 ? cross(B, T) : [NaN, NaN, NaN];
        var tau = ncr > 1e-9 ? dot(cr, j) / (ncr * ncr) : NaN;
        return { r: ev(r, t), v: v, a: a, speed: sp, T: T, N: N, B: B, kappa: kappa, tau: tau, aT: sp > 1e-12 ? dot(v, a) / sp : NaN, aN: sp > 1e-12 ? ncr / sp : NaN, R: kappa > 1e-12 ? 1 / kappa : Infinity };
      },
      length: function (t0, t1) { return quad(function (t) { return norm(ev(r1, t)); }, t0, t1, 24, 4); }
    };
    return C;
  };

  /* ================================================================== line & surface integrals */
  // F = [P,Q,(R)] compiled over the spatial variables; c = MVC.curve ; ∫ F(r(t))·r′(t) dt
  MVC.lineInt = function (F, c, t0, t1) {
    return quad(function (t) { var p = c.r(t), v = c.v(t), s = 0; for (var i = 0; i < F.length; i++) s += F[i].apply(null, p.slice(0, F[i].vars.length)) * v[i]; return s; }, t0, t1, 24, 4);
  };
  MVC.lineScalar = function (f, c, t0, t1) { return quad(function (t) { return f.apply(null, c.r(t).slice(0, f.vars.length)) * c.speed(t); }, t0, t1, 24, 4); };
  // parametric surface S(u,v) = [X,Y,Z] ASTs in u,v
  MVC.surface = function (X, Y, Z) {
    var asts = [X, Y, Z], uv = ["u", "v"];
    var S = asts.map(function (a) { return compile(a, uv); });
    var Su = asts.map(function (a) { return compile(d(a, "u"), uv); }), Sv = asts.map(function (a) { return compile(d(a, "v"), uv); });
    var ev = function (fs, u, v) { return fs.map(function (f) { return f(u, v); }); };
    var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    return {
      p: function (u, v) { return ev(S, u, v); },
      n: function (u, v) { return cross(ev(Su, u, v), ev(Sv, u, v)); }, // r_u × r_v (not normalised)
      area: function (u0, u1, v0, v1) { var self = this; return MVC.quad2(function (u, v) { var n = self.n(u, v); return Math.hypot(n[0], n[1], n[2]); }, u0, u1, v0, v1, 20, 2); },
      // flux of F through the surface in the direction of r_u × r_v
      flux: function (F, u0, u1, v0, v1, n) {
        var self = this;
        return MVC.quad2(function (u, v) { var p = self.p(u, v), nn = self.n(u, v); return F[0](p[0], p[1], p[2]) * nn[0] + F[1](p[0], p[1], p[2]) * nn[1] + F[2](p[0], p[1], p[2]) * nn[2]; }, u0, u1, v0, v1, n || 20, 2);
      },
      scalar: function (f, u0, u1, v0, v1) { var self = this; return MVC.quad2(function (u, v) { var p = self.p(u, v), nn = self.n(u, v); return f(p[0], p[1], p[2]) * Math.hypot(nn[0], nn[1], nn[2]); }, u0, u1, v0, v1, 20, 2); }
    };
  };

  /* ================================================================== number formatting (plain text) */
  MVC.fmt = function (x, s) {
    if (x === undefined || x === null || !isFinite(x)) return isNaN(x) || x === undefined || x === null ? "—" : x > 0 ? "∞" : "−∞";
    if (Math.abs(x) < 1e-12) return "0";
    s = s || 4;
    var a = Math.abs(x), dg = Math.max(0, s - 1 - Math.floor(Math.log10(a)));
    var t = a >= 1e6 || a < 1e-4 ? x.toExponential(s - 1) : String(+x.toFixed(Math.min(dg, 8)));
    return t.replace("-", "−");
  };
  MVC.texNum = function (x, s) {
    if (!isFinite(x)) return "\\text{—}";
    if (Math.abs(x) < 1e-12) return "0";
    s = s || 4;
    var a = Math.abs(x), dg = Math.max(0, s - 1 - Math.floor(Math.log10(a)));
    if (a >= 1e6 || a < 1e-4) { var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e); return (+m.toPrecision(s)) + "\\times10^{" + e + "}"; }
    return String(+x.toFixed(Math.min(dg, 8)));
  };

  root.MVC = MVC;
  if (typeof module !== "undefined" && module.exports) module.exports = MVC;
})(typeof window !== "undefined" ? window : globalThis);
