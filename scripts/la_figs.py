# Static SVG figures for the linear-algebra pages added on 2026-10-25 (rank 7.10, numerical methods 7.11)
# and the five linear-algebra articles (Thai /blog/ and English /en/blog/).
# Usage: python3 scripts/la_figs.py          fills empty <!--FIG:la-…--><!--/FIG--> blocks
#        python3 scripts/la_figs.py --all    redraws every figure this script owns
# Keys start with "la-"; a key ending in "-en" draws English labels. Uses the .mf-* classes in assets/site.css
# (light/dark aware) and narrow viewBoxes (≈ 440 px) so labels stay readable on phones.
import glob, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sr_figs import S, Plot, f1, T  # noqa: E402  (shared drawing helpers)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGS = {}


def fig(*keys):
    def deco(fn):
        for k in keys:
            FIGS[k] = fn
        return fn
    return deco


class LS(S):
    def svg(self):
        lab = self.label.replace('"', "&quot;")
        return f'<svg class="mf sr-fig lnf-fig" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{lab}">' + "".join(self.p) + "</svg>"


# ---------------------------------------------------------------- 3-D helpers (same maths as assets/la-num.js)
def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def plane_poly(n, d, L):
    V = [[L if i & 1 else -L, L if i & 2 else -L, L if i & 4 else -L] for i in range(8)]
    pts = []
    for i in range(8):
        for bit in range(3):
            j = i | (1 << bit)
            if j == i:
                continue
            p, q = V[i], V[j]
            f1_, f2_ = dot(n, p) - d, dot(n, q) - d
            if abs(f1_) < 1e-12:
                pts.append(p)
            if f1_ * f2_ < 0:
                t = f1_ / (f1_ - f2_)
                pts.append([p[k] + t * (q[k] - p[k]) for k in range(3)])
            if abs(f2_) < 1e-12:
                pts.append(q)
    u = []
    for p in pts:
        if not any(sum(abs(p[k] - q[k]) for k in range(3)) < 1e-9 for q in u):
            u.append(p)
    if len(u) < 3:
        return []
    c = [sum(p[k] for p in u) / len(u) for k in range(3)]
    ln = math.sqrt(dot(n, n))
    nn = [x / ln for x in n]
    ax = [1, 0, 0] if abs(nn[0]) < 0.9 else [0, 1, 0]
    e1 = cross(nn, ax)
    l1 = math.sqrt(dot(e1, e1))
    e1 = [x / l1 for x in e1]
    e2 = cross(nn, e1)
    u.sort(key=lambda p: math.atan2(dot([p[k] - c[k] for k in range(3)], e2), dot([p[k] - c[k] for k in range(3)], e1)))
    return u


def clip_line(p0, d, L):
    t0, t1 = -1e9, 1e9
    for i in range(3):
        if abs(d[i]) < 1e-12:
            if p0[i] < -L - 1e-9 or p0[i] > L + 1e-9:
                return None
            continue
        a, b = (-L - p0[i]) / d[i], (L - p0[i]) / d[i]
        if a > b:
            a, b = b, a
        t0, t1 = max(t0, a), min(t1, b)
    if t0 > t1:
        return None
    return [p0[k] + t0 * d[k] for k in range(3)], [p0[k] + t1 * d[k] for k in range(3)]


def projector(cx, cy, s, yaw=-38, tilt=22):
    th, ph = math.radians(yaw), math.radians(tilt)

    def P(p):
        x1 = p[0] * math.cos(th) - p[1] * math.sin(th)
        y1 = p[0] * math.sin(th) + p[1] * math.cos(th)
        up = p[2] * math.cos(ph) + y1 * math.sin(ph)
        depth = y1 * math.cos(ph) - p[2] * math.sin(ph)
        return cx + s * x1, cy - s * up, depth
    return P


def planes_panel(c, cx, cy, s, eqs, title, sub, L=4):
    P = projector(cx, cy, s)
    pp = lambda p: f"{f1(P(p)[0])} {f1(P(p)[1])}"
    V = [[L if i & 1 else -L, L if i & 2 else -L, L if i & 4 else -L] for i in range(8)]
    for i in range(8):
        for bit in range(3):
            j = i | (1 << bit)
            if j != i:
                c.path(f"M{pp(V[i])}L{pp(V[j])}", "mf-g")
    polys = []
    for k, e in enumerate(eqs):
        pts = plane_poly(e[:3], e[3], L)
        if len(pts) >= 3:
            polys.append((sum(P(p)[2] for p in pts) / len(pts), k, pts))
    for _, k, pts in sorted(polys, reverse=True):
        c.path("M" + "L".join(pp(p) for p in pts) + "Z", f"mf-pl{k + 1}")
    for i in range(3):
        for j in range(i + 1, 3):
            n1, n2 = eqs[i][:3], eqs[j][:3]
            dv = cross(n1, n2)
            dd = dot(dv, dv)
            if dd < 1e-10:
                continue
            a1, a2 = eqs[i][3], eqs[j][3]
            n11, n22, n12 = dot(n1, n1), dot(n2, n2), dot(n1, n2)
            c1, c2 = (a1 * n22 - a2 * n12) / dd, (a2 * n11 - a1 * n12) / dd
            p0 = [c1 * n1[k] + c2 * n2[k] for k in range(3)]
            seg = clip_line(p0, dv, L)
            if seg:
                c.path(f"M{pp(seg[0])}L{pp(seg[1])}", "mf-ix")
    c.text(cx, cy + s * 6.6, title, "mf-h", "middle")
    c.text(cx, cy + s * 6.6 + 15, sub, "mf-l", "middle")


# ---------------------------------------------------------------- figures
@fig("la-rank-cases", "la-rank-cases-en")
def rank_cases(lang):
    c = LS(440, 206, T("Three planes: unique point, a common line, or no common point", "สามระนาบ: ตัดที่จุดเดียว ผ่านเส้นเดียวกัน หรือไม่มีจุดร่วม", lang))
    planes_panel(c, 74, 78, 11.5, [[1, 1, 1, 2], [2, -1, 1, 5], [1, 2, -1, -3]], T("one point", "จุดเดียว", lang), "rank 3 · 3")
    planes_panel(c, 220, 78, 11.5, [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, 3]], T("a whole line", "ไม่จำกัด (เส้นตรง)", lang), "rank 2 · 2")
    planes_panel(c, 366, 78, 11.5, [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, 4]], T("no solution", "ไม่มีคำตอบ", lang), "rank 2 · 3")
    return c.svg()


@fig("la-rank-idea", "la-rank-idea-en")
def rank_idea(lang):
    c = LS(440, 200, T("Rank = number of independent directions spanned by the columns", "แรงก์ = จำนวนทิศทางอิสระที่หลักทั้งหมดครอบคลุม", lang))
    panels = [
        (74, [[1, 0.6, 1.2], [-0.7, -0.42, -0.84], [1.6, 0.96, 1.92]], None, "rank 1", T("all on one line", "อยู่บนเส้นเดียว", lang)),
        (220, [[1.6, 0.2, 0.3], [0.2, 1.4, 1.0], [1.8, 1.6, 1.3]], "plane", "rank 2", T("all in one plane", "อยู่บนระนาบเดียว", lang)),
        (366, [[1.6, 0.1, 0.0], [0.1, 1.5, 0.2], [0.2, 0.3, 1.6]], "box", "rank 3", T("fill 3-D space", "กางเต็ม 3 มิติ", lang)),
    ]
    for cx, vecs, extra, title, sub in panels:
        P = projector(cx, 92, 30, yaw=-35, tilt=20)
        pp = lambda p: (P(p)[0], P(p)[1])
        o = pp([0, 0, 0])
        for ax, lab in (([2.1, 0, 0], "x"), ([0, 2.1, 0], "y"), ([0, 0, 2.1], "z")):
            q = pp(ax)
            c.line(o[0], o[1], q[0], q[1], "mf-ax")
            c.text(q[0] + 3, q[1] + 4, lab, "mf-k")
        if extra == "plane":
            a, b = vecs[0], vecs[1]
            corners = [[-0.3 * a[k] - 0.3 * b[k] for k in range(3)], [1.25 * a[k] - 0.3 * b[k] for k in range(3)], [1.25 * a[k] + 1.25 * b[k] for k in range(3)], [-0.3 * a[k] + 1.25 * b[k] for k in range(3)]]
            c.path("M" + "L".join(f"{f1(pp(q)[0])} {f1(pp(q)[1])}" for q in corners) + "Z", "mf-fill2")
        if extra == "box":
            a, b, d = vecs
            pts = {}
            for i in range(8):
                pts[i] = [(a[k] if i & 1 else 0) + (b[k] if i & 2 else 0) + (d[k] if i & 4 else 0) for k in range(3)]
            for i in range(8):
                for bit in range(3):
                    j = i | (1 << bit)
                    if j != i:
                        p1, p2 = pp(pts[i]), pp(pts[j])
                        c.line(p1[0], p1[1], p2[0], p2[1], "mf-dash")
        if extra is None:
            q1, q2 = pp([-1.1 * x for x in vecs[2]]), pp([1.2 * x for x in vecs[2]])
            c.line(q1[0], q1[1], q2[0], q2[1], "mf-dash")
        cls = ["mf-va", "mf-vb", "mf-vc"]
        for k, v in enumerate(vecs):
            q = pp(v)
            c.arrow(o[0], o[1], q[0], q[1], cls[k], head=7)
        c.text(cx, 176, title, "mf-h", "middle")
        c.text(cx, 192, sub, "mf-s", "middle")
    return c.svg()


@fig("la-num-map", "la-num-map-en")
def num_map(lang):
    c = LS(440, 318, T("Map of methods for solving Ax = b", "แผนที่วิธีแก้ระบบสมการ Ax = b", lang))

    def box(x, y, w, h, t1, t2=None, cls="mf-box"):
        c.rect(x, y, w, h, cls, 9)
        if t2:
            c.text(x + w / 2, y + h / 2 - 3, t1, "mf-h", "middle")
            c.text(x + w / 2, y + h / 2 + 12, t2, "mf-s", "middle")
        else:
            c.text(x + w / 2, y + h / 2 + 4, t1, "mf-h", "middle")
    box(160, 8, 120, 34, "A x = b")
    box(16, 64, 190, 40, T("Direct methods", "วิธีตรง (direct)", lang), T("finite number of steps", "จำนวนขั้นแน่นอน", lang), "mf-boxa")
    box(234, 64, 190, 40, T("Iterative methods", "วิธีทำซ้ำ (iterative)", lang), T("refine a guess each sweep", "ปรับค่าเดาทีละรอบ", lang), "mf-boxb")
    c.arrow(200, 42, 111, 63)
    c.arrow(240, 42, 329, 63)
    L = [(T("Gauss + pivoting / LU", "เกาส์ + สลับแถว / LU", lang), T("dense, general · ⅔n³ flops", "หนาแน่น ทั่วไป · ⅔n³", lang)),
         (T("Cholesky A = LLᵀ", "โชเลสกี A = LLᵀ", lang), T("symmetric pos. definite", "สมมาตรบวกแน่นอน", lang)),
         (T("Thomas (TDMA)", "โทมัส (TDMA)", lang), T("tridiagonal · O(n)", "สามแนวทแยง · O(n)", lang))]
    R = [(T("Jacobi", "จาโคบี", lang), T("old values · parallel", "ใช้ค่าเก่า · ขนานได้", lang)),
         (T("Gauss–Seidel", "เกาส์-ไซเดล", lang), T("new values at once", "ใช้ค่าใหม่ทันที", lang)),
         (T("SOR (ω) · CG", "SOR (ω) · CG", lang), T("large sparse systems", "ระบบใหญ่และเบาบาง", lang))]
    for i, (a, b) in enumerate(L):
        y = 120 + i * 50
        box(16, y, 190, 40, a, b)
        c.line(111, y - 10 if i else 104, 111, y, "mf-thin")
    for i, (a, b) in enumerate(R):
        y = 120 + i * 50
        box(234, y, 190, 40, a, b)
        c.line(329, y - 10 if i else 104, 329, y, "mf-thin")
    c.rect(16, 274, 408, 36, "mf-fill2", 9)
    c.text(220, 290, T("Check κ(A): about log₁₀ κ digits may be lost", "ก่อนเชื่อคำตอบ: เลขเงื่อนไข κ(A) บอกหลักที่อาจเสีย", lang), "mf-t", "middle")
    c.text(220, 304, T("iterations converge if diagonally dominant or ρ(T) < 1", "วิธีทำซ้ำลู่เข้าเมื่อทแยงเด่น หรือ ρ(T) < 1", lang), "mf-s", "middle")
    return c.svg()


@fig("la-iter-conv", "la-iter-conv-en")
def iter_conv(lang):
    A = [[4, -1, 1], [4, -8, 1], [-2, 1, 5]]
    b = [7, -21, 15]
    xs = [2, 4, 3]

    def run(gs):
        x = [1.0, 2.0, 2.0]
        out = [max(abs(x[i] - xs[i]) for i in range(3))]
        for _ in range(14):
            y = x[:]
            for i in range(3):
                s = b[i] - sum(A[i][j] * (y[j] if gs else x[j]) for j in range(3) if j != i)
                y[i] = s / A[i][i]
            x = y
            out.append(max(abs(x[i] - xs[i]) for i in range(3)))
        return out
    J, G = run(False), run(True)
    c = LS(440, 250, T("Error after each sweep: Jacobi vs Gauss–Seidel (log scale)", "ความคลาดเคลื่อนแต่ละรอบ: จาโคบีเทียบเกาส์-ไซเดล (สเกล log)", lang))
    p = Plot(c, 46, 14, 380, 196, (0, 14), (-8, 1.5), xt=[0, 2, 4, 6, 8, 10, 12, 14], yt=[-8, -6, -4, -2, 0],
             xl=T("sweep k", "รอบที่ k", lang), yl=T("log₁₀ error", "log₁₀ ความคลาดเคลื่อน", lang))
    pj = [(k, math.log10(max(e, 1e-12))) for k, e in enumerate(J)]
    pg = [(k, math.log10(max(e, 1e-12))) for k, e in enumerate(G) if math.log10(max(e, 1e-12)) >= -8]
    p.poly(pj, "mf-sigd")
    p.poly(pg, "mf-sig")
    for k, v in pg:
        c.circle(p.X(k), p.Y(v), 2.6, "mf-dot")
    lx, ly = p.X(6.4), p.Y(0.7)
    c.line(lx, ly, lx + 24, ly, "mf-sigd")
    c.text(lx + 30, ly + 4, T("Jacobi ρ ≈ 0.335", "จาโคบี ρ ≈ 0.335", lang), "mf-t")
    c.line(lx, ly + 18, lx + 24, ly + 18, "mf-sig")
    c.text(lx + 30, ly + 22, T("Gauss–Seidel ρ = 0.125", "เกาส์-ไซเดล ρ = 0.125", lang), "mf-t")
    c.line(p.X(0), p.Y(-6), p.X(14), p.Y(-6), "mf-dash")
    c.text(p.X(0.2), p.Y(-6) - 5, "10⁻⁶", "mf-k")
    return c.svg()


@fig("la-cramer-cols", "la-cramer-cols-en")
def cramer_cols(lang):
    c = LS(440, 190, T("Cramer's rule: replace one column of A by b", "กฎของคราเมอร์: แทนหลักหนึ่งของ A ด้วย b", lang))
    mats = [("Δ = det A", [["3", "2"], ["1", "−1"]], None, "−5"),
            ("Δₓ", [["7", "2"], ["−1", "−1"]], 0, "−5"),
            ("Δᵧ", [["3", "7"], ["1", "−1"]], 1, "−10")]
    for i, (name, M, rep, val) in enumerate(mats):
        x0 = 20 + i * 142
        c.text(x0 + 56, 22, name, "mf-h", "middle")
        c.path(f"M{x0 + 14} 34 h-6 v72 h6", "mf-ink")
        c.path(f"M{x0 + 98} 34 h6 v72 h-6", "mf-ink")
        for r in range(2):
            for k in range(2):
                cx, cy = x0 + 34 + k * 44, 58 + r * 34
                if rep == k:
                    c.rect(cx - 18, cy - 17, 36, 30, "mf-fill", 6)
                c.text(cx, cy + 4, M[r][k], "mf-t", "middle")
        c.text(x0 + 56, 130, "= " + val, "mf-h", "middle")
    c.text(220, 158, T("system: 3x + 2y = 7,  x − y = −1", "ระบบ: 3x + 2y = 7,  x − y = −1", lang), "mf-l", "middle")
    c.text(220, 178, "x = Δₓ/Δ = 1   ·   y = Δᵧ/Δ = 2", "mf-h", "middle")
    return c.svg()


@fig("la-det-area", "la-det-area-en")
def det_area(lang):
    c = LS(440, 246, T("det A is the area scale factor; scaling every row by k multiplies it by kⁿ", "det A คือตัวคูณพื้นที่ คูณทุกแถวด้วย k ได้ kⁿ เท่า", lang))
    p1 = Plot(c, 26, 14, 186, 170, (-0.5, 4.5), (-0.5, 3.5), xt=[0, 1, 2, 3, 4], yt=[0, 1, 2, 3])
    p1.poly([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)], "mf-dash")
    p1.poly([(0, 0), (3, 1), (4, 3), (1, 2), (0, 0)], "mf-sig")
    c.path("M" + "L".join(f"{f1(p1.X(a))} {f1(p1.Y(b))}" for a, b in [(0, 0), (3, 1), (4, 3), (1, 2)]) + "Z", "mf-fill")
    c.text(p1.X(2), p1.Y(1.5) + 4, T("area 5", "พื้นที่ 5", lang), "mf-h", "middle")
    c.text(p1.x + p1.w / 2, 216, "A = [3 1; 1 2] · det A = 5", "mf-l", "middle")
    p2 = Plot(c, 240, 14, 186, 170, (-0.5, 4.5), (-0.5, 3.5), xt=[0, 1, 2, 3, 4], yt=[0, 1, 2, 3])
    c.path("M" + "L".join(f"{f1(p2.X(a))} {f1(p2.Y(b))}" for a, b in [(0, 0), (2, 0), (2, 2), (0, 2)]) + "Z", "mf-fill2")
    p2.poly([(0, 0), (2, 0), (2, 2), (0, 2), (0, 0)], "mf-sig2")
    p2.poly([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)], "mf-sig")
    c.text(p2.X(1.5), p2.Y(1.5) + 4, "×4", "mf-h", "middle")
    c.text(p2.x + p2.w / 2, 216, "det(2A) = 2²·det A", "mf-l", "middle")
    c.text(220, 238, T("3×3 (volume): det(2A) = 2³ det A", "3×3 (ปริมาตร): det(2A) = 2³ det A", lang), "mf-h", "middle")
    return c.svg()


@fig("la-roadmap", "la-roadmap-en")
def roadmap(lang):
    steps = [
        (T("Matrices", "เมทริกซ์", lang), T("size, +, ×, transpose", "ขนาด บวก คูณ ทรานสโพส", lang), 0),
        (T("Determinants", "ดีเทอร์มิแนนต์", lang), T("Sarrus, cofactors, rules", "ซาร์รัส โคแฟกเตอร์ สมบัติ", lang), 0),
        (T("Inverse & Cramer", "อินเวอร์ส · คราเมอร์", lang), T("2×2 formula, AX = B", "สูตร 2×2 · AX = B", lang), 0),
        (T("Row reduction", "ลดแถว · ระบบสมการ", lang), T("Gauss, Gauss–Jordan", "เกาส์ เกาส์-จอร์แดน", lang), 1),
        (T("Rank", "แรงก์ (ค่าลำดับขั้น)", lang), T("one · infinite · none · k", "เดียว ไม่จำกัด ไม่มี · k", lang), 1),
        (T("Numerical methods", "วิธีเชิงตัวเลข", lang), T("LU, Jacobi, Gauss–Seidel", "LU จาโคบี เกาส์-ไซเดล", lang), 2),
        (T("Eigenvalues, applications", "ค่าเฉพาะ · การประยุกต์", lang), T("circuits, control, vibration", "วงจร ระบบควบคุม การสั่น", lang), 2),
    ]
    lv = [T("school · entrance", "ม.ปลาย · สอบเข้า", lang), T("undergraduate", "ป.ตรี", lang), T("engineering", "งานวิศวกรรม", lang)]
    lvcls = ["mf-boxa", "mf-boxb", "mf-boxc"]
    c = LS(440, 40 + 46 * len(steps), T("Roadmap: matrices and determinants from high school to engineering", "แผนที่การเรียนเมทริกซ์และดีเทอร์มิแนนต์ จาก ม.ปลาย ถึงงานวิศวกรรม", lang))
    c.line(38, 30, 38, 30 + 46 * (len(steps) - 1), "mf-line")
    for i, (a, b, l) in enumerate(steps):
        y = 30 + 46 * i
        c.circle(38, y, 12, "mf-node" + str(l))
        c.text(38, y + 4, str(i + 1), "mf-nodet", "middle")
        c.rect(60, y - 18, 236, 36, lvcls[l], 8)
        c.text(70, y - 3, a, "mf-h")
        c.text(70, y + 12, b, "mf-s")
    for l in range(3):
        idx = [i for i, s in enumerate(steps) if s[2] == l]
        y0, y1 = 30 + 46 * idx[0] - 18, 30 + 46 * idx[-1] + 18
        c.path(f"M304 {f1(y0)} h6 V{f1(y1)} h-6", "mf-thin")
        c.text(316, (y0 + y1) / 2 + 4, lv[l], "mf-s")
    return c.svg()


def main():
    redraw = "--all" in sys.argv
    files = glob.glob(os.path.join(ROOT, "src/pages/**/*.html"), recursive=True)
    pat = re.compile(r"<!--FIG:(la-[a-z0-9-]+)-->(.*?)<!--/FIG-->", re.S)
    count = 0
    for fn in files:
        src = open(fn, encoding="utf8").read()
        if "<!--FIG:la-" not in src:
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
        for k in re.findall(r"<!--FIG:(la-[a-z0-9-]+)-->", open(fn, encoding="utf8").read()):
            if k not in FIGS:
                unknown.add(k)
    if unknown:
        print("unknown keys:", ", ".join(sorted(unknown)))
    print(count, "figure(s) drawn")


if __name__ == "__main__":
    main()
