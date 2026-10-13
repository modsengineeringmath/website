/* Field lab (Physics 2 style) for /learn/vector-algebra/ — plain JS + canvas, no dependencies. Uses .v3-* control/readout styles.
   <div class="fld-lab" data-mode="e|b|lorentz" [data-preset="dipole"] [data-compact]></div>
     e        — point charges (μC) on a plane: superposition at a probe point, field vectors, field lines, equipotentials, potential map,
                Coulomb force on a selected charge. Drag charges or the probe P; tools add +/− charges.
     b        — long straight wires perpendicular to the page (⊙ out, ⊗ in): B = μ0 I /(2π r) superposed, field lines as contours of A_z,
                force per metre between wires.
     lorentz  — a charged particle in uniform B (out of page) and E (in the plane): circle, cycloid, velocity selector (Boris integrator).
   window.VecField exposes the field functions for Node checks. */
(function (root) {
  "use strict";
  var K = 8.9875517923e9, MU0 = 4 * Math.PI * 1e-7, D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function num(v, s) {
    if (v === null || v === undefined || !isFinite(v)) return "—";
    if (v === 0) return "0";
    s = s || 4; var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) { var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e); return (+m.toPrecision(s)).toString().replace("-", "−") + "×10" + String(e).split("").map(function (c) { return "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]; }).join(""); }
    var d = Math.max(0, s - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString().replace("-", "−");
  }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function row(label, value, cls) { return '<div class="v3-r' + (cls ? " " + cls : "") + '"><b>' + label + "</b><span>" + value + "</span></div>"; }
  function ang(x, y) { var a = Math.atan2(y, x) * R2D; return a < 0 ? a + 360 : a; }

  // =========================================================================== physics
  var phys = {
    // charges: [{x, y, q (μC)}] → E (N/C) and V (V) at (x, y)
    E: function (Q, x, y) {
      var ex = 0, ey = 0, v = 0;
      for (var i = 0; i < Q.length; i++) { var dx = x - Q[i].x, dy = y - Q[i].y, r2 = dx * dx + dy * dy; if (r2 < 1e-12) continue; var r = Math.sqrt(r2), k = K * Q[i].q * 1e-6 / (r2 * r); ex += k * dx; ey += k * dy; v += K * Q[i].q * 1e-6 / r; }
      return [ex, ey, v];
    },
    // wires: [{x, y, I (A, + out of page)}] → B (T) in the plane and A_z
    B: function (W, x, y) {
      var bx = 0, by = 0, az = 0;
      for (var i = 0; i < W.length; i++) { var dx = x - W[i].x, dy = y - W[i].y, r2 = dx * dx + dy * dy; if (r2 < 1e-12) continue; var k = MU0 * W[i].I / (2 * Math.PI * r2); bx += -k * dy; by += k * dx; az += -MU0 * W[i].I / (2 * Math.PI) * Math.log(Math.sqrt(r2)); }
      return [bx, by, az];
    },
    // Coulomb force on charge j from the others (N)
    forceOn: function (Q, j) {
      var parts = [], fx = 0, fy = 0;
      Q.forEach(function (c, i) { if (i === j) return; var dx = Q[j].x - c.x, dy = Q[j].y - c.y, r = Math.hypot(dx, dy); if (r < 1e-9) return; var k = K * c.q * Q[j].q * 1e-12 / (r * r * r); parts.push({ i: i, r: r, fx: k * dx, fy: k * dy }); fx += k * dx; fy += k * dy; });
      return { fx: fx, fy: fy, parts: parts };
    },
    // force per metre on wire j: F/L = I_j ẑ × B
    wireForce: function (W, j) {
      var b = phys.B(W.filter(function (_, i) { return i !== j; }), W[j].x, W[j].y);
      return { fx: -W[j].I * b[1], fy: W[j].I * b[0], b: b };
    }
  };

  // =========================================================================== presets
  var PRE = {
    e: {
      single: { n: "ประจุบวกเดี่ยว", q: [[0, 0, 2]], p: [0.4, 0.25] },
      dipole: { n: "ไดโพล +q −q", q: [[-0.3, 0, 2], [0.3, 0, -2]], p: [0, 0.35] },
      like: { n: "ประจุชนิดเดียวกันสองตัว", q: [[-0.3, 0, 2], [0.3, 0, 2]], p: [0, 0.3] },
      unequal: { n: "+4 μC กับ −1 μC (จุดสนามเป็นศูนย์)", q: [[-0.2, 0, 4], [0.2, 0, -1]], p: [0.6, 0] },
      triangle: { n: "สามเหลี่ยม: แรงบนประจุ q₃", q: [[-0.3, -0.2, 3], [0.3, -0.2, -4], [0, 0.32, 2]], p: [0, 0], sel: 2 },
      quad: { n: "ควอดรูโพล", q: [[-0.25, -0.25, 2], [0.25, -0.25, -2], [0.25, 0.25, 2], [-0.25, 0.25, -2]], p: [0, 0.45] },
      plates: { n: "แผ่นขนาน (ประมาณด้วยประจุ 2 แถว)", q: [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map(function (x) { return [x, 0.25, 1]; }).concat([-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map(function (x) { return [x, -0.25, -1]; })), p: [0.1, 0] }
    },
    b: {
      single: { n: "ลวดเส้นเดียว (⊙ ออกจากกระดาษ)", w: [[0, 0, 10]], p: [0.3, 0.2] },
      same: { n: "ลวดขนาน กระแสทิศเดียวกัน (ดูดกัน)", w: [[-0.25, 0, 10], [0.25, 0, 10]], p: [0, 0.3] },
      opp: { n: "ลวดขนาน กระแสสวนทาง (ผลักกัน)", w: [[-0.25, 0, 10], [0.25, 0, -10]], p: [0, 0.3] },
      four: { n: "ลวด 4 เส้นที่มุมสี่เหลี่ยม", w: [[-0.3, -0.3, 10], [0.3, -0.3, -10], [0.3, 0.3, 10], [-0.3, 0.3, -10]], p: [0, 0] },
      threephase: { n: "สายสามเฟสขณะหนึ่ง (Ia + Ib + Ic = 0)", w: [[-0.35, 0, 10], [0, 0, -5], [0.35, 0, -5]], p: [0, 0.3] }
    }
  };

  // =========================================================================== drawing utils
  function cssVar(el, name, fb) { var v = getComputedStyle(el).getPropertyValue(name).trim(); return v || fb; }
  function arrowCtx(g, x1, y1, x2, y2, col, w, head) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 0.5) return;
    var ux = dx / L, uy = dy / L, h = Math.min(head || 9, L * 0.5);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w || 2; g.lineCap = "round";
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - ux * h * 0.6, y2 - uy * h * 0.6); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * h - uy * h * 0.42, y2 - uy * h + ux * h * 0.42); g.lineTo(x2 - ux * h + uy * h * 0.42, y2 - uy * h - ux * h * 0.42); g.closePath(); g.fill();
  }

  // =========================================================================== E and B labs
  function mountFields(el, mode) {
    var isE = mode === "e", list = isE ? PRE.e : PRE.b;
    var st = { items: [], p: [0.3, 0.2], sel: -1, q0: 1, opt: { vec: true, lines: true, eq: isE, map: false, force: false, parts: true } };
    function load(key) {
      var pr = list[key] || list[Object.keys(list)[0]];
      st.items = (isE ? pr.q : pr.w).map(function (a) { return isE ? { x: a[0], y: a[1], q: a[2] } : { x: a[0], y: a[1], I: a[2] }; });
      st.p = pr.p.slice(); st.sel = pr.sel != null ? pr.sel : -1; st.opt.force = pr.sel != null; st.preset = key;
    }
    load(el.getAttribute("data-preset") || Object.keys(list)[0]);
    el.classList.add("fl-ready");
    el.innerHTML = '<p class="v3-t"><b>' + (isE ? "แล็บสนามไฟฟ้า: ประจุจุด เส้นแรง ศักย์ และการซ้อนทับ" : "แล็บสนามแม่เหล็กจากลวดตัวนำตรง") + '</b><span class="mono">ฟิสิกส์ 2 · ลากประจุ/ลวด และจุด P ได้</span></p>' +
      '<div class="v3-body"><div class="v3-fig fl-fig"><canvas class="fl-cv" role="img" aria-label="' + (isE ? "แผนภาพสนามไฟฟ้าของประจุจุด" : "แผนภาพสนามแม่เหล็กของลวดตัวนำ") + '"></canvas>' +
      '<div class="fl-tools"><button type="button" data-t="add+">+ ' + (isE ? "ประจุบวก" : "ลวด ⊙") + '</button><button type="button" data-t="add-">+ ' + (isE ? "ประจุลบ" : "ลวด ⊗") + '</button><button type="button" data-t="del">ลบตัวที่เลือก</button>' +
      '<select class="fl-pre" aria-label="ตัวอย่าง">' + Object.keys(list).map(function (k) { return '<option value="' + k + '">' + esc(list[k].n) + "</option>"; }).join("") + "</select></div>" +
      '<div class="fl-legend mono"></div></div><div class="v3-side"><div class="v3-ctls fl-ctls"></div><div class="v3-out" aria-live="polite"></div></div></div>';
    var cv = el.querySelector("canvas"), g = cv.getContext("2d"), ctls = el.querySelector(".fl-ctls"), out = el.querySelector(".v3-out"), leg = el.querySelector(".fl-legend");
    el.querySelector(".fl-pre").value = st.preset;
    var Wc = 640, Hc = 460, X0 = -0.8, X1 = 0.8, Y0 = -0.575, Y1 = 0.575, S = Wc / (X1 - X0);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Wc * dpr; cv.height = Hc * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var X = function (x) { return (x - X0) * S; }, Y = function (y) { return (Y1 - y) * S; };
    var wx = function (px) { return X0 + px / S; }, wy = function (py) { return Y1 - py / S; };
    // controls
    var opts = isE ? [["vec", "เวกเตอร์สนาม"], ["lines", "เส้นแรงไฟฟ้า"], ["eq", "เส้นศักย์เท่า"], ["map", "แผนที่ศักย์ (สี)"], ["parts", "แยกสนามจากแต่ละประจุที่ P"], ["force", "แรงบนประจุที่เลือก"]]
      : [["vec", "เวกเตอร์ B"], ["lines", "เส้นสนามแม่เหล็ก"], ["parts", "แยก B จากแต่ละเส้นที่ P"], ["force", "แรงต่อเมตรบนลวดที่เลือก"]];
    ctls.innerHTML = opts.map(function (o) { return '<label class="v3-c v3-chk"><input type="checkbox" data-o="' + o[0] + '"' + (st.opt[o[0]] ? " checked" : "") + "><span>" + o[1] + "</span></label>"; }).join("") +
      '<label class="v3-c fl-selq"><span>' + (isE ? "ประจุของตัวที่เลือก" : "กระแสของลวดที่เลือก") + ' <i>' + (isE ? "μC" : "A (+ ออก, − เข้า)") + '</i></span><input type="range" min="' + (isE ? -10 : -50) + '" max="' + (isE ? 10 : 50) + '" step="' + (isE ? 0.5 : 1) + '" value="0"><input type="number" step="any" value="0"></label>' +
      (isE ? '<label class="v3-c"><span>ประจุทดสอบที่ P, q₀ <i>μC</i></span><input type="range" min="-5" max="5" step="0.5" value="1" data-q0><input type="number" step="any" value="1" data-q0></label>' : "");
    var selq = ctls.querySelector(".fl-selq");
    function syncSel() {
      selq.hidden = st.sel < 0;
      if (st.sel >= 0) selq.querySelectorAll("input").forEach(function (i) { i.value = isE ? st.items[st.sel].q : st.items[st.sel].I; });
    }
    var cache = null;
    function invalidate() { cache = null; }
    function colors() {
      return { ink: cssVar(el, "--ink", "#172029"), ink3: cssVar(el, "--ink-3", "#737d86"), rule: cssVar(el, "--rule", "#d9d2c1"), paper: cssVar(el, "--paper", "#f5f2ea"),
        pos: cssVar(el, "--c6", "#c0392b"), neg: cssVar(el, "--c1", "#1f5fa8"), acc: cssVar(el, "--c2", "#c94f18"), c3: cssVar(el, "--c3", "#2f7d4f"), c4: cssVar(el, "--c4", "#8a5cc2"), c5: cssVar(el, "--c5", "#d99a12") };
    }
    function field(x, y) { return isE ? phys.E(st.items, x, y) : phys.B(st.items, x, y); }
    function background(C) {
      // cached layer: map, equipotentials / A_z contours, field lines, vector grid
      var off = document.createElement("canvas"); off.width = Wc * dpr; off.height = Hc * dpr; var h = off.getContext("2d"); h.setTransform(dpr, 0, 0, dpr, 0, 0);
      h.fillStyle = C.paper; h.fillRect(0, 0, Wc, Hc);
      // grid 0.1 m
      h.strokeStyle = C.rule; h.lineWidth = 0.6; h.beginPath();
      for (var gx = Math.ceil(X0 * 10) / 10; gx <= X1 + 1e-9; gx += 0.1) { h.moveTo(X(gx), 0); h.lineTo(X(gx), Hc); }
      for (var gy = Math.ceil(Y0 * 10) / 10; gy <= Y1 + 1e-9; gy += 0.1) { h.moveTo(0, Y(gy)); h.lineTo(Wc, Y(gy)); }
      h.stroke();
      h.strokeStyle = C.ink3; h.lineWidth = 1; h.beginPath(); h.moveTo(X(0), 0); h.lineTo(X(0), Hc); h.moveTo(0, Y(0)); h.lineTo(Wc, Y(0)); h.stroke();
      // scalar grid for map/contours
      var nx = 128, ny = 92, grid = new Float64Array((nx + 1) * (ny + 1)), V0 = isE ? K * 1e-6 / 0.4 : MU0 * 10 / (2 * Math.PI);
      if ((isE && (st.opt.map || st.opt.eq)) || (!isE && st.opt.lines)) {
        for (var j = 0; j <= ny; j++) for (var i = 0; i <= nx; i++) { var f = field(X0 + (X1 - X0) * i / nx, Y1 - (Y1 - Y0) * j / ny); grid[j * (nx + 1) + i] = f[2]; }
      }
      if (isE && st.opt.map) {
        var img = h.createImageData(nx + 1, ny + 1), tmp = document.createElement("canvas"); tmp.width = nx + 1; tmp.height = ny + 1;
        for (var k = 0; k < grid.length; k++) { var t = Math.tanh(grid[k] / (V0 * 1.5)), a = Math.abs(t); img.data[k * 4] = t > 0 ? 220 : 40; img.data[k * 4 + 1] = t > 0 ? 70 : 110; img.data[k * 4 + 2] = t > 0 ? 50 : 220; img.data[k * 4 + 3] = Math.round(a * 120); }
        tmp.getContext("2d").putImageData(img, 0, 0); h.imageSmoothingEnabled = true; h.drawImage(tmp, 0, 0, Wc, Hc);
      }
      function contours(levels, col, wdt, dash) {
        h.strokeStyle = col; h.lineWidth = wdt; h.setLineDash(dash || []); h.beginPath();
        var dxp = Wc / nx, dyp = Hc / ny;
        levels.forEach(function (L) {
          for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
            var a = grid[j * (nx + 1) + i] - L, b = grid[j * (nx + 1) + i + 1] - L, c = grid[(j + 1) * (nx + 1) + i + 1] - L, d = grid[(j + 1) * (nx + 1) + i] - L;
            var pts = [];
            if ((a > 0) !== (b > 0)) pts.push([i + a / (a - b), j]);
            if ((b > 0) !== (c > 0)) pts.push([i + 1, j + b / (b - c)]);
            if ((c > 0) !== (d > 0)) pts.push([i + 1 - c / (c - d), j + 1]);
            if ((d > 0) !== (a > 0)) pts.push([i, j + 1 - d / (d - a)]);
            if (pts.length >= 2 && isFinite(a + b + c + d) && Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d)) < Math.abs(L) * 20 + V0 * 20) { h.moveTo(pts[0][0] * dxp, pts[0][1] * dyp); h.lineTo(pts[1][0] * dxp, pts[1][1] * dyp); if (pts.length === 4) { h.moveTo(pts[2][0] * dxp, pts[2][1] * dyp); h.lineTo(pts[3][0] * dxp, pts[3][1] * dyp); } }
          }
        });
        h.stroke(); h.setLineDash([]);
      }
      if (isE && st.opt.eq) { var lv = []; for (var mlv = 1; mlv <= 14; mlv++) lv.push(mlv * 0.5 * V0, -mlv * 0.5 * V0); lv.push(0); contours(lv, C.c4, 1.1, [4, 3]); }
      if (!isE && st.opt.lines && st.items.length) {
        var mn = Infinity, mx = -Infinity; for (var q = 0; q < grid.length; q++) { if (isFinite(grid[q])) { mn = Math.min(mn, grid[q]); mx = Math.max(mx, grid[q]); } }
        var lvb = [], step = V0 * 0.12; for (var Lv = Math.ceil(mn / step) * step; Lv <= mx; Lv += step) lvb.push(Lv + step * 0.01);
        contours(lvb.slice(0, 160), C.c3, 1.3);
      }
      // E field lines by RK4 from positive charges (or negative if there are none)
      if (isE && st.opt.lines) {
        var pos = st.items.filter(function (c) { return c.q > 0; }), src = pos.length ? pos : st.items.filter(function (c) { return c.q < 0; }), sgn = pos.length ? 1 : -1;
        h.strokeStyle = C.ink; h.lineWidth = 1.2; h.globalAlpha = 0.75;
        var dir = function (x, y) { var f = phys.E(st.items, x, y), n = Math.hypot(f[0], f[1]); return n > 0 ? [sgn * f[0] / n, sgn * f[1] / n] : [0, 0]; };
        src.forEach(function (c) {
          var n = Math.max(6, Math.round(Math.abs(c.q) * 6));
          for (var k2 = 0; k2 < n; k2++) {
            var a0 = 2 * Math.PI * (k2 + 0.5) / n, x = c.x + 0.025 * Math.cos(a0), y = c.y + 0.025 * Math.sin(a0), ds = 0.006, path = [[x, y]];
            for (var s2 = 0; s2 < 900; s2++) {
              var k1 = dir(x, y), kk2 = dir(x + k1[0] * ds / 2, y + k1[1] * ds / 2), k3 = dir(x + kk2[0] * ds / 2, y + kk2[1] * ds / 2), k4 = dir(x + k3[0] * ds, y + k3[1] * ds);
              x += ds * (k1[0] + 2 * kk2[0] + 2 * k3[0] + k4[0]) / 6; y += ds * (k1[1] + 2 * kk2[1] + 2 * k3[1] + k4[1]) / 6;
              path.push([x, y]);
              if (x < X0 - 0.2 || x > X1 + 0.2 || y < Y0 - 0.2 || y > Y1 + 0.2) break;
              var hit = st.items.some(function (o) { return o !== c && o.q * sgn < 0 && Math.hypot(x - o.x, y - o.y) < 0.02; });
              if (hit) break;
            }
            h.beginPath(); path.forEach(function (q, i) { if (i) h.lineTo(X(q[0]), Y(q[1])); else h.moveTo(X(q[0]), Y(q[1])); }); h.stroke();
            var mid = path[Math.floor(path.length * 0.35)], nxt = path[Math.min(path.length - 1, Math.floor(path.length * 0.35) + 2)];
            if (mid && nxt && path.length > 12) { var ddx = (nxt[0] - mid[0]) * sgn, ddy = (nxt[1] - mid[1]) * sgn; if (sgn < 0) { var t2 = mid; mid = nxt; nxt = t2; } arrowCtx(h, X(mid[0]), Y(mid[1]), X(mid[0]) + ddx * S * 2.2, Y(mid[1]) - ddy * S * 2.2, C.ink, 1.2, 7); }
          }
        });
        h.globalAlpha = 1;
      }
      // vector grid
      if (st.opt.vec && st.items.length) {
        var vals = [], step2 = 0.1;
        for (var vx = X0 + step2 / 2; vx < X1; vx += step2) for (var vy = Y0 + step2 / 2; vy < Y1; vy += step2) { var f2 = field(vx, vy), m2 = Math.hypot(f2[0], f2[1]); if (m2 > 0 && isFinite(m2)) vals.push([vx, vy, f2[0] / m2, f2[1] / m2, m2]); }
        var mags = vals.map(function (v) { return Math.log10(v[4]); }).sort(function (a, b) { return a - b; }), lo = mags[Math.floor(mags.length * 0.1)] || 0, hi = mags[Math.floor(mags.length * 0.95)] || 1;
        vals.forEach(function (v) {
          if (st.items.some(function (c) { return Math.hypot(v[0] - c.x, v[1] - c.y) < 0.05; })) return;
          var t = Math.max(0.15, Math.min(1, (Math.log10(v[4]) - lo) / (hi - lo + 1e-9))), L = 0.035 + 0.035 * t;
          h.globalAlpha = 0.35 + 0.6 * t;
          arrowCtx(h, X(v[0] - v[2] * L / 2), Y(v[1] - v[3] * L / 2), X(v[0] + v[2] * L / 2), Y(v[1] + v[3] * L / 2), isE ? C.acc : C.c3, 1.4, 6);
        });
        h.globalAlpha = 1;
      }
      return off;
    }
    function draw() {
      var C = colors();
      if (!cache) cache = background(C);
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(cache, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // probe contributions
      var P = st.p, tot = field(P[0], P[1]), parts = st.items.map(function (c) { return isE ? phys.E([c], P[0], P[1]) : phys.B([c], P[0], P[1]); });
      var big = Math.max.apply(null, parts.map(function (f) { return Math.hypot(f[0], f[1]); }).concat([Math.hypot(tot[0], tot[1]), 1e-30])), sc = 0.22 / big;
      if (st.opt.parts) parts.forEach(function (f, i) { arrowCtx(g, X(P[0]), Y(P[1]), X(P[0] + f[0] * sc), Y(P[1] + f[1] * sc), [C.neg, C.c3, C.c4, C.c5][i % 4], 1.6, 8); });
      arrowCtx(g, X(P[0]), Y(P[1]), X(P[0] + tot[0] * sc), Y(P[1] + tot[1] * sc), C.acc, 3.2, 12);
      g.fillStyle = C.ink; g.beginPath(); g.moveTo(X(P[0]), Y(P[1]) - 7); g.lineTo(X(P[0]) + 7, Y(P[1])); g.lineTo(X(P[0]), Y(P[1]) + 7); g.lineTo(X(P[0]) - 7, Y(P[1])); g.closePath(); g.fill();
      g.font = "600 14px " + cssVar(el, "--sans", "sans-serif"); g.fillText("P", X(P[0]) + 9, Y(P[1]) - 9);
      // force on the selected item
      var fsel = null;
      if (st.opt.force && st.sel >= 0 && st.items.length > 1) {
        fsel = isE ? phys.forceOn(st.items, st.sel) : phys.wireForce(st.items, st.sel);
        var c0 = st.items[st.sel], fm = Math.hypot(fsel.fx, fsel.fy), fs = fm > 0 ? 0.25 / fm : 0;
        if (isE) fsel.parts.forEach(function (q) { arrowCtx(g, X(c0.x), Y(c0.y), X(c0.x + q.fx * fs), Y(c0.y + q.fy * fs), C.c5, 1.8, 8); });
        arrowCtx(g, X(c0.x), Y(c0.y), X(c0.x + fsel.fx * fs), Y(c0.y + fsel.fy * fs), C.c4, 3.2, 12);
      }
      // charges / wires
      st.items.forEach(function (c, i) {
        var v = isE ? c.q : c.I, r = isE ? 9 + Math.min(8, Math.abs(v) * 1.2) : 11, col = v >= 0 ? C.pos : C.neg;
        g.fillStyle = col; g.strokeStyle = i === st.sel ? C.ink : C.paper; g.lineWidth = i === st.sel ? 3 : 2;
        g.beginPath(); g.arc(X(c.x), Y(c.y), r, 0, 2 * Math.PI); g.fill(); g.stroke();
        g.fillStyle = "#fff"; g.strokeStyle = "#fff"; g.lineWidth = 2;
        if (isE) { g.beginPath(); g.moveTo(X(c.x) - 5, Y(c.y)); g.lineTo(X(c.x) + 5, Y(c.y)); if (v > 0) { g.moveTo(X(c.x), Y(c.y) - 5); g.lineTo(X(c.x), Y(c.y) + 5); } g.stroke(); }
        else if (v >= 0) { g.beginPath(); g.arc(X(c.x), Y(c.y), 3, 0, 2 * Math.PI); g.fill(); }
        else { g.beginPath(); g.moveTo(X(c.x) - 5, Y(c.y) - 5); g.lineTo(X(c.x) + 5, Y(c.y) + 5); g.moveTo(X(c.x) + 5, Y(c.y) - 5); g.lineTo(X(c.x) - 5, Y(c.y) + 5); g.stroke(); }
        g.fillStyle = C.ink; g.font = "600 12px " + cssVar(el, "--mono", "monospace");
        g.fillText((isE ? "q" : "I") + (i + 1) + " " + (v > 0 ? "+" : "") + v + (isE ? "μC" : "A"), X(c.x) + r + 3, Y(c.y) + r + 10);
      });
      g.fillStyle = C.ink3; g.font = "500 11px " + cssVar(el, "--mono", "monospace"); g.fillText("ตาราง 0.1 m", 8, Hc - 8);
      readout(tot, parts, fsel);
    }
    function readout(tot, parts, fsel) {
      var P = st.p, h = "", u = isE ? " N/C" : " T";
      if (isE) {
        h += st.items.map(function (c, i) { var dx = P[0] - c.x, dy = P[1] - c.y, r = Math.hypot(dx, dy); return row("E" + (i + 1) + " จาก q" + (i + 1) + " = " + num(c.q) + " μC, r = " + num(r) + " m", "|E" + (i + 1) + "| = k|q|/r² = " + num(K * Math.abs(c.q) * 1e-6 / (r * r)) + " · (" + num(parts[i][0]) + ", " + num(parts[i][1]) + ")" + u); }).join("");
        h += row("E = ΣEᵢ ที่ P(" + num(P[0], 3) + ", " + num(P[1], 3) + ")", "<b>(" + num(tot[0]) + ", " + num(tot[1]) + ")" + u + "</b> · |E| = " + num(Math.hypot(tot[0], tot[1])) + u + " ที่ " + num(ang(tot[0], tot[1]), 4) + "°", "v3-key");
        h += row("ศักย์ V = Σ kqᵢ/rᵢ (สเกลาร์ ไม่ต้องแตกองค์ประกอบ)", num(tot[2]) + " V");
        h += row("แรงบนประจุทดสอบ F = q₀E", "q₀ = " + num(st.q0) + " μC → F = (" + num(st.q0 * 1e-6 * tot[0]) + ", " + num(st.q0 * 1e-6 * tot[1]) + ") N · |F| = " + num(Math.abs(st.q0) * 1e-6 * Math.hypot(tot[0], tot[1])) + " N");
        if (fsel) h += row("แรงคูลอมบ์บน q" + (st.sel + 1) + " (ซ้อนทับ)", fsel.parts.map(function (q) { return "จาก q" + (q.i + 1) + ": (" + num(q.fx) + ", " + num(q.fy) + ")"; }).join(" + ") + " = <b>(" + num(fsel.fx) + ", " + num(fsel.fy) + ") N</b> · |F| = " + num(Math.hypot(fsel.fx, fsel.fy)) + " N ที่ " + num(ang(fsel.fx, fsel.fy), 4) + "°", "v3-key");
        leg.innerHTML = '<span class="fl-k a">● ลูกศรหนา = สนามรวม</span><span class="fl-k b">● ลูกศรบาง = สนามจากแต่ละประจุ</span>' + (st.opt.eq ? '<span class="fl-k c">--- เส้นศักย์เท่า</span>' : "");
      } else {
        h += st.items.map(function (c, i) { var dx = P[0] - c.x, dy = P[1] - c.y, r = Math.hypot(dx, dy); return row("B" + (i + 1) + " จาก I" + (i + 1) + " = " + num(c.I) + " A, r = " + num(r) + " m", "|B" + (i + 1) + "| = μ₀|I|/(2πr) = " + num(MU0 * Math.abs(c.I) / (2 * Math.PI * r) * 1e6) + " μT · ทิศ φ̂ = ẑ × r̂ " + (c.I >= 0 ? "(ทวนเข็ม)" : "(ตามเข็ม)")); }).join("");
        h += row("B = ΣBᵢ ที่ P", "<b>(" + num(tot[0] * 1e6) + ", " + num(tot[1] * 1e6) + ") μT</b> · |B| = " + num(Math.hypot(tot[0], tot[1]) * 1e6) + " μT ที่ " + num(ang(tot[0], tot[1]), 4) + "°", "v3-key");
        if (fsel) h += row("แรงต่อเมตรบนลวด " + (st.sel + 1) + ": F/L = I ẑ × B", "(" + num(fsel.fx * 1e6) + ", " + num(fsel.fy * 1e6) + ") μN/m · " + (st.items.length === 2 ? (st.items[0].I * st.items[1].I > 0 ? "กระแสทิศเดียวกัน → ดูดกัน" : "กระแสสวนทาง → ผลักกัน") + " · ตรวจ μ₀I₁I₂/(2πd) = " + num(MU0 * Math.abs(st.items[0].I * st.items[1].I) / (2 * Math.PI * Math.hypot(st.items[0].x - st.items[1].x, st.items[0].y - st.items[1].y)) * 1e6) + " μN/m" : ""), "v3-key");
        leg.innerHTML = '<span class="fl-k a">● ลูกศรหนา = B รวม</span><span class="fl-k b">● ลูกศรบาง = B จากแต่ละเส้น</span><span class="fl-k d">— เส้นสนาม (A_z คงที่)</span>';
      }
      out.innerHTML = h;
    }
    // interaction
    var drag = null;
    function pos(e) { var b = cv.getBoundingClientRect(); return [wx((e.clientX - b.left) * Wc / b.width), wy((e.clientY - b.top) * Hc / b.height)]; }
    cv.addEventListener("pointerdown", function (e) {
      var q = pos(e), best = -1, bd = 0.05;
      st.items.forEach(function (c, i) { var d = Math.hypot(q[0] - c.x, q[1] - c.y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { drag = { t: "c", i: best }; st.sel = best; syncSel(); }
      else if (Math.hypot(q[0] - st.p[0], q[1] - st.p[1]) < 0.06) drag = { t: "p" };
      else { st.p = q; drag = { t: "p" }; }
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); draw();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var q = pos(e); q[0] = Math.max(X0, Math.min(X1, Math.round(q[0] * 100) / 100)); q[1] = Math.max(Y0, Math.min(Y1, Math.round(q[1] * 100) / 100));
      if (drag.t === "c") { st.items[drag.i].x = q[0]; st.items[drag.i].y = q[1]; invalidate(); } else st.p = q;
      draw();
    });
    var up = function () { if (drag && drag.t === "c") { invalidate(); draw(); } drag = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    el.querySelector(".fl-tools").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var t = b.dataset.t;
      if ((t === "add+" || t === "add-") && st.items.length < 12) { var v = t === "add+" ? 1 : -1, n = st.items.length; var it = isE ? { x: -0.5 + 0.13 * (n % 8), y: 0.45, q: 2 * v } : { x: -0.5 + 0.13 * (n % 8), y: 0.45, I: 10 * v }; st.items.push(it); st.sel = st.items.length - 1; }
      if (t === "del" && st.sel >= 0) { st.items.splice(st.sel, 1); st.sel = -1; }
      syncSel(); invalidate(); draw();
    });
    el.querySelector(".fl-pre").addEventListener("change", function (e) { load(e.target.value); ctls.querySelectorAll("[data-o]").forEach(function (c) { c.checked = !!st.opt[c.dataset.o]; }); syncSel(); invalidate(); draw(); });
    ctls.addEventListener("input", function (e) {
      var t = e.target;
      if (t.dataset.o) { st.opt[t.dataset.o] = t.checked; if (["vec", "lines", "eq", "map"].indexOf(t.dataset.o) >= 0) invalidate(); draw(); return; }
      var v = parseFloat(t.value); if (!isFinite(v)) return;
      var lab = t.closest(".v3-c"); lab.querySelectorAll("input").forEach(function (i) { if (i !== t) i.value = v; });
      if (t.hasAttribute("data-q0")) { st.q0 = v; draw(); return; }
      if (st.sel >= 0) { if (isE) st.items[st.sel].q = v; else st.items[st.sel].I = v; invalidate(); draw(); }
    });
    var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (mq && mq.addEventListener) mq.addEventListener("change", function () { invalidate(); draw(); });
    syncSel(); draw();
  }

  // =========================================================================== Lorentz lab (particle in uniform E and B)
  function mountLorentz(el) {
    var p = { q: 1, B: 2, Ex: 0, Ey: 0, v: 3, th: 0, trail: true };
    var PR = {
      circle: { n: "วงกลมใน B อย่างเดียว", p: { B: 2, Ex: 0, Ey: 0, v: 3, th: 0 } },
      select: { n: "ตัวเลือกความเร็ว v = E/B (เส้นตรง)", p: { B: 2, Ex: 0, Ey: 6, v: 3, th: 0 } },
      cycloid: { n: "ไซคลอยด์: เริ่มนิ่งใน E ⟂ B", p: { B: 2, Ex: 0, Ey: 4, v: 0, th: 0 } },
      drift: { n: "ดริฟต์ E×B: วงขดลูป", p: { B: 2, Ex: 0, Ey: 3, v: 4, th: 90 } },
      electron: { n: "ประจุลบ: วนทิศตรงข้าม", p: { q: -1, B: 2, Ex: 0, Ey: 0, v: 3, th: 0 } }
    };
    el.classList.add("fl-ready");
    var C = function (k, l, min, max, step, u) { return '<label class="v3-c" data-k="' + k + '"><span>' + l + (u ? " <i>" + u + "</i>" : "") + '</span><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + p[k] + '"><input type="number" step="any" value="' + p[k] + '"></label>'; };
    el.innerHTML = '<p class="v3-t"><b>แรงลอเรนซ์ F = q(E + v × B): อนุภาคในสนามสม่ำเสมอ</b><span class="mono">หน่วยย่อเพื่อการเรียน · m = 1</span></p><div class="v3-body"><div class="v3-fig fl-fig"><canvas class="fl-cv" role="img" aria-label="เส้นทางของอนุภาคมีประจุในสนามไฟฟ้าและสนามแม่เหล็ก"></canvas>' +
      '<div class="fl-tools"><button type="button" data-t="play">⏸ หยุด</button><button type="button" data-t="reset">↺ เริ่มใหม่</button><select class="fl-pre" aria-label="ตัวอย่าง">' + Object.keys(PR).map(function (k) { return '<option value="' + k + '">' + PR[k].n + "</option>"; }).join("") + '</select></div></div>' +
      '<div class="v3-side"><div class="v3-ctls">' + '<label class="v3-c v3-sel" data-k="q"><span>ประจุ q</span><select><option value="1">+1</option><option value="-1">−1</option></select></label>' +
      C("B", "B_z (+ ออกจากกระดาษ ⊙)", -4, 4, 0.1) + C("Ex", "E_x", -8, 8, 0.1) + C("Ey", "E_y", -8, 8, 0.1) + C("v", "อัตราเร็วเริ่มต้น v₀", 0, 8, 0.1) + C("th", "ทิศ v₀", -180, 180, 5, "°") +
      '</div><div class="v3-out" aria-live="polite"></div></div></div>';
    var cv = el.querySelector("canvas"), g = cv.getContext("2d"), out = el.querySelector(".v3-out"), Wc = 640, Hc = 420, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Wc * dpr; cv.height = Hc * dpr;
    var S = 30, ox = Wc * 0.35, oy = Hc * 0.55, s = null, running = true, raf = null, trail = [];
    function reset() { var a = p.th * D2R; s = { x: 0, y: 0, vx: p.v * Math.cos(a), vy: p.v * Math.sin(a), t: 0 }; trail = [[0, 0]]; }
    function step(dt) {
      // Boris push (exact gyration for constant fields)
      var q = +p.q, hx = q * p.Ex * dt / 2, hy = q * p.Ey * dt / 2;
      var vx = s.vx + hx, vy = s.vy + hy, t = q * p.B * dt / 2, sf = 2 * t / (1 + t * t);
      var vpx = vx + vy * t, vpy = vy - vx * t; // v' = v− + v− × t (t along z)
      vx += vpy * sf; vy += -vpx * sf;          // v+ = v− + v' × s
      s.vx = vx + hx; s.vy = vy + hy; s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt;
    }
    function frame() {
      if (running) { for (var i = 0; i < 6; i++) step(0.004); trail.push([s.x, s.y]); if (trail.length > 2500) trail.shift(); }
      // keep the particle in view by scrolling the origin
      var sx = ox + s.x * S, sy = oy - s.y * S;
      if (sx < 30 || sx > Wc - 30 || sy < 30 || sy > Hc - 30) { ox = Wc / 2 - s.x * S; oy = Hc / 2 + s.y * S; }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function draw() {
      var col = function (n, f) { return cssVar(el, n, f); }, ink = col("--ink", "#172029"), rule = col("--rule", "#ddd");
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = col("--paper", "#f5f2ea"); g.fillRect(0, 0, Wc, Hc);
      // B symbols
      g.strokeStyle = rule; g.fillStyle = col("--c3", "#2f7d4f"); g.lineWidth = 1.3;
      var gx0 = ((ox % 40) + 40) % 40, gy0 = ((oy % 40) + 40) % 40;
      for (var x = gx0; x < Wc; x += 40) for (var y = gy0; y < Hc; y += 40) {
        if (Math.abs(p.B) < 0.05) continue;
        g.globalAlpha = Math.min(0.6, Math.abs(p.B) / 4 + 0.15);
        if (p.B > 0) { g.beginPath(); g.arc(x, y, 2.2, 0, 2 * Math.PI); g.fill(); g.beginPath(); g.strokeStyle = g.fillStyle; g.arc(x, y, 6, 0, 2 * Math.PI); g.stroke(); }
        else { g.strokeStyle = g.fillStyle; g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); }
      }
      g.globalAlpha = 1;
      // E arrow legend
      if (Math.hypot(p.Ex, p.Ey) > 0.01) { var el2 = Math.hypot(p.Ex, p.Ey); arrowCtx(g, 50, Hc - 50, 50 + p.Ex / el2 * 36, Hc - 50 - p.Ey / el2 * 36, col("--c2", "#c94f18"), 2.5, 9); g.fillStyle = col("--c2", "#c94f18"); g.font = "600 13px sans-serif"; g.fillText("E", 54 + p.Ex / el2 * 40, Hc - 54 - p.Ey / el2 * 40); }
      // trail
      g.strokeStyle = col("--c4", "#8a5cc2"); g.lineWidth = 2; g.beginPath();
      trail.forEach(function (q, i) { var X = ox + q[0] * S, Y = oy - q[1] * S; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke();
      var X = ox + s.x * S, Y = oy - s.y * S, sp = Math.hypot(s.vx, s.vy);
      // velocity and force arrows
      var fx = p.q * (p.Ex + s.vy * p.B), fy = p.q * (p.Ey - s.vx * p.B), fm = Math.hypot(fx, fy);
      if (sp > 1e-6) arrowCtx(g, X, Y, X + s.vx / Math.max(sp, 1) * 40, Y - s.vy / Math.max(sp, 1) * 40, col("--c1", "#1f5fa8"), 2.5, 10);
      if (fm > 1e-6) arrowCtx(g, X, Y, X + fx / Math.max(fm, 1) * 34, Y - fy / Math.max(fm, 1) * 34, col("--c6", "#c0392b"), 2.5, 10);
      g.fillStyle = p.q > 0 ? col("--c6", "#c0392b") : col("--c1", "#1f5fa8"); g.beginPath(); g.arc(X, Y, 7, 0, 2 * Math.PI); g.fill();
      g.fillStyle = "#fff"; g.font = "700 11px sans-serif"; g.textAlign = "center"; g.fillText(p.q > 0 ? "+" : "−", X, Y + 4); g.textAlign = "start";
      g.fillStyle = ink; g.font = "500 12px " + cssVar(el, "--mono", "monospace"); g.fillText("t = " + s.t.toFixed(2) + "  |v| = " + sp.toFixed(3) + "   ลูกศรน้ำเงิน v · แดง F", 10, 18);
    }
    function readout() {
      var w = Math.abs(p.q * p.B), vd = Math.abs(p.B) > 1e-9 ? [p.Ey / p.B, -p.Ex / p.B] : null, h = "";
      h += row("F = q(E + v × B)", "แรงไฟฟ้า qE เปลี่ยนอัตราเร็วได้ · แรงแม่เหล็ก q v × B ตั้งฉาก v เสมอ จึงเปลี่ยนแค่ทิศ");
      if (w > 1e-9) {
        h += row("ความถี่ไซโคลตรอน ω = |q|B/m", num(w) + " rad/หน่วยเวลา · คาบ T = 2π/ω = " + num(2 * Math.PI / w));
        h += row("รัศมี r = m v⊥/(|q|B) (เทียบกรอบดริฟต์)", num(Math.hypot(p.v * Math.cos(p.th * D2R) - vd[0], p.v * Math.sin(p.th * D2R) - vd[1]) / w));
        h += row("ความเร็วดริฟต์ v_d = E × B / B²", "(" + num(vd[0]) + ", " + num(vd[1]) + ") · |v_d| = E/B = " + num(Math.hypot(p.Ex, p.Ey) / Math.abs(p.B)), "v3-key");
        var v0 = [p.v * Math.cos(p.th * D2R), p.v * Math.sin(p.th * D2R)];
        if (Math.hypot(v0[0] - vd[0], v0[1] - vd[1]) < 0.02) h += row("ตัวเลือกความเร็ว", "v₀ = v_d พอดี: แรงไฟฟ้าหักล้างแรงแม่เหล็ก อนุภาควิ่งเป็นเส้นตรง", "v3-ok");
        h += row("ทิศการวน", (p.q * p.B > 0 ? "ตามเข็มนาฬิกา" : "ทวนเข็มนาฬิกา") + " เมื่อมองจาก +z (ขึ้นกับเครื่องหมาย qB)");
      } else h += row("ไม่มี B", "อนุภาคเร่งตาม qE เป็นเส้นโค้งพาราโบลาเหมือนการโยนวัตถุ");
      out.innerHTML = h;
    }
    el.querySelector(".v3-ctls").addEventListener("input", function (e) {
      var lab = e.target.closest(".v3-c"); if (!lab) return; var k = lab.dataset.k, v = parseFloat(e.target.value); if (!isFinite(v)) return;
      p[k] = v; lab.querySelectorAll("input").forEach(function (i) { if (i !== e.target) i.value = v; });
      if (k === "v" || k === "th" || k === "q") { reset(); ox = Wc * 0.35; oy = Hc * 0.55; }
      readout();
    });
    el.querySelector(".fl-tools").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.t === "play") { running = !running; b.textContent = running ? "⏸ หยุด" : "▶ เล่น"; }
      if (b.dataset.t === "reset") { reset(); ox = Wc * 0.35; oy = Hc * 0.55; }
    });
    el.querySelector(".fl-pre").addEventListener("change", function (e) {
      var pr = PR[e.target.value]; p.q = 1; Object.keys(pr.p).forEach(function (k) { p[k] = pr.p[k]; });
      el.querySelectorAll(".v3-c").forEach(function (l) { var k = l.dataset.k; l.querySelectorAll("input,select").forEach(function (i) { i.value = p[k]; }); });
      reset(); ox = Wc * 0.35; oy = Hc * 0.55; readout();
    });
    reset(); readout();
    // only animate while visible
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); } else if (raf) { cancelAnimationFrame(raf); raf = null; } }); }) : null;
    if (io) io.observe(el); else raf = requestAnimationFrame(frame);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { running = false; el.querySelector('[data-t="play"]').textContent = "▶ เล่น"; }
  }

  root.VecField = { phys: phys, PRE: PRE };
  if (typeof module === "object" && module.exports) module.exports = root.VecField;
  if (typeof document === "undefined") return;
  function init() {
    document.querySelectorAll(".fld-lab").forEach(function (el) {
      if (el.classList.contains("fl-ready")) return;
      var m = el.getAttribute("data-mode") || "e";
      if (m === "lorentz") mountLorentz(el); else mountFields(el, m);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
