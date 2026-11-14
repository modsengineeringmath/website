/* ms-lab.js — interactive labs for trigonometric derivatives, differential equations and signals & systems (added 2026-11-14).
   Each widget is an element with class "cl-lab ms-…"; settings come from data-attributes:
     ms-trigd  data-f="sin|cos|tan|sec"            slope of a trig graph = its derivative, with the unit circle; radian/degree switch
     ms-sinlim                                     lim sin h / h = 1 by squeezing three areas in the unit circle
     ms-field  data-f="t - y" data-t0 data-y0 data-tmax data-ymin data-ymax data-h    slope field, Euler / Heun / RK4
     ms-ode2   data-order="1|2" data-a data-b data-c data-ft="0|K|exp|cos|sin" data-p1 data-p2 data-y0 data-v0 [data-tool]
               solver for a y'' + b y' + c y = f(t) (or a y' + b y = f) with every step; answer shown only after an RK4 check
     ms-conv   data-x="rect|step|exp|tri|sinp" data-h="…"   continuous convolution, flip and slide
     ms-dconv  data-x="1,2,1" data-x0="0" data-h="1,-1" data-h0="0"   discrete convolution with exact fractions
     ms-ft     data-sig="rect|exp|tri|gauss|mod|dexp"       Fourier transform pairs, |X(f)| and phase, numerical check
     ms-alias  data-f="7" data-fs="10"                      sampling and aliasing
     ms-zpz    data-preset="lp1|ma4|hp1|res|notch"          z-plane poles and zeros → |H(e^jω)| and h[n]
   Needs /assets/mathkit.js (MK) and KaTeX. Language follows <html lang>. Pure helpers: window.MSLab (module.exports in Node). */
(function (root) {
  "use strict";
  var PI = Math.PI;
  var doc = root.document;
  var EN = !!(doc && /^en/i.test(doc.documentElement.lang || ""));
  function L(th, en) { return EN ? en : th; }
  var MK = root.MK || (typeof require === "function" ? require("./mathkit.js") : null);

  // ------------------------------------------------------------------ expression parser (no eval)
  var FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: function (x) { return 1 / Math.cos(x); }, csc: function (x) { return 1 / Math.sin(x); },
    cot: function (x) { return 1 / Math.tan(x); }, asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh,
    tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log, sqrt: Math.sqrt, abs: Math.abs,
    u: function (x) { return x >= 0 ? 1 : 0; }, sgn: function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; },
    rect: function (x) { return Math.abs(x) < 0.5 ? 1 : Math.abs(x) === 0.5 ? 0.5 : 0; }, tri: function (x) { return Math.max(0, 1 - Math.abs(x)); },
    sinc: function (x) { return x === 0 ? 1 : Math.sin(PI * x) / (PI * x); }, pow: Math.pow, min: Math.min, max: Math.max
  };
  var CONST = { pi: PI, e: Math.E };
  function compile(src, vars) {
    var s = String(src).replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/\*\*/g, "^").replace(/\s+/g, "");
    if (/^[a-z]'?=/i.test(s)) s = s.replace(/^[a-z]'?=/i, ""); // allow "y' = …"
    var i = 0;
    function err(w) { return new Error(L("อ่านสมการไม่ได้ใกล้ ", "Cannot read the expression near ") + (w || s.slice(i, i + 6) || L("ท้ายสมการ", "the end"))); }
    function primary() {
      var c = s[i];
      if (c === "(") { i++; var e = add(); if (s[i] !== ")") throw err(")"); i++; return e; }
      var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (m) { i += m[0].length; var v = +m[0]; return function () { return v; }; }
      m = /^[a-zA-Z_][a-zA-Z_0-9]*/.exec(s.slice(i));
      if (!m) throw err();
      var id = m[0]; i += id.length;
      if (s[i] === "(" && FN[id]) {
        i++; var args = [add()];
        while (s[i] === ",") { i++; args.push(add()); }
        if (s[i] !== ")") throw err(")"); i++;
        var f = FN[id];
        if (args.length === 1) { var a0 = args[0]; return function (env) { return f(a0(env)); }; }
        return function (env) { return f.apply(null, args.map(function (a) { return a(env); })); };
      }
      if (vars.indexOf(id) >= 0) return function (env) { return env[id]; };
      if (CONST.hasOwnProperty(id)) { var k = CONST[id]; return function () { return k; }; }
      // implicit product of letters, e.g. "ty" → t*y
      if (id.split("").every(function (ch) { return vars.indexOf(ch) >= 0; })) {
        var parts = id.split("");
        return function (env) { var p = 1; for (var j = 0; j < parts.length; j++) p *= env[parts[j]]; return p; };
      }
      throw err(id);
    }
    function power() {
      var b = primary();
      if (s[i] === "^") { i++; var ex = unary(); return function (env) { return Math.pow(b(env), ex(env)); }; }
      return b;
    }
    function unary() {
      if (s[i] === "-") { i++; var u = unary(); return function (env) { return -u(env); }; }
      if (s[i] === "+") { i++; return unary(); }
      return power();
    }
    function mul() {
      var l = unary();
      for (;;) {
        var c = s[i];
        if (c === "*" || c === "/") { i++; var r = unary(); l = (function (a, b, op) { return op === "*" ? function (e) { return a(e) * b(e); } : function (e) { return a(e) / b(e); }; })(l, r, c); }
        else if (c && /[0-9a-zA-Z_(.]/.test(c)) { var r2 = power(); l = (function (a, b) { return function (e) { return a(e) * b(e); }; })(l, r2); }
        else return l;
      }
    }
    function add() {
      var l = mul();
      while (s[i] === "+" || s[i] === "-") { var op = s[i++]; var r = mul(); l = (function (a, b, o) { return o === "+" ? function (e) { return a(e) + b(e); } : function (e) { return a(e) - b(e); }; })(l, r, op); }
      return l;
    }
    if (!s) throw err();
    var out = add();
    if (i < s.length) throw err();
    return out;
  }

  // ------------------------------------------------------------------ small numeric helpers
  function ti(x) { return (root.katex && MK) ? MK.texStr(x) : x; }
  function fixTex(str) { // text nodes only: never rewrite inside a tag (chip title attributes hold formulas too)
    return String(str || "").split(/(<[^>]*>)/).map(function (seg) {
      return seg.charAt(0) === "<" ? seg : seg.replace(/e\^\{[^{}]*\}/g, function (m) { return ti(m); }).replace(/y_p/g, "y<sub>p</sub>");
    }).join("");
  }
  function nice(x) { return MK ? MK.nice(x) : String(+x.toFixed(4)); }
  function fmt(x, d) { if (!isFinite(x)) return "—"; var a = Math.abs(x); if (a !== 0 && (a < 1e-3 || a >= 1e5)) return x.toExponential(2); return String(+x.toFixed(d == null ? 4 : d)); }
  function near(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function rk4(f, t0, y0, t1, n) { // y may be a number or an array
    var h = (t1 - t0) / n, t = t0, y = y0, out = [[t, y]], vec = Array.isArray(y0);
    function axpy(a, x, yv) { return vec ? yv.map(function (v, k) { return v + a * x[k]; }) : yv + a * x; }
    for (var k = 0; k < n; k++) {
      var k1 = f(t, y), k2 = f(t + h / 2, axpy(h / 2, k1, y)), k3 = f(t + h / 2, axpy(h / 2, k2, y)), k4 = f(t + h, axpy(h, k3, y));
      y = vec ? y.map(function (v, j) { return v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); }) : y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      t = t0 + (k + 1) * h; out.push([t, y]);
    }
    return out;
  }

  // ------------------------------------------------------------------ trig chips (floating identity labels)
  var TG = {
    pyth: ["#pythagorean", "เอกลักษณ์พีทาโกรัส", "Pythagorean identity", "sin²θ + cos²θ = 1"],
    euler: ["#euler", "สูตรออยเลอร์", "Euler's formula", "e^{jθ} = cos θ + j sin θ"],
    eulercos: ["#euler", "cos ในรูปเลขชี้กำลัง", "cos via Euler", "cos θ = (e^{jθ} + e^{−jθ})/2"],
    harmonic: ["#harmonic", "รวมคลื่น R cos(θ − φ)", "harmonic addition", "a cos θ + b sin θ = R cos(θ − φ), R = √(a²+b²), tan φ = b/a"],
    period: ["#symmetry", "คาบ 2π", "periodicity", "cos(θ + 2πk) = cos θ"],
    even: ["#symmetry", "cos เป็นฟังก์ชันคู่", "cosine is even", "cos(−θ) = cos θ"],
    sumcos: ["#sum-difference", "สูตรผลบวกมุม", "angle-sum formula", "cos(A + B) = cos A cos B − sin A sin B"],
    p2s: ["#product-to-sum", "ผลคูณเป็นผลบวก", "product-to-sum", "2 cos A cos B = cos(A − B) + cos(A + B)"],
    rad: ["#angles", "ต้องเป็นเรเดียน", "radians only", "180° = π rad"]
  };
  function tg(key) {
    var d = TG[key]; if (!d) return "";
    return '<a class="tg" href="/learn/trigonometry/' + d[0] + '" title="' + d[3] + '">' + L(d[1], d[2]) + "</a>";
  }

  // ------------------------------------------------------------------ linear ODE solver (constant coefficients)
  /* o = { order: 1|2, a, b, c, ft: "0"|"K"|"exp"|"cos"|"sin", p1, p2, y0, v0 }
     forcing: K → f = p1 ; exp → f = p1 e^{p2 t} ; cos → f = p1 cos(p2 t) ; sin → f = p1 sin(p2 t) */
  function expT(r) { if (near(r, 0, 1e-12)) return ""; return "e^{" + (near(r, 1) ? "" : near(r, -1) ? "-" : nice(r)) + "t}"; }
  function argT(w) { return (near(w, 1) ? "" : nice(w)) + "t"; }
  function joinTerms(terms) { // terms: [coef, texOfFunction] → TeX sum
    var out = "";
    terms.forEach(function (tm) {
      var c = tm[0], f = tm[1] === "1" ? "" : tm[1];
      if (near(c, 0, 1e-12)) return;
      var neg = c < 0, a = Math.abs(c), cs = (near(a, 1) && f) ? "" : nice(a);
      var piece = f ? (cs ? cs + (/^[0-9]/.test(f) ? "\\cdot " : "\\,") + f : f) : nice(a);
      out += out ? (neg ? " - " : " + ") + piece : (neg ? "-" : "") + piece;
    });
    return out || "0";
  }
  function solveLin(o) {
    var a = +o.a, b = +o.b, c = o.order === 1 ? 0 : +o.c, order = o.order === 1 ? 1 : 2;
    var st = [], res = { steps: st, order: order };
    if (!a) throw new Error(L("สัมประสิทธิ์ตัวหน้าต้องไม่เป็นศูนย์", "The leading coefficient must not be zero"));
    var P = order === 2 ? function (s) { return a * s * s + b * s + c; } : function (s) { return a * s + b; };
    var dP = order === 2 ? function (s) { return 2 * a * s + b; } : function () { return a; };
    // forcing
    var ft = o.ft || "0", F = +o.p1 || 0, k = +o.p2 || 0;
    if (ft === "K") { k = 0; }
    var f;
    if (ft === "0") f = function () { return 0; };
    else if (ft === "K" || ft === "exp") f = function (t) { return F * Math.exp(k * t); };
    else if (ft === "cos") f = function (t) { return F * Math.cos(k * t); };
    else f = function (t) { return F * Math.sin(k * t); };
    res.f = f;
    var lhs = order === 2 ? joinTerms([[a, "y''"], [b, "y'"], [c, "y"]]) : joinTerms([[a, "y'"], [b, "y"]]);
    var rhsT = ft === "0" ? "0" : ft === "K" ? nice(F) : ft === "exp" ? joinTerms([[F, expT(k) || "1"]]) : joinTerms([[F, (ft === "cos" ? "\\cos " : "\\sin ") + argT(k)]]);
    res.eqTex = lhs + " = " + rhsT;
    // 1) characteristic equation and homogeneous basis
    var basis, cas, yhT, rootsTex;
    if (order === 1) {
      var r = -b / a; res.r1 = r;
      basis = [function (t) { return Math.exp(r * t); }]; basis.d0 = [[1, r]];
      cas = "first"; yhT = joinTerms([[1, "C" + (expT(r) ? "\\," + expT(r) : "")]]);
      rootsTex = "r = " + nice(r);
      st.push({ h: L("สมการลักษณะเฉพาะ", "Characteristic equation"), tex: joinTerms([[a, "r"], [b, ""]]) + " = 0 \\;\\Rightarrow\\; " + rootsTex,
        note: L("แทน y = e^{rt} ลงในสมการเอกพันธ์ ทุกพจน์มี e^{rt} ร่วมกัน หารออกได้ เหลือสมการพีชคณิตของ r", "Substitute y = e^{rt} into the homogeneous equation; every term shares e^{rt}, which cancels and leaves an algebraic equation in r") });
      st.push({ h: L("คำตอบเอกพันธ์", "Homogeneous solution"), tex: "y_h = " + yhT });
    } else {
      var disc = b * b - 4 * a * c, scale = Math.max(b * b, Math.abs(4 * a * c), 1e-300);
      var chTex = joinTerms([[a, "r^2"], [b, "r"], [c, ""]]) + " = 0";
      if (Math.abs(disc) <= 1e-12 * scale) {
        var r0 = -b / (2 * a); cas = "repeated";
        basis = [function (t) { return Math.exp(r0 * t); }, function (t) { return t * Math.exp(r0 * t); }]; basis.d0 = [[1, r0], [0, 1]];
        rootsTex = "r_1 = r_2 = " + nice(r0);
        yhT = "(C_1 + C_2 t)" + (expT(r0) ? "\\," + expT(r0) : "");
        res.roots = [[r0, 0], [r0, 0]];
      } else if (disc > 0) {
        var sq = Math.sqrt(disc), r1 = (-b + sq) / (2 * a), r2 = (-b - sq) / (2 * a); cas = "real";
        basis = [function (t) { return Math.exp(r1 * t); }, function (t) { return Math.exp(r2 * t); }]; basis.d0 = [[1, r1], [1, r2]];
        rootsTex = "r_1 = " + nice(r1) + ",\\quad r_2 = " + nice(r2);
        yhT = "C_1" + (expT(r1) ? "\\," + expT(r1) : "") + " + C_2" + (expT(r2) ? "\\," + expT(r2) : "");
        res.roots = [[r1, 0], [r2, 0]];
      } else {
        var al = -b / (2 * a), be = Math.sqrt(-disc) / (2 * a); if (be < 0) be = -be; cas = "complex";
        basis = [function (t) { return Math.exp(al * t) * Math.cos(be * t); }, function (t) { return Math.exp(al * t) * Math.sin(be * t); }]; basis.d0 = [[1, al], [0, be]];
        rootsTex = "r = " + nice(al) + " \\pm " + (near(be, 1) ? "" : nice(be)) + "j";
        yhT = (expT(al) ? expT(al) : "") + "\\big(C_1\\cos " + argT(be) + " + C_2\\sin " + argT(be) + "\\big)";
        res.roots = [[al, be], [al, -be]]; res.alpha = al; res.beta = be;
      }
      res.disc = disc;
      st.push({ h: L("สมการลักษณะเฉพาะ", "Characteristic equation"), tex: chTex + "\\;\\Rightarrow\\; r = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a},\\quad b^2 - 4ac = " + nice(disc),
        note: L("แทน y = e^{rt} ลงในสมการเอกพันธ์ ได้ e^{rt}(ar² + br + c) = 0 และ e^{rt} ไม่เคยเป็นศูนย์ จึงเหลือ ar² + br + c = 0", "Substituting y = e^{rt} gives e^{rt}(ar² + br + c) = 0, and e^{rt} is never zero") });
      var caseNote = cas === "real" ? L("รากจริงสองค่าไม่ซ้ำ: คำตอบเป็นผลรวมของเลขชี้กำลังสองตัว ไม่แกว่ง", "Two distinct real roots: a sum of two exponentials, no oscillation")
        : cas === "repeated" ? L("รากซ้ำ: e^{rt} ให้คำตอบได้แค่ตัวเดียว ตัวที่สองคือ t e^{rt} (ได้จากการลดอันดับ)", "Repeated root: e^{rt} gives only one solution; the second is t e^{rt} (reduction of order)")
        : L("รากเชิงซ้อน α ± jβ: e^{(α+jβ)t} = e^{αt}(cos βt + j sin βt) ส่วนจริงและส่วนจินตภาพต่างก็เป็นคำตอบ จึงได้ e^{αt} คูณ cos กับ sin ", "Complex roots α ± jβ: e^{(α+jβ)t} = e^{αt}(cos βt + j sin βt); the real and imaginary parts are both solutions, giving e^{αt} times cos and sin ") + tg("euler");
      st.push({ h: L("คำตอบเอกพันธ์", "Homogeneous solution"), tex: rootsTex + "\\;\\Rightarrow\\; y_h = " + yhT, note: caseNote, html: true });
    }
    res.cas = cas;
    // 2) particular solution
    var yp = function () { return 0; }, ypT = "0", ypNote = "";
    if (ft === "K" || ft === "exp") {
      var Pk = P(k), dPk = dP(k), ek = expT(k);
      if (Math.abs(Pk) > 1e-10 * Math.max(1, Math.abs(a * k * k), Math.abs(b * k), Math.abs(c))) {
        var A1 = F / Pk; yp = function (t) { return A1 * Math.exp(k * t); }; ypT = joinTerms([[A1, ek || "1"]]);
        ypNote = L("เดารูป y_p = A" + (ek ? "e^{kt}" : "") + " (หน้าตาเดียวกับด้านขวา) แทนลงไปได้ A·P(" + nice(k) + ") = " + nice(F) + " โดย P(" + nice(k) + ") = " + nice(Pk),
          "Guess y_p = A" + (ek ? "e^{kt}" : "") + " (same shape as the right side); substituting gives A·P(" + nice(k) + ") = " + nice(F) + " with P(" + nice(k) + ") = " + nice(Pk));
      } else if (Math.abs(dPk) > 1e-10 * Math.max(1, Math.abs(a), Math.abs(b))) {
        var A2 = F / dPk; yp = function (t) { return A2 * t * Math.exp(k * t); }; ypT = joinTerms([[A2, "t" + (ek ? "\\," + ek : "")]]);
        ypNote = L("k = " + nice(k) + " เป็นรากของสมการลักษณะเฉพาะ รูปเดาเดิมจะถูกด้านซ้ายกลืนหายเป็นศูนย์ จึงคูณด้วย t: y_p = A t" + (ek ? "e^{kt}" : "") + " ได้ A = F/P′(k)",
          "k = " + nice(k) + " is a root of the characteristic equation, so the plain guess is annihilated; multiply by t: y_p = A t" + (ek ? "e^{kt}" : "") + ", A = F/P′(k)");
      } else {
        var A3 = F / (2 * a); yp = function (t) { return A3 * t * t * Math.exp(k * t); }; ypT = joinTerms([[A3, "t^2" + (ek ? "\\," + ek : "")]]);
        ypNote = L("k เป็นรากซ้ำ ต้องคูณด้วย t² : y_p = A t²" + (ek ? "e^{kt}" : "") + " ได้ A = F/(2a)", "k is a double root, multiply by t²: y_p = A t²" + (ek ? "e^{kt}" : "") + ", A = F/(2a)");
      }
    } else if (ft === "cos" || ft === "sin") {
      var w = k, p = order === 2 ? c - a * w * w : b, q = order === 2 ? b * w : a * w, D2 = p * p + q * q;
      if (D2 > 1e-14 * Math.max(1, c * c, a * a * w * w * w * w, b * b * w * w)) {
        var cc, ss; // y_p = cc cos wt + ss sin wt
        if (ft === "cos") { cc = F * p / D2; ss = F * q / D2; } else { cc = -F * q / D2; ss = F * p / D2; }
        yp = function (t) { return cc * Math.cos(w * t) + ss * Math.sin(w * t); };
        ypT = joinTerms([[cc, "\\cos " + argT(w)], [ss, "\\sin " + argT(w)]]);
        var R = Math.sqrt(cc * cc + ss * ss), ph = Math.atan2(ss, cc);
        res.amp = R; res.phase = ph;
        ypNote = L("ด้านขวาเป็น " + ft + " จึงเดา y_p = A cos ωt + B sin ωt (ต้องมีทั้งคู่ เพราะดิฟ cos ได้ −sin) แทนแล้วเทียบสัมประสิทธิ์ของ cos กับ sin ได้ระบบสมการ 2 ตัวแปร ",
          "The right side is a " + ft + ", so guess y_p = A cos ωt + B sin ωt (both are needed, since the derivative of cos is −sin); matching the cos and sin coefficients gives two equations ")
          + tg("sumcos") + "<br>" + L("รวมเป็นคลื่นเดียว: y_p = R cos(ωt − φ) โดย R = " + fmt(R, 4) + ", φ = " + fmt(ph, 4) + " rad (" + fmt(ph * 180 / PI, 2) + "°) ",
          "As one wave: y_p = R cos(ωt − φ) with R = " + fmt(R, 4) + ", φ = " + fmt(ph, 4) + " rad (" + fmt(ph * 180 / PI, 2) + "°) ") + tg("harmonic");
      } else {
        // resonance (order 2, b = 0, c = a w^2)
        var A4 = F / (2 * a * w);
        if (ft === "cos") { yp = function (t) { return A4 * t * Math.sin(w * t); }; ypT = joinTerms([[A4, "t\\sin " + argT(w)]]); }
        else { yp = function (t) { return -A4 * t * Math.cos(w * t); }; ypT = joinTerms([[-A4, "t\\cos " + argT(w)]]); }
        res.resonance = true;
        ypNote = L("ω ตรงกับความถี่ธรรมชาติพอดี (เรโซแนนซ์) รูปเดา A cos ωt + B sin ωt เป็นคำตอบเอกพันธ์ไปแล้ว ต้องคูณด้วย t แอมพลิจูดจึงโตตามเวลาไม่หยุด",
          "ω equals the natural frequency (resonance); A cos ωt + B sin ωt already solves the homogeneous equation, so multiply by t — the amplitude grows without bound");
      }
    }
    res.yp = yp;
    if (ft !== "0") st.push({ h: L("คำตอบเฉพาะ (วิธีเดาสัมประสิทธิ์)", "Particular solution (undetermined coefficients)"), tex: "y_p = " + ypT, note: ypNote, html: true });
    // 3) constants from the initial conditions
    var hh = 1e-5, yp0 = yp(0), ypd0 = (yp(hh) - yp(-hh)) / (2 * hh), y0 = +o.y0 || 0, v0 = +o.v0 || 0, C;
    if (order === 1) { C = [y0 - yp0]; }
    else {
      var d = basis.d0, a11 = d[0][0], a12 = d[1][0], a21 = d[0][1], a22 = d[1][1], r1v = y0 - yp0, r2v = v0 - ypd0, det = a11 * a22 - a12 * a21;
      C = [(r1v * a22 - a12 * r2v) / det, (a11 * r2v - a21 * r1v) / det];
    }
    res.C = C;
    var y = order === 1 ? function (t) { return C[0] * basis[0](t) + yp(t); } : function (t) { return C[0] * basis[0](t) + C[1] * basis[1](t) + yp(t); };
    res.y = y;
    st.forEach(function (x) { x.note = fixTex(x.note); });
    var icTex = order === 1 ? "y(0) = " + nice(y0) + "\\;\\Rightarrow\\; C = " + nice(C[0]) : "y(0) = " + nice(y0) + ",\\; y'(0) = " + nice(v0) + "\\;\\Rightarrow\\; C_1 = " + nice(C[0]) + ",\\; C_2 = " + nice(C[1]);
    st.push({ h: L("หาค่าคงที่จากเงื่อนไขเริ่มต้น", "Constants from the initial conditions"), tex: icTex,
      note: order === 2 ? L("แทน t = 0 ใน y และ y′ ได้ระบบสมการเชิงเส้น 2 ตัวแปร", "Put t = 0 into y and y′ to get two linear equations") : "" });
    // final TeX
    var hTerms;
    if (order === 1) hTerms = [[C[0], expT(-b / a) || "1"]];
    else if (cas === "real") hTerms = [[C[0], expT(res.roots[0][0]) || "1"], [C[1], expT(res.roots[1][0]) || "1"]];
    else if (cas === "repeated") { var e0 = expT(res.roots[0][0]); hTerms = [[C[0], e0 || "1"], [C[1], "t" + (e0 ? "\\," + e0 : "")]]; }
    else { var ea = expT(res.alpha); hTerms = [[C[0], (ea ? ea + "\\," : "") + "\\cos " + argT(res.beta)], [C[1], (ea ? ea + "\\," : "") + "\\sin " + argT(res.beta)]]; }
    var hT = joinTerms(hTerms);
    res.texY = "y(t) = " + (ft === "0" ? hT : (hT === "0" ? ypT : hT + (ypT.charAt(0) === "-" ? " " : " + ") + ypT));
    // 4) independent numerical check (RK4 on the original equation)
    var tEnd = o.tEnd || autoT(res);
    res.tEnd = tEnd;
    var g = order === 2 ? function (t, Y) { return [Y[1], (f(t) - b * Y[1] - c * Y[0]) / a]; } : function (t, Y) { return (f(t) - b * Y) / a; };
    var num = rk4(g, 0, order === 2 ? [y0, v0] : y0, tEnd, 4000), maxErr = 0, maxY = 1e-9;
    num.forEach(function (pt) { var yn = order === 2 ? pt[1][0] : pt[1], ya = y(pt[0]); maxErr = Math.max(maxErr, Math.abs(yn - ya)); maxY = Math.max(maxY, Math.abs(yn)); });
    res.num = num.map(function (pt) { return [pt[0], order === 2 ? pt[1][0] : pt[1]]; });
    res.relErr = maxErr / maxY; res.ok = res.relErr < 1e-5;
    // damping classification
    if (order === 2 && a > 0 && c > 0 && b >= 0) { res.zeta = b / (2 * Math.sqrt(a * c)); res.wn = Math.sqrt(c / a); }
    return res;
  }
  function autoT(r) {
    var T = 10;
    if (r.order === 1 && r.r1 != null) T = Math.min(Math.max(6 / (Math.abs(r.r1) || 0.6), 2), 30);
    if (r.roots) {
      var slow = Math.min.apply(null, r.roots.map(function (x) { return Math.abs(x[0]) || 1e9; }));
      if (r.cas === "complex") T = Math.max(4 * PI / r.beta, Math.min(6 / Math.max(Math.abs(r.alpha), 1e-9), 30));
      else T = Math.min(Math.max(6 / slow, 2), 30);
    }
    if (r.resonance) T = Math.max(T, 8 * PI / (r.beta || 1));
    return Math.min(Math.max(T, 2), 40);
  }

  // ------------------------------------------------------------------ exact fractions for discrete convolution
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function Fr(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g }; }
  function fadd(x, y) { return Fr(x.n * y.d + y.n * x.d, x.d * y.d); }
  function fmul(x, y) { return Fr(x.n * y.n, x.d * y.d); }
  function fparse(s) {
    s = String(s).trim().replace(/[−–]/g, "-");
    var m = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(s); if (m) { if (+m[2] === 0) throw new Error("/0"); return Fr(+m[1], +m[2]); }
    m = /^([+-]?)(\d*)\.(\d+)$/.exec(s); if (m) { var den = Math.pow(10, m[3].length); return Fr((m[1] === "-" ? -1 : 1) * (+(m[2] || 0) * den + +m[3]), den); }
    if (/^[+-]?\d+$/.test(s)) return Fr(+s, 1);
    throw new Error(L("อ่านตัวเลขไม่ได้: ", "Cannot read the number: ") + s);
  }
  function ftex(x) { return x.d === 1 ? String(x.n) : (x.n < 0 ? "-" : "") + "\\tfrac{" + Math.abs(x.n) + "}{" + x.d + "}"; }
  function ftxt(x) { return x.d === 1 ? String(x.n) : x.n + "/" + x.d; }
  function dconv(x, h) { // arrays of fractions
    var y = []; for (var i = 0; i < x.length + h.length - 1; i++) y.push(Fr(0, 1));
    x.forEach(function (xv, i) { h.forEach(function (hv, j) { y[i + j] = fadd(y[i + j], fmul(xv, hv)); }); });
    return y;
  }

  // ------------------------------------------------------------------ polynomial roots (Durand–Kerner), complex helpers
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function roots(coef) { // coef[0] z^n + … + coef[n]
    var c = coef.slice(); while (c.length && Math.abs(c[0]) < 1e-14) c.shift();
    var n = c.length - 1; if (n < 1) return [];
    var a0 = c[0]; c = c.map(function (v) { return v / a0; });
    var z = []; for (var k = 0; k < n; k++) z.push([Math.cos(2 * PI * k / n + 0.4) * 0.9, Math.sin(2 * PI * k / n + 0.4) * 0.9]);
    for (var it = 0; it < 500; it++) {
      var mv = 0;
      for (var i = 0; i < n; i++) {
        var p = [1, 0]; for (var j = 1; j <= n; j++) p = [p[0] * z[i][0] - p[1] * z[i][1] + c[j], p[0] * z[i][1] + p[1] * z[i][0]];
        var q = [1, 0]; for (j = 0; j < n; j++) if (j !== i) q = cmul(q, [z[i][0] - z[j][0], z[i][1] - z[j][1]]);
        var dz = cdiv(p, q); z[i] = [z[i][0] - dz[0], z[i][1] - dz[1]]; mv = Math.max(mv, Math.abs(dz[0]) + Math.abs(dz[1]));
      }
      if (mv < 1e-14) break;
    }
    return z.map(function (r) { return [Math.abs(r[0]) < 1e-12 ? 0 : r[0], Math.abs(r[1]) < 1e-12 ? 0 : r[1]]; });
  }
  function freqResp(b, a, w) { // H(e^{jw}) with b, a in powers of z^{-1}
    function ev(p) { var re = 0, im = 0; p.forEach(function (v, k) { re += v * Math.cos(-w * k); im += v * Math.sin(-w * k); }); return [re, im]; }
    return cdiv(ev(b), ev(a));
  }
  function impulse(b, a, N) {
    var x = [], y = []; for (var n = 0; n < N; n++) x.push(n === 0 ? 1 : 0);
    for (n = 0; n < N; n++) { var s = 0, k; for (k = 0; k < b.length; k++) if (n - k >= 0) s += b[k] * x[n - k]; for (k = 1; k < a.length; k++) if (n - k >= 0) s -= a[k] * y[n - k]; y.push(s / a[0]); }
    return y;
  }

  // ------------------------------------------------------------------ Fourier transform pairs (f in Hz)
  function sinc(x) { return x === 0 ? 1 : Math.sin(PI * x) / (PI * x); }
  var FT = {
    rect: { sup: function (p) { return [-p.T / 2, p.T / 2]; }, x: function (t, p) { return Math.abs(t) < p.T / 2 ? 1 : Math.abs(t) === p.T / 2 ? 0.5 : 0; }, X: function (f, p) { return [p.T * sinc(f * p.T), 0]; },
      tx: "x(t) = \\operatorname{rect}\\!\\left(\\tfrac{t}{T}\\right)", tX: "X(f) = T\\,\\operatorname{sinc}(fT) = \\dfrac{\\sin(\\pi f T)}{\\pi f}" },
    tri: { sup: function (p) { return [-p.T, p.T]; }, x: function (t, p) { return Math.max(0, 1 - Math.abs(t) / p.T); }, X: function (f, p) { var s = sinc(f * p.T); return [p.T * s * s, 0]; },
      tx: "x(t) = \\operatorname{tri}\\!\\left(\\tfrac{t}{T}\\right)", tX: "X(f) = T\\,\\operatorname{sinc}^2(fT)" },
    exp: { sup: function () { return [0, 60]; }, x: function (t, p) { return t > 0 ? Math.exp(-p.a * t) : t === 0 ? 0.5 : 0; }, X: function (f, p) { return cdiv([1, 0], [p.a, 2 * PI * f]); },
      tx: "x(t) = e^{-at}u(t)", tX: "X(f) = \\dfrac{1}{a + j2\\pi f}" },
    dexp: { x: function (t, p) { return Math.exp(-p.a * Math.abs(t)); }, X: function (f, p) { return [2 * p.a / (p.a * p.a + 4 * PI * PI * f * f), 0]; },
      tx: "x(t) = e^{-a|t|}", tX: "X(f) = \\dfrac{2a}{a^2 + (2\\pi f)^2}" },
    gauss: { x: function (t, p) { return Math.exp(-PI * t * t / (p.T * p.T)); }, X: function (f, p) { return [p.T * Math.exp(-PI * f * f * p.T * p.T), 0]; },
      tx: "x(t) = e^{-\\pi (t/T)^2}", tX: "X(f) = T\\,e^{-\\pi (fT)^2}" },
    mod: { sup: function (p) { return [-p.T / 2, p.T / 2]; }, x: function (t, p) { return (Math.abs(t) < p.T / 2 ? 1 : 0) * Math.cos(2 * PI * p.f0 * t); }, X: function (f, p) { return [p.T / 2 * (sinc((f - p.f0) * p.T) + sinc((f + p.f0) * p.T)), 0]; },
      tx: "x(t) = \\cos(2\\pi f_0 t)\\,\\operatorname{rect}\\!\\left(\\tfrac{t}{T}\\right)", tX: "X(f) = \\tfrac{T}{2}\\big[\\operatorname{sinc}((f-f_0)T) + \\operatorname{sinc}((f+f_0)T)\\big]" }
  };
  function ftNumeric(key, f, p) { // ∫ x(t) e^{-j2πft} dt by Simpson over the support (no jump inside the interval)
    var S = FT[key], ab = S.sup ? S.sup(p) : [-40, 40], n = 40000, h = (ab[1] - ab[0]) / n, re = 0, im = 0, eps = 1e-12;
    for (var i = 0; i <= n; i++) { var t = ab[0] + i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2), tt = Math.min(Math.max(t, ab[0] + eps), ab[1] - eps), xv = S.x(i === 0 || i === n ? tt : t, p); re += w * xv * Math.cos(2 * PI * f * t); im -= w * xv * Math.sin(2 * PI * f * t); }
    return [re * h / 3, im * h / 3];
  }
  function aliasFreq(f, fs) { var r = f - fs * Math.round(f / fs); return Math.abs(r); }

  var API = { compile: compile, solveLin: solveLin, rk4: rk4, dconv: dconv, fparse: fparse, ftxt: ftxt, roots: roots, freqResp: freqResp, impulse: impulse, FT: FT, ftNumeric: ftNumeric, aliasFreq: aliasFreq, sinc: sinc, tg: tg };
  root.MSLab = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (!doc) return;

  // ================================================================== DOM widgets
  function h(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tex(el, s, disp) { if (MK) MK.tex(el, s, disp); else el.textContent = s; }
  function texs(s, disp) { return MK ? MK.texStr(s, disp) : s; }
  function slider(label, min, max, step, val, unit) {
    var row = h("div", "lap-row"); row.appendChild(h("span", "lap-lbl", label));
    var r = h("input"); r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = val; row.appendChild(r);
    var out = h("output"); row.appendChild(out);
    r.upd = function () { out.textContent = fmt(+r.value, 3) + (unit || ""); }; r.upd();
    r.addEventListener("input", r.upd); row.input = r; return row;
  }
  function chips(list, on, cb) {
    var box = h("div", "lap-chips"), btns = [];
    list.forEach(function (it) {
      var b = h("button", "lap-chip" + (it[0] === on ? " on" : ""), it[1]); b.type = "button";
      b.addEventListener("click", function () { btns.forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); cb(it[0]); });
      btns.push(b); box.appendChild(b);
    });
    return box;
  }
  function numIn(label, val, w) { var row = h("label", "lap-row"); row.appendChild(h("span", "lap-lbl", label)); var i = h("input", "lap-in sm"); i.value = val; i.inputMode = "decimal"; if (w) i.style.maxWidth = w; row.appendChild(i); row.input = i; return row; }
  function playBtn(cb) { var b = h("button", "lap-chip", "▶ " + L("เล่น", "Play")); b.type = "button"; var id = null; b.addEventListener("click", function () { if (id) { cancelAnimationFrame(id); id = null; b.textContent = "▶ " + L("เล่น", "Play"); return; } b.textContent = "❚❚ " + L("หยุด", "Pause"); var last = null; (function step(ts) { if (last != null) cb((ts - last) / 1000); last = ts; id = requestAnimationFrame(step); })(); }); return b; }
  function stems(pts, color) { var segs = [], marks = []; pts.forEach(function (p) { segs.push({ x1: p[0], y1: 0, x2: p[0], y2: p[1], color: color, width: 1.8 }); marks.push({ x: p[0], y: p[1], color: color, r: 3.5 }); }); return { segs: segs, marks: marks }; }

  // ---------------------------------------------------------------- ms-trigd
  var TRIG = {
    sin: { f: Math.sin, d: Math.cos, tf: "\\sin x", td: "\\cos x", lo: -1.6, hi: 1.6 },
    cos: { f: Math.cos, d: function (x) { return -Math.sin(x); }, tf: "\\cos x", td: "-\\sin x", lo: -1.6, hi: 1.6 },
    tan: { f: Math.tan, d: function (x) { var c = Math.cos(x); return 1 / (c * c); }, tf: "\\tan x", td: "\\sec^2 x", lo: -4, hi: 4 },
    sec: { f: function (x) { return 1 / Math.cos(x); }, d: function (x) { return Math.tan(x) / Math.cos(x); }, tf: "\\sec x", td: "\\sec x\\tan x", lo: -4, hi: 4 }
  };
  function initTrigd(el) {
    var key = el.dataset.f || "sin", x0 = +el.dataset.x0 || 0.9, deg = false;
    el.innerHTML = "";
    var top = h("div", "lap-row");
    top.appendChild(chips([["sin", "sin x"], ["cos", "cos x"], ["tan", "tan x"], ["sec", "sec x"]], key, function (k) { key = k; draw(); }));
    top.appendChild(chips([["rad", L("x เป็นเรเดียน", "x in radians")], ["deg", L("x เป็นองศา", "x in degrees")]], "rad", function (k) { deg = k === "deg"; draw(); }));
    el.appendChild(top);
    var sl = slider("x₀", 0, 2 * PI, 0.01, x0, " rad"); el.appendChild(sl);
    var pb = playBtn(function (dt) { var v = +sl.input.value + dt * 0.7; if (v > 2 * PI) v -= 2 * PI; sl.input.value = v; sl.input.upd(); draw(); }); sl.appendChild(pb);
    var grid = h("div", "ms-tgrid"), circ = h("div", "ms-circ"), plots = h("div", "ms-plots");
    grid.appendChild(circ); grid.appendChild(plots); el.appendChild(grid);
    var info = h("div", "lap-note"); el.appendChild(info);
    sl.input.addEventListener("input", draw);
    function draw() {
      var T = TRIG[key], x = +sl.input.value, k = deg ? PI / 180 : 1; // x is always the angle in radians; in degree mode the variable is X = x·180/π
      var fx = T.f(x), slopeRad = T.d(x), slope = slopeRad * k;
      var hN = 1e-5, numSlope = deg ? (T.f((x * 180 / PI + hN) * PI / 180) - T.f((x * 180 / PI - hN) * PI / 180)) / (2 * hN) : (T.f(x + hN) - T.f(x - hN)) / (2 * hN);
      // unit circle
      var cx = Math.cos(x), sy = Math.sin(x), R = 80, O = 100;
      var s = '<svg class="ms-uc" viewBox="0 0 200 200" role="img" aria-label="unit circle">';
      s += '<circle cx="' + O + '" cy="' + O + '" r="' + R + '" class="ms-ucc"/><line x1="10" y1="' + O + '" x2="190" y2="' + O + '" class="mk-axis"/><line x1="' + O + '" y1="10" x2="' + O + '" y2="190" class="mk-axis"/>';
      var px = O + R * cx, py = O - R * sy;
      s += '<path d="M' + (O + 22) + ' ' + O + ' A22 22 0 ' + (x > PI ? 1 : 0) + ' 0 ' + (O + 22 * cx).toFixed(1) + ' ' + (O - 22 * sy).toFixed(1) + '" class="ms-arc"/>';
      s += '<line x1="' + O + '" y1="' + O + '" x2="' + px.toFixed(1) + '" y2="' + py.toFixed(1) + '" class="ms-rad"/>';
      s += '<line x1="' + px.toFixed(1) + '" y1="' + O + '" x2="' + px.toFixed(1) + '" y2="' + py.toFixed(1) + '" class="ms-sinl"/>';
      s += '<line x1="' + O + '" y1="' + O + '" x2="' + px.toFixed(1) + '" y2="' + O + '" class="ms-cosl"/>';
      // tangent direction of the moving point (velocity) = (−sin, cos)
      s += '<line x1="' + px.toFixed(1) + '" y1="' + py.toFixed(1) + '" x2="' + (px - 34 * sy).toFixed(1) + '" y2="' + (py - 34 * cx).toFixed(1) + '" class="ms-vel" marker-end="url(#msArr)"/>';
      s += '<defs><marker id="msArr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--ok)"/></marker></defs>';
      s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="5" fill="var(--accent)"/>';
      s += '<text x="' + (px + 6).toFixed(1) + '" y="' + (O + 14) + '" class="mk-ann">cos</text><text x="' + (px + 6).toFixed(1) + '" y="' + ((O + py) / 2).toFixed(1) + '" class="mk-ann">sin</text></svg>';
      circ.innerHTML = s + '<p class="lap-help">' + L("ลูกศรเขียวคือทิศที่จุดกำลังเคลื่อน ความเร็วแนวตั้งของจุด (อัตราที่ sin เปลี่ยน) เท่ากับ cos x₀ พอดี", "The green arrow is the direction the point is moving; its vertical speed (how fast sin changes) is exactly cos x₀") + "</p>";
      // graphs
      var a = 0, b = 2 * PI, pts = MK.sample(T.f, a, b, 500), dpts = MK.sample(function (t) { return T.d(t) * k; }, a, b, 500);
      var tl = 0.9, segs = [{ x1: x - tl, y1: fx - slopeRad * tl, x2: x + tl, y2: fx + slopeRad * tl, color: "var(--signal)", width: 2 }];
      var p1 = MK.plot({ w: 620, h: 220, xmin: a, xmax: b, ymin: T.lo, ymax: T.hi, id: MK.uid("tg"), series: [{ pts: pts, color: "var(--accent)" }], segs: segs, marks: [{ x: x, y: fx }], vlines: [{ x: x }], xlabel: "x (rad)", ylabel: "f(x) = " + key + " x", clip: 6 });
      var dlo = deg ? T.lo * k * 1.2 : T.lo, dhi = deg ? T.hi * k * 1.2 : T.hi;
      var p2 = MK.plot({ w: 620, h: 190, xmin: a, xmax: b, ymin: dlo, ymax: dhi, id: MK.uid("tg"), series: [{ pts: dpts, color: "var(--ok)" }], marks: [{ x: x, y: slope, color: "var(--ok)" }], vlines: [{ x: x }], xlabel: "x (rad)", ylabel: deg ? "dF/dX (X = องศา)" : "f′(x)", clip: 8 });
      plots.innerHTML = p1 + p2;
      var html = "<b>" + L("ที่", "At") + " x₀ = " + fmt(x, 3) + " rad = " + fmt(x * 180 / PI, 1) + "°</b> · f(x₀) = " + fmt(fx, 4) + " · " + L("ความชันวัดจากกราฟ", "slope measured on the graph") + " = <b>" + fmt(numSlope, 4) + "</b> · " + L("สูตร", "formula") + " " + texs(deg ? "\\tfrac{\\pi}{180}\\," + T.td.replace(/x/g, "x") : T.td) + " = <b>" + fmt(slope, 4) + "</b>";
      if (deg) html += "<br>" + L("เมื่อวัดมุมเป็นองศา ความชันเล็กลง π/180 ≈ 0.01745 เท่า สูตร d/dx sin x = cos x จึงใช้ได้เฉพาะเรเดียน ", "Measuring the angle in degrees shrinks every slope by π/180 ≈ 0.01745, so d/dx sin x = cos x holds only in radians ") + tg("rad");
      else if (key === "sin") html += "<br>" + L("กราฟสีเขียว (อนุพันธ์) คือ sin ที่เลื่อนไปทางซ้าย π/2 ซึ่งก็คือ cos ", "The green graph (the derivative) is sin shifted left by π/2, which is cos ") + '<a class="tg" href="/learn/trigonometry/#symmetry" title="sin(x + π/2) = cos x">' + L("เลื่อนเฟส 90°", "90° phase shift") + "</a>";
      else if (key === "tan") html += "<br>" + L("ความชันของ tan ไม่เคยติดลบ เพราะ sec²x ≥ 1 เสมอ ", "tan never slopes downward because sec²x ≥ 1 ") + '<a class="tg" href="/learn/trigonometry/#pythagorean" title="1 + tan²x = sec²x">1 + tan²x = sec²x</a>';
      info.innerHTML = html;
    }
    draw();
  }

  // ---------------------------------------------------------------- ms-sinlim
  function initSinlim(el) {
    el.innerHTML = "";
    var sl = slider("h", 0.02, 1.5, 0.01, +el.dataset.h || 0.9, " rad"); el.appendChild(sl);
    var grid = h("div", "ms-tgrid"), pic = h("div", "ms-circ ms-big"), tab = h("div", ""); grid.appendChild(pic); grid.appendChild(tab); el.appendChild(grid);
    sl.input.addEventListener("input", draw);
    function draw() {
      var x = +sl.input.value, R = 132, O = 24, Y = 196, c = Math.cos(x), s = Math.sin(x), t = Math.tan(x);
      var P = [O + R * c, Y - R * s], A = [O + R, Y], T = [O + R, Y - R * Math.min(t, 1.4)];
      var svg = '<svg class="ms-uc" viewBox="0 0 200 210" role="img" aria-label="sin h &lt; h &lt; tan h">';
      svg += '<path d="M' + O + ' ' + Y + ' L' + A[0] + ' ' + Y + ' L' + T[0].toFixed(1) + ' ' + T[1].toFixed(1) + ' Z" class="ms-a3"/>';
      svg += '<path d="M' + O + ' ' + Y + ' L' + A[0] + ' ' + Y + ' A' + R + ' ' + R + ' 0 0 0 ' + P[0].toFixed(1) + ' ' + P[1].toFixed(1) + ' Z" class="ms-a2"/>';
      svg += '<path d="M' + O + ' ' + Y + ' L' + A[0] + ' ' + Y + ' L' + P[0].toFixed(1) + ' ' + P[1].toFixed(1) + ' Z" class="ms-a1"/>';
      svg += '<path d="M' + (O + R) + ' ' + Y + ' A' + R + ' ' + R + ' 0 0 0 ' + O + ' ' + (Y - R) + '" class="ms-ucc"/>';
      svg += '<line x1="' + P[0].toFixed(1) + '" y1="' + Y + '" x2="' + P[0].toFixed(1) + '" y2="' + P[1].toFixed(1) + '" class="ms-sinl"/>';
      svg += '<text x="' + (P[0] - 22).toFixed(1) + '" y="' + ((Y + P[1]) / 2).toFixed(1) + '" class="mk-ann">sin h</text><text x="' + (A[0] + 3) + '" y="' + ((Y + T[1]) / 2).toFixed(1) + '" class="mk-ann">tan h</text>';
      svg += '<text x="' + (O + 4) + '" y="' + (Y + 14) + '" class="mk-ann">O</text><text x="' + (A[0] - 6) + '" y="' + (Y + 14) + '" class="mk-ann">A</text></svg>';
      pic.innerHTML = svg;
      var rows = [0.5, 0.1, 0.01, 0.001].map(function (v) { return "<tr><td>" + v + "</td><td>" + (Math.sin(v) / v).toFixed(9) + "</td><td>" + Math.cos(v).toFixed(9) + "</td></tr>"; }).join("");
      tab.innerHTML = '<p class="lap-note"><span class="ms-sw ms-a1"></span>' + L("สามเหลี่ยมเล็ก", "small triangle") + " ½ sin h = " + fmt(s / 2, 4) + "<br><span class=\"ms-sw ms-a2\"></span>" + L("เซกเตอร์", "sector") + " ½ h = " + fmt(x / 2, 4)
        + "<br><span class=\"ms-sw ms-a3\"></span>" + L("สามเหลี่ยมใหญ่", "large triangle") + " ½ tan h = " + fmt(t / 2, 4) + "</p>"
        + '<div class="lap-eq">' + texs("\\cos h = " + fmt(c, 5) + "\\;\\le\\; \\frac{\\sin h}{h} = " + fmt(s / x, 5) + "\\;\\le\\; 1", true) + "</div>"
        + '<table class="lap-pt"><thead><tr><th>h</th><th>sin h / h</th><th>cos h</th></tr></thead><tbody>' + rows + "</tbody></table>";
    }
    draw();
  }

  // ---------------------------------------------------------------- ms-field (slope field + Euler / Heun / RK4)
  function initField(el) {
    var d = el.dataset, src = d.f || "t - y", t0 = +(d.t0 || 0), y0 = +(d.y0 || 1), tmax = +(d.tmax || 4), ymin = +(d.ymin || -2), ymax = +(d.ymax || 3), hstep = +(d.h || 0.5);
    el.innerHTML = "";
    var r1 = h("div", "lap-row"); r1.appendChild(h("span", "lap-lbl", "y′ = f(t, y) =")); var inp = h("input", "lap-in"); inp.value = src; r1.appendChild(inp); el.appendChild(r1);
    var pres = [["t - y", "t − y"], ["y", "y"], ["-2*t*y", "−2ty"], ["y*(1-y)", L("โลจิสติก y(1−y)", "logistic y(1−y)")], ["sin(t) - y", "sin t − y"], ["t^2 - y^2", "t² − y²"]];
    el.appendChild(chips(pres, src, function (k) { inp.value = k; y0r.input.value = y0; compute(); }));
    var hr = slider(L("ขนาดก้าว h", "step h"), 0.05, 1, 0.05, hstep); el.appendChild(hr);
    var y0r = numIn("y(" + t0 + ") =", y0); el.appendChild(y0r);
    var show = { e: true, he: true, rk: true };
    el.appendChild(chips([["all", L("แสดงทั้งสามวิธี", "all three methods")], ["e", "Euler"], ["he", L("Heun (ออยเลอร์ปรับปรุง)", "Heun (improved Euler)")], ["rk", "RK4"]], "all", function (k) { show = k === "all" ? { e: true, he: true, rk: true } : { e: k === "e", he: k === "he", rk: k === "rk" }; compute(); }));
    var plot = h("div", ""); el.appendChild(plot);
    var help = h("p", "lap-help", L("แตะหรือลากบนกราฟเพื่อเลือกจุดเริ่มต้นใหม่ ขีดสั้น ๆ แต่ละขีดคือความชัน f(t, y) ที่จุดนั้น", "Tap or drag on the graph to choose a new starting point; each short dash is the slope f(t, y) there")); el.appendChild(help);
    var out = h("div", ""); el.appendChild(out);
    var err = h("p", "lap-err"); el.appendChild(err);
    [inp, y0r.input].forEach(function (i) { i.addEventListener("change", compute); });
    hr.input.addEventListener("input", compute);
    function method(fn, kind, y00, H) {
      var n = Math.max(1, Math.round((tmax - t0) / H)), hh = (tmax - t0) / n, t = t0, y = y00, pts = [[t, y]];
      for (var i = 0; i < n; i++) {
        var k1 = fn(t, y), yn;
        if (kind === "e") yn = y + hh * k1;
        else if (kind === "he") { var k2 = fn(t + hh, y + hh * k1); yn = y + hh / 2 * (k1 + k2); }
        else { var a2 = fn(t + hh / 2, y + hh / 2 * k1), a3 = fn(t + hh / 2, y + hh / 2 * a2), a4 = fn(t + hh, y + hh * a3); yn = y + hh / 6 * (k1 + 2 * a2 + 2 * a3 + a4); }
        t = t0 + (i + 1) * hh; y = yn; pts.push([t, y]);
        if (!isFinite(y) || Math.abs(y) > 1e6) break;
      }
      return pts;
    }
    function compute() {
      err.textContent = "";
      var fn;
      try { var c = compile(inp.value, ["t", "y"]); fn = function (t, y) { return c({ t: t, y: y }); }; fn(t0, 0); } catch (e) { err.textContent = e.message; return; }
      var y00 = +y0r.input.value; if (!isFinite(y00)) { err.textContent = L("ค่าเริ่มต้นต้องเป็นตัวเลข", "The initial value must be a number"); return; }
      var H = +hr.input.value;
      var ref = method(fn, "rk", y00, (tmax - t0) / 4000);
      var segs = [], nx = 22, ny = 14;
      for (var i = 0; i <= nx; i++) for (var j = 0; j <= ny; j++) {
        var tt = t0 + (tmax - t0) * i / nx, yy = ymin + (ymax - ymin) * j / ny, m = fn(tt, yy); if (!isFinite(m)) continue;
        var sxs = (tmax - t0) / nx * 0.36, sys = (ymax - ymin) / ny * 0.36, ang = Math.atan2(m * sxs / sys, 1), dx = Math.cos(ang) * sxs, dy = Math.sin(ang) * sys;
        segs.push({ x1: tt - dx, y1: yy - dy, x2: tt + dx, y2: yy + dy, color: "var(--ink-3)", width: 1.1 });
      }
      var ser = [{ pts: ref, color: "var(--ink)", width: 2.6 }], rows = [];
      var yref = ref[ref.length - 1][1];
      [["e", "Euler", "var(--accent)", "6 4"], ["he", "Heun", "var(--signal)", "3 3"], ["rk", "RK4", "var(--ok)", ""]].forEach(function (mm) {
        if (!show[mm[0]]) return;
        var p = method(fn, mm[0], y00, H); ser.push({ pts: p, color: mm[2], dash: mm[3], width: 2 });
        var yend = p[p.length - 1][1]; rows.push("<tr><td>" + mm[1] + "</td><td>" + fmt(yend, 6) + "</td><td>" + fmt(Math.abs(yend - yref), 3) + "</td><td>" + (mm[0] === "e" ? "O(h)" : mm[0] === "he" ? "O(h²)" : "O(h⁴)") + "</td></tr>");
      });
      plot.innerHTML = MK.plot({ w: 640, h: 330, xmin: t0, xmax: tmax, ymin: ymin, ymax: ymax, id: MK.uid("fd"), series: ser, segs: segs, marks: [{ x: t0, y: y00, drag: "ic" }], xlabel: "t", ylabel: "y" });
      var map = MK.lastMap(), svg = plot.querySelector("svg");
      function pick(e) { var p = MK.svgPoint(svg, e), yy = map.iy(p.y); if (isFinite(yy)) { y0r.input.value = (+yy.toFixed(2)); compute(); } e.preventDefault(); }
      svg.addEventListener("pointerdown", function (e) { pick(e); var mv = function (ev) { pick(ev); }; svg.setPointerCapture(e.pointerId); svg.addEventListener("pointermove", mv); svg.addEventListener("pointerup", function up() { svg.removeEventListener("pointermove", mv); svg.removeEventListener("pointerup", up); }); });
      out.innerHTML = '<table class="lap-pt"><thead><tr><th>' + L("วิธี", "Method") + "</th><th>y(" + tmax + ")</th><th>" + L("คลาดเคลื่อน", "error") + "</th><th>" + L("อันดับความแม่น", "order") + "</th></tr></thead><tbody>" + rows.join("")
        + "<tr><td>" + L("อ้างอิง (RK4, h เล็กมาก)", "reference (RK4, tiny h)") + "</td><td>" + fmt(yref, 6) + "</td><td>—</td><td></td></tr></tbody></table>"
        + '<p class="lap-help">' + L("ลองลด h ลงครึ่งหนึ่ง: ความคลาดเคลื่อนของ Euler ลดราวครึ่งหนึ่ง Heun ลดราว 4 เท่า RK4 ลดราว 16 เท่า", "Halve h: Euler's error roughly halves, Heun's drops about 4×, RK4's about 16×") + "</p>";
    }
    compute();
  }

  // ---------------------------------------------------------------- ms-ode2 (solver with steps)
  function initOde2(el) {
    var d = el.dataset, tool = d.tool != null, order = d.order === "1" ? 1 : 2;
    el.innerHTML = "";
    var st = { order: order, a: d.a || "1", b: d.b || "2", c: d.c || "5", ft: d.ft || "0", p1: d.p1 || "1", p2: d.p2 || "1", y0: d.y0 || "1", v0: d.v0 || "0" };
    // query string (tool page) → linkable results
    if (tool && root.location) { var q = new URLSearchParams(root.location.search); Object.keys(st).forEach(function (k) { if (q.get(k) != null) st[k] = k === "order" ? (q.get(k) === "1" ? 1 : 2) : q.get(k); }); }
    var ordRow = chips([["2", L("อันดับสอง ay″ + by′ + cy = f(t)", "second order ay″ + by′ + cy = f(t)")], ["1", L("อันดับหนึ่ง ay′ + by = f(t)", "first order ay′ + by = f(t)")]], String(st.order), function (k) { st.order = k === "1" ? 1 : 2; cRow.style.display = st.order === 2 ? "" : "none"; v0Row.style.display = st.order === 2 ? "" : "none"; run(); });
    if (tool || d.choose != null) el.appendChild(ordRow);
    var coef = h("div", "lap-row ms-coef"), aRow = numIn("a =", st.a), bRow = numIn("b =", st.b), cRow = numIn("c =", st.c);
    [aRow, bRow, cRow].forEach(function (r) { coef.appendChild(r); }); el.appendChild(coef);
    var fRow = h("div", "lap-row"); fRow.appendChild(h("span", "lap-lbl", "f(t) ="));
    fRow.appendChild(chips([["0", "0"], ["K", L("ค่าคงที่ K", "constant K")], ["exp", "A e^{kt}".replace("^{kt}", "ᵏᵗ")], ["cos", "A cos ωt"], ["sin", "A sin ωt"]], st.ft, function (k) { st.ft = k; paramShow(); run(); }));
    el.appendChild(fRow);
    var par = h("div", "lap-row"), p1Row = numIn("A =", st.p1), p2Row = numIn("ω =", st.p2); par.appendChild(p1Row); par.appendChild(p2Row); el.appendChild(par);
    var ic = h("div", "lap-row"), y0Row = numIn("y(0) =", st.y0), v0Row = numIn("y′(0) =", st.v0); ic.appendChild(y0Row); ic.appendChild(v0Row); el.appendChild(ic);
    function paramShow() {
      par.style.display = st.ft === "0" ? "none" : "";
      p1Row.firstChild.textContent = st.ft === "K" ? "K =" : "A =";
      p2Row.style.display = st.ft === "exp" || st.ft === "cos" || st.ft === "sin" ? "" : "none";
      p2Row.firstChild.textContent = st.ft === "exp" ? "k =" : "ω =";
    }
    if (st.order === 1) { cRow.style.display = "none"; v0Row.style.display = "none"; }
    paramShow();
    if (tool) {
      var pr = [[L("สปริงหน่วงน้อย", "underdamped spring"), { order: 2, a: 1, b: 2, c: 5, ft: "0", y0: 1, v0: 0 }], [L("RLC รับไฟ DC", "RLC with a DC source"), { order: 2, a: 1, b: 4, c: 3, ft: "K", p1: 3, y0: 0, v0: 0 }],
        [L("เรโซแนนซ์", "resonance"), { order: 2, a: 1, b: 0, c: 4, ft: "cos", p1: 1, p2: 2, y0: 0, v0: 0 }], [L("แรงบังคับไซน์ + หน่วง", "sinusoidal forcing + damping"), { order: 2, a: 1, b: 1, c: 4, ft: "cos", p1: 2, p2: 1, y0: 0, v0: 0 }],
        [L("RC ชาร์จ", "RC charging"), { order: 1, a: 1, b: 2, ft: "K", p1: 10, y0: 0 }], [L("รากซ้ำ", "repeated root"), { order: 2, a: 1, b: 4, c: 4, ft: "exp", p1: 1, p2: -2, y0: 0, v0: 1 }]];
      var box = h("div", "lap-chips"); pr.forEach(function (p) { var b = h("button", "lap-chip", p[0]); b.type = "button"; b.addEventListener("click", function () { var v = p[1]; aRow.input.value = v.a; bRow.input.value = v.b; cRow.input.value = v.c != null ? v.c : 0; p1Row.input.value = v.p1 != null ? v.p1 : 1; p2Row.input.value = v.p2 != null ? v.p2 : 1; y0Row.input.value = v.y0; v0Row.input.value = v.v0 != null ? v.v0 : 0; st.order = v.order; st.ft = v.ft; initFromState(); }); box.appendChild(b); });
      el.insertBefore(box, el.firstChild);
    }
    function initFromState() { // re-render chips states
      el.querySelectorAll(".lap-chips").forEach(function (cb) { cb.querySelectorAll(".lap-chip").forEach(function (b) { b.classList.remove("on"); }); });
      cRow.style.display = st.order === 2 ? "" : "none"; v0Row.style.display = st.order === 2 ? "" : "none"; paramShow(); run();
    }
    var go = h("button", "btn btn-primary btn-sm", L("แก้สมการ", "Solve")); go.type = "button"; go.addEventListener("click", run); el.appendChild(go);
    [aRow, bRow, cRow, p1Row, p2Row, y0Row, v0Row].forEach(function (r) { r.input.addEventListener("change", run); });
    var out = h("div", "ms-out"); el.appendChild(out);
    function val(r) { var s = String(r.input.value).replace(/[−–]/g, "-").replace(/π/g, "pi"); var v; try { v = compile(s, [])({}); } catch (e) { v = NaN; } return v; }
    function run() {
      var o = { order: st.order, a: val(aRow), b: val(bRow), c: val(cRow), ft: st.ft, p1: val(p1Row), p2: val(p2Row), y0: val(y0Row), v0: val(v0Row) };
      for (var k in o) if (typeof o[k] === "number" && !isFinite(o[k])) { out.innerHTML = '<p class="lap-err">' + L("กรอกตัวเลขให้ครบทุกช่อง (ใช้ pi, 1/2, sqrt(2) ได้)", "Fill in every box with a number (pi, 1/2, sqrt(2) are fine)") + "</p>"; return; }
      var r;
      try { r = solveLin(o); } catch (e) { out.innerHTML = '<p class="lap-err">' + e.message + "</p>"; return; }
      if (tool && root.history && root.history.replaceState) { var qs = new URLSearchParams(); qs.set("order", o.order); ["a", "b", "c", "p1", "p2", "y0", "v0"].forEach(function (k) { qs.set(k, String(o[k])); }); qs.set("ft", o.ft); root.history.replaceState(null, "", "?" + qs.toString()); }
      var html = '<div class="lap-eq">' + texs(r.eqTex + (r.order === 2 ? ",\\quad y(0) = " + nice(o.y0) + ",\\; y'(0) = " + nice(o.v0) : ",\\quad y(0) = " + nice(o.y0)), true) + "</div>";
      if (r.ok) {
        html += '<ol class="lap-steps">' + r.steps.map(function (s) { return "<li><b>" + s.h + "</b>" + '<div class="lap-eq">' + texs(s.tex, true) + "</div>" + (s.note ? '<p class="lap-note">' + s.note + "</p>" : "") + "</li>"; }).join("") + "</ol>";
        html += '<div class="lap-ans">' + texs(r.texY, true) + "</div>";
        html += '<p><span class="lap-flag ok">✓ ' + L("ตรวจด้วยวิธีเชิงตัวเลข RK4 แล้ว ต่างกันไม่เกิน ", "Checked against RK4, relative difference ") + fmt(r.relErr, 2) + "</span></p>";
      } else {
        html += '<p><span class="lap-flag no">' + L("สูตรรูปปิดไม่ผ่านการตรวจเชิงตัวเลข จึงแสดงเฉพาะกราฟจาก RK4", "The closed form did not pass the numerical check, so only the RK4 graph is shown") + "</span></p>";
      }
      if (r.zeta != null && o.ft !== "exp") html += '<p class="lap-note">' + L("อัตราส่วนการหน่วง ", "Damping ratio ") + texs("\\zeta = \\tfrac{b}{2\\sqrt{ac}} = " + fmt(r.zeta, 4)) + " · " + texs("\\omega_n = \\sqrt{c/a} = " + fmt(r.wn, 4)) + " · " + (r.zeta === 0 ? L("ไม่มีการหน่วง แกว่งตลอดไป", "undamped: oscillates forever") : r.zeta < 1 ? L("หน่วงน้อย (underdamped) แกว่งแล้วค่อยหยุด", "underdamped: rings, then settles") : near(r.zeta, 1, 1e-9) ? L("หน่วงวิกฤต (critically damped) เข้าเร็วที่สุดโดยไม่แกว่ง", "critically damped: fastest without overshoot") : L("หน่วงเกิน (overdamped) ค่อย ๆ เข้าโดยไม่แกว่ง", "overdamped: creeps in without oscillating")) + "</p>";
      var T = r.tEnd, pts = MK.sample(r.y, 0, T, 600), ser = [{ pts: r.ok ? pts : r.num, color: "var(--accent)", width: 2.4 }];
      if (r.ok) ser.push({ pts: r.num.filter(function (p, i) { return i % 50 === 0; }), color: "var(--signal)", width: 0 });
      if (o.ft !== "0") ser.unshift({ pts: MK.sample(r.f, 0, T, 400), color: "var(--ink-3)", dash: "5 4", width: 1.3 });
      var mk = r.ok ? r.num.filter(function (p, i) { return i % 200 === 0; }).map(function (p) { return { x: p[0], y: p[1], color: "var(--signal)", r: 3, open: true }; }) : [];
      html += MK.plot({ w: 640, h: 260, xmin: 0, xmax: T, id: MK.uid("od"), series: ser, marks: mk, xlabel: "t", ylabel: "y(t)", clip: 1e4 });
      html += '<p class="lap-help"><span class="lap-key k2"></span> ' + L("คำตอบรูปปิด", "closed form") + " · ○ RK4" + (o.ft !== "0" ? ' · <span class="lap-key k1"></span> f(t)' : "") + "</p>";
      out.innerHTML = html;
    }
    run();
  }

  // ---------------------------------------------------------------- ms-conv (continuous convolution)
  var CSIG = {
    rect: [L("พัลส์ 0 ≤ t < 1", "pulse 0 ≤ t < 1"), function (t) { return t >= 0 && t < 1 ? 1 : 0; }],
    step: ["u(t)", function (t) { return t >= 0 ? 1 : 0; }],
    exp: ["e^{−t}u(t)".replace("^{−t}", "⁻ᵗ"), function (t) { return t >= 0 ? Math.exp(-t) : 0; }],
    tri: [L("สามเหลี่ยม 0–2", "triangle 0–2"), function (t) { return t >= 0 && t <= 2 ? 1 - Math.abs(t - 1) : 0; }],
    sinp: ["sin(πt), 0 ≤ t ≤ 1", function (t) { return t >= 0 && t <= 1 ? Math.sin(PI * t) : 0; }],
    exp2: ["e^{−2t}u(t)".replace("^{−2t}", "⁻²ᵗ"), function (t) { return t >= 0 ? Math.exp(-2 * t) : 0; }]
  };
  function initConv(el) {
    var xk = el.dataset.x || "rect", hk = el.dataset.h || "exp", A = -2, B = 6, dt = 0.01;
    el.innerHTML = "";
    var list = Object.keys(CSIG).map(function (k) { return [k, CSIG[k][0]]; });
    var r1 = h("div", "lap-row"); r1.appendChild(h("span", "lap-lbl", "x(t)")); r1.appendChild(chips(list, xk, function (k) { xk = k; recompute(); })); el.appendChild(r1);
    var r2 = h("div", "lap-row"); r2.appendChild(h("span", "lap-lbl", "h(t)")); r2.appendChild(chips(list, hk, function (k) { hk = k; recompute(); })); el.appendChild(r2);
    var sl = slider("t", -1, 5, 0.01, +(el.dataset.t || 0.6)); el.appendChild(sl);
    sl.appendChild(playBtn(function (s) { var v = +sl.input.value + s * 0.8; if (v > 5) v = -1; sl.input.value = v; sl.input.upd(); draw(); }));
    var p1 = h("div", ""), p2 = h("div", ""), info = h("p", "lap-note"); el.appendChild(p1); el.appendChild(info); el.appendChild(p2);
    sl.input.addEventListener("input", draw);
    var Y = [];
    function conv(t) { var x = CSIG[xk][1], hh = CSIG[hk][1], s = 0; for (var tau = A; tau <= B; tau += dt) s += x(tau) * hh(t - tau); return s * dt; }
    function recompute() { Y = []; for (var t = -1; t <= 5.0001; t += 0.02) Y.push([t, conv(t)]); draw(); }
    function draw() {
      var t = +sl.input.value, x = CSIG[xk][1], hh = CSIG[hk][1];
      var xs = MK.sample(x, A, B, 800), hs = MK.sample(function (tau) { return hh(t - tau); }, A, B, 800), ps = MK.sample(function (tau) { return x(tau) * hh(t - tau); }, A, B, 800);
      p1.innerHTML = MK.plot({ w: 640, h: 210, xmin: A, xmax: B, ymin: -0.15, ymax: 1.25, id: MK.uid("cv"), series: [{ pts: ps, color: "var(--ok)", fill: 0.35, width: 0 }, { pts: xs, color: "var(--accent)" }, { pts: hs, color: "var(--signal)", dash: "6 4" }], vlines: [{ x: t, label: "τ = t" }], xlabel: "τ", ylabel: "x(τ) · h(t − τ)" });
      var yt = conv(t);
      info.innerHTML = '<span class="lap-key k2"></span> x(τ) · <span class="lap-key k3"></span> h(t − τ) ' + L("(กลับด้านแล้วเลื่อนไปที่ t)", "(flipped, then slid to t)") + " · " + L("พื้นที่สีเขียว", "green area") + " = y(" + fmt(t, 2) + ") ≈ <b>" + fmt(yt, 4) + "</b>";
      var ymax = Math.max.apply(null, Y.map(function (p) { return p[1]; })) * 1.15 || 1;
      p2.innerHTML = MK.plot({ w: 640, h: 190, xmin: -1, xmax: 5, ymin: -0.05 * ymax, ymax: ymax, id: MK.uid("cv"), series: [{ pts: Y, color: "var(--ok)" }], marks: [{ x: t, y: yt, color: "var(--ok)" }], vlines: [{ x: t }], xlabel: "t", ylabel: "y(t) = (x * h)(t)" });
    }
    recompute();
  }

  // ---------------------------------------------------------------- ms-dconv (discrete, exact)
  function initDconv(el) {
    var d = el.dataset, tool = d.tool != null;
    var st = { x: d.x || "1, 2, 1", x0: d.x0 || "0", h: d.h || "1, -1", h0: d.h0 || "0" };
    if (tool && root.location) { var q = new URLSearchParams(root.location.search); ["x", "x0", "h", "h0"].forEach(function (k) { if (q.get(k) != null) st[k] = q.get(k); }); }
    el.innerHTML = "";
    var rx = h("div", "lap-row"); rx.appendChild(h("span", "lap-lbl", "x[n] =")); var ix = h("input", "lap-in"); ix.value = st.x; rx.appendChild(ix); var ix0 = numIn(L("เริ่มที่ n =", "starts at n ="), st.x0, "80px"); rx.appendChild(ix0); el.appendChild(rx);
    var rh = h("div", "lap-row"); rh.appendChild(h("span", "lap-lbl", "h[n] =")); var ih = h("input", "lap-in"); ih.value = st.h; rh.appendChild(ih); var ih0 = numIn(L("เริ่มที่ n =", "starts at n ="), st.h0, "80px"); rh.appendChild(ih0); el.appendChild(rh);
    el.appendChild(h("p", "lap-help", L("คั่นด้วยจุลภาค ใส่เศษส่วนได้ เช่น 1/2, -0.25 ตัวเลขแรกคือค่าที่ n = จุดเริ่ม", "Separate with commas; fractions like 1/2 or -0.25 are fine. The first number is the value at the starting n")));
    if (tool) {
      var box = h("div", "lap-chips");
      [[L("ค่าเฉลี่ยเคลื่อนที่", "moving average"), "1, 2, 3, 4", "0", "1/3, 1/3, 1/3", "0"], [L("ผลต่าง (อนุพันธ์ไม่ต่อเนื่อง)", "first difference"), "1, 4, 9, 16, 25", "0", "1, -1", "0"], [L("คูณพหุนาม", "polynomial product"), "1, 2, 1", "0", "1, 1", "0"], [L("เลื่อนเวลา", "time shift"), "3, -1, 2", "0", "0, 0, 1", "0"]]
        .forEach(function (p) { var b = h("button", "lap-chip", p[0]); b.type = "button"; b.addEventListener("click", function () { ix.value = p[1]; ix0.input.value = p[2]; ih.value = p[3]; ih0.input.value = p[4]; run(); }); box.appendChild(b); });
      el.insertBefore(box, el.firstChild);
    }
    var go = h("button", "btn btn-primary btn-sm", L("คำนวณ", "Compute")); go.type = "button"; go.addEventListener("click", run); el.appendChild(go);
    [ix, ih, ix0.input, ih0.input].forEach(function (i) { i.addEventListener("change", run); });
    var out = h("div", "ms-out"); el.appendChild(out);
    function run() {
      var x, hh, nx0 = parseInt(ix0.input.value, 10) || 0, nh0 = parseInt(ih0.input.value, 10) || 0;
      try { x = ix.value.split(/[,\s]+/).filter(Boolean).map(fparse); hh = ih.value.split(/[,\s]+/).filter(Boolean).map(fparse); if (!x.length || !hh.length) throw new Error(L("ต้องมีอย่างน้อยหนึ่งค่า", "Enter at least one value")); if (x.length + hh.length > 60) throw new Error(L("ยาวเกินไป (รวมไม่เกิน 60 ค่า)", "Too long (60 values in total at most)")); }
      catch (e) { out.innerHTML = '<p class="lap-err">' + e.message + "</p>"; return; }
      if (tool && root.history && root.history.replaceState) { var qs = new URLSearchParams({ x: ix.value, x0: nx0, h: ih.value, h0: nh0 }); root.history.replaceState(null, "", "?" + qs.toString()); }
      var y = dconv(x, hh), ny0 = nx0 + nh0;
      // independent float check
      var yf = []; for (var i = 0; i < y.length; i++) yf.push(0); x.forEach(function (a, i) { hh.forEach(function (b, j) { yf[i + j] += a.n / a.d * b.n / b.d; }); });
      var okc = y.every(function (v, i) { return Math.abs(v.n / v.d - yf[i]) < 1e-9 * Math.max(1, Math.abs(yf[i])); });
      var hdr = "<tr><th></th>" + x.map(function (v, i) { return "<th>x[" + (nx0 + i) + "] = " + ftxt(v) + "</th>"; }).join("") + "</tr>";
      var body = hh.map(function (b, j) { var cells = ""; for (var k = 0; k < x.length; k++) cells += "<td>" + ftxt(fmul(x[k], b)) + "</td>"; return "<tr><th>h[" + (nh0 + j) + "] = " + ftxt(b) + "</th>" + cells + "</tr>"; }).join("");
      var html = "<p class=\"lap-bh\">" + L("1) ตารางคูณ: ช่อง (แถว j, คอลัมน์ i) = x[i]·h[j] แล้วบวกตามแนวทแยง", "1) Multiplication table: cell (row j, column i) = x[i]·h[j]; add along the diagonals") + "</p>";
      html += '<div class="table-wrap"><table class="lap-pt ms-ct"><thead>' + hdr + "</thead><tbody>" + body + "</tbody></table></div>";
      html += "<p class=\"lap-bh\">" + L("2) ผลลัพธ์", "2) Result") + "</p>";
      html += '<div class="lap-ans">' + texs("y[n] = \\{\\," + y.map(function (v, i) { return (i === -ny0 ? "\\underset{\\uparrow}{" + ftex(v) + "}" : ftex(v)); }).join(",\\ ") + "\\,\\}", true) + "</div>";
      html += '<p class="lap-help">' + L("y เริ่มที่ n = ", "y starts at n = ") + ny0 + L(" (จุดเริ่มของ x บวกจุดเริ่มของ h) ยาว ", " (start of x plus start of h), length ") + y.length + " = " + x.length + " + " + hh.length + " − 1" + (ny0 <= 0 && -ny0 < y.length ? L(" · ลูกศรชี้ตำแหน่ง n = 0", " · the arrow marks n = 0") : "") + "</p>";
      html += "<p class=\"lap-bh\">" + L("3) มองเป็นการคูณพหุนามใน z⁻¹ (การแปลง Z)", "3) As a product of polynomials in z⁻¹ (z-transform)") + "</p>";
      var poly = function (arr, n0) { return arr.map(function (v, i) { var p = n0 + i; if (v.n === 0) return null; var c = ftex(v); var zz = p === 0 ? "" : "z^{" + (-p) + "}"; return (c === "1" && zz ? "" : c === "-1" && zz ? "-" : c) + zz; }).filter(Boolean).join(" + ").replace(/\+ -/g, "- ") || "0"; };
      html += '<div class="lap-eq">' + texs("X(z)H(z) = \\big(" + poly(x, nx0) + "\\big)\\big(" + poly(hh, nh0) + "\\big) = " + poly(y, ny0), true) + "</div>";
      html += '<p><span class="lap-flag ' + (okc ? "ok" : "no") + '">' + (okc ? "✓ " + L("ตรวจซ้ำด้วยเลขทศนิยมแล้วตรงกัน", "Re-checked with floating point: identical") : L("ตรวจซ้ำไม่ผ่าน", "Re-check failed")) + "</span></p>";
      var nmin = Math.min(nx0, nh0, ny0) - 1, nmax = Math.max(nx0 + x.length, nh0 + hh.length, ny0 + y.length);
      function sp(arr, n0, col, lab) { var pts = arr.map(function (v, i) { return [n0 + i, v.n / v.d]; }); var s = stems(pts, col); var ys = pts.map(function (p) { return p[1]; }); var lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0, Math.max.apply(null, ys)); var pad = (hi - lo || 1) * 0.15; return MK.plot({ w: 640, h: 150, xmin: nmin, xmax: nmax, ymin: lo - pad, ymax: hi + pad, id: MK.uid("dc"), series: [], segs: s.segs, marks: s.marks, xlabel: "n", ylabel: lab }); }
      html += '<div class="ms-stack">' + sp(x, nx0, "var(--accent)", "x[n]") + sp(hh, nh0, "var(--signal)", "h[n]") + sp(y, ny0, "var(--ok)", "y[n] = x[n] * h[n]") + "</div>";
      out.innerHTML = html;
    }
    run();
  }

  // ---------------------------------------------------------------- ms-ft (Fourier transform pairs)
  function initFt(el) {
    var key = el.dataset.sig || "rect";
    el.innerHTML = "";
    el.appendChild(chips([["rect", L("พัลส์สี่เหลี่ยม", "rectangular pulse")], ["tri", L("สามเหลี่ยม", "triangle")], ["exp", "e⁻ᵃᵗu(t)"], ["dexp", "e⁻ᵃ|ᵗ|"], ["gauss", L("เกาส์", "Gaussian")], ["mod", L("พัลส์มอดูเลต cos", "cos-modulated pulse")]], key, function (k) { key = k; vis(); draw(); }));
    var sT = slider("T", 0.25, 4, 0.05, 1, " s"), sa = slider("a", 0.2, 5, 0.1, 1, " 1/s"), sf = slider("f₀", 0, 5, 0.1, 2, " Hz");
    [sT, sa, sf].forEach(function (r) { el.appendChild(r); r.input.addEventListener("input", draw); });
    var eq = h("div", "lap-eq"), p1 = h("div", ""), p2 = h("div", ""), note = h("p", "lap-note");
    [eq, p1, p2, note].forEach(function (e) { el.appendChild(e); });
    function vis() { sT.style.display = /rect|tri|gauss|mod/.test(key) ? "" : "none"; sa.style.display = /exp/.test(key) ? "" : "none"; sf.style.display = key === "mod" ? "" : "none"; }
    function draw() {
      var p = { T: +sT.input.value, a: +sa.input.value, f0: +sf.input.value }, S = FT[key];
      tex(eq, S.tx + "\\quad\\longleftrightarrow\\quad " + S.tX, true);
      p1.innerHTML = MK.plot({ w: 640, h: 180, xmin: -4, xmax: 4, ymin: -1.15, ymax: 1.15, id: MK.uid("ft"), series: [{ pts: MK.sample(function (t) { return S.x(t, p); }, -4, 4, 1200), color: "var(--accent)" }], xlabel: "t (s)", ylabel: "x(t)" });
      var mag = MK.sample(function (f) { var v = S.X(f, p); return Math.hypot(v[0], v[1]); }, -5, 5, 1000), ser = [{ pts: mag, color: "var(--signal)", fill: 0.12 }];
      if (key === "exp") ser.push({ pts: MK.sample(function (f) { var v = S.X(f, p); return Math.atan2(v[1], v[0]) / PI * Math.max.apply(null, mag.map(function (q) { return q[1]; })); }, -5, 5, 600), color: "var(--ok)", dash: "5 4", width: 1.6 });
      if (key === "rect" || key === "tri" || key === "mod" || key === "gauss") { ser[0].pts = MK.sample(function (f) { return S.X(f, p)[0]; }, -5, 5, 1000); }
      p2.innerHTML = MK.plot({ w: 640, h: 210, xmin: -5, xmax: 5, id: MK.uid("ft"), series: ser, xlabel: "f (Hz)", ylabel: key === "exp" ? "|X(f)| , ∠X(f)" : "X(f)" });
      var chk = [0.37, 1.13].map(function (f) { var a = S.X(f, p), b = ftNumeric(key, f, p); return Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-4 * Math.max(1, Math.hypot(a[0], a[1])); }).every(Boolean);
      var extra = key === "rect" ? L("ศูนย์ตัวแรกของสเปกตรัมอยู่ที่ f = 1/T = ", "The first spectral zero is at f = 1/T = ") + fmt(1 / p.T, 3) + " Hz · " + L("พัลส์แคบลง สเปกตรัมกว้างขึ้น ผลคูณความกว้างเวลากับแถบความถี่คงที่", "a narrower pulse has a wider spectrum: time width × bandwidth stays constant")
        : key === "mod" ? L("การคูณด้วย cos 2πf₀t แยกสเปกตรัมเป็นสองก้อนที่ ±f₀ ก้อนละครึ่ง ", "Multiplying by cos 2πf₀t splits the spectrum into two half-height copies at ±f₀ ") + tg("eulercos") + " " + tg("p2s")
        : key === "exp" ? L("|X(f)| ลดลงครึ่งกำลัง (−3 dB) ที่ f = a/2π = ", "|X(f)| is down 3 dB at f = a/2π = ") + fmt(p.a / (2 * PI), 3) + " Hz · " + L("เส้นประคือเฟส (สเกลให้ดูง่าย) ไปจาก +90° ถึง −90°", "the dashed line is the phase (rescaled), going from +90° to −90°")
        : key === "gauss" ? L("เกาส์แปลงแล้วยังเป็นเกาส์ ผลคูณความกว้างทั้งสองข้างเล็กที่สุดเท่าที่เป็นไปได้", "A Gaussian transforms into a Gaussian; it has the smallest possible time–bandwidth product")
        : key === "tri" ? L("สามเหลี่ยม = พัลส์สี่เหลี่ยม * พัลส์สี่เหลี่ยม จึงได้ sinc² (คอนโวลูชันในเวลา = คูณในความถี่)", "triangle = rect * rect, hence sinc² (convolution in time = multiplication in frequency)")
        : L("ยิ่ง a มาก สัญญาณสั้นลง สเปกตรัมยิ่งกว้าง", "Larger a: shorter signal, wider spectrum");
      note.innerHTML = extra + ' <span class="lap-flag ' + (chk ? "ok" : "no") + '">' + (chk ? "✓ " + L("สูตรตรงกับการอินทิเกรตเชิงตัวเลข", "formula matches numerical integration") : "✗") + "</span>";
    }
    vis(); draw();
  }

  // ---------------------------------------------------------------- ms-alias
  function initAlias(el) {
    el.innerHTML = "";
    var sf = slider(L("ความถี่สัญญาณ f", "signal frequency f"), 0, 20, 0.1, +(el.dataset.f || 7), " Hz"), sfs = slider(L("อัตราสุ่ม fₛ", "sampling rate fₛ"), 2, 40, 0.5, +(el.dataset.fs || 10), " Hz");
    el.appendChild(sf); el.appendChild(sfs);
    var p1 = h("div", ""), info = h("p", "lap-note"), p2 = h("div", ""); el.appendChild(p1); el.appendChild(info); el.appendChild(p2);
    [sf, sfs].forEach(function (r) { r.input.addEventListener("input", draw); });
    function draw() {
      var f = +sf.input.value, fs = +sfs.input.value, fa = aliasFreq(f, fs), Ts = 1 / fs, T = 1;
      var samp = []; for (var n = 0; n * Ts <= T + 1e-9; n++) samp.push([n * Ts, Math.cos(2 * PI * f * n * Ts)]);
      var s = stems(samp, "var(--accent)");
      p1.innerHTML = MK.plot({ w: 640, h: 220, xmin: 0, xmax: T, ymin: -1.25, ymax: 1.25, id: MK.uid("al"), series: [{ pts: MK.sample(function (t) { return Math.cos(2 * PI * f * t); }, 0, T, 1500), color: "var(--ink-3)", width: 1.3 }, { pts: MK.sample(function (t) { return Math.cos(2 * PI * fa * t); }, 0, T, 800), color: "var(--signal)", dash: "6 4" }], segs: s.segs, marks: s.marks, xlabel: "t (s)", ylabel: "cos 2πft" });
      var ok = fs > 2 * f;
      info.innerHTML = L("อัตรา Nyquist = 2f = ", "Nyquist rate = 2f = ") + fmt(2 * f, 2) + " Hz · " + L("ความถี่ Nyquist = fₛ/2 = ", "Nyquist frequency = fₛ/2 = ") + fmt(fs / 2, 2) + " Hz · "
        + (ok ? '<span class="lap-flag ok">' + L("ไม่เกิดอเลียสซิง", "no aliasing") + "</span>" : '<span class="lap-flag no">' + L("เกิดอเลียสซิง: จุดสุ่มชุดนี้เหมือนคลื่น ", "aliasing: these samples look like a ") + fmt(fa, 2) + " Hz</span>")
        + "<br>" + L("เหตุผล: cos(2π(f − kfₛ)nTₛ) = cos(2πfnTₛ − 2πkn) = cos(2πfnTₛ) เพราะ cos มีคาบ 2π และ cos(−θ) = cos θ ความถี่ f กับ |f − kfₛ| จึงให้จุดสุ่มเดียวกันทุกจุด ", "Why: cos(2π(f − kfₛ)nTₛ) = cos(2πfnTₛ − 2πkn) = cos(2πfnTₛ), because cos has period 2π and cos(−θ) = cos θ; f and |f − kfₛ| give identical samples ") + tg("period") + " " + tg("even");
      var segs = [], marks = [], fmax = Math.max(2 * fs, f + fs);
      for (var k = -3; k <= 3; k++) [f, -f].forEach(function (ff) { var x = ff + k * fs; if (Math.abs(x) <= fmax) { var base = k === 0; segs.push({ x1: x, y1: 0, x2: x, y2: base ? 1 : 0.7, color: base ? "var(--accent)" : "var(--ink-3)", width: base ? 2.4 : 1.4 }); marks.push({ x: x, y: base ? 1 : 0.7, color: base ? "var(--accent)" : "var(--ink-3)", r: 3 }); } });
      p2.innerHTML = MK.plot({ w: 640, h: 170, xmin: -fmax, xmax: fmax, ymin: -0.1, ymax: 1.25, id: MK.uid("al"), series: [], segs: segs, marks: marks, bands: [{ x0: -fs / 2, x1: fs / 2, color: "var(--ok)", op: 0.12 }], xlabel: "f (Hz)", ylabel: L("สเปกตรัมหลังสุ่ม", "spectrum after sampling") });
    }
    draw();
  }

  // ---------------------------------------------------------------- ms-zpz
  function polyFromRoots(rs) { var p = [[1, 0]]; rs.forEach(function (r) { var q = p.map(function () { return [0, 0]; }).concat([[0, 0]]); p.forEach(function (c, i) { q[i] = [q[i][0] + c[0], q[i][1] + c[1]]; var m = cmul(c, r); q[i + 1] = [q[i + 1][0] - m[0], q[i + 1][1] - m[1]]; }); p = q; }); return p.map(function (c) { return c[0]; }); }
  function initZpz(el) {
    var pre = el.dataset.preset || "lp1";
    el.innerHTML = "";
    el.appendChild(chips([["lp1", L("โลว์พาสอันดับหนึ่ง", "first-order low-pass")], ["ma4", L("ค่าเฉลี่ยเคลื่อนที่ 4 จุด", "4-point moving average")], ["hp1", L("ไฮพาส (ผลต่าง)", "high-pass (difference)")], ["res", L("เรโซเนเตอร์", "resonator")], ["notch", L("ตัวกรองนอตช์", "notch filter")]], pre, function (k) { pre = k; vis(); draw(); }));
    var sr = slider("r", 0.1, 1.05, 0.01, 0.9), sth = slider("θ", 0, PI, 0.01, PI / 4, " rad");
    el.appendChild(sr); el.appendChild(sth); [sr, sth].forEach(function (r) { r.input.addEventListener("input", draw); });
    var eq = h("div", "lap-eq"), grid = h("div", "ms-tgrid"), zp = h("div", "ms-circ"), right = h("div", ""), note = h("p", "lap-note");
    el.appendChild(eq); grid.appendChild(zp); grid.appendChild(right); el.appendChild(grid); el.appendChild(note);
    function vis() { sr.style.display = /lp1|res|notch/.test(pre) ? "" : "none"; sth.style.display = /res|notch/.test(pre) ? "" : "none"; }
    function design() {
      var r = +sr.input.value, th = +sth.input.value;
      if (pre === "lp1") return { b: [1 - r], a: [1, -r], eq: "y[n] = " + fmt(r, 2) + "\\,y[n-1] + " + fmt(1 - r, 2) + "\\,x[n]" };
      if (pre === "ma4") return { b: [0.25, 0.25, 0.25, 0.25], a: [1], eq: "y[n] = \\tfrac14\\big(x[n] + x[n-1] + x[n-2] + x[n-3]\\big)" };
      if (pre === "hp1") return { b: [0.5, -0.5], a: [1], eq: "y[n] = \\tfrac12\\big(x[n] - x[n-1]\\big)" };
      if (pre === "res") return { b: [1 - r], a: [1, -2 * r * Math.cos(th), r * r], eq: "y[n] = " + fmt(2 * r * Math.cos(th), 3) + "\\,y[n-1] - " + fmt(r * r, 3) + "\\,y[n-2] + " + fmt(1 - r, 3) + "\\,x[n]" };
      var g = (1 + r) / 2; // notch: zeros on the unit circle at e^{±jθ}, poles at r e^{±jθ}
      return { b: [g, -2 * g * Math.cos(th), g], a: [1, -2 * r * Math.cos(th), r * r], eq: "H(z) = " + fmt(g, 3) + "\\,\\dfrac{1 - 2\\cos\\theta\\,z^{-1} + z^{-2}}{1 - 2r\\cos\\theta\\,z^{-1} + r^2z^{-2}}" };
    }
    function draw() {
      var D = design(), poles = roots(D.a.length > 1 ? D.a : [1]), zeros = roots(D.b.length > 1 ? D.b : [1]);
      // ma4/hp1 poles at z = 0 (FIR): multiply by z^{N-1}
      if (D.a.length === 1) { poles = []; for (var k = 1; k < D.b.length; k++) poles.push([0, 0]); }
      if (D.b.length < D.a.length) for (var j = D.b.length; j < D.a.length; j++) zeros.push([0, 0]);
      tex(eq, D.eq, true);
      var S = 92, O = 100, s = '<svg class="ms-uc" viewBox="0 0 200 200" role="img" aria-label="z-plane"><line x1="4" y1="' + O + '" x2="196" y2="' + O + '" class="mk-axis"/><line x1="' + O + '" y1="4" x2="' + O + '" y2="196" class="mk-axis"/><circle cx="' + O + '" cy="' + O + '" r="' + (S * 0.95) + '" class="ms-ucc"/>';
      var sc = S * 0.95;
      zeros.forEach(function (z) { s += '<circle cx="' + (O + sc * z[0]).toFixed(1) + '" cy="' + (O - sc * z[1]).toFixed(1) + '" r="5" class="lap-zero"/>'; });
      poles.forEach(function (p) { var x = O + sc * p[0], y = O - sc * p[1]; s += '<g class="lap-pole"><path d="M' + (x - 5) + " " + (y - 5) + "L" + (x + 5) + " " + (y + 5) + "M" + (x + 5) + " " + (y - 5) + "L" + (x - 5) + " " + (y + 5) + '"/></g>'; });
      s += '<text x="190" y="' + (O - 4) + '" class="mk-ann" text-anchor="end">Re z</text><text x="' + (O + 4) + '" y="14" class="mk-ann">Im z</text></svg>';
      zp.innerHTML = s + '<p class="lap-help">× ' + L("โพล", "pole") + " · ○ " + L("ซีโร", "zero") + " · " + L("วงกลมหนึ่งหน่วย |z| = 1", "unit circle |z| = 1") + "</p>";
      var mag = MK.sample(function (w) { var v = freqResp(D.b, D.a, w); return Math.hypot(v[0], v[1]); }, 0, PI, 600);
      var hn = impulse(D.b, D.a, 31).map(function (v, n) { return [n, v]; }), st2 = stems(hn, "var(--accent)");
      var ys = hn.map(function (p) { return p[1]; }), lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0.1, Math.max.apply(null, ys)), pad = (hi - lo) * 0.12;
      right.innerHTML = MK.plot({ w: 520, h: 190, xmin: 0, xmax: PI, id: MK.uid("zp"), series: [{ pts: mag, color: "var(--signal)", fill: 0.12 }], xlabel: "ω (rad/sample)", ylabel: "|H(e^{jω})|".replace("^{jω}", "ʲω"), clip: 50 })
        + MK.plot({ w: 520, h: 170, xmin: -0.5, xmax: 30.5, ymin: lo - pad, ymax: hi + pad, id: MK.uid("zp"), series: [], segs: st2.segs, marks: st2.marks, xlabel: "n", ylabel: "h[n]", clip: 50 });
      var stable = poles.every(function (p) { return Math.hypot(p[0], p[1]) < 1 - 1e-9; });
      var txt = '<span class="lap-flag ' + (stable ? "ok" : "no") + '">' + (stable ? L("เสถียร: ทุกโพลอยู่ในวงกลมหนึ่งหน่วย", "stable: every pole is inside the unit circle") : L("ไม่เสถียร: มีโพลบนหรือนอกวงกลม h[n] ไม่ลดลง", "unstable: a pole on or outside the circle; h[n] does not decay")) + "</span> ";
      if (pre === "res" || pre === "notch") txt += L("โพลคู่ re<sup>±jθ</sup> คูณกันได้ z² − 2r cos θ z + r² ", "The pole pair re<sup>±jθ</sup> multiplies out to z² − 2r cos θ z + r² ") + tg("eulercos") + " · " + L("ยอด/ร่องของ |H| อยู่ที่ ω ≈ θ = ", "the peak/notch of |H| sits at ω ≈ θ = ") + fmt(+sth.input.value, 3) + " rad";
      else txt += L("ค่าบนวงกลมหนึ่งหน่วย z = e<sup>jω</sup> คือผลตอบสนองเชิงความถี่ ", "Evaluating on the unit circle z = e<sup>jω</sup> gives the frequency response ") + tg("euler");
      note.innerHTML = txt;
    }
    vis(); draw();
  }

  var INIT = { "ms-trigd": initTrigd, "ms-sinlim": initSinlim, "ms-field": initField, "ms-ode2": initOde2, "ms-conv": initConv, "ms-dconv": initDconv, "ms-ft": initFt, "ms-alias": initAlias, "ms-zpz": initZpz };
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      doc.querySelectorAll("." + cls).forEach(function (el) {
        if (el.dataset.ready) return; el.dataset.ready = "1";
        try { INIT[cls](el); } catch (e) { el.innerHTML = '<p class="lap-err">' + e.message + "</p>"; if (root.console) console.error(e); }
      });
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
