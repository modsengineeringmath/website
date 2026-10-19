# Figures for /learn/motor-control/star-delta-analysis/ (+ /learn/en/…) and /blog/star-delta-timer-setting/ (+ /en/blog/…).
# Usage: node scripts/yd_research.mjs && python3 scripts/yd_figs.py     fills empty <!--FIG:yd-…--><!--/FIG--> blocks in src/pages
#        python3 scripts/yd_figs.py --all                               redraws every yd- figure
#        python3 scripts/yd_figs.py --preview out.html                  writes every figure (TH + EN) into one page
# A key ending in "-en" draws English labels. Every number comes from scripts/yd_results.json (engine assets/yd-core.js,
# checked against scripts/acm_model.py by scripts/yd_check.py) or from the equivalent circuit in scripts/acm_model.py.
import glob, json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import mc_figs as M
from mc_figs import F, Plot
import acm_model as A
from acm_figs import curve as _curve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = json.load(open(os.path.join(ROOT, "scripts/yd_results.json"), encoding="utf-8"))
FIGS = {}
T = M.T
IN, TN, NN = A.IN, A.TN, A.NN


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def curve(pl, pts, cls, ax=1, eps=0.12):
    if ax == 1:
        return _curve(pl, pts, cls, eps=eps)
    P = [(pl.X(a), pl.Y(b, 2)) for a, b in pts]
    pl.f.poly(P, cls)


def note(f, y, s):
    f.text(f.w / 2, y, s, "xf-m", "middle")


def nf(v, d=1):
    s = f"{v:,.{d}f}"
    return s


# =========================================================================== 1 · star run-up in units of τm
@fig("yd-runup")
def _():
    f = F(760, 470, T("การเร่งความเร็วในช่วงสตาร์ของปั๊ม พัดลมใหญ่ และสายพาน 50 % เทียบเวลาในหน่วยค่าคงตัวเวลาทางกล τm = J·ωs/Tn พร้อมความเร็วสมดุลและกระแสสตาร์",
                      "Star-stage run-up of a pump, a large fan and a conveyor at 50 % against time in units of the mechanical time constant τm = J·ωs/Tn, with the star equilibrium speed and the star current"), "yd-runup")
    ws = 2 * math.pi * 25
    cases = [("pump", "xf-b", T("ปั๊ม 80 %", "pump 80 %")), ("fan", "xf-a", T("พัดลม", "fan")), ("conv", "xf-c", T("สายพาน 50 %", "conveyor 50 %"))]
    p1 = Plot(f, 70, 24, 620, 200, (0, 4.5), (0, 1.05))
    p1.frame([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5], [0, 0.25, 0.5, 0.75, 1.0], yl="n / n_N", xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}")
    p2 = Plot(f, 70, 262, 620, 130, (0, 4.5), (0, 2.5))
    p2.frame([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5], [0, 0.5, 1, 1.5, 2, 2.5], xl=T("เวลา t / τm", "time t / τm"), yl="I / In", xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}")
    for i, (key, cls, lab) in enumerate(cases):
        e, c = R["E1"][key], R["cases"][key]
        tau = c["J"] * ws / TN
        pts = [(t / tau, n / NN) for t, n, I in e["pts"] if t / tau <= 4.5]
        cur = [(t / tau, I) for t, n, I in e["pts"] if t / tau <= 4.5]
        curve(p1, pts, cls); curve(p2, cur, cls)
        p1.f.line(p1.X(0), p1.Y(e["nYpu"]), p1.X(4.5), p1.Y(e["nYpu"]), "xf-dash")
        x98 = e["t98"] / tau
        f.dot(p1.X(x98), p1.Y(0.98 * e["nYpu"]), 4, "xf-dot")
        f.text(p1.X(4.45), p1.Y(0.62 - 0.12 * i), f"{lab}: n_Y {e['nYpu'] * 100:.1f} % · t98 {e['t98']:.2f} s = {x98:.2f} τm", cls.replace("xf-", "xf-t") if cls != "xf-c" else "xf-tc", "end")
        xe, ye = cur[-1]
        f.text(p2.X(xe) + 8, p2.Y(ye) + 4 + (8 if key == "pump" else 0), f"{e['IYeq']:.2f}·In", "xf-k")
    f.text(p1.X(4.45), p1.Y(0.26), T("● = 98 % ของความเร็วสมดุล (จุดที่ควรเปลี่ยนเป็น Δ)", "● = 98 % of the equilibrium speed (where Δ should take over)"), "xf-k", "end")
    f.text(p1.X(4.45), p1.Y(0.18), T("เส้นประ = ความเร็วสมดุลในสตาร์ n_Y", "dashed = star equilibrium speed n_Y"), "xf-k", "end")
    f.text(p2.X(0.08), p2.Y(2.3), T(f"สตาร์ตอนเริ่ม {R['motor']['Is'] / 3:.2f}·In (= DOL {R['motor']['Is']:.2f}·In ÷ 3)", f"star at standstill {R['motor']['Is'] / 3:.2f}·In (= DOL {R['motor']['Is']:.2f}·In ÷ 3)"), "xf-k")
    note(f, 436, T("τm = J·ωs/Tn: ปั๊ม 0.33 s · พัดลม 7.15 s · สายพาน 1.26 s — วัดเวลาด้วย τm แล้วโค้งของแต่ละโหลดแทบไม่ขึ้นกับขนาดมอเตอร์",
                   "τm = J·ωs/Tn: pump 0.33 s · fan 7.15 s · conveyor 1.26 s — measured in τm the curves hardly depend on the motor size"))
    note(f, 456, T("ไทเมอร์ควรยาว ≈ 1.2·t98 และไม่สั้นกว่า t95 ที่แรงดัน 90 % (ตาราง E13)", "Timer ≈ 1.2·t98 and not shorter than t95 at 90 % voltage (table E13)"))
    return f.svg()


# =========================================================================== 2 · timer sweep (fan)
@fig("yd-timer")
def _():
    e = R["E2"]["fan"]
    f = F(760, 536, T("ผลการกวาดเวลาไทเมอร์ของพัดลมใหญ่ 7.5 kW: ความเร็วตอนเปลี่ยน ยอดกระแส เวลาที่กระแสเกิน 3·In หลังเปลี่ยน I²t และความร้อนโรเตอร์ เทียบสตาร์ทตรง",
                      "Timer sweep for the large 7.5 kW fan: speed at changeover, peak current, time above 3·In after the changeover, I²t and rotor heat compared with DOL"), "yd-timer")
    S = e["sweep"]; D = e["dol"]
    p1 = Plot(f, 70, 24, 600, 120, (0, 30), (0, 1.0))
    p1.frame([0, 5, 10, 15, 20, 25, 30], [0, 0.25, 0.5, 0.75, 1.0], yl="n_sw / n_N", yf=lambda v: f"{v:g}")
    curve(p1, [(s["ty"], s["nSw"]) for s in S], "xf-c")
    for s in S:
        f.dot(p1.X(s["ty"]), p1.Y(s["nSw"]), 3, "xf-dot")
    nY = R["E1"]["fan"]["nYpu"]
    f.line(p1.X(0), p1.Y(nY), p1.X(30), p1.Y(nY), "xf-dash")
    f.text(p1.X(29.5), p1.Y(nY) + 14, T(f"ความเร็วสมดุลสตาร์ {nY * 100:.1f} %", f"star equilibrium {nY * 100:.1f} %"), "xf-k", "end")
    p2 = Plot(f, 70, 180, 600, 130, (0, 30), (0, 12), (0, 3.2))
    p2.frame([0, 5, 10, 15, 20, 25, 30], [0, 3, 6, 9, 12], [0, 1, 2, 3], yl=T("ยอด I/In (rms)", "peak I/In (rms)"), y2l=T("เวลา > 3·In (s)", "time > 3·In (s)"), yf=lambda v: f"{v:g}", y2f=lambda v: f"{v:g}")
    curve(p2, [(s["ty"], s["pk"]) for s in S], "xf-a")
    curve(p2, [(s["ty"], s["tHigh"]) for s in S], "xf-b", ax=2)
    f.line(p2.X(0), p2.Y(D["pk"]), p2.X(30), p2.Y(D["pk"]), "xf-dash")
    f.text(p2.X(0.4), p2.Y(D["pk"]) - 5, T(f"DOL ยอด {D['pk']:.2f}·In · เกิน 3·In นาน {D['tHigh']:.2f} s", f"DOL peak {D['pk']:.2f}·In · above 3·In for {D['tHigh']:.2f} s"), "xf-k")
    f.text(p2.X(16), p2.Y(11.2), T("ยอดตอนเปลี่ยน (ซ้าย)", "changeover peak (left)"), "xf-ta")
    f.text(p2.X(6.5), p2.Y(1.9, 2), T("เวลากระแสสูง (ขวา)", "high-current time (right)"), "xf-tb")
    p3 = Plot(f, 70, 346, 600, 100, (0, 30), (0, 180))
    p3.frame([0, 5, 10, 15, 20, 25, 30], [0, 60, 120, 180], xl=T("เวลาตั้งไทเมอร์ t_Y (s)", "star timer t_Y (s)"), yl=T("% ของ DOL", "% of DOL"), yf=lambda v: f"{v:g}")
    curve(p3, [(s["ty"], s["I2t"] / D["I2t"] * 100) for s in S], "xf-a")
    curve(p3, [(s["ty"], s["Er"] / D["Er"] * 100) for s in S], "xf-d")
    f.line(p3.X(0), p3.Y(100), p3.X(30), p3.Y(100), "xf-dash")
    f.text(p3.X(29.5), p3.Y(S[-1]["Er"] / D["Er"] * 100) - 6, T("ความร้อนโรเตอร์", "rotor heat"), "xf-k", "end")
    f.text(p3.X(29.5), p3.Y(S[-1]["I2t"] / D["I2t"] * 100) + 14, T("I²t สายจ่าย", "supply I²t"), "xf-k", "end")
    rec = R["E13"]["rows"][3]
    note(f, 504, T("สั้นเกิน (< 10 s): กระแสสูงค้างนาน · พอดี (15–20 s): I²t ≈ ครึ่งของ DOL · นานเกิน: ร้อนโรเตอร์เพิ่มเปล่าๆ",
                   "too short (< 10 s): long high current · right (15–20 s): I²t ≈ half of DOL · too long: extra rotor heat"))
    note(f, 524, T("พัดลม J รวม 2.245 kg·m² (τm 7.15 s) · ช่วงตาย 50 ms · KM3 ต่อแบบตามหลัง", "Fan, total J 2.245 kg·m² (τm 7.15 s) · dead time 50 ms · lagging KM3 order"))
    return f.svg()


# =========================================================================== 3 · whole-start traces (fan, too short vs right vs DOL)
@fig("yd-trace")
def _():
    f = F(760, 380, T("กระแสสาย (rms) และความเร็วของพัดลมใหญ่: สตาร์ทตรง เทียบสตาร์-เดลต้าตั้งไทเมอร์ 8 s (สั้นเกิน) และ 20 s (พอดี)",
                      "Line current (rms) and speed of the large fan: DOL versus star–delta with an 8 s timer (too short) and a 20 s timer (right)"), "yd-trace")
    tr = R["T"]
    pl = Plot(f, 70, 30, 610, 260, (0, 22), (0, 11), (0, 1600))
    pl.frame([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], [0, 2, 4, 6, 8, 10], [0, 500, 1000, 1500], T("เวลา (s)", "time (s)"), "I / In", "n (rpm)", yf=lambda v: f"{v:g}")
    for key, cls in (("fanDol", "xf-dash"), ("fan8", "xf-a"), ("fan20", "xf-b")):
        pts = tr[key]["pts"]
        curve(pl, [(p[0], p[2]) for p in pts if p[0] <= 22], cls, eps=0.25)
        curve(pl, [(p[0], p[1]) for p in pts if p[0] <= 22], cls.replace("xf-a", "xf-e").replace("xf-b", "xf-c"), ax=2)
    m8, m20 = tr["fan8"]["m"], tr["fan20"]["m"]
    f.text(pl.X(0.3), pl.Y(7.0), T("DOL 6.5·In นาน 3.1 s", "DOL 6.5·In for 3.1 s"), "xf-k")
    f.text(pl.X(8.2), pl.Y(m8["pk"]) + 2, T(f"8 s: เปลี่ยนที่ {m8['nSw']:.0f} rpm · ยอด {m8['pk']:.1f}·In · > 3·In อีก {m8['tHigh']:.2f} s", f"8 s: changeover at {m8['nSw']:.0f} rpm · peak {m8['pk']:.1f}·In · > 3·In for {m8['tHigh']:.2f} s"), "xf-ta")
    f.text(pl.X(19.8), pl.Y(m20["pk"]) + 2, T(f"20 s: {m20['nSw']:.0f} rpm · ยอด {m20['pk']:.1f}·In · {m20['tHigh']:.2f} s", f"20 s: {m20['nSw']:.0f} rpm · peak {m20['pk']:.1f}·In · {m20['tHigh']:.2f} s"), "xf-tb", "end")
    f.text(pl.X(13), pl.Y(2.55), T("ช่วงสตาร์ ≈ 2.2 → 1.0·In", "star stage ≈ 2.2 → 1.0·In"), "xf-k", "middle")
    f.text(pl.X(21.6), pl.Y(1440, 2) + 16, T("ความเร็ว (แกนขวา)", "speed (right axis)"), "xf-tc", "end")
    note(f, 336, T("ยอด 1–3 ไซเคิลพอๆ กันทุกกรณี — ที่ต่างคือกระแสสูงค้างนานเท่าไรหลังเปลี่ยน",
                   "The 1–3-cycle peak is similar in every case — what differs is how long the high current lasts"))
    note(f, 356, T("เส้นประ = DOL · ไทเมอร์ 8 s: กระแสน้ำเงิน ความเร็วเหลือง · ไทเมอร์ 20 s: กระแสส้ม ความเร็วเขียว", "dashed = DOL · 8 s timer: current blue, speed gold · 20 s timer: current orange, speed green"))
    return f.svg()


# =========================================================================== 4 · dead time
@fig("yd-deadtime")
def _():
    f = F(760, 500, T("ยอดกระแสหลังเปลี่ยนจังหวะเทียบช่วงตาย สำหรับปั๊ม (ความเฉื่อยต่ำ) และสายพาน 50 % ลำดับเฟส KM3 แบบตามหลังและแบบมาตรฐาน พร้อมมุมของแรงดันค้าง",
                      "Peak current after the changeover versus dead time for a pump (low inertia) and a conveyor at 50 %, lagging and standard KM3 phase order, with the residual-voltage angle"), "yd-deadtime")
    E = R["E3"]
    p1 = Plot(f, 70, 24, 610, 230, (0, 300), (0, 12))
    p1.frame([0, 50, 100, 150, 200, 250, 300], [0, 2, 4, 6, 8, 10, 12], yl=T("ยอด I/In (rms)", "peak I/In (rms)"), yf=lambda v: f"{v:g}")
    f.rect(p1.X(30), p1.y, p1.X(80) - p1.X(30), p1.h, "xf-fc", 0)
    f.text(p1.X(55), p1.y + 12, T("ช่วงตายทั่วไป 30–80 ms", "typical 30–80 ms"), "xf-k", "middle")
    for key, cg, cb, lab in (("pump", "xf-b", "xf-d", T("ปั๊ม", "pump")), ("conv", "xf-c", "xf-e", T("สายพาน", "conveyor"))):
        g = [(d["td"] * 1000, d["pk"]) for d in E[key]["good"] if d["td"] <= 0.3]
        b = [(d["td"] * 1000, d["pk"]) for d in E[key]["bad"] if d["td"] <= 0.3]
        curve(p1, g, cg); curve(p1, b, cb)
        for x, y in g:
            f.dot(p1.X(x), p1.Y(y), 2.6, "xf-dot")
    D = R["E2"]["pump"]["dol"]["pk"]
    f.line(p1.X(0), p1.Y(D), p1.X(300), p1.Y(D), "xf-dash")
    f.text(p1.X(4), p1.Y(D) - 5, T(f"DOL {D:.2f}·In", f"DOL {D:.2f}·In"), "xf-k")
    gp = {d["td"]: d for d in E["pump"]["good"]}; gc = {d["td"]: d for d in E["conv"]["good"]}
    f.text(p1.X(8), p1.Y(gp[0.005]["pk"]) + 16, T(f"ปั๊ม ตามหลัง {gp[0.005]['pk']:.1f}·In ที่ 5 ms", f"pump lagging {gp[0.005]['pk']:.1f}·In at 5 ms"), "xf-tb")
    f.text(p1.X(88), p1.Y(2.2), T(f"ปั๊ม ตามหลัง ที่ 50 ms: {gp[0.05]['pk']:.1f}·In", f"pump lagging at 50 ms: {gp[0.05]['pk']:.1f}·In"), "xf-tb")
    f.text(p1.X(88), p1.Y(1.0), T(f"สายพาน ตามหลัง ที่ 50 ms: {gc[0.05]['pk']:.1f}·In · ม่วง/เหลือง = ลำดับมาตรฐาน", f"conveyor lagging at 50 ms: {gc[0.05]['pk']:.1f}·In · purple/gold = standard order"), "xf-tc")
    p2 = Plot(f, 70, 290, 610, 110, (0, 300), (-180, 180))
    p2.frame([0, 50, 100, 150, 200, 250, 300], [-180, -90, 0, 90, 180], xl=T("ช่วงตาย t_d (ms)", "dead time t_d (ms)"), yl=T("มุม e (°)", "angle of e (°)"), yf=lambda v: f"{v:g}")
    for key, cls in (("pump", "xf-b"), ("conv", "xf-c")):
        pts = [(d["td"] * 1000, d["ph"]) for d in E[key]["good"] if d["td"] <= 0.3]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if abs(y1 - y0) < 180:
                f.line(p2.X(x0), p2.Y(y0), p2.X(x1), p2.Y(y1), cls)
        for x, y in pts:
            f.dot(p2.X(x), p2.Y(y), 2.6, "xf-dot")
    note(f, 456, T("มุมของแรงดันค้าง e หมุนไปตามสลิปและการชะลอ ยอด ∝ |V_Δ − e| จึงขึ้นลงเป็นคลื่น ('ลอตเตอรีเฟส')",
                   "The angle of e keeps rotating with slip and deceleration, so the peak ∝ |V_Δ − e| rises and falls"))
    note(f, 476, T("ช่วงตายสั้นดีที่สุดแต่ต้องนานกว่าเวลาดับอาร์กของ KM2 · ลำดับตามหลังชนะในช่วง 0–60 ms", "Shortest is best but it must exceed KM2's arc time · the lagging order wins over 0–60 ms"))
    return f.svg()


# =========================================================================== 5 · zoom: open good / open wrong / closed
@fig("yd-zoom")
def _():
    f = F(760, 520, T("กระแสสาย L1 ค่าขณะหนึ่งและแรงบิดช่วงเปลี่ยนจังหวะของปั๊ม: แบบเปิดวงจรลำดับตามหลัง ลำดับมาตรฐาน และแบบปิดวงจรมีตัวต้านทาน",
                      "Instantaneous L1 current and torque of the pump at the changeover: open transition with the lagging order, with the standard order, and closed transition with resistors"), "yd-zoom")
    tr = R["T"]
    rows = [("pump_good", "xf-b", T("เปิดวงจร · ลำดับตามหลัง", "open · lagging order")), ("pump_bad", "xf-d", T("เปิดวงจร · ลำดับมาตรฐาน", "open · standard order")), ("pump_closed", "xf-c", T("ปิดวงจร · Rt = 0.15·Zb", "closed · Rt = 0.15·Zb"))]
    y = 22
    for key, cls, lab in rows:
        d = tr[key]["dense"]
        p = Plot(f, 70, y, 620, 112, (1.45, 1.75), (-12, 12), (-6, 6))
        last = key == "pump_closed"
        p.frame([1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75], [-12, -6, 0, 6, 12], [-6, 0, 6], T("เวลา (s)", "time (s)") if last else None, "i_L1/In", "T/Tn", xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}", y2f=lambda v: f"{v:g}")
        curve(p, [(q[0], q[1]) for q in d], cls, eps=0.2)
        curve(p, [(q[0], q[2]) for q in d], "xf-dash", ax=2)
        if key != "pump_closed":
            f.rect(p.X(1.5), p.y, p.X(1.55) - p.X(1.5), p.h, "xf-fc", 0)
        else:
            f.rect(p.X(1.5), p.y, p.X(1.56) - p.X(1.5), p.h, "xf-fb", 0)
        m = tr[key]["m"]
        extra = T(f" · e {m['e']:.0f} V ∠{m['ph']:.0f}°", f" · e {m['e']:.0f} V ∠{m['ph']:.0f}°") if "e" in m else ""
        f.text(p.X(1.745), p.y + 14, f"{lab}: {T('ยอด', 'peak')} {m['pk']:.2f}·In (rms){extra}", "xf-k", "end")
        y += 150
    note(f, 494, T("แถบเขียว = ช่วงตาย 50 ms · แถบส้ม = 60 ms ผ่านตัวต้านทาน (มอเตอร์ไม่หลุดจากไฟ) · ประ = แรงบิด",
                   "green = 50 ms dead time · orange = 60 ms on the resistors (never disconnected) · dashed = torque"))
    note(f, 512, T("ปั๊ม 80 % เปลี่ยนที่ 1.5 s (1419 rpm) · ช่วงตายมอเตอร์ช้าลง 153 rpm เพราะความเฉื่อยต่ำ", "pump at 80 %, changeover at 1.5 s (1419 rpm) · it loses 153 rpm in the dead time because its inertia is low"))
    return f.svg()


# =========================================================================== 6 · phasor of the transient driving voltage
@fig("yd-phasor")
def _():
    f = F(760, 340, T("แรงดันขับทรานเซียนต์ตอนต่อเดลต้า: ผลต่างเวกเตอร์ระหว่างแรงดันเดลต้า V_Δ กับแรงดันค้าง e ของปั๊มเมื่อต่อ KM3 แบบตามหลังและแบบมาตรฐาน เทียบสตาร์ทตรง",
                      "Transient driving voltage when delta closes: vector difference between the delta voltage V_Δ and the residual voltage e of the pump, lagging and standard KM3 order, compared with DOL"), "yd-phasor")
    cx, cy, sc = 200, 170, 0.36
    g, b = R["T"]["pump_good"]["m"], R["T"]["pump_bad"]["m"]
    f.circ(cx, cy, 400 * sc, "xf-thin")
    def vec(x0, y0, ang, L, c):
        x = x0 + L * sc * math.cos(math.radians(ang)); y = y0 - L * sc * math.sin(math.radians(ang))
        f.line(x0, y0, x, y, c, "end")
        return x, y
    xv, yv = vec(cx, cy, 0, 400, "xf-ln")
    f.text(xv + 6, yv + 4, "V_Δ 400 V", "xf-k")
    for m, c, lab in ((g, "xf-a", T("e ตามหลัง", "e lagging")), (b, "xf-d", T("e มาตรฐาน", "e standard"))):
        xe, ye = vec(cx, cy, m["ph"], m["e"], c)
        f.text(xe + (-8 if m["ph"] < -100 else 6), ye + 14, f"{lab} {m['e']:.0f} V ∠{m['ph']:.0f}°", "xf-ta" if c == "xf-a" else "xf-k", "end" if m["ph"] < -100 else None)
        f.line(xe, ye, xv, yv, c + " xf-dashv" if False else c, "end")
    dg = math.sqrt(400 ** 2 + g["e"] ** 2 - 2 * 400 * g["e"] * math.cos(math.radians(g["ph"])))
    db = math.sqrt(400 ** 2 + b["e"] ** 2 - 2 * 400 * b["e"] * math.cos(math.radians(b["ph"])))
    x0 = 430
    lines = [(T("แรงดันที่ขับทรานเซียนต์ = |V_Δ − e|", "Transient driving voltage = |V_Δ − e|"), "xf-h"),
             (T("DOL: e = 0 → 400 V (อ้างอิง)", "DOL: e = 0 → 400 V (reference)"), "xf-k"),
             (T(f"ตามหลัง: {dg:.0f} V = {dg / 400:.2f}× DOL", f"lagging order: {dg:.0f} V = {dg / 400:.2f}× DOL"), "xf-ta"),
             (T(f"มาตรฐาน: {db:.0f} V = {db / 400:.2f}× DOL", f"standard order: {db:.0f} V = {db / 400:.2f}× DOL"), "xf-k"),
             (T("ยอดจำลอง: ตามหลัง 9.7 · มาตรฐาน 11.5 · DOL 8.9 ×In", "simulated peak: lagging 9.7 · standard 11.5 · DOL 8.9 ×In"), "xf-k"),
             (T("|ΔV|² = V² + e² − 2·V·e·cos θ (สูตร E15)", "|ΔV|² = V² + e² − 2·V·e·cos θ (formula E15)"), "xf-k"),
             (T("ทางลด: e ใหญ่และมุม θ เล็ก →", "To reduce it: large e at small θ →"), "xf-k"),
             (T("ช่วงตายสั้น ต่อแบบตามหลัง หรือแบบปิดวงจร", "short dead time, lagging order or closed transition"), "xf-k")]
    for i, (s, c) in enumerate(lines):
        f.text(x0, 64 + i * 26, s, c)
    note(f, 322, T("มุมวัดจากแรงดันขดลวดเดลต้าใหม่ · ทิศทวนเข็ม = นำหน้า · ปั๊ม 80 % ช่วงตาย 50 ms", "Angles from the new delta winding voltage · counter-clockwise = leading · pump at 80 %, 50 ms dead time"))
    return f.svg()


# =========================================================================== 7 · closed transition
@fig("yd-closed")
def _():
    f = F(760, 380, T("สตาร์-เดลต้าแบบปิดวงจร: ยอดกระแสหลังเปลี่ยนเทียบค่าตัวต้านทานเปลี่ยนจังหวะ Rt/Zb ของปั๊มและพัดลม เทียบแบบเปิดวงจรช่วงตาย 50 ms",
                      "Closed-transition star–delta: peak current after the changeover versus the transition resistor Rt/Zb for the pump and the fan, compared with open transition at 50 ms"), "yd-closed")
    E = R["E4"]
    pl = Plot(f, 70, 26, 610, 250, (0, 1.6), (0, 12))
    pl.frame([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6], [0, 2, 4, 6, 8, 10, 12], xl=T("Rt / Zb (Zb = 400 V ÷ กระแสขดลวดพิกัด)", "Rt / Zb (Zb = 400 V ÷ rated winding current)"), yl=T("ยอด I/In (rms)", "peak I/In (rms)"), xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}")
    for key, cls, lab in (("pump", "xf-b", T("ปั๊ม", "pump")), ("fan", "xf-a", T("พัดลม", "fan"))):
        pts = [(c["rpu"], c["pk"]) for c in E[key]["closed"]]
        curve(pl, pts, cls)
        for x, y in pts:
            f.dot(pl.X(x), pl.Y(y), 3, "xf-dot")
        o = E[key]["open"]["pk"]
        f.line(pl.X(0), pl.Y(o), pl.X(1.6), pl.Y(o), "xf-dash")
        f.text(pl.X(1.58), pl.Y(o) - 5, T(f"{lab} เปิดวงจร {o:.1f}·In", f"{lab} open {o:.1f}·In"), "xf-k", "end")
        f.text(pl.X(pts[0][0]) + 6, pl.Y(pts[0][1]) + 16, f"{lab} {pts[0][1]:.1f}·In", cls.replace("xf-", "xf-t"))
    note(f, 336, T(f"Zb = {E['Zb']:.1f} Ω (7.5 kW) · Rt ≈ 0.1–0.3·Zb ลดยอดเหลือ 30–65 % · ตัวต้านทานรับ < 1 kJ ต่อครั้ง",
                   f"Zb = {E['Zb']:.1f} Ω (7.5 kW) · Rt ≈ 0.1–0.3·Zb cuts the peak to 30–65 % · < 1 kJ per start"))
    note(f, 356, T("ต้องมีคอนแทกเตอร์ตัวที่สี่ (KM4) + ตัวต้านทาน 3 ตัว · Rt ใหญ่เกินไปผลจะเข้าใกล้แบบเปิดวงจร", "Needs a fourth contactor (KM4) and three resistors · too large an Rt behaves like open transition"))
    return f.svg()


# =========================================================================== 8 · starting methods: current, I²t and rotor heat
@fig("yd-energy")
def _():
    f = F(760, 400, T("เปรียบเทียบวิธีสตาร์ทของพัดลมใหญ่: กระแสสูงสุด I²t ของสายจ่าย และความร้อนในโรเตอร์ เทียบเป็นเปอร์เซ็นต์ของสตาร์ทตรง",
                      "Starting methods for the large fan: peak current, supply I²t and rotor heat as a percentage of DOL"), "yd-energy")
    E = R["E10"]["fan"]
    D = E["dynD"]
    items = [("DOL", D["pk"], 100, 100, D["t"]),
             (T("สตาร์-เดลต้า 12 s", "star–delta 12 s"), E["dynY"]["pk"], E["dynY"]["I2t"] / D["I2t"] * 100, E["dynY"]["Er"] / D["Er"] * 100, E["dynY"]["t"]),
             (T("ซอฟต์สตาร์ท 3·In", "soft starter 3·In"), E["soft3"]["Ipk"], E["soft3"]["I2t"] / D["I2t"] * 100, E["soft3"]["Er"] / D["Er"] * 100, E["soft3"]["t"]),
             ("VFD", E["vfd"]["Ipk"], E["vfd"]["I2t"] / D["I2t"] * 100, E["vfd"]["Er"] / D["Er"] * 100, E["vfd"]["t"])]
    pl = Plot(f, 70, 40, 610, 250, (0, 4), (0, 160))
    pl.frame([], [0, 40, 80, 120, 160], yl=T("% ของ DOL", "% of DOL"), yf=lambda v: f"{v:g}")
    for i, (lab, pk, i2t, er, t) in enumerate(items):
        x = i + 0.5
        w = 0.22
        f.rect(pl.X(x - w - 0.02), pl.Y(i2t), pl.X(x - 0.02) - pl.X(x - w - 0.02), pl.Y(0) - pl.Y(i2t), "xf-bara", 0)
        f.rect(pl.X(x + 0.02), pl.Y(er), pl.X(x + w + 0.02) - pl.X(x + 0.02), pl.Y(0) - pl.Y(er), "xf-barb", 0)
        f.text(pl.X(x - w / 2), pl.Y(i2t) - 4, f"{i2t:.0f}", "xf-k", "middle")
        f.text(pl.X(x + w / 2 + 0.04), pl.Y(er) - 4, f"{er:.0f}", "xf-k", "middle")
        f.text(pl.X(x), pl.Y(0) + 16, lab, "xf-h", "middle")
        f.text(pl.X(x), pl.Y(0) + 32, T(f"ยอด {pk:.1f}·In · {t:.1f} s", f"peak {pk:.1f}·In · {t:.1f} s"), "xf-k", "middle")
    f.rect(470, 16, 12, 10, "xf-bara", 0); f.text(486, 25, T("I²t สายจ่าย", "supply I²t"), "xf-k")
    f.rect(580, 16, 12, 10, "xf-barb", 0); f.text(596, 25, T("ความร้อนโรเตอร์", "rotor heat"), "xf-k")
    note(f, 352, T("แรงดันลด (Y-Δ ซอฟต์สตาร์ท) = สลิปสูงนานขึ้น → โรเตอร์ร้อนกว่า DOL · VFD เร่งที่สลิปต่ำ ร้อนน้อยสุด",
                   "Reduced voltage (Y-Δ, soft start) = high slip for longer → hotter rotor than DOL · a VFD stays at low slip"))
    note(f, 372, T("สตาร์-เดลต้าลด I²t ของสายจ่ายราวครึ่งหนึ่ง แต่ยอดกระแสตอนเปลี่ยน 1–3 ไซเคิลยังสูงพอๆ กับ DOL", "Star–delta halves the supply I²t, but the 1–3-cycle changeover peak is still about as high as DOL"))
    note(f, 392, T("ยอด = ค่า rms สูงสุด · ซอฟต์สตาร์ทและ VFD คำนวณแบบ quasi-static (ไม่รวมทรานเซียนต์ไซเคิลแรก)", "peak = highest rms value · soft starter and VFD computed quasi-statically (no first-cycle transient)"))
    return f.svg()


# =========================================================================== 9 · running in Y vs Δ at part load
@fig("yd-yvd")
def _():
    f = F(760, 490, T("เดินมอเตอร์แบบสตาร์เทียบเดลต้าที่โหลดบางส่วน: ประสิทธิภาพ ตัวประกอบกำลัง และกำลังสูญเสียที่ประหยัดได้ พร้อมจุดคุ้มทุนและขอบเขตแรงบิด",
                      "Running in star versus delta at part load: efficiency, power factor and the loss saved, with the break-even point and the torque-margin limit"), "yd-yvd")
    rows = R["E9"]["rows"]
    be = R["E9"]["breakEven"] * 100
    p1 = Plot(f, 70, 26, 610, 220, (0, 100), (0, 100))
    p1.frame([0, 20, 40, 60, 80, 100], [0, 20, 40, 60, 80, 100], yl="η, cos φ (%)", yf=lambda v: f"{v:g}")
    D = [(r["x"] * 100, r["D"]["eta"]) for r in rows]; Yy = [(r["x"] * 100, r["Y"]["eta"]) for r in rows if "Y" in r]
    Dp = [(r["x"] * 100, r["D"]["pf"] * 100) for r in rows]; Yp = [(r["x"] * 100, r["Y"]["pf"] * 100) for r in rows if "Y" in r]
    curve(p1, D, "xf-a"); curve(p1, Yy, "xf-b"); curve(p1, Dp, "xf-dash"); curve(p1, Yp, "xf-c")
    f.rect(p1.X(40), p1.y, p1.X(100) - p1.X(40), p1.h, "xf-fa", 0)
    f.text(p1.X(70), p1.y + 14, T("แรงบิดเผื่อในสตาร์ < 2.5× : ห้ามเดินสตาร์", "star torque margin < 2.5×: do not run in star"), "xf-k", "middle")
    f.text(p1.X(6), p1.Y(D[0][1]) + 14, T("η Δ", "η Δ"), "xf-ta")
    f.text(p1.X(6), p1.Y(Yy[0][1]) - 6, T("η Y", "η Y"), "xf-tb")
    f.text(p1.X(10), p1.Y(Dp[1][1]) + 14, "cos φ Δ", "xf-k")
    f.text(p1.X(12), p1.Y(Yp[1][1]) - 6, "cos φ Y", "xf-tc")
    p2 = Plot(f, 70, 284, 610, 110, (0, 100), (-400, 300))
    p2.frame([0, 20, 40, 60, 80, 100], [-400, -200, 0, 200], xl=T("โหลดที่เพลา (% ของ 7.5 kW)", "shaft load (% of 7.5 kW)"), yl=T("ประหยัด (W)", "saving (W)"), yf=lambda v: f"{v:g}")
    sv = [(r["x"] * 100, r["D"]["Pin"] - r["Y"]["Pin"]) for r in rows if "Y" in r]
    curve(p2, sv, "xf-b")
    f.line(p2.X(0), p2.Y(0), p2.X(100), p2.Y(0), "xf-thin")
    f.line(p2.X(be), p2.y, p2.X(be), p2.y + p2.h, "xf-dash")
    f.text(p2.X(be) + 6, p2.y + p2.h - 8, T(f"จุดคุ้มทุน {be:.1f} %", f"break-even {be:.1f} %"), "xf-k")
    r25 = next(r for r in rows if abs(r["x"] - 0.25) < 1e-9)
    s25 = r25["D"]["Pin"] - r25["Y"]["Pin"]
    f.dot(p2.X(25), p2.Y(s25), 4, "xf-dot")
    f.text(p2.X(25) + 8, p2.Y(s25) - 6, T(f"25 %: {s25:.0f} W · cos φ {r25['D']['pf']:.2f} → {r25['Y']['pf']:.2f}", f"25 %: {s25:.0f} W · cos φ {r25['D']['pf']:.2f} → {r25['Y']['pf']:.2f}"), "xf-k")
    note(f, 452, T("สตาร์: แรงดันขดลวด 1/√3 แกนเหล็กและกระแสแม่เหล็กลด แต่สลิปและทองแดงเพิ่ม — คุ้มเฉพาะโหลดเบา",
                   "Star: 1/√3 winding voltage, less core loss and magnetising current, more slip and copper loss"))
    note(f, 472, T(f"แบบจำลองเชิงเส้น (ไม่อิ่มตัว) · จุดคุ้มทุน {R['E9']['breakEven95'] * 100:.0f}–{R['E9']['breakEven105'] * 100:.0f} % เมื่อแรงดัน 95–105 % · ใช้งานจริงจำกัด ≤ 35–40 %",
                   f"Linear (unsaturated) model · break-even {R['E9']['breakEven95'] * 100:.0f}–{R['E9']['breakEven105'] * 100:.0f} % at 95–105 % voltage · in practice keep ≤ 35–40 %"))
    return f.svg()


# =========================================================================== 10 · supply voltage
@fig("yd-voltage")
def _():
    f = F(760, 330, T("ผลของแรงดันไฟต่อช่วงสตาร์: เวลาถึง 98 % ของความเร็วสมดุลและความเร็วสมดุล ของพัดลมใหญ่และปั๊ม",
                      "Effect of the supply voltage on the star stage: time to 98 % of the equilibrium speed and the equilibrium speed, for the large fan and the pump"), "yd-voltage")
    E = R["E6"]
    pl = Plot(f, 70, 26, 610, 210, (0.79, 1.06), (0, 32), (0.7, 1.0))
    pl.frame([0.8, 0.85, 0.9, 0.95, 1.0, 1.05], [0, 8, 16, 24, 32], [0.7, 0.8, 0.9, 1.0], T("แรงดันไฟขณะสตาร์ท (pu ของ 400 V)", "supply voltage during the start (pu of 400 V)"), T("t98 พัดลม (s)", "fan t98 (s)"), "n_Y / n_N",
             xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}", y2f=lambda v: f"{v:g}")
    fan = [(d["v"], d["t98"]) for d in E["fan"] if d["ok"] and d["t98"] is not None]
    curve(pl, fan, "xf-a")
    for x, y in fan:
        f.dot(pl.X(x), pl.Y(y), 3, "xf-dot")
        f.text(pl.X(x), pl.Y(y) - 7, f"{y:.0f} s", "xf-k", "middle")
    for key, cls in (("fan", "xf-dash"), ("pump", "xf-c")):
        curve(pl, [(d["v"], d["nY"]) for d in E[key] if d["ok"]], cls, ax=2)
    f.text(pl.X(0.8) + 4, pl.Y(0.86, 2), T("n_Y ปั๊ม (ขวา)", "pump n_Y (right)"), "xf-tc")
    f.text(pl.X(0.8) + 4, pl.Y(0.735, 2) - 4, T("n_Y พัดลม (ขวา, ประ)", "fan n_Y (right, dashed)"), "xf-k")
    note(f, 282, T("แรงดัน −10 % → แรงบิด −19 % → พัดลม 15 s กลายเป็น 25 s และสมดุลที่ 89 % แทน 94 %",
                   "−10 % voltage → −19 % torque → the fan needs 25 s instead of 15 s and settles at 89 %, not 94 %"))
    note(f, 302, T("สายพาน 50 % ที่แรงดัน ≤ 90 %: แรงบิดสตาร์ 0.58·Tn < แรงบิดออกตัว 0.6·Tn → ไม่ออกตัว", "Conveyor at 50 %, ≤ 90 % voltage: star torque 0.58·Tn < breakaway 0.6·Tn → no start"))
    return f.svg()


# =========================================================================== 11 · voltage dip at the PCC
@fig("yd-dip")
def _():
    f = F(760, 336, T("แรงดันตกที่จุดต่อร่วมเมื่อสตาร์ทมอเตอร์: สตาร์ทตรง ช่วงสตาร์ และยอด 1–2 ไซเคิลตอนเปลี่ยนเป็นเดลต้า สำหรับหม้อแปลงและเครื่องกำเนิดไฟฟ้า",
                      "Voltage dip at the point of common coupling while starting: DOL, the star stage and the 1–2-cycle peak at the change to delta, on transformers and generator sets"), "yd-dip")
    E = R["E12"]
    pl = Plot(f, 70, 30, 610, 200, (0, 4), (0, 45))
    pl.frame([], [0, 10, 20, 30, 40], yl=T("แรงดันตก (%)", "voltage dip (%)"), yf=lambda v: f"{v:g}")
    labs = [T("37 kW · หม้อแปลง 250 kVA", "37 kW · 250 kVA transformer"), T("37 kW · เจน 100 kVA", "37 kW · 100 kVA genset"), T("75 kW · หม้อแปลง 500 kVA", "75 kW · 500 kVA transformer"), T("15 kW · เจน 50 kVA", "15 kW · 50 kVA genset")]
    for i, (c, lab) in enumerate(zip(E, labs)):
        x = i + 0.5
        for j, (v, cls) in enumerate(((c["dol"], "xf-bara"), (c["star"], "xf-barb"), (c["sw"], "xf-fill"))):
            x0 = x - 0.33 + j * 0.22
            f.rect(pl.X(x0), pl.Y(v), pl.X(x0 + 0.2) - pl.X(x0), pl.Y(0) - pl.Y(v), cls, 0)
            f.text(pl.X(x0 + 0.1), pl.Y(v) - 4, f"{v:.1f}", "xf-k", "middle")
        a_, b_ = lab.split(" · ")
        f.text(pl.X(x), pl.Y(0) + 16, a_, "xf-k", "middle"); f.text(pl.X(x), pl.Y(0) + 30, b_, "xf-k", "middle")
    f.rect(330, 10, 12, 10, "xf-bara", 0); f.text(346, 19, "DOL", "xf-k")
    f.rect(390, 10, 12, 10, "xf-barb", 0); f.text(406, 19, T("ช่วงสตาร์", "star stage"), "xf-k")
    f.rect(480, 10, 12, 10, "xf-fill", 0); f.text(496, 19, T("ยอดตอนเปลี่ยน (1–2 ไซเคิล)", "changeover peak (1–2 cycles)"), "xf-k")
    note(f, 286, T("ΔV ≈ S_m/(S_sc + S_m) · หม้อแปลง S_sc = S/uk · เจน S_sc ≈ S/x″d · S_m = √3·400·I",
                   "ΔV ≈ S_m/(S_sc + S_m) · transformer S_sc = S/uk · genset S_sc ≈ S/x″d · S_m = √3·400·I"))
    note(f, 304, T("หม้อแปลง: Y-Δ ลดแรงดันตกต่อเนื่องเหลือ 1/3 · เจน: ยอดตอนเปลี่ยนตก > 30 % คอนแทกเตอร์อาจหลุด",
                   "transformer: Y-Δ cuts the sustained dip to 1/3 · genset: the changeover peak dips > 30 %"))
    note(f, 322, T("มอเตอร์ปรับสเกลจากแบบจำลอง 7.5 kW (In ∝ kW) · ประมาณมุมกระแสเท่ากับมุมแหล่งจ่าย", "motors scaled from the 7.5 kW model (In ∝ kW) · current and source angles assumed equal"))
    return f.svg()


# =========================================================================== driver
def render(key):
    if key.endswith("-en") and key[:-3] in FIGS:
        M.LANG[0] = "en"
        try:
            return FIGS[key[:-3]]()
        finally:
            M.LANG[0] = "th"
    return FIGS[key]() if key in FIGS else None


def main():
    force = "--all" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")] or sorted(glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True))
    total, cache, missing = 0, {}, set()
    for fpath in files:
        src = open(fpath, encoding="utf-8").read()

        def rep(m):
            key, body = m.group(1), m.group(2)
            base = key[:-3] if key.endswith("-en") else key
            if not base.startswith("yd-"):
                return m.group(0)
            if base not in FIGS:
                missing.add(key)
                return m.group(0)
            if body and not force:
                return m.group(0)
            if key not in cache:
                cache[key] = render(key)
            return f"<!--FIG:{key}-->" + cache[key] + "<!--/FIG-->"
        out = re.sub(r"<!--FIG:([\w-]+)-->(<svg[\s\S]*?</svg>)?<!--/FIG-->", rep, src)
        if out != src:
            open(fpath, "w", encoding="utf-8").write(out)
            total += 1
            print("updated", os.path.relpath(fpath, ROOT))
    if missing:
        print("unknown yd keys:", ", ".join(sorted(missing)))
    print(total, "file(s) updated")


if __name__ == "__main__":
    if "--list" in sys.argv:
        print("\n".join(sorted(FIGS)))
    elif "--preview" in sys.argv:
        out = ['<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../assets/site.css"><body class="mc" style="padding:20px;background:var(--paper)"><article class="mc">']
        for k in sorted(FIGS):
            for kk in (k, k + "-en"):
                out.append(f'<h3 style="font:14px monospace">{kk}</h3><figure class="xfig" style="max-width:820px">{render(kk)}</figure>')
        open(sys.argv[sys.argv.index("--preview") + 1], "w", encoding="utf-8").write("".join(out) + "</article>")
    else:
        main()
