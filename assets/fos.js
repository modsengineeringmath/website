/* First-order system lab — G(s) = K / (τs + 1)
   τ·dy/dt + y = K·u(t), y(0) = y0.  Every view is computed from closed-form solutions. */
(function () {
  "use strict";
  var root = document.getElementById("lab");
  if (!root) return;

  var NS = "http://www.w3.org/2000/svg";
  var E = Math.E;
  var MILESTONES = [1, 2, 3, 4, 5];

  // ---------------------------------------------------------------- state
  var DEF = { input: "step", mode: "tau", tau: 1, K: 1, A: 1, w: 2, y0: 0, R: 10, C: 100, RR: 100, L: 100, axis: "time", tmax: 6, pins: [] };
  var S = JSON.parse(JSON.stringify(DEF));
  var H = { input: true, final: true, tau: true, tan0: true, tanCur: true, band: false, rise: false, half: false };
  var cursor = null;          // current time t (s) under the cursor, or null
  var playing = null;

  // ---------------------------------------------------------------- helpers
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sig(v, n) {
    if (!isFinite(v)) return "—";
    if (v === 0) return "0";
    var a = Math.abs(v);
    if (a >= 1e4 || a < 1e-3) return v.toExponential(2).replace("e", "×10^").replace("^+", "^");
    var d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString();
  }
  function fmtT(t) {
    if (!isFinite(t)) return "—";
    var a = Math.abs(t);
    if (a === 0) return "0 s";
    if (a < 1e-3) return sig(t * 1e6) + " µs";
    if (a < 1) return sig(t * 1e3) + " ms";
    return sig(t) + " s";
  }
  function round3(v, n) { return +(+v).toPrecision(n || 3); }
  function pct(v) { return (v * 100).toFixed(1) + "%"; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function tauOf(p) {
    if (p.mode === "rc") return p.R * 1e3 * p.C * 1e-6;
    if (p.mode === "rl") return (p.L * 1e-3) / p.RR;
    return p.tau;
  }

  // ---------------------------------------------------------------- model
  function model(tau, K, p) {
    var A = p.A, w = p.w, y0 = p.y0, m = { tau: tau, K: K, input: p.input };
    switch (p.input) {
      case "step":
        m.u = function () { return A; };
        m.yss = function () { return K * A; };
        m.c = y0 - K * A;
        break;
      case "impulse":
        m.u = function () { return 0; };              // for t > 0
        m.yss = function () { return 0; };
        m.c = y0 + (K * A) / tau;                      // y(0+) = y0 + K·A/τ
        break;
      case "ramp":
        m.u = function (t) { return A * t; };
        m.yss = function (t) { return K * A * (t - tau); };
        m.c = y0 + K * A * tau;
        break;
      case "sine":
        var M = (K * A) / Math.sqrt(1 + w * w * tau * tau), phi = Math.atan(w * tau);
        m.M = M; m.phi = phi;
        m.u = function (t) { return A * Math.sin(w * t); };
        m.yss = function (t) { return M * Math.sin(w * t - phi); };
        m.c = y0 - m.yss(0);
        break;
      default: // natural
        m.u = function () { return 0; };
        m.yss = function () { return 0; };
        m.c = y0;
    }
    m.y = function (t) { return m.yss(t) + m.c * Math.exp(-t / tau); };
    m.dy = function (t) { return (K * m.u(t) - m.y(t)) / tau; };   // straight from the ODE
    m.constSS = p.input === "step" || p.input === "impulse" || p.input === "natural";
    m.yInf = m.constSS ? m.yss(0) : null;
    m.y0p = m.y(0);                                     // y(0+)
    return m;
  }
  function current() { return model(tauOf(S), S.K, S); }
  function pinModels() { return S.pins.map(function (pn) { return model(pn.tau, pn.K, S); }); }

  // ---------------------------------------------------------------- chart primitive
  var uid = 0;
  function Chart(host, o) {
    var box = el("div", "plot");
    host.appendChild(box);
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", o.label || "");
    svg.setAttribute("tabindex", "0");
    box.appendChild(svg);
    var id = "clip" + (++uid);
    var tip = el("div", "plot-tip"); tip.hidden = true; box.appendChild(tip);
    var c = { box: box, svg: svg, tip: tip, o: o, M: o.margin || { l: 54, r: 16, t: 14, b: 40 }, W: 600, H: o.h, xd: [0, 1], yd: [0, 1], id: id };
    c.size = function () {
      c.W = Math.max(260, Math.round(box.clientWidth));
      c.H = c.W < 560 ? Math.round(o.h * 0.78) : o.h;
      svg.setAttribute("viewBox", "0 0 " + c.W + " " + c.H);
      svg.setAttribute("width", c.W);
      svg.setAttribute("height", c.H);
    };
    var tr = function (v, log) { return log ? Math.log10(v) : v; };
    c.X = function (v) {
      var a0 = tr(c.xd[0], o.xlog), a1 = tr(c.xd[1], o.xlog);
      return c.M.l + ((tr(v, o.xlog) - a0) / (a1 - a0)) * (c.W - c.M.l - c.M.r);
    };
    c.Y = function (v) {
      var a0 = tr(c.yd[0], o.ylog), a1 = tr(c.yd[1], o.ylog);
      return c.H - c.M.b - ((tr(v, o.ylog) - a0) / (a1 - a0)) * (c.H - c.M.t - c.M.b);
    };
    c.invX = function (px) {
      var a0 = tr(c.xd[0], o.xlog), a1 = tr(c.xd[1], o.xlog);
      var a = a0 + ((px - c.M.l) / (c.W - c.M.l - c.M.r)) * (a1 - a0);
      return o.xlog ? Math.pow(10, a) : a;
    };
    c.inside = function (px) { return px >= c.M.l && px <= c.W - c.M.r; };
    c.render = function (html) {
      svg.innerHTML =
        '<defs><clipPath id="' + id + '"><rect x="' + c.M.l + '" y="' + c.M.t + '" width="' + (c.W - c.M.l - c.M.r) + '" height="' + (c.H - c.M.t - c.M.b) + '"/></clipPath>' +
        '<marker id="ar' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="ah"/></marker></defs>' +
        html + '<g class="cur"></g>';
      c.cur = svg.querySelector("g.cur");
    };
    c.clip = 'clip-path="url(#' + id + ')"';
    c.arrow = 'url(#ar' + id + ")";
    // pointer + keyboard
    function fromEvent(e) {
      var r = svg.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * c.W;
      if (!c.inside(px)) return null;
      return c.invX(px);
    }
    svg.addEventListener("pointermove", function (e) { if (o.onHover) o.onHover(fromEvent(e)); });
    svg.addEventListener("pointerdown", function (e) { if (o.onHover) o.onHover(fromEvent(e)); });
    svg.addEventListener("pointerleave", function () { if (o.onHover) o.onHover(null); });
    svg.addEventListener("keydown", function (e) { if (o.onKey && o.onKey(e)) e.preventDefault(); });
    svg.addEventListener("blur", function () { if (o.onHover) o.onHover(null); });
    return c;
  }

  // ---------------------------------------------------------------- axes
  function niceStep(span, n) {
    var raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  }
  function linTicks(a, b, n) {
    var s = niceStep(b - a, n), t = [], v = Math.ceil(a / s) * s;
    for (; v <= b + s * 1e-9; v += s) t.push(+v.toFixed(10));
    return t;
  }
  function logTicks(a, b) {
    var t = [];
    for (var e = Math.ceil(Math.log10(a) - 1e-9); e <= Math.floor(Math.log10(b) + 1e-9); e++) t.push(Math.pow(10, e));
    return t;
  }
  function niceDomain(lo, hi) {
    if (!isFinite(lo) || !isFinite(hi)) return [-1, 1];
    if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var s = niceStep(hi - lo, 5);
    return [Math.floor(lo / s) * s, Math.ceil(hi / s) * s];
  }
  function axes(c, xt, yt, xfmt, yfmt, xTitle, yTitle) {
    var h = "", L = c.M.l, R = c.W - c.M.r, T = c.M.t, B = c.H - c.M.b;
    yt.forEach(function (v) {
      var y = c.Y(v);
      if (y < T - 0.5 || y > B + 0.5) return;
      h += '<line class="grid" x1="' + L + '" x2="' + R + '" y1="' + y + '" y2="' + y + '"/>';
      h += '<text class="tick" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + yfmt(v) + "</text>";
    });
    xt.forEach(function (v) {
      var x = c.X(v);
      if (x < L - 0.5 || x > R + 0.5) return;
      h += '<line class="grid" x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + B + '"/>';
      h += '<text class="tick" x="' + x + '" y="' + (B + 16) + '" text-anchor="middle">' + xfmt(v) + "</text>";
    });
    h += '<line class="axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/>';
    h += '<line class="axis" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + B + '"/>';
    if (xTitle) h += '<text class="atitle" x="' + R + '" y="' + (c.H - 6) + '" text-anchor="end">' + xTitle + "</text>";
    if (yTitle) h += '<text class="atitle" x="' + (L + 6) + '" y="' + (T + 12) + '">' + yTitle + "</text>";
    return h;
  }
  function path(c, f, x0, x1, n, cls, extra) {
    var d = "", pen = false, span = c.yd[1] - c.yd[0];
    for (var i = 0; i <= n; i++) {
      var xv = c.o.xlog ? Math.pow(10, Math.log10(x0) + (i / n) * (Math.log10(x1) - Math.log10(x0))) : x0 + (i / n) * (x1 - x0);
      var yv = f(xv);
      if (!isFinite(yv) || (c.o.ylog && yv <= 0)) { pen = false; continue; }
      if (!c.o.ylog) yv = clamp(yv, c.yd[0] - span * 2, c.yd[1] + span * 2);
      d += (pen ? "L" : "M") + c.X(xv).toFixed(1) + " " + c.Y(yv).toFixed(1);
      pen = true;
    }
    return '<path class="' + cls + '" d="' + d + '" ' + c.clip + (extra || "") + "/>";
  }
  function line(c, x1, y1, x2, y2, cls, extra) {
    return '<line class="' + cls + '" x1="' + c.X(x1).toFixed(1) + '" y1="' + c.Y(y1).toFixed(1) + '" x2="' + c.X(x2).toFixed(1) + '" y2="' + c.Y(y2).toFixed(1) + '" ' + c.clip + (extra || "") + "/>";
  }
  function text(x, y, s, cls, anchor) {
    return '<text class="' + (cls || "lab") + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || "start") + '">' + s + "</text>";
  }
  function dot(c, xv, yv, cls, r) {
    return '<circle class="' + cls + '" cx="' + c.X(xv).toFixed(1) + '" cy="' + c.Y(yv).toFixed(1) + '" r="' + (r || 4.5) + '"/>';
  }

  // ---------------------------------------------------------------- charts
  var chartMain, chartLog, chartRate, chartS, chartMag, chartPh;
  var SERIES = ["s-cur", "s-p1", "s-p2"];

  function xSpanFor(m) { return S.axis === "norm" ? [0, 6] : [0, S.tmax]; }
  // time → chart x for series m (normalized axis uses each series' own τ)
  function tx(m, t) { return S.axis === "norm" ? t / m.tau : t; }
  function xt(m, x) { return S.axis === "norm" ? x * m.tau : x; }
  function xFmt(v) { return S.axis === "norm" ? sig(v, 2) + "τ" : fmtT(v).replace(" ", "\u202f"); }
  function xTitle() { return S.axis === "norm" ? "t/τ" : "t"; }

  function renderMain(ms) {
    var c = chartMain, m = ms[0];
    c.size();
    c.xd = xSpanFor(m);
    // y-domain over every visible series
    var lo = Infinity, hi = -Infinity, N = 300;
    ms.forEach(function (mm) {
      for (var i = 0; i <= N; i++) {
        var t = xt(mm, c.xd[0] + (i / N) * (c.xd[1] - c.xd[0])), v = mm.y(t);
        if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
        if (H.input && mm === m && S.input !== "impulse") { var u = m.u(t); lo = Math.min(lo, u); hi = Math.max(hi, u); }
      }
    });
    lo = Math.min(lo, 0, S.y0); hi = Math.max(hi, 0, S.y0);
    if (m.yInf != null) { lo = Math.min(lo, m.yInf); hi = Math.max(hi, m.yInf); }
    c.yd = niceDomain(lo, hi);
    c.render("");
    var h = axes(c, linTicks(c.xd[0], c.xd[1], 6), linTicks(c.yd[0], c.yd[1], 5), xFmt, function (v) { return sig(v, 3); }, xTitle(), "y(t)");
    var X0 = c.xd[0], X1 = c.xd[1], T = c.M.t, B = c.H - c.M.b;
    var compact = c.W < 560, L = function (full, short) { return compact ? short : full; };

    // ---- helpers (current series only)
    var tau = m.tau, trans = Math.abs(m.c) > 1e-12;
    if (H.input) {
      if (S.input === "impulse") {
        var xa = c.X(0) + 1;
        h += '<line class="h-input" x1="' + xa + '" x2="' + xa + '" y1="' + c.Y(0) + '" y2="' + (T + 6) + '" marker-end="' + c.arrow + '"/>';
        h += text(xa + 8, T + 18, "อินพุต " + sig(S.A) + "·δ(t)", "lab muted");
      } else if (S.input !== "natural") {
        h += path(c, function (x) { return m.u(xt(m, x)); }, X0, X1, 300, "h-input");
        var yIn = c.Y(m.u(xt(m, X1))), clash = H.final && m.constSS && Math.abs(yIn - c.Y(m.yInf)) < 18;
        if (!compact) h += text(c.W - c.M.r - 4, yIn + (clash ? 16 : -6), "อินพุต u(t)" + (clash ? " (ทับเส้นค่าสุดท้าย)" : ""), "lab muted", "end");
      }
    }
    if (H.final) {
      if (m.constSS) {
        var yf = c.Y(m.yInf);
        h += '<line class="h-final" x1="' + c.M.l + '" x2="' + (c.W - c.M.r) + '" y1="' + yf + '" y2="' + yf + '"/>';
        h += text(c.W - c.M.r - 4, yf - 6, L("ค่าสุดท้าย y∞ = ", "y∞ = ") + sig(m.yInf), "lab", "end");
      } else if (S.input === "ramp") {
        h += path(c, function (x) { return m.yss(xt(m, x)); }, X0, X1, 200, "h-final");
        h += path(c, function (x) { return S.K * m.u(xt(m, x)); }, X0, X1, 200, "h-guide");
        var tl = Math.min(xt(m, X1) * 0.7, xt(m, X1) - tau);
        if (tl > tau) {
          var yl = S.K * m.u(tl);
          h += '<line class="h-lag" x1="' + c.X(tx(m, tl)) + '" x2="' + c.X(tx(m, tl + tau)) + '" y1="' + c.Y(yl) + '" y2="' + c.Y(yl) + '" marker-start="' + c.arrow + '" marker-end="' + c.arrow + '"/>';
          h += text(c.X(tx(m, tl + tau / 2)), c.Y(yl) - 8, L("ล้าหลัง τ = " + fmtT(tau), "τ"), "lab", "middle");
        }
        var ta = xt(m, X1) * 0.3;
        if (!compact) h += text(c.X(tx(m, ta)) + 6, c.Y(m.yss(ta)) + 18, "เส้นกำกับ K·A(t − τ)", "lab muted");
      } else if (S.input === "sine") {
        h += path(c, function (x) { return m.yss(xt(m, x)); }, X0, X1, 600, "h-final");
        [m.M, -m.M].forEach(function (v) { h += '<line class="h-guide" x1="' + c.M.l + '" x2="' + (c.W - c.M.r) + '" y1="' + c.Y(v) + '" y2="' + c.Y(v) + '"/>'; });
        h += text(c.W - c.M.r - 4, c.Y(m.M) - 6, L("แอมพลิจูดคงตัว = " + sig(m.M) + " · ล้าหลัง " + sig((m.phi * 180) / Math.PI, 3) + "°", "±" + sig(m.M)), "lab", "end");
      }
    }
    if (H.band && m.constSS && trans) {
      var bw = 0.02 * Math.abs(m.c);
      h += '<rect class="h-band" x="' + c.M.l + '" width="' + (c.W - c.M.l - c.M.r) + '" y="' + c.Y(m.yInf + bw) + '" height="' + Math.max(1, c.Y(m.yInf - bw) - c.Y(m.yInf + bw)) + '"/>';
      var ts = tau * Math.log(50);
      if (tx(m, ts) <= X1) {
        h += line(c, tx(m, ts), c.yd[0], tx(m, ts), m.y(ts), "h-mark");
        h += text(c.X(tx(m, ts)) + 6, B - 8, L("เข้าที่ 2% · " + fmtT(ts) + " (3.91τ)", "2%: 3.91τ"), "lab");
      }
    }
    if (H.rise && trans) {
      var t10 = tau * Math.log(10 / 9), t90 = tau * Math.log(10), y10 = m.y(t10), y90 = m.y(t90);
      if (tx(m, t90) <= X1) {
        h += dot(c, tx(m, t10), y10, "pt-h", 4) + dot(c, tx(m, t90), y90, "pt-h", 4);
        var yb = c.Y(y90) + (m.c < 0 ? 22 : -22);
        h += '<line class="h-lag" x1="' + c.X(tx(m, t10)) + '" x2="' + c.X(tx(m, t90)) + '" y1="' + yb + '" y2="' + yb + '" marker-start="' + c.arrow + '" marker-end="' + c.arrow + '"/>';
        h += text((c.X(tx(m, t10)) + c.X(tx(m, t90))) / 2, yb - 6, L("10%→90% · " + fmtT(t90 - t10) + " (2.20τ)", "2.20τ"), "lab", "middle");
      }
    }
    if (H.half && trans) {
      var th = tau * Math.LN2;
      if (tx(m, th) <= X1) {
        h += line(c, tx(m, th), c.yd[0], tx(m, th), m.y(th), "h-mark");
        h += dot(c, tx(m, th), m.y(th), "pt-h", 4);
        h += text(c.X(tx(m, th)) + 6, c.Y(m.y(th)) + (m.c < 0 ? 16 : -10), L("50% · " + fmtT(th) + " (0.693τ)", "50%"), "lab");
      }
    }
    if (H.tan0 && m.constSS && trans && tx(m, tau) <= X1 * 1.2) {
      h += line(c, 0, m.y0p, tx(m, tau * 1.25), m.y0p + (m.yInf - m.y0p) * 1.25, "h-tan");
      h += dot(c, tx(m, tau), m.yInf, "pt-tan", 4);
      if (!compact) h += text(c.X(tx(m, tau)) + 8, c.Y(m.yInf) + (m.c < 0 ? -10 : 18), "เส้นสัมผัสที่ t = 0 ถึง y∞ ที่ t = τ", "lab acc");
    }
    if (H.tau && trans) {
      MILESTONES.forEach(function (k) {
        var t = k * tau, x = tx(m, t);
        if (x > X1) return;
        var px = c.X(x);
        h += '<line class="h-tau' + (k === 1 ? " one" : "") + '" x1="' + px + '" x2="' + px + '" y1="' + T + '" y2="' + B + '"/>';
        h += text(px, T + 12, k + "τ", "lab tauk", "middle");
        if (k === 1 && m.constSS) {
          h += line(c, 0, m.y(t), x, m.y(t), "h-mark");
          h += text(c.X(x) + 8, c.Y(m.y(t)) + (m.c < 0 ? 16 : -8), L("63.2% · y = " + sig(m.y(t)), "63.2%"), "lab acc");
        }
      });
    }

    // ---- series (pins first, current on top)
    for (var i = ms.length - 1; i >= 0; i--) {
      (function (mm, k) {
        h += path(c, function (x) { return mm.y(xt(mm, x)); }, Math.max(X0, 1e-9), X1, 500, "ser " + SERIES[k]);
        if (S.input === "impulse" && S.y0 !== mm.y0p && X0 <= 0) h += line(c, 0, S.y0, 0, mm.y0p, "ser " + SERIES[k]);
        if (k > 0 && S.axis === "time" && tx(mm, mm.tau) <= X1) { // direct label at the pinned curve's own 1τ point
          var lx = c.X(tx(mm, mm.tau)), ly = c.Y(mm.y(mm.tau)), right = mm.tau > m.tau;
          h += '<circle class="pt-cur ' + SERIES[k] + '" cx="' + lx + '" cy="' + ly + '" r="4"/>';
          h += text(lx + (right ? 8 : -8), ly + (right ? 16 : -8), "τ = " + fmtT(mm.tau) + (mm.K !== S.K ? ", K = " + sig(mm.K) : ""), "lab", right ? "start" : "end");
        }
      })(ms[i], i);
    }
    if (S.axis === "norm" && ms.length > 1) {
      h += text((c.M.l + c.W - c.M.r) / 2, c.H - c.M.b - 12, L("บนแกน t/τ ทุกค่า τ ที่ K เท่ากันจะซ้อนเป็นเส้นเดียวกัน", "ทุก τ ซ้อนเป็นเส้นเดียว"), "lab acc", "middle");
    }
    if (H.tau && trans) {
      MILESTONES.forEach(function (k) {
        var x = tx(m, k * tau);
        if (x <= X1) h += dot(c, x, m.y(k * tau), "pt-tau", 4.5);
      });
    }
    c.render(h);
  }

  function renderLog(ms) {
    var c = chartLog, m = ms[0];
    c.size(); c.xd = xSpanFor(m); c.yd = [1e-3, 1.2]; c.render("");
    var h = axes(c, linTicks(c.xd[0], c.xd[1], 5), logTicks(c.yd[0], 1), xFmt, function (v) { return v === 1 ? "1" : "10" + sup(Math.round(Math.log10(v))); }, xTitle(), "|ส่วนชั่วครู่| (เทียบค่าเริ่ม)");
    // e^-k reference levels
    MILESTONES.forEach(function (k) {
      var v = Math.exp(-k), y = c.Y(v);
      h += '<line class="h-ek" x1="' + c.M.l + '" x2="' + (c.W - c.M.r) + '" y1="' + y + '" y2="' + y + '"/>';
      h += text(c.W - c.M.r - 4, y - 4, "e" + sup(-k) + " = " + pct(v), "lab muted", "end");
    });
    for (var i = ms.length - 1; i >= 0; i--) {
      (function (mm, k) { h += path(c, function (x) { return Math.exp(-xt(mm, x) / mm.tau); }, c.xd[0], c.xd[1], 120, "ser " + SERIES[k]); })(ms[i], i);
    }
    MILESTONES.forEach(function (k) { var x = tx(m, k * m.tau); if (x <= c.xd[1]) h += dot(c, x, Math.exp(-k), "pt-tau", 4); });
    var xm = tx(m, m.tau * 1.5);
    if (xm < c.xd[1]) h += text(c.X(xm) + 10, c.Y(Math.exp(-1.5)) - 10, "ความชัน = −1/τ = −" + sig(1 / m.tau) + " /s", "lab acc");
    if (Math.abs(m.c) < 1e-12) h += text(c.W / 2, c.M.t + 30, "ค่าเริ่มต้นเท่ากับค่าคงตัวพอดี ไม่มีส่วนชั่วครู่", "lab", "middle");
    c.render(h);
  }

  function renderRate(ms) {
    var c = chartRate, m = ms[0];
    c.size(); c.xd = xSpanFor(m);
    var lo = 0, hi = 0;
    ms.forEach(function (mm) { for (var i = 0; i <= 200; i++) { var v = mm.dy(xt(mm, c.xd[0] + (i / 200) * (c.xd[1] - c.xd[0]) + 1e-9)); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } });
    c.yd = niceDomain(lo, hi); c.render("");
    var h = axes(c, linTicks(c.xd[0], c.xd[1], 5), linTicks(c.yd[0], c.yd[1], 4), xFmt, function (v) { return sig(v, 2); }, xTitle(), "dy/dt");
    h += line(c, c.xd[0], 0, c.xd[1], 0, "axis0");
    for (var i = ms.length - 1; i >= 0; i--) {
      (function (mm, k) { h += path(c, function (x) { return mm.dy(xt(mm, x) + 1e-12); }, c.xd[0], c.xd[1], 400, "ser " + SERIES[k]); })(ms[i], i);
    }
    if (m.constSS && Math.abs(m.c) > 1e-12) {
      var s0 = m.dy(1e-12);
      h += dot(c, 0, s0, "pt-tau", 4) + text(c.X(0) + 10, c.Y(s0) + (s0 > 0 ? 14 : -8), "ความชันเริ่มต้น = " + sig(s0) + " /s", "lab acc");
    }
    c.render(h);
  }

  function renderS(ms) {
    var c = chartS;
    c.size();
    var pmax = Math.max.apply(null, ms.map(function (mm) { return 1 / mm.tau; }));
    var span = niceStep(pmax * 1.4, 3) * 3;
    c.xd = [-span, span * 0.3]; c.yd = [-span * 0.55, span * 0.55];
    c.render("");
    var h = '<rect class="lhp" x="' + c.M.l + '" y="' + c.M.t + '" width="' + (c.X(0) - c.M.l) + '" height="' + (c.H - c.M.t - c.M.b) + '"/>';
    h += axes(c, linTicks(c.xd[0], c.xd[1], 5), linTicks(c.yd[0], c.yd[1], 4), function (v) { return sig(v, 2); }, function (v) { return sig(v, 2); }, "Re(s) = σ", "Im(s) = jω");
    h += line(c, c.xd[0], 0, c.xd[1], 0, "axis0") + line(c, 0, c.yd[0], 0, c.yd[1], "axis0");
    h += text(c.M.l + 8, c.H - c.M.b - 10, "ครึ่งซ้าย = เสถียร", "lab muted");
    for (var i = ms.length - 1; i >= 0; i--) {
      var mm = ms[i], x = c.X(-1 / mm.tau), y = c.Y(0), r = 7;
      h += '<path class="pole ' + SERIES[i] + '" d="M' + (x - r) + " " + (y - r) + "L" + (x + r) + " " + (y + r) + "M" + (x - r) + " " + (y + r) + "L" + (x + r) + " " + (y - r) + '"/>';
      h += text(x, y + (i === 1 ? 26 : i === 2 ? 40 : -14), "s = −" + sig(1 / mm.tau) + (i ? "" : " = −1/τ"), "lab", "middle");
    }
    var m = ms[0], xp = c.X(-1 / m.tau);
    h += '<line class="h-lag" x1="' + xp + '" x2="' + c.X(0) + '" y1="' + (c.Y(0) + 22) + '" y2="' + (c.Y(0) + 22) + '" marker-start="' + c.arrow + '" marker-end="' + c.arrow + '"/>';
    h += text((xp + c.X(0)) / 2, c.Y(0) + 38, "ไกลแกน jω มาก = ตอบสนองเร็ว", "lab muted", "middle");
    c.render(h);
  }

  function bodeDomain(m) { var wc = 1 / m.tau; return [wc / 100, wc * 100]; }
  function renderBode(ms) {
    var m = ms[0], wc = 1 / m.tau;
    [chartMag, chartPh].forEach(function (c) { c.size(); c.xd = bodeDomain(m); });
    var cm = chartMag, cp = chartPh, Kmax = Math.max.apply(null, ms.map(function (mm) { return mm.K; }));
    var top = Math.ceil((20 * Math.log10(Kmax) + 6) / 10) * 10;
    cm.yd = [top - 60, top]; cm.render("");
    var wfmt = function (v) { return sig(v, 2); };
    var h = axes(cm, logTicks(cm.xd[0], cm.xd[1]), linTicks(cm.yd[0], cm.yd[1], 6), wfmt, function (v) { return v + " dB"; }, "ω (rad/s)", "ขนาด |G(jω)|");
    var K0 = 20 * Math.log10(m.K);
    h += '<polyline class="h-tan" points="' + cm.X(cm.xd[0]) + "," + cm.Y(K0) + " " + cm.X(wc) + "," + cm.Y(K0) + " " + cm.X(cm.xd[1]) + "," + cm.Y(K0 - 40) + '" ' + cm.clip + "/>";
    for (var i = ms.length - 1; i >= 0; i--) {
      (function (mm, k) { h += path(cm, function (w) { return 20 * Math.log10(mm.K / Math.sqrt(1 + w * w * mm.tau * mm.tau)); }, cm.xd[0], cm.xd[1], 200, "ser " + SERIES[k]); })(ms[i], i);
    }
    h += dot(cm, wc, K0 - 3.0103, "pt-tau", 4.5) + text(cm.X(wc) + 8, cm.Y(K0 - 3) - 10, "ωc = 1/τ = " + sig(wc) + " rad/s · −3 dB", "lab acc");
    h += text(cm.X(wc * 10) + 6, cm.Y(K0 - 20) - 8, "−20 dB/ทศวรรษ", "lab muted");
    if (S.input === "sine" && S.w >= cm.xd[0] && S.w <= cm.xd[1]) {
      var gm = 20 * Math.log10(m.K / Math.sqrt(1 + S.w * S.w * m.tau * m.tau));
      h += dot(cm, S.w, gm, "pt-in", 5.5) + text(cm.X(S.w) - 8, cm.Y(gm) + 20, "ω อินพุต = " + sig(S.w) + " · " + sig(gm, 3) + " dB", "lab", "end");
    }
    cm.render(h);

    cp.yd = [-100, 10]; cp.render("");
    var g = axes(cp, logTicks(cp.xd[0], cp.xd[1]), [-90, -45, 0], wfmt, function (v) { return v + "°"; }, "ω (rad/s)", "เฟส ∠G(jω)");
    g += '<polyline class="h-tan" points="' + cp.X(cp.xd[0]) + "," + cp.Y(0) + " " + cp.X(wc / 10) + "," + cp.Y(0) + " " + cp.X(wc * 10) + "," + cp.Y(-90) + " " + cp.X(cp.xd[1]) + "," + cp.Y(-90) + '" ' + cp.clip + "/>";
    for (var j = ms.length - 1; j >= 0; j--) {
      (function (mm, k) { g += path(cp, function (w) { return (-Math.atan(w * mm.tau) * 180) / Math.PI; }, cp.xd[0], cp.xd[1], 200, "ser " + SERIES[k]); })(ms[j], j);
    }
    g += dot(cp, wc, -45, "pt-tau", 4.5) + text(cp.X(wc) + 8, cp.Y(-45) - 8, "−45° ที่ ωc", "lab acc");
    if (S.input === "sine" && S.w >= cp.xd[0] && S.w <= cp.xd[1]) {
      var ph = (-Math.atan(S.w * m.tau) * 180) / Math.PI;
      g += dot(cp, S.w, ph, "pt-in", 5.5);
    }
    cp.render(g);
  }

  function sup(n) {
    var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(n).split("").map(function (ch) { return map[ch] || ch; }).join("");
  }

  // ---------------------------------------------------------------- cursor (linked across time charts)
  function drawCursor() {
    var m = current(), ms = [m].concat(pinModels());
    [chartMain, chartLog, chartRate].forEach(function (c) { if (c.cur) c.cur.innerHTML = ""; });
    chartMain.tip.hidden = true;
    updateMilestones(m);
    if (cursor == null) return;
    var t = cursor, x = tx(m, t);
    if (x < chartMain.xd[0] || x > chartMain.xd[1]) return;

    // vertical hairline on every time chart
    [chartMain, chartLog, chartRate].forEach(function (c) {
      var px = c.X(x);
      c.cur.innerHTML = '<line class="hair" x1="' + px + '" x2="' + px + '" y1="' + c.M.t + '" y2="' + (c.H - c.M.b) + '"/>';
    });
    var c = chartMain, h = "";
    // tangent at the cursor: reaches the final value exactly τ later
    if (H.tanCur && m.constSS && Math.abs(m.c) > 1e-12) {
      var yv = m.y(t), t2 = t + m.tau;
      h += line(c, x, yv, tx(m, t2), m.yInf, "h-tan cur-tan");
      h += dot(c, tx(m, t2), m.yInf, "pt-tan", 4);
      if (tx(m, t2) <= c.xd[1]) h += text(c.X(tx(m, t2)), c.Y(m.yInf) + (m.c < 0 ? -12 : 20), "τ ต่อมา", "lab acc", "middle");
    }
    ms.forEach(function (mm, k) { h += dot(c, S.axis === "norm" ? x : t, mm.y(S.axis === "norm" ? x * mm.tau : t), "pt-cur " + SERIES[k], 5); });
    c.cur.innerHTML += h;
    chartLog.cur.innerHTML += dot(chartLog, x, Math.exp(-t / m.tau), "pt-cur s-cur", 5);
    chartRate.cur.innerHTML += dot(chartRate, x, m.dy(t + 1e-12), "pt-cur s-cur", 5);

    // tooltip — values lead, labels follow
    var tip = c.tip;
    tip.textContent = "";
    var head = el("div", "tt-head");
    head.appendChild(el("b", null, fmtT(t)));
    head.appendChild(el("span", null, " · t/τ = " + sig(t / m.tau, 3)));
    tip.appendChild(head);
    ms.forEach(function (mm, k) {
      var tt = S.axis === "norm" ? x * mm.tau : t;
      var row = el("div", "tt-row");
      row.appendChild(el("i", "key " + SERIES[k]));
      row.appendChild(el("b", null, sig(mm.y(tt), 4)));
      row.appendChild(el("span", null, k === 0 ? " y(t) ปัจจุบัน" : " τ = " + fmtT(mm.tau)));
      tip.appendChild(row);
    });
    var done = 1 - Math.exp(-t / m.tau);
    [["ส่วนชั่วครู่หายไปแล้ว", pct(done)], ["เหลืออีก", pct(1 - done)], ["dy/dt", sig(m.dy(t + 1e-12), 3) + " /s"]].forEach(function (r) {
      var row = el("div", "tt-row sub"); row.appendChild(el("b", null, r[1])); row.appendChild(el("span", null, " " + r[0])); tip.appendChild(row);
    });
    tip.hidden = false;
    // park the tooltip in the quadrant away from the point so it never hides the curve or the tangent
    var px = c.X(x), py = c.Y(m.y(S.axis === "norm" ? x * m.tau : t)), W = c.box.clientWidth, Hh = c.H;
    var left = px < W / 2 ? W - c.M.r - tip.offsetWidth - 8 : c.M.l + 8;
    var top = py < Hh / 2 ? Hh - c.M.b - tip.offsetHeight - 8 : c.M.t + 8;
    tip.style.left = Math.max(4, left) + "px";
    tip.style.top = Math.max(4, top) + "px";
  }
  function onTimeHover(x) {
    if (playing) return;
    var m = current();
    cursor = x == null ? null : Math.max(0, xt(m, x));
    drawCursor();
  }
  function onTimeKey(e) {
    var m = current(), step = m.tau / 10;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      cursor = clamp((cursor == null ? 0 : cursor) + (e.key === "ArrowRight" ? step : -step), 0, xt(m, chartMain.xd[1]));
      drawCursor(); return true;
    }
    if (e.key === "Escape") { cursor = null; drawCursor(); return true; }
    return false;
  }

  // ---------------------------------------------------------------- milestones, stats, table, equation
  function updateMilestones(m) {
    var box = $("miles");
    if (!box.children.length) {
      MILESTONES.forEach(function (k) {
        var card = el("div", "mile"); card.dataset.k = k;
        card.appendChild(el("span", "mile-k mono", k + "τ"));
        card.appendChild(el("b", "mile-p"));
        card.appendChild(el("span", "mile-t mono"));
        card.appendChild(el("span", "mile-y"));
        box.appendChild(card);
      });
    }
    [].forEach.call(box.children, function (card) {
      var k = +card.dataset.k, t = k * m.tau;
      card.querySelector(".mile-p").textContent = pct(1 - Math.exp(-k));
      card.querySelector(".mile-t").textContent = "t = " + fmtT(t);
      card.querySelector(".mile-y").textContent = "y = " + sig(m.y(t), 4);
      card.classList.toggle("passed", cursor != null && cursor >= t - 1e-12);
    });
  }

  function stat(label, value, note) {
    var d = el("div", "stat");
    d.appendChild(el("span", "stat-l", label));
    d.appendChild(el("b", "stat-v", value));
    if (note) d.appendChild(el("span", "stat-n", note));
    return d;
  }
  function renderStats(m) {
    var box = $("stats"); box.textContent = "";
    var t = m.tau, wc = 1 / t;
    box.appendChild(stat("ค่าคงตัวเวลา τ", fmtT(t), S.mode === "rc" ? "τ = RC" : S.mode === "rl" ? "τ = L/R" : "กำหนดโดยตรง"));
    if (m.constSS) box.appendChild(stat("ค่าสุดท้าย y∞", sig(m.yInf, 4), S.input === "step" ? "= K·A" : "กลับสู่ศูนย์"));
    else if (S.input === "ramp") box.appendChild(stat("ความคลาดเคลื่อนคงตัว", sig(S.K * S.A * t, 4), "เส้นตามหลังเวลา τ"));
    else box.appendChild(stat("แอมพลิจูดคงตัว", sig(m.M, 4), "ล้าหลัง " + sig((m.phi * 180) / Math.PI, 3) + "°"));
    box.appendChild(stat("เวลาเข้าที่ 2%", fmtT(t * Math.log(50)), "≈ 4τ (3.91τ)"));
    box.appendChild(stat("เวลาเข้าที่ 5%", fmtT(t * Math.log(20)), "≈ 3τ (3.00τ)"));
    box.appendChild(stat("เวลาขึ้น 10→90%", fmtT(t * Math.log(9)), "2.20τ"));
    box.appendChild(stat("เวลาถึงครึ่งทาง", fmtT(t * Math.LN2), "0.693τ"));
    box.appendChild(stat("ขั้ว (pole)", "s = −" + sig(wc), "−1/τ"));
    box.appendChild(stat("ความถี่มุม", sig(wc) + " rad/s", "f = " + sig(wc / (2 * Math.PI)) + " Hz"));
  }

  function renderTable(m) {
    var tb = $("tbl").querySelector("tbody"); tb.textContent = "";
    [0, 0.5, 1, 2, 3, 4, 5].forEach(function (k) {
      var t = k * m.tau, tr = document.createElement("tr");
      [sig(k, 2) + "τ", fmtT(t), sig(m.y(t), 4), pct(Math.exp(-k)), sig(m.dy(t + 1e-12), 3)].forEach(function (v) { tr.appendChild(el("td", null, v)); });
      tb.appendChild(tr);
    });
  }

  function renderEq(m) {
    var K = sig(S.K, 3), tau = sig(m.tau, 3), A = sig(S.A, 3), y0 = sig(S.y0, 3);
    var co = function (v) { return Math.abs(v - 1) < 1e-12 ? "" : sig(v, 4) + "\\,"; };
    var g = "G(s) = \\dfrac{" + K + "}{" + co(m.tau) + "s + 1}";
    var y;
    switch (S.input) {
      case "step": y = "y(t) = " + sig(m.yInf, 4) + (m.c ? (m.c < 0 ? " - " : " + ") + co(Math.abs(m.c)) + "e^{-t/" + tau + "}" : ""); break;
      case "impulse": y = "y(t) = " + (m.c < 0 ? "-" : "") + co(Math.abs(m.c)) + "e^{-t/" + tau + "}"; break;
      case "ramp": y = "y(t) = " + co(S.K * S.A) + "(t - " + tau + ")" + (m.c ? (m.c < 0 ? " - " : " + ") + co(Math.abs(m.c)) + "e^{-t/" + tau + "}" : ""); break;
      case "sine": y = "y(t) = " + sig(m.M, 4) + "\\sin(" + sig(S.w, 3) + "t - " + sig((m.phi * 180) / Math.PI, 3) + "^\\circ)" + (m.c ? (m.c < 0 ? " - " : " + ") + co(Math.abs(m.c)) + "e^{-t/" + tau + "}" : ""); break;
      default: y = "y(t) = " + (S.y0 < 0 ? "-" : "") + co(Math.abs(S.y0)) + "e^{-t/" + tau + "}";
    }
    var u = { step: "u(t) = " + A + "\\;(t \\ge 0)", impulse: "u(t) = " + A + "\\,\\delta(t)", ramp: "u(t) = " + co(S.A) + "t", sine: "u(t) = " + A + "\\sin(" + sig(S.w, 3) + "t)", natural: "u(t) = 0,\\; y(0) = " + y0 }[S.input];
    var parts = [["eqG", g], ["eqU", u], ["eqY", y]];
    parts.forEach(function (p) {
      var node = $(p[0]);
      if (window.katex) { try { window.katex.render(p[1], node, { throwOnError: false }); return; } catch (e) {} }
      node.textContent = p[1];
    });
  }

  // ---------------------------------------------------------------- controls
  function logSlider(id, lo, hi) {
    var s = $(id);
    return {
      get: function () { return Math.pow(10, Math.log10(lo) + (+s.value / 1000) * (Math.log10(hi) - Math.log10(lo))); },
      set: function (v) { s.value = Math.round(((Math.log10(clamp(v, lo, hi)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * 1000); },
      el: s
    };
  }
  var sl = {
    tau: logSlider("sTau", 0.01, 10), w: logSlider("sW", 0.1, 100),
    R: logSlider("sR", 0.1, 1000), C: logSlider("sC", 0.1, 10000),
    RR: logSlider("sRR", 1, 10000), L: logSlider("sL", 1, 10000)
  };

  function syncControls() {
    seg("inSeg", S.input); seg("modeSeg", S.mode); seg("axisSeg", S.axis);
    sl.tau.set(S.tau); sl.w.set(S.w); sl.R.set(S.R); sl.C.set(S.C); sl.RR.set(S.RR); sl.L.set(S.L);
    $("nTau").value = sig(S.tau, 3);
    $("sK").value = S.K; $("sA").value = S.A; $("sY0").value = S.y0; $("nTmax").value = sig(S.tmax, 3);
    root.querySelectorAll("[data-mode]").forEach(function (d) { d.hidden = d.dataset.mode !== S.mode; });
    root.querySelectorAll("[data-for]").forEach(function (d) { d.hidden = d.dataset.for.split(" ").indexOf(S.input) < 0; });
    Object.keys(H).forEach(function (k) { var cb = $("h_" + k); if (cb) cb.checked = H[k]; });
    readouts();
  }
  function readouts() {
    var t = tauOf(S);
    $("vK").textContent = sig(S.K, 3);
    $("vA").textContent = sig(S.A, 3);
    $("vY0").textContent = sig(S.y0, 3);
    $("vW").textContent = sig(S.w, 3) + " rad/s";
    $("vR").textContent = sig(S.R, 3) + " kΩ";
    $("vC").textContent = sig(S.C, 3) + " µF";
    $("vRR").textContent = sig(S.RR, 3) + " Ω";
    $("vL").textContent = sig(S.L, 3) + " mH";
    $("tauRead").textContent = (S.mode === "rc" ? "τ = RC = " : S.mode === "rl" ? "τ = L/R = " : "τ = ") + fmtT(t);
    $("pinBtn").disabled = S.pins.length >= 2;
    var pl = $("pinList"); pl.textContent = "";
    S.pins.forEach(function (pn, i) {
      var chip = el("span", "pin");
      chip.appendChild(el("i", "key " + SERIES[i + 1]));
      chip.appendChild(document.createTextNode("τ = " + fmtT(pn.tau) + (pn.K !== S.K ? ", K = " + sig(pn.K) : "")));
      var x = el("button", "pin-x", "×"); x.type = "button"; x.setAttribute("aria-label", "ลบเส้นเปรียบเทียบ τ = " + fmtT(pn.tau));
      x.addEventListener("click", function () { S.pins.splice(i, 1); update(); });
      chip.appendChild(x); pl.appendChild(chip);
    });
    // legend
    var lg = $("legend"); lg.textContent = "";
    var items = [["s-cur", "ปัจจุบัน τ = " + fmtT(t)]].concat(S.pins.map(function (pn, i) { return [SERIES[i + 1], "τ = " + fmtT(pn.tau)]; }));
    items.forEach(function (it) { var s = el("span", "lg"); s.appendChild(el("i", "key " + it[0])); s.appendChild(document.createTextNode(it[1])); lg.appendChild(s); });
  }
  function seg(id, v) { $(id).querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"); }); }

  function bindSeg(id, key, after) {
    $(id).addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var old = S[key]; S[key] = b.dataset.v; if (after) after(old); syncControls(); update();
    });
  }
  bindSeg("inSeg", "input", function () { if (S.input === "natural" && S.y0 === 0) S.y0 = 1; });
  bindSeg("modeSeg", "mode", function (old) {
    // carry the current τ across modes so the curve does not jump
    var t = tauOf(Object.assign({}, S, { mode: old }));
    if (S.mode === "tau") S.tau = clamp(round3(t, 3), 0.001, 100);
    if (S.mode === "rc") {
      S.R = round3(clamp(t / (S.C * 1e-3), 0.1, 1000), 3);
      S.C = round3(clamp(t / (S.R * 1e-3), 0.1, 10000), 3);
    }
    if (S.mode === "rl") {
      S.RR = round3(clamp((S.L * 1e-3) / t, 1, 10000), 3);
      S.L = round3(clamp(t * S.RR * 1e3, 1, 10000), 3);
    }
  });
  bindSeg("axisSeg", "axis");

  function onRange(id, fn) { $(id).addEventListener("input", function () { fn(); readouts(); update(); }); }
  onRange("sTau", function () { S.tau = round3(sl.tau.get(), 3); $("nTau").value = S.tau; });
  $("nTau").addEventListener("change", function () { var v = parseFloat(this.value); if (v > 0) { S.tau = clamp(v, 0.001, 100); sl.tau.set(S.tau); readouts(); update(); } });
  onRange("sW", function () { S.w = round3(sl.w.get(), 3); });
  onRange("sR", function () { S.R = round3(sl.R.get(), 3); });
  onRange("sC", function () { S.C = round3(sl.C.get(), 3); });
  onRange("sRR", function () { S.RR = round3(sl.RR.get(), 3); });
  onRange("sL", function () { S.L = round3(sl.L.get(), 3); });
  onRange("sK", function () { S.K = +$("sK").value; });
  onRange("sA", function () { S.A = +$("sA").value; });
  onRange("sY0", function () { S.y0 = +$("sY0").value; });
  $("nTmax").addEventListener("change", function () { var v = parseFloat(this.value); if (v > 0) { S.tmax = v; update(); } });
  $("fitBtn").addEventListener("click", function () {
    var taus = [tauOf(S)].concat(S.pins.map(function (p) { return p.tau; }));
    S.tmax = round3(6 * Math.max.apply(null, taus), 3); $("nTmax").value = S.tmax; update();
  });
  Object.keys(H).forEach(function (k) {
    var cb = $("h_" + k); if (!cb) return;
    cb.addEventListener("change", function () { H[k] = cb.checked; update(); });
  });
  $("pinBtn").addEventListener("click", function () {
    if (S.pins.length >= 2) return;
    S.pins.push({ tau: round3(tauOf(S), 4), K: S.K }); readouts(); update();
  });
  $("resetBtn").addEventListener("click", function () {
    S = JSON.parse(JSON.stringify(DEF));
    H = { input: true, final: true, tau: true, tan0: true, tanCur: true, band: false, rise: false, half: false };
    cursor = null; syncControls(); update();
  });
  $("shareBtn").addEventListener("click", function () {
    writeHash();
    var b = this, old = b.textContent;
    var done = function () { b.textContent = "คัดลอกลิงก์แล้ว ✓"; setTimeout(function () { b.textContent = old; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });
  // play: sweep the cursor from 0 to 5τ
  $("playBtn").addEventListener("click", function () {
    var b = this;
    if (playing) { cancelAnimationFrame(playing.raf); playing = null; b.textContent = "▶ เล่น 0 → 5τ"; return; }
    var m = current(), end = Math.min(5 * m.tau, xt(m, chartMain.xd[1])), t0 = performance.now(), dur = 6000;
    b.textContent = "❚❚ หยุด";
    playing = {};
    (function frame(now) {
      var f = Math.min(1, (now - t0) / dur);
      cursor = f * end; drawCursor();
      if (f < 1 && playing) playing.raf = requestAnimationFrame(frame);
      else { playing = null; b.textContent = "▶ เล่น 0 → 5τ"; }
    })(t0);
  });

  // ---------------------------------------------------------------- URL state
  function writeHash() {
    var q = ["in=" + S.input, "m=" + S.mode, "tau=" + S.tau, "K=" + S.K, "A=" + S.A, "w=" + S.w, "y0=" + S.y0, "R=" + S.R, "C=" + S.C, "RR=" + S.RR, "L=" + S.L, "ax=" + S.axis, "tmax=" + S.tmax];
    if (S.pins.length) q.push("p=" + S.pins.map(function (p) { return p.tau + ":" + p.K; }).join(","));
    history.replaceState(null, "", "#" + q.join("&"));
  }
  function readHash() {
    if (!location.hash || location.hash.length < 3) return;
    location.hash.slice(1).split("&").forEach(function (kv) {
      var p = kv.split("="), k = p[0], v = decodeURIComponent(p[1] || "");
      var num = parseFloat(v);
      if (k === "in" && /^(step|impulse|ramp|sine|natural)$/.test(v)) S.input = v;
      else if (k === "m" && /^(tau|rc|rl)$/.test(v)) S.mode = v;
      else if (k === "ax" && /^(time|norm)$/.test(v)) S.axis = v;
      else if (k === "p") S.pins = v.split(",").slice(0, 2).map(function (s) { var a = s.split(":"); return { tau: +a[0], K: +a[1] }; }).filter(function (p) { return p.tau > 0 && isFinite(p.K); });
      else if (["tau", "K", "A", "w", "y0", "R", "C", "RR", "L", "tmax"].indexOf(k) >= 0 && isFinite(num)) S[k] = num;
    });
    S.tau = clamp(S.tau, 0.001, 100); S.tmax = Math.max(S.tmax, 1e-4);
  }

  // ---------------------------------------------------------------- render all
  var hashTimer;
  function update() {
    if (playing) { cancelAnimationFrame(playing.raf); playing = null; $("playBtn").textContent = "▶ เล่น 0 → 5τ"; }
    var m = current(), ms = [m].concat(pinModels());
    renderMain(ms); renderLog(ms); renderRate(ms); renderS(ms); renderBode(ms);
    renderStats(m); renderTable(m); renderEq(m); readouts();
    drawCursor();
    clearTimeout(hashTimer); hashTimer = setTimeout(writeHash, 400);
  }

  chartMain = Chart($("chartMain"), { h: 400, label: "กราฟผลตอบสนองทางเวลา y(t) ของระบบอันดับหนึ่ง พร้อมเส้นแบ่งทุกช่วง τ", onHover: onTimeHover, onKey: onTimeKey, margin: { l: 56, r: 16, t: 22, b: 42 } });
  chartLog = Chart($("chartLog"), { h: 260, ylog: true, label: "ส่วนชั่วครู่บนสเกลลอการิทึม เป็นเส้นตรงความชัน −1/τ", onHover: onTimeHover, onKey: onTimeKey });
  chartRate = Chart($("chartRate"), { h: 260, label: "อัตราการเปลี่ยนแปลง dy/dt", onHover: onTimeHover, onKey: onTimeKey });
  chartS = Chart($("chartS"), { h: 260, label: "ตำแหน่งขั้วบนระนาบ s", margin: { l: 54, r: 16, t: 14, b: 40 } });
  chartMag = Chart($("chartBode"), { h: 220, xlog: true, label: "Bode plot ขนาด" });
  chartPh = Chart($("chartBode"), { h: 200, xlog: true, label: "Bode plot เฟส" });

  readHash();
  if (!location.hash) S.tmax = 6 * tauOf(S);
  syncControls();
  update();
  var ro = new ResizeObserver(function () { clearTimeout(ro.t); ro.t = setTimeout(update, 80); });
  ro.observe(root);
})();
