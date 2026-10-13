/* Power electronics converter engine — switching-level (cycle-by-cycle) time-domain simulator for buck, boost,
   inverting buck-boost and Cuk converters with battery / 50 Hz mains (transformer + bridge) / PV sources, R / constant-current /
   step loads, open-loop, voltage-mode PI, peak current mode with slope compensation and P&O MPPT. Also L/C design helpers.
   Used by assets/pe-lab.js (window.PESim) and testable in Node (require). Generated from a typed source, edit with care. */
var PESim = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var sim_exports = {};
  __export(sim_exports, {
    CHANNELS: () => CHANNELS,
    designCalc: () => designCalc,
    idealDuty: () => idealDuty,
    simulate: () => simulate
  });
  const CHANNELS = {
    vo: "Vout (V)",
    iL: "iL / iL1 (A)",
    iL2: "iL2 (A) [\u0106uk]",
    vin: "Vin bus (V)",
    vsw: "Switch node (V)",
    iin: "Iin converter (A)",
    is: "I source (A)",
    vref: "Vref (V)",
    d: "Duty / control",
    vc1: "VC1 (V) [\u0106uk]",
    gate: "Gate (0/1)"
  };
  const CH_KEYS = Object.keys(CHANNELS);
  function wave(w, f, t) {
    if (w === "off") return 0;
    const ph = t * f % 1;
    if (w === "square") return ph < 0.5 ? 1 : -1;
    if (w === "sine") return Math.sin(2 * Math.PI * ph);
    return ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph;
  }
  function idealDuty(topo, vin, vo) {
    if (vin <= 0) return 0;
    if (topo === "buck") return Math.min(vo / vin, 0.98);
    if (topo === "boost") return Math.max(0, 1 - vin / vo);
    return vo / (vin + vo);
  }
  function simulate(p) {
    const warn = [];
    const Ts = 1 / p.fs;
    let N = p.stepsPerPeriod;
    let totalSteps = Math.ceil(p.tsim / Ts * N);
    const MAX = 4e6;
    if (totalSteps > MAX) {
      N = Math.max(30, Math.floor(MAX * Ts / p.tsim));
      totalSteps = Math.ceil(p.tsim / Ts * N);
      warn.push(`\u0E25\u0E14\u0E04\u0E27\u0E32\u0E21\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E2B\u0E25\u0E37\u0E2D ${N} \u0E08\u0E38\u0E14/\u0E04\u0E32\u0E1A \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E23\u0E47\u0E27`);
    }
    const dt = Ts / N;
    const periods = Math.round(p.tsim / Ts);
    const tEnd = periods * Ts;
    const W = Math.min(p.window, tEnd);
    const tW0 = tEnd - W;
    const NB = 1500;
    const mn = {};
    const mx = {};
    const sum = {}, sq = {};
    const gmin = {}, gmax = {};
    for (const k of CH_KEYS) {
      mn[k] = new Float32Array(NB).fill(Infinity);
      mx[k] = new Float32Array(NB).fill(-Infinity);
      sum[k] = 0;
      sq[k] = 0;
      gmin[k] = Infinity;
      gmax[k] = -Infinity;
    }
    let cnt = 0, pinAcc = 0, poutAcc = 0, dcm = false;
    const vpk = p.vsecRms * Math.SQRT2;
    const n = 1.3, Vt = 0.02569;
    const iph = p.pvIsc * (p.pvG / 1e3);
    const i0 = p.pvIsc / (Math.exp(p.pvVoc / (n * p.pvNs * Vt)) - 1);
    const pvI = (v) => {
      const x = Math.min(v / (n * p.pvNs * Vt), 80);
      return Math.max(iph - i0 * (Math.exp(x) - 1), -5);
    };
    let vin = p.src === "battery" ? p.vbat : p.src === "rectifier" ? Math.max(vpk - 2 * p.vfBridge, 0) : p.pvVoc * 0.95;
    let iL = 0, iL2 = 0, vc = 0, vc1 = p.topo === "cuk" ? vin : 0;
    let integ = 0, d = p.ctrl === "open" || p.ctrl === "mppt" ? p.D : 0, ic = 0, on = false;
    let mpptK = 0, mpptN = Math.max(40, Math.round(4e-3 * p.fs)), mpptD = p.D, mpptP = 0, mpptAcc = 0, mpptCnt = 0, mpptDir = 1;
    const ssT = p.softStart ? 0.25 * tEnd : 0;
    for (let k = 0; k < totalSteps; k++) {
      const t = k * dt;
      const kp = k % N;
      const r = kp / N;
      let vrefNow = p.vref;
      if (ssT > 0 && t < ssT) vrefNow *= t / ssT;
      const fg = p.fgOffset + p.fgAmp * wave(p.fgWave, p.fgFreq, t);
      if (p.fgTarget === "ref") vrefNow += fg;
      const voM = vc;
      if (kp === 0) {
        if (p.ctrl === "vmc") {
          const e = vrefNow - voM;
          integ += p.ki * e * Ts;
          integ = Math.min(Math.max(integ, 0), p.dmax);
          d = Math.min(Math.max(p.kp * e + integ, 0), p.dmax);
        } else if (p.ctrl === "pcmc") {
          const e = vrefNow - voM;
          integ += p.ki * e * Ts;
          integ = Math.min(Math.max(integ, -2), 60);
          ic = Math.min(Math.max(p.kp * e + integ, 0), 60);
          on = true;
        } else if (p.ctrl === "mppt") {
          mpptCnt++;
          if (mpptCnt >= mpptN) {
            const P = mpptAcc / Math.max(mpptK, 1);
            if (P < mpptP) mpptDir = -mpptDir;
            mpptP = P;
            mpptD = Math.min(Math.max(mpptD + mpptDir * Math.max(0.01, 1.5 / N), 0.02), p.dmax);
            mpptAcc = 0;
            mpptK = 0;
            mpptCnt = 0;
          }
          d = mpptD;
        } else {
          d = p.D;
        }
        if (p.fgTarget === "duty" && p.ctrl === "open") d = Math.min(Math.max(p.D + fg, 0), p.dmax);
      }
      const iSense = p.topo === "cuk" ? iL + iL2 : iL;
      if (p.ctrl === "pcmc") {
        let m2 = 0;
        if (p.topo === "buck") m2 = Math.max(voM, 0.1) / p.L;
        else if (p.topo === "boost") m2 = Math.max(voM - vin, 0.1) / p.L;
        else if (p.topo === "buckboost") m2 = Math.max(voM, 0.1) / p.L;
        else m2 = Math.max(voM, 0.1) / p.L + Math.max(voM, 0.1) / p.L2;
        const ramp = p.slopeK * m2 * Ts * r;
        if (on && (iSense >= ic - ramp || r >= p.dmax)) on = false;
        d = ic;
      } else {
        on = r < d;
      }
      let io;
      const vo = Math.max(vc, 0);
      if (p.loadT === "R") io = vo / p.R;
      else if (p.loadT === "step") io = vo / (t > tEnd - 0.6 * W ? p.Rstep : p.R);
      else io = vo > 0.5 ? p.Icc : vo / 0.5 * p.Icc;
      let diL = 0, diL2 = 0, dvc = 0, dvc1 = 0, iin = 0, vsw = 0;
      const vdrop = (i) => p.ron * i;
      if (p.topo === "buck") {
        if (on) {
          diL = (vin - vdrop(iL) - vc - p.rL * iL) / p.L;
          iin = iL;
          vsw = vin - vdrop(iL);
        } else if (iL > 0) {
          diL = (-p.vf - vc - p.rL * iL) / p.L;
          vsw = -p.vf;
        } else {
          diL = 0;
          iL = 0;
          vsw = vc;
          dcm = dcm || t > tW0;
        }
        dvc = (iL - io) / p.C;
      } else if (p.topo === "boost") {
        iin = iL;
        if (on) {
          diL = (vin - vdrop(iL) - p.rL * iL) / p.L;
          dvc = -io / p.C;
          vsw = vdrop(iL);
        } else if (iL > 0) {
          diL = (vin - vc - p.vf - p.rL * iL) / p.L;
          dvc = (iL - io) / p.C;
          vsw = vc + p.vf;
        } else {
          diL = 0;
          iL = 0;
          dvc = -io / p.C;
          vsw = vin;
          dcm = dcm || t > tW0;
        }
      } else if (p.topo === "buckboost") {
        if (on) {
          diL = (vin - vdrop(iL) - p.rL * iL) / p.L;
          dvc = -io / p.C;
          iin = iL;
          vsw = vin;
        } else if (iL > 0) {
          diL = (-vc - p.vf - p.rL * iL) / p.L;
          dvc = (iL - io) / p.C;
          vsw = -(vc + p.vf);
        } else {
          diL = 0;
          iL = 0;
          dvc = -io / p.C;
          vsw = 0;
          dcm = dcm || t > tW0;
        }
      } else {
        iin = iL;
        if (on) {
          diL = (vin - vdrop(iL + iL2) - p.rL * iL) / p.L;
          dvc1 = -iL2 / p.C1;
          diL2 = (vc1 - vdrop(iL + iL2) - vc - p.rL * iL2) / p.L2;
          vsw = vdrop(iL + iL2);
        } else {
          diL = (vin - vc1 - p.vf - p.rL * iL) / p.L;
          dvc1 = iL / p.C1;
          diL2 = (-vc - p.vf - p.rL * iL2) / p.L2;
          vsw = vc1 + p.vf;
        }
        dvc = (iL2 - io) / p.C;
      }
      let is = 0;
      if (p.src === "battery") is = (p.vbat - vin) / p.rbat;
      else if (p.src === "rectifier") {
        const vs = vpk * Math.abs(Math.sin(2 * Math.PI * p.fline * t));
        is = Math.max(0, (vs - 2 * p.vfBridge - vin) / p.rTx);
      } else is = pvI(vin);
      const dvin = (is - iin) / p.cin;
      iL += diL * dt;
      iL2 += diL2 * dt;
      vc += dvc * dt;
      vc1 += dvc1 * dt;
      vin += dvin * dt;
      if (p.topo !== "cuk" && iL < 0 && !on) iL = 0;
      if (vin < 0) vin = 0;
      if (p.ctrl === "mppt" && mpptCnt >= mpptN / 2) { mpptAcc += vin * is; mpptK++; } // panel-side power, settled half only
      if (t >= tW0) {
        const icap = p.topo === "buck" ? iL - io : p.topo === "cuk" ? iL2 - io : dvc * p.C;
        const voMeas = vc + p.rC * icap;
        const b = Math.min(NB - 1, Math.floor((t - tW0) / W * NB));
        const vals = {
          vo: voMeas,
          iL,
          iL2,
          vin,
          vsw,
          iin,
          is,
          vref: vrefNow,
          d: p.ctrl === "pcmc" ? ic : d,
          vc1,
          gate: on ? 1 : 0
        };
        for (const c of CH_KEYS) {
          const v = vals[c];
          if (v < mn[c][b]) mn[c][b] = v;
          if (v > mx[c][b]) mx[c][b] = v;
          sum[c] += v;
          sq[c] += v * v;
          if (v < gmin[c]) gmin[c] = v;
          if (v > gmax[c]) gmax[c] = v;
        }
        pinAcc += vin * iin;
        poutAcc += vo * io;
        cnt++;
      }
    }
    for (const c of CH_KEYS) for (let b = 0; b < NB; b++) if (!isFinite(mn[c][b])) {
      mn[c][b] = b > 0 ? mn[c][b - 1] : 0;
      mx[c][b] = b > 0 ? mx[c][b - 1] : 0;
    }
    const stats = {};
    for (const c of CH_KEYS) stats[c] = {
      mean: sum[c] / cnt,
      min: gmin[c],
      max: gmax[c],
      rms: Math.sqrt(sq[c] / cnt)
    };
    const pin = pinAcc / cnt, pout = poutAcc / cnt;
    if (p.src === "rectifier" && p.vmainsRms > 0 && p.vsecRms > 60) warn.push("\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E40\u0E01\u0E34\u0E19 60 V \u2014 \u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E09\u0E19\u0E27\u0E19/\u0E1F\u0E34\u0E27\u0E2A\u0E4C/\u0E44\u0E2D\u0E42\u0E0B\u0E40\u0E25\u0E0A\u0E31\u0E19");
    if (stats.vo.max > 200) warn.push("Vout \u0E2A\u0E39\u0E07\u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34 \u2014 \u0E15\u0E23\u0E27\u0E08 duty/\u0E42\u0E2B\u0E25\u0E14 (boost \u0E44\u0E23\u0E49\u0E42\u0E2B\u0E25\u0E14 = \u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22)");
    return { n: NB, mn, mx, window: W, stats, pin, pout, eff: pin > 0 ? pout / pin : 0, dcm, steps: totalSteps, warn };
  }
  function designCalc(topo, vin, vo, io, fs, ripI, ripV) {
    const D = idealDuty(topo, vin, vo);
    if (topo === "buck") {
      const dI2 = ripI * io;
      const L2 = (vin - vo) * D / (fs * dI2);
      return { D, IL: io, L: L2, C: dI2 / (8 * fs * ripV * vo), ipk: io + dI2 / 2, irms: Math.sqrt(io * io + dI2 * dI2 / 12) };
    }
    const IL = topo === "cuk" ? io * D / (1 - D) : io / (1 - D);
    const dI = ripI * IL;
    const L = vin * D / (fs * dI);
    const C = io * D / (fs * ripV * vo);
    const base = { D, IL, L, C, ipk: IL + dI / 2, irms: Math.sqrt(IL * IL + dI * dI / 12) };
    if (topo === "cuk") {
      const L2 = vin * D / (fs * ripI * io);
      const C1 = io * D / (fs * 0.05 * (vin + vo));
      const Cout = ripI * io / (8 * fs * ripV * vo);
      return { ...base, L2, C1, C: Cout };
    }
    return base;
  }
  return __toCommonJS(sim_exports);
})();

if (typeof module !== "undefined" && module.exports) module.exports = PESim;
if (typeof window !== "undefined") window.PESim = PESim;
