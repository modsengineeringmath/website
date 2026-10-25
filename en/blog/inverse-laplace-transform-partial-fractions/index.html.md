---
title: "How to Find the Inverse Laplace Transform: 3 Partial-Fraction Cases with Examples"
url: https://modsengineeringmath.com/en/blog/inverse-laplace-transform-partial-fractions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> Invert the Laplace transform with partial fractions for distinct, repeated and complex poles, with checked examples and what to do when the numerator degree is too high.

Markdown copy of https://modsengineeringmath.com/en/blog/inverse-laplace-transform-partial-fractions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# How to Find the Inverse Laplace Transform: 3 Partial-Fraction Cases with Examples

THภาษาไทยENEnglish
// Article · Inverse Laplace Transform


After solving an equation in the $s$ domain you get $Y(s)$ as a ratio of polynomials, and the final step is to convert back to $y(t)$. The standard method that works for almost every problem is to split into partial fractions and then use the table. This article divides the work into 3 cases according to the type of pole.

30-second summary

- Factor the denominator → identify the pole type → write the partial fractions → find the coefficients → use the table

- Distinct poles: use cover-up · repeated poles: include every power of $(s+p)^k$ · complex poles: complete the square

- If the numerator degree ≥ the denominator degree, do long division first

## The transform pairs you need

All three cases use this small set of pairs (the full set is in the Laplace transform table).

| $F(s)$ | $f(t)$, $t \ge 0$ |

| $\dfrac{1}{s}$ | $1$ |

| $\dfrac{1}{s+a}$ | $e^{-at}$ |

| $\dfrac{1}{(s+a)^2}$ | $t\,e^{-at}$ |

| $\dfrac{\omega}{(s+a)^2+\omega^2}$ | $e^{-at}\sin\omega t$ |

| $\dfrac{s+a}{(s+a)^2+\omega^2}$ | $e^{-at}\cos\omega t$ |

## Case 1: distinct poles (non-repeated real roots)

If $F(s)=\dfrac{N(s)}{(s+p_1)(s+p_2)}$, it can be written as $\dfrac{A}{s+p_1}+\dfrac{B}{s+p_2}$ where $A = \left[(s+p_1)F(s)\right]_{s=-p_1}$. This is the cover-up method: cover the factor you are interested in, then substitute the value of $s$ into what remains.

Example 1

### Find $\mathcal{L}^{-1}\left\{\dfrac{3s+5}{(s+1)(s+2)}\right\}$

- Find $A$ at the pole $s=-1$: cover $(s+1)$ and substitute $s=-1$

$$A = \frac{3(-1)+5}{(-1)+2} = \frac{2}{1} = 2$$

- Find $B$ at the pole $s=-2$

$$B = \frac{3(-2)+5}{(-2)+1} = \frac{-1}{-1} = 1$$

- Use the table

$$F(s)=\frac{2}{s+1}+\frac{1}{s+2} \;\Rightarrow\; f(t) = 2e^{-t} + e^{-2t}$$

Check: $\dfrac{2}{s+1}+\dfrac{1}{s+2} = \dfrac{2(s+2)+(s+1)}{(s+1)(s+2)} = \dfrac{3s+5}{(s+1)(s+2)}$ ✓

## Case 2: repeated poles

A pole repeated $k$ times needs a term for every power from 1 to $k$. For example $(s+1)^2$ must be written as $\dfrac{B}{s+1}+\dfrac{C}{(s+1)^2}$. If you write only the squared term, the coefficients cannot be matched. The coefficient of the highest power can be found by cover-up, and the remaining terms from derivatives.

$$\text{If } F(s)=\frac{G(s)}{(s+p)^2}: \quad C = G(-p), \quad B = \left.\frac{dG}{ds}\right|_{s=-p}$$

Example 2

### Find $\mathcal{L}^{-1}\left\{\dfrac{1}{s(s+1)^2}\right\}$

- Write the partial-fraction form

$$\frac{1}{s(s+1)^2} = \frac{A}{s}+\frac{B}{s+1}+\frac{C}{(s+1)^2}$$

- Distinct pole at $s=0$: $A = \dfrac{1}{(0+1)^2}=1$

- Repeated pole at $s=-1$: let $G(s)=1/s$, so $C=G(-1)=-1$ and $B=G'(-1)=-\dfrac{1}{s^2}\Big|_{s=-1}=-1$

- Use the table

$$F(s)=\frac{1}{s}-\frac{1}{s+1}-\frac{1}{(s+1)^2} \;\Rightarrow\; f(t)=1-e^{-t}-t\,e^{-t}$$

Check the initial value: $f(0)=1-1-0=0$, which matches the initial value theorem $\lim_{s\to\infty} sF(s)=\lim \dfrac{1}{(s+1)^2}=0$ ✓

## Case 3: complex poles (complete the square)

If the denominator is a quadratic that does not factor into real roots, do not split it into complex numbers. Complete the square to get $(s+a)^2+\omega^2$, then arrange the numerator as $(s+a)$ plus a constant. This matches the cosine and sine pairs with the factor $e^{-at}$.

Example 3

### Find $\mathcal{L}^{-1}\left\{\dfrac{s+3}{s^2+2s+5}\right\}$

- Complete the square in the denominator: $s^2+2s+5=(s+1)^2+2^2$

- Arrange the numerator: $s+3=(s+1)+2$, then split

$$F(s)=\frac{s+1}{(s+1)^2+2^2}+\frac{2}{(s+1)^2+2^2}$$

- Use the table with $a=1$, $\omega=2$

$$f(t)=e^{-t}\cos 2t + e^{-t}\sin 2t = e^{-t}(\cos 2t+\sin 2t)$$

The poles are at $s=-1\pm j2$, so the response is an oscillation at 2 rad/s whose amplitude decays as $e^{-t}$. Because the poles are in the left half plane, the system is stable.

## When the numerator degree is too high

Partial fractions work only for proper fractions. If the numerator degree ≥ the denominator degree, do long division first. A constant quotient is an impulse $\delta(t)$, while a quotient that is a polynomial in $s$ corresponds to derivatives of the impulse, which usually indicates a model that differentiates its input in a physically unrealistic way. Check the problem again.

## Checklist before you hand in the answer

- Substitute $t=0$ and compare with the initial value theorem: $f(0^+)=\lim_{s\to\infty}sF(s)$.

- If all poles of $sF(s)$ are in the left half plane (a distinct pole at $s=0$ in $F(s)$ is fine), compare $f(\infty)$ with $\lim_{s\to0}sF(s)$.

- Add the partial fractions back together; you must recover the original numerator.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The inverse Laplace transform in every case, with a calculator that shows the working (in Thai)

- Pole-zero diagrams and the ROC (in Thai)

- Properties of the Laplace transform: time shift, convolution and more (in Thai)

- Read first: what is the Laplace transform?

## Frequently asked questions

What if the numerator degree is greater than or equal to the denominator degree?
Do polynomial long division first so that a proper fraction remains (numerator degree less than denominator degree). For example, $\dfrac{s^2+1}{s(s+1)} = 1 + \dfrac{-s+1}{s(s+1)}$. The constant 1 becomes an impulse $\delta(t)$ in the time domain.

When does the cover-up method work?
It is the fastest way to find the coefficient of a distinct pole: multiply both sides by $(s+p)$ and substitute $s=-p$. For a repeated pole it works only for the coefficient of the highest-power term; the remaining terms need differentiation or equating coefficients.

Do complex poles always have to be split into partial fractions containing j?
No. For a quadratic with complex roots, complete the square so the denominator has the form $(s+a)^2+\omega^2$, then use the pairs for $e^{-at}\cos\omega t$ and $e^{-at}\sin\omega t$. The result is real from the start.

## More articles worth reading

Laplace
Laplace Transform Table: The Most Commonly Used Pairs
The 15 most common Laplace transform pairs and a table of properties (time shift, frequency shift, derivative, integral, convolution, initial and…
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

**What if the numerator degree is greater than or equal to the denominator degree?**
Do polynomial long division first so that a proper fraction remains (numerator degree less than denominator degree). For example, $\dfrac{s^2+1}{s(s+1)} = 1 + \dfrac{-s+1}{s(s+1)}$. The constant 1 becomes an impulse $\delta(t)$ in the time domain.

**When does the cover-up method work?**
It is the fastest way to find the coefficient of a distinct pole: multiply both sides by $(s+p)$ and substitute $s=-p$. For a repeated pole it works only for the coefficient of the highest-power term; the remaining terms need differentiation or equating coefficients.

**Do complex poles always have to be split into partial fractions containing j?**
No. For a quadratic with complex roots, complete the square so the denominator has the form $(s+a)^2+\omega^2$, then use the pairs for $e^{-at}\cos\omega t$ and $e^{-at}\sin\omega t$. The result is real from the start.
