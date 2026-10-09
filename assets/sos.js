/* Second-order system lab — G(s) = K·ωn² / (s² + 2ζωn s + ωn²)
   y(t) = centre(t) + natural response of the transient, all in closed form. */
(function () {
  "use strict";
  var root = document.getElementById("lab2");
  if (!root) return;
  var NS = "http://www.w3.org/2000/svg";
  var MILES = [1, 2, 3, 4, 5];
  var FAMILY = [0.1, 0.3, 0.5, 0.707, 1, 2];
  var SERIES = ["s-cur", "s-p1", "s-p2"];

  // ------------------------------------------------------------ state
  var DEF = { input: "step", mode: "zw", z: 0.3, wn: 2, K: 1, A: 1, w: 1, y0: 1, v0: 0, R: 20, L: 100, C: 100, axis: "time", tmax: 10, tnorm: 20, pins: [] };
  var HDEF = { input: true, final: true, env: true, tau: true, peak: true, band: false, rise: false, period: false, fam: false };
  var S = JSON.parse(JSON.stringify(DEF)), H = JSON.parse(JSON.stringify(HDEF));
  var cursor = null, anim = null, dragging = false;

  // ------------------------------------------------------------ utils
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r3(v, n) { return +(+v).toPrecision(n || 3); }
  function sig(v, n) {
    if (!isFinite(v)) return v > 0 ? "∞" : v < 0 ? "−∞" : "—";
    if (Math.abs(v) < 1e-12) return "0";
    var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) { var e = Math.floor(Math.log10(a)); return r3(v / Math.pow(10, e), n || 3) + "×10" + sup(e); }
    var d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString();
  }
  function sup(n) { var m = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" }; return String(n).split("").map(function (c) { return m[c] || c; }).join(""); }
  function fmtT(t) {
    if (!isFinite(t)) return "∞";
    var a = Math.abs(t);
    if (a === 0) return "0 s";
    if (a < 1e-3) return sig(t * 1e6) + " µs";
    if (a < 1) return sig(t * 1e3) + " ms";
    return sig(t) + " s";
  }
  function pct(v, d) { return (v * 100).toFixed(d == null ? 1 : d) + "%"; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function zwOf(p) {
    if (p.mode === "rlc") {
      var L = p.L * 1e-3, C = p.C * 1e-6;
      var wn = 1 / Math.sqrt(L * C);
      return { z: (p.R / 2) * Math.sqrt(C / L), wn: wn };
    }
    return { z: p.z, wn: p.wn };
  }
  function regime(z) {
    if (z < 1e-6) return { key: "none", th: "ไม่มีการหน่วง", en: "undamped", note: "แกว่งตลอดไป" };
    if (z < 1 - 1e-6) return { key: "under", th: "หน่วงน้อย", en: "underdamped", note: "พุ่งเกินแล้วแกว่งลดลง" };
    if (z <= 1 + 1e-6) return { key: "crit", th: "หน่วงวิกฤต", en: "critically damped", note: "เร็วที่สุดโดยไม่พุ่งเกิน" };
    return { key: "over", th: "หน่วงมาก", en: "overdamped", note: "ช้า ไม่พุ่งเกิน" };
  }

  // ------------------------------------------------------------ model
  // natural response of y'' + 2ζωn y' + ωn² y = 0 with y(0)=a, y'(0)=b
  function natural(z, wn, a, b) {
    if (z < 1 - 1e-9) {
      var s = z * wn, wd = wn * Math.sqrt(1 - z * z), B = (b + s * a) / wd;
      var f = function (t) { return Math.exp(-s * t) * (a * Math.cos(wd * t) + B * Math.sin(wd * t)); };
      f.kind = "under"; f.sigma = s; f.wd = wd; f.amp = Math.sqrt(a * a + B * B);
      return f;
    }
    if (z <= 1 + 1e-9) {
      var c = b + wn * a;
      var g = function (t) { return Math.exp(-wn * t) * (a + c * t); };
      g.kind = "crit"; g.sigma = wn; g.a = a; g.c = c;
      return g;
    }
    var r = Math.sqrt(z * z - 1), s1 = -wn * (z - r), s2 = -wn * (z + r);
    var a1 = (b - s2 * a) / (s1 - s2), a2 = (s1 * a - b) / (s1 - s2);
    var h = function (t) { return a1 * Math.exp(s1 * t) + a2 * Math.exp(s2 * t); };
    h.kind = "over"; h.s1 = s1; h.s2 = s2; h.a1 = a1; h.a2 = a2;
    return h;
  }
  function Gjw(z, wn, w) { // complex frequency response of ωn²/(s²+2ζωn s+ωn²)
    var re = wn * wn - w * w, im = 2 * z * wn * w, d = re * re + im * im;
    return { mag: (wn * wn) / Math.sqrt(d), ph: -Math.atan2(im, re) };
  }
  function model(z, wn, K, p, light) {
    var A = p.A, m = { z: z, wn: wn, K: K, input: p.input, reg: regime(z) };
    var yt0 = 0, vt0 = 0;
    m.u = function () { return 0; };
    switch (p.input) {
      case "step":
        m.u = function () { return A; };
        m.centre = function () { return K * A; };
        yt0 = -K * A; vt0 = 0; m.yInf = K * A;
        break;
      case "impulse":
        m.centre = function () { return 0; };
        yt0 = 0; vt0 = K * A * wn * wn; m.yInf = 0;
        break;
      case "sine":
        var w = p.w, G = Gjw(z, wn, w);
        m.u = function (t) { return A * Math.sin(w * t); };
        if (!isFinite(G.mag) || G.mag > 1e9) { // undamped resonance: amplitude grows without bound
          m.resonant = true;
          m.centre = function () { return 0; };
          m.y = function (t) { return ((K * A) / 2) * (Math.sin(wn * t) - wn * t * Math.cos(wn * t)); };
        } else {
          var M = K * A * G.mag, ph = G.ph;
          m.M = M; m.ph = ph;
          m.centre = function (t) { return M * Math.sin(w * t + ph); };
          yt0 = -M * Math.sin(ph); vt0 = -M * w * Math.cos(ph);
        }
        m.yInf = null;
        break;
      default: // natural response from initial conditions
        m.centre = function () { return 0; };
        yt0 = p.y0; vt0 = p.v0; m.yInf = 0;
    }
    m.tr = natural(z, wn, yt0, vt0);
    if (!m.y) m.y = function (t) { return m.centre(t) + m.tr(t); };
    m.dy = function (t) { var h = 1e-5 / wn; return t < h ? (m.y(t + h) - m.y(t)) / h : (m.y(t + h) - m.y(t - h)) / (2 * h); };
    // decay time constant: envelope 1/(ζωn) when oscillating, dominant (slow) mode otherwise
    if (m.reg.key === "none") m.tau = Infinity;
    else if (m.tr.kind === "under") m.tau = 1 / m.tr.sigma;
    else if (m.tr.kind === "crit") m.tau = 1 / wn;
    else m.tau = -1 / m.tr.s1;
    if (m.tr.kind === "under" && !m.resonant) { m.wd = m.tr.wd; m.sigma = m.tr.sigma; m.Td = (2 * Math.PI) / m.wd; }
    m.metrics = light ? {} : metrics(m);
    return m;
  }
  function current() { var q = zwOf(S); return model(q.z, q.wn, S.K, S); }
  function pinModels() { return S.pins.map(function (pn) { return model(pn.z, pn.wn, pn.K, S); }); }

  // time-domain specs for the step (exact by search, plus the textbook formulas)
  function metrics(m) {
    var z = m.z, wn = m.wn, r = {};
    if (z > 0 && z < 1) {
      var wd = wn * Math.sqrt(1 - z * z);
      r.os = Math.exp((-z * Math.PI) / Math.sqrt(1 - z * z));
      r.tp = Math.PI / wd;
      r.tsApprox = 4 / (z * wn);
      r.wd = wd;
    }
    if (z === 0) { r.os = 1; r.tp = Math.PI / wn; }
    if (m.input !== "step") return r;
    var yI = m.yInf, Tsim = isFinite(m.tau) ? 14 * m.tau : (4 * Math.PI) / wn, N = 6000, last = 0, t10 = null, t90 = null, prev = 0;
    for (var i = 1; i <= N; i++) {
      var t = (i / N) * Tsim, y = m.y(t), f = y / yI;
      if (t10 == null && f >= 0.1) t10 = interp(prev, t, m, 0.1 * yI);
      if (t90 == null && f >= 0.9) t90 = interp(prev, t, m, 0.9 * yI);
      if (Math.abs(y - yI) > 0.02 * Math.abs(yI)) last = t;
      prev = t;
    }
    r.ts = isFinite(m.tau) ? last : Infinity; r.tr = t10 != null && t90 != null ? t90 - t10 : NaN; r.t10 = t10; r.t90 = t90;
    return r;
  }
  function interp(t0, t1, m, target) { // bisection on [t0, t1]
    for (var k = 0; k < 40; k++) { var tm = (t0 + t1) / 2; if (m.y(tm) / target >= 1) t1 = tm; else t0 = tm; }
    return (t0 + t1) / 2;
  }
  function freqMetrics(z, wn) {
    var r = { mn: 1 / (2 * Math.max(z, 1e-9)) };
    if (z < Math.SQRT1_2) { r.Mr = 1 / (2 * z * Math.sqrt(1 - z * z)); r.wr = wn * Math.sqrt(1 - 2 * z * z); }
    r.wb = wn * Math.sqrt(1 - 2 * z * z + Math.sqrt(4 * Math.pow(z, 4) - 4 * z * z + 2));
    return r;
  }

  // ------------------------------------------------------------ chart primitive
  var uid = 0;
  function Chart(host, o) {
    var box = el("div", "plot"); host.appendChild(box);
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", o.label || ""); svg.setAttribute("tabindex", "0");
    box.appendChild(svg);
    var id = "c2_" + (++uid), tip = el("div", "plot-tip"); tip.hidden = true; box.appendChild(tip);
    var c = { box: box, svg: svg, tip: tip, o: o, M: o.margin || { l: 54, r: 16, t: 14, b: 40 }, xd: [0, 1], yd: [0, 1] };
    c.size = function () {
      c.W = Math.max(260, Math.round(box.clientWidth));
      c.H = c.W < 560 ? Math.round(o.h * 0.8) : o.h;
      svg.setAttribute("viewBox", "0 0 " + c.W + " " + c.H); svg.setAttribute("width", c.W); svg.setAttribute("height", c.H);
    };
    var T = function (v, lg) { return lg ? Math.log10(v) : v; };
    c.X = function (v) { var a = T(c.xd[0], o.xlog), b = T(c.xd[1], o.xlog); return c.M.l + ((T(v, o.xlog) - a) / (b - a)) * (c.W - c.M.l - c.M.r); };
    c.Y = function (v) { var a = T(c.yd[0], o.ylog), b = T(c.yd[1], o.ylog); return c.H - c.M.b - ((T(v, o.ylog) - a) / (b - a)) * (c.H - c.M.t - c.M.b); };
    c.invX = function (px) { var a = T(c.xd[0], o.xlog), b = T(c.xd[1], o.xlog), v = a + ((px - c.M.l) / (c.W - c.M.l - c.M.r)) * (b - a); return o.xlog ? Math.pow(10, v) : v; };
    c.invY = function (py) { var a = T(c.yd[0], o.ylog), b = T(c.yd[1], o.ylog), v = a + ((c.H - c.M.b - py) / (c.H - c.M.t - c.M.b)) * (b - a); return o.ylog ? Math.pow(10, v) : v; };
    c.clip = 'clip-path="url(#' + id + ')"';
    c.arrow = "url(#ar" + id + ")";
    c.render = function (html) {
      svg.innerHTML = '<defs><clipPath id="' + id + '"><rect x="' + c.M.l + '" y="' + c.M.t + '" width="' + (c.W - c.M.l - c.M.r) + '" height="' + (c.H - c.M.t - c.M.b) + '"/></clipPath>' +
        '<marker id="ar' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="ah"/></marker></defs>' + html + '<g class="cur"></g>';
      c.cur = svg.querySelector("g.cur");
    };
    function pt(e) { var r = svg.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * c.W, y: ((e.clientY - r.top) / r.height) * c.H }; }
    c.pt = pt;
    svg.addEventListener("pointermove", function (e) { var p = pt(e); if (o.onMove) o.onMove(p, e); });
    svg.addEventListener("pointerdown", function (e) { var p = pt(e); if (o.onDown) o.onDown(p, e); else if (o.onMove) o.onMove(p, e); });
    svg.addEventListener("pointerup", function (e) { if (o.onUp) o.onUp(pt(e), e); });
    svg.addEventListener("pointerleave", function () { if (o.onLeave) o.onLeave(); });
    svg.addEventListener("keydown", function (e) { if (o.onKey && o.onKey(e)) e.preventDefault(); });
    return c;
  }
  function niceStep(span, n) { var raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; }
  function linTicks(a, b, n) { var s = niceStep(b - a, n), t = []; for (var v = Math.ceil(a / s) * s; v <= b + s * 1e-9; v += s) t.push(+v.toFixed(10)); return t; }
  function logTicks(a, b) { var t = []; for (var e = Math.ceil(Math.log10(a) - 1e-9); e <= Math.floor(Math.log10(b) + 1e-9); e++) t.push(Math.pow(10, e)); return t; }
  function niceDomain(lo, hi) {
    if (!isFinite(lo) || !isFinite(hi)) return [-1, 1];
    if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var s = niceStep(hi - lo, 5); return [Math.floor(lo / s) * s, Math.ceil(hi / s) * s];
  }
  function axes(c, xt, yt, xf, yf, xT, yT) {
    var h = "", L = c.M.l, R = c.W - c.M.r, Tp = c.M.t, B = c.H - c.M.b;
    yt.forEach(function (v) { var y = c.Y(v); if (y < Tp - 0.5 || y > B + 0.5) return; h += '<line class="grid" x1="' + L + '" x2="' + R + '" y1="' + y + '" y2="' + y + '"/><text class="tick" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + yf(v) + "</text>"; });
    xt.forEach(function (v) { var x = c.X(v); if (x < L - 0.5 || x > R + 0.5) return; h += '<line class="grid" x1="' + x + '" x2="' + x + '" y1="' + Tp + '" y2="' + B + '"/><text class="tick" x="' + x + '" y="' + (B + 16) + '" text-anchor="middle">' + xf(v) + "</text>"; });
    h += '<line class="axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + Tp + '" y2="' + B + '"/>';
    if (xT) h += '<text class="atitle" x="' + R + '" y="' + (c.H - 6) + '" text-anchor="end">' + xT + "</text>";
    if (yT) h += '<text class="atitle" x="' + (L + 6) + '" y="' + (Tp + 12) + '">' + yT + "</text>";
    return h;
  }
  function path(c, f, x0, x1, n, cls) {
    var d = "", pen = false, span = c.yd[1] - c.yd[0];
    for (var i = 0; i <= n; i++) {
      var xv = c.o.xlog ? Math.pow(10, Math.log10(x0) + (i / n) * (Math.log10(x1) - Math.log10(x0))) : x0 + (i / n) * (x1 - x0), yv = f(xv);
      if (!isFinite(yv)) { pen = false; continue; }
      if (c.o.ylog) yv = Math.max(yv, c.yd[0] * 0.5); else yv = clamp(yv, c.yd[0] - span * 2, c.yd[1] + span * 2);
      d += (pen ? "L" : "M") + c.X(xv).toFixed(1) + " " + c.Y(yv).toFixed(1); pen = true;
    }
    return '<path class="' + cls + '" d="' + d + '" ' + c.clip + "/>";
  }
  function pathXY(c, fx, fy, t0, t1, n, cls) {
    var d = "";
    for (var i = 0; i <= n; i++) { var t = t0 + (i / n) * (t1 - t0), x = fx(t), y = fy(t); if (!isFinite(x) || !isFinite(y)) continue; d += (d ? "L" : "M") + c.X(x).toFixed(1) + " " + c.Y(y).toFixed(1); }
    return '<path class="' + cls + '" d="' + d + '" ' + c.clip + "/>";
  }
  function line(c, x1, y1, x2, y2, cls, extra) { return '<line class="' + cls + '" x1="' + c.X(x1).toFixed(1) + '" y1="' + c.Y(y1).toFixed(1) + '" x2="' + c.X(x2).toFixed(1) + '" y2="' + c.Y(y2).toFixed(1) + '" ' + c.clip + (extra || "") + "/>"; }
  function text(x, y, s, cls, anchor) { return '<text class="' + (cls || "lab") + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || "start") + '">' + s + "</text>"; }
  function dot(c, x, y, cls, r) { return '<circle class="' + cls + '" cx="' + c.X(x).toFixed(1) + '" cy="' + c.Y(y).toFixed(1) + '" r="' + (r || 4.5) + '"/>'; }

  // ------------------------------------------------------------ charts
  var chMain, chS, chLog, chPhase, chMag, chPh, chOS;
  function norm() { return S.axis === "norm"; }
  function xSpan() { return norm() ? [0, S.tnorm] : [0, S.tmax]; }
  function tx(m, t) { return norm() ? t * m.wn : t; }
  function xt(m, x) { return norm() ? x / m.wn : x; }
  function xFmt(v) { return norm() ? sig(v, 2) : fmtT(v).replace(" ", "\u202f"); }
  function xTitle() { return norm() ? "ωₙt (rad)" : "t"; }
  function N(base) { return anim && anim.kind !== "play" ? Math.round(base / 2) : base; }

  function renderMain(ms) {
    var c = chMain, m = ms[0]; c.size(); c.xd = xSpan();
    var X0 = c.xd[0], X1 = c.xd[1], lo = Infinity, hi = -Infinity, n = 300;
    ms.forEach(function (mm) { for (var i = 0; i <= n; i++) { var v = mm.y(xt(mm, X0 + (i / n) * (X1 - X0))); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } });
    if (H.input && S.input === "step") { lo = Math.min(lo, S.A); hi = Math.max(hi, S.A); }
    if (m.yInf != null) { lo = Math.min(lo, m.yInf, 0); hi = Math.max(hi, m.yInf, 0); }
    c.yd = niceDomain(lo, hi);
    if (anim && anim.yd) c.yd = anim.yd; // keep the frame steady while sweeping ζ or ωn
    c.render("");
    var compact = c.W < 560, Lb = function (a, b) { return compact ? b : a; };
    var h = axes(c, linTicks(X0, X1, 6), linTicks(c.yd[0], c.yd[1], 5), xFmt, function (v) { return sig(v, 3); }, xTitle(), "y(t)");
    var Tp = c.M.t, B = c.H - c.M.b, reg = m.reg.key, yI = m.yInf;

    // family of ζ (neutral, labelled)
    if (H.fam) {
      FAMILY.forEach(function (zf) {
        var mf = model(zf, m.wn, m.K, S, true);
        h += path(c, function (x) { return mf.y(xt(mf, x)); }, X0, X1, N(300), "fam");
        var xl = X0 + (X1 - X0) * (zf < 1 ? 0.06 + 0.05 * FAMILY.indexOf(zf) : 0.5);
        if (!compact) h += text(c.X(xl), c.Y(mf.y(xt(mf, xl))) - 5, "ζ=" + zf, "lab fam-l", "middle");
      });
    }
    if (H.input && S.input !== "natural") {
      if (S.input === "impulse") {
        var xa = c.X(0) + 1;
        h += '<line class="h-input" x1="' + xa + '" x2="' + xa + '" y1="' + c.Y(0) + '" y2="' + (Tp + 6) + '" marker-end="' + c.arrow + '"/>';
        if (!compact) h += text(xa + 8, Tp + 18, "อินพุต " + sig(S.A) + "·δ(t)", "lab muted");
      } else h += path(c, function (x) { return m.u(xt(m, x)); }, X0, X1, N(400), "h-input");
    }
    if (H.final) {
      if (yI != null) {
        var yf = c.Y(yI);
        h += '<line class="h-final" x1="' + c.M.l + '" x2="' + (c.W - c.M.r) + '" y1="' + yf + '" y2="' + yf + '"/>';
        h += text(c.W - c.M.r - 4, yf + (S.input === "step" && H.input && Math.abs(S.A - yI) < 1e-9 ? 16 : -6), Lb("ค่าสุดท้าย y∞ = " + sig(yI), "y∞ = " + sig(yI)), "lab", "end");
      } else if (!m.resonant) h += path(c, function (x) { return m.centre(xt(m, x)); }, X0, X1, N(500), "h-final");
    }
    if (m.resonant) h += text((c.M.l + c.W - c.M.r) / 2, Tp + 30, "เรโซแนนซ์: ζ = 0 และ ω = ωn แอมพลิจูดโตขึ้นไม่สิ้นสุด", "lab acc", "middle");

    // exponential envelope and τ markers
    var tr = m.tr;
    if (H.env && !m.resonant && reg !== "none") {
      if (tr.kind === "under") {
        [1, -1].forEach(function (sgn) { h += path(c, function (x) { var t = xt(m, x); return m.centre(t) + sgn * tr.amp * Math.exp(-tr.sigma * t); }, X0, X1, N(300), "h-env"); });
        var xe = xt(m, X0 + (X1 - X0) * 0.55);
        if (!compact) h += text(c.X(tx(m, xe)) + 6, c.Y(m.centre(xe) + tr.amp * Math.exp(-tr.sigma * xe)) - 8, "เปลือก ±" + sig(tr.amp) + "·e^(−t/τ) , τ = 1/ζωn", "lab acc");
      } else if (tr.kind === "over") {
        h += path(c, function (x) { var t = xt(m, x); return m.centre(t) + tr.a1 * Math.exp(tr.s1 * t); }, X0, X1, N(300), "h-env");
        h += path(c, function (x) { var t = xt(m, x); return m.centre(t) + tr.a2 * Math.exp(tr.s2 * t); }, X0, X1, N(300), "h-env2");
        if (!compact) {
          var xs = xt(m, X0 + (X1 - X0) * 0.4);
          h += text(c.X(tx(m, xs)) + 6, c.Y(m.centre(xs) + tr.a1 * Math.exp(tr.s1 * xs)) + (tr.a1 < 0 ? 16 : -8), "โหมดช้า τ₁ = " + fmtT(-1 / tr.s1), "lab acc");
          var xf2 = Math.min(xt(m, X1) * 0.12, 2 / -tr.s2);
          h += text(c.X(tx(m, xf2)) + 8, c.Y(m.centre(xf2) + tr.a2 * Math.exp(tr.s2 * xf2)) + (tr.a2 < 0 ? 16 : -8), "โหมดเร็ว τ₂ = " + fmtT(-1 / tr.s2), "lab muted");
        }
      }
    }
    if (H.band && yI && reg !== "none" && !m.resonant) {
      var bw = 0.02 * Math.abs(yI);
      h += '<rect class="h-band" x="' + c.M.l + '" width="' + (c.W - c.M.l - c.M.r) + '" y="' + c.Y(yI + bw) + '" height="' + Math.max(1, c.Y(yI - bw) - c.Y(yI + bw)) + '"/>';
      var mt = m.metrics;
      if (mt.ts != null && tx(m, mt.ts) <= X1) {
        h += line(c, tx(m, mt.ts), c.yd[0], tx(m, mt.ts), m.y(mt.ts), "h-mark") + dot(c, tx(m, mt.ts), m.y(mt.ts), "pt-h", 4);
        h += text(c.X(tx(m, mt.ts)) + 6, B - 8, Lb("tₛ (2%) จริง = " + fmtT(mt.ts) + (mt.tsApprox ? " · สูตร 4/ζωn = " + fmtT(mt.tsApprox) : ""), "tₛ"), "lab");
      }
    }
    if (H.rise && S.input === "step" && m.metrics.t90 != null && tx(m, m.metrics.t90) <= X1) {
      var a = m.metrics.t10, b = m.metrics.t90, yb = c.Y(0.5 * yI) + 18;
      h += dot(c, tx(m, a), m.y(a), "pt-h", 4) + dot(c, tx(m, b), m.y(b), "pt-h", 4);
      h += '<line class="h-lag" x1="' + c.X(tx(m, a)) + '" x2="' + c.X(tx(m, b)) + '" y1="' + yb + '" y2="' + yb + '" marker-start="' + c.arrow + '" marker-end="' + c.arrow + '"/>';
      h += text(c.X(tx(m, b)) + 6, yb + 4, Lb("tᵣ 10→90% = " + fmtT(b - a), "tᵣ"), "lab");
    }
    if (H.period && m.Td && !m.resonant) {
      var k0 = 0;
      for (var k = 1; k <= 12; k++) {
        var tk = (k * Math.PI) / m.wd;
        if (tx(m, tk) > X1) break;
        h += dot(c, tx(m, tk), m.y(tk), k % 2 ? "pt-pk" : "pt-tr", 3.5);
        k0 = k;
      }
      if (k0 >= 3 && tx(m, 3 * Math.PI / m.wd) <= X1) {
        var p1 = Math.PI / m.wd, p3 = 3 * Math.PI / m.wd, yy = c.Y(m.y(p1)) - 16;
        h += '<line class="h-lag" x1="' + c.X(tx(m, p1)) + '" x2="' + c.X(tx(m, p3)) + '" y1="' + yy + '" y2="' + yy + '" marker-start="' + c.arrow + '" marker-end="' + c.arrow + '"/>';
        h += text((c.X(tx(m, p1)) + c.X(tx(m, p3))) / 2, yy - 6, Lb("คาบ T_d = 2π/ωd = " + fmtT(m.Td), "T_d"), "lab acc", "middle");
      }
    }
    if (H.tau && isFinite(m.tau) && !m.resonant) {
      MILES.forEach(function (k) {
        var x = tx(m, k * m.tau); if (x > X1) return;
        var px = c.X(x);
        h += '<line class="h-tau' + (k === 1 ? " one" : "") + '" x1="' + px + '" x2="' + px + '" y1="' + Tp + '" y2="' + B + '"/>';
        h += text(px, Tp + 12, k + "τ", "lab tauk", "middle");
      });
    }
    // series
    for (var i = ms.length - 1; i >= 0; i--) {
      (function (mm, k) {
        h += path(c, function (x) { return mm.y(xt(mm, x)); }, X0, X1, N(700), "ser " + SERIES[k]);
        if (k > 0 && !compact) {
          var tl = mm.metrics.tp && tx(mm, mm.metrics.tp) < X1 ? mm.metrics.tp : xt(mm, X1 * 0.85);
          h += text(c.X(tx(mm, tl)) + 8, c.Y(mm.y(tl)) - 8, "ζ=" + sig(mm.z, 2) + ", ωn=" + sig(mm.wn, 3), "lab");
        }
      })(ms[i], i);
    }
    if (H.tau && tr.kind === "under" && !m.resonant && H.env) {
      MILES.forEach(function (k) { var t = k * m.tau, x = tx(m, t); if (x <= X1) h += dot(c, x, m.centre(t) + tr.amp * Math.exp(-k), "pt-tau", 4); });
    }
    if (H.peak && S.input === "step" && m.metrics.tp && m.z < 1 && tx(m, m.metrics.tp) <= X1) {
      var tp = m.metrics.tp, yp = m.y(tp);
      h += line(c, tx(m, tp), yI, tx(m, tp), yp, "h-peak") + dot(c, tx(m, tp), yp, "pt-peak", 5);
      var up = yp >= yI;
      h += text(c.X(tx(m, tp)) - 10, c.Y(yp) + (up ? 4 : 14), Lb("%OS = " + pct(m.metrics.os) + " ที่ tₚ = " + fmtT(tp), pct(m.metrics.os)), "lab acc", "end");
    }
    c.render(h);
  }

  // s-plane with equal scaling, ωn circle, θ, σ, ωd, root locus of ζ; drag to set ζ & ωn
  var sDom = null;
  function renderS(ms) {
    var c = chS, m = ms[0]; c.size();
    var wmax = Math.max.apply(null, ms.map(function (mm) { return mm.wn; }));
    if (!dragging || !sDom) {
      // equal units on both axes so the ωn circle stays round; centre the region that must be visible
      var need = wmax * 1.2, pxW = c.W - c.M.l - c.M.r, pxH = c.H - c.M.t - c.M.b;
      var xa = -need, xb = need * 0.35, k = Math.max((xb - xa) / pxW, (2 * need) / pxH);
      sDom = { xd: [xb - k * pxW, xb], yd: [(-k * pxH) / 2, (k * pxH) / 2] }; // spare width goes to the left half-plane
    }
    c.xd = sDom.xd; c.yd = sDom.yd; c.render("");
    var compact = c.W < 380;
    var h = '<rect class="lhp" x="' + c.M.l + '" y="' + c.M.t + '" width="' + Math.max(0, c.X(0) - c.M.l) + '" height="' + (c.H - c.M.t - c.M.b) + '"/>';
    var st = niceStep(wmax * 1.2, 2);
    var ticksX = [], ticksY = [];
    for (var v = -10 * st; v <= 10 * st; v += st) { ticksX.push(+v.toFixed(10)); ticksY.push(+v.toFixed(10)); }
    h += axes(c, ticksX, ticksY, function (v) { return sig(v, 2); }, function (v) { return sig(v, 2); }, "σ (Re)", "jω (Im)");
    h += line(c, c.xd[0], 0, c.xd[1], 0, "axis0") + line(c, 0, c.yd[0], 0, c.yd[1], "axis0");
    var wn = m.wn, r = c.X(wn) - c.X(0);
    // root locus for ζ: 0 → 1 (circle), 1 → ∞ (real axis)
    h += '<path class="locus" d="M' + c.X(0) + " " + c.Y(wn) + " A" + r + " " + r + " 0 0 0 " + c.X(-wn) + " " + c.Y(0) + " A" + r + " " + r + " 0 0 0 " + c.X(0) + " " + c.Y(-wn) + '" ' + c.clip + "/>";
    h += line(c, c.xd[0], 0, -wn, 0, "locus");
    if (!compact) h += text(c.X(-wn * 0.7) , c.Y(wn * 0.72) - 6, "วงกลมรัศมี ωn = " + sig(wn), "lab muted", "end");
    // geometry of the current poles
    if (m.z < 1) {
      var sg = m.z * wn, wd = wn * Math.sqrt(1 - m.z * m.z);
      h += line(c, 0, 0, -sg, wd, "h-geo") + line(c, 0, 0, -sg, -wd, "h-geo");
      h += line(c, -sg, wd, -sg, 0, "h-proj") + line(c, -sg, wd, 0, wd, "h-proj");
      var th = Math.acos(m.z), ar = 34;
      h += '<path class="h-arc" d="M' + (c.X(0) - ar) + " " + c.Y(0) + " A" + ar + " " + ar + " 0 0 1 " + (c.X(0) - ar * Math.cos(th)) + " " + (c.Y(0) - ar * Math.sin(th)) + '"/>';
      h += text(c.X(0) - ar - 6, c.Y(0) - 14, "θ = " + sig((th * 180) / Math.PI, 3) + "°", "lab acc", "end");
      if (!compact) {
        h += text(c.X(-sg), c.Y(0) + 16, "−σ = −ζωn = " + sig(-sg, 3), "lab", "middle");
        var jl = c.X(0) + 6 + 70 > c.W - c.M.r;
        h += text(jl ? c.X(0) - 6 : c.X(0) + 6, c.Y(wd) + (jl ? -8 : 4), "jωd = " + sig(wd, 3), "lab", jl ? "end" : "start");
      }
    }
    for (var i = ms.length - 1; i >= 0; i--) {
      var mm = ms[i], pts = [];
      if (mm.z < 1) { var s1 = mm.z * mm.wn, w1 = mm.wn * Math.sqrt(1 - mm.z * mm.z); pts = [[-s1, w1], [-s1, -w1]]; }
      else if (mm.z <= 1 + 1e-9) pts = [[-mm.wn, 0], [-mm.wn, 0]];
      else { var rr = Math.sqrt(mm.z * mm.z - 1); pts = [[-mm.wn * (mm.z - rr), 0], [-mm.wn * (mm.z + rr), 0]]; }
      pts.forEach(function (p, j) {
        var x = c.X(p[0]), y = c.Y(p[1]), rad = 7;
        if (x < c.M.l) { h += text(c.M.l + 4, y - 10, "← s = " + sig(p[0], 3), "lab muted"); return; }
        h += '<path class="pole ' + SERIES[i] + '" d="M' + (x - rad) + " " + (y - rad) + "L" + (x + rad) + " " + (y + rad) + "M" + (x - rad) + " " + (y + rad) + "L" + (x + rad) + " " + (y - rad) + '"/>';
        if (i === 0 && j === 0) h += '<circle class="drag" cx="' + x + '" cy="' + y + '" r="16"/>';
      });
    }
    h += text(c.W - c.M.r - 6, c.H - c.M.b - 8, "ลากขั้วเพื่อปรับ ζ, ωn", "lab acc", "end");
    c.render(h);
  }
  function sFromPoint(p) {
    var re = Math.min(chS.invX(p.x), 0), im = Math.abs(chS.invY(p.y));
    var wn = Math.sqrt(re * re + im * im);
    if (wn < 1e-6) return;
    var z = clamp(-re / wn, 0, 1);
    if (im < (chS.yd[1] - chS.yd[0]) * 0.015) z = 1; // snap to the real axis → critical damping
    setZW(r3(z, 3), r3(wn, 3));
  }
  function setZW(z, wn) {
    if (S.mode === "rlc") { // keep L, solve C for ωn and R for ζ
      var L = S.L * 1e-3, C = 1 / (wn * wn * L);
      S.C = r3(clamp(C * 1e6, 0.01, 1e5), 3);
      var Cn = S.C * 1e-6; S.R = r3(clamp(2 * z * Math.sqrt(L / Cn), 0.01, 1e5), 3);
    } else { S.z = z; S.wn = wn; }
    syncControls(); update();
  }

  function renderLog(ms) {
    var c = chLog, m = ms[0]; c.size(); c.xd = xSpan();
    var tr = m.tr, ref = m.resonant ? 1 : tr.kind === "under" ? tr.amp : tr.kind === "over" ? Math.max(Math.abs(tr.a1), Math.abs(tr.a2), 1e-12) : Math.max(Math.abs(tr.a || 0), Math.abs(m.y(0) - m.centre(0)), 1e-12);
    if (tr.kind === "crit") { var mx = 0; for (var i = 0; i < 200; i++) { var tt = (i / 200) * 5 * m.tau; mx = Math.max(mx, Math.abs(tr(tt))); } ref = Math.max(ref, mx); }
    if (!(ref > 1e-12)) ref = 1;
    c.yd = [ref * 1e-3, ref * 2]; c.render("");
    var h = axes(c, linTicks(c.xd[0], c.xd[1], 5), logTicks(c.yd[0], c.yd[1]), xFmt, function (v) { return sig(v, 1); }, xTitle(), "|y − ส่วนคงตัว|");
    if (m.resonant || m.reg.key === "none") {
      h += text((c.M.l + c.W - c.M.r) / 2, c.M.t + 40, m.resonant ? "เรโซแนนซ์: ส่วนชั่วครู่ไม่ลดลง" : "ζ = 0: ไม่มีการลดลง เปลือกเป็นเส้นแนวนอน", "lab", "middle");
    }
    for (var j = ms.length - 1; j >= 0; j--) {
      (function (mm, k) { if (!mm.resonant) h += path(c, function (x) { var t = xt(mm, x); return Math.abs(mm.tr(t)); }, c.xd[0], c.xd[1], N(700), "ser thin " + SERIES[k]); })(ms[j], j);
    }
    if (!m.resonant) {
      if (tr.kind === "under") {
        h += path(c, function (x) { return tr.amp * Math.exp(-tr.sigma * xt(m, x)); }, c.xd[0], c.xd[1], 60, "h-env");
        var xm = tx(m, m.tau * 1.4);
        if (xm < c.xd[1]) h += text(c.X(xm) + 8, c.Y(tr.amp * Math.exp(-1.4)) - 8, "เปลือก: ความชัน −ζωn = −" + sig(tr.sigma) + " /s", "lab acc");
      } else if (tr.kind === "over") {
        h += path(c, function (x) { return Math.abs(tr.a1) * Math.exp(tr.s1 * xt(m, x)); }, c.xd[0], c.xd[1], 60, "h-env");
        h += path(c, function (x) { return Math.abs(tr.a2) * Math.exp(tr.s2 * xt(m, x)); }, c.xd[0], c.xd[1], 60, "h-env2");
        var xo = tx(m, m.tau * 1.2);
        if (xo < c.xd[1]) h += text(c.X(xo) + 8, c.Y(Math.abs(tr.a1) * Math.exp(tr.s1 * m.tau * 1.2)) - 8, "โหมดช้าครอบงำ ความชัน " + sig(tr.s1, 3) + " /s", "lab acc");
      }
      if (isFinite(m.tau)) MILES.forEach(function (k) { var x = tx(m, k * m.tau); if (x <= c.xd[1] && tr.kind === "under") h += dot(c, x, tr.amp * Math.exp(-k), "pt-tau", 4); });
    }
    c.render(h);
  }

  function renderPhase(ms) {
    var c = chPhase, m = ms[0]; c.size();
    var T1 = xt(m, xSpan()[1]), xs = [], vs = [];
    ms.forEach(function (mm) { var Tm = xt(mm, xSpan()[1]); for (var i = 0; i <= 300; i++) { var t = (i / 300) * Tm; xs.push(mm.y(t)); vs.push(mm.dy(t) / mm.wn); } });
    var lo = Math.min.apply(null, xs.concat([0])), hi = Math.max.apply(null, xs.concat([m.yInf || 0])), vlo = Math.min.apply(null, vs.concat([0])), vhi = Math.max.apply(null, vs.concat([0]));
    c.xd = niceDomain(lo, hi); c.yd = niceDomain(vlo, vhi); c.render("");
    var h = axes(c, linTicks(c.xd[0], c.xd[1], 5), linTicks(c.yd[0], c.yd[1], 4), function (v) { return sig(v, 2); }, function (v) { return sig(v, 2); }, "y", "ẏ/ωn");
    h += line(c, c.xd[0], 0, c.xd[1], 0, "axis0");
    for (var j = ms.length - 1; j >= 0; j--) {
      (function (mm, k) { var Tm = xt(mm, xSpan()[1]); h += pathXY(c, mm.y, function (t) { return mm.dy(t) / mm.wn; }, 0, Tm, N(700), "ser " + SERIES[k]); })(ms[j], j);
    }
    if (m.yInf != null) h += dot(c, m.yInf, 0, "pt-in", 5) + text(c.X(m.yInf) + 8, c.Y(0) + 16, "จุดสมดุล", "lab muted");
    h += dot(c, m.y(0), m.dy(0) / m.wn, "pt-h", 4) + text(c.X(m.y(0)) + 8, c.Y(m.dy(0) / m.wn) - 8, "เริ่ม", "lab muted");
    c.render(h);
  }

  function renderBode(ms) {
    var m = ms[0], wn = m.wn;
    [chMag, chPh].forEach(function (c) { c.size(); c.xd = [wn / 100, wn * 100]; });
    var fm = freqMetrics(m.z, wn), cm = chMag, cp = chPh;
    var peakDb = 20 * Math.log10(m.K * Math.max(fm.Mr || 1, 1, fm.mn));
    var top = Math.ceil((Math.min(peakDb, 40) + 6) / 10) * 10;
    cm.yd = [top - 80, top]; cm.render("");
    var h = axes(cm, logTicks(cm.xd[0], cm.xd[1]), linTicks(cm.yd[0], cm.yd[1], 6), function (v) { return sig(v, 2); }, function (v) { return v + " dB"; }, "ω (rad/s)", "ขนาด");
    var K0 = 20 * Math.log10(m.K);
    h += '<polyline class="h-tan" points="' + cm.X(cm.xd[0]) + "," + cm.Y(K0) + " " + cm.X(wn) + "," + cm.Y(K0) + " " + cm.X(cm.xd[1]) + "," + cm.Y(K0 - 80) + '" ' + cm.clip + "/>";
    if (H.fam) FAMILY.forEach(function (zf) { h += path(cm, function (w) { return 20 * Math.log10(m.K * Gjw(zf, wn, w).mag); }, cm.xd[0], cm.xd[1], N(240), "fam"); });
    for (var i = ms.length - 1; i >= 0; i--) {
      (function (mm, k) { h += path(cm, function (w) { return 20 * Math.log10(mm.K * Gjw(mm.z, mm.wn, w).mag); }, cm.xd[0], cm.xd[1], N(400), "ser " + SERIES[k]); })(ms[i], i);
    }
    var gwn = K0 + 20 * Math.log10(fm.mn), bc = cm.W < 620;
    h += dot(cm, wn, Math.min(gwn, top), "pt-tau", 4.5) + text(cm.X(wn) - 8, cm.Y(Math.min(gwn, top)) + 18, bc ? "ωn" : "ωn: |G| = 1/(2ζ) = " + sig(fm.mn, 3), "lab acc", "end");
    if (fm.Mr) { var gr = K0 + 20 * Math.log10(fm.Mr); h += dot(cm, fm.wr, Math.min(gr, top), "pt-peak", 5) + text(cm.X(fm.wr) - 8, cm.Y(Math.min(gr, top)) - 8, bc ? "Mr " + sig(20 * Math.log10(fm.Mr), 3) + " dB" : "Mr = " + sig(20 * Math.log10(fm.Mr), 3) + " dB ที่ ωr = " + sig(fm.wr, 3), "lab", "end"); }
    h += dot(cm, fm.wb, K0 - 3.0103, "pt-h", 4) + text(cm.X(fm.wb) + 8, cm.Y(K0 - 3) + 18, bc ? "ωb" : "แบนด์วิดท์ ωb = " + sig(fm.wb, 3) + " (−3 dB)", "lab muted");
    if (!bc) h += text(cm.X(wn * 10) + 6, cm.Y(K0 - 40) - 8, "−40 dB/ทศวรรษ", "lab muted");
    if (S.input === "sine" && S.w >= cm.xd[0] && S.w <= cm.xd[1]) { var gs = 20 * Math.log10(m.K * Gjw(m.z, wn, S.w).mag); h += dot(cm, S.w, clamp(gs, cm.yd[0], top), "pt-in", 5.5) + text(cm.X(S.w) - 8, cm.Y(clamp(gs, cm.yd[0], top)) + 20, "ω อินพุต", "lab", "end"); }
    cm.render(h);

    cp.yd = [-190, 10]; cp.render("");
    var g = axes(cp, logTicks(cp.xd[0], cp.xd[1]), [-180, -135, -90, -45, 0], function (v) { return sig(v, 2); }, function (v) { return v + "°"; }, "ω (rad/s)", "เฟส");
    g += '<polyline class="h-tan" points="' + cp.X(cp.xd[0]) + "," + cp.Y(0) + " " + cp.X(wn) + "," + cp.Y(0) + " " + cp.X(wn) + "," + cp.Y(-180) + " " + cp.X(cp.xd[1]) + "," + cp.Y(-180) + '" ' + cp.clip + "/>";
    if (H.fam) FAMILY.forEach(function (zf) { g += path(cp, function (w) { return (Gjw(zf, wn, w).ph * 180) / Math.PI; }, cp.xd[0], cp.xd[1], N(240), "fam"); });
    for (var j = ms.length - 1; j >= 0; j--) {
      (function (mm, k) { g += path(cp, function (w) { return (Gjw(mm.z, mm.wn, w).ph * 180) / Math.PI; }, cp.xd[0], cp.xd[1], N(400), "ser " + SERIES[k]); })(ms[j], j);
    }
    g += dot(cp, wn, -90, "pt-tau", 4.5) + text(cp.X(wn) + 8, cp.Y(-90) - 8, "−90° ที่ ωn เสมอ", "lab acc");
    if (S.input === "sine" && S.w >= cp.xd[0] && S.w <= cp.xd[1]) g += dot(cp, S.w, (Gjw(m.z, wn, S.w).ph * 180) / Math.PI, "pt-in", 5.5);
    cp.render(g);
  }

  function renderOS(ms) {
    var c = chOS, m = ms[0]; c.size(); c.xd = [0, 1.2]; c.yd = [0, 100]; c.render("");
    var h = axes(c, [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2], [0, 20, 40, 60, 80, 100], function (v) { return v; }, function (v) { return v + "%"; }, "ζ", "%OS");
    var os = function (z) { return z >= 1 ? 0 : 100 * Math.exp((-z * Math.PI) / Math.sqrt(1 - z * z)); };
    h += '<rect class="h-band" x="' + c.X(0.4) + '" y="' + c.M.t + '" width="' + (c.X(0.8) - c.X(0.4)) + '" height="' + (c.H - c.M.t - c.M.b) + '"/>';
    h += text(c.X(0.6), c.M.t + 14, "ช่วงที่นิยมออกแบบ 0.4–0.8", "lab muted", "middle");
    h += path(c, os, 0, 1.2, 240, "ser s-neutral");
    h += line(c, 0.707, 0, 0.707, os(0.707), "h-mark") + text(c.X(0.707) + 6, c.Y(os(0.707)) - 8, "0.707 → 4.3%", "lab muted");
    for (var i = ms.length - 1; i >= 0; i--) {
      var zz = Math.min(ms[i].z, 1.2);
      h += line(c, zz, 0, zz, os(zz), "h-mark") + '<circle class="pt-cur ' + SERIES[i] + '" cx="' + c.X(zz) + '" cy="' + c.Y(os(zz)) + '" r="6"/>';
    }
    var zl = Math.min(m.z, 1.2), right = zl > 0.85;
    h += text(c.X(zl) + (right ? -10 : 10), c.Y(os(zl)) + (os(m.z) > 80 ? 18 : -12), "ζ = " + sig(m.z, 3) + " → " + (m.z >= 1 ? "0%" : sig(os(m.z), 3) + "%") + (m.z > 1.2 ? " (นอกกราฟ)" : ""), "lab acc", right ? "end" : "start");
    c.render(h);
  }

  // ------------------------------------------------------------ cursor
  function drawCursor() {
    var m = current(), ms = [m].concat(pinModels());
    [chMain, chLog, chPhase].forEach(function (c) { if (c.cur) c.cur.innerHTML = ""; });
    chMain.tip.hidden = true; updateMiles(m);
    if (cursor == null) return;
    var t = cursor, x = tx(m, t);
    if (x < chMain.xd[0] || x > chMain.xd[1]) return;
    [chMain, chLog].forEach(function (c) { var px = c.X(x); c.cur.innerHTML = '<line class="hair" x1="' + px + '" x2="' + px + '" y1="' + c.M.t + '" y2="' + (c.H - c.M.b) + '"/>'; });
    var h = "";
    ms.forEach(function (mm, k) { var tt = norm() ? x / mm.wn : t; h += dot(chMain, x, mm.y(tt), "pt-cur " + SERIES[k], 5); });
    chMain.cur.innerHTML += h;
    chLog.cur.innerHTML += dot(chLog, x, Math.max(Math.abs(m.tr(t)), chLog.yd[0]), "pt-cur s-cur", 5);
    chPhase.cur.innerHTML = dot(chPhase, m.y(t), m.dy(t) / m.wn, "pt-cur s-cur", 6);
    var tip = chMain.tip; tip.textContent = "";
    var hd = el("div", "tt-head"); hd.appendChild(el("b", null, fmtT(t))); hd.appendChild(el("span", null, " · ωₙt = " + sig(t * m.wn, 3) + (isFinite(m.tau) ? " · t/τ = " + sig(t / m.tau, 3) : ""))); tip.appendChild(hd);
    ms.forEach(function (mm, k) {
      var tt = norm() ? x / mm.wn : t, row = el("div", "tt-row");
      row.appendChild(el("i", "key " + SERIES[k])); row.appendChild(el("b", null, sig(mm.y(tt), 4)));
      row.appendChild(el("span", null, k ? " ζ=" + sig(mm.z, 2) + ", ωn=" + sig(mm.wn, 3) : " y(t) ปัจจุบัน")); tip.appendChild(row);
    });
    var extra = [["dy/dt", sig(m.dy(t), 3) + " /s"]];
    if (m.yInf != null) extra.unshift(["ห่างจากค่าสุดท้าย", sig(m.y(t) - m.yInf, 3)]);
    if (m.tr.kind === "under") extra.push(["เปลือกเหลือ", pct(Math.exp(-m.tr.sigma * t))]);
    extra.forEach(function (r) { var row = el("div", "tt-row sub"); row.appendChild(el("b", null, r[1])); row.appendChild(el("span", null, " " + r[0])); tip.appendChild(row); });
    tip.hidden = false;
    var c = chMain, px = c.X(x), py = c.Y(m.y(t));
    tip.style.left = Math.max(4, px < c.W / 2 ? c.W - c.M.r - tip.offsetWidth - 8 : c.M.l + 8) + "px";
    tip.style.top = Math.max(4, py < c.H / 2 ? c.H - c.M.b - tip.offsetHeight - 8 : c.M.t + 8) + "px";
  }
  function onTimeMove(c) {
    return function (p) {
      if (anim && anim.kind === "play") return;
      if (p.x < c.M.l || p.x > c.W - c.M.r) { cursor = null; drawCursor(); return; }
      var m = current(); cursor = Math.max(0, xt(m, c.invX(p.x))); drawCursor();
    };
  }
  function onTimeKey(e) {
    var m = current(), step = (isFinite(m.tau) ? m.tau : 1 / m.wn) / 10;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { cursor = clamp((cursor || 0) + (e.key === "ArrowRight" ? step : -step), 0, xt(m, chMain.xd[1])); drawCursor(); return true; }
    if (e.key === "Escape") { cursor = null; drawCursor(); return true; }
    return false;
  }
  function leave() { if (anim && anim.kind === "play") return; cursor = null; drawCursor(); }

  // ------------------------------------------------------------ panels
  function updateMiles(m) {
    var box = $("miles2"), note = $("milesNote2");
    if (!box.children.length) MILES.forEach(function (k) {
      var d = el("div", "mile"); d.dataset.k = k;
      d.appendChild(el("span", "mile-k mono", k + "τ")); d.appendChild(el("b", "mile-p")); d.appendChild(el("span", "mile-t mono")); d.appendChild(el("span", "mile-y"));
      box.appendChild(d);
    });
    var fin = isFinite(m.tau) && !m.resonant;
    note.textContent = !fin ? "ζ = 0 ไม่มีการลดลง จึงไม่มีค่าคงตัวเวลา" : m.tr.kind === "under" ? "τ = 1/(ζωn) คือค่าคงตัวเวลาของเปลือก · % = ขอบเขตการแกว่งที่ยังเหลือ" : "τ = ค่าคงตัวเวลาของโหมดช้า (ครอบงำ) · % = ส่วนของโหมดช้าที่ยังเหลือ";
    [].forEach.call(box.children, function (d) {
      var k = +d.dataset.k, t = k * m.tau;
      d.querySelector(".mile-p").textContent = fin ? pct(Math.exp(-k)) : "—";
      d.querySelector(".mile-t").textContent = fin ? "t = " + fmtT(t) : "";
      d.querySelector(".mile-y").textContent = fin ? "y = " + sig(m.y(t), 4) : "";
      d.classList.toggle("passed", fin && cursor != null && cursor >= t - 1e-12);
    });
  }
  function stat(l, v, n) { var d = el("div", "stat"); d.appendChild(el("span", "stat-l", l)); d.appendChild(el("b", "stat-v", v)); if (n) d.appendChild(el("span", "stat-n", n)); return d; }
  function renderStats(m) {
    var box = $("stats2"); box.textContent = "";
    var z = m.z, wn = m.wn, mt = m.metrics, fm = freqMetrics(z, wn);
    box.appendChild(stat("อัตราส่วนการหน่วง ζ", sig(z, 3), m.reg.th));
    box.appendChild(stat("ความถี่ธรรมชาติ ωn", sig(wn, 3) + " rad/s", "f = " + sig(wn / (2 * Math.PI), 3) + " Hz"));
    if (z < 1) box.appendChild(stat("ความถี่แกว่ง ωd", sig(wn * Math.sqrt(1 - z * z), 3) + " rad/s", "ωn√(1−ζ²)"));
    box.appendChild(stat("ค่าคงตัวเวลา τ", isFinite(m.tau) ? fmtT(m.tau) : "∞", z < 1 ? "1/(ζωn) ของเปลือก" : "โหมดช้า"));
    if (S.input === "step") {
      box.appendChild(stat("พุ่งเกิน %OS", z < 1 ? pct(mt.os) : "0%", z < 1 ? "e^(−ζπ/√(1−ζ²))" : "ζ ≥ 1 ไม่พุ่งเกิน"));
      if (mt.tp) box.appendChild(stat("เวลาถึงยอด tₚ", fmtT(mt.tp), "π/ωd"));
      box.appendChild(stat("เวลาขึ้น 10→90%", fmtT(mt.tr), "ค่าจริงจากกราฟ"));
      box.appendChild(stat("เวลาเข้าที่ 2%", z > 0 ? fmtT(mt.ts) : "∞", mt.tsApprox ? "สูตรประมาณ 4/ζωn = " + fmtT(mt.tsApprox) : "ค่าจริงจากกราฟ"));
    }
    if (m.Td) box.appendChild(stat("คาบการแกว่ง T_d", fmtT(m.Td), "2π/ωd"));
    box.appendChild(stat("ขั้ว", z < 1 ? sig(-z * wn, 3) + " ± j" + sig(wn * Math.sqrt(1 - z * z), 3) : z <= 1 + 1e-9 ? sig(-wn, 3) + " (ซ้ำ)" : sig(m.tr.s1, 3) + ", " + sig(m.tr.s2, 3), z < 1 ? "θ = " + sig((Math.acos(z) * 180) / Math.PI, 3) + "°" : "บนแกนจริง"));
    box.appendChild(stat("ยอดเรโซแนนซ์ Mr", fm.Mr ? sig(20 * Math.log10(fm.Mr), 3) + " dB" : "ไม่มี", fm.Mr ? "ที่ ωr = " + sig(fm.wr, 3) : "ζ ≥ 0.707"));
    box.appendChild(stat("แบนด์วิดท์ ωb", sig(fm.wb, 3) + " rad/s", "จุด −3 dB"));
  }
  function renderTable(m) {
    var tb = $("tbl2").querySelector("tbody"); tb.textContent = "";
    var rows = [];
    if (isFinite(m.tau) && !m.resonant) [0, 0.5, 1, 2, 3, 4, 5].forEach(function (k) { rows.push([k + "τ", k * m.tau]); });
    if (m.metrics.tp) rows.push(["tₚ (ยอด)", m.metrics.tp]);
    if (!rows.length) for (var i = 0; i <= 6; i++) rows.push([sig(i * Math.PI / 2, 3) + " rad", (i * Math.PI) / 2 / m.wn]);
    rows.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (r) {
      var tr = document.createElement("tr");
      [r[0], fmtT(r[1]), sig(r[1] * m.wn, 3), sig(m.y(r[1]), 4), sig(m.dy(r[1]), 3)].forEach(function (v) { tr.appendChild(el("td", null, v)); });
      tb.appendChild(tr);
    });
  }
  function renderEq(m) {
    var K = sig(m.K, 3), wn = sig(m.wn, 4), wn2 = sig(m.wn * m.wn, 4), z2 = sig(2 * m.z * m.wn, 4);
    var g = "G(s) = \\dfrac{" + (m.K === 1 ? "" : K + "\\cdot") + wn2 + "}{s^2 + " + z2 + "\\,s + " + wn2 + "}";
    var p = "\\zeta = " + sig(m.z, 3) + ",\\quad \\omega_n = " + wn + "\\ \\text{rad/s}";
    var y, term = function (v, first) { var a = sig(Math.abs(v), 3); return (v < 0 ? "- " : first ? "" : "+ ") + a; };
    var head = m.yInf ? sig(m.yInf, 4) + " " : S.input === "sine" ? "y_{ss}(t) " : "";
    var ex = function (sg) { return sg > 1e-12 ? "\\,e^{-" + sig(sg, 3) + "t}" : ""; };
    if (m.resonant) y = "\\text{resonance: } y(t) = \\tfrac{KA}{2}(\\sin\\omega_n t - \\omega_n t\\cos\\omega_n t)";
    else if (m.tr.kind === "under") y = "y(t) = " + head + term(m.tr.amp, !head) + ex(m.tr.sigma) + "\\sin(" + sig(m.tr.wd, 3) + "t + \\phi)";
    else if (m.tr.kind === "crit") y = "y(t) = " + head + (head ? "+ " : "") + "\\big(" + term(m.tr.a, true) + " " + term(m.tr.c, false) + "\\,t\\big)\\,e^{-" + sig(m.wn, 3) + "t}";
    else y = "y(t) = " + (m.yInf ? sig(m.yInf, 4) + " " : S.input === "sine" ? "y_{ss}(t) " : "") + (m.tr.a1 < 0 ? "- " : "+ ") + sig(Math.abs(m.tr.a1), 3) + "e^{" + sig(m.tr.s1, 3) + "t} " + (m.tr.a2 < 0 ? "- " : "+ ") + sig(Math.abs(m.tr.a2), 3) + "e^{" + sig(m.tr.s2, 3) + "t}";
    [["eqG2", g], ["eqP2", p], ["eqY2", y]].forEach(function (q) {
      var node = $(q[0]);
      if (window.katex) { try { window.katex.render(q[1], node, { throwOnError: false }); return; } catch (e) {} }
      node.textContent = q[1];
    });
    var rg = $("regime2"); rg.textContent = m.reg.th + " · " + m.reg.en; rg.dataset.k = m.reg.key;
    $("regimeNote2").textContent = m.reg.note;
  }

  // ------------------------------------------------------------ controls
  function logSl(id, lo, hi) {
    var s = $(id);
    return { get: function () { return Math.pow(10, Math.log10(lo) + (+s.value / 1000) * (Math.log10(hi) - Math.log10(lo))); },
             set: function (v) { s.value = Math.round(((Math.log10(clamp(v, lo, hi)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * 1000); } };
  }
  // ζ slider: 0–700 → 0…1 (fine), 700–1000 → 1…3
  var zSl = { get: function () { var v = +$("sZ").value; return v <= 700 ? v / 700 : 1 + ((v - 700) / 300) * 2; },
              set: function (z) { $("sZ").value = Math.round(z <= 1 ? z * 700 : 700 + ((Math.min(z, 3) - 1) / 2) * 300); } };
  var sl = { wn: logSl("sWn", 0.1, 100), w: logSl("sW2", 0.01, 1000), R: logSl("sR2", 0.1, 10000), L: logSl("sL2", 1, 10000), C: logSl("sC2", 0.1, 10000) };

  function seg(id, v) { $(id).querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"); }); }
  function syncControls() {
    seg("inSeg2", S.input); seg("modeSeg2", S.mode); seg("axisSeg2", S.axis);
    var q = zwOf(S);
    zSl.set(q.z); sl.wn.set(q.wn); sl.w.set(S.w); sl.R.set(S.R); sl.L.set(S.L); sl.C.set(S.C);
    $("nZ").value = sig(q.z, 3); $("nWn").value = sig(q.wn, 3);
    $("sK2").value = S.K; $("sA2").value = S.A; $("sY02").value = S.y0; $("sV02").value = S.v0;
    $("nTmax2").value = norm() ? sig(S.tnorm, 3) : sig(S.tmax, 3);
    $("tmaxLabel2").textContent = norm() ? "แสดงถึง ωₙt (rad)" : "แสดงถึง (วินาที)";
    root.querySelectorAll("[data-mode2]").forEach(function (d) { d.hidden = d.dataset.mode2 !== S.mode; });
    root.querySelectorAll("[data-for2]").forEach(function (d) { d.hidden = d.dataset.for2.split(" ").indexOf(S.input) < 0; });
    Object.keys(H).forEach(function (k) { var cb = $("h2_" + k); if (cb) cb.checked = H[k]; });
    $("nZ").disabled = $("sZ").disabled = $("nWn").disabled = $("sWn").disabled = S.mode === "rlc";
    readouts();
  }
  function readouts() {
    var q = zwOf(S);
    $("vK2").textContent = sig(S.K, 3); $("vA2").textContent = sig(S.A, 3); $("vY02").textContent = sig(S.y0, 3); $("vV02").textContent = sig(S.v0, 3);
    $("vW2").textContent = sig(S.w, 3) + " rad/s"; $("vR2").textContent = sig(S.R, 3) + " Ω"; $("vL2").textContent = sig(S.L, 3) + " mH"; $("vC2").textContent = sig(S.C, 3) + " µF";
    $("rlcRead").textContent = S.mode === "rlc" ? "ωn = 1/√(LC) = " + sig(q.wn, 4) + " rad/s · ζ = (R/2)√(C/L) = " + sig(q.z, 3) : "";
    root.querySelectorAll("#zPresets button").forEach(function (b) { b.setAttribute("aria-pressed", Math.abs(+b.dataset.z - q.z) < 1e-6 ? "true" : "false"); });
    $("pinBtn2").disabled = S.pins.length >= 2;
    var pl = $("pinList2"); pl.textContent = "";
    S.pins.forEach(function (pn, i) {
      var chip = el("span", "pin"); chip.appendChild(el("i", "key " + SERIES[i + 1]));
      chip.appendChild(document.createTextNode("ζ = " + sig(pn.z, 3) + ", ωn = " + sig(pn.wn, 3)));
      var x = el("button", "pin-x", "×"); x.type = "button"; x.setAttribute("aria-label", "ลบเส้นเปรียบเทียบ");
      x.addEventListener("click", function () { S.pins.splice(i, 1); update(); }); chip.appendChild(x); pl.appendChild(chip);
    });
    var lg = $("legend2"); lg.textContent = "";
    [["s-cur", "ปัจจุบัน ζ = " + sig(q.z, 3) + ", ωn = " + sig(q.wn, 3)]].concat(S.pins.map(function (pn, i) { return [SERIES[i + 1], "ζ = " + sig(pn.z, 3) + ", ωn = " + sig(pn.wn, 3)]; }))
      .forEach(function (it) { var s = el("span", "lg"); s.appendChild(el("i", "key " + it[0])); s.appendChild(document.createTextNode(it[1])); lg.appendChild(s); });
    if (H.fam) { var s = el("span", "lg"); s.appendChild(el("i", "key fam-k")); s.appendChild(document.createTextNode("ชุด ζ = 0.1 … 2")); lg.appendChild(s); }
  }
  function bindSeg(id, key, after) {
    $(id).addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; var old = S[key]; S[key] = b.dataset.v; if (after) after(old); syncControls(); update(); });
  }
  bindSeg("inSeg2", "input");
  bindSeg("modeSeg2", "mode", function (old) {
    var q = zwOf(Object.assign({}, S, { mode: old }));
    // ζ,ωn ← RLC keeps the curve; RLC uses its own component values (default: 20 Ω, 100 mH, 100 µF)
    if (S.mode === "zw") { S.z = r3(q.z, 3); S.wn = r3(q.wn, 3); }
    S.pins = []; cursor = null; fit();
  });
  bindSeg("axisSeg2", "axis");
  function onIn(id, fn) { $(id).addEventListener("input", function () { fn(); readouts(); update(); }); }
  onIn("sZ", function () { S.z = r3(zSl.get(), 3); $("nZ").value = S.z; });
  onIn("sWn", function () { S.wn = r3(sl.wn.get(), 3); $("nWn").value = S.wn; });
  $("nZ").addEventListener("change", function () { var v = parseFloat(this.value); if (v >= 0) { S.z = clamp(v, 0, 10); zSl.set(S.z); update(); } });
  $("nWn").addEventListener("change", function () { var v = parseFloat(this.value); if (v > 0) { S.wn = clamp(v, 1e-3, 1e6); sl.wn.set(S.wn); update(); } });
  onIn("sW2", function () { S.w = r3(sl.w.get(), 3); });
  onIn("sR2", function () { S.R = r3(sl.R.get(), 3); });
  onIn("sL2", function () { S.L = r3(sl.L.get(), 3); });
  onIn("sC2", function () { S.C = r3(sl.C.get(), 3); });
  onIn("sK2", function () { S.K = +$("sK2").value; });
  onIn("sA2", function () { S.A = +$("sA2").value; });
  onIn("sY02", function () { S.y0 = +$("sY02").value; });
  onIn("sV02", function () { S.v0 = +$("sV02").value; });
  $("zPresets").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var q = zwOf(S); setZW(+b.dataset.z, q.wn);
  });
  $("nTmax2").addEventListener("change", function () { var v = parseFloat(this.value); if (v > 0) { if (norm()) S.tnorm = v; else S.tmax = v; update(); } });
  $("fitBtn2").addEventListener("click", function () { fit(); syncControls(); update(); });
  function fit() {
    var ms = [current()].concat(pinModels()), T = 0;
    ms.forEach(function (m) {
      var t = m.reg.key === "none" ? 6 * Math.PI / m.wn : Math.max(isFinite(m.metrics.ts) && m.metrics.ts ? m.metrics.ts * 1.4 : 0, 5 * m.tau, m.Td ? 3 * m.Td : 0);
      if (S.input === "sine") t = Math.max(t, (8 * Math.PI) / S.w);
      T = Math.max(T, Math.min(t, 50 * m.tau || t));
    });
    S.tmax = r3(T, 2);
    var m0 = ms[0]; S.tnorm = r3(T * m0.wn, 2);
  }
  Object.keys(H).forEach(function (k) { var cb = $("h2_" + k); if (cb) cb.addEventListener("change", function () { H[k] = cb.checked; readouts(); update(); }); });
  $("pinBtn2").addEventListener("click", function () { if (S.pins.length >= 2) return; var q = zwOf(S); S.pins.push({ z: r3(q.z, 3), wn: r3(q.wn, 4), K: S.K }); readouts(); update(); });
  $("resetBtn2").addEventListener("click", function () { stopAnim(); S = JSON.parse(JSON.stringify(DEF)); H = JSON.parse(JSON.stringify(HDEF)); cursor = null; syncControls(); update(); });
  $("shareBtn2").addEventListener("click", function () {
    writeHash(); var b = this, old = b.textContent, done = function () { b.textContent = "คัดลอกลิงก์แล้ว ✓"; setTimeout(function () { b.textContent = old; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });

  // ------------------------------------------------------------ animations
  var labels = { play: "▶ เล่นตามเวลา", z: "กวาด ζ 0 → 1.5", w: "กวาด ωn ×½ → ×2" };
  function stopAnim() {
    if (!anim) return;
    cancelAnimationFrame(anim.raf);
    if (anim.restore) anim.restore();
    var k = anim.kind; anim = null;
    $(k === "play" ? "playBtn2" : k === "z" ? "sweepZ" : "sweepW").textContent = labels[k];
    update();
  }
  function startAnim(kind, btn) {
    if (anim) { var same = anim.kind === kind; stopAnim(); if (same) return; }
    var q = zwOf(S), dur = kind === "play" ? 6000 : 7000, t0 = performance.now();
    var m0 = current();
    anim = { kind: kind };
    if (kind !== "play") {
      var mode0 = S.mode, z0 = S.z, w0 = S.wn;
      if (S.mode === "rlc") { S.mode = "zw"; S.z = q.z; S.wn = q.wn; }
      var z1 = S.z, w1 = S.wn;
      anim.restore = function () { S.mode = mode0; S.z = z0; S.wn = w0; syncControls(); };
      // freeze the y-frame to the widest response of the sweep
      var lo = Infinity, hi = -Infinity;
      [0.02, 0.1, 0.3, 1, 1.5].forEach(function (zz) {
        var mm = kind === "z" ? model(zz, w1, S.K, S, true) : model(z1, w1 * (zz < 0.5 ? 0.5 : 2), S.K, S, true);
        for (var i = 0; i <= 200; i++) { var v = mm.y(xt(mm, (i / 200) * xSpan()[1])); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
      });
      if (!(kind === "w" && norm())) anim.yd = niceDomain(Math.min(lo, 0), hi); // on the ωₙt axis an ωn sweep must look frozen
    }
    btn.textContent = "❚❚ หยุด";
    (function frame(now) {
      if (!anim) return;
      var f = Math.min(1, (now - t0) / dur);
      if (kind === "play") {
        cursor = f * xt(m0, chMain.xd[1]); drawCursor();
      } else {
        if (kind === "z") S.z = r3(0.02 + f * 1.48, 3);
        else S.wn = r3(w1 * Math.pow(2, -1 + 2 * f), 3);
        syncControls(); renderAll();
      }
      if (f < 1) anim.raf = requestAnimationFrame(frame);
      else { var k2 = anim.kind, rs = anim.restore; anim = null; btn.textContent = labels[k2]; if (rs) rs(); if (k2 !== "play") update(); }
    })(t0);
  }
  $("playBtn2").addEventListener("click", function () { startAnim("play", this); });
  $("sweepZ").addEventListener("click", function () { startAnim("z", this); });
  $("sweepW").addEventListener("click", function () { startAnim("w", this); });

  // ------------------------------------------------------------ URL state
  function writeHash() {
    var q = ["in=" + S.input, "m=" + S.mode, "z=" + S.z, "wn=" + S.wn, "K=" + S.K, "A=" + S.A, "w=" + S.w, "y0=" + S.y0, "v0=" + S.v0, "R=" + S.R, "L=" + S.L, "C=" + S.C, "ax=" + S.axis, "tmax=" + S.tmax, "tn=" + S.tnorm];
    if (S.pins.length) q.push("p=" + S.pins.map(function (p) { return p.z + ":" + p.wn + ":" + p.K; }).join(","));
    history.replaceState(null, "", "#" + q.join("&"));
  }
  function readHash() {
    if (!location.hash || location.hash.length < 3) return false;
    location.hash.slice(1).split("&").forEach(function (kv) {
      var p = kv.split("="), k = p[0], v = decodeURIComponent(p[1] || ""), n = parseFloat(v);
      if (k === "in" && /^(step|impulse|sine|natural)$/.test(v)) S.input = v;
      else if (k === "m" && /^(zw|rlc)$/.test(v)) S.mode = v;
      else if (k === "ax" && /^(time|norm)$/.test(v)) S.axis = v;
      else if (k === "tn" && n > 0) S.tnorm = n;
      else if (k === "p") S.pins = v.split(",").slice(0, 2).map(function (s) { var a = s.split(":"); return { z: +a[0], wn: +a[1], K: a[2] != null ? +a[2] : 1 }; }).filter(function (q) { return q.z >= 0 && q.wn > 0; });
      else if (["z", "wn", "K", "A", "w", "y0", "v0", "R", "L", "C", "tmax"].indexOf(k) >= 0 && isFinite(n)) S[k] = n;
    });
    S.z = clamp(S.z, 0, 10); S.wn = clamp(S.wn, 1e-3, 1e6); S.tmax = Math.max(S.tmax, 1e-6);
    return true;
  }

  // ------------------------------------------------------------ render
  var hashT;
  function renderAll() {
    var m = current(), ms = [m].concat(pinModels());
    renderMain(ms); renderS(ms); renderLog(ms); renderPhase(ms); renderBode(ms); renderOS(ms);
    renderStats(m); renderEq(m); readouts(); updateMiles(m);
    return m;
  }
  function update() {
    if (anim && anim.kind === "play") { cancelAnimationFrame(anim.raf); $("playBtn2").textContent = labels.play; anim = null; }
    var m = renderAll(); renderTable(m); drawCursor();
    clearTimeout(hashT); hashT = setTimeout(writeHash, 400);
  }

  chMain = Chart($("chartMain2"), { h: 420, label: "ผลตอบสนองทางเวลาของระบบอันดับสอง พร้อมเปลือกเอกซ์โพเนนเชียลและเส้นแบ่งทุกช่วง τ", margin: { l: 56, r: 16, t: 22, b: 42 }, onKey: onTimeKey, onLeave: leave });
  chMain.o.onMove = onTimeMove(chMain);
  chS = Chart($("chartS2"), { h: 320, label: "ตำแหน่งขั้วบนระนาบ s ลากเพื่อปรับ ζ และ ωn", margin: { l: 46, r: 14, t: 14, b: 40 },
    onDown: function (p, e) { dragging = true; try { chS.svg.setPointerCapture(e.pointerId); } catch (x) {} sFromPoint(p); },
    onMove: function (p) { if (dragging) sFromPoint(p); },
    onUp: function () { dragging = false; update(); },
    onKey: function (e) {
      var q = zwOf(S);
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { setZW(r3(clamp(q.z + (e.key === "ArrowLeft" ? 0.02 : -0.02), 0, 3), 3), q.wn); return true; }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { setZW(q.z, r3(q.wn * (e.key === "ArrowUp" ? 1.05 : 1 / 1.05), 3)); return true; }
      return false;
    } });
  chLog = Chart($("chartLog2"), { h: 260, ylog: true, label: "ส่วนชั่วครู่บนสเกลลอการิทึม", onKey: onTimeKey, onLeave: leave });
  chLog.o.onMove = onTimeMove(chLog);
  chPhase = Chart($("chartPhase2"), { h: 260, label: "ระนาบเฟส y กับ dy/dt หารด้วย ωn" });
  chMag = Chart($("chartBode2"), { h: 230, xlog: true, label: "Bode ขนาด" });
  chPh = Chart($("chartBode2"), { h: 210, xlog: true, label: "Bode เฟส" });
  chOS = Chart($("chartOS2"), { h: 260, label: "เปอร์เซ็นต์พุ่งเกินเทียบกับ ζ" });

  var fromHash = readHash();
  if (!fromHash) fit();
  syncControls(); update();
  var ro = new ResizeObserver(function () { clearTimeout(ro.t); ro.t = setTimeout(function () { if (!anim) update(); }, 80); });
  ro.observe(root);
})();
