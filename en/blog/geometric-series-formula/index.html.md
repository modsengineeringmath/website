---
title: "Geometric Series: Formula, Examples and How to Find the Sum"
url: https://modsengineeringmath.com/en/blog/geometric-series-formula/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-17
---

> Geometric series formula for the sum of n terms and the infinite sum a₁/(1 − r) when |r| < 1, with the derivation, step-by-step examples, common mistakes and engineering uses.

Markdown copy of https://modsengineeringmath.com/en/blog/geometric-series-formula/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Geometric Series: Formula, Examples and How to Find the Sum

THภาษาไทยENEnglish
// Article · Sequences & series


A geometric series adds numbers that are multiplied by the same factor each time, such as $2 + 6 + 18 + 54$. There is one formula to remember and one condition to check when the sum goes on forever. This article covers the formula, where it comes from, and the examples that appear most often in exams.

30-second summary

- General term: $a_n = a_1 r^{n-1}$, where $r$ is the common ratio $= a_{n+1}/a_n$

- Sum of n terms: $S_n = a_1\dfrac{1 - r^n}{1 - r}$ for $r \ne 1$

- Infinite series: $S_\infty = \dfrac{a_1}{1 - r}$, valid only when $|r| < 1$

## What is a geometric series?

A geometric sequence is a sequence in which each term is the previous one multiplied by a constant $r$, for example $2, 6, 18, 54, \dots$ with $r = 3$. A geometric series is the sum of those terms, $2 + 6 + 18 + 54 + \cdots$.

To find $r$, divide any term by the one before it. If every pair gives the same value, the sequence is geometric. $r$ can be negative (the signs alternate) or a fraction (the terms shrink).

## Sum of n terms, and where the formula comes from

$$S_n = a_1 + a_1r + a_1r^2 + \cdots + a_1r^{n-1} = a_1\,\frac{1 - r^n}{1 - r},\quad r \ne 1$$

The derivation takes two lines: write $S_n$, then multiply by $r$. You get the same terms shifted by one place.

$$\begin{aligned} S_n &= a_1 + a_1r + \cdots + a_1r^{n-1} \\ rS_n &= \phantom{a_1 + {}} a_1r + \cdots + a_1r^{n-1} + a_1r^n \end{aligned}$$

Subtract: all the middle terms cancel, leaving $S_n - rS_n = a_1 - a_1r^n$, which gives the formula above. When $r > 1$ you can write it as $a_1\dfrac{r^n - 1}{r - 1}$ instead (same value, fewer minus signs).

Example 1

### A geometric sequence has $a_2 = 6$ and $a_5 = 162$. Find $S_6$.

- $\dfrac{a_5}{a_2} = r^3 = \dfrac{162}{6} = 27$, so $r = 3$ and $a_1 = a_2/r = 2$

- $S_6 = 2\cdot\dfrac{3^6 - 1}{3 - 1} = 2\cdot\dfrac{728}{2} = 728$

$S_6 = 728$. Check: $2 + 6 + 18 + 54 + 162 + 486 = 728$ ✓

Example 2 · Count the terms first

### Find the sum $3 + 6 + 12 + \cdots + 768$.

- $a_1 = 3,\ r = 2$. The last term is $3\cdot 2^{n-1} = 768 \Rightarrow 2^{n-1} = 256 = 2^8$, so there are $n = 9$ terms

- $S_9 = 3\cdot\dfrac{2^9 - 1}{2 - 1} = 3(511) = 1533$

$1533$. A common mistake is miscounting n; always find it from $a_n = a_1r^{n-1}$.

## Infinite geometric series

When the sum never stops, look at what $r^n$ in the formula for $S_n$ does as $n \to \infty$. If $|r| < 1$, then $r^n \to 0$ and the sum approaches a finite value.

$$S_\infty = a_1 + a_1r + a_1r^2 + \cdots = \frac{a_1}{1 - r},\qquad |r| < 1$$

| Value of r | Behaviour of the infinite series |

| $|r| < 1$ | Converges, with sum $a_1/(1 - r)$ |

| $r = 1$ | Diverges; the sum grows like $na_1$ |

| $r = -1$ | Diverges; the partial sums oscillate $a_1, 0, a_1, 0, \dots$ |

| $|r| > 1$ | Diverges; the terms grow without bound |

Example 3 · Repeating decimals and negative r

### (a) Write $0.\overline{36}$ as a fraction. (b) Find $8 - 4 + 2 - 1 + \cdots$.

- (a) $0.3636\ldots = 0.36 + 0.0036 + \cdots$ with $a_1 = 0.36,\ r = 0.01$: $\dfrac{0.36}{1 - 0.01} = \dfrac{36}{99} = \dfrac{4}{11}$

- (b) $a_1 = 8,\ r = -\tfrac12$ and $|r| < 1$: $S_\infty = \dfrac{8}{1 + \frac12} = \dfrac{16}{3}$

(a) $\tfrac{4}{11}$ (b) $\tfrac{16}{3}$. By the same reasoning, $0.999\ldots = \tfrac{0.9}{1 - 0.1} = 1$ exactly.

Example 4 · A bouncing ball

### A ball is dropped from a height of 10 m. Each time it hits the floor it bounces back to 60% of its previous height. Find the total distance travelled.

- The first fall is 10 m. After that, every bounce has equal up and down legs: $6 + 3.6 + 2.16 + \cdots$ is a geometric series with $a_1 = 6,\ r = 0.6$

- Total distance $= 10 + 2\cdot\dfrac{6}{1 - 0.6} = 10 + 30 = 40\ \text{m}$

$40\ \text{m}$: infinitely many bounces, but a finite total distance.

## Engineering uses

- Digital filter (EMA) $y[n] = 0.8\,y[n-1] + 0.2\,x[n]$ with a unit step input gives $y[n] = 0.2(1 + 0.8 + \cdots + 0.8^n) = 1 - 0.8^{n+1}$. It reaches 95% at the 14th sample and is stable because $|0.8| < 1$.

- Present value Rooftop solar that saves 12,000 baht a year for 20 years at a 5% discount rate: $PV = 12000\cdot\dfrac{1 - 1.05^{-20}}{0.05} \approx 149{,}547$ baht.

- Power series $\dfrac{1}{1 - x} = 1 + x + x^2 + \cdots$ ($|x| < 1$) is the starting point for the series of $\ln(1 + x)$ and $\arctan x$ in Taylor series.

## Common mistakes

- Using $a_1/(1 - r)$ when $|r| \ge 1$. For example, $1 + 2 + 4 + \cdots$ does not equal $\tfrac{1}{1 - 2} = -1$; it diverges.

- Using the formula when $r = 1$ (division by zero). In that case $S_n = na_1$.

- Miscounting the number of terms, especially when the series starts at $r^0$ versus $r^1$.

- Forgetting that $r$ can be negative: a sequence with alternating signs can still be geometric.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The full geometric sequence and series lesson, with a visual proof (in Thai)

- Sequence lab: explore terms, partial sums and limits interactively (in Thai)

- Infinite series in depth: geometric, telescoping, harmonic and p-series (in Thai)

- Every convergence test for series, with a decision chart and practice game (in Thai)

- Next article: how to choose a convergence test

- Proving the geometric series formula by mathematical induction (in Thai)

## Frequently asked questions

When does an infinite geometric series converge?
Only when $|r|
Can I use the sum formula when r = 1?
No, because the denominator $1 - r = 0$. In that case every term equals $a_1$, so the sum of n terms is simply $n a_1$.

What is the difference between a geometric sequence and a geometric series?
A geometric sequence is the list of numbers $a_1, a_1r, a_1r^2, \dots$; a geometric series is their sum $a_1 + a_1r + a_1r^2 + \cdots$.

Where are geometric series used in engineering?
In the response of digital filters, the present value of projects such as rooftop solar, total distances in repeated reflections, and as the starting point of the power series $\frac{1}{1 - x} = 1 + x + x^2 + \cdots$ used to build Taylor series.

## More articles worth reading

Sequences & series
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

Sequences & series
Mathematical Induction Examples with Step-by-Step Solutions, Including Strong Induction
14 worked proof-by-induction examples: writing the induction statement P(n), sums, divisibility, inequalities, recurrences and strong induction,…
17 Oct 2026Read the article →

Sequences & series
What Is a Taylor Series, What Is It Used For, with Examples
What a Taylor series is, the Maclaurin series table to memorise, and 8 worked examples: approximation, expanding about other points, how many…
17 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**When does an infinite geometric series converge?**
Only when $|r| < 1$, and then its sum is $\dfrac{a_1}{1 - r}$. If $|r| \ge 1$ the terms do not approach zero, so the series diverges.

**Can I use the sum formula when r = 1?**
No, because the denominator $1 - r = 0$. In that case every term equals $a_1$, so the sum of n terms is simply $n a_1$.

**What is the difference between a geometric sequence and a geometric series?**
A geometric sequence is the list of numbers $a_1, a_1r, a_1r^2, \dots$; a geometric series is their sum $a_1 + a_1r + a_1r^2 + \cdots$.

**Where are geometric series used in engineering?**
In the response of digital filters, the present value of projects such as rooftop solar, total distances in repeated reflections, and as the starting point of the power series $\frac{1}{1 - x} = 1 + x + x^2 + \cdots$ used to build Taylor series.
