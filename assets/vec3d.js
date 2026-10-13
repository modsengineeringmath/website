/* Vector 3D viewer, explorable scenes and Vector Studio — /learn/vector-algebra/ (no dependencies).
   Embedded scene:  <div class="v3d" data-scene="dircos" [data-p='{"Fx":300}'] [data-dim="2"] [data-h="380"]></div>
   Full studio:     <div class="v3d-studio" [data-preset="cables"] [data-hash]></div>
   Scenes are in SCENES below (dircos, cable, resultant3d, cross, moment, rotate2d, rotate3d, arm3d, lorentz, wire, loop, efield3d, flux).
   Each scene: { t: title, dim, ctl: [{k,l,min,max,step,v,u} | {k,l,type:"sel",o:[[v,label]],v} | {k,l,type:"chk",v}], f(p) → {items, range, out, note} }.
   Drag the drawing to orbit, use the view buttons (3D, xy, xz, yz), ⟳ auto-rotate, ± zoom, keyboard arrows when focused.
   window.Vec3D exposes the math (Vec3D.m) for Node checks: require("./vec3d.cjs"). */
(function (root) {
  "use strict";
  // =========================================================================== math
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var m = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; },
    sc: function (a, k) { return [a[0] * k, a[1] * k, a[2] * k]; },
    dot: function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    cross: function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
    norm: function (a) { return Math.hypot(a[0], a[1], a[2]); },
    unit: function (a) { var n = m.norm(a); return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0]; },
    sum: function (list) { return list.reduce(function (s, v) { return m.add(s, v); }, [0, 0, 0]); },
    angle: function (a, b) { var na = m.norm(a), nb = m.norm(b); if (na < 1e-12 || nb < 1e-12) return NaN; return Math.acos(Math.max(-1, Math.min(1, m.dot(a, b) / (na * nb)))) * R2D; },
    // direction cosines and coordinate direction angles (degrees)
    dirCos: function (a) { var n = m.norm(a); if (n < 1e-12) return null; var c = [a[0] / n, a[1] / n, a[2] / n]; return { c: c, ang: c.map(function (x) { return Math.acos(Math.max(-1, Math.min(1, x))) * R2D; }) }; },
    // spherical: magnitude F, azimuth th (deg, in xy from +x toward +y), elevation ph (deg, above xy plane)
    fromSph: function (F, th, ph) { var h = F * Math.cos(ph * D2R); return [h * Math.cos(th * D2R), h * Math.sin(th * D2R), F * Math.sin(ph * D2R)]; },
    Rx: function (t) { var c = Math.cos(t * D2R), s = Math.sin(t * D2R); return [[1, 0, 0], [0, c, -s], [0, s, c]]; },
    Ry: function (t) { var c = Math.cos(t * D2R), s = Math.sin(t * D2R); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; },
    Rz: function (t) { var c = Math.cos(t * D2R), s = Math.sin(t * D2R); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; },
    mm: function (A, B) { return A.map(function (r) { return [0, 1, 2].map(function (j) { return r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]; }); }); },
    mv: function (A, v) { return A.map(function (r) { return r[0] * v[0] + r[1] * v[1] + r[2] * v[2]; }); },
    T: function (A) { return [0, 1, 2].map(function (i) { return [A[0][i], A[1][i], A[2][i]]; }); },
    // Z-Y-X (yaw ψ about z, pitch θ about new y, roll φ about new x): R = Rz(ψ)·Ry(θ)·Rx(φ)
    euler: function (yaw, pitch, roll) { return m.mm(m.mm(m.Rz(yaw), m.Ry(pitch)), m.Rx(roll)); },
    // Rodrigues: rotate by t degrees about unit axis k
    axisAngle: function (k, t) {
      k = m.unit(k); var c = Math.cos(t * D2R), s = Math.sin(t * D2R), v = 1 - c, x = k[0], y = k[1], z = k[2];
      return [[c + x * x * v, x * y * v - z * s, x * z * v + y * s], [y * x * v + z * s, c + y * y * v, y * z * v - x * s], [z * x * v - y * s, z * y * v + x * s, c + z * z * v]];
    },
    det: function (A) { return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]); },
    // 3-DOF articulated arm: base yaw q1 about z, shoulder q2 and elbow q3 pitch (deg). Returns joint positions.
    arm3: function (q1, q2, q3, h, L2, L3) {
      var c1 = Math.cos(q1 * D2R), s1 = Math.sin(q1 * D2R), a2 = q2 * D2R, a23 = (q2 + q3) * D2R;
      var p0 = [0, 0, 0], p1 = [0, 0, h];
      var r2 = L2 * Math.cos(a2), p2 = [r2 * c1, r2 * s1, h + L2 * Math.sin(a2)];
      var r3 = r2 + L3 * Math.cos(a23), p3 = [r3 * c1, r3 * s1, h + L2 * Math.sin(a2) + L3 * Math.sin(a23)];
      return [p0, p1, p2, p3];
    },
    k_e: 8.9875517923e9, mu0: 4 * Math.PI * 1e-7
  };

  // =========================================================================== formatting
  function num(v, s, z) {
    if (v === null || v === undefined || !isFinite(v)) return "—";
    if (Math.abs(v) < (z == null ? 1e-12 : z)) return "0";
    s = s || 4;
    var a = Math.abs(v);
    if (a >= 1e6 || a < 1e-3) { var e = Math.floor(Math.log10(a)), mt = v / Math.pow(10, e); return (+mt.toPrecision(s)).toString().replace("-", "−") + "×10" + sup(e); }
    var d = Math.max(0, s - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString().replace("-", "−");
  }
  function sup(e) { var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }; return String(e).split("").map(function (c) { return map[c] || c; }).join(""); }
  function vec(a, s, n, z) { return "(" + a.slice(0, n || 3).map(function (x) { return num(x, s, z); }).join(", ") + ")"; }
  function deg(v) { return num(v, 4) + "°"; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function row(label, value, cls) { return '<div class="v3-r' + (cls ? " " + cls : "") + '"><b>' + label + "</b><span>" + value + "</span></div>"; }

  // =========================================================================== viewer
  var NS = "http://www.w3.org/2000/svg", seq = 0;
  function niceStep(r) { var raw = r / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }

  function View(host, o) {
    o = o || {};
    this.W = o.w || 640; this.H = o.h || 420;
    this.dim = o.dim || 3;
    this.az = o.az != null ? o.az : 32; this.el = o.el != null ? o.el : 24;
    this.zoom = 1; this.persp = !!o.persp; this.grid = o.grid || "xy"; this.axes = o.axes !== false;
    this.items = []; this.range = 1; this.labels = o.labels || ["x", "y", "z"];
    this.ticks = o.ticks !== false;
    this.id = "v3" + (++seq);
    this.svg = document.createElementNS(NS, "svg");
    this.svg.setAttribute("viewBox", "0 0 " + this.W + " " + this.H);
    this.svg.setAttribute("class", "v3-svg");
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("tabindex", "0");
    this.svg.setAttribute("aria-label", o.aria || "ภาพเวกเตอร์สามมิติ ลากเพื่อหมุนมุมมอง");
    host.appendChild(this.svg);
    var self = this, drag = null;
    this.svg.addEventListener("pointerdown", function (e) {
      if (self.dim === 2 || e.button > 0) return;
      drag = { x: e.clientX, y: e.clientY, az: self.az, el: self.el };
      try { self.svg.setPointerCapture(e.pointerId); } catch (_) {}
      self.stopSpin();
    });
    this.svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var k = 360 / Math.max(200, self.svg.getBoundingClientRect().width);
      self.az = drag.az - (e.clientX - drag.x) * k;
      self.el = Math.max(-89, Math.min(89, drag.el + (e.clientY - drag.y) * k));
      self.draw();
    });
    var end = function () { drag = null; };
    this.svg.addEventListener("pointerup", end); this.svg.addEventListener("pointercancel", end);
    this.svg.addEventListener("wheel", function (e) {
      if (!(e.ctrlKey || e.metaKey) && document.activeElement !== self.svg) return;
      e.preventDefault(); self.setZoom(self.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
    this.svg.addEventListener("keydown", function (e) {
      var k = e.key, used = true;
      if (k === "ArrowLeft") self.az += 6; else if (k === "ArrowRight") self.az -= 6;
      else if (k === "ArrowUp") self.el = Math.min(89, self.el + 6); else if (k === "ArrowDown") self.el = Math.max(-89, self.el - 6);
      else if (k === "+" || k === "=") self.zoom *= 1.1; else if (k === "-") self.zoom /= 1.1; else used = false;
      if (used && self.dim !== 2) { e.preventDefault(); self.draw(); }
    });
  }
  View.prototype.setZoom = function (z) { this.zoom = Math.max(0.4, Math.min(4, z)); this.draw(); };
  View.prototype.setView = function (v) {
    var V = { iso: [32, 24], xy: [-90, 90], xz: [-90, 0], yz: [0, 0], iso2: [-58, 24] }[v];
    if (!V) return; this.az = V[0]; this.el = V[1]; this.draw();
  };
  View.prototype.spin = function (on) {
    var self = this;
    if (!on) return this.stopSpin();
    if (this._spin) return;
    var last = performance.now();
    var step = function (t) { if (!self._spin) return; self.az -= (t - last) * 0.02; last = t; self.draw(); self._spin = requestAnimationFrame(step); };
    this._spin = requestAnimationFrame(step);
  };
  View.prototype.stopSpin = function () { if (this._spin) cancelAnimationFrame(this._spin); this._spin = null; if (this.onSpinStop) this.onSpinStop(); };
  View.prototype.basis = function () {
    var az = this.az * D2R, el = this.el * D2R;
    if (this.dim === 2) { az = -Math.PI / 2; el = Math.PI / 2; }
    var ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(az), sa = Math.sin(az);
    return { d: [ce * ca, ce * sa, se], r: [-sa, ca, 0], u: [-se * ca, -se * sa, ce] };
  };
  View.prototype.P = function (p) {
    var b = this._b, x = m.dot(p, b.r), y = m.dot(p, b.u), z = m.dot(p, b.d);
    var f = 1;
    if (this.persp && this.dim === 3) { var D = this.range * 5; f = D / Math.max(D * 0.25, D - z); }
    return [this.W / 2 + this._s * x * f, this.H / 2 - this._s * y * f, z];
  };
  View.prototype.set = function (items, range) { this.items = items || []; this.range = range > 0 ? range : 1; this.draw(); };
  View.prototype.draw = function () {
    var self = this, W = this.W, H = this.H;
    this._b = this.basis();
    this._s = (Math.min(W, H) / 2) * 0.82 * this.zoom / this.range;
    var bg = [], list = [];
    var f1 = function (v) { return v.toFixed(1); };
    var line = function (p, q, cls, extra) { var a = self.P(p), b = self.P(q); return '<line class="' + cls + '" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '"' + (extra || "") + "/>"; };
    var R = this.range, step = niceStep(R), L = R * 1.12;
    // grid
    var planes = this.dim === 2 ? ["xy"] : this.grid === "all" ? ["xy", "xz", "yz"] : this.grid === "none" ? [] : [this.grid];
    planes.forEach(function (pl) {
      var n = Math.floor(R / step);
      for (var i = -n; i <= n; i++) {
        var t = i * step, a, b, c, d;
        if (pl === "xy") { a = [t, -n * step, 0]; b = [t, n * step, 0]; c = [-n * step, t, 0]; d = [n * step, t, 0]; }
        else if (pl === "xz") { a = [t, 0, -n * step]; b = [t, 0, n * step]; c = [-n * step, 0, t]; d = [n * step, 0, t]; }
        else { a = [0, t, -n * step]; b = [0, t, n * step]; c = [0, -n * step, t]; d = [0, n * step, t]; }
        bg.push(line(a, b, i === 0 ? "v3-g0" : "v3-g")); bg.push(line(c, d, i === 0 ? "v3-g0" : "v3-g"));
      }
    });
    // axes
    if (this.axes) {
      var ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].slice(0, this.dim === 2 ? 2 : 3);
      ax.forEach(function (e, i) {
        var cls = "v3-ax v3-ax" + i;
        bg.push(line(m.sc(e, -L), [0, 0, 0], cls + " v3-neg"));
        list.push({ z: self.P(m.sc(e, L * 0.5))[2], s: self.arrowSvg([0, 0, 0], m.sc(e, L), cls, self.labels[i], 1.1, "v3-axl v3-axl" + i, null) });
        if (self.ticks) {
          var n = Math.floor(R / step);
          for (var k = 1; k <= n; k++) {
            var p = self.P(m.sc(e, k * step));
            bg.push('<text class="v3-tk" x="' + f1(p[0] + (i === 1 ? 0 : 4)) + '" y="' + f1(p[1] + (i === 1 ? 14 : 4)) + '">' + num(k * step, 3) + "</text>");
          }
        }
      });
    }
    // items
    this.items.forEach(function (it) {
      if (!it) return;
      var s = "", z = 0;
      if (it.t === "arrow") {
        if (m.norm(m.sub(it.b, it.a)) < 1e-12) return;
        s = self.arrowSvg(it.a, it.b, "v3-v " + (it.c || "c1") + (it.dash ? " v3-dash" : "") + (it.thin ? " v3-thin" : ""), it.label, it.w || 1, "v3-lb " + (it.c || "c1"), it.lpos);
        z = (self.P(it.a)[2] + self.P(it.b)[2]) / 2 + (it.front ? 1e3 : 0);
      } else if (it.t === "line") {
        var a = self.P(it.a), b = self.P(it.b);
        s = '<line class="v3-l ' + (it.c || "c7") + (it.dash ? " v3-dash" : "") + (it.thin ? " v3-thin" : "") + '" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '"/>';
        z = (a[2] + b[2]) / 2;
      } else if (it.t === "path") {
        var pts = it.pts.map(function (p) { return self.P(p); });
        s = '<polyline class="v3-l ' + (it.c || "c7") + (it.dash ? " v3-dash" : "") + (it.thin ? " v3-thin" : "") + '" points="' + pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" ") + '"/>';
        z = pts.reduce(function (t, p) { return t + p[2]; }, 0) / pts.length - (it.back ? 1e3 : 0);
      } else if (it.t === "poly") {
        var pp = it.pts.map(function (p) { return self.P(p); });
        s = '<polygon class="v3-poly ' + (it.c || "c1") + '" points="' + pp.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" ") + '"/>';
        z = pp.reduce(function (t, p) { return t + p[2]; }, 0) / pp.length - 1e3;
      } else if (it.t === "pt") {
        var q = self.P(it.p);
        s = '<circle class="v3-pt ' + (it.c || "c7") + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="' + (it.r || 4) + '"/>' + (it.label ? self.text(q[0] + 7, q[1] - 7, it.label, "v3-lb " + (it.c || "c7")) : "");
        z = q[2] + 1;
      } else if (it.t === "text") {
        var tq = self.P(it.p);
        s = self.text(tq[0] + (it.dx || 0), tq[1] + (it.dy || 0), it.txt, "v3-lb " + (it.c || "") + (it.small ? " v3-sm" : ""), it.anchor);
        z = tq[2] + 2e3;
      } else if (it.t === "arc") {
        var u = m.unit(it.u), w = m.sub(it.v, m.sc(u, m.dot(it.v, u))), ang = m.angle(it.u, it.v);
        if (!(ang > 0.5) || m.norm(w) < 1e-12) return;
        w = m.unit(w);
        var arc = [], N = Math.max(6, Math.round(ang / 4));
        for (var i = 0; i <= N; i++) { var t = ang * D2R * i / N; arc.push(m.add(it.o || [0, 0, 0], m.add(m.sc(u, it.r * Math.cos(t)), m.sc(w, it.r * Math.sin(t))))); }
        var ap = arc.map(function (p) { return self.P(p); });
        s = '<polyline class="v3-arc ' + (it.c || "c4") + '" points="' + ap.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" ") + '"/>';
        if (it.label) { var mid = ap[Math.floor(N / 2)], cen = self.P(it.o || [0, 0, 0]), dx = mid[0] - cen[0], dy = mid[1] - cen[1], dl = Math.hypot(dx, dy) || 1; s += self.text(mid[0] + dx / dl * 12, mid[1] + dy / dl * 12 + 4, it.label, "v3-lb v3-sm " + (it.c || "c4"), "middle"); }
        z = ap[Math.floor(N / 2)][2] + 500;
      } else if (it.t === "frame") {
        var lab = it.labels || ["x′", "y′", "z′"], Rm = it.R, Lf = it.len || R * 0.8;
        for (var j = 0; j < 3; j++) {
          if (self.dim === 2 && j === 2) continue;
          var e = [Rm[0][j], Rm[1][j], Rm[2][j]], o2 = it.o || [0, 0, 0];
          list.push({ z: self.P(m.add(o2, m.sc(e, Lf / 2)))[2] + 0.5, s: self.arrowSvg(o2, m.add(o2, m.sc(e, Lf)), "v3-v v3-fr v3-ax" + j + (it.dash ? " v3-dash" : ""), lab[j], 0.9, "v3-lb v3-axl" + j, null) });
        }
        return;
      }
      list.push({ z: z, s: s });
    });
    list.sort(function (a, b) { return a.z - b.z; });
    this.svg.innerHTML = '<rect class="v3-bg" x="0" y="0" width="' + W + '" height="' + H + '"/>' + bg.join("") + list.map(function (x) { return x.s; }).join("") +
      (this.dim === 3 ? '<text class="v3-hint" x="' + (W - 8) + '" y="' + (H - 8) + '" text-anchor="end">ลากเพื่อหมุน · az ' + Math.round(((this.az % 360) + 540) % 360 - 180) + "° el " + Math.round(this.el) + "°</text>" : "");
  };
  View.prototype.text = function (x, y, t, cls, anchor) {
    return '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + esc(t) + "</text>";
  };
  View.prototype.arrowSvg = function (a3, b3, cls, label, w, lcls, lpos) {
    var a = this.P(a3), b = this.P(b3), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), f1 = function (v) { return v.toFixed(1); };
    var s = '<g class="' + cls + '">';
    if (L < 4) {
      // pointing at (⊙) or away from (⊗) the viewer
      var toward = b[2] > a[2];
      s += '<circle class="v3-end" cx="' + f1(b[0]) + '" cy="' + f1(b[1]) + '" r="7"/>' + (toward ? '<circle class="v3-head" cx="' + f1(b[0]) + '" cy="' + f1(b[1]) + '" r="2.4"/>' : '<path class="v3-x" d="M' + f1(b[0] - 4.5) + " " + f1(b[1] - 4.5) + "l9 9m0 -9l-9 9\"/>");
    } else {
      var ux = dx / L, uy = dy / L, h = Math.max(7, Math.min(15, L * 0.3)) * (w || 1), hw = h * 0.42;
      var bx = b[0] - ux * h, by = b[1] - uy * h;
      s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0] - ux * h * 0.6) + '" y2="' + f1(b[1] - uy * h * 0.6) + '" style="stroke-width:' + (2.6 * (w || 1)).toFixed(1) + 'px"/>';
      s += '<polygon class="v3-head" points="' + f1(b[0]) + "," + f1(b[1]) + " " + f1(bx - uy * hw) + "," + f1(by + ux * hw) + " " + f1(bx + uy * hw) + "," + f1(by - ux * hw) + '"/>';
    }
    s += "</g>";
    if (label) {
      var ux2 = L > 1 ? dx / L : 0.7, uy2 = L > 1 ? dy / L : -0.7, t = lpos == null ? 1 : lpos;
      var px = a[0] + dx * t + ux2 * 12 - uy2 * 8, py = a[1] + dy * t + uy2 * 12 + ux2 * 8 + 4;
      if (t < 1) { px = a[0] + dx * t - uy2 * 14; py = a[1] + dy * t + ux2 * 14 + 4; }
      s += this.text(Math.max(10, Math.min(this.W - 10, px)), Math.max(14, Math.min(this.H - 6, py)), label, lcls, "middle");
    }
    return s;
  };

  // ---------------------------------------------------------------- toolbar shared by scenes and studio
  function toolbar(view, host) {
    var bar = document.createElement("div");
    bar.className = "v3-bar";
    var btns = view.dim === 2 ? [["+", "ขยาย", "zin"], ["−", "ย่อ", "zout"], ["⌂", "รีเซ็ต", "reset"]] :
      [["3D", "มุมมองสามมิติ", "iso"], ["xy", "มองจากบน (ระนาบ xy)", "xy"], ["xz", "มองด้านหน้า (ระนาบ xz)", "xz"], ["yz", "มองด้านข้าง (ระนาบ yz)", "yz"], ["⟳", "หมุนอัตโนมัติ", "spin"], ["◩", "สลับ perspective / orthographic", "persp"], ["#", "สลับตาราง xy · ทุกระนาบ · ไม่มี", "grid"], ["+", "ขยาย", "zin"], ["−", "ย่อ", "zout"], ["⌂", "รีเซ็ต", "reset"]];
    btns.forEach(function (b) {
      var x = document.createElement("button");
      x.type = "button"; x.textContent = b[0]; x.title = b[1]; x.setAttribute("aria-label", b[1]); x.dataset.a = b[2];
      if (b[2] === "spin" || b[2] === "persp") x.setAttribute("aria-pressed", "false");
      bar.appendChild(x);
    });
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var a = b.dataset.a;
      if (a === "zin") view.setZoom(view.zoom * 1.2);
      else if (a === "zout") view.setZoom(view.zoom / 1.2);
      else if (a === "reset") { view.zoom = 1; view.stopSpin(); view.setView(view.dim === 2 ? "xy" : "iso"); }
      else if (a === "spin") { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on ? "true" : "false"); view.spin(on); }
      else if (a === "persp") { view.persp = !view.persp; b.setAttribute("aria-pressed", view.persp ? "true" : "false"); view.draw(); }
      else if (a === "grid") { view.grid = { xy: "all", all: "none", none: "xy" }[view.grid] || "xy"; view.draw(); }
      else view.setView(a);
    });
    view.onSpinStop = function () { var s = bar.querySelector('[data-a="spin"]'); if (s) s.setAttribute("aria-pressed", "false"); };
    host.appendChild(bar);
    return bar;
  }

  // ---------------------------------------------------------------- helper item builders
  function compPath(v, o, cls) {
    // dashed "box" path from origin: along x, then y, then z, plus the shadow on the xy plane and the drop line
    o = o || [0, 0, 0]; cls = cls || "c7";
    var p1 = m.add(o, [v[0], 0, 0]), p2 = m.add(o, [v[0], v[1], 0]), p3 = m.add(o, v);
    var out = [{ t: "line", a: o, b: p1, c: "ax0", dash: 1 }, { t: "line", a: p1, b: p2, c: "ax1", dash: 1 }];
    if (Math.abs(v[2]) > 1e-12) out.push({ t: "line", a: p2, b: p3, c: "ax2", dash: 1 }, { t: "line", a: o, b: p2, c: cls, dash: 1, thin: 1 });
    out.push({ t: "line", a: [o[0], o[1] + v[1], o[2]], b: p2, c: "c7", dash: 1, thin: 1 });
    return out;
  }
  function frameItems(R, len, labels, dash, o) { return [{ t: "frame", R: R, len: len, labels: labels, dash: dash, o: o }]; }

  // =========================================================================== scenes
  var P3 = function (k, l, min, max, step, v, u) { return { k: k, l: l, min: min, max: max, step: step, v: v, u: u || "" }; };
  var SCENES = {
    // ---------------------------------------------------------------- direction cosines
    dircos: {
      t: "ทิศทางโคไซน์และองค์ประกอบของแรง 3 มิติ",
      ctl: [
        { k: "mode", l: "ป้อนแบบ", type: "sel", v: "comp", o: [["comp", "องค์ประกอบ Fx Fy Fz"], ["sph", "ขนาด + มุมราบ θ + มุมเงย φ"], ["ang", "ขนาด + มุม α β (+γ)"]] },
        P3("Fx", "Fx", -1000, 1000, 10, 300, "N"), P3("Fy", "Fy", -1000, 1000, 10, 400, "N"), P3("Fz", "Fz", -1000, 1000, 10, 500, "N"),
        P3("F", "|F|", 0, 1000, 10, 700, "N"), P3("th", "θ (ในระนาบ xy จาก +x)", -180, 180, 1, 53.13, "°"), P3("ph", "φ (เงยจากระนาบ xy)", -90, 90, 1, 45, "°"),
        P3("al", "α (กับ +x)", 0, 180, 1, 60, "°"), P3("be", "β (กับ +y)", 0, 180, 1, 45, "°"),
        { k: "gs", l: "γ", type: "sel", v: "1", o: [["1", "γ ≤ 90° (Fz ≥ 0)"], ["-1", "γ ≥ 90° (Fz ≤ 0)"]] },
        { k: "arcs", l: "แสดงมุม α β γ", type: "chk", v: true }, { k: "box", l: "แสดงกล่ององค์ประกอบ", type: "chk", v: true }, { k: "unit", l: "แสดงเวกเตอร์หนึ่งหน่วย (×|F|/2)", type: "chk", v: false }
      ],
      show: function (p) { return { comp: ["Fx", "Fy", "Fz"], sph: ["F", "th", "ph"], ang: ["F", "al", "be", "gs"] }[p.mode]; },
      f: function (p) {
        var F, err = "";
        if (p.mode === "sph") F = m.fromSph(p.F, p.th, p.ph);
        else if (p.mode === "ang") {
          var ca = Math.cos(p.al * D2R), cb = Math.cos(p.be * D2R), g2 = 1 - ca * ca - cb * cb;
          if (g2 < -1e-9) { err = "α และ β ชุดนี้ทำให้ cos²α + cos²β > 1 จึงไม่มีทิศจริง ลองลดมุมใดมุมหนึ่งให้ใกล้ 90°"; g2 = 0; }
          var cg = Math.sqrt(Math.max(0, g2)) * (+p.gs);
          F = [p.F * ca, p.F * cb, p.F * cg];
        } else F = [p.Fx, p.Fy, p.Fz];
        var n = m.norm(F), dc = m.dirCos(F), items = [], range = Math.max(n, 1) * 0.9;
        if (p.box) items = items.concat(compPath(F));
        if (p.mode === "sph" || p.box) { items.push({ t: "arrow", a: [0, 0, 0], b: [F[0], F[1], 0], c: "c7", dash: 1, thin: 1, label: "F_h", w: 0.8 }); }
        items.push({ t: "arrow", a: [0, 0, 0], b: F, c: "c2", label: "F", w: 1.2 });
        if (p.unit && dc) items.push({ t: "arrow", a: [0, 0, 0], b: m.sc(dc.c, n / 2), c: "c4", label: "u·|F|/2", w: 0.9 });
        if (p.arcs && dc) {
          var r = n * 0.28;
          items.push({ t: "arc", u: [1, 0, 0], v: F, r: r, c: "ax0", label: "α" }, { t: "arc", u: [0, 1, 0], v: F, r: r * 1.15, c: "ax1", label: "β" }, { t: "arc", u: [0, 0, 1], v: F, r: r * 1.3, c: "ax2", label: "γ" });
        }
        items.push({ t: "pt", p: F, c: "c2" });
        var out = "";
        if (err) out += row("⚠", err, "v3-bad");
        out += row("F = Fx i + Fy j + Fz k", vec(F) + " N", "v3-key");
        out += row("|F| = √(Fx² + Fy² + Fz²)", "√(" + F.map(function (x) { return "(" + num(x) + ")²"; }).join(" + ") + ") = <b>" + num(n) + " N</b>");
        if (dc) {
          out += row("cos α = Fx/|F|", num(F[0]) + "/" + num(n) + " = " + num(dc.c[0]) + " → α = " + deg(dc.ang[0]));
          out += row("cos β = Fy/|F|", num(F[1]) + "/" + num(n) + " = " + num(dc.c[1]) + " → β = " + deg(dc.ang[1]));
          out += row("cos γ = Fz/|F|", num(F[2]) + "/" + num(n) + " = " + num(dc.c[2]) + " → γ = " + deg(dc.ang[2]));
          out += row("ตรวจ cos²α + cos²β + cos²γ", num(dc.c[0] * dc.c[0], 4) + " + " + num(dc.c[1] * dc.c[1], 4) + " + " + num(dc.c[2] * dc.c[2], 4) + " = <b>" + num(dc.c[0] * dc.c[0] + dc.c[1] * dc.c[1] + dc.c[2] * dc.c[2], 6) + "</b>", "v3-ok");
          out += row("u_F = F/|F|", vec(dc.c, 4));
          var Fh = Math.hypot(F[0], F[1]);
          out += row("แบบสองขั้น", "F_h = |F|cos φ = " + num(Fh) + " N, φ = " + deg(Math.atan2(F[2], Fh) * R2D) + ", θ = " + deg(Math.atan2(F[1], F[0]) * R2D));
        }
        return { items: items, range: range, out: out };
      }
    },
    // ---------------------------------------------------------------- force along a line (cable)
    cable: {
      t: "แรงตามแนวสายเคเบิล: จากพิกัดสองจุดเป็นเวกเตอร์แรง",
      ctl: [P3("Ax", "A x", -6, 6, 0.5, 0, "m"), P3("Ay", "A y", -6, 6, 0.5, 0, "m"), P3("Az", "A z", -6, 6, 0.5, 0, "m"),
        P3("Bx", "B x", -6, 6, 0.5, 2, "m"), P3("By", "B y", -6, 6, 0.5, -3, "m"), P3("Bz", "B z", -6, 6, 0.5, 6, "m"), P3("F", "แรงดึง |F|", 0, 2000, 10, 840, "N")],
      f: function (p) {
        var A = [p.Ax, p.Ay, p.Az], B = [p.Bx, p.By, p.Bz], r = m.sub(B, A), L = m.norm(r), u = m.unit(r), F = m.sc(u, p.F);
        var sc = L > 0 ? Math.max(L, 1) / Math.max(p.F, 1) * 0.7 : 1;
        var items = [{ t: "line", a: A, b: B, c: "c7", thin: 1 }, { t: "pt", p: A, c: "c1", label: "A" }, { t: "pt", p: B, c: "c1", label: "B" },
          { t: "arrow", a: A, b: B, c: "c1", label: "r_AB", w: 0.9, dash: 1 }, { t: "arrow", a: A, b: m.add(A, m.sc(F, sc)), c: "c2", label: "F (ย่อสเกล)", w: 1.2 }];
        items = items.concat(compPath(r, A));
        var out = row("r_AB = B − A", vec(r) + " m", "v3-key") + row("L = |r_AB|", num(L) + " m") +
          row("u_AB = r_AB / L", vec(u, 4)) + row("F = |F| u_AB", vec(F) + " N", "v3-key") +
          row("มุมกับแกน", m.dirCos(r) ? m.dirCos(r).ang.map(function (a, i) { return "αβγ"[i] + " = " + deg(a); }).join(", ") : "—");
        return { items: items, range: Math.max(Math.abs(p.Ax), Math.abs(p.Ay), Math.abs(p.Az), Math.abs(p.Bx), Math.abs(p.By), Math.abs(p.Bz), 1), out: out };
      }
    },
    // ---------------------------------------------------------------- resultant of up to three 3D forces
    resultant3d: {
      t: "แรงลัพธ์ของแรงสามแรงในสามมิติ",
      ctl: [P3("a1", "F₁ x", -800, 800, 10, 400), P3("a2", "F₁ y", -800, 800, 10, 0), P3("a3", "F₁ z", -800, 800, 10, 300),
        P3("b1", "F₂ x", -800, 800, 10, -200), P3("b2", "F₂ y", -800, 800, 10, 500), P3("b3", "F₂ z", -800, 800, 10, 200),
        P3("c1", "F₃ x", -800, 800, 10, 100), P3("c2", "F₃ y", -800, 800, 10, -150), P3("c3", "F₃ z", -800, 800, 10, 250),
        { k: "chain", l: "ต่อหัวต่อหาง (polygon)", type: "chk", v: true }, { k: "eq", l: "แสดงแรงสมดุล −R", type: "chk", v: false }],
      f: function (p) {
        var F = [[p.a1, p.a2, p.a3], [p.b1, p.b2, p.b3], [p.c1, p.c2, p.c3]], R = m.sum(F), items = [], cols = ["c1", "c3", "c4"];
        F.forEach(function (f, i) { items.push({ t: "arrow", a: [0, 0, 0], b: f, c: cols[i], label: "F" + "₁₂₃"[i], w: 0.95 }); });
        if (p.chain) { var s = [0, 0, 0]; F.forEach(function (f, i) { if (i) items.push({ t: "arrow", a: s, b: m.add(s, f), c: cols[i], dash: 1, w: 0.75 }); s = m.add(s, f); }); }
        items.push({ t: "arrow", a: [0, 0, 0], b: R, c: "c2", label: "R", w: 1.3 });
        if (p.eq) items.push({ t: "arrow", a: [0, 0, 0], b: m.sc(R, -1), c: "c6", label: "E = −R", w: 1.1, dash: 1 });
        var n = m.norm(R), dc = m.dirCos(R);
        var out = row("ΣFx", F.map(function (f) { return num(f[0]); }).join(" + ") + " = " + num(R[0]) + " N") +
          row("ΣFy", F.map(function (f) { return num(f[1]); }).join(" + ") + " = " + num(R[1]) + " N") +
          row("ΣFz", F.map(function (f) { return num(f[2]); }).join(" + ") + " = " + num(R[2]) + " N") +
          row("R", vec(R) + " N, |R| = " + num(n) + " N", "v3-key") +
          (dc ? row("ทิศของ R", "α = " + deg(dc.ang[0]) + ", β = " + deg(dc.ang[1]) + ", γ = " + deg(dc.ang[2])) : "");
        var rng = Math.max.apply(null, F.concat([R]).map(m.norm).concat([1])) * 0.85;
        if (p.chain) rng = Math.max(rng, m.norm(m.add(F[0], F[1])) * 0.85, n * 0.85);
        return { items: items, range: rng, out: out };
      }
    },
    // ---------------------------------------------------------------- cross product and right-hand rule
    cross: {
      t: "Cross product: พื้นที่สี่เหลี่ยมด้านขนานและกฎมือขวา",
      ctl: [P3("a1", "A x", -5, 5, 0.5, 3), P3("a2", "A y", -5, 5, 0.5, 0), P3("a3", "A z", -5, 5, 0.5, 0),
        P3("b1", "B x", -5, 5, 0.5, 1), P3("b2", "B y", -5, 5, 0.5, 2), P3("b3", "B z", -5, 5, 0.5, 0),
        { k: "swap", l: "สลับลำดับเป็น B × A", type: "chk", v: false }, { k: "par", l: "แสดงสี่เหลี่ยมด้านขนาน", type: "chk", v: true }],
      f: function (p) {
        var A = [p.a1, p.a2, p.a3], B = [p.b1, p.b2, p.b3], C = p.swap ? m.cross(B, A) : m.cross(A, B), n = m.norm(C);
        var items = [];
        if (p.par) items.push({ t: "poly", pts: [[0, 0, 0], A, m.add(A, B), B], c: "c5" });
        items.push({ t: "arrow", a: [0, 0, 0], b: A, c: "c2", label: "A" }, { t: "arrow", a: [0, 0, 0], b: B, c: "c1", label: "B" },
          { t: "arrow", a: [0, 0, 0], b: C, c: "c3", label: p.swap ? "B×A" : "A×B", w: 1.2 }, { t: "arc", u: p.swap ? B : A, v: p.swap ? A : B, r: Math.min(m.norm(A), m.norm(B)) * 0.35, c: "c4", label: "θ" });
        var th = m.angle(A, B);
        var out = row(p.swap ? "B × A" : "A × B", vec(C) + (p.swap ? " = −(A × B)" : ""), "v3-key") +
          row("x: AyBz − AzBy", num(A[1]) + "·" + num(B[2]) + " − " + num(A[2]) + "·" + num(B[1]) + " = " + num(m.cross(A, B)[0])) +
          row("y: AzBx − AxBz", num(A[2]) + "·" + num(B[0]) + " − " + num(A[0]) + "·" + num(B[2]) + " = " + num(m.cross(A, B)[1])) +
          row("z: AxBy − AyBx", num(A[0]) + "·" + num(B[1]) + " − " + num(A[1]) + "·" + num(B[0]) + " = " + num(m.cross(A, B)[2])) +
          row("|A×B| = |A||B|sin θ", num(m.norm(A)) + " × " + num(m.norm(B)) + " × sin " + deg(th) + " = " + num(n) + " = พื้นที่") +
          row("ตรวจตั้งฉาก", "(A×B)·A = " + num(m.dot(C, A)) + ", (A×B)·B = " + num(m.dot(C, B)), "v3-ok");
        return { items: items, range: Math.max(m.norm(A), m.norm(B), n, 1) * 0.8, out: out };
      }
    },
    // ---------------------------------------------------------------- moment of a force about a point and about an axis
    moment: {
      t: "โมเมนต์ของแรง M = r × F และโมเมนต์รอบแกน",
      ctl: [P3("rx", "r x", -3, 3, 0.1, 0.5, "m"), P3("ry", "r y", -3, 3, 0.1, 0.8, "m"), P3("rz", "r z", -3, 3, 0.1, 0, "m"),
        P3("Fx", "F x", -500, 500, 10, 0, "N"), P3("Fy", "F y", -500, 500, 10, 0, "N"), P3("Fz", "F z", -500, 500, 10, -200, "N"),
        { k: "axis", l: "แกนที่สนใจ", type: "sel", v: "x", o: [["x", "แกน x"], ["y", "แกน y"], ["z", "แกน z"], ["d", "แนว (1,1,0)"]] }],
      f: function (p) {
        var r = [p.rx, p.ry, p.rz], F = [p.Fx, p.Fy, p.Fz], M = m.cross(r, F), ua = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], d: m.unit([1, 1, 0]) }[p.axis];
        var Ma = m.dot(ua, M), rs = Math.max(m.norm(r), 0.5), Fs = Math.max(m.norm(F), 1), Ms = Math.max(m.norm(M), 1e-9);
        var k = rs * 0.7 / Fs, km = rs * 0.8 / Ms;
        var items = [{ t: "arrow", a: [0, 0, 0], b: r, c: "c1", label: "r" }, { t: "arrow", a: r, b: m.add(r, m.sc(F, k)), c: "c2", label: "F", w: 1.2 },
          { t: "arrow", a: [0, 0, 0], b: m.sc(M, km), c: "c3", label: "M_O", w: 1.15 }, { t: "line", a: m.sc(ua, -rs * 1.4), b: m.sc(ua, rs * 1.4), c: "c4", dash: 1 },
          { t: "arrow", a: [0, 0, 0], b: m.sc(ua, Ma * km), c: "c4", label: "M_a", w: 0.9 }, { t: "pt", p: [0, 0, 0], c: "c7", label: "O" }];
        var out = row("M_O = r × F", vec(M) + " N·m", "v3-key") + row("|M_O|", num(m.norm(M)) + " N·m") +
          row("แขนโมเมนต์ d = |M|/|F|", num(m.norm(F) > 0 ? m.norm(M) / m.norm(F) : NaN) + " m") +
          row("M_a = u_a · (r × F)", vec(ua, 3) + " · " + vec(M) + " = <b>" + num(Ma) + " N·m</b>", "v3-ok") +
          row("ทิศหมุน", Ma > 1e-9 ? "บวกตามกฎมือขวารอบแกน (ทวนเข็มเมื่อมองจากปลายแกน)" : Ma < -1e-9 ? "ลบ: หมุนตามเข็มเมื่อมองจากปลายแกน" : "ไม่มีแนวโน้มหมุนรอบแกนนี้");
        return { items: items, range: rs * 1.2, out: out, note: "ลูกศร F และ M ย่อสเกลให้เห็นในภาพเดียว ใช้ตัวเลขด้านล่างเป็นค่าจริง" };
      }
    },
    // ---------------------------------------------------------------- rotation of axes in a plane
    rotate2d: {
      t: "หมุนแกนในระนาบ: องค์ประกอบเดียวกันในสองกรอบ",
      dim: 2,
      ctl: [P3("vx", "v x", -10, 10, 0.5, 6), P3("vy", "v y", -10, 10, 0.5, 4), P3("th", "มุมหมุนแกน θ", -180, 180, 1, 30, "°"),
        { k: "act", l: "มุมมอง", type: "sel", v: "pas", o: [["pas", "หมุนแกน (passive): เวกเตอร์อยู่กับที่"], ["act", "หมุนเวกเตอร์ (active): แกนอยู่กับที่"]] }],
      f: function (p) {
        var v = [p.vx, p.vy, 0], R = m.Rz(p.th), items = [], out = "";
        if (p.act === "pas") {
          var vp = m.mv(m.T(R), v), e1 = [R[0][0], R[1][0], 0], e2 = [R[0][1], R[1][1], 0];
          items = items.concat(frameItems(R, Math.max(m.norm(v), 2) * 1.15, ["x′", "y′", "z′"], true));
          items.push({ t: "line", a: v, b: m.sc(e1, vp[0]), c: "ax0", dash: 1 }, { t: "line", a: v, b: m.sc(e2, vp[1]), c: "ax1", dash: 1 },
            { t: "arrow", a: [0, 0, 0], b: v, c: "c2", label: "v", w: 1.2 }, { t: "arc", u: [1, 0, 0], v: e1, r: 1.6, c: "c4", label: "θ" });
          out = row("กรอบเดิม", "v = " + vec(v, 4, 2), "v3-key") +
            row("x′ = x cos θ + y sin θ", num(p.vx) + "·cos " + deg(p.th) + " + " + num(p.vy) + "·sin " + deg(p.th) + " = <b>" + num(vp[0]) + "</b>") +
            row("y′ = −x sin θ + y cos θ", "−" + num(p.vx) + "·sin " + deg(p.th) + " + " + num(p.vy) + "·cos " + deg(p.th) + " = <b>" + num(vp[1]) + "</b>") +
            row("ตรวจขนาดคงเดิม", "|v| = " + num(m.norm(v)) + ", |v′| = " + num(Math.hypot(vp[0], vp[1])), "v3-ok");
        } else {
          var w = m.mv(R, v);
          items.push({ t: "arrow", a: [0, 0, 0], b: v, c: "c7", label: "v", dash: 1 }, { t: "arrow", a: [0, 0, 0], b: w, c: "c2", label: "R v", w: 1.2 }, { t: "arc", u: v, v: w, r: Math.max(m.norm(v), 1) * 0.35, c: "c4", label: "θ" });
          out = row("R(θ) v", "[cos θ −sin θ; sin θ cos θ]" + vec(v, 4, 2) + " = <b>" + vec(w, 4, 2) + "</b>", "v3-key") +
            row("ข้อสังเกต", "หมุนเวกเตอร์ +θ ให้องค์ประกอบเท่ากับหมุนแกน −θ: R(θ)v = R(−θ)ᵀ v");
        }
        return { items: items, range: Math.max(m.norm(v), 2) * 1.1, out: out };
      }
    },
    // ---------------------------------------------------------------- rotation in 3D with Euler angles
    rotate3d: {
      t: "หมุนกรอบพิกัด 3 มิติ: มุมออยเลอร์ Z-Y-X และเมทริกซ์หมุน",
      ctl: [P3("yaw", "ψ yaw รอบ z", -180, 180, 1, 40, "°"), P3("pitch", "θ pitch รอบ y′", -90, 90, 1, -25, "°"), P3("roll", "φ roll รอบ x″", -180, 180, 1, 20, "°"),
        P3("vx", "v x", -5, 5, 0.5, 2), P3("vy", "v y", -5, 5, 0.5, 1), P3("vz", "v z", -5, 5, 0.5, 2)],
      f: function (p) {
        var R = m.euler(p.yaw, p.pitch, p.roll), v = [p.vx, p.vy, p.vz], vb = m.mv(m.T(R), v), L = Math.max(m.norm(v), 2) * 1.05;
        var items = frameItems(R, L, ["x′", "y′", "z′"], true).concat([{ t: "arrow", a: [0, 0, 0], b: v, c: "c2", label: "v", w: 1.2 }]);
        [0, 1, 2].forEach(function (j) { var e = [R[0][j], R[1][j], R[2][j]]; items.push({ t: "line", a: v, b: m.sc(e, vb[j]), c: "ax" + j, dash: 1, thin: 1 }); });
        var mat = function (A) { return '<span class="v3-mat">' + A.map(function (r) { return r.map(function (x) { return num(x, 4); }).join("  "); }).join("<br>") + "</span>"; };
        var out = row("R = Rz(ψ) Ry(θ) Rx(φ)", mat(R), "v3-key") +
          row("v ในกรอบโลก", vec(v)) + row("v′ = Rᵀ v (ในกรอบหมุน)", "<b>" + vec(vb) + "</b>", "v3-key") +
          row("ตรวจ det R และ RᵀR", "det R = " + num(m.det(R), 6) + " · |v′| = " + num(m.norm(vb)) + " = |v|", "v3-ok");
        return { items: items, range: L, out: out };
      }
    },
    // ---------------------------------------------------------------- 3-DOF robot arm
    arm3d: {
      t: "แขนกล 3 ข้อต่อ: ตำแหน่งปลายแขนคือผลบวกเวกเตอร์ของข้อแขน",
      ctl: [P3("q1", "q₁ ฐานหมุนรอบ z", -180, 180, 1, -35, "°"), P3("q2", "q₂ ไหล่", -90, 180, 1, 40, "°"), P3("q3", "q₃ ศอก", -170, 170, 1, -60, "°"),
        P3("h", "ความสูงฐาน h", 0, 1, 0.05, 0.4, "m"), P3("L2", "ความยาวแขนท่อนบน L₂", 0.1, 1, 0.05, 0.6, "m"), P3("L3", "ความยาวแขนท่อนล่าง L₃", 0.1, 1, 0.05, 0.5, "m"),
        { k: "frames", l: "แสดงกรอบพิกัดที่ปลายแขน", type: "chk", v: true }],
      f: function (p) {
        var J = m.arm3(p.q1, p.q2, p.q3, p.h, p.L2, p.L3), items = [], cols = ["c7", "c1", "c3"];
        for (var i = 0; i < 3; i++) items.push({ t: "arrow", a: J[i], b: J[i + 1], c: cols[i], label: ["h k", "L₂ e₂", "L₃ e₃"][i], w: 1.35, lpos: 0.55 });
        items.push({ t: "arrow", a: [0, 0, 0], b: J[3], c: "c2", label: "p", dash: 1, w: 0.9 });
        J.forEach(function (q, i) { items.push({ t: "pt", p: q, c: i === 3 ? "c2" : "c7", r: i === 3 ? 5 : 4 }); });
        items.push({ t: "line", a: [J[3][0], J[3][1], 0], b: J[3], c: "c7", dash: 1, thin: 1 }, { t: "line", a: [0, 0, 0], b: [J[3][0], J[3][1], 0], c: "c7", dash: 1, thin: 1 });
        if (p.frames) { var R = m.mm(m.Rz(p.q1), m.Ry(-(p.q2 + p.q3))); items.push({ t: "frame", R: R, len: 0.25, o: J[3], labels: ["x₃", "y₃", "z₃"] }); }
        var r = J[3], reach = Math.hypot(r[0], r[1]);
        var out = row("e₂ = (cos q₂ cos q₁, cos q₂ sin q₁, sin q₂)", vec(m.unit(m.sub(J[2], J[1])), 4)) +
          row("e₃ ทิศ q₂+q₃", vec(m.unit(m.sub(J[3], J[2])), 4)) +
          row("p = h k + L₂ e₂ + L₃ e₃", "<b>" + vec(r) + " m</b>", "v3-key") +
          row("ระยะเอื้อมแนวราบ ρ", "L₂cos q₂ + L₃cos(q₂+q₃) = " + num(reach) + " m") +
          row("ระยะจากไหล่ถึงปลายแขน", num(m.norm(m.sub(r, J[1]))) + " m (ต้องอยู่ระหว่าง |L₂−L₃| = " + num(Math.abs(p.L2 - p.L3)) + " และ L₂+L₃ = " + num(p.L2 + p.L3) + ")");
        return { items: items, range: p.h + p.L2 + p.L3, out: out };
      }
    },
    // ---------------------------------------------------------------- Lorentz force, helix in uniform B
    lorentz: {
      t: "แรงลอเรนซ์ F = q v × B และการเคลื่อนที่แบบเกลียว",
      ctl: [{ k: "q", l: "ประจุ", type: "sel", v: "1", o: [["1", "โปรตอน +e"], ["-1", "อิเล็กตรอน −e (มวล ×1/1836)"]] },
        P3("vx", "v x (×10⁵ m/s)", -5, 5, 0.1, 2), P3("vy", "v y (×10⁵ m/s)", -5, 5, 0.1, 0), P3("vz", "v z (×10⁵ m/s)", -5, 5, 0.1, 0.6),
        P3("B", "|B| ตามแกน +z", 0.01, 1, 0.01, 0.05, "T"), P3("turns", "จำนวนรอบที่วาด", 0.25, 4, 0.25, 2)],
      f: function (p) {
        var e = 1.602176634e-19, mp = 1.67262192e-27, q = +p.q * e, mass = +p.q > 0 ? mp : 9.1093837e-31;
        var v = [p.vx * 1e5, p.vy * 1e5, p.vz * 1e5], B = [0, 0, p.B], F = m.sc(m.cross(v, B), q);
        var vperp = Math.hypot(v[0], v[1]), r = mass * vperp / (Math.abs(q) * p.B), T = 2 * Math.PI * mass / (Math.abs(q) * p.B), pitch = v[2] * T;
        // exact solution for B = B k: ω = qB/m (signed), vx = v⊥cos(φ0 − ωt), vy = v⊥sin(φ0 − ωt)
        var w = q * p.B / mass, ph0 = Math.atan2(v[1], v[0]), pts = [], N = Math.round(80 * p.turns), tEnd = p.turns * T;
        for (var i = 0; i <= N; i++) {
          var t = tEnd * i / N;
          pts.push([vperp / w * (Math.sin(ph0) - Math.sin(ph0 - w * t)), vperp / w * (Math.cos(ph0 - w * t) - Math.cos(ph0)), v[2] * t]);
        }
        // shift so the helix axis passes through the origin and the drawing is centred vertically
        var sh = [-(vperp / w) * Math.sin(ph0), (vperp / w) * Math.cos(ph0), -v[2] * tEnd / 2];
        var S = Math.max(r * 2.4, Math.abs(v[2] * tEnd) * 1.1, 1e-9), k = 1.6 / S;
        var sp = pts.map(function (q2) { return m.sc(m.add(q2, sh), k); }), P0 = sp[0];
        var items = [{ t: "path", pts: sp, c: "c4" }, { t: "arrow", a: P0, b: m.add(P0, m.sc(m.unit(v), 0.5)), c: "c1", label: "v", w: 1.1 },
          { t: "pt", p: P0, c: "c2" }];
        if (m.norm(F) > 0) items.push({ t: "arrow", a: P0, b: m.add(P0, m.sc(m.unit(F), 0.4)), c: "c2", label: "F", w: 1.1 });
        [[0.85, -0.85], [-0.85, 0.85], [0.85, 0.85], [-0.85, -0.85]].forEach(function (c2, i) { items.push({ t: "arrow", a: [c2[0], c2[1], -0.7], b: [c2[0], c2[1], 0.7], c: "c3", label: i ? "" : "B", w: 0.8, thin: 1 }); });
        var out = row("F = q v × B", vec(F, 4, 3, 1e-40) + " N", "v3-key") + row("|F| = |q| v⊥ B", num(Math.abs(q), 4, 1e-40) + " × " + num(vperp) + " × " + num(p.B) + " = " + num(m.norm(F), 4, 1e-40) + " N") +
          row("รัศมี r = m v⊥ / (|q| B)", "<b>" + num(r * 1000) + " mm</b>") + row("คาบ T = 2πm/(|q|B)", num(T * 1e9) + " ns (ไม่ขึ้นกับความเร็ว)") +
          row("ระยะเกลียว p = v∥ T", num(pitch * 1000) + " mm") + row("งานของแรงแม่เหล็ก", "F·v = " + num(m.dot(F, v), 4, 1e-20) + " → แรงตั้งฉากกับความเร็วเสมอ จึงไม่เปลี่ยนอัตราเร็ว", "v3-ok");
        return { items: items, range: 1, out: out, note: "ภาพปรับสเกลอัตโนมัติ ให้อ่านขนาดจริงจากตัวเลข" };
      }
    },
    // ---------------------------------------------------------------- force on a straight wire
    wire: {
      t: "แรงบนลวดตัวนำ F = I L × B",
      ctl: [P3("I", "กระแส I", -20, 20, 0.5, 8, "A"), P3("L", "ความยาวในสนาม", 0.05, 1, 0.05, 0.3, "m"), P3("lt", "ทิศลวด: มุมในระนาบ xy", -180, 180, 5, 0, "°"),
        P3("le", "ทิศลวด: มุมเงย", -90, 90, 5, 0, "°"), P3("B", "|B|", 0, 2, 0.05, 0.5, "T"), P3("bt", "ทิศ B: มุมในระนาบ xy", -180, 180, 5, 90, "°"), P3("be", "ทิศ B: มุมเงย", -90, 90, 5, 0, "°")],
      f: function (p) {
        var Lv = m.fromSph(p.L, p.lt, p.le), Bv = m.fromSph(p.B, p.bt, p.be), F = m.sc(m.cross(Lv, Bv), p.I), uL = m.unit(Lv);
        var a = m.sc(uL, -0.5), b = m.sc(uL, 0.5), dirI = p.I >= 0 ? 1 : -1;
        var items = [{ t: "line", a: m.sc(uL, -0.7), b: m.sc(uL, 0.7), c: "c7" }, { t: "arrow", a: m.sc(a, dirI), b: m.sc(b, dirI), c: "c1", label: "I L", w: 1.1 },
          { t: "arrow", a: [0, 0, 0], b: m.sc(m.unit(Bv), 0.6), c: "c3", label: "B" }, { t: "arrow", a: [0, 0, 0], b: m.sc(m.unit(F), 0.6), c: "c2", label: "F", w: 1.25 },
          { t: "arc", u: Lv, v: Bv, r: 0.25, c: "c4", label: "θ" }];
        var th = m.angle(Lv, Bv);
        var out = row("L (ตามทิศกระแสบวก)", vec(Lv, 4) + " m") + row("B", vec(Bv, 4) + " T") + row("F = I (L × B)", "<b>" + vec(F, 4) + " N</b>", "v3-key") +
          row("|F| = |I| L B sin θ", num(Math.abs(p.I)) + "·" + num(p.L) + "·" + num(p.B) + "·sin " + deg(th) + " = " + num(m.norm(F)) + " N");
        return { items: items, range: 0.8, out: out };
      }
    },
    // ---------------------------------------------------------------- torque on a current loop (motor principle)
    loop: {
      t: "แรงบิดบนขดลวดในสนามแม่เหล็ก τ = m × B (หลักการมอเตอร์)",
      ctl: [P3("ang", "มุมของขดลวด (normal กับ B)", 0, 360, 5, 60, "°"), P3("I", "กระแส I", 0, 10, 0.5, 3, "A"), P3("N", "จำนวนรอบ N", 1, 200, 1, 50),
        P3("a", "ด้าน a (ขนานแกนหมุน)", 0.02, 0.3, 0.01, 0.1, "m"), P3("b", "ด้าน b", 0.02, 0.3, 0.01, 0.08, "m"), P3("B", "|B| ตาม +x", 0, 1, 0.01, 0.4, "T")],
      f: function (p) {
        var t = p.ang * D2R, n = [Math.cos(t), Math.sin(t) * 0, Math.sin(t)];
        // loop rotates about y axis; sides of length a lie along y, sides of length b lie along s = n × y-hat direction
        var yh = [0, 1, 0], s = m.unit(m.cross(yh, n)), ha = p.a / 2, hb = p.b / 2, S = 1 / Math.max(p.a, p.b) * 0.7;
        var C = [m.add(m.sc(s, hb), m.sc(yh, -ha)), m.add(m.sc(s, hb), m.sc(yh, ha)), m.add(m.sc(s, -hb), m.sc(yh, ha)), m.add(m.sc(s, -hb), m.sc(yh, -ha))];
        var Bv = [p.B, 0, 0], area = p.a * p.b, mvec = m.sc(n, p.N * p.I * area), tau = m.cross(mvec, Bv);
        var items = [{ t: "poly", pts: C.map(function (c) { return m.sc(c, S); }), c: "c5" }];
        for (var i = 0; i < 4; i++) {
          var A = C[i], Bp = C[(i + 1) % 4], Ls = m.sub(Bp, A), Fs = m.sc(m.cross(Ls, Bv), p.N * p.I), mid = m.sc(m.add(A, Bp), 0.5);
          items.push({ t: "arrow", a: m.sc(A, S), b: m.sc(Bp, S), c: "c1", w: 0.8, thin: 1 });
          if (m.norm(Fs) > 1e-9) items.push({ t: "arrow", a: m.sc(mid, S), b: m.add(m.sc(mid, S), m.sc(m.unit(Fs), 0.35 * Math.min(1, m.norm(Fs) / (p.N * p.I * p.a * p.B + 1e-12)))), c: "c2", label: i === 0 ? "F" : "", w: 0.9 });
        }
        [[-0.75, -0.55], [0.75, -0.55], [-0.75, 0.55], [0.75, 0.55]].forEach(function (c2, i) { items.push({ t: "arrow", a: [-0.95, c2[0], c2[1]], b: [0.95, c2[0], c2[1]], c: "c3", thin: 1, w: 0.7, label: i ? "" : "B" }); });
        items.push({ t: "arrow", a: [0, 0, 0], b: m.sc(n, 0.5), c: "c4", label: "n̂ (m)" },
          { t: "arrow", a: [0, 0, 0], b: m.sc(m.unit(tau), 0.45 * Math.min(1, m.norm(tau) / (p.N * p.I * area * p.B + 1e-12))), c: "c6", label: "τ", w: 1.1 }, { t: "line", a: [0, -0.8, 0], b: [0, 0.8, 0], c: "c7", dash: 1 });
        var out = row("m = N I A n̂", num(p.N) + "·" + num(p.I) + "·" + num(area) + " = " + num(m.norm(mvec)) + " A·m²") +
          row("τ = m × B", "<b>" + vec(tau, 4) + " N·m</b>", "v3-key") + row("|τ| = N I A B sin θ", num(m.norm(tau)) + " N·m (θ = มุมระหว่าง n̂ กับ B = " + deg(m.angle(n, Bv)) + ")") +
          row("แรงบิดสูงสุด", num(p.N * p.I * area * p.B) + " N·m เมื่อระนาบขดลวดขนานกับ B");
        return { items: items, range: 1, out: out };
      }
    },
    // ---------------------------------------------------------------- electric field of point charges in 3D
    efield3d: {
      t: "สนามไฟฟ้าลัพธ์ที่จุด P จากประจุ 3 ตัว (ซ้อนทับ)",
      ctl: [P3("q1", "q₁ ที่ (0.3, 0, 0) m", -10, 10, 0.5, 4, "μC"), P3("q2", "q₂ ที่ (0, 0.4, 0) m", -10, 10, 0.5, -3, "μC"), P3("q3", "q₃ ที่ (0, 0, 0.3) m", -10, 10, 0.5, 2, "μC"),
        P3("px", "P x", -0.5, 0.5, 0.05, 0.2, "m"), P3("py", "P y", -0.5, 0.5, 0.05, 0.2, "m"), P3("pz", "P z", -0.5, 0.5, 0.05, 0.2, "m")],
      f: function (p) {
        var Q = [[p.q1, [0.3, 0, 0]], [p.q2, [0, 0.4, 0]], [p.q3, [0, 0, 0.3]]], P = [p.px, p.py, p.pz], E = [0, 0, 0], parts = [], items = [], cols = ["c1", "c3", "c4"], ok = true;
        Q.forEach(function (c, i) {
          var r = m.sub(P, c[1]), d = m.norm(r);
          if (d < 1e-6) { ok = false; return; }
          var Ei = m.sc(r, m.k_e * c[0] * 1e-6 / (d * d * d)); parts.push([Ei, d]); E = m.add(E, Ei);
          items.push({ t: "pt", p: c[1], c: c[0] >= 0 ? "c6" : "c1", r: 6, label: "q" + "₁₂₃"[i] + (c[0] >= 0 ? "+" : "−") }, { t: "line", a: c[1], b: P, c: "c7", dash: 1, thin: 1 });
        });
        if (!ok) return { items: items, range: 0.5, out: row("⚠", "จุด P ทับตำแหน่งประจุ สนามไม่จำกัด เลื่อน P ออก", "v3-bad") };
        var big = Math.max.apply(null, parts.map(function (x) { return m.norm(x[0]); }).concat([m.norm(E), 1])), k = 0.3 / big;
        parts.forEach(function (x, i) { items.push({ t: "arrow", a: P, b: m.add(P, m.sc(x[0], k)), c: cols[i], label: "E" + "₁₂₃"[i], w: 0.8 }); });
        items.push({ t: "arrow", a: P, b: m.add(P, m.sc(E, k)), c: "c2", label: "E", w: 1.3 }, { t: "pt", p: P, c: "c2", label: "P" });
        var out = parts.map(function (x, i) { return row("E" + "₁₂₃"[i] + " = k q r̂ / r² (r = " + num(x[1]) + " m)", vec(x[0], 4) + " N/C"); }).join("") +
          row("E = E₁ + E₂ + E₃", "<b>" + vec(E, 4) + " N/C</b>", "v3-key") + row("|E|", num(m.norm(E)) + " N/C = " + num(m.norm(E) / 1000) + " kV/m");
        return { items: items, range: 0.5, out: out, note: "ลูกศรสนามย่อสเกลเท่ากันทุกตัว ความยาวจึงเปรียบเทียบกันได้" };
      }
    },
    // ---------------------------------------------------------------- flux through a tilted surface
    flux: {
      t: "ฟลักซ์ผ่านพื้นที่ Φ = B · A (เวกเตอร์พื้นที่ตั้งฉากผิว)",
      ctl: [P3("B", "|B| ตาม +z", 0, 2, 0.05, 0.8, "T"), P3("A", "พื้นที่ A", 0.01, 0.5, 0.01, 0.12, "m²"), P3("tilt", "มุมเอียงของผิว", 0, 180, 1, 40, "°")],
      f: function (p) {
        var t = p.tilt * D2R, n = [Math.sin(t), 0, Math.cos(t)], s = Math.sqrt(p.A), S = 0.9 / Math.max(s, 0.1);
        var u = [Math.cos(t), 0, -Math.sin(t)], v = [0, 1, 0], h = s / 2 * S;
        var pts = [m.add(m.sc(u, h), m.sc(v, h)), m.add(m.sc(u, -h), m.sc(v, h)), m.add(m.sc(u, -h), m.sc(v, -h)), m.add(m.sc(u, h), m.sc(v, -h))];
        var items = [{ t: "poly", pts: pts, c: "c5" }, { t: "arrow", a: [0, 0, 0], b: m.sc(n, 0.6), c: "c4", label: "A = A n̂" }, { t: "arc", u: [0, 0, 1], v: n, r: 0.3, c: "c2", label: "θ" }];
        [-0.6, 0, 0.6].forEach(function (x) { [-0.6, 0.6].forEach(function (y) { items.push({ t: "arrow", a: [x, y, -0.8], b: [x, y, 0.8], c: "c3", thin: 1, w: 0.6 }); }); });
        var Phi = p.B * p.A * Math.cos(t);
        var out = row("A n̂", vec(m.sc(n, p.A), 4) + " m²") + row("Φ = B·A = BA cos θ", num(p.B) + " × " + num(p.A) + " × cos " + deg(p.tilt) + " = <b>" + num(Phi) + " Wb</b>", "v3-key") +
          row("ข้อสังเกต", Math.abs(Math.cos(t)) < 1e-9 ? "ผิวขนานกับเส้นสนาม: ไม่มีฟลักซ์ผ่าน" : Phi < 0 ? "ฟลักซ์ติดลบ: ทิศ n̂ สวนกับ B (ขึ้นกับการเลือกทิศ n̂)" : "ฟลักซ์สูงสุดเมื่อ n̂ ขนาน B");
        return { items: items, range: 1, out: out };
      }
    }
  };

  // ---------------------------------------------------------------- generic scene widget
  function ctlInput(c, val) {
    var lab = document.createElement("label");
    lab.className = "v3-c" + (c.type === "chk" ? " v3-chk" : c.type === "sel" ? " v3-sel" : "");
    lab.dataset.k = c.k;
    if (c.type === "chk") {
      lab.innerHTML = '<input type="checkbox"' + (val ? " checked" : "") + "><span>" + esc(c.l) + "</span>";
    } else if (c.type === "sel") {
      lab.innerHTML = "<span>" + esc(c.l) + "</span><select>" + c.o.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
    } else {
      lab.innerHTML = "<span>" + esc(c.l) + (c.u ? " <i>" + esc(c.u) + "</i>" : "") + '</span><input type="range" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + val + '" aria-label="' + esc(c.l) + '"><input type="number" step="any" value="' + val + '" aria-label="' + esc(c.l) + ' (พิมพ์ค่า)">';
    }
    return lab;
  }
  function mountScene(el) {
    var key = el.getAttribute("data-scene"), S = SCENES[key];
    if (!S) { el.textContent = "ไม่พบฉาก " + key; return; }
    var p = {}, init = {};
    try { init = JSON.parse(el.getAttribute("data-p") || "{}"); } catch (_) {}
    S.ctl.forEach(function (c) { p[c.k] = init[c.k] != null ? init[c.k] : c.v; });
    var only = el.getAttribute("data-ctl"); only = only ? only.split(",") : null;
    el.innerHTML = "";
    el.classList.add("v3-ready");
    var head = document.createElement("p"); head.className = "v3-t"; head.innerHTML = "<b>" + esc(el.getAttribute("data-title") || S.t) + '</b><span class="mono">แล็บ 3 มิติ · ลากภาพเพื่อหมุน</span>';
    var body = document.createElement("div"); body.className = "v3-body";
    var fig = document.createElement("div"); fig.className = "v3-fig";
    var side = document.createElement("div"); side.className = "v3-side";
    var ctl = document.createElement("div"); ctl.className = "v3-ctls";
    var out = document.createElement("div"); out.className = "v3-out"; out.setAttribute("aria-live", "polite");
    var note = document.createElement("p"); note.className = "v3-note";
    el.append(head, body); body.append(fig, side); side.append(ctl, out, note);
    var dim = +(el.getAttribute("data-dim") || S.dim || 3);
    var view = new View(fig, { dim: dim, h: +(el.getAttribute("data-h") || 420), aria: S.t });
    toolbar(view, fig);
    S.ctl.forEach(function (c) { if (!only || only.indexOf(c.k) >= 0) ctl.appendChild(ctlInput(c, p[c.k])); });
    function vis() { if (!S.show) return; var on = S.show(p); ctl.querySelectorAll(".v3-c").forEach(function (l) { var k = l.dataset.k, isNum = !l.classList.contains("v3-chk") && !l.classList.contains("v3-sel"); if (isNum || k === "gs") l.hidden = on.indexOf(k) < 0; }); }
    var compact = el.hasAttribute("data-compact");
    if (compact) { el.classList.add("v3-compact"); out.hidden = true; }
    function run() {
      vis();
      var r;
      try { r = S.f(p); } catch (e) { out.innerHTML = row("⚠", esc(e.message), "v3-bad"); return; }
      view.set(r.items, r.range);
      out.innerHTML = r.out || "";
      note.textContent = r.note || ""; note.hidden = !r.note || compact;
    }
    ctl.addEventListener("input", function (e) {
      var lab = e.target.closest(".v3-c"); if (!lab) return;
      var k = lab.dataset.k, t = e.target;
      if (t.type === "checkbox") p[k] = t.checked;
      else if (t.tagName === "SELECT") p[k] = t.value;
      else {
        var v = parseFloat(t.value); if (!isFinite(v)) return;
        p[k] = v;
        var other = lab.querySelector(t.type === "range" ? 'input[type="number"]' : 'input[type="range"]'); if (other && other !== t) other.value = v;
      }
      run();
    });
    run();
    el._v3 = { view: view, p: p, run: run };
  }

  // =========================================================================== Vector Studio
  var PRESETS = {
    basic: { n: "เวกเตอร์ 3 ตัวพื้นฐาน", v: [["A", [3, 4, 0]], ["B", [-2, 1, 3]], ["C", [1, -3, 2]]] },
    cables: { n: "แรงจากสายเคเบิล 3 เส้น (N)", v: [["F₁", [-300, 400, 1200]], ["F₂", [600, 200, 900]], ["F₃", [-150, -500, 600]]], unit: "N" },
    dircos: { n: "ทิศทางโคไซน์ F = (300, 400, 500) N", v: [["F", [300, 400, 500]]], unit: "N", opt: { ang: true, comp: true } },
    cross: { n: "Cross product · แรงบิด r × F", v: [["r", [0.4, 0, 0]], ["F", [0, 30, 40]]], opt: { cross: true } },
    basis: { n: "เวกเตอร์ฐาน i j k และ (1,1,1)", v: [["i", [1, 0, 0]], ["j", [0, 1, 0]], ["k", [0, 0, 1]], ["d", [1, 1, 1]]], opt: { ang: true } },
    equil: { n: "สมดุล: แรงสามแรงรวมเป็นศูนย์", v: [["T₁", [-200, 150, 300]], ["T₂", [250, 100, 300]], ["W", [-50, -250, -600]]], unit: "N", opt: { chain: true } },
    efield: { n: "สนามไฟฟ้า: E₁ + E₂ ที่จุดหนึ่ง", v: [["E₁", [3.6, 0, 0]], ["E₂", [-1.2, 2.4, 1.0]]], unit: "kN/C" },
    phasor: { n: "เฟสเซอร์เป็นเวกเตอร์ 2 มิติ (Re, Im)", v: [["V_R", [120, 0, 0]], ["V_L", [0, 160, 0]], ["V_C", [0, -70, 0]]], unit: "V", dim: 2, opt: { chain: true } }
  };
  var COLORS = ["c2", "c1", "c3", "c4", "c5", "c6", "c7"];

  function mountStudio(el) {
    var st = { vecs: [], dim: 3, sel: 0, sel2: 1, opt: { res: true, chain: false, comp: false, ang: false, proj: false, cross: false, frame: false }, eu: [0, 0, 0], unit: "" };
    function load(name) {
      var pr = PRESETS[name] || PRESETS.basic;
      st.preset = PRESETS[name] ? name : "basic";
      st.vecs = pr.v.map(function (x, i) { return { n: x[0], v: x[1].slice(), on: true, c: COLORS[i % COLORS.length] }; });
      st.dim = pr.dim || 3; st.unit = pr.unit || ""; st.sel = 0; st.sel2 = Math.min(1, st.vecs.length - 1);
      st.opt = { res: true, chain: false, comp: false, ang: false, proj: false, cross: false, frame: false };
      Object.keys(pr.opt || {}).forEach(function (k) { st.opt[k] = pr.opt[k]; });
      st.eu = [0, 0, 0];
    }
    load(el.getAttribute("data-preset") || "basic");
    var useHash = el.hasAttribute("data-hash");
    if (useHash && /#studio=/.test(location.hash)) {
      try {
        var s = JSON.parse(decodeURIComponent(escape(atob(location.hash.split("#studio=")[1]))));
        if (s && s.vecs && s.vecs.length) { st.vecs = s.vecs.slice(0, 8); st.dim = s.dim === 2 ? 2 : 3; st.opt = Object.assign(st.opt, s.opt || {}); st.eu = s.eu || [0, 0, 0]; st.unit = s.unit || ""; }
      } catch (_) {}
    }
    el.innerHTML = "";
    el.classList.add("v3-ready");
    el.innerHTML =
      '<div class="vs-head"><div><p class="eyebrow">// Vector Studio · 2D / 3D</p><h3>สตูดิโอเวกเตอร์: วาด หมุน วิเคราะห์ และส่งออก</h3></div>' +
      '<div class="vs-pre"><label>ตัวอย่าง <select class="vs-preset">' + Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">' + esc(PRESETS[k].n) + "</option>"; }).join("") + '</select></label>' +
      '<div class="vs-dim" role="group" aria-label="จำนวนมิติ"><button type="button" data-dim="2">2D</button><button type="button" data-dim="3">3D</button></div></div></div>' +
      '<div class="vs-body"><div class="vs-fig"></div><div class="vs-side">' +
      '<div class="vs-list"></div><div class="vs-add"><button type="button" class="btn btn-ghost btn-sm" data-act="add">+ เพิ่มเวกเตอร์</button><button type="button" class="btn btn-ghost btn-sm" data-act="ab">+ จากจุด A ไป B</button><label class="vs-unit">หน่วย <input type="text" maxlength="8" value=""></label></div>' +
      '<div class="vs-abf" hidden><label>จุด A <input type="text" class="vs-pa" value="0, 0, 0"></label><label>จุด B <input type="text" class="vs-pb" value="2, -3, 6"></label><button type="button" class="btn btn-primary btn-sm" data-act="abok">สร้าง B − A</button><button type="button" class="btn btn-ghost btn-sm" data-act="abno">ยกเลิก</button></div>' +
      '<fieldset class="vs-opts"><legend>แสดงบนภาพ</legend>' +
      [["res", "ผลรวม R (ตัวที่เลือก ✓)"], ["chain", "ต่อหัวต่อหาง"], ["comp", "กล่ององค์ประกอบของตัวที่ ★"], ["ang", "มุม α β γ ของตัวที่ ★"], ["proj", "ฉาย ★ ลงบน ☆"], ["cross", "★ × ☆ และพื้นที่"], ["frame", "กรอบหมุน x′y′z′ (มุมออยเลอร์)"]]
        .map(function (o) { return '<label><input type="checkbox" data-opt="' + o[0] + '"> ' + o[1] + "</label>"; }).join("") +
      '<div class="vs-eu" hidden>' + ["ψ yaw (z)", "θ pitch (y′)", "φ roll (x″)"].map(function (l, i) { return '<label>' + l + ' <input type="range" min="-180" max="180" step="1" value="0" data-eu="' + i + '"><output>0°</output></label>'; }).join("") + "</div></fieldset>" +
      "</div></div>" +
      '<div class="vs-tabs" role="tablist">' + [["sum", "สรุปเวกเตอร์"], ["res", "แรงลัพธ์ทีละขั้น"], ["pair", "มุม · Dot · Cross"], ["frame", "กรอบหมุน"], ["export", "ส่งออก GeoGebra · MATLAB · Python"]]
        .map(function (t, i) { return '<button type="button" role="tab" aria-selected="' + (i ? "false" : "true") + '" data-tab="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div class="vs-panel" role="tabpanel" aria-live="polite"></div>';
    var $ = function (s) { return el.querySelector(s); };
    var view = new View($(".vs-fig"), { dim: st.dim, h: 460, aria: "สตูดิโอเวกเตอร์ ลากเพื่อหมุน" });
    var bar = toolbar(view, $(".vs-fig"));
    var tab = "sum";
    function unitStr() { return st.unit ? " " + st.unit : ""; }
    function active() { return st.vecs.filter(function (v) { return v.on; }); }
    function listHtml() {
      return st.vecs.map(function (v, i) {
        return '<div class="vs-row" data-i="' + i + '"><span class="vs-sw ' + v.c + '"></span>' +
          '<input class="vs-n" value="' + esc(v.n) + '" aria-label="ชื่อเวกเตอร์" maxlength="6">' +
          v.v.slice(0, st.dim).map(function (x, j) { return '<input class="vs-x" type="number" step="any" data-j="' + j + '" value="' + x + '" aria-label="' + esc(v.n) + " " + "xyz"[j] + '">'; }).join("") +
          '<label class="vs-on" title="รวมในผลรวม R"><input type="checkbox"' + (v.on ? " checked" : "") + '> ✓</label>' +
          '<button type="button" class="vs-star' + (st.sel === i ? " on" : "") + '" title="ตัวหลัก ★" data-act="sel">★</button>' +
          '<button type="button" class="vs-star' + (st.sel2 === i ? " on" : "") + '" title="ตัวที่สอง ☆" data-act="sel2">☆</button>' +
          '<button type="button" class="vs-del" title="ลบ" data-act="del" aria-label="ลบ ' + esc(v.n) + '">×</button></div>';
      }).join("");
    }
    function buildList() { $(".vs-list").innerHTML = listHtml(); }
    function syncOpts() {
      el.querySelectorAll("[data-opt]").forEach(function (c) { c.checked = !!st.opt[c.dataset.opt]; });
      $(".vs-eu").hidden = !st.opt.frame;
      el.querySelectorAll("[data-eu]").forEach(function (r, i) { r.value = st.eu[i]; r.nextElementSibling.textContent = st.eu[i] + "°"; });
      el.querySelectorAll(".vs-dim button").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.dim === st.dim ? "true" : "false"); });
      if (st.preset) $(".vs-preset").value = st.preset;
      $(".vs-unit input").value = st.unit;
    }
    function V(i) { var v = st.vecs[i]; return v ? (st.dim === 2 ? [v.v[0], v.v[1], 0] : v.v.slice()) : null; }
    function draw() {
      var items = [], A = active(), R = [0, 0, 0], sA = V(st.sel), sB = V(st.sel2), rng = 1;
      st.vecs.forEach(function (v, i) { var x = V(i); rng = Math.max(rng, m.norm(x)); items.push({ t: "arrow", a: [0, 0, 0], b: x, c: v.c, label: v.n, w: st.sel === i ? 1.2 : 1, dash: !v.on }); });
      A.forEach(function (v) { R = m.add(R, st.dim === 2 ? [v.v[0], v.v[1], 0] : v.v); });
      if (st.opt.chain) { var s = [0, 0, 0]; A.forEach(function (v, k) { var x = st.dim === 2 ? [v.v[0], v.v[1], 0] : v.v; if (k) items.push({ t: "arrow", a: s, b: m.add(s, x), c: v.c, dash: 1, w: 0.75 }); s = m.add(s, x); rng = Math.max(rng, m.norm(s)); }); }
      if (st.opt.res && A.length > 1) { items.push({ t: "arrow", a: [0, 0, 0], b: R, c: "c6", label: "R", w: 1.35 }); rng = Math.max(rng, m.norm(R)); }
      if (sA && st.opt.comp) items = items.concat(compPath(sA));
      if (sA && st.opt.ang && m.norm(sA) > 0) { var r = m.norm(sA) * 0.3; items.push({ t: "arc", u: [1, 0, 0], v: sA, r: r, c: "ax0", label: "α" }, { t: "arc", u: [0, 1, 0], v: sA, r: r * 1.15, c: "ax1", label: "β" }); if (st.dim === 3) items.push({ t: "arc", u: [0, 0, 1], v: sA, r: r * 1.3, c: "ax2", label: "γ" }); }
      if (sA && sB && st.opt.proj && m.norm(sB) > 0 && st.sel !== st.sel2) { var pr = m.sc(sB, m.dot(sA, sB) / m.dot(sB, sB)); items.push({ t: "arrow", a: [0, 0, 0], b: pr, c: "c4", label: "proj", w: 1.1 }, { t: "line", a: sA, b: pr, c: "c7", dash: 1 }); }
      if (sA && sB && st.opt.cross && st.sel !== st.sel2) { var cx = m.cross(sA, sB); items.push({ t: "poly", pts: [[0, 0, 0], sA, m.add(sA, sB), sB], c: "c5" }); if (st.dim === 3) { items.push({ t: "arrow", a: [0, 0, 0], b: cx, c: "c3", label: "★×☆", w: 1.15 }); rng = Math.max(rng, m.norm(cx)); } }
      if (st.opt.frame) { var Rm = st.dim === 2 ? m.Rz(st.eu[0]) : m.euler(st.eu[0], st.eu[1], st.eu[2]); items.push({ t: "frame", R: Rm, len: rng * 0.9, dash: true }); }
      view.dim = st.dim; view.set(items, rng * 0.85);
      panel();
      if (useHash) { try { history.replaceState(null, "", "#studio=" + btoa(unescape(encodeURIComponent(JSON.stringify({ vecs: st.vecs, dim: st.dim, opt: st.opt, eu: st.eu, unit: st.unit }))))); } catch (_) {} }
    }
    function panel() {
      var P = $(".vs-panel"), A = active(), d = st.dim, u = unitStr(), h = "";
      if (tab === "sum") {
        h = '<div class="table-wrap"><table class="vs-t"><thead><tr><th>เวกเตอร์</th><th>องค์ประกอบ</th><th>ขนาด</th><th>เวกเตอร์หนึ่งหน่วย</th><th>' + (d === 3 ? "α, β, γ" : "มุมจาก +x") + "</th></tr></thead><tbody>" +
          st.vecs.map(function (v, i) {
            var x = V(i), n = m.norm(x), dc = m.dirCos(x);
            return "<tr><td><span class=\"vs-sw " + v.c + "\"></span>" + esc(v.n) + "</td><td>" + vec(x, 4, d) + u + "</td><td>" + num(n) + u + "</td><td>" + (dc ? vec(dc.c, 4, d) : "—") + "</td><td>" +
              (!dc ? "—" : d === 3 ? dc.ang.map(deg).join(", ") : deg(Math.atan2(x[1], x[0]) * R2D)) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      } else if (tab === "res") {
        var R = [0, 0, 0]; A.forEach(function (v) { R = m.add(R, v.v); }); if (d === 2) R[2] = 0;
        h = "<div class=\"v3-out\">" + ["x", "y", "z"].slice(0, d).map(function (a, j) { return row("ΣF" + a, A.map(function (v) { return num(v.v[j]); }).join(" + ") + " = <b>" + num(R[j]) + "</b>" + u); }).join("") +
          row("R", vec(R, 4, d) + u, "v3-key") + row("|R| = √(" + (d === 3 ? "Rx² + Ry² + Rz²" : "Rx² + Ry²") + ")", num(m.norm(R)) + u) +
          (m.norm(R) > 0 ? (d === 3 ? row("ทิศ R", m.dirCos(R).ang.map(function (a, j) { return "αβγ"[j] + " = " + deg(a); }).join(", ")) : row("ทิศ R", "θ = atan2(Ry, Rx) = " + deg(Math.atan2(R[1], R[0]) * R2D))) : row("สมดุล", "R = 0 ระบบแรงอยู่ในสมดุลของแรง (ยังต้องตรวจโมเมนต์ถ้าแรงไม่ผ่านจุดเดียวกัน)", "v3-ok")) +
          (A.length === 2 ? row("ตรวจด้วยกฎของโคไซน์", "|R|² = |A|² + |B|² + 2|A||B|cos θ = " + num(Math.pow(m.norm(V(st.vecs.indexOf(A[0]))), 2) + Math.pow(m.norm(V(st.vecs.indexOf(A[1]))), 2) + 2 * m.dot(V(st.vecs.indexOf(A[0])), V(st.vecs.indexOf(A[1])))) + " → |R| = " + num(m.norm(R)), "v3-ok") : "") +
          "</div>";
      } else if (tab === "pair") {
        var a = V(st.sel), b = V(st.sel2), na = st.vecs[st.sel] ? st.vecs[st.sel].n : "?", nb = st.vecs[st.sel2] ? st.vecs[st.sel2].n : "?";
        if (!a || !b) h = "<p>เลือกตัวหลัก ★ และตัวที่สอง ☆ ในรายการ</p>";
        else {
          var dt = m.dot(a, b), cx = m.cross(a, b), th = m.angle(a, b);
          h = '<div class="v3-out">' + row(na + " · " + nb, "Σ ผลคูณองค์ประกอบ = <b>" + num(dt) + "</b>") +
            row("มุม θ = arccos(dot/(|a||b|))", isFinite(th) ? deg(th) + (Math.abs(dt) < 1e-9 ? " (ตั้งฉาก)" : "") : "ไม่กำหนด (มีเวกเตอร์ศูนย์)") +
            row("scalar projection ของ " + na + " บน " + nb, m.norm(b) > 0 ? num(dt / m.norm(b)) + u : "—") +
            row("vector projection", m.norm(b) > 0 ? vec(m.sc(b, dt / m.dot(b, b)), 4, d) + u : "—") +
            row(na + " × " + nb, (d === 2 ? "แกน z: " + num(cx[2]) : vec(cx)) + " · พื้นที่สี่เหลี่ยมด้านขนาน = " + num(m.norm(cx)), "v3-key") +
            (st.vecs.length >= 3 && d === 3 ? row("Triple product (ตัวที่ 1,2,3)", "A·(B×C) = " + num(m.dot(V(0), m.cross(V(1), V(2)))) + " = ปริมาตรทรงสี่เหลี่ยมด้านขนาน (มีเครื่องหมาย)") : "") +
            "</div>" + '<div class="table-wrap"><table class="vs-t"><caption>มุมระหว่างทุกคู่ (องศา)</caption><thead><tr><th></th>' + st.vecs.map(function (v) { return "<th>" + esc(v.n) + "</th>"; }).join("") + "</tr></thead><tbody>" +
            st.vecs.map(function (v, i) { return "<tr><th>" + esc(v.n) + "</th>" + st.vecs.map(function (w, j) { return "<td>" + (i === j ? "·" : num(m.angle(V(i), V(j)), 4)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
        }
      } else if (tab === "frame") {
        var Rm = d === 2 ? m.Rz(st.eu[0]) : m.euler(st.eu[0], st.eu[1], st.eu[2]), RT = m.T(Rm);
        h = '<div class="v3-out">' + row("R", '<span class="v3-mat">' + Rm.map(function (r) { return r.map(function (x) { return num(x, 4); }).join("  "); }).join("<br>") + "</span>", "v3-key") +
          (st.opt.frame ? "" : row("เปิดกรอบหมุน", "ติ๊ก “กรอบหมุน x′y′z′” แล้วปรับมุม ψ θ φ เพื่อดูองค์ประกอบในกรอบใหม่")) +
          st.vecs.map(function (v, i) { return row(esc(v.n) + "′ = Rᵀ " + esc(v.n), vec(m.mv(RT, V(i)), 4, d) + u + " (|·| = " + num(m.norm(V(i))) + ")"); }).join("") + "</div>";
      } else {
        var S = st.vecs.map(function (v, i) { return [v.n.replace(/[^A-Za-z0-9_]/g, "") || "v" + (i + 1), V(i)]; });
        var gg = S.map(function (x) { return x[0] + " = Vector((" + x[1].slice(0, d).join(", ") + "))"; }).join("\n");
        var ml = "% MATLAB / Octave\nV = [" + S.map(function (x) { return x[1].slice(0, 3).join(" "); }).join("; ") + "];\nO = zeros(size(V));\nquiver3(O(:,1),O(:,2),O(:,3),V(:,1),V(:,2),V(:,3),0,'LineWidth',2); axis equal; grid on\nxlabel('x'); ylabel('y'); zlabel('z')\nR = sum(V,1)   % resultant\nnorm(R)";
        var py = "# Python: NumPy + Matplotlib\nimport numpy as np\nimport matplotlib.pyplot as plt\nV = np.array([" + S.map(function (x) { return "[" + x[1].join(", ") + "]"; }).join(", ") + "], dtype=float)\nR = V.sum(axis=0); print('R =', R, '|R| =', np.linalg.norm(R))\nax = plt.figure().add_subplot(projection='3d')\nax.quiver(0, 0, 0, V[:,0], V[:,1], V[:,2])\nax.quiver(0, 0, 0, *R, color='r')\nlim = np.abs(np.vstack([V, R])).max()\nax.set(xlim=(-lim, lim), ylim=(-lim, lim), zlim=(-lim, lim), xlabel='x', ylabel='y', zlabel='z')\nplt.show()";
        var csv = "name,x,y,z\n" + S.map(function (x) { return x[0] + "," + x[1].join(","); }).join("\n");
        var box = function (t, l, href) { return '<div class="vs-ex"><div class="vs-ex-h"><b>' + l + '</b><span>' + (href ? '<a href="' + href + '" target="_blank" rel="noopener">เปิดเครื่องมือ ↗</a>' : "") + '<button type="button" class="vs-copy">คัดลอก</button></span></div><pre>' + esc(t) + "</pre></div>"; };
        h = '<p class="vs-exp">คัดลอกคำสั่งไปวางในเครื่องมือระดับโลกเพื่อวาดและตรวจคำตอบซ้ำ: GeoGebra 3D (พิมพ์ทีละบรรทัดในช่อง Input), MATLAB/Octave และ Python</p>' +
          box(gg, "GeoGebra 3D Calculator", "https://www.geogebra.org/3d") + box(ml, "MATLAB / GNU Octave", "https://octave-online.net/") + box(py, "Python (NumPy + Matplotlib)", "https://colab.research.google.com/") + box(csv, "CSV (Excel / Google Sheets)") +
          (useHash ? '<p class="vs-exp">ลิงก์ของหน้านี้เก็บเวกเตอร์ทั้งหมดไว้แล้ว คัดลอกจากแถบที่อยู่เพื่อแชร์ให้เพื่อนเปิดชุดเดียวกัน</p>' : "");
      }
      P.innerHTML = h;
    }
    el.addEventListener("input", function (e) {
      var t = e.target, rowEl = t.closest(".vs-row");
      if (rowEl) {
        var i = +rowEl.dataset.i, v = st.vecs[i];
        if (t.classList.contains("vs-n")) v.n = t.value || "v";
        else if (t.classList.contains("vs-x")) { var x = parseFloat(t.value); if (!isFinite(x)) return; v.v[+t.dataset.j] = Math.max(-1e6, Math.min(1e6, x)); }
        else if (t.type === "checkbox") v.on = t.checked;
        draw(); return;
      }
      if (t.dataset.opt) { st.opt[t.dataset.opt] = t.checked; $(".vs-eu").hidden = !st.opt.frame; draw(); return; }
      if (t.dataset.eu) { st.eu[+t.dataset.eu] = +t.value; t.nextElementSibling.textContent = t.value + "°"; draw(); return; }
      if (t.closest(".vs-unit")) { st.unit = t.value.trim(); panel(); return; }
    });
    el.addEventListener("change", function (e) {
      if (e.target.classList.contains("vs-preset")) { load(e.target.value); view.dim = st.dim; buildList(); syncOpts(); rebuildBar(); view.setView(st.dim === 2 ? "xy" : "iso"); draw(); }
    });
    function rebuildBar() { var nb = toolbar(view, $(".vs-fig")); bar.replaceWith(nb); bar = nb; }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.dim) { st.dim = +b.dataset.dim; view.dim = st.dim; buildList(); syncOpts(); rebuildBar(); view.setView(st.dim === 2 ? "xy" : "iso"); draw(); return; }
      if (b.dataset.tab) { tab = b.dataset.tab; el.querySelectorAll(".vs-tabs button").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); }); panel(); return; }
      if (b.classList.contains("vs-copy")) { var pre = b.closest(".vs-ex").querySelector("pre"); if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(function () { b.textContent = "คัดลอกแล้ว ✓"; setTimeout(function () { b.textContent = "คัดลอก"; }, 1500); }); return; }
      var a = b.dataset.act, rowEl = b.closest(".vs-row");
      if (a === "add" && st.vecs.length < 8) { st.vecs.push({ n: "v" + (st.vecs.length + 1), v: [1, 1, st.dim === 3 ? 1 : 0], on: true, c: COLORS[st.vecs.length % COLORS.length] }); buildList(); draw(); }
      else if (a === "ab") { $(".vs-abf").hidden = false; $(".vs-pa").focus(); }
      else if (a === "abno") $(".vs-abf").hidden = true;
      else if (a === "abok" && st.vecs.length < 8) {
        var rd = function (s) { var q = s.split(/[,\s]+/).filter(Boolean).map(parseFloat); return [q[0], q[1], q[2] || 0]; };
        var A3 = rd($(".vs-pa").value), B3 = rd($(".vs-pb").value);
        if (A3.concat(B3).every(isFinite)) { st.vecs.push({ n: "AB", v: m.sub(B3, A3), on: true, c: COLORS[st.vecs.length % COLORS.length] }); $(".vs-abf").hidden = true; buildList(); draw(); }
        else $(".vs-pb").setAttribute("aria-invalid", "true");
      }
      else if (rowEl) {
        var i = +rowEl.dataset.i;
        if (a === "del" && st.vecs.length > 1) { st.vecs.splice(i, 1); st.sel = Math.min(st.sel, st.vecs.length - 1); st.sel2 = Math.min(st.sel2, st.vecs.length - 1); }
        if (a === "sel") st.sel = i;
        if (a === "sel2") st.sel2 = i;
        buildList(); draw();
      }
    });
    buildList(); syncOpts(); view.setView(st.dim === 2 ? "xy" : "iso"); draw();
  }

  root.Vec3D = { m: m, num: num, SCENES: SCENES, View: View, mountScene: mountScene, mountStudio: mountStudio, PRESETS: PRESETS };
  if (typeof module === "object" && module.exports) module.exports = root.Vec3D;
  if (typeof document === "undefined") return;
  // click-to-load embeds of external tools: <div class="ext-embed" data-src="URL" data-title="…"><div class="ext-facade">… <button class="ext-go">…</button></div></div>
  function embeds() {
    document.querySelectorAll(".ext-embed[data-src]").forEach(function (box) {
      var b = box.querySelector(".ext-go"); if (!b || b._on) return; b._on = true;
      b.addEventListener("click", function () {
        var f = document.createElement("iframe");
        f.src = box.getAttribute("data-src"); f.title = box.getAttribute("data-title") || "เครื่องมือภายนอก";
        f.setAttribute("allow", "fullscreen"); f.allowFullscreen = true; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
        var fac = box.querySelector(".ext-facade"); if (fac) fac.replaceWith(f); box.classList.add("on");
      });
    });
  }
  function init() {
    embeds();
    document.querySelectorAll(".v3d[data-scene]").forEach(function (el) { if (!el._v3) mountScene(el); });
    document.querySelectorAll(".v3d-studio").forEach(function (el) { if (!el.classList.contains("v3-ready")) mountStudio(el); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
