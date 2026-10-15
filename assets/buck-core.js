/* Buck converter analysis engine (window.BuckCore, or require() in Node — copy to .cjs because package.json is "type":"module").
   Everything the buck deep-dive pages need, in one dependency-free file:
   - ccmSteady / dcmSteady / dutyForVo / theoryWave : closed-form steady state, duty-cycle derivation, ideal waveforms (CCM + DCM)
   - ssModel / tf / dcmModel                        : switched state-space → averaged → small-signal matrices, transfer function of any
                                                      input→output pair (2×2 adjugate formula), DCM first-order model
   - bode / stepResp / pRoots                        : frequency response, step response, poles & zeros
   - simulate                                        : switching-level simulator (RK4 per switch interval, exact PWM edges, DCM / current-limit
                                                      event detection, ESR, DCR, Ron, diode Vf+Rd, optional synchronous FET and inductor saturation,
                                                      load/line program, PI voltage mode) with loss accounting
   - freqPoint / freqSweep                           : "virtual network analyzer" — inject a small sine into d, vg or the load current and measure
                                                      the response of the switching model
   - designCalc                                      : L, C, device stresses, loss estimate, pass/fail checks
   Conventions: states x = [iL, vC]; inputs d (duty), vg (line), ix (extra load current sink, in parallel with R);
   outputs vo (load voltage incl. ESR drop), iL, iC, ig (average input current), vC. Zout(s) = −v̂o/îx. */
(function (root) {
  "use strict";

  // ------------------------------------------------------------------------------------------------ polynomials
  // coefficients are real, highest power first: [1, 2, 3] = s² + 2s + 3
  function trim(p) {
    var m = 0, i;
    for (i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i]));
    var k = 0;
    while (k < p.length - 1 && Math.abs(p[k]) <= 1e-12 * m) k++;
    return p.slice(k);
  }
  function pEval(p, w) { // value at s = jw → [re, im]
    var re = 0, im = 0, k, nre, nim;
    for (k = 0; k < p.length; k++) { nre = -im * w + p[k]; nim = re * w; re = nre; im = nim; }
    return [re, im];
  }
  function pRoots(p0) { // degree ≤ 2 → [{re, im}]
    var p = trim(p0), n = p.length - 1;
    if (n < 1) return [];
    if (n === 1) return [{ re: -p[1] / p[0], im: 0 }];
    var a = p[0], b = p[1], c = p[2], disc = b * b - 4 * a * c;
    if (disc >= 0) { var sq = Math.sqrt(disc); return [{ re: (-b + sq) / (2 * a), im: 0 }, { re: (-b - sq) / (2 * a), im: 0 }]; }
    var sq2 = Math.sqrt(-disc);
    return [{ re: -b / (2 * a), im: sq2 / (2 * a) }, { re: -b / (2 * a), im: -sq2 / (2 * a) }];
  }
  function polyStr(p, v, d) { // "1.2e-8 s² + 3.4e-5 s + 1"
    var out = [], n = p.length - 1, fm = function (x) { return fmt(x, d || 4); };
    p.forEach(function (c, i) {
      var e = n - i; if (c === 0 || Math.abs(c) < 1e-300) return;
      var sup = { 2: "²", 3: "³", 4: "⁴" };
      out.push((c === 1 && e > 0 ? "" : fm(c) + (e > 0 ? " " : "")) + (e === 0 ? "" : e === 1 ? v : v + (sup[e] || "^" + e)));
    });
    return out.join(" + ").replace(/\+ -/g, "− ") || "0";
  }
  function fmt(x, d) { // engineering-friendly number format
    if (!isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "–";
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) return x.toExponential((d || 4) - 1).replace("e+", "e").replace(/\.?0+e/, "e");
    return String(+x.toPrecision(d || 4));
  }

  // ------------------------------------------------------------------------------------------------ transfer functions
  function freqResp(t, w) {
    var n = pEval(t.num, w), d = pEval(t.den, w), den = d[0] * d[0] + d[1] * d[1];
    var re = (n[0] * d[0] + n[1] * d[1]) / den, im = (n[1] * d[0] - n[0] * d[1]) / den;
    return { re: re, im: im, mag: Math.hypot(re, im), ph: Math.atan2(im, re) };
  }
  function dcGain(t) { var n = t.num[t.num.length - 1], d = t.den[t.den.length - 1]; return d === 0 ? Infinity : n / d; }
  function bode(t, f0, f1, n) { // log-spaced, phase unwrapped (degrees)
    var f = [], mag = [], ph = [], i, prev = null, off = 0;
    for (i = 0; i < n; i++) {
      var fi = f0 * Math.pow(f1 / f0, i / (n - 1)), r = freqResp(t, 2 * Math.PI * fi), p = r.ph * 180 / Math.PI;
      if (prev !== null) { while (p + off - prev > 180) off -= 360; while (p + off - prev < -180) off += 360; }
      p += off; prev = p;
      f.push(fi); mag.push(20 * Math.log10(Math.max(r.mag, 1e-30))); ph.push(p);
    }
    return { f: f, mag: mag, ph: ph };
  }
  function stepResp(t, tEnd, n) { // unit-step response of a proper TF of order 1 or 2 (RK4 on controller-canonical form)
    var den = trim(t.den), num = t.num.slice(), deg = den.length - 1;
    var a0 = den[0]; den = den.map(function (c) { return c / a0; }); num = num.map(function (c) { return c / a0; });
    while (num.length < den.length) num.unshift(0);
    var E = num[0], out = { t: [], y: [] }, dt = tEnd / (n - 1), i, x = [0, 0], y;
    var c0, c1, f;
    if (deg === 1) { c0 = num[1] - E * den[1]; f = function (x, u) { return [-den[1] * x[0] + u, 0]; }; y = function (x, u) { return c0 * x[0] + E * u; }; }
    else if (deg === 2) { c1 = num[1] - E * den[1]; c0 = num[2] - E * den[2]; f = function (x, u) { return [x[1], -den[2] * x[0] - den[1] * x[1] + u]; }; y = function (x, u) { return c0 * x[0] + c1 * x[1] + E * u; }; }
    else return { t: [0, tEnd], y: [dcGain(t), dcGain(t)] };
    var sub = 8, h = dt / sub, k, j;
    for (i = 0; i < n; i++) {
      out.t.push(i * dt); out.y.push(y(x, 1));
      for (j = 0; j < sub; j++) {
        var k1 = f(x, 1), k2 = f([x[0] + h / 2 * k1[0], x[1] + h / 2 * k1[1]], 1), k3 = f([x[0] + h / 2 * k2[0], x[1] + h / 2 * k2[1]], 1), k4 = f([x[0] + h * k3[0], x[1] + h * k3[1]], 1);
        x = [x[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
      }
    }
    return out;
  }
  // classification of a 2nd-order denominator s² + a1 s + a0
  function secondOrder(den) {
    var d = trim(den); if (d.length !== 3) return null;
    var a1 = d[1] / d[0], a0 = d[2] / d[0];
    if (a0 <= 0) return { w0: NaN, Q: NaN, zeta: NaN, f0: NaN };
    var w0 = Math.sqrt(a0), zeta = a1 / (2 * w0);
    return { w0: w0, f0: w0 / (2 * Math.PI), zeta: zeta, Q: zeta > 0 ? 1 / (2 * zeta) : Infinity };
  }

  // ------------------------------------------------------------------------------------------------ steady state
  // p: Vg R L C fs rL rC Ron Rd Vf (+ sync: synchronous rectifier — Rd := RonLs, Vf := 0)
  function norm(p) {
    var q = { Vg: 24, R: 10, L: 100e-6, C: 100e-6, fs: 50e3, rL: 0, rC: 0, Ron: 0, Rd: 0, Vf: 0, RonLs: 0, sync: false };
    for (var k in p) if (p[k] !== undefined && !(typeof p[k] === "number" && isNaN(p[k]))) q[k] = p[k];
    if (q.sync) { q.Vf = 0; q.Rd = q.RonLs; }
    q.Ts = 1 / q.fs;
    return q;
  }
  function ccmSteady(p0, D) {
    var p = norm(p0), Ts = p.Ts, Rs = p.rL + D * p.Ron + (1 - D) * p.Rd;
    var V = (D * p.Vg - (1 - D) * p.Vf) / (1 + Rs / p.R), IL = V / p.R;
    var m1 = (p.Vg - V - (p.Ron + p.rL) * IL) / p.L;                 // inductor slope while the switch is on
    var dI = m1 * D * Ts, ILmin = IL - dI / 2, ILmax = IL + dI / 2;
    var K = 2 * p.L / (p.R * Ts);
    return { V: V, IL: IL, Io: IL, dI: dI, ILmin: ILmin, ILmax: ILmax, Rs: Rs, K: K, Kcrit: 1 - D, ccm: ILmin > 0 || p.sync, M: V / p.Vg,
      dVq: dI / (8 * p.C * p.fs), dVesr: dI * p.rC, dVsum: dI / (8 * p.C * p.fs) + dI * p.rC };
  }
  // ideal DCM (parasitics neglected): M = 2/(1+√(1+4K/D²)), K = 2L/(R Ts)
  function dcmSteady(p0, D) {
    var p = norm(p0), Ts = p.Ts, K = 2 * p.L / (p.R * Ts), M = 2 / (1 + Math.sqrt(1 + 4 * K / (D * D)));
    var V = M * p.Vg, D2 = D * (1 - M) / M, D3 = 1 - D - D2, ipk = (p.Vg - V) * D * Ts / p.L;
    return { M: M, V: V, K: K, D1: D, D2: D2, D3: D3, ipk: ipk, Io: V / p.R, IL: V / p.R, dcm: D3 > 0, Kcrit: 1 - D };
  }
  // open loop at a given D: pick CCM (with parasitics) when its inductor current stays positive, otherwise ideal DCM
  function openLoop(p0, D) {
    var p = norm(p0), c = ccmSteady(p, D);
    if (c.ccm) return Object.assign({ mode: "CCM" }, c);
    var d = dcmSteady(p, D);
    return { mode: "DCM", V: d.V, IL: d.IL, Io: d.Io, M: d.M, K: d.K, Kcrit: d.Kcrit, ILmin: 0, ILmax: d.ipk, dI: d.ipk, D1: d.D1, D2: d.D2, D3: d.D3, ipk: d.ipk,
      dVq: null, dVesr: null, dVsum: null };
  }
  // the duty cycle that gives Vo at load resistance R (p.R)
  function dutyForVo(p0, Vo) {
    var p = norm(p0), IL = Vo / p.R, Ts = p.Ts;
    var Dccm = (Vo + p.Vf + IL * (p.rL + p.Rd)) / (p.Vg + p.Vf - IL * (p.Ron - p.Rd));
    var c = ccmSteady(p, Dccm), ideal = Vo / p.Vg;
    var Ddcm = Math.sqrt(2 * p.L * IL * Vo / (Ts * p.Vg * (p.Vg - Vo)));
    var ccm = c.ILmin > 0 || p.sync;
    return { Dideal: ideal, Dccm: Dccm, Ddcm: Ddcm, mode: ccm ? "CCM" : "DCM", D: ccm ? Dccm : Ddcm, IL: IL,
      Ioc: Vo * (1 - ideal) * Ts / (2 * p.L), Rc: 2 * p.L / ((1 - ideal) * Ts) };
  }
  // ideal one-period waveforms (theory overlay). Returns uniformly sampled arrays over [0, Ts].
  function theoryWave(p0, D, n) {
    var p = norm(p0), Ts = p.Ts, o = openLoop(p, D), V = o.V, k, N = n || 400;
    var m1 = (p.Vg - V) / p.L, m2 = (V + p.Vf) / p.L, t1 = D * Ts, t2, iPeak, i0;
    if (o.mode === "CCM") {
      var dI = o.dI; m1 = dI / t1; t2 = (1 - D) * Ts; m2 = dI / t2; i0 = o.ILmin; iPeak = o.ILmax;
    } else { iPeak = o.ipk; i0 = 0; t2 = iPeak / m2; }
    var out = { t: [], iL: [], vL: [], vsw: [], iD: [], iQ: [], iC: [], vr: [], D: D, mode: o.mode, V: V, Io: o.Io, t1: t1, t2: t2, t3: Math.max(0, Ts - t1 - t2), ipk: iPeak, imin: i0 };
    var vc = 0, Io = o.Io, dt = Ts / N, iLprev = i0, vcs = [], mean = 0;
    for (k = 0; k <= N; k++) {
      var t = k * dt, iL, vL, vsw, iD = 0, iQ = 0;
      if (t <= t1) { iL = i0 + m1 * t; vL = p.Vg - V; vsw = p.Vg; iQ = iL; }
      else if (t <= t1 + t2) { iL = iPeak - m2 * (t - t1); if (o.mode === "DCM") iL = Math.max(0, iL); vL = -V - p.Vf; vsw = -p.Vf; iD = iL; }
      else { iL = 0; vL = 0; vsw = V; }
      out.t.push(t); out.iL.push(iL); out.vL.push(vL); out.vsw.push(vsw); out.iD.push(iD); out.iQ.push(iQ); out.iC.push(iL - Io);
      if (k > 0) vc += (iL - Io + iLprev - Io) / 2 * dt / p.C;
      iLprev = iL; vcs.push(vc);
    }
    for (k = 0; k < vcs.length; k++) mean += vcs[k]; mean /= vcs.length;
    for (k = 0; k < vcs.length; k++) out.vr.push(vcs[k] - mean + p.rC * (out.iL[k] - Io));
    var mn = Math.min.apply(null, out.vr), mx = Math.max.apply(null, out.vr); out.vpp = mx - mn;
    return out;
  }

  // periodic steady-state initial condition at the start of a switching period (ESR-aware), from the theoretical waveform
  function steadyInit(p0, D) {
    var p = norm(p0), th = theoryWave(p, D, 200);
    return { iL: th.iL[0], vC: th.V + th.vr[0] - p.rC * (th.iL[0] - th.Io) };
  }

  // ------------------------------------------------------------------------------------------------ state-space
  // Switched models (CCM). States [iL, vC]; the diode's Vf enters as a constant source (input "1").
  //   ON : x' = A1 x + B1 vg                    OFF: x' = A2 x + e2   (e2 = [−Vf/L, 0])
  // v = a·vC + b·(iL − ix), a = R/(R+rC), b = R·rC/(R+rC)
  function ssModel(p0, D) {
    var p = norm(p0), R = p.R, L = p.L, C = p.C, Rt = R + p.rC, a = R / Rt, b = R * p.rC / Rt;
    var ra = p.rL + p.Ron + b, rb = p.rL + p.Rd + b, Dp = 1 - D;
    var A1 = [[-ra / L, -a / L], [a / C, -1 / (C * Rt)]], A2 = [[-rb / L, -a / L], [a / C, -1 / (C * Rt)]];
    var B1 = [1 / L, 0], e2 = [-p.Vf / L, 0];
    var A = [[D * A1[0][0] + Dp * A2[0][0], D * A1[0][1] + Dp * A2[0][1]], [D * A1[1][0] + Dp * A2[1][0], D * A1[1][1] + Dp * A2[1][1]]];
    var Bg = [D / L, 0], eAvg = [-Dp * p.Vf / L, 0];
    // operating point X = −A⁻¹ (Bg·Vg + eAvg)
    var det = A[0][0] * A[1][1] - A[0][1] * A[1][0], rhs = [-(Bg[0] * p.Vg + eAvg[0]), -(Bg[1] * p.Vg + eAvg[1])];
    var X = [(A[1][1] * rhs[0] - A[0][1] * rhs[1]) / det, (-A[1][0] * rhs[0] + A[0][0] * rhs[1]) / det];
    var IL = X[0], VC = X[1], V = a * VC + b * IL;
    var Bd = [(p.Vg + p.Vf - (p.Ron - p.Rd) * IL) / L, 0];
    var Bx = [b / L, -a / C];
    return { p: p, D: D, Dp: Dp, a: a, b: b, Rt: Rt, A1: A1, A2: A2, B1: B1, e2: e2, A: A, Bg: Bg, Bd: Bd, Bx: Bx, X: X, IL: IL, VC: VC, V: V,
      det: det, tr: A[0][0] + A[1][1], eig: pRoots([1, -(A[0][0] + A[1][1]), det]), Re: p.rL + D * p.Ron + Dp * p.Rd };
  }
  // output rows: C (1×2), feedthrough E per input
  var OUT = {
    vo: function (m) { return { C: [m.b, m.a], E: { d: 0, vg: 0, ix: -m.b } }; },
    vC: function () { return { C: [0, 1], E: { d: 0, vg: 0, ix: 0 } }; },
    iL: function () { return { C: [1, 0], E: { d: 0, vg: 0, ix: 0 } }; },
    iC: function (m) { return { C: [m.a, -1 / m.Rt], E: { d: 0, vg: 0, ix: -m.a } }; },
    ig: function (m) { return { C: [m.D, 0], E: { d: m.IL, vg: 0, ix: 0 } }; }
  };
  var INP = { d: function (m) { return m.Bd; }, vg: function (m) { return m.Bg; }, ix: function (m) { return m.Bx; } };
  // G(s) = C (sI−A)⁻¹ B + E for any input/output pair → {num, den}
  function tf(model, input, output) {
    var A = model.A, B = INP[input](model), o = OUT[output](model), E = o.E[input], c = o.C;
    var tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    // C adj(sI−A) B = s (c1 b1 + c2 b2) + [−c1 a22 b1 + c1 a12 b2 + c2 a21 b1 − c2 a11 b2]
    var s1 = c[0] * B[0] + c[1] * B[1];
    var s0 = -c[0] * A[1][1] * B[0] + c[0] * A[0][1] * B[1] + c[1] * A[1][0] * B[0] - c[1] * A[0][0] * B[1];
    var den = [1, -tr, det], num = [E, s1 - E * tr, s0 + E * det];
    return { num: num, den: den, input: input, output: output };
  }
  function zout(model) { var g = tf(model, "ix", "vo"); return { num: g.num.map(function (c) { return -c; }), den: g.den }; }
  function zin(model) { var g = tf(model, "vg", "ig"); return { num: g.den, den: g.num }; } // 1 / Yin
  // equivalent circuit check: Zout = (sL + Rl) ∥ (rC + 1/sC) ∥ R at a frequency
  function zoutCircuit(p0, D, w) {
    var p = norm(p0), Rl = p.rL + D * p.Ron + (1 - D) * p.Rd;
    var cd = function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
    var zl = [Rl, w * p.L], zc = w === 0 ? [Infinity, 0] : [p.rC, -1 / (w * p.C)];
    var y = [1 / p.R, 0], yl = cd([1, 0], zl);
    y[0] += yl[0]; y[1] += yl[1];
    if (w !== 0) { var yc = cd([1, 0], zc); y[0] += yc[0]; y[1] += yc[1]; }
    var z = cd([1, 0], y); return { re: z[0], im: z[1], mag: Math.hypot(z[0], z[1]) };
  }
  // DCM small-signal model (ideal, first order): Gvd, Gvg, Zout
  function dcmModel(p0, D) {
    var p = norm(p0), s = dcmSteady(p, D), M = s.M, V = s.V, Gd0 = 2 * V / D * (1 - M) / (2 - M), Gg0 = M;
    var wp = (2 - M) / ((1 - M) * p.R * p.C), Req = p.R * (1 - M) / (2 - M);
    return { M: M, V: V, K: s.K, Gd0: Gd0, Gg0: Gg0, wp: wp, fp: wp / (2 * Math.PI), Req: Req,
      Gvd: { num: [Gd0], den: [1 / wp, 1] }, Gvg: { num: [Gg0], den: [1 / wp, 1] }, Zout: { num: [Req], den: [Req * p.C, 1] } };
  }

  // ------------------------------------------------------------------------------------------------ switching-level simulator
  // cfg: p (see norm; plus Isat/satType for saturation), D (open loop) or ctrl {type:"pi", Vref, Kp, Ki, Dmax, Dmin, soft}, Ilim (cycle-by-cycle),
  //      program: [{dur, R | I, Vg}] (seconds; last segment extends), nPer, init {iL, vC}, nsub, perturb {d|vg|ix: {amp, f}}, capture {t0, t1}
  function simulate(cfg) {
    var p = norm(cfg.p), Ts = p.Ts, nsub = cfg.nsub || 24, sync = !!p.sync;
    var prog = (cfg.program && cfg.program.length ? cfg.program : [{ dur: 1e9, R: p.R }]).map(function (s) { return { dur: s.dur, R: s.R, I: s.I, Vg: s.Vg == null ? p.Vg : s.Vg }; });
    var ends = [], acc = 0; prog.forEach(function (s) { acc += s.dur; ends.push(acc); });
    var nPer = cfg.nPer || Math.round(Math.min(acc, 1e9) / Ts);
    var ctrl = cfg.ctrl || { type: "open", D: cfg.D };
    var per = cfg.perturb || {}, Ilim = cfg.Ilim || 0;
    var Ix = 0, nSat = 4;
    if (p.Isat) nSat = p.satType === "hard" ? 8 : p.satType === "none" ? 0 : 2.5;
    // L(i) = L0 / (1 + (|i|/Ix)^n), calibrated so that L(Isat) = 0.7 L0 (the usual "30 % drop" Isat definition)
    if (p.Isat && nSat > 0) Ix = p.Isat / Math.pow(1 / 0.7 - 1, 1 / nSat);
    var Lfloor = (p.satType === "hard" ? 0.08 : 0.2) * p.L; // a saturated core keeps some air-core inductance
    var Lfun = (p.Isat && nSat > 0) ? function (i) { return Math.max(Lfloor, p.L / (1 + Math.pow(Math.abs(i) / Ix, nSat))); } : function () { return p.L; };
    var iL = cfg.init ? cfg.init.iL : 0, vC = cfg.init ? cfg.init.vC : 0, t = 0;
    var seg = 0, Rl = prog[0].R || 0, Icc = prog[0].I || 0, vgs = prog[0].Vg;
    var vgNow = vgs, ixNow = 0;
    var integ = ctrl.type === "pi" ? (ctrl.I0 || 0) : 0, vPrev = vC, dCmd = ctrl.D || 0;
    var A = {}; // per-period accumulators
    var out = { Ts: Ts, nPer: nPer, vMean: new Float32Array(nPer), iLMean: new Float32Array(nPer), iLMin: new Float32Array(nPer), iLMax: new Float32Array(nPer),
      vMin: new Float32Array(nPer), vMax: new Float32Array(nPer), dEff: new Float32Array(nPer), dCmd: new Float32Array(nPer), igMean: new Float32Array(nPer),
      ioMean: new Float32Array(nPer), pin: new Float32Array(nPer), pout: new Float32Array(nPer), pRon: new Float32Array(nPer), pDio: new Float32Array(nPer),
      pCu: new Float32Array(nPer), pEsr: new Float32Array(nPer), iQ2: new Float32Array(nPer), iD: new Float32Array(nPer), iD2: new Float32Array(nPer), iC2: new Float32Array(nPer),
      iL2: new Float32Array(nPer), idle: new Float32Array(nPer), limited: new Uint8Array(nPer), seg: new Uint8Array(nPer), wave: null };
    var cap = cfg.capture, wave = null;
    if (cap) wave = out.wave = { t: [], iL: [], v: [], vsw: [], iD: [], iQ: [], iC: [], vC: [], mode: [] };
    // scratch results of f()
    var fi = 0, fv = 0, qv = 0, qiC = 0, qiR = 0, qvsw = 0;
    function inputs(tt) {
      vgNow = vgs; ixNow = 0;
      if (per.vg) vgNow += per.vg.amp * Math.sin(2 * Math.PI * per.vg.f * tt);
      if (per.ix) ixNow = per.ix.amp * Math.sin(2 * Math.PI * per.ix.f * tt);
    }
    function f(i, v0, mode, tt) {
      if (per.vg || per.ix) inputs(tt);
      var iR;
      if (Rl > 0) { qv = (v0 + p.rC * (i - ixNow)) / (1 + p.rC / Rl); iR = qv / Rl; }
      else { iR = Icc * (v0 > 0.3 ? 1 : Math.max(v0, 0) / 0.3); qv = v0 + p.rC * (i - iR - ixNow); }
      qiR = iR; qiC = i - iR - ixNow;
      if (mode === 0) qvsw = vgNow - p.Ron * i; else if (mode === 1) qvsw = sync ? -p.RonLs * i : -(p.Vf + p.Rd * i); else qvsw = qv;
      fi = mode === 2 ? 0 : (qvsw - p.rL * i - qv) / Lfun(i);
      fv = qiC / p.C;
    }
    var step = [0, 0];
    function rk4(i, v0, mode, tt, h) {
      f(i, v0, mode, tt); var a1 = fi, b1 = fv;
      f(i + h / 2 * a1, v0 + h / 2 * b1, mode, tt + h / 2); var a2 = fi, b2 = fv;
      f(i + h / 2 * a2, v0 + h / 2 * b2, mode, tt + h / 2); var a3 = fi, b3 = fv;
      f(i + h * a3, v0 + h * b3, mode, tt + h); var a4 = fi, b4 = fv;
      step[0] = i + h / 6 * (a1 + 2 * a2 + 2 * a3 + a4); step[1] = v0 + h / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
      if (mode === 2) step[0] = 0;
    }
    // per-period accumulators (reset each period)
    var sV, sIL, sIg, sIo, sPin, sPout, sPron, sPdio, sPcu, sPesr, sIQ2, sID, sID2, sIC2, sIL2, sIdle, mnIL, mxIL, mnV, mxV, limHit;
    function inst(i, v0, mode, tt) { // sets q* and returns nothing; accumulators use them
      f(i, v0, mode, tt);
    }
    // accumulate trapezoid over [t, t+h] given start/end states in a fixed mode
    function accum(mode, h, i0, v0, t0, i1, v1) {
      var ia, va, ca, ra, vgA, ib, vb, cb, rb, vgB;
      inst(i0, v0, mode, t0); va = qv; ca = qiC; ra = qiR; vgA = vgNow; ia = i0;
      inst(i1, v1, mode, t0 + h); vb = qv; cb = qiC; rb = qiR; vgB = vgNow; ib = i1;
      var iQa = mode === 0 ? ia : 0, iQb = mode === 0 ? ib : 0, iDa = mode === 1 ? ia : 0, iDb = mode === 1 ? ib : 0;
      var h2 = h / 2;
      sV += (va + vb) * h2; sIL += (ia + ib) * h2; sIg += (iQa + iQb) * h2; sIo += (ra + rb) * h2;
      sPin += (vgA * iQa + vgB * iQb) * h2; sPout += (va * ra + vb * rb) * h2;
      sPron += p.Ron * (iQa * iQa + iQb * iQb) * h2;
      sPdio += (sync ? p.RonLs * (iDa * iDa + iDb * iDb) : p.Vf * (iDa + iDb) + p.Rd * (iDa * iDa + iDb * iDb)) * h2;
      sPcu += p.rL * (ia * ia + ib * ib) * h2; sPesr += p.rC * (ca * ca + cb * cb) * h2;
      sIQ2 += (iQa * iQa + iQb * iQb) * h2; sID += (iDa + iDb) * h2; sID2 += (iDa * iDa + iDb * iDb) * h2; sIC2 += (ca * ca + cb * cb) * h2; sIL2 += (ia * ia + ib * ib) * h2;
      if (mode === 2) sIdle += h;
      if (i1 < mnIL) mnIL = i1; if (i1 > mxIL) mxIL = i1; if (vb < mnV) mnV = vb; if (vb > mxV) mxV = vb;
    }
    function sample(mode, tt, i, v0) {
      if (!wave || tt < cap.t0 || tt > cap.t1) return;
      f(i, v0, mode, tt);
      wave.t.push(tt); wave.iL.push(i); wave.v.push(qv); wave.vsw.push(qvsw); wave.iD.push(mode === 1 ? i : 0); wave.iQ.push(mode === 0 ? i : 0);
      wave.iC.push(qiC); wave.vC.push(v0); wave.mode.push(mode);
    }
    // switch-off threshold while the switch is on: cycle-by-cycle limit Ilim and/or peak-current-mode command (icmd − ramp)
    var icmd = Infinity, ramp = 0, tOn0 = 0, tBlank = 0.01 * Ts;
    function thr(tt) { var th = icmd - ramp * (tt - tOn0); return Ilim > 0 && Ilim < th ? Ilim : th; }
    // advance within one mode until tEnd; evt 1: stop when iL reaches 0 (diode current ends), evt 2: stop when iL reaches thr(t). Returns true when the event fired.
    function advance(mode, tEnd, nst, evt) {
      var h = (tEnd - t) / nst, s, fired = false;
      if (h <= 0) return false;
      sample(mode, t, iL, vC);
      for (s = 0; s < nst; s++) {
        rk4(iL, vC, mode, t, h);
        var i1 = step[0], v1 = step[1], hh = h;
        if (evt === 1 && i1 <= 0) { var th = iL / (iL - i1); hh = h * th; rk4(iL, vC, mode, t, hh); i1 = 0; v1 = step[1]; fired = true; }
        else if (evt === 2 && t + h > tOn0 + tBlank) {
          var g0 = iL - thr(t), g1 = i1 - thr(t + h);
          if (g1 >= 0) {
            var th2 = g0 >= 0 ? 0.02 : -g0 / (g1 - g0); if (th2 < 0.02) th2 = 0.02; if (th2 > 1) th2 = 1;
            hh = h * th2; rk4(iL, vC, mode, t, hh); i1 = step[0]; v1 = step[1]; fired = true;
          }
        }
        if (!sync && mode === 0 && i1 < 0) i1 = 0;
        accum(mode, hh, iL, vC, t, i1, v1);
        t += hh; iL = i1; vC = v1;
        sample(mode, t, iL, vC);
        if (fired) return true;
      }
      return false;
    }
    var k, tt0, segNow = 0;
    for (k = 0; k < nPer; k++) {
      tt0 = k * Ts;
      while (segNow < prog.length - 1 && tt0 >= ends[segNow] - 1e-12) segNow++;
      if (segNow !== seg || k === 0) { seg = segNow; Rl = prog[seg].R || 0; Icc = prog[seg].I || 0; vgs = prog[seg].Vg; }
      // controller
      var d, icSat = false;
      icmd = Infinity; ramp = 0; tOn0 = tt0;
      if (ctrl.type === "pcmc") {
        var vrefP = ctrl.Vref * (ctrl.soft ? Math.min(1, tt0 / ctrl.soft) : 1), eP = vrefP - vPrev, hiI = ctrl.Ilim || 1e3;
        integ += ctrl.Ki * eP * Ts;
        var icc = ctrl.Kp * eP + integ;
        if (icc > hiI) { integ -= icc - hiI; icc = hiI; } else if (icc < 0) { integ -= icc; icc = 0; }
        if (integ < 0) integ = 0;
        icmd = icc; ramp = ctrl.ma || 0; d = ctrl.Dmax || 0.95; icSat = icc >= hiI - 1e-9;
      } else if (ctrl.type === "pi") {
        var vref = ctrl.Vref * (ctrl.soft ? Math.min(1, tt0 / ctrl.soft) : 1), e = vref - vPrev;
        integ += ctrl.Ki * e * Ts; var lo = ctrl.Dmin || 0, hi = ctrl.Dmax || 0.95;
        d = ctrl.Kp * e + integ;
        if (d > hi) { integ -= d - hi; d = hi; } else if (d < lo) { integ += lo - d; d = lo; }
        if (integ < 0) integ = 0;
      } else d = (ctrl.stepAt != null && tt0 >= ctrl.stepAt - 1e-12) ? ctrl.D2 : ctrl.D;
      if (per.d) d += per.d.amp * Math.sin(2 * Math.PI * per.d.f * (tt0 + Ts / 2));
      d = Math.min(Math.max(d, 0), ctrl.Dmax || 1);
      out.dCmd[k] = ctrl.type === "pcmc" ? icmd : d;
      sV = sIL = sIg = sIo = sPin = sPout = sPron = sPdio = sPcu = sPesr = sIQ2 = sID = sID2 = sIC2 = sIL2 = sIdle = 0; mnIL = Infinity; mxIL = -Infinity; mnV = Infinity; mxV = -Infinity; limHit = 0;
      if (per.vg || per.ix) inputs(tt0); else { vgNow = vgs; ixNow = 0; }
      var tOnEnd = tt0 + d * Ts, tOnDone = tt0;
      if (d > 1e-9) {
        if (!sync && iL < 0) iL = 0;
        var fired = advance(0, tOnEnd, Math.max(2, Math.round(nsub * d)), (Ilim > 0 || ctrl.type === "pcmc") ? 2 : 0);
        if (fired && (ctrl.type !== "pcmc" || icSat)) limHit = 1;
        tOnDone = t;
      }
      var tEnd = tt0 + Ts;
      if (tEnd - t > 1e-15) {
        var nOff = Math.max(2, Math.round(nsub * (tEnd - t) / Ts));
        if (sync || iL > 0) {
          if (advance(1, tEnd, nOff, sync ? 0 : 1)) { if (tEnd - t > 1e-15) advance(2, tEnd, 4, 0); }
        } else advance(2, tEnd, 4, 0);
      }
      t = tEnd;
      out.vMean[k] = sV / Ts; out.iLMean[k] = sIL / Ts; out.iLMin[k] = mnIL; out.iLMax[k] = mxIL; out.vMin[k] = mnV; out.vMax[k] = mxV;
      out.dEff[k] = (tOnDone - tt0) / Ts;
      out.igMean[k] = sIg / Ts; out.ioMean[k] = sIo / Ts; out.pin[k] = sPin / Ts; out.pout[k] = sPout / Ts; out.pRon[k] = sPron / Ts; out.pDio[k] = sPdio / Ts;
      out.pCu[k] = sPcu / Ts; out.pEsr[k] = sPesr / Ts; out.iQ2[k] = sIQ2 / Ts; out.iD[k] = sID / Ts; out.iD2[k] = sID2 / Ts; out.iC2[k] = sIC2 / Ts; out.iL2[k] = sIL2 / Ts;
      out.idle[k] = sIdle / Ts; out.limited[k] = limHit; out.seg[k] = seg;
      vPrev = out.vMean[k];
    }
    out.final = { iL: iL, vC: vC, integ: integ };
    return out;
  }
  // mean of a per-period array over periods [k0, k1)
  function avg(a, k0, k1) { var s = 0, n = 0, k; for (k = k0; k < k1; k++) { s += a[k]; n++; } return n ? s / n : NaN; }
  // steady state of the switching model at constant D (settles from the theoretical operating point)
  function steadyCheck(p0, D, nPer) {
    var p = norm(p0), o = openLoop(p, D), N = nPer || 600;
    var r = simulate({ p: p, D: D, nPer: N, init: steadyInit(p, D), nsub: 40 }), k0 = Math.floor(N * 0.6);
    var iLmax = 0, iLmin = Infinity, vmax = -Infinity, vmin = Infinity, k;
    for (k = k0; k < N; k++) { iLmax = Math.max(iLmax, r.iLMax[k]); iLmin = Math.min(iLmin, r.iLMin[k]); vmax = Math.max(vmax, r.vMax[k]); vmin = Math.min(vmin, r.vMin[k]); }
    return { V: avg(r.vMean, k0, N), IL: avg(r.iLMean, k0, N), iLmax: iLmax, iLmin: iLmin, vpp: vmax - vmin, Pin: avg(r.pin, k0, N), Pout: avg(r.pout, k0, N),
      loss: { Ron: avg(r.pRon, k0, N), diode: avg(r.pDio, k0, N), copper: avg(r.pCu, k0, N), esr: avg(r.pEsr, k0, N) }, idle: avg(r.idle, k0, N), run: r, theory: o };
  }

  // averaged (cycle-mean) nonlinear model: x' = f(x, d(t)) — what state-space averaging gives before linearisation. dfun(t) → duty.
  function simAveraged(p0, dfun, T, dt, x0) {
    var p = norm(p0), n = Math.ceil(T / dt), out = { t: [], v: [], iL: [] }, x = [x0.iL, x0.vC], k;
    function f(x, d) {
      var i = x[0], vv = (x[1] + p.rC * i) / (1 + p.rC / p.R), vsw = d * (p.Vg - p.Ron * i) + (1 - d) * (-p.Vf - p.Rd * i);
      return [(vsw - p.rL * i - vv) / p.L, (i - vv / p.R) / p.C];
    }
    for (k = 0; k <= n; k++) {
      var t = k * dt, d0 = dfun(t), dm = dfun(t + dt / 2), d1 = dfun(t + dt), i = x[0];
      out.t.push(t); out.iL.push(i); out.v.push((x[1] + p.rC * i) / (1 + p.rC / p.R));
      var k1 = f(x, d0), k2 = f([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]], dm), k3 = f([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]], dm), k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]], d1);
      x = [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    }
    return out;
  }
  // linear small-signal model driven by u(t) (deviation of the chosen input): x̂' = A x̂ + B u, outputs vo and iL deviations
  function simLinear(m, input, ufun, T, dt) {
    var A = m.A, Bv = INP[input](m), o1 = OUT.vo(m), o2 = OUT.iL(m), n = Math.ceil(T / dt), x = [0, 0], out = { t: [], v: [], iL: [] }, k;
    function f(x, u) { return [A[0][0] * x[0] + A[0][1] * x[1] + Bv[0] * u, A[1][0] * x[0] + A[1][1] * x[1] + Bv[1] * u]; }
    for (k = 0; k <= n; k++) {
      var t = k * dt, u0 = ufun(t), um = ufun(t + dt / 2), u1 = ufun(t + dt);
      out.t.push(t); out.v.push(o1.C[0] * x[0] + o1.C[1] * x[1] + o1.E[input] * u0); out.iL.push(x[0]);
      var k1 = f(x, u0), k2 = f([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]], um), k3 = f([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]], um), k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]], u1);
      x = [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    }
    return out;
  }

  // ------------------------------------------------------------------------------------------------ virtual network analyzer
  // Inject ε·sin(2π f t) into input ("d", "vg" or "ix") around the operating point, f = fs/n, and measure the cycle-averaged response by
  // correlation over whole perturbation cycles. out: "vo" "iL" "ig" "io".
  function freqPoint(p0, D, input, n, eps, outputs) {
    var p = norm(p0), o = openLoop(p, D), fsw = p.fs, f = fsw / n, w = 2 * Math.PI * f;
    var m = ssModel(p, D), alpha = Math.max(1e-3, -Math.max(m.eig[0].re, m.eig[1] ? m.eig[1].re : m.eig[0].re));
    if (o.mode === "DCM") alpha = Math.max(alpha, 1 / (p.R * p.C));
    var tSettle = Math.min(4 / alpha, 0.03), cSettle = Math.max(2, Math.ceil(tSettle * f)), cMeas = Math.max(3, Math.min(8, Math.ceil(0.004 * f)));
    var cyc = cSettle + cMeas, nPer = cyc * n, per = {}; per[input] = { amp: eps, f: f };
    // start from the linear model's steady-state sinusoidal response so that only a small residual transient has to die out
    var init = steadyInit(p, D), A = m.A, Bv = INP[input](m), j2 = [[-A[0][0], -A[0][1]], [-A[1][0], -A[1][1]]];
    // (jωI − A) X = B ε  → complex 2×2 solve; x̂(0) = Im X
    var a11 = [-A[0][0], w], a12 = [-A[0][1], 0], a21 = [-A[1][0], 0], a22 = [-A[1][1], w];
    var cm = function (x, y) { return [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]]; };
    var det = [cm(a11, a22)[0] - cm(a12, a21)[0], cm(a11, a22)[1] - cm(a12, a21)[1]], dd = det[0] * det[0] + det[1] * det[1];
    var cd = function (x) { return [(x[0] * det[0] + x[1] * det[1]) / dd, (x[1] * det[0] - x[0] * det[1]) / dd]; };
    var b1 = [Bv[0] * eps, 0], b2 = [Bv[1] * eps, 0];
    var X1 = cd([cm(a22, b1)[0] - cm(a12, b2)[0], cm(a22, b1)[1] - cm(a12, b2)[1]]), X2 = cd([cm(a11, b2)[0] - cm(a21, b1)[0], cm(a11, b2)[1] - cm(a21, b1)[1]]);
    if (o.mode === "CCM") init = { iL: init.iL + X1[1], vC: init.vC + X2[1] };
    else { var dm = dcmModel(p, D), G = input === "d" ? dm.Gvd : input === "vg" ? dm.Gvg : { num: dm.Zout.num.map(function (c) { return -c; }), den: dm.Zout.den }, rr = freqResp(G, w); init = { iL: init.iL, vC: init.vC + rr.im * eps }; }
    var r = simulate({ p: p, D: D, nPer: nPer, init: init, perturb: per, nsub: 24 });
    var res = { f: f, n: n, nPer: nPer }, k0 = cSettle * n, N = nPer - k0;
    var arrs = { vo: r.vMean, iL: r.iLMean, ig: r.igMean, io: r.ioMean };
    (outputs || ["vo"]).forEach(function (name) {
      var a = arrs[name], sc = 0, ss = 0, k;
      for (k = k0; k < nPer; k++) { var tc = (k + 0.5) * p.Ts, c = Math.cos(w * tc), s = Math.sin(w * tc); sc += a[k] * c; ss += a[k] * s; }
      sc *= 2 / N; ss *= 2 / N; // y ≈ ss·sin + sc·cos → amplitude, phase relative to sin
      var amp = Math.hypot(sc, ss), ph = Math.atan2(sc, ss);
      res[name] = { gain: amp / eps, db: 20 * Math.log10(Math.max(amp / eps, 1e-30)), ph: ph * 180 / Math.PI, re: ss / eps, im: sc / eps };
    });
    return res;
  }
  // perturbation amplitude that keeps the predicted output swing small (3 % of Vo, 10 % of IL/Ig) even when the plant has a high-Q resonance
  function autoEps(p0, D, input, output) {
    var p = norm(p0), o = openLoop(p, D), m = ssModel(p, D), base = input === "d" ? 0.01 : input === "vg" ? 0.02 * p.Vg : Math.max(0.05 * o.IL, 0.005);
    var g = output === "vo" && o.mode === "DCM" ? (input === "d" ? dcmModel(p, D).Gvd : input === "vg" ? dcmModel(p, D).Gvg : dcmModel(p, D).Zout) : tf(m, input, output === "io" ? "iL" : output);
    var pk = 0, i, fmax = p.fs / 6;
    for (i = 0; i < 160; i++) { var f = 10 * Math.pow(fmax / 10, i / 159), r = freqResp(g, 2 * Math.PI * f); if (r.mag > pk) pk = r.mag; }
    var ref = output === "vo" ? o.V : output === "ig" ? Math.max(D * o.IL, 1e-3) : Math.max(o.IL, 1e-3), target = (output === "vo" ? 0.03 : 0.1) * ref;
    return pk * base > target ? target / pk : base;
  }
  function freqSweep(p0, D, input, outputs, fmin, fmax, np, eps) {
    var p = norm(p0), pts = [], seen = {}, i;
    fmin = Math.max(fmin, p.fs / 3000); // keeps the run time bounded at very high switching frequencies (≤ 3000 periods per perturbation cycle)
    for (i = 0; i < np; i++) {
      var f = fmin * Math.pow(fmax / fmin, np === 1 ? 0 : i / (np - 1)), n = Math.max(8, Math.round(p.fs / f));
      if (seen[n]) continue; seen[n] = 1;
      pts.push(freqPoint(p, D, input, n, eps, outputs));
    }
    pts.sort(function (a, b) { return a.f - b.f; });
    return pts;
  }

  // PI gains for peak current mode: the plant ic → vo is ≈ R/(1+sRC), so Kp = 2π·fc·C puts the crossover at fc and a PI zero a decade below keeps ~84° of margin.
  // Slope compensation ma = 0.6·Vo/L (60 % of the inductor down-slope) removes sub-harmonic oscillation for any D.
  function pcmcAuto(p0, Vo, fc) {
    var p = norm(p0), f = fc || Math.min(p.fs / 20, 3e3), wc = 2 * Math.PI * f, Kp = wc * p.C;
    return { Kp: Kp, Ki: Kp * wc / 10, ma: 0.6 * Vo / p.L, fc: f };
  }

  // ------------------------------------------------------------------------------------------------ design helper
  // spec: Vinmin Vinmax Vo Iomax Iomin fs rip (ΔiL/Iomax) dVo (V pp) sync; parts: L {L, rL, Isat}, C {C, rC}, Q {Ron, Qg, tsw}, Dd {Vf, Rd, Qrr, If, Vrrm}
  function designCalc(s, parts) {
    var o = {}, Ts = 1 / s.fs;
    o.Dmin = s.Vo / s.Vinmax; o.Dmax = s.Vo / s.Vinmin; o.Dnom = s.Vo / (s.Vinmax + s.Vinmin) * 2;
    o.dIrip = s.rip * s.Iomax;
    o.Lmin = s.Vo * (1 - o.Dmin) / (s.fs * o.dIrip);                                       // ripple limited, at Vin,max
    o.LccmMin = s.Vo * (1 - o.Dmin) / (2 * s.fs * s.Iomin);                                // stay CCM down to Iomin at Vin,max
    o.Iocrit = s.Vo * (1 - o.Dmin) * Ts / (2 * (parts && parts.L ? parts.L.L : o.Lmin));
    o.Ipk = s.Iomax + o.dIrip / 2;
    o.Cmin = o.dIrip / (8 * s.fs * s.dVo * 0.5); o.ESRmax = s.dVo * 0.5 / o.dIrip;         // half of the ripple budget to C, half to ESR
    o.Cin_rms = s.Iomax * Math.sqrt(0.5 * 0.5);                                              // worst case D = 0.5 (bound)
    o.Cin_rmsAt = function (D) { return s.Iomax * Math.sqrt(D * (1 - D)); };
    if (parts) {
      var P = parts, L = P.L, C = P.C, Q = P.Q, Dd = P.Dd, sync = !!s.sync;
      var dI = function (Vin) { var D = s.Vo / Vin; return s.Vo * (1 - D) / (L.L * s.fs); };
      var worst = {};
      [s.Vinmin, (s.Vinmin + s.Vinmax) / 2, s.Vinmax].forEach(function (Vin) {
        var D = s.Vo / Vin, di = dI(Vin), IQrms = Math.sqrt(D) * Math.sqrt(s.Iomax * s.Iomax + di * di / 12), IDavg = (1 - D) * s.Iomax;
        var IDrms = Math.sqrt(1 - D) * Math.sqrt(s.Iomax * s.Iomax + di * di / 12), ILrms = Math.sqrt(s.Iomax * s.Iomax + di * di / 12), ICrms = di / Math.sqrt(12);
        var pcQ = Q.Ron * IQrms * IQrms, pcD = sync ? (Q.RonLs || Q.Ron) * IDrms * IDrms : Dd.Vf * IDavg + Dd.Rd * IDrms * IDrms, pcL = L.rL * ILrms * ILrms, pcC = C.rC * ICrms * ICrms;
        var psw = 0.5 * Vin * s.Iomax * Q.tsw * s.fs + Q.Qg * 5 * s.fs + (sync ? 0 : (Dd.Qrr || 0) * Vin * s.fs) + 0.5 * (Q.Coss || 0) * Vin * Vin * s.fs;
        var pout = s.Vo * s.Iomax, ploss = pcQ + pcD + pcL + pcC + psw;
        var r = { Vin: Vin, D: D, dI: di, Ipk: s.Iomax + di / 2, IQrms: IQrms, IDavg: IDavg, ILrms: ILrms, ICrms: ICrms, pcQ: pcQ, pcD: pcD, pcL: pcL, pcC: pcC, psw: psw, ploss: ploss, eff: pout / (pout + ploss),
          dVo: di / (8 * C.C * s.fs) + di * C.rC, ICinrms: s.Iomax * Math.sqrt(D * (1 - D)) };
        if (!worst.hi || r.Ipk > worst.hi.Ipk) worst.hi = r;
        if (!worst.lo || r.eff < worst.lo.eff) worst.lo = r;
        (o.rows = o.rows || []).push(r);
      });
      o.worst = worst;
    }
    return o;
  }

  var api = { norm: norm, pEval: pEval, pRoots: pRoots, polyStr: polyStr, fmt: fmt, trim: trim, freqResp: freqResp, dcGain: dcGain, bode: bode, stepResp: stepResp, secondOrder: secondOrder,
    steadyInit: steadyInit, ccmSteady: ccmSteady, dcmSteady: dcmSteady, openLoop: openLoop, dutyForVo: dutyForVo, theoryWave: theoryWave, ssModel: ssModel, tf: tf, zout: zout, zin: zin, zoutCircuit: zoutCircuit,
    dcmModel: dcmModel, pcmcAuto: pcmcAuto, simulate: simulate, simAveraged: simAveraged, simLinear: simLinear, steadyCheck: steadyCheck, avg: avg, freqPoint: freqPoint, freqSweep: freqSweep, autoEps: autoEps, designCalc: designCalc };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.BuckCore = api;
})(typeof window !== "undefined" ? window : null);
