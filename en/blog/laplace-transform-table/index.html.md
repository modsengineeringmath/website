---
title: "Laplace Transform Table: The Most Commonly Used Pairs"
url: https://modsengineeringmath.com/en/blog/laplace-transform-table/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> The 15 most common Laplace transform pairs and a table of properties (time shift, frequency shift, derivative, integral, convolution, initial and final value), with tips for remembering them.

Markdown copy of https://modsengineeringmath.com/en/blog/laplace-transform-table/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Laplace Transform Table: The Most Commonly Used Pairs

THภาษาไทยENEnglish
// Article · Laplace Transform Table


A summary of the transform pairs and properties used in almost every circuit and control problem. Every pair is the unilateral Laplace transform ($t \ge 0$), with tips so you do not have to memorise the whole table.

## Table of basic transform pairs

In the table, $a$ and $\omega$ are real constants, $n$ is a positive integer, and every time function is understood to be multiplied by $u(t)$.

| # | $f(t)$, $t \ge 0$ | $F(s)$ |

| 1 | $\delta(t)$ (unit impulse) | $1$ |

| 2 | $1$ or $u(t)$ | $\dfrac{1}{s}$ |

| 3 | $t$ | $\dfrac{1}{s^2}$ |

| 4 | $t^n$ | $\dfrac{n!}{s^{n+1}}$ |

| 5 | $e^{-at}$ | $\dfrac{1}{s+a}$ |

| 6 | $t\,e^{-at}$ | $\dfrac{1}{(s+a)^2}$ |

| 7 | $t^n e^{-at}$ | $\dfrac{n!}{(s+a)^{n+1}}$ |

| 8 | $\sin\omega t$ | $\dfrac{\omega}{s^2+\omega^2}$ |

| 9 | $\cos\omega t$ | $\dfrac{s}{s^2+\omega^2}$ |

| 10 | $e^{-at}\sin\omega t$ | $\dfrac{\omega}{(s+a)^2+\omega^2}$ |

| 11 | $e^{-at}\cos\omega t$ | $\dfrac{s+a}{(s+a)^2+\omega^2}$ |

| 12 | $\sinh at$ | $\dfrac{a}{s^2-a^2}$ |

| 13 | $\cosh at$ | $\dfrac{s}{s^2-a^2}$ |

| 14 | $t\sin\omega t$ | $\dfrac{2\omega s}{(s^2+\omega^2)^2}$ |

| 15 | $t\cos\omega t$ | $\dfrac{s^2-\omega^2}{(s^2+\omega^2)^2}$ |

## Table of commonly used properties

Let $\mathcal{L}\{f(t)\}=F(s)$ and $\mathcal{L}\{g(t)\}=G(s)$.

| Property | Time domain | $s$ domain |

| Linearity | $af(t)+bg(t)$ | $aF(s)+bG(s)$ |

| Frequency shift (multiplying by an exponential) | $e^{-at}f(t)$ | $F(s+a)$ |

| Time shift (delay) | $f(t-T)\,u(t-T)$, $T>0$ | $e^{-sT}F(s)$ |

| First derivative | $f'(t)$ | $sF(s)-f(0)$ |

| Second derivative | $f''(t)$ | $s^2F(s)-sf(0)-f'(0)$ |

| Integral | $\displaystyle\int_0^t f(\tau)\,d\tau$ | $\dfrac{F(s)}{s}$ |

| Multiplication by $t$ | $t\,f(t)$ | $-\dfrac{dF}{ds}$ |

| Convolution | $(f*g)(t)$ | $F(s)\,G(s)$ |

| Initial value | $f(0^+)$ | $\displaystyle\lim_{s\to\infty}sF(s)$ |

| Final value | $f(\infty)$ | $\displaystyle\lim_{s\to0}sF(s)$ (when all poles of $sF$ are in the left half plane) |

## Tips for remembering the table without rote learning

- Three pairs are enough: $1/s$, $1/(s+a)$, $\omega/(s^2+\omega^2)$. The rest can be built from them.

- Seeing $(s+a)$ in place of $s$ means multiplying by $e^{-at}$ in the time domain. For example, replacing $s \to s+a$ in $\omega/(s^2+\omega^2)$ gives pair 10.

- Sine versus cosine: sine has $\omega$ in the numerator (since $\sin 0 = 0$ there is no $s$ term), while cosine has $s$ in the numerator (since $\cos 0 = 1$).

- Multiplying by $t$ means differentiating with respect to $s$ and changing the sign, for example $-\dfrac{d}{ds}\dfrac{1}{s+a}=\dfrac{1}{(s+a)^2}$ gives pair 6.

Using the tip

### Find $\mathcal{L}\{t\cos\omega t\}$ from pair 9

- Multiplying by $t$ means $-\dfrac{d}{ds}$

$$-\frac{d}{ds}\frac{s}{s^2+\omega^2} = -\frac{(s^2+\omega^2) - s(2s)}{(s^2+\omega^2)^2} = \frac{s^2-\omega^2}{(s^2+\omega^2)^2}$$

This matches pair 15 in the table ✓

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The table of 22 transform pairs with regions of convergence (ROC) and a searchable formula index (in Thai)

- Proofs of every property, with an experiment lab (in Thai)

- Use the table to solve differential equations for RC, RL and RLC circuits, with an interactive solver (in Thai)

- Use this table to invert with partial fractions

## Frequently asked questions

When can the final value theorem be used?
$f(\infty)=\lim_{s\to0}sF(s)$ is valid only when all poles of $sF(s)$ lie in the left half of the $s$ plane. If there are poles on the imaginary axis or in the right half plane (for example a sine that oscillates forever) the formula gives a wrong answer.

Does this table apply for t less than 0?
No. This table is for the unilateral Laplace transform, which treats the function as zero for negative time. Every function in the table therefore has an implied factor of $u(t)$.

How do I remember the whole table?
Remember three main pairs first: $1/s$, $1/(s+a)$ and $\omega/(s^2+\omega^2)$. The rest follow from properties: multiplying by $e^{-at}$ replaces $s$ with $s+a$, and multiplying by $t$ means differentiating with respect to $s$ and changing the sign.

## More articles worth reading

Laplace
How to Find the Inverse Laplace Transform: 3 Partial-Fraction Cases with Examples
Invert the Laplace transform with partial fractions for distinct, repeated and complex poles, with checked examples and what to do when the…
16 Oct 2026Read the article →

Laplace
What Is the Laplace Transform and What Is It Used For?
The Laplace transform turns differential equations into algebraic equations. See the definition, the 3-step method, a worked y′ + 3y = 6 example…
16 Oct 2026Read the article →

Sequences & series
What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)
Laurent series vs Taylor series: negative powers, the principal part, the annulus of convergence, types of singularity, residues and the link to…
24 Oct 2026Read the article →

All 3 articles in Laplace Transform → · All articles

## Frequently asked questions

**When can the final value theorem be used?**
$f(\infty)=\lim_{s\to0}sF(s)$ is valid only when all poles of $sF(s)$ lie in the left half of the $s$ plane. If there are poles on the imaginary axis or in the right half plane (for example a sine that oscillates forever) the formula gives a wrong answer.

**Does this table apply for t less than 0?**
No. This table is for the unilateral Laplace transform, which treats the function as zero for negative time. Every function in the table therefore has an implied factor of $u(t)$.

**How do I remember the whole table?**
Remember three main pairs first: $1/s$, $1/(s+a)$ and $\omega/(s^2+\omega^2)$. The rest follow from properties: multiplying by $e^{-at}$ replaces $s$ with $s+a$, and multiplying by $t$ means differentiating with respect to $s$ and changing the sign.
