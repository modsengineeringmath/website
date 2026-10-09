/* Signals lab — explore a signal, transform it in time, and combine two signals.
   Continuous time x(t) on a fine grid, or discrete time x[n]. Uses SigExpr (no eval). */
(function () {
  "use strict";
  var root = document.getElementById("sigLab");
  if (!root || !window.SigExpr) return;
  var NS = "http://www.w3.org/2000/svg", NCT = 1201;

  // ------------------------------------------------------------ state
  var DEF = {
    mode: "explore", dom: "ct",
    x1: "rect(t/2)", x2: "exp(-t)*u(t)", x1n: "u(n) - u(n-5)", x2n: "0.8^n*u(n)",
    A: 1, a: 1, t0: 0, C: 0, op: "conv", tmin: -5, tmax: 5, nmin: -10, nmax: 20, Ts: 0.5, fmax: 3
  };
  var HDEF = { grid: true, zero: true, disc: true, peak: true, mean: false, rms: false, samp: false, steps: true, map: true, env: true };
  var S = JSON.parse(JSON.stringify(DEF)), H = JSON.parse(JSON.stringify(HDEF));
  var cursor = null, anim = null;
  var PRESETS = {
    ct: [
      ["u(t)", "ขั้นบันได u(t)"], ["r(t)", "แรมป์ r(t)"], ["delta(t)", "อิมพัลส์ δ(t)"], ["rect(t/2)", "พัลส์สี่เหลี่ยม"],
      ["tri(t)", "พัลส์สามเหลี่ยม"], ["exp(-t)*u(t)", "เอกซ์โพเนนเชียลลดลง"], ["2*cos(2*pi*0.5*t + pi/4)", "ไซน์ (โคไซน์)"],
      ["exp(-0.3*t)*sin(2*pi*t)*u(t)", "ไซน์หน่วง"], ["sinc(t)", "sinc"], ["sq(2*pi*0.5*t)", "คลื่นสี่เหลี่ยม"],
      ["saw(2*pi*0.5*t)", "ฟันเลื่อย"], ["exp(-t^2)", "เกาส์เซียน"], ["u(t+1) - 2*u(t-1) + u(t-3)", "ขั้นบันไดหลายขั้น"],
      ["sin(2*pi*t) + 0.5*sin(2*pi*3*t)", "ผลรวมไซน์"], ["(1 + 0.5*cos(2*pi*0.2*t))*cos(2*pi*2*t)", "มอดูเลตแอมพลิจูด"]
    ],
    dt: [
      ["u(n)", "ขั้นบันได u[n]"], ["delta(n)", "อิมพัลส์ δ[n]"], ["r(n)", "แรมป์ r[n]"], ["u(n) - u(n-5)", "พัลส์ยาว 5"],
      ["0.8^n*u(n)", "เอกซ์โพเนนเชียล 0.8ⁿ"], ["cos(pi*n/4)", "โคไซน์ π/4"], ["0.9^n*cos(pi*n/4)*u(n)", "ไซน์หน่วง"],
      ["(-1)^n", "สลับเครื่องหมาย"], ["n*(u(n) - u(n-6))", "แรมป์ตัด"], ["delta(n) + 2*delta(n-1) + delta(n-3)", "ลำดับอิมพัลส์"]
    ]
  };

  // ------------------------------------------------------------ utils
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r3(v, n) { return +(+v).toPrecision(n || 3); }
  function sup(n) { var m = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" }; return String(n).split("").map(function (c) { return m[c] || c; }).join(""); }
  function sig(v, n) {
    if (v == null || isNaN(v)) return "—";
    if (!isFinite(v)) return v > 0 ? "∞" : "−∞";
    if (Math.abs(v) < 1e-10) return "0";
    var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) { var e = Math.floor(Math.log10(a)); return r3(v / Math.pow(10, e), n || 3) + "×10" + sup(e); }
    var d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString();
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function ct() { return S.dom === "ct"; }
  function V() { return ct() ? "t" : "n"; }
  function srcOf(k) { return ct() ? S[k] : S[k + "n"]; }

  var cache = {};
  function comp(src) {
    var key = V() + "|" + src;
    if (!cache[key]) { try { cache[key] = { ok: true, c: SigExpr.compile(src, V()) }; } catch (e) { cache[key] = { ok: false, err: e.message, pos: e.pos }; } }
    return cache[key];
  }
  var last = {}; // last good compile per slot
  function getSig(k) {
    var r = comp(srcOf(k));
    if (r.ok) last[k + S.dom] = r.c;
    return { c: r.ok ? r.c : last[k + S.dom] || SigExpr.compile(k === "x1" ? (ct() ? DEF.x1 : DEF.x1n) : (ct() ? DEF.x2 : DEF.x2n), V()), err: r.ok ? null : r };
  }

  // ------------------------------------------------------------ sampling
  function grid() {
    if (ct()) {
      var N = NCT, dt = (S.tmax - S.tmin) / (N - 1), ts = new Float64Array(N);
      for (var i = 0; i < N; i++) ts[i] = S.tmin + i * dt;
      return { ts: ts, dt: dt, N: N };
    }
    var ns = [];
    for (var n = Math.round(S.nmin); n <= Math.round(S.nmax); n++) ns.push(n);
    return { ts: Float64Array.from(ns), dt: 1, N: ns.length };
  }
  // y(t) = scale·x(a·(t − t0)) + off   (identity when a = 1, t0 = 0)
  function sample(c, G, a, t0, scale, off) {
    a = a == null ? 1 : a; t0 = t0 || 0; scale = scale == null ? 1 : scale; off = off || 0;
    var N = G.N, x = new Float64Array(N), on = new Float64Array(N), imps = [], ctx = { t: 0, dt: 0, on: true, hit: false };
    for (var i = 0; i < N; i++) {
      var tau = a * (G.ts[i] - t0), v;
      if (!ct()) {
        if (Math.abs(tau - Math.round(tau)) > 1e-9) { x[i] = on[i] = off; continue; } // x[a(n−n0)] undefined → 0 (expansion)
        ctx.t = Math.round(tau); ctx.dt = 1; v = c.fn(ctx);
        if (!isFinite(v)) v = NaN;
        x[i] = on[i] = scale * v + off; continue;
      }
      ctx.t = tau; ctx.dt = a * G.dt; ctx.on = true; ctx.hit = false;
      v = c.fn(ctx);
      if (!isFinite(v)) { ctx.t = tau + 1e-9 * (Math.abs(tau) + 1); ctx.hit = false; v = c.fn(ctx); ctx.t = tau; if (!isFinite(v)) v = NaN; }
      if (ctx.hit) {
        ctx.on = false; var off0 = c.fn(ctx);
        if (!isFinite(off0)) off0 = 0;
        imps.push({ t: G.ts[i], w: scale * (v - off0) * G.dt });
        x[i] = scale * off0 + off; on[i] = scale * v + off;
      } else { x[i] = scale * v + off; on[i] = x[i]; }
    }
    return { x: x, on: on, imps: imps, G: G };
  }
  function valAt(s, t) { var G = s.G, i = Math.round((t - G.ts[0]) / G.dt); return i < 0 || i >= G.N ? NaN : s.x[i]; }
  function nz(v) { return isFinite(v) ? v : 0; }

  // ------------------------------------------------------------ analysis
  function range(s) { var lo = Infinity, hi = -Infinity; for (var i = 0; i < s.x.length; i++) if (isFinite(s.x[i])) { lo = Math.min(lo, s.x[i]); hi = Math.max(hi, s.x[i]); } s.imps.forEach(function (p) { lo = Math.min(lo, p.w); hi = Math.max(hi, p.w); }); if (lo === Infinity) { lo = -1; hi = 1; } return [lo, hi]; }
  function jumps(s) {
    if (!ct()) return [];
    var x = s.x, N = x.length, out = [], rg = range(s), span = Math.max(rg[1] - rg[0], 1e-9);
    for (var i = 1; i < N - 2; i++) {
      var d = x[i + 1] - x[i];
      if (!isFinite(d) || Math.abs(d) < 0.02 * span) continue;
      var nb = (Math.abs(x[i] - x[i - 1]) + Math.abs(x[i + 2] - x[i + 1])) / 2;
      if (Math.abs(d) > 8 * nb + 1e-9) out.push({ i: i, t: s.G.ts[i + 1], j: d });
    }
    return out;
  }
  function deriv(s, J) {
    var x = s.x, N = x.length, G = s.G, d = new Float64Array(N);
    if (!ct()) { for (var k = 0; k < N; k++) d[k] = k === 0 ? NaN : x[k] - x[k - 1]; return { x: d, imps: [] }; }
    for (var i = 1; i < N - 1; i++) d[i] = (x[i + 1] - x[i - 1]) / (2 * G.dt);
    d[0] = d[N - 1] = NaN;
    J.forEach(function (j) { for (var q = j.i - 1; q <= j.i + 2; q++) if (q >= 0 && q < N) d[q] = NaN; });
    return { x: d, imps: J.map(function (j) { return { t: j.t, w: j.j }; }) };
  }
  function integ(s) {
    var x = s.x, N = x.length, G = s.G, out = new Float64Array(N), acc = 0, ip = 0, imps = s.imps.slice().sort(function (a, b) { return a.t - b.t; });
    for (var i = 0; i < N; i++) {
      if (!ct()) { acc += nz(x[i]); out[i] = acc; continue; }
      if (i > 0) acc += ((nz(x[i]) + nz(x[i - 1])) / 2) * G.dt;
      while (ip < imps.length && imps[ip].t <= G.ts[i] + 1e-12) { acc += imps[ip].w; ip++; }
      out[i] = acc;
    }
    return out;
  }
  function mirrorImps(list, sgn) { return list.map(function (p) { return { t: -p.t, w: sgn * p.w }; }); }
  function mergeImps(list, dt) {
    var m = [];
    list.sort(function (a, b) { return a.t - b.t; }).forEach(function (p) {
      var q = m[m.length - 1];
      if (q && Math.abs(q.t - p.t) < dt * 0.75) q.w += p.w; else m.push({ t: p.t, w: p.w });
    });
    return m.filter(function (p) { return Math.abs(p.w) > 1e-9; });
  }
  function evenOdd(c, s) {
    var G = s.G, r = sample(c, G, -1, 0, 1, 0), N = G.N, xe = new Float64Array(N), xo = new Float64Array(N);
    for (var i = 0; i < N; i++) { xe[i] = (s.x[i] + r.x[i]) / 2; xo[i] = (s.x[i] - r.x[i]) / 2; }
    var ie = s.imps.map(function (p) { return { t: p.t, w: p.w / 2 }; }).concat(mirrorImps(s.imps, 0.5));
    var io = s.imps.map(function (p) { return { t: p.t, w: p.w / 2 }; }).concat(mirrorImps(s.imps, -0.5));
    return { e: { x: xe, imps: mergeImps(ie, G.dt), G: G, on: xe }, o: { x: xo, imps: mergeImps(io, G.dt), G: G, on: xo } };
  }
  function energy(s) {
    var x = s.x, N = x.length, cum = new Float64Array(N), acc = 0, dt = s.G.dt;
    for (var i = 0; i < N; i++) { acc += nz(x[i]) * nz(x[i]) * dt; cum[i] = acc; }
    return { cum: cum, E: acc, inf: s.imps.length > 0, P: acc / (ct() ? S.tmax - S.tmin : N) };
  }
  // CT: X(f) = ∫x e^{−j2πft} dt (window) · DT: X(e^{jω}) = Σ x[n] e^{−jωn}
  function spectrum(s, F) {
    var G = s.G, N = G.N, mag = new Float64Array(F.length);
    if (ct()) {
      var st = Math.max(1, Math.ceil(N / 600)), dt = G.dt * st;
      for (var k = 0; k < F.length; k++) {
        var w = 2 * Math.PI * F[k], re = 0, im = 0;
        for (var i = 0; i < N; i += st) { var v = nz(s.x[i]); re += v * Math.cos(w * G.ts[i]); im -= v * Math.sin(w * G.ts[i]); }
        re *= dt; im *= dt;
        s.imps.forEach(function (p) { re += p.w * Math.cos(w * p.t); im -= p.w * Math.sin(w * p.t); });
        mag[k] = Math.hypot(re, im);
      }
    } else {
      for (var q = 0; q < F.length; q++) { var re2 = 0, im2 = 0; for (var j = 0; j < N; j++) { var v2 = nz(s.x[j]); re2 += v2 * Math.cos(F[q] * G.ts[j]); im2 -= v2 * Math.sin(F[q] * G.ts[j]); } mag[q] = Math.hypot(re2, im2); }
    }
    return mag;
  }
  function fTicks(c) { return ct() ? ticks(c.xd[0], c.xd[1], 6) : [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI]; }
  function fFmt(v) { if (ct()) return sig(v, 2); var k = Math.round((v / Math.PI) * 2); return { "-2": "−π", "-1": "−π/2", "0": "0", "1": "π/2", "2": "π" }[k] || sig(v, 2); }
  function freqAxis() { var F = [], n = 300; for (var i = 0; i <= n; i++) F.push(ct() ? (i / n) * S.fmax : -Math.PI + (2 * Math.PI * i) / n); return F; }
  function zeros(s) {
    var x = s.x, out = [];
    for (var i = 0; i < x.length - 1; i++) {
      var a = x[i], b = x[i + 1];
      if (!isFinite(a) || !isFinite(b)) continue;
      if ((a < 0 && b > 0) || (a > 0 && b < 0)) out.push(s.G.ts[i] + (a / (a - b)) * s.G.dt);
    }
    return out;
  }
  function peaks(s) {
    var x = s.x, rg = range(s), span = rg[1] - rg[0], out = [];
    if (!(span > 0)) return out;
    for (var i = 1; i < x.length - 1; i++) {
      if (!isFinite(x[i])) continue;
      if ((x[i] > x[i - 1] && x[i] >= x[i + 1]) || (x[i] < x[i - 1] && x[i] <= x[i + 1])) {
        if (ct() && Math.abs(x[i] - x[Math.max(0, i - 20)]) < 0.03 * span && Math.abs(x[i] - x[Math.min(x.length - 1, i + 20)]) < 0.03 * span) continue;
        out.push({ t: s.G.ts[i], v: x[i], max: x[i] > x[i - 1] });
      }
    }
    return out.length > 24 ? [] : out;
  }
  function period(s) {
    var x = s.x, N = x.length, rg = range(s), span = rg[1] - rg[0];
    if (!(span > 1e-9) || s.imps.length) return null;
    var crossed = false, best = null;
    for (var k = 1; k < N / 2; k++) {
      var m = 0, c = 0;
      for (var i = 0; i + k < N; i += ct() ? 3 : 1) { if (isFinite(x[i]) && isFinite(x[i + k])) { m += Math.abs(x[i + k] - x[i]); c++; } }
      m = m / Math.max(c, 1) / span;
      if (m > 0.08) crossed = true;
      if (crossed && m < (ct() ? 0.004 : 1e-9)) { best = k; break; }
    }
    return best ? best * s.G.dt : null;
  }

  // ------------------------------------------------------------ chart primitive
  var uid = 0;
  function Chart(host, o) {
    var box = el("div", "plot"); host.appendChild(box);
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", o.label || ""); svg.setAttribute("tabindex", "0");
    box.appendChild(svg);
    var id = "sg" + (++uid), tip = el("div", "plot-tip"); tip.hidden = true; box.appendChild(tip);
    var c = { box: box, svg: svg, tip: tip, o: o, M: o.margin || { l: 52, r: 14, t: 14, b: 38 }, xd: [0, 1], yd: [0, 1] };
    c.size = function () { c.W = Math.max(240, Math.round(box.clientWidth)); c.H = c.W < 520 ? Math.round(o.h * 0.8) : o.h; svg.setAttribute("viewBox", "0 0 " + c.W + " " + c.H); svg.setAttribute("width", c.W); svg.setAttribute("height", c.H); };
    c.X = function (v) { return c.M.l + ((v - c.xd[0]) / (c.xd[1] - c.xd[0])) * (c.W - c.M.l - c.M.r); };
    c.Y = function (v) { return c.H - c.M.b - ((v - c.yd[0]) / (c.yd[1] - c.yd[0])) * (c.H - c.M.t - c.M.b); };
    c.invX = function (px) { return c.xd[0] + ((px - c.M.l) / (c.W - c.M.l - c.M.r)) * (c.xd[1] - c.xd[0]); };
    c.clip = 'clip-path="url(#' + id + ')"';
    c.arrow = "url(#ar" + id + ")";
    c.render = function (html) {
      svg.innerHTML = '<defs><clipPath id="' + id + '"><rect x="' + c.M.l + '" y="' + (c.M.t - 6) + '" width="' + (c.W - c.M.l - c.M.r) + '" height="' + (c.H - c.M.t - c.M.b + 12) + '"/></clipPath>' +
        '<marker id="ar' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="ah"/></marker>' +
        ['s-cur', 's-p1', 's-p2', 's-neu'].map(function (k) { return '<marker id="im' + k + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0 L10 5 L0 10z" class="im ' + k + '"/></marker>'; }).join("") +
        "</defs>" + html + '<g class="cur"></g>';
      c.cur = svg.querySelector("g.cur");
    };
    function px(e) { var r = svg.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * c.W; }
    svg.addEventListener("pointermove", function (e) { if (o.onMove) o.onMove(c, px(e)); });
    svg.addEventListener("pointerdown", function (e) { if (o.onMove) o.onMove(c, px(e)); });
    svg.addEventListener("pointerleave", function () { if (o.onLeave) o.onLeave(); });
    svg.addEventListener("keydown", function (e) { if (o.onKey && o.onKey(e)) e.preventDefault(); });
    return c;
  }
  function niceStep(span, n) { var raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; }
  function ticks(a, b, n) { var s = niceStep(b - a, n), t = []; for (var v = Math.ceil(a / s) * s; v <= b + s * 1e-9; v += s) t.push(+v.toFixed(10)); return t; }
  function niceDomain(lo, hi) {
    if (!isFinite(lo) || !isFinite(hi)) return [-1, 1];
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var pad = (hi - lo) * 0.1; lo = lo < 0 ? lo - pad : lo; hi += pad;
    var s = niceStep(hi - lo, 5); return [Math.floor(lo / s) * s, Math.ceil(hi / s) * s];
  }
  function axes(c, xt, yt, xf, yf, xT, yT) {
    var h = "", L = c.M.l, R = c.W - c.M.r, T = c.M.t, B = c.H - c.M.b;
    yt.forEach(function (v) { var y = c.Y(v); if (y < T - 0.5 || y > B + 0.5) return; h += '<line class="grid" x1="' + L + '" x2="' + R + '" y1="' + y + '" y2="' + y + '"/><text class="tick" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + yf(v) + "</text>"; });
    xt.forEach(function (v) { var x = c.X(v); if (x < L - 0.5 || x > R + 0.5) return; h += '<line class="grid" x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + B + '"/><text class="tick" x="' + x + '" y="' + (B + 16) + '" text-anchor="middle">' + xf(v) + "</text>"; });
    h += '<line class="axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + B + '"/>';
    if (c.yd[0] < 0 && c.yd[1] > 0) h += '<line class="axis0" x1="' + L + '" x2="' + R + '" y1="' + c.Y(0) + '" y2="' + c.Y(0) + '"/>';
    if (c.xd[0] < 0 && c.xd[1] > 0) h += '<line class="axis0 v" x1="' + c.X(0) + '" x2="' + c.X(0) + '" y1="' + T + '" y2="' + B + '"/>';
    if (xT) h += '<text class="atitle" x="' + R + '" y="' + (c.H - 4) + '" text-anchor="end">' + xT + "</text>";
    if (yT) h += '<text class="atitle" x="' + (L + 6) + '" y="' + (T + 12) + '">' + yT + "</text>";
    return h;
  }
  function frame(c, xd, lists, extra) {
    c.size(); c.xd = xd;
    var lo = Infinity, hi = -Infinity;
    lists.forEach(function (s) { if (!s) return; var rg = range(s); lo = Math.min(lo, rg[0]); hi = Math.max(hi, rg[1]); });
    (extra || []).forEach(function (v) { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    c.yd = niceDomain(lo, hi);
  }
  function std(c, xt, yt) {
    var xf = function (v) { return sig(v, 3); };
    return axes(c, ticks(c.xd[0], c.xd[1], c.W < 520 ? 5 : 10), ticks(c.yd[0], c.yd[1], 5), xf, function (v) { return sig(v, 3); }, xt, yt);
  }
  function line(c, x1, y1, x2, y2, cls, extra) { return '<line class="' + cls + '" x1="' + c.X(x1).toFixed(1) + '" y1="' + c.Y(y1).toFixed(1) + '" x2="' + c.X(x2).toFixed(1) + '" y2="' + c.Y(y2).toFixed(1) + '" ' + (extra || "") + "/>"; }
  function text(x, y, s, cls, an) { return '<text class="' + (cls || "lab") + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (an || "start") + '">' + s + "</text>"; }
  function dot(c, x, y, cls, r) { return '<circle class="' + cls + '" cx="' + c.X(x).toFixed(1) + '" cy="' + c.Y(y).toFixed(1) + '" r="' + (r || 4) + '"/>'; }
  // draw a sampled signal: polyline (CT) or stems (DT), plus impulse arrows
  function draw(c, s, key, opt) {
    opt = opt || {};
    var h = "", G = s.G, x = s.x, span = c.yd[1] - c.yd[0];
    if (ct()) {
      var d = "", pen = false, J = opt.noJumpBreak ? [] : jumps(s), jset = {};
      J.forEach(function (j) { jset[j.i] = 1; });
      for (var i = 0; i < G.N; i++) {
        var v = x[i];
        if (!isFinite(v)) { pen = false; continue; }
        v = clamp(v, c.yd[0] - span, c.yd[1] + span);
        d += (pen ? "L" : "M") + c.X(G.ts[i]).toFixed(1) + " " + c.Y(v).toFixed(1); pen = !jset[i];
      }
      h += '<path class="ser ' + key + (opt.dash ? " dash" : "") + (opt.faint ? " faint" : "") + '" d="' + d + '" ' + c.clip + "/>";
      // at a jump: open dot = level just before (not attained), filled dot = value at the jump instant
      if (!opt.faint && !opt.dash && !opt.noJumpDots) J.forEach(function (j) { var X = c.X(G.ts[j.i + 1]).toFixed(1); h += '<circle class="jd open" cx="' + X + '" cy="' + c.Y(x[j.i]).toFixed(1) + '" r="3.4"/><circle class="jd ' + key + '" cx="' + X + '" cy="' + c.Y(x[j.i + 1]).toFixed(1) + '" r="3.4"/>'; });
    } else {
      for (var k = 0; k < G.N; k++) {
        if (!isFinite(x[k])) continue;
        var X = c.X(G.ts[k]).toFixed(1);
        h += '<line class="stem ' + key + (opt.faint ? " faint" : "") + '" x1="' + X + '" x2="' + X + '" y1="' + c.Y(0).toFixed(1) + '" y2="' + c.Y(x[k]).toFixed(1) + '"/>';
        h += '<circle class="stem-dot ' + key + (opt.faint ? " faint" : "") + '" cx="' + X + '" cy="' + c.Y(x[k]).toFixed(1) + '" r="' + (opt.faint ? 3 : 4) + '"/>';
      }
    }
    h += impulses(c, s.imps, key, opt.faint);
    return h;
  }
  function impulses(c, list, key, faint) {
    var h = "";
    (list || []).forEach(function (p) {
      if (p.t < c.xd[0] || p.t > c.xd[1] || Math.abs(p.w) < 1e-9) return;
      var X = c.X(p.t).toFixed(1), y1 = c.Y(clamp(p.w, c.yd[0], c.yd[1]));
      h += '<line class="impl ' + key + (faint ? " faint" : "") + '" x1="' + X + '" x2="' + X + '" y1="' + c.Y(0).toFixed(1) + '" y2="' + y1.toFixed(1) + '" marker-end="url(#im' + key + c.clip.match(/#(sg\d+)/)[1] + ')"/>';
      if (!faint) h += text(+X + 6, y1 + (p.w >= 0 ? 10 : -4), "(" + sig(p.w, 3) + ")", "lab imp-l");
    });
    return h;
  }
  function fill(c, ts, f, cls) {
    var d = "M" + c.X(ts[0]).toFixed(1) + " " + c.Y(0).toFixed(1);
    for (var i = 0; i < ts.length; i++) { var v = f(i); d += "L" + c.X(ts[i]).toFixed(1) + " " + c.Y(clamp(nz(v), c.yd[0] - 1e6, c.yd[1] + 1e6)).toFixed(1); }
    d += "L" + c.X(ts[ts.length - 1]).toFixed(1) + " " + c.Y(0).toFixed(1) + "Z";
    return '<path class="' + cls + '" d="' + d + '" ' + c.clip + "/>";
  }
  function intGrid(c) {
    if (!H.grid || !ct()) return "";
    var h = "", T = c.M.t, B = c.H - c.M.b;
    for (var t = Math.ceil(c.xd[0]); t <= c.xd[1]; t++) h += '<line class="igrid" x1="' + c.X(t) + '" x2="' + c.X(t) + '" y1="' + T + '" y2="' + B + '"/>';
    return h;
  }

  // ------------------------------------------------------------ charts registry
  var CH = {};
  function chart(id, opts) { if (!CH[id]) CH[id] = Chart($(id), opts); return CH[id]; }
  var TIMECHARTS = { explore: ["sgMain", "sgDer", "sgInt", "sgEven", "sgOdd", "sgEnergy"], transform: ["sgMain", "sgT1", "sgT2", "sgT3"], ops: ["sgMain"] };
  function timeOpts(h, label) { return { h: h, label: label, onMove: onMove, onLeave: onLeave, onKey: onKey }; }
  function xLabel() { return ct() ? "t" : "n"; }

  // ------------------------------------------------------------ EXPLORE
  var cur = {}; // current computed data for the cursor/tooltip
  function renderExplore() {
    var X = getSig("x1"), G = grid(), s = sample(X.c, G);
    var J = jumps(s), xd = [G.ts[0], G.ts[G.N - 1]];
    if (!ct()) xd = [G.ts[0] - 0.5, G.ts[G.N - 1] + 0.5];
    var c = chart("sgMain", timeOpts(380, "กราฟสัญญาณ"));
    var en = energy(s), mean = 0, cnt = 0;
    for (var i = 0; i < G.N; i++) if (isFinite(s.x[i])) { mean += s.x[i]; cnt++; }
    var area = 0; for (var q = 0; q < G.N; q++) area += nz(s.x[q]) * G.dt; s.imps.forEach(function (p) { area += p.w; });
    mean = ct() ? area / (S.tmax - S.tmin) : mean / Math.max(cnt, 1);
    var rms = Math.sqrt(en.E / (ct() ? S.tmax - S.tmin : G.N));
    frame(c, xd, [s], H.rms ? [rms, -rms] : []);
    var h = std(c, xLabel(), ct() ? "x(t)" : "x[n]") + intGrid(c);
    if (H.mean) h += line(c, xd[0], mean, xd[1], mean, "h-final") + text(c.W - c.M.r - 4, c.Y(mean) - 6, "ค่าเฉลี่ย = " + sig(mean), "lab", "end");
    if (H.rms) h += line(c, xd[0], rms, xd[1], rms, "h-env") + line(c, xd[0], -rms, xd[1], -rms, "h-env") + text(c.W - c.M.r - 4, c.Y(rms) - 6, "±RMS = " + sig(rms), "lab acc", "end");
    if (H.samp && ct()) {
      for (var k = Math.ceil(S.tmin / S.Ts); k * S.Ts <= S.tmax; k++) { var tk = k * S.Ts, vk = valAt(s, tk); if (!isFinite(vk)) continue; h += line(c, tk, 0, tk, vk, "samp-l") + dot(c, tk, vk, "samp-d", 3.6); }
    }
    h += draw(c, s, "s-cur");
    if (H.zero && ct()) zeros(s).forEach(function (t) { h += dot(c, t, 0, "pt-zero", 3.5); });
    if (H.peak) { var pk = peaks(s); pk.forEach(function (p) { h += dot(c, p.t, p.v, "pt-pk", 3.5); }); var rg = range(s); pk.filter(function (p) { return p.v === rg[1]; }).slice(0, 1).forEach(function (p) { h += text(c.X(p.t), c.Y(p.v) - 10, "สูงสุด " + sig(p.v) + " ที่ " + V() + " = " + sig(p.t), "lab", "middle"); }); }
    if (H.disc && ct()) J.forEach(function (j) { h += text(c.X(j.t) + 6, c.Y((s.x[j.i] + s.x[j.i + 1]) / 2), "กระโดด " + (j.j > 0 ? "+" : "") + sig(j.j), "lab acc"); });
    if (H.samp && ct() && c.W >= 520) h += text(c.M.l + 8, c.H - c.M.b - 8, "จุดสุ่ม Ts = " + sig(S.Ts) + " → fs = " + sig(1 / S.Ts) + " ตัวอย่าง/หน่วยเวลา", "lab muted");
    c.render(h);
    cur = { kind: "explore", list: [{ s: s, key: "s-cur", name: ct() ? "x(t)" : "x[n]" }] };

    // derivative / first difference
    var dv = deriv(s, J), cd = chart("sgDer", timeOpts(240, ct() ? "อนุพันธ์ของสัญญาณ" : "ผลต่างลำดับแรก"));
    var ds = { x: dv.x, imps: dv.imps, G: G };
    frame(cd, xd, [ds]);
    var hd = std(cd, xLabel(), ct() ? "dx/dt" : "x[n] − x[n−1]") + draw(cd, ds, "s-cur", { noJumpDots: true });
    if (ct() && s.imps.length) hd += text(cd.M.l + 8, cd.M.t + 26, "อนุพันธ์ของอิมพัลส์ (ดับเบลต) ไม่แสดง", "lab muted");
    if (ct() && dv.imps.length) hd += text(cd.W - cd.M.r - 4, cd.M.t + 12, "จุดกระโดดกลายเป็นอิมพัลส์", "lab acc", "end");
    cd.render(hd);
    // running integral / running sum
    var iv = integ(s), ci = chart("sgInt", timeOpts(240, ct() ? "อินทิกรัลสะสม" : "ผลรวมสะสม"));
    var is = { x: iv, imps: [], G: G };
    frame(ci, xd, [is]);
    ci.render(std(ci, xLabel(), ct() ? "∫ x dτ จาก " + sig(S.tmin) : "Σ x[k] จาก " + S.nmin) + draw(ci, is, "s-cur", { noJumpDots: true }));
    // even / odd
    var eo = evenOdd(X.c, s);
    [["sgEven", eo.e, "xₑ", "ส่วนคู่"], ["sgOdd", eo.o, "xₒ", "ส่วนคี่"]].forEach(function (q) {
      var cc = chart(q[0], timeOpts(240, q[3]));
      frame(cc, xd, [s, q[1]]);
      var hh = std(cc, xLabel(), q[2]) + draw(cc, s, "s-neu", { faint: true }) + draw(cc, q[1], "s-cur");
      if (cc.xd[0] < 0 && cc.xd[1] > 0) hh += text(cc.X(0) + 6, cc.M.t + 26, q[0] === "sgEven" ? "สมมาตรรอบแกนตั้ง" : "สมมาตรรอบจุดกำเนิด", "lab acc");
      if (ct() && Math.abs(S.tmin + S.tmax) > 1e-9) hh += text(cc.M.l + 8, cc.H - cc.M.b - 8, "ช่วงเวลาไม่สมมาตร: ส่วนคู่/คี่คำนวณจาก x(−t) จริง", "lab muted");
      cc.render(hh);
    });
    // energy
    var ce = chart("sgEnergy", timeOpts(240, "พลังงานสะสม"));
    var sq = new Float64Array(G.N); for (var r = 0; r < G.N; r++) sq[r] = nz(s.x[r]) * nz(s.x[r]);
    var es = { x: en.cum, imps: [], G: G }, sqs = { x: sq, imps: [], G: G };
    frame(ce, xd, [es, sqs]);
    var he = std(ce, xLabel(), "พลังงาน") + draw(ce, sqs, "s-neu", { faint: true, noJumpDots: true }) + draw(ce, es, "s-cur", { noJumpDots: true });
    he += text(ce.W - ce.M.r - 4, ce.Y(en.E) - 8, en.inf ? "มีอิมพัลส์ → พลังงานไม่จำกัด" : "E = " + sig(en.E), "lab acc", "end");
    ce.render(he);
    // spectrum
    var F = freqAxis(), mag = spectrum(s, F), cs = chart("sgSpec", { h: 240, label: "สเปกตรัมขนาด" });
    var sp = { x: mag, imps: [], G: { ts: Float64Array.from(F), dt: F[1] - F[0], N: F.length } };
    cs.size(); cs.xd = [F[0], F[F.length - 1]]; cs.yd = niceDomain(0, Math.max.apply(null, mag));
    var hs = axes(cs, fTicks(cs), ticks(cs.yd[0], cs.yd[1], 4), fFmt, function (v) { return sig(v, 2); }, ct() ? "f" : "ω", ct() ? "|X(f)|" : "|X(e^jω)|");
    hs += spectrumPath(cs, F, mag, "s-cur");
    cs.render(hs);

    statsExplore(s, en, mean, rms, J, eo);
    tableRows([["x", s]]);
  }
  function spectrumPath(c, F, mag, key, cls) {
    var d = "";
    for (var i = 0; i < F.length; i++) d += (i ? "L" : "M") + c.X(F[i]).toFixed(1) + " " + c.Y(mag[i]).toFixed(1);
    return '<path class="ser ' + key + (cls ? " " + cls : "") + '" d="' + d + '" ' + c.clip + "/>";
  }
  function stat(l, v, n) { var d = el("div", "stat"); d.appendChild(el("span", "stat-l", l)); d.appendChild(el("b", "stat-v", v)); if (n) d.appendChild(el("span", "stat-n", n)); return d; }
  function statsExplore(s, en, mean, rms, J, eo) {
    var box = $("sgStats"); box.textContent = "";
    var rg = range(s), T = period(s), ee = 0, eoE = 0;
    for (var i = 0; i < s.G.N; i++) { ee += nz(eo.e.x[i]) * nz(eo.e.x[i]); eoE += nz(eo.o.x[i]) * nz(eo.o.x[i]); }
    var causal = true;
    for (var k = 0; k < s.G.N; k++) if (s.G.ts[k] < -1e-9 && Math.abs(nz(s.x[k])) > 1e-9) { causal = false; break; }
    s.imps.forEach(function (p) { if (p.t < -1e-9) causal = false; });
    var tail = 0, n4 = Math.floor(s.G.N / 4); for (var q = 0; q < n4; q++) { tail += nz(s.x[q]) * nz(s.x[q]) + nz(s.x[s.G.N - 1 - q]) * nz(s.x[s.G.N - 1 - q]); }
    tail *= s.G.dt;
    var kind = en.inf ? "มีอิมพัลส์" : en.E < 1e-12 ? "เป็นศูนย์" : tail < 0.1 * en.E ? "สัญญาณพลังงาน" : "น่าจะเป็นสัญญาณกำลัง";
    box.appendChild(stat("ค่าสูงสุด / ต่ำสุด", sig(rg[1]) + " / " + sig(rg[0])));
    box.appendChild(stat("ค่าเฉลี่ย (DC)", sig(mean), "ในช่วงที่แสดง"));
    box.appendChild(stat("ค่า RMS", sig(rms), "√(พลังงาน/ช่วงเวลา)"));
    box.appendChild(stat("พลังงาน E", en.inf ? "∞" : sig(en.E), ct() ? "∫|x|² dt ในช่วงที่แสดง" : "Σ|x[n]|²"));
    box.appendChild(stat("ชนิด", kind, en.inf ? "δ มีพลังงานไม่จำกัด" : "พลังงานเฉลี่ย P = " + sig(en.P)));
    box.appendChild(stat("ความเป็นคาบ", T ? (ct() ? "T ≈ " + sig(T, 3) : "N₀ = " + Math.round(T)) : "ไม่พบคาบ", T ? (ct() ? "f₀ ≈ " + sig(1 / T, 3) : "ω₀ = 2π/" + Math.round(T)) : "ในช่วงที่แสดง"));
    box.appendChild(stat("สัดส่วนคู่ : คี่", ee + eoE > 0 ? Math.round((100 * ee) / (ee + eoE)) + "% : " + Math.round((100 * eoE) / (ee + eoE)) + "%" : "—", "ตามพลังงาน"));
    box.appendChild(stat("เป็นเหตุภาพ (causal)", causal ? "ใช่" : "ไม่ใช่", "x = 0 เมื่อ " + V() + " < 0"));
    if (ct()) box.appendChild(stat("จุดไม่ต่อเนื่อง", J.length ? J.length + " จุด" : "ต่อเนื่อง", J.length ? J.slice(0, 3).map(function (j) { return "t = " + sig(j.t, 3); }).join(", ") : "ไม่มีการกระโดด"));
    if (ct()) box.appendChild(stat("จุดตัดศูนย์", zeros(s).length + " จุด"));
  }

  // ------------------------------------------------------------ TRANSFORM
  function tParams() { return { A: S.A, a: S.a, t0: S.t0, C: S.C }; }
  var tAnim = null;
  function renderTransform() {
    var X = getSig("x1"), G = grid(), P = tAnim || tParams();
    var xd = ct() ? [S.tmin, S.tmax] : [G.ts[0] - 0.5, G.ts[G.N - 1] + 0.5];
    var x = sample(X.c, G), s1 = sample(X.c, G, 1, P.t0), s2 = sample(X.c, G, P.a, P.t0), y = sample(X.c, G, P.a, P.t0, P.A, P.C);
    var c = chart("sgMain", timeOpts(380, "สัญญาณเดิมและสัญญาณที่แปลงแล้ว"));
    frame(c, xd, [x, y]);
    var h = std(c, xLabel(), "") + intGrid(c);
    h += draw(c, x, "s-p1", { faint: !!H.steps && false });
    if (H.steps) { if (P.t0) h += draw(c, s1, "s-neu", { dash: true }); if (P.a !== 1) h += draw(c, s2, "s-neu", { dash: true, faint: true }); }
    h += draw(c, y, "s-cur");
    if (H.map) h += mapArrows(c, X.c, P);
    c.render(h);
    cur = { kind: "transform", list: [{ s: x, key: "s-p1", name: "x" }, { s: y, key: "s-cur", name: "y" }] };
    // step charts
    var steps = [["sgT1", x, s1, "ขั้น 1: เลื่อน " + (ct() ? "x(t − t₀)" : "x[n − n₀]")], ["sgT2", s1, s2, "ขั้น 2: สเกล/กลับ x(a(" + V() + " − " + V() + "₀))"], ["sgT3", s2, y, "ขั้น 3: A·(…) + C"]];
    steps.forEach(function (q) {
      var cc = chart(q[0], timeOpts(220, q[3]));
      frame(cc, xd, [q[1], q[2]]);
      cc.render(std(cc, xLabel(), "") + intGrid(cc) + draw(cc, q[1], "s-neu", { faint: true }) + draw(cc, q[2], "s-cur"));
    });
    // spectrum compare
    var F = freqAxis(), mx = spectrum(x, F), my = spectrum(y, F), cs = chart("sgTSpec", { h: 240, label: "สเปกตรัมเทียบกัน" });
    cs.size(); cs.xd = [F[0], F[F.length - 1]]; cs.yd = niceDomain(0, Math.max(Math.max.apply(null, mx), Math.max.apply(null, my)));
    var hs = axes(cs, fTicks(cs), ticks(cs.yd[0], cs.yd[1], 4), fFmt, function (v) { return sig(v, 2); }, ct() ? "f" : "ω", "|X| และ |Y|");
    hs += spectrumPath(cs, F, mx, "s-p1") + spectrumPath(cs, F, my, "s-cur");
    cs.render(hs);
    // stats
    var box = $("sgStats"); box.textContent = "";
    var ex = energy(x), ey = energy(y);
    box.appendChild(stat("รูปแบบ", "y = A·x(a(" + V() + " − " + V() + "₀)) + C", "= A·x(a" + V() + " − b) + C, b = a" + V() + "₀ = " + sig(P.a * P.t0)));
    box.appendChild(stat("เลื่อนเวลา " + V() + "₀", sig(P.t0), P.t0 > 0 ? "ไปทางขวา (ล่าช้า)" : P.t0 < 0 ? "ไปทางซ้าย (นำหน้า)" : "ไม่เลื่อน"));
    box.appendChild(stat("สเกลเวลา a", sig(P.a), Math.abs(P.a) > 1 ? "บีบเข้า " + sig(Math.abs(P.a)) + " เท่า" : Math.abs(P.a) < 1 ? "ยืดออก " + sig(1 / Math.abs(P.a)) + " เท่า" : "เท่าเดิม"));
    box.appendChild(stat("กลับทิศเวลา", P.a < 0 ? "ใช่" : "ไม่", P.a < 0 ? "สะท้อนรอบ " + V() + " = " + sig(P.t0) : "a > 0"));
    box.appendChild(stat("พลังงาน x", ex.inf ? "∞" : sig(ex.E)));
    box.appendChild(stat("พลังงาน y", ey.inf ? "∞" : sig(ey.E), P.C === 0 && ct() && !ex.inf ? "ทฤษฎี A²E/|a| = " + sig((P.A * P.A * ex.E) / Math.abs(P.a)) : P.C ? "C ≠ 0 เพิ่มพลังงาน" : ""));
    tableRows([["x", x], ["y", y]]);
  }
  // follow two reference points of x through the transform: τ → t = t0 + τ/a
  function mapArrows(c, X, P) {
    var h = "", G = grid(), ctx = { t: 0, dt: G.dt, on: false, hit: false };
    (ct() ? [0, 1] : [0, 2]).forEach(function (tau, i) {
      ctx.t = tau; var xv = X.fn(ctx); if (!isFinite(xv)) return;
      var t = P.t0 + tau / P.a, yv = P.A * xv + P.C;
      if (t < c.xd[0] || t > c.xd[1] || tau < c.xd[0] || tau > c.xd[1]) return;
      h += dot(c, tau, xv, "pt-map" + i, 5) + dot(c, t, yv, "pt-map" + i, 5);
      h += '<path class="maparrow" d="M' + c.X(tau).toFixed(1) + " " + c.Y(xv).toFixed(1) + " Q" + ((c.X(tau) + c.X(t)) / 2).toFixed(1) + " " + (Math.min(c.Y(xv), c.Y(yv)) - 40).toFixed(1) + " " + c.X(t).toFixed(1) + " " + c.Y(yv).toFixed(1) + '" marker-end="' + c.arrow + '"/>';
      h += text(c.X(t) + 6, c.Y(yv) + 16, V() + " = " + sig(t, 3), "lab acc");
      h += text(c.X(tau) - 6, c.Y(xv) + 16, (ct() ? "τ = " : "k = ") + tau, "lab muted", "end");
    });
    return h;
  }

  // ------------------------------------------------------------ OPERATIONS
  function opsCompute() {
    var X1 = getSig("x1"), X2 = getSig("x2"), G = grid();
    var x1 = sample(X1.c, G), x2 = sample(X2.c, G), N = G.N, y = new Float64Array(N), yi = [];
    if (S.op === "conv") {
      if (ct()) {
        // lag grid m·dt for m = −(N−1)…(N−1): t_i − τ_k = (i − k)·dt exactly
        // midpoint rule: τ_k = tmin + (k + ½)dt never lands on a jump at a grid point, so steps and pulses convolve accurately.
        // t_i − τ_k = (i − k)dt − dt/2, so x2 is needed on the lag grid m·dt − dt/2.
        var Gm = { ts: new Float64Array(N), dt: G.dt, N: N };
        for (var q0 = 0; q0 < N; q0++) Gm.ts[q0] = G.ts[q0] + G.dt / 2;
        // Impulses are handled exactly (sifting), the regular parts with the midpoint rule.
        var x1m = sample(X1.c, Gm), lag = new Float64Array(2 * N), ctx = { t: 0, dt: G.dt, on: false, hit: false };
        var base = function (c, t) { ctx.t = t; ctx.on = false; var v = c.fn(ctx); if (!isFinite(v)) { ctx.t = t + 1e-9; v = c.fn(ctx); } return nz(v); };
        for (var m = -(N - 1); m <= N; m++) lag[m + N - 1] = base(X2.c, m * G.dt - G.dt / 2);
        for (var i = 0; i < N; i++) {
          var acc = 0;
          for (var k = 0; k < N - 1; k++) { var a1 = x1m.x[k]; if (a1 !== 0 && isFinite(a1)) acc += a1 * lag[i - k + N - 1]; }
          y[i] = acc * G.dt;
          for (var p1 = 0; p1 < x1.imps.length; p1++) y[i] += x1.imps[p1].w * base(X2.c, G.ts[i] - x1.imps[p1].t);
          for (var p2 = 0; p2 < x2.imps.length; p2++) y[i] += x2.imps[p2].w * base(X1.c, G.ts[i] - x2.imps[p2].t);
        }
        x1.imps.forEach(function (p) { x2.imps.forEach(function (q) { var tt = p.t + q.t; if (tt >= G.ts[0] && tt <= G.ts[N - 1]) yi.push({ t: G.ts[Math.round((tt - G.ts[0]) / G.dt)], w: p.w * q.w }); }); });
      } else {
        for (var n = 0; n < N; n++) {
          var s = 0;
          for (var q = 0; q < N; q++) { var ctx2 = { t: G.ts[n] - G.ts[q], dt: 1 }; s += nz(x1.x[q]) * nz(X2.c.fn(ctx2)); }
          y[n] = s;
        }
      }
    } else {
      for (var j = 0; j < N; j++) {
        var a = nz(x1.x[j]), b = nz(x2.x[j]);
        y[j] = S.op === "add" ? a + b : S.op === "sub" ? a - b : a * b;
      }
      if (S.op === "add" || S.op === "sub") yi = x1.imps.concat(x2.imps.map(function (p) { return { t: p.t, w: S.op === "sub" ? -p.w : p.w }; }));
      if (S.op === "mul") yi = x1.imps.map(function (p) { return { t: p.t, w: p.w * nz(valAt(x2, p.t)) }; }).concat(x2.imps.map(function (p) { return { t: p.t, w: p.w * nz(valAt(x1, p.t)) }; }));
    }
    return { X1: X1, X2: X2, G: G, x1: x1, x2: x2, y: { x: y, on: y, imps: mergeImps(yi, G.dt), G: G } };
  }
  var opsData = null;
  function renderOps() {
    var D = opsCompute(); opsData = D;
    var G = D.G, xd = ct() ? [S.tmin, S.tmax] : [G.ts[0] - 0.5, G.ts[G.N - 1] + 0.5];
    var c = chart("sgMain", timeOpts(380, "สัญญาณสองตัวและผลลัพธ์"));
    frame(c, xd, [D.x1, D.x2, D.y]);
    var h = std(c, xLabel(), "") + intGrid(c);
    if (S.op === "mul" && H.env) {
      var env = { x: D.x1.x.map(Math.abs), imps: [], G: G }, envn = { x: D.x1.x.map(function (v) { return -Math.abs(v); }), imps: [], G: G };
      h += draw(c, env, "s-neu", { dash: true, noJumpDots: true }) + draw(c, envn, "s-neu", { dash: true, noJumpDots: true });
      h += text(c.M.l + 8, c.M.t + 26, "เปลือก ±|x₁|: ผลคูณถูกจำกัดอยู่ในเปลือกนี้", "lab muted");
    }
    h += draw(c, D.x1, "s-p1", { faint: true }) + draw(c, D.x2, "s-p2", { faint: true }) + draw(c, D.y, "s-cur");
    if (S.op === "conv" && cursor != null && cursor >= xd[0] && cursor <= xd[1]) h += dot(c, cursor, nz(valAt(D.y, cursor)), "pt-cur s-cur", 6);
    c.render(h);
    cur = { kind: "ops", list: [{ s: D.x1, key: "s-p1", name: "x₁" }, { s: D.x2, key: "s-p2", name: "x₂" }, { s: D.y, key: "s-cur", name: "y" }] };
    renderConvPanel();
    // spectra
    var F = freqAxis(), m1 = spectrum(D.x1, F), m2 = spectrum(D.x2, F), my = spectrum(D.y, F), cs = chart("sgOSpec", { h: 260, label: "สเปกตรัมของสัญญาณทั้งสามตัว" });
    cs.size(); cs.xd = [F[0], F[F.length - 1]];
    var mxv = Math.max(Math.max.apply(null, m1), Math.max.apply(null, m2), Math.max.apply(null, my));
    cs.yd = niceDomain(0, mxv);
    var hs = axes(cs, fTicks(cs), ticks(cs.yd[0], cs.yd[1], 4), fFmt, function (v) { return sig(v, 2); }, ct() ? "f" : "ω", "ขนาดสเปกตรัม");
    hs += spectrumPath(cs, F, m1, "s-p1", "thin") + spectrumPath(cs, F, m2, "s-p2", "thin") + spectrumPath(cs, F, my, "s-cur");
    if (S.op === "conv") hs += text(cs.W - cs.M.r - 4, cs.M.t + 14, "คอนโวลูชันในเวลา = การคูณในความถี่: |Y| = |X₁|·|X₂|", "lab acc", "end");
    if (S.op === "mul") hs += text(cs.W - cs.M.r - 4, cs.M.t + 14, "การคูณในเวลา = คอนโวลูชันในความถี่ (สเปกตรัมเลื่อนและแผ่)", "lab acc", "end");
    if (S.op === "add" || S.op === "sub") hs += text(cs.W - cs.M.r - 4, cs.M.t + 14, "ความเป็นเชิงเส้น: X₁ ± X₂ (เชิงซ้อน)", "lab acc", "end");
    cs.render(hs);
    // stats
    var box = $("sgStats"); box.textContent = "";
    var ar = function (s) { var a = 0; for (var i = 0; i < s.G.N; i++) a += nz(s.x[i]) * s.G.dt; s.imps.forEach(function (p) { a += p.w; }); return a; };
    var OPN = { add: "x₁ + x₂", sub: "x₁ − x₂", mul: "x₁ · x₂", conv: "x₁ ∗ x₂ (คอนโวลูชัน)" };
    box.appendChild(stat("การดำเนินการ", OPN[S.op]));
    var e1 = energy(D.x1), e2 = energy(D.x2), ey = energy(D.y);
    box.appendChild(stat("พลังงาน x₁ / x₂", (e1.inf ? "∞" : sig(e1.E)) + " / " + (e2.inf ? "∞" : sig(e2.E))));
    box.appendChild(stat("พลังงาน y", ey.inf ? "∞" : sig(ey.E)));
    if (S.op === "conv") {
      var A1 = ar(D.x1), A2 = ar(D.x2), Ay = ar(D.y);
      var inside = support(D.x1).indexOf("…") < 0 && support(D.x2).indexOf("…") < 0;
      box.appendChild(stat("พื้นที่ใต้ y", sig(Ay), inside ? "เทียบ พื้นที่ x₁ × พื้นที่ x₂ = " + sig(A1 * A2) : "สัญญาณยาวเกินช่วงที่แสดง จึงเทียบพื้นที่ไม่ได้"));
      box.appendChild(stat("y ที่ตำแหน่งที่เลือก", cursor != null ? sig(nz(valAt(D.y, cursor))) : "—", cursor != null ? V() + " = " + sig(cursor, 3) : "ชี้ที่กราฟ"));
      box.appendChild(stat("ช่วงที่ไม่เป็นศูนย์", support(D.x1) + " ∗ " + support(D.x2), "→ y: " + support(D.y)));
    }
    tableRows([["x₁", D.x1], ["x₂", D.x2], ["y", D.y]]);
  }
  function support(s) {
    var a = null, b = null, rg = range(s), th = 1e-6 * Math.max(1, Math.abs(rg[0]), Math.abs(rg[1]));
    for (var i = 0; i < s.G.N; i++) if (Math.abs(nz(s.x[i])) > th) { if (a == null) a = s.G.ts[i]; b = s.G.ts[i]; }
    s.imps.forEach(function (p) { a = a == null ? p.t : Math.min(a, p.t); b = b == null ? p.t : Math.max(b, p.t); });
    if (a == null) return "∅";
    var lo = a <= s.G.ts[0] + 1e-9 ? "…" : sig(a, 3), hi = b >= s.G.ts[s.G.N - 1] - 1e-9 ? "…" : sig(b, 3);
    return "[" + lo + ", " + hi + "]";
  }
  // flip & slide: x1(τ) and x2(t − τ) on the τ axis, shaded product = y(t)
  function renderConvPanel() {
    var card = $("sgConvCard");
    card.hidden = S.mode !== "ops" || S.op !== "conv";
    if (card.hidden || !opsData) return;
    var D = opsData, G = D.G, t = cursor == null ? (ct() ? 1 : 3) : cursor;
    var c = chart("sgConv", { h: 260, label: "การกลับและเลื่อนในคอนโวลูชัน" });
    var xd = ct() ? [S.tmin, S.tmax] : [G.ts[0] - 0.5, G.ts[G.N - 1] + 0.5];
    var fl = sample(D.X2.c, G, -1, t); // x2(t − τ) = x2(−(τ − t))
    var prod = new Float64Array(G.N); for (var i = 0; i < G.N; i++) prod[i] = nz(D.x1.x[i]) * nz(fl.x[i]);
    var ps = { x: prod, imps: [], G: G };
    frame(c, xd, [D.x1, fl, ps]);
    var h = std(c, ct() ? "τ" : "k", "");
    if (ct()) h += fill(c, G.ts, function (i) { return prod[i]; }, "conv-area");
    h += draw(c, D.x1, "s-p1") + draw(c, fl, "s-p2");
    if (!ct()) h += draw(c, ps, "s-cur", {});
    h += line(c, t, c.yd[0], t, c.yd[1], "hair");
    var yv = nz(valAt(D.y, t));
    h += text(c.X(t) + 6, c.M.t + 14, (ct() ? "t = " : "n = ") + sig(t, 3) + " → y = " + sig(yv, 4), "lab acc");
    c.render(h);
    $("convNote").textContent = ct()
      ? "x₂ ถูกกลับเป็น x₂(−τ) แล้วเลื่อนไป t = " + sig(t, 3) + " พื้นที่แรเงา (ผลคูณ x₁(τ)·x₂(t − τ)) คือค่า y(t) = " + sig(yv, 4)
      : "x₂[k] ถูกกลับและเลื่อนไป n = " + Math.round(t) + " ผลรวมของผลคูณ x₁[k]·x₂[n − k] คือ y[n] = " + sig(yv, 4);
  }

  // ------------------------------------------------------------ cursor & tooltip
  function snap(t) { return ct() ? t : Math.round(t); }
  function onMove(c, px) {
    if (anim) return;
    if (px < c.M.l || px > c.W - c.M.r) return;
    cursor = snap(clamp(c.invX(px), ct() ? S.tmin : S.nmin, ct() ? S.tmax : S.nmax));
    if (S.mode === "ops" && S.op === "conv") { renderOps(); }
    drawCursor();
  }
  function onLeave() { if (anim || (S.mode === "ops" && S.op === "conv")) return; cursor = null; drawCursor(); }
  function onKey(e) {
    var step = ct() ? (S.tmax - S.tmin) / 100 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      cursor = snap(clamp((cursor == null ? 0 : cursor) + (e.key === "ArrowRight" ? step : -step), ct() ? S.tmin : S.nmin, ct() ? S.tmax : S.nmax));
      if (S.mode === "ops" && S.op === "conv") renderOps();
      drawCursor(); return true;
    }
    return false;
  }
  function drawCursor() {
    var ids = TIMECHARTS[S.mode];
    ids.forEach(function (id) { var c = CH[id]; if (c && c.cur) c.cur.innerHTML = ""; });
    var m = CH.sgMain; if (!m) return; m.tip.hidden = true;
    if (cursor == null) return;
    ids.forEach(function (id) {
      var c = CH[id]; if (!c || !c.cur || c.box.offsetParent === null) return;
      var x = c.X(cursor);
      c.cur.innerHTML = '<line class="hair" x1="' + x + '" x2="' + x + '" y1="' + c.M.t + '" y2="' + (c.H - c.M.b) + '"/>';
    });
    var h = "";
    cur.list.forEach(function (it) { var v = valAt(it.s, cursor); if (isFinite(v)) h += dot(m, cursor, v, "pt-cur " + it.key, 5); });
    m.cur.innerHTML += h;
    var tip = m.tip; tip.textContent = "";
    var hd = el("div", "tt-head"); hd.appendChild(el("b", null, V() + " = " + sig(cursor, 4))); tip.appendChild(hd);
    cur.list.forEach(function (it) {
      var row = el("div", "tt-row"); row.appendChild(el("i", "key " + it.key)); row.appendChild(el("b", null, sig(valAt(it.s, cursor), 4))); row.appendChild(el("span", null, " " + it.name)); tip.appendChild(row);
      var imp = it.s.imps.filter(function (p) { return Math.abs(p.t - cursor) < (ct() ? (S.tmax - S.tmin) / 150 : 0.5); })[0];
      if (imp) { var r2 = el("div", "tt-row sub"); r2.appendChild(el("b", null, sig(imp.w, 3) + "·δ")); r2.appendChild(el("span", null, " อิมพัลส์ที่ " + V() + " = " + sig(imp.t, 3))); tip.appendChild(r2); }
    });
    tip.hidden = false;
    var px = m.X(cursor);
    tip.style.left = Math.max(4, px < m.W / 2 ? m.W - m.M.r - tip.offsetWidth - 8 : m.M.l + 8) + "px";
    tip.style.top = m.M.t + 8 + "px";
  }

  // ------------------------------------------------------------ table
  function tableRows(cols) {
    var t = $("sgTbl"), th = t.querySelector("thead tr"), tb = t.querySelector("tbody");
    th.textContent = ""; tb.textContent = "";
    th.appendChild(el("th", null, V()));
    cols.forEach(function (c) { th.appendChild(el("th", null, c[0] + (ct() ? "(t)" : "[n]"))); });
    var pts = [];
    if (ct()) { var st = niceStep(S.tmax - S.tmin, 10); for (var v = Math.ceil(S.tmin / st) * st; v <= S.tmax + 1e-9; v += st) pts.push(+v.toFixed(10)); }
    else for (var n = S.nmin; n <= S.nmax && pts.length < 41; n++) pts.push(n);
    pts.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.appendChild(el("td", null, sig(p, 4)));
      cols.forEach(function (c) {
        var v = valAt(c[1], p), imp = c[1].imps.filter(function (q) { return Math.abs(q.t - p) < c[1].G.dt * 0.75; })[0];
        tr.appendChild(el("td", null, sig(v, 4) + (imp ? " + " + sig(imp.w, 3) + "δ" : "")));
      });
      tb.appendChild(tr);
    });
  }

  // ------------------------------------------------------------ equations
  function renderEq() {
    var X1 = getSig("x1"), X2 = getSig("x2"), v = V(), b = ct() ? "(" : "[", e = ct() ? ")" : "]";
    var parts = [["sgEq1", "x" + (S.mode === "ops" ? "_1" : "") + b + v + e + " = " + X1.c.tex]];
    if (S.mode === "ops") {
      parts.push(["sgEq2", "x_2" + b + v + e + " = " + X2.c.tex]);
      var op = { add: "x_1" + b + v + e + " + x_2" + b + v + e, sub: "x_1" + b + v + e + " - x_2" + b + v + e, mul: "x_1" + b + v + e + "\\,x_2" + b + v + e,
        conv: ct() ? "\\int_{-\\infty}^{\\infty} x_1(\\tau)\\,x_2(t-\\tau)\\,d\\tau" : "\\sum_{k} x_1[k]\\,x_2[n-k]" }[S.op];
      parts.push(["sgEq3", "y" + b + v + e + " = " + op]);
    } else if (S.mode === "transform") {
      var P = tAnim || tParams(), arg = (P.a === 1 ? "" : sig(P.a, 3)) + (P.t0 ? "\\left(" + v + (P.t0 > 0 ? " - " : " + ") + sig(Math.abs(P.t0), 3) + "\\right)" : (P.a === 1 ? v : "\\," + v));
      parts.push(["sgEq2", "y" + b + v + e + " = " + (P.A === 1 ? "" : sig(P.A, 3) + "\\,") + "x" + b + arg + e + (P.C ? (P.C > 0 ? " + " : " - ") + sig(Math.abs(P.C), 3) : "")]);
      parts.push(["sgEq3", ""]);
    } else { parts.push(["sgEq2", ""]); parts.push(["sgEq3", ""]); }
    parts.forEach(function (q) {
      var node = $(q[0]); node.parentNode.hidden = !q[1];
      if (!q[1]) return;
      if (window.katex) { try { window.katex.render(q[1], node, { throwOnError: false }); return; } catch (x) {} }
      node.textContent = q[1];
    });
    [["x1", X1], ["x2", X2]].forEach(function (q) {
      var m = $("err_" + q[0]);
      m.textContent = q[1].err ? "⚠ " + q[1].err.err + (q[1].err.pos != null ? " (ตำแหน่ง " + (q[1].err.pos + 1) + ")" : "") + " · ใช้สมการล่าสุดที่ถูกต้องแทน" : "";
      $("in_" + q[0]).classList.toggle("bad", !!q[1].err);
    });
  }

  // ------------------------------------------------------------ controls
  function seg(id, v) { $(id).querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"); }); }
  function fillPresets() {
    ["x1", "x2"].forEach(function (k) {
      var sel = $("pre_" + k); sel.textContent = "";
      var o0 = el("option", null, "เลือกสัญญาณพื้นฐาน…"); o0.value = ""; sel.appendChild(o0);
      PRESETS[S.dom].forEach(function (p) { var o = el("option", null, p[1] + "  ·  " + p[0]); o.value = p[0]; sel.appendChild(o); });
    });
  }
  // show/hide blocks: data-show="mode:explore,transform dom:ct op:mul"
  function applyVisibility() {
    var now = { mode: S.mode, dom: S.dom, op: S.op };
    root.querySelectorAll("[data-show]").forEach(function (n) {
      var ok = n.dataset.show.split(" ").every(function (part) { var kv = part.split(":"); return kv[1].split(",").indexOf(now[kv[0]]) >= 0; });
      n.hidden = !ok;
    });
  }
  function syncControls() {
    applyVisibility();
    seg("sgMode", S.mode); seg("sgDom", S.dom); seg("sgOp", S.op);
    root.dataset.mode = S.mode; root.dataset.dom = S.dom; root.dataset.op = S.op;
    $("in_x1").value = srcOf("x1"); $("in_x2").value = srcOf("x2");
    $("lab_x1").textContent = S.mode === "ops" ? (ct() ? "x₁(t) =" : "x₁[n] =") : ct() ? "x(t) =" : "x[n] =";
    $("lab_x2").textContent = ct() ? "x₂(t) =" : "x₂[n] =";
    $("sA").value = S.A; $("sC").value = S.C;
    $("sT0").step = ct() ? 0.1 : 1; $("sT0").value = S.t0;
    var aSel = $("sAsel"); aSel.hidden = ct(); $("sA_ct").hidden = !ct();
    $("sa").value = S.a; $("sAselIn").value = String(S.a);
    $("nTmin").value = ct() ? S.tmin : S.nmin; $("nTmax").value = ct() ? S.tmax : S.nmax;
    $("winLabel").textContent = ct() ? "ช่วงเวลา t" : "ช่วง n";
    $("sTs").value = S.Ts; $("sFmax").value = S.fmax;
    Object.keys(H).forEach(function (k) { var cb = $("hs_" + k); if (cb) cb.checked = H[k]; });
    readouts();
  }
  function readouts() {
    $("vA").textContent = sig(S.A, 3); $("vC").textContent = sig(S.C, 3); $("vT0").textContent = sig(S.t0, 3); $("va").textContent = sig(S.a, 3);
    $("vTs").textContent = sig(S.Ts, 3) + " (fs = " + sig(1 / S.Ts, 3) + ")"; $("vFmax").textContent = sig(S.fmax, 3);
    var lg = $("sgLegend"); lg.textContent = "";
    var items = S.mode === "explore" ? [["s-cur", ct() ? "x(t)" : "x[n]"]] : S.mode === "transform" ? [["s-p1", "x เดิม"], ["s-cur", "y ที่แปลงแล้ว"]].concat(H.steps ? [["s-neu dash", "ขั้นกลาง"]] : []) : [["s-p1", "x₁"], ["s-p2", "x₂"], ["s-cur", "y = ผลลัพธ์"]];
    items.forEach(function (it) { var s = el("span", "lg"); s.appendChild(el("i", "key " + it[0])); s.appendChild(document.createTextNode(it[1])); lg.appendChild(s); });
  }
  function bindSeg(id, key, after) { $(id).addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S[key] = b.dataset.v; if (after) after(); stopAnim(); syncControls(); update(); }); }
  bindSeg("sgMode", "mode", function () { cursor = S.mode === "ops" && S.op === "conv" ? (ct() ? 1 : 3) : null; });
  bindSeg("sgDom", "dom", function () { fillPresets(); cursor = null; if (!ct() && [1, -1, 2, -2, 3, -3, 0.5, -0.5].indexOf(S.a) < 0) S.a = 1; if (!ct()) S.t0 = Math.round(S.t0); });
  bindSeg("sgOp", "op", function () { if (S.op === "conv" && cursor == null) cursor = ct() ? 1 : 3; });
  ["x1", "x2"].forEach(function (k) {
    var inp = $("in_" + k), t;
    inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { if (ct()) S[k] = inp.value; else S[k + "n"] = inp.value; update(); }, 250); });
    $("pre_" + k).addEventListener("change", function () { if (!this.value) return; if (ct()) S[k] = this.value; else S[k + "n"] = this.value; inp.value = this.value; this.value = ""; update(); });
  });
  function onIn(id, fn) { $(id).addEventListener("input", function () { fn(this); stopAnim(); readouts(); update(); }); }
  onIn("sA", function (e) { S.A = +e.value; });
  onIn("sC", function (e) { S.C = +e.value; });
  onIn("sT0", function (e) { S.t0 = +e.value; });
  onIn("sa", function (e) { var v = +e.value; if (Math.abs(v) < 0.1) v = v < 0 ? -0.1 : 0.1; S.a = r3(v, 3); });
  $("sAselIn").addEventListener("change", function () { S.a = +this.value; readouts(); update(); });
  onIn("sTs", function (e) { S.Ts = +e.value; });
  onIn("sFmax", function (e) { S.fmax = +e.value; });
  function win() {
    var a = parseFloat($("nTmin").value), b = parseFloat($("nTmax").value);
    if (!(b > a)) return;
    if (ct()) { S.tmin = clamp(a, -1000, 1000); S.tmax = clamp(b, S.tmin + 0.1, 1000); }
    else { S.nmin = Math.round(clamp(a, -200, 200)); S.nmax = Math.round(clamp(b, S.nmin + 1, S.nmin + 200)); }
    update();
  }
  $("nTmin").addEventListener("change", win); $("nTmax").addEventListener("change", win);
  Object.keys(H).forEach(function (k) { var cb = $("hs_" + k); if (cb) cb.addEventListener("change", function () { H[k] = cb.checked; readouts(); update(); }); });
  $("sgFn").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-ins]"); if (!b) return;
    var inp = $("in_x1"), s = inp.selectionStart || inp.value.length, ins = b.dataset.ins.replace(/t/g, V());
    inp.value = inp.value.slice(0, s) + ins + inp.value.slice(inp.selectionEnd || s); inp.focus();
    inp.dispatchEvent(new Event("input"));
  });
  $("sgReset").addEventListener("click", function () { stopAnim(); S = JSON.parse(JSON.stringify(DEF)); H = JSON.parse(JSON.stringify(HDEF)); cursor = null; fillPresets(); syncControls(); update(); });
  $("sgShare").addEventListener("click", function () { writeHash(); var b = this, o = b.textContent, d = function () { b.textContent = "คัดลอกลิงก์แล้ว ✓"; setTimeout(function () { b.textContent = o; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(d, d); else d(); });

  // ------------------------------------------------------------ animations
  var PLAYLBL = { explore: "▶ เดินตามเวลา", transform: "▶ แปลงทีละขั้น", ops: "▶ เลื่อน t" };
  function stopAnim() { if (!anim) return; cancelAnimationFrame(anim.raf); anim = null; tAnim = null; $("sgPlay").textContent = PLAYLBL[S.mode]; }
  $("sgPlay").addEventListener("click", function () {
    var b = this;
    if (anim) { stopAnim(); update(); return; }
    var t0 = performance.now(), dur = S.mode === "transform" ? 6000 : 7000, lo = ct() ? S.tmin : S.nmin, hi = ct() ? S.tmax : S.nmax, T = tParams();
    anim = {}; b.textContent = "❚❚ หยุด";
    (function step(now) {
      if (!anim) return;
      var f = Math.min(1, (now - t0) / dur);
      if (S.mode === "transform") {
        var f1 = clamp(f * 3, 0, 1), f2 = clamp(f * 3 - 1, 0, 1), f3 = clamp(f * 3 - 2, 0, 1);
        var aa = (1 + f2 * (Math.abs(T.a) - 1)) * (T.a < 0 ? Math.cos(Math.PI * f2) : 1);
        if (!ct()) aa = f2 < 1 ? 1 : T.a;
        tAnim = { t0: ct() ? f1 * T.t0 : Math.round(f1 * T.t0), a: aa, A: 1 + f3 * (T.A - 1), C: f3 * T.C };
        $("sgStage").textContent = f < 1 / 3 ? "ขั้น 1: เลื่อนเวลา" : f < 2 / 3 ? "ขั้น 2: สเกล/กลับเวลา" : "ขั้น 3: ปรับแอมพลิจูดและเลื่อนแนวตั้ง";
        renderTransform(); renderEq();
      } else {
        cursor = snap(lo + f * (hi - lo));
        if (S.mode === "ops" && S.op === "conv") renderOps();
        drawCursor();
      }
      if (f < 1) anim.raf = requestAnimationFrame(step);
      else { anim = null; tAnim = null; $("sgStage").textContent = ""; b.textContent = PLAYLBL[S.mode]; update(); }
    })(t0);
  });

  // ------------------------------------------------------------ URL state
  function writeHash() {
    var keys = ["mode", "dom", "x1", "x2", "x1n", "x2n", "A", "a", "t0", "C", "op", "tmin", "tmax", "nmin", "nmax", "Ts", "fmax"];
    history.replaceState(null, "", "#" + keys.map(function (k) { return k + "=" + encodeURIComponent(S[k]); }).join("&"));
  }
  function readHash() {
    if (!location.hash || location.hash.length < 3) return;
    location.hash.slice(1).split("&").forEach(function (kv) {
      var i = kv.indexOf("="), k = kv.slice(0, i), v = decodeURIComponent(kv.slice(i + 1));
      if (!(k in DEF)) return;
      if (typeof DEF[k] === "number") { var n = parseFloat(v); if (isFinite(n)) S[k] = n; }
      else if (k === "mode" && /^(explore|transform|ops)$/.test(v)) S.mode = v;
      else if (k === "dom" && /^(ct|dt)$/.test(v)) S.dom = v;
      else if (k === "op" && /^(add|sub|mul|conv)$/.test(v)) S.op = v;
      else if (/^x[12]n?$/.test(k) && v.length < 300) S[k] = v;
    });
    if (!(S.tmax > S.tmin)) { S.tmin = DEF.tmin; S.tmax = DEF.tmax; }
    if (!(S.nmax > S.nmin)) { S.nmin = DEF.nmin; S.nmax = DEF.nmax; }
    if (S.a === 0) S.a = 1;
  }

  // ------------------------------------------------------------ render
  var hashT;
  function update() {
    renderEq();
    if (S.mode === "explore") renderExplore();
    else if (S.mode === "transform") renderTransform();
    else renderOps();
    if (S.mode !== "ops") $("sgConvCard").hidden = true;
    $("sgPlay").textContent = anim ? "❚❚ หยุด" : PLAYLBL[S.mode];
    drawCursor();
    clearTimeout(hashT); hashT = setTimeout(writeHash, 500);
  }
  readHash();
  if (S.mode === "ops" && S.op === "conv") cursor = ct() ? 1 : 3;
  fillPresets(); syncControls(); update();
  var ro = new ResizeObserver(function () { clearTimeout(ro.t); ro.t = setTimeout(function () { if (!anim) update(); }, 100); });
  ro.observe(root);
})();
