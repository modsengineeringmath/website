/* Integral calculus page: formula filter, practice mode, step-by-step reveal, Riemann-sum visualiser. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var art = $("intArticle");
  if (!art) return;

  // ------------------------------------------------------------ formula filter
  (function () {
    var inp = $("tfFilter"); if (!inp) return;
    var secs = Array.prototype.slice.call(art.querySelectorAll(".tsec"));
    var hay = new Map();
    secs.forEach(function (sec) {
      sec.querySelectorAll(".tf").forEach(function (card) {
        var n = card.querySelector(".tf-n"), t = (card.getAttribute("data-k") || "") + " " + (card.id || "") + " " + (n ? n.textContent : "");
        card.querySelectorAll("annotation").forEach(function (a) { t += " " + a.textContent.replace(/\\[a-z]+/gi, function (w) { return " " + w.slice(1) + " "; }); });
        hay.set(card, t.toLowerCase());
      });
    });
    function run() {
      var terms = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) {
        art.classList.remove("is-filtering");
        secs.forEach(function (s) { s.hidden = false; s.classList.remove("tsec-all"); });
        art.querySelectorAll(".tf-off").forEach(function (c) { c.classList.remove("tf-off"); });
        $("tfCount").textContent = "";
        return;
      }
      art.classList.add("is-filtering");
      var total = 0;
      secs.forEach(function (sec) {
        var h2 = sec.querySelector("h2"), title = h2 ? h2.textContent.toLowerCase() : "";
        var all = terms.every(function (t) { return title.indexOf(t) >= 0; }), n = 0;
        sec.querySelectorAll(".tf").forEach(function (card) {
          var ok = all || terms.every(function (t) { return hay.get(card).indexOf(t) >= 0; });
          card.classList.toggle("tf-off", !ok);
          if (ok) n++;
        });
        sec.classList.toggle("tsec-all", all);
        sec.hidden = !all && n === 0;
        total += n;
      });
      $("tfCount").textContent = total ? "พบ " + total + " สูตร" : "ไม่พบสูตรที่ตรงกัน ลองคำอื่น";
    }
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; run(); } });
  })();

  // ------------------------------------------------------------ worked examples: step mode + practice mode
  var examples = Array.prototype.slice.call(art.querySelectorAll(".wx"));
  examples.forEach(function (wx) {
    var steps = Array.prototype.slice.call(wx.querySelectorAll(".steps > li"));
    var bar = document.createElement("div");
    bar.className = "wx-bar";
    bar.innerHTML = '<button type="button" class="wx-btn" data-act="step">▶ ดูทีละขั้น</button><button type="button" class="wx-btn" data-act="show" hidden>ดูวิธีทำ</button>';
    wx.querySelector(".wx-head").appendChild(bar);
    var stepBtn = bar.querySelector('[data-act="step"]'), showBtn = bar.querySelector('[data-act="show"]');
    var shown = -1; // -1 = all visible
    function paint() {
      steps.forEach(function (li, i) { li.classList.toggle("st-hide", shown >= 0 && i > shown); });
      var done = shown < 0 || shown >= steps.length - 1;
      wx.classList.toggle("st-pending", !done);
      if (shown < 0) stepBtn.textContent = "▶ ดูทีละขั้น";
      else if (!done) stepBtn.textContent = "ขั้นถัดไป (" + (shown + 2) + "/" + steps.length + ") ▶";
      else stepBtn.textContent = "↺ เริ่มใหม่";
    }
    stepBtn.addEventListener("click", function () {
      wx.classList.add("open");
      if (shown < 0 || shown >= steps.length - 1) shown = 0; else shown++;
      paint();
      if (shown > 0) steps[shown].scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    showBtn.addEventListener("click", function () { wx.classList.toggle("open"); showBtn.textContent = wx.classList.contains("open") ? "ซ่อนวิธีทำ" : "ดูวิธีทำ"; });
    wx._reset = function (practice) { shown = -1; paint(); showBtn.hidden = !practice; showBtn.textContent = "ดูวิธีทำ"; wx.classList.remove("open"); };
  });
  var pb = $("practiceBtn");
  if (pb) pb.addEventListener("click", function () {
    var on = !art.classList.contains("practice");
    art.classList.toggle("practice", on);
    pb.setAttribute("aria-pressed", on ? "true" : "false");
    pb.textContent = on ? "ออกจากโหมดฝึกทำ" : "โหมดฝึกทำ: ซ่อนวิธีทำ";
    examples.forEach(function (wx) { wx._reset(on); });
  });

  // ------------------------------------------------------------ Riemann sums
  var FUN = [
    { k: "x2", label: "x²", f: function (x) { return x * x; }, F: function (x) { return x * x * x / 3; }, a: 0, b: 1 },
    { k: "x3", label: "x³", f: function (x) { return x * x * x; }, F: function (x) { return Math.pow(x, 4) / 4; }, a: 0, b: 2 },
    { k: "lin", label: "2x + 1", f: function (x) { return 2 * x + 1; }, F: function (x) { return x * x + x; }, a: 1, b: 3 },
    { k: "par", label: "4 − x²", f: function (x) { return 4 - x * x; }, F: function (x) { return 4 * x - x * x * x / 3; }, a: 0, b: 3 },
    { k: "sqrt", label: "√x", f: Math.sqrt, F: function (x) { return (2 / 3) * Math.pow(x, 1.5); }, a: 0, b: 4, min: 0 },
    { k: "sin", label: "sin x", f: Math.sin, F: function (x) { return -Math.cos(x); }, a: 0, b: Math.PI },
    { k: "exp", label: "eˣ", f: Math.exp, F: Math.exp, a: 0, b: 1 },
    { k: "inv", label: "1/x", f: function (x) { return 1 / x; }, F: Math.log, a: 1, b: 3, min: 1e-9, open: true }
  ];
  var plot = $("rsPlot");
  if (!plot) return;
  var st = { fn: FUN[0], a: 0, b: 1, n: 8, m: "right" };
  var sel = $("rsF");
  sel.innerHTML = FUN.map(function (f, i) { return '<option value="' + i + '">f(x) = ' + f.label + "</option>"; }).join("");
  function parseNum(s) {
    s = String(s).trim().toLowerCase().replace(/π|pi/g, "p").replace(/−/g, "-");
    var m = /^(-?\d*\.?\d*)\s*\*?\s*(p)?(?:\s*\/\s*(\d+\.?\d*))?$/.exec(s);
    if (!m || (!m[1] && !m[2]) || m[1] === "-" && !m[2]) return NaN;
    var v = m[1] === "" ? 1 : m[1] === "-" ? -1 : parseFloat(m[1]);
    if (m[2]) v *= Math.PI;
    if (m[3]) v /= parseFloat(m[3]);
    return v;
  }
  function fmt(v) { if (!isFinite(v)) return "—"; var s = Math.abs(v) >= 1000 ? v.toFixed(2) : v.toFixed(6); return s.replace(/^-0\.0+$/, "0.000000"); }
  function sum() {
    var f = st.fn.f, a = st.a, b = st.b, n = st.n, dx = (b - a) / n, s = 0;
    for (var k = 1; k <= n; k++) {
      var xl = a + (k - 1) * dx, xr = a + k * dx;
      if (st.m === "left") s += f(xl) * dx;
      else if (st.m === "right") s += f(xr) * dx;
      else if (st.m === "mid") s += f((xl + xr) / 2) * dx;
      else s += (f(xl) + f(xr)) / 2 * dx;
    }
    return s;
  }
  function draw() {
    var W = Math.max(280, Math.round(plot.clientWidth)), H = W < 520 ? 230 : 280;
    var M = { l: 40, r: 12, t: 12, b: 28 };
    var f = st.fn.f, a = st.a, b = st.b, n = st.n, dx = (b - a) / n;
    var pad = (b - a) * 0.08, x0 = a - pad, x1 = b + pad;
    if (st.fn.min != null) x0 = Math.max(x0, st.fn.open ? a : st.fn.min);
    var ys = [0];
    for (var i = 0; i <= 200; i++) { var xx = x0 + (x1 - x0) * i / 200; var yy = f(xx); if (isFinite(yy)) ys.push(yy); }
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var yr = (y1 - y0) || 1; y0 -= yr * 0.08; y1 += yr * 0.1;
    var X = function (x) { return M.l + (x - x0) / (x1 - x0) * (W - M.l - M.r); };
    var Y = function (y) { return M.t + (y1 - y) / (y1 - y0) * (H - M.t - M.b); };
    var o = ['<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="ผลบวกรีมันน์ของ ' + st.fn.label + '">'];
    // y ticks
    var step = niceStep((y1 - y0) / 4);
    for (var t = Math.ceil(y0 / step) * step; t <= y1; t += step) {
      o.push('<line class="grid" x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '"/><text class="tick" x="' + (M.l - 6) + '" y="' + (Y(t) + 4).toFixed(1) + '" text-anchor="end">' + +t.toFixed(3) + "</text>");
    }
    o.push('<line class="axis" x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '"/>');
    // rectangles / trapezoids
    var thin = n > 60;
    for (var k = 1; k <= n; k++) {
      var xl = a + (k - 1) * dx, xr = a + k * dx, h;
      if (st.m === "trap") {
        var fl = f(xl), fr = f(xr);
        o.push('<path class="rs-r ' + ((fl + fr) / 2 < 0 ? "neg" : "") + (thin ? " thin" : "") + '" d="M' + X(xl).toFixed(1) + " " + Y(0).toFixed(1) + "L" + X(xl).toFixed(1) + " " + Y(fl).toFixed(1) + "L" + X(xr).toFixed(1) + " " + Y(fr).toFixed(1) + "L" + X(xr).toFixed(1) + " " + Y(0).toFixed(1) + 'Z"/>');
        continue;
      }
      var xs = st.m === "left" ? xl : st.m === "right" ? xr : (xl + xr) / 2;
      h = f(xs);
      var top = Math.min(Y(h), Y(0)), hh = Math.abs(Y(h) - Y(0));
      o.push('<rect class="rs-r ' + (h < 0 ? "neg" : "") + (thin ? " thin" : "") + '" x="' + X(xl).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + Math.max(0.5, X(xr) - X(xl)).toFixed(1) + '" height="' + hh.toFixed(1) + '"/>');
      if (n <= 40) o.push('<circle class="rs-pt" cx="' + X(xs).toFixed(1) + '" cy="' + Y(h).toFixed(1) + '" r="3"/>');
    }
    // curve
    var d = "", pen = false;
    for (var j = 0; j <= 300; j++) {
      var cx = x0 + (x1 - x0) * j / 300, cy = f(cx);
      if (!isFinite(cy)) { pen = false; continue; }
      d += (pen ? "L" : "M") + X(cx).toFixed(1) + " " + Y(cy).toFixed(1); pen = true;
    }
    o.push('<path class="ser s-cur" d="' + d + '"/>');
    [a, b].forEach(function (v, i) {
      o.push('<line class="h-guide" x1="' + X(v).toFixed(1) + '" x2="' + X(v).toFixed(1) + '" y1="' + M.t + '" y2="' + (H - M.b) + '"/><text class="tick" x="' + X(v).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + (i ? "b = " : "a = ") + +v.toFixed(3) + "</text>");
    });
    o.push("</svg>");
    plot.innerHTML = o.join("");
  }
  function niceStep(r) { var p = Math.pow(10, Math.floor(Math.log10(r || 1))), m = r / p; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p; }
  function update() {
    var a = parseNum($("rsA").value), b = parseNum($("rsB").value), ok = isFinite(a) && isFinite(b) && b > a;
    var min = st.fn.min;
    if (ok && min != null && a < (st.fn.open ? min : 0)) ok = false;
    $("rsA").classList.toggle("bad", !ok); $("rsB").classList.toggle("bad", !ok);
    if (!ok) { $("rsStats").innerHTML = '<div class="stat"><span class="stat-l">ตรวจขอบเขต</span><span class="stat-v">ต้องมี a &lt; b' + (min != null ? " และ a " + (st.fn.open ? "&gt; 0" : "≥ 0") : "") + "</span></div>"; return; }
    st.a = a; st.b = b;
    var S = sum(), I = st.fn.F(b) - st.fn.F(a), err = S - I;
    var names = { left: "จุดซ้าย (left)", right: "จุดขวา (right)", mid: "จุดกึ่งกลาง (midpoint)", trap: "สี่เหลี่ยมคางหมู (trapezoid)" };
    $("rsStats").innerHTML =
      '<div class="stat"><span class="stat-l">Δx = (b − a)/n</span><span class="stat-v">' + fmt((b - a) / st.n) + "</span></div>" +
      '<div class="stat"><span class="stat-l">ผลรวม ' + names[st.m] + '</span><span class="stat-v">' + fmt(S) + "</span></div>" +
      '<div class="stat"><span class="stat-l">ค่าจริง F(b) − F(a)</span><span class="stat-v">' + fmt(I) + "</span></div>" +
      '<div class="stat"><span class="stat-l">ความคลาดเคลื่อน</span><span class="stat-v">' + fmt(err) + '</span><span class="stat-n">' + (I !== 0 ? (Math.abs(err / I) * 100).toFixed(3) + "% ของค่าจริง" : "") + "</span></div>";
    draw();
  }
  sel.addEventListener("change", function () {
    st.fn = FUN[+sel.value];
    $("rsA").value = +st.fn.a.toFixed(6); $("rsB").value = st.fn.k === "sin" ? "π" : +st.fn.b.toFixed(6);
    update();
  });
  ["rsA", "rsB"].forEach(function (id) { $(id).addEventListener("input", update); });
  $("rsN").addEventListener("input", function () { st.n = +this.value; $("rsNOut").textContent = st.n; update(); });
  $("rsM").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (!b) return;
    st.m = b.getAttribute("data-v");
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    update();
  });
  update();
  if (window.ResizeObserver) { var lw = plot.clientWidth; new ResizeObserver(function () { if (Math.abs(plot.clientWidth - lw) > 2) { lw = plot.clientWidth; draw(); } }).observe(plot); }
})();
