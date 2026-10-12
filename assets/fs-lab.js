/* Fourier & harmonic lab (/learn/fourier-series/) — needs fs-core.js (and sigexpr.js for typed waveforms).
   <div class="fs-lab" data-tabs="synth,circuit,power" data-tab="synth" data-preset="square"></div>
   Options: data-compact (lesson embed: fewer panels), data-waves="square,pulse" (limit the waveform list),
            data-open="steps" (open the step-by-step panel), data-full-link (adds "open in the full lab").
   Any page can link /learn/fourier-series/analyzer-lab/#lab=<state> or #preset=<name>;
   <button data-fs-preset="<name>"> loads a preset into the first lab on the page. */
(function () {
  "use strict";
  var F = window.FSCore;
  if (!F) return;
  var PI = Math.PI, TAU = 2 * PI, D2R = PI / 180, SQ2 = Math.SQRT2, SQ3 = Math.sqrt(3);
  var NS = "http://www.w3.org/2000/svg";
  var LAB_URL = "/learn/fourier-series/analyzer-lab/";

  // ======================================================================= formatting
  var PFX = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
  function si(v, unit, dig) {
    if (!isFinite(v)) return "—";
    if (v === 0) return "0 " + (unit || "");
    var a = Math.abs(v), d = dig || 3;
    for (var i = 0; i < PFX.length; i++) if (a >= PFX[i][0] * 0.9995) return sig(v / PFX[i][0], d) + " " + PFX[i][1] + (unit || "");
    return sig(v / 1e-12, d) + " p" + (unit || "");
  }
  function sig(v, d) {
    if (v === 0) return "0";
    var a = Math.abs(v), p = Math.max(0, d - 1 - Math.floor(Math.log10(a)));
    return v.toFixed(Math.min(p, 6));
  }
  function fx(v, d) { if (!isFinite(v)) return "—"; if (Math.abs(v) < 0.5 * Math.pow(10, -d)) v = 0; return v.toFixed(d); }
  function pc(v, d) { return isFinite(v) ? fx(v * 100, d == null ? 1 : d) + " %" : "—"; }
  function deg(r) { var d = r / D2R; d = ((d + 180) % 360 + 360) % 360 - 180; return fx(d, 1) + "°"; }
  function parseSI(s) {
    var m = String(s).trim().replace(/,/g, "").replace(/μ/g, "u").replace(/µ/g, "u").match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*([pnumkKMG]?)/);
    if (!m) return NaN;
    var k = { p: 1e-12, n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 }[m[2]] || 1;
    return parseFloat(m[1]) * k;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function sub(s) { return s.replace(/_\{([^}]*)\}/g, "<sub>$1</sub>").replace(/_(\w)/g, "<sub>$1</sub>").replace(/\^\{([^}]*)\}/g, "<sup>$1</sup>").replace(/\^(\w)/g, "<sup>$1</sup>"); }

  // ======================================================================= DOM / SVG helpers
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "cls") e.className = attrs[k]; else if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function s(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pathD(pts) {
    var d = "";
    for (var i = 0; i < pts.length; i++) d += (i ? "L" : "M") + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1);
    return d;
  }
  var uid = 0;
  /* chart size in px of its figure, so 1 viewBox unit = 1 css px and labels stay readable */
  function boxW(svg) { var p = svg && svg.parentNode, w = p ? p.clientWidth - 18 : 640; return Math.max(300, Math.min(900, w || 640)); }
  function boxH(W, compact) { return Math.round(Math.max(190, Math.min(compact ? 250 : 290, W * 0.5))); }

  /* light chart: y range, x range, ticks; returns mapper */
  function Chart(svg, W, Hh, o) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + W + " " + Hh);
    var L = o.padL || 46, R = o.padR || 12, T = o.padT || 12, B = o.padB || 26;
    var x0 = o.x0, x1 = o.x1, y0 = o.y0, y1 = o.y1;
    var X = function (x) { return L + (x - x0) / (x1 - x0) * (W - L - R); };
    var Y = function (y) { return T + (1 - (y - y0) / (y1 - y0)) * (Hh - T - B); };
    s("rect", { x: L, y: T, width: W - L - R, height: Hh - T - B, "class": "fsl-box" }, svg);
    (o.yt || []).forEach(function (t) {
      s("line", { x1: L, x2: W - R, y1: Y(t[0]), y2: Y(t[0]), "class": t[2] ? "fsl-zero" : "fsl-gr" }, svg);
      var tx = s("text", { x: L - 6, y: Y(t[0]) + 3.5, "class": "fsl-tk", "text-anchor": "end" }, svg); tx.textContent = t[1];
    });
    (o.xt || []).forEach(function (t) {
      if (!t[2]) s("line", { x1: X(t[0]), x2: X(t[0]), y1: T, y2: Hh - B, "class": "fsl-gr" }, svg);
      var tx = s("text", { x: X(t[0]), y: Hh - B + 15, "class": "fsl-tk", "text-anchor": "middle" }, svg); tx.textContent = t[1];
    });
    if (o.xlab) { var xl = s("text", { x: W - R, y: Hh - 3, "class": "fsl-axl", "text-anchor": "end" }, svg); xl.textContent = o.xlab; }
    if (o.ylab) { var yl = s("text", { x: 4, y: T - 2, "class": "fsl-axl" }, svg); yl.textContent = o.ylab; }
    var clipId = "fsc" + (++uid);
    var cp = s("clipPath", { id: clipId }, s("defs", {}, svg));
    s("rect", { x: L, y: T - 1, width: W - L - R, height: Hh - T - B + 2 }, cp);
    var g = s("g", { "clip-path": "url(#" + clipId + ")" }, svg);
    return {
      X: X, Y: Y, g: g, svg: svg, L: L, R: R, T: T, B: B, W: W, H: Hh,
      line: function (pts, cls) { return s("path", { d: pathD(pts.map(function (p) { return [X(p[0]), Y(Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), p[1])))]; })), "class": cls }, g); },
      bar: function (x, w, ya, yb, cls, title) {
        var r = s("rect", { x: X(x - w / 2), y: Math.min(Y(ya), Y(yb)), width: Math.max(1, X(x + w / 2) - X(x - w / 2)), height: Math.max(0.5, Math.abs(Y(ya) - Y(yb))), "class": cls }, g);
        if (title) { var t = s("title", {}, r); t.textContent = title; }
        return r;
      },
      text: function (x, y, str, cls, anchor) { var t = s("text", { x: X(x), y: Y(y), "class": cls || "fsl-tk", "text-anchor": anchor || "middle" }, svg); t.textContent = str; return t; }
    };
  }
  function niceStep(span, n) {
    var raw = span / (n || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }
  function ticks(a, b, n, fmt) {
    var st = niceStep(b - a, n), out = [], t = Math.ceil(a / st - 1e-9) * st;
    for (; t <= b + st * 1e-6; t += st) out.push([t, fmt ? fmt(t) : sig(t, 3).replace(/\.0+$/, ""), Math.abs(t) < st * 1e-6]);
    return out;
  }
  function range(arrs, pad) {
    var lo = Infinity, hi = -Infinity;
    arrs.forEach(function (a) { for (var i = 0; i < a.length; i++) { var v = a[i][1] !== undefined ? a[i][1] : a[i]; if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } } });
    if (!isFinite(lo)) { lo = -1; hi = 1; }
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    var p = (hi - lo) * (pad || 0.08);
    return [lo - p, hi + p];
  }

  // ======================================================================= parameters, presets
  var PMETA = {
    A: { l: "แอมพลิจูด A", min: 0.1, max: 10, step: 0.1 },
    D: { l: "ดิวตี้ D", min: 0.01, max: 0.99, step: 0.01 },
    alpha: { l: "มุม α (องศา)", min: 0, max: 89, step: 1 },
    ma: { l: "ดัชนีมอดูเลชัน mₐ", min: 0, max: 1.5, step: 0.01 },
    mf: { l: "อัตราส่วนความถี่ m_f", min: 3, max: 45, step: 1 },
    uni: { l: "ยูนิโพลาร์ (เต็มบริดจ์)", bool: true },
    tr: { l: "เวลาขาขึ้น tᵣ/T", min: 0.001, max: 0.1, step: 0.001 },
    up: { l: "ระดับตัดยอดบน", min: 0.05, max: 1, step: 0.01 },
    lo: { l: "ระดับตัดยอดล่าง", min: 0.05, max: 1, step: 0.01 }
  };
  var WLIST = ["square", "pulse", "triangle", "sawtooth", "halfwave", "fullwave", "quasi", "sixstep", "spwm", "trapezoid", "phasecut", "clipped", "sine", "custom"];
  var CIRC_WAVES = ["square", "pulse", "triangle", "sawtooth", "halfwave", "fullwave", "quasi", "sixstep", "spwm", "trapezoid", "sine"];

  /* state defaults */
  function defState() {
    return {
      tab: "synth",
      // synth
      w: "square", p: {}, N: 7, comp: 1, orig: 1, sigma: 0, err: 0, hide: 0, sunit: "amp", expr: "t < 0.3 ? 1 : 0",
      // circuit
      cw: "square", cp: { A: 5 }, cf: 1000, ck: "rc-lp", cR: "1k", cL: "10m", cC: "100n", cN: 25, cac: 0, cdb: 0,
      // power
      sys: 1, f: 50, load: "smps", P: 300, pf: 0.8, al: 90, C: 220, Ldc: 0, scr: 500, xr: 2, react: 0, cap: "none", Qc: 0,
      af: 0, afe: 0.9, v5: 0, damp: 50, std: "ieee", ch: "I", unit: "pct", lpct: 100, math: 0, fund: 1, spec: "1:100, 3:80@180, 5:60, 7:40@180"
    };
  }
  var PRESETS = {
    // ---- synth
    "square": { tab: "synth", w: "square", N: 7 },
    "square-gibbs": { tab: "synth", w: "square", N: 99, comp: 0 },
    "pulse": { tab: "synth", w: "pulse", p: { D: 0.25 }, N: 15, sunit: "amp" },
    "pulse-10": { tab: "synth", w: "pulse", p: { D: 0.1 }, N: 40 },
    "triangle": { tab: "synth", w: "triangle", N: 5 },
    "sawtooth": { tab: "synth", w: "sawtooth", N: 10 },
    "halfwave": { tab: "synth", w: "halfwave", N: 6 },
    "fullwave": { tab: "synth", w: "fullwave", N: 8 },
    "quasi-30": { tab: "synth", w: "quasi", p: { alpha: 30 }, N: 25 },
    "quasi-18": { tab: "synth", w: "quasi", p: { alpha: 18 }, N: 25 },
    "sixstep": { tab: "synth", w: "sixstep", N: 25 },
    "spwm": { tab: "synth", w: "spwm", p: { ma: 0.8, mf: 15 }, N: 99, comp: 0, sunit: "pct" },
    "spwm-uni": { tab: "synth", w: "spwm", p: { ma: 0.8, mf: 15, uni: 1 }, N: 99, comp: 0, sunit: "pct" },
    "trapezoid": { tab: "synth", w: "trapezoid", p: { D: 0.5, tr: 0.02 }, N: 99, comp: 0, sunit: "db" },
    "phasecut": { tab: "synth", w: "phasecut", p: { alpha: 90 }, N: 15 },
    "clip-sym": { tab: "synth", w: "clipped", p: { up: 0.7, lo: 0.7 }, N: 15, sunit: "pct" },
    "clip-asym": { tab: "synth", w: "clipped", p: { up: 0.6, lo: 1 }, N: 15, sunit: "pct" },
    "custom": { tab: "synth", w: "custom", expr: "t < 0.3 ? 1 : 0", N: 20 },
    // ---- circuit
    "rc-square": { tab: "circuit", cw: "square", cp: { A: 5 }, cf: 1000, ck: "rc-lp", cR: "1k", cC: "100n", cN: 25 },
    "rc-hp-square": { tab: "circuit", cw: "square", cp: { A: 5 }, cf: 1000, ck: "rc-hp", cR: "1k", cC: "100n", cN: 25 },
    "rl-inverter": { tab: "circuit", cw: "square", cp: { A: 311 }, cf: 50, ck: "rl-i", cR: "10", cL: "100m", cN: 25 },
    "rl-sixstep": { tab: "circuit", cw: "sixstep", cp: { A: 540 }, cf: 50, ck: "rl-i", cR: "5", cL: "50m", cN: 49 },
    "lc-buck": { tab: "circuit", cw: "pulse", cp: { A: 12, D: 0.4167 }, cf: 50000, ck: "lc-lp", cL: "100u", cC: "100u", cR: "2.5", cN: 25, cac: 1, cdb: 1 },
    "rlc-third": { tab: "circuit", cw: "square", cp: { A: 5 }, cf: 1000, ck: "rlc-bp", cR: "10", cL: "10m", cC: "281.4n", cN: 15 },
    "fullwave-lc": { tab: "circuit", cw: "fullwave", cp: { A: 325.3 }, cf: 50, ck: "lc-lp", cL: "100m", cC: "1000u", cR: "50", cN: 20, cac: 1 },
    "spwm-lc": { tab: "circuit", cw: "spwm", cp: { A: 400, ma: 0.8, mf: 21, uni: 1 }, cf: 50, ck: "lc-lp", cL: "3m", cC: "20u", cR: "20", cN: 99 },
    // ---- power
    "heater": { tab: "power", load: "R", P: 2000, scr: 300 },
    "motor": { tab: "power", load: "RL", P: 3000, pf: 0.75, scr: 200 },
    "smps": { tab: "power", load: "smps", P: 300, C: 220, scr: 500 },
    "led": { tab: "power", load: "smps", P: 20, C: 10, scr: 3000 },
    "neutral": { tab: "power", load: "smps", P: 3000, C: 2200, scr: 100, ch: "I" },
    "triac": { tab: "power", load: "triac", P: 1000, al: 90, scr: 500 },
    "bridge-l": { tab: "power", load: "bridgeL", P: 2000, scr: 200 },
    "pfc": { tab: "power", load: "pfc", P: 300, scr: 500 },
    "six": { tab: "power", sys: 3, load: "six", P: 30000, al: 0, scr: 50, xr: 4 },
    "six-alpha": { tab: "power", sys: 3, load: "six", P: 30000, al: 45, scr: 50, xr: 4 },
    "twelve": { tab: "power", sys: 3, load: "twelve", P: 30000, al: 0, scr: 50, xr: 4 },
    "vfd": { tab: "power", sys: 3, load: "vfd", P: 11000, C: 1000, scr: 100, xr: 4 },
    "vfd-reactor": { tab: "power", sys: 3, load: "vfd", P: 11000, C: 1000, scr: 100, xr: 4, react: 3 },
    "vfd-choke": { tab: "power", sys: 3, load: "vfd", P: 11000, C: 1000, scr: 100, xr: 4, Ldc: 2 },
    "cap-resonance": { tab: "power", sys: 3, load: "six", P: 100000, al: 45, scr: 25, xr: 6, cap: "plain", Qc: 100, ch: "I" },
    "detuned": { tab: "power", sys: 3, load: "six", P: 100000, al: 45, scr: 25, xr: 6, cap: "det7", Qc: 100 },
    "tuned-filter": { tab: "power", sys: 3, load: "six", P: 100000, al: 45, scr: 25, xr: 6, cap: "tuned", Qc: 100 },
    "active-filter": { tab: "power", sys: 3, load: "vfd", P: 11000, C: 1000, scr: 100, xr: 4, af: 1, afe: 0.9 },
    "flat-top": { tab: "power", load: "R", P: 2000, scr: 300, v5: 4 },
    "custom-spec": { tab: "power", load: "custom", P: 1000, scr: 300, spec: "1:100, 3:80@180, 5:60, 7:40@180" }
  };

  /* compact URL state: only the keys that differ from the defaults */
  function encodeState(st) {
    var d = defState(), out = [];
    Object.keys(st).forEach(function (k) {
      var v = st[k];
      if (k === "p" || k === "cp") { var ps = Object.keys(v).map(function (q) { return q + ":" + v[q]; }).join(","); if (ps) out.push(k + "=" + encodeURIComponent(ps)); return; }
      if (v !== d[k]) out.push(k + "=" + encodeURIComponent(v));
    });
    return out.join("&");
  }
  function decodeState(str) {
    var st = defState();
    str.split("&").forEach(function (kv) {
      var i = kv.indexOf("="); if (i < 0) return;
      var k = kv.slice(0, i), v = decodeURIComponent(kv.slice(i + 1));
      if (!(k in st)) return;
      if (k === "p" || k === "cp") { var o = {}; v.split(",").forEach(function (q) { var j = q.indexOf(":"); if (j > 0) o[q.slice(0, j)] = +q.slice(j + 1); }); st[k] = o; return; }
      st[k] = typeof st[k] === "number" ? +v : v;
    });
    return st;
  }
  function applyPreset(name) {
    var pr = PRESETS[name], st = defState();
    if (!pr) return st;
    for (var k in pr) st[k] = (k === "p" || k === "cp") ? Object.assign({}, pr[k]) : pr[k];
    return st;
  }

  // ======================================================================= lab component
  function Lab(root) {
    var self = this;
    this.root = root;
    this.compact = root.hasAttribute("data-compact");
    this.tabs = (root.getAttribute("data-tabs") || "synth,circuit,power").split(",").map(function (x) { return x.trim(); });
    this.waves = root.getAttribute("data-waves") ? root.getAttribute("data-waves").split(",") : WLIST;
    var hash = root.hasAttribute("data-hash") ? location.hash : "";
    var st = applyPreset(root.getAttribute("data-preset") || (this.tabs[0] === "power" ? "smps" : this.tabs[0] === "circuit" ? "rc-square" : "square"));
    if (root.getAttribute("data-tab")) st.tab = root.getAttribute("data-tab");
    if (hash) {
      var m = /[#&]lab=([^#]*)/.exec(hash), m2 = /[#&]preset=([\w-]+)/.exec(hash);
      if (m) st = decodeState(m[1]); else if (m2 && PRESETS[m2[1]]) st = applyPreset(m2[1]);
    }
    if (this.tabs.indexOf(st.tab) < 0) st.tab = this.tabs[0];
    this.st = st;
    root.innerHTML = "";
    root.classList.add("fsl-ready");
    this.build();
    this.render();
    window.addEventListener("resize", function () { self.render(); });
  }

  Lab.prototype.build = function () {
    var self = this, st = this.st, root = this.root;
    var TABN = { synth: "① ฟูเรียร์: สังเคราะห์ & วิเคราะห์", circuit: "② วงจร: ทีละฮาร์มอนิก", power: "③ สโคป + เครื่องวิเคราะห์กำลัง" };
    var bar = h("div", { cls: "fsl-bar" });
    if (this.tabs.length > 1) {
      var tb = h("div", { cls: "fsl-tabs", role: "tablist" });
      this.tabs.forEach(function (t) {
        var b = h("button", { type: "button", role: "tab", "data-t": t, "aria-selected": String(st.tab === t) }, TABN[t]);
        b.addEventListener("click", function () { self.st.tab = t; self.syncTabs(); self.render(); });
        tb.appendChild(b);
      });
      bar.appendChild(tb);
    }
    var tools = h("div", { cls: "fsl-tools" });
    var pre = h("select", { cls: "fsl-pre", "aria-label": "เลือกการทดลองสำเร็จรูป" });
    this.preSel = pre;
    tools.appendChild(pre);
    var share = h("button", { type: "button", cls: "fsl-btn" }, "🔗 คัดลอกลิงก์");
    share.addEventListener("click", function () {
      var url = location.origin + LAB_URL + "#lab=" + encodeState(self.st);
      var done = function () { share.textContent = "✓ คัดลอกแล้ว"; setTimeout(function () { share.textContent = "🔗 คัดลอกลิงก์"; }, 1600); };
      try { navigator.clipboard.writeText(url).then(done, function () { prompt("คัดลอกลิงก์นี้", url); }); } catch (e) { prompt("คัดลอกลิงก์นี้", url); }
    });
    tools.appendChild(share);
    if (root.hasAttribute("data-full-link")) {
      var open = h("a", { cls: "fsl-btn fsl-open", href: LAB_URL }, "เปิดแล็บเต็ม ↗");
      open.addEventListener("click", function () { open.href = LAB_URL + "#lab=" + encodeState(self.st); });
      tools.appendChild(open);
    }
    bar.appendChild(tools);
    root.appendChild(bar);
    this.panes = {};
    var builders = { synth: this.buildSynth, circuit: this.buildCircuit, power: this.buildPower };
    this.tabs.forEach(function (t) { var p = h("div", { cls: "fsl-pane fsl-" + t, role: "tabpanel" }); root.appendChild(p); self.panes[t] = p; builders[t].call(self, p); });
    this.fillPresets();
    pre.addEventListener("change", function () { if (!pre.value) return; self.load(pre.value); });
    this.syncTabs();
  };

  Lab.prototype.fillPresets = function () {
    var names = {
      synth: [["square", "คลื่นสี่เหลี่ยม: ฮาร์มอนิกคี่ 1/n"], ["square-gibbs", "ปรากฏการณ์กิบส์ (N = 99)"], ["pulse", "พัลส์ดิวตี้ 25 %: เอนเวโลป sinc"], ["pulse-10", "พัลส์แคบ 10 %"], ["triangle", "สามเหลี่ยม: ลดลงเร็ว 1/n²"], ["sawtooth", "ฟันเลื่อย: มีทุกฮาร์มอนิก"], ["halfwave", "เรียงกระแสครึ่งคลื่น"], ["fullwave", "เรียงกระแสเต็มคลื่น: ฮาร์มอนิกคู่"], ["quasi-30", "quasi-square α = 30°: ไม่มีที่ 3"], ["quasi-18", "quasi-square α = 18°: ไม่มีที่ 5"], ["sixstep", "six-step: เหลือ 6k ± 1"], ["spwm", "SPWM ไบโพลาร์ mf = 15"], ["spwm-uni", "SPWM ยูนิโพลาร์: ย้ายไป 2mf"], ["trapezoid", "พัลส์คางหมู: เอนเวโลป EMI (dB)"], ["phasecut", "ตัดเฟสไตรแอก α = 90°"], ["clip-sym", "ตัดยอดสมมาตร: เฉพาะคี่"], ["clip-asym", "ตัดยอดไม่สมมาตร: มีคู่"], ["custom", "พิมพ์รูปคลื่นเอง"]],
      circuit: [["rc-square", "สี่เหลี่ยม 1 kHz → RC กรองผ่านต่ำ"], ["rc-hp-square", "สี่เหลี่ยม → RC กรองผ่านสูง"], ["rl-inverter", "อินเวอร์เตอร์สี่เหลี่ยม → โหลด RL"], ["rl-sixstep", "six-step → ขดลวดมอเตอร์ RL"], ["lc-buck", "บั๊ก 12 V → 5 V 50 kHz: ริปเปิล LC"], ["rlc-third", "RLC คัดฮาร์มอนิกที่ 3"], ["fullwave-lc", "เรียงกระแสเต็มคลื่น → ฟิลเตอร์ LC"], ["spwm-lc", "SPWM → ฟิลเตอร์ LC ได้ไซน์"]],
      power: [["heater", "ฮีตเตอร์ (ตัวต้านทาน)"], ["motor", "มอเตอร์ PF 0.75 (RL)"], ["smps", "SMPS 300 W ไม่มี PFC"], ["led", "หลอด LED 20 W ราคาถูก"], ["neutral", "SMPS 3 kW ต่อเฟส: นิวทรัลร้อน"], ["triac", "ไตรแอกหรี่ไฟ α = 90°"], ["bridge-l", "บริดจ์ 1 เฟส + โช้ก"], ["pfc", "SMPS มี Active PFC"], ["six", "6 พัลส์ 30 kW"], ["six-alpha", "6 พัลส์ไทริสเตอร์ α = 45°"], ["twelve", "12 พัลส์ 30 kW"], ["vfd", "ไดรฟ์ VFD 11 kW"], ["vfd-reactor", "VFD + รีแอกเตอร์ 3 %"], ["vfd-choke", "VFD + โช้ก DC"], ["cap-resonance", "⚠ คาปาซิเตอร์แก้ PF เรโซแนนซ์"], ["detuned", "คาปาซิเตอร์ดีจูน 7 %"], ["tuned-filter", "ฟิลเตอร์จูนที่ 4.7"], ["active-filter", "ฟิลเตอร์แอกทีฟ"], ["flat-top", "แรงดันยอดแบน → โหลดตัวต้านทาน"], ["custom-spec", "กำหนดสเปกตรัมเอง"]]
    };
    var sel = this.preSel, st = this.st, self = this;
    sel.innerHTML = '<option value="">การทดลองสำเร็จรูป…</option>';
    this.tabs.forEach(function (t) {
      var g = h("optgroup", { label: { synth: "ฟูเรียร์", circuit: "วงจร", power: "สโคป + วิเคราะห์กำลัง" }[t] });
      names[t].forEach(function (n) { if (t !== "synth" || n[0] === "custom" || self.waves.indexOf(PRESETS[n[0]].w) >= 0 || self.waves === WLIST) g.appendChild(h("option", { value: n[0] }, n[1])); });
      sel.appendChild(g);
    });
    sel.value = "";
  };

  Lab.prototype.load = function (name) {
    if (!PRESETS[name]) return;
    var st = applyPreset(name);
    if (this.tabs.indexOf(st.tab) < 0) return;
    this.st = st;
    this.syncAll();
    this.syncTabs();
    this.render();
    this.preSel.value = name;
  };

  Lab.prototype.syncTabs = function () {
    var st = this.st, self = this;
    this.root.querySelectorAll(".fsl-tabs button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-t") === st.tab)); });
    this.tabs.forEach(function (t) { self.panes[t].hidden = t !== st.tab; });
  };

  /* small form controls bound to this.st */
  Lab.prototype.ctlRange = function (parent, key, label, min, max, step, fmt, obj, onch, noReg) {
    var self = this, wrap = h("label", { cls: "fsl-sl" });
    wrap.appendChild(h("span", { cls: "fsl-l" }, label));
    var r = h("input", { type: "range", min: min, max: max, step: step });
    var o = h("output", {});
    wrap.appendChild(r); wrap.appendChild(o);
    parent.appendChild(wrap);
    var get = function () { var tgt = obj ? obj() : self.st; return tgt[key]; };
    var set = function (v) { var tgt = obj ? obj() : self.st; tgt[key] = v; };
    var sync = function () { var v = get(); if (v === undefined) return; r.value = v; o.textContent = fmt ? fmt(+v) : v; };
    r.addEventListener("input", function () { set(+r.value); o.textContent = fmt ? fmt(+r.value) : r.value; if (onch) onch(); self.render(); });
    if (!noReg) (this.syncers = this.syncers || []).push(sync);
    wrap._sync = sync;
    sync();
    return wrap;
  };
  Lab.prototype.ctlSel = function (parent, key, label, opts, onch, cls) {
    var self = this, wrap = h("label", { cls: "fsl-f " + (cls || "") });
    wrap.appendChild(h("span", { cls: "fsl-l" }, label));
    var sel = h("select", {});
    opts.forEach(function (o) { sel.appendChild(h("option", { value: o[0] }, o[1])); });
    wrap.appendChild(sel);
    parent.appendChild(wrap);
    var sync = function () { sel.value = String(self.st[key]); };
    sel.addEventListener("change", function () { var v = sel.value; self.st[key] = typeof self.st[key] === "number" ? +v : v; if (onch) onch(); self.render(); });
    (this.syncers = this.syncers || []).push(sync);
    sync();
    return wrap;
  };
  Lab.prototype.ctlText = function (parent, key, label, hint, cls, noReg) {
    var self = this, wrap = h("label", { cls: "fsl-f " + (cls || "") });
    wrap.appendChild(h("span", { cls: "fsl-l" }, label));
    var inp = h("input", { type: "text", spellcheck: "false", autocomplete: "off", inputmode: "text" });
    if (hint) inp.placeholder = hint;
    wrap.appendChild(inp);
    parent.appendChild(wrap);
    var sync = function () { inp.value = self.st[key]; };
    inp.addEventListener("input", function () { self.st[key] = inp.value; self.render(); });
    if (!noReg) (this.syncers = this.syncers || []).push(sync);
    sync();
    return wrap;
  };
  Lab.prototype.ctlChk = function (parent, key, label) {
    var self = this, wrap = h("label", { cls: "fsl-chk" });
    var c = h("input", { type: "checkbox" });
    wrap.appendChild(c); wrap.appendChild(h("span", {}, label));
    parent.appendChild(wrap);
    var sync = function () { c.checked = !!self.st[key]; };
    c.addEventListener("change", function () { self.st[key] = c.checked ? 1 : 0; self.render(); });
    (this.syncers = this.syncers || []).push(sync);
    sync();
    return wrap;
  };
  Lab.prototype.syncAll = function () {
    (this.syncers || []).forEach(function (f) { f(); });
    if (this.rebuildParams) this.rebuildParams();
    if (this.rebuildCParams) this.rebuildCParams();
    if (this.rebuildPower) this.rebuildPower();
  };

  /* waveform parameter sliders (rebuilt when the waveform changes) */
  Lab.prototype.paramSliders = function (box, wid, objGetter, circuit) {
    var self = this;
    box.innerHTML = "";
    if (wid === "custom") return;
    var defs = F.WAVES[wid].params, tgt = objGetter();
    Object.keys(defs).forEach(function (k) {
      if (tgt[k] === undefined) tgt[k] = defs[k];
      var m = Object.assign({}, PMETA[k]);
      if (k === "alpha" && wid === "phasecut") m.max = 179;
      if (k === "A" && circuit) { m = { l: wid === "spwm" ? "V_dc (V)" : "แอมพลิจูด (V)", min: 0.5, max: 600, step: 0.5 }; }
      if (k === "A" && !circuit && wid === "spwm") m.l = "V_dc";
      if (m.bool) {
        var wrap = h("label", { cls: "fsl-chk" }), c = h("input", { type: "checkbox" });
        c.checked = !!tgt[k];
        c.addEventListener("change", function () { objGetter()[k] = c.checked ? 1 : 0; self.render(); });
        wrap.appendChild(c); wrap.appendChild(h("span", {}, m.l)); box.appendChild(wrap);
      } else {
        var fmt = k === "alpha" ? function (v) { return v + "°"; } : k === "D" ? function (v) { return (v * 100).toFixed(0) + " %"; } : null;
        self.ctlRange(box, k, m.l, m.min, m.max, m.step, fmt, objGetter, null, true);
      }
    });
  };

  // ======================================================================= ① synthesis
  Lab.prototype.buildSynth = function (P) {
    var self = this, st = this.st;
    var ctl = h("div", { cls: "fsl-ctl" });
    var row = h("div", { cls: "fsl-row" });
    var wopts = this.waves.map(function (w) { return [w, w === "custom" ? "พิมพ์สมการเอง x(t)" : F.WAVES[w].th]; });
    this.ctlSel(row, "w", "รูปคลื่น", wopts, function () { self.rebuildParams(); }, "fsl-wsel");
    ctl.appendChild(row);
    var pbox = h("div", { cls: "fsl-row fsl-params" });
    ctl.appendChild(pbox);
    var exprRow = h("div", { cls: "fsl-row" });
    var ex = this.ctlText(exprRow, "expr", "x(t) หนึ่งคาบ t จาก 0 ถึง 1", "เช่น t < 0.3 ? 1 : 0 หรือ sin(2*pi*t)^3", "fsl-expr");
    exprRow.appendChild(h("span", { cls: "fsl-hint" }, "ใช้ได้: + − * / ^ sin cos exp abs sgn u() rect tri sq saw min max pi และเงื่อนไขแบบ t &lt; 0.3 ? 1 : 0 · ตัวอย่าง: sin(2*pi*t)^3, abs(sin(2*pi*t)), 4*t*(1-t)"));
    ctl.appendChild(exprRow);
    this.exprRow = exprRow;
    var nrow = h("div", { cls: "fsl-row fsl-nrow" });
    this.ctlRange(nrow, "N", "จำนวนฮาร์มอนิกที่รวม N", 1, 99, 1, function (v) { return "n ≤ " + v; });
    var play = h("button", { type: "button", cls: "fsl-btn fsl-play" }, "▶ เพิ่มทีละตัว");
    play.addEventListener("click", function () { self.playN(play); });
    nrow.appendChild(play);
    ctl.appendChild(nrow);
    var chk = h("div", { cls: "fsl-row fsl-chks" });
    this.ctlChk(chk, "orig", "รูปคลื่นจริง");
    this.ctlChk(chk, "comp", "แยกฮาร์มอนิก");
    this.ctlChk(chk, "sigma", "ลดหูกิบส์ (σ)");
    this.ctlChk(chk, "err", "ความคลาดเคลื่อน");
    this.ctlChk(chk, "hide", "ซ่อนสเปกตรัม (ทายก่อน)");
    ctl.appendChild(chk);
    P.appendChild(ctl);
    this.rebuildParams = function () {
      self.paramSliders(pbox, self.st.w, function () { return self.st.p; });
      exprRow.hidden = self.st.w !== "custom";
      pbox.hidden = self.st.w === "custom";
    };
    this.rebuildParams();

    var views = h("div", { cls: "fsl-views" });
    var f1 = h("figure", { cls: "fsl-plot" });
    f1.appendChild(h("figcaption", {}, "<b>โดเมนเวลา</b> · 2 คาบ · <span class=\"fsl-key k-orig\">รูปคลื่นจริง</span> <span class=\"fsl-key k-sum\">ผลรวม N ฮาร์มอนิก</span> <span class=\"fsl-key k-comp\">แต่ละฮาร์มอนิก</span>"));
    this.sT = s("svg", { "class": "fsl-svg", role: "img", "aria-label": "รูปคลื่นและผลรวมอนุกรมฟูเรียร์" }, f1);
    views.appendChild(f1);
    var f2 = h("figure", { cls: "fsl-plot" });
    var cap2 = h("figcaption", {}, "<b>สเปกตรัม</b> · แท่งทึบคือฮาร์มอนิกที่รวมแล้ว ");
    var seg = h("span", { cls: "fsl-seg" });
    [["amp", "แอมพลิจูด"], ["pct", "% ของหลัก"], ["db", "dB"], ["phase", "เฟส"]].forEach(function (u) {
      var b = h("button", { type: "button", "data-u": u[0] }, u[1]);
      b.addEventListener("click", function () { self.st.sunit = u[0]; self.render(); });
      seg.appendChild(b);
    });
    cap2.appendChild(seg);
    f2.appendChild(cap2);
    this.sS = s("svg", { "class": "fsl-svg", role: "img", "aria-label": "สเปกตรัมขนาดของอนุกรมฟูเรียร์" }, f2);
    this.sHide = h("button", { type: "button", cls: "fsl-reveal", hidden: "" }, "ทายแล้ว? กดเพื่อดูสเปกตรัม");
    this.sHide.addEventListener("click", function () { self.st.hide = 0; self.syncAll(); self.render(); });
    f2.appendChild(this.sHide);
    views.appendChild(f2);
    P.appendChild(views);
    this.sSeg = seg;
    this.sRead = h("div", { cls: "fsl-read" });
    P.appendChild(this.sRead);
    var steps = h("details", { cls: "fsl-steps" });
    if (!this.compact || this.root.getAttribute("data-open") === "steps") steps.open = true;
    steps.appendChild(h("summary", {}, "วิธีคิดทีละขั้น: จากรูปคลื่นสู่สัมประสิทธิ์"));
    this.sSteps = h("div", { cls: "fsl-steps-b" });
    steps.appendChild(this.sSteps);
    P.appendChild(steps);
  };

  Lab.prototype.playN = function (btn) {
    var self = this;
    if (this._play) { clearInterval(this._play); this._play = null; btn.textContent = "▶ เพิ่มทีละตัว"; return; }
    var target = Math.max(this.st.N, 9), w = this.curWave(), n = 0;
    btn.textContent = "■ หยุด";
    this._play = setInterval(function () {
      // jump to the next harmonic that is not zero
      do { n++; } while (n < target && F.amp(w.cf, n) < 1e-9 * (F.amp(w.cf, 1) + 1e-12));
      self.st.N = n; self.syncAll(); self.render();
      if (n >= target) { clearInterval(self._play); self._play = null; btn.textContent = "▶ เพิ่มทีละตัว"; }
    }, 650);
  };

  Lab.prototype.curWave = function () {
    var st = this.st;
    if (st.w === "custom") {
      var key = "c:" + st.expr;
      if (this._cw && this._cw.key === key) return this._cw.w;
      var w;
      try {
        if (!window.SigExpr) throw new Error("ตัวแปลสมการยังไม่โหลด");
        var src = st.expr.replace(/([^?:]+)\?([^:]+):(.+)/, function (_, c, a, b) { // a ? b : c → u()-based form
          var m = /^(.*?)(<=|>=|<|>)(.*)$/.exec(c.trim());
          if (!m) throw new Error("เงื่อนไขต้องอยู่ในรูป a < b ? x : y");
          var cond = /</.test(m[2]) ? "u((" + m[3] + ")-(" + m[1] + "))" : "u((" + m[1] + ")-(" + m[3] + "))";
          return cond + "*(" + a + ")+(1-" + cond + ")*(" + b + ")";
        });
        var cmp = window.SigExpr.compile(src, "t");
        w = F.waveFn(function (t) { return cmp.fn({ t: t, dt: 1 / 8192, on: true }); });
        w.err = null;
      } catch (e) { w = F.wave("square", { A: 1 }); w.err = e.message || String(e); }
      this._cw = { key: key, w: w };
      return w;
    }
    var k = st.w + JSON.stringify(st.p);
    if (this._sw && this._sw.key === k) return this._sw.w;
    var ww = F.wave(st.w, st.p);
    this._sw = { key: k, w: ww };
    return ww;
  };

  Lab.prototype.renderSynth = function () {
    var st = this.st, w = this.curWave(), cf = w.cf, N = st.N, self = this;
    var W = boxW(this.sT), Hh = boxH(W, this.compact);
    // ---- time plot
    var M = 720, pts = [], sum = [], comps = [], errs = [];
    var nz = [];
    for (var n = 1; n <= Math.min(N, 99) && nz.length < 5; n++) if (F.amp(cf, n) > 1e-9 * (F.amp(cf, 1) + F.amp(cf, 2) + 1e-12)) nz.push(n);
    nz.forEach(function () { comps.push([]); });
    for (var j = 0; j <= M; j++) {
      var th = 2 * TAU * j / M, x = w.at(th), ps = F.partial(cf, N, th, st.sigma);
      pts.push([j / M * 2, x]); sum.push([j / M * 2, ps]); errs.push([j / M * 2, x - ps]);
      nz.forEach(function (n, i) { comps[i].push([j / M * 2, cf.a[n] * Math.cos(n * th) + cf.b[n] * Math.sin(n * th)]); });
    }
    var yr = range([pts, sum], 0.1);
    var ch = Chart(this.sT, W, Hh, { x0: 0, x1: 2, y0: yr[0], y1: yr[1], xt: [[0, "0"], [0.5, "T/2"], [1, "T"], [1.5, "3T/2"], [2, "2T"]], yt: ticks(yr[0], yr[1], 5), xlab: "t" });
    if (st.comp) comps.forEach(function (c, i) { ch.line(c, "fsl-cmp c" + (i % 5)); });
    if (st.err) ch.line(errs, "fsl-err");
    if (st.orig) ch.line(pts, "fsl-orig");
    ch.line(sum, "fsl-sum");
    if (st.comp) nz.forEach(function (n, i) { var t = s("text", { x: ch.L + 6 + i * 52, y: ch.T + 13, "class": "fsl-ctag c" + i }, ch.svg); t.textContent = "n=" + n; });
    // ---- spectrum
    var Ns = Math.max(15, Math.min(st.w === "spwm" || st.w === "trapezoid" ? 99 : 50, Math.ceil(Math.max(N, 12) * 1.25)));
    var A1 = F.amp(cf, 1), Amax = 0, k;
    for (k = 0; k <= Ns; k++) Amax = Math.max(Amax, F.amp(cf, k));
    var unit = st.sunit, ys = [];
    for (k = 0; k <= Ns; k++) {
      var a = F.amp(cf, k);
      ys.push(unit === "pct" ? (A1 > 0 ? a / A1 * 100 : 0) : unit === "db" ? (a > Amax * 1e-6 ? 20 * Math.log10(a / Amax) : -120) : unit === "phase" ? (a > Amax * 1e-7 && k > 0 ? F.phaseCos(cf, k) / D2R : 0) : a);
    }
    var y0 = 0, y1 = unit === "phase" ? 180 : Math.max.apply(null, ys) * 1.12 || 1;
    if (unit === "db") { y0 = -60; y1 = 5; }
    if (unit === "phase") y0 = -180;
    if (unit === "pct") y1 = Math.min(Math.max(110, y1), 400);
    var xt = ticks(0, Ns, Math.min(10, Ns), function (t) { return String(Math.round(t)); });
    var sc = Chart(this.sS, W, Hh, { x0: -0.7, x1: Ns + 0.7, y0: y0, y1: y1, xt: xt, yt: unit === "phase" ? [[-180, "−180°"], [-90, "−90°"], [0, "0°", true], [90, "90°"], [180, "180°"]] : ticks(y0, y1, 5, unit === "db" ? function (t) { return t + " dB"; } : unit === "pct" ? function (t) { return t + "%"; } : null), xlab: "n", ylab: { amp: "Aₙ", pct: "% ของ A₁", db: "dB เทียบยอด", phase: "φₙ (รูป cos)" }[unit] });
    this.sS.classList.toggle("fsl-hidden", !!st.hide);
    this.sHide.hidden = !st.hide;
    for (k = 0; k <= Ns; k++) {
      var amk = F.amp(cf, k);
      if (amk < 1e-9 * (Amax || 1)) { if (k > 0 && k <= N) sc.bar(k, 0.5, unit === "db" ? -60 : 0, unit === "db" ? -59 : 0, "fsl-zbar"); continue; }
      var inc = k <= N || k === 0, yv = ys[k], base = unit === "db" ? -60 : 0;
      if (unit === "phase") sc.bar(k, 0.55, 0, yv, inc ? "fsl-b fsl-ph" : "fsl-b fsl-ph off", "n = " + k + " · φ = " + yv.toFixed(1) + "°");
      else sc.bar(k, 0.62, base, Math.max(yv, base), inc ? (k === 0 ? "fsl-b dc" : "fsl-b") : "fsl-b off", "n = " + k + " · A = " + sig(amk, 4) + (A1 ? " · " + (amk / A1 * 100).toFixed(2) + "% ของ A₁" : ""));
    }
    if (unit === "pct" && ys[1] > y1) sc.text(1, y1 * 0.93, "100%", "fsl-tk");
    Array.prototype.forEach.call(this.sSeg.children, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-u") === unit)); });

    // ---- readouts
    var S = F.waveStats(w, N, st.sigma), sy = F.symmetry(cf);
    var badges = [];
    if (sy.even) badges.push(["คู่ x(−t) = x(t)", "bₙ = 0"]);
    if (sy.odd) badges.push(["คี่ x(−t) = −x(t)", "a₀ = aₙ = 0"]);
    if (sy.half) badges.push(["สมมาตรครึ่งคลื่น", "ไม่มี n คู่"]);
    if (sy.evenOnly) badges.push(["คาบจริง T/2", "มีแต่ n คู่"]);
    if (!badges.length) badges.push(["ไม่มีสมมาตรพิเศษ", "ต้องหาทั้ง aₙ bₙ"]);
    var rd = function (l, v, t) { return '<span class="fsl-rd"' + (t ? ' title="' + esc(t) + '"' : "") + '><i>' + l + "</i><b>" + v + "</b></span>"; };
    this.sRead.innerHTML =
      (w.err ? '<p class="fsl-err-msg">สมการผิด: ' + esc(w.err) + "</p>" : "") +
      '<div class="fsl-badges">' + badges.map(function (b) { return '<span class="fsl-badge"><b>' + b[0] + "</b> → " + b[1] + "</span>"; }).join("") + "</div>" +
      '<div class="fsl-rds">' +
      rd("DC a₀", sig(S.dc, 4)) + rd("A₁ (ยอด)", sig(S.A1, 4)) + rd("RMS จริง", sig(S.rms, 4)) + rd("RMS จาก n ≤ " + N, sig(S.rmsN, 4), "พาร์เซวาล: √(a₀² + ΣAₙ²/2)") +
      rd("กำลังที่รวมแล้ว", pc(S.powerN, 2)) + rd("THD", isFinite(S.thd) ? pc(S.thd, 1) : "—", "√(RMS² − a₀² − A₁²/2) / (A₁/√2)") + rd("Crest factor", sig(S.crest, 3)) +
      rd("หูกิบส์", pc(S.over, 1) + " ของ p-p", "ค่าพุ่งเกินของผลรวม N ฮาร์มอนิกเทียบช่วงยอดถึงยอด (ค่าทฤษฎีที่รอยกระโดด ≈ 8.95 % ของขนาดรอยกระโดด)") + rd("RMS ของความคลาดเคลื่อน", sig(S.errRms, 3)) +
      "</div>";
    // ---- steps
    if (this.sSteps.closest("details").open) this.sSteps.innerHTML = this.synthSteps(w, S, sy, N);
    else this.sSteps.closest("details").ontoggle = function () { if (this.open) self.render(); };
  };

  Lab.prototype.synthSteps = function (w, S, sy, N) {
    var cf = w.cf, st = this.st, def = F.WAVES[st.w], rows = "", n, used = 0;
    var cons = [];
    if (sy.even) cons.push("ฟังก์ชันคู่ → ผลคูณ x(t) sin(nω₀t) เป็นฟังก์ชันคี่ อินทิกรัลตลอดคาบเป็นศูนย์ ∴ <b>bₙ = 0</b> ทุกตัว หาแค่ a₀, aₙ");
    if (sy.odd) cons.push("ฟังก์ชันคี่ (และค่าเฉลี่ยเป็นศูนย์) → <b>a₀ = 0, aₙ = 0</b> หาแค่ bₙ = (4/T)∫<sub>0</sub><sup>T/2</sup> x sin(nω₀t) dt");
    if (sy.half) cons.push("สมมาตรครึ่งคลื่น x(t + T/2) = −x(t) → <b>ฮาร์มอนิกคู่หายหมด</b> และคิดอินทิกรัลแค่ครึ่งคาบแล้วคูณสอง");
    if (sy.evenOnly) cons.push("รูปซ้ำทุก T/2 (คาบจริงคือครึ่งหนึ่งของคาบที่ใช้อ้างอิง) → <b>เหลือเฉพาะ n คู่</b> เช่นไฟเรียงกระแสเต็มคลื่น 50 Hz มีแค่ 100, 200, 300 Hz");
    if (!cons.length) cons.push("ไม่มีสมมาตรที่ช่วยตัดพจน์ได้ → ต้องหา a₀, aₙ และ bₙ ครบทั้งสามชุด (ลองเลื่อนแกนเวลาให้รูปสมมาตรก่อนจะช่วยลดงาน)");
    for (n = 1; n <= 99 && used < 10; n++) {
      var A = F.amp(cf, n);
      if (A < 1e-9 * (S.A1 + 1e-12) && n > 3) continue;
      used++;
      rows += "<tr" + (n > N ? ' class="off"' : "") + "><td>" + n + "</td><td>" + fx(cf.a[n], 4) + "</td><td>" + fx(cf.b[n], 4) + "</td><td>" + fx(A, 4) + "</td><td>" + (A > 1e-9 ? deg(F.phaseCos(cf, n)) : "—") + "</td><td>" + (S.A1 > 0 ? fx(A / S.A1 * 100, 1) + " %" : "—") + "</td></tr>";
    }
    var terms = [], k = 0;
    if (Math.abs(cf.a[0]) > 1e-9) terms.push(sig(cf.a[0], 4));
    for (n = 1; n <= N && k < 5; n++) {
      var An = F.amp(cf, n);
      if (An < 1e-9 * (S.A1 + 1e-12)) continue;
      k++;
      var ph = F.phaseCos(cf, n) / D2R;
      terms.push(sig(An, 4) + " cos(" + (n === 1 ? "" : n) + "ω₀t " + (ph < 0 ? "− " : "+ ") + fx(Math.abs(ph), 1) + "°)");
    }
    var pars = Object.keys(w.p || {}).map(function (q) { return q + " = " + w.p[q]; }).join(", ");
    return '<ol class="fsl-ol">' +
      "<li><b>ดูสมมาตรก่อนคำนวณ</b><ul>" + cons.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul></li>" +
      "<li><b>สูตรออยเลอร์ (Euler formulas)</b> บนคาบ T, ω₀ = 2π/T: a₀ = (1/T)∫x dt · aₙ = (2/T)∫x cos(nω₀t) dt · bₙ = (2/T)∫x sin(nω₀t) dt <a href=\"/learn/fourier-series/coefficients/#T6\">T6</a></li>" +
      (def ? "<li><b>ผลอินทิกรัลของรูปนี้</b> (" + esc(pars) + "): " + esc(def.rule) + ' <a href="/learn/fourier-series/waveform-table/#' + def.id + '">ดูที่มา</a></li>' : "<li><b>รูปที่พิมพ์เอง</b> คำนวณด้วยการอินทิเกรตเชิงตัวเลข 8,192 จุดต่อคาบ</li>") +
      '<li><b>แทนค่า n = 1, 2, 3, …</b> (แสดง 10 ตัวแรกที่ไม่เป็นศูนย์ แถวจางคือยังไม่ได้รวม)<div class="fsl-tw"><table class="fsl-tab"><thead><tr><th>n</th><th>aₙ</th><th>bₙ</th><th>Aₙ = √(aₙ²+bₙ²)</th><th>φₙ = atan2(−bₙ, aₙ)</th><th>% ของ A₁</th></tr></thead><tbody>' + rows + "</tbody></table></div></li>" +
      "<li><b>รวมเป็นอนุกรม</b> (รูปแอมพลิจูด–เฟส <a href=\"/learn/fourier-series/complex-spectrum/#C3\">C3</a>): x(t) ≈ " + (terms.join(" + ") || "0") + (N > k ? " + …" : "") + "</li>" +
      "<li><b>ตรวจด้วยพาร์เซวาล</b> <a href=\"/learn/fourier-series/convergence-parseval/#P5\">P5</a>: RMS² = a₀² + Σ Aₙ²/2 → รวม n ≤ " + N + " ได้ " + sig(S.rmsN * S.rmsN, 5) + " จากค่าจริง " + sig(S.rms * S.rms, 5) + " (" + pc(S.powerN, 2) + " ของกำลัง)</li>" +
      "</ol>";
  };

  // ======================================================================= ② circuit
  Lab.prototype.buildCircuit = function (P) {
    var self = this;
    var ctl = h("div", { cls: "fsl-ctl" });
    var r1 = h("div", { cls: "fsl-row" });
    this.ctlSel(r1, "cw", "สัญญาณขาเข้า", CIRC_WAVES.map(function (w) { return [w, F.WAVES[w].th]; }), function () { self.rebuildCParams(); }, "fsl-wsel");
    this.ctlText(r1, "cf", "ความถี่มูลฐาน f₀ (Hz)", "เช่น 1k, 50, 50k", "fsl-tnum");
    ctl.appendChild(r1);
    var pbox = h("div", { cls: "fsl-row fsl-params" });
    ctl.appendChild(pbox);
    var r2 = h("div", { cls: "fsl-row" });
    this.ctlSel(r2, "ck", "วงจร", Object.keys(F.CIRCUITS).map(function (k) { return [k, F.CIRCUITS[k].th]; }), function () { self.rebuildCParams(); }, "fsl-wsel");
    this.cR = this.ctlText(r2, "cR", "R (Ω)", "1k", "fsl-tnum");
    this.cL = this.ctlText(r2, "cL", "L (H)", "10m", "fsl-tnum");
    this.cC = this.ctlText(r2, "cC", "C (F)", "100n", "fsl-tnum");
    ctl.appendChild(r2);
    var r3 = h("div", { cls: "fsl-row" });
    this.ctlRange(r3, "cN", "รวมฮาร์มอนิกถึง n =", 1, 99, 1);
    this.ctlChk(r3, "cac", "ดูขาออกแบบ AC (ตัด DC ขยายริปเปิล)");
    this.ctlChk(r3, "cdb", "สเปกตรัมเป็น dB");
    ctl.appendChild(r3);
    P.appendChild(ctl);
    this.rebuildCParams = function () {
      self.paramSliders(pbox, self.st.cw, function () { return self.st.cp; }, true);
      var par = F.CIRCUITS[self.st.ck].par;
      self.cR.hidden = par.indexOf("R") < 0; self.cL.hidden = par.indexOf("L") < 0; self.cC.hidden = par.indexOf("C") < 0;
    };
    this.rebuildCParams();
    var views = h("div", { cls: "fsl-views" });
    var f1 = h("figure", { cls: "fsl-plot" });
    f1.appendChild(h("figcaption", {}, "<b>โดเมนเวลา</b> · <span class=\"fsl-key k-in\">ขาเข้า</span> <span class=\"fsl-key k-sum\">ขาออกจากผลรวมฮาร์มอนิก</span> <span class=\"fsl-key k-orig\">คำตอบจริง (จำลอง ODE)</span>"));
    this.cT = s("svg", { "class": "fsl-svg", role: "img", "aria-label": "สัญญาณขาเข้าและขาออกของวงจร" }, f1);
    views.appendChild(f1);
    var f2 = h("figure", { cls: "fsl-plot" });
    f2.appendChild(h("figcaption", {}, "<b>สเปกตรัม</b> · <span class=\"fsl-key k-in\">ขาเข้า</span> <span class=\"fsl-key k-sum\">ขาออก</span> · เส้นประ = |H(jnω₀)| (แกนขวา)"));
    this.cS = s("svg", { "class": "fsl-svg", role: "img", "aria-label": "สเปกตรัมขาเข้าและขาออกพร้อมผลตอบสนองความถี่" }, f2);
    views.appendChild(f2);
    P.appendChild(views);
    this.cRead = h("div", { cls: "fsl-read" });
    P.appendChild(this.cRead);
    var steps = h("details", { cls: "fsl-steps" });
    steps.open = !this.compact;
    steps.appendChild(h("summary", {}, "วิธีคิดทีละขั้น: แยก → คูณ H(jnω₀) → รวม"));
    this.cSteps = h("div", { cls: "fsl-steps-b" });
    steps.appendChild(this.cSteps);
    P.appendChild(steps);
  };

  Lab.prototype.renderCircuit = function () {
    var st = this.st, self = this;
    var f0 = parseSI(st.cf), par = { R: parseSI(st.cR), L: parseSI(st.cL), C: parseSI(st.cC) };
    var ck = F.CIRCUITS[st.ck], need = ck.par, bad = [];
    if (!(f0 > 0)) bad.push("ความถี่");
    need.forEach(function (k) { if (!(par[k] > 0)) bad.push(k); });
    if (bad.length) { this.cRead.innerHTML = '<p class="fsl-err-msg">ใส่ค่าให้ถูก: ' + bad.join(", ") + " (ใช้ตัวย่อได้ เช่น 4.7u, 10k)</p>"; return; }
    var key = st.cw + JSON.stringify(st.cp);
    if (!this._ccw || this._ccw.key !== key) this._ccw = { key: key, w: F.wave(st.cw, st.cp) };
    var w = this._ccw.w, N = st.cN, hs = F.circuitHarmonics(w.cf, f0, st.ck, par, 99);
    var exKey = key + st.ck + f0 + JSON.stringify(par);
    if (!this._cex || this._cex.key !== exKey) this._cex = { key: exKey, y: F.circuitExact(w, f0, st.ck, par, 1024) };
    var ex = this._cex.y, M = ex.length;
    var W = boxW(this.cT), Hh = boxH(W);
    var vin = [], vout = [], vex = [], j;
    for (j = 0; j <= 2 * M; j++) {
      var th = TAU * j / M, t = j / M, y = hs[0].Y.re;
      for (var n = 1; n <= N; n++) { var Y = hs[n].Y; y += Y.re * Math.cos(n * th) - Y.im * Math.sin(n * th); }
      vin.push([t, w.at(th)]); vout.push([t, y]); vex.push([t, ex[j % M]]);
    }
    var outU = ck.out, sameU = outU === "V" && !st.cac;
    if (st.cac) { var dcv = hs[0].Y.re; vout = vout.map(function (p) { return [p[0], p[1] - dcv]; }); vex = vex.map(function (p) { return [p[0], p[1] - dcv]; }); }
    var yr = sameU ? range([vin, vout, vex], 0.08) : range([vout, vex], 0.1);
    var ch = Chart(this.cT, W, Hh, { x0: 0, x1: 2, y0: yr[0], y1: yr[1], xt: [[0, "0"], [0.5, si(0.5 / f0, "s")], [1, si(1 / f0, "s")], [1.5, si(1.5 / f0, "s")], [2, si(2 / f0, "s")]], yt: ticks(yr[0], yr[1], 5, function (t) { return si(t, ""); }), xlab: "t", ylab: st.cac ? "ขาออก AC (" + outU + ")" : sameU ? "V" : "A (ขาออก)" });
    if (sameU) ch.line(vin, "fsl-in");
    ch.line(vex, "fsl-orig");
    ch.line(vout, "fsl-sum");
    // spectrum: input and output bars, |H| line
    var Ns = Math.min(Math.max(N, 15), 60), maxIn = 0, maxOut = 0, maxH = 0, k;
    for (k = 0; k <= Ns; k++) { maxIn = Math.max(maxIn, F.cabs(hs[k].X)); maxOut = Math.max(maxOut, F.cabs(hs[k].Y)); maxH = Math.max(maxH, F.cabs(hs[k].H)); }
    var sameS = ck.out === "V", db = !!st.cdb, ref = Math.max(maxIn, sameS ? maxOut : 0) || 1;
    var top = db ? 5 : sameS ? Math.max(maxIn, maxOut) * 1.12 : 1.12, bot = db ? -100 : 0;
    var yv = function (a, mx) { return db ? Math.max(-100, 20 * Math.log10(Math.max(a, 1e-12) / (sameS ? ref : mx))) : sameS ? a : a / mx; };
    var sc = Chart(this.cS, W, Hh, { x0: -0.8, x1: Ns + 0.8, y0: bot, y1: top, xt: ticks(0, Ns, 10, function (t) { return String(Math.round(t)); }), yt: db ? ticks(-100, 0, 5, function (t) { return t + " dB"; }) : sameS ? ticks(0, top, 5) : [[0, "0"], [0.5, "50%"], [1, "100%"]], xlab: "n", ylab: db ? "dB เทียบขาเข้าสูงสุด" : sameS ? "แอมพลิจูด (V)" : "เทียบค่าสูงสุดของตัวเอง", padR: 40 });
    var hpts = [];
    for (k = 0; k <= Ns; k++) {
      var xi = F.cabs(hs[k].X), yo = F.cabs(hs[k].Y);
      if (xi > 1e-9 * maxIn) sc.bar(k - 0.18, 0.34, bot, yv(xi, maxIn), "fsl-b in", "n=" + k + " ขาเข้า " + sig(xi, 4) + " V");
      if (yo > 1e-9 * (maxOut || 1)) sc.bar(k + 0.18, 0.34, bot, yv(yo, maxOut || 1), k <= N ? "fsl-b" : "fsl-b off", "n=" + k + " ขาออก " + sig(yo, 4) + " " + outU);
    }
    for (var xx = 0; xx <= Ns; xx += Ns / 300) { var Hx = F.cabs(ck.H(TAU * f0 * xx, par)); hpts.push([xx, db ? Math.max(-100, 20 * Math.log10(Math.max(Hx, 1e-12))) : Hx / (maxH || 1) * top]); }
    sc.line(hpts, "fsl-hline");
    var rt = s("text", { x: W - 4, y: sc.Y(top) + 10, "class": "fsl-tk", "text-anchor": "end" }, sc.svg); rt.textContent = db ? "|H| เป็น dB" : "|H| สูงสุด " + sig(maxH, 3);
    // readouts
    var dc = hs[0].Y.re, ms = dc * dc, h2 = 0, A1 = F.cabs(hs[1].Y);
    for (k = 1; k <= N; k++) { var a2 = F.cabs(hs[k].Y); ms += a2 * a2 / 2; if (k >= 2) h2 += a2 * a2 / 2; }
    var exMax = -Infinity, exMin = Infinity, exMs = 0, eRms = 0;
    for (j = 0; j < M; j++) { exMax = Math.max(exMax, ex[j]); exMin = Math.min(exMin, ex[j]); exMs += ex[j] * ex[j]; eRms += (vex[j][1] - vout[j][1]) * (vex[j][1] - vout[j][1]); }
    exMs /= M; eRms = Math.sqrt(eRms / M);
    var corner = "";
    if (st.ck === "rc-lp" || st.ck === "rc-hp") corner = "f_c = 1/(2πRC) = " + si(1 / (TAU * par.R * par.C), "Hz");
    else if (st.ck === "rl-i") corner = "f_c = R/(2πL) = " + si(par.R / (TAU * par.L), "Hz");
    else { var f0r = 1 / (TAU * Math.sqrt(par.L * par.C)); corner = "f₀ = 1/(2π√LC) = " + si(f0r, "Hz") + " = " + fx(f0r / f0, 2) + "f₁" + (st.ck !== "lc-lp" ? " · Q = " + sig(Math.sqrt(par.L / par.C) / par.R, 3) : ""); }
    var rd = function (l, v) { return '<span class="fsl-rd"><i>' + l + "</i><b>" + v + "</b></span>"; };
    this.cRead.innerHTML = '<div class="fsl-rds">' + rd("วงจร", corner) + rd("DC ขาออก", si(dc, outU)) + rd("RMS ขาออก (n ≤ " + N + ")", si(Math.sqrt(ms), outU)) + rd("RMS จริง", si(Math.sqrt(exMs), outU)) +
      rd("ยอดถึงยอด (จริง)", si(exMax - exMin, outU)) + rd("ฮาร์มอนิกหลักขาออก", si(A1, outU) + " ยอด") + rd("THD ขาออก", A1 > 0 ? pc(Math.sqrt(h2) / (A1 / SQ2), 1) : "—") + rd("ต่างจากคำตอบจริง (RMS)", si(eRms, outU)) + "</div>";
    if (this.cSteps.closest("details").open) {
      var rows = "", used = 0;
      for (k = 0; k <= 99 && used < 9; k++) {
        var X = hs[k].X, Yk = hs[k].Y;
        if (F.cabs(X) < 1e-9 * maxIn) continue;
        used++;
        rows += "<tr" + (k > N ? ' class="off"' : "") + "><td>" + k + "</td><td>" + si(k * f0, "Hz") + "</td><td>" + sig(F.cabs(X), 4) + " ∠" + (k ? deg(F.carg(X)) : "0°") + "</td><td>" + sig(F.cabs(hs[k].H), 4) + " ∠" + deg(F.carg(hs[k].H)) + "</td><td>" + sig(F.cabs(Yk), 4) + " ∠" + (k ? deg(F.carg(Yk)) : "0°") + "</td></tr>";
      }
      this.cSteps.innerHTML = '<ol class="fsl-ol"><li><b>แยกขาเข้าเป็นฮาร์มอนิก</b> (อนุกรมฟูเรียร์ของ' + esc(F.WAVES[st.cw].th) + '): เขียนแต่ละตัวเป็นเฟเซอร์ Xₙ = aₙ − jbₙ (ค่ายอด)</li>' +
        "<li><b>หาผลตอบสนองความถี่ที่ความถี่ของแต่ละฮาร์มอนิก</b> แทน ω = nω₀ ใน H(jω) <a href=\"/learn/fourier-series/circuit-analysis/#A2\">A2</a> · " + esc(corner) + "</li>" +
        "<li><b>คูณทีละตัว</b> Yₙ = H(jnω₀)·Xₙ (ซูเปอร์โพซิชันใช้ได้เพราะวงจรเป็นเชิงเส้น)<div class=\"fsl-tw\"><table class=\"fsl-tab\"><thead><tr><th>n</th><th>ความถี่</th><th>Xₙ ขาเข้า</th><th>H(jnω₀)</th><th>Yₙ ขาออก (" + outU + ")</th></tr></thead><tbody>" + rows + "</tbody></table></div></li>" +
        "<li><b>รวมกลับในโดเมนเวลา</b> y(t) = Y₀ + Σ |Yₙ| cos(nω₀t + ∠Yₙ) รวมถึง n = " + N + " ต่างจากคำตอบจริงเพียง " + si(eRms, outU) + " (RMS) · เพิ่ม N แล้วดูเส้นสองเส้นทับกัน</li>" +
        "<li><b>แปลผล</b>: ฮาร์มอนิกที่ |H| เล็กถูกกรองทิ้ง ส่วนที่ |H| ≈ 1 ผ่านไปได้ ลองเลื่อน f₀ หรือค่า R L C แล้วดูว่าแท่งขาออกตัวไหนหายไปก่อน</li></ol>";
    } else this.cSteps.closest("details").ontoggle = function () { if (this.open) self.render(); };
  };

  // ======================================================================= ③ power: oscilloscope + analyzer
  Lab.prototype.buildPower = function (P) {
    var self = this, st = this.st;
    var ctl = h("div", { cls: "fsl-ctl" });
    var r1 = h("div", { cls: "fsl-row" });
    this.ctlSel(r1, "load", "โหลด", Object.keys(F.LOADS).map(function (k) { return [k, F.LOADS[k].th]; }), function () { var L = F.LOADS[self.st.load]; if (L.ph === 3) self.st.sys = 3; self.rebuildPower(); }, "fsl-wsel");
    this.ctlSel(r1, "sys", "ระบบ", [[1, "1 เฟส 230 V"], [3, "3 เฟส 400/230 V"]], function () { self.rebuildPower(); });
    this.ctlSel(r1, "f", "ความถี่", [[50, "50 Hz"], [60, "60 Hz"]]);
    ctl.appendChild(r1);
    var lp = h("div", { cls: "fsl-row fsl-params" });
    ctl.appendChild(lp);
    var det = h("details", { cls: "fsl-more" });
    det.appendChild(h("summary", {}, "ระบบไฟต้นทาง · แก้ปัญหาฮาร์มอนิก · เกณฑ์มาตรฐาน"));
    var src = h("div", { cls: "fsl-row" });
    this.ctlRange(src, "scr", "ความแข็งระบบ Isc/I_L", 5, 3000, 1, function (v) { return v + " เท่า"; });
    this.ctlRange(src, "xr", "X/R ของต้นทาง", 0.5, 15, 0.5);
    this.ctlRange(src, "v5", "ฮาร์มอนิกที่ 5 ในแรงดันต้นทาง", 0, 6, 0.5, function (v) { return v + " %"; });
    this.ctlRange(src, "lpct", "โหลดตอนวัด (% ของ I_L สูงสุด)", 20, 100, 5, function (v) { return v + " %"; });
    this.ctlRange(src, "damp", "โหลดเชิงเส้นอื่นบนหม้อแปลง (% ของ I_L)", 0, 200, 5, function (v) { return v + " %"; });
    det.appendChild(src);
    var mit = h("div", { cls: "fsl-row" });
    this.ctlSel(mit, "react", "รีแอกเตอร์ไลน์ (%Z)", [[0, "ไม่มี"], [2, "2 %"], [3, "3 %"], [5, "5 %"], [8, "8 %"]]);
    this.ctlSel(mit, "cap", "คาปาซิเตอร์/ฟิลเตอร์", [["none", "ไม่มี"], ["plain", "คาปาซิเตอร์แก้ PF (ไม่มีรีแอกเตอร์)"], ["det7", "คาปาซิเตอร์ดีจูน 7 % (จูน 3.78)"], ["det14", "คาปาซิเตอร์ดีจูน 14 % (จูน 2.67)"], ["tuned", "ฟิลเตอร์จูนที่ 4.7 (ดัก 5th)"]]);
    this.ctlRange(mit, "Qc", "ขนาดคาปาซิเตอร์ (kvar รวม)", 0, 200, 1, function (v) { return v + " kvar"; });
    this.ctlChk(mit, "af", "ฟิลเตอร์แอกทีฟ (ถึง h = 50)");
    this.ctlRange(mit, "afe", "ประสิทธิผลฟิลเตอร์แอกทีฟ", 0.5, 1, 0.01, function (v) { return Math.round(v * 100) + " %"; });
    det.appendChild(mit);
    var stdr = h("div", { cls: "fsl-row" });
    this.ctlSel(stdr, "std", "เกณฑ์เปรียบเทียบ", [["ieee", "IEEE 519-2022 (ที่ PCC)"], ["iec", "IEC 61000-3-2 Class A (เครื่องใช้ ≤ 16 A)"], ["pea", "กฟภ./กฟน. แรงดัน 0.4 kV"]]);
    det.appendChild(stdr);
    if (!this.compact) det.open = false;
    ctl.appendChild(det);
    P.appendChild(ctl);

    this.rebuildPower = function () {
      lp.innerHTML = "";
      var t = self.st.load, three = self.st.sys === 3;
      var pmax = { R: 10000, RL: 20000, smps: 5000, bridgeL: 10000, triac: 3000, pfc: 5000, six: 300000, twelve: 300000, vfd: 200000, custom: 10000 }[t];
      var pmin = t === "smps" ? 5 : t === "pfc" ? 50 : 100;
      self.ctlRange(lp, "P", (["smps", "vfd", "bridgeL", "six", "twelve"].indexOf(t) >= 0 ? "กำลังโหลดด้าน DC " : "กำลัง P ") + (three || F.LOADS[t].ph === 3 ? "(รวม 3 เฟส)" : ""), pmin, pmax, pmax > 20000 ? 500 : pmax > 4000 ? 50 : 5, function (v) { return si(v, "W"); }, null, null, true);
      if (t === "RL") self.ctlRange(lp, "pf", "เพาเวอร์แฟกเตอร์ (ล้าหลัง)", 0.3, 1, 0.01, null, null, null, true);
      if (t === "triac") self.ctlRange(lp, "al", "มุมจุดชนวน α", 0, 175, 1, function (v) { return v + "°"; }, null, null, true);
      if (t === "six" || t === "twelve") self.ctlRange(lp, "al", "มุมจุดชนวน α (0 = ไดโอด)", 0, 75, 1, function (v) { return v + "°"; }, null, null, true);
      if (t === "smps" || t === "vfd") self.ctlRange(lp, "C", "ตัวเก็บประจุ DC (µF)", 1, 4700, 1, function (v) { return v + " µF"; }, null, null, true);
      if (t === "vfd") self.ctlRange(lp, "Ldc", "โช้ก DC (mH)", 0, 10, 0.1, function (v) { return v + " mH"; }, null, null, true);
      if (t === "custom") self.ctlText(lp, "spec", "ฮาร์มอนิก h:%@องศา", "1:100, 3:80@180, 5:60", "fsl-expr", true);
    };
    this.rebuildPower();

    var dash = h("div", { cls: "fsl-dash" });
    var scope = h("div", { cls: "fsl-inst" });
    var sh = h("div", { cls: "fsl-inst-h" }, "<b>OSCILLOSCOPE</b><span class=\"mono\">ทริกเกอร์ CH1 ขาขึ้น 0 V</span>");
    scope.appendChild(sh);
    this.pScope = s("svg", { "class": "fsl-scope", role: "img", "aria-label": "จอออสซิลโลสโคปแสดงแรงดันและกระแส" }, scope);
    var sr = h("div", { cls: "fsl-row fsl-scope-ctl" });
    this.ctlSel(sr, "ch", "CH2 วัด", [["I", "กระแสที่ต้นทาง/PCC"], ["Il", "กระแสเข้าโหลด"], ["If", "กระแสในคาปาซิเตอร์/ฟิลเตอร์"]]);
    this.ctlChk(sr, "fund", "ฮาร์มอนิกหลักของ CH2");
    this.ctlChk(sr, "math", "MATH: p(t) = v·i");
    scope.appendChild(sr);
    this.pScopeTxt = h("div", { cls: "fsl-scope-txt mono" });
    scope.appendChild(this.pScopeTxt);
    dash.appendChild(scope);
    var an = h("div", { cls: "fsl-inst fsl-an" });
    an.appendChild(h("div", { cls: "fsl-inst-h" }, "<b>POWER ANALYZER</b><span class=\"mono\" data-an-title></span>"));
    this.pNums = h("div", { cls: "fsl-nums" });
    an.appendChild(this.pNums);
    dash.appendChild(an);
    P.appendChild(dash);

    var hf = h("figure", { cls: "fsl-plot fsl-hplot" });
    var hc = h("figcaption", {}, "<b>ฮาร์มอนิก</b> ");
    var seg = h("span", { cls: "fsl-seg" });
    [["pct", "% ของหลัก"], ["abs", "A / V"], ["v", "แรงดัน %"]].forEach(function (u) {
      var b = h("button", { type: "button", "data-u": u[0] }, u[1]);
      b.addEventListener("click", function () { self.st.unit = u[0]; self.render(); });
      seg.appendChild(b);
    });
    hc.appendChild(seg);
    hc.appendChild(h("span", { cls: "fsl-key k-lim" }, "ขีดจำกัด"));
    hc.appendChild(h("span", { cls: "fsl-key k-over" }, "เกิน"));
    hf.appendChild(hc);
    this.pH = s("svg", { "class": "fsl-svg", role: "img", "aria-label": "สเปกตรัมฮาร์มอนิกพร้อมขีดจำกัดมาตรฐาน" }, hf);
    this.pHSeg = seg;
    P.appendChild(hf);
    this.pDiag = h("div", { cls: "fsl-diag" });
    P.appendChild(this.pDiag);
    var steps = h("details", { cls: "fsl-steps" });
    steps.open = !this.compact;
    steps.appendChild(h("summary", {}, "เครื่องคำนวณอย่างไร: ทุกตัวเลขทีละขั้น"));
    this.pSteps = h("div", { cls: "fsl-steps-b" });
    steps.appendChild(this.pSteps);
    P.appendChild(steps);
    var tdet = h("details", { cls: "fsl-steps" });
    tdet.appendChild(h("summary", {}, "ตารางฮาร์มอนิก h = 1 ถึง 50"));
    this.pTable = h("div", { cls: "fsl-tw" });
    tdet.appendChild(this.pTable);
    P.appendChild(tdet);
  };

  Lab.prototype.powerModel = function () {
    var st = this.st, three = st.sys === 3 || F.LOADS[st.load].ph === 3, V = 230, f = st.f, w0 = TAU * f;
    var nph = F.LOADS[st.load].ph === 3 ? 3 : 1;          // a single-phase load stays single-phase even in a 3-phase system
    var Pph = st.P / nph, IL = Pph / V / (st.load === "RL" ? st.pf : (st.load === "six" || st.load === "twelve") ? Math.max(0.2, Math.cos(st.al * D2R)) : 1);
    IL = IL / (st.lpct / 100);                              // I_L = maximum demand current
    var Zsrc = V / (st.scr * IL), psi = Math.atan(st.xr), Ls = Zsrc * Math.sin(psi) / w0, Rs = Zsrc * Math.cos(psi);
    var Lr = st.react > 0 ? st.react / 100 * V / IL / w0 : 0;
    var key = JSON.stringify([st.load, st.P, st.pf, st.al, st.C, st.Ldc, st.scr, st.xr, st.react, st.f, st.lpct, st.spec, st.v5, st.sys]);
    var lm;
    if (this._pm && this._pm.key === key) lm = this._pm.lm;
    else {
      var spec = null;
      if (st.load === "custom") spec = String(st.spec).split(/[,;\s]+/).filter(Boolean).map(function (t) { var m = /^(\d+)\s*:\s*([-\d.]+)\s*(?:@\s*([-\d.]+))?/.exec(t); return m ? [+m[1], +m[2], +(m[3] || 0)] : null; }).filter(Boolean);
      var vbgArr = st.v5 > 0 ? [{ n: 5, X: F.C(0, -SQ2 * V * st.v5 / 100) }] : null;
      lm = F.loadModel(st.load, { V: V, f: f, P: st.P, pf: st.pf, alpha: st.al, Ls: Ls + Lr, Rs: Rs, C: st.C * 1e-6, Ldc: st.Ldc * 1e-3, spec: spec, Vh: vbgArr }, 200);
      this._pm = { key: key, lm: lm };
    }
    var vbg = null;
    if (st.v5 > 0) { vbg = {}; vbg[5] = F.C(0, -SQ2 * V * st.v5 / 100); }
    var cap = null;
    if (st.cap !== "none" && st.Qc > 0) {
      var pr = { plain: 0, det7: 0.07, det14: 0.14, tuned: 1 / (4.7 * 4.7) }[st.cap];
      cap = { Q: st.Qc * 1000 / (three ? 3 : 1), p: pr, qf: st.cap === "tuned" ? 40 : 60 };
    }
    var net = F.solveNetwork({ H: 200, V: V, f: f, IL: IL, scr: st.scr, xr: st.xr, damp: st.damp / 100, load: lm, cap: cap, af: st.af ? { hmax: 50, eff: st.afe } : null, vbg: vbg });
    return { net: net, lm: lm, IL: IL, V: V, three: three, nph: nph, Ls: Ls, Rs: Rs, Lr: Lr, cap: cap };
  };

  Lab.prototype.renderPower = function () {
    var st = this.st, self = this, md = this.powerModel(), net = md.net, ch = st.ch;
    if (ch === "If" && !md.cap) ch = "I";
    var m = F.metrics(net, ch === "If" ? "I" : ch, 50, md.IL), mLoad = F.metrics(net, "Il", 50, md.IL);
    var W = boxW(this.pH);
    // ---------------- scope
    var M = 1000, cyc = 2, vS = F.synth(net, "V", M, 200, true), iS = F.synth(net, ch, M, 200, true);
    var i1 = net.slice(0, 1), iF = F.synth(i1, ch, M, 1, false);
    // trigger: first rising zero crossing of v
    var z = 0;
    for (var j = 1; j < M; j++) if (vS[j - 1] < 0 && vS[j] >= 0) { z = j; break; }
    var sv = this.pScope, Wd = 640, Hd = 400;
    while (sv.firstChild) sv.removeChild(sv.firstChild);
    sv.setAttribute("viewBox", "0 0 " + Wd + " " + Hd);
    s("rect", { x: 0, y: 0, width: Wd, height: Hd, rx: 8, "class": "fsl-scr" }, sv);
    for (var gx = 1; gx < 10; gx++) s("line", { x1: Wd * gx / 10, x2: Wd * gx / 10, y1: 0, y2: Hd, "class": gx === 5 ? "fsl-sgc" : "fsl-sg" }, sv);
    for (var gy = 1; gy < 8; gy++) s("line", { x1: 0, x2: Wd, y1: Hd * gy / 8, y2: Hd * gy / 8, "class": gy === 4 ? "fsl-sgc" : "fsl-sg" }, sv);
    var vmax = 0, imax = 0, pmx = 0, k;
    for (k = 0; k < M; k++) { vmax = Math.max(vmax, Math.abs(vS[k])); imax = Math.max(imax, Math.abs(iS[k])); pmx = Math.max(pmx, Math.abs(vS[k] * iS[k])); }
    var step125 = function (x) { var p = Math.pow(10, Math.floor(Math.log10(x))), r = x / p; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * p; };
    var vdiv = step125(vmax / 3.4), idiv = step125(Math.max(imax, 1e-6) / 3.4), pdiv = step125(Math.max(pmx, 1e-6) / 3.4);
    var tdiv = cyc / st.f / 10;
    var toPts = function (arr, div) { var out = []; for (var q = 0; q <= cyc * M; q++) { var x = q / (cyc * M) * Wd, y = Hd / 2 - arr[(z + q) % M] / div * Hd / 8; out.push([x, Math.max(-20, Math.min(Hd + 20, y))]); } return out; };
    if (st.math) { var pp = new Float64Array(M); for (k = 0; k < M; k++) pp[k] = vS[k] * iS[k]; s("path", { d: pathD(toPts(pp, pdiv)), "class": "fsl-tm" }, sv); }
    if (st.fund) s("path", { d: pathD(toPts(iF, idiv)), "class": "fsl-t2f" }, sv);
    s("path", { d: pathD(toPts(vS, vdiv)), "class": "fsl-t1" }, sv);
    s("path", { d: pathD(toPts(iS, idiv)), "class": "fsl-t2" }, sv);
    var lab = function (x, y, t, c) { var e = s("text", { x: x, y: y, "class": "fsl-st " + (c || "") }, sv); e.textContent = t; };
    lab(10, 18, "CH1 v " + si(vdiv, "V") + "/div", "c1"); lab(10, 36, "CH2 i " + si(idiv, "A") + "/div", "c2");
    if (st.math) lab(10, 54, "M p " + si(pdiv, "W") + "/div", "cm");
    var tx = s("text", { x: Wd - 10, y: 18, "class": "fsl-st", "text-anchor": "end" }, sv); tx.textContent = "H " + si(tdiv, "s") + "/div";
    this.pScopeTxt.innerHTML = "<span class=\"c1\">CH1 = แรงดันเฟส ที่ PCC</span> · <span class=\"c2\">CH2 = " + { I: "กระแสต้นทาง (ที่ PCC)", Il: "กระแสเข้าโหลด", If: "กระแสคาปาซิเตอร์/ฟิลเตอร์" }[ch] + "</span>" + (st.fund ? " · <span class=\"c2\">ประ = ฮาร์มอนิกหลักของ CH2</span>" : "");
    // ---------------- analyzer numbers
    var iTrue = F.synth(net, ch, 2048, 200, false), ip = 0; for (k = 0; k < iTrue.length; k++) ip = Math.max(ip, Math.abs(iTrue[k]));
    var crest = m.Irms > 0 ? ip / m.Irms : 0;
    var sfx = md.nph === 3 ? " ต่อเฟส" : "", tot = md.nph === 3 ? 3 : 1;
    var lim = this.limits(md, m);
    var num = function (l, v, cls, t) { return '<div class="fsl-num ' + (cls || "") + '"' + (t ? ' title="' + esc(t) + '"' : "") + "><i>" + l + "</i><b>" + v + "</b></div>"; };
    this.root.querySelector("[data-an-title]").textContent = (md.nph === 3 ? "3 เฟส · ค่าต่อเฟส (รวม ×3)" : "1 เฟส") + " · " + st.f + " Hz";
    var In = m.In3;
    this.pNums.innerHTML =
      num("U rms", si(m.Vrms, "V")) + num("I rms", si(m.Irms, "A")) + num("I₁ (หลัก)", si(m.I1, "A")) + num("Crest factor I", fx(crest, 2), crest > 2 ? "warn" : "") +
      num("P" + sfx, si(m.P, "W"), "", "กำลังจริง = ΣV_hI_h cos θ_h") + num("Q₁" + sfx, si(m.Q1, "var"), "", "กำลังรีแอกทีฟของฮาร์มอนิกหลัก") + num("S" + sfx, si(m.S, "VA")) + num("D" + sfx, si(m.D, "VA"), m.D > 0.3 * m.S ? "warn" : "", "กำลังความเพี้ยน D = √(S² − P² − Q₁²)") +
      num("PF (จริง)", fx(m.PF, 3), m.PF < 0.85 ? "bad" : m.PF < 0.95 ? "warn" : "ok") + num("DPF = cos φ₁", fx(m.DPF, 3), m.DPF < 0.85 ? "bad" : "") +
      num("THD U", pc(m.THDv, 2), lim.vThd && m.THDv * 100 > lim.vThd ? "bad" : "ok") + num("THD I", pc(m.THDi, 1), m.THDi > 0.5 ? "bad" : m.THDi > 0.2 ? "warn" : "ok") +
      num("TDD", pc(m.TDD, 1), lim.tdd && m.TDD * 100 > lim.tdd ? "bad" : "", "THD เทียบกระแสสูงสุด I_L (IEEE 519)") + num("K-factor", fx(m.K, 2), m.K > 4 ? "warn" : "") +
      (md.nph === 1 ? num("I นิวทรัล (3 ชุด สมดุล)", si(In, "A"), In > m.Irms ? "bad" : "", "ถ้าต่อโหลดแบบนี้เท่ากันทั้ง 3 เฟส ฮาร์มอนิกลำดับศูนย์ (3, 9, 15…) รวมกันในนิวทรัล") : num("P รวม 3 เฟส", si(m.P * 3, "W")));
    // ---------------- harmonic bars
    var unit = st.unit, Hm = this.compact ? 31 : 50, vals = [], limv = [], over = [], yMax = 0;
    Array.prototype.forEach.call(this.pHSeg.children, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-u") === unit)); });
    for (k = 1; k <= Hm; k++) {
      var r = net[k - 1], I = F.cabs(ch === "If" ? r.If : r[ch]) / SQ2, Vv = F.cabs(r.V) / SQ2;
      var val = unit === "pct" ? I / m.I1 * 100 : unit === "abs" ? I : Vv / m.V1 * 100;
      vals.push(val);
      var L = unit === "v" ? lim.vInd(k) : lim.iInd(k, unit);
      limv.push(L);
      over.push(L !== null && k > 1 && val > L * 1.0001);
      if (k > 1) yMax = Math.max(yMax, val, L || 0);
    }
    yMax = yMax * 1.18 || 1;
    var hc = Chart(this.pH, W, Math.round(boxH(W, this.compact) * 0.9), { x0: 0.3, x1: Hm + 0.7, y0: 0, y1: yMax, xt: ticks(1, Hm, 10, function (t) { return String(Math.round(t)); }).filter(function (t) { return t[0] >= 1; }), yt: ticks(0, yMax, 5, unit === "abs" ? null : function (t) { return sig(t, 3) + "%"; }), xlab: "h", ylab: unit === "abs" ? "A rms" : unit === "v" ? "% ของ U₁" : "% ของ I₁" });
    for (k = 1; k <= Hm; k++) {
      var v = vals[k - 1];
      if (k === 1) { hc.bar(1, 0.62, 0, Math.min(v, yMax), "fsl-b fund", "h=1 " + (unit === "abs" ? si(v, "A") : fx(v, 1) + "%")); if (v > yMax) hc.text(1.6, yMax * 0.92, unit === "abs" ? si(v, "A") : fx(v, 0) + "%", "fsl-tk", "start"); continue; }
      if (v > yMax * 0.002) hc.bar(k, 0.62, 0, v, over[k - 1] ? "fsl-b over" : "fsl-b seq" + F.seq(k).replace("−", "n").replace("+", "p"), "h=" + k + " (" + si(k * st.f, "Hz") + ") " + (unit === "abs" ? si(v, "A") : fx(v, 2) + "%") + (limv[k - 1] !== null ? " · ขีดจำกัด " + fx(limv[k - 1], 2) + (unit === "abs" ? " A" : "%") : "") + " · ลำดับเฟส " + F.seq(k));
      if (limv[k - 1] !== null) hc.line([[k - 0.42, limv[k - 1]], [k + 0.42, limv[k - 1]]], "fsl-lim");
    }
    // ---------------- diagnosis + steps + table
    this.pDiag.innerHTML = this.diagnose(md, m, mLoad, lim, crest);
    if (this.pSteps.closest("details").open) this.pSteps.innerHTML = this.powerSteps(md, m, ch, lim, crest, ip);
    else this.pSteps.closest("details").ontoggle = function () { if (this.open) self.render(); };
    var trs = "";
    for (k = 1; k <= 50; k++) {
      var rr = net[k - 1], Ik = ch === "If" ? rr.If : rr[ch], Ia = F.cabs(Ik) / SQ2, Va = F.cabs(rr.V) / SQ2, li = lim.iInd(k, "pct");
      if (k > 1 && Ia < 1e-4 * m.I1 && Va < 1e-5 * m.V1) continue;
      var ok = li === null || k === 1 ? "" : (Ia / m.I1 * 100 > li ? '<span class="cs-bad">เกิน</span>' : '<span class="cs-ok">ผ่าน</span>');
      trs += "<tr><td>" + k + "</td><td>" + si(k * st.f, "Hz") + "</td><td>" + F.seq(k) + "</td><td>" + si(Va, "V") + "</td><td>" + fx(Va / m.V1 * 100, 2) + "</td><td>" + si(Ia, "A") + "</td><td>" + fx(Ia / m.I1 * 100, 2) + "</td><td>" + (Ia > 1e-6 ? deg(F.carg(Ik) - k * F.carg(net[0].V)) : "—") + "</td><td>" + (li === null || k === 1 ? "—" : fx(li, 2)) + "</td><td>" + ok + "</td></tr>";
    }
    this.pTable.innerHTML = '<table class="fsl-tab"><thead><tr><th>h</th><th>ความถี่</th><th>ลำดับ</th><th>U_h</th><th>% U₁</th><th>I_h</th><th>% I₁</th><th>มุม I_h (t = 0 ที่ U₁ ตัดศูนย์)</th><th>ขีดจำกัด (% I₁)</th><th></th></tr></thead><tbody>' + trs + "</tbody></table>";
  };

  /* limit functions for the selected standard */
  Lab.prototype.limits = function (md, m) {
    var st = this.st, out = { vThd: null, vInd: function () { return null; }, iInd: function () { return null; }, tdd: null, name: "" };
    if (st.std === "ieee") {
      var vl = F.ieeeVoltage(400), scaleIL = md.IL / (m.I1 || 1);
      out.name = "IEEE 519-2022 (Isc/I_L = " + st.scr + ")";
      out.vThd = vl.thd;
      out.vInd = function (h) { return h === 1 ? null : vl.ind; };
      out.iInd = function (h, unit) {
        var L = F.ieeeCurrent(h, st.scr).lim; if (L === null) return null;
        L = L * scaleIL;                                           // % of I_L → % of I₁
        return unit === "abs" ? L / 100 * m.I1 : L;
      };
      out.tdd = F.ieeeCurrent(5, st.scr).tdd;
    } else if (st.std === "iec") {
      out.name = "IEC 61000-3-2 Class A";
      out.iInd = function (h, unit) { var L = F.iecClassA(h); if (L === null) return null; return unit === "abs" ? L : L / (m.I1 || 1) * 100; };
      out.vThd = null;
    } else {
      out.name = "กฟภ./กฟน. 0.4 kV";
      out.vThd = 5;
      out.vInd = function (h) { return h === 1 ? null : h % 2 ? 4 : 2; };
    }
    return out;
  };

  Lab.prototype.diagnose = function (md, m, mL, lim, crest) {
    var st = this.st, net = md.net, msgs = [], t = st.load;
    var add = function (lvl, title, body) { msgs.push('<div class="fsl-msg ' + lvl + '"><b>' + title + "</b><span>" + body + "</span></div>"); };
    var dom = 0, domh = 0;
    for (var k = 2; k <= 50; k++) { var a = F.cabs(net[k - 1].Il); if (a > dom) { dom = a; domh = k; } }
    var domp = mL.I1 > 0 ? dom / SQ2 / mL.I1 * 100 : 0;
    if (mL.THDi < 0.05 && !md.cap) add("ok", "กระแสเกือบเป็นไซน์ (THD " + pc(mL.THDi, 1) + ")", "โหลดเชิงเส้น ฮาร์มอนิกในกระแสมาจากแรงดันต้นทางที่เพี้ยนเท่านั้น" + (st.v5 > 0 ? " ลองลดฮาร์มอนิกที่ 5 ของต้นทางเป็น 0 แล้วดูกระแสกลับเป็นไซน์" : ""));
    if (mL.THDi > 0.8) add("bad", "กระแสเป็นพัลส์แหลม THD " + pc(mL.THDi, 0), "โหลดชาร์จตัวเก็บประจุเฉพาะช่วงยอดแรงดัน กระแส RMS สูงกว่าฮาร์มอนิกหลัก " + fx(mL.Irms / mL.I1, 2) + " เท่า สายและหม้อแปลงร้อนกว่าที่กำลังจริงบอก · แก้: รีแอกเตอร์ 3–5 % โช้ก DC หรือ PFC <a href=\"/learn/fourier-series/mitigation/\">ดูวิธีแก้</a>");
    else if (mL.THDi > 0.25) add("warn", "ฮาร์มอนิกในกระแสสูง THD " + pc(mL.THDi, 0) + " ตัวเด่นคือ h = " + domh + " (" + fx(domp, 0) + " %)", t === "six" || t === "twelve" || t === "vfd" ? "เรกติไฟเออร์ p พัลส์สร้าง h = kp ± 1 <a href=\"/learn/fourier-series/rectifiers/#R6\">R6</a>" : "รูปคลื่นกระแสไม่ใช่ไซน์ <a href=\"/learn/fourier-series/power-harmonics/\">ดูผลต่อระบบ</a>");
    if (m.PF < 0.9 && m.DPF > 0.95) add("warn", "PF ต่ำ " + fx(m.PF, 2) + " ทั้งที่ cos φ₁ = " + fx(m.DPF, 2), "PF ต่ำเพราะความเพี้ยน ไม่ใช่เพราะเฟส คาปาซิเตอร์แก้ PF ช่วยไม่ได้และอาจเกิดเรโซแนนซ์ ต้องลดฮาร์มอนิก <a href=\"/learn/fourier-series/power-harmonics/#H7\">H7</a>");
    if (m.DPF < 0.85) add("warn", "กระแสฮาร์มอนิกหลักล้าหลังแรงดัน cos φ₁ = " + fx(m.DPF, 2), t === "triac" || t === "six" || t === "twelve" ? "การหน่วงมุมจุดชนวน α ทำให้ฮาร์มอนิกหลักล้าหลังแม้โหลดจะเป็นตัวต้านทาน (DPF ≈ cos α)" : "แก้ด้วยคาปาซิเตอร์ได้ แต่ถ้ามีโหลดไม่เชิงเส้นในระบบให้ใช้แบบดีจูน");
    if (md.nph === 1 && mL.trip * 3 > mL.Irms * 1.0 && mL.THDi > 0.3) add("bad", "นิวทรัลอาจร้อนกว่าสายเฟส: I_N ≈ " + si(mL.In3, "A") + " (" + fx(mL.In3 / mL.Irms * 100, 0) + " % ของกระแสเฟส)", "ถ้าต่อโหลดชนิดนี้ครบสามเฟสในระบบ 3 เฟส 4 สาย ฮาร์มอนิกที่ 3, 9, 15 (ลำดับศูนย์) ไม่หักล้างกันแต่บวกกันสามเท่าในนิวทรัล <a href=\"/learn/fourier-series/power-harmonics/#H10\">H10</a>");
    if (md.cap && net.res) {
      var hr = net.res.h, near = null;
      for (var hh = 2; hh <= 25; hh++) if (Math.abs(hr - hh) < 0.45 && F.cabs(net[hh - 1].Il) > 0.01 * F.cabs(net[0].Il)) near = hh;
      var amp = near ? F.cabs(net[near - 1].I) / F.cabs(net[near - 1].Il) : 0;
      if (st.cap === "plain") add(near ? "bad" : "warn", "เรโซแนนซ์ขนานที่ h ≈ " + fx(hr, 2) + (near ? " ชนฮาร์มอนิกที่ " + near + "! กระแสฮาร์มอนิกนี้ที่ต้นทางขยาย " + fx(amp, 1) + " เท่า" : ""), "h_r = √(S_sc/Q_c) = √(X_c/X_s) คาปาซิเตอร์อาจร้อน ฟิวส์ขาด หรือระเบิด · แก้: ใช้รีแอกเตอร์ดีจูน 7 % (จูนที่ 3.78) <a href=\"/learn/fourier-series/mitigation/#M4\">M4</a>");
      else add("ok", "แบงก์มีรีแอกเตอร์อนุกรม จูนที่ h = " + fx(net.tune, 2), "เรโซแนนซ์ขนานเลื่อนลงไปที่ h ≈ " + fx(hr, 2) + " ต่ำกว่าฮาร์มอนิกที่ 5 จึงปลอดภัย" + (st.cap === "tuned" ? " และดักกระแสที่ 5 ไว้ในฟิลเตอร์" : ""));
    }
    if (lim.vThd && m.THDv * 100 > lim.vThd) add("bad", "แรงดันที่ PCC เพี้ยน " + pc(m.THDv, 1) + " เกินเกณฑ์ " + lim.vThd + " %", "กระแสฮาร์มอนิกไหลผ่านอิมพีแดนซ์ของระบบ (Isc/I_L = " + st.scr + ") ระบบยิ่งอ่อนยิ่งเพี้ยน: V_h = I_h × hX_s <a href=\"/learn/fourier-series/power-harmonics/#H11\">H11</a>");
    if (st.std === "ieee" && lim.tdd && m.TDD * 100 > lim.tdd) add("bad", "TDD = " + pc(m.TDD, 1) + " เกิน IEEE 519 (" + lim.tdd + " % ที่ Isc/I_L = " + st.scr + ")", "ลดด้วยรีแอกเตอร์ โช้ก DC 12 พัลส์ ฟิลเตอร์จูน หรือฟิลเตอร์แอกทีฟ ลองเปิดเมนู “แก้ปัญหาฮาร์มอนิก” ด้านบน");
    if (st.std === "iec") { var fails = []; for (var q = 2; q <= 40; q++) { var L = F.iecClassA(q), I = F.cabs(net[q - 1].Il) / SQ2; if (L !== null && I > L) fails.push(q); } if (fails.length) add("bad", "ไม่ผ่าน IEC 61000-3-2 Class A ที่ h = " + fails.slice(0, 8).join(", "), "เครื่องใช้ไฟฟ้ากำลังสูงที่ดึงกระแสแหลมต้องมี PFC จึงจะขายในยุโรปได้"); else add("ok", "ผ่าน IEC 61000-3-2 Class A", "ขีดจำกัดเป็นแอมแปร์ (ไม่ใช่ %) เครื่องเล็กจึงผ่านง่าย"); }
    if (m.K > 4) add("warn", "K-factor = " + fx(m.K, 1), "ฮาร์มอนิกสูงทำให้หม้อแปลงมีความสูญเสียกระแสวน (∝ h²) เพิ่มขึ้น ใช้หม้อแปลง K-rated หรือลดพิกัด <a href=\"/learn/fourier-series/power-harmonics/#H9\">H9</a>");
    if (crest > 2.2) add("warn", "Crest factor " + fx(crest, 2), "มิเตอร์ที่ไม่ใช่ True RMS อ่านค่าผิด (มักต่ำกว่าจริง) และเบรกเกอร์อิเล็กทรอนิกส์บางรุ่นตอบสนองค่ายอด");
    var evenH = 0; for (var e = 2; e <= 20; e += 2) evenH = Math.max(evenH, F.cabs(net[e - 1].Il) / (F.cabs(net[0].Il) || 1));
    if (evenH > 0.02) add("warn", "มีฮาร์มอนิกคู่ " + fx(evenH * 100, 1) + " %", "รูปคลื่นไม่สมมาตรครึ่งคลื่น (บวก ≠ ลบ) เช่น เรียงกระแสครึ่งคลื่น หรือไดโอดในบริดจ์เสีย มี DC ไหลเข้าหม้อแปลงได้");
    if (!msgs.length) add("ok", "ไม่พบปัญหาเด่น", "ลองเลือกการทดลองสำเร็จรูปอื่น หรือปรับโหลดและระบบต้นทาง");
    return '<h4 class="fsl-dh">แปลผลอัตโนมัติ: เห็นอะไร หมายความว่าอะไร แก้อย่างไร</h4>' + msgs.join("");
  };

  Lab.prototype.powerSteps = function (md, m, ch, lim, crest, ip) {
    var net = md.net, st = this.st, rows = [], k, terms = [];
    for (k = 1; k <= 50; k++) { var I = F.cabs(net[k - 1][ch === "If" ? "If" : ch]) / SQ2; if (I > 1e-3 * m.I1) rows.push([k, I]); }
    var shown = rows.slice(0, 6);
    var sq = shown.map(function (r) { return sig(r[1], 3) + "²"; }).join(" + ") + (rows.length > 6 ? " + …" : "");
    var hsq = rows.filter(function (r) { return r[0] > 1; });
    var hs = hsq.slice(0, 5).map(function (r) { return sig(r[1], 3) + "²"; }).join(" + ") + (hsq.length > 5 ? " + …" : "");
    for (k = 1; k <= 7; k++) {
      var r = net[k - 1], V = r.V, Ii = r[ch === "If" ? "I" : ch], vm = F.cabs(V) / SQ2, im = F.cabs(Ii) / SQ2;
      if (vm * im < 1e-6 * Math.abs(m.P) && k > 1) continue;
      var th = F.carg(V) - F.carg(Ii);
      terms.push(sig(vm, 3) + "×" + sig(im, 3) + "×cos(" + fx(th / D2R, 1) + "°)");
    }
    var tripRows = rows.filter(function (r) { return r[0] % 3 === 0; });
    return '<ol class="fsl-ol">' +
      "<li><b>วิเคราะห์ฟูเรียร์</b> เครื่องวัดสุ่มสัญญาณ 10 คาบ (IEC 61000-4-7) แล้วทำ FFT ได้ค่า RMS ของแต่ละฮาร์มอนิก I_h <a href=\"/learn/fourier-series/dft-fft/#D8\">D8</a></li>" +
      "<li><b>ค่า RMS รวม</b> (พาร์เซวาล) I_rms = √(ΣI_h²) = √(" + sq + ") = <b>" + si(m.Irms, "A") + "</b></li>" +
      "<li><b>THD</b> = √(ΣI_h², h ≥ 2)/I₁ = √(" + (hs || "0") + ")/" + sig(m.I1, 4) + " = <b>" + pc(m.THDi, 1) + "</b> · THD_R (เทียบ I_rms) = " + pc(m.THDiR, 1) + " · TDD (เทียบ I_L = " + si(md.IL, "A") + ") = " + pc(m.TDD, 1) + "</li>" +
      "<li><b>กำลังจริง</b> มีเฉพาะแรงดันและกระแสที่ความถี่เดียวกัน: P = ΣU_hI_h cos θ_h = " + terms.join(" + ") + (terms.length < 4 ? "" : " + …") + " = <b>" + si(m.P, "W") + "</b> <a href=\"/learn/fourier-series/power-harmonics/#H4\">H4</a></li>" +
      "<li><b>กำลังปรากฏ</b> S = U_rms·I_rms = " + sig(m.Vrms, 4) + " × " + sig(m.Irms, 4) + " = " + si(m.S, "VA") + " · <b>Q₁</b> = U₁I₁ sin φ₁ = " + si(m.Q1, "var") + " · <b>D</b> = √(S² − P² − Q₁²) = " + si(m.D, "VA") + " <a href=\"/learn/fourier-series/power-harmonics/#H6\">H6</a></li>" +
      "<li><b>เพาเวอร์แฟกเตอร์</b> PF = P/S = " + fx(m.PF, 3) + " = cos φ₁ × I₁/I_rms = " + fx(m.DPF, 3) + " × " + fx(m.I1 / m.Irms, 3) + " (ส่วนหลังคือ 1/√(1 + THD²) เมื่อแรงดันเป็นไซน์) <a href=\"/learn/fourier-series/power-harmonics/#H7\">H7</a></li>" +
      "<li><b>Crest factor</b> = I_peak/I_rms = " + sig(ip, 4) + "/" + sig(m.Irms, 4) + " = " + fx(crest, 2) + " (ไซน์ = 1.41)</li>" +
      "<li><b>K-factor</b> = Σ(I_h²h²)/ΣI_h² = " + fx(m.K, 2) + " (ไซน์ = 1) <a href=\"/learn/fourier-series/power-harmonics/#H9\">H9</a></li>" +
      (md.nph === 1 ? "<li><b>นิวทรัล</b> ถ้ามีโหลดเหมือนกันทุกเฟส: I_N = 3√(I₃² + I₉² + …) = 3√(" + (tripRows.slice(0, 4).map(function (r) { return sig(r[1], 3) + "²"; }).join(" + ") || "0") + ") = " + si(m.In3, "A") + "</li>" : "") +
      "<li><b>แรงดันเพี้ยนที่ PCC</b> U_h = I_h × |Z_s(h)|, Z_s = " + sig(net.Rs, 3) + " + j" + sig(net.Xs, 3) + "·h Ω (Isc = " + si(net.Isc, "A") + ") → THD_U = " + pc(m.THDv, 2) + (lim.vThd ? " (เกณฑ์ " + lim.vThd + " %)" : "") + "</li>" +
      (net.res ? "<li><b>เรโซแนนซ์</b> h_r = √(X_c/(X_s + X_L)) = √(" + sig(net.Xc, 4) + "/(" + sig(net.Xs, 3) + " + " + sig(net.Xl || 0, 3) + ")) = " + fx(net.res.h, 2) + " · อิมพีแดนซ์ที่ h_r = " + si(net.res.Z, "Ω") + " (ปกติ " + si(net.res.Zs1 * net.res.h, "Ω") + ")</li>" : "") +
      "</ol>";
  };

  Lab.prototype.render = function () {
    var self = this;
    if (this._raf) return;
    this._raf = requestAnimationFrame(function () {
      self._raf = null;
      try {
        if (self.st.tab === "synth") self.renderSynth();
        else if (self.st.tab === "circuit") self.renderCircuit();
        else self.renderPower();
      } catch (e) { if (window.console) console.error(e); }
      if (self.root.hasAttribute("data-hash") && history.replaceState) {
        try { history.replaceState(null, "", "#lab=" + encodeState(self.st)); } catch (e2) { /* file: or sandboxed */ }
      }
    });
  };

  // ======================================================================= boot
  var labs = [];
  function boot() {
    document.querySelectorAll(".fs-lab").forEach(function (el) { if (!el._lab) { el._lab = new Lab(el); labs.push(el._lab); } });
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-fs-preset]");
      if (!b) return;
      var name = b.getAttribute("data-fs-preset"), target = b.getAttribute("data-fs-target") ? document.getElementById(b.getAttribute("data-fs-target")) : null;
      var lab = target && target._lab ? target._lab : labs.filter(function (l) { return l.tabs.indexOf((PRESETS[name] || {}).tab) >= 0; })[0];
      if (!lab) { location.href = LAB_URL + "#preset=" + name; return; }
      e.preventDefault();
      lab.load(name);
      lab.root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.addEventListener("hashchange", function () {
      var m2 = /[#&]preset=([\w-]+)/.exec(location.hash);
      if (m2 && labs[0] && labs[0].root.hasAttribute("data-hash")) labs[0].load(m2[1]);
    });
  }
  window.FSLab = { presets: PRESETS, encode: encodeState, decode: decodeState, labs: labs };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
