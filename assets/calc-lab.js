/* Calculus labs (plain JS). Needs mathkit.js, sigexpr.js and (for live TeX) /assets/vendor/katex.min.js.
   <div class="cl-fn" [data-f="x^2"] [data-mode="transform|compose|inverse"]>        function transformation / composition / inverse lab
   <div class="cl-limit" data-f="(x^2-4)/(x-2)" data-a="2" [data-eps="0.5"]>         limit explorer: zoom, table from both sides, ε–δ band
   <div class="cl-tangent" data-f="x^3-3x" data-x0="1.5" [data-show="deriv,second"]> secant → tangent, f′ and f″ graphs, critical points
   <div class="cl-newton" data-f="x^3-2x-5" data-x0="2">                              Newton–Raphson iterations with tangent lines
   <div class="cl-opt" data-preset="box|power|can|fence|beam">                        optimisation with f(x) and f′(x) side by side
   <div class="cl-cap" [data-wave="sine|tri|trap|ramp"]>                              capacitor i = C dv/dt and inductor v = L di/dt
   <div class="cl-crank">                                                             slider-crank: position, velocity, acceleration
   <div class="cl-rms" [data-wave="sine|half|full|square|tri|pwm"]>                   average, RMS and energy by integration (shaded area)
   <div class="cl-beam" [data-type="ss|cant"] [data-load="point|udl|both"]>           beam: load → shear → moment → slope → deflection */
(function () {
  "use strict";
  var MK = window.MK;
  if (!MK) return;
  var T = function (s, d) { return MK.texStr(s, d); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var fmt = MK.fmt;
  function compile(src) { return MK.fn(src, "x"); }
  function slider(key, label, min, max, step, val) {
    return '<label class="lap-row cl-sl"><span class="lap-lbl">' + label + '</span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output>' + val + "</output></label>";
  }
  function bindSliders(box, st, draw) {
    $$("input[type=range][data-k]", box).forEach(function (r) {
      r.addEventListener("input", function () { st[r.getAttribute("data-k")] = +r.value; r.parentNode.querySelector("output").textContent = r.value; draw(); });
    });
  }
  function setSlider(box, k, v) { var r = box.querySelector('input[data-k="' + k + '"]'); if (r) { r.value = v; r.parentNode.querySelector("output").textContent = v; } }
  // drag support on an MK plot: host keeps the inverse map from the last plot drawn into it
  function plotInto(host, o) { host.innerHTML = MK.plot(o); host.__map = MK.lastMap(); }
  // phones: draw on a narrower viewBox so a plot keeps readable lines and labels instead of shrinking a 680-wide drawing
  function narrow(box) { return (box.clientWidth || window.innerWidth) < 520; }
  function redrawOnWidth(box, draw) {
    var was = narrow(box);
    window.addEventListener("resize", function () { if (narrow(box) !== was) { was = !was; draw(); } });
  }
  function dragPlot(host, onMove) {
    var on = null;
    host.addEventListener("pointerdown", function (e) { var t = e.target.closest(".mk-drag"); if (!t) return; on = t.getAttribute("data-drag"); e.preventDefault(); });
    host.addEventListener("pointermove", function (e) {
      if (!on || !host.__map) return;
      var svg = host.querySelector("svg"); if (!svg) return;
      var p = MK.svgPoint(svg, e);
      onMove(on, host.__map.ix(p.x), host.__map.iy(p.y));
      e.preventDefault();
    });
    var up = function () { on = null; };
    host.addEventListener("pointerup", up); host.addEventListener("pointerleave", up); host.addEventListener("pointercancel", up);
  }
  var deriv = function (f, x, h) { h = h || 1e-4 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };
  var deriv2 = function (f, x) { var h = 1e-3 * Math.max(1, Math.abs(x)); return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); };

  /* ======================================================== 1. functions: transform / compose / inverse */
  var LIB = [
    ["x^2", "x²"], ["x^3", "x³"], ["sqrt(x)", "√x"], ["abs(x)", "|x|"], ["1/x", "1/x"], ["exp(x)", "eˣ"], ["ln(x)", "ln x"], ["sin(x)", "sin x"], ["cos(x)", "cos x"], ["u(x)", "u(x) ขั้นบันได"]
  ];
  function initFn(box) {
    var d = box.dataset;
    var st = { f: d.f || "x^2", g: d.g || "x+1", mode: d.mode || "transform", a: 1, b: 1, h: 0, k: 0 };
    box.innerHTML = '<div class="lap-chips cl-modes"><button type="button" class="lap-chip" data-mode="transform">เลื่อน · ยืด · สะท้อน</button><button type="button" class="lap-chip" data-mode="compose">ฟังก์ชันประกอบ f∘g</button><button type="button" class="lap-chip" data-mode="inverse">ฟังก์ชันผกผัน f⁻¹</button></div>' +
      '<div class="lap-row"><label class="lap-lbl">f(x) =</label><input class="lap-in" data-in="f" value="' + MK.esc(st.f) + '"><label class="lap-lbl cl-gin">g(x) =</label><input class="lap-in sm cl-gin" data-in="g" value="' + MK.esc(st.g) + '"></div>' +
      '<div class="lap-chips cl-lib">' + LIB.map(function (l) { return '<button type="button" class="lap-chip" data-lib="' + l[0] + '">' + l[1] + "</button>"; }).join("") + "</div>" +
      '<div class="cl-tr">' + slider("a", "a (ยืดแนวตั้ง / สะท้อนแกน x ถ้า a &lt; 0)", -3, 3, 0.25, 1) + slider("b", "b (บีบแนวนอน / สะท้อนแกน y ถ้า b &lt; 0)", -3, 3, 0.25, 1) + slider("h", "h (เลื่อนขวา)", -4, 4, 0.5, 0) + slider("k", "k (เลื่อนขึ้น)", -4, 4, 0.5, 0) + "</div>" +
      '<div class="cl-eq"></div><div class="cl-plot"></div><div class="cl-info"></div>';
    var plot = box.querySelector(".cl-plot"), eq = box.querySelector(".cl-eq"), info = box.querySelector(".cl-info");
    function draw() {
      var f, g;
      try { f = compile(st.f); } catch (e) { info.innerHTML = '<p class="lap-err">⚠ f: ' + MK.esc(e.message) + "</p>"; return; }
      box.querySelector(".cl-tr").hidden = st.mode !== "transform";
      $$(".cl-gin", box).forEach(function (x) { x.hidden = st.mode !== "compose"; });
      $$("[data-mode]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-mode") === st.mode); });
      var X0 = -6, X1 = 6, series = [], marks = [], tex = "", note = "";
      if (st.mode === "transform") {
        var a = st.a, b = st.b, h = st.h, k = st.k;
        var G = function (x) { return a * f(b * (x - h)) + k; };
        series = [{ pts: MK.sample(f, X0, X1, 600), color: "var(--ink-3)", dash: "5 4", width: 1.6 }, { pts: MK.sample(G, X0, X1, 600), color: "var(--accent)" }];
        var inner = (b === 1 ? "" : MK.nice(b)) + (h === 0 ? "x" : (b === 1 ? "" : "(") + "x " + (h > 0 ? "- " + MK.nice(h) : "+ " + MK.nice(-h)) + (b === 1 ? "" : ")"));
        tex = "g(x) = " + MK.coef(a) + "f\\left(" + inner + "\\right)" + (k ? (k > 0 ? " + " : " - ") + MK.nice(Math.abs(k)) : "") + ",\\quad f(x) = " + f.tex;
        var parts = [];
        if (h) parts.push("เลื่อน" + (h > 0 ? "ขวา " : "ซ้าย ") + fmt(Math.abs(h)));
        if (b !== 1 && b !== 0) parts.push((Math.abs(b) > 1 ? "บีบแนวนอน " : "ยืดแนวนอน ") + fmt(1 / Math.abs(b)) + " เท่า" + (b < 0 ? " และสะท้อนข้ามแกน y" : ""));
        if (b === -1) parts.push("สะท้อนข้ามแกน y");
        if (a !== 1) parts.push((Math.abs(a) > 1 ? "ยืดแนวตั้ง " : Math.abs(a) < 1 && a !== 0 ? "หดแนวตั้ง " : "") + (Math.abs(a) !== 1 && a !== 0 ? fmt(Math.abs(a)) + " เท่า" : "") + (a < 0 ? " สะท้อนข้ามแกน x" : ""));
        if (k) parts.push("เลื่อน" + (k > 0 ? "ขึ้น " : "ลง ") + fmt(Math.abs(k)));
        note = parts.length ? "ลำดับที่ปลอดภัย: ทำในวงเล็บก่อน (b, h) แล้วค่อยทำนอกวงเล็บ (a, k): " + parts.join(" → ") : "g(x) = f(x) ยังไม่มีการแปลง ลองเลื่อนแถบด้านบน";
      } else if (st.mode === "compose") {
        try { g = compile(st.g); } catch (e) { info.innerHTML = '<p class="lap-err">⚠ g: ' + MK.esc(e.message) + "</p>"; return; }
        var fg = function (x) { return f(g(x)); }, gf = function (x) { return g(f(x)); };
        series = [{ pts: MK.sample(fg, X0, X1, 600), color: "var(--accent)" }, { pts: MK.sample(gf, X0, X1, 600), color: "var(--signal)" }, { pts: MK.sample(f, X0, X1, 400), color: "var(--ink-3)", dash: "4 4", width: 1.2 }];
        tex = "(f\\circ g)(x) = f(g(x)),\\ \\ (g\\circ f)(x) = g(f(x)),\\quad f = " + f.tex + ",\\ g = " + g.tex;
        var same = [0.3, 1.1, 2.4].every(function (x) { var p = fg(x), q = gf(x); return isFinite(p) && isFinite(q) && Math.abs(p - q) < 1e-9; });
        note = '<span class="lap-key k2"></span> f∘g (ใส่ g ก่อน แล้ว f) · <span class="lap-key" style="border-top-color:var(--signal)"></span> g∘f · เส้นประ = f เดิม · ' + (same ? "สองเส้นทับกัน: คู่นี้สลับลำดับได้ (กรณีพิเศษ)" : "สองเส้นไม่ทับกัน: ส่วนใหญ่ f∘g ≠ g∘f");
      } else {
        // inverse: reflect across y = x, horizontal-line test
        var pts = MK.sample(f, X0, X1, 600), inv = pts.filter(function (p) { return isFinite(p[1]); }).map(function (p) { return [p[1], p[0]]; });
        var ys = pts.map(function (p) { return p[1]; }).filter(isFinite), mono = true, sgn = 0;
        for (var i = 1; i < pts.length; i++) { var dy = pts[i][1] - pts[i - 1][1]; if (!isFinite(dy) || Math.abs(dy) < 1e-12) continue; var s = dy > 0 ? 1 : -1; if (sgn && s !== sgn) { mono = false; break; } sgn = s; }
        void ys;
        series = [{ pts: pts, color: "var(--accent)" }, { pts: inv.sort(function (p, q) { return p[0] - q[0]; }), color: "var(--signal)", dash: mono ? null : "4 4" }, { pts: [[X0, X0], [X1, X1]], color: "var(--ink-3)", dash: "3 5", width: 1.2 }];
        tex = "y = f(x) = " + f.tex + "\\quad\\longrightarrow\\quad \\text{สลับ } x \\leftrightarrow y";
        note = mono ? "ผ่านการทดสอบเส้นแนวนอน (ฟังก์ชันหนึ่งต่อหนึ่งในช่วงที่วาด) จึงมีฟังก์ชันผกผัน กราฟสีน้ำเงินคือ f⁻¹ ซึ่งเป็นภาพสะท้อนข้ามเส้น y = x" : "ไม่ผ่านการทดสอบเส้นแนวนอน (ค่า y เดียวมาจากหลาย x) ภาพสะท้อนสีน้ำเงินจึงไม่ใช่ฟังก์ชัน ต้องจำกัดโดเมนก่อน เช่น x² เมื่อ x ≥ 0 จึงได้ √x";
      }
      MK.tex(eq, tex, true);
      plotInto(plot, { w: 680, h: 360, xmin: X0, xmax: X1, ymin: -6, ymax: 6, series: series, marks: marks, xlabel: "x", ylabel: "y", id: MK.uid("fn") });
      // domain / range estimate for f (transform mode: of g)
      info.innerHTML = '<p class="lap-note">' + note + "</p>";
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-mode]"); if (m) { st.mode = m.getAttribute("data-mode"); draw(); return; }
      var l = e.target.closest("[data-lib]"); if (l) { st.f = l.getAttribute("data-lib"); box.querySelector('[data-in="f"]').value = st.f; draw(); }
    });
    $$(".lap-in", box).forEach(function (i) { i.addEventListener("change", function () { st[i.getAttribute("data-in")] = i.value; draw(); }); i.addEventListener("keydown", function (e) { if (e.key === "Enter") { st[i.getAttribute("data-in")] = i.value; draw(); } }); });
    bindSliders(box, st, draw);
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; setSlider(box, k, o[k]); }); if (o.f) box.querySelector('[data-in="f"]').value = o.f; if (o.g) box.querySelector('[data-in="g"]').value = o.g; draw(); };
    draw();
  }

  /* ======================================================== 2. limits: zoom, table, ε–δ */
  function initLimit(box) {
    var d = box.dataset;
    var st = { f: d.f || "(x^2-4)/(x-2)", a: +(d.a || 2), eps: +(d.eps || 0.5), zoom: 0 };
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">f(x) =</label><input class="lap-in" data-in="f" value="' + MK.esc(st.f) + '"><label class="lap-lbl">x →</label><input class="lap-in sm" data-in="a" value="' + st.a + '"></div>' +
      '<div class="lap-chips cl-pre"></div>' +
      slider("eps", "ε (ความกว้างแถบรอบ L)", 0.02, 2, 0.02, st.eps) + slider("zoom", "ซูมเข้า (เท่า 10ⁿ)", 0, 4, 0.25, 0) +
      '<div class="cl-eq"></div><div class="cl-plot"></div><div class="cl-tab"></div>';
    var PRE = [["(x^2-4)/(x-2)", 2, "0/0 แยกตัวประกอบ"], ["sin(x)/x", 0, "sin x / x"], ["(1-cos(x))/x^2", 0, "(1 − cos x)/x²"], ["(sqrt(x+4)-2)/x", 0, "คอนจูเกต"], ["abs(x)/x", 0, "ซ้าย ≠ ขวา"], ["1/x^2", 0, "→ ∞"], ["sin(1/x)", 0, "แกว่งไม่มีลิมิต"], ["(1+x)^(1/x)", 0, "ค่า e"], ["(exp(x)-1)/x", 0, "(eˣ − 1)/x"]];
    var pre = box.querySelector(".cl-pre");
    PRE.forEach(function (p) { var b = document.createElement("button"); b.type = "button"; b.className = "lap-chip"; b.textContent = p[2]; b.addEventListener("click", function () { st.f = p[0]; st.a = p[1]; box.querySelector('[data-in="f"]').value = p[0]; box.querySelector('[data-in="a"]').value = p[1]; draw(); }); pre.appendChild(b); });
    var plot = box.querySelector(".cl-plot"), tab = box.querySelector(".cl-tab"), eq = box.querySelector(".cl-eq");
    function draw() {
      var f; try { f = compile(st.f); } catch (e) { tab.innerHTML = '<p class="lap-err">⚠ ' + MK.esc(e.message) + "</p>"; return; }
      var a = st.a;
      // numerical one-sided limits
      var hs = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6];
      var L = hs.map(function (h) { return f(a - h); }), R = hs.map(function (h) { return f(a + h); });
      function est(arr) { var x = arr[arr.length - 1], y = arr[arr.length - 2]; if (!isFinite(x)) return x; if (Math.abs(x) > 1e6 && Math.abs(x) > Math.abs(y) * 5) return x > 0 ? Infinity : -Infinity; return Math.abs(x - y) < 1e-3 * Math.max(1, Math.abs(x)) ? x : NaN; }
      var lL = est(L), lR = est(R), exists = isFinite(lL) && isFinite(lR) && Math.abs(lL - lR) < 1e-3 * Math.max(1, Math.abs(lL));
      var Lv = exists ? (lL + lR) / 2 : NaN;
      var shown = function (v) { return isFinite(v) ? MK.nice(Math.round(v * 1e6) / 1e6) : isNaN(v) ? "\\text{ไม่ลู่เข้า}" : (v > 0 ? "\\infty" : "-\\infty"); };
      MK.tex(eq, "\\lim_{x\\to " + MK.nice(a) + "^-}f(x) \\approx " + shown(lL) + ",\\quad \\lim_{x\\to " + MK.nice(a) + "^+}f(x) \\approx " + shown(lR) + ",\\quad " + (exists ? "\\lim_{x\\to " + MK.nice(a) + "}f(x) = " + shown(Lv) : "\\lim_{x\\to " + MK.nice(a) + "}f(x)\\ \\text{ไม่มีค่า}"), true);
      var w = 4 / Math.pow(10, st.zoom), X0 = a - w, X1 = a + w;
      var pts = MK.sample(f, X0, X1, 800).map(function (p) { return Math.abs(p[0] - a) < w * 1e-6 ? [p[0], NaN] : p; });
      var bands = [], segs = [], marks = [], ymin, ymax;
      if (exists) {
        var eps = st.eps / Math.pow(10, st.zoom);
        // find the largest δ (sampled) such that |f(x) − L| < ε for 0 < |x − a| < δ
        var delta = 0, N = 400;
        for (var i = 1; i <= N; i++) {
          var dx = w * i / N, ok = true;
          for (var j = -2; j <= 2; j++) { var x1 = a - dx + j * w / N / 5, x2 = a + dx + j * w / N / 5; if (!(Math.abs(f(x1) - Lv) < eps) || !(Math.abs(f(x2) - Lv) < eps)) { ok = false; break; } }
          if (!ok) break;
          delta = dx;
        }
        bands.push({ x0: a - delta, x1: a + delta, color: "var(--ok)", op: 0.13 });
        ymin = Lv - Math.max(3 * eps, w); ymax = Lv + Math.max(3 * eps, w);
        segs.push({ x1: X0, y1: Lv + eps, x2: X1, y2: Lv + eps, color: "var(--signal)", dash: "6 4", width: 1.4 }, { x1: X0, y1: Lv - eps, x2: X1, y2: Lv - eps, color: "var(--signal)", dash: "6 4", width: 1.4 });
        marks.push({ x: a, y: Lv, open: true, color: "var(--accent)", label: "L = " + fmt(Lv) });
        var fa = f(a);
        if (isFinite(fa) && Math.abs(fa - Lv) > 1e-9) marks.push({ x: a, y: fa, color: "var(--accent)", label: "f(a)" });
        tab.innerHTML = '<p class="lap-note">แถบน้ำเงินคือ L ± ε = ' + fmt(Lv) + " ± " + fmt(eps) + " · แถบเขียวคือ δ ≈ " + fmt(delta, 3) + " ที่หาได้: ทุก x ในแถบเขียว (ยกเว้น x = a) ให้ f(x) อยู่ในแถบน้ำเงิน ลด ε แล้ว δ จะเล็กลงตาม แต่ยังหาได้เสมอ นั่นคือนิยามของลิมิต</p>";
      } else {
        tab.innerHTML = '<p class="lap-note">' + (isFinite(lL) && isFinite(lR) ? "ลิมิตซ้าย (" + fmt(lL) + ") ≠ ลิมิตขวา (" + fmt(lR) + ") จึงไม่มีลิมิตสองด้าน" : !isFinite(lL) && !isNaN(lL) || !isFinite(lR) && !isNaN(lR) ? "ค่าฟังก์ชันโตไม่จำกัดเมื่อเข้าใกล้ a: ลิมิตเป็นอนันต์ (ไม่มีค่าในความหมายของจำนวนจริง) และ x = a เป็นเส้นกำกับแนวตั้ง" : "ค่าฟังก์ชันไม่ลู่เข้าค่าใดเลย (แกว่ง) ลองซูมเข้าแล้วดูว่ายิ่งใกล้ยิ่งแกว่งเร็ว") + "</p>";
      }
      plotInto(plot, { w: 680, h: 320, xmin: X0, xmax: X1, ymin: ymin, ymax: ymax, clip: 50, series: [{ pts: pts, color: "var(--accent)" }], bands: bands, segs: segs, marks: marks, vlines: [{ x: a, label: "x = " + fmt(a) }], xlabel: "x", id: MK.uid("lm") });
      tab.innerHTML += '<table class="lap-pt cl-vt"><thead><tr><th>h</th><th>f(a − h)</th><th>f(a + h)</th></tr></thead><tbody>' + hs.map(function (h, i) { return "<tr><td>" + h.toExponential(0).replace("e-", "×10⁻").replace(/⁻(\d)/, function (m0, dd) { return "⁻" + "⁰¹²³⁴⁵⁶⁷⁸⁹"[dd]; }) + "</td><td>" + fmt(L[i], 7) + "</td><td>" + fmt(R[i], 7) + "</td></tr>"; }).join("") + "</tbody></table>";
    }
    $$(".lap-in", box).forEach(function (i) { var go = function () { var k = i.getAttribute("data-in"); st[k] = k === "a" ? +i.value : i.value; draw(); }; i.addEventListener("change", go); i.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); }); });
    bindSliders(box, st, draw);
    draw();
  }

  /* ======================================================== 3. secant → tangent, f′, f″ */
  function initTangent(box) {
    var d = box.dataset;
    var st = { f: d.f || "x^3-3x", x0: +(d.x0 || 1.5), h: 1, show: (d.show || "deriv").split(",") };
    var X0 = +(d.xmin || -3), X1 = +(d.xmax || 3);
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">f(x) =</label><input class="lap-in" value="' + MK.esc(st.f) + '"></div>' +
      slider("h", "h (ระยะของเส้นตัด)", 0, 2, 0.01, 1) +
      '<div class="cl-eq"></div><div class="cl-plot"></div><div class="cl-plot2"></div><p class="lap-help">ลากจุดสีส้มบนกราฟเพื่อเปลี่ยน x₀ · เลื่อน h ลงไปที่ 0 แล้วดูเส้นตัด (น้ำเงิน) กลายเป็นเส้นสัมผัส (เขียว)</p>';
    var p1 = box.querySelector(".cl-plot"), p2 = box.querySelector(".cl-plot2"), eq = box.querySelector(".cl-eq");
    function draw() {
      var f; try { f = compile(st.f); } catch (e) { eq.innerHTML = '<p class="lap-err">⚠ ' + MK.esc(e.message) + "</p>"; return; }
      var x0 = st.x0, h = st.h, y0 = f(x0), m = deriv(f, x0), ms = h > 0 ? (f(x0 + h) - y0) / h : m;
      var segs = [{ x1: X0, y1: y0 + m * (X0 - x0), x2: X1, y2: y0 + m * (X1 - x0), color: "var(--ok)", width: 2 }];
      if (h > 0) segs.push({ x1: X0, y1: y0 + ms * (X0 - x0), x2: X1, y2: y0 + ms * (X1 - x0), color: "var(--signal)", width: 1.6, dash: "6 4" });
      var marks = [{ x: x0, y: y0, drag: "x0", color: "var(--accent)", r: 6 }];
      if (h > 0) marks.push({ x: x0 + h, y: f(x0 + h), color: "var(--signal)", r: 4 });
      var pts = MK.sample(f, X0, X1, 600), ys = pts.map(function (p) { return p[1]; }).filter(isFinite);
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = (hi - lo) * 0.12 + 0.2;
      plotInto(p1, { w: 680, h: 300, xmin: X0, xmax: X1, ymin: lo - pad, ymax: hi + pad, series: [{ pts: pts, color: "var(--accent)" }], segs: segs, marks: marks, xlabel: "x", ylabel: "f(x)", id: MK.uid("tg") });
      MK.tex(eq, "\\underbrace{\\frac{f(x_0 + h) - f(x_0)}{h}}_{\\text{ความชันเส้นตัด}} = " + (h > 0 ? MK.sig(ms, 5) : "\\text{—}") + "\\ \\xrightarrow{\\ h\\to 0\\ }\\ f'(" + MK.sig(x0, 4) + ") = " + MK.sig(m, 5), true);
      // derivative graphs
      var series = [], ms2 = [], crit = [];
      if (st.show.indexOf("deriv") >= 0) series.push({ pts: MK.sample(function (x) { return deriv(f, x); }, X0, X1, 400), color: "var(--ok)" });
      if (st.show.indexOf("second") >= 0) series.push({ pts: MK.sample(function (x) { return deriv2(f, x); }, X0, X1, 400), color: "#9b59b6", dash: "5 4" });
      // critical points: sign changes of f′
      var prev = deriv(f, X0);
      for (var i = 1; i <= 600; i++) {
        var x = X0 + (X1 - X0) * i / 600, v = deriv(f, x);
        if (isFinite(v) && isFinite(prev) && v * prev < 0) {
          var a = x - (X1 - X0) / 600, b = x;
          for (var k = 0; k < 40; k++) { var mid = (a + b) / 2; if (deriv(f, a) * deriv(f, mid) <= 0) b = mid; else a = mid; }
          var xc = (a + b) / 2; crit.push({ x: xc, kind: deriv2(f, xc) < 0 ? "สูงสุดสัมพัทธ์" : "ต่ำสุดสัมพัทธ์" });
        }
        prev = v;
      }
      crit.forEach(function (c) { ms2.push({ x: c.x, y: 0, color: "var(--ok)", r: 4.5 }); });
      plotInto(p2, { w: 680, h: 200, xmin: X0, xmax: X1, series: series, marks: ms2, vlines: [{ x: x0 }], xlabel: "x", ylabel: "f′(x)" + (st.show.indexOf("second") >= 0 ? " · f″(x) เส้นประ" : ""), clip: 60, id: MK.uid("dv") });
      if (crit.length) p2.insertAdjacentHTML("beforeend", '<p class="lap-note">จุดวิกฤต (f′ = 0 และเปลี่ยนเครื่องหมาย): ' + crit.map(function (c) { return "x ≈ " + fmt(c.x, 4) + " (" + c.kind + ", f = " + fmt(f(c.x), 4) + ")"; }).join(" · ") + "</p>");
    }
    box.querySelector(".lap-in").addEventListener("change", function (e) { st.f = e.target.value; draw(); });
    bindSliders(box, st, draw);
    dragPlot(p1, function (key, x) { st.x0 = Math.max(X0, Math.min(X1, Math.round(x * 20) / 20)); draw(); });
    draw();
  }

  /* ======================================================== 4. Newton–Raphson */
  function initNewton(box) {
    var d = box.dataset;
    var st = { f: d.f || "x^3-2x-5", x0: +(d.x0 || 2), n: 5 };
    var X0 = +(d.xmin || -1), X1 = +(d.xmax || 4);
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">f(x) =</label><input class="lap-in" value="' + MK.esc(st.f) + '"></div>' + slider("n", "จำนวนรอบที่แสดง", 1, 8, 1, 5) +
      '<div class="cl-plot"></div><div class="cl-tab"></div><p class="lap-help">ลากจุดเริ่มต้น x₀ (สีส้มบนแกน x) แล้วดูเส้นสัมผัสพาไปหาราก ลองวาง x₀ ใกล้จุดที่ f′ = 0 เพื่อดูว่าวิธีนี้ล้มเหลวได้อย่างไร</p>';
    var plot = box.querySelector(".cl-plot"), tab = box.querySelector(".cl-tab");
    function draw() {
      var f; try { f = compile(st.f); } catch (e) { tab.innerHTML = '<p class="lap-err">⚠ ' + MK.esc(e.message) + "</p>"; return; }
      var xs = [st.x0], segs = [], rows = [];
      for (var i = 0; i < st.n; i++) {
        var x = xs[i], fx = f(x), dfx = deriv(f, x);
        if (!isFinite(fx) || !isFinite(dfx) || Math.abs(dfx) < 1e-12) { rows.push([i, x, fx, dfx, NaN]); break; }
        var xn = x - fx / dfx;
        rows.push([i, x, fx, dfx, xn]);
        segs.push({ x1: x, y1: 0, x2: x, y2: fx, color: "var(--ink-3)", dash: "3 3", width: 1.2 }, { x1: x, y1: fx, x2: xn, y2: 0, color: "var(--signal)", width: 1.8 });
        xs.push(xn);
      }
      var pts = MK.sample(f, X0, X1, 600), ys = pts.map(function (p) { return p[1]; }).filter(isFinite);
      var lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0, Math.max.apply(null, ys));
      plotInto(plot, { w: 680, h: 320, xmin: X0, xmax: X1, ymin: lo - (hi - lo) * 0.08, ymax: hi + (hi - lo) * 0.08, series: [{ pts: pts, color: "var(--accent)" }], segs: segs, marks: [{ x: st.x0, y: 0, drag: "x0", color: "var(--accent)", r: 6, label: "x₀" }].concat(xs.slice(1).map(function (x, i) { return { x: x, y: 0, color: "var(--signal)", r: 3.5, label: i < 3 ? "x" + "₁₂₃"[i] : "" }; })), xlabel: "x", id: MK.uid("nw") });
      tab.innerHTML = '<table class="lap-pt"><thead><tr><th>n</th><th>xₙ</th><th>f(xₙ)</th><th>f′(xₙ)</th><th>xₙ₊₁ = xₙ − f/f′</th></tr></thead><tbody>' + rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + fmt(r[1], 10) + "</td><td>" + fmt(r[2], 6) + "</td><td>" + fmt(r[3], 6) + "</td><td>" + (isFinite(r[4]) ? fmt(r[4], 10) : "หยุด: f′ ≈ 0") + "</td></tr>"; }).join("") + "</tbody></table>";
    }
    box.querySelector(".lap-in").addEventListener("change", function (e) { st.f = e.target.value; draw(); });
    bindSliders(box, st, draw);
    dragPlot(plot, function (key, x) { st.x0 = Math.max(X0, Math.min(X1, Math.round(x * 50) / 50)); draw(); });
    draw();
  }

  /* ======================================================== 5. optimisation presets */
  var OPT = {
    box: { n: "กล่องเปิดฝาจากแผ่น 30×30 cm", f: function (x) { return x * (30 - 2 * x) * (30 - 2 * x); }, x0: 0, x1: 15, x: 3, xl: "x = ความยาวตัดมุม (cm)", yl: "V (cm³)", tex: "V(x) = x(30 - 2x)^2,\\quad V'(x) = (30-2x)(30-6x)", ans: "V′ = 0 ที่ x = 5 cm (x = 15 ทำให้ไม่มีกล่อง) ได้ V = 2000 cm³" },
    power: { n: "ถ่ายโอนกำลังสูงสุด (Vs = 12 V, Rs = 4 Ω)", f: function (R) { return 144 * R / ((4 + R) * (4 + R)); }, x0: 0, x1: 20, x: 10, xl: "R_L (Ω)", yl: "P (W)", tex: "P(R_L) = \\frac{V_s^2R_L}{(R_s + R_L)^2},\\quad P' = V_s^2\\frac{R_s - R_L}{(R_s + R_L)^3}", ans: "P′ = 0 ที่ R_L = R_s = 4 Ω ได้ P_max = V_s²/(4R_s) = 9 W" },
    can: { n: "กระป๋องปริมาตร 1 ลิตร ใช้วัสดุน้อยสุด", f: function (r) { return 2 * Math.PI * r * r + 2000 / r; }, x0: 2, x1: 15, x: 9, xl: "r (cm)", yl: "A (cm²)", tex: "A(r) = 2\\pi r^2 + \\frac{2000}{r},\\quad A'(r) = 4\\pi r - \\frac{2000}{r^2}", ans: "A′ = 0 ที่ r = (500/π)^{1/3} ≈ 5.42 cm, h = 2r ≈ 10.84 cm (สูงเท่าเส้นผ่านศูนย์กลาง)" },
    fence: { n: "รั้วยาว 100 m ล้อมที่ติดแม่น้ำ", f: function (x) { return x * (100 - 2 * x); }, x0: 0, x1: 50, x: 10, xl: "x = ด้านตั้งฉากแม่น้ำ (m)", yl: "พื้นที่ (m²)", tex: "A(x) = x(100 - 2x),\\quad A'(x) = 100 - 4x", ans: "A′ = 0 ที่ x = 25 m ด้านขนาน 50 m ได้พื้นที่ 1250 m²" },
    beam: { n: "คานไม้ตัดจากซุงกลม d = 30 cm แข็งแรงสุด", f: function (b) { return b * (900 - b * b); }, x0: 0, x1: 30, x: 25, xl: "b = ความกว้าง (cm)", yl: "S ∝ b·h²", tex: "S \\propto bh^2 = b(d^2 - b^2),\\quad \\frac{dS}{db} = d^2 - 3b^2", ans: "dS/db = 0 ที่ b = d/√3 ≈ 17.3 cm, h = d√(2/3) ≈ 24.5 cm (h : b = √2 : 1)" }
  };
  function initOpt(box) {
    var st = { p: box.dataset.preset || "power", x: null };
    box.innerHTML = '<div class="lap-chips">' + Object.keys(OPT).map(function (k) { return '<button type="button" class="lap-chip" data-p="' + k + '">' + OPT[k].n + "</button>"; }).join("") + '</div><div class="cl-eq"></div><div class="cl-plot"></div><div class="cl-plot2"></div><div class="cl-info"></div><p class="lap-help">ลากจุดบนกราฟบนเพื่อเปลี่ยนค่า x · กราฟล่างคืออนุพันธ์ จุดที่ดีที่สุดอยู่ตรงที่อนุพันธ์ข้ามศูนย์</p>';
    var p1 = box.querySelector(".cl-plot"), p2 = box.querySelector(".cl-plot2"), eq = box.querySelector(".cl-eq"), info = box.querySelector(".cl-info");
    function draw() {
      var P = OPT[st.p];
      if (st.x == null) st.x = P.x;
      var f = P.f, x = Math.max(P.x0 + 1e-6, Math.min(P.x1, st.x)), y = f(x), m = deriv(f, x);
      var span = P.x1 - P.x0, segs = [{ x1: x - span * 0.12, y1: y - m * span * 0.12, x2: x + span * 0.12, y2: y + m * span * 0.12, color: "var(--ok)", width: 2 }];
      MK.tex(eq, P.tex, true);
      plotInto(p1, { w: 680, h: 250, xmin: P.x0, xmax: P.x1, series: [{ pts: MK.sample(f, P.x0 + 1e-6, P.x1, 500), color: "var(--accent)" }], segs: segs, marks: [{ x: x, y: y, drag: "x", r: 6, color: "var(--accent)", label: fmt(y, 4) }], xlabel: P.xl, ylabel: P.yl, id: MK.uid("op") });
      plotInto(p2, { w: 680, h: 160, xmin: P.x0, xmax: P.x1, series: [{ pts: MK.sample(function (t) { return deriv(f, t); }, P.x0 + 1e-3, P.x1, 400), color: "var(--ok)" }], marks: [{ x: x, y: m, r: 5, color: "var(--ok)" }], xlabel: P.xl, ylabel: "อนุพันธ์", clip: 1e4, id: MK.uid("od") });
      info.innerHTML = '<p class="lap-note">ตอนนี้ x = ' + fmt(x, 4) + " · ค่า = " + fmt(y, 5) + " · อนุพันธ์ = " + fmt(m, 4) + (Math.abs(m) < 0.02 * Math.abs(y) / span ? " ✓ ใกล้ศูนย์ = จุดเหมาะสม" : m > 0 ? " (ยังเพิ่มได้ ให้เพิ่ม x)" : " (ควรลด x)") + '</p><p class="lap-ans" style="padding:8px 14px">คำตอบ: ' + P.ans + "</p>";
      $$("[data-p]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-p") === st.p); });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (b) { st.p = b.getAttribute("data-p"); st.x = null; draw(); } });
    dragPlot(p1, function (k, x) { var P = OPT[st.p]; st.x = Math.max(P.x0, Math.min(P.x1, x)); draw(); });
    draw();
  }

  /* ======================================================== 6. capacitor / inductor */
  var WAVES = {
    sine: { n: "ไซน์", f: function (t) { return 5 * Math.sin(2 * Math.PI * 50 * t); } },
    tri: { n: "สามเหลี่ยม", f: function (t) { var p = (t * 50) % 1; return 5 * (p < 0.5 ? 4 * p - 1 : 3 - 4 * p); } },
    trap: { n: "สี่เหลี่ยมคางหมู", f: function (t) { var p = (t * 50) % 1; return p < 0.1 ? 50 * p : p < 0.4 ? 5 : p < 0.6 ? 5 - 50 * (p - 0.4) : p < 0.9 ? -5 : -5 + 50 * (p - 0.9); } },
    ramp: { n: "แรมป์แล้วคงที่", f: function (t) { var p = (t * 50) % 1; return p < 0.5 ? 10 * p : 5; } }
  };
  function initCap(box) {
    var st = { w: box.dataset.wave || "trap", C: 10, el: "C" };
    box.innerHTML = '<div class="lap-chips">' + Object.keys(WAVES).map(function (k) { return '<button type="button" class="lap-chip" data-w="' + k + '">' + WAVES[k].n + "</button>"; }).join("") + '</div><div class="lap-chips"><button type="button" class="lap-chip" data-el="C">ตัวเก็บประจุ i = C dv/dt</button><button type="button" class="lap-chip" data-el="L">ตัวเหนี่ยวนำ v = L di/dt</button></div>' + slider("C", "C (µF) หรือ L (mH)", 1, 50, 1, 10) + '<div class="cl-plot"></div><div class="cl-plot2"></div><div class="cl-info"></div>';
    var p1 = box.querySelector(".cl-plot"), p2 = box.querySelector(".cl-plot2"), info = box.querySelector(".cl-info");
    function draw() {
      var W = WAVES[st.w], T1 = 0.04, isC = st.el === "C", k = isC ? st.C * 1e-6 : st.C * 1e-3;
      var x = function (t) { return W.f(t); }, y = function (t) { return k * deriv(x, t, 1e-6) * (isC ? 1000 : 1); };
      plotInto(p1, { w: 680, h: 180, xmin: 0, xmax: T1, series: [{ pts: MK.sample(x, 0, T1, 800), color: "var(--accent)" }], xlabel: "t (s)", ylabel: isC ? "v(t) (V)" : "i(t) (A)", id: MK.uid("c1") });
      var pts = MK.sample(y, 0, T1, 800);
      plotInto(p2, { w: 680, h: 180, xmin: 0, xmax: T1, series: [{ pts: pts, color: "var(--signal)" }], xlabel: "t (s)", ylabel: isC ? "i(t) = C dv/dt (mA)" : "v(t) = L di/dt (V)", id: MK.uid("c2") });
      var pk = Math.max.apply(null, pts.map(function (p) { return Math.abs(p[1]); }).filter(isFinite));
      info.innerHTML = '<p class="lap-note">' + (isC ? "กระแสเป็นสัดส่วนกับ<b>ความชัน</b>ของแรงดัน: ช่วงที่แรงดันคงที่ กระแสเป็นศูนย์ ช่วงที่ขึ้นเร็ว กระแสพุ่ง · ค่ายอด ≈ " + fmt(pk, 3) + " mA · ถ้าแรงดันกระโดดทันที dv/dt → ∞ กระแสจึงเป็นอิมพัลส์ นี่คือเหตุที่แรงดันตัวเก็บประจุเปลี่ยนแบบกระโดดไม่ได้" : "แรงดันเป็นสัดส่วนกับความชันของกระแส ถ้าตัดกระแสทันที di/dt มหาศาล เกิดแรงดันกระชาก (inductive kick) จึงต้องมีไดโอดฟรีวีลคร่อมรีเลย์และมอเตอร์ · ค่ายอด ≈ " + fmt(pk, 3) + " V") + "</p>";
      $$("[data-w]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-w") === st.w); });
      $$("[data-el]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-el") === st.el); });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-w]"); if (b) { st.w = b.getAttribute("data-w"); draw(); return; } var c = e.target.closest("[data-el]"); if (c) { st.el = c.getAttribute("data-el"); draw(); } });
    bindSliders(box, st, draw);
    draw();
  }

  /* ======================================================== 7. slider-crank */
  function initCrank(box) {
    var st = { r: 5, l: 15, rpm: 600, th: 60 };
    box.innerHTML = slider("r", "r ข้อเหวี่ยง (cm)", 2, 10, 0.5, 5) + slider("l", "l ก้านสูบ (cm)", 10, 40, 1, 15) + slider("rpm", "ความเร็ว (rpm)", 60, 3000, 60, 600) + slider("th", "มุม θ (องศา)", 0, 360, 1, 60) +
      '<div class="cl-crank-grid"><svg class="mk-plot cl-crank-svg" viewBox="0 0 300 160" role="img" aria-label="กลไกข้อเหวี่ยง-ก้านสูบ"></svg><div class="cl-info"></div></div><div class="cl-plot"></div>';
    var svg = box.querySelector(".cl-crank-svg"), info = box.querySelector(".cl-info"), plot = box.querySelector(".cl-plot");
    function pos(th) { var r = st.r, l = st.l; return r * Math.cos(th) + Math.sqrt(l * l - r * r * Math.sin(th) * Math.sin(th)); }
    function draw() {
      var w = st.rpm * 2 * Math.PI / 60, th = st.th * Math.PI / 180, r = st.r, l = st.l;
      var xf = function (t) { return pos(t); };
      var v = function (t) { return deriv(xf, t, 1e-5) * w / 100; }; // m/s (x in cm)
      var a = function (t) { return deriv2(xf, t) * w * w / 100; };
      var X = pos(th), sc = 280 / (r + l + 2), ox = 12, oy = 85;
      var cx = ox + r * Math.cos(th) * sc + (r) * sc, cy = oy - r * Math.sin(th) * sc;
      var px = ox + (X + r) * sc;
      svg.innerHTML = '<circle cx="' + (ox + r * sc) + '" cy="' + oy + '" r="' + (r * sc) + '" fill="none" stroke="var(--rule)" stroke-dasharray="4 4"/>' +
        '<line x1="' + (ox + r * sc) + '" y1="' + oy + '" x2="' + cx + '" y2="' + cy + '" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/>' +
        '<line x1="' + cx + '" y1="' + cy + '" x2="' + px + '" y2="' + oy + '" stroke="var(--signal)" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="' + (px - 14) + '" y="' + (oy - 14) + '" width="28" height="28" rx="4" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>' +
        '<line x1="0" y1="' + (oy + 16) + '" x2="300" y2="' + (oy + 16) + '" stroke="var(--ink-3)"/><circle cx="' + (ox + r * sc) + '" cy="' + oy + '" r="4" fill="var(--ink)"/>' +
        '<text class="mk-ann" x="' + (px - 6) + '" y="' + (oy + 32) + '">x</text>';
      info.innerHTML = '<div class="lap-eq">' + T("x(\\theta) = r\\cos\\theta + \\sqrt{l^2 - r^2\\sin^2\\theta}") + "</div>" + '<div class="lap-eq">' + T("v = \\frac{dx}{dt} = \\frac{dx}{d\\theta}\\,\\omega,\\quad a = \\frac{d^2x}{d\\theta^2}\\,\\omega^2\\ (\\omega \\text{ คงที่})") + '</div><table class="lap-pt"><tbody><tr><td>x</td><td>' + fmt(X, 4) + " cm</td></tr><tr><td>v</td><td>" + fmt(v(th), 4) + " m/s</td></tr><tr><td>a</td><td>" + fmt(a(th), 4) + " m/s² (≈ " + fmt(a(th) / 9.81, 3) + " g)</td></tr><tr><td>ω</td><td>" + fmt(w, 4) + " rad/s</td></tr></tbody></table>";
      var TH = 2 * Math.PI, vs = MK.sample(v, 0, TH, 360).map(function (p) { return [p[0] * 180 / Math.PI, p[1]]; }), as = MK.sample(a, 0, TH, 360).map(function (p) { return [p[0] * 180 / Math.PI, p[1]]; });
      var am = Math.max.apply(null, as.map(function (p) { return Math.abs(p[1]); })), vm = Math.max.apply(null, vs.map(function (p) { return Math.abs(p[1]); }));
      plotInto(plot, { w: 680, h: 220, xmin: 0, xmax: 360, series: [{ pts: vs.map(function (p) { return [p[0], p[1] / vm]; }), color: "var(--accent)" }, { pts: as.map(function (p) { return [p[0], p[1] / am]; }), color: "var(--signal)", dash: "5 4" }], vlines: [{ x: st.th }], xlabel: "θ (องศา)", ylabel: "v/v_max (ส้ม) · a/a_max (น้ำเงิน)", ymin: -1.15, ymax: 1.15, id: MK.uid("ck") });
    }
    bindSliders(box, st, draw);
    draw();
  }

  /* ======================================================== 8. average & RMS by integration */
  var RW = {
    sine: { n: "ไซน์", f: function (x) { return Math.sin(x); } },
    half: { n: "เรียงกระแสครึ่งคลื่น", f: function (x) { return Math.max(0, Math.sin(x)); } },
    full: { n: "เรียงกระแสเต็มคลื่น", f: function (x) { return Math.abs(Math.sin(x)); } },
    square: { n: "สี่เหลี่ยม ±1", f: function (x) { return Math.sin(x) >= 0 ? 1 : -1; } },
    tri: { n: "สามเหลี่ยม", f: function (x) { var p = (x / (2 * Math.PI)) % 1; return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4; } },
    pwm: { n: "PWM ดิวตี D", f: null }
  };
  function initRms(box) {
    var st = { w: box.dataset.wave || "half", D: 0.3, Vm: 311 };
    box.innerHTML = '<div class="lap-chips">' + Object.keys(RW).map(function (k) { return '<button type="button" class="lap-chip" data-w="' + k + '">' + RW[k].n + "</button>"; }).join("") + "</div>" + slider("Vm", "ค่ายอด Vm (V)", 1, 400, 1, 311) + '<label class="lap-row cl-d"><span class="lap-lbl">ดิวตี D</span><input type="range" data-k="D" min="0.05" max="0.95" step="0.05" value="0.3"><output>0.3</output></label>' +
      '<div class="cl-plot"></div><div class="cl-plot2"></div><div class="cl-info"></div>';
    var p1 = box.querySelector(".cl-plot"), p2 = box.querySelector(".cl-plot2"), info = box.querySelector(".cl-info");
    function draw() {
      var f = st.w === "pwm" ? function (x) { return ((x / (2 * Math.PI)) % 1) < st.D ? 1 : 0; } : RW[st.w].f;
      var V = function (x) { return st.Vm * f(x); }, T1 = 2 * Math.PI, N = 4000, s1 = 0, s2 = 0;
      for (var i = 0; i < N; i++) { var x = (i + 0.5) * T1 / N, v = V(x); s1 += v; s2 += v * v; }
      var avg = s1 / N, rms = Math.sqrt(s2 / N), nw = narrow(box), W = nw ? 400 : 680;
      plotInto(p1, { w: W, h: nw ? 250 : 200, left: nw ? 50 : 46, xmin: 0, xmax: 2 * T1, series: [{ pts: MK.sample(V, 0, 2 * T1, 800), color: "var(--accent)", fill: 0.18 }], hlines: [{ y: avg, color: "var(--ok)", label: "ค่าเฉลี่ย " + fmt(avg, 4) }, { y: rms, color: "var(--signal)", label: "RMS " + fmt(rms, 4) }], xlabel: "ωt (rad)", ylabel: "v (V)", id: MK.uid("r1") });
      plotInto(p2, { w: W, h: nw ? 200 : 160, left: nw ? 64 : 46, xmin: 0, xmax: 2 * T1, series: [{ pts: MK.sample(function (x) { return V(x) * V(x); }, 0, 2 * T1, 800), color: "var(--signal)", fill: 0.18 }], hlines: [{ y: rms * rms, color: "var(--signal)", label: "ค่าเฉลี่ยของ v² = Vrms²" }], xlabel: "ωt", ylabel: "v² (V²)", id: MK.uid("r2") });
      info.innerHTML = '<div class="lap-eq">' + T("V_{\\text{avg}} = \\frac{1}{T}\\int_0^T v\\,dt = " + MK.sig(avg, 4) + "\\ \\text{V},\\qquad V_{\\text{rms}} = \\sqrt{\\frac{1}{T}\\int_0^T v^2\\,dt} = " + MK.sig(rms, 4) + "\\ \\text{V}", true) + '</div><p class="lap-note">อินทิกรัลคือพื้นที่แรเงา: ค่าเฉลี่ยคือความสูงของสี่เหลี่ยมที่มีพื้นที่เท่ากับพื้นที่ใต้กราฟในหนึ่งคาบ · RMS คือค่าที่ให้ความร้อนในตัวต้านทานเท่ากับไฟตรง เพราะกำลัง ∝ v² · อัตราส่วน Vrms/Vm = ' + fmt(rms / st.Vm, 4) + ", form factor = " + (Math.abs(avg) > 1e-9 ? fmt(rms / avg, 4) : "—") + "</p>";
      box.querySelector(".cl-d").hidden = st.w !== "pwm";
      $$("[data-w]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-w") === st.w); });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-w]"); if (b) { st.w = b.getAttribute("data-w"); draw(); } });
    bindSliders(box, st, draw);
    redrawOnWidth(box, draw);
    draw();
  }

  /* ======================================================== 9. beam: load → shear → moment → slope → deflection */
  function initBeam(box) {
    var d = box.dataset;
    var st = { type: d.type || "ss", P: 10, a: 2, w: 0, L: 6, EI: 2000 };
    if ((d.load || "point") === "udl") { st.P = 0; st.w = 5; } else if (d.load === "both") { st.w = 3; }
    box.innerHTML = '<div class="lap-chips"><button type="button" class="lap-chip" data-t="ss">คานช่วงเดียวรองรับธรรมดา</button><button type="button" class="lap-chip" data-t="cant">คานยื่น (ยึดแน่นที่ x = 0)</button></div>' +
      slider("L", "ความยาวคาน L (m)", 2, 10, 0.5, st.L) + slider("P", "แรงกระทำเป็นจุด P (kN)", 0, 40, 1, st.P) + slider("a", "ตำแหน่งแรง a (m, ไม่เกิน L)", 0, 10, 0.1, st.a) + slider("w", "น้ำหนักแผ่สม่ำเสมอ w (kN/m)", 0, 20, 0.5, st.w) + slider("EI", "EI (kN·m²)", 500, 10000, 100, st.EI) +
      '<div class="cl-beam-fig"></div><div class="cl-beam-plots"></div><div class="cl-info"></div>';
    var fig = box.querySelector(".cl-beam-fig"), plots = box.querySelector(".cl-beam-plots"), info = box.querySelector(".cl-info");
    function draw() {
      var L = st.L, P = st.P, a = Math.min(st.a, L), w = st.w, EI = st.EI, cant = st.type === "cant";
      // reactions
      var RA, RB = 0, MA = 0;
      if (!cant) { RB = (P * a + w * L * L / 2) / L; RA = P + w * L - RB; } else { RA = P + w * L; MA = -(P * a + w * L * L / 2); }
      var N = 600, xs = [], V = [], M = [], th = [], y = [];
      for (var i = 0; i <= N; i++) {
        var x = L * i / N; xs.push(x);
        var v = RA - w * x - (x > a ? P : 0);
        var m = MA + RA * x - w * x * x / 2 - (x > a ? P * (x - a) : 0);
        V.push(v); M.push(m);
      }
      // integrate EI y'' = M twice (trapezoid), apply boundary conditions
      var s = [0], q = [0];
      for (i = 1; i <= N; i++) { var h = L / N; s.push(s[i - 1] + (M[i - 1] + M[i]) / 2 * h); }
      for (i = 1; i <= N; i++) q.push(q[i - 1] + (s[i - 1] + s[i]) / 2 * (L / N));
      var C1 = cant ? 0 : -q[N] / L; // ss: y(0) = y(L) = 0 ; cantilever: y(0) = y'(0) = 0
      for (i = 0; i <= N; i++) { th.push((s[i] + C1) / EI); y.push((q[i] + C1 * xs[i]) / EI); }
      var maxAbs = function (arr) { var m = 0, k = 0; arr.forEach(function (v, j) { if (Math.abs(v) > Math.abs(m)) { m = v; k = j; } }); return [m, xs[k]]; };
      var Mm = maxAbs(M), Vm = maxAbs(V), ym = maxAbs(y);
      // beam drawing
      var nw = narrow(box), W = nw ? 400 : 680, BL = W - 80, xe = W - 40;
      var sx = function (x) { return 40 + x / L * BL; };
      var g = '<svg class="mk-plot" viewBox="0 0 ' + W + ' 120" role="img" aria-label="คานและน้ำหนักบรรทุก"><rect x="40" y="62" width="' + BL + '" height="12" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>';
      if (cant) g += '<rect x="22" y="30" width="18" height="76" fill="var(--rule)" stroke="var(--ink-2)"/>';
      else g += '<path d="M40 74 l-10 18 h20 z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6"/><circle cx="' + xe + '" cy="82" r="8" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6"/><line x1="' + (xe - 15) + '" x2="' + (xe + 15) + '" y1="91" y2="91" stroke="var(--ink)"/>';
      if (w > 0) { g += '<rect x="40" y="' + (60 - w * 1.6 - 8) + '" width="' + BL + '" height="' + (w * 1.6 + 8) + '" fill="var(--signal)" opacity=".18"/>'; for (var k = 0; k <= 12; k++) g += '<line x1="' + (40 + k * BL / 12) + '" x2="' + (40 + k * BL / 12) + '" y1="' + (60 - w * 1.6 - 8) + '" y2="60" stroke="var(--signal)" stroke-width="1.3"/>'; g += '<text class="mk-ann" x="44" y="' + (52 - w * 1.6 - 8) + '">w = ' + fmt(w) + " kN/m</text>"; }
      if (P > 0) g += '<line x1="' + sx(a) + '" x2="' + sx(a) + '" y1="10" y2="58" stroke="var(--accent)" stroke-width="3"/><path d="M' + sx(a) + ' 60 l-6 -10 h12 z" fill="var(--accent)"/><text class="mk-ann" x="' + (a > L * 0.6 ? sx(a) - 8 : sx(a) + 8) + '" y="22"' + (a > L * 0.6 ? ' text-anchor="end"' : "") + ">P = " + fmt(P) + " kN</text>";
      g += '<text class="mk-ann" x="40" y="114">x = 0</text><text class="mk-ann" x="' + xe + '" y="114" text-anchor="end">x = L = ' + L + " m</text></svg>";
      fig.innerHTML = g;
      var pl = function (arr, lab, col) { return MK.plot({ w: W, h: nw ? 170 : 130, left: nw ? 50 : 46, xmin: 0, xmax: L, series: [{ pts: xs.map(function (x, j) { return [x, arr[j]]; }), color: col, fill: 0.15 }], ylabel: lab, id: MK.uid("bm") }); };
      plots.innerHTML = pl(V, "V(x) แรงเฉือน (kN)", "var(--signal)") + pl(M, "M(x) โมเมนต์ดัด (kN·m)", "var(--accent)") + pl(th.map(function (v) { return v * 1000; }), "θ(x) ความชัน (mrad)", "var(--ok)") + pl(y.map(function (v) { return v * 1000; }), "y(x) การโก่ง (mm)", "#9b59b6");
      info.innerHTML = '<div class="lap-eq">' + T("\\frac{dV}{dx} = -w(x),\\quad \\frac{dM}{dx} = V(x),\\quad EI\\frac{d^2y}{dx^2} = M(x)\\ \\Rightarrow\\ \\theta = \\frac{1}{EI}\\int M\\,dx,\\ \\ y = \\int\\theta\\,dx", true) + '</div><table class="lap-pt"><tbody>' +
        "<tr><td>แรงปฏิกิริยา</td><td>" + (cant ? "R_A = " + fmt(RA, 4) + " kN, M_A = " + fmt(MA, 4) + " kN·m" : "R_A = " + fmt(RA, 4) + " kN, R_B = " + fmt(RB, 4) + " kN") + "</td></tr>" +
        "<tr><td>แรงเฉือนสูงสุด</td><td>" + fmt(Vm[0], 4) + " kN ที่ x = " + fmt(Vm[1], 3) + " m</td></tr>" +
        "<tr><td>โมเมนต์สูงสุด</td><td>" + fmt(Mm[0], 4) + " kN·m ที่ x = " + fmt(Mm[1], 3) + " m (ตรงที่ V เปลี่ยนเครื่องหมาย)</td></tr>" +
        "<tr><td>การโก่งสูงสุด</td><td>" + fmt(ym[0] * 1000, 4) + " mm ที่ x = " + fmt(ym[1], 3) + " m (ตรงที่ θ = 0" + (cant ? " — คานยื่นสูงสุดที่ปลาย" : "") + ")</td></tr></tbody></table>" +
        '<p class="lap-note">อ่านกราฟจากบนลงล่าง: แต่ละกราฟคืออินทิกรัลของกราฟเหนือมัน (หารด้วย EI ก่อนสองกราฟสุดท้าย) และแต่ละกราฟคืออนุพันธ์ของกราฟใต้มัน ค่าคงที่จากการอินทิเกรตหาจากเงื่อนไขที่ฐานรองรับ' + (cant ? " y(0) = 0, θ(0) = 0" : " y(0) = 0, y(L) = 0") + "</p>";
      $$("[data-t]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-t") === st.type); });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-t]"); if (b) { st.type = b.getAttribute("data-t"); draw(); } });
    bindSliders(box, st, draw);
    redrawOnWidth(box, draw);
    draw();
  }

  var INIT = { "cl-fn": initFn, "cl-limit": initLimit, "cl-tangent": initTangent, "cl-newton": initNewton, "cl-opt": initOpt, "cl-cap": initCap, "cl-crank": initCrank, "cl-rms": initRms, "cl-beam": initBeam };
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls).forEach(function (box) {
        if (box.__cl) return; box.__cl = true;
        box.classList.add("cl-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">แล็บโหลดไม่สำเร็จ: ' + MK.esc(e.message) + "</p>"; if (window.console) console.error(e); }
      });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cl-fn]"); if (!b) return;
      var box = document.querySelector(".cl-fn"); if (!box || !box._set) return;
      try { box._set(JSON.parse(b.getAttribute("data-cl-fn"))); box.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (x) { /* ignore */ }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
