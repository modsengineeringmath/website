/* Multivariable calculus labs, part 3 — vector functions and vector calculus (needs mvc-lab.js)
   <div class="mv-curve" data-x="cos(t)" data-y="sin(t)" data-z="t/2" data-t0="0" data-t1="4*pi">        space curve r(t): T, N, B, κ, τ, osculating circle
   <div class="mv-field" data-p="-y" data-q="x" data-r="3">                                                 2-D vector field: div, curl, flow lines, circulation/flux on a test circle
   <div class="mv-flux" data-mode="gauss|stokes" …>                                                         divergence theorem and Stokes' theorem checked numerically */
(function (root) {
  "use strict";
  var MK = root.MK, MVC = root.MVC, MVL = root.MVL;
  if (!MK || !MVC || !MVL) return;
  var PI = Math.PI;
  var $$ = MVL.$$, T = MVL.T, esc = MK.esc, fmt = MVC.fmt, tn = MVC.texNum;
  var slider = MVL.slider, bindSliders = MVL.bindSliders, setSlider = MVL.setSlider, chips = MVL.chips, checks = MVL.checks, debounce = MVL.debounce, compileIn = MVL.compileIn;
  var Scene3D = MVL.Scene3D, Map2D = MVL.Map2D, surfaceItem = MVL.surfaceItem, css = MVL.css, cnum = MVL.cnum;
  var dataObj = function (box, n) { var o = null; try { o = JSON.parse(box.getAttribute("data-" + n) || "null"); } catch (e) { o = null; } return o; };
  // is the expression identically zero? (symbolic 0, or ≈ 0 at many sample points where it is defined)
  function isZeroExpr(ast, vars) {
    if (ast.t === "num") return ast.v === 0;
    var f = MVC.compile(ast, vars), seed = 11, hit = 0, bad = 0, i;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (i = 0; i < 60; i++) { var a = vars.map(function () { return (rnd() * 2 - 1) * 3; }), v = f.apply(null, a); if (!isFinite(v)) continue; hit++; if (Math.abs(v) > 1e-9 * (1 + Math.abs(a[0]) + Math.abs(a[1]))) bad++; }
    return hit >= 10 && bad === 0;
  }
  MVL.isZeroExpr = isZeroExpr;
  var vadd = function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; };
  var vsc = function (a, k) { return [a[0] * k, a[1] * k, a[2] * k]; };

  /* ================================================================== mv-curve */
  var CURVE_PRE = [
    ["เกลียว (helix)", "cos(t)", "sin(t)", "t/2", "0", "4*pi"],
    ["วงกลม", "2*cos(t)", "2*sin(t)", "0", "0", "2*pi"],
    ["ลูกกระสุน (projectile)", "8*t", "0", "12*t-4.9*t^2", "0", "2.4"],
    ["twisted cubic", "t", "t^2", "t^3", "-1.2", "1.2"],
    ["เกลียวกรวย", "t*cos(t)", "t*sin(t)", "t", "0", "4*pi"],
    ["Viviani", "1+cos(t)", "sin(t)", "2*sin(t/2)", "-2*pi", "2*pi"],
    ["ปมสามแฉก (trefoil)", "sin(t)+2*sin(2*t)", "cos(t)-2*cos(2*t)", "-sin(3*t)", "0", "2*pi"],
    ["ทางลาดเกลียวรัศมีแปรผัน", "(1+t/6)*cos(t)", "(1+t/6)*sin(t)", "t/3", "0", "4*pi"]
  ];
  function initCurve(box) {
    var d = box.dataset;
    var st = { x: d.x || CURVE_PRE[0][1], y: d.y || CURVE_PRE[0][2], z: d.z || CURVE_PRE[0][3], t0: d.t0 || "0", t1: d.t1 || "4*pi", s: +(d.s != null ? d.s : 0.3), T: true, N: true, B: true, osc: true, va: false };
    var show = (d.show || "T,N,B,osc").split(",");
    st.T = show.indexOf("T") >= 0; st.N = show.indexOf("N") >= 0; st.B = show.indexOf("B") >= 0; st.osc = show.indexOf("osc") >= 0; st.va = show.indexOf("va") >= 0;
    var pre = dataObj(box, "presets") || CURVE_PRE;
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + chips(pre, "data-pre") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">x(t) =</label><input class="lap-in" data-in="x" value="' + esc(st.x) + '" spellcheck="false"><label class="lap-lbl">y(t) =</label><input class="lap-in" data-in="y" value="' + esc(st.y) + '" spellcheck="false"><label class="lap-lbl">z(t) =</label><input class="lap-in" data-in="z" value="' + esc(st.z) + '" spellcheck="false"></div>' +
      '<div class="lap-row"><label class="lap-lbl">t จาก</label><input class="lap-in sm" data-in="t0" value="' + esc(st.t0) + '"><label class="lap-lbl">ถึง</label><input class="lap-in sm" data-in="t1" value="' + esc(st.t1) + '"></div>' +
      slider("s", "ตำแหน่งบนเส้นโค้ง (0 → 1 ของช่วง t)", 0, 1, 0.005, st.s) +
      checks([["T", "เวกเตอร์สัมผัส T", st.T], ["N", "เวกเตอร์ปกติ N", st.N], ["B", "ไบนอร์มอล B", st.B], ["osc", "วงกลมออสคิวเลติง (osculating circle)", st.osc], ["va", "ความเร็ว v และความเร่ง a", st.va]]) +
      '<div class="mv-grid2 mv-wide-l"><div class="mv-s3"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">ลากเพื่อหมุนมุมมอง · สเกลทั้งสามแกนเท่ากัน (มุมฉากจึงดูเป็นมุมฉากจริง) · T สีส้ม · N สีฟ้า · B สีเขียว · วงกลมออสคิวเลติงมีรัศมี R = 1/κ และอยู่ในระนาบของ T กับ N</p>';
    var out = box.querySelector(".mv-out"), scene = new Scene3D(box.querySelector(".mv-s3"), { label: "เส้นโค้งในอวกาศ r(t) พร้อมกรอบ Frenet T N B (space curve with Frenet frame)", ratio: 0.9, equal: true });
    function draw() {
      var X, Y, Z, a, b;
      try {
        X = MVC.parse(st.x, ["t"]); Y = MVC.parse(st.y, ["t"]); Z = MVC.parse(st.z, ["t"]); a = cnum(st.t0); b = cnum(st.t1);
      } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ' + esc(e.message) + "</p>"; return; }
      if (!(b > a)) { out.innerHTML = '<p class="lap-err">⚠ ต้องให้ t เริ่มน้อยกว่า t สิ้นสุด</p>'; return; }
      var C = MVC.curve(X, Y, Z), t = a + (b - a) * st.s, q = C.at(t), N = 400, k, pts = [];
      for (k = 0; k <= N; k++) pts.push(C.r(a + (b - a) * k / N));
      var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      pts.forEach(function (p) { for (var i = 0; i < 3; i++) if (isFinite(p[i])) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } });
      var ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) || 1, L = ext * 0.22;
      var items = [{ type: "line", pts: pts, color: css("--ink-2"), w: 2.2, layer: 1 }];
      var acc = css("--accent"), sig = css("--signal"), okc = css("--ok"), ink = css("--ink");
      // part of the curve already travelled, in accent
      var done = []; for (k = 0; k <= Math.round(N * st.s); k++) done.push(C.r(a + (b - a) * k / N));
      items.push({ type: "line", pts: done, color: acc, w: 3.2, layer: 1 });
      var p0 = q.r;
      if (isFinite(q.T[0])) {
        if (st.T) items.push({ type: "arrow", a: p0, b: vadd(p0, vsc(q.T, L)), color: acc, w: 3, label: "T", layer: 2, noBox: true });
        if (st.N && isFinite(q.N[0])) items.push({ type: "arrow", a: p0, b: vadd(p0, vsc(q.N, L)), color: sig, w: 3, label: "N", layer: 2, noBox: true });
        if (st.B && isFinite(q.B[0])) items.push({ type: "arrow", a: p0, b: vadd(p0, vsc(q.B, L)), color: okc, w: 3, label: "B", layer: 2, noBox: true });
        if (st.va) {
          var vs = L / (q.speed || 1);
          items.push({ type: "arrow", a: p0, b: vadd(p0, vsc(q.v, vs)), color: ink, w: 2, dash: [5, 3], label: "v", layer: 2, noBox: true });
          var asz = Math.hypot(q.a[0], q.a[1], q.a[2]) || 1;
          items.push({ type: "arrow", a: p0, b: vadd(p0, vsc(q.a, L / asz)), color: css("--ink-3"), w: 2, dash: [2, 3], label: "a", layer: 2, noBox: true });
        }
        if (st.osc && isFinite(q.kappa) && q.kappa > 1e-9 && isFinite(q.N[0])) {
          var R = 1 / q.kappa, cen = vadd(p0, vsc(q.N, R)), circ = [];
          if (R < ext * 4) { for (k = 0; k <= 72; k++) { var ph = 2 * PI * k / 72; circ.push(vadd(cen, vadd(vsc(q.N, -R * Math.cos(ph)), vsc(q.T, R * Math.sin(ph))))); } items.push({ type: "line", pts: circ, color: sig, w: 1.6, dash: [6, 4], layer: 1, noBox: true }); items.push({ type: "point", p: cen, r: 3, color: sig, layer: 2, noBox: true }); }
        }
      }
      items.push({ type: "point", p: p0, r: 5.5, color: acc, layer: 2, noBox: true });
      var cx = (lo[0] + hi[0]) / 2, cy = (lo[1] + hi[1]) / 2, cz = (lo[2] + hi[2]) / 2, hv = ext / 2 * 1.08;
      scene.set(items, [cx - hv, cx + hv, cy - hv, cy + hv, cz - hv, cz + hv]);
      var s = C.length(a, t);
      var v1 = C.d1.map(function (z) { return MVC.tex(z); }), v2 = C.d2.map(function (z) { return MVC.tex(z); });
      out.innerHTML = '<div class="mv-eqs">' + T("\\mathbf r'(t)=\\langle " + v1.join(",\\ ") + "\\rangle", true) + T("\\mathbf r''(t)=\\langle " + v2.join(",\\ ") + "\\rangle", true) + "</div>" +
        '<div class="mv-kv"><div><b>t</b><span>' + fmt(t, 5) + "</span></div><div><b>r(t)</b><span>(" + q.r.map(function (z) { return fmt(z, 4); }).join(", ") + ")</span></div><div><b>v = r′(t)</b><span>(" + q.v.map(function (z) { return fmt(z, 4); }).join(", ") + ")</span></div><div><b>อัตราเร็ว |v|</b><span>" + fmt(q.speed, 5) + "</span></div><div><b>ความเร่ง a = r″</b><span>(" + q.a.map(function (z) { return fmt(z, 4); }).join(", ") + ")</span></div>" +
        "<div><b>ความโค้ง κ</b><span>" + fmt(q.kappa, 5) + "</span></div><div><b>รัศมีความโค้ง R = 1/κ</b><span>" + (isFinite(q.R) ? fmt(q.R, 5) : "∞ (เส้นตรง)") + "</span></div><div><b>torsion τ</b><span>" + fmt(q.tau, 5) + "</span></div><div><b>a<sub>T</sub> = v·a/|v|</b><span>" + fmt(q.aT, 5) + "</span></div><div><b>a<sub>N</sub> = κ|v|²</b><span>" + fmt(q.aN, 5) + "</span></div><div><b>ความยาวส่วนโค้ง s</b><span>" + fmt(s, 6) + "</span></div><div><b>ความยาวทั้งหมด L</b><span>" + fmt(C.length(a, b), 6) + "</span></div></div>" +
        '<div class="lap-ans">' + T("\\kappa=\\frac{|\\mathbf r'\\times\\mathbf r''|}{|\\mathbf r'|^3}=" + tn(q.kappa, 5) + ",\\qquad \\tau=\\frac{(\\mathbf r'\\times\\mathbf r'')\\cdot\\mathbf r'''}{|\\mathbf r'\\times\\mathbf r''|^2}=" + tn(q.tau, 5), true) + T("s=\\int_{t_0}^{t}|\\mathbf r'|\\,du=" + tn(s, 5), true) + "</div>";
    }
    ["x", "y", "z", "t0", "t1"].forEach(function (k) { var i = box.querySelector('[data-in="' + k + '"]'); i.addEventListener("input", debounce(function () { st[k] = i.value; draw(); }, 300)); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]"); if (!b) return;
      var p = pre[+b.getAttribute("data-pre")]; st.x = p[1]; st.y = p[2]; st.z = p[3]; st.t0 = p[4]; st.t1 = p[5];
      ["x", "y", "z", "t0", "t1"].forEach(function (k) { box.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw();
    });
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { st[c.getAttribute("data-chk")] = c.checked; draw(); }); });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) {
      Object.keys(o).forEach(function (k) { if (k !== "show") st[k] = o[k]; });
      if (o.show !== undefined) { var sh = String(o.show).split(","); ["T", "N", "B", "osc", "va"].forEach(function (k) { st[k] = sh.indexOf(k) >= 0; var c = box.querySelector('[data-chk="' + k + '"]'); if (c) c.checked = st[k]; }); }
      ["x", "y", "z", "t0", "t1"].forEach(function (k) { box.querySelector('[data-in="' + k + '"]').value = st[k]; }); setSlider(box, "s", st.s); draw();
    };
    draw();
  }

  /* ================================================================== mv-field */
  var FIELD_PRE = [
    ["หมุนรอบ F = (−y, x)", "-y", "x", 3],
    ["แผ่ออก F = (x, y)", "x", "y", 3],
    ["เฉือน F = (y, 0)", "y", "0", 3],
    ["อานม้า F = (x, −y)", "x", "-y", 3],
    ["อนุรักษ์ F = ∇(x²y) = (2xy, x²)", "2*x*y", "x^2", 3],
    ["ไม่อนุรักษ์ F = (y², x)", "y^2", "x", 3],
    ["ประจุเส้น E ∝ (x, y)/r²", "x/(x^2+y^2)", "y/(x^2+y^2)", 3],
    ["การไหลรอบทรงกระบอก (potential flow)", "1-(x^2-y^2)/(x^2+y^2)^2", "-2*x*y/(x^2+y^2)^2", 3],
    ["ไดโพลไฟฟ้า (2 ประจุ)", "(x+1)/((x+1)^2+y^2)^1.5-(x-1)/((x-1)^2+y^2)^1.5", "y/((x+1)^2+y^2)^1.5-y/((x-1)^2+y^2)^1.5", 3]
  ];
  function diverge(v) { // v in [-1,1] → rgba (blue negative, orange positive)
    var a = Math.min(1, Math.abs(v)) * 0.5;
    return v >= 0 ? "rgba(201,79,24," + a.toFixed(3) + ")" : "rgba(31,95,168," + a.toFixed(3) + ")";
  }
  function initField(box) {
    var d = box.dataset;
    var st = { p: d.p || "-y", q: d.q || "x", r: +(d.r || 3), px: +(d.px != null ? d.px : 1), py: +(d.py != null ? d.py : 0.5), rho: +(d.rho || 0.8), bg: d.bg || "none", flow: false, lines: d.lines !== undefined };
    var pre = dataObj(box, "presets") || FIELD_PRE;
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + chips(pre, "data-pre") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">P(x,y) =</label><input class="lap-in" data-in="p" value="' + esc(st.p) + '" spellcheck="false"><label class="lap-lbl">Q(x,y) =</label><input class="lap-in" data-in="q" value="' + esc(st.q) + '" spellcheck="false"></div>' +
      '<div class="lap-chips mv-bgs"><span class="lap-lbl">สีพื้น:</span><button type="button" class="lap-chip" data-bg="none">ไม่มี</button><button type="button" class="lap-chip" data-bg="div">ดีเวอร์เจนซ์ ∇·F</button><button type="button" class="lap-chip" data-bg="curl">เคิร์ล ∇×F</button><button type="button" class="lap-chip" data-bg="mag">ขนาด |F|</button></div>' +
      slider("rho", "รัศมีวงกลมทดสอบ ρ", 0.05, 2, 0.01, st.rho) +
      checks([["lines", "เส้นกระแส (streamlines)", st.lines], ["flow", "อนุภาคไหลตามสนาม (animate)", false]]) +
      '<div class="mv-grid2 mv-wide-l"><div class="mv-sm"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">ลากจุดสีส้มเพื่อย้ายจุดทดสอบ · วงกลมทดสอบวัด “การหมุนสุทธิ” (circulation ∮F·dr) และ “การไหลออกสุทธิ” (flux ∮F·n ds) หารด้วยพื้นที่ แล้วเทียบกับ curl และ div ที่คำนวณจากอนุพันธ์ — ยิ่ง ρ เล็กยิ่งตรงกัน</p>';
    var out = box.querySelector(".mv-out"), map = null, P, Q, PX, PY, QX, QY, grid = null, key = "", raf = 0, parts = [];
    function build() {
      P = compileIn(st.p, ["x", "y"], out, "P"); Q = compileIn(st.q, ["x", "y"], out, "Q"); if (!P || !Q) return false;
      PX = MVC.compile(MVC.d(P.ast, "x"), ["x", "y"]); PY = MVC.compile(MVC.d(P.ast, "y"), ["x", "y"]); QX = MVC.compile(MVC.d(Q.ast, "x"), ["x", "y"]); QY = MVC.compile(MVC.d(Q.ast, "y"), ["x", "y"]);
      var k = st.p + "|" + st.q + "|" + st.r + "|" + st.bg + "|" + st.lines;
      if (k !== key) {
        key = k;
        var R = st.r;
        map = new Map2D(box.querySelector(".mv-sm"), { x0: -R, x1: R, y0: -R, y1: R, w: 520, label: "สนามเวกเตอร์ 2 มิติ F(x,y) = (P,Q) พร้อมวงกลมทดสอบ (2D vector field with divergence and curl)" });
        var s = "", n = 17, i, j, mags = [], vec = [];
        for (j = 0; j < n; j++) for (i = 0; i < n; i++) { var x = -R + 2 * R * (i + 0.5) / n, y = -R + 2 * R * (j + 0.5) / n, a = P(x, y), b = Q(x, y); if (isFinite(a) && isFinite(b)) { vec.push([x, y, a, b]); mags.push(Math.hypot(a, b)); } }
        var mx = mags.slice().sort(function (p, q) { return p - q; })[Math.floor(mags.length * 0.95)] || 1;
        if (st.bg !== "none") {
          var gN = 40, vals = [], mm = 0, xs = [], ys = [];
          for (j = 0; j < gN; j++) { var row = []; ys.push(-R + 2 * R * (j + 0.5) / gN); for (i = 0; i < gN; i++) { if (j === 0) xs.push(-R + 2 * R * (i + 0.5) / gN); var xx = xs[i], yy = ys[j], v; if (st.bg === "div") v = PX(xx, yy) + QY(xx, yy); else if (st.bg === "curl") v = QX(xx, yy) - PY(xx, yy); else v = Math.hypot(P(xx, yy), Q(xx, yy)); row.push(isFinite(v) ? v : 0); if (isFinite(v)) mm = Math.max(mm, Math.abs(v)); } vals.push(row); }
          var cap = vals.reduce(function (acc, r) { return acc.concat(r.map(Math.abs)); }, []).sort(function (a, b) { return a - b; })[Math.floor(gN * gN * 0.97)] || mm || 1;
          var cw = 2 * R / gN;
          for (j = 0; j < gN; j++) for (i = 0; i < gN; i++) {
            var vv = vals[j][i], fill = st.bg === "mag" ? MVL.rgb(MVL.cmap(Math.min(1, vv / cap))) : null;
            s += '<rect x="' + map.sx(xs[i] - cw / 2).toFixed(1) + '" y="' + map.sy(ys[j] + cw / 2).toFixed(1) + '" width="' + (map.sx(cw) - map.sx(0) + 0.6).toFixed(1) + '" height="' + (map.sy(0) - map.sy(cw) + 0.6).toFixed(1) + '" fill="' + (fill ? fill : diverge(vv / cap)) + '"' + (fill ? ' opacity=".45"' : "") + "/>";
          }
        }
        var len = 2 * R / n * 0.78;
        vec.forEach(function (v) {
          var m = Math.hypot(v[2], v[3]); if (m < 1e-12) return;
          var l = len * (0.35 + 0.65 * Math.min(1, m / mx));
          s += map.arrow(v[0] - v[2] / m * l / 2, v[1] - v[3] / m * l / 2, v[0] + v[2] / m * l / 2, v[1] + v[3] / m * l / 2, MVL.rgb(MVL.cmap(Math.min(1, m / mx) * 0.9 + 0.05)), 1.8);
        });
        if (st.lines) {
          var seeds = [], sn = 9; for (j = 0; j < sn; j++) for (i = 0; i < sn; i++) seeds.push([-R + 2 * R * (i + 0.5) / sn, -R + 2 * R * (j + 0.5) / sn]);
          seeds.forEach(function (sd) {
            [1, -1].forEach(function (dir) {
              var x = sd[0], y = sd[1], pts = [[x, y]], stp = R * 0.02;
              for (var k2 = 0; k2 < 90; k2++) {
                var f = function (px, py) { var a = P(px, py), b = Q(px, py), m = Math.hypot(a, b); return m > 1e-9 && isFinite(m) ? [dir * a / m, dir * b / m] : null; };
                var k1 = f(x, y); if (!k1) break; var k2v = f(x + k1[0] * stp / 2, y + k1[1] * stp / 2); if (!k2v) break; var k3 = f(x + k2v[0] * stp / 2, y + k2v[1] * stp / 2); if (!k3) break; var k4 = f(x + k3[0] * stp, y + k3[1] * stp); if (!k4) break;
                x += stp * (k1[0] + 2 * k2v[0] + 2 * k3[0] + k4[0]) / 6; y += stp * (k1[1] + 2 * k2v[1] + 2 * k3[1] + k4[1]) / 6;
                if (Math.abs(x) > R || Math.abs(y) > R) break; pts.push([x, y]);
              }
              if (pts.length > 3) s += map.poly(pts, "rgba(31,95,168,.55)", 1.3, "none", false);
            });
          });
        }
        map.setStatic(s);
        map.accept = function (x, y) { return Math.hypot(map.sx(x) - map.sx(st.px), map.sy(y) - map.sy(st.py)) < 30; };
        map.onPoint = function (x, y) { st.px = Math.max(-R, Math.min(R, x)); st.py = Math.max(-R, Math.min(R, y)); draw(); };
      }
      return true;
    }
    function circleInt(px, py, rho) {
      var circ = MVC.quad(function (t) { var x = px + rho * Math.cos(t), y = py + rho * Math.sin(t); return P(x, y) * (-rho * Math.sin(t)) + Q(x, y) * (rho * Math.cos(t)); }, 0, 2 * PI, 24, 4);
      var flux = MVC.quad(function (t) { var x = px + rho * Math.cos(t), y = py + rho * Math.sin(t); return (P(x, y) * Math.cos(t) + Q(x, y) * Math.sin(t)) * rho; }, 0, 2 * PI, 24, 4);
      return { circ: circ, flux: flux };
    }
    function draw() {
      if (!P && !build()) return;
      if (!build()) return;
      var px = st.px, py = st.py, rho = st.rho, A = PI * rho * rho;
      var cv = circleInt(px, py, rho), curl = QX(px, py) - PY(px, py), div = PX(px, py) + QY(px, py), f = [P(px, py), Q(px, py)];
      var acc = css("--accent"), sig = css("--signal"), ov = "", i;
      var cp = []; for (i = 0; i <= 72; i++) cp.push([px + rho * Math.cos(2 * PI * i / 72), py + rho * Math.sin(2 * PI * i / 72)]);
      ov += map.poly(cp, "var(--ink)", 2.4, "rgba(255,255,255,.12)", true);
      ov += map.arrow(px + rho, py, px + rho - rho * 0.001, py + rho * 0.12, "var(--ink)", 2.2);
      if (isFinite(f[0]) && isFinite(f[1])) { var fm = Math.hypot(f[0], f[1]) || 1, ln = st.r * 0.28; ov += map.arrow(px, py, px + f[0] / fm * ln, py + f[1] / fm * ln, acc, 3); }
      ov += map.dot(px, py, 6.5, acc);
      map.setDyn(ov);
      var conservative = MVC.Sub(MVC.d(Q.ast, "x"), MVC.d(P.ast, "y"));
      var isZero = isZeroExpr(conservative, ["x", "y"]);
      out.innerHTML = '<div class="mv-eqs">' + T("\\nabla\\!\\cdot\\!\\mathbf F=P_x+Q_y=" + MVC.tex(MVC.Add(MVC.d(P.ast, "x"), MVC.d(Q.ast, "y"))), true) + T("\\nabla\\!\\times\\!\\mathbf F=Q_x-P_y=" + MVC.tex(conservative), true) + "</div>" +
        '<div class="mv-kv"><div><b>F ที่จุด</b><span>(' + fmt(f[0], 4) + ", " + fmt(f[1], 4) + ")</span></div><div><b>div F (จากสูตร)</b><span>" + fmt(div, 5) + "</span></div><div><b>flux ÷ พื้นที่ (วัดบนวงกลม)</b><span>" + fmt(cv.flux / A, 5) + "</span></div><div><b>curl F (จากสูตร)</b><span>" + fmt(curl, 5) + "</span></div><div><b>circulation ÷ พื้นที่ (วัดบนวงกลม)</b><span>" + fmt(cv.circ / A, 5) + "</span></div></div>" +
        '<div class="lap-ans">' + T("\\oint_C \\mathbf F\\!\\cdot\\! d\\mathbf r = " + tn(cv.circ, 5) + "\\ \\approx\\ \\iint\\! (\\nabla\\!\\times\\!\\mathbf F)\\,dA\\approx " + tn(curl * A, 5) + "\\qquad \\oint_C \\mathbf F\\!\\cdot\\!\\mathbf n\\,ds = " + tn(cv.flux, 5) + "\\ \\approx\\ \\iint\\! (\\nabla\\!\\cdot\\!\\mathbf F)\\,dA\\approx " + tn(div * A, 5), true) + "</div>" +
        '<p class="lap-note">' + (isZero ? "✔ curl F ≡ 0 ทุกจุด ดังนั้นสนามนี้เป็นสนามอนุรักษ์ (conservative) ในบริเวณที่ไม่มีรู — มี potential φ ที่ F = ∇φ และงานตามเส้นทางไม่ขึ้นกับเส้นทาง" : "✘ curl F ไม่เป็นศูนย์ทุกจุด สนามนี้ไม่อนุรักษ์: งาน ∮F·dr รอบวงปิดโดยทั่วไป ≠ 0") + "</p>";
    }
    // animated particles
    function stopFlow() { cancelAnimationFrame(raf); raf = 0; if (map) map.setTop(""); }
    function startFlow() {
      if (MVL.reduced) { box.querySelector('[data-chk=flow]').checked = false; st.flow = false; return; }
      if (!build()) return;
      var R = st.r, N = 70, i;
      parts = []; for (i = 0; i < N; i++) parts.push({ x: (Math.random() * 2 - 1) * R, y: (Math.random() * 2 - 1) * R, tr: [], age: Math.floor(Math.random() * 60) });
      var last = 0;
      (function step(ts) {
        if (!st.flow) return;
        raf = requestAnimationFrame(step);
        if (ts - last < 33) return; last = ts;
        var s = "";
        parts.forEach(function (p) {
          var a = P(p.x, p.y), b = Q(p.x, p.y), m = Math.hypot(a, b);
          if (!isFinite(m) || p.age > 90 || Math.abs(p.x) > R || Math.abs(p.y) > R) { p.x = (Math.random() * 2 - 1) * R; p.y = (Math.random() * 2 - 1) * R; p.tr = []; p.age = 0; return; }
          var sp = R * 0.012 * (0.4 + Math.min(1.6, m / (1 + m) * 2));
          if (m > 1e-9) { p.x += a / m * sp; p.y += b / m * sp; }
          p.tr.push([p.x, p.y]); if (p.tr.length > 14) p.tr.shift(); p.age++;
          if (p.tr.length > 1) s += map.poly(p.tr, "var(--accent)", 2, "none", false);
        });
        map.setTop("<g>" + s + "</g>");
      })(0);
    }
    ["p", "q"].forEach(function (k) { var inp = box.querySelector('[data-in="' + k + '"]'); inp.addEventListener("input", debounce(function () { st[k] = inp.value; key = ""; P = null; draw(); }, 300)); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]");
      if (b) { var p = pre[+b.getAttribute("data-pre")]; st.p = p[1]; st.q = p[2]; if (p[3]) st.r = p[3]; box.querySelector('[data-in="p"]').value = st.p; box.querySelector('[data-in="q"]').value = st.q; key = ""; P = null; draw(); return; }
      var g = e.target.closest("[data-bg]"); if (g) { st.bg = g.getAttribute("data-bg"); key = ""; P = null; $$("[data-bg]", box).forEach(function (c) { c.classList.toggle("on", c === g); }); draw(); }
    });
    $$("[data-bg]", box).forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-bg") === st.bg); });
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { var k = c.getAttribute("data-chk"); st[k] = c.checked; if (k === "lines") { key = ""; P = null; draw(); } else if (k === "flow") { if (c.checked) startFlow(); else stopFlow(); } }); });
    bindSliders(box, st, function () { draw(); });
    if (root.IntersectionObserver) new IntersectionObserver(function (en) { en.forEach(function (x) { if (!x.isIntersecting) { cancelAnimationFrame(raf); } else if (st.flow) startFlow(); }); }).observe(box);
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); var lc = box.querySelector("[data-chk=lines]"); if (lc) lc.checked = !!st.lines; box.querySelector('[data-in="p"]').value = st.p; box.querySelector('[data-in="q"]').value = st.q; key = ""; P = null; setSlider(box, "rho", st.rho); $$("[data-bg]", box).forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-bg") === st.bg); }); draw(); };
    draw();
  }

  /* ================================================================== mv-flux — divergence theorem and Stokes */
  var GAUSS_PRE = [
    ["F = (x, y, z)", "x", "y", "z"], ["F = (x³, y³, z³)", "x^3", "y^3", "z^3"], ["F = (xy, yz, zx)", "x*y", "y*z", "z*x"], ["F = (x², y², z²)", "x^2", "y^2", "z^2"],
    ["F = (x, y, z)/ρ³ (ประจุจุด)", "x/(x^2+y^2+z^2)^1.5", "y/(x^2+y^2+z^2)^1.5", "z/(x^2+y^2+z^2)^1.5"], ["F = (y, −x, z²)", "y", "-x", "z^2"]
  ];
  var STOKES_PRE = [
    ["F = (−y, x, 0)", "-y", "x", "0"], ["F = (z, x, y)", "z", "x", "y"], ["F = (y², z², x²)", "y^2", "z^2", "x^2"], ["F = (−y, x, z)", "-y", "x", "z"], ["F = (x² z, x y, y²)", "x^2*z", "x*y", "y^2"]
  ];
  function initFlux(box) {
    var d = box.dataset, mode = d.mode || "gauss";
    var st = { mode: mode, p: d.p || "x", q: d.q || "y", r: d.r || "z", solid: d.solid || "sphere", surf: d.surf || "hemi", a: +(d.a || 1), h: +(d.h || 2) };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="mv-modes lap-chips"><button type="button" class="lap-chip" data-tab="gauss">ทฤษฎีบทดีเวอร์เจนซ์ (Gauss)</button><button type="button" class="lap-chip" data-tab="stokes">ทฤษฎีบทสโตกส์ (Stokes)</button></div><div class="mv-body"></div>';
    var body = box.querySelector(".mv-body");
    function ui() {
      var pre = st.mode === "gauss" ? GAUSS_PRE : STOKES_PRE;
      body.innerHTML = '<div class="lap-chips">' + chips(pre, "data-pre") + "</div>" +
        '<div class="lap-row"><label class="lap-lbl">P =</label><input class="lap-in sm" data-in="p" value="' + esc(st.p) + '" spellcheck="false"><label class="lap-lbl">Q =</label><input class="lap-in sm" data-in="q" value="' + esc(st.q) + '" spellcheck="false"><label class="lap-lbl">R =</label><input class="lap-in sm" data-in="r" value="' + esc(st.r) + '" spellcheck="false"></div>' +
        '<div class="lap-chips">' + (st.mode === "gauss" ? [["sphere", "ทรงกลม"], ["cube", "ลูกบาศก์"], ["cyl", "ทรงกระบอก"]] : [["hemi", "ครึ่งทรงกลมบน"], ["disk", "แผ่นวงกลม"], ["para", "พาราโบลอยด์ z = a² − r²"]]).map(function (s) { return '<button type="button" class="lap-chip" data-sd="' + s[0] + '">' + s[1] + "</button>"; }).join("") + "</div>" +
        slider("a", st.mode === "gauss" ? "ขนาด a (รัศมี / ครึ่งด้านลูกบาศก์)" : "รัศมีขอบ a", 0.5, 2, 0.05, st.a) + (st.mode === "gauss" ? slider("h", "ความสูงทรงกระบอก h (0 ≤ z ≤ h)", 0.5, 3, 0.1, st.h) : "") +
        '<div class="mv-grid2"><div class="mv-s3"></div><div class="mv-out"></div></div>';
      var inps = ["p", "q", "r"].map(function (k) { var i = body.querySelector('[data-in="' + k + '"]'); i.addEventListener("input", debounce(function () { st[k] = i.value; draw(); }, 300)); return i; });
      void inps;
      bindSliders(body, st, function () { draw(); });
      $$("[data-sd]", body).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-sd") === (st.mode === "gauss" ? st.solid : st.surf)); });
      $$("[data-tab]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === st.mode); });
      body.__scene = new Scene3D(body.querySelector(".mv-s3"), { label: st.mode === "gauss" ? "ผิวปิดและเวกเตอร์สนาม (closed surface for the divergence theorem)" : "ผิวเปิดและเส้นขอบ (surface and boundary curve for Stokes' theorem)", ratio: 0.9, equal: true });
      draw();
    }
    function draw() {
      var out = body.querySelector(".mv-out"), scene = body.__scene, V = ["x", "y", "z"];
      var Pq = compileIn(st.p, V, out, "P"), Qq = compileIn(st.q, V, out, "Q"), Rq = compileIn(st.r, V, out, "R"); if (!Pq || !Qq || !Rq) return;
      var F = [Pq, Qq, Rq], a = st.a, h = st.h, ink = css("--ink"), acc = css("--accent"), sig = css("--signal"), okc = css("--ok");
      var items = [];
      if (st.mode === "gauss") {
        var divA = MVC.Add(MVC.Add(MVC.d(Pq.ast, "x"), MVC.d(Qq.ast, "y")), MVC.d(Rq.ast, "z")), div = MVC.compile(divA, V);
        var faces = [], vol, label;
        if (st.solid === "sphere") {
          faces = [{ n: "ผิวทรงกลม", f: function () { return MVC.quad2(function (u, v) { var x = a * Math.sin(u) * Math.cos(v), y = a * Math.sin(u) * Math.sin(v), z = a * Math.cos(u); return (Pq(x, y, z) * x + Qq(x, y, z) * y + Rq(x, y, z) * z) * a * Math.sin(u); }, 0, PI, 0, 2 * PI, 24, 2); } }];
          vol = MVC.quad3(function (rho, ph, th) { var x = rho * Math.sin(ph) * Math.cos(th), y = rho * Math.sin(ph) * Math.sin(th), z = rho * Math.cos(ph); return div(x, y, z) * rho * rho * Math.sin(ph); }, 0, a, 0, PI, 0, 2 * PI, 16, 2);
          var mesh = []; for (var j = 0; j <= 28; j++) { mesh.push([]); for (var i = 0; i <= 40; i++) { var u = PI * j / 28, v = 2 * PI * i / 40; mesh[j].push([a * Math.sin(u) * Math.cos(v), a * Math.sin(u) * Math.sin(v), a * Math.cos(u)]); } }
          items.push({ type: "mesh", pts: mesh, lo: -a, hi: a, alpha: 0.55, layer: 0 });
        } else if (st.solid === "cube") {
          var fx = function (sgn) { return function () { return MVC.quad2(function (y, z) { return sgn * (sgn > 0 ? Pq(a, y, z) : Pq(-a, y, z)); }, -a, a, -a, a, 20, 1); }; };
          var fy = function (sgn) { return function () { return MVC.quad2(function (x, z) { return sgn * (sgn > 0 ? Qq(x, a, z) : Qq(x, -a, z)); }, -a, a, -a, a, 20, 1); }; };
          var fz = function (sgn) { return function () { return MVC.quad2(function (x, y) { return sgn * (sgn > 0 ? Rq(x, y, a) : Rq(x, y, -a)); }, -a, a, -a, a, 20, 1); }; };
          faces = [{ n: "หน้า x = +a", f: fx(1) }, { n: "หน้า x = −a", f: fx(-1) }, { n: "หน้า y = +a", f: fy(1) }, { n: "หน้า y = −a", f: fy(-1) }, { n: "หน้า z = +a", f: fz(1) }, { n: "หน้า z = −a", f: fz(-1) }];
          vol = MVC.quad3(function (x, y, z) { return div(x, y, z); }, -a, a, -a, a, -a, a, 14, 1);
          [[[-a, -a, -a], [a, -a, -a], [a, a, -a], [-a, a, -a]], [[-a, -a, a], [a, -a, a], [a, a, a], [-a, a, a]], [[-a, -a, -a], [a, -a, -a], [a, -a, a], [-a, -a, a]], [[-a, a, -a], [a, a, -a], [a, a, a], [-a, a, a]], [[-a, -a, -a], [-a, a, -a], [-a, a, a], [-a, -a, a]], [[a, -a, -a], [a, a, -a], [a, a, a], [a, -a, a]]].forEach(function (c) { items.push({ type: "poly", pts: c, fill: "rgba(47,95,168,.18)", stroke: sig, layer: 0 }); });
        } else {
          faces = [{ n: "ผนังข้าง", f: function () { return MVC.quad2(function (z, v) { var x = a * Math.cos(v), y = a * Math.sin(v); return (Pq(x, y, z) * Math.cos(v) + Qq(x, y, z) * Math.sin(v)) * a; }, 0, h, 0, 2 * PI, 20, 1); } },
            { n: "ฝาบน z = h", f: function () { return MVC.quad2(function (r, v) { return Rq(r * Math.cos(v), r * Math.sin(v), h) * r; }, 0, a, 0, 2 * PI, 20, 1); } },
            { n: "ฝาล่าง z = 0", f: function () { return MVC.quad2(function (r, v) { return -Rq(r * Math.cos(v), r * Math.sin(v), 0) * r; }, 0, a, 0, 2 * PI, 20, 1); } }];
          vol = MVC.quad3(function (th, r, z) { return div(r * Math.cos(th), r * Math.sin(th), z) * r; }, 0, 2 * PI, 0, a, 0, h, 16, 1);
          var side = []; for (var j2 = 0; j2 <= 1; j2++) { side.push([]); for (var i2 = 0; i2 <= 48; i2++) { var vv = 2 * PI * i2 / 48; side[j2].push([a * Math.cos(vv), a * Math.sin(vv), h * j2]); } }
          items.push({ type: "mesh", pts: side, lo: 0, hi: h, alpha: 0.5, layer: 0 });
          [0, h].forEach(function (z) { var c = []; for (var i3 = 0; i3 <= 48; i3++) c.push([a * Math.cos(2 * PI * i3 / 48), a * Math.sin(2 * PI * i3 / 48), z]); items.push({ type: "poly", pts: c, fill: "rgba(47,95,168,.18)", stroke: sig, layer: 0 }); });
        }
        var vals = faces.map(function (f) { return f.f(); }), tot = vals.reduce(function (s, v) { return s + v; }, 0);
        scene.set(items);
        var rows = faces.map(function (f, i) { return "<tr><td>" + f.n + "</td><td>" + fmt(vals[i], 7) + "</td></tr>"; }).join("");
        var sing = /\^1\.5/.test(st.p) && /\^1\.5/.test(st.r);
        out.innerHTML = '<div class="mv-eqs">' + T("\\nabla\\!\\cdot\\!\\mathbf F=" + MVC.tex(divA), true) + T("\\oint\\!\\!\\!\\oint_S \\mathbf F\\!\\cdot\\!\\mathbf n\\,dS\\ \\overset{?}{=}\\ \\iiint_E \\nabla\\!\\cdot\\!\\mathbf F\\,dV", true) + "</div>" +
          '<div class="table-wrap"><table class="lap-pt mv-tab"><thead><tr><th>ผิว</th><th>ฟลักซ์ออก ∬F·n dS</th></tr></thead><tbody>' + rows + '<tr><td><b>รวมทุกผิว</b></td><td><b>' + fmt(tot, 8) + "</b></td></tr></tbody></table></div>" +
          '<div class="mv-kv"><div><b>ฟลักซ์รวมผ่านผิวปิด</b><span>' + fmt(tot, 8) + "</span></div><div><b>∭ ∇·F dV</b><span>" + fmt(vol, 8) + "</span></div><div><b>ผลต่าง</b><span>" + fmt(tot - vol, 3) + "</span></div></div>" +
          '<p class="lap-note">' + (Math.abs(tot - vol) < 1e-5 * Math.max(1, Math.abs(tot)) ? "✔ สองค่าเท่ากัน ตรงตามทฤษฎีบทดีเวอร์เจนซ์" : (sing ? "✘ ไม่เท่ากันเพราะ F ไม่นิยามที่จุดกำเนิด (∇·F = 0 ทุกที่ยกเว้นที่ ρ = 0) ทฤษฎีบทใช้ได้เมื่อ F เรียบทั่วบริเวณ — ฟลักซ์ 4π คือ “ประจุ” ที่จุดนั้น (กฎของเกาส์)" : "✘ ไม่เท่ากัน: ตรวจว่า F เรียบภายในผิวทั้งหมดหรือไม่")) + "</p>";
      } else {
        var curl = MVC.curl([Pq.ast, Qq.ast, Rq.ast], V), cf = curl.map(function (c) { return MVC.compile(c, V); }), S, u0, u1, v0, v1;
        var asty = function (src) { return MVC.parse(src.replace(/\ba\b/g, "(" + a + ")"), ["u", "v"]); };
        if (st.surf === "hemi") { S = MVC.surface(asty("a*sin(u)*cos(v)"), asty("a*sin(u)*sin(v)"), asty("a*cos(u)")); u0 = 0; u1 = PI / 2; v0 = 0; v1 = 2 * PI; }
        else if (st.surf === "disk") { S = MVC.surface(asty("u*cos(v)"), asty("u*sin(v)"), MVC.Num(0)); u0 = 0; u1 = a; v0 = 0; v1 = 2 * PI; }
        else { S = MVC.surface(asty("u*cos(v)"), asty("u*sin(v)"), asty("a^2-u^2")); u0 = 0; u1 = a; v0 = 0; v1 = 2 * PI; }
        var surfInt = S.flux(cf, u0, u1, v0, v1, 24);
        var circ = MVC.quad(function (t) { var x = a * Math.cos(t), y = a * Math.sin(t), z = 0; return Pq(x, y, z) * (-a * Math.sin(t)) + Qq(x, y, z) * (a * Math.cos(t)); }, 0, 2 * PI, 24, 2);
        var nu = 24, nv = 40, mesh2 = []; for (var jj = 0; jj <= nu; jj++) { mesh2.push([]); for (var ii = 0; ii <= nv; ii++) mesh2[jj].push(S.p(u0 + (u1 - u0) * jj / nu, v0 + (v1 - v0) * ii / nv)); }
        var zr = [Math.min.apply(null, [].concat.apply([], mesh2).map(function (p) { return p[2]; })), Math.max.apply(null, [].concat.apply([], mesh2).map(function (p) { return p[2]; }))];
        items.push({ type: "mesh", pts: mesh2, lo: zr[0] - 0.01, hi: zr[1] + 0.01, alpha: 0.6, layer: 0 });
        var bc = []; for (var k = 0; k <= 80; k++) bc.push([a * Math.cos(2 * PI * k / 80), a * Math.sin(2 * PI * k / 80), 0]);
        items.push({ type: "line", pts: bc, color: acc, w: 3.4, layer: 2 });
        items.push({ type: "arrow", a: [a, 0, 0], b: [a * Math.cos(0.35), a * Math.sin(0.35), 0], color: acc, w: 3, layer: 2, noBox: true });
        // sample normals
        [[0.6, 0.5], [0.6, 2.3], [0.6, 4.1]].forEach(function (uv) { var pu = u0 + (u1 - u0) * uv[0], pv = uv[1], p = S.p(pu, pv), n = S.n(pu, pv), nl = Math.hypot(n[0], n[1], n[2]) || 1; items.push({ type: "arrow", a: p, b: vadd(p, vsc(n, a * 0.35 / nl)), color: okc, w: 2.4, layer: 2, noBox: true }); });
        scene.set(items);
        out.innerHTML = '<div class="mv-eqs">' + T("\\nabla\\!\\times\\!\\mathbf F=\\langle " + curl.map(function (c) { return MVC.tex(c); }).join(",\\ ") + "\\rangle", true) + T("\\oint_C \\mathbf F\\!\\cdot\\! d\\mathbf r\\ \\overset{?}{=}\\ \\iint_S (\\nabla\\!\\times\\!\\mathbf F)\\!\\cdot\\!\\mathbf n\\,dS", true) + "</div>" +
          '<div class="mv-kv"><div><b>เส้นขอบ ∮F·dr (วงกลมรัศมี a ทวนเข็ม)</b><span>' + fmt(circ, 8) + "</span></div><div><b>∬ (∇×F)·n dS (n ชี้ขึ้น)</b><span>" + fmt(surfInt, 8) + "</span></div><div><b>ผลต่าง</b><span>" + fmt(circ - surfInt, 3) + "</span></div></div>" +
          '<p class="lap-note">' + (Math.abs(circ - surfInt) < 1e-5 * Math.max(1, Math.abs(circ)) ? "✔ สองค่าเท่ากัน ตรงตามทฤษฎีบทสโตกส์ — สังเกตว่าผิวทั้งสามชนิดมีเส้นขอบเดียวกัน จึงให้ค่าเท่ากัน" : "✘ ไม่เท่ากัน: ตรวจทิศ n กับทิศขอบ (กฎมือขวา) และความเรียบของ F") + "</p>";
      }
    }
    box.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab]");
      if (t) { st.mode = t.getAttribute("data-tab"); var p = st.mode === "gauss" ? GAUSS_PRE[0] : STOKES_PRE[0]; st.p = p[1]; st.q = p[2]; st.r = p[3]; ui(); return; }
      var pr = e.target.closest("[data-pre]");
      if (pr) { var pp = (st.mode === "gauss" ? GAUSS_PRE : STOKES_PRE)[+pr.getAttribute("data-pre")]; st.p = pp[1]; st.q = pp[2]; st.r = pp[3]; ["p", "q", "r"].forEach(function (k) { body.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw(); return; }
      var sd = e.target.closest("[data-sd]");
      if (sd) { if (st.mode === "gauss") st.solid = sd.getAttribute("data-sd"); else st.surf = sd.getAttribute("data-sd"); $$("[data-sd]", body).forEach(function (b) { b.classList.toggle("on", b === sd); }); draw(); }
    });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); ui(); };
    ui();
  }

  /* ================================================================== mv-work — line integral of F along two paths (path independence) */
  var WORK_PRE = [
    ["F = (x², xy): เส้นตรง vs พาราโบลา → ต่างกัน", "x^2", "x*y", "t", "t", "t", "t^2"],
    ["F = (y, x) = ∇(xy): ไปจุด (2,3) → เท่ากัน", "y", "x", "2*t", "3*t", "2*t^2", "3*t"],
    ["F = (−y, x): ครึ่งวงกลมบน vs ล่าง → ต่างกัน", "-y", "x", "cos(pi*t)", "sin(pi*t)", "cos(pi*t)", "-sin(pi*t)"],
    ["F = (2xy, x²−3y²) อนุรักษ์", "2*x*y", "x^2-3*y^2", "2*t", "t", "2*t^2", "t^3"],
    ["F = (−y, x)/(x²+y²): ไม่อนุรักษ์เพราะมีรู", "-y/(x^2+y^2)", "x/(x^2+y^2)", "cos(pi*t)", "sin(pi*t)", "cos(pi*t)", "-sin(pi*t)"]
  ];
  function initWork(box) {
    var d = box.dataset, w0 = WORK_PRE[+(d.pre || 0)];
    var st = { p: d.p || w0[1], q: d.q || w0[2], ax: d.ax || w0[3], ay: d.ay || w0[4], bx: d.bx || w0[5], by: d.by || w0[6] };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + chips(WORK_PRE, "data-pre") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">P(x,y) =</label><input class="lap-in" data-in="p" value="' + esc(st.p) + '" spellcheck="false"><label class="lap-lbl">Q(x,y) =</label><input class="lap-in" data-in="q" value="' + esc(st.q) + '" spellcheck="false"></div>' +
      '<div class="lap-row"><label class="lap-lbl" style="color:var(--accent)">เส้นทาง A: x(t), y(t) =</label><input class="lap-in" data-in="ax" value="' + esc(st.ax) + '" spellcheck="false"><input class="lap-in" data-in="ay" value="' + esc(st.ay) + '" spellcheck="false"></div>' +
      '<div class="lap-row"><label class="lap-lbl" style="color:var(--signal)">เส้นทาง B: x(t), y(t) =</label><input class="lap-in" data-in="bx" value="' + esc(st.bx) + '" spellcheck="false"><input class="lap-in" data-in="by" value="' + esc(st.by) + '" spellcheck="false"></div>' +
      '<div class="mv-grid2 mv-wide-l"><div class="mv-sm"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">ทั้งสองเส้นทางใช้พารามิเตอร์ t ตั้งแต่ 0 ถึง 1 และควรเริ่ม-จบที่จุดเดียวกัน · โปรแกรมคำนวณ ∫F·dr = ∫ [P x′ + Q y′] dt เชิงตัวเลข · ถ้า F อนุรักษ์ ทั้งสองเส้นทางต้องได้ค่าเท่ากัน และเท่ากับ f(ปลาย) − f(ต้น)</p>';
    var out = box.querySelector(".mv-out"), host = box.querySelector(".mv-sm");
    function draw() {
      var Pf = compileIn(st.p, ["x", "y"], out, "P"), Qf = compileIn(st.q, ["x", "y"], out, "Q"); if (!Pf || !Qf) return;
      var paths = [];
      try {
        ["a", "b"].forEach(function (k) { paths.push({ x: MVC.fn(st[k + "x"], ["t"]), y: MVC.fn(st[k + "y"], ["t"]) }); });
      } catch (e) { out.innerHTML = '<p class="lap-err">⚠ เส้นทาง: ' + esc(e.message) + "</p>"; return; }
      var pts = [], i, k;
      paths.forEach(function (pa) { for (k = 0; k <= 60; k++) { var t = k / 60; pts.push([pa.x(t), pa.y(t)]); } });
      var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), sp = Math.max(x1 - x0, y1 - y0, 0.5), pd = sp * 0.3, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = sp / 2 + pd;
      var map = new Map2D(host, { x0: cx - half, x1: cx + half, y0: cy - half, y1: cy + half, w: 480, label: "สนามเวกเตอร์และสองเส้นทางสำหรับอินทิกรัลตามเส้น (vector field and two paths for a line integral)" });
      var n = 13, vec = [], mags = [], s1 = "";
      for (var j = 0; j < n; j++) for (i = 0; i < n; i++) { var X = cx - half + 2 * half * (i + 0.5) / n, Y = cy - half + 2 * half * (j + 0.5) / n, a = Pf(X, Y), b = Qf(X, Y); if (isFinite(a) && isFinite(b)) { vec.push([X, Y, a, b]); mags.push(Math.hypot(a, b)); } }
      var mx = mags.slice().sort(function (p, q) { return p - q; })[Math.floor(mags.length * 0.95)] || 1, len = 2 * half / n * 0.8;
      vec.forEach(function (v) { var m = Math.hypot(v[2], v[3]); if (m < 1e-12) return; var l = len * (0.3 + 0.7 * Math.min(1, m / mx)); s1 += map.arrow(v[0] - v[2] / m * l / 2, v[1] - v[3] / m * l / 2, v[0] + v[2] / m * l / 2, v[1] + v[3] / m * l / 2, "rgba(120,130,140,.65)", 1.4); });
      map.setStatic(s1);
      var cols = [css("--accent"), css("--signal")], ov = "", vals = [];
      paths.forEach(function (pa, idx) {
        var pl = []; for (k = 0; k <= 80; k++) { var t = k / 80; pl.push([pa.x(t), pa.y(t)]); }
        ov += map.poly(pl, cols[idx], 3, "none", false);
        var m1 = pl[40], m2 = pl[41]; ov += map.arrow(m1[0], m1[1], m1[0] + (m2[0] - m1[0]) * 4, m1[1] + (m2[1] - m1[1]) * 4, cols[idx], 3);
        var dx = MVC.d(pa.x.ast, "t"), dy = MVC.d(pa.y.ast, "t"), DX = MVC.compile(dx, ["t"]), DY = MVC.compile(dy, ["t"]);
        vals.push(MVC.quad(function (t) { return Pf(pa.x(t), pa.y(t)) * DX(t) + Qf(pa.x(t), pa.y(t)) * DY(t); }, 0, 1, 24, 4));
      });
      ov += map.dot(paths[0].x(0), paths[0].y(0), 6, "var(--ink)", "var(--paper)") + map.text(paths[0].x(0), paths[0].y(0), "A₀", "var(--ink)", 8, -8);
      ov += map.dot(paths[0].x(1), paths[0].y(1), 6, "var(--ink)", "var(--paper)") + map.text(paths[0].x(1), paths[0].y(1), "B₁", "var(--ink)", 8, -8);
      map.setDyn(ov);
      var curl = MVC.Sub(MVC.d(Qf.ast, "x"), MVC.d(Pf.ast, "y")), zero = isZeroExpr(curl, ["x", "y"]);
      var same = Math.abs(vals[0] - vals[1]) < 1e-6 * Math.max(1, Math.abs(vals[0]));
      var sa = [paths[0].x(0), paths[0].y(0)], sb = [paths[0].x(1), paths[0].y(1)], sa2 = [paths[1].x(0), paths[1].y(0)], sb2 = [paths[1].x(1), paths[1].y(1)];
      var sameEnds = Math.hypot(sa[0] - sa2[0], sa[1] - sa2[1]) < 1e-6 && Math.hypot(sb[0] - sb2[0], sb[1] - sb2[1]) < 1e-6;
      out.innerHTML = '<div class="mv-eqs">' + T("\\int_C \\mathbf F\\cdot d\\mathbf r=\\int_0^1\\big[P\\,x'(t)+Q\\,y'(t)\\big]dt,\\qquad Q_x-P_y = " + MVC.tex(curl), true) + "</div>" +
        '<div class="mv-kv"><div><b style="color:' + cols[0] + '">∫ ตามเส้นทาง A</b><span>' + fmt(vals[0], 8) + '</span></div><div><b style="color:' + cols[1] + '">∫ ตามเส้นทาง B</b><span>' + fmt(vals[1], 8) + "</span></div><div><b>ผลต่าง A − B (= ∮ ตามวงปิด A แล้วย้อน B)</b><span>" + fmt(vals[0] - vals[1], 4) + "</span></div></div>" +
        '<p class="lap-note">' + (!sameEnds ? "⚠ สองเส้นทางเริ่ม/จบไม่ตรงกัน จึงเปรียบเทียบเป็น “งานระหว่างสองจุด” ไม่ได้ · " : "") + (zero ? "✔ Q_x − P_y ≡ 0: curl เป็นศูนย์ทุกจุดที่นิยาม" + (same ? " ค่าตามสองเส้นทางเท่ากัน — สอดคล้องกับสนามอนุรักษ์" : " แต่ค่าตามสองเส้นทางต่างกัน! เพราะบริเวณมีรู (สนามไม่นิยามที่จุดกำเนิด) และสองเส้นทางอยู่คนละด้านของรู จึงไม่ใช่สนามอนุรักษ์ทั้งบริเวณ") : (same ? "สองเส้นทางนี้บังเอิญเท่ากัน แต่ curl ≠ 0 จึงไม่รับประกันสำหรับเส้นทางอื่น" : "✘ ต่างกัน: curl ≠ 0 สนามไม่อนุรักษ์ งานขึ้นกับเส้นทาง")) + "</p>";
    }
    ["p", "q", "ax", "ay", "bx", "by"].forEach(function (k) { var i = box.querySelector('[data-in="' + k + '"]'); i.addEventListener("input", debounce(function () { st[k] = i.value; draw(); }, 300)); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]"); if (!b) return;
      var w = WORK_PRE[+b.getAttribute("data-pre")]; st.p = w[1]; st.q = w[2]; st.ax = w[3]; st.ay = w[4]; st.bx = w[5]; st.by = w[6];
      ["p", "q", "ax", "ay", "bx", "by"].forEach(function (k) { box.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw();
    });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); ["p", "q", "ax", "ay", "bx", "by"].forEach(function (k) { box.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw(); };
    draw();
  }

  MVL.register("mv-work", initWork);
  MVL.register("mv-curve", initCurve);
  MVL.register("mv-field", initField);
  MVL.register("mv-flux", initFlux);
  MVL.boot();
})(typeof window !== "undefined" ? window : globalThis);
