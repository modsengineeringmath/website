---
title: "Algebra Review for Precalculus: Exponents, Radicals, Factoring, Quadratic Equations and Inequalities, Absolute Value"
url: https://modsengineeringmath.com/learn/en/precalculus/algebra/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> The algebra you need before functions and calculus: laws of exponents and radicals, rationalizing denominators, every factoring pattern, the quadratic formula and discriminant, sum and product of roots, quadratic and rational inequalities with a sign chart, and absolute-value equations and inequalities, with an interactive parabola lab.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/algebra/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Algebra Review for Precalculus: Exponents, Radicals, Factoring, Quadratic Equations and Inequalities, Absolute Value

THภาษาไทยENEnglish

// Chapter 27.1 · Precalculus · Algebra Review


When students get stuck on a function or limit problem, the new idea is rarely the obstacle. The obstacle is the algebra that has to happen first: a factorization that will not come, forgetting that $\sqrt{x^2}$ is $|x|$, or multiplying an inequality by a denominator and flipping the sign without noticing. This page collects the algebra that every later page in the chapter calls on, from exponents and radicals through factoring to quadratic equations, inequalities and absolute value, and it explains where each rule comes from so that you can rebuild it instead of memorising it.

In 30 seconds

- $a^m a^n = a^{m+n}$ · $(a^m)^n = a^{mn}$ · $a^{-n} = 1/a^n$ · $a^{m/n} = \sqrt[n]{a^m}$ · $\sqrt{x^2} = |x|$

- $a^2 - b^2 = (a - b)(a + b)$ · $a^3 \pm b^3 = (a \pm b)(a^2 \mp ab + b^2)$

- $x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ · $D > 0$ two roots · $D = 0$ one · $D

- Inequalities: get zero on one side, then use a sign chart; never multiply by something of unknown sign

- $|x| a \iff x a$

## Exponents and radicals

A positive whole-number exponent means repeated multiplication, so every rule in the cards below comes from counting factors: $a^3 \cdot a^2$ has 3 + 2 = 5 factors of a. When we extend exponents to zero, negative numbers and fractions, we choose the definitions that keep those rules working, which is why $a^0 = 1$ and $a^{-n} = 1/a^n$. Fractional exponents are roots of powers, and they lead straight to exponential functions on page 27.7.

A1 Laws of exponents

$$a^m a^n = a^{m+n},\quad \frac{a^m}{a^n} = a^{m-n},\quad (a^m)^n = a^{mn},\quad (ab)^n = a^n b^n$$

$a^0 = 1\ (a \ne 0)$ · $a^{-n} = \dfrac{1}{a^n}$ · $\left(\tfrac{a}{b}\right)^{-n} = \left(\tfrac{b}{a}\right)^{n}$

A2 Rational exponents

$$a^{1/n} = \sqrt[n]{a},\qquad a^{m/n} = \sqrt[n]{a^m} = \left(\sqrt[n]{a}\right)^m$$

For even n we need $a \ge 0$ · for odd n, a may be negative: $\sqrt[3]{-8} = -2$

A3 Radical rules

$$\sqrt{ab} = \sqrt{a}\sqrt{b},\quad \sqrt{\tfrac{a}{b}} = \tfrac{\sqrt a}{\sqrt b}\ \ (a, b \ge 0),\qquad \sqrt{x^2} = |x|$$

$\sqrt{a + b} \ne \sqrt a + \sqrt b$: $\sqrt{9 + 16} = 5$ but $3 + 4 = 7$

A4 Rationalizing

$$\frac{1}{\sqrt a} = \frac{\sqrt a}{a},\qquad \frac{1}{\sqrt a \pm \sqrt b} = \frac{\sqrt a \mp \sqrt b}{a - b}$$

Multiply by the conjugate to use the difference of squares; the same trick evaluates 0/0 limits with roots

Example A-1 · Simplifying exponents

### Simplify $\dfrac{\left(8x^6y^{-3}\right)^{2/3}}{4x^{-2}y}$ with positive exponents

- Raise each factor to 2/3 using A1: $8^{2/3} = \left(\sqrt[3]{8}\right)^2 = 4$, $\left(x^6\right)^{2/3} = x^4$, $\left(y^{-3}\right)^{2/3} = y^{-2}$

- The numerator is $4x^4y^{-2}$; dividing by $4x^{-2}y$ gives $x^{4-(-2)}y^{-2-1} = x^6y^{-3}$

- Write the negative exponent as a denominator: $y^{-3} = 1/y^3$

$\dfrac{x^6}{y^3}$

Example A-2 · Rationalizing

### Write $\dfrac{6}{\sqrt5 - \sqrt2}$ without a root in the denominator

- Multiply top and bottom by the conjugate $\sqrt5 + \sqrt2$ (A4)

- Denominator: $(\sqrt5 - \sqrt2)(\sqrt5 + \sqrt2) = 5 - 2 = 3$

- $\dfrac{6(\sqrt5 + \sqrt2)}{3} = 2(\sqrt5 + \sqrt2)$

$2\sqrt5 + 2\sqrt2$

## Factoring

Factoring rewrites a polynomial as a product, which is useful because a product is zero exactly when one of its factors is zero, so the roots appear immediately, and the sign of the polynomial can be read factor by factor. An order of attack that works almost every time: take out the common factor first, then look for a special pattern (difference of squares, perfect square, sum or difference of cubes), and only then use the ac method or grouping.

A5 Special products

$$a^2 - b^2 = (a - b)(a + b),\qquad a^2 \pm 2ab + b^2 = (a \pm b)^2$$

A6 Sum & difference of cubes

$$a^3 + b^3 = (a + b)(a^2 - ab + b^2),\qquad a^3 - b^3 = (a - b)(a^2 + ab + b^2)$$

The quadratic factor does not factor further over the reals (negative discriminant)

A7 ac method for $ax^2 + bx + c$

$$\text{find } p, q:\ pq = ac,\ p + q = b \ \Rightarrow\ ax^2 + px + qx + c,\ \text{then group}$$

Example A-3 · Factoring

### Factor (a) $x^3 - 27$ (b) $2x^2 + 7x + 3$

- (a) $27 = 3^3$, a difference of cubes A6 with $a = x,\ b = 3$: $(x - 3)(x^2 + 3x + 9)$

- (b) $ac = 6$; two numbers with product 6 and sum 7 are 6 and 1, so write $2x^2 + 6x + x + 3$

- Group: $2x(x + 3) + 1(x + 3) = (2x + 1)(x + 3)$; multiply back to check

(a) $(x - 3)(x^2 + 3x + 9)$ · (b) $(2x + 1)(x + 3)$

## Quadratic equations and the discriminant

The quadratic formula is not something to memorise blindly. It comes from completing the square, the same technique that finds the vertex of a parabola: once $ax^2 + bx + c$ is written as $a(x - h)^2 + k$, you know both the roots and the vertex. The quantity $b^2 - 4ac$ under the root tells you how many real roots there are, and therefore how many times the graph crosses the x-axis, without solving anything.

A8 Quadratic formula

$$ax^2 + bx + c = 0\ (a \ne 0) \ \Rightarrow\ x = \frac{-b \pm \sqrt{D}}{2a},\qquad D = b^2 - 4ac$$

$D > 0$ two real roots · $D = 0$ one repeated root $x = -\tfrac{b}{2a}$ · $D
A9 Vertex form

$$ax^2 + bx + c = a(x - h)^2 + k,\quad h = -\frac{b}{2a},\ k = c - \frac{b^2}{4a}$$

A10 Sum & product of roots

$$x_1 + x_2 = -\frac{b}{a},\qquad x_1 x_2 = \frac{c}{a}$$

The quadratic with roots r and s is $x^2 - (r + s)x + rs = 0$

Example A-4 · Using the formula

### Solve $2x^2 - 4x - 3 = 0$

- $a = 2,\ b = -4,\ c = -3$, so $D = 16 + 24 = 40 > 0$: two real roots

- $x = \dfrac{4 \pm \sqrt{40}}{4} = \dfrac{4 \pm 2\sqrt{10}}{4}$ since $\sqrt{40} = 2\sqrt{10}$

- Cancel the common 2: $x = \dfrac{2 \pm \sqrt{10}}{2} = 1 \pm \dfrac{\sqrt{10}}{2}$

$x = 1 \pm \tfrac{\sqrt{10}}{2} \approx 2.581,\ -0.581$

Example A-5 · Sum and product of roots

### If α and β are the roots of $x^2 - 5x + 3 = 0$, find $\alpha^2 + \beta^2$ and $\dfrac{1}{\alpha} + \dfrac{1}{\beta}$

- From A10: $\alpha + \beta = 5,\ \alpha\beta = 3$; no need to find the roots

- $\alpha^2 + \beta^2 = (\alpha + \beta)^2 - 2\alpha\beta = 25 - 6 = 19$

- $\dfrac1\alpha + \dfrac1\beta = \dfrac{\alpha + \beta}{\alpha\beta} = \dfrac53$

$\alpha^2 + \beta^2 = 19,\quad \tfrac1\alpha + \tfrac1\beta = \tfrac53$

## Parabola lab: roots, vertex and inequality in one picture

Drag a, b and c and watch three things at once: the discriminant and the number of x-intercepts, the vertex moving with $h = -b/2a$, and, when an inequality is selected, the green band showing where it holds. Make a negative and see the answer to $\le 0$ switch from “between the roots” to “outside the roots”.

JavaScript is needed for the lab

## Quadratic and rational inequalities

One principle handles every polynomial and rational inequality: make one side zero and study the sign. A polynomial can change sign only at its roots, and a fraction only at the roots of its numerator or denominator. Those points split the number line into intervals with a constant sign, so testing one number per interval tells you the whole interval. This sign chart returns on the polynomial, rational and logarithm pages.

A11 Quadratic inequality (a > 0)

$$a(x - r_1)(x - r_2) 0 \iff x r_2$$

An upward parabola is below the axis only between its roots · if a < 0, multiply by −1 first and flip the sign

A12 Sign chart

$$\frac{P(x)}{Q(x)} \ge 0:\ \text{critical points} = \{P = 0\} \cup \{Q = 0\},\quad Q = 0 \text{ always open}$$

Example A-6 · A rational inequality

### Solve $\dfrac{x^2 - x - 6}{x - 1} \ge 0$

- Factor: $\dfrac{(x - 3)(x + 2)}{x - 1} \ge 0$; critical points −2, 1, 3 (1 comes from the denominator, so it is excluded)

- Test each interval: $x 3$: $+$

- Keep the positive intervals and include the numerator zeros −2 and 3, because the inequality is $\ge$

$x \in [-2,\ 1) \cup [3,\ \infty)$

Common trapsMultiplying through by $(x - 1)$ and solving $x^2 - x - 6 \ge 0$: the answer is wrong for every $x

## Absolute value

$|x|$ is the distance from x to 0 on the number line, and $|x - c|$ is the distance from x to c. Thinking in distances makes absolute-value inequalities almost calculation-free: $|x - 1| \ge 2$ says “x is at least 2 away from 1”, so $x \le -1$ or $x \ge 3$ at once. On the functions page, $|x|$ is a piecewise function with a V-shaped graph.

A13 Absolute value

$$|x| = \begin{cases} x, & x \ge 0 \\ -x, & x
A14 Absolute value inequalities (a > 0)

$$|u| = a \iff u = \pm a,\quad |u| a \iff u a$$

Example A-7 · Absolute value inequalities

### Solve (a) $|2x - 3|

- (a) By A14: $-5

- (b) At least 2 away from 1: $x - 1 \le -2$ or $x - 1 \ge 2$

(a) $(-1,\ 4)$ · (b) $(-\infty,\ -1] \cup [3,\ \infty)$

## Practice (with answers)

1Simplify $\left(\dfrac{27a^{-6}}{b^{3}}\right)^{-1/3}$
$27^{-1/3} = \tfrac13$, $a^{(-6)(-1/3)} = a^2$, and $b^{3}$ in the denominator becomes $b$ on top
$\dfrac{a^2 b}{3}$

2Factor $x^4 - 16$
$(x^2 - 4)(x^2 + 4) = (x - 2)(x + 2)(x^2 + 4)$
$(x - 2)(x + 2)(x^2 + 4)$

3Find k so that $x^2 + kx + 9 = 0$ has a repeated root
$D = k^2 - 36 = 0$
$k = \pm 6$

4Solve $x^2 - 2x - 8
$(x - 4)(x + 2) $-2
5Solve $\dfrac{x + 1}{x - 2} \le 0$
Critical points −1 (included) and 2 (excluded); the middle interval is negative
$[-1,\ 2)$

6Solve $|3 - x| \le 4$
$-4 \le 3 - x \le 4 \Rightarrow -1 \le x \le 7$
$[-1,\ 7]$

7Write $x^2 + 6x + 2$ as $(x - h)^2 + k$
$x^2 + 6x + 9 - 9 + 2 = (x + 3)^2 - 7$
$(x + 3)^2 - 7$, vertex $(-3, -7)$

8A quadratic with roots $2 + \sqrt3$ and $2 - \sqrt3$
Sum 4, product $4 - 3 = 1$, by A10
$x^2 - 4x + 1 = 0$

## Read next

- 27.2 Functions — factoring and inequalities find domains and ranges

- 27.4 Polynomial functions — factoring grows into synthetic division and the factor theorem

## Frequently asked questions

Why is √(x²) equal to |x| and not x?
The square-root sign always returns a value that is not negative. With x = −3, √((−3)²) = √9 = 3 = |−3|. Writing √(x²) = x would give 3 = −3. The rule matters whenever you solve equations with roots and when you take limits at infinity in calculus.

What does the discriminant tell you?
D = b² − 4ac tells you how many real roots a quadratic has without solving it: D > 0 gives two, D = 0 one repeated root, D
Why can't I multiply both sides of a rational inequality by the denominator?
Because you do not know whether the denominator is positive or negative, and multiplying by a negative number reverses the inequality. Move everything to one side, combine into a single fraction, and use a sign chart. Values that make the denominator zero are never part of the answer.

Should I factor or use the quadratic formula?
Look for two numbers that multiply to ac and add to b. If you cannot find them within a few seconds, or the discriminant is not a perfect square, use the formula. The formula always works; factoring is faster when the roots are rational.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why is √(x²) equal to |x| and not x?**
The square-root sign always returns a value that is not negative. With x = −3, √((−3)²) = √9 = 3 = |−3|. Writing √(x²) = x would give 3 = −3. The rule matters whenever you solve equations with roots and when you take limits at infinity in calculus.

**What does the discriminant tell you?**
D = b² − 4ac tells you how many real roots a quadratic has without solving it: D > 0 gives two, D = 0 one repeated root, D < 0 none. Graphically it is the number of times y = ax² + bx + c meets the x-axis. If a, b, c are integers and D is a perfect square, the quadratic factors over the rationals.

**Why can't I multiply both sides of a rational inequality by the denominator?**
Because you do not know whether the denominator is positive or negative, and multiplying by a negative number reverses the inequality. Move everything to one side, combine into a single fraction, and use a sign chart. Values that make the denominator zero are never part of the answer.

**Should I factor or use the quadratic formula?**
Look for two numbers that multiply to ac and add to b. If you cannot find them within a few seconds, or the discriminant is not a perfect square, use the formula. The formula always works; factoring is faster when the roots are rational.
