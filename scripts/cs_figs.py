# Computed SVG figures for the control-systems lessons (root loci, Bode, Nyquist, step responses, block diagrams).
# Usage: python3 scripts/cs_figs.py   (rewrites every <!--FIG:key-->…<!--/FIG--> in src/pages/learn/control-systems/*.html)
# Styling comes from the ".csfig" classes in assets/site.css, so figures follow the light/dark theme.
import glob, math, os, re, sys
import numpy as np

FIGS = {}


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def f1(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def mono(s):
    return s.replace("-", "−")


class Svg:
    def __init__(self, w, h, label, key):
        self.w, self.h, self.label, self.key = w, h, label, key
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def svg(self):
        lab = self.label.replace('"', "&quot;")
        defs = (f'<defs><marker id="{self.key}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
                f'<path class="arh" d="M0 0L10 5L0 10z"/></marker>'
                f'<clipPath id="{self.key}-c"><rect x="0" y="0" width="{self.w}" height="{self.h}"/></clipPath></defs>')
        return f'<svg viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}">' + defs + "".join(self.parts) + "</svg>"

    def path(self, d, cls, extra=""):
        self.add(f'<path class="{cls}" d="{d}"{extra}/>')

    def text(self, x, y, s, cls="lb", anchor=None):
        a = f' text-anchor="{anchor}"' if anchor else ""
        self.add(f'<text class="{cls}" x="{f1(x)}" y="{f1(y)}"{a}>{s}</text>')

    def arrow(self, pts, cls="wire"):
        d = "M" + "L".join(f"{f1(x)} {f1(y)}" for x, y in pts)
        self.add(f'<path class="{cls}" d="{d}" marker-end="url(#{self.key}-a)"/>')


class Frame:
    def __init__(self, x, y, w, h, x0, x1, y0, y1, logx=False):
        self.x, self.y, self.w, self.h = x, y, w, h
        self.x0, self.x1, self.y0, self.y1, self.logx = x0, x1, y0, y1, logx

    def X(self, v):
        if self.logx:
            return self.x + (math.log10(v) - math.log10(self.x0)) / (math.log10(self.x1) - math.log10(self.x0)) * self.w
        return self.x + (v - self.x0) / (self.x1 - self.x0) * self.w

    def Y(self, v):
        return self.y + self.h - (v - self.y0) / (self.y1 - self.y0) * self.h

    def inside(self, xv, yv, pad=0):
        X, Y = self.X(xv), self.Y(yv)
        return self.x - pad <= X <= self.x + self.w + pad and self.y - pad <= Y <= self.y + self.h + pad


def nice_ticks(a, b, n=6):
    raw = (b - a) / n
    mag = 10 ** math.floor(math.log10(raw))
    r = raw / mag
    st = (1 if r < 1.5 else 2 if r < 3 else 5 if r < 7 else 10) * mag
    t, v = [], math.ceil(a / st - 1e-9) * st
    while v <= b + 1e-9:
        t.append(round(v / st) * st)
        v += st
    return t, st


def tl(v, st):
    d = max(0, -math.floor(math.log10(st) + 1e-9))
    s = f"{v:.{d}f}"
    if float(s) == 0:
        s = "0"
    return mono(s)


def poly_path(F, pts, clip=True):
    d, pen = "", False
    for xv, yv in pts:
        if not (np.isfinite(xv) and np.isfinite(yv)):
            pen = False
            continue
        X, Y = F.X(xv), F.Y(yv)
        if clip and (Y < F.y - 60 or Y > F.y + F.h + 60 or X < F.x - 60 or X > F.x + F.w + 60):
            pen = False
            continue
        d += ("L" if pen else "M") + f"{f1(X)} {f1(Y)}"
        pen = True
    return d


def grid(S, F, xl="σ", yl="jω", jlabel=True, nx=8, ny=6):
    S.add(f'<rect class="thin" x="{f1(F.x)}" y="{f1(F.y)}" width="{f1(F.w)}" height="{f1(F.h)}"/>')
    tx, sx = nice_ticks(F.x0, F.x1, nx)
    ty, sy = nice_ticks(F.y0, F.y1, ny)
    g = ""
    for v in tx:
        g += f"M{f1(F.X(v))} {f1(F.y)}V{f1(F.y + F.h)}"
        S.text(F.X(v), F.y + F.h + 15, tl(v, sx), "tk", "middle")
    for v in ty:
        g += f"M{f1(F.x)} {f1(F.Y(v))}H{f1(F.x + F.w)}"
        if abs(v) > sy / 2 or not jlabel:
            S.text(F.x - 5, F.Y(v) + 4, tl(v, sy) + ("j" if jlabel else ""), "tk", "end")
    S.path(g, "gr")
    if F.y0 < 0 < F.y1:
        S.path(f"M{f1(F.x)} {f1(F.Y(0))}H{f1(F.x + F.w)}", "ax")
    if F.x0 < 0 < F.x1:
        S.path(f"M{f1(F.X(0))} {f1(F.y)}V{f1(F.y + F.h)}", "ax")
    S.text(F.x + F.w - 4, F.Y(0) - 6 if F.y0 < 0 < F.y1 else F.y + F.h - 6, xl, "lb", "end")
    S.text(F.X(0) + 6 if F.x0 < 0 < F.x1 else F.x + 6, F.y + 14, yl, "lb")


def mark_pole(S, F, p):
    X, Y = F.X(p.real), F.Y(p.imag)
    S.path(f"M{f1(X - 6)} {f1(Y - 6)}l12 12m0-12l-12 12", "px")


def mark_zero(S, F, z):
    S.add(f'<circle class="zo" cx="{f1(F.X(z.real))}" cy="{f1(F.Y(z.imag))}" r="6"/>')


# ------------------------------------------------------------------ root locus
def locus_branches(num, den, kmax=None, n=500):
    """root-locus branches with adaptive gain steps so that branches are matched correctly near break points"""
    num, den = np.trim_zeros(np.array(num, float), "f"), np.trim_zeros(np.array(den, float), "f")
    nump = np.concatenate([np.zeros(len(den) - len(num)), num])
    p0 = np.roots(den)
    allr = list(p0) + (list(np.roots(num)) if len(num) > 1 else [])
    scale = max([abs(r) for r in allr] + [1])
    kmax = kmax or 1e6 * scale ** (len(den) - len(num))
    grid_k = np.concatenate([[0], np.logspace(-6, math.log10(kmax), n)])
    tol = scale * 0.01

    def rts(k):
        return np.roots(np.polyadd(den, k * nump))

    def match(prev, r):
        new = [None] * len(prev)
        pairs = sorted((abs(r[j] - prev[i]), i, j) for i in range(len(prev)) for j in range(len(r)))
        di, dj = set(), set()
        for d, i, j in pairs:
            if i in di or j in dj:
                continue
            new[i] = r[j]
            di.add(i)
            dj.add(j)
        return np.array(new)

    prev = np.array(sorted(p0, key=lambda z: (z.real, z.imag)))
    br = [[r] for r in prev]
    ks = [0.0]

    def step(k0, k1, prev, depth=0):
        cur = match(prev, rts(k1))
        if depth < 7 and np.max(np.abs(cur - prev)) > tol and (k1 - k0) > 1e-9 * k1:
            km = (k0 + k1) / 2 if k0 == 0 or k1 / max(k0, 1e-300) < 1.01 else math.sqrt(k0 * k1)
            mid = step(k0, km, prev, depth + 1)
            return step(km, k1, mid, depth + 1)
        for i in range(len(cur)):
            br[i].append(cur[i])
        ks.append(k1)
        return cur

    for k0, k1 in zip(grid_k[:-1], grid_k[1:]):
        prev = step(k0, k1, prev)
    return [np.array(b) for b in br], np.array(ks)


def rl_window(pts, aspect):
    xs = [p[0] for p in pts]
    ys = [abs(p[1]) for p in pts]
    x0, x1, y1 = min(xs), max(xs), max(ys)
    span = max(x1 - x0, 2 * y1, 1e-6)
    pad = span * 0.25
    x0 -= pad
    x1 += pad
    y1 = max(y1 + pad, span * 0.4)
    w, h = x1 - x0, 2 * y1
    # equal scaling
    if w / h > aspect:
        h = w / aspect
    else:
        w = h * aspect
    cx = (x0 + x1) / 2
    return cx - w / 2, cx + w / 2, -h / 2, h / 2


def rlfig(key, num, den, label, W=560, H=380, kmax=None, window=None, notes=(), asym=True, breaks=(), cross=(), kmarks=(), zeta=None):
    S = Svg(W, H, label, key)
    br, ks = locus_branches(num, den, kmax)
    P = np.roots(den)
    Z = np.roots(num) if len(np.trim_zeros(np.array(num, float), "f")) > 1 else []
    n, m = len(P), len(Z)
    cen = (sum(P).real - (sum(Z).real if m else 0)) / (n - m) if n > m else None
    pts = [(p.real, p.imag) for p in list(P) + list(Z)] + [(0, 0)] + [(b, 0) for b in breaks] + [(0, w) for w in cross]
    if cen is not None and n - m >= 2:
        pts.append((cen, 0))
    ml, mt, mr, mb = 40, 12, 12, 26
    pw, ph = W - ml - mr, H - mt - mb
    x0, x1, y0, y1 = window or rl_window(pts, pw / ph)
    F = Frame(ml, mt, pw, ph, x0, x1, y0, y1)
    grid(S, F)
    S.add(f'<g clip-path="url(#{key}-cp)"><clipPath id="{key}-cp"><rect x="{F.x}" y="{F.y}" width="{F.w}" height="{F.h}"/></clipPath>')
    if zeta:
        for z in zeta:
            th = math.acos(z)
            L = (x1 - x0) * 3
            S.path(f"M{f1(F.X(0))} {f1(F.Y(0))}L{f1(F.X(-L * math.cos(th)))} {f1(F.Y(L * math.sin(th)))}M{f1(F.X(0))} {f1(F.Y(0))}L{f1(F.X(-L * math.cos(th)))} {f1(F.Y(-L * math.sin(th)))}", "dsh")
    if asym and cen is not None and n - m >= 2:
        L = (x1 - x0) * 3
        d = ""
        for q in range(n - m):
            a = (2 * q + 1) * math.pi / (n - m)
            d += f"M{f1(F.X(cen))} {f1(F.Y(0))}L{f1(F.X(cen + L * math.cos(a)))} {f1(F.Y(L * math.sin(a)))}"
        S.path(d, "dsh")
        S.add(f'<circle class="thin" cx="{f1(F.X(cen))}" cy="{f1(F.Y(0))}" r="3" style="fill:var(--ink-3)"/>')
    cls = ["c1", "c2", "c3", "c4"]
    for i, b in enumerate(br):
        S.path(poly_path(F, [(z.real, z.imag) for z in b]), cls[i % 4])
        # direction arrow near the middle of the visible part
        vis = [j for j in range(1, len(b)) if F.inside(b[j].real, b[j].imag, -8)]
        if len(vis) > 20:
            j = vis[int(len(vis) * 0.55)]
            a, c = b[j - 1], b[j]
            # use a longer chord for a stable direction
            a = b[max(0, j - 6)]
            if abs(F.X(c.real) - F.X(a.real)) + abs(F.Y(c.imag) - F.Y(a.imag)) > 1:
                S.add(f'<path class="{cls[i % 4]}" d="M{f1(F.X(a.real))} {f1(F.Y(a.imag))}L{f1(F.X(c.real))} {f1(F.Y(c.imag))}" marker-end="url(#{key}-a)" style="stroke-width:2"/>')
    for bx in breaks:
        S.add(f'<rect class="mkg" x="{f1(F.X(bx) - 4)}" y="{f1(F.Y(0) - 4)}" width="8" height="8"/>')
    for w in cross:
        for sg in (1, -1):
            S.path(f"M{f1(F.X(0))} {f1(F.Y(sg * w) - 5)}l5 5l-5 5l-5-5z", "mkr")
    for k, lab in kmarks:
        cp = np.polyadd(den, k * np.concatenate([np.zeros(len(den) - len(num)), num]))
        for r in np.roots(cp):
            S.add(f'<circle cx="{f1(F.X(r.real))}" cy="{f1(F.Y(r.imag))}" r="4.5" style="fill:var(--accent);stroke:var(--paper);stroke-width:1.5"/>')
    S.add("</g>")
    for p in P:
        mark_pole(S, F, p)
    for z in Z:
        mark_zero(S, F, z)
    for (xv, yv, s, anc) in notes:
        S.text(F.X(xv), F.Y(yv), s, "lbk", anc)
    return S.svg()


def RL(key, num, den, label, **kw):
    FIGS[key] = lambda: rlfig(key, num, den, label, **kw)


# ------------------------------------------------------------------ Bode
def bode_data(num, den, w):
    s = 1j * w
    G = np.polyval(num, s) / np.polyval(den, s)
    mag = 20 * np.log10(np.abs(G))
    ph = np.unwrap(np.angle(G)) * 180 / np.pi
    return mag, ph


def bodefig(key, num, den, label, wmin, wmax, W=560, asym=True, margins=True, delay=0.0, magr=None, phr=None, extra_mag=(), extra_ph=()):
    S = Svg(W, 470, label, key)
    w = np.logspace(math.log10(wmin), math.log10(wmax), 800)
    mag, ph = bode_data(num, den, w)
    if delay:
        ph = ph - w * delay * 180 / np.pi
    # bring the phase into a familiar range (start between -270 and +90)
    while ph[0] > 90:
        ph -= 360
    while ph[0] < -270:
        ph += 360
    ml = 46
    y0 = magr[0] if magr else math.floor((max(mag.min(), -120) - 5) / 20) * 20
    y1 = magr[1] if magr else math.ceil((min(mag.max(), 120) + 5) / 20) * 20
    p0 = phr[0] if phr else math.floor((min(ph.min(), -180) - 5) / 45) * 45
    p1 = phr[1] if phr else math.ceil((max(ph.max(), 0) + 5) / 45) * 45
    FM = Frame(ml, 10, W - ml - 12, 190, wmin, wmax, y0, y1, True)
    FP = Frame(ml, 236, W - ml - 12, 200, wmin, wmax, p0, p1, True)

    def lgrid(F, ys, ylab):
        S.add(f'<rect class="thin" x="{F.x}" y="{F.y}" width="{f1(F.w)}" height="{F.h}"/>')
        g, mn = "", ""
        for e in range(math.floor(math.log10(wmin)), math.ceil(math.log10(wmax)) + 1):
            for k in range(1, 10):
                ww = k * 10 ** e
                if ww < wmin * 0.9999 or ww > wmax * 1.0001:
                    continue
                X = F.X(ww)
                if k == 1:
                    g += f"M{f1(X)} {F.y}V{f1(F.y + F.h)}"
                    lab = f"{10 ** e:g}" if -2 <= e <= 3 else f"10^{e}"
                    S.text(X, F.y + F.h + 15, lab, "tk", "middle")
                else:
                    mn += f"M{f1(X)} {F.y}V{f1(F.y + F.h)}"
        for v in ys:
            g += f"M{F.x} {f1(F.Y(v))}H{f1(F.x + F.w)}"
            S.text(F.x - 5, F.Y(v) + 4, mono(f"{v:g}"), "tk", "end")
        S.path(mn, "gr", ' style="opacity:.5"')
        S.path(g, "gr")
        S.text(F.x + 6, F.y + 14, ylab, "lb")

    lgrid(FM, range(int(y0), int(y1) + 1, 20), "|G(jω)| (dB)")
    lgrid(FP, range(int(p0), int(p1) + 1, 45), "∠G(jω) (°)")
    S.text(FP.x + FP.w - 4, FP.y + FP.h - 6, "ω (rad/s)", "lb", "end")
    S.path(f"M{FM.x} {f1(FM.Y(0))}H{f1(FM.x + FM.w)}", "ax")
    if p0 <= -180 <= p1:
        S.path(f"M{FP.x} {f1(FP.Y(-180))}H{f1(FP.x + FP.w)}", "dsh", ' style="stroke:var(--bad)"')
    if asym:
        am, ap = asymptotes(num, den, w)
        S.path(poly_path(FM, list(zip(w, am))), "dsh")
        S.path(poly_path(FP, list(zip(w, ap))), "dsh")
    for (wx, yv) in extra_mag:
        pass
    S.path(poly_path(FM, list(zip(w, mag))), "c1")
    S.path(poly_path(FP, list(zip(w, ph))), "c1")
    if margins:
        # gain crossover
        idx = np.where(np.diff(np.sign(mag)) != 0)[0]
        if len(idx):
            i = idx[-1]
            wgc = w[i] - mag[i] * (w[i + 1] - w[i]) / (mag[i + 1] - mag[i])
            phg = np.interp(math.log10(wgc), np.log10(w), ph)
            S.path(f"M{f1(FM.X(wgc))} {f1(FM.Y(0))}V{f1(FM.y + FM.h)}", "dsh", ' style="stroke:var(--b3)"')
            S.path(f"M{f1(FP.X(wgc))} {FP.y}V{f1(FP.Y(phg))}", "dsh", ' style="stroke:var(--b3)"')
            S.path(f"M{f1(FP.X(wgc))} {f1(FP.Y(phg))}V{f1(FP.Y(-180))}", "c3", ' style="stroke-width:3.2"')
            S.text(FP.X(wgc) + 6, (FP.Y(phg) + FP.Y(-180)) / 2 + 4, f"PM = {phg + 180:.1f}°", "lbk")
        idx = np.where(np.diff(np.sign(ph + 180)) != 0)[0]
        if len(idx):
            i = idx[0]
            wpc = w[i] - (ph[i] + 180) * (w[i + 1] - w[i]) / (ph[i + 1] - ph[i])
            mg = np.interp(math.log10(wpc), np.log10(w), mag)
            S.path(f"M{f1(FP.X(wpc))} {f1(FP.Y(-180))}V{FP.y}", "dsh", ' style="stroke:var(--b2)"')
            S.path(f"M{f1(FM.X(wpc))} {f1(FM.Y(mg))}V{f1(FM.Y(0))}", "c2", ' style="stroke-width:3.2"')
            S.text(FM.X(wpc) + 6, (FM.Y(mg) + FM.Y(0)) / 2 + 4, f"GM = {-mg:.1f} dB", "lbk")
    return S.svg()


def asymptotes(num, den, w):
    """straight-line magnitude and phase asymptotes"""
    num = np.trim_zeros(np.array(num, float), "f")
    den = np.trim_zeros(np.array(den, float), "f")
    zs, ps = np.roots(num) if len(num) > 1 else np.array([]), np.roots(den)
    q = sum(abs(p) < 1e-9 for p in ps) - sum(abs(z) < 1e-9 for z in zs)
    # low-frequency gain Kb: G ≈ Kb / s^q
    nz = [z for z in zs if abs(z) > 1e-9]
    npl = [p for p in ps if abs(p) > 1e-9]
    Kb = num[0] / den[0] * np.prod([-z for z in nz]).real / np.prod([-p for p in npl]).real if True else 1
    corners = []
    for r, kind in [(z, 1) for z in nz] + [(p, -1) for p in npl]:
        if abs(r.imag) < 1e-9:
            corners.append((abs(r), kind, 1, r.real > 0, 1))
        elif r.imag > 0:
            corners.append((abs(r), kind, 2, r.real > 0, abs(r.real) / abs(r)))
    am, ap = [], []
    ph0 = (-180 if Kb < 0 else 0) - 90 * q
    for ww in w:
        db = 20 * math.log10(abs(Kb)) - 20 * q * math.log10(ww)
        ph = ph0
        for (wc, kind, order, rhp, zt) in corners:
            if ww > wc:
                db += kind * 20 * order * math.log10(ww / wc)
            sgn = kind * (-1 if rhp else 1)
            if order == 1:
                ph += sgn * 90 * min(1, max(0, (math.log10(ww / wc) + 1) / 2))
            else:
                half = max(0.04, min(1, zt))
                ph += sgn * 180 * min(1, max(0, (math.log10(ww / wc) + half) / (2 * half)))
        am.append(db)
        ap.append(ph)
    return np.array(am), np.array(ap)


def BODE(key, num, den, label, wmin, wmax, **kw):
    FIGS[key] = lambda: bodefig(key, num, den, label, wmin, wmax, **kw)


# ------------------------------------------------------------------ Nyquist
def nyqfig(key, num, den, label, K=1.0, R=None, W=560, H=380, wmin=1e-3, wmax=1e3, note=None, delay=0.0):
    S = Svg(W, H, label, key)
    w = np.logspace(math.log10(wmin), math.log10(wmax), 3000)
    G = K * np.polyval(num, 1j * w) / np.polyval(den, 1j * w) * np.exp(-1j * w * delay)
    if R is None:
        R = max(2.0, min(np.percentile(np.abs(G), 70), 10))
    ml = 40
    pw, ph = W - ml - 12, H - 12 - 26
    ry = R * ph / pw * 1.0
    F = Frame(ml, 12, pw, ph, -R * 1.15, R * 0.85, -ry, ry)
    grid(S, F, "Re", "Im")
    S.add(f'<circle cx="{f1(F.X(0))}" cy="{f1(F.Y(0))}" r="{f1(F.X(1) - F.X(0))}" class="dsh" style="stroke:var(--b4)"/>')
    S.add(f'<g clip-path="url(#{key}-cp)"><clipPath id="{key}-cp"><rect x="{F.x}" y="{F.y}" width="{F.w}" height="{F.h}"/></clipPath>')
    S.path(poly_path(F, [(g.real, -g.imag) for g in G]), "c1", ' style="stroke-dasharray:4 4;opacity:.6"')
    S.path(poly_path(F, [(g.real, g.imag) for g in G]), "c1")
    vis = [i for i in range(3, len(G)) if 0.25 * R < abs(G[i]) < 0.95 * R]
    for q in (0.2, 0.6):
        if not vis:
            break
        i = vis[int(q * (len(vis) - 1))]
        a, b = G[i - 3], G[i]
        if F.inside(b.real, b.imag, -5):
            S.add(f'<path class="c1" d="M{f1(F.X(a.real))} {f1(F.Y(a.imag))}L{f1(F.X(b.real))} {f1(F.Y(b.imag))}" marker-end="url(#{key}-a)" style="stroke-width:2"/>')
    S.add("</g>")
    S.path(f"M{f1(F.X(-1) - 6)} {f1(F.Y(0) - 6)}l12 12m0-12l-12 12", "px", ' style="stroke:var(--bad)"')
    S.text(F.X(-1), F.Y(0) + 20, "−1", "lbk", "middle")
    if note:
        S.text(F.x + F.w - 6, F.y + 16, note, "lbk", "end")
    return S.svg()


def NYQ(key, num, den, label, **kw):
    FIGS[key] = lambda: nyqfig(key, num, den, label, **kw)


# ------------------------------------------------------------------ step responses
def stepfig(key, systems, label, T, W=560, H=280, ylim=None, band=True, names=None, marks=None):
    S = Svg(W, H, label, key)
    t = np.linspace(0, T, 1200)
    ys = []
    import control as ct
    for (num, den) in systems:
        _, y = ct.step_response(ct.tf(num, den), t)
        ys.append(np.array(y))
    lo = min(0, min(y.min() for y in ys))
    hi = max(1.1, max(y.max() for y in ys))
    if ylim:
        lo, hi = ylim
    F = Frame(40, 12, W - 52, H - 40, 0, T, lo - 0.04 * (hi - lo), hi + 0.06 * (hi - lo))
    grid(S, F, "t (s)", "y(t)", jlabel=False)
    if band:
        S.add(f'<rect class="shadeg" x="{F.x}" y="{f1(F.Y(1.02))}" width="{f1(F.w)}" height="{f1(F.Y(0.98) - F.Y(1.02))}"/>')
        S.path(f"M{F.x} {f1(F.Y(1))}H{f1(F.x + F.w)}", "dsh")
    cls = ["c1", "c2", "c3", "c4"]
    for i, y in enumerate(ys):
        S.path(poly_path(F, list(zip(t, y))), cls[i % 4])
    if names:
        for i, nm in enumerate(names):
            S.add(f'<text class="lb" x="{f1(F.x + F.w - 8)}" y="{f1(F.y + 18 + 16 * i)}" text-anchor="end" style="fill:var(--b{i % 4 + 1})">{nm}</text>')
    return S.svg()


def STEP(key, systems, label, T, **kw):
    FIGS[key] = lambda: stepfig(key, systems, label, T, **kw)


# ------------------------------------------------------------------ block diagrams
class Block:
    """tiny block-diagram builder: blocks, summing junctions, arrows and labels"""

    def __init__(self, key, W, H, label):
        self.S = Svg(W, H, label, key)

    def blk(self, x, y, w, h, tex, sub=None):
        self.S.add(f'<rect class="blk" x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" rx="6"/>')
        self.S.text(x + w / 2, y + h / 2 + (0 if sub else 5), tex, "lb", "middle")
        if sub:
            self.S.text(x + w / 2, y + h / 2 + 16, sub, "tk", "middle")

    def sum(self, x, y, signs="+-", r=12):
        self.S.add(f'<circle class="sum" cx="{f1(x)}" cy="{f1(y)}" r="{r}"/>')
        self.S.path(f"M{f1(x - r * .7)} {f1(y - r * .7)}l{f1(r * 1.4)} {f1(r * 1.4)}m0 {f1(-r * 1.4)}l{f1(-r * 1.4)} {f1(r * 1.4)}", "thin")
        pos = {"w": (x - r - 10, y - 6), "s": (x - 14, y + r + 14), "n": (x - 14, y - r - 4), "e": (x + r + 4, y - 6)}
        for side, sg in zip(("w", "s"), signs):
            px, py = pos[side]
            self.S.text(px, py, sg, "lb")

    def wire(self, pts, arrow=True, lab=None, at=None):
        d = "M" + "L".join(f"{f1(x)} {f1(y)}" for x, y in pts)
        self.S.add(f'<path class="wire" d="{d}"' + (f' marker-end="url(#{self.S.key}-a)"' if arrow else "") + "/>")
        if lab:
            x, y = at or ((pts[0][0] + pts[1][0]) / 2, pts[0][1] - 8)
            self.S.text(x, y, lab, "lbk", "middle")

    def dot(self, x, y):
        self.S.add(f'<circle cx="{f1(x)}" cy="{f1(y)}" r="3.5" style="fill:var(--ink)"/>')

    def text(self, x, y, s, cls="lb", anc="middle"):
        self.S.text(x, y, s, cls, anc)

    def svg(self):
        return self.S.svg()


# ======================================================================= figures
@fig("cs-loop")
def _():
    B = Block("cs-loop", 640, 210, "บล็อกไดอะแกรมระบบควบคุมป้อนกลับมาตรฐาน: ค่าอ้างอิง r ผ่านจุดรวมสัญญาณ ได้ความผิดพลาด e เข้าตัวควบคุม C(s) ได้สัญญาณควบคุม u เข้าพลานต์ G(s) ได้เอาต์พุต y ซึ่งวัดด้วยเซนเซอร์ H(s) ป้อนกลับ มีสัญญาณรบกวน d เข้าที่พลานต์")
    B.wire([(10, 80), (68, 80)], lab="r", at=(30, 70))
    B.sum(82, 80)
    B.wire([(94, 80), (150, 80)], lab="e", at=(120, 70))
    B.blk(150, 55, 110, 50, "C(s)", "ตัวควบคุม")
    B.wire([(260, 80), (320, 80)], lab="u", at=(290, 70))
    B.sum(334, 80, "++")
    B.wire([(334, 20), (334, 66)], lab=None)
    B.text(346, 26, "d", "lbk", "start")
    B.wire([(346, 80), (400, 80)])
    B.blk(400, 55, 110, 50, "G(s)", "พลานต์")
    B.wire([(510, 80), (628, 80)], lab="y", at=(610, 70))
    B.dot(570, 80)
    B.wire([(570, 80), (570, 170), (350, 170)], arrow=True)
    B.blk(240, 148, 110, 44, "H(s)", "เซนเซอร์")
    B.wire([(240, 170), (82, 170), (82, 94)])
    B.text(100, 190, "ป้อนกลับ (feedback)", "tk", "start")
    return B.svg()


@fig("cs-splane")
def _():
    S = Svg(560, 300, "ระนาบ s แบ่งเป็นฝั่งซ้าย (เสถียร) และฝั่งขวา (ไม่เสถียร) ขั้วจริงลบให้ผลตอบสนองลดลงแบบเอกซ์โพเนนเชียล ขั้วเชิงซ้อนให้การแกว่ง ขั้วบนแกน jω ให้การแกว่งค้าง", "cs-splane")
    F = Frame(40, 12, 508, 262, -4, 4, -2.1, 2.1)
    S.add(f'<rect class="shadeg" x="{F.x}" y="{F.y}" width="{f1(F.X(0) - F.x)}" height="{F.h}"/>')
    S.add(f'<rect class="shade" x="{f1(F.X(0))}" y="{F.y}" width="{f1(F.x + F.w - F.X(0))}" height="{F.h}"/>')
    grid(S, F)
    S.text(F.X(-2), F.Y(-1.75), "ฝั่งซ้าย: เสถียร", "lbk", "middle")
    S.text(F.X(2), F.Y(-1.75), "ฝั่งขวา: ไม่เสถียร", "lbk", "middle")
    for p in [-3, -1.2 + 1.3j, -1.2 - 1.3j, 1.4j, -1.4j, 1.5 + 1j, 1.5 - 1j, 2.5]:
        mark_pole(S, F, complex(p))
    # mini responses
    def spark(x, y, f, w=70, h=26, cls="c3"):
        pts = [(x + w * i / 60, y - h * f(i / 60 * 6)) for i in range(61)]
        S.add(f'<path class="{cls}" style="stroke-width:1.8" d="M' + "L".join(f"{f1(a)} {f1(b)}" for a, b in pts) + '"/>')
    spark(F.X(-3.6), F.Y(-0.7), lambda t: math.exp(-t * 0.8) * 0.9)
    spark(F.X(-2.0), F.Y(1.7), lambda t: math.exp(-t * 0.4) * math.cos(t * 2.4) * 0.6)
    spark(F.X(0.2), F.Y(1.75) + 8, lambda t: 0.5 * math.cos(t * 2.4), cls="c4")
    spark(F.X(2.4), F.Y(1.6), lambda t: max(-1.2, min(1.2, 0.08 * math.exp(t * 0.45) * math.cos(t * 2.4))), cls="c2")
    return S.svg()


@fig("cs-bd1")
def _():
    B = Block("cs-bd1", 680, 240, "บล็อกไดอะแกรมสามลูป: G1 G2 G3 อนุกรม ลูปใน H1 รอบ G2 ลูปกลาง H2 จากเอาต์พุตกลับมาก่อน G2 และลูปนอกป้อนกลับหนึ่งหน่วย")
    B.wire([(10, 70), (44, 70)], lab="R", at=(22, 60))
    B.sum(56, 70)
    B.wire([(68, 70), (95, 70)])
    B.blk(95, 48, 70, 44, "G₁")
    B.wire([(165, 70), (203, 70)])
    B.sum(215, 70)
    B.wire([(227, 70), (263, 70)])
    B.sum(275, 70)
    B.wire([(287, 70), (320, 70)])
    B.blk(320, 48, 80, 44, "G₂")
    B.wire([(400, 70), (460, 70)])
    B.dot(430, 70)
    B.blk(460, 48, 80, 44, "G₃")
    B.wire([(540, 70), (668, 70)], lab="Y", at=(652, 60))
    B.dot(580, 70)
    B.dot(625, 70)
    B.wire([(430, 70), (430, 135), (400, 135)])
    B.blk(320, 115, 80, 40, "H₁")
    B.wire([(320, 135), (275, 135), (275, 82)])
    B.wire([(580, 70), (580, 185), (400, 185)])
    B.blk(320, 165, 80, 40, "H₂")
    B.wire([(320, 185), (215, 185), (215, 82)])
    B.wire([(625, 70), (625, 228), (56, 228), (56, 82)])
    return B.svg()


@fig("cs-tacho")
def _():
    B = Block("cs-tacho", 660, 200, "เซอร์โวมอเตอร์ที่มีลูปในป้อนกลับความเร็วด้วยแทโคมิเตอร์ Kt s และลูปนอกป้อนกลับตำแหน่ง")
    B.wire([(10, 70), (52, 70)], lab="θr", at=(26, 60))
    B.sum(64, 70)
    B.wire([(76, 70), (115, 70)])
    B.blk(115, 48, 70, 44, "K")
    B.wire([(185, 70), (238, 70)])
    B.sum(250, 70)
    B.wire([(262, 70), (300, 70)])
    B.blk(300, 45, 110, 50, "10/(s+1)", "มอเตอร์")
    B.wire([(410, 70), (470, 70)], lab="ω", at=(440, 60))
    B.dot(445, 70)
    B.blk(470, 48, 70, 44, "1/s")
    B.wire([(540, 70), (648, 70)], lab="θ", at=(630, 60))
    B.dot(600, 70)
    B.wire([(445, 70), (445, 140), (395, 140)])
    B.blk(315, 120, 80, 40, "Kₜ", "แทโค")
    B.wire([(315, 140), (250, 140), (250, 82)])
    B.wire([(600, 70), (600, 185), (64, 185), (64, 82)])
    return B.svg()


# --- root locus lesson figures
RL("rl-l1", [1], [1, 3, 2, 0], "รูทโลคัสของ K/(s(s+1)(s+2)) พร้อมเส้นกำกับที่ σ = −1 มุม ±60° และ 180° จุดแยกที่ s = −0.423 และจุดตัดแกน jω ที่ ±j1.414 เมื่อ K = 6",
   breaks=(-0.4226,), cross=(math.sqrt(2),), window=(-4.2, 1.8, -2.6, 2.6),
   notes=((-0.42, 0.25, "−0.423", "middle"), (0.15, 1.6, "j1.414 (K=6)", "start"), (-1, -0.32, "σa = −1", "middle")))
RL("rl-w1", [1], [1, 4, 3], "รูทโลคัสของ K/((s+1)(s+3)) กิ่งสองกิ่งชนกันที่ s = −2 แล้วแยกขึ้นลงเป็นเส้นตรงแนวดิ่ง", breaks=(-2,), window=(-5, 1, -3, 3),
   notes=((-2, 0.3, "−2 (K=1)", "middle"),))
RL("rl-w2", [1, 3], [1, 1, 0], "รูทโลคัสของ K(s+3)/(s(s+1)) เป็นวงกลมรัศมี √6 รอบศูนย์ที่ −3 จุดแยก −0.551 และจุดเข้า −5.449", breaks=(-0.5505, -5.4495), window=(-7.5, 1.5, -3.4, 3.4),
   notes=((-0.55, 0.3, "−0.551", "middle"), (-5.45, 0.3, "−5.449", "middle")))
RL("rl-w3", [1], [1, 2, 2, 0], "รูทโลคัสของ K/(s(s²+2s+2)) ขั้วเชิงซ้อนออกที่มุม −45° ตัดแกน jω ที่ ±j1.414 เมื่อ K = 4", cross=(math.sqrt(2),), window=(-3.4, 1.6, -2.4, 2.4),
   notes=((-1, 1.3, "θd = −45°", "middle"), (0.12, 1.55, "K = 4", "start")))
RL("rl-w4", [1, 2], [1, 2, 3], "รูทโลคัสของ K(s+2)/(s²+2s+3) ออกจากขั้วเชิงซ้อนที่มุม 144.7° เป็นส่วนโค้งวงกลมรอบศูนย์ −2 เข้าแกนจริงที่ −3.732", breaks=(-3.7321,), window=(-6, 1, -2.6, 2.6),
   notes=((-3.73, 0.3, "−3.732", "middle"), (-0.6, 1.75, "θd = 144.7°", "start")))
RL("rl-w5", [1], [1, 8, 36, 80, 0], "รูทโลคัสของ K/(s(s+4)(s²+4s+20)) มีจุดแยกที่ −2 และ −2 ± j2.45 เส้นกำกับสี่เส้น ตัดแกน jω ที่ ±j3.16 เมื่อ K = 260", breaks=(-2,), cross=(math.sqrt(10),), window=(-7, 3, -5, 5),
   notes=((0.2, 3.4, "K = 260", "start"),))
RL("rl-w6", [1, 1], [1, 9, 0, 0], "รูทโลคัสของ K(s+1)/(s²(s+9)) กิ่งสามกิ่งมาพบกันที่ s = −3 พร้อมกันเมื่อ K = 27", breaks=(-3,), window=(-11, 1.5, -5, 5),
   notes=((-3, 0.6, "−3 (K=27)", "middle"),))
RL("rl-w7", [1], [1, 10, 35, 50, 24], "รูทโลคัสของ K/((s+1)(s+2)(s+3)(s+4)) จุดแยกสองจุดที่ −1.382 และ −3.618 ตัดแกน jω ที่ ±j2.236 เมื่อ K = 126", breaks=(-1.382, -3.618), cross=(math.sqrt(5),), window=(-6.5, 2, -3.8, 3.8))
RL("rl-pd", [1, 3], [1, 3, 2, 0], "เทียบรูทโลคัสเมื่อเพิ่มศูนย์ที่ −3 ให้ K/(s(s+1)(s+2)) กลายเป็น K(s+3)/(s(s+1)(s+2)) เส้นกำกับเหลือสองเส้นที่ ±90° และไม่ตัดแกน jω อีก", window=(-4.2, 1.8, -2.6, 2.6), breaks=(-0.4672,))

# --- Bode lesson figures
BODE("bd-d1", [100], [1, 11, 10], "โบดไดอะแกรมของ 100/((s+1)(s+10)) ขนาดเริ่ม 20 dB ลง −20 dB/เดคาดหลัง ω = 1 และ −40 dB/เดคาดหลัง ω = 10", 0.01, 1000, margins=False)
BODE("bd-d2", [10, 10], [1, 10, 0], "โบดไดอะแกรมของ 10(s+1)/(s(s+10)) เริ่มที่ −20 dB/เดคาดจากอินทิเกรเตอร์ ศูนย์ที่ 1 ทำให้แบน ขั้วที่ 10 ทำให้ลงอีกครั้ง", 0.01, 1000, margins=False)
BODE("bd-d3", [1], [1, 0.4, 1], "โบดไดอะแกรมของระบบอันดับสอง 1/(s²+0.4s+1) มียอดเรโซแนนซ์ที่ ω ≈ 1 สูงกว่าเส้นกำกับ 8 dB", 0.01, 100, margins=False)
BODE("bd-g1", [2], [1, 3, 2, 0], "โบดไดอะแกรมของ 2/(s(s+1)(s+2)) แสดงเฟสมาร์จิน 32.6° ที่ ω = 0.749 และเกนมาร์จิน 9.54 dB ที่ ω = 1.414", 0.01, 100)

BODE("bd-d4", [2500], [1, 55, 250, 0], "เส้นกำกับโบดของ 2500/(s(s+5)(s+50)) ผ่าน 20 dB ที่ ω = 1 ความชัน −20, −40 และ −60 dB ต่อเดคาด", 0.1, 1000, margins=False)
BODE("bd-g2", [1.338], [1, 3, 2, 0], "โบดไดอะแกรมของ 1.338/(s(s+1)(s+2)) ที่ออกแบบให้เฟสมาร์จิน 45°", 0.01, 100)

# --- Nyquist
NYQ("nq-n1", [2], [1, 3, 2, 0], "กราฟไนควิสต์ของ 2/(s(s+1)(s+2)) ตัดแกนจริงลบที่ −1/3 ไม่อ้อมจุด −1 ระบบวงปิดเสถียร", K=1, R=2.4, wmin=0.15, note="ตัดแกนจริงที่ −1/3 → GM = 3")
NYQ("nq-n2", [2], [1, -1], "กราฟไนควิสต์ของ 2/(s−1) เป็นวงกลมจาก −2 ไป 0 อ้อมจุด −1 ทวนเข็มหนึ่งรอบ ระบบวงปิดเสถียรแม้วงเปิดไม่เสถียร", K=1, R=2.6, wmin=0.001, note="N = −1, P = 1 → Z = 0")
NYQ("nq-n3", [10], [1, 3, 2, 0], "กราฟไนควิสต์ของ 10/(s(s+1)(s+2)) ตัดแกนจริงที่ −5/3 อ้อมจุด −1 ตามเข็มสองรอบ วงปิดไม่เสถียร", K=1, R=3.2, wmin=0.2, note="N = 2, P = 0 → Z = 2")

# --- time response
STEP("st-zeta", [([1], [1, 2 * z, 1]) for z in (0.2, 0.5, 0.7, 1.0)], "ผลตอบสนองขั้นบันไดของระบบอันดับสองที่ ζ = 0.2, 0.5, 0.7 และ 1", 14,
     names=("ζ = 0.2", "ζ = 0.5", "ζ = 0.7", "ζ = 1"))


def inject(paths):
    for p in paths:
        src = open(p, encoding="utf8").read()

        def rep(m):
            key = m.group(1)
            if key not in FIGS:
                raise SystemExit(f"unknown figure {key} in {p}")
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
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(root, "src/pages/learn/control-systems/*.html")))
    inject(files)
