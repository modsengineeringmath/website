/* FSCore — Fourier-series and harmonic engine for /learn/fourier-series/ (no DOM, no dependencies).
   Works in the browser (window.FSCore) and in Node (globalThis.FSCore) so every number can be tested.

   Convention used everywhere on the site:
     x(θ) = a0 + Σ_{n≥1} [ a_n cos nθ + b_n sin nθ ],   θ = ω0·t,   a0 = average (DC) value.
   Phasor of harmonic n (peak):  X_n = a_n − j·b_n   so   x_n(θ) = Re{ X_n e^{jnθ} },  RMS = |X_n|/√2.

   Waveforms are lists of exact segments over one period θ ∈ [0, 2π):
     {k:"l", a, b, p, q}          x = p + q·θ                 (a constant when q = 0)
     {k:"s", a, b, c, A, m, f}    x = c + A·sin(m·θ + f)        (m an integer ≥ 1)
   Coefficients are integrated in closed form, so zeros are exact zeros and nothing depends on sampling.
   Loads whose current must be simulated (capacitor-input rectifiers) are sampled and transformed
   with an exact DFT of 4096 points per cycle. */
(function (root) {
  "use strict";
  var PI = Math.PI, TAU = 2 * PI, D2R = PI / 180, SQ2 = Math.SQRT2, SQ3 = Math.sqrt(3);
  var H_DEF = 200;

  // ======================================================================= complex helpers
  function C(re, im) { return { re: re, im: im || 0 }; }
  function cadd(a, b) { return C(a.re + b.re, a.im + b.im); }
  function csub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function cmul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cdiv(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function carg(a) { return Math.atan2(a.im, a.re); }
  function cscale(a, k) { return C(a.re * k, a.im * k); }
  function cconj(a) { return C(a.re, -a.im); }
  function cpol(r, ph) { return C(r * Math.cos(ph), r * Math.sin(ph)); }

  // ======================================================================= exact integration
  function Isin(m, f, a, b) { return m === 0 ? (b - a) * Math.sin(f) : (Math.cos(m * a + f) - Math.cos(m * b + f)) / m; }
  function Icos(m, f, a, b) { return m === 0 ? (b - a) * Math.cos(f) : (Math.sin(m * b + f) - Math.sin(m * a + f)) / m; }

  /* a[0..H], b[0..H] of a segment list (period 2π) */
  function coefSegs(segs, H) {
    H = H || H_DEF;
    var a = new Float64Array(H + 1), b = new Float64Array(H + 1);
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i], x1 = s.a, x2 = s.b, n;
      if (!(x2 > x1)) continue;
      if (s.k === "l") {
        var p = s.p, q = s.q || 0;
        a[0] += (p * (x2 - x1) + q * (x2 * x2 - x1 * x1) / 2) / TAU;
        var y1 = p + q * x1, y2 = p + q * x2;
        for (n = 1; n <= H; n++) {
          var s1 = Math.sin(n * x1), s2 = Math.sin(n * x2), c1 = Math.cos(n * x1), c2 = Math.cos(n * x2), n2 = n * n;
          a[n] += ((y2 * s2 - y1 * s1) / n + q * (c2 - c1) / n2) / PI;
          b[n] += ((-y2 * c2 + y1 * c1) / n + q * (s2 - s1) / n2) / PI;
        }
      } else {
        var c = s.c || 0, A = s.A, m = s.m || 1, f = s.f || 0;
        a[0] += (c * (x2 - x1) + A * Isin(m, f, x1, x2)) / TAU;
        for (n = 1; n <= H; n++) {
          a[n] += (c * Icos(n, 0, x1, x2) + A / 2 * (Isin(m + n, f, x1, x2) + Isin(m - n, f, x1, x2))) / PI;
          b[n] += (c * Isin(n, 0, x1, x2) + A / 2 * (Icos(m - n, f, x1, x2) - Icos(m + n, f, x1, x2))) / PI;
        }
      }
    }
    return { a: a, b: b, H: H };
  }

  /* exact mean square (1/2π)∫x² over the period */
  function meanSquare(segs) {
    var t = 0;
    segs.forEach(function (s) {
      var x1 = s.a, x2 = s.b;
      if (!(x2 > x1)) return;
      if (s.k === "l") {
        var p = s.p, q = s.q || 0;
        if (q === 0) t += p * p * (x2 - x1);
        else t += (Math.pow(p + q * x2, 3) - Math.pow(p + q * x1, 3)) / (3 * q);
      } else {
        var c = s.c || 0, A = s.A, m = s.m || 1, f = s.f || 0;
        t += c * c * (x2 - x1) + 2 * c * A * Isin(m, f, x1, x2) + A * A / 2 * ((x2 - x1) - Icos(2 * m, 2 * f, x1, x2));
      }
    });
    return t / TAU;
  }

  function evalSegs(segs, th) {
    th = ((th % TAU) + TAU) % TAU;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (th >= s.a && th < s.b) return s.k === "l" ? s.p + (s.q || 0) * th : (s.c || 0) + s.A * Math.sin((s.m || 1) * th + (s.f || 0));
    }
    var l = segs[segs.length - 1];
    return l.k === "l" ? l.p + (l.q || 0) * l.b : (l.c || 0) + l.A * Math.sin((l.m || 1) * l.b + (l.f || 0));
  }

  /* exact DFT of N uniform samples x[j] at θ_j = 2πj/N → a, b (exact for trig polynomials below N/2) */
  function coefSamples(x, H) {
    H = H || H_DEF;
    var N = x.length, a = new Float64Array(H + 1), b = new Float64Array(H + 1), ct = new Float64Array(N), st = new Float64Array(N), j, n;
    for (j = 0; j < N; j++) { ct[j] = Math.cos(TAU * j / N); st[j] = Math.sin(TAU * j / N); }
    var s0 = 0;
    for (j = 0; j < N; j++) s0 += x[j];
    a[0] = s0 / N;
    for (n = 1; n <= H; n++) {
      var sa = 0, sb = 0, k = 0;
      for (j = 0; j < N; j++) { sa += x[j] * ct[k]; sb += x[j] * st[k]; k += n; if (k >= N) k -= N; }
      a[n] = 2 * sa / N; b[n] = 2 * sb / N;
    }
    return { a: a, b: b, H: H };
  }

  /* shift: y(θ) = x(θ − s) */
  function shiftCoef(cf, s) {
    var a = new Float64Array(cf.a.length), b = new Float64Array(cf.b.length);
    a[0] = cf.a[0];
    for (var n = 1; n < a.length; n++) {
      var c = Math.cos(n * s), si = Math.sin(n * s);
      a[n] = cf.a[n] * c - cf.b[n] * si;
      b[n] = cf.a[n] * si + cf.b[n] * c;
    }
    return { a: a, b: b, H: cf.H };
  }

  /* partial sum to order N; sigma = Lanczos smoothing (removes the Gibbs ears, for display only) */
  function partial(cf, N, th, sigma) {
    var v = cf.a[0];
    N = Math.min(N, cf.H);
    for (var n = 1; n <= N; n++) {
      var w = 1;
      if (sigma) { var z = PI * n / (N + 1); w = Math.sin(z) / z; }
      v += w * (cf.a[n] * Math.cos(n * th) + cf.b[n] * Math.sin(n * th));
    }
    return v;
  }

  // ======================================================================= waveform library (period 2π, amplitude A)
  function L(a, b, p, q) { return { k: "l", a: a, b: b, p: p, q: q || 0 }; }
  function S(a, b, A, f, c, m) { return { k: "s", a: a, b: b, A: A, f: f || 0, c: c || 0, m: m || 1 }; }
  function clampSegs(segs) { return segs.filter(function (s) { return s.b - s.a > 1e-12; }); }

  /* SPWM edges: reference m·sin θ vs a triangle carrier of mf cycles per period (carrier = −1 at θ = 0) */
  function carrier(th, mf) { var u = (mf * th / TAU) % 1; if (u < 0) u += 1; return 1 - 4 * Math.abs(u - 0.5); }
  function spwmSegs(Vdc, m, mf, uni) {
    function leg(sgn) {
      var g = function (t) { return sgn * m * Math.sin(t) - carrier(t, mf); };
      var M = 96 * mf, edges = [], prev = g(0);
      for (var i = 1; i <= M; i++) {
        var t1 = TAU * (i - 1) / M, t2 = TAU * i / M, v = g(t2);
        if ((prev > 0) !== (v > 0)) {
          var lo = t1, hi = t2, glo = prev;
          for (var k = 0; k < 50; k++) { var mid = (lo + hi) / 2, gm = g(mid); if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else hi = mid; }
          edges.push((lo + hi) / 2);
        }
        prev = v;
      }
      return { start: g(1e-9) > 0 ? 1 : -1, edges: edges };
    }
    function levels(lg) {
      var pts = [0].concat(lg.edges, [TAU]), out = [], s = lg.start;
      for (var i = 0; i < pts.length - 1; i++) { out.push([pts[i], pts[i + 1], s]); s = -s; }
      return out;
    }
    var A = levels(leg(1));
    if (!uni) return A.map(function (r) { return L(r[0], r[1], r[2] * Vdc / 2); });
    var B = levels(leg(-1)), cut = {};
    A.concat(B).forEach(function (r) { cut[r[0]] = 1; cut[r[1]] = 1; });
    var ts = Object.keys(cut).map(Number).sort(function (x, y) { return x - y; }), segs = [];
    var at = function (lv, t) { for (var i = 0; i < lv.length; i++) if (t >= lv[i][0] && t < lv[i][1]) return lv[i][2]; return lv[lv.length - 1][2]; };
    for (var i = 0; i < ts.length - 1; i++) {
      var mid = (ts[i] + ts[i + 1]) / 2;
      segs.push(L(ts[i], ts[i + 1], (at(A, mid) - at(B, mid)) * Vdc / 2));
    }
    return segs;
  }

  var WAVES = {
    square: {
      th: "คลื่นสี่เหลี่ยม ±A", en: "Square wave", sym: "odd half", params: { A: 1 },
      segs: function (p) { return [L(0, PI, p.A), L(PI, TAU, -p.A)]; },
      rule: "a₀ = 0, aₙ = 0, bₙ = 4A/(nπ) เมื่อ n คี่ (n คู่ = 0)", id: "W1"
    },
    pulse: {
      th: "พัลส์ 0 ถึง A ดิวตี้ D", en: "Pulse train (duty D)", sym: "", params: { A: 1, D: 0.25 },
      segs: function (p) { var d = Math.min(Math.max(p.D, 0.001), 0.999); return [L(0, TAU * d, p.A), L(TAU * d, TAU, 0)]; },
      rule: "a₀ = AD, aₙ = (A/nπ) sin(2πnD), bₙ = (A/nπ)(1 − cos 2πnD), |cₙ| = AD·|sinc(nD)|", id: "W3"
    },
    triangle: {
      th: "คลื่นสามเหลี่ยม ±A", en: "Triangle wave", sym: "odd half", params: { A: 1 },
      segs: function (p) { var A = p.A, k = 2 * A / PI; return [L(0, PI / 2, 0, k), L(PI / 2, 1.5 * PI, 2 * A, -k), L(1.5 * PI, TAU, -4 * A, k)]; },
      rule: "bₙ = 8A/(n²π²)·sin(nπ/2) เมื่อ n คี่ ลดลงตาม 1/n²", id: "W5"
    },
    sawtooth: {
      th: "ฟันเลื่อย ±A", en: "Sawtooth wave", sym: "odd", params: { A: 1 },
      segs: function (p) { var A = p.A; return [L(0, PI, 0, A / PI), L(PI, TAU, -2 * A, A / PI)]; },
      rule: "bₙ = (2A/nπ)(−1)ⁿ⁺¹ มีทุกฮาร์มอนิก ทั้งคู่และคี่", id: "W6"
    },
    halfwave: {
      th: "ไซน์เรียงกระแสครึ่งคลื่น", en: "Half-wave rectified sine", sym: "", params: { A: 1 },
      segs: function (p) { return [S(0, PI, p.A), L(PI, TAU, 0)]; },
      rule: "a₀ = A/π, b₁ = A/2, aₙ = −2A/(π(n²−1)) เมื่อ n คู่", id: "W7"
    },
    fullwave: {
      th: "ไซน์เรียงกระแสเต็มคลื่น", en: "Full-wave rectified sine", sym: "even-only", params: { A: 1 },
      segs: function (p) { return [S(0, PI, p.A), S(PI, TAU, -p.A)]; },
      rule: "a₀ = 2A/π, aₙ = −4A/(π(n²−1)) เมื่อ n คู่ (เทียบความถี่แหล่งจ่าย)", id: "W8"
    },
    quasi: {
      th: "สี่เหลี่ยมสามระดับ (quasi-square) มุม α", en: "Quasi-square wave", sym: "odd half", params: { A: 1, alpha: 30 },
      segs: function (p) {
        var a = Math.min(Math.max(p.alpha, 0), 89.9) * D2R;
        return clampSegs([L(0, a, 0), L(a, PI - a, p.A), L(PI - a, PI + a, 0), L(PI + a, TAU - a, -p.A), L(TAU - a, TAU, 0)]);
      },
      rule: "bₙ = (4A/nπ)·cos(nα) เมื่อ n คี่ · α = 30° กำจัดฮาร์มอนิกที่ 3", id: "W9"
    },
    sixstep: {
      th: "อินเวอร์เตอร์ six-step (แรงดันเฟส)", en: "Six-step inverter phase voltage", sym: "odd half", params: { A: 1 },
      segs: function (p) {
        var v = p.A / 3, s = PI / 3;
        return [L(0, s, v), L(s, 2 * s, 2 * v), L(2 * s, 3 * s, v), L(3 * s, 4 * s, -v), L(4 * s, 5 * s, -2 * v), L(5 * s, TAU, -v)];
      },
      rule: "bₙ = 2V_dc/(nπ) เมื่อ n = 6k ± 1 เท่านั้น (ไม่มี 3, 9, 15)", id: "W10"
    },
    spwm: {
      th: "SPWM (ไซน์–สามเหลี่ยม)", en: "Sinusoidal PWM", sym: "", params: { A: 1, ma: 0.8, mf: 15, uni: 0 },
      segs: function (p) { return spwmSegs(p.A, Math.max(0, p.ma), Math.max(1, Math.round(p.mf)), !!p.uni); },
      rule: "A = V_dc · ฮาร์มอนิกหลัก = mₐV_dc/2 (ครึ่งบริดจ์ ไบโพลาร์) หรือ mₐV_dc (เต็มบริดจ์ ยูนิโพลาร์) ส่วนที่เหลือรวมกลุ่มรอบ m_f, 2m_f, …", id: "W13"
    },
    trapezoid: {
      th: "พัลส์สี่เหลี่ยมคางหมู (มีเวลาขาขึ้น)", en: "Trapezoidal pulse", sym: "", params: { A: 1, D: 0.5, tr: 0.02 },
      segs: function (p) {
        var D = Math.min(Math.max(p.D, 0.02), 0.98), R = TAU * Math.min(Math.max(p.tr, 0.0005), Math.min(D, 1 - D) * 0.98), w = TAU * D, A = p.A;
        return clampSegs([L(0, R, 0, A / R), L(R, w, A), L(w, w + R, A + A * w / R, -A / R), L(w + R, TAU, 0)]);
      },
      rule: "|cₙ| = AD·|sinc(nD)|·|sinc(n·t_r/T)| → เอนเวโลป −20 dB/dec แล้ว −40 dB/dec", id: "W14"
    },
    phasecut: {
      th: "ตัดเฟสด้วยไตรแอก มุมจุด α", en: "Phase-controlled (TRIAC) current", sym: "odd half", params: { A: 1, alpha: 90 },
      segs: function (p) {
        var a = Math.min(Math.max(p.alpha, 0), 179.5) * D2R;
        return clampSegs([L(0, a, 0), S(a, PI, p.A), L(PI, PI + a, 0), S(PI + a, TAU, p.A)]);
      },
      rule: "มีเฉพาะฮาร์มอนิกคี่ ฮาร์มอนิกหลักล้าหลังแรงดัน → DPF < 1 แม้โหลดเป็นตัวต้านทาน", id: "W15"
    },
    clipped: {
      th: "ไซน์ถูกตัดยอด (เครื่องขยายอิ่มตัว)", en: "Clipped sine", sym: "", params: { A: 1, up: 0.7, lo: 0.7 },
      segs: function (p) {
        var A = p.A, u = Math.min(Math.max(p.up, 0.02), 1), l = Math.min(Math.max(p.lo, 0.02), 1);
        var a1 = Math.asin(u), a2 = Math.asin(l);
        return clampSegs([S(0, a1, A), L(a1, PI - a1, A * u), S(PI - a1, PI + a2, A), L(PI + a2, TAU - a2, -A * l), S(TAU - a2, TAU, A)]);
      },
      rule: "ตัดสมมาตรได้เฉพาะฮาร์มอนิกคี่ ตัดไม่สมมาตรมีฮาร์มอนิกคู่และ DC", id: "W16"
    },
    sine: {
      th: "ไซน์บริสุทธิ์", en: "Pure sine", sym: "odd half", params: { A: 1 },
      segs: function (p) { return [S(0, TAU, p.A)]; },
      rule: "มีเพียง b₁ = A ค่าอื่นเป็นศูนย์ทั้งหมด", id: "W17"
    }
  };

  /* a waveform → {segs, cf, ms (exact mean square)} */
  function wave(id, p, H) {
    var w = WAVES[id];
    if (!w) throw new Error("unknown waveform " + id);
    var q = {};
    for (var k in w.params) q[k] = w.params[k];
    for (k in (p || {})) if (p[k] !== undefined && p[k] !== null && p[k] !== "") q[k] = +p[k];
    var segs = w.segs(q);
    return { id: id, p: q, segs: segs, cf: coefSegs(segs, H), ms: meanSquare(segs), at: function (th) { return evalSegs(segs, th); } };
  }

  /* custom waveform from a function of t ∈ [0, 1) (one period) — sampled, midpoint rule */
  function waveFn(fn, H, N) {
    N = N || 8192;
    var x = new Float64Array(N), ms = 0;
    for (var j = 0; j < N; j++) { var v = +fn((j + 0.5) / N); x[j] = isFinite(v) ? v : 0; ms += x[j] * x[j]; }
    // midpoint samples: transform at θ_j = 2π(j+½)/N → shift back by half a sample
    var cf = shiftCoef(coefSamples(x, H), PI / N);
    return { id: "custom", segs: null, cf: cf, ms: ms / N, at: function (th) { var t = ((th / TAU) % 1 + 1) % 1; return x[Math.min(N - 1, Math.floor(t * N))]; } };
  }

  /* symmetry from the coefficients (relative tolerance) */
  function symmetry(cf, N) {
    N = Math.min(N || 60, cf.H);
    var mx = 0, n;
    for (n = 0; n <= N; n++) mx = Math.max(mx, Math.abs(cf.a[n]), Math.abs(cf.b[n]));
    var eps = Math.max(mx * 1e-9, 1e-13), even = true, odd = Math.abs(cf.a[0]) <= eps, half = Math.abs(cf.a[0]) <= eps, evenOnly = true;
    for (n = 1; n <= N; n++) {
      if (Math.abs(cf.b[n]) > eps) even = false;
      if (Math.abs(cf.a[n]) > eps) odd = false;
      if (n % 2 === 0 && (Math.abs(cf.a[n]) > eps || Math.abs(cf.b[n]) > eps)) half = false;
      if (n % 2 === 1 && (Math.abs(cf.a[n]) > eps || Math.abs(cf.b[n]) > eps)) evenOnly = false;
    }
    return { even: even, odd: odd, half: half, quarter: half && (even || odd), evenOnly: evenOnly && !half, dc: Math.abs(cf.a[0]) > eps, eps: eps };
  }

  /* spectrum helpers */
  function amp(cf, n) { return n === 0 ? Math.abs(cf.a[0]) : Math.hypot(cf.a[n], cf.b[n]); }
  function phaseCos(cf, n) { return Math.atan2(-cf.b[n], cf.a[n]); }   // x_n = A_n cos(nθ + φ)
  function phaseSin(cf, n) { return Math.atan2(cf.a[n], cf.b[n]); }    // x_n = A_n sin(nθ + φ)

  /* summary numbers of a waveform for the synthesis view */
  function waveStats(w, N, sigma) {
    var cf = w.cf, H = cf.H, rms = Math.sqrt(w.ms), p = cf.a[0] * cf.a[0], pN = p, h2 = 0, n;
    for (n = 1; n <= H; n++) { var A2 = (cf.a[n] * cf.a[n] + cf.b[n] * cf.b[n]) / 2; p += A2; if (n <= N) pN += A2; if (n >= 2) h2 += A2; }
    var A1 = amp(cf, 1), V1 = A1 / SQ2;
    // max/min of the waveform and of the partial sum (dense grid) → Gibbs overshoot
    var M = 4096, xmax = -Infinity, xmin = Infinity, smax = -Infinity, smin = Infinity, err = 0;
    for (var j = 0; j < M; j++) {
      var th = TAU * (j + 0.5) / M, x = w.at(th), s = partial(cf, N, th, sigma);
      if (x > xmax) xmax = x; if (x < xmin) xmin = x; if (s > smax) smax = s; if (s < smin) smin = s;
      err += (x - s) * (x - s);
    }
    var pp = xmax - xmin;
    return {
      rms: rms, rmsH: Math.sqrt(p), rmsN: Math.sqrt(pN), dc: cf.a[0], A1: A1, V1: V1,
      thd: V1 > 1e-12 ? Math.sqrt(Math.max(0, w.ms - cf.a[0] * cf.a[0] - V1 * V1)) / V1 : NaN,
      thdH: V1 > 1e-12 ? Math.sqrt(h2) / V1 : NaN,
      powerN: w.ms > 0 ? pN / w.ms : 1, errRms: Math.sqrt(err / M),
      max: xmax, min: xmin, pp: pp, smax: smax, smin: smin,
      over: pp > 0 ? Math.max(smax - xmax, xmin - smin) / pp : 0,
      crest: rms > 0 ? Math.max(Math.abs(xmax), Math.abs(xmin)) / rms : NaN
    };
  }

  // ======================================================================= circuits (circuit view)
  /* transfer function H(jω) and an optional output scale; returns complex */
  var CIRCUITS = {
    "rc-lp": { th: "RC กรองผ่านต่ำ (V ที่ C)", out: "V", par: ["R", "C"], H: function (w, p) { return cdiv(C(1), C(1, w * p.R * p.C)); } },
    "rc-hp": { th: "RC กรองผ่านสูง (V ที่ R)", out: "V", par: ["R", "C"], H: function (w, p) { return cdiv(C(0, w * p.R * p.C), C(1, w * p.R * p.C)); } },
    "rl-i": { th: "โหลด RL (กระแส i)", out: "A", par: ["R", "L"], H: function (w, p) { return cdiv(C(1), C(p.R, w * p.L)); } },
    "lc-lp": { th: "LC กรองผ่านต่ำมีโหลด R", out: "V", par: ["L", "C", "R"], H: function (w, p) { var Zp = cdiv(C(p.R), C(1, w * p.R * p.C)); return cdiv(Zp, cadd(C(0.02, w * p.L), Zp)); } },
    "rlc-bp": { th: "RLC อนุกรม (V ที่ R) กรองผ่านแถบ", out: "V", par: ["R", "L", "C"], H: function (w, p) { return w === 0 ? C(0) : cdiv(C(p.R), C(p.R, w * p.L - 1 / (w * p.C))); } },
    "rlc-c": { th: "RLC อนุกรม (V ที่ C) อันดับสอง", out: "V", par: ["R", "L", "C"], H: function (w, p) { return w === 0 ? C(1) : cdiv(C(0, -1 / (w * p.C)), C(p.R, w * p.L - 1 / (w * p.C))); } }
  };

  function circuitHarmonics(cf, f0, type, par, H) {
    var ck = CIRCUITS[type], out = [];
    H = Math.min(H || cf.H, cf.H);
    for (var n = 0; n <= H; n++) {
      var Xn = n === 0 ? C(cf.a[0]) : C(cf.a[n], -cf.b[n]);
      var Hn = ck.H(TAU * f0 * n, par), Yn = cmul(Hn, Xn);
      out.push({ n: n, X: Xn, H: Hn, Y: Yn });
    }
    return out;
  }

  /* periodic steady state of the same circuit driven by the exact waveform (state-space, RK4) — used to
     show that the harmonic sum converges to the true output */
  function circuitExact(w, f0, type, par, M) {
    M = M || 2048;
    var T = 1 / f0, dt = T / M, R = par.R, Lh = par.L, Cc = par.C;
    var sys = {
      "rc-lp": { n: 1, f: function (x, u) { return [(u - x[0]) / (R * Cc)]; }, y: function (x) { return x[0]; } },
      "rc-hp": { n: 1, f: function (x, u) { return [(u - x[0]) / (R * Cc)]; }, y: function (x, u) { return u - x[0]; } },
      "rl-i": { n: 1, f: function (x, u) { return [(u - R * x[0]) / Lh]; }, y: function (x) { return x[0]; } },
      "lc-lp": { n: 2, f: function (x, u) { return [(u - x[1] - 0.02 * x[0]) / Lh, (x[0] - x[1] / R) / Cc]; }, y: function (x) { return x[1]; } },
      "rlc-bp": { n: 2, f: function (x, u) { return [(u - R * x[0] - x[1]) / Lh, x[0] / Cc]; }, y: function (x) { return R * x[0]; } },
      "rlc-c": { n: 2, f: function (x, u) { return [(u - R * x[0] - x[1]) / Lh, x[0] / Cc]; }, y: function (x) { return x[1]; } }
    }[type];
    // RK4 with step boundaries placed exactly on the waveform's breakpoints (jumps and kinks), and the input
    // evaluated from inside each sub-interval, so a discontinuous input does not cost accuracy
    var sub = 8, bps = [];
    if (w.segs) w.segs.forEach(function (sg) { bps.push(sg.a / TAU * T, sg.b / TAU * T); });
    bps = bps.filter(function (t) { return t > 1e-15 && t < T * (1 - 1e-12); }).sort(function (a, b) { return a - b; });
    function u(t) { return w.at(TAU * t / T); }
    function rk(x, ta, tb, withInput) {
      var n = Math.max(1, Math.ceil(sub * (tb - ta) / dt)), hh = (tb - ta) / n, eps = (tb - ta) * 1e-9;
      var uu = function (t) { return withInput ? u(Math.min(tb - eps, Math.max(ta + eps, t))) : 0; };
      for (var k = 0; k < n; k++) {
        var t = ta + k * hh;
        var k1 = sys.f(x, uu(t)), x2 = x.map(function (v, j) { return v + hh / 2 * k1[j]; });
        var k2 = sys.f(x2, uu(t + hh / 2)), x3 = x.map(function (v, j) { return v + hh / 2 * k2[j]; });
        var k3 = sys.f(x3, uu(t + hh / 2)), x4 = x.map(function (v, j) { return v + hh * k3[j]; });
        var k4 = sys.f(x4, uu(t + hh));
        x = x.map(function (v, j) { return v + hh / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
      }
      return x;
    }
    function run(x0, withInput, record) {
      var x = x0.slice(), ys = record ? new Float64Array(M) : null, bi = 0;
      for (var i = 0; i < M; i++) {
        var t0 = i * dt, t1 = (i + 1) * dt;
        if (record) ys[i] = sys.y(x, withInput ? u(t0) : 0);
        var ta = t0;
        while (bi < bps.length && bps[bi] <= t0) bi++;
        while (bi < bps.length && bps[bi] < t1) { x = rk(x, ta, bps[bi], withInput); ta = bps[bi]; bi++; }
        x = rk(x, ta, t1, withInput);
      }
      return { x: x, ys: ys };
    }
    var n = sys.n, zero = new Array(n).fill(0);
    var G = run(zero, true).x, Phi = [];
    for (var j = 0; j < n; j++) { var e = zero.slice(); e[j] = 1; Phi.push(run(e, false).x); }
    // x0 = (I − Φ)⁻¹ G   (Φ columns are Phi[j])
    var x0;
    if (n === 1) x0 = [G[0] / (1 - Phi[0][0])];
    else {
      var a11 = 1 - Phi[0][0], a12 = -Phi[1][0], a21 = -Phi[0][1], a22 = 1 - Phi[1][1], det = a11 * a22 - a12 * a21;
      x0 = [(G[0] * a22 - a12 * G[1]) / det, (a11 * G[1] - a21 * G[0]) / det];
    }
    return run(x0, true, true).ys;
  }

  // ======================================================================= power system: loads, network, metrics
  /* Every load returns its current at the nominal sine voltage as coefficients (phase a, peak values, sine reference:
     the supply voltage of phase a is v = Vm sin θ). Linear loads also return an impedance function so the network
     solver can let their current follow a distorted voltage. */
  var LOADS = {
    R: { th: "ตัวต้านทาน (ฮีตเตอร์)", ph: 1 },
    RL: { th: "โหลด RL (มอเตอร์ หม้อแปลง)", ph: 1 },
    smps: { th: "บริดจ์ไดโอด + ตัวเก็บประจุ (SMPS, LED, คอมพิวเตอร์)", ph: 1, sim: true },
    bridgeL: { th: "บริดจ์ 1 เฟส + โช้ก DC ใหญ่ (กระแสสี่เหลี่ยม)", ph: 1 },
    triac: { th: "ไตรแอกหรี่ไฟ/ฮีตเตอร์ (ตัดเฟส)", ph: 1 },
    pfc: { th: "SMPS มี Active PFC", ph: 1 },
    six: { th: "เรกติไฟเออร์ 3 เฟส 6 พัลส์ + โช้ก DC", ph: 3 },
    twelve: { th: "เรกติไฟเออร์ 12 พัลส์ (หม้อแปลง Y-Y + Y-Δ)", ph: 3 },
    vfd: { th: "ไดรฟ์ VFD (บริดจ์ 3 เฟส + ตัวเก็บประจุ)", ph: 3, sim: true },
    custom: { th: "กำหนดสเปกตรัมเอง", ph: 1 }
  };

  /* time-domain simulation of a capacitor-input diode bridge (1 or 3 phase), constant-power DC load.
     Returns N samples of the phase-a line current over one cycle in steady state. Commutation between phases
     is taken as instantaneous (good enough for the discontinuous "two-hump" current these loads draw). */
  function simBridgeC(o) {
    var N = 4096, f0 = o.f, T = 1 / f0, sub = 6, h = T / N / sub;
    var three = o.three, Vm = o.Vm, Lt = Math.max(o.L, 2e-6), Rt = Math.max(o.R, 1e-3), Cd = o.C, P = o.P;
    var Vh = o.Vh || null; // background voltage harmonics [{n, X: complex peak}] of phase a; phases b, c follow their own order
    function vph(th, k) {
      var sh = -k * TAU / 3, v = Vm * Math.sin(th + sh);
      if (Vh) for (var i = 0; i < Vh.length; i++) {
        var hh = Vh[i], ang = hh.n * (th + sh);
        v += hh.X.re * Math.cos(ang) - hh.X.im * Math.sin(ang);
      }
      return v;
    }
    var Lloop = (three ? 2 * Lt : Lt) + (o.Ldc || 0), Rloop = three ? 2 * Rt : Rt;
    var Vpk = three ? SQ3 * Vm : Vm, vC = 0.94 * Vpk, id = 0, out = new Float64Array(N);
    // resistive DC load sized for the requested power (a constant-power load makes the LC input filter unstable)
    var Rd = vC * vC / P, cycles = 0, pass, Pact = P;
    function cycle(record) {
      var e = 0;
      for (var i = 0; i < N; i++) {
        var p = 0, q = 0;
        for (var k = 0; k < sub; k++) {
          var th = TAU * f0 * ((i * sub + k) * h), vd;
          if (three) {
            var va0 = vph(th, 0), vb0 = vph(th, 1), vc0 = vph(th, 2);
            p = va0 >= vb0 ? (va0 >= vc0 ? 0 : 2) : (vb0 >= vc0 ? 1 : 2);
            q = va0 <= vb0 ? (va0 <= vc0 ? 0 : 2) : (vb0 <= vc0 ? 1 : 2);
            vd = [va0, vb0, vc0][p] - [va0, vb0, vc0][q];
          } else { var v1 = vph(th, 0); vd = Math.abs(v1); p = v1 >= 0 ? 0 : 1; }
          var did = (vd - vC - Rloop * id) / Lloop;
          if (id <= 0 && did <= 0) { id = 0; did = 0; }
          id = Math.max(0, id + did * h);
          vC += (id - vC / Rd) / Cd * h;
          e += vC * vC / Rd * h;
        }
        if (record) out[i] = three ? (p === 0 ? id : q === 0 ? -id : 0) : (p === 0 ? id : -id);
      }
      return e / T;
    }
    for (pass = 0; pass < 2; pass++) {
      var last = null;
      for (var c = 0; c < 60; c++) {
        Pact = cycle(true); cycles++;
        if (last) {
          var d = 0, m = 1e-9;
          for (var j = 0; j < N; j += 8) { d = Math.max(d, Math.abs(out[j] - last[j])); m = Math.max(m, Math.abs(out[j])); }
          if (d < 1e-3 * m && c > 3) break;
        }
        last = Float64Array.from(out);
      }
      if (pass === 0) Rd *= Pact / P;   // second pass: correct the load so the average power matches P
    }
    return { x: out, vC: vC, cycles: cycles, P: Pact, Rdc: Rd };
  }

  /* load → {cf (peak coefficients, phase a), Z(h) for linear loads, info} */
  function loadModel(type, o, H) {
    H = H || H_DEF;
    var V = o.V, Vm = SQ2 * V, w0 = TAU * o.f, P = o.P, info = {}, cf, Z = null, segs = null;
    if (type === "R" || type === "RL") {
      var pf = type === "R" ? 1 : Math.min(Math.max(o.pf, 0.05), 1), S1 = P / pf, Zm = V * V / S1, ph = Math.acos(pf);
      var Rl = Zm * Math.cos(ph), X1 = Zm * Math.sin(ph);
      Z = function (h) { return C(Rl, X1 * h); };
      info = { R: Rl, X: X1, L: X1 / w0 };
      return { cf: null, Z: Z, info: info };
    }
    if (type === "triac") {
      var Rr = V * V / P;  // P = full-on power
      var wv = wave("phasecut", { A: Vm / Rr, alpha: o.alpha }, H);
      return { cf: wv.cf, segs: wv.segs, info: { R: Rr } };
    }
    if (type === "bridgeL") {
      var Vd0 = 2 * SQ2 / PI * V, X = w0 * o.Ls, Id = P / Vd0, mu = 0;
      for (var it = 0; it < 30; it++) {  // DC voltage drops with overlap: Vd = Vd0 − (2/π)X·Id
        var Vd = Vd0 - 2 / PI * X * Id;
        Id = P / Math.max(Vd, 0.3 * Vd0);
      }
      var cm = 1 - 2 * X * Id / Vm;
      mu = cm <= -1 ? PI : Math.acos(Math.max(-1, Math.min(1, cm)));
      // current: rising edge i = −Id + (Vm/X)(1 − cos θ) on [0, μ], +Id to π, falling edge on [π, π+μ], −Id to 2π
      if (mu < 1e-6) segs = [L(0, PI, Id), L(PI, TAU, -Id)];
      else {
        var A = Vm / Math.max(X, 1e-9);
        segs = [S(0, mu, -A, PI / 2, -Id + A), L(mu, PI, Id), S(PI, PI + mu, -A, PI / 2, Id - A), L(PI + mu, TAU, -Id)];
      }
      info = { Id: Id, Vd: Vd0 - 2 / PI * X * Id, mu: mu };
      return { cf: coefSegs(segs, H), segs: segs, info: info };
    }
    if (type === "six" || type === "twelve") {
      var VLL = SQ3 * V, Vm2 = SQ2 * VLL, Xs = w0 * o.Ls, al = (o.alpha || 0) * D2R;
      var Ptot = type === "twelve" ? P / 2 : P;     // each 6-pulse bridge carries half of a 12-pulse load
      var Vdi = 3 * SQ2 / PI * VLL, Id6 = Ptot / (Vdi * Math.cos(al));
      for (var it2 = 0; it2 < 40; it2++) { var Vd6 = Vdi * Math.cos(al) - 3 / PI * Xs * Id6; Id6 = Ptot / Math.max(Vd6, 0.05 * Vdi); }
      var cmu = Math.cos(al) - 2 * Xs * Id6 / Vm2, mu6 = Math.max(0, Math.acos(Math.max(-1, Math.min(1, cmu))) - al);
      // phase-a current: +Id from 30°+α (+ overlap) to 150°+α, −Id half a cycle later
      var t1 = PI / 6 + al, t2 = 5 * PI / 6 + al, K = Vm2 / (2 * Math.max(Xs, 1e-9));
      function block(start, sign) {
        if (mu6 < 1e-6) return [[start, start + 2 * PI / 3, sign * Id6, null]];
        // rise: i = K(cos α − cos(α + θ')) θ' = θ − start; fall mirrors it
        return [
          [start, start + mu6, null, { A: -sign * K, f: al - start + PI / 2, c: sign * K * Math.cos(al) }],
          [start + mu6, start + 2 * PI / 3, sign * Id6, null],
          [start + 2 * PI / 3, start + 2 * PI / 3 + mu6, null, { A: sign * K, f: al - start - 2 * PI / 3 + PI / 2, c: sign * (Id6 - K * Math.cos(al)) }]
        ];
      }
      var parts = block(t1, 1).concat(block(t1 + PI, -1)), raw = [];
      parts.forEach(function (r) {
        // wrap pieces that cross 2π
        var a0 = r[0], b0 = r[1];
        var mk = function (a, b) { return r[2] !== null ? L(a, b, r[2]) : S(a, b, r[3].A, r[3].f, r[3].c); };
        var off = Math.floor(a0 / TAU) * TAU; a0 -= off; b0 -= off;
        if (b0 <= TAU) raw.push(mk(a0, b0));
        else {
          raw.push(mk(a0, TAU));
          // second piece: shift the phase so the same function continues after the wrap
          var s2 = mk(0, b0 - TAU);
          if (s2.k === "s") s2.f += TAU * s2.m;  // sin(θ − 2π + f) identical; keep f as is
          raw.push(s2);
        }
      });
      // fill zero gaps
      raw.sort(function (x, y) { return x.a - y.a; });
      segs = []; var cur = 0;
      raw.forEach(function (s) { if (s.a > cur + 1e-12) segs.push(L(cur, s.a, 0)); segs.push(s); cur = s.b; });
      if (cur < TAU - 1e-12) segs.push(L(cur, TAU, 0));
      cf = coefSegs(segs, H);
      info = { Id: Id6, Vd: Vdi * Math.cos(al) - 3 / PI * Xs * Id6, mu: mu6, alpha: al };
      if (type === "twelve") {
        var a = new Float64Array(H + 1), b = new Float64Array(H + 1);
        for (var n = 1; n <= H; n++) {
          var k6 = Math.round(n / 6), ok = (n === 6 * k6 + 1 || n === 6 * k6 - 1);
          var w2 = ok ? (k6 % 2 === 0 ? 2 : 0) : 0;   // Y-Δ path: harmonic 6k±1 shifted by k·180°
          a[n] = cf.a[n] * w2; b[n] = cf.b[n] * w2;
        }
        cf = { a: a, b: b, H: H };
        segs = null;
        info.Id12 = Id6;
      }
      return { cf: cf, segs: segs, info: info };
    }
    if (type === "smps" || type === "vfd") {
      var three = type === "vfd", Vmph = Vm;
      // single-phase SMPS: add the internal series resistance of the inrush NTC, bridge diodes and EMI filter
      // (about 1.5 % of the base impedance V²/P) so the current peak is realistic
      var Rint = three ? 0 : 0.015 * V * V / P;
      var r = simBridgeC({ three: three, Vm: Vmph, f: o.f, L: o.Ls, R: (o.Rs || 0.01) + Rint, C: o.C, P: P, Ldc: o.Ldc || 0, Vh: o.Vh });
      cf = coefSamples(r.x, H);
      return { cf: cf, segs: null, samples: r.x, info: { Vdc: r.vC, cycles: r.cycles, Pdc: r.P } };
    }
    if (type === "pfc") {
      var I1 = SQ2 * P / V / 0.97;
      var hs = o.spec || [[3, 3, 180], [5, 1.5, 0], [7, 1, 180], [9, 0.6, 0]];
      cf = { a: new Float64Array(H + 1), b: new Float64Array(H + 1), H: H };
      cf.b[1] = I1;
      hs.forEach(function (x) { if (x[0] <= H) { var ph = x[2] * D2R, m = I1 * x[1] / 100; cf.b[x[0]] += m * Math.cos(ph); cf.a[x[0]] += m * Math.sin(ph); } });
      return { cf: cf, info: {} };
    }
    if (type === "custom") {
      var I1c = SQ2 * P / V;
      cf = { a: new Float64Array(H + 1), b: new Float64Array(H + 1), H: H };
      (o.spec || [[1, 100, 0]]).forEach(function (x) {
        var n = x[0] | 0; if (n < 1 || n > H) return;
        var m = I1c * x[1] / 100, ph = (x[2] || 0) * D2R;
        cf.b[n] += m * Math.cos(ph); cf.a[n] += m * Math.sin(ph);
      });
      return { cf: cf, info: {} };
    }
    throw new Error("unknown load " + type);
  }

  /* network at the point of common coupling (PCC):
       source  Vs,h  behind  Zs,h = Rs·√h + j h Xs (skin effect),
       other linear loads on the same transformer: resistance Rd (damping, not part of the measured current),
       plant = load (Norton:  I_load,h = Ins,h + V_pcc,h / ZL,h) + shunt branch Zf,h (capacitor bank / tuned filter)
     V_pcc (1 + Zs/Zf + Zs/ZL + Zs/Rd) = Vs − Zs·Ins
     Measured (plant feeder) current I = I_load + I_f.  Active filter removes a share of Ins,h (2 ≤ h ≤ hmax). */
  function solveNetwork(o) {
    var H = o.H || H_DEF, V = o.V, f0 = o.f, w0 = TAU * f0, out = [];
    var IL = o.IL;                                   // rated fundamental current (A rms) used for Isc/IL
    var Isc = o.scr * IL, Zs = V / Isc, psi = Math.atan(o.xr), Rs = Zs * Math.cos(psi), Xs = Zs * Math.sin(psi);
    var Zf = null, Rd = o.damp > 0 ? V / (o.damp * IL) : null;
    if (o.cap && o.cap.Q > 0) {
      // capacitor bank Q (var, at fundamental, per phase) with series reactor p (fraction of Xc) and quality factor qf
      var p = o.cap.p || 0, Xc = V * V / (o.cap.Q * (1 - p)), Xl = p * Xc, Rf = p > 0 ? Xl * Math.sqrt(1 / p) / (o.cap.qf || 50) : Xc / 2000;
      Zf = function (h) { return C(Rf, h * Xl - Xc / h); };
      out.tune = p > 0 ? Math.sqrt(1 / p) : null;
      out.Xc = Xc; out.Xl = Xl;
    }
    var load = o.load;  // {cf | null, Z | null}
    for (var h = 1; h <= H; h++) {
      var Vs = h === 1 ? C(0, -SQ2 * V) : (o.vbg && o.vbg[h] ? o.vbg[h] : C(0)); // sine reference: V sin θ ↔ phasor −jVm
      var Ins = load.cf ? C(load.cf.a[h], -load.cf.b[h]) : C(0);
      if (h >= 2 && o.af && h <= o.af.hmax) Ins = cscale(Ins, 1 - o.af.eff);
      var Zsh = C(Rs * Math.sqrt(h), h * Xs), den = C(1), num = csub(Vs, cmul(Zsh, Ins));
      if (Zf) den = cadd(den, cdiv(Zsh, Zf(h)));
      if (Rd) den = cadd(den, cdiv(Zsh, C(Rd)));
      var ZL = load.Z ? load.Z(h) : null;
      if (ZL) den = cadd(den, cdiv(Zsh, ZL));
      var Vp = cdiv(num, den), Isrc = cdiv(csub(Vs, Vp), Zsh);
      var Iload = ZL ? cadd(Ins, cdiv(Vp, ZL)) : Ins, If = Zf ? cdiv(Vp, Zf(h)) : C(0);
      out.push({ h: h, Vs: Vs, V: Vp, I: cadd(Iload, If), Isrc: Isrc, Il: Iload, If: If, Zs: Zsh, Zf: Zf ? Zf(h) : null });
    }
    // parallel resonance seen from the load: |Zs ∥ Zf| peak
    out.Rs = Rs; out.Xs = Xs; out.Isc = Isc; out.Zbase = Zs;
    if (Zf) {
      // parallel resonance between the source inductance and the capacitor branch: Im{Zs(h) + Zf(h)} = 0
      var hr = Math.sqrt(out.Xc / (Xs + out.Xl)), a1 = C(Rs * Math.sqrt(hr), hr * Xs), a2 = Zf(hr);
      out.res = { h: hr, Z: cabs(cdiv(cmul(a1, a2), cadd(a1, a2))), Zs1: cabs(C(Rs, Xs)) };
    }
    return out;
  }

  /* power-quality numbers from per-harmonic phasors (peak). which = "I" (source/PCC) or "Il" (load) */
  function metrics(net, which, Hthd, IL) {
    which = which || "I"; Hthd = Hthd || 50;
    var Vr2 = 0, Ir2 = 0, P = 0, QB = 0, Vh2 = 0, Ih2 = 0, Kn = 0, Kd = 0, trip2 = 0;
    var V1 = 0, I1 = 0, P1 = 0, Q1 = 0, ph1 = 0, Vt2 = 0, It2 = 0;
    net.forEach(function (r) {
      var V = r.V, I = r[which], vm = cabs(V) / SQ2, im = cabs(I) / SQ2, h = r.h;
      var VI = cmul(V, cconj(I)), p = VI.re / 2, q = VI.im / 2;
      Vr2 += vm * vm; Ir2 += im * im; P += p; QB += q;
      if (h <= Hthd) { Kn += im * im * h * h; Kd += im * im; }
      if (h === 1) { V1 = vm; I1 = im; P1 = p; Q1 = q; ph1 = carg(V) - carg(I); }
      else if (h <= Hthd) { Vh2 += vm * vm; Ih2 += im * im; }
      if (h % 3 === 0) trip2 += im * im;
    });
    var Vr = Math.sqrt(Vr2), Ir = Math.sqrt(Ir2), S = Vr * Ir, S1 = V1 * I1;
    var D = Math.sqrt(Math.max(0, S * S - P * P - Q1 * Q1));
    return {
      Vrms: Vr, Irms: Ir, V1: V1, I1: I1, P: P, P1: P1, Q1: Q1, QB: QB, S: S, S1: S1, D: D,
      DB: Math.sqrt(Math.max(0, S * S - P * P - QB * QB)),
      N: Math.sqrt(Math.max(0, S * S - P * P)),
      SN: Math.sqrt(Math.max(0, S * S - S1 * S1)), DI: V1 * Math.sqrt(Ih2), DV: Math.sqrt(Vh2) * I1, SH: Math.sqrt(Vh2) * Math.sqrt(Ih2),
      PF: S > 0 ? P / S : 0, DPF: Math.cos(ph1), phi1: ph1,
      THDv: V1 > 0 ? Math.sqrt(Vh2) / V1 : 0, THDi: I1 > 0 ? Math.sqrt(Ih2) / I1 : 0,
      THDiR: Ir > 0 ? Math.sqrt(Ih2) / Ir : 0, TDD: IL > 0 ? Math.sqrt(Ih2) / IL : 0,
      K: Kd > 0 ? Kn / Kd : 1, trip: Math.sqrt(trip2), In3: 3 * Math.sqrt(trip2)
    };
  }

  /* waveform samples (M per cycle) from phasors; sigma smoothing for display */
  function synth(net, key, M, Hmax, sigma) {
    M = M || 1024; var out = new Float64Array(M), Hm = Math.min(Hmax || net.length, net.length);
    for (var j = 0; j < M; j++) {
      var th = TAU * j / M, v = 0;
      for (var i = 0; i < Hm; i++) {
        var r = net[i], X = r[key], h = r.h, w = 1;
        if (sigma) { var z = PI * h / (Hm + 1); w = Math.sin(z) / z; }
        v += w * (X.re * Math.cos(h * th) - X.im * Math.sin(h * th));
      }
      out[j] = v;
    }
    return out;
  }

  /* IEEE 519-2022 limits.  Voltage at the PCC (individual %, THD %) and current (% of IL, odd harmonics) */
  var IEEE519 = {
    voltage: [[1000, 5, 8], [69000, 3, 5], [161000, 1.5, 2.5], [Infinity, 1, 1.5]],
    current: [[20, [4, 2, 1.5, 0.6, 0.3], 5], [50, [7, 3.5, 2.5, 1, 0.5], 8], [100, [10, 4.5, 4, 1.5, 0.7], 12], [1000, [12, 5.5, 5, 2, 1], 15], [Infinity, [15, 7, 6, 2.5, 1.4], 20]]
  };
  function ieeeVoltage(Vll) { for (var i = 0; i < IEEE519.voltage.length; i++) if (Vll <= IEEE519.voltage[i][0]) return { ind: IEEE519.voltage[i][1], thd: IEEE519.voltage[i][2] }; }
  /* individual current limit (% of IL) for harmonic h at ratio Isc/IL; 2022 rule for even harmonics:
     h ≤ 6 → 50 % of the odd limit, h > 6 → 100 % */
  function ieeeCurrent(h, scr) {
    var row = IEEE519.current[IEEE519.current.length - 1];
    for (var i = 0; i < IEEE519.current.length; i++) if (scr < IEEE519.current[i][0]) { row = IEEE519.current[i]; break; }
    var band = h < 11 ? 0 : h < 17 ? 1 : h < 23 ? 2 : h < 35 ? 3 : 4, lim = row[1][band];
    if (h > 50) return { lim: null, tdd: row[2] };
    if (h % 2 === 0) lim *= h <= 6 ? 0.5 : 1;
    return { lim: h === 1 ? null : lim, tdd: row[2] };
  }
  /* IEC 61000-3-2 Class A (A rms) for equipment ≤ 16 A per phase */
  function iecClassA(h) {
    var odd = { 3: 2.3, 5: 1.14, 7: 0.77, 9: 0.4, 11: 0.33, 13: 0.21 }, even = { 2: 1.08, 4: 0.43, 6: 0.3 };
    if (h === 1 || h > 40) return null;
    if (h % 2) return odd[h] !== undefined ? odd[h] : 0.15 * 15 / h;
    return even[h] !== undefined ? even[h] : 0.23 * 8 / h;
  }

  function seq(h) { return h % 3 === 1 ? "+" : h % 3 === 2 ? "−" : "0"; }

  root.FSCore = {
    PI: PI, TAU: TAU, D2R: D2R, SQ2: SQ2, SQ3: SQ3, H: H_DEF,
    C: C, cadd: cadd, csub: csub, cmul: cmul, cdiv: cdiv, cabs: cabs, carg: carg, cscale: cscale, cpol: cpol,
    coefSegs: coefSegs, coefSamples: coefSamples, meanSquare: meanSquare, evalSegs: evalSegs, shiftCoef: shiftCoef,
    partial: partial, WAVES: WAVES, wave: wave, waveFn: waveFn, symmetry: symmetry, amp: amp, phaseCos: phaseCos, phaseSin: phaseSin,
    waveStats: waveStats, CIRCUITS: CIRCUITS, circuitHarmonics: circuitHarmonics, circuitExact: circuitExact,
    LOADS: LOADS, loadModel: loadModel, simBridgeC: simBridgeC, solveNetwork: solveNetwork, metrics: metrics, synth: synth,
    IEEE519: IEEE519, ieeeVoltage: ieeeVoltage, ieeeCurrent: ieeeCurrent, iecClassA: iecClassA, seq: seq
  };
})(typeof window !== "undefined" ? window : globalThis);
