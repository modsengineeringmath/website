# Static SVG figures for /learn/laplace-transform/why-re-s-positive/ (keys roc-*).
# Usage: python3 scripts/roc_figs.py          fills empty <!--FIG:roc-…--><!--/FIG--> blocks
#        python3 scripts/roc_figs.py --all    redraws every roc- figure
# Reuses the canvas helpers of scripts/math_figs.py (classes from site.css "MATH LABS", light/dark aware).
import cmath, glob, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math_figs import S, Plane, f1  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}


def fig(key):
    def deco(fn):
        FIGS[key] = fn
        return fn
    return deco


def poly(pts, sx, sy):
    d, pen = "", False
    for x, y in pts:
        X, Y = sx(x), sy(y)
        if not (math.isfinite(X) and math.isfinite(Y)) or abs(X) > 5000 or abs(Y) > 5000:
            pen = False
            continue
        d += ("L" if pen else "M") + f"{f1(X)} {f1(Y)}"
        pen = True
    return d


def panel_time(c, x, y, w, h, s, t1, ymax, title, note, cls_fill):
    sx = lambda t: x + t / t1 * w
    sy = lambda v: y + (ymax - v) / ymax * h
    c.rect(x, y, w, h, "mf-bg", 6)
    for k in range(1, int(t1) + 1):
        c.line(sx(k), y, sx(k), y + h, "mf-g")
    c.line(x, sy(0), x + w, sy(0), "mf-ax")
    c.line(x, y, x, y + h, "mf-ax")
    n = 200
    pts = [(t1 * i / n, math.exp(-s * t1 * i / n)) for i in range(n + 1)]
    cid = f"rc{len(c.p)}"
    c.add(f'<clipPath id="{cid}"><rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}"/></clipPath>')
    area = f"M{f1(sx(0))} {f1(sy(0))}" + "".join(f"L{f1(sx(t))} {f1(sy(min(v, ymax * 1.1)))}" for t, v in pts) + f"L{f1(sx(t1))} {f1(sy(0))}Z"
    c.add(f'<g clip-path="url(#{cid})"><path class="{cls_fill}" d="{area}"/><path class="mf-sig" d="{poly(pts, sx, sy)}"/></g>')
    c.text(x + 4, y - 6, title, "mf-h")
    c.text(x + w, y + h + 14, "t", "mf-k", "end")
    c.text(x - 4, sy(1) + 3, "1", "mf-k", "end")
    c.line(x - 3, sy(1), x, sy(1), "mf-ax")
    c.text(x + w / 2, y + h + 30, note, "mf-l", "middle")


def real_panel(s_, title, note, cls, label):
    c = S(250, 240, label)
    panel_time(c, 22, 26, 218, 160, s_, 6, 2.2, title, note, cls)
    return c.svg()


@fig("roc-real-1")
def real1():
    return real_panel(1.0, "s = 1 > 0 : e⁻ᵗ หดลง", "พื้นที่ = 1/s = 1 (จำกัด)", "mf-fill2", "e^(−st) เมื่อ s = 1 หดลง พื้นที่จำกัดเท่ากับ 1")


@fig("roc-real-2")
def real2():
    return real_panel(0.0, "s = 0 : e⁰ = 1 คงที่", "พื้นที่ = T → ∞", "mf-fill", "e^(−st) เมื่อ s = 0 เป็นค่าคงที่ 1 พื้นที่โตไม่สิ้นสุด")


@fig("roc-real-3")
def real3():
    return real_panel(-0.5, "s = −0.5 < 0 : e⁰·⁵ᵗ โต", "พื้นที่ → ∞ (เร็วกว่าเดิม)", "mf-fill", "e^(−st) เมื่อ s = −0.5 โตแบบเอกซ์โพเนนเชียล พื้นที่โตไม่สิ้นสุด")


@fig("roc-splane")
def splane():
    c = S(380, 300, "ระนาบ s: ROC ของ ℒ{1} และ ℒ{u(t)} คือครึ่งระนาบขวา Re s > 0 โพลอยู่ที่ s = 0")
    p = Plane(c, 20, 22, 340, 250, (-3, 3), (-3, 3), title="ROC ของ 1/s : Re s > 0")
    p.roc(0, 1e10)
    p.pole(0, 0)
    p.dot(1.5, 2, "1.5 + 2j ✓ ลู่เข้า", "mf-dot")
    c.circle(p.sx(0), p.sy(1.5), 4.5, "mf-dot2")
    c.text(p.sx(0) + 7, p.sy(1.5) + 4, "1.5j ✗ บนขอบ", "mf-lab")
    p.dot(-1.6, -1.5, None, "mf-dot2")
    c.text(p.sx(-1.6) - 6, p.sy(-1.5) - 8, "−1.6 − 1.5j ✗", "mf-lab", "middle")
    c.text(p.sx(1.5), p.sy(-2.4), "ทุก ω ได้หมด", "mf-l", "middle")
    c.text(p.sx(1.5), p.sy(-2.4) + 14, "ขอให้ σ > 0", "mf-l", "middle")
    return c.svg()


@fig("roc-spiral")
def spiral():
    sig, om = 0.25, 2.0
    c = S(290, 300, "e^(−st) เมื่อ s = 0.25 + 2j บนระนาบเชิงซ้อนเป็นเกลียวหมุนตามเข็มนาฬิกาและหดเข้าหาศูนย์")
    # left: spiral
    x0, y0, W = 20, 30, 250
    k = W / 2.4
    sx = lambda v: x0 + W / 2 + v * k
    sy = lambda v: y0 + W / 2 - v * k
    c.rect(x0, y0, W, W, "mf-bg", 8)
    c.line(x0, sy(0), x0 + W, sy(0), "mf-ax")
    c.line(sx(0), y0, sx(0), y0 + W, "mf-ax")
    c.add(f'<circle class="mf-dash" cx="{f1(sx(0))}" cy="{f1(sy(0))}" r="{f1(k)}"/>')
    pts = [(math.exp(-sig * t) * math.cos(om * t), -math.exp(-sig * t) * math.sin(om * t)) for t in [12 * i / 600 for i in range(601)]]
    c.path(poly(pts, sx, sy), "mf-sig")
    t = 1.1
    z = cmath.exp(-complex(sig, om) * t)
    c.line(sx(0), sy(0), sx(z.real), sy(z.imag), "mf-line")
    c.circle(sx(z.real), sy(z.imag), 4.5, "mf-dot")
    c.circle(sx(1), sy(0), 4, "mf-zero")
    c.text(sx(1) - 4, sy(0) + 16, "t = 0", "mf-k", "end")
    c.text(sx(z.real) + 8, sy(z.imag) + 12, "ความยาว e^(−σt)", "mf-k")
    c.text(x0 + 4, y0 - 8, "e^(−st) = e^(−σt)·e^(−jωt)", "mf-h")
    c.text(x0 + W - 4, y0 + W - 8, "วงประ = วงกลมหนึ่งหน่วย", "mf-k", "end")
    c.text(sx(0) - 5, y0 + 13, "Im", "mf-l", "end")
    c.text(x0 + W - 4, sy(0) - 6, "Re", "mf-l", "end")
    return c.svg()


@fig("roc-spiral-t")
def spiral_t():
    sig, om = 0.25, 2.0
    c = S(410, 300, "ส่วนจริง e^(−0.25t)cos 2t และส่วนจินตภาพ −e^(−0.25t)sin 2t เทียบเวลา ถูกบีบด้วยเส้นห่อ ±e^(−0.25t)")
    X, Y, w, h, t1 = 18, 30, 380, 250, 12
    tx = lambda t: X + t / t1 * w
    ty = lambda v: Y + h / 2 - v * (h / 2.4)
    c.rect(X, Y, w, h, "mf-bg", 8)
    for kk in range(0, t1 + 1, 2):
        c.line(tx(kk), Y, tx(kk), Y + h, "mf-g")
        c.text(tx(kk), Y + h + 13, str(kk), "mf-k", "middle")
    c.line(X, ty(0), X + w, ty(0), "mf-ax")
    ts = [t1 * i / 600 for i in range(601)]
    c.path(poly([(t, math.exp(-sig * t)) for t in ts], tx, ty), "mf-dash")
    c.path(poly([(t, -math.exp(-sig * t)) for t in ts], tx, ty), "mf-dash")
    c.path(poly([(t, math.exp(-sig * t) * math.cos(om * t)) for t in ts], tx, ty), "mf-sig")
    c.path(poly([(t, -math.exp(-sig * t) * math.sin(om * t)) for t in ts], tx, ty), "mf-sig2")
    c.text(X + 4, Y - 8, "เทียบเวลา (s = 0.25 + 2j)", "mf-h")
    c.text(X + w - 6, Y + 16, "e^(−σt)cos ωt (ส่วนจริง)", "mf-l", "end")
    c.text(X + w - 6, Y + 31, "−e^(−σt)sin ωt (ส่วนจินตภาพ)", "mf-l", "end")
    c.add(f'<rect x="{X + w - 196}" y="{Y + 11}" width="12" height="3" style="fill:var(--accent)"/><rect x="{X + w - 214}" y="{Y + 26}" width="12" height="3" style="fill:var(--signal)"/>')
    c.text(X + w - 6, Y + h - 8, "เส้นประ ±e^(−σt) = ขอบเขต (envelope)", "mf-k", "end")
    return c.svg()


def ipanel(c, x, y, w, sig, om, T, title, note):
    s = complex(sig, om)
    ts = [T * i / 1500 for i in range(1501)]
    pts = []
    for t in ts:
        v = (1 - cmath.exp(-s * t)) / s
        pts.append((v.real, v.imag))
    tgt = 1 / s if sig > 0 else None
    xs = [p[0] for p in pts] + [0] + ([tgt.real] if tgt else [])
    ys = [p[1] for p in pts] + [0] + ([tgt.imag] if tgt else [])
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    span = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.2
    k = w / span
    sx = lambda v: x + w / 2 + (v - cx) * k
    sy = lambda v: y + w / 2 - (v - cy) * k
    c.rect(x, y, w, w, "mf-bg", 8)
    if x < sx(0) < x + w:
        c.line(sx(0), y, sx(0), y + w, "mf-ax")
    if y < sy(0) < y + w:
        c.line(x, sy(0), x + w, sy(0), "mf-ax")
    c.path(poly(pts, sx, sy), "mf-sig2")
    c.circle(sx(0), sy(0), 4, "mf-zero")
    if tgt:
        X, Y, r = sx(tgt.real), sy(tgt.imag), 8
        d = "".join(("M" if i == 0 else "L") + f"{f1(X + (r if i % 2 == 0 else r * .45) * math.cos(-math.pi / 2 + i * math.pi / 5))} {f1(Y + (r if i % 2 == 0 else r * .45) * math.sin(-math.pi / 2 + i * math.pi / 5))}" for i in range(10)) + "Z"
        c.add(f'<path d="{d}" style="fill:#d4a017;stroke:var(--ink);stroke-width:.8"/>')
    elif sig == 0:
        ctr = 1 / complex(0, om)
        c.circle(sx(ctr.real), sy(ctr.imag), 4, "mf-dot2")
    c.text(x + 4, y - 8, title, "mf-h")
    for i, line in enumerate(note):
        c.text(x + w / 2, y + w + 16 + i * 15, line, "mf-l", "middle")


def path_fig(sig, title, note, label):
    c = S(250, 290, label)
    ipanel(c, 20, 30, 210, sig, 2, 25, title, note)
    return c.svg()


@fig("roc-path-1")
def path1():
    return path_fig(0.3, "σ = 0.3 > 0 : เกลียวเข้า ★", ["ลู่เข้าหา ★ = 1/s", "= 0.07 − 0.49j"], "I(T) เมื่อ s = 0.3 + 2j เกลียวเข้าหา 1/s")


@fig("roc-path-2")
def path2():
    return path_fig(0.0, "σ = 0 : วงกลมไม่รู้จบ", ["วนรอบจุด 1/(jω) = −0.5j", "รัศมี 1/|ω| ไม่มีลิมิต"], "I(T) เมื่อ s = 2j วนบนวงกลมไม่หยุด")


@fig("roc-path-3")
def path3():
    return path_fig(-0.1, "σ = −0.1 < 0 : เกลียวออก", ["ระยะจากจุดเริ่มโตแบบ", "e^(0.1T) → ∞"], "I(T) เมื่อ s = −0.1 + 2j เกลียวออกไม่สิ้นสุด")


CLS3 = ["mf-s2", "mf-s5", "mf-s4"]


@fig("roc-map-s")
def map_s():
    c = S(340, 290, "ระนาบ s: เส้นตั้ง Re s = 0.5, 1, 2 ใน ROC ของ 1/s")
    p = Plane(c, 20, 30, 300, 240, (-1, 3), (-3, 3), title="ระนาบ s : เส้น Re s = 0.5, 1, 2")
    p.roc(0, 1e10)
    p.pole(0, 0)
    for s0, cl in zip((0.5, 1, 2), CLS3):
        c.line(p.sx(s0), p.y, p.sx(s0), p.y + p.h, cl)
    return c.svg()


@fig("roc-map-w")
def map_w():
    c = S(340, 290, "ระนาบ w = 1/s: เส้นตั้งแต่ละเส้นกลายเป็นวงกลมผ่านจุดกำเนิด จุดศูนย์กลาง 1/(2σ₀)")
    q = Plane(c, 20, 30, 300, 240, (-0.3, 2.3), (-1.04, 1.04), labels=False, title="ระนาบ w = 1/s : กลายเป็นวงกลม")
    c.rect(q.sx(0), q.y, q.x + q.w - q.sx(0), q.h, "mf-roc")
    kx = q.w / (q.xr[1] - q.xr[0])
    ky = q.h / (q.yr[1] - q.yr[0])
    for s0, cl in zip((0.5, 1, 2), CLS3):
        r = 1 / (2 * s0)
        c.add(f'<ellipse class="{cl}" cx="{f1(q.sx(r))}" cy="{f1(q.sy(0))}" rx="{f1(r * kx)}" ry="{f1(r * ky)}"/>')
    for v in (0.5, 1, 2):
        c.text(q.sx(v) + 3, q.sy(0) + 14, f"{v:g}", "mf-k", "start")
    return c.svg()


@fig("roc-bromwich")
def bromwich():
    c = S(380, 300, "เส้นบรอมวิช Re s = γ > 0 สำหรับ 1/s อยู่ใน ROC ทางขวาของโพลที่ 0 เมื่อ t > 0 ปิดเส้นทางด้วยครึ่งวงกลมทางซ้ายซึ่งล้อมโพล ได้เรซิดิว 1")
    p = Plane(c, 20, 22, 340, 250, (-3, 3), (-3, 3), title="เส้นบรอมวิชต้องอยู่ใน ROC (γ > 0)")
    p.roc(0, 1e10)
    g = 1.0
    c.line(p.sx(g), p.y, p.sx(g), p.y + p.h, "mf-brom")
    r = 2.6
    kx = p.w / 6
    ky = p.h / 6
    c.add(f'<path class="mf-arc" d="M{f1(p.sx(g))} {f1(p.sy(r))} A {f1(r * kx)} {f1(r * ky)} 0 0 0 {f1(p.sx(g))} {f1(p.sy(-r))}"/>')
    c.add(f'<path class="mf-arrow" d="M{f1(p.sx(g) - 6)} {f1(p.sy(0.9))} L{f1(p.sx(g))} {f1(p.sy(1.3))} L{f1(p.sx(g) + 6)} {f1(p.sy(0.9))} Z"/>')
    p.pole(0, 0)
    c.text(p.sx(g) + 6, p.sy(2.2), "γ = 1", "mf-lab")
    c.text(p.sx(-1.6), p.sy(2.0), "t > 0 ปิดทางซ้าย", "mf-l", "middle")
    c.text(p.sx(-1.6), p.sy(2.0) + 14, "Res = 1 ⇒ f(t) = 1", "mf-l", "middle")
    return c.svg()


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
        out = re.sub(r"<!--FIG:([\w-]+)-->(<svg[\s\S]*?</svg>)?<!--/FIG-->", rep, src)
        if out != src:
            open(fpath, "w", encoding="utf-8").write(out)
            print("updated", os.path.relpath(fpath, ROOT))


if __name__ == "__main__":
    main()
