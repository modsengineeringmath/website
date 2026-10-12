/* PID lab: time-domain simulation of a PID loop around a typed plant (with dead time, actuator limits,
   derivative filter, derivative-on-measurement, anti-windup, load disturbance).
   Markup: <div class="pid-lab" data-plant="1/(s+1)^3" data-kp="1" data-ki="0.5" data-kd="0.5" data-tend="25"
               data-presets='[{"n":"…","plant":"…","kp":1,"ki":0,"kd":0,"tend":20}]'></div>
   Needs cs-core.js and cs-ui.js. */
(function () {
  "use strict";
  var CS = window.CS;
  if (!CS || !CS.ui) return;
  var U = CS.ui, fmt = CS.fmt, f1 = U.f1;

  function Pid(root) {
    this.root = root;
    var d = root.dataset, self = this;
    this.presets = [];
    try { if (d.presets) this.presets = JSON.parse(d.presets); } catch (e) {}
    this.plant = d.plant || "1/(s+1)^3";
    this.g = { kp: +(d.kp || 1), ki: +(d.ki || 0), kd: +(d.kd || 0), N: +(d.n || 10) };
    this.tend = +(d.tend || 0);
    this.opt = { dist: d.dist !== "false", sat: false, umax: +(d.umax || 3), aw: true, dom: true };
    this.ghost = null;
    var sl = function (k, lab, max) {
      return '<label class="sl"><span class="mono">' + lab + '</span><input type="range" data-g="' + k + '" min="0" max="1000" step="1" aria-label="' + lab + '"><output data-o="' + k + '"></output></label>';
    };
    var h = '<div class="cs-bar"><label class="cs-f cs-f-tf"><span class="mono">G(s) =</span><input class="cs-tf pid-plant" type="text" spellcheck="false" autocomplete="off" aria-label="ฟังก์ชันถ่ายโอนของพลานต์"></label>';
    if (this.presets.length) h += '<label class="cs-f"><span class="mono">พลานต์</span><select class="cs-pre pid-pre">' + this.presets.map(function (p, i) { return '<option value="' + i + '">' + U.esc(p.n) + "</option>"; }).join("") + "</select></label>";
    h += "</div>";
    h += '<div class="pid-grid"><div class="pid-sliders">' + sl("kp", "K<sub>P</sub>") + sl("ki", "K<sub>I</sub>") + sl("kd", "K<sub>D</sub>") + sl("N", "N") + "</div>";
    h += '<div class="pid-opts"><div class="cs-bar">' +
      '<button type="button" class="cs-btn" data-mode="P">P</button><button type="button" class="cs-btn" data-mode="PI">PI</button><button type="button" class="cs-btn" data-mode="PD">PD</button><button type="button" class="cs-btn" data-mode="PID">PID</button>' +
      '<button type="button" class="cs-btn" data-act="pin">ปักกราฟไว้เทียบ</button></div><div class="cs-bar">' +
      '<label class="cs-f"><input type="checkbox" data-o2="dist"> รบกวนที่โหลดครึ่งทาง</label>' +
      '<label class="cs-f"><input type="checkbox" data-o2="dom"> D จากเอาต์พุต (ไม่กระตุกตอนเปลี่ยน r)</label>' +
      '<label class="cs-f"><input type="checkbox" data-o2="sat"> จำกัด |u| ≤ <input class="cs-kn pid-umax" type="number" step="any" min="0.01" style="width:70px"></label>' +
      '<label class="cs-f"><input type="checkbox" data-o2="aw"> anti-windup</label></div>' +
      '<p class="pid-cs mono"></p></div></div>';
    h += '<div class="cs-err" role="alert" hidden></div>';
    h += '<figure class="cs-plot"><figcaption class="mono">เอาต์พุต y(t) ต่อค่าอ้างอิงขั้นบันได r = 1</figcaption><svg class="cs-svg" data-v="y" viewBox="0 0 560 280" role="img" aria-label="ผลตอบสนอง y(t)"></svg></figure>';
    h += '<figure class="cs-plot"><figcaption class="mono">สัญญาณควบคุม u(t)</figcaption><svg class="cs-svg" data-v="u" viewBox="0 0 560 170" role="img" aria-label="สัญญาณควบคุม u(t)"></svg></figure>';
    h += '<div class="cs-read"></div>';
    root.innerHTML = h;
    root.classList.add("cs-ready");
    this.q = function (s) { return root.querySelector(s); };
    this.inp = this.q(".pid-plant"); this.err = this.q(".cs-err"); this.read = this.q(".cs-read");
    this.inp.value = this.plant;
    this.q(".pid-umax").value = this.opt.umax;
    root.querySelectorAll("[data-o2]").forEach(function (c) { c.checked = !!self.opt[c.dataset.o2]; });
    var pre = this.q(".pid-pre");
    if (pre) pre.addEventListener("change", function () { self.load(self.presets[+pre.value]); });
    this.inp.addEventListener("change", function () { self.setPlant(self.inp.value); });
    root.addEventListener("input", function (e) {
      var k = e.target.dataset.g;
      if (k) { self.g[k] = self.fromS(k, +e.target.value); self.sim(); }
    });
    root.addEventListener("change", function (e) {
      var o = e.target.dataset.o2;
      if (o) { self.opt[o] = e.target.checked; self.sim(); }
      if (e.target.classList.contains("pid-umax")) { var v = parseFloat(e.target.value); if (v > 0) { self.opt.umax = v; self.sim(); } }
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.mode) {
        var m = b.dataset.mode, g = self.base || self.g;
        if (m.indexOf("I") < 0) self.g.ki = 0; else if (!self.g.ki) self.g.ki = g.ki || self.g.kp / 2 || 0.5;
        if (m.indexOf("D") < 0) self.g.kd = 0; else if (!self.g.kd) self.g.kd = g.kd || self.g.kp / 4 || 0.25;
        self.syncS(); self.sim();
      } else if (b.dataset.act === "pin") { self.ghost = self.last ? { y: self.last.y, u: self.last.u, t: self.last.t, lab: self.cText() } : null; self.sim(); }
    });
    if (this.presets.length && !d.plant) this.load(this.presets[0]); else { this.setPlant(this.plant, true); this.syncS(); this.sim(); }
  }
  // log-scaled sliders: 0 → off, 1..1000 → 10^-3 .. 10^2 (N: 1..100)
  Pid.prototype.fromS = function (k, v) {
    if (k === "N") return Math.round(1 + 99 * Math.pow(v / 1000, 2));
    if (v <= 0) return 0;
    var hi = this.range[k] || 100, lo = hi / 1e4;
    return +(lo * Math.pow(hi / lo, v / 1000)).toPrecision(3);
  };
  Pid.prototype.toS = function (k, x) {
    if (k === "N") return Math.sqrt((x - 1) / 99) * 1000;
    if (!x) return 0;
    var hi = this.range[k] || 100, lo = hi / 1e4;
    return Math.max(1, Math.min(1000, Math.log(x / lo) / Math.log(hi / lo) * 1000));
  };
  Pid.prototype.syncS = function () {
    var self = this;
    ["kp", "ki", "kd", "N"].forEach(function (k) { var el = self.q('[data-g="' + k + '"]'); el.value = self.toS(k, self.g[k]); });
  };
  Pid.prototype.load = function (p) {
    this.g = { kp: p.kp != null ? p.kp : 1, ki: p.ki || 0, kd: p.kd || 0, N: p.N || 10 };
    this.base = { kp: this.g.kp, ki: this.g.ki, kd: this.g.kd };
    this.tend = p.tend || 0;
    if (p.umax) { this.opt.umax = p.umax; this.q(".pid-umax").value = p.umax; }
    this.ghost = null;
    this.inp.value = p.plant;
    this.setPlant(p.plant, true);
    this.syncS(); this.sim();
  };
  Pid.prototype.setPlant = function (txt, quiet) {
    var tf;
    try { tf = CS.parseTF(txt, { K: 1 }); } catch (e) { this.err.hidden = false; this.err.textContent = "อ่านพลานต์ไม่ได้: " + e.message; return; }
    if (tf.N.length > tf.D.length) { this.err.hidden = false; this.err.textContent = "พลานต์ต้อง proper (ดีกรีตัวเศษไม่เกินตัวส่วน)"; return; }
    this.err.hidden = true;
    this.tf = tf;
    // slider ranges scale with the plant's low-frequency gain
    var pz = CS.pzk(tf), maxw = 0.1;
    pz.p.concat(pz.z).forEach(function (r) { maxw = Math.max(maxw, CS.cabs(r)); });
    var lf = CS.lowFreq(tf), kb = Math.abs(lf.Kb) || 1;
    var kpr = Math.pow(10, Math.ceil(Math.log10(Math.max(20 / kb, 1))));
    this.range = { kp: kpr, ki: kpr * Math.max(1, maxw), kd: kpr / Math.max(0.1, Math.min(10, maxw)) * 2 };
    if (!this.tend) {
      var slow = Infinity;
      pz.p.forEach(function (r) { if (Math.abs(r.re) > 1e-6) slow = Math.min(slow, Math.abs(r.re)); });
      this.autoT = Math.max(isFinite(slow) ? 8 / slow : 20, (tf.delay || 0) * 12, 4);
    }
    if (!quiet) { this.syncS(); this.sim(); }
  };
  Pid.prototype.cText = function () {
    var g = this.g, p = [];
    if (g.kp) p.push(fmt(g.kp, 3));
    if (g.ki) p.push(fmt(g.ki, 3) + "/s");
    if (g.kd) p.push(fmt(g.kd, 3) + "s");
    return "C(s) = " + (p.join(" + ") || "0");
  };
  Pid.prototype.sim = function () {
    if (!this.tf) return;
    var self = this, g = this.g, o = this.opt;
    ["kp", "ki", "kd", "N"].forEach(function (k) { var el = self.q('[data-o="' + k + '"]'); el.textContent = k === "N" ? g.N : fmt(g[k], 3); });
    var T = this.tend || this.autoT, n = 2400, dt = T / n;
    var ss;
    try { ss = CS.toSS(this.tf.N, this.tf.D); } catch (e) { return; }
    var pz = CS.pzk(this.tf), maxw = 0;
    pz.p.forEach(function (r) { maxw = Math.max(maxw, CS.cabs(r)); });
    var sub = Math.max(1, Math.ceil(dt * maxw / 0.3)), h = dt / sub;
    var sd = CS.discretise(ss, h);
    var nd = Math.round((this.tf.delay || 0) / h), buf = new Array(Math.max(1, nd)).fill(0), bi = 0, udPrev = 0;
    var x = new Array(sd.n).fill(0), I = 0, D = 0, mPrev = 0, ePrev = 0;
    var Td = g.kp > 0 ? g.kd / g.kp : g.kd, Tf = g.kd > 0 ? Math.max(Td / Math.max(1, g.N), h) : 0;
    var t = [], y = [], u = [], yk = 0, uk = 0, dStep = o.dist ? 0.5 * T : Infinity, dist = 0;
    var r = 1, iae = 0, kb = Math.abs(CS.lowFreq(this.tf).Kb) || 1, dMag = 0.5 / kb;
    for (var k = 0; k <= n * sub; k++) {
      var tk = k * h;
      // measure
      yk = sd.Dd * udPrev;
      for (var j = 0; j < sd.n; j++) yk += sd.C[j] * x[j];
      var e = r - yk;
      // derivative (filtered), on measurement or on error
      var m = o.dom ? -yk : e;
      if (k === 0) mPrev = o.dom ? m : 0; // no derivative kick at t=0 when measuring y
      if (g.kd > 0) D = (Tf * D + g.kd * (m - mPrev)) / (Tf + h); else D = 0;
      mPrev = m;
      var v = g.kp * e + I + D;
      var us = o.sat ? Math.max(-o.umax, Math.min(o.umax, v)) : v;
      // integrator with clamping anti-windup
      var windup = o.sat && o.aw && us !== v && Math.sign(e) === Math.sign(v);
      if (!windup) I += g.ki * e * h;
      if (k % sub === 0) { t.push(tk); y.push(yk); u.push(us); }
      iae += Math.abs(e) * h;
      // plant input = u + load disturbance at mid-time, scaled to 0.5/|G(0)| (same size as half the reference)
      dist = tk >= dStep ? -dMag : 0;
      var uin = us + dist;
      // push through dead time (ring buffer of nd samples)
      var ud;
      if (nd === 0) ud = uin; else { ud = buf[bi]; buf[bi] = uin; bi = (bi + 1) % nd; }
      udPrev = ud;
      var xn = new Array(sd.n).fill(0);
      for (var i = 0; i < sd.n; i++) { var s = sd.Bd[i] * ud; for (j = 0; j < sd.n; j++) s += sd.Ad[i][j] * x[j]; xn[i] = s; }
      x = xn;
      if (!isFinite(yk) || Math.abs(yk) > 1e6) break;
    }
    this.last = { t: t, y: y, u: u };
    this.draw(t, y, u, T, dStep);
    // metrics on the setpoint part (before the disturbance)
    var cut = o.dist ? Math.floor(t.length / 2) : t.length;
    var ty = t.slice(0, cut), yy = y.slice(0, cut), info = this.metrics(ty, yy);
    var cl = this.closedPoles();
    var html = '<div class="cs-rd"><span class="mono">ตัวควบคุม</span><b>' + U.esc(this.cText()) + "</b></div>";
    html += '<div class="cs-rd"><span class="mono">วงปิด</span>' + (cl.rhp ? '<b class="cs-bad">ไม่เสถียร</b>' : '<b class="cs-ok">เสถียร</b>') + (this.tf.delay ? ' <i class="mono" style="font-size:.7rem">(Padé)</i>' : "") + "</div>";
    if (!cl.rhp) {
      html += '<div class="cs-rd"><span class="mono">Mp</span><b>' + (isFinite(info.Mp) ? fmt(info.Mp, 1) + "%" : "–") + '</b></div><div class="cs-rd"><span class="mono">tr</span><b>' + (isFinite(info.tr) ? fmt(info.tr, 3) : "–") + '</b></div><div class="cs-rd"><span class="mono">ts (2%)</span><b>' + (isFinite(info.ts) ? fmt(info.ts, 3) : "> ช่วงที่ดู") + "</b></div>";
      html += '<div class="cs-rd"><span class="mono">e ก่อนรบกวน</span><b>' + fmt(1 - yy[yy.length - 1], 3) + "</b></div>";
      if (o.dist) html += '<div class="cs-rd"><span class="mono">e ท้ายสุด</span><b>' + fmt(1 - y[y.length - 1], 3) + "</b></div>";
      html += '<div class="cs-rd"><span class="mono">max |u|</span><b>' + fmt(Math.max.apply(null, u.map(Math.abs)), 3) + '</b></div><div class="cs-rd"><span class="mono">IAE</span><b>' + fmt(iae, 3) + "</b></div>";
    }
    this.read.innerHTML = html;
    this.q(".pid-cs").textContent = this.cText() + (g.kd && g.N ? " · ฟิลเตอร์ D: Tf = Td/N = " + fmt(Tf, 3) + " s" : "");
  };
  Pid.prototype.metrics = function (t, y) {
    var info = { Mp: NaN, tr: NaN, ts: NaN }, ys = 1;
    var ymax = Math.max.apply(null, y);
    info.Mp = Math.max(0, (ymax - ys) * 100);
    var t1 = null, t2 = null;
    for (var i = 1; i < y.length; i++) {
      if (t1 === null && y[i] >= 0.1) t1 = t[i];
      if (t2 === null && y[i] >= 0.9) { t2 = t[i]; break; }
    }
    if (t1 !== null && t2 !== null) info.tr = t2 - t1;
    var last = -1;
    for (i = 0; i < y.length; i++) if (Math.abs(y[i] - ys) > 0.02) last = i;
    if (last < y.length - 3) info.ts = t[last + 1];
    return info;
  };
  Pid.prototype.closedPoles = function () {
    var g = this.g, tf = CS.withDelay(this.tf);
    // C(s) = (Kd s^2 + Kp s + Ki)/s  (filter ignored for the stability check)
    var Cn = CS.trim([g.kd, g.kp, g.ki]), Cd = [1, 0];
    if (!g.ki && !g.kd) { Cn = [g.kp]; Cd = [1]; }
    var D = CS.padd(CS.pmul(Cd, tf.D), CS.pmul(Cn, tf.N));
    var rs = CS.roots(CS.trim(D));
    return { rhp: rs.filter(function (r) { return r.re > 1e-6; }).length, roots: rs };
  };
  Pid.prototype.draw = function (t, y, u, T, dStep) {
    var gh = this.ghost;
    var sv = this.q('svg[data-v="y"]'), su = this.q('svg[data-v="u"]');
    function plot(svg, H, data, ghost, ref, label) {
      var lim = ref ? 8 : 1e6, all = data.concat(ghost || []).filter(isFinite).map(function (v) { return Math.max(-lim, Math.min(lim, v)); });
      var lo = Math.min(0, Math.min.apply(null, all)), hi = Math.max(ref ? 1.2 : 0.1, Math.max.apply(null, all));
      var ya = lo - 0.05 * (hi - lo), yb = hi + 0.08 * (hi - lo), yt = U.ticks(ya, yb, 5);
      var F = new U.Frame(560, H, { l: 40, t: 10, r: 12, b: 24 }, 0, T, ya, yb, false);
      var o = "<defs>" + F.clip(svg.dataset.v + "c" + Math.random().toString(36).slice(2, 6)) + "</defs>" + F.box(), g = "", lab = "";
      var tx = U.ticks(0, T, 8);
      tx.t.forEach(function (v) { g += "M" + f1(F.X(v)) + " " + F.m.t + "V" + (F.m.t + F.ph); lab += '<text class="cs-tk" x="' + f1(F.X(v)) + '" y="' + (F.m.t + F.ph + 15) + '" text-anchor="middle">' + U.tickLabel(v, tx.st) + "</text>"; });
      yt.t.forEach(function (v) { g += "M" + F.m.l + " " + f1(F.Y(v)) + "H" + (F.m.l + F.pw); lab += '<text class="cs-tk" x="' + (F.m.l - 5) + '" y="' + f1(F.Y(v) + 4) + '" text-anchor="end">' + U.tickLabel(v, yt.st) + "</text>"; });
      o += '<path class="cs-gr" d="' + g + '"/>' + lab;
      if (ref) o += '<path class="cs-zero" d="M' + F.m.l + " " + f1(F.Y(1)) + "H" + (F.m.l + F.pw) + '"/><path class="cs-band" d="M' + F.m.l + " " + f1(F.Y(1.02)) + "H" + (F.m.l + F.pw) + "V" + f1(F.Y(0.98)) + "H" + F.m.l + 'z"/>';
      if (isFinite(dStep)) o += '<path class="cs-mk2" d="M' + f1(F.X(dStep)) + " " + F.m.t + "V" + (F.m.t + F.ph) + '"/><text class="cs-tk" x="' + f1(F.X(dStep) + 4) + '" y="' + (F.m.t + 12) + '">รบกวน</text>';
      var clip = function (a) { return a.map(function (v, i) { return [t[i], Math.max(yt.t[0] - 1, Math.min(yt.t[yt.t.length - 1] + 1, v))]; }); };
      if (ghost) o += '<path class="cs-cv" style="stroke:var(--ink-3);stroke-dasharray:5 4;stroke-width:1.8" d="' + U.pathFrom(F, clip(ghost), true) + '"/>';
      o += '<path class="cs-cv" style="stroke:var(' + (ref ? "--b1" : "--b2") + ')" d="' + U.pathFrom(F, clip(data), true) + '"/>';
      o += '<text class="cs-ax-t" x="' + (F.m.l + 6) + '" y="' + (F.m.t + 13) + '">' + label + "</text>";
      svg.innerHTML = o;
    }
    plot(sv, 280, y, gh && gh.y.length === y.length ? gh.y : null, true, "y(t)" + (gh ? "  ― ปัจจุบัน · ┄ " + U.esc(gh.lab) : ""));
    plot(su, 170, u, gh && gh.u.length === u.length ? gh.u : null, false, "u(t)");
  };

  function init() { var els = document.querySelectorAll(".pid-lab"); for (var i = 0; i < els.length; i++) { try { new Pid(els[i]); } catch (e) { els[i].textContent = "โหลดแล็บไม่สำเร็จ: " + e.message; if (window.console) console.error(e); } } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  CS.Pid = Pid;
})();
