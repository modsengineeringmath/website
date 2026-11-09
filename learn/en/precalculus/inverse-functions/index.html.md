---
title: "Inverse Functions: One-to-One Functions, the Horizontal Line Test, Finding f⁻¹(x) and Graphing by Reflection in y = x"
url: https://modsengineeringmath.com/learn/en/precalculus/inverse-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Inverse functions on one page: one-to-one functions, the horizontal line test, finding f⁻¹(x) by swapping x and y, checking with f(f⁻¹(x)) = x, domain and range swapping places, restricting the domain of x² and sin x, the inverse of a composition, and a reflection lab where you drag a horizontal line and count intersections.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/inverse-functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Inverse Functions: One-to-One Functions, the Horizontal Line Test, Finding f⁻¹(x) and Graphing by Reflection in y = x

THภาษาไทยENEnglish

// Chapter 27.6 · Precalculus · Inverse Functions


If one function converts Celsius to Fahrenheit, its inverse is the formula that converts back. The idea sounds simple, but it hides a condition: converting back must give a single answer, and that is not true for every function. This page explains when a function can be reversed, how to find the inverse systematically, how to check it with composition, and how restricting the domain turns an irreversible function into a reversible one. That knowledge is the basis for logarithms on page 27.8 and for the inverse trigonometric functions on page 27.9.

In 30 seconds

- An inverse function exists when f is one-to-one: every horizontal line meets the graph at most once

- To find $f^{-1}$: write $y = f(x)$, swap x and y, solve for y

- Check: $f\big(f^{-1}(x)\big) = x$ and $f^{-1}\big(f(x)\big) = x$

- $D_{f^{-1}} = R_f$ · $R_{f^{-1}} = D_f$ · the graphs mirror each other in $y = x$

- $f^{-1}(x) \ne \dfrac{1}{f(x)}$

## One-to-one functions and the horizontal line test

Every function gives one y for each x, but reversing it needs the opposite condition: each y must come from only one x. Functions with that property are called one-to-one (injective). On a graph, a horizontal line $y = c$ that meets the graph twice means two x-values share the output c, and going backwards you could not say which one to return. A function that is always increasing or always decreasing on its domain is therefore always one-to-one.

I1 One-to-one

$$f(a) = f(b) \Rightarrow a = b \quad\iff\quad \text{every horizontal line meets the graph at most once}$$

I2 Inverse

$$f^{-1}(y) = x \iff f(x) = y,\qquad f\big(f^{-1}(x)\big) = x,\ \ f^{-1}\big(f(x)\big) = x$$

I3 Swap & reflect

$$D_{f^{-1}} = R_f,\quad R_{f^{-1}} = D_f,\quad (a, b) \in f \iff (b, a) \in f^{-1}$$

## Finding an inverse step by step

The standard procedure has four steps: (1) check that f is one-to-one on its domain, (2) write $y = f(x)$ and swap x and y, (3) solve for y, (4) state the domain of the inverse, which is the range of f. Step 4 is the one most often forgotten, and it matters when f involves a root, because the formula you get may look defined for every x when it is not.

I4 Finding f⁻¹

$$y = f(x)\ \xrightarrow{\ x \leftrightarrow y\ }\ x = f(y)\ \xrightarrow{\ \text{solve for } y\ }\ y = f^{-1}(x)$$

I5 Linear fractional

$$f(x) = \frac{ax + b}{cx + d}\ \Rightarrow\ f^{-1}(x) = \frac{dx - b}{a - cx}$$

Swap a and d, change the signs of b and c (just like the inverse of a 2×2 matrix)

Example I-1 · A rational function

### Find $f^{-1}$ for $f(x) = \dfrac{2x + 1}{x - 3}$ with its domain

- Swap: $x = \dfrac{2y + 1}{y - 3}$ · cross-multiply: $xy - 3x = 2y + 1$

- Collect y on one side: $xy - 2y = 3x + 1 \Rightarrow y(x - 2) = 3x + 1$

- $f^{-1}(x) = \dfrac{3x + 1}{x - 2}$, domain $x \ne 2$, which is the range of f (its HA is y = 2)

$f^{-1}(x) = \dfrac{3x + 1}{x - 2},\ x \ne 2$

Example I-2 · An inverse with a root

### Find $f^{-1}$ for $f(x) = \sqrt{x - 1}$

- f is increasing on $[1, \infty)$ and its range is $[0, \infty)$

- Swap: $x = \sqrt{y - 1} \Rightarrow x^2 = y - 1 \Rightarrow y = x^2 + 1$

- The domain of $f^{-1}$ is the range of f, $[0, \infty)$, and it must be stated

$f^{-1}(x) = x^2 + 1,\ x \ge 0$ (without $x \ge 0$ it would be a whole parabola, which is not the inverse)

Example I-3 · Exponential to logarithm

### Find $f^{-1}$ for $f(x) = 2^{x - 1} + 3$

- Swap: $x = 2^{y - 1} + 3 \Rightarrow 2^{y - 1} = x - 3$

- By the definition of a logarithm: $y - 1 = \log_2(x - 3)$

$f^{-1}(x) = 1 + \log_2(x - 3),\ x > 3$: the asymptote $y = 3$ of f becomes $x = 3$ for the inverse

## Restricting the domain

A function that is not one-to-one can still have an inverse if we use only a part of its domain on which it is increasing or decreasing. The two most important cases are $x^2$ on $x \ge 0$, giving $\sqrt x$, and $\sin x$ on $[-\pi/2, \pi/2]$, giving $\arcsin x$. The interval is a choice, not a law, but it must cover the full range of the original function.

I6 Restricted domains

$$x^2\big|_{x \ge 0} \leftrightarrow \sqrt{x},\qquad \sin x\big|_{[-\pi/2,\,\pi/2]} \leftrightarrow \arcsin x$$

I7 Inverse of a composition

$$(f \circ g)^{-1} = g^{-1} \circ f^{-1}$$

Socks then shoes; to undo, shoes come off first

Example I-4 · Restricting a quadratic

### Find the inverse of $f(x) = x^2 - 4x + 1$ for $x \ge 2$

- Complete the square: $f(x) = (x - 2)^2 - 3$, vertex (2, −3); on $x \ge 2$ f increases, range $[-3, \infty)$

- Swap: $x = (y - 2)^2 - 3 \Rightarrow y - 2 = \pm\sqrt{x + 3}$; take the plus sign because $y \ge 2$

$f^{-1}(x) = 2 + \sqrt{x + 3},\ x \ge -3$

Example I-5 · Values without a formula

### (a) With $f(x) = 3x - 5,\ g(x) = x^3$, find $(f \circ g)^{-1}(19)$ (b) For $h(x) = x^3 + x$, find $h^{-1}(10)$

- (a) $(f \circ g)^{-1}(19)$ is the x with $3x^3 - 5 = 19 \Rightarrow x^3 = 8 \Rightarrow x = 2$

- (b) h is increasing, hence one-to-one, but its inverse has no simple formula; find x with $x^3 + x = 10$: x = 2 gives 8 + 2 = 10

(a) 2 · (b) 2: a question about $f^{-1}(b)$ only asks which input f sends to b

## Reflection and horizontal line lab

The orange curve is f, the blue curve is its reflection in the dotted line $y = x$. Drag the horizontal line up and down to count intersections; where it meets the graph twice the points turn red and the lab reports that the inverse is not a function. Choose “x² (all x)” and then “x², x ≥ 0” to watch restricting the domain turn the reflection into the graph of $\sqrt x$. Move t to see a point P and its reflection P′ with swapped coordinates.

JavaScript is needed for the lab

Common traps(1) Reading $f^{-1}(x)$ as $1/f(x)$ · (2) leaving out the domain of the inverse, especially when f contains a root · (3) keeping both signs of $\pm\sqrt{\ }$ in an exercise like I-4, where the restricted interval fixes the sign.

## Practice (with answers)

1$f^{-1}$ for $f(x) = 5 - 2x$
$x = 5 - 2y \Rightarrow y = \tfrac{5 - x}{2}$
$\dfrac{5 - x}{2}$

2$f^{-1}$ for $f(x) = \sqrt[3]{2x + 1}$
$x^3 = 2y + 1$
$\dfrac{x^3 - 1}{2}$

3If f is one-to-one and $f(3) = 7$, find $f^{-1}(7)$ and a point on the graph of $f^{-1}$
Swap the coordinates
$f^{-1}(7) = 3$, point $(7, 3)$

4$f(x) = x^2 + 2,\ x \le 0$: find $f^{-1}$
$y = -\sqrt{x - 2}$ because y must not be positive
$f^{-1}(x) = -\sqrt{x - 2},\ x \ge 2$

5Is $g(x) = \dfrac{x}{x - 1}$ its own inverse?
$g(g(x)) = \dfrac{\frac{x}{x-1}}{\frac{x}{x-1} - 1} = \dfrac{x}{x - (x - 1)} = x$
Yes, $g^{-1} = g$ (its graph is symmetric about y = x)

## Read next

- 27.7 Exponential functions → 27.8 Logarithms — the most important inverse pair

- Inverse trigonometric functions — arcsin, arccos and arctan by restricting the domain

## Frequently asked questions

Does f⁻¹(x) mean 1/f(x)?
No. The −1 in f⁻¹ denotes the inverse function, the function that undoes f. 1/f(x) is the reciprocal of the value. For f(x) = 2x, f⁻¹(x) = x/2 but 1/f(x) = 1/(2x), which is something else entirely.

Which functions have inverses?
Only one-to-one functions, where each y comes from exactly one x. On a graph, use the horizontal line test: if some horizontal line meets the graph twice or more, the inverse is not a function. A function that is always increasing or always decreasing on its domain always passes the test.

Why does x² have no inverse while √x works?
x² sends both 2 and −2 to 4, so going backwards from 4 is ambiguous. Restricting the domain to x ≥ 0 makes the function one-to-one, and its inverse is √x. The same idea is why arcsin returns values only between −π/2 and π/2.

Why are the graphs of f and f⁻¹ reflections in y = x?
If (a, b) is on the graph of f, then f(a) = b, which means f⁻¹(b) = a, so (b, a) is on the graph of f⁻¹. Swapping the coordinates of every point is exactly a reflection in the line y = x.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Does f⁻¹(x) mean 1/f(x)?**
No. The −1 in f⁻¹ denotes the inverse function, the function that undoes f. 1/f(x) is the reciprocal of the value. For f(x) = 2x, f⁻¹(x) = x/2 but 1/f(x) = 1/(2x), which is something else entirely.

**Which functions have inverses?**
Only one-to-one functions, where each y comes from exactly one x. On a graph, use the horizontal line test: if some horizontal line meets the graph twice or more, the inverse is not a function. A function that is always increasing or always decreasing on its domain always passes the test.

**Why does x² have no inverse while √x works?**
x² sends both 2 and −2 to 4, so going backwards from 4 is ambiguous. Restricting the domain to x ≥ 0 makes the function one-to-one, and its inverse is √x. The same idea is why arcsin returns values only between −π/2 and π/2.

**Why are the graphs of f and f⁻¹ reflections in y = x?**
If (a, b) is on the graph of f, then f(a) = b, which means f⁻¹(b) = a, so (b, a) is on the graph of f⁻¹. Swapping the coordinates of every point is exactly a reflection in the line y = x.
