/* Multivariable calculus labs, part 2 — optimisation, multiple integrals, change of variables (needs mvc-lab.js)
   <div class="mv-opt" data-mode="crit|lagrange|lsq" data-f="x^3-3x+y^2" data-g="x^2+y^2" data-c="1">
   <div class="mv-int" data-f="x^2+y^2" data-type="rect|typeI|polar" data-a="0" data-b="1" data-c="0" data-d="2" data-n="8">
   <div class="mv-tri" data-sys="rect|cyl|sph" data-f="1" …>
   <div class="mv-jac" data-preset="polar"> */
(function (root) {
  "use strict";
  var MK = root.MK, MVC = root.MVC, MVL = root.MVL;
  if (!MK || !MVC || !MVL) return;
  var PI = Math.PI;
  var $$ = MVL.$$, T = MVL.T, esc = MK.esc, fmt = MVC.fmt, tn = MVC.texNum;
  var slider = MVL.slider, bindSliders = MVL.bindSliders, setSlider = MVL.setSlider, chips = MVL.chips, checks = MVL.checks, debounce = MVL.debounce, compileIn = MVL.compileIn;
  var Scene3D = MVL.Scene3D, Map2D = MVL.Map2D, surfaceItem = MVL.surfaceItem, css = MVL.css;
  var dataObj = function (box, n) { var o = null; try { o = JSON.parse(box.getAttribute("data-" + n) || "null"); } catch (e) { o = null; } return o; };
  var cnum = function (src) { return MVC.fn(String(src), [])(); }; // constant expression such as "pi/2"

  // solve A x = b by Gaussian elimination with partial pivoting (small systems)
  function solveN(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); }), i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i;
      for (j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
      if (Math.abs(M[piv][i]) < 1e-14) return null;
      var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp;
      for (j = i + 1; j < n; j++) { var f = M[j][i] / M[i][i]; for (k = i; k <= n; k++) M[j][k] -= f * M[i][k]; }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) { var s = M[i][n]; for (j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }

  /* ================================================================== mv-opt */
  var CRIT_PRE = [["ชามเลื่อนจุด", "x^2+y^2-2x-4y", 4], ["อานม้า", "x^2-y^2", 3], ["ลูกบาศก์ + พาราโบลา", "x^3-3x+y^2-4y", 3.2], ["ลูกคลื่น (หลายจุด)", "sin(x)*cos(y)", 3.2], ["ภูเขาสองลูก", "2*exp(-((x-1)^2+(y-1)^2))+1.5*exp(-((x+1.2)^2+(y+0.8)^2))", 3], ["x⁴+y⁴−4xy (สามจุดวิกฤต)", "x^4+y^4-4*x*y", 2.5], ["ลิงอานม้า (D = 0)", "x^3-3*x*y^2", 2]];
  var LAG_PRE = [
    ["รั้วรอบ: xy เมื่อ x+y=10", "x*y", "x+y", 10, 8],
    ["xy บนวงกลม x²+y²=2", "x*y", "x^2+y^2", 2, 2.5],
    ["ระยะใกล้ไกลสุดบนวงรี", "x^2+y^2", "x^2/4+y^2", 1, 3],
    ["x+2y บนวงกลมรัศมี √5", "x+2*y", "x^2+y^2", 5, 3.5],
    ["x²y บนวงกลม x²+y²=3", "x^2*y", "x^2+y^2", 3, 2.5]
  ];
  var LSQ_PRE = [
    { n: "ตัวต้านทาน V–I (ไฟฟ้า)", xl: "I (mA)", yl: "V (V)", pts: "1,0.51\n2,1.03\n3,1.49\n4,2.02\n5,2.52\n6,2.98", note: "ความชัน a ≈ R (kΩ)" },
    { n: "สปริง F–x (เครื่องกล)", xl: "x (mm)", yl: "F (N)", pts: "2,4.1\n4,7.8\n6,12.3\n8,15.9\n10,20.2\n12,23.8", note: "ความชัน a ≈ k (N/mm)" },
    { n: "ทรุดตัวของดิน (โยธา)", xl: "q (kPa)", yl: "s (mm)", pts: "25,1.2\n50,2.9\n75,4.1\n100,5.3\n125,6.8\n150,7.7", note: "ความชัน a ≈ การทรุดต่อหน่วยหน่วยแรง" }
  ];

  function initOpt(box) {
    var d = box.dataset, mode = d.mode || "crit";
    var st = { mode: mode, f: d.f || (mode === "lagrange" ? "x*y" : "x^3-3x+y^2-4y"), g: d.g || "x+y", c: d.c != null ? +d.c : 10, r: +(d.r || (mode === "lagrange" ? 8 : 3.2)), pts: d.pts || LSQ_PRE[0].pts, xl: d.xl || LSQ_PRE[0].xl, yl: d.yl || LSQ_PRE[0].yl, a: 0, b: 0, probe: null, pre: 0 };
    box.classList.add("lap-lab", "mv-lab");
    var modes = box.hasAttribute("data-modes") ? d.modes.split(",") : [mode];
    var MODE_L = { crit: "จุดวิกฤต (critical points)", lagrange: "ตัวคูณลากรองจ์ (Lagrange)", lsq: "กำลังสองน้อยสุด (least squares)" };
    box.innerHTML = (modes.length > 1 ? '<div class="mv-modes lap-chips">' + modes.map(function (m) { return '<button type="button" class="lap-chip" data-tab="' + m + '">' + MODE_L[m] + "</button>"; }).join("") + "</div>" : "") + '<div class="mv-body"></div>';
    var body = box.querySelector(".mv-body"), cur = null;

    /* ---------- critical points ---------- */
    function critUI() {
      body.innerHTML = '<div class="lap-row"><label class="lap-lbl">f(x, y) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"></div><div class="lap-chips">' + chips(CRIT_PRE, "data-pre") + "</div>" +
        '<div class="mv-grid2"><div class="mv-s3"></div><div class="mv-sm"></div></div><div class="mv-out"></div>';
      var out = body.querySelector(".mv-out"), scene = new Scene3D(body.querySelector(".mv-s3"), { label: "3D surface พร้อมจุดวิกฤต (surface with critical points)", ratio: 0.8 });
      function draw() {
        var F = compileIn(st.f, ["x", "y"], out, "f"); if (!F) return;
        var R = st.r, grid = MVC.grid(F, -R, R, -R, R, 61, 61), rg = MVC.range(grid);
        var q = [].concat.apply([], grid.z).filter(isFinite).sort(function (a, b) { return a - b; });
        if (q.length) { var a = q[Math.floor(q.length * 0.01)], b = q[Math.min(q.length - 1, Math.floor(q.length * 0.99))]; if (rg[1] - rg[0] > 8 * (b - a)) rg = [a - (b - a) * 0.1, b + (b - a) * 0.1]; }
        if (rg[1] - rg[0] < 1e-9) rg = [rg[0] - 1, rg[1] + 1];
        var pts = []; try { pts = MVC.critical(F.ast, ["x", "y"], [-R, R, -R, R], 15); } catch (e) { pts = []; }
        var map = new Map2D(body.querySelector(".mv-sm"), { x0: -R, x1: R, y0: -R, y1: R, w: 440, label: "contour map และตำแหน่งจุดวิกฤต (critical points on contour map)" });
        var colr = { min: css("--signal"), max: css("--accent"), saddle: css("--ink"), flat: css("--ok") };
        var ov = map.contours(grid, MVC.levels(rg[0], rg[1], 14), rg[0], rg[1], 1.5);
        var items = [surfaceItem(F, -R, R, -R, R, 41, rg)];
        pts.forEach(function (p, i) {
          var L = String.fromCharCode(65 + i);
          ov += map.dot(p.x, p.y, 6.5, colr[p.type], "var(--paper)") + map.text(p.x, p.y, L, "var(--ink)", 8, -8);
          items.push({ type: "point", p: [p.x, p.y, p.z], r: 6, color: colr[p.type], label: L, noBox: true });
        });
        map.setStatic(ov);
        scene.set(items, [-R, R, -R, R, rg[0], rg[1]]);
        var X = MVC.d(F.ast, "x"), Y = MVC.d(F.ast, "y"), H = MVC.hessian(F.ast, ["x", "y"]);
        var rows = pts.map(function (p, i) {
          return "<tr><td><b>" + String.fromCharCode(65 + i) + "</b></td><td>(" + fmt(p.x, 4) + ", " + fmt(p.y, 4) + ")</td><td>" + fmt(p.z, 4) + "</td><td>" + fmt(p.fxx, 4) + "</td><td>" + fmt(p.fxy, 4) + "</td><td>" + fmt(p.fyy, 4) + "</td><td>" + fmt(p.D, 4) + "</td><td>" + p.kind + "</td></tr>";
        }).join("");
        out.innerHTML = '<div class="mv-eqs">' + T("f_x = " + MVC.tex(X) + ",\\qquad f_y = " + MVC.tex(Y), true) + T("\\mathbf H = \\begin{pmatrix}" + MVC.tex(H[0][0]) + "&" + MVC.tex(H[0][1]) + "\\\\" + MVC.tex(H[1][0]) + "&" + MVC.tex(H[1][1]) + "\\end{pmatrix},\\qquad D = f_{xx}f_{yy}-f_{xy}^2", true) + "</div>" +
          (pts.length ? '<div class="table-wrap"><table class="lap-pt mv-tab"><thead><tr><th></th><th>จุด (x, y)</th><th>f</th><th>fₓₓ</th><th>fₓᵧ</th><th>f_yy</th><th>D</th><th>ชนิด</th></tr></thead><tbody>' + rows + "</tbody></table></div>" : '<p class="lap-note">ไม่พบจุดวิกฤตในกรอบ [−' + fmt(R) + ", " + fmt(R) + "]² (ฟังก์ชันที่ไม่มีจุดที่ ∇f = 0 เช่นระนาบ จะไม่มีค่าสุดขีดภายใน)</p>") +
          '<p class="lap-help"><span style="color:' + colr.min + '">●</span> ต่ำสุดสัมพัทธ์ (D &gt; 0, fₓₓ &gt; 0) · <span style="color:' + colr.max + '">●</span> สูงสุดสัมพัทธ์ (D &gt; 0, fₓₓ &lt; 0) · <span style="color:' + colr.saddle + '">●</span> จุดอานม้า (D &lt; 0) · D = 0 ทดสอบนี้ไม่สรุป</p>';
      }
      var inp = body.querySelector('[data-in="f"]'); inp.addEventListener("input", debounce(function () { st.f = inp.value; draw(); }, 300));
      body.addEventListener("click", function (e) { var b = e.target.closest("[data-pre]"); if (!b) return; var p = CRIT_PRE[+b.getAttribute("data-pre")]; st.f = p[1]; st.r = p[2]; inp.value = st.f; draw(); });
      draw();
      return { set: function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); if (o.f !== undefined) inp.value = st.f; draw(); } };
    }

    /* ---------- Lagrange multipliers ---------- */
    function lagUI() {
      body.innerHTML = '<div class="lap-row"><label class="lap-lbl">เป้าหมาย f(x,y) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"></div>' +
        '<div class="lap-row"><label class="lap-lbl">เงื่อนไข g(x,y) =</label><input class="lap-in" data-in="g" value="' + esc(st.g) + '" spellcheck="false" autocomplete="off"><label class="lap-lbl">= c =</label><input class="lap-in sm" data-in="c" value="' + st.c + '"></div>' +
        '<div class="lap-chips">' + chips(LAG_PRE, "data-pre") + '</div><div class="mv-grid2 mv-wide-l"><div class="mv-sm"></div><div class="mv-out"></div></div>' +
        '<p class="lap-help">เส้นหนาสีดำ = เงื่อนไข g = c · เส้นสีคือ f คงที่ · ที่ค่าสุดขีด เส้นชั้น f “สัมผัส” เส้นเงื่อนไข จึง ∇f ขนาน ∇g (∇f = λ∇g) · คลิกบนแผนที่เพื่อตรวจมุมระหว่าง ∇f กับ ∇g ณ จุดใดก็ได้บนเส้นเงื่อนไข</p>';
      var host = body.querySelector(".mv-sm"), out = body.querySelector(".mv-out"), map = null, cache = null;
      function solve() {
        var F = compileIn(st.f, ["x", "y"], out, "f"), G = compileIn(st.g, ["x", "y"], out, "g"); if (!F || !G) return null;
        var R = st.r, V = ["x", "y"], c = st.c;
        var gx = MVC.compile(MVC.d(G.ast, "x"), V), gy = MVC.compile(MVC.d(G.ast, "y"), V), fx = MVC.compile(MVC.d(F.ast, "x"), V), fy = MVC.compile(MVC.d(F.ast, "y"), V);
        var fxx = MVC.compile(MVC.dd(F.ast, "x", "x"), V), fxy = MVC.compile(MVC.dd(F.ast, "x", "y"), V), fyy = MVC.compile(MVC.dd(F.ast, "y", "y"), V);
        var gxx = MVC.compile(MVC.dd(G.ast, "x", "x"), V), gxy = MVC.compile(MVC.dd(G.ast, "x", "y"), V), gyy = MVC.compile(MVC.dd(G.ast, "y", "y"), V);
        var n = 181, ggrid = MVC.grid(function (x, y) { return G(x, y) - c; }, -R, R, -R, R, n, n);
        var segs = MVC.contourSegs(ggrid.z, ggrid.xs, ggrid.ys, 0), h = 2 * R / (n - 1);
        var mids = segs.map(function (s) { var x = (s[0] + s[2]) / 2, y = (s[1] + s[3]) / 2; return { x: x, y: y, f: F(x, y) }; }).filter(function (m) { return isFinite(m.f); });
        // local extremes of f along the constraint curve (neighbour test on the polyline cloud), then Newton on the Lagrange system
        var cand = [], rad = 5 * h;
        mids.forEach(function (m, i) {
          var isMin = true, isMax = true;
          for (var j = 0; j < mids.length; j++) { if (j === i) continue; var q = mids[j]; if (Math.hypot(q.x - m.x, q.y - m.y) < rad) { if (q.f < m.f - 1e-12) isMin = false; if (q.f > m.f + 1e-12) isMax = false; } }
          if (isMin || isMax) cand.push(m);
        });
        var sols = [];
        cand.forEach(function (m) {
          var x = m.x, y = m.y, gxv = gx(x, y), gyv = gy(x, y), lam = (fx(x, y) * gxv + fy(x, y) * gyv) / (gxv * gxv + gyv * gyv || 1), ok = false;
          for (var it = 0; it < 50; it++) {
            var Fv = [fx(x, y) - lam * gx(x, y), fy(x, y) - lam * gy(x, y), G(x, y) - c];
            if (!Fv.every(isFinite)) break;
            if (Math.hypot(Fv[0], Fv[1], Fv[2]) < 1e-11) { ok = true; break; }
            var J = [[fxx(x, y) - lam * gxx(x, y), fxy(x, y) - lam * gxy(x, y), -gx(x, y)], [fxy(x, y) - lam * gxy(x, y), fyy(x, y) - lam * gyy(x, y), -gy(x, y)], [gx(x, y), gy(x, y), 0]];
            var dlt = solveN(J, Fv.map(function (v) { return -v; })); if (!dlt) break;
            x += dlt[0]; y += dlt[1]; lam += dlt[2];
          }
          if (!ok || sols.some(function (s) { return Math.hypot(s.x - x, s.y - y) < 1e-6; })) return;
          sols.push({ x: Math.abs(x) < 1e-10 ? 0 : x, y: Math.abs(y) < 1e-10 ? 0 : y, lam: lam, f: F(x, y) });
        });
        sols.sort(function (a, b) { return a.f - b.f; });
        var fmin = sols.length ? sols[0].f : 0, fmax = sols.length ? sols[sols.length - 1].f : 0;
        sols.forEach(function (s) { s.t = sols.length > 1 && Math.abs(s.f - fmin) < 1e-9 ? "min" : sols.length > 1 && Math.abs(s.f - fmax) < 1e-9 ? "max" : (sols.length === 1 ? "—" : "local"); });
        return { F: F, G: G, fx: fx, fy: fy, gx: gx, gy: gy, segs: segs, mids: mids, sols: sols, R: R, c: c };
      }
      function draw() {
        var S = cache = solve(); if (!S) return;
        var R = S.R;
        var fgrid = MVC.grid(S.F, -R, R, -R, R, 61, 61), rg = MVC.range(fgrid);
        var q = [].concat.apply([], fgrid.z).filter(isFinite).sort(function (a, b) { return a - b; });
        if (q.length) { var a = q[Math.floor(q.length * 0.01)], b = q[Math.min(q.length - 1, Math.floor(q.length * 0.99))]; if (rg[1] - rg[0] > 8 * (b - a)) rg = [a - (b - a) * 0.1, b + (b - a) * 0.1]; }
        map = new Map2D(host, { x0: -R, x1: R, y0: -R, y1: R, w: 500, label: "contour ของ f กับเส้นเงื่อนไข g = c (Lagrange multipliers: level curves tangent to the constraint)" });
        var ov = map.contours(fgrid, MVC.levels(rg[0], rg[1], 16), rg[0], rg[1], 1.2, 0.8);
        // constraint curve
        ov += '<path d="' + S.segs.map(function (s) { return "M" + map.sx(s[0]).toFixed(1) + " " + map.sy(s[1]).toFixed(1) + "L" + map.sx(s[2]).toFixed(1) + " " + map.sy(s[3]).toFixed(1); }).join("") + '" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/>';
        var acc = css("--accent"), sig = css("--signal");
        S.sols.forEach(function (s, i) {
          var L = String.fromCharCode(65 + i), gl = Math.hypot(S.fx(s.x, s.y), S.fy(s.x, s.y)) || 1, gg = Math.hypot(S.gx(s.x, s.y), S.gy(s.x, s.y)) || 1, k = R * 0.22;
          ov += map.arrow(s.x, s.y, s.x + S.fx(s.x, s.y) / gl * k, s.y + S.fy(s.x, s.y) / gl * k, sig, 2.4) + map.arrow(s.x, s.y, s.x + S.gx(s.x, s.y) / gg * k * 0.85, s.y + S.gy(s.x, s.y) / gg * k * 0.85, acc, 2, "4 3");
          ov += map.dot(s.x, s.y, 6, s.t === "min" ? sig : s.t === "max" ? acc : "var(--ink)", "var(--paper)") + map.text(s.x, s.y, L, "var(--ink)", 8, 14);
        });
        map.setStatic(ov);
        map.onPoint = function (x, y) {
          if (!S.mids.length) return;
          var best = null; S.mids.forEach(function (m) { var dd = Math.hypot(m.x - x, m.y - y); if (!best || dd < best.d) best = { d: dd, m: m }; });
          st.probe = best.m; probe();
        };
        probe();
        var rows = S.sols.map(function (s, i) { return "<tr><td><b>" + String.fromCharCode(65 + i) + "</b></td><td>(" + fmt(s.x, 5) + ", " + fmt(s.y, 5) + ")</td><td>" + fmt(s.f, 6) + "</td><td>" + fmt(s.lam, 5) + "</td><td>" + s.t + "</td></tr>"; }).join("");
        var sys = "\\begin{cases}" + "f_x = \\lambda\\,g_x\\\\ f_y = \\lambda\\,g_y\\\\ g(x,y) = " + tn(S.c) + "\\end{cases}";
        out.innerHTML = '<div class="mv-eqs">' + T("\\nabla f = \\lambda\\nabla g\\ \\Rightarrow\\ " + sys, true) + T("f_x = " + MVC.tex(MVC.d(S.F.ast, "x")) + ",\\ f_y = " + MVC.tex(MVC.d(S.F.ast, "y")) + ";\\quad g_x = " + MVC.tex(MVC.d(S.G.ast, "x")) + ",\\ g_y = " + MVC.tex(MVC.d(S.G.ast, "y")), true) + "</div>" +
          (S.sols.length ? '<div class="table-wrap"><table class="lap-pt mv-tab"><thead><tr><th></th><th>จุด (x, y)</th><th>f</th><th>λ</th><th>ชนิด</th></tr></thead><tbody>' + rows + "</tbody></table></div>" : '<p class="lap-note">ไม่พบจุดที่ ∇f ∥ ∇g ในกรอบที่เห็น (ลองขยาย R หรือตรวจเงื่อนไขว่าเป็นเส้นโค้งในกรอบหรือไม่)</p>') + '<div class="mv-probe"></div>';
        probe();
      }
      function probe() {
        var el = out.querySelector(".mv-probe"), S = cache;
        if (!el || !S) return;
        if (!st.probe) { el.innerHTML = '<p class="lap-note">คลิกบนเส้นเงื่อนไขเพื่อตรวจ ∇f และ ∇g ที่จุดนั้น</p>'; map.setDyn(""); return; }
        var p = st.probe, fx = S.fx(p.x, p.y), fy = S.fy(p.x, p.y), gx = S.gx(p.x, p.y), gy = S.gy(p.x, p.y);
        var cr = fx * gy - fy * gx, dt = fx * gx + fy * gy, ang = Math.atan2(cr, dt) * 180 / PI;
        el.innerHTML = '<div class="lap-ans">' + T("\\text{จุด }(" + tn(p.x) + ",\\ " + tn(p.y) + "):\\ f = " + tn(p.f) + ",\\ \\nabla f = (" + tn(fx) + ",\\ " + tn(fy) + "),\\ \\nabla g = (" + tn(gx) + ",\\ " + tn(gy) + ")", true) + T("\\nabla f \\times \\nabla g = " + tn(cr) + "\\quad\\text{มุมระหว่างกัน } " + tn(Math.abs(ang)) + "^\\circ" + (Math.abs(cr) < 1e-3 * (Math.hypot(fx, fy) * Math.hypot(gx, gy) || 1) ? "\\ \\Rightarrow\\ \\text{ขนานกัน: จุดวิกฤตภายใต้เงื่อนไข}" : ""), true) + "</div>";
        var k = st.r * 0.22, gl = Math.hypot(fx, fy) || 1, gg = Math.hypot(gx, gy) || 1;
        map.setDyn(map.arrow(p.x, p.y, p.x + fx / gl * k, p.y + fy / gl * k, css("--signal"), 2.4) + map.arrow(p.x, p.y, p.x + gx / gg * k * 0.85, p.y + gy / gg * k * 0.85, css("--accent"), 2, "4 3") + map.dot(p.x, p.y, 5, "var(--card)", "var(--ink)"));
      }
      ["f", "g", "c"].forEach(function (k) {
        var i = body.querySelector('[data-in="' + k + '"]');
        i.addEventListener("input", debounce(function () { if (k === "c") { st.c = parseFloat(i.value) || 0; } else st[k] = i.value; st.probe = null; draw(); }, 300));
      });
      body.addEventListener("click", function (e) {
        var b = e.target.closest("[data-pre]"); if (!b) return;
        var p = LAG_PRE[+b.getAttribute("data-pre")]; st.f = p[1]; st.g = p[2]; st.c = p[3]; st.r = p[4]; st.probe = null;
        body.querySelector('[data-in="f"]').value = st.f; body.querySelector('[data-in="g"]').value = st.g; body.querySelector('[data-in="c"]').value = st.c; draw();
      });
      draw();
      return { set: function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); st.probe = null; ["f", "g", "c"].forEach(function (k) { body.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw(); } };
    }

    /* ---------- least squares ---------- */
    function parsePts(txt) {
      var P = [];
      String(txt).split(/\n|;/).forEach(function (ln) { var m = ln.trim().split(/[\s,]+/).map(parseFloat); if (m.length >= 2 && isFinite(m[0]) && isFinite(m[1])) P.push([m[0], m[1]]); });
      return P;
    }
    function lsqUI() {
      body.innerHTML = '<div class="lap-chips">' + LSQ_PRE.map(function (p, i) { return '<button type="button" class="lap-chip" data-lp="' + i + '">' + p.n + "</button>"; }).join("") + "</div>" +
        '<div class="lap-row"><label class="lap-lbl">จุดข้อมูล (x, y) บรรทัดละจุด · คลิกบนกราฟเพื่อเพิ่มจุด</label></div><textarea class="mv-ta" data-in="pts" spellcheck="false">' + esc(st.pts) + "</textarea>" +
        slider("a", "ความชัน a ของเส้นที่ลองเอง", -10, 10, 0.01, 0) + slider("b", "จุดตัดแกน b", -10, 10, 0.01, 0) +
        '<div class="mv-grid2"><div class="mv-sm"></div><div class="mv-sp"></div></div><div class="mv-out"></div>';
      var out = body.querySelector(".mv-out"), mapL = null, mapS = null, ta = body.querySelector('[data-in="pts"]'), P = [], fit = null;
      function stats() {
        var n = P.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
        P.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; syy += p[1] * p[1]; });
        var det = n * sxx - sx * sx;
        if (n < 2 || Math.abs(det) < 1e-12) return null;
        var a = (n * sxy - sx * sy) / det, b = (sy - a * sx) / n, S = 0;
        P.forEach(function (p) { var r = p[1] - (a * p[0] + b); S += r * r; });
        var ym = sy / n, sst = syy - n * ym * ym;
        return { n: n, sx: sx, sy: sy, sxx: sxx, sxy: sxy, syy: syy, a: a, b: b, S: S, r2: sst > 0 ? 1 - S / sst : 1 };
      }
      function Sab(a, b) { var S = 0; P.forEach(function (p) { var r = p[1] - (a * p[0] + b); S += r * r; }); return S; }
      function draw(skipRange) {
        P = parsePts(ta.value); st.pts = ta.value;
        fit = stats();
        if (!fit) { out.innerHTML = '<p class="lap-err">⚠ ต้องมีอย่างน้อย 2 จุดที่ค่า x ไม่เท่ากันทั้งหมด</p>'; return; }
        var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), px = (x1 - x0) * 0.15 || 1, py = (y1 - y0) * 0.2 || 1;
        // a, b ranges around the optimum
        var ra = Math.max(1, Math.abs(fit.a) * 1.2 + 0.5), rb = Math.max(1, Math.abs(fit.b) * 1.5 + (y1 - y0) * 0.3);
        if (!skipRange) { var A = body.querySelector('input[data-k="a"]'), B = body.querySelector('input[data-k="b"]'); A.min = (fit.a - ra).toFixed(2); A.max = (fit.a + ra).toFixed(2); B.min = (fit.b - rb).toFixed(2); B.max = (fit.b + rb).toFixed(2); A.step = (ra / 200).toPrecision(1); B.step = (rb / 200).toPrecision(1); if (st.a === 0 && st.b === 0) { st.a = fit.a + ra * 0.5; st.b = fit.b - rb * 0.4; } setSlider(body, "a", st.a.toFixed(3)); setSlider(body, "b", st.b.toFixed(3)); }
        mapL = new Map2D(body.querySelector(".mv-sm"), { x0: Math.min(0, x0 - px), x1: x1 + px, y0: Math.min(0, y0 - py), y1: y1 + py, w: 460, equal: false, h: 340, xl: st.xl, yl: st.yl, label: "กราฟข้อมูลกับเส้นตรงที่พอดีที่สุด (data and least-squares line)" });
        var acc = css("--accent"), sig = css("--signal"), okc = css("--ok"), ov = "";
        var bx0 = mapL.o.x0, bx1 = mapL.o.x1;
        P.forEach(function (p) { ov += mapL.line(p[0], p[1], p[0], st.a * p[0] + st.b, acc, 1.2, "3 3"); });
        ov += mapL.line(bx0, st.a * bx0 + st.b, bx1, st.a * bx1 + st.b, acc, 2, "6 4") + mapL.line(bx0, fit.a * bx0 + fit.b, bx1, fit.a * bx1 + fit.b, okc, 2.8);
        P.forEach(function (p) { ov += mapL.dot(p[0], p[1], 4.5, sig); });
        mapL.setDyn(ov);
        mapL.onPoint = function (x, y, ty) { if (ty !== "down") return; ta.value = ta.value.replace(/\s*$/, "") + "\n" + (+x.toPrecision(4)) + "," + (+y.toPrecision(4)); draw(true); };
        // S(a,b) contour
        var Rr = { a0: fit.a - ra, a1: fit.a + ra, b0: fit.b - rb, b1: fit.b + rb };
        mapS = new Map2D(body.querySelector(".mv-sp"), { x0: Rr.a0, x1: Rr.a1, y0: Rr.b0, y1: Rr.b1, w: 420, equal: false, h: 340, xl: "a", yl: "b", label: "bowl ของผลรวมกำลังสองความคลาดเคลื่อน S(a,b) (sum of squared errors contour)" });
        var g = MVC.grid(Sab, Rr.a0, Rr.a1, Rr.b0, Rr.b1, 61, 61), rg = MVC.range(g);
        var lv = MVC.levels(Math.sqrt(fit.S), Math.sqrt(rg[1]) * 0.8, 10).map(function (v) { return v * v; });
        var bowl = ""; lv.forEach(function (c) { bowl += mapS.contours(g, [c], fit.S, Math.max(rg[1] * 0.64, fit.S + 1e-9), 1.4); });
        mapS.setStatic(bowl);
        mapS.accept = function () { return true; };
        mapS.onPoint = function (x, y) { st.a = Math.max(Rr.a0, Math.min(Rr.a1, x)); st.b = Math.max(Rr.b0, Math.min(Rr.b1, y)); setSlider(body, "a", st.a.toFixed(3)); setSlider(body, "b", st.b.toFixed(3)); upd(); };
        function upd() {
          var S0 = Sab(st.a, st.b), ov2 = "";
          P.forEach(function (p) { ov2 += mapL.line(p[0], p[1], p[0], st.a * p[0] + st.b, acc, 1.2, "3 3"); });
          ov2 += mapL.line(bx0, st.a * bx0 + st.b, bx1, st.a * bx1 + st.b, acc, 2, "6 4") + mapL.line(bx0, fit.a * bx0 + fit.b, bx1, fit.a * bx1 + fit.b, okc, 2.8);
          P.forEach(function (p) { ov2 += mapL.dot(p[0], p[1], 4.5, sig); });
          mapL.setDyn(ov2);
          mapS.setDyn(mapS.dot(fit.a, fit.b, 6, okc) + mapS.dot(st.a, st.b, 6, acc) + mapS.text(fit.a, fit.b, "min", "var(--ok)", 8, -8));
          out.querySelector(".mv-sv").innerHTML = "S(a, b) ของเส้นที่ลอง = <b>" + fmt(S0, 5) + "</b> · S ต่ำสุด = <b>" + fmt(fit.S, 5) + "</b> (เส้นเขียว) · ยิ่งเส้นประเข้าใกล้เส้นเขียว S ยิ่งลดลง";
        }
        body.__upd = upd;
        out.innerHTML = '<p class="lap-note mv-sv"></p><div class="mv-eqs">' + T("S(a,b)=\\sum_{i=1}^{n}\\big(y_i-ax_i-b\\big)^2,\\qquad \\frac{\\partial S}{\\partial a}=0,\\ \\frac{\\partial S}{\\partial b}=0", true) +
          T("\\begin{cases}\\left(\\sum x_i^2\\right)a+\\left(\\sum x_i\\right)b=\\sum x_iy_i\\\\ \\left(\\sum x_i\\right)a+n\\,b=\\sum y_i\\end{cases}\\ \\Rightarrow\\ " + "\\begin{cases}" + tn(fit.sxx, 6) + "\\,a+" + tn(fit.sx, 6) + "\\,b=" + tn(fit.sxy, 6) + "\\\\" + tn(fit.sx, 6) + "\\,a+" + fit.n + "\\,b=" + tn(fit.sy, 6) + "\\end{cases}", true) + "</div>" +
          '<div class="lap-ans">' + T("a = " + tn(fit.a, 5) + ",\\quad b = " + tn(fit.b, 5) + ",\\quad y = " + tn(fit.a, 4) + "x " + (fit.b < 0 ? "-" : "+") + " " + tn(Math.abs(fit.b), 4) + ",\\quad R^2 = " + tn(fit.r2, 5), true) + "</div>";
        upd();
      }
      ta.addEventListener("input", debounce(function () { st.a = 0; st.b = 0; draw(); }, 300));
      bindSliders(body, st, function () { if (body.__upd) body.__upd(); });
      body.addEventListener("click", function (e) {
        var b = e.target.closest("[data-lp]"); if (!b) return;
        var p = LSQ_PRE[+b.getAttribute("data-lp")]; st.xl = p.xl; st.yl = p.yl; ta.value = p.pts; st.a = 0; st.b = 0; draw();
      });
      draw();
      return { set: function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); if (o.pts) ta.value = o.pts; st.a = 0; st.b = 0; draw(); } };
    }

    function show(m) {
      st.mode = m;
      $$("[data-tab]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === m); });
      if (m === "lagrange" && st.mode !== mode) { /* keep user's values */ }
      cur = m === "crit" ? critUI() : m === "lagrange" ? lagUI() : lsqUI();
    }
    // when tabs switch, give each mode sensible starting values
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]"); if (!b) return;
      var m = b.getAttribute("data-tab");
      if (m === "lagrange" && st.mode !== "lagrange") { st.f = "x*y"; st.g = "x+y"; st.c = 10; st.r = 8; }
      if (m === "crit" && st.mode !== "crit") { st.f = "x^3-3x+y^2-4y"; st.r = 3.2; }
      show(m);
    });
    box._set = function (o) { if (o.mode && o.mode !== st.mode) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); show(o.mode); } else if (cur) cur.set(o); };
    show(mode);
  }

  /* ================================================================== mv-int — double integrals */
  var INT_PRE = [
    ["ปริมาตรใต้ x²+y² บนสี่เหลี่ยม", { type: "rect", f: "x^2+y^2", a: "0", b: "1", c: "0", d: "2" }, "10/3"],
    ["ใต้ xy เหนือสามเหลี่ยม", { type: "typeI", f: "x*y", a: "0", b: "2", g1: "0", g2: "2-x" }, "2/3"],
    ["พื้นที่วงกลมรัศมี 2 (polar)", { type: "polar", f: "1", a: "0", b: "2*pi", r1: "0", r2: "2" }, "4π"],
    ["ปริมาตรพาราโบลอยด์ (polar)", { type: "polar", f: "4-x^2-y^2", a: "0", b: "2*pi", r1: "0", r2: "2" }, "8π"],
    ["พื้นที่ระหว่าง y = x² กับ y = x", { type: "typeI", f: "1", a: "0", b: "1", g1: "x^2", g2: "x" }, "1/6"],
    ["เพลตครึ่งวงกลม ρ = 1 + y", { type: "polar", f: "1+y", a: "0", b: "pi", r1: "0", r2: "1" }, "π/2 + 2/3"],
    ["ใบกลีบ r = 2 sin 2θ (polar)", { type: "polar", f: "1", a: "0", b: "pi/2", r1: "0", r2: "2*sin(2*th)" }, "π/2"]
  ];

  function initInt(box) {
    var d = box.dataset;
    var st = { type: d.type || "rect", f: d.f || "x^2+y^2", a: d.a || "0", b: d.b || "1", c: d.c || "0", d: d.d || "2", g1: d.g1 || "0", g2: d.g2 || "2-x", r1: d.r1 || "0", r2: d.r2 || "2", n: +(d.n || 6), mass: d.mass !== undefined };
    box.classList.add("lap-lab", "mv-lab");
    var pre = dataObj(box, "presets") || INT_PRE;
    box.innerHTML = '<div class="mv-modes lap-chips"><button type="button" class="lap-chip" data-ty="rect">สี่เหลี่ยม (rect)</button><button type="button" class="lap-chip" data-ty="typeI">ขอบเปลี่ยนตาม x (type I)</button><button type="button" class="lap-chip" data-ty="polar">ขั้ว (polar)</button></div>' +
      '<div class="lap-row"><label class="lap-lbl">f(x, y) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"></div><div class="mv-bounds"></div>' +
      '<div class="lap-chips">' + chips(pre, "data-pre") + "</div>" + slider("n", "จำนวนช่องต่อด้าน n (Riemann sum n × n)", 1, 40, 1, st.n) + checks([["mass", "ถือว่า f = ความหนาแน่น ρ: แสดงมวล จุดศูนย์กลางมวล และ moment of inertia", st.mass]]) +
      '<div class="mv-grid2"><div class="mv-sm"></div><div class="mv-s3"></div></div><div class="mv-out"></div>' +
      '<p class="lap-help">Riemann sum ใช้จุดกึ่งกลางของแต่ละช่อง (midpoint rule) · ค่า “ที่แท้จริง” คำนวณด้วย Gauss–Legendre ซ้อนสองชั้น (เทียบได้กับ MATLAB integral2) · เลื่อน n ดูผลรวมวิ่งเข้าหาอินทิกรัล</p>';
    var out = box.querySelector(".mv-out"), bnd = box.querySelector(".mv-bounds"), scene = new Scene3D(box.querySelector(".mv-s3"), { label: "แท่งปริมาตรของ Riemann sum ใต้พื้นผิว f(x,y) (3D bars under surface)", ratio: 0.8, labels: ["x", "y", "f"] });
    function bounds() {
      var L = function (lab, k) { return '<label class="lap-f"><span>' + lab + '</span><input data-b="' + k + '" value="' + esc(st[k]) + '" spellcheck="false"></label>'; };
      bnd.innerHTML = '<div class="lap-fields">' + (st.type === "rect" ? L("x จาก", "a") + L("ถึง", "b") + L("y จาก", "c") + L("ถึง", "d") : st.type === "typeI" ? L("x จาก", "a") + L("ถึง", "b") + L("y จาก g₁(x)", "g1") + L("ถึง g₂(x)", "g2") : L("θ จาก", "a") + L("ถึง", "b") + L("r จาก r₁(th)", "r1") + L("ถึง r₂(th)", "r2")) + "</div>" +
        '<p class="lap-help">ตัวเลขหรือนิพจน์ได้ เช่น 2*pi, pi/2 · ในโหมด polar ตัวแปรมุมในขอบเขต r เขียนเป็น th เช่น 2*sin(2*th) · f เขียนเป็น x, y เสมอ</p>';
      $$("[data-b]", bnd).forEach(function (i) { i.addEventListener("input", debounce(function () { st[i.getAttribute("data-b")] = i.value; draw(); }, 300)); });
    }
    function setup() {
      var F = compileIn(st.f, ["x", "y"], out, "f"); if (!F) return null;
      var a, b, c, dd, lo, hi, R = {};
      try {
        a = cnum(st.a); b = cnum(st.b);
        if (st.type === "rect") { c = cnum(st.c); dd = cnum(st.d); lo = function () { return c; }; hi = function () { return dd; }; }
        else { var vv = st.type === "polar" ? ["th"] : ["x"], l = MVC.fn(st.type === "polar" ? st.r1 : st.g1, vv), h = MVC.fn(st.type === "polar" ? st.r2 : st.g2, vv); lo = function (t) { return l(t); }; hi = function (t) { return h(t); }; R.l = l; R.h = h; }
      } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ขอบเขต: ' + esc(e.message) + "</p>"; return null; }
      if (!(isFinite(a) && isFinite(b))) { out.innerHTML = '<p class="lap-err">⚠ ขอบเขตไม่ใช่ตัวเลข</p>'; return null; }
      return { F: F, a: a, b: b, lo: lo, hi: hi, R: R };
    }
    // value of ∬ w(x,y) f dA over the region (w optional weight)
    function integral(S, w) {
      var f = S.F;
      if (st.type === "polar") return MVC.quad(function (t) { var r0 = S.lo(t), r1 = S.hi(t); return MVC.quad(function (r) { var x = r * Math.cos(t), y = r * Math.sin(t); return w(x, y) * f(x, y) * r; }, r0, r1, 24, 2); }, S.a, S.b, 24, 2);
      return MVC.quad(function (x) { return MVC.quad(function (y) { return w(x, y) * f(x, y); }, S.lo(x), S.hi(x), 24, 2); }, S.a, S.b, 24, 2);
    }
    function riemann(S, n) {
      var f = S.F, tot = 0, cells = [], i, j;
      if (st.type === "rect") {
        var c = S.lo(0), dd = S.hi(0), hx = (S.b - S.a) / n, hy = (dd - c) / n;
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var x = S.a + (i + 0.5) * hx, y = c + (j + 0.5) * hy, v = f(x, y); tot += v * hx * hy; cells.push({ x0: S.a + i * hx, x1: S.a + (i + 1) * hx, y0: c + j * hy, y1: c + (j + 1) * hy, v: v }); }
      } else if (st.type === "typeI") {
        var hx2 = (S.b - S.a) / n;
        for (i = 0; i < n; i++) { var xm = S.a + (i + 0.5) * hx2, g1 = S.lo(xm), g2 = S.hi(xm), hy2 = (g2 - g1) / n; for (j = 0; j < n; j++) { var ym = g1 + (j + 0.5) * hy2, v2 = f(xm, ym); tot += v2 * hx2 * hy2; cells.push({ x0: S.a + i * hx2, x1: S.a + (i + 1) * hx2, y0: g1 + j * hy2, y1: g1 + (j + 1) * hy2, v: v2 }); } }
      } else {
        var ht = (S.b - S.a) / n;
        for (i = 0; i < n; i++) {
          var tm = S.a + (i + 0.5) * ht, r0 = S.lo(tm), r1 = S.hi(tm), hr = (r1 - r0) / n;
          for (j = 0; j < n; j++) {
            var rm = r0 + (j + 0.5) * hr, xx = rm * Math.cos(tm), yy = rm * Math.sin(tm), v3 = f(xx, yy);
            tot += v3 * rm * hr * ht;
            cells.push({ polar: true, t0: S.a + i * ht, t1: S.a + (i + 1) * ht, r0: r0 + j * hr, r1: r0 + (j + 1) * hr, v: v3, x: xx, y: yy });
          }
        }
      }
      return { sum: tot, cells: cells };
    }
    function draw() {
      var S = setup(); if (!S) return;
      var n = st.n, rs = riemann(S, n), exact = integral(S, function () { return 1; });
      // plan view extents from the region boundary
      var bx = [], by = [], bpts = [], k, M = 160;
      if (st.type === "rect") { var c = S.lo(0), dd = S.hi(0); bpts = [[S.a, c], [S.b, c], [S.b, dd], [S.a, dd]]; }
      else if (st.type === "typeI") { for (k = 0; k <= M; k++) { var x = S.a + (S.b - S.a) * k / M; bpts.push([x, S.lo(x)]); } for (k = M; k >= 0; k--) { var x2 = S.a + (S.b - S.a) * k / M; bpts.push([x2, S.hi(x2)]); } }
      else { for (k = 0; k <= M; k++) { var t = S.a + (S.b - S.a) * k / M, r = S.hi(t); bpts.push([r * Math.cos(t), r * Math.sin(t)]); } for (k = M; k >= 0; k--) { var t2 = S.a + (S.b - S.a) * k / M, r2 = S.lo(t2); bpts.push([r2 * Math.cos(t2), r2 * Math.sin(t2)]); } }
      bpts = bpts.filter(function (p) { return isFinite(p[0]) && isFinite(p[1]); });
      bpts.forEach(function (p) { bx.push(p[0]); by.push(p[1]); });
      if (!bpts.length) { out.innerHTML = '<p class="lap-err">⚠ ขอบเขตไม่นิยาม</p>'; return; }
      var x0 = Math.min.apply(null, bx), x1 = Math.max.apply(null, bx), y0 = Math.min.apply(null, by), y1 = Math.max.apply(null, by), sp = Math.max(x1 - x0, y1 - y0) || 1, pd = sp * 0.15;
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = sp / 2 + pd;
      var map = new Map2D(box.querySelector(".mv-sm"), { x0: cx - half, x1: cx + half, y0: cy - half, y1: cy + half, w: 440, label: "แผนผังบริเวณอินทิกรัลและช่อง Riemann (region of integration and Riemann cells)" });
      var vals = rs.cells.map(function (q) { return q.v; }).filter(isFinite), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      if (!(hi > lo)) { hi = lo + 1; }
      var ov = "";
      rs.cells.forEach(function (q) {
        if (!isFinite(q.v)) return;
        var col = MVL.cm((q.v - lo) / (hi - lo));
        if (q.polar) {
          var np = 6, pts = [], u;
          for (u = 0; u <= np; u++) { var t = q.t0 + (q.t1 - q.t0) * u / np; pts.push([q.r1 * Math.cos(t), q.r1 * Math.sin(t)]); }
          for (u = np; u >= 0; u--) { var t3 = q.t0 + (q.t1 - q.t0) * u / np; pts.push([q.r0 * Math.cos(t3), q.r0 * Math.sin(t3)]); }
          ov += map.poly(pts, "rgba(20,30,40,.3)", 0.6, col, true);
        } else ov += map.poly([[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y1], [q.x0, q.y1]], "rgba(20,30,40,.3)", 0.6, col, true);
      });
      ov += map.poly(bpts, "var(--ink)", 2.4, "none", true);
      map.setStatic(ov);
      // 3D: bars for small n, otherwise the surface over the bounding box
      var items = [], zl = Math.min(0, lo), zh = Math.max(0, hi), z0 = 0;
      if (n <= 14) {
        rs.cells.forEach(function (q) {
          if (!isFinite(q.v)) return;
          var col = MVL.cm((q.v - lo) / (hi - lo)), P;
          if (q.polar) { var tm = (q.t0 + q.t1) / 2, p0 = [q.r0 * Math.cos(q.t0), q.r0 * Math.sin(q.t0)], p1 = [q.r1 * Math.cos(q.t0), q.r1 * Math.sin(q.t0)], p2 = [q.r1 * Math.cos(q.t1), q.r1 * Math.sin(q.t1)], p3 = [q.r0 * Math.cos(q.t1), q.r0 * Math.sin(q.t1)]; void tm; P = [p0, p1, p2, p3]; }
          else P = [[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y1], [q.x0, q.y1]];
          var bot = P.map(function (p) { return [p[0], p[1], z0]; }), top = P.map(function (p) { return [p[0], p[1], q.v]; });
          items.push({ type: "poly", pts: top, fill: col, stroke: "rgba(20,30,40,.35)", layer: 0 });
          for (var e = 0; e < 4; e++) items.push({ type: "poly", pts: [bot[e], bot[(e + 1) % 4], top[(e + 1) % 4], top[e]], fill: col, stroke: "rgba(20,30,40,.25)", layer: 0 });
        });
      }
      var surfQ = [];
      if (n > 14) { var gm = 28, sx0 = cx - half + pd, sx1 = cx + half - pd; surfQ = [surfaceItem(function (x, y) { return S.F(x, y); }, sx0, sx1, cy - half + pd, cy + half - pd, gm, [lo, hi])]; items = surfQ; }
      scene.set(items, [cx - half, cx + half, cy - half, cy + half, zl - (zh - zl) * 0.05, zh + (zh - zl) * 0.1 || 1]);
      // read-out
      var err = rs.sum - exact, rel = Math.abs(exact) > 1e-12 ? err / exact : NaN;
      var setupTex = st.type === "rect" ? "\\int_{" + st.a + "}^{" + st.b + "}\\!\\int_{" + st.c + "}^{" + st.d + "} f\\,dy\\,dx" : st.type === "typeI" ? "\\int_{" + st.a + "}^{" + st.b + "}\\!\\int_{" + st.g1 + "}^{" + st.g2 + "} f\\,dy\\,dx" : "\\int_{" + st.a + "}^{" + st.b + "}\\!\\int_{" + st.r1 + "}^{" + st.r2 + "} f(r\\cos\\theta,\\,r\\sin\\theta)\\,r\\,dr\\,d\\theta";
      setupTex = setupTex.replace(/\*/g, "\\cdot ").replace(/pi/g, "\\pi").replace(/th\b/g, "\\theta");
      var html = '<div class="mv-eqs">' + T("\\iint_R f\\,dA = " + setupTex + ",\\qquad f = " + S.F.tex, true) + "</div>" +
        '<div class="mv-kv"><div><b>Riemann sum (n = ' + n + ")</b><span>" + fmt(rs.sum, 7) + "</span></div><div><b>อินทิกรัลที่แท้จริง</b><span>" + fmt(exact, 8) + "</span></div><div><b>คลาดเคลื่อน</b><span>" + fmt(err, 3) + (isFinite(rel) ? " (" + fmt(rel * 100, 2) + "%)" : "") + "</span></div><div><b>จำนวนช่อง</b><span>" + n * n + "</span></div></div>";
      if (st.mass) {
        var one = function () { return 1; };
        var Mm = exact, Area = integral({ F: MVC.fn("1", ["x", "y"]), a: S.a, b: S.b, lo: S.lo, hi: S.hi }, one);
        var mx = integral(S, function (x) { return x; }), my = integral(S, function (x, y) { return y; }), ix = integral(S, function (x, y) { return y * y; }), iy = integral(S, function (x) { return x * x; });
        html += '<div class="lap-ans">' + T("A = \\iint dA = " + tn(Area, 6) + ",\\quad M = \\iint\\rho\\,dA = " + tn(Mm, 6) + ",\\quad \\bar x = \\tfrac{1}{M}\\iint x\\rho\\,dA = " + tn(mx / Mm, 6) + ",\\quad \\bar y = " + tn(my / Mm, 6), true) + T("I_x = \\iint y^2\\rho\\,dA = " + tn(ix, 6) + ",\\quad I_y = \\iint x^2\\rho\\,dA = " + tn(iy, 6) + ",\\quad J = I_x+I_y = " + tn(ix + iy, 6), true) + "</div>";
      }
      out.innerHTML = html;
    }
    function ui() {
      $$("[data-ty]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-ty") === st.type); });
      bounds();
    }
    var inp = box.querySelector('[data-in="f"]');
    inp.addEventListener("input", debounce(function () { st.f = inp.value; draw(); }, 300));
    box.addEventListener("click", function (e) {
      var t = e.target.closest("[data-ty]");
      if (t) { st.type = t.getAttribute("data-ty"); if (st.type === "polar" && st.r2 === "2-x") st.r2 = "2"; ui(); draw(); return; }
      var b = e.target.closest("[data-pre]");
      if (b) { var p = pre[+b.getAttribute("data-pre")][1]; Object.keys(p).forEach(function (k) { st[k] = p[k]; }); inp.value = st.f; ui(); draw(); }
    });
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { st[c.getAttribute("data-chk")] = c.checked; draw(); }); });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); inp.value = st.f; if (o.n) setSlider(box, "n", st.n); ui(); draw(); };
    ui(); draw();
  }

  /* ================================================================== mv-tri — triple integrals */
  var SYS = {
    rect: { vars: ["x", "y", "z"], rows: [["x", "x", "a", "b", false], ["y", "y", "c1", "c2", "x"], ["z", "z", "d1", "d2", "x, y"]], dv: "dz\\,dy\\,dx", jac: "1", names: ["x", "y", "z"] },
    cyl: { vars: ["th", "r", "z"], rows: [["θ", "θ", "a", "b", false], ["r", "r", "c1", "c2", "th"], ["z", "z", "d1", "d2", "r, th"]], dv: "r\\,dz\\,dr\\,d\\theta", jac: "r" },
    sph: { vars: ["th", "ph", "rho"], rows: [["θ", "θ", "a", "b", false], ["φ", "φ", "c1", "c2", "th"], ["ρ", "ρ", "d1", "d2", "th, ph"]], dv: "\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta", jac: "ρ² sin φ" }
  };
  var TRI_PRE = [
    ["กล่อง 1×2×3 (rect)", { sys: "rect", f: "1", a: "0", b: "1", c1: "0", c2: "2", d1: "0", d2: "3" }, "6"],
    ["เตตระฮีดรอน x+y+z ≤ 1", { sys: "rect", f: "1", a: "0", b: "1", c1: "0", c2: "1-x", d1: "0", d2: "1-x-y" }, "1/6"],
    ["กรวย z = r ถึง z = 2 (cyl)", { sys: "cyl", f: "1", a: "0", b: "2*pi", c1: "0", c2: "2", d1: "r", d2: "2" }, "8π/3"],
    ["ทรงกระบอก r ≤ 1, 0 ≤ z ≤ 3, I_z (cyl)", { sys: "cyl", f: "x^2+y^2", a: "0", b: "2*pi", c1: "0", c2: "1", d1: "0", d2: "3" }, "3π/2"],
    ["ทรงกลมรัศมี 2 (sph)", { sys: "sph", f: "1", a: "0", b: "2*pi", c1: "0", c2: "pi", d1: "0", d2: "2" }, "32π/3"],
    ["ครึ่งทรงกลม: ∭ z dV (sph)", { sys: "sph", f: "z", a: "0", b: "2*pi", c1: "0", c2: "pi/2", d1: "0", d2: "1" }, "π/4"],
    ["เปลือกทรงกลม 1 ≤ ρ ≤ 2, ความหนาแน่น 1/ρ", { sys: "sph", f: "1/sqrt(x^2+y^2+z^2)", a: "0", b: "2*pi", c1: "0", c2: "pi", d1: "1", d2: "2" }, "6π"]
  ];
  function initTri(box) {
    var d = box.dataset, sys = d.sys || "rect";
    var st = { sys: sys, f: d.f || "1", a: d.a || "0", b: d.b || "1", c1: d.c1 || "0", c2: d.c2 || "2", d1: d.d1 || "0", d2: d.d2 || "3", cm: d.cm !== undefined, spin: false };
    box.classList.add("lap-lab", "mv-lab");
    var pre = dataObj(box, "presets") || TRI_PRE;
    box.innerHTML = '<div class="mv-modes lap-chips"><button type="button" class="lap-chip" data-sys="rect">พิกัดฉาก (x, y, z)</button><button type="button" class="lap-chip" data-sys="cyl">ทรงกระบอก (r, θ, z)</button><button type="button" class="lap-chip" data-sys="sph">ทรงกลม (ρ, φ, θ)</button></div>' +
      '<div class="lap-row"><label class="lap-lbl">f(x, y, z) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"></div><div class="mv-bounds"></div><div class="lap-chips">' + chips(pre, "data-pre") + "</div>" +
      checks([["cm", "แสดงจุดศูนย์กลางมวล (x̄, ȳ, z̄) และ I_z โดยถือ f = ความหนาแน่น", st.cm]]) + '<div class="mv-grid2"><div class="mv-s3"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">f เขียนด้วย x, y, z เสมอ — โปรแกรมแทน x = r cos θ ฯลฯ และคูณจาโคเบียนให้ · ในโหมดทรงกระบอก/ทรงกลมตัวแปร th = θ, ph = φ, rho = ρ ในขอบเขต · จุดสีแสดงตัวอย่างจุดภายในรูปทรง</p>';
    var out = box.querySelector(".mv-out"), bnd = box.querySelector(".mv-bounds"), scene = new Scene3D(box.querySelector(".mv-s3"), { label: "รูปทรงตันของอินทิกรัลสามชั้น (solid region of triple integral)", ratio: 0.85, equal: true });
    var LAB = { rect: ["x", "y", "z"], cyl: ["θ", "r", "z"], sph: ["θ", "φ", "ρ"] };
    function bounds() {
      var cfg = SYS[st.sys], L = function (lab, k, dep) { return '<label class="lap-f"><span>' + lab + (dep ? " (" + dep + ")" : "") + '</span><input data-b="' + k + '" value="' + esc(st[k]) + '" spellcheck="false"></label>'; };
      var rows = cfg.rows;
      bnd.innerHTML = '<div class="lap-fields">' + rows.map(function (r) { return L(r[0] + " จาก", r[2], r[4]) + L("ถึง", r[3], ""); }).join("") + "</div>" + '<p class="lap-help">ลำดับการอินทิเกรต: ' + (st.sys === "rect" ? "z แล้ว y แล้ว x" : st.sys === "cyl" ? "z แล้ว r แล้ว θ" : "ρ แล้ว φ แล้ว θ") + " · ขอบเขตชั้นในเขียนเป็นฟังก์ชันของตัวแปรชั้นนอก</p>";
      $$("[data-b]", bnd).forEach(function (i) { i.addEventListener("input", debounce(function () { st[i.getAttribute("data-b")] = i.value; draw(); }, 300)); });
    }
    function build() {
      var cfg = SYS[st.sys], F = compileIn(st.f, ["x", "y", "z"], out, "f"); if (!F) return null;
      var a, b, lo2, hi2, lo3, hi3;
      try {
        a = cnum(st.a); b = cnum(st.b);
        var v2 = cfg.vars.slice(0, 1), v3 = cfg.vars.slice(0, 2);
        var l2 = MVC.fn(st.c1, v2), h2 = MVC.fn(st.c2, v2), l3 = MVC.fn(st.d1, v3), h3 = MVC.fn(st.d2, v3);
        lo2 = function (u) { return l2(u); }; hi2 = function (u) { return h2(u); }; lo3 = function (u, v) { return l3(u, v); }; hi3 = function (u, v) { return h3(u, v); };
      } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ขอบเขต: ' + esc(e.message) + "</p>"; return null; }
      // map (u,v,w) → (x,y,z) and jacobian
      var toXYZ, jac;
      if (st.sys === "rect") { toXYZ = function (u, v, w) { return [u, v, w]; }; jac = function () { return 1; }; }
      else if (st.sys === "cyl") { toXYZ = function (t, r, z) { return [r * Math.cos(t), r * Math.sin(t), z]; }; jac = function (t, r) { return r; }; }
      else { toXYZ = function (t, p, r) { return [r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)]; }; jac = function (t, p, r) { return r * r * Math.sin(p); }; }
      return { F: F, a: a, b: b, lo2: lo2, hi2: hi2, lo3: lo3, hi3: hi3, toXYZ: toXYZ, jac: jac };
    }
    function integ(S, w) {
      return MVC.quad3(function (u, v, t) { var p = S.toXYZ(u, v, t); return w(p[0], p[1], p[2]) * S.F(p[0], p[1], p[2]) * S.jac(u, v, t); }, S.a, S.b, S.lo2, S.hi2, S.lo3, S.hi3, 18, 2);
    }
    function draw() {
      var S = build(); if (!S) return;
      var one = function () { return 1; };
      var V = MVC.quad3(function (u, v, t) { var p = S.toXYZ(u, v, t); return S.jac(u, v, t); }, S.a, S.b, S.lo2, S.hi2, S.lo3, S.hi3, 18, 2);
      var val = integ(S, one);
      // sample points inside the solid (uniform in the coordinate box)
      var items = [], N = 650, k, seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (k = 0; k < N; k++) {
        var u = S.a + (S.b - S.a) * rnd(), l2 = S.lo2(u), h2 = S.hi2(u), v = l2 + (h2 - l2) * rnd(), l3 = S.lo3(u, v), h3 = S.hi3(u, v), w = l3 + (h3 - l3) * rnd(), p = S.toXYZ(u, v, w);
        if (p.every(isFinite)) items.push({ type: "point", p: p, r: 2.3, color: MVL.cm(Math.max(0, Math.min(1, (p[2] + 2) / 4))) , layer: 0 });
      }
      scene.set(items);
      var cfg = SYS[st.sys], tl = function (s) { return String(s).replace(/\*/g, "\\cdot ").replace(/\bpi\b/g, "\\pi").replace(/\bth\b/g, "\\theta").replace(/\bph\b/g, "\\varphi").replace(/\brho\b/g, "\\rho"); };
      var order = st.sys === "rect" ? [["x", st.a, st.b], ["y", st.c1, st.c2], ["z", st.d1, st.d2]] : st.sys === "cyl" ? [["\\theta", st.a, st.b], ["r", st.c1, st.c2], ["z", st.d1, st.d2]] : [["\\theta", st.a, st.b], ["\\varphi", st.c1, st.c2], ["\\rho", st.d1, st.d2]];
      var setup = order.map(function (o) { return "\\int_{" + tl(o[1]) + "}^{" + tl(o[2]) + "}"; }).join("") + " f\\," + cfg.dv;
      var html = '<div class="mv-eqs">' + T("\\iiint_E f\\,dV = " + setup, true) + T("dV = " + cfg.dv + "\\qquad f = " + MVC.tex(S.F.ast), true) + "</div>" +
        '<div class="mv-kv"><div><b>∭ f dV</b><span>' + fmt(val, 8) + "</span></div><div><b>ปริมาตร V = ∭ dV</b><span>" + fmt(V, 8) + "</span></div><div><b>ค่าเฉลี่ยของ f</b><span>" + fmt(V ? val / V : NaN, 6) + "</span></div><div><b>Jacobian</b><span>" + cfg.jac + "</span></div></div>";
      if (st.cm) {
        var mx = integ(S, function (x) { return x; }), my = integ(S, function (x, y) { return y; }), mz = integ(S, function (x, y, z) { return z; }), iz = integ(S, function (x, y) { return x * x + y * y; });
        html += '<div class="lap-ans">' + T("M = " + tn(val, 6) + ",\\ (\\bar x,\\bar y,\\bar z) = (" + tn(mx / val, 5) + ",\\ " + tn(my / val, 5) + ",\\ " + tn(mz / val, 5) + "),\\ I_z = \\iiint (x^2+y^2)\\rho\\,dV = " + tn(iz, 6), true) + "</div>";
      }
      out.innerHTML = html;
    }
    function ui() { $$("[data-sys]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-sys") === st.sys); }); bounds(); }
    var inp = box.querySelector('[data-in="f"]'); inp.addEventListener("input", debounce(function () { st.f = inp.value; draw(); }, 300));
    box.addEventListener("click", function (e) {
      var s = e.target.closest("[data-sys]");
      if (s) { st.sys = s.getAttribute("data-sys"); var dflt = { rect: { a: "0", b: "1", c1: "0", c2: "2", d1: "0", d2: "3" }, cyl: { a: "0", b: "2*pi", c1: "0", c2: "1", d1: "0", d2: "2" }, sph: { a: "0", b: "2*pi", c1: "0", c2: "pi", d1: "0", d2: "1" } }[st.sys]; Object.keys(dflt).forEach(function (k) { st[k] = dflt[k]; }); ui(); draw(); return; }
      var b = e.target.closest("[data-pre]");
      if (b) { var p = pre[+b.getAttribute("data-pre")][1]; Object.keys(p).forEach(function (k) { st[k] = p[k]; }); inp.value = st.f; ui(); draw(); }
    });
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { st[c.getAttribute("data-chk")] = c.checked; draw(); }); });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); inp.value = st.f; ui(); draw(); };
    ui(); draw();
  }

  /* ================================================================== mv-jac — change of variables */
  var JAC_PRE = {
    polar: ["ขั้ว (polar): x = u cos v, y = u sin v", "u*cos(v)", "u*sin(v)", [0.3, 2.2], [0, 2.4]],
    shear: ["เฉือน + ยืด", "u+0.6*v", "v+0.2*u", [0, 2], [0, 2]],
    scale: ["ขยายต่างทิศ x = 2u, y = v/2", "2*u", "v/2", [0, 2], [0, 2]],
    square: ["ยกกำลังสองเชิงซ้อน: x = u²−v², y = 2uv", "u^2-v^2", "2*u*v", [0.2, 1.6], [0, 1.4]],
    warp: ["ผิดรูป (warp)", "u+0.25*sin(2*v)", "v+0.25*sin(2*u)", [0, 3], [0, 3]],
    elliptic: ["วงรี x = 2u cos v, y = u sin v", "2*u*cos(v)", "u*sin(v)", [0.2, 1.6], [0, 2.8]]
  };
  function initJac(box) {
    var d = box.dataset, key = d.preset || "polar";
    var P = JAC_PRE[key] || JAC_PRE.polar;
    var st = { x: d.x || P[1], y: d.y || P[2], u0: +(d.u0 || (P[3][0] + P[3][1]) / 2), v0: +(d.v0 || (P[4][0] + P[4][1]) / 2), h: +(d.h || 0.25), ur: P[3], vr: P[4] };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + Object.keys(JAC_PRE).map(function (k) { return '<button type="button" class="lap-chip' + (k === key ? " on" : "") + '" data-jp="' + k + '">' + JAC_PRE[k][0] + "</button>"; }).join("") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">x(u, v) =</label><input class="lap-in" data-in="x" value="' + esc(st.x) + '" spellcheck="false"><label class="lap-lbl">y(u, v) =</label><input class="lap-in" data-in="y" value="' + esc(st.y) + '" spellcheck="false"></div>' +
      '<div class="mv-sl2">' + slider("u0", "u₀", 0, 3, 0.01, st.u0) + slider("v0", "v₀", 0, 3, 0.01, st.v0) + "</div>" + slider("h", "ขนาดช่องเล็ก Δu = Δv", 0.02, 0.8, 0.01, st.h) +
      '<div class="mv-grid2"><div class="mv-uv"></div><div class="mv-xy"></div></div><div class="mv-out"></div><p class="lap-help">ช่องสี่เหลี่ยมเล็กบนระนาบ uv ถูกแปลงเป็นรูปสี่เหลี่ยมโค้งบนระนาบ xy · พื้นที่ใหม่ ≈ |det J| × พื้นที่เดิม ยิ่งช่องเล็กยิ่งแม่น — นี่คือเหตุผลของตัวคูณ r ในพิกัดขั้ว</p>';
    var out = box.querySelector(".mv-out"), uvh = box.querySelector(".mv-uv"), xyh = box.querySelector(".mv-xy");
    function sl(a, b) { var r = box.querySelector('input[data-k="' + a + '"]'); r.min = b[0]; r.max = b[1]; }
    function draw() {
      var X = compileIn(st.x, ["u", "v"], out, "x"), Y = compileIn(st.y, ["u", "v"], out, "y"); if (!X || !Y) return;
      sl("u0", st.ur); sl("v0", st.vr);
      var u0 = st.u0, v0 = st.v0, h = st.h, ur = st.ur, vr = st.vr, k, i;
      var xu = MVC.compile(MVC.d(X.ast, "u"), ["u", "v"]), xv = MVC.compile(MVC.d(X.ast, "v"), ["u", "v"]), yu = MVC.compile(MVC.d(Y.ast, "u"), ["u", "v"]), yv = MVC.compile(MVC.d(Y.ast, "v"), ["u", "v"]);
      var J = xu(u0, v0) * yv(u0, v0) - xv(u0, v0) * yu(u0, v0);
      // grid lines
      var lines = [], nU = 9, nV = 9, N = 40;
      for (i = 0; i <= nU; i++) { var u = ur[0] + (ur[1] - ur[0]) * i / nU, ln = []; for (k = 0; k <= N; k++) { var v = vr[0] + (vr[1] - vr[0]) * k / N; ln.push([X(u, v), Y(u, v)]); } lines.push({ c: "u", pts: ln }); }
      for (i = 0; i <= nV; i++) { var v2 = vr[0] + (vr[1] - vr[0]) * i / nV, ln2 = []; for (k = 0; k <= N; k++) { var u2 = ur[0] + (ur[1] - ur[0]) * k / N; ln2.push([X(u2, v2), Y(u2, v2)]); } lines.push({ c: "v", pts: ln2 }); }
      var all = [].concat.apply([], lines.map(function (l) { return l.pts; })).filter(function (p) { return isFinite(p[0]) && isFinite(p[1]); });
      var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), sp = Math.max(x1 - x0, y1 - y0) || 1, pd = sp * 0.1;
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = sp / 2 + pd;
      var mUV = new Map2D(uvh, { x0: ur[0] - (ur[1] - ur[0]) * 0.08, x1: ur[1] + (ur[1] - ur[0]) * 0.08, y0: vr[0] - (vr[1] - vr[0]) * 0.08, y1: vr[1] + (vr[1] - vr[0]) * 0.08, w: 400, equal: false, h: 330, xl: "u", yl: "v", label: "ระนาบ uv มีช่องเล็ก (uv-plane with a small cell)" });
      var mXY = new Map2D(xyh, { x0: cx - half, x1: cx + half, y0: cy - half, y1: cy + half, w: 400, label: "ระนาบ xy หลังแปลงพิกัด: ช่องถูกยืดหรือบิด (xy-plane image and Jacobian area scale)" });
      var acc = css("--accent"), sig = css("--signal"), ok = css("--ok"), s1 = "", s2 = "";
      lines.forEach(function (l) {
        var col = l.c === "u" ? "var(--signal)" : "var(--ink-3)";
        s2 += mXY.poly(l.pts.filter(function (p) { return isFinite(p[0]); }), col, 1, "none", false);
      });
      for (i = 0; i <= nU; i++) { var uu = ur[0] + (ur[1] - ur[0]) * i / nU; s1 += mUV.line(uu, vr[0], uu, vr[1], "var(--signal)", 1); }
      for (i = 0; i <= nV; i++) { var vv = vr[0] + (vr[1] - vr[0]) * i / nV; s1 += mUV.line(ur[0], vv, ur[1], vv, "var(--ink-3)", 1); }
      mUV.setStatic(s1); mXY.setStatic(s2);
      // cell
      var cell = [[u0, v0], [u0 + h, v0], [u0 + h, v0 + h], [u0, v0 + h]];
      var edge = []; // boundary of the image cell with curved edges
      var seg = function (pa, pb) { for (var t = 0; t < 12; t++) { var q = t / 12, uu = pa[0] + (pb[0] - pa[0]) * q, vv = pa[1] + (pb[1] - pa[1]) * q; edge.push([X(uu, vv), Y(uu, vv)]); } };
      seg(cell[0], cell[1]); seg(cell[1], cell[2]); seg(cell[2], cell[3]); seg(cell[3], cell[0]);
      var img = cell.map(function (c) { return [X(c[0], c[1]), Y(c[0], c[1])]; });
      var area = 0; for (i = 0; i < edge.length; i++) { var p = edge[i], q2 = edge[(i + 1) % edge.length]; area += p[0] * q2[1] - q2[0] * p[1]; } area = Math.abs(area) / 2;
      mUV.setDyn(mUV.poly(cell, acc, 2.4, "rgba(201,79,24,.3)", true) + mUV.dot(u0, v0, 4.5, acc));
      mXY.setDyn(mXY.poly(edge, acc, 2.4, "rgba(201,79,24,.3)", true) + mXY.dot(img[0][0], img[0][1], 4.5, acc) +
        mXY.arrow(img[0][0], img[0][1], img[0][0] + xu(u0, v0) * h, img[0][1] + yu(u0, v0) * h, sig, 2.2) + mXY.arrow(img[0][0], img[0][1], img[0][0] + xv(u0, v0) * h, img[0][1] + yv(u0, v0) * h, ok, 2.2));
      var ratio = area / (h * h);
      out.innerHTML = '<div class="mv-eqs">' + T("J=\\frac{\\partial(x,y)}{\\partial(u,v)}=\\begin{vmatrix}x_u&x_v\\\\y_u&y_v\\end{vmatrix}=\\begin{vmatrix}" + MVC.tex(MVC.d(X.ast, "u")) + "&" + MVC.tex(MVC.d(X.ast, "v")) + "\\\\" + MVC.tex(MVC.d(Y.ast, "u")) + "&" + MVC.tex(MVC.d(Y.ast, "v")) + "\\end{vmatrix}", true) + T("dA = dx\\,dy = |J|\\,du\\,dv", true) + "</div>" +
        '<div class="mv-kv"><div><b>det J ที่ (u₀, v₀)</b><span>' + fmt(J, 6) + "</span></div><div><b>พื้นที่ช่องบน uv</b><span>" + fmt(h * h, 5) + "</span></div><div><b>พื้นที่ภาพบน xy (จริง)</b><span>" + fmt(area, 6) + "</span></div><div><b>อัตราส่วนพื้นที่</b><span>" + fmt(ratio, 6) + "</span></div><div><b>|det J|</b><span>" + fmt(Math.abs(J), 6) + "</span></div></div>" +
        '<p class="lap-note">ลูกศรฟ้า = (xᵤ, yᵤ)Δu (ภาพของด้าน u) · ลูกศรเขียว = (xᵥ, yᵥ)Δv · พื้นที่ของสี่เหลี่ยมด้านขนานที่ทั้งสองขึงคือ |det J|ΔuΔv ' + (J < 0 ? "· det J &lt; 0 หมายถึงการแปลงกลับทิศการหมุน (orientation flip)" : "") + "</p>";
    }
    var ix = box.querySelector('[data-in="x"]'), iy = box.querySelector('[data-in="y"]');
    var onIn = debounce(function () { st.x = ix.value; st.y = iy.value; draw(); }, 300);
    ix.addEventListener("input", onIn); iy.addEventListener("input", onIn);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-jp]"); if (!b) return;
      var p = JAC_PRE[b.getAttribute("data-jp")]; st.x = p[1]; st.y = p[2]; st.ur = p[3]; st.vr = p[4]; st.u0 = (p[3][0] + p[3][1]) / 2; st.v0 = (p[4][0] + p[4][1]) / 2;
      ix.value = st.x; iy.value = st.y; setSlider(box, "u0", st.u0); setSlider(box, "v0", st.v0);
      $$("[data-jp]", box).forEach(function (c) { c.classList.toggle("on", c === b); }); draw();
    });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) {
      if (o.x) { st.x = o.x; ix.value = o.x; } if (o.y) { st.y = o.y; iy.value = o.y; }
      if (o.ur) st.ur = o.ur; if (o.vr) st.vr = o.vr;
      draw();
      if (o.u0 !== undefined) { st.u0 = o.u0; setSlider(box, "u0", o.u0); } if (o.v0 !== undefined) { st.v0 = o.v0; setSlider(box, "v0", o.v0); } if (o.h !== undefined) { st.h = o.h; setSlider(box, "h", o.h); }
      draw();
    };
    draw();
  }

  MVL.register("mv-opt", initOpt);
  MVL.register("mv-int", initInt);
  MVL.register("mv-tri", initTri);
  MVL.register("mv-jac", initJac);
  MVL.cnum = cnum; MVL.solveN = solveN;
  MVL.boot();
})(typeof window !== "undefined" ? window : globalThis);
