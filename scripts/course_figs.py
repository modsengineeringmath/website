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
