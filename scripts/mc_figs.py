# Figures for the motor-control and PLC series (/learn/motor-control/, /learn/plc/ and the English editions under /learn/en/).
# Usage: python3 scripts/mc_figs.py          fills empty <!--FIG:mc-…--> / <!--FIG:plc-…--> blocks in src/pages
#        python3 scripts/mc_figs.py --all    redraws every mc-/plc- figure
# A key ending in "-en" draws the same figure with English labels (e.g. <!--FIG:mc-dol-power-en-->).
# Curves are computed, not hand-drawn: the torque/current–speed curves come from the per-phase equivalent circuit of a
# 7.5 kW 4-pole 400 V 50 Hz motor (deep-bar rotor) fitted to typical catalogue data (In ≈ 14.8 A, Is/In ≈ 7.3,
# Ts/Tn ≈ 2.6, Tmax/Tn ≈ 3.1, 1471 rpm); the same model drives assets/mc-lab.js.
# Schematics follow IEC 60617 symbols and IEC 81346 letter codes. Styling: .xf-* classes in assets/site.css.
import glob, math, os, re, sys, cmath

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}
LANG = ["th"]


def T(th, en):
    return en if LANG[0] == "en" else th


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
        self.w, self.h, self.label, self.key = w, h, label, key + ("-en" if LANG[0] == "en" else "")
        self.p = []

    def add(self, s):
        self.p.append(s)
        return self

    def svg(self):
        m = (f'<defs><marker id="{self.key}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">'
             f'<path class="xf-ah" d="M0 0 L10 5 L0 10z"/></marker></defs>')
        lab = esc(self.label).replace('"', "&quot;")
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

    CW = {"xf-k": 6.4, "xf-m": 7.0, "xf-h": 7.6, "xf-tag": 7.4, "xf-tagk": 6.7, "xf-plt": 8.5}

    def text(self, x, y, s, c=None, a=None, rot=None):
        at = (f' class="{c}"' if c else "") + (f' text-anchor="{a}"' if a else "")
        if rot is None and c:
            cw = next((v for k, v in self.CW.items() if k in c.split()), 7.0)
            n = sum(1 for ch in str(s) if not ("\u0e31" == ch or "\u0e34" <= ch <= "\u0e3a" or "\u0e47" <= ch <= "\u0e4e"))
            est = n * cw * (0.86 if any("\u0e00" <= ch <= "\u0e7f" for ch in str(s)) else 1)
            left = x - (est if a == "end" else est / 2 if a == "middle" else 0)
            room = (self.w - 6 - x) if a in (None, "start") else (x - 6) if a == "end" else min(x - 6, self.w - 6 - x) * 2
            if est > room > 0:
                at += f' textLength="{f1(room)}" lengthAdjust="spacingAndGlyphs"'

        if rot is not None:
            at += f' transform="rotate({rot} {f1(x)} {f1(y)})"'
        return self.add(f'<text x="{f1(x)}" y="{f1(y)}"{at}>{esc(s)}</text>')

    def dot(self, x, y, r=3.2, c="xf-dotk"):
        return self.add(f'<circle class="{c}" cx="{f1(x)}" cy="{f1(y)}" r="{r}"/>')


# =========================================================================== schematic symbols (vertical, IEC 60617)
# Every element occupies a vertical slot of height H starting at y; the wire enters at (x, y) and leaves at (x, y + H).
H = 52


def el_wire(f, x, y, h=H):
    f.line(x, y, x, y + h)


def el_no(f, x, y, act=None, tag=None, t1=None, t2=None, h=H, c="xf-ln"):
    """Normally-open contact. act: None | 'push' | 'estop' | 'ton' | 'tof' | 'th' | 'float' | 'press' | 'limit'."""
    a, b = y + 15, y + h - 15
    f.line(x, y, x, a, c); f.line(x, b, x, y + h, c)
    f.line(x, b, x - 11, a - 1, c)
    _actuator(f, x, (a + b) / 2, act, c)
    _labels(f, x, y, h, tag, t1, t2, 50 if act else 30)


def el_nc(f, x, y, act=None, tag=None, t1=None, t2=None, h=H, c="xf-ln"):
    a, b = y + 15, y + h - 15
    f.line(x, y, x, a, c); f.line(x, b, x, y + h, c)
    f.line(x, a, x + 9, a, c)
    f.line(x, b, x + 10, a - 4, c)
    _actuator(f, x + 4, (a + b) / 2, act, c)
    _labels(f, x, y, h, tag, t1, t2, 48 if act else 26)


def _actuator(f, x, ym, act, c="xf-ln"):
    if not act:
        return
    xa = x - 6
    if act in ("push", "estop"):
        f.line(xa, ym, x - 26, ym, "xf-dash")
        if act == "push":
            f.path(f"M {f1(x - 22)} {f1(ym - 7)} L {f1(x - 26)} {f1(ym - 7)} L {f1(x - 26)} {f1(ym + 7)} L {f1(x - 22)} {f1(ym + 7)}", c)
        else:
            f.path(f"M {f1(x - 26)} {f1(ym - 9)} A 9 9 0 0 0 {f1(x - 26)} {f1(ym + 9)} Z", "xf-estop")
    elif act == "sel":  # manually operated, stays in position (selector): general manual operation bar
        f.line(xa, ym, x - 24, ym, "xf-dash")
        f.line(x - 24, ym - 8, x - 24, ym + 8, c)
        f.line(x - 24, ym - 8, x - 30, ym - 8, c)
    elif act in ("ton", "tof"):
        f.line(xa, ym, x - 24, ym, "xf-dash")
        sweep = 1 if act == "ton" else 0
        f.path(f"M {f1(x - 24)} {f1(ym - 8)} A 8 8 0 0 {sweep} {f1(x - 24)} {f1(ym + 8)}", c)
    elif act == "th":  # thermal overload actuator
        f.line(xa, ym, x - 22, ym, "xf-dash")
        f.path(f"M {f1(x - 22)} {f1(ym)} l -5 0 l 0 -6 l -6 0 l 0 12 l -6 0 l 0 -6 l -4 0", c)
    elif act == "float":
        f.line(xa, ym, x - 24, ym, "xf-dash")
        f.circ(x - 30, ym, 6, "xf-box")
    elif act == "press":
        f.line(xa, ym, x - 24, ym, "xf-dash")
        f.path(f"M {f1(x - 24)} {f1(ym - 7)} L {f1(x - 32)} {f1(ym)} L {f1(x - 24)} {f1(ym + 7)}", c)
    elif act == "limit":
        f.line(xa, ym, x - 22, ym, "xf-dash")
        f.path(f"M {f1(x - 22)} {f1(ym - 6)} L {f1(x - 30)} {f1(ym)} L {f1(x - 22)} {f1(ym + 6)} Z", c)


def _labels(f, x, y, h, tag, t1, t2, off=36):
    if tag:
        f.text(x - off, y + h / 2 + 4, tag, "xf-tag", "end")
    if t1:
        f.text(x + 7, y + 11, t1, "xf-k")
    if t2:
        f.text(x + 7, y + h - 4, t2, "xf-k")


def el_coil(f, x, y, tag=None, kind=None, note=None, h=H, tagside="left"):
    f.line(x, y, x, y + 13); f.line(x, y + h - 13, x, y + h)
    f.rect(x - 15, y + 13, 30, h - 26, "xf-coil", 1)
    if kind == "ton":
        f.rect(x - 15, y + 13, 9, h - 26, "xf-fill", 0)
    elif kind == "tof":
        f.rect(x + 6, y + 13, 9, h - 26, "xf-fill", 0)
    if tagside == "right":
        _labels(f, x, y, h, None, "A1", "A2")
        f.text(x + 22, y + h / 2 + 4, tag, "xf-tag")
    else:
        _labels(f, x, y, h, tag, "A1", "A2")
    if note:
        f.text(x + 20, y + h / 2 + 4, note, "xf-k")
    ref = getattr(f, "xr", {}).get(tag)
    if ref and (ref["no"] or ref["nc"] or ref.get("main")):
        xref_box(f, x, y + h, ref)


def xref_box(f, x, y, ref):
    """IEC 60204-1 / IEC 61082 contact cross-reference under a coil: column numbers where its NO and NC contacts are used."""
    rows = [("main", ref.get("main")), ("no", ref["no"]), ("nc", ref["nc"])]
    rows = [(k, v) for k, v in rows if v]
    bw, bh = 70, 6 + 15 * len(rows)
    bx, by = x + 10, y + 4
    f.rect(bx, by, bw, bh, "xf-xref", 1)
    for i, (k, v) in enumerate(rows):
        yy = by + 12 + i * 15
        gx = bx + 11
        if k == "main":
            for dx in (-5, 0, 5):
                f.line(gx + dx, yy - 7, gx + dx, yy + 3, "xf-thin")
        else:
            f.line(gx, yy - 7, gx, yy - 3, "xf-ln"); f.line(gx, yy + 1, gx, yy + 4, "xf-ln")
            f.line(gx, yy + 1, gx - 5, yy - 4, "xf-ln")
            if k == "nc":
                f.line(gx - 6, yy - 3, gx + 2, yy - 3, "xf-ln")
        f.text(bx + 24, yy + 3, v if isinstance(v, str) else ",".join(str(c) for c in v), "xf-k")


def el_lamp(f, x, y, tag=None, note=None, h=H, color=None):
    """IEC 60617 indicator lamp (circle with a cross); color = IEC 60204-1 code RD / YE / GN / BU / WH."""
    f.line(x, y, x, y + 15); f.line(x, y + h - 15, x, y + h)
    r = (h - 30) / 2 + 1
    cy = y + h / 2
    f.circ(x, cy, r, "xf-box")
    d = r * 0.7
    f.line(x - d, cy - d, x + d, cy + d); f.line(x - d, cy + d, x + d, cy - d)
    _labels(f, x, y, h, tag, "X1", "X2")
    if color:
        f.text(x + r + 5, cy - 2, color, "xf-tagk")
    if note:
        f.text(x + r + 5, cy + 12, note, "xf-k")


def el_fuse(f, x, y, tag=None, h=H, note=None):
    """IEC 60617 fuse: a rectangle with the conductor drawn through its full length."""
    f.rect(x - 6, y + 13, 12, h - 26, "xf-box", 1)
    f.line(x, y, x, y + h)
    _labels(f, x, y, h, tag, None, None)
    if note:
        f.text(x + 14, y + h / 2 + 4, note, "xf-k")


# ---- a tiny layout engine for IEC-style (vertical) control circuits between two rails
# node = ("el", fn, kwargs) | ("seq", [nodes]) | ("par", [nodes]);  column width COLW
COLW = 120


def E(fn, **kw):
    return ("el", fn, kw)


def S(*items):
    return ("seq", list(items))


def P(*items):
    return ("par", list(items))


GAP = ("gap",)


def size(n):
    if n[0] == "gap":
        return 1, 0
    if n[0] == "el":
        return 1, n[2].get("h", H)
    if n[0] == "seq":
        ws, hs = zip(*[size(c) for c in n[1]]) if n[1] else ((1,), (0,))
        return max(ws), sum(hs)
    ws, hs = zip(*[size(c) for c in n[1]])
    return sum(ws), max(hs) + 24  # 12 px for the split and the join


def draw(f, n, x, y, hfill=None):
    """Draw node n with its main wire at x from y; stretch to height hfill (extra wire).
    Loads (coils, lamps) are aligned on one row just above the lower rail, leaving f.below px for the cross-reference box."""
    w, h = size(n)
    hh = hfill if hfill is not None else h
    if n[0] == "gap":
        return
    if n[0] == "el":
        kw = dict(n[2]); kw.pop("h", None)
        eh = n[2].get("h", H)
        reg = getattr(f, "reg", None)
        if reg is not None and n[1] is not el_wire:
            reg.append((n[1], kw.get("tag"), x, y, kw))
        if n[1] is el_wire:
            el_wire(f, x, y, hh)
            return
        below = getattr(f, "below", 0) if n[1] in (el_coil, el_lamp) else 0
        top = max(hh - eh - below, 0) if n[1] in (el_coil, el_lamp) else 0
        if top:
            f.line(x, y, x, y + top)
        n[1](f, x, y + top, **kw)
        if hh > top + eh:
            f.line(x, y + top + eh, x, y + hh)
        return
    if n[0] == "seq":
        yy = y
        items = n[1]
        for i, c in enumerate(items):
            cw, ch = size(c)
            last = i == len(items) - 1
            draw(f, c, x, yy, (ch + (hh - h)) if last else None)
            yy += ch
        return
    # parallel: columns side by side; split line at y+12, join at y+hh-12
    xs, cx = [], x
    for c in n[1]:
        xs.append(cx)
        cx += size(c)[0] * COLW
    f.line(x, y, x, y + 12)
    f.line(xs[0], y + 12, xs[-1], y + 12)
    f.line(xs[0], y + hh - 12, xs[-1], y + hh - 12)
    f.line(x, y + hh - 12, x, y + hh)
    f.dot(x, y + 12)
    f.dot(x, y + hh - 12)
    for c, xi in zip(n[1], xs):
        draw(f, c, xi, y + 12, hh - 24)


def control(f, root, x0, ytop, rails=True, top=None, bot=None, extra=0, below=0, labels=None, cols=True):
    """Draw a whole control circuit: root hangs from the top rail to the bottom rail.
    below: room under the loads for the contact cross-reference boxes · labels: {column: text} function texts under the circuit."""
    w, h = size(root)
    h += extra + below
    # pass 1: find where every contact sits, so each coil can print its cross-reference (IEC 60204-1 / IEC 61082-1)
    g = F(f.w, f.h, "", "tmp"); g.reg = []; g.below = below
    draw(g, root, x0, ytop, h)
    xr = {}
    for fn, tag, x, y, kw in g.reg:
        if not tag or fn not in (el_no, el_nc):
            continue
        d = xr.setdefault(tag, {"no": [], "nc": [], "main": kw.get("main")})
        col = int(round((x - x0) / COLW)) + 1
        (d["no"] if fn is el_no else d["nc"]).append(col)
    for tag, d in xr.items():
        for k in ("no", "nc"):
            d[k] = sorted(set(d[k]))
    f.xr, f.below, f.reg = xr, below, []
    f.mains = getattr(f, "mains", {})
    for tag, d in xr.items():
        d["main"] = f.mains.get(tag)
    if rails:
        f.line(x0 - 50, ytop, x0 + w * COLW - 40, ytop, "xf-rail")
        f.line(x0 - 50, ytop + h, x0 + w * COLW - 40, ytop + h, "xf-rail")
        f.text(x0 - 54, ytop + 4, top or "L", "xf-tag", "end")
        f.text(x0 - 54, ytop + h + 4, bot or "N", "xf-tag", "end")
    draw(f, root, x0, ytop, h)
    if cols:
        for c in range(1, w + 1):
            f.text(x0 + (c - 1) * COLW, ytop - 8, str(c), "xf-colno", "middle")
    for c, txt in (labels or {}).items():
        f.text(x0 + (c - 1) * COLW, ytop + h + 20, txt, "xf-k", "middle")
    f.h = max(ytop + h + (44 if labels else 30) + 24, getattr(f, "minh", 0))
    return w, h


# ---- three-pole power devices (phases spaced dx apart, wires vertical)
def p_wires(f, xs, y1, y2, c="xf-ln"):
    for x in xs:
        f.line(x, y1, x, y2, c)


def p_earth(f, x, y, c="xf-ln"):
    """IEC 60617 protective-earth symbol: three bars of decreasing length at the end of a stem."""
    f.line(x, y, x, y + 6, c)
    f.line(x - 9, y + 6, x + 9, y + 6, c); f.line(x - 6, y + 10, x + 6, y + 10, c); f.line(x - 3, y + 14, x + 3, y + 14, c)


def p_contacts(f, xs, y, tag=None, kind="km", h=50, terms=None, rel="mag"):
    """kind: 'km' contactor main contacts (IEC 60617 contactor contact with the arc-quenching bow) ·
    'q' circuit-breaker (cross on the contact) · 'sw' switch-disconnector (bar on the contact).
    rel: breaker release — 'mag' (short-circuit only, I>>) or 'thmag' (thermal bimetal + magnetic, MPCB)."""
    a, b = y + 14, y + h - 14
    for i, x in enumerate(xs):
        f.line(x, y, x, a); f.line(x, b, x, y + h)
        f.line(x, b, x - 11, a - 1)
        if kind == "km":
            f.path(f"M {f1(x - 3)} {f1(a)} A 3 3 0 0 0 {f1(x + 3)} {f1(a)}", "xf-ln")
        elif kind == "q":
            f.line(x - 4, a - 4, x + 4, a + 4); f.line(x - 4, a + 4, x + 4, a - 4)
        elif kind == "sw":
            f.line(x - 12, a + 3, x - 3, a + 7, "xf-ln")
        if terms:
            f.text(x + 5, y + 10, terms[0][i], "xf-k"); f.text(x + 5, y + h - 3, terms[1][i], "xf-k")
    ym = (a + b) / 2
    f.line(xs[0] - 6, ym, xs[-1] - 6, ym, "xf-dash")
    if kind == "q":
        # tripping device linked to the switching mechanism
        f.line(xs[0] - 6, ym, xs[0] - 30, ym, "xf-dash")
        if rel == "thmag":
            f.rect(xs[0] - 82, ym - 10, 24, 20, "xf-box", 2)
            f.path(f"M {f1(xs[0] - 77)} {f1(ym + 4)} l 0 -8 l 5 0 l 0 8 l 5 0 l 0 -8 l 4 0", "xf-thin")
            f.line(xs[0] - 58, ym, xs[0] - 54, ym, "xf-dash")
            f.rect(xs[0] - 54, ym - 10, 24, 20, "xf-box", 2)
            f.text(xs[0] - 42, ym + 4, "I>", "xf-k", "middle")
        else:
            f.rect(xs[0] - 56, ym - 10, 26, 20, "xf-box", 2)
            f.text(xs[0] - 43, ym + 4, "I>>", "xf-k", "middle")
    if tag:
        f.text(xs[0] - (92 if kind == "q" and rel == "thmag" else 66 if kind == "q" else 30), ym + 4, tag, "xf-tag", "end")


def p_overload(f, xs, y, tag=None, h=44, terms=None, link=None):
    """Thermal overload relay: one bimetal element per phase (IEC 60617), mechanically coupled (dashed); its NC contact 95-96 sits in the control circuit."""
    for i, x in enumerate(xs):
        f.line(x, y, x, y + 10); f.line(x, y + h - 10, x, y + h)
        f.rect(x - 7, y + 10, 14, h - 20, "xf-box", 1)
        f.path(f"M {f1(x)} {f1(y + 10)} l 0 6 l -4 0 l 0 6 l 8 0 l 0 6 l -4 0 l 0 {f1(h - 38)}", "xf-thin")
        if terms:
            f.text(x + 9, y + 9, terms[0][i], "xf-k"); f.text(x + 9, y + h - 2, terms[1][i], "xf-k")
    ym = y + h / 2
    for a, b in zip(xs[:-1], xs[1:]):
        f.line(a + 7, ym, b - 7, ym, "xf-dash")
    if link:
        f.line(xs[-1] + 7, ym, xs[-1] + 34, ym, "xf-dash")
        f.text(xs[-1] + 40, ym + 4, link, "xf-k")
    if tag:
        f.text(xs[0] - 14, y + h / 2 + 4, tag, "xf-tag", "end")


def p_motor(f, xc, y, r=34, labels=("U1", "V1", "W1"), tag="-M1", xs=None, txt="M", pe_x=None):
    """Three-phase motor (IEC 60617): circle with M and 3~, terminal rings on the supply side;
    pe_x: x of the PE conductor, which is brought to the frame with a dot and the earth symbol."""
    if xs:
        r = max(r, (xs[-1] - xs[0]) / 2 * 1.45)
        for x, l in zip(xs, labels):
            yy = y + r - math.sqrt(max(r * r - (x - xc) ** 2, 0))
            f.line(x, y, x, yy)
            f.circ(x, yy, 3.2, "xf-term")
            f.text(x + (-6 if x < xc else 6), (y - 4) if x == xc else yy - 5, l, "xf-k", "end" if x < xc else None)
    f.circ(xc, y + r, r, "xf-motor")
    f.text(xc, y + r - 2, txt, "xf-h", "middle")
    f.text(xc, y + r + 16, "3~", "xf-h", "middle")
    if tag:
        f.text(xc + r * 0.75 + 6, y + 2 * r + 2, tag, "xf-tag")
    if pe_x is not None:
        yy = y + r
        edge = xc - r if pe_x < xc else xc + r
        f.line(pe_x, yy, edge, yy, "xf-pe")
        f.dot(edge, yy, 3.5)
        f.text(edge + (-6 if pe_x < xc else 6), yy - 6, "PE", "xf-k", "end" if pe_x < xc else None)
        return edge


def p_pe(f, x, y1, y2, label="PE"):
    """Protective conductor (green-yellow in reality: dash-dot) running down the side of the diagram."""
    f.text(x, y1 - 6, label, "xf-k", "middle")
    f.line(x, y1, x, y2, "xf-pe")


def rail3(f, xs, y, x2, names=("L1", "L2", "L3")):
    for x, n in zip(xs, names):
        f.line(xs[0] - 40, y + (x - xs[0]) / 3, x2, y + (x - xs[0]) / 3, "xf-rail")


# =========================================================================== NEMA / JIC (ANSI/NEMA ICS 19, ICS 2, NFPA 79, ANSI Y32.2 / IEEE 315)
# Ladder diagrams: two vertical rails, horizontal rungs, contacts as parallel bars, coils and lamps as circles with a letter,
# wire numbers on the nodes, and the rung numbers of a coil's contacts printed under the coil (underlined = NC contact).
NW = 64      # element width
NR = 64      # row pitch


def _wn(f, x, y, wn):
    if wn:
        f.text(x + 4, y - 5, str(wn), "xf-wn")


def n_wire(f, x, y, w=NW, wn=None, **_):
    f.line(x, y, x + w, y)
    _wn(f, x, y, wn)


def n_contact(f, x, y, w=NW, nc=False, tag=None, wn=None, note=None, **_):
    """NEMA contact of a relay / contactor / timer: two parallel bars (NC adds the diagonal)."""
    m = x + w / 2
    f.line(x, y, m - 7, y); f.line(m + 7, y, x + w, y)
    f.line(m - 7, y - 10, m - 7, y + 10); f.line(m + 7, y - 10, m + 7, y + 10)
    if nc:
        f.line(m - 12, y + 11, m + 12, y - 11)
    if tag:
        f.text(m, y - 17, tag, "xf-tag", "middle")
    if note:
        f.text(m, y + 26, note, "xf-k", "middle")
    _wn(f, x, y, wn)


def n_pb(f, x, y, w=NW, nc=False, tag=None, wn=None, estop=False, **_):
    """Momentary push-button: contact symbol with the operator above (a bar; a red mushroom head for the emergency stop)."""
    m = x + w / 2
    n_contact(f, x, y, w, nc, None, wn)
    if estop:
        f.path(f"M {f1(m - 12)} {f1(y - 22)} A 12 12 0 0 1 {f1(m + 12)} {f1(y - 22)} Z", "xf-estop")
        f.line(m, y - 22, m, y - 3, "xf-dash")
        top = y - 36
    else:
        f.line(m - 11, y - 22, m + 11, y - 22)
        f.line(m, y - 22, m, y - 3, "xf-dash")
        top = y - 28
    if tag:
        f.text(m, top - 6, tag, "xf-tag", "middle")


def n_ol(f, x, y, w=NW, tag="OL", wn=None, **_):
    """Overload-relay contact: NC contact with the thermal (bimetal) mark under it."""
    n_contact(f, x, y, w, True, tag, wn)
    m = x + w / 2
    f.path(f"M {f1(m - 9)} {f1(y + 20)} l 3 -5 l 3 10 l 3 -10 l 3 10 l 3 -10 l 3 5", "xf-thin")


def n_fuse(f, x, y, w=NW, tag="FU", wn=None, **_):
    m = x + w / 2
    f.line(x, y, x + w, y)
    f.rect(m - 12, y - 6, 24, 12, "xf-box", 1)
    if tag:
        f.text(m, y - 13, tag, "xf-tag", "middle")
    _wn(f, x, y, wn)


def n_coil(f, x, y, w=NW, tag="M", wn=None, **_):
    """Coil of a starter (M), control relay (CR) or timer (TR): a circle with the letters inside."""
    m = x + w / 2
    f.line(x, y, m - 17, y); f.line(m + 17, y, x + w, y)
    f.circ(m, y, 17, "xf-coil")
    f.text(m, y + 5, tag, "xf-h" if len(tag) <= 2 else "xf-k", "middle")
    _wn(f, x, y, wn)
    ref = getattr(f, "xr", {}).get(tag)
    if ref:
        items = [(r, False) for r in ref["no"]] + [(r, True) for r in ref["nc"]]
        items.sort(key=lambda t: (t[0], t[1]))
        x0 = m - (len(items) * 15 - 3) / 2
        for i, (r, nc) in enumerate(items):
            xx = x0 + i * 15
            f.text(xx + 5, y + 36, str(r), "xf-k", "middle")
            if nc:
                f.line(xx - 1, y + 39, xx + 11, y + 39, "xf-ln")


def n_lamp(f, x, y, w=NW, tag="G", wn=None, name=None, **_):
    m = x + w / 2
    f.line(x, y, m - 15, y); f.line(m + 15, y, x + w, y)
    f.circ(m, y, 15, "xf-box")
    f.text(m, y + 5, tag, "xf-h", "middle")
    if name:
        f.text(m, y - 23, name, "xf-tag", "middle")
    _wn(f, x, y, wn)


# ---- horizontal layout engine:  ("el", fn, kw) · ("seq", [..]) · ("par", [..]) · ("rn", rung_no, node)
def NE(fn, **kw):
    return ("el", fn, kw)


def NS(*items):
    return ("seq", list(items))


def NP(*items):
    return ("par", list(items))


def NRN(n, node):
    return ("rn", n, node)


def hs(n):
    k = n[0]
    if k == "el":
        return n[2].get("w", NW), 1
    if k == "rn":
        return hs(n[2])
    sz = [hs(c) for c in n[1]]
    if k == "seq":
        return sum(w for w, _ in sz), max(r for _, r in sz)
    return max(w for w, _ in sz), sum(r for _, r in sz)


def hd(f, n, x, y, w):
    k = n[0]
    if k == "el":
        kw = {a: b for a, b in n[2].items() if a not in ("R", "w")}
        reg = getattr(f, "reg", None)
        if reg is not None:
            reg.append((n[1], kw.get("tag"), kw.get("nc", False), getattr(f, "curr", 0)))
        n[1](f, x, y, w=w, **kw)
        return
    if k == "rn":
        f.curr = n[1]
        f.text(f.xL - 20, y + 4, str(n[1]), "xf-rn", "middle")
        hd(f, n[2], x, y, w)
        return
    if k == "seq":
        items = n[1]
        tail = []
        while items and items[-1][0] == "el" and items[-1][2].get("R"):
            tail.insert(0, items[-1]); items = items[:-1]
        wh = sum(hs(c)[0] for c in items); wt = sum(hs(c)[0] for c in tail)
        extra = w - wh - wt
        if tail:
            xx = x
            for c in items:
                cw = hs(c)[0]; hd(f, c, xx, y, cw); xx += cw
            f.line(xx, y, x + w - wt, y)
            xx = x + w - wt
            for c in tail:
                cw = hs(c)[0]; hd(f, c, xx, y, cw); xx += cw
        else:
            xx = x
            for i, c in enumerate(items):
                cw = hs(c)[0] + (extra if i == len(items) - 1 else 0)
                hd(f, c, xx, y, cw); xx += cw
        return
    # parallel: stacked branches joined by vertical connectors at both ends
    off, ys = 0, []
    for c in n[1]:
        ys.append(y + off * NR)
        hd(f, c, x, y + off * NR, w)
        off += hs(c)[1]
    if len(ys) > 1:
        f.line(x, ys[0], x, ys[-1]); f.line(x + w, ys[0], x + w, ys[-1])
        for yy in ys[:-1]:
            f.dot(x, yy); f.dot(x + w, yy)


def nema_ladder(f, rungs, xL, xR, ytop, left="X1", right="X2", gap=18):
    """Draw a ladder: rails xL / xR, one entry of `rungs` per rung (stacked). Returns the bottom y of the rails."""
    g = F(f.w, f.h, "", "tmp"); g.reg = []; g.curr = 0; g.xL = xL
    y = ytop + 44
    for r in rungs:
        hd(g, r, xL, y, xR - xL); y += hs(r)[1] * NR + gap
    xr = {}
    for fn, tag, nc, rung in g.reg:
        if not tag or fn not in (n_contact, n_pb):
            continue
        d = xr.setdefault(tag, {"no": [], "nc": []})
        d["nc" if nc else "no"].append(rung)
    for d in xr.values():
        d["no"] = sorted(set(d["no"])); d["nc"] = sorted(set(d["nc"]))
    f.xr, f.reg, f.curr, f.xL = xr, [], 0, xL
    y = ytop + 44
    ys = []
    for r in rungs:
        ys.append(y)
        hd(f, r, xL, y, xR - xL); y += hs(r)[1] * NR + gap
    yb = y - gap + 34
    f.line(xL, ytop, xL, yb, "xf-rail"); f.line(xR, ytop, xR, yb, "xf-rail")
    f.text(xL, ytop - 14, left, "xf-tag", "middle"); f.text(xR, ytop - 14, right, "xf-tag", "middle")
    return yb, ys


# ---- NEMA power-circuit pieces (vertical)
def n_poles(f, xs, y, tag="M", h=46, terms=True, c="xf-ln"):
    """Power contacts of a starter/contactor: two short bars across each line (NEMA), joined by a dashed mechanical link."""
    ym = y + h / 2
    for x in xs:
        f.line(x, y, x, ym - 5); f.line(x, ym + 5, x, y + h)
        f.line(x - 10, ym - 5, x + 10, ym - 5); f.line(x - 10, ym + 5, x + 10, ym + 5)
    f.line(xs[0] - 16, ym, xs[-1] + 16, ym, "xf-dash")
    if tag:
        f.text(xs[0] - 26, ym + 4, tag, "xf-tag", "end")
    if terms:
        for x, a, b in zip(xs, ("L1", "L2", "L3"), ("T1", "T2", "T3")):
            f.text(x + 5, y + 9, a, "xf-k"); f.text(x + 5, y + h - 2, b, "xf-k")


def n_heaters(f, xs, y, h=44, tag="OL", link=None):
    """Overload-relay heater elements: a zig-zag in each line."""
    for x in xs:
        f.line(x, y, x, y + 8); f.line(x, y + h - 8, x, y + h)
        f.path(f"M {f1(x)} {f1(y + 8)} l 6 3 l -12 6 l 12 6 l -12 6 l 6 3", "xf-ln")
    ym = y + h / 2
    for a, b in zip(xs[:-1], xs[1:]):
        f.line(a + 8, ym, b - 8, ym, "xf-dash")
    if link:
        f.line(xs[-1] + 8, ym, xs[-1] + 30, ym, "xf-dash")
        f.text(xs[-1] + 36, ym + 4, link, "xf-k")
    if tag:
        f.text(xs[0] - 16, ym + 4, tag, "xf-tag", "end")


def n_disc(f, xs, y, tag="DISC", h=50, fuses=True):
    """Fused disconnect switch: blade switch per pole with a fuse below it, poles ganged by a dashed link."""
    a, b = y + 14, y + 36
    for x in xs:
        f.line(x, y, x, a); f.line(x, b, x, y + h)
        f.line(x, b, x - 11, a - 1)
        f.circ(x, a, 2.2, "xf-dotk")
    f.line(xs[0] - 6, (a + b) / 2, xs[-1] - 6, (a + b) / 2, "xf-dash")
    if tag:
        f.text(xs[0] - 26, (a + b) / 2 + 4, tag, "xf-tag", "end")
    if fuses:
        for x in xs:
            f.line(x, y + h, x, y + h + 34)
            f.rect(x - 6, y + h + 8, 12, 18, "xf-box", 1)
        f.text(xs[0] - 26, y + h + 21, "FU", "xf-tag", "end")
    return y + h + (34 if fuses else 0)


def n_xfmr(f, x, y, h=64, tag="CT"):
    """Control transformer: primary (left) and secondary (right) windings with a core between them; leads H1/H4 and X1/X2."""
    for xx, bulge in ((x, -1), (x + 40, 1)):
        d = f"M {f1(xx)} {f1(y + 8)}"
        step = (h - 16) / 4
        for _ in range(4):
            d += f" a 5 {f1(step / 2)} 0 0 {1 if bulge > 0 else 0} 0 {f1(step)}"
        f.path(d, "xf-ln")
        f.line(xx, y, xx, y + 8); f.line(xx, y + h - 8, xx, y + h)
    f.line(x + 17, y + 6, x + 17, y + h - 6); f.line(x + 23, y + 6, x + 23, y + h - 6)
    f.text(x + 20, y + h + 16, tag, "xf-tag", "middle")


# =========================================================================== motor model (same as assets/mc-lab.js)
# double-cage rotor (outer cage Ro, Xo · inner cage Ri, Xi), per phase, Y-equivalent, fitted to a 7.5 kW 4-pole IE3 motor:
# In ≈ 14.0 A, Is/In ≈ 6.5, Ts/Tn ≈ 2.15, Tmax/Tn ≈ 3.0 at ≈ 1300 rpm, 1471 rpm, cos φ ≈ 0.82
MP = dict(V=400 / math.sqrt(3), R1=0.414, X1=1.599, Xm=34.33, Ro=1.306, Xo=0.585, Ri=0.463, Xi=2.199, ns=1500.0)


def motor(s, V=None, f=50.0):
    """Per-phase (Y-equivalent) double-cage induction motor. Returns (I_line A, T Nm, pf)."""
    V = MP["V"] if V is None else V
    k = f / 50.0
    s = max(s, 1e-5)
    Zo = complex(MP["Ro"] / s, MP["Xo"] * k)
    Zi = complex(MP["Ri"] / s, MP["Xi"] * k)
    Z2 = Zo * Zi / (Zo + Zi)
    Zm = complex(0, MP["Xm"] * k)
    Z = complex(MP["R1"], MP["X1"] * k) + Zm * Z2 / (Zm + Z2)
    I1 = V / Z
    E = V - I1 * complex(MP["R1"], MP["X1"] * k)
    I2 = E / Z2
    ws = 2 * math.pi * MP["ns"] * k / 60
    T = 3 * abs(I2) ** 2 * Z2.real / ws
    return abs(I1), T, math.cos(cmath.phase(I1))


S_RATED = 0.0194
IN, TN, _ = motor(S_RATED)


class Plot:
    def __init__(self, f, x, y, w, h, xr, yr, y2r=None):
        self.f, self.x, self.y, self.w, self.h, self.xr, self.yr, self.y2r = f, x, y, w, h, xr, yr, y2r

    def X(self, v):
        return self.x + (v - self.xr[0]) / (self.xr[1] - self.xr[0]) * self.w

    def Y(self, v, ax=1):
        r = self.yr if ax == 1 else self.y2r
        return self.y + self.h - (v - r[0]) / (r[1] - r[0]) * self.h

    def frame(self, xt, yt, y2t=None, xl=None, yl=None, y2l=None, xf=None, yf=None, y2f=None):
        f = self.f
        for t in yt:
            f.line(self.x, self.Y(t), self.x + self.w, self.Y(t), "xf-grid")
            f.text(self.x - 6, self.Y(t) + 4, yf(t) if yf else t, "xf-k", "end")
        for t in xt:
            f.line(self.X(t), self.y, self.X(t), self.y + self.h, "xf-grid")
            f.text(self.X(t), self.y + self.h + 15, xf(t) if xf else t, "xf-k", "middle")
        if y2t:
            for t in y2t:
                f.text(self.x + self.w + 6, self.Y(t, 2) + 4, y2f(t) if y2f else t, "xf-k xf-ta")
        f.line(self.x, self.y + self.h, self.x + self.w, self.y + self.h, "xf-thin")
        f.line(self.x, self.y, self.x, self.y + self.h, "xf-thin")
        if xl:
            f.text(self.x + self.w / 2, self.y + self.h + 32, xl, "xf-m", "middle")
        if yl:
            f.text(self.x - 40, self.y + self.h / 2, yl, "xf-m", "middle", -90)
        if y2l:
            f.text(self.x + self.w + 44, self.y + self.h / 2, y2l, "xf-m xf-ta", "middle", 90)

    def curve(self, pts, c, ax=1):
        self.f.poly([(self.X(a), self.Y(b, ax)) for a, b in pts], c)


# =========================================================================== MOTORS
@fig("mc-torque-speed")
def _():
    f = F(760, 360, T("กราฟแรงบิดและกระแสเทียบความเร็วรอบของมอเตอร์เหนี่ยวนำ 7.5 kW 4 ขั้ว 400 V 50 Hz พร้อมเส้นโหลดปั๊มและโหลดแรงบิดคงที่",
                      "Torque and current versus speed of a 7.5 kW 4-pole 400 V 50 Hz induction motor with pump and constant-torque load lines"), "mc-torque-speed")
    pl = Plot(f, 70, 30, 600, 270, (0, 1500), (0, 3.4), (0, 8))
    pl.frame(range(0, 1501, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], [0, 2, 4, 6, 8], T("ความเร็วรอบ n (rpm)", "Speed n (rpm)"), T("แรงบิด T/Tn", "Torque T/Tn"), T("กระแส I/In", "Current I/In"),
             yf=lambda t: f"{t:g}")
    ns = [i for i in range(0, 1500, 5)] + [1499]
    T_pts, I_pts = [], []
    for n in ns:
        s = 1 - n / 1500
        i, t, _ = motor(s)
        T_pts.append((n, t / TN)); I_pts.append((n, i / IN))
    pl.curve(I_pts, "xf-a", 2)
    pl.curve(T_pts, "xf-b")
    pl.curve([(n, 0.15 + 0.85 * (n / 1471) ** 2) for n in range(0, 1501, 25)], "xf-c")
    pl.curve([(0, 1), (1500, 1)], "xf-dash")
    # marks
    i0, t0, _ = motor(1)
    tm = max(motor(1 - n / 1500)[1] for n in range(600, 1495))
    nm = max(range(600, 1495), key=lambda n: motor(1 - n / 1500)[1])
    f.dot(pl.X(0), pl.Y(t0 / TN), 4, "xf-dot")
    f.text(pl.X(0) + 8, pl.Y(t0 / TN) + 18, T(f"แรงบิดเริ่ม {t0 / TN:.1f}·Tn", f"Locked-rotor torque {t0 / TN:.1f}·Tn"), "xf-tb")
    f.dot(pl.X(nm), pl.Y(tm / TN), 4, "xf-dot")
    f.text(pl.X(nm) - 6, pl.Y(tm / TN) - 10, T(f"แรงบิดสูงสุด {tm / TN:.1f}·Tn", f"Breakdown {tm / TN:.1f}·Tn"), "xf-tb", "end")
    f.dot(pl.X(1471), pl.Y(1), 4, "xf-dot")
    f.text(pl.X(1471) - 6, pl.Y(1) + 18, T("จุดพิกัด 1471 rpm", "Rated 1471 rpm"), "xf-k", "end")
    f.text(pl.X(0) + 8, pl.Y(i0 / IN, 2) - 8, T(f"กระแสสตาร์ท {i0 / IN:.1f}·In", f"Starting current {i0 / IN:.1f}·In"), "xf-ta")
    f.text(pl.X(900), pl.Y(0.15 + 0.85 * (900 / 1471) ** 2) - 8, T("โหลดปั๊ม/พัดลม T ∝ n²", "Pump/fan load T ∝ n²"), "xf-tc", "middle")
    f.text(pl.X(300), pl.Y(1) - 6, T("โหลดแรงบิดคงที่ (สายพาน)", "Constant-torque load (conveyor)"), "xf-k")
    f.text(pl.X(1500) - 4, pl.y + 12, T("n_s = 1500", "n_s = 1500"), "xf-k", "end")
    f.text(380, 352, T("ส่วนต่างระหว่างแรงบิดมอเตอร์กับแรงบิดโหลดคือแรงบิดเร่ง — ยิ่งต่างมากยิ่งเร่งถึงความเร็วเร็ว",
                       "The gap between motor and load torque is the accelerating torque — the larger it is, the faster the run-up"), "xf-m", "middle")
    return f.svg()


@fig("mc-equivalent-circuit")
def _():
    f = F(740, 220, T("วงจรสมมูลต่อเฟสของมอเตอร์เหนี่ยวนำ: R1 X1 ของสเตเตอร์ Xm กระแสแม่เหล็ก และ R2'/s X2' ของโรเตอร์",
                      "Per-phase equivalent circuit of an induction motor: stator R1 X1, magnetising Xm and rotor R2'/s X2'"), "mc-equivalent-circuit")
    y0, y1 = 60, 170
    f.circ(60, 115, 18, "xf-box"); f.text(60, 120, "~", "xf-h", "middle")
    f.line(60, 97, 60, y0); f.line(60, 133, 60, y1)
    f.text(30, 120, "V₁", "xf-h", "end")
    def res(x1, x2, y, lab):
        L = x2 - x1; a, b = x1 + L * .25, x2 - L * .25
        pts = [(x1, y), (a, y)] + [(a + (b - a) * (i + .5) / 6, y + (-7 if i % 2 == 0 else 7)) for i in range(6)] + [(b, y), (x2, y)]
        f.poly(pts); f.text((x1 + x2) / 2, y - 14, lab, "xf-m", "middle")
    def ind(x1, x2, y, lab):
        L = x2 - x1; a = x1 + L * .2; b = x2 - L * .2; n = 4; r = (b - a) / n / 2
        f.line(x1, y, a, y); f.line(b, y, x2, y)
        f.path("M " + f"{f1(a)} {y} " + " ".join(f"a {f1(r)} {f1(r)} 0 0 1 {f1(2 * r)} 0" for _ in range(n)))
        f.text((x1 + x2) / 2, y - 14, lab, "xf-m", "middle")
    f.line(60, y0, 90, y0)
    res(90, 190, y0, "R₁"); ind(190, 290, y0, "jX₁")
    f.line(290, y0, 360, y0); f.dot(330, y0)
    f.line(330, y0, 330, 90);
    f.path(f"M 330 90 " + " ".join("a 9 9 0 0 1 0 18" for _ in range(3)) + " L 330 170")
    f.text(345, 125, "jXm", "xf-m")
    ind(360, 460, y0, "jX₂′"); res(470, 600, y0, "R₂′/s")
    f.line(460, y0, 470, y0)
    f.line(600, y0, 620, y0); f.line(620, y0, 620, y1); f.line(60, y1, 620, y1); f.dot(330, y1)
    f.text(490, 110, "R₂′/s = R₂′ + R₂′(1−s)/s", "xf-k", "middle")
    f.text(490, 128, T("ส่วนหลัง = กำลังกลที่เพลา", "2nd term = mechanical power"), "xf-k", "middle")
    f.text(370, 205, T("s = 1 (หยุดนิ่ง): R₂′/s เล็ก → กระแสสูงมาก · s ≈ 0.03 (พิกัด): R₂′/s ใหญ่ → กระแสต่ำ",
                       "s = 1 (standstill): R₂′/s small → very high current · s ≈ 0.03 (rated): R₂′/s large → low current"), "xf-m", "middle")
    return f.svg()


@fig("mc-rotating-field")
def _():
    f = F(760, 262, T("กระแสสามเฟสห่างกัน 120° สร้างสนามแม่เหล็กลัพธ์ขนาดคงที่ 1.5 เท่า ที่หมุนด้วยความเร็วซิงโครนัส",
                      "Three currents 120° apart produce a resultant field of constant size (1.5×) rotating at synchronous speed"), "mc-rotating-field")
    pl = Plot(f, 50, 30, 420, 160, (0, 360), (-1.2, 1.2))
    pl.frame([0, 90, 180, 270, 360], [-1, 0, 1], xl=T("มุมทางไฟฟ้า ωt (องศา)", "Electrical angle ωt (deg)"), xf=lambda t: f"{t}°", yf=lambda t: f"{t:g}")
    cls = ["xf-a", "xf-b", "xf-c"]
    for k in range(3):
        pl.curve([(d, math.cos(math.radians(d - 120 * k))) for d in range(0, 361, 4)], cls[k])
    marks = [0, 60, 120]
    for i, d in enumerate(marks):
        f.line(pl.X(d), pl.y, pl.X(d), pl.y + pl.h, "xf-dash")
        f.text(pl.X(d) + 3, pl.y + 12, f"t{i + 1}", "xf-k")
    f.text(pl.X(355), pl.Y(1.05), "iA", "xf-ta", "end")
    for i, d in enumerate(marks):
        cx, cy, R = 545 + i * 72, 110, 30
        f.circ(cx, cy, R + 4, "xf-thin")
        bx = by = 0
        for k in range(3):
            a = math.radians(90 - 120 * k)
            mag = math.cos(math.radians(d - 120 * k))
            bx += mag * math.cos(a); by += mag * math.sin(a)
        f.line(cx, cy, cx + bx * R / 1.5, cy - by * R / 1.5, "xf-b", "end")
        f.text(cx, cy + R + 22, f"t{i + 1} · {d}°", "xf-k", "middle")
    f.text(617, 40, T("สนามลัพธ์ B (หมุน)", "Resultant field B (rotating)"), "xf-m", "middle")
    f.text(380, 252, T("n_s = 120f/p · 50 Hz: 2 ขั้ว 3000 · 4 ขั้ว 1500 · 6 ขั้ว 1000 · 8 ขั้ว 750 rpm",
                       "n_s = 120f/p · 50 Hz: 2-pole 3000 · 4-pole 1500 · 6-pole 1000 · 8-pole 750 rpm"), "xf-m", "middle")
    return f.svg()


@fig("mc-motor-parts")
def _():
    f = F(760, 280, T("ส่วนประกอบของมอเตอร์เหนี่ยวนำกรงกระรอก TEFC: สเตเตอร์ ขดลวด โรเตอร์กรงกระรอก เพลา ตลับลูกปืน พัดลมระบายความร้อน และกล่องขั้ว",
                      "Parts of a TEFC squirrel-cage induction motor: stator, winding, cage rotor, shaft, bearings, cooling fan and terminal box"), "mc-motor-parts")
    # housing
    f.rect(170, 70, 380, 150, "xf-metal", 10)
    for x in range(185, 545, 18):
        f.line(x, 70, x, 60, "xf-thin"); f.line(x, 220, x, 230, "xf-thin")
    f.rect(200, 92, 320, 106, "xf-boxa", 4)   # stator core
    f.rect(240, 118, 240, 54, "xf-boxb", 3)   # rotor
    for x in range(250, 475, 22):
        f.line(x, 118, x, 172, "xf-b")
    f.rect(232, 112, 8, 66, "xf-boxb", 1); f.rect(480, 112, 8, 66, "xf-boxb", 1)
    f.line(90, 145, 650, 145, "xf-shaft")
    f.rect(165, 132, 18, 26, "xf-box", 2); f.rect(537, 132, 18, 26, "xf-box", 2)
    f.path("M 560 95 L 600 95 L 610 145 L 600 195 L 560 195", "xf-ln")  # fan cover
    for k in range(4):
        f.line(572 + k * 8, 110, 572 + k * 8, 180, "xf-thin")
    f.rect(320, 34, 90, 36, "xf-box", 4); f.text(365, 57, T("กล่องขั้ว", "Terminal box"), "xf-k", "middle")
    for (x, y, tx, ty, s, a) in [
        (210, 100, 120, 30, T("แกนเหล็กสเตเตอร์ + ขดลวด", "Stator core + winding"), "middle"),
        (300, 125, 260, 255, T("โรเตอร์กรงกระรอก (แท่งอะลูมิเนียม)", "Cage rotor (aluminium bars)"), "middle"),
        (236, 172, 120, 255, T("แหวนลัดวงจร", "End ring"), "middle"),
        (174, 158, 90, 200, T("ตลับลูกปืน", "Bearing"), "middle"),
        (100, 145, 70, 110, T("เพลา", "Shaft"), "middle"),
        (590, 120, 690, 100, T("พัดลมระบายความร้อน", "Cooling fan"), "middle"),
        (520, 210, 640, 245, T("ครีบระบายความร้อน", "Cooling fins"), "middle"),
    ]:
        f.line(x, y, tx, ty + (-10 if ty > y else 6), "xf-thin")
        f.text(tx, ty, s, "xf-k", a)
    return f.svg()


@fig("mc-nameplate")
def _():
    f = F(760, 300, T("ตัวอย่างแผ่นป้ายมอเตอร์ 7.5 kW 4 ขั้ว 400/690 V Δ/Y 50 Hz พร้อมคำอธิบายแต่ละช่อง",
                      "Sample nameplate of a 7.5 kW 4-pole 400/690 V Δ/Y 50 Hz motor with each field explained"), "mc-nameplate")
    f.rect(40, 30, 380, 240, "xf-plate", 8)
    rows = [("3~ Motor  IEC 60034-1", ""), ("Type  M3AA 132 M4  IP55  IC411", "IP · IC"), ("400 V Δ   14.6 A", "Δ"), ("690 V Y    8.4 A", "Y"),
            ("7.5 kW   50 Hz   1470 r/min", "P f n"), ("cos φ 0.82   IE3 90.4 %", "IE"), ("Ins.cl. F   ΔT B   S1   Ta 40 °C", "S1"), ("Iₐ/Iₙ 6.5   Tₐ/Tₙ 2.2   Tₖ/Tₙ 3.0", "")]
    for i, (s, _) in enumerate(rows):
        f.text(60, 62 + i * 26, s, "xf-plt")
    notes = [
        (95, T("ระดับป้องกันฝุ่น-น้ำ · วิธีระบายความร้อน", "Ingress protection · cooling method")),
        (121, T("ต่อเดลต้าเมื่อแรงดันสาย 400 V ← ใช้กับไฟ 400 V", "Delta when the line voltage is 400 V ← use on 400 V")),
        (147, T("ต่อสตาร์เมื่อแรงดันสาย 690 V", "Star when the line voltage is 690 V")),
        (173, T("กำลังกลที่เพลา ไม่ใช่กำลังไฟฟ้าที่ดึง", "Mechanical output at the shaft, not electrical input")),
        (199, T("ประสิทธิภาพตาม IEC 60034-30-1", "Efficiency class to IEC 60034-30-1")),
        (225, T("ฉนวนคลาส F (155 °C) · ใช้งานต่อเนื่อง S1", "Class F insulation (155 °C) · continuous duty S1")),
        (251, T("กระแสและแรงบิดตอนสตาร์ท · แรงบิดสูงสุด", "Starting current & torque · breakdown torque")),
    ]
    for y, s in notes:
        f.line(425, y - 4, 450, y - 4, "xf-thin")
        f.text(456, y, s, "xf-k")
    return f.svg()


@fig("mc-supply-phasor")
def _():
    f = F(760, 270, T("ระบบสามเฟสสี่สาย 230/400 V 50 Hz: แรงดันเฟส 230 V ห่างกัน 120° แรงดันสาย = √3 × 230 = 400 V นำหน้าแรงดันเฟส 30°",
                      "Three-phase four-wire 230/400 V 50 Hz: phase voltages of 230 V 120° apart, line voltage = √3 × 230 = 400 V leading by 30°"), "mc-supply-phasor")
    pl = Plot(f, 50, 25, 400, 190, (0, 20), (-600, 600))
    pl.frame([0, 5, 10, 15, 20], [-565, -325, 0, 325, 565], xl=T("เวลา (ms) · 1 รอบ = 20 ms", "Time (ms) · one cycle = 20 ms"), yf=lambda v: f"{v:g}")
    cls = ["xf-a", "xf-b", "xf-c"]
    for k in range(3):
        pl.curve([(t / 10, 325 * math.sin(2 * math.pi * 50 * t / 10000 - 2 * math.pi * k / 3)) for t in range(0, 201)], cls[k])
    pl.curve([(t / 10, 565 * math.sin(2 * math.pi * 50 * t / 10000 + math.pi / 6)) for t in range(0, 201)], "xf-d")
    f.text(pl.X(1), pl.Y(565) - 4, "v₁₂ (400 V rms, 565 Vp)", "xf-k")
    f.text(pl.X(20) - 2, pl.Y(325) - 4, "v₁ v₂ v₃ (230 V rms, 325 Vp)", "xf-k", "end")
    cx, cy, R = 610, 125, 70
    for k, c in enumerate(cls):
        a = math.radians(90 - 120 * k)
        f.line(cx, cy, cx + R * math.cos(a) * .6, cy - R * math.sin(a) * .6, c, "end")
        f.text(cx + R * math.cos(a) * .78, cy - R * math.sin(a) * .78 + 4, f"V{k + 1}", "xf-k", "middle")
    a1, a2 = math.radians(90), math.radians(-30)
    p1 = (cx + R * .6 * math.cos(a1), cy - R * .6 * math.sin(a1)); p2 = (cx + R * .6 * math.cos(a2), cy - R * .6 * math.sin(a2))
    f.line(p2[0], p2[1], p1[0], p1[1], "xf-d", "end")
    f.text((p1[0] + p2[0]) / 2 + 10, (p1[1] + p2[1]) / 2, "V₁₂", "xf-k")
    f.text(cx, 240, T("V_L = √3 · V_ph", "V_L = √3 · V_ph"), "xf-m", "middle")
    return f.svg()


@fig("mc-earthing")
def _():
    f = F(760, 300, T("ระบบสายดิน TN-C-S ที่ใช้ในไทยและหลายประเทศ: หม้อแปลงต่อ Y ลงดิน สาย PEN แยกเป็น N และ PE ที่ตู้เมน โครงมอเตอร์ต่อ PE",
                      "TN-C-S earthing used in Thailand and many countries: Y transformer neutral earthed, PEN split into N and PE at the main board, motor frame bonded to PE"), "mc-earthing")
    f.rect(20, 50, 120, 170, "xf-boxa", 8); f.text(80, 40, T("หม้อแปลง 22 kV/400 V", "Transformer 22 kV/400 V"), "xf-k", "middle")
    for i in range(3):
        y = 80 + i * 40
        f.path(f"M 60 {y} " + " ".join("a 6 6 0 0 1 12 0" for _ in range(4)), "xf-ln")
        f.line(108, y, 130, y)
    f.line(60, 80, 50, 80); f.line(60, 120, 50, 120); f.line(60, 160, 50, 160)
    f.line(50, 80, 50, 200); f.line(50, 200, 130, 200)
    f.text(84, 213, "N★", "xf-k", "middle")
    f.line(50, 200, 50, 260); f.path("M 36 260 L 64 260 M 41 266 L 59 266 M 46 272 L 54 272", "xf-ln")
    names = ["L1", "L2", "L3", "PEN"]
    ys = [80, 120, 160, 200]
    for n, y in zip(names, ys):
        f.line(130, y, 330, y, "xf-rail" if n != "PEN" else "xf-pe")
        f.text(150, y - 5, n, "xf-k")
    f.rect(330, 60, 120, 200, "xf-box", 8); f.text(390, 50, T("ตู้เมน (MDB)", "Main board (MDB)"), "xf-k", "middle")
    f.line(360, 200, 360, 240, "xf-pe"); f.line(360, 200, 450, 200, "xf-rail"); f.line(360, 240, 450, 240, "xf-pe"); f.dot(360, 200)
    f.text(390, 195, "N", "xf-k"); f.text(390, 235, "PE", "xf-k")
    f.line(360, 240, 360, 280); f.path("M 346 280 L 374 280", "xf-ln")
    for y in ys[:3]:
        f.line(330, y, 450, y, "xf-rail")
    for y in ys[:3]:
        f.line(450, y, 600, y, "xf-rail")
    f.line(450, 240, 640, 240, "xf-pe")
    f.circ(640, 130, 40, "xf-motor"); f.text(640, 128, "M", "xf-h", "middle"); f.text(640, 146, "3~", "xf-h", "middle")
    for y in ys[:3]:
        f.line(600, y, 615, 130 + (y - 120) / 2)
    f.line(640, 170, 640, 240, "xf-pe")
    f.text(700, 205, T("โครงมอเตอร์", "Motor frame"), "xf-k", "middle"); f.text(700, 221, T("ต่อ PE", "bonded to PE"), "xf-k", "middle")
    f.text(560, 40, T("มอเตอร์สามเฟส 400 V ไม่ใช้สาย N", "A 400 V 3-phase motor needs no N"), "xf-k", "middle")
    f.text(400, 292, T("TT: ผู้ใช้ไฟมีหลักดินของตัวเอง ไม่ต่อ N กับ PE → ต้องมี RCD · IT: ไม่ต่อลงดิน ใช้ในงานพิเศษ",
                       "TT: consumer has its own earth electrode, N and PE separate → RCD needed · IT: unearthed, special uses"), "xf-m", "middle")
    return f.svg()


@fig("mc-terminal-box")
def _():
    f = F(760, 330, T("กล่องขั้วมอเตอร์ 6 ขั้ว: การวางแผ่นทองแดงเชื่อม (link) สำหรับต่อแบบสตาร์ และแบบเดลต้า พร้อมขดลวดที่ได้",
                      "Six-terminal motor box: link positions for star and for delta, and the resulting winding connection"), "mc-terminal-box")
    def box(x0, mode):
        f.rect(x0, 40, 200, 130, "xf-box", 10)
        top = ["U1", "V1", "W1"]; bot = ["W2", "U2", "V2"]
        for i in range(3):
            xt = x0 + 40 + i * 60
            f.circ(xt, 75, 11, "xf-term"); f.text(xt, 62 - 4, top[i], "xf-k", "middle")
            f.circ(xt, 135, 11, "xf-term"); f.text(xt, 162, bot[i], "xf-k", "middle")
            f.line(xt, 40, xt, 64, "xf-rail"); f.text(xt, 32, ["L1", "L2", "L3"][i], "xf-k", "middle")
        if mode == "Y":
            f.rect(x0 + 30, 129, 140, 12, "xf-link", 3)
        else:
            for i in range(3):
                xt = x0 + 40 + i * 60
                f.rect(xt - 6, 70, 12, 70, "xf-link", 3)
        f.text(x0 + 100, 195, T("สตาร์ (Y)", "Star (Y)") if mode == "Y" else T("เดลต้า (Δ)", "Delta (Δ)"), "xf-h", "middle")
    box(40, "Y"); box(300, "D")
    # winding schematics
    cx, cy = 650, 95
    for k in range(3):
        a = math.radians(90 + 120 * k)
        x2, y2 = cx + 50 * math.cos(a), cy - 50 * math.sin(a)
        f.line(cx, cy, x2, y2, "xf-a")
    f.text(cx, 30, T("Y: ปลาย W2 U2 V2 ต่อรวมเป็นจุดนิวทรัล", "Y: W2 U2 V2 joined into a star point"), "xf-k", "middle")
    f.dot(cx, cy, 4, "xf-dot")
    tx, ty = 650, 245
    pts = [(tx, ty - 50), (tx - 50, ty + 30), (tx + 50, ty + 30)]
    f.poly(pts, "xf-b", True)
    for (x, y), l in zip(pts, ["L1", "L2", "L3"]):
        f.dot(x, y, 3.5, "xf-dot"); f.text(x, y - 8 if y < ty else y + 18, l, "xf-k", "middle")
    f.text(tx, 196 - 30, T("Δ: ต่อหัว-ท้ายเป็นวง", "Δ: windings joined head-to-tail"), "xf-k", "middle")
    f.text(240, 230, T("Y: ขดลวดแต่ละชุดได้ 400/√3 = 230 V", "Y: each winding gets 400/√3 = 230 V"), "xf-m", "middle")
    f.text(240, 252, T("Δ: ขดลวดแต่ละชุดได้ 400 V เต็ม (มากกว่า √3 เท่า)", "Δ: each winding gets the full 400 V (√3 times more)"), "xf-m", "middle")
    f.text(240, 280, T("ลิงก์ Δ เชื่อม U1–W2, V1–U2, W1–V2", "Δ links join U1–W2, V1–U2, W1–V2"), "xf-m", "middle")
    f.text(240, 302, T("ห้ามใส่ลิงก์เมื่อใช้สตาร์-เดลต้าสตาร์ทเตอร์ (ต้องดึงสาย 6 เส้น)", "Remove all links for a star–delta starter (six leads out)"), "xf-tb", "middle")
    return f.svg()


@fig("mc-voltage-choice")
def _():
    f = F(760, 300, T("เลือกการต่อขั้วจากแผ่นป้ายเมื่อใช้ไฟ 400 V: มอเตอร์ 230/400 V ต่อสตาร์ มอเตอร์ 400/690 V ต่อเดลต้าและสตาร์-เดลต้าสตาร์ทได้",
                      "Choosing the connection from the nameplate on a 400 V supply: a 230/400 V motor runs in star, a 400/690 V motor runs in delta and can be star–delta started"), "mc-voltage-choice")
    f.rect(270, 14, 220, 42, "xf-boxb", 8); f.text(380, 40, T("ระบบไฟ 400 V 50 Hz", "Supply 400 V 50 Hz"), "xf-h", "middle")
    f.line(380, 56, 380, 76); f.line(160, 76, 600, 76); f.line(160, 76, 160, 96, arrow="end"); f.line(600, 76, 600, 96, arrow="end")
    f.rect(40, 98, 240, 54, "xf-box", 8); f.text(160, 120, T("แผ่นป้าย 230/400 V Δ/Y", "Nameplate 230/400 V Δ/Y"), "xf-h", "middle"); f.text(160, 140, T("(มอเตอร์เล็ก ≤ ~3 kW)", "(small motors, ≤ ~3 kW)"), "xf-k", "middle")
    f.rect(480, 98, 240, 54, "xf-box", 8); f.text(600, 120, T("แผ่นป้าย 400/690 V Δ/Y", "Nameplate 400/690 V Δ/Y"), "xf-h", "middle"); f.text(600, 140, T("(มอเตอร์ ≥ ~4 kW)", "(motors ≥ ~4 kW)"), "xf-k", "middle")
    f.line(160, 152, 160, 176, arrow="end"); f.line(600, 152, 600, 176, arrow="end")
    f.rect(40, 178, 240, 54, "xf-boxa", 8); f.text(160, 200, T("ต่อสตาร์ (Y) ที่ 400 V", "Connect in STAR (Y) on 400 V"), "xf-h", "middle"); f.text(160, 220, T("สตาร์ทได้: DOL · ซอฟต์สตาร์ท · VFD", "Start: DOL · soft starter · VFD"), "xf-k", "middle")
    f.rect(480, 178, 240, 54, "xf-boxa", 8); f.text(600, 200, T("ต่อเดลต้า (Δ) ที่ 400 V", "Connect in DELTA (Δ) on 400 V"), "xf-h", "middle"); f.text(600, 220, T("สตาร์ทได้: DOL · Y-Δ · ซอฟต์ · VFD", "Start: DOL · Y–Δ · soft · VFD"), "xf-k", "middle")
    f.rect(40, 246, 240, 44, "xf-boxb", 8); f.text(160, 266, T("✗ สตาร์-เดลต้าไม่ได้: เดลต้าที่ 400 V", "✗ No star–delta: delta on 400 V"), "xf-k", "middle"); f.text(160, 282, T("ทำให้ขดลวดได้แรงดันเกิน √3 เท่า → ไหม้", "puts √3× voltage on windings → burns"), "xf-k", "middle")
    f.rect(480, 246, 240, 44, "xf-boxc", 8); f.text(600, 266, T("✓ ช่วงสตาร์ต่อ Y: ขดลวดได้ 230 V", "✓ During start Y: 230 V per winding"), "xf-k", "middle"); f.text(600, 282, T("กระแสและแรงบิดเหลือ 1/3", "current and torque fall to 1/3"), "xf-k", "middle")
    f.text(380, 112, T("กฎ: แรงดัน Δ บนป้าย", "Rule: plate Δ voltage"), "xf-k", "middle"); f.text(380, 128, T("= แรงดันสาย", "= line voltage"), "xf-k", "middle"); f.text(380, 144, T("→ สตาร์-เดลต้าได้", "→ Y–Δ possible"), "xf-k", "middle")
    return f.svg()


# =========================================================================== DEVICES
@fig("mc-contactor")
def _():
    f = F(760, 330, T("โครงสร้างแมกเนติกคอนแทกเตอร์: คอยล์พันรอบขาตรงกลางของแกนเหล็กรูปตัว E วงแหวนบังเงาอยู่ที่ขาด้านนอก อาร์เมเจอร์ สปริงดึงกลับ สะพานหน้าสัมผัสหลักและหน้าสัมผัสคงที่",
                      "Magnetic contactor construction: coil wound on the centre leg of an E-core, shading rings on the outer legs, armature, return spring, moving contact bridge and fixed contacts"), "mc-contactor")
    # contacts (top)
    f.line(160, 36, 500, 36, "xf-rail"); f.text(150, 40, T("หน้าสัมผัสคงที่ (ขั้ว 1/L1 3/L2 5/L3)", "Fixed contacts (1/L1 3/L2 5/L3)"), "xf-k", "end")
    for x in (270, 330, 390):
        f.rect(x - 9, 40, 18, 8, "xf-metal", 2)
    f.rect(250, 52, 160, 18, "xf-boxa", 3)
    f.line(330, 70, 330, 120, "xf-ln"); f.rect(322, 84, 16, 22, "xf-paper", 2)
    # armature (moving part) and the air gap
    f.rect(220, 120, 220, 36, "xf-metal", 4)
    # fixed E-core: outer legs, centre leg (slightly shorter: residual air gap), back
    f.rect(220, 190, 220, 76, "xf-metal", 4)
    f.rect(256, 186, 56, 84, "xf-paper", 0); f.rect(348, 186, 56, 84, "xf-paper", 0)   # winding windows
    f.rect(220, 186, 36, 80, "xf-metal", 2); f.rect(404, 186, 36, 80, "xf-metal", 2)    # outer legs
    f.rect(312, 190, 36, 76, "xf-metal", 2)                                              # centre leg
    f.rect(262, 198, 50, 60, "xf-coil", 3); f.rect(348, 198, 50, 60, "xf-coil", 3)      # coil section around the centre leg
    f.text(287, 232, "A1", "xf-k", "middle"); f.text(373, 232, "A2", "xf-k", "middle")
    f.rect(224, 187, 28, 6, "xf-boxb", 1); f.rect(408, 187, 28, 6, "xf-boxb", 1)         # shading rings on the outer legs
    f.path("M 330 156 l 7 5 l -14 5 l 14 5 l -14 5 l 7 5 l 0 3", "xf-ln")                 # return spring on the centre leg
    f.text(330, 284, T("แกนเหล็กอยู่กับที่ (เหล็กแผ่นบางอัดซ้อน)", "Fixed core (laminated steel)"), "xf-k", "middle")
    X = 520
    f.text(X, 62, T("สะพานหน้าสัมผัส (เคลื่อนที่ตามอาร์เมเจอร์)", "Moving contact bridge"), "xf-k"); f.line(412, 61, X - 5, 61, "xf-thin")
    f.text(X, 116, T("อาร์เมเจอร์ (เคลื่อนที่)", "Armature (moves)"), "xf-k"); f.line(440, 132, X - 5, 112, "xf-thin")
    f.text(X, 152, T("สปริงดึงกลับเมื่อตัดไฟคอยล์", "Return spring"), "xf-k"); f.line(337, 170, X - 5, 148, "xf-thin")
    f.text(X, 190, T("วงแหวนบังเงา: กันสั่น-ฮัมที่ไฟ AC", "Shading ring: stops AC hum"), "xf-k"); f.line(436, 190, X - 5, 186, "xf-thin")
    f.text(X, 232, T("คอยล์ A1–A2 (เช่น 230 VAC / 24 VDC)", "Coil A1–A2 (e.g. 230 VAC / 24 VDC)"), "xf-k"); f.line(398, 230, X - 5, 228, "xf-thin")
    f.text(X, 262, T("ขาตรงกลางสั้นกว่าเล็กน้อย: ช่องอากาศเหลือ", "Centre leg slightly shorter: residual gap"), "xf-k"); f.line(348, 252, X - 5, 258, "xf-thin")
    f.text(14, 196, T("1. จ่ายไฟคอยล์ → เกิดฟลักซ์แม่เหล็ก", "1. Coil on → magnetic flux"), "xf-k")
    f.text(14, 214, T("2. ดูดอาร์เมเจอร์ลง (ช่องอากาศปิด)", "2. Armature pulled down (gap closes)"), "xf-k")
    f.text(14, 232, T("3. NO ปิด · NC เปิด", "3. NO closes · NC opens"), "xf-k")
    f.text(14, 250, T("4. ตัดไฟ → สปริงดันกลับ", "4. Coil off → spring returns"), "xf-k")
    f.text(380, 312, T("ดูดติด (pick-up) 85–110 % Us · ปล่อย (drop-out) ≤ 75 % Us (ผู้ผลิตมักให้ 30–60 %) — IEC 60947-4-1",
                       "Pick-up 85–110 % Us · drop-out ≤ 75 % Us (makers often 30–60 %) — IEC 60947-4-1"), "xf-m", "middle")
    return f.svg()


@fig("mc-terminals")
def _():
    f = F(760, 280, T("เลขขั้วคอนแทกเตอร์ตาม IEC 60947: หน้าสัมผัสหลัก 1/L1–2/T1 3/L2–4/T2 5/L3–6/T3 คอยล์ A1–A2 หน้าสัมผัสช่วย NO หลักหน่วย 3–4 และ NC หลักหน่วย 1–2",
                      "Contactor terminal markings (IEC 60947): main 1/L1–2/T1 3/L2–4/T2 5/L3–6/T3, coil A1–A2, auxiliary NO units 3–4 and NC units 1–2"), "mc-terminals")
    f.rect(220, 40, 320, 180, "xf-box", 10)
    xs = [270, 320, 370]
    top = ["1/L1", "3/L2", "5/L3"]; bot = ["2/T1", "4/T2", "6/T3"]
    for i, x in enumerate(xs):
        f.line(x, 20, x, 60); f.line(x, 200, x, 240)
        f.circ(x, 60, 6, "xf-term"); f.circ(x, 200, 6, "xf-term")
        f.text(x, 80, top[i], "xf-k", "middle"); f.text(x, 190, bot[i], "xf-k", "middle")
    f.line(430, 20, 430, 60); f.circ(430, 60, 6, "xf-term"); f.text(430, 80, "13 NO", "xf-k", "middle")
    f.line(430, 200, 430, 240); f.circ(430, 200, 6, "xf-term"); f.text(430, 190, "14", "xf-k", "middle")
    f.line(490, 20, 490, 60); f.circ(490, 60, 6, "xf-term"); f.text(490, 80, "21 NC", "xf-k", "middle")
    f.line(490, 200, 490, 240); f.circ(490, 200, 6, "xf-term"); f.text(490, 190, "22", "xf-k", "middle")
    # coil terminals: A1 on the top, A2 on the bottom (IEC 60947-1 Annex L)
    f.line(320, 100, 320, 112); f.rect(300, 112, 40, 36, "xf-coil", 1); f.line(320, 148, 320, 160)
    f.circ(320, 100, 3.5, "xf-term"); f.circ(320, 160, 3.5, "xf-term")
    f.text(348, 108, "A1", "xf-k"); f.text(348, 168, "A2", "xf-k")
    f.text(380, 136, "-K1", "xf-tag")
    f.text(110, 60, T("ด้านไฟเข้า (line)", "Line side"), "xf-k", "middle")
    f.text(110, 205, T("ด้านโหลด (มอเตอร์)", "Load side (motor)"), "xf-k", "middle")
    f.text(650, 62, T("หลักหน่วย = ชนิดหน้าสัมผัส", "Units digit = function"), "xf-h", "middle")
    f.text(650, 84, T("1–2 = NC", "1–2 = NC"), "xf-k", "middle"); f.text(650, 102, T("3–4 = NO", "3–4 = NO"), "xf-k", "middle")
    f.text(650, 120, T("5–6 = NC หน้าสัมผัสพิเศษ", "5–6 = NC special function"), "xf-k", "middle"); f.text(650, 138, T("7–8 = NO หน้าสัมผัสพิเศษ", "7–8 = NO special function"), "xf-k", "middle")
    f.text(650, 160, T("(พิเศษ เช่น หน่วงเวลา: 15-16, 17-18)", "(special e.g. timed: 15-16, 17-18)"), "xf-k", "middle")
    f.text(650, 184, T("หลักสิบ = ลำดับตำแหน่งบนอุปกรณ์", "Tens digit = position on the device"), "xf-k", "middle")
    f.text(650, 202, "13-14 · 21-22 · 33-34 · 43-44", "xf-k", "middle")
    f.text(650, 228, T("โอเวอร์โหลดรีเลย์: 95-96 NC · 97-98 NO", "Overload relay: 95-96 NC · 97-98 NO"), "xf-k", "middle")
    f.text(380, 268, T("NEMA ไม่ใช้เลขเหล่านี้: สตาร์ตเตอร์ NEMA ใช้ L1 L2 L3 → T1 T2 T3 ที่หน้าสัมผัสหลัก (ดูหน้า NEMA ด้านล่าง)", "NEMA starters do not use these numbers: L1 L2 L3 → T1 T2 T3 on the power poles (see the NEMA section)"), "xf-k", "middle")
    return f.svg()


# --- small single-pole drawings used by the symbol sheet
def s_cb(f, x, y, tag=None):
    f.line(x, y, x, y + 15); f.line(x, y + 37, x, y + 52)
    f.line(x, y + 37, x - 11, y + 14)
    f.line(x - 4, y + 11, x + 4, y + 19); f.line(x - 4, y + 19, x + 4, y + 11)
    f.line(x - 5, y + 26, x - 32, y + 26, "xf-dash"); f.rect(x - 56, y + 16, 24, 20, "xf-box", 2); f.text(x - 44, y + 30, "I>>", "xf-k", "middle")


def s_kmain(f, x, y):
    f.line(x, y, x, y + 15); f.line(x, y + 37, x, y + 52)
    f.line(x, y + 37, x - 11, y + 14)
    f.path(f"M {f1(x - 3)} {f1(y + 15)} A 3 3 0 0 0 {f1(x + 3)} {f1(y + 15)}", "xf-ln")
    f.line(x - 5, y + 26, x - 26, y + 26, "xf-dash")


def s_iso(f, x, y):
    f.line(x, y, x, y + 15); f.line(x, y + 37, x, y + 52)
    f.line(x, y + 37, x - 11, y + 14)
    f.line(x - 14, y + 18, x - 5, y + 14 + 6 - 3, "xf-ln") if False else f.line(x - 6, y + 14, x + 6, y + 14)
    f.line(x - 5, y + 26, x - 26, y + 26, "xf-dash")


def s_therm(f, x, y):
    f.line(x, y, x, y + 14); f.line(x, y + 38, x, y + 52)
    f.rect(x - 7, y + 14, 14, 24, "xf-box", 1)
    f.path(f"M {f1(x)} {f1(y + 14)} l 0 6 l -4 0 l 0 6 l 8 0 l 0 6 l -4 0 l 0 6", "xf-thin")
    f.line(x + 7, y + 26, x + 24, y + 26, "xf-dash")


def s_motor(f, x, y):
    f.line(x, y, x, y + 6)
    f.circ(x, y + 26, 20, "xf-motor")
    f.text(x, y + 25, "M", "xf-h", "middle"); f.text(x, y + 39, "3~", "xf-k", "middle")


def s_earth(f, x, y):
    p_earth(f, x, y + 14)
    f.line(x, y, x, y + 14)


def s_xfmr(f, x, y):
    f.line(x, y, x, y + 8)
    f.circ(x, y + 18, 11, "xf-box"); f.circ(x, y + 31, 11, "xf-box")
    f.line(x, y + 40, x, y + 52)


@fig("mc-trip-class")
def _():
    f = F(760, 346, T("กราฟเวลาตัดของโอเวอร์โหลดรีเลย์คลาส 10A 10 20 30 ตาม IEC 60947-4-1 (สเกลลอการิทึม) เทียบกับกระแสเป็นเท่าของค่าตั้ง",
                      "Overload relay tripping curves, classes 10A 10 20 30 (IEC 60947-4-1, log scale) versus multiple of the setting"), "mc-trip-class")
    x0, y0, w, h = 80, 20, 560, 260
    lx = lambda m: x0 + (math.log10(m) - 0) / (math.log10(10) - 0) * w
    ly = lambda t: y0 + h - (math.log10(t) - math.log10(1)) / (math.log10(1000) - math.log10(1)) * h
    for m in [1, 1.5, 2, 3, 4, 5, 6, 7.2, 8, 10]:
        f.line(lx(m), y0, lx(m), y0 + h, "xf-grid"); f.text(lx(m), y0 + h + 15, f"{m:g}", "xf-k", "middle")
    for t in [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]:
        f.line(x0, ly(t), x0 + w, ly(t), "xf-grid"); f.text(x0 - 6, ly(t) + 4, f"{t:g}", "xf-k", "end")
    f.text(x0 + w / 2, y0 + h + 34, T("กระแสเป็นเท่าของค่าตั้ง I/Ir", "Current as a multiple of the setting I/Ir"), "xf-m", "middle")
    f.text(x0 - 46, y0 + h / 2, T("เวลาตัด (s)", "Trip time (s)"), "xf-m", "middle", -90)
    # simple thermal model t = tau * ln( m^2 / (m^2 - 1.2^2) ) calibrated so that t(7.2) = class limit (upper value)
    cls = [("10A", 10, "xf-d"), ("10", 10 * 1.0, "xf-a"), ("20", 20, "xf-b"), ("30", 30, "xf-c")]
    for name, tl, c in cls:
        tl_eff = tl * (0.7 if name == "10A" else 0.9)
        tau = tl_eff / math.log(7.2 ** 2 / (7.2 ** 2 - 1.2 ** 2))
        pts = []
        m = 1.25
        while m <= 10:
            t = tau * math.log(m * m / (m * m - 1.44))
            if 1 <= t <= 1000:
                pts.append((lx(m), ly(t)))
            m *= 1.03
        f.poly(pts, c)
        tt = tau * math.log(10 * 10 / (100 - 1.44))
        f.text(lx(10) + 4, ly(tt) + 4, T(f"คลาส {name}", f"Class {name}"), "xf-k")
    f.line(lx(7.2), y0, lx(7.2), y0 + h, "xf-dash")
    f.text(lx(7.2) + 4, y0 + 12, T("7.2 × Ir: คลาส = เวลาตัดสูงสุด (s)", "7.2 × Ir: class = max trip time (s)"), "xf-k")
    f.text(lx(1.05), ly(700), T("1.05 Ir: ไม่ตัดใน 2 ชม.", "1.05 Ir: no trip within 2 h"), "xf-k")
    f.text(lx(1.2) + 8, ly(300), T("1.2 Ir: ตัดภายใน 2 ชม.", "1.2 Ir: trips within 2 h"), "xf-k")
    f.text(380, 338, T("โหลดสตาร์ทหนัก (พัดลมใหญ่ เครื่องบด) ใช้คลาส 20/30 · ปั๊มและสายพานทั่วไปใช้คลาส 10",
                       "Heavy starts (large fans, crushers) need class 20/30 · ordinary pumps and conveyors use class 10"), "xf-m", "middle")
    return f.svg()


@fig("mc-symbols")
def _():
    f = F(780, 460, T("สัญลักษณ์ IEC 60617 ที่ใช้บ่อยในวงจรควบคุมและวงจรกำลังของมอเตอร์ พร้อมรหัสอุปกรณ์ IEC 81346",
                      "Common IEC 60617 symbols in motor control and power circuits with IEC 81346 device codes"), "mc-symbols")
    items = [
        (lambda x, y: el_no(f, x, y), T("หน้าสัมผัส NO", "NO contact"), "-K1 13-14"),
        (lambda x, y: el_nc(f, x, y), T("หน้าสัมผัส NC", "NC contact"), "-K1 21-22"),
        (lambda x, y: el_no(f, x, y, "push"), T("ปุ่มกด NO (START)", "Push-button NO"), "-S1"),
        (lambda x, y: el_nc(f, x, y, "push"), T("ปุ่มกด NC (STOP)", "Push-button NC"), "-S0"),
        (lambda x, y: el_nc(f, x, y, "estop"), T("หยุดฉุกเฉิน", "Emergency stop"), "-S0"),
        (lambda x, y: el_coil(f, x, y), T("คอยล์คอนแทกเตอร์", "Contactor coil"), "-K1 A1-A2"),
        (lambda x, y: el_coil(f, x, y, kind="ton"), T("คอยล์ไทเมอร์หน่วงเปิด", "On-delay timer coil"), "-K4T"),
        (lambda x, y: el_no(f, x, y, "ton"), T("NO หน่วงเวลาเปิด", "On-delay NO"), "-K4T 17-18"),
        (lambda x, y: el_nc(f, x, y, "ton"), T("NC หน่วงเวลาเปิด", "On-delay NC"), "-K4T 15-16"),
        (lambda x, y: el_nc(f, x, y, "th"), T("โอเวอร์โหลด NC", "Overload NC"), "-F2 95-96"),
        (lambda x, y: el_lamp(f, x, y, color="GN"), T("หลอดไฟแสดงสถานะ", "Pilot light"), "-P1"),
        (lambda x, y: el_no(f, x, y, "float"), T("สวิตช์ลูกลอย", "Float switch"), "-B1"),
        (lambda x, y: el_nc(f, x, y, "limit"), T("ลิมิตสวิตช์ NC", "Limit switch NC"), "-B2"),
        (lambda x, y: el_no(f, x, y, "press"), T("สวิตช์ความดัน", "Pressure switch"), "-B3"),
        (lambda x, y: el_fuse(f, x, y), T("ฟิวส์", "Fuse"), "-F3"),
        (lambda x, y: s_cb(f, x, y), T("เบรกเกอร์ (I>>)", "Circuit-breaker"), "-Q1"),
        (lambda x, y: s_iso(f, x, y), T("สวิตช์ตัดต่อ", "Switch-disconnector"), "-Q0"),
        (lambda x, y: s_kmain(f, x, y), T("ขั้วกำลังคอนแทกเตอร์", "Contactor pole"), "-K1 1-2"),
        (lambda x, y: s_therm(f, x, y), T("โอเวอร์โหลดรีเลย์", "Overload relay"), "-F2 1-2"),
        (lambda x, y: s_motor(f, x, y), T("มอเตอร์ 3 เฟส", "3-phase motor"), "-M1 U1 V1 W1"),
        (lambda x, y: s_earth(f, x, y), T("ดินป้องกัน PE", "Protective earth"), "PE"),
    ]
    for i, (fn, lab, tag) in enumerate(items):
        col, row = i % 7, i // 7
        x, y = 80 + col * 104, 26 + row * 130
        fn(x, y)
        f.text(x, y + 76, lab, "xf-k", "middle")
        f.text(x, y + 92, tag, "xf-tagk", "middle")
    f.text(390, 408, T("-K คอนแทกเตอร์/รีเลย์ · -S สวิตช์ที่คนกด · -B เซนเซอร์ · -F อุปกรณ์ป้องกัน", "-K contactor/relay · -S manual switch · -B sensor · -F protection"), "xf-m", "middle")
    f.text(390, 426, T("-Q สวิตช์ตัดต่อกำลัง · -P ไฟแสดง · -M มอเตอร์ · -X เทอร์มินัล · เส้นประ = ตัวต่อกลไก", "-Q power switching · -P indicator · -M motor · -X terminal · dashed = mechanical link"), "xf-m", "middle")
    f.text(390, 444, T("ทุกสัญลักษณ์วาดในสภาพไม่มีไฟ ไม่ถูกกด (de-energised, unactuated)", "Every symbol is drawn de-energised and unactuated"), "xf-k", "middle")
    return f.svg()


# =========================================================================== STARTERS — power circuits
def _supply(f, xs, y, txt=None):
    for i, x in enumerate(xs):
        f.text(x, y - 6, ["L1", "L2", "L3"][i], "xf-k", "middle")
    if txt:
        f.text(xs[-1] + 26, y + 4, txt, "xf-k")


@fig("mc-dol-power")
def _():
    f = F(540, 520, T("วงจรกำลังสตาร์ทตรง DOL ตาม IEC 60617: เบรกเกอร์ -Q1 (ป้องกันลัดวงจร) คอนแทกเตอร์ -K1 โอเวอร์โหลดรีเลย์ -F2 และมอเตอร์ -M1 พร้อมสาย PE ต่อเข้าโครงมอเตอร์",
                      "DOL power circuit to IEC 60617: breaker -Q1 (short-circuit protection), contactor -K1, overload relay -F2 and motor -M1 with the PE conductor bonded to the frame"), "mc-dol-power")
    xs = [190, 230, 270]
    pe = 40
    _supply(f, xs, 30)
    p_pe(f, pe, 30, 388)
    T6 = (["1", "3", "5"], ["2", "4", "6"])
    p_wires(f, xs, 30, 60)
    p_contacts(f, xs, 60, "-Q1", "q", terms=T6, rel="mag")
    p_wires(f, xs, 110, 150)
    p_contacts(f, xs, 150, "-K1", "km", terms=T6)
    p_wires(f, xs, 200, 240)
    p_overload(f, xs, 240, "-F2", terms=T6, link=T("95-96", "95-96"))
    p_wires(f, xs, 284, 330)
    p_motor(f, 230, 330, 40, xs=xs, pe_x=pe)
    X = 350
    f.text(X, 76, T("เบรกเกอร์: ตัดลัดวงจร (I>>)", "Breaker: short circuit (I>>)"), "xf-k"); f.text(X, 92, T("และใช้เป็นสวิตช์ตัดต่อ", "and isolating switch"), "xf-k")
    f.text(X, 166, T("คอนแทกเตอร์ AC-3: ตัด-ต่อมอเตอร์", "AC-3 contactor: makes/breaks"), "xf-k"); f.text(X, 182, T("คอยล์ A1-A2 อยู่ในวงจรควบคุม", "the motor · coil A1-A2 is in control"), "xf-k")
    f.text(X, 244, T("โอเวอร์โหลดรีเลย์ ตั้ง Ir = In", "Overload relay, Ir = motor In"), "xf-k"); f.text(X, 260, T("หน้าสัมผัส 95-96 ต่ออนุกรมคอยล์", "contact 95-96 is in series with the coil"), "xf-k")
    f.text(310, 314, T("-W1 สายมอเตอร์ 3Φ + PE", "-W1 motor cable 3Φ + PE"), "xf-k")
    f.text(X - 24, 404, T("PE ต่อเข้าโครงมอเตอร์ (เขียว-เหลือง)", "PE to the motor frame (green-yellow)"), "xf-k") if False else None
    f.text(270, 480, T("ถ้า -Q1 เป็น MPCB ที่มีเทอร์มัลในตัว (I> + I>>) ตัด -F2 ออกได้", "If -Q1 is an MPCB with a thermal release (I> + I>>), -F2 can be omitted"), "xf-m", "middle")
    f.text(270, 500, T("เส้นประ = ตัวต่อกลไกระหว่างขั้ว · ● = จุดต่อ · เส้นตัดไม่มีจุด = ไม่ต่อกัน", "Dashed = mechanical coupling · ● = junction · crossing without a dot = no connection"), "xf-k", "middle")
    return f.svg()


@fig("mc-dol-control")
def _():
    f = F(620, 470, T("วงจรควบคุม DOL ตาม IEC 60204-1: ฟิวส์ -F3 · หน้าสัมผัสโอเวอร์โหลด -F2 95-96 · STOP -S0 (NC) · START -S1 (NO) ขนานกับ -K1 13-14 (ล็อกตัวเอง) · คอยล์ -K1 ต่อด้านนิวทรัล · ไฟเดิน (เขียว) และไฟทริป (แดง)",
                      "DOL control circuit to IEC 60204-1: fuse -F3 · overload contact -F2 95-96 · STOP -S0 (NC) · START -S1 (NO) paralleled by -K1 13-14 (hold-in) · coil -K1 on the neutral side · run lamp (green) and trip lamp (red)"), "mc-dol-control")
    root = S(E(el_fuse, tag="-F3", note="2 A"),
             P(S(E(el_nc, act="th", tag="-F2", t1="95", t2="96"),
                 E(el_nc, act="push", tag="-S0", t1="11", t2="12"),
                 P(E(el_no, act="push", tag="-S1", t1="13", t2="14"), E(el_no, tag="-K1", t1="13", t2="14")),
                 E(el_coil, tag="-K1")),
               S(E(el_wire), E(el_no, tag="-K1", t1="43", t2="44"), E(el_lamp, tag="-P1", color="GN", note=T("เดิน", "RUN"))),
               S(E(el_no, act="th", tag="-F2", t1="97", t2="98"), E(el_lamp, tag="-P2", color="YE", note=T("ทริป", "TRIP")))))
    f.mains = {"-K1": "PWR"}
    control(f, root, 120, 50, top="L1", bot="N", below=58,
            labels={1: T("STOP·START·K1", "STOP·START·K1"), 2: T("ล็อกตัวเอง", "hold-in"), 3: T("ไฟ เดิน", "RUN lamp"), 4: T("ไฟ ทริป", "TRIP lamp")})
    f.text(310, f.h - 26, T("กด -S1 → K1 ดูด → 13-14 ปิดค้างแทนปุ่ม (ล็อกตัวเอง) · กด -S0 หรือ -F2 ทริป → K1 ปล่อย", "Press -S1 → K1 picks up → 13-14 holds it in · press -S0 or -F2 trips → K1 drops"), "xf-m", "middle")
    f.text(310, f.h - 8, T("คอยล์อยู่ติดสาย N: ถ้าสาย L เสียดิน จะไม่ทำให้คอยล์ดูดเอง (IEC 60204-1 §9.4.3)", "Coil on the N side: an earth fault on L cannot energise it (IEC 60204-1 §9.4.3)"), "xf-m", "middle")
    return f.svg()


@fig("mc-twoloc-control")
def _():
    f = F(700, 440, T("ควบคุมมอเตอร์สองจุดและจ็อก: ปุ่ม STOP ทุกจุดต่ออนุกรม ปุ่ม START ทุกจุดต่อขนาน และปุ่มจ็อกที่ตัดวงจรล็อกตัวเอง",
                      "Two-location control with jog: all STOP buttons in series, all START buttons in parallel, and a jog button that breaks the hold-in path"), "mc-twoloc-control")
    root = S(E(el_nc, act="th", tag="-F2", t1="95", t2="96"), E(el_nc, act="push", tag="-S0", t1="11", t2="12"), E(el_nc, act="push", tag="-S2", t1="11", t2="12"),
             P(E(el_no, act="push", tag="-S1", t1="13", t2="14"), E(el_no, act="push", tag="-S3", t1="13", t2="14"),
               S(E(el_nc, act="push", tag="-S4", t1="21", t2="22"), E(el_no, tag="-K1", t1="13", t2="14")),
               E(el_no, act="push", tag="-S4", t1="13", t2="14")),
             E(el_coil, tag="-K1"))
    f.mains = {"-K1": "PWR"}
    control(f, root, 120, 50, top="L1", bot="N", below=58)
    f.text(570, 70, T("-S0 STOP ในตู้", "-S0 STOP at panel"), "xf-k"); f.text(570, 88, T("-S2 STOP หน้างาน", "-S2 STOP at machine"), "xf-k")
    f.text(570, 106, T("-S1 START ในตู้", "-S1 START at panel"), "xf-k"); f.text(570, 124, T("-S3 START หน้างาน", "-S3 START at machine"), "xf-k")
    f.text(570, 142, T("-S4 JOG (ปุ่มคู่ NO+NC)", "-S4 JOG (NO+NC pair)"), "xf-k")
    f.text(350, f.h - 16, T("กด JOG: NC ของ S4 ตัดทางล็อกตัวเองก่อน แล้ว NO จึงจ่ายคอยล์ → ปล่อยปุ่ม มอเตอร์หยุดทันที",
                       "Press JOG: the S4 NC opens the hold-in path first, then its NO feeds the coil → release and the motor stops"), "xf-m", "middle")
    return f.svg()


@fig("mc-fr-power")
def _():
    f = F(560, 600, T("วงจรกำลังกลับทางหมุนตาม IEC: -K1 เดินหน้า ต่อ L1-L2-L3 ตรง · -K2 ถอยหลัง สลับ L1 กับ L3 มีอินเตอร์ล็อกทางกลระหว่างคอนแทกเตอร์ และ PE ต่อเข้าโครงมอเตอร์",
                      "IEC reversing power circuit: forward -K1 connects L1-L2-L3 straight, reverse -K2 swaps L1 and L3, mechanically interlocked, PE bonded to the motor frame"), "mc-fr-power")
    xs = [170, 210, 250]
    xr = [310, 350, 390]
    pe = 40
    _supply(f, xs, 30)
    p_pe(f, pe, 30, 438)
    T6 = (["1", "3", "5"], ["2", "4", "6"])
    p_wires(f, xs, 30, 60)
    p_contacts(f, xs, 60, "-Q1", "q", terms=T6, rel="mag")
    p_wires(f, xs, 110, 170)
    # three separate tap wires from L1 L2 L3 to K2, at different heights so they never touch each other (L3 highest, L1 lowest)
    for x, xx, yy in zip(xs, xr, [150, 136, 122]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, 170); f.dot(x, yy)
    p_contacts(f, xs, 170, "-K1", "km", terms=T6)
    p_contacts(f, xr, 170, None, "km", terms=T6)
    f.text(xr[-1] + 34, 200, "-K2", "xf-tag")
    # mechanical interlock between K1 and K2
    f.line(xs[-1] - 6, 195, xr[0] - 6, 195, "xf-mech")
    f.path(f"M {f1((xs[-1] + xr[0]) / 2 - 7)} 189 L {f1((xs[-1] + xr[0]) / 2 + 7)} 189 L {f1((xs[-1] + xr[0]) / 2)} 201 Z", "xf-ln")
    f.text((xs[-1] + xr[0]) / 2 - 6, 234, T("ล็อกทางกล", "mech. lock"), "xf-k", "middle")
    p_wires(f, xs, 220, 290)
    # K2 outputs cross over: L1 -> W1, L2 -> V1, L3 -> U1 (two phases swapped); L1 lowest horizontal first, so wires do not touch
    for xo, xt, yy in zip(xr, [xs[2], xs[1], xs[0]], [246, 260, 274]):
        f.line(xo, 220, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    p_overload(f, xs, 290, "-F2", terms=T6, link=T("95-96", "95-96"))
    p_wires(f, xs, 334, 380)
    p_motor(f, 210, 380, 40, xs=xs, pe_x=pe)
    f.text(330, 330, T("K2 สลับ L1↔L3 → ทิศหมุนกลับ", "K2 swaps L1↔L3 → reversed rotation"), "xf-k")
    f.text(280, 560, T("K1 และ K2 ดูดพร้อมกัน = ลัดวงจร L1–L3 → ต้องมีอินเตอร์ล็อกทั้งทางไฟฟ้าและทางกล", "K1 and K2 together = an L1–L3 short circuit → electrical AND mechanical interlocks are essential"), "xf-m", "middle")
    f.text(280, 580, T("เส้นแต่ละเส้นต่อเข้า K2 แยกกันคนละระดับ — ไม่ลัดวงจรกัน (ตัดกันไม่มีจุด = ไม่ต่อ)", "Each tap to K2 runs at its own height — they never touch (crossing without a dot = no connection)"), "xf-k", "middle")
    return f.svg()


@fig("mc-fr-control")
def _():
    f = F(660, 520, T("วงจรควบคุมกลับทางหมุน (IEC) พร้อมอินเตอร์ล็อกสามชั้น: หน้าสัมผัส NC ของคอนแทกเตอร์ตรงข้าม ปุ่มกดคู่ NO+NC และอินเตอร์ล็อกทางกลระหว่างคอยล์ -K1 กับ -K2",
                      "IEC reversing control with three interlock layers: NC auxiliary of the opposite contactor, NO+NC push-button pairs and a mechanical interlock between coils -K1 and -K2"), "mc-fr-control")
    root = S(E(el_fuse, tag="-F3"), E(el_nc, act="th", tag="-F2", t1="95", t2="96"), E(el_nc, act="push", tag="-S0", t1="11", t2="12"),
             P(S(P(E(el_no, act="push", tag="-S1", t1="13", t2="14"), E(el_no, tag="-K1", t1="13", t2="14")),
                 E(el_nc, act="push", tag="-S2", t1="21", t2="22"), E(el_nc, tag="-K2", t1="21", t2="22"), E(el_coil, tag="-K1")),
               GAP,
               S(P(E(el_no, act="push", tag="-S2", t1="13", t2="14"), E(el_no, tag="-K2", t1="13", t2="14")),
                 E(el_nc, act="push", tag="-S1", t1="21", t2="22"), E(el_nc, tag="-K1", t1="21", t2="22"), E(el_coil, tag="-K2", tagside="right"))))
    f.mains = {"-K1": "PWR", "-K2": "PWR"}
    control(f, root, 110, 50, top="L1", bot="N", below=58, labels={1: T("เดินหน้า", "forward"), 2: T("ล็อกตัวเอง", "hold-in"), 4: T("ถอยหลัง", "reverse"), 5: T("ล็อกตัวเอง", "hold-in")})
    coils = [r for r in f.reg if r[0] is el_coil]
    if len(coils) == 2:
        (_, _, x1, y1, _), (_, _, x2, y2, _) = coils
        ym = y1 + H / 2
        f.line(x1 + 15, ym, x2 - 15, ym, "xf-mech")
        mx = (x1 + x2) / 2
        f.path(f"M {f1(mx - 8)} {f1(ym - 7)} L {f1(mx + 8)} {f1(ym - 7)} L {f1(mx)} {f1(ym + 7)} Z", "xf-ln")
        f.text(mx, ym - 12, T("อินเตอร์ล็อกทางกล", "mechanical interlock"), "xf-k", "middle")
    f.text(330, f.h - 26, T("ชั้น 1: NC ของคอนแทกเตอร์ตรงข้าม · ชั้น 2: ปุ่มคู่ NO+NC", "Layer 1: NC of the other contactor · layer 2: NO+NC button pairs"), "xf-m", "middle")
    f.text(330, f.h - 8, T("ชั้น 3: อินเตอร์ล็อกทางกลที่ตัวคอนแทกเตอร์ (เส้นประระหว่างคอยล์ -K1 และ -K2)", "Layer 3: mechanical interlock on the contactors (dashed link between coils -K1 and -K2)"), "xf-m", "middle")
    return f.svg()


@fig("mc-yd-power")
def _():
    f = F(680, 640, T("วงจรกำลังสตาร์-เดลต้าตาม IEC: -K1 หลักจ่าย U1 V1 W1 ผ่าน -F2 · -K3 เดลต้าต่อ L1→W2, L2→U2, L3→V2 · -K2 สตาร์ลัดปลาย W2 U2 V2 เข้าด้วยกัน",
                      "IEC star–delta power circuit: main -K1 feeds U1 V1 W1 through -F2 · delta -K3 connects L1→W2, L2→U2, L3→V2 · star -K2 shorts W2 U2 V2 together"), "mc-yd-power")
    xs = [170, 210, 250]
    xd = [390, 430, 470]
    pe = 40
    _supply(f, xs, 30)
    T6 = (["1", "3", "5"], ["2", "4", "6"])
    p_wires(f, xs, 30, 56)
    p_contacts(f, xs, 56, "-Q1", "q", terms=T6, rel="mag")
    p_wires(f, xs, 106, 130)
    p_contacts(f, xs, 130, "-K1", "km", terms=T6)
    p_wires(f, xs, 180, 236)
    # delta contactor K3 is tapped between K1 and F2 — three separate wires at different heights (L3 highest)
    for x, xx, yy in zip(xs, xd, [220, 208, 196]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, 252); f.dot(x, yy)
    p_overload(f, xs, 236, "-F2", terms=T6, link=T("Ir = 0.58·In", "Ir = 0.58·In"))
    p_wires(f, xs, 280, 310)
    # motor with six terminals: U1 V1 W1 above, W2 U2 V2 below
    xc, ym, r = 210, 310, 58
    p_motor(f, xc, ym, 40, xs=xs, pe_x=pe, tag=None)
    f.text(xc - r - 36, ym + 24, "-M1", "xf-tag")
    yc = ym + r
    bot = []
    for x, l in zip(xs, ["W2", "U2", "V2"]):
        yy = yc + math.sqrt(max(r * r - (x - xc) ** 2, 0))
        f.circ(x, yy, 3.2, "xf-term"); f.text(x + (-6 if x < xc else 6), yy + 14 if x == xc else yy + 12, l, "xf-k", "end" if x < xc else None)
        bot.append(yy)
    p_contacts(f, xd, 252, None, "km", terms=T6)
    f.text(xd[-1] + 34, 282, "-K3 (Δ)", "xf-tag")
    # K3 outputs to W2 U2 V2 (three separate horizontal wires, upper one first so wires do not touch)
    for xo, xt, yy, b in zip(xd, xs, [452, 466, 480], bot):
        f.line(xo, 302, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    for x, b in zip(xs, bot):
        f.line(x, b, x, 510)
    p_contacts(f, xs, 510, None, "km", terms=T6)
    f.text(xs[-1] + 34, 540, "-K2 (Y)", "xf-tag")
    f.line(xs[0], 560, xs[-1], 560); f.dot(xs[1], 560); f.line(xs[1], 560, xs[1], 570)
    f.text(xs[1], 586, T("จุดสตาร์", "star point"), "xf-k", "middle")
    f.text(320, 616, T("สตาร์ท: K1+K2 (Y) · เดิน: K1+K3 (Δ) · K2 กับ K3 ห้ามดูดพร้อมกัน (ลัดวงจร)", "Start: K1+K2 (Y) · run: K1+K3 (Δ) · K2 and K3 must never close together (short circuit)"), "xf-m", "middle")
    f.text(320, 632, T("F2 อยู่ในทางกระแสเฟส → ตั้ง 0.58·In · คู่ขั้ว Δ: U1–W2 · V1–U2 · W1–V2 (= NEMA T1–T6 · T2–T4 · T3–T5)", "F2 carries the phase current → set 0.58·In · delta pairs: U1–W2 · V1–U2 · W1–V2 (= NEMA T1–T6 · T2–T4 · T3–T5)"), "xf-k", "middle")
    p_pe(f, pe, 30, ym + r)
    return f.svg()


@fig("mc-yd-control")
def _():
    f = F(720, 600, T("วงจรควบคุมสตาร์-เดลต้าแบบเปลี่ยนจังหวะเปิดวงจร (IEC): ไทเมอร์ -K4T หน่วงเปิด · K2 สตาร์ดูดก่อนแล้ว K1 ตาม · ครบเวลา K2 ปล่อยแล้ว K3 เดลต้าดูด · อินเตอร์ล็อก K2/K3",
                      "Open-transition star–delta control (IEC): on-delay timer -K4T · star K2 first, then K1 · after the delay K2 drops and delta K3 picks up · K2/K3 interlock"), "mc-yd-control")
    root = S(E(el_fuse, tag="-F3"), E(el_nc, act="th", tag="-F2", t1="95", t2="96"), E(el_nc, act="push", tag="-S0", t1="11", t2="12"),
             P(E(el_no, act="push", tag="-S1", t1="13", t2="14"), E(el_no, tag="-K1", t1="13", t2="14")),
             P(S(E(el_wire, h=52), E(el_wire, h=52), E(el_coil, tag="-K4T", kind="ton", note="t")),
               S(E(el_nc, act="ton", tag="-K4T", t1="15", t2="16"), E(el_nc, tag="-K3", t1="21", t2="22"), E(el_coil, tag="-K2", note="Y")),
               S(P(E(el_no, tag="-K2", t1="13", t2="14"), E(el_no, tag="-K1", t1="43", t2="44")), E(el_coil, tag="-K1", note=T("หลัก", "Main"))),
               S(E(el_no, act="ton", tag="-K4T", t1="17", t2="18"), E(el_nc, tag="-K2", t1="21", t2="22"), E(el_coil, tag="-K3", note="Δ"))))
    f.mains = {"-K1": "PWR", "-K2": "PWR", "-K3": "PWR"}
    control(f, root, 110, 50, top="L1", bot="N", below=58, labels={1: T("ไทเมอร์", "timer"), 2: T("สตาร์ Y", "star Y"), 3: T("หลัก K1", "main K1"), 5: T("เดลต้า Δ", "delta Δ")})
    f.text(360, f.h - 26, T("START → K4T และ K2 (Y) → K1 ดูดตาม (ผ่าน K2 13-14)", "START → K4T and K2 (Y) → K1 follows (via K2 13-14)"), "xf-m", "middle")
    f.text(360, f.h - 8, T("ครบเวลา t: K4T 15-16 เปิด → K2 ปล่อย → 17-18 ปิด → K3 (Δ) ดูด", "After t: K4T 15-16 opens → K2 drops → 17-18 closes → K3 (Δ) picks up"), "xf-m", "middle")
    return f.svg()


@fig("mc-yd-curves")
def _():
    f = F(760, 360, T("กระแสและแรงบิดเทียบความเร็วเมื่อต่อสตาร์และเดลต้า: สตาร์ได้ 1/3 ของเดลต้า เปลี่ยนเป็นเดลต้าที่ประมาณ 85–90 % ของความเร็ว",
                      "Current and torque versus speed in star and delta: star gives 1/3 of delta; change to delta at about 85–90 % of speed"), "mc-yd-curves")
    pl = Plot(f, 70, 30, 600, 260, (0, 1500), (0, 3.4), (0, 8))
    pl.frame(range(0, 1501, 250), [0, 0.5, 1, 1.5, 2, 2.5, 3], [0, 2, 4, 6, 8], T("ความเร็วรอบ n (rpm)", "Speed n (rpm)"), T("แรงบิด T/Tn", "Torque T/Tn"), T("กระแสสาย I/In", "Line current I/In"), yf=lambda t: f"{t:g}")
    ns = list(range(0, 1500, 5)) + [1499]
    D_T, D_I, Y_T, Y_I = [], [], [], []
    for n in ns:
        s = 1 - n / 1500
        i, t, _ = motor(s)
        D_T.append((n, t / TN)); D_I.append((n, i / IN))
        Y_T.append((n, t / TN / 3)); Y_I.append((n, i / IN / 3))
    pl.curve(D_I, "xf-dash", 2); pl.curve(D_T, "xf-dash")
    pl.curve(Y_I, "xf-a", 2); pl.curve(Y_T, "xf-b")
    load = [(n, 0.12 + 0.6 * (n / 1471) ** 2) for n in range(0, 1501, 25)]
    pl.curve(load, "xf-c")
    # operating trajectory: Y until 1320 rpm (≈ where Y torque = load), jump to Δ
    nc = 1330
    s = 1 - nc / 1500
    iY, tY, _ = motor(s); iD, tD, _ = motor(s)
    f.line(pl.X(nc), pl.Y(iY / IN / 3, 2), pl.X(nc), pl.Y(iD / IN, 2), "xf-e", "end")
    f.text(pl.X(nc) - 6, pl.Y(iD / IN, 2) - 6, T("กระชากตอนเปลี่ยน Δ", "Peak at the Δ change"), "xf-k", "end")
    i0, t0, _ = motor(1)
    f.text(pl.X(10), pl.Y(i0 / IN, 2) - 6, T(f"DOL/Δ {i0 / IN:.1f}·In", f"DOL/Δ {i0 / IN:.1f}·In"), "xf-k")
    f.text(pl.X(10), pl.Y(i0 / IN / 3, 2) - 6, T(f"Y {i0 / IN / 3:.1f}·In", f"Y {i0 / IN / 3:.1f}·In"), "xf-ta")
    f.text(pl.X(10), pl.Y(t0 / TN / 3) + 16, T(f"แรงบิด Y {t0 / TN / 3:.2f}·Tn", f"Y torque {t0 / TN / 3:.2f}·Tn"), "xf-tb")
    f.text(pl.X(700), pl.Y(0.12 + 0.6 * (700 / 1471) ** 2) + 18, T("โหลดปั๊ม (เบา)", "Pump load (light)"), "xf-tc", "middle")
    f.text(380, 352, T("เส้นประ = เดลต้า (เท่ากับ DOL) · เส้นทึบ = สตาร์ · ถ้าเปลี่ยนเร็วเกินไป กระแสกระชากเกือบเท่า DOL",
                       "Dashed = delta (same as DOL) · solid = star · changing over too early gives a peak almost as high as DOL"), "xf-m", "middle")
    return f.svg()


@fig("mc-yd-timing")
def _():
    f = F(760, 270, T("ไดอะแกรมเวลาของสตาร์-เดลต้า: K2 สตาร์ และ K1 หลัก ดูดเมื่อกด START ไทเมอร์ครบเวลา t แล้ว K2 ปล่อย มีช่วงตาย 50–100 ms ก่อน K3 เดลต้าดูด",
                      "Star–delta timing: star K2 and main K1 close at START; after t, K2 opens and after a 50–100 ms dead time delta K3 closes"), "mc-yd-timing")
    rows = [("START", [(0.5, 0.9)]), ("K4T", [(0.5, 8.6)]), ("K2 (Y)", [(0.5, 6.0)]), ("K1", [(0.55, 8.6)]), ("K3 (Δ)", [(6.25, 8.6)])]
    x0, w = 120, 600
    X = lambda t: x0 + t / 9 * w
    for i, (n, segs) in enumerate(rows):
        y = 40 + i * 38
        f.text(x0 - 12, y + 4, n, "xf-tag", "end")
        pts = [(X(0), y + 10)]
        for a, b in segs:
            pts += [(X(a), y + 10), (X(a), y - 8), (X(b), y - 8), (X(b), y + 10)]
        pts.append((X(9), y + 10))
        f.poly(pts, ["xf-d", "xf-e", "xf-a", "xf-c", "xf-b"][i])
    f.line(X(6.0), 26, X(6.0), 230, "xf-dash"); f.line(X(6.25), 26, X(6.25), 230, "xf-dash")
    f.text(X(6.12), 238, T("ช่วงตาย", "dead time"), "xf-k", "middle")
    f.line(X(0.5), 222, X(6.0), 222, "xf-thin", "both"); f.text(X(3.2), 216, T("t = 5–15 s (ตั้งให้ถึง ~85–90 % ความเร็ว)", "t = 5–15 s (set to reach ~85–90 % speed)"), "xf-k", "middle")
    f.text(X(8.6) + 4, 210, T("STOP", "STOP"), "xf-k")
    f.text(380, 262, T("ช่วงตายจำเป็นเพื่อให้อาร์กใน K2 ดับก่อน K3 ปิด มิฉะนั้นเกิดลัดวงจรผ่านอาร์ก · ใช้ไทเมอร์สตาร์-เดลต้าเฉพาะที่มีช่วงตายในตัว",
                       "The dead time lets the arc in K2 clear before K3 closes, otherwise the arc short-circuits the supply · use a dedicated Y–Δ timer with built-in dead time"), "xf-m", "middle")
    return f.svg()


@fig("mc-start-compare")
def _():
    f = F(760, 300, T("เปรียบเทียบกระแสสตาร์ทและแรงบิดสตาร์ทของแต่ละวิธี เทียบกับค่าพิกัดของมอเตอร์ตัวอย่าง",
                      "Starting current and starting torque of each method relative to the rated values of the sample motor"), "mc-start-compare")
    i0, t0, _ = motor(1)
    data = [("DOL", i0 / IN, t0 / TN), (T("สตาร์-เดลต้า", "Star–delta"), i0 / IN / 3, t0 / TN / 3), (T("ออโต้ทรานส์ 65 %", "Autotransf. 65 %"), i0 / IN * .65 ** 2, t0 / TN * .65 ** 2),
            (T("ซอฟต์สตาร์ท 3·In", "Soft starter 3·In"), 3.0, t0 / TN * (3 / (i0 / IN)) ** 2), ("VFD", 1.5, 1.5)]
    x0, y0, h = 110, 30, 210
    Y = lambda v: y0 + h - v / 8 * h
    for v in range(0, 9, 2):
        f.line(x0, Y(v), 720, Y(v), "xf-grid"); f.text(x0 - 6, Y(v) + 4, f"{v}×", "xf-k", "end")
    for k, (n, i, t) in enumerate(data):
        x = x0 + 30 + k * 120
        f.rect(x, Y(i), 34, Y(0) - Y(i), "xf-bara", 2); f.rect(x + 40, Y(t), 34, Y(0) - Y(t), "xf-barb", 2)
        f.text(x + 17, Y(i) - 4, f"{i:.1f}", "xf-k", "middle"); f.text(x + 57, Y(t) - 4, f"{t:.2f}", "xf-k", "middle")
        f.text(x + 37, Y(0) + 18, n, "xf-k", "middle")
    f.rect(470, 6, 14, 10, "xf-bara", 2); f.text(490, 15, T("กระแสสาย / In", "Line current / In"), "xf-k")
    f.rect(610, 6, 14, 10, "xf-barb", 2); f.text(630, 15, T("แรงบิด / Tn", "Torque / Tn"), "xf-k")
    f.text(380, 288, T("แรงบิดลดลงตามกำลังสองของแรงดัน (T ∝ V²) — ลดกระแสด้วยการลดแรงดันจึงเสียแรงบิดเสมอ ยกเว้น VFD",
                       "Torque falls with the square of voltage (T ∝ V²) — every reduced-voltage method trades torque for current, except the VFD"), "xf-m", "middle")
    return f.svg()


@fig("mc-soft-wave")
def _():
    f = F(760, 260, T("ซอฟต์สตาร์ทเตอร์ตัดคลื่นแรงดันด้วยไทริสเตอร์ต่อแบบกลับหลังขนาน: มุมจุดชนวน α ลดลงเรื่อย ๆ ตามช่วง ramp จนแรงดันเต็มแล้วบายพาส",
                      "A soft starter chops the voltage with anti-parallel thyristors: the firing angle α is reduced along the ramp until full voltage, then bypassed"), "mc-soft-wave")
    pl = Plot(f, 50, 30, 660, 170, (0, 120), (-1.15, 1.15))
    pl.frame([0, 20, 40, 60, 80, 100, 120], [-1, 0, 1], xl=T("เวลา (ms) — ย่อช่วง ramp จริง 5–20 s ให้เห็นรูปคลื่น", "Time (ms) — the real 5–20 s ramp compressed to show the waveform"), yf=lambda v: f"{v:g}")
    pts, sine = [], []
    for k in range(0, 1201):
        t = k / 10
        ph = (2 * math.pi * t / 20) % (2 * math.pi)
        alpha = math.radians(max(0, 150 - t * 1.6))
        a = ph % math.pi
        v = math.sin(ph) if a >= alpha else 0
        pts.append((t, v)); sine.append((t, math.sin(ph)))
    pl.curve(sine, "xf-dash"); pl.curve(pts, "xf-b")
    f.text(pl.X(8), pl.Y(1.05), "α ≈ 140°", "xf-k", "middle"); f.text(pl.X(50), pl.Y(1.05), "α ≈ 70°", "xf-k", "middle"); f.text(pl.X(105), pl.Y(1.05), T("α = 0 → บายพาส", "α = 0 → bypass"), "xf-k", "middle")
    f.text(380, 250, T("แรงดัน rms เพิ่มเป็น ramp · ไม่ได้ลดความถี่ จึงไม่ได้แรงบิดเพิ่ม ใช้กับโหลดเบาตอนสตาร์ท เช่น ปั๊ม พัดลม",
                       "RMS voltage ramps up · frequency stays 50 Hz, so there is no extra torque — suits light-starting loads such as pumps and fans"), "xf-m", "middle")
    return f.svg()


@fig("mc-pump-float")
def _():
    f = F(720, 460, T("วงจรปั๊มน้ำอัตโนมัติด้วยสวิตช์เลือก Hand-Off-Auto ลูกลอยในถังสูง และลูกลอยป้องกันปั๊มเดินแห้งในถังล่าง",
                      "Automatic pump control with a Hand-Off-Auto selector, a float switch in the upper tank and a dry-run float in the lower tank"), "mc-pump-float")
    root = S(E(el_fuse, tag="-F3"), E(el_nc, act="th", tag="-F2", t1="95", t2="96"),
             P(E(el_no, act="sel", tag="-S1 H", t1="13", t2="14"),
               S(E(el_no, act="sel", tag="-S1 A", t1="23", t2="24"), E(el_nc, act="float", tag="-B1", t1="1", t2="2"), E(el_no, act="float", tag="-B2", t1="3", t2="4"))),
             E(el_coil, tag="-K1"))
    f.mains = {"-K1": "PWR"}
    control(f, root, 140, 50, top="L1", bot="N", below=58)
    f.text(420, 60, T("-S1 สวิตช์เลือก 3 ตำแหน่ง:", "-S1 three-position selector:"), "xf-h")
    f.text(420, 82, T("H (Hand) = เดินด้วยมือ ข้ามลูกลอย", "H (Hand) = run by hand, floats bypassed"), "xf-k")
    f.text(420, 100, T("0 (Off) = หยุด", "0 (Off) = stop"), "xf-k")
    f.text(420, 118, T("A (Auto) = ลูกลอยสั่ง", "A (Auto) = floats decide"), "xf-k")
    f.text(420, 150, T("-B1 ถังบน: เปิดเมื่อน้ำเต็ม → ปั๊มหยุด", "-B1 upper tank: opens when full → pump stops"), "xf-k")
    f.text(420, 168, T("-B2 ถังล่าง: ปิดเมื่อมีน้ำ → กันเดินแห้ง", "-B2 lower tank: closed while water present → dry-run guard"), "xf-k")
    f.text(420, 200, T("ลูกลอยแบบสองระดับ (ไขว้สาย) ทำให้มี", "Two-level (tethered) floats give a"), "xf-k")
    f.text(420, 218, T("ช่วงต่าง (hysteresis) ปั๊มไม่ติด-ดับถี่", "built-in hysteresis so the pump does not cycle"), "xf-k")
    f.text(360, f.h - 16, T("ในโหมด Hand ยังต้องผ่านโอเวอร์โหลด -F2 เสมอ — ห้ามต่อข้ามอุปกรณ์ป้องกัน",
                       "Even in Hand the circuit still passes the -F2 overload — never bypass protection"), "xf-m", "middle")
    return f.svg()


@fig("mc-sequence")
def _():
    f = F(720, 440, T("วงจรสตาร์ทเรียงลำดับ: มอเตอร์ M2 สตาร์ทได้เมื่อ M1 เดินแล้วเท่านั้น และ M2 สตาร์ทเองหลัง M1 ด้วยไทเมอร์ (สายพานลำเลียงต่อกัน)",
                      "Sequence starting: M2 can only run when M1 is running, and starts automatically after M1 via a timer (cascaded conveyors)"), "mc-sequence")
    root = S(E(el_nc, act="th", tag="-F2", t1="95", t2="96"), E(el_nc, act="th", tag="-F4", t1="95", t2="96"), E(el_nc, act="push", tag="-S0", t1="11", t2="12"),
             P(S(P(E(el_no, act="push", tag="-S1", t1="13", t2="14"), E(el_no, tag="-K1", t1="13", t2="14")), E(el_coil, tag="-K1", note="M1")),
               GAP,
               S(E(el_no, tag="-K1", t1="23", t2="24"), E(el_wire), E(el_coil, tag="-K3T", kind="ton", note="t")),
               S(E(el_no, tag="-K1", t1="33", t2="34"), E(el_no, act="ton", tag="-K3T", t1="17", t2="18"), E(el_coil, tag="-K2", note="M2"))))
    f.mains = {"-K1": "PWR", "-K2": "PWR"}
    control(f, root, 110, 50, top="L1", bot="N", below=58)
    f.text(360, f.h - 14, T("ลำเลียงวัสดุ: สตาร์ทสายพานปลายทาง (M1) ก่อน หยุดต้นทางก่อน เพื่อไม่ให้วัสดุกองบนสายพาน",
                       "Material handling: start the downstream belt (M1) first and stop the upstream belt first so material never piles up"), "xf-m", "middle")
    return f.svg()


# =========================================================================== VFD
@fig("mc-vfd-block")
def _():
    f = F(780, 300, T("โครงสร้างอินเวอร์เตอร์: วงจรเรียงกระแสไดโอด 6 ตัว บัส DC พร้อมคาปาซิเตอร์ และอินเวอร์เตอร์ IGBT 6 ตัวสร้าง PWM แรงดันและความถี่ปรับได้",
                      "VFD structure: six-diode rectifier, DC bus with capacitors, and a six-IGBT inverter producing variable-voltage variable-frequency PWM"), "mc-vfd-block")
    f.rect(30, 70, 130, 140, "xf-box", 8); f.text(95, 60, T("ไฟเข้า 3~ 400 V 50 Hz", "Input 3~ 400 V 50 Hz"), "xf-k", "middle")
    for i, l in enumerate(["L1", "L2", "L3"]):
        f.line(50, 110 + i * 30, 160, 110 + i * 30, "xf-rail"); f.text(60, 104 + i * 30, l, "xf-k")
    f.rect(200, 70, 150, 140, "xf-boxa", 8); f.text(275, 92, T("วงจรเรียงกระแส", "Rectifier"), "xf-h", "middle")
    for i in range(3):
        x = 230 + i * 45
        f.path(f"M {x} 150 l -8 -14 l 16 0 z", "xf-ln"); f.line(x - 8, 136, x + 8, 136)
        f.path(f"M {x} 190 l -8 -14 l 16 0 z", "xf-ln"); f.line(x - 8, 176, x + 8, 176)
    f.rect(390, 70, 110, 140, "xf-boxc", 8); f.text(445, 92, T("บัส DC", "DC bus"), "xf-h", "middle")
    f.line(430, 130, 460, 130); f.line(430, 140, 460, 140); f.line(445, 112, 445, 130); f.line(445, 140, 445, 170)
    f.text(445, 192, "≈ 540–565 V", "xf-k", "middle")
    f.rect(540, 70, 150, 140, "xf-boxb", 8); f.text(615, 92, T("อินเวอร์เตอร์ IGBT", "IGBT inverter"), "xf-h", "middle")
    for i in range(3):
        x = 570 + i * 45
        f.rect(x - 8, 120, 16, 24, "xf-box", 2); f.rect(x - 8, 160, 16, 24, "xf-box", 2)
    f.circ(735, 140, 30, "xf-motor"); f.text(735, 138, "M", "xf-h", "middle"); f.text(735, 154, "3~", "xf-k", "middle")
    for x1, x2 in [(160, 200), (350, 390), (500, 540), (690, 705)]:
        f.line(x1, 140, x2, 140, "xf-ln", "end")
    # waveforms
    y = 250
    f.poly([(40 + k, y - 18 * math.sin(k / 12)) for k in range(0, 110)], "xf-a")
    f.poly([(395 + k, y - 14 - (2 * math.sin(k / 3) if k % 30 < 28 else 0)) for k in range(0, 100)], "xf-c")
    pw = []
    for k in range(0, 150):
        s = math.sin(k / 24)
        tri = (abs((k % 8) - 4) / 2 - 1)
        pw.append((550 + k, y - (18 if s > tri else -18)))
    f.poly(pw, "xf-b")
    f.poly([(550 + k, y - 18 * math.sin(k / 24)) for k in range(0, 150)], "xf-dash")
    f.text(95, 290, T("ไซน์ 50 Hz คงที่", "Fixed 50 Hz sine"), "xf-k", "middle"); f.text(445, 290, T("DC เรียบ", "Smooth DC"), "xf-k", "middle"); f.text(625, 290, T("PWM → กระแสเกือบไซน์ 0–50 Hz", "PWM → near-sine current 0–50 Hz"), "xf-k", "middle")
    return f.svg()


@fig("mc-vf-curve")
def _():
    f = F(760, 300, T("กราฟ V/f: แรงดันเพิ่มตามความถี่จนถึงความถี่ฐาน 50 Hz (แรงบิดคงที่) เหนือ 50 Hz แรงดันคงที่ ฟลักซ์ลดลง (กำลังคงที่)",
                      "V/f curve: voltage rises with frequency up to the 50 Hz base (constant torque); above 50 Hz voltage is fixed and flux falls (constant power)"), "mc-vf-curve")
    pl = Plot(f, 70, 30, 600, 210, (0, 80), (0, 480), (0, 1.3))
    pl.frame([0, 10, 20, 30, 40, 50, 60, 70, 80], [0, 100, 200, 300, 400], [0, 0.5, 1.0], T("ความถี่ f (Hz)", "Frequency f (Hz)"), T("แรงดัน (V)", "Voltage (V)"), T("แรงบิดได้สูงสุด T/Tn", "Available torque T/Tn"), y2f=lambda v: f"{v:g}")
    pl.curve([(0, 20), (50, 400), (80, 400)], "xf-a")
    pl.curve([(0, 0), (50, 400)], "xf-dash")
    pl.curve([(2, 1.0), (50, 1.0)] + [(f_, 50 / f_) for f_ in range(50, 81, 2)], "xf-b", 2)
    f.text(pl.X(3), pl.Y(30) - 6, T("บูสต์แรงดันชดเชย R₁ ที่ความถี่ต่ำ", "Voltage boost for R₁ at low frequency"), "xf-k")
    f.text(pl.X(25), pl.Y(1.0, 2) - 8, T("แรงบิดคงที่ (V/f = 8 V/Hz)", "Constant torque (V/f = 8 V/Hz)"), "xf-tb", "middle")
    f.text(pl.X(66), pl.Y(0.85, 2) - 8, T("ฟลักซ์ลด T ∝ 1/f", "Field weakening T ∝ 1/f"), "xf-tb", "middle")
    f.line(pl.X(50), pl.y, pl.X(50), pl.y + pl.h, "xf-dash"); f.text(pl.X(50) + 4, pl.y + 12, T("ความถี่ฐาน 50 Hz", "Base 50 Hz"), "xf-k")
    f.text(380, 292, T("ต่ำกว่า 20–25 Hz มอเตอร์ที่ใช้พัดลมบนเพลาระบายความร้อนไม่พอ ถ้าแรงบิดเต็ม ต้องลดพิกัดหรือเพิ่มพัดลมแยก",
                       "Below 20–25 Hz a shaft-mounted fan cools poorly — at full torque derate the motor or add a separate fan"), "xf-m", "middle")
    return f.svg()


@fig("mc-vfd-wiring")
def _():
    f = F(780, 380, T("การต่อสายอินเวอร์เตอร์ทั่วไป: ไฟเข้า R S T ผ่านเบรกเกอร์ ไฟออก U V W ด้วยสายชีลด์ไปมอเตอร์ อินพุตดิจิทัล สั่ง RUN และความเร็ว อนาล็อก 0–10 V หรือ 4–20 mA รีเลย์แจ้งเตือน และตัวต้านทานเบรก",
                      "Typical VFD wiring: R S T input via a breaker, U V W output with shielded cable to the motor, digital RUN and speed inputs, 0–10 V or 4–20 mA analog, fault relay and braking resistor"), "mc-vfd-wiring")
    f.rect(260, 40, 260, 300, "xf-boxb", 10); f.text(390, 62, T("อินเวอร์เตอร์ (VFD)", "Drive (VFD)"), "xf-h", "middle")
    xs = [300, 330, 360]
    for x, n in zip(xs, ["R/L1", "S/L2", "T/L3"]):
        f.line(x, 10, x, 40, "xf-rail"); f.text(x, 82, n, "xf-k", "middle")
    p_contacts(f, xs, -24 + 36, "-Q1", "q") if False else None
    f.text(250, 24, T("จาก MCCB/ฟิวส์ ตามคู่มือ", "From MCCB/fuses per manual"), "xf-k", "end")
    xo = [420, 450, 480]
    for x, n in zip(xo, ["U/T1", "V/T2", "W/T3"]):
        f.line(x, 40, x, 10, "xf-shield"); f.text(x, 82, n, "xf-k", "middle")
    f.text(530, 24, T("สายชีลด์ → มอเตอร์ (ชีลด์ลงดิน 360° ทั้งสองปลาย)", "Shielded cable → motor (shield bonded 360° at both ends)"), "xf-k")
    f.line(500, 40, 500, 18, "xf-pe"); f.text(506, 14, "PE", "xf-k")
    ins = [("DI1", T("RUN เดินหน้า", "RUN forward")), ("DI2", T("RUN ถอยหลัง", "RUN reverse")), ("DI3", T("ความเร็ว 1", "Preset speed 1")), ("DI4", T("ความเร็ว 2", "Preset speed 2")), ("DI5", T("รีเซ็ต", "Reset")), ("COM/24V", "")]
    for i, (t, d) in enumerate(ins):
        y = 110 + i * 26
        f.line(200, y, 260, y); f.text(270, y + 4, t, "xf-k")
        f.text(194, y + 4, d, "xf-k", "end")
    an = [("+10V", T("โพเทนชิโอมิเตอร์ 1–10 kΩ", "1–10 kΩ potentiometer")), ("AI1", T("0–10 V ความเร็ว", "0–10 V speed")), ("AI2", T("4–20 mA จาก PLC/ทรานสมิตเตอร์", "4–20 mA from PLC/transmitter")), ("GND", "")]
    for i, (t, d) in enumerate(an):
        y = 270 + i * 18
        f.line(200, y, 260, y); f.text(270, y + 4, t, "xf-k"); f.text(194, y + 4, d, "xf-k", "end")
    outs = [("RA RB RC", T("รีเลย์ Fault/Run", "Fault/Run relay")), ("AO1", T("0–10 V = ความถี่/กระแส", "0–10 V = freq./current")), ("RS485 A B", "Modbus RTU"), ("PB  +", T("ตัวต้านทานเบรก", "Braking resistor"))]
    for i, (t, d) in enumerate(outs):
        y = 130 + i * 40
        f.line(520, y, 580, y); f.text(510, y + 4, t, "xf-k", "end"); f.text(588, y + 4, d, "xf-k")
    f.text(390, 370, T("ด้านออก U V W ห้ามมีคาปาซิเตอร์ ห้ามคอนแทกเตอร์ตัดขณะเดิน และห้ามป้อนไฟเข้ากลับ", "Never fit capacitors on U V W, never open a contactor there while running, never feed mains into the output"), "xf-tb", "middle")
    return f.svg()


@fig("mc-affinity")
def _():
    f = F(760, 320, T("กฎแอฟฟินิตีของปั๊มและพัดลม: อัตราไหลแปรตามความเร็ว ความดันตามกำลังสอง กำลังตามกำลังสาม เปรียบเทียบกำลังที่ใช้เมื่อหรี่วาล์วกับปรับรอบด้วย VFD",
                      "Pump and fan affinity laws: flow ∝ speed, head ∝ speed², power ∝ speed³; power drawn with throttling versus VFD speed control"), "mc-affinity")
    pl = Plot(f, 60, 30, 290, 220, (0, 100), (0, 100))
    pl.frame([0, 25, 50, 75, 100], [0, 25, 50, 75, 100], xl=T("ความเร็ว (%)", "Speed (%)"), yl="%")
    pl.curve([(n, n) for n in range(0, 101, 5)], "xf-a"); pl.curve([(n, n * n / 100) for n in range(0, 101, 5)], "xf-c"); pl.curve([(n, n ** 3 / 1e4) for n in range(0, 101, 5)], "xf-b")
    f.text(pl.X(62), pl.Y(68), "Q ∝ n", "xf-ta"); f.text(pl.X(78), pl.Y(48), "H ∝ n²", "xf-tc"); f.text(pl.X(90), pl.Y(30), "P ∝ n³", "xf-tb")
    p2 = Plot(f, 440, 30, 290, 220, (40, 100), (0, 110))
    p2.frame([40, 55, 70, 85, 100], [0, 25, 50, 75, 100], xl=T("อัตราไหล (%)", "Flow (%)"), yl=T("กำลังไฟฟ้า (%)", "Input power (%)"))
    p2.curve([(q, 100 * (0.55 + 0.45 * q / 100)) for q in range(40, 101, 2)], "xf-dash")
    p2.curve([(q, 100 * (0.08 + 0.92 * (q / 100) ** 3) / 0.97) for q in range(40, 101, 2)], "xf-b")
    f.text(p2.X(46), p2.Y(84), T("หรี่วาล์ว/แดมเปอร์", "Throttling valve/damper"), "xf-k")
    f.text(p2.X(62), p2.Y(18), T("VFD ลดรอบ", "VFD speed control"), "xf-tb")
    q = 80
    a = 100 * (0.55 + 0.45 * q / 100); b = 100 * (0.08 + 0.92 * (q / 100) ** 3) / 0.97
    f.line(p2.X(q), p2.Y(a), p2.X(q), p2.Y(b), "xf-e", "both"); f.text(p2.X(q) + 6, p2.Y((a + b) / 2), T(f"ประหยัด ≈ {a - b:.0f} %", f"saves ≈ {a - b:.0f} %"), "xf-k")
    f.text(380, 310, T("ระบบที่มีหัวสถิต (ยกน้ำขึ้นที่สูง) ประหยัดน้อยกว่ากฎ n³ — ต้องคำนวณจากจุดทำงานบนกราฟระบบ",
                       "Systems with static head (lifting water) save less than the n³ law — work from the operating point on the system curve"), "xf-m", "middle")
    return f.svg()


# =========================================================================== PRACTICE
@fig("mc-design-flow")
def _():
    f = F(780, 250, T("ขั้นตอนออกแบบวงจรมอเตอร์ 10 ขั้น จากข้อมูลโหลดถึงการทดสอบเดินเครื่อง",
                      "Ten-step motor circuit design from load data to commissioning"), "mc-design-flow")
    steps = [T("โหลด · kW · รอบ", "Load · kW · speed"), T("เลือกมอเตอร์ IE3", "Pick IE3 motor"), T("วิธีสตาร์ท", "Starting method"), T("คอนแทกเตอร์ AC-3", "AC-3 contactor"), T("โอเวอร์โหลด · คลาส", "Overload · class"),
             T("MPCB/MCCB · Icu", "MPCB/MCCB · Icu"), T("ขนาดสาย · แรงดันตก", "Cable · volt drop"), T("วงจรควบคุม · อินเตอร์ล็อก", "Control · interlocks"), T("ตู้ · IP · ความร้อน", "Panel · IP · heat"), T("ทดสอบ · เดินเครื่อง", "Test · commission")]
    for i, s in enumerate(steps):
        col, row = i % 5, i // 5
        x, y = 20 + col * 152, 40 + row * 100
        f.rect(x, y, 132, 56, "xf-boxa" if row == 0 else "xf-boxc", 8)
        f.text(x + 66, y + 22, str(i + 1), "xf-h", "middle"); f.text(x + 66, y + 42, s, "xf-k", "middle")
        if col < 4:
            f.line(x + 132, y + 28, x + 152, y + 28, "xf-ln", "end")
    f.path("M 720 96 L 720 116 L 86 116 L 86 136", "xf-ln", "end")
    f.text(390, 236, T("ทุกขั้นอ้างอิงมาตรฐาน: IEC 60034 · IEC 60947-4-1 · IEC 60364 / วสท. · IEC 60204-1 · IEC 61439", "Each step references: IEC 60034 · IEC 60947-4-1 · IEC 60364 / EIT · IEC 60204-1 · IEC 61439"), "xf-m", "middle")
    return f.svg()


@fig("mc-panel-layout")
def _():
    f = F(760, 380, T("ผังตู้ควบคุมมอเตอร์สตาร์-เดลต้า: เมนเบรกเกอร์ด้านบน คอนแทกเตอร์เรียงแถว รางเทอร์มินัลด้านล่าง รางเดินสาย และพัดลมระบายอากาศ",
                      "Star–delta panel layout: main breaker at the top, contactors in a row, terminal rail at the bottom, wiring ducts and ventilation"), "mc-panel-layout")
    f.rect(140, 20, 480, 340, "xf-box", 6)
    f.rect(160, 40, 440, 300, "xf-paper", 2)
    for y in (90, 190, 290):
        f.rect(170, y, 420, 14, "xf-duct", 2)
    f.rect(175, 46, 70, 40, "xf-boxb", 3); f.text(210, 70, "-Q0", "xf-k", "middle")
    f.rect(260, 46, 50, 40, "xf-boxb", 3); f.text(285, 70, "-Q1", "xf-k", "middle")
    f.rect(320, 52, 40, 30, "xf-box", 3); f.text(340, 71, "-F3", "xf-k", "middle")
    f.rect(370, 52, 60, 30, "xf-box", 3); f.text(400, 71, T("PSU 24V", "PSU 24V"), "xf-k", "middle")
    for i, t in enumerate(["-K1", "-K2", "-K3"]):
        f.rect(185 + i * 70, 116, 56, 66, "xf-boxa", 3); f.text(213 + i * 70, 153, t, "xf-k", "middle")
    f.rect(395, 116, 50, 34, "xf-box", 3); f.text(420, 137, "-F2", "xf-k", "middle")
    f.rect(455, 116, 40, 34, "xf-box", 3); f.text(475, 137, "-K4T", "xf-k", "middle")
    f.rect(505, 116, 70, 34, "xf-box", 3); f.text(540, 137, T("รีเลย์เฟส", "Phase relay"), "xf-k", "middle")
    for i in range(16):
        f.rect(180 + i * 24, 310, 18, 26, "xf-term", 2)
    f.text(380, 236, T("พื้นที่ว่างสำรอง ≥ 20 %", "≥ 20 % spare space"), "xf-k", "middle")
    f.rect(560, 210, 40, 40, "xf-box", 20); f.text(580, 234, T("พัดลม", "Fan"), "xf-k", "middle")
    f.rect(160, 210, 40, 40, "xf-box", 2); f.text(180, 234, T("กรอง", "Filter"), "xf-k", "middle")
    f.text(645, 60, T("ไฟเข้าด้านบน", "Supply in, top"), "xf-k"); f.text(645, 150, T("อุปกรณ์กำลัง", "Power devices"), "xf-k")
    f.text(645, 240, T("ลมเย็นเข้าต่ำ", "Cool air in, low"), "xf-k"); f.text(645, 256, T("ลมร้อนออกสูง", "Hot air out, high"), "xf-k")
    f.text(645, 326, T("เทอร์มินัล -X1", "Terminals -X1"), "xf-k")
    f.text(70, 200, T("ประตู:", "Door:"), "xf-k", "middle"); f.text(70, 218, T("ปุ่ม ไฟ มิเตอร์", "buttons, lamps"), "xf-k", "middle"); f.text(70, 236, T("เซเลกเตอร์", "selector"), "xf-k", "middle")
    return f.svg()


# =========================================================================== PLC
@fig("plc-architecture")
def _():
    f = F(780, 300, T("โครงสร้าง PLC: แหล่งจ่ายไฟ CPU หน่วยความจำ โมดูลอินพุต-เอาต์พุต การสื่อสาร และอุปกรณ์ภาคสนาม",
                      "PLC architecture: power supply, CPU, memory, input and output modules, communications and field devices"), "plc-architecture")
    f.rect(220, 60, 340, 170, "xf-box", 10)
    f.rect(235, 75, 70, 140, "xf-boxc", 6); f.text(270, 140, "PSU", "xf-h", "middle"); f.text(270, 158, "24 VDC", "xf-k", "middle")
    f.rect(315, 75, 110, 140, "xf-boxa", 6); f.text(370, 120, "CPU", "xf-h", "middle")
    f.text(370, 142, T("โปรแกรม · ข้อมูล", "Program · data"), "xf-k", "middle"); f.text(370, 160, T("ไทเมอร์ · เคาน์เตอร์", "Timers · counters"), "xf-k", "middle"); f.text(370, 178, T("พอร์ตสื่อสาร", "Comm ports"), "xf-k", "middle")
    f.rect(435, 75, 55, 140, "xf-boxb", 6); f.text(462, 150, "DI", "xf-h", "middle")
    f.rect(495, 75, 55, 140, "xf-boxb", 6); f.text(522, 150, "DO", "xf-h", "middle")
    ins = [T("ปุ่มกด · ซีเลกเตอร์", "Push-buttons · selectors"), T("ลิมิตสวิตช์", "Limit switches"), T("พร็อกซิมิตี PNP/NPN", "PNP/NPN proximity"), T("หน้าสัมผัสโอเวอร์โหลด", "Overload contacts"), T("ทรานสมิตเตอร์ 4–20 mA", "4–20 mA transmitters")]
    for i, s in enumerate(ins):
        y = 70 + i * 34
        f.rect(20, y - 14, 170, 26, "xf-box", 6); f.text(105, y + 3, s, "xf-k", "middle"); f.line(190, y, 220, y, "xf-ln", "end")
    outs = [T("คอยล์คอนแทกเตอร์", "Contactor coils"), T("หลอดไฟ · ไซเรน", "Lamps · sirens"), T("โซลินอยด์วาล์ว", "Solenoid valves"), T("คำสั่ง VFD", "VFD commands"), T("วาล์วควบคุม 4–20 mA", "4–20 mA control valve")]
    for i, s in enumerate(outs):
        y = 70 + i * 34
        f.rect(590, y - 14, 170, 26, "xf-box", 6); f.text(675, y + 3, s, "xf-k", "middle"); f.line(560, y, 590, y, "xf-ln", "end")
    f.rect(300, 250, 180, 34, "xf-boxc", 6); f.text(390, 272, T("HMI · SCADA · โปรแกรมเมอร์", "HMI · SCADA · programmer"), "xf-k", "middle")
    f.line(370, 230, 370, 250, "xf-ln", "both")
    f.text(390, 30, T("อินพุต → ตัดสินใจตามโปรแกรม → เอาต์พุต", "Inputs → decide by program → outputs"), "xf-h", "middle")
    return f.svg()


@fig("plc-scan")
def _():
    f = F(760, 300, T("วงรอบการสแกนของ PLC: อ่านอินพุตเข้าอิมเมจ ประมวลผลโปรแกรมจากบนลงล่าง เขียนเอาต์พุต และงานระบบ วนซ้ำทุก 1–50 ms",
                      "PLC scan cycle: read inputs into the image table, execute the program top to bottom, write outputs, housekeeping — repeated every 1–50 ms"), "plc-scan")
    cx, cy, R = 190, 150, 102
    steps = [(T("1 อ่านอินพุต", "1 Read inputs"), T("ขั้ว → อิมเมจ I", "terminals → I image")), (T("2 รันโปรแกรม", "2 Run program"), T("บน → ล่าง, ซ้าย → ขวา", "top → bottom, left → right")),
             (T("3 เขียนเอาต์พุต", "3 Write outputs"), T("อิมเมจ Q → ขั้ว", "Q image → terminals")), (T("4 งานระบบ", "4 Housekeeping"), T("สื่อสาร · ตรวจตัวเอง", "comms · self-test"))]
    for i, (a, b) in enumerate(steps):
        ang = math.radians(90 - i * 90)
        x, y = cx + R * math.cos(ang), cy - R * math.sin(ang)
        f.rect(x - 78, y - 22, 156, 44, ["xf-boxa", "xf-boxb", "xf-boxc", "xf-box"][i], 8)
        f.text(x, y - 3, a, "xf-h", "middle"); f.text(x, y + 14, b, "xf-k", "middle")
    for i in range(4):
        a1, a2 = math.radians(90 - i * 90 - 28), math.radians(90 - i * 90 - 62)
        f.path(f"M {f1(cx + R * math.cos(a1))} {f1(cy - R * math.sin(a1))} A {R} {R} 0 0 1 {f1(cx + R * math.cos(a2))} {f1(cy - R * math.sin(a2))}", "xf-ln", "end")
    f.text(cx, cy + 4, T("1 สแกน", "1 scan"), "xf-h", "middle")
    f.text(605, 60, T("เวลาตอบสนองแย่ที่สุด ≈ 2 × สแกน + หน่วงอินพุต", "Worst case ≈ 2 × scan + input filter"), "xf-k", "middle")
    pl = Plot(f, 470, 90, 270, 140, (0, 4), (-0.2, 3.4))
    pl.frame([0, 1, 2, 3, 4], [])
    rows = [("I0.0", [(0.6, 3.3)]), (T("อิมเมจ I", "I image"), [(1, 3.6)]), ("Q0.0", [(2, 4)])]
    for k, (n, segs) in enumerate(rows):
        base = 2.6 - k * 1.1
        pts = [(pl.X(0), pl.Y(base))]
        for a, b in segs:
            pts += [(pl.X(a), pl.Y(base)), (pl.X(a), pl.Y(base + 0.6)), (pl.X(min(b, 4)), pl.Y(base + 0.6))]
        pl.f.poly(pts, ["xf-d", "xf-a", "xf-b"][k])
        f.text(pl.x - 6, pl.Y(base) - 2, n, "xf-k", "end")
    f.text(605, 266, T("สแกน → · ปุ่มเปลี่ยนกลางสแกน PLC เห็นสแกนถัดไป", "scans → · a mid-scan change is seen next scan"), "xf-k", "middle")
    return f.svg()


@fig("plc-sink-source")
def _():
    f = F(780, 320, T("อินพุต PLC แบบซิงก์ (รับกระแสเข้า ต่อเซนเซอร์ PNP) และแบบซอร์ส (จ่ายกระแสออก ต่อเซนเซอร์ NPN) พร้อมทิศกระแส",
                      "Sinking PLC input (current flows in, use PNP sensors) and sourcing input (current flows out, use NPN sensors) with current direction"), "plc-sink-source")
    def panel(x0, kind):
        sink = kind == "sink"
        f.text(x0 + 180, 22, T("อินพุตแบบซิงก์ + เซนเซอร์ PNP", "Sinking input + PNP sensor") if sink else T("อินพุตแบบซอร์ส + เซนเซอร์ NPN", "Sourcing input + NPN sensor"), "xf-h", "middle")
        f.line(x0 + 10, 50, x0 + 360, 50, "xf-rail"); f.text(x0 + 8, 54, "+24V", "xf-k", "end")
        f.line(x0 + 10, 280, x0 + 360, 280, "xf-pe"); f.text(x0 + 8, 284, "0V", "xf-k", "end")
        f.rect(x0 + 30, 100, 110, 120, "xf-boxa", 8); f.text(x0 + 85, 92, "PNP" if sink else "NPN", "xf-h", "middle")
        f.text(x0 + 85, 124, T("น้ำตาล +", "Brown +"), "xf-k", "middle"); f.text(x0 + 85, 160, T("ดำ = สัญญาณ", "Black = signal"), "xf-k", "middle"); f.text(x0 + 85, 196, T("น้ำเงิน −", "Blue −"), "xf-k", "middle")
        f.line(x0 + 50, 50, x0 + 50, 100); f.line(x0 + 50, 220, x0 + 50, 280)
        f.rect(x0 + 230, 100, 120, 140, "xf-boxb", 8); f.text(x0 + 290, 92, "PLC DI", "xf-h", "middle")
        f.line(x0 + 140, 160, x0 + 230, 160, "xf-a", "end" if sink else "start")
        f.text(x0 + 185, 152, "I", "xf-ta", "middle")
        f.text(x0 + 250, 164, "I0.0", "xf-k")
        f.path(f"M {x0 + 300} 150 l 0 20 m -8 -10 l 16 0", "xf-ln")
        f.rect(x0 + 294, 186, 12, 26, "xf-box", 1)
        if sink:
            f.line(x0 + 300, 212, x0 + 300, 230); f.line(x0 + 300, 230, x0 + 330, 230); f.line(x0 + 330, 230, x0 + 330, 280); f.text(x0 + 324, 262, "COM→0V", "xf-k", "end")
        else:
            f.line(x0 + 300, 212, x0 + 300, 230); f.line(x0 + 300, 230, x0 + 330, 230); f.line(x0 + 330, 230, x0 + 330, 50); f.text(x0 + 324, 120, "COM→+24V", "xf-k", "end")
        f.text(x0 + 185, 306, T("เซนเซอร์ 'จ่าย' +24V ให้อินพุต", "Sensor 'sources' +24 V into the input") if sink else T("เซนเซอร์ 'ดึง' อินพุตลง 0V", "Sensor 'sinks' the input to 0 V"), "xf-m", "middle")
    panel(20, "sink"); panel(410, "source")
    return f.svg()


@fig("plc-outputs")
def _():
    f = F(780, 290, T("เอาต์พุต PLC: แบบรีเลย์ใช้ได้ทั้ง AC และ DC แต่ช้าและสึกหรอ แบบทรานซิสเตอร์ (PNP ซอร์ส) เร็ว ใช้ DC เท่านั้น ต้องมีไดโอดคร่อมคอยล์ DC และ RC สนับเบอร์สำหรับคอยล์ AC",
                      "PLC outputs: relay outputs switch AC or DC but are slow and wear; transistor (PNP sourcing) outputs are fast but DC only; fit a diode across DC coils and an RC snubber across AC coils"), "plc-outputs")
    f.text(190, 24, T("เอาต์พุตรีเลย์ → คอยล์คอนแทกเตอร์ 230 VAC", "Relay output → 230 VAC contactor coil"), "xf-h", "middle")
    f.rect(30, 50, 120, 180, "xf-boxb", 8); f.text(90, 70, "PLC DO", "xf-k", "middle")
    el_no(f, 90, 100, tag=None); f.text(110, 128, "Q0.0", "xf-k")
    f.line(90, 152, 90, 200); f.text(70, 216, "COM", "xf-k", "middle")
    f.line(90, 100, 90, 80); f.line(90, 80, 240, 80)
    el_coil(f, 240, 80, "-K1"); f.line(240, 132, 240, 200); f.line(90, 200, 240, 200)
    f.rect(270, 112, 30, 16, "xf-box", 2); f.text(285, 145, "RC", "xf-k", "middle"); f.line(240, 104, 285, 104); f.line(285, 104, 285, 112); f.line(285, 128, 285, 156); f.line(240, 156, 285, 156)
    f.text(190, 250, T("230 VAC L → COM · N → A2 · สูงสุด ~2 A/จุด", "230 VAC L → COM · N → A2 · ~2 A per point max"), "xf-k", "middle")
    f.text(190, 268, T("อายุทางไฟฟ้า ~ 10⁵–10⁶ ครั้ง", "Electrical life ~10⁵–10⁶ operations"), "xf-k", "middle")
    f.text(590, 24, T("เอาต์พุตทรานซิสเตอร์ PNP → รีเลย์/โซลินอยด์ 24 VDC", "PNP transistor output → 24 VDC relay/solenoid"), "xf-h", "middle")
    f.rect(430, 50, 120, 180, "xf-boxb", 8); f.text(490, 70, "PLC DO", "xf-k", "middle")
    f.circ(490, 125, 18, "xf-box"); f.line(482, 112, 482, 138); f.line(482, 120, 496, 110); f.line(482, 130, 496, 140, "xf-ln"); f.text(515, 130, "Q0.1", "xf-k")
    f.line(490, 80, 490, 107); f.line(490, 143, 490, 165); f.line(490, 165, 640, 165)
    f.line(490, 80, 490, 50); f.text(490, 44, "+24V", "xf-k", "middle")
    el_coil(f, 640, 165, "-K2"); f.line(640, 217, 640, 240); f.line(640, 240, 470, 240); f.text(462, 244, "0V", "xf-k", "end")
    f.path("M 690 182 l -8 14 l 16 0 z", "xf-ln"); f.line(682, 182, 698, 182); f.line(640, 175, 690, 175); f.line(690, 175, 690, 182); f.line(690, 196, 690, 207); f.line(640, 207, 690, 207)
    f.text(704, 196, T("ไดโอด", "Diode"), "xf-k")
    f.text(590, 268, T("เร็ว (< 1 ms) ไม่สึกหรอ · DC เท่านั้น · ~0.5 A/จุด", "Fast (< 1 ms), no wear · DC only · ~0.5 A per point"), "xf-k", "middle")
    return f.svg()


def ladder(f, x0, y0, rungs, width=520, rh=70, labels=True):
    """Static ladder: rungs = [(items, coil)], items = list of ('no'|'nc'|'p', name) or ('par', [[...],[...]]) — one level of parallel."""
    y = y0
    LW = 70
    def contact(x, y, kind, name):
        f.line(x, y, x + 24, y); f.line(x + 46, y, x + LW, y)
        f.line(x + 24, y - 12, x + 24, y + 12); f.line(x + 46, y - 12, x + 46, y + 12)
        if kind == "nc":
            f.line(x + 20, y + 12, x + 50, y - 12)
        if kind == "p":
            f.text(x + 35, y + 5, "P", "xf-k", "middle")
        f.text(x + 35, y - 18, name, "xf-tag", "middle")
    for items, coil in rungs:
        x = x0
        maxbr = 1
        for it in items:
            if it[0] == "par":
                n = len(it[1]); maxbr = max(maxbr, n)
                w = max(len(b) for b in it[1]) * LW
                for k, br in enumerate(it[1]):
                    yy = y + k * 48
                    xx = x
                    for kind, name in br:
                        contact(xx, yy, kind, name); xx += LW
                    if xx < x + w:
                        f.line(xx, yy, x + w, yy)
                    if k:
                        f.line(x, y, x, yy); f.line(x + w, y, x + w, yy)
                x += w
            else:
                contact(x, y, it[0], it[1]); x += LW
        f.line(x, y, x0 + width - 50, y)
        cx = x0 + width - 40
        f.path(f"M {cx - 8} {y - 12} A 14 14 0 0 0 {cx - 8} {y + 12} M {cx + 8} {y - 12} A 14 14 0 0 1 {cx + 8} {y + 12}", "xf-ln")
        kind = coil[0]
        if kind != "()":
            f.text(cx, y + 5, kind, "xf-k", "middle")
        f.line(x0 + width - 50, y, cx - 10, y); f.line(cx + 10, y, x0 + width, y)
        f.text(cx, y - 18, coil[1], "xf-tag", "middle")
        y += rh + (maxbr - 1) * 48
    f.line(x0, y0 - 30, x0, y - rh + 30, "xf-rail"); f.line(x0 + width, y0 - 30, x0 + width, y - rh + 30, "xf-rail")
    return y


@fig("plc-ladder-basic")
def _():
    f = F(760, 360, T("แลดเดอร์พื้นฐาน: AND (อนุกรม) OR (ขนาน) NOT (หน้าสัมผัส NC) และวงจรล็อกตัวเองของมอเตอร์",
                      "Ladder basics: AND (series), OR (parallel), NOT (NC contact) and the motor self-holding rung"), "plc-ladder-basic")
    y = ladder(f, 160, 50, [([("no", "A"), ("no", "B")], ("()", "Y1")), ([("par", [[("no", "A")], [("no", "B")]])], ("()", "Y2")), ([("nc", "A")], ("()", "Y3")),
                           ([("nc", "STOP"), ("par", [[("no", "START")], [("no", "MOTOR")]]), ("nc", "OL")], ("()", "MOTOR"))], width=400)
    labs = [("Y1 = A · B", "AND"), ("Y2 = A + B", "OR"), ("Y3 = Ā", "NOT"), (T("MOTOR = STOP̄·(START+MOTOR)·OL̄", "MOTOR = STOP̄·(START+MOTOR)·OL̄"), T("ล็อกตัวเอง", "Latch"))]
    for i, (e, n) in enumerate(labs):
        yy = [50, 120, 238, 308][i]
        f.text(140, yy + 4, n, "xf-h", "end")
        f.text(578, yy + 4, e, "xf-k")
    return f.svg()


@fig("plc-stop-nc")
def _():
    f = F(780, 300, T("ปุ่ม STOP ต่อแบบ NC เข้าอินพุต PLC: ขณะไม่กด อินพุตเป็น 1 จึงเขียนในโปรแกรมด้วยหน้าสัมผัส NO ถ้าสายขาด อินพุตเป็น 0 มอเตอร์หยุด (fail-safe)",
                      "A STOP button wired NC into a PLC input reads 1 when not pressed, so it is programmed with an NO contact; a broken wire reads 0 and stops the motor (fail-safe)"), "plc-stop-nc")
    f.text(150, 24, T("การต่อสาย", "Wiring"), "xf-h", "middle")
    f.line(40, 50, 260, 50, "xf-rail"); f.text(36, 54, "+24V", "xf-k", "end")
    el_nc(f, 110, 50, "push", "-S0", "11", "12"); f.line(110, 102, 110, 150, "xf-ln", "end")
    f.text(110, 168, "I0.0", "xf-tag", "middle"); f.text(110, 186, T("= 1 ตอนปกติ", "= 1 normally"), "xf-k", "middle")
    el_no(f, 220, 50, "push", "-S1", "13", "14"); f.line(220, 102, 220, 150, "xf-ln", "end")
    f.text(220, 168, "I0.1", "xf-tag", "middle"); f.text(220, 186, T("= 1 เมื่อกด", "= 1 when pressed"), "xf-k", "middle")
    f.text(165, 214, T("STOP (NC)  ·  START (NO)", "STOP (NC)  ·  START (NO)"), "xf-k", "middle")
    f.text(520, 24, T("โปรแกรม (ถูก)", "Program (correct)"), "xf-h", "middle")
    ladder(f, 340, 80, [([("no", "I0.0"), ("par", [[("no", "I0.1")], [("no", "Q0.0")]])], ("()", "Q0.0"))], width=360)
    f.text(520, 200, T("ใช้ NO กับ I0.0 เพราะสัญญาณเป็น 1 ตอนปกติ", "NO contact on I0.0 because it reads 1 normally"), "xf-k", "middle")
    f.text(520, 222, T("กด STOP หรือสายขาด → I0.0 = 0 → หยุด", "Press STOP or break the wire → I0.0 = 0 → stop"), "xf-tb", "middle")
    f.text(390, 268, T("ถ้าใช้ปุ่ม STOP แบบ NO: สายขาดแล้วกด STOP ไม่มีผล — อันตราย", "With an NO STOP button a broken wire makes STOP do nothing — dangerous"), "xf-m", "middle")
    f.text(390, 288, T("IEC 60204-1: คำสั่งหยุดต้องทำงานด้วยการตัดวงจร (de-energisation)", "IEC 60204-1: stop functions must act by de-energisation"), "xf-m", "middle")
    return f.svg()

@fig("plc-timers")
def _():
    f = F(760, 330, T("ไดอะแกรมเวลาของไทเมอร์ IEC 61131-3: TON หน่วงเวลาเปิด TOF หน่วงเวลาปิด และ TP พัลส์ความยาวคงที่ (PT = 3 s)",
                      "IEC 61131-3 timer timing diagrams: TON on-delay, TOF off-delay and TP fixed-length pulse (PT = 3 s)"), "plc-timers")
    x0, w, TM = 110, 610, 18
    X = lambda t: x0 + min(t, TM) / TM * w
    IN = [(1, 5), (9, 10), (11, 11.5), (15, 16)]
    def wave(y, segs, c, name):
        pts = [(X(0), y + 12)]
        for a, b in segs:
            pts += [(X(a), y + 12), (X(a), y - 8), (X(b), y - 8), (X(b), y + 12)]
        pts.append((X(TM), y + 12))
        f.poly(pts, c); f.text(x0 - 10, y + 6, name, "xf-tag", "end")
    wave(40, IN, "xf-d", "IN")
    wave(95, [(4, 5)], "xf-a", "TON.Q")
    wave(150, [(1, 8), (9, 14.5), (15, 18)], "xf-b", "TOF.Q")
    wave(205, [(1, 4), (9, 12), (15, 18)], "xf-c", "TP.Q")
    for t in range(0, TM + 1, 2):
        f.line(X(t), 260, X(t), 266, "xf-thin"); f.text(X(t), 280, str(t), "xf-k", "middle")
    f.text(X(9), 298, T("เวลา (s)", "Time (s)"), "xf-m", "middle")
    f.line(X(1), 80, X(4), 80, "xf-thin", "both"); f.text(X(2.5), 75, "PT", "xf-k", "middle")
    f.text(X(10.5), 80, T("พัลส์สั้นกว่า PT → TON ไม่ออก", "pulses shorter than PT → no TON output"), "xf-k", "middle")
    f.text(X(6.5), 132, T("ค้าง 3 s หลัง IN ดับ", "holds 3 s after IN falls"), "xf-k", "middle")
    f.text(X(11.8), 190, T("IN ซ้ำระหว่างพัลส์ไม่มีผล", "IN during the pulse is ignored"), "xf-k", "middle")
    f.text(380, 322, T("ET (elapsed time) นับขึ้นเฉพาะช่วงที่ไทเมอร์กำลังจับเวลา", "ET (elapsed time) counts up only while the timer is timing"), "xf-m", "middle")
    return f.svg()

@fig("plc-counter")
def _():
    f = F(760, 250, T("ไดอะแกรมเวลาของเคาน์เตอร์นับขึ้น CTU (PV = 4): นับขอบขาขึ้นของ CU เมื่อ CV ถึง PV เอาต์พุต Q เป็น 1 จน RESET",
                      "Up-counter CTU timing (PV = 4): counts rising edges of CU; Q turns on when CV reaches PV until RESET"), "plc-counter")
    x0, w = 110, 610
    X = lambda t: x0 + t / 14 * w
    cu = [(1, 1.6), (2.5, 3.1), (4, 4.6), (5.5, 6.1), (7, 7.6), (8.5, 9.1)]
    def wave(y, segs, c, name):
        pts = [(X(0), y + 12)]
        for a, b in segs:
            pts += [(X(a), y + 12), (X(a), y - 8), (X(b), y - 8), (X(b), y + 12)]
        pts.append((X(14), y + 12)); f.poly(pts, c); f.text(x0 - 10, y + 6, name, "xf-tag", "end")
    wave(40, cu, "xf-d", "CU")
    wave(95, [(10.5, 11.2)], "xf-e", "R")
    cv = 0; pts = [(X(0), 175)]
    seq = [(0, 0)] + [(a, i + 1) for i, (a, b) in enumerate(cu)] + [(10.5, 0)]
    for i, (t, v) in enumerate(seq):
        pts += [(X(t), 175 - (seq[i - 1][1] if i else 0) * 8), (X(t), 175 - v * 8)]
    pts.append((X(14), 175))
    f.poly(pts, "xf-a"); f.text(x0 - 10, 170, "CV", "xf-tag", "end")
    for i, (a, b) in enumerate(cu):
        f.text(X(a) + 10, 175 - (i + 1) * 8 - 4, str(i + 1), "xf-k")
    wave(205, [(5.5, 10.5)], "xf-b", "Q")
    f.text(X(8), 196, T("CV ≥ PV = 4", "CV ≥ PV = 4"), "xf-k", "middle")
    f.text(380, 244, T("CV นับต่อเกิน PV ได้ (จนถึงค่าสูงสุดของชนิดข้อมูล) · RESET ทำให้ CV = 0 และ Q = 0", "CV keeps counting past PV (up to the data-type maximum) · RESET clears CV and Q"), "xf-m", "middle")
    return f.svg()


@fig("plc-yd-io")
def _():
    f = F(780, 350, T("PLC ควบคุมสตาร์-เดลต้า: อินพุต STOP (NC) START โอเวอร์โหลด และหน้าสัมผัสป้อนกลับ เอาต์พุตสั่งคอยล์ K1 K2 K3 โดยยังคงอินเตอร์ล็อก K2/K3 แบบฮาร์ดไวร์",
                      "PLC star–delta control: inputs STOP (NC), START, overload and feedback contacts; outputs drive K1 K2 K3 coils with the K2/K3 interlock kept hard-wired"), "plc-yd-io")
    f.rect(250, 40, 200, 250, "xf-boxb", 10); f.text(350, 30, "PLC", "xf-h", "middle")
    ins = [("I0.0", "-S0 STOP (NC)"), ("I0.1", "-S1 START (NO)"), ("I0.2", "-F2 95-96 (NC)"), ("I0.3", "-K1 13-14"), ("I0.4", "-K2 13-14"), ("I0.5", "-K3 13-14")]
    f.line(30, 50, 30, 270, "xf-rail"); f.text(30, 44, "+24V", "xf-k", "middle")
    for i, (a, b) in enumerate(ins):
        y = 70 + i * 36
        f.line(30, y, 250, y); f.dot(30, y); f.text(260, y + 4, a, "xf-k"); f.text(140, y - 5, b, "xf-k", "middle")
    outs = [("Q0.0", "-K1", ""), ("Q0.1", "-K2 (Y)", "-K3 21-22"), ("Q0.2", "-K3 (Δ)", "-K2 21-22")]
    f.line(740, 70, 740, 270, "xf-rail"); f.text(740, 286, T("N (230 VAC)", "N (230 VAC)"), "xf-k", "middle")
    for i, (a, b, il) in enumerate(outs):
        y = 100 + i * 70
        f.text(440, y + 4, a, "xf-k", "end"); f.line(450, y, 560, y)
        if il:
            f.line(560, y - 12, 560, y + 12); f.line(580, y - 12, 580, y + 12); f.line(556, y + 12, 584, y - 12)
            f.text(570, y - 18, il, "xf-k", "middle")
        else:
            f.line(560, y, 580, y)
        f.line(580, y, 620, y)
        f.rect(620, y - 13, 40, 26, "xf-coil", 1); f.text(640, y + 28, b, "xf-tag", "middle")
        f.line(660, y, 740, y); f.dot(740, y)
    f.text(390, 318, T("อินเตอร์ล็อกในฮาร์ดแวร์ทำงานแม้ PLC เสียหรือถูก Force", "The hardware interlock still works if the PLC fails or is forced"), "xf-tb", "middle")
    f.text(390, 340, T("ป้อนกลับ K1/K2/K3 ทำให้ PLC ตรวจคอนแทกเตอร์ค้างก่อนสั่งขั้นต่อไป", "K1/K2/K3 feedback lets the PLC detect a welded contactor before the next step"), "xf-m", "middle")
    return f.svg()

@fig("plc-traffic-states")
def _():
    f = F(760, 280, T("แผนภาพสถานะไฟจราจรสี่แยก 2 ทิศ: 6 สถานะเปลี่ยนตามเวลา",
                      "State diagram of a two-direction traffic light: six states advancing on timers"), "plc-traffic-states")
    st = [("S0", T("NS เขียว · EW แดง", "NS green · EW red"), "25 s"), ("S1", T("NS เหลือง · EW แดง", "NS amber · EW red"), "3 s"), ("S2", T("แดงทุกทิศ", "All red"), "2 s"),
          ("S3", T("EW เขียว · NS แดง", "EW green · NS red"), "25 s"), ("S4", T("EW เหลือง · NS แดง", "EW amber · NS red"), "3 s"), ("S5", T("แดงทุกทิศ", "All red"), "2 s")]
    pos = [(110, 70), (380, 70), (650, 70), (650, 210), (380, 210), (110, 210)]
    for (n, d, t), (x, y) in zip(st, pos):
        f.rect(x - 95, y - 30, 190, 60, "xf-boxa", 30)
        f.text(x, y - 6, n, "xf-h", "middle"); f.text(x, y + 14, d, "xf-k", "middle")
    for i in range(6):
        (x1, y1), (x2, y2) = pos[i], pos[(i + 1) % 6]
        if y1 == y2:
            d = 1 if x2 > x1 else -1
            f.line(x1 + 95 * d, y1, x2 - 95 * d, y2, "xf-ln", "end")
            f.text((x1 + x2) / 2, y1 - 8, "T " + st[i][2], "xf-k", "middle")
        else:
            f.line(x1, y1 + 30 * (1 if y2 > y1 else -1), x2, y2 - 30 * (1 if y2 > y1 else -1), "xf-ln", "end")
            f.text(x1 + 8, (y1 + y2) / 2 + 4, "T " + st[i][2], "xf-k")
    f.text(380, 272, T("หนึ่งสถานะทำงานทีละสถานะ · เงื่อนไขเปลี่ยน = ไทเมอร์ของสถานะครบ · ปุ่มคนข้ามและโหมดกะพริบกลางคืนเพิ่มได้ง่าย",
                       "Exactly one state is active · transition = that state's timer done · pedestrian buttons and night flashing are easy to add"), "xf-m", "middle")
    return f.svg()


@fig("plc-sfc-tank")
def _():
    f = F(760, 420, T("SFC/GRAFCET ของถังผสมแบบแบตช์: เติมของเหลว A เติม B กวน ปล่อยออก แล้วกลับสู่ขั้นเริ่มต้น",
                      "SFC/GRAFCET of a batch mixing tank: fill A, fill B, mix, drain, then return to the initial step"), "plc-sfc-tank")
    steps = [("0", T("รอ", "Idle"), ""), ("1", T("เติม A", "Fill A"), "V1"), ("2", T("เติม B", "Fill B"), "V2"), ("3", T("กวน", "Mix"), "M1 · T#60s"), ("4", T("ปล่อยออก", "Drain"), "V3")]
    trans = ["START · NOT LL", "LM", "LH", "T3.Q", "NOT LL"]
    x = 200
    for i, (n, d, a) in enumerate(steps):
        y = 30 + i * 76
        f.rect(x - 24, y, 48, 40, "xf-boxa", 2)
        if i == 0:
            f.rect(x - 20, y + 4, 40, 32, "xf-box", 2)
        f.text(x, y + 25, n, "xf-h", "middle")
        if a:
            f.line(x + 24, y + 20, x + 60, y + 20); f.rect(x + 60, y + 6, 170, 28, "xf-box", 2); f.text(x + 145, y + 25, a, "xf-k", "middle")
        f.text(x - 34, y + 25, d, "xf-k", "end")
        f.line(x, y + 40, x, y + 76)
        f.line(x - 14, y + 58, x + 14, y + 58, "xf-rail"); f.text(x + 22, y + 62, trans[i], "xf-k")
    yb = 30 + 5 * 76
    f.line(x, yb - 0, x, yb + 4); f.line(x, yb + 4, x - 110, yb + 4); f.line(x - 110, yb + 4, x - 110, 18); f.line(x - 110, 18, x, 18); f.line(x, 18, x, 30, "xf-ln", "end")
    f.text(470, 60, T("LL LM LH = สวิตช์ระดับต่ำ กลาง สูง (1 = จมน้ำ)", "LL LM LH = low, mid, high level (1 = covered)"), "xf-k")
    f.text(470, 80, T("V1 V2 วาล์วเติม · V3 วาล์วปล่อย · M1 มอเตอร์กวน", "V1 V2 inlet valves · V3 drain valve · M1 mixer"), "xf-k")
    f.text(470, 110, T("กฎ SFC:", "SFC rules:"), "xf-h")
    f.text(470, 130, T("• ขั้นที่ทำงานอยู่ทำ action ของมัน", "• An active step runs its actions"), "xf-k")
    f.text(470, 150, T("• ข้ามได้เมื่อขั้นก่อนทำงานและเงื่อนไขจริง", "• A transition fires when its step is active"), "xf-k")
    f.text(470, 170, T("  (ขั้นก่อนดับ ขั้นถัดไปติด ในสแกนเดียว)", "  and its condition is true (one scan)"), "xf-k")
    f.text(470, 190, T("• กรอบคู่ = ขั้นเริ่มต้น", "• Double box = initial step"), "xf-k")
    return f.svg()


@fig("plc-scaling")
def _():
    f = F(760, 280, T("การสเกลค่าแอนะล็อก: ค่าดิบ 0–27648 (4–20 mA ของ Siemens) แปลงเป็น 0–10 bar ด้วยสมการเส้นตรง และค่าต่ำกว่า 4 mA ใช้ตรวจสายขาด",
                      "Analog scaling: raw 0–27648 (4–20 mA on Siemens) mapped to 0–10 bar with a straight line; below 4 mA flags a broken wire"), "plc-scaling")
    pl = Plot(f, 70, 25, 380, 200, (0, 27648 * 1.1), (-1, 11))
    pl.frame([0, 6912, 13824, 20736, 27648], [0, 2.5, 5, 7.5, 10], xl=T("ค่าดิบจาก ADC", "Raw ADC value"), yl="bar", yf=lambda v: f"{v:g}")
    pl.curve([(0, 0), (27648, 10)], "xf-b")
    pl.curve([(27648, 10), (29000, 10.5)], "xf-dash")
    for raw in (6912, 13824, 20736):
        f.dot(pl.X(raw), pl.Y(raw / 27648 * 10))
    f.text(pl.X(13824) + 8, pl.Y(5) + 18, "13824 → 5.0 bar", "xf-k")
    f.text(490, 50, "y = y_min + (x − x_min)·", "xf-k"); f.text(490, 66, "    (y_max − y_min)/(x_max − x_min)", "xf-k")
    rows = [("4 mA", "0", "0 bar"), ("12 mA", "13824", "5 bar"), ("20 mA", "27648", "10 bar"), ("< 3.6 mA", T("ติดลบ/ต่ำ", "negative/low"), T("สายขาด!", "wire break!"))]
    for i, (a, b, c) in enumerate(rows):
        y = 100 + i * 24
        f.text(490, y, a, "xf-k"); f.text(570, y, b, "xf-k"); f.text(660, y, c, "xf-k")
    f.text(380, 270, T("ยี่ห้ออื่น: Mitsubishi 0–4000 หรือ 0–32000 · Omron 0–4000/0–8000 · ดูคู่มือโมดูล ตั้งช่วงให้ตรงกับทรานสมิตเตอร์", "Other brands: Mitsubishi 0–4000 or 0–32000 · Omron 0–4000/0–8000 · check the module manual and match the transmitter range"), "xf-m", "middle")
    return f.svg()


@fig("plc-pid-loop")
def _():
    f = F(780, 240, T("ลูปควบคุมความดันคงที่: PLC อ่านความดันจากทรานสมิตเตอร์ 4–20 mA คำนวณ PID แล้วส่งความถี่ไปยัง VFD ที่ขับปั๊ม",
                      "Constant-pressure loop: the PLC reads pressure from a 4–20 mA transmitter, runs PID and sends a frequency to the VFD driving the pump"), "plc-pid-loop")
    f.text(40, 104, "SP", "xf-h", "middle"); f.line(55, 100, 105, 100, "xf-ln", "end")
    f.circ(118, 100, 13, "xf-box"); f.text(118, 105, "Σ", "xf-k", "middle"); f.text(106, 92, "+", "xf-k"); f.text(110, 128, "−", "xf-k")
    blocks = [(150, "PID", "Kp Ti Td"), (300, "VFD", "0–50 Hz"), (450, T("ปั๊ม + ท่อ", "Pump + pipe"), T("ความดัน", "pressure")), (600, "PT", "4–20 mA")]
    for x, a, b in blocks:
        f.rect(x, 74, 110, 52, "xf-boxa" if x < 300 else "xf-box", 8); f.text(x + 55, 97, a, "xf-h", "middle"); f.text(x + 55, 115, b, "xf-k", "middle")
    f.line(131, 100, 150, 100, "xf-ln", "end"); f.line(260, 100, 300, 100, "xf-ln", "end"); f.text(280, 92, "AO/Modbus", "xf-k", "middle")
    f.line(410, 100, 450, 100, "xf-ln", "end"); f.line(560, 100, 600, 100, "xf-ln", "end")
    f.line(710, 100, 750, 100); f.line(750, 100, 750, 180); f.line(750, 180, 118, 180); f.line(118, 180, 118, 113, "xf-ln", "end")
    f.text(430, 196, T("PV (ค่าวัด) ผ่านอินพุตแอนะล็อก + การสเกล", "PV (measured) via analog input + scaling"), "xf-k", "middle")
    f.rect(150, 20, 260, 36, "xf-boxc", 6); f.text(280, 43, T("PLC: สเกล → PID → จำกัด → เอาต์พุต", "PLC: scale → PID → limit → output"), "xf-k", "middle")
    f.text(390, 232, T("หรือใช้ PID ในตัว VFD ก็ได้ (ต่อ PT เข้า AI ของ VFD) — PLC สั่งแค่ RUN และค่าเป้าหมาย", "Alternatively use the VFD's built-in PID (PT into the VFD's AI) — the PLC only sends RUN and the setpoint"), "xf-m", "middle")
    return f.svg()


@fig("plc-estop")
def _():
    f = F(780, 320, T("หยุดฉุกเฉินที่ถูกต้อง: ปุ่ม E-stop สองช่องเข้ารีเลย์เซฟตี้ ตัดไฟคอยล์คอนแทกเตอร์โดยตรง PLC แค่อ่านสถานะ",
                      "A correct emergency stop: a dual-channel E-stop into a safety relay that cuts the contactor coils directly; the PLC only reads the status"), "plc-estop")
    f.rect(40, 60, 120, 120, "xf-box", 10); f.text(100, 52, T("ปุ่ม E-stop 2 ช่อง", "E-stop, 2 channels"), "xf-k", "middle")
    f.circ(100, 120, 34, "xf-estopc"); f.text(100, 125, "STOP", "xf-h", "middle")
    f.rect(260, 50, 170, 180, "xf-boxc", 10); f.text(345, 74, T("รีเลย์เซฟตี้", "Safety relay"), "xf-h", "middle")
    f.text(345, 96, "S11-S12 · S21-S22", "xf-k", "middle"); f.text(345, 116, T("ตรวจลัดวงจรข้ามช่อง", "cross-fault monitoring"), "xf-k", "middle")
    f.text(345, 136, T("รีเซ็ตด้วยมือ S33-S34", "manual reset S33-S34"), "xf-k", "middle"); f.text(345, 160, "13-14 · 23-24 (NO)", "xf-k", "middle"); f.text(345, 180, T("41-42 → PLC (สถานะ)", "41-42 → PLC (status)"), "xf-k", "middle")
    f.line(160, 100, 260, 100); f.line(160, 140, 260, 140); f.text(210, 94, "CH1", "xf-k", "middle"); f.text(210, 134, "CH2", "xf-k", "middle")
    f.line(430, 150, 520, 150); f.line(430, 170, 520, 170)
    f.rect(520, 130, 60, 60, "xf-boxa", 6); f.text(550, 165, "PLC Q", "xf-k", "middle")
    f.line(580, 160, 640, 160); f.rect(640, 140, 50, 40, "xf-coil", 2); f.text(665, 165, "-K1", "xf-k", "middle")
    f.text(570, 214, T("13-14 อนุกรมกับเอาต์พุต PLC → ตัดคอยล์ได้เสมอ", "13-14 in series with the PLC output → always cuts the coil"), "xf-k", "middle")
    f.line(430, 190, 470, 190); f.line(470, 190, 470, 260); f.line(470, 260, 520, 260); f.text(528, 264, T("I1.0 สถานะ (ไม่ใช่ทางเซฟตี้)", "I1.0 status (not the safety path)"), "xf-k")
    f.text(390, 306, T("หมวดหยุด 0 (IEC 60204-1): ตัดพลังงานทันที · ระดับ PL ต้องประเมินตาม ISO 13849-1 · ห้ามใช้ PLC ทั่วไปเป็นทางเดียวของ E-stop",
                       "Stop category 0 (IEC 60204-1): remove power immediately · assess the PL to ISO 13849-1 · never make a standard PLC the only E-stop path"), "xf-m", "middle")
    return f.svg()


@fig("mc-nema-dol")
def _():
    f = F(860, 610, T("วงจรสตาร์ทตรงตามมาตรฐาน NEMA/JIC: วงจรกำลัง (ดิสคอนเนกต์พร้อมฟิวส์ สตาร์ตเตอร์ M ฮีตเตอร์โอเวอร์โหลด OL มอเตอร์ T1 T2 T3) หม้อแปลงควบคุม 480/120 V และแลดเดอร์ควบคุมแบบ 3 สาย STOP START M OL",
                      "DOL starter to NEMA/JIC: power circuit (fused disconnect, starter M, overload heaters OL, motor T1 T2 T3), 480/120 V control transformer and the three-wire ladder STOP START M OL"), "mc-nema-dol")
    xs = [80, 120, 160]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 66)
    n_poles(f, xs, yb + 66, "M")
    yo = yb + 66 + 46
    p_wires(f, xs, yo, yo + 30)
    n_heaters(f, xs, yo + 30, link="OL")
    ym = yo + 30 + 44
    p_wires(f, xs, ym, ym + 36)
    p_motor(f, 120, ym + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=36)
    f.text(190, ym + 36 + 2 * 58 + 2, "MTR", "xf-tag")
    p_pe(f, 36, 44, ym + 36 + 58, label="GND")
    x1, y1, x2, y2 = _nema_ct(f, xs, yb)
    # control: X1 through FU3 to the left rail, X2 (grounded) to the right rail
    xL, xR, yt = 500, 830, 150
    f.line(x1, y1, x1, yt); f.line(x1, yt, xL, yt)
    f.rect(x1 + 40, yt - 6, 24, 12, "xf-box", 1); f.text(x1 + 52, yt - 13, "FU3", "xf-tagk", "middle")
    rungs = [
        NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="M", wn=2)), NE(n_coil, tag="M", R=True, wn=3), NE(n_ol, R=True, wn=4))),
        NRN(2, NS(NE(n_contact, tag="M", wn=1), NE(n_lamp, tag="G", name="RUN", R=True, wn=5))),
        NRN(3, NS(NE(n_contact, nc=True, tag="M", wn=1), NE(n_lamp, tag="R", name="OFF", R=True, wn=6))),
    ]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    f.line(x2, y2, x2, yb2 + 28); f.line(x2, yb2 + 28, xR, yb2 + 28); f.line(xR, yb2 + 28, xR, yb2)
    f.dot(x2, y2 + 40); f.line(x2, y2 + 40, x2 + 22, y2 + 40); p_earth(f, x2 + 22, y2 + 40)
    f.text(x2 + 32, y2 + 66, T("X2 ต่อดิน", "X2 grounded"), "xf-k")
    f.text(430, f.h - 22, T("ตัวเลขใต้คอยล์ M = เลขแลดเดอร์ที่มีหน้าสัมผัสของ M (ขีดเส้นใต้ = NC) · ตัวเลขบนเส้น = เลขสาย (wire number)", "Numbers under coil M = rungs that carry its contacts (underlined = NC) · numbers on the wires = wire numbers"), "xf-m", "middle")
    f.text(430, f.h - 6, T("จุดต่อทางไฟฟ้าเดียวกันใช้เลขสายเดียวกัน · สีสาย (NFPA 79): แดง = ควบคุม 120 V AC, ดำ = กำลัง, ขาว = X2 ที่ต่อดิน", "One number per electrical node · wire colours (NFPA 79): red = 120 V AC control, black = power, white = grounded X2"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(860, 580, T("วงจรสตาร์ทตรงตามมาตรฐาน NEMA/JIC: วงจรกำลัง (ดิสคอนเนกต์พร้อมฟิวส์ สตาร์ตเตอร์ M ฮีตเตอร์โอเวอร์โหลด OL มอเตอร์ T1 T2 T3) หม้อแปลงควบคุม 480/120 V และแลดเดอร์ควบคุมแบบ 3 สาย STOP START M OL",
                      "DOL starter to NEMA/JIC: power circuit (fused disconnect, starter M, overload heaters OL, motor T1 T2 T3), 480/120 V control transformer and the three-wire ladder STOP START M OL"), "mc-nema-dol")
    xs = [80, 120, 160]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 66)
    n_poles(f, xs, yb + 66, "M", terms=False)
    yo = yb + 66 + 46
    p_wires(f, xs, yo, yo + 30)
    n_heaters(f, xs, yo + 30, link="OL")
    ym = yo + 30 + 44
    p_wires(f, xs, ym, ym + 36)
    p_motor(f, 120, ym + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=36)
    f.text(190, ym + 36 + 2 * 58 + 2, "MTR", "xf-tag")
    p_pe(f, 36, 44, ym + 36 + 58, label="GND")
    x1, y1, x2, y2 = _nema_ct(f, xs, yb)
    # control: X1 through FU3 to the left rail, X2 (grounded) to the right rail
    xL, xR, yt = 500, 830, 150
    f.line(x1, y1, x1, yt); f.line(x1, yt, xL, yt)
    f.rect(x1 + 40, yt - 6, 24, 12, "xf-box", 1); f.text(x1 + 52, yt - 13, "FU3", "xf-tagk", "middle")
    rungs = [
        NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="M", wn=2)), NE(n_coil, tag="M", R=True, wn=3), NE(n_ol, R=True, wn=4))),
        NRN(2, NS(NE(n_contact, tag="M", wn=1), NE(n_lamp, tag="G", name="RUN", R=True, wn=5))),
        NRN(3, NS(NE(n_contact, nc=True, tag="M", wn=1), NE(n_lamp, tag="R", name="OFF", R=True, wn=6))),
    ]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    f.line(x2, y2, x2, yb2 + 28); f.line(x2, yb2 + 28, xR, yb2 + 28); f.line(xR, yb2 + 28, xR, yb2)
    f.dot(x2, y2 + 40); f.line(x2, y2 + 40, x2 + 22, y2 + 40); p_earth(f, x2 + 22, y2 + 40)
    f.text(x2 + 32, y2 + 66, T("X2 ต่อดิน", "X2 grounded"), "xf-k")
    f.text(430, f.h - 22, T("ตัวเลขใต้คอยล์ M = เลขแลดเดอร์ที่มีหน้าสัมผัสของ M (ขีดเส้นใต้ = NC) · ตัวเลขบนเส้น = เลขสาย (wire number)", "Numbers under coil M = rungs that carry its contacts (underlined = NC) · numbers on the wires = wire numbers"), "xf-m", "middle")
    f.text(430, f.h - 6, T("ต้องใช้ตัวเลขชุดเดียวกับแต่ละจุดต่อ: เส้นสีแดง = ควบคุม 120 V AC, ดำ = กำลัง, ขาว = X2 ที่ต่อดิน (NFPA 79)", "One number per electrical node; wire colours: red = 120 V AC control, black = power, white = grounded X2 (NFPA 79)"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(860, 580, T("วงจรสตาร์ทตรงตามมาตรฐาน NEMA/JIC: วงจรกำลัง (ดิสคอนเนกต์พร้อมฟิวส์ สตาร์ตเตอร์ M ฮีตเตอร์โอเวอร์โหลด OL มอเตอร์ T1 T2 T3) หม้อแปลงควบคุม 480/120 V และแลดเดอร์ควบคุมแบบ 3 สาย STOP START M OL",
                      "DOL starter to NEMA/JIC: power circuit (fused disconnect, starter M, overload heaters OL, motor T1 T2 T3), 480/120 V control transformer and the three-wire ladder STOP START M OL"), "mc-nema-dol")
    xs = [80, 120, 160]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 66)
    n_poles(f, xs, yb + 66, "M", terms=False)
    f.text(xs[2] + 14, yb + 78, "L1 L2 L3 ▸ T1 T2 T3", "xf-k")
    yo = yb + 66 + 46
    p_wires(f, xs, yo, yo + 30)
    n_heaters(f, xs, yo + 30, link="OL")
    ym = yo + 30 + 44
    p_wires(f, xs, ym, ym + 36)
    p_motor(f, 120, ym + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=36)
    f.text(190, ym + 36 + 2 * 58 + 2, "MTR", "xf-tag")
    p_pe(f, 36, 44, ym + 36 + 58, label="GND")
    x1, y1, x2, y2 = _nema_ct(f, xs, yb)
    # control: X1 through FU3 to the left rail, X2 (grounded) to the right rail
    xL, xR, yt = 480, 820, 150
    f.line(x1, y1, x1, yt - 12); f.line(x1, yt - 12, xL, yt - 12)
    f.rect(372, yt - 18, 24, 12, "xf-box", 1); f.text(384, yt - 25, "FU3", "xf-tagk", "middle")
    rungs = [
        NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="M", wn=2)), NE(n_coil, tag="M", R=True, wn=3), NE(n_ol, R=True, wn=4))),
        NRN(2, NS(NE(n_contact, tag="M", wn=1), NE(n_lamp, tag="G", name="RUN", R=True, wn=5))),
        NRN(3, NS(NE(n_contact, nc=True, tag="M", wn=1), NE(n_lamp, tag="R", name="OFF", R=True, wn=6))),
    ]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    f.line(x2, y2, x2, yb2 + 28); f.line(x2, yb2 + 28, xR, yb2 + 28); f.line(xR, yb2 + 28, xR, yb2)
    f.dot(x2, y2 + 40); f.line(x2, y2 + 40, x2 + 22, y2 + 40); p_earth(f, x2 + 22, y2 + 40)
    f.text(x2 + 34, y2 + 62, T("X2 ต่อดิน (nested)", "X2 bonded to ground"), "xf-k") if False else f.text(x2 + 40, y2 + 66, T("X2 ต่อดิน", "X2 grounded"), "xf-k")
    f.text(430, f.h - 22, T("ตัวเลขใต้คอยล์ M = เลขแลดเดอร์ที่มีหน้าสัมผัสของ M (ขีดเส้นใต้ = NC) · ตัวเลขบนเส้น = เลขสาย (wire number)", "Numbers under coil M = rungs that carry its contacts (underlined = NC) · numbers on the wires = wire numbers"), "xf-m", "middle")
    f.text(430, f.h - 6, T("ต้องใช้ตัวเลขชุดเดียวกับแต่ละจุดต่อ: เส้นสีแดง = ควบคุม 120 V AC, ดำ = กำลัง, ขาว = X2 ที่ต่อดิน (NFPA 79)", "One number per electrical node; wire colours: red = 120 V AC control, black = power, white = grounded X2 (NFPA 79)"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(860, 580, T("วงจรสตาร์ทตรงตามมาตรฐาน NEMA/JIC: วงจรกำลัง (ดิสคอนเนกต์พร้อมฟิวส์ สตาร์ตเตอร์ M ฮีตเตอร์โอเวอร์โหลด OL มอเตอร์ T1 T2 T3) หม้อแปลงควบคุม 480/120 V และแลดเดอร์ควบคุมแบบ 3 สาย STOP START M OL",
                      "DOL starter to NEMA/JIC: power circuit (fused disconnect, starter M, overload heaters OL, motor T1 T2 T3), 480/120 V control transformer and the three-wire ladder STOP START M OL"), "mc-nema-dol")
    xs = [80, 120, 160]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 66)
    n_poles(f, xs, yb + 66, "M", terms=False)
    f.text(xs[2] + 14, yb + 78, "L1 L2 L3 ▸ T1 T2 T3", "xf-k")
    yo = yb + 66 + 46
    p_wires(f, xs, yo, yo + 30)
    n_heaters(f, xs, yo + 30, link="OL")
    ym = yo + 30 + 44
    p_wires(f, xs, ym, ym + 36)
    p_motor(f, 120, ym + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=36)
    f.text(190, ym + 36 + 2 * 58 + 2, "MTR", "xf-tag")
    p_pe(f, 36, 44, ym + 36 + 58, label="GND")
    x1, y1, x2, y2 = _nema_ct(f, xs, yb)
    # control: X1 through FU3 to the left rail, X2 (grounded) to the right rail
    xL, xR, yt = 480, 820, 150
    f.line(x1, y1, x1, yt - 12); f.line(x1, yt - 12, xL, yt - 12)
    f.rect(372, yt - 18, 24, 12, "xf-box", 1); f.text(384, yt - 25, "FU3", "xf-tagk", "middle")
    rungs = [
        NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="M", wn=2)), NE(n_coil, tag="M", R=True, wn=3), NE(n_ol, R=True, wn=4))),
        NRN(2, NS(NE(n_contact, tag="M", wn=1), NE(n_lamp, tag="G", name="RUN", R=True, wn=5))),
        NRN(3, NS(NE(n_contact, nc=True, tag="M", wn=1), NE(n_lamp, tag="R", name="OFF", R=True, wn=6))),
    ]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    f.line(x2, y2, x2, yb2 + 28); f.line(x2, yb2 + 28, xR, yb2 + 28); f.line(xR, yb2 + 28, xR, yb2)
    f.dot(x2, y2 + 40); f.line(x2, y2 + 40, x2 + 22, y2 + 40); p_earth(f, x2 + 22, y2 + 40)
    f.text(x2 + 34, y2 + 62, T("X2 ต่อดิน (nested)", "X2 bonded to ground"), "xf-k") if False else f.text(x2 + 40, y2 + 66, T("X2 ต่อดิน", "X2 grounded"), "xf-k")
    f.text(430, f.h - 22, T("ตัวเลขใต้คอยล์ M = เลขแลดเดอร์ที่มีหน้าสัมผัสของ M (ขีดเส้นใต้ = NC) · ตัวเลขบนเส้น = เลขสาย (wire number)", "Numbers under coil M = rungs that carry its contacts (underlined = NC) · numbers on the wires = wire numbers"), "xf-m", "middle")
    f.text(430, f.h - 6, T("ต้องใช้ตัวเลขชุดเดียวกับแต่ละจุดต่อ: เส้นสีแดง = ควบคุม 120 V AC, ดำ = กำลัง, ขาว = X2 ที่ต่อดิน (NFPA 79)", "One number per electrical node; wire colours: red = 120 V AC control, black = power, white = grounded X2 (NFPA 79)"), "xf-k", "middle")
    return f.svg()


def _nema_power_head(f, xs, y0=66):
    """Supply labels, fused disconnect (DISC / FU) and the control-transformer feed taken after the fuses. Returns y below the fuses."""
    f.text(xs[1], 22, "480 V 3Φ 60 Hz", "xf-k", "middle")
    for x, l in zip(xs, ("L1", "L2", "L3")):
        f.text(x, 40, l, "xf-k", "middle"); f.line(x, 44, x, y0)
    return n_disc(f, xs, y0, "DISC")


def _nema_ct(f, xs, yb, xt=330, y=214):
    """Control transformer 480/120 V: primary H1 (from L1) and H4 (from L2) through fuses, X2 grounded. Returns (x_X1, y_X1, x_X2, y_X2)."""
    xv = xt - 36                     # vertical run of the L2 tap
    # L1 → H1 (top primary lead) and L2 → H4 (bottom lead); each tap at its own height, L1 lowest, so the wires never touch
    f.line(xs[0], yb + 30, xt, yb + 30); f.dot(xs[0], yb + 30); f.line(xt, yb + 30, xt, y)
    f.rect(xt - 96, yb + 24, 24, 12, "xf-box", 1); f.text(xt - 84, yb + 17, "FU1", "xf-tagk", "middle")
    f.line(xs[1], yb + 16, xv, yb + 16); f.dot(xs[1], yb + 16)
    f.line(xv, yb + 16, xv, y + 84); f.line(xv, y + 84, xt, y + 84); f.line(xt, y + 84, xt, y + 64)
    f.rect(xv - 6, y + 30, 12, 24, "xf-box", 1); f.text(xv - 12, y + 46, "FU2", "xf-tagk", "end")
    n_xfmr(f, xt, y, tag="CT")
    f.text(xt - 9, y + 5, "H1", "xf-k", "end"); f.text(xt - 9, y + 60, "H4", "xf-k", "end")
    f.text(xt + 52, y + 5, "X1", "xf-k"); f.text(xt + 52, y + 60, "X2", "xf-k")
    f.text(xt + 20, y - 8, "480 : 120 V", "xf-k", "middle")
    return xt + 40, y, xt + 40, y + 64


def _nema_ctl_note(f, x, y):
    f.text(x, y, T("ควบคุม 120 V AC จากหม้อแปลงควบคุม (X1 · X2 ต่อดิน) ตามรูปสตาร์ทตรง", "120 V AC control from the control transformer (X1 · X2 grounded) as in the DOL figure"), "xf-k", "middle")


@fig("mc-nema-fr")
def _():
    f = F(900, 610, T("วงจรกลับทางหมุนตามมาตรฐาน NEMA/JIC: สตาร์ตเตอร์ F (เดินหน้า) และ R (ถอยหลัง) สลับ L1 กับ L3 อินเตอร์ล็อกทางกล · แลดเดอร์มี STOP FWD REV อินเตอร์ล็อกปุ่มกดและอินเตอร์ล็อกหน้าสัมผัส NC",
                      "Reversing starter to NEMA/JIC: contactors F (forward) and R (reverse) swapping L1 and L3, mechanically interlocked · ladder with STOP FWD REV, push-button and NC-contact interlocks"), "mc-nema-fr")
    xs, xr = [70, 110, 150], [210, 250, 290]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 60)
    for x, xx, yy in zip(xs, xr, [yb + 44, yb + 30, yb + 16][::-1]):
        pass
    # R is fed by three separate taps (L3 highest, L1 lowest) so the taps never touch
    for x, xx, yy in zip(xs, xr, [yb + 44, yb + 30, yb + 16]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, yb + 60); f.dot(x, yy)
    n_poles(f, xs, yb + 60, "F"); n_poles(f, xr, yb + 60, None)
    f.text(xr[-1] + 26, yb + 86, "R", "xf-tag")
    ym = yb + 60 + 23
    f.line(xs[-1] + 16, ym, xr[0] - 16, ym, "xf-mech")
    f.text((xs[-1] + xr[0]) / 2, ym - 4, "M.I.", "xf-k", "middle")
    yo = yb + 60 + 46
    p_wires(f, xs, yo, yo + 60)
    for xo, xt, yy in zip(xr, [xs[2], xs[1], xs[0]], [yo + 20, yo + 34, yo + 48]):
        f.line(xo, yo, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    n_heaters(f, xs, yo + 60, link="OL")
    ym2 = yo + 60 + 44
    p_wires(f, xs, ym2, ym2 + 36)
    p_motor(f, 110, ym2 + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=30)
    f.text(180, ym2 + 36 + 2 * 58, "MTR", "xf-tag")
    p_pe(f, 30, 44, ym2 + 36 + 58, label="GND")
    f.text(xr[-1] + 20, ym2 - 20, T("R สลับ L1↔L3", "R swaps L1↔L3"), "xf-k")
    xL, xR, yt = 470, 880, 150
    rungs = [NS(NE(n_pb, nc=True, tag="STOP", wn=1),
                NP(NRN(1, NS(NP(NE(n_pb, tag="FWD", wn=2), NE(n_contact, tag="F", wn=2)), NE(n_pb, nc=True, tag="REV", wn=3), NE(n_contact, nc=True, tag="R", wn=4), NE(n_coil, tag="F", R=True, wn=5))),
                   NRN(2, NS(NP(NE(n_pb, tag="REV", wn=2), NE(n_contact, tag="R", wn=2)), NE(n_pb, nc=True, tag="FWD", wn=6), NE(n_contact, nc=True, tag="F", wn=7), NE(n_coil, tag="R", R=True, wn=8)))),
                NE(n_ol, R=True, wn=9))]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    # mechanical interlock between the two coils
    xc = xR - NW - NW / 2
    f.line(xc, ys[0] + 2 * NR + 17 - 3, xc, ys[0] + 2 * NR + 17 - 3, "xf-mech") if False else None
    xcoil = xR - NW - NW / 2
    f.line(xcoil + 26, ys[0] + 20, xcoil + 26, ys[0] + 2 * NR - 20, "xf-mech")
    f.text(xcoil + 32, ys[0] + NR + 4, "M.I.", "xf-k")
    _nema_ctl_note(f, 640, yb2 + 28)
    f.text(450, f.h - 26, T("F และ R ห้ามดูดพร้อมกัน (ลัดวงจร L1–L3): อินเตอร์ล็อก 3 ชั้น = NC ของ F/R ในแลดเดอร์ · ปุ่ม FWD/REV แบบ NC · M.I. อินเตอร์ล็อกทางกล", "F and R must never close together (L1–L3 short circuit): 3 interlocks = NC contacts of F/R · NC halves of FWD/REV · M.I. mechanical interlock"), "xf-m", "middle")
    f.text(450, f.h - 8, T("เลขใต้คอยล์: แลดเดอร์ที่ใช้หน้าสัมผัส (ขีดเส้นใต้ = NC) · M.I. = mechanical interlock", "Numbers under a coil: rungs using its contacts (underlined = NC) · M.I. = mechanical interlock"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(900, 640, T("วงจรกลับทางหมุนตามมาตรฐาน NEMA/JIC: สตาร์ตเตอร์ F (เดินหน้า) และ R (ถอยหลัง) สลับ L1 กับ L3 อินเตอร์ล็อกทางกล · แลดเดอร์มี STOP FWD REV อินเตอร์ล็อกปุ่มกดและอินเตอร์ล็อกหน้าสัมผัส NC",
                      "Reversing starter to NEMA/JIC: contactors F (forward) and R (reverse) swapping L1 and L3, mechanically interlocked · ladder with STOP FWD REV, push-button and NC-contact interlocks"), "mc-nema-fr")
    xs, xr = [70, 110, 150], [210, 250, 290]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 60)
    for x, xx, yy in zip(xs, xr, [yb + 44, yb + 30, yb + 16][::-1]):
        pass
    # R is fed by three separate taps (L3 highest, L1 lowest) so the taps never touch
    for x, xx, yy in zip(xs, xr, [yb + 44, yb + 30, yb + 16]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, yb + 60); f.dot(x, yy)
    n_poles(f, xs, yb + 60, "F"); n_poles(f, xr, yb + 60, None)
    f.text(xr[-1] + 26, yb + 86, "R", "xf-tag")
    ym = yb + 60 + 23
    f.line(xs[-1] + 16, ym, xr[0] - 16, ym, "xf-mech")
    f.text((xs[-1] + xr[0]) / 2, yb + 50, T("ล็อกทางกล", "mech. lock"), "xf-k", "middle")
    yo = yb + 60 + 46
    p_wires(f, xs, yo, yo + 60)
    for xo, xt, yy in zip(xr, [xs[2], xs[1], xs[0]], [yo + 20, yo + 34, yo + 48]):
        f.line(xo, yo, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    n_heaters(f, xs, yo + 60, link="OL")
    ym2 = yo + 60 + 44
    p_wires(f, xs, ym2, ym2 + 36)
    p_motor(f, 110, ym2 + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=30)
    f.text(180, ym2 + 36 + 2 * 58, "MTR", "xf-tag")
    p_pe(f, 30, 44, ym2 + 36 + 58, label="GND")
    f.text(xr[-1] + 20, ym2 - 20, T("R สลับ L1↔L3", "R swaps L1↔L3"), "xf-k")
    xL, xR, yt = 470, 880, 150
    rungs = [NS(NE(n_pb, nc=True, tag="STOP", wn=1),
                NP(NRN(1, NS(NP(NE(n_pb, tag="FWD", wn=2), NE(n_contact, tag="F", wn=2)), NE(n_pb, nc=True, tag="REV", wn=3), NE(n_contact, nc=True, tag="R", wn=4), NE(n_coil, tag="F", R=True, wn=5))),
                   NRN(2, NS(NP(NE(n_pb, tag="REV", wn=2), NE(n_contact, tag="R", wn=2)), NE(n_pb, nc=True, tag="FWD", wn=6), NE(n_contact, nc=True, tag="F", wn=7), NE(n_coil, tag="R", R=True, wn=8)))),
                NE(n_ol, R=True, wn=9))]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    # mechanical interlock between the two coils
    xc = xR - NW - NW / 2
    f.line(xc, ys[0] + 2 * NR + 17 - 3, xc, ys[0] + 2 * NR + 17 - 3, "xf-mech") if False else None
    xcoil = xR - NW - NW / 2
    f.line(xcoil + 26, ys[0] + 20, xcoil + 26, ys[0] + 2 * NR - 20, "xf-mech")
    f.text(xcoil + 32, ys[0] + NR + 4, "M.I.", "xf-k")
    _nema_ctl_note(f, 640, yb2 + 28)
    f.text(450, f.h - 26, T("F และ R ห้ามดูดพร้อมกัน (ลัดวงจร L1–L3): อินเตอร์ล็อก 3 ชั้น = NC ของ F/R ในแลดเดอร์ · ปุ่ม FWD/REV แบบ NC · M.I. อินเตอร์ล็อกทางกล", "F and R must never close together (L1–L3 short circuit): 3 interlocks = NC contacts of F/R · NC halves of FWD/REV · M.I. mechanical interlock"), "xf-m", "middle")
    f.text(450, f.h - 8, T("เลขใต้คอยล์: แลดเดอร์ที่ใช้หน้าสัมผัส (ขีดเส้นใต้ = NC) · M.I. = mechanical interlock", "Numbers under a coil: rungs using its contacts (underlined = NC) · M.I. = mechanical interlock"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(900, 640, T("วงจรกลับทางหมุนตามมาตรฐาน NEMA/JIC: สตาร์ตเตอร์ F (เดินหน้า) และ R (ถอยหลัง) สลับ L1 กับ L3 อินเตอร์ล็อกทางกล · แลดเดอร์มี STOP FWD REV อินเตอร์ล็อกปุ่มกดและอินเตอร์ล็อกหน้าสัมผัส NC",
                      "Reversing starter to NEMA/JIC: contactors F (forward) and R (reverse) swapping L1 and L3, mechanically interlocked · ladder with STOP FWD REV, push-button and NC-contact interlocks"), "mc-nema-fr")
    xs, xr = [70, 110, 150], [210, 250, 290]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 60)
    for x, xx, yy in zip(xs, xr, [yb + 44, yb + 30, yb + 16][::-1]):
        pass
    # R is fed by three separate taps (L3 highest, L1 lowest) so the taps never touch
    for x, xx, yy in zip(xs, xr, [yb + 44, yb + 30, yb + 16]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, yb + 60); f.dot(x, yy)
    n_poles(f, xs, yb + 60, "F"); n_poles(f, xr, yb + 60, None)
    f.text(xr[-1] + 26, yb + 86, "R", "xf-tag")
    ym = yb + 60 + 23
    f.line(xs[-1] + 16, ym, xr[0] - 16, ym, "xf-mech")
    f.text((xs[-1] + xr[0]) / 2, ym + 22, T("ล็อกทางกล", "mech. lock"), "xf-k", "middle")
    yo = yb + 60 + 46
    p_wires(f, xs, yo, yo + 60)
    for xo, xt, yy in zip(xr, [xs[2], xs[1], xs[0]], [yo + 20, yo + 34, yo + 48]):
        f.line(xo, yo, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    n_heaters(f, xs, yo + 60, link="OL")
    ym2 = yo + 60 + 44
    p_wires(f, xs, ym2, ym2 + 36)
    p_motor(f, 110, ym2 + 36, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=30)
    f.text(180, ym2 + 36 + 2 * 58, "MTR", "xf-tag")
    p_pe(f, 30, 44, ym2 + 36 + 58, label="GND")
    f.text(xr[-1] + 20, ym2 - 20, T("R สลับ L1↔L3", "R swaps L1↔L3"), "xf-k")
    xL, xR, yt = 470, 880, 150
    rungs = [NS(NE(n_pb, nc=True, tag="STOP", wn=1),
                NP(NRN(1, NS(NP(NE(n_pb, tag="FWD", wn=2), NE(n_contact, tag="F", wn=2)), NE(n_pb, nc=True, tag="REV", wn=3), NE(n_contact, nc=True, tag="R", wn=4), NE(n_coil, tag="F", R=True, wn=5))),
                   NRN(2, NS(NP(NE(n_pb, tag="REV", wn=2), NE(n_contact, tag="R", wn=2)), NE(n_pb, nc=True, tag="FWD", wn=6), NE(n_contact, nc=True, tag="F", wn=7), NE(n_coil, tag="R", R=True, wn=8)))),
                NE(n_ol, R=True, wn=9))]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    # mechanical interlock between the two coils
    xc = xR - NW - NW / 2
    f.line(xc, ys[0] + 2 * NR + 17 - 3, xc, ys[0] + 2 * NR + 17 - 3, "xf-mech") if False else None
    xcoil = xR - NW - NW / 2
    f.line(xcoil + 26, ys[0] + 20, xcoil + 26, ys[0] + 2 * NR - 20, "xf-mech")
    f.text(xcoil + 32, ys[0] + NR + 4, "M.I.", "xf-k")
    _nema_ctl_note(f, 640, yb2 + 28)
    f.text(450, f.h - 26, T("F และ R ห้ามดูดพร้อมกัน (ลัดวงจร L1–L3): อินเตอร์ล็อก 3 ชั้น = NC ของ F/R ในแลดเดอร์ · ปุ่ม FWD/REV แบบ NC · M.I. อินเตอร์ล็อกทางกล", "F and R must never close together (L1–L3 short circuit): 3 interlocks = NC contacts of F/R · NC halves of FWD/REV · M.I. mechanical interlock"), "xf-m", "middle")
    f.text(450, f.h - 8, T("เลขใต้คอยล์: แลดเดอร์ที่ใช้หน้าสัมผัส (ขีดเส้นใต้ = NC) · M.I. = mechanical interlock", "Numbers under a coil: rungs using its contacts (underlined = NC) · M.I. = mechanical interlock"), "xf-k", "middle")
    return f.svg()


@fig("mc-nema-yd")
def _():
    f = F(900, 720, T("วงจรสตาร์-เดลต้า (wye-delta) แบบเปิดวงจรตามมาตรฐาน NEMA: 1M (ไลน์) 2M (เดลต้า) 1S (สตาร์ ลัดปลาย T4 T5 T6) ไทเมอร์ TR · ขั้วมอเตอร์ T1–T6 (T1–T6 · T2–T4 · T3–T5 เมื่อต่อเดลต้า)",
                      "Open-transition wye–delta starter to NEMA: 1M (line), 2M (delta), 1S (wye, shorting T4 T5 T6), timer TR · motor leads T1–T6 (T1–T6 · T2–T4 · T3–T5 in delta)"), "mc-nema-yd")
    xs, xd = [70, 110, 150], [240, 280, 320]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 56)
    n_poles(f, xs, yb + 56, "1M")
    y1 = yb + 56 + 46
    p_wires(f, xs, y1, y1 + 70)
    # 2M (delta) tapped after 1M, three separate wires (L3 highest)
    for x, xx, yy in zip(xs, xd, [y1 + 38, y1 + 24, y1 + 10]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, y1 + 52); f.dot(x, yy)
    n_heaters(f, xs, y1 + 70, link="OL")
    n_poles(f, xd, y1 + 52, None)
    f.text(xd[-1] + 26, y1 + 78, "2M", "xf-tag")
    ym = y1 + 70 + 44
    p_wires(f, xs, ym, ym + 30)
    xc, r = 110, 58
    mt = ym + 30
    p_motor(f, xc, mt, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=30)
    f.text(xc + r - 12, mt + 2 * r + 4, "MTR", "xf-tag") if False else f.text(xc + r + 8, mt + 20, "MTR", "xf-tag")
    yc = mt + r
    bot = []
    for x, l in zip(xs, ["T6", "T4", "T5"]):
        yy = yc + math.sqrt(max(r * r - (x - xc) ** 2, 0))
        f.circ(x, yy, 3.2, "xf-term"); f.text(x + (-6 if x < xc else 6), yy + (14 if x == xc else 12), l, "xf-k", "end" if x < xc else None)
        bot.append(yy)
    yo = y1 + 52 + 46
    for xo, xt, yy in zip(xd, xs, [mt + 2 * r + 24, mt + 2 * r + 38, mt + 2 * r + 52]):
        f.line(xo, yo, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    ys_ = mt + 2 * r + 76
    for x, b in zip(xs, bot):
        f.line(x, b, x, ys_)
    n_poles(f, xs, ys_, None)
    f.text(xs[-1] + 26, ys_ + 28, "1S", "xf-tag")
    f.line(xs[0], ys_ + 46 + 16, xs[-1], ys_ + 46 + 16)
    for x in xs:
        f.line(x, ys_ + 46, x, ys_ + 46 + 16)
    f.dot(xs[1], ys_ + 46 + 16)
    p_pe(f, 30, 44, mt + r, label="GND")
    xL, xR, yt = 470, 880, 150
    rungs = [NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="1M", wn=2)),
                       NP(NE(n_coil, tag="TR", R=True, wn=3),
                          NRN(2, NS(NE(n_contact, nc=True, tag="TR", note="NCTO", wn=3), NE(n_contact, nc=True, tag="2M", wn=4), NE(n_coil, tag="1S", R=True, wn=5))),
                          NRN(3, NS(NP(NE(n_contact, tag="1S", wn=3), NE(n_contact, tag="1M", wn=3)), NE(n_coil, tag="1M", R=True, wn=6))),
                          NRN(4, NS(NE(n_contact, tag="TR", note="NOTC", wn=3), NE(n_contact, nc=True, tag="1S", wn=7), NE(n_coil, tag="2M", R=True, wn=8)))),
                       NE(n_ol, R=True, wn=9)))]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    _nema_ctl_note(f, 650, yb2 + 28)
    f.text(450, f.h - 44, T("เริ่ม: 1S (wye) + 1M · ครบเวลา TR: 1S ปล่อย แล้ว 2M (delta) ดูด · 1S กับ 2M ห้ามดูดพร้อมกัน", "Start: 1S (wye) + 1M · after TR times out: 1S drops, then 2M (delta) picks up · 1S and 2M must never close together"), "xf-m", "middle")
    f.text(450, f.h - 26, T("NCTO = NC timed-open (หน่วงเปิด) · NOTC = NO timed-closed (หน่วงปิด) · ชื่อ 1M/2M/1S ต่างกันตามผู้ผลิต — ดูแบบของเครื่อง", "NCTO = NC timed-open · NOTC = NO timed-closed · contactor names 1M/2M/1S vary by maker — follow the machine drawing"), "xf-k", "middle")
    f.text(450, f.h - 8, T("คู่ขั้วเดลต้า: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2)", "Delta pairs: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2)"), "xf-k", "middle")
    return f.svg()


def s_npole(f, x, y):
    f.line(x, y, x, y + 21); f.line(x, y + 31, x, y + 52)
    f.line(x - 10, y + 21, x + 10, y + 21); f.line(x - 10, y + 31, x + 10, y + 31)


def s_nheat(f, x, y):
    f.line(x, y, x, y + 10); f.line(x, y + 42, x, y + 52)
    f.path(f"M {f1(x)} {f1(y + 10)} l 6 4 l -12 8 l 12 8 l -12 8 l 6 4", "xf-ln")


def s_ndisc(f, x, y):
    f.line(x, y, x, y + 12); f.line(x, y + 12, x, y + 14)
    f.line(x, y + 22, x - 11, y + 8); f.circ(x, y + 8, 2.2, "xf-dotk")
    f.line(x, y + 22, x, y + 26)
    f.rect(x - 6, y + 26, 12, 20, "xf-box", 1); f.line(x, y + 46, x, y + 52)


def _():
    f = F(900, 720, T("วงจรสตาร์-เดลต้า (wye-delta) แบบเปิดวงจรตามมาตรฐาน NEMA: 1M (ไลน์) 2M (เดลต้า) 1S (สตาร์ ลัดปลาย T4 T5 T6) ไทเมอร์ TR · ขั้วมอเตอร์ T1–T6 (T1–T6 · T2–T4 · T3–T5 เมื่อต่อเดลต้า)",
                      "Open-transition wye–delta starter to NEMA: 1M (line), 2M (delta), 1S (wye, shorting T4 T5 T6), timer TR · motor leads T1–T6 (T1–T6 · T2–T4 · T3–T5 in delta)"), "mc-nema-yd")
    xs, xd = [70, 110, 150], [240, 280, 320]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 56)
    n_poles(f, xs, yb + 56, "1M")
    y1 = yb + 56 + 46
    p_wires(f, xs, y1, y1 + 70)
    # 2M (delta) tapped after 1M, three separate wires (L3 highest)
    for x, xx, yy in zip(xs, xd, [y1 + 38, y1 + 24, y1 + 10]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, y1 + 52); f.dot(x, yy)
    n_heaters(f, xs, y1 + 70, link="OL")
    n_poles(f, xd, y1 + 52, None)
    f.text(xd[-1] + 26, y1 + 78, "2M", "xf-tag")
    ym = y1 + 70 + 44
    p_wires(f, xs, ym, ym + 30)
    xc, r = 110, 58
    mt = ym + 30
    p_motor(f, xc, mt, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=30)
    f.text(xc + r - 12, mt + 2 * r + 4, "MTR", "xf-tag") if False else f.text(xc + r + 8, mt + 20, "MTR", "xf-tag")
    yc = mt + r
    bot = []
    for x, l in zip(xs, ["T6", "T4", "T5"]):
        yy = yc + math.sqrt(max(r * r - (x - xc) ** 2, 0))
        f.circ(x, yy, 3.2, "xf-term"); f.text(x + (-6 if x < xc else 6), yy + (14 if x == xc else 12), l, "xf-k", "end" if x < xc else None)
        bot.append(yy)
    yo = y1 + 52 + 46
    for xo, xt, yy in zip(xd, xs, [mt + 2 * r + 24, mt + 2 * r + 38, mt + 2 * r + 52]):
        f.line(xo, yo, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    ys_ = mt + 2 * r + 76
    for x, b in zip(xs, bot):
        f.line(x, b, x, ys_)
    n_poles(f, xs, ys_, None)
    f.text(xs[-1] + 26, ys_ + 28, "1S", "xf-tag")
    f.line(xs[0], ys_ + 46 + 16, xs[-1], ys_ + 46 + 16)
    for x in xs:
        f.line(x, ys_ + 46, x, ys_ + 46 + 16)
    f.dot(xs[1], ys_ + 46 + 16)
    p_pe(f, 30, 44, mt + r, label="GND")
    xL, xR, yt = 470, 880, 150
    rungs = [NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="1M", wn=2)),
                       NP(NE(n_coil, tag="TR", R=True, wn=3),
                          NRN(2, NS(NE(n_contact, nc=True, tag="TR", note="NCTO", wn=3), NE(n_contact, nc=True, tag="2M", wn=4), NE(n_coil, tag="1S", R=True, wn=5))),
                          NRN(3, NS(NP(NE(n_contact, tag="1S", wn=3), NE(n_contact, tag="1M", wn=3)), NE(n_coil, tag="1M", R=True, wn=6))),
                          NRN(4, NS(NE(n_contact, tag="TR", note="NOTC", wn=3), NE(n_contact, nc=True, tag="1S", wn=7), NE(n_coil, tag="2M", R=True, wn=8)))),
                       NE(n_ol, R=True, wn=9)))]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    _nema_ctl_note(f, 650, yb2 + 28)
    f.text(450, f.h - 44, T("เริ่ม: 1S (wye) + 1M · ครบเวลา TR: 1S ปล่อย แล้ว 2M (delta) ดูด · 1S กับ 2M ห้ามดูดพร้อมกัน", "Start: 1S (wye) + 1M · after TR times out: 1S drops, then 2M (delta) picks up · 1S and 2M must never close together"), "xf-m", "middle")
    f.text(450, f.h - 26, T("NCTO = NC timed-open (หน่วงเปิด) · NOTC = NO timed-closed (หน่วงปิด) · ชื่อ 1M/2M/1S ต่างกันตามผู้ผลิต — ดูแบบของเครื่อง", "NCTO = NC timed-open · NOTC = NO timed-closed · contactor names 1M/2M/1S vary by maker — follow the machine drawing"), "xf-k", "middle")
    f.text(450, f.h - 8, T("คู่ขั้วเดลต้า: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2)", "Delta pairs: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2)"), "xf-k", "middle")
    return f.svg()


def s_npole(f, x, y):
    f.line(x, y, x, y + 21); f.line(x, y + 31, x, y + 52)
    f.line(x - 10, y + 21, x + 10, y + 21); f.line(x - 10, y + 31, x + 10, y + 31)


def s_nheat(f, x, y):
    f.line(x, y, x, y + 10); f.line(x, y + 42, x, y + 52)
    f.path(f"M {f1(x)} {f1(y + 10)} l 6 4 l -12 8 l 12 8 l -12 8 l 6 4", "xf-ln")


def s_ndisc(f, x, y):
    f.line(x, y, x, y + 12); f.line(x, y + 12, x, y + 14)
    f.line(x, y + 22, x - 11, y + 8); f.circ(x, y + 8, 2.2, "xf-dotk")
    f.line(x, y + 22, x, y + 26)
    f.rect(x - 6, y + 26, 12, 20, "xf-box", 1); f.line(x, y + 46, x, y + 52)


def _():
    f = F(900, 720, T("วงจรสตาร์-เดลต้า (wye-delta) แบบเปิดวงจรตามมาตรฐาน NEMA: 1M (ไลน์) 2M (เดลต้า) 1S (สตาร์ ลัดปลาย T4 T5 T6) ไทเมอร์ TR · ขั้วมอเตอร์ T1–T6 (T1–T6 · T2–T4 · T3–T5 เมื่อต่อเดลต้า)",
                      "Open-transition wye–delta starter to NEMA: 1M (line), 2M (delta), 1S (wye, shorting T4 T5 T6), timer TR · motor leads T1–T6 (T1–T6 · T2–T4 · T3–T5 in delta)"), "mc-nema-yd")
    xs, xd = [70, 110, 150], [240, 280, 320]
    yb = _nema_power_head(f, xs)
    p_wires(f, xs, yb, yb + 56)
    n_poles(f, xs, yb + 56, "1M")
    y1 = yb + 56 + 46
    p_wires(f, xs, y1, y1 + 70)
    # 2M (delta) tapped after 1M, three separate wires (L3 highest)
    for x, xx, yy in zip(xs, xd, [y1 + 38, y1 + 24, y1 + 10]):
        f.line(x, yy, xx, yy); f.line(xx, yy, xx, y1 + 52); f.dot(x, yy)
    n_heaters(f, xs, y1 + 70, link="OL")
    n_poles(f, xd, y1 + 52, None)
    f.text(xd[-1] + 26, y1 + 78, "2M", "xf-tag")
    ym = y1 + 70 + 44
    p_wires(f, xs, ym, ym + 30)
    xc, r = 110, 58
    mt = ym + 30
    p_motor(f, xc, mt, 40, labels=("T1", "T2", "T3"), tag=None, xs=xs, pe_x=30)
    f.text(xc - r - 34, mt + 24, "MTR", "xf-tag")
    yc = mt + r
    bot = []
    for x, l in zip(xs, ["T6", "T4", "T5"]):
        yy = yc + math.sqrt(max(r * r - (x - xc) ** 2, 0))
        f.circ(x, yy, 3.2, "xf-term"); f.text(x + (-6 if x < xc else 6), yy + (14 if x == xc else 12), l, "xf-k", "end" if x < xc else None)
        bot.append(yy)
    yo = y1 + 52 + 46
    for xo, xt, yy in zip(xd, xs, [mt + 2 * r + 24, mt + 2 * r + 38, mt + 2 * r + 52]):
        f.line(xo, yo, xo, yy); f.line(xo, yy, xt, yy); f.dot(xt, yy)
    ys_ = mt + 2 * r + 76
    for x, b in zip(xs, bot):
        f.line(x, b, x, ys_)
    n_poles(f, xs, ys_, None)
    f.text(xs[-1] + 26, ys_ + 28, "1S", "xf-tag")
    f.line(xs[0], ys_ + 46 + 16, xs[-1], ys_ + 46 + 16)
    for x in xs:
        f.line(x, ys_ + 46, x, ys_ + 46 + 16)
    f.dot(xs[1], ys_ + 46 + 16)
    p_pe(f, 30, 44, mt + r, label="GND")
    xL, xR, yt = 470, 880, 150
    rungs = [NRN(1, NS(NE(n_pb, nc=True, tag="STOP", wn=1), NP(NE(n_pb, tag="START", wn=2), NE(n_contact, tag="1M", wn=2)),
                       NP(NE(n_coil, tag="TR", R=True, wn=3),
                          NRN(2, NS(NE(n_contact, nc=True, tag="TR", note="NCTO", wn=3), NE(n_contact, nc=True, tag="2M", wn=4), NE(n_coil, tag="1S", R=True, wn=5))),
                          NRN(3, NS(NP(NE(n_contact, tag="1S", wn=3), NE(n_contact, tag="1M", wn=3)), NE(n_coil, tag="1M", R=True, wn=6))),
                          NRN(4, NS(NE(n_contact, tag="TR", note="NOTC", wn=3), NE(n_contact, nc=True, tag="1S", wn=7), NE(n_coil, tag="2M", R=True, wn=8)))),
                       NE(n_ol, R=True, wn=9)))]
    yb2, ys = nema_ladder(f, rungs, xL, xR, yt, "X1", "X2")
    _nema_ctl_note(f, 650, yb2 + 28)
    f.text(450, f.h - 44, T("เริ่ม: 1S (wye) + 1M · ครบเวลา TR: 1S ปล่อย แล้ว 2M (delta) ดูด · 1S กับ 2M ห้ามดูดพร้อมกัน", "Start: 1S (wye) + 1M · after TR times out: 1S drops, then 2M (delta) picks up · 1S and 2M must never close together"), "xf-m", "middle")
    f.text(450, f.h - 26, T("NCTO = NC timed-open (หน่วงเปิด) · NOTC = NO timed-closed (หน่วงปิด) · ชื่อ 1M/2M/1S ต่างกันตามผู้ผลิต — ดูแบบของเครื่อง", "NCTO = NC timed-open · NOTC = NO timed-closed · contactor names 1M/2M/1S vary by maker — follow the machine drawing"), "xf-k", "middle")
    f.text(450, f.h - 8, T("คู่ขั้วเดลต้า: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2)", "Delta pairs: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2)"), "xf-k", "middle")
    return f.svg()


def s_npole(f, x, y):
    f.line(x, y, x, y + 21); f.line(x, y + 31, x, y + 52)
    f.line(x - 10, y + 21, x + 10, y + 21); f.line(x - 10, y + 31, x + 10, y + 31)


def s_nheat(f, x, y):
    f.line(x, y, x, y + 10); f.line(x, y + 42, x, y + 52)
    f.path(f"M {f1(x)} {f1(y + 10)} l 6 4 l -12 8 l 12 8 l -12 8 l 6 4", "xf-ln")


def s_ndisc(f, x, y):
    f.line(x, y, x, y + 12); f.line(x, y + 12, x, y + 14)
    f.line(x, y + 22, x - 11, y + 8); f.circ(x, y + 8, 2.2, "xf-dotk")
    f.line(x, y + 22, x, y + 26)
    f.rect(x - 6, y + 26, 12, 20, "xf-box", 1); f.line(x, y + 46, x, y + 52)


@fig("mc-nema-symbols")
def _():
    f = F(780, 450, T("สัญลักษณ์ NEMA/JIC (ANSI Y32.2, NEMA ICS 19) ที่ใช้ในแลดเดอร์ควบคุมและวงจรกำลังของมอเตอร์ พร้อมรหัสอุปกรณ์ M CR TR OL PB FU",
                      "NEMA/JIC symbols (ANSI Y32.2, NEMA ICS 19) for motor ladder and power circuits with device codes M CR TR OL PB FU"), "mc-nema-symbols")
    cw, rh = 128, 128
    ctl = [
        (lambda x, y: n_contact(f, x - 42, y + 30, 84), T("หน้าสัมผัส NO", "NO contact"), "M · CR"),
        (lambda x, y: n_contact(f, x - 42, y + 30, 84, nc=True), T("หน้าสัมผัส NC", "NC contact"), "M · CR"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84), T("ปุ่มกด NO", "Push-button NO"), "START"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84, nc=True), T("ปุ่มกด NC", "Push-button NC"), "STOP"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84, nc=True, estop=True), T("ปุ่มฉุกเฉิน (หัวเห็ด)", "E-stop (mushroom)"), "E-STOP"),
        (lambda x, y: n_ol(f, x - 42, y + 30, 84), T("หน้าสัมผัสโอเวอร์โหลด NC", "Overload contact NC"), "OL"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="M"), T("คอยล์สตาร์ตเตอร์", "Starter coil"), "M"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="CR"), T("คอยล์รีเลย์ควบคุม", "Control-relay coil"), "CR"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="TR"), T("คอยล์ไทเมอร์", "Timer coil"), "TR"),
        (lambda x, y: n_contact(f, x - 42, y + 30, 84, note="NOTC"), T("หน้าสัมผัสไทเมอร์", "Timer contact"), "TR · NOTC/NCTO"),
        (lambda x, y: n_lamp(f, x - 42, y + 30, 84, tag="G"), T("ไฟแสดง (ตัวอักษรบอกสี)", "Pilot light (letter = colour)"), "G · R · A · W"),
        (lambda x, y: n_fuse(f, x - 42, y + 30, 84, tag=None), T("ฟิวส์", "Fuse"), "FU"),
    ]
    pw = [
        (lambda x, y: s_motor(f, x, y), T("มอเตอร์ 3 เฟส", "3-phase motor"), "MTR · T1 T2 T3"),
        (lambda x, y: s_nheat(f, x, y), T("ฮีตเตอร์โอเวอร์โหลด", "Overload heater"), "OL"),
        (lambda x, y: s_npole(f, x, y), T("ขั้วกำลังสตาร์ตเตอร์", "Starter power pole"), "M · L1 → T1"),
        (lambda x, y: s_ndisc(f, x, y), T("ดิสคอนเนกต์ + ฟิวส์", "Disconnect + fuse"), "DISC · FU"),
        (lambda x, y: n_xfmr(f, x - 20, y - 6, 52, tag=""), T("หม้อแปลงควบคุม", "Control transformer"), "CT · H1 H4 / X1 X2"),
        (lambda x, y: s_earth(f, x, y), T("กราวด์", "Ground"), "GND"),
    ]
    for i, (fn, lab, tag) in enumerate(ctl):
        col, row = i % 6, i // 6
        x, y = 66 + col * cw, 14 + row * rh
        fn(x, y)
        f.text(x, y + 82, lab, "xf-k", "middle"); f.text(x, y + 98, tag, "xf-tagk", "middle")
    for i, (fn, lab, tag) in enumerate(pw):
        x, y = 66 + i * cw, 14 + 2 * rh + 6
        fn(x, y)
        f.text(x, y + 82, lab, "xf-k", "middle"); f.text(x, y + 98, tag, "xf-tagk", "middle")
    f.text(390, 424, T("ทุกสัญลักษณ์วาดในสภาพไม่มีไฟ ไม่ถูกกด · วงจรกำลัง: L1 L2 L3 → T1 T2 T3 · วงจรควบคุม: เลขสายบนเส้น เลขแลดเดอร์ใต้คอยล์", "Drawn de-energised and unactuated · power: L1 L2 L3 → T1 T2 T3 · control: wire numbers on the lines, rung numbers under coils"), "xf-k", "middle")
    f.text(390, 442, T("ลูกศรของหน้าสัมผัสหน่วงเวลาต่างกันตามแบบ/ผู้ผลิต จึงระบุชนิดด้วย NOTC · NCTO · NOTO · NCTC", "Timer-contact arrows differ between legends, so the type is stated: NOTC · NCTO · NOTO · NCTC"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(780, 450, T("สัญลักษณ์ NEMA/JIC (ANSI Y32.2, NEMA ICS 19) ที่ใช้ในแลดเดอร์ควบคุมและวงจรกำลังของมอเตอร์ พร้อมรหัสอุปกรณ์ M CR TR OL PB FU",
                      "NEMA/JIC symbols (ANSI Y32.2, NEMA ICS 19) for motor ladder and power circuits with device codes M CR TR OL PB FU"), "mc-nema-symbols")
    cw, rh = 128, 128
    ctl = [
        (lambda x, y: n_contact(f, x - 42, y + 30, 84), T("หน้าสัมผัส NO", "NO contact"), "M · CR"),
        (lambda x, y: n_contact(f, x - 42, y + 30, 84, nc=True), T("หน้าสัมผัส NC", "NC contact"), "M · CR"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84), T("ปุ่มกด NO", "Push-button NO"), "START"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84, nc=True), T("ปุ่มกด NC", "Push-button NC"), "STOP"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84, nc=True, estop=True), T("ปุ่มฉุกเฉิน (หัวเห็ด)", "E-stop (mushroom)"), "E-STOP"),
        (lambda x, y: n_ol(f, x - 42, y + 30, 84), T("หน้าสัมผัสโอเวอร์โหลด NC", "Overload contact NC"), "OL"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="M"), T("คอยล์สตาร์ตเตอร์", "Starter coil"), "M"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="CR"), T("คอยล์รีเลย์ควบคุม", "Control-relay coil"), "CR"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="TR"), T("คอยล์ไทเมอร์", "Timer coil"), "TR"),
        (lambda x, y: n_contact(f, x - 42, y + 30, 84, note="NOTC"), T("หน้าสัมผัสไทเมอร์", "Timer contact"), "TR · NOTC/NCTO"),
        (lambda x, y: n_lamp(f, x - 42, y + 30, 84, tag="G"), T("ไฟแสดง (ตัวอักษรบอกสี)", "Pilot light (letter = colour)"), "G · R · A · W"),
        (lambda x, y: n_fuse(f, x - 42, y + 30, 84, tag=None), T("ฟิวส์", "Fuse"), "FU"),
    ]
    pw = [
        (lambda x, y: s_motor(f, x, y), T("มอเตอร์ 3 เฟส", "3-phase motor"), "MTR · T1 T2 T3"),
        (lambda x, y: s_nheat(f, x, y), T("ฮีตเตอร์โอเวอร์โหลด", "Overload heater"), "OL"),
        (lambda x, y: s_npole(f, x, y), T("ขั้วกำลังสตาร์ตเตอร์", "Starter power pole"), "M · L1 → T1"),
        (lambda x, y: s_ndisc(f, x, y), T("ดิสคอนเนกต์ + ฟิวส์", "Disconnect + fuse"), "DISC · FU"),
        (lambda x, y: n_xfmr(f, x - 20, y - 6, 52, tag=""), T("หม้อแปลงควบคุม", "Control transformer"), "CT · H1 H4 / X1 X2"),
        (lambda x, y: s_earth(f, x, y), T("กราวด์", "Ground"), "GND"),
    ]
    for i, (fn, lab, tag) in enumerate(ctl):
        col, row = i % 6, i // 6
        x, y = 66 + col * cw, 14 + row * rh
        fn(x, y)
        f.text(x, y + 82, lab, "xf-k", "middle"); f.text(x, y + 98, tag, "xf-tagk", "middle")
    for i, (fn, lab, tag) in enumerate(pw):
        x, y = 66 + i * cw, 14 + 2 * rh + 6
        fn(x, y)
        f.text(x, y + 82, lab, "xf-k", "middle"); f.text(x, y + 98, tag, "xf-tagk", "middle")
    f.text(390, 424, T("ทุกสัญลักษณ์วาดในสภาพไม่มีไฟ ไม่ถูกกด · วงจรกำลัง: L1 L2 L3 → T1 T2 T3 · วงจรควบคุม: เลขสายบนเส้น เลขแลดเดอร์ใต้คอยล์", "Drawn de-energised and unactuated · power: L1 L2 L3 → T1 T2 T3 · control: wire numbers on the lines, rung numbers under coils"), "xf-k", "middle")
    f.text(390, 442, T("ลูกศรของหน้าสัมผัสหน่วงเวลาต่างกันตามแบบ/ผู้ผลิต จึงระบุชนิดด้วย NOTC · NCTO · NOTO · NCTC", "Timer-contact arrows differ between legends, so the type is stated: NOTC · NCTO · NOTO · NCTC"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(780, 450, T("สัญลักษณ์ NEMA/JIC (ANSI Y32.2, NEMA ICS 19) ที่ใช้ในแลดเดอร์ควบคุมและวงจรกำลังของมอเตอร์ พร้อมรหัสอุปกรณ์ M CR TR OL PB FU",
                      "NEMA/JIC symbols (ANSI Y32.2, NEMA ICS 19) for motor ladder and power circuits with device codes M CR TR OL PB FU"), "mc-nema-symbols")
    cw, rh = 128, 128
    ctl = [
        (lambda x, y: n_contact(f, x - 42, y + 30, 84), T("หน้าสัมผัส NO", "NO contact"), "M · CR"),
        (lambda x, y: n_contact(f, x - 42, y + 30, 84, nc=True), T("หน้าสัมผัส NC", "NC contact"), "M · CR"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84), T("ปุ่มกด NO", "Push-button NO"), "START"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84, nc=True), T("ปุ่มกด NC", "Push-button NC"), "STOP"),
        (lambda x, y: n_pb(f, x - 42, y + 36, 84, nc=True, estop=True), T("ปุ่มฉุกเฉิน (หัวเห็ด)", "E-stop (mushroom)"), "E-STOP"),
        (lambda x, y: n_ol(f, x - 42, y + 30, 84), T("หน้าสัมผัสโอเวอร์โหลด NC", "Overload contact NC"), "OL"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="M"), T("คอยล์สตาร์ตเตอร์", "Starter coil"), "M"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="CR"), T("คอยล์รีเลย์ควบคุม", "Control-relay coil"), "CR"),
        (lambda x, y: n_coil(f, x - 42, y + 30, 84, tag="TR"), T("คอยล์ไทเมอร์", "Timer coil"), "TR"),
        (lambda x, y: n_contact(f, x - 42, y + 30, 84, note="NOTC"), T("หน้าสัมผัสไทเมอร์", "Timer contact"), "TR · NOTC/NCTO"),
        (lambda x, y: n_lamp(f, x - 42, y + 30, 84, tag="G"), T("ไฟแสดง (ตัวอักษรบอกสี)", "Pilot light (letter = colour)"), "G · R · A · W"),
        (lambda x, y: n_fuse(f, x - 42, y + 30, 84, tag=None), T("ฟิวส์", "Fuse"), "FU"),
    ]
    pw = [
        (lambda x, y: s_motor(f, x, y), T("มอเตอร์ 3 เฟส", "3-phase motor"), "MTR · T1 T2 T3"),
        (lambda x, y: s_nheat(f, x, y), T("ฮีตเตอร์โอเวอร์โหลด", "Overload heater"), "OL"),
        (lambda x, y: s_npole(f, x, y), T("ขั้วกำลังสตาร์ตเตอร์", "Starter power pole"), "M · L1 → T1"),
        (lambda x, y: s_ndisc(f, x, y), T("ดิสคอนเนกต์ + ฟิวส์", "Disconnect + fuse"), "DISC · FU"),
        (lambda x, y: n_xfmr(f, x - 20, y - 6, 52, tag=""), T("หม้อแปลงควบคุม", "Control transformer"), "CT · H1 H4 / X1 X2"),
        (lambda x, y: s_earth(f, x, y), T("กราวด์", "Ground"), "GND"),
    ]
    for i, (fn, lab, tag) in enumerate(ctl):
        col, row = i % 6, i // 6
        x, y = 66 + col * cw, 14 + row * rh
        fn(x, y)
        f.text(x, y + 82, lab, "xf-k", "middle"); f.text(x, y + 98, tag, "xf-tagk", "middle")
    for i, (fn, lab, tag) in enumerate(pw):
        x, y = 66 + i * cw, 14 + 2 * rh + 6
        fn(x, y)
        f.text(x, y + 82, lab, "xf-k", "middle"); f.text(x, y + 98, tag, "xf-tagk", "middle")
    f.text(390, 424, T("ทุกสัญลักษณ์วาดในสภาพไม่มีไฟ ไม่ถูกกด · วงจรกำลัง: L1 L2 L3 → T1 T2 T3 · วงจรควบคุม: เลขสายบนเส้น เลขแลดเดอร์ใต้คอยล์", "Drawn de-energised and unactuated · power: L1 L2 L3 → T1 T2 T3 · control: wire numbers on the lines, rung numbers under coils"), "xf-k", "middle")
    f.text(390, 442, T("ลูกศรของหน้าสัมผัสหน่วงเวลาต่างกันตามแบบ/ผู้ผลิต จึงระบุชนิดด้วย NOTC · NCTO · NOTO · NCTC", "Timer-contact arrows differ between legends, so the type is stated: NOTC · NCTO · NOTO · NCTC"), "xf-k", "middle")
    return f.svg()


def sl_mark3(f, x, y):
    for i in (-1, 0, 1):
        f.line(x - 5, y + i * 5 + 3, x + 5, y + i * 5 - 3)


def sl_cb(f, x, y, h=44):
    """Circuit-breaker (IEC 60617): switch with a cross on the contact end."""
    a, b = y + 14, y + h - 12
    f.line(x, y, x, a); f.line(x, b, x, y + h)
    f.line(x, b, x - 11, a - 1)
    f.line(x - 4, a - 4, x + 4, a + 4); f.line(x - 4, a + 4, x + 4, a - 4)


def sl_k(f, x, y, h=44):
    a, b = y + 14, y + h - 12
    f.line(x, y, x, a); f.line(x, b, x, y + h)
    f.line(x, b, x - 11, a - 1)
    f.path(f"M {f1(x - 3)} {f1(a)} A 3 3 0 0 0 {f1(x + 3)} {f1(a)}", "xf-ln")


def sl_iso(f, x, y, h=44):
    a, b = y + 14, y + h - 12
    f.line(x, y, x, a); f.line(x, b, x, y + h)
    f.line(x, b, x - 11, a - 1)
    f.line(x - 6, a, x + 6, a)


def sl_fuse(f, x, y, h=36):
    f.rect(x - 5, y + 8, 10, h - 16, "xf-box", 1)
    f.line(x, y, x, y + h)


def sl_therm(f, x, y, h=40):
    f.line(x, y, x, y + 8); f.line(x, y + h - 8, x, y + h)
    f.rect(x - 7, y + 8, 14, h - 16, "xf-box", 1)
    f.path(f"M {f1(x)} {f1(y + 8)} l 0 5 l -4 0 l 0 5 l 8 0 l 0 5 l -4 0 l 0 {f1(h - 34)}", "xf-thin")


def sl_motor(f, x, y, r=22, txt="M"):
    f.line(x, y, x, y + 4)
    f.circ(x, y + r + 4, r, "xf-motor")
    f.text(x, y + r + 4, txt, "xf-h", "middle"); f.text(x, y + r + 18, "3~", "xf-k", "middle")


def sl_ct(f, x, y):
    f.circ(x, y, 7, "xf-box")


def sl_amm(f, x, y, label="A"):
    f.circ(x, y, 11, "xf-box"); f.text(x, y + 4, label, "xf-k", "middle")


def sl_box(f, x, y, w, h, label=None, diag=False, cls="xf-boxa"):
    f.rect(x - w / 2, y, w, h, cls, 3)
    if diag:
        f.line(x - w / 2, y + h, x + w / 2, y, "xf-thin")
        f.text(x - w / 2 + 12, y + 14, "3~", "xf-k", "middle"); f.text(x + w / 2 - 12, y + h - 6, "3~", "xf-k", "middle")
    if label:
        f.text(x, y + h / 2 + 4, label, "xf-h", "middle")


def sl_xfmr(f, x, y, r=19, d=28):
    """Two-winding transformer: two overlapping circles (IEC 60617). Returns the y of its lower end."""
    f.circ(x, y + r, r, "xf-box"); f.circ(x, y + r + d, r, "xf-box")
    return y + 2 * r + d


def sl_bus(f, x1, x2, y):
    f.line(x1, y, x2, y, "xf-bus")


@fig("mc-sld-iec")
def _():
    f = F(860, 760, T("ไดอะแกรมเส้นเดียว (single-line) ระบบไฟฟ้าโรงงานจ่ายมอเตอร์ตามสัญลักษณ์ IEC 60617: หม้อแปลง 22/0.4 kV → ACB → บัส MDB → ฟีดเดอร์มอเตอร์ DOL, ซอฟต์สตาร์ตเตอร์ และอินเวอร์เตอร์",
                      "Single-line diagram of a plant motor supply to IEC 60617: 22/0.4 kV transformer → ACB → MDB busbar → DOL, soft-starter and VFD motor feeders"), "mc-sld-iec")
    xm = 430
    T3 = lambda a, b: T(a, b)
    f.text(xm, 22, T("ระบบจำหน่าย 22 kV · 3~ 50 Hz", "22 kV distribution · 3~ 50 Hz"), "xf-k", "middle")
    f.line(xm, 30, xm, 70); sl_mark3(f, xm, 50)
    sl_iso(f, xm, 70, 52); f.text(xm + 16, 98, T("-Q10 สวิตช์ตัดต่อ (LBS)", "-Q10 load-break switch"), "xf-k")
    f.line(xm, 122, xm, 122)
    sl_fuse(f, xm, 122, 40); f.text(xm + 16, 146, T("-F10 ฟิวส์ HV", "-F10 HV fuse"), "xf-k")
    f.line(xm, 162, xm, 192)
    yb = sl_xfmr(f, xm, 192)
    sl_delta(f, xm, 209); sl_wye(f, xm, 243); f.line(xm, 243, xm, 250); 
    f.text(xm + 32, 218, T("-T1 หม้อแปลง 1000 kVA", "-T1 transformer 1000 kVA"), "xf-k"); f.text(xm + 32, 234, "22 / 0.4 kV · Dyn11 · uk 6 %", "xf-k")
    f.line(xm, 250, xm - 38, 250); f.line(xm - 38, 250, xm - 38, 268); p_earth(f, xm - 38, 268)
    f.text(xm - 46, 262, T("นิวทรัลต่อดิน", "neutral earthed"), "xf-k", "end"); f.text(xm - 46, 276, "(TN-S)", "xf-k", "end")
    f.line(xm, yb, xm, 284); sl_mark3(f, xm, 272)
    sl_cb(f, xm, 284, 44); f.text(xm + 16, 312, T("-Q0 ACB 1600 A (Icu 50 kA)", "-Q0 ACB 1600 A (Icu 50 kA)"), "xf-k")
    f.line(xm, 328, xm, 392)
    sl_ct(f, xm, 352); f.line(xm + 7, 352, xm + 56, 352, "xf-thin"); sl_amm(f, xm + 67, 352); f.text(xm + 86, 356, T("CT 1600/5 A · A", "CT 1600/5 A · A"), "xf-k")
    sl_bus(f, 60, 810, 392)
    f.text(64, 380, T("บัสบาร์ MDB/MCC 400/230 V · 3N~ 50 Hz", "MDB/MCC busbar 400/230 V · 3N~ 50 Hz"), "xf-m")
    xs = [150, 430, 710]
    for x in xs:
        f.line(x, 392, x, 408)
    # feeder 1: DOL
    x = xs[0]
    sl_cb(f, x, 408, 44); f.text(x + 16, 436, T("-Q1 MPCB 16 A", "-Q1 MPCB 16 A"), "xf-k")
    f.line(x, 452, x, 470)
    sl_k(f, x, 470, 44); f.text(x + 16, 498, T("-K1 คอนแทกเตอร์ AC-3", "-K1 AC-3 contactor"), "xf-k")
    f.line(x, 514, x, 528)
    sl_therm(f, x, 528, 40); f.text(x + 16, 552, T("-F2 โอเวอร์โหลด Ir 14 A", "-F2 overload Ir 14 A"), "xf-k")
    f.line(x, 568, x, 604); sl_mark3(f, x, 586); f.text(x + 16, 590, T("-W1 สาย 4G2.5 mm²", "-W1 cable 4G2.5 mm²"), "xf-k")
    sl_motor(f, x, 604); f.text(x, 676, "-M1", "xf-tag", "middle"); f.text(x, 692, "7.5 kW · 14 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทตรง (DOL)", "direct-on-line"), "xf-k", "middle")
    # feeder 2: soft starter
    x = xs[1]
    sl_cb(f, x, 408, 44); f.text(x + 16, 436, T("-Q2 MCCB 125 A", "-Q2 MCCB 125 A"), "xf-k")
    f.line(x, 452, x, 480)
    sl_box(f, x, 480, 76, 52, "U2", diag=False); f.text(x + 46, 500, T("ซอฟต์สตาร์ตเตอร์", "soft starter"), "xf-k"); f.text(x + 46, 516, T("+ คอนแทกเตอร์บายพาส", "+ bypass contactor"), "xf-k")
    f.line(x, 532, x, 604); sl_mark3(f, x, 570); f.text(x + 16, 566, T("-W2 สาย 4G35 mm²", "-W2 cable 4G35 mm²"), "xf-k")
    sl_motor(f, x, 604); f.text(x, 676, "-M2", "xf-tag", "middle"); f.text(x, 692, "55 kW · 96 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทนุ่มนวล", "soft start"), "xf-k", "middle")
    # feeder 3: VFD
    x = xs[2]
    sl_cb(f, x, 408, 44); f.text(x + 16, 436, T("-Q3 MCCB 63 A", "-Q3 MCCB 63 A"), "xf-k")
    f.line(x, 452, x, 480)
    sl_box(f, x, 480, 76, 52, None, diag=True, cls="xf-boxb"); f.text(x + 46, 500, T("-U3 อินเวอร์เตอร์", "-U3 VFD"), "xf-k"); f.text(x + 46, 516, "22 kW · 45 A", "xf-k")
    f.line(x, 532, x, 604); sl_mark3(f, x, 570); f.text(x + 16, 566, T("-W3 สาย 4G10 มีชีลด์", "-W3 shielded 4G10"), "xf-k")
    sl_motor(f, x, 604); f.text(x, 676, "-M3", "xf-tag", "middle"); f.text(x, 692, "22 kW · 41 A", "xf-k", "middle"); f.text(x, 708, T("ปรับความเร็วได้", "variable speed"), "xf-k", "middle")
    f.text(430, 742, T("เส้นเดียว = 3 เฟส (ขีดเฉียง 3 ขีด = 3 ตัวนำ) · ไม่แสดงวงจรควบคุม · แสดงชนิดอุปกรณ์ พิกัด สาย และการต่อดิน", "One line = three phases (three strokes = three conductors) · control circuits not shown · device type, ratings, cables and earthing are"), "xf-m", "middle") if False else f.text(430, 742, T("เส้นเดียว = 3 เฟส (ขีดเฉียง 3 ขีด = 3 ตัวนำ) · ไม่แสดงวงจรควบคุม แสดงชนิดอุปกรณ์ พิกัด สายและการต่อดิน", "One line = three phases (three strokes = three conductors) · control circuits omitted; shows device types, ratings, cables, earthing"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(860, 760, T("ไดอะแกรมเส้นเดียว (single-line) ระบบไฟฟ้าโรงงานจ่ายมอเตอร์ตามสัญลักษณ์ IEC 60617: หม้อแปลง 22/0.4 kV → ACB → บัส MDB → ฟีดเดอร์มอเตอร์ DOL, ซอฟต์สตาร์ตเตอร์ และอินเวอร์เตอร์",
                      "Single-line diagram of a plant motor supply to IEC 60617: 22/0.4 kV transformer → ACB → MDB busbar → DOL, soft-starter and VFD motor feeders"), "mc-sld-iec")
    xm = 430
    T3 = lambda a, b: T(a, b)
    f.text(xm, 22, T("ระบบจำหน่าย 22 kV · 3~ 50 Hz", "22 kV distribution · 3~ 50 Hz"), "xf-k", "middle")
    f.line(xm, 30, xm, 70); sl_mark3(f, xm, 50)
    sl_iso(f, xm, 70, 52); f.text(xm + 16, 98, T("-Q10 สวิตช์ตัดต่อ (LBS)", "-Q10 load-break switch"), "xf-k")
    f.line(xm, 122, xm, 122)
    sl_fuse(f, xm, 122, 40); f.text(xm + 16, 146, T("-F10 ฟิวส์ HV", "-F10 HV fuse"), "xf-k")
    f.line(xm, 162, xm, 192)
    yb = sl_xfmr(f, xm, 192)
    f.text(xm, 217, "Δ", "xf-k", "middle"); f.text(xm - 3, 241, "Y", "xf-k", "middle"); f.text(xm + 7, 237, "n", "xf-k")
    f.text(xm + 32, 214, T("-T1 หม้อแปลง 1000 kVA", "-T1 transformer 1000 kVA"), "xf-k"); f.text(xm + 32, 230, "22 / 0.4 kV · Dyn11 · uk 6 %", "xf-k")
    f.line(xm - 19, 241, xm - 52, 241); f.line(xm - 52, 241, xm - 52, 258); p_earth(f, xm - 52, 258)
    f.text(xm - 60, 232, T("จุดนิวทรัลต่อดิน", "neutral earthed"), "xf-k", "end"); f.text(xm - 60, 246, "(TN-S)", "xf-k", "end")
    f.line(xm, yb, xm, 284); sl_mark3(f, xm, 272)
    sl_cb(f, xm, 284, 44); f.text(xm + 16, 312, T("-Q0 ACB 1600 A (Icu 50 kA)", "-Q0 ACB 1600 A (Icu 50 kA)"), "xf-k")
    f.line(xm, 328, xm, 392)
    sl_ct(f, xm, 352); f.line(xm + 7, 352, xm + 56, 352, "xf-thin"); sl_amm(f, xm + 67, 352); f.text(xm + 86, 356, T("CT 1600/5 A · A", "CT 1600/5 A · A"), "xf-k")
    sl_bus(f, 60, 810, 392)
    f.text(64, 380, T("บัสบาร์ MDB/MCC 400/230 V · 3N~ 50 Hz", "MDB/MCC busbar 400/230 V · 3N~ 50 Hz"), "xf-m")
    xs = [150, 430, 710]
    for x in xs:
        f.line(x, 392, x, 408)
    # feeder 1: DOL
    x = xs[0]
    sl_cb(f, x, 408, 44); f.text(x + 16, 436, T("-Q1 MPCB 16 A", "-Q1 MPCB 16 A"), "xf-k")
    f.line(x, 452, x, 470)
    sl_k(f, x, 470, 44); f.text(x + 16, 498, T("-K1 คอนแทกเตอร์ AC-3", "-K1 AC-3 contactor"), "xf-k")
    f.line(x, 514, x, 528)
    sl_therm(f, x, 528, 40); f.text(x + 16, 552, T("-F2 โอเวอร์โหลด Ir 14 A", "-F2 overload Ir 14 A"), "xf-k")
    f.line(x, 568, x, 604); sl_mark3(f, x, 586); f.text(x + 16, 590, T("-W1 สาย 4G2.5 mm²", "-W1 cable 4G2.5 mm²"), "xf-k")
    sl_motor(f, x, 604); f.text(x, 676, "-M1", "xf-tag", "middle"); f.text(x, 692, "7.5 kW · 14 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทตรง (DOL)", "direct-on-line"), "xf-k", "middle")
    # feeder 2: soft starter
    x = xs[1]
    sl_cb(f, x, 408, 44); f.text(x + 16, 436, T("-Q2 MCCB 125 A", "-Q2 MCCB 125 A"), "xf-k")
    f.line(x, 452, x, 480)
    sl_box(f, x, 480, 76, 52, "U2", diag=False); f.text(x + 46, 500, T("ซอฟต์สตาร์ตเตอร์", "soft starter"), "xf-k"); f.text(x + 46, 516, T("+ คอนแทกเตอร์บายพาส", "+ bypass contactor"), "xf-k")
    f.line(x, 532, x, 604); sl_mark3(f, x, 570); f.text(x + 16, 566, T("-W2 สาย 4G35 mm²", "-W2 cable 4G35 mm²"), "xf-k")
    sl_motor(f, x, 604); f.text(x, 676, "-M2", "xf-tag", "middle"); f.text(x, 692, "55 kW · 96 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทนุ่มนวล", "soft start"), "xf-k", "middle")
    # feeder 3: VFD
    x = xs[2]
    sl_cb(f, x, 408, 44); f.text(x + 16, 436, T("-Q3 MCCB 63 A", "-Q3 MCCB 63 A"), "xf-k")
    f.line(x, 452, x, 480)
    sl_box(f, x, 480, 76, 52, None, diag=True, cls="xf-boxb"); f.text(x + 46, 500, T("-U3 อินเวอร์เตอร์", "-U3 VFD"), "xf-k"); f.text(x + 46, 516, "22 kW · 45 A", "xf-k")
    f.line(x, 532, x, 604); sl_mark3(f, x, 570); f.text(x + 16, 566, T("-W3 สาย 4G10 มีชีลด์", "-W3 shielded 4G10"), "xf-k")
    sl_motor(f, x, 604); f.text(x, 676, "-M3", "xf-tag", "middle"); f.text(x, 692, "22 kW · 41 A", "xf-k", "middle"); f.text(x, 708, T("ปรับความเร็วได้", "variable speed"), "xf-k", "middle")
    f.text(430, 742, T("เส้นเดียว = 3 เฟส (ขีดเฉียง 3 ขีด = 3 ตัวนำ) · ไม่แสดงวงจรควบคุม · แสดงชนิดอุปกรณ์ พิกัด สาย และการต่อดิน", "One line = three phases (three strokes = three conductors) · control circuits not shown · device type, ratings, cables and earthing are"), "xf-m", "middle") if False else f.text(430, 742, T("เส้นเดียว = 3 เฟส (ขีดเฉียง 3 ขีด = 3 ตัวนำ) · ไม่แสดงวงจรควบคุม แสดงชนิดอุปกรณ์ พิกัด สายและการต่อดิน", "One line = three phases (three strokes = three conductors) · control circuits omitted; shows device types, ratings, cables, earthing"), "xf-k", "middle")
    return f.svg()


@fig("mc-sld-nema")
def _():
    f = F(860, 760, T("ไดอะแกรมเส้นเดียวแบบอเมริกา (ANSI/IEEE 315 · NEMA) ระบบ 13.8 kV → 480Y/277 V 60 Hz: เมนเบรกเกอร์ 52 บัส MCC สตาร์ตเตอร์ NEMA ขนาด 1 ซอฟต์สตาร์ตเตอร์ และ VFD",
                      "American one-line diagram (ANSI/IEEE 315 · NEMA) for a 13.8 kV → 480Y/277 V 60 Hz system: main breaker 52, MCC bus, NEMA size 1 combination starter, solid-state starter and VFD"), "mc-sld-nema")
    xm = 430
    f.text(xm, 22, T("ระบบสาธารณูปโภค 13.8 kV · 3Φ 60 Hz", "Utility 13.8 kV · 3Φ 60 Hz"), "xf-k", "middle")
    f.line(xm, 30, xm, 70); sl_mark3(f, xm, 50)
    # fused switch: blade + fuse
    f.line(xm, 70, xm, 84); f.line(xm, 106, xm, 112)
    f.line(xm, 106, xm - 11, 83); f.circ(xm, 84, 2.2, "xf-dotk")
    sl_fuse(f, xm, 112, 40); f.text(xm + 16, 98, T("สวิตช์ฟิวส์ HV", "HV fused switch"), "xf-k")
    f.line(xm, 152, xm, 192)
    # transformer: two circles with the winding connection inside (delta / grounded wye)
    r = 20
    yt = sl_xfmr(f, xm, 192, r, 28)
    sl_delta(f, xm, 192 + r - 2); sl_wye(f, xm, 192 + r + 28 + 2)
    f.text(xm + 34, 214, T("T1 · 1000 kVA", "T1 · 1000 kVA"), "xf-k"); f.text(xm + 34, 230, "13.8 kV Δ – 480Y/277 V", "xf-k"); f.text(xm + 34, 246, "Z = 5.75 %", "xf-k")
    f.line(xm, 192 + r + 28 + 2, xm - 40, 192 + r + 28 + 2) if False else None
    f.line(xm - 20, 192 + r + 28, xm - 46, 192 + r + 28); f.line(xm - 46, 192 + r + 28, xm - 46, 270); p_earth(f, xm - 46, 270)
    f.text(xm - 54, 262, T("นิวทรัลต่อดิน", "grounded neutral"), "xf-k", "end")
    yb = yt
    f.line(xm, yb, xm, 296); sl_mark3(f, xm, 280)
    # main breaker: ANSI one-line breaker = a box on the line; device number 52
    f.rect(xm - 10, 296, 20, 20, "xf-box", 1); f.line(xm, 316, xm, 392)
    f.text(xm + 18, 310, "52 · CB-1", "xf-tagk"); f.text(xm + 18, 326, T("เมนเบรกเกอร์ 1200 A", "main breaker 1200 A"), "xf-k")
    sl_ct(f, xm, 352); f.line(xm + 7, 352, xm + 56, 352, "xf-thin"); sl_amm(f, xm + 67, 352); f.text(xm + 86, 356, "CT · A", "xf-k")
    sl_bus(f, 60, 810, 392)
    f.text(64, 380, T("บัส MCC 480Y/277 V · 3Φ 4W 60 Hz", "MCC bus 480Y/277 V · 3Φ 4W 60 Hz"), "xf-m")
    xs = [150, 430, 710]
    for x in xs:
        f.line(x, 392, x, 408)
    # feeder 1: combination starter, NEMA size 1
    x = xs[0]
    f.line(x, 408, x, 420); f.line(x, 442, x, 450); f.line(x, 442, x - 11, 419); f.circ(x, 420, 2.2, "xf-dotk")
    sl_fuse(f, x, 450, 36); f.text(x + 16, 432, T("ดิสคอนเนกต์ 30 A", "30 A disconnect"), "xf-k"); f.text(x + 16, 470, T("ฟิวส์หน่วงเวลา", "time-delay fuses"), "xf-k")
    f.line(x, 486, x, 504)
    f.rect(x - 14, 504, 28, 28, "xf-boxa", 2); f.text(x, 523, "M", "xf-h", "middle"); f.text(x + 22, 518, T("สตาร์ตเตอร์ NEMA ขนาด 1", "NEMA size 1 starter"), "xf-k")
    f.line(x, 532, x, 550); sl_therm(f, x, 550, 36); f.text(x + 16, 572, T("OL (49) คลาส 10", "OL (49) class 10"), "xf-k")
    f.line(x, 586, x, 604); sl_mark3(f, x, 596)
    sl_motor(f, x, 604); f.text(x, 676, "MTR-1", "xf-tag", "middle"); f.text(x, 692, "10 hp · 14 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทตรง (FVNR)", "full-voltage (FVNR)"), "xf-k", "middle")
    # feeder 2: solid-state reduced-voltage starter
    x = xs[1]
    f.rect(x - 10, 408, 20, 20, "xf-box", 1); f.line(x, 428, x, 452); f.text(x + 18, 422, T("เบรกเกอร์ 125 A", "125 A breaker"), "xf-k")
    sl_box(f, x, 452, 76, 52, "SSRV"); f.text(x + 46, 472, T("ซอฟต์สตาร์ตเตอร์", "solid-state starter"), "xf-k"); f.text(x + 46, 488, T("+ บายพาส (M)", "+ bypass (M)"), "xf-k")
    f.line(x, 504, x, 604); sl_mark3(f, x, 560)
    sl_motor(f, x, 604); f.text(x, 676, "MTR-2", "xf-tag", "middle"); f.text(x, 692, "50 hp · 65 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทนุ่มนวล", "soft start"), "xf-k", "middle")
    # feeder 3: VFD
    x = xs[2]
    f.rect(x - 10, 408, 20, 20, "xf-box", 1); f.line(x, 428, x, 452); f.text(x + 18, 422, T("เบรกเกอร์ 60 A", "60 A breaker"), "xf-k")
    sl_box(f, x, 452, 76, 52, None, diag=True, cls="xf-boxb"); f.text(x + 46, 472, "VFD", "xf-k"); f.text(x + 46, 488, "25 hp · 34 A", "xf-k")
    f.line(x, 504, x, 604); sl_mark3(f, x, 560)
    sl_motor(f, x, 604); f.text(x, 676, "MTR-3", "xf-tag", "middle"); f.text(x, 692, "25 hp · 34 A", "xf-k", "middle"); f.text(x, 708, T("ปรับความเร็วได้", "variable speed"), "xf-k", "middle")
    f.text(430, 742, T("ตัวเลข 52 · 49 = รหัสอุปกรณ์ ANSI/IEEE C37.2 (เบรกเกอร์ · โอเวอร์โหลดความร้อน) · กระแส FLA จาก NEC Table 430.250 (460 V)", "52 · 49 = ANSI/IEEE C37.2 device numbers (breaker · thermal overload) · FLA from NEC Table 430.250 (460 V)"), "xf-k", "middle")
    return f.svg()


def _():
    f = F(860, 760, T("ไดอะแกรมเส้นเดียวแบบอเมริกา (ANSI/IEEE 315 · NEMA) ระบบ 13.8 kV → 480Y/277 V 60 Hz: เมนเบรกเกอร์ 52 บัส MCC สตาร์ตเตอร์ NEMA ขนาด 1 ซอฟต์สตาร์ตเตอร์ และ VFD",
                      "American one-line diagram (ANSI/IEEE 315 · NEMA) for a 13.8 kV → 480Y/277 V 60 Hz system: main breaker 52, MCC bus, NEMA size 1 combination starter, solid-state starter and VFD"), "mc-sld-nema")
    xm = 430
    f.text(xm, 22, T("ระบบสาธารณูปโภค 13.8 kV · 3Φ 60 Hz", "Utility 13.8 kV · 3Φ 60 Hz"), "xf-k", "middle")
    f.line(xm, 30, xm, 70); sl_mark3(f, xm, 50)
    # fused switch: blade + fuse
    f.line(xm, 70, xm, 84); f.line(xm, 106, xm, 112)
    f.line(xm, 106, xm - 11, 83); f.circ(xm, 84, 2.2, "xf-dotk")
    sl_fuse(f, xm, 112, 40); f.text(xm + 16, 98, T("สวิตช์ฟิวส์ HV", "HV fused switch"), "xf-k")
    f.line(xm, 152, xm, 192)
    # transformer: two circles with the winding connection inside (delta / grounded wye)
    r = 20
    f.circ(xm, 192 + r, r, "xf-box"); f.circ(xm, 192 + r + 26, r, "xf-box")
    f.path(f"M {f1(xm)} {f1(192 + r - 8)} L {f1(xm - 8)} {f1(192 + r + 6)} L {f1(xm + 8)} {f1(192 + r + 6)} Z", "xf-ln")
    yy = 192 + r + 26
    f.line(xm, yy, xm, yy - 8); f.line(xm, yy, xm - 7, yy + 6); f.line(xm, yy, xm + 7, yy + 6)
    f.text(xm + 34, 214, T("T1 · 1000 kVA", "T1 · 1000 kVA"), "xf-k"); f.text(xm + 34, 230, "13.8 kV Δ – 480Y/277 V", "xf-k"); f.text(xm + 34, 246, "Z = 5.75 %", "xf-k")
    f.line(xm + 20, yy + 4, xm + 52, yy + 4); f.line(xm + 52, yy + 4, xm + 52, yy + 22); p_earth(f, xm + 52, yy + 22)
    yb = 192 + 2 * r + 26
    f.line(xm, yb, xm, 296); sl_mark3(f, xm, 280)
    # main breaker: ANSI one-line breaker = a box on the line; device number 52
    f.rect(xm - 10, 296, 20, 20, "xf-box", 1); f.line(xm, 316, xm, 392)
    f.text(xm + 18, 310, "52 · CB-1", "xf-tagk"); f.text(xm + 18, 326, T("เมนเบรกเกอร์ 1200 A", "main breaker 1200 A"), "xf-k")
    sl_ct(f, xm, 352); f.line(xm + 7, 352, xm + 56, 352, "xf-thin"); sl_amm(f, xm + 67, 352); f.text(xm + 86, 356, "CT · A", "xf-k")
    sl_bus(f, 60, 810, 392)
    f.text(64, 380, T("บัส MCC 480Y/277 V · 3Φ 4W 60 Hz", "MCC bus 480Y/277 V · 3Φ 4W 60 Hz"), "xf-m")
    xs = [150, 430, 710]
    for x in xs:
        f.line(x, 392, x, 408)
    # feeder 1: combination starter, NEMA size 1
    x = xs[0]
    f.line(x, 408, x, 420); f.line(x, 442, x, 450); f.line(x, 442, x - 11, 419); f.circ(x, 420, 2.2, "xf-dotk")
    sl_fuse(f, x, 450, 36); f.text(x + 16, 432, T("ดิสคอนเนกต์ 30 A", "30 A disconnect"), "xf-k"); f.text(x + 16, 470, T("ฟิวส์หน่วงเวลา", "time-delay fuses"), "xf-k")
    f.line(x, 486, x, 504)
    f.rect(x - 14, 504, 28, 28, "xf-boxa", 2); f.text(x, 523, "M", "xf-h", "middle"); f.text(x + 22, 518, T("สตาร์ตเตอร์ NEMA ขนาด 1", "NEMA size 1 starter"), "xf-k")
    f.line(x, 532, x, 550); sl_therm(f, x, 550, 36); f.text(x + 16, 572, T("OL (49) คลาส 10", "OL (49) class 10"), "xf-k")
    f.line(x, 586, x, 604); sl_mark3(f, x, 596)
    sl_motor(f, x, 604); f.text(x, 676, "MTR-1", "xf-tag", "middle"); f.text(x, 692, "10 hp · 14 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทตรง (FVNR)", "full-voltage (FVNR)"), "xf-k", "middle")
    # feeder 2: solid-state reduced-voltage starter
    x = xs[1]
    f.rect(x - 10, 408, 20, 20, "xf-box", 1); f.line(x, 428, x, 452); f.text(x + 18, 422, T("เบรกเกอร์ 125 A", "125 A breaker"), "xf-k")
    sl_box(f, x, 452, 76, 52, "SSRV"); f.text(x + 46, 472, T("ซอฟต์สตาร์ตเตอร์", "solid-state starter"), "xf-k"); f.text(x + 46, 488, T("+ บายพาส (M)", "+ bypass (M)"), "xf-k")
    f.line(x, 504, x, 604); sl_mark3(f, x, 560)
    sl_motor(f, x, 604); f.text(x, 676, "MTR-2", "xf-tag", "middle"); f.text(x, 692, "50 hp · 65 A", "xf-k", "middle"); f.text(x, 708, T("สตาร์ทนุ่มนวล", "soft start"), "xf-k", "middle")
    # feeder 3: VFD
    x = xs[2]
    f.rect(x - 10, 408, 20, 20, "xf-box", 1); f.line(x, 428, x, 452); f.text(x + 18, 422, T("เบรกเกอร์ 60 A", "60 A breaker"), "xf-k")
    sl_box(f, x, 452, 76, 52, None, diag=True, cls="xf-boxb"); f.text(x + 46, 472, "VFD", "xf-k"); f.text(x + 46, 488, "25 hp · 34 A", "xf-k")
    f.line(x, 504, x, 604); sl_mark3(f, x, 560)
    sl_motor(f, x, 604); f.text(x, 676, "MTR-3", "xf-tag", "middle"); f.text(x, 692, "25 hp · 34 A", "xf-k", "middle"); f.text(x, 708, T("ปรับความเร็วได้", "variable speed"), "xf-k", "middle")
    f.text(430, 742, T("ตัวเลข 52 · 49 = รหัสอุปกรณ์ ANSI/IEEE C37.2 (เบรกเกอร์ · โอเวอร์โหลดความร้อน) · กระแส FLA จาก NEC Table 430.250 (460 V)", "52 · 49 = ANSI/IEEE C37.2 device numbers (breaker · thermal overload) · FLA from NEC Table 430.250 (460 V)"), "xf-k", "middle")
    return f.svg()


def sl_delta(f, x, y, s=8):
    f.path(f"M {f1(x)} {f1(y - s)} L {f1(x - s)} {f1(y + s * 0.7)} L {f1(x + s)} {f1(y + s * 0.7)} Z", "xf-ln")


def sl_wye(f, x, y, s=8):
    f.line(x, y, x, y - s); f.line(x, y, x - s * 0.87, y + s * 0.5); f.line(x, y, x + s * 0.87, y + s * 0.5)


# --------------------------------------------------------------------------- runner
def render(key):
    if key.endswith("-en") and key[:-3] in FIGS:
        LANG[0] = "en"
        try:
            return FIGS[key[:-3]]()
        finally:
            LANG[0] = "th"
    if key in FIGS:
        return FIGS[key]()
    return None


def main():
    force = "--all" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")] or sorted(glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True))
    total, cache, missing = 0, {}, set()
    for fpath in files:
        src = open(fpath, encoding="utf-8").read()

        def rep(m):
            key, body = m.group(1), m.group(2)
            base = key[:-3] if key.endswith("-en") else key
            if not (base.startswith("mc-") or base.startswith("plc-")):
                return m.group(0)
            if base not in FIGS:
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
        print("unknown mc/plc keys:", ", ".join(sorted(missing)))
    print(total, "file(s) updated")


if __name__ == "__main__":
    if "--list" in sys.argv:
        print("\n".join(sorted(FIGS)))
    elif "--preview" in sys.argv:
        # write every figure (th + en) into one HTML file for visual checking
        css = open(os.path.join(ROOT, "assets/site.css"), encoding="utf-8").read()
        out = ['<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../assets/site.css"><body class="mc" style="padding:20px;background:var(--paper)">']
        for k in sorted(FIGS):
            for kk in (k, k + "-en"):
                out.append(f'<h3 style="font:14px monospace">{kk}</h3><figure class="xfig" style="max-width:820px">{render(kk)}</figure>')
        open(sys.argv[sys.argv.index("--preview") + 1], "w", encoding="utf-8").write("".join(out))
    else:
        main()
