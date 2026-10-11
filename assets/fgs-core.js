/* Function generator + circuit engine for the FG / oscilloscope lab (modsengineeringmath.com).
   FGS.FG     — what the generator puts out: emf(t) behind its 50 Ω output resistance, sync times
   FGS.Engine — the circuit between the generator and the two scope probes; record(t0, dt, n) gives the
                probe-tip voltages {a: CH1, b: CH2}. Linear circuits are solved exactly (state space + matrix
                exponential, periodic steady state); diode and op-amp circuits are integrated step by step. */
(function () {
  "use strict";
  var FGS = (window.FGS = window.FGS || {});
  var TAU = 2 * Math.PI;
  var RS = 50; // generator output resistance (Ω)

  // ======================================================================= small utilities
  var PFX = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
  function fmtSI(v, unit, sig) {
    if (v == null || !isFinite(v)) return "—";
    sig = sig || 4;
    var a = Math.abs(v);
    if (a < 1e-15) return "0 " + (unit || "");
    for (var i = 0; i < PFX.length; i++) {
      if (a >= PFX[i][0] * 0.99995 || i === PFX.length - 1) {
        var x = v / PFX[i][0], d = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(x) + 1e-300)));
        var s = x.toFixed(Math.min(d, 6));
        if (s.indexOf(".") >= 0 && sig < 5) s = s.replace(/\.?0+$/, "");
        return s.replace("-", "−") + " " + PFX[i][1] + (unit || "");
      }
    }
  }
  function parseSI(str) {
    if (typeof str === "number") return str;
    var s = String(str).trim().replace(/−/g, "-").replace(/,/g, "").replace(/\s+/g, "");
    var m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([GMkKmuµnp]?)/i.exec(s);
    if (!m) return NaN;
    var v = parseFloat(m[1]), p = m[2];
    var mult = { G: 1e9, M: 1e6, k: 1e3, K: 1e3, m: 1e-3, u: 1e-6, "µ": 1e-6, n: 1e-9, p: 1e-12 };
    return v * (mult[p] || 1);
  }
  // 1-2-5 sequence: idx125(0) = 1, 1 → 2, 2 → 5, 3 → 10 ...
  function seq125(i) { var d = Math.floor(i / 3), r = ((i % 3) + 3) % 3; return [1, 2, 5][r] * Math.pow(10, d); }
  function idx125(v) { var best = 0, bd = 1e99; for (var i = -40; i <= 30; i++) { var d = Math.abs(Math.log(seq125(i) / v)); if (d < bd) { bd = d; best = i; } } return best; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function mod(a, b) { var r = a % b; return r < 0 ? r + b : r; }

  // deterministic noise: Gaussian samples on a time grid, linearly interpolated
  function hash01(k) {
    var a = (k - Math.floor(k / 4294967296) * 4294967296) | 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gaussK(k, seed) {
    var u1 = hash01(k * 2 + seed * 7919) + 1e-12, u2 = hash01(k * 2 + 1 + seed * 7919);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
  }
  function noiseAt(t, bw, seed) {
    var dn = 1 / (2 * bw), x = t / dn, k = Math.floor(x), f = x - k;
    return gaussK(k, seed) * (1 - f) + gaussK(k + 1, seed) * f;
  }

  FGS.util = { fmtSI: fmtSI, parseSI: parseSI, seq125: seq125, idx125: idx125, clamp: clamp, mod: mod, noiseAt: noiseAt, TAU: TAU, RS: RS };

  // ======================================================================= the function generator
  var WAVES = {
    sine: { th: "ไซน์", fmax: 25e6 },
    square: { th: "สี่เหลี่ยม", fmax: 25e6 },
    ramp: { th: "แรมป์/สามเหลี่ยม", fmax: 1e6 },
    pulse: { th: "พัลส์", fmax: 15e6 },
    noise: { th: "นอยส์", fmax: 25e6 },
    sinc: { th: "Arb: sinc", fmax: 5e6 },
    exprise: { th: "Arb: exp rise", fmax: 5e6 },
    stair: { th: "Arb: ขั้นบันได 8 ระดับ", fmax: 5e6 },
    dc: { th: "DC", fmax: 0 }
  };
  var SQ_EDGE = 8e-9; // square-wave rise/fall time 10–90 %
  var NOISE_BW = 25e6;
  var SINC_MIN = -0.21723362821122166;

  function defaultsFG() {
    return {
      wave: "sine", freq: 1000, amp: 2, offset: 0, phase: 0, duty: 50, sym: 50, edge: 20e-9,
      load: "highz", out: true, noise: 0,
      mod: "none", amDepth: 80, amF: 100, fmDev: 200, fmF: 50, pwmDev: 20, pwmF: 10,
      swF1: 100, swF2: 10000, swTime: 1, swType: "lin", bN: 3, bPer: 0.01
    };
  }

  // one cycle of each shape, φ in [0,1), value −1 … +1, rising zero / rising edge at φ = 0
  function edgePulse(p, D, e) {
    var lim = Math.min(D, 1 - D) * 0.98;
    if (e > lim) e = lim;
    if (e < 1e-12) return p < D ? 1 : -1;
    var q = p >= 1 - e / 2 ? p - 1 : p;
    if (q < e / 2) return -1 + (2 * (q + e / 2)) / e;
    if (q < D - e / 2) return 1;
    if (q < D + e / 2) return 1 - (2 * (q - (D - e / 2))) / e;
    return -1;
  }
  function rampShape(p, s, e) {
    s = clamp(s, e, 1 - e);
    var q = p >= 1 - s / 2 ? p - 1 : p;
    if (q < s / 2) return (2 * q) / s;
    return 1 - (2 * (q - s / 2)) / (1 - s);
  }
  function shape(fg, p, D, finst) {
    switch (fg.wave) {
      case "sine": return Math.sin(TAU * p);
      case "square": return edgePulse(p, D, (SQ_EDGE / 0.8) * finst);
      case "pulse": return edgePulse(p, D, (Math.max(fg.edge, SQ_EDGE) / 0.8) * finst);
      case "ramp": return rampShape(p, fg.sym / 100, Math.min(0.01, (SQ_EDGE / 0.8) * finst + 1e-6));
      case "sinc": { var u = (p - 0.5) * 20, s = Math.abs(u) < 1e-9 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u); return (2 * (s - SINC_MIN)) / (1 - SINC_MIN) - 1; }
      case "exprise": return (2 * (1 - Math.exp(-5 * p))) / (1 - Math.exp(-5)) - 1;
      case "stair": return (Math.floor(p * 8) / 7) * 2 - 1;
    }
    return 0;
  }

  // load factor: in 50 Ω mode the generator doubles its internal emf so a 50 Ω load sees the set value
  function loadK(fg) { return fg.load === "50" ? 2 : 1; }

  function emf(fg, t) {
    if (!fg.out) return 0;
    var k = loadK(fg), A = fg.amp / 2, off = fg.offset;
    if (fg.wave === "dc") return k * off;
    var f = fg.freq, ph = fg.phase / 360, cyc, finst = f, D = fg.duty / 100, env = 1;
    switch (fg.mod) {
      case "fm": {
        var fm = fg.fmF, dv = fg.fmDev;
        cyc = f * t - (dv / (TAU * fm)) * Math.cos(TAU * fm * t) + ph;
        finst = f + dv * Math.sin(TAU * fm * t);
        break;
      }
      case "sweep": {
        var Ts = fg.swTime, f1 = fg.swF1, f2 = fg.swF2, tau = mod(t, Ts);
        if (fg.swType === "log") { var r = f2 / f1, L = Math.log(r); cyc = ((f1 * Ts) / L) * (Math.pow(r, tau / Ts) - 1); finst = f1 * Math.pow(r, tau / Ts); }
        else { cyc = f1 * tau + ((f2 - f1) * tau * tau) / (2 * Ts); finst = f1 + ((f2 - f1) * tau) / Ts; }
        cyc += ph;
        break;
      }
      case "burst": {
        var tb = mod(t, fg.bPer);
        if (f * tb >= fg.bN) return k * off;
        cyc = f * tb + ph;
        break;
      }
      default: cyc = f * t + ph;
    }
    if (fg.mod === "am") env = 1 + (fg.amDepth / 100) * Math.sin(TAU * fg.amF * t);
    if (fg.mod === "pwm" && (fg.wave === "pulse" || fg.wave === "square")) D = clamp(D + (fg.pwmDev / 100) * Math.sin(TAU * fg.pwmF * t), 0.01, 0.99);
    var v = fg.wave === "noise" ? noiseAt(t, NOISE_BW, 1) / 3.3 : shape(fg, cyc - Math.floor(cyc), D, finst);
    if (fg.noise > 0) v += (fg.noise / 100) * noiseAt(t, NOISE_BW, 2) / 3.3;
    var out = k * (A * env * v + off);
    return clamp(out, -10.5, 10.5); // the output amplifier clips at about ±10.5 V (open circuit)
  }

  // the period of the generator output, or null when it does not repeat (noise, modulation, sweep, burst)
  function periodFG(fg) {
    if (!fg.out || fg.wave === "dc") return 1e-3;
    if (fg.wave === "noise" || fg.noise > 0 || fg.mod !== "none") return null;
    return 1 / fg.freq;
  }
  // highest frequency the circuit simulation has to resolve
  function fmaxFG(fg, noNoise) {
    if (fg.wave === "noise") return noNoise ? 1e5 : NOISE_BW;
    if (fg.noise > 0 && !noNoise) return NOISE_BW;
    var f = fg.mod === "sweep" ? Math.max(fg.swF1, fg.swF2) : fg.mod === "fm" ? fg.freq + Math.abs(fg.fmDev) : fg.freq;
    return fg.wave === "sine" ? f : f * 25;
  }
  // sync output (for EXT trigger): rising edge times
  function syncPeriod(fg) {
    if (!fg.out || fg.wave === "dc" || fg.wave === "noise") return null;
    switch (fg.mod) {
      case "am": return { T: 1 / fg.amF, t0: 0 };
      case "fm": return { T: 1 / fg.fmF, t0: 0 };
      case "pwm": return { T: 1 / fg.pwmF, t0: 0 };
      case "sweep": return { T: fg.swTime, t0: 0 };
      case "burst": return { T: fg.bPer, t0: 0 };
    }
    return { T: 1 / fg.freq, t0: -(fg.phase / 360) / fg.freq };
  }
  function nextSync(fg, t) {
    var s = syncPeriod(fg);
    if (!s) return null;
    return s.t0 + Math.ceil((t - s.t0) / s.T) * s.T;
  }
  // checks the generator's own limits; returns a message (Thai) if a value had to be clipped
  function limitFG(fg) {
    var msg = "", k = loadK(fg), vmax = 10 / k, w = WAVES[fg.wave] || WAVES.sine;
    if (fg.wave !== "dc" && fg.wave !== "noise") {
      if (fg.freq > w.fmax) { fg.freq = w.fmax; msg = "ความถี่สูงสุดของรูปคลื่นนี้คือ " + fmtSI(w.fmax, "Hz"); }
      if (fg.freq < 1e-3) { fg.freq = 1e-3; msg = "ความถี่ต่ำสุด 1 mHz"; }
    }
    var minA = 2e-3 / k;
    if (fg.amp < minA) { fg.amp = minA; msg = "แอมพลิจูดต่ำสุด " + fmtSI(minA, "Vpp"); }
    if (fg.wave !== "dc" && fg.amp / 2 + Math.abs(fg.offset) > vmax + 1e-9) {
      if (fg.amp / 2 > vmax) fg.amp = 2 * vmax;
      fg.offset = clamp(fg.offset, -(vmax - fg.amp / 2), vmax - fg.amp / 2);
      msg = "Ampl/2 + |Offset| ต้องไม่เกิน " + fmtSI(vmax, "V") + (k === 2 ? " (โหมดโหลด 50 Ω)" : " (โหมด High-Z)");
    }
    if (fg.wave === "dc" && Math.abs(fg.offset) > vmax) { fg.offset = clamp(fg.offset, -vmax, vmax); msg = "DC สูงสุด ±" + fmtSI(vmax, "V"); }
    fg.duty = clamp(fg.duty, fg.wave === "square" ? 1 : 0.1, fg.wave === "square" ? 99 : 99.9);
    fg.sym = clamp(fg.sym, 0, 100);
    return msg;
  }

  FGS.FG = { WAVES: WAVES, defaults: defaultsFG, emf: emf, period: periodFG, fmax: fmaxFG, nextSync: nextSync, syncPeriod: syncPeriod, limit: limitFG, loadK: loadK, SQ_EDGE: SQ_EDGE };

  // ======================================================================= tiny dense linear algebra
  function matMul(A, B) {
    var n = A.length, m = B[0].length, p = B.length, C = [];
    for (var i = 0; i < n; i++) { C.push(new Array(m).fill(0)); for (var k = 0; k < p; k++) { var a = A[i][k]; if (a) for (var j = 0; j < m; j++) C[i][j] += a * B[k][j]; } }
    return C;
  }
  function eye(n) { var I = []; for (var i = 0; i < n; i++) { I.push(new Array(n).fill(0)); I[i][i] = 1; } return I; }
  function expm(M) {
    var n = M.length, nrm = 0;
    for (var i = 0; i < n; i++) { var r = 0; for (var j = 0; j < n; j++) r += Math.abs(M[i][j]); nrm = Math.max(nrm, r); }
    var s = nrm > 0.5 ? Math.ceil(Math.log2(nrm / 0.5)) : 0, sc = Math.pow(2, -s);
    var X = M.map(function (r) { return r.map(function (v) { return v * sc; }); });
    var E = eye(n), T = eye(n);
    for (var k = 1; k <= 14; k++) { T = matMul(T, X); for (i = 0; i < n; i++) for (j = 0; j < n; j++) { T[i][j] /= k; E[i][j] += T[i][j]; } }
    for (k = 0; k < s; k++) E = matMul(E, E);
    return E;
  }
  // exact zero-order-hold discretisation of x' = Ax + Bu over a step h
  function c2d(A, B, h) {
    var n = A.length, M = [];
    for (var i = 0; i <= n; i++) { M.push(new Array(n + 1).fill(0)); if (i < n) { for (var j = 0; j < n; j++) M[i][j] = A[i][j] * h; M[i][n] = B[i] * h; } }
    var E = expm(M), P = [], G = [];
    for (i = 0; i < n; i++) { P.push(E[i].slice(0, n)); G.push(E[i][n]); }
    return { P: P, G: G };
  }
  function solve(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      var t = M[c]; M[c] = M[p]; M[p] = t;
      for (r = 0; r < n; r++) if (r !== c) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map(function (r, i) { return r[n] / r[i]; });
  }
  function step(P, G, x, u) { var n = x.length, y = new Array(n); for (var i = 0; i < n; i++) { var s = G[i] * u; for (var j = 0; j < n; j++) s += P[i][j] * x[j]; y[i] = s; } return y; }
  function slowestTau(A) {
    if (A.length === 1) return 1 / Math.abs(A[0][0]);
    var tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0], disc = tr * tr / 4 - det;
    var re = disc >= 0 ? Math.max(tr / 2 + Math.sqrt(disc), tr / 2 - Math.sqrt(disc)) : tr / 2;
    return 1 / Math.max(Math.abs(re), 1e-12);
  }
  FGS.la = { expm: expm, c2d: c2d, solve: solve };

  // ======================================================================= circuits between the generator and the probes
  var OPAMPS = {
    ideal: { th: "อุดมคติ", gbw: 1e9, sr: 1e12, drop: 0 },
    lm741: { th: "LM741", gbw: 1e6, sr: 0.5e6, drop: 2 },
    tl081: { th: "TL081", gbw: 3e6, sr: 13e6, drop: 1.5 },
    lm358: { th: "LM358", gbw: 1e6, sr: 0.3e6, drop: 1.5 }
  };
  var DUTS = {
    direct: { th: "ต่อตรง (BNC T)", kind: "direct" },
    cal: { th: "ขั้ว Probe Comp ของสโคป", kind: "cal" },
    rc: { th: "วงจร RC", kind: "linear" },
    rl: { th: "วงจร RL", kind: "linear" },
    rlc: { th: "วงจร RLC อนุกรม", kind: "linear" },
    hwr: { th: "เรกติไฟเออร์ครึ่งคลื่น", kind: "nl" },
    fwr: { th: "เรกติไฟเออร์เต็มคลื่น (บริดจ์)", kind: "nl" },
    clip: { th: "วงจรตัดยอด (clipper)", kind: "nl" },
    clamp: { th: "วงจรยกระดับ (clamper)", kind: "nl" },
    inv: { th: "ออปแอมป์ขยายกลับเฟส", kind: "op" },
    noninv: { th: "ออปแอมป์ขยายไม่กลับเฟส", kind: "op" },
    integ: { th: "ออปแอมป์อินทิเกรเตอร์", kind: "op" },
    diff: { th: "ออปแอมป์ดิฟเฟอเรนชิเอเตอร์", kind: "op" },
    comp: { th: "คอมพาเรเตอร์", kind: "op" },
    schmitt: { th: "ชมิตต์ทริกเกอร์ (กลับเฟส)", kind: "op" }
  };
  function defaultsDUT() {
    return { type: "direct", term: false, out: "C", R: 1000, C: 100e-9, L: 10e-3, RL: 10000, Cf: 1e-6, Vf: 0.7, rd: 1, clipMode: "both",
      Ri: 10000, Rf: 47000, Vcc: 15, op: "tl081", Rp: 1e6, R1: 1000, R2: 10000, Vref: 0 };
  }

  // linear circuits as state space: x' = Ax + Be,  [v1; v2] = Cx + De   (v1 = generator terminal, v2 = circuit output)
  function linearModel(d, opm) {
    var Rp, a, k;
    switch (d.type) {
      case "rc": {
        Rp = d.R + RS; a = 1 / (Rp * d.C);
        var C2 = d.out === "R" ? [-d.R / Rp] : [1], D2 = d.out === "R" ? d.R / Rp : 0;
        return { A: [[-a]], B: [a], C: [[RS / Rp], C2], D: [1 - RS / Rp, D2] };
      }
      case "rl": {
        Rp = d.R + RS;
        return { A: [[-Rp / d.L]], B: [1 / d.L], C: [[-RS], d.out === "L" ? [-Rp] : [d.R]], D: [1, d.out === "L" ? 1 : 0] };
      }
      case "rlc": {
        Rp = d.R + RS;
        var A = [[-Rp / d.L, -1 / d.L], [1 / d.C, 0]], B = [1 / d.L, 0], o = d.out, c2, d2;
        if (o === "R") { c2 = [d.R, 0]; d2 = 0; } else if (o === "L") { c2 = [-Rp, -1]; d2 = 1; } else if (o === "LC") { c2 = [-Rp, 0]; d2 = 1; } else { c2 = [0, 1]; d2 = 0; }
        return { A: A, B: B, C: [[-RS, 0], c2], D: [1, d2] };
      }
      // op-amp circuits while the output is neither clipped nor slew limited (used to start the nonlinear run)
      case "inv": {
        k = d.Rf / (d.Ri + RS); var w = (TAU * opm.gbw) / (1 + k);
        return { A: [[-w]], B: [-w * k], C: [[0], [1]], D: [d.Ri / (d.Ri + RS), 0] };
      }
      case "noninv": {
        var G = 1 + d.Rf / d.Ri, w2 = (TAU * opm.gbw) / G;
        return { A: [[-w2]], B: [w2 * G], C: [[0], [1]], D: [1, 0] };
      }
      case "integ": {
        var Rr = d.R + RS, wi = TAU * opm.gbw;
        return { A: [[-1 / (d.Rp * d.C), 0], [wi, -wi]], B: [-1 / (Rr * d.C), 0], C: [[0, 0], [0, 1]], D: [1 - RS / Rr, 0] };
      }
      case "diff": {
        var R1 = d.R1 + RS, wd = (TAU * opm.gbw) / (1 + d.Rf / R1);
        // states: capacitor voltage vc, output vo; target = −Rf (e − vc)/R1'
        return { A: [[-1 / (R1 * d.C), 0], [(wd * d.Rf) / R1, -wd]], B: [1 / (R1 * d.C), (-wd * d.Rf) / R1], C: [[RS / R1, 0], [0, 1]], D: [1 - RS / R1, 0] };
      }
    }
    return null;
  }

  // one nonlinear time step; s = state array (modified), returns [v1, v2]
  function nlStep(d, opm, s, e, h) {
    var swing = Math.max(0.5, d.Vcc - opm.drop), v1, i;
    switch (d.type) {
      case "hwr":
      case "fwr": {
        var vf = d.type === "fwr" ? 2 * d.Vf : d.Vf, Rt = RS + d.rd * (d.type === "fwr" ? 2 : 1), src = d.type === "fwr" ? Math.abs(e) : e;
        if (d.Cf < 1e-12) {
          i = src > vf ? (src - vf) / (Rt + d.RL) : 0;
          s[0] = i * d.RL;
        } else {
          var Ch = d.Cf / h, vn = (Ch * s[0] + (src - vf) / Rt) / (Ch + 1 / Rt + 1 / d.RL);
          if (src - vf - vn > 0) { i = (src - vf - vn) / Rt; } else { vn = (Ch * s[0]) / (Ch + 1 / d.RL); i = 0; }
          s[0] = vn;
        }
        v1 = e - RS * i * (d.type === "fwr" && e < 0 ? -1 : 1);
        return [v1, s[0]];
      }
      case "clip": {
        var Rt2 = d.R + RS, vo = e, ip = d.Vf, im = d.clipMode === "pos" ? -1e9 : -d.Vf;
        if (e > ip) vo = ip + ((e - ip) * d.rd) / (Rt2 + d.rd);
        else if (e < im) vo = im + ((e - im) * d.rd) / (Rt2 + d.rd);
        i = (e - vo) / Rt2;
        return [e - RS * i, vo];
      }
      case "clamp": {
        var Z = RS + h / d.Cf, io = (e - s[0]) / (d.RL + Z), vout = e - s[0] - io * Z;
        if (vout < -d.Vf) { var Gd = 1 / d.RL + 1 / d.rd; io = (Gd * (e - s[0]) + d.Vf / d.rd) / (1 + Gd * Z); vout = e - s[0] - io * Z; }
        s[0] += (h * io) / d.Cf;
        return [e - RS * io, vout];
      }
    }
    // op-amp circuits: behavioural model — first-order closed-loop bandwidth, slew-rate limit, output swing
    var target, w, vm;
    switch (d.type) {
      case "inv": {
        var Ri = d.Ri + RS; w = (TAU * opm.gbw) / (1 + d.Rf / Ri);
        target = (-d.Rf / Ri) * e;
        vm = (e * d.Rf + s[0] * Ri) / (Ri + d.Rf); // actual inverting-input voltage (≈ 0 unless clipped)
        v1 = e - (RS * (e - vm)) / Ri;
        break;
      }
      case "noninv": { w = (TAU * opm.gbw) / (1 + d.Rf / d.Ri); target = (1 + d.Rf / d.Ri) * e; v1 = e; break; }
      case "integ": {
        var Rr = d.R + RS, y = s[1];
        y += h * (-e / (Rr * d.C) - y / (d.Rp * d.C));
        y = clamp(y, -swing, swing);
        s[1] = y; target = y; w = TAU * opm.gbw; v1 = e - (RS * e) / Rr;
        break;
      }
      case "diff": {
        var R1 = d.R1 + RS, ic = (e - s[1]) / R1;
        s[1] += (h * ic) / d.C;
        target = -d.Rf * ic; w = (TAU * opm.gbw) / (1 + d.Rf / R1); v1 = e - RS * ic;
        break;
      }
      case "comp": { target = clamp(1e5 * (e - d.Vref), -swing, swing); w = TAU * opm.gbw; v1 = e; break; }
      case "schmitt": {
        var vp = (s[0] * d.R2) / (d.R1 + d.R2) + (d.Vref * d.R1) / (d.R1 + d.R2);
        target = clamp(1e5 * (vp - e), -swing, swing); w = TAU * opm.gbw; v1 = e;
        break;
      }
    }
    var vo0 = s[0], vn2 = target + (vo0 - target) * Math.exp(-w * h), lim = opm.sr * h;
    vn2 = clamp(vn2, vo0 - lim, vo0 + lim);
    s[0] = clamp(vn2, -swing, swing);
    return [v1, s[0]];
  }
  function nlTau(d) {
    switch (d.type) {
      case "hwr": case "fwr": return d.Cf > 0 ? d.RL * d.Cf : 1e-9;
      case "clamp": return d.RL * d.Cf;
      case "integ": return d.Rp * d.C;
      case "diff": return (d.R1 + RS) * d.C;
    }
    return 1e-6;
  }

  // ----------------------------------------------------------------------- engine
  function Engine(fg, dut) {
    this.fg = fg; this.d = dut;
    this.opm = OPAMPS[dut.op] || OPAMPS.tl081;
    this.kind = (DUTS[dut.type] || DUTS.direct).kind;
    this.T = this.kind === "cal" ? 1e-3 : periodFG(fg);
    this._dcache = {};
    if (this.kind === "direct") {
      var RL = dut.term ? 1 / (1 / 50 + 1 / 5e5) : 5e5; // both scope inputs (1 MΩ each) on the T, plus optional 50 Ω feed-through
      this.kDiv = RL / (RL + RS);
    } else if (this.kind === "linear") {
      this.m = linearModel(dut, this.opm);
      this.tau = slowestTau(this.m.A);
      if (this.T) this._buildLinearTable();
    } else if (this.kind === "nl" || this.kind === "op") {
      this.tau = nlTau(dut);
      if (this.kind === "op" && dut.type !== "comp" && dut.type !== "schmitt") this.m = linearModel(dut, this.opm);
      if (this.T) this._buildNlTable();
    }
  }
  Engine.prototype.e = function (t) { return emf(this.fg, t); };
  Engine.prototype._cal = function (t) {
    var p = mod(t, 1e-3) / 1e-3, e = 0.5e-6 / 1e-3 / 0.8;
    return 1.5 + 1.5 * edgePulse(p, 0.5, e);
  };
  Engine.prototype._dz = function (h) {
    var key = h.toPrecision(12);
    if (!this._dcache[key]) { this._dcache[key] = c2d(this.m.A, this.m.B, h); var ks = Object.keys(this._dcache); if (ks.length > 12) delete this._dcache[ks[0]]; }
    return this._dcache[key];
  };
  Engine.prototype._out = function (x, e) {
    var C = this.m.C, D = this.m.D, a = D[0] * e, b = D[1] * e;
    for (var j = 0; j < x.length; j++) { a += C[0][j] * x[j]; b += C[1][j] * x[j]; }
    return [a, b];
  };
  // periodic steady state of a linear model, N nodes per period
  Engine.prototype._linearSS = function (N) {
    var T = this.T, h = T / N, z = this._dz(h), n = this.m.A.length, x = new Array(n).fill(0);
    for (var k = 0; k < N; k++) x = step(z.P, z.G, x, this.e((k + 0.5) * h));
    var PT = expm(this.m.A.map(function (r) { return r.map(function (v) { return v * T; }); }));
    var IA = PT.map(function (r, i) { return r.map(function (v, j) { return (i === j ? 1 : 0) - v; }); });
    return { x0: solve(IA, x), z: z, h: h };
  };
  Engine.prototype._buildLinearTable = function () {
    var N = 2048, ss = this._linearSS(N), x = ss.x0, X = [x];
    for (var k = 0; k < N; k++) { x = step(ss.z.P, ss.z.G, x, this.e((k + 0.5) * ss.h)); X.push(x); }
    this.N = N; this.h = ss.h; this.X = X;
  };
  Engine.prototype._initNl = function () {
    var d = this.d, s = [0, 0], T = this.T, i, vmax = -1e9, vmin = 1e9;
    for (i = 0; i < 400; i++) { var v = this.e((i / 400) * T); vmax = Math.max(vmax, v); vmin = Math.min(vmin, v); }
    if (d.type === "hwr") s[0] = Math.max(0, vmax - d.Vf);
    if (d.type === "fwr") s[0] = Math.max(0, Math.max(vmax, -vmin) - 2 * d.Vf);
    if (d.type === "clamp") s[0] = vmin + d.Vf;
    if (d.type === "schmitt" || d.type === "comp") s[0] = Math.max(0.5, d.Vcc - this.opm.drop);
    if (this.m) { // start op-amp circuits from the linear periodic steady state
      var ss = this._linearSS(2048);
      if (d.type === "integ") { s[1] = ss.x0[0]; s[0] = ss.x0[1]; } else if (d.type === "diff") { s[1] = ss.x0[0]; s[0] = ss.x0[1]; } else s[0] = ss.x0[0];
    }
    return s;
  };
  Engine.prototype._buildNlTable = function () {
    var N = 4000, T = this.T, h = T / N, d = this.d, opm = this.opm, s = this._initNl();
    var maxP = clamp(Math.ceil((8 * this.tau) / T) + 3, 4, 600);
    maxP = Math.min(maxP, Math.max(4, Math.floor(1.6e6 / N)));
    var A = new Float64Array(N + 1), B = new Float64Array(N + 1), prev = s.slice(), y;
    for (var p = 0; p < maxP; p++) {
      var last = p === maxP - 1;
      for (var k = 0; k < N; k++) {
        y = nlStep(d, opm, s, this.e((k + 0.5) * h), h);
        if (last) { A[k + 1] = y[0]; B[k + 1] = y[1]; }
      }
      if (!last && p >= 2) {
        var dlt = Math.abs(s[0] - prev[0]) + Math.abs(s[1] - prev[1]);
        if (dlt < 1e-6 * (1 + Math.abs(s[0]))) maxP = p + 2;
      }
      prev = s.slice();
    }
    A[0] = A[N]; B[0] = B[N];
    this.N = N; this.h = h; this.TA = A; this.TB = B;
  };

  // probe-tip voltages for n samples starting at t0, spacing dt
  Engine.prototype.record = function (t0, dt, n) {
    var a = new Float64Array(n), b = new Float64Array(n), i, t, v;
    if (this.kind === "cal") { for (i = 0; i < n; i++) { v = this._cal(t0 + i * dt); a[i] = v; b[i] = v; } return { a: a, b: b }; }
    if (this.kind === "direct") { for (i = 0; i < n; i++) { v = this.e(t0 + i * dt) * this.kDiv; a[i] = v; b[i] = v; } return { a: a, b: b }; }
    if (this.T) return this.kind === "linear" ? this._recLinearP(t0, dt, n, a, b) : this._recTable(t0, dt, n, a, b);
    return this._recTime(t0, dt, n, a, b);
  };
  Engine.prototype._recTable = function (t0, dt, n, a, b) {
    var T = this.T, N = this.N, h = this.h;
    for (var i = 0; i < n; i++) {
      var tau = mod(t0 + i * dt, T) / h, k = Math.floor(tau), f = tau - k;
      if (k >= N) { k = N - 1; f = 1; }
      a[i] = this.TA[k] + (this.TA[k + 1] - this.TA[k]) * f;
      b[i] = this.TB[k] + (this.TB[k + 1] - this.TB[k]) * f;
    }
    return { a: a, b: b };
  };
  Engine.prototype._recLinearP = function (t0, dt, n, a, b) {
    var T = this.T, h = this.h, X = this.X, i, x, y;
    if (dt >= h / 2) {
      for (i = 0; i < n; i++) {
        var t = t0 + i * dt, tau = mod(t, T) / h, k = Math.min(Math.floor(tau), this.N - 1), f = tau - k;
        x = X[k].map(function (v, j) { return v + (X[k + 1][j] - v) * f; });
        y = this._out(x, this.e(t)); a[i] = y[0]; b[i] = y[1];
      }
      return { a: a, b: b };
    }
    var tau0 = mod(t0, T), k0 = Math.min(Math.floor(tau0 / h), this.N - 1), d0 = tau0 - k0 * h;
    x = X[k0];
    if (d0 > 0) { var z0 = c2d(this.m.A, this.m.B, d0); x = step(z0.P, z0.G, x, this.e(t0 - d0 / 2)); }
    var z = this._dz(dt);
    for (i = 0; i < n; i++) {
      var ti = t0 + i * dt, e = this.e(ti);
      y = this._out(x, e); a[i] = y[0]; b[i] = y[1];
      x = step(z.P, z.G, x, this.e(ti + dt / 2));
    }
    return { a: a, b: b };
  };
  // non-repeating input: integrate from a pre-roll long enough for the circuit to forget its start
  Engine.prototype._recTime = function (t0, dt, n, a, b) {
    var lin = this.kind === "linear", d = this.d, opm = this.opm, self = this;
    var pre = Math.min(8 * this.tau, 4), fmax = fmaxFG(this.fg, true);
    var hFine = Math.min(dt, 1 / (20 * fmax)), span = n * dt;
    var nW = Math.ceil(span / hFine);
    if (nW > 150000) { hFine = span / 150000; nW = 150000; }
    var sub = Math.max(1, Math.round(dt / hFine)); hFine = dt / sub;
    var hPre = Math.max(hFine, pre / 20000), nPre = Math.ceil(pre / hPre);
    var x = lin ? new Array(this.m.A.length).fill(0) : [0, 0], t = t0 - nPre * hPre, k, e;
    if (!lin && (d.type === "schmitt" || d.type === "comp")) x[0] = Math.max(0.5, d.Vcc - opm.drop);
    var avgE = function (ta, hh) { // mean of the input over a step (keeps a coarse pre-roll from aliasing)
      if (hh <= 1 / (10 * fmax)) return self.e(ta + hh / 2);
      var s = 0; for (var q = 0; q < 16; q++) s += self.e(ta + ((q + hash01(q + Math.floor(ta * 1e6))) / 16) * hh);
      return s / 16;
    };
    var zp = lin ? c2d(this.m.A, this.m.B, hPre) : null;
    for (k = 0; k < nPre; k++, t += hPre) {
      e = avgE(t, hPre);
      if (lin) x = step(zp.P, zp.G, x, e); else nlStep(d, opm, x, e, hPre);
    }
    t = t0;
    var zf = lin ? c2d(this.m.A, this.m.B, hFine) : null, y;
    for (var i = 0; i < n; i++) {
      if (lin) { y = this._out(x, this.e(t)); a[i] = y[0]; b[i] = y[1]; }
      for (var s2 = 0; s2 < sub; s2++) {
        e = this.e(t + hFine / 2);
        if (lin) x = step(zf.P, zf.G, x, e);
        else { y = nlStep(d, opm, x, e, hFine); if (s2 === 0) { a[i] = y[0]; b[i] = y[1]; } }
        t += hFine;
      }
    }
    return { a: a, b: b };
  };

  FGS.DUTS = DUTS; FGS.OPAMPS = OPAMPS;
  FGS.defaultsDUT = defaultsDUT;
  FGS.Engine = Engine;
})();
