/* Multivariable calculus labs, part 1 — /learn/multivariable-calculus/   (plain JS; needs mathkit.js, mvc-core.js, vendor/katex.min.js)
   Shared toolkit exported as window.MVL: Scene3D (canvas orbit viewer), Map2D (SVG plan view with draggable points), helpers.
   Widgets (all take their start state from data-* attributes; buttons with data-<widget>-set='{…}' reload them):
   <div class="mv-surf" data-f="x^2+y^2" data-r="2" data-x0="1" data-y0="0.5" data-show="slices,plane,grad">   surface z=f(x,y) + contour map, slices, tangent plane
   <div class="mv-grad" data-f="x^2+3y^2" data-x0="2" data-y0="1">                                             gradient, directional derivative, gradient descent
   <div class="mv-opt"  data-mode="crit|lagrange|lsq" …>                                                       critical points / Lagrange multipliers / least squares
   <div class="mv-int"  data-f="x*y" data-type="rect|typeI|polar" …>                                           double integral: Riemann sum vs exact, area/volume/mass/centroid/inertia
   <div class="mv-tri"  data-sys="rect|cyl|sph" data-f="1" …>                                                  triple integrals with the Jacobian shown
   <div class="mv-jac"  data-preset="polar">                                                                   change of variables: det J as local area scale
   Every worked number on the lesson pages was checked with sympy/scipy (see scripts/test-mvc.mjs). */
(function (root) {
  "use strict";
  var MK = root.MK, MVC = root.MVC;
  if (!MK || !MVC) return;
  var MVL = root.MVL = {};
  var PI = Math.PI;
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var esc = MK.esc, fmt = MVC.fmt;
  var T = function (s, dsp) { return MK.texStr(s, dsp); };
  MVL.$$ = $$; MVL.T = T;

  /* ------------------------------------------------------------------ small UI helpers */
  function slider(key, label, min, max, step, val) {
    return '<label class="lap-row cl-sl"><span class="lap-lbl">' + label + '</span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output>' + fmtOut(val) + "</output></label>";
  }
  function fmtOut(v) { return String(+(+v).toFixed(3)); }
  function bindSliders(box, st, draw) {
    $$("input[type=range][data-k]", box).forEach(function (r) {
      r.addEventListener("input", function () { st[r.getAttribute("data-k")] = +r.value; r.parentNode.querySelector("output").textContent = fmtOut(r.value); draw(r.getAttribute("data-k")); });
    });
  }
  function setSlider(box, k, v) { var r = box.querySelector('input[data-k="' + k + '"]'); if (r) { r.value = v; r.parentNode.querySelector("output").textContent = fmtOut(v); } }
  function chips(list, attr, cur) {
    return list.map(function (c, i) { return '<button type="button" class="lap-chip' + (cur === i ? " on" : "") + '" ' + attr + '="' + i + '">' + c[0] + "</button>"; }).join("");
  }
  function checks(list) { // [[key,label,on]]
    return '<div class="mv-chk">' + list.map(function (c) { return '<label><input type="checkbox" data-chk="' + c[0] + '"' + (c[2] ? " checked" : "") + "> " + c[1] + "</label>"; }).join("") + "</div>";
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  function dataObj(box, name) { var o = {}; try { o = JSON.parse(box.getAttribute("data-" + name) || "{}"); } catch (e) { o = {}; } return o; }
  MVL.slider = slider; MVL.bindSliders = bindSliders; MVL.setSlider = setSlider; MVL.chips = chips; MVL.checks = checks; MVL.debounce = debounce; MVL.fmtOut = fmtOut;

  // compile helper with Thai error text; returns null and writes the error into `out` on failure
  function compileIn(src, vars, out, label) {
    try { return MVC.fn(src, vars); }
    catch (e) { if (out) out.innerHTML = '<p class="lap-err">⚠ ' + (label ? label + ": " : "") + esc(e.message) + "</p>"; return null; }
  }
  MVL.compileIn = compileIn;

  var css = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888"; };
  var themeListeners = [];
  MVL.onTheme = function (cb) { themeListeners.push(cb); };
  (function () {
    var fire = function () { themeListeners.forEach(function (cb) { try { cb(); } catch (e) { /* ignore */ } }); };
    if (root.MutationObserver) new MutationObserver(fire).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    if (root.matchMedia) { var mq = root.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", fire); }
  })();
  var reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  MVL.reduced = reduced;

  /* ------------------------------------------------------------------ colour map (blue → teal → yellow → orange → red) */
  var STOPS = [[0, [47, 95, 168]], [0.28, [58, 166, 160]], [0.55, [232, 197, 71]], [0.8, [232, 121, 58]], [1, [184, 52, 28]]];
  function cmap(t) {
    t = Math.max(0, Math.min(1, t));
    for (var i = 1; i < STOPS.length; i++) if (t <= STOPS[i][0]) {
      var a = STOPS[i - 1], b = STOPS[i], u = (t - a[0]) / (b[0] - a[0]);
      return [a[1][0] + (b[1][0] - a[1][0]) * u, a[1][1] + (b[1][1] - a[1][1]) * u, a[1][2] + (b[1][2] - a[1][2]) * u];
    }
    return STOPS[STOPS.length - 1][1];
  }
  var rgb = function (c, k) { k = k == null ? 1 : k; return "rgb(" + Math.min(255, Math.round(c[0] * k)) + "," + Math.min(255, Math.round(c[1] * k)) + "," + Math.min(255, Math.round(c[2] * k)) + ")"; };
  MVL.cmap = cmap; MVL.rgb = rgb;
  var cm = function (t) { return rgb(cmap(t)); };
  MVL.cm = cm;

  /* ================================================================== Scene3D — canvas orbit viewer (z up) */
  function Scene3D(host, o) {
    o = o || {};
    var self = this;
    this.o = o; this.host = host; this.yaw = o.yaw != null ? o.yaw : -0.75; this.pitch = o.pitch != null ? o.pitch : 0.5; this.zoom = 1;
    this.items = []; this.box = [-1, 1, -1, 1, -1, 1]; this.auto = false; this.labels = o.labels || ["x", "y", "z"];
    host.classList.add("mv-3d");
    host.innerHTML = '<canvas tabindex="0" role="img" aria-label="' + esc(o.label || "3D plot") + '"></canvas>' +
      '<div class="mv-3d-tools" role="group" aria-label="มุมมอง"><button type="button" data-v="iso">3D</button><button type="button" data-v="top">บน</button><button type="button" data-v="front">หน้า</button><button type="button" data-v="side">ข้าง</button><button type="button" data-v="spin" aria-pressed="false">⟳</button><button type="button" data-v="in" aria-label="ซูมเข้า">+</button><button type="button" data-v="out" aria-label="ซูมออก">−</button></div>';
    this.cv = host.querySelector("canvas");
    var cv = this.cv, down = null;
    cv.addEventListener("pointerdown", function (e) { down = { x: e.clientX, y: e.clientY, yaw: self.yaw, pitch: self.pitch, id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } });
    cv.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      self.yaw = down.yaw + dx * 0.008;
      if (e.pointerType !== "touch") self.pitch = Math.max(-0.05, Math.min(1.5707, down.pitch + dy * 0.008));
      self.draw();
    });
    var up = function () { down = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("keydown", function (e) {
      var k = e.key, h = true;
      if (k === "ArrowLeft") self.yaw -= 0.1; else if (k === "ArrowRight") self.yaw += 0.1;
      else if (k === "ArrowUp") self.pitch = Math.min(1.5707, self.pitch + 0.08); else if (k === "ArrowDown") self.pitch = Math.max(-0.05, self.pitch - 0.08);
      else if (k === "+" || k === "=") self.zoom *= 1.15; else if (k === "-") self.zoom /= 1.15; else h = false;
      if (h) { e.preventDefault(); self.draw(); }
    });
    host.querySelector(".mv-3d-tools").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var v = b.getAttribute("data-v");
      if (v === "iso") { self.yaw = -0.75; self.pitch = 0.5; self.zoom = 1; }
      else if (v === "top") { self.yaw = 0; self.pitch = 1.5707; }
      else if (v === "front") { self.yaw = 0; self.pitch = 0; }
      else if (v === "side") { self.yaw = PI / 2; self.pitch = 0; }
      else if (v === "in") self.zoom *= 1.2; else if (v === "out") self.zoom /= 1.2;
      else if (v === "spin") { self.auto = !self.auto; b.setAttribute("aria-pressed", self.auto); b.classList.toggle("on", self.auto); if (self.auto) self.spin(); }
      self.draw();
    });
    if (root.ResizeObserver) { var ro = new ResizeObserver(function () { self.draw(); }); ro.observe(host); }
    MVL.onTheme(function () { self.draw(); });
  }
  Scene3D.prototype.spin = function () {
    var self = this;
    if (reduced) { this.auto = false; return; }
    (function step() { if (!self.auto) return; self.yaw += 0.012; self.draw(); requestAnimationFrame(step); })();
  };
  // items: see header; bbox [x0,x1,y0,y1,z0,z1] fixes the view box (otherwise taken from the items)
  Scene3D.prototype.set = function (items, bbox) {
    this.items = items;
    if (bbox) this.box = bbox;
    else {
      var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      var add = function (p) { for (var i = 0; i < 3; i++) if (isFinite(p[i])) { if (p[i] < lo[i]) lo[i] = p[i]; if (p[i] > hi[i]) hi[i] = p[i]; } };
      items.forEach(function (it) {
        if (it.noBox) return;
        if (it.pts) { if (it.type === "mesh") it.pts.forEach(function (r) { r.forEach(add); }); else it.pts.forEach(add); }
        if (it.p) add(it.p); if (it.a) add(it.a); if (it.b) add(it.b);
      });
      for (var i = 0; i < 3; i++) if (!isFinite(lo[i]) || hi[i] - lo[i] < 1e-9) { lo[i] = (isFinite(lo[i]) ? lo[i] : 0) - 1; hi[i] = lo[i] + 2; }
      this.box = [lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]];
    }
    this.draw();
  };
  Scene3D.prototype.draw = function () {
    var cv = this.cv, host = this.host;
    var W = Math.max(240, host.clientWidth || 480), H = Math.round(W * (this.o.ratio || 0.74));
    var dpr = Math.min(2, root.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px"; }
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var ink = css("--ink"), ink2 = css("--ink-2"), ink3 = css("--ink-3"), rule = css("--rule");
    var b = this.box, cx = (b[0] + b[1]) / 2, cy = (b[2] + b[3]) / 2, cz = (b[4] + b[5]) / 2;
    var rx = (b[1] - b[0]) / 2, ry = (b[3] - b[2]) / 2, rz = (b[5] - b[4]) / 2;
    if (this.o.equal) { var m = Math.max(rx, ry, rz); rx = ry = rz = m; }
    var cyaw = Math.cos(this.yaw), syaw = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var sc = this.zoom * Math.min(W, H) / 3.45, ox = W / 2, oy = H / 2 + 8;
    // world → [screen x, screen y, depth]
    var P = function (p) {
      var x = (p[0] - cx) / rx, y = (p[1] - cy) / ry, z = (p[2] - cz) / rz;
      var X = cyaw * x - syaw * y, Y = syaw * x + cyaw * y;
      return [ox + sc * X, oy - sc * (z * cp + Y * sp), Y * cp - z * sp, X, z * cp + Y * sp];
    };
    this.project = P;
    var prims = [], L = [-0.3, 0.55, -0.78];
    var layers = [[], [], [], []];
    // axes: floor grid and edges, drawn behind everything (farthest bottom corner as origin)
    if (this.o.axes !== false) {
      var best = null;
      [[b[0], b[2]], [b[1], b[2]], [b[0], b[3]], [b[1], b[3]]].forEach(function (c) { var d = P([c[0], c[1], b[4]])[2]; if (!best || d > best.d) best = { x: c[0], y: c[1], d: d }; });
      var ex = best.x === b[0] ? b[1] : b[0], ey = best.y === b[2] ? b[3] : b[2];
      ctx.lineWidth = 1; ctx.strokeStyle = rule; ctx.beginPath();
      for (var g = 0; g <= 6; g++) {
        var u = g / 6;
        var a1 = P([best.x + (ex - best.x) * u, best.y, b[4]]), a2 = P([best.x + (ex - best.x) * u, ey, b[4]]);
        ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]);
        var c1 = P([best.x, best.y + (ey - best.y) * u, b[4]]), c2 = P([ex, best.y + (ey - best.y) * u, b[4]]);
        ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]);
      }
      ctx.stroke();
      var O = P([best.x, best.y, b[4]]), AX = P([ex, best.y, b[4]]), AY = P([best.x, ey, b[4]]), AZ = P([best.x, best.y, b[5]]);
      ctx.strokeStyle = ink3; ctx.lineWidth = 1.2; ctx.beginPath();
      [AX, AY, AZ].forEach(function (a) { ctx.moveTo(O[0], O[1]); ctx.lineTo(a[0], a[1]); });
      ctx.stroke();
      ctx.fillStyle = ink2; ctx.font = "12px " + css("--mono");
      ctx.fillText(this.labels[0] + "", AX[0] + 4, AX[1] + 4); ctx.fillText(this.labels[1] + "", AY[0] + 4, AY[1] + 4); ctx.fillText(this.labels[2] + "", AZ[0] + 4, AZ[1] - 4);
      ctx.fillStyle = ink3; ctx.font = "10px " + css("--mono");
      var nf = function (v) { return fmt(v, 3); };
      ctx.fillText(nf(b[0]), P([b[0], best.y, b[4]])[0] - 8, P([b[0], best.y, b[4]])[1] + 12);
      ctx.fillText(nf(b[1]), P([b[1], best.y, b[4]])[0] - 8, P([b[1], best.y, b[4]])[1] + 12);
      ctx.fillText(nf(b[4]), O[0] - 30, O[1] + 3); ctx.fillText(nf(b[5]), AZ[0] - 30, AZ[1] + 3);
    }
    // collect primitives
    this.items.forEach(function (it) {
      var layer = it.layer == null ? 2 : it.layer, bucket = layers[layer];
      switch (it.type) {
        case "mesh": {
          var pts = it.pts, nj = pts.length, ni = pts[0].length, pr = [];
          for (var j = 0; j < nj; j++) { pr.push([]); for (var i = 0; i < ni; i++) { var p = pts[j][i]; pr[j].push(isFinite(p[2]) && isFinite(p[0]) && isFinite(p[1]) ? P(p) : null); } }
          var lo = it.lo, hi = it.hi, span = hi - lo || 1;
          for (j = 0; j < nj - 1; j++) for (i = 0; i < ni - 1; i++) {
            var q0 = pr[j][i], q1 = pr[j][i + 1], q2 = pr[j + 1][i + 1], q3 = pr[j + 1][i];
            if (!q0 || !q1 || !q2 || !q3) continue;
            var zz = (pts[j][i][2] + pts[j][i + 1][2] + pts[j + 1][i + 1][2] + pts[j + 1][i][2]) / 4;
            var ax = q1[3] - q0[3], ay = q1[4] - q0[4], az = q1[2] - q0[2], bx = q3[3] - q0[3], by = q3[4] - q0[4], bz = q3[2] - q0[2];
            var nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, nl = Math.hypot(nx, ny, nz) || 1;
            var br = Math.abs(nx * L[0] + ny * L[1] + nz * L[2]) / nl;
            bucket.push({ d: (q0[2] + q1[2] + q2[2] + q3[2]) / 4, k: "q", p: [q0, q1, q2, q3], fill: it.solid ? it.solid : rgb(cmap((zz - lo) / span), 0.68 + 0.4 * br), stroke: it.wire === false ? null : "rgba(20,30,40,.22)", alpha: it.alpha });
          }
          break;
        }
        case "line": {
          var pp = it.pts.map(function (p) { return isFinite(p[0]) && isFinite(p[1]) && isFinite(p[2]) ? P(p) : null; });
          var dsum = 0, cnt = 0; pp.forEach(function (q) { if (q) { dsum += q[2]; cnt++; } });
          bucket.push({ d: cnt ? dsum / cnt : 0, k: "l", p: pp, color: it.color || ink, w: it.w || 2, dash: it.dash });
          break;
        }
        case "arrow": {
          var a = P(it.a), c = P(it.b);
          bucket.push({ d: (a[2] + c[2]) / 2 - 0.001, k: "a", a: a, b: c, color: it.color || ink, w: it.w || 2.4, label: it.label, dash: it.dash });
          break;
        }
        case "point": { var pt = P(it.p); bucket.push({ d: pt[2] - 0.01, k: "p", a: pt, r: it.r || 4.5, color: it.color || css("--accent"), label: it.label, hollow: it.hollow }); break; }
        case "text": { var tt = P(it.p); bucket.push({ d: tt[2] - 1, k: "t", a: tt, s: it.s, color: it.color || ink2 }); break; }
        case "poly": {
          var qq = it.pts.map(P), ds = 0; qq.forEach(function (q) { ds += q[2]; });
          bucket.push({ d: ds / qq.length, k: "g", p: qq, fill: it.fill || "rgba(201,79,24,.25)", stroke: it.stroke });
          break;
        }
      }
    });
    var mono = css("--mono");
    layers.forEach(function (bucket) {
      bucket.sort(function (a, b2) { return b2.d - a.d; });
      bucket.forEach(function (pr) {
        switch (pr.k) {
          case "q":
          case "g":
            ctx.beginPath(); ctx.moveTo(pr.p[0][0], pr.p[0][1]);
            for (var i = 1; i < pr.p.length; i++) ctx.lineTo(pr.p[i][0], pr.p[i][1]);
            ctx.closePath(); ctx.fillStyle = pr.fill; if (pr.alpha != null) ctx.globalAlpha = pr.alpha; ctx.fill(); ctx.globalAlpha = 1;
            if (pr.stroke) { ctx.strokeStyle = pr.stroke; ctx.lineWidth = pr.k === "q" ? 0.6 : 1.2; ctx.stroke(); }
            break;
          case "l": {
            ctx.beginPath(); var pen = false;
            pr.p.forEach(function (q) { if (!q) { pen = false; return; } if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); pen = true; });
            ctx.strokeStyle = pr.color; ctx.lineWidth = pr.w; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(pr.dash || []); ctx.stroke(); ctx.setLineDash([]);
            break;
          }
          case "a": {
            var dx = pr.b[0] - pr.a[0], dy = pr.b[1] - pr.a[1], len = Math.hypot(dx, dy);
            ctx.strokeStyle = pr.color; ctx.fillStyle = pr.color; ctx.lineWidth = pr.w; ctx.lineCap = "round"; ctx.setLineDash(pr.dash || []);
            ctx.beginPath(); ctx.moveTo(pr.a[0], pr.a[1]); ctx.lineTo(pr.b[0], pr.b[1]); ctx.stroke(); ctx.setLineDash([]);
            if (len > 4) {
              var ux = dx / len, uy = dy / len, hs = Math.min(10, len * 0.4);
              ctx.beginPath(); ctx.moveTo(pr.b[0], pr.b[1]); ctx.lineTo(pr.b[0] - hs * ux + hs * 0.45 * uy, pr.b[1] - hs * uy - hs * 0.45 * ux); ctx.lineTo(pr.b[0] - hs * ux - hs * 0.45 * uy, pr.b[1] - hs * uy + hs * 0.45 * ux); ctx.closePath(); ctx.fill();
            }
            if (pr.label) { ctx.font = "600 12px " + mono; ctx.fillStyle = pr.color; ctx.fillText(pr.label, pr.b[0] + 6, pr.b[1] - 6); }
            break;
          }
          case "p":
            ctx.beginPath(); ctx.arc(pr.a[0], pr.a[1], pr.r, 0, 2 * PI);
            ctx.fillStyle = pr.hollow ? css("--card") : pr.color; ctx.fill(); ctx.strokeStyle = pr.hollow ? pr.color : css("--paper"); ctx.lineWidth = 2; ctx.stroke();
            if (pr.label) { ctx.font = "600 12px " + mono; ctx.fillStyle = css("--ink"); ctx.fillText(pr.label, pr.a[0] + 8, pr.a[1] - 8); }
            break;
          case "t": ctx.font = "12px " + mono; ctx.fillStyle = pr.color; ctx.fillText(pr.s, pr.a[0] + 4, pr.a[1] - 4); break;
        }
      });
    });
  };
  MVL.Scene3D = Scene3D;

  // surface mesh items from f(x,y) on [x0,x1]×[y0,y1]; zr = [lo,hi] clipping range (robust by default)
  function surfaceItem(f, x0, x1, y0, y1, n, zr) {
    var pts = [], vals = [], i, j;
    for (j = 0; j < n; j++) { pts.push([]); for (i = 0; i < n; i++) { var x = x0 + (x1 - x0) * i / (n - 1), y = y0 + (y1 - y0) * j / (n - 1), z; try { z = f(x, y); } catch (e) { z = NaN; } if (!isFinite(z)) z = NaN; pts[j].push([x, y, z]); if (isFinite(z)) vals.push(z); } }
    vals.sort(function (a, b) { return a - b; });
    var lo, hi;
    if (zr) { lo = zr[0]; hi = zr[1]; }
    else if (vals.length) {
      lo = vals[0]; hi = vals[vals.length - 1];
      var q1 = vals[Math.floor(vals.length * 0.01)], q2 = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.99))];
      if (hi - lo > 8 * (q2 - q1)) { var pad = (q2 - q1) * 0.1; lo = q1 - pad; hi = q2 + pad; }
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    } else { lo = -1; hi = 1; }
    pts.forEach(function (row) { row.forEach(function (p) { if (isFinite(p[2]) && (p[2] < lo - 1e-12 || p[2] > hi + 1e-12)) p[2] = NaN; }); });
    return { type: "mesh", pts: pts, lo: lo, hi: hi, layer: 0 };
  }
  MVL.surfaceItem = surfaceItem;

  /* ================================================================== Map2D — SVG plan view */
  function Map2D(host, o) {
    var self = this;
    this.o = o;
    var W = o.w || 560, pl = 38, pr = 10, pt = 10, pb = 26;
    var dx = o.x1 - o.x0, dy = o.y1 - o.y0, pw = W - pl - pr;
    var ph = o.equal === false ? (o.h || 360) - pt - pb : pw * dy / dx;
    var H = ph + pt + pb;
    this.W = W; this.H = H; this.pl = pl; this.pt = pt; this.pw = pw; this.ph = ph;
    this.sx = function (x) { return pl + (x - o.x0) / dx * pw; };
    this.sy = function (y) { return pt + (o.y1 - y) / dy * ph; };
    this.ix = function (px) { return o.x0 + (px - pl) / pw * dx; };
    this.iy = function (py) { return o.y1 - (py - pt) / ph * dy; };
    var id = MK.uid("mp"), s = "";
    var xt = MK.niceTicks(o.x0, o.x1, o.xticks || 8), yt = MK.niceTicks(o.y0, o.y1, o.yticks || 6);
    s += '<g class="mk-grid">';
    xt.forEach(function (t) { s += '<line x1="' + self.sx(t).toFixed(1) + '" x2="' + self.sx(t).toFixed(1) + '" y1="' + pt + '" y2="' + (pt + ph) + '"/>'; });
    yt.forEach(function (t) { s += '<line x1="' + pl + '" x2="' + (pl + pw) + '" y1="' + self.sy(t).toFixed(1) + '" y2="' + self.sy(t).toFixed(1) + '"/>'; });
    s += "</g>";
    if (o.x0 < 0 && o.x1 > 0) s += '<line class="mk-axis" x1="' + self.sx(0).toFixed(1) + '" x2="' + self.sx(0).toFixed(1) + '" y1="' + pt + '" y2="' + (pt + ph) + '"/>';
    if (o.y0 < 0 && o.y1 > 0) s += '<line class="mk-axis" x1="' + pl + '" x2="' + (pl + pw) + '" y1="' + self.sy(0).toFixed(1) + '" y2="' + self.sy(0).toFixed(1) + '"/>';
    s += '<g class="mk-tick">';
    xt.forEach(function (t) { s += '<text x="' + self.sx(t).toFixed(1) + '" y="' + (pt + ph + 14) + '" text-anchor="middle">' + fmt(t, 3) + "</text>"; });
    yt.forEach(function (t) { s += '<text x="' + (pl - 5) + '" y="' + (self.sy(t) + 4).toFixed(1) + '" text-anchor="end">' + fmt(t, 3) + "</text>"; });
    s += "</g>";
    s += '<text class="mk-lab" x="' + (pl + pw) + '" y="' + (H - 3) + '" text-anchor="end">' + (o.xl || "x") + '</text><text class="mk-lab" x="' + (pl + 4) + '" y="' + (pt + 11) + '">' + (o.yl || "y") + "</text>";
    this.clip = id;
    host.innerHTML = '<svg class="mk-plot mv-map" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "plan view") + '">' + s +
      '<clipPath id="' + id + '"><rect x="' + pl + '" y="' + pt + '" width="' + pw + '" height="' + ph + '"/></clipPath><g clip-path="url(#' + id + ')"><g class="mv-st"></g><g class="mv-dy"></g></g><g class="mv-top"></g></svg>';
    this.svg = host.querySelector("svg"); this.st = host.querySelector(".mv-st"); this.dy = host.querySelector(".mv-dy"); this.top = host.querySelector(".mv-top");
    this.onPoint = null;
    var drag = false;
    var at = function (e) { var p = MK.svgPoint(self.svg, e); return [self.ix(p.x), self.iy(p.y)]; };
    this.svg.addEventListener("pointerdown", function (e) {
      if (!self.onPoint) return;
      var p = at(e);
      if (self.accept && !self.accept(p[0], p[1], e)) return;
      drag = true; try { self.svg.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      self.onPoint(p[0], p[1], "down", e); e.preventDefault();
    });
    this.svg.addEventListener("pointermove", function (e) { if (!drag) return; var p = at(e); self.onPoint(p[0], p[1], "move", e); e.preventDefault(); });
    var end = function (e) { if (!drag) return; drag = false; var p = at(e); self.onPoint(p[0], p[1], "up", e); };
    this.svg.addEventListener("pointerup", end); this.svg.addEventListener("pointercancel", function () { drag = false; });
  }
  Map2D.prototype.setStatic = function (h) { this.st.innerHTML = h; };
  Map2D.prototype.setDyn = function (h) { this.dy.innerHTML = h; };
  Map2D.prototype.setTop = function (h) { this.top.innerHTML = h; };
  // SVG helpers (data coordinates)
  Map2D.prototype.arrow = function (x1, y1, x2, y2, color, w, dash) {
    var a = [this.sx(x1), this.sy(y1)], b = [this.sx(x2), this.sy(y2)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (!(len > 0.5)) return "";
    var ux = dx / len, uy = dy / len, hs = Math.min(10, len * 0.45);
    return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + color + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>" +
      '<path d="M' + b[0].toFixed(1) + " " + b[1].toFixed(1) + "L" + (b[0] - hs * ux + hs * 0.45 * uy).toFixed(1) + " " + (b[1] - hs * uy - hs * 0.45 * ux).toFixed(1) + "L" + (b[0] - hs * ux - hs * 0.45 * uy).toFixed(1) + " " + (b[1] - hs * uy + hs * 0.45 * ux).toFixed(1) + 'Z" fill="' + color + '"/>';
  };
  Map2D.prototype.dot = function (x, y, r, fill, stroke, cls, attrs) {
    return '<circle cx="' + this.sx(x).toFixed(1) + '" cy="' + this.sy(y).toFixed(1) + '" r="' + (r || 5) + '" fill="' + (fill || "var(--accent)") + '" stroke="' + (stroke || "var(--paper)") + '" stroke-width="2"' + (cls ? ' class="' + cls + '"' : "") + (attrs || "") + "/>";
  };
  Map2D.prototype.text = function (x, y, s, color, dx, dy, anchor) {
    return '<text class="mk-ann" x="' + (this.sx(x) + (dx || 7)).toFixed(1) + '" y="' + (this.sy(y) + (dy || -7)).toFixed(1) + '"' + (color ? ' fill="' + color + '"' : "") + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + s + "</text>";
  };
  Map2D.prototype.line = function (x1, y1, x2, y2, color, w, dash) {
    return '<line x1="' + this.sx(x1).toFixed(1) + '" y1="' + this.sy(y1).toFixed(1) + '" x2="' + this.sx(x2).toFixed(1) + '" y2="' + this.sy(y2).toFixed(1) + '" stroke="' + color + '" stroke-width="' + (w || 1.6) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linecap="round"/>';
  };
  Map2D.prototype.poly = function (pts, stroke, w, fill, closed, dash) {
    var self = this, d = pts.map(function (p, i) { return (i ? "L" : "M") + self.sx(p[0]).toFixed(1) + " " + self.sy(p[1]).toFixed(1); }).join("");
    return '<path d="' + d + (closed ? "Z" : "") + '" fill="' + (fill || "none") + '" stroke="' + (stroke || "none") + '" stroke-width="' + (w || 1.8) + '" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
  };
  // contour lines of a grid {xs,ys,z} at the given levels → svg string, coloured by level on [lo,hi]
  Map2D.prototype.contours = function (g, levels, lo, hi, w, opacity) {
    var self = this, span = hi - lo || 1, out = "";
    levels.forEach(function (c) {
      var segs = MVC.contourSegs(g.z, g.xs, g.ys, c);
      if (!segs.length) return;
      var d = segs.map(function (s) { return "M" + self.sx(s[0]).toFixed(1) + " " + self.sy(s[1]).toFixed(1) + "L" + self.sx(s[2]).toFixed(1) + " " + self.sy(s[3]).toFixed(1); }).join("");
      out += '<path d="' + d + '" fill="none" stroke="' + cm((c - lo) / span) + '" stroke-width="' + (w || 1.6) + '" stroke-linecap="round"' + (opacity ? ' opacity="' + opacity + '"' : "") + "/>";
    });
    return out;
  };
  // filled colour cells (heat map) of a grid, as rects
  Map2D.prototype.heat = function (g, lo, hi, opacity) {
    var span = hi - lo || 1, out = "", nx = g.xs.length, ny = g.ys.length, self = this;
    var cw = self.pw / (nx - 1) + 0.6, ch = self.ph / (ny - 1) + 0.6;
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var v = g.z[j][i]; if (!isFinite(v)) continue;
      out += '<rect x="' + (self.sx(g.xs[i]) - cw / 2).toFixed(1) + '" y="' + (self.sy(g.ys[j]) - ch / 2).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + ch.toFixed(1) + '" fill="' + cm((v - lo) / span) + '"/>';
    }
    return '<g opacity="' + (opacity || 0.45) + '">' + out + "</g>";
  };
  MVL.Map2D = Map2D;

  /* ================================================================== presets shared by surface-type labs */
  var SURF_PRE = [
    ["ชาม (paraboloid)", "x^2+y^2", 2],
    ["อานม้า (saddle)", "x^2-y^2", 2],
    ["ระนาบ (plane)", "2x+y", 2],
    ["ลูกคลื่น (egg crate)", "sin(x)*cos(y)", 3.2],
    ["ภูเขา (Gaussian)", "3*exp(-(x^2+y^2)/2)", 3],
    ["ภูเขาสองลูก", "2*exp(-((x-1)^2+(y-1)^2))+1.5*exp(-((x+1.2)^2+(y+0.8)^2))", 3],
    ["คลื่นวงกลม (ripple)", "sin(sqrt(x^2+y^2))", 6],
    ["กรวย (cone)", "sqrt(x^2+y^2)", 2]
  ];

  /* ================================================================== 1. mv-surf — surface, slices, tangent plane */
  function initSurf(box) {
    var d = box.dataset;
    var show = (d.show || "slices,plane").split(",");
    var st = { f: d.f || "x^2+y^2", r: +(d.r || 2), x0: +(d.x0 || 1), y0: +(d.y0 || 0.5), slices: show.indexOf("slices") >= 0, plane: show.indexOf("plane") >= 0, grad: show.indexOf("grad") >= 0 };
    var pre = dataObj(box, "presets"); pre = Array.isArray(pre) && pre.length ? pre : SURF_PRE;
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">z = f(x, y) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"></div>' +
      '<div class="lap-chips mv-pre">' + chips(pre, "data-pre") + "</div>" +
      '<div class="mv-sl2">' + slider("x0", "x₀", -st.r, st.r, 0.05, st.x0) + slider("y0", "y₀", -st.r, st.r, 0.05, st.y0) + "</div>" +
      checks([["slices", "ตัดตามแกน (slice) + เส้นสัมผัส", st.slices], ["plane", "ระนาบสัมผัส (tangent plane)", st.plane], ["grad", "ลูกศร gradient", st.grad]]) +
      '<div class="mv-grid2"><div class="mv-s3"></div><div class="mv-sm"></div></div><div class="mv-out"></div><p class="lap-help">ลากบนภาพ 3 มิติเพื่อหมุน · คลิก/ลากบนแผนที่ contour เพื่อย้ายจุด · ใช้ฟังก์ชัน sin cos exp sqrt ln abs และ ^ ได้ เช่น sin(x)*cos(y)</p>';
    var out = box.querySelector(".mv-out"), scene = new Scene3D(box.querySelector(".mv-s3"), { label: "3D surface z = f(x,y) พร้อมจุดและระนาบสัมผัส (surface plot and tangent plane)", ratio: 0.8 });
    var map = null, F = null, FX = null, FY = null, grid = null, rg = [0, 1], lastKey = "";
    function build() {
      F = compileIn(st.f, ["x", "y"], out, "f"); if (!F) return false;
      FX = MVC.compile(MVC.d(F.ast, "x"), ["x", "y"]); FY = MVC.compile(MVC.d(F.ast, "y"), ["x", "y"]);
      var R = st.r;
      var key = st.f + "|" + R;
      if (key !== lastKey) {
        lastKey = key;
        grid = MVC.grid(F, -R, R, -R, R, 61, 61); rg = MVC.range(grid);
        var q = [].concat.apply([], grid.z).filter(isFinite).sort(function (a, b) { return a - b; });
        if (q.length) { var a = q[Math.floor(q.length * 0.01)], b = q[Math.min(q.length - 1, Math.floor(q.length * 0.99))]; if (rg[1] - rg[0] > 8 * (b - a)) rg = [a - (b - a) * 0.1, b + (b - a) * 0.1]; }
        if (rg[1] - rg[0] < 1e-9) rg = [rg[0] - 1, rg[1] + 1];
        map = new Map2D(box.querySelector(".mv-sm"), { x0: -R, x1: R, y0: -R, y1: R, w: 420, label: "แผนที่เส้นชั้นความสูง contour map ของ f(x,y) (level curves)" });
        map.setStatic(map.contours(grid, MVC.levels(rg[0], rg[1], 12), rg[0], rg[1], 1.5));
        map.onPoint = function (x, y) { st.x0 = Math.max(-R, Math.min(R, x)); st.y0 = Math.max(-R, Math.min(R, y)); setSlider(box, "x0", st.x0.toFixed(2)); setSlider(box, "y0", st.y0.toFixed(2)); draw(); };
        $$("input[data-k=x0],input[data-k=y0]", box).forEach(function (r) { r.min = -R; r.max = R; });
      }
      return true;
    }
    function draw() {
      if (!F && !build()) return;
      var R = st.r, x0 = st.x0, y0 = st.y0, f0 = F(x0, y0), fx = FX(x0, y0), fy = FY(x0, y0);
      var items = [surfaceItem(F, -R, R, -R, R, 41, rg)];
      var zlo = rg[0], zhi = rg[1], ok = isFinite(f0);
      var acc = css("--accent"), sig = css("--signal"), okc = css("--ok");
      if (ok) {
        if (st.slices) {
          var cx = [], cy = [], n = 80, k;
          for (k = 0; k <= n; k++) { var s = -R + 2 * R * k / n; cx.push([s, y0, F(s, y0)]); cy.push([x0, s, F(x0, s)]); }
          items.push({ type: "line", pts: cx, color: acc, w: 2.6 }, { type: "line", pts: cy, color: sig, w: 2.6 });
          var h = R * 0.55;
          if (isFinite(fx)) items.push({ type: "line", pts: [[x0 - h, y0, f0 - fx * h], [x0 + h, y0, f0 + fx * h]], color: acc, w: 1.8, dash: [6, 4], noBox: true });
          if (isFinite(fy)) items.push({ type: "line", pts: [[x0, y0 - h, f0 - fy * h], [x0, y0 + h, f0 + fy * h]], color: sig, w: 1.8, dash: [6, 4], noBox: true });
        }
        if (st.plane && isFinite(fx) && isFinite(fy)) {
          var hh = R * 0.45, cs = [[-hh, -hh], [hh, -hh], [hh, hh], [-hh, hh]].map(function (c) { return [x0 + c[0], y0 + c[1], f0 + fx * c[0] + fy * c[1]]; });
          items.push({ type: "poly", pts: cs, fill: "rgba(47,125,79,.38)", stroke: okc, layer: 1, noBox: true });
        }
        if (st.grad && isFinite(fx) && isFinite(fy)) {
          var gl = Math.hypot(fx, fy) || 1, sc = R * 0.45 / Math.max(gl, 1e-9) * Math.min(1, gl);
          items.push({ type: "arrow", a: [x0, y0, zlo], b: [x0 + fx * sc, y0 + fy * sc, zlo], color: css("--ink"), w: 3, label: "∇f", noBox: true });
          items.push({ type: "line", pts: [[x0, y0, zlo], [x0, y0, f0]], color: css("--ink-3"), w: 1, dash: [3, 4], noBox: true });
        }
        items.push({ type: "point", p: [x0, y0, f0], r: 5.5, color: acc, noBox: true });
      }
      scene.set(items, [-R, R, -R, R, zlo, zhi]);
      // map overlay
      var ov = "";
      if (ok) {
        var g0 = MVC.contourSegs(grid.z, grid.xs, grid.ys, f0), pathd = g0.map(function (s) { return "M" + map.sx(s[0]).toFixed(1) + " " + map.sy(s[1]).toFixed(1) + "L" + map.sx(s[2]).toFixed(1) + " " + map.sy(s[3]).toFixed(1); }).join("");
        ov += '<path d="' + pathd + '" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
        if (st.slices) ov += map.line(-R, y0, R, y0, acc, 1.6, "5 4") + map.line(x0, -R, x0, R, sig, 1.6, "5 4");
        if (st.grad && isFinite(fx) && isFinite(fy)) { var gl2 = Math.hypot(fx, fy) || 1, k2 = R * 0.4 * Math.min(1, gl2) / gl2; ov += map.arrow(x0, y0, x0 + fx * k2, y0 + fy * k2, css("--ink"), 3); }
        ov += map.dot(x0, y0, 6.5, acc);
      }
      map.setDyn(ov);
      // read-out
      var lines = "";
      if (!ok) lines = '<p class="lap-err">⚠ ไม่นิยามที่จุดนี้ (f ไม่เป็นจำนวนจริง) ลองย้ายจุด</p>';
      else {
        var tp = "z = " + MVC.texNum(f0) + (fx >= 0 ? " + " : " - ") + MVC.texNum(Math.abs(fx)) + "(x - " + MVC.texNum(x0) + ")" + (fy >= 0 ? " + " : " - ") + MVC.texNum(Math.abs(fy)) + "(y - " + MVC.texNum(y0) + ")";
        lines = '<div class="mv-eqs">' + T("f(x,y) = " + F.tex, true) + T("f_x = " + MVC.tex(MVC.d(F.ast, "x")), true) + T("f_y = " + MVC.tex(MVC.d(F.ast, "y")), true) + "</div>" +
          '<table class="lap-pt mv-tab"><thead><tr><th>จุด (x₀, y₀)</th><th>f(x₀,y₀)</th><th>fₓ = ความชันตามแกน x</th><th>f_y = ความชันตามแกน y</th><th>|∇f|</th></tr></thead><tbody><tr><td>(' + fmt(x0, 4) + ", " + fmt(y0, 4) + ")</td><td>" + fmt(f0, 5) + "</td><td>" + fmt(fx, 5) + "</td><td>" + fmt(fy, 5) + "</td><td>" + fmt(Math.hypot(fx, fy), 5) + "</td></tr></tbody></table>" +
          '<div class="lap-ans">' + T("\\text{ระนาบสัมผัส: } " + tp, true) + "</div>";
      }
      out.innerHTML = lines;
    }
    var inp = box.querySelector('[data-in="f"]');
    inp.addEventListener("input", debounce(function () { st.f = inp.value; lastKey = ""; F = null; draw(); }, 300));
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]"); if (!b) return;
      var p = pre[+b.getAttribute("data-pre")]; st.f = p[1]; if (p[2]) st.r = p[2];
      st.x0 = Math.max(-st.r, Math.min(st.r, st.x0)); inp.value = st.f; lastKey = ""; F = null;
      $$("[data-pre]", box).forEach(function (c) { c.classList.toggle("on", c === b); }); draw();
    });
    $$("input[data-chk]", box).forEach(function (c) { c.addEventListener("change", function () { st[c.getAttribute("data-chk")] = c.checked; draw(); }); });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) {
      Object.keys(o).forEach(function (k) { st[k] = o[k]; });
      if (o.f !== undefined) inp.value = st.f;
      lastKey = ""; F = null; if (o.r !== undefined) st.r = o.r;
      ["x0", "y0"].forEach(function (k) { setSlider(box, k, st[k]); });
      draw();
    };
    draw();
  }

  /* ================================================================== 2. mv-grad — gradient, directional derivative, descent */
  function initGrad(box) {
    var d = box.dataset;
    var st = { f: d.f || "x^2+3y^2", r: +(d.r || 3), x0: +(d.x0 || 2), y0: +(d.y0 || 1), th: +(d.th || 45), alpha: +(d.alpha || 0.1), path: null, mode: "descent" };
    var pre = dataObj(box, "presets"); pre = Array.isArray(pre) && pre.length ? pre : [["ชาม x²+3y²", "x^2+3y^2", 3], ["ชามยาว (ill-conditioned)", "x^2+10y^2", 3], ["ภูเขา", "3*exp(-(x^2+y^2)/2)", 3], ["สองยอด", "2*exp(-((x-1)^2+(y-1)^2))+1.5*exp(-((x+1.2)^2+(y+0.8)^2))", 3], ["ชาม+คลื่น (Rastrigin-like)", "x^2+y^2+2-cos(3x)-cos(3y)", 3], ["อานม้า", "x^2-y^2", 3]];
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">f(x, y) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"></div>' +
      '<div class="lap-chips">' + chips(pre, "data-pre") + "</div>" +
      slider("th", "ทิศ u: มุม θ (องศา)", 0, 360, 1, st.th) + slider("alpha", "ขนาดก้าว α (learning rate)", 0.01, 0.6, 0.01, st.alpha) +
      '<div class="lap-row"><button type="button" class="btn btn-primary btn-sm" data-act="desc">ลงเขา −∇f (descent) 30 ก้าว</button><button type="button" class="btn btn-ghost btn-sm" data-act="asc">ไต่ขึ้น +∇f (ascent)</button><button type="button" class="btn btn-ghost btn-sm" data-act="clear">ล้างเส้นทาง</button></div>' +
      '<div class="mv-grid2"><div class="mv-sm"></div><div class="mv-pol"></div></div><div class="mv-out"></div><p class="lap-help">ลากจุดสีส้มบนแผนที่ · ลูกศรดำ = ∇f (ชี้ทางขึ้นชันที่สุด ตั้งฉากกับเส้นชั้นความสูง) · ลูกศรฟ้า = ทิศ u · กราฟขวา = D<sub>u</sub>f เมื่อหมุนทิศ u รอบจุด</p>';
    var out = box.querySelector(".mv-out"), pol = box.querySelector(".mv-pol"), map = null, F, FX, FY, grid, rg, lastKey = "";
    function build() {
      F = compileIn(st.f, ["x", "y"], out, "f"); if (!F) return false;
      FX = MVC.compile(MVC.d(F.ast, "x"), ["x", "y"]); FY = MVC.compile(MVC.d(F.ast, "y"), ["x", "y"]);
      var R = st.r, key = st.f + "|" + R;
      if (key !== lastKey) {
        lastKey = key; st.path = null;
        grid = MVC.grid(F, -R, R, -R, R, 61, 61); rg = MVC.range(grid);
        var q = [].concat.apply([], grid.z).filter(isFinite).sort(function (a, b) { return a - b; });
        if (q.length) { var a = q[Math.floor(q.length * 0.01)], b = q[Math.min(q.length - 1, Math.floor(q.length * 0.99))]; if (rg[1] - rg[0] > 8 * (b - a)) rg = [a - (b - a) * 0.1, b + (b - a) * 0.1]; }
        map = new Map2D(box.querySelector(".mv-sm"), { x0: -R, x1: R, y0: -R, y1: R, w: 460, label: "contour map พร้อมเวกเตอร์ gradient และทิศ u (gradient and directional derivative)" });
        map.setStatic(map.contours(grid, MVC.levels(rg[0], rg[1], 14), rg[0], rg[1], 1.5));
        map.accept = function (x, y) { return Math.hypot(map.sx(x) - map.sx(st.x0), map.sy(y) - map.sy(st.y0)) < 26; };
        map.onPoint = function (x, y) { st.x0 = Math.max(-R, Math.min(R, x)); st.y0 = Math.max(-R, Math.min(R, y)); st.path = null; draw(); };
      }
      return true;
    }
    function draw() {
      if (!F && !build()) return;
      var R = st.r, x0 = st.x0, y0 = st.y0, fx = FX(x0, y0), fy = FY(x0, y0), f0 = F(x0, y0), th = st.th * PI / 180, ux = Math.cos(th), uy = Math.sin(th);
      var g = Math.hypot(fx, fy), Du = fx * ux + fy * uy, acc = css("--accent"), sig = css("--signal"), ink = css("--ink");
      var ov = "";
      if (isFinite(f0)) {
        var segs = MVC.contourSegs(grid.z, grid.xs, grid.ys, f0);
        ov += '<path d="' + segs.map(function (s) { return "M" + map.sx(s[0]).toFixed(1) + " " + map.sy(s[1]).toFixed(1) + "L" + map.sx(s[2]).toFixed(1) + " " + map.sy(s[3]).toFixed(1); }).join("") + '" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>';
        var len = R * 0.35;
        if (g > 1e-9) ov += map.arrow(x0, y0, x0 + fx / g * len * Math.min(1, 0.35 + g / 6), y0 + fy / g * len * Math.min(1, 0.35 + g / 6), ink, 3.2);
        ov += map.arrow(x0, y0, x0 + ux * len * 0.8, y0 + uy * len * 0.8, sig, 2.6);
        if (st.path) {
          ov += map.poly(st.path.map(function (p) { return [p[0], p[1]]; }), acc, 2, "none", false);
          st.path.forEach(function (p, i) { ov += map.dot(p[0], p[1], i === 0 ? 3.5 : 3, st.mode === "ascent" ? sig : acc, "var(--paper)"); });
        }
        ov += map.dot(x0, y0, 7, acc);
      }
      map.setDyn(ov);
      // polar plot of Du f
      var S = 190, c = S, rmax = Math.max(g, 1e-6), p = "";
      p += '<svg viewBox="0 0 ' + 2 * S + " " + 2 * S + '" class="mk-plot" role="img" aria-label="กราฟขั้ว ค่า D_u f เมื่อหมุนทิศ u (polar plot of directional derivative)">';
      [0.5, 1].forEach(function (k) { p += '<circle cx="' + c + '" cy="' + c + '" r="' + (k * (S - 28)) + '" fill="none" stroke="var(--rule)"/>'; });
      p += '<line x1="12" y1="' + c + '" x2="' + (2 * S - 12) + '" y2="' + c + '" stroke="var(--rule)"/><line x1="' + c + '" y1="12" x2="' + c + '" y2="' + (2 * S - 12) + '" stroke="var(--rule)"/>';
      // |D_u f| as a polar petal: D_u f ≥ 0 drawn solid (uphill), D_u f < 0 dashed (downhill)
      var pos = "", neg = "", lastPos = null, k;
      for (k = 0; k <= 360; k++) {
        var a2 = k * PI / 180, v2 = fx * Math.cos(a2) + fy * Math.sin(a2), r2 = Math.abs(v2) / rmax * (S - 28);
        var X = c + r2 * Math.cos(a2), Y = c - r2 * Math.sin(a2), isPos = v2 >= 0;
        if (isPos) pos += (lastPos === true ? "L" : "M") + X.toFixed(1) + " " + Y.toFixed(1); else neg += (lastPos === false ? "L" : "M") + X.toFixed(1) + " " + Y.toFixed(1);
        lastPos = isPos;
      }
      p += '<path d="' + pos + '" fill="none" stroke="' + sig + '" stroke-width="2.4"/><path d="' + neg + '" fill="none" stroke="' + acc + '" stroke-width="2" stroke-dasharray="5 4"/>';
      var rr0 = Math.abs(Du) / rmax * (S - 28);
      p += '<line x1="' + c + '" y1="' + c + '" x2="' + (c + rr0 * ux).toFixed(1) + '" y2="' + (c - rr0 * uy).toFixed(1) + '" stroke="' + ink + '" stroke-width="1.5"/><circle cx="' + (c + rr0 * ux).toFixed(1) + '" cy="' + (c - rr0 * uy).toFixed(1) + '" r="5" fill="' + (Du >= 0 ? sig : acc) + '" stroke="var(--paper)" stroke-width="2"/>';
      p += '<text class="mk-ann" x="' + (2 * S - 14) + '" y="' + (c - 6) + '" text-anchor="end">θ = 0°</text><text class="mk-ann" x="' + (c + 6) + '" y="24">90°</text>';
      p += '<text class="mk-ann" x="14" y="' + (2 * S - 10) + '">ฟ้าทึบ D<tspan baseline-shift="sub" font-size="9">u</tspan>f &gt; 0 (ขึ้นเขา) · ส้มประ D<tspan baseline-shift="sub" font-size="9">u</tspan>f &lt; 0 (ลงเขา)</text></svg>';
      pol.innerHTML = p;
      var ang = Math.atan2(fy, fx) * 180 / PI;
      var rows = "";
      if (st.path) {
        rows = '<table class="lap-pt mv-tab"><thead><tr><th>ก้าว</th><th>x</th><th>y</th><th>f(x,y)</th></tr></thead><tbody>' + st.path.slice(0, 9).map(function (q, i) { return "<tr><td>" + i + "</td><td>" + fmt(q[0], 5) + "</td><td>" + fmt(q[1], 5) + "</td><td>" + fmt(q[2], 5) + "</td></tr>"; }).join("") + (st.path.length > 9 ? '<tr><td colspan="4">… ก้าวที่ ' + (st.path.length - 1) + ": (" + fmt(st.path[st.path.length - 1][0], 5) + ", " + fmt(st.path[st.path.length - 1][1], 5) + "), f = " + fmt(st.path[st.path.length - 1][2], 5) + "</td></tr>" : "") + "</tbody></table>";
      }
      out.innerHTML = (isFinite(f0) ? '<div class="mv-eqs">' + T("\\nabla f = \\left(" + MVC.tex(MVC.d(F.ast, "x")) + ",\\ " + MVC.tex(MVC.d(F.ast, "y")) + "\\right)", true) + "</div>" +
        '<div class="lap-ans">' + T("\\nabla f(" + MVC.texNum(x0) + "," + MVC.texNum(y0) + ") = (" + MVC.texNum(fx) + ",\\ " + MVC.texNum(fy) + "),\\quad |\\nabla f| = " + MVC.texNum(g) + "\\ \\text{(ชันสุด ที่มุม } " + MVC.texNum(ang) + "^\\circ)", true) +
        T("D_{\\mathbf u}f = \\nabla f\\cdot\\mathbf u = " + MVC.texNum(fx) + "\\cos " + MVC.texNum(st.th) + "^\\circ + " + MVC.texNum(fy) + "\\sin " + MVC.texNum(st.th) + "^\\circ = " + MVC.texNum(Du), true) + "</div>" + rows : '<p class="lap-err">⚠ ไม่นิยามที่จุดนี้</p>');
    }
    function run(ascend) {
      if (!F && !build()) return;
      st.mode = ascend ? "ascent" : "descent";
      st.path = MVC.descent(F.ast, ["x", "y"], [st.x0, st.y0], st.alpha, 30, ascend).filter(function (p) { return isFinite(p[2]) && Math.abs(p[0]) < 50 && Math.abs(p[1]) < 50; });
      draw();
    }
    var inp = box.querySelector('[data-in="f"]');
    inp.addEventListener("input", debounce(function () { st.f = inp.value; lastKey = ""; F = null; draw(); }, 300));
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]");
      if (b) { var p = pre[+b.getAttribute("data-pre")]; st.f = p[1]; if (p[2]) st.r = p[2]; inp.value = st.f; lastKey = ""; F = null; draw(); return; }
      var a = e.target.closest("[data-act]"); if (!a) return;
      var act = a.getAttribute("data-act");
      if (act === "desc") run(false); else if (act === "asc") run(true); else { st.path = null; draw(); }
    });
    bindSliders(box, st, function () { draw(); });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); if (o.f !== undefined) inp.value = st.f; lastKey = ""; F = null; ["th", "alpha"].forEach(function (k) { setSlider(box, k, st[k]); }); draw(); if (o.run) run(o.run === "asc"); };
    draw();
  }

  /* ================================================================== 3. mv-limit — path test for limits of f(x,y) */
  var LIM_PRE = [["xy/(x²+y²) → ไม่มีลิมิต", "x*y/(x^2+y^2)"], ["x²y/(x²+y²) → 0", "x^2*y/(x^2+y^2)"], ["xy²/(x²+y⁴) → ลวงด้วยเส้นตรง", "x*y^2/(x^2+y^4)"], ["sin(x²+y²)/(x²+y²) → 1", "sin(x^2+y^2)/(x^2+y^2)"], ["(x²−y²)/(x²+y²)", "(x^2-y^2)/(x^2+y^2)"], ["(x²−y²)/(x−y) = x+y → 0", "(x^2-y^2)/(x-y)"]];
  function initLimit(box) {
    var d = box.dataset;
    var st = { f: d.f || "x*y/(x^2+y^2)", a: d.a || "0", b: d.b || "0", fam: "line" };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + chips(LIM_PRE.map(function (c) { return c; }), "data-pre") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">f(x, y) =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false" autocomplete="off"><label class="lap-lbl">(x, y) →</label><input class="lap-in sm" data-in="a" value="' + esc(st.a) + '"><input class="lap-in sm" data-in="b" value="' + esc(st.b) + '"></div>' +
      '<div class="lap-chips"><span class="lap-lbl">เส้นทางที่ใช้เข้าหาจุด:</span><button type="button" class="lap-chip on" data-fam="line">เส้นตรง y − b = m(x − a)</button><button type="button" class="lap-chip" data-fam="para">พาราโบลา x − a = m(y − b)²</button><button type="button" class="lap-chip" data-fam="para2">พาราโบลา y − b = m(x − a)²</button></div>' +
      '<div class="mv-grid2"><div class="mv-lp"></div><div class="mv-out"></div></div>' +
      '<p class="lap-help">โปรแกรมเดินเข้าหาจุดตามหลายเส้นทาง (ระยะ t = 1 → 0.001) และพล็อตค่า f · ถ้าสองเส้นทางให้ค่าต่างกัน ลิมิตไม่มี (DNE) · ถ้าทุกเส้นทางที่ลองตรงกัน ยังไม่ใช่การพิสูจน์ — ต้องใช้ squeeze theorem หรือพิกัดขั้ว</p>';
    var out = box.querySelector(".mv-out"), plot = box.querySelector(".mv-lp");
    var MS = [-3, -1, -0.5, 0, 0.5, 1, 3], COL = ["#2f5fa8", "#3aa6a0", "#9b59b6", "#2f7d4f", "#d4a017", "#e8793a", "#b8341c"];
    function draw() {
      var F = compileIn(st.f, ["x", "y"], out, "f"), a, b;
      if (!F) return;
      try { a = MVL.cnum(st.a); b = MVL.cnum(st.b); } catch (e) { out.innerHTML = '<p class="lap-err">⚠ จุดไม่ถูกต้อง: ' + esc(e.message) + "</p>"; return; }
      var pos = function (m, t) { return st.fam === "line" ? [a + t / Math.sqrt(1 + m * m), b + m * t / Math.sqrt(1 + m * m)] : st.fam === "para" ? [a + m * t * t, b + t] : [a + t, b + m * t * t]; };
      var series = [], rows = "", vals = [], k, j;
      MS.forEach(function (m, i) {
        var pts = []; for (k = 1; k <= 200; k++) { var t = 1 * Math.pow(0.001, (k - 1) / 199), p = pos(m, t); pts.push([Math.log10(t), F(p[0], p[1])]); }
        pts.sort(function (p, q) { return p[0] - q[0]; });
        series.push({ pts: pts, color: COL[i], width: 2 });
        var v3 = F.apply(null, pos(m, 1e-3)), v2 = F.apply(null, pos(m, 1e-2)), v1 = F.apply(null, pos(m, 1e-1)); vals.push(F.apply(null, pos(m, 1e-5)));
        rows += '<tr><td><span style="color:' + COL[i] + '">●</span> m = ' + m + "</td><td>" + fmt(v1, 5) + "</td><td>" + fmt(v2, 5) + "</td><td>" + fmt(v3, 5) + "</td></tr>";
      });
      if (st.fam === "line") { var vv = F(a, b + 1e-3), v1 = F(a, b + 1e-1), v2 = F(a, b + 1e-2); rows += "<tr><td>เส้นตั้ง x = a</td><td>" + fmt(v1, 5) + "</td><td>" + fmt(v2, 5) + "</td><td>" + fmt(vv, 5) + "</td></tr>"; vals.push(F(a, b + 1e-5)); }
      var finite = vals.filter(isFinite), lo = Math.min.apply(null, finite), hi = Math.max.apply(null, finite), spread = hi - lo;
      var verdict;
      if (!finite.length) verdict = '<span class="lap-flag no">ค่าไม่นิยามบนเส้นทางที่ลอง</span>';
      else if (spread > 2e-3 * Math.max(1, Math.abs(hi), Math.abs(lo))) verdict = '<span class="lap-flag no">ค่าต่างกันตามเส้นทาง (' + fmt(lo, 4) + " … " + fmt(hi, 4) + ") → ลิมิตไม่มี (DNE)</span>";
      else verdict = '<span class="lap-flag ok">ทุกเส้นทางที่ลองเข้าใกล้ ' + fmt(+((lo + hi) / 2).toFixed(4), 5) + "</span> แต่นี่ยังเป็นเพียงหลักฐาน ไม่ใช่การพิสูจน์";
      var lastm = "";
      if (st.fam === "line") lastm = " ลองสลับเป็นพาราโบลาเพื่อดูว่าเส้นตรงทั้งหมดอาจ “หลอก” ได้";
      plot.innerHTML = MK.plot({ w: 460, h: 340, xmin: -3, xmax: 0, series: series, xlabel: "log₁₀ t (t → 0 คือเข้าใกล้จุด)", ylabel: "f", id: MK.uid("lm"), zero: false, clip: 20, label: "กราฟค่า f ตามเส้นทางเข้าหาจุด (f along paths approaching the point)" });
      out.innerHTML = '<div class="mv-eqs">' + T("\\lim_{(x,y)\\to(" + (st.a === "0" ? "0" : st.a) + "," + (st.b === "0" ? "0" : st.b) + ")} " + F.tex.replace(/^/, ""), true) + "</div><p>" + verdict + lastm + '</p><div class="table-wrap"><table class="lap-pt mv-tab"><thead><tr><th>เส้นทาง</th><th>t = 0.1</th><th>t = 0.01</th><th>t = 0.001</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    }
    ["f", "a", "b"].forEach(function (k) { var i = box.querySelector('[data-in="' + k + '"]'); i.addEventListener("input", debounce(function () { st[k] = i.value; draw(); }, 300)); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]");
      if (b) { st.f = LIM_PRE[+b.getAttribute("data-pre")][1]; st.fam = "line"; $$("[data-fam]", box).forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-fam") === "line"); }); box.querySelector('[data-in="f"]').value = st.f; draw(); return; }
      var f = e.target.closest("[data-fam]"); if (f) { st.fam = f.getAttribute("data-fam"); $$("[data-fam]", box).forEach(function (c) { c.classList.toggle("on", c === f); }); draw(); }
    });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); box.querySelector('[data-in="f"]').value = st.f; box.querySelector('[data-in="a"]').value = st.a; box.querySelector('[data-in="b"]').value = st.b; $$("[data-fam]", box).forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-fam") === st.fam); }); draw(); };
    draw();
  }
  MVL.cnum = function (src) { return MVC.fn(String(src), [])(); };

  /* ================================================================== 4. mv-err — error propagation by the total differential */
  var ERR_PRE = [
    ["R = V/I (ไฟฟ้า)", "V/I", "V,I", "12,2", "0.1,0.02", "V,A", "Ω"],
    ["P = V²/R (ไฟฟ้า)", "V^2/R", "V,R", "230,47", "2,0.5", "V,Ω", "W"],
    ["ปริมาตรกระบอก πr²h (เครื่องกล)", "pi*r^2*h", "r,h", "5,12", "0.05,0.1", "cm,cm", "cm³"],
    ["คานรับน้ำหนักแผ่ 5wL⁴/384EI (โยธา)", "5*w*1000*L^4/(384*E*1e9*I)", "w,L,E,I", "10,6,200,0.0008", "0.3,0.02,6,0.00002", "kN/m,m,GPa,m⁴", "m"],
    ["ความต้านทานขนาน", "R*S/(R+S)", "R,S", "100,220", "5,11", "Ω,Ω", "Ω"]
  ];
  function initErr(box) {
    var d = box.dataset, base = ERR_PRE[0];
    var st = { f: d.f || base[1], vars: d.vars || base[2], vals: d.vals || base[3], unc: d.unc || base[4], units: d.units || base[5], out: d.out || base[6] };
    box.classList.add("lap-lab", "mv-lab");
    box.innerHTML = '<div class="lap-chips">' + chips(ERR_PRE, "data-pre") + "</div>" +
      '<div class="lap-row"><label class="lap-lbl">f =</label><input class="lap-in" data-in="f" value="' + esc(st.f) + '" spellcheck="false"><label class="lap-lbl">ตัวแปร</label><input class="lap-in sm" data-in="vars" value="' + esc(st.vars) + '"></div>' +
      '<div class="lap-row"><label class="lap-lbl">ค่าที่วัดได้</label><input class="lap-in" data-in="vals" value="' + esc(st.vals) + '"><label class="lap-lbl">± ความไม่แน่นอน</label><input class="lap-in" data-in="unc" value="' + esc(st.unc) + '"></div><div class="mv-out"></div>' +
      '<p class="lap-help">ใส่ตัวแปรเป็นตัวอักษรเดียวคั่นด้วยจุลภาค เรียงตรงกับค่าและความไม่แน่นอน · ใช้ ^ sqrt exp ln sin cos ได้ · “แย่สุด” = ผลรวมค่าสัมบูรณ์ของแต่ละพจน์ · “RSS” = รากของผลรวมกำลังสอง (ใช้เมื่อความคลาดเคลื่อนแต่ละตัวเป็นอิสระต่อกัน)</p>';
    var out = box.querySelector(".mv-out");
    function draw() {
      var vars = st.vars.split(",").map(function (v) { return v.trim(); }).filter(Boolean), vals = st.vals.split(",").map(parseFloat), unc = st.unc.split(",").map(parseFloat), units = st.units.split(",");
      if (vars.length !== vals.length || vars.length !== unc.length || vals.concat(unc).some(function (v) { return !isFinite(v); })) { out.innerHTML = '<p class="lap-err">⚠ จำนวนตัวแปร ค่า และความไม่แน่นอนต้องเท่ากัน และเป็นตัวเลข</p>'; return; }
      var F = compileIn(st.f, vars, out, "f"); if (!F) return;
      var f0 = F.apply(null, vals), rows = "", worst = 0, rss = 0, terms = [], i;
      var parts = vars.map(function (v, k) { var A = MVC.d(F.ast, v), C = MVC.compile(A, vars); return { v: v, tex: MVC.tex(A), val: C.apply(null, vals), k: k }; });
      parts.forEach(function (p) { p.c = Math.abs(p.val) * unc[p.k]; worst += p.c; rss += p.c * p.c; });
      rss = Math.sqrt(rss);
      parts.forEach(function (p) { rows += "<tr><td>" + p.v + " = " + fmt(vals[p.k], 5) + " ± " + fmt(unc[p.k], 4) + " " + (units[p.k] || "") + "</td><td>" + fmt(p.val, 5) + "</td><td>" + fmt(p.c, 4) + "</td><td>" + (worst ? fmt(100 * p.c / worst, 3) : 0) + "%</td></tr>"; });
      var top = parts.slice().sort(function (a, b) { return b.c - a.c; })[0];
      out.innerHTML = '<div class="mv-eqs">' + T("df = " + parts.map(function (p) { return "\\frac{\\partial f}{\\partial " + p.v + "}\\,d" + p.v; }).join(" + "), true) + T(parts.map(function (p) { return "\\frac{\\partial f}{\\partial " + p.v + "} = " + p.tex; }).join(",\\quad "), true) + "</div>" +
        '<div class="table-wrap"><table class="lap-pt mv-tab"><thead><tr><th>ตัวแปร</th><th>∂f/∂x ที่ค่านี้</th><th>|∂f/∂x|·Δx</th><th>สัดส่วนของ “แย่สุด”</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
        '<div class="mv-kv"><div><b>f ที่ค่ากลาง</b><span>' + fmt(f0, 6) + " " + st.out + '</span></div><div><b>Δf แย่สุด (Σ|fᵢ|Δxᵢ)</b><span>± ' + fmt(worst, 4) + " (" + fmt(100 * worst / Math.abs(f0), 3) + '%)</span></div><div><b>Δf แบบ RSS</b><span>± ' + fmt(rss, 4) + " (" + fmt(100 * rss / Math.abs(f0), 3) + '%)</span></div><div><b>ตัวที่ทำให้คลาดเคลื่อนมากสุด</b><span>' + top.v + "</span></div></div>";
    }
    ["f", "vars", "vals", "unc"].forEach(function (k) { var i = box.querySelector('[data-in="' + k + '"]'); i.addEventListener("input", debounce(function () { st[k] = i.value; draw(); }, 300)); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]"); if (!b) return;
      var p = ERR_PRE[+b.getAttribute("data-pre")]; st.f = p[1]; st.vars = p[2]; st.vals = p[3]; st.unc = p[4]; st.units = p[5]; st.out = p[6];
      ["f", "vars", "vals", "unc"].forEach(function (k) { box.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw();
    });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; }); ["f", "vars", "vals", "unc"].forEach(function (k) { box.querySelector('[data-in="' + k + '"]').value = st[k]; }); draw(); };
    draw();
  }

  /* ------------------------------------------------------------------ boot */
  var INITS = { "mv-surf": initSurf, "mv-grad": initGrad, "mv-limit": initLimit, "mv-err": initErr };
  MVL.register = function (cls, fn) { INITS[cls] = fn; };
  MVL.boot = function () {
    Object.keys(INITS).forEach(function (cls) {
      $$("." + cls).forEach(function (b) { if (b.__mv) return; b.__mv = true; try { INITS[cls](b); } catch (e) { b.innerHTML = '<p class="lap-err">⚠ แล็บโหลดไม่สำเร็จ: ' + esc(e.message) + "</p>"; if (root.console) console.error(e); } });
    });
    // worksheet buttons: data-mv-set='{"f":"…"}' data-mv-target="id"
    if (MVL._clicks) return;
    MVL._clicks = true;
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mv-set]"); if (!b) return;
      var tgt = document.getElementById(b.getAttribute("data-mv-target")); if (!tgt || !tgt._set) return;
      var o = {}; try { o = JSON.parse(b.getAttribute("data-mv-set")); } catch (x) { return; }
      tgt._set(o); tgt.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    });
  };
  // the other mvc-*.js files register their widgets and call MVL.boot() again (idempotent); this call covers pages that load only this file
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", MVL.boot); else MVL.boot();
  MVL.css = css;
})(typeof window !== "undefined" ? window : globalThis);
