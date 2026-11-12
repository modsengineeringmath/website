#!/usr/bin/env python3
"""Figures for the Control Engineering course (content/courses/control-engineering/).
Writes stand-alone SVG files to images/courses/control-engineering/. Run: python3 scripts/course_figs.py
The curves are computed from the closed-form answers printed in the lessons."""
import math, os

OUT = os.path.join(os.path.dirname(__file__), "..", "images", "courses", "control-engineering")
INK, INK3, RULE, ACC, SIG, BG = "#172029", "#737d86", "#d9d2c1", "#c94f18", "#1f5fa8", "#fbf9f4"
FONT = "font-family=\"'IBM Plex Sans Thai','IBM Plex Sans',system-ui,sans-serif\""
MONO = "font-family=\"'IBM Plex Mono',ui-monospace,monospace\""


def save(name, w, h, body, title):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">'
           f'<title>{title}</title><rect width="{w}" height="{h}" rx="12" fill="{BG}"/>{body}</svg>\n')
    with open(os.path.join(OUT, name), "w", encoding="utf8") as f:
        f.write(svg)
    print("wrote", name)


def step_plot(name, title, f, tmax, ymax, yticks, marks, ylabel, final, formula):
    w, h, l, r, t, b = 720, 400, 70, 24, 46, 56
    X = lambda x: l + (w - l - r) * x / tmax
    Y = lambda y: h - b - (h - t - b) * y / ymax
    g = []
    for x in range(0, tmax + 1):
        g.append(f'<line x1="{X(x):.1f}" y1="{t}" x2="{X(x):.1f}" y2="{h-b}" stroke="{RULE}" stroke-width="1"/>'
                 f'<text x="{X(x):.1f}" y="{h-b+20}" text-anchor="middle" font-size="13" fill="{INK3}" {MONO}>{x}</text>')
    for y in yticks:
        g.append(f'<line x1="{l}" y1="{Y(y):.1f}" x2="{w-r}" y2="{Y(y):.1f}" stroke="{RULE}" stroke-width="1"/>'
                 f'<text x="{l-8}" y="{Y(y)+4:.1f}" text-anchor="end" font-size="13" fill="{INK3}" {MONO}>{y:g}</text>')
    g.append(f'<line x1="{l}" y1="{Y(final):.1f}" x2="{w-r}" y2="{Y(final):.1f}" stroke="{SIG}" stroke-width="1.5" stroke-dasharray="6 5"/>')
    pts = " ".join(f"{X(i*tmax/400):.2f},{Y(f(i*tmax/400)):.2f}" for i in range(401))
    g.append(f'<polyline points="{pts}" fill="none" stroke="{ACC}" stroke-width="3" stroke-linejoin="round"/>')
    for x, lab, dx, dy in marks:
        y = f(x)
        g.append(f'<line x1="{X(x):.1f}" y1="{Y(y):.1f}" x2="{X(x):.1f}" y2="{h-b}" stroke="{INK3}" stroke-width="1" stroke-dasharray="3 4"/>'
                 f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="5" fill="{BG}" stroke="{INK}" stroke-width="2"/>'
                 f'<text x="{X(x)+dx:.1f}" y="{Y(y)+dy:.1f}" font-size="13" fill="{INK}" {MONO}>{lab}</text>')
    g.append(f'<rect x="{l}" y="{t}" width="{w-l-r}" height="{h-t-b}" fill="none" stroke="{INK}" stroke-width="1.5"/>')
    g.append(f'<text x="{(l+w-r)/2}" y="{h-12}" text-anchor="middle" font-size="14" fill="{INK}" {FONT}>เวลา t (s)</text>')
    g.append(f'<text x="18" y="{(t+h-b)/2}" text-anchor="middle" font-size="14" fill="{INK}" {FONT} transform="rotate(-90 18 {(t+h-b)/2})">{ylabel}</text>')
    g.append(f'<text x="{l}" y="28" font-size="15" font-weight="600" fill="{INK}" {FONT}>{title}</text>')
    g.append(f'<text x="{w-r}" y="28" text-anchor="end" font-size="14" fill="{ACC}" {MONO}>{formula}</text>')
    save(name, w, h, "".join(g), title)


def loop():
    w, h = 720, 250
    g = [f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="{INK}"/></marker></defs>']
    box = lambda x, y, bw, bh, a, bsub, col=INK: (f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="8" fill="#fff" stroke="{col}" stroke-width="2"/>'
            f'<text x="{x+bw/2}" y="{y+bh/2-2}" text-anchor="middle" font-size="17" font-weight="600" fill="{INK}" {MONO}>{a}</text>'
            f'<text x="{x+bw/2}" y="{y+bh/2+17}" text-anchor="middle" font-size="12" fill="{INK3}" {FONT}>{bsub}</text>')
    line = lambda pts: f'<polyline points="{pts}" fill="none" stroke="{INK}" stroke-width="2" marker-end="url(#a)"/>'
    lab = lambda x, y, s, anchor="middle", col=INK: f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="14" fill="{col}" {MONO}>{s}</text>'
    cy = 80
    g += [line(f"30,{cy} 118,{cy}"), lab(62, cy - 12, "R(s)"), lab(62, cy + 22, "ค่าอ้างอิง", col=INK3).replace(MONO, FONT),
          f'<circle cx="138" cy="{cy}" r="18" fill="#fff" stroke="{INK}" stroke-width="2"/>', lab(127, cy - 24, "+"), lab(118, cy + 34, "−"),
          line(f"156,{cy} 228,{cy}"), lab(192, cy - 12, "E(s)"),
          box(230, cy - 34, 130, 68, "C(s)", "ตัวควบคุม", ACC), line(f"360,{cy} 428,{cy}"), lab(394, cy - 12, "U(s)"),
          box(430, cy - 34, 130, 68, "G(s)", "พลานต์", SIG), line(f"560,{cy} 690,{cy}"), lab(650, cy - 12, "Y(s)"), lab(650, cy + 22, "เอาต์พุต", col=INK3).replace(MONO, FONT),
          f'<circle cx="610" cy="{cy}" r="4" fill="{INK}"/>', line(f"610,{cy} 610,190 462,190"),
          box(330, 156, 130, 68, "H(s)", "เซนเซอร์"), line(f"330,190 138,190 138,{cy+19}")]
    save("feedback-loop.svg", w, h, "".join(g), "บล็อกไดอะแกรมของระบบควบคุมป้อนกลับ")


loop()
step_plot("rc-step.svg", "ผลตอบสนองขั้นบันไดของวงจร RC (τ = 1 s)", lambda t: 1 - math.exp(-t), 6, 1.2, [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2],
          [(1, "t = τ : 0.632 V", 10, 16), (4, "t = 4τ : 0.982 V", -52, 26)], "แรงดันเอาต์พุต vₒ (V)", 1.0, "vₒ(t) = 1 − e⁻ᵗ")
step_plot("msd-step.svg", "ผลตอบสนองขั้นบันไดของ G(s) = 1/((s+1)(s+2))", lambda t: 0.5 - math.exp(-t) + 0.5 * math.exp(-2 * t), 6, 0.6, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
          [(1, "t = 1 s : 0.200 m", 10, 16), (4, "t = 4 s : 0.482 m", -52, 26)], "ระยะกระจัด x (m)", 0.5, "x(t) = ½ − e⁻ᵗ + ½e⁻²ᵗ")


# ---- English copies of the three figures above (the English edition under content/courses/<course>/en/ uses them) ----------
def en_copy(name, pairs):
    with open(os.path.join(OUT, name), encoding="utf8") as f:
        s = f.read()
    for a, b in pairs:
        s = s.replace(a, b)
    with open(os.path.join(OUT, name.replace(".svg", "-en.svg")), "w", encoding="utf8") as f:
        f.write(s)
    print("wrote", name.replace(".svg", "-en.svg"))


en_copy("feedback-loop.svg", [("บล็อกไดอะแกรมของระบบควบคุมป้อนกลับ", "Block diagram of a feedback control system"), ("ค่าอ้างอิง", "reference"), ("ตัวควบคุม", "controller"),
                              ("พลานต์", "plant"), ("เอาต์พุต", "output"), ("เซนเซอร์", "sensor")])
en_copy("rc-step.svg", [("ผลตอบสนองขั้นบันไดของวงจร RC", "Step response of the RC circuit"), ("เวลา t (s)", "time t (s)"), ("แรงดันเอาต์พุต", "output voltage")])
en_copy("msd-step.svg", [("ผลตอบสนองขั้นบันไดของ", "Step response of"), ("เวลา t (s)", "time t (s)"), ("ระยะกระจัด", "displacement")])

# ---- Figures for units 5–16. Labels are symbols and numbers only, so the Thai and English editions share one file. ---------
import numpy as np
from scipy import signal

PAL = [ACC, SIG, "#2e7d4f", "#7a4fa3", "#9a7b00", INK3]


def plot(name, title, curves, xr, yr, xt, yt, xlabel, ylabel, w=720, h=420, logx=False, extra=None, legend=True, equal=False, hlines=(), vlines=()):
    """curves: list of (x array, y array, label, colour index, dashed)"""
    l, r, t, b = 72, 24, 46, 56
    if logx:
        X = lambda x: l + (w - l - r) * (math.log10(x) - math.log10(xr[0])) / (math.log10(xr[1]) - math.log10(xr[0]))
    else:
        X = lambda x: l + (w - l - r) * (x - xr[0]) / (xr[1] - xr[0])
    Y = lambda y: h - b - (h - t - b) * (y - yr[0]) / (yr[1] - yr[0])
    g = [f'<clipPath id="c-{name[:-4]}"><rect x="{l}" y="{t}" width="{w-l-r}" height="{h-t-b}"/></clipPath>']
    for x in xt:
        g.append(f'<line x1="{X(x):.1f}" y1="{t}" x2="{X(x):.1f}" y2="{h-b}" stroke="{RULE}" stroke-width="1"/>'
                 f'<text x="{X(x):.1f}" y="{h-b+20}" text-anchor="middle" font-size="13" fill="{INK3}" {MONO}>{x:g}</text>')
    for y in yt:
        g.append(f'<line x1="{l}" y1="{Y(y):.1f}" x2="{w-r}" y2="{Y(y):.1f}" stroke="{RULE}" stroke-width="1"/>'
                 f'<text x="{l-8}" y="{Y(y)+4:.1f}" text-anchor="end" font-size="13" fill="{INK3}" {MONO}>{y:g}</text>')
    for y in hlines:
        g.append(f'<line x1="{l}" y1="{Y(y):.1f}" x2="{w-r}" y2="{Y(y):.1f}" stroke="{INK}" stroke-width="1.2" stroke-dasharray="6 5"/>')
    for x in vlines:
        g.append(f'<line x1="{X(x):.1f}" y1="{t}" x2="{X(x):.1f}" y2="{h-b}" stroke="{INK}" stroke-width="1.2" stroke-dasharray="6 5"/>')
    ly = t + 18
    for xs, ys, lab, ci, dash in curves:
        pts = " ".join(f"{X(x):.2f},{Y(y):.2f}" for x, y in zip(xs, ys) if np.isfinite(y))
        g.append(f'<polyline clip-path="url(#c-{name[:-4]})" points="{pts}" fill="none" stroke="{PAL[ci]}" stroke-width="2.6" stroke-linejoin="round"{" stroke-dasharray=\"7 5\"" if dash else ""}/>')
        if legend and lab:
            g.append(f'<line x1="{w-r-150}" y1="{ly-4}" x2="{w-r-126}" y2="{ly-4}" stroke="{PAL[ci]}" stroke-width="3"/>'
                     f'<text x="{w-r-120}" y="{ly}" font-size="13" fill="{INK}" {MONO}>{lab}</text>')
            ly += 19
    if extra:
        g.append(extra(X, Y))
    g.append(f'<rect x="{l}" y="{t}" width="{w-l-r}" height="{h-t-b}" fill="none" stroke="{INK}" stroke-width="1.5"/>')
    g.append(f'<text x="{(l+w-r)/2}" y="{h-12}" text-anchor="middle" font-size="14" fill="{INK}" {MONO}>{xlabel}</text>')
    g.append(f'<text x="18" y="{(t+h-b)/2}" text-anchor="middle" font-size="14" fill="{INK}" {MONO} transform="rotate(-90 18 {(t+h-b)/2})">{ylabel}</text>')
    g.append(f'<text x="{l}" y="28" font-size="15" font-weight="600" fill="{INK}" {MONO}>{title}</text>')
    save(name, w, h, "".join(g), title)


def dot(X, Y, x, y, lab, dx=8, dy=-8, col=INK):
    return (f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="4.5" fill="{BG}" stroke="{col}" stroke-width="2"/>'
            f'<text x="{X(x)+dx:.1f}" y="{Y(y)+dy:.1f}" font-size="13" fill="{INK}" {MONO}>{lab}</text>')


def cross(X, Y, x, y, col=INK):
    a, c = X(x), Y(y)
    return f'<path d="M{a-6:.1f} {c-6:.1f}L{a+6:.1f} {c+6:.1f}M{a-6:.1f} {c+6:.1f}L{a+6:.1f} {c-6:.1f}" stroke="{col}" stroke-width="2.4"/>'


# unit 5: normalised first-order step
tt = np.linspace(0, 6, 400)
plot("first-order-norm.svg", "y/K = 1 − e^(−t/τ)", [(tt, 1 - np.exp(-tt), "", 0, False)], (0, 6), (0, 1.1), range(0, 7), [0, 0.2, 0.4, 0.6, 0.8, 1.0], "t / τ", "y / K",
     hlines=[1.0], legend=False, extra=lambda X, Y: "".join(dot(X, Y, k, 1 - math.exp(-k), f"{k}τ : {100*(1-math.exp(-k)):.1f} %", 8, 18) for k in (1, 2, 3, 4)))

# unit 6: second-order step family against normalised time
tt = np.linspace(0, 12, 600)
fam = []
for i, z in enumerate([0.2, 0.5, 0.707, 1.0, 2.0]):
    _, y = signal.step(signal.TransferFunction([1], [1, 2 * z, 1]), T=tt)
    fam.append((tt, y, f"ζ = {z:g}", i, False))
plot("second-order-family.svg", "G(s) = ωn² / (s² + 2ζωn·s + ωn²)", fam, (0, 12), (0, 1.6), range(0, 13, 2), [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6], "ωn · t", "y(t)", hlines=[1.0])

# unit 9: root locus of K / (s(s+1)(s+5))
branches = [[], [], []]
prev = np.array([0, -1, -5], dtype=complex)
for K in np.concatenate([np.linspace(0, 2, 400), np.linspace(2, 120, 1200)]):
    rts = np.roots([1, 6, 5, K])
    order = []
    left = list(rts)
    for p in prev:
        j = int(np.argmin([abs(p - q) for q in left]))
        order.append(left.pop(j))
    prev = np.array(order)
    for b_, q in zip(branches, order):
        b_.append(q)
rl = [(np.real(b_), np.imag(b_), "", 0, False) for b_ in branches]
plot("root-locus.svg", "L(s) = K / (s(s+1)(s+5))", rl, (-8, 2), (-4, 4), range(-8, 3, 1), range(-4, 5, 1), "Re(s) = σ", "Im(s) = jω", w=720, h=520, legend=False, hlines=[0], vlines=[0],
     extra=lambda X, Y: "".join(cross(X, Y, p, 0) for p in (0, -1, -5)) + dot(X, Y, -0.472, 0, "K = 1.13", -78, 22) + dot(X, Y, 0, 2.236, "K = 30, ω = 2.24", 10, -8) + dot(X, Y, 0, -2.236, "", 0, 0)
     + dot(X, Y, -0.417, 0.722, "ζ = 0.5, K = 3.59", -150, -6, ACC)
     + f'<line x1="{X(0):.1f}" y1="{Y(0):.1f}" x2="{X(-2.31):.1f}" y2="{Y(4):.1f}" stroke="{SIG}" stroke-width="1.3" stroke-dasharray="4 4"/>'
     + f'<line x1="{X(-2):.1f}" y1="{Y(0):.1f}" x2="{X(0.31):.1f}" y2="{Y(4):.1f}" stroke="{INK3}" stroke-width="1" stroke-dasharray="2 4"/>'
     + f'<line x1="{X(-2):.1f}" y1="{Y(0):.1f}" x2="{X(0.31):.1f}" y2="{Y(-4):.1f}" stroke="{INK3}" stroke-width="1" stroke-dasharray="2 4"/>')

# unit 11: Bode plot of 100 / ((s+1)(s+10)) with the straight-line approximation
ww = np.logspace(-1, 3, 400)
G = 100 / ((1j * ww + 1) * (1j * ww + 10))
asym = np.where(ww < 1, 20.0, np.where(ww < 10, 20 - 20 * np.log10(ww), -40 * np.log10(ww / 10)))
plot("bode-mag.svg", "|G(jω)| dB,  G(s) = 100 / ((s+1)(s+10))", [(ww, 20 * np.log10(abs(G)), "exact", 0, False), (ww, asym, "asymptote", 1, True)], (0.1, 1000), (-80, 40),
     [0.1, 1, 10, 100, 1000], range(-80, 41, 20), "ω (rad/s)", "dB", h=340, logx=True, hlines=[0])
plot("bode-phase.svg", "∠G(jω),  G(s) = 100 / ((s+1)(s+10))", [(ww, np.degrees(np.unwrap(np.angle(G))), "", 0, False)], (0.1, 1000), (-180, 0),
     [0.1, 1, 10, 100, 1000], range(-180, 1, 45), "ω (rad/s)", "deg", h=300, logx=True, legend=False)

# unit 12: Bode with margins for L = 5 / (s(s+1)(s+5)) and its Nyquist plot
ww = np.logspace(-1, 2, 500)
L = 5 / ((1j * ww) * (1j * ww + 1) * (1j * ww + 5))
plot("margins-mag.svg", "|L(jω)| dB,  L(s) = 5 / (s(s+1)(s+5))", [(ww, 20 * np.log10(abs(L)), "", 0, False)], (0.1, 100), (-100, 40), [0.1, 1, 10, 100], range(-100, 41, 20), "ω (rad/s)", "dB",
     h=320, logx=True, legend=False, hlines=[0], extra=lambda X, Y: dot(X, Y, 0.779, 0, "ωgc = 0.78", 8, -10) + dot(X, Y, 2.236, -15.56, "GM = 15.6 dB", 10, 4))
plot("margins-phase.svg", "∠L(jω)", [(ww, np.degrees(np.unwrap(np.angle(L))), "", 0, False)], (0.1, 100), (-270, -90), [0.1, 1, 10, 100], range(-270, -89, 45), "ω (rad/s)", "deg",
     h=300, logx=True, legend=False, hlines=[-180], extra=lambda X, Y: dot(X, Y, 0.779, -136.8, "PM = 43.2°", 10, -8) + dot(X, Y, 2.236, -180, "ωpc = 2.24", 10, -8))
ww = np.logspace(-0.45, 2, 600)
L = 5 / ((1j * ww) * (1j * ww + 1) * (1j * ww + 5))
th = np.linspace(0, 2 * math.pi, 200)
plot("nyquist.svg", "L(jω) = 5 / (jω(jω+1)(jω+5)),  ω > 0", [(L.real, L.imag, "L(jω)", 0, False), (np.cos(th), np.sin(th), "|L| = 1", 5, True)], (-2, 1), (-1.5, 1.5), [-2, -1.5, -1, -0.5, 0, 0.5, 1], [-1.5, -1, -0.5, 0, 0.5, 1, 1.5],
     "Re", "Im", w=560, h=560, hlines=[0], vlines=[0], extra=lambda X, Y: cross(X, Y, -1, 0, SIG) + dot(X, Y, -1 / 6, 0, "−1/6", -14, -10) + dot(X, Y, math.cos(math.radians(-136.8)), math.sin(math.radians(-136.8)), "PM", -34, 18)
     + f'<text x="{X(-1)-8:.1f}" y="{Y(0)-12:.1f}" text-anchor="end" font-size="13" fill="{SIG}" {MONO}>−1</text>')

# unit 13: P, PI and PID on 1 / (s(s+1)(s+5)) is harsh; use the plant 1 / ((s+1)(s+2)) to show what each term does
tt = np.linspace(0, 8, 800)
pl = [1, 3, 2]
def cl(kp, ki, kd):
    num = [kd, kp, ki]
    den = np.polyadd(np.polymul(pl, [1, 0]), num)
    return signal.step(signal.TransferFunction(num, den), T=tt)[1]
plot("pid-compare.svg", "G(s) = 1 / ((s+1)(s+2)),  step r = 1", [(tt, cl(10, 0, 0), "P: Kp = 10", 1, False), (tt, cl(10, 8, 0), "PI: Ki = 8", 0, False), (tt, cl(10, 8, 2), "PID: Kd = 2", 2, False)],
     (0, 8), (0, 1.4), range(0, 9), [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4], "t (s)", "y(t)", hlines=[1.0])

# unit 15: sampled first-order response, T = 0.1 s
kk = np.arange(0, 31)
yk = 1 - 0.9048 ** kk
plot("zoh-steps.svg", "y[k] = 1 − 0.9048^k,  T = 0.1 s", [(np.linspace(0, 3, 300), 1 - np.exp(-np.linspace(0, 3, 300)), "y(t)", 1, True), (np.repeat(kk * 0.1, 2)[1:], np.repeat(yk, 2)[:-1], "y[k] (ZOH)", 0, False)],
     (0, 3), (0, 1.1), [0, 0.5, 1, 1.5, 2, 2.5, 3], [0, 0.2, 0.4, 0.6, 0.8, 1.0], "t (s)", "y", hlines=[1.0])

# unit 16: fuzzy membership functions N, Z, P
xx = np.linspace(-15, 15, 301)
N_ = np.clip(-xx / 10, 0, 1)
Z_ = np.clip(1 - abs(xx) / 10, 0, 1)
P_ = np.clip(xx / 10, 0, 1)
plot("fuzzy-mf.svg", "μ(e):  N, Z, P", [(xx, N_, "N", 1, False), (xx, Z_, "Z", 2, False), (xx, P_, "P", 0, False)], (-15, 15), (0, 1.2), range(-15, 16, 5), [0, 0.2, 0.4, 0.6, 0.8, 1.0], "e (°C)", "μ",
     h=340, vlines=[4], extra=lambda X, Y: dot(X, Y, 4, 0.6, "μZ = 0.6", 8, -8) + dot(X, Y, 4, 0.4, "μP = 0.4", 8, 16))
