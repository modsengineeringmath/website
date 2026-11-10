/* Calculators in /tools/ (Thai) and /en/tools/ (English). Plain JS; the page language picks the interface language.
   Needs mt-core.js, mathkit.js and /assets/vendor/katex.min.js. Per tool also: thai-tariff.js (bill), cs-core.js + lap-core.js (ilaplace).
   Loaded on demand: /assets/vendor/nerdamer.min.js (integrals the rule table cannot do) and /assets/vendor/mathjax-tex-svg.js (image export).
   <div class="mt-tool" data-tool="latex|laplace|ilaplace|fourier|derivative|integral|area|pf|bill" [data-f="…"]></div>
   Every tool reads its inputs from the query string (?f=…&a=…), so results can be linked: /tools/derivative-calculator/?f=x^2*sin(x)
   Every symbolic answer is checked numerically before it is shown (derivative by finite differences, antiderivative by
   differentiating it, Laplace transform by integrating f(t)e^{-st}); an answer that fails its check is never displayed. */
(function () {
  "use strict";
  var MT = window.MTCore, MK = window.MK;
  if (!MT || !MK) return;
  var EN = document.documentElement.lang === "en";
  var L = function (th, en) { return EN ? en : th; };
  var TOOLS = EN ? "/en/tools/" : "/tools/";
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var K = function (tex, display) { return MK.texStr(tex, display); };
  var QS = new URLSearchParams(location.search);
  var num = function (v) { var x = parseFloat(String(v).replace(/,/g, "")); return isFinite(x) ? x : NaN; };
  var money = function (x) { return x.toLocaleString(EN ? "en-US" : "th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var sig = function (x, n) { if (!isFinite(x)) return "–"; var a = Math.abs(x); if (a !== 0 && (a >= 1e9 || a < 1e-4)) return x.toExponential((n || 6) - 1); return String(+x.toPrecision(n || 6)); };
  var grp = function (x, d) { return isFinite(x) ? x.toLocaleString("en-US", { maximumFractionDigits: d == null ? 4 : d }) : "–"; };

  var ERR = {
    empty: ["ยังไม่ได้พิมพ์สมการ", "Type an expression first."],
    long: ["สมการยาวเกินไป (ไม่เกิน 400 ตัวอักษร)", "The expression is too long (400 characters at most)."],
    char: ["มีอักขระที่ไม่รู้จัก: ", "Unknown character: "],
    paren: ["วงเล็บเปิด–ปิดไม่ครบคู่", "Unbalanced parentheses."],
    syntax: ["รูปแบบสมการไม่ถูกต้อง ตรวจเครื่องหมายและวงเล็บอีกครั้ง", "The expression is not well formed. Check the operators and parentheses."],
    arg: ["ฟังก์ชันต้องมีตัวแปรตาม เช่น sin(x)", "A function needs an argument, e.g. sin(x)."],
    "var": ["มีตัวแปรที่ยังไม่ได้กำหนดค่า: ", "This variable has no value: "],
    div0: ["มีการหารด้วยศูนย์", "Division by zero."],
    nodiff: ["ยังหาอนุพันธ์ของฟังก์ชันนี้ไม่ได้: ", "Cannot differentiate this function yet: "],
    "lap-sym": ["เครื่องมือนี้คำนวณเมื่อสัมประสิทธิ์เป็นตัวเลข กรุณาแทนค่าตัวอักษรนี้ด้วยตัวเลข (สูตรทั่วไปดูในตารางด้านล่าง): ", "This calculator needs numeric coefficients. Replace this letter with a number (the general formulas are in the table below): "],
    "lap-form": ["พจน์นี้อยู่นอกตารางที่เครื่องมือรองรับ (tⁿ, e^{at}, sin, cos, sinh, cosh, u(t−a), δ(t−a) และผลคูณของพจน์เหล่านี้): ", "This term is outside the supported family (tⁿ, e^{at}, sin, cos, sinh, cosh, u(t−a), δ(t−a) and their products): "],
    "lap-delta2": ["ผลคูณของ δ(t) สองตัวไม่มีความหมาย", "A product of two delta functions is not defined."]
  };
  function errText(e) {
    if (e && e.code && ERR[e.code]) return ERR[e.code][EN ? 1 : 0] + (/[:：] $/.test(ERR[e.code][EN ? 1 : 0]) && e.info ? e.info : "");
    return (e && e.message) || String(e);
  }
  function errBox(e, isTex) {
    var t = errText(e), info = e && e.code && /^lap-/.test(e.code) && e.info && /\\/.test(e.info) ? e.info : null;
    if (info) t = t.replace(info, "");
    return '<p class="mt-err" role="alert">' + esc(t) + (info ? " " + K(info) : "") + "</p>";
  }
  function loadScript(src) {
    loadScript.p = loadScript.p || {};
    if (!loadScript.p[src]) loadScript.p[src] = new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error(L("โหลดไฟล์ไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต", "Could not load a file. Check your connection."))); }; document.head.appendChild(s); });
    return loadScript.p[src];
  }
  function copy(text, btn) {
    var done = function () { if (!btn) return; var o = btn.textContent; btn.textContent = L("คัดลอกแล้ว ✓", "Copied ✓"); setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { window.prompt(L("คัดลอกข้อความนี้", "Copy this text"), text); });
    else window.prompt(L("คัดลอกข้อความนี้", "Copy this text"), text);
  }
  /* answer box: big TeX + copy LaTeX + open in the equation editor (PNG/SVG) */
  function answer(label, tex, extra) {
    return '<div class="mt-ans"><p class="mt-ans-l">' + label + '</p><div class="mt-ans-m">' + K(tex, true) + '</div><div class="mt-acts">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(tex) + '">' + L("คัดลอก LaTeX", "Copy LaTeX") + "</button>" +
      '<a class="btn btn-ghost btn-sm" href="' + TOOLS + "latex-equation-editor/?tex=" + encodeURIComponent(tex) + '">' + L("บันทึกเป็นรูป PNG / SVG", "Save as PNG / SVG") + "</a>" + (extra || "") + "</div></div>";
  }
  function shareBtn(params) {
    var u = new URL(location.href); u.search = ""; u.hash = "";
    Object.keys(params).forEach(function (k) { if (params[k] !== "" && params[k] != null) u.searchParams.set(k, params[k]); });
    return '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(u.toString()) + '">' + L("คัดลอกลิงก์ผลลัพธ์", "Copy link to this result") + "</button>";
  }
  function badge(ok, text) { return '<p class="mt-chk ' + (ok ? "ok" : "warn") + '">' + (ok ? "✓ " : "! ") + text + "</p>"; }
  function field(id, label, value, opt) {
    opt = opt || {};
    return '<label class="mt-f' + (opt.wide ? " mt-wide" : "") + '"><span>' + label + '</span><input class="num mt-in" id="' + id + '" name="' + id + '" value="' + esc(value == null ? "" : value) + '"' +
      (opt.mode ? ' inputmode="' + opt.mode + '"' : "") + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : "") + ' autocomplete="off" autocapitalize="off" spellcheck="false">' + (opt.unit ? '<em>' + opt.unit + "</em>" : "") + "</label>";
  }
  function select(id, label, options, value) {
    return '<label class="mt-f"><span>' + label + '</span><select class="num mt-in" id="' + id + '" name="' + id + '">' + options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></label>";
  }
  function chips(list, attr) { return '<div class="mt-chips"><span class="mono">' + L("ตัวอย่าง", "Examples") + "</span>" + list.map(function (x) { var v = typeof x === "string" ? x : x[0], t = typeof x === "string" ? x : x[1]; return '<button type="button" class="mt-chip" ' + (attr || "data-ex") + '="' + esc(v) + '">' + esc(t) + "</button>"; }).join("") + "</div>"; }
  function autoY(series) {
    var ys = [];
    series.forEach(function (s) { s.forEach(function (p) { if (isFinite(p[1])) ys.push(p[1]); }); });
    if (!ys.length) return [-1, 1];
    ys.sort(function (a, b) { return a - b; });
    var lo = ys[Math.floor(ys.length * 0.03)], hi = ys[Math.ceil(ys.length * 0.97) - 1], full = ys[ys.length - 1] - ys[0];
    if (full <= (hi - lo) * 6 || hi - lo < 1e-12) { lo = ys[0]; hi = ys[ys.length - 1]; }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    var pad = (hi - lo) * 0.1;
    return [lo - pad, hi + pad];
  }
  function sample(f, a, b, n) { var pts = []; for (var i = 0; i <= n; i++) { var x = a + (b - a) * i / n, y; try { y = f(x); } catch (e) { y = NaN; } pts.push([x, y]); } return pts; }
  var NARROW = window.innerWidth < 600, PW = NARROW ? 440 : 720, PH = NARROW ? 300 : 320;
  function plot(series, a, b, opt) {
    opt = opt || {};
    var yr = autoY(series.map(function (s) { return s.pts; }));
    return '<figure class="mt-plot">' + MK.plot(Object.assign({ w: PW, h: PH, xmin: a, xmax: b, ymin: yr[0], ymax: yr[1], series: series, id: MK.uid("mt") }, opt)) +
      (opt.caption ? "<figcaption>" + opt.caption + "</figcaption>" : "") + "</figure>";
  }
  function pickVar(node, pref) { var s = MT.symbols(node); if (!s.length) return pref || "x"; if (pref && s.indexOf(pref) >= 0) return pref; for (var i = 0, o = ["x", "t", "y", "z", "s", "u", "r"]; i < o.length; i++) if (s.indexOf(o[i]) >= 0) return o[i]; return s[0]; }
  function onSubmit(root, fn) {
    var form = root.querySelector("form");
    form.addEventListener("submit", function (e) { e.preventDefault(); fn(true); });
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-copy]"); if (c) { copy(c.getAttribute("data-copy"), c); return; }
      var x = e.target.closest("[data-ex]"); if (x) { var inp = root.querySelector("[data-main]"); inp.value = x.getAttribute("data-ex"); fn(true); inp.focus(); }
    });
  }
  var RULE = {
    "const": ["ค่าคงที่", "constant"], x: ["d/dx(x) = 1", "d/dx(x) = 1"], cmul: ["ดึงค่าคงที่", "constant multiple"], power: ["กฎยกกำลัง", "power rule"], prod: ["กฎผลคูณ", "product rule"], quot: ["กฎผลหาร", "quotient rule"],
    chain: ["กฎลูกโซ่", "chain rule"], exp: ["ฟังก์ชันเลขชี้กำลัง", "exponential"], ln: ["ลอการิทึม", "logarithm"], trig: ["ตรีโกณมิติ", "trigonometric"], atrig: ["ตรีโกณมิติผกผัน", "inverse trigonometric"], hyp: ["ไฮเพอร์โบลิก", "hyperbolic"],
    logd: ["อนุพันธ์เชิงลอการิทึม", "logarithmic differentiation"], other: ["สูตรเฉพาะ", "special rule"]
  };

  /* =================================================================== 1. derivative */
  function derivative(root) {
    var f0 = QS.get("f") || root.dataset.f || "x^3*sin(2x)";
    root.innerHTML = '<form class="mt-form"><div class="mt-row">' + field("mt-f", "f(x) =", f0, { wide: true, ph: "x^3*sin(2x)" }).replace("<input", "<input data-main") +
      field("mt-v", L("ตัวแปร", "Variable"), QS.get("v") || "", { ph: "x" }) + select("mt-n", L("อันดับ", "Order"), [[1, "1"], [2, "2"], [3, "3"], [4, "4"]], QS.get("n") || 1) +
      field("mt-x0", L("แทนค่าที่ (ไม่บังคับ)", "Evaluate at (optional)"), QS.get("x0") || "", { ph: "2" }) + '</div><button class="btn btn-primary" type="submit">' + L("หาอนุพันธ์", "Differentiate") + "</button></form>" +
      chips(["x^3*sin(2x)", "e^(-x^2)", "ln(x^2+1)/x", "sqrt(1-x^2)", "(3x+2)^5", "x^x", "tan(3x)", "e^(2x)cos(5x)"]) + '<div class="mt-out" aria-live="polite"></div>';
    var out = root.querySelector(".mt-out");
    function run() {
      try {
        var f = MT.parse(root.querySelector("#mt-f").value), v = pickVar(f, root.querySelector("#mt-v").value.trim().toLowerCase() || null), n = +root.querySelector("#mt-n").value, d = f, ds = [f];
        for (var i = 0; i < n; i++) { d = MT.diff(d, v); ds.push(d); }
        var ok = true; for (i = 1; i <= n; i++) ok = ok && (MT.checkDeriv(ds[i - 1], ds[i], v) || !MT.dep(ds[i - 1], v));
        var dn = n === 1 ? "\\frac{d}{d" + v + "}" : "\\frac{d^{" + n + "}}{d" + v + "^{" + n + "}}", ft = MT.tex(f), big = f.k === "+" || ft.length > 28;
        var h = answer(L("คำตอบ", "Answer"), dn + (big ? "\\left[" + ft + "\\right]" : ft) + " = " + MT.tex(d), shareBtn({ f: root.querySelector("#mt-f").value, v: v === "x" ? "" : v, n: n === 1 ? "" : n }));
        h += badge(ok, ok ? L("ตรวจแล้ว: ตรงกับอนุพันธ์เชิงตัวเลข (ผลต่างสืบเนื่องอันดับ 4) ที่จุดทดสอบ 10 จุด", "Checked against a numerical derivative (4th-order finite differences) at 10 test points") : L("ตรวจด้วยตัวเลขไม่ได้ในช่วงทดสอบ (ฟังก์ชันอาจไม่นิยามที่จุดทดสอบ) กรุณาตรวจโดเมน", "Could not be checked numerically on the test points (the function may be undefined there). Check the domain."));
        var steps = MT.diffSteps(f, v);
        h += '<h3 class="mt-h">' + L("วิธีทำทีละพจน์", "Working, term by term") + '</h3><ol class="mt-steps">';
        steps.forEach(function (s) {
          var rs = s.rules.filter(function (r) { return r !== "x" && r !== "const" || s.rules.length === 1; }).map(function (r) { return RULE[r][EN ? 1 : 0]; });
          h += "<li><span class=\"mt-rule\">" + rs.join(" · ") + "</span>" + K("\\frac{d}{d" + v + "}\\left[" + MT.tex(s.term) + "\\right] = " + MT.tex(s.d), true) + "</li>";
        });
        h += "</ol>";
        if (n > 1) { h += '<h3 class="mt-h">' + L("อนุพันธ์แต่ละอันดับ", "Each order") + '</h3><ol class="mt-steps">'; for (i = 1; i <= n; i++) h += "<li>" + K("f" + (i <= 3 ? "'".repeat(i) : "^{(" + i + ")}") + "(" + v + ") = " + MT.tex(ds[i]), true) + "</li>"; h += "</ol>"; }
        var x0s = root.querySelector("#mt-x0").value.trim(), free = MT.symbols(f).filter(function (s) { return s !== v; });
        if (x0s && !free.length) {
          var x0 = MT.evalf(MT.parse(x0s), {}), env = {}; env[v] = x0;
          var fv = MT.evalf(f, env), dv = MT.evalf(d, env);
          h += '<h3 class="mt-h">' + L("ค่าที่จุดที่กำหนด", "Value at the point") + "</h3>" + K("f(" + MT.niceTex(x0) + ") = " + MT.niceTex(fv, 8) + ",\\qquad f" + (n <= 3 ? "'".repeat(n) : "^{(" + n + ")}") + "(" + MT.niceTex(x0) + ") = " + MT.niceTex(dv, 8), true);
          if (n === 1 && isFinite(fv) && isFinite(dv)) h += "<p>" + L("สมการเส้นสัมผัส: ", "Tangent line: ") + K("y = " + MT.tex(MT.add([MT.mul([MT.N(+dv.toPrecision(10)), MT.add([MT.S(v), MT.N(-x0)])]), MT.N(+fv.toPrecision(10))]))) + "</p>";
        }
        if (!free.length) {
          var c = x0s && isFinite(x0) ? x0 : 0, a = c - 5, b = c + 5, F = MT.compile(f, v), D = MT.compile(d, v);
          h += plot([{ pts: sample(F, a, b, 400), color: MK.COLORS.b }, { pts: sample(D, a, b, 400), color: MK.COLORS.a }], a, b, { xlabel: v, caption: L("เส้นสีน้ำเงิน f · เส้นสีส้ม อนุพันธ์", "Blue: f · orange: the derivative") });
        } else h += '<p class="hint">' + L("ถือว่า ", "Treated ") + free.map(function (s) { return K(MT.tex(MT.S(s))); }).join(", ") + L(" เป็นค่าคงที่ จึงไม่วาดกราฟ", " as constants, so no graph is drawn") + "</p>";
        out.innerHTML = h;
      } catch (e) { out.innerHTML = errBox(e); }
    }
    onSubmit(root, run); run();
  }

  /* =================================================================== 2. integral */
  function nerdIntegrate(f, v) {
    return loadScript("/assets/vendor/nerdamer.min.js").then(function () {
      var r = window.nerdamer("integrate(" + MT.nerd(f) + "," + v + ")").toString();
      if (/integrate|defint/.test(r)) return null;
      return MT.parse(r.replace(/\blog\(/g, "ln("), {});
    }).catch(function () { return null; });
  }
  function integral(root) {
    var f0 = QS.get("f") || root.dataset.f || "x^2*e^(3x)";
    root.innerHTML = '<form class="mt-form"><div class="mt-row">' + field("mt-f", L("f(x) = (ตัวถูกอินทิเกรต)", "f(x) = (integrand)"), f0, { wide: true }).replace("<input", "<input data-main") +
      field("mt-v", L("ตัวแปร", "Variable"), QS.get("v") || "", { ph: "x" }) + field("mt-a", L("ขีดจำกัดล่าง a (ไม่บังคับ)", "Lower limit a (optional)"), QS.get("a") || "", { ph: "0" }) + field("mt-b", L("ขีดจำกัดบน b (ไม่บังคับ)", "Upper limit b (optional)"), QS.get("b") || "", { ph: "pi" }) +
      '</div><button class="btn btn-primary" type="submit">' + L("อินทิเกรต", "Integrate") + "</button></form>" +
      chips(["x^2*e^(3x)", "sin(x)^2", "1/(x^2+4)", "x*cos(x)", "ln(x)", "(2x+3)/(x^2+3x+2)", "sqrt(1-x^2)", "e^x*sin(x)", "e^(-x^2)", "x*sqrt(x+1)"]) + '<div class="mt-out" aria-live="polite"></div>';
    var out = root.querySelector(".mt-out"), token = 0;
    function show(f, v, F, how, my) {
      if (my !== token) return;
      var h = "", ft = MT.tex(f), as = root.querySelector("#mt-a").value.trim(), bs = root.querySelector("#mt-b").value.trim(), free = MT.symbols(f).filter(function (s) { return s !== v; });
      var body = (f.k === "+" ? "\\left(" + ft + "\\right)" : ft) + "\\,d" + v, share = shareBtn({ f: root.querySelector("#mt-f").value, v: v === "x" ? "" : v, a: as, b: bs });
      if (F) {
        h += answer(L("ปริพันธ์ไม่จำกัดเขต", "Indefinite integral"), "\\int " + body + " = " + MT.tex(F) + " + C", share);
        h += badge(true, L("ตรวจแล้ว: หาอนุพันธ์ของคำตอบได้ตัวถูกอินทิเกรตเดิม (ทดสอบเชิงตัวเลข 10 จุด)", "Checked: differentiating the answer gives back the integrand (numerical test at 10 points)") + (how === "cas" ? L(" · คำนวณด้วยไลบรารี nerdamer", " · computed with the nerdamer library") : ""));
        h += "<p>" + L("ตรวจด้วยมือ: ", "Check by hand: ") + K("\\frac{d}{d" + v + "}\\left[" + MT.tex(F) + "\\right] = " + MT.tex(MT.diff(F, v))) + "</p>";
      } else h += '<div class="mt-ans"><p class="mt-ans-l">' + L("ปริพันธ์ไม่จำกัดเขต", "Indefinite integral") + "</p><p>" + L("หาสูตรปิดในรูปฟังก์ชันมูลฐานไม่ได้ด้วยกฎที่เครื่องมือนี้มี (บางฟังก์ชันไม่มีสูตรปิดจริง ๆ เช่น sin(x)/x) หากใส่ขีดจำกัด a และ b จะได้ค่าเชิงตัวเลขที่แม่นยำ", "No closed form in elementary functions was found with the rules available here (some functions truly have none, e.g. sin(x)/x). Enter limits a and b to get an accurate numerical value.") + '</p><div class="mt-acts">' + share + "</div></div>";
      if (as && bs && !free.length) {
        try {
          var a = MT.evalf(MT.parse(as), {}), b = MT.evalf(MT.parse(bs), {}), fn = MT.compile(f, v), q = MT.quad(fn, a, b, 1e-11), exact = null;
          if (F) { var ea = {}, eb = {}; ea[v] = a; eb[v] = b; exact = MT.evalf(F, eb) - MT.evalf(F, ea); }
          var sm = sample(fn, a, b, 2000).map(function (p) { return Math.abs(p[1]); }), med = sm.filter(isFinite).sort(function (x, y) { return x - y; })[Math.floor(sm.length / 2)] || 0;
          if (sm.some(function (y, i) { return i > 0 && i < sm.length - 1 && (!isFinite(y) || y > 1e5 * (1 + med)); })) q.sing = q.bad = true; // a singularity inside (a, b)
          var agree = !q.bad && exact != null && isFinite(exact) && Math.abs(exact - q.v) <= 1e-6 * Math.max(1, Math.abs(q.v));
          var val = agree ? exact : q.v, lim = "\\int_{" + MT.tex(MT.parse(as)) + "}^{" + MT.tex(MT.parse(bs)) + "} " + body;
          var nv = MT.niceTex(val, 10), rhs = q.sing ? " = \\text{" + L("ไม่นิยาม: มีจุดที่ฟังก์ชันไม่จำกัดขอบเขตในช่วง", "undefined: the integrand is unbounded inside the interval") + "}"
            : agree ? " = \\left[" + MT.tex(F) + "\\right]_{" + MT.tex(MT.parse(as)) + "}^{" + MT.tex(MT.parse(bs)) + "} = " + nv + (nv === sig(val, 10) ? "" : " \\approx " + sig(val, 10)) : " \\approx " + sig(val, 10);
          h += answer(L("ปริพันธ์จำกัดเขต", "Definite integral"), lim + rhs);
          if (!isFinite(q.v) || q.bad) h += badge(false, L("ปริพันธ์นี้อาจลู่ออกหรือมีจุดไม่ต่อเนื่องในช่วง [a, b] ค่าที่ได้เชื่อถือไม่ได้", "This integral may diverge or have a discontinuity in [a, b]; the value is not reliable."));
          else if (F && !agree) h += badge(false, L("ค่าจาก F(b) − F(a) ไม่ตรงกับการอินทิเกรตเชิงตัวเลข แสดงว่าปฏิยานุพันธ์ไม่ต่อเนื่องในช่วงนี้ จึงแสดงค่าเชิงตัวเลข (Gauss–Kronrod) แทน", "F(b) − F(a) disagrees with numerical integration, so the antiderivative is not continuous on this interval. The numerical value (Gauss–Kronrod) is shown instead."));
          else h += badge(true, L("อินทิเกรตเชิงตัวเลข (Gauss–Kronrod 15 จุดแบบปรับช่วง) ได้ ", "Numerical integration (adaptive 15-point Gauss–Kronrod) gives ") + sig(q.v, 12) + L(" ค่าคลาดเคลื่อนประมาณ ", ", estimated error ") + q.err.toExponential(1));
          var lo = Math.min(a, b), hi = Math.max(a, b), m = (hi - lo) * 0.25 || 1;
          h += plot([{ pts: sample(fn, lo, hi, 300), color: MK.COLORS.a, fill: 0.2 }, { pts: sample(fn, lo - m, hi + m, 500), color: MK.COLORS.b }], lo - m, hi + m, { xlabel: v, caption: L("พื้นที่แรเงาคือค่าปริพันธ์ (ส่วนใต้แกนนับเป็นลบ)", "The shaded region is the integral (parts below the axis count as negative)") });
        } catch (e) { h += errBox(e); }
      } else if (!free.length && F) {
        var g = MT.compile(f, v), G = MT.compile(F, v);
        h += plot([{ pts: sample(g, -5, 5, 400), color: MK.COLORS.b }, { pts: sample(G, -5, 5, 400), color: MK.COLORS.a }], -5, 5, { xlabel: v, caption: L("เส้นสีน้ำเงิน f · เส้นสีส้ม ปฏิยานุพันธ์ F (C = 0)", "Blue: f · orange: the antiderivative F (C = 0)") });
      }
      out.innerHTML = h;
    }
    function run() {
      var my = ++token;
      try {
        var f = MT.parse(root.querySelector("#mt-f").value), v = pickVar(f, root.querySelector("#mt-v").value.trim().toLowerCase() || null);
        var F = MT.integrate(f, v);
        if (F && MT.checkDeriv(F, f, v)) return show(f, v, F, "rule", my);
        out.innerHTML = '<p class="hint">' + L("กำลังคำนวณ…", "Working…") + "</p>";
        nerdIntegrate(f, v).then(function (G) { show(f, v, G && MT.checkDeriv(G, f, v) ? G : null, "cas", my); });
      } catch (e) { out.innerHTML = errBox(e); }
    }
    onSubmit(root, run); run();
  }

  /* =================================================================== 3. Laplace transform */
  var LRULE = {
    "const": "\\mathcal{L}\\{1\\} = \\frac{1}{s}", exp: "\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s-a}", tn: "\\mathcal{L}\\{t^{n}\\} = \\frac{n!}{s^{n+1}}", tnexp: "\\mathcal{L}\\{t^{n}e^{at}\\} = \\frac{n!}{(s-a)^{n+1}}",
    cos: "\\mathcal{L}\\{\\cos bt\\} = \\frac{s}{s^{2}+b^{2}}", sin: "\\mathcal{L}\\{\\sin bt\\} = \\frac{b}{s^{2}+b^{2}}", expcos: "\\mathcal{L}\\{e^{at}\\cos bt\\} = \\frac{s-a}{(s-a)^{2}+b^{2}}", expsin: "\\mathcal{L}\\{e^{at}\\sin bt\\} = \\frac{b}{(s-a)^{2}+b^{2}}",
    tncos: "\\mathcal{L}\\{t^{n}f(t)\\} = (-1)^{n}\\frac{d^{n}}{ds^{n}}F(s)", tnsin: "\\mathcal{L}\\{t^{n}f(t)\\} = (-1)^{n}\\frac{d^{n}}{ds^{n}}F(s)", delta: "\\mathcal{L}\\{\\delta(t-a)\\} = e^{-as}"
  };
  function laplace(root) {
    var f0 = QS.get("f") || root.dataset.f || "e^(-2t)*sin(3t)";
    root.innerHTML = '<form class="mt-form"><div class="mt-row">' + field("mt-f", "f(t) =", f0, { wide: true }).replace("<input", "<input data-main") + '</div><button class="btn btn-primary" type="submit">' + L("แปลงลาปลาซ", "Transform") + "</button></form>" +
      chips(["e^(-2t)*sin(3t)", "t^2", "t*cos(2t)", "5+3t-2e^(-4t)", "cos(t)^2", "t^2*e^(-t)", "(t-1)*u(t-1)", "u(t)-u(t-2)", "sinh(2t)", "sqrt(t)", "delta(t-1)"]) + '<div class="mt-out" aria-live="polite"></div>';
    var out = root.querySelector(".mt-out");
    function run() {
      try {
        var f = MT.parse(root.querySelector("#mt-f").value, { step: true }), syms = MT.symbols(f);
        if (syms.length && syms.indexOf("t") < 0 && syms.length === 1) f = MT.subst(f, syms[0], MT.S("t"));
        var R = MT.laplace(f, "t"), ft = MT.tex(f), share = shareBtn({ f: root.querySelector("#mt-f").value });
        var h = answer("F(s) = ℒ{f(t)}", "\\mathcal{L}\\left\\{" + ft + "\\right\\} = " + R.tex, share);
        if (!R.zero) {
          var s0 = Math.max(R.sigma, 0) + 1.7, v = R.value({ re: s0, im: 0 }).re, vr = R.valueRational(s0), okR = vr == null || Math.abs(vr - v) <= 1e-7 * Math.max(1, Math.abs(v));
          if (R.hasDelta) h += badge(okR, L("ตรวจแล้ว: รูปเศษส่วนรวมตรงกับผลรวมของแต่ละพจน์จากตาราง (ปริพันธ์เชิงตัวเลขใช้กับ δ(t) ไม่ได้)", "Checked: the combined fraction equals the sum of the table terms (numerical integration cannot handle δ(t))"));
          else {
            var nm = MT.laplaceNumeric(f, "t", s0, R.sigma), ok = okR && Math.abs(nm - v) <= (R.frac ? 2e-3 : 1e-6) * Math.max(1, Math.abs(v));
            if (!ok) throw new Error(L("ผลลัพธ์ไม่ผ่านการตรวจสอบเชิงตัวเลข จึงไม่แสดงคำตอบ กรุณาแจ้งผู้ดูแลพร้อมสมการที่ใช้", "The result failed its numerical check, so it is not shown. Please report the expression you used."));
            h += badge(true, L("ตรวจแล้ว: อินทิเกรตตามนิยาม ", "Checked against the definition: ") + K("\\int_0^\\infty f(t)e^{-st}\\,dt") + L(" เชิงตัวเลขที่ s = ", " numerically at s = ") + sig(s0, 4) + L(" ได้ ", " gives ") + sig(nm, 8) + L(" ตรงกับ F(s) = ", ", and F(s) = ") + sig(v, 8));
          }
          h += '<h3 class="mt-h">' + L("วิธีทำ", "Working") + '</h3><ol class="mt-steps"><li><span class="mt-rule">' + L("เขียน f(t) เป็นผลบวกของพจน์มาตรฐาน (ใช้เอกลักษณ์ตรีโกณและการเลื่อนเวลาถ้าจำเป็น)", "Write f(t) as a sum of standard terms (trig identities and time shifts where needed)") + "</span>" +
            K("f(t) = " + R.pairs.map(function (p, i) { var c = Math.abs(p.co), t = (c === 1 && p.f !== "1" ? "" : MT.niceTex(c)) + (p.f === "1" ? "" : (c === 1 ? "" : "\\,") + p.f); return (p.co < 0 ? (i ? " - " : "-") : i ? " + " : "") + (t || "1"); }).join(""), true) + "</li>";
          h += '<li><span class="mt-rule">' + L("แปลงทีละพจน์จากตาราง (สมบัติเชิงเส้น)", "Transform each term from the table (linearity)") + '</span><div class="table-wrap"><table class="mt-tb"><thead><tr><th>' + L("พจน์", "Term") + "</th><th>F(s)</th><th>" + L("สูตรที่ใช้", "Rule") + "</th></tr></thead><tbody>" +
            R.pairs.map(function (p) { return "<tr><td>" + K(p.f) + "</td><td>" + K(p.F) + "</td><td>" + K(LRULE[p.rule]) + (p.delay ? " · " + K("\\mathcal{L}\\{f(t-a)u(t-a)\\} = e^{-as}F(s)") : "") + "</td></tr>"; }).join("") + "</tbody></table></div></li>";
          if (!R.frac) h += '<li><span class="mt-rule">' + L("รวมเป็นเศษส่วนเดียว", "Combine into one fraction") + "</span>" + K("F(s) = " + R.tex + (R.texExpanded !== R.tex ? " = " + R.texExpanded : ""), true) + "</li>";
          h += "</ol>";
          if (R.poles.length) h += "<p><b>" + L("โพล", "Poles") + ":</b> " + R.poles.filter(function (p) { return p.im >= 0; }).map(function (p) { return K("s = " + (p.im === 0 ? MT.niceTex(p.re) : (p.re === 0 ? "" : MT.niceTex(p.re)) + " \\pm " + (p.im === 1 ? "" : MT.niceTex(p.im)) + "j")); }).join(", ") +
            " · <b>" + L("บริเวณลู่เข้า (ROC)", "Region of convergence") + ":</b> " + K("\\operatorname{Re}(s) > " + MT.niceTex(R.sigma)) + "</p>";
          if (!R.hasDelta) { var fn = MT.compile(f, "t"), tmax = R.sigma < -0.05 ? Math.min(40, 8 / -R.sigma) : 10; h += plot([{ pts: sample(fn, 0, tmax, 500), color: MK.COLORS.b }], 0, tmax, { xlabel: "t", caption: L("กราฟ f(t) สำหรับ t ≥ 0", "Graph of f(t) for t ≥ 0") }); }
          h += '<p><a class="btn btn-ghost btn-sm" href="' + TOOLS + "inverse-laplace-transform-calculator/?f=" + encodeURIComponent(invInput(R)) + '">' + L("แปลงกลับด้วยเครื่องมือลาปลาซผกผัน →", "Invert it with the inverse Laplace calculator →") + "</a></p>";
        }
        out.innerHTML = h;
      } catch (e) { out.innerHTML = errBox(e); }
    }
    function invInput(R) {
      var p = function (c) { var s = ""; for (var i = c.length - 1; i >= 0; i--) { var x = +c[i].toPrecision(10); if (!x) continue; s += (x < 0 ? "-" : s ? "+" : "") + (Math.abs(x) === 1 && i ? "" : Math.abs(x)) + (i ? "s" + (i > 1 ? "^" + i : "") : ""); } return s || "0"; };
      return R.groups.map(function (g) { return (g.T ? "e^(-" + g.T + "s)*" : "") + "(" + p(g.N) + ")/(" + p(g.D) + ")"; }).join(" + ");
    }
    onSubmit(root, run); run();
  }

  /* =================================================================== 4. inverse Laplace (engine: lap-core.js) */
  var ILT_EN = [[/^เศษส่วนไม่แท้ \((.*)\) → หารยาวก่อน$/, "Improper fraction ($1): do the long division first"], [/^เศษส่วนแท้ \((.*)\) แยกเศษส่วนย่อยได้ทันที$/, "Proper fraction ($1): partial fractions apply directly"],
    [/^แยกตัวประกอบตัวส่วน หาโพล$/, "Factor the denominator and find the poles"], [/^เขียนรูปเศษส่วนย่อย$/, "Write the partial-fraction form"], [/^หาสัมประสิทธิ์ \(เรซิดิว\)$/, "Find the coefficients (residues)"], [/^ได้เศษส่วนย่อย$/, "Partial fractions"],
    [/^แปลงกลับทีละพจน์จากตาราง.*$/, "Invert term by term from the table (complex pairs combine into cos / sin)"], [/^เขียนพจน์แกว่งในรูปแอมพลิจูด–มุมเฟส$/, "Oscillating terms in amplitude–phase form"]];
  function ilaplace(root) {
    var LC = window.LapCore, f0 = QS.get("f") || root.dataset.f || "(s+3)/((s+1)(s+2)^2)";
    root.innerHTML = '<form class="mt-form"><div class="mt-row">' + field("mt-f", "F(s) =", f0, { wide: true }).replace("<input", "<input data-main") + '</div><button class="btn btn-primary" type="submit">' + L("แปลงลาปลาซผกผัน", "Invert") + "</button></form>" +
      chips(["(s+3)/((s+1)(s+2)^2)", "1/(s^2+4)", "1/(s(s^2+2s+5))", "s/(s^2+9)^2", "(2s+5)/(s^2+6s+25)", "e^(-2s)/(s(s+1))", "10/(s(s+2)(s+5))", "(s^2+1)/(s^3+6s^2+11s+6)"]) + '<div class="mt-out" aria-live="polite"></div>';
    var out = root.querySelector(".mt-out");
    function run() {
      if (!LC) { out.innerHTML = '<p class="mt-err">lap-core.js</p>'; return; }
      try {
        var src = root.querySelector("#mt-f").value;
        if (!src.trim()) throw new MT.Err("empty");
        var R = LC.solve(src.replace(/[−–]/g, "-").replace(/\*\*/g, "^")), tex = R.finalTex.replace(/^f\(t\) = /, "");
        var Ft = R.blocks.map(function (b, i) { var t = (b.T ? "e^{-" + (b.T === 1 ? "" : MK.nice(b.T)) + "s}" : "") + LC.ratTex(b.N, b.D); return i ? " + " + t : t; }).join("");
        var h = answer("f(t) = ℒ⁻¹{F(s)}", "\\mathcal{L}^{-1}\\left\\{" + Ft + "\\right\\} = " + tex, shareBtn({ f: src }));
        // check: ∫ f(t) e^{-st} dt against F(s) at a real s to the right of every pole
        var sg = 0; R.blocks.forEach(function (b) { b.pf.poles.forEach(function (p) { sg = Math.max(sg, p.p.re); }); });
        var s0 = sg + 1.7, Fv = 0, hasD = R.deltas.length > 0;
        R.blocks.forEach(function (b) { Fv += LC.evalRat(b.N, b.D, LC.C(s0, 0)).re * Math.exp(-s0 * b.T); });
        if (!hasD) {
          var span = 46 / 1.7, nm = 0; for (var i = 0; i < 80; i++) nm += MT.quad(function (t) { return R.f(t) * Math.exp(-s0 * t); }, span * i / 80, span * (i + 1) / 80, 1e-11).v;
          var ok = Math.abs(nm - Fv) <= 1e-5 * Math.max(1, Math.abs(Fv));
          if (!ok) throw new Error(L("ผลลัพธ์ไม่ผ่านการตรวจสอบเชิงตัวเลข จึงไม่แสดงคำตอบ ลองเขียนตัวส่วนในรูปแยกตัวประกอบ", "The result failed its numerical check, so it is not shown. Try writing the denominator in factored form."));
          h += badge(true, L("ตรวจแล้ว: แปลงลาปลาซของคำตอบเชิงตัวเลขที่ s = ", "Checked: the Laplace transform of the answer, computed numerically at s = ") + sig(s0, 4) + L(" ได้ ", ", is ") + sig(nm, 8) + L(" ตรงกับ F(s) = ", " and F(s) = ") + sig(Fv, 8));
        }
        h += '<h3 class="mt-h">' + L("วิธีทำด้วยเศษส่วนย่อย", "Working by partial fractions") + "</h3>";
        R.blocks.forEach(function (b, bi) {
          if (R.blocks.length > 1) h += '<p class="mt-rule">' + L("พจน์ที่ ", "Term ") + (bi + 1) + (b.T ? " · " + K("e^{-" + MK.nice(b.T) + "s}") + L(" เลื่อนเวลา ", " delays by ") + sig(b.T) + " s" : "") + "</p>";
          h += '<ol class="mt-steps">';
          b.steps.forEach(function (s) {
            var head = s.h; if (EN) ILT_EN.some(function (m) { if (m[0].test(head)) { head = head.replace(m[0], m[1]); return true; } });
            h += '<li><span class="mt-rule">' + esc(head) + "</span>" + (s.tex ? K(s.tex, true) : "") + (s.list ? s.list.map(function (c) { return K(c.tex, true); }).join("") : "") + "</li>";
          });
          h += "</ol>";
        });
        var slow = Infinity; R.blocks.forEach(function (b) { b.pf.poles.forEach(function (p) { if (p.p.re < -1e-6) slow = Math.min(slow, -p.p.re); }); });
        var tmax = Math.min(60, Math.max(4, (isFinite(slow) ? 7 / slow : 10) + R.maxT));
        h += plot([{ pts: sample(R.f, 0, tmax, 600), color: MK.COLORS.a }], 0, tmax, { xlabel: "t", caption: L("กราฟ f(t) สำหรับ t ≥ 0", "Graph of f(t) for t ≥ 0") + (hasD ? L(" (ไม่แสดงอิมพัลส์ δ)", " (the impulse δ is not drawn)") : "") });
        out.innerHTML = h;
      } catch (e) {
        var msg = errText(e);
        if (EN && /[฀-๿]/.test(msg)) msg = "Could not read F(s). Enter a ratio of polynomials in s, e.g. (s+3)/((s+1)(s+2)^2); a delay is written e^(-2s)/(s+1).";
        out.innerHTML = '<p class="mt-err" role="alert">' + esc(msg) + "</p>";
      }
    }
    onSubmit(root, run); run();
  }

  /* =================================================================== 5. Fourier series */
  var FS = [
    { id: "square", th: "คลื่นสี่เหลี่ยม ±1", en: "Square wave ±1", T: "2*pi", p: [["1", "0", "pi"], ["-1", "pi", "2*pi"]] },
    { id: "saw", th: "คลื่นฟันเลื่อย f(t) = t", en: "Sawtooth f(t) = t", T: "2*pi", p: [["t", "-pi", "pi"]] },
    { id: "tri", th: "คลื่นสามเหลี่ยม |t|", en: "Triangle |t|", T: "2*pi", p: [["abs(t)", "-pi", "pi"]] },
    { id: "full", th: "ไซน์เรียงกระแสเต็มคลื่น |sin t|", en: "Full-wave rectified sine |sin t|", T: "pi", p: [["sin(t)", "0", "pi"]] },
    { id: "half", th: "ไซน์เรียงกระแสครึ่งคลื่น", en: "Half-wave rectified sine", T: "2*pi", p: [["sin(t)", "0", "pi"], ["0", "pi", "2*pi"]] },
    { id: "pulse", th: "พัลส์ ดิวตี 25 %", en: "Pulse train, 25 % duty", T: "1", p: [["1", "0", "0.25"], ["0", "0.25", "1"]] },
    { id: "para", th: "พาราโบลา t²", en: "Parabola t²", T: "2*pi", p: [["t^2", "-pi", "pi"]] },
    { id: "exp", th: "เอกซ์โพเนนเชียล e^(−t)", en: "Exponential e^(−t)", T: "2", p: [["e^(-t)", "0", "2"]] }
  ];
  function fourier(root) {
    var init = FS.find(function (x) { return x.id === (QS.get("w") || root.dataset.w); }) || FS[0];
    var rows = QS.get("p") ? QS.get("p").split(";").map(function (r) { return r.split("|"); }) : init.p, T0 = QS.get("T") || init.T;
    function rowHtml(i, r) { r = r || ["", "", ""]; return '<div class="mt-row mt-piece">' + field("mt-pf" + i, "f(t) =", r[0], { wide: true }) + field("mt-pa" + i, L("ตั้งแต่ t =", "from t ="), r[1]) + field("mt-pb" + i, L("ถึง t =", "to t ="), r[2]) + "</div>"; }
    root.innerHTML = '<form class="mt-form"><div class="mt-chips"><span class="mono">' + L("รูปคลื่นสำเร็จรูป", "Ready-made waveforms") + "</span>" + FS.map(function (w) { return '<button type="button" class="mt-chip" data-wave="' + w.id + '">' + (EN ? w.en : w.th) + "</button>"; }).join("") + "</div>" +
      '<p class="hint">' + L("กำหนดฟังก์ชันหนึ่งคาบเป็นช่วง ๆ (ไม่เกิน 3 ช่วง เว้นช่วงที่ไม่ใช้ให้ว่าง) ช่วงทั้งหมดต้องต่อกันและรวมกันยาวเท่ากับคาบ T", "Define one period piece by piece (up to 3 pieces; leave unused rows empty). The pieces must join up and together span one period T.") + "</p>" +
      rowHtml(0, rows[0]) + rowHtml(1, rows[1]) + rowHtml(2, rows[2]) + '<div class="mt-row">' + field("mt-T", L("คาบ T", "Period T"), T0) + select("mt-N", L("จำนวนฮาร์มอนิก N", "Harmonics N"), [[5, "5"], [10, "10"], [15, "15"], [25, "25"], [40, "40"]], QS.get("N") || 10) + "</div>" +
      '<button class="btn btn-primary" type="submit">' + L("หาอนุกรมฟูเรียร์", "Find the Fourier series") + '</button></form><div class="mt-out" aria-live="polite"></div>';
    var out = root.querySelector(".mt-out"), res = null, pieces = null;
    var g = function (id) { return root.querySelector("#" + id).value.trim(); };
    function draw(N) {
      var a = pieces[0].a, T = res.T, f = function (t) { var x = a + ((t - a) % T + T) % T; for (var i = 0; i < pieces.length; i++) if (x >= pieces[i].a && x < pieces[i].b) return pieces[i].f(x); return pieces[pieces.length - 1].f(x); };
      return MK.plot({ w: PW, h: PH, xmin: a - T / 2, xmax: a + 1.5 * T, series: [{ pts: sample(f, a - T / 2, a + 1.5 * T, 900), color: MK.COLORS.b, width: 1.6 }, { pts: sample(function (t) { return res.partial(t, N); }, a - T / 2, a + 1.5 * T, 900), color: MK.COLORS.a }], xlabel: "t", id: MK.uid("mt") });
    }
    function run() {
      try {
        var T = MT.evalf(MT.parse(g("mt-T")), {}), N = +g("mt-N"), span = 0;
        if (!(T > 0)) throw new Error(L("คาบ T ต้องมากกว่าศูนย์", "The period T must be positive."));
        pieces = [];
        var texP = [];
        for (var i = 0; i < 3; i++) {
          var fs = g("mt-pf" + i); if (!fs) continue;
          var node = MT.parse(fs, { step: true }), sy = MT.symbols(node);
          if (sy.length > 1 || (sy.length === 1 && sy[0] !== "t")) { if (sy.length === 1) node = MT.subst(node, sy[0], MT.S("t")); else throw new MT.Err("var", sy.filter(function (s) { return s !== "t"; }).join(", ")); }
          var an = MT.parse(g("mt-pa" + i)), bn = MT.parse(g("mt-pb" + i)), a = MT.evalf(an, {}), b = MT.evalf(bn, {});
          if (!(b > a)) throw new Error(L("ปลายช่วงต้องมากกว่าต้นช่วง", "Each piece must end after it starts."));
          pieces.push({ f: MT.compile(node, "t"), a: a, b: b }); span += b - a;
          texP.push(MT.tex(node) + " & " + MT.tex(an) + " \\le t < " + MT.tex(bn));
        }
        if (!pieces.length) throw new MT.Err("empty");
        pieces.sort(function (x, y) { return x.a - y.a; });
        for (i = 1; i < pieces.length; i++) if (Math.abs(pieces[i].a - pieces[i - 1].b) > 1e-9) throw new Error(L("ช่วงต้องต่อกันพอดี ไม่ซ้อนและไม่เว้น", "The pieces must join exactly, with no gap or overlap."));
        if (Math.abs(span - T) > 1e-9 * T) throw new Error(L("ความยาวรวมของทุกช่วง (", "The pieces span ") + sig(span) + L(") ต้องเท่ากับคาบ T (", " in total, but the period T is ") + sig(T) + L(")", "."));
        res = MT.fourier(pieces, T, N);
        var w0 = MT.niceTex(res.w0), wt = function (n) { var c = n * res.w0, t = MT.niceTex(c); return (t === "1" ? "" : t) + "t"; };
        var terms = [], shown = 0;
        if (res.a0 !== 0) terms.push({ s: res.a0 < 0, t: MT.niceTex(Math.abs(res.a0)) });
        for (var n = 1; n <= N && shown < 5; n++) {
          if (res.a[n] !== 0) { var ca = MT.niceTex(Math.abs(res.a[n])); terms.push({ s: res.a[n] < 0, t: (ca === "1" ? "" : ca) + "\\cos " + wt(n) }); shown++; }
          if (res.b[n] !== 0) { var cb = MT.niceTex(Math.abs(res.b[n])); terms.push({ s: res.b[n] < 0, t: (cb === "1" ? "" : cb) + "\\sin " + wt(n) }); shown++; }
        }
        var series = terms.map(function (x, i) { return (x.s ? (i ? " - " : "-") : i ? " + " : "") + x.t; }).join("") + " + \\cdots";
        var p = [0, 1, 2].map(function (i) { return [g("mt-pf" + i), g("mt-pa" + i), g("mt-pb" + i)].join("|"); }).filter(function (r) { return r !== "||"; }).join(";");
        var h = answer(L("อนุกรมฟูเรียร์", "Fourier series"), "f(t) = " + series, shareBtn({ p: p, T: g("mt-T"), N: N === 10 ? "" : N }));
        h += K("f(t) = \\begin{cases}" + texP.join(" \\\\ ") + "\\end{cases}", true) + K("T = " + MT.niceTex(T) + ",\\qquad \\omega_0 = \\frac{2\\pi}{T} = " + w0, true);
        var notes = [];
        if (res.even) notes.push(L("ฟังก์ชันคู่ → ไม่มีพจน์ sin (bₙ = 0)", "even function → no sine terms (bₙ = 0)"));
        if (res.odd) notes.push(L("ฟังก์ชันคี่ → ไม่มีค่าเฉลี่ยและพจน์ cos (a₀ = aₙ = 0)", "odd function → no mean and no cosine terms (a₀ = aₙ = 0)"));
        if (res.half && !(res.even && res.odd)) notes.push(L("สมมาตรครึ่งคลื่น → มีเฉพาะฮาร์มอนิกคี่", "half-wave symmetry → odd harmonics only"));
        if (notes.length) h += badge(true, L("สมมาตร: ", "Symmetry: ") + notes.join(" · "));
        h += '<div class="mt-kv"><span>' + K("a_0") + L(" (ค่าเฉลี่ย)", " (mean)") + " = " + K(MT.niceTex(res.a0)) + "</span><span>RMS = " + sig(res.rms, 6) + "</span>" + (isFinite(res.thd) ? "<span>THD = " + sig(res.thd * 100, 4) + " %</span>" : "") + "<span>" + L("กำลังที่ N ฮาร์มอนิกแรกเก็บได้ (พาร์เซวาล)", "Power captured by the first N harmonics (Parseval)") + " = " + sig(res.captured * 100, 5) + " %</span></div>";
        h += '<figure class="mt-plot"><div id="mt-fsp">' + draw(Math.min(N, 5)) + '</div><figcaption><label>' + L("จำนวนฮาร์มอนิกที่รวม: ", "Harmonics summed: ") + '<output id="mt-fso">' + Math.min(N, 5) + '</output> <input type="range" id="mt-fsn" min="0" max="' + N + '" value="' + Math.min(N, 5) + '"></label> · ' + L("น้ำเงิน f(t) · ส้ม ผลรวมบางส่วน S_N(t) (ยอดเกินที่จุดกระโดดคือปรากฏการณ์กิบส์)", "blue: f(t) · orange: partial sum S_N(t) (the overshoot at jumps is the Gibbs phenomenon)") + "</figcaption></figure>";
        h += '<h3 class="mt-h">' + L("ตารางสัมประสิทธิ์", "Coefficient table") + '</h3><div class="table-wrap"><table class="mt-tb"><thead><tr><th>n</th><th>' + K("a_n") + "</th><th>" + K("b_n") + "</th><th>" + K("c_n = \\sqrt{a_n^2 + b_n^2}") + "</th><th>" + L("ทศนิยม aₙ", "aₙ decimal") + "</th><th>" + L("ทศนิยม bₙ", "bₙ decimal") + "</th></tr></thead><tbody>";
        for (n = 1; n <= Math.min(N, 15); n++) h += "<tr><td>" + n + "</td><td>" + K(MT.niceTex(res.a[n])) + "</td><td>" + K(MT.niceTex(res.b[n])) + "</td><td>" + K(MT.niceTex(res.c[n])) + "</td><td>" + sig(res.a[n], 6) + "</td><td>" + sig(res.b[n], 6) + "</td></tr>";
        h += "</tbody></table></div>" + '<p class="hint">' + L("สัมประสิทธิ์คำนวณด้วยการอินทิเกรตเชิงตัวเลขความแม่นยำสูง แล้วจับคู่กับรูปปิด เช่น 4/π หรือ 2/(3π) เมื่อค่าตรงกันถึงทศนิยมตำแหน่งที่ 9", "Coefficients come from high-accuracy numerical integration and are then matched to closed forms such as 4/π or 2/(3π) when they agree to nine decimal places.") + "</p>";
        out.innerHTML = h;
      } catch (e) { out.innerHTML = errBox(e); }
    }
    root.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); });
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-copy]"); if (c) return copy(c.getAttribute("data-copy"), c);
      var w = e.target.closest("[data-wave]"); if (!w) return;
      var d = FS.find(function (x) { return x.id === w.dataset.wave; });
      for (var i = 0; i < 3; i++) { var r = d.p[i] || ["", "", ""]; root.querySelector("#mt-pf" + i).value = r[0]; root.querySelector("#mt-pa" + i).value = r[1]; root.querySelector("#mt-pb" + i).value = r[2]; }
      root.querySelector("#mt-T").value = d.T; run();
    });
    root.addEventListener("input", function (e) { if (e.target.id === "mt-fsn" && res) { root.querySelector("#mt-fso").textContent = e.target.value; root.querySelector("#mt-fsp").innerHTML = draw(+e.target.value); } });
    run();
  }

  /* =================================================================== 6. area */
  var RAI = 1600, NGAN = 400, WA2 = 4; // m²
  function landTh(m2) { var wa = m2 / WA2, rai = Math.floor(wa / 400 + 1e-9), ngan = Math.floor((wa - rai * 400) / 100 + 1e-9), w = wa - rai * 400 - ngan * 100; return EN ? rai + " rai " + ngan + " ngan " + sig(w, 5) + " sq wa" : rai + " ไร่ " + ngan + " งาน " + sig(w, 5) + " ตารางวา"; }
  var UNIT = { mm: 0.001, cm: 0.01, m: 1, km: 1000, "in": 0.0254, ft: 0.3048, wa: 2 };
  var SH = [
    { id: "rect", th: "สี่เหลี่ยมผืนผ้า", en: "Rectangle", in: [["a", "กว้าง", "Width"], ["b", "ยาว", "Length"]], f: "A = ab", A: function (v) { return v.a * v.b; }, P: function (v) { return 2 * (v.a + v.b); } },
    { id: "sq", th: "สี่เหลี่ยมจัตุรัส", en: "Square", in: [["a", "ด้าน", "Side"]], f: "A = a^{2}", A: function (v) { return v.a * v.a; }, P: function (v) { return 4 * v.a; } },
    { id: "tri", th: "สามเหลี่ยม (ฐาน × สูง)", en: "Triangle (base × height)", in: [["b", "ฐาน", "Base"], ["h", "สูง", "Height"]], f: "A = \\tfrac{1}{2}bh", A: function (v) { return v.b * v.h / 2; } },
    { id: "heron", th: "สามเหลี่ยม (รู้ 3 ด้าน สูตรเฮรอน)", en: "Triangle (three sides, Heron)", in: [["a", "ด้าน a", "Side a"], ["b", "ด้าน b", "Side b"], ["c", "ด้าน c", "Side c"]], f: "A = \\sqrt{s(s-a)(s-b)(s-c)},\\; s = \\tfrac{a+b+c}{2}",
      A: function (v) { var s = (v.a + v.b + v.c) / 2, x = s * (s - v.a) * (s - v.b) * (s - v.c); if (x <= 0) throw new Error(L("สามด้านนี้ประกอบเป็นสามเหลี่ยมไม่ได้ (ผลบวกสองด้านต้องมากกว่าด้านที่สาม)", "These sides do not form a triangle (any two sides must sum to more than the third).")); return Math.sqrt(x); }, P: function (v) { return v.a + v.b + v.c; } },
    { id: "sas", th: "สามเหลี่ยม (2 ด้านกับมุมระหว่างด้าน)", en: "Triangle (two sides and the included angle)", in: [["a", "ด้าน a", "Side a"], ["b", "ด้าน b", "Side b"], ["C", "มุม C (องศา)", "Angle C (degrees)", 1]], f: "A = \\tfrac{1}{2}ab\\sin C", A: function (v) { return v.a * v.b * Math.sin(v.C * Math.PI / 180) / 2; } },
    { id: "circle", th: "วงกลม", en: "Circle", in: [["r", "รัศมี", "Radius"]], f: "A = \\pi r^{2}", A: function (v) { return Math.PI * v.r * v.r; }, P: function (v) { return 2 * Math.PI * v.r; } },
    { id: "sector", th: "เซกเตอร์ (รูปพัด)", en: "Sector", in: [["r", "รัศมี", "Radius"], ["C", "มุมที่จุดศูนย์กลาง (องศา)", "Central angle (degrees)", 1]], f: "A = \\tfrac{\\theta}{360^{\\circ}}\\pi r^{2}", A: function (v) { return v.C / 360 * Math.PI * v.r * v.r; }, P: function (v) { return 2 * v.r + v.C * Math.PI / 180 * v.r; } },
    { id: "ellipse", th: "วงรี", en: "Ellipse", in: [["a", "กึ่งแกนเอก a", "Semi-major axis a"], ["b", "กึ่งแกนโท b", "Semi-minor axis b"]], f: "A = \\pi ab", A: function (v) { return Math.PI * v.a * v.b; }, P: function (v) { var h = Math.pow((v.a - v.b) / (v.a + v.b), 2); return Math.PI * (v.a + v.b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h))); } },
    { id: "trap", th: "สี่เหลี่ยมคางหมู", en: "Trapezoid", in: [["a", "ด้านคู่ขนาน a", "Parallel side a"], ["b", "ด้านคู่ขนาน b", "Parallel side b"], ["h", "สูง", "Height"]], f: "A = \\tfrac{1}{2}(a+b)h", A: function (v) { return (v.a + v.b) * v.h / 2; } },
    { id: "para", th: "สี่เหลี่ยมด้านขนาน", en: "Parallelogram", in: [["b", "ฐาน", "Base"], ["h", "สูง", "Height"]], f: "A = bh", A: function (v) { return v.b * v.h; } },
    { id: "rhombus", th: "สี่เหลี่ยมขนมเปียกปูน (เส้นทแยงมุม)", en: "Rhombus (diagonals)", in: [["p", "เส้นทแยงมุม p", "Diagonal p"], ["q", "เส้นทแยงมุม q", "Diagonal q"]], f: "A = \\tfrac{1}{2}pq", A: function (v) { return v.p * v.q / 2; }, P: function (v) { return 2 * Math.hypot(v.p, v.q); } },
    { id: "ngon", th: "รูปหลายเหลี่ยมด้านเท่ามุมเท่า", en: "Regular polygon", in: [["n", "จำนวนด้าน n", "Number of sides n", 1], ["a", "ความยาวด้าน", "Side length"]], f: "A = \\frac{n a^{2}}{4\\tan(\\pi/n)}", A: function (v) { if (v.n < 3) throw new Error(L("ต้องมีอย่างน้อย 3 ด้าน", "At least 3 sides are needed.")); return v.n * v.a * v.a / (4 * Math.tan(Math.PI / v.n)); }, P: function (v) { return v.n * v.a; } },
    { id: "ring", th: "วงแหวน", en: "Annulus (ring)", in: [["R", "รัศมีนอก R", "Outer radius R"], ["r", "รัศมีใน r", "Inner radius r"]], f: "A = \\pi(R^{2} - r^{2})", A: function (v) { return Math.PI * (v.R * v.R - v.r * v.r); } }
  ];
  function area(root) {
    var tab = QS.get("m") || root.dataset.m || "shape";
    var tabs = [["shape", L("รูปทรงเรขาคณิต", "Shapes")], ["curve", L("ใต้กราฟ / ระหว่างกราฟ", "Under / between curves")], ["poly", L("รูปหลายเหลี่ยมจากพิกัด", "Polygon from coordinates")], ["land", L("แปลงหน่วย ไร่ งาน ตารางวา", "Thai land units")]];
    root.innerHTML = '<div class="seg mt-tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-pressed="' + (t[0] === tab) + '">' + t[1] + "</button>"; }).join("") + '</div><div class="mt-pane"></div>';
    var pane = root.querySelector(".mt-pane");
    var units = [["m", L("เมตร (m)", "metre (m)")], ["cm", L("เซนติเมตร (cm)", "centimetre (cm)")], ["mm", L("มิลลิเมตร (mm)", "millimetre (mm)")], ["km", L("กิโลเมตร (km)", "kilometre (km)")], ["wa", L("วา", "wa (2 m)")], ["ft", L("ฟุต (ft)", "foot (ft)")], ["in", L("นิ้ว (in)", "inch (in)")]];
    function shape() {
      var sid = QS.get("s") || "rect";
      pane.innerHTML = '<form class="mt-form"><div class="mt-row">' + select("mt-s", L("รูปทรง", "Shape"), SH.map(function (s) { return [s.id, EN ? s.en : s.th]; }), sid) + select("mt-u", L("หน่วยความยาว", "Length unit"), units, QS.get("u") || "m") + '</div><div class="mt-row" id="mt-dims"></div><button class="btn btn-primary" type="submit">' + L("คำนวณพื้นที่", "Calculate area") + '</button></form><div class="mt-out" aria-live="polite"></div>';
      var out = pane.querySelector(".mt-out"), dims = pane.querySelector("#mt-dims");
      var defs = { a: 4, b: 6, c: 5, h: 3, r: 2, R: 5, C: 60, n: 6, p: 6, q: 8 };
      function build() { var s = SH.find(function (x) { return x.id === pane.querySelector("#mt-s").value; }); dims.innerHTML = s.in.map(function (d) { return field("mt-d-" + d[0], EN ? d[2] : d[1], QS.get(d[0]) || defs[d[0]], { mode: "decimal" }); }).join(""); }
      function run() {
        try {
          var s = SH.find(function (x) { return x.id === pane.querySelector("#mt-s").value; }), u = pane.querySelector("#mt-u").value, v = {}, params = { m: "", s: s.id, u: u === "m" ? "" : u };
          s.in.forEach(function (d) { var x = MT.evalf(MT.parse(pane.querySelector("#mt-d-" + d[0]).value), {}); if (!(x > 0)) throw new Error(L("ทุกค่าต้องมากกว่าศูนย์", "Every value must be positive.")); v[d[0]] = x; params[d[0]] = x; });
          if (s.id === "ring" && v.r >= v.R) throw new Error(L("รัศมีในต้องน้อยกว่ารัศมีนอก", "The inner radius must be smaller than the outer radius."));
          var A = s.A(v), ul = u === "wa" ? L("ตารางวา", "sq wa") : u + "²", m2 = A * UNIT[u] * UNIT[u];
          var sub = s.f.split(",")[0].replace(/^A = /, "");
          var h = answer(L("พื้นที่", "Area"), s.f + "\\;\\Rightarrow\\; A = " + sig(A, 8) + "\\ \\text{" + (u === "wa" ? (EN ? "sq wa" : "ตร.วา") : u + "}^{2}\\text{") + "}", shareBtn(params));
          h += '<div class="mt-kv"><span>' + L("พื้นที่", "Area") + " = <b>" + grp(A, 6) + " " + ul + "</b></span>" + (s.P ? "<span>" + L("เส้นรอบรูป", "Perimeter") + " = " + grp(s.P(v), 6) + " " + (u === "wa" ? L("วา", "wa") : u) + (s.id === "ellipse" ? L(" (สูตรประมาณของรามานุจัน)", " (Ramanujan's approximation)") : "") + "</span>" : "") +
            "<span>= " + grp(m2, 6) + " m²</span>" + (m2 >= 1 ? "<span>= " + landTh(m2) + "</span>" : "") + (m2 >= 0.01 ? "<span>= " + grp(m2 / 0.09290304, 4) + " ft²</span>" : "") + "</div>";
          out.innerHTML = h; void sub;
        } catch (e) { out.innerHTML = errBox(e); }
      }
      build(); pane.querySelector("#mt-s").addEventListener("change", function () { build(); run(); });
      pane.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); }); run();
    }
    function curve() {
      pane.innerHTML = '<form class="mt-form"><div class="mt-row">' + field("mt-f", L("เส้นโค้งบน f(x) =", "Upper curve f(x) ="), QS.get("f") || "4 - x^2", { wide: true }) + field("mt-g", L("เส้นโค้งล่าง g(x) = (ใส่ 0 = แกน x)", "Lower curve g(x) = (0 = the x-axis)"), QS.get("g") || "0", { wide: true }) + '</div><div class="mt-row">' + field("mt-a", L("จาก x = a (เว้นว่าง = หาจุดตัดให้)", "from x = a (empty = find the crossings)"), QS.get("a") || "") + field("mt-b", L("ถึง x = b", "to x = b"), QS.get("b") || "") + '</div><button class="btn btn-primary" type="submit">' + L("คำนวณพื้นที่", "Calculate area") + "</button></form>" +
        '<div class="mt-chips"><span class="mono">' + L("ตัวอย่าง", "Examples") + "</span>" + [["4 - x^2", "0"], ["x", "x^2"], ["sin(x)", "0"], ["x^3 - 3x", "x"], ["e^x", "1"]].map(function (p) { return '<button type="button" class="mt-chip" data-f="' + esc(p[0]) + '" data-g="' + esc(p[1]) + '">' + esc(p[0]) + (p[1] === "0" ? "" : " , " + esc(p[1])) + "</button>"; }).join("") + '</div><div class="mt-out" aria-live="polite"></div>';
      var out = pane.querySelector(".mt-out");
      function run() {
        try {
          var fN = MT.parse(pane.querySelector("#mt-f").value), gN = MT.parse(pane.querySelector("#mt-g").value || "0"), v = pickVar(MT.add([fN, gN]), null);
          var f = MT.compile(fN, v), g = MT.compile(gN, v), d = function (x) { return f(x) - g(x); }, as = pane.querySelector("#mt-a").value.trim(), bs = pane.querySelector("#mt-b").value.trim(), a, b, auto = false;
          if (as && bs) { a = MT.evalf(MT.parse(as), {}); b = MT.evalf(MT.parse(bs), {}); if (a > b) { var t = a; a = b; b = t; } }
          else {
            var z = MT.zeros(d, -50, 50, 20000).filter(function (x, i, arr) { return !i || Math.abs(x - arr[i - 1]) > 1e-6; });
            if (z.length < 2) throw new Error(L("หาจุดตัดของสองเส้นโค้งได้ไม่ถึง 2 จุดในช่วง −50 ถึง 50 กรุณากำหนด a และ b เอง", "Fewer than two crossings were found between −50 and 50. Enter a and b yourself."));
            if (z.length > 12) z = z.filter(function (x) { return Math.abs(x) <= 10; });
            a = z[0]; b = z[z.length - 1]; auto = true;
          }
          var cuts = [a].concat(MT.zeros(d, a, b, 4000).filter(function (x) { return x > a + 1e-7 && x < b - 1e-7; })).concat([b]), total = 0, signedI = MT.quad(d, a, b, 1e-11).v, rows = "";
          for (var i = 0; i < cuts.length - 1; i++) { var q = MT.quad(d, cuts[i], cuts[i + 1], 1e-11).v; total += Math.abs(q); rows += "<tr><td>" + sig(cuts[i], 6) + " → " + sig(cuts[i + 1], 6) + "</td><td>" + (q >= 0 ? "f ≥ g" : "g ≥ f") + "</td><td>" + sig(Math.abs(q), 10) + "</td></tr>"; }
          var ft = MT.tex(fN), gt = MT.tex(gN), isAxis = gt === "0";
          var h = answer(L("พื้นที่", "Area"), "A = \\int_{" + MT.niceTex(a) + "}^{" + MT.niceTex(b) + "} \\left|" + (isAxis ? ft : ft + " - \\left(" + gt + "\\right)") + "\\right| d" + v + " = " + MT.niceTex(total, 10) + (MT.niceTex(total, 10) === sig(total, 10) ? "" : " \\approx " + sig(total, 8)), shareBtn({ m: "curve", f: pane.querySelector("#mt-f").value, g: isAxis ? "" : pane.querySelector("#mt-g").value, a: as, b: bs }));
          if (auto) h += badge(true, L("หาขอบเขตจากจุดตัดให้อัตโนมัติ: ", "Limits taken from the crossings: ") + v + " = " + cuts.map(function (x) { return sig(x, 6); }).join(", "));
          if (cuts.length > 2) h += badge(false, L("เส้นโค้งตัดกันภายในช่วง จึงแบ่งคิดทีละช่วงแล้วรวมค่าสัมบูรณ์ (ปริพันธ์มีเครื่องหมายทั้งช่วง = ", "The curves cross inside the interval, so each part is integrated separately and the absolute values are added (the signed integral over the whole interval is ") + sig(signedI, 8) + ")");
          h += '<div class="table-wrap"><table class="mt-tb"><thead><tr><th>' + L("ช่วง", "Interval") + "</th><th>" + L("เส้นที่อยู่บน", "Upper curve") + "</th><th>" + L("พื้นที่", "Area") + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
          var m = (b - a) * 0.2 || 1, band = sample(f, a, b, 300), low = sample(g, a, b, 300);
          var poly = band.concat(low.slice().reverse()), yr = autoY([sample(f, a - m, b + m, 400), sample(g, a - m, b + m, 400)]);
          var svg = MK.plot({ w: PW, h: PH, xmin: a - m, xmax: b + m, ymin: yr[0], ymax: yr[1], series: [{ pts: sample(f, a - m, b + m, 500), color: MK.COLORS.b }, { pts: sample(g, a - m, b + m, 500), color: MK.COLORS.c }], xlabel: v, id: MK.uid("mt") });
          var map = MK.lastMap(), path = poly.filter(function (p) { return isFinite(p[1]); }).map(function (p, i) { return (i ? "L" : "M") + map.sx(p[0]).toFixed(1) + " " + map.sy(Math.max(yr[0], Math.min(yr[1], p[1]))).toFixed(1); }).join("") + "Z";
          h += '<figure class="mt-plot">' + svg.replace("</svg>", '<path d="' + path + '" fill="var(--accent)" opacity=".22"/></svg>') + "<figcaption>" + L("น้ำเงิน f · เขียว g · ส่วนแรเงาคือพื้นที่ที่คำนวณ", "blue: f · green: g · the shaded region is the computed area") + "</figcaption></figure>";
          out.innerHTML = h;
        } catch (e) { out.innerHTML = errBox(e); }
      }
      pane.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); });
      pane.addEventListener("click", function (e) { var c = e.target.closest("[data-f]"); if (c && c.classList.contains("mt-chip")) { pane.querySelector("#mt-f").value = c.dataset.f; pane.querySelector("#mt-g").value = c.dataset.g; pane.querySelector("#mt-a").value = ""; pane.querySelector("#mt-b").value = ""; run(); } });
      run();
    }
    function poly() {
      pane.innerHTML = '<form class="mt-form"><label class="mt-f mt-wide"><span>' + L("พิกัดจุดยอดเรียงตามขอบรูป บรรทัดละจุด: x y (หรือ x, y)", "Vertices in order around the outline, one per line: x y (or x, y)") + '</span><textarea class="num mt-in mt-ta" id="mt-pts" rows="7" spellcheck="false">' + esc(QS.get("pts") ? QS.get("pts").replace(/;/g, "\n") : "0 0\n40 0\n40 25\n22 38\n0 25") + '</textarea></label><div class="mt-row">' + select("mt-u", L("หน่วยของพิกัด", "Coordinate unit"), units, QS.get("u") || "m") + '</div><button class="btn btn-primary" type="submit">' + L("คำนวณพื้นที่", "Calculate area") + '</button></form><div class="mt-out" aria-live="polite"></div>';
      var out = pane.querySelector(".mt-out");
      function run() {
        try {
          var pts = pane.querySelector("#mt-pts").value.split(/\n+/).map(function (l) { return l.trim().split(/[\s,;]+/).map(Number); }).filter(function (p) { return p.length >= 2 && isFinite(p[0]) && isFinite(p[1]); }), u = pane.querySelector("#mt-u").value;
          if (pts.length < 3) throw new Error(L("ต้องมีอย่างน้อย 3 จุด", "At least 3 points are needed."));
          var s = 0, per = 0, cx = 0, cy = 0;
          pts.forEach(function (p, i) { var q = pts[(i + 1) % pts.length], cr = p[0] * q[1] - q[0] * p[1]; s += cr; cx += (p[0] + q[0]) * cr; cy += (p[1] + q[1]) * cr; per += Math.hypot(q[0] - p[0], q[1] - p[1]); });
          var A = Math.abs(s) / 2, m2 = A * UNIT[u] * UNIT[u], ul = u === "wa" ? L("ตารางวา", "sq wa") : u + "²";
          var h = answer(L("พื้นที่ (สูตรเชือกผูกรองเท้า)", "Area (shoelace formula)"), "A = \\frac{1}{2}\\left|\\sum_{i=1}^{n}\\left(x_i y_{i+1} - x_{i+1} y_i\\right)\\right| = " + sig(A, 10), shareBtn({ m: "poly", pts: pts.map(function (p) { return p[0] + " " + p[1]; }).join(";"), u: u === "m" ? "" : u }));
          h += '<div class="mt-kv"><span>' + L("พื้นที่", "Area") + " = <b>" + grp(A, 6) + " " + ul + "</b></span><span>" + L("เส้นรอบรูป", "Perimeter") + " = " + grp(per, 6) + "</span><span>= " + grp(m2, 6) + " m²</span>" + (m2 >= 1 ? "<span>= " + landTh(m2) + "</span>" : "") + "<span>" + L("จุดเซนทรอยด์", "Centroid") + " = (" + sig(cx / (3 * s), 6) + ", " + sig(cy / (3 * s), 6) + ")</span><span>" + L("ทิศการเรียงจุด: ", "Vertex order: ") + (s > 0 ? L("ทวนเข็มนาฬิกา", "counter-clockwise") : L("ตามเข็มนาฬิกา", "clockwise")) + "</span></div>";
          var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), w = (x1 - x0) || 1, hh = (y1 - y0) || 1, sc = Math.min(640 / w, 300 / hh);
          var X = function (x) { return 40 + (x - x0) * sc; }, Y = function (y) { return 20 + (y1 - y) * sc; };
          h += '<figure class="mt-plot"><svg class="mk-plot" viewBox="0 0 ' + (80 + w * sc).toFixed(0) + " " + (40 + hh * sc).toFixed(0) + '" role="img" aria-label="polygon"><polygon points="' + pts.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ") + '" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="2"/>' + pts.map(function (p, i) { return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="4" fill="var(--signal)"/><text class="mk-ann" x="' + (X(p[0]) + 6).toFixed(1) + '" y="' + (Y(p[1]) - 6).toFixed(1) + '">' + (i + 1) + "</text>"; }).join("") + "</svg><figcaption>" + L("รูปตามพิกัดที่ป้อน (รูปที่เส้นขอบตัดกันเองให้ผลไม่ถูกต้อง)", "The outline as entered (self-intersecting outlines give a wrong result)") + "</figcaption></figure>";
          out.innerHTML = h;
        } catch (e) { out.innerHTML = errBox(e); }
      }
      pane.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); }); run();
    }
    function land() {
      pane.innerHTML = '<form class="mt-form"><div class="mt-row">' + field("mt-rai", L("ไร่", "Rai"), QS.get("rai") || "1", { mode: "decimal" }) + field("mt-ngan", L("งาน", "Ngan"), QS.get("ngan") || "2", { mode: "decimal" }) + field("mt-wa", L("ตารางวา", "Square wa"), QS.get("wa") || "50", { mode: "decimal" }) + '</div><p class="hint">' + L("หรือพิมพ์พื้นที่เป็นตารางเมตรในช่องด้านล่างเพื่อแปลงกลับ", "Or type an area in square metres below to convert the other way.") + '</p><div class="mt-row">' + field("mt-m2", L("ตารางเมตร (m²)", "Square metres (m²)"), "", { mode: "decimal" }) + '</div><button class="btn btn-primary" type="submit">' + L("แปลงหน่วย", "Convert") + '</button></form><div class="mt-out" aria-live="polite"></div>';
      var out = pane.querySelector(".mt-out"), last = "th";
      function run() {
        var g = function (id) { return num(pane.querySelector("#" + id).value) || 0; }, m2;
        if (last === "m2" && g("mt-m2") > 0) m2 = g("mt-m2"); else { m2 = g("mt-rai") * RAI + g("mt-ngan") * NGAN + g("mt-wa") * WA2; pane.querySelector("#mt-m2").value = +m2.toFixed(4); }
        out.innerHTML = '<div class="mt-ans"><p class="mt-ans-l">' + L("ผลการแปลง", "Result") + '</p><p class="mt-big">' + landTh(m2) + " = " + grp(m2, 4) + ' m²</p></div><div class="mt-kv"><span>' + grp(m2 / WA2, 4) + " " + L("ตารางวา", "sq wa") + "</span><span>" + grp(m2 / RAI, 6) + " " + L("ไร่", "rai") + "</span><span>" + grp(m2 / 10000, 6) + " " + L("เฮกตาร์", "hectare") + "</span><span>" + grp(m2 / 4046.8564224, 6) + " " + L("เอเคอร์", "acre") + "</span><span>" + grp(m2 / 0.09290304, 2) + " ft²</span><span>" + grp(m2 / 1e6, 8) + " km²</span></div>";
      }
      pane.addEventListener("input", function (e) { last = e.target.id === "mt-m2" ? "m2" : "th"; });
      pane.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); }); run();
    }
    var panes = { shape: shape, curve: curve, poly: poly, land: land };
    root.querySelector(".mt-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (!b) return; $$("[data-tab]", root).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); QS = new URLSearchParams(); panes[b.dataset.tab](); });
    root.addEventListener("click", function (e) { var c = e.target.closest("[data-copy]"); if (c) copy(c.getAttribute("data-copy"), c); });
    (panes[tab] || shape)();
  }

  /* =================================================================== 7. power factor */
  function pf(root) {
    var T = window.THAI_TARIFF || { pfRate: 56.07, pfLimit: 0.6197 };
    root.innerHTML = '<form class="mt-form"><div class="mt-row">' + select("mt-mode", L("ข้อมูลที่มี", "What you know"), [["ppf", L("กำลังจริง P และ PF", "Real power P and PF")], ["vip", L("แรงดัน กระแส และกำลังจริง", "Voltage, current and real power")], ["pq", L("กำลังจริง P และกำลังรีแอกทีฟ Q", "Real power P and reactive power Q")]], QS.get("mode") || "ppf") +
      select("mt-ph", L("ระบบไฟฟ้า", "System"), [["3", L("3 เฟส (แรงดันระหว่างสาย)", "Three-phase (line-to-line voltage)")], ["1", L("1 เฟส", "Single-phase")]], QS.get("ph") || "3") + '</div><div class="mt-row">' +
      field("mt-P", L("กำลังจริง P", "Real power P"), QS.get("P") || "100", { unit: "kW", mode: "decimal" }) + field("mt-pf1", L("เพาเวอร์แฟกเตอร์เดิม", "Present power factor"), QS.get("pf") || "0.75", { mode: "decimal" }) + field("mt-Q", L("กำลังรีแอกทีฟ Q", "Reactive power Q"), QS.get("Q") || "88", { unit: "kvar", mode: "decimal" }) +
      field("mt-V", L("แรงดัน", "Voltage"), QS.get("V") || "400", { unit: "V", mode: "decimal" }) + field("mt-I", L("กระแส", "Current"), QS.get("I") || "192", { unit: "A", mode: "decimal" }) + field("mt-pf2", L("เพาเวอร์แฟกเตอร์เป้าหมาย", "Target power factor"), QS.get("t") || "0.95", { mode: "decimal" }) + field("mt-fr", L("ความถี่", "Frequency"), QS.get("fr") || "50", { unit: "Hz", mode: "decimal" }) +
      '</div><button class="btn btn-primary" type="submit">' + L("คำนวณ", "Calculate") + '</button></form><div class="mt-out" aria-live="polite"></div>';
    var out = root.querySelector(".mt-out"), g = function (id) { return num(root.querySelector("#" + id).value); };
    function vis() { var m = root.querySelector("#mt-mode").value; [["mt-pf1", m === "ppf"], ["mt-Q", m === "pq"], ["mt-I", m === "vip"]].forEach(function (x) { root.querySelector("#" + x[0]).closest("label").hidden = !x[1]; }); }
    function run() {
      vis();
      try {
        var m = root.querySelector("#mt-mode").value, ph = +root.querySelector("#mt-ph").value, k = ph === 3 ? Math.sqrt(3) : 1, P = g("mt-P"), V = g("mt-V"), fr = g("mt-fr") || 50, S, Q, p1, tgt = g("mt-pf2");
        if (!(P > 0)) throw new Error(L("กำลังจริง P ต้องมากกว่าศูนย์", "Real power P must be positive."));
        if (!(V > 0)) throw new Error(L("แรงดันต้องมากกว่าศูนย์", "The voltage must be positive."));
        if (m === "ppf") { p1 = g("mt-pf1"); if (!(p1 > 0 && p1 <= 1)) throw new Error(L("เพาเวอร์แฟกเตอร์ต้องอยู่ระหว่าง 0 ถึง 1", "The power factor must be between 0 and 1.")); S = P / p1; Q = Math.sqrt(Math.max(0, S * S - P * P)); }
        else if (m === "pq") { Q = g("mt-Q"); if (!(Q >= 0)) throw new Error(L("กรอกค่า Q (kvar)", "Enter Q (kvar).")); S = Math.hypot(P, Q); p1 = P / S; }
        else { var I0 = g("mt-I"); if (!(I0 > 0)) throw new Error(L("กรอกกระแส (A)", "Enter the current (A).")); S = k * V * I0 / 1000; if (S < P * (1 - 1e-9)) throw new Error(L("ข้อมูลขัดกัน: กำลังปรากฏ S = ", "Inconsistent data: apparent power S = ") + sig(S, 5) + L(" kVA น้อยกว่ากำลังจริง P ตรวจแรงดัน กระแส และจำนวนเฟส", " kVA is less than the real power P. Check the voltage, current and number of phases.")); p1 = Math.min(1, P / S); Q = Math.sqrt(Math.max(0, S * S - P * P)); }
        if (!(tgt > 0 && tgt <= 1)) throw new Error(L("เพาเวอร์แฟกเตอร์เป้าหมายต้องอยู่ระหว่าง 0 ถึง 1", "The target power factor must be between 0 and 1."));
        var phi1 = Math.acos(p1), phi2 = Math.acos(tgt), Q2 = P * Math.tan(phi2), Qc = Math.max(0, Q - Q2), S2 = P / tgt, I1 = S * 1000 / (k * V), I2 = S2 * 1000 / (k * V), w = 2 * Math.PI * fr;
        var Cd = ph === 3 ? Qc * 1000 / (3 * w * V * V) : Qc * 1000 / (w * V * V), Cy = ph === 3 ? Qc * 1000 / (w * V * V) : null;
        var share = shareBtn({ mode: m === "ppf" ? "" : m, ph: ph === 3 ? "" : ph, P: P, pf: m === "ppf" ? p1 : "", Q: m === "pq" ? Q : "", V: V, I: m === "vip" ? g("mt-I") : "", t: tgt, fr: fr === 50 ? "" : fr });
        var h = answer(L("ผลการคำนวณ", "Result"), "\\cos\\varphi = \\frac{P}{S} = \\frac{" + sig(P, 5) + "}{" + sig(S, 5) + "} = " + sig(p1, 4) + ",\\qquad Q_C = P(\\tan\\varphi_1 - \\tan\\varphi_2) = " + sig(P, 5) + "(" + sig(Math.tan(phi1), 4) + " - " + sig(Math.tan(phi2), 4) + ") = " + sig(Qc, 5) + "\\ \\text{kvar}", share);
        h += '<div class="table-wrap"><table class="mt-tb"><thead><tr><th></th><th>' + L("ก่อนแก้", "Before") + "</th><th>" + L("หลังแก้", "After") + "</th></tr></thead><tbody>" +
          "<tr><th>" + L("เพาเวอร์แฟกเตอร์ cos φ", "Power factor cos φ") + "</th><td>" + sig(p1, 4) + "</td><td>" + sig(tgt, 4) + "</td></tr><tr><th>" + L("มุมเฟส φ", "Phase angle φ") + "</th><td>" + sig(phi1 * 180 / Math.PI, 4) + "°</td><td>" + sig(phi2 * 180 / Math.PI, 4) + "°</td></tr>" +
          "<tr><th>" + L("กำลังจริง P", "Real power P") + "</th><td>" + sig(P, 5) + " kW</td><td>" + sig(P, 5) + " kW</td></tr><tr><th>" + L("กำลังรีแอกทีฟ Q", "Reactive power Q") + "</th><td>" + sig(Q, 5) + " kvar</td><td>" + sig(Math.min(Q, Q2), 5) + " kvar</td></tr>" +
          "<tr><th>" + L("กำลังปรากฏ S", "Apparent power S") + "</th><td>" + sig(S, 5) + " kVA</td><td>" + sig(Qc > 0 ? S2 : S, 5) + " kVA</td></tr><tr><th>" + L("กระแสสาย I", "Line current I") + "</th><td>" + sig(I1, 5) + " A</td><td>" + sig(Qc > 0 ? I2 : I1, 5) + " A</td></tr></tbody></table></div>";
        if (Qc > 0) {
          h += '<div class="mt-kv"><span>' + L("ขนาดคาปาซิเตอร์ที่ต้องติด", "Capacitor bank needed") + " <b>" + sig(Qc, 5) + " kvar</b></span><span>" + (ph === 3 ? L("ต่อแบบเดลตา: ", "Delta connection: ") + sig(Cd * 1e6, 5) + L(" µF ต่อเฟส", " µF per phase") + " · " + L("ต่อแบบสตาร์: ", "Star connection: ") + sig(Cy * 1e6, 5) + L(" µF ต่อเฟส", " µF per phase") : "C = " + sig(Cd * 1e6, 5) + " µF") + "</span><span>" + L("กระแสลดลง ", "Current falls by ") + sig((1 - I2 / I1) * 100, 4) + " %</span><span>" + L("กำลังสูญเสียในสาย (I²R) ลดลง ", "Line loss (I²R) falls by ") + sig((1 - I2 * I2 / (I1 * I1)) * 100, 4) + " %</span><span>" + L("ปล่อยความจุหม้อแปลง ", "Transformer capacity released: ") + sig(S - S2, 5) + " kVA</span></div>";
        } else h += badge(true, L("เพาเวอร์แฟกเตอร์เดิมสูงกว่าเป้าหมายอยู่แล้ว ไม่ต้องติดคาปาซิเตอร์เพิ่ม", "The present power factor already meets the target; no capacitor is needed."));
        var allowed = T.pfLimit * P, ex = Q - allowed, billed = ex > 0 ? Math.floor(ex + 0.5) : 0;
        h += '<h3 class="mt-h">' + L("ค่าเพาเวอร์แฟกเตอร์ตามอัตราค่าไฟฟ้าไทย (กฟน. / กฟภ.)", "Power factor charge under the Thai tariff (MEA / PEA)") + "</h3><p>" + L("ผู้ใช้ไฟฟ้าที่มีค่าความต้องการพลังไฟฟ้า หากกิโลวาร์สูงสุดเกินร้อยละ 61.97 ของกิโลวัตต์สูงสุด (เทียบเท่า PF ต่ำกว่า 0.85) ส่วนที่เกินคิดกิโลวาร์ละ ", "For customers billed on demand, reactive demand above 61.97 % of the maximum kW demand (a power factor below 0.85) is charged at ") + T.pfRate + L(" บาทต่อเดือน", " baht per kvar per month.") + "</p>" +
          K("Q_{\\text{allowed}} = 0.6197 \\times " + sig(P, 5) + " = " + sig(allowed, 5) + "\\ \\text{kvar},\\quad Q - Q_{\\text{allowed}} = " + sig(ex, 5) + "\\ \\text{kvar}", true) +
          (billed > 0 ? badge(false, L("เสียค่าเพาเวอร์แฟกเตอร์ ", "Power factor charge: ") + billed + " kvar × " + T.pfRate + " = <b>" + money(billed * T.pfRate) + L(" บาท/เดือน", " baht/month") + "</b> (" + L("ปีละประมาณ ", "about ") + money(billed * T.pfRate * 12) + L(" บาท ยังไม่รวม VAT)", " baht a year, before VAT)")) : badge(true, L("ไม่เสียค่าเพาเวอร์แฟกเตอร์ (ถือว่า P และ Q ที่กรอกเป็นค่าสูงสุดในรอบเดือน)", "No power factor charge (taking the P and Q entered as the monthly maxima)")));
        // power triangle
        var W = 520, H = 250, sc = Math.min((W - 110) / P, (H - 70) / Math.max(Q, 1e-9)), x0 = 50, y0 = 30, px = x0 + P * sc, qy = y0 + Q * sc, q2y = y0 + Math.min(Q, Q2) * sc;
        h += '<figure class="mt-plot"><svg class="mk-plot" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + L("สามเหลี่ยมกำลัง", "Power triangle") + '"><path d="M' + x0 + " " + y0 + "L" + px + " " + y0 + "L" + px + " " + qy + 'Z" fill="var(--signal)" fill-opacity=".12" stroke="var(--signal)" stroke-width="2"/>' +
          (Qc > 0 ? '<path d="M' + x0 + " " + y0 + "L" + px + " " + q2y + '" stroke="var(--ok)" stroke-width="2" stroke-dasharray="6 4" fill="none"/><path d="M' + (px + 8) + " " + q2y + "L" + (px + 8) + " " + qy + '" stroke="var(--accent)" stroke-width="3"/><text class="mk-ann" x="' + (px + 14) + '" y="' + ((q2y + qy) / 2 + 4) + '">Qc ' + sig(Qc, 4) + " kvar</text>" : "") +
          '<text class="mk-ann" x="' + ((x0 + px) / 2 - 30) + '" y="' + (y0 - 8) + '">P = ' + sig(P, 4) + ' kW</text><text class="mk-ann" x="' + (px + 14) + '" y="' + (y0 + 14) + '">Q = ' + sig(Q, 4) + ' kvar</text><text class="mk-ann" x="' + ((x0 + px) / 2 - 70) + '" y="' + ((y0 + qy) / 2 + 26) + '">S = ' + sig(S, 4) + ' kVA</text><text class="mk-ann" x="' + (x0 + 34) + '" y="' + (y0 + 16) + '">φ = ' + sig(phi1 * 180 / Math.PI, 3) + "°</text></svg><figcaption>" + L("สามเหลี่ยมกำลัง (โหลดตามหลัง Q ชี้ลง) เส้นประสีเขียวคือ S หลังแก้ แท่งสีส้มคือ Qc ที่คาปาซิเตอร์จ่าย", "Power triangle (lagging load, Q drawn downward). Dashed green: S after correction. Orange bar: Qc supplied by the capacitor.") + "</figcaption></figure>";
        out.innerHTML = h;
      } catch (e) { out.innerHTML = errBox(e); }
    }
    root.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); });
    root.querySelector("#mt-mode").addEventListener("change", run);
    root.addEventListener("click", function (e) { var c = e.target.closest("[data-copy]"); if (c) copy(c.getAttribute("data-copy"), c); });
    run();
  }

  /* =================================================================== 8. Thai electricity bill */
  var APPL = [["แอร์ 12,000 BTU (อินเวอร์เตอร์)", "Air conditioner 12,000 BTU (inverter)", 900, 8], ["ตู้เย็น 2 ประตู", "Refrigerator, 2 doors", 90, 24], ["หลอด LED 9 W × 10", "LED lamps 9 W × 10", 90, 6], ["ทีวี LED 50 นิ้ว", "LED TV 50 in", 100, 5], ["เครื่องทำน้ำอุ่น 3,500 W", "Water heater 3,500 W", 3500, 0.5], ["หม้อหุงข้าว", "Rice cooker", 600, 1], ["เครื่องซักผ้าฝาหน้า", "Washing machine (front load)", 500, 1], ["พัดลมตั้งพื้น × 2", "Floor fans × 2", 100, 10], ["คอมพิวเตอร์ตั้งโต๊ะ", "Desktop computer", 200, 6], ["เตารีด", "Iron", 1200, 0.3], ["ไมโครเวฟ", "Microwave oven", 1000, 0.25], ["ปั๊มน้ำ 250 W", "Water pump 250 W", 250, 1], ["ชาร์จรถ EV 7.4 kW", "EV charger 7.4 kW", 7400, 2]];
  function bill(root) {
    var T = window.THAI_TARIFF; if (!T) return;
    var grpName = { 1: L("ประเภทที่ 1 บ้านอยู่อาศัย", "Type 1 Residential"), 2: L("ประเภทที่ 2 กิจการขนาดเล็ก", "Type 2 Small general service"), 3: L("ประเภทที่ 3 กิจการขนาดกลาง", "Type 3 Medium general service"), 4: L("ประเภทที่ 4 กิจการขนาดใหญ่", "Type 4 Large general service"), 5: L("ประเภทที่ 5 กิจการเฉพาะอย่าง", "Type 5 Specific business"), 6: L("ประเภทที่ 6 องค์กรที่ไม่แสวงหากำไร", "Type 6 Non-profit organisation"), 7: L("ประเภทที่ 7 สูบน้ำเพื่อการเกษตร", "Type 7 Agricultural pumping"), 8: L("ประเภทที่ 8 ไฟฟ้าชั่วคราว", "Type 8 Temporary supply") };
    function catOptions(util) { var h = "", g = 0; T.cats.forEach(function (c) { if (c.group !== g) { if (g) h += "</optgroup>"; g = c.group; h += '<optgroup label="' + esc(grpName[g]) + '">'; } h += '<option value="' + c.id + '">' + (util === "pea" && c.pea ? c.pea : c.id) + " " + esc(EN ? c.en : c.th) + "</option>"; }); return h + "</optgroup>"; }
    root.innerHTML = '<form class="mt-form"><div class="mt-row">' + select("mt-util", L("การไฟฟ้า", "Utility"), [["mea", L("กฟน. (กรุงเทพฯ นนทบุรี สมุทรปราการ)", "MEA (Bangkok, Nonthaburi, Samut Prakan)")], ["pea", L("กฟภ. (จังหวัดอื่น)", "PEA (all other provinces)")]], QS.get("u") || "mea") +
      '<label class="mt-f mt-wide"><span>' + L("ประเภทผู้ใช้ไฟฟ้า", "Customer category") + '</span><select class="num mt-in" id="mt-cat"></select></label>' + select("mt-volt", L("ระดับแรงดัน", "Voltage level"), [["lv", ""]], "lv") + '</div><div class="mt-row" id="mt-ins"></div><div class="mt-row">' +
      field("mt-ft", "Ft (" + L("บาท/หน่วย", "baht/unit") + ")", QS.get("ft") || T.ft, { mode: "decimal" }) + '</div><div class="checks" id="mt-opts"></div><button class="btn btn-primary" type="submit">' + L("คำนวณค่าไฟฟ้า", "Calculate the bill") + '</button></form><div class="mt-out" aria-live="polite"></div>' +
      '<details class="mt-appl"><summary>' + L("ยังไม่รู้จำนวนหน่วย? ประมาณจากเครื่องใช้ไฟฟ้า", "Don't know your units? Estimate from appliances") + '</summary><p class="hint">' + L("หน่วย (kWh) = วัตต์ × ชั่วโมงต่อวัน × จำนวนวัน ÷ 1,000 แก้ตัวเลขให้ตรงกับบ้านของคุณ แล้วกดส่งค่าไปคำนวณ", "Units (kWh) = watts × hours per day × days ÷ 1,000. Edit the figures to match your home, then send the total to the calculator.") + '</p><div class="table-wrap"><table class="mt-tb" id="mt-atb"><thead><tr><th></th><th>' + L("เครื่องใช้ไฟฟ้า", "Appliance") + "</th><th>" + L("วัตต์", "Watts") + "</th><th>" + L("ชม./วัน", "h/day") + "</th><th>" + L("หน่วย/เดือน", "Units/month") + "</th></tr></thead><tbody>" +
      APPL.map(function (a, i) { return '<tr><td><input type="checkbox" class="mt-ac" ' + (i < 4 ? "checked" : "") + ' aria-label="' + esc(EN ? a[1] : a[0]) + '"></td><td>' + esc(EN ? a[1] : a[0]) + '</td><td><input class="num mt-aw" value="' + a[2] + '" inputmode="decimal" aria-label="W"></td><td><input class="num mt-ah" value="' + a[3] + '" inputmode="decimal" aria-label="h"></td><td class="mt-au"></td></tr>'; }).join("") +
      '</tbody><tfoot><tr><th colspan="4">' + L("รวม (30 วัน)", "Total (30 days)") + '</th><th id="mt-asum"></th></tr></tfoot></table></div><button type="button" class="btn btn-ghost btn-sm" id="mt-ause">' + L("ใช้จำนวนหน่วยนี้คำนวณค่าไฟ ↑", "Use this total in the calculator ↑") + "</button></details>";
    var out = root.querySelector(".mt-out"), $ = function (id) { return root.querySelector("#" + id); }, catSel = $("mt-cat"), voltSel = $("mt-volt"), ins = $("mt-ins"), opts = $("mt-opts");
    function setup(keep) {
      var util = $("mt-util").value, prev = keep ? catSel.value : QS.get("c") || root.dataset.cat || "1.2";
      catSel.innerHTML = catOptions(util); catSel.value = prev;
      var c = T.cats.find(function (x) { return x.id === catSel.value; }), pv = keep ? voltSel.value : QS.get("v") || "lv";
      var vs = ["hv", "mv", "lv"].filter(function (k) { return c[k]; });
      voltSel.innerHTML = vs.map(function (k) { var t = T.volt[util][k].split("|"); return '<option value="' + k + '">' + (EN && t[1] ? t[1] : t[0]) + "</option>"; }).join("");
      voltSel.value = vs.indexOf(pv) >= 0 ? pv : vs[vs.length - 1];
      var q = function (k, d) { return keep && $(k) ? $(k).value : QS.get(k.replace("mt-", "")) || d; }, h = "";
      if (c.kind === "block") h = field("mt-units", L("หน่วยที่ใช้ในเดือนนี้", "Units used this month"), q("mt-units", 350), { unit: "kWh", mode: "decimal" });
      if (c.kind === "tou" || c.kind === "toud") h = field("mt-on", L("หน่วยช่วง On Peak (จ.–ศ. 09:00–22:00)", "On-Peak units (Mon–Fri 09:00–22:00)"), q("mt-on", c.kind === "tou" ? 150 : 20000), { unit: "kWh", mode: "decimal" }) + field("mt-off", L("หน่วยช่วง Off Peak (กลางคืน เสาร์–อาทิตย์ วันหยุด)", "Off-Peak units (nights, weekends, holidays)"), q("mt-off", c.kind === "tou" ? 350 : 30000), { unit: "kWh", mode: "decimal" });
      if (c.kind === "dem" || c.kind === "tod") h = field("mt-units", L("หน่วยที่ใช้ในเดือนนี้", "Units used this month"), q("mt-units", c.kind === "tod" ? 400000 : 30000), { unit: "kWh", mode: "decimal" });
      if (c.kind === "dem" || c.kind === "toud") h += field("mt-kw", c.kind === "toud" ? L("ความต้องการพลังไฟฟ้าสูงสุดช่วง On Peak", "Maximum demand in On-Peak") : L("ความต้องการพลังไฟฟ้าสูงสุด (เฉลี่ย 15 นาที)", "Maximum demand (15-minute average)"), q("mt-kw", 120), { unit: "kW", mode: "decimal" });
      if (c.kind === "tod") h += field("mt-kwp", L("ความต้องการสูงสุดช่วง Peak (18:30–21:30)", "Maximum demand, Peak (18:30–21:30)"), q("mt-kwp", 1000), { unit: "kW", mode: "decimal" }) + field("mt-kwpp", L("ความต้องการสูงสุดช่วง Partial (08:00–18:30)", "Maximum demand, Partial (08:00–18:30)"), q("mt-kwpp", 1200), { unit: "kW", mode: "decimal" });
      var dem = c.kind === "dem" || c.kind === "toud" || c.kind === "tod";
      if (dem) h += (c.kind === "toud" ? field("mt-kwmax", L("ความต้องการสูงสุดทั้งเดือน (ใช้คิดค่า PF)", "Maximum demand of the month (for the PF charge)"), q("mt-kwmax", ""), { unit: "kW", mode: "decimal", ph: L("เว้นว่าง = เท่ากับ On Peak", "empty = same as On-Peak") }) : "") + field("mt-kvar", L("กิโลวาร์สูงสุด (เว้นว่างถ้าไม่ทราบ)", "Maximum kvar (leave empty if unknown)"), q("mt-kvar", ""), { unit: "kvar", mode: "decimal" }) + field("mt-min", L("ค่าความต้องการพลังไฟฟ้าสูงสุดใน 12 เดือนที่ผ่านมา (บาท ไม่บังคับ)", "Highest demand charge in the last 12 months (baht, optional)"), q("mt-min", ""), { unit: L("บาท", "baht"), mode: "decimal" });
      ins.innerHTML = h;
      var o = "";
      if (c.free) o += '<label><input type="checkbox" id="mt-free"' + (QS.get("free") ? " checked" : "") + "> " + L("ได้รับสิทธิค่าไฟฟ้าฟรี (ผู้มีบัตรสวัสดิการแห่งรัฐ ใช้ไม่เกิน 50 หน่วยติดต่อกัน 3 เดือน)", "Entitled to free electricity (state welfare card holder, at most 50 units for 3 consecutive months)") + "</label>";
      if (c.kind !== "block") o += '<label><input type="checkbox" id="mt-loss"' + (QS.get("loss") ? " checked" : "") + "> " + L("มิเตอร์อยู่ด้านแรงต่ำของหม้อแปลงที่เป็นสมบัติของผู้ใช้ไฟ (บวกหน่วยและกิโลวัตต์เพิ่มร้อยละ 2)", "Meter on the low-voltage side of a customer-owned transformer (adds 2 % to units and kW)") + "</label>";
      opts.innerHTML = o;
    }
    function run() {
      try {
        var v = function (id) { return $(id) ? $(id).value : ""; }, util = $("mt-util").value;
        var o = { cat: catSel.value, volt: voltSel.value, units: num(v("mt-units")), on: num(v("mt-on")), off: num(v("mt-off")), kw: num(v("mt-kw")), kwMax: num(v("mt-kwmax")), kwPeak: num(v("mt-kwp")), kwPartial: num(v("mt-kwpp")), kvar: num(v("mt-kvar")), minDemand: num(v("mt-min")), ft: num(v("mt-ft")), free: $("mt-free") && $("mt-free").checked, loss: $("mt-loss") && $("mt-loss").checked };
        var B = T.bill(o), c = B.cat, code = util === "pea" && c.pea ? c.pea : c.id;
        var params = { u: util === "mea" ? "" : util, c: o.cat, v: o.volt === "lv" ? "" : o.volt, ft: o.ft === T.ft ? "" : v("mt-ft") };
        ["units", "on", "off", "kw", "kwmax", "kwp", "kwpp", "kvar", "min"].forEach(function (k) { if (v("mt-" + k)) params[k] = v("mt-" + k); });
        if (o.free) params.free = 1; if (o.loss) params.loss = 1;
        var h = '<div class="mt-ans"><p class="mt-ans-l">' + L("ค่าไฟฟ้าที่ต้องชำระโดยประมาณ", "Estimated amount payable") + " · " + (util === "mea" ? L("กฟน.", "MEA") : L("กฟภ.", "PEA")) + " " + code + '</p><p class="mt-big">' + money(B.total) + " " + L("บาท", "baht") + "</p><p>" + grp(B.units, 2) + " " + L("หน่วย", "units") + " · " + L("เฉลี่ย ", "average ") + money(B.perUnit) + " " + L("บาทต่อหน่วย (รวม Ft และ VAT)", "baht per unit (including Ft and VAT)") + '</p><div class="mt-acts">' + shareBtn(params) + "</div></div>";
        if (B.free) { out.innerHTML = h + badge(true, L("ใช้ไม่เกิน 50 หน่วยและได้รับสิทธิ จึงไม่เสียค่าไฟฟ้าในเดือนนี้", "At most 50 units with the entitlement, so nothing is payable this month.")); return; }
        h += '<div class="table-wrap"><table class="mt-tb mt-bill"><thead><tr><th>' + L("รายการ", "Item") + "</th><th>" + L("จำนวนเงิน (บาท)", "Amount (baht)") + "</th></tr></thead><tbody>";
        B.lines.forEach(function (l) {
          var name, qty = "", rate = "";
          if (l.key === "block") { name = l.single ? L("ค่าพลังงานไฟฟ้า", "Energy charge") : L("ค่าพลังงานไฟฟ้า หน่วยที่ ", "Energy, units ") + grp(l.from, 0) + (isFinite(l.to) ? "–" + grp(l.to, 0) : L(" ขึ้นไป", " and above")); qty = grp(l.units, 2) + " kWh"; rate = l.rate.toFixed(4); }
          else if (l.key === "on" || l.key === "off" || l.key === "energy") { name = l.key === "on" ? L("ค่าพลังงานไฟฟ้า On Peak", "Energy, On-Peak") : l.key === "off" ? L("ค่าพลังงานไฟฟ้า Off Peak", "Energy, Off-Peak") : L("ค่าพลังงานไฟฟ้า", "Energy charge"); qty = grp(l.units, 2) + " kWh"; rate = l.rate.toFixed(4); }
          else if (l.key === "demand" || l.key === "dpeak" || l.key === "dpartial") { name = l.key === "dpeak" ? L("ค่าความต้องการพลังไฟฟ้า ช่วง Peak", "Demand charge, Peak") : l.key === "dpartial" ? L("ค่าความต้องการพลังไฟฟ้า ช่วง Partial (เฉพาะส่วนที่เกิน Peak)", "Demand charge, Partial (only the part above Peak)") : L("ค่าความต้องการพลังไฟฟ้า", "Demand charge"); qty = grp(l.kw, 2) + " kW"; rate = l.rate.toFixed(2); }
          else if (l.key === "mindemand") { name = L("ปรับเป็นค่าไฟฟ้าต่ำสุด (ร้อยละ 70 ของค่าความต้องการสูงสุดใน 12 เดือน)", "Raised to the minimum charge (70 % of the highest demand charge in 12 months)"); }
          else if (l.key === "pf") { name = L("ค่าเพาเวอร์แฟกเตอร์ (ส่วนที่เกิน ", "Power factor charge (above ") + grp(l.allowed, 2) + " kvar)"; qty = l.kvar + " kvar"; rate = l.rate.toFixed(2); }
          else if (l.key === "service") name = L("ค่าบริการรายเดือน", "Monthly service charge");
          h += "<tr><td>" + name + (qty ? "<small>" + qty + " × " + rate + "</small>" : "") + "</td><td>" + money(l.amount) + "</td></tr>";
        });
        h += "<tr class=\"mt-sub\"><th>" + L("รวมค่าไฟฟ้าฐาน", "Base tariff subtotal") + "</th><th>" + money(B.base) + "</th></tr><tr><td>" + L("ค่า Ft (ค่าไฟฟ้าผันแปร)", "Ft (fuel adjustment)") + "<small>" + grp(B.units, 2) + " kWh × " + B.ftRate.toFixed(4) + "</small></td><td>" + money(B.ftAmount) + "</td></tr><tr><td>" + L("ภาษีมูลค่าเพิ่ม 7 %", "VAT 7 %") + "</td><td>" + money(B.vat) + '</td></tr><tr class="mt-sub"><th>' + L("รวมเงินที่ต้องชำระ", "Total payable") + "</th><th>" + money(B.total) + "</th></tr></tbody></table></div>";
        // comparisons
        if (c.id === "1.1" || c.id === "1.2") {
          var other = T.bill(Object.assign({}, o, { cat: c.id === "1.1" ? "1.2" : "1.1", free: false }));
          h += '<p class="hint">' + L("ถ้าคิดตามอัตรา ", "Under rate ") + (util === "pea" ? other.cat.pea : other.cat.id) + L(" จะเป็น ", " the bill would be ") + money(other.total) + L(" บาท (การจัดประเภทขึ้นกับขนาดมิเตอร์และการใช้ไฟ 3 เดือนติดต่อกัน เลือกเองไม่ได้)", " baht (the category depends on the meter size and three consecutive months of use; it cannot be chosen).") + "</p>";
        }
        if (c.id === "1.3" || c.id === "2.2") {
          var norm = T.bill({ cat: c.id === "1.3" ? "1.2" : "2.1", volt: "lv", units: B.units, ft: o.ft }), share = B.units ? num(v("mt-on")) / (num(v("mt-on")) + num(v("mt-off"))) : 0;
          h += badge(B.total <= norm.total, L("เทียบกับอัตราปกติ ", "Compared with the normal rate ") + (util === "pea" && norm.cat.pea ? norm.cat.pea : norm.cat.id) + L(" ที่หน่วยเท่ากัน: ", " for the same units: ") + money(norm.total) + L(" บาท → TOU ", " baht → TOU is ") + (B.total <= norm.total ? L("ถูกกว่า ", "cheaper by ") : L("แพงกว่า ", "dearer by ")) + money(Math.abs(norm.total - B.total)) + L(" บาท (สัดส่วน On Peak ", " baht (On-Peak share ") + sig(share * 100, 3) + " %)");
        }
        h += '<p class="hint">' + L("อัตราที่ใช้: ", "Rates used: ") + (EN ? T.effective.en : T.effective.th) + " · Ft " + (EN ? T.ftPeriod.en : T.ftPeriod.th) + " = " + (T.ft * 100).toFixed(2) + L(" สตางค์/หน่วย · ตรวจกับประกาศเมื่อ ", " satang/unit · compared with the official tables on ") + T.checked + L(" · ผลลัพธ์เป็นค่าประมาณ ยอดจริงในใบแจ้งหนี้อาจต่างเล็กน้อยจากการปัดเศษ ส่วนลดตามมาตรการรัฐ หรือค่าปรับ", " · The result is an estimate; the real bill can differ slightly because of rounding, government relief measures or penalties.") + "</p>";
        out.innerHTML = h;
      } catch (e) { out.innerHTML = errBox(e); }
    }
    function appl() { var sum = 0; $$("#mt-atb tbody tr", root).forEach(function (tr) { var u = num(tr.querySelector(".mt-aw").value) * num(tr.querySelector(".mt-ah").value) * 30 / 1000 || 0; tr.querySelector(".mt-au").textContent = grp(u, 1); if (tr.querySelector(".mt-ac").checked) sum += u; }); $("mt-asum").textContent = grp(sum, 1); return sum; }
    root.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); run(); });
    $("mt-util").addEventListener("change", function () { setup(true); run(); });
    catSel.addEventListener("change", function () { setup(true); run(); });
    voltSel.addEventListener("change", run);
    root.querySelector(".mt-appl").addEventListener("input", appl);
    $("mt-ause").addEventListener("click", function () {
      var s = Math.round(appl());
      if (!$("mt-units")) { catSel.value = "1.2"; setup(true); }
      $("mt-units").value = s; run(); root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.addEventListener("click", function (e) { var c = e.target.closest("[data-copy]"); if (c) copy(c.getAttribute("data-copy"), c); });
    setup(false); appl(); run();
  }

  /* =================================================================== 9. equation → LaTeX → PNG / SVG */
  var PAL = [
    [L("พื้นฐาน", "Basics"), [["\\frac{a}{b}", "\\frac{□}{□}"], ["x^{n}", "x^{□}"], ["x_{i}", "x_{□}"], ["\\sqrt{x}", "\\sqrt{□}"], ["\\sqrt[n]{x}", "\\sqrt[□]{□}"], ["\\pm", "\\pm"], ["\\times", "\\times"], ["\\div", "\\div"], ["\\cdot", "\\cdot"], ["\\neq", "\\neq"], ["\\approx", "\\approx"], ["\\le", "\\le"], ["\\ge", "\\ge"], ["\\infty", "\\infty"], ["\\left( \\right)", "\\left( □ \\right)"], ["|x|", "\\left| □ \\right|"]]],
    [L("แคลคูลัส", "Calculus"), [["\\frac{d}{dx}", "\\frac{d}{dx}"], ["\\frac{\\partial}{\\partial x}", "\\frac{\\partial □}{\\partial x}"], ["\\int", "\\int □ \\,dx"], ["\\int_{a}^{b}", "\\int_{□}^{□} □ \\,dx"], ["\\iint", "\\iint"], ["\\oint", "\\oint"], ["\\sum", "\\sum_{n=1}^{\\infty}"], ["\\prod", "\\prod_{i=1}^{n}"], ["\\lim", "\\lim_{x \\to □}"], ["\\nabla", "\\nabla"], ["\\to", "\\to"], ["\\Rightarrow", "\\Rightarrow"]]],
    [L("กรีก", "Greek"), ["\\alpha", "\\beta", "\\gamma", "\\delta", "\\epsilon", "\\theta", "\\lambda", "\\mu", "\\pi", "\\rho", "\\sigma", "\\tau", "\\phi", "\\omega", "\\zeta", "\\xi", "\\Delta", "\\Sigma", "\\Omega", "\\Phi"].map(function (x) { return [x, x]; })],
    [L("วิศวกรรม", "Engineering"), [["\\mathcal{L}", "\\mathcal{L}\\left\\{ □ \\right\\}"], ["\\mathcal{L}^{-1}", "\\mathcal{L}^{-1}\\left\\{ □ \\right\\}"], ["\\mathcal{F}", "\\mathcal{F}\\left\\{ □ \\right\\}"], ["\\angle", "\\angle"], ["^{\\circ}", "^{\\circ}"], ["\\vec{v}", "\\vec{□}"], ["\\hat{x}", "\\hat{□}"], ["\\bar{x}", "\\bar{□}"], ["\\dot{x}", "\\dot{□}"], ["\\ddot{x}", "\\ddot{□}"], ["\\Omega", "\\,\\Omega"], ["\\mu F", "\\,\\mu\\text{F}"], ["\\text{ข้อความ}", "\\text{□}"], ["j\\omega", "j\\omega"]]],
    [L("โครงสร้าง", "Structures"), [[L("เมทริกซ์ 2×2", "2×2 matrix"), "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}"], [L("เมทริกซ์ 3×3", "3×3 matrix"), "\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}"], [L("ดีเทอร์มิแนนต์", "Determinant"), "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}"], [L("ฟังก์ชันเป็นช่วง", "Piecewise"), "f(x) = \\begin{cases} □ & x \\ge 0 \\\\ □ & x < 0 \\end{cases}"], [L("จัดแนวหลายบรรทัด", "Aligned lines"), "\\begin{aligned} y &= □ \\\\ &= □ \\end{aligned}"], [L("ระบบสมการ", "System"), "\\left\\{ \\begin{aligned} x + y &= 1 \\\\ x - y &= 3 \\end{aligned} \\right."]], true]
  ];
  var TEMPL = [[L("สูตรกำลังสอง", "Quadratic formula"), "x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}"], [L("นิยามอนุพันธ์", "Definition of the derivative"), "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"], [L("การแปลงลาปลาซ", "Laplace transform"), "F(s) = \\mathcal{L}\\{f(t)\\} = \\int_{0}^{\\infty} f(t)\\,e^{-st}\\,dt"],
    [L("อนุกรมฟูเรียร์", "Fourier series"), "f(t) = a_0 + \\sum_{n=1}^{\\infty}\\left(a_n\\cos n\\omega_0 t + b_n\\sin n\\omega_0 t\\right)"], [L("สูตรออยเลอร์", "Euler's formula"), "e^{j\\theta} = \\cos\\theta + j\\sin\\theta"], [L("อนุกรมเทย์เลอร์", "Taylor series"), "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^{n}"],
    [L("ระบบอันดับสอง", "Second-order system"), "G(s) = \\frac{\\omega_n^{2}}{s^{2} + 2\\zeta\\omega_n s + \\omega_n^{2}}"], [L("ตัวควบคุม PID", "PID controller"), "u(t) = K_p e(t) + K_i\\int_0^t e(\\tau)\\,d\\tau + K_d\\frac{de(t)}{dt}"], [L("เพาเวอร์แฟกเตอร์", "Power factor"), "\\cos\\varphi = \\frac{P}{S} = \\frac{P}{\\sqrt{P^{2} + Q^{2}}}"], [L("บัคคอนเวอร์เตอร์", "Buck converter"), "V_o = D\\,V_{in},\\qquad \\Delta i_L = \\frac{V_o(1-D)}{L f_s}"]];
  function latex(root) {
    var init = QS.get("tex") || root.dataset.tex || TEMPL[0][1], mode = QS.get("plain") ? "plain" : "tex";
    root.innerHTML = '<div class="seg mt-tabs"><button type="button" data-mode="tex" aria-pressed="' + (mode === "tex") + '">' + L("พิมพ์ LaTeX", "Type LaTeX") + '</button><button type="button" data-mode="plain" aria-pressed="' + (mode === "plain") + '">' + L("พิมพ์สมการแบบธรรมดา แล้วแปลงเป็น LaTeX ให้", "Type plain maths, get LaTeX") + "</button></div>" +
      '<div class="mt-plainbox"' + (mode === "plain" ? "" : " hidden") + '><label class="mt-f mt-wide"><span>' + L("สมการแบบพิมพ์ธรรมดา เช่น y = x^2*sin(3x)/(1+x) หรือ sqrt(x^2+1)", "Plain maths, e.g. y = x^2*sin(3x)/(1+x) or sqrt(x^2+1)") + '</span><input class="num mt-in" id="mt-plain" value="' + esc(QS.get("plain") || "y = x^2*sin(3x)/(1+x)") + '" autocomplete="off" autocapitalize="off" spellcheck="false"></label><p class="mt-plerr hint"></p></div>' +
      '<div class="mt-pal">' + PAL.map(function (g) { return '<div class="mt-palg"><span class="mono">' + g[0] + "</span>" + g[1].map(function (b) { return '<button type="button" class="mt-key" data-ins="' + esc(b[1]) + '" title="' + esc(b[1].replace(/□/g, "…")) + '">' + (g[2] ? esc(b[0]) : K(b[0].replace(/ข้อความ/, "abc"))) + "</button>"; }).join("") + "</div>"; }).join("") + "</div>" +
      '<label class="mt-f mt-wide"><span>LaTeX</span><textarea class="num mt-in mt-ta" id="mt-tex" rows="4" spellcheck="false" autocapitalize="off">' + esc(init) + "</textarea></label>" +
      '<div class="mt-chips"><span class="mono">' + L("สูตรสำเร็จรูป", "Templates") + "</span>" + TEMPL.map(function (t) { return '<button type="button" class="mt-chip" data-tpl="' + esc(t[1]) + '">' + esc(t[0]) + "</button>"; }).join("") + "</div>" +
      '<div class="mt-row">' + select("mt-size", L("ขนาดตัวอักษร", "Font size"), [[20, "20 px"], [28, "28 px"], [36, "36 px"], [48, "48 px"], [64, "64 px"], [96, "96 px"]], QS.get("size") || 36) + '<label class="mt-f"><span>' + L("สีตัวอักษร", "Text colour") + '</span><input type="color" id="mt-col" value="#111111"></label>' +
      select("mt-bg", L("พื้นหลัง", "Background"), [["none", L("โปร่งใส", "Transparent")], ["#ffffff", L("ขาว", "White")], ["#111111", L("ดำ", "Black")], ["#fff8e1", L("ครีม", "Cream")]], "none") + select("mt-pad", L("ขอบรอบสมการ", "Padding"), [[0, "0"], [8, "8 px"], [16, "16 px"], [32, "32 px"]], 16) + select("mt-scale", L("ความละเอียด PNG", "PNG resolution"), [[1, "1×"], [2, "2×"], [3, "3×"], [4, "4×"]], 3) + "</div>" +
      '<div class="mt-prev" id="mt-prev" aria-live="polite"><p class="hint">' + L("กำลังโหลดตัวจัดเรียงสมการ…", "Loading the typesetter…") + '</p></div><p class="hint" id="mt-dim"></p>' +
      '<div class="mt-acts"><button type="button" class="btn btn-primary" id="mt-png">' + L("ดาวน์โหลด PNG", "Download PNG") + '</button><button type="button" class="btn btn-ghost" id="mt-svg">' + L("ดาวน์โหลด SVG (เวกเตอร์)", "Download SVG (vector)") + '</button><button type="button" class="btn btn-ghost" id="mt-cimg">' + L("คัดลอกรูปไปวาง", "Copy image") + '</button><button type="button" class="btn btn-ghost" id="mt-ctex">' + L("คัดลอก LaTeX", "Copy LaTeX") + '</button><button type="button" class="btn btn-ghost" id="mt-cdd">' + L("คัดลอกแบบ $$…$$", "Copy as $$…$$") + '</button><button type="button" class="btn btn-ghost" id="mt-clink">' + L("คัดลอกลิงก์สมการนี้", "Copy link to this equation") + "</button></div>";
    var $ = function (id) { return root.querySelector("#" + id); }, ta = $("mt-tex"), prev = $("mt-prev"), ready = false, cur = null, timer;
    window.MathJax = { tex: { packages: { "[+]": ["ams", "newcommand", "boldsymbol", "cancel", "color"] } }, svg: { fontCache: "none" }, startup: { typeset: false }, options: { enableMenu: false } };
    loadScript("/assets/vendor/mathjax-tex-svg.js").then(function () { return window.MathJax.startup.promise; }).then(function () { ready = true; render(); }).catch(function (e) { prev.innerHTML = '<p class="mt-err">' + esc(e.message) + "</p>"; });
    function build() { // → { svg (string), w, h }
      var tex = ta.value.replace(/□/g, "\\square ").trim();
      if (!tex) return null;
      var node = window.MathJax.tex2svg(tex, { display: true }), svg = node.querySelector("svg"), bad = node.querySelector("[data-mjx-error]");
      if (bad) throw new Error(bad.getAttribute("data-mjx-error") || bad.getAttribute("title") || "LaTeX error");
      var vb = svg.getAttribute("viewBox").split(/\s+/).map(Number), size = +$("mt-size").value, pad = +$("mt-pad").value, col = $("mt-col").value, bg = $("mt-bg").value;
      var w = vb[2] / 1000 * size, h = vb[3] / 1000 * size, W = Math.ceil(w + 2 * pad), H = Math.ceil(h + 2 * pad);
      svg.setAttribute("width", w.toFixed(2)); svg.setAttribute("height", h.toFixed(2)); svg.setAttribute("x", pad); svg.setAttribute("y", pad); svg.removeAttribute("style"); svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      var inner = new XMLSerializer().serializeToString(svg).replace(/currentColor/g, col);
      var full = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" font-family="\'IBM Plex Sans Thai\', \'Noto Sans Thai\', Tahoma, sans-serif">' + (bg === "none" ? "" : '<rect width="100%" height="100%" fill="' + bg + '"/>') + inner + "</svg>";
      return { svg: full, w: W, h: H };
    }
    function render() {
      if (!ready) return;
      try {
        cur = build();
        if (!cur) { prev.innerHTML = '<p class="hint">' + L("พิมพ์ LaTeX ในช่องด้านบน", "Type LaTeX in the box above.") + "</p>"; $("mt-dim").textContent = ""; return; }
        prev.innerHTML = cur.svg; prev.classList.toggle("mt-dark", $("mt-bg").value === "none" && /^#(f|e|d)/i.test($("mt-col").value));
        $("mt-dim").textContent = L("ขนาดรูป ", "Image size ") + cur.w * +$("mt-scale").value + " × " + cur.h * +$("mt-scale").value + " px (PNG) · " + L("SVG คมชัดทุกขนาด เหมาะกับ Word, PowerPoint, Canva และงานพิมพ์", "SVG stays sharp at any size; good for Word, PowerPoint, Canva and print");
      } catch (e) { cur = null; prev.innerHTML = '<p class="mt-err" role="alert">' + L("LaTeX ยังไม่ถูกต้อง: ", "LaTeX error: ") + esc(e.message) + "</p>"; }
    }
    function later() { clearTimeout(timer); timer = setTimeout(render, 180); }
    function toPng() {
      return new Promise(function (res, rej) {
        if (!cur) return rej(new Error("empty"));
        var sc = +$("mt-scale").value, img = new Image(), url = URL.createObjectURL(new Blob([cur.svg], { type: "image/svg+xml;charset=utf-8" }));
        img.onload = function () { var c = document.createElement("canvas"); c.width = cur.w * sc; c.height = cur.h * sc; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(function (b) { b ? res(b) : rej(new Error("png")); }, "image/png"); };
        img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("png")); };
        img.src = url;
      });
    }
    function save(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); }
    function flash(btn, t) { var o = btn.textContent; btn.textContent = t; setTimeout(function () { btn.textContent = o; }, 1600); }
    function fromPlain() { var box = root.querySelector(".mt-plerr"); try { ta.value = MT.toLatex($("mt-plain").value); box.textContent = ""; render(); } catch (e) { box.textContent = errText(e); } }
    function insert(snip) {
      var s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e), text = sel && snip.indexOf("□") >= 0 ? snip.replace("□", sel) : snip;
      ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
      var hole = text.indexOf("□"); ta.focus();
      if (hole >= 0) ta.setSelectionRange(s + hole, s + hole + 1); else ta.setSelectionRange(s + text.length, s + text.length);
      render();
    }
    ta.addEventListener("input", later);
    $("mt-plain").addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(fromPlain, 200); });
    ["mt-size", "mt-col", "mt-bg", "mt-pad", "mt-scale"].forEach(function (id) { $(id).addEventListener("input", render); });
    root.addEventListener("click", function (e) {
      var k = e.target.closest("[data-ins]"); if (k) return insert(k.dataset.ins);
      var t = e.target.closest("[data-tpl]"); if (t) { ta.value = t.dataset.tpl; return render(); }
      var m = e.target.closest("[data-mode]"); if (m) { $$("[data-mode]", root).forEach(function (x) { x.setAttribute("aria-pressed", x === m); }); root.querySelector(".mt-plainbox").hidden = m.dataset.mode !== "plain"; if (m.dataset.mode === "plain") fromPlain(); return; }
    });
    $("mt-png").addEventListener("click", function () { toPng().then(function (b) { save(b, "equation.png"); }).catch(function () { flash($("mt-png"), L("สร้าง PNG ไม่ได้ ลองใช้ SVG", "PNG failed, try SVG")); }); });
    $("mt-svg").addEventListener("click", function () { if (cur) save(new Blob([cur.svg], { type: "image/svg+xml;charset=utf-8" }), "equation.svg"); });
    $("mt-cimg").addEventListener("click", function () {
      var b = $("mt-cimg");
      if (!navigator.clipboard || !window.ClipboardItem) return flash(b, L("เบราว์เซอร์นี้คัดลอกรูปไม่ได้ ใช้ดาวน์โหลดแทน", "This browser cannot copy images; download instead"));
      try { navigator.clipboard.write([new window.ClipboardItem({ "image/png": toPng() })]).then(function () { flash(b, L("คัดลอกแล้ว ✓", "Copied ✓")); }, function () { flash(b, L("คัดลอกไม่ได้ ใช้ดาวน์โหลดแทน", "Copy failed; download instead")); }); } catch (err) { flash(b, L("คัดลอกไม่ได้ ใช้ดาวน์โหลดแทน", "Copy failed; download instead")); }
    });
    $("mt-ctex").addEventListener("click", function () { copy(ta.value, $("mt-ctex")); });
    $("mt-cdd").addEventListener("click", function () { copy("$$" + ta.value + "$$", $("mt-cdd")); });
    $("mt-clink").addEventListener("click", function () { var u = new URL(location.href); u.search = ""; u.hash = ""; u.searchParams.set("tex", ta.value); copy(u.toString(), $("mt-clink")); });
    if (mode === "plain") fromPlain();
  }

  var REG = { derivative: derivative, integral: integral, laplace: laplace, ilaplace: ilaplace, fourier: fourier, area: area, pf: pf, bill: bill, latex: latex };
  function boot() { $$(".mt-tool").forEach(function (el) { if (el.dataset.ready) return; el.dataset.ready = "1"; var f = REG[el.dataset.tool]; if (f) { try { f(el); } catch (e) { el.innerHTML = errBox(e); } } }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
