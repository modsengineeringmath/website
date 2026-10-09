/* SigExpr — a small, safe expression language for signals (no eval).
   SigExpr.compile("2*u(t-1) - exp(-t)*cos(2*pi*t)", "t")  →  { fn(ctx), tex, src }
   ctx = { t, dt, on, hit }  ·  continuous time: delta() returns 1/|Δarg| on the sample whose
   interval [t − dt/2, t + dt/2) contains the root of its argument (area-correct, incl. δ(at) = δ(t)/|a|).
   With variable "n" (discrete time) delta(n) is the Kronecker delta and u(n) is 1 for n ≥ 0. */
(function (root) {
  "use strict";
  var PI = Math.PI;
  function U(v) { return v >= 0 ? 1 : 0; }
  var FN = {
    sin: [1, Math.sin], cos: [1, Math.cos], tan: [1, Math.tan], asin: [1, Math.asin], acos: [1, Math.acos], atan: [1, Math.atan],
    sinh: [1, Math.sinh], cosh: [1, Math.cosh], tanh: [1, Math.tanh], exp: [1, Math.exp], ln: [1, Math.log], log: [1, Math.log], log10: [1, Math.log10],
    sqrt: [1, Math.sqrt], abs: [1, Math.abs], floor: [1, Math.floor], ceil: [1, Math.ceil], round: [1, Math.round],
    sgn: [1, function (v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }],
    u: [1, U],
    r: [1, function (v) { return v > 0 ? v : 0; }],
    rect: [1, function (v) { var a = Math.abs(v); return a < 0.5 ? 1 : a === 0.5 ? 0.5 : 0; }],
    tri: [1, function (v) { return Math.max(0, 1 - Math.abs(v)); }],
    sinc: [1, function (v) { return v === 0 ? 1 : Math.sin(PI * v) / (PI * v); }],
    sq: [1, function (v) { return Math.sin(v) >= 0 ? 1 : -1; }],
    saw: [1, function (v) { var x = v / (2 * PI); return 2 * (x - Math.floor(x)) - 1; }],
    mod: [2, function (a, b) { return a - b * Math.floor(a / b); }],
    min: [2, Math.min], max: [2, Math.max], pow: [2, Math.pow], atan2: [2, Math.atan2]
  };
  FN.sign = FN.sgn; FN.step = FN.u; FN.ramp = FN.r;
  var CONST = { pi: PI, e: Math.E };

  // ---------------------------------------------------------------- tokenizer
  function tokenize(src) {
    var s = String(src).replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/δ/g, "delta").replace(/\*\*/g, "^");
    var out = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        var m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
        if (!m) throw err("ตัวเลขไม่ถูกต้อง", i);
        if (s[i + m[0].length] === ".") throw err("ตัวเลขมีจุดทศนิยมเกิน", i + m[0].length);
        out.push({ k: "num", v: parseFloat(m[0]), p: i }); i += m[0].length; continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        var w = s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)[0];
        out.push({ k: "id", v: w.toLowerCase(), p: i }); i += w.length; continue;
      }
      if ("+-*/^(),[]".indexOf(ch) >= 0) { out.push({ k: ch === "[" ? "(" : ch === "]" ? ")" : ch, p: i }); i++; continue; }
      throw err("ไม่รู้จักเครื่องหมาย “" + ch + "”", i);
    }
    out.push({ k: "end", p: s.length });
    return out;
  }
  function err(msg, pos) { var e = new Error(msg); e.pos = pos; return e; }

  // ---------------------------------------------------------------- parser → AST
  function parse(src, v) {
    var tk = tokenize(src), i = 0;
    function peek() { return tk[i]; }
    function eat(k) { if (tk[i].k !== k) throw err(k === ")" ? "วงเล็บไม่ครบ" : "คาดว่าจะเป็น “" + k + "”", tk[i].p); return tk[i++]; }
    function expr() {
      var n = term();
      while (peek().k === "+" || peek().k === "-") { var op = tk[i++].k; n = { t: "bin", op: op, a: n, b: term() }; }
      return n;
    }
    function term() {
      var n = unary();
      for (;;) {
        var k = peek().k;
        if (k === "*" || k === "/") { i++; n = { t: "bin", op: k, a: n, b: unary() }; }
        else if (k === "num" || k === "id" || k === "(") n = { t: "bin", op: "*", a: n, b: unary(), imp: true }; // 2t, 2pi, 3(t-1)
        else return n;
      }
    }
    function unary() {
      if (peek().k === "-") { i++; return { t: "neg", a: unary() }; }
      if (peek().k === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var b = atom();
      if (peek().k === "^") { i++; return { t: "bin", op: "^", a: b, b: unary() }; }
      return b;
    }
    function atom() {
      var tok = peek();
      if (tok.k === "num") { i++; return { t: "num", v: tok.v }; }
      if (tok.k === "(") { i++; var n = expr(); eat(")"); return { t: "par", a: n }; }
      if (tok.k === "id") {
        i++;
        var name = tok.v;
        if (peek().k === "(") {
          if (!(name in FN) && name !== "delta" && name !== "d") throw err("ไม่รู้จักฟังก์ชัน “" + name + "”", tok.p);
          i++;
          var args = [expr()];
          while (peek().k === ",") { i++; args.push(expr()); }
          eat(")");
          if (name === "delta" || name === "d") { if (args.length !== 1) throw err("delta รับค่าเดียว", tok.p); return { t: "delta", a: args[0] }; }
          if (FN[name][0] !== args.length) throw err("“" + name + "” ต้องการ " + FN[name][0] + " ค่า", tok.p);
          return { t: "call", f: name, args: args };
        }
        if (name === v || (v === "n" && name === "k")) return { t: "var" };
        if (name in CONST) return { t: "const", v: name };
        if (name === "t" || name === "n") throw err("ใช้ตัวแปร " + v + " ในโหมดนี้", tok.p);
        if (name in FN || name === "delta") throw err("ฟังก์ชัน “" + name + "” ต้องตามด้วยวงเล็บ เช่น " + name + "(" + v + ")", tok.p);
        throw err("ไม่รู้จัก “" + name + "”", tok.p);
      }
      if (tok.k === "end") throw err("สมการยังไม่จบ", tok.p);
      throw err("พิมพ์ไม่ถูกต้องตรงนี้", tok.p);
    }
    var tree = expr();
    if (peek().k !== "end") throw err("มีส่วนเกินที่อ่านไม่ได้", peek().p);
    return tree;
  }

  // ---------------------------------------------------------------- compile AST → closure
  function compile(node, discrete) {
    switch (node.t) {
      case "num": var c = node.v; return function () { return c; };
      case "const": var k = CONST[node.v]; return function () { return k; };
      case "var": return function (x) { return x.t; };
      case "par": return compile(node.a, discrete);
      case "neg": var a0 = compile(node.a, discrete); return function (x) { return -a0(x); };
      case "bin":
        var A = compile(node.a, discrete), B = compile(node.b, discrete);
        switch (node.op) {
          case "+": return function (x) { return A(x) + B(x); };
          case "-": return function (x) { return A(x) - B(x); };
          case "*": return function (x) { return A(x) * B(x); };
          case "/": return function (x) { return A(x) / B(x); };
          default: return function (x) { return Math.pow(A(x), B(x)); };
        }
      case "call":
        var f = FN[node.f][1], args = node.args.map(function (a) { return compile(a, discrete); });
        if (discrete && node.f === "u") return function (x) { return args[0](x) > -1e-9 ? 1 : 0; };
        if (args.length === 1) { var g = args[0]; return function (x) { return f(g(x)); }; }
        var g1 = args[0], g2 = args[1];
        return function (x) { return f(g1(x), g2(x)); };
      case "delta":
        var arg = compile(node.a, discrete);
        if (discrete) return function (x) { return Math.abs(arg(x)) < 1e-9 ? 1 : 0; };
        return function (x) {
          if (!x.on) return 0;
          // the sample owns the interval [t − dt/2, t + dt/2): impulses land on the nearest sample
          var t = x.t; x.t = t - x.dt / 2; var a0 = arg(x);
          x.t = t + x.dt / 2; var a1 = arg(x); x.t = t;
          if (a0 === 0 && a1 === 0) { x.hit = true; return 1 / Math.abs(x.dt); }
          if (a0 === 0 || (a0 < 0 && a1 > 0) || (a0 > 0 && a1 < 0)) { x.hit = true; return 1 / Math.abs(a1 - a0); }
          return 0;
        };
    }
    throw new Error("internal");
  }

  // ---------------------------------------------------------------- LaTeX
  var PREC = { "+": 1, "-": 1, "*": 2, "/": 3, "^": 4 };
  function prec(n) { return n.t === "par" ? prec(n.a) : n.t === "bin" ? PREC[n.op] : n.t === "neg" ? 1.5 : 9; }
  function num(v) { var s = (+v.toPrecision(6)).toString(); return s.indexOf("e") > 0 ? s.replace(/e\+?(-?\d+)/, "\\times10^{$1}") : s; }
  var TEXF = { sin: "\\sin", cos: "\\cos", tan: "\\tan", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", ln: "\\ln", log: "\\ln", asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan" };
  function tex(n, v) {
    switch (n.t) {
      case "num": return num(n.v);
      case "const": return n.v === "pi" ? "\\pi" : "e";
      case "var": return v;
      case "par": return tex(n.a, v);
      case "neg": return "-" + wrap(n.a, 1.5, v);
      case "delta": return "\\delta" + br(tex(n.a, v), v);
      case "call":
        var a = n.args.map(function (x) { return tex(x, v); });
        if (n.f === "exp") return "e^{" + a[0] + "}";
        if (n.f === "sqrt") return "\\sqrt{" + a[0] + "}";
        if (n.f === "abs") return "\\left|" + a[0] + "\\right|";
        if (n.f === "pow") return "{" + a[0] + "}^{" + a[1] + "}";
        if (TEXF[n.f]) return TEXF[n.f] + "\\left(" + a[0] + "\\right)";
        if (n.f === "u" || n.f === "r" || n.f === "step" || n.f === "ramp") return (n.f === "step" ? "u" : n.f === "ramp" ? "r" : n.f) + br(a[0], v);
        return "\\operatorname{" + n.f + "}" + br(a.join(",\\,"), v);
      case "bin":
        var p = PREC[n.op];
        if (n.op === "/") return "\\dfrac{" + tex(n.a, v) + "}{" + tex(n.b, v) + "}";
        if (n.op === "^") return "{" + wrap(n.a, 4.5, v) + "}^{" + tex(n.b, v) + "}";
        if (n.op === "*") {
          if (n.a.t === "neg") return "-" + tex({ t: "bin", op: "*", a: n.a.a, b: n.b }, v);
          var L = wrap(n.a, 2, v), R = wrap(n.b, 2.1, v);
          var numR = n.b.t === "num" || (n.b.t === "neg") || (n.b.t === "bin" && n.b.op === "^" && n.b.a.t === "num");
          return L + (numR ? " \\cdot " : "\\,") + R;
        }
        return wrap(n.a, p, v) + " " + n.op + " " + wrap(n.b, p + (n.op === "-" ? 0.5 : 0), v);
    }
    return "";
  }
  function br(s, v) { return v === "n" ? "[" + s + "]" : "(" + s + ")"; }
  function wrap(n, p, v) { var s = tex(n, v); return prec(n) < p ? "\\left(" + s + "\\right)" : s; }

  root.SigExpr = {
    compile: function (src, v) {
      var tree = parse(src, v || "t"), discrete = v === "n";
      return { fn: compile(tree, discrete), tex: tex(tree, v || "t"), src: src, discrete: discrete };
    },
    functions: Object.keys(FN).concat(["delta"])
  };
})(typeof window !== "undefined" ? window : globalThis);
