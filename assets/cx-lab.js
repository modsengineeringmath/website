/* Complex-mapping lab (course unit 2): the s-plane grid on the left, its image under w = F(s) on the right.
   Markup:  <div class="cx-lab" data-f="square" data-lang="th"></div>        data-f = preset id (see PRESETS) or "custom"
   Optional: data-custom="5/(s^2+2s+5)"  (typed rational function, needs assets/cs-core.js first)
   Thick curves = image of the imaginary axis s = j*omega, i.e. the frequency response F(j*omega).
   The small orthogonal cross at the chosen point s0 shows that angles are kept wherever F'(s0) != 0. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", PI = Math.PI;

  function C(re, im) { return { re: re, im: im || 0 }; }
  function add(a, b) { return C(a.re + b.re, a.im + b.im); }
  function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cexp(a) { var m = Math.exp(a.re); return C(m * Math.cos(a.im), m * Math.sin(a.im)); }
  function ab(a) { return Math.hypot(a.re, a.im); }
  function fin(a) { return isFinite(a.re) && isFinite(a.im); }

  var PRESETS = {
    shift: { lab: "F(s) = s + (1 + j)", f: function (s) { return add(s, C(1, 1)); }, dom: 3, ran: 5, zeros: [], poles: [] },
    rot: { lab: "F(s) = (1 + j)·s", f: function (s) { return mul(C(1, 1), s); }, dom: 3, ran: 6, zeros: [C(0, 0)], poles: [] },
    square: { lab: "F(s) = s²", f: function (s) { return mul(s, s); }, dom: 2, ran: 6, zeros: [C(0, 0)], poles: [] },
    inv: { lab: "F(s) = 1/s", f: function (s) { return div(C(1, 0), s); }, dom: 2, ran: 3, zeros: [], poles: [C(0, 0)] },
    tustin: { lab: "F(s) = (1 + s)/(1 − s)", f: function (s) { return div(add(C(1, 0), s), sub(C(1, 0), s)); }, dom: 3, ran: 3, zeros: [C(-1, 0)], poles: [C(1, 0)] },
    exp: { lab: "F(s) = e^s", f: function (s) { return cexp(s); }, dom: 2, ran: 6, zeros: [], poles: [] },
    second: { lab: "F(s) = 5/(s² + 2s + 5)", f: function (s) { return div(C(5, 0), add(add(mul(s, s), mul(C(2, 0), s)), C(5, 0))); }, dom: 3, ran: 2, zeros: [], poles: [C(-1, 2), C(-1, -2)] }
  };
  var ORDER = ["shift", "rot", "square", "inv", "tustin", "exp", "second", "custom"];

  var TXT = {
    th: {
      fn: "ฟังก์ชัน F(s)", custom: "พิมพ์เอง (ฟังก์ชันตรรกยะ)", sl: "ระนาบ s", wl: "ระนาบ w = F(s)", re: "ส่วนจริง σ ของ s₀", im: "ส่วนจินตภาพ ω ของ s₀",
      s0: "จุด s₀", w0: "ภาพ F(s₀)", dmag: "ขนาด |F′(s₀)| (ตัวคูณความยาว)", darg: "มุม ∠F′(s₀) (การหมุน)", area: "ตัวคูณพื้นที่ |F′|²", ang: "มุมระหว่างภาพของเส้นแนวนอนกับแนวดิ่ง",
      crit: "F′(s₀) ≈ 0 เป็นจุดวิกฤต: การรักษามุมใช้ไม่ได้ที่จุดนี้", keep: "เกือบ 90° เสมอ ตราบที่ F′(s₀) ≠ 0 นี่คือสมบัติ conformal",
      lhp: "ครึ่งซ้ายของระนาบ s (σ < 0)", jw: "เส้น s = jω และภาพของมัน", err: "อ่านฟังก์ชันไม่ได้", hint: "ลากจุดสีส้มในระนาบ s หรือใช้แถบเลื่อน",
      lines1: "เส้น σ = ค่าคงที่", lines2: "เส้น ω = ค่าคงที่"
    },
    en: {
      fn: "Function F(s)", custom: "Typed (rational function)", sl: "s-plane", wl: "w-plane, w = F(s)", re: "Real part σ of s₀", im: "Imaginary part ω of s₀",
      s0: "Point s₀", w0: "Image F(s₀)", dmag: "Magnitude |F′(s₀)| (length scale)", darg: "Angle ∠F′(s₀) (rotation)", area: "Area scale |F′|²", ang: "Angle between the images of the horizontal and vertical lines",
      crit: "F′(s₀) ≈ 0 is a critical point: angle preservation fails here", keep: "Always about 90° while F′(s₀) ≠ 0. This is the conformal property.",
      lhp: "Left half of the s-plane (σ < 0)", jw: "The line s = jω and its image", err: "Cannot read the function", hint: "Drag the orange point in the s-plane, or use the sliders",
      lines1: "Lines σ = const", lines2: "Lines ω = const"
    }
  };

  var css = ".cx-lab{margin:20px 0;border:1.5px solid var(--ink);border-radius:14px;background:var(--card);padding:14px;display:grid;gap:12px;min-width:0}" +
    ".cx-lab>*{min-width:0}.cx-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:.88rem}.cx-bar select,.cx-bar input[type=text]{font:inherit;padding:7px 8px;border:1px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink)}" +
    ".cx-bar input[type=text]{flex:1 1 220px;font-family:var(--mono)}.cx-panels{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}" +
    ".cx-fig{margin:0;border:1px solid var(--rule);border-radius:10px;padding:8px;background:var(--paper)}.cx-fig figcaption{font-size:.78rem;color:var(--ink-3);margin-bottom:2px}" +
    ".cx-svg{width:100%;height:auto;display:block;touch-action:none;user-select:none}.cx-sl{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));font-size:.86rem}" +
    ".cx-sl label{display:grid;gap:2px;color:var(--ink-2)}.cx-sl input{width:100%;accent-color:var(--accent)}.cx-rd{display:grid;gap:3px;font:500 .84rem var(--mono);border-top:1px solid var(--rule);padding-top:8px}" +
    ".cx-rd span{color:var(--ink-3);font-family:var(--sans)}.cx-msg{font-size:.84rem;color:var(--ink-2);margin:0}.cx-err{color:var(--bad,#b3261e);font-size:.84rem}.cx-lg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:.78rem;color:var(--ink-3)}" +
    ".cx-lg i{display:inline-block;width:18px;height:0;border-top:2.5px solid;vertical-align:middle;margin-right:5px}";

  function init(root) {
    var lang = (root.getAttribute("data-lang") || document.documentElement.lang || "th").slice(0, 2) === "en" ? "en" : "th";
    var T = TXT[lang], CS = window.CS;
    root.innerHTML = "";
    if (!document.getElementById("cx-lab-css")) { var st = document.createElement("style"); st.id = "cx-lab-css"; st.textContent = css; document.head.appendChild(st); }
    var cur = root.getAttribute("data-f") || "square";
    if (!PRESETS[cur] && cur !== "custom") cur = "square";
    if (cur === "custom" && !CS) cur = "square";
    var customSrc = root.getAttribute("data-custom") || "5/(s^2+2s+5)";
    var P = PRESETS[cur] || PRESETS.second, s0 = C(0.8, 0.6);

    function h(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
    function el(tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
    function fx(v, d) { var s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace("-", "−"); return s === "−0" || /^−0\.0+$/.test(s) ? s.slice(1) : s; }
    function cs(a, d) { d = d == null ? 2 : d; return fx(a.re, d) + (a.im < 0 ? " − j" : " + j") + fx(Math.abs(a.im), d); }

    var bar = h("div", "cx-bar", root), lbl = h("label", "", bar, T.fn + ": "), sel = h("select", "", lbl);
    ORDER.forEach(function (id) { if (id === "custom" && !CS) return; var o = h("option", "", sel); o.value = id; o.textContent = id === "custom" ? T.custom : PRESETS[id].lab; });
    sel.value = cur;
    var typed = h("input", "", bar); typed.type = "text"; typed.value = customSrc; typed.setAttribute("aria-label", T.custom); typed.style.display = cur === "custom" ? "" : "none";
    var err = h("div", "cx-err", root); err.hidden = true;
    var panels = h("div", "cx-panels", root);
    var f1 = h("figure", "cx-fig", panels), f2 = h("figure", "cx-fig", panels);
    h("figcaption", "", f1, T.sl); h("figcaption", "", f2, T.wl);
    var W = 400, M = 24, SZ = W - 2 * M;
    var sv1 = el("svg", { viewBox: "0 0 " + W + " " + W, "class": "cx-svg", role: "img", "aria-label": T.sl, tabindex: 0 }, f1);
    var sv2 = el("svg", { viewBox: "0 0 " + W + " " + W, "class": "cx-svg", role: "img", "aria-label": T.wl }, f2);
    var sl = h("div", "cx-sl", root);
    var lr = h("label", "", sl, T.re + ": <b></b>"), ir = h("input", "", lr); ir.type = "range";
    var li = h("label", "", sl, T.im + ": <b></b>"), ii = h("input", "", li); ii.type = "range";
    var rd = h("div", "cx-rd", root);
    var msg = h("p", "cx-msg", root, T.hint);
    var lg = h("div", "cx-lg", root, '<span><i style="border-color:var(--signal)"></i>' + T.lines1 + '</span><span><i style="border-color:var(--ink-2)"></i>' + T.lines2 + '</span><span><i style="border-color:var(--accent);border-top-width:4px"></i>' + T.jw + "</span>");

    function F(s) { return P.f(s); }
    function setPreset(id) {
      cur = id; err.hidden = true;
      if (id === "custom") {
        try {
          var tf = CS.parseTF(typed.value);
          if (tf.delay) throw new Error("delay");
          var roots = function (p) { return p.length > 1 ? CS.roots(p) : []; };
          P = { lab: "F(s)", dom: 3, ran: 3, zeros: roots(tf.N), poles: roots(tf.D), f: function (s) { return div(CS.peval(tf.N, s), CS.peval(tf.D, s)); } };
          var m = 0; P.poles.concat(P.zeros).forEach(function (r) { m = Math.max(m, Math.abs(r.re), Math.abs(r.im)); });
          P.dom = Math.max(2, Math.ceil(m + 1));
          var w1 = F(C(0.5, 0.5)), w2 = F(C(P.dom / 2, P.dom / 3)); P.ran = Math.max(1, Math.min(8, Math.ceil(Math.max(ab(w1), ab(w2)) * 2)));
        } catch (e) { err.textContent = T.err + ": " + e.message; err.hidden = false; return; }
      } else P = PRESETS[id];
      ir.min = ii.min = -P.dom; ir.max = ii.max = P.dom; ir.step = ii.step = 0.05;
      s0 = C(Math.max(-P.dom, Math.min(P.dom, s0.re)), Math.max(-P.dom, Math.min(P.dom, s0.im)));
      typed.style.display = id === "custom" ? "" : "none";
      draw();
    }

    function drawPanel(svg, D, isS) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cid = "cxc" + (isS ? "a" : "b") + Math.random().toString(36).slice(2, 6);
      var cp = el("clipPath", { id: cid }, svg); el("rect", { x: M, y: M, width: SZ, height: SZ }, cp);
      el("rect", { x: M, y: M, width: SZ, height: SZ, fill: "none", stroke: "var(--rule)" }, svg);
      var g = el("g", { "clip-path": "url(#" + cid + ")" }, svg);
      function X(x) { return M + (x + D) / (2 * D) * SZ; }
      function Y(y) { return M + (D - y) / (2 * D) * SZ; }
      if (isS) el("rect", { x: M, y: M, width: SZ / 2, height: SZ, fill: "var(--signal)", opacity: 0.07 }, g);
      el("line", { x1: X(-D), x2: X(D), y1: Y(0), y2: Y(0), stroke: "var(--ink-3)", "stroke-width": 1 }, g);
      el("line", { x1: X(0), x2: X(0), y1: Y(-D), y2: Y(D), stroke: "var(--ink-3)", "stroke-width": 1 }, g);
      return { g: g, X: X, Y: Y, svg: svg };
    }

    function curve(g, XY, pts, col, w) {
      var d = "", pen = false, lim = 1e3;
      pts.forEach(function (q) {
        if (!fin(q) || Math.abs(q.re) > lim || Math.abs(q.im) > lim) { pen = false; return; }
        var p = XY(q); d += (pen ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); pen = true;
      });
      if (d) el("path", { d: d, fill: "none", stroke: col, "stroke-width": w || 1.2, "stroke-linejoin": "round" }, g);
    }

    function draw() {
      var Dd = P.dom, Rr = P.ran, N = 220, k, j;
      var A = drawPanel(sv1, Dd, true), B = drawPanel(sv2, Rr, false);
      var XYa = function (q) { return [A.X(q.re), A.Y(q.im)]; }, XYb = function (q) { return [B.X(q.re), B.Y(q.im)]; };
      for (k = -Math.floor(Dd); k <= Math.floor(Dd); k++) {
        var vert = [], horz = [], vimg = [], himg = [];
        for (j = 0; j <= N; j++) {
          var u = -Dd + 2 * Dd * j / N;
          vert.push(C(k, u)); horz.push(C(u, k)); vimg.push(F(C(k, u))); himg.push(F(C(u, k)));
        }
        var jw = k === 0;
        curve(A.g, XYa, vert, jw ? "var(--accent)" : "var(--signal)", jw ? 2.6 : 1.1);
        curve(A.g, XYa, horz, "var(--ink-2)", 1.1);
        curve(B.g, XYb, vimg, jw ? "var(--accent)" : "var(--signal)", jw ? 2.8 : 1.1);
        curve(B.g, XYb, himg, "var(--ink-2)", 1.1);
      }
      function marks(g, XY, list, circle) {
        list.forEach(function (r) {
          var p = XY(r);
          if (circle) el("circle", { cx: p[0], cy: p[1], r: 5, fill: "var(--paper)", stroke: "var(--ink)", "stroke-width": 1.8 }, g);
          else { el("path", { d: "M" + (p[0] - 5) + " " + (p[1] - 5) + "L" + (p[0] + 5) + " " + (p[1] + 5) + "M" + (p[0] - 5) + " " + (p[1] + 5) + "L" + (p[0] + 5) + " " + (p[1] - 5), stroke: "var(--ink)", "stroke-width": 2 }, g); }
        });
      }
      marks(A.g, XYa, P.zeros, true); marks(A.g, XYa, P.poles, false);
      // the small orthogonal cross at s0 and its image
      var dl = 0.3 * Dd / 2, hz = [], vt = [], hzi = [], vti = [];
      for (j = -10; j <= 10; j++) {
        var q = dl * j / 10;
        hz.push(add(s0, C(q, 0))); vt.push(add(s0, C(0, q)));
        hzi.push(F(add(s0, C(q, 0)))); vti.push(F(add(s0, C(0, q))));
      }
      curve(A.g, XYa, hz, "var(--ok)", 3); curve(A.g, XYa, vt, "var(--ok)", 3);
      curve(B.g, XYb, hzi, "var(--ok)", 3); curve(B.g, XYb, vti, "var(--ok)", 3);
      var p0 = XYa(s0); el("circle", { cx: p0[0], cy: p0[1], r: 7, fill: "var(--accent)", stroke: "var(--paper)", "stroke-width": 2, style: "cursor:grab" }, A.svg);
      var w0 = F(s0);
      if (fin(w0)) { var pw = XYb(w0); el("circle", { cx: pw[0], cy: pw[1], r: 6, fill: "var(--accent)", stroke: "var(--paper)", "stroke-width": 2 }, B.svg); }
      [[A, Dd], [B, Rr]].forEach(function (z) {
        var t1 = el("text", { x: M + SZ - 4, y: z[0].Y(0) - 5, "text-anchor": "end", "font-size": 11, fill: "var(--ink-3)", "font-family": "var(--mono)" }, z[0].svg); t1.textContent = isNaN(z[1]) ? "" : "Re";
        var t2 = el("text", { x: z[0].X(0) + 5, y: M + 11, "font-size": 11, fill: "var(--ink-3)", "font-family": "var(--mono)" }, z[0].svg); t2.textContent = "Im";
        var t3 = el("text", { x: M + 3, y: M + SZ - 4, "font-size": 10, fill: "var(--ink-3)", "font-family": "var(--mono)" }, z[0].svg); t3.textContent = "±" + z[1];
      });
      readouts(w0);
      ir.value = s0.re; ii.value = s0.im;
      lr.querySelector("b").textContent = fx(s0.re, 2); li.querySelector("b").textContent = fx(s0.im, 2);
    }

    function readouts(w0) {
      var e = 1e-5, d = F(C(s0.re + 1e-6, s0.im)), d2 = F(C(s0.re - 1e-6, s0.im)), dp = C((d.re - d2.re) / 2e-6, (d.im - d2.im) / 2e-6);
      var mg = ab(dp), ag = Math.atan2(dp.im, dp.re) * 180 / PI, rows = [];
      var a = sub(F(C(s0.re + e, s0.im)), w0), b = sub(F(C(s0.re, s0.im + e)), w0);
      var ang = Math.abs(Math.atan2(b.im, b.re) - Math.atan2(a.im, a.re)) * 180 / PI; if (ang > 180) ang = 360 - ang;
      rows.push("<div><span>" + T.s0 + "</span> = " + cs(s0) + "</div>");
      rows.push("<div><span>" + T.w0 + "</span> = " + (fin(w0) ? cs(w0, 3) : "∞") + "</div>");
      if (fin(dp) && mg < 1e6) {
        rows.push("<div><span>" + T.dmag + "</span> = " + fx(mg, 3) + "</div>");
        rows.push("<div><span>" + T.darg + "</span> = " + fx(ag, 1) + "°</div>");
        rows.push("<div><span>" + T.area + "</span> = " + fx(mg * mg, 3) + "</div>");
        if (mg > 1e-3) { rows.push("<div><span>" + T.ang + "</span> = " + fx(ang, 2) + "°</div>"); msg.textContent = T.keep; }
        else msg.textContent = T.crit;
      } else { rows.push("<div><span>F′(s₀)</span> = ∞</div>"); msg.textContent = T.hint; }
      rd.innerHTML = rows.join("");
    }

    function fromPointer(ev) {
      var r = sv1.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * W;
      var D = P.dom, re = (x - M) / SZ * 2 * D - D, im = D - (y - M) / SZ * 2 * D;
      s0 = C(Math.max(-D, Math.min(D, Math.round(re * 20) / 20)), Math.max(-D, Math.min(D, Math.round(im * 20) / 20)));
      draw();
    }
    var drag = false;
    sv1.addEventListener("pointerdown", function (ev) { drag = true; try { sv1.setPointerCapture(ev.pointerId); } catch (e) { } fromPointer(ev); });
    sv1.addEventListener("pointermove", function (ev) { if (drag) fromPointer(ev); });
    sv1.addEventListener("pointerup", function () { drag = false; });
    sv1.addEventListener("pointercancel", function () { drag = false; });
    sv1.addEventListener("keydown", function (ev) {
      var st = 0.05, D = P.dom, m = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[ev.key];
      if (!m) return; ev.preventDefault();
      s0 = C(Math.max(-D, Math.min(D, s0.re + m[0])), Math.max(-D, Math.min(D, s0.im + m[1]))); draw();
    });
    ir.addEventListener("input", function () { s0 = C(parseFloat(ir.value), s0.im); draw(); });
    ii.addEventListener("input", function () { s0 = C(s0.re, parseFloat(ii.value)); draw(); });
    sel.addEventListener("change", function () { setPreset(sel.value); });
    typed.addEventListener("change", function () { setPreset("custom"); });
    setPreset(cur);
    root.classList.add("cx-ready");
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".cx-lab"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
