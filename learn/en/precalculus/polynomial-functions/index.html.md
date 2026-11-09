---
title: "Polynomial Functions: Graphs, Zeros and Multiplicity, End Behavior, Synthetic Division, Remainder and Factor Theorems"
url: https://modsengineeringmath.com/learn/en/precalculus/polynomial-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Polynomial functions on one page: degree and leading coefficient, the four end-behavior patterns, zeros that cross versus touch, turning points, long division and synthetic division, the remainder theorem, the factor theorem, the rational root theorem and polynomial inequalities, with a build-from-zeros lab and a synthetic division calculator.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/polynomial-functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Polynomial Functions: Graphs, Zeros and Multiplicity, End Behavior, Synthetic Division, Remainder and Factor Theorems

THภาษาไทยENEnglish

// Chapter 27.4 · Precalculus · Polynomial Functions


Polynomials are the functions computers evaluate most easily, since they need only addition and multiplication. Road curves, reservoir levels and the routine inside a calculator that approximates sin x are often polynomials underneath. This page shows how to sketch a polynomial from three facts without plotting points: the end behavior from the leading term, the zeros and how the graph meets the axis at each one, and the y-intercept. Then it builds the toolkit for finding zeros: synthetic division and the remainder, factor and rational root theorems.

In 30 seconds

- End behavior comes from $a_n x^n$: even degree, ends match · odd degree, ends opposite

- Odd multiplicity crosses · even multiplicity touches and turns

- Degree n: at most n real zeros and at most n − 1 turning points

- Dividing $P(x)$ by $x - c$ leaves remainder $P(c)$ · $P(c) = 0 \iff (x - c)$ is a factor

- Possible rational roots: ±(factors of the constant)/(factors of the leading coefficient)

## Degree, leading coefficient and end behavior

For large x the term of highest degree grows so much faster than the others that they barely matter. At x = 100, $2x^3$ is 2,000,000 while $-11x$ is only −1,100. The ends of a polynomial graph therefore look like the ends of $a_n x^n$, and all that remains is whether the degree is even or odd and whether the leading coefficient is positive or negative.

P1 Polynomial of degree n

$$P(x) = a_n x^n + a_{n-1}x^{n-1} + \cdots + a_1 x + a_0,\qquad a_n \ne 0$$

P2 End behavior

$$\begin{array}{c|cc} & a_n > 0 & a_n

## Zeros and multiplicity

If $(x - c)^m$ is a factor of P but $(x - c)^{m+1}$ is not, c is a zero of multiplicity m. Near x = c the graph looks like $k(x - c)^m$. For odd m, $(x - c)^m$ changes sign as x passes c, so the graph crosses the axis; for even m the sign does not change, so the graph only touches and turns back. Combined with the end behavior, that is enough for a good sketch.

P3 Multiplicity

$$P(x) = (x - c)^m Q(x),\ Q(c) \ne 0:\quad m \text{ odd crosses},\quad m \text{ even touches}$$

P4 Counting zeros and turning points

$$\#\{\text{real zeros}\} \le n,\qquad \#\{\text{turning points}\} \le n - 1$$

P5 Fundamental theorem of algebra

$$P(x) = a_n(x - z_1)(x - z_2)\cdots(x - z_n),\quad z_k \in \mathbb C$$

Real coefficients ⇒ complex zeros come in conjugate pairs $a \pm bi$

Example P-1 · Sketching from factored form

### Analyse $P(x) = -2(x - 1)^2(x + 3)$

- Degree $2 + 1 = 3$ (odd), leading coefficient −2 (negative) ⇒ up on the left, down on the right

- x = −3, multiplicity 1 ⇒ crosses · x = 1, multiplicity 2 ⇒ touches and turns

- y-intercept: $P(0) = -2(1)(3) = -6$

- From the left the graph comes down, crosses at −3, reaches a local minimum between −3 and 1 passing (0, −6), rises to touch x = 1 and falls away

Ends ↖ ↘ · crosses at −3 · touches at 1 · through (0, −6)

Example P-2 · Building a polynomial from zeros

### Find the cubic with zeros 2, −1, ½ and $P(0) = 2$

- Write $P(x) = a(x - 2)(x + 1)\left(x - \tfrac12\right)$

- $P(0) = a(-2)(1)\left(-\tfrac12\right) = a = 2$

- $P(x) = (x - 2)(x + 1)(2x - 1) = (x^2 - x - 2)(2x - 1)$, then expand

$P(x) = 2x^3 - 3x^2 - 3x + 2$

## Long division and synthetic division

Polynomial long division works like long division of numbers: divide the leading terms, multiply back, subtract and bring down the next term. When the divisor is $x - c$, the whole process shrinks to numbers only, which is synthetic division. Write every coefficient (use 0 for a missing power), bring down the first, multiply by c and write it under the next coefficient, add, and repeat. The last number is the remainder; the others are the coefficients of the quotient, one degree lower.

P6 Division algorithm

$$P(x) = D(x)\,Q(x) + R(x),\qquad \deg R
P7 Synthetic division

$$b_{n-1} = a_n,\qquad b_{k-1} = a_k + c\,b_k,\qquad R = a_0 + c\,b_0$$

Divisor $x + 2$ uses $c = -2$ · divisor $2x - 1$ uses $c = \tfrac12$, then divide the quotient by 2

Example P-3 · Divide, then factor

### Divide $2x^3 - 3x^2 - 11x + 6$ by $x - 3$ and find all zeros

- Coefficients 2, −3, −11, 6 with c = 3 · bring down 2

- $2 \times 3 = 6$, $-3 + 6 = 3$ · $3 \times 3 = 9$, $-11 + 9 = -2$ · $-2 \times 3 = -6$, $6 - 6 = 0$

- Remainder 0 ⇒ $x - 3$ is a factor; the quotient $2x^2 + 3x - 2 = (2x - 1)(x + 2)$

$(x - 3)(2x - 1)(x + 2)$, zeros $3,\ \tfrac12,\ -2$

## Remainder, factor and rational root theorems

These three theorems work as a chain. The remainder theorem says you can find the remainder without dividing: just evaluate P at c. The factor theorem says that a zero gives you a factor. The rational root theorem tells you which values are worth trying. Once one root is found, synthetic division lowers the degree, and you repeat until a quadratic remains for the formula.

P8 Remainder theorem

$$P(x) \div (x - c)\ \Rightarrow\ R = P(c)$$

P9 Factor theorem

$$(x - c) \mid P(x) \iff P(c) = 0$$

P10 Rational root theorem

$$P(x) \in \mathbb Z[x],\ P\!\left(\tfrac{p}{q}\right) = 0,\ \gcd(p, q) = 1 \Rightarrow p \mid a_0,\ q \mid a_n$$

P11 Vieta (cubic)

$$ax^3 + bx^2 + cx + d:\ \ \textstyle\sum r_i = -\tfrac{b}{a},\ \ \sum r_ir_j = \tfrac{c}{a},\ \ r_1r_2r_3 = -\tfrac{d}{a}$$

Example P-4 · Remainder theorem

### Find the remainder when $x^{100} - 3x + 1$ is divided by $x + 1$

- $x + 1 = x - (-1)$, so $c = -1$ (P8)

- $P(-1) = (-1)^{100} - 3(-1) + 1 = 1 + 3 + 1$

Remainder 5 (long division would take 100 rounds)

Example P-5 · Finding a constant

### Find k so that $x - 2$ is a factor of $x^3 + kx^2 - 4x + 4$

- Factor theorem: $P(2) = 0$

- $8 + 4k - 8 + 4 = 4k + 4 = 0$

$k = -1$

Example P-6 · Using rational roots

### Find all zeros of $x^3 - 4x^2 + x + 6$

- $a_0 = 6,\ a_n = 1$: candidates $\pm1, \pm2, \pm3, \pm6$

- Try $x = -1$: $-1 - 4 - 1 + 6 = 0$ ⇒ $x + 1$ is a factor

- Synthetic division by c = −1 gives $x^2 - 5x + 6 = (x - 2)(x - 3)$

$x = -1,\ 2,\ 3$ (Vieta check: the sum is 4 = −(−4)/1)

## Polynomial inequalities

The method is the same as for quadratic inequalities on page 27.1: factor, place the zeros on a number line and read the signs. Be careful with zeros of even multiplicity, where the sign does not change; the shortcut “alternate the sign in every interval” fails there.

Example P-7 · An inequality with a repeated zero

### Solve $(x + 2)(x - 1)^2(x - 3) > 0$

- Zeros −2, 1 (multiplicity 2), 3 · far right is positive (leading coefficient +1)

- Right to left: $x > 3$: + · past 3 it changes to − · past 1 (even) it stays − · past −2 it changes to +

- We need $> 0$, so the zeros themselves are excluded

$x 3$

## Polynomial lab: build from zeros · synthetic division

In “build from zeros” mode, list zeros separated by commas and repeat one to raise its multiplicity, for example 1, 1, -3, then drag the leading coefficient a to see the end behavior change as in P2. In “synthetic division” mode type the dividend as 2x^3-3x^2-11x+6 or as coefficients 2, -3, -11, 6 and choose c; the lab shows the division table, quotient, remainder and every rational root candidate.

JavaScript is needed for the lab

Common trapsForgetting the 0 placeholders in synthetic division: $x^3 - 8$ is 1, 0, 0, −8, not 1, −8. And dividing by $x + 2$ with c = 2 when it should be c = −2.

## Practice (with answers)

1End behavior of $P(x) = -x^4 + 3x^3 - 2$
Even degree, negative leading coefficient
Down at both ends ↙ ↘

2Remainder of $2x^3 + x^2 - 5$ divided by $x - 2$
$P(2) = 16 + 4 - 5$
15

3Factor $x^3 + 2x^2 - 5x - 6$
Try x = 2: 8 + 8 − 10 − 6 = 0 · divide to get $x^2 + 4x + 3 = (x + 1)(x + 3)$
$(x - 2)(x + 1)(x + 3)$

4A monic quartic with zeros 0 (double), 1 and −1
$x^2(x - 1)(x + 1)$
$x^4 - x^2$

5Solve $x^3 - 4x \le 0$
$x(x - 2)(x + 2) \le 0$; zeros −2, 0, 2, positive on the far right
$(-\infty, -2] \cup [0, 2]$

6If $1 + 2i$ is a zero of a polynomial with real coefficients, which other zero must there be?
Complex zeros come in conjugate pairs (P5)
$1 - 2i$

## Read next

- 27.5 Rational functions — a polynomial over a polynomial; zeros of the denominator become asymptotes

- What is a Taylor series? — approximating any smooth function by polynomials

## Frequently asked questions

How do I find the end behavior of a polynomial?
Look only at the leading term. With even degree both ends go the same way (up if the leading coefficient is positive, down if negative). With odd degree the ends go opposite ways: a positive leading coefficient starts bottom-left and ends top-right, a negative one does the reverse.

How does multiplicity change the graph at a zero?
At a zero of odd multiplicity the graph crosses the x-axis because the sign changes; with multiplicity 3 or more it flattens as it crosses. At a zero of even multiplicity the sign does not change, so the graph touches the axis and turns back. For example (x − 1)² touches at x = 1.

When should I use synthetic division?
When dividing by a linear factor x − c. It is much faster than long division, and the bottom row gives the quotient coefficients and the remainder at once. By the remainder theorem that remainder is P(c), so synthetic division also evaluates the polynomial and tests possible roots.

What does the rational root theorem do?
It limits the possible rational roots to ±p/q, where p divides the constant term and q divides the leading coefficient. Instead of guessing, test only those values; once one root is found, divide it out with synthetic division and repeat on the smaller polynomial.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**How do I find the end behavior of a polynomial?**
Look only at the leading term. With even degree both ends go the same way (up if the leading coefficient is positive, down if negative). With odd degree the ends go opposite ways: a positive leading coefficient starts bottom-left and ends top-right, a negative one does the reverse.

**How does multiplicity change the graph at a zero?**
At a zero of odd multiplicity the graph crosses the x-axis because the sign changes; with multiplicity 3 or more it flattens as it crosses. At a zero of even multiplicity the sign does not change, so the graph touches the axis and turns back. For example (x − 1)² touches at x = 1.

**When should I use synthetic division?**
When dividing by a linear factor x − c. It is much faster than long division, and the bottom row gives the quotient coefficients and the remainder at once. By the remainder theorem that remainder is P(c), so synthetic division also evaluates the polynomial and tests possible roots.

**What does the rational root theorem do?**
It limits the possible rational roots to ±p/q, where p divides the constant term and q divides the leading coefficient. Instead of guessing, test only those values; once one root is found, divide it out with synthetic division and repeat on the smaller polynomial.
