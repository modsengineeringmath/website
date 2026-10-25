---
title: "What Is a Taylor Series, What Is It Used For, with Examples"
url: https://modsengineeringmath.com/en/blog/what-is-taylor-series/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> What a Taylor series is, the Maclaurin series table to memorise, and 8 worked examples: approximation, expanding about other points, how many terms, integrals, limits and engineering uses.

Markdown copy of https://modsengineeringmath.com/en/blog/what-is-taylor-series/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is a Taylor Series, What Is It Used For, with Examples

THภาษาไทยENEnglish
// Article · Sequences & series


A calculator does not know sin or eˣ directly; it only knows how to add and multiply. A Taylor series turns almost any function into a polynomial that can be computed with additions and multiplications, and it is the reason engineers can write $\sin\theta \approx \theta$ with confidence. This article gives the formula, the table of series worth memorising and 8 worked examples.

30-second summary

- $f(x) = \sum_{k=0}^{\infty} \dfrac{f^{(k)}(a)}{k!}(x - a)^k$ inside the radius of convergence

- Expanding about $a = 0$ gives the Maclaurin series

- Keep n terms to get the Taylor polynomial $P_n(x)$, with error at most $\dfrac{M|x - a|^{n+1}}{(n+1)!}$

## What is a Taylor series?

To find the polynomial that looks most like $f(x)$ near a point $a$, force its value, slope, curvature and every higher derivative at $a$ to match those of $f$. The result is the coefficients $c_k = \dfrac{f^{(k)}(a)}{k!}$ and the series

$$f(x) = f(a) + f'(a)(x - a) + \frac{f''(a)}{2!}(x - a)^2 + \frac{f'''(a)}{3!}(x - a)^3 + \cdots$$

The first two terms $f(a) + f'(a)(x - a)$ are the tangent line, the linearization that engineers use more than any other approximation. Each extra term makes the polynomial follow the function over a wider range.

## How to find a Taylor series: the example of eˣ

Example 1

### Find the Maclaurin series of $e^x$ and approximate $e^{0.5}$ with 5 terms.

- Every derivative of $e^x$ is $e^x$; at $x = 0$ this gives $f^{(k)}(0) = 1$ for every k

- Coefficients $c_k = \dfrac{1}{k!}$: $e^x = 1 + x + \dfrac{x^2}{2!} + \dfrac{x^3}{3!} + \dfrac{x^4}{4!} + \cdots$

- $e^{0.5} \approx 1 + 0.5 + 0.125 + 0.0208333 + 0.0026042 = 1.6484375$

- The true value is $1.6487213$, an error of $2.8\times10^{-4}$. Lagrange bound: $\dfrac{e^{0.5}(0.5)^5}{5!} < \dfrac{1.65\times0.03125}{120} \approx 4.3\times10^{-4}$ ✓

$e^{0.5} \approx 1.6484$ from just 5 terms, and we know in advance that the error is below $4.3\times10^{-4}$.

### The Maclaurin series table to memorise

Doing the same for other functions gives the table below. The right-hand column is where the series converges to the function; outside it the series cannot be used.

| Function | Maclaurin series | Valid for |

| $e^x$ | $1 + x + \dfrac{x^2}{2!} + \dfrac{x^3}{3!} + \cdots$ | all x |

| $\sin x$ | $x - \dfrac{x^3}{3!} + \dfrac{x^5}{5!} - \cdots$ | all x |

| $\cos x$ | $1 - \dfrac{x^2}{2!} + \dfrac{x^4}{4!} - \cdots$ | all x |

| $\dfrac{1}{1 - x}$ | $1 + x + x^2 + x^3 + \cdots$ | $|x| < 1$ |

| $\ln(1 + x)$ | $x - \dfrac{x^2}{2} + \dfrac{x^3}{3} - \cdots$ | $-1 < x \le 1$ |

| $\tan^{-1} x$ | $x - \dfrac{x^3}{3} + \dfrac{x^5}{5} - \cdots$ | $|x| \le 1$ |

| $(1 + x)^{\alpha}$ | $1 + \alpha x + \dfrac{\alpha(\alpha - 1)}{2!}x^2 + \cdots$ | $|x| < 1$ |

Remember the first three rows and the geometric series $1/(1 - x)$, and you can build the rest: integrating $1/(1 + t)$ gives $\ln(1 + x)$, and integrating $1/(1 + t^2)$ gives $\tan^{-1} x$ (see the geometric series formula).

## Approximation examples

Example 2 · The small-angle approximation

### What is the percentage error of $\sin\theta \approx \theta$ at $\theta = 5^\circ$, and how much better is it with the extra term $-\theta^3/6$?

- Convert to radians: $\theta = 5\pi/180 = 0.0872665$. The true value is $\sin 5^\circ = 0.0871557$

- $\sin\theta \approx \theta$ is off by $0.0001107$, or $0.13\%$

- $\theta - \theta^3/6 = 0.0871557$, off by only $4.2\times10^{-8}$

At 5°, $\sin\theta \approx \theta$ is only 0.13% off, but only in radians (see the error table by angle in the trigonometry lesson, in Thai).

Example 3

### Approximate $\cos 0.2$ and $\sqrt{1.02}$ without a calculator.

- $\cos x \approx 1 - \dfrac{x^2}{2} + \dfrac{x^4}{24}$: $\cos 0.2 \approx 1 - 0.02 + 0.0000667 = 0.9800667$ (true 0.9800666)

- $\sqrt{1 + x} \approx 1 + \dfrac{x}{2} - \dfrac{x^2}{8}$: $\sqrt{1.02} \approx 1 + 0.01 - 0.00005 = 1.00995$ (true 1.0099505)

$\cos 0.2 \approx 0.98007$ · $\sqrt{1.02} \approx 1.00995$

## Taylor series about a point other than 0

If the x you need is far from 0, a Maclaurin series needs many terms. Choose instead an expansion point $a$ near x where the function is easy to evaluate; the terms are then powers of $(x - a)$, which is small.

Example 4

### Use the second-order Taylor polynomial of $\sqrt{x}$ about $a = 4$ to approximate $\sqrt{4.1}$, with an error bound.

- $f(x) = x^{1/2},\ f'(x) = \tfrac12 x^{-1/2},\ f''(x) = -\tfrac14 x^{-3/2}$. At $a = 4$: $f = 2,\ f' = \tfrac14,\ f'' = -\tfrac{1}{32}$

- $P_2(x) = 2 + \dfrac{x - 4}{4} - \dfrac{(x - 4)^2}{64}$ (the second-order coefficient is $f''(4)/2! = -1/64$)

- $P_2(4.1) = 2 + 0.025 - 0.00015625 = 2.02484375$. The true value is $2.02484567$, an error of $1.92\times10^{-6}$

- Lagrange bound: $f'''(x) = \tfrac38 x^{-5/2} \le \tfrac38\cdot\tfrac{1}{32}$ on $[4,\ 4.1]$, so $|R_2| \le \dfrac{3/256}{3!}(0.1)^3 \approx 1.95\times10^{-6}$ ✓

$\sqrt{4.1} \approx 2.024844$, correct to 5 decimal places from a polynomial of degree two, because $x - a = 0.1$ is small.

## How many terms? Computing e

Example 5

### How far must the series of $e^x$ go to guarantee that $e = e^1$ is within $5\times10^{-5}$ (correct to 4 decimal places)?

- Lagrange bound at $x = 1$: $|R_n| \le \dfrac{M}{(n+1)!}$ with $M = \max e^c \le e < 3$ on $[0,\ 1]$

- We need $\dfrac{3}{(n+1)!} < 5\times10^{-5}$, that is $(n+1)! > 60\,000$. Since $8! = 40\,320$ is not enough but $9! = 362\,880$ is, $n = 8$

- $\sum_{k=0}^{8} \dfrac{1}{k!} = 2.7182788$. The true value is $2.7182818$, an error of $3.1\times10^{-6}$ ✓

Going up to $x^8/8!$ (9 terms) guarantees it. In fact stopping at $x^7/7!$ already gives an error of only $2.8\times10^{-5}$: the Lagrange bound is a guarantee, so it is usually larger than the actual error.

## New series from the table: integrals and limits

You do not have to differentiate from scratch every time. Substitute, multiply, integrate or differentiate the series in the table term by term (inside the radius of convergence). This lets you evaluate integrals that have no antiderivative in terms of elementary functions.

Example 6 · An integral with no elementary antiderivative

### Approximate $\displaystyle\int_0^1 e^{-x^2}\,dx$.

- Replace $x$ by $-x^2$ in the series of $e^x$: $e^{-x^2} = 1 - x^2 + \dfrac{x^4}{2!} - \dfrac{x^6}{3!} + \dfrac{x^8}{4!} - \cdots$

- Integrate term by term from 0 to 1: $1 - \dfrac13 + \dfrac{1}{10} - \dfrac{1}{42} + \dfrac{1}{216} - \dfrac{1}{1320} + \cdots$

- First five terms: $1 - 0.333333 + 0.1 - 0.023810 + 0.004630 = 0.747487$

- This is an alternating series with decreasing terms, so the error is at most the next term, $1/1320 \approx 7.6\times10^{-4}$. The true value is $0.746824$, an error of $6.6\times10^{-4}$ ✓

$\displaystyle\int_0^1 e^{-x^2}dx \approx 0.7475$. This function has no elementary antiderivative, yet it is at the heart of the normal distribution and the error function used in noise analysis.

Example 7 · A 0/0 limit

### Find $\displaystyle\lim_{x\to0}\frac{\sin x - x}{x^3}$.

- Substitute the series: $\sin x - x = -\dfrac{x^3}{6} + \dfrac{x^5}{120} - \cdots$

- Divide by $x^3$: $-\dfrac16 + \dfrac{x^2}{120} - \cdots \to -\dfrac16$ as $x \to 0$

The limit is $-\tfrac16$. L'Hôpital's rule needs three rounds of differentiation; the Taylor series gives the answer in one line and also tells you that $\sin x$ differs from $x$ by about $x^3/6$.

## Engineering uses

Example 8 · Small-signal diode model

### A diode obeys $i = I_S e^{v/V_T}$ and operates at $I_D = 1\ \text{mA}$, $V_T = 26\ \text{mV}$. If the voltage rises by $\Delta v = 2\ \text{mV}$, what is the current?

- First-order Taylor expansion about the operating point: $i \approx I_D\left(1 + \dfrac{\Delta v}{V_T}\right)$, with small-signal resistance $r_d = V_T/I_D = 26\ \Omega$

- Approximation: $1\ \text{mA}\times(1 + 2/26) = 1.0769\ \text{mA}$

- Exact: $1\ \text{mA}\times e^{2/26} = 1.0800\ \text{mA}$, an error of 0.3%, because $\Delta v$ is much smaller than $V_T$

$\approx 1.077\ \text{mA}$. This is where every small-signal equivalent circuit in electronics comes from.

- Pendulums and control systems $\sin\theta \approx \theta$ turns a nonlinear equation into a linear differential equation that can be solved with Laplace transforms.

- Sensitivity $(1 + x)^n \approx 1 + nx$: a 3% rise in voltage raises the power $V^2/R$ by about 6%.

- Firmware Microcontrollers without a floating-point sine unit use a Taylor polynomial of a few terms over a narrow angle range.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The full Taylor and Maclaurin series lesson: the table to memorise, Lagrange remainder and how many terms (in Thai)

- Power series and the radius of convergence, with a complex-plane disc lab (in Thai)

- Taylor polynomial lab: choose the function, centre and degree (in Thai)

- Next article: Laurent series vs Taylor series

- Finding the nth-derivative formula by induction, for use in Taylor series (in Thai)

- Next article: 14 mathematical induction examples, including an nth-derivative formula

- Next article: how to find the radius of convergence of a power series

- Derivatives, the foundation of Taylor coefficients (in Thai)

## Frequently asked questions

What is the difference between a Taylor series and a Maclaurin series?
A Maclaurin series is a Taylor series expanded about $a = 0$, a special case. The formula is the same with $a = 0$ substituted.

How many terms are enough?
It depends on the accuracy you need and the distance $|x - a|$. Use the Lagrange remainder bound $|R_n| \le M|x - a|^{n+1}/(n+1)!$ and choose n so the bound is below your tolerance. The closer x is to a, the fewer terms you need.

Does a Taylor series work for every x?
Not always, only inside the radius of convergence R. For example $e^x,\ \sin x,\ \cos x$ have $R = \infty$, but $\ln(1 + x)$ and $1/(1 - x)$ have $R = 1$. Outside that range, adding more terms never approaches the true value.

What do engineers use Taylor series for?
To approximate complicated functions with polynomials, for example $\sin\theta \approx \theta$ for pendulums and control systems, linearization about an operating point in small-signal models of diodes and transistors, and computing sin and eˣ on microcontrollers.

## More articles worth reading

Sequences & series
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

Sequences & series
Geometric Series: Formula, Examples and How to Find the Sum
Geometric series formula for the sum of n terms and the infinite sum a₁/(1 − r) when |r| < 1, with the derivation, step-by-step examples, common…
17 Oct 2026Read the article →

Sequences & series
Mathematical Induction Examples with Step-by-Step Solutions, Including Strong Induction
14 worked proof-by-induction examples: writing the induction statement P(n), sums, divisibility, inequalities, recurrences and strong induction,…
17 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**What is the difference between a Taylor series and a Maclaurin series?**
A Maclaurin series is a Taylor series expanded about $a = 0$, a special case. The formula is the same with $a = 0$ substituted.

**How many terms are enough?**
It depends on the accuracy you need and the distance $|x - a|$. Use the Lagrange remainder bound $|R_n| \le M|x - a|^{n+1}/(n+1)!$ and choose n so the bound is below your tolerance. The closer x is to a, the fewer terms you need.

**Does a Taylor series work for every x?**
Not always, only inside the radius of convergence R. For example $e^x,\ \sin x,\ \cos x$ have $R = \infty$, but $\ln(1 + x)$ and $1/(1 - x)$ have $R = 1$. Outside that range, adding more terms never approaches the true value.

**What do engineers use Taylor series for?**
To approximate complicated functions with polynomials, for example $\sin\theta \approx \theta$ for pendulums and control systems, linearization about an operating point in small-signal models of diodes and transistors, and computing sin and eˣ on microcontrollers.
