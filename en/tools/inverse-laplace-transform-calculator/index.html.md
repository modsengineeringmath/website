---
title: "Inverse Laplace Transform Calculator: Partial Fractions, Step by Step"
url: https://modsengineeringmath.com/en/tools/inverse-laplace-transform-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Find f(t) from F(s) online, free. Partial fractions are worked step by step for real, repeated and complex-conjugate poles, improper fractions and time delays e^{-as}, with a graph of f(t) and a numerical check of the answer.

Markdown copy of https://modsengineeringmath.com/en/tools/inverse-laplace-transform-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Inverse Laplace Transform Calculator: Partial Fractions, Step by Step

THภาษาไทยENEnglish
// Tool · Inverse Laplace Calculator


Type $F(s)$ as a ratio of polynomials and get $f(t)$ with the partial-fraction working: long division when needed, factoring the denominator, finding the coefficients, and inverting term by term. The result is checked by transforming the answer numerically and comparing it with $F(s)$.

## Calculator

This calculator needs JavaScript.

## How to type F(s)

- Use the variable s and put brackets around numerator and denominator: (s+3)/((s+1)(s+2)^2).

- An expanded denominator is fine: 1/(s^2+2s+5). The poles are found for you.

- Write a time delay as e^(-2s) in front: e^(-2s)/(s(s+1)).

- Several terms can be added: 1/s - e^(-s)/s.

## The partial-fraction method

If the numerator's degree is not lower than the denominator's, divide first. Then factor the denominator and write one group of fractions for each kind of pole.

| Kind of pole | Term in $F(s)$ | Term in $f(t)$ |

| Simple real pole at $s = p$ | $\dfrac{A}{s-p}$ | $Ae^{pt}$ |

| Real pole repeated $m$ times | $\dfrac{A_k}{(s-p)^{k}}$, $k = 1,\dots,m$ | $\dfrac{A_k}{(k-1)!}\,t^{k-1}e^{pt}$ |

| Complex pair $\sigma \pm j\omega$ | $\dfrac{B(s-\sigma) + C\omega}{(s-\sigma)^{2}+\omega^{2}}$ | $e^{\sigma t}(B\cos\omega t + C\sin\omega t)$ |

| Delay $e^{-as}$ | $e^{-as}G(s)$ | $g(t-a)\,u(t-a)$ |

For a simple pole use the cover-up rule $A = \left[(s-p)F(s)\right]_{s=p}$. For a repeated pole use derivatives: $A_k = \dfrac{1}{(m-k)!}\dfrac{d^{\,m-k}}{ds^{\,m-k}}\left[(s-p)^{m}F(s)\right]_{s=p}$.

## A worked example by hand

Find $\mathcal{L}^{-1}\left\{\dfrac{s+3}{(s+1)(s+2)^{2}}\right\}$. Write the partial-fraction form:

$$\frac{s+3}{(s+1)(s+2)^{2}} = \frac{A}{s+1} + \frac{B_1}{s+2} + \frac{B_2}{(s+2)^{2}}$$

$A = \left[\dfrac{s+3}{(s+2)^{2}}\right]_{s=-1} = 2$, $B_2 = \left[\dfrac{s+3}{s+1}\right]_{s=-2} = -1$, $B_1 = \left[\dfrac{d}{ds}\dfrac{s+3}{s+1}\right]_{s=-2} = \left[\dfrac{-2}{(s+1)^{2}}\right]_{s=-2} = -2$.

$$f(t) = 2e^{-t} - 2e^{-2t} - te^{-2t}, \quad t \ge 0$$

## Accuracy and limits

Poles are found numerically and snapped to simple fractions when they match. Irrational roots are shown to four decimal places. After $f(t)$ is found, $\int_0^\infty f(t)e^{-st}\,dt$ is evaluated numerically and compared with $F(s)$; if they disagree, no answer is shown. Only ratios of polynomials (optionally times $e^{-as}$) are accepted. Functions such as $\dfrac{1}{\sqrt{s}}$ or $\ln s$ are out of scope.

## Learn the theory

- Article: inverse Laplace by partial fractions

- Laplace transform calculator (forward)

- Laplace transform table

- Inverse Laplace lesson (in Thai)

## Frequently asked questions

What do complex poles give?
A conjugate pair σ ± jω gives e^{σt}(B cos ωt + C sin ωt). The calculator also writes it in amplitude–phase form, M e^{σt} cos(ωt + φ).

What if the numerator's degree is too high?
Long division comes first. A constant quotient gives δ(t), and a quotient containing s gives derivatives of δ(t). The calculator does this automatically and shows it in the working.

What does e^{-2s} mean?
A delay of 2 seconds. Invert the rest to get g(t), then replace t with t − 2 and multiply by u(t − 2).

Why is the answer valid only for t ≥ 0?
The one-sided Laplace transform is defined from t = 0 to infinity, so the result holds for t ≥ 0 and f(t) is taken as 0 for t

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
Area calculator
Power factor calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**What do complex poles give?**
A conjugate pair σ ± jω gives e^{σt}(B cos ωt + C sin ωt). The calculator also writes it in amplitude–phase form, M e^{σt} cos(ωt + φ).

**What if the numerator's degree is too high?**
Long division comes first. A constant quotient gives δ(t), and a quotient containing s gives derivatives of δ(t). The calculator does this automatically and shows it in the working.

**What does e^{-2s} mean?**
A delay of 2 seconds. Invert the rest to get g(t), then replace t with t − 2 and multiply by u(t − 2).

**Why is the answer valid only for t ≥ 0?**
The one-sided Laplace transform is defined from t = 0 to infinity, so the result holds for t ≥ 0 and f(t) is taken as 0 for t < 0.
