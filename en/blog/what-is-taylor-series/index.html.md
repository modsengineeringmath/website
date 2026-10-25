---
title: "What Is a Taylor Series, What Is It Used For, with Examples"
url: https://modsengineeringmath.com/en/blog/what-is-taylor-series/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-17
---

> What a Taylor series is: Maclaurin series of eˣ, sin, cos and ln, how to find the coefficients, approximation examples with error bounds, and engineering uses such as small angles and diodes.

Markdown copy of https://modsengineeringmath.com/en/blog/what-is-taylor-series/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is a Taylor Series, What Is It Used For, with Examples

THภาษาไทยENEnglish
// Article · Sequences & series


A calculator does not know sin or eˣ directly; it only knows how to add and multiply. A Taylor series turns almost any function into a polynomial that can be computed with additions and multiplications, and it is the reason engineers can write $\sin\theta \approx \theta$ with confidence.

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

Doing the same for other functions gives the table worth remembering:

$$\begin{aligned} e^x &= 1 + x + \tfrac{x^2}{2!} + \tfrac{x^3}{3!} + \cdots & (R = \infty) \\ \sin x &= x - \tfrac{x^3}{3!} + \tfrac{x^5}{5!} - \cdots & (R = \infty) \\ \cos x &= 1 - \tfrac{x^2}{2!} + \tfrac{x^4}{4!} - \cdots & (R = \infty) \\ \ln(1 + x) &= x - \tfrac{x^2}{2} + \tfrac{x^3}{3} - \cdots & (-1 < x \le 1) \\ (1 + x)^{\alpha} &= 1 + \alpha x + \tfrac{\alpha(\alpha - 1)}{2!}x^2 + \cdots & (|x| < 1) \end{aligned}$$

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

## Engineering uses

Example 4 · Small-signal diode model

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
Mathematical Induction Examples with Step-by-Step Solutions
Worked examples of proof by induction: summation formulas, divisibility and inequalities, using a four-step template with the base case, the…
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
