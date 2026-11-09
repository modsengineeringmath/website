---
title: "Precalculus: functions, graphs, trigonometry, logarithms, probability and statistics — complete guide (English, Markdown)"
url: https://modsengineeringmath.com/learn/en/precalculus/
markdown_url: https://modsengineeringmath.com/learn/en/precalculus/guide.md
thai_edition: https://modsengineeringmath.com/learn/precalculus/
author: "Teerawut Savangboon (Ajarn Mod) — Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan, Thailand"
site: "Mod's Engineering Mathematics"
language: en
audience: ["High-school students (grades 10–12, Algebra 2 and Precalculus)", "First-year university students reviewing before calculus", "Teachers and tutors", "Self-learners"]
license: "Free to read, link and cite. Please credit Mod's Engineering Mathematics (Ajarn Mod) and link to the page."
published: 2026-11-09
updated: {{updated}}
keywords: [precalculus, functions and graphs, domain and range, graph transformations, polynomial functions, synthetic division, rational functions, asymptotes, inverse functions, exponential functions, compound interest, half-life, logarithms, laws of logarithms, trigonometric functions, unit circle, radians, law of sines, law of cosines, ambiguous case, trigonometric table 0 to 360, sequences, series, sigma notation, permutations, combinations, binomial theorem, conditional probability, Bayes theorem, binomial distribution, statistics, standard deviation, box plot, normal distribution, z table, t table, chi-square table, F table, p-value]
---

# Precalculus — complete guide

> A 17-page English course (overview + 16 chapters) covering the high-school mathematics needed before calculus, built around functions and graphs. It has 154 formulas with reference IDs, 106 step-by-step worked examples whose numbers were checked with SymPy/SciPy, 21 interactive labs that work on a phone, a 0°–360° trigonometric table for all six functions at every degree, and searchable z, t, χ² and F tables. The Thai original, with the same formula IDs and labs, is at https://modsengineeringmath.com/learn/precalculus/

This Markdown file is written for AI assistants, search tools and teachers, so the structure, key formulas, verified numbers and tools of the course can be read in one place. The full text of every page is available as Markdown by adding `index.html.md` to the page URL, and in [llms-full.txt](https://modsengineeringmath.com/llms-full.txt).

---

## 1. One-minute summary

- A function assigns exactly one y to each x. Domain restrictions come from denominators ≠ 0, even roots ≥ 0 and logarithms > 0 (F1–F3).
- Every graph in the course comes from ten parent functions through \(y = a\,f(b(x - h)) + k\): inside the parentheses (horizontal) first, outside (vertical) second (G7–G9).
- Polynomials: end behavior from degree and leading coefficient; zeros of odd multiplicity cross, even multiplicity touch; remainder theorem \(P(c)\) = remainder on division by \(x - c\) (P1–P8).
- Rational functions: cancelled factors give holes, remaining denominator zeros give vertical asymptotes, compare degrees for the horizontal asymptote, degree one higher on top gives a slant asymptote (R2–R5).
- Inverses: the function must be one-to-one; swap x and y and solve; the graphs reflect in y = x (I1–I4).
- Exponentials \(b^x\) grow for b > 1 · \(A = P(1 + r/n)^{nt}\), \(Pe^{rt}\) · a logarithm is an exponent: \(\log_b x = y \iff b^y = x\) (E1–E10, L1–L10).
- Trigonometry: \(P(\theta) = (\cos\theta, \sin\theta)\) on the unit circle; value at any angle = value at the reference angle with the ASTC sign · \(y = A\sin(B(x - C)) + D\) has amplitude |A| and period 2π/B (T1–T12).
- Any triangle: law of sines when a side and its opposite angle are known, law of cosines for SSS and SAS; ambiguous SSA compares a with h = b sin A (K2–K4).
- Arithmetic sequences lie on a line, geometric ones on an exponential; \(S_\infty = a_1/(1 - r)\) when |r| < 1 (Q2–Q8, S3–S5).
- Order matters → \(P(n, r)\), order doesn't → \(\binom nr\) · Bayes reverses a condition · binomial \(\mu = np\) (C1–C11).
- Statistics: σ divides by N, s by n − 1 · quartile position r(n + 1)/4 · \(z = (x - \mu)/\sigma\) · the 68–95–99.7 rule (D1–D9).

## 2. Course structure (chapter 27)

Overview: https://modsengineeringmath.com/learn/en/precalculus/ — syllabus map, a graph-transformation lab, summary formulas H1–H8 and a searchable index of every formula in the course.

| Ch. | Page | URL | Formula IDs | Main content |
|---|---|---|---|---|
| 27.1 | Algebra review | /learn/en/precalculus/algebra/ | A1–A14 | Exponents, radicals, rationalizing, factoring, quadratic formula, discriminant, sum and product of roots, quadratic inequalities, absolute value |
| 27.2 | Functions | /learn/en/precalculus/functions/ | F1–F9 | Relations vs functions, vertical line test, domain, range, piecewise functions, operations, f∘g, average rate of change |
| 27.3 | Graphs & transformations | /learn/en/precalculus/graphs/ | G1–G11 | Slope, forms of a line, parallel and perpendicular, ten parent functions, shifts, stretches, reflections, order of transformations, even and odd |
| 27.4 | Polynomial functions | /learn/en/precalculus/polynomial-functions/ | P1–P11 | End behavior, multiplicity, turning points, long and synthetic division, remainder, factor and rational root theorems, polynomial inequalities |
| 27.5 | Rational functions | /learn/en/precalculus/rational-functions/ | R1–R7 | 1/x and 1/x², holes vs vertical asymptotes, horizontal and slant asymptotes, graphing steps, rational inequalities |
| 27.6 | Inverse functions | /learn/en/precalculus/inverse-functions/ | I1–I7 | One-to-one, horizontal line test, finding f⁻¹, checking by composition, restricting x² and sin x, inverse of a composition |
| 27.7 | Exponential functions | /learn/en/precalculus/exponential-functions/ | E1–E10 | Graphs of bˣ, growth, decay, compound interest, the number e, half-life, RC discharge, exponential equations and inequalities |
| 27.8 | Logarithmic functions | /learn/en/precalculus/logarithmic-functions/ | L1–L10 | Definition, graph, laws, change of base, solving with logs, extraneous solutions, inequalities, pH, decibels, Richter |
| 27.9 | Trigonometric functions | /learn/en/precalculus/trigonometric-functions/ | T1–T12 | Radians, arc and sector, a draggable unit circle, reference angles, ASTC, special angles, sinusoids, tangent graph, inverse trig |
| 27.10 | Applications of trigonometry | /learn/en/precalculus/applications-of-trigonometry/ | K1–K9 | Elevation and depression, law of sines, ambiguous case, law of cosines, Heron, bearings, trig equations, a sin x + b cos x |
| 27.11 | Trig table 0°–360° | /learn/en/precalculus/trig-table/ | V1–V5 | Six functions at every degree, exact values of 16 angles, angle ↔ value lookup, quadrant filters, interpolation |
| 27.12 | Sequences | /learn/en/precalculus/sequences/ | Q1–Q8 | Arithmetic, geometric, means, linear recurrences and fixed points, Fibonacci, first limits |
| 27.13 | Series | /learn/en/precalculus/series/ | S1–S8 | Sigma, Σk Σk² Σk³, arithmetic, geometric and infinite series, repeating decimals, telescoping, savings and loans |
| 27.14 | Counting & probability | /learn/en/precalculus/probability/ | C1–C11 | Multiplication principle, permutations, circular, repeated, combinations, binomial theorem, Pascal, conditional, independence, Bayes, expected value, binomial distribution |
| 27.15 | Statistics | /learn/en/precalculus/statistics/ | D1–D9 | Center, grouped data, σ and s, quartiles, box plots, outliers, z-scores, normal distribution, correlation, regression |
| 27.16 | Statistical tables | /learn/en/precalculus/statistical-tables/ | Z1–Z5 | Φ(z) negative and positive, 0-to-z table, z critical values, t, χ², F (0.05 and 0.01) tables and a p-value calculator |

Every page has a 30-second summary, a formula search box, worked examples with buttons that load the numbers into the lab, common traps, practice problems with hidden answers (practice mode), an FAQ, and a Thai ⇄ English switch to the same page.

## 3. Verified example numbers

- 10,000 at 5% for 10 years: annual 16,288.95 · monthly 16,470.09 · continuous 16,487.21
- Carbon-14 (half-life 5,730 years): 29.83% left after 10,000 years · 25% left at 11,460 years · population growing 3% a year doubles in 23.45 years
- \(3^{2x} = 7 \Rightarrow x \approx 0.8856\) · pH of \([\text{H}^+] = 3.2\times10^{-4}\) ≈ 3.49 · a voltage gain of 50 ≈ 33.98 dB
- Arc of radius 10 cm at 150° = 26.18 cm, sector 130.90 cm² · 220 V 50 Hz mains: \(v \approx 311\sin(100\pi t)\)
- 32° elevation at 50 m → 31.24 m · 12° depression from 60 m → 282.28 m · AAS (40°, 60°, a = 10) → b 13.47, c 15.32
- SSA a = 7, b = 10, A = 40° → two triangles, c ≈ 10.43 and 4.89 · SAS 8, 11, 52° → 8.75 km · sides 7, 8, 9 → area 12√5 ≈ 26.83, largest angle 73.40° · 30 km on 060° then 40 km on 150° → 50 km on bearing 113.13°
- sin 37.4° by interpolation 0.607354 (true 0.607376) · cos θ = −0.4 → 113.58° and 246.42°
- Saving 1,000 a month at 3% for 5 years → 64,646.71 · borrowing 500,000 at 6% for 5 years → payment 9,666.40
- Guessing 10 four-option questions, at least 6 right ≈ 0.0197 · test with 1% prevalence, 95% sensitivity, 5% false positives → P(ill | +) ≈ 0.161
- Data 12, 15, 11, 18, 15, 20, 14: σ ≈ 2.928, s ≈ 3.162 · grouped scores of 40 students: mean 68.25, median 67.83 · regression ŷ = 47.79 + 4.13x, r ≈ 0.994
- Normal μ = 165, σ = 6: P(X > 177) ≈ 0.0228, P(159 < X < 171) ≈ 0.6827 · top 10% for μ = 70, σ = 8 ≈ 80.25
- t₀.₀₂₅,₁₅ = 2.131 (t = 2.0 → p ≈ 0.064) · 95% CI (n = 25, x̄ = 120, s = 15) = (113.81, 126.19) · χ²₀.₀₅(5) = 11.070 (χ² = 4.2 → p ≈ 0.52) · F₀.₀₅(10, 12) = 2.75 (F = 2.4 → p ≈ 0.077)

## 4. Labs and tools (21, all in the browser, nothing to install)

| Lab | Page | What it does |
|---|---|---|
| Graph transformations (2 places) | overview, 27.3 | Ten parent functions, drag a b h k, compare with the parent graph |
| Parabola | 27.1 | a b c → vertex, roots, discriminant and quadratic inequalities |
| Functions | 27.2 | Type any f and g; see f+g, f·g, f/g, f∘g, g∘f and the secant line of the average rate |
| Polynomials | 27.4 | Build from zeros with multiplicity, or step through synthetic division |
| Rational functions | 27.5 | Holes, every kind of asymptote, intercepts and a sign chart |
| Inverses | 27.6 | f and f⁻¹ reflected in y = x, drag a horizontal line and count intersections |
| Exponentials | 27.7 | Graph mode, interest mode (EAR, doubling time), half-life mode |
| Logarithms | 27.8 | bˣ/log pair, an exact log calculator, solving \(A b^{kx} = C\) |
| Unit circle | 27.9 | Drag the angle; sin, cos, tan, reference angle and the traced waves |
| Sinusoids | 27.9 | A B C D for sin, cos and tan with amplitude, period and phase |
| Triangle solver | 27.10 | SSS SAS ASA AAS SSA drawn to scale, including two-solution cases |
| Trig lookup | 27.11 | Angle (degrees, DMS, radians) → six values, or value → every angle, with a link to the table row |
| Sequences | 27.12 | Points (n, aₙ) for arithmetic, geometric and recursive sequences with the fixed-point line |
| Series | 27.13 | Terms and partial sums, an exact sigma calculator, savings and loan balance graphs |
| Counting | 27.14 | nPr, nCr, big factorials (BigInt), Pascal rows, arrangements of repeated letters |
| Probability simulator | 27.14 | Coins, dice and sums of 7, with relative frequencies converging |
| Binomial | 27.14 | B(n, p) for =, ≤, ≥ and between, with an overlaid normal curve |
| Statistics | 27.15 | Paste data from a spreadsheet → center, σ, s, quartiles, histogram, box plot, frequency table |
| Normal distribution | 27.15 | Left, right, between and outside areas, and values from percentiles |
| Regression | 27.15 | Paste pairs → regression line, r, r² and predictions |
| p-values and critical values | 27.16 | z, t, χ², F at any degrees of freedom, one or two tails, with a shaded graph |

All tables were recomputed with NumPy/SciPy: trig to 6 places · z to 4 · t and χ² to 3 · F to 2. Headers stay in place while scrolling, and each table has a search box that highlights the cell.

## 5. Short links

/en/precalculus · /en/trig-table · /en/unit-circle · /en/triangle-solver · /en/statistical-tables · /en/z-table · /en/t-table · /en/chi-square-table · /en/f-table · Thai edition /precalculus

## 6. FAQ

**What is precalculus?** The mathematics you need to be fluent in before calculus: algebra, functions and graphs, exponentials, logarithms, trigonometry, sequences, series and the basics of probability and statistics.

**In what order should I study?** 27.1 → 27.16 in order. To prepare for calculus, focus on 27.2–27.9 and 27.12; to prepare for statistics, continue from 27.7 to 27.14–27.16.

**How detailed are the trig and z tables?** The trig table covers every degree from 0° to 360° for all six functions to six decimal places; the z tables include Φ(z) from −3.49 to 3.49 and the area from 0 to z.

**Is there a Thai edition?** Yes. Every page has a Thai twin at /learn/precalculus/… with the same formula IDs, examples and labs; switch with the ไทย / EN button.
