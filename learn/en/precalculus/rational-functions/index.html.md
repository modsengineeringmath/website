---
title: "Rational Functions: Vertical, Horizontal and Slant Asymptotes, Holes and How to Graph Them"
url: https://modsengineeringmath.com/learn/en/precalculus/rational-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Rational functions p(x)/q(x) step by step: the reciprocal functions 1/x and 1/x², the domain, telling holes from vertical asymptotes, the degree rule for horizontal asymptotes, long division for slant (oblique) asymptotes, intercepts, crossing an asymptote, sign charts and rational inequalities, with an analyzer that graphs any rational function with its asymptotes.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/rational-functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Rational Functions: Vertical, Horizontal and Slant Asymptotes, Holes and How to Graph Them

THภาษาไทยENEnglish

// Chapter 27.5 · Precalculus · Rational Functions


A rational function is a polynomial divided by a polynomial. It looks like an ordinary fraction, yet its graph has features polynomials never have: asymptotes that the graph approaches without end, and holes where a single point is missing. Such functions turn up often, in the average cost per item that falls as production grows, in intensity that weakens with distance, and in the transfer functions of control systems. This page gives a seven-step graphing method that works for every exercise, and an analyzer that checks your answer immediately.

In 30 seconds

- Cancel common factors first: fully cancelled → hole · left in the denominator → vertical asymptote

- Horizontal asymptote: deg top < deg bottom → y = 0 · equal → ratio of leading coefficients

- Top degree one more than bottom → slant asymptote = quotient of long division

- $y = \dfrac{a}{x - h} + k$ is $1/x$ stretched and shifted, with asymptotes $x = h,\ y = k$

## The reciprocal function and its transformations

The graph of $y = 1/x$ is a hyperbola with branches in the first and third quadrants. Near x = 0, $1/x$ grows without bound; for large x it shrinks almost to zero, so both axes are asymptotes. Every rational function of degree one over degree one can be rewritten by division as a transformation of $1/x$, which reveals its asymptotes and shape at once. $1/x^2$ is positive on both sides of zero, so both of its branches lie above the x-axis.

R1 Rational function

$$f(x) = \frac{p(x)}{q(x)},\qquad D_f = \{x : q(x) \ne 0\}$$

R2 Transformed reciprocal

$$y = \frac{a}{x - h} + k:\quad \text{VA } x = h,\ \ \text{HA } y = k$$

$\dfrac{ax + b}{cx + d} = \dfrac{a}{c} + \dfrac{b - ad/c}{cx + d}$, so HA $y = a/c$, VA $x = -d/c$

Example R-1 · As a transformation of 1/x

### Write $f(x) = \dfrac{2x - 3}{x + 1}$ as $\dfrac{a}{x - h} + k$ and give its asymptotes

- Make the numerator contain $x + 1$: $2x - 3 = 2(x + 1) - 5$

- $f(x) = \dfrac{2(x + 1) - 5}{x + 1} = 2 - \dfrac{5}{x + 1}$

- That is $1/x$ stretched by 5, reflected in the x-axis, shifted left 1 and up 2

VA $x = -1$, HA $y = 2$; the branches sit upper-left and lower-right of where the asymptotes meet

## Holes and the three kinds of asymptote

Before looking for asymptotes, always factor the numerator and denominator and cancel common factors. A factor that cancels completely leaves a hole, whose y-coordinate comes from the reduced formula; a factor that remains in the denominator gives a vertical asymptote. For the ends of the graph, compare degrees, just as with polynomials, because the leading terms take over.

R3 Hole

$$f(x) = \frac{(x - c)\,g(x)}{(x - c)\,h(x)},\ h(c) \ne 0 \ \Rightarrow\ \text{hole at } \left(c,\ \tfrac{g(c)}{h(c)}\right)$$

R4 Vertical asymptote

$$\text{after cancelling: } q(c) = 0,\ p(c) \ne 0 \ \Rightarrow\ x = c$$

R5 Horizontal asymptote

$$\deg p
R6 Slant asymptote

$$\deg p = \deg q + 1:\ \frac{p}{q} = (mx + c) + \frac{r(x)}{q(x)} \Rightarrow y = mx + c$$

Example R-2 · A hole and asymptotes

### Analyse $f(x) = \dfrac{x^2 - 4}{x^2 - x - 2}$

- Factor: $\dfrac{(x - 2)(x + 2)}{(x - 2)(x + 1)}$; cancelling $x - 2$ gives $\dfrac{x + 2}{x + 1}$ for $x \ne 2$

- Hole at x = 2: $y = \dfrac{2 + 2}{2 + 1} = \dfrac43$ · VA from the remaining factor: $x = -1$

- Equal degrees (2 and 2): HA $y = \tfrac11 = 1$

- x-intercept from the reduced numerator: $x = -2$ · y-intercept $f(0) = \tfrac{-4}{-2} = 2$

Hole $(2, \tfrac43)$ · VA $x = -1$ · HA $y = 1$ · intercepts $(-2, 0)$, $(0, 2)$

Example R-3 · A slant asymptote

### Find the asymptotes of $f(x) = \dfrac{x^2 + 1}{x - 1}$

- The numerator degree 2 is one more than the denominator degree 1 ⇒ slant asymptote, no horizontal one

- Long division: $x^2 + 1 = (x - 1)(x + 1) + 2$, so $f(x) = x + 1 + \dfrac{2}{x - 1}$

- For large $|x|$, $\tfrac{2}{x - 1} \to 0$ and the graph approaches $y = x + 1$

VA $x = 1$ · slant asymptote $y = x + 1$ · no x-intercept · $f(0) = -1$

Example R-4 · Crossing a horizontal asymptote

### Where does $f(x) = \dfrac{2x^2 - 3x}{x^2 + 1}$ cross its horizontal asymptote?

- HA: equal degrees, $y = 2$ · the denominator is never zero, so there is no VA

- Solve $\dfrac{2x^2 - 3x}{x^2 + 1} = 2 \Rightarrow 2x^2 - 3x = 2x^2 + 2 \Rightarrow x = -\tfrac23$

At $\left(-\tfrac23,\ 2\right)$; further left the graph approaches y = 2 from above

## Graphing a rational function in 7 steps

- Factor numerator and denominator; write the domain

- Cancel common factors and record each hole with its y-coordinate

- Find vertical asymptotes from the zeros of the remaining denominator

- Find the horizontal or slant asymptote by comparing degrees

- Find the x-intercepts (zeros of the remaining numerator) and the y-intercept (if 0 is in the domain)

- Make a sign chart from the zeros of the numerator and the denominator, to know where the graph is above or below the axis

- Sketch along the asymptotes and draw an open circle at each hole

R7 Sign chart

$$\text{cut points} = \{p = 0\} \cup \{q = 0\},\ \text{constant sign on each interval}$$

A factor with an even power does not change the sign, in the numerator or in the denominator

## Rational function analyzer

Type the numerator and denominator as polynomials or in factored form, for example (x-1)(x+2), or as coefficients 1, 0, -4. The analyzer cancels common factors, finds holes, all three kinds of asymptote, intercepts and the sign chart, and draws each branch separately at the vertical asymptotes, so there are no false vertical lines, a common fault of general graphing tools.

JavaScript is needed for the analyzer

## Rational inequalities and an application

Example R-5 · A rational inequality

### Solve $\dfrac{x - 3}{x + 2} \le 1$

- Move everything left: $\dfrac{x - 3 - (x + 2)}{x + 2} \le 0 \Rightarrow \dfrac{-5}{x + 2} \le 0$

- The numerator −5 is always negative, so the fraction is $\le 0$ when the denominator is positive: $x + 2 > 0$

$x > -2$. Cross-multiplying at the start gives $-3 \le 2$, always true, and the wrong answer “all x except −2”

Example R-6 · Average cost

### A factory has fixed costs of 5,000 and a variable cost of 20 per item. What is the average cost per item when x items are made, and what value does it approach?

- Total cost $5000 + 20x$; average cost $\bar C(x) = \dfrac{5000 + 20x}{x} = 20 + \dfrac{5000}{x}$

- The horizontal asymptote $y = 20$ means that however many items are made, the average never drops below 20

- At 1,000 items the average is $20 + 5 = 25$

$\bar C(x) = 20 + \tfrac{5000}{x}$, approaching 20 per item

Common trapsFinding vertical asymptotes before cancelling, so that a hole is counted as an asymptote, and answering “no horizontal asymptote” whenever the top degree is larger without checking for a slant asymptote.

## Practice (with answers)

1Asymptotes of $f(x) = \dfrac{3x + 1}{x - 4}$
VA from the denominator · equal degrees
$x = 4$, $y = 3$

2Hole of $f(x) = \dfrac{x^2 - 9}{x - 3}$
$f(x) = x + 3,\ x \ne 3$
$(3, 6)$, and no asymptote: the graph is a line with one point missing

3Horizontal asymptote of $\dfrac{5x^2}{2x^3 + 1}$
Smaller degree on top
$y = 0$

4Slant asymptote of $\dfrac{2x^2 + 3x - 1}{x + 2}$
Synthetic division by c = −2: 2 | −1 | remainder 1 ⇒ $2x - 1 + \tfrac{1}{x + 2}$
$y = 2x - 1$

5Solve $\dfrac{x + 4}{x - 1} > 0$
Cut points −4, 1; the outer intervals are positive
$x 1$

6A rational function with VA $x = 2$, HA $y = -1$, through the origin
Form $\tfrac{a}{x - 2} - 1$; through (0, 0): $-\tfrac a2 - 1 = 0 \Rightarrow a = -2$
$f(x) = -\dfrac{2}{x - 2} - 1 = \dfrac{-x}{x - 2}$

## Read next

- 27.6 Inverse functions — the inverse of $(ax + b)/(cx + d)$ is also rational

- Inverse Laplace transform by partial fractions — splitting rational functions in engineering

## Frequently asked questions

What is the difference between a hole and a vertical asymptote?
Both come from a value that makes the denominator zero. If that factor cancels completely with the numerator, the graph has a single missing point, a hole, because the function still approaches a finite value there. If the factor is still in the denominator after cancelling, the function blows up and there is a vertical asymptote.

What are the rules for horizontal asymptotes?
Compare the degree n of the numerator with the degree m of the denominator: n m gives no horizontal asymptote, and if n = m + 1 there is a slant asymptote equal to the quotient from long division.

Can a graph cross its horizontal asymptote?
Yes. A horizontal asymptote only describes what happens as x goes to plus or minus infinity; in the middle the graph may cross it. Solve f(x) = L to find out. A graph never crosses a vertical asymptote, because that x is not in the domain.

Why does cross-multiplying a rational inequality go wrong?
The denominator may be positive or negative depending on x, and multiplying by a negative reverses the inequality. Move everything to one side, combine into one fraction and use a sign chart. Zeros of the denominator are never solutions.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between a hole and a vertical asymptote?**
Both come from a value that makes the denominator zero. If that factor cancels completely with the numerator, the graph has a single missing point, a hole, because the function still approaches a finite value there. If the factor is still in the denominator after cancelling, the function blows up and there is a vertical asymptote.

**What are the rules for horizontal asymptotes?**
Compare the degree n of the numerator with the degree m of the denominator: n  m gives no horizontal asymptote, and if n = m + 1 there is a slant asymptote equal to the quotient from long division.

**Can a graph cross its horizontal asymptote?**
Yes. A horizontal asymptote only describes what happens as x goes to plus or minus infinity; in the middle the graph may cross it. Solve f(x) = L to find out. A graph never crosses a vertical asymptote, because that x is not in the domain.

**Why does cross-multiplying a rational inequality go wrong?**
The denominator may be positive or negative depending on x, and multiplying by a negative reverses the inequality. Move everything to one side, combine into one fraction and use a sign chart. Zeros of the denominator are never solutions.
