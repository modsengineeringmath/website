# Figures for /learn/ac-induction-motor/ (src/pages/learn/ac-induction-motor.html).
# Usage: python3 scripts/acm_figs.py          fills empty <!--FIG:acm-…--><!--/FIG--> blocks in src/pages
#        python3 scripts/acm_figs.py --all    redraws every acm- figure
#        python3 scripts/acm_figs.py --preview out.html   writes every figure into one page for checking
# Every curve is computed from scripts/acm_model.py (equivalent circuits, αβ dynamic model, single-phase two-winding model).
# Drawing primitives (F, Plot) and the single-line symbols come from scripts/mc_figs.py so the style matches the motor series.
import glob, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import mc_figs as M
from mc_figs import F, Plot, f1, s_cb, s_kmain, s_iso, s_therm, s_motor, s_xfmr
import acm_model as A

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}
IN, TN, NN = A.IN, A.TN, A.NN


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def tn(rotor="dc", V=A.VP, f=50.0, rext=0.0, scale=1.0, n0=0, n1=None, step=5):
    """(n, T/Tn) and (n, I/In) lists. scale=1/3 draws the star connection (I and T both /3)."""
    ns_ = 1500 * f / 50
    n1 = ns_ - 0.5 if n1 is None else n1
    T_, I_ = [], []
    n = n0
    while n <= n1:
        I, T, _ = A.motor(A.n2s(n, f), V, f, rotor, rext)
        T_.append((n, T / TN * scale)); I_.append((n, I / IN * scale))
        n += step
    I, T, _ = A.motor(A.n2s(n1, f), V, f, rotor, rext)
    T_.append((n1, T / TN * scale)); I_.append((n1, I / IN * scale))
    return T_, I_


def _rdp(P, eps):
    """Ramer–Douglas–Peucker on an (N,2) pixel array, iterative. Keeps the shape within eps px."""
    n = len(P)
    if n < 3:
        return P
    keep = np.zeros(n, bool); keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        A_, B_ = P[a], P[b]
        d = B_ - A_
        L = math.hypot(d[0], d[1])
        seg = P[a + 1:b]
        if L < 1e-9:
            dist = np.hypot(seg[:, 0] - A_[0], seg[:, 1] - A_[1])
        else:
            dist = np.abs(d[0] * (seg[:, 1] - A_[1]) - d[1] * (seg[:, 0] - A_[0])) / L
        k = int(np.argmax(dist))
        if dist[k] > eps:
            m = a + 1 + k
            keep[m] = True
            stack.append((a, m)); stack.append((m, b))
    return P[keep]


def curve(pl, pts, cls, ax=1, clip=True, eps=0.12):
    """Plot.curve with pixel-space simplification and clipping to the plot box (vertical)."""
    if not pts:
        return
    P = np.array([(pl.X(a), pl.Y(b, ax)) for a, b in pts], float)
    y0, y1 = pl.y - 1, pl.y + pl.h + 1
    if clip:
        inside = (P[:, 1] >= y0) & (P[:, 1] <= y1)
        runs, cur = [], []
        for i in range(len(P)):
            if inside[i]:
                cur.append(P[i])
            elif cur:
                runs.append(cur); cur = []
        if cur:
            runs.append(cur)
    else:
        runs = [list(P)]
    for r in runs:
        if len(r) < 2:
            continue
        Q = _rdp(np.array(r), eps)
        pl.f.poly([(x, y) for x, y in Q], cls)


def load_pts(kind, k=1.0, n0=0, n1=1500, step=10):
    return [(n, A.load_T(kind, n, k) / TN) for n in range(n0, n1 + 1, step)]


def note(f, y, s):
    f.text(f.w / 2, y, s, "xf-m", "middle")


def arrow(f, x1, y1, x2, y2, c="xf-ln"):
    f.line(x1, y1, x2, y2, c, "end")


def box(f, x, y, w, h, title, lines=(), c="xf-box", tc="xf-h"):
    f.rect(x, y, w, h, c, 8)
    f.text(x + w / 2, y + 18, title, tc, "middle")
    for i, s in enumerate(lines):
        f.text(x + w / 2, y + 35 + i * 15, s, "xf-k", "middle")


# =========================================================================== 1 · GRID AND SUPPLY
@fig("acm-grid")
def _():
    f = F(760, 400, "ระบบไฟฟ้ากำลังของประเทศไทยจากโรงไฟฟ้าถึงมอเตอร์: ผลิต 10–24 kV ส่ง 500 230 115 kV โดย กฟผ. จำหน่าย 22 33 kV กฟภ. และ 24 12 kV กฟน. แปลงเป็น 230/400 V", "acm-grid")
    W_, H_ = 168, 82
    xs = [14, 202, 390, 578]
    y1, y2 = 34, 214
    top = [("โรงไฟฟ้า (Generation)", ["เครื่องกำเนิด 3 เฟส 50 Hz", "แรงดัน 10–24 kV"], "xf-boxb"),
           ("หม้อแปลงเพิ่มแรงดัน", ["Step-up transformer", "→ 500 / 230 / 115 kV"], "xf-box"),
           ("ระบบส่ง (Transmission)", ["สายส่ง กฟผ. (EGAT)", "500 · 230 · 115 (69) kV"], "xf-boxa"),
           ("สถานีไฟฟ้าย่อย", ["Substation", "→ 115 · 69 kV"], "xf-box")]
    for x, (t, ls, c) in zip(xs, top):
        box(f, x, y1, W_, H_, t, ls, c)
    for i in range(3):
        arrow(f, xs[i] + W_ + 2, y1 + H_ / 2, xs[i + 1] - 4, y1 + H_ / 2)
    bot = [("ระบบจำหน่ายแรงกลาง", ["กฟภ. (PEA) 22 · 33 kV", "กฟน. (MEA) 24 · 12 kV"], "xf-boxa"),
           ("หม้อแปลงจำหน่าย", ["Distribution transformer", "22 kV / 416-240 V  Dyn11"], "xf-box"),
           ("แรงต่ำ (Low voltage)", ["3 เฟส 4 สาย 230/400 V", "1 เฟส 2 สาย 230 V"], "xf-boxc"),
           ("มอเตอร์ (Load)", ["บ้าน: 1 เฟส 230 V", "โรงงาน: 3 เฟส 400 V"], "xf-boxb")]
    for x, (t, ls, c) in zip(xs, bot):
        box(f, x, y2, W_, H_, t, ls, c)
    for i in range(3):
        arrow(f, xs[i] + W_ + 2, y2 + H_ / 2, xs[i + 1] - 4, y2 + H_ / 2)
    # turn from substation down to distribution
    f.path(f"M {xs[3] + W_ / 2} {y1 + H_} L {xs[3] + W_ / 2} {y1 + H_ + 24} L {xs[0] + W_ / 2} {y1 + H_ + 24} L {xs[0] + W_ / 2} {y2 - 4}", "xf-ln", "end")
    # customer taps
    f.text(xs[3] + W_ / 2, y1 + H_ + 42, "", "xf-k", "middle")
    cy = 330
    taps = [(xs[3] + W_ / 2 - 40, y1 + H_ + 24, "โรงงานใหญ่รับ 115 kV", "มีสถานีไฟฟ้าย่อยของตัวเอง"),
            (xs[0] + W_ / 2, y2 + H_, "โรงงานขนาดกลาง–ใหญ่รับ 22/24/33 kV", "ติดตั้งหม้อแปลงของโรงงานเอง"),
            (xs[2] + W_ / 2, y2 + H_, "บ้าน ร้านค้า โรงงานเล็ก", "รับแรงต่ำผ่านมิเตอร์ของการไฟฟ้า")]
    f.circ(taps[0][0], taps[0][1], 4, "xf-dot")
    f.text(taps[0][0], taps[0][1] + 18, taps[0][2] + " · " + taps[0][3], "xf-tb", "middle")
    for x, y, a, b in taps[1:]:
        f.line(x, y, x, cy - 14, "xf-dash")
        f.text(x, cy, a, "xf-tb", "middle"); f.text(x, cy + 15, b, "xf-k", "middle")
    note(f, 386, "แรงดันสูงทำให้กระแสในสายส่งต่ำ: กำลังเท่ากัน แรงดันเพิ่ม 10 เท่า กระแสลด 10 เท่า กำลังสูญเสีย I²R ลด 100 เท่า")
    return f.svg()


@fig("acm-supply-paths")
def _():
    f = F(760, 470, "แผนภาพเส้นเดียวของไฟเข้ามอเตอร์: โรงงานรับ 22 kV ผ่านหม้อแปลง 500 kVA Dyn11 ตู้ MDB ตู้ MCC เบรกเกอร์ คอนแทกเตอร์ โอเวอร์โหลด ถึงมอเตอร์ 3 เฟส และบ้านรับ 230 V ผ่านมิเตอร์ เมนเบรกเกอร์ RCBO ถึงปั๊มน้ำ 1 เฟส", "acm-supply-paths")
    # factory
    x = 150
    f.text(x, 22, "โรงงาน (3 เฟส)", "xf-h", "middle")
    f.line(x, 30, x, 44); f.text(x + 14, 40, "สายจำหน่าย 22 kV (กฟภ.)", "xf-k")
    s_iso(f, x, 44); f.text(x + 14, 72, "สวิตช์ตัดตอนแรงสูง + ล่อฟ้า", "xf-k")
    s_xfmr(f, x, 96); f.text(x + 18, 118, "หม้อแปลง 500 kVA 22 kV/416-240 V", "xf-k"); f.text(x + 18, 132, "Dyn11 · uk 4 % → Ik ≈ 18 kA", "xf-k")
    f.line(x - 70, 154, x + 70, 154, "xf-bus"); f.text(x + 76, 158, "MDB", "xf-tag")
    s_cb(f, x, 154); f.text(x + 14, 184, "เบรกเกอร์สายป้อน", "xf-k")
    f.line(x, 206, x, 222)
    f.line(x - 70, 222, x + 70, 222, "xf-bus"); f.text(x + 76, 226, "MCC", "xf-tag")
    s_cb(f, x, 222); f.text(x + 14, 248, "MPCB / MCCB (-Q1)", "xf-k")
    s_kmain(f, x, 274); f.text(x + 14, 300, "คอนแทกเตอร์ AC-3 (-K1)", "xf-k")
    s_therm(f, x, 326); f.text(x + 30, 352, "โอเวอร์โหลด (-F2)", "xf-k")
    f.line(x, 378, x, 396); f.text(x + 14, 392, "สาย 3 เฟส + PE", "xf-k")
    s_motor(f, x, 396); f.text(x + 30, 422, "M 3~ 7.5 kW 400 V Δ", "xf-k")
    # house
    x = 520
    f.text(x, 22, "บ้านพักอาศัย (1 เฟส)", "xf-h", "middle")
    f.line(x, 30, x, 44); f.text(x + 14, 40, "หม้อแปลงบนเสา 22 kV/416-240 V", "xf-k")
    f.line(x, 44, x, 96); f.text(x + 14, 72, "สายเมน L + N 230 V", "xf-k")
    f.rect(x - 22, 96, 44, 30, "xf-box", 4); f.text(x, 116, "kWh", "xf-m", "middle"); f.text(x + 30, 112, "มิเตอร์ 15(45) A", "xf-k")
    f.line(x, 126, x, 154)
    f.line(x - 70, 154, x + 70, 154, "xf-bus"); f.text(x + 76, 158, "ตู้", "xf-tag")
    s_cb(f, x, 154); f.text(x + 14, 184, "เมนเบรกเกอร์ 2P", "xf-k")
    f.line(x, 206, x, 222)
    f.line(x - 70, 222, x + 70, 222, "xf-bus")
    s_cb(f, x, 222); f.text(x + 14, 248, "RCBO 16 A 30 mA (C)", "xf-k")
    f.line(x, 274, x, 402); f.text(x + 14, 300, "สาย 2.5 mm² (L, N) + สายดิน PE", "xf-k")
    f.text(x + 14, 318, "ยาว 30 m · แรงดันตกในสายขณะสตาร์ท ≈ 3 %", "xf-k")
    f.text(x + 14, 352, "คาปาซิเตอร์และสวิตช์แรงเหวี่ยง", "xf-k"); f.text(x + 14, 368, "อยู่ในตัวมอเตอร์", "xf-k")
    f.circ(x, 422, 20, "xf-motor"); f.text(x, 421, "M", "xf-h", "middle"); f.text(x, 435, "1~", "xf-k", "middle")
    f.text(x + 30, 422, "ปั๊มน้ำ 0.75 kW 230 V (CS)", "xf-k")
    note(f, 462, "โรงงานเป็นเจ้าของหม้อแปลงและเลือกระบบสายดินเอง · บ้านรับไฟแรงต่ำจากการไฟฟ้า ระดับกระแสลัดวงจรต่ำกว่ามาก")
    return f.svg()


# =========================================================================== 2 · SINGLE-PHASE MOTORS
@fig("acm-1ph-field")
def _():
    f = F(760, 250, "สนามแม่เหล็กของขดลวด 1 เฟสเป็นสนามพัลส์อยู่กับที่ แยกได้เป็นสนามหมุนสองสนามขนาดครึ่งหนึ่งหมุนสวนทางกัน", "acm-1ph-field")
    for i, d in enumerate([0, 45, 90, 135, 180]):
        cx, cy, R = 80 + i * 150, 110, 52
        f.circ(cx, cy, R + 6, "xf-thin")
        a = math.radians(d)
        bf = (0.5 * R * math.cos(a), 0.5 * R * math.sin(a))
        bb = (0.5 * R * math.cos(a), -0.5 * R * math.sin(a))
        f.line(cx, cy, cx + bf[0] * 0 + 0.5 * R * math.sin(a) * 0, cy, "xf-thin")
        # main axis vertical: pulsating along vertical axis; use vertical as winding axis
        fx, fy = 0.5 * R * math.sin(a), -0.5 * R * math.cos(a)
        f.line(cx, cy, cx + fx, cy + fy, "xf-b", "end")
        f.line(cx, cy, cx - fx, cy + fy, "xf-c", "end")
        ry = -R * math.cos(a)
        if abs(ry) > 3:
            f.line(cx, cy, cx, cy + ry, "xf-a", "end")
        f.text(cx, cy + R + 26, f"ωt = {d}°", "xf-k", "middle")
    f.text(80, 22, "สีน้ำเงิน = สนามลัพธ์ (พัลส์ขึ้นลงบนแกนเดียว ไม่หมุน)", "xf-ta")
    f.text(80, 38, "สีส้ม = สนามหมุนตามเข็ม · สีเขียว = สนามหมุนทวนเข็ม (ขนาดครึ่งหนึ่งเท่ากัน)", "xf-tb")
    note(f, 238, "ตอนหยุดนิ่ง แรงบิดจากสองสนามหักล้างกันพอดี → มอเตอร์ 1 เฟสล้วนไม่มีแรงบิดเริ่ม ต้องมีขดลวดช่วยสร้างสนามหมุน")
    return f.svg()


@fig("acm-1ph-curves")
def _():
    f = F(760, 420, "กราฟแรงบิด-ความเร็วของมอเตอร์ 1 เฟส 0.75 kW: แรงบิดสนามหน้า สนามหลัง และสุทธิของขดลวดหลักอย่างเดียว แบบคาปาซิเตอร์สตาร์ทที่ตัดขดช่วยที่ 75 % ความเร็ว และแบบ PSC พร้อมเส้นโหลดปั๊มและคอมเพรสเซอร์", "acm-1ph-curves")
    pl = Plot(f, 66, 26, 620, 280, (0, 1500), (-1.5, 5.5))
    pl.frame(range(0, 1501, 250), [-1, 0, 1, 2, 3, 4, 5], xl="ความเร็วรอบ n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    f.line(pl.X(0), pl.Y(0), pl.X(1500), pl.Y(0), "xf-thin")
    ns = list(range(0, 1500, 6)) + [1499]
    sp = {n: A.sp_motor(1 - n / 1500) for n in ns}
    curve(pl, [(n, sp[n]["Tf"] / A.SP_TN) for n in ns], "xf-dash")
    curve(pl, [(n, -sp[n]["Tb"] / A.SP_TN) for n in ns], "xf-dash")
    curve(pl, [(n, sp[n]["T"] / A.SP_TN) for n in ns], "xf-b")
    nsw = 1125
    Tcs = [(n, A.sp_motor(1 - n / 1500, A.C_START)["T"] / A.SP_TN) for n in ns if n <= nsw]
    curve(pl, Tcs, "xf-a")
    t1 = A.sp_motor(1 - nsw / 1500, A.C_START)["T"] / A.SP_TN; t2 = A.sp_motor(1 - nsw / 1500)["T"] / A.SP_TN
    f.line(pl.X(nsw), pl.Y(t1), pl.X(nsw), pl.Y(t2) - 3, "xf-a", "end")
    Tp = [(n, A.sp_motor(1 - n / 1500, A.C_RUN)["T"] / A.SP_TN) for n in ns]
    curve(pl, Tp, "xf-d")
    curve(pl, [(n, 0.1 + 0.9 * (n / 1446) ** 2) for n in range(0, 1501, 20)], "xf-c")
    curve(pl, [(0, 1.3), (14, 1.3), (15, 1.0), (1500, 1.0)], "xf-e")
    f.text(pl.X(30), pl.Y(Tcs[0][1]) - 10, f"คาปาซิเตอร์สตาร์ท (150 µF): Ts = {Tcs[0][1]:.1f}·Tn", "xf-ta")
    f.text(pl.X(nsw) + 8, pl.Y((t1 + t2) / 2) + 4, "สวิตช์แรงเหวี่ยงตัด ~75 %", "xf-ta")
    f.text(pl.X(30), pl.Y(-0.4), f"PSC (20 µF ต่อค้าง): Ts = {Tp[0][1]:.2f}·Tn · ขดหลักอย่างเดียว: Ts = 0", "xf-k")
    f.text(pl.X(1290), pl.Y(3.62), "PSC", "xf-k", "middle")
    f.text(pl.X(1140), pl.Y(2.45), "สุทธิ = หน้า − หลัง", "xf-tb", "middle")
    f.text(pl.X(620), pl.Y(sp[618]["Tf"] / A.SP_TN) - 8, "สนามหน้า (forward)", "xf-k", "middle")
    f.text(pl.X(620), pl.Y(-sp[618]["Tb"] / A.SP_TN) + 16, "สนามหลัง (backward)", "xf-k", "middle")
    f.text(pl.X(1230), pl.Y(0.1 + 0.9 * (1230 / 1446) ** 2) + 18, "ปั๊มหอยโข่ง", "xf-tc", "middle")
    f.text(pl.X(1490), pl.Y(1.0) - 8, "คอมเพรสเซอร์ (แรงบิดคงที่)", "xf-k", "end")
    note(f, 362, "PSC เริ่มหมุนได้เฉพาะโหลดเบา (พัดลม ปั๊มหอยโข่ง) · คอมเพรสเซอร์ที่ความดันยังไม่สมดุลต้องใช้คาปาซิเตอร์สตาร์ทช่วย")
    note(f, 380, "แบบจำลองสองขดลวด (symmetrical components) ของมอเตอร์ตัวอย่าง 0.75 kW 4 ขั้ว 230 V 50 Hz")
    note(f, 398, f"In ≈ {A.SP_IN:.1f} A (ขดหลัก) · ความเร็วพิกัด ≈ {1500 * (1 - A.SP_SR):.0f} rpm · กระแสสตาร์ท ≈ {A.sp_motor(1, A.C_START)['I']:.0f} A")
    return f.svg()


@fig("acm-1ph-wiring")
def _():
    f = F(760, 320, "การต่อมอเตอร์ 1 เฟส: แบบคาปาซิเตอร์สตาร์ทมีสวิตช์แรงเหวี่ยง แบบ PSC คาปาซิเตอร์ต่อค้าง และแบบสองคาปาซิเตอร์ CSCR พร้อมวิธีกลับทางหมุน", "acm-1ph-wiring")
    def coil(x, y, h, lab):
        n = 4; r = h / n / 2
        f.path(f"M {f1(x)} {f1(y)} " + " ".join(f"a {f1(r)} {f1(r)} 0 0 1 0 {f1(2 * r)}" for _ in range(n)), "xf-ln")
        f.text(x + 14, y + h / 2 + 4, lab, "xf-k")
    def cap(x, y, lab, left=False):
        f.line(x - 10, y, x + 10, y); f.line(x - 10, y + 6, x + 10, y + 6)
        if lab:
            f.text(x - 14 if left else x + 14, y + 7, lab, "xf-k", "end" if left else None)
    def sw(x, y, lab):
        f.line(x, y, x - 9, y + 16); f.dot(x, y + 18, 2.4)
        if lab:
            f.text(x + 10, y + 14, lab, "xf-k")
    titles = ["คาปาซิเตอร์สตาร์ท (CS)", "PSC (ต่อค้าง)", "CSCR (สองตัว)"]
    for k in range(3):
        x0 = 40 + k * 250
        f.text(x0 + 90, 22, titles[k], "xf-h", "middle")
        L, N = 50, 240
        f.text(x0, L - 6, "L", "xf-tag"); f.text(x0, N + 16, "N", "xf-tag")
        f.line(x0, L, x0 + 190, L); f.line(x0, N, x0 + 190, N)
        xm, xa = x0 + 40, x0 + 140
        f.line(xm, L, xm, 110); coil(xm, 110, 72, "ขดหลัก"); f.line(xm, 182, xm, N)
        f.dot(xm, L); f.dot(xm, N); f.dot(xa, L); f.dot(xa, N)
        if k == 0:
            f.line(xa, L, xa, 70); cap(xa, 70, "C สตาร์ท"); f.line(xa, 76, xa, 92); sw(xa, 92, "S แรงเหวี่ยง"); f.line(xa, 110, xa, 118)
            coil(xa, 118, 64, "ขดช่วย"); f.line(xa, 182, xa, N)
        elif k == 1:
            f.line(xa, L, xa, 90); cap(xa, 90, "C รัน 20 µF"); f.line(xa, 96, xa, 118)
            coil(xa, 118, 64, "ขดช่วย"); f.line(xa, 182, xa, N)
        else:
            f.line(xa, L, xa, 62); f.line(xa - 34, 62, xa + 34, 62)
            f.line(xa - 34, 62, xa - 34, 78); cap(xa - 34, 78, "C รัน", left=True); f.line(xa - 34, 84, xa - 34, 108)
            f.line(xa + 34, 62, xa + 34, 70); cap(xa + 34, 70, "C สตาร์ท"); f.line(xa + 34, 76, xa + 34, 84); sw(xa + 34, 84, "")
            f.line(xa + 34, 102, xa + 34, 108); f.line(xa - 34, 108, xa + 34, 108); f.line(xa, 108, xa, 118)
            coil(xa, 118, 64, "ขดช่วย"); f.line(xa, 182, xa, N)
    note(f, 276, "กลับทางหมุน: สลับปลายขดช่วย (หรือขดหลัก) อย่างใดอย่างหนึ่ง — สลับสาย L กับ N ไม่ทำให้กลับทาง")
    note(f, 294, "C สตาร์ทเป็นอิเล็กโทรไลต์ AC ต่อได้เฉพาะช่วงสตาร์ท · C รันเป็นฟิล์ม (MKP) ต่อค้างได้")
    note(f, 312, "เปลี่ยนคาปาซิเตอร์ให้ค่า µF และแรงดันพิกัด (≥ 400–450 V AC) เท่าของเดิมเสมอ")
    return f.svg()


# =========================================================================== 3 · ROTOR TYPES
@fig("acm-rotor-sections")
def _():
    f = F(760, 300, "ภาพตัดร่องโรเตอร์: กรงกระรอกแท่งกลม แท่งลึก (deep bar) กรงคู่ (double cage) และโรเตอร์พันขดลวดพร้อมสลิปริงและตัวต้านทานภายนอก", "acm-rotor-sections")
    def slot(x, y, w, h):
        f.path(f"M {x - w / 2} {y + h} L {x - w / 2} {y + 12} L {x - 3} {y + 6} L {x - 3} {y} M {x + 3} {y} L {x + 3} {y + 6} L {x + w / 2} {y + 12} L {x + w / 2} {y + h}", "xf-ln")
        f.line(x - w / 2, y + h, x + w / 2, y + h)
    labs = [("กรงกระรอกเดี่ยว", "แท่งกลม/ตื้น R ต่ำ", "แรงบิดเริ่มต่ำ กระแสสูง"),
            ("แท่งลึก (deep bar)", "ปรากฏการณ์ผิว (skin effect)", "R สูงตอนสตาร์ท R ต่ำตอนวิ่ง"),
            ("กรงคู่ (double cage)", "กรงนอก R สูง X ต่ำ", "กรงในใหญ่ R ต่ำ X สูง"),
            ("โรเตอร์พันขดลวด", "สลิปริง + แปรงถ่าน", "ปรับ R ภายนอกได้")]
    f.line(20, 46, 740, 46, "xf-dash"); f.text(26, 40, "ช่องว่างอากาศ (air gap)", "xf-k")
    for i, (a, b, c) in enumerate(labs):
        x = 100 + i * 186
        y = 50
        if i == 0:
            slot(x, y, 26, 80); f.circ(x, y + 30, 10, "xf-boxb")
        elif i == 1:
            slot(x, y, 18, 130); f.rect(x - 7, y + 14, 14, 112, "xf-boxb", 2)
            for k in range(6):
                f.line(x - 7, y + 20 + k * 3, x + 7, y + 20 + k * 3, "xf-thin")
        elif i == 2:
            slot(x, y, 26, 130); f.circ(x, y + 22, 7, "xf-boxa"); f.line(x, y + 30, x, y + 58, "xf-thin")
            f.rect(x - 11, y + 60, 22, 64, "xf-boxb", 3)
            f.text(x + 18, y + 26, "นอก", "xf-k"); f.text(x + 18, y + 96, "ใน", "xf-k")
        else:
            slot(x, y, 26, 100)
            for k in range(4):
                f.circ(x - 5, y + 24 + k * 18, 5, "xf-box"); f.circ(x + 5, y + 24 + k * 18, 5, "xf-box")
        f.text(x, 214, a, "xf-h", "middle"); f.text(x, 232, b, "xf-k", "middle"); f.text(x, 248, c, "xf-k", "middle")
    # slip rings sketch
    x = 658
    for k in range(3):
        f.rect(x + 34, 70 + k * 26, 10, 18, "xf-metal", 2)
        f.line(x + 44, 79 + k * 26, x + 66, 79 + k * 26)
    f.rect(x + 66, 66, 16, 70, "xf-box", 2); f.text(x + 74, 150, "R ภายนอก", "xf-k", "middle")
    note(f, 284, "ร่องลึกหรือกรงคู่ทำให้ความต้านทานโรเตอร์ “เปลี่ยนเองตามความถี่โรเตอร์ f₂ = s·f” — สูงตอนสตาร์ท (f₂ = 50 Hz) ต่ำตอนวิ่ง (f₂ ≈ 1 Hz)")
    return f.svg()


@fig("acm-deep-bar")
def _():
    f = F(760, 340, "การกระจายความหนาแน่นกระแสในแท่งโรเตอร์ลึก 30 mm ตอนสตาร์ท (50 Hz) เทียบตอนวิ่ง (1 Hz) และอัตราส่วน Rac/Rdc เทียบสลิป", "acm-deep-bar")
    pl = Plot(f, 70, 30, 280, 200, (0, 3.2), (0, 30))
    pl.frame([0, 1, 2, 3], [0, 10, 20, 30], xl="J / J เฉลี่ย", yl="ระยะจากก้นร่อง (mm)", yf=lambda t: f"{t:g}")
    for f2, c in ((50, "xf-b"), (1.0, "xf-a")):
        d, kr, kx, ys, J = A.deep_bar(30, f2)
        curve(pl, [(J[i], ys[i] * 30) for i in range(len(ys))], c)
    d50 = A.deep_bar(30, 50); d1 = A.deep_bar(30, 1.0)
    f.text(pl.X(1.2), pl.Y(11), f"สตาร์ท f₂ = 50 Hz · δ = {d50[0]:.1f} mm", "xf-tb")
    f.text(pl.X(1.2), pl.Y(5), f"วิ่ง f₂ = 1 Hz · δ = {d1[0]:.0f} mm", "xf-ta")
    f.text(pl.X(3.1), pl.Y(30) - 8, "↑ ด้านช่องอากาศ", "xf-k", "end")
    pr = Plot(f, 440, 30, 280, 200, (0, 1), (0.8, 2.6))
    pr.frame([0, 0.25, 0.5, 0.75, 1], [1, 1.5, 2, 2.5], xl="สลิป s (f₂ = s × 50 Hz)", yl="Rac/Rdc", xf=lambda t: f"{t:g}", yf=lambda t: f"{t:g}")
    curve(pr, [(i / 100, A.deep_bar(30, 50 * i / 100)[1]) for i in range(1, 101)], "xf-b")
    f.text(pr.X(0.96), pr.Y(d50[1]) + 20, f"{d50[1]:.2f}× ที่ s = 1", "xf-tb", "end")
    f.text(pr.X(0.04), pr.Y(1.12), "≈ 1.0 ที่สลิปพิกัด", "xf-k")
    note(f, 290, "δ = √(2ρ/ωμ₀) · ตอนสตาร์ทกระแสอัดอยู่ด้านบนแท่ง พื้นที่ใช้งานน้อย R สูงขึ้น → แรงบิดเริ่มสูง กระแสลด")
    note(f, 308, "ρ อะลูมิเนียมหล่อร้อน ≈ 3.0×10⁻⁸ Ω·m · ξ = h/δ · Rac/Rdc = ξ(sinh2ξ + sin2ξ)/(cosh2ξ − cos2ξ)")
    return f.svg()


@fig("acm-rotor-curves")
def _():
    f = F(760, 400, "กราฟแรงบิดและกระแสเทียบความเร็วของโรเตอร์สามแบบที่สเตเตอร์เดียวกัน: กรงเดี่ยว R ต่ำ กรงคู่ และกรงเดี่ยว R สูง (Design D)", "acm-rotor-curves")
    pl = Plot(f, 66, 26, 600, 280, (0, 1500), (0, 3.4), (0, 8))
    pl.frame(range(0, 1501, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], [0, 2, 4, 6, 8], "ความเร็วรอบ n (rpm)", "แรงบิด T/Tn", "กระแส I/In", yf=lambda t: f"{t:g}")
    sty = {"a": ("xf-d", "กรงเดี่ยว R ต่ำ", "xf-k", 18), "dc": ("xf-b", "กรงคู่ / แท่งลึก", "xf-tb", -12), "d": ("xf-c", "กรงเดี่ยว R สูง (D)", "xf-tc", -12)}
    for r in ("a", "dc", "d"):
        T_, I_ = tn(r)
        curve(pl, T_, sty[r][0]); curve(pl, I_, "xf-dash", 2)
        I0, T0, _ = A.motor(1, rotor=r)
        f.text(pl.X(40), pl.Y(T0 / TN) + sty[r][3], f"{sty[r][1]}: Ts {T0 / TN:.2f}·Tn · Is {I0 / IN:.1f}·In", sty[r][2])
    f.dot(pl.X(1471), pl.Y(1), 4, "xf-dot"); f.text(pl.X(1478), pl.Y(1) + 20, "1471", "xf-k", "middle")
    f.dot(pl.X(1330), pl.Y(1), 4, "xf-dot"); f.text(pl.X(1318), pl.Y(1) - 10, "D: 1330 rpm (สลิป 11 %)", "xf-tc", "end")
    f.text(pl.X(1495), pl.y + 12, "เส้นประ = กระแส (แกนขวา)", "xf-k", "end")
    note(f, 362, "แรงบิดสูงสุด Tk เท่ากันทุกแบบ (ขึ้นกับ X ไม่ขึ้นกับ R) แต่ตำแหน่งย้ายตาม R: R สูง → แรงบิดสูงสุดย้ายไปทางความเร็วต่ำ")
    note(f, 380, "กรงคู่ได้ข้อดีของสองแบบ: แรงบิดเริ่มสูงเหมือน R สูง และสลิปพิกัดต่ำ (ประสิทธิภาพสูง) เหมือน R ต่ำ")
    return f.svg()


@fig("acm-dc-split")
def _():
    f = F(760, 340, "แรงบิดของโรเตอร์กรงคู่แยกเป็นแรงบิดจากกรงนอกและกรงใน กรงนอกให้แรงบิดตอนสตาร์ท กรงในให้แรงบิดตอนวิ่ง", "acm-dc-split")
    pl = Plot(f, 66, 26, 600, 240, (0, 1500), (0, 3.4))
    pl.frame(range(0, 1501, 250), [0, 1, 2, 3], xl="ความเร็วรอบ n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    To, Ti, Tt = [], [], []
    for n in list(range(0, 1500, 5)) + [1499]:
        d = A.motor(A.n2s(n), detail=True)
        To.append((n, d["To"] / TN)); Ti.append((n, d["Ti"] / TN)); Tt.append((n, d["T"] / TN))
    curve(pl, To, "xf-a"); curve(pl, Ti, "xf-c"); curve(pl, Tt, "xf-b")
    f.text(pl.X(30), pl.Y(To[0][1]) - 8, f"กรงนอก {To[0][1]:.2f}·Tn", "xf-ta")
    f.text(pl.X(30), pl.Y(Ti[0][1]) - 8, f"กรงใน {Ti[0][1]:.2f}·Tn", "xf-tc")
    f.text(pl.X(1200), pl.Y(0.55), f"ที่พิกัด กรงในรับ {A.motor(A.SR, detail=True)['Ti'] / TN * 100:.0f} % ของแรงบิด", "xf-tc", "middle")
    f.text(pl.X(700), pl.Y(2.43) - 8, "รวม (= เส้นกราฟมอเตอร์)", "xf-tb", "middle")
    note(f, 316, "สลิปสูง (f₂ สูง) กระแสไหลกรงนอกที่ X ต่ำ · สลิปต่ำ (f₂ ต่ำ) X แทบหายไป กระแสไหลกรงในที่ R ต่ำ — ผลเหมือนแท่งลึก")
    note(f, 334, "วงจรสมมูลกรงคู่ (ต่อเฟส Y เทียบเท่า): Ro′ 1.306 Ω Xo′ 0.585 Ω · Ri′ 0.463 Ω Xi′ 2.199 Ω")
    return f.svg()


@fig("acm-wound")
def _():
    f = F(760, 400, "โรเตอร์พันขดลวด: กราฟแรงบิดเมื่อเพิ่มความต้านทานภายนอก และการสตาร์ทแบบตัดความต้านทานทีละขั้นกับโหลดแรงบิดคงที่", "acm-wound")
    pl = Plot(f, 66, 26, 600, 270, (0, 1500), (0, 3.4))
    pl.frame(range(0, 1501, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], xl="ความเร็วรอบ n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    steps = [2.416, 1.2, 0.55, 0.2, 0.0]
    cls = ["xf-d", "xf-e", "xf-c", "xf-a", "xf-b"]
    tcl = ["xf-k", "xf-k", "xf-tc", "xf-ta", "xf-tb"]
    for rx, c, tc in zip(steps, cls, tcl):
        T_, _ = tn("a", rext=rx, step=6)
        curve(pl, T_, c)
        f.text(pl.X(8), pl.Y(T_[0][1]) + (-6 if rx > 0.3 else 14), f"Rext′ = {rx:.2f} Ω", tc)
    TL, tsw = 1.0, 1.6
    path, n = [], 0
    for i, rx in enumerate(steps):
        path.append((n, A.motor(A.n2s(n), rotor="a", rext=rx)[1] / TN))
        if i == len(steps) - 1:
            break
        nn, peak = n, 0
        while nn < 1499:
            tt = A.motor(A.n2s(nn), rotor="a", rext=rx)[1] / TN
            peak = max(peak, tt)
            if tt <= tsw and peak > tt + 0.05:
                break
            nn += 2
        for q in range(int(n), int(nn) + 1, 4):
            path.append((q, A.motor(A.n2s(q), rotor="a", rext=rx)[1] / TN))
        n = nn
    for q in range(int(n), 1500, 4):
        path.append((q, A.motor(A.n2s(q), rotor="a")[1] / TN))
    curve(pl, path, "xf-ln")
    curve(pl, [(0, TL), (1500, TL)], "xf-dash")
    f.text(pl.X(420), pl.Y(TL) + 16, "โหลดแรงบิดคงที่ 1.0·Tn (เครน รอก สายพานหนัก)", "xf-k")
    note(f, 344, "เส้นดำ = เส้นทางสตาร์ทแบบตัด R ทีละขั้นเมื่อแรงบิดลดถึง 1.6·Tn · Rext′ ≈ 2.4 Ω ให้ 3.0·Tn ที่ n = 0 ด้วยกระแสเพียง 3.9·In")
    note(f, 362, "R ภายนอกเลื่อนจุดแรงบิดสูงสุดไปทางซ้ายโดยแรงบิดสูงสุดคงเดิม (Tk ไม่ขึ้นกับ R₂)")
    note(f, 380, "ข้อเสีย: กำลัง s·Pag สูญเป็นความร้อนในตัวต้านทาน · งานใหม่มักใช้กรงกระรอก + VFD แทน")
    return f.svg()


# =========================================================================== 4 · LOADS AND THE OPERATING POINT
@fig("acm-load-types")
def _():
    f = F(760, 300, "ลักษณะแรงบิดของโหลดสี่แบบเทียบความเร็ว: แรงบิดคงที่ แปรตามความเร็ว แปรตามกำลังสอง (ปั๊ม พัดลม) และกำลังคงที่", "acm-load-types")
    specs = [("const", "แรงบิดคงที่  T = c", "สายพาน รอก เครน", "P ∝ n"),
             ("lin", "T ∝ n", "เครื่องรีด แรงหนืด", "P ∝ n²"),
             ("quad", "T ∝ n²", "ปั๊มหอยโข่ง พัดลม", "P ∝ n³"),
             ("power", "กำลังคงที่  T ∝ 1/n", "ม้วนเก็บ แกนกลึง", "P = c")]
    for i, (k, t, ex, p) in enumerate(specs):
        x0 = 30 + i * 182
        pl = Plot(f, x0 + 22, 40, 140, 130, (0, 1500), (0, 2.2))
        f.line(pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, "xf-thin"); f.line(pl.x, pl.y, pl.x, pl.y + pl.h, "xf-thin")
        if k == "const":
            pts = [(n, 1.0) for n in range(0, 1501, 50)]
        elif k == "power":
            pts = [(n, min(NN / max(n, 1), 2.0) * 0.75) for n in range(0, 1501, 10)]
        else:
            pts = load_pts(k, 1.0, 0, 1500, 10)
        curve(pl, pts, "xf-c")
        f.text(pl.x - 6, pl.y + 8, "T", "xf-k", "end"); f.text(pl.x + pl.w, pl.y + pl.h + 14, "n", "xf-k", "end")
        f.text(x0 + 92, 28, t, "xf-h", "middle")
        f.text(x0 + 92, 196, ex, "xf-k", "middle")
        f.text(x0 + 92, 214, f"กำลัง {p}", "xf-tc", "middle")
    note(f, 252, "โหลดจริงมักมีแรงบิดเริ่ม (breakaway) จากแรงเสียดทานสถิต 10–30 % ที่ n ≈ 0 แม้เป็นโหลดแบบ n²")
    note(f, 272, "เลือกวิธีสตาร์ทจากรูปร่างเส้นนี้ ไม่ใช่จากกำลัง kW อย่างเดียว: โหลดคงที่เต็มพิกัดสตาร์ทสตาร์-เดลต้าไม่ได้")
    return f.svg()


@fig("acm-op-point")
def _():
    f = F(760, 420, "จุดทำงานคือจุดตัดของเส้นแรงบิดมอเตอร์กับเส้นแรงบิดโหลด: ปั๊มและสายพานที่ 100 % และ 50 % พร้อมภาพขยายย่านทำงาน", "acm-op-point")
    pl = Plot(f, 66, 26, 420, 280, (0, 1500), (0, 3.4))
    pl.frame(range(0, 1501, 500), [0, 0.5, 1, 1.5, 2, 2.5, 3], xl="ความเร็วรอบ n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    T_, _ = tn("dc")
    curve(pl, T_, "xf-b")
    curve(pl, load_pts("quad", 1.0), "xf-c"); curve(pl, [(0, 1.2), (14, 1.2), (15, 1.0), (1500, 1.0)], "xf-a")
    curve(pl, load_pts("quad", 0.5), "xf-c"); curve(pl, [(0, 0.6), (14, 0.6), (15, 0.5), (1500, 0.5)], "xf-a")
    f.text(pl.X(1150), pl.Y(0.12 + 0.88 * (1150 / NN) ** 2) - 8, "ปั๊ม 100 %", "xf-tc", "end")
    f.text(pl.X(1150), pl.Y(0.5 * (0.12 + 0.88 * (1150 / NN) ** 2)) + 16, "ปั๊ม 50 %", "xf-tc", "end")
    f.text(pl.X(200), pl.Y(1.0) - 6, "สายพาน 100 %", "xf-ta"); f.text(pl.X(200), pl.Y(0.5) - 6, "สายพาน 50 %", "xf-ta")
    f.text(pl.X(600), pl.Y(2.36) - 10, "กราฟมอเตอร์", "xf-tb", "middle")
    z = Plot(f, 548, 26, 182, 280, (1440, 1500), (0, 1.3))
    z.frame([1440, 1460, 1480, 1500], [0, 0.25, 0.5, 0.75, 1, 1.25], xl="n (rpm) ขยาย", yf=lambda t: f"{t:g}")
    Tz, _ = tn("dc", n0=1440, n1=1499.9, step=0.5)
    curve(z, Tz, "xf-b")
    curve(z, [(n, 0.12 + 0.88 * (n / NN) ** 2) for n in range(1440, 1501, 2)], "xf-c")
    curve(z, [(n, 0.5 * (0.12 + 0.88 * (n / NN) ** 2)) for n in range(1440, 1501, 2)], "xf-c")
    curve(z, [(1440, 1), (1500, 1)], "xf-a"); curve(z, [(1440, 0.5), (1500, 0.5)], "xf-a")
    pts = []
    for kind, k in (("quad", 1.0), ("quad", 0.5), ("const", 1.0), ("const", 0.5)):
        nop = A.op_point(lambda n, kind=kind, k=k: A.load_T(kind, n, k))
        I, T, _ = A.motor(A.n2s(nop))
        f.dot(z.X(nop), z.Y(T / TN), 3.6, "xf-dot")
        pts.append((nop, I))
    y = 360
    f.text(40, y, "จุดทำงาน (คำนวณ):", "xf-h")
    tx = [f"ปั๊ม 100 % → {pts[0][0]:.0f} rpm · {pts[0][1]:.1f} A", f"ปั๊ม 50 % → {pts[1][0]:.0f} rpm · {pts[1][1]:.1f} A",
          f"สายพาน 100 % → {pts[2][0]:.0f} rpm · {pts[2][1]:.1f} A", f"สายพาน 50 % → {pts[3][0]:.0f} rpm · {pts[3][1]:.1f} A"]
    for i, s in enumerate(tx):
        f.text(200 + (i % 2) * 280, y + (i // 2) * 18, s, "xf-m")
    note(f, 408, "ในย่านทำงานเส้นมอเตอร์ชันมาก: โหลดเปลี่ยนครึ่งหนึ่ง ความเร็วเปลี่ยนเพียง ~15 rpm แต่กระแสเปลี่ยนจาก 14 เป็น 9 A")
    return f.svg()


@fig("acm-stability")
def _():
    f = F(760, 370, "เสถียรภาพของจุดทำงาน: โหลดแรงบิดคงที่ 2.5 Tn ตัดเส้นมอเตอร์สองจุด จุดซ้ายของแรงบิดสูงสุดไม่เสถียร จุดขวาเสถียร", "acm-stability")
    pl = Plot(f, 66, 26, 620, 260, (0, 1500), (0, 3.4))
    pl.frame(range(0, 1501, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], xl="ความเร็วรอบ n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    T_, _ = tn("dc")
    curve(pl, T_, "xf-b")
    curve(pl, [(0, 2.5), (1500, 2.5)], "xf-c")
    cr = A.all_crossings(lambda n: 2.5 * TN)
    for n, kind in cr:
        f.circ(pl.X(n), pl.Y(2.5), 5, "xf-dot" if kind == "stable" else "xf-doto")
    nu, ns_ = cr[0][0], cr[1][0]
    y = pl.Y(2.5) + 30
    arrow(f, pl.X(nu) - 8, y, pl.X(nu) - 70, y); arrow(f, pl.X(nu) + 8, y, pl.X(nu) + 70, y)
    f.text(pl.X(nu), y + 18, f"{nu:.0f} rpm ไม่เสถียร: เบี่ยงนิดเดียวก็หนีออก", "xf-k", "middle")
    arrow(f, pl.X(ns_) - 70, y, pl.X(ns_) - 8, y); arrow(f, pl.X(ns_) + 50, y, pl.X(ns_) + 8, y)
    f.text(pl.X(ns_) - 10, y + 18, f"{ns_:.0f} rpm เสถียร", "xf-k", "middle")
    f.text(pl.X(30), pl.Y(2.15) + 18, "Ts = 2.15·Tn < 2.5·Tn → สตาร์ทเองไม่ขึ้น", "xf-tb")
    f.text(pl.X(30), pl.Y(2.5) - 8, "โหลด 2.5·Tn (โหลดเกินชั่วคราว)", "xf-tc")
    note(f, 340, "เกณฑ์: จุดทำงานเสถียรเมื่อ dT_m/dn < dT_L/dn — ด้านขวาของแรงบิดสูงสุดเส้นมอเตอร์ลาดลง จึงเสถียรกับโหลดแทบทุกแบบ")
    note(f, 358, "ถ้าโหลดเพิ่มเกิน Tk = 3.0·Tn จุดตัดหายไป มอเตอร์ชะลอจนหยุด (stall) กระแสพุ่งกลับไป 6.5·In")
    return f.svg()


@fig("acm-accel")
def _():
    f = F(760, 410, "แรงบิดเร่งคือพื้นที่ระหว่างเส้นมอเตอร์กับเส้นโหลด และกราฟความเร็วเทียบเวลาขณะสตาร์ทตรงของปั๊ม สายพาน และพัดลมความเฉื่อยสูง", "acm-accel")
    pl = Plot(f, 60, 26, 300, 270, (0, 1500), (0, 3.4))
    pl.frame([0, 500, 1000, 1500], [0, 1, 2, 3], xl="n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    T_, _ = tn("dc", step=10)
    poly = [(pl.X(n), pl.Y(t)) for n, t in T_ if n <= 1470] + [(pl.X(n), pl.Y(1.0)) for n in range(1470, -1, -10)]
    f.poly(poly, "xf-fb", close=True)
    curve(pl, T_, "xf-b"); curve(pl, [(0, 1), (1500, 1)], "xf-a"); curve(pl, load_pts("quad", 1.0), "xf-c")
    f.text(pl.X(500), pl.Y(1.75), "T_a = T_m − T_L", "xf-tb", "middle")
    f.text(pl.X(500), pl.Y(1.0) + 14, "สายพาน 1.0·Tn", "xf-ta", "middle")
    f.text(pl.X(1050), pl.Y(0.52), "ปั๊ม", "xf-tc", "middle")
    pr = Plot(f, 440, 26, 290, 270, (0, 3.5), (0, 1600))
    pr.frame([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], [0, 500, 1000, 1500], xl="เวลา t (s)", yl="n (rpm)", xf=lambda t: f"{t:g}")
    res = []
    for kind, c, lab in (("quad", "xf-c", "ปั๊ม J = 0.105"), ("const", "xf-a", "สายพาน J = 0.395"), ("fan", "xf-d", "พัดลม J = 2.245")):
        J = A.JM + A.LOAD_J[kind]
        tr, ok = A.runup(lambda n, kind=kind: A.load_T(kind, n, 1.0), J, n_end=None)
        pts = [(x[0], x[1]) for x in tr if x[0] <= 3.5]
        if tr[-1][0] <= 3.5:
            pts.append((3.5, tr[-1][1]))
        curve(pr, pts, c)
        t95 = next(x[0] for x in tr if x[1] >= 0.95 * 1471)
        res.append((lab, t95, c))
        f.dot(pr.X(t95), pr.Y(0.95 * 1471), 3.4, "xf-dot")
    for i, (lab, t95, c) in enumerate(res):
        f.text(pr.X(3.45), pr.Y(560 - i * 170), f"{lab} kg·m² → {t95:.2f} s", "xf-k", "end")
    f.text(pr.X(3.45), pr.Y(60), "• = ถึง 95 % ความเร็วพิกัด", "xf-k", "end")
    note(f, 350, "t = J ∫ dω / (T_m − T_L): แรงบิดเร่งน้อยหรือความเฉื่อยมาก → ใช้เวลานาน กระแสสตาร์ทค้างนาน มอเตอร์ร้อน")
    note(f, 368, "ความร้อนในโรเตอร์ระหว่างสตาร์ท ≥ พลังงานจลน์ ½Jω² ที่เก็บในโหลด — พัดลมใหญ่ ~30 kJ ต่อการสตาร์ทหนึ่งครั้ง")
    note(f, 386, "อินทิเกรต J dω/dt = T_m(n) − T_L(n) ทีละ 1 ms ด้วยกราฟของมอเตอร์ 7.5 kW (JM = 0.045 kg·m²)")
    return f.svg()


@fig("acm-voltage")
def _():
    f = F(760, 400, "ผลของแรงดันตก: แรงบิดแปรตามกำลังสองของแรงดัน กราฟที่ 100 90 80 และ 70 % กับโหลดแรงบิดคงที่ 1.0 Tn จุดทำงานเลื่อนและกระแสเพิ่ม", "acm-voltage")
    pl = Plot(f, 66, 26, 420, 270, (0, 1500), (0, 3.4))
    pl.frame(range(0, 1501, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], xl="ความเร็วรอบ n (rpm)", yl="แรงบิด T/Tn", yf=lambda t: f"{t:g}")
    cls = {1.0: ("xf-b", "xf-tb"), 0.9: ("xf-e", "xf-k"), 0.8: ("xf-d", "xf-k"), 0.7: ("xf-a", "xf-ta")}
    rows = []
    for v, (c, tc) in cls.items():
        T_, _ = tn("dc", V=A.VP * v, step=6)
        curve(pl, T_, c)
        f.text(pl.X(10), pl.Y(T_[0][1]) - 6, f"{v * 100:.0f} %", tc)
        nop = A.op_point(lambda n: TN, A.VP * v)
        d = A.motor(A.n2s(nop), A.VP * v, detail=True)
        rows.append((v, nop, d["I"], d["Pcu1"] + d["Pcu2"]))
        f.dot(pl.X(nop), pl.Y(1.0), 3.4, "xf-dot")
    curve(pl, [(0, 1), (1500, 1)], "xf-c")
    f.text(pl.X(600), pl.Y(1) + 16, "โหลดแรงบิดคงที่ 1.0·Tn", "xf-tc", "middle")
    cols = [520, 618, 676, 738]
    for c_, h in zip(cols, ["แรงดัน", "n (rpm)", "I (A)", "Pcu (W)"]):
        f.text(c_, 50, h, "xf-k", "end" if c_ != 520 else None)
    for i, (v, n, I, pc) in enumerate(rows):
        y = 72 + i * 20
        f.text(cols[0], y, f"{v * 100:.0f} %", "xf-m")
        f.text(cols[1], y, f"{n:.0f}", "xf-m", "end"); f.text(cols[2], y, f"{I:.1f}", "xf-m", "end"); f.text(cols[3], y, f"{pc:.0f}", "xf-m", "end")
    f.text(520, 172, "แรงดันตก 10 % →", "xf-h")
    f.text(520, 190, "แรงบิดทุกจุดเหลือ 0.9² = 81 %", "xf-k")
    f.text(520, 206, f"กระแส +{rows[1][2] / rows[0][2] * 100 - 100:.0f} % · ความร้อนทองแดง +{rows[1][3] / rows[0][3] * 100 - 100:.0f} %", "xf-k")
    f.text(520, 222, f"ความเร็วลดเพียง {rows[0][1] - rows[1][1]:.0f} rpm", "xf-k")
    f.text(520, 250, "แรงดันตก 30 % →", "xf-h")
    f.text(520, 268, f"Ts เหลือ {A.motor(1, A.VP * 0.7)[1] / TN:.2f}·Tn เกือบสตาร์ทไม่ขึ้น", "xf-k")
    note(f, 352, "แรงบิดต่ำลงแต่โหลดต้องการเท่าเดิม มอเตอร์จึงเพิ่มสลิป → กระแสเพิ่ม: แรงดันต่ำทำให้มอเตอร์ร้อนขึ้น ไม่ใช่เย็นลง")
    note(f, 370, "โหลดปั๊ม/พัดลมไวต่อแรงดันน้อยกว่า เพราะเมื่อช้าลงเล็กน้อยแรงบิดโหลดก็ลดตาม n²")
    return f.svg()


# =========================================================================== 5 · TRANSIENTS AND STEADY STATE
_DYN = {}


def dyn_cached(key, *a, **k):
    if key not in _DYN:
        _DYN[key] = A.dyn(*a, **k)
    return _DYN[key]


@fig("acm-dol-transient")
def _():
    f = F(760, 450, "ช่วงเริ่มต้นของการสตาร์ทตรง จำลองด้วยแบบจำลองพลวัต: กระแสเฟส L1 ชั่วขณะ แรงบิดแกว่งในไซเคิลแรก และความเร็ว", "acm-dol-transient")
    TL = lambda n: A.load_T("quad", n, 1.0)
    J = A.JM + A.LOAD_J["quad"]
    t, ia, ir, te, n = dyn_cached("dol", [(0.32, "DOL", -90)], TL, J, winding=False, max_step=5e-5)
    xt = [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32]
    p1 = Plot(f, 66, 22, 640, 150, (0, 0.32), (-200, 200))
    p1.frame(xt, [-200, -100, 0, 100, 200], yl="i_L1 (A)", xf=lambda v: f"{v * 1000:.0f}")
    curve(p1, list(zip(t, ia)), "xf-a", eps=0.3)
    curve(p1, [(a, b * math.sqrt(2)) for a, b in zip(t, ir)], "xf-dash")
    k = int(np.argmax(np.abs(ia)))
    f.text(p1.X(t[k]) + 10, p1.Y(ia[k]) + 6, f"ยอด {abs(ia[k]):.0f} A", "xf-ta")
    f.text(p1.X(0.31), p1.Y(150), f"กระแสสตาร์ท rms ≈ {A.motor(1)[0]:.0f} A (6.5·In)", "xf-k", "end")
    p2 = Plot(f, 66, 200, 640, 150, (0, 0.32), (-2, 6), (0, 1600))
    p2.frame(xt, [-2, 0, 2, 4, 6], [0, 800, 1600], xl="เวลา (ms)", yl="T_e/Tn", y2l="n (rpm)", xf=lambda v: f"{v * 1000:.0f}", yf=lambda v: f"{v:g}")
    curve(p2, [(a, b / TN) for a, b in zip(t, te)], "xf-b", eps=0.3)
    curve(p2, list(zip(t, n)), "xf-c", 2)
    f.line(p2.X(0), p2.Y(0), p2.X(0.32), p2.Y(0), "xf-thin")
    km = int(np.argmax(te))
    f.text(p2.X(t[km]) + 8, p2.Y(te[km] / TN) + 6, f"แรงบิดยอด {te[km] / TN:.1f}·Tn ในไซเคิลแรก", "xf-tb")
    f.text(p2.X(0.31), p2.Y(1300, 2), "ความเร็ว (แกนขวา)", "xf-tc", "end")
    f.text(p2.X(t[int(np.argmin(te))]) + 6, p2.Y(te.min() / TN) + 14, f"ติดลบ {te.min() / TN:.1f}·Tn", "xf-k")
    t95 = t[np.argmax(n >= 0.95 * 1471)]
    note(f, 392, f"ปั๊ม 7.5 kW (J รวม 0.105 kg·m²) ถึง 95 % ความเร็วใน {t95 * 1000:.0f} ms · ยอดไซเคิลแรก {abs(ia[k]):.0f} A > √2 × 91 A เพราะมีส่วน DC")
    note(f, 410, "แรงบิดแกว่ง 50 Hz ในไซเคิลแรกเกิดจากฟลักซ์ทรานเซียนต์ — กระแทกเพลา คัปปลิ้ง เกียร์ แม้กราฟสถิตบอกแค่ 2.15·Tn")
    note(f, 428, "แบบจำลองเวกเตอร์ปริภูมิ (αβ) ของมอเตอร์ตัวเดียวกับกราฟสถิต · เส้นประ = ขนาดเวกเตอร์กระแส (ซองของ i_L1)")
    return f.svg()


@fig("acm-dyn-tn")
def _():
    f = F(760, 340, "วิถีแรงบิด-ความเร็วจริงจากการจำลองพลวัตเทียบกราฟสถิตของมอเตอร์ ระหว่างสตาร์ทตรงพัดลมความเฉื่อยสูง", "acm-dyn-tn")
    TL = lambda n: A.load_T("fan", n, 1.0)
    J = A.JM + A.LOAD_J["fan"]
    t, ia, ir, te, n = dyn_cached("dolfan", [(4.2, "DOL", 0)], TL, J, winding=False, max_step=2e-4)
    pl = Plot(f, 66, 22, 620, 240, (0, 1500), (-1, 6))
    pl.frame(range(0, 1501, 250), [-1, 0, 1, 2, 3, 4, 5, 6], xl="ความเร็วรอบ n (rpm)", yl="T/Tn", yf=lambda v: f"{v:g}")
    f.line(pl.X(0), pl.Y(0), pl.X(1500), pl.Y(0), "xf-thin")
    curve(pl, [(a, b / TN) for a, b in zip(n, te)], "xf-a", eps=0.5)
    T_, _ = tn("dc")
    curve(pl, T_, "xf-b")
    curve(pl, load_pts("fan", 1.0), "xf-c")
    f.text(pl.X(70), pl.Y(5.2), "ไซเคิลแรก: แรงบิดแกว่ง +5.4 / −1·Tn", "xf-ta")
    f.text(pl.X(700), pl.Y(2.4) - 10, "กราฟสถิต (วงจรสมมูล)", "xf-tb", "middle")
    f.text(pl.X(900), pl.Y(0.55) - 8, "โหลดพัดลม T ∝ n²", "xf-tc", "middle")
    t95 = t[np.argmax(n >= 0.95 * 1471)]
    note(f, 312, f"พัดลม J รวม 2.245 kg·m²: ถึง 95 % ใน {t95:.2f} s (กราฟสถิตทำนาย 3.10 s) — ช่วงเร่งส่วนใหญ่เดินตามกราฟสถิต")
    note(f, 330, "เส้นสีน้ำเงิน = ผลจำลองพลวัต · ส้ม = แรงบิดจากวงจรสมมูล · หลังทรานเซียนต์สองเส้นทับกัน")
    return f.svg()


@fig("acm-steady")
def _():
    f = F(760, 370, "สมรรถนะช่วงทำงานคงตัวเทียบโหลด 0 ถึง 125 %: ประสิทธิภาพ ตัวประกอบกำลัง กระแส และสลิป ของมอเตอร์ 7.5 kW IE3", "acm-steady")
    pl = Plot(f, 66, 26, 600, 260, (0, 125), (0, 1.2), (0, 6))
    pl.frame([0, 25, 50, 75, 100, 125], [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], [0, 2, 4, 6], "โหลด (% ของ 7.5 kW)", "η · cos φ · I/In", "สลิป (%)", xf=lambda v: f"{v}", yf=lambda v: f"{v:g}")
    E, P, I_, S = [], [], [], []
    from scipy.optimize import brentq
    for pct in range(2, 126, 2):
        Psh = 7500 * pct / 100
        s = brentq(lambda s: A.motor(s, detail=True)["Pmi"] - A.P_FW - Psh, 1e-5, 0.2)
        d = A.motor(s, detail=True)
        Ife = A.P_FE / (3 * A.VP)
        I1 = complex(d["I"] * d["pf"] + Ife, -d["I"] * math.sin(math.acos(d["pf"])))
        Pin = d["Pin"] + A.P_FE
        E.append((pct, Psh / Pin)); P.append((pct, I1.real / abs(I1))); I_.append((pct, abs(I1) / 14.35)); S.append((pct, s * 100))
    curve(pl, E, "xf-b"); curve(pl, P, "xf-c"); curve(pl, I_, "xf-a"); curve(pl, S, "xf-dash", 2)
    f.text(pl.X(122), pl.Y(E[-1][1]) - 8, "η", "xf-tb", "end")
    f.text(pl.X(122), pl.Y(P[-1][1]) + 16, "cos φ", "xf-tc", "end")
    f.text(pl.X(118), pl.Y(I_[-1][1]) + 4, "I/In", "xf-ta", "end")
    f.text(pl.X(100), pl.Y(S[49][1], 2) + 16, "สลิป (แกนขวา)", "xf-k", "start")
    f.text(pl.X(25), pl.Y(0.08), f"25 %: η {E[11][1] * 100:.0f} % · cos φ {P[11][1]:.2f}", "xf-k", "middle")
    f.text(pl.X(100), pl.Y(0.08), f"100 %: η {E[49][1] * 100:.1f} % · cos φ {P[49][1]:.2f}", "xf-k", "middle")
    note(f, 340, "ไม่มีโหลด มอเตอร์ยังดึงกระแสแม่เหล็ก ~45 % In (cos φ ต่ำ) · η สูงสุดราว 75–100 % ของพิกัด → อย่าเลือกมอเตอร์ใหญ่เกิน")
    note(f, 358, f"รวมการสูญเสียแกนเหล็ก {A.P_FE:.0f} W และแรงเสียดทาน/ลม {A.P_FW:.0f} W → η ที่พิกัด ≈ 90.4 % (ระดับ IE3 ตาม IEC 60034-30-1)")
    return f.svg()


@fig("acm-power-flow")
def _():
    f = F(760, 260, "การไหลของกำลังในมอเตอร์ 7.5 kW ที่พิกัด: กำลังเข้า การสูญเสียทองแดงสเตเตอร์ แกนเหล็ก ช่องว่างอากาศ ทองแดงโรเตอร์ แรงเสียดทาน และกำลังที่เพลา", "acm-power-flow")
    d = A.motor(A.SR, detail=True)
    Pin = d["Pin"] + A.P_FE
    stages = [("P_in", Pin), ("P_ag", d["Pag"]), ("P_mi", d["Pmi"]), ("P_shaft", d["Pmi"] - A.P_FW)]
    sc = 120 / Pin
    ys = 104
    xs = [40, 230, 420, 610]
    for i, (lab, p) in enumerate(stages):
        h = p * sc
        f.rect(xs[i], ys - h / 2, 90, h, "xf-boxb" if i in (0, 3) else "xf-box", 3)
        f.text(xs[i] + 45, ys - h / 2 - 8, lab, "xf-h", "middle")
        f.text(xs[i] + 45, ys + 4, f"{p:,.0f} W", "xf-m", "middle")
        if i < 3:
            f.line(xs[i] + 92, ys, xs[i + 1] - 4, ys, "xf-ln", "end")
    L = [(158, "end", "P_cu1 สเตเตอร์", d["Pcu1"]), (204, None, "P_fe แกนเหล็ก", A.P_FE), (370, "middle", "P_cu2 = s·P_ag", d["Pcu2"]), (560, "middle", "P_fw ลม/ลูกปืน", A.P_FW)]
    for x_, an, lab, p in L:
        f.line(x_, ys, x_, ys + 74, "xf-dash")
        tx = x_ + (-4 if an == "end" else 4 if an is None else 0)
        f.text(tx, ys + 92, lab, "xf-k", an); f.text(tx, ys + 108, f"{p:.0f} W", "xf-ta", an)
    note(f, 240, f"η = {d['Pmi'] - A.P_FW:,.0f}/{Pin:,.0f} = {(d['Pmi'] - A.P_FW) / Pin * 100:.1f} % · สลิป {A.SR * 100:.2f} % → P_cu2 = s·P_ag = {A.SR:.4f} × {d['Pag']:,.0f} = {d['Pcu2']:.0f} W")
    return f.svg()


# =========================================================================== 6 · STAR-DELTA
@fig("acm-yd-tn")
def _():
    f = F(760, 484, "สตาร์-เดลต้าบนกราฟแรงบิด-ความเร็ว: แรงบิดและกระแสช่วงสตาร์เหลือ 1/3 เทียบกับโหลดปั๊ม 80 % สายพาน 50 % และสายพาน 100 % พร้อมจุดเปลี่ยนจังหวะและกระแสกระโดด", "acm-yd-tn")
    pt = Plot(f, 66, 22, 600, 190, (0, 1500), (0, 3.2))
    pt.frame(range(0, 1501, 250), [0, 1, 2, 3], yl="T/Tn", yf=lambda v: f"{v:g}")
    TD, ID = tn("dc"); TY, IY = tn("dc", scale=1 / 3)
    curve(pt, TD, "xf-dash"); curve(pt, TY, "xf-b")
    curve(pt, load_pts("quad", 0.8), "xf-c")
    curve(pt, [(0, 0.6), (14, 0.6), (15, 0.5), (1500, 0.5)], "xf-a")
    curve(pt, [(0, 1.2), (14, 1.2), (15, 1.0), (1500, 1.0)], "xf-d")
    VY = A.VP / math.sqrt(3)
    nyp = A.op_point(lambda n: A.load_T("quad", n, 0.8), VY)
    nyc = A.op_point(lambda n: A.load_T("const", n, 0.5), VY)
    for nn_ in (nyp, nyc):
        f.dot(pt.X(nn_), pt.Y(A.motor(A.n2s(nn_))[1] / TN / 3), 3.8, "xf-dot")
    f.text(pt.X(20), pt.Y(1.42), f"Y (สตาร์): Ts = {TY[0][1]:.2f}·Tn = 1/3 ของ Δ", "xf-tb")
    f.text(pt.X(20), pt.Y(TD[0][1]) - 8, f"Δ (= DOL): {TD[0][1]:.2f}·Tn", "xf-k")
    f.text(pt.X(1000), pt.Y(1.0) - 8, "สายพาน 100 %: Y สตาร์ทไม่ขึ้น", "xf-k", "middle")
    f.text(pt.X(560), pt.Y(0.5) + 14, "สายพาน 50 %", "xf-ta", "middle")
    f.text(pt.X(870), pt.Y(0.8 * (0.12 + 0.88 * (870 / NN) ** 2)) + 14, "ปั๊ม 80 %", "xf-tc", "middle")
    pi_ = Plot(f, 66, 256, 600, 150, (0, 1500), (0, 7))
    pi_.frame(range(0, 1501, 250), [0, 2, 4, 6], xl="ความเร็วรอบ n (rpm)", yl="I/In", yf=lambda v: f"{v:g}")
    curve(pi_, ID, "xf-dash"); curve(pi_, IY, "xf-a")
    for nn_, lab, dy in ((nyp, "ปั๊ม", -10), (nyc, "สายพาน 50 %", 10)):
        iy = A.motor(A.n2s(nn_))[0] / IN / 3; idd = A.motor(A.n2s(nn_))[0] / IN
        f.line(pi_.X(nn_), pi_.Y(iy), pi_.X(nn_), pi_.Y(idd), "xf-e", "end")
        f.text(pi_.X(nn_) - 26, pi_.Y(idd) + dy, f"{lab}: {nn_:.0f} rpm → {idd:.1f}·In", "xf-k", "end")
    f.text(pi_.X(20), pi_.Y(IY[0][1]) - 8, f"Y: {IY[0][1]:.2f}·In", "xf-ta")
    f.text(pi_.X(20), pi_.Y(ID[0][1]) - 8, f"Δ/DOL: {ID[0][1]:.2f}·In", "xf-k")
    note(f, 456, "ลูกศร = กระแสกระโดดตอนเปลี่ยน Y→Δ (ค่าคงตัวที่ความเร็วนั้น ยังไม่รวมทรานเซียนต์) · เปลี่ยนที่ความเร็วสูง กระโดดน้อย")
    note(f, 474, "ใช้สตาร์-เดลต้าได้เมื่อ: เส้น Y อยู่เหนือเส้นโหลดตลอดช่วงเร่ง และตัดเส้นโหลดที่ความเร็ว ≥ ~90 % ของพิกัด")
    return f.svg()


@fig("acm-yd-transient")
def _():
    f = F(760, 540, "ทรานเซียนต์ตอนเปลี่ยนจากสตาร์เป็นเดลต้าแบบเปิดวงจร จำลองด้วยแบบจำลองพลวัต: ต่อเดลต้าลำดับถูก (แรงดันขดลวดล้าหลัง 30°) เทียบลำดับผิด (นำหน้า 30°) กระแสสาย L1 และแรงบิด", "acm-yd-transient")
    TL = lambda n: A.load_T("quad", n, 0.8)
    J = A.JM + A.LOAD_J["quad"]
    good = dyn_cached("yd-good", [(1.5, "Y", 0), (1.55, "O", 0), (1.9, "D", -30)], TL, J)
    bad = dyn_cached("yd-bad", [(1.5, "Y", 0), (1.55, "O", 0), (1.9, "D", 30)], TL, J)
    dol = dyn_cached("dol08", [(1.9, "DOL", -90)], TL, J, winding=False)
    p1 = Plot(f, 66, 22, 640, 150, (0, 1.9), (0, 12))
    p1.frame([0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75], [0, 3, 6, 9, 12], yl="|i|/In", xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}")
    curve(p1, [(a, b / IN) for a, b in zip(dol[0], dol[2])], "xf-dash", eps=0.3)
    curve(p1, [(a, b / IN) for a, b in zip(bad[0], bad[2])], "xf-d", eps=0.3)
    curve(p1, [(a, b / IN) for a, b in zip(good[0], good[2])], "xf-a", eps=0.3)
    f.text(p1.X(0.11), p1.Y(8.3), "DOL", "xf-k")
    f.text(p1.X(0.2), p1.Y(2.6), "ช่วง Y ≈ 2.2·In", "xf-ta")
    m = (good[0] > 1.55) & (good[0] < 1.7)
    mb = (bad[0] > 1.55) & (bad[0] < 1.7)
    gpk, bpk = good[2][m].max() / IN, bad[2][mb].max() / IN
    f.text(p1.X(1.52), p1.Y(gpk) + 4, f"ลำดับถูก {gpk:.1f}·In", "xf-ta", "end")
    f.text(p1.X(1.6), p1.Y(bpk) + 4, f"ลำดับผิด {bpk:.1f}·In", "xf-k")
    p2 = Plot(f, 66, 214, 640, 120, (1.45, 1.75), (-250, 250))
    p2.frame([1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75], [-200, 0, 200], yl="i_L1 (A)", xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}")
    sel = lambda d: [(a, b) for a, b in zip(d[0], d[1]) if 1.45 <= a <= 1.75]
    curve(p2, sel(bad), "xf-d", eps=0.3); curve(p2, sel(good), "xf-a", eps=0.3)
    f.rect(p2.X(1.5), p2.y, p2.X(1.55) - p2.X(1.5), p2.h, "xf-fc", 0)
    f.text(p2.X(1.525), p2.y + 12, "ช่วงตาย 50 ms", "xf-k", "middle")
    p3 = Plot(f, 66, 368, 640, 90, (1.45, 1.75), (-5, 4))
    p3.frame([1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75], [-4, 0, 4], xl="เวลา (s)", yl="T_e/Tn", xf=lambda v: f"{v:g}", yf=lambda v: f"{v:g}")
    selT = lambda d: [(a, b / TN) for a, b in zip(d[0], d[3]) if 1.45 <= a <= 1.75]
    curve(p3, selT(bad), "xf-d"); curve(p3, selT(good), "xf-a")
    tb = [b / TN for a, b in zip(bad[0], bad[3]) if 1.55 < a < 1.7]; tg = [b / TN for a, b in zip(good[0], good[3]) if 1.55 < a < 1.7]
    f.text(p3.X(1.745), p3.Y(-3.4), f"ผิด {min(tb):.1f}…{max(tb):.1f}·Tn · ถูก {min(tg):.1f}…{max(tg):.1f}·Tn", "xf-k", "end")
    note(f, 510, "ปั๊ม 80 % เปลี่ยนที่ 1.5 s (1419 rpm) · สีน้ำเงิน = ลำดับถูก (U2→L3 V2→L1 W2→L2) · สีม่วง = ลำดับผิด · เส้นประ = DOL")
    note(f, 528, "ช่วงตายมอเตอร์ช้าลง แรงดันค้างล้าหลังไฟเรื่อยๆ — ต่อให้แรงดันใหม่ล้าหลัง 30° ด้วย ความต่างเฟสตอนต่อจึงเล็กลง")
    return f.svg()


@fig("acm-yd-phasor")
def _():
    f = F(760, 330, "เฟสเซอร์ตอนเปลี่ยนสตาร์เป็นเดลต้า: แรงดันค้างในขดลวดล้าหลังแรงดันสตาร์ไปมุม δ ระหว่างช่วงตาย เดลต้าที่ทำให้แรงดันขดลวดล้าหลัง 30° (ขดลวด U คร่อม L1–L3) ต่างเฟสน้อยกว่าเดลต้าที่นำหน้า 30° (คร่อม L1–L2)", "acm-yd-phasor")
    cx, cy, R = 220, 175, 125
    f.circ(cx, cy, R, "xf-thin")
    def vec(ang, L, c, lab, dx=0, dy=0, a="middle"):
        x = cx + L * math.cos(math.radians(ang)); y = cy - L * math.sin(math.radians(ang))
        f.line(cx, cy, x, y, c, "end")
        f.text(x + dx, y + dy, lab, c.replace("xf-", "xf-t") if c in ("xf-a", "xf-b", "xf-c") else "xf-k", a)
        return x, y
    vec(90, 0.577 * R, "xf-ln", "V_U ช่วงสตาร์ (230 V)", -8, 4, "end")
    vec(90 - 50, 0.5 * R, "xf-d", "แรงดันค้าง e (ล้าหลัง δ)", 8, 16, None)
    vec(90 + 30, R, "xf-b", "Δ คร่อม L1–L2: นำหน้า 30°", -10, -8, "end")
    vec(90 - 30, R, "xf-a", "Δ คร่อม L1–L3: ล้าหลัง 30°", 10, -8, None)
    def arc(a0, a1, r, c):
        pts = [(cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a))) for a in np.linspace(a0, a1, 30)]
        f.poly(pts, c)
    arc(40, 120, 0.36 * R, "xf-b"); arc(40, 60, 0.28 * R, "xf-a")
    f.text(cx - 50, cy - 40, "ต่างเฟส 30° + δ", "xf-tb", "end")
    f.text(cx + 70, cy - 70, "ต่างเฟส |δ − 30°|", "xf-ta")
    f.text(cx, cy + R + 22, "ทิศหมุนบวก (L1 → L2 → L3) = ทวนเข็ม · ล้าหลัง = ตามเข็ม", "xf-k", "middle")
    x0 = 430
    lines = [("ช่วงตาย 30–80 ms ไม่มีไฟเลี้ยง", "xf-h"), ("ฟลักซ์โรเตอร์ยังค้าง สร้างแรงดันที่ขั้ว e", "xf-k"),
             ("e หมุนตามความเร็วโรเตอร์ซึ่งช้ากว่าไฟ", "xf-k"), ("→ e ล้าหลังเพิ่มขึ้น δ ≈ s·ω·t + มุมเริ่ม", "xf-k"),
             ("ตัวอย่าง s = 5 %, t = 50 ms → δ ≈ 45°", "xf-m"), ("", "xf-k"),
             ("ต่อ KM3 ให้ขดลวดได้แรงดันที่ล้าหลัง 30°:", "xf-h"), ("U1–V2 · V1–W2 · W1–U2 (U2 → L3)", "xf-tag"),
             ("ความต่างเฟสตอนต่อเหลือ |δ − 30°| เล็กลง", "xf-k"), ("กระแสและแรงบิดกระชากลดลง", "xf-k"), ("", "xf-k"),
             ("กลับทางหมุนด้วยการสลับสายเมน", "xf-h"), ("ความสัมพันธ์นี้กลับด้าน ต้องตรวจซ้ำ", "xf-k")]
    for i, (s_, c) in enumerate(lines):
        f.text(x0, 40 + i * 20, s_, c)
    return f.svg()


@fig("acm-yd-wiring")
def _():
    f = F(760, 400, "วงจรกำลังสตาร์-เดลต้าที่ลดกระแสกระชากตอนเปลี่ยนจังหวะ: KM1 หลักจ่าย U1 V1 W1 ผ่านโอเวอร์โหลด KM2 สตาร์ลัด U2 V2 W2 และ KM3 เดลต้าต่อ L1 กับ V2 L2 กับ W2 L3 กับ U2", "acm-yd-wiring")
    ys = {"L1": 34, "L2": 52, "L3": 70}
    for k, y in ys.items():
        f.line(40, y, 720, y, "xf-ln"); f.text(30, y + 4, k, "xf-tag", "end")
    # Q1 note
    f.text(44, 22, "จากเบรกเกอร์ -Q1", "xf-k")
    def contacts(xs, ytop, tag):
        for x in xs:
            f.line(x, ytop, x, ytop + 14); f.line(x, ytop + 36, x, ytop + 50); f.line(x, ytop + 36, x - 10, ytop + 15)
            f.path(f"M {f1(x - 3)} {f1(ytop + 14)} A 3 3 0 0 0 {f1(x + 3)} {f1(ytop + 14)}", "xf-ln")
        f.line(xs[0] - 6, ytop + 25, xs[-1] - 4, ytop + 25, "xf-dash")
        f.text(xs[0] - 16, ytop + 30, tag, "xf-tag", "end")
    # KM1 at x 150 180 210
    xs1 = [150, 180, 210]
    for x, k in zip(xs1, ["L1", "L2", "L3"]):
        f.line(x, ys[k], x, 100); f.dot(x, ys[k])
    contacts(xs1, 100, "-KM1")
    # overload
    for x in xs1:
        f.line(x, 150, x, 162); f.rect(x - 6, 162, 12, 22, "xf-box", 1); f.line(x, 184, x, 196)
    f.line(xs1[-1] + 8, 173, xs1[-1] + 24, 173, "xf-dash"); f.text(xs1[-1] + 28, 177, "-F2 ตั้ง 0.58·In", "xf-k")
    # motor windings
    wy = {"U": 250, "V": 296, "W": 342}
    xl, xr = 330, 470
    for (k, y), x in zip(wy.items(), xs1):
        f.line(x, 196, x, y); f.line(x, y, xl, y)
        f.circ(xl, y, 5, "xf-term"); f.text(xl, y - 10, k + "1", "xf-k", "middle")
        n = 4; r = (xr - xl - 30) / n / 2
        f.line(xl + 5, y, xl + 15, y)
        f.path(f"M {f1(xl + 15)} {y} " + " ".join(f"a {f1(r)} {f1(r)} 0 0 1 {f1(2 * r)} 0" for _ in range(n)), "xf-ln")
        f.line(xr - 15, y, xr - 5, y)
        f.circ(xr, y, 5, "xf-term"); f.text(xr, y - 10, k + "2", "xf-k", "middle")
        f.text((xl + xr) / 2, y + 16, f"ขดลวด {k}", "xf-k", "middle")
    f.rect(310, 222, 180, 144, "xf-dash", 10); f.text(400, 214, "กล่องขั้วมอเตอร์ -M1 (400/690 V)", "xf-k", "middle")
    # KM2 star: shorts U2 V2 W2 at x=540
    xs2 = 540
    for k, y in wy.items():
        f.line(xr + 5, y, 700, y) if False else None
    f.line(xr + 5, wy["U"], 520, wy["U"]); f.line(xr + 5, wy["V"], 520, wy["V"]); f.line(xr + 5, wy["W"], 520, wy["W"])
    for k, y in wy.items():
        f.dot(520, y)
        f.line(520, y, 540, y); f.line(540, y, 556, y - 8); f.line(560, y, 572, y)
    f.line(572, wy["U"], 572, wy["W"], "xf-ln")
    f.line(548, wy["U"] - 4, 548, wy["W"] - 4, "xf-dash"); f.text(584, wy["V"] + 4, "-KM2 สตาร์ (0.33·In)", "xf-tag")
    # KM3 delta: L1→V2, L2→W2, L3→U2 drops at x 620 650 680
    xs3 = [620, 650, 680]
    for x, k in zip(xs3, ["L1", "L2", "L3"]):
        f.line(x, ys[k], x, 100); f.dot(x, ys[k])
    contacts(xs3, 100, "-KM3")
    tgt = {620: "V", 650: "W", 680: "U"}
    lane = {620: 186, 650: 204, 680: 168}
    for x in xs3:
        y_t = wy[tgt[x]]
        f.line(x, 150, x, lane[x]); f.line(x, lane[x], 500 + (x - 620) / 3, lane[x]); f.line(500 + (x - 620) / 3, lane[x], 500 + (x - 620) / 3, y_t)
        f.dot(500 + (x - 620) / 3, y_t)
        f.text(x + 6, lane[x] - 4, f"→ {tgt[x]}2", "xf-tag")
    f.text(600, 230, "KM3 (0.58·In):", "xf-k"); f.text(600, 246, "L1→V2 · L2→W2 · L3→U2", "xf-k")
    f.text(380, 392, "ช่วงสตาร์: KM1 + KM2 · ช่วงเดลต้า: KM1 + KM3 · KM2 กับ KM3 ต้องอินเตอร์ล็อกทั้งทางไฟฟ้าและทางกล", "xf-m", "middle")
    return f.svg()


# =========================================================================== 7 · STARTING METHODS, VFD
@fig("acm-start-compare")
def _():
    f = F(760, 486, "เปรียบเทียบวิธีสตาร์ทบนกราฟเดียวกัน: กระแสและแรงบิดเทียบความเร็วของ DOL สตาร์-เดลต้า ออโต้ทรานส์ฟอร์เมอร์ 65 % ซอฟต์สตาร์ทจำกัดกระแส 3 In และ VFD", "acm-start-compare")
    pi_ = Plot(f, 66, 22, 600, 170, (0, 1500), (0, 7))
    pi_.frame(range(0, 1501, 250), [0, 2, 4, 6], yl="กระแสสาย I/In", yf=lambda v: f"{v:g}")
    pt = Plot(f, 66, 230, 600, 170, (0, 1500), (0, 3.2))
    pt.frame(range(0, 1501, 250), [0, 1, 2, 3], xl="ความเร็วรอบ n (rpm)", yl="T/Tn", yf=lambda v: f"{v:g}")
    TD, ID = tn("dc")
    curve(pi_, ID, "xf-dash"); curve(pt, TD, "xf-dash")
    nsw = 1420
    curve(pi_, [(n, i / 3) for n, i in ID if n <= nsw] + [(nsw, A.motor(A.n2s(nsw))[0] / IN)] + [(n, i) for n, i in ID if n > nsw], "xf-b")
    curve(pt, [(n, t / 3) for n, t in TD if n <= nsw] + [(nsw, A.motor(A.n2s(nsw))[1] / TN)] + [(n, t) for n, t in TD if n > nsw], "xf-b")
    tap, nat = 0.65, 1380
    curve(pi_, [(n, i * tap * tap) for n, i in ID if n <= nat] + [(n, i) for n, i in ID if n > nat], "xf-e")
    curve(pt, [(n, t * tap * tap) for n, t in TD if n <= nat] + [(n, t) for n, t in TD if n > nat], "xf-e")
    sI, sT = [], []
    for n, i in ID:
        v = min(1.0, 3.0 / i)
        sI.append((n, i * v)); sT.append((n, A.motor(A.n2s(n))[1] / TN * v * v))
    curve(pi_, sI, "xf-c"); curve(pt, sT, "xf-c")
    curve(pi_, [(0, 1.3), (1471, 1.3), (1471, 1.0), (1500, 1.0)], "xf-a"); curve(pt, [(0, 1.5), (1471, 1.5)], "xf-a")
    curve(pt, load_pts("quad", 1.0), "xf-ln")
    # labels placed where curves separate
    f.text(pi_.X(150), pi_.Y(6.45) - 6, "DOL", "xf-k")
    f.text(pi_.X(150), pi_.Y(3.0) - 6, "ซอฟต์สตาร์ท 3·In", "xf-tc")
    f.text(pi_.X(700), pi_.Y(2.45) - 6, "ออโต้ทรานส์ฯ 65 %", "xf-k")
    f.text(pi_.X(700), pi_.Y(1.9) + 14, "สตาร์-เดลต้า", "xf-tb")
    f.text(pi_.X(150), pi_.Y(1.3) + 14, "VFD ~1.3·In", "xf-ta")
    f.text(pt.X(150), pt.Y(2.2) - 6, "DOL", "xf-k")
    f.text(pt.X(150), pt.Y(1.5) - 6, "VFD ~1.5·Tn ตลอดช่วง", "xf-ta")
    f.text(pt.X(560), pt.Y(1.0) - 6, "ออโต้ 65 %", "xf-k")
    f.text(pt.X(560), pt.Y(0.8) + 14, "สตาร์-เดลต้า", "xf-tb")
    f.text(pt.X(150), pt.Y(0.47) + 14, "ซอฟต์ 3·In", "xf-tc")
    f.text(pt.X(1000), pt.Y(0.12 + 0.88 * (1000 / NN) ** 2) + 16, "โหลดปั๊ม 100 %", "xf-k", "middle")
    note(f, 452, "ลดแรงดันลดทั้งกระแสและแรงบิด (I ∝ V, T ∝ V²): ซอฟต์สตาร์ท 3·In ได้แรงบิดเริ่มเพียง 0.46·Tn → ใช้กับปั๊ม/พัดลม")
    note(f, 470, "VFD ได้แรงบิดสูงด้วยกระแสต่ำเพราะลดทั้งแรงดันและความถี่ · ออโต้ฯ 65 %: กระแสสายเหลือ 0.65² = 0.42× ของ DOL")
    return f.svg()


@fig("acm-vfd-family")
def _():
    f = F(760, 390, "กราฟแรงบิด-ความเร็วเมื่อขับด้วยอินเวอร์เตอร์ V/f: 10 20 30 40 50 Hz แรงบิดสูงสุดคงที่ และ 60 75 Hz ย่านลดสนามที่แรงบิดสูงสุดลดลง พร้อมโหลดแรงบิดคงที่และโหลดปั๊ม", "acm-vfd-family")
    pl = Plot(f, 66, 26, 620, 270, (0, 2250), (0, 3.4))
    pl.frame(range(0, 2251, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], xl="ความเร็วรอบ n (rpm)", yl="T/Tn", yf=lambda v: f"{v:g}")
    for fr, c in ((10, "xf-a"), (20, "xf-a"), (30, "xf-a"), (40, "xf-a"), (50, "xf-b"), (60, "xf-d"), (75, "xf-d")):
        boost = 0.035 * A.VP * max(0, 1 - fr / 50)
        V = A.VP * min(fr, 50) / 50 + boost
        ns_ = 30 * fr
        T_ = []
        n = max(0, ns_ - 420)
        while n < ns_ - 0.3:
            T_.append((n, A.motor(1 - n / ns_, V, fr)[1] / TN)); n += 3
        curve(pl, T_, c)
        f.text(pl.X(ns_) - 2, pl.Y(0) - 6, f"{fr} Hz", "xf-k", "end" if fr < 75 else "end")
    curve(pl, [(0, 1), (1500, 1), (2250, 1500 / 2250)], "xf-dash")
    curve(pl, load_pts("quad", 1.0, 0, 1500), "xf-c")
    f.text(pl.X(1240), pl.Y(1.04), "Tn", "xf-k"); f.text(pl.X(1880), pl.Y(0.95), "P คงที่", "xf-k")
    f.text(pl.X(20), pl.Y(3.2), "ย่านฟลักซ์คงที่: V/f คงที่ → Tk เกือบคงที่ เส้นเลื่อนขนานตามความถี่", "xf-ta")
    f.text(pl.X(1720), pl.Y(2.45), "ย่านลดสนาม V = 400 V: Tk ∝ 1/f²", "xf-k")
    f.text(pl.X(700), pl.Y(0.42), "ปั๊ม T ∝ n²", "xf-tc", "middle")
    note(f, 346, "เส้นประ = แรงบิดต่อเนื่องที่ได้ · VFD ไม่ได้ “เพิ่ม” แรงบิด แต่ย้ายกราฟไปทางซ้าย: สตาร์ทที่ 1–3 Hz อยู่ใกล้ยอดกราฟความถี่นั้น")
    note(f, 364, "ความถี่ต่ำ R₁ ทำให้ฟลักซ์ตก ต้องเพิ่มแรงดัน (torque boost) หรือใช้ sensorless vector")
    note(f, 382, "พัดลมบนเพลามอเตอร์ระบายความร้อนได้น้อยลงที่รอบต่ำ — งานแรงบิดคงที่รอบต่ำนานๆ ต้องลดพิกัดหรือเพิ่มพัดลมอิสระ")
    return f.svg()


# =========================================================================== 8 · DESIGN
@fig("acm-design-sld")
def _():
    f = F(760, 430, "ตัวอย่างออกแบบวงจรมอเตอร์ปั๊ม 7.5 kW สตาร์ทตรง: หม้อแปลง 500 kVA ระดับกระแสลัดวงจร ขนาดสาย 4 mm² ยาว 40 m แรงดันตกขณะเดินและสตาร์ท เบรกเกอร์ คอนแทกเตอร์ และโอเวอร์โหลด", "acm-design-sld")
    x = 120
    f.line(x, 20, x, 30); f.text(x + 16, 30, "22 kV", "xf-k")
    s_xfmr(f, x, 30); f.text(x + 18, 54, "TR 500 kVA · uk 4 % · 22 kV/416-240 V", "xf-k")
    f.line(x - 60, 84, x + 60, 84, "xf-bus"); f.text(x + 70, 88, "MDB/MCC · Ik3 ≈ 18 kA", "xf-tag")
    s_cb(f, x, 84); f.text(x + 14, 112, "-Q1 MCCB 32 A (≤ 250 % In) Icu ≥ 25 kA", "xf-k")
    s_kmain(f, x, 136); f.text(x + 14, 164, "-K1 คอนแทกเตอร์ 18 A AC-3", "xf-k")
    s_therm(f, x, 188); f.text(x + 30, 214, "-F2 โอเวอร์โหลด 12–18 A ตั้ง 14.6 A คลาส 10", "xf-k")
    f.line(x, 240, x, 300, "xf-ln"); f.text(x + 14, 262, "สาย 4 mm² Cu PVC (60227 IEC 01) ในท่อ · 40 m", "xf-k"); f.text(x + 14, 278, "Iz = 28 × 0.87 = 24.4 A ≥ 1.25 In = 18.3 A", "xf-k")
    s_motor(f, x, 300); f.text(x + 30, 330, "M 3~ 7.5 kW 400 V Δ · In 14.6 A · Is 6.5·In", "xf-k")
    bx = 470
    f.rect(bx, 24, 270, 330, "xf-paper", 8)
    rows = [("กระแสพิกัด In", "14.6 A (แผ่นป้าย)"), ("กระแสสตาร์ท", "6.5 × 14.6 = 95 A"), ("สายขั้นต่ำ (125 %)", "18.3 A → 4 mm²"),
            ("ΔV ขณะเดิน", "4.7 V = 1.2 %"), ("ΔV สายขณะสตาร์ท", "11.6 V = 2.9 %"), ("ΔV หม้อแปลงตอนสตาร์ท", "≈ 0.5 %"), ("รวมขณะสตาร์ท", "≈ 3.4 % ✓"),
            ("เบรกเกอร์เวลาผกผัน", "≤ 2.5 × 14.6 = 36.5 A"), ("เลือก", "32 A หรือ MPCB 10–16 A"), ("Ik3 ปลายสาย", "≈ 1.0 kA"), ("Ik ลงดิน (TN)", "≈ 0.5 kA ✓")]
    for i, (a, b) in enumerate(rows):
        f.text(bx + 12, 50 + i * 27, a, "xf-k"); f.text(bx + 258, 50 + i * 27, b, "xf-m", "end")
    note(f, 392, "เลือกสายจากกระแสต่อเนื่อง (≥ 125 % In ตาม ว.ส.ท.) แล้วตรวจแรงดันตกขณะเดินและสตาร์ท และกระแสลัดวงจรปลายสายให้อุปกรณ์ตัดทันที")
    note(f, 410, "พิกัดกระแสสายเป็นค่าสอน (IEC 60364-5-52 วิธี B1 30 °C × 0.87 ที่ 40 °C) — งานจริงใช้ตาราง ว.ส.ท. ฉบับที่บังคับใช้")
    return f.svg()


@fig("acm-tcc")
def _():
    f = F(760, 410, "กราฟเวลา-กระแสของการป้องกันวงจรมอเตอร์ 7.5 kW: กระแสสตาร์ทตรง 95 A นาน 0.8 วินาที เทียบ MPCB ตั้ง 14.6 A และเบรกเกอร์ลูกย่อย 20 A แบบ C และ D", "acm-tcc")
    x0, y0, w, h = 80, 20, 600, 290
    lx = lambda I: x0 + (math.log10(I) - 1) / (math.log10(2000) - 1) * w
    ly = lambda t: y0 + h - (math.log10(t) - math.log10(0.005)) / (math.log10(10000) - math.log10(0.005)) * h
    for I in [10, 20, 50, 100, 200, 500, 1000, 2000]:
        f.line(lx(I), y0, lx(I), y0 + h, "xf-grid"); f.text(lx(I), y0 + h + 15, f"{I:g}", "xf-k", "middle")
    for t in [0.01, 0.1, 1, 10, 100, 1000, 10000]:
        f.line(x0, ly(t), x0 + w, ly(t), "xf-grid"); f.text(x0 - 6, ly(t) + 4, f"{t:g}", "xf-k", "end")
    f.text(x0 + w / 2, y0 + h + 34, "กระแส (A rms)", "xf-m", "middle")
    f.text(x0 - 48, y0 + h / 2, "เวลา (s)", "xf-m", "middle", -90)
    # MCB 20 A type C / D: shared thermal part (IEC 60898-1: 1.45 In < 1 h, 2.55 In 1–60 s), magnetic 5–10 / 10–20 In
    tau_m = 91.0
    th = []
    m = 1.16
    while m < 20:
        t = tau_m * math.log(m * m / (m * m - 1.13 ** 2))
        th.append((m, t)); m *= 1.03
    for mag, c, lab, yl_ in ((10, "xf-c", "MCB 20 A แบบ C: ปลดทันที 100–200 A", 0.05), (20, "xf-d", "แบบ D: 200–400 A", 0.016)):
        pts = [(lx(20 * a), ly(min(t, 9999))) for a, t in th if a < mag]
        pts += [(lx(20 * mag), pts[-1][1]), (lx(20 * mag), ly(0.005))]
        f.poly(pts, c)
        f.rect(lx(20 * mag / 2), ly(0.1), lx(20 * mag) - lx(20 * mag / 2), ly(0.005) - ly(0.1), "xf-fc" if c == "xf-c" else "xf-fb", 0)
        f.text(lx(20 * mag) + 4, ly(yl_), lab, "xf-tc" if c == "xf-c" else "xf-k")
    tau10 = 7.0 / math.log(7.2 ** 2 / (7.2 ** 2 - 1.44))
    mp = []
    m = 1.22
    while 14.6 * m < 208:
        t = tau10 * math.log(m * m / (m * m - 1.44))
        if t < 10000:
            mp.append((lx(14.6 * m), ly(t)))
        m *= 1.03
    mp += [(lx(208), mp[-1][1]), (lx(208), ly(0.005))]
    f.poly(mp, "xf-a")
    f.text(lx(110), ly(30), "MPCB ตั้ง 14.6 A (คลาส 10)", "xf-ta"); f.text(lx(110), ly(14), "แม่เหล็ก 208 A", "xf-ta")
    Ist, ta = 95, 0.81
    f.poly([(lx(14.6), ly(10000)), (lx(14.6), ly(ta)), (lx(Ist), ly(ta)), (lx(Ist), ly(0.01))], "xf-b")
    f.poly([(lx(Ist), ly(0.01)), (lx(Ist * 1.36), ly(0.01)), (lx(Ist * 1.36), ly(0.005))], "xf-dash")
    f.text(lx(22), ly(ta) + 18, "สตาร์ท 95 A × 0.8 s (สายพาน)", "xf-tb")
    f.text(lx(14.6) + 6, ly(3000), "In 14.6 A", "xf-tb")
    note(f, 350, "แบบ C ช่วงปลดทันที (แถบเขียว) ทับกระแสสตาร์ท 95 A และยอดไซเคิลแรก → ทริปตอนสตาร์ทได้ · ใช้ MPCB แบบ D หรือ MCCB")
    note(f, 368, "MPCB: ส่วนความร้อนตั้งเท่า In ป้องกันโหลดเกิน ส่วนแม่เหล็ก ~13 × Ie สูงกว่ากระแสสตาร์ทชัดเจนแต่ตัดลัดวงจรทันที")
    note(f, 386, "รูปร่างเส้นโค้งโดยประมาณเพื่อการสอน (IEC 60947-4-1 คลาส 10 · IEC 60898-1 แบบ C/D) งานจริงใช้กราฟผู้ผลิต")
    note(f, 404, "หลัก: เส้นสตาร์ทของมอเตอร์ต้องอยู่ซ้าย-ล่างของเส้นอุปกรณ์ป้องกันทุกตัว")
    return f.svg()


# =========================================================================== driver
def render(key):
    return FIGS[key]()


def main():
    force = "--all" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")] or sorted(glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True))
    total, cache, missing = 0, {}, set()
    for fpath in files:
        src = open(fpath, encoding="utf-8").read()

        def rep(m):
            key, body = m.group(1), m.group(2)
            if not key.startswith("acm-"):
                return m.group(0)
            if key not in FIGS:
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
        print("unknown acm keys:", ", ".join(sorted(missing)))
    print(total, "file(s) updated")


if __name__ == "__main__":
    if "--list" in sys.argv:
        print("\n".join(sorted(FIGS)))
    elif "--preview" in sys.argv:
        only = [a for a in sys.argv[1:] if a.startswith("acm-")]
        out = ['<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../assets/site.css"><body class="mc" style="padding:20px;background:var(--paper)"><article class="mc">']
        for k in sorted(FIGS):
            if only and k not in only:
                continue
            out.append(f'<h3 style="font:14px monospace">{k}</h3><figure class="xfig" style="max-width:820px">{render(k)}</figure>')
        open(sys.argv[sys.argv.index("--preview") + 1], "w", encoding="utf-8").write("".join(out) + "</article>")
    else:
        main()
