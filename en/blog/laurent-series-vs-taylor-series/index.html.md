---
title: "What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)"
url: https://modsengineeringmath.com/en/blog/laurent-series-vs-taylor-series/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-24
---

> Laurent series vs Taylor series: negative powers, the principal part, the annulus of convergence, types of singularity, residues and the link to the z-transform, with step-by-step examples.

Markdown copy of https://modsengineeringmath.com/en/blog/laurent-series-vs-taylor-series/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)

THภาษาไทยENEnglish
// Article · Sequences & series


A Taylor series writes a function as an endless polynomial around a point where the function is well behaved. In engineering, though, we usually care about the points where a function blows up, such as the poles of a transfer function. A Laurent series fixes this with one idea: allow negative powers. This article compares the two series visually and ends with the reason electrical engineers use Laurent series every day, through the z-transform.

In 30 seconds

- Taylor: $\sum_{n\ge0} a_n(z-c)^n$ converges on a disc · Laurent: $\sum_{n=-\infty}^{\infty} a_n(z-c)^n$ converges on an annulus

- One function can have several Laurent series, one per annulus

- The coefficient $a_{-1}$ is the residue · the z-transform is a Laurent series about 0

## Side by side

| | Taylor series | Laurent series |

| Form | $\sum_{n=0}^{\infty} a_n(z-c)^n$ | $\sum_{n=-\infty}^{\infty} a_n(z-c)^n$ |

| Region of convergence | Disc $|z - c| < R$ | Annulus $r_1 < |z - c| < r_2$ |

| Requires | f analytic at c | f analytic on the annulus (anything may happen at c) |

| Coefficients | $a_n = f^{(n)}(c)/n!$ | $a_n = \frac{1}{2\pi i}\oint\frac{f(z)}{(z-c)^{n+1}}dz$ |

| How many per function | One per centre c | One per annulus |

| Used for | Approximation, limits, linearisation | Classifying singularities, residues, integrals, the z-transform |

## Why negative powers are needed

Try to expand $\dfrac{e^z}{z^2}$ about 0 as a Taylor series: you cannot, because $f(0)$ is undefined. But divide the series $e^z = 1 + z + \tfrac{z^2}{2} + \cdots$ by $z^2$ and the expansion appears at once:

$$\frac{e^z}{z^2} = \underbrace{\frac{1}{z^2} + \frac{1}{z}}_{\text{principal part}} + \underbrace{\frac12 + \frac{z}{6} + \frac{z^2}{24} + \cdots}_{\text{Taylor-like part}},\qquad 0 < |z| < \infty$$

The first two negative-power terms describe everything that happens near 0: the function blows up like $1/z^2$ (a pole of order 2), and the $1/z$ term has coefficient 1, which is the residue. The rest is an ordinary, harmless power series.

## One function, several series: it is all about the annulus

This is what confuses students most. $f(z) = \dfrac{1}{(z-1)(z-2)}$ has poles at 1 and 2. The circles through the poles split the plane around 0 into three regions, and each region has its own series.

Three regions about 0: (a) the disc |z| < 1 gives the Taylor series, (b) the annulus 1 < |z| < 2, (c) the outside |z| > 2.

There is one trick: split into partial fractions, $f = \dfrac{1}{z-2} - \dfrac{1}{z-1}$, and expand each with the geometric series, where a pole inside the region gives negative powers and a pole outside gives positive powers.

- (a) $|z| < 1$: $f = \tfrac12 + \tfrac34 z + \tfrac78 z^2 + \cdots$ (no negative powers = Taylor)

- (b) $1 < |z| < 2$: $f = \cdots - \tfrac{1}{z^2} - \tfrac{1}{z} - \tfrac12 - \tfrac{z}{4} - \tfrac{z^2}{8} - \cdots$ (both directions)

- (c) $|z| > 2$: $f = \tfrac{1}{z^2} + \tfrac{3}{z^3} + \tfrac{7}{z^4} + \cdots$ (negative powers only)

You can check by substitution: at $z = 1.5$ series (b) converges to $f(1.5) = -4$, but series (a) diverges there, even though f(1.5) is perfectly ordinary. Drag the test point yourself in the Laurent annulus lab (in Thai).

## Reading the type of singularity from the principal part

Removable: bounded · pole: blows up from every direction · essential: the behaviour depends on the direction of approach.

- No negative powers → removable, e.g. $\tfrac{\sin z}{z} = 1 - \tfrac{z^2}{6} + \cdots$

- Finitely many negative powers, highest m → pole of order m, e.g. $\tfrac{\sin z}{z^4} = \tfrac{1}{z^3} - \tfrac{1}{6z} + \cdots$ (order 3)

- Infinitely many negative powers → essential singularity, e.g. $e^{1/z} = 1 + \tfrac1z + \tfrac{1}{2z^2} + \cdots$

## The residue: the one number left after integration

When you integrate a Laurent series around a circle inside its annulus, every term $(z-c)^n$ gives zero except $n = -1$, which gives $2\pi i$. So $\oint f\,dz = 2\pi i\,a_{-1}$; the number $a_{-1}$ is called the residue (what remains). It is also where the “cover-up” trick for partial fractions in the inverse Laplace transform (in Thai) comes from — it is really computing the residue at each pole.

## Why electrical engineers need it: the z-transform

The z-transform of a digital signal, $X(z) = \sum x[n]z^{-n}$, is literally a Laurent series about 0. The signal x[n] is the coefficient of $z^{-n}$, and what signals-and-systems textbooks call the “ROC” is the annulus of convergence. Take $X(z) = \dfrac{z}{z - 0.5}$:

- ROC $|z| > 0.5$ (outside the pole): $X = 1 + 0.5z^{-1} + 0.25z^{-2} + \cdots$ ⇒ $x[n] = 0.5^n u[n]$, a right-sided signal

- ROC $|z| < 0.5$ (inside the pole): expand in positive powers ⇒ $x[n] = -0.5^n u[-n-1]$, a left-sided signal

Same formula, two signals, different annuli. And the system is stable when the annulus contains the unit circle, which is exactly absolute convergence, $\sum|h[n]| < \infty$. A full three-region example is in the z-transform section (in Thai).

## Summary: which one to use

- Approximating, linearising, finding limits → Taylor

- Behaviour near a pole, residues, contour integrals, inverse transforms → Laurent

- If the region of interest contains no singularity, the two are the same series

## Continue in the library (in Thai)

- Laurent series in full: annuli, singularities, residues, real integrals, the z-transform

- Taylor and Maclaurin series: tables, remainders, shortcuts

- Complex numbers, analytic functions and the residue theorem

- Engineering mathematics practice set C

## Frequently asked questions

When should I use a Laurent series instead of a Taylor series?
When you need to expand a function around a point where it is not analytic (a singularity), or on a region that has a singularity inside it, such as the annulus $1
What is the principal part?
It is the group of negative-power terms $\sum_{n\ge1} a_{-n}(z-c)^{-n}$ of a Laurent series. It describes how the function blows up near c: no principal part means a removable singularity, finitely many terms mean a pole, infinitely many mean an essential singularity.

Why does the residue matter?
The residue is the coefficient $a_{-1}$, the only term that survives integration around a closed curve. That gives the residue theorem $\oint f\,dz = 2\pi i\sum\operatorname{Res}$, used for hard real integrals, the inverse Laplace transform and the inverse z-transform.

How is the z-transform related to Laurent series?
The z-transform is defined as $X(z) = \sum x[n]z^{-n}$, which is a Laurent series about 0. The signal x[n] is the list of coefficients and the region of convergence (ROC) is the annulus of the series. The same X(z) with a different ROC gives a different signal.

## More articles worth reading

Sequences & series
How to Choose a Convergence Test: an 8-Step Flowchart with an Example at Every Step
Pick the right convergence test the first time: an 8-step flowchart (n-th term, geometric, p-series, telescoping, limit comparison, ratio, root,…
24 Oct 2026Read the article →

Sequences & series
How to Find the Radius of Convergence: 3 Methods, Endpoint Checks and the Complex-Plane Reason
Three ways to find the radius of convergence of a power series (ratio test, root test, nearest complex singularity), plus the endpoint checks for…
24 Oct 2026Read the article →

Sequences & series
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**When should I use a Laurent series instead of a Taylor series?**
When you need to expand a function around a point where it is not analytic (a singularity), or on a region that has a singularity inside it, such as the annulus $1 < |z| < 2$ of $1/((z-1)(z-2))$. If the function is analytic on the whole disc, the Laurent series simply becomes the Taylor series.

**What is the principal part?**
It is the group of negative-power terms $\sum_{n\ge1} a_{-n}(z-c)^{-n}$ of a Laurent series. It describes how the function blows up near c: no principal part means a removable singularity, finitely many terms mean a pole, infinitely many mean an essential singularity.

**Why does the residue matter?**
The residue is the coefficient $a_{-1}$, the only term that survives integration around a closed curve. That gives the residue theorem $\oint f\,dz = 2\pi i\sum\operatorname{Res}$, used for hard real integrals, the inverse Laplace transform and the inverse z-transform.

**How is the z-transform related to Laurent series?**
The z-transform is defined as $X(z) = \sum x[n]z^{-n}$, which is a Laurent series about 0. The signal x[n] is the list of coefficients and the region of convergence (ROC) is the annulus of the series. The same X(z) with a different ROC gives a different signal.
