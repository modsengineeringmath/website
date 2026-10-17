# Static SVG figures for the multivariable & vector calculus series (/learn/multivariable-calculus/).
# Usage: python3 scripts/mv_figs.py            fills empty <!--FIG:mv-…--><!--/FIG--> blocks
#        python3 scripts/mv_figs.py --all      redraws every mv- figure
#        python3 scripts/mv_figs.py --preview out.html   writes all figures into one HTML file for visual checking
# Surfaces and curves are computed from their equations (nothing is hand-drawn); styling uses the .mf-* classes in assets/site.css
# so the figures follow light/dark mode. aria-labels carry the English terms for search and screen readers.
import glob, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}
PI = math.pi
COL = {"ink": "var(--ink-2)", "a": "var(--accent)", "s": "var(--signal)", "g": "var(--ok)"}


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


class C:
    def __init__(self, key, w, h, label):
        self.key, self.w, self.h, self.label, self.p = key, w, h, label, []

    def add(self, s):
        self.p.append(s)

    def svg(self):
        m = "".join(f'<marker id="{self.key}-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto">'
                    f'<path d="M0 0L10 5L0 10z" style="fill:{v}"/></marker>' for k, v in COL.items())
        lab = esc(self.label).replace('"', "&quot;")
        return f'<svg class="mf" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}"><defs>{m}</defs>' + "".join(self.p) + "</svg>"

    MK = {"mf-sig": "a", "mf-sig2": "s", "mf-sig3": "g"}

    def line(self, x1, y1, x2, y2, cls="mf-ax", arrow=None):
        mk = f' marker-end="url(#{self.key}-{self.MK.get(cls, "ink")})"' if arrow else ""
        self.add(f'<line class="{cls}" x1="{f1(x1)}" y1="{f1(y1)}" x2="{f1(x2)}" y2="{f1(y2)}"{mk}/>')

    def poly(self, pts, cls="mf-ax", close=False, arrow=None, fill=None):
        pts = [p for p in pts if p is not None]
        if len(pts) < 2:
            return
        d = "M" + " L".join(f"{f1(x)} {f1(y)}" for x, y in pts) + (" Z" if close else "")
        mk = f' marker-end="url(#{self.key}-{self.MK.get(cls, "ink")})"' if arrow else ""
        nf = "" if "fill" in cls else ' fill="none"'
        self.add(f'<path class="{cls}" d="{d}"{nf}{mk}/>')

    def segs(self, pts, cls):
        """polyline with None separators (gaps)"""
        cur = []
        for p in pts + [None]:
            if p is None:
                self.poly(cur, cls)
                cur = []
            else:
                cur.append(p)

    def circ(self, x, y, r, cls="mf-dot"):
        self.add(f'<circle class="{cls}" cx="{f1(x)}" cy="{f1(y)}" r="{f1(r)}"/>')

    def rect(self, x, y, w, h, cls="mf-box", rx=6):
        self.add(f'<rect class="{cls}" x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" rx="{rx}"/>')

    def text(self, x, y, s, cls="mf-t", a="start"):
        self.add(f'<text class="{cls}" x="{f1(x)}" y="{f1(y)}" text-anchor="{a}">{esc(s)}</text>')

    def title(self, x, y, s, a="middle"):
        self.text(x, y, s, "mf-h", a)


class P3:
    """oblique 3-D projection (azimuth az, elevation el) onto a panel at origin (ox, oy) with scale s"""

    def __init__(self, ox, oy, s, az=35, el=24):
        self.ox, self.oy, self.s = ox, oy, s
        self.ca, self.sa = math.cos(math.radians(az)), math.sin(math.radians(az))
        self.ce, self.se = math.cos(math.radians(el)), math.sin(math.radians(el))

    def __call__(self, x, y, z):
        xr = x * self.ca - y * self.sa
        yr = x * self.sa + y * self.ca
        return (self.ox + self.s * xr, self.oy - self.s * (z * self.ce + yr * self.se * 0.9))

    def axes(self, c, L=1.3, lab=("x", "y", "z")):
        o = self(0, 0, 0)
        for v, t in zip(((L, 0, 0), (0, L, 0), (0, 0, L)), lab):
            q = self(*v)
            c.line(o[0], o[1], q[0], q[1], "mf-ax", "ink")
            c.text(q[0] + 4, q[1] + 4, t, "mf-l")


def mesh(c, pr, f, xr, yr, nx=9, ny=9, cls="mf-thin", n=24):
    """wireframe of z = f(x, y)"""
    for i in range(nx):
        x = xr[0] + (xr[1] - xr[0]) * i / (nx - 1)
        c.poly([pr(x, yr[0] + (yr[1] - yr[0]) * j / n, f(x, yr[0] + (yr[1] - yr[0]) * j / n)) for j in range(n + 1)], cls)
    for k in range(ny):
        y = yr[0] + (yr[1] - yr[0]) * k / (ny - 1)
        c.poly([pr(xr[0] + (xr[1] - xr[0]) * j / n, y, f(xr[0] + (xr[1] - xr[0]) * j / n, y)) for j in range(n + 1)], cls)


def pmesh(c, pr, F, ur, vr, nu=10, nv=10, cls="mf-thin", n=28):
    """wireframe of a parametric surface F(u, v) -> (x, y, z)"""
    for i in range(nu):
        u = ur[0] + (ur[1] - ur[0]) * i / (nu - 1)
        c.poly([pr(*F(u, vr[0] + (vr[1] - vr[0]) * j / n)) for j in range(n + 1)], cls)
    for k in range(nv):
        v = vr[0] + (vr[1] - vr[0]) * k / (nv - 1)
        c.poly([pr(*F(ur[0] + (ur[1] - ur[0]) * j / n, v)) for j in range(n + 1)], cls)


def vsub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def vcross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def vlen(a): return math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2)
def vnorm(a):
    n = vlen(a)
    return (a[0] / n, a[1] / n, a[2] / n)
def vsc(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def vadd(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


class Plane2:
    """2-D panel mapping math coordinates to pixels"""

    def __init__(self, c, x, y, w, h, xr, yr, frame=True, grid=0):
        self.c, self.x, self.y, self.w, self.h, self.xr, self.yr = c, x, y, w, h, xr, yr
        if frame:
            c.rect(x, y, w, h, "mf-bg", 8)
        if grid:
            k = math.ceil(xr[0] / grid) * grid
            while k <= xr[1] + 1e-9:
                c.line(self.sx(k), y, self.sx(k), y + h, "mf-g"); k += grid
            k = math.ceil(yr[0] / grid) * grid
            while k <= yr[1] + 1e-9:
                c.line(x, self.sy(k), x + w, self.sy(k), "mf-g"); k += grid

    def sx(self, v): return self.x + (v - self.xr[0]) / (self.xr[1] - self.xr[0]) * self.w
    def sy(self, v): return self.y + (self.yr[1] - v) / (self.yr[1] - self.yr[0]) * self.h
    def __call__(self, a, b): return (self.sx(a), self.sy(b))

    def axes(self, lab=("x", "y")):
        c = self.c
        if self.xr[0] < 0 < self.xr[1] or True:
            ox = self.sx(0) if self.xr[0] < 0 < self.xr[1] else self.x
            oy = self.sy(0) if self.yr[0] < 0 < self.yr[1] else self.y + self.h
            c.line(self.x, oy, self.x + self.w, oy, "mf-ax", "ink")
            c.line(ox, self.y + self.h, ox, self.y, "mf-ax", "ink")
            c.text(self.x + self.w - 4, oy - 5, lab[0], "mf-l", "end")
            c.text(ox + 5, self.y + 12, lab[1], "mf-l")

    def clip(self, pts):
        """split a point list at points outside the panel"""
        out, cur = [], []
        for p in pts:
            if p is not None and self.xr[0] - 1e-9 <= p[0] <= self.xr[1] + 1e-9 and self.yr[0] - 1e-9 <= p[1] <= self.yr[1] + 1e-9:
                cur.append(self(*p))
            else:
                if cur:
                    out.append(cur)
                cur = []
        if cur:
            out.append(cur)
        return out

    def curve(self, pts, cls):
        for seg in self.clip(pts):
            self.c.poly(seg, cls)


def sample(fn, a, b, n=120):
    return [fn(a + (b - a) * i / n) for i in range(n + 1)]


# ============================================================================================ figures
@fig("mv-surface-contour")
def _():
    c = C("mvsc", 760, 330, "ผิวอานม้า z = x² − y² (saddle surface) และเส้นชั้นความสูง (contour map / level curves) เป็นไฮเพอร์โบลา")
    pr = P3(190, 195, 50, 40, 22)
    c.title(190, 24, "ผิวอานม้า (saddle) z = x² − y²")
    mesh(c, pr, lambda x, y: x * x - y * y, (-1.5, 1.5), (-1.5, 1.5), 11, 11, "mf-thin", 28)
    c.poly([pr(t, 0, t * t) for t in [-1.5 + 3 * i / 40 for i in range(41)]], "mf-sig")
    c.poly([pr(0, t, -t * t) for t in [-1.5 + 3 * i / 40 for i in range(41)]], "mf-sig3")
    pr.axes(c, 3.0)
    c.circ(*pr(0, 0, 0), 4)
    c.text(190, 322, "จุดอานม้า (saddle point) ที่ (0, 0)", "mf-k", "middle")
    pl = Plane2(c, 400, 40, 330, 260, (-2, 2), (-2, 2), grid=1)
    pl.axes()
    c.title(565, 24, "เส้นชั้นความสูง (contour map) x² − y² = c")
    n = 160
    for lev, cls in ((0.5, "mf-sig2"), (1.5, "mf-sig2"), (3, "mf-sig2")):
        for sg in (1, -1):
            pl.curve([(sg * math.sqrt(lev + y * y), y) for y in [-2 + 4 * i / n for i in range(n + 1)]], "mf-sig")
    for lev in (-0.5, -1.5, -3):
        for sg in (1, -1):
            pl.curve([(x, sg * math.sqrt(x * x - lev)) for x in [-2 + 4 * i / n for i in range(n + 1)]], "mf-sig2")
    pl.curve([(t, t) for t in (-2, 2)], "mf-dash")
    pl.curve([(t, -t) for t in (-2, 2)], "mf-dash")
    c.text(pl.sx(1.2) + 4, pl.sy(0.1) + 14, "c > 0", "mf-k")
    c.text(pl.sx(0.1) + 4, pl.sy(1.35), "c < 0", "mf-k")
    c.text(pl.sx(1.5), pl.sy(1.7), "c = 0", "mf-k")
    return c.svg()


def vadd2(p, dx, dy):
    return (p[0] + dx, p[1] + dy)


@fig("mv-quadrics")
def _():
    c = C("mvq", 780, 470, "ผิวกำลังสอง 6 แบบ (quadric surfaces): ellipsoid, elliptic paraboloid, hyperbolic paraboloid (saddle), cone, hyperboloid of one sheet, parabolic cylinder")
    cells = [
        ("ทรงรี (ellipsoid)", "x²/a² + y²/b² + z²/c² = 1", lambda u, v: (math.cos(v) * math.cos(u) * 1.0, math.cos(v) * math.sin(u) * 0.8, math.sin(v) * 0.6), (0, 2 * PI), (-PI / 2, PI / 2)),
        ("พาราโบลอยด์ทรงรี (elliptic paraboloid)", "z = x²/a² + y²/b²", lambda u, v: (v * math.cos(u), v * math.sin(u) * 0.8, v * v * 0.9 - 0.5), (0, 2 * PI), (0, 1)),
        ("อานม้า (hyperbolic paraboloid)", "z = x²/a² − y²/b²", lambda u, v: (u, v, 0.55 * (u * u - v * v)), (-1, 1), (-1, 1)),
        ("กรวย (cone)", "z² = x²/a² + y²/b²", lambda u, v: (v * math.cos(u), v * math.sin(u), v * 0.9), (0, 2 * PI), (-1, 1)),
        ("ไฮเพอร์โบลอยด์ 1 ตอน (one sheet)", "x²/a² + y²/b² − z²/c² = 1", lambda u, v: (math.sqrt(1 + v * v) * math.cos(u) * 0.8, math.sqrt(1 + v * v) * math.sin(u) * 0.8, v * 0.8), (0, 2 * PI), (-1, 1)),
        ("ทรงกระบอกพาราโบลา (parabolic cylinder)", "z = x²", lambda u, v: (u, v, 0.8 * u * u - 0.3), (-1, 1), (-1, 1)),
    ]
    for i, (t, eq, F, ur, vr) in enumerate(cells):
        cx, cy = 130 + 260 * (i % 3), 120 + 230 * (i // 3)
        pr = P3(cx, cy + 20, 62, 30, 24)
        pmesh(c, pr, F, ur, vr, 13 if ur[1] > 3 else 9, 8 if ur[1] > 3 else 9, "mf-thin", 40)
        if i in (1, 3):
            pass
        c.title(cx, cy - 92, t)
        c.text(cx, cy + 112, eq, "mf-k", "middle")
    return c.svg()


@fig("mv-limit-paths")
def _():
    c = C("mvlp", 700, 330, "หลายเส้นทางเข้าหาจุดกำเนิด (limit along paths): y = mx ให้ xy/(x²+y²) = m/(1+m²) ต่างกัน จึงไม่มีลิมิต (limit does not exist)")
    pl = Plane2(c, 20, 20, 360, 290, (-2, 2), (-1.6, 1.6), grid=1)
    pl.axes()
    for m, cls in ((0, "mf-sig3"), (0.5, "mf-sig2"), (1, "mf-sig"), (-1, "mf-sig"), (-0.5, "mf-sig2"), (3, "mf-s3")):
        pl.curve([(x, m * x) for x in (-2, 2)], cls)
    pl.curve([(x, x * x) for x in [-1.26 + 2.52 * i / 60 for i in range(61)]], "mf-dash")
    c.circ(*pl(0, 0), 5, "mf-zero")
    c.title(200, 14, "เส้นทางเข้าหา (0, 0)")
    labs = [("y = 0 (m = 0)", "0", "mf-sig3"), ("y = x (m = 1)", "1/2", "mf-sig"), ("y = −x (m = −1)", "−1/2", "mf-sig"), ("y = 0.5x", "2/5", "mf-sig2"), ("y = x² (พาราโบลา)", "0", "mf-dash")]
    c.rect(410, 40, 270, 36 + 30 * len(labs), "mf-box", 8)
    c.text(425, 62, "f = xy/(x²+y²) ตามแต่ละเส้นทาง", "mf-h")
    for i, (a, b, cl) in enumerate(labs):
        y = 92 + 30 * i
        c.line(425, y - 4, 455, y - 4, cl)
        c.text(463, y, a, "mf-t")
        c.text(670, y, "→ " + b, "mf-l", "end")
    c.text(425, 92 + 30 * len(labs) + 14, "ค่าไม่เท่ากัน ⇒ ไม่มีลิมิต (DNE)", "mf-h")
    return c.svg()


@fig("mv-gradient-contour")
def _():
    c = C("mvgc", 700, 330, "เกรเดียนต์ (gradient) ของ f = x² + 3y² ตั้งฉากกับเส้นชั้นความสูง (level curve) และชี้ทางขึ้นชันที่สุด")
    pl = Plane2(c, 20, 20, 660, 290, (-5, 5), (-2.2, 2.2), grid=1)
    pl.axes()
    for lev in (1, 4, 9, 16):
        pl.curve([(math.sqrt(lev) * math.cos(t), math.sqrt(lev / 3) * math.sin(t)) for t in [2 * PI * i / 120 for i in range(121)]], "mf-sig")
        c.text(pl.sx(math.sqrt(lev)) + 3, pl.sy(0) + 14, f"f = {lev}", "mf-k")
    for t in (20, 70, 120, 200, 250, 300):
        lev = 9
        x, y = math.sqrt(lev) * math.cos(math.radians(t)), math.sqrt(lev / 3) * math.sin(math.radians(t))
        gx, gy = 2 * x, 6 * y
        k = 0.22
        p0 = pl(x, y)
        c.circ(p0[0], p0[1], 3.5)
        c.line(p0[0], p0[1], p0[0] + gx * k * 30 / 6 * 1.0, p0[1] - gy * k * 30 / 6 * 1.0, "mf-sig2", "a")
    c.text(30, 40, "∇f = ⟨2x, 6y⟩", "mf-h")
    c.text(30, 58, "ลูกศรน้ำเงิน = ∇f (ชี้ทางที่ f เพิ่มเร็วที่สุด)", "mf-k")
    return c.svg()


@fig("mv-green")
def _():
    c = C("mvgr", 700, 320, "ทฤษฎีบทกรีน (Green's theorem): ผลรวมการหมุนวนของช่องเล็ก (circulation) หักล้างกันที่ขอบร่วม เหลือเฉพาะขอบนอก C วนทวนเข็มนาฬิกา")
    x0, y0, cw, ch, nx, ny = 70, 30, 70, 62, 5, 4
    c.rect(x0 - 4, y0 - 4, nx * cw + 8, ny * ch + 8, "mf-bg", 10)
    for i in range(nx):
        for j in range(ny):
            cx, cy = x0 + cw * (i + 0.5), y0 + ch * (j + 0.5)
            c.add(f'<path class="mf-sig3" d="M {f1(cx + 14)} {f1(cy)} A 14 14 0 1 0 {f1(cx)} {f1(cy + 14)}" marker-end="url(#mvgr-g)"/>')
    for i in range(nx + 1):
        c.line(x0 + i * cw, y0, x0 + i * cw, y0 + ny * ch, "mf-dash")
    for j in range(ny + 1):
        c.line(x0, y0 + j * ch, x0 + nx * cw, y0 + j * ch, "mf-dash")
    c.poly([(x0, y0 + ny * ch), (x0 + nx * cw, y0 + ny * ch), (x0 + nx * cw, y0), (x0, y0), (x0, y0 + ny * ch - 30)], "mf-sig2", False, "a")
    c.text(x0 + nx * cw + 22, 80, "C (ขอบนอก)", "mf-h")
    c.text(x0 + nx * cw + 22, 100, "วนทวนเข็มนาฬิกา", "mf-k")
    c.text(x0 + nx * cw + 22, 140, "∮_C P dx + Q dy", "mf-l")
    c.text(x0 + nx * cw + 22, 162, "= ∬_D (∂Q/∂x − ∂P/∂y) dA", "mf-l")
    c.text(x0 + nx * cw + 22, 196, "ขอบร่วมของช่องข้างเคียง", "mf-t")
    c.text(x0 + nx * cw + 22, 214, "มีลูกศรสวนทางกัน → หักล้าง", "mf-t")
    return c.svg()


@fig("mv-heat-flux")
def _():
    c = C("mvhf", 700, 330, "ฟลักซ์ความร้อน (heat flux) q = −k∇T ตั้งฉากกับเส้นอุณหภูมิเท่ากัน (isotherm) ไหลจากร้อนไปเย็น ท่อกลมร้อนรัศมี r₁")
    cx, cy = 230, 165
    for r, T in ((55, 120), (85, 90), (115, 70), (145, 55)):
        c.add(f'<circle class="mf-sig2" fill="none" cx="{cx}" cy="{cy}" r="{r}"/>')
        c.text(cx, cy - r + 13, f"{T}°C", "mf-k", "middle")
    c.circ(cx, cy, 30, "mf-fill")
    c.add(f'<circle class="mf-sig" fill="none" cx="{cx}" cy="{cy}" r="30"/>')
    c.text(cx, cy + 4, "ท่อร้อน", "mf-t", "middle")
    for k in range(12):
        a = 2 * PI * k / 12 + 0.26
        c.line(cx + 36 * math.cos(a), cy - 36 * math.sin(a), cx + 148 * math.cos(a), cy - 148 * math.sin(a), "mf-sig3", "g")
    c.rect(450, 50, 235, 210, "mf-box", 8)
    c.text(465, 76, "กฎการนำความร้อนของฟูริเยร์", "mf-h")
    c.text(465, 98, "Fourier's law", "mf-k")
    c.text(465, 130, "q = −k ∇T   [W/m²]", "mf-l")
    c.text(465, 160, "เส้นเขียว = ทิศ q (ร้อน → เย็น)", "mf-t")
    c.text(465, 182, "วงกลมน้ำเงิน = isotherm T คงที่", "mf-t")
    c.text(465, 214, "q ตั้งฉากกับ isotherm เสมอ", "mf-h")
    c.text(465, 236, "เพราะ ∇T ตั้งฉากกับเส้นชั้น", "mf-k")
    return c.svg()


@fig("mv-region-types")
def _():
    c = C("mvrt", 720, 330, "บริเวณ type I (vertical strips) และ type II (horizontal strips) ของบริเวณเดียวกันระหว่าง y = x² กับ y = x ใช้สลับลำดับการอินทิเกรต (change order of integration)")
    for k, (ox, ttl) in enumerate(((20, "type I: แถบแนวตั้ง  g₁(x) ≤ y ≤ g₂(x)"), (380, "type II: แถบแนวนอน  h₁(y) ≤ x ≤ h₂(y)"))):
        pl = Plane2(c, ox, 40, 320, 260, (-0.1, 1.15), (-0.1, 1.15), grid=0.25)
        pl.axes()
        c.title(ox + 160, 28, ttl)
        up = [(t, t) for t in [i / 40 for i in range(41)]]
        lo = [(t, t * t) for t in [i / 40 for i in range(41)]]
        region = [pl(*p) for p in lo] + [pl(*p) for p in reversed(up)]
        c.poly(region, "mf-fill", True)
        if k == 0:
            for xx in [0.1 * i for i in range(1, 10)]:
                c.line(*pl(xx, xx * xx), *pl(xx, xx), "mf-sig2")
        else:
            for yy in [0.1 * i for i in range(1, 10)]:
                c.line(*pl(yy, yy), *pl(math.sqrt(yy), yy), "mf-sig2")
        pl.curve(lo, "mf-sig")
        pl.curve(up, "mf-sig")
        c.text(*pl(0.62, 0.3), "y = x²", "mf-l") if k == 0 else c.text(*pl(0.7, 0.34), "x = √y", "mf-l")
        c.text(*pl(0.28, 0.5), "y = x" if k == 0 else "x = y", "mf-l")
    c.text(30, 322, "∫₀¹ ∫ f dy dx   (y: x² → x)", "mf-l")
    c.text(390, 322, "∫₀¹ ∫ f dx dy   (x: y → √y)", "mf-l")
    return c.svg()


@fig("mv-polar-element")
def _():
    c = C("mvpe", 700, 330, "ช่องเล็กในพิกัดขั้ว (polar rectangle): พื้นที่ ΔA ≈ r Δr Δθ ที่มาของตัวคูณ r ใน dA = r dr dθ (polar coordinates area element)")
    ox, oy, s = 70, 290, 1.0
    c.line(ox - 20, oy, ox + 330, oy, "mf-ax", "ink")
    c.line(ox, oy + 20, ox, oy - 270, "mf-ax", "ink")
    c.text(ox + 326, oy + 16, "x", "mf-l")
    c.text(ox + 8, oy - 262, "y", "mf-l")
    r1, r2, t1, t2 = 150, 215, math.radians(28), math.radians(58)
    def P(r, t): return (ox + r * math.cos(t), oy - r * math.sin(t))
    for r in (r1, r2):
        pts = [P(r, t1 + (t2 - t1) * i / 30) for i in range(31)]
        c.poly(pts, "mf-sig")
    arc = [P(r1, t1 + (t2 - t1) * i / 30) for i in range(31)] + [P(r2, t2 - (t2 - t1) * i / 30) for i in range(31)]
    c.poly(arc, "mf-fill", True)
    for t in (t1, t2):
        c.line(*P(0, t), *P(r2 + 25, t), "mf-dash")
    c.add(f'<path class="mf-ax" fill="none" d="M {f1(ox + 55)} {f1(oy)} A 55 55 0 0 0 {f1(P(55, t1)[0])} {f1(P(55, t1)[1])}"/>')
    c.text(ox + 62, oy - 8, "θ", "mf-l")
    c.line(*P(r1, (t1 + t2) / 2 - 0.0), *P(r2, (t1 + t2) / 2), "mf-sig2", "a")
    mid = (t1 + t2) / 2
    c.text(*vadd2(P((r1 + r2) / 2, mid), 14, 22), "Δr", "mf-l")
    c.text(*vadd2(P(r2, mid), 8, -22), "r Δθ", "mf-l")
    c.text(*vadd2(P(r2 + 25, t2), 6, -4), "θ + Δθ", "mf-k")
    c.text(*vadd2(P(r2 + 25, t1), 6, 0), "θ", "mf-k")
    c.rect(400, 60, 270, 150, "mf-box", 8)
    c.text(415, 86, "ความกว้าง  Δr", "mf-t")
    c.text(415, 110, "ความยาวของส่วนโค้ง  r Δθ", "mf-t")
    c.text(415, 140, "ΔA ≈ r Δr Δθ", "mf-h")
    c.text(415, 168, "⇒ dA = r dr dθ", "mf-h")
    c.text(415, 192, "ตัวคูณ r = จาโคเบียนของ (r, θ)", "mf-k")
    return c.svg()


@fig("mv-coord-systems")
def _():
    c = C("mvcs", 760, 340, "พิกัดทรงกระบอก (cylindrical coordinates r, θ, z) และพิกัดทรงกลม (spherical coordinates ρ, φ, θ) เทียบกับพิกัดฉาก (x, y, z)")
    # cylindrical
    pr = P3(190, 270, 120, 35, 22)
    c.title(190, 24, "ทรงกระบอก (cylindrical)")
    pr.axes(c, 1.45)
    r, th, z = 1.0, math.radians(50), 0.95
    P = pr(r * math.cos(th), r * math.sin(th), z); Q = pr(r * math.cos(th), r * math.sin(th), 0); O = pr(0, 0, 0)
    c.line(*Q, *P, "mf-dash")
    c.line(*O, *Q, "mf-sig2", "a")
    c.line(*O, *P, "mf-thin")
    c.poly([pr(0.4 * math.cos(a), 0.4 * math.sin(a), 0) for a in [th * i / 20 for i in range(21)]], "mf-sig")
    c.circ(*P, 4.5)
    c.text(*vadd2(P, 8, -4), "P (r, θ, z)", "mf-l")
    c.text(*vadd2(Q, 6, 16), "r", "mf-l")
    c.text(*vadd2(pr(0.55, 0.15, 0), 0, 14), "θ", "mf-l")
    c.text(*vadd2(pr(r * math.cos(th), r * math.sin(th), z / 2), 8, 0), "z", "mf-l")
    c.text(190, 330, "x = r cos θ,  y = r sin θ,  dV = r dr dθ dz", "mf-k", "middle")
    # spherical
    pr = P3(570, 270, 120, 35, 22)
    c.title(570, 24, "ทรงกลม (spherical)")
    pr.axes(c, 1.45)
    rho, ph, th = 1.15, math.radians(40), math.radians(50)
    Pp = (rho * math.sin(ph) * math.cos(th), rho * math.sin(ph) * math.sin(th), rho * math.cos(ph))
    P = pr(*Pp); Q = pr(Pp[0], Pp[1], 0); O = pr(0, 0, 0)
    c.line(*Q, *P, "mf-dash")
    c.line(*O, *Q, "mf-dash")
    c.line(*O, *P, "mf-sig2", "a")
    c.poly([pr(0.45 * math.sin(a) * math.cos(th), 0.45 * math.sin(a) * math.sin(th), 0.45 * math.cos(a)) for a in [ph * i / 20 for i in range(21)]], "mf-sig")
    c.poly([pr(0.4 * math.cos(a), 0.4 * math.sin(a), 0) for a in [th * i / 20 for i in range(21)]], "mf-sig")
    c.circ(*P, 4.5)
    c.text(*vadd2(P, 8, -4), "P (ρ, φ, θ)", "mf-l")
    c.text(*vadd2(pr(Pp[0] / 2, Pp[1] / 2, Pp[2] / 2), -22, 2), "ρ", "mf-l")
    c.text(*vadd2(pr(0.1, 0.1, 0.55), 6, 0), "φ", "mf-l")
    c.text(*vadd2(pr(0.55, 0.15, 0), 0, 14), "θ", "mf-l")
    c.text(570, 330, "x = ρ sin φ cos θ,  dV = ρ² sin φ dρ dφ dθ", "mf-k", "middle")
    return c.svg()


@fig("mv-jacobian-cell")
def _():
    c = C("mvjc", 760, 330, "จาโคเบียน (Jacobian): ช่องเล็ก Δu×Δv ถูกแปลงเป็นสี่เหลี่ยมด้านขนาน พื้นที่คูณด้วย |det J| (change of variables)")
    pu = Plane2(c, 20, 40, 300, 250, (0, 3), (0, 2.5), grid=0.5)
    pu.axes(("u", "v"))
    c.title(170, 28, "ระนาบ (u, v)")
    u0, v0, du, dv = 0.9, 0.6, 1.3, 1.0
    c.poly([pu(u0, v0), pu(u0 + du, v0), pu(u0 + du, v0 + dv), pu(u0, v0 + dv)], "mf-fill", True)
    c.poly([pu(u0, v0), pu(u0 + du, v0), pu(u0 + du, v0 + dv), pu(u0, v0 + dv)], "mf-sig", True)
    c.text(*vadd2(pu(u0 + du / 2, v0), -6, 16), "Δu", "mf-l")
    c.text(*vadd2(pu(u0, v0 + dv / 2), -24, 4), "Δv", "mf-l")
    c.text(*vadd2(pu(u0 + du / 2, v0 + dv / 2), -22, 4), "ΔA′", "mf-k")
    px = Plane2(c, 400, 40, 340, 250, (-0.5, 3.0), (-0.3, 2.4), grid=0.5)
    px.axes(("x", "y"))
    c.title(570, 28, "ระนาบ (x, y)  x = x(u, v),  y = y(u, v)")
    def F(u, v):  # a smooth non-linear map
        return (0.9 * u + 0.45 * v + 0.12 * u * v - 0.3, 0.55 * v + 0.08 * u * u + 0.2 * u * v + 0.15 * u - 0.1)
    n = 14
    cell = []
    for i in range(n + 1): cell.append(F(u0 + du * i / n, v0))
    for j in range(n + 1): cell.append(F(u0 + du, v0 + dv * j / n))
    for i in range(n + 1): cell.append(F(u0 + du * (n - i) / n, v0 + dv))
    for j in range(n + 1): cell.append(F(u0, v0 + dv * (n - j) / n))
    c.poly([px(*p) for p in cell], "mf-fill2", True)
    c.poly([px(*p) for p in cell], "mf-sig2", True)
    h = 1e-5
    A = F(u0, v0)
    Fu = ((F(u0 + h, v0)[0] - A[0]) / h, (F(u0 + h, v0)[1] - A[1]) / h)
    Fv = ((F(u0, v0 + h)[0] - A[0]) / h, (F(u0, v0 + h)[1] - A[1]) / h)
    B = (A[0] + Fu[0] * du, A[1] + Fu[1] * du)
    D = (A[0] + Fv[0] * dv, A[1] + Fv[1] * dv)
    E = (B[0] + Fv[0] * dv, B[1] + Fv[1] * dv)
    c.poly([px(*A), px(*B), px(*E), px(*D)], "mf-dash", True)
    c.line(*px(*A), *px(*B), "mf-sig", "s")
    c.line(*px(*A), *px(*D), "mf-sig3", "g")
    c.text(*vadd2(px(*B), -30, 18), "r_u Δu", "mf-l")
    c.text(*vadd2(px(*D), -44, 6), "r_v Δv", "mf-l")
    c.text(570, 315, "ΔA ≈ |det J| Δu Δv,   J = ∂(x, y)/∂(u, v)", "mf-h", "middle")
    return c.svg()


@fig("mv-critical-types")
def _():
    c = C("mvct", 780, 420, "จุดวิกฤตสามชนิด (critical points): ต่ำสุดสัมพัทธ์ local minimum, สูงสุดสัมพัทธ์ local maximum และจุดอานม้า saddle point พร้อมเส้นชั้นความสูง")
    cases = [("ต่ำสุดสัมพัทธ์ (local min)", lambda x, y: 0.7 * (x * x + y * y) - 0.4, "D > 0,  f_xx > 0", "circ"),
             ("สูงสุดสัมพัทธ์ (local max)", lambda x, y: -0.7 * (x * x + y * y) + 0.4, "D > 0,  f_xx < 0", "circ"),
             ("จุดอานม้า (saddle)", lambda x, y: 0.7 * (x * x - y * y), "D < 0", "hyp")]
    for i, (t, f, cond, kind) in enumerate(cases):
        cx = 130 + 260 * i
        pr = P3(cx, 135, 50, 35, 24)
        c.title(cx, 22, t)
        mesh(c, pr, f, (-1.2, 1.2), (-1.2, 1.2), 9, 9, "mf-thin", 24)
        c.circ(*pr(0, 0, f(0, 0)), 4.5)
        pl = Plane2(c, cx - 80, 215, 160, 140, (-1.2, 1.2), (-1.2, 1.2), grid=0.6)
        if kind == "circ":
            for rr in (0.3, 0.6, 0.9, 1.15):
                pl.curve([(rr * math.cos(a), rr * math.sin(a)) for a in [2 * PI * k / 80 for k in range(81)]], "mf-sig")
        else:
            for lev in (0.2, 0.6, 1.0):
                for sg in (1, -1):
                    pl.curve([(sg * math.sqrt(lev + y * y), y) for y in [-1.2 + 2.4 * k / 80 for k in range(81)]], "mf-sig")
                    pl.curve([(x, sg * math.sqrt(x * x + lev)) for x in [-1.2 + 2.4 * k / 80 for k in range(81)]], "mf-sig2")
            pl.curve([(-1.2, -1.2), (1.2, 1.2)], "mf-dash"); pl.curve([(-1.2, 1.2), (1.2, -1.2)], "mf-dash")
        c.circ(*pl(0, 0), 3.5)
        c.text(cx, 382, cond, "mf-l", "middle")
    c.text(390, 408, "D = f_xx f_yy − (f_xy)²   (ทดสอบอนุพันธ์อันดับสอง · second derivative test)", "mf-k", "middle")
    return c.svg()


@fig("mv-lagrange-tangent")
def _():
    c = C("mvlt", 700, 340, "ตัวคูณลากรองจ์ (Lagrange multiplier): เส้นชั้นของ f สัมผัสเส้นเงื่อนไข g = c ที่จุดเหมาะสมที่สุด จึง ∇f ขนานกับ ∇g")
    pl = Plane2(c, 20, 20, 400, 300, (-2.2, 2.2), (-1.65, 1.65), grid=1)
    pl.axes()
    circle = [(math.cos(a), math.sin(a)) for a in [2 * PI * k / 160 for k in range(161)]]
    pl.curve(circle, "mf-sig3")
    for lev, cl in ((0.5, "mf-sig"), (1, "mf-sig"), (1.5, "mf-sig"), (2, "mf-sig2"), (3, "mf-sig")):
        pl.curve([(math.sqrt(lev) * math.cos(a), math.sqrt(lev / 2) * math.sin(a)) for a in [2 * PI * k / 160 for k in range(161)]], cl)
    for (x, y) in ((1, 0), (0, 1)):
        p = pl(x, y)
        c.circ(*p, 4.5)
        gf = (2 * x, 4 * y); gg = (2 * x, 2 * y)
        k = 13
        off = 4 if x == 1 else 0
        offx = 4 if y == 1 else 0
        c.line(p[0] + offx, p[1] - off, p[0] + offx + gf[0] * k, p[1] - off - gf[1] * k, "mf-sig2", "a")
        c.line(p[0] - offx, p[1] + off, p[0] - offx + gg[0] * k, p[1] + off - gg[1] * k, "mf-sig3", "a")
    c.text(pl.sx(2.1), pl.sy(-1.5), "∇f (น้ำเงิน) ∥ ∇g (เขียว)", "mf-k", "end")
    c.rect(440, 40, 240, 190, "mf-box", 8)
    c.text(455, 66, "max/min f = x² + 2y²", "mf-h")
    c.text(455, 88, "เมื่อ g = x² + y² = 1", "mf-h")
    c.text(455, 120, "∇f = λ ∇g,   g = 1", "mf-l")
    c.text(455, 152, "เขียว = เส้นเงื่อนไข g = 1", "mf-t")
    c.text(455, 174, "น้ำเงิน-ส้ม = เส้นชั้นของ f", "mf-t")
    c.text(455, 204, "ที่จุดสัมผัส ทิศ ∇f // ∇g", "mf-k")
    return c.svg()


@fig("mv-partial-slices")
def _():
    c = C("mvps", 700, 340, "อนุพันธ์ย่อย (partial derivatives): f_x คือความชันของรอยตัดผิวด้วยระนาบ y = b, f_y คือความชันของรอยตัดด้วยระนาบ x = a")
    f = lambda x, y: 1.4 - 0.22 * x * x - 0.2 * y * y + 0.12 * x * y
    fx = lambda x, y: -0.44 * x + 0.12 * y
    fy = lambda x, y: -0.4 * y + 0.12 * x
    pr = P3(250, 270, 80, 30, 22)
    mesh(c, pr, f, (-1.6, 1.6), (-1.6, 1.6), 9, 9, "mf-thin", 24)
    a, b = 0.5, 0.4
    c.poly([pr(t, b, f(t, b)) for t in [-1.6 + 3.2 * i / 40 for i in range(41)]], "mf-sig")
    c.poly([pr(a, t, f(a, t)) for t in [-1.6 + 3.2 * i / 40 for i in range(41)]], "mf-sig3")
    z0 = f(a, b)
    c.line(*pr(a - 0.8, b, z0 - 0.8 * fx(a, b)), *pr(a + 0.8, b, z0 + 0.8 * fx(a, b)), "mf-sig2")
    c.line(*pr(a, b - 0.8, z0 - 0.8 * fy(a, b)), *pr(a, b + 0.8, z0 + 0.8 * fy(a, b)), "mf-sig2")
    c.circ(*pr(a, b, z0), 4.5)
    c.line(*pr(a, b, z0), *pr(a, b, 0), "mf-dash")
    pr.axes(c, 1.9)
    c.text(*vadd2(pr(a, b, z0), 8, -8), "P (a, b, f(a, b))", "mf-l")
    c.rect(455, 40, 235, 210, "mf-box", 8)
    c.text(470, 66, "ตัดด้วยระนาบ y = b", "mf-h")
    c.text(470, 86, "(เส้นส้ม) ความชัน = f_x(a, b)", "mf-t")
    c.text(470, 118, "ตัดด้วยระนาบ x = a", "mf-h")
    c.text(470, 138, "(เส้นเขียว) ความชัน = f_y(a, b)", "mf-t")
    c.text(470, 170, "เส้นสัมผัส (น้ำเงิน) ของแต่ละรอยตัด", "mf-t")
    c.text(470, 192, "คือเส้นที่อยู่บนระนาบสัมผัส", "mf-t")
    c.text(470, 226, "z ≈ f + f_x dx + f_y dy", "mf-l")
    return c.svg()


@fig("mv-chain-tree")
def _():
    c = C("mvct2", 700, 340, "แผนภาพต้นไม้ของกฎลูกโซ่ (chain rule tree diagram): z = f(x, y), x = x(s, t), y = y(s, t)")
    def node(x, y, s):
        c.rect(x - 22, y - 18, 44, 36, "mf-box", 18)
        c.text(x, y + 5, s, "mf-h", "middle")
    z, x, y = (260, 40), (140, 140), (380, 140)
    ls, lt, rs, rt = (70, 255), (210, 255), (310, 255), (450, 255)
    # edges
    edges = [(z, x, "∂z/∂x", "mf-sig"), (z, y, "∂z/∂y", "mf-sig"), (x, ls, "∂x/∂s", "mf-sig2"), (x, lt, "∂x/∂t", "mf-sig"), (y, rs, "∂y/∂s", "mf-sig2"), (y, rt, "∂y/∂t", "mf-sig")]
    for (a, b, lab, cl) in edges:
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy)
        c.line(a[0] + dx / d * 22, a[1] + dy / d * 20, b[0] - dx / d * 22, b[1] - dy / d * 20, cl)
        c.text((a[0] + b[0]) / 2 + (-10 if dx < 0 else 10), (a[1] + b[1]) / 2, lab, "mf-l", "end" if dx < 0 else "start")
    node(*z, "z"); node(*x, "x"); node(*y, "y")
    for p, s in ((ls, "s"), (lt, "t"), (rs, "s"), (rt, "t")):
        node(*p, s)
    c.text(520, 70, "∂z/∂s = ∂z/∂x · ∂x/∂s", "mf-l")
    c.text(556, 92, "+ ∂z/∂y · ∂y/∂s", "mf-l")
    c.text(520, 130, "∂z/∂t = ∂z/∂x · ∂x/∂t", "mf-l")
    c.text(556, 152, "+ ∂z/∂y · ∂y/∂t", "mf-l")
    c.text(520, 200, "เดินจาก z ลงถึง s ทุกเส้นทาง", "mf-t")
    c.text(520, 220, "คูณตามกิ่ง แล้วรวมทุกเส้นทาง", "mf-t")
    return c.svg()


@fig("mv-surface-param")
def _():
    c = C("mvsp", 700, 340, "ผิวพารามิเตอร์ (parametric surface) r(u, v): เวกเตอร์สัมผัส r_u, r_v และเวกเตอร์ปกติ r_u × r_v ขนาดเท่าพื้นที่ dS")
    F = lambda u, v: (u, v, 0.35 * math.sin(1.3 * u) + 0.25 * math.cos(1.1 * v) + 0.2)
    pr = P3(260, 230, 85, 30, 24)
    pmesh(c, pr, F, (-1.6, 1.6), (-1.6, 1.6), 11, 11, "mf-thin", 30)
    u0, v0, du, dv = 0.2, 0.0, 0.6, 0.6
    h = 1e-5
    A = F(u0, v0)
    ru = vsc(vsub(F(u0 + h, v0), A), 1 / h); rv = vsc(vsub(F(u0, v0 + h), A), 1 / h)
    cell = [F(u0 + du * i / 10, v0) for i in range(11)] + [F(u0 + du, v0 + dv * j / 10) for j in range(11)] + [F(u0 + du * (10 - i) / 10, v0 + dv) for i in range(11)] + [F(u0, v0 + dv * (10 - j) / 10) for j in range(11)]
    c.poly([pr(*p) for p in cell], "mf-fill", True)
    c.poly([pr(*p) for p in cell], "mf-sig", True)
    c.line(*pr(*A), *pr(*vadd(A, vsc(ru, 0.9))), "mf-sig2", "a")
    c.line(*pr(*A), *pr(*vadd(A, vsc(rv, 0.9))), "mf-sig3", "g")
    n = vnorm(vcross(ru, rv))
    c.line(*pr(*A), *pr(*vadd(A, vsc(n, 0.9))), "mf-sig", "s")
    c.circ(*pr(*A), 4)
    c.text(*vadd2(pr(*vadd(A, vsc(ru, 0.9))), 6, 14), "r_u", "mf-l")
    c.text(*vadd2(pr(*vadd(A, vsc(rv, 0.9))), -22, -2), "r_v", "mf-l")
    c.text(*vadd2(pr(*vadd(A, vsc(n, 0.9))), 8, -2), "n = r_u × r_v", "mf-l")
    c.rect(455, 40, 235, 230, "mf-box", 8)
    c.text(470, 66, "พื้นที่ผิว", "mf-h")
    c.text(470, 94, "dS = |r_u × r_v| du dv", "mf-l")
    c.text(470, 128, "ฟลักซ์ผ่านผิว", "mf-h")
    c.text(470, 156, "∬ F·n dS", "mf-l")
    c.text(470, 178, "= ∬ F·(r_u × r_v) du dv", "mf-l")
    c.text(470, 214, "ผิวกราฟ z = f(x, y):", "mf-k")
    c.text(470, 234, "r_u × r_v = ⟨−f_x, −f_y, 1⟩", "mf-k")
    return c.svg()


@fig("mv-gauss-stokes")
def _():
    c = C("mvgs", 760, 330, "ทฤษฎีบทดีเวอร์เจนซ์ของเกาส์ (divergence theorem: ผิวปิด S ล้อมปริมาตร E) เทียบกับทฤษฎีบทสโตกส์ (Stokes' theorem: ผิวเปิด S ที่มีขอบ C)")
    # Gauss
    cx, cy = 190, 175
    c.title(190, 26, "Gauss: ผิวปิด S = ∂E")
    pts = [(cx + 105 * math.cos(a) * (1 + 0.1 * math.cos(3 * a)), cy + 80 * math.sin(a) * (1 + 0.1 * math.sin(2 * a))) for a in [2 * PI * k / 80 for k in range(81)]]
    c.poly(pts, "mf-fill", True)
    c.poly(pts, "mf-sig", True)
    for k in range(10):
        a = 2 * PI * k / 10 + 0.3
        x, y = cx + 105 * math.cos(a) * (1 + 0.1 * math.cos(3 * a)), cy + 80 * math.sin(a) * (1 + 0.1 * math.sin(2 * a))
        c.line(x, y, x + 30 * math.cos(a), y + 30 * math.sin(a), "mf-sig2", "a")
    c.text(cx, cy + 4, "E", "mf-h", "middle")
    c.text(cx + 128, cy - 80, "n ชี้ออก", "mf-k")
    c.text(190, 308, "∯_S F·n dS = ∭_E ∇·F dV", "mf-h", "middle")
    # Stokes
    cx, cy = 570, 120
    c.title(570, 26, "Stokes: ผิวเปิด S ขอบ C")
    rim = [(cx + 110 * math.cos(a), cy - 30 * math.sin(a)) for a in [2 * PI * k / 80 for k in range(81)]]
    low = [(cx + 110 * math.cos(a), cy + 100 * math.sin(a)) for a in [PI * k / 40 for k in range(41)]]
    front = [(cx + 110 * math.cos(a), cy + 30 * math.sin(a)) for a in [PI * k / 40 for k in range(41)]]
    c.poly(low + front[::-1], "mf-fill2", True)
    c.poly(low, "mf-sig")
    c.poly(rim, "mf-sig2", True)
    c.line(cx + 30, cy - 29, cx + 8, cy - 29.8, "mf-sig2", "a")
    c.text(cx + 120, cy - 20, "C", "mf-h")
    c.text(cx - 6, cy + 100, "S", "mf-h", "middle")
    c.line(cx - 50, cy + 80, cx - 50, cy + 30, "mf-sig3", "g")
    c.text(cx - 44, cy + 56, "n", "mf-l")
    c.text(570, 290, "ทิศวน C สัมพันธ์กับ n ตามกฎมือขวา", "mf-k", "middle")
    c.text(570, 312, "∮_C F·dr = ∬_S (∇×F)·n dS", "mf-h", "middle")
    return c.svg()


@fig("mv-div-curl")
def _():
    c = C("mvdc", 780, 330, "ดีเวอร์เจนซ์และเคิร์ลของสนามเวกเตอร์ 2 มิติ (divergence and curl): สนามแผ่ออก F = (x, y) สนามหมุนวน F = (−y, x) สนามเฉือน F = (y, 0)")
    cases = [("แผ่ออก (source)", lambda x, y: (x, y), "div F = 2,  curl F = 0"),
             ("หมุนวน (rotation)", lambda x, y: (-y, x), "div F = 0,  curl F = 2"),
             ("เฉือน (shear)", lambda x, y: (y, 0), "div F = 0,  curl F = −1")]
    for i, (t, F, d) in enumerate(cases):
        pl = Plane2(c, 12 + 255 * i, 40, 240, 220, (-2, 2), (-2, 2))
        c.title(pl.x + 120, 28, t)
        for gx in [-1.6 + 0.8 * a for a in range(5)]:
            for gy in [-1.6 + 0.8 * b for b in range(5)]:
                u, v = F(gx, gy)
                m = math.hypot(u, v)
                if m < 1e-9:
                    continue
                L = 0.32 * min(1.0, m / 1.6) + 0.1
                p, q = pl(gx, gy), pl(gx + u / m * L, gy + v / m * L)
                c.line(*p, *q, "mf-sig", "s")
        o = pl(0.0, 0.0)
        c.circ(o[0], o[1], 7, "mf-box")
        if i == 1:
            c.add(f'<path class="mf-sig2" fill="none" d="M {f1(o[0] + 18)} {f1(o[1])} A 18 18 0 1 0 {f1(o[0])} {f1(o[1] - 18)}" marker-end="url(#mvdc-a)"/>')
        if i == 2:
            c.add(f'<path class="mf-sig2" fill="none" d="M {f1(o[0] - 16)} {f1(o[1] - 4)} A 18 18 0 0 1 {f1(o[0] + 16)} {f1(o[1] - 4)}" marker-end="url(#mvdc-a)"/>')
        c.text(pl.x + 120, 284, d, "mf-l", "middle")
    c.text(390, 318, "ใบพัดเล็ก (paddle wheel) หมุนเมื่อ curl ≠ 0 · ฟองสบู่พองเมื่อ div > 0", "mf-k", "middle")
    return c.svg()


@fig("mv-frenet")
def _():
    c = C("mvfr", 700, 360, "กรอบ Frenet–Serret (Frenet frame) บนเส้นโค้งเกลียว: เวกเตอร์สัมผัส T, normal N, binormal B และวงกลมออสคิวเลติง (osculating circle) รัศมี 1/κ")
    pr = P3(260, 300, 95, 28, 20)
    r = lambda t: (math.cos(t), math.sin(t), 0.2 * t)
    c.poly([pr(*r(t)) for t in [-1.0 + 14 * i / 200 for i in range(201)]], "mf-sig")
    t0 = 3.6
    P = r(t0)
    T = vnorm((-math.sin(t0), math.cos(t0), 0.2))
    N = (-math.cos(t0), -math.sin(t0), 0.0)
    B = vcross(T, N)
    c.circ(*pr(*P), 4.5)
    for v, lab, cl, ar in ((T, "T", "mf-sig2", "a"), (N, "N", "mf-sig3", "g"), (B, "B", "mf-sig", "s")):
        c.line(*pr(*P), *pr(*vadd(P, vsc(v, 0.8))), cl, ar)
        c.text(*vadd2(pr(*vadd(P, vsc(v, 0.8))), 6, 4), lab, "mf-h")
    kappa = 1 / (1 + 0.04)
    R = 1 / kappa
    Cc = vadd(P, vsc(N, R))
    c.poly([pr(*vadd(Cc, vadd(vsc(vsc(N, -1), R * math.cos(a)), vsc(T, R * math.sin(a))))) for a in [2 * PI * k / 60 for k in range(61)]], "mf-dash", True)
    c.rect(455, 60, 235, 200, "mf-box", 8)
    c.text(470, 86, "r(t) = ⟨cos t, sin t, 0.2t⟩", "mf-l")
    c.text(470, 114, "T = r′/|r′|  (สัมผัส)", "mf-t")
    c.text(470, 136, "N = T′/|T′|  (ชี้เข้าหาโค้ง)", "mf-t")
    c.text(470, 158, "B = T × N  (ตั้งฉากระนาบ)", "mf-t")
    c.text(470, 188, "κ = |T′|/|r′|  ความโค้ง", "mf-t")
    c.text(470, 210, "R = 1/κ  รัศมีออสคิวเลติง", "mf-t")
    c.text(470, 236, "วงกลมประ = osculating circle", "mf-k")
    return c.svg()


@fig("mv-terrain-cutfill")
def _():
    c = C("mvtf", 720, 320, "หน้าตัดดินขุด-ถม (cut and fill): พื้นดินเดิม h(x) เทียบกับระดับออกแบบ z₀ ส่วนที่สูงกว่าคือดินขุด (cut) ส่วนที่ต่ำกว่าคือดินถม (fill)")
    pl = Plane2(c, 50, 30, 640, 240, (0, 10), (3, 9))
    h = lambda x: 6 + 1.7 * math.sin(0.62 * x + 0.4) + 0.35 * math.sin(1.9 * x)
    z0 = 6.2
    xs = [10 * i / 200 for i in range(201)]
    c.poly([pl(0, z0)] + [pl(x, max(h(x), z0)) for x in xs] + [pl(10, z0)], "mf-fill", True)
    c.poly([pl(0, z0)] + [pl(x, min(h(x), z0)) for x in xs] + [pl(10, z0)], "mf-fill2", True)
    c.line(*pl(0, z0), *pl(10, z0), "mf-dash")
    c.poly([pl(x, h(x)) for x in xs], "mf-ink")
    c.line(50, 270, 690, 270, "mf-ax", "ink")
    c.text(694, 268, "x", "mf-l")
    c.text(56, z0 and pl(0, z0)[1] - 6, "ระดับออกแบบ z₀", "mf-l")
    # label regions
    def mid(cond):
        best, bx = -1, 0
        for x in xs:
            d = abs(h(x) - z0)
            if cond(h(x) - z0) and d > best:
                best, bx = d, x
        return bx
    xc, xf = mid(lambda d: d > 0), mid(lambda d: d < 0)
    c.text(pl.sx(xc), pl.sy((h(xc) + z0) / 2), "ขุด (cut)", "mf-h", "middle")
    c.text(pl.sx(xf), pl.sy((h(xf) + z0) / 2), "ถม (fill)", "mf-h", "middle")
    c.text(370, 300, "V_cut = ∬ max(h − z₀, 0) dA,   V_fill = ∬ max(z₀ − h, 0) dA", "mf-l", "middle")
    return c.svg()


# ============================================================================================ driver
def main():
    force = "--all" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")] or sorted(glob.glob(os.path.join(ROOT, "src/pages/learn/multivariable-calculus/*.html")))
    cache, missing = {}, set()
    for fpath in files:
        src = open(fpath, encoding="utf-8").read()

        def rep(m):
            key, body = m.group(1), m.group(2)
            if not key.startswith("mv-"):
                return m.group(0)
            if key not in FIGS:
                missing.add(key)
                return m.group(0)
            if body and not force:
                return m.group(0)
            if key not in cache:
                cache[key] = FIGS[key]()
            return f"<!--FIG:{key}-->" + cache[key] + "<!--/FIG-->"
        out = re.sub(r"<!--FIG:([\w-]+)-->(<svg[\s\S]*?</svg>)?<!--/FIG-->", rep, src)
        if out != src:
            open(fpath, "w", encoding="utf-8").write(out)
            print("updated", os.path.relpath(fpath, ROOT))
    if missing:
        print("unknown mv- keys:", ", ".join(sorted(missing)))


if __name__ == "__main__":
    if "--preview" in sys.argv:
        out = ['<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/assets/site.css"><body style="padding:20px;background:var(--paper)">']
        for k in sorted(FIGS):
            out.append(f'<h3 style="font:14px monospace">{k}</h3><figure class="lt-wide" style="max-width:820px">{FIGS[k]()}</figure>')
        open(sys.argv[sys.argv.index("--preview") + 1], "w", encoding="utf-8").write("".join(out))
    else:
        main()
