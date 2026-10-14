# Figures for the sensors & transducers series (/learn/sensors-transducers/).
# Usage: python3 scripts/sx_figs.py          fills empty <!--FIG:sx-…--><!--/FIG--> blocks in src/pages
#        python3 scripts/sx_figs.py --all    redraws every sx- figure
# Only keys in FIGS (all start with "sx-") are touched; keys owned by the other *_figs.py scripts are left alone.
# Curves are computed (IEC 60751 Callendar–Van Dusen, NIST type K, β-model NTC, FMCW chirps), not hand-drawn.
# Styling: classes .xf-* in assets/site.css ("SENSORS SERIES" block) so figures follow the light/dark theme.
import glob, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def f1(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class F:
    def __init__(self, w, h, label, key):
        self.w, self.h, self.label, self.key = w, h, label, key
        self.p = []

    def add(self, s):
        self.p.append(s)
        return self

    def svg(self):
        m = (f'<defs><marker id="{self.key}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">'
             f'<path class="xf-ah" d="M0 0 L10 5 L0 10z"/></marker></defs>')
        lab = self.label.replace('"', "&quot;")
        return f'<svg class="xf" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}">' + m + "".join(self.p) + "</svg>"

    def line(self, x1, y1, x2, y2, c="xf-ln", arrow=None):
        m = ""
        if arrow in ("end", "both"):
            m += f' marker-end="url(#{self.key}-ah)"'
        if arrow in ("start", "both"):
            m += f' marker-start="url(#{self.key}-ah)"'
        return self.add(f'<line class="{c}" x1="{f1(x1)}" y1="{f1(y1)}" x2="{f1(x2)}" y2="{f1(y2)}"{m}/>')

    def poly(self, pts, c="xf-ln", close=False, arrow=None):
        d = "M" + " L".join(f"{f1(x)} {f1(y)}" for x, y in pts) + (" Z" if close else "")
        m = f' marker-end="url(#{self.key}-ah)"' if arrow == "end" else ""
        return self.add(f'<path class="{c}" d="{d}"{m}/>')

    def path(self, d, c="xf-ln", arrow=None):
        m = f' marker-end="url(#{self.key}-ah)"' if arrow == "end" else ""
        return self.add(f'<path class="{c}" d="{d}"{m}/>')

    def rect(self, x, y, w, h, c="xf-box", rx=6):
        return self.add(f'<rect class="{c}" x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" rx="{rx}"/>')

    def circ(self, x, y, r, c="xf-box"):
        return self.add(f'<circle class="{c}" cx="{f1(x)}" cy="{f1(y)}" r="{f1(r)}"/>')

    def text(self, x, y, s, c=None, a=None, rot=None):
        at = (f' class="{c}"' if c else "") + (f' text-anchor="{a}"' if a else "")
        if rot is not None:
            at += f' transform="rotate({rot} {f1(x)} {f1(y)})"'
        return self.add(f'<text x="{f1(x)}" y="{f1(y)}"{at}>{s}</text>')

    def resistor(self, x1, y, x2, label=None, c="xf-ln"):
        # horizontal zig-zag between x1 and x2
        L = x2 - x1
        a, b = x1 + L * 0.25, x2 - L * 0.25
        pts = [(x1, y), (a, y)]
        n = 6
        for i in range(n):
            pts.append((a + (b - a) * (i + 0.5) / n, y + (-6 if i % 2 == 0 else 6)))
        pts += [(b, y), (x2, y)]
        self.poly(pts, c)
        if label:
            self.text((x1 + x2) / 2, y - 10, label, "xf-m", "middle")
        return self

    def vres(self, x, y1, y2, label=None, c="xf-ln", side=1):
        L = y2 - y1
        a, b = y1 + L * 0.25, y2 - L * 0.25
        pts = [(x, y1), (x, a)]
        for i in range(6):
            pts.append((x + (-6 if i % 2 == 0 else 6), a + (b - a) * (i + 0.5) / 6))
        pts += [(x, b), (x, y2)]
        self.poly(pts, c)
        if label:
            self.text(x + 12 * side, (y1 + y2) / 2 + 4, label, "xf-m", "start" if side > 0 else "end")
        return self


def axes(f, x0, y0, w, h, xl=None, yl=None):
    f.line(x0, y0 + h, x0 + w, y0 + h, "xf-thin")
    f.line(x0, y0, x0, y0 + h, "xf-thin")
    if xl:
        f.text(x0 + w / 2, y0 + h + 30, xl, "xf-k", "middle")
    if yl:
        f.text(x0 - 40, y0 + h / 2, yl, "xf-k", "middle", rot=-90)


# --------------------------------------------------------------------------- physics for curves
A_, B_, C_ = 3.9083e-3, -5.775e-7, -4.183e-12


def cvd(t, R0=100.0):
    return R0 * (1 + A_ * t + B_ * t * t + (C_ * (t - 100) * t ** 3 if t < 0 else 0))


K_HI = [-0.176004136860e-01, 0.389212049750e-01, 0.185587700320e-04, -0.994575928740e-07, 0.318409457190e-09, -0.560728448890e-12,
        0.560750590590e-15, -0.320207200030e-18, 0.971511471520e-22, -0.121047212750e-25]


def emf_k(t):  # 0..1372 °C, NIST ITS-90
    v = sum(c * t ** i for i, c in enumerate(K_HI))
    return v + 0.118597600000e+00 * math.exp(-0.118343200000e-03 * (t - 126.9686) ** 2)


# =========================================================================== FIGURES
@fig("sx-hub-chain")
def hub_chain():
    f = F(840, 250, "ห่วงโซ่ของเครื่องมือวัดคุม: ปริมาณทางกายภาพ เซนเซอร์ ภาคปรับสภาพ ทรานสมิตเตอร์ สัญญาณมาตรฐาน เครือข่าย และตัวควบคุม", "sx-hub-chain")
    boxes = [("ปริมาณกายภาพ", "T P Q L F I", "xf-box"), ("เซนเซอร์", "Pt100 · ไดอะแฟรม", "xf-boxa"), ("ปรับสภาพ+ADC", "ขยาย · กรอง", "xf-boxa"),
             ("ทรานสมิตเตอร์", "สเกล · วินิจฉัย", "xf-boxb"), ("สัญญาณ/บัส", "4–20 mA · HART", "xf-boxb"), ("PLC / DCS", "เตือน · PID", "xf-boxc")]
    w, gap, x = 122, 16, 10
    xs = []
    for i, (h, sub, c) in enumerate(boxes):
        f.rect(x, 70, w, 76, c, 10)
        f.text(x + w / 2, 101, h, "xf-h", "middle")
        f.text(x + w / 2, 124, sub, "xf-k", "middle")
        xs.append(x)
        if i < len(boxes) - 1:
            f.line(x + w + 1, 108, x + w + gap - 1, 108, "xf-ln", "end")
        x += w + gap
    f.text(xs[0] + w / 2, 58, "measurand", "xf-k", "middle")
    f.path(f"M {xs[1]+4} 156 L {xs[1]+4} 172 L {xs[3]+w-4} 172 L {xs[3]+w-4} 156", "xf-dash")
    f.text((xs[1] + xs[3] + w) / 2, 192, "ทรานส์ดิวเซอร์ (transducer) แปลงปริมาณหนึ่งเป็นอีกปริมาณหนึ่ง", "xf-m", "middle")
    f.path(f"M {xs[4]+4} 156 L {xs[4]+4} 214 L {xs[5]+w-4} 214 L {xs[5]+w-4} 156", "xf-dash")
    f.text((xs[4] + xs[5] + w) / 2, 232, "ภาค 3 และ 4 ของบทนี้", "xf-k", "middle")
    f.path(f"M {xs[4]+4} 60 L {xs[4]+4} 44 L {xs[5]+w-4} 44 L {xs[5]+w-4} 60", "xf-dash")
    f.text((xs[4] + xs[5] + w) / 2, 36, "ปิดลูปที่วาล์วหรือปั๊ม", "xf-k", "middle")
    return f.svg()

@fig("sx-timeline")
def timeline():
    f = F(860, 490, "เส้นเวลาของเครื่องมือวัดคุม จากยุคนิวแมติกถึงยุคอีเทอร์เน็ตภาคสนาม", "sx-timeline")
    x0, x1, y0 = 30, 830, 150
    yr0, yr1 = 1930, 2030
    X = lambda y: x0 + (y - yr0) / (yr1 - yr0) * (x1 - x0)
    eras = [(1930, 1975, "ยุคนิวแมติก 3–15 psi", "xf-fc", 0), (1960, 1995, "แอนะล็อก 4–20 mA", "xf-fa", 1), (1983, 2010, "อัจฉริยะ HART · ฟิลด์บัส", "xf-fb", 0),
            (2000, 2030, "Industrial Ethernet · IIoT · APL", "xf-fc", 1)]
    for a, b, t, c, row in eras:
        yy = 50 + row * 40
        f.rect(X(a), yy, X(b) - X(a), 30, c, 6)
        f.text(X(a) + 8, yy + 20, t, "xf-h")
    f.line(x0, y0, x1, y0, "xf-ln", "end")
    for y in range(1930, 2031, 10):
        f.line(X(y), y0 - 4, X(y), y0 + 4, "xf-ln")
        f.text(X(y), y0 - 10, str(y), "xf-k", "middle")
    ev = [(1940, "PID นิวแมติก", 0), (1958, "ทรานซิสเตอร์ในเครื่องมือวัด", 1), (1969, "PLC (Modicon)", 2), (1975, "ISA S50.1: 4–20 mA", 3),
          (1979, "Modbus", 4), (1986, "HART", 5), (1989, "PROFIBUS", 6), (1994, "FOUNDATION Fieldbus", 7),
          (2003, "PROFINET · EtherCAT", 8), (2008, "OPC UA", 9), (2010, "WirelessHART IEC 62591", 10), (2013, "IO-Link IEC 61131-9", 11),
          (2019, "IEEE 802.3cg 10BASE-T1L", 12), (2022, "Ethernet-APL", 13)]
    for y, t, lv in ev:
        yy = y0 + 30 + lv * 22
        right = y >= 2000
        f.line(X(y), y0, X(y), yy - 4, "xf-thin")
        f.circ(X(y), y0, 4, "xf-dot")
        f.circ(X(y), yy - 4, 2, "xf-dota")
        f.text(X(y) + (-6 if right else 6), yy, f"{y} {t}", "xf-m", "end" if right else "start")
    return f.svg()

@fig("sx-temp-curves")
def temp_curves():
    f = F(760, 300, "เปรียบเทียบเส้นโค้งของ Pt100 เทอร์มิสเตอร์ NTC 10 kΩ และเทอร์โมคัปเปิลชนิด K", "sx-temp-curves")
    # panel 1: Pt100 0..400
    def panel(px, title, xs, ys, fn, cls, xlab, ylab, yticks, xticks, logy=False):
        x0, y0, w, h = px + 50, 40, 170, 190
        f.text(px + 135, 24, title, "xf-h", "middle")
        for t in yticks:
            yy = y0 + h - ((math.log10(t) - math.log10(ys[0])) / (math.log10(ys[1]) - math.log10(ys[0])) if logy else (t - ys[0]) / (ys[1] - ys[0])) * h
            f.line(x0, yy, x0 + w, yy, "xf-grid")
            f.text(x0 - 6, yy + 4, (f"{t/1000:g}k" if t >= 1000 else f"{t:g}"), "xf-k", "end")
        for t in xticks:
            xx = x0 + (t - xs[0]) / (xs[1] - xs[0]) * w
            f.text(xx, y0 + h + 16, f"{t:g}", "xf-k", "middle")
        axes(f, x0, y0, w, h)
        pts = []
        for i in range(81):
            t = xs[0] + (xs[1] - xs[0]) * i / 80
            v = fn(t)
            yy = y0 + h - ((math.log10(v) - math.log10(ys[0])) / (math.log10(ys[1]) - math.log10(ys[0])) if logy else (v - ys[0]) / (ys[1] - ys[0])) * h
            pts.append((x0 + (t - xs[0]) / (xs[1] - xs[0]) * w, yy))
        f.poly(pts, cls)
        f.text(x0 + w / 2, y0 + h + 34, xlab, "xf-k", "middle")
        f.text(x0 - 36, y0 + h / 2, ylab, "xf-k", "middle", rot=-90)
    panel(0, "RTD Pt100 (IEC 60751)", (0, 400), (100, 260), cvd, "xf-a", "°C", "R (Ω)", [100, 140, 180, 220, 260], [0, 100, 200, 300, 400])
    ntc = lambda t: 10000 * math.exp(3950 * (1 / (t + 273.15) - 1 / 298.15))
    panel(250, "NTC 10 kΩ, β = 3950", (-20, 120), (200, 100000), ntc, "xf-b", "°C", "R (Ω) สเกลล็อก", [200, 1000, 10000, 100000], [-20, 20, 60, 100], logy=True)
    panel(500, "เทอร์โมคัปเปิล K (NIST)", (0, 1200), (0, 50), emf_k, "xf-c", "°C", "emf (mV)", [0, 10, 20, 30, 40, 50], [0, 400, 800, 1200])
    f.text(380, 292, "Pt100: เกือบเชิงเส้น ~0.385 Ω/°C · NTC: ไวมาก (≈ −4 %/°C) แต่ไม่เชิงเส้น · K: ~41 µV/°C ช่วงกว้างถึง 1260 °C", "xf-m", "middle")
    return f.svg()


@fig("sx-rtd-wiring")
def rtd_wiring():
    f = F(780, 250, "การต่อ RTD แบบ 2 สาย 3 สาย และ 4 สาย พร้อมความต้านทานของสายต่อ", "sx-rtd-wiring")
    for i, (title, nw) in enumerate([("2 สาย: R_วัด = R_t + 2R_L", 2), ("3 สาย: ชดเชยเมื่อ R_L เท่ากัน", 3), ("4 สาย: ไม่มีกระแสในสายวัด", 4)]):
        ox = 15 + i * 260
        f.text(ox + 120, 20, title, "xf-h", "middle")
        f.rect(ox + 170, 70, 60, 110, "xf-boxa", 8)
        f.vres(ox + 200, 85, 165, None, "xf-a")
        f.text(ox + 200, 196, "Pt100 (R_t)", "xf-m", "middle")
        f.rect(ox, 60, 70, 130, "xf-box", 8)
        f.text(ox + 35, 80, "เครื่องวัด", "xf-k", "middle")
        ys = [85, 165] if nw == 2 else [85, 125, 165] if nw == 3 else [85, 105, 145, 165]
        for k, y in enumerate(ys):
            f.resistor(ox + 70, y, ox + 170, "R_L" if k == 0 else None, "xf-ln")
            f.circ(ox + 70, y, 3, "xf-doto")
        # internal paths at sensor
        if nw == 2:
            f.line(ox + 170, 85, ox + 200, 85, "xf-ln"); f.line(ox + 170, 165, ox + 200, 165, "xf-ln")
        elif nw == 3:
            f.line(ox + 170, 85, ox + 200, 85, "xf-ln"); f.line(ox + 170, 125, ox + 185, 125, "xf-ln"); f.line(ox + 185, 125, ox + 185, 165, "xf-ln"); f.line(ox + 170, 165, ox + 200, 165, "xf-ln")
        else:
            f.line(ox + 170, 85, ox + 200, 85, "xf-ln"); f.line(ox + 170, 105, ox + 185, 105, "xf-ln"); f.line(ox + 185, 105, ox + 185, 85, "xf-ln")
            f.line(ox + 170, 145, ox + 185, 145, "xf-ln"); f.line(ox + 185, 145, ox + 185, 165, "xf-ln"); f.line(ox + 170, 165, ox + 200, 165, "xf-ln")
        if nw == 4:
            f.text(ox + 35, 112, "I →", "xf-m", "middle"); f.text(ox + 35, 150, "V", "xf-m", "middle")
            f.text(ox + 35, 172, "Z สูง", "xf-k", "middle")
        elif nw == 3:
            f.text(ox + 35, 125, "บริดจ์/ADC", "xf-k", "middle")
        else:
            f.text(ox + 35, 125, "Ω", "xf-h", "middle")
    f.text(390, 236, "ตัวอย่าง: สาย 0.5 mm² ยาว 50 m มี R_L ≈ 1.75 Ω ต่อเส้น → ต่อ 2 สาย คลาด ≈ 3.5 Ω ≈ +9 °C", "xf-m", "middle")
    return f.svg()


@fig("sx-tc-cjc")
def tc_cjc():
    f = F(760, 230, "วงจรเทอร์โมคัปเปิล: รอยต่อร้อน สายชดเชย ขั้วต่อซึ่งเป็นรอยต่อเย็น และเซนเซอร์ชดเชยจุดเย็น", "sx-tc-cjc")
    f.circ(60, 110, 8, "xf-dot")
    f.text(60, 145, "รอยต่อร้อน T_h", "xf-h", "middle")
    f.path("M 66 104 C 150 70, 260 70, 400 80", "xf-b")
    f.path("M 66 116 C 150 150, 260 150, 400 140", "xf-a")
    f.text(230, 66, "ขา + (เช่น NiCr)", "xf-m", "middle")
    f.text(230, 166, "ขา − (เช่น NiAl)", "xf-m", "middle")
    f.text(230, 196, "สายชดเชย/สายต่อชนิดเดียวกัน (extension) ไม่สร้างรอยต่อใหม่", "xf-k", "middle")
    f.rect(400, 60, 90, 100, "xf-metal", 6)
    f.text(445, 54, "ขั้วต่อทองแดง", "xf-k", "middle")
    f.circ(445, 110, 9, "xf-boxc")
    f.text(445, 114, "T", "xf-k", "middle")
    f.text(445, 180, "รอยต่อเย็น T_cj", "xf-h", "middle")
    f.text(445, 198, "วัดด้วย Pt100/IC", "xf-k", "middle")
    f.line(490, 80, 560, 80, "xf-ln"); f.line(490, 140, 560, 140, "xf-ln")
    f.rect(560, 60, 180, 100, "xf-boxa", 10)
    f.text(650, 88, "ทรานสมิตเตอร์/การ์ด TC", "xf-h", "middle")
    f.text(650, 112, "E_วัด = E(T_h) − E(T_cj)", "xf-m", "middle")
    f.text(650, 132, "E(T_h) = E_วัด + E(T_cj)", "xf-m", "middle")
    f.text(650, 150, "→ T_h จากตาราง NIST", "xf-k", "middle")
    return f.svg()


@fig("sx-pressure-ref")
def pressure_ref():
    f = F(740, 280, "ความดันสัมบูรณ์ ความดันเกจ ความดันผลต่าง และสุญญากาศ เทียบกับความดันบรรยากาศ", "sx-pressure-ref")
    yv, ya = 225, 140
    f.line(40, yv, 700, yv, "xf-ln"); f.text(46, yv + 18, "สุญญากาศสมบูรณ์ = 0 Pa abs", "xf-m")
    f.line(40, ya, 700, ya, "xf-dash"); f.text(700, ya - 8, "ความดันบรรยากาศ ≈ 101.325 kPa abs", "xf-m", "end")
    f.circ(160, 50, 5, "xf-dot"); f.text(172, 46, "จุด A", "xf-h")
    f.line(110, yv, 110, 56, "xf-a", "end"); f.text(104, 130, "P_abs", "xf-ta", "end")
    f.line(160, ya, 160, 58, "xf-b", "end"); f.text(168, 104, "P_g (+)", "xf-tb")
    f.circ(380, 185, 5, "xf-dot"); f.text(392, 200, "จุด B", "xf-h")
    f.line(330, yv, 330, 192, "xf-a", "end"); f.text(324, 214, "P_abs", "xf-ta", "end")
    f.line(380, ya, 380, 178, "xf-b", "end"); f.text(388, 166, "สุญญากาศเกจ (−)", "xf-tb")
    f.circ(560, 60, 5, "xf-dot"); f.circ(560, 110, 5, "xf-dot")
    f.text(572, 64, "P₁", "xf-h"); f.text(572, 114, "P₂", "xf-h")
    f.line(540, 66, 540, 104, "xf-c", "both"); f.text(532, 90, "ΔP = P₁ − P₂", "xf-tc", "end")
    f.text(370, 268, "P_abs = P_g + P_atm  ·  ทรานสมิตเตอร์ DP วัดผลต่างของสองพอร์ต ไม่ขึ้นกับบรรยากาศ", "xf-m", "middle")
    return f.svg()

@fig("sx-pressure-sensors")
def pressure_sensors():
    f = F(780, 250, "หลักการเซนเซอร์ความดัน: ท่อเบอร์ดอง ไดอะแฟรมกับสเตรนเกจ ไพอีโซรีซิสทีฟซิลิคอน และเซลล์ DP แบบคาปาซิทีฟ", "sx-pressure-sensors")
    # Bourdon
    ox = 20
    f.text(ox + 80, 22, "1 · ท่อเบอร์ดอง", "xf-h", "middle")
    f.path(f"M {ox+80} 200 L {ox+80} 170 A 55 55 0 1 1 {ox+130} 130", "xf-a")
    f.path(f"M {ox+80} 200 L {ox+80} 170 A 47 47 0 1 1 {ox+122} 132", "xf-thin")
    f.line(ox + 128, 128, ox + 96, 118, "xf-ln"); f.circ(ox + 80, 115, 4, "xf-dot"); f.line(ox + 80, 115, ox + 60, 78, "xf-b", "end")
    f.text(ox + 80, 236, "P ทำให้ท่อพยายามยืดตรง", "xf-k", "middle")
    f.line(ox + 60, 218, ox + 78, 204, "xf-ln", "end"); f.text(ox + 56, 222, "P", "xf-m", "end")
    # diaphragm + strain gauges
    ox = 210
    f.text(ox + 80, 22, "2 · ไดอะแฟรม + สเตรนเกจ", "xf-h", "middle")
    f.rect(ox + 20, 120, 120, 70, "xf-metal", 4)
    f.path(f"M {ox+20} 120 Q {ox+80} 100 {ox+140} 120", "xf-a")
    for gx in (ox + 45, ox + 105):
        f.rect(gx - 10, 104, 20, 7, "xf-boxb", 1)
    f.text(ox + 80, 92, "ε ที่ขอบ (−) และกลาง (+)", "xf-k", "middle")
    f.line(ox + 80, 226, ox + 80, 194, "xf-ln", "end"); f.text(ox + 90, 222, "P", "xf-m")
    f.text(ox + 80, 244, "ต่อเป็นบริดจ์เต็ม 4 แขน", "xf-k", "middle")
    # piezoresistive MEMS
    ox = 400
    f.text(ox + 80, 22, "3 · ไพอีโซรีซิสทีฟ (MEMS Si)", "xf-h", "middle")
    f.poly([(ox + 20, 110), (ox + 60, 110), (ox + 70, 150), (ox + 90, 150), (ox + 100, 110), (ox + 140, 110), (ox + 140, 180), (ox + 20, 180)], "xf-boxa", close=True)
    f.rect(ox + 50, 104, 12, 5, "xf-boxb", 1); f.rect(ox + 98, 104, 12, 5, "xf-boxb", 1)
    f.text(ox + 80, 96, "ตัวต้านทานแพร่ในแผ่นซิลิคอนบาง", "xf-k", "middle")
    f.text(ox + 80, 200, "ΔR/R ≈ π·σ ไวกว่าโลหะ ~50 เท่า", "xf-k", "middle")
    f.text(ox + 80, 216, "ต้องชดเชยอุณหภูมิ", "xf-k", "middle")
    # capacitive DP cell
    ox = 590
    f.text(ox + 85, 22, "4 · เซลล์ DP คาปาซิทีฟ", "xf-h", "middle")
    f.rect(ox + 20, 60, 130, 140, "xf-metal", 10)
    f.line(ox + 85, 70, ox + 85, 190, "xf-a")
    f.path(f"M {ox+60} 75 Q {ox+48} 130 {ox+60} 185", "xf-b"); f.path(f"M {ox+110} 75 Q {ox+122} 130 {ox+110} 185", "xf-b")
    f.text(ox + 50, 214, "C_H", "xf-m", "middle"); f.text(ox + 120, 214, "C_L", "xf-m", "middle")
    f.line(ox, 130, ox + 20, 130, "xf-ln", "end"); f.text(ox + 4, 122, "H", "xf-k"); f.line(ox + 170, 130, ox + 150, 130, "xf-ln", "end"); f.text(ox + 160, 122, "L", "xf-k")
    f.text(ox + 85, 238, "(C_H − C_L)/(C_H + C_L) ∝ ΔP", "xf-m", "middle")
    return f.svg()


@fig("sx-orifice")
def orifice_fig():
    f = F(760, 290, "การไหลผ่านแผ่นออริฟิซ: เส้นกระแส vena contracta และความดันตามแนวท่อ", "sx-orifice")
    f.line(30, 60, 730, 60, "xf-ln"); f.line(30, 140, 730, 140, "xf-ln")
    f.rect(296, 60, 8, 22, "xf-metal", 1); f.rect(296, 118, 8, 22, "xf-metal", 1)
    for k, yy in enumerate([72, 86, 100, 114, 128]):
        c = 100 + (yy - 100) * 0.38
        f.path(f"M 30 {yy} C 220 {yy}, 270 {100 + (yy-100)*0.5}, 300 {100 + (yy-100)*0.42} S 360 {c}, 400 {c} S 560 {yy}, 730 {yy}", "xf-thin")
    f.text(380, 154, "vena contracta", "xf-k", "middle")
    f.line(250, 60, 250, 40, "xf-b"); f.text(250, 34, "P₁ (ต้นน้ำ)", "xf-tb", "middle")
    f.line(360, 60, 360, 40, "xf-b"); f.text(360, 34, "P₂", "xf-tb", "middle")
    # pressure profile
    y0 = 270
    f.line(30, y0, 730, y0, "xf-thin")
    f.text(30, 186, "ความดัน", "xf-k")
    pts = []
    for i in range(141):
        x = 30 + i * 5
        if x < 280:
            p = 0
        elif x < 380:
            p = -(1 - math.cos(math.pi * (x - 280) / 100)) / 2
        else:
            p = -1 + 0.62 * (1 - math.exp(-(x - 380) / 90))
        pts.append((x, 200 - p * 55))
    f.poly(pts, "xf-a")
    f.line(250, 200, 250, 255, "xf-dash"); f.line(380, 200, 380, 255, "xf-dash")
    f.line(395, 200, 395, 255, "xf-b", "both"); f.text(402, 232, "ΔP วัด", "xf-tb")
    f.line(700, 200, 700, 221, "xf-c", "both"); f.text(694, 214, "การสูญเสียถาวร", "xf-tc", "end")
    f.text(380, 286, "q_m = C·E·ε·(π/4)d²·√(2ΔP·ρ₁)  — อัตราไหลแปรตาม √ΔP", "xf-m", "middle")
    return f.svg()


@fig("sx-flow-principles")
def flow_principles():
    f = F(780, 270, "หลักการมิเตอร์วัดการไหล: แม่เหล็กไฟฟ้า อัลตราโซนิกเวลาเดินทาง วอร์เท็กซ์ และคอริโอลิส", "sx-flow-principles")
    # magmeter
    ox = 10
    f.text(ox + 90, 20, "แม่เหล็กไฟฟ้า: U = k·B·D·v", "xf-h", "middle")
    f.circ(ox + 90, 130, 60, "xf-box"); f.circ(ox + 90, 130, 60, "xf-liq")
    f.text(ox + 90, 134, "v ⊙", "xf-h", "middle")
    f.line(ox + 90, 50, ox + 90, 70, "xf-b", "end"); f.line(ox + 90, 210, ox + 90, 190, "xf-b", "end"); f.text(ox + 100, 56, "B", "xf-tb")
    f.circ(ox + 30, 130, 5, "xf-dota"); f.circ(ox + 150, 130, 5, "xf-dota")
    f.text(ox + 20, 152, "อิเล็กโทรด", "xf-k", "middle"); f.text(ox + 160, 152, "U", "xf-ta", "middle")
    f.text(ox + 90, 225, "ของเหลวต้องนำไฟฟ้า", "xf-k", "middle")
    # ultrasonic
    ox = 200
    f.text(ox + 90, 20, "อัลตราโซนิก: Δt ∝ v", "xf-h", "middle")
    f.line(ox + 10, 70, ox + 180, 70, "xf-ln"); f.line(ox + 10, 190, ox + 180, 190, "xf-ln")
    f.rect(ox + 20, 50, 26, 18, "xf-boxa", 3); f.rect(ox + 144, 192, 26, 18, "xf-boxa", 3)
    f.line(ox + 40, 72, ox + 152, 188, "xf-a", "both")
    f.line(ox + 40, 130, ox + 140, 130, "xf-b", "end"); f.text(ox + 90, 124, "v", "xf-tb", "middle")
    f.text(ox + 90, 228, "t↓ (ตามกระแส) < t↑ (ทวนกระแส)", "xf-k", "middle")
    # vortex
    ox = 395
    f.text(ox + 90, 20, "วอร์เท็กซ์: f = St·v/d", "xf-h", "middle")
    f.line(ox + 5, 70, ox + 180, 70, "xf-ln"); f.line(ox + 5, 190, ox + 180, 190, "xf-ln")
    f.poly([(ox + 40, 108), (ox + 58, 130), (ox + 40, 152)], "xf-metal", close=True)
    for i, (dx, s) in enumerate([(80, -1), (110, 1), (140, -1), (168, 1)]):
        yy = 130 + s * 16
        f.path(f"M {ox+dx-10} {yy} a 10 10 0 1 {1 if s>0 else 0} 20 0 a 10 10 0 1 {1 if s>0 else 0} -20 0", "xf-a")
    f.text(ox + 90, 228, "กระแสวนหลุดสลับข้าง (Kármán)", "xf-k", "middle")
    # coriolis
    ox = 590
    f.text(ox + 90, 20, "คอริโอลิส: Δt ∝ q_m", "xf-h", "middle")
    f.path(f"M {ox+20} 190 L {ox+50} 190 L {ox+50} 80 Q {ox+90} 50 {ox+130} 80 L {ox+130} 190 L {ox+160} 190", "xf-a")
    f.path(f"M {ox+20} 200 L {ox+60} 200 L {ox+60} 90 Q {ox+90} 66 {ox+120} 90 L {ox+120} 200 L {ox+160} 200", "xf-thin")
    f.circ(ox + 50, 140, 5, "xf-dot"); f.circ(ox + 130, 140, 5, "xf-dot"); f.circ(ox + 90, 62, 5, "xf-dota"); f.text(ox + 90, 50, "ขดกระตุ้น", "xf-k", "middle")
    f.text(ox + 44, 124, "ปิกออฟ 1", "xf-k", "end"); f.text(ox + 136, 124, "ปิกออฟ 2", "xf-k")
    f.text(ox + 90, 228, "วัดมวลและความหนาแน่นตรง", "xf-k", "middle")
    f.text(390, 258, "ไม่มีชิ้นส่วนเคลื่อนที่ในท่อทั้งสี่แบบ จึงบำรุงรักษาน้อยกว่ามิเตอร์ใบพัด (เทอร์ไบน์)", "xf-m", "middle")
    return f.svg()


@fig("sx-level-hydro")
def level_hydro():
    f = F(760, 300, "การวัดระดับด้วยความดัน: ถังเปิดกับทรานสมิตเตอร์เกจ และถังปิดกับทรานสมิตเตอร์ DP แบบขาเปียก", "sx-level-hydro")
    # open tank
    f.text(170, 22, "ถังเปิด: h = P / (ρg)", "xf-h", "middle")
    f.rect(90, 70, 150, 170, "xf-box", 4); f.rect(92, 130, 146, 108, "xf-liq", 2)
    f.line(250, 130, 250, 238, "xf-c", "both"); f.text(258, 190, "h", "xf-tc")
    f.line(90, 225, 50, 225, "xf-ln"); f.line(50, 225, 50, 260, "xf-ln"); f.rect(30, 260, 40, 26, "xf-boxa", 5); f.text(50, 277, "PT", "xf-k", "middle")
    f.text(170, 296, "รูวัดอยู่ระดับเดียวกับศูนย์ของช่วงวัด", "xf-k", "middle")
    # closed tank wet leg
    f.text(560, 22, "ถังปิด + ขาเปียก: ΔP = ρgh − ρ_w g H", "xf-h", "middle")
    f.rect(480, 50, 150, 200, "xf-box", 4); f.rect(482, 140, 146, 108, "xf-liq", 2)
    f.text(555, 100, "ไอ/แก๊ส P_s", "xf-k", "middle")
    f.line(630, 70, 690, 70, "xf-ln"); f.line(690, 70, 690, 270, "xf-ln"); f.rect(686, 70, 8, 200, "xf-liq", 1)
    f.text(682, 160, "ขาเปียก", "xf-k", "end")
    f.line(630, 230, 660, 230, "xf-ln"); f.line(660, 230, 660, 262, "xf-ln")
    f.rect(640, 262, 70, 28, "xf-boxa", 5); f.text(675, 280, "DP  H | L", "xf-k", "middle")
    f.line(470, 140, 470, 230, "xf-c", "both"); f.text(462, 190, "h", "xf-tc", "end")
    f.line(725, 70, 725, 230, "xf-b", "both"); f.text(731, 150, "H", "xf-tb")
    f.text(560, 296, "ความดันในถัง P_s หักล้างกันที่สองพอร์ต", "xf-k", "middle")
    return f.svg()


@fig("sx-level-radar")
def level_radar():
    f = F(760, 290, "เรดาร์ FMCW วัดระดับ: คลื่นส่งเป็นสัญญาณกวาดความถี่ คลื่นสะท้อนล่าช้า τ = 2R/c ทำให้เกิดความถี่บีตที่แปรตามระยะ", "sx-level-radar")
    f.rect(30, 70, 150, 190, "xf-box", 4); f.rect(32, 175, 146, 83, "xf-liq", 2)
    f.rect(90, 48, 30, 22, "xf-boxa", 4); f.path("M 92 70 L 80 88 L 130 88 L 118 70", "xf-ln")
    f.line(105, 90, 105, 172, "xf-a", "both"); f.text(112, 136, "R", "xf-ta")
    f.text(105, 40, "เรดาร์ 80 GHz", "xf-k", "middle")
    x0, y0, w, h = 270, 40, 450, 190
    axes(f, x0, y0, w, h)
    f.text(x0 + w / 2, y0 + h + 22, "เวลา", "xf-k", "middle"); f.text(x0 - 12, y0 + h / 2, "ความถี่", "xf-k", "middle", rot=-90)
    T, tau, fl, fh = 190, 40, y0 + h - 15, y0 + 20
    def ramp(start, cls):
        pts = []
        t = start
        while t < w:
            a = max(t, 0)
            b = min(t + T, w)
            ya = fl + (fh - fl) * (a - t) / T
            yb = fl + (fh - fl) * (b - t) / T
            if b > a:
                f.line(x0 + a, ya, x0 + b, yb, cls)
            t += T
    ramp(10, "xf-a"); ramp(10 - T + tau, "xf-b"); ramp(10 + tau, "xf-b")
    tm = 10 + 120
    ytx = fl + (fh - fl) * (tm - 10) / T
    yrx = fl + (fh - fl) * (tm - 10 - tau) / T
    f.line(x0 + tm, ytx, x0 + tm, yrx, "xf-c", "both"); f.text(x0 + tm + 6, (ytx + yrx) / 2 + 4, "f_b", "xf-tc")
    f.line(x0 + 10 + 60, fl + (fh - fl) * 60 / T, x0 + 10 + 60 + tau, fl + (fh - fl) * 60 / T, "xf-c", "both")
    f.text(x0 + 10 + 60 + tau / 2, fl + (fh - fl) * 60 / T + 16, "τ", "xf-tc", "middle")
    f.line(x0 + w - 6, fl, x0 + w - 6, fh, "xf-dash"); f.text(x0 + w - 12, (fl + fh) / 2, "B", "xf-m", "end")
    f.text(x0 + 30, y0 + 8, "ส่ง Tx", "xf-ta"); f.text(x0 + 90, y0 + 8, "สะท้อน Rx", "xf-tb")
    f.text(470, 282, "f_b = 2R·B/(c·T)  →  R = c·f_b·T/(2B)", "xf-m", "middle")
    return f.svg()

@fig("sx-bridge")
def bridge():
    f = F(720, 290, "สะพานวีตสโตนกับสเตรนเกจแบบ quarter bridge และโหลดเซลล์แบบ full bridge", "sx-bridge")
    cx, cy, r = 170, 128, 80
    T, Bm, L, R = (cx, cy - r), (cx, cy + r), (cx - r, cy), (cx + r, cy)
    def arm(p, q, lab, c="xf-ln"):
        mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
        f.line(p[0], p[1], q[0], q[1], c)
        f.rect(mx - 16, my - 9, 32, 18, "xf-boxa" if c != "xf-ln" else "xf-box", 3)
        f.text(mx, my + 4, lab, "xf-k", "middle")
    arm(T, L, "R₁"); arm(T, R, "R₂"); arm(L, Bm, "R₃"); arm(R, Bm, "SG", "xf-a")
    f.line(T[0], T[1], T[0], T[1] - 18, "xf-ln"); f.text(T[0] + 8, T[1] - 8, "+V_ex", "xf-m")
    f.line(Bm[0], Bm[1], Bm[0], Bm[1] + 12, "xf-ln"); f.text(Bm[0] + 8, Bm[1] + 12, "0 V", "xf-m")
    f.circ(L[0], L[1], 4, "xf-dot"); f.circ(R[0], R[1], 4, "xf-dot")
    f.path(f"M {L[0]} {L[1]} L {L[0]-14} {L[1]} L {L[0]-14} {L[1]+132} L {cx-40} {L[1]+132}", "xf-dash")
    f.path(f"M {R[0]} {R[1]} L {R[0]+14} {R[1]} L {R[0]+14} {R[1]+132} L {cx+40} {L[1]+132}", "xf-dash")
    f.text(cx, L[1] + 136, "V_o", "xf-h", "middle"); f.text(cx, L[1] + 156, "V_o ≈ V_ex·GF·ε/4", "xf-m", "middle")
    f.text(cx, 18, "quarter bridge", "xf-h", "middle")
    # load cell beam
    ox = 400
    f.text(ox + 150, 20, "โหลดเซลล์แบบคาน (full bridge)", "xf-h", "middle")
    f.rect(ox, 80, 40, 120, "xf-metal", 2)
    f.rect(ox + 40, 110, 240, 40, "xf-metal", 2)
    f.rect(ox + 120, 104, 22, 6, "xf-boxb", 1); f.rect(ox + 190, 104, 22, 6, "xf-boxb", 1); f.rect(ox + 120, 150, 22, 6, "xf-boxa", 1); f.rect(ox + 190, 150, 22, 6, "xf-boxa", 1)
    f.text(ox + 166, 98, "ยืด (+ε)", "xf-tb", "middle"); f.text(ox + 166, 172, "หด (−ε)", "xf-ta", "middle")
    f.line(ox + 265, 60, ox + 265, 106, "xf-ln", "end"); f.text(ox + 272, 70, "F", "xf-h")
    f.text(ox + 150, 210, "สเปกตัวอย่าง: 2 mV/V ที่พิกัด, V_ex 5–10 V", "xf-k", "middle")
    f.text(ox + 150, 228, "เต็มพิกัดที่ 5 V → 10 mV", "xf-k", "middle")
    return f.svg()


@fig("sx-encoder")
def encoder():
    f = F(720, 220, "สัญญาณเอนโค้ดเดอร์แบบ quadrature: A และ B ต่างเฟส 90 องศา และพัลส์ Z หนึ่งครั้งต่อรอบ", "sx-encoder")
    x0, w = 80, 600
    rows = [("A", 0), ("B", 0.25), ("Z", None)]
    per = 120
    for i, (nm, ph) in enumerate(rows):
        y = 40 + i * 55
        f.text(40, y + 20, nm, "xf-h", "middle")
        pts = []
        if ph is None:
            pts = [(x0, y + 30), (x0 + 300, y + 30), (x0 + 300, y + 5), (x0 + 330, y + 5), (x0 + 330, y + 30), (x0 + w, y + 30)]
        else:
            x = x0
            lvl = None
            t = 0
            while t <= w:
                v = ((t / per + ph) % 1) < 0.5
                yy = y + 5 if v else y + 30
                if lvl is not None and yy != lvl:
                    pts.append((x0 + t, lvl))
                pts.append((x0 + t, yy))
                lvl = yy
                t += 1
        f.poly(pts, "xf-a" if nm == "A" else "xf-b" if nm == "B" else "xf-c")
    for k in range(int(w / (per / 4)) + 1):
        f.line(x0 + k * per / 4, 30, x0 + k * per / 4, 205, "xf-grid")
    f.text(x0 + per * 0.875, 214, "4 ขอบต่อคาบ → นับ ×4", "xf-k", "middle")
    f.text(x0 + 460, 214, "A นำ B = หมุนตามเข็ม · B นำ A = ทวนเข็ม", "xf-k", "middle")
    return f.svg()


@fig("sx-current-sensors")
def current_sensors():
    f = F(780, 240, "เซนเซอร์วัดกระแส: ชันต์ หม้อแปลงกระแส ฮอลล์แบบลูปปิด และขดโรโกวสกี", "sx-current-sensors")
    # shunt
    ox = 10
    f.text(ox + 85, 22, "ชันต์ (Kelvin 4 ขั้ว)", "xf-h", "middle")
    f.line(ox + 10, 120, ox + 50, 120, "xf-ln", "end"); f.rect(ox + 50, 108, 70, 24, "xf-metal", 3); f.line(ox + 120, 120, ox + 160, 120, "xf-ln", "end")
    f.line(ox + 62, 108, ox + 62, 70, "xf-a"); f.line(ox + 108, 108, ox + 108, 70, "xf-a"); f.text(ox + 85, 64, "V = I·R", "xf-ta", "middle")
    f.text(ox + 85, 160, "DC/AC · ไม่แยกโดดเดี่ยว", "xf-k", "middle"); f.text(ox + 85, 176, "มีกำลังสูญเสีย I²R", "xf-k", "middle")
    # CT
    ox = 200
    f.text(ox + 85, 22, "หม้อแปลงกระแส (CT)", "xf-h", "middle")
    f.circ(ox + 85, 120, 42, "xf-metal"); f.circ(ox + 85, 120, 26, "xf-bg")
    f.line(ox + 85, 50, ox + 85, 190, "xf-b", "end"); f.text(ox + 92, 60, "I_p", "xf-tb")
    for k in range(7):
        a = math.pi * (0.15 + 0.7 * k / 6)
        f.line(ox + 85 + 44 * math.cos(a), 120 + 44 * math.sin(a), ox + 85 + 24 * math.cos(a), 120 + 24 * math.sin(a), "xf-a")
    f.text(ox + 85, 208, "AC เท่านั้น · I_s = I_p/N", "xf-k", "middle"); f.text(ox + 85, 224, "ห้ามเปิดวงจรทุติยภูมิ", "xf-k", "middle")
    # Hall closed loop
    ox = 390
    f.text(ox + 85, 22, "ฮอลล์ลูปปิด", "xf-h", "middle")
    f.path(f"M {ox+45} 80 L {ox+125} 80 L {ox+125} 160 L {ox+45} 160 L {ox+45} 128 M {ox+45} 112 L {ox+45} 80", "xf-metal")
    f.rect(ox + 38, 112, 14, 16, "xf-boxa", 2); f.text(ox + 30, 124, "H", "xf-k", "end")
    f.line(ox + 85, 50, ox + 85, 190, "xf-b", "end")
    for k in range(5):
        f.line(ox + 125, 92 + k * 14, ox + 135, 96 + k * 14, "xf-a")
    f.text(ox + 85, 208, "DC ถึง ~200 kHz · แยกโดดเดี่ยว", "xf-k", "middle"); f.text(ox + 85, 224, "ชดเชยฟลักซ์ให้เป็นศูนย์", "xf-k", "middle")
    # Rogowski
    ox = 585
    f.text(ox + 90, 22, "ขดโรโกวสกี", "xf-h", "middle")
    pts = []
    for k in range(200):
        a = 2 * math.pi * k / 199
        rr = 48 + 6 * math.sin(a * 22)
        pts.append((ox + 90 + rr * math.cos(a), 120 + rr * math.sin(a)))
    f.poly(pts, "xf-a")
    f.line(ox + 90, 50, ox + 90, 190, "xf-b", "end")
    f.text(ox + 90, 208, "แกนอากาศ · v = M·di/dt", "xf-k", "middle"); f.text(ox + 90, 224, "ต้องอินทิเกรต · ไม่อิ่มตัว", "xf-k", "middle")
    return f.svg()


@fig("sx-chain")
def chain():
    f = F(780, 210, "ห่วงโซ่ปรับสภาพสัญญาณ: เซนเซอร์ แอมป์เครื่องมือวัด ฟิลเตอร์กันรอยต่อ ADC ตัวแยกโดดเดี่ยว และไมโครคอนโทรลเลอร์", "sx-chain")
    items = [("เซนเซอร์", "mV · Ω · pF", "xf-box"), ("INA", "G = 1+49.4k/R_G", "xf-boxa"), ("ฟิลเตอร์", "anti-aliasing", "xf-boxa"), ("ADC", "N บิต · f_s", "xf-boxb"),
             ("Isolator", "≥ 1.5 kV", "xf-boxc"), ("MCU", "สเกล · ชดเชย", "xf-boxb")]
    x = 14
    for i, (a, b, c) in enumerate(items):
        f.rect(x, 60, 106, 70, c, 10)
        f.text(x + 53, 90, a, "xf-h", "middle"); f.text(x + 53, 112, b, "xf-k", "middle")
        if i < len(items) - 1:
            f.line(x + 108, 95, x + 124, 95, "xf-ln", "end")
        x += 128
    f.line(14 + 128 * 4 + 53, 40, 14 + 128 * 4 + 53, 150, "xf-dash")
    f.text(14 + 128 * 4 + 53, 34, "กำแพงแยกโดดเดี่ยว", "xf-k", "middle")
    f.text(390, 176, "กติกาสำคัญ: กรองก่อนสุ่ม (f_c < f_s/2) · ขยายให้เต็มช่วง ADC · แยกกราวด์ที่จุดเดียว", "xf-m", "middle")
    f.text(390, 196, "ความคลาดรวมของห่วงโซ่ ≈ √(Σ e_i²) เมื่อแต่ละแหล่งเป็นอิสระต่อกัน", "xf-k", "middle")
    return f.svg()


@fig("sx-loop-wiring")
def loop_wiring():
    f = F(780, 250, "การต่อทรานสมิตเตอร์ 4–20 mA แบบ 2 สาย 3 สาย และ 4 สาย", "sx-loop-wiring")
    for i, (t, nw) in enumerate([("2 สาย (loop-powered)", 2), ("3 สาย", 3), ("4 สาย", 4)]):
        ox = 10 + i * 260
        f.text(ox + 120, 22, t, "xf-h", "middle")
        f.rect(ox, 50, 80, 150, "xf-box", 8); f.text(ox + 40, 70, "ตู้ควบคุม", "xf-k", "middle")
        f.rect(ox + 160, 70, 80, 110, "xf-boxa", 10); f.text(ox + 200, 95, "TX", "xf-h", "middle")
        if nw == 2:
            f.text(ox + 40, 100, "24 V", "xf-m", "middle"); f.vres(ox + 22, 130, 180, "250 Ω", "xf-ln")
            f.line(ox + 80, 105, ox + 160, 105, "xf-b", "end"); f.line(ox + 160, 160, ox + 80, 160, "xf-b", "end")
            f.text(ox + 120, 98, "+ 4–20 mA", "xf-k", "middle"); f.text(ox + 200, 120, "กินไฟจากลูป", "xf-k", "middle"); f.text(ox + 200, 136, "< 3.6 mA", "xf-k", "middle")
        elif nw == 3:
            f.text(ox + 40, 100, "24 V", "xf-m", "middle"); f.vres(ox + 22, 130, 180, "250 Ω", "xf-ln")
            f.line(ox + 80, 95, ox + 160, 95, "xf-c", "end"); f.text(ox + 120, 89, "+24 V", "xf-k", "middle")
            f.line(ox + 160, 130, ox + 80, 130, "xf-b", "end"); f.text(ox + 120, 124, "I_out", "xf-k", "middle")
            f.line(ox + 80, 165, ox + 160, 165, "xf-ln"); f.text(ox + 120, 159, "0 V ร่วม", "xf-k", "middle")
        else:
            f.text(ox + 40, 92, "ไฟ AC/DC", "xf-m", "middle"); f.vres(ox + 22, 130, 180, "R", "xf-ln")
            f.line(ox + 80, 85, ox + 160, 85, "xf-c"); f.line(ox + 80, 100, ox + 160, 100, "xf-c"); f.text(ox + 120, 79, "ไฟเลี้ยง", "xf-k", "middle")
            f.line(ox + 160, 140, ox + 80, 140, "xf-b", "end"); f.line(ox + 80, 165, ox + 160, 165, "xf-b"); f.text(ox + 120, 134, "สัญญาณ", "xf-k", "middle")
            f.text(ox + 200, 120, "แหล่งกระแสเอง", "xf-k", "middle"); f.text(ox + 200, 136, "เช่น magmeter", "xf-k", "middle")
    f.text(390, 236, "2 สาย: สายคู่เดียวทั้งไฟเลี้ยงและสัญญาณ ทรานสมิตเตอร์ต้องทำงานได้ด้วยกระแสต่ำกว่า 3.6 mA (ส่วน 'live zero' ที่เหลือ)", "xf-m", "middle")
    return f.svg()


@fig("sx-ne43")
def ne43():
    f = F(760, 170, "ช่วงกระแสตาม NAMUR NE 43: ช่วงวัด 3.8–20.5 mA และระดับแจ้งความผิดพลาด ≤ 3.6 mA และ ≥ 21 mA", "sx-ne43")
    x0, x1 = 40, 720
    X = lambda m: x0 + m / 24 * (x1 - x0)
    segs = [(0, 3.6, "xf-fb", "ผิดพลาด"), (3.6, 3.8, "xf-fc", ""), (3.8, 4, "xf-fa", ""), (4, 20, "xf-fa", "ช่วงวัด 0–100 %"), (20, 20.5, "xf-fa", ""), (20.5, 21, "xf-fc", ""), (21, 24, "xf-fb", "ผิดพลาด")]
    for a, b, c, t in segs:
        f.rect(X(a), 50, X(b) - X(a), 40, c, 0)
        if t:
            f.text((X(a) + X(b)) / 2, 75, t, "xf-h", "middle")
    for m in [0, 3.6, 4, 12, 20, 21, 24]:
        f.line(X(m), 46, X(m), 96, "xf-thin")
        f.text(X(m) + (-3 if m in (3.6, 20) else 3 if m in (4, 21) else 0), 112, f"{m:g}", "xf-m", "end" if m in (3.6, 20) else "start" if m in (4, 21) else "middle")
    f.text(X(3.8), 40, "3.8", "xf-k", "middle"); f.text(X(20.5), 40, "20.5", "xf-k", "middle")
    f.text(X(3.7), 132, "ช่วงต่ำ/สูงกว่าช่วง (ยังเชื่อได้)", "xf-k", "start")
    f.text(380, 156, "mA · ทรานสมิตเตอร์ตาม NE 43 ไม่ส่งค่าวัดเกิน 3.8–20.5 mA เพื่อให้ระบบแยก 'ค่าสุดขั้ว' ออกจาก 'อุปกรณ์เสีย' ได้", "xf-m", "middle")
    return f.svg()


@fig("sx-hart")
def hart_fig():
    f = F(760, 220, "สัญญาณ HART: คลื่นไซน์ 1200 Hz แทนบิต 1 และ 2200 Hz แทนบิต 0 ขนาด ±0.5 mA ซ้อนบนกระแส 4–20 mA ค่าเฉลี่ยเป็นศูนย์", "sx-hart")
    x0, y0, w, h = 60, 30, 680, 150
    axes(f, x0, y0, w, h, "เวลา (ms)", "mA")
    bits = [1, 0, 1, 1, 0, 0, 1, 0]
    tb = 1 / 1200
    T = len(bits) * tb
    pts, ph = [], 0
    N = 800
    for i in range(N + 1):
        t = i / N * T
        b = bits[min(int(t / tb), len(bits) - 1)]
        ph += 2 * math.pi * (1200 if b else 2200) * T / N
        y = 12 + 0.5 * math.sin(ph)
        pts.append((x0 + t / T * w, y0 + h - (y - 11) / 2 * h))
    f.poly(pts, "xf-a")
    f.line(x0, y0 + h / 2, x0 + w, y0 + h / 2, "xf-dash"); f.text(x0 + w, y0 + h + 30, "เส้นประ = ค่าเฉลี่ย 12 mA (ไม่เปลี่ยน)", "xf-k", "end")
    for k, b in enumerate(bits):
        f.text(x0 + (k + 0.5) * w / len(bits), y0 + 12, str(b), "xf-h", "middle")
        f.line(x0 + k * w / len(bits), y0, x0 + k * w / len(bits), y0 + h, "xf-grid")
    for v in (11, 11.5, 12, 12.5, 13):
        f.text(x0 - 6, y0 + h - (v - 11) / 2 * h + 4, f"{v:g}", "xf-k", "end")
    for k in range(0, 8, 2):
        f.text(x0 + k * w / 8, y0 + h + 16, f"{k * tb * 1000:.2f}", "xf-k", "middle")
    return f.svg()


@fig("sx-rs485")
def rs485():
    f = F(780, 240, "บัส RS-485 สำหรับ Modbus RTU: ต่อแบบเดซี่เชน ตัวต้านทานปลายสาย 120 โอห์ม ที่สองปลาย และไบแอสที่มาสเตอร์", "sx-rs485")
    y1, y2 = 110, 140
    f.line(80, y1, 720, y1, "xf-a"); f.line(80, y2, 720, y2, "xf-b")
    f.text(724, y1 + 4, "D+ (B)", "xf-ta"); f.text(724, y2 + 4, "D− (A)", "xf-tb")
    f.vres(90, y1, y2, None, "xf-ln"); f.text(96, y1 - 6, "120 Ω", "xf-k")
    f.vres(700, y1, y2, None, "xf-ln"); f.text(694, y1 - 6, "120 Ω", "xf-k", "end")
    f.rect(20, 40, 110, 46, "xf-boxb", 8); f.text(75, 60, "มาสเตอร์", "xf-h", "middle"); f.text(75, 77, "PLC · ไบแอส", "xf-k", "middle")
    f.line(70, 86, 70, y1, "xf-ln"); f.line(80, 86, 80, y2, "xf-ln")
    for i, nm in enumerate(["ID 1 มิเตอร์", "ID 2 ทรานสมิตเตอร์", "ID 3 อินเวอร์เตอร์", "ID 4 …"]):
        x = 210 + i * 130
        f.rect(x - 50, 175, 100, 40, "xf-boxa", 8); f.text(x, 199, nm, "xf-k", "middle")
        f.line(x - 6, 175, x - 6, y1, "xf-ln"); f.line(x + 6, 175, x + 6, y2, "xf-ln")
    f.text(400, 30, "ระยะรวม ≤ 1200 m · ≤ 32 unit load ต่อเซกเมนต์ · สายคู่บิดเกลียวมีชีลด์ + สายกราวด์อ้างอิง", "xf-m", "middle")
    f.text(400, 232, "ห้ามต่อแบบดาว (star) หรือกิ่งยาว — สัญญาณสะท้อนทำให้ CRC ผิดเป็นระยะ", "xf-k", "middle")
    return f.svg()


@fig("sx-modbus-frame")
def modbus_frame():
    f = F(780, 200, "โครงสร้างเฟรม Modbus RTU และ Modbus TCP ของคำขออ่านรีจิสเตอร์ฟังก์ชัน 03", "sx-modbus-frame")
    def frame(y, title, parts):
        f.text(20, y - 10, title, "xf-h")
        x = 20
        for txt, sub, wd, c in parts:
            f.rect(x, y, wd, 44, c, 4)
            f.text(x + wd / 2, y + 19, txt, "xf-m", "middle"); f.text(x + wd / 2, y + 36, sub, "xf-k", "middle")
            x += wd + 4
    frame(40, "RTU (RS-485)", [("≥ 3.5 อักขระ", "เงียบ", 90, "xf-bg"), ("01", "Slave", 70, "xf-boxa"), ("03", "Function", 80, "xf-boxb"), ("00 00", "Start addr", 100, "xf-boxc"),
                               ("00 02", "Quantity", 100, "xf-boxc"), ("C4 0B", "CRC lo hi", 100, "xf-box"), ("≥ 3.5 อักขระ", "เงียบ", 90, "xf-bg")])
    frame(130, "TCP (พอร์ต 502)", [("00 01", "Transaction", 90, "xf-box"), ("00 00", "Protocol", 80, "xf-box"), ("00 06", "Length", 80, "xf-box"), ("01", "Unit", 60, "xf-boxa"),
                                  ("03", "Function", 80, "xf-boxb"), ("00 00 00 02", "Data", 140, "xf-boxc")])
    f.text(590, 166, "PDU เดียวกัน · TCP ไม่มี CRC", "xf-k")
    return f.svg()


@fig("sx-fieldbus-topo")
def fieldbus_topo():
    f = F(780, 260, "โทโพโลยีฟิลด์บัสแบบ trunk และ spur: แหล่งจ่ายพร้อมตัวปรับสภาพ เทอร์มิเนเตอร์สองปลาย และกล่องแยกสายไปยังอุปกรณ์", "sx-fieldbus-topo")
    f.rect(20, 60, 120, 60, "xf-boxb", 8); f.text(80, 85, "DCS / H1 card", "xf-h", "middle"); f.text(80, 103, "หรือ DP/PA coupler", "xf-k", "middle")
    f.rect(20, 140, 120, 46, "xf-boxc", 8); f.text(80, 160, "แหล่งจ่าย + power", "xf-k", "middle"); f.text(80, 176, "conditioner", "xf-k", "middle")
    f.line(140, 100, 600, 100, "xf-a"); f.line(140, 160, 170, 160, "xf-ln"); f.line(170, 160, 170, 100, "xf-ln")
    f.rect(160, 92, 16, 16, "xf-box", 2); f.text(168, 86, "T", "xf-k", "middle")
    f.text(370, 92, "trunk สายคู่บิดเกลียวมีชีลด์ (31.25 kbit/s + ไฟ DC บนสายเดียว)", "xf-k", "middle")
    for jb in (300, 520):
        f.rect(jb - 30, 100, 60, 30, "xf-box", 4); f.text(jb, 120, "JB", "xf-k", "middle")
        for k in range(3):
            x = jb - 40 + k * 40
            f.line(x, 130, x, 190, "xf-ln")
            f.circ(x, 205, 15, "xf-boxa"); f.text(x, 209, ["PT", "FT", "TT", "LT", "AT", "FV"][k + (3 if jb > 400 else 0)], "xf-k", "middle")
    f.rect(600, 92, 16, 16, "xf-box", 2); f.text(608, 86, "T", "xf-k", "middle")
    f.text(640, 104, "เทอร์มิเนเตอร์", "xf-k")
    f.text(390, 246, "spur ต่อออกจากกล่องแยกสาย (มักมีลิมิตกระแสลัดวงจรต่อ spur) · ความยาวรวมสาย Type A ≤ 1900 m", "xf-m", "middle")
    return f.svg()


@fig("sx-pyramid")
def pyramid():
    f = F(860, 300, "พีระมิดระบบอัตโนมัติตาม ISA-95 เทียบกับสถาปัตยกรรม IIoT ที่ส่งข้อมูลเซนเซอร์ขึ้นคลาวด์ผ่านช่องทางที่สอง", "sx-pyramid")
    levels = [("4 · ERP", "วัน–สัปดาห์"), ("3 · MES", "ชั่วโมง"), ("2 · SCADA / HMI", "วินาที"), ("1 · PLC / DCS", "มิลลิวินาที"), ("0 · เซนเซอร์ / แอคชูเอเตอร์", "ต่อเนื่อง")]
    cx = 230
    for i, (t, sub) in enumerate(levels):
        y = 30 + i * 46
        top, bot = 40 + i * 32, 72 + i * 32
        f.poly([(cx - top, y), (cx + top, y), (cx + bot, y + 40), (cx - bot, y + 40)], "xf-boxa" if i < 4 else "xf-boxb", close=True)
        f.text(cx, y + 25, t, "xf-k", "middle")
        f.text(cx + bot + 12, y + 25, sub, "xf-k")
    f.text(cx, 290, "ISA-95 / IEC 62264: ข้อมูลไหลทีละชั้น", "xf-m", "middle")
    ox = 550
    f.rect(ox + 40, 30, 220, 44, "xf-boxc", 10); f.text(ox + 150, 57, "คลาวด์ · Analytics · AI", "xf-h", "middle")
    f.rect(ox, 140, 130, 44, "xf-boxa", 10); f.text(ox + 65, 167, "PLC/DCS (ควบคุม)", "xf-k", "middle")
    f.rect(ox + 160, 140, 130, 44, "xf-boxc", 10); f.text(ox + 225, 159, "Edge gateway", "xf-k", "middle"); f.text(ox + 225, 175, "OPC UA · MQTT", "xf-k", "middle")
    f.rect(ox + 50, 225, 200, 40, "xf-boxb", 10); f.text(ox + 150, 250, "เซนเซอร์อัจฉริยะ (HART · APL)", "xf-k", "middle")
    f.line(ox + 110, 225, ox + 80, 186, "xf-ln", "end"); f.line(ox + 190, 225, ox + 220, 186, "xf-c", "end")
    f.line(ox + 225, 140, ox + 190, 76, "xf-c", "end")
    f.text(ox + 214, 112, "ช่องทางที่สอง", "xf-tc")
    f.text(ox + 150, 290, "NAMUR Open Architecture: อ่านข้อมูลโดยไม่รบกวนลูปควบคุม", "xf-k", "middle")
    return f.svg()

@fig("sx-pid-symbols")
def pid_symbols():
    f = F(780, 250, "สัญลักษณ์เครื่องมือวัดตาม ISA-5.1: ตำแหน่งติดตั้ง และชนิดเส้นสัญญาณ", "sx-pid-symbols")
    items = [("ภาคสนาม", "circle", None), ("หน้าแผงในห้องควบคุม", "circle", "solid"), ("หลังแผง", "circle", "dash"), ("DCS (shared display)", "square", "solid"), ("PLC", "diamond", "solid"), ("คอมพิวเตอร์", "hex", "solid")]
    for i, (t, shp, ln) in enumerate(items):
        x = 70 + i * 125
        if shp == "square":
            f.rect(x - 26, 50, 52, 52, "xf-box", 0)
        if shp == "diamond":
            f.rect(x - 26, 50, 52, 52, "xf-box", 0); f.poly([(x, 50), (x + 26, 76), (x, 102), (x - 26, 76)], "xf-ln", close=True)
        if shp == "hex":
            f.poly([(x - 26, 76), (x - 13, 52), (x + 13, 52), (x + 26, 76), (x + 13, 100), (x - 13, 100)], "xf-box", close=True)
        elif shp in ("circle", "square"):
            f.circ(x, 76, 24, "xf-box")
        if ln == "solid":
            hw = 13 if shp == "diamond" else 26 if shp == "hex" else 24
            f.line(x - hw, 76, x + hw, 76, "xf-ln")
        if ln == "dash":
            f.line(x - 24, 76, x + 24, 76, "xf-dash")
        f.text(x, 124, t, "xf-k", "middle")
    lines = [("เส้นกระบวนการ", "xf-ln", None), ("สัญญาณไฟฟ้า (4–20 mA)", "xf-dash", None), ("สัญญาณนิวแมติก", "xf-ln", "pn"), ("ลิงก์ข้อมูล/ซอฟต์แวร์", "xf-thin", "data")]
    for i, (t, c, k) in enumerate(lines):
        x = 30 + i * 190
        y = 190
        if k == "pn":
            f.line(x, y, x + 150, y, "xf-ln")
            for j in range(4):
                xx = x + 30 + j * 30
                f.line(xx - 4, y + 6, xx + 4, y - 6, "xf-ln"); f.line(xx + 2, y + 6, xx + 10, y - 6, "xf-ln")
        elif k == "data":
            f.line(x, y, x + 150, y, "xf-thin")
            for j in range(5):
                f.circ(x + 15 + j * 30, y, 3.5, "xf-doto")
        else:
            f.line(x, y, x + 150, y, c)
        f.text(x + 75, y + 26, t, "xf-k", "middle")
    return f.svg()


@fig("sx-pid-loop")
def pid_loop():
    f = F(760, 300, "ตัวอย่าง P&ID ลูปควบคุมระดับ: LT-101 ส่งสัญญาณไป LIC-101 ใน DCS ซึ่งสั่งวาล์ว LV-101 พร้อมสัญญาณเตือน LAH และ LAL", "sx-pid-loop")
    f.rect(260, 60, 150, 190, "xf-box", 6); f.rect(262, 150, 146, 98, "xf-liq", 2); f.text(335, 52, "V-101", "xf-h", "middle")
    f.line(120, 90, 260, 90, "xf-ln", "end"); f.text(130, 82, "ขาเข้า", "xf-k")
    f.line(335, 250, 335, 275, "xf-ln"); f.line(335, 275, 520, 275, "xf-ln")
    f.poly([(520, 265), (540, 275), (520, 285)], "xf-box", close=True); f.poly([(560, 265), (540, 275), (560, 285)], "xf-box", close=True)
    f.line(540, 275, 540, 250, "xf-ln"); f.path("M 526 250 A 14 14 0 0 1 554 250 Z", "xf-box")
    f.line(560, 275, 720, 275, "xf-ln", "end"); f.text(540, 296, "LV-101", "xf-k", "middle")
    # LT
    f.line(410, 230, 450, 230, "xf-ln"); f.line(410, 100, 450, 100, "xf-ln"); f.line(450, 100, 450, 230, "xf-thin")
    f.circ(480, 200, 22, "xf-box"); f.text(480, 196, "LT", "xf-m", "middle"); f.text(480, 211, "101", "xf-k", "middle"); f.line(450, 200, 458, 200, "xf-ln")
    # LIC in DCS
    f.rect(520, 100, 52, 52, "xf-box", 0); f.circ(546, 126, 24, "xf-box"); f.line(522, 126, 570, 126, "xf-ln")
    f.text(546, 121, "LIC", "xf-m", "middle"); f.text(546, 142, "101", "xf-k", "middle")
    f.path("M 480 178 L 480 126 L 520 126", "xf-dash")
    f.path("M 572 126 L 640 126 L 640 230 L 548 230 L 548 244", "xf-dash")
    f.text(650, 180, "4–20 mA → I/P", "xf-k")
    f.text(578, 96, "LAH 85 % · LAL 15 %", "xf-k")
    # LG
    f.circ(200, 190, 20, "xf-box"); f.text(200, 194, "LG", "xf-m", "middle"); f.line(220, 190, 260, 190, "xf-thin"); f.text(200, 224, "เกจระดับ (ดูด้วยตา)", "xf-k", "middle")
    f.text(380, 20, "อ่าน: Level Transmitter → Level Indicating Controller → Level control Valve · เลขลูป 101 เดียวกัน", "xf-m", "middle")
    return f.svg()


@fig("sx-cal-setup")
def cal_setup():
    f = F(760, 250, "ชุดสอบเทียบทรานสมิตเตอร์ความดัน: เครื่องกำเนิดความดันอ้างอิง ทรานสมิตเตอร์ที่ทดสอบ แหล่งจ่าย ตัวต้านทาน 250 โอห์ม มิเตอร์กระแสอ้างอิง และ HART communicator", "sx-cal-setup")
    f.rect(20, 80, 130, 80, "xf-boxc", 10); f.text(85, 108, "เครื่องสอบเทียบ", "xf-h", "middle"); f.text(85, 128, "ความดันอ้างอิง", "xf-k", "middle"); f.text(85, 144, "TUR ≥ 4 : 1", "xf-k", "middle")
    f.line(150, 120, 236, 120, "xf-b", "end"); f.text(193, 112, "ท่อความดัน", "xf-k", "middle")
    f.rect(240, 70, 120, 100, "xf-boxa", 10); f.text(300, 106, "DUT", "xf-h", "middle"); f.text(300, 126, "ทรานสมิตเตอร์", "xf-k", "middle"); f.text(300, 142, "ที่ทดสอบ", "xf-k", "middle")
    # series loop: +24 → DUT+ ; DUT− → 250 Ω → mA meter → 0 V
    f.rect(600, 40, 120, 44, "xf-box", 8); f.text(660, 67, "24 V DC", "xf-m", "middle")
    f.path("M 360 90 L 430 90 L 430 60 L 600 60", "xf-ln"); f.text(372, 84, "+", "xf-m")
    f.path("M 360 150 L 430 150", "xf-ln"); f.text(372, 166, "−", "xf-m")
    f.resistor(430, 150, 530, "250 Ω", "xf-ln")
    f.line(530, 150, 580, 150, "xf-ln")
    f.circ(610, 150, 30, "xf-boxb"); f.text(610, 146, "mA", "xf-h", "middle"); f.text(610, 162, "อ้างอิง", "xf-k", "middle")
    f.path("M 640 150 L 700 150 L 700 84", "xf-ln")
    f.rect(400, 196, 170, 36, "xf-box", 8); f.text(485, 219, "HART communicator", "xf-k", "middle")
    f.path("M 440 196 L 440 150", "xf-dash"); f.path("M 530 196 L 530 150", "xf-dash")
    f.text(130, 210, "as-found → ปรับ trim → as-left", "xf-m", "middle")
    return f.svg()

@fig("sx-mems")
def mems():
    f = F(720, 220, "โครงสร้างแอกเซเลอโรมิเตอร์ MEMS แบบหวี: มวลเคลื่อนที่ได้ แขวนด้วยสปริงซิลิคอน ระยะห่างระหว่างนิ้วหวีเปลี่ยนค่าความจุ", "sx-mems")
    f.rect(220, 70, 280, 80, "xf-boxa", 4); f.text(360, 115, "มวลพิสูจน์ (proof mass)", "xf-k", "middle")
    for x in (180, 540):
        f.rect(x - 20, 60, 40, 100, "xf-metal", 2)
        f.path(f"M {x + (20 if x < 360 else -20)} 110 l {(10 if x < 360 else -10)} -10 l {(10 if x < 360 else -10)} 20 l {(10 if x < 360 else -10)} -20 l {(10 if x < 360 else -10)} 20", "xf-ln")
    for k in range(7):
        x = 240 + k * 38
        f.rect(x, 150, 8, 36, "xf-boxa", 1)
        f.rect(x + 16, 162, 8, 36, "xf-metal", 1)
    f.line(360, 30, 420, 30, "xf-b", "end"); f.text(430, 34, "a", "xf-tb")
    f.text(360, 214, "ระยะห่างเปลี่ยน → C₁ − C₂ ∝ ความเร่ง · ขนาดทั้งชิป ~ 1–3 mm", "xf-m", "middle")
    f.text(100, 110, "สปริง", "xf-k", "middle")
    return f.svg()


# --------------------------------------------------------------------------- runner
def main():
    force = "--all" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")] or sorted(glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True))
    total = 0
    cache = {}
    for fpath in files:
        src = open(fpath, encoding="utf-8").read()

        def rep(m):
            key, body = m.group(1), m.group(2)
            if key not in FIGS or (body and not force):
                return m.group(0)
            if key not in cache:
                cache[key] = FIGS[key]()
            return f"<!--FIG:{key}-->" + cache[key] + "<!--/FIG-->"
        out, n = re.subn(r"<!--FIG:([\w-]+)-->(<svg[\s\S]*?</svg>)?<!--/FIG-->", rep, src)
        if out != src:
            open(fpath, "w", encoding="utf-8").write(out)
            total += 1
            print("updated", os.path.relpath(fpath, ROOT))
    missing = set()
    for fpath in files:
        for k in re.findall(r"<!--FIG:(sx-[\w-]+)--><!--/FIG-->", open(fpath, encoding="utf-8").read()):
            missing.add(k)
    if missing:
        print("unknown sx keys:", ", ".join(sorted(missing)))
    print(total, "file(s) updated")


if __name__ == "__main__":
    main()
