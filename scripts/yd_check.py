# Checks assets/yd-core.js (the star–delta engine used by the lab and scripts/yd_research.mjs) against scripts/acm_model.py:
#   1. steady state: line current, torque and power factor at 12 slips, star (×1/3) and delta;
#   2. dynamics: Y → open 50 ms → Δ (both KM3 phase orders) and DOL, fixed-step RK4 (JS) vs scipy LSODA (acm_model.dyn):
#      changeover envelope peak, peak/min torque and speed at the end of the dead time.
# Usage: python3 scripts/yd_check.py     (needs node, numpy, scipy; prints the differences and exits 1 if a tolerance is exceeded)
import json, math, os, subprocess, sys, tempfile, shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import acm_model as A

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
shutil.copy(os.path.join(ROOT, "assets/yd-core.js"), os.path.join(tmp, "yd-core.cjs"))
JS = r"""
const Y = require(process.argv[2]);
const out = { ss: [], dyn: {} };
for (const s of [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.135, 0.1, 0.06, 0.04, 0.0194, 0.008]) { const m = Y.motor(s); out.ss.push([s, m.I, m.T, m.pf]); }
const J = Y.JM + 0.06;
for (const order of ["good", "bad"]) {
  const r = Y.run({ start: "yd", load: "quad", k: 0.8, J, ty: 1.5, td: 0.05, order, win: [1.55, 1.8], tend: 1.8, tail: 0 });
  out.dyn[order] = { pk: r.m.pkEnvSw, Tmax: r.m.pkTSw, Tmin: r.m.mnTSw, nClose: r.m.nClose };
}
const d = Y.run({ start: "dol", load: "quad", k: 0.8, J, tend: 1.0, tail: 0.6 });
out.dyn.dol = { pk: d.m.pkEnv, Tmax: d.m.pkT, nEnd: d.tr[d.tr.length - 1][1] };
console.log(JSON.stringify(out));
"""
js = os.path.join(tmp, "run.cjs")
open(js, "w").write(JS)
res = json.loads(subprocess.check_output(["node", js, os.path.join(tmp, "yd-core.cjs")]))
shutil.rmtree(tmp)

bad = 0
print("steady state (JS vs equivalent circuit)")
for s, I, T, pf in res["ss"]:
    I0, T0, pf0 = A.motor(s)
    e = max(abs(I - I0) / I0, abs(T - T0) / T0, abs(pf - pf0))
    bad += e > 1e-9
    print(f"  s={s:<7} I {I:8.3f}/{I0:8.3f} A  T {T:8.3f}/{T0:8.3f} N·m  pf {pf:.4f}/{pf0:.4f}  max rel err {e:.1e}")

TL = lambda n: A.load_T("quad", n, 0.8)
J = A.JM + A.LOAD_J["quad"]
print("dynamics (JS RK4 vs scipy LSODA), pump 80 %, t_Y 1.5 s, dead time 50 ms")
for order, ang in (("good", -30), ("bad", 30)):
    t, ia, ir, te, nr = A.dyn([(1.5, "Y", 0), (1.55, "O", 0), (1.8, "D", ang)], TL, J)
    m = (t > 1.55) & (t < 1.8)
    py = dict(pk=ir[m].max(), Tmax=te[m].max(), Tmin=te[m].min(), nClose=float(np.interp(1.55, t, nr)))
    js_ = res["dyn"][order]
    for k in ("pk", "Tmax", "Tmin", "nClose"):
        ref = py[k]
        e = abs(js_[k] - ref) / max(abs(ref), 1e-9)
        tol = 0.01
        bad += e > tol
        print(f"  {order:4} {k:6} JS {js_[k]:10.3f}  LSODA {ref:10.3f}  rel err {e:.2e}{'  <-- exceeds 1 %' if e > tol else ''}")
t, ia, ir, te, nr = A.dyn([(1.0, "DOL", -90)], TL, J, winding=False)
for k, ref in (("pk", ir[t > 0.002].max()), ("Tmax", te.max()), ("nEnd", nr[-1])):
    js_ = res["dyn"]["dol"][k]
    e = abs(js_ - ref) / abs(ref)
    print(f"  DOL  {k:6} JS {js_:10.3f}  LSODA {ref:10.3f}  rel err {e:.2e}  (DOL switch-on angle differs between the two set-ups; peaks are indicative)")
print("OK" if not bad else f"{bad} check(s) failed")
sys.exit(1 if bad else 0)
