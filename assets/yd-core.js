/* Star–delta engine for /learn/motor-control/star-delta-analysis/ (+ /learn/en/…) and /blog/star-delta-timer-setting/.
   Plain JS, no dependencies. UMD: window.YDCore in the browser, require() in Node (copy to .cjs, package.json is "type": "module").
   Motor = the 7.5 kW 4-pole 400 V Δ 50 Hz double-cage motor of scripts/acm_model.py (In ≈ 14 A, Is/In 6.5, Ts/Tn 2.15,
   Tk/Tn 3.0, 1471 rpm, Pfe 300 W, Pfw 100 W, J 0.045 kg·m²).
   - Steady state: per-phase Y-equivalent circuit (motor, opPoint, runupQS, state = running in Y or Δ at a given shaft power).
   - Dynamics: space-vector (αβ) model in physical winding quantities (impedances ×3 of the Y-equivalent), flux-linkage
     states ψs ψo ψi + speed, fixed-step RK4 (dt 0.1 ms = 200 steps per cycle). While both contactors are open the stator
     current is zero and only the two rotor cages are integrated (their flux linkages are continuous across the switching).
     Modes: Y (230.9 V per winding), D (400 V per winding, winding U across L1–L3 = −30°, "good" order), Dx (U across L1–L2
     = +30°, "wrong" order), R (closed transition: Δ through series resistors Rt), O (open), DOL (Δ from t = 0).
   - run(o) runs a whole start and returns traces + metrics (peaks, I²t, energies, residual voltage, times).
   Checked against acm_model.dyn (scipy LSODA) and the equivalent circuit by scripts/yd_check.py. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.YDCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var S3 = Math.sqrt(3), TAU = 2 * Math.PI, W50 = TAU * 50, VP = 400 / S3, P = 2, WS = TAU * 25;
  var MP = { R1: 0.414, X1: 1.599, Xm: 34.33, Ro: 1.306, Xo: 0.585, Ri: 0.463, Xi: 2.199 };
  var SR = 0.0194, P_FE = 300, P_FW = 100, JM = 0.045, PN = 7500;

  /* ---------------------------------------------------------------- complex helpers (steady state) */
  function C(re, im) { return { re: re, im: im || 0 }; }
  function add(a, b) { return C(a.re + b.re, a.im + b.im); }
  function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function par(a, b) { return div(mul(a, b), add(a, b)); }

  /* Steady state, Δ connection (Y-equivalent per phase). s slip, V per-phase volts (default 230.9 V).
     Returns {I line A, T N·m, pf, Pin W (without core loss), Pcu1, Pcu2, Pag, I1 complex}. Star = same slip with I/3, T/3. */
  function motor(s, V, f) {
    if (V == null) V = VP;
    var kf = (f || 50) / 50;
    if (Math.abs(s) < 1e-7) s = s < 0 ? -1e-7 : 1e-7;
    var Zo = C(MP.Ro / s, MP.Xo * kf), Zi = C(MP.Ri / s, MP.Xi * kf), Z2 = par(Zo, Zi);
    var Z1 = C(MP.R1, MP.X1 * kf), Zm = C(0, MP.Xm * kf);
    var I1 = div(C(V, 0), add(Z1, par(Zm, Z2))), E = sub(C(V, 0), mul(I1, Z1));
    var Io = div(E, Zo), Ii = div(E, Zi);
    var Pag = 3 * (Math.pow(cabs(Io), 2) * Zo.re + Math.pow(cabs(Ii), 2) * Zi.re);
    var I = cabs(I1);
    return { I: I, T: Pag / (WS * kf), pf: I1.re / I, Pin: 3 * V * I1.re, Pcu1: 3 * I * I * MP.R1, Pcu2: s * Pag, Pag: Pag, I1: I1 };
  }
  var RATED = motor(SR), IN = RATED.I, TN = RATED.T, NN = 1500 * (1 - SR), WN = TAU * NN / 60;

  /* loads, fraction k of Tn at rated speed (same shapes as scripts/acm_model.py) */
  var LOADS = {
    quad: { J: 0.06, th: "ปั๊มหอยโข่ง (T ∝ n²)", en: "Centrifugal pump (T ∝ n²)" },
    fan: { J: 2.2, th: "พัดลมใหญ่ ความเฉื่อยสูง (T ∝ n²)", en: "Large fan, high inertia (T ∝ n²)" },
    const: { J: 0.35, th: "สายพาน / คอมเพรสเซอร์ลูกสูบ (แรงบิดคงที่)", en: "Conveyor / piston compressor (constant torque)" },
    lin: { J: 0.2, th: "เครื่องผสม / แรงหนืด (T ∝ n)", en: "Mixer / viscous load (T ∝ n)" }
  };
  function loadT(kind, n, k) {
    var r = Math.abs(n) / NN;
    if (kind === "const") return k * TN * (r < 0.01 ? 1.2 : 1);
    if (kind === "quad") return k * TN * (0.12 + 0.88 * r * r);
    if (kind === "fan") return k * TN * (0.05 + 0.95 * r * r);
    if (kind === "lin") return k * TN * (0.05 + 0.95 * r);
    return 0;
  }

  /* highest speed where motor torque × scale falls through the load torque (stable operating point), null if none */
  function opPoint(TL, V, scale) {
    scale = scale || 1;
    var prev = null, best = null, N = 3000;
    for (var i = 0; i <= N; i++) {
      var n = 1 + i * (1498.99 / N), d = motor(1 - n / 1500, V).T * scale - TL(n);
      if (prev && prev.d > 0 && d <= 0) {
        var a = prev.n, b = n;
        for (var j = 0; j < 50; j++) { var m = (a + b) / 2; if (motor(1 - m / 1500, V).T * scale - TL(m) > 0) a = m; else b = m; }
        best = (a + b) / 2;
      }
      prev = { n: n, d: d };
    }
    return best;
  }
  /* breakdown torque and its speed (scan) */
  function breakdown(V, scale) {
    var best = { T: 0, n: 0 };
    for (var n = 600; n < 1499; n += 1) { var T = motor(1 - n / 1500, V).T * (scale || 1); if (T > best.T) best = { T: T, n: n }; }
    return best;
  }

  /* quasi-static run-up J dω/dt = Tm − TL with dt = 1 ms. conn "Y" | "D" (fixed voltage), "soft" (current limit ilim ×In,
     initial voltage 30 %, ramp tacc s), "vfd" (V/f ramp 0 → 50 Hz in tacc s, held while I > 1.5 In, 3.5 % boost).
     Returns {pts:[[t,n,I,Tm,TL]], ok, nEq, t90, t95, t98, Er (rotor copper J), Ein (from supply incl. core loss J), I2t, Ipk} */
  function runupQS(o) {
    var vpu = o.v == null ? 1 : o.v, V0 = VP * vpu, conn = o.conn || "D", sc = conn === "Y" ? 1 / 3 : 1;
    var TL = function (n) { return loadT(o.load, n, o.k); }, J = o.J;
    var nEq = opPoint(TL, V0, sc), dt = 0.001, t = 0, w = 0, Er = 0, Ein = 0, I2t = 0, Ipk = 0, pts = [], tmax = o.tmax || 120, res = { nEq: nEq };
    var marks = { t90: 0.9, t95: 0.95, t98: 0.98 }, vs = 0.3, fset = 0.5;
    while (t < tmax) {
      var n = w * 60 / TAU, s, m, f = 50, V = V0;
      if (conn === "soft") {
        var md = motor(1 - n / 1500, V0), vr = Math.min(1, vs);
        if (md.I * vr > o.ilim * IN) vr = o.ilim * IN / md.I; else vs = Math.min(1, vs + dt / Math.max(o.tacc || 10, 0.5));
        V = V0 * vr;
      } else if (conn === "vfd") {
        f = fset; V = V0 * Math.min(f, 50) / 50 + 0.035 * V0 * Math.max(0, 1 - f / 50);
      }
      s = 1 - n / (30 * f); m = motor(s, V, f);
      var Tm = m.T * sc, I = m.I * sc, tl = TL(n);
      if (conn === "vfd" && I < 1.5 * IN) fset = Math.min(50, fset + 50 * dt / Math.max(o.tacc || 10, 0.2));
      if (!pts.length || t - pts[pts.length - 1][0] >= 0.02) pts.push([t, n, I, Tm, tl]);
      if (nEq) for (var key in marks) if (res[key] == null && n >= marks[key] * nEq) res[key] = t;
      if (nEq == null || res.t98 != null && n >= 0.98 * nEq) break;
      var a = (Tm - tl) / J;
      if (w <= 0 && a <= 0 && conn !== "vfd" && conn !== "soft") { res.stall = true; break; }
      if (t > 60 && a <= 0) { res.stall = true; break; }
      Er += s * m.Pag * sc * dt; Ein += (m.Pin + P_FE * Math.pow(V / VP, 2)) * sc * dt;
      I2t += I * I * dt; Ipk = Math.max(Ipk, I);
      w = Math.max(0, w + a * dt); t += dt;
    }
    res.pts = pts; res.ok = nEq != null && !res.stall; res.Er = Er; res.Ein = Ein; res.I2t = I2t; res.Ipk = Ipk; res.t = t;
    return res;
  }

  /* ---------------------------------------------------------------- dynamic model (winding quantities) */
  var K3 = 3, Ls = MP.X1 / W50, Lm = MP.Xm / W50, Lo = MP.Xo / W50, Li = MP.Xi / W50;
  var L = [[Ls + Lm, Lm, Lm], [Lm, Lo + Lm, Lm], [Lm, Lm, Li + Lm]].map(function (r) { return r.map(function (v) { return v * K3; }); });
  var R = [MP.R1 * K3, MP.Ro * K3, MP.Ri * K3];
  function inv3(A) {
    var a = A[0][0], b = A[0][1], c = A[0][2], d = A[1][0], e = A[1][1], f = A[1][2], g = A[2][0], h = A[2][1], k = A[2][2];
    var co = [e * k - f * h, -(d * k - f * g), d * h - e * g], det = a * co[0] + b * co[1] + c * co[2];
    return [[co[0] / det, -(b * k - c * h) / det, (b * f - c * e) / det],
      [co[1] / det, (a * k - c * g) / det, -(a * f - c * d) / det],
      [co[2] / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
  }
  var LI = inv3(L);
  var LRd = L[1][1] * L[2][2] - L[1][2] * L[2][1];
  var LRI = [[L[2][2] / LRd, -L[1][2] / LRd], [-L[2][1] / LRd, L[1][1] / LRd]];
  var VW = { Y: VP, D: 400, Dx: 400, R: 400, DOL: 400 };
  var ANG = { Y: 0, D: -Math.PI / 6, Dx: Math.PI / 6, R: -Math.PI / 6, DOL: -Math.PI / 6 };

  /* currents from state y = [ψs re, im, ψo re, im, ψi re, im, ω]; open → stator current 0 */
  function cur(y, open, out) {
    if (open) {
      out[0] = 0; out[1] = 0;
      out[2] = LRI[0][0] * y[2] + LRI[0][1] * y[4]; out[3] = LRI[0][0] * y[3] + LRI[0][1] * y[5];
      out[4] = LRI[1][0] * y[2] + LRI[1][1] * y[4]; out[5] = LRI[1][0] * y[3] + LRI[1][1] * y[5];
    } else {
      for (var r = 0; r < 3; r++) {
        out[2 * r] = LI[r][0] * y[0] + LI[r][1] * y[2] + LI[r][2] * y[4];
        out[2 * r + 1] = LI[r][0] * y[1] + LI[r][1] * y[3] + LI[r][2] * y[5];
      }
    }
    return out;
  }

  /* Run one start. o = {
       start: "yd" | "ydc" (closed transition) | "dol", load, k, J (total kg·m²), v (pu supply), ty (s), td (dead time s),
       order: "good" | "bad", trig: "time" | "current" | "speed", ith (×In line current for "current"), nth (pu of NN for "speed"),
       tmin (earliest changeover for current/speed triggers), tr (closed-transition resistor time s), rt (Ω per winding),
       th0 (deg, supply angle at t = 0), tend (s, default: until 98 % of the final speed + 0.4 s), dt, win: [t0,t1] dense window,
       winAuto: [pre, post] — dense window around the changeover (pre s before the contactors move, post s after reclosing) }
     Returns {tr: [[t, n, Irms_line, Te, iL1]], dense: [[t, iL1, iL2, iL3, Te, n]], m: metrics}. */
  function run(o) {
    var dt = o.dt || 1e-4, vpu = o.v == null ? 1 : o.v, J = o.J, k = o.k == null ? 1 : o.k, load = o.load || "quad";
    var td = o.td == null ? 0.05 : o.td, order = o.order || "good", trig = o.trig || "time", rt = o.rt == null ? 20 : o.rt;
    var th0 = (o.th0 || 0) * Math.PI / 180, tr = o.tr == null ? 0.06 : o.tr;
    var TL = function (n) { return loadT(load, n, k); };
    var nFinal = opPoint(TL, VP * vpu, 1);
    var y = [0, 0, 0, 0, 0, 0, 0], cu = [0, 0, 0, 0, 0, 0];
    var mode = o.start === "dol" ? "DOL" : "Y", tSw = null, tOpen = null, tClose = null, tR = null, Ifilt = 0;
    var t = 0, tend = o.tend || 60, tReach = null, st = { open: false, rs: R[0], vw: VW[mode] * vpu * Math.SQRT2, ang: ANG[mode] };
    var M = { nFinal: nFinal, IN: IN, TN: TN, NN: NN, I2t: 0, Ein: 0, Ecu1: 0, Ecu2: 0, Ert: 0, Eload: 0, pkEnv: 0, pkInst: 0, pkT: -1e9, mnT: 1e9,
      pkEnvSw: 0, pkInstSw: 0, pkTSw: -1e9, mnTSw: 1e9, pkEnvStart: 0, IyEnd: null, I2tSw: 0, lastHi: null };
    var trc = [], dense = [], win = o.win || null, lastRec = -1, wa = o.winAuto || null, ring = [];
    var dy = [0, 0, 0, 0, 0, 0, 0], k1 = dy.slice(), k2 = dy.slice(), k3 = dy.slice(), k4 = dy.slice(), yt = dy.slice();
    function setMode(m2) {
      var wasOpen = st.open;
      mode = m2; st.open = m2 === "O"; st.rs = R[0] + (m2 === "R" ? rt : 0);
      st.vw = (VW[m2] || 0) * vpu * Math.SQRT2; st.ang = order === "bad" && (m2 === "D" || m2 === "R") ? ANG.Dx : ANG[m2] || 0;
      if (wasOpen && !st.open) { // stator reconnects with is = 0: ψs from the rotor currents
        cur(y, true, cu);
        y[0] = L[0][1] * cu[2] + L[0][2] * cu[4]; y[1] = L[0][1] * cu[3] + L[0][2] * cu[5];
      }
    }
    function deriv(tt, yy, out) {
      var c = cur(yy, st.open, cu), wr = P * yy[6], n = yy[6] * 60 / TAU, Te = 0;
      if (!st.open) {
        var a = W50 * tt + th0 + st.ang;
        out[0] = st.vw * Math.cos(a) - st.rs * c[0]; out[1] = st.vw * Math.sin(a) - st.rs * c[1];
        Te = 1.5 * P * (yy[0] * c[1] - yy[1] * c[0]);
      } else {
        out[0] = 0; out[1] = 0;
      }
      out[2] = -R[1] * c[2] - wr * yy[3]; out[3] = -R[1] * c[3] + wr * yy[2];
      out[4] = -R[2] * c[4] - wr * yy[5]; out[5] = -R[2] * c[5] + wr * yy[4];
      var acc = (Te - TL(n)) / J;
      if (yy[6] <= 0 && acc < 0) acc = 0;
      out[6] = acc;
      return Te;
    }
    function lineVec(c) { // line current space vector
      if (mode === "Y") return [c[0], c[1]];
      if (mode === "O") return [0, 0];
      var a = st.ang === ANG.Dx ? -Math.PI / 6 : Math.PI / 6, ca = Math.cos(a), sa = Math.sin(a);
      return [S3 * (c[0] * ca - c[1] * sa), S3 * (c[0] * sa + c[1] * ca)];
    }
    function phases(v) {
      var c120 = -0.5, s120 = S3 / 2;
      return [v[0], v[0] * c120 + v[1] * s120, v[0] * c120 - v[1] * s120];
    }
    if (o.start === "dol") setMode("DOL");
    var steps = Math.ceil(tend / dt) + 1, prevN = 0;
    for (var it = 0; it < steps; it++) {
      // ---------------------------------------------------------- sequence logic
      var n = y[6] * 60 / TAU;
      if (o.start !== "dol") {
        if (mode === "Y") {
          var go = false;
          if (trig === "time") go = t >= o.ty;
          else if (trig === "current") go = t >= (o.tmin || 0.5) && Ifilt <= o.ith * IN || t >= (o.tmax || o.ty || 30);
          else go = t >= (o.tmin || 0.2) && n >= o.nth * NN || t >= (o.tmax || o.ty || 30);
          if (go) {
            tSw = t; M.nSw = n; M.IyEnd = Ifilt;
            if (o.start === "ydc") { setMode("R"); tR = t; } else { setMode("O"); tOpen = t; }
          }
        } else if (mode === "O" && t >= tOpen + td - 1e-12) {
          // residual voltage across winding U = dψs/dt from the rotor branch currents, just before reclosing
          cur(y, true, cu);
          var d2 = -R[1] * cu[2] - P * y[6] * y[3], d3 = -R[1] * cu[3] + P * y[6] * y[2], d4 = -R[2] * cu[4] - P * y[6] * y[5], d5 = -R[2] * cu[5] + P * y[6] * y[4];
          var di = [LRI[0][0] * d2 + LRI[0][1] * d4, LRI[0][0] * d3 + LRI[0][1] * d5, LRI[1][0] * d2 + LRI[1][1] * d4, LRI[1][0] * d3 + LRI[1][1] * d5];
          var e = [L[0][1] * di[0] + L[0][2] * di[2], L[0][1] * di[1] + L[0][2] * di[3]];
          var ang = (order === "bad" ? ANG.Dx : ANG.D), va = W50 * t + th0 + ang;
          M.eRes = Math.hypot(e[0], e[1]) / Math.SQRT2; // rms V per winding
          var ph = Math.atan2(e[1], e[0]) - va; ph = Math.atan2(Math.sin(ph), Math.cos(ph));
          M.phRes = ph * 180 / Math.PI; // angle of the residual voltage relative to the new Δ winding voltage
          M.nClose = n; tClose = t; setMode("D");
        } else if (mode === "R" && t >= tR + tr - 1e-12) { M.nClose = n; tClose = t; setMode("D"); }
      }
      // ---------------------------------------------------------- measurements at t
      var Te = deriv(t, y, dy), c = cu, lv = lineVec(c), env = Math.hypot(lv[0], lv[1]) / Math.SQRT2;
      var ph3 = phases(lv), inst = Math.max(Math.abs(ph3[0]), Math.abs(ph3[1]), Math.abs(ph3[2]));
      Ifilt += (env - Ifilt) * Math.min(1, dt / 0.02);
      if (tReach == null && nFinal && n >= 0.98 * nFinal) tReach = t;
      var inRun = tReach == null || t <= tReach;
      if (env > 3 * IN && (o.start === "dol" ? t > 0 : tClose != null)) M.lastHi = t;
      if (inRun) {
        M.I2t += env * env * dt;
        if (tClose != null) M.I2tSw += env * env * dt;
        if (!st.open) {
          var a2 = W50 * t + th0 + st.ang;
          M.Ein += 1.5 * (st.vw * Math.cos(a2) * c[0] + st.vw * Math.sin(a2) * c[1]) * dt;
          M.Ecu1 += 1.5 * R[0] * (c[0] * c[0] + c[1] * c[1]) * dt;
          if (mode === "R") M.Ert += 1.5 * rt * (c[0] * c[0] + c[1] * c[1]) * dt;
        }
        M.Ecu2 += 1.5 * (R[1] * (c[2] * c[2] + c[3] * c[3]) + R[2] * (c[4] * c[4] + c[5] * c[5])) * dt;
        M.Eload += TL(n) * y[6] * dt;
      }
      if (t > 0.002) { M.pkEnv = Math.max(M.pkEnv, env); }
      M.pkInst = Math.max(M.pkInst, inst); M.pkT = Math.max(M.pkT, Te); M.mnT = Math.min(M.mnT, Te);
      if (tSw == null || mode === "DOL") M.pkEnvStart = Math.max(M.pkEnvStart, t > 0.002 ? env : 0);
      if (tClose != null && t <= tClose + 0.25) {
        M.pkEnvSw = Math.max(M.pkEnvSw, env); M.pkInstSw = Math.max(M.pkInstSw, inst);
        M.pkTSw = Math.max(M.pkTSw, Te); M.mnTSw = Math.min(M.mnTSw, Te);
      }
      if (tR != null && tClose == null) { M.pkEnvSw = Math.max(M.pkEnvSw, env); M.pkInstSw = Math.max(M.pkInstSw, inst); M.pkTSw = Math.max(M.pkTSw, Te); M.mnTSw = Math.min(M.mnTSw, Te); }
      if (t - lastRec >= (o.rec || 0.002) - 1e-12) { trc.push([t, n, env, Te, ph3[0]]); lastRec = t; }
      if (win && t >= win[0] && t <= win[1]) dense.push([t, ph3[0], ph3[1], ph3[2], Te, n]);
      if (wa) {
        var rowd = [t, ph3[0], ph3[1], ph3[2], Te, n];
        if (tSw == null) { ring.push(rowd); while (ring.length && ring[0][0] < t - wa[0]) ring.shift(); }
        else if (tClose == null || t <= tClose + wa[1]) { if (ring.length) { dense = ring; ring = []; } dense.push(rowd); }
      }
      if (tReach != null && t >= tReach + (o.tail == null ? 0.4 : o.tail) && (o.start === "dol" || tClose != null)) break;
      // ---------------------------------------------------------- RK4 step
      var h = dt, i;
      deriv(t, y, k1);
      for (i = 0; i < 7; i++) yt[i] = y[i] + 0.5 * h * k1[i];
      deriv(t + 0.5 * h, yt, k2);
      for (i = 0; i < 7; i++) yt[i] = y[i] + 0.5 * h * k2[i];
      deriv(t + 0.5 * h, yt, k3);
      for (i = 0; i < 7; i++) yt[i] = y[i] + h * k3[i];
      deriv(t + h, yt, k4);
      for (i = 0; i < 7; i++) y[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      if (y[6] < 0) y[6] = 0;
      if (st.open) { cur(y, true, cu); y[0] = L[0][1] * cu[2] + L[0][2] * cu[4]; y[1] = L[0][1] * cu[3] + L[0][2] * cu[5]; }
      prevN = n; t += h;
    }
    M.tSw = tSw; M.tClose = tClose; M.tReach = tReach; M.tEnd = t;
    M.tHigh = M.lastHi == null ? 0 : M.lastHi - (o.start === "dol" ? 0 : tClose);
    M.dnDead = M.nSw != null && M.nClose != null ? M.nSw - M.nClose : null;
    M.Ekin = 0.5 * J * Math.pow(TAU * (nFinal || 0) / 60, 2);
    M.ok = tReach != null;
    return { tr: trc, dense: dense, m: M };
  }

  /* ---------------------------------------------------------------- running permanently in Y or Δ at shaft power Psh (W) */
  function state(conn, Psh, vpu) {
    vpu = vpu == null ? 1 : vpu;
    var V = VP * vpu, sc = conn === "Y" ? 1 / 3 : 1, pfe = P_FE * vpu * vpu * sc;
    var pm = function (s) { return motor(s, V).T * sc * WS * (1 - s) - P_FW; };
    var bd = breakdown(V, sc), smax = 1 - bd.n / 1500;
    if (pm(smax) < Psh) return { ok: false, Tk: bd.T };
    var a = 1e-6, b = smax;
    for (var j = 0; j < 80; j++) { var m = (a + b) / 2; if (pm(m) < Psh) a = m; else b = m; }
    var s = (a + b) / 2, d = motor(s, V), I1 = C(d.I1.re * sc + pfe / (3 * V), d.I1.im * sc), I = cabs(I1);
    var Pin = d.Pin * sc + pfe, Pcu1 = d.Pcu1 * sc, Pcu2 = d.Pcu2 * sc;
    return { ok: true, conn: conn, s: s, n: 1500 * (1 - s), I: I, pf: I1.re / I, Pin: Pin, eta: Psh / Pin, Pcu1: Pcu1, Pcu2: Pcu2, Pfe: pfe, Pfw: P_FW,
      Ploss: Pin - Psh, T: (Psh + P_FW) / (WS * (1 - s)), Tk: bd.T, margin: bd.T / ((Psh + P_FW) / (WS * (1 - s))), Q: 3 * V * -I1.im };
  }
  /* shaft power where Pin(Y) = Pin(Δ) (bisection on 0.02–0.7 Pn) */
  function breakEven(vpu) {
    var f = function (x) { var y = state("Y", x * PN, vpu), d = state("D", x * PN, vpu); return y.ok ? y.Pin - d.Pin : 1; };
    var a = 0.02, b = 0.7;
    if (f(a) > 0) return null;
    for (var j = 0; j < 60; j++) { var m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
    return (a + b) / 2;
  }

  /* ---------------------------------------------------------------- timer recommendation (quasi-static, 100 % and 90 % voltage) */
  function recommend(load, k, J) {
    var r100 = runupQS({ conn: "Y", load: load, k: k, J: J, v: 1 }), r90 = runupQS({ conn: "Y", load: load, k: k, J: J, v: 0.9 });
    var D = opPoint(function (n) { return loadT(load, n, k); }, VP, 1);
    var out = { r100: r100, r90: r90, nD: D };
    if (!r100.ok || !r100.nEq || r100.nEq < 0.8 * NN) { out.ok = false; out.why = r100.ok ? "low" : "stall"; return out; }
    out.ok = true;
    out.t95 = r100.t95; out.t98 = r100.t98; out.t95v90 = r90.ok ? r90.t95 : null;
    var base = Math.max(r100.t98 * 1.2, r90.ok && r90.nEq > 0.8 * NN ? r90.t95 : 0);
    out.tset = Math.max(1, Math.ceil((base - 0.05) * 2) / 2); // round up to 0.5 s with a 0.05 s tolerance
    out.IjumpSS = motor(1 - r100.nEq / 1500).I / IN; // steady Δ current at the star equilibrium speed (×In)
    out.weak90 = !(r90.ok && r90.nEq > 0.8 * NN);
    return out;
  }

  return { VP: VP, MP: MP, SR: SR, P_FE: P_FE, P_FW: P_FW, JM: JM, PN: PN, IN: IN, TN: TN, NN: NN, WN: WN, LOADS: LOADS,
    motor: motor, loadT: loadT, opPoint: opPoint, breakdown: breakdown, runupQS: runupQS, run: run, state: state, breakEven: breakEven,
    recommend: recommend, _L: L, _R: R };
});
