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
