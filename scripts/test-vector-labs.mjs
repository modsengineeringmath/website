// Regression checks for the vector series engines against the worked examples in the lessons.
// Run: node scripts/test-vector-labs.mjs   (no browser needed; the engines expose their math on globalThis)
import assert from "node:assert/strict";
import "../assets/vec3d.js";
import "../assets/vec-mech.js";
import "../assets/vec-field.js";
import "../assets/ac-phasor.js";

const { Vec3D, VecMech, VecField, ACPhasor } = globalThis;
let n = 0;
function near(name, got, exp, tol = 1e-3) {
  const g = [].concat(got), e = [].concat(exp);
  g.forEach((x, i) => assert.ok(Math.abs(x - e[i]) <= tol * Math.max(1, Math.abs(e[i])), `${name}[${i}]: expected ${e[i]}, got ${x}`));
  n++;
}
const m = Vec3D.m, c = VecMech.calc, ph = VecField.phys, cx = ACPhasor.cx;

// direction cosines (K-0, K-2), rotations (T-3, T-4), 3D arm (A-5)
near("K-0", m.dirCos([300, 400, 500]).ang, [64.896, 55.55, 45]);
near("K-2", m.fromSph(700, 30, 50), [389.669, 224.976, 536.231]);
const sq = m.dirCos([-200, 150, 600]).c.reduce((s, x) => s + x * x, 0); near("K3 identity", sq, 1, 1e-12);
near("T-3", m.euler(40, -25, 20)[2], [0.4226, 0.31, 0.8517]);
near("T3 det", m.det(m.euler(40, -25, 20)), 1, 1e-12);
near("T-4", m.mv(m.axisAngle([1, 1, 1], 120), [1, 0, 0]), [0, 1, 0], 1e-9);
near("T5 order", m.mv(m.mm(m.Rz(90), m.Rx(90)), [1, 0, 0]), [0, 1, 0], 1e-9);
near("A-5", m.arm3(30, 40, -60, 0.4, 0.6, 0.5)[3], [0.80495, 0.46474, 0.61466]);

// resultant forces (R-1 … R-7), force systems (S-4, S-6), robot arm (A-1, A-2), incline (T-2)
let r = c.cosLaw(600, 0, 400, 50); near("R-1", [r.R, r.dir], [910.24, 19.672]);
r = c.cosLaw(200, 0, 500, 150); near("R-3 obtuse", [r.R, r.dir], [341.75, 132.986]);
r = c.cosLaw(5, 20, 4, -30); near("R-2", [r.R, ((r.dir + 540) % 360) - 180], [8.1677, -2.034]);
const rs = c.resolve(500, 60, 0, 105); near("R-4", [rs.Fu, rs.Fv], [366.03, 448.29]);
const h = c.hang(490.5, 30, 45); near("R-7", [h.T1, h.T2], [359.07, 439.77]);
const loads = [{ x: 1.5, y: 0, F: 800, a: 270 }, { x: 3.5, y: 0, F: 600, a: 240 }, { x: 5, y: 0, F: 400, a: 90 }];
const s = c.system(loads, 0, 0, 0); near("S-4", [s.Rx, s.Ry, s.Mo, s.xbar], [-300, -919.615, -1018.65, 1.1077]);
const b = c.beam(loads, 0, 6); near("S-6", [b.Ax, b.Ay, b.By], [300, 749.84, 169.78]);
const k = c.arm2(0.5, 0.4, 30, 60); near("A-1", [k.x, k.y, k.det], [0.433, 0.65, 0.17321]);
near("A-4 tau", [k.J[0][0] * 0 + k.J[1][0] * 19.62, k.J[0][1] * 0 + k.J[1][1] * 19.62], [8.4957, 0]);
let ik = c.ik2(0.5, 0.4, 0.6, 0.3, false); near("A-2 down", [ik.t1, ik.t2], [-9.8262, 84.2608]);
ik = c.ik2(0.5, 0.4, 0.6, 0.3, true); near("A-2 up", [ik.t1, ik.t2], [62.9563, -84.2608]);
const inc = c.incline(10, 30, 0.4, 0.3, 0, 0); near("T-2", [inc.Wpar, inc.Wperp], [49.05, 84.957]);

// fields (M-1, M-2, M-3, M-7)
const fq = ph.forceOn([{ x: -0.3, y: -0.2, q: 3 }, { x: 0.3, y: -0.2, q: -4 }, { x: 0, y: 0.32, q: 2 }], 2); near("M-1", [fq.fx, fq.fy], [0.174467, -0.043201]);
const E2 = ph.E([{ x: -0.3, y: 0, q: 2 }, { x: 0.3, y: 0, q: -2 }], 0, 0.35); near("M-2", [E2[0] / 1e5, E2[1] / 1e5, E2[2]], [1.100992, 0, 0], 1e-5);
const E0 = ph.E([{ x: -0.2, y: 0, q: 4 }, { x: 0.2, y: 0, q: -1 }], 0.6, 0); near("M-3", E0[0] / 1e5, 0, 1e-9);
near("M10", ph.B([{ x: 0, y: 0, I: 10 }], 0.1, 0)[1] * 1e6, 20);
near("M-7", ph.wireForce([{ x: -0.05, y: 0, I: 20000 }, { x: 0.05, y: 0, I: -20000 }], 1).fx, 800);

// AC circuits (Z-1 … Z-5) and phasor arithmetic (H-2, H-3)
let z = ACPhasor.solve("rl", 220, 50, 30, 127, 0); near("Z-1", [cx.abs(z.I), z.P, z.Q, z.pf], [4.40717, 582.695, 774.95, 0.60098]);
z = ACPhasor.solve("series", 220, 50, 30, 127, 53); near("Z-2", [cx.abs(z.I), cx.arg(z.I), cx.abs(z.parts[2][1]), z.f0], [6.08666, 33.9014, 365.555, 61.345]);
z = ACPhasor.solve("parallel", 220, 50, 44, 140, 30); near("Z-3", [cx.abs(z.I), cx.arg(z.I), z.pf], [5.79452, -30.358, 0.86288]);
z = ACPhasor.solve("rlc-pf", 220, 50, 30, 127, 38.37); near("Z-4", [cx.abs(z.I), z.pf], [2.788, 0.95], 2e-3);
z = ACPhasor.solve("series", 10, 159.1549, 10, 100, 10); near("Z-5", [cx.abs(z.I), cx.abs(z.parts[1][1]), z.f0], [1, 100, 159.155]);
near("H-2", cx.mul(cx.pol(10, 30), [4, -3]), [49.641, -5.9808]);
near("H-3", cx.div([8, 6], [3, -4]), [0, 2], 1e-9);
near("Z9 three-phase", cx.add(cx.add(cx.pol(230, 0), cx.pol(230, -120)), cx.pol(230, 120)), [0, 0], 1e-9);

console.log(`PASS: ${n} checks of the vector series engines against the worked examples.`);
