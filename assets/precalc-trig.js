/* Precalculus labs — trigonometry (needs assets/precalc.js first).
     .pc-uc    unit circle: drag or slide θ, exact values, reference angle, sine/cosine waves      data-deg data-snap
     .pc-sin   sinusoid y = A·f(B(x − C)) + D (sin, cos, tan)                                     data-fn data-A data-B data-C data-D
     .pc-tri   triangle solver SSS SAS ASA AAS SSA (ambiguous case drawn)                         data-case data-a data-b data-c data-anga data-angb
     .pc-trig  angle → six values · value → every angle (links into the 0°–360° table)            data-mode=angle|value data-ang data-fn data-val
     .pc-ttab  toolbar for the static 0°–360° table (quadrant filter, step, jump)                 data-table="<table id>"  */
(function (root) {
  "use strict";
  var PC = root.PC;
  if (!PC || !PC.widget) return;
  var L = PC.L, fmt = PC.fmt, nice = PC.nice, tex = PC.tex, dl = PC.dl, C = PC.C, esc = PC.esc;
  var D2R = Math.PI / 180;

  // ---------------------------------------------------------------- exact values
  var REF = { // reference angle → [sin, cos, tan, csc, sec, cot] (null = undefined)
    0: ["0", "1", "0", null, "1", null],
    15: ["\\tfrac{\\sqrt6-\\sqrt2}{4}", "\\tfrac{\\sqrt6+\\sqrt2}{4}", "2-\\sqrt3", "\\sqrt6+\\sqrt2", "\\sqrt6-\\sqrt2", "2+\\sqrt3"],
    30: ["\\tfrac12", "\\tfrac{\\sqrt3}{2}", "\\tfrac{\\sqrt3}{3}", "2", "\\tfrac{2\\sqrt3}{3}", "\\sqrt3"],
    45: ["\\tfrac{\\sqrt2}{2}", "\\tfrac{\\sqrt2}{2}", "1", "\\sqrt2", "\\sqrt2", "1"],
    60: ["\\tfrac{\\sqrt3}{2}", "\\tfrac12", "\\sqrt3", "\\tfrac{2\\sqrt3}{3}", "2", "\\tfrac{\\sqrt3}{3}"],
    75: ["\\tfrac{\\sqrt6+\\sqrt2}{4}", "\\tfrac{\\sqrt6-\\sqrt2}{4}", "2+\\sqrt3", "\\sqrt6-\\sqrt2", "\\sqrt6+\\sqrt2", "2-\\sqrt3"],
    90: ["1", "0", null, "1", null, "0"]
  };
  function norm360(d) { d = d % 360; if (d < 0) d += 360; if (Math.abs(d - 360) < 1e-9) d = 0; return d; }
  function quad(d) { // 0 = on an axis
    d = norm360(d);
    if (Math.abs(d % 90) < 1e-9) return 0;
    return d < 90 ? 1 : d < 180 ? 2 : d < 270 ? 3 : 4;
  }
  function refAngle(d) { d = norm360(d); return d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d; }
  // exact six values for multiples of 15°, else null
  function exact6(deg) {
    if (Math.abs(deg / 15 - Math.round(deg / 15)) > 1e-9) return null;
    var d = norm360(Math.round(deg)), r = Math.round(refAngle(d)), base = REF[r];
    var s = Math.sin(d * D2R), c = Math.cos(d * D2R);
    var sg = [s, c, s / c, 1 / s, 1 / c, c / s];
    return base.map(function (v, i) {
      if (v == null) return null;
      // sin/cos of an axis angle: take the value straight from the circle
      if (d % 90 === 0) { var val = [s, c, s / c, 1 / s, 1 / c, c / s][i]; if (!isFinite(val) || Math.abs(val) > 1e9) return null; return String(Math.round(val)); }
      return (sg[i] < 0 ? "-" : "") + v;
    });
  }
  PC.exact6 = exact6;
  PC.trigRef = refAngle;
  PC.trigQuad = quad;
  var FN6 = ["sin", "cos", "tan", "csc", "sec", "cot"];
  function six(rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    if (Math.abs(s) < 1e-15) s = 0; if (Math.abs(c) < 1e-15) c = 0;
    return [s, c, c === 0 ? NaN : s / c, s === 0 ? NaN : 1 / s, c === 0 ? NaN : 1 / c, s === 0 ? NaN : c / s];
  }
  PC.six = six;
  function dms(deg) {
    var sg = deg < 0 ? "−" : "", a = Math.abs(deg), d = Math.floor(a), mf = (a - d) * 60, m = Math.floor(mf), s = (mf - m) * 60;
    if (s > 59.995) { s = 0; m++; } if (m === 60) { m = 0; d++; }
    return sg + d + "° " + m + "′ " + (+s.toFixed(2)) + "″";
  }
  // angle text → degrees: 37, 37.5°, 23°15'30", 23 15 30, 2pi/3, π/6, 1.2 rad
  function parseAngle(src, unit) {
    var s = String(src).trim().replace(/[−–]/g, "-");
    if (!s) throw new Error(L("พิมพ์มุมก่อน", "Type an angle"));
    if (/rad/i.test(s) || /pi|π/i.test(s) || unit === "rad") return PC.evalNum(s.replace(/rad(ians?)?/i, "")) / D2R;
    var m = s.match(/^(-?\d+(?:\.\d+)?)\s*(?:°|d|deg)?\s*(?:(\d+(?:\.\d+)?)\s*(?:'|′|m))?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|″|s))?\s*$/i);
    if (m && (m[2] || m[3] || /°|d/i.test(s))) { var sg = m[1][0] === "-" ? -1 : 1; return sg * (Math.abs(+m[1]) + (+m[2] || 0) / 60 + (+m[3] || 0) / 3600); }
    var sp = s.split(/\s+/);
    if (sp.length === 3 && sp.every(function (t) { return /^-?\d+(\.\d+)?$/.test(t); })) { var g = sp[0][0] === "-" ? -1 : 1; return g * (Math.abs(+sp[0]) + sp[1] / 60 + sp[2] / 3600); }
    return PC.evalNum(s.replace(/°/g, ""));
  }
  PC.parseAngle = parseAngle;
  // every angle in [0, 360) with fn(θ) = v
  function solveTrig(fn, v) {
    var base, out = [];
    if (fn === "csc" || fn === "sec" || fn === "cot") { if (v === 0 && fn !== "cot") return { none: true }; v = fn === "cot" ? (v === 0 ? Infinity : 1 / v) : 1 / v; fn = { csc: "sin", sec: "cos", cot: "tan" }[fn]; }
    if (fn === "sin") { if (Math.abs(v) > 1 + 1e-12) return { none: true }; base = Math.asin(Math.max(-1, Math.min(1, v))) / D2R; out = [base, 180 - base]; }
    else if (fn === "cos") { if (Math.abs(v) > 1 + 1e-12) return { none: true }; base = Math.acos(Math.max(-1, Math.min(1, v))) / D2R; out = [base, -base]; }
    else { base = v === Infinity ? 90 : Math.atan(v) / D2R; out = [base, base + 180]; }
    out = out.map(norm360).map(function (d) { return Math.abs(d - Math.round(d)) < 1e-9 ? Math.round(d) : d; }).sort(function (a, b) { return a - b; });
    out = out.filter(function (d, i) { return i === 0 || Math.abs(d - out[i - 1]) > 1e-9; });
    return { fn: fn, base: base, all: out };
  }
  PC.solveTrig = solveTrig;
  function degTex(d) { var p = PC.piTex(d * D2R); return fmt(d, 4).replace(/−/g, "-") + "^\\circ" + (p && p !== "0" ? " = " + p : ""); }
  function valTex(ex, v) {
    if (ex != null) return ex + (/sqrt|frac/.test(ex) ? " \\approx " + fmt(v, 6).replace(/−/g, "-") : "");
    return isFinite(v) ? fmt(v, 8).replace(/−/g, "-") : "\\text{" + L("ไม่นิยาม", "undefined") + "}";
  }

  // ---------------------------------------------------------------- unit circle
  PC.widget("pc-uc", function (box) {
    var st = PC.attrs(box, { deg: 30, snap: true });
    PC.head(box, L("วงกลมหนึ่งหน่วย: ลากจุด P หรือเลื่อนสไลเดอร์", "Unit circle: drag P or use the slider"), L("สีส้ม = cos θ (แนวนอน) · สีน้ำเงิน = sin θ (แนวตั้ง)", "orange = cos θ (horizontal) · blue = sin θ (vertical)"));
    var ctl = PC.controls(box, [
      { k: "deg", t: "range", lab: "θ (" + L("องศา", "degrees") + ")", min: -360, max: 720, step: 1 },
      { k: "snap", t: "chk", lab: L("ดูดเข้ามุมพิเศษ (ทุก 15°)", "snap to special angles (every 15°)") }
    ], st, function () { render(); });
    var grid = PC.part(box, "pc-uc-grid"), left = PC.part(grid, "pc-uc-svg"), right = PC.part(grid, "pc-uc-wave"), out = PC.part(box, "pc-out");
    var S = 300, R = 112, cx = 150, cy = 150;
    left.innerHTML = '<svg viewBox="0 0 ' + S + " " + S + '" role="img" aria-label="unit circle"><g class="pc-grid">' +
      [-1, -0.5, 0.5, 1].map(function (t) { return '<line x1="' + (cx + t * R) + '" x2="' + (cx + t * R) + '" y1="18" y2="282"/><line y1="' + (cy - t * R) + '" y2="' + (cy - t * R) + '" x1="18" x2="282"/>'; }).join("") +
      '</g><line class="pc-axis" x1="10" x2="290" y1="150" y2="150"/><line class="pc-axis" x1="150" x2="150" y1="10" y2="290"/>' +
      '<circle cx="150" cy="150" r="' + R + '" fill="none" stroke="var(--ink-2)" stroke-width="1.6"/>' +
      '<text class="pc-ann" x="' + (cx + R + 4) + '" y="166">1</text><text class="pc-ann" x="' + (cx - R - 14) + '" y="166">−1</text><text class="pc-ann" x="156" y="' + (cy - R - 4) + '">1</text><text class="pc-ann" x="156" y="' + (cy + R + 14) + '">−1</text>' +
      '<text class="pc-q" x="250" y="40">I</text><text class="pc-q" x="44" y="40">II</text><text class="pc-q" x="44" y="272">III</text><text class="pc-q" x="244" y="272">IV</text>' +
      '<path class="uc-arc" fill="none" stroke="var(--ok)" stroke-width="2"/><line class="uc-tan" stroke="#8a5cc2" stroke-width="2" stroke-dasharray="4 3"/>' +
      '<line class="uc-cos" stroke="var(--accent)" stroke-width="3.5"/><line class="uc-sin" stroke="var(--signal)" stroke-width="3.5"/><line class="uc-r" stroke="var(--ink)" stroke-width="2"/>' +
      '<text class="pc-ann uc-th" fill="var(--ok)"></text><text class="pc-ann pc-mk uc-pl"></text>' +
      '<circle class="uc-hit" r="24" fill="transparent"/><circle class="uc-p" r="8" fill="var(--accent)" stroke="var(--paper)" stroke-width="2"/></svg>';
    var svg = left.querySelector("svg"), q = function (s) { return svg.querySelector(s); };
    function setFromClient(x, y) {
      var r = svg.getBoundingClientRect(), px = (x - r.left) / r.width * S - cx, py = cy - (y - r.top) / r.height * S;
      var d = Math.atan2(py, px) / D2R; if (d < 0) d += 360;
      if (st.snap) d = Math.round(d / 15) * 15;
      st.deg = Math.round(d) % 360; ctl.sync(); render();
    }
    var drag = false;
    q(".uc-hit").addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") return; drag = true; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener("pointermove", function (e) { if (drag) setFromClient(e.clientX, e.clientY); });
    svg.addEventListener("pointerup", function () { drag = false; });
    svg.addEventListener("click", function (e) { setFromClient(e.clientX, e.clientY); });
    var tdrag = false;
    q(".uc-hit").addEventListener("touchstart", function (e) { e.preventDefault(); tdrag = true; }, { passive: false });
    svg.addEventListener("touchmove", function (e) { if (!tdrag) return; e.preventDefault(); var t = e.touches[0]; setFromClient(t.clientX, t.clientY); }, { passive: false });
    svg.addEventListener("touchend", function () { tdrag = false; });
    function render() {
      var d = st.snap ? Math.round(st.deg / 15) * 15 : st.deg, rad = d * D2R, c = Math.cos(rad), s = Math.sin(rad);
      var X = cx + R * c, Y = cy - R * s;
      q(".uc-p").setAttribute("cx", X); q(".uc-p").setAttribute("cy", Y); q(".uc-hit").setAttribute("cx", X); q(".uc-hit").setAttribute("cy", Y);
      var set = function (sel, a) { var e = q(sel); Object.keys(a).forEach(function (k) { e.setAttribute(k, a[k]); }); };
      set(".uc-cos", { x1: cx, y1: cy, x2: X, y2: cy }); set(".uc-sin", { x1: X, y1: cy, x2: X, y2: Y }); set(".uc-r", { x1: cx, y1: cy, x2: X, y2: Y });
      var t = Math.tan(rad), showT = Math.abs(c) > 0.08 && Math.abs(t) < 2.4;
      set(".uc-tan", showT ? { x1: cx + R, y1: cy, x2: cx + R, y2: cy - R * t, opacity: 1 } : { opacity: 0 });
      var dd = norm360(d), r0 = 30, large = dd > 180 ? 1 : 0, ex = cx + r0 * Math.cos(dd * D2R), ey = cy - r0 * Math.sin(dd * D2R);
      q(".uc-arc").setAttribute("d", dd === 0 ? "" : "M" + (cx + r0) + " " + cy + " A" + r0 + " " + r0 + " 0 " + large + " 0 " + ex.toFixed(1) + " " + ey.toFixed(1));
      var th = q(".uc-th"); th.setAttribute("x", cx + 40 * Math.cos(dd / 2 * D2R)); th.setAttribute("y", cy - 40 * Math.sin(dd / 2 * D2R) + 4); th.textContent = "θ";
      var pl = q(".uc-pl"); pl.setAttribute("x", X + (c >= 0 ? -12 : 12)); pl.setAttribute("y", Y + (s >= 0 ? 22 : -14)); pl.setAttribute("text-anchor", c >= 0 ? "end" : "start");
      pl.textContent = "P(" + fmt(c, 3) + ", " + fmt(s, 3) + ")";
      // waves
      var x0 = Math.min(0, rad - 0.5), x1 = Math.max(2 * Math.PI, rad + 0.5), xt = [];
      for (var k = Math.ceil(x0 / (Math.PI / 2)); k * Math.PI / 2 <= x1 + 1e-9; k++) xt.push([k * Math.PI / 2, k === 0 ? "0" : PC.piTxt(k * Math.PI / 2)]);
      PC.plotIn(right, { xmin: x0, xmax: x1, ymin: -1.35, ymax: 1.35, xt: xt, yt: [[-1, "−1"], [0, "0"], [1, "1"]], maxW: 520, ratio: 0.5, minH: 180,
        series: [{ pts: PC.sample(Math.sin, x0, x1, 300), color: "var(--signal)" }, { pts: PC.sample(Math.cos, x0, x1, 300), color: "var(--accent)", width: 1.6 }],
        vlines: [{ x: rad, color: C.c }], marks: [{ x: rad, y: s, color: "var(--signal)", r: 4 }, { x: rad, y: c, color: "var(--accent)", r: 4 }], xlabel: "θ (rad)", label: "sine and cosine" });
      var ex6 = exact6(d), v6 = six(rad), qd = quad(d), ref = refAngle(d);
      var rows = [];
      rows.push(["θ", tex(degTex(d)) + (Math.abs(d) >= 360 || d < 0 ? " · " + L("มุมร่วมแขนในช่วง 0°–360° คือ ", "coterminal in 0°–360°: ") + fmt(norm360(d)) + "°" : "")]);
      rows.push([L("ตำแหน่ง", "Position"), qd ? L("จตุภาคที่ ", "Quadrant ") + ["", "I", "II", "III", "IV"][qd] + " · " + L("มุมอ้างอิง ", "reference angle ") + fmt(ref) + "°" : L("อยู่บนแกน", "on an axis")]);
      rows.push([L("เครื่องหมาย (ASTC)", "Signs (ASTC)"), qd ? ["", L("ทุกฟังก์ชันเป็นบวก (All)", "all positive (All)"), L("sin, csc บวก (Students)", "sin, csc positive (Students)"), L("tan, cot บวก (Take)", "tan, cot positive (Take)"), L("cos, sec บวก (Calculus)", "cos, sec positive (Calculus)")][qd] : "—"]);
      FN6.forEach(function (n, i) { if (i < 3 || ex6) rows.push([n + " θ", tex(valTex(ex6 ? ex6[i] : null, v6[i]))]); });
      if (!ex6) rows.push([L("หมายเหตุ", "Note"), L("ค่าแม่นตรงแสดงเฉพาะมุมที่เป็นพหุคูณของ 15°", "exact values are shown for multiples of 15°")]);
      out.innerHTML = dl(rows);
    }
    render();
    return { render: render, set: function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); ctl.sync(); render(); } };
  });

  // ---------------------------------------------------------------- sinusoid
  PC.widget("pc-sin", function (box) {
    var PI = Math.PI;
    return PC.make(box, { fn: "sin", A: 2, B: 2, C: 0.5236, D: 1 }, [
      { k: "fn", t: "sel", lab: L("ฟังก์ชัน", "Function"), opts: [["sin", "sin"], ["cos", "cos"], ["tan", "tan"]] },
      { k: "A", t: "range", lab: "A", min: -4, max: 4, step: 0.5 },
      { k: "B", t: "range", lab: "B", min: 0.25, max: 4, step: 0.25 },
      { k: "C", t: "range", lab: "C (rad)", min: -3.1416, max: 3.1416, step: 0.2618 },
      { k: "D", t: "range", lab: "D", min: -3, max: 3, step: 0.5 }
    ], function (st, ui) {
      var A = st.A, B = st.B, Cc = Math.round(st.C / (PI / 12)) * PI / 12, Dd = st.D, fn = st.fn;
      if (!(B > 0)) throw new Error(L("B ต้องเป็นบวก", "B must be positive"));
      var f0 = Math[fn], f = function (x) { return A * f0(B * (x - Cc)) + Dd; };
      var P = (fn === "tan" ? PI : 2 * PI) / B, x0 = -2 * PI, x1 = 2 * PI, xt = [];
      for (var k = -4; k <= 4; k++) xt.push([k * PI / 2, k === 0 ? "0" : PC.piTxt(k * PI / 2)]);
      var span = Math.abs(A) + 1.2, marks = [], vl = [];
      if (fn !== "tan") {
        for (var j = 0; j <= 4; j++) { var x = Cc + j * P / 4; marks.push({ x: x, y: f(x), color: j % 2 ? C.b : C.a, r: 4 }); }
      } else {
        for (var m = -8; m <= 8; m++) { var va = Cc + P / 2 + m * P; if (va > x0 && va < x1) vl.push({ x: va, color: C.m }); }
      }
      PC.plotIn(ui.fig, { xmin: x0, xmax: x1, ymin: Dd - (fn === "tan" ? 5 : span), ymax: Dd + (fn === "tan" ? 5 : span), xt: xt,
        series: [{ pts: PC.sample(f0, x0, x1, 800), color: C.m, width: 1.2, dash: "4 4" }, { pts: PC.sample(f, x0, x1, 1200) }],
        hlines: [{ y: Dd, color: C.c, label: L("เส้นกลาง y = ", "midline y = ") + fmt(Dd) }], vlines: vl, marks: marks, xlabel: "x (rad)", label: "sinusoid" });
      var cT = PC.piTex(Cc) || nice(Cc), PT = PC.piTex(P) || nice(P);
      var eq = "y = " + (A === 1 ? "" : A === -1 ? "-" : nice(A)) + "\\" + fn + "\\left(" + (B === 1 ? "" : nice(B)) + (Cc === 0 ? "x" : "\\left(x " + (Cc > 0 ? "- " + cT : "+ " + PC.piTex(-Cc)) + "\\right)") + "\\right)" + (Dd ? (Dd > 0 ? " + " : " - ") + nice(Math.abs(Dd)) : "");
      var rows = [];
      if (fn !== "tan") {
        rows.push([L("แอมพลิจูด", "Amplitude"), tex("|A| = " + nice(Math.abs(A)))]);
        rows.push([L("ค่าสูงสุด · ต่ำสุด", "Max · min"), tex(nice(Dd + Math.abs(A)) + ",\\ " + nice(Dd - Math.abs(A))) + " · " + L("เรนจ์ ", "range ") + tex("[" + nice(Dd - Math.abs(A)) + ", " + nice(Dd + Math.abs(A)) + "]")]);
      } else rows.push([L("ยืดแนวตั้ง", "Vertical stretch"), tex("|A| = " + nice(Math.abs(A))) + L(" (แทนเจนต์ไม่มีแอมพลิจูด)", " (tangent has no amplitude)")]);
      rows.push([L("คาบ", "Period"), tex((fn === "tan" ? "\\dfrac{\\pi}{B}" : "\\dfrac{2\\pi}{B}") + " = " + PT)]);
      rows.push([L("การเลื่อนเฟส", "Phase shift"), Cc === 0 ? L("ไม่มี", "none") : tex("C = " + cT) + (Cc > 0 ? L(" เลื่อนขวา", " to the right") : L(" เลื่อนซ้าย", " to the left"))]);
      rows.push([L("เส้นกลาง", "Midline"), tex("y = " + nice(Dd))]);
      if (fn !== "tan") rows.push([L("5 จุดสำคัญของหนึ่งคาบ", "Five key points of one period"), [0, 1, 2, 3, 4].map(function (j) { var x = Cc + j * P / 4; return tex("\\left(" + (PC.piTex(x) || nice(x)) + ",\\ " + nice(f(x)) + "\\right)"); }).join(" ")]);
      else rows.push([L("เส้นกำกับแนวดิ่ง", "Vertical asymptotes"), tex("x = " + (PC.piTex(Cc + P / 2) || nice(Cc + P / 2)) + " + k\\cdot " + PT + ",\\ k \\in \\mathbb{Z}")]);
      ui.out.innerHTML = '<p class="pc-eq">' + tex(eq) + "</p>" + dl(rows);
    }, { title: L("แล็บกราฟไซน์ y = A·sin(B(x − C)) + D", "Sinusoid lab y = A·sin(B(x − C)) + D"), hint: L("C เลื่อนทีละ π/12 · เส้นประ = กราฟต้นแบบ", "C moves in steps of π/12 · dashed = parent") });
  });

  // ---------------------------------------------------------------- triangle solver
  function solveTri(cs, v) {
    var sin = function (d) { return Math.sin(d * D2R); }, cos = function (d) { return Math.cos(d * D2R); }, asin = function (x) { return Math.asin(x) / D2R; }, acos = function (x) { return Math.acos(Math.max(-1, Math.min(1, x))) / D2R; };
    var a = v.a, b = v.b, c = v.c, A = v.A, B = v.B, sols = [], steps = [], err = null;
    function pos() { for (var i = 0; i < arguments.length; i++) if (!(arguments[i] > 0)) return false; return true; }
    if (cs === "SSS") {
      if (!pos(a, b, c)) err = L("ด้านต้องเป็นบวก", "Sides must be positive");
      else if (a + b <= c || a + c <= b || b + c <= a) err = L("ไม่เป็นสามเหลี่ยม: ผลบวกสองด้านต้องมากกว่าด้านที่สาม", "Not a triangle: any two sides must add to more than the third");
      else { A = acos((b * b + c * c - a * a) / (2 * b * c)); B = acos((a * a + c * c - b * b) / (2 * a * c)); sols.push({ a: a, b: b, c: c, A: A, B: B, C: 180 - A - B });
        steps.push("\\cos A = \\dfrac{b^2 + c^2 - a^2}{2bc} \\Rightarrow A = " + fmt(A, 4) + "^\\circ", "\\cos B = \\dfrac{a^2 + c^2 - b^2}{2ac} \\Rightarrow B = " + fmt(B, 4) + "^\\circ", "C = 180^\\circ - A - B"); }
    } else if (cs === "SAS") {
      if (!pos(b, c, A) || A >= 180) err = L("ต้องมี b, c > 0 และ 0° < A < 180°", "Need b, c > 0 and 0° < A < 180°");
      else { a = Math.sqrt(b * b + c * c - 2 * b * c * cos(A)); B = acos((a * a + c * c - b * b) / (2 * a * c)); sols.push({ a: a, b: b, c: c, A: A, B: B, C: 180 - A - B });
        steps.push("a^2 = b^2 + c^2 - 2bc\\cos A \\Rightarrow a = " + fmt(a, 5), "\\cos B = \\dfrac{a^2 + c^2 - b^2}{2ac} \\Rightarrow B = " + fmt(B, 4) + "^\\circ", "C = 180^\\circ - A - B"); }
    } else if (cs === "ASA" || cs === "AAS") {
      var Cg = 180 - A - B;
      if (!pos(A, B) || !(Cg > 0)) err = L("มุมต้องเป็นบวกและรวมกันน้อยกว่า 180°", "Angles must be positive and add to less than 180°");
      else if (cs === "ASA") { if (!pos(c)) err = L("ด้าน c ต้องเป็นบวก", "Side c must be positive"); else { a = c * sin(A) / sin(Cg); b = c * sin(B) / sin(Cg); sols.push({ a: a, b: b, c: c, A: A, B: B, C: Cg });
        steps.push("C = 180^\\circ - A - B = " + fmt(Cg, 4) + "^\\circ", "\\dfrac{a}{\\sin A} = \\dfrac{c}{\\sin C} \\Rightarrow a = " + fmt(a, 5), "b = \\dfrac{c\\sin B}{\\sin C} = " + fmt(b, 5)); } }
      else { if (!pos(a)) err = L("ด้าน a ต้องเป็นบวก", "Side a must be positive"); else { b = a * sin(B) / sin(A); c = a * sin(Cg) / sin(A); sols.push({ a: a, b: b, c: c, A: A, B: B, C: Cg });
        steps.push("C = 180^\\circ - A - B = " + fmt(Cg, 4) + "^\\circ", "b = \\dfrac{a\\sin B}{\\sin A} = " + fmt(b, 5), "c = \\dfrac{a\\sin C}{\\sin A} = " + fmt(c, 5)); } }
    } else { // SSA: a, b, A
      if (!pos(a, b, A) || A >= 180) err = L("ต้องมี a, b > 0 และ 0° < A < 180°", "Need a, b > 0 and 0° < A < 180°");
      else {
        var h = b * sin(A), sB = b * sin(A) / a;
        steps.push("h = b\\sin A = " + fmt(h, 5) + ",\\quad \\sin B = \\dfrac{b\\sin A}{a} = " + fmt(sB, 6));
        if (sB > 1 + 1e-12) { err = L("sin B > 1 จึงไม่มีสามเหลี่ยม (ด้าน a สั้นกว่าความสูง h)", "sin B > 1, so no triangle (a is shorter than the height h)"); }
        else {
          var B1 = asin(Math.min(1, sB)), cand = [B1];
          if (Math.abs(B1 - 90) > 1e-9) cand.push(180 - B1);
          cand.forEach(function (Bx) { var Cx = 180 - A - Bx; if (Cx > 1e-9) sols.push({ a: a, b: b, c: a * sin(Cx) / sin(A), A: A, B: Bx, C: Cx }); });
          steps.push(sols.length === 2 ? L("กรณีกำกวม: h < a < b จึงได้สองสามเหลี่ยม B หรือ 180° − B", "Ambiguous case: h < a < b gives two triangles, B or 180° − B") : sols.length === 1 ? L("ได้สามเหลี่ยมเดียว", "Exactly one triangle") : "");
          if (!sols.length) err = L("มุมรวมเกิน 180° จึงไม่มีสามเหลี่ยม", "The angles exceed 180°, so no triangle");
        }
      }
    }
    sols.forEach(function (s) { s.area = 0.5 * s.b * s.c * sin(s.A); s.per = s.a + s.b + s.c; s.R = s.a / (2 * sin(s.A)); });
    return { sols: sols, steps: steps, err: err };
  }
  PC.solveTri = solveTri;
  PC.widget("pc-tri", function (box) {
    var CS = [["SSS", L("SSS · ด้าน ด้าน ด้าน", "SSS · three sides")], ["SAS", L("SAS · ด้าน มุมระหว่าง ด้าน", "SAS · two sides and the included angle")], ["ASA", L("ASA · มุม ด้านระหว่าง มุม", "ASA · two angles and the included side")], ["AAS", L("AAS · มุม มุม ด้านตรงข้าม", "AAS · two angles and a non-included side")], ["SSA", L("SSA · กรณีกำกวม", "SSA · the ambiguous case")]];
    return PC.make(box, { "case": "SSA", a: 7, b: 10, c: 8, angA: 40, angB: 60 }, [
      { k: "case", t: "sel", lab: L("ข้อมูลที่รู้", "What you know"), opts: CS, wide: true },
      { k: "a", t: "num", lab: "a", show: "case:SSS|AAS|SSA" }, { k: "b", t: "num", lab: "b", show: "case:SSS|SAS|SSA" }, { k: "c", t: "num", lab: "c", show: "case:SSS|SAS|ASA" },
      { k: "angA", t: "num", lab: "A (°)", show: "case:SAS|ASA|AAS|SSA" }, { k: "angB", t: "num", lab: "B (°)", show: "case:ASA|AAS" }
    ], function (st, ui) {
      var res = solveTri(st["case"], { a: st.a, b: st.b, c: st.c, A: st.angA, B: st.angB });
      if (res.err) { ui.fig.innerHTML = ""; ui.out.innerHTML = PC.errBox(res.err) + (res.steps.length ? dl([[L("ขั้นตอน", "Steps"), res.steps.filter(Boolean).map(function (s) { return tex(s); }).join("<br>")]]) : ""); return; }
      // drawing: A at origin, AB on the x-axis
      var W = Math.round(Math.max(260, Math.min(620, ui.fig.clientWidth || 520))), H = Math.round(W * 0.52), pad = 30;
      var pts = res.sols.map(function (s) { return [[0, 0], [s.c, 0], [s.b * Math.cos(s.A * D2R), s.b * Math.sin(s.A * D2R)]]; });
      var xs = [], ys = []; pts.forEach(function (p) { p.forEach(function (q) { xs.push(q[0]); ys.push(q[1]); }); });
      var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs), ymax = Math.max.apply(null, ys);
      var k = Math.min((W - 2 * pad) / (xmax - xmin || 1), (H - 2 * pad) / (ymax || 1));
      var X = function (x) { return pad + (x - xmin) * k + ((W - 2 * pad) - (xmax - xmin) * k) / 2; }, Y = function (y) { return H - pad - y * k; };
      var svg = '<svg class="pc-plot" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="triangle">';
      pts.forEach(function (p, i) {
        var col = i ? "var(--signal)" : "var(--accent)";
        svg += '<polygon points="' + p.map(function (q) { return X(q[0]).toFixed(1) + "," + Y(q[1]).toFixed(1); }).join(" ") + '" fill="' + col + '" fill-opacity="0.08" stroke="' + col + '" stroke-width="2"' + (i ? ' stroke-dasharray="6 4"' : "") + "/>";
        svg += '<text class="pc-ann" x="' + (X(p[1][0]) + 4) + '" y="' + (Y(0) + 16) + '" fill="' + col + '">B' + (res.sols.length > 1 ? "₁₂"[i] : "") + "</text>";
      });
      svg += '<text class="pc-ann" x="' + (X(0) - 4) + '" y="' + (Y(0) + 16) + '" text-anchor="end">A</text><text class="pc-ann" x="' + X(pts[0][2][0]) + '" y="' + (Y(pts[0][2][1]) - 8) + '" text-anchor="middle">C</text>';
      var s0 = res.sols[0];
      svg += '<text class="pc-ann" x="' + ((X(0) + X(pts[0][2][0])) / 2 - 8) + '" y="' + ((Y(0) + Y(pts[0][2][1])) / 2) + '" text-anchor="end">b = ' + fmt(s0.b, 3) + "</text>";
      svg += "</svg>";
      ui.fig.innerHTML = svg;
      var html = res.sols.length > 1 ? '<p class="pc-note">' + L("ได้สามเหลี่ยม 2 รูป: เส้นทึบ = รูปที่ 1, เส้นประ = รูปที่ 2", "Two triangles: solid = triangle 1, dashed = triangle 2") + "</p>" : "";
      html += '<div class="pc-tw"><table class="pc-mini"><thead><tr><th></th><th>a</th><th>b</th><th>c</th><th>A</th><th>B</th><th>C</th><th>' + L("พื้นที่", "Area") + "</th></tr></thead><tbody>" + res.sols.map(function (s, i) {
        return "<tr><th>" + (res.sols.length > 1 ? "#" + (i + 1) : "") + "</th><td>" + fmt(s.a, 4) + "</td><td>" + fmt(s.b, 4) + "</td><td>" + fmt(s.c, 4) + "</td><td>" + fmt(s.A, 3) + "°</td><td>" + fmt(s.B, 3) + "°</td><td>" + fmt(s.C, 3) + "°</td><td>" + fmt(s.area, 4) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
      html += dl([[L("ขั้นตอน", "Steps"), res.steps.filter(Boolean).map(function (s) { return /\\/.test(s) ? tex(s) : s; }).join("<br>")],
        [L("พื้นที่", "Area"), tex("\\tfrac12 bc\\sin A = " + fmt(s0.area, 5).replace(/−/g, "-"))], [L("เส้นรอบรูป · รัศมีวงกลมล้อมรอบ", "Perimeter · circumradius"), fmt(s0.per, 4) + " · R = " + fmt(s0.R, 4)]]);
      ui.out.innerHTML = html;
    }, { title: L("เครื่องแก้สามเหลี่ยมทุกกรณี", "Triangle solver for every case"), hint: L("ด้าน a b c อยู่ตรงข้ามมุม A B C", "sides a, b, c are opposite angles A, B, C") });
  });

  // ---------------------------------------------------------------- angle ↔ value lookup
  PC.widget("pc-trig", function (box) {
    return PC.make(box, { mode: "angle", ang: "37", fn: "sin", val: "0.6", table: "" }, [
      { k: "mode", t: "sel", lab: L("ค้นหาจาก", "Look up by"), opts: [["angle", L("มุม → ค่าทั้งหก", "angle → six values")], ["value", L("ค่า → มุม", "value → angles")]] },
      { k: "ang", t: "text", lab: L("มุม (37, 37.5°, 23°15′30″, 2pi/3, 1.2 rad)", "Angle (37, 37.5°, 23°15′30″, 2pi/3, 1.2 rad)"), show: "mode:angle", wide: true },
      { k: "fn", t: "sel", lab: L("ฟังก์ชัน", "Function"), opts: FN6.map(function (n) { return [n, n]; }), show: "mode:value" },
      { k: "val", t: "text", lab: L("ค่า (0.6, sqrt(3)/2, -1/2)", "Value (0.6, sqrt(3)/2, -1/2)"), show: "mode:value" }
    ], function (st, ui) {
      var rows = [], go = function (d) { var r = Math.round(norm360(d)); return st.table && Math.abs(norm360(d) - r) < 0.5 ? ' <a href="#t-' + r + '" class="pc-go">' + L("ดูแถว ", "row ") + r + "° ↓</a>" : ""; };
      if (st.mode === "angle") {
        var d = parseAngle(st.ang), rad = d * D2R, v = six(rad), ex = exact6(d);
        rows.push([L("มุม", "Angle"), tex(degTex(d)) + go(d)]);
        rows.push([L("องศา ลิปดา ฟิลิปดา", "Degrees, minutes, seconds"), dms(d)]);
        rows.push([L("เรเดียน", "Radians"), fmt(rad, 8) + (PC.piTxt(rad) ? " = " + PC.piTxt(rad) : "")]);
        var qd = quad(d);
        rows.push([L("จตุภาค · มุมอ้างอิง", "Quadrant · reference angle"), (qd ? ["", "I", "II", "III", "IV"][qd] : L("บนแกน", "on an axis")) + " · " + fmt(refAngle(d), 6) + "°" + (d < 0 || d >= 360 ? " · " + L("มุมร่วมแขน ", "coterminal ") + fmt(norm360(d), 6) + "°" : "")]);
        FN6.forEach(function (n, i) { rows.push([n, tex(valTex(ex ? ex[i] : null, v[i]))]); });
      } else {
        var y = PC.evalNum(st.val), r = solveTrig(st.fn, y);
        if (r.none) rows.push([L("ผล", "Result"), L("ไม่มีมุมที่ให้ค่านี้ ", "No angle gives this value ") + (st.fn === "sin" || st.fn === "cos" ? L("(ต้องอยู่ระหว่าง −1 ถึง 1)", "(must be between −1 and 1)") : L("(|csc|, |sec| ≥ 1)", "(|csc|, |sec| ≥ 1)"))]);
        else {
          rows.push([L("ค่าหลัก", "Principal value"), tex("\\operatorname{arc" + r.fn + "}(" + nice(st.fn === r.fn ? y : (st.fn === "cot" ? 1 / y : 1 / y)) + ") = " + degTex(r.base))]);
          rows.push([L("มุมใน 0° ≤ θ < 360°", "Angles with 0° ≤ θ < 360°"), r.all.map(function (d) { return tex(degTex(d)) + go(d); }).join("<br>")]);
          var gen = r.fn === "sin" ? "\\theta = " + fmt(r.base, 6).replace(/−/g, "-") + "^\\circ + 360^\\circ k \\ \\text{" + L("หรือ", "or") + "}\\ \\theta = " + fmt(180 - r.base, 6).replace(/−/g, "-") + "^\\circ + 360^\\circ k" :
            r.fn === "cos" ? "\\theta = \\pm " + fmt(r.base, 6) + "^\\circ + 360^\\circ k" : "\\theta = " + fmt(r.base, 6).replace(/−/g, "-") + "^\\circ + 180^\\circ k";
          rows.push([L("คำตอบทั่วไป", "General solution"), tex(gen + ",\\ k \\in \\mathbb{Z}")]);
        }
      }
      ui.out.innerHTML = dl(rows);
    }, { title: L("ค้นหาค่าตรีโกณมิติ", "Trig value lookup"), hint: L("คำนวณในเบราว์เซอร์ ละเอียด 8 ตำแหน่ง", "computed in your browser to 8 decimals"), noFig: true });
  });

  // ---------------------------------------------------------------- toolbar for the static 0°–360° table
  PC.widget("pc-ttab", function (box) {
    var table = document.getElementById(box.getAttribute("data-table"));
    if (!table) return {};
    var rows = Array.prototype.slice.call(table.tBodies[0].rows), q = "all", step = 1;
    box.innerHTML = '<div class="pc-tbar"><div class="pc-chips" role="group" aria-label="' + L("กรองตามจตุภาค", "Filter by quadrant") + '">' +
      [["all", L("ทั้งหมด", "All")], ["1", "I · 0°–90°"], ["2", "II · 90°–180°"], ["3", "III · 180°–270°"], ["4", "IV · 270°–360°"]].map(function (o) { return '<button type="button" class="btn btn-ghost btn-sm" data-q="' + o[0] + '" aria-pressed="' + (o[0] === "all") + '">' + o[1] + "</button>"; }).join("") +
      '</div><label class="pc-inl">' + L("ทุก ๆ", "every") + ' <select data-step><option value="1">1°</option><option value="5">5°</option><option value="15">15°</option><option value="30">30°</option></select></label>' +
      '<label class="pc-inl">' + L("ไปที่มุม", "go to") + ' <input type="number" min="0" max="360" step="1" inputmode="numeric" data-go placeholder="0–360"></label></div>';
    function apply() {
      rows.forEach(function (r) {
        var d = +r.getAttribute("data-d");
        var inQ = q === "all" || (d >= (q - 1) * 90 && d <= q * 90);
        r.hidden = !(inQ && d % step === 0);
      });
    }
    box.querySelectorAll("[data-q]").forEach(function (b) { b.addEventListener("click", function () { q = b.getAttribute("data-q") === "all" ? "all" : +b.getAttribute("data-q"); box.querySelectorAll("[data-q]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); apply(); }); });
    box.querySelector("[data-step]").addEventListener("change", function (e) { step = +e.target.value; apply(); });
    function jump(d) {
      d = Math.round(d); if (d !== 360) d = Math.round(norm360(d));
      var r = document.getElementById("t-" + d); if (!r) return;
      q = "all"; step = 1; box.querySelector("[data-step]").value = "1"; box.querySelectorAll("[data-q]").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-q") === "all"); }); apply();
      rows.forEach(function (x) { x.classList.remove("pc-hitrow"); }); r.classList.add("pc-hitrow");
      var sc = r.closest(".pc-scroll"); if (sc) sc.scrollTop = r.offsetTop - sc.clientHeight / 3; else r.scrollIntoView({ block: "center" });
    }
    var gi = box.querySelector("[data-go]");
    gi.addEventListener("change", function () { if (gi.value !== "") jump(+gi.value); });
    document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a.pc-go"); if (!a) return; var d = +a.getAttribute("href").slice(3); e.preventDefault(); jump(d); (table.closest(".pc-scroll") || table).scrollIntoView({ behavior: "smooth", block: "start" }); });
    if (/^#t-\d+$/.test(location.hash)) setTimeout(function () { jump(+location.hash.slice(3)); }, 50);
    return {};
  });

  PC.boot();
})(typeof window !== "undefined" ? window : globalThis);
