/* Mechanics lab (Physics 1 style) for /learn/vector-algebra/ — plain JS, no dependencies. Uses the .v3-* control/readout styles.
   <div class="mech-lab" data-lab="table|sincos|hang|incline|rigid|arm" [data-p='{"m1":200}'] [data-mode="…"]></div>
     table   — force table (โต๊ะแรง): up to 4 strings, masses and angles, equilibrant, % error like a lab report
     sincos  — two forces by the parallelogram / triangle rule with the laws of cosines and sines; mode "resolve" splits a force along two lines
     hang    — weight held by two cables (Lami's theorem vs component equations)
     incline — block on an inclined plane with rotated axes, friction and an applied force
     rigid   — coplanar force system on a beam: resultant, moment about O, equivalent force-couple, single resultant, support reactions
     arm     — two-link planar robot arm: forward/inverse kinematics, Jacobian, tip velocity, joint torques τ = Jᵀ F
   window.VecMech.calc exposes the pure calculations for Node checks. */
(function (root) {
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, G = 9.81;
  function num(v, s) {
    if (v === null || v === undefined || !isFinite(v)) return "—";
    if (Math.abs(v) < 1e-10) return "0";
    s = s || 4; var a = Math.abs(v), d = Math.max(0, s - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString().replace("-", "−");
  }
  function deg(v) { return num(v, 4) + "°"; }
  function ang360(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function row(label, value, cls) { return '<div class="v3-r' + (cls ? " " + cls : "") + '"><b>' + label + "</b><span>" + value + "</span></div>"; }

  // =========================================================================== pure calculations
  var calc = {
    // forces given as [{F, a}] (a in degrees from +x, CCW)
    resultant: function (list) {
      var Rx = 0, Ry = 0;
      list.forEach(function (f) { Rx += f.F * Math.cos(f.a * D2R); Ry += f.F * Math.sin(f.a * D2R); });
      return { Rx: Rx, Ry: Ry, R: Math.hypot(Rx, Ry), a: ang360(Math.atan2(Ry, Rx) * R2D) };
    },
    // two forces by the triangle rule: theta = angle between F1 and F2 (0..180)
    cosLaw: function (F1, a1, F2, a2) {
      var th = Math.abs(((a2 - a1) % 360 + 540) % 360 - 180), beta = 180 - th;
      var R = Math.sqrt(Math.max(0, F1 * F1 + F2 * F2 - 2 * F1 * F2 * Math.cos(beta * D2R)));
      var alpha = R > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, F2 * Math.sin(beta * D2R) / R))) * R2D : 0;
      // asin is ambiguous: if F2 is the longer side, the angle at F1 can be obtuse; decide with the cosine law instead
      var cosA = R > 1e-12 && F1 > 1e-12 ? (F1 * F1 + R * R - F2 * F2) / (2 * F1 * R) : 1;
      if (cosA < 0) alpha = 180 - alpha;
      var side = ((a2 - a1) % 360 + 360) % 360 <= 180 ? 1 : -1;
      return { th: th, beta: beta, R: R, alpha: alpha, dir: ang360(a1 + side * alpha), side: side };
    },
    // resolve F (angle aF) along two lines with directions u and v (degrees); returns signed components
    resolve: function (F, aF, u, v) {
      var s = Math.sin((v - u) * D2R);
      if (Math.abs(s) < 1e-9) return null;
      return { Fu: F * Math.sin((v - aF) * D2R) / s, Fv: F * Math.sin((aF - u) * D2R) / s };
    },
    // two cables at angles t1 (left, above horizontal) and t2 (right) holding weight W
    hang: function (W, t1, t2) {
      var s = Math.sin((t1 + t2) * D2R);
      if (s < 1e-9) return null;
      return { T1: W * Math.cos(t2 * D2R) / s, T2: W * Math.cos(t1 * D2R) / s };
    },
    // block on incline: m, theta, mus, muk, P (applied, at angle al above the incline, pointing up-slope)
    incline: function (m, th, mus, muk, P, al) {
      var W = m * G, Wpar = W * Math.sin(th * D2R), Wperp = W * Math.cos(th * D2R);
      var Ppar = P * Math.cos(al * D2R), Pperp = P * Math.sin(al * D2R), N = Wperp - Pperp;
      if (N < 0) return { W: W, Wpar: Wpar, Wperp: Wperp, Ppar: Ppar, Pperp: Pperp, N: N, lift: true };
      var drive = Ppar - Wpar, fsMax = mus * N, moving = Math.abs(drive) > fsMax, f, a;
      if (!moving) { f = -drive; a = 0; } else { f = -Math.sign(drive) * muk * N; a = (drive + f) / m; }
      return { W: W, Wpar: Wpar, Wperp: Wperp, Ppar: Ppar, Pperp: Pperp, N: N, drive: drive, fsMax: fsMax, moving: moving, f: f, a: a };
    },
    // coplanar system: forces [{x, y, F, a}], couples [M] (CCW +); moment about point (ox, oy)
    system: function (forces, M, ox, oy) {
      var Rx = 0, Ry = 0, Mo = M || 0;
      forces.forEach(function (f) { var fx = f.F * Math.cos(f.a * D2R), fy = f.F * Math.sin(f.a * D2R); Rx += fx; Ry += fy; Mo += (f.x - ox) * fy - (f.y - oy) * fx; });
      return { Rx: Rx, Ry: Ry, R: Math.hypot(Rx, Ry), Mo: Mo, xbar: Math.abs(Ry) > 1e-12 ? ox + Mo / Ry : null };
    },
    // simply supported beam: pin A at x = 0, roller B at x = L (vertical reaction)
    beam: function (forces, M, L) {
      var s = calc.system(forces, M, 0, 0);
      var By = -s.Mo / L, Ay = -s.Ry - By, Ax = -s.Rx;
      return { Ax: Ax, Ay: Ay, By: By, s: s };
    },
    arm2: function (L1, L2, t1, t2) {
      var c1 = Math.cos(t1 * D2R), s1 = Math.sin(t1 * D2R), c12 = Math.cos((t1 + t2) * D2R), s12 = Math.sin((t1 + t2) * D2R);
      return { x: L1 * c1 + L2 * c12, y: L1 * s1 + L2 * s12, ex: L1 * c1, ey: L1 * s1, J: [[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]], det: L1 * L2 * Math.sin(t2 * D2R) };
    },
    ik2: function (L1, L2, x, y, up) {
      var c2 = (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2);
      if (c2 < -1 - 1e-12 || c2 > 1 + 1e-12) return null;
      c2 = Math.max(-1, Math.min(1, c2));
      var t2 = Math.acos(c2) * (up ? -1 : 1), t1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
      return { t1: t1 * R2D, t2: t2 * R2D, c2: c2 };
    }
  };

  // =========================================================================== shared UI
  function ctl(c, val) {
    var lab = document.createElement("label");
    lab.className = "v3-c" + (c.type === "chk" ? " v3-chk" : c.type === "sel" ? " v3-sel" : "");
    lab.dataset.k = c.k;
    if (c.type === "chk") lab.innerHTML = '<input type="checkbox"' + (val ? " checked" : "") + "><span>" + esc(c.l) + "</span>";
    else if (c.type === "sel") lab.innerHTML = "<span>" + esc(c.l) + "</span><select>" + c.o.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
    else lab.innerHTML = "<span>" + esc(c.l) + (c.u ? " <i>" + esc(c.u) + "</i>" : "") + '</span><input type="range" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + val + '" aria-label="' + esc(c.l) + '"><input type="number" step="any" value="' + val + '" aria-label="' + esc(c.l) + ' (พิมพ์ค่า)">';
    if (c.g) lab.dataset.g = c.g;
    return lab;
  }
  var C = function (k, l, min, max, step, v, u, g) { return { k: k, l: l, min: min, max: max, step: step, v: v, u: u || "", g: g }; };
  function setInput(el, k, v) { var lab = el.querySelector('.v3-c[data-k="' + k + '"]'); if (!lab) return; lab.querySelectorAll("input").forEach(function (i) { if (i.type !== "checkbox") i.value = +(+v).toFixed(3); }); }

  // svg helpers (y up). T maps world→screen
  function Tf(W, H, x0, x1, y0, y1, pad) {
    pad = pad == null ? 24 : pad;
    var s = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0)), cx = (W - s * (x1 - x0)) / 2 - s * x0, cy = (H + s * (y1 - y0)) / 2 + s * y0;
    return { s: s, X: function (x) { return cx + s * x; }, Y: function (y) { return cy - s * y; } };
  }
  var f1 = function (v) { return (+v).toFixed(1); };
  function arrow(x1, y1, x2, y2, cls, label, opt) {
    opt = opt || {};
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return "";
    var ux = dx / L, uy = dy / L, h = Math.min(opt.h || 12, L * 0.45), hw = h * 0.42, bx = x2 - ux * h, by = y2 - uy * h;
    var s = '<g class="mx-a ' + cls + (opt.dash ? " mx-dash" : "") + '"><line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2 - ux * h * 0.6) + '" y2="' + f1(y2 - uy * h * 0.6) + '"' + (opt.w ? ' style="stroke-width:' + opt.w + 'px"' : "") + '/><polygon points="' + f1(x2) + "," + f1(y2) + " " + f1(bx - uy * hw) + "," + f1(by + ux * hw) + " " + f1(bx + uy * hw) + "," + f1(by - ux * hw) + '"/></g>';
    if (label) {
      var t = opt.lt == null ? 1 : opt.lt, px = x1 + dx * t, py = y1 + dy * t, off = opt.off == null ? 14 : opt.off;
      if (t >= 1) { px += ux * 12; py += uy * 12 + 4; } else { px += -uy * off; py += ux * off + 4; }
      s += '<text class="mx-lb ' + cls + '" x="' + f1(px) + '" y="' + f1(py) + '" text-anchor="middle">' + esc(label) + "</text>";
    }
    return s;
  }
  function txt(x, y, t, cls, anchor) { return '<text class="' + (cls || "mx-lb") + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + esc(t) + "</text>"; }
  function arcPath(cx, cy, r, a0, a1) { // screen arc for world angles (deg, CCW)
    var n = Math.max(4, Math.round(Math.abs(a1 - a0) / 5)), pts = [];
    for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * D2R; pts.push(f1(cx + r * Math.cos(a)) + "," + f1(cy - r * Math.sin(a))); }
    return pts.join(" ");
  }

  // =========================================================================== labs
  var LABS = {};

  // ---------------------------------------------------------------- force table
  LABS.table = {
    t: "โต๊ะแรง (Force Table): หาแรงลัพธ์และแรงสมดุล",
    ctl: [C("m1", "มวลเส้นที่ 1", 0, 500, 5, 200, "g", "1"), C("a1", "มุมเส้นที่ 1", 0, 360, 1, 20, "°", "1"),
      C("m2", "มวลเส้นที่ 2", 0, 500, 5, 150, "g", "2"), C("a2", "มุมเส้นที่ 2", 0, 360, 1, 110, "°", "2"),
      C("m3", "มวลเส้นที่ 3 (ปรับให้สมดุล)", 0, 500, 5, 250, "g", "3"), C("a3", "มุมเส้นที่ 3", 0, 360, 1, 237, "°", "3"),
      C("m4", "มวลเส้นที่ 4", 0, 500, 5, 0, "g", "4"), C("a4", "มุมเส้นที่ 4", 0, 360, 1, 300, "°", "4"),
      { k: "hanger", l: "รวมมวลที่แขวน 50 g ในแต่ละเส้น", type: "chk", v: false }, { k: "poly", l: "แสดงรูปหลายเหลี่ยมแรง", type: "chk", v: true }],
    f: function (p, el) {
      var hm = p.hanger ? 50 : 0, F = [], cols = ["c1", "c3", "c4", "c5"];
      for (var i = 1; i <= 4; i++) { var mm = +p["m" + i]; if (mm > 0) F.push({ i: i, m: mm + hm, F: (mm + hm) / 1000 * G, a: +p["a" + i] }); }
      var all = calc.resultant(F), two = calc.resultant(F.filter(function (f) { return f.i <= 2; }));
      var W = 640, H = 430, cx = 225, cy = 215, R0 = 180, tol = 0.02; // N, friction of the ring/pulleys
      var bal = all.R < tol, off = Math.min(26, all.R * 40), ox = bal ? 0 : off * Math.cos(all.a * D2R), oy = bal ? 0 : -off * Math.sin(all.a * D2R);
      var s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="โต๊ะแรงมองจากด้านบน">';
      s += '<circle class="mx-table" cx="' + cx + '" cy="' + cy + '" r="' + R0 + '"/><circle class="mx-pin" cx="' + cx + '" cy="' + cy + '" r="3"/>';
      for (var d = 0; d < 360; d += 5) { var r1 = d % 30 === 0 ? R0 - 14 : d % 10 === 0 ? R0 - 9 : R0 - 5, a = d * D2R; s += '<line class="mx-tick" x1="' + f1(cx + R0 * Math.cos(a)) + '" y1="' + f1(cy - R0 * Math.sin(a)) + '" x2="' + f1(cx + r1 * Math.cos(a)) + '" y2="' + f1(cy - r1 * Math.sin(a)) + '"/>'; if (d % 30 === 0) s += txt(cx + (R0 - 26) * Math.cos(a), cy - (R0 - 26) * Math.sin(a) + 4, d + "°", "mx-tk", "middle"); }
      F.forEach(function (f, k) {
        var a = f.a * D2R, px = cx + (R0 + 8) * Math.cos(a), py = cy - (R0 + 8) * Math.sin(a);
        s += '<line class="mx-str ' + cols[f.i - 1] + '" x1="' + f1(cx + ox) + '" y1="' + f1(cy + oy) + '" x2="' + f1(px) + '" y2="' + f1(py) + '"/><circle class="mx-pulley" cx="' + f1(px) + '" cy="' + f1(py) + '" r="7"/>';
        s += txt(cx + (R0 + 30) * Math.cos(a), cy - (R0 + 30) * Math.sin(a) + 4, f.m + " g", "mx-lb " + cols[f.i - 1], "middle");
      });
      s += '<circle class="mx-ring' + (bal ? " ok" : "") + '" cx="' + f1(cx + ox) + '" cy="' + f1(cy + oy) + '" r="9"/>';
      // force arrows (scaled) from centre
      var big = Math.max.apply(null, F.map(function (f) { return f.F; }).concat([all.R, 0.5])), k = 120 / big;
      F.forEach(function (f) { s += arrow(cx, cy, cx + k * f.F * Math.cos(f.a * D2R), cy - k * f.F * Math.sin(f.a * D2R), cols[f.i - 1], "F" + f.i, { w: 2.2, lt: 0.62, off: 10 }); });
      if (!bal) s += arrow(cx, cy, cx + k * all.R * Math.cos(all.a * D2R), cy - k * all.R * Math.sin(all.a * D2R), "c6", "R", { w: 3 });
      // polygon inset
      if (p.poly && F.length) {
        var X0 = 430, Y0 = 20, Wb = 200, Hb = 200, pts = [[0, 0]];
        F.forEach(function (f) { var q = pts[pts.length - 1]; pts.push([q[0] + f.F * Math.cos(f.a * D2R), q[1] + f.F * Math.sin(f.a * D2R)]); });
        var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
        var T = Tf(Wb, Hb, Math.min.apply(null, xs), Math.max.apply(null, xs) + 1e-6, Math.min.apply(null, ys), Math.max.apply(null, ys) + 1e-6, 22);
        s += '<g transform="translate(' + X0 + "," + Y0 + ')"><rect class="mx-inset" width="' + Wb + '" height="' + Hb + '" rx="8"/>' + txt(8, 16, "รูปหลายเหลี่ยมแรง", "mx-cap");
        for (var j = 0; j < F.length; j++) s += arrow(T.X(pts[j][0]), T.Y(pts[j][1]), T.X(pts[j + 1][0]), T.Y(pts[j + 1][1]), cols[F[j].i - 1], "", { h: 9, w: 2 });
        var e = pts[pts.length - 1];
        if (!bal) s += arrow(T.X(0), T.Y(0), T.X(e[0]), T.Y(e[1]), "c6", "R", { h: 9, w: 2.4, dash: true });
        else s += txt(Wb / 2, Hb - 10, "ปิดรูปพอดี: R ≈ 0", "mx-cap ok", "middle");
        s += "</g>";
      }
      s += txt(430, 252, bal ? "✓ สมดุล: วงแหวนอยู่กลางหมุด" : "✗ ยังไม่สมดุล: วงแหวนถูกดึงไปทาง R", "mx-cap" + (bal ? " ok" : " bad"));
      s += txt(430, 272, "|R| = " + num(all.R) + " N", "mx-cap");
      s += txt(430, 292, "แรงสมดุล E = " + num(all.R) + " N ที่ " + deg(ang360(all.a + 180)), "mx-cap");
      s += "</svg>";
      var out = '<div class="table-wrap"><table class="mx-tab"><thead><tr><th>เส้น</th><th>m (g)</th><th>F = mg (N)</th><th>θ</th><th>Fx = F cos θ</th><th>Fy = F sin θ</th></tr></thead><tbody>' +
        F.map(function (f) { return "<tr><td>" + f.i + "</td><td>" + f.m + "</td><td>" + num(f.F) + "</td><td>" + deg(f.a) + "</td><td>" + num(f.F * Math.cos(f.a * D2R)) + "</td><td>" + num(f.F * Math.sin(f.a * D2R)) + "</td></tr>"; }).join("") +
        "<tr class=\"mx-sum\"><td colspan=\"4\">ผลรวม</td><td>" + num(all.Rx) + "</td><td>" + num(all.Ry) + "</td></tr></tbody></table></div>";
      out += row("R = √(ΣFx² + ΣFy²)", "<b>" + num(all.R) + " N</b> ที่ θ = atan2(ΣFy, ΣFx) = " + deg(all.a), "v3-key");
      out += row("แรงสมดุล (equilibrant)", "E = −R: " + num(all.R) + " N ที่ " + deg(ang360(all.a + 180)) + " = มวล " + num(all.R / G * 1000) + " g");
      var f3 = F.filter(function (f) { return f.i === 3; })[0];
      if (f3 && F.filter(function (f) { return f.i <= 2; }).length === 2) {
        var c = calc.cosLaw(F[0].F, F[0].a, F[1].F, F[1].a), want = ang360(two.a + 180), dA = Math.abs(((f3.a - want) % 360 + 540) % 360 - 180), dF = Math.abs(f3.F - two.R) / two.R * 100;
        out += row("ทฤษฎี (กฎโคไซน์) R₁₂", "R² = F₁² + F₂² − 2F₁F₂cos(180° − " + deg(c.th) + ") → R₁₂ = " + num(c.R) + " N, E₁₂ = " + num(c.R) + " N ที่ " + deg(want));
        out += row("เทียบเส้นที่ 3 กับทฤษฎี", "%error ขนาด = |" + num(f3.F) + " − " + num(two.R) + "|/" + num(two.R) + " × 100 = <b>" + num(dF, 3) + "%</b> · มุมต่าง " + deg(dA), dF < 2 && dA < 2 ? "v3-ok" : "");
      }
      return { svg: s, out: out };
    }
  };

  // ---------------------------------------------------------------- laws of sines and cosines
  LABS.sincos = {
    t: "แรงลัพธ์ด้วยกฎของโคไซน์และกฎของไซน์",
    ctl: [{ k: "mode", l: "โจทย์", type: "sel", v: "res", o: [["res", "รวมสองแรงเป็นแรงลัพธ์"], ["resolve", "แตกแรงหนึ่งตามสองแนวที่ไม่ตั้งฉาก"]] },
      C("F1", "F₁", 0, 1000, 5, 600, "N", "res"), C("a1", "ทิศ F₁ (จาก +x ทวนเข็ม)", -180, 360, 1, 0, "°", "res"),
      C("F2", "F₂", 0, 1000, 5, 400, "N", "res"), C("a2", "ทิศ F₂", -180, 360, 1, 50, "°", "res"),
      C("F", "แรงที่จะแตก F", 0, 1000, 5, 500, "N", "resolve"), C("aF", "ทิศ F", -180, 360, 1, 60, "°", "resolve"),
      C("u", "แนว u", -180, 360, 1, 0, "°", "resolve"), C("v", "แนว v", -180, 360, 1, 105, "°", "resolve")],
    show: function (p) { return p.mode; },
    f: function (p) {
      var W = 640, H = 380, s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="สี่เหลี่ยมด้านขนานและสามเหลี่ยมแรง">', out = "";
      if (p.mode === "res") {
        var F1 = +p.F1, F2 = +p.F2, a1 = +p.a1, a2 = +p.a2;
        var v1 = [F1 * Math.cos(a1 * D2R), F1 * Math.sin(a1 * D2R)], v2 = [F2 * Math.cos(a2 * D2R), F2 * Math.sin(a2 * D2R)], R = [v1[0] + v2[0], v1[1] + v2[1]];
        var xs = [0, v1[0], v2[0], R[0]], ys = [0, v1[1], v2[1], R[1]];
        var T = Tf(W, H, Math.min.apply(null, xs), Math.max.apply(null, xs) + 1e-6, Math.min.apply(null, ys), Math.max.apply(null, ys) + 1e-6, 44);
        var O = [T.X(0), T.Y(0)], P1 = [T.X(v1[0]), T.Y(v1[1])], P2 = [T.X(v2[0]), T.Y(v2[1])], PR = [T.X(R[0]), T.Y(R[1])];
        s += '<polygon class="mx-tri" points="' + [O, P1, PR].map(function (q) { return f1(q[0]) + "," + f1(q[1]); }).join(" ") + '"/>';
        s += '<line class="mx-guide" x1="' + f1(P2[0]) + '" y1="' + f1(P2[1]) + '" x2="' + f1(PR[0]) + '" y2="' + f1(PR[1]) + '"/>';
        s += arrow(O[0], O[1], P1[0], P1[1], "c1", "F₁", { w: 3, lt: 0.5 }) + arrow(O[0], O[1], P2[0], P2[1], "c3", "F₂", { w: 2.4, lt: 0.5, dash: true }) +
          arrow(P1[0], P1[1], PR[0], PR[1], "c3", "F₂", { w: 3, lt: 0.5 }) + arrow(O[0], O[1], PR[0], PR[1], "c2", "R", { w: 3.4, lt: 0.55 });
        var c = calc.cosLaw(F1, a1, F2, a2), r = 34;
        // interior angle at P1 (beta) between −F1 and F2, angle alpha at O between F1 and R
        if (F1 > 0 && c.R > 0) s += '<polyline class="mx-arc c4" points="' + arcPath(O[0], O[1], r, a1, a1 + c.side * c.alpha) + '"/>' + txt(O[0] + (r + 14) * Math.cos((a1 + c.side * c.alpha / 2) * D2R), O[1] - (r + 14) * Math.sin((a1 + c.side * c.alpha / 2) * D2R) + 4, "α", "mx-lb c4", "middle");
        if (F1 > 0 && F2 > 0) s += '<polyline class="mx-arc c5" points="' + arcPath(P1[0], P1[1], r * 0.8, a1 + 180, a1 + 180 + c.side * -c.beta) + '"/>' + txt(P1[0] + (r + 8) * Math.cos((a1 + 180 - c.side * c.beta / 2) * D2R), P1[1] - (r + 8) * Math.sin((a1 + 180 - c.side * c.beta / 2) * D2R) + 4, "β", "mx-lb c5", "middle");
        s += "</svg>";
        var comp = calc.resultant([{ F: F1, a: a1 }, { F: F2, a: a2 }]);
        out = row("① มุมระหว่าง F₁ กับ F₂", "θ = " + deg(c.th) + " → มุมภายในสามเหลี่ยมตรงข้าม R: β = 180° − θ = <b>" + deg(c.beta) + "</b>") +
          row("② กฎของโคไซน์", "R² = F₁² + F₂² − 2F₁F₂ cos β = " + num(F1) + "² + " + num(F2) + "² − 2(" + num(F1) + ")(" + num(F2) + ")cos " + deg(c.beta) + " = " + num(c.R * c.R, 6) + " → <b>R = " + num(c.R) + " N</b>", "v3-key") +
          row("②′ รูปสี่เหลี่ยมด้านขนาน (สูตรเทียบเท่า)", "R² = F₁² + F₂² + 2F₁F₂ cos θ เพราะ cos(180° − θ) = −cos θ") +
          row("③ กฎของไซน์", "sin α / F₂ = sin β / R → sin α = " + num(F2) + " × sin " + deg(c.beta) + " / " + num(c.R) + " = " + num(Math.sin(c.alpha * D2R), 4) + " → <b>α = " + deg(c.alpha) + "</b>" + (c.alpha > 90 ? " (มุมป้าน ตรวจด้วย cos law)" : "")) +
          row("④ ทิศของ R", "θ_R = ทิศ F₁ " + (c.side > 0 ? "+" : "−") + " α = " + deg(a1) + (c.side > 0 ? " + " : " − ") + deg(c.alpha) + " = <b>" + deg(c.dir) + "</b>", "v3-key") +
          row("⑤ ตรวจด้วยองค์ประกอบ", "Rx = " + num(comp.Rx) + ", Ry = " + num(comp.Ry) + " → R = " + num(comp.R) + " N ที่ " + deg(comp.a), "v3-ok");
      } else {
        var F = +p.F, aF = +p.aF, u = +p.u, v = +p.v, rs = calc.resolve(F, aF, u, v);
        if (!rs) return { svg: s + txt(W / 2, H / 2, "แนว u และ v ขนานกัน แตกแรงไม่ได้", "mx-cap bad", "middle") + "</svg>", out: row("⚠", "สองแนวต้องไม่ขนานกัน", "v3-bad") };
        var vu = [rs.Fu * Math.cos(u * D2R), rs.Fu * Math.sin(u * D2R)], vv = [rs.Fv * Math.cos(v * D2R), rs.Fv * Math.sin(v * D2R)], vF = [F * Math.cos(aF * D2R), F * Math.sin(aF * D2R)];
        var xs2 = [0, vu[0], vv[0], vF[0]], ys2 = [0, vu[1], vv[1], vF[1]];
        var T2 = Tf(W, H, Math.min.apply(null, xs2), Math.max.apply(null, xs2) + 1e-6, Math.min.apply(null, ys2), Math.max.apply(null, ys2) + 1e-6, 44);
        var O2 = [T2.X(0), T2.Y(0)], ext = Math.max(F, Math.abs(rs.Fu), Math.abs(rs.Fv)) * 1.25;
        [[u, "u"], [v, "v"]].forEach(function (l) { s += '<line class="mx-guide" x1="' + f1(T2.X(-ext * Math.cos(l[0] * D2R))) + '" y1="' + f1(T2.Y(-ext * Math.sin(l[0] * D2R))) + '" x2="' + f1(T2.X(ext * Math.cos(l[0] * D2R))) + '" y2="' + f1(T2.Y(ext * Math.sin(l[0] * D2R))) + '"/>' + txt(Math.max(30, Math.min(W - 30, T2.X(ext * 0.85 * Math.cos(l[0] * D2R)))), Math.max(14, Math.min(H - 6, T2.Y(ext * 0.85 * Math.sin(l[0] * D2R)) - 6)), "แนว " + l[1], "mx-cap", "middle"); });
        s += '<line class="mx-guide" x1="' + f1(T2.X(vu[0])) + '" y1="' + f1(T2.Y(vu[1])) + '" x2="' + f1(T2.X(vF[0])) + '" y2="' + f1(T2.Y(vF[1])) + '"/><line class="mx-guide" x1="' + f1(T2.X(vv[0])) + '" y1="' + f1(T2.Y(vv[1])) + '" x2="' + f1(T2.X(vF[0])) + '" y2="' + f1(T2.Y(vF[1])) + '"/>';
        s += arrow(O2[0], O2[1], T2.X(vu[0]), T2.Y(vu[1]), "c1", "F_u", { w: 3 }) + arrow(O2[0], O2[1], T2.X(vv[0]), T2.Y(vv[1]), "c3", "F_v", { w: 3 }) + arrow(O2[0], O2[1], T2.X(vF[0]), T2.Y(vF[1]), "c2", "F", { w: 3.4 }) + "</svg>";
        var g = ((v - u) % 360 + 360) % 360;
        out = row("① มุมในสามเหลี่ยม", "มุมระหว่าง F กับแนว v: " + deg(Math.abs(((v - aF) % 360 + 540) % 360 - 180)) + ", F กับแนว u: " + deg(Math.abs(((aF - u) % 360 + 540) % 360 - 180)) + ", u กับ v: " + deg(Math.min(g, 360 - g))) +
          row("② กฎของไซน์", "F_u / sin(∠F,v) = F_v / sin(∠F,u) = F / sin(∠u,v)") +
          row("F_u = F sin(θ_v − θ_F)/sin(θ_v − θ_u)", num(F) + " × sin(" + deg(v - aF) + ") / sin(" + deg(v - u) + ") = <b>" + num(rs.Fu) + " N</b>", "v3-key") +
          row("F_v = F sin(θ_F − θ_u)/sin(θ_v − θ_u)", num(F) + " × sin(" + deg(aF - u) + ") / sin(" + deg(v - u) + ") = <b>" + num(rs.Fv) + " N</b>", "v3-key") +
          row("ตรวจ", "F_u û + F_v v̂ = (" + num(vu[0] + vv[0]) + ", " + num(vu[1] + vv[1]) + ") = F (" + num(vF[0]) + ", " + num(vF[1]) + ") ✓" + (rs.Fu < 0 || rs.Fv < 0 ? " · ค่าลบหมายถึงชี้สวนทิศของแนวที่กำหนด" : ""), "v3-ok") +
          row("ข้อสังเกต", "องค์ประกอบตามแนวเฉียงไม่เท่ากับการฉาย: F·û = " + num(F * Math.cos((aF - u) * D2R)) + " N ≠ F_u เมื่อ u ไม่ตั้งฉากกับ v");
      }
      return { svg: s, out: out };
    }
  };

  // ---------------------------------------------------------------- two cables (Lami)
  LABS.hang = {
    t: "น้ำหนักแขวนด้วยเชือกสองเส้น: สมดุลของแรงสามแรง",
    ctl: [C("m", "มวลที่แขวน", 1, 200, 1, 50, "kg"), C("t1", "มุมเชือกซ้ายกับแนวราบ θ₁", 1, 89, 1, 30, "°"), C("t2", "มุมเชือกขวากับแนวราบ θ₂", 1, 89, 1, 45, "°")],
    f: function (p) {
      var Wt = p.m * G, r = calc.hang(Wt, +p.t1, +p.t2), W = 640, H = 360, kx = 320, ky = 170;
      var t1 = p.t1 * D2R, t2 = p.t2 * D2R, L = 150;
      var A = [kx - L * Math.cos(t1), ky - L * Math.sin(t1)], B = [kx + L * Math.cos(t2), ky - L * Math.sin(t2)], top = Math.min(A[1], B[1]) - 6;
      var s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="น้ำหนักแขวนด้วยเชือกสองเส้น">';
      s += '<rect class="mx-ceil" x="60" y="' + f1(top - 14) + '" width="520" height="14"/>';
      s += '<line class="mx-rope" x1="' + f1(kx) + '" y1="' + ky + '" x2="' + f1(A[0]) + '" y2="' + f1(A[1]) + '"/><line class="mx-rope" x1="' + f1(kx) + '" y1="' + ky + '" x2="' + f1(B[0]) + '" y2="' + f1(B[1]) + '"/>';
      s += '<line class="mx-rope" x1="' + kx + '" y1="' + ky + '" x2="' + kx + '" y2="' + (ky + 128) + '"/><rect class="mx-mass" x="' + (kx - 30) + '" y="' + (ky + 128) + '" width="60" height="44" rx="4"/>' + txt(kx, ky + 156, p.m + " kg", "mx-lb", "middle");
      s += '<line class="mx-guide" x1="' + (kx - 95) + '" y1="' + ky + '" x2="' + (kx + 95) + '" y2="' + ky + '"/>';
      s += '<polyline class="mx-arc c4" points="' + arcPath(kx, ky, 40, 180 - p.t1, 180) + '"/>' + txt(kx - 58, ky - 8, "θ₁", "mx-lb c4", "middle");
      s += '<polyline class="mx-arc c4" points="' + arcPath(kx, ky, 40, 0, +p.t2) + '"/>' + txt(kx + 58, ky - 8, "θ₂", "mx-lb c4", "middle");
      if (r) {
        var big = Math.max(r.T1, r.T2, Wt), k = 110 / big;
        s += arrow(kx, ky, kx - k * r.T1 * Math.cos(t1), ky - k * r.T1 * Math.sin(t1), "c1", "T₁", { w: 3, lt: 0.7 }) + arrow(kx, ky, kx + k * r.T2 * Math.cos(t2), ky - k * r.T2 * Math.sin(t2), "c3", "T₂", { w: 3, lt: 0.7 }) + arrow(kx, ky, kx, ky + k * Wt, "c2", "W", { w: 3, lt: 0.85 });
        // force triangle inset (closed)
        var X0 = 480, Y0 = 210, kk = 90 / big, P = [[0, 0]], seq = [[0, Wt * kk], [-r.T1 * Math.cos(t1) * kk, -r.T1 * Math.sin(t1) * kk], [r.T2 * Math.cos(t2) * kk, -r.T2 * Math.sin(t2) * kk]];
        seq.forEach(function (d) { var q = P[P.length - 1]; P.push([q[0] + d[0], q[1] + d[1]]); });
        var minx = Math.min.apply(null, P.map(function (q) { return q[0]; }));
        s += '<g transform="translate(' + f1(X0 - minx + 10) + "," + Y0 + ')">' + arrow(P[0][0], P[0][1], P[1][0], P[1][1], "c2", "", { h: 8, w: 2 }) + arrow(P[1][0], P[1][1], P[2][0], P[2][1], "c1", "", { h: 8, w: 2 }) + arrow(P[2][0], P[2][1], P[3][0], P[3][1], "c3", "", { h: 8, w: 2 }) + "</g>" + txt(X0 + 50, Y0 + 130, "สามเหลี่ยมแรงปิด", "mx-cap", "middle");
      }
      s += "</svg>";
      var out = r ? row("W = mg", num(p.m) + " × 9.81 = " + num(Wt) + " N") +
        row("ΣFx = 0", "−T₁cos θ₁ + T₂cos θ₂ = 0") + row("ΣFy = 0", "T₁sin θ₁ + T₂sin θ₂ − W = 0") +
        row("แก้สมการ", "T₁ = W cos θ₂ / sin(θ₁+θ₂) = <b>" + num(r.T1) + " N</b> · T₂ = W cos θ₁ / sin(θ₁+θ₂) = <b>" + num(r.T2) + " N</b>", "v3-key") +
        row("ตรวจด้วยทฤษฎีของลามี", "T₁/sin(90°+θ₂) = T₂/sin(90°+θ₁) = W/sin(180°−θ₁−θ₂) = " + num(Wt / Math.sin((p.t1 + +p.t2) * D2R)) + " N", "v3-ok") +
        row("ข้อสังเกต", (r.T1 > Wt || r.T2 > Wt ? "แรงตึงบางเส้นมากกว่าน้ำหนัก เพราะเชือกเกือบอยู่ในแนวราบ ต้องดึงแรงมากจึงได้องค์ประกอบแนวดิ่งพอ" : "เมื่อเชือกชันขึ้น แรงตึงลดลงจนเข้าใกล้ W/2 ต่อเส้นเมื่อเชือกทั้งสองดิ่งตรง"))
        : row("⚠", "มุมไม่เหมาะสม", "v3-bad");
      return { svg: s, out: out };
    }
  };

  // ---------------------------------------------------------------- inclined plane
  LABS.incline = {
    t: "พื้นเอียง: หมุนแกนให้ขนานพื้นแล้วแตกแรง",
    ctl: [C("m", "มวล m", 0.5, 50, 0.5, 10, "kg"), C("th", "มุมพื้นเอียง θ", 0, 60, 1, 30, "°"), C("mus", "μs", 0, 1.2, 0.01, 0.4), C("muk", "μk", 0, 1.2, 0.01, 0.3),
      C("P", "แรงดึง P", 0, 200, 1, 0, "N"), C("al", "มุมของ P กับพื้นเอียง", -45, 90, 1, 20, "°")],
    f: function (p) {
      var r = calc.incline(+p.m, +p.th, +p.mus, +p.muk, +p.P, +p.al), W = 640, H = 380, th = p.th * D2R;
      var x0 = 70, y0 = 330, L = 480, x1 = x0 + L * Math.cos(th), y1 = y0 - L * Math.sin(th);
      var s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="กล่องบนพื้นเอียงพร้อมแผนภาพแรง">';
      s += '<polygon class="mx-ramp" points="' + x0 + "," + y0 + " " + f1(x1) + "," + y0 + " " + f1(x1) + "," + f1(y1) + '"/>';
      var bx = x0 + 0.55 * L * Math.cos(th), by = y0 - 0.55 * L * Math.sin(th), ux = Math.cos(th), uy = -Math.sin(th), nx = -Math.sin(th), ny = -Math.cos(th), hb = 26;
      var c = [bx + nx * hb, by + ny * hb];
      s += '<polygon class="mx-block" points="' + [[-hb, 0], [hb, 0], [hb, 2 * hb], [-hb, 2 * hb]].map(function (q) { return f1(bx + ux * q[0] + nx * q[1]) + "," + f1(by + uy * q[0] + ny * q[1]); }).join(" ") + '"/>';
      s += '<polyline class="mx-arc c4" points="' + arcPath(x0, y0, 60, 0, +p.th) + '"/>' + txt(x0 + 74, y0 - 8, "θ", "mx-lb c4");
      // rotated axes at block centre
      s += arrow(c[0], c[1], c[0] + ux * 90, c[1] + uy * 90, "ax0", "x′", { h: 9, w: 1.4 }) + arrow(c[0], c[1], c[0] + nx * 90, c[1] + ny * 90, "ax1", "y′", { h: 9, w: 1.4 });
      var big = Math.max(r.W, Math.abs(r.N || 0), +p.P, 1), k = 110 / big;
      s += arrow(c[0], c[1], c[0], c[1] + k * r.W, "c2", "W = mg", { w: 3 });
      s += arrow(c[0], c[1], c[0] - ux * k * r.Wpar, c[1] - uy * k * r.Wpar, "c2", "W sin θ", { w: 1.8, dash: true, lt: 0.6, off: -14 }) + arrow(c[0], c[1], c[0] - nx * k * r.Wperp, c[1] - ny * k * r.Wperp, "c2", "W cos θ", { w: 1.8, dash: true, lt: 0.6 });
      if (!r.lift) {
        s += arrow(c[0], c[1], c[0] + nx * k * r.N, c[1] + ny * k * r.N, "c1", "N", { w: 3 });
        if (Math.abs(r.f) > 1e-9) s += arrow(bx, by, bx + ux * k * r.f, by + uy * k * r.f, "c3", "f", { w: 3 });
      }
      if (p.P > 0) { var pa = (p.th * 1 + +p.al) * D2R; s += arrow(c[0], c[1], c[0] + k * p.P * Math.cos(pa), c[1] - k * p.P * Math.sin(pa), "c4", "P", { w: 3 }); }
      s += "</svg>";
      var out;
      if (r.lift) out = row("⚠", "องค์ประกอบของ P ในแนวตั้งฉากมากกว่า mg cos θ กล่องลอยจากพื้น (N < 0) ลดแรงหรือมุมของ P", "v3-bad");
      else out = row("W = mg", num(r.W) + " N · แตกตามแกนหมุน: W sin θ = " + num(r.Wpar) + " N (ลงเนิน), W cos θ = " + num(r.Wperp) + " N (กดพื้น)") +
        (p.P > 0 ? row("P ในแกน x′ y′", "P cos α = " + num(r.Ppar) + " N (ขึ้นเนิน), P sin α = " + num(r.Pperp) + " N (ยกออกจากพื้น)") : "") +
        row("ΣF_y′ = 0", "N = W cos θ − P sin α = <b>" + num(r.N) + " N</b>", "v3-key") +
        row("แรงขับตามพื้น (ขึ้นเนินเป็นบวก)", "P cos α − W sin θ = " + num(r.drive) + " N เทียบ f_s,max = μs N = " + num(r.fsMax) + " N") +
        (r.moving ? row("กล่องเลื่อน", "f_k = μk N = " + num(Math.abs(r.f)) + " N สวนการเคลื่อนที่ → a = ΣF_x′/m = <b>" + num(r.a) + " m/s²</b> (" + (r.a > 0 ? "ขึ้นเนิน" : "ลงเนิน") + ")", "v3-key")
          : row("กล่องอยู่นิ่ง", "แรงเสียดทานสถิตที่ต้องใช้ " + num(Math.abs(r.f)) + " N ≤ " + num(r.fsMax) + " N → a = 0", "v3-ok")) +
        row("มุมพอดีลื่น (P = 0)", "tan θ = μs → θ = " + deg(Math.atan(+p.mus) * R2D));
      return { svg: s, out: out };
    }
  };

  // ---------------------------------------------------------------- rigid body force system on a beam
  LABS.rigid = {
    t: "ระบบแรงบนคาน: แรงลัพธ์ โมเมนต์ แรงคู่ควบ และแรงปฏิกิริยา",
    ctl: [{ k: "mode", l: "สิ่งที่ต้องการ", type: "sel", v: "equiv", o: [["equiv", "ระบบแรง-แรงคู่ควบสมมูลที่จุด O และแรงลัพธ์เดี่ยว"], ["beam", "แรงปฏิกิริยาของคานช่วงเดียว (หมุด A, ล้อเลื่อน B)"]] },
      C("L", "ความยาวคาน L", 2, 10, 0.5, 6, "m"),
      C("F1", "F₁", 0, 2000, 10, 800, "N"), C("x1", "ตำแหน่ง F₁", 0, 10, 0.1, 1.5, "m"), C("a1", "ทิศ F₁", 0, 360, 5, 270, "°"),
      C("F2", "F₂", 0, 2000, 10, 600, "N"), C("x2", "ตำแหน่ง F₂", 0, 10, 0.1, 3.5, "m"), C("a2", "ทิศ F₂", 0, 360, 5, 240, "°"),
      C("F3", "F₃", 0, 2000, 10, 400, "N"), C("x3", "ตำแหน่ง F₃", 0, 10, 0.1, 5, "m"), C("a3", "ทิศ F₃", 0, 360, 5, 90, "°"),
      C("M", "แรงคู่ควบ M (ทวนเข็ม +)", -3000, 3000, 50, 0, "N·m"), C("ox", "จุดอ้างอิง O", 0, 10, 0.1, 0, "m", "equiv")],
    show: function (p) { return p.mode; },
    f: function (p) {
      var L = +p.L, list = [1, 2, 3].map(function (i) { return { i: i, x: Math.min(+p["x" + i], L), y: 0, F: +p["F" + i], a: +p["a" + i] }; }).filter(function (f) { return f.F > 0; });
      var W = 680, H = 330, T = Tf(W, H, -0.8, L + 0.8, -1.6, 1.6, 20), yb = T.Y(0), cols = ["c1", "c3", "c4"];
      var s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="แรงกระทำบนคาน">';
      s += '<rect class="mx-beam" x="' + f1(T.X(0)) + '" y="' + f1(yb - 7) + '" width="' + f1(T.X(L) - T.X(0)) + '" height="14" rx="3"/>';
      for (var g = 0; g <= L + 1e-9; g += 1) s += txt(T.X(g), yb + 32, g + " m", "mx-tk", "middle") + '<line class="mx-tick" x1="' + f1(T.X(g)) + '" x2="' + f1(T.X(g)) + '" y1="' + f1(yb + 9) + '" y2="' + f1(yb + 16) + '"/>';
      var big = Math.max.apply(null, list.map(function (f) { return f.F; }).concat([1])), k = 95 / big;
      list.forEach(function (f) { var dx = k * f.F * Math.cos(f.a * D2R), dy = k * f.F * Math.sin(f.a * D2R), X = T.X(f.x); s += arrow(X - dx, yb + dy, X, yb, cols[f.i - 1], "F" + "₁₂₃"[f.i - 1], { w: 3, lt: 0.1, off: 16 }); });
      if (+p.M) { var cx = T.X(L / 2), ccw = p.M > 0; s += '<polyline class="mx-arc c5" points="' + arcPath(cx, yb, 34, ccw ? -40 : 220, ccw ? 220 : -40) + '"/>' + arrow(cx + 34 * Math.cos((ccw ? 210 : -30) * D2R), yb - 34 * Math.sin((ccw ? 210 : -30) * D2R), cx + 34 * Math.cos((ccw ? 222 : -42) * D2R), yb - 34 * Math.sin((ccw ? 222 : -42) * D2R), "c5", "", { h: 10 }) + txt(cx, yb - 44, "M", "mx-lb c5", "middle"); }
      var out = "";
      if (p.mode === "equiv") {
        var ox = Math.min(+p.ox, L), r = calc.system(list, +p.M, ox, 0);
        s += '<circle class="mx-o" cx="' + f1(T.X(ox)) + '" cy="' + f1(yb) + '" r="6"/>' + txt(T.X(ox), yb - 14, "O", "mx-lb", "middle");
        var kr = 95 / Math.max(r.R, big);
        if (r.R > 1e-9 && r.xbar !== null) { var XR = T.X(r.xbar); s += arrow(XR - kr * r.Rx, yb + kr * r.Ry, XR, yb, "c2", "R", { w: 3.4, dash: true, lt: 0.1, off: 16 }); s += '<line class="mx-guide" x1="' + f1(XR) + '" x2="' + f1(XR) + '" y1="' + f1(yb - 110) + '" y2="' + f1(yb + 110) + '"/>' + txt(XR, T.Y(-1.5), "x̄ = " + num(r.xbar) + " m", "mx-cap", "middle"); }
        s += "</svg>";
        out = '<div class="table-wrap"><table class="mx-tab"><thead><tr><th>แรง</th><th>Fx</th><th>Fy</th><th>แขน (x − x_O)</th><th>M_O = (x − x_O)Fy</th></tr></thead><tbody>' +
          list.map(function (f) { var fx = f.F * Math.cos(f.a * D2R), fy = f.F * Math.sin(f.a * D2R); return "<tr><td>F" + "₁₂₃"[f.i - 1] + "</td><td>" + num(fx) + "</td><td>" + num(fy) + "</td><td>" + num(f.x - ox) + "</td><td>" + num((f.x - ox) * fy) + "</td></tr>"; }).join("") +
          (+p.M ? "<tr><td>M</td><td>0</td><td>0</td><td>—</td><td>" + num(+p.M) + "</td></tr>" : "") + "<tr class=\"mx-sum\"><td>Σ</td><td>" + num(r.Rx) + "</td><td>" + num(r.Ry) + "</td><td></td><td>" + num(r.Mo) + "</td></tr></tbody></table></div>" +
          row("แรงลัพธ์", "R = (" + num(r.Rx) + ", " + num(r.Ry) + ") N · |R| = " + num(r.R) + " N ที่ " + deg(ang360(Math.atan2(r.Ry, r.Rx) * R2D)), "v3-key") +
          row("ระบบสมมูลที่ O", "แรง R ที่ O + แรงคู่ควบ M_O = <b>" + num(r.Mo) + " N·m</b> (" + (r.Mo >= 0 ? "ทวนเข็ม" : "ตามเข็ม") + ")", "v3-key") +
          (r.xbar !== null ? row("แรงลัพธ์เดี่ยว", "ย้าย R ไปที่ x̄ = x_O + M_O/R_y = " + num(ox) + " + " + num(r.Mo) + "/" + num(r.Ry) + " = <b>" + num(r.xbar) + " m</b> แล้วไม่ต้องมีแรงคู่ควบ" + (r.xbar < 0 || r.xbar > L ? " (อยู่นอกคานได้ แนวแรงไม่จำเป็นต้องผ่านเนื้อวัสดุ)" : ""), "v3-ok")
            : row("แรงลัพธ์เดี่ยว", r.R < 1e-9 ? "R = 0: ระบบลดรูปเป็นแรงคู่ควบล้วน M = " + num(r.Mo) + " N·m ย้ายไปที่ใดก็ได้" : "R ขนานกับคาน หาตำแหน่งตัดแกนคานไม่ได้ ใช้ระยะตั้งฉาก d = M_O/|R| แทน"));
      } else {
        var b = calc.beam(list, +p.M, L);
        s += '<polygon class="mx-sup" points="' + f1(T.X(0)) + "," + f1(yb + 7) + " " + f1(T.X(0) - 14) + "," + f1(yb + 30) + " " + f1(T.X(0) + 14) + "," + f1(yb + 30) + '"/>' + '<circle class="mx-sup" cx="' + f1(T.X(L)) + '" cy="' + f1(yb + 19) + '" r="11"/>' + txt(T.X(0), yb + 52, "A (หมุด)", "mx-cap", "middle") + txt(T.X(L), yb + 52, "B (ล้อเลื่อน)", "mx-cap", "middle");
        var kb = 95 / Math.max(Math.abs(b.Ay), Math.abs(b.By), Math.abs(b.Ax), big);
        s += arrow(T.X(0), yb + kb * b.Ay, T.X(0), yb + 1, "c2", "A_y", { w: 3, lt: 0, off: -22 }) + arrow(T.X(L), yb + kb * b.By, T.X(L), yb + 1, "c2", "B_y", { w: 3, lt: 0, off: 22 });
        if (Math.abs(b.Ax) > 1e-9) s += arrow(T.X(0) - kb * b.Ax, yb, T.X(0), yb, "c2", "A_x", { w: 3, lt: 0 });
        s += "</svg>";
        out = row("ΣM_A = 0 (ทวนเข็มบวก)", "B_y·L + Σ(x_i F_iy) + M = 0 → B_y = −(" + num(b.s.Mo) + ")/" + num(L) + " = <b>" + num(b.By) + " N</b>", "v3-key") +
          row("ΣF_y = 0", "A_y + B_y + ΣF_y = 0 → A_y = <b>" + num(b.Ay) + " N</b>", "v3-key") + row("ΣF_x = 0", "A_x + ΣF_x = 0 → A_x = <b>" + num(b.Ax) + " N</b>") +
          row("ตรวจ ΣM_B = 0", "−A_y·L + Σ((x_i − L)F_iy) + M = " + num(-b.Ay * L + calc.system(list, +p.M, L, 0).Mo), "v3-ok") +
          (b.Ay < 0 || b.By < 0 ? row("ข้อสังเกต", "แรงปฏิกิริยาติดลบแปลว่าทิศจริงชี้ลง ฐานรองรับต้องยึดคานไว้ไม่ให้ยกตัว") : "");
      }
      return { svg: s, out: out };
    }
  };

  // ---------------------------------------------------------------- two-link robot arm
  LABS.arm = {
    t: "แขนกล 2 ข้อต่อ: เวกเตอร์ตำแหน่ง Jacobian ความเร็ว และแรงบิดข้อต่อ",
    ctl: [{ k: "mode", l: "โหมด", type: "sel", v: "fk", o: [["fk", "Forward kinematics: กำหนดมุมข้อต่อ"], ["ik", "Inverse kinematics: กำหนดตำแหน่งปลายแขน"]] },
      C("L1", "L₁", 0.1, 1, 0.05, 0.5, "m"), C("L2", "L₂", 0.1, 1, 0.05, 0.4, "m"),
      C("t1", "θ₁", -180, 180, 1, 30, "°", "fk"), C("t2", "θ₂", -180, 180, 1, 60, "°", "fk"),
      C("x", "x เป้าหมาย", -1.5, 1.5, 0.01, 0.5, "m", "ik"), C("y", "y เป้าหมาย", -1.5, 1.5, 0.01, 0.5, "m", "ik"), { k: "up", l: "ข้อศอกขึ้น (elbow-up)", type: "chk", v: true, g: "ik" },
      C("w1", "θ̇₁", -2, 2, 0.05, 0.5, "rad/s"), C("w2", "θ̇₂", -2, 2, 0.05, 0), C("Fx", "แรงที่ปลายแขนต้องออก Fx", -100, 100, 1, 0, "N"), C("Fy", "Fy (เช่น ยกของ 2 kg = +19.6)", -100, 100, 0.1, 19.6, "N"),
      { k: "trace", l: "ลากเส้นทางปลายแขน", type: "chk", v: true }],
    show: function (p) { return p.mode; },
    f: function (p, el) {
      var L1 = +p.L1, L2 = +p.L2, t1 = +p.t1, t2 = +p.t2, ikMsg = "";
      if (p.mode === "ik") {
        var s0 = calc.ik2(L1, L2, +p.x, +p.y, !!p.up);
        if (s0) { t1 = s0.t1; t2 = s0.t2; } else ikMsg = "เป้าหมายอยู่นอกพื้นที่ทำงาน: ระยะจากฐานต้องอยู่ระหว่าง " + num(Math.abs(L1 - L2)) + " ถึง " + num(L1 + L2) + " m";
        if (!s0) { var d = Math.hypot(+p.x, +p.y), a = Math.atan2(+p.y, +p.x) * R2D; t1 = a; t2 = d > L1 + L2 ? 0 : 180; }
      }
      var k = calc.arm2(L1, L2, t1, t2), J = k.J, v = [J[0][0] * p.w1 + J[0][1] * p.w2, J[1][0] * p.w1 + J[1][1] * p.w2], tau = [J[0][0] * p.Fx + J[1][0] * p.Fy, J[0][1] * p.Fx + J[1][1] * p.Fy];
      var W = 640, H = 420, R = L1 + L2, T = Tf(W, H, -R * 1.1, R * 1.1, -R * 1.1, R * 1.1, 16), O = [T.X(0), T.Y(0)];
      var st = el._st || (el._st = { path: [] });
      if (p.trace) { st.path.push([k.x, k.y]); if (st.path.length > 400) st.path.shift(); } else st.path = [];
      var s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="แขนกลสองข้อต่อ">';
      s += '<circle class="mx-ws" cx="' + f1(O[0]) + '" cy="' + f1(O[1]) + '" r="' + f1(T.s * R) + '"/>';
      if (Math.abs(L1 - L2) > 1e-9) s += '<circle class="mx-ws-in" cx="' + f1(O[0]) + '" cy="' + f1(O[1]) + '" r="' + f1(T.s * Math.abs(L1 - L2)) + '"/>';
      s += '<line class="mx-guide" x1="' + f1(T.X(-R * 1.05)) + '" x2="' + f1(T.X(R * 1.05)) + '" y1="' + f1(O[1]) + '" y2="' + f1(O[1]) + '"/><line class="mx-guide" y1="' + f1(T.Y(-R * 1.05)) + '" y2="' + f1(T.Y(R * 1.05)) + '" x1="' + f1(O[0]) + '" x2="' + f1(O[0]) + '"/>';
      if (st.path.length > 1) s += '<polyline class="mx-path" points="' + st.path.map(function (q) { return f1(T.X(q[0])) + "," + f1(T.Y(q[1])); }).join(" ") + '"/>';
      var E = [T.X(k.ex), T.Y(k.ey)], P = [T.X(k.x), T.Y(k.y)];
      s += '<line class="mx-link" x1="' + f1(O[0]) + '" y1="' + f1(O[1]) + '" x2="' + f1(E[0]) + '" y2="' + f1(E[1]) + '"/><line class="mx-link l2" x1="' + f1(E[0]) + '" y1="' + f1(E[1]) + '" x2="' + f1(P[0]) + '" y2="' + f1(P[1]) + '"/>';
      s += arrow(O[0], O[1], E[0], E[1], "c1", "L₁e₁", { w: 2, lt: 0.5 }) + arrow(E[0], E[1], P[0], P[1], "c3", "L₂e₁₂", { w: 2, lt: 0.5 }) + arrow(O[0], O[1], P[0], P[1], "c2", "p", { w: 2, dash: true, lt: 0.62, off: -14 });
      s += '<rect class="mx-base" x="' + f1(O[0] - 18) + '" y="' + f1(O[1]) + '" width="36" height="12" rx="2"/><circle class="mx-joint" cx="' + f1(O[0]) + '" cy="' + f1(O[1]) + '" r="7"/><circle class="mx-joint" cx="' + f1(E[0]) + '" cy="' + f1(E[1]) + '" r="6"/><circle class="mx-tip" cx="' + f1(P[0]) + '" cy="' + f1(P[1]) + '" r="5"/>';
      s += '<polyline class="mx-arc c4" points="' + arcPath(O[0], O[1], 30, 0, t1) + '"/>' + txt(O[0] + 44 * Math.cos(t1 / 2 * D2R), O[1] - 44 * Math.sin(t1 / 2 * D2R) + 4, "θ₁", "mx-lb c4", "middle");
      s += '<polyline class="mx-arc c5" points="' + arcPath(E[0], E[1], 24, t1, t1 + t2) + '"/>' + txt(E[0] + 38 * Math.cos((t1 + t2 / 2) * D2R), E[1] - 38 * Math.sin((t1 + t2 / 2) * D2R) + 4, "θ₂", "mx-lb c5", "middle");
      var vs = 0.25 / Math.max(Math.hypot(v[0], v[1]), 0.3), Fs = 0.3 / Math.max(Math.hypot(+p.Fx, +p.Fy), 10);
      if (Math.hypot(v[0], v[1]) > 1e-6) s += arrow(P[0], P[1], P[0] + T.s * v[0] * vs, P[1] - T.s * v[1] * vs, "c6", "v", { w: 2.4 });
      if (Math.hypot(+p.Fx, +p.Fy) > 1e-6) s += arrow(P[0], P[1], P[0] + T.s * p.Fx * Fs, P[1] - T.s * p.Fy * Fs, "c7", "F", { w: 2.4 });
      if (p.mode === "ik") { var tx = T.X(+p.x), ty = T.Y(+p.y); s += '<path class="mx-target" d="M' + f1(tx - 8) + " " + f1(ty) + "h16M" + f1(tx) + " " + f1(ty - 8) + 'v16"/>'; }
      if (Math.abs(k.det) < 0.02 * L1 * L2) s += txt(W / 2, 24, "⚠ ใกล้ภาวะเอกฐาน (singularity): det J ≈ 0", "mx-cap bad", "middle");
      s += "</svg>";
      var mat = function (A) { return '<span class="v3-mat">' + A.map(function (r) { return r.map(function (x) { return num(x, 4); }).join("   "); }).join("<br>") + "</span>"; };
      var out = (ikMsg ? row("⚠", ikMsg, "v3-bad") : "") +
        (p.mode === "ik" && !ikMsg ? row("Inverse kinematics", "cos θ₂ = (x² + y² − L₁² − L₂²)/(2L₁L₂) = " + num(Math.cos(t2 * D2R), 4) + " → θ₂ = " + deg(t2) + ", θ₁ = atan2(y, x) − atan2(L₂sin θ₂, L₁ + L₂cos θ₂) = " + deg(t1)) : "") +
        row("p = L₁(cos θ₁, sin θ₁) + L₂(cos(θ₁+θ₂), sin(θ₁+θ₂))", "(" + num(k.ex) + ", " + num(k.ey) + ") + (" + num(k.x - k.ex) + ", " + num(k.y - k.ey) + ") = <b>(" + num(k.x) + ", " + num(k.y) + ") m</b>", "v3-key") +
        row("Jacobian J = ∂p/∂θ", mat(J) + "  det J = L₁L₂ sin θ₂ = " + num(k.det, 4)) +
        row("ความเร็วปลายแขน v = J θ̇", "(" + num(v[0]) + ", " + num(v[1]) + ") m/s · |v| = " + num(Math.hypot(v[0], v[1])) + " m/s") +
        row("แรงบิดข้อต่อ τ = Jᵀ F", "τ₁ = " + num(tau[0]) + " N·m · τ₂ = " + num(tau[1]) + " N·m", "v3-key") +
        row("ความหมาย", "τ₁ = (r_tip × F)·k และ τ₂ = (r_tip − r_elbow) × F ·k: แรงบิดที่ข้อต่อคือโมเมนต์ของแรงปลายแขนรอบข้อต่อนั้น");
      return { svg: s, out: out, t1: t1, t2: t2 };
    }
  };

  // =========================================================================== mount
  function mount(el) {
    var key = el.getAttribute("data-lab"), S = LABS[key];
    if (!S) { el.textContent = "ไม่พบแล็บ " + key; return; }
    var p = {}, init = {};
    try { init = JSON.parse(el.getAttribute("data-p") || "{}"); } catch (_) {}
    S.ctl.forEach(function (c) { p[c.k] = init[c.k] != null ? init[c.k] : c.v; });
    if (el.getAttribute("data-mode")) p.mode = el.getAttribute("data-mode");
    el.innerHTML = '<p class="v3-t"><b>' + esc(el.getAttribute("data-title") || S.t) + '</b><span class="mono">แล็บกลศาสตร์ · ปรับค่าแล้วดูผลทันที</span></p><div class="v3-body"><div class="v3-fig mx-fig"></div><div class="v3-side"><div class="v3-ctls"></div><div class="v3-out" aria-live="polite"></div></div></div>';
    el.classList.add("mx-ready");
    var fig = el.querySelector(".mx-fig"), ctls = el.querySelector(".v3-ctls"), out = el.querySelector(".v3-out");
    S.ctl.forEach(function (c) { ctls.appendChild(ctl(c, p[c.k])); });
    function vis() {
      if (!S.show) return;
      var g = S.show(p);
      ctls.querySelectorAll(".v3-c[data-g]").forEach(function (l) { l.hidden = l.dataset.g !== g; });
    }
    function run() {
      vis();
      var r = S.f(p, el);
      fig.innerHTML = r.svg; out.innerHTML = r.out;
    }
    ctls.addEventListener("input", function (e) {
      var lab = e.target.closest(".v3-c"); if (!lab) return;
      var k = lab.dataset.k, t = e.target;
      if (t.type === "checkbox") p[k] = t.checked;
      else if (t.tagName === "SELECT") p[k] = t.value;
      else { var v = parseFloat(t.value); if (!isFinite(v)) return; p[k] = v; var o = lab.querySelector(t.type === "range" ? 'input[type="number"]' : 'input[type="range"]'); if (o) o.value = v; }
      if (key === "arm" && (k === "mode")) {
        // keep the pose when switching between FK and IK
        var kk = calc.arm2(+p.L1, +p.L2, +p.t1, +p.t2);
        if (p.mode === "ik") { p.x = +kk.x.toFixed(3); p.y = +kk.y.toFixed(3); setInput(el, "x", p.x); setInput(el, "y", p.y); }
      }
      run();
    });
    // drag the target point of the arm in IK mode
    if (key === "arm") {
      var drag = false;
      fig.addEventListener("pointerdown", function (e) { if (p.mode !== "ik") return; drag = true; move(e); try { fig.setPointerCapture(e.pointerId); } catch (_) {} });
      fig.addEventListener("pointermove", function (e) { if (drag) move(e); });
      fig.addEventListener("pointerup", function () { drag = false; });
      var move = function (e) {
        var svg = fig.querySelector("svg"), b = svg.getBoundingClientRect(), R = +p.L1 + +p.L2, T = Tf(640, 420, -R * 1.1, R * 1.1, -R * 1.1, R * 1.1, 16);
        var sx = (e.clientX - b.left) * 640 / b.width, sy = (e.clientY - b.top) * 420 / b.height;
        p.x = +((sx - T.X(0)) / T.s).toFixed(3); p.y = +((T.Y(0) - sy) / T.s).toFixed(3); setInput(el, "x", p.x); setInput(el, "y", p.y); run();
      };
      fig.classList.add("mx-drag");
    }
    run();
  }
  root.VecMech = { calc: calc, LABS: LABS };
  if (typeof module === "object" && module.exports) module.exports = root.VecMech;
  if (typeof document === "undefined") return;
  function init() { document.querySelectorAll(".mech-lab[data-lab]").forEach(function (el) { if (!el.classList.contains("mx-ready")) mount(el); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
