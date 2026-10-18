// Reproducible checks of the op-amp lab engine (assets/oa-core.js). Run: node scripts/test-oa.mjs
// No browser or test framework is required. Reference values are closed forms (gain formulas, RC / RLC step responses, slew limit, Butterworth poles).
import assert from 'node:assert/strict';
import '../assets/oa-core.js';

const { OAE, OK } = globalThis;
const near = (a, b, ctx, tol = 1e-6) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${ctx}: expected ${b}, received ${a}`);
const lab = (c, l) => c.find((q) => q.lab === l);
const tfs = (c, l) => OAE.transferFunctions(c, lab(c, l).id).tfs;
const trace = (r, c, l) => { const o = lab(c, l); const k = r.net.nodeOfKey(OAE.key(o.x1, o.y1)); return r.nodeV.map((v) => (k < 0 ? 0 : v[k])); };
let n = 0; const ok = (name, fn) => { fn(); n++; };

ok('DC gains of the basic circuits', () => {
  let c = OK.P.inverting({ w: 'dc', amp: 0.1 }); near(OAE.solveDC(c).probe[lab(c, 'Vo').id], -1, 'inverting', 1e-9);
  c = OK.P.noninverting({ w: 'dc', amp: 0.1 }); near(OAE.solveDC(c).probe[lab(c, 'Vo').id], 1.1, 'non-inverting', 1e-9);
  c = OK.P.summer(); near(OAE.solveDC(c).probe[lab(c, 'Vo').id], -1, 'summer', 1e-9);
  c = OK.P.diffamp({ r1: 10e3, r3: 10e3, rf: 47e3, r4: 47e3 }); const t = tfs(c, 'Vo'); near(t[0].dc, -4.7, 'diff V1', 1e-9); near(t[1].dc, 4.7, 'diff V2', 1e-9);
  c = OK.P.inamp({ r1: 24e3, rg: 500, r2: 10e3, r3: 20e3 }); near(tfs(c, 'Vo')[1].dc, 194, 'in-amp', 1e-9);
});

ok('saturation: output stops at the rails minus headroom, the power balance closes', () => {
  const c = OK.P.inverting({ w: 'dc', amp: 2, m: '741', rl: 10e3 }); const r = OAE.solveDC(c); assert.ok(r.ok);
  const vo = r.probe[lab(c, 'Vo').id]; assert.ok(vo < -12.5 && vo > -13, `741 clips near −13 V, got ${vo}`);
  let sum = 0; for (const k in r.elem) sum += r.elem[k].p; near(sum, 0, 'Σp', 1e-9);
});

ok('transfer functions are exact', () => {
  let t = tfs(OK.P.lpf1(), 'Vo')[0]; near(t.poles[0][0], -1e4, 'lpf pole', 1e-6); near(t.dc, -1, 'lpf dc', 1e-9);
  t = tfs(OK.P.integrator(), 'Vo')[0]; near(t.num[0], -1000, 'integrator K', 1e-9); assert.equal(OAE.analyzeTF(t).kindEn, 'integrator');
  t = tfs(OK.P.pi(), 'Vo')[0]; near(t.zeros[0][0], -500, 'PI zero', 1e-6); assert.equal(OAE.analyzeTF(t).kindEn, 'pi');
  t = tfs(OK.P.differentiator(), 'Vo')[0]; near(t.num[1], -1e6, 'diff K', 1e-6); near(t.poles[0][0], -1e5, 'diff pole', 1e-3);
  t = tfs(OK.P.tow(), 'Vb')[0]; const a = OAE.analyzeTF(t); near(a.wn, 1000, 'tow ω0', 1e-6); near(a.zeta, 0.2, 'tow ζ', 1e-6);
  const s = OAE.analyzeTF(tfs(OK.P.sallen(), 'Vo')[0]); near(s.wn / 2 / Math.PI, 1000.4, 'SK f0', 1e-4); near(s.Q, Math.SQRT1_2, 'SK Q', 1e-4); near(s.fc, 1000.4, 'SK −3 dB', 2e-3);
  const m = OAE.analyzeTF(tfs(OK.P.mfb(), 'Vo')[0]); near(m.Q, 5, 'MFB Q', 1e-3); near(m.gain0, 2, 'MFB peak gain', 1e-3);
});

ok('Sallen–Key with unequal parts follows ω0 = 1/√(R1R2C1C2), Q = √(R1R2C1C2)/(C2(R1+R2))', () => {
  const R1 = 12e3, R2 = 8.2e3, C1 = 47e-9, C2 = 22e-9; const a = OAE.analyzeTF(tfs(OK.P.sallen({ r1: R1, r2: R2, c1: C1, c2: C2 }), 'Vo')[0]);
  near(a.wn, 1 / Math.sqrt(R1 * R2 * C1 * C2), 'ω0', 1e-6); near(a.Q, Math.sqrt(R1 * R2 * C1 * C2) / (C2 * (R1 + R2)), 'Q', 1e-6);
});

ok('Butterworth order 4 from two Sallen–Key stages', () => {
  const t = tfs(OK.P.butter4(), 'Vo')[0];
  near(Math.hypot(...OAE.evalTF(t, 1000)), Math.SQRT1_2, '|H(fc)|', 2e-4); near(Math.hypot(...OAE.evalTF(t, 2000)), 1 / Math.sqrt(1 + 2 ** 8), '|H(2fc)|', 2e-3);
});

ok('AC sweep agrees with the recovered H(s) and with the analytic 2nd-order response', () => {
  const c = OK.P.sallen(); const sw = OAE.acSweep(c, { outId: lab(c, 'Vo').id, fmin: 10, fmax: 1e5 }); const w0 = 2 * Math.PI * 1000.4, z = Math.SQRT1_2;
  sw.f.forEach((f, i) => { const w = 2 * Math.PI * f; near(sw.mag[i], w0 * w0 / Math.hypot(w0 * w0 - w * w, 2 * z * w0 * w), `|H| at ${f}`, 1e-3); });
  const t = tfs(c, 'Vo')[0]; sw.f.forEach((f, i) => { const h = OAE.evalTF(t, f); near(h[0], sw.re[i], `re at ${f}`, 1e-6); near(h[1], sw.im[i], `im at ${f}`, 1e-6); });
});

ok('transient: RC step, integrator ramp, RLC overshoot, oscillator amplitude', () => {
  let c = OK.P.lpf1({ w: 'step', amp: 1 }); let r = OAE.solveTran(c, 5e-4, 4000); let v = trace(r, c, 'Vo'), e = 0;
  v.forEach((y, i) => { e = Math.max(e, Math.abs(y + (1 - Math.exp(-r.t[i] / 1e-4)))); }); assert.ok(e < 1e-4, `RC step error ${e}`);
  c = OK.P.integrator({ w: 'step', amp: 1 }); r = OAE.solveTran(c, 5e-3, 4000); v = trace(r, c, 'Vo'); near(v[v.length - 1], -5, 'ramp after 5 ms', 2e-3);
  c = OK.P.tow(); r = OAE.solveTran(c, 0.04, 4000); v = trace(r, c, 'Vb'); near(Math.max(...v), 1 + Math.exp(-Math.PI * 0.2 / Math.sqrt(0.96)), 'overshoot', 1e-3);
  const tp = r.t[v.indexOf(Math.max(...v))]; near(tp, Math.PI / (1000 * Math.sqrt(0.96)), 'peak time', 0.01);
  c = OK.P.tow({ rq: null, ic2: -1, w: 'dc', amp: 0 }); r = OAE.solveTran(c, 0.03, 4000); v = trace(r, c, 'Vb'); near(Math.max(...v), 1, 'oscillator amplitude', 1e-3); near(v[v.length - 1], Math.cos(30), 'oscillator phase after 30 rad', 2e-3);
});

ok('slew rate and GBW', () => {
  let c = OK.P.follower({ m: '741', amp: 10, f: 50e3 }); let r = OAE.solveTran(c, 1e-4, 4000); const v = trace(r, c, 'Vo'); let ms = 0;
  for (let i = 1; i < v.length; i++) ms = Math.max(ms, Math.abs(v[i] - v[i - 1]) / (r.t[i] - r.t[i - 1])); near(ms / 1e6, 0.5, 'slope (V/µs)', 0.02);
  c = OK.P.noninverting({ m: '741', rg: 1e3, rf: 99e3 }); const t = tfs(c, 'Vo')[0]; const fc = OAE.analyzeTF(t).fc; assert.ok(fc > 9.5e3 && fc < 10.5e3, `GBW/100 ≈ 10 kHz, got ${fc}`);
});

ok('comparator, Schmitt trigger (ideal) and precision rectifier', () => {
  let c = OK.P.comparator(); let r = OAE.solveTran(c, 5e-3, 4000); let v = trace(r, c, 'Vo'); assert.ok(Math.max(...v) > 13 && Math.min(...v) < -13, 'comparator swings to both rails');
  c = OK.P.schmitt({ m: 'ideal' }); r = OAE.solveTran(c, 3e-3, 4000); v = trace(r, c, 'Vo'); const vi = trace(r, c, 'Vi'); const th = [];
  for (let i = 1; i < v.length; i++) if (Math.sign(v[i]) !== Math.sign(v[i - 1]) && Math.abs(v[i] - v[i - 1]) > 10) th.push(Math.abs(vi[i]));
  assert.ok(th.length >= 4); th.slice(1).forEach((x) => near(x, 15 * 10 / 110, 'Schmitt threshold', 0.03));
  c = OK.P.rectifier({ m: 'ideal' }); r = OAE.solveTran(c, 5e-3, 4000); v = trace(r, c, 'Vo'); const vin = trace(r, c, 'Vi'); let e = 0; v.forEach((y, i) => { e = Math.max(e, Math.abs(y - Math.max(vin[i], 0))); }); assert.ok(e < 0.02, `rectifier error ${e}`);
});

ok('problem-bank answers', () => {
  near(OAE.analyzeTF(tfs(OK.P.lpf1({ rin: 4.7e3, rf: 47e3, cf: 3.3e-9 }), 'Vo')[0]).fc, 1026.1, 'p6 fc', 1e-3);
  const a9 = OAE.analyzeTF(tfs(OK.P.sallen({ r1: 10e3, r2: 10e3, c1: 47e-9, c2: 22e-9 }), 'Vo')[0]); near(a9.wn / 2 / Math.PI, 494.9, 'p9 f0', 1e-3); near(a9.Q, 0.7308, 'p9 Q', 1e-3);
  const a10 = OAE.analyzeTF(tfs(OK.P.tow({ r: 10e3, c: 47e-9, rq: 33e3 }), 'Vb')[0]); near(a10.wn / 2 / Math.PI, 338.6, 'p10 f0', 1e-3); near(a10.Q, 3.3, 'p10 Q', 1e-6);
  near(15 * 0 + 13 * 10 / 57, 2.2807, 'p11 UTP', 1e-4);
});

console.log(`oa-core: ${n} groups of checks passed`);
