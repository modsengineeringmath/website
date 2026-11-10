---
title: "Laplace Transform Calculator with Step-by-Step Working and a Built-in Check"
url: https://modsengineeringmath.com/en/tools/laplace-transform-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Find the Laplace transform F(s) of f(t) online, free. Handles tⁿ, e^{at}, sin, cos, sinh, cosh, the unit step u(t−a), the impulse δ(t−a) and their products. Shows the table working, poles and region of convergence, and checks every answer by numerical integration.

Markdown copy of https://modsengineeringmath.com/en/tools/laplace-transform-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Laplace Transform Calculator with Step-by-Step Working and a Built-in Check

THภาษาไทยENEnglish
// Tool · Laplace Transform Calculator


Type a time-domain function $f(t)$ and get $F(s)$ with the working: $f(t)$ written as standard terms, each term transformed from the table, then combined into one fraction. Every answer is compared with the definition $\int_0^\infty f(t)e^{-st}\,dt$ by numerical integration before it is shown.

## Calculator

This calculator needs JavaScript.

## How to type a function

- Use the variable t. Multiplication can be * or implied: 3t, t*cos(2t), e^(-2t)*sin(3t).

- Powers use ^: t^2, cos(t)^2. Roots: sqrt(t). Constant: pi.

- Unit step: u(t-2). Impulse: delta(t-1).

- Coefficients must be numbers. For a symbolic problem such as $e^{-at}$, use the general formulas in the table below.

## The transform table the calculator uses

| $f(t)$, $t \ge 0$ | $F(s)$ | Region of convergence |

| $1$ or $u(t)$ | $\dfrac{1}{s}$ | $\operatorname{Re}(s) > 0$ |

| $t^{n}$ | $\dfrac{n!}{s^{n+1}}$ | $\operatorname{Re}(s) > 0$ |

| $e^{at}$ | $\dfrac{1}{s-a}$ | $\operatorname{Re}(s) > a$ |

| $\sin bt$ | $\dfrac{b}{s^{2}+b^{2}}$ | $\operatorname{Re}(s) > 0$ |

| $\cos bt$ | $\dfrac{s}{s^{2}+b^{2}}$ | $\operatorname{Re}(s) > 0$ |

| $e^{at}\sin bt$ | $\dfrac{b}{(s-a)^{2}+b^{2}}$ | $\operatorname{Re}(s) > a$ |

| $e^{at}\cos bt$ | $\dfrac{s-a}{(s-a)^{2}+b^{2}}$ | $\operatorname{Re}(s) > a$ |

| $t^{n}e^{at}$ | $\dfrac{n!}{(s-a)^{n+1}}$ | $\operatorname{Re}(s) > a$ |

| $\sinh bt$, $\cosh bt$ | $\dfrac{b}{s^{2}-b^{2}}$, $\dfrac{s}{s^{2}-b^{2}}$ | $\operatorname{Re}(s) > |b|$ |

| $\delta(t-a)$ | $e^{-as}$ | all $s$ |

| $f(t-a)\,u(t-a)$ | $e^{-as}F(s)$ | same as $F(s)$ |

| $t^{n}f(t)$ | $(-1)^{n}\dfrac{d^{n}F}{ds^{n}}$ | same as $F(s)$ |

Products of sines and cosines, such as $\cos^{2}t$ or $\sin 2t\cos 3t$, are first turned into sums with trigonometric identities, and then the table applies.

## A worked example by hand

Find $\mathcal{L}\{e^{-2t}\sin 3t\}$. Start from $\mathcal{L}\{\sin bt\} = \dfrac{b}{s^{2}+b^{2}}$ with $b = 3$, then apply the shift on the $s$-axis: multiplying by $e^{at}$ replaces $s$ with $s-a$, here $a = -2$.

$$\mathcal{L}\{e^{-2t}\sin 3t\} = \frac{3}{(s+2)^{2}+9} = \frac{3}{s^{2}+4s+13}$$

The poles are at $s = -2 \pm 3j$. Their real part is negative, so the response oscillates and decays to zero, the pattern of an underdamped second-order system.

## How answers are checked

Once $F(s)$ is found, the calculator picks a real $s$ to the right of every pole, evaluates $\int_0^\infty f(t)e^{-st}\,dt$ with adaptive Gauss–Kronrod quadrature, and compares it with the displayed $F(s)$. They must agree to at least six digits or no answer is shown. Functions outside the table, such as $e^{t^{2}}$ or $\ln t$, are reported as unsupported.

## Learn the theory

- What is the Laplace transform?

- Full Laplace transform table

- Inverse Laplace by partial fractions

- Laplace transform lessons (in Thai)

## Frequently asked questions

What is the Laplace transform?
It maps a function of time f(t) to a function of complex frequency F(s) through F(s) = ∫₀^∞ f(t)e^{−st} dt. Differential equations become algebraic ones, which is why it is used for circuits and control systems.

Why does sin(wt) give an error?
The calculator needs numeric coefficients so that every answer can be checked numerically. Replace w with a number, or use the general formula b/(s²+b²) from the table on this page.

What is the region of convergence?
The set of s for which the defining integral converges. For a signal that starts at t = 0 it is the half-plane to the right of the right-most pole.

Does it handle the unit step and delays?
Yes. Write u(t-a) for a step at t = a. A term such as t·u(t-3) is rewritten in shifted form automatically and gives e^{-3s}(3s+1)/s².

## More calculators

LaTeX equation editor (PNG / SVG)
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
Area calculator
Power factor calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**What is the Laplace transform?**
It maps a function of time f(t) to a function of complex frequency F(s) through F(s) = ∫₀^∞ f(t)e^{−st} dt. Differential equations become algebraic ones, which is why it is used for circuits and control systems.

**Why does sin(wt) give an error?**
The calculator needs numeric coefficients so that every answer can be checked numerically. Replace w with a number, or use the general formula b/(s²+b²) from the table on this page.

**What is the region of convergence?**
The set of s for which the defining integral converges. For a signal that starts at t = 0 it is the half-plane to the right of the right-most pole.

**Does it handle the unit step and delays?**
Yes. Write u(t-a) for a step at t = a. A term such as t·u(t-3) is rewritten in shifted form automatically and gives e^{-3s}(3s+1)/s².
