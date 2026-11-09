---
title: "Functions in Precalculus: Relations, Domain, Range, Function Notation, Operations and Composition"
url: https://modsengineeringmath.com/learn/en/precalculus/functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> What makes a relation a function, the vertical line test, how to find the domain from denominators, square roots and logarithms, how to find the range, piecewise functions, sum, difference, product and quotient of functions, composition f∘g and g∘f, the difference quotient and average rate of change, with a lab where you type f and g and see the graph.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Functions in Precalculus: Relations, Domain, Range, Function Notation, Operations and Composition

THภาษาไทยENEnglish

// Chapter 27.2 · Precalculus · Functions


A function is a rule that takes one input and always returns one output, like a vending machine that gives the same drink every time you press the same button. If one day the same button produced two different drinks, the machine would stop being a function. This page lays the foundation that every later page uses: reading $f(x)$, deciding which inputs are allowed (the domain) and which outputs occur (the range), combining functions, and chaining them with composition. It ends with the average rate of change, the doorway to derivatives.

In 30 seconds

- Function: one x gives one y · the graph passes the vertical line test

- Domain: exclude zero denominators, negative values under even roots and non-positive log arguments

- Range: solve for x in terms of y, or use the vertex and the graph

- $(f \circ g)(x) = f(g(x))$: g acts first · in general $f \circ g \ne g \circ f$

- Average rate of change = secant slope $\dfrac{f(b) - f(a)}{b - a}$

## What a function is: one input, one output

A relation is a set of ordered pairs $(x, y)$ such as {(1, 2), (2, 4), (3, 6)}. It is a function when no x is paired with two different y-values. On a graph that is the vertical line test: if a vertical line hits the graph twice, some x has two outputs. The circle $x^2 + y^2 = 25$ is therefore not a function of x, while its upper half $y = \sqrt{25 - x^2}$ is. The notation $f(x)$, read “f of x”, means the output of the rule f at the input x; it is not f times x.

F1 Function

$$f: A \to B,\qquad (x, y_1) \in f \ \text{and}\ (x, y_2) \in f \ \Rightarrow\ y_1 = y_2$$

A is the domain · the set of outputs $\{f(x) : x \in A\}$ is the range

F2 Function notation

$$f(x) = x^2 - 3x \ \Rightarrow\ f(a + 1) = (a + 1)^2 - 3(a + 1) = a^2 - a - 2$$

Substitute the whole input into every x, inside brackets

## Finding the domain

Unless a problem gives the domain, take it to be every real number for which the formula produces a real number. At this level only three things can go wrong, so check each one and intersect the conditions. Interval notation keeps the answer readable.

F3 Domain rules

$$\frac{p(x)}{q(x)}:\ q(x) \ne 0,\qquad \sqrt{u(x)}:\ u(x) \ge 0,\qquad \log u(x):\ u(x) > 0$$

With several conditions, take the intersection · a root in a denominator needs $u > 0$

Example F-1 · A root and a denominator

### Find the domain of $f(x) = \dfrac{\sqrt{x + 2}}{x - 3}$

- Square root: $x + 2 \ge 0 \Rightarrow x \ge -2$

- Denominator: $x - 3 \ne 0 \Rightarrow x \ne 3$

- Together: every $x \ge -2$ except 3

$D_f = [-2,\ 3) \cup (3,\ \infty)$

Example F-2 · Domain of a logarithm

### Find the domain of $g(x) = \log\left(4 - x^2\right)$

- The argument must be positive: $4 - x^2 > 0 \Rightarrow x^2

- $(2 - x)(2 + x) > 0$ holds for $-2 A11)

$D_g = (-2,\ 2)$

## Finding the range

The range is harder than the domain because the question runs backwards: which y-values are actually produced by some x? Three methods cover most cases: (1) solve $y = f(x)$ for x and see which y allow a solution, (2) use the vertex for quadratics, (3) start from a known graph, for instance $\sqrt{x} \ge 0$ or $b^x > 0$, and apply the shifts and stretches.

F4 Finding the range

$$y = f(x) \ \Rightarrow\ x = g(y) \ \Rightarrow\ R_f = \{\,y : g(y) \text{ is defined and lies in } D_f\,\}$$

Quadratic $a(x - h)^2 + k$: $a > 0$ gives $[k, \infty)$ · $a
Example F-3 · Two ranges

### Find the range of (a) $f(x) = x^2 - 4x + 7$ (b) $h(x) = \dfrac{2x}{x + 1}$

- (a) Complete the square: $(x - 2)^2 + 3$; the smallest value is 3, at x = 2

- (b) Let $y = \dfrac{2x}{x + 1}$: $y(x + 1) = 2x \Rightarrow x(y - 2) = -y \Rightarrow x = \dfrac{y}{2 - y}$

- x exists for every y except $y = 2$, and no y produces x = −1, so nothing else is removed

(a) $[3,\ \infty)$ · (b) $\mathbb{R} \setminus \{2\}$, matching the horizontal asymptote $y = 2$ on the rational functions page

## Piecewise functions

A piecewise function uses different formulas on different intervals of x. Real examples are everywhere: tiered electricity prices, postage by weight, income tax bands. When evaluating, decide which interval x is in first, and watch the < and ≤ signs at each boundary. The absolute value $|x|$ and the floor function $\lfloor x \rfloor$ are piecewise functions too.

F5 Piecewise & floor

$$f(x) = \begin{cases} f_1(x), & x $\lfloor 2.7 \rfloor = 2$ · $\lfloor -2.7 \rfloor = -3$ (not −2)

Example F-4 · Evaluating a piecewise function

### $f(x) = \begin{cases} x^2, & x 3 \end{cases}$ Find $f(-2), f(1), f(3), f(4)$ and say whether the pieces join

- $f(-2)$: −2 < 1, use $x^2$: 4 · $f(1)$: second line, $2(1) - 1 = 1$

- $f(3) = 2(3) - 1 = 5$ · $f(4) = 5$

- At x = 1 the left piece approaches $1^2 = 1 = f(1)$ · at x = 3 the right piece is 5 = f(3), so both joins are seamless

$4,\ 1,\ 5,\ 5$, continuous at both joins

## Sum, difference, product and quotient

Two functions combine by adding, subtracting, multiplying or dividing their values at the same x. The catch is the domain: the result is defined only where both f and g are defined, and a quotient must also exclude the points where g is zero, even if the simplified formula hides the denominator.

F6 Operations

$$(f \pm g)(x) = f(x) \pm g(x),\quad (fg)(x) = f(x)g(x),\quad \left(\tfrac{f}{g}\right)(x) = \tfrac{f(x)}{g(x)}$$

Domain $= D_f \cap D_g$, and for $f/g$ remove $\{x : g(x) = 0\}$

## Composite functions

Composition connects two machines so that the output of the first becomes the input of the second. $(f \circ g)(x)$, read “f composed with g”, means $f(g(x))$: do g first, then f, even though f is written first. Its domain has two layers: x must be allowed in g, and g(x) must be allowed in f. Simplifying the final formula can hide the first layer, which is exactly where exam questions set their traps.

F7 Composition

$$(f \circ g)(x) = f\big(g(x)\big),\qquad D_{f\circ g} = \{\,x \in D_g : g(x) \in D_f\,\}$$

In general $f \circ g \ne g \circ f$ · but always $(f \circ g) \circ h = f \circ (g \circ h)$

Example F-5 · f∘g and g∘f

### With $f(x) = \sqrt{x + 2}$ and $g(x) = x^2 - 1$, find $f \circ g$ and $g \circ f$ with their domains

- $(f \circ g)(x) = f(x^2 - 1) = \sqrt{x^2 + 1}$; since $x^2 + 1 > 0$ always, the domain is $\mathbb R$

- $(g \circ f)(x) = \left(\sqrt{x + 2}\right)^2 - 1 = x + 1$

- But x must go through f first, so $x \ge -2$, even though $x + 1$ makes sense for every x

$f \circ g = \sqrt{x^2 + 1},\ x \in \mathbb R$ · $g \circ f = x + 1,\ x \ge -2$

Example F-6 · Decomposing a function

### Write $H(x) = (3x - 1)^5$ as $f(g(x))$

- The step done first is $3x - 1$, so $g(x) = 3x - 1$

- The step done last is raising to the fifth power: $f(x) = x^5$

$g(x) = 3x - 1,\ f(x) = x^5$ — seeing functions this way is the heart of the chain rule

## Average rate of change and the difference quotient

The average rate of change says how much y changes, on average, per unit of x. If f is distance against time, it is the average speed. Graphically it is the slope of the line through two points of the graph, the secant line. The difference quotient is the same expression written with a step h, and it becomes the definition of the derivative when h shrinks to zero.

F8 Average rate of change

$$\frac{\Delta y}{\Delta x} = \frac{f(b) - f(a)}{b - a}$$

F9 Difference quotient

$$\frac{f(x + h) - f(x)}{h},\quad h \ne 0 \ \xrightarrow{\ h \to 0\ }\ f'(x)$$

Example F-7 · Difference quotient

### Find the difference quotient of $f(x) = x^2 - 3x$, and the average rate of change of $\sqrt{x + 2}$ from x = −1 to x = 2

- $f(x + h) = x^2 + 2xh + h^2 - 3x - 3h$; subtracting $f(x)$ leaves $2xh + h^2 - 3h$

- Divide by h: $2x + h - 3$ (as h → 0 this becomes $2x - 3$, the derivative)

- $\sqrt{-1 + 2} = 1$, $\sqrt{2 + 2} = 2$, so $\dfrac{2 - 1}{2 - (-1)} = \dfrac13$

$2x + h - 3$ · $\tfrac13$

## Function lab: type f and g

Type functions the usual way, for example 2x^2-3, 1/(x-1), sqrt(4-x^2), |x| or log(x) (base 10), then choose to plot f, g, their sum, product, quotient or a composition. Grey bands mark the x-values where the function is undefined, which checks a domain answer instantly. Move x₁ and x₂ to see the secant line and the average rate of change.

JavaScript is needed for the lab

Common trapsReading the domain of $g \circ f$ from the final formula alone: in Example F-5 the formula $x + 1$ looks defined everywhere, but x must pass through $\sqrt{x + 2}$ first. Another is writing $f(x + h) = f(x) + h$, which is true only for special functions.

## Practice (with answers)

1Is {(1, 2), (2, 3), (1, 4)} a function?
x = 1 is paired with both 2 and 4
No

2Domain of $f(x) = \dfrac{1}{\sqrt{5 - x}}$
The root is in a denominator, so it must be strictly positive: $5 - x > 0$
$(-\infty,\ 5)$

3Range of $f(x) = 3 - \sqrt{x - 1}$
$\sqrt{x - 1} \ge 0$, so $f(x) \le 3$
$(-\infty,\ 3]$

4$f(x) = 2x + 1,\ g(x) = x^2$: find $(f \circ g)(3)$ and $(g \circ f)(3)$
$f(9) = 19$ · $g(7) = 49$
19 and 49

5If $f(x) = 3x - 2$ and $f(g(x)) = 6x + 7$, find $g(x)$
$3g(x) - 2 = 6x + 7 \Rightarrow g(x) = 2x + 3$
$g(x) = 2x + 3$

6Difference quotient of $f(x) = \dfrac1x$
$\dfrac{\frac{1}{x+h} - \frac1x}{h} = \dfrac{-1}{x(x + h)}$
$-\dfrac{1}{x(x + h)}$

## Read next

- 27.3 Graphs and transformations — see the domain and range in a picture and move graphs with a, b, h, k

- 27.6 Inverse functions — compositions that give back x

## Frequently asked questions

What is the difference between a relation and a function?
A relation is any set of ordered pairs. A function is a relation in which each x is paired with exactly one y. If the same x appears with two different y-values, for example (2, 3) and (2, 5), it is not a function. On a graph, check with the vertical line test: if some vertical line meets the graph more than once, it is not a function.

How do I find the domain of a function?
Look for the three things that break a real-valued formula: a denominator that could be zero, an even root of a negative number, and a logarithm of a number that is not positive. Write a condition for each and intersect them. If none of the three appears, the domain is all real numbers.

Is f∘g the same as g∘f?
Usually not. f∘g means apply g first and feed the result into f. With f(x) = √(x + 2) and g(x) = x² − 1, f∘g = √(x² + 1) but g∘f = x + 1 for x ≥ −2: both the formula and the domain differ. The domain of f∘g is the set of x in the domain of g for which g(x) lies in the domain of f.

How is the average rate of change related to calculus?
The average rate of change (f(b) − f(a))/(b − a) is the slope of the secant line through two points of the graph. As b approaches a, the secant line turns into the tangent line and its slope is the derivative. The difference quotient (f(x + h) − f(x))/h practised here is exactly the definition of the derivative as h → 0.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between a relation and a function?**
A relation is any set of ordered pairs. A function is a relation in which each x is paired with exactly one y. If the same x appears with two different y-values, for example (2, 3) and (2, 5), it is not a function. On a graph, check with the vertical line test: if some vertical line meets the graph more than once, it is not a function.

**How do I find the domain of a function?**
Look for the three things that break a real-valued formula: a denominator that could be zero, an even root of a negative number, and a logarithm of a number that is not positive. Write a condition for each and intersect them. If none of the three appears, the domain is all real numbers.

**Is f∘g the same as g∘f?**
Usually not. f∘g means apply g first and feed the result into f. With f(x) = √(x + 2) and g(x) = x² − 1, f∘g = √(x² + 1) but g∘f = x + 1 for x ≥ −2: both the formula and the domain differ. The domain of f∘g is the set of x in the domain of g for which g(x) lies in the domain of f.

**How is the average rate of change related to calculus?**
The average rate of change (f(b) − f(a))/(b − a) is the slope of the secant line through two points of the graph. As b approaches a, the secant line turns into the tangent line and its slope is the derivative. The difference quotient (f(x + h) − f(x))/h practised here is exactly the definition of the derivative as h → 0.
