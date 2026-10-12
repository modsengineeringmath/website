# Computed SVG figures for the Fourier-series lessons (spectra, partial sums, power-electronics waveforms).
# Usage: python3 scripts/fs_figs.py [--all] [files…]
#   rewrites every <!--FIG:key-->…<!--/FIG--> in src/pages/learn/fourier-series/*.html
#   (only empty placeholders unless --all is given).
# Styling comes from the ".fsfig" / ".wtfig" classes in assets/site.css, so figures follow the light/dark theme.
# Every number drawn here is computed from the same formulas as the lesson text (W, C, P, R, V, B, M, D cards).
import glob, math, os, re, sys
import numpy as np

FIGS = {}
PI = math.pi


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def f1(v):
    s = f"{v:.1f}"
    s = s[:-2] if s.endswith(".0") else s
    return "0" if s == "-0" else s


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


class Svg:
    def __init__(self, w, h, label, key):
        self.w, self.h, self.label, self.key = w, h, label, key
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def svg(self):
        defs = (f'<defs><marker id="{self.key}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
                f'orient="auto-start-reverse"><path class="arh" d="M0 0L10 5L0 10z"/></marker></defs>')
        return f'<svg viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{esc(self.label)}">' + defs + "".join(self.parts) + "</svg>"

    def path(self, d, cls, extra=""):
        self.add(f'<path class="{cls}" d="{d}"{extra}/>')

    def poly(self, pts, cls, close=False, arrow=False):
        if not pts:
            return
        d = "M" + "L".join(f"{f1(x)} {f1(y)}" for x, y in pts) + ("Z" if close else "")
        self.path(d, cls, f' marker-end="url(#{self.key}-a)"' if arrow else "")

    def line(self, x1, y1, x2, y2, cls="ax", arrow=False, both=False):
        m = ""
        if arrow:
            m = f' marker-end="url(#{self.key}-a)"'
        if both:
            m = f' marker-start="url(#{self.key}-a)" marker-end="url(#{self.key}-a)"'
        self.add(f'<line class="{cls}" x1="{f1(x1)}" y1="{f1(y1)}" x2="{f1(x2)}" y2="{f1(y2)}"{m}/>')

    def text(self, x, y, s, cls="lb", anchor=None):
        a = f' text-anchor="{anchor}"' if anchor else ""
        self.add(f'<text class="{cls}" x="{f1(x)}" y="{f1(y)}"{a}>{s}</text>')

    def rect(self, x, y, w, h, cls="blk", rx=0):
        r = f' rx="{rx}"' if rx else ""
        self.add(f'<rect class="{cls}" x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}"{r}/>')

    def circle(self, x, y, r, cls="dot"):
        self.add(f'<circle class="{cls}" cx="{f1(x)}" cy="{f1(y)}" r="{f1(r)}"/>')


class Frame:
    def __init__(self, s, x, y, w, h, x0, x1, y0, y1, logx=False, logy=False):
        self.s, self.x, self.y, self.w, self.h = s, x, y, w, h
        self.x0, self.x1, self.y0, self.y1, self.logx, self.logy = x0, x1, y0, y1, logx, logy

    def X(self, v):
        if self.logx:
            return self.x + (math.log10(v) - math.log10(self.x0)) / (math.log10(self.x1) - math.log10(self.x0)) * self.w
        return self.x + (v - self.x0) / (self.x1 - self.x0) * self.w

    def Y(self, v):
        if self.logy:
            v = max(v, self.y0)
            return self.y + self.h - (math.log10(v) - math.log10(self.y0)) / (math.log10(self.y1) - math.log10(self.y0)) * self.h
        v = max(self.y0, min(self.y1, v))
        return self.y + self.h - (v - self.y0) / (self.y1 - self.y0) * self.h

    def curve(self, fn, cls="w1", n=300, a=None, b=None, breaks=()):
        a = self.x0 if a is None else a
        b = self.x1 if b is None else b
        ts = list(np.logspace(math.log10(a), math.log10(b), n + 1)) if self.logx else list(np.linspace(a, b, n + 1))
        eps = (b - a) * 1e-6
        for br in breaks:
            if a < br < b:
                ts += [br - eps, br + eps]
        ts.sort()
        ts[0] = a + eps
        ts[-1] = b - eps
        pts = [(self.X(t), self.Y(fn(t))) for t in ts]
        # drop collinear-ish duplicates to keep the SVG small
        out = [pts[0]]
        for i in range(1, len(pts) - 1):
            (x0, y0), (x1, y1), (x2, y2) = out[-1], pts[i], pts[i + 1]
            if abs((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)) > 0.35:
                out.append(pts[i])
        out.append(pts[-1])
        self.s.poly(out, cls)

    def pts(self, data, cls="w1"):
        self.s.poly([(self.X(t), self.Y(v)) for t, v in data], cls)

    def zero(self, cls="ax", arrow=True, xlabel=None):
        y0 = self.Y(0) if self.y0 <= 0 <= self.y1 else self.y + self.h
        self.s.line(self.x, y0, self.x + self.w + (10 if arrow else 0), y0, cls, arrow)
        if xlabel:
            self.s.text(self.x + self.w + 12, y0 + 4, xlabel, "lb")

    def yaxis(self, arrow=True, label=None):
        self.s.line(self.x, self.y + self.h, self.x, self.y - (10 if arrow else 0), "ax", arrow)
        if label:
            self.s.text(self.x + 6, self.y - 4, label, "lb")

    def hline(self, v, cls="dsh", label=None, anchor="start", dx=6):
        self.s.line(self.x, self.Y(v), self.x + self.w, self.Y(v), cls)
        if label:
            self.s.text(self.x + self.w + dx if anchor == "start" else self.x - dx, self.Y(v) + 4, label, "tk", anchor)

    def vline(self, t, cls="dsh", label=None, ly=None):
        self.s.line(self.X(t), self.y, self.X(t), self.y + self.h, cls)
        if label:
            self.s.text(self.X(t), ly if ly is not None else self.y + self.h + 14, label, "tk", "middle")

    def bars(self, data, cls="bar", width=6, base=None):
        base = self.y0 if base is None else base
        yb = self.Y(base)
        for n, v in data:
            y = self.Y(v)
            top, hgt = (y, yb - y) if y < yb else (yb, y - yb)
            if hgt > 0.2:
                self.s.rect(self.X(n) - width / 2, top, width, hgt, cls)

    def xticks(self, vals, fmt=str, y=None, cls="tk"):
        yy = (self.y + self.h + 14) if y is None else y
        for v in vals:
            self.s.text(self.X(v), yy, fmt(v), cls, "middle")

    def yticks(self, vals, fmt=str, grid=True):
        for v in vals:
            if grid:
                self.s.line(self.x, self.Y(v), self.x + self.w, self.Y(v), "gr")
            self.s.text(self.x - 6, self.Y(v) + 4, fmt(v), "tk", "end")


def mono(s):
    return s.replace("-", "−")


def deg(d):
    return d * PI / 180


# ---------------------------------------------------------------- waveform library (θ in radians, period 2π)
def wrap(th):
    return th % (2 * PI)


def sq(th):
    return 1.0 if wrap(th) < PI else -1.0


def tri(th):  # rising through 0 at θ = 0, peak at π/2
    u = wrap(th + PI / 2) / (2 * PI)
    return 4 * u - 1 if u < 0.5 else 3 - 4 * u


def saw(th):  # A·θ/π on (−π, π)
    u = wrap(th + PI)
    return (u - PI) / PI


def quasi(th, a):
    u = wrap(th)
    if a < u < PI - a:
        return 1.0
    if PI + a < u < 2 * PI - a:
        return -1.0
    return 0.0


def six_step(th):
    u = wrap(th) / (PI / 3)
    return [1 / 3, 2 / 3, 1 / 3, -1 / 3, -2 / 3, -1 / 3][int(u) % 6]


def block120(th):  # cos-referenced 6-pulse line current, Id = 1
    u = (wrap(th + PI)) - PI  # (−π, π]
    if abs(u) < PI / 3:
        return 1.0
    if abs(u) > 2 * PI / 3:
        return -1.0
    return 0.0


def block_overlap(th, mu):
    """6-pulse line current with commutation overlap mu (α = 0), Id = 1, cos-referenced like block120."""
    u = (wrap(th + PI)) - PI
    s = 1.0
    if u > PI / 2 or u < -PI / 2:  # negative half is the mirror image
        s = -1.0
        u = (wrap(u + PI + PI)) - PI
    k = 1 - math.cos(mu)
    a, b = -PI / 3, PI / 3
    if u < a or u > b + mu:
        return 0.0
    if u < a + mu:
        return s * (1 - math.cos(u - a)) / k
    if u < b:
        return s * 1.0
    return s * (1 - (1 - math.cos(u - b)) / k)


def harmonics(fn, H, M=8192):
    th = np.arange(M) * 2 * PI / M
    x = np.array([fn(t) for t in th])
    X = np.fft.rfft(x) / M
    amp = 2 * np.abs(X[: H + 1])
    amp[0] = abs(X[0].real)
    return amp, X


# ======================================================================= HUB
@fig("hub-hero")
def hub_hero(key="hub-hero"):
    s = Svg(660, 300, "อนุกรมฟูเรียร์สองมุมมอง: ซ้ายคือคลื่นสี่เหลี่ยมกับผลรวมไซน์เจ็ดฮาร์มอนิกในโดเมนเวลาแบบที่สโคปแสดง ขวาคือแท่งสเปกตรัมที่ลำดับ 1 3 5 7 9 11 13 15 ขนาด 1 ส่วน n แบบที่เครื่องวิเคราะห์กำลังแสดง พร้อมค่า THD 48.3 เปอร์เซ็นต์", key)
    s.rect(8, 8, 644, 284, "blk", 14)
    s.text(28, 36, "โดเมนเวลา · สโคป", "th")
    s.text(372, 36, "โดเมนความถี่ · เครื่องวิเคราะห์", "th")
    fr = Frame(s, 28, 60, 282, 150, 0, 4 * PI, -1.45, 1.45)
    fr.zero(arrow=False)
    fr.curve(lambda t: sq(t), "w0", 8, breaks=[PI, 2 * PI, 3 * PI])
    fr.curve(lambda t: 4 / PI * math.sin(t), "w2", 160)
    fr.curve(lambda t: sum(4 / (PI * n) * math.sin(n * t) for n in (1, 3, 5, 7)), "w1", 420)
    s.text(28, 232, "สี่เหลี่ยม ≈ ไซน์ n = 1, 3, 5, 7 รวมกัน", "th")
    s.line(318, 135, 352, 135, "wire", arrow=True)
    sp = Frame(s, 372, 60, 262, 150, 0, 16, 0, 1.12)
    sp.zero(arrow=False)
    sp.bars([(n, 1 / n) for n in range(1, 16, 2)], "bar", 13)
    sp.bars([(n, 1 / n) for n in (1,)], "bar2", 13)
    sp.xticks(range(1, 16, 2), y=226)
    s.text(634, 226, "n", "tk", "end")
    for n in (1, 3, 5):
        s.text(sp.X(n) + 9, sp.Y(1 / n) - 4, f"{round(100 / n)} %" if n > 1 else "100 %", "tk")
    s.rect(28, 246, 604, 34, "fill1", 8)
    s.text(42, 268, "RMS = A · X₁ = 0.900A · THD = 48.3 % · PF ของกระแสนี้ = 0.90 · P = V₁I₁cos φ₁", "lb")
    return s.svg()


FIGS["fs-home"] = lambda: hub_hero("fs-home")

# SMPS 300 W, 220 µF, Isc/IL = 500 — line-current harmonics (% of I1, h = 1, 3, …, 19) and one period of the
# normalised current, both taken from FSCore.loadModel("smps") + solveNetwork exactly as the analyzer lab computes them.
SMPS_PCT = [100, 90.8, 74.3, 53.7, 33.0, 15.3, 3.5, 4.7, 6.1, 4.5]


def smps_i(th):
    u = math.degrees(wrap(th))
    sgn = 1.0
    if u >= 180:
        u -= 180
        sgn = -1.0
    if u < 62 or u > 107:
        return 0.0
    if u < 83:  # charging rise (fit to the simulated pulse)
        x = (u - 62) / 21
        return sgn * math.sin(x * PI / 2) ** 1.6
    x = (u - 83) / 24
    return sgn * (1 - x ** 1.25)


@fig("fs-home-lab")
def home_lab():
    s = Svg(520, 250, "เครื่องวิเคราะห์กำลังไฟฟ้าเสมือน: แรงดันไซน์เส้นประกับกระแสพัลส์แหลมของ SMPS 300 วัตต์ไม่มี PFC และแท่งฮาร์มอนิกของกระแส ที่ 3 สูง 90.8 เปอร์เซ็นต์ ที่ 5 สูง 74.3 เปอร์เซ็นต์ THD 134 เปอร์เซ็นต์ PF 0.59", "fs-home-lab")
    fr = Frame(s, 24, 18, 300, 92, 0, 4 * PI, -1.15, 1.15)
    fr.zero(arrow=False)
    fr.curve(lambda t: 0.8 * math.sin(t), "w0", 160)
    fr.curve(smps_i, "w1", 600)
    s.text(332, 40, "CH1 v · CH2 i", "tk")
    s.rect(340, 52, 160, 52, "fill1", 8)
    s.text(352, 74, "THD-I 134 %", "lba")
    s.text(352, 94, "PF 0.59 · DPF 0.99", "lb")
    sp = Frame(s, 40, 130, 460, 90, 0, 20, 0, 108)
    sp.yticks([0, 50, 100], lambda v: f"{v:g}%", True)
    sp.bars([(h, v) for h, v in zip(range(1, 20, 2), SMPS_PCT)], "bar", 15)
    sp.xticks(range(1, 20, 2), y=236)
    s.text(504, 236, "h", "tk")
    return s.svg()


# ======================================================================= 12.1 introduction
@fig("fs-intro-build")
def intro_build():
    s = Svg(660, 270, "คลื่นสี่เหลี่ยมเส้นประกับไซน์สามตัวที่ความถี่ f0 3f0 5f0 ขนาด 1 หนึ่งในสาม และหนึ่งในห้า ผลรวมสีส้มเริ่มมีรูปเหลี่ยม", "fs-intro-build")
    fr = Frame(s, 40, 22, 470, 220, 0, 2 * PI, -1.4, 1.4)
    fr.yticks([-1, 0, 1], lambda v: mono(f"{v:g}"), True)
    fr.zero(xlabel="t")
    fr.yaxis()
    k = 4 / PI
    fr.curve(sq, "w0", 8, breaks=[PI])
    fr.curve(lambda t: k * math.sin(t), "w2", 150)
    fr.curve(lambda t: k / 3 * math.sin(3 * t), "w3", 200)
    fr.curve(lambda t: k / 5 * math.sin(5 * t), "w4", 260)
    fr.curve(lambda t: k * (math.sin(t) + math.sin(3 * t) / 3 + math.sin(5 * t) / 5), "w1", 360)
    fr.xticks([PI, 2 * PI], lambda v: "T/2" if v < 4 else "T")
    lx = 530
    for i, (cls, lab) in enumerate([("w0", "สี่เหลี่ยม"), ("w2", "f₀ (n = 1)"), ("w3", "3f₀ × ⅓"), ("w4", "5f₀ × ⅕"), ("w1", "ผลรวม 3 ตัว")]):
        y = 40 + i * 26
        s.line(lx, y, lx + 26, y, cls)
        s.text(lx + 32, y + 4, lab, "th")
    return s.svg()


@fig("fs-intro-spectrum")
def intro_spectrum():
    s = Svg(660, 250, "ซ้าย: แรงดัน 50 เฮิรตซ์ที่มีฮาร์มอนิกที่ 3 ขนาด 30 เปอร์เซ็นต์และที่ 5 ขนาด 15 เปอร์เซ็นต์ในโดเมนเวลา สองคาบ 40 มิลลิวินาที ขวา: สเปกตรัมเส้นที่ 50 150 และ 250 เฮิรตซ์", "fs-intro-spectrum")
    a3, a5 = 0.30, 0.15
    x = lambda t: math.sin(t) + a3 * math.sin(3 * t + 0.4) + a5 * math.sin(5 * t + 2.0)
    fr = Frame(s, 40, 30, 300, 170, 0, 4 * PI, -1.5, 1.5)
    fr.zero(arrow=False)
    fr.yaxis(label="v")
    fr.curve(lambda t: math.sin(t), "w0", 120)
    fr.curve(x, "w1", 400)
    fr.xticks([2 * PI, 4 * PI], lambda v: "20 ms" if v < 7 else "40 ms")
    s.text(48, 228, "สโคป: เห็นรูปร่าง", "th")
    sp = Frame(s, 420, 30, 210, 170, 0, 300, 0, 1.15)
    sp.zero(xlabel="f")
    sp.yaxis(label="%")
    sp.bars([(50, 1), (150, a3), (250, a5)], "bar", 16)
    sp.xticks([50, 150, 250], lambda v: f"{v} Hz", y=216)
    for f_, a in ((50, 1), (150, a3), (250, a5)):
        s.text(sp.X(f_), sp.Y(a) - 6, f"{round(a * 100)} %", "tk", "middle")
    s.text(428, 240, "FFT / เครื่องวิเคราะห์: เห็นส่วนผสม", "th")
    s.line(356, 115, 404, 115, "wire", arrow=True)
    return s.svg()


# ======================================================================= 12.2 coefficients
@fig("fs-coef-orth")
def coef_orth():
    s = Svg(660, 240, "ซ้าย: กราฟผลคูณ sin t คูณ sin 3t พื้นที่บวกและลบหักล้างกันพอดี อินทิกรัลเท่ากับศูนย์ ขวา: sin กำลังสองของ t ไม่ติดลบ ค่าเฉลี่ยครึ่งหนึ่ง พื้นที่ตลอดคาบเท่ากับ T ส่วน 2", "fs-coef-orth")

    def panel(x0, fn, title, note, avg=None):
        fr = Frame(s, x0, 40, 260, 150, 0, 2 * PI, -1.1, 1.1)
        ts = np.linspace(0, 2 * PI, 400)
        ys = [fn(t) for t in ts]
        pos = [(fr.X(fr.x0), fr.Y(0))] + [(fr.X(t), fr.Y(max(v, 0))) for t, v in zip(ts, ys)] + [(fr.X(fr.x1), fr.Y(0))]
        neg = [(fr.X(fr.x0), fr.Y(0))] + [(fr.X(t), fr.Y(min(v, 0))) for t, v in zip(ts, ys)] + [(fr.X(fr.x1), fr.Y(0))]
        s.poly(pos, "fill1", close=True)
        s.poly(neg, "fill2", close=True)
        fr.zero(xlabel="t")
        fr.yaxis()
        fr.curve(fn, "w1", 300)
        if avg is not None:
            fr.hline(avg, "dsh", "½")
        fr.xticks([PI, 2 * PI], lambda v: "T/2" if v < 4 else "T")
        s.text(x0, 24, title, "lb")
        s.text(x0, 226, note, "th")

    panel(40, lambda t: math.sin(t) * math.sin(3 * t), "sin t · sin 3t", "พื้นที่ + และ − เท่ากัน → ∫ = 0")
    panel(370, lambda t: math.sin(t) ** 2, "sin t · sin t = sin²t", "ไม่ติดลบ เฉลี่ย ½ → ∫ = T/2", avg=0.5)
    return s.svg()


# ======================================================================= 12.3 symmetry
@fig("fs-sym-types")
def sym_types():
    s = Svg(660, 330, "สี่แบบของสมมาตร: ฟังก์ชันคู่เป็นพัลส์วางกึ่งกลางสะท้อนรอบแกนตั้ง ฟังก์ชันคี่เป็นฟันเลื่อยหมุนรอบจุดกำเนิด สมมาตรครึ่งคลื่นครึ่งหลังเท่ากับครึ่งแรกกลับหัว และสมมาตรเสี้ยวคลื่นเป็นสี่เหลี่ยมสามระดับ", "fs-sym-types")
    panels = [
        (30, 18, "คู่ · x(−t) = x(t) → bₙ = 0", lambda t: 1.0 if abs((wrap(t + PI)) - PI) < PI / 3 else 0.0, (-2 * PI, 2 * PI), [-PI / 3, PI / 3, -5 * PI / 3, 5 * PI / 3], "w2"),
        (350, 18, "คี่ · x(−t) = −x(t) → aₙ = 0", saw, (-2 * PI, 2 * PI), [-PI, PI], "w3"),
        (30, 176, "ครึ่งคลื่น · x(t + T/2) = −x(t) → n คี่", lambda t: 0.8 * math.sin(t) + 0.35 * math.sin(3 * t + 1.0), (0, 4 * PI), [], "w4"),
        (350, 176, "เสี้ยวคลื่น · ครึ่งคลื่น + คี่ → bₙ, n คี่", lambda t: quasi(t, PI / 6), (0, 4 * PI), [PI / 6, 5 * PI / 6, 7 * PI / 6, 11 * PI / 6, 13 * PI / 6, 17 * PI / 6, 19 * PI / 6, 23 * PI / 6], "w1"),
    ]
    for x0, y0, title, fn, (a, b), br, cls in panels:
        s.text(x0, y0 + 14, title, "th")
        fr = Frame(s, x0 + 4, y0 + 30, 270, 100, a, b, -1.25, 1.25)
        fr.zero(arrow=False)
        if a < 0:
            s.line(fr.X(0), fr.y - 4, fr.X(0), fr.y + fr.h + 4, "ax")
        fr.curve(fn, cls, 360, breaks=br)
    # visual hints
    fr = Frame(s, 34, 206, 270, 100, 0, 4 * PI, -1.25, 1.25)
    for k in (1, 2, 3):
        fr.vline(k * PI, "dsh")
    s.text(34, 320, "ทุกครึ่งคาบ (เส้นประ) รูปเดิมกลับหัว", "tk")
    s.text(354, 320, "α = 30°: ศูนย์ที่ขอบ · ไม่มี n = 3, 9, 15", "tk")
    return s.svg()


# ======================================================================= 12.4 complex spectrum
@fig("fs-cs-sided")
def cs_sided():
    s = Svg(660, 320, "สเปกตรัมของคลื่นสี่เหลี่ยมบวกลบหนึ่ง: บนเป็นสเปกตรัมสองด้านขนาดของ cn ที่ n บวกและลบ แต่ละเส้นสูง 2 ส่วน pi n ล่างเป็นสเปกตรัมด้านเดียว An เท่ากับ 4 ส่วน pi n สูงเป็นสองเท่า", "fs-cs-sided")
    top = Frame(s, 50, 30, 560, 100, -12, 12, 0, 1.35)
    top.zero(arrow=False)
    top.bars([(n, 2 / (PI * abs(n))) for n in range(-11, 12) if n % 2], "bar", 9)
    top.xticks([-11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11], lambda v: mono(str(v)), y=146)
    s.text(50, 22, "สองด้าน |cₙ| (ความถี่ลบ + บวก)", "th")
    s.text(top.X(1) + 8, top.Y(2 / PI) - 2, "0.637", "tk")
    s.text(top.X(-1) - 8, top.Y(2 / PI) - 2, "0.637", "tk", "end")
    bot = Frame(s, 50, 186, 560, 100, -12, 12, 0, 1.35)
    bot.zero(arrow=False)
    s.line(bot.X(0), bot.y, bot.X(0), bot.y + bot.h, "dsh")
    bot.bars([(n, 4 / (PI * n)) for n in range(1, 12, 2)], "bar2", 9)
    bot.xticks([1, 3, 5, 7, 9, 11], y=302)
    s.text(50, 178, "ด้านเดียว Aₙ = 2|cₙ| (ที่เครื่องวัดแสดง)", "th")
    s.text(bot.X(1) + 8, bot.Y(4 / PI) + 4, "1.273", "tk")
    s.text(bot.X(-6), bot.Y(0.6), "ไม่มีความถี่ลบ", "tk", "middle")
    s.text(616, 140, "n", "tk")
    s.text(616, 296, "n", "tk")
    return s.svg()


def sinc(x):
    return 1.0 if abs(x) < 1e-12 else math.sin(PI * x) / (PI * x)


@fig("fs-cs-sinc")
def cs_sinc():
    s = Svg(660, 330, "แอมพลิจูดฮาร์มอนิกของพัลส์ดิวตี้ 0.25 ด้านบนและ 0.1 ด้านล่าง เส้นประคือเอนเวโลป sinc ฮาร์มอนิกที่ 4 และ 8 ของดิวตี้ 0.25 และที่ 10 และ 20 ของดิวตี้ 0.1 หายไปเพราะตกที่ศูนย์ของ sinc", "fs-cs-sinc")
    for (y0, D, N, zeros) in ((26, 0.25, 24, (4, 8, 12, 16, 20, 24)), (184, 0.1, 30, (10, 20, 30))):
        fr = Frame(s, 50, y0 + 14, 560, 100, 0, N + 1, 0, 0.55)
        fr.zero(arrow=False)
        fr.curve(lambda f: 2 * D * abs(sinc(f * D)), "env", 500, a=0.01, b=N + 0.99)
        fr.bars([(n, 2 * D * abs(sinc(n * D))) for n in range(1, N + 1)], "bar", 7 if N > 25 else 8)
        fr.xticks(list(range(0, N + 1, 2 if N < 25 else 5))[1:], y=y0 + 130)
        s.text(50, y0 + 6, f"D = {D:g}: A₁ = {2 * D * sinc(D):.3f}A · ศูนย์ที่ n = {', '.join(str(z) for z in zeros[:3])} …", "th")
        for z in zeros:
            if z <= N:
                s.text(fr.X(z), fr.Y(0) - 4, "×", "lba", "middle")
        s.text(616, y0 + 116, "n", "tk")
    return s.svg()


# ======================================================================= 12.5 convergence, Gibbs, Parseval
@fig("fs-gibbs")
def gibbs():
    s = Svg(660, 270, "ผลรวมอนุกรมของคลื่นสี่เหลี่ยมถึงฮาร์มอนิกที่ 9 สีฟ้าและที่ 49 สีส้ม ยอดเกินใกล้รอยกระโดดสูงราว 1.18 เท่ากันทั้งสองเส้น แค่แคบลง เส้นประที่ 1.179 คือขีดจำกัดของกิบส์", "fs-gibbs")
    fr = Frame(s, 50, 24, 540, 210, -0.15 * PI, 1.15 * PI, -1.35, 1.35)
    fr.yticks([-1, 0, 1], lambda v: mono(f"{v:g}"), True)
    fr.zero(xlabel="t")
    fr.curve(sq, "w0", 4, breaks=[0, PI])
    ps = lambda N: (lambda t: sum(4 / (PI * n) * math.sin(n * t) for n in range(1, N + 1, 2)))
    fr.curve(ps(9), "w2", 500)
    fr.curve(ps(49), "w1", 1400)
    fr.hline(1.1790, "dsh", "1.179")
    fr.xticks([0, PI / 2, PI], lambda v: ["0", "T/4", "T/2"][int(round(v / (PI / 2)))])
    lx = 380
    for i, (cls, lab) in enumerate([("w2", "N = 9"), ("w1", "N = 49"), ("w0", "สี่เหลี่ยม")]):
        s.line(lx + i * 92, 258, lx + 22 + i * 92, 258, cls)
        s.text(lx + 28 + i * 92, 262, lab, "th")
    return s.svg()


@fig("fs-decay")
def decay():
    s = Svg(660, 292, "แอมพลิจูดเป็นเดซิเบลเทียบลำดับฮาร์มอนิกแบบลอการิทึม: สี่เหลี่ยมลด 1 ส่วน n หรือ ลบ 20 dB ต่อดีเคด สามเหลี่ยมลด 1 ส่วน n กำลังสอง ลบ 40 dB ต่อดีเคด และพาราโบลาต่อกันลด 1 ส่วน n กำลังสาม ลบ 60 dB ต่อดีเคด", "fs-decay")
    fr = Frame(s, 60, 20, 500, 220, 1, 60, -90, 5, logx=True)
    fr.yticks([0, -20, -40, -60, -80], lambda v: mono(f"{v:g}"), True)
    for v in (1, 10):
        s.line(fr.X(v), fr.y, fr.X(v), fr.y + fr.h, "gr")
    fr.xticks([1, 3, 5, 10, 20, 50])
    s.text(fr.x + fr.w + 6, fr.y + fr.h + 14, "n", "tk")
    s.text(fr.x - 40, fr.y - 6, "dB", "tk")
    odd = [n for n in range(1, 60, 2)]
    for p, cls, lab in ((1, "w2", "สี่เหลี่ยม 1/n · −20 dB/dec"), (2, "w3", "สามเหลี่ยม 1/n² · −40 dB/dec"), (3, "w4", "t(π − t) 1/n³ · −60 dB/dec")):
        data = [(n, -20 * p * math.log10(n)) for n in odd if -20 * p * math.log10(n) > -90]
        fr.pts(data, cls)
        for n, v in data:
            if n <= 15:
                s.circle(fr.X(n), fr.Y(v), 2.6, "dot")
        s.line(100, 150 + 22 * p, 124, 150 + 22 * p, cls)
        s.text(130, 154 + 22 * p, lab, "th")
    s.text(64, 284, "ยิ่งเรียบ (ไม่กระโดด ไม่หักมุม) ยิ่งลดเร็ว → ฮาร์มอนิกน้อย", "th")
    return s.svg()


# ======================================================================= 12.7 circuit analysis
@fig("fs-ca-flow")
def ca_flow():
    s = Svg(660, 270, "แผนภาพการวิเคราะห์วงจรด้วยอนุกรมฟูเรียร์: อินพุตคลื่นสี่เหลี่ยมถูกแยกเป็น DC และไซน์ที่ n เท่ากับ 1 3 5 แต่ละตัวคูณ H ของ j n omega ศูนย์ของตัวเอง แล้วรวมกันที่ขาออก", "fs-ca-flow")
    # input
    fr = Frame(s, 18, 112, 90, 50, 0, 4 * PI, -1.3, 1.3)
    fr.zero(arrow=False)
    fr.curve(lambda t: sq(t), "w1", 8, breaks=[PI, 2 * PI, 3 * PI])
    s.text(18, 100, "x(t)", "lb")
    s.rect(122, 104, 70, 66, "blk", 8)
    s.text(157, 132, "แยก", "th", "middle")
    s.text(157, 150, "T6", "tk", "middle")
    rows = [(36, "DC", None), (90, "n = 1", 1), (146, "n = 3", 3), (202, "n = 5", 5)]
    for y, lab, n in rows:
        s.poly([(192, 137), (214, 137), (214, y + 20), (236, y + 20)], "wire", arrow=True)
        sf = Frame(s, 240, y + 4, 70, 32, 0, 2 * PI, -1.3, 1.3)
        sf.zero(arrow=False)
        if n:
            sf.curve(lambda t, n=n: math.sin(n * t), "w2", 120)
        else:
            sf.curve(lambda t: 0.6, "w2", 2)
        s.text(240, y, lab, "tk")
        s.line(316, y + 20, 340, y + 20, "wire", arrow=True)
        s.rect(344, y + 4, 104, 32, "blk", 6)
        s.text(396, y + 25, "H(0)" if not n else f"H(j{n}ω₀)", "lb", "middle")
        s.line(448, y + 20, 470, y + 20, "wire", arrow=True)
        of = Frame(s, 474, y + 4, 60, 32, 0, 2 * PI, -1.3, 1.3)
        of.zero(arrow=False)
        g = 1 / math.sqrt(1 + (n * 1.6) ** 2) if n else 1.0
        ph = -math.atan(n * 1.6) if n else 0
        if n:
            of.curve(lambda t, n=n, g=g, ph=ph: g * math.sin(n * t + ph), "w3", 120)
        else:
            of.curve(lambda t: 0.6, "w3", 2)
        s.poly([(538, y + 20), (556, y + 20), (556, 137), (570, 137)], "wire")
    s.add('<circle class="blk" cx="584" cy="137" r="14"/>')
    s.text(584, 142, "Σ", "lb", "middle")
    s.line(598, 137, 618, 137, "wire", arrow=True)
    s.text(622, 141, "y(t)", "lb")
    s.text(157, 254, "① แยก (A1)", "th", "middle")
    s.text(396, 254, "② คูณทีละความถี่ (A2)", "th", "middle")
    s.text(584, 254, "③ รวม (A3)", "th", "middle")
    return s.svg()


# ======================================================================= 12.8 power with harmonics
@fig("fs-ph-pqsd")
def ph_pqsd():
    s = Svg(560, 320, "ภาพเรขาคณิตของกำลังเมื่อมีฮาร์มอนิก: P กับ Q1 เป็นสามเหลี่ยมกำลังของฮาร์มอนิกหลัก กำลังความเพี้ยน D ตั้งฉากกับระนาบนั้น S คือเส้นทแยงของกล่อง PF เท่ากับ P ส่วน S", "fs-ph-pqsd")
    O = np.array([70.0, 250.0])
    ex = np.array([300.0, 0.0])      # P
    ey = np.array([0.0, -150.0])     # Q1
    ez = np.array([130.0, -70.0])    # D (depth)
    P, Q, D = 1.0, 0.75, 0.6
    p = lambda a, b, c: O + a * ex + b * ey + c * ez
    V = {k: p(*k) for k in [(a, b, c) for a in (0, P) for b in (0, Q) for c in (0, D)]}
    edges = [((0, 0, 0), (P, 0, 0)), ((0, 0, 0), (0, Q, 0)), ((0, 0, 0), (0, 0, D)), ((P, 0, 0), (P, Q, 0)), ((P, 0, 0), (P, 0, D)), ((0, Q, 0), (P, Q, 0)), ((0, Q, 0), (0, Q, D)), ((0, 0, D), (P, 0, D)), ((0, 0, D), (0, Q, D)), ((P, Q, 0), (P, Q, D)), ((P, 0, D), (P, Q, D)), ((0, Q, D), (P, Q, D))]
    for a, b in edges:
        s.line(*V[a], *V[b], "dsh")
    s.poly([V[(0, 0, 0)], V[(P, 0, 0)], V[(P, Q, 0)]], "fill1", close=True)
    s.line(*V[(0, 0, 0)], *V[(P, 0, 0)], "w2", arrow=True)
    s.line(*V[(P, 0, 0)], *V[(P, Q, 0)], "w3", arrow=True)
    s.line(*V[(P, Q, 0)], *V[(P, Q, D)], "w4", arrow=True)
    s.line(*V[(0, 0, 0)], *V[(P, Q, 0)], "w0")
    s.line(*V[(0, 0, 0)], *V[(P, Q, D)], "w1", arrow=True)
    m = (V[(0, 0, 0)] + V[(P, 0, 0)]) / 2
    s.text(m[0], m[1] + 20, "P = V₁I₁cos φ₁ (+ ฮาร์มอนิก)", "lb", "middle")
    m = (V[(P, 0, 0)] + V[(P, Q, 0)]) / 2
    s.text(m[0] + 8, m[1] + 30, "Q₁", "lb")
    m = (V[(P, Q, 0)] + V[(P, Q, D)]) / 2
    s.text(m[0] + 8, m[1] + 12, "D", "lb")
    m = (V[(0, 0, 0)] + V[(P, Q, 0)]) / 2
    s.text(m[0] + 30, m[1] + 36, "S₁", "tk")
    m = (V[(0, 0, 0)] + V[(P, Q, D)]) / 2
    s.text(m[0] - 18, m[1] - 10, "S", "lba")
    s.text(92, 236, "φ₁", "tk")
    s.text(20, 30, "S² = P² + Q₁² + D²", "lb")
    s.text(20, 52, "PF = P/S = DPF × (I₁/I)", "lb")
    s.text(20, 300, "คาปาซิเตอร์ลดได้แค่ Q₁ — D ยังอยู่ (H6, H7)", "th")
    return s.svg()


@fig("fs-ph-neutral")
def ph_neutral():
    s = Svg(660, 320, "บน: กระแสฮาร์มอนิกหลักของสามเฟสห่างกัน 120 องศา รวมกันเป็นศูนย์ในสายนิวทรัล ล่าง: ฮาร์มอนิกที่ 3 ของทั้งสามเฟสซ้อนทับกันพอดี รวมเป็นสามเท่าในนิวทรัล", "fs-ph-neutral")
    top = Frame(s, 50, 30, 470, 110, 0, 4 * PI, -1.3, 1.3)
    top.zero(arrow=False)
    for k, cls in enumerate(("w2", "w3", "w4")):
        top.curve(lambda t, k=k: math.sin(t - 2 * PI * k / 3), cls, 200)
    top.curve(lambda t: 0.0, "w1", 2)
    s.text(50, 22, "ฮาร์มอนิกหลัก (ลำดับบวก): a + b + c = 0", "th")
    s.text(528, top.Y(0) + 22, "iₙ = 0", "lba")
    bot = Frame(s, 50, 186, 470, 110, 0, 4 * PI, -3.3, 3.3)
    bot.zero(arrow=False)
    for k, cls in enumerate(("w2", "w3", "w4")):
        bot.curve(lambda t, k=k: math.sin(3 * (t - 2 * PI * k / 3)), cls, 300)
    bot.curve(lambda t: 3 * math.sin(3 * t), "w1", 300)
    s.text(50, 178, "ฮาร์มอนิกที่ 3 (ลำดับศูนย์): ทั้งสามเฟสทับกัน", "th")
    s.text(528, bot.Y(3) + 10, "iₙ = 3I₃", "lba")
    s.text(528, bot.Y(1) + 10, "เฟส a, b, c", "tk")
    for i, (cls, lab) in enumerate([("w2", "a"), ("w3", "b"), ("w4", "c"), ("w1", "นิวทรัล")]):
        s.line(530, 34 + i * 15, 552, 34 + i * 15, cls)
        s.text(558, 38 + i * 15, lab, "tk")
    return s.svg()


# ======================================================================= 12.9 rectifiers
@fig("fs-rect-6p")
def rect_6p():
    mu = deg(20)
    amp_i, _ = harmonics(block120, 25)
    amp_o, _ = harmonics(lambda t: block_overlap(t, mu), 25)
    s = Svg(660, 270, "ซ้าย: กระแสเฟส a ของบริดจ์ 6 พัลส์ บล็อก 120 องศาอุดมคติเป็นเส้นประ และเมื่อมีช่วงทับซ้อน 20 องศาเป็นเส้นสีส้ม ขวา: สเปกตรัมเป็นเปอร์เซ็นต์ของฮาร์มอนิกหลัก ที่ h เท่ากับ 5 7 11 13 17 19 23 25 แท่งจางคือ 1 ส่วน h แท่งเข้มคือเมื่อมีช่วงทับซ้อน", "fs-rect-6p")
    fr = Frame(s, 40, 36, 262, 170, -PI, PI, -1.3, 1.3)
    fr.zero(arrow=False)
    s.line(fr.X(0), fr.y - 4, fr.X(0), fr.y + fr.h, "ax")
    fr.curve(block120, "w0", 4, breaks=[-2 * PI / 3, -PI / 3, PI / 3, 2 * PI / 3])
    fr.curve(lambda t: block_overlap(t, mu), "w1", 600)
    fr.xticks([-PI, -PI / 3, PI / 3, PI], lambda v: {-3: "−180°", -1: "−60°", 1: "60°", 3: "180°"}[int(round(v * 3 / PI))])
    s.text(40, 24, "iₐ / I_d · μ = 20°", "lb")
    sp = Frame(s, 370, 36, 260, 170, 0, 26, 0, 21)
    sp.yticks([0, 10, 20], lambda v: f"{v:g} %", True)
    sp.zero(arrow=False)
    hs = [5, 7, 11, 13, 17, 19, 23, 25]
    sp.bars([(h - 0.35, 100 * amp_i[h] / amp_i[1]) for h in hs], "barg", 7)
    sp.bars([(h + 0.35, 100 * amp_o[h] / amp_o[1]) for h in hs], "bar", 7)
    sp.xticks(hs, y=222)
    s.text(634, 222, "h", "tk", "end")
    s.text(sp.X(5) + 8, sp.Y(100 * amp_o[5] / amp_o[1]) - 4, f"{100 * amp_o[5] / amp_o[1]:.1f}", "tk")
    s.text(sp.X(7) + 8, sp.Y(100 * amp_o[7] / amp_o[1]) - 4, f"{100 * amp_o[7] / amp_o[1]:.1f}", "tk")
    s.rect(380, 248, 12, 10, "barg")
    s.text(398, 257, "อุดมคติ 1/h", "tk")
    s.rect(500, 248, 12, 10, "bar")
    s.text(518, 257, "μ = 20°", "tk")
    return s.svg()


@fig("fs-rect-12p")
def rect_12p():
    r3 = math.sqrt(3)

    def yd(t):  # Y-Δ bridge current referred to the primary (staircase), in phase with Y-Y fundamental
        u = (wrap(t + PI)) - PI
        a = abs(u)
        sgn = 1.0
        if a > PI / 2:
            sgn, a = -1.0, PI - a
        if a < PI / 6:
            return sgn * 2 / r3
        return sgn * 1 / r3

    s = Svg(660, 270, "กระแสด้านปฐมภูมิของเรกติไฟเออร์ 12 พัลส์ สีส้ม คือผลรวมของกระแสบริดจ์ Y-Y สีฟ้าซึ่งเป็นบล็อก 120 องศา กับกระแสบริดจ์ Y-Delta สีเขียวซึ่งเป็นขั้นบันได ผลรวมเป็นขั้นบันไดใกล้ไซน์ ฮาร์มอนิกที่ 5 และ 7 หักล้างกัน", "fs-rect-12p")
    fr = Frame(s, 40, 30, 470, 200, -PI, PI, -2.4, 2.4)
    fr.zero(arrow=False)
    s.line(fr.X(0), fr.y - 4, fr.X(0), fr.y + fr.h, "ax")
    br = [k * PI / 6 for k in range(-6, 7)]
    fr.curve(block120, "w2", 4, breaks=br)
    fr.curve(yd, "w3", 4, breaks=br)
    fr.curve(lambda t: block120(t) + yd(t), "w1", 4, breaks=br)
    fr.curve(lambda t: 2 * (2 * r3 / PI) * math.cos(t), "w0", 200)
    fr.xticks([-PI, -PI / 2, PI / 2, PI], lambda v: {-6: "−180°", -3: "−90°", 3: "90°", 6: "180°"}[int(round(v * 6 / PI))])
    for i, (cls, lab) in enumerate([("w2", "บริดจ์ Y-Y"), ("w3", "บริดจ์ Y-Δ"), ("w1", "รวม 12 พัลส์"), ("w0", "ฮาร์มอนิกหลัก")]):
        s.line(528, 50 + i * 26, 552, 50 + i * 26, cls)
        s.text(558, 54 + i * 26, lab, "th")
    s.text(528, 170, "เหลือ h = 12k ± 1", "lb")
    s.text(528, 190, "11, 13, 23, 25 …", "tk")
    return s.svg()


# ======================================================================= 12.10 inverters
@fig("fs-inv-quasi")
def inv_quasi():
    a = deg(30)
    s = Svg(660, 252, "รูปคลื่นสี่เหลี่ยมสามระดับ quasi-square มุม alpha 30 องศาสีส้ม และฮาร์มอนิกหลักสีฟ้า ช่วงศูนย์กว้าง 30 องศาที่ขอบแต่ละด้านทำให้ฮาร์มอนิกที่ 3 หายไป", "fs-inv-quasi")
    fr = Frame(s, 40, 26, 520, 180, 0, 2 * PI, -1.4, 1.4)
    for x0, x1 in ((0, a), (PI - a, PI + a), (2 * PI - a, 2 * PI)):
        s.rect(fr.X(x0), fr.y, fr.X(x1) - fr.X(x0), fr.h, "fill2")
    fr.zero(xlabel="ωt")
    fr.yaxis()
    fr.curve(lambda t: quasi(t, a), "w1", 4, breaks=[a, PI - a, PI + a, 2 * PI - a])
    fr.curve(lambda t: 4 / PI * math.cos(a) * math.sin(t), "w2", 200)
    fr.hline(1, "gr")
    s.text(fr.X(a / 2), fr.y + 14, "α", "lba", "middle")
    s.text(fr.X(PI), fr.y + 14, "2α", "lba", "middle")
    fr.xticks([a, PI - a, PI + a, 2 * PI - a], lambda v: f"{round(v * 180 / PI)}°")
    s.text(568, fr.Y(1) + 4, "V_dc", "tk")
    s.text(40, 246, "A₁ = (4V_dc/π)cos 30° = 1.10V_dc · A₃ = (4V_dc/3π)cos 90° = 0", "lb")
    return s.svg()


def spwm_wave(ma, mf, M=1 << 15):
    th = np.arange(M) * 2 * PI / M
    ref = ma * np.sin(th)
    u = (th * mf / (2 * PI)) % 1.0
    car = np.where(u < 0.25, 4 * u, np.where(u < 0.75, 2 - 4 * u, 4 * u - 4))
    return th, ref, car, np.where(ref > car, 1.0, -1.0)


@fig("fs-inv-spwm")
def inv_spwm():
    ma, mf = 0.8, 15
    th, ref, car, out = spwm_wave(ma, mf)
    X = np.fft.rfft(out) / len(out)
    amp = 2 * np.abs(X)
    s = Svg(660, 360, "บน: สัญญาณอ้างอิงไซน์สีส้ม ma 0.8 เทียบพาหะสามเหลี่ยม mf 15 ได้พัลส์ไบโพลาร์สีฟ้า ล่าง: สเปกตรัมของแรงดันขาออก ฮาร์มอนิกหลัก 0.8 แล้วว่างไปจนถึงกลุ่มไซด์แบนด์รอบ 15 และ 30 และ 45", "fs-inv-spwm")
    fr = Frame(s, 40, 20, 560, 110, 0, 2 * PI, -1.15, 1.15)
    fr.zero(arrow=False)
    cpts = []
    for k in range(mf):
        cpts += [(2 * PI * (k + q) / mf, v) for q, v in ((0, 0), (0.25, 1), (0.75, -1))]
    cpts.append((2 * PI, 0))
    fr.pts(cpts, "w0")
    fr.pts([(th[i], ref[i]) for i in range(0, len(th), 64)], "w1")
    pw = Frame(s, 40, 140, 560, 50, 0, 2 * PI, -1.2, 1.2)
    pw.zero(arrow=False)
    # pulse polyline with exact edges
    pts = [(th[0], out[0])]
    for i in range(1, len(th)):
        if out[i] != out[i - 1]:
            pts += [(th[i], out[i - 1]), (th[i], out[i])]
    pts.append((2 * PI, out[-1]))
    pw.pts(pts, "w2")
    s.text(606, 64, "vᵣ, v_tri", "tk")
    s.text(606, 170, "vₐₒ", "tk")
    sp = Frame(s, 40, 222, 560, 100, 0, 51, 0, 0.9)
    sp.yticks([0, 0.4, 0.8], lambda v: f"{v:g}", True)
    sp.zero(arrow=False)
    sp.bars([(h, amp[h]) for h in range(1, 51) if amp[h] > 0.004], "bar", 6)
    sp.xticks([1, 15, 30, 45], lambda v: {1: "1", 15: "m_f", 30: "2m_f", 45: "3m_f"}[v], y=338)
    s.text(sp.X(1) + 8, sp.Y(amp[1]) + 4, f"{amp[1]:.2f}", "tk")
    s.text(sp.X(15) + 8, sp.Y(amp[15]) + 4, f"{amp[15]:.2f}", "tk")
    s.text(606, 338, "h", "tk")
    s.text(40, 214, "สเปกตรัม (หน่วย V_dc/2)", "th")
    return s.svg()


# ======================================================================= 12.11 DC-DC
@fig("fs-buck-node")
def buck_node():
    Vin, D, fs, L, C, R = 12.0, 5 / 12, 50e3, 100e-6, 100e-6, 2.5
    w0 = 2 * PI * fs
    N = 600
    cn = []
    for n in range(1, N + 1):
        c = Vin / (n * 2 * PI) * 1j * (np.exp(-1j * 2 * PI * n * D) - 1)  # complex coefficient c_n of the 0..Vin pulse
        wn = n * w0
        Zp = 1 / (1 / R + 1j * wn * C)
        H = Zp / (1j * wn * L + Zp)
        cn.append((n, c, H))
    t = np.linspace(0, 3 / fs, 1201)
    vo = Vin * D + sum(2 * (c * H * np.exp(1j * n * w0 * t)).real for n, c, H in cn)
    ripple = vo.max() - vo.min()
    s = Svg(660, 340, f"บั๊ก 12 โวลต์เป็น 5 โวลต์ที่ 50 กิโลเฮิรตซ์: แรงดันโหนดสวิตช์สีฟ้าเป็นพัลส์ 0 ถึง 12 โวลต์ แรงดันขาออกสีส้มขยาย 200 เท่ารอบ 5 โวลต์ ริปเปิลยอดถึงยอด {ripple * 1000:.1f} มิลลิโวลต์ ด้านล่างเป็นสเปกตรัมของโหนดสวิตช์ DC 5 โวลต์ ฮาร์มอนิกที่ 50 กิโลเฮิรตซ์ 7.38 โวลต์ 100 กิโลเฮิรตซ์ 1.91 และ 150 กิโลเฮิรตซ์ 1.80", "fs-buck-node")
    fr = Frame(s, 50, 20, 520, 150, 0, 60, -0.5, 13.5)
    fr.yticks([0, 5, 12], lambda v: f"{v:g} V", True)
    fr.zero(arrow=False)
    sw = lambda tt: Vin if (tt * 1e-6 * fs) % 1 < D else 0.0
    fr.curve(sw, "w2", 6, breaks=[k * 20 + d for k in range(3) for d in (0, 20 * D)] + [20, 40])
    fr.pts([(tt * 1e6, 5 + 200 * (v - Vin * D)) for tt, v in zip(t, vo)], "w1")
    fr.xticks([0, 20, 40, 60], lambda v: f"{v} µs")
    s.text(578, fr.Y(12) + 4, "v_sw", "tk")
    s.text(578, fr.Y(5) + 4, "v_o ×200", "tk")
    s.text(50, 204, f"ริปเปิลจริง (ผลรวม {N} ฮาร์มอนิก) = {ripple * 1000:.1f} mVpp · ประมาณด้วยฮาร์มอนิกแรก (B3) = 14.96 mVpp", "th")
    amps = [Vin * D] + [2 * abs(c) for n, c, H in cn[:10]]
    sp = Frame(s, 50, 220, 520, 90, -0.5, 10.5, 0, 8.4)
    sp.zero(arrow=False)
    sp.bars([(0, amps[0])], "bar2", 14)
    sp.bars([(n, amps[n]) for n in range(1, 11)], "bar", 14)
    sp.xticks(range(0, 11), lambda v: "DC" if v == 0 else f"{50 * v}", y=326)
    for n in range(0, 4):
        s.text(sp.X(n) + 10, sp.Y(amps[n]) + 4, f"{amps[n]:.2f}", "tk")
    s.text(578, 326, "kHz", "tk")
    return s.svg()


@fig("fs-emi-env")
def emi_env():
    A, f0, D = 12.0, 500e3, 0.42
    tau = D / f0
    f1 = 1 / (PI * tau)
    s = Svg(660, 300, "เอนเวโลปสเปกตรัมของโหนดสวิตช์ 12 โวลต์ 500 กิโลเฮิรตซ์ ดิวตี้ 0.42 เป็น dB ไมโครโวลต์ เทียบเวลาขาขึ้น 10 นาโนวินาทีสีส้ม กับ 50 นาโนวินาทีสีฟ้า ที่ 30 เมกะเฮิรตซ์ได้ 102.1 และ 88.6 dB ไมโครโวลต์ ต่างกันราว 13.5 dB", "fs-emi-env")
    fr = Frame(s, 70, 24, 500, 220, 1e5, 3e8, 60, 150, logx=True)
    fr.yticks([60, 80, 100, 120, 140], lambda v: f"{v:g}", True)
    for f in (1e5, 1e6, 1e7, 1e8):
        s.line(fr.X(f), fr.y, fr.X(f), fr.y + fr.h, "gr")
    fr.xticks([1e5, 1e6, 1e7, 1e8], lambda v: {5: "100k", 6: "1M", 7: "10M", 8: "100M"}[int(round(math.log10(v)))])
    s.text(fr.x + fr.w + 6, fr.y + fr.h + 14, "Hz", "tk")
    s.text(fr.x - 56, fr.y - 8, "dBµV", "tk")
    env = lambda f, tr: 20 * math.log10(2 * A * D * min(1, 1 / (PI * f * tau)) * min(1, 1 / (PI * f * tr)) * 1e6)
    for tr, cls in ((50e-9, "w2"), (10e-9, "w1")):
        fr.curve(lambda f, tr=tr: env(f, tr), cls, 300, breaks=[f1, 1 / (PI * tr)])
        f2 = 1 / (PI * tr)
        s.circle(fr.X(f2), fr.Y(env(f2, tr)), 3.2, "dot")
    s.circle(fr.X(f1), fr.Y(env(f1, 1e-9)), 3.2, "dot")
    s.text(fr.X(f1) + 6, fr.Y(env(f1, 1e-9)) - 8, "f₁ = 379 kHz", "tk")
    fr.vline(30e6, "dsh")
    for tr in (10e-9, 50e-9):
        v = env(30e6, tr)
        s.text(fr.X(30e6) + 8, fr.Y(v) + (-8 if tr < 2e-8 else 16), f"{v:.1f}", "lba")
    s.text(fr.X(30e6), fr.y - 6, "30 MHz", "tk", "middle")
    for i, (cls, lab) in enumerate([("w1", "t_r = 10 ns · f₂ = 31.8 MHz"), ("w2", "t_r = 50 ns · f₂ = 6.37 MHz")]):
        s.line(80 + i * 270, 286, 104 + i * 270, 286, cls)
        s.text(110 + i * 270, 290, lab, "tk")
    return s.svg()


# ======================================================================= 12.12 mitigation
@fig("fs-mit-imp")
def mit_imp():
    # per unit on the transformer base: 1000 kVA, z = 6 % (X/R ≈ 6), 600 kvar bank, linear load 0.6 pu as damping
    Xs, Rs = 0.06, 0.01
    Xc = 1 / 0.6
    p = 0.07
    Xc_d = Xc * (1 - p)  # detuned bank sized for the same net kvar
    Xl_d = p * Xc_d
    Rload = 1 / 0.6

    def z(h, kind):
        Zs = Rs * math.sqrt(h) + 1j * h * Xs
        Y = 1 / Zs + 1 / Rload
        if kind == "plain":
            Y += 1 / (-1j * Xc / h)
        elif kind == "det":
            Y += 1 / (0.004 * math.sqrt(h) + 1j * (h * Xl_d - Xc_d / h))
        return abs(1 / Y)

    s = Svg(660, 290, "อิมพีแดนซ์ที่กระแสฮาร์มอนิกของโหลดมองเห็นเทียบลำดับฮาร์มอนิก หม้อแปลงอย่างเดียวเป็นเส้นประเพิ่มขึ้นตาม h คาปาซิเตอร์เปล่าสีแดงมียอดเรโซแนนซ์ที่ h ราว 5.3 ใกล้ฮาร์มอนิกที่ 5 คาปาซิเตอร์ดีจูน 7 เปอร์เซ็นต์สีฟ้ามียอดถูกย้ายไปต่ำกว่า 3.78 ที่ไม่มีฮาร์มอนิกของไดรฟ์", "fs-mit-imp")
    fr = Frame(s, 70, 24, 500, 210, 1, 14, 0.02, 3, logy=True)
    for v in (0.05, 0.1, 0.2, 0.5, 1, 2):
        s.line(fr.x, fr.Y(v), fr.x + fr.w, fr.Y(v), "gr")
        s.text(fr.x - 6, fr.Y(v) + 4, f"{v:g}", "tk", "end")
    s.text(fr.x - 48, fr.y - 8, "|Z| (pu)", "tk")
    for h in (5, 7, 11, 13):
        fr.vline(h, "dsh")
    fr.xticks([1, 3, 5, 7, 9, 11, 13])
    s.text(fr.x + fr.w + 6, fr.y + fr.h + 14, "h", "tk")
    s.line(fr.x, fr.y + fr.h, fr.x + fr.w, fr.y + fr.h, "ax")
    s.line(fr.x, fr.y + fr.h, fr.x, fr.y, "ax")
    fr.curve(lambda h: z(h, "none"), "w0", 200)
    fr.curve(lambda h: z(h, "plain"), "w6", 600)
    fr.curve(lambda h: z(h, "det"), "w2", 600)
    hr = math.sqrt(Xc / Xs)
    hp = math.sqrt(Xc_d / (Xs + Xl_d))
    s.text(fr.X(hr) + 10, fr.Y(z(hr, "plain")) - 8, f"h_r = {hr:.2f}", "lb")
    s.text(fr.X(hp) - 6, fr.Y(z(hp, "det")) - 4, f"{hp:.2f}", "lb", "end")
    s.text(fr.X(1 / math.sqrt(p)) + 6, fr.Y(0.026), "h_t = 3.78", "tk")
    s.text(fr.X(5), fr.y - 6, "ฮาร์มอนิกของไดรฟ์ 5 7 11 13", "tk")
    for i, (cls, lab) in enumerate([("w0", "หม้อแปลง 6 %"), ("w6", "+ คาปาซิเตอร์ 600 kvar"), ("w2", "+ ดีจูน 7 %")]):
        x0 = [70, 230, 430][i]
        s.line(x0, 274, x0 + 24, 274, cls)
        s.text(x0 + 30, 278, lab, "th")
    return s.svg()


# ======================================================================= 12.13 DFT
@fig("fs-dft-leak")
def dft_leak():
    fsamp, Tw = 5000, 0.2
    M = int(fsamp * Tw)
    t = np.arange(M) / fsamp
    s = Svg(660, 330, "สเปกตรัม DFT ช่อง 0 ถึง 20 ของไซน์ 50.0 เฮิรตซ์ด้านบนและ 50.5 เฮิรตซ์ด้านล่าง ในหน้าต่าง 200 มิลลิวินาที หน้าต่างสี่เหลี่ยม ความละเอียด 5 เฮิรตซ์ต่อช่อง 50.0 เฮิรตซ์มีช่องเดียวคือช่อง 10 ส่วน 50.5 เฮิรตซ์รั่วไปช่อง 9 และ 11 และไกลออกไป", "fs-dft-leak")
    for y0, f in ((22, 50.0), (182, 50.5)):
        x = np.sin(2 * PI * f * t)
        X = 2 * np.abs(np.fft.rfft(x)) / M
        db = 20 * np.log10(np.maximum(X[:21], 1e-6))
        fr = Frame(s, 60, y0 + 14, 520, 100, -0.6, 20.6, -60, 3)
        fr.yticks([0, -20, -40, -60], lambda v: mono(f"{v:g}"), True)
        fr.bars([(k, db[k]) for k in range(21)], "bar" if f == 50.0 else "bar2", 12, base=-60)
        fr.xticks(range(0, 21, 2), y=y0 + 130)
        s.text(60, y0 + 6, f"ไซน์ {f:.1f} Hz · หน้าต่าง 200 ms (Δf = 5 Hz) · ช่อง 10 = {X[10]:.3f}" + (" (ตรง)" if f == 50.0 else f" · ช่อง 9, 11 = {db[9]:.1f}, {db[11]:.1f} dB"), "th")
        s.text(586, y0 + 128, "k", "tk")
        s.text(20, y0 + 20, "dB", "tk")
    return s.svg()


# ======================================================================= 12.6 waveform thumbnails
def thumb(key, label, fn, periods=2, breaks=(), ref=None, yr=(-1.25, 1.25), n=300, extra=None):
    s = Svg(300, 78, label, key)
    a, b = 0, periods * 2 * PI
    fr = Frame(s, 6, 6, 286, 64, a - 0.04 * PI, b + 0.04 * PI, *yr)
    fr.zero(arrow=False)
    s.line(fr.X(0), fr.y, fr.X(0), fr.y + fr.h, "gr")
    if ref:
        fr.curve(ref, "w0", 160, a=a, b=b)
    if extra:
        extra(s, fr)
    fr.curve(fn, "w1", n, a=a, b=b, breaks=[x + 2 * PI * k for k in range(periods + 1) for x in breaks])
    return s.svg()


WT = {
    "fs-wt-square": ("คลื่นสี่เหลี่ยมบวกลบ A ขาขึ้นที่ t เท่ากับ 0", lambda t: sq(t), dict(breaks=[0, PI], n=4)),
    "fs-wt-square01": ("คลื่นสี่เหลี่ยม 0 ถึง A ดิวตี้ 50 เปอร์เซ็นต์", lambda t: 1.0 if sq(t) > 0 else 0.0, dict(breaks=[0, PI], n=4, yr=(-0.3, 1.25))),
    "fs-wt-pulse": ("พัลส์ดิวตี้ D 25 เปอร์เซ็นต์ เริ่มที่ t เท่ากับ 0", lambda t: 1.0 if wrap(t) < PI / 2 else 0.0, dict(breaks=[0, PI / 2], n=4, yr=(-0.3, 1.25))),
    "fs-wt-triangle": ("คลื่นสามเหลี่ยมบวกลบ A ขาขึ้นผ่าน 0 ที่ t เท่ากับ 0", tri, dict(breaks=[PI / 2, 3 * PI / 2], n=8)),
    "fs-wt-sawtooth": ("คลื่นฟันเลื่อยบวกลบ A ผ่าน 0 ขาขึ้นที่ t เท่ากับ 0", saw, dict(breaks=[PI], n=8)),
    "fs-wt-halfwave": ("ไซน์เรียงกระแสครึ่งคลื่น", lambda t: max(math.sin(t), 0.0), dict(yr=(-1.15, 1.15), ref=lambda t: math.sin(t))),
    "fs-wt-fullwave": ("ไซน์เรียงกระแสเต็มคลื่น", lambda t: abs(math.sin(t)), dict(yr=(-1.15, 1.15), ref=lambda t: math.sin(t))),
    "fs-wt-sixpulse": ("กระแสไลน์ของเรกติไฟเออร์ 6 พัลส์ บล็อก 120 องศา", lambda t: block120(t), dict(breaks=[PI / 3, 2 * PI / 3, 4 * PI / 3, 5 * PI / 3], n=4, ref=lambda t: math.cos(t))),
    "fs-wt-triac": ("กระแสไตรแอกตัดเฟสที่มุม 90 องศา โหลดตัวต้านทาน", lambda t: math.sin(t) if (wrap(t) % PI) > PI / 2 else 0.0, dict(breaks=[PI / 2, 3 * PI / 2], n=300, ref=lambda t: math.sin(t))),
    "fs-wt-clipped": ("ไซน์ตัดยอดสมมาตรที่ระดับ 0.7", lambda t: max(-0.7, min(0.7, math.sin(t))), dict(ref=lambda t: math.sin(t))),
    "fs-wt-smps": ("กระแสพัลส์แหลมของ SMPS ไม่มี PFC ที่ยอดแรงดัน", lambda t: (lambda u: (math.copysign(1, math.sin(t)) * max(0.0, math.cos((u - deg(78)) * 3.2)) ** 2) if abs(u - deg(78)) < deg(28) else 0.0)(wrap(t) % PI), dict(n=500, ref=lambda t: 0.75 * math.sin(t))),
    "fs-wt-quasi": ("คลื่นสี่เหลี่ยมสามระดับ quasi-square มุม alpha 30 องศา", lambda t: quasi(t, PI / 6), dict(breaks=[PI / 6, 5 * PI / 6, 7 * PI / 6, 11 * PI / 6], n=4)),
    "fs-wt-sixstep": ("แรงดันเฟสของอินเวอร์เตอร์ six-step ขั้น 1 ส่วน 3 และ 2 ส่วน 3 ของ Vdc", lambda t: 1.5 * six_step(t), dict(breaks=[k * PI / 3 for k in range(6)], n=4, ref=lambda t: 1.5 * 2 / PI * math.sin(t) * 1.0)),
    "fs-wt-spwm": ("PWM ไบโพลาร์ที่สร้างจากไซน์ ma 0.8 mf 9", None, dict()),
    "fs-wt-trapezoid": ("พัลส์คางหมูมีเวลาขาขึ้นและขาลง", lambda t: (lambda u: min(1.0, u / 0.35) if u < 0.35 else (1.0 if u < 2.6 else max(0.0, 1 - (u - 2.6) / 0.35)))(wrap(t)), dict(breaks=[0, 0.35, 2.6, 2.95], n=4, yr=(-0.3, 1.25))),
    "fs-wt-asymtri": ("สามเหลี่ยมไม่สมมาตร ริปเปิลกระแสตัวเหนี่ยวนำ ดิวตี้ 0.3", lambda t: (lambda u: -1 + 2 * u / 0.3 if u < 0.3 else 1 - 2 * (u - 0.3) / 0.7)(wrap(t) / (2 * PI)), dict(breaks=[0, 0.6 * PI], n=4)),
}


def make_thumb(key):
    label, fn, kw = WT[key]
    if key == "fs-wt-spwm":
        th, ref, car, out = spwm_wave(0.8, 9, 1 << 13)
        s = Svg(300, 78, label, key)
        fr = Frame(s, 6, 6, 286, 64, -0.08 * PI, 4.08 * PI, -1.25, 1.25)
        fr.zero(arrow=False)
        s.line(fr.X(0), fr.y, fr.X(0), fr.y + fr.h, "gr")
        pts = []
        for per in range(2):
            off = per * 2 * PI
            pts.append((th[0] + off, out[0]))
            for i in range(1, len(th)):
                if out[i] != out[i - 1]:
                    pts += [(th[i] + off, out[i - 1]), (th[i] + off, out[i])]
            pts.append((2 * PI + off, out[-1]))
        fr.pts(pts, "w1")
        fr.curve(lambda t: 0.8 * math.sin(t), "w0", 160, a=0, b=4 * PI)
        return s.svg()
    return thumb(key, label, fn, **kw)


for _k in WT:
    FIGS[_k] = (lambda k: (lambda: make_thumb(k)))(_k)


# ======================================================================= inject
def inject(paths):
    for p in paths:
        src = open(p, encoding="utf8").read()

        def rep(m):
            key = m.group(1)
            if key not in FIGS:
                if "fourier-series" in p:
                    raise SystemExit(f"unknown figure {key} in {p}")
                return m.group(0)  # a figure owned by another script (fg_figs.py, cs_figs.py)
            if m.group(2) and not FORCE:
                return m.group(0)  # already rendered (use --all to redraw)
            return f"<!--FIG:{key}-->" + FIGS[key]() + "<!--/FIG-->"

        out, n = re.subn(r"<!--FIG:([\w-]+)-->(<svg[\s\S]*?</svg>)?<!--/FIG-->", rep, src)
        if out != src:
            open(p, "w", encoding="utf8").write(out)
        print(f"{os.path.basename(p)}: {n} figures")


FORCE = "--all" in sys.argv
if __name__ == "__main__":
    sys.argv = [a for a in sys.argv if a != "--all"]
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(root, "src/pages/learn/fourier-series/*.html"))) + [os.path.join(root, "src/pages/index.html")]
    inject(files)
