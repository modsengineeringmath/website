"""Fill the precalculus reference tables (chapter 27) in the Thai and English pages.

Usage:  python3 scripts/pc_tables.py            (then node build.mjs)
Needs:  numpy, scipy, sympy (pip install scipy sympy).
Rewrites every <!--TABLE:key-->…<!--/TABLE--> block found in src/pages/learn/precalculus/*.html and
src/pages/learn/en/precalculus/*.html. Labels follow the language of the file (path contains /en/).

Keys
  pc-trig-exact   exact sin cos tan csc sec cot of the 16 unit-circle angles (sympy, TeX)
  pc-trig-360     sin cos tan cot sec csc for every degree 0°–360°, 6 decimals, radians (id t-<deg> per row)
  pc-z-neg        standard normal Φ(z), z = −3.49 … −0.00                    (table id zNeg)
  pc-z-pos        standard normal Φ(z), z = 0.00 … 3.49                      (table id zPos)
  pc-z-zero       area from 0 to z, z = 0.00 … 3.99 (Thai Grade 12 style)  (table id zZero)
  pc-z-crit       common critical values of z
  pc-t            Student's t critical values (one-tailed α columns)        (table id tTab)
  pc-chi          chi-square critical values (right-tail α columns)         (table id chiTab)
  pc-f05 / pc-f01 F critical values at α = 0.05 / 0.01                      (table ids f05Tab / f01Tab)
All numbers come from scipy.stats (values are mathematical facts computed here, not copied from any book).
"""
import pathlib
import re

import numpy as np
import sympy as sp
from scipy import stats

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = sorted((ROOT / "src/pages/learn/precalculus").glob("*.html")) + sorted((ROOT / "src/pages/learn/en/precalculus").glob("*.html"))


def T(lang, th, en):
    return en if lang == "en" else th


def f6(x):
    if not np.isfinite(x) or abs(x) > 1e9:
        return None
    s = f"{x:.6f}"
    return "0.000000" if s == "-0.000000" else s.replace("-", "−")


def pi_frac(deg):
    q = sp.Rational(deg, 180)
    if q == 0:
        return "0"
    p, d = q.p, q.q
    top = ("" if p == 1 else str(p)) + "π"
    return top if d == 1 else f"{top}/{d}"


def trig_360(lang):
    rows = []
    for d in range(0, 361):
        r = np.radians(d)
        s, c = np.sin(r), np.cos(r)
        if abs(s) < 1e-12:
            s = 0.0
        if abs(c) < 1e-12:
            c = 0.0
        vals = [s, c, s / c if c else np.inf, c / s if s else np.inf, 1 / c if c else np.inf, 1 / s if s else np.inf]
        cells = []
        for v in vals:
            t = f6(v)
            cells.append(f'<td>{t}</td>' if t is not None else f'<td title="{T(lang, "ไม่นิยาม", "undefined")}">—</td>')
        rad = f"{r:.4f}" + (f' <span class="ex">{pi_frac(d)}</span>' if d % 15 == 0 else "")
        cls = ' class="hl"' if d % 30 == 0 or d % 45 == 0 else ""
        rows.append(f'<tr id="t-{d}" data-d="{d}"{cls}><th>{d}°</th><td>{rad}</td>{"".join(cells)}</tr>')
    head = (f'<thead><tr><th>{T(lang, "องศา", "Degrees")}</th><th>{T(lang, "เรเดียน", "Radians")}</th>'
            '<th>sin</th><th>cos</th><th>tan</th><th>cot</th><th>sec</th><th>csc</th></tr></thead>')
    cap = T(lang, "ค่าฟังก์ชันตรีโกณมิติทั้งหกทุก 1° ตั้งแต่ 0° ถึง 360° ปัดเป็นทศนิยม 6 ตำแหน่ง (— = ไม่นิยาม)",
            "All six trigonometric functions for every degree from 0° to 360°, rounded to 6 decimals (— = undefined)")
    return (f'<div class="table-wrap pc-scroll"><table class="pc-st" id="trigTable"><caption class="sr-only">{cap}</caption>'
            f'{head}<tbody>{"".join(rows)}</tbody></table></div>')


def tex_exact(e):
    if e is sp.zoo or e is None:
        return "—"
    e = sp.nsimplify(sp.radsimp(e))
    t = sp.latex(e)
    t = t.replace("\\frac", "\\tfrac")
    return f"\\({t}\\)"


def trig_exact(lang):
    angles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]
    rows = []
    for d in angles:
        a = sp.pi * sp.Rational(d, 180)
        s, c = sp.sin(a), sp.cos(a)
        tn = None if c == 0 else sp.simplify(s / c)
        ct = None if s == 0 else sp.simplify(c / s)
        sc = None if c == 0 else sp.radsimp(1 / c)
        cs = None if s == 0 else sp.radsimp(1 / s)
        rad = "0" if d == 0 else sp.latex(a).replace("\\frac", "\\tfrac")
        cells = "".join(f"<td>{tex_exact(v)}</td>" for v in (s, c, tn, ct, sc, cs))
        q = 0 if d % 90 == 0 else d // 90 + 1
        rows.append(f'<tr><th>{d}°</th><td>\\({rad}\\)</td>{cells}<td>{["—", "I", "II", "III", "IV"][q]}</td></tr>')
    head = (f'<thead><tr><th>θ</th><th>{T(lang, "เรเดียน", "Radians")}</th><th>sin θ</th><th>cos θ</th><th>tan θ</th>'
            f'<th>cot θ</th><th>sec θ</th><th>csc θ</th><th>{T(lang, "จตุภาค", "Quadrant")}</th></tr></thead>')
    return f'<div class="table-wrap"><table class="exact pc-ex">{head}<tbody>{"".join(rows)}</tbody></table></div>'


def z_table(lang, neg):
    rows = []
    tid = "zNeg" if neg else "zPos"
    for i in range(35):
        r = i / 10
        key = (f"-{r:.1f}" if neg else f"{r:.1f}")
        cells = []
        for j in range(10):
            z = (-(r + j / 100)) if neg else (r + j / 100)
            cells.append(f"<td>{stats.norm.cdf(z):.4f}</td>")
        label = ("−" if neg else "") + f"{r:.1f}"
        rows.append(f'<tr data-r="{key}"><th>{label}</th>{"".join(cells)}</tr>')
    if neg:
        rows.reverse()
    head = "<thead><tr><th>z</th>" + "".join(f'<th data-c="0.0{j}">{j / 100:.2f}</th>' for j in range(10)) + "</tr></thead>"
    cap = T(lang, f"พื้นที่ใต้เส้นโค้งปกติมาตรฐานทางซ้ายของ z, Φ(z) = P(Z ≤ z) สำหรับ z {'ติดลบ' if neg else 'เป็นบวก'}",
            f"Area under the standard normal curve to the left of z, Φ(z) = P(Z ≤ z), {'negative' if neg else 'positive'} z")
    return (f'<div class="table-wrap pc-scroll"><table class="pc-st" id="{tid}" data-kind="phi"><caption class="sr-only">{cap}</caption>'
            f'{head}<tbody>{"".join(rows)}</tbody></table></div>')


def z_zero(lang):
    rows = []
    for i in range(40):
        r = i / 10
        cells = "".join(f"<td>{stats.norm.cdf(r + j / 100) - 0.5:.4f}</td>" for j in range(10))
        rows.append(f'<tr data-r="{r:.1f}"><th>{r:.1f}</th>{cells}</tr>')
    head = "<thead><tr><th>z</th>" + "".join(f'<th data-c="0.0{j}">{j / 100:.2f}</th>' for j in range(10)) + "</tr></thead>"
    cap = T(lang, "พื้นที่ใต้เส้นโค้งปกติมาตรฐานจาก 0 ถึง z", "Area under the standard normal curve from 0 to z")
    return (f'<div class="table-wrap pc-scroll"><table class="pc-st" id="zZero" data-kind="zero"><caption class="sr-only">{cap}</caption>'
            f'{head}<tbody>{"".join(rows)}</tbody></table></div>')


def z_crit(lang):
    rows = []
    for conf in (0.80, 0.90, 0.95, 0.98, 0.99, 0.995, 0.999):
        a = 1 - conf
        rows.append(f"<tr><td>{conf * 100:g}%</td><td>{a:.3g}</td><td>{stats.norm.ppf(1 - a / 2):.4f}</td><td>{stats.norm.ppf(1 - a):.4f}</td></tr>")
    head = (f'<thead><tr><th>{T(lang, "ระดับความเชื่อมั่น", "Confidence level")}</th><th>α</th>'
            f'<th>{T(lang, "สองหาง", "Two-tailed")} z<sub>α/2</sub></th><th>{T(lang, "หางเดียว", "One-tailed")} z<sub>α</sub></th></tr></thead>')
    return f'<div class="table-wrap"><table class="pc-st">{head}<tbody>{"".join(rows)}</tbody></table></div>'


DFS_T = list(range(1, 31)) + [40, 50, 60, 80, 100, 120, "inf"]


def t_table(lang):
    alphas = [0.25, 0.20, 0.15, 0.10, 0.05, 0.025, 0.01, 0.005, 0.0025, 0.001, 0.0005]
    rows = []
    for df in DFS_T:
        cells = "".join(f"<td>{(stats.norm.ppf(1 - a) if df == 'inf' else stats.t.ppf(1 - a, df)):.3f}</td>" for a in alphas)
        rows.append(f'<tr data-r="{df}"><th>{"∞" if df == "inf" else df}</th>{cells}</tr>')
    h2 = (f'<tr><th>df \\ α<small>{T(lang, "หางเดียว (สองหาง · ความเชื่อมั่น)", "one tail (two tails · confidence)")}</small></th>'
          + "".join(f'<th data-c="{a:g}">{a:g}<small>{2 * a:g} · {(1 - 2 * a) * 100:g}%</small></th>' for a in alphas) + "</tr>")
    cap = T(lang, "ค่าวิกฤต t ที่มีพื้นที่ทางขวาเท่ากับ α", "Critical values t with right-tail area α")
    return (f'<div class="table-wrap pc-scroll"><table class="pc-st" id="tTab"><caption class="sr-only">{cap}</caption>'
            f'<thead>{h2}</thead><tbody>{"".join(rows)}</tbody></table></div>')


def chi_fmt(x):
    if x < 0.01:
        return np.format_float_positional(x, precision=3, unique=False, fractional=False, trim="-")
    return f"{x:.3f}"


def chi_table(lang):
    alphas = [0.995, 0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005]
    dfs = list(range(1, 31)) + [40, 50, 60, 70, 80, 90, 100]
    rows = []
    for df in dfs:
        cells = "".join(f"<td>{chi_fmt(stats.chi2.ppf(1 - a, df))}</td>" for a in alphas)
        rows.append(f'<tr data-r="{df}"><th>{df}</th>{cells}</tr>')
    head = f'<thead><tr><th>df \\ α</th>' + "".join(f'<th data-c="{a:g}">{a:g}</th>' for a in alphas) + "</tr></thead>"
    cap = T(lang, "ค่าวิกฤตไคกำลังสองที่มีพื้นที่ทางขวาเท่ากับ α", "Chi-square critical values with right-tail area α")
    return (f'<div class="table-wrap pc-scroll"><table class="pc-st" id="chiTab"><caption class="sr-only">{cap}</caption>'
            f'{head}<tbody>{"".join(rows)}</tbody></table></div>')


def f_table(lang, alpha, tid):
    d1s = list(range(1, 11)) + [12, 15, 20, 24, 30, 40, 60, 120, "inf"]
    d2s = list(range(1, 31)) + [40, 60, 120, "inf"]
    rows = []
    for d2 in d2s:
        cells = []
        for d1 in d1s:
            if d1 == "inf" and d2 == "inf":
                v = 1.0
            elif d1 == "inf":
                v = d2 / stats.chi2.ppf(alpha, d2)
            elif d2 == "inf":
                v = stats.chi2.ppf(1 - alpha, d1) / d1
            else:
                v = stats.f.ppf(1 - alpha, d1, d2)
            cells.append(f"<td>{v:.2f}</td>")
        rows.append(f'<tr data-r="{d2}"><th>{"∞" if d2 == "inf" else d2}</th>{"".join(cells)}</tr>')
    head = (f'<thead><tr><th>df₂ \\ df₁</th>' + "".join(f'<th data-c="{d}">{"∞" if d == "inf" else d}</th>' for d in d1s) + "</tr></thead>")
    cap = T(lang, f"ค่าวิกฤต F ที่ระดับนัยสำคัญ α = {alpha} (df₁ = องศาอิสระของตัวเศษ, df₂ = ของตัวส่วน)",
            f"Critical values of F at α = {alpha} (df₁ numerator, df₂ denominator degrees of freedom)")
    return (f'<div class="table-wrap pc-scroll"><table class="pc-st" id="{tid}"><caption class="sr-only">{cap}</caption>'
            f'{head}<tbody>{"".join(rows)}</tbody></table></div>')


BUILDERS = {
    "pc-trig-exact": trig_exact,
    "pc-trig-360": trig_360,
    "pc-z-neg": lambda l: z_table(l, True),
    "pc-z-pos": lambda l: z_table(l, False),
    "pc-z-zero": z_zero,
    "pc-z-crit": z_crit,
    "pc-t": t_table,
    "pc-chi": chi_table,
    "pc-f05": lambda l: f_table(l, 0.05, "f05Tab"),
    "pc-f01": lambda l: f_table(l, 0.01, "f01Tab"),
}

PAT = re.compile(r"<!--TABLE:(pc-[a-z0-9-]+)-->.*?<!--/TABLE-->", re.S)


def main():
    cache = {}
    for f in FILES:
        lang = "en" if "/en/" in f.as_posix() else "th"
        text = f.read_text(encoding="utf-8")

        def sub(m):
            key = m.group(1)
            if key not in BUILDERS:
                raise SystemExit(f"{f}: unknown table key {key}")
            if (key, lang) not in cache:
                cache[(key, lang)] = BUILDERS[key](lang)
            return f"<!--TABLE:{key}-->{cache[(key, lang)]}<!--/TABLE-->"

        new = PAT.sub(sub, text)
        if new != text:
            f.write_text(new, encoding="utf-8")
            print("filled", f.relative_to(ROOT), ", ".join(sorted(set(PAT.findall(new)))))


if __name__ == "__main__":
    main()
