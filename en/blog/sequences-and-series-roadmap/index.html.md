---
title: "What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series"
url: https://modsengineeringmath.com/en/blog/sequences-and-series-roadmap/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-24
---

> The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and convergence tests to Taylor and Laurent series.

Markdown copy of https://modsengineeringmath.com/en/blog/sequences-and-series-roadmap/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series

THภาษาไทยENEnglish
// Article · Sequences & series


Many students meet sequences and series as dozens of separate formulas and never see that they are one story. This article draws the map first: the whole chapter answers a single question that keeps getting deeper, “what do you get when you add infinitely many numbers?” Each stop on the way has its own question, its main tool and the kind of exam question you will see.

In 30 seconds

- Sequences → series (limit of partial sums) → does it converge? → series with x (power series) → coefficients from derivatives (Taylor) → negative powers allowed (Laurent)

- Two yardsticks to memorise: the geometric series $\sum r^n$ and the p-series $\sum 1/n^p$

- High school stops at the infinite geometric series · Calculus 2 goes to Taylor · engineering mathematics goes to Laurent and the z-transform

## The big picture in one figure

The eight stops of the sequences and series chapter; each uses the results of the one before. Numbers are the lesson page numbers.

Think of filling a bucket one glass at a time. Each glass is a term $a_n$; the water in the bucket after n glasses is the partial sum $S_n$. The question is whether the level settles at some height (converges) or overflows forever (diverges). If each glass is half the previous one, the level stops at a finite height. If the glasses shrink like 1, ½, ⅓, ¼, …, the bucket overflows eventually, even though the glasses also keep getting smaller. That small difference is the heart of the whole chapter.

## Eight stops: the question, the tool and the exam question

1 · SequencesWhat do the terms approach?Arithmetic $a_1 + (n-1)d$ · geometric $a_1r^{n-1}$ · ε–N limits · $(1 + \tfrac{x}{n})^n \to e^x$
2 · SeriesWhat is the total?$\sum ar^n = \tfrac{a}{1-r}$ · telescoping · the harmonic series diverges
3 · TestsDoes it converge (when you cannot sum it)?n-th term · integral · comparison · ratio · root
4 · AlternatingWhat happens with ± signs?Leibniz · $|S - S_N| \le b_{N+1}$ · absolute vs conditional
5 · Power seriesFor which x does it work?$\sum c_n(x-a)^n$ · radius R · check the endpoints
6 · TaylorCan a function be a polynomial?$c_n = f^{(n)}(a)/n!$ · table of eˣ, sin, cos · remainder
7 · LaurentWhat about where the function blows up?Negative powers · annulus · residue $a_{-1}$
8 · EngineeringWhat is it used for?Small angles · diode small-signal model · sin on a chip · z-transform

All lesson pages linked above are in Thai. Stops 1–2 are high-school material; university entrance exams ask for terms, sums and limits of sequences, for example “a geometric sequence has $a_2 = 12,\ a_5 = 96$; find $S_6$” or “write $0.1\overline{23}$ as a fraction”. Stops 3–6 are Calculus 2; exams ask how a series converges, for the interval of convergence, and for limits or approximations using Taylor series. Stops 7–8 are engineering mathematics; exams ask for the Laurent series on a given region, residues and inverse z-transforms.

## Two rulers that measure every series

Almost every convergence test compares an unknown series with one whose behaviour is already known, and there are only two families:

- The geometric series $\sum r^n$ converges ⇔ $|r| < 1$ — the yardstick of the ratio and root tests (if the terms shrink faster than some geometric series, the series converges).

- The p-series $\sum 1/n^p$ converges ⇔ $p > 1$ — the yardstick for ratios of polynomials through the limit comparison test; for example $\dfrac{3n+5}{n^3-2}$ behaves like $\dfrac{3}{n^2}$, so it converges.

Know these two well and the remaining tests become a matter of “finding which one my term looks like”. A step-by-step procedure is in the article How to choose a convergence test.

## What to study, by goal

| Goal | Suggested order | Practice |

| University entrance exam | Sequences → infinite series (sigma notation, geometric, telescoping) | Set A |

| Calculus 2 | Add tests → alternating series → power series → Taylor | Set B |

| Engineering mathematics | Add Laurent → engineering (then the Laplace and z-transforms) | Set C |

All pages in the table are in Thai; the formulas and worked numbers can be followed without reading the text.

## Why engineers should care about series

- The formulas you memorised are first terms of series — $T = 2\pi\sqrt{L/g}$ comes from $\sin\theta \approx \theta$; at a 60° amplitude the true period is 7.3 % longer.

- All of analogue electronics uses small-signal models — a first-degree Taylor polynomial, $r_d = V_T/I_D$.

- A chip computes sin with additions and multiplications — after range reduction a degree-11 polynomial is enough for float32.

- A digital system is stable when a series converges absolutely — $\sum|h[n]| < \infty$, and the z-transform is a Laurent series.

Every example has an interactive lab in Series in engineering (in Thai).

## Common misconceptions

- “The terms go to zero, so the sum is finite.” Wrong: the harmonic series $1 + \tfrac12 + \tfrac13 + \cdots$ diverges (it needs 12,367 terms to pass 10, but never stops growing).

- “The order of addition does not matter.” True only for absolutely convergent series; $1 - \tfrac12 + \tfrac13 - \cdots$ can be rearranged to any sum (try the rearrangement lab).

- “If a function is smooth on the real line, its Taylor series converges everywhere.” $\tfrac{1}{1+x^2}$ has radius 1 because of the complex singularities ±i (read Radius of convergence).

- “A function has one Laurent series.” It has one per annulus (read Laurent vs Taylor).

## Continue in the library (in Thai)

- The full sequences and series chapter: 10 pages and an index of 122 formulas

- Lab bench with 12 tools: partial sums, radius of convergence, Taylor, Laurent

- 60 exam-style problems with solutions and a random problem generator

- One-page summary of sequences and series

## Frequently asked questions

Is sequences and series hard, and where should I start?
The parts where you can find the sum (arithmetic, geometric, sigma notation) are not hard. The hard part is deciding whether a series converges, because you must pick the right tool. Start with sequences and their limits, then the geometric series, which is the yardstick for every convergence test.

How do power series, Taylor series and Laurent series differ?
A power series is any series of the form $\sum c_n (x-a)^n$. A Taylor series is the power series whose coefficients are $f^{(n)}(a)/n!$, so that it represents a function f. A Laurent series also allows negative powers and represents a function around a singularity, on an annulus.

Why do engineers need sequences and series?
To approximate functions by polynomials (small angles, small-signal models), to compute sin and exp on microcontrollers, to analyse digital filters and the z-transform, for Fourier series of signals, and to solve differential equations that have no closed-form solution.

Where can I practise sequences and series problems with solutions?
The sequences and series chapter on this site (in Thai) has 60 exam-style problems at three levels with step-by-step solutions, plus an unlimited random problem generator that checks your answers automatically.

## More articles worth reading

Sequences & series
How to Choose a Convergence Test: an 8-Step Flowchart with an Example at Every Step
Pick the right convergence test the first time: an 8-step flowchart (n-th term, geometric, p-series, telescoping, limit comparison, ratio, root,…
24 Oct 2026Read the article →

Sequences & series
What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)
Laurent series vs Taylor series: negative powers, the principal part, the annulus of convergence, types of singularity, residues and the link to…
24 Oct 2026Read the article →

Sequences & series
How to Find the Radius of Convergence: 3 Methods, Endpoint Checks and the Complex-Plane Reason
Three ways to find the radius of convergence of a power series (ratio test, root test, nearest complex singularity), plus the endpoint checks for…
24 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**Is sequences and series hard, and where should I start?**
The parts where you can find the sum (arithmetic, geometric, sigma notation) are not hard. The hard part is deciding whether a series converges, because you must pick the right tool. Start with sequences and their limits, then the geometric series, which is the yardstick for every convergence test.

**How do power series, Taylor series and Laurent series differ?**
A power series is any series of the form $\sum c_n (x-a)^n$. A Taylor series is the power series whose coefficients are $f^{(n)}(a)/n!$, so that it represents a function f. A Laurent series also allows negative powers and represents a function around a singularity, on an annulus.

**Why do engineers need sequences and series?**
To approximate functions by polynomials (small angles, small-signal models), to compute sin and exp on microcontrollers, to analyse digital filters and the z-transform, for Fourier series of signals, and to solve differential equations that have no closed-form solution.

**Where can I practise sequences and series problems with solutions?**
The sequences and series chapter on this site (in Thai) has 60 exam-style problems at three levels with step-by-step solutions, plus an unlimited random problem generator that checks your answers automatically.
