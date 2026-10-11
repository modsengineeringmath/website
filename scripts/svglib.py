# Small SVG helper library for the FG / oscilloscope lesson figures.
# Uses the CSS classes defined in assets/site.css under ".fgfig".
import math

TAU = 2 * math.pi


def f1(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


class Fig:
    _n = 0

    def __init__(self, w, h, label, key):
        Fig._n += 1
        self.w, self.h, self.label = w, h, label
        self.mid = f"{key}a"
        self.parts = []

    def add(self, s):
        self.parts.append(s)
        return self

    def svg(self):
        defs = (f'<defs><marker id="{self.mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
                f'orient="auto-start-reverse"><path class="ar-h" d="M0 0 L10 5 L0 10z"/></marker></defs>')
        lab = self.label.replace('"', "&quot;")
        return f'<svg viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}">' + defs + "".join(self.parts) + "</svg>"

    # ---- primitives
    def line(self, x1, y1, x2, y2, cls="ax", arrow=None):
        m = ""
        if arrow == "end":
            m = f' marker-end="url(#{self.mid})"'
        elif arrow == "both":
            m = f' marker-start="url(#{self.mid})" marker-end="url(#{self.mid})"'
        elif arrow == "start":
            m = f' marker-start="url(#{self.mid})"'
        return self.add(f'<line class="{cls}" x1="{f1(x1)}" y1="{f1(y1)}" x2="{f1(x2)}" y2="{f1(y2)}"{m}/>')

    def poly(self, pts, cls="w1", close=False, arrow=None):
        d = "M" + " L".join(f"{f1(x)} {f1(y)}" for x, y in pts) + (" Z" if close else "")
        m = f' marker-end="url(#{self.mid})"' if arrow == "end" else ""
        return self.add(f'<path class="{cls}" d="{d}"{m}/>')

    def path(self, d, cls="sw"):
        return self.add(f'<path class="{cls}" d="{d}"/>')

    def text(self, x, y, s, cls=None, anchor=None, style=None):
        a = f' class="{cls}"' if cls else ""
        a += f' text-anchor="{anchor}"' if anchor else ""
        a += f' style="{style}"' if style else ""
        return self.add(f'<text x="{f1(x)}" y="{f1(y)}"{a}>{s}</text>')

    def rect(self, x, y, w, h, cls="bx", rx=6):
        return self.add(f'<rect class="{cls}" x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" rx="{rx}"/>')

    def circle(self, x, y, r, cls="bx"):
        return self.add(f'<circle class="{cls}" cx="{f1(x)}" cy="{f1(y)}" r="{f1(r)}"/>')

    def dot(self, x, y, r=3.2):
        return self.add(f'<circle class="ar-h" cx="{f1(x)}" cy="{f1(y)}" r="{r}"/>')


class Axes:
    """Maps data (t, v) to a pixel box (x, y, w, h)."""

    def __init__(self, fig, x, y, w, h, t0, t1, v0, v1, logx=False):
        self.f, self.x, self.y, self.w, self.h = fig, x, y, w, h
        self.t0, self.t1, self.v0, self.v1, self.logx = t0, t1, v0, v1, logx

    def X(self, t):
        if self.logx:
            return self.x + (math.log10(t) - math.log10(self.t0)) / (math.log10(self.t1) - math.log10(self.t0)) * self.w
        return self.x + (t - self.t0) / (self.t1 - self.t0) * self.w

    def Y(self, v):
        return self.y + self.h - (v - self.v0) / (self.v1 - self.v0) * self.h

    def plot(self, fn, cls="w1", n=400, t0=None, t1=None, clipv=True):
        t0 = self.t0 if t0 is None else t0
        t1 = self.t1 if t1 is None else t1
        pts = []
        for i in range(n + 1):
            if self.logx:
                t = 10 ** (math.log10(t0) + (math.log10(t1) - math.log10(t0)) * i / n)
            else:
                t = t0 + (t1 - t0) * i / n
            v = fn(t)
            if clipv:
                v = max(self.v0, min(self.v1, v))
            pts.append((self.X(t), self.Y(v)))
        return self.f.poly(pts, cls)

    def pts(self, data, cls="w1"):
        return self.f.poly([(self.X(t), self.Y(v)) for t, v in data], cls)

    def axes(self, zero=True, arrows=True, xlabel=None, ylabel=None):
        f = self.f
        y0 = self.Y(0) if (zero and self.v0 <= 0 <= self.v1) else self.y + self.h
        f.line(self.x, y0, self.x + self.w + 12, y0, "ax", "end" if arrows else None)
        f.line(self.x, self.y + self.h, self.x, self.y - 10, "ax", "end" if arrows else None)
        if xlabel:
            f.text(self.x + self.w + 14, y0 + 4, xlabel, "s")
        if ylabel:
            f.text(self.x + 6, self.y - 12, ylabel, "s")
        return self

    def hline(self, v, cls="dsh", label=None, lcls="s", lx=None, anchor=None):
        self.f.line(self.x, self.Y(v), self.x + self.w, self.Y(v), cls)
        if label:
            self.f.text(lx if lx is not None else self.x + self.w + 6, self.Y(v) + 4, label, lcls, anchor)
        return self

    def vline(self, t, cls="dsh", label=None, lcls="s", ly=None):
        self.f.line(self.X(t), self.y, self.X(t), self.y + self.h, cls)
        if label:
            self.f.text(self.X(t), ly if ly is not None else self.y + self.h + 16, label, lcls, "middle")
        return self


def scope_screen(fig, x, y, w, h, div_x=10, div_y=8):
    """Dark oscilloscope screen with dotted graticule. Returns an Axes in divisions (0..10, -4..4)."""
    fig.rect(x, y, w, h, "scr", 8)
    for i in range(1, div_x):
        fig.line(x + w * i / div_x, y, x + w * i / div_x, y + h, "sgr")
    for j in range(1, div_y):
        fig.line(x, y + h * j / div_y, x + w, y + h * j / div_y, "sgr")
    # centre axes with ticks
    cx, cy = x + w / 2, y + h / 2
    fig.add(f'<path class="sgr" style="stroke-dasharray:none;stroke:rgba(200,210,220,.4)" d="M{f1(x)} {f1(cy)} H{f1(x+w)} M{f1(cx)} {f1(y)} V{f1(y+h)}"/>')
    ticks = []
    for i in range(div_x * 5 + 1):
        tx = x + w * i / (div_x * 5)
        ticks.append(f"M{f1(tx)} {f1(cy-3)} V{f1(cy+3)}")
    for j in range(div_y * 5 + 1):
        ty = y + h * j / (div_y * 5)
        ticks.append(f"M{f1(cx-3)} {f1(ty)} H{f1(cx+3)}")
    fig.add(f'<path style="stroke:rgba(200,210,220,.45);stroke-width:1" d="{" ".join(ticks)}"/>')
    return Axes(fig, x, y, w, h, 0, div_x, -div_y / 2, div_y / 2)


# ---------------------------------------------------------------------- schematic primitives
class Sch:
    """Schematic drawing on a Fig. All strokes use class 'sw' (currentColor)."""

    def __init__(self, fig):
        self.f = fig
        self.d = []

    def flush(self):
        if self.d:
            self.f.path(" ".join(self.d), "sw")
            self.d = []

    def wire(self, *pts):
        self.d.append("M" + " L".join(f"{f1(x)} {f1(y)}" for x, y in pts))
        return self

    def res(self, x1, y1, x2, y2, body=36, label=None, lx=0, ly=-12, anchor="middle"):
        """Resistor between two points (horizontal or vertical) with zigzag body in the middle."""
        L = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        px, py = -uy, ux
        a = (L - body) / 2
        sx, sy = x1 + ux * a, y1 + uy * a
        pts = [(x1, y1), (sx, sy)]
        n = 6
        for i in range(n):
            s = (i + 0.5) / n * body
            k = 6 if i % 2 == 0 else -6
            pts.append((sx + ux * s + px * k, sy + uy * s + py * k))
        ex, ey = sx + ux * body, sy + uy * body
        pts += [(ex, ey), (x2, y2)]
        self.wire(*pts)
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            self.f.text(mx + lx, my + ly, label, None, anchor)
        return self

    def cap(self, x1, y1, x2, y2, gap=7, plate=13, label=None, lx=14, ly=4, anchor=None, polar=False):
        L = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        px, py = -uy, ux
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        a1 = (mx - ux * gap / 2, my - uy * gap / 2)
        a2 = (mx + ux * gap / 2, my + uy * gap / 2)
        self.wire((x1, y1), a1)
        self.wire(a2, (x2, y2))
        self.wire((a1[0] + px * plate, a1[1] + py * plate), (a1[0] - px * plate, a1[1] - py * plate))
        self.wire((a2[0] + px * plate, a2[1] + py * plate), (a2[0] - px * plate, a2[1] - py * plate))
        if polar:
            self.f.text(a1[0] + px * (plate + 6) - ux * 6, a1[1] + py * (plate + 6) - uy * 6 + 4, "+", "s", "middle")
        if label:
            self.f.text(mx + lx, my + ly, label, None, anchor)
        return self

    def ind(self, x1, y1, x2, y2, n=4, label=None, lx=0, ly=-14, anchor="middle"):
        L = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        px, py = -uy, ux
        body = 40
        a = (L - body) / 2
        sx, sy = x1 + ux * a, y1 + uy * a
        self.wire((x1, y1), (sx, sy))
        seg = body / n
        d = f"M{f1(sx)} {f1(sy)}"
        for i in range(n):
            ex, ey = sx + ux * seg * (i + 1), sy + uy * seg * (i + 1)
            cx, cy = sx + ux * seg * (i + 0.5) - px * 11, sy + uy * seg * (i + 0.5) - py * 11
            d += f" Q{f1(cx)} {f1(cy)} {f1(ex)} {f1(ey)}"
        self.d.append(d)
        self.wire((sx + ux * body, sy + uy * body), (x2, y2))
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            self.f.text(mx + lx, my + ly, label, None, anchor)
        return self

    def diode(self, x1, y1, x2, y2, label=None, lx=0, ly=-14, anchor="middle", zener=False):
        """Anode at (x1,y1), cathode at (x2,y2)."""
        L = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        px, py = -uy, ux
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        a = (mx - ux * 8, my - uy * 8)
        c = (mx + ux * 8, my + uy * 8)
        self.wire((x1, y1), a)
        self.wire(c, (x2, y2))
        self.wire((a[0] + px * 9, a[1] + py * 9), c, (a[0] - px * 9, a[1] - py * 9), (a[0] + px * 9, a[1] + py * 9))
        self.wire((c[0] + px * 9, c[1] + py * 9), (c[0] - px * 9, c[1] - py * 9))
        if label:
            self.f.text(mx + lx, my + ly, label, None, anchor)
        return self

    def gnd(self, x, y):
        self.wire((x, y), (x, y + 8))
        self.wire((x - 10, y + 8), (x + 10, y + 8))
        self.wire((x - 6, y + 12), (x + 6, y + 12))
        self.wire((x - 2, y + 16), (x + 2, y + 16))
        return self

    def src(self, x, y, r=16, kind="sine", label=None, lx=-24, ly=4):
        """Voltage source centred at (x,y); terminals at (x, y-r) and (x, y+r)."""
        self.flush()
        self.f.circle(x, y, r, "bx")
        if kind == "sine":
            self.d.append(f"M{f1(x-9)} {f1(y)} q{f1(4.5)} -10 9 0 t9 0")
        elif kind == "square":
            self.d.append(f"M{f1(x-9)} {f1(y+5)} h4 v-10 h5 v10 h5 v-10 h4")
        elif kind == "dc":
            self.f.text(x, y - 3, "+", "s", "middle")
            self.f.text(x, y + 11, "−", "s", "middle")
        if label:
            self.f.text(x + lx, y + ly, label, None, "end")
        return self

    def opamp(self, x, y, size=70, inv_top=True, label=None):
        """Triangle with left edge at x, centre line y. Returns dict of pins."""
        h = size * 0.86
        self.wire((x, y - h / 2), (x + size, y), (x, y + h / 2), (x, y - h / 2))
        top, bot = (x, y - h / 4), (x, y + h / 4)
        self.f.text(x + 8, top[1] + 5, "−" if inv_top else "+", "t")
        self.f.text(x + 8, bot[1] + 5, "+" if inv_top else "−", "t")
        if label:
            self.f.text(x + size * 0.42, y + 4, label, "s", "middle")
        return {"inv": top if inv_top else bot, "non": bot if inv_top else top, "out": (x + size, y), "top": (x + size * 0.45, y - h * 0.28), "bot": (x + size * 0.45, y + h * 0.28)}

    def node(self, x, y):
        self.flush()
        self.f.dot(x, y, 3)
        return self

    def term(self, x, y):
        self.flush()
        self.f.add(f'<circle cx="{f1(x)}" cy="{f1(y)}" r="4" style="fill:var(--card);stroke:currentColor;stroke-width:1.6"/>')
        return self

    def probe(self, x, y, ch=1, label=None, dx=8, dy=-8):
        self.flush()
        self.f.add(f'<circle class="{"s-ch1" if ch == 1 else "s-ch2"}" cx="{f1(x)}" cy="{f1(y)}" r="5.5" style="fill:{"#e0b400" if ch == 1 else "#14b8cc"};stroke:var(--card);stroke-width:1.5"/>')
        if label:
            self.f.text(x + dx, y + dy, label, "c1" if ch == 1 else "c2")
        return self


def finish(fig, sch=None):
    if sch:
        sch.flush()
    return fig.svg()
