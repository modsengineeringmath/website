# Static SVG figures for the calculus track and the Laplace series (functions, limits, derivatives, integrals, Laplace).
# Usage: python3 scripts/math_figs.py            fills empty <!--FIG:key--><!--/FIG--> blocks
#        python3 scripts/math_figs.py --all      redraws every figure this script owns
# Only keys in FIGS are touched; keys owned by fg_figs.py / cs_figs.py / fs_figs.py are left alone.
# Figures use CSS classes from assets/site.css ("MATH LABS" block) so they follow light/dark mode.
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


class S:
    """an SVG canvas with helpers"""

    def __init__(self, w, h, label):
        self.w, self.h, self.label, self.p = w, h, label, []

    def add(self, s):
        self.p.append(s)

    def svg(self):
        lab = self.label.replace('"', "&quot;")
        return f'<svg class="mf" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}">' + "".join(self.p) + "</svg>"

    def text(self, x, y, s, cls="mf-t", anchor="start"):
        self.add(f'<text class="{cls}" x="{f1(x)}" y="{f1(y)}" text-anchor="{anchor}">{s}</text>')

    def line(self, x1, y1, x2, y2, cls):
        self.add(f'<line class="{cls}" x1="{f1(x1)}" y1="{f1(y1)}" x2="{f1(x2)}" y2="{f1(y2)}"/>')

    def path(self, d, cls):
        self.add(f'<path class="{cls}" d="{d}"/>')

    def rect(self, x, y, w, h, cls, rx=0):
        self.add(f'<rect class="{cls}" x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" rx="{rx}"/>')

    def circle(self, x, y, r, cls):
        self.add(f'<circle class="{cls}" cx="{f1(x)}" cy="{f1(y)}" r="{f1(r)}"/>')


class Plane:
    """an s-plane panel inside S at (x, y) size (w, h) covering xr × yr"""

    def __init__(self, c, x, y, w, h, xr, yr, tick=1, labels=True, title=None):
        self.c, self.x, self.y, self.w, self.h, self.xr, self.yr = c, x, y, w, h, xr, yr
        c.rect(x, y, w, h, "mf-bg", 8)
        if title:
            c.text(x + 6, y - 6, title, "mf-h")
        k = math.ceil(xr[0])
        while k <= xr[1]:
            c.line(self.sx(k), y, self.sx(k), y + h, "mf-g")
            if labels and k and k % tick == 0:
                c.text(self.sx(k), self.sy(0) + 12, str(k), "mf-k", "middle")
            k += 1
        k = math.ceil(yr[0])
        while k <= yr[1]:
            c.line(x, self.sy(k), x + w, self.sy(k), "mf-g")
            if labels and k and k % tick == 0:
                c.text(self.sx(0) + 3, self.sy(k) + 3, f"{k}j", "mf-k")
            k += 1
        c.line(x, self.sy(0), x + w, self.sy(0), "mf-ax")
        if xr[0] < 0 < xr[1]:
            c.line(self.sx(0), y, self.sx(0), y + h, "mf-jw")
        c.text(x + w - 4, self.sy(0) - 5, "σ", "mf-l", "end")
        if xr[0] < 0 < xr[1]:
            c.text(self.sx(0) + 5, y + 12, "jω", "mf-l")

    def sx(self, v):
        return self.x + (v - self.xr[0]) / (self.xr[1] - self.xr[0]) * self.w

    def sy(self, v):
        return self.y + (self.yr[1] - v) / (self.yr[1] - self.yr[0]) * self.h

    def roc(self, a, b):
        x0 = self.sx(max(a, self.xr[0])) if a > -1e9 else self.x
        x1 = self.sx(min(b, self.xr[1])) if b < 1e9 else self.x + self.w
        self.c.rect(x0, self.y, x1 - x0, self.h, "mf-roc")
        for v in (a, b):
            if -1e9 < v < 1e9:
                self.c.line(self.sx(v), self.y, self.sx(v), self.y + self.h, "mf-rocb")

    def pole(self, re, im=0, r=5.5, cls="mf-pole"):
        X, Y = self.sx(re), self.sy(im)
        self.c.path(f"M{f1(X-r)} {f1(Y-r)}L{f1(X+r)} {f1(Y+r)}M{f1(X-r)} {f1(Y+r)}L{f1(X+r)} {f1(Y-r)}", cls)

    def zero(self, re, im=0, r=5.5):
        self.c.circle(self.sx(re), self.sy(im), r, "mf-zero")

    def dot(self, re, im, label=None, cls="mf-dot"):
        self.c.circle(self.sx(re), self.sy(im), 4.5, cls)
        if label:
            self.c.text(self.sx(re) + 7, self.sy(im) - 6, label, "mf-lab")


def mini(c, x, y, w, h, fn, t0, t1, ymin=None, ymax=None, n=240, cls="mf-sig", title=None, axis=True, extra=None):
    """small time plot"""
    xs = [t0 + (t1 - t0) * i / n for i in range(n + 1)]
    ys = []
    for t in xs:
        try:
            ys.append(fn(t))
        except Exception:
            ys.append(float("nan"))
    good = [v for v in ys if v == v and abs(v) < 1e6]
    lo = min(good + [0]) if ymin is None else ymin
    hi = max(good + [0]) if ymax is None else ymax
    if hi - lo < 1e-9:
        hi, lo = lo + 1, lo - 1
    pad = (hi - lo) * 0.08
    lo, hi = lo - pad, hi + pad
    sx = lambda t: x + (t - t0) / (t1 - t0) * w
    sy = lambda v: y + (hi - v) / (hi - lo) * h
    c.rect(x, y, w, h, "mf-bg", 6)
    if axis:
        if lo < 0 < hi:
            c.line(x, sy(0), x + w, sy(0), "mf-ax")
        if t0 < 0 < t1:
            c.line(sx(0), y, sx(0), y + h, "mf-ax")
    d, pen = "", False
    for t, v in zip(xs, ys):
        if v != v or v < lo - (hi - lo) or v > hi + (hi - lo):
            pen = False
            continue
        v = max(lo - 2, min(hi + 2, v))
        d += ("L" if pen else "M") + f"{f1(sx(t))} {f1(sy(v))}"
        pen = True
    c.add(f'<clipPath id="cp{len(c.p)}"><rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}"/></clipPath>')
    cid = f"cp{len(c.p) - 1}"
    c.add(f'<g clip-path="url(#{cid})"><path class="{cls}" d="{d}"/>' + (extra(sx, sy) if extra else "") + "</g>")
    if title:
        c.text(x + 2, y - 6, title, "mf-lab")
    return sx, sy


# ---------------------------------------------------------------- Laplace figures
@fig("lap-est-grid")
def est_grid():
    c = S(720, 440, "ระนาบ s กับรูปร่างของ e^{st} ที่ตำแหน่งต่างกัน")
    P = Plane(c, 20, 40, 250, 250, (-3, 2), (-5, 5), labels=False, title="ระนาบ s (ช่องละ 1 หน่วย)")
    pts = [("A", -1.5, 0), ("B", 0, 0), ("C", 0.8, 0), ("D", -0.6, 4), ("E", 0, 4), ("F", 0.4, 4)]
    for lab, re, im in pts:
        P.dot(re, im, lab)
        if im:
            P.dot(re, -im, None, "mf-dot2")
    titles = {"A": "A: σ < 0, ω = 0 ลดลง", "B": "B: s = 0 คงที่", "C": "C: σ > 0, ω = 0 โตขึ้น",
              "D": "D: σ < 0 แกว่งลดลง", "E": "E: σ = 0 แกว่งค้าง", "F": "F: σ > 0 แกว่งโตขึ้น"}
    for i, (lab, re, im) in enumerate(pts):
        col, row = i % 2, i // 2
        x0, y0 = 300 + col * 210, 40 + row * 132
        mini(c, x0, y0, 195, 100, lambda t, a=re, b=im: math.exp(a * t) * math.cos(b * t), 0, 4, title=titles[lab])
    c.text(20, 316, "จุดเข้ม = ตำแหน่งของ s", "mf-k")
    c.text(20, 332, "จุดจาง = คู่สังยุค (ทำให้สัญญาณเป็นจำนวนจริง)", "mf-k")
    c.text(20, 348, "กราฟ: Re{e^(st)} = e^(σt)cos ωt, 0 ≤ t ≤ 4", "mf-k")
    return c.svg()


@fig("lap-bromwich")
def bromwich():
    c = S(420, 340, "เส้นบรอมวิชและเส้นโค้งปิดรอบโพล")
    P = Plane(c, 20, 20, 380, 300, (-5, 2), (-4, 4), tick=2)
    cx = P.sx(1)
    R = (P.sx(1) - P.sx(-4.2))
    c.line(cx, P.y, cx, P.y + P.h, "mf-brom")
    c.path(f"M{f1(cx)} {f1(P.sy(3.8))} A {f1(R*0.55)} {f1((P.sy(-3.8)-P.sy(3.8))/2)} 0 0 0 {f1(cx)} {f1(P.sy(-3.8))}", "mf-arc")
    for re, im in [(-1, 0), (-2, 2), (-2, -2), (-3.5, 0), (0, 0)]:
        P.pole(re, im)
    c.text(cx + 6, P.y + 16, "Re s = c", "mf-lab")
    c.text(cx + 6, P.y + 32, "(อยู่ใน ROC)", "mf-k")
    c.text(P.sx(-4.6), P.sy(3.2), "ครึ่งวงกลมปิดทางซ้าย", "mf-k")
    c.path(f"M{f1(cx)} {f1(P.sy(0.9))} l -5 8 l 10 0 z", "mf-arrow")
    return c.svg()


@fig("lap-pz-r1")
def pz_r1():
    c = S(320, 270, "แผนภาพโพล-ซีโร่ของ H(s) = 2(s+3)/((s+1)(s^2+4s+8))")
    P = Plane(c, 15, 15, 290, 240, (-4, 1), (-3, 3), tick=1)
    P.zero(-3)
    P.pole(-1)
    P.pole(-2, 2)
    P.pole(-2, -2)
    c.text(P.sx(-3), P.sy(0) - 12, "ซีโร่ −3", "mf-lab", "middle")
    c.text(P.sx(-1) + 4, P.sy(0) - 12, "−1", "mf-lab")
    c.text(P.sx(-2) + 10, P.sy(2) + 4, "−2+2j", "mf-lab")
    c.text(P.sx(-2) + 10, P.sy(-2) + 4, "−2−2j", "mf-lab")
    return c.svg()


@fig("lap-roc-two")
def roc_two():
    c = S(720, 300, "โพลเดียวกันที่ s = −a ROC ต่างกันให้สัญญาณต่างกัน")
    a = 1.0
    P1 = Plane(c, 20, 30, 200, 160, (-3, 2), (-2, 2), labels=False, title="ROC: Re s > −a")
    P1.roc(-a, 1e10)
    P1.pole(-a)
    mini(c, 240, 30, 120, 160, lambda t: math.exp(-a * t) if t >= 0 else 0, -3, 4, title="e^(−at)u(t)")
    P2 = Plane(c, 380, 30, 200, 160, (-3, 2), (-2, 2), labels=False, title="ROC: Re s < −a")
    P2.roc(-1e10, -a)
    P2.pole(-a)
    mini(c, 600, 30, 110, 160, lambda t: -math.exp(-a * t) if t < 0 else 0, -3, 1, title="−e^(−at)u(−t)")
    c.text(20, 220, "ทั้งสองคู่มี X(s) = 1/(s + a) เหมือนกัน (ในภาพ a = 1) ต่างกันที่ ROC เท่านั้น", "mf-k")
    c.text(20, 238, "ROC ขวาของโพล → สัญญาณด้านขวา (t ≥ 0) · ROC ซ้ายของโพล → สัญญาณด้านซ้าย (t < 0)", "mf-k")
    return c.svg()


@fig("lap-roc-three")
def roc_three():
    c = S(720, 360, "ROC สามแบบของ X(s) = 1/((s+1)(s+2)) กับสัญญาณสามตัว")
    specs = [("(ก) Re s > −1", (-1, 1e10), lambda t: (math.exp(-t) - math.exp(-2 * t)) if t >= 0 else 0),
             ("(ข) −2 < Re s < −1", (-2, -1), lambda t: -math.exp(-2 * t) if t >= 0 else -math.exp(-t)),
             ("(ค) Re s < −2", (-1e10, -2), lambda t: (-math.exp(-t) + math.exp(-2 * t)) if t < 0 else 0)]
    for i, (tt, roc, fn) in enumerate(specs):
        x0 = 20 + i * 235
        P = Plane(c, x0, 30, 215, 150, (-4, 1), (-2, 2), labels=False, title=tt)
        P.roc(*roc)
        P.pole(-1)
        P.pole(-2)
        mini(c, x0, 200, 215, 120, fn, -3, 3)
    c.text(20, 345, "แถวล่าง: x(t) ช่วง −3 ≤ t ≤ 3 · มีเพียง (ก) ที่เป็นเหตุผลและเสถียร (ROC ครอบแกน jω)", "mf-k")
    return c.svg()


@fig("lap-pole-map")
def pole_map():
    c = S(720, 450, "ตำแหน่งโพลกับผลตอบสนองอิมพัลส์")
    P = Plane(c, 20, 30, 260, 260, (-3, 1.5), (-5, 5), labels=False, title="ระนาบ s (ช่องละ 1 หน่วย)")
    P.c.rect(P.x, P.y, P.sx(0) - P.x, P.h, "mf-lhp")
    pts = [("1", -2, 0), ("2", -0.4, 0), ("3", 0.5, 0), ("4", -1.2, 4), ("5", -0.25, 4), ("6", 0, 2.5), ("7", 0.3, 3)]
    for lab, re, im in pts:
        P.pole(re, im)
        P.c.text(P.sx(re) + 7, P.sy(im) - 7, lab, "mf-lab")
        if im:
            P.pole(re, -im, cls="mf-pole2")
    c.text(24, 312, "ครึ่งซ้าย (สีเขียวจาง) = เสถียร", "mf-k")
    desc = {"1": "1: −2 ลดเร็ว", "2": "2: −0.4 ลดช้า (เด่น)", "3": "3: +0.5 โต ไม่เสถียร", "4": "4: −1.2±4j แกว่งหน่วงมาก",
            "5": "5: −0.25±4j แกว่งนาน", "6": "6: ±2.5j แกว่งค้าง", "7": "7: 0.3±3j แกว่งโต"}
    for i, (lab, re, im) in enumerate(pts):
        col, row = i % 2, i // 2
        x0, y0 = 300 + col * 210, 30 + row * 104
        mini(c, x0, y0, 198, 80, lambda t, a=re, b=im: math.exp(a * t) * (math.cos(b * t) if b else 1), 0, 6, title=desc[lab])
    return c.svg()


@fig("lap-damping")
def damping():
    c = S(720, 300, "ผลตอบสนองอิสระของระบบอันดับสองที่ความหน่วงต่าง ๆ")
    zs = [(0, "mf-s1", "ζ = 0"), (0.2, "mf-s2", "ζ = 0.2"), (0.5, "mf-s3", "ζ = 0.5"), (1, "mf-s4", "ζ = 1"), (2, "mf-s5", "ζ = 2")]

    def resp(z):
        def f(t):
            if z < 1:
                wd = math.sqrt(1 - z * z)
                return math.exp(-z * t) * (math.cos(wd * t) + z / wd * math.sin(wd * t))
            if z == 1:
                return (1 + t) * math.exp(-t)
            r = math.sqrt(z * z - 1)
            s1, s2 = -z + r, -z - r
            return (s1 * math.exp(s2 * t) - s2 * math.exp(s1 * t)) / (s1 - s2)
        return f
    sx = sy = None
    for z, cls, lab in zs:
        if sx is None:
            sx, sy = mini(c, 40, 20, 520, 250, resp(z), 0, 14, -1.1, 1.1, cls=cls)
        else:
            d = "M" + "L".join(f"{f1(sx(t))} {f1(sy(resp(z)(t)))}" for t in [i * 14 / 300 for i in range(301)])
            c.path(d, cls)
    for i, (z, cls, lab) in enumerate(zs):
        y = 40 + i * 24
        c.line(580, y - 4, 610, y - 4, cls)
        c.text(618, y, lab, "mf-lab")
    c.text(44, 288, "t (หน่วยของ 1/ωn) · y(0) = 1, y′(0) = 0", "mf-k")
    return c.svg()


# ---------------------------------------------------------------- calculus figures
def graph(c, x, y, w, h, fn, x0, x1, y0, y1, title=None, cls="mf-sig", n=300, extra=None, dots=None):
    sx = lambda t: x + (t - x0) / (x1 - x0) * w
    sy = lambda v: y + (y1 - v) / (y1 - y0) * h
    c.rect(x, y, w, h, "mf-bg", 6)
    if y0 < 0 < y1:
        c.line(x, sy(0), x + w, sy(0), "mf-ax")
    if x0 < 0 < x1:
        c.line(sx(0), y, sx(0), y + h, "mf-ax")
    fns = fn if isinstance(fn, list) else [(fn, cls)]
    c.add(f'<clipPath id="g{len(c.p)}"><rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}"/></clipPath>')
    cid = f"g{len(c.p) - 1}"
    body = ""
    for f, k in fns:
        d, pen, prev = "", False, None
        for i in range(n + 1):
            t = x0 + (x1 - x0) * i / n
            try:
                v = f(t)
            except Exception:
                v = None
            if v is None or v != v or abs(v) > 1e4 or (prev is not None and abs(v - prev) > (y1 - y0) * 3):
                pen = False
                prev = v if v is not None and v == v else None
                continue
            d += ("L" if pen else "M") + f"{f1(sx(t))} {f1(sy(max(y0 - (y1-y0), min(y1 + (y1-y0), v))))}"
            pen, prev = True, v
        body += f'<path class="{k}" d="{d}"/>'
    if extra:
        body += extra(sx, sy)
    c.add(f'<g clip-path="url(#{cid})">{body}</g>')
    for (dx, dy, open_) in (dots or []):
        c.add(f'<circle class="{"mf-zero" if open_ else "mf-dot"}" cx="{f1(sx(dx))}" cy="{f1(sy(dy))}" r="3.6"/>')
    if title:
        c.text(x + 2, y - 6, title, "mf-lab")
    return sx, sy


@fig("fn-library")
def fn_library():
    c = S(720, 560, "กราฟของฟังก์ชันพื้นฐาน 12 แบบ")
    items = [
        ("y = x", lambda x: x, (-3, 3, -3, 3), None),
        ("y = x²", lambda x: x * x, (-3, 3, -1, 5), None),
        ("y = x³", lambda x: x ** 3, (-2, 2, -4, 4), None),
        ("y = √x", lambda x: math.sqrt(x) if x >= 0 else None, (-1, 5, -0.5, 2.5), [(0, 0, False)]),
        ("y = |x|", abs, (-3, 3, -1, 3), None),
        ("y = 1/x", lambda x: 1 / x if abs(x) > 1e-9 else None, (-3, 3, -4, 4), None),
        ("y = eˣ", math.exp, (-3, 2, -0.5, 5), [(0, 1, False)]),
        ("y = ln x", lambda x: math.log(x) if x > 0 else None, (-0.5, 5, -3, 2), [(1, 0, False)]),
        ("y = sin x", math.sin, (-7, 7, -1.5, 1.5), None),
        ("y = cos x", math.cos, (-7, 7, -1.5, 1.5), None),
        ("y = tan x", lambda x: math.tan(x) if abs(math.cos(x)) > 0.02 else None, (-4.7, 4.7, -4, 4), None),
        ("y = u(x) ขั้นบันได", lambda x: 1.0 if x >= 0 else 0.0, (-3, 3, -0.5, 1.5), [(0, 0, True), (0, 1, False)]),
    ]
    for i, (t, f, r, dots) in enumerate(items):
        col, row = i % 4, i // 4
        x0, y0 = 14 + col * 177, 24 + row * 182
        if t.startswith("y = u"):
            def ext(sx, sy):
                return f'<path class="mf-sig" d="M{f1(sx(-3))} {f1(sy(0))}L{f1(sx(0))} {f1(sy(0))}M{f1(sx(0))} {f1(sy(1))}L{f1(sx(3))} {f1(sy(1))}"/>'
            graph(c, x0, y0, 165, 150, [], *r, title=t, extra=ext, dots=dots)
        else:
            graph(c, x0, y0, 165, 150, f, *r, title=t, dots=dots)
    return c.svg()


@fig("lim-hole")
def lim_hole():
    c = S(720, 230, "ลิมิตที่มีรู ลิมิตกระโดด และลิมิตอนันต์")
    graph(c, 14, 30, 220, 180, lambda x: x + 2 if abs(x - 2) > 1e-9 else None, -0.5, 4, 0, 6.5, title="รู: lim = 4 แต่ f(2) ไม่นิยาม", dots=[(2, 4, True)],
          extra=lambda sx, sy: f'<line class="mf-dash" x1="{f1(sx(2))}" x2="{f1(sx(2))}" y1="{f1(sy(0))}" y2="{f1(sy(4))}"/><line class="mf-dash" x1="{f1(sx(-0.5))}" x2="{f1(sx(2))}" y1="{f1(sy(4))}" y2="{f1(sy(4))}"/>')
    graph(c, 250, 30, 220, 180, [], -2, 2, -1.6, 1.6, title="กระโดด: |x|/x ซ้าย −1 ขวา 1", dots=[(0, -1, True), (0, 1, True)],
          extra=lambda sx, sy: f'<path class="mf-sig" d="M{f1(sx(-2))} {f1(sy(-1))}L{f1(sx(0))} {f1(sy(-1))}M{f1(sx(0))} {f1(sy(1))}L{f1(sx(2))} {f1(sy(1))}"/>')
    graph(c, 486, 30, 220, 180, lambda x: 1 / (x * x) if abs(x) > 0.05 else None, -2, 2, -0.5, 8, title="อนันต์: 1/x² → ∞ ที่ x = 0")
    return c.svg()


@fig("der-secant")
def der_secant():
    c = S(720, 280, "เส้นตัดเข้าใกล้เส้นสัมผัสเมื่อ h เข้าใกล้ศูนย์")
    f = lambda x: 0.25 * x ** 3 - x + 2
    df = lambda x: 0.75 * x * x - 1
    x0 = 1.0
    def ext(sx, sy):
        out = ""
        for h, cls in [(1.6, "mf-dash"), (0.9, "mf-dash"), (0.4, "mf-dash")]:
            m = (f(x0 + h) - f(x0)) / h
            out += f'<line class="{cls}" x1="{f1(sx(-1))}" y1="{f1(sy(f(x0) + m * (-1 - x0)))}" x2="{f1(sx(3.2))}" y2="{f1(sy(f(x0) + m * (3.2 - x0)))}"/>'
            out += f'<circle class="mf-dot2" cx="{f1(sx(x0 + h))}" cy="{f1(sy(f(x0 + h)))}" r="3.5"/>'
        m = df(x0)
        out += f'<line class="mf-sig3" x1="{f1(sx(-1))}" y1="{f1(sy(f(x0) + m * (-1 - x0)))}" x2="{f1(sx(3.2))}" y2="{f1(sy(f(x0) + m * (3.2 - x0)))}"/>'
        out += f'<circle class="mf-dot" cx="{f1(sx(x0))}" cy="{f1(sy(f(x0)))}" r="4.5"/>'
        return out
    graph(c, 20, 20, 440, 240, f, -1, 3.2, -0.5, 6, extra=ext)
    c.text(480, 50, "เส้นประ: เส้นตัดผ่าน (x₀, f(x₀))", "mf-lab")
    c.text(480, 70, "และ (x₀ + h, f(x₀ + h))", "mf-lab")
    c.text(480, 100, "h = 1.6 → 0.9 → 0.4 → 0", "mf-l")
    c.text(480, 130, "เส้นเขียว: เส้นสัมผัส ความชัน f′(x₀)", "mf-lab")
    c.text(480, 160, "f(x) = x³/4 − x + 2,  x₀ = 1", "mf-k")
    c.text(480, 178, "ความชันเส้นตัด: 1.59 → 0.63 → 0.09", "mf-k")
    c.text(480, 196, "f′(1) = −0.25", "mf-k")
    return c.svg()


@fig("der-extrema")
def der_extrema():
    c = S(720, 330, "ค่าสูงสุด ต่ำสุด และจุดเปลี่ยนเว้า จากอนุพันธ์อันดับหนึ่งและสอง")
    f = lambda x: x ** 3 - 3 * x
    graph(c, 20, 24, 330, 280, f, -2.4, 2.4, -4, 4, title="f(x) = x³ − 3x", dots=[(-1, 2, False), (1, -2, False), (0, 0, True)])
    graph(c, 370, 24, 330, 130, [(lambda x: 3 * x * x - 3, "mf-sig3")], -2.4, 2.4, -4, 12, title="f′(x) = 3x² − 3 (ศูนย์ที่ x = ±1)", dots=[(-1, 0, False), (1, 0, False)])
    graph(c, 370, 180, 330, 124, [(lambda x: 6 * x, "mf-s1")], -2.4, 2.4, -14, 14, title="f″(x) = 6x (ศูนย์ที่ x = 0 จุดเปลี่ยนเว้า)", dots=[(0, 0, True)])
    c.text(24, 322, "x = −1: f′ = 0, f″ < 0 → สูงสุดสัมพัทธ์ (2) · x = 1: f′ = 0, f″ > 0 → ต่ำสุดสัมพัทธ์ (−2) · x = 0: f″ เปลี่ยนเครื่องหมาย → จุดเปลี่ยนเว้า", "mf-k")
    return c.svg()


@fig("int-centroid")
def int_centroid():
    c = S(420, 260, "เซนทรอยด์ของพื้นที่ใต้ y = x^2 จาก 0 ถึง 2")
    def ext(sx, sy):
        pts = " ".join(f"{f1(sx(x))},{f1(sy(x * x))}" for x in [i * 2 / 60 for i in range(61)])
        out = f'<polygon class="mf-fill" points="{f1(sx(0))},{f1(sy(0))} {pts} {f1(sx(2))},{f1(sy(0))}"/>'
        out += f'<rect class="mf-fill2" x="{f1(sx(1.2))}" y="{f1(sy(1.44))}" width="{f1(sx(1.27) - sx(1.2))}" height="{f1(sy(0) - sy(1.44))}"/>'
        out += f'<circle class="mf-dot" cx="{f1(sx(1.5))}" cy="{f1(sy(1.2))}" r="5"/>'
        return out
    graph(c, 20, 16, 380, 220, lambda x: x * x, -0.2, 2.3, -0.3, 4.4, extra=ext)
    c.text(250, 150, "(x̄, ȳ) = (1.5, 1.2)", "mf-lab")
    c.text(150, 210, "แถบ dA = y dx", "mf-k")
    return c.svg()


@fig("int-dam")
def int_dam():
    c = S(520, 280, "แรงดันน้ำเพิ่มเชิงเส้นตามความลึก แรงลัพธ์กระทำที่ 2/3 ของความลึก")
    x0, y0, H = 300, 30, 220
    c.add(f'<rect class="mf-fill2" x="20" y="{y0}" width="{x0 - 20}" height="{H}"/>')
    c.add(f'<path class="mf-box" d="M{x0} {y0 - 10} L{x0} {y0 + H} L{x0 + 120} {y0 + H} L{x0 + 40} {y0 - 10} Z"/>')
    for i in range(1, 11):
        y = y0 + H * i / 10
        L = 18 * i
        c.add(f'<line class="mf-line" x1="{x0 - L}" y1="{f1(y)}" x2="{x0 - 3}" y2="{f1(y)}"/>')
        c.add(f'<path class="mf-arrow" d="M{x0 - 2} {f1(y)} l-8 -4 v8 z"/>')
    c.add(f'<line class="mf-dash" x1="{x0 - 180}" y1="{y0}" x2="{x0}" y2="{y0 + H}"/>')
    yc = y0 + H * 2 / 3
    c.add(f'<line class="mf-pole" x1="{x0 - 120}" y1="{f1(yc)}" x2="{x0 - 4}" y2="{f1(yc)}" style="stroke-width:4"/>')
    c.text(x0 - 260, yc - 8, "F = 9.81 MN ที่ลึก 2H/3 = 6.67 m", "mf-lab")
    c.text(30, y0 + 16, "ผิวน้ำ h = 0", "mf-k")
    c.text(30, y0 + H - 6, "h = H = 10 m: p = ρgH = 98.1 kPa", "mf-k")
    c.text(x0 + 46, y0 + 60, "เขื่อน", "mf-lab")
    return c.svg()


@fig("home-lap")
def home_lap():
    c = S(560, 300, "ระนาบ s ของ H(s) = 2(s+3)/((s+1)(s^2+4s+8)) พร้อม ROC และผลตอบสนองอิมพัลส์ h(t)")
    P = Plane(c, 12, 26, 270, 250, (-4, 1.5), (-3, 3), tick=1, title="ระนาบ s · ROC: Re s > −1")
    P.roc(-1, 1e10)
    P.zero(-3)
    P.pole(-1)
    P.pole(-2, 2)
    P.pole(-2, -2)
    c.text(P.sx(-3), P.sy(0) - 12, "ซีโร่", "mf-lab", "middle")
    c.text(P.sx(-2) + 10, P.sy(2) + 4, "−2±2j", "mf-lab")
    h = lambda t: 0.8 * math.exp(-t) - 0.8 * math.exp(-2 * t) * math.cos(2 * t) + 0.6 * math.exp(-2 * t) * math.sin(2 * t) if t >= 0 else 0
    mini(c, 300, 26, 248, 150, h, -0.5, 6, title="h(t) = ℒ⁻¹{H(s)}")
    c.text(300, 198, "h(t) = 0.8e^(−t)", "mf-k")
    c.text(300, 214, "     − 0.8e^(−2t)cos 2t", "mf-k")
    c.text(300, 230, "     + 0.6e^(−2t)sin 2t", "mf-k")
    c.text(300, 254, "โพล −1 ใกล้แกน jω สุด = โพลเด่น", "mf-k")
    c.text(300, 272, "ROC ครอบแกน jω → เสถียร", "mf-k")
    return c.svg()


# ---------------------------------------------------------------- sequences, series, induction (limits series 3.1–3.2)
def dots_panel(c, x, y, w, h, vals, y0, y1, title, band=None, cls="mf-dot", line=None):
    n = len(vals)
    sx = lambda t: x + 14 + (t - 1) / (n - 1) * (w - 28)
    sy = lambda v: y + (y1 - v) / (y1 - y0) * h
    c.rect(x, y, w, h, "mf-bg", 6)
    if y0 < 0 < y1:
        c.line(x, sy(0), x + w, sy(0), "mf-ax")
    if band:
        L, e = band
        c.rect(x, sy(L + e), w, sy(L - e) - sy(L + e), "mf-fill2")
        c.line(x, sy(L), x + w, sy(L), "mf-dash")
    if line:
        c.add(f'<path class="mf-dash" d="M{f1(sx(1))} {f1(sy(line(1)))}' + "".join(f"L{f1(sx(t))} {f1(sy(line(t)))}" for t in range(2, n + 1)) + '"/>')
    for i, v in enumerate(vals, 1):
        c.line(sx(i), sy(0 if y0 < 0 < y1 else y0), sx(i), sy(v), "mf-g")
        c.circle(sx(i), sy(v), 3.6, cls)
        c.text(sx(i), y + h + 13, str(i), "mf-k", "middle")
    c.text(x + 2, y - 7, title, "mf-h")
    return sx, sy


@fig("sq-terms")
def sq_terms():
    c = S(720, 250, "Sequence examples: arithmetic sequence a_n = 3n − 1, geometric sequence a_n = 5(1/2)^(n−1), and alternating sequence (−1)^n/n converging to 0 (ลำดับเลขคณิต เรขาคณิต และลำดับที่ลู่เข้า)")
    dots_panel(c, 12, 30, 220, 180, [3 * n - 1 for n in range(1, 9)], 0, 25, "เลขคณิต aₙ = 3n − 1 (d = 3)", line=lambda t: 3 * t - 1)
    dots_panel(c, 250, 30, 220, 180, [5 * 0.5 ** (n - 1) for n in range(1, 9)], 0, 5.6, "เรขาคณิต aₙ = 5(½)ⁿ⁻¹ (r = ½)")
    dots_panel(c, 488, 30, 220, 180, [(-1) ** n / n for n in range(1, 11)], -1.1, 0.7, "(−1)ⁿ/n → 0 · แถบ ε = 0.15", band=(0, 0.15), cls="mf-dot")
    c.text(366, 244, "แกนนอน: n = 1, 2, 3, …  · เส้นประ = ลิมิต L · แถบ = L ± ε", "mf-k", "middle")
    return c.svg()


@fig("sq-geo-square")
def sq_geo_square():
    c = S(720, 260, "Geometric series visual proof: 1/2 + 1/4 + 1/8 + 1/16 + … = 1 shown by halving a unit square; partial sums S_n approach 1 (อนุกรมเรขาคณิตอนันต์)")
    x, y, L = 20, 20, 220
    c.rect(x, y, L, L, "mf-box")
    # alternate vertical / horizontal halving
    cx, cy, w, h = x, y, L, L
    labels = ["½", "¼", "⅛", "1/16", "1/32", "1/64"]
    for i in range(6):
        if i % 2 == 0:
            c.rect(cx, cy, w / 2, h, "mf-fill" if i % 4 == 0 else "mf-fill2")
            c.line(cx + w / 2, cy, cx + w / 2, cy + h, "mf-line")
            if i < 4:
                c.text(cx + w / 4, cy + h / 2 + 5, labels[i], "mf-h", "middle")
            cx, w = cx + w / 2, w / 2
        else:
            c.rect(cx, cy, w, h / 2, "mf-fill2" if i % 4 == 1 else "mf-fill")
            c.line(cx, cy + h / 2, cx + w, cy + h / 2, "mf-line")
            if i < 4:
                c.text(cx + w / 2, cy + h / 4 + 5, labels[i], "mf-h", "middle")
            cy, h = cy + h / 2, h / 2
    c.text(x + L / 2, y + L + 16, "พื้นที่รวม = 1 (สี่เหลี่ยมจัตุรัสหนึ่งหน่วย)", "mf-k", "middle")
    # partial sums on a number line
    X0, X1, Y = 300, 700, 150
    sx = lambda v: X0 + v * (X1 - X0)
    c.line(X0, Y, X1, Y, "mf-ax")
    for t in [0, 0.25, 0.5, 0.75, 1]:
        c.line(sx(t), Y - 4, sx(t), Y + 4, "mf-ax")
        c.text(sx(t), Y + 18, f1(t) if t not in (0.25, 0.75) else ("0.25" if t == 0.25 else "0.75"), "mf-k", "middle")
    s = 0
    for n in range(1, 7):
        s += 0.5 ** n
        c.circle(sx(s), Y - 14 - n * 16, 3.6, "mf-dot")
        c.text(sx(s) - 8, Y - 10 - n * 16, f"S{n} = {s:.4g}", "mf-k", "end")
        c.line(sx(s), Y - 14 - n * 16, sx(s), Y, "mf-g")
    c.line(sx(1), 22, sx(1), Y, "mf-dash")
    c.text(sx(1) - 4, 24, "ลิมิต = 1", "mf-l", "end")
    c.text(X0, 206, "Sₙ = 1 − (½)ⁿ → 1 เมื่อ n → ∞", "mf-t")
    c.text(X0, 230, "a/(1 − r) = (½)/(1 − ½) = 1", "mf-l")
    return c.svg()


@fig("sq-integral-test")
def sq_integral_test():
    c = S(720, 260, "Integral test: harmonic series 1/n compared with area under 1/x (diverges) and p-series 1/n² bounded by 1 + ∫ 1/x² dx = 2 (converges) (การทดสอบด้วยปริพันธ์)")
    def panel(x0, f, title, above, ymax, note):
        x, y, w, h = x0, 30, 330, 190
        a, b = 0.6, 9.4
        sx = lambda t: x + (t - a) / (b - a) * w
        sy = lambda v: y + (ymax - v) / ymax * h
        c.rect(x, y, w, h, "mf-bg", 6)
        c.line(x, sy(0), x + w, sy(0), "mf-ax")
        for n in range(1, 9):
            left = n if above else n - 1
            if left < a:
                continue
            c.rect(sx(left), sy(f(n)), sx(left + 1) - sx(left), sy(0) - sy(f(n)), "mf-fill" if n % 2 else "mf-fill2")
            c.add(f'<rect class="mf-dash" x="{f1(sx(left))}" y="{f1(sy(f(n)))}" width="{f1(sx(left + 1) - sx(left))}" height="{f1(sy(0) - sy(f(n)))}"/>')
            c.text(sx(left + 0.5), sy(0) + 13, str(n), "mf-k", "middle")
        d = ""
        for i in range(201):
            t = 0.75 + (b - 0.75) * i / 200
            v = f(t)
            if v > ymax * 1.05:
                continue
            d += ("L" if d else "M") + f"{f1(sx(t))} {f1(sy(v))}"
        c.path(d, "mf-sig")
        c.text(x + 2, y - 8, title, "mf-h")
        c.text(x + w - 6, y + 18, note, "mf-l", "end")
    panel(12, lambda t: 1 / t, "Σ 1/n: แท่งอยู่เหนือเส้นโค้ง y = 1/x", True, 1.15, "Sₙ ≥ ∫₁ⁿ⁺¹ dx/x = ln(n+1) → ∞")
    panel(376, lambda t: 1 / t ** 2, "Σ 1/n²: แท่ง (n ≥ 2) อยู่ใต้เส้นโค้ง y = 1/x²", False, 1.15, "Sₙ ≤ 1 + ∫₁^∞ dx/x² = 2")
    return c.svg()


@fig("sq-taylor-sin")
def sq_taylor_sin():
    c = S(720, 280, "Maclaurin polynomials of sin x: P1 = x, P3, P5, P7 approaching sin x near x = 0 (อนุกรมเทย์เลอร์ของ sin x)")
    def P(n):
        def f(x):
            s, term, k = 0.0, x, 1
            while k <= n:
                s += term
                term *= -x * x / ((k + 1) * (k + 2))
                k += 2
            return s
        return f
    graph(c, 14, 26, 692, 230, [(math.sin, "mf-ink"), (P(1), "mf-s1"), (P(3), "mf-s2"), (P(5), "mf-s3"), (P(7), "mf-s4")], -7, 7, -2.2, 2.2, title="sin x (เส้นดำ) กับ P₁ = x (ม่วง), P₃ (ส้ม), P₅ (เหลือง), P₇ (เขียว)")
    c.text(360, 274, "ยิ่งดีกรีสูง ยิ่งแนบ sin x ได้ไกลจาก 0 · ใกล้ x = 0 แค่ P₁ = x ก็พอ (การประมาณมุมเล็ก)", "mf-k", "middle")
    return c.svg()


def resistor(c, x1, y1, x2, y2, label=None):
    # IEC resistor (box) between two points on a horizontal or vertical line
    if abs(y1 - y2) < 1e-6:
        mx, L = (x1 + x2) / 2, 30
        c.line(x1, y1, mx - L / 2, y1, "mf-line"); c.line(mx + L / 2, y1, x2, y2, "mf-line")
        c.rect(mx - L / 2, y1 - 6, L, 12, "mf-box", 1)
        if label: c.text(mx, y1 - 11, label, "mf-l", "middle")
    else:
        my, L = (y1 + y2) / 2, 30
        c.line(x1, y1, x1, my - L / 2, "mf-line"); c.line(x1, my + L / 2, x2, y2, "mf-line")
        c.rect(x1 - 6, my - L / 2, 12, L, "mf-box", 1)
        if label: c.text(x1 + 10, my + 4, label, "mf-l")


@fig("sq-ladder")
def sq_ladder():
    c = S(720, 190, "Infinite resistor ladder network: each stage has a series resistor R and a shunt resistor R; equivalent resistance R_eq converges to (1+√5)/2 · R ≈ 1.618R (วงจรบันไดตัวต้านทานอนันต์)")
    top, bot, x = 50, 150, 70
    c.circle(40, top, 4, "mf-zero"); c.circle(40, bot, 4, "mf-zero")
    c.line(44, top, x, top, "mf-line"); c.line(44, bot, x, bot, "mf-line")
    c.text(22, (top + bot) / 2 + 4, "R<tspan dy=\"4\" font-size=\"9\">eq</tspan>", "mf-h", "middle")
    for k in range(4):
        resistor(c, x, top, x + 90, top, "R")
        resistor(c, x + 90, top, x + 90, bot, "R")
        c.line(x, bot, x + 90, bot, "mf-line")
        c.circle(x + 90, top, 2.6, "mf-dot"); c.circle(x + 90, bot, 2.6, "mf-dot")
        x += 90
    c.line(x, top, x + 40, top, "mf-dash"); c.line(x, bot, x + 40, bot, "mf-dash")
    c.text(x + 52, (top + bot) / 2 + 4, "… ไม่สิ้นสุด", "mf-t")
    c.text(470, 178, "Rₙ₊₁ = R + (R ∥ Rₙ) · R₁ = 2R → 1.667R → 1.625R → 1.619R → … → φR ≈ 1.618R", "mf-k", "middle")
    c.text(470, 26, "ถ้าตัดส่วนแรกออก ที่เหลือยังเป็นบันไดอนันต์เหมือนเดิม: x = R + Rx/(R + x)", "mf-k", "middle")
    return c.svg()


@fig("in-staircase")
def in_staircase():
    c = S(720, 250, "Visual proof of the sum 1 + 2 + … + n = n(n+1)/2: two staircases of n = 5 fit into a 5 × 6 rectangle (บทพิสูจน์ด้วยภาพของสูตรผลบวก)")
    n, u, x0, y0 = 5, 30, 40, 30
    for i in range(1, n + 1):          # staircase A: column i has i squares
        for j in range(i):
            c.rect(x0 + (i - 1) * u, y0 + (n - 1 - j) * u + u, u - 2, u - 2, "mf-fill")
    for i in range(1, n + 1):          # staircase B (rotated) fills the rest of the n × (n+1) rectangle
        for j in range(n + 1 - i):
            c.rect(x0 + (i - 1) * u, y0 + j * u, u - 2, u - 2, "mf-fill2")
    c.add(f'<rect class="mf-dash" x="{x0 - 2}" y="{y0 - 2}" width="{n * u + 2}" height="{(n + 1) * u + 2}"/>')
    c.text(x0 + n * u / 2, y0 + (n + 1) * u + 18, "กว้าง n = 5", "mf-k", "middle")
    c.text(x0 + n * u + 10, y0 + (n + 1) * u / 2, "สูง n + 1 = 6", "mf-k")
    X = 330
    c.text(X, 56, "บันไดสีส้ม: 1 + 2 + 3 + 4 + 5", "mf-t")
    c.text(X, 80, "บันไดสีฟ้า (หมุนกลับหัว): อีกชุดหนึ่งเท่ากัน", "mf-t")
    c.text(X, 104, "สองชุดรวมกันเป็นสี่เหลี่ยม 5 × 6 = 30 ช่อง", "mf-t")
    c.text(X, 136, "2(1 + 2 + ⋯ + n) = n(n + 1)", "mf-h")
    c.text(X, 160, "1 + 2 + ⋯ + n = n(n + 1)/2", "mf-h")
    c.text(X, 196, "ภาพนี้ “เห็น” สูตร แต่การพิสูจน์ที่ใช้ได้ทุก n", "mf-k")
    c.text(X, 214, "อย่างเป็นระบบคืออุปนัยเชิงคณิตศาสตร์", "mf-k")
    return c.svg()


@fig("in-chain")
def in_chain():
    c = S(720, 170, "Structure of mathematical induction: base case P(n0) is true and the inductive step P(k) ⇒ P(k+1) carries truth to every n ≥ n0 (โครงสร้างของอุปนัยเชิงคณิตศาสตร์)")
    xs = [20, 150, 280, 410, 540]
    names = ["P(1)", "P(2)", "P(3)", "P(4)", "P(5)"]
    for i, x in enumerate(xs):
        c.rect(x, 50, 100, 46, "mf-box", 8)
        c.text(x + 50, 79, names[i], "mf-h", "middle")
        if i < len(xs) - 1:
            c.add(f'<path class="mf-sig" d="M{x + 104} 73 L{x + 126} 73"/><path class="mf-arrow" d="M{x + 126} 67 L{x + 134} 73 L{x + 126} 79 Z" style="fill:var(--accent)"/>')
            c.text(x + 117, 110, "⇒", "mf-k", "middle")
    c.text(668, 79, "⋯ ทุก n", "mf-h")
    c.text(70, 36, "กรณีฐาน (base case)", "mf-l", "middle")
    c.text(410, 36, "ขั้นอุปนัย P(k) ⇒ P(k+1) ใช้ซ้ำได้ไม่สิ้นสุด", "mf-l", "middle")
    c.text(360, 148, "สองชิ้นนี้รวมกัน (ไม่ใช่การตรวจทีละค่า) ทำให้สรุปได้ว่า P(n) จริงสำหรับจำนวนนับทุกตัว", "mf-k", "middle")
    return c.svg()


# ---------------------------------------------------------------- run
def main():
    force = "--all" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")] or sorted(
        glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True))
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
            print("updated", os.path.relpath(fpath, ROOT))
    missing = set()
    for fpath in files:
        for k in re.findall(r"<!--FIG:([\w-]+)--><!--/FIG-->", open(fpath, encoding="utf-8").read()):
            missing.add(k)
    if missing:
        print("empty figure blocks (owned by another script?):", ", ".join(sorted(missing)))


if __name__ == "__main__":
    main()
