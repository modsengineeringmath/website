# Computed SVG figures and the numbers for the "PID tuning guide" articles (/blog/pid-tuning-guide/ and /en/blog/pid-tuning-guide/).
# Usage: python3 scripts/pid_guide_figs.py            (redraws every <!--FIG:key-->…<!--/FIG--> in both language editions)
#        python3 scripts/pid_guide_figs.py --table    (prints the simulated comparison table used in the articles)
# Everything is simulated here (no hand-typed responses): ideal-form PID, derivative on the measurement with a first-order filter,
# FOPDT plant K·e^(-Ls)/(Ts+1) with K = 2, L = 2 s, T = 10 s, setpoint step at t = 0 and a load step at the plant input at t = 70 s.
import math
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cs_figs import Frame, Svg, f1, grid, poly_path  # noqa: E402

K, L, T = 2.0, 2.0, 10.0
DT = 0.005
T_DIST, D_LOAD = 70.0, -0.5


def ultimate():
    """Ultimate gain and period of K e^{-Ls}/(Ts+1) (phase = -180 deg)."""
    lo, hi = 1e-6, 10.0
    for _ in range(200):
        w = (lo + hi) / 2
        if math.atan(w * T) + w * L - math.pi > 0:
            hi = w
        else:
            lo = w
    w = (lo + hi) / 2
    return math.sqrt(1 + (w * T) ** 2) / K, 2 * math.pi / w


KU, PU = ultimate()


def sim(kp, ti=0.0, td=0.0, tend=140.0, r=1.0, dist=D_LOAD, dist_t=T_DIST, n=10.0, umin=-1e9, umax=1e9, tt=None, open_loop=None):
    """Return t, y, u. Ideal PID; D acts on -y through a filter Td/n. tt = tracking time constant for back-calculation anti-windup.
    open_loop = step size of u applied at t=0 (no feedback) for the step-test figure."""
    steps = int(round(tend / DT))
    nd = int(round(L / DT))
    buf = np.zeros(nd + 1)
    y = I = dfilt = 0.0
    tf = td / n if td > 0 else 1.0
    t_, y_, u_ = np.zeros(steps), np.zeros(steps), np.zeros(steps)
    yprev = 0.0
    for k in range(steps):
        t = k * DT
        if open_loop is not None:
            u = open_loop
        else:
            e = r - y
            dy = (y - yprev) / DT
            dfilt += DT / (tf + DT) * (dy - dfilt)
            D = -kp * td * dfilt if td > 0 else 0.0
            u_raw = kp * e + I + D
            u = min(max(u_raw, umin), umax)
            if ti > 0:
                I += DT * (kp / ti) * e + (DT * (u - u_raw) / tt if tt else 0.0)
        yprev = y
        d = dist if (t >= dist_t and open_loop is None) else 0.0
        buf = np.roll(buf, 1)
        buf[0] = u + d
        y += DT * (K * buf[-1] - y) / T
        t_[k], y_[k], u_[k] = t, y, u
    return t_, y_, u_


def metrics(t, y):
    i1 = int(round(T_DIST / DT))
    ys = y[:i1]
    bad = np.where(np.abs(ys - 1.0) > 0.02)[0]
    return {
        "os": max(0.0, (ys.max() - 1.0) * 100),
        "settle": t[bad[-1]] if len(bad) else 0.0,
        "iae_sp": float(np.sum(np.abs(1 - ys)) * DT),
        "iae_d": float(np.sum(np.abs(1 - y[i1:])) * DT),
    }


def margins(kp, ti, td, n=10.0):
    """Gain margin, phase margin (deg) and peak sensitivity Ms of the loop C(s)·G(s) (derivative filtered with Td/n)."""
    w = np.logspace(-3, 1.5, 200000)
    s = 1j * w
    Lg = kp * (1 + (1 / (ti * s) if ti else 0) + (td * s / (1 + td / n * s) if td else 0)) * K * np.exp(-L * s) / (T * s + 1)
    mag, ph = np.abs(Lg), np.unwrap(np.angle(Lg))
    i = np.where(np.diff(np.sign(ph + np.pi)))[0]
    j = np.where(np.diff(np.sign(mag - 1)))[0]
    return 1 / mag[i[0]], math.degrees(ph[j[0]] + np.pi), float(np.max(1 / np.abs(1 + Lg)))


def rules():
    """name -> (Kp, Ti, Td). Formulas as printed in the articles."""
    R = {}
    R["zn_pid"] = (0.6 * KU, PU / 2, PU / 8)
    R["zn_pi"] = (0.45 * KU, PU / 1.2, 0.0)
    R["tl_pi"] = (KU / 3.2, 2.2 * PU, 0.0)
    R["tl_pid"] = (KU / 2.2, 2.2 * PU, PU / 6.3)
    R["znol_pid"] = (1.2 * T / (K * L), 2 * L, 0.5 * L)
    R["znol_pi"] = (0.9 * T / (K * L), L / 0.3, 0.0)
    R["cc_pi"] = (T / (K * L) * (0.9 + L / (12 * T)), L * (30 + 3 * L / T) / (9 + 20 * L / T), 0.0)
    R["cc_pid"] = (T / (K * L) * (4 / 3 + L / (4 * T)), L * (32 + 6 * L / T) / (13 + 8 * L / T), 4 * L / (11 + 2 * L / T))
    R["simc_l"] = (T / (K * (L + L)), min(T, 4 * (L + L)), 0.0)
    R["simc_2l"] = (T / (K * (2 * L + L)), min(T, 4 * (2 * L + L)), 0.0)
    return R


# ---------------------------------------------------------------------------------------------------- drawing helpers
def legend(S, F, items, x=None, y=None, anchor="end"):
    x = F.x + F.w - 8 if x is None else x
    y = F.y + 18 if y is None else y
    for i, (cls_i, name) in enumerate(items):
        S.add(f'<text class="lb" x="{f1(x)}" y="{f1(y + 16 * i)}" text-anchor="{anchor}" style="fill:var(--b{cls_i})">{name}</text>')


def frame_for(S, x, y, w, h, x1, y0, y1, xl, yl):
    F = Frame(x, y, w, h, 0, x1, y0, y1)
    grid(S, F, xl, yl, jlabel=False, nx=7, ny=5)
    return F


def curve(S, F, t, y, cls, step=20):
    S.path(poly_path(F, list(zip(t[::step], y[::step]))), cls)


# ---------------------------------------------------------------------------------------------------- figures
def fig_steptest(lang):
    S = Svg(640, 300, {"th": "กราฟการทดลองขั้นบันไดแบบวงเปิดของกระบวนการ FOPDT พร้อมเส้นสัมผัสที่จุดชันที่สุด บอกเวลาหน่วง L และค่าคงเวลา T และจุดที่ 28.3% กับ 63.2% ของการเปลี่ยนแปลง",
                       "en": "Open-loop step test of a FOPDT process with the tangent at the steepest point, showing dead time L, time constant T and the 28.3% and 63.2% points"}[lang], "pidg-steptest")
    du = 10.0
    t, y, _ = sim(0, tend=40, open_loop=du)
    dy = K * du
    F = frame_for(S, 46, 14, 574, 240, 40, -1.5, dy * 1.12, "t (s)", "y")
    # tangent at the inflection (t = L): slope = dy / T
    S.path(f"M{f1(F.X(L))} {f1(F.Y(0))}L{f1(F.X(L + T))} {f1(F.Y(dy))}", "dsh")
    S.path(f"M{f1(F.x)} {f1(F.Y(dy))}H{f1(F.x + F.w)}", "dsh")
    curve(S, F, t, y, "c1", 10)
    S.add(f'<path class="thin" d="M{f1(F.X(L))} {f1(F.Y(0))}V{f1(F.Y(-1.2))}M{f1(F.X(L + T))} {f1(F.Y(dy))}V{f1(F.Y(0))}"/>')
    S.text(F.X(L), F.Y(-1.2) + 14, "L", "lbk", "middle")
    S.text(F.X(L + T / 2), F.Y(dy) - 8, "T", "lbk", "middle")
    S.path(f"M{f1(F.X(L))} {f1(F.Y(dy) - 2)}H{f1(F.X(L + T))}", "thin", ' marker-end="url(#pidg-steptest-a)" marker-start="url(#pidg-steptest-a)"')
    t28 = L + T * -math.log(1 - 0.283)
    t63 = L + T
    for tt, frac, nm in ((t28, 0.283, "28.3%"), (t63, 0.632, "63.2%")):
        S.add(f'<circle class="mkg" cx="{f1(F.X(tt))}" cy="{f1(F.Y(frac * dy))}" r="4.5"/>')
        S.text(F.X(tt) + 8, F.Y(frac * dy) + 15, nm, "lb")
    S.text(F.x + F.w - 6, F.Y(dy) - 8, "Δy = K·Δu", "lb", "end")
    return S.svg()


def fig_kp(lang):
    S = Svg(640, 300, {"th": "ผลตอบสนองขั้นบันไดของวงปิดที่ใช้ตัวควบคุมสัดส่วนอย่างเดียว เมื่อเพิ่ม Kp: ค่าค้างลดลงแต่เริ่มแกว่ง และแกว่งต่อเนื่องที่ Kp เท่ากับ Ku",
                       "en": "Closed-loop step responses with a proportional-only controller as Kp is raised: the offset shrinks but oscillation appears, and it oscillates continuously at Kp = Ku"}[lang], "pidg-kp")
    ku = round(KU, 2)
    gains = [(0.5, 1), (1.5, 2), (3.0, 3), (ku, 4)]
    F = frame_for(S, 46, 14, 450, 240, 60, -0.1, 2.0, "t (s)", "y/r")
    S.path(f"M{F.x} {f1(F.Y(1))}H{f1(F.x + F.w)}", "dsh")
    for kp, c in gains:
        t, y, _ = sim(kp, tend=60, dist=0.0)
        curve(S, F, t, y, f"c{c}", 10)
    legend(S, F, [(c, f"Kp = {kp:g}" + (" = Ku" if kp == ku else "")) for kp, c in gains], x=F.x + F.w + 12, y=F.y + 30, anchor="start")
    return S.svg()


def fig_compare(lang):
    S = Svg(640, 320, {"th": "ผลตอบสนองวงปิดของพลานต์เดียวกันเมื่อจูนด้วยกฎต่างกัน: Ziegler–Nichols แบบ PID, Cohen–Coon แบบ PID และ SIMC แบบ PI สองค่า การเปลี่ยนค่าเป้าหมายที่ t = 0 และโหลดรบกวนที่ t = 70 วินาที",
                       "en": "Closed-loop responses of the same plant tuned with different rules: Ziegler–Nichols PID, Cohen–Coon PID and SIMC PI at two settings. Setpoint step at t = 0 and load disturbance at t = 70 s"}[lang], "pidg-compare")
    R = rules()
    F = frame_for(S, 46, 14, 574, 262, 140, -0.1, 2.05, "t (s)", "y/r")
    S.path(f"M{F.x} {f1(F.Y(1))}H{f1(F.x + F.w)}", "dsh")
    S.path(f"M{f1(F.X(T_DIST))} {f1(F.y)}V{f1(F.y + F.h)}", "thin")
    S.text(F.X(T_DIST) + 6, F.y + F.h - 8, "load", "tk")
    items = [("zn_pid", 2, "ZN PID"), ("cc_pid", 4, "Cohen–Coon PID"), ("simc_l", 1, "SIMC τc = L"), ("simc_2l", 3, "SIMC τc = 2L")]
    for key, c, _ in items:
        kp, ti, td = R[key]
        t, y, _u = sim(kp, ti, td)
        curve(S, F, t, y, f"c{c}", 20)
    legend(S, F, [(c, nm) for _, c, nm in items], x=F.X(T_DIST) - 10, y=F.y + 18)
    return S.svg()


def fig_windup(lang):
    S = Svg(640, 380, {"th": "ผลของ integral windup: ตัวขับอิ่มตัวที่ 1 เมื่อค่าเป้าหมายกระโดดเป็น 1.6 ตัวควบคุม PI ที่ไม่มี anti-windup เกินเป้าและใช้เวลานานกว่าจะกลับ ส่วนที่มี back-calculation เกินน้อยกว่ามาก",
                       "en": "Integral windup: the actuator saturates at 1 when the setpoint jumps to 1.6. The PI controller without anti-windup overshoots and recovers slowly; with back-calculation it overshoots far less"}[lang], "pidg-windup")
    kp, ti, _ = rules()["simc_l"]
    r, umax = 1.6, 1.0
    t, y0, u0 = sim(kp, ti, 0, tend=80, r=r, dist=0.0, umin=0.0, umax=umax)
    _, y1, u1 = sim(kp, ti, 0, tend=80, r=r, dist=0.0, umin=0.0, umax=umax, tt=ti)
    F1 = frame_for(S, 46, 12, 574, 170, 80, -0.1, 2.4, "t (s)", "y")
    S.path(f"M{F1.x} {f1(F1.Y(r))}H{f1(F1.x + F1.w)}", "dsh")
    curve(S, F1, t, y0, "c2", 20)
    curve(S, F1, t, y1, "c1", 20)
    legend(S, F1, [(2, "no anti-windup"), (1, "back-calculation")], y=F1.y + 18)
    F2 = frame_for(S, 46, 214, 574, 120, 80, -0.1, 1.4, "t (s)", "u")
    S.path(f"M{F2.x} {f1(F2.Y(umax))}H{f1(F2.x + F2.w)}", "dsh")
    ucurve0 = [(a, b) for a, b in zip(t[::20], u0[::20])]
    ucurve1 = [(a, b) for a, b in zip(t[::20], u1[::20])]
    S.path(poly_path(F2, ucurve0), "c2")
    S.path(poly_path(F2, ucurve1), "c1")
    S.text(F2.x + F2.w - 4, F2.Y(umax) - 6, "u_max", "tk", "end")
    return S.svg()


FIGS = {"pidg-steptest": fig_steptest, "pidg-kp": fig_kp, "pidg-compare": fig_compare, "pidg-windup": fig_windup}


def inject(path, lang):
    src = open(path, encoding="utf8").read()

    def rep(m):
        key = m.group(1)
        if key not in FIGS:
            raise SystemExit(f"unknown figure {key} in {path}")
        return f"<!--FIG:{key}-->" + FIGS[key](lang) + "<!--/FIG-->"

    out, n = re.subn(r"<!--FIG:([\w-]+)-->(<svg[\s\S]*?</svg>)?<!--/FIG-->", rep, src)
    if out != src:
        open(path, "w", encoding="utf8").write(out)
    print(f"{os.path.relpath(path)}: {n} figures")


def table():
    R = rules()
    print(f"plant K={K} L={L} T={T}  Ku={KU:.3f}  Pu={PU:.3f}  (Ku*K={KU * K:.3f})")
    print(f"{'rule':10s} {'Kp':>7s} {'Ti':>7s} {'Td':>6s} {'Ki':>7s} | {'OS%':>6s} {'settle':>7s} {'IAEsp':>7s} {'IAEd':>7s} | {'GM':>5s} {'PM':>5s} {'Ms':>5s}")
    for name, (kp, ti, td) in R.items():
        t, y, _ = sim(kp, ti, td)
        m = metrics(t, y)
        ki = kp / ti if ti else 0
        gm, pm, ms = margins(kp, ti, td)
        print(f"{name:10s} {kp:7.3f} {ti:7.2f} {td:6.2f} {ki:7.3f} | {m['os']:6.1f} {m['settle']:7.1f} {m['iae_sp']:7.2f} {m['iae_d']:7.2f} | {gm:5.2f} {pm:5.1f} {ms:5.2f}")
    # steady offset of P-only control
    for kp in (0.5, 1.5, 3.0):
        t, y, _ = sim(kp, tend=200, dist=0.0)
        print(f"P-only Kp={kp}: y_ss={y[-1]:.3f}  predicted K*Kp/(1+K*Kp)={K * kp / (1 + K * kp):.3f}")
    # windup
    kp, ti, _ = R["simc_l"]
    for tt in (None, ti):
        t, y, u = sim(kp, ti, 0, tend=80, r=1.6, dist=0.0, umin=0.0, umax=1.0, tt=tt)
        print(f"windup tt={tt}: peak y={y.max():.3f} overshoot={(y.max() / 1.6 - 1) * 100:.1f}%  t_settle_2%={t[np.where(np.abs(y - 1.6) > 0.032)[0][-1]]:.1f}s")


if __name__ == "__main__":
    if "--table" in sys.argv:
        table()
    else:
        root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "pages")
        for lang, rel in (("th", "blog/pid-tuning-guide.html"), ("en", "en/blog/pid-tuning-guide.html")):
            p = os.path.join(root, rel)
            if os.path.exists(p):
                inject(p, lang)
