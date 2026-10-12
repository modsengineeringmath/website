# Figures for /learn/function-generator/* lesson pages.
# Usage: python3 scripts/fg_figs.py   (rewrites every <!--FIG:key-->…<!--/FIG--> block in src/pages/learn/function-generator/*.html)
import math, os, re, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svglib import Fig, Axes, Sch, scope_screen, finish, TAU, f1

FIGS = {}


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def sat(x, lo, hi):
    return max(lo, min(hi, x))


# ============================================================ oscilloscope page
@fig("osc-screen")
def _():
    F = Fig(660, 340, "จอออสซิลโลสโคป 10 ช่องแนวนอน 8 ช่องแนวตั้ง แสดงไซน์สูง 4 ช่อง คาบ 5 ช่อง ที่ 500 มิลลิโวลต์ต่อช่องและ 200 ไมโครวินาทีต่อช่อง ได้ 2 Vpp ความถี่ 1 kHz", "o1")
    A = scope_screen(F, 20, 14, 400, 320)
    A.plot(lambda x: 2 * math.sin(TAU * (x - 5) / 5), "sw1", 500)
    # Vpp marker at x = 7.5 between trough (8.75) and peak (6.25)
    for v in (2, -2):
        F.line(A.X(6.25 if v > 0 else 8.75), A.Y(v), A.X(9.6), A.Y(v), "sgr")
    F.add(f'<path style="stroke:#e6edf3;stroke-width:1.4;fill:none" d="M{f1(A.X(9.3))} {f1(A.Y(2))} V{f1(A.Y(-2))} M{f1(A.X(9.3)-5)} {f1(A.Y(2))} h10 M{f1(A.X(9.3)-5)} {f1(A.Y(-2))} h10"/>')
    F.text(A.X(9.3) - 8, A.Y(0.3), "4 div", "st", "end")
    y = A.Y(-3.2)
    F.add(f'<path style="stroke:#e6edf3;stroke-width:1.4;fill:none" d="M{f1(A.X(5))} {f1(y)} H{f1(A.X(10))} M{f1(A.X(5))} {f1(y-5)} v10 M{f1(A.X(10))} {f1(y-5)} v10"/>')
    F.text(A.X(7.5), y - 6, "5 div = 1 คาบ", "st", "middle")
    F.text(28, 30, "CH1 500 mV/div", "st", style="fill:#f6d32d")
    F.text(412, 30, "H 200 µs/div", "st", "end")
    F.text(440, 40, "อ่านค่า", "t")
    rows = [("V/div", "500 mV (ตั้งไว้)"), ("Time/div", "200 µs (ตั้งไว้)"), ("Vpp", "4 div × 0.5 V = 2 V"), ("Vp", "2 div × 0.5 V = 1 V"),
            ("T", "5 div × 200 µs = 1 ms"), ("f = 1/T", "1 kHz"), ("Vrms (ไซน์)", "Vp/√2 = 0.707 V")]
    for i, (k, v) in enumerate(rows):
        F.text(440, 68 + i * 34, k, "s")
        F.text(440, 84 + i * 34, v)
    return F.svg()


@fig("osc-trigger")
def _():
    F = Fig(660, 250, "ซ้าย ไม่มีทริกเกอร์ สโคปเริ่มวาดที่เวลาสุ่ม ภาพซ้อนกันหลายเส้นจนอ่านไม่ได้ ขวา ทริกเกอร์ขอบขึ้นที่ระดับ 0 โวลต์ ทุกครั้งเริ่มที่จุดเดียวกัน ภาพจึงนิ่ง", "o2")
    A = scope_screen(F, 14, 10, 300, 200)
    for k, ph in enumerate([0, 0.13, 0.31, 0.47, 0.66, 0.82]):
        A.plot(lambda x, ph=ph: 2.4 * math.sin(TAU * (x / 4 + ph)), "sw1" if k == 0 else "sw2", 300)
    F.text(164, 236, "ไม่มีทริกเกอร์ (หรือระดับอยู่นอกสัญญาณ): ภาพวิ่ง", "s", "middle")
    B = scope_screen(F, 346, 10, 300, 200)
    B.plot(lambda x: 2.4 * math.sin(TAU * (x - 5) / 4), "sw1", 300)
    F.add(f'<line x1="{f1(B.X(0))}" y1="{f1(B.Y(0))}" x2="{f1(B.X(10))}" y2="{f1(B.Y(0))}" style="stroke:#ff8a3d;stroke-width:1.3;stroke-dasharray:6 4"/>')
    F.add(f'<path style="fill:#ff8a3d" d="M{f1(B.X(5)-6)} {f1(B.y)} h12 l-6 9z"/>')
    F.add(f'<circle cx="{f1(B.X(5))}" cy="{f1(B.Y(0))}" r="5" style="fill:none;stroke:#ff8a3d;stroke-width:2"/>')
    F.text(B.X(5) + 8, B.Y(0) - 8, "จุดทริกเกอร์", "st", style="fill:#ff8a3d")
    F.text(B.X(0.15), B.Y(0) - 6, "Level 0 V", "st", style="fill:#ff8a3d")
    F.text(496, 236, "ทริกเกอร์ขอบขึ้นที่ 0 V: เริ่มที่จุดเดิมทุกครั้ง ภาพนิ่ง", "s", "middle")
    return F.svg()


def probe_wave(r, tp=0.18, n=500):
    """10x probe response to a square wave (period 2, unit levels) with compensation ratio r."""
    pts = []
    dt = 4.0 / n
    # steady state: w is low-pass of u with tau tp; start from periodic state
    w = -math.tanh(1 / (2 * tp))  # value of low-pass at start of high half (symmetric square ±1, half-period 1)
    for i in range(n + 1):
        t = i * dt
        u = 1 if (t % 2) < 1 else -1
        y = r * u + (1 - r) * w
        pts.append((t, y))
        w += (u - w) * (1 - math.exp(-dt / tp))
    return pts


@fig("osc-probe")
def _():
    F = Fig(660, 330, "โพรบ 10 เท่า: ปลายโพรบมี R1 9 เมกะโอห์มขนานกับตัวเก็บประจุปรับค่าได้ C1 ต่อผ่านสายเข้าสโคปที่มี 1 เมกะโอห์มขนานกับ C2 ด้านล่างเป็นภาพคลื่นสี่เหลี่ยมเมื่อชดเชยขาด พอดี และเกิน", "o3")
    S = Sch(F)
    # tip
    S.wire((30, 70), (70, 70))
    S.term(30, 70)
    F.text(14, 96, "ปลายโพรบ", "s")
    S.wire((70, 70), (70, 40), (100, 40))
    S.res(100, 40, 180, 40, label="R₁ = 9 MΩ", ly=-12)
    S.wire((180, 40), (210, 40), (210, 70))
    S.wire((70, 70), (70, 100), (122, 100))
    S.cap(122, 100, 158, 100, label="C₁ (ทริมเมอร์)", lx=0, ly=30, anchor="middle")
    S.wire((154, 108), (162, 92))
    S.wire((158, 100), (210, 100), (210, 70))
    S.wire((210, 70), (330, 70))
    S.flush()
    F.rect(232, 58, 86, 24, "bx2", 6)
    F.text(275, 75, "สายโคแอกซ์", "s", "middle")
    # scope input
    S.wire((330, 70), (330, 40), (370, 40))
    S.res(370, 40, 450, 40, label="R₂ = 1 MΩ", ly=-12)
    S.wire((450, 40), (480, 40), (480, 130))
    S.wire((330, 70), (330, 100), (392, 100))
    S.cap(392, 100, 428, 100, label="C₂ = C_สาย + C_อินพุต", lx=-12, ly=30, anchor="middle")
    S.wire((428, 100), (480, 100))
    S.wire((480, 70), (520, 70))
    S.node(480, 70)
    S.gnd(480, 130)
    F.add('<rect x="322" y="6" width="196" height="174" rx="10" style="fill:none;stroke:var(--ink-3);stroke-dasharray:5 4"/>')
    F.text(510, 196, "ภายในสโคป", "s", "end")
    F.text(530, 74, "→ ADC", "s")
    F.text(560, 36, "พอดีเมื่อ", "s")
    F.text(560, 56, "R₁C₁ = R₂C₂", "t")
    F.text(560, 92, "ลดทอน", "s")
    F.text(560, 112, "R₂/(R₁+R₂)", "t")
    F.text(560, 132, "= 1/10", "t")
    for i, (r, name) in enumerate([(0.75, "ชดเชยขาด (C₁ น้อยไป)"), (1.0, "พอดี"), (1.3, "ชดเชยเกิน (C₁ มากไป)")]):
        x0 = 20 + i * 215
        A = Axes(F, x0, 222, 195, 70, 0, 4, -1.6, 1.6)
        F.rect(x0 - 4, 214, 203, 86, "scr", 6)
        A.pts(probe_wave(r), "sw1")
        F.text(x0 + 97, 318, name, "s", "middle")
    return finish(F, S)


@fig("osc-alias")
def _():
    F = Fig(660, 236, "สัญญาณไซน์ 9 รอบ ถูกสุ่มเพียง 10 จุดต่อช่วง จุดที่สุ่มได้เรียงตัวเป็นไซน์ช้าเพียง 1 รอบ สโคปจึงแสดงความถี่ผิดเป็น 1 ใน 9 ของความถี่จริง", "o4")
    A = Axes(F, 40, 30, 560, 150, 0, 1, -1.25, 1.25)
    A.axes(xlabel="t")
    A.plot(lambda t: math.sin(TAU * 9 * t), "w2", 900)
    A.plot(lambda t: -math.sin(TAU * t), "w3", 300)
    for k in range(11):
        t = k / 10
        F.dot(A.X(t), A.Y(math.sin(TAU * 9 * t)), 5)
    F.text(40, 206, "เส้นฟ้า: สัญญาณจริง f = 9 รอบ · จุดดำ: จุดที่สุ่ม f_s = 10 จุด", "s")
    F.text(40, 224, "เส้นแดง: สิ่งที่สโคปวาด |f − f_s| = 1 รอบ (ผิด!)", "a")
    return F.svg()


@fig("osc-rise")
def _():
    F = Fig(640, 230, "ขอบขาขึ้นของคลื่นสี่เหลี่ยม เวลาขาขึ้นวัดจาก 10 เปอร์เซ็นต์ถึง 90 เปอร์เซ็นต์ของความสูง", "o5")
    A = Axes(F, 50, 20, 520, 160, -2, 6, -0.1, 1.15)
    A.axes(zero=False, xlabel="t")
    step = lambda t: 0.5 * (1 + math.erf((t - 1.5) / 0.9))
    A.plot(step, "w1", 400)
    A.hline(1, "dsh", "100 %").hline(0.9, "gr", "90 %").hline(0.1, "gr", "10 %").hline(0, "dsh", "0 %")
    inv = lambda p: 1.5 + 0.9 * _erfinv(2 * p - 1)
    t10, t90 = inv(0.1), inv(0.9)
    A.vline(t10, "dsh").vline(t90, "dsh")
    F.line(A.X(t10), A.Y(0.5), A.X(t90), A.Y(0.5), "ar", "both")
    F.text(A.X(t10) + 6, A.Y(0.5) - 8, "t_r", "a")
    F.text(330, 214, "t_r ของระบบ ≈ 0.35 / BW  ·  ค่าที่สโคปแสดง = √(t_r,สัญญาณ² + t_r,สโคป² + t_r,โพรบ²)", "s", "middle")
    return F.svg()


def _erfinv(y):
    # Newton iterations on erf
    x = 0.0
    for _ in range(60):
        e = math.erf(x) - y
        x -= e / (2 / math.sqrt(math.pi) * math.exp(-x * x))
    return x


@fig("osc-coupling")
def _():
    F = Fig(660, 230, "คลื่นสี่เหลี่ยม 20 เฮิรตซ์ มีออฟเซต 1 โวลต์ ซ้ายคัปปลิง DC เห็นระดับจริง ขวาคัปปลิง AC ค่าเฉลี่ยถูกตัดออกและยอดเอียงเพราะตัวเก็บประจุภายใน", "o6")
    sq = lambda t: 2 if (t % 1) < 0.5 else 0
    A = Axes(F, 40, 30, 260, 150, 0, 2, -1.5, 2.6)
    A.axes(ylabel="DC", xlabel="t")
    A.plot(sq, "w1", 600)
    A.hline(1, "dsh", "เฉลี่ย 1 V")
    tau = 1.4
    pts = []
    y = -1.0
    # periodic steady state of high-pass on square ±1 around mean
    a = math.exp(-0.5 / tau)
    vtop = 2 / (1 + a)  # level right after rising edge
    n = 600
    for i in range(n + 1):
        t = 2 * i / n
        ph = t % 1
        if ph < 0.5:
            v = vtop * math.exp(-ph / tau)
        else:
            v = (vtop * a - 2) * math.exp(-(ph - 0.5) / tau)
        pts.append((t, v))
    B = Axes(F, 380, 30, 260, 150, 0, 2, -1.5, 2.6)
    B.axes(ylabel="AC", xlabel="t")
    B.pts(pts, "w2")
    F.text(170, 214, "DC: เห็นทั้งออฟเซตและรูปทรงจริง", "s", "middle")
    F.text(510, 214, "AC: ตัดค่าเฉลี่ย ยอดเอียง (tilt) ที่ความถี่ต่ำ", "s", "middle")
    return F.svg()


@fig("osc-ground")
def _():
    F = Fig(660, 306, "อันตรายจากคลิปกราวด์ของโพรบ: กราวด์โพรบต่อกับสายดินของปลั๊กสโคป ถ้าหนีบกับจุดที่มีแรงดันเทียบกับดิน เช่นวงจรที่ต่อไฟบ้านตรง จะเกิดลัดวงจรผ่านสายโพรบ ทางแก้คือวัดแบบผลต่างสองช่อง ใช้โพรบดิฟเฟอเรนเชียล หรือหม้อแปลงแยกที่วงจร", "o7")
    S = Sch(F)
    F.rect(20, 30, 150, 120, "bx", 10)
    F.text(95, 22, "ไฟบ้าน 230 V", "s", "middle")
    F.text(95, 60, "L (มีไฟ)", "t", "middle")
    F.text(95, 120, "N (ต่อดินที่ตู้)", "t", "middle")
    S.wire((170, 60), (260, 60))
    S.wire((170, 120), (260, 120))
    F.rect(260, 30, 140, 120, "bx2", 10)
    F.text(330, 22, "วงจรต่อไฟบ้านตรง", "s", "middle")
    F.text(330, 80, "จุด A", "t", "middle")
    F.text(330, 98, "ไม่ใช่กราวด์!", "a", "middle")
    S.term(400, 90)
    F.rect(500, 30, 140, 120, "bx", 10)
    F.text(570, 22, "ออสซิลโลสโคป", "s", "middle")
    F.text(570, 96, "ตัวถัง = ดิน", "t", "middle")
    S.wire((400, 90), (450, 90), (450, 110), (500, 110))
    F.text(452, 84, "คลิปกราวด์", "s", "middle")
    S.wire((570, 150), (570, 196), (95, 196), (95, 150))
    F.text(330, 190, "สายดินของปลั๊กสโคป ↔ สายดินของตู้ไฟ ↔ N", "s", "middle")
    S.flush()
    F.add('<path d="M404 98 H444 V118 H520 Q560 120 562 150 V204 H88 V150" style="fill:none;stroke:#c43c3c;stroke-width:3;stroke-dasharray:8 5"/>')
    F.text(330, 226, "กระแสลัดวงจรไหลผ่านสายกราวด์โพรบ: โพรบไหม้ วงจรเสีย และอันตรายต่อคน", "s", "middle", "fill:#c43c3c")
    F.text(20, 256, "ทางที่ถูก: วัดสองจุดเทียบกราวด์ด้วย 2 ช่อง แล้วใช้ Math CH1 − CH2", "t")
    F.text(20, 276, "หรือใช้โพรบดิฟเฟอเรนเชียล หรือหม้อแปลงแยก (isolation) ที่ฝั่งวงจร", "t")
    F.text(20, 296, "ห้ามตัดสายดินของปลั๊กสโคปเพื่อให้ตัวเครื่อง “ลอย” เด็ดขาด ตัวเครื่องจะมีไฟ", "s")
    return finish(F, S)



# ============================================================ measurements page
@fig("meas-phase")
def _():
    F = Fig(660, 250, "สัญญาณสองช่อง CH2 ตามหลัง CH1 เป็นเวลา Delta t วัดที่จุดตัดศูนย์ขาขึ้น คาบ T วัดจากจุดตัดศูนย์ขาขึ้นสองจุดของ CH1 มุมเฟสเท่ากับลบ 360 องศาคูณ Delta t ส่วน T", "b1")
    A = Axes(F, 40, 20, 560, 170, 0, 2.2, -1.3, 1.3)
    A.axes(xlabel="t")
    A.plot(lambda t: math.sin(TAU * t), "w1", 500)
    A.plot(lambda t: 0.7 * math.sin(TAU * (t - 0.125)), "w2", 500)
    F.text(A.X(0.26), A.Y(1.12), "CH1 (ขาเข้า)", "c1")
    F.text(A.X(0.47), A.Y(0.78), "CH2 (ขาออก)", "c2")
    for t in (1, 1.125, 2):
        A.vline(t, "dsh")
    F.line(A.X(1), A.Y(-1.05), A.X(1.125), A.Y(-1.05), "ar", "both")
    F.text(A.X(1.0625), A.Y(-1.05) + 18, "Δt", "a", "middle")
    F.line(A.X(1), A.Y(1.2), A.X(2), A.Y(1.2), "ar", "both")
    F.text(A.X(1.5), A.Y(1.2) - 6, "T", "a", "middle")
    F.text(330, 236, "φ = −360° · Δt/T = −360° × 0.125 = −45°  (CH2 ตามหลัง → เฟสติดลบ)", "s", "middle")
    return F.svg()


@fig("meas-lissajous")
def _():
    F = Fig(660, 300, "ซ้าย วงรีลิสซาจูเมื่อเฟสต่างกัน 45 องศา จุดตัดแกนตั้ง y0 และยอด ymax ไซน์ของมุมเฟสเท่ากับ y0 หาร ymax ขวา รูปลิสซาจูที่มุมเฟส 0 45 90 135 180 องศา และอัตราส่วนความถี่ 1 ต่อ 2 และ 1 ต่อ 3", "b2")
    F.rect(20, 14, 260, 260, "scr", 8)
    A = Axes(F, 30, 24, 240, 240, -1.25, 1.25, -1.25, 1.25)
    F.line(A.X(-1.25), A.Y(0), A.X(1.25), A.Y(0), "sgr")
    F.line(A.X(0), A.Y(-1.25), A.X(0), A.Y(1.25), "sgr")
    ph = math.radians(45)
    pts = [(math.sin(TAU * k / 400), math.sin(TAU * k / 400 + ph)) for k in range(401)]
    F.poly([(A.X(x), A.Y(y)) for x, y in pts], "sw1")
    y0 = math.sin(ph)
    F.add(f'<path style="stroke:#e6edf3;stroke-width:1.5;fill:none" d="M{f1(A.X(0)-8)} {f1(A.Y(y0))} h16 M{f1(A.X(0))} {f1(A.Y(0))} V{f1(A.Y(y0))}"/>')
    F.text(A.X(0) + 10, A.Y(y0 / 2) + 4, "y₀", "st")
    F.add(f'<path style="stroke:#ff8a3d;stroke-width:1.3;stroke-dasharray:4 3;fill:none" d="M{f1(A.X(-1.2))} {f1(A.Y(1))} H{f1(A.X(1.2))}"/>')
    F.text(A.X(-1.15), A.Y(1) - 5, "y_max", "st", style="fill:#ff8a3d")
    F.text(150, 292, "sin|φ| = y₀ / y_max = 0.707 → |φ| = 45°", "s", "middle")
    shapes = [(0, 1, 1, "0°"), (45, 1, 1, "45°"), (90, 1, 1, "90°"), (135, 1, 1, "135°"), (180, 1, 1, "180°"), (0, 1, 2, "2 : 1"), (90, 1, 3, "3 : 1"), (90, 2, 3, "3 : 2")]
    for i, (d, nx, ny, lab) in enumerate(shapes):
        cx, cy = 340 + (i % 4) * 82, 70 + (i // 4) * 130
        F.rect(cx - 36, cy - 36, 72, 72, "scr", 6)
        q = [(math.sin(nx * TAU * k / 600), math.sin(ny * TAU * k / 600 + math.radians(d))) for k in range(601)]
        F.poly([(cx + 30 * x, cy - 30 * y) for x, y in q], "sw2")
        F.text(cx, cy + 54, lab, "s", "middle")
    F.text(340 - 36, 290, "แถวล่าง: อัตราส่วน f_y : f_x = จุดแตะขอบบน : จุดแตะขอบข้าง", "s")
    return F.svg()


@fig("meas-bode")
def _():
    F = Fig(660, 410, "กราฟโบดของวงจร RC ต่ำผ่าน ความถี่ตัด 1.59 กิโลเฮิรตซ์ ขนาดคงที่ 0 dB ที่ความถี่ต่ำ ลดลง 3 dB ที่ความถี่ตัด แล้วลดลง 20 dB ต่อดีเคด มุมเฟสเปลี่ยนจาก 0 ถึงลบ 90 องศา ผ่านลบ 45 องศาที่ความถี่ตัด จุดคือค่าที่วัดได้", "b3")
    fc = 1591.55
    A = Axes(F, 70, 20, 540, 170, 10, 1e5, -42, 5, logx=True)
    B = Axes(F, 70, 225, 540, 130, 10, 1e5, -95, 5, logx=True)
    for G in (A, B):
        for dec in (10, 100, 1000, 10000, 1e5):
            for m in range(1, 10):
                f = dec * m
                if f > 1e5:
                    break
                F.line(G.X(f), G.y, G.X(f), G.y + G.h, "gr" if m > 1 else "dsh")
        F.rect(G.x, G.y, G.w, G.h, "", 0) if False else None
    for v in (0, -10, -20, -30, -40):
        F.line(A.x, A.Y(v), A.x + A.w, A.Y(v), "gr")
        F.text(A.x - 6, A.Y(v) + 4, f"{v}", "s", "end")
    for v in (0, -45, -90):
        F.line(B.x, B.Y(v), B.x + B.w, B.Y(v), "gr")
        F.text(B.x - 6, B.Y(v) + 4, f"{v}°", "s", "end")
    for lab, f in (("10", 10), ("100", 100), ("1k", 1000), ("10k", 1e4), ("100k", 1e5)):
        F.text(B.X(f), B.y + B.h + 16, lab, "s", "middle")
    F.text(A.x - 50, A.y + 6, "dB", "s")
    F.text(B.x + B.w + 8, B.y + B.h + 4, "Hz", "s")
    H = lambda f: 1 / math.sqrt(1 + (f / fc) ** 2)
    # asymptotes
    A.pts([(10, 0), (fc, 0), (1e5, 20 * math.log10(fc / 1e5))], "dsh")
    A.plot(lambda f: 20 * math.log10(H(f)), "w2", 300)
    B.plot(lambda f: -math.degrees(math.atan(f / fc)), "w2", 300)
    meas = [(100, -0.02, -3.6), (200, -0.07, -7.2), (500, -0.41, -17.4), (1000, -1.45, -32.1), (2000, -4.11, -51.5), (5000, -10.36, -72.3), (10000, -16.07, -81.0), (20000, -22.01, -85.5), (50000, -29.95, -88.2)]
    jit = [0.15, -0.1, 0.2, -0.15, 0.1, -0.2, 0.15, 0.25, -0.3]
    for (f, db, pdeg), j in zip(meas, jit):
        F.dot(A.X(f), A.Y(db + j), 3.6)
        F.dot(B.X(f), B.Y(pdeg + 4 * j), 3.6)
    A.vline(fc, "dsh")
    F.text(A.X(fc) - 8, A.Y(-9), "−3 dB ที่ f_c", "a", "end")
    F.text(A.X(2e4), A.Y(-16), "−20 dB/ดีเคด", "a")
    F.line(B.X(fc), B.y, B.X(fc), B.y + B.h, "dsh")
    F.text(B.X(fc) + 6, B.Y(-45) - 6, "−45° ที่ f_c", "a")
    F.text(70, 384, "เส้น: ทฤษฎี |H| = 1/√(1+(f/f_c)²) · เส้นประ: เส้นกำกับ (asymptote)", "s")
    F.text(70, 400, "จุด: ค่าที่วัดด้วยสโคป ซึ่งมีความคลาดเคลื่อนการอ่านเล็กน้อย", "s")
    return F.svg()


@fig("meas-zsense")
def _():
    F = Fig(660, 230, "วัดอิมพีแดนซ์ด้วยตัวต้านทานอนุกรม เครื่องกำเนิดสัญญาณต่อ R_s แล้วต่อ Z ลงกราวด์ CH1 วัดที่ขาเข้า CH2 วัดคร่อม Z แรงดันคร่อม R_s ได้จาก CH1 ลบ CH2", "b4")
    S = Sch(F)
    S.src(60, 115, label="FG", lx=-22)
    S.wire((60, 99), (60, 50), (150, 50))
    S.res(150, 50, 260, 50, label="R_s (รู้ค่า)", ly=-14)
    S.wire((260, 50), (330, 50), (330, 82))
    F.rect(310, 82, 40, 66, "bx2", 6)
    F.text(330, 120, "Z", "t", "middle")
    S.wire((330, 148), (330, 185), (60, 185), (60, 131))
    S.gnd(200, 185)
    S.node(130, 50).node(330, 50)
    S.probe(130, 50, 1, "CH1", -14, -14)
    S.probe(330, 50, 2, "CH2", 10, -10)
    F.text(390, 50, "V_R = CH1 − CH2  (Math)", "t")
    F.text(390, 78, "V_Z = CH2", "t")
    F.text(390, 112, "Z = R_s · V_Z / V_R", "a")
    F.text(390, 136, "∠Z = ∠V_Z − ∠V_R", "a")
    F.text(390, 170, "กราวด์ของทุกเครื่องอยู่ที่ขาล่างของ Z", "s")
    F.text(390, 188, "ห้ามหนีบกราวด์โพรบที่จุดระหว่าง R_s กับ Z", "s")
    return finish(F, S)


@fig("meas-rin")
def _():
    F = Fig(660, 200, "วัดความต้านทานขาเข้าของวงจร ใส่ตัวต้านทาน R_x อนุกรม วัด V1 ก่อนตัวต้านทานและ V2 ที่ขาเข้าวงจร", "b5")
    S = Sch(F)
    S.src(60, 105, label="FG", lx=-22)
    S.wire((60, 89), (60, 50), (160, 50))
    S.res(160, 50, 270, 50, label="R_x", ly=-14)
    S.wire((270, 50), (340, 50))
    F.rect(340, 30, 130, 110, "bx", 10)
    F.text(405, 80, "วงจรที่ทดสอบ", "t", "middle")
    F.text(405, 100, "R_in = ?", "a", "middle")
    S.wire((60, 121), (60, 165), (405, 165), (405, 140))
    S.gnd(230, 165)
    S.node(120, 50).node(310, 50)
    S.probe(120, 50, 1, "V₁", -10, -14)
    S.probe(310, 50, 2, "V₂", -8, -14)
    F.text(490, 70, "R_in = R_x · V₂/(V₁ − V₂)", "t")
    F.text(490, 96, "ปรับ R_x จน V₂ = V₁/2", "s")
    F.text(490, 114, "→ R_in = R_x พอดี", "s")
    return finish(F, S)



# ============================================================ RC / RLC page
def rc_square(t, tau, T, V=1.0, out="C"):
    """Periodic steady state of an RC driven by a ±V square wave of period T (rising edge at t=0)."""
    h = T / 2
    a = math.exp(-h / tau)
    vp = V * (1 - a) / (1 + a)          # low-pass peak (= V tanh(T/4tau))
    ph = t % T
    if ph < h:
        vc = V + (-vp - V) * math.exp(-ph / tau)
        vin = V
    else:
        vc = -V + (vp + V) * math.exp(-(ph - h) / tau)
        vin = -V
    return vc if out == "C" else vin - vc


@fig("rc-circuits")
def _():
    F = Fig(660, 210, "ซ้าย วงจร RC ต่ำผ่าน เอาต์พุตคร่อมตัวเก็บประจุ ขวา วงจร RC สูงผ่าน เอาต์พุตคร่อมตัวต้านทาน CH1 วัดที่ขาเข้า CH2 วัดที่ขาออก", "r1")
    S = Sch(F)
    for k, (x0, hp) in enumerate([(20, False), (350, True)]):
        S.src(x0 + 40, 110, label="FG", lx=-22)
        S.wire((x0 + 40, 94), (x0 + 40, 50), (x0 + 90, 50))
        if not hp:
            S.res(x0 + 90, 50, x0 + 190, 50, label="R", ly=-14)
            S.wire((x0 + 190, 50), (x0 + 230, 50), (x0 + 230, 92))
            S.cap(x0 + 230, 92, x0 + 230, 128, label="C", lx=18)
        else:
            S.cap(x0 + 90, 50, x0 + 190, 50, label="C", lx=0, ly=-18, anchor="middle")
            S.wire((x0 + 190, 50), (x0 + 230, 50), (x0 + 230, 70))
            S.res(x0 + 230, 70, x0 + 230, 150, label="R", lx=18, ly=4, anchor="start")
        S.wire((x0 + 230, 128 if not hp else 150), (x0 + 230, 170), (x0 + 40, 170), (x0 + 40, 126))
        S.gnd(x0 + 140, 170)
        S.node(x0 + 70, 50).node(x0 + 230, 50)
        S.probe(x0 + 70, 50, 1, "CH1", -14, -14)
        S.probe(x0 + 230, 50, 2, "CH2", 10, -10)
        F.text(x0 + 150, 204, "ต่ำผ่าน (low-pass): ออกคร่อม C" if not hp else "สูงผ่าน (high-pass): ออกคร่อม R", "s", "middle")
    return finish(F, S)


@fig("rc-step")
def _():
    F = Fig(660, 270, "การชาร์จตัวเก็บประจุเมื่อป้อนขั้นแรงดัน แรงดันถึง 63.2 เปอร์เซ็นต์ที่เวลา tau เส้นสัมผัสที่ต้นกราฟตัดค่าสุดท้ายที่ tau และเกือบเต็มที่ 5 tau", "r2")
    A = Axes(F, 60, 30, 540, 190, -0.5, 6, -0.08, 1.15)
    A.axes(zero=False, xlabel="t")
    A.pts([(-0.5, 0), (0, 0), (0, 1), (6, 1)], "w1")
    A.plot(lambda t: 0 if t < 0 else 1 - math.exp(-t), "w2", 500)
    A.pts([(0, 0), (1.12, 1.12)], "dsh")
    A.hline(0.632, "dsh", "63.2 %", lx=A.x - 6, anchor="end")
    for k in range(1, 6):
        A.vline(k, "gr", f"{k}τ", "s")
    A.vline(1, "dsh")
    F.dot(A.X(1), A.Y(0.632), 4)
    F.text(A.X(1) + 8, A.Y(0.632) + 16, "t = τ", "a")
    F.text(A.X(0.06), A.Y(1.05), "ขาเข้า (ขั้นแรงดัน)", "c1")
    F.text(A.X(2.6), A.Y(0.78), "v_C(t) = V(1 − e^(−t/τ))", "c2")
    F.text(A.X(5), A.Y(0.86), "99.3 % ที่ 5τ", "s", "middle")
    F.text(A.X(0.62), A.Y(0.5), "เส้นสัมผัส", "s", "end")
    return F.svg()


@fig("rc-periodic")
def _():
    F = Fig(660, 250, "วงจร RC ต่ำผ่านกับคลื่นสี่เหลี่ยมสามความถี่ ครึ่งคาบเท่ากับ 10 tau ชาร์จเต็ม ครึ่งคาบ 2 tau ชาร์จไม่ทัน ครึ่งคาบ 0.2 tau ได้สามเหลี่ยมเล็ก คือวงจรอินทิเกรต", "r3")
    for i, (r, name) in enumerate([(10, "T/2 = 10τ: ชาร์จเต็ม"), (2, "T/2 = 2τ: ไม่ทัน"), (0.2, "T/2 = 0.2τ: สามเหลี่ยม")]):
        x0 = 20 + i * 215
        F.rect(x0 - 6, 14, 207, 196, "scr", 8)
        T = 2 * r
        A = Axes(F, x0, 24, 195, 176, 0, 2 * T, -1.35, 1.35)
        A.plot(lambda t, T=T: 1 if (t % T) < T / 2 else -1, "sw1", 600)
        A.plot(lambda t, T=T: rc_square(t, 1.0, T), "sw2", 600)
        F.text(x0 + 97, 232, name, "s", "middle")
    return F.svg()


@fig("rc-hp")
def _():
    F = Fig(660, 250, "วงจร RC สูงผ่านกับคลื่นสี่เหลี่ยม ครึ่งคาบยาวกว่า tau มากได้สไปก์แหลมสูงสองเท่าของแอมพลิจูด คือวงจรดิฟเฟอเรนชิเอต ครึ่งคาบสั้นกว่า tau มากได้สี่เหลี่ยมที่ยอดเอียงเล็กน้อย", "r4")
    for i, (r, name) in enumerate([(10, "T/2 = 10τ: สไปก์ (ดิฟเฟอเรนชิเอต)"), (1, "T/2 = τ"), (0.1, "T/2 = 0.1τ: ยอดเอียงนิดเดียว")]):
        x0 = 20 + i * 215
        F.rect(x0 - 6, 14, 207, 196, "scr", 8)
        T = 2 * r
        A = Axes(F, x0, 24, 195, 176, 0, 2 * T, -2.3, 2.3)
        A.plot(lambda t, T=T: 1 if (t % T) < T / 2 else -1, "sw1", 800)
        A.plot(lambda t, T=T: rc_square(t, 1.0, T, out="R"), "sw2", 800)
        F.text(x0 + 97, 232, name, "s", "middle")
    return F.svg()


@fig("rlc-circuit")
def _():
    F = Fig(660, 200, "วงจร RLC อนุกรม ต่อจากเครื่องกำเนิดสัญญาณที่มีความต้านทานภายใน 50 โอห์ม เอาต์พุตคร่อม R ได้แบนด์พาส คร่อม C ได้ต่ำผ่าน", "r5")
    S = Sch(F)
    S.src(50, 105, label="FG", lx=-22)
    S.wire((50, 89), (50, 50), (70, 50))
    S.res(70, 50, 140, 50, body=28, label="50 Ω ใน FG", ly=24)
    S.wire((140, 50), (160, 50))
    S.ind(160, 50, 260, 50, label="L", ly=-16)
    S.cap(260, 50, 330, 50, label="C", lx=0, ly=-18, anchor="middle")
    S.wire((330, 50), (380, 50), (380, 70))
    S.res(380, 70, 380, 140, label="R", lx=16, ly=4, anchor="start")
    S.wire((380, 140), (380, 165), (50, 165), (50, 121))
    S.gnd(220, 165)
    S.node(150, 50).node(380, 50)
    S.probe(150, 50, 1, "CH1", -12, -14)
    S.probe(380, 50, 2, "CH2", 10, -10)
    F.add('<rect x="22" y="28" width="132" height="160" rx="8" style="fill:none;stroke:var(--ink-3);stroke-dasharray:5 4"/>')
    F.text(440, 60, "คร่อม R → แบนด์พาส (ยอดที่ f₀)", "t")
    F.text(440, 84, "คร่อม C → ต่ำผ่าน อันดับสอง", "t")
    F.text(440, 108, "คร่อม L → สูงผ่าน อันดับสอง", "t")
    F.text(440, 140, "R รวม = R + 50 Ω + r ของ L", "a")
    F.text(440, 160, "(สลับตำแหน่งให้ชิ้นที่วัดอยู่ติดกราวด์)", "s")
    return finish(F, S)


@fig("rlc-ring")
def _():
    F = Fig(660, 270, "ผลตอบสนองขั้นของ RLC อนุกรมแบบหน่วงน้อย แรงดันคร่อม C แกว่งรอบค่าสุดท้าย ยอดลดลงตามเปลือกเอกซ์โพเนนเชียล ยอดแรกเกินค่าสุดท้ายเป็นเปอร์เซ็นต์โอเวอร์ชูต อัตราส่วนยอดถัดกันให้ลอการิทึมดีครีเมนต์", "r6")
    z = 0.0949
    wd = math.sqrt(1 - z * z)
    v = lambda t: 1 - math.exp(-z * t) * (math.cos(wd * t) + z / wd * math.sin(wd * t))
    A = Axes(F, 60, 30, 540, 190, 0, 30, -0.05, 1.85)
    A.axes(zero=False, xlabel="t")
    A.hline(1, "dsh", "ค่าสุดท้าย")
    A.plot(lambda t: 1 + math.exp(-z * t) / wd, "dsh", 300)
    A.plot(lambda t: 1 - math.exp(-z * t) / wd, "dsh", 300)
    A.plot(v, "w2", 800)
    tp1 = math.pi / wd
    tp2 = 3 * math.pi / wd
    for tp, lab in ((tp1, "V₁"), (tp2, "V₂")):
        F.line(A.X(tp), A.Y(1), A.X(tp), A.Y(v(tp)), "ar", "both")
        F.text(A.X(tp) + 6, A.Y((1 + v(tp)) / 2) + 4, lab, "a")
    F.line(A.X(tp1), A.Y(1.8), A.X(tp2), A.Y(1.8), "ar", "both")
    F.text(A.X((tp1 + tp2) / 2), A.Y(1.8) - 6, "T_d = 1/f_d", "s", "middle")
    F.text(330, 252, "δ = ln(V₁/V₂) · ζ = δ/√(4π² + δ²) · Q = 1/(2ζ) ≈ π/δ", "s", "middle")
    return F.svg()


@fig("rlc-res")
def _():
    F = Fig(660, 290, "กราฟเรโซแนนซ์ของ RLC อนุกรม อัตราส่วนแรงดันคร่อม R ต่อแรงดันขาเข้า เทียบกับความถี่ ยอดที่ f0 ความกว้างที่ระดับ 0.707 คือแบนด์วิดท์ Q สูงยอดแคบ Q ต่ำยอดกว้าง", "r7")
    f0 = 5032.9
    A = Axes(F, 60, 30, 540, 200, 1000, 25000, 0, 1.08, logx=True)
    A.axes(zero=False)
    for f in (1000, 2000, 5000, 10000, 20000):
        F.line(A.X(f), A.y, A.X(f), A.y + A.h, "gr")
        F.text(A.X(f), A.y + A.h + 16, f"{f/1000:g}k", "s", "middle")
    F.text(A.x + A.w + 8, A.y + A.h + 4, "Hz", "s")
    H = lambda f, Q: 1 / math.sqrt(1 + Q * Q * (f / f0 - f0 / f) ** 2)
    A.plot(lambda f: H(f, 2.108), "w2", 400)
    A.plot(lambda f: H(f, 6.325), "w3", 400)
    A.hline(0.7071, "dsh", "0.707")
    for Q, cls in ((2.108, "c2"), (6.325, "a")):
        k = 1 / (2 * Q)
        r = math.sqrt(1 + k * k)
        fa, fb = f0 * (r - k), f0 * (r + k)
        F.line(A.X(fa), A.Y(0.7071), A.X(fa), A.Y(0) , "dsh")
        F.line(A.X(fb), A.Y(0.7071), A.X(fb), A.Y(0), "dsh")
    A.vline(f0, "dsh")
    F.text(A.X(f0), A.y - 4, "f₀ = 5.03 kHz", "s", "middle")
    F.text(A.X(13500), A.Y(0.62), "Q = 2.1 (R รวม 150 Ω)", "c2")
    F.text(A.X(6900), A.Y(0.92), "Q = 6.3 (R รวม 50 Ω)", "a")
    F.text(330, 282, "BW = f₂ − f₁ = f₀/Q · เส้นประแนวตั้งคือ f₁ และ f₂ ของแต่ละเส้น", "s", "middle")
    return F.svg()



# ============================================================ op-amp page
def opamp_inv(F, S, x0, label_r="R_i", label_f="R_f", kind="inv", cap=None):
    """Draw an inverting-type stage starting at x0. kind: inv | integ | diff."""
    S.src(x0 + 30, 125, label="FG", lx=-22)
    S.wire((x0 + 30, 109), (x0 + 30, 80), (x0 + 60, 80))
    if kind == "diff":
        S.cap(x0 + 60, 80, x0 + 130, 80, label="C", lx=0, ly=-18, anchor="middle")
    else:
        S.res(x0 + 60, 80, x0 + 130, 80, body=30, label=label_r, ly=-14)
    S.wire((x0 + 130, 80), (x0 + 160, 80))
    o = S.opamp(x0 + 160, 92, 64)
    S.wire((x0 + 150, 80), (x0 + 150, 40), (x0 + 190, 40))
    if kind == "integ":
        S.cap(x0 + 190, 40, x0 + 230, 40, label="C", lx=0, ly=24, anchor="middle")
    else:
        S.res(x0 + 190, 40, x0 + 250, 40, body=30, label=label_f, ly=-14)
    S.wire((x0 + 250, 40) if kind != "integ" else (x0 + 230, 40), (x0 + 255, 40), (x0 + 255, 92))
    S.wire(o["out"], (x0 + 275, 92))
    S.wire(o["non"], (x0 + 145, o["non"][1]), (x0 + 145, 150))
    S.wire((x0 + 30, 141), (x0 + 30, 150), (x0 + 145, 150))
    S.gnd(x0 + 145, 150)
    S.node(x0 + 150, 80).node(x0 + 255, 92)
    S.probe(x0 + 45, 80, 1, "CH1", -12, -14)
    S.probe(x0 + 275, 92, 2, "CH2", -10, -12)


@fig("op-configs")
def _():
    F = Fig(660, 200, "ซ้าย ออปแอมป์ขยายกลับเฟส สัญญาณเข้าทาง R_i สู่ขาลบ R_f ป้อนกลับ ขาบวกลงกราวด์ ขวา ขยายไม่กลับเฟส สัญญาณเข้าขาบวก R_f กับ R_i แบ่งแรงดันป้อนกลับเข้าขาลบ", "u1")
    S = Sch(F)
    opamp_inv(F, S, 10)
    F.text(150, 192, "กลับเฟส: A = −R_f / R_i", "t", "middle")
    x0 = 350
    S.src(x0 + 30, 125, label="FG", lx=-22)
    o = S.opamp(x0 + 160, 92, 64)
    top_y = 92 - 64 * 0.86 / 4
    bot_y = 92 + 64 * 0.86 / 4
    S.wire((x0 + 30, 109), (x0 + 30, bot_y), (x0 + 160, bot_y))
    S.wire((x0 + 160, top_y), (x0 + 140, top_y), (x0 + 140, 40), (x0 + 190, 40))
    S.res(x0 + 190, 40, x0 + 250, 40, body=30, label="R_f", ly=-14)
    S.wire((x0 + 250, 40), (x0 + 255, 40), (x0 + 255, 92))
    S.wire((x0 + 140, 60), (x0 + 125, 60))
    S.res(x0 + 125, 60, x0 + 75, 60, body=24, label="R_i", ly=-10)
    S.gnd(x0 + 75, 60)
    S.wire(o["out"], (x0 + 275, 92))
    S.wire((x0 + 30, 141), (x0 + 30, 150))
    S.gnd(x0 + 30, 150)
    S.node(x0 + 140, 60).node(x0 + 255, 92)
    S.probe(x0 + 70, bot_y, 1, "CH1", -12, 18)
    S.probe(x0 + 275, 92, 2, "CH2", -10, -12)
    F.text(490, 192, "ไม่กลับเฟส: A = 1 + R_f / R_i", "t", "middle")
    return finish(F, S)


@fig("op-limits")
def _():
    F = Fig(660, 250, "ขีดจำกัดของออปแอมป์สามแบบ ซ้าย อิ่มตัว ยอดถูกตัดแบนที่แรงดันอิ่มตัว กลาง สลูว์เรตจำกัด ไซน์กลายเป็นสามเหลี่ยม ขวา แบนด์วิดท์จำกัด ขาออกเล็กลงและเฟสล้าหลัง", "u2")
    # clipping
    F.rect(14, 14, 207, 196, "scr", 8)
    A = Axes(F, 20, 24, 195, 176, 0, 2, -1.6, 1.6)
    A.plot(lambda t: 1.6 * math.sin(TAU * t) * 0.95, "sw1", 300)
    A.plot(lambda t: sat(-1.6 * math.sin(TAU * t) * 1.35, -1.12, 1.12), "sw2", 300)
    F.text(117, 232, "อิ่มตัว (clipping)", "s", "middle")
    # slew
    F.rect(229, 14, 207, 196, "scr", 8)
    B = Axes(F, 235, 24, 195, 176, 0, 2, -1.6, 1.6)
    B.plot(lambda t: 1.4 * math.sin(TAU * t), "sw1", 300)
    v, pts, n = 0.0, [], 1200
    srate = 3.4  # per unit time (period = 1)
    for i in range(3 * n + 1):
        t = 2 * i / (3 * n) - 0  # simulate 3 times to settle
    # settle over several periods then record last 2
    v = 0.0
    dt = 1 / 600
    rec = []
    for i in range(600 * 6):
        t = i * dt
        target = 1.4 * math.sin(TAU * t)
        dv = target - v
        v += max(-srate * dt, min(srate * dt, dv))
        if t >= 4:
            rec.append((t - 4, v))
    B.pts(rec, "sw2")
    F.text(332, 232, "สลูว์เรต: ไซน์ → สามเหลี่ยม", "s", "middle")
    # bandwidth
    F.rect(444, 14, 207, 196, "scr", 8)
    C = Axes(F, 450, 24, 195, 176, 0, 2, -1.6, 1.6)
    C.plot(lambda t: 1.4 * math.sin(TAU * t), "sw1", 300)
    C.plot(lambda t: 0.55 * math.sin(TAU * t - math.radians(68)), "sw2", 300)
    F.text(547, 232, "แบนด์วิดท์: เล็กลง + ล้าหลัง", "s", "middle")
    return F.svg()


@fig("op-gbw")
def _():
    F = Fig(660, 290, "กราฟเกนวงเปิดของออปแอมป์ที่ GBW 1 เมกะเฮิรตซ์ ลดลง 20 dB ต่อดีเคด เกนวงปิด 40 dB แบนราบจนชนเส้นวงเปิดที่ 10 kHz เกน 20 dB ชนที่ 100 kHz", "u3")
    A = Axes(F, 70, 20, 530, 220, 1, 1e7, -5, 110, logx=True)
    for dec in range(0, 8):
        F.line(A.X(10 ** dec), A.y, A.X(10 ** dec), A.y + A.h, "gr")
        F.text(A.X(10 ** dec), A.y + A.h + 16, ["1", "10", "100", "1k", "10k", "100k", "1M", "10M"][dec], "s", "middle")
    for v in (0, 20, 40, 60, 80, 100):
        F.line(A.x, A.Y(v), A.x + A.w, A.Y(v), "gr")
        F.text(A.x - 6, A.Y(v) + 4, f"{v}", "s", "end")
    F.text(A.x - 46, A.y + 4, "dB", "s")
    F.text(A.x + A.w + 6, A.y + A.h + 4, "Hz", "s")
    GBW, A0 = 1e6, 1e5
    fp = GBW / A0
    ol = lambda f: 20 * math.log10(A0 / math.sqrt(1 + (f / fp) ** 2))
    A.plot(ol, "w1", 400, t1=1.6e6)
    for G, cls in ((100, "w2"), (10, "w3")):
        A.plot(lambda f, G=G: 20 * math.log10(G / math.sqrt(1 + (f * G / GBW) ** 2)), cls, 400, t1=1.6e6)
        F.dot(A.X(GBW / G), A.Y(20 * math.log10(G) - 3), 4)
    F.text(A.X(60), A.Y(103), "เกนวงเปิด A_OL (GBW = 1 MHz)", "c1")
    F.text(A.X(30), A.Y(44), "A_v = 100 (40 dB) → f₋₃dB = 10 kHz", "c2")
    F.text(A.X(30), A.Y(24), "A_v = 10 (20 dB) → f₋₃dB = 100 kHz", "a")
    F.text(A.X(1.5e5), A.Y(70), "−20 dB/ดีเคด", "s")
    return F.svg()


@fig("op-integ-diff")
def _():
    F = Fig(660, 330, "ซ้าย วงจรอินทิเกรเตอร์ มีตัวเก็บประจุป้อนกลับและตัวต้านทาน R_p ขนาน ขาเข้าสี่เหลี่ยมได้ขาออกสามเหลี่ยมกลับขั้ว ขวา วงจรดิฟเฟอเรนชิเอเตอร์ ตัวเก็บประจุที่ขาเข้าอนุกรม R_1 ขาเข้าสามเหลี่ยมได้ขาออกสี่เหลี่ยมกลับขั้ว", "u4")
    S = Sch(F)
    opamp_inv(F, S, 10, kind="integ")
    S.wire((10 + 180, 40), (10 + 180, 14), (10 + 200, 14))
    S.res(10 + 200, 14, 10 + 250, 14, body=24, label="R_p", ly=-6)
    S.wire((10 + 250, 14), (10 + 265, 14), (10 + 265, 40), (10 + 255, 40))
    opamp_inv(F, S, 340, kind="diff", label_f="R_f")
    # integ waves
    F.rect(14, 196, 290, 110, "scr", 8)
    A = Axes(F, 20, 204, 278, 94, 0, 2, -1.4, 1.4)
    A.plot(lambda t: 0.9 if (t % 1) < 0.5 else -0.9, "sw1", 400)
    A.plot(lambda t: -(1.1 - 4.4 * (t % 1)) if (t % 1) < 0.5 else -(-1.1 + 4.4 * ((t % 1) - 0.5)), "sw2", 400)
    F.text(160, 324, "อินทิเกรเตอร์: สี่เหลี่ยม → สามเหลี่ยม (กลับขั้ว)", "s", "middle")
    F.rect(344, 196, 290, 110, "scr", 8)
    B = Axes(F, 350, 204, 278, 94, 0, 2, -1.4, 1.4)
    tri = lambda t: (4 * (t % 1) - 1) if (t % 1) < 0.5 else (3 - 4 * (t % 1))
    B.plot(lambda t: 0.9 * tri(t), "sw1", 400)
    B.plot(lambda t: -0.8 if (t % 1) < 0.5 else 0.8, "sw2", 400)
    F.text(490, 324, "ดิฟเฟอเรนชิเอเตอร์: สามเหลี่ยม → สี่เหลี่ยม (กลับขั้ว)", "s", "middle")
    return finish(F, S)


@fig("op-schmitt")
def _():
    F = Fig(660, 300, "ซ้าย สัญญาณไซน์มีนอยส์เข้าคอมพาเรเตอร์ธรรมดา ขาออกสั่นหลายครั้งที่จุดตัดศูนย์ เข้าชมิตต์ทริกเกอร์ที่มีสองระดับ ขาออกเปลี่ยนครั้งเดียว ขวา กราฟถ่ายโอนแบบฮิสเทอรีซิส", "u5")
    import random
    rnd = random.Random(7)
    N = 900
    noise = [rnd.gauss(0, 0.09) for _ in range(N + 1)]
    sig = lambda i: math.sin(TAU * 2 * i / N) + noise[i]
    A = Axes(F, 30, 20, 380, 110, 0, N, -1.5, 1.5)
    F.rect(24, 14, 392, 122, "scr", 6)
    A.pts([(i, sig(i)) for i in range(N + 1)], "sw1")
    for v in (0.35, -0.35):
        F.add(f'<line x1="{f1(A.X(0))}" y1="{f1(A.Y(v))}" x2="{f1(A.X(N))}" y2="{f1(A.Y(v))}" style="stroke:#ff8a3d;stroke-width:1.2;stroke-dasharray:5 4"/>')
    F.text(A.X(N) - 4, A.Y(0.35) - 4, "V_TH", "st", "end", "fill:#ff8a3d")
    F.text(A.X(N) - 4, A.Y(-0.35) + 12, "V_TL", "st", "end", "fill:#ff8a3d")
    # comparator output (threshold 0)
    F.rect(24, 146, 392, 66, "scr", 6)
    B = Axes(F, 30, 168, 380, 38, 0, N, -1.3, 1.3)
    B.pts([(i, -1 if sig(i) > 0 else 1) for i in range(N + 1)], "sw2")
    F.text(36, 162, "คอมพาเรเตอร์ (ระดับเดียว): สั่น", "st")
    F.rect(24, 220, 392, 66, "scr", 6)
    Cx = Axes(F, 30, 242, 380, 38, 0, N, -1.3, 1.3)
    st, pts = 1, []
    for i in range(N + 1):
        x = sig(i)
        if st == 1 and x > 0.35:
            st = -1
        elif st == -1 and x < -0.35:
            st = 1
        pts.append((i, st))
    Cx.pts(pts, "sw2")
    F.text(36, 236, "ชมิตต์ทริกเกอร์ (สองระดับ): สะอาด", "st")
    # hysteresis loop
    H = Axes(F, 460, 40, 180, 200, -1.5, 1.5, -1.3, 1.3)
    H.axes(xlabel="v_i", ylabel="v_o")
    H.pts([(-1.5, 1), (0.35, 1), (0.35, -1), (1.5, -1)], "w2")
    H.pts([(1.5, -1), (-0.35, -1), (-0.35, 1)], "w3")
    F.text(H.X(0.35) + 4, H.Y(0.2), "V_TH", "s")
    F.text(H.X(-0.35) - 4, H.Y(-0.2), "V_TL", "s", "end")
    F.text(H.X(-1.4), H.Y(1) - 6, "+V_sat", "s")
    F.text(H.X(1.4), H.Y(-1) + 16, "−V_sat", "s", "end")
    F.text(550, 290, "ฮิสเทอรีซิส = V_TH − V_TL", "s", "middle")
    return F.svg()



# ============================================================ build-your-own page
@fig("k-relax")
def _():
    F = Fig(660, 250, "ออสซิลเลเตอร์ผ่อนคลายด้วยออปแอมป์ ตัวเก็บประจุชาร์จผ่าน R จากขาออก ขาบวกได้แรงดันอ้างอิงจากตัวแบ่ง R1 R2 ขาออกเป็นสี่เหลี่ยม แรงดันบนตัวเก็บประจุแกว่งระหว่างบวกลบเบต้าคูณ V_sat", "k1")
    S = Sch(F)
    o = S.opamp(200, 110, 64, inv_top=False)
    top_y, bot_y = 110 - 64 * 0.86 / 4, 110 + 64 * 0.86 / 4
    S.wire(o["out"], (290, 110))
    S.wire((200, bot_y), (140, bot_y))
    S.wire((140, bot_y), (100, bot_y), (100, 150))
    S.cap(100, 150, 100, 180, label="C", lx=-16, anchor="end")
    S.gnd(100, 180)
    S.wire((140, bot_y), (140, 205), (160, 205))
    S.res(160, 205, 270, 205, label="R", ly=-12)
    S.wire((270, 205), (290, 205), (290, 110))
    S.wire((200, top_y), (170, top_y), (170, 40), (190, 40))
    S.res(190, 40, 280, 40, label="R₁", ly=-12)
    S.wire((280, 40), (290, 40), (290, 110))
    S.wire((170, 70), (140, 70))
    S.res(140, 70, 70, 70, body=28, label="R₂", ly=-12)
    S.gnd(70, 70)
    S.node(170, 70).node(140, bot_y).node(290, 110)
    S.probe(122, bot_y, 1, "v_C", -16, -10)
    S.probe(310, 110, 2, "v_o", 8, -10)
    S.wire((290, 110), (310, 110))
    F.text(160, 244, "β = R₂/(R₁+R₂)", "s", "middle")
    F.rect(354, 14, 296, 206, "scr", 8)
    A = Axes(F, 362, 24, 280, 186, 0, 2.2, -1.25, 1.25)
    b = 0.5
    T = 2 * math.log((1 + b) / (1 - b))
    def vc(t):
        ph = (t % T)
        h = T / 2
        if ph < h:
            return 1 + (-b - 1) * math.exp(-ph)
        return -1 + (b + 1) * math.exp(-(ph - h))
    A.plot(lambda t: 1 if (t * T % T) < T / 2 else -1, "sw2", 600)
    A.plot(lambda t: vc(t * T), "sw1", 600)
    for v, lab in ((b, "+βV_sat"), (-b, "−βV_sat")):
        F.add(f'<line x1="{f1(A.X(0))}" y1="{f1(A.Y(v))}" x2="{f1(A.X(2.2))}" y2="{f1(A.Y(v))}" style="stroke:#ff8a3d;stroke-dasharray:4 4;stroke-width:1.2"/>')
        F.text(A.X(2.18), A.Y(v) - 4, lab, "st", "end", "fill:#ff8a3d")
    F.text(502, 244, "เหลือง v_C (เอกซ์โพเนนเชียล) · ฟ้า v_o (สี่เหลี่ยม)", "s", "middle")
    return finish(F, S)


@fig("k-555")
def _():
    F = Fig(660, 270, "ไอซี 555 แบบ astable ตัวต้านทาน R_A และ R_B กับตัวเก็บประจุ C แรงดันบน C แกว่งระหว่างหนึ่งในสามและสองในสามของไฟเลี้ยง ขาออกสูงขณะชาร์จผ่าน R_A บวก R_B และต่ำขณะคายผ่าน R_B", "k2")
    S = Sch(F)
    S.wire((120, 30), (330, 30))
    F.text(120, 22, "+V_CC", "t")
    S.res(160, 30, 160, 80, body=26, label="R_A", lx=-12, ly=4, anchor="end")
    S.wire((160, 80), (250, 80))
    S.res(160, 80, 160, 135, body=26, label="R_B", lx=-12, ly=4, anchor="end")
    S.wire((160, 135), (210, 135), (210, 115), (250, 115))
    S.wire((210, 135), (210, 155), (250, 155))
    S.cap(160, 135, 160, 205, label="C", lx=-16, anchor="end")
    S.gnd(160, 205)
    S.wire((280, 50), (280, 30))
    S.wire((320, 50), (320, 30))
    S.wire((300, 190), (300, 205))
    S.gnd(300, 205)
    S.wire((330, 190), (330, 200))
    S.cap(330, 200, 330, 226, gap=6, plate=9)
    S.gnd(330, 226)
    S.wire((350, 115), (390, 115))
    S.flush()
    F.rect(250, 50, 100, 140, "bx", 8)
    F.text(356, 46, "NE555", "t")
    for x, y, t, a in ((256, 84, "7 DIS", "start"), (256, 119, "6 THR", "start"), (256, 159, "2 TRG", "start"), (344, 119, "3 OUT", "end"), (280, 64, "8", "middle"), (320, 64, "4", "middle"), (300, 184, "1", "middle"), (330, 184, "5", "middle")):
        F.text(x, y, t, "s", a)
    S.node(160, 80).node(160, 135).node(210, 135).node(280, 30).node(320, 30)
    S.probe(190, 135, 1, "v_C", -10, -10)
    S.probe(390, 115, 2, "OUT", 8, -8)
    F.rect(430, 14, 220, 206, "scr", 8)
    A = Axes(F, 438, 24, 204, 120, 0, 3, -0.05, 1.05)
    B = Axes(F, 438, 154, 204, 56, 0, 3, -0.1, 1.1)
    tH, tL = math.log(2) * 2.0, math.log(2) * 1.0  # RA = RB
    T = tH + tL
    def vc(t):
        ph = t % T
        if ph < tH:
            return 1 - (2 / 3) * math.exp(-ph / 2.0)
        return (2 / 3) * math.exp(-(ph - tH) / 1.0)
    sc = 3 / (2 * T)
    A.plot(lambda t: vc(t / sc) * 1.0 if False else (vc(t / sc)), "sw1", 600)
    B.plot(lambda t: 1 if ((t / sc) % T) < tH else 0, "sw2", 600)
    for v, lab in ((2 / 3, "⅔V_CC"), (1 / 3, "⅓V_CC")):
        F.add(f'<line x1="{f1(A.X(0))}" y1="{f1(A.Y(v))}" x2="{f1(A.X(3))}" y2="{f1(A.Y(v))}" style="stroke:#ff8a3d;stroke-dasharray:4 4;stroke-width:1.2"/>')
        F.text(A.X(2.98), A.Y(v) - 4, lab, "st", "end", "fill:#ff8a3d")
    F.text(540, 238, "บน v_C · ล่าง ขาออก", "s", "middle")
    F.text(270, 260, "ขา 8 และ 4 ต่อ +V_CC · ขา 5 ต่อ 10 nF ลงกราวด์", "s", "middle")
    return finish(F, S)


@fig("k-wien")
def _():
    F = Fig(660, 250, "ออสซิลเลเตอร์ Wien bridge ป้อนกลับบวกผ่านวงจร RC อนุกรมและ RC ขนานเข้าขาบวก ป้อนกลับลบผ่าน R_f และ R_g ตั้งเกนเท่ากับ 3", "k3")
    S = Sch(F)
    o = S.opamp(330, 120, 64, inv_top=False)
    top_y, bot_y = 120 - 64 * 0.86 / 4, 120 + 64 * 0.86 / 4
    S.wire(o["out"], (430, 120))
    S.wire((430, 120), (430, 40), (410, 40))
    S.cap(410, 40, 370, 40, label="C", lx=0, ly=-16, anchor="middle")
    S.wire((370, 40), (350, 40))
    S.res(350, 40, 270, 40, label="R", ly=-12)
    S.wire((270, 40), (250, 40), (250, top_y), (330, top_y))
    S.wire((250, top_y), (250, 135), (220, 135), (220, 145))
    S.res(220, 145, 220, 200, body=26, label="R", lx=-12, ly=4, anchor="end")
    S.wire((220, 200), (220, 212), (280, 212))
    S.wire((250, 135), (280, 135), (280, 160))
    S.cap(280, 160, 280, 188, label="C", lx=14)
    S.wire((280, 188), (280, 212))
    S.gnd(250, 212)
    S.wire((330, bot_y), (310, bot_y), (310, 170), (340, 170))
    S.res(340, 170, 420, 170, label="R_f = 2R_g", ly=-10)
    S.wire((420, 170), (430, 170), (430, 120))
    S.res(310, 170, 310, 225, body=24, label="R_g", lx=10, ly=8, anchor="start")
    S.gnd(310, 225)
    S.node(250, top_y).node(250, 135).node(310, 170).node(430, 120)
    S.probe(250, 80, 1, "CH1", -38, 4)
    S.wire((430, 120), (450, 120))
    S.probe(450, 120, 2, "CH2", 8, -8)
    F.text(495, 60, "f₀ = 1/(2πRC)", "t")
    F.text(495, 84, "ที่ f₀: β = 1/3, เฟส 0°", "s")
    F.text(495, 104, "ต้องการเกน A = 3", "s")
    F.text(495, 150, "+ คุมแอมพลิจูด:", "a")
    F.text(495, 168, "ไดโอดคู่ขนาน R_f บางส่วน", "s")
    F.text(495, 186, "หรือหลอดไฟ / JFET / NTC", "s")
    return finish(F, S)


@fig("k-r2r")
def _():
    F = Fig(660, 240, "DAC แบบ R-2R สี่บิต ขาไมโครคอนโทรลเลอร์ D0 ถึง D3 ต่อผ่าน 2R เข้าบันไดตัวต้านทาน ปลายบิตสูงสุดต่อบัฟเฟอร์ออปแอมป์ แรงดันขาออกเท่ากับ V_ref คูณ D ส่วน 16", "k4")
    S = Sch(F)
    xs = [110, 200, 290, 380]
    for i, x in enumerate(xs):
        S.term(x, 40)
        F.text(x, 28, f"D{i}" + (" (LSB)" if i == 0 else " (MSB)" if i == 3 else ""), "s", "middle")
        S.wire((x, 44), (x, 60))
        S.res(x, 60, x, 130, body=30, label="2R", lx=10, ly=4, anchor="start")
        S.node(x, 130)
    for a, b in zip(xs, xs[1:]):
        S.res(a, 130, b, 130, body=30, label="R", ly=20)
    S.wire((110, 130), (60, 130), (60, 145))
    S.res(60, 145, 60, 200, body=26, label="2R", lx=-10, ly=4, anchor="end")
    S.gnd(60, 200)
    cy = 130 + 64 * 0.86 / 4
    o = S.opamp(440, cy, 64, inv_top=False)
    S.wire((380, 130), (440, 130))
    bot = cy + 64 * 0.86 / 4
    S.wire((440, bot), (425, bot), (425, 200), (520, 200), (520, cy))
    S.wire(o["out"], (545, cy))
    S.node(520, cy)
    S.probe(545, cy, 2, "V_out", 8, -8)
    F.text(330, 228, "V_out = V_ref·(8D₃ + 4D₂ + 2D₁ + D₀)/16 · R = 10 kΩ, 2R = 20 kΩ (1 % หรือดีกว่า)", "s", "middle")
    return finish(F, S)


@fig("k-system")
def _():
    F = Fig(660, 240, "ภาพรวมเครื่องกำเนิดสัญญาณที่สร้างเอง ไมโครคอนโทรลเลอร์สั่ง AD9833 ผ่าน SPI ขาออกของ DDS ผ่านตัวกรองและตัวเก็บประจุคัปปลิง ภาคปรับแอมพลิจูดและออฟเซตด้วยออปแอมป์ แล้วผ่านตัวต้านทาน 50 โอห์ม ไปยังขั้ว BNC", "k5")
    S = Sch(F)
    boxes = [(14, 60, 120, 90, "Arduino / ESP32", "ปุ่ม จอ เอนโค้ดเดอร์"), (184, 60, 96, 90, "AD9833", "DDS 25 MHz"), (336, 60, 92, 90, "กรอง + C", "ตัด DC"), (458, 60, 96, 90, "ออปแอมป์", "เกน + ออฟเซต")]
    for x, y, w, h, t, sub in boxes:
        F.rect(x, y, w, h, "bx2" if t == "AD9833" else "bx", 10)
        F.text(x + w / 2, y + 40, t, "t", "middle")
        F.text(x + w / 2, y + 60, sub, "s", "middle")
    for x1, x2 in ((134, 184), (280, 336), (428, 458)):
        F.line(x1, 105, x2, 105, "ar", "end")
    F.text(159, 96, "SPI", "s", "middle")
    F.text(308, 96, "0.6 Vpp", "s", "middle")
    S.wire((554, 105), (568, 105))
    S.res(568, 105, 616, 105, body=24, label="50 Ω", ly=-12)
    S.wire((616, 105), (630, 105))
    S.term(636, 105)
    F.text(636, 130, "BNC", "s", "middle")
    F.text(506, 180, "ปุ่ม Amplitude, Offset", "s", "middle")
    F.line(506, 168, 506, 152, "ar", "end")
    F.text(14, 200, "SPI 3 สาย: SCLK, SDATA, FSYNC · AD9833 ใช้ไฟ 2.3–5.5 V กราวด์ร่วมกับบอร์ด", "s")
    F.text(14, 218, "Arduino Uno: D13 → SCLK, D11 → SDATA, D10 → FSYNC", "s")
    F.text(14, 236, "ESP32: GPIO18 → SCLK, GPIO23 → SDATA, GPIO5 → FSYNC", "s")
    return finish(F, S)


@fig("k-frontend")
def _():
    F = Fig(660, 210, "วงจรขาเข้าของสโคปทำเอง ตัวต้านทาน R1 จากขาเข้า R2 ลงกราวด์ R3 ไปยัง 3.3 โวลต์ แปลงแรงดันบวกลบ 10 โวลต์เป็น 0 ถึง 3.3 โวลต์ มีไดโอดป้องกันไปยังไฟเลี้ยงและกราวด์", "k6")
    S = Sch(F)
    S.term(40, 110)
    F.text(40, 134, "V_in ±10 V", "s", "middle")
    S.wire((44, 110), (70, 110))
    S.res(70, 110, 170, 110, label="R₁ = 100 kΩ", ly=-12)
    S.wire((170, 110), (370, 110))
    S.wire((220, 110), (220, 125))
    S.res(220, 125, 220, 180, body=26, label="R₂ = 47 kΩ", lx=10, ly=4, anchor="start")
    S.gnd(220, 180)
    S.wire((220, 110), (220, 95))
    S.res(220, 95, 220, 35, body=26, label="R₃ = 33 kΩ", lx=10, ly=4, anchor="start")
    S.wire((208, 35), (232, 35))
    F.text(220, 26, "+3.3 V", "s", "middle")
    S.diode(330, 110, 330, 60)
    S.wire((330, 60), (330, 48), (318, 48), (342, 48))
    F.text(330, 40, "+3.3 V", "s", "middle")
    S.diode(330, 160, 330, 110)
    S.gnd(330, 160)
    S.node(220, 110).node(330, 110)
    F.rect(370, 90, 76, 40, "bx2", 8)
    F.text(408, 115, "ADC", "t", "middle")
    F.text(460, 70, "V_adc = k·V_in + V_bias", "t")
    F.text(460, 92, "k = R_b/(R₁ + R_b) ≈ 0.162", "s")
    F.text(460, 110, "R_b = R₂ ∥ R₃", "s")
    F.text(460, 128, "V_bias ≈ 1.62 V", "s")
    F.text(460, 150, "±10 V → 0.00 … 3.25 V", "a")
    return finish(F, S)



# ============================================================ applications page
@fig("x-rectifier")
def _():
    F = Fig(660, 250, "ซ้าย เรกติไฟเออร์ครึ่งคลื่นมีตัวเก็บประจุกรอง แรงดันขาออกชาร์จที่ยอดแล้วคายลงช้า ๆ เกิดริปเปิลหนึ่งครั้งต่อคาบ ขวา แบบเต็มคลื่น ริปเปิลสองครั้งต่อคาบและเล็กกว่า", "x1")
    def rect_out(full, tau, n=1200, cycles=2.0):
        # simulate ideal diode (no drop) peak detector with RC discharge, input sin(2πt)
        v, pts, dt = 0.0, [], cycles / n
        for _ in range(3):
            for i in range(n + 1):
                t = i * dt
                src = abs(math.sin(TAU * t)) if full else max(0.0, math.sin(TAU * t))
                v = src if src > v else v * math.exp(-dt / tau)
        v_hold = v
        v = v_hold
        for i in range(n + 1):
            t = i * dt
            src = abs(math.sin(TAU * t)) if full else max(0.0, math.sin(TAU * t))
            v = src if src > v else v * math.exp(-dt / tau)
            pts.append((t, v))
        return pts
    for k, full in enumerate((False, True)):
        x0 = 30 + k * 330
        A = Axes(F, x0, 30, 290, 170, 0, 2, -1.15, 1.25)
        A.axes(xlabel="t")
        A.plot(lambda t: math.sin(TAU * t), "dsh", 400)
        A.plot((lambda t: abs(math.sin(TAU * t))) if full else (lambda t: max(0, math.sin(TAU * t))), "w1", 400)
        A.pts(rect_out(full, 2.5), "w2")
        F.text(x0 + 145, 228, "เต็มคลื่น: ริปเปิลที่ 2f เล็กลงครึ่งหนึ่ง" if full else "ครึ่งคลื่น: ริปเปิลที่ f", "s", "middle")
    F.text(40, 20, "ประ: ขาเข้า · เหลือง: หลังไดโอด (ไม่มี C) · ฟ้า: มี C กรอง", "s")
    return F.svg()


@fig("x-pwm")
def _():
    F = Fig(660, 230, "สัญญาณ PWM ดิวตี้ 30 เปอร์เซ็นต์ ผ่านวงจร RC ต่ำผ่าน ได้แรงดันเฉลี่ย 30 เปอร์เซ็นต์ของระดับสูง มีริปเปิลฟันเลื่อยเล็ก ๆ", "x2")
    A = Axes(F, 50, 20, 560, 170, 0, 4, -0.1, 1.15)
    A.axes(zero=False, xlabel="t")
    D = 0.3
    A.plot(lambda t: 1 if (t % 1) < D else 0, "w1", 800)
    tau = 1.6
    # periodic steady state of RC on 0/1 pulse train
    a1, a0 = math.exp(-D / tau), math.exp(-(1 - D) / tau)
    vlo = (1 - a1) * a0 / (1 - a1 * a0)
    vhi = 1 + (vlo - 1) * a1
    def vc(t):
        ph = t % 1
        return 1 + (vlo - 1) * math.exp(-ph / tau) if ph < D else vhi * math.exp(-(ph - D) / tau)
    A.plot(vc, "w2", 800)
    A.hline(D, "dsh")
    F.text(A.X(3.98), A.Y(D) + 16, "V_avg = D·V_H", "a", "end")
    F.text(A.X(0.02), A.Y(1.07), "PWM 0 → V_H", "c1")
    F.text(330, 218, "ฟ้า: หลัง RC (τ ≫ T) แกว่งเล็ก ๆ รอบ D·V_H · ยิ่ง τ ยาว ริปเปิลยิ่งเล็กแต่ตอบสนองช้า", "s", "middle")
    return F.svg()


@fig("x-clip-clamp")
def _():
    F = Fig(660, 240, "ซ้าย วงจรตัดยอดด้วยไดโอดสองตัวกลับทิศ ไซน์ถูกตัดที่บวกลบ 0.7 โวลต์ ขวา วงจรยกระดับ ไซน์ทั้งรูปถูกยกขึ้นจนยอดล่างอยู่ที่ลบ 0.7 โวลต์", "x3")
    A = Axes(F, 30, 30, 290, 170, 0, 2, -3.4, 3.4)
    A.axes(xlabel="t")
    A.plot(lambda t: 3 * math.sin(TAU * t), "dsh", 400)
    A.plot(lambda t: sat(3 * math.sin(TAU * t), -0.7, 0.7), "w2", 400)
    A.hline(0.7, "gr", "+0.7").hline(-0.7, "gr", "−0.7")
    F.text(175, 228, "ตัดยอด: ±V_f", "s", "middle")
    B = Axes(F, 360, 30, 210, 170, 0, 2, -1.5, 5.8)
    B.axes(xlabel="t")
    B.plot(lambda t: 3 * math.sin(TAU * t), "dsh", 400)
    B.plot(lambda t: 3 * math.sin(TAU * t) + 2.3, "w2", 400)
    B.hline(-0.7, "gr", "−V_f").hline(5.3, "gr", "2V_p − V_f")
    F.text(495, 228, "ยกระดับ: −V_f ถึง 2V_p − V_f", "s", "middle")
    return F.svg()


@fig("x-amp-test")
def _():
    F = Fig(660, 210, "ทดสอบเครื่องขยายด้วยคลื่นสี่เหลี่ยม สี่แบบ ปกติ ยอดเอียงแปลว่าความถี่ต่ำถูกตัด ขอบมนแปลว่าความถี่สูงถูกตัด พุ่งเกินและแกว่งแปลว่าใกล้ไม่เสถียร", "x4")
    shapes = [("ปกติ", lambda p: 1 if p < 0.5 else -1),
              ("ยอดเอียง: f ต่ำหาย", lambda p: (1.12 * math.exp(-p / 2.5)) if p < 0.5 else -(1.12 * math.exp(-(p - 0.5) / 2.5))),
              ("ขอบมน: f สูงหาย", lambda p: (1 - 2 * math.exp(-p / 0.05)) if p < 0.5 else (-1 + 2 * math.exp(-(p - 0.5) / 0.05))),
              ("พุ่งเกิน + แกว่ง", lambda p: (1 - 2 * math.exp(-p / 0.04) * math.cos(TAU * p / 0.09)) if p < 0.5 else (-1 + 2 * math.exp(-(p - 0.5) / 0.04) * math.cos(TAU * (p - 0.5) / 0.09)))]
    for i, (name, fn) in enumerate(shapes):
        x0 = 14 + i * 162
        F.rect(x0, 14, 150, 150, "scr", 8)
        A = Axes(F, x0 + 6, 24, 138, 130, 0, 2, -1.7, 1.7)
        A.plot(lambda t, fn=fn: sat(fn(t % 1), -1.65, 1.65), "sw2", 500)
        F.text(x0 + 75, 186, name, "s", "middle")
    return F.svg()


@fig("x-uart")
def _():
    F = Fig(660, 200, "เฟรม UART 8N1 ของตัวอักษร U รหัส 0x55 ที่ 9600 บอด บิตเริ่มต้นเป็น 0 ตามด้วยข้อมูล 8 บิตจากบิตต่ำสุด แล้วบิตหยุดเป็น 1 แต่ละบิตกว้าง 104 ไมโครวินาที", "x5")
    bits = [1, 1, 0] + [(0x55 >> i) & 1 for i in range(8)] + [1, 1]
    names = ["", "idle", "start", "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "stop", "idle"]
    A = Axes(F, 20, 30, 620, 110, 0, len(bits), -0.2, 1.25)
    pts = []
    for i, b in enumerate(bits):
        pts += [(i, b), (i + 1, b)]
    A.pts(pts, "w2")
    for i in range(1, len(bits)):
        F.line(A.X(i), A.Y(-0.15), A.X(i), A.Y(1.2), "gr")
    for i, b in enumerate(bits):
        if names[min(i, len(names) - 1)]:
            F.text(A.X(i + 0.5), A.Y(1.12), names[i] if i < len(names) else "", "s", "middle")
        if 3 <= i <= 10:
            F.text(A.X(i + 0.5), A.Y(0.45), str(b), "a", "middle")
    F.line(A.X(3), A.Y(-0.1) + 16, A.X(4), A.Y(-0.1) + 16, "ar", "both")
    F.text(A.X(3.5), A.Y(-0.1) + 34, "t_bit = 1/9600 = 104.2 µs", "s", "start")
    F.text(640, 190, "0x55 = 0101 0101 ส่งบิตต่ำก่อน → 1,0,1,0,1,0,1,0", "s", "end")
    return F.svg()


@fig("x-power")
def _():
    F = Fig(660, 240, "แรงดันและกระแสไซน์ของโหลดเหนี่ยวนำ กระแสตามหลังแรงดันเป็นมุม phi กำลังขณะหนึ่งเท่ากับแรงดันคูณกระแส มีช่วงติดลบเมื่อพลังงานไหลกลับ ค่าเฉลี่ยคือกำลังจริง", "x6")
    A = Axes(F, 50, 20, 560, 180, 0, 2, -1.3, 1.6)
    A.axes(xlabel="t")
    ph = math.radians(36.87)
    A.plot(lambda t: math.sin(TAU * t), "w1", 500)
    A.plot(lambda t: 0.8 * math.sin(TAU * t - ph), "w2", 500)
    A.plot(lambda t: math.sin(TAU * t) * 0.8 * math.sin(TAU * t - ph) * 1.5, "w3", 500)
    A.hline(0.5 * 0.8 * math.cos(ph) * 1.5, "dsh")
    F.text(A.X(1.99), A.Y(0.5 * 0.8 * math.cos(ph) * 1.5) - 6, "P (ค่าเฉลี่ยของ p)", "s", "end")
    F.text(A.X(0.17), A.Y(1.12), "v(t)", "c1")
    F.text(A.X(0.36), A.Y(0.86), "i(t) ตามหลัง φ", "c2")
    F.text(A.X(1.0), A.Y(1.5), "p(t) = v·i", "a")
    F.text(330, 228, "P = V_rms I_rms cos φ · ช่วงที่ p(t) ติดลบคือพลังงานไหลกลับจากโหลด", "s", "middle")
    return F.svg()



# ============================================================ hub page
@fig("hub-bench")
def _():
    F = Fig(660, 300, "โต๊ะแล็บ: เครื่องกำเนิดสัญญาณป้อนคลื่นสี่เหลี่ยม 1 กิโลเฮิรตซ์เข้าวงจร RC บนเบรดบอร์ด โพรบสองเส้นต่อเข้าออสซิลโลสโคป จอแสดงคลื่นสี่เหลี่ยมสีเหลืองและแรงดันตัวเก็บประจุสีฟ้า", "h1")
    # function generator
    F.rect(14, 60, 200, 150, "bx", 14)
    F.text(28, 82, "FUNCTION GENERATOR", "s")
    F.rect(28, 92, 120, 62, "scr", 6)
    F.text(36, 110, "Square · High-Z", "st", style="fill:#7fb7c9")
    F.text(36, 140, "1.000 kHz", "st", style="font-size:19px;fill:#e6f6ff")
    for i in range(3):
        F.rect(28 + i * 42, 164, 36, 18, "bx2", 4)
    F.circle(178, 118, 20, "bx")
    F.circle(178, 118, 14, "bx2")
    F.circle(182, 186, 9, "bx")
    F.dot(182, 186, 3.5)
    F.text(182, 171, "OUT", "s", "middle")
    # breadboard with RC
    F.rect(246, 150, 150, 100, "bx2", 10)
    for r in range(4):
        for c in range(12):
            F.add(f'<circle cx="{258 + c * 12}" cy="{166 + r * 22}" r="1.6" style="fill:var(--ink-3);opacity:.5"/>')
    S = Sch(F)
    S.res(264, 196, 330, 196, body=30, label="R", ly=-10)
    S.cap(354, 196, 354, 236, gap=6, plate=9, label="C", lx=14)
    S.wire((330, 196), (354, 196))
    S.flush()
    # cables
    # oscilloscope
    F.rect(430, 30, 216, 196, "bx", 14)
    F.text(444, 52, "OSCILLOSCOPE", "s")
    A = scope_screen(F, 444, 60, 188, 126)
    tau = 1.0
    A.plot(lambda x: 2.2 if (x % 5) < 2.5 else -0.6, "sw1", 400)
    def vc(x):
        p = x % 5
        lo, hi = -0.6, 2.2
        k = math.exp(-2.5 / 0.7)
        vtop = hi - (hi - lo) * k / (1 + k) * 1
        if p < 2.5:
            return hi + (lo + (hi - lo) * 0.03 - hi) * math.exp(-p / 0.7)
        return lo + (hi - (hi - lo) * 0.03 - lo) * math.exp(-(p - 2.5) / 0.7)
    A.plot(lambda x: vc(x) - 0.0, "sw2", 400)
    F.circle(470, 210, 8, "bx")
    F.circle(520, 210, 8, "bx")
    F.text(470, 206 - 0, "", "s")
    F.text(470, 222 + 0, "", "s")
    F.text(578, 214, "CH1 CH2", "s", "middle")
    F.add('<path d="M182 195 C 196 262, 238 258, 264 196" style="fill:none;stroke:var(--ink);stroke-width:3;stroke-linecap:round"/>')
    F.add('<path d="M300 196 C 318 262, 440 262, 470 218" style="fill:none;stroke:#d9a400;stroke-width:3;stroke-linecap:round"/>')
    F.add('<path d="M354 196 C 372 270, 500 270, 520 218" style="fill:none;stroke:#0fa3b8;stroke-width:3;stroke-linecap:round"/>')
    F.dot(300, 196, 4)
    F.dot(354, 196, 4)
    F.text(330, 286, "ป้อนสัญญาณ → วงจร → วัดสองจุด: หลักการเดียวกันทุกการทดลองในชุดนี้", "s", "middle")
    return finish(F, S)



@fig("home-scope")
def _():
    F = Fig(520, 250, "จอออสซิลโลสโคปจำลอง คลื่นสี่เหลี่ยมสีเหลืองและแรงดันตัวเก็บประจุของวงจร RC สีฟ้า", "hs")
    A = scope_screen(F, 0, 0, 520, 250)
    A.plot(lambda x: 2.6 if (x % 5) < 2.5 else -1.4, "sw1", 500)
    def vc(x):
        p = x % 5
        k = math.exp(-2.5 / 0.8)
        lo = -1.4 + 4.0 * k / (1 + k)
        hi = 2.6 - 4.0 * k / (1 + k)
        return 2.6 + (lo - 2.6) * math.exp(-p / 0.8) if p < 2.5 else -1.4 + (hi + 1.4) * math.exp(-(p - 2.5) / 0.8)
    A.plot(vc, "sw2", 500)
    F.text(12, 20, "CH1 1 V/div · CH2 1 V/div", "st", style="fill:#f6d32d")
    F.text(508, 20, "H 200 µs/div · T'D", "st", "end")
    return F.svg()


# ============================================================ injector
def inject(paths):
    for p in paths:
        src = open(p, encoding="utf8").read()
        def rep(m):
            key = m.group(1)
            if key not in FIGS:
                if "function-generator" in p:
                    raise SystemExit(f"unknown figure {key} in {p}")
                return m.group(0)  # a figure owned by another script (fs_figs.py)
            return f"<!--FIG:{key}-->" + FIGS[key]() + "<!--/FIG-->"
        out, n = re.subn(r"<!--FIG:([\w-]+)-->(?:<svg[\s\S]*?</svg><!--/FIG-->)?", rep, src)
        if out != src:
            open(p, "w", encoding="utf8").write(out)
        print(f"{os.path.basename(p)}: {n} figures")


if __name__ == "__main__":
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    files = sys.argv[1:] or glob.glob(os.path.join(root, "src/pages/learn/function-generator/*.html")) + [os.path.join(root, "src/pages/index.html")]
    inject(files)
