/* Digital storage oscilloscope model for the FG / oscilloscope lab.
   Signal chain per channel: probe (1× or 10× with compensation trimmer) → coupling (DC / AC / GND) →
   bandwidth (100 MHz or 20 MHz limit) → probe-ratio setting → 8-bit ADC (25 codes/div, ±5.12 div).
   Trigger: edge, CH1 / CH2 / EXT (generator sync), Auto / Normal / Single, with hysteresis.
   Also: automatic measurements, FFT, averaging, autoset and the canvas renderer. */
(function () {
  "use strict";
  var FGS = (window.FGS = window.FGS || {});
  var U = FGS.util, TAU = U.TAU, clamp = U.clamp;
  var MEM = 10000, FS_MAX = 1e9, CODES = 25, SCOPE_BW = 100e6, BWL = 20e6, PROBE1X_BW = 6e6;
  var COLORS = ["#f6d32d", "#2ed3e6", "#e879f9", "#7ee787"];

  function defaults() {
    return {
      run: true, single: false,
      ch: [{ on: true, vdiv: 1, pos: 0, coup: "DC", probe: 10, bwl: false, inv: false },
           { on: true, vdiv: 1, pos: 0, coup: "DC", probe: 10, bwl: false, inv: false }],
      probes: [{ x: 10, comp: 0 }, { x: 10, comp: 0 }],
      tdiv: 2e-4, hpos: 0,
      trig: { src: 0, slope: "rise", level: 0, mode: "auto" },
      math: "off", fftSrc: 0, fftDb: 20, xy: false, acq: "normal", avgN: 16, persist: false,
      cursor: { mode: "off", src: 0, x1: 3, x2: 7, y1: 2, y2: -2 }
    };
  }

  // ----------------------------------------------------------------------- signal chain
  function chainOf(sc, i) {
    var ch = sc.ch[i], pr = sc.probes[i], att = pr.x === 10 ? 0.1 : 1, fast = [];
    if (pr.x === 1) fast.push(1 / (TAU * PROBE1X_BW));
    fast.push(1 / (TAU * (ch.bwl ? BWL : SCOPE_BW)));
    return {
      att: att, gnd: ch.coup === "GND", scale: ch.probe * (ch.inv ? -1 : 1),
      comp: pr.x === 10 && Math.abs(pr.comp) > 1e-3 ? { tp: 100e-6, r: 1 + 0.35 * pr.comp } : null,
      ac: ch.coup === "AC" ? { tau: 1 / (TAU * (pr.x === 10 ? 0.7 : 7)) } : null,
      fast: fast
    };
  }
  function runSlow(c, u, dtp, w) { // advance comp + AC states over samples u; returns final {w1, w2}
    var a1 = c.comp ? Math.exp(-dtp / c.comp.tp) : 0, a2 = c.ac ? Math.exp(-dtp / c.ac.tau) : 0, w1 = w.w1, w2 = w.w2;
    for (var k = 0; k < u.length; k++) {
      var y = c.comp ? c.att * (c.comp.r * u[k] + (1 - c.comp.r) * w1) : c.att * u[k];
      if (c.comp) w1 = a1 * w1 + (1 - a1) * u[k];
      if (c.ac) w2 = a2 * w2 + (1 - a2) * y;
    }
    return { w1: w1, w2: w2 };
  }
  // states of the slow filters (probe compensation, AC coupling) at time tStart
  function slowInit(eng, cs, tStart) {
    var need = cs.some(function (c) { return c.comp || c.ac; }), out = cs.map(function () { return { w1: 0, w2: 0 }; });
    if (!need) return out;
    var T = eng.T;
    if (T) {
      var Np = 4096, dp = T / Np, rec = eng.record(tStart - T + dp / 2, dp, Np);
      cs.forEach(function (c, i) {
        if (!c.comp && !c.ac) return;
        var u = i ? rec.b : rec.a, w = { w1: 0, w2: 0 };
        if (c.comp) { var z = runSlow({ att: c.att, comp: c.comp }, u, dp, w); w.w1 = z.w1 / (1 - Math.exp(-T / c.comp.tp)); }
        if (c.ac) { var z2 = runSlow(c, u, dp, { w1: w.w1, w2: 0 }); w.w2 = z2.w2 / (1 - Math.exp(-T / c.ac.tau)); }
        out[i] = w;
      });
      return out;
    }
    var taus = []; cs.forEach(function (c) { if (c.comp) taus.push(c.comp.tp); if (c.ac) taus.push(c.ac.tau); });
    var pre = 6 * Math.max.apply(null, taus), Np2 = 6000, hp = pre / Np2, r = eng.record(tStart - pre + hp / 8, hp / 4, Np2 * 4);
    cs.forEach(function (c, i) {
      if (!c.comp && !c.ac) return;
      var raw = i ? r.b : r.a, u = new Float64Array(Np2);
      for (var k = 0; k < Np2; k++) u[k] = (raw[4 * k] + raw[4 * k + 1] + raw[4 * k + 2] + raw[4 * k + 3]) / 4;
      out[i] = runSlow(c, u, hp, { w1: 0, w2: 0 });
    });
    return out;
  }
  // displayed volts (before the ADC) for both channels, n samples from t0
  function process(eng, sc, t0, dt, n) {
    var cs = [chainOf(sc, 0), chainOf(sc, 1)], m = 0;
    cs.forEach(function (c) { c.fast.forEach(function (tau) { if (dt < 3 * tau) m = Math.max(m, Math.ceil((8 * tau) / dt)); }); });
    m = Math.min(m, 4000);
    var tS = t0 - m * dt, raw = eng.record(tS, dt, n + m), st = slowInit(eng, cs, tS);
    return cs.map(function (c, i) {
      var u = i ? raw.b : raw.a, y = new Float64Array(n), w1 = st[i].w1, w2 = st[i].w2;
      if (c.gnd) return y;
      var a1 = c.comp ? Math.exp(-dt / c.comp.tp) : 0, a2 = c.ac ? Math.exp(-dt / c.ac.tau) : 0;
      var fa = c.fast.map(function (tau) { return dt < 3 * tau ? 1 - Math.exp(-dt / tau) : 1; }), fw = null;
      for (var k = 0; k < n + m; k++) {
        var v = c.comp ? c.att * (c.comp.r * u[k] + (1 - c.comp.r) * w1) : c.att * u[k];
        if (c.comp) w1 = a1 * w1 + (1 - a1) * u[k];
        if (c.ac) { var o = v - w2; w2 = a2 * w2 + (1 - a2) * v; v = o; }
        if (!fw) fw = fa.map(function () { return v; });
        for (var j = 0; j < fa.length; j++) { fw[j] += fa[j] * (v - fw[j]); v = fw[j]; }
        if (k >= m) y[k - m] = v * c.scale;
      }
      return y;
    });
  }

  // ----------------------------------------------------------------------- trigger
  function findTrigger(eng, sc, fg, tFrom, dtDisp) {
    var tr = sc.trig;
    if (tr.src === 2) return eng.kind === "cal" ? null : FGS.FG.nextSync(fg, tFrom);
    var i = tr.src, ch = sc.ch[i];
    if (!ch.on && !sc.xy) return null;
    var win = sc.tdiv * 10, T = eng.T, span = T ? 2.2 * T : Math.max(2 * win, 1e-7), Ns = 4096;
    var dt = span / Ns, y = process(eng, sc, tFrom, dt, Ns)[i], L = tr.level, hy = 0.2 * ch.vdiv, rise = tr.slope === "rise";
    var armed = false, k = -1;
    for (var j = 0; j < Ns; j++) {
      var v = rise ? y[j] : -y[j], Lv = rise ? L : -L;
      if (v < Lv - hy) armed = true;
      else if (armed && v >= Lv && j > 0) { k = j; break; }
    }
    if (k < 0) return null;
    var a = tFrom + (k - 1) * dt, b = tFrom + k * dt;
    for (var lev = 0; lev < 4 && b - a > dtDisp / 20; lev++) { // refine inside the bracket
      var M = 256, d2 = (b - a) / M, z = process(eng, sc, a, d2, M + 1)[i], found = false;
      for (var q = 1; q <= M; q++) {
        var p0 = rise ? z[q - 1] : -z[q - 1], p1 = rise ? z[q] : -z[q], Lq = rise ? L : -L;
        if (p0 < Lq && p1 >= Lq) { a = a + (q - 1) * d2; b = a + d2; found = true; break; }
      }
      if (!found) break;
    }
    var za = process(eng, sc, a, b - a, 2)[i], f0 = za[0], f1 = za[1];
    var fr = Math.abs(f1 - f0) > 1e-15 ? clamp((L - f0) / (f1 - f0), 0, 1) : 0.5;
    return a + fr * (b - a);
  }

  // ----------------------------------------------------------------------- acquisition
  function Scope(state) { this.s = state; this.avg = null; this.avgKey = ""; this.last = null; this.status = "STOP"; }
  Scope.prototype.timing = function () {
    var win = this.s.tdiv * 10, n = Math.max(2, Math.min(MEM, Math.round(win * FS_MAX)));
    return { win: win, n: n, dt: win / n, fs: n / win };
  };
  Scope.prototype.acquire = function (eng, fg, tNow, key) {
    var sc = this.s, tm = this.timing(), t0, st;
    var tt = findTrigger(eng, sc, fg, tNow, tm.dt);
    if (tt != null) { t0 = tt + sc.hpos - tm.win / 2; st = "T'D"; }
    else if (sc.trig.mode === "auto") { t0 = tNow; st = "AUTO"; }
    else return { status: "WAIT" };
    var ys = process(eng, sc, t0, tm.dt, tm.n), res = { status: st, t0: t0, trigT: tt, dt: tm.dt, n: tm.n, fs: tm.fs, ch: [] };
    var avgOn = sc.acq === "avg" && st === "T'D";
    if (!avgOn || key !== this.avgKey || !this.avg) { this.avg = null; this.avgCount = 0; this.avgKey = key; }
    for (var i = 0; i < 2; i++) {
      var c = sc.ch[i], y = ys[i], q = new Float64Array(tm.n), clip = false, sig = 0.012 * c.vdiv + 50e-6 * c.probe;
      for (var k = 0; k < tm.n; k++) {
        var g = Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(TAU * Math.random());
        var code = Math.round(((y[k] + sig * g) / c.vdiv + c.pos) * CODES);
        if (code > 127) { code = 127; clip = true; } else if (code < -128) { code = -128; clip = true; }
        q[k] = (code / CODES - c.pos) * c.vdiv;
      }
      if (avgOn) {
        if (!this.avg) this.avg = [new Float64Array(tm.n), new Float64Array(tm.n)];
        var A = this.avg[i], w = 1 / Math.min(sc.avgN, this.avgCount + 1);
        for (k = 0; k < tm.n; k++) A[k] += w * (q[k] - A[k]);
        q = Float64Array.from(A);
      }
      res.ch.push({ v: q, clip: clip, ideal: y });
    }
    if (avgOn) this.avgCount++;
    this.last = res;
    return res;
  };

  // ----------------------------------------------------------------------- measurements
  function measure(v, dt) {
    var n = v.length, r = {};
    if (n < 4) return r;
    var mx = -1e99, mn = 1e99, i;
    for (i = 0; i < n; i++) { if (v[i] > mx) mx = v[i]; if (v[i] < mn) mn = v[i]; }
    r.vmax = mx; r.vmin = mn; r.vpp = mx - mn;
    var amp = mx - mn, top = mx, base = mn;
    if (amp > 1e-12) {
      var B = 100, hist = new Array(B).fill(0);
      for (i = 0; i < n; i++) hist[Math.min(B - 1, Math.floor(((v[i] - mn) / amp) * B))]++;
      var hi = 60, lo = 0;
      for (i = 60; i < B; i++) if (hist[i] > hist[hi]) hi = i;
      for (i = 0; i < 40; i++) if (hist[i] > hist[lo]) lo = i;
      if (hist[hi] > 0.08 * n) top = mn + ((hi + 0.5) / B) * amp;
      if (hist[lo] > 0.08 * n) base = mn + ((lo + 0.5) / B) * amp;
    }
    r.top = top; r.base = base; r.vamp = top - base;
    var mid = (top + base) / 2, hy = 0.1 * (top - base), rises = [], falls = [], st = 0, tUp = null, tDn = null;
    if (top - base > 1e-12) {
      st = v[0] > mid + hy ? 1 : v[0] < mid - hy ? -1 : 0;
      for (i = 1; i < n; i++) {
        if (v[i - 1] < mid && v[i] >= mid) tUp = (i - 1 + (mid - v[i - 1]) / (v[i] - v[i - 1])) * dt;
        if (v[i - 1] > mid && v[i] <= mid) tDn = (i - 1 + (v[i - 1] - mid) / (v[i - 1] - v[i])) * dt;
        if (v[i] > mid + hy && st !== 1) { if (st === -1 && tUp != null) rises.push(tUp); st = 1; }
        else if (v[i] < mid - hy && st !== -1) { if (st === 1 && tDn != null) falls.push(tDn); st = -1; }
      }
    }
    rises = dedupe(rises, dt * 3); falls = dedupe(falls, dt * 3);
    r.rises = rises; r.falls = falls;
    var per = null;
    if (rises.length >= 2) per = (rises[rises.length - 1] - rises[0]) / (rises.length - 1);
    if (falls.length >= 2) { var pf = (falls[falls.length - 1] - falls[0]) / (falls.length - 1); per = per ? (per * (rises.length - 1) + pf * (falls.length - 1)) / (rises.length + falls.length - 2) : pf; }
    if (per) { r.period = per; r.freq = 1 / per; }
    if (per && rises.length && falls.length) {
      var ws = [];
      rises.forEach(function (t) { for (var j = 0; j < falls.length; j++) if (falls[j] > t) { if (falls[j] - t < per) ws.push(falls[j] - t); break; } });
      if (ws.length) { r.pwidth = ws.reduce(function (a, b) { return a + b; }, 0) / ws.length; r.duty = (100 * r.pwidth) / per; r.nwidth = per - r.pwidth; }
    }
    // 10–90 % rise / fall time on the first complete edge
    var l10 = base + 0.1 * (top - base), l90 = base + 0.9 * (top - base);
    r.rise = edgeTime(v, dt, l10, l90, true); r.fall = edgeTime(v, dt, l10, l90, false);
    // mean and RMS over whole cycles when possible
    var a0 = 0, a1 = n;
    if (rises.length >= 2) { a0 = Math.round(rises[0] / dt); a1 = Math.round(rises[rises.length - 1] / dt); }
    var s = 0, s2 = 0;
    for (i = a0; i < a1; i++) { s += v[i]; s2 += v[i] * v[i]; }
    var cnt = Math.max(1, a1 - a0);
    r.avg = s / cnt; r.rms = Math.sqrt(s2 / cnt); r.acrms = Math.sqrt(Math.max(0, r.rms * r.rms - r.avg * r.avg));
    r.cycles = rises.length >= 2;
    return r;
  }
  function dedupe(a, gap) { var o = []; a.forEach(function (t) { if (!o.length || t - o[o.length - 1] > gap) o.push(t); }); return o; }
  function edgeTime(v, dt, l10, l90, rising) {
    var n = v.length, i, lo = rising ? l10 : l90, hi = rising ? l90 : l10;
    for (i = 1; i < n; i++) {
      var p = rising ? v[i - 1] <= lo && v[i] > lo : v[i - 1] >= lo && v[i] < lo;
      if (!p) continue;
      var ta = (i - 1 + (lo - v[i - 1]) / (v[i] - v[i - 1])) * dt;
      for (var j = i; j < n; j++) {
        var back = rising ? v[j] < l10 - 1e-12 && j > i + 1 : v[j] > l90 + 1e-12 && j > i + 1;
        if (back) break;
        var q = rising ? v[j - 1] < hi && v[j] >= hi : v[j - 1] > hi && v[j] <= hi;
        if (q) { var tb = (j - 1 + (hi - v[j - 1]) / (v[j] - v[j - 1])) * dt; return tb - ta; }
      }
    }
    return null;
  }
  // phase of CH2 relative to CH1 (EE convention: CH2 lagging → negative degrees) and the time delay
  function phase(m1, m2) {
    if (!m1.period || !m1.rises || !m2.rises || !m1.rises.length || !m2.rises.length) return null;
    var T = m1.period, ds = [];
    m1.rises.forEach(function (t) {
      var best = null;
      m2.rises.forEach(function (u) { var d = u - t; d = d - Math.round(d / T) * T; if (best === null || Math.abs(u - t) < Math.abs(best.raw)) best = { d: d, raw: u - t }; });
      if (best) ds.push(best.d);
    });
    if (!ds.length) return null;
    var ref = ds[0], s = 0;
    ds.forEach(function (d) { s += d - Math.round((d - ref) / T) * T; });
    var dl = s / ds.length, deg = (-360 * dl) / T;
    deg = deg - 360 * Math.round(deg / 360);
    if (deg <= -180) deg += 360;
    return { delay: dl, deg: deg };
  }

  // ----------------------------------------------------------------------- FFT (Hann window, dBV RMS)
  function fft(v, dt) {
    var N = 1; while (N * 2 <= v.length && N < 8192) N *= 2;
    if (N < 64) return null;
    var re = new Float64Array(N), im = new Float64Array(N), i, j, k;
    for (i = 0; i < N; i++) re[i] = v[i] * (0.5 - 0.5 * Math.cos((TAU * i) / (N - 1)));
    for (i = 1, j = 0; i < N; i++) { var bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; } }
    for (var len = 2; len <= N; len <<= 1) {
      var ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < N; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    var M = N / 2, db = new Float64Array(M), df = 1 / (N * dt);
    for (k = 0; k < M; k++) {
      var amp = (Math.hypot(re[k], im[k]) / N) * (k === 0 ? 1 : 2) / 0.5; // peak amplitude (Hann coherent gain 0.5)
      var vr = k === 0 ? amp : amp / Math.SQRT2;
      db[k] = 20 * Math.log10(Math.max(vr, 1e-9));
    }
    var peaks = [];
    for (k = 2; k < M - 1; k++) if (db[k] > db[k - 1] && db[k] >= db[k + 1] && db[k] > -70) {
      var p = 0.5 * (db[k - 1] - db[k + 1]) / (db[k - 1] - 2 * db[k] + db[k + 1] || 1e-12);
      peaks.push({ f: (k + clamp(p, -0.5, 0.5)) * df, db: db[k] - 0.25 * (db[k - 1] - db[k + 1]) * p });
    }
    peaks.sort(function (a, b) { return b.db - a.db; });
    peaks = peaks.filter(function (pk, idx) { return idx < 1 || pk.db > peaks[0].db - 60; }).slice(0, 6);
    peaks.sort(function (a, b) { return a.f - b.f; });
    return { db: db, df: df, N: N, peaks: peaks };
  }

  // ----------------------------------------------------------------------- autoset
  function autoset(eng, sc, fg) {
    var T = eng.T;
    if (!T) {
      if (fg.mod === "am") T = 1 / fg.amF; else if (fg.mod === "fm") T = 1 / fg.fmF; else if (fg.mod === "pwm") T = 1 / fg.pwmF;
      else if (fg.mod === "sweep") T = fg.swTime; else if (fg.mod === "burst") T = fg.bPer; else T = fg.wave === "noise" ? 4e-6 : 1 / fg.freq;
    }
    var span = Math.max(2 * T, 1e-6), Ns = 8192, keep = { coup: sc.ch.map(function (c) { return c.coup; }) };
    sc.ch.forEach(function (c) { if (c.coup === "GND") c.coup = "DC"; });
    var ys = process(eng, sc, 1.000123, span / Ns, Ns);
    ys.forEach(function (y, i) {
      var c = sc.ch[i], mx = -1e99, mn = 1e99, s = 0;
      for (var k = 0; k < Ns; k++) { mx = Math.max(mx, y[k]); mn = Math.min(mn, y[k]); s += y[k]; }
      var pp = mx - mn, mean = s / Ns, need = Math.max(pp / 6, Math.abs(mean) / 3.5, 1e-3 * c.probe);
      var j = U.idx125(need); if (U.seq125(j) < need * 0.999) j++;
      c.vdiv = U.seq125(j);
      c.pos = pp < 1e-9 && Math.abs(mean) < 1e-9 ? 0 : clamp(-mean / c.vdiv, -3, 3);
      if (pp < 0.2 * Math.abs(mean)) c.pos = clamp(-mean / c.vdiv, -3, 3);
      if (i === 0) sc.trig.level = mean;
    });
    void keep;
    var want = T * 0.16, ti = U.idx125(want); if (U.seq125(ti) < want * 0.999) ti++;
    sc.tdiv = clamp(U.seq125(ti), 5e-9, 50);
    sc.hpos = 0; sc.trig.mode = "auto"; sc.trig.slope = "rise";
    if (sc.trig.src === 1 && !sc.ch[1].on) sc.trig.src = 0;
    if (sc.trig.src !== 2) {
      var yt = process(eng, sc, 2.000321, span / Ns, Ns)[sc.trig.src], a = -1e99, b = 1e99;
      for (var k2 = 0; k2 < Ns; k2++) { a = Math.max(a, yt[k2]); b = Math.min(b, yt[k2]); }
      sc.trig.level = (a + b) / 2;
    }
    // snap the level to the knob grid (1/25 div) so tiny rounding residues never show as e.g. 0.001 pV
    var tc = sc.ch[Math.min(sc.trig.src, 1)], g = tc.vdiv * 0.04;
    sc.trig.level = Math.round(sc.trig.level / g) * g;
    if (Math.abs(sc.trig.level) < g / 2) sc.trig.level = 0;
    sc.run = true; sc.single = false;
  }

  // ----------------------------------------------------------------------- renderer
  function Screen(canvas) {
    this.c = canvas; this.ctx = canvas.getContext("2d");
    this.layer = document.createElement("canvas"); this.lctx = this.layer.getContext("2d");
    this.w = 0; this.h = 0;
  }
  Screen.prototype.size = function () {
    var cssW = this.c.clientWidth || 600, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var fs = clamp(cssW / 52, 9, 13), top = Math.round(fs * 1.9), bot = Math.round(fs * 2.1), pad = Math.round(fs * 0.6);
    var gw = cssW - 2 * pad, gh = gw * 0.8, cssH = Math.round(gh + top + bot);
    if (this.w !== cssW || this.h !== cssH) {
      this.w = cssW; this.h = cssH;
      this.c.width = Math.round(cssW * dpr); this.c.height = Math.round(cssH * dpr); this.c.style.height = cssH + "px";
      this.layer.width = this.c.width; this.layer.height = this.c.height;
      this.lctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.lctx.clearRect(0, 0, cssW, cssH);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.g = { x: pad, y: top, w: gw, h: gh, fs: fs, dpr: dpr };
    return this.g;
  };
  Screen.prototype.draw = function (sc, res, info) {
    var g = this.size(), ctx = this.ctx, W = this.w, H = this.h, L = this.lctx, fft = sc.math === "fft" && !sc.xy;
    var gt = { x: g.x, y: g.y, w: g.w, h: fft ? g.h * 0.55 : g.h, div: 8 };
    ctx.fillStyle = "#0b1014"; ctx.fillRect(0, 0, W, H);
    grid(ctx, gt, 10, 8);
    // traces go on a separate layer so persistence can fade them
    if (res && res.ch) {
      if (sc.persist) { L.globalCompositeOperation = "destination-out"; L.fillStyle = "rgba(0,0,0,0.22)"; L.fillRect(0, 0, W, H); L.globalCompositeOperation = "source-over"; }
      else L.clearRect(0, 0, W, H);
      L.save(); L.beginPath(); L.rect(gt.x, gt.y, gt.w, gt.h); L.clip();
      if (sc.xy) drawXY(L, gt, sc, res);
      else {
        for (var i = 0; i < 2; i++) if (sc.ch[i].on) trace(L, gt, res.ch[i].v, res.dt, sc.tdiv, sc.ch[i].vdiv, sc.ch[i].pos, COLORS[i]);
        if (sc.math === "add" || sc.math === "sub" || sc.math === "mul") {
          var a = res.ch[0].v, b = res.ch[1].v, m = new Float64Array(a.length);
          for (var k = 0; k < a.length; k++) m[k] = sc.math === "add" ? a[k] + b[k] : sc.math === "sub" ? a[k] - b[k] : a[k] * b[k];
          var md = sc.math === "mul" ? sc.ch[0].vdiv * sc.ch[1].vdiv : sc.ch[0].vdiv;
          trace(L, gt, m, res.dt, sc.tdiv, md, 0, COLORS[2]);
        }
      }
      L.restore();
    }
    ctx.drawImage(this.layer, 0, 0, W, H);
    markers(ctx, gt, sc, res, g.fs);
    if (sc.cursor.mode !== "off" && !sc.xy) cursors(ctx, gt, sc, g.fs);
    if (fft) {
      var gf = { x: g.x, y: g.y + gt.h + g.fs * 0.4, w: g.w, h: g.h - gt.h - g.fs * 0.4 };
      drawFFT(ctx, gf, sc, res, g.fs, info);
    }
    bars(ctx, g, W, H, sc, res, info);
  };
  function grid(ctx, gr, nx, ny) {
    ctx.save();
    ctx.strokeStyle = "rgba(200,210,220,0.16)"; ctx.lineWidth = 1; ctx.setLineDash([1, 3]);
    for (var i = 1; i < nx; i++) { var x = Math.round(gr.x + (gr.w * i) / nx) + 0.5; ctx.beginPath(); ctx.moveTo(x, gr.y); ctx.lineTo(x, gr.y + gr.h); ctx.stroke(); }
    for (i = 1; i < ny; i++) { var y = Math.round(gr.y + (gr.h * i) / ny) + 0.5; ctx.beginPath(); ctx.moveTo(gr.x, y); ctx.lineTo(gr.x + gr.w, y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(200,210,220,0.32)";
    ctx.strokeRect(gr.x + 0.5, gr.y + 0.5, gr.w - 1, gr.h - 1);
    var cx = gr.x + gr.w / 2, cy = gr.y + gr.h / 2;
    ctx.beginPath();
    for (i = 0; i <= nx * 5; i++) { var tx = gr.x + (gr.w * i) / (nx * 5); ctx.moveTo(tx, cy - 3); ctx.lineTo(tx, cy + 3); }
    for (i = 0; i <= ny * 5; i++) { var ty = gr.y + (gr.h * i) / (ny * 5); ctx.moveTo(cx - 3, ty); ctx.lineTo(cx + 3, ty); }
    ctx.stroke();
    ctx.restore();
  }
  function trace(ctx, gr, v, dt, tdiv, vdiv, pos, color) {
    var n = v.length, win = tdiv * 10, px = gr.w / win, dy = gr.h / 8, cy = gr.y + gr.h / 2;
    var Y = function (x) { return cy - (x / vdiv + pos) * dy; };
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    ctx.beginPath();
    if (n > gr.w * 1.5) {
      var cols = Math.floor(gr.w), per = n / cols;
      for (var c = 0; c < cols; c++) {
        var a = Math.floor(c * per), b = Math.min(n, Math.floor((c + 1) * per) + 1), lo = 1e99, hi = -1e99;
        for (var k = a; k < b; k++) { if (v[k] < lo) lo = v[k]; if (v[k] > hi) hi = v[k]; }
        var x = gr.x + c + 0.5;
        if (c === 0) ctx.moveTo(x, Y(v[a])); else ctx.lineTo(x, Y(v[a]));
        ctx.lineTo(x, Y(hi)); ctx.lineTo(x, Y(lo)); ctx.lineTo(x, Y(v[b - 1]));
      }
      ctx.lineWidth = 1.2;
    } else {
      for (var i = 0; i < n; i++) { var xx = gr.x + i * dt * px; if (i) ctx.lineTo(xx, Y(v[i])); else ctx.moveTo(xx, Y(v[i])); }
    }
    ctx.stroke();
    if (n < gr.w / 6) for (i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(gr.x + i * dt * px, Y(v[i]), 2.2, 0, TAU); ctx.fill(); }
  }
  function drawXY(ctx, gr, sc, res) {
    var a = res.ch[0].v, b = res.ch[1].v, dx = gr.w / 10, dy = gr.h / 8, cx = gr.x + gr.w / 2, cy = gr.y + gr.h / 2;
    ctx.strokeStyle = COLORS[3]; ctx.lineWidth = 1.5; ctx.beginPath();
    for (var k = 0; k < a.length; k++) {
      var x = cx + (a[k] / sc.ch[0].vdiv + sc.ch[0].pos) * dx, y = cy - (b[k] / sc.ch[1].vdiv + sc.ch[1].pos) * dy;
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  function markers(ctx, gr, sc, res, fs) {
    var dy = gr.h / 8, cy = gr.y + gr.h / 2;
    ctx.font = "600 " + Math.round(fs * 0.85) + "px 'IBM Plex Mono',monospace"; ctx.textBaseline = "middle";
    if (!sc.xy) for (var i = 1; i >= 0; i--) {
      if (!sc.ch[i].on) continue;
      var y = clamp(cy - sc.ch[i].pos * dy, gr.y + 6, gr.y + gr.h - 6);
      ctx.fillStyle = COLORS[i]; ctx.beginPath(); ctx.moveTo(gr.x, y - 6); ctx.lineTo(gr.x + 12, y); ctx.lineTo(gr.x, y + 6); ctx.fill();
      ctx.fillStyle = "#0b1014"; ctx.fillText(String(i + 1), gr.x + 1, y);
    }
    if (!sc.xy && sc.trig.src < 2) {
      var c = sc.ch[sc.trig.src], ty = cy - (sc.trig.level / c.vdiv + c.pos) * dy, off = ty < gr.y || ty > gr.y + gr.h;
      ty = clamp(ty, gr.y + 6, gr.y + gr.h - 6);
      ctx.fillStyle = off ? "#ff8a3d" : COLORS[sc.trig.src];
      ctx.beginPath(); ctx.moveTo(gr.x + gr.w, ty - 6); ctx.lineTo(gr.x + gr.w - 12, ty); ctx.lineTo(gr.x + gr.w, ty + 6); ctx.fill();
      if (sc._showLevel) { ctx.strokeStyle = "rgba(255,138,61,.8)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(gr.x, ty); ctx.lineTo(gr.x + gr.w, ty); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (!sc.xy) { // trigger position marker
      var tx = gr.x + gr.w / 2 - (sc.hpos / (sc.tdiv * 10)) * gr.w, txc = clamp(tx, gr.x + 6, gr.x + gr.w - 6);
      ctx.fillStyle = "#ff8a3d"; ctx.beginPath(); ctx.moveTo(txc - 6, gr.y); ctx.lineTo(txc + 6, gr.y); ctx.lineTo(txc, gr.y + 9); ctx.fill();
    }
  }
  function cursors(ctx, gr, sc, fs) {
    var cu = sc.cursor; ctx.save(); ctx.strokeStyle = "#ff8a3d"; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2;
    ctx.font = "600 " + Math.round(fs * 0.8) + "px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#ff8a3d";
    if (cu.mode === "time") [cu.x1, cu.x2].forEach(function (d, k) { var x = gr.x + (d / 10) * gr.w; ctx.beginPath(); ctx.moveTo(x, gr.y); ctx.lineTo(x, gr.y + gr.h); ctx.stroke(); ctx.fillText(k ? "X2" : "X1", x + 3, gr.y + gr.h - 8); });
    if (cu.mode === "volt") [cu.y1, cu.y2].forEach(function (d, k) { var y = gr.y + gr.h / 2 - (d / 8) * gr.h * 1; ctx.beginPath(); ctx.moveTo(gr.x, y); ctx.lineTo(gr.x + gr.w, y); ctx.stroke(); ctx.fillText(k ? "Y2" : "Y1", gr.x + gr.w - 26, y - 8); });
    ctx.restore();
  }
  function drawFFT(ctx, gf, sc, res, fs, info) {
    grid(ctx, gf, 10, 4);
    ctx.save();
    ctx.font = Math.round(fs * 0.8) + "px 'IBM Plex Mono',monospace"; ctx.fillStyle = "rgba(232,121,249,.95)"; ctx.textBaseline = "top";
    if (!res || !res.ch) { ctx.restore(); return; }
    var F = fft(res.ch[sc.fftSrc].v, res.dt);
    if (info) info.fft = F;
    if (!F) { ctx.fillText("FFT: ต้องการข้อมูลอย่างน้อย 64 จุด", gf.x + 6, gf.y + 6); ctx.restore(); return; }
    var span = F.df * F.db.length, top = 20, per = sc.fftDb, dyb = gf.h / 4;
    ctx.save(); ctx.beginPath(); ctx.rect(gf.x, gf.y, gf.w, gf.h); ctx.clip();
    ctx.strokeStyle = COLORS[2]; ctx.lineWidth = 1.2; ctx.beginPath();
    var cols = Math.floor(gf.w), M = F.db.length;
    for (var c = 0; c < cols; c++) {
      var a = Math.floor((c / cols) * M), b = Math.max(a + 1, Math.floor(((c + 1) / cols) * M)), hi = -1e9;
      for (var k = a; k < b && k < M; k++) hi = Math.max(hi, F.db[k]);
      var y = gf.y + ((top - hi) / per) * dyb;
      if (c) ctx.lineTo(gf.x + c, y); else ctx.moveTo(gf.x + c, y);
    }
    ctx.stroke(); ctx.restore();
    ctx.fillText("FFT CH" + (sc.fftSrc + 1) + " · Hann · " + per + " dB/div · บนสุด +20 dBV · 0 – " + U.fmtSI(span, "Hz", 3) + " (" + U.fmtSI(span / 10, "Hz", 3) + "/div)", gf.x + 6, gf.y + 4);
    ctx.restore();
  }
  function bars(ctx, g, W, H, sc, res, info) {
    var fs = g.fs, st = !sc.run ? "STOP" : res ? res.status : "WAIT";
    ctx.font = "600 " + Math.round(fs) + "px 'IBM Plex Mono',monospace"; ctx.textBaseline = "middle";
    var y = g.y / 2, x = g.x;
    var col = st === "T'D" ? "#3fb950" : st === "AUTO" ? "#d29922" : st === "STOP" ? "#f85149" : "#d29922";
    ctx.fillStyle = col; var lab = st === "STOP" ? "STOP" : st === "WAIT" ? "WAIT" : st === "AUTO" ? "AUTO" : "T'D";
    var lw = ctx.measureText(lab).width + 10; ctx.fillRect(x, y - fs * 0.7, lw, fs * 1.4); ctx.fillStyle = "#0b1014"; ctx.fillText(lab, x + 5, y);
    x += lw + 8; ctx.fillStyle = "#e6edf3";
    var tl = "H " + U.fmtSI(sc.tdiv, "s", 3) + "/div";
    ctx.fillText(tl, x, y); x += ctx.measureText(tl).width + 12;
    if (res && res.fs && W > 420) { ctx.fillStyle = "#8b949e"; var fl = U.fmtSI(res.fs, "Sa/s", 3); ctx.fillText(fl, x, y); x += ctx.measureText(fl).width + 12; }
    if (sc.hpos && W > 520) { ctx.fillStyle = "#ff8a3d"; var dl = "D " + U.fmtSI(sc.hpos, "s", 3); ctx.fillText(dl, x, y); }
    ctx.textAlign = "right";
    var tsrc = ["CH1", "CH2", "EXT"][sc.trig.src];
    ctx.fillStyle = sc.trig.src < 2 ? COLORS[sc.trig.src] : "#e6edf3";
    ctx.fillText(tsrc + " " + (sc.trig.slope === "rise" ? "↑" : "↓") + (sc.trig.src < 2 ? " " + U.fmtSI(sc.trig.level, "V", 3) : "") + " " + sc.trig.mode.toUpperCase(), W - g.x, y);
    ctx.textAlign = "left";
    var yb = g.y + g.h + (H - g.y - g.h) / 2, xb = g.x;
    for (var i = 0; i < 2; i++) {
      var c = sc.ch[i];
      if (!c.on && !sc.xy) continue;
      var t = (i + 1) + " " + U.fmtSI(c.vdiv, "V", 3) + (c.coup === "DC" ? " ⎓" : c.coup === "AC" ? " ∿" : " ⏚") + (c.probe === 10 ? " 10×" : " 1×") + (c.bwl ? " BW" : "") + (c.inv ? " INV" : "");
      ctx.font = "600 " + Math.round(fs * 0.92) + "px 'IBM Plex Mono',monospace";
      var tw = ctx.measureText(t).width + 12;
      ctx.fillStyle = COLORS[i]; ctx.fillRect(xb, yb - fs * 0.75, tw, fs * 1.5);
      ctx.fillStyle = "#0b1014"; ctx.fillText(t, xb + 6, yb);
      if (res && res.ch && res.ch[i].clip) { ctx.fillStyle = "#f85149"; ctx.fillText("!", xb + tw + 2, yb); xb += 10; }
      xb += tw + 8;
    }
    if (sc.xy) { ctx.fillStyle = COLORS[3]; ctx.fillText("XY", xb, yb); xb += 30; }
    else if (sc.math !== "off" && sc.math !== "fft") { ctx.fillStyle = COLORS[2]; ctx.fillText("M " + { add: "1+2", sub: "1−2", mul: "1×2" }[sc.math], xb, yb); }
    if (sc.acq === "avg") { ctx.fillStyle = "#8b949e"; ctx.textAlign = "right"; ctx.fillText("AVG " + sc.avgN, W - g.x, yb); ctx.textAlign = "left"; }
    void info;
  }

  FGS.Scope = Scope;
  FGS.scope = { defaults: defaults, process: process, measure: measure, phase: phase, fft: fft, autoset: autoset, Screen: Screen, COLORS: COLORS, chainOf: chainOf };
})();
