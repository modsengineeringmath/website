/* Feedback lab (course unit 1): open loop vs closed loop for a first-order plant, with plant-gain error and an output disturbance.
   Markup:  <div class="bd-lab" data-lang="th"></div>      (data-lang optional; falls back to <html lang>)
   Plant G(s) = Kp/(tau s + 1), Kp = Kp0 (1 + delta), Kp0 = 2, tau = 1 s, sensor H = 1.
   Open loop  : feed-forward gain Cff = 1/Kp0, so the nominal output is exactly 1.
   Closed loop: proportional controller Kc.  With K = Kc*Kp:
       reference step  y_r(t) = K/(1+K) (1 - exp(-(1+K) t / tau))
       disturbance step (output side) y_d(t) = 1/(1+K) + K/(1+K) exp(-(1+K) t / tau)
   No dependencies. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var KP0 = 2, TAU = 1, TEND = 8, TD = 4;

  var TXT = {
    th: {
      kc: "เกนตัวควบคุม Kc", dl: "ความคลาดเคลื่อนของเกนพลานต์ δ", dd: "ขนาดการรบกวน d (ที่เอาต์พุต เกิดที่ t = 4 s)",
      open: "วงเปิด (ป้อนไปข้างหน้า)", closed: "วงปิด (ป้อนกลับ)", ref: "ค่าอ้างอิง r = 1",
      cap: "ผลตอบสนอง y(t) เมื่อป้อนขั้นบันได r = 1 ที่ t = 0 และมีการรบกวน d ที่ t = 4 s",
      th0: "", rows: ["ค่าสุดท้ายก่อนการรบกวน", "ค่าสุดท้ายหลังการรบกวน", "คลาดเคลื่อนจาก 1 ก่อนการรบกวน", "ค่าคงตัวเวลาของวงปิด"],
      cols: ["", "วงเปิด", "วงปิด"], k: "K = Kc·Kp (เกนวง)", reset: "ค่าเริ่มต้น",
      note: "สังเกต: ขยับ δ แล้วดูวงเปิดคลาดเคลื่อนเท่าตัว ส่วนวงปิดคลาดเคลื่อนน้อยลงเมื่อ Kc มาก แต่ตัวควบคุมแบบสัดส่วนล้วนจะเหลือค่าคลาดเคลื่อนคงที่ (offset) แม้ไม่มีการรบกวน",
      sum: "ผลรวม", plant: "พลานต์", ctrl: "ตัวควบคุม", sens: "เซนเซอร์", dist: "การรบกวน", out: "เอาต์พุต", t: "t (s)"
    },
    en: {
      kc: "Controller gain Kc", dl: "Plant gain error δ", dd: "Disturbance size d (at the output, applied at t = 4 s)",
      open: "Open loop (feed-forward)", closed: "Closed loop (feedback)", ref: "Reference r = 1",
      cap: "Response y(t) to a unit step r = 1 at t = 0, with a disturbance d applied at t = 4 s",
      th0: "", rows: ["Final value before the disturbance", "Final value after the disturbance", "Error from 1 before the disturbance", "Closed-loop time constant"],
      cols: ["", "Open loop", "Closed loop"], k: "K = Kc·Kp (loop gain)", reset: "Reset",
      note: "Watch: move δ and the open loop is off by the same fraction. The closed loop is off by less when Kc is large, but a proportional-only controller always leaves a constant offset, even with no disturbance.",
      sum: "Sum", plant: "Plant", ctrl: "Controller", sens: "Sensor", dist: "Disturbance", out: "Output", t: "t (s)"
    }
  };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, parent, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function f(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace("-", "−"); }

  var css = ".bd-lab{margin:20px 0;border:1.5px solid var(--ink);border-radius:14px;background:var(--card);padding:14px;display:grid;gap:12px;min-width:0}" +
    ".bd-lab>*{min-width:0}.bd-ctl{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}" +
    ".bd-f{display:grid;gap:2px;font-size:.88rem}.bd-f label{color:var(--ink-2)}.bd-f input[type=range]{width:100%;accent-color:var(--accent)}" +
    ".bd-f b{font:600 .9rem var(--mono);color:var(--ink)}.bd-svg{width:100%;height:auto;display:block}" +
    ".bd-fig{margin:0;border:1px solid var(--rule);border-radius:10px;padding:8px;background:var(--paper)}.bd-fig figcaption{font-size:.78rem;color:var(--ink-3);margin-bottom:2px}" +
    ".bd-tab{width:100%;border-collapse:collapse;font-size:.86rem}.bd-tab th,.bd-tab td{border-bottom:1px solid var(--rule);padding:5px 6px;text-align:right}" +
    ".bd-tab th:first-child,.bd-tab td:first-child{text-align:left}.bd-tab td{font-family:var(--mono)}" +
    ".bd-note{font-size:.84rem;color:var(--ink-2);margin:0}.bd-btn{justify-self:start;font:600 .8rem var(--sans);padding:6px 12px;border-radius:999px;border:1px solid var(--rule);background:var(--paper);color:var(--signal);cursor:pointer}";

  function init(root) {
    var lang = (root.getAttribute("data-lang") || document.documentElement.lang || "th").slice(0, 2) === "en" ? "en" : "th";
    var T = TXT[lang];
    root.innerHTML = "";
    if (!document.getElementById("bd-lab-css")) { var st = h("style", "", document.head, css); st.id = "bd-lab-css"; }
    var S = { kc: 4, dl: 0, d: 0.3 };

    var diag = h("figure", "bd-fig", root), dsvg = el("svg", { viewBox: "0 0 640 190", "class": "bd-svg", role: "img" }, diag);
    var ctl = h("div", "bd-ctl", root);
    function slider(id, label, min, max, step, val) {
      var w = h("div", "bd-f", ctl), lab = h("label", "", w, label + ": <b></b>"), inp = h("input", "", w);
      inp.type = "range"; inp.min = min; inp.max = max; inp.step = step; inp.value = val; inp.id = "bd-" + id + "-" + Math.random().toString(36).slice(2, 7);
      lab.htmlFor = inp.id;
      return { inp: inp, out: lab.querySelector("b") };
    }
    var sKc = slider("kc", T.kc, 0.5, 40, 0.5, S.kc), sDl = slider("dl", T.dl, -50, 50, 5, S.dl), sD = slider("d", T.dd, 0, 0.6, 0.05, S.d);
    var fig = h("figure", "bd-fig", root); h("figcaption", "", fig, T.cap);
    var psvg = el("svg", { viewBox: "0 0 640 300", "class": "bd-svg", role: "img", "aria-label": T.cap }, fig);
    var tab = h("table", "bd-tab", root);
    h("p", "bd-note", root, T.note);
    var rst = h("button", "bd-btn", root, T.reset); rst.type = "button";

    function resp(t) {
      var Kp = KP0 * (1 + S.dl / 100), K = S.kc * Kp, a = 1 + K, d = S.d;
      var oy = (Kp / KP0) * (1 - Math.exp(-t / TAU)) + (t >= TD ? d : 0);
      var cy = K / a * (1 - Math.exp(-a * t / TAU)) + (t >= TD ? d * (1 / a + K / a * Math.exp(-a * (t - TD) / TAU)) : 0);
      return { o: oy, c: cy };
    }

    function drawDiagram() {
      while (dsvg.firstChild) dsvg.removeChild(dsvg.firstChild);
      var Kp = KP0 * (1 + S.dl / 100), K = S.kc * Kp;
      var ink = "var(--ink)", mute = "var(--ink-3)";
      function box(x, y, w, hh, l1, l2) {
        el("rect", { x: x, y: y, width: w, height: hh, rx: 8, fill: "var(--paper)", stroke: ink, "stroke-width": 1.6 }, dsvg);
        var a = el("text", { x: x + w / 2, y: y + hh / 2 - (l2 ? 3 : -5), "text-anchor": "middle", fill: ink, "font-size": 15, "font-family": "var(--mono)" }, dsvg); a.textContent = l1;
        if (l2) { var b = el("text", { x: x + w / 2, y: y + hh / 2 + 15, "text-anchor": "middle", fill: mute, "font-size": 12, "font-family": "var(--mono)" }, dsvg); b.textContent = l2; }
      }
      function line(x1, y1, x2, y2, arrow) {
        el("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: ink, "stroke-width": 1.6 }, dsvg);
        if (arrow) { var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
          el("path", { d: "M" + x2 + " " + y2 + " L" + (x2 - 9 * ux - 5 * uy) + " " + (y2 - 9 * uy + 5 * ux) + " L" + (x2 - 9 * ux + 5 * uy) + " " + (y2 - 9 * uy - 5 * ux) + " Z", fill: ink }, dsvg); }
      }
      function txt(x, y, s, anchor, col, size) { var t = el("text", { x: x, y: y, "text-anchor": anchor || "middle", fill: col || ink, "font-size": size || 14, "font-family": "var(--mono)" }, dsvg); t.textContent = s; }
      function sum(cx, cy) { el("circle", { cx: cx, cy: cy, r: 13, fill: "var(--paper)", stroke: ink, "stroke-width": 1.6 }, dsvg); }
      txt(18, 62, "R", "middle"); line(30, 70, 77, 70, true);
      sum(90, 70); txt(80, 56, "+", "middle", mute, 12); txt(80, 96, "−", "middle", mute, 14);
      line(103, 70, 150, 70, true); txt(126, 60, "E", "middle");
      box(150, 44, 100, 52, "Kc = " + f(S.kc, 1), T.ctrl);
      line(250, 70, 300, 70, true); txt(275, 60, "U", "middle");
      box(300, 44, 140, 52, "Kp/(τs+1)", "Kp=" + f(Kp, 2) + ", τ=1");
      line(440, 70, 487, 70, false); sum(500, 70); txt(490, 56, "+", "middle", mute, 12); txt(512, 56, "+", "middle", mute, 12);
      line(513, 70, 590, 70, true); txt(600, 74, "Y", "start"); txt(500, 30, "D = " + f(S.d, 2), "middle", "var(--accent)"); line(500, 36, 500, 56, true);
      line(555, 70, 555, 150, false); line(555, 150, 90, 150, false); line(90, 150, 90, 83, true);
      box(280, 126, 100, 48, "H = 1", T.sens);
      txt(320, 20, "K = " + f(K, 2), "middle", mute, 12);
    }

    function drawPlot() {
      while (psvg.firstChild) psvg.removeChild(psvg.firstChild);
      var W = 640, H = 300, L = 46, R = 12, Tp = 14, B = 36, pw = W - L - R, ph = H - Tp - B;
      var ymin = 0, ymax = 2.2, N = 240, i;
      function X(t) { return L + pw * t / TEND; }
      function Y(y) { return Tp + ph * (1 - (Math.min(Math.max(y, ymin), ymax) - ymin) / (ymax - ymin)); }
      for (i = 0; i <= 11; i++) { var yv = i * 0.2; el("line", { x1: L, x2: W - R, y1: Y(yv), y2: Y(yv), stroke: "var(--rule)", "stroke-width": 1 }, psvg); var tl = el("text", { x: L - 6, y: Y(yv) + 4, "text-anchor": "end", "font-size": 11, fill: "var(--ink-3)", "font-family": "var(--mono)" }, psvg); tl.textContent = f(yv, 1); }
      for (i = 0; i <= 8; i++) { var xl = el("text", { x: X(i), y: H - 16, "text-anchor": "middle", "font-size": 11, fill: "var(--ink-3)", "font-family": "var(--mono)" }, psvg); xl.textContent = i; }
      var xt = el("text", { x: W - R, y: H - 2, "text-anchor": "end", "font-size": 11, fill: "var(--ink-3)", "font-family": "var(--mono)" }, psvg); xt.textContent = T.t;
      el("line", { x1: X(TD), x2: X(TD), y1: Tp, y2: Tp + ph, stroke: "var(--ink-3)", "stroke-dasharray": "4 4" }, psvg);
      el("line", { x1: L, x2: W - R, y1: Y(1), y2: Y(1), stroke: "var(--ok)", "stroke-width": 1.4, "stroke-dasharray": "2 4" }, psvg);
      function path(key, col, dash) {
        var d = "";
        for (var j = 0; j <= N; j++) { var t = TEND * j / N, tt = (j > 0 && Math.abs(t - TD) < TEND / N / 2) ? TD - 1e-9 : t; d += (j ? "L" : "M") + X(t).toFixed(1) + " " + Y(resp(tt)[key]).toFixed(1); }
        // exact jump of the open-loop output at t = TD
        el("path", { d: d, fill: "none", stroke: col, "stroke-width": 2.4, "stroke-dasharray": dash || "none", "stroke-linejoin": "round" }, psvg);
      }
      path("o", "var(--ink-3)", "7 5"); path("c", "var(--accent)");
      var lg = [[T.open, "var(--ink-3)", "7 5"], [T.closed, "var(--accent)", ""], [T.ref, "var(--ok)", "2 4"]];
      lg.forEach(function (it, k) {
        var y0 = Tp + 14 + k * 16;
        el("line", { x1: L + 10, x2: L + 36, y1: y0 - 4, y2: y0 - 4, stroke: it[1], "stroke-width": 2.4, "stroke-dasharray": it[2] || "none" }, psvg);
        var tx = el("text", { x: L + 42, y: y0, "font-size": 12, fill: "var(--ink)" }, psvg); tx.textContent = it[0];
      });
    }

    function drawTable() {
      var Kp = KP0 * (1 + S.dl / 100), K = S.kc * Kp, a = 1 + K;
      var o1 = Kp / KP0, c1 = K / a, o2 = o1 + S.d, c2 = c1 + S.d / a;
      var rows = [
        [T.rows[0], f(o1, 3), f(c1, 3)],
        [T.rows[1], f(o2, 3), f(c2, 3)],
        [T.rows[2], f(Math.abs(o1 - 1) * 100, 1) + " %", f(Math.abs(c1 - 1) * 100, 1) + " %"],
        [T.rows[3], "—", f(TAU / a, 3) + " s"]
      ];
      var hd = "<tr><th>" + T.k + " = " + f(K, 2) + "</th><th>" + T.cols[1] + "</th><th>" + T.cols[2] + "</th></tr>";
      tab.innerHTML = hd + rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("");
    }

    function update() {
      S.kc = parseFloat(sKc.inp.value); S.dl = parseFloat(sDl.inp.value); S.d = parseFloat(sD.inp.value);
      sKc.out.textContent = f(S.kc, 1); sDl.out.textContent = (S.dl > 0 ? "+" : "") + f(S.dl, 0) + " %"; sD.out.textContent = f(S.d, 2);
      drawDiagram(); drawPlot(); drawTable();
    }
    [sKc, sDl, sD].forEach(function (s) { s.inp.addEventListener("input", update); });
    rst.addEventListener("click", function () { sKc.inp.value = 4; sDl.inp.value = 0; sD.inp.value = 0.3; update(); });
    update();
    root.classList.add("bd-ready");
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".bd-lab"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
