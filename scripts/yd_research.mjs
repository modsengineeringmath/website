// Numerical experiments for /learn/motor-control/star-delta-analysis/ (+ English edition) and /blog/star-delta-timer-setting/.
// Usage: node scripts/yd_research.mjs            runs every experiment, prints the tables, writes scripts/yd_results.json
//        node scripts/yd_research.mjs E2 E3      runs only the named experiments (JSON is not rewritten)
// Engine: assets/yd-core.js (the same code the in-page lab runs). Figures: python3 scripts/yd_figs.py reads yd_results.json.
// Motor: 7.5 kW 4-pole 400 V Δ 50 Hz double cage (scripts/acm_model.py): In 14.0 A, Tn 49.3 N·m, 1471 rpm, Is/In 6.5, Ts/Tn 2.15, Tk/Tn 3.0.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tmp = path.join(os.tmpdir(), "yd-core-" + process.pid + ".cjs");
fs.copyFileSync(path.join(ROOT, "assets/yd-core.js"), tmp);
const Y = createRequire(import.meta.url)(tmp);
fs.unlinkSync(tmp);

const { IN, TN, NN, JM } = Y;
const r2 = (v, d = 2) => (v == null || !isFinite(v) ? null : Number(v.toFixed(d)));
const only = process.argv.slice(2).filter((a) => /^E\d+$/.test(a));
const want = (k) => !only.length || only.includes(k);
const OUT = { motor: { IN: r2(IN, 3), TN: r2(TN, 3), NN: r2(NN, 1), Is: r2(Y.motor(1).I / IN, 3), Ts: r2(Y.motor(1).T / TN, 3) } };
const table = (title, head, rows) => {
  console.log("\n## " + title);
  console.log(head.join(" | "));
  rows.forEach((r) => console.log(r.map((v) => (v == null ? "—" : v)).join(" | ")));
};

// Representative cases (7.5 kW model; J total = motor 0.045 + load)
const CASES = {
  pump: { load: "quad", k: 0.8, J: JM + 0.06, th: "ปั๊มหอยโข่ง 80 %", en: "Centrifugal pump 80 %" },
  fan: { load: "fan", k: 1.0, J: JM + 2.2, th: "พัดลมใหญ่ J 2.245", en: "Large fan J 2.245" },
  conv: { load: "const", k: 0.5, J: JM + 0.35, th: "สายพาน 50 %", en: "Conveyor 50 %" },
};
OUT.cases = CASES;
const bd = Y.breakdown(Y.VP), bdY = Y.breakdown(Y.VP, 1 / 3);
OUT.motor.Tk = r2(bd.T / TN, 3); OUT.motor.nk = bd.n; OUT.motor.TkY = r2(bdY.T / TN, 3);
OUT.motor.sk = r2(1 - bd.n / 1500, 4);
console.log(`motor: In ${IN.toFixed(2)} A, Tn ${TN.toFixed(2)} N·m, Is/In ${(Y.motor(1).I / IN).toFixed(2)}, Ts/Tn ${(Y.motor(1).T / TN).toFixed(2)}, Tk/Tn ${(bd.T / TN).toFixed(2)} at ${bd.n} rpm, star Tk/Tn ${(bdY.T / TN).toFixed(2)}`);

// ------------------------------------------------------------------ E1 star run-up and star equilibrium (quasi-static + dynamic)
if (want("E1")) {
  const rows = [], res = {};
  for (const [key, c] of Object.entries(CASES)) {
    const q = Y.runupQS({ conn: "Y", load: c.load, k: c.k, J: c.J });
    const nY = q.nEq, sY = 1 - nY / 1500;
    const IYeq = Y.motor(sY).I / 3, IDjump = Y.motor(sY).I;
    const qd = Y.runupQS({ conn: "D", load: c.load, k: c.k, J: c.J });
    const nD = qd.nEq, ID = Y.motor(1 - nD / 1500).I;
    res[key] = { nY: r2(nY, 1), nYpu: r2(nY / NN, 4), sY: r2(sY * 100, 2), sD: r2((1 - nD / 1500) * 100, 2), IYeq: r2(IYeq / IN, 3), IDjump: r2(IDjump / IN, 3), ID: r2(ID / IN, 3),
      t90: r2(q.t90), t95: r2(q.t95), t98: r2(q.t98), tDOL98: r2(qd.t98, 3), ErY: r2(q.Er / 1000, 2), pts: q.pts.filter((p, i) => i % 2 === 0).map((p) => [r2(p[0], 2), r2(p[1], 1), r2(p[2] / IN, 3)]) };
    rows.push([c.en, nY.toFixed(0) + " rpm", (nY / NN * 100).toFixed(1) + " %", (sY * 100).toFixed(2) + " %", (IYeq / IN).toFixed(2), (IDjump / IN).toFixed(2), q.t90.toFixed(2), q.t95.toFixed(2), q.t98.toFixed(2), qd.t98.toFixed(2)]);
  }
  OUT.E1 = res;
  table("E1 star run-up (quasi-static)", ["case", "n_Y", "n_Y/n_N", "s_Y", "I_Y/In", "I_Δ(n_Y)/In", "t90", "t95", "t98", "DOL t98"], rows);
}

// ------------------------------------------------------------------ E2 timer sweep (dynamic, dead time 50 ms, good order)
const sweep = (c, tys, extra = {}) => tys.map((ty) => {
  const r = Y.run(Object.assign({ start: "yd", load: c.load, k: c.k, J: c.J, ty, td: 0.05, order: "good" }, extra));
  const m = r.m;
  return { ty, nSw: r2(m.nSw / NN, 4), pk: r2(m.pkEnvSw / IN, 3), tHigh: r2(m.tHigh, 3), I2tSw: r2(m.I2tSw, 0), inst: r2(m.pkInstSw / (Math.SQRT2 * IN), 3), Tmax: r2(m.pkTSw / TN, 3), Tmin: r2(m.mnTSw / TN, 3),
    tReach: r2(m.tReach, 3), I2t: r2(m.I2t, 0), Er: r2(m.Ecu2 / 1000, 3), Ein: r2(m.Ein / 1000, 2), dn: r2(m.dnDead, 1), eRes: r2(m.eRes, 1), ph: r2(m.phRes, 1) };
});
const dol = (c, extra = {}) => {
  const m = Y.run(Object.assign({ start: "dol", load: c.load, k: c.k, J: c.J }, extra)).m;
  return { pk: r2(m.pkEnv / IN, 3), tHigh: r2(m.tHigh, 3), inst: r2(m.pkInst / (Math.SQRT2 * IN), 3), Tmax: r2(m.pkT / TN, 3), Tmin: r2(m.mnT / TN, 3), tReach: r2(m.tReach, 3), I2t: r2(m.I2t, 0), Er: r2(m.Ecu2 / 1000, 3), Ein: r2(m.Ein / 1000, 2) };
};
if (want("E2")) {
  OUT.E2 = {};
  const grids = { pump: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1, 1.2, 1.5, 2, 3, 5], fan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30], conv: [0.3, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5] };
  for (const key of Object.keys(CASES)) {
    const c = CASES[key], D = dol(c), S = sweep(c, grids[key]);
    OUT.E2[key] = { dol: D, sweep: S };
    table(`E2 timer sweep — ${c.en} (DOL: env ${D.pk}·In, >3In ${D.tHigh} s, inst ${D.inst}·√2In, Tmax ${D.Tmax}, t98 ${D.tReach} s, I²t ${D.I2t} A²s, Er ${D.Er} kJ)`,
      ["t_Y s", "n_sw/n_N", "env pk/In", "t>3In s", "I²t after", "inst/√2In", "Tmax/Tn", "Tmin/Tn", "t98 s", "I²t A²s", "Er kJ", "Δn dead", "e_res V", "∠ deg"],
      S.map((s) => [s.ty, s.nSw, s.pk, s.tHigh, s.I2tSw, s.inst, s.Tmax, s.Tmin, s.tReach, s.I2t, s.Er, s.dn, s.eRes, s.ph]));
  }
}

// ------------------------------------------------------------------ E3 dead-time sweep at a well-set timer, both phase orders
if (want("E3")) {
  OUT.E3 = {};
  const tds = [0.005, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.5, 0.8];
  const TY = { pump: 1.5, fan: 15, conv: 5 };
  for (const key of Object.keys(CASES)) {
    const c = CASES[key], rows = [], out = { ty: TY[key], good: [], bad: [] };
    for (const td of tds) {
      const g = Y.run({ start: "yd", load: c.load, k: c.k, J: c.J, ty: TY[key], td, order: "good" }).m;
      const b = Y.run({ start: "yd", load: c.load, k: c.k, J: c.J, ty: TY[key], td, order: "bad" }).m;
      const f = (m) => ({ td, pk: r2(m.pkEnvSw / IN, 3), Tmax: r2(m.pkTSw / TN, 3), Tmin: r2(m.mnTSw / TN, 3), dn: r2(m.dnDead, 1), dnpu: r2(m.dnDead / NN * 100, 2), eRes: r2(m.eRes, 1), ePu: r2(m.eRes / 400, 3), ph: r2(m.phRes, 1) });
      out.good.push(f(g)); out.bad.push(f(b));
      rows.push([td * 1000, f(g).pk, f(b).pk, f(g).Tmax, f(g).Tmin, f(b).Tmin, f(g).dn, f(g).ePu, f(g).ph, f(b).ph]);
    }
    OUT.E3[key] = out;
    table(`E3 dead time — ${c.en}, t_Y ${TY[key]} s`, ["t_d ms", "pk good/In", "pk wrong/In", "Tmax good", "Tmin good", "Tmin wrong", "Δn rpm", "e_res/400V", "∠ good", "∠ wrong"], rows);
  }
}

// ------------------------------------------------------------------ E4 closed transition: resistor value and transition time
if (want("E4")) {
  OUT.E4 = {};
  const Zb = 400 / (IN / Math.sqrt(3)); // winding base impedance at rated current
  OUT.E4.Zb = r2(Zb, 2);
  for (const key of ["pump", "fan"]) {
    const c = CASES[key], ty = key === "pump" ? 1.5 : 12, rows = [], out = [];
    const open = Y.run({ start: "yd", load: c.load, k: c.k, J: c.J, ty, td: 0.05 }).m;
    for (const rpu of [0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 1.0, 1.5]) {
      const m = Y.run({ start: "ydc", load: c.load, k: c.k, J: c.J, ty, rt: rpu * Zb, tr: 0.06 }).m;
      const o2 = { rpu, rt: r2(rpu * Zb, 1), pk: r2(m.pkEnvSw / IN, 3), Tmax: r2(m.pkTSw / TN, 3), Tmin: r2(m.mnTSw / TN, 3), Ert: r2(m.Ert / 1000, 3) };
      out.push(o2); rows.push([rpu, o2.rt, o2.pk, o2.Tmax, o2.Tmin, o2.Ert]);
    }
    OUT.E4[key] = { open: { pk: r2(open.pkEnvSw / IN, 3), Tmax: r2(open.pkTSw / TN, 3), Tmin: r2(open.mnTSw / TN, 3) }, closed: out };
    table(`E4 closed transition — ${c.en} (open 50 ms: pk ${r2(open.pkEnvSw / IN, 2)}·In, T ${r2(open.mnTSw / TN, 2)}…${r2(open.pkTSw / TN, 2)}·Tn; Zb ${Zb.toFixed(1)} Ω)`, ["Rt/Zb", "Rt Ω", "pk/In", "Tmax", "Tmin", "E_Rt kJ"], rows);
  }
}

// ------------------------------------------------------------------ E5 changeover trigger: timer vs current relay vs speed, under changed conditions
if (want("E5")) {
  OUT.E5 = [];
  const rows = [];
  const scen = [
    ["pump nominal", { load: "quad", k: 0.8, J: JM + 0.06, v: 1 }],
    ["pump 90 % V", { load: "quad", k: 0.8, J: JM + 0.06, v: 0.9 }],
    ["pump + heavy impeller J×3", { load: "quad", k: 0.8, J: JM + 0.18, v: 1 }],
    ["fan nominal", { load: "fan", k: 1, J: JM + 2.2, v: 1 }],
    ["fan 90 % V", { load: "fan", k: 1, J: JM + 2.2, v: 0.9 }],
    ["fan, damper open k 1.15", { load: "fan", k: 1.15, J: JM + 2.2, v: 1 }],
  ];
  for (const [name, s] of scen) {
    const tim = Y.run(Object.assign({ start: "yd", ty: s.load === "fan" ? 10 : 1.5, td: 0.05 }, s)).m;
    const cr = Y.run(Object.assign({ start: "yd", trig: "current", ith: 1.25, tmin: 0.3, tmax: 40, td: 0.05 }, s)).m;
    const sp = Y.run(Object.assign({ start: "yd", trig: "speed", nth: 0.9, tmin: 0.2, tmax: 40, td: 0.05 }, s)).m;
    const q = Y.runupQS(Object.assign({ conn: "Y" }, s));
    const f = (m) => ({ t: r2(m.tSw, 2), n: r2(m.nSw / NN, 4), pk: r2(m.pkEnvSw / IN, 3), tHigh: r2(m.tHigh, 3), I2tSw: r2(m.I2tSw, 0), Ich: r2(m.IyEnd / IN, 3) });
    const o = { name, nY: r2(q.nEq / NN, 4), okY: q.ok, timer: f(tim), current: f(cr), speed: f(sp) };
    OUT.E5.push(o);
    const g = (x) => `${x.t}s/${x.n}/${x.pk}/${x.tHigh}s/${x.I2tSw}`;
    rows.push([name, o.nY, g(o.timer), g(o.current), g(o.speed)]);
  }
  table("E5 changeover trigger (t / n_sw/n_N / pk/In / time >3In after / I²t after) — timer 1.5 s (pump) or 10 s (fan), current relay < 1.25·In, speed ≥ 0.9 n_N", ["scenario", "n_Y eq", "fixed timer", "current relay", "speed switch"], rows);
}

// ------------------------------------------------------------------ E6 supply voltage: star equilibrium speed and run-up time
if (want("E6")) {
  OUT.E6 = {};
  const vs = [1.05, 1.0, 0.95, 0.9, 0.85, 0.8];
  for (const key of Object.keys(CASES)) {
    const c = CASES[key], rows = [], out = [];
    for (const v of vs) {
      const q = Y.runupQS({ conn: "Y", load: c.load, k: c.k, J: c.J, v });
      const sY = q.nEq ? 1 - q.nEq / 1500 : null;
      const o = q.ok ? { v, nY: r2(q.nEq / NN, 4), t95: r2(q.t95), t98: r2(q.t98), jump: r2(Y.motor(sY, Y.VP * v).I / IN, 3), ok: true } : { v, ok: false, nY: null, t95: null, t98: null, jump: null };
      out.push(o); rows.push([v * 100 + " %", o.ok ? o.nY : "stall (breakaway)", o.t95, o.t98, o.jump]);
    }
    OUT.E6[key] = out;
    table(`E6 supply voltage — ${c.en}`, ["V", "n_Y/n_N", "t95 s", "t98 s", "I_Δ(n_Y)/In"], rows);
  }
}

// ------------------------------------------------------------------ E7 largest load a star start can bring to ≥ 85 / 90 / 95 % speed
if (want("E7")) {
  OUT.E7 = {};
  const rows = [];
  for (const load of ["quad", "lin", "const"]) {
    const res = {};
    for (const target of [0.85, 0.9, 0.95]) {
      let a = 0.05, b = 1.5;
      for (let j = 0; j < 40; j++) {
        const m = (a + b) / 2, n = Y.opPoint((x) => Y.loadT(load, x, m), Y.VP, 1 / 3);
        // a start must also break away: T_Y(0) > T_L(0)
        const okStart = Y.motor(1).T / 3 > Y.loadT(load, 0, m);
        if (n && okStart && n >= target * NN) a = m; else b = m;
      }
      res[target] = r2(a, 3);
    }
    OUT.E7[load] = res;
    rows.push([load, res[0.85], res[0.9], res[0.95]]);
  }
  table("E7 max load fraction k (of Tn at rated speed) for star equilibrium ≥ x·n_N", ["load", "≥ 85 %", "≥ 90 %", "≥ 95 %"], rows);
}

// ------------------------------------------------------------------ E8 inertia: star time vs J (fan law load), Kloss estimate vs numeric
if (want("E8")) {
  const Js = [0.1, 0.25, 0.5, 1, 2, 3, 5, 8];
  const sk = 1 - bd.n / 1500, Tk = bd.T, ws = 2 * Math.PI * 25;
  const kloss = (J, Tkx, se) => (J * ws / Tkx) * ((1 - se * se) / (4 * sk) + (sk / 2) * Math.log(1 / se));
  const rows = [], out = [];
  for (const J of Js) {
    const q0 = Y.runupQS({ conn: "Y", load: "fan", k: 0.01, J });         // ≈ no load: compare with the Kloss closed form
    const q = Y.runupQS({ conn: "Y", load: "fan", k: 1, J });
    const qd = Y.runupQS({ conn: "D", load: "fan", k: 1, J });
    const se0 = 1 - 0.98 * q0.nEq / 1500;
    // average-torque method: t ≈ J·Δω / mean(T_Y − T_L) over 0 … 0.98·n_eq (100 speed points)
    let acc = 0; const nE = 0.98 * q0.nEq;
    for (let i = 0; i < 100; i++) { const n = (i + 0.5) * nE / 100; acc += Y.motor(1 - n / 1500).T / 3 - Y.loadT("fan", n, 0.01); }
    const tAvg = J * (2 * Math.PI * nE / 60) / (acc / 100);
    const o = { J, t98noload: r2(q0.t98), kloss: r2(kloss(J, Tk / 3, se0)), avgT: r2(tAvg), t95: r2(q.t95), t98: r2(q.t98), tD: r2(qd.t98), ErY: r2(q.Er / 1000, 2), ErD: r2(qd.Er / 1000, 2), Ek: r2(0.5 * J * Math.pow(2 * Math.PI * q.nEq / 60, 2) / 1000, 2) };
    out.push(o); rows.push([J, o.t98noload, o.kloss, o.avgT, o.t95, o.t98, o.tD, o.ErY, o.Ek]);
  }
  OUT.E8 = out;
  table("E8 inertia sweep (fan load k = 1) — star run-up time; no-load numeric vs Kloss closed form vs average torque", ["J kg·m²", "no-load t98 (num)", "Kloss", "avg torque", "fan t95", "fan t98", "DOL t98", "Er star-stage kJ", "½Jω² kJ"], rows);
}

// ------------------------------------------------------------------ E9 running permanently in Y vs Δ at part load
if (want("E9")) {
  const rows = [], out = [];
  for (const x of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.75, 1.0]) {
    const d = Y.state("D", x * Y.PN), y = Y.state("Y", x * Y.PN);
    const o = { x, D: { I: r2(d.I, 2), pf: r2(d.pf, 3), eta: r2(d.eta * 100, 2), Pin: r2(d.Pin, 0), loss: r2(d.Ploss, 0), cu1: r2(d.Pcu1, 0), cu2: r2(d.Pcu2, 0), fe: r2(d.Pfe, 0), n: r2(d.n, 1), Q: r2(d.Q, 0), margin: r2(d.margin, 2) } };
    if (y.ok) o.Y = { I: r2(y.I, 2), pf: r2(y.pf, 3), eta: r2(y.eta * 100, 2), Pin: r2(y.Pin, 0), loss: r2(y.Ploss, 0), cu1: r2(y.Pcu1, 0), cu2: r2(y.Pcu2, 0), fe: r2(y.Pfe, 0), n: r2(y.n, 1), Q: r2(y.Q, 0), margin: r2(y.margin, 2) };
    out.push(o);
    rows.push([x * 100 + " %", o.D.I, o.D.pf, o.D.eta, o.D.loss, o.Y ? o.Y.I : "—", o.Y ? o.Y.pf : "—", o.Y ? o.Y.eta : "stall", o.Y ? o.Y.loss : "—", o.Y ? o.D.Pin - o.Y.Pin : "—", o.Y ? o.Y.margin : "—", o.Y ? o.D.Q - o.Y.Q : "—"]);
  }
  const be = Y.breakEven(1);
  OUT.E9 = { rows: out, breakEven: r2(be, 4), breakEven95: r2(Y.breakEven(0.95), 4), breakEven105: r2(Y.breakEven(1.05), 4) };
  table(`E9 permanent Y vs Δ (break-even ${(be * 100).toFixed(1)} % of 7.5 kW; at 95 % V ${(Y.breakEven(0.95) * 100).toFixed(1)} %, 105 % V ${(Y.breakEven(1.05) * 100).toFixed(1)} %)`,
    ["P/Pn", "I_Δ A", "pf_Δ", "η_Δ %", "loss_Δ W", "I_Y A", "pf_Y", "η_Y %", "loss_Y W", "saving W", "Tk_Y/T", "ΔQ var"], rows);
}

// ------------------------------------------------------------------ E10 starting methods: current, time, energy (quasi-static) + dynamic DOL / Y-Δ
if (want("E10")) {
  OUT.E10 = {};
  for (const key of ["pump", "fan"]) {
    const c = CASES[key], rows = [], out = {};
    const ty = key === "pump" ? 1.5 : 12;
    const q = {
      dol: Y.runupQS({ conn: "D", load: c.load, k: c.k, J: c.J }),
      soft3: Y.runupQS({ conn: "soft", ilim: 3, tacc: 10, load: c.load, k: c.k, J: c.J }),
      vfd: Y.runupQS({ conn: "vfd", tacc: key === "pump" ? 5 : 30, load: c.load, k: c.k, J: c.J }),
    };
    const yq = Y.runupQS({ conn: "Y", load: c.load, k: c.k, J: c.J });
    const dynY = Y.run({ start: "yd", load: c.load, k: c.k, J: c.J, ty, td: 0.05 }).m, dynD = Y.run({ start: "dol", load: c.load, k: c.k, J: c.J }).m;
    for (const [nm, r] of Object.entries(q)) out[nm] = { Ipk: r2(r.Ipk / IN, 2), t: r2(r.t98, 2), Er: r2(r.Er / 1000, 2), Ein: r2(r.Ein / 1000, 1), I2t: r2(r.I2t, 0) };
    out.ydQS = { Ipk: r2(yq.Ipk / IN, 2), tY: r2(yq.t98, 2), ErY: r2(yq.Er / 1000, 2) };
    out.dynY = { pk: r2(dynY.pkEnvSw / IN, 2), pkStart: r2(dynY.pkEnvStart / IN, 2), t: r2(dynY.tReach, 2), Er: r2(dynY.Ecu2 / 1000, 2), Ein: r2(dynY.Ein / 1000, 1), I2t: r2(dynY.I2t, 0) };
    out.dynD = { pk: r2(dynD.pkEnv / IN, 2), t: r2(dynD.tReach, 2), Er: r2(dynD.Ecu2 / 1000, 2), Ein: r2(dynD.Ein / 1000, 1), I2t: r2(dynD.I2t, 0) };
    OUT.E10[key] = out;
    rows.push(["DOL (QS)", out.dol.Ipk, out.dol.t, out.dol.Er, out.dol.I2t]);
    rows.push(["DOL (dyn)", out.dynD.pk, out.dynD.t, out.dynD.Er, out.dynD.I2t]);
    rows.push([`Y-Δ ${ty}s (dyn)`, `${out.dynY.pkStart} / ${out.dynY.pk}`, out.dynY.t, out.dynY.Er, out.dynY.I2t]);
    rows.push(["soft 3·In (QS)", out.soft3.Ipk, out.soft3.t, out.soft3.Er, out.soft3.I2t]);
    rows.push(["VFD (QS)", out.vfd.Ipk, out.vfd.t, out.vfd.Er, out.vfd.I2t]);
    table(`E10 starting methods — ${c.en} (½Jω² = ${(0.5 * c.J * Math.pow(2 * Math.PI * NN / 60, 2) / 1000).toFixed(2)} kJ)`, ["method", "I peak/In (rms)", "t98 s", "rotor loss kJ", "I²t A²s"], rows);
  }
}

// ------------------------------------------------------------------ E11 supply angle at switch-on (instantaneous peaks), pump
if (want("E11")) {
  const c = CASES.pump, out = [];
  for (let th = 0; th < 180; th += 15) {
    const m = Y.run({ start: "yd", load: c.load, k: c.k, J: c.J, ty: 1.5, td: 0.05, th0: th }).m;
    const d = Y.run({ start: "dol", load: c.load, k: c.k, J: c.J, th0: th }).m;
    out.push({ th, ydStartInst: r2(m.pkInst / (Math.SQRT2 * IN), 3), ydSwInst: r2(m.pkInstSw / (Math.SQRT2 * IN), 3), ydSwEnv: r2(m.pkEnvSw / IN, 3), dolInst: r2(d.pkInst / (Math.SQRT2 * IN), 3) });
  }
  OUT.E11 = out;
  table("E11 switch-on angle (pump, t_Y 1.5 s): instantaneous peaks / (√2·In)", ["θ0 deg", "Y-Δ max inst", "at changeover", "changeover env/In", "DOL inst"], out.map((o) => [o.th, o.ydStartInst, o.ydSwInst, o.ydSwEnv, o.dolInst]));
}

// ------------------------------------------------------------------ E12 voltage dip at the point of common coupling (scaled motors)
if (want("E12")) {
  // ΔV ≈ S_motor/(S_sc + S_motor) with S_motor = √3·400·I (locked rotor, star, changeover envelope); same angle assumed.
  const out = [];
  const cases = [
    ["37 kW pump, 250 kVA transformer uk 4 %", 37, 250 / 0.04],
    ["37 kW pump, 100 kVA genset x″d 0.15", 37, 100 / 0.15],
    ["75 kW chiller pump, 500 kVA transformer uk 5 %", 75, 500 / 0.05],
    ["15 kW pump, 50 kVA genset x″d 0.15", 15, 50 / 0.15],
  ];
  const pump = OUT.E2 ? OUT.E2.pump : null;
  const swPk = pump ? pump.sweep.find((s) => s.ty === 1.5).pk : 9.7;
  for (const [name, P, Ssc] of cases) {
    const InP = IN * P / 7.5, kva = (pu) => Math.sqrt(3) * 400 * InP * pu / 1000;
    const dv = (pu) => r2(kva(pu) / (Ssc + kva(pu)) * 100, 1);
    out.push({ name, In: r2(InP, 1), Ssc: r2(Ssc, 0), dol: dv(Y.motor(1).I / IN), star: dv(Y.motor(1).I / IN / 3), sw: dv(swPk) });
  }
  OUT.E12 = out;
  table("E12 voltage dip (%) at the PCC — DOL locked rotor, star start, changeover envelope peak (1–2 cycles)", ["case", "In A", "S_sc kVA", "DOL", "star", "changeover"], out.map((o) => [o.name, o.In, o.Ssc, o.dol, o.star, o.sw]));
}

// ------------------------------------------------------------------ E13 timer chart in units of the mechanical time constant τm = J·ωs/Tn
if (want("E13")) {
  const ws = 2 * Math.PI * 25, tauOf = (J) => J * ws / TN, rows = [], out = [];
  const loads = [["quad", 0.6], ["quad", 0.8], ["quad", 1.0], ["fan", 1.0], ["lin", 0.6], ["lin", 0.8], ["const", 0.3], ["const", 0.5]];
  for (const [load, k] of loads) {
    const Jr = 1.0; // coefficients are almost independent of J (checked below), use J = 1 kg·m²
    const a = Y.runupQS({ conn: "Y", load, k, J: Jr }), b = Y.runupQS({ conn: "Y", load, k, J: Jr, v: 0.9 }), d = Y.runupQS({ conn: "D", load, k, J: Jr });
    const a2 = Y.runupQS({ conn: "Y", load, k, J: 4 * Jr });
    const tau = tauOf(Jr);
    const o = { load, k, nY: a.ok ? r2(a.nEq / NN, 4) : null, c95: a.ok ? r2(a.t95 / tau, 3) : null, c98: a.ok ? r2(a.t98 / tau, 3) : null,
      c95v90: b.ok && b.nEq > 0.8 * NN ? r2(b.t95 / tau, 3) : null, c98v90: b.ok && b.nEq > 0.8 * NN ? r2(b.t98 / tau, 3) : null, cD: r2(d.t98 / tau, 3),
      check4J: a.ok ? r2(a2.t98 / (4 * tau), 3) : null, cset: null };
    if (a.ok) o.cset = r2(Math.max(1.2 * o.c98, o.c95v90 || 0), 2);
    out.push(o); rows.push([load + " " + k, o.nY, o.cD, o.c95, o.c98, o.c95v90 || "low/stall", o.cset, o.check4J]);
  }
  OUT.E13 = { tauMotor: r2(tauOf(JM), 4), rows: out };
  table(`E13 timer coefficient c = t/τm, τm = J·ωs/Tn (motor alone τm = ${tauOf(JM).toFixed(3)} s)`, ["load k", "n_Y/n_N", "DOL t98/τm", "Y t95/τm", "Y t98/τm", "Y t95/τm @90 %V", "c_set", "t98/τm with 4·J"], rows);
}

// ------------------------------------------------------------------ E14 overload relay thermal budget of one start (relay in the winding branch, Ir = In/√3)
if (want("E14")) {
  // budget = ∫(I_relay/Ir)² dt ÷ (7.2² · t_class): ≥ 1 means a cold class-N relay may trip during the start (adiabatic estimate)
  const rows = [], out = [];
  const scen = [
    ["pump Y-Δ 1.5 s", { start: "yd", load: "quad", k: 0.8, J: JM + 0.06, ty: 1.5 }],
    ["pump DOL", { start: "dol", load: "quad", k: 0.8, J: JM + 0.06 }],
    ["fan Y-Δ 15 s", { start: "yd", load: "fan", k: 1, J: JM + 2.2, ty: 15 }],
    ["fan Y-Δ 25 s, 90 % V", { start: "yd", load: "fan", k: 1, J: JM + 2.2, ty: 25, v: 0.9 }],
    ["fan Y-Δ 30 s", { start: "yd", load: "fan", k: 1, J: JM + 2.2, ty: 30 }],
    ["fan DOL", { start: "dol", load: "fan", k: 1, J: JM + 2.2 }],
    ["conveyor 50 % Y-Δ 5 s", { start: "yd", load: "const", k: 0.5, J: JM + 0.35, ty: 5 }],
  ];
  for (const [name, o] of scen) {
    const r = Y.run(Object.assign({ td: 0.05, rec: 0.002 }, o));
    let x2 = 0, prev = null, tc = r.m.tClose;
    for (const p of r.tr) {
      if (prev) {
        const dt = p[0] - prev[0], I = p[2];
        // relay current / setting: star or open → line current / (In/√3); delta → (I/√3)/(In/√3) = I/In; DOL relay set at In
        const inDelta = o.start === "dol" || (tc != null && p[0] >= tc);
        const ratio = o.start === "dol" ? I / IN : inDelta ? I / IN : I / (IN / Math.sqrt(3));
        x2 += ratio * ratio * dt;
      }
      prev = p;
    }
    const b10 = x2 / (7.2 * 7.2 * 10), b20 = x2 / (7.2 * 7.2 * 20), b30 = x2 / (7.2 * 7.2 * 30);
    const o2 = { name, x2: r2(x2, 0), b10: r2(b10 * 100, 0), b20: r2(b20 * 100, 0), b30: r2(b30 * 100, 0), t: r2(r.m.tReach, 2) };
    out.push(o2); rows.push([name, o2.t, o2.x2, o2.b10 + " %", o2.b20 + " %", o2.b30 + " %"]);
  }
  OUT.E14 = out;
  table("E14 overload-relay thermal budget of one cold start (adiabatic, ∫(I/Ir)²dt ÷ 7.2²·t_class)", ["start", "t98 s", "∫(I/Ir)² dt", "class 10", "class 20", "class 30"], rows);
}

// ------------------------------------------------------------------ T traces for the figures (decimated)
if (want("T")) {
  const dec = (tr, step, f) => { const o = []; let last = -1; for (const p of tr) if (p[0] - last >= step - 1e-9) { o.push(f(p)); last = p[0]; } return o; };
  const env = (r) => dec(r.tr, 0.02, (p) => [r2(p[0], 3), r2(p[1], 1), r2(p[2] / IN, 3), r2(p[3] / TN, 3)]);
  const T = {};
  const fanC = CASES.fan, pumpC = CASES.pump;
  for (const ty of [8, 20]) {
    const r = Y.run({ start: "yd", load: fanC.load, k: fanC.k, J: fanC.J, ty, td: 0.05, rec: 0.005 });
    T["fan" + ty] = { m: { tSw: r.m.tSw, nSw: r2(r.m.nSw, 1), pk: r2(r.m.pkEnvSw / IN, 2), tHigh: r2(r.m.tHigh, 2), tReach: r2(r.m.tReach, 2) }, pts: env(r) };
  }
  const fd = Y.run({ start: "dol", load: fanC.load, k: fanC.k, J: fanC.J, rec: 0.005 });
  T.fanDol = { m: { tReach: r2(fd.m.tReach, 2) }, pts: env(fd) };
  for (const order of ["good", "bad"]) {
    const r = Y.run({ start: "yd", load: pumpC.load, k: pumpC.k, J: pumpC.J, ty: 1.5, td: 0.05, order, win: [1.45, 1.75], tend: 1.8, tail: 0.3 });
    T["pump_" + order] = { m: { pk: r2(r.m.pkEnvSw / IN, 2), ph: r2(r.m.phRes, 1), e: r2(r.m.eRes, 1) },
      dense: dec(r.dense, 0.0002, (p) => [r2(p[0], 4), r2(p[1] / IN, 3), r2(p[4] / TN, 3), r2(p[5], 1)]) };
  }
  const rc = Y.run({ start: "ydc", load: pumpC.load, k: pumpC.k, J: pumpC.J, ty: 1.5, rt: 0.15 * 400 / (IN / Math.sqrt(3)), tr: 0.06, win: [1.45, 1.75], tend: 1.8, tail: 0.3 });
  T.pump_closed = { m: { pk: r2(rc.m.pkEnvSw / IN, 2) }, dense: dec(rc.dense, 0.0002, (p) => [r2(p[0], 4), r2(p[1] / IN, 3), r2(p[4] / TN, 3), r2(p[5], 1)]) };
  OUT.T = T;
  console.log("\n## T traces:", Object.keys(T).join(", "));
}

if (!only.length) {
  fs.writeFileSync(path.join(ROOT, "scripts/yd_results.json"), JSON.stringify(OUT));
  console.log("\nwrote scripts/yd_results.json");
}
