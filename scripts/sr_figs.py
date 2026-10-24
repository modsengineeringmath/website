# Static SVG figures for chapter 26 (sequences & series) and its articles.
# Usage: python3 scripts/sr_figs.py          fills empty <!--FIG:sr-…--><!--/FIG--> blocks
#        python3 scripts/sr_figs.py --all    redraws every figure this script owns
# Only keys in FIGS (all start with "sr-") are touched; keys owned by the other figure scripts are left alone.
# Figures are drawn on narrow viewBoxes (≈ 440 px wide) so their 11–12 px labels stay readable on phones,
# and use the .mf-* classes from assets/site.css so they follow light/dark mode. A key ending in "-en" draws English labels.
import glob, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}


def fig(*keys):
    def deco(fn):
        for k in keys:
            FIGS[k] = fn
        return fn
    return deco


def f1(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


class S:
    def __init__(self, w, h, label):
        self.w, self.h, self.label, self.p = w, h, label, []

    def add(self, s):
        self.p.append(s)

    def svg(self):
        lab = self.label.replace('"', "&quot;")
        return f'<svg class="mf sr-fig" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}">' + "".join(self.p) + "</svg>"

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

    def arrow(self, x1, y1, x2, y2, cls="mf-thin", head=7):
        self.line(x1, y1, x2, y2, cls)
        a = math.atan2(y2 - y1, x2 - x1)
        p1 = (x2 - head * math.cos(a - 0.4), y2 - head * math.sin(a - 0.4))
        p2 = (x2 - head * math.cos(a + 0.4), y2 - head * math.sin(a + 0.4))
        self.add(f'<path class="mf-arrowh" d="M{f1(x2)} {f1(y2)}L{f1(p1[0])} {f1(p1[1])}L{f1(p2[0])} {f1(p2[1])}Z"/>')


class Plot:
    """a Cartesian panel inside S"""

    def __init__(self, c, x, y, w, h, xr, yr, xt=None, yt=None, xl=None, yl=None, fmt=None):
        self.c, self.x, self.y, self.w, self.h, self.xr, self.yr = c, x, y, w, h, xr, yr
        c.rect(x, y, w, h, "mf-bg", 8)
        for t in (xt or []):
            X = self.X(t)
            c.line(X, y, X, y + h, "mf-g")
            c.text(X, y + h + 13, (fmt or str)(t), "mf-k", "middle")
        for t in (yt or []):
            Y = self.Y(t)
            c.line(x, Y, x + w, Y, "mf-g")
            c.text(x - 5, Y + 4, (fmt or str)(t), "mf-k", "end")
        if yr[0] < 0 < yr[1]:
            c.line(x, self.Y(0), x + w, self.Y(0), "mf-ax")
        if xr[0] < 0 < xr[1]:
            c.line(self.X(0), y, self.X(0), y + h, "mf-ax")
        if xl:
            c.text(x + w - 2, y + h + 26, xl, "mf-l", "end")
        if yl:
            c.text(x + 6, y + 14, yl, "mf-l")

    def X(self, v):
        return self.x + (v - self.xr[0]) / (self.xr[1] - self.xr[0]) * self.w

    def Y(self, v):
        return self.y + (self.yr[1] - v) / (self.yr[1] - self.yr[0]) * self.h

    def curve(self, f, a, b, cls, n=240, clip=True):
        # draws y = f(x); leaving the panel ends the stroke at the edge, re-entering starts at the edge
        lo, hi = self.yr
        d, pen, prev = "", False, None
        for i in range(n + 1):
            t = a + (b - a) * i / n
            try:
                v = f(t)
                if v != v:
                    raise ValueError
            except (ValueError, ZeroDivisionError, OverflowError):
                pen, prev = False, None
                continue
            inside = lo <= v <= hi
            if inside:
                if not pen and prev is not None:
                    pt, pv = prev
                    edge = hi if pv > hi else lo
                    te = pt + (t - pt) * (edge - pv) / (v - pv) if v != pv else t
                    d += f"M{f1(self.X(te))} {f1(self.Y(edge))}"
                    pen = True
                d += ("L" if pen else "M") + f"{f1(self.X(t))} {f1(self.Y(v))}"
                pen = True
            elif pen:
                pt, pv = prev
                edge = hi if v > hi else lo
                te = pt + (t - pt) * (edge - pv) / (v - pv) if v != pv else t
                d += f"L{f1(self.X(te))} {f1(self.Y(edge))}"
                pen = False
            prev = (t, v)
        self.c.path(d, cls)

    def poly(self, pts, cls):
        self.c.path("M" + "L".join(f"{f1(self.X(a))} {f1(self.Y(b))}" for a, b in pts), cls)


def T(en, th, lang):
    return en if lang == "en" else th


# --------------------------------------------------------------------------- 26.1 sequences
@fig("sr-eps-n", "sr-eps-n-en")
def eps_n(lang):
    c = S(440, 250, T("Epsilon–N definition: after N every term stays inside the band L ± ε", "นิยาม ε–N: หลังตำแหน่ง N ทุกพจน์อยู่ในแถบ L ± ε", lang))
    p = Plot(c, 40, 16, 388, 196, (0, 21), (1.0, 3.7), xt=[0, 5, 10, 15, 20], yt=[1.5, 2, 2.5, 3, 3.5], xl="n")
    L, e = 3.0, 0.4
    c.rect(p.X(0), p.Y(L + e), p.w, p.Y(L - e) - p.Y(L + e), "mf-fill2")
    c.line(p.X(0), p.Y(L), p.X(21), p.Y(L), "mf-dash")
    c.text(p.X(20.8), p.Y(L + e) - 4, "L + ε", "mf-l", "end")
    c.text(p.X(20.8), p.Y(L - e) + 13, "L − ε", "mf-l", "end")
    N = 10
    c.line(p.X(N + 0.5), p.y, p.X(N + 0.5), p.y + p.h, "mf-thin")
    c.text(p.X(N + 0.5) + 4, p.y + p.h - 6, "N = 10", "mf-h")
    for n in range(1, 21):
        a = (3 * n + 1) / (n + 2)
        c.circle(p.X(n), p.Y(a), 3.6, "mf-dot" if n > N else "mf-dot2")
    c.text(p.X(0.6), p.Y(3.52), "aₙ = (3n+1)/(n+2), ε = 0.4", "mf-t")
    return c.svg()


@fig("sr-growth", "sr-growth-en")
def growth(lang):
    c = S(440, 260, T("Growth hierarchy on a log scale: ln n, n², 2ⁿ, n!, nⁿ", "ลำดับชั้นการโตบนสเกล log: ln n, n², 2ⁿ, n!, nⁿ", lang))
    p = Plot(c, 40, 14, 386, 208, (1, 20), (-1, 26), xt=[1, 5, 10, 15, 20], yt=[0, 5, 10, 15, 20, 25], xl="n", yl="log₁₀")
    fs = [("ln n", lambda n: math.log10(math.log(n)) if n > 1.01 else -2, "mf-s5"),
          ("n²", lambda n: 2 * math.log10(n), "mf-s4"),
          ("2ⁿ", lambda n: n * math.log10(2), "mf-s3"),
          ("n!", lambda n: math.lgamma(n + 1) / math.log(10), "mf-s2"),
          ("nⁿ", lambda n: n * math.log10(n), "mf-s1")]
    for lab, f, cls in fs:
        p.curve(f, 1.02, 20, cls)
        y = min(f(20), 25.6)
        dy = {"ln n": 13, "n²": -5, "2ⁿ": -5, "n!": -5, "nⁿ": -5}[lab]
        c.text(p.X(20) - 4, p.Y(y) + dy, lab, "mf-h", "end")
    return c.svg()


# --------------------------------------------------------------------------- 26.2 infinite series
@fig("sr-partial-sums", "sr-partial-sums-en")
def partial_sums(lang):
    c = S(440, 240, T("Terms (1/2)ⁿ as bars and partial sums Sₙ approaching 1", "พจน์ (1/2)ⁿ เป็นแท่ง และผลบวกย่อย Sₙ เข้าใกล้ 1", lang))
    p = Plot(c, 40, 14, 386, 190, (0.3, 10.7), (0, 1.12), xt=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yt=[0, 0.25, 0.5, 0.75, 1], xl="n")
    c.line(p.X(0.3), p.Y(1), p.X(10.7), p.Y(1), "mf-dash")
    c.text(p.X(10.6), p.Y(1) - 5, T("sum = 1", "ผลบวก = 1", lang), "mf-l", "end")
    S_ = 0
    pts = []
    for n in range(1, 11):
        a = 0.5 ** n
        c.rect(p.X(n) - 9, p.Y(a), 18, p.Y(0) - p.Y(a), "mf-fill2")
        S_ += a
        pts.append((n, S_))
    p.poly(pts, "mf-sig")
    for n, s in pts:
        c.circle(p.X(n), p.Y(s), 3.5, "mf-dot")
    c.text(p.X(1.2), p.Y(0.62), "aₙ", "mf-h")
    c.text(p.X(2.1), p.Y(0.86), "Sₙ", "mf-h")
    c.line(p.X(4) + 12, p.Y(1), p.X(4) + 12, p.Y(pts[3][1]), "mf-brom")
    c.text(p.X(4) + 4, p.Y(0.84), "R₄ = 1/16 ↑", "mf-l")
    return c.svg()


@fig("sr-telescope", "sr-telescope-en")
def telescope(lang):
    c = S(440, 150, T("Telescoping: middle terms cancel in pairs", "กล้องส่องทางไกล: พจน์กลางหักล้างกันเป็นคู่", lang))
    items = [("1", None), ("−½", "+½"), ("−⅓", "+⅓"), ("−¼", "+¼"), ("…", None)]
    x = 14
    for i, (a, b) in enumerate(items):
        w = 62 if b else 46
        c.rect(x, 24, w, 44, "mf-box", 8)
        if b:
            c.text(x + w * 0.3, 52, a, "mf-h", "middle")
            c.text(x + w * 0.72, 52, b, "mf-h", "middle")
            c.line(x + 6, 62, x + w - 6, 30, "mf-thin")
        else:
            c.text(x + w / 2, 52, a, "mf-h", "middle")
        x += w + 10
    c.rect(x, 24, 96, 44, "mf-box", 8)
    c.text(x + 48, 52, "−1/(N+1)", "mf-h", "middle")
    c.text(14, 98, T("(1 − ½) + (½ − ⅓) + (⅓ − ¼) + ⋯ + (1/N − 1/(N+1))", "(1 − ½) + (½ − ⅓) + (⅓ − ¼) + ⋯ + (1/N − 1/(N+1))", lang), "mf-l")
    c.text(14, 124, T("only the first and last survive: S_N = 1 − 1/(N+1) → 1", "เหลือแค่หัวกับท้าย: S_N = 1 − 1/(N+1) → 1", lang), "mf-h")
    return c.svg()


@fig("sr-harmonic", "sr-harmonic-en")
def harmonic(lang):
    c = S(440, 230, T("Oresme's grouping of the harmonic series: every group exceeds one half", "การจัดกลุ่มของโอเรสม์: ทุกกลุ่มมากกว่าครึ่ง", lang))
    p = Plot(c, 36, 14, 392, 170, (0.4, 16.6), (0, 1.08), xt=[1, 2, 4, 8, 16], yt=[0, 0.5, 1], xl="n", yl="1/n")
    groups = [(1, 1), (2, 2), (3, 4), (5, 8), (9, 16)]
    cls = ["mf-fill", "mf-fill2", "mf-fill", "mf-fill2", "mf-fill"]
    for gi, (a, b) in enumerate(groups):
        for n in range(a, b + 1):
            c.rect(p.X(n) - 9, p.Y(1 / n), 18, p.Y(0) - p.Y(1 / n), cls[gi])
        if gi >= 2:
            c.text((p.X(a) + p.X(b)) / 2, p.Y(1 / a) - 8, "> ½", "mf-h", "middle")
    c.text(p.X(2), p.Y(0.5) - 8, "½", "mf-h", "middle")
    c.text(36, 222, T("1 + ½ + (⅓ + ¼) + (⅕ + ⋯ + ⅛) + ⋯ > 1 + ½ + ½ + ½ + ⋯ = ∞", "1 + ½ + (⅓ + ¼) + (⅕ + ⋯ + ⅛) + ⋯ > 1 + ½ + ½ + ½ + ⋯ = ∞", lang), "mf-l")
    return c.svg()


# --------------------------------------------------------------------------- 26.3 convergence tests
@fig("sr-flow", "sr-flow-en")
def flow(lang):
    rows = [
        (T("aₙ → 0 ?", "aₙ → 0 ?", lang), T("no → DIVERGES", "ไม่ → ลู่ออก", lang), True),
        (T("geometric or p-series?", "เรขาคณิต / อนุกรม p ?", lang), T("|r| < 1 · p > 1", "|r| < 1 · p > 1", lang), False),
        (T("partial fractions?", "แยกเศษส่วนย่อยได้ ?", lang), T("telescoping", "กล้องส่องทางไกล", lang), False),
        (T("ratio of polynomials/roots?", "เศษส่วนพหุนาม / ราก ?", lang), T("limit comparison 1/nᵖ", "เปรียบเทียบลิมิต 1/nᵖ", lang), False),
        (T("n!, cⁿ, nⁿ ?", "มี n!, cⁿ, nⁿ ?", lang), T("ratio test", "อัตราส่วน", lang), False),
        (T("whole term to the n-th power?", "ยกกำลัง n ทั้งก้อน ?", lang), T("root test", "ราก", lang), False),
        (T("ln n, easy to integrate?", "มี ln / อินทิเกรตง่าย ?", lang), T("integral test", "ปริพันธ์", lang), False),
        (T("alternating signs?", "เครื่องหมายสลับ ?", lang), T("Σ|aₙ| first, then Leibniz", "Σ|aₙ| ก่อน แล้วไลบ์นิซ", lang), False),
    ]
    h = 30 + len(rows) * 64
    c = S(420, h, T("Flowchart for choosing a convergence test", "ผังเลือกการทดสอบการลู่เข้า", lang))
    y = 14
    for i, (q, r, first) in enumerate(rows):
        c.rect(8, y, 214, 40, "mf-box", 18)
        c.text(115, y + 25, q, "mf-h", "middle")
        c.rect(262, y, 150, 40, "mf-fill2" if not first else "mf-fill", 8)
        c.add(f'<rect class="mf-box" x="262" y="{y}" width="150" height="40" rx="8" style="fill:none"/>')
        c.text(337, y + 25, r, "mf-t", "middle")
        c.arrow(222, y + 20, 260, y + 20, "mf-thin")
        c.text(241, y + 14, T("yes", "ใช่", lang) if not first else "", "mf-k", "middle")
        if i < len(rows) - 1:
            c.arrow(115, y + 40, 115, y + 62, "mf-thin")
            c.text(121, y + 55, T("no", "ไม่", lang) if not first else T("yes", "ใช่", lang), "mf-k")
        y += 64
    return c.svg()


@fig("sr-integral-test", "sr-integral-test-en")
def integral_test(lang):
    c = S(440, 240, T("Integral test: rectangles below and above y = 1/x²", "การทดสอบด้วยปริพันธ์: สี่เหลี่ยมใต้และเหนือกราฟ y = 1/x²", lang))
    p = Plot(c, 40, 14, 386, 192, (0.7, 7.3), (0, 1.1), xt=[1, 2, 3, 4, 5, 6, 7], yt=[0, 0.5, 1], xl="x")
    f = lambda x: 1 / (x * x)
    for n in range(1, 7):
        c.rect(p.X(n), p.Y(f(n)), p.X(n + 1) - p.X(n), p.Y(0) - p.Y(f(n)), "mf-fill2")
        c.rect(p.X(n), p.Y(f(n + 1)), p.X(n + 1) - p.X(n), p.Y(0) - p.Y(f(n + 1)), "mf-fill")
    p.curve(f, 0.92, 7.3, "mf-ink")
    c.text(p.X(1.15), p.Y(0.95), "y = f(x)", "mf-h")
    c.text(p.X(3.2), p.Y(0.55), T("blue: height f(n), above", "ฟ้า: สูง f(n) อยู่เหนือกราฟ", lang), "mf-l")
    c.text(p.X(3.2), p.Y(0.43), T("orange: height f(n+1), below", "ส้ม: สูง f(n+1) อยู่ใต้กราฟ", lang), "mf-l")
    return c.svg()


# --------------------------------------------------------------------------- 26.4 alternating
@fig("sr-alt-zigzag", "sr-alt-zigzag-en")
def alt_zigzag(lang):
    c = S(440, 230, T("Partial sums of the alternating harmonic series jump across ln 2", "ผลบวกย่อยของอนุกรมฮาร์มอนิกสลับกระโดดข้าม ln 2", lang))
    p = Plot(c, 40, 14, 386, 182, (0.5, 16.5), (0.45, 1.05), xt=[1, 4, 8, 12, 16], yt=[0.5, 0.6, 0.7, 0.8, 0.9, 1.0], xl="N", fmt=lambda v: f"{v:g}")
    c.line(p.X(0.5), p.Y(math.log(2)), p.X(16.5), p.Y(math.log(2)), "mf-dash")
    c.text(p.X(16.4), p.Y(math.log(2)) + 14, "ln 2 ≈ 0.693", "mf-l", "end")
    s, pts = 0, []
    for n in range(1, 17):
        s += (-1) ** (n + 1) / n
        pts.append((n, s))
    p.poly(pts, "mf-sig")
    for n, v in pts:
        c.circle(p.X(n), p.Y(v), 3.4, "mf-dot" if n % 2 else "mf-dot2")
    c.text(p.X(3.2), p.Y(0.98), T("odd N: above, decreasing", "N คี่: อยู่บน และลดลง", lang), "mf-l")
    c.text(p.X(3.2), p.Y(0.5), T("even N: below, increasing", "N คู่: อยู่ล่าง และเพิ่มขึ้น", lang), "mf-l")
    return c.svg()


@fig("sr-rearrange", "sr-rearrange-en")
def rearrange(lang):
    c = S(440, 230, T("Same terms, different order, different sum", "พจน์ชุดเดียวกัน ลำดับต่างกัน ผลบวกต่างกัน", lang))
    p = Plot(c, 40, 14, 386, 182, (0, 90), (0.4, 1.25), xt=[0, 30, 60, 90], yt=[0.5, 0.75, 1.0, 1.25], xl=T("terms used", "จำนวนพจน์", lang), fmt=lambda v: f"{v:g}")
    s, pts = 0, []
    for n in range(1, 91):
        s += (-1) ** (n + 1) / n
        pts.append((n, s))
    p.poly(pts, "mf-s5")
    s, pts, pi, ni, k = 0, [], 1, 2, 0
    while k < 90:
        for _ in range(2):
            s += 1 / pi; pi += 2; k += 1; pts.append((k, s))
        s -= 1 / ni; ni += 2; k += 1; pts.append((k, s))
    p.poly(pts, "mf-s2")
    for v, lab in ((math.log(2), "ln 2"), (1.5 * math.log(2), "(3/2) ln 2")):
        c.line(p.X(0), p.Y(v), p.X(90), p.Y(v), "mf-dash")
        c.text(p.X(89), p.Y(v) - 5, lab, "mf-l", "end")
    c.text(p.X(30), p.Y(0.47), T("blue: 1 − ½ + ⅓ − ¼ + ⋯", "ฟ้า: 1 − ½ + ⅓ − ¼ + ⋯", lang), "mf-l")
    c.text(p.X(30), p.Y(1.17), T("orange: 1 + ⅓ − ½ + ⅕ + ⅐ − ¼ + ⋯", "ส้ม: 1 + ⅓ − ½ + ⅕ + ⅐ − ¼ + ⋯", lang), "mf-l")
    return c.svg()


# --------------------------------------------------------------------------- 26.5 power series
@fig("sr-interval", "sr-interval-en")
def interval(lang):
    c = S(440, 120, T("Interval of convergence: centre a, radius R", "ช่วงการลู่เข้า: จุดศูนย์กลาง a รัศมี R", lang))
    y = 58
    c.line(14, y, 426, y, "mf-ax")
    a, R = 220, 130
    c.add(f'<rect class="mf-fill2" x="{a - R}" y="{y - 10}" width="{2 * R}" height="20" rx="4"/>')
    for x, lab in ((a - R, "a − R"), (a, "a"), (a + R, "a + R")):
        c.line(x, y - 14, x, y + 14, "mf-line")
        c.text(x, y + 32, lab, "mf-h", "middle")
    c.circle(a - R, y, 6, "mf-zero")
    c.circle(a + R, y, 6, "mf-zero")
    c.text(a, y - 20, T("converges absolutely", "ลู่เข้าแบบสัมบูรณ์", lang), "mf-h", "middle")
    c.text(44, y - 20, T("diverges", "ลู่ออก", lang), "mf-l", "middle")
    c.text(396, y - 20, T("diverges", "ลู่ออก", lang), "mf-l", "middle")
    c.text(a - R, y + 52, T("? test", "? ตรวจเอง", lang), "mf-k", "middle")
    c.text(a + R, y + 52, T("? test", "? ตรวจเอง", lang), "mf-k", "middle")
    return c.svg()


@fig("sr-disc", "sr-disc-en")
def disc(lang):
    c = S(400, 300, T("Disc of convergence of 1/(1+z²) about 0 stops at the poles ±i", "ดิสก์การลู่เข้าของ 1/(1+z²) รอบ 0 หยุดที่โพล ±i", lang))
    cx, cy, sc = 200, 150, 95
    c.add(f'<rect class="mf-bg" x="10" y="10" width="380" height="280" rx="8"/>')
    c.line(20, cy, 380, cy, "mf-ax")
    c.line(cx, 20, cx, 280, "mf-ax")
    c.add(f'<circle class="mf-roc" cx="{cx}" cy="{cy}" r="{sc}"/><circle class="mf-rocb" fill="none" cx="{cx}" cy="{cy}" r="{sc}"/>')
    c.add(f'<line class="mf-brom" x1="{cx - sc}" y1="{cy}" x2="{cx + sc}" y2="{cy}"/>')
    for yy, lab in ((-1, "i"), (1, "−i")):
        px, py = cx, cy + yy * sc
        c.path(f"M{px - 7} {py - 7}L{px + 7} {py + 7}M{px + 7} {py - 7}L{px - 7} {py + 7}", "mf-pole")
        c.text(px + 14, py + 14, lab, "mf-h")
    c.text(cx - sc, cy + 18, "−1", "mf-k", "middle")
    c.text(cx + sc, cy + 18, "1", "mf-k", "middle")
    c.line(cx, cy, cx + sc * 0.7, cy - sc * 0.7, "mf-thin")
    c.text(cx + sc * 0.38, cy - sc * 0.48, "R = 1", "mf-h")
    c.text(372, cy - 8, "Re", "mf-l", "end")
    c.text(cx + 6, 30, "Im", "mf-l")
    c.text(20, 278, T("green segment: (−1, 1) on the real axis", "เส้นเขียว: ช่วง (−1, 1) บนแกนจริง", lang), "mf-l")
    return c.svg()


# --------------------------------------------------------------------------- 26.6 Taylor
@fig("sr-taylor-sin", "sr-taylor-sin-en")
def taylor_sin(lang):
    c = S(440, 260, T("Maclaurin polynomials of sin x of degree 1, 3, 5, 7, 9", "พหุนามแมคลอรินของ sin x ดีกรี 1, 3, 5, 7, 9", lang))
    p = Plot(c, 32, 14, 396, 210, (-7, 7), (-2, 2), xt=[-6, -3, 0, 3, 6], yt=[-2, -1, 0, 1, 2], xl="x")

    def P(n):
        def f(x):
            s, t = 0.0, x
            for k in range(0, (n + 1) // 2):
                s += t
                t *= -x * x / ((2 * k + 2) * (2 * k + 3))
            return s
        return f
    cls = ["mf-s5", "mf-s4", "mf-s3", "mf-s2", "mf-s1"]
    for i, n in enumerate((1, 3, 5, 7, 9)):
        p.curve(P(n), -7, 7, cls[i])
    p.curve(math.sin, -7, 7, "mf-ink")
    labs = [("P₁", 1.75, 1.85), ("P₃", 2.6, -1.85), ("P₅", 3.55, 1.85), ("P₇", 4.3, -1.85), ("P₉", 5.15, 1.85)]
    for (lab, x, y), cl in zip(labs, cls):
        c.text(p.X(x), p.Y(y), lab, "mf-h", "middle")
    c.text(p.X(-6.6), p.Y(1.6), "sin x", "mf-h")
    return c.svg()


# --------------------------------------------------------------------------- 26.7 Laurent
@fig("sr-annulus", "sr-annulus-en")
def annulus(lang):
    c = S(400, 318, T("Three regions about 0 for 1/((z−1)(z−2))", "สามบริเวณรอบ 0 ของ 1/((z−1)(z−2))", lang))
    cx, cy, sc = 200, 150, 58
    c.add(f'<rect class="mf-bg" x="10" y="10" width="380" height="280" rx="8"/>')
    c.add(f'<rect class="mf-roc" x="11" y="11" width="378" height="278" rx="8" style="opacity:.06"/>')
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{2 * sc}" class="mf-roc" style="opacity:.14"/>')
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{sc}" class="mf-lhp" style="opacity:.28"/>')
    c.add(f'<circle class="mf-rocb" fill="none" cx="{cx}" cy="{cy}" r="{sc}"/><circle class="mf-rocb" fill="none" cx="{cx}" cy="{cy}" r="{2 * sc}"/>')
    c.line(20, cy, 380, cy, "mf-ax")
    c.line(cx, 20, cx, 280, "mf-ax")
    for k in (1, 2):
        px = cx + k * sc
        c.path(f"M{px - 7} {cy - 7}L{px + 7} {cy + 7}M{px + 7} {cy - 7}L{px - 7} {cy + 7}", "mf-pole")
        c.text(px, cy + 20, str(k), "mf-h", "middle")
    c.text(cx - 26, cy - 20, T("(a)", "(ก)", lang), "mf-h", "middle")
    c.text(cx - 26, cy - sc - 24, T("(b)", "(ข)", lang), "mf-h", "middle")
    c.text(58, 44, T("(c) |z| > 2", "(ค) |z| > 2", lang), "mf-h")
    c.text(200, 310, T("(a) |z| < 1 Taylor · (b) 1 < |z| < 2 · (c) outside", "(ก) |z| < 1 เทย์เลอร์ · (ข) 1 < |z| < 2 · (ค) ภายนอก", lang), "mf-l", "middle")
    c.text(372, cy - 8, "Re", "mf-l", "end")
    c.text(cx + 6, 30, "Im", "mf-l")
    return c.svg()


@fig("sr-singular", "sr-singular-en")
def singular(lang):
    c = S(440, 200, T("Behaviour near three kinds of isolated singularity", "พฤติกรรมใกล้จุดเอกฐานโดดเดี่ยวสามชนิด", lang))
    specs = [
        (T("removable: sin x / x", "ถอดได้: sin x / x", lang), lambda x: math.sin(x) / x, (-0.5, 1.6)),
        (T("pole: 1/x²", "โพล: 1/x²", lang), lambda x: 1 / (x * x), (-0.5, 9)),
        (T("essential: e^(1/x)", "เอกฐานแท้: e^(1/x)", lang), lambda x: math.exp(1 / x) if x < 0 or 1 / x < 30 else 1e9, (-0.5, 9)),
    ]
    for i, (lab, f, yr) in enumerate(specs):
        x0 = 10 + i * 144
        p = Plot(c, x0 + 6, 30, 128, 140, (-2, 2), yr)
        p.curve(f, -2, -0.02, "mf-sig", 160)
        p.curve(f, 0.02, 2, "mf-sig", 160)
        c.text(x0 + 70, 20, lab, "mf-h", "middle")
        c.text(x0 + 70, 190, "x → 0", "mf-k", "middle")
        if i == 0:
            c.circle(p.X(0), p.Y(1), 4, "mf-zero")
    return c.svg()


# --------------------------------------------------------------------------- 26.8 engineering
@fig("sr-ladder", "sr-ladder-en")
def ladder(lang):
    c = S(440, 170, T("Resistor ladder: series R and shunt R repeated", "บันไดตัวต้านทาน: R อนุกรมและ R ขนานซ้ำกัน", lang))
    top, bot = 46, 128

    def res_h(x, y, w=40):  # horizontal zigzag resistor
        d = f"M{x} {y}"
        n = 6
        for i in range(n):
            d += f"L{x + (i + 0.5) * w / n} {y + (-6 if i % 2 == 0 else 6)}"
        d += f"L{x + w} {y}"
        c.path(d, "mf-ink")

    def res_v(x, y, h=40):
        d = f"M{x} {y}"
        n = 6
        for i in range(n):
            d += f"L{x + (-6 if i % 2 == 0 else 6)} {y + (i + 0.5) * h / n}"
        d += f"L{x} {y + h}"
        c.path(d, "mf-ink")
    c.circle(22, top, 4, "mf-zero")
    c.circle(22, bot, 4, "mf-zero")
    c.text(10, 92, "R_in →", "mf-h")
    x = 26
    for k in range(3):
        c.line(x, top, x + 20, top, "mf-line")
        res_h(x + 20, top)
        c.text(x + 40, top - 12, "R", "mf-h", "middle")
        x2 = x + 80
        c.line(x + 60, top, x2 + 30, top, "mf-line")
        c.line(x2, top, x2, top + 21, "mf-line")
        res_v(x2, top + 21)
        c.line(x2, top + 61, x2, bot, "mf-line")
        c.text(x2 + 12, top + 46, "R", "mf-h")
        x = x2 + 10
    c.line(26, bot, x + 30, bot, "mf-line")
    c.text(x + 44, 92, "⋯", "mf-h", "middle")
    c.text(10, 160, T("R_∞ = R(1 + √5)/2 ≈ 1.618 R", "R_∞ = R(1 + √5)/2 ≈ 1.618 R", lang), "mf-l")
    return c.svg()


# --------------------------------------------------------------------------- hub roadmap
@fig("sr-roadmap", "sr-roadmap-en")
def roadmap(lang):
    nodes = [
        ("26.1", T("Sequences", "ลำดับ", lang), "aₙ → L"),
        ("26.2", T("Series", "อนุกรม", lang), "Sₙ = Σaₖ"),
        ("26.3", T("Tests", "การทดสอบ", lang), "ratio · root"),
        ("26.4", T("Alternating", "อนุกรมสลับ", lang), "|S − Sₙ| ≤ bₙ₊₁"),
        ("26.5", T("Power series", "อนุกรมกำลัง", lang), "|x − a| < R"),
        ("26.6", T("Taylor", "เทย์เลอร์", lang), "f⁽ⁿ⁾(a)/n!"),
        ("26.7", T("Laurent", "โลรองต์", lang), "Σ aₙzⁿ, n ∈ ℤ"),
        ("26.8", T("Engineering · Z", "วิศวกรรม · Z", lang), "ROC · gₘ"),
    ]
    c = S(440, 370, T("Roadmap of the sequences and series chapter", "เส้นทางของบทลำดับและอนุกรม", lang))
    W, H = 176, 62
    pos = []
    for i in range(len(nodes)):
        row = i // 2
        col = i % 2 if row % 2 == 0 else 1 - i % 2
        pos.append((20 + col * 224, 14 + row * 88))
    for i, (num, title, sub) in enumerate(nodes):
        x, y = pos[i]
        c.rect(x, y, W, H, "mf-box", 10)
        c.text(x + 10, y + 18, num, "mf-k")
        c.text(x + W / 2, y + 36, title, "mf-h", "middle")
        c.text(x + W / 2, y + 53, sub, "mf-l", "middle")
    for i in range(len(nodes) - 1):
        (x1, y1), (x2, y2) = pos[i], pos[i + 1]
        if y1 == y2:
            if x2 > x1:
                c.arrow(x1 + W, y1 + H / 2, x2 - 2, y2 + H / 2, "mf-brom")
            else:
                c.arrow(x1, y1 + H / 2, x2 + W + 2, y2 + H / 2, "mf-brom")
        else:
            c.arrow(x1 + W / 2, y1 + H, x2 + W / 2, y2 - 2, "mf-brom")
    return c.svg()


# --------------------------------------------------------------------------- driver
def main():
    redraw = "--all" in sys.argv
    files = glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True)
    pat = re.compile(r"<!--FIG:(sr-[a-z0-9-]+)-->(.*?)<!--/FIG-->", re.S)
    count = 0
    for fn in files:
        src = open(fn, encoding="utf8").read()
        if "<!--FIG:sr-" not in src:
            continue

        def rep(m):
            nonlocal count
            key, body = m.group(1), m.group(2)
            if key not in FIGS or (body.strip() and not redraw):
                return m.group(0)
            lang = "en" if key.endswith("-en") else "th"
            count += 1
            return f"<!--FIG:{key}-->{FIGS[key](lang)}<!--/FIG-->"
        out = pat.sub(rep, src)
        if out != src:
            open(fn, "w", encoding="utf8").write(out)
            print("filled", os.path.relpath(fn, ROOT))
    unknown = set()
    for fn in files:
        for k in re.findall(r"<!--FIG:(sr-[a-z0-9-]+)-->", open(fn, encoding="utf8").read()):
            if k not in FIGS:
                unknown.add(k)
    if unknown:
        print("unknown keys:", ", ".join(sorted(unknown)))
    print(count, "figure(s) drawn")


if __name__ == "__main__":
    main()
