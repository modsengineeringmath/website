---
title: "How to Find the Radius of Convergence: 3 Methods, Endpoint Checks and the Complex-Plane Reason"
url: https://modsengineeringmath.com/en/blog/radius-of-convergence/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-24
---

> Three ways to find the radius of convergence of a power series (ratio test, root test, nearest complex singularity), plus the endpoint checks for the interval of convergence, with examples.

Markdown copy of https://modsengineeringmath.com/en/blog/radius-of-convergence/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# How to Find the Radius of Convergence: 3 Methods, Endpoint Checks and the Complex-Plane Reason

THภาษาไทยENEnglish
// Article · Sequences & series


A power series is like a polynomial that never ends; it represents a function only on an interval around its centre. Half the width of that interval is the radius of convergence R. This article teaches three ways to find R, the endpoint checks where exams award the marks, and the explanation textbooks rarely give: why R has exactly the value it has.

In 30 seconds

- Method 1, ratio: $R = \lim\left|\dfrac{c_n}{c_{n+1}}\right|$ · Method 2, root: $\dfrac1R = \lim\sqrt[n]{|c_n|}$

- Method 3, complex plane: R = distance from a to the nearest singularity of the function

- Always substitute the endpoints $x = a \pm R$ and test them separately

## What the radius of convergence is

Inside |x − a| < R the series converges absolutely, outside it diverges, and the two endpoints must be checked by hand.

A key theorem says a power series $\sum c_n(x-a)^n$ can behave in only one way: there is a number R (possibly 0 or ∞) such that it converges inside and diverges outside. It never converges in scattered patches, and never only to the right of a. So the job is just to find R and then check the two boundary points.

## Method 1: the ratio test (used most often)

Apply the ratio test to the absolute value of the whole term and solve “limit < 1”. You get R without having to remember whether $c_n$ goes on top or at the bottom.

Example 1

### Find the interval of convergence of $\displaystyle\sum_{n=1}^{\infty}\frac{(x-3)^n}{n\,2^n}$

- $\left|\dfrac{a_{n+1}}{a_n}\right| = \dfrac{|x-3|}{2}\cdot\dfrac{n}{n+1} \to \dfrac{|x-3|}{2} < 1 \iff |x - 3| < 2$ ⇒ $R = 2$

- Endpoint x = 1: $\sum\dfrac{(-1)^n}{n}$ converges (Leibniz) · endpoint x = 5: $\sum\dfrac{1}{n}$ diverges

$R = 2$ · interval of convergence $[1, 5)$

Example 2 · R equals e

### Find the interval of convergence of $\sum\dfrac{n!\,x^n}{n^n}$

- $\left|\dfrac{a_{n+1}}{a_n}\right| = |x|\left(\dfrac{n}{n+1}\right)^n \to \dfrac{|x|}{e}$ ⇒ $R = e$

- At $x = \pm e$ the size of the terms is $\dfrac{n!\,e^n}{n^n} \approx \sqrt{2\pi n} \to \infty$ (Stirling), so both endpoints diverge

$(-e, e)$

## Method 2: the root test (for nested n-th powers)

The Cauchy–Hadamard formula $\dfrac{1}{R} = \limsup\sqrt[n]{|c_n|}$ always works, and it is convenient when the coefficients are raised to the n-th power or have gaps (zero coefficients in between) where the ratio method breaks down.

Example 3

### Find the radius of convergence of $\displaystyle\sum_{n=1}^{\infty}\left(\frac{n}{n+1}\right)^{n^2}x^n$

- $\sqrt[n]{|c_n|} = \left(\dfrac{n}{n+1}\right)^{n} \to \dfrac1e$ ⇒ $R = e$

- At $x = \pm e$: $\left(\dfrac{n}{n+1}\right)^{n^2}e^n \to e^{1/2} \ne 0$, so both endpoints diverge

$(-e, e)$ — the ratio method is much messier here

## Method 3: look from the complex plane (understand why)

Consider $\dfrac{1}{1+x^2} = 1 - x^2 + x^4 - \cdots$. On the real line the function is smooth everywhere and never blows up, yet the series converges only for $|x| < 1$. Why? Because a power series converges on a disc in the complex plane, and the disc grows until it hits the first singularity, which for $\tfrac{1}{1+z^2}$ sits at $z = \pm i$, exactly one unit from the centre.

The disc of convergence of 1/(1+z²) about 0 hits the poles ±i at distance 1; what we see on the real axis is the slice (−1, 1).

Example 4 · no coefficients needed

### What is the radius of convergence of the Taylor series of $f(x) = \dfrac{1}{x^2 - 4x + 13}$ about (a) 0 (b) 2?

- Poles of f: $z^2 - 4z + 13 = 0 \Rightarrow z = 2 \pm 3i$

- (a) Distance from 0: $|2 \pm 3i| = \sqrt{13}$ · (b) distance from 2: $|\pm 3i| = 3$

(a) $R = \sqrt{13} \approx 3.61$ · (b) $R = 3$

This method is an excellent check on Methods 1–2, and it explains why $\tan x$ has radius $\pi/2$ (because $\cos z = 0$ at $z = \pm\pi/2$), while $e^x, \sin x, \cos x$ have no singularities at all and so $R = \infty$.

## Endpoint checklist

- Substitute $x = a + R$ and $x = a - R$ into the series to get two numerical series.

- If the terms do not tend to 0 ⇒ divergence at that endpoint.

- If it has the form $\sum\tfrac{1}{n^p}$, use the p-series result · if the signs alternate, use Leibniz (and test the absolute values if the question asks how it converges).

- Write the interval with the right brackets: ( ) excludes, [ ] includes.

Keep these standard examples for comparison: $\sum x^n$ gives $(-1, 1)$ · $\sum\tfrac{x^n}{n}$ gives $[-1, 1)$ · $\sum\tfrac{x^n}{n^2}$ gives $[-1, 1]$ — the same radius, but all three endpoint behaviours differ.

## Try it in the lab

The radius-of-convergence lab (in Thai) plots the partial sums against the function on the real line, with the disc in the complex plane beside it. Move the degree slider: inside the interval the partial sums hug the function more tightly, outside they swing away. You can also type your own $c_n$.

## Continue in the library (in Thai)

- Power series in full: term-by-term calculus, Abel's theorem, solving differential equations

- Taylor and Maclaurin series: the table to memorise, remainders

- Laurent series: when the centre is a singularity

- Interval-of-convergence problems B7–B10 with solutions

## Frequently asked questions

What is the radius of convergence?
A power series $\sum c_n(x-a)^n$ converges when $|x - a| R$. That number R is the radius of convergence. It can be 0 (convergence only at x = a) or ∞ (convergence for every x).

How is the radius different from the interval of convergence?
The radius is a single number. The interval of convergence is $(a - R, a + R)$ together with whichever endpoints converge, which must be checked separately at x = a − R and x = a + R, so the interval can be open, closed or half-open.

Why can't the ratio test decide the endpoints?
At $|x - a| = R$ the limit of the ratio is exactly 1 every time, which is the inconclusive case. Substitute the endpoint value and use another test such as the p-series, Leibniz or n-th term test.

Can I find the radius without computing coefficients?
Yes, if you know the function the series represents: the radius about a equals the distance from a to the nearest singularity in the complex plane. For $1/(x^2 - 4x + 13)$ the poles are $2 \pm 3i$, so the radius about 0 is $\sqrt{13}$.

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
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**What is the radius of convergence?**
A power series $\sum c_n(x-a)^n$ converges when $|x - a|  R$. That number R is the radius of convergence. It can be 0 (convergence only at x = a) or ∞ (convergence for every x).

**How is the radius different from the interval of convergence?**
The radius is a single number. The interval of convergence is $(a - R, a + R)$ together with whichever endpoints converge, which must be checked separately at x = a − R and x = a + R, so the interval can be open, closed or half-open.

**Why can't the ratio test decide the endpoints?**
At $|x - a| = R$ the limit of the ratio is exactly 1 every time, which is the inconclusive case. Substitute the endpoint value and use another test such as the p-series, Leibniz or n-th term test.

**Can I find the radius without computing coefficients?**
Yes, if you know the function the series represents: the radius about a equals the distance from a to the nearest singularity in the complex plane. For $1/(x^2 - 4x + 13)$ the poles are $2 \pm 3i$, so the radius about 0 is $\sqrt{13}$.
