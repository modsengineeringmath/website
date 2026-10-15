# Figures for the buck-converter deep-dive pages (/learn/power-electronics/buck-*).
# Usage: python3 scripts/bk_figs.py          fills empty <!--FIG:bk-…--><!--/FIG--> blocks in src/pages
#        python3 scripts/bk_figs.py --all    redraws every bk- figure
# Only keys in FIGS (all start with "bk-") are touched; keys owned by the other *_figs.py scripts are left alone.
# Styling: classes .bk-sch / .bk-gr / .bk-line … in assets/site.css ("BUCK CONVERTER DEEP-DIVE LABS"), so figures follow the light/dark theme.
import cmath, glob, math, os, re, sys

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


def wrap(w, h, label, body, cls="bk-sch"):
    lab = esc(label).replace('"', "&quot;")
    return f'<figure class="bk-fig-static"><svg class="{cls}" viewBox="0 0 {w} {h}" role="img" aria-label="{lab}">{body}</svg></figure>'


def P(d, c=""):
    return f'<path class="{c}" d="{d}"/>'


def T(x, y, s, c="", anchor=None):
    a = f' text-anchor="{anchor}"' if anchor else ""
    return f'<text class="{c}" x="{f1(x)}" y="{f1(y)}"{a}>{s}</text>'


def arrow(x, y, d, c="hot"):
    # small filled arrow head pointing d in "r l u d"
    pts = {"r": [(-6, -5), (6, 0), (-6, 5)], "l": [(6, -5), (-6, 0), (6, 5)], "u": [(-5, 6), (0, -6), (5, 6)], "d": [(-5, -6), (0, 6), (5, -6)]}[d]
    return f'<path class="{c}" style="fill:currentColor" d="M{f1(x+pts[0][0])} {f1(y+pts[0][1])} L{f1(x+pts[1][0])} {f1(y+pts[1][1])} L{f1(x+pts[2][0])} {f1(y+pts[2][1])}z"/>'


# ------------------------------------------------------------------------------------------------ circuits
def circuit(state, title):
    """state: on | off | idle. Draws the buck power stage with the active current path highlighted."""
    on, off, idle = state == "on", state == "off", state == "idle"
    parts = []

    def seg(d, hot, cls="hot"):
        parts.append(P(d, cls if hot else "dim"))

    gnd = 185
    top = 45
    # source branch + ground rail left part
    seg(f"M40 {top} V95", on)
    parts.append(f'<circle class="{"hot" if on else "dim"}" cx="40" cy="115" r="20"/>')
    parts.append(T(33, 111, "+", "" if on else "dim"))
    parts.append(T(35, 128, "−", "" if on else "dim"))
    seg(f"M40 135 V{gnd}", on)
    seg(f"M40 {top} H95", on)
    # switch
    parts.append(f'<circle cx="95" cy="{top}" r="3" style="fill:currentColor" class="{"" if on else "dim"}"/><circle cx="145" cy="{top}" r="3" style="fill:currentColor" class="{"" if on else "dim"}"/>')
    if on:
        parts.append(P(f"M95 {top} H145", "hot"))
    else:
        parts.append(P(f"M95 {top} L136 {top-22}", "dim"))
    parts.append(T(120, 20, "Q", ""))
    parts.append(T(120, 70, "ON" if on else "OFF", "lbl" if on else "lbl2", "middle"))
    seg(f"M145 {top} H200", on)
    parts.append(f'<circle cx="200" cy="{top}" r="3" style="fill:currentColor"/>')
    # diode (cathode at the switch node)
    dh = off
    seg(f"M200 {top} V92", dh)
    parts.append(P("M188 128 H212 L200 100 Z", "hot" if dh else "dim") + P("M188 98 H212", "hot" if dh else "dim"))
    seg("M200 128 V%d" % gnd, dh)
    parts.append(T(168, 118, "D", ""))
    # inductor
    lh = on or off
    seg(f"M200 {top} H215", lh)
    parts.append(P(f"M215 {top} q10 -17 20 0 q10 -17 20 0 q10 -17 20 0 q10 -17 20 0", "hot" if lh else "dim"))
    seg(f"M295 {top} H330", lh)
    parts.append(T(255, 20, "L", ""))
    # output rail
    parts.append(f'<circle cx="330" cy="{top}" r="3" style="fill:currentColor"/>')
    seg(f"M330 {top} H370", True)
    seg(f"M370 {top} H470", True)
    # C and R
    seg(f"M370 {top} V105", True)
    parts.append(P("M356 105 H384 M356 115 H384", "hot"))
    seg(f"M370 115 V{gnd}", True)
    parts.append(T(392, 116, "C", ""))
    seg(f"M470 {top} V80", True)
    parts.append(P("M470 80 l-9 6 l18 12 l-18 12 l18 12 l-18 12 l9 6", "hot"))
    seg(f"M470 140 V{gnd}", True)
    parts.append(T(490, 116, "R", ""))
    # ground rail
    if on:
        seg(f"M470 {gnd} H40", True)
    elif off:
        seg(f"M470 {gnd} H200", True)
        seg(f"M200 {gnd} H40", False)
    else:
        seg(f"M470 {gnd} H370", True)
        seg(f"M370 {gnd} H40", False)
    # labels
    parts.append(T(24, 118, "Vin", "", "end"))
    parts.append(T(335, 36, "+", "lbl"))
    parts.append(T(338, 168, "Vo", "lbl", None))
    parts.append(f'<path class="lbl" style="fill:none;stroke:var(--accent);stroke-width:1.4" d="M345 55 V165"/>')
    if on:
        parts += [arrow(170, top, "r"), arrow(305, top, "r"), arrow(470, 120, "d"), arrow(250, gnd, "l"),
                  T(255, 80, "vL = Vin − Vo (บวก)", "lbl", "middle"), T(255, 98, "iL เพิ่มขึ้น", "lbl", "middle"), T(150, 150, "ไดโอดถูกไบแอสย้อน", "dim", "middle")]
    elif off:
        parts += [arrow(200, 70, "u"), arrow(305, top, "r"), arrow(470, 120, "d"), arrow(300, gnd, "l"),
                  T(255, 80, "vL = −Vo (ติดลบ)", "lbl", "middle"), T(255, 98, "iL ลดลง", "lbl", "middle")]
    else:
        parts += [arrow(470, 120, "d"), arrow(420, gnd, "l"), T(255, 80, "iL = 0 · vL = 0", "lbl", "middle"), T(255, 98, "C จ่ายโหลดเอง", "lbl", "middle")]
    parts.append(T(280, 214, title, "", "middle"))
    return wrap(540, 226, title, "".join(parts))


@fig("bk-circuit-on")
def _c1():
    return circuit("on", "ช่วง ON: สวิตช์ Q ปิดวงจร กระแสไหลจาก Vin ผ่าน L ไปยัง C ∥ R")


@fig("bk-circuit-off")
def _c2():
    return circuit("off", "ช่วง OFF: Q เปิดวงจร ไดโอดนำกระแสต่อให้ L (freewheeling)")


@fig("bk-circuit-idle")
def _c3():
    return circuit("idle", "ช่วงว่าง (เฉพาะ DCM): Q และไดโอดไม่นำ iL = 0 มีแต่ C จ่ายโหลด")


# ------------------------------------------------------------------------------------------------ waveforms (schematic, exact shapes)
class Plot:
    def __init__(self, x, y, w, h, x0, x1, y0, y1):
        self.x, self.y, self.w, self.h, self.x0, self.x1, self.y0, self.y1 = x, y, w, h, x0, x1, y0, y1

    def X(self, v):
        return self.x + (v - self.x0) / (self.x1 - self.x0) * self.w

    def Y(self, v):
        return self.y + self.h - (v - self.y0) / (self.y1 - self.y0) * self.h


def wave_fig(key, label, intervals, Vg, Vo, mode):
    """intervals: list of (t_start, t_end, kind) per period fractions; draws vL (top) and iL (bottom) over two periods."""
    W, H = 700, 330
    out = []
    per = 2
    top = Plot(70, 28, 540, 110, 0, per, -Vo * 1.25, (Vg - Vo) * 1.35)
    bot = Plot(70, 190, 540, 100, 0, per, 0, 1.0)
    # frames
    for pl in (top, bot):
        out.append(f'<rect class="bk-frame" x="{pl.x}" y="{pl.y}" width="{pl.w}" height="{pl.h}"/>')
    out.append(f'<line class="bk-ref" x1="{top.x}" x2="{top.x+top.w}" y1="{f1(top.Y(0))}" y2="{f1(top.Y(0))}"/>')
    # vL steps + shaded areas
    pts = []
    for k in range(per):
        for (a, b, kind) in intervals:
            v = {"on": Vg - Vo, "off": -Vo, "idle": 0}[kind]
            cls = {"on": "area-on", "off": "area-off", "idle": ""}[kind]
            x0, x1 = top.X(k + a), top.X(k + b)
            y0, y1 = top.Y(0), top.Y(v)
            if kind != "idle":
                out.append(f'<rect class="bk-band {"on" if kind == "on" else "off"}" x="{f1(x0)}" y="{f1(min(y0, y1))}" width="{f1(x1 - x0)}" height="{f1(abs(y1 - y0))}" style="opacity:2.2"/>')
            pts.append((k + a, v)); pts.append((k + b, v))
    d = "M" + " L".join(f"{f1(top.X(t))} {f1(top.Y(v))}" for t, v in pts)
    out.append(f'<path class="bk-line s1" d="{d}"/>')
    # iL triangle / DCM
    ils = []
    if mode == "ccm":
        lo, hi = 0.45, 0.9
        for k in range(per):
            ils += [(k, lo), (k + intervals[0][1], hi), (k + 1, lo)]
    else:
        pk = 0.9
        for k in range(per):
            a, b, _ = intervals[0]; c, e, _ = intervals[1]
            ils += [(k, 0), (k + b, pk), (k + e, 0), (k + 1, 0)]
    d = "M" + " L".join(f"{f1(bot.X(t))} {f1(bot.Y(v))}" for t, v in ils)
    out.append(f'<path class="bk-line s2" d="{d}"/>')
    # labels
    out.append(T(top.x - 8, top.Y(Vg - Vo) + 4, "Vin − Vo", "bk-tk", "end"))
    out.append(T(top.x - 8, top.Y(-Vo) + 4, "−Vo", "bk-tk", "end"))
    out.append(T(top.x - 8, top.Y(0) + 4, "0", "bk-tk", "end"))
    out.append(T(top.x, 18, "แรงดันคร่อมตัวเหนี่ยวนำ vL(t)", "bk-title"))
    out.append(T(bot.x, 182, "กระแสตัวเหนี่ยวนำ iL(t)", "bk-title"))
    names = {"on": "D·Ts", "off": "D′·Ts", "idle": "D₃·Ts"}
    if mode == "dcm":
        names = {"on": "D₁·Ts", "off": "D₂·Ts", "idle": "D₃·Ts"}
    for (a, b, kind) in intervals:
        xm = (top.X(a) + top.X(b)) / 2
        out.append(T(xm, bot.y + bot.h + 18, names[kind], "bk-tk", "middle"))
        out.append(f'<line class="bk-ref" x1="{f1(top.X(a))}" x2="{f1(top.X(a))}" y1="{top.y}" y2="{bot.y + bot.h}"/>')
    out.append(f'<line class="bk-ref" x1="{f1(top.X(1))}" x2="{f1(top.X(1))}" y1="{top.y}" y2="{bot.y + bot.h}"/>')
    out.append(f'<line class="bk-ref" x1="{f1(top.X(2))}" x2="{f1(top.X(2))}" y1="{top.y}" y2="{bot.y + bot.h}"/>')
    # area labels
    a_on = intervals[0]
    out.append(T((top.X(a_on[0]) + top.X(a_on[1])) / 2, top.Y((Vg - Vo) / 2) + 4, "พื้นที่ A₁", "bk-bl", "middle"))
    a_off = intervals[1]
    out.append(T((top.X(a_off[0]) + top.X(a_off[1])) / 2, top.Y(-Vo / 2) + 4, "พื้นที่ A₂", "bk-bl", "middle"))
    if mode == "ccm":
        out.append(T(bot.x + bot.w + 6, bot.Y(0.9) + 4, "ILmax", "bk-tk"))
        out.append(T(bot.x + bot.w + 6, bot.Y(0.45) + 4, "ILmin", "bk-tk"))
        out.append(f'<line class="bk-ref" x1="{bot.x}" x2="{bot.x + bot.w}" y1="{f1(bot.Y(0.675))}" y2="{f1(bot.Y(0.675))}"/>')
        out.append(T(bot.x + bot.w + 6, bot.Y(0.675) + 4, "IL = Io", "bk-tk"))
    else:
        out.append(T(bot.x + bot.w + 6, bot.Y(0.9) + 4, "ipk", "bk-tk"))
        out.append(T(bot.x + bot.w + 6, bot.Y(0) + 4, "0", "bk-tk"))
    body = "".join(out)
    return wrap(W, H, label, body, "bk-svg bk-staticsvg")


@fig("bk-vl-ccm")
def _w1():
    D = 0.4
    return wave_fig("bk-vl-ccm", "รูปคลื่น vL และ iL ในโหมด CCM: พื้นที่ vL ช่วง ON เท่ากับช่วง OFF", [(0, D, "on"), (D, 1, "off")], 24, 9.6, "ccm")


@fig("bk-vl-dcm")
def _w2():
    return wave_fig("bk-vl-dcm", "รูปคลื่น vL และ iL ในโหมด DCM มีช่วงว่าง D3", [(0, 0.4, "on"), (0.4, 0.8, "off"), (0.8, 1, "idle")], 24, 12, "dcm")


# ------------------------------------------------------------------------------------------------ averaging concept
@fig("bk-avg-wave")
def _avg():
    W, H = 660, 250
    out = [f'<rect class="bk-frame" x="60" y="20" width="570" height="190"/>']
    n = 16
    x0, x1 = 60, 630
    def X(t): return x0 + t / n * (x1 - x0)
    def Y(i): return 210 - (i - 0.2) / 1.2 * 190
    # average: step in D at t = 4 → damped oscillation to a new level
    def avg(t):
        if t < 4: return 0.7
        tt = (t - 4) * 0.9
        return 0.7 + 0.3 * (1 - math.exp(-0.45 * tt) * (math.cos(1.6 * tt) + 0.28 * math.sin(1.6 * tt)))
    pts = []
    steps = n * 40
    for k in range(steps + 1):
        t = k / 40
        ph = t - math.floor(t)
        d = 0.5 if t < 4 else 0.6
        r = 0.11
        # triangular ripple: rises during d, falls during 1-d (zero mean)
        rip = (-r / 2 + r * ph / d) if ph < d else (r / 2 - r * (ph - d) / (1 - d))
        pts.append((t, avg(t) + rip))
    out.append('<path class="bk-line s4" style="stroke-width:1.4" d="M' + " L".join(f"{f1(X(t))} {f1(Y(i))}" for t, i in pts) + '"/>')
    av = [(k / 20, avg(k / 20)) for k in range(n * 20 + 1)]
    out.append('<path class="bk-line s2" style="stroke-width:3.2" d="M' + " L".join(f"{f1(X(t))} {f1(Y(i))}" for t, i in av) + '"/>')
    out.append(f'<line class="bk-ref s1" x1="{f1(X(4))}" x2="{f1(X(4))}" y1="20" y2="210"/>')
    out.append(T(X(4) + 6, 38, "ดิวตี้เปลี่ยน D → D + ΔD", "bk-rl s1"))
    out.append(T(70, 14, "iL ที่สวิตช์จริง (เส้นบาง) กับค่าเฉลี่ยรายคาบ ⟨iL⟩ (เส้นหนา) — แบบจำลองเฉลี่ยตามเฉพาะเส้นหนา", "bk-title"))
    out.append(T(350, 236, "เวลา (หน่วย: คาบสวิตช์ Ts)", "bk-al", "middle"))
    out.append(T(54, 125, "iL", "bk-al", "end"))
    return wrap(W, H, "กระแสตัวเหนี่ยวนำที่สวิตช์จริงกับค่าเฉลี่ยรายคาบ", "".join(out), "bk-svg bk-staticsvg")


# ------------------------------------------------------------------------------------------------ canonical small-signal circuit
@fig("bk-avg-circuit")
def _canon():
    o = []
    top, gnd = 60, 180
    # input source v̂g and the current source IL·d̂ across the primary
    o.append(P(f"M45 {top} H185", "hot2") + P(f"M45 {top} V100", "hot2"))
    o.append('<circle class="hot2" cx="45" cy="120" r="20"/>' + T(36, 124, "v̂g", "lbl2"))
    o.append(P(f"M45 140 V{gnd}", "hot2"))
    o.append(P(f"M115 {top} V100", "hot2") + '<circle class="hot2" cx="115" cy="120" r="20"/>' + P("M115 132 V108 M109 114 L115 106 L121 114", "hot2") + P(f"M115 140 V{gnd}", "hot2"))
    o.append(T(115, 160, "", ""))
    o.append(T(115, 94, "", ""))
    o.append(T(115 + 28, 124, "IL·d̂", "lbl2"))
    # ideal transformer 1 : D (two coils facing each other, core bars between)
    o.append(P(f"M185 {top} V75 q12 10 0 20 q12 10 0 20 q12 10 0 20 q12 10 0 20 V{gnd}", "hot2"))
    o.append(P("M207 70 V160 M213 70 V160", ""))
    o.append(P(f"M235 {top} V75 q-12 10 0 20 q-12 10 0 20 q-12 10 0 20 q-12 10 0 20 V{gnd}", "hot"))
    o.append(T(210, 56, "1 : D", "", "middle"))
    # secondary: series source Vg·d̂, inductor L, output C ∥ R
    o.append(P(f"M235 {top} H275", "hot") + '<circle class="hot" cx="293" cy="60" r="18"/>' + T(287, 57, "+", "lbl") + T(293, 30, "Vg·d̂", "lbl", "middle"))
    o.append(P(f"M311 {top} H340 q10 -17 20 0 q10 -17 20 0 q10 -17 20 0 q10 -17 20 0 H440", "hot"))
    o.append(T(380, 36, "L", ""))
    o.append('<circle cx="440" cy="60" r="3" style="fill:currentColor"/>')
    o.append(P(f"M440 {top} H460 V112 M446 112 H474 M446 122 H474 M460 122 V{gnd}", "hot"))
    o.append(T(482, 124, "C", ""))
    o.append(P(f"M440 {top} H530 V92 l-9 6 l18 12 l-18 12 l18 12 l-18 12 l9 6 V{gnd}", "hot"))
    o.append(T(546, 128, "R", ""))
    o.append(T(430, 52, "", ""))
    o.append(P(f"M45 {gnd} H530", "hot2") )
    o.append(P(f"M235 {gnd} H530", "hot"))
    o.append(T(285, 204, "วงจรสัญญาณเล็กของบั๊ก: หม้อแปลงอุดมคติ 1 : D", "", "middle"))
    o.append(T(285, 224, "กับแหล่งควบคุมจาก d̂ (เฉลี่ยกระแสและแรงดันของสวิตช์)", "", "middle"))
    return wrap(570, 236, "วงจรสัญญาณเล็กของบั๊กแบบเฉลี่ย: หม้อแปลงอุดมคติ 1:D ตัวเหนี่ยวนำ L ตัวเก็บประจุ C โหลด R และแหล่งควบคุมจาก d̂", "".join(o))


# ------------------------------------------------------------------------------------------------ annotated Bode of Gvd
@fig("bk-gvd-annot")
def _gvd():
    Vg, R, L, C, rC = 24.0, 10.0, 300e-6, 100e-6, 0.05
    f0 = 1 / (2 * math.pi * math.sqrt(L * C)); Q = R * math.sqrt(C / L); fz = 1 / (2 * math.pi * rC * C)
    def G(f):
        s = 2j * math.pi * f
        return Vg * (1 + s * rC * C) / (L * C * s * s + (L / R + rC * C) * s + 1)
    fmin, fmax = 20.0, 1e5
    W, H = 660, 330
    px, py, pw, ph = 70, 30, 560, 250
    mags = [(f, 20 * math.log10(abs(G(f)))) for f in [fmin * (fmax / fmin) ** (i / 400) for i in range(401)]]
    lo, hi = -40, 50
    X = lambda f: px + (math.log10(f) - math.log10(fmin)) / (math.log10(fmax) - math.log10(fmin)) * pw
    Y = lambda d: py + ph - (d - lo) / (hi - lo) * ph
    o = [f'<rect class="bk-frame" x="{px}" y="{py}" width="{pw}" height="{ph}"/>']
    for d in range(-40, 51, 20):
        o.append(f'<line class="bk-gr" x1="{px}" x2="{px+pw}" y1="{f1(Y(d))}" y2="{f1(Y(d))}"/>' + T(px - 6, Y(d) + 4, str(d).replace("-", "−"), "bk-tk", "end"))
    for e in range(2, 6):
        f = 10 ** e
        o.append(f'<line class="bk-gr" x1="{f1(X(f))}" x2="{f1(X(f))}" y1="{py}" y2="{py+ph}"/>' + T(X(f), py + ph + 16, f"{f:g}", "bk-tk", "end" if e == 5 else "middle"))
    o.append(f'<line class="bk-gr" x1="{f1(X(20))}" x2="{f1(X(20))}" y1="{py}" y2="{py+ph}"/>' + T(X(20), py + ph + 16, "20", "bk-tk", "middle"))
    o.append('<path class="bk-line s1" style="stroke-width:2.8" d="M' + " L".join(f"{f1(X(f))} {f1(Y(d))}" for f, d in mags) + '"/>')
    dc = 20 * math.log10(Vg)
    o.append(f'<path class="bk-line s4 dash" d="M{f1(X(fmin))} {f1(Y(dc))} H{f1(X(f0))} L{f1(X(fz))} {f1(Y(dc - 40 * math.log10(fz / f0)))} L{f1(X(fmax))} {f1(Y(dc - 40 * math.log10(fz / f0) - 20 * math.log10(fmax / fz)))}"/>')
    pk = max(d for f, d in mags)
    o.append(f'<line class="bk-ref s2" x1="{f1(X(f0))}" x2="{f1(X(f0))}" y1="{py}" y2="{py+ph}"/>' + T(X(f0) + 6, py + ph - 10, f"f₀ = {f0:.0f} Hz", "bk-rl s2"))
    o.append(f'<line class="bk-ref s2" x1="{f1(X(fz))}" x2="{f1(X(fz))}" y1="{py}" y2="{py+ph}"/>' + T(X(fz) - 6, py + ph - 28, f"ศูนย์ ESR = {fz/1000:.1f} kHz", "bk-rl s2", "end"))
    o.append(T(X(fmin) + 10, Y(dc) - 8, f"อัตราขยาย DC = Vin = 24 V = {dc:.1f} dB", "bk-rl"))
    o.append(T(X(f0) + 12, Y(pk) + 4, f"ยอด ≈ 20log(Vin·Q) = {20 * math.log10(Vg * Q):.1f} dB (Q = {Q:.2f})", "bk-rl"))
    o.append(T(X(2300), Y(-22), "ลดลง −40 dB/dec", "bk-rl", "middle"))
    o.append(T(X(66000), Y(-12), "−20 dB/dec", "bk-rl", "middle"))
    o.append(T(px, 18, "ขนาดของ Gvd(jω) = v̂o/d̂ เมื่อ Vin = 24 V, L = 300 µH, C = 100 µF, R = 10 Ω, ESR = 50 mΩ (dB)", "bk-title"))
    o.append(T(px + pw / 2, H - 8, "ความถี่ (Hz)", "bk-al", "middle"))
    return wrap(W, H, "กราฟโบเดขนาดของ Gvd ของบั๊ก พร้อมเส้นกำกับ f0 ยอดเรโซแนนซ์ และศูนย์ ESR", "".join(o), "bk-svg bk-staticsvg")


# ------------------------------------------------------------------------------------------------ runner
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
        out, n = re.subn(r"<!--FIG:([\w-]+)-->([\s\S]*?)<!--/FIG-->", rep, src)
        if out != src:
            open(fpath, "w", encoding="utf-8").write(out)
            total += 1
            print("updated", os.path.relpath(fpath, ROOT))
    missing = set()
    for fpath in files:
        for k in re.findall(r"<!--FIG:(bk-[\w-]+)--><!--/FIG-->", open(fpath, encoding="utf-8").read()):
            missing.add(k)
    if missing:
        print("unknown bk keys:", ", ".join(sorted(missing)))
    print(total, "file(s) updated")


if __name__ == "__main__":
    main()
