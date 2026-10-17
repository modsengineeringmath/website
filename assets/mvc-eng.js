/* Multivariable calculus labs, part 4 — engineering applications (needs mvc-lab.js)
   <div class="mv-charge" data-preset="dipole">      electrical: point charges, V(x,y), E = −∇V, equipotentials, field lines, Gauss's law on a sphere
   <div class="mv-heat" data-preset="plate">         mechanical: steady heat conduction, isotherms, q = −k∇T, heat through a cut, ∇²T
   <div class="mv-terrain" data-preset="slope">      civil: terrain h(x,y), contour/slope map, cut & fill volume by double integral, balanced level
   <div class="mv-sect" data-preset="T">             civil/mechanical: section properties of a polygon by Green's theorem (A, centroid, Ix, Iy, Ixy, principal axes) */
(function (root) {
  "use strict";
  var MK = root.MK, MVC = root.MVC, MVL = root.MVL;
  if (!MK || !MVC || !MVL) return;
  var PI = Math.PI;
  var $$ = MVL.$$, T = MVL.T, esc = MK.esc, fmt = MVC.fmt, tn = MVC.texNum;
  var slider = MVL.slider, bindSliders = MVL.bindSliders, setSlider = MVL.setSlider, chips = MVL.chips, checks = MVL.checks, debounce = MVL.debounce, compileIn = MVL.compileIn;
  var Scene3D = MVL.Scene3D, Map2D = MVL.Map2D, surfaceItem = MVL.surfaceItem, css = MVL.css;
  var dataObj = function (box, n) { var o = null; try { o = JSON.parse(box.getAttribute("data-" + n) || "null"); } catch (e) { o = null; } return o; };
  var K_E = 8.9875517923e9, EPS0 = 8.8541878128e-12;
  function div2(v) { var a = Math.min(1, Math.abs(v)) * 0.55; return v >= 0 ? "rgba(201,79,24," + a.toFixed(3) + ")" : "rgba(31,95,168," + a.toFixed(3) + ")"; }

  /* ================================================================== mv-charge */
  var CH_PRE = {
    dipole: ["ไดโพล (+ −)", [[-1, 0, 2], [1, 0, -2]]],
    like: ["ประจุเหมือนกัน (+ +)", [[-1, 0, 2], [1, 0, 2]]],
    quad: ["สี่ขั้ว (quadrupole)", [[-1, -1, 2], [1, -1, -2], [1, 1, 2], [-1, 1, -2]]],
    single: ["ประจุเดี่ยว", [[0, 0, 3]]],
    plates: ["แผ่นขนาน (แถวประจุ)", [[-2, 1, 1], [-1.3, 1, 1], [-0.6, 1, 1], [0.1, 1, 1], [0.8, 1, 1], [1.5, 1, 1], [2.2, 1, 1], [-2, -1, -1], [-1.3, -1, -1], [-0.6, -1, -1], [0.1, -1, -1], [0.8, -1, -1], [1.5, -1, -1], [2.2, -1, -1]]]
  };
  function initCharge(box) {
    var d = box.dataset, key = d.preset || "dipole";
    var st = { q: CH_PRE[key][1].map(function (c) { return { x: c[0], y: c[1], q: c[2] }; }), sel: 0, px: 0.4, py: 1.4, gr: 1.5, tool: "move", view: { heat: true, cont: true, arrows: false, lines: true, gauss: !!d.gauss } };
    var R = 3;
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + Object.keys(CH_PRE).map(function (k) { return '<button type="button" class="lap-chip' + (k === key ? " on" : "") + '" data-cp="' + k + '">' + CH_PRE[k][0] + "</button>"; }).join("") + "</div>" +
      '<div class="lap-chips mv-tools"><span class="lap-lbl">เครื่องมือ:</span><button type="button" class="lap-chip on" data-tool="move">ลากย้าย</button><button type="button" class="lap-chip" data-tool="addp">คลิกเพิ่มประจุ +</button><button type="button" class="lap-chip" data-tool="addn">คลิกเพิ่มประจุ −</button><button type="button" class="lap-chip" data-tool="del">ลบประจุที่เลือก</button></div>' +
      slider("qsel", "ประจุที่เลือก (nC)", -5, 5, 0.1, st.q[0] ? st.q[0].q : 1) + slider("gr", "รัศมีทรงกลมเกาส์ R (m) — กึ่งกลางที่จุด P", 0.3, 3, 0.05, st.gr) +
      checks([["heat", "สีของศักย์ V", true], ["cont", "เส้นศักย์เท่ากัน (equipotential)", true], ["arrows", "ลูกศร E", false], ["lines", "เส้นแรง (field lines)", true], ["gauss", "ทรงกลมเกาส์ + ฟลักซ์", st.view.gauss]]) +
      '<div class="mv-grid2 mv-wide-l"><div class="mv-sm"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">ประจุอยู่ในระนาบ z = 0 (หน่วย nC, ระยะ m) · V = k Σ qᵢ/rᵢ, E = −∇V · ลากจุดสีดำ P เพื่อวัดค่า · ทรงกลมเกาส์รัศมี R ตั้งกึ่งกลางที่ P: ฟลักซ์ของ E ผ่านทรงกลมต้องเท่ากับ Q<sub>ใน</sub>/ε₀ เสมอ ไม่ว่าประจุจะอยู่ตรงไหนภายใน</p>';
    var out = box.querySelector(".mv-out"), host = box.querySelector(".mv-sm"), map = null;
    function V(x, y, z) { z = z || 0; var s = 0; for (var i = 0; i < st.q.length; i++) { var c = st.q[i], r = Math.sqrt((x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) + z * z); s += c.q * 1e-9 / r; } return K_E * s; }
    function E(x, y, z) {
      z = z || 0; var ex = 0, ey = 0, ez = 0;
      for (var i = 0; i < st.q.length; i++) { var c = st.q[i], dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + z * z, r3 = r2 * Math.sqrt(r2), k = K_E * c.q * 1e-9 / r3; ex += k * dx; ey += k * dy; ez += k * z; }
      return [ex, ey, ez];
    }
    function layout() { map = new Map2D(host, { x0: -R, x1: R, y0: -R, y1: R, w: 540, label: "สนามไฟฟ้าและศักย์ของประจุจุด: ลากประจุได้ (electric potential, equipotential lines and field lines of point charges)" }); map.accept = function (x, y) { return near(x, y) !== null; }; map.onPoint = onPt; }
    function near(x, y) {
      var best = null, bd = 18;
      var dist = function (px, py) { return Math.hypot(map.sx(px) - map.sx(x), map.sy(py) - map.sy(y)); };
      if (st.tool === "move" || st.tool === "del") st.q.forEach(function (c, i) { var dd = dist(c.x, c.y); if (dd < bd) { bd = dd; best = { t: "q", i: i }; } });
      var dp = dist(st.px, st.py); if (dp < bd + 4) { best = { t: "p" }; bd = dp; }
      if (st.view.gauss && Math.abs(Math.hypot(x - st.px, y - st.py) - st.gr) * (map.pw / (2 * R)) < 8 && !best) best = { t: "g" };
      return best;
    }
    var grab = null;
    function onPt(x, y, ty) {
      var cl = function (v) { return Math.max(-R, Math.min(R, v)); };
      if (ty === "down") grab = near(x, y);
      if (!grab) return;
      if (grab.t === "q") { st.q[grab.i].x = cl(x); st.q[grab.i].y = cl(y); st.sel = grab.i; setSlider(box, "qsel", st.q[grab.i].q); }
      else if (grab.t === "p") { st.px = cl(x); st.py = cl(y); }
      else if (grab.t === "g") { st.gr = Math.max(0.3, Math.min(3, Math.hypot(x - st.px, y - st.py))); setSlider(box, "gr", st.gr.toFixed(2)); }
      if (ty === "up") grab = null;
      draw(ty === "move" ? "fast" : null);
    }
    var cache = { key: "", s: "" };
    function staticLayer() {
      var key = JSON.stringify(st.q) + JSON.stringify(st.view);
      if (key === cache.key) return;
      cache.key = key;
      var n = 52, g = MVC.grid(function (x, y) { var v = V(x, y); return isFinite(v) ? v : NaN; }, -R, R, -R, R, n, n), vals = [].concat.apply([], g.z).filter(isFinite).map(Math.abs).sort(function (a, b) { return a - b; });
      var cap = vals[Math.floor(vals.length * 0.93)] || 1, s = "", i, j;
      if (st.view.heat) {
        var cw = (map.sx(R) - map.sx(-R)) / (n - 1) + 0.6, ch = (map.sy(-R) - map.sy(R)) / (n - 1) + 0.6;
        for (j = 0; j < n; j++) for (i = 0; i < n; i++) { var v = g.z[j][i]; if (!isFinite(v)) continue; s += '<rect x="' + (map.sx(g.xs[i]) - cw / 2).toFixed(1) + '" y="' + (map.sy(g.ys[j]) - ch / 2).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + ch.toFixed(1) + '" fill="' + div2(v / cap) + '"/>'; }
      }
      if (st.view.cont) {
        var lv = []; for (i = -9; i <= 9; i++) if (i) lv.push(i * cap / 9 * 0.95);
        var gg = MVC.grid(function (x, y) { var v = V(x, y); return isFinite(v) ? v : NaN; }, -R, R, -R, R, 121, 121);
        lv.forEach(function (c) { var segs = MVC.contourSegs(gg.z, gg.xs, gg.ys, c); if (!segs.length) return; s += '<path d="' + segs.map(function (q) { return "M" + map.sx(q[0]).toFixed(1) + " " + map.sy(q[1]).toFixed(1) + "L" + map.sx(q[2]).toFixed(1) + " " + map.sy(q[3]).toFixed(1); }).join("") + '" fill="none" stroke="' + (c > 0 ? "rgba(201,79,24,.75)" : "rgba(31,95,168,.8)") + '" stroke-width="1.1"/>'; });
        var z0 = MVC.contourSegs(gg.z, gg.xs, gg.ys, 0); if (z0.length) s += '<path d="' + z0.map(function (q) { return "M" + map.sx(q[0]).toFixed(1) + " " + map.sy(q[1]).toFixed(1) + "L" + map.sx(q[2]).toFixed(1) + " " + map.sy(q[3]).toFixed(1); }).join("") + '" fill="none" stroke="var(--ink-3)" stroke-width="1.4" stroke-dasharray="5 4"/>';
      }
      if (st.view.arrows) {
        var na = 15, mags = [];
        for (j = 0; j < na; j++) for (i = 0; i < na; i++) { var x = -R + 2 * R * (i + 0.5) / na, y = -R + 2 * R * (j + 0.5) / na, e = E(x, y); mags.push(Math.hypot(e[0], e[1])); }
        var mx = mags.slice().sort(function (a, b) { return a - b; })[Math.floor(mags.length * 0.9)] || 1;
        for (j = 0; j < na; j++) for (i = 0; i < na; i++) {
          var x2 = -R + 2 * R * (i + 0.5) / na, y2 = -R + 2 * R * (j + 0.5) / na, e2 = E(x2, y2), m = Math.hypot(e2[0], e2[1]); if (!(m > 0) || !isFinite(m)) continue;
          var l = 2 * R / na * 0.8 * (0.3 + 0.7 * Math.min(1, m / mx));
          s += map.arrow(x2 - e2[0] / m * l / 2, y2 - e2[1] / m * l / 2, x2 + e2[0] / m * l / 2, y2 + e2[1] / m * l / 2, "var(--ink-2)", 1.6);
        }
      }
      if (st.view.lines) {
        var pos = st.q.filter(function (c) { return c.q > 0; }), neg = st.q.filter(function (c) { return c.q < 0; }), srcs = pos.length ? pos : neg, dir = pos.length ? 1 : -1;
        srcs.forEach(function (c) {
          var nl = Math.max(6, Math.round(Math.abs(c.q) * 5));
          for (var k = 0; k < nl; k++) {
            var a = 2 * PI * (k + 0.5) / nl, x = c.x + 0.09 * Math.cos(a), y = c.y + 0.09 * Math.sin(a), pts = [[x, y]];
            for (var it = 0; it < 500; it++) {
              var e = E(x, y); var m = Math.hypot(e[0], e[1]); if (!(m > 0) || !isFinite(m)) break;
              var h = 0.04, mid = E(x + dir * e[0] / m * h / 2, y + dir * e[1] / m * h / 2), mm = Math.hypot(mid[0], mid[1]); if (!(mm > 0)) break;
              x += dir * mid[0] / mm * h; y += dir * mid[1] / mm * h; pts.push([x, y]);
              if (Math.abs(x) > R || Math.abs(y) > R) break;
              if (st.q.some(function (o) { return o !== c && Math.hypot(o.x - x, o.y - y) < 0.1 && Math.sign(o.q) !== Math.sign(c.q); })) break;
            }
            if (pts.length > 3) s += map.poly(pts, "rgba(20,30,40,.7)", 1.2, "none", false);
          }
        });
      }
      map.setStatic(s);
    }
    function draw(fast) {
      if (!map) layout();
      staticLayer();
      var ov = "", acc = css("--accent"), sig = css("--signal");
      st.q.forEach(function (c, i) {
        var r = 6 + Math.min(8, Math.abs(c.q) * 1.6), f = c.q >= 0 ? acc : sig;
        ov += '<circle cx="' + map.sx(c.x).toFixed(1) + '" cy="' + map.sy(c.y).toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + f + '" stroke="' + (i === st.sel ? "var(--ink)" : "var(--paper)") + '" stroke-width="' + (i === st.sel ? 3 : 2) + '"/><text x="' + map.sx(c.x).toFixed(1) + '" y="' + (map.sy(c.y) + 4).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="monospace" style="pointer-events:none">' + (c.q >= 0 ? "+" : "−") + "</text>";
      });
      var e = E(st.px, st.py), ev = Math.hypot(e[0], e[1]);
      if (st.view.gauss) { var cp = []; for (var i = 0; i <= 72; i++) cp.push([st.px + st.gr * Math.cos(2 * PI * i / 72), st.py + st.gr * Math.sin(2 * PI * i / 72)]); ov += map.poly(cp, "var(--ok)", 2.4, "rgba(47,125,79,.08)", true, "7 4"); }
      if (ev > 0 && isFinite(ev)) ov += map.arrow(st.px, st.py, st.px + e[0] / ev * 0.7, st.py + e[1] / ev * 0.7, "var(--ink)", 3);
      ov += map.dot(st.px, st.py, 6, "var(--ink)", "var(--paper)") + map.text(st.px, st.py, "P", "var(--ink)", 8, -8);
      map.setDyn(ov);
      if (fast === "fast") { return; }
      // read-out: V, E and the check E = −∇V
      var v = V(st.px, st.py), h = 1e-5, gx = -(V(st.px + h, st.py) - V(st.px - h, st.py)) / (2 * h), gy = -(V(st.px, st.py + h) - V(st.px, st.py - h)) / (2 * h);
      var html = '<div class="mv-eqs">' + T("V(x,y)=\\frac{1}{4\\pi\\varepsilon_0}\\sum_i \\frac{q_i}{r_i},\\qquad \\mathbf E=-\\nabla V", true) + "</div>" +
        '<div class="mv-kv"><div><b>V ที่ P</b><span>' + fmt(v, 5) + " V</span></div><div><b>E จากสูตรคูลอมบ์</b><span>(" + fmt(e[0], 4) + ", " + fmt(e[1], 4) + ") V/m</span></div><div><b>E = −∇V (ต่างกันเชิงตัวเลข)</b><span>(" + fmt(gx, 4) + ", " + fmt(gy, 4) + ") V/m</span></div><div><b>|E|</b><span>" + fmt(ev, 5) + " V/m</span></div></div>";
      if (st.view.gauss) {
        var enc = 0; st.q.forEach(function (c) { if (Math.hypot(c.x - st.px, c.y - st.py) < st.gr) enc += c.q; });
        var rr = st.gr, flux = MVC.quad2(function (u, w) { var nx = Math.sin(u) * Math.cos(w), ny = Math.sin(u) * Math.sin(w), nz = Math.cos(u), ee = E(st.px + rr * nx, st.py + rr * ny, rr * nz); return (ee[0] * nx + ee[1] * ny + ee[2] * nz) * rr * rr * Math.sin(u); }, 0, PI, 0, 2 * PI, 32, 3);
        var onSurf = st.q.some(function (c) { return Math.abs(Math.hypot(c.x - st.px, c.y - st.py) - rr) < 0.03; });
        html += '<div class="lap-ans">' + T("\\Phi_E=\\oint\\!\\!\\!\\oint_S \\mathbf E\\!\\cdot\\!\\mathbf n\\,dS=" + tn(flux, 5) + "\\ \\mathrm{V\\cdot m},\\qquad \\frac{Q_{\\text{ใน}}}{\\varepsilon_0}=\\frac{" + tn(enc, 4) + "\\ \\text{nC}}{\\varepsilon_0}=" + tn(enc * 1e-9 / EPS0, 5) + "\\ \\mathrm{V\\cdot m}", true) + "</div>" +
          '<p class="lap-note">' + (onSurf ? "ประจุอยู่ใกล้ผิวทรงกลมมาก ค่าอาจคลาดเคลื่อน — ปรับ R เล็กน้อย" : "✔ ฟลักซ์ผ่านทรงกลมเท่ากับ Q ภายใน ÷ ε₀ — ประจุภายนอกให้ฟลักซ์สุทธิเป็นศูนย์ (เข้าเท่าออก) ลองลากประจุเข้า-ออกจากวงเขียว") + "</p>";
      }
      out.innerHTML = html;
    }
    box.addEventListener("click", function (e) {
      var cp = e.target.closest("[data-cp]");
      if (cp) { var k = cp.getAttribute("data-cp"); st.q = CH_PRE[k][1].map(function (c) { return { x: c[0], y: c[1], q: c[2] }; }); st.sel = 0; setSlider(box, "qsel", st.q[0].q); $$("[data-cp]", box).forEach(function (b) { b.classList.toggle("on", b === cp); }); cache.key = ""; draw(); return; }
      var t = e.target.closest("[data-tool]");
      if (t) {
        var tool = t.getAttribute("data-tool");
        if (tool === "del") { if (st.q.length > 0) { st.q.splice(st.sel, 1); st.sel = 0; cache.key = ""; if (st.q[0]) setSlider(box, "qsel", st.q[0].q); draw(); } return; }
        st.tool = tool; $$("[data-tool]", box).forEach(function (b) { b.classList.toggle("on", b === t); }); return;
      }
    });
    // add charges by clicking the empty map
    host.addEventListener("pointerdown", function (e) {
      if (st.tool !== "addp" && st.tool !== "addn") return;
      var svg = host.querySelector("svg"), p = MK.svgPoint(svg, e), x = map.ix(p.x), y = map.iy(p.y);
      if (near(x, y)) return;
      st.q.push({ x: x, y: y, q: st.tool === "addp" ? 2 : -2 }); st.sel = st.q.length - 1; setSlider(box, "qsel", st.q[st.sel].q); cache.key = ""; draw();
    }, true);
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { st.view[c.getAttribute("data-chk")] = c.checked; cache.key = ""; draw(); }); });
    $$("input[data-k]", box).forEach(function (r) { r.addEventListener("input", function () { var k = r.getAttribute("data-k"); if (k === "qsel") { if (st.q[st.sel]) { st.q[st.sel].q = +r.value; cache.key = ""; draw(); } } else { st[k] = +r.value; draw(); } }); r.parentNode.querySelector("output"); });
    $$("input[data-k]", box).forEach(function (r) { r.addEventListener("input", function () { r.parentNode.querySelector("output").textContent = MVL.fmtOut(r.value); }); });
    box._set = function (o) { if (o.preset && CH_PRE[o.preset]) { st.q = CH_PRE[o.preset][1].map(function (c) { return { x: c[0], y: c[1], q: c[2] }; }); st.sel = 0; } if (o.px !== undefined) st.px = o.px; if (o.py !== undefined) st.py = o.py; if (o.gauss !== undefined) { st.view.gauss = o.gauss; box.querySelector("[data-chk=gauss]").checked = o.gauss; } cache.key = ""; draw(); };
    draw();
  }

  /* ================================================================== mv-heat */
  function plateSeries(L, H, Th, Tc) {
    return function (x, y) {
      if (x < 0 || x > L || y < 0 || y > H) return NaN;
      var s = 0;
      for (var n = 1; n <= 199; n += 2) { var a = n * PI / L, num = Math.exp(a * (y - H)) * (1 - Math.exp(-2 * a * y)) / (1 - Math.exp(-2 * a * H)); s += Math.sin(a * x) * num / n; }
      return Tc + (Th - Tc) * 4 / PI * s;
    };
  }
  var HEAT_PRE = {
    plate: { n: "แผ่นโลหะ ขอบบนร้อน 100 °C (ที่เหลือ 20 °C)", dom: [0, 1, 0, 1], series: [1, 1, 100, 20], unit: "m", k: 237 },
    wall: { n: "ผนังหนา L: 1 มิติ (อุณหภูมิเป็นเส้นตรง)", dom: [0, 1, 0, 0.6], T: "35-30*x/1", k: 1.4 },
    spot: { n: "จุดร้อนแบบเกาส์ (ไม่ steady: ∇²T ≠ 0)", dom: [0, 1.2, 0, 1], T: "25+120*exp(-((x-0.6)^2+(y-0.5)^2)/0.04)", k: 237 },
    pipe: { n: "ท่อกลม: นำความร้อนตามรัศมี", dom: [-0.5, 0.5, -0.5, 0.5], T: "150+(25-150)*ln(sqrt(x^2+y^2)/0.1)/ln(0.5/0.1)", mask: [0.1, 0.5], k: 50 },
    corner: { n: "มุมฉาก: T = 20 + 80xy (สมการลาปลาซ)", dom: [0, 1, 0, 1], T: "20+80*x*y", k: 50 }
  };
  var MATS = [["ทองแดง 400", 400], ["อะลูมิเนียม 237", 237], ["เหล็กกล้า 50", 50], ["คอนกรีต 1.4", 1.4], ["อิฐ 0.7", 0.7], ["ฉนวนโฟม 0.04", 0.04]];
  function initHeat(box) {
    var d = box.dataset, key = d.preset || "plate";
    var st = { key: key, k: +(d.k || HEAT_PRE[key].k), px: 0.35, py: 0.65, w: 0.12, showq: true };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + Object.keys(HEAT_PRE).map(function (k) { return '<button type="button" class="lap-chip' + (k === key ? " on" : "") + '" data-hp="' + k + '">' + HEAT_PRE[k].n + "</button>"; }).join("") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">วัสดุ: k (W/m·K)</label><select class="lap-in sm" data-in="mat">' + MATS.map(function (m) { return '<option value="' + m[1] + '">' + m[0] + "</option>"; }).join("") + '</select><label class="lap-lbl">k =</label><input class="lap-in sm" data-in="k" value="' + st.k + '"></div>' +
      slider("w", "ครึ่งด้านของกล่องตรวจ (control box) ที่ล้อมจุด P (m)", 0.02, 0.3, 0.01, st.w) +
      checks([["showq", "ลูกศรฟลักซ์ความร้อน q = −k∇T", true]]) +
      '<div class="mv-grid2 mv-wide-l"><div class="mv-sm"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">สีแสดงอุณหภูมิ T(x, y) เส้นบางคือไอโซเทอร์ม (isotherm) ลูกศรคือฟลักซ์ความร้อน q = −k∇T ซึ่งตั้งฉากกับไอโซเทอร์มและชี้จากร้อนไปเย็น · ลากจุด P เพื่ออ่านค่า · กรอบเขียวคือ “กล่องตรวจ”: ความร้อนสุทธิที่ไหลออกจากกรอบ ∮ q·n ds ต้องเท่ากับ ∬ ∇·q dA (ทฤษฎีบทดีเวอร์เจนซ์) และเท่ากับศูนย์เมื่อ ∇²T = 0</p>';
    var out = box.querySelector(".mv-out"), host = box.querySelector(".mv-sm"), sel = box.querySelector('[data-in="mat"]'), kin = box.querySelector('[data-in="k"]');
    var map = null, Tf = null, cur = null;
    function setup() {
      cur = HEAT_PRE[st.key];
      var f;
      if (cur.series) f = plateSeries(cur.series[0], cur.series[1], cur.series[2], cur.series[3]);
      else { var C = compileIn(cur.T, ["x", "y"], out, "T"); if (!C) return false; f = function (x, y) { if (cur.mask) { var r = Math.hypot(x, y); if (r < cur.mask[0] || r > cur.mask[1]) return NaN; } return C(x, y); }; }
      Tf = f;
      var D = cur.dom, W = D[1] - D[0], Hh = D[3] - D[2], pad = 0;
      map = new Map2D(host, { x0: D[0] - pad, x1: D[1] + pad, y0: D[2] - pad, y1: D[3] + pad, w: 540, label: "สนามอุณหภูมิ ไอโซเทอร์ม และเวกเตอร์ฟลักซ์ความร้อน (temperature field, isotherms and heat flux vectors)" });
      var n = 70, g = MVC.grid(Tf, D[0], D[1], D[2], D[3], n, Math.max(20, Math.round(n * Hh / W))), rg = MVC.range(g), s = "";
      var cw = map.pw / (n - 1) + 0.6, ch = map.ph / (g.ys.length - 1) + 0.6;
      for (var j = 0; j < g.ys.length; j++) for (var i = 0; i < n; i++) { var v = g.z[j][i]; if (!isFinite(v)) continue; s += '<rect x="' + (map.sx(g.xs[i]) - cw / 2).toFixed(1) + '" y="' + (map.sy(g.ys[j]) - ch / 2).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + ch.toFixed(1) + '" fill="' + MVL.cm((v - rg[0]) / (rg[1] - rg[0] || 1)) + '" opacity=".55"/>'; }
      s += map.contours(g, MVC.levels(rg[0], rg[1], 14), rg[0], rg[1], 1.2).replace(/stroke="rgb\([^)]*\)"/g, 'stroke="rgba(20,30,40,.55)"');
      st.rg = rg; st.g = g; st.base = s;
      map.accept = function (x, y) { return Math.hypot(map.sx(x) - map.sx(st.px), map.sy(y) - map.sy(st.py)) < 26; };
      map.onPoint = function (x, y) { st.px = Math.max(D[0], Math.min(D[1], x)); st.py = Math.max(D[2], Math.min(D[3], y)); draw(); };
      return true;
    }
    function grad(x, y) { var h = 1e-5 * Math.max(1, cur.dom[1] - cur.dom[0]); return [(Tf(x + h, y) - Tf(x - h, y)) / (2 * h), (Tf(x, y + h) - Tf(x, y - h)) / (2 * h)]; }
    function lap(x, y) { var h = 1e-3 * (cur.dom[1] - cur.dom[0]); return (Tf(x + h, y) + Tf(x - h, y) + Tf(x, y + h) + Tf(x, y - h) - 4 * Tf(x, y)) / (h * h); }
    function draw() {
      if (!map && !setup()) return;
      var D = cur.dom, k = st.k, s = st.base, i, j;
      if (st.showq) {
        var na = 13, nb = Math.max(6, Math.round(na * (D[3] - D[2]) / (D[1] - D[0]))), qs = [];
        for (j = 0; j < nb; j++) for (i = 0; i < na; i++) { var x = D[0] + (D[1] - D[0]) * (i + 0.5) / na, y = D[2] + (D[3] - D[2]) * (j + 0.5) / nb; if (!isFinite(Tf(x, y))) continue; var gd = grad(x, y); qs.push([x, y, -k * gd[0], -k * gd[1]]); }
        var mx = Math.max.apply(null, qs.map(function (q) { return Math.hypot(q[2], q[3]); })) || 1, len = (D[1] - D[0]) / na * 0.8;
        qs.forEach(function (q) { var m = Math.hypot(q[2], q[3]); if (m < 1e-9 * mx) return; var l = len * (0.3 + 0.7 * m / mx); s += map.arrow(q[0] - q[2] / m * l / 2, q[1] - q[3] / m * l / 2, q[0] + q[2] / m * l / 2, q[1] + q[3] / m * l / 2, "var(--ink)", 1.8); });
      }
      map.setStatic(s);
      var w = st.w, bx0 = st.px - w, bx1 = st.px + w, by0 = st.py - w, by1 = st.py + w;
      var ov = map.poly([[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]], "var(--ok)", 2.4, "rgba(47,125,79,.12)", true, "7 4");
      var T0 = Tf(st.px, st.py), gd0 = grad(st.px, st.py), q0 = [-k * gd0[0], -k * gd0[1]], qm = Math.hypot(q0[0], q0[1]);
      if (isFinite(qm) && qm > 0) ov += map.arrow(st.px, st.py, st.px + q0[0] / qm * (D[1] - D[0]) * 0.12, st.py + q0[1] / qm * (D[1] - D[0]) * 0.12, "var(--accent)", 3.2);
      ov += map.dot(st.px, st.py, 6, "var(--accent)") + map.text(st.px, st.py, "P", "var(--ink)", 8, -8);
      map.setDyn(ov);
      // net heat out of the control box (flux integral over its four edges) versus the area integral of div q = −k ∇²T
      var inside = [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]].every(function (c) { return isFinite(Tf(c[0], c[1])); });
      var net = NaN, divInt = NaN, L2 = lap(st.px, st.py);
      if (inside) {
        var ex = 1e-9, qn = function (x, y, nx, ny) { var g2 = grad(x, y); return -k * (g2[0] * nx + g2[1] * ny); };
        net = MVC.quad(function (y) { return qn(bx1 - ex, y, 1, 0); }, by0 + ex, by1 - ex, 20, 2) + MVC.quad(function (y) { return qn(bx0 + ex, y, -1, 0); }, by0 + ex, by1 - ex, 20, 2) +
          MVC.quad(function (x) { return qn(x, by1 - ex, 0, 1); }, bx0 + ex, bx1 - ex, 20, 2) + MVC.quad(function (x) { return qn(x, by0 + ex, 0, -1); }, bx0 + ex, bx1 - ex, 20, 2);
        divInt = MVC.quad2(function (x, y) { return -k * lap(x, y); }, bx0 + ex, bx1 - ex, by0 + ex, by1 - ex, 14, 2);
      }
      out.innerHTML = '<div class="mv-eqs">' + T("\\mathbf q=-k\\nabla T,\\qquad \\nabla\\!\\cdot\\!\\mathbf q=-k\\nabla^2T \\quad(\\text{steady, no source: }\\nabla^2T=0)", true) + "</div>" +
        '<div class="mv-kv"><div><b>T ที่ P</b><span>' + fmt(T0, 5) + " °C</span></div><div><b>∇T</b><span>(" + fmt(gd0[0], 4) + ", " + fmt(gd0[1], 4) + ") K/m</span></div><div><b>q = −k∇T</b><span>(" + fmt(q0[0], 4) + ", " + fmt(q0[1], 4) + ") W/m²</span></div><div><b>|q|</b><span>" + fmt(qm, 5) + " W/m²</span></div><div><b>∇²T = Tₓₓ + T_yy</b><span>" + fmt(L2, 4) + " K/m²</span></div>" +
        (inside ? "<div><b>∮ q·n ds (สุทธิออกจากกรอบ)</b><span>" + fmt(net, 4) + " W/m</span></div><div><b>∬ ∇·q dA = ∬ −k∇²T dA</b><span>" + fmt(divInt, 4) + " W/m</span></div>" : "") + "</div>" +
        '<p class="lap-note">' + (!inside ? "กรอบทับขอบหรือรูของแผ่น — ย้าย P หรือลดขนาดกรอบ" : Math.abs(L2) < 1e-3 * (Math.abs(st.rg[1] - st.rg[0]) / Math.pow(D[1] - D[0], 2) + 1) ? "∇²T ≈ 0 (คำตอบของสมการลาปลาซ): ความร้อนที่เข้ากรอบเท่ากับที่ออก ∮ q·n ds ≈ 0 — แต่ q ไม่ใช่ศูนย์ ความร้อนแค่ไหลผ่าน" : "∇²T ≠ 0: มีแหล่งกำเนิด/การสะสมความร้อนในกรอบ จึงมีความร้อนสุทธิออก ∮ q·n ds ≠ 0 และเท่ากับ ∬ ∇·q dA ตามทฤษฎีบทดีเวอร์เจนซ์") + "</p>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-hp]"); if (!b) return;
      st.key = b.getAttribute("data-hp"); var p = HEAT_PRE[st.key]; st.k = p.k; kin.value = st.k; st.px = p.dom[0] + (p.dom[1] - p.dom[0]) * 0.35; st.py = p.dom[2] + (p.dom[3] - p.dom[2]) * 0.65; map = null;
      $$("[data-hp]", box).forEach(function (c) { c.classList.toggle("on", c === b); }); draw();
    });
    sel.addEventListener("change", function () { st.k = +sel.value; kin.value = st.k; draw(); });
    kin.addEventListener("input", debounce(function () { var v = parseFloat(kin.value); if (v > 0) { st.k = v; draw(); } }, 250));
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { st[c.getAttribute("data-chk")] = c.checked; draw(); }); });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) {
      if (o.key && HEAT_PRE[o.key]) {
        st.key = o.key; var p = HEAT_PRE[st.key]; st.k = p.k; kin.value = st.k; st.px = p.dom[0] + (p.dom[1] - p.dom[0]) * 0.35; st.py = p.dom[2] + (p.dom[3] - p.dom[2]) * 0.65; map = null;
        $$("[data-hp]", box).forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-hp") === st.key); });
      }
      if (o.px !== undefined) st.px = o.px; if (o.py !== undefined) st.py = o.py;
      if (o.k) { st.k = o.k; kin.value = o.k; }
      draw();
    };
    draw();
  }

  /* ================================================================== mv-terrain */
  var TERR_PRE = {
    slope: { n: "ที่ลาดเอียง + ลูกคลื่นเล็ก", h: "10+0.06*x+0.03*y+0.8*sin(x/9)*cos(y/11)", z0: 11.5 },
    hill: { n: "เนินดิน", h: "8+5*exp(-((x-30)^2+(y-22)^2)/260)", z0: 9 },
    valley: { n: "ร่องน้ำ (valley)", h: "12-4*exp(-((y-20)^2)/90)+0.04*x", z0: 11 },
    saddle: { n: "สันเขา-ที่ต่ำ (saddle)", h: "10+((x-30)^2-(y-20)^2)/400", z0: 10 }
  };
  function initTerrain(box) {
    var d = box.dataset, key = d.preset || "slope";
    var st = { key: key, h: d.h || TERR_PRE[key].h, lx: +(d.lx || 60), ly: +(d.ly || 40), z0: +(d.z0 || TERR_PRE[key].z0), x0: 5, x1: 55, y0: 5, y1: 35, px: 40, py: 12, sw: +(d.sw || 1) };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + Object.keys(TERR_PRE).map(function (k) { return '<button type="button" class="lap-chip' + (k === key ? " on" : "") + '" data-tp="' + k + '">' + TERR_PRE[k].n + "</button>"; }).join("") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">ความสูงภูมิประเทศ h(x, y) เมตร =</label><input class="lap-in" data-in="h" value="' + esc(st.h) + '" spellcheck="false"></div>' +
      slider("z0", "ระดับพื้นที่ปรับแต่ง (pad level) z₀ (m)", 4, 20, 0.05, st.z0) +
      '<div class="mv-sl2">' + slider("x0", "pad: x จาก", 0, 60, 1, st.x0) + slider("x1", "ถึง x", 0, 60, 1, st.x1) + slider("y0", "pad: y จาก", 0, 40, 1, st.y0) + slider("y1", "ถึง y", 0, 40, 1, st.y1) + "</div>" +
      '<div class="mv-grid2"><div class="mv-sm"></div><div class="mv-s3"></div></div><div class="mv-out"></div>' +
      '<p class="lap-help">แผนที่: เส้นชั้นความสูงทุก 1 m · สีพื้น = ความชัน |∇h| (%) · ลูกศร = ทิศน้ำไหล −∇h · สี่เหลี่ยมเส้นประ = พื้นที่ปรับระดับ (pad) · ปริมาตรขุด/ถมคือ ∬ max(h − z₀, 0) dA และ ∬ max(z₀ − h, 0) dA · ลากจุด P บนแผนที่เพื่ออ่านความชัน</p>';
    var out = box.querySelector(".mv-out"), scene = new Scene3D(box.querySelector(".mv-s3"), { label: "ภูมิประเทศ 3 มิติกับระดับ pad (terrain surface and platform level for cut and fill)", ratio: 0.8, labels: ["x (m)", "y (m)", "z (m)"] });
    var map = null, H = null, key2 = "", g = null, rg = null;
    function build() {
      H = compileIn(st.h, ["x", "y"], out, "h"); if (!H) return false;
      var k2 = st.h + "|" + st.lx + "|" + st.ly;
      if (k2 !== key2) {
        key2 = k2;
        g = MVC.grid(H, 0, st.lx, 0, st.ly, 61, 41); rg = MVC.range(g);
        map = new Map2D(box.querySelector(".mv-sm"), { x0: 0, x1: st.lx, y0: 0, y1: st.ly, w: 560, xl: "x (m)", yl: "y (m)", label: "แผนที่เส้นชั้นความสูงและความชันของพื้นที่ก่อสร้าง (contour and slope map of the site)" });
        var sl = [], j, i, mx = 0, HX = MVC.compile(MVC.d(H.ast, "x"), ["x", "y"]), HY = MVC.compile(MVC.d(H.ast, "y"), ["x", "y"]);
        for (j = 0; j < g.ys.length; j++) { sl.push([]); for (i = 0; i < g.xs.length; i++) { var s = 100 * Math.hypot(HX(g.xs[i], g.ys[j]), HY(g.xs[i], g.ys[j])); sl[j].push(s); if (isFinite(s)) mx = Math.max(mx, s); } }
        var cw = map.pw / (g.xs.length - 1) + 0.6, ch = map.ph / (g.ys.length - 1) + 0.6, s2 = "";
        for (j = 0; j < g.ys.length; j++) for (i = 0; i < g.xs.length; i++) s2 += '<rect x="' + (map.sx(g.xs[i]) - cw / 2).toFixed(1) + '" y="' + (map.sy(g.ys[j]) - ch / 2).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + ch.toFixed(1) + '" fill="' + MVL.cm(Math.min(1, sl[j][i] / Math.max(mx, 1e-9))) + '" opacity=".4"/>';
        var lv = []; for (var z = Math.ceil(rg[0]); z <= rg[1]; z += 1) lv.push(z);
        s2 += map.contours(g, lv, rg[0], rg[1], 1.1).replace(/stroke="rgb\([^)]*\)"/g, 'stroke="rgba(20,30,40,.6)"');
        for (j = 2; j < g.ys.length; j += 5) for (i = 2; i < g.xs.length; i += 5) { var gx = HX(g.xs[i], g.ys[j]), gy = HY(g.xs[i], g.ys[j]), m = Math.hypot(gx, gy); if (m < 1e-6) continue; var l = 3.2; s2 += map.arrow(g.xs[i], g.ys[j], g.xs[i] - gx / m * l, g.ys[j] - gy / m * l, "rgba(31,95,168,.9)", 1.5); }
        map.setStatic(s2); st.HX = HX; st.HY = HY; st.slmax = mx;
        map.accept = function (x, y) { return Math.hypot(map.sx(x) - map.sx(st.px), map.sy(y) - map.sy(st.py)) < 26; };
        map.onPoint = function (x, y) { st.px = Math.max(0, Math.min(st.lx, x)); st.py = Math.max(0, Math.min(st.ly, y)); draw(); };
      }
      return true;
    }
    function draw() {
      if (!H && !build()) return; if (!build()) return;
      var x0 = Math.min(st.x0, st.x1), x1 = Math.max(st.x0, st.x1), y0 = Math.min(st.y0, st.y1), y1 = Math.max(st.y0, st.y1);
      if (x1 - x0 < 1 || y1 - y0 < 1) { out.innerHTML = '<p class="lap-err">⚠ pad ต้องกว้างและยาวอย่างน้อย 1 m</p>'; return; }
      var z0 = st.z0, A = (x1 - x0) * (y1 - y0);
      var cut = MVC.quad2(function (x, y) { return Math.max(H(x, y) - z0, 0); }, x0, x1, y0, y1, 24, 4);
      var fill = MVC.quad2(function (x, y) { return Math.max(z0 - H(x, y), 0); }, x0, x1, y0, y1, 24, 4);
      var mean = MVC.quad2(function (x, y) { return H(x, y); }, x0, x1, y0, y1, 24, 2) / A;
      var ov = map.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], "var(--accent)", 2.6, "rgba(201,79,24,.1)", true, "8 5");
      var hp = H(st.px, st.py), sx = st.HX(st.px, st.py), sy = st.HY(st.px, st.py), sp = 100 * Math.hypot(sx, sy);
      var comp = (Math.atan2(-sx, -sy) * 180 / PI + 360) % 360; // bearing of steepest descent from north (+y), clockwise
      ov += map.dot(st.px, st.py, 6, "var(--accent)") + map.text(st.px, st.py, "P", "var(--ink)", 8, -8);
      map.setDyn(ov);
      var items = [surfaceItem(H, 0, st.lx, 0, st.ly, 41, [rg[0] - 0.01, rg[1] + 0.01])];
      items.push({ type: "poly", pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], fill: "rgba(201,79,24,.4)", stroke: css("--accent"), layer: 1, noBox: true });
      items.push({ type: "point", p: [st.px, st.py, hp], r: 5, color: css("--accent"), layer: 2, noBox: true });
      scene.set(items, [0, st.lx, 0, st.ly, Math.min(rg[0], z0) - 0.5, Math.max(rg[1], z0) + 0.5]);
      var trucks = Math.ceil(cut * st.sw / 10);
      out.innerHTML = '<div class="mv-eqs">' + T("V_{\\text{ขุด}}=\\iint_{R}\\max(h-z_0,0)\\,dA,\\qquad V_{\\text{ถม}}=\\iint_{R}\\max(z_0-h,0)\\,dA,\\qquad z^{*}=\\frac{1}{A}\\iint_R h\\,dA", true) + "</div>" +
        '<div class="mv-kv"><div><b>พื้นที่ pad A</b><span>' + fmt(A, 5) + " m²</span></div><div><b>ปริมาตรขุด (cut)</b><span>" + fmt(cut, 6) + " m³</span></div><div><b>ปริมาตรถม (fill)</b><span>" + fmt(fill, 6) + " m³</span></div><div><b>ขุด − ถม (ดินเหลือ +/ขาด −)</b><span>" + fmt(cut - fill, 5) + " m³</span></div><div><b>ระดับสมดุล z* = ค่าเฉลี่ยของ h</b><span>" + fmt(mean, 5) + " m</span></div><div><b>รถบรรทุก 10 m³ (ดินส่วนขุด)</b><span>" + trucks + " เที่ยว</span></div></div>" +
        '<div class="lap-ans">' + T("\\text{จุด P: } h=" + tn(hp, 4) + "\\ \\text{m},\\ \\nabla h=(" + tn(sx, 4) + ",\\ " + tn(sy, 4) + "),\\ \\text{ความชัน } |\\nabla h|=" + tn(sp, 4) + "\\%,\\ \\text{น้ำไหลไปทิศ } " + tn(comp, 4) + "^\\circ\\ \\text{(จากทิศเหนือ ตามเข็มนาฬิกา)}", true) + "</div>" +
        '<p class="lap-note">ตั้ง z₀ ให้เท่ากับ ' + fmt(mean, 4) + " m เพื่อให้ขุด = ถม พอดี (ดินไม่ต้องขนเข้า-ออก; ในงานจริงต้องคิดตัวคูณการขยายตัว/บดอัดของดินเพิ่ม)</p>";
    }
    var inp = box.querySelector('[data-in="h"]'); inp.addEventListener("input", debounce(function () { st.h = inp.value; key2 = ""; H = null; draw(); }, 300));
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tp]"); if (!b) return;
      var p = TERR_PRE[b.getAttribute("data-tp")]; st.h = p.h; st.z0 = p.z0; inp.value = st.h; setSlider(box, "z0", st.z0); key2 = ""; H = null;
      $$("[data-tp]", box).forEach(function (c) { c.classList.toggle("on", c === b); }); draw();
    });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); inp.value = st.h; ["z0", "x0", "x1", "y0", "y1"].forEach(function (k) { setSlider(box, k, st[k]); }); key2 = ""; H = null; draw(); };
    draw();
  }

  /* ================================================================== mv-sect — polygon section properties by Green's theorem */
  var SECT_PRE = {
    rect: ["สี่เหลี่ยม 300×500", "0,0\n300,0\n300,500\n0,500"],
    T: ["หน้าตัดรูปตัว T", "0,0\n100,0\n100,300\n200,300\n200,400\n-100,400\n-100,300\n0,300"],
    I: ["เหล็กรูปตัว I (ประมาณ)", "0,0\n200,0\n200,20\n110,20\n110,280\n200,280\n200,300\n0,300\n0,280\n90,280\n90,20\n0,20"],
    L: ["เหล็กฉาก L", "0,0\n150,0\n150,20\n20,20\n20,150\n0,150"],
    tri: ["สามเหลี่ยม b=300, h=450", "0,0\n300,0\n0,450"]
  };
  function initSect(box) {
    var d = box.dataset, key = d.preset || "T";
    var st = { pts: d.pts ? d.pts.replace(/;/g, "\n") : SECT_PRE[key][1] };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + Object.keys(SECT_PRE).map(function (k) { return '<button type="button" class="lap-chip' + (k === key ? " on" : "") + '" data-sp="' + k + '">' + SECT_PRE[k][0] + "</button>"; }).join("") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">จุดยอดของหน้าตัด (x, y) หน่วย mm บรรทัดละจุด เรียงต่อกันรอบรูป · ลากจุดบนภาพเพื่อแก้</label></div><textarea class="mv-ta" data-in="pts" spellcheck="false">' + esc(st.pts) + "</textarea>" +
      '<div class="mv-grid2"><div class="mv-sm"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">ใช้ Green’s theorem แปลงอินทิกรัลสองชั้น A = ∬dA, x̄ = ∬x dA / A, Iₓ = ∬y² dA ฯลฯ เป็นผลรวมตามขอบของรูปหลายเหลี่ยม (exact) · รูปที่มีรูกลวงให้แก้โดยหักหน้าตัดเอง (ตัวอย่างเช่นในหน้าบทความ) · มุม θₚ คือมุมของแกนหลัก (principal axes) ที่ Iₓᵧ = 0</p>';
    var out = box.querySelector(".mv-out"), ta = box.querySelector('[data-in="pts"]'), map = null, P = [];
    function parse() { var a = []; ta.value.split(/\n|;/).forEach(function (l) { var m = l.trim().split(/[\s,]+/).map(parseFloat); if (m.length >= 2 && isFinite(m[0]) && isFinite(m[1])) a.push([m[0], m[1]]); }); return a; }
    function props(pts) {
      var n = pts.length, A2 = 0, sx = 0, sy = 0, ix = 0, iy = 0, ixy = 0, i;
      for (i = 0; i < n; i++) {
        var p = pts[i], q = pts[(i + 1) % n], cr = p[0] * q[1] - q[0] * p[1];
        A2 += cr; sx += (p[0] + q[0]) * cr; sy += (p[1] + q[1]) * cr;
        ix += (p[1] * p[1] + p[1] * q[1] + q[1] * q[1]) * cr; iy += (p[0] * p[0] + p[0] * q[0] + q[0] * q[0]) * cr;
        ixy += (p[0] * q[1] + 2 * p[0] * p[1] + 2 * q[0] * q[1] + q[0] * p[1]) * cr;
      }
      var sgn = A2 < 0 ? -1 : 1, A = Math.abs(A2) / 2;
      var cx = sx / (3 * A2), cy = sy / (3 * A2);
      var Ix = sgn * ix / 12, Iy = sgn * iy / 12, Ixy = sgn * ixy / 24;
      return { A: A, cx: cx, cy: cy, Ix0: Ix, Iy0: Iy, Ixy0: Ixy, Ix: Ix - A * cy * cy, Iy: Iy - A * cx * cx, Ixy: Ixy - A * cx * cy, cw: A2 < 0 };
    }
    function pip(x, y, pts) { var c = false, n = pts.length; for (var i = 0, j = n - 1; i < n; j = i++) if ((pts[i][1] > y) !== (pts[j][1] > y) && x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; }
    function draw(skip) {
      P = parse();
      if (P.length < 3) { out.innerHTML = '<p class="lap-err">⚠ ต้องมีอย่างน้อย 3 จุด</p>'; return; }
      var r = props(P), xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), sp = Math.max(x1 - x0, y1 - y0), pd = sp * 0.18, cx0 = (x0 + x1) / 2, cy0 = (y0 + y1) / 2, half = sp / 2 + pd;
      map = new Map2D(box.querySelector(".mv-sm"), { x0: cx0 - half, x1: cx0 + half, y0: cy0 - half, y1: cy0 + half, w: 460, xl: "x (mm)", yl: "y (mm)", label: "หน้าตัดรูปหลายเหลี่ยม จุดศูนย์ถ่วง และแกนหลัก (polygon section, centroid and principal axes)" });
      var s = map.poly(P, "var(--ink)", 2.4, "rgba(31,95,168,.22)", true);
      var th = 0.5 * Math.atan2(-2 * r.Ixy, r.Ix - r.Iy), L = sp * 0.6;
      s += map.line(r.cx - L * Math.cos(th), r.cy - L * Math.sin(th), r.cx + L * Math.cos(th), r.cy + L * Math.sin(th), "var(--accent)", 1.6, "7 4") + map.line(r.cx + L * Math.sin(th), r.cy - L * Math.cos(th), r.cx - L * Math.sin(th), r.cy + L * Math.cos(th), "var(--accent)", 1.6, "7 4");
      s += map.line(r.cx - L, r.cy, r.cx + L, r.cy, "var(--ink-3)", 1, "3 4") + map.line(r.cx, r.cy - L, r.cx, r.cy + L, "var(--ink-3)", 1, "3 4");
      P.forEach(function (p, i) { s += map.dot(p[0], p[1], 5, "var(--signal)", "var(--paper)", "", ' data-v="' + i + '"'); });
      s += map.dot(r.cx, r.cy, 6.5, "var(--accent)") + map.text(r.cx, r.cy, "C", "var(--ink)", 9, -9);
      map.setDyn(s);
      map.accept = function (x, y) { return P.some(function (p) { return Math.hypot(map.sx(p[0]) - map.sx(x), map.sy(p[1]) - map.sy(y)) < 16; }); };
      var gi = -1;
      map.onPoint = function (x, y, ty) {
        if (ty === "down") { var b = 16; gi = -1; P.forEach(function (p, i) { var dd = Math.hypot(map.sx(p[0]) - map.sx(x), map.sy(p[1]) - map.sy(y)); if (dd < b) { b = dd; gi = i; } }); }
        if (gi < 0) return;
        var snap = sp / 100; P[gi] = [Math.round(x / snap) * snap, Math.round(y / snap) * snap];
        ta.value = P.map(function (p) { return +p[0].toPrecision(5) + "," + +p[1].toPrecision(5); }).join("\n");
        if (ty === "up") draw(); else draw(true);
      };
      // numerical check of A and x̄ with a point grid
      var N = 160, cnt = 0, mx = 0, my = 0, ixn = 0;
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var px = x0 + (x1 - x0) * (i + 0.5) / N, py = y0 + (y1 - y0) * (j + 0.5) / N; if (pip(px, py, P)) { cnt++; mx += px; my += py; ixn += py * py; } }
      var dA = (x1 - x0) * (y1 - y0) / (N * N), An = cnt * dA;
      var I1 = (r.Ix + r.Iy) / 2 + Math.sqrt(Math.pow((r.Ix - r.Iy) / 2, 2) + r.Ixy * r.Ixy), I2 = (r.Ix + r.Iy) / 2 - Math.sqrt(Math.pow((r.Ix - r.Iy) / 2, 2) + r.Ixy * r.Ixy);
      var yt = y1 - r.cy, yb = r.cy - y0;
      out.innerHTML = '<div class="mv-eqs">' + T("A=\\tfrac12\\sum (x_iy_{i+1}-x_{i+1}y_i),\\quad \\bar x=\\frac{1}{6A}\\sum (x_i+x_{i+1})(x_iy_{i+1}-x_{i+1}y_i)", true) + T("I_x=\\frac1{12}\\sum (y_i^2+y_iy_{i+1}+y_{i+1}^2)(x_iy_{i+1}-x_{i+1}y_i)\\ \\text{ (รอบแกนที่ผ่านจุดกำเนิด) แล้วย้ายด้วย } I_{\\bar x}=I_x-A\\bar y^2", true) + "</div>" +
        '<div class="mv-kv"><div><b>พื้นที่ A</b><span>' + fmt(r.A, 7) + " mm²</span></div><div><b>จุดศูนย์ถ่วง (x̄, ȳ)</b><span>(" + fmt(r.cx, 6) + ", " + fmt(r.cy, 6) + ")</span></div><div><b>I<sub>x̄</sub> รอบแกน x ผ่าน C</b><span>" + fmt(r.Ix / 1e6, 7) + " ×10⁶ mm⁴</span></div><div><b>I<sub>ȳ</sub> รอบแกน y ผ่าน C</b><span>" + fmt(r.Iy / 1e6, 7) + " ×10⁶ mm⁴</span></div><div><b>I<sub>x̄ȳ</sub> (product)</b><span>" + fmt(r.Ixy / 1e6, 6) + " ×10⁶ mm⁴</span></div><div><b>แกนหลัก θ<sub>p</sub></b><span>" + fmt(th * 180 / PI, 5) + "°</span></div><div><b>I₁ (สูงสุด)</b><span>" + fmt(I1 / 1e6, 7) + " ×10⁶ mm⁴</span></div><div><b>I₂ (ต่ำสุด)</b><span>" + fmt(I2 / 1e6, 7) + " ×10⁶ mm⁴</span></div><div><b>S บน = I<sub>x̄</sub>/y<sub>บน</sub></b><span>" + fmt(r.Ix / yt / 1e3, 6) + " ×10³ mm³</span></div><div><b>S ล่าง = I<sub>x̄</sub>/y<sub>ล่าง</sub></b><span>" + fmt(r.Ix / yb / 1e3, 6) + " ×10³ mm³</span></div><div><b>รัศมีไจเรชัน r<sub>x</sub></b><span>" + fmt(Math.sqrt(r.Ix / r.A), 5) + " mm</span></div></div>" +
        '<p class="lap-note">ตรวจด้วยจุดตารางหนาแน่น 160 × 160: A ≈ ' + fmt(An, 6) + " mm², x̄ ≈ " + fmt(mx / cnt, 5) + ", ȳ ≈ " + fmt(my / cnt, 5) + " (ต้องใกล้เคียงค่าจากสูตร Green)" + (r.cw ? " · ลำดับจุดวนตามเข็มนาฬิกา โปรแกรมปรับเครื่องหมายให้แล้ว" : "") + "</p>";
    }
    ta.addEventListener("input", debounce(function () { draw(); }, 300));
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-sp]"); if (!b) return; ta.value = SECT_PRE[b.getAttribute("data-sp")][1]; $$("[data-sp]", box).forEach(function (c) { c.classList.toggle("on", c === b); }); draw(); });
    box._set = function (o) { if (o.pts) ta.value = o.pts.replace(/;/g, "\n"); draw(); };
    draw();
    MVL.sectProps = props;
  }

  MVL.register("mv-charge", initCharge);
  MVL.register("mv-heat", initHeat);
  MVL.register("mv-terrain", initTerrain);
  MVL.register("mv-sect", initSect);
  MVL.boot();
})(typeof window !== "undefined" ? window : globalThis);
