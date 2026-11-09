---
title: "Graphs of Functions and Transformations: Shifts, Stretches, Reflections, Symmetry, Even and Odd Functions, and Lines"
url: https://modsengineeringmath.com/learn/en/precalculus/graphs/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Read a graph completely, use slope and every form of the equation of a line, parallel and perpendicular lines, circles, ten parent functions, vertical and horizontal shifts, stretches and compressions, reflections, the order of transformations in y = a·f(b(x − h)) + k, and even and odd functions, with a slider transformation lab that works on a phone.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/graphs/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Graphs of Functions and Transformations: Shifts, Stretches, Reflections, Symmetry, Even and Odd Functions, and Lines

THภาษาไทยENEnglish

// Chapter 27.3 · Precalculus · Graphs & Transformations


If you know the shapes of ten parent graphs and understand what the numbers a, b, h and k do in $y = a\,f\big(b(x - h)\big) + k$, you can sketch hundreds of other functions without plotting point after point. This page starts by reading a graph for all the information it holds, reviews lines and circles, the graphs you meet most often, and then takes shifts, stretches and reflections one at a time, with a lab where dragging a slider visibly moves each point of the graph.

In 30 seconds

- $f(x) + k$ up k · $f(x - h)$ right h · $a f(x)$ vertical stretch by a · $f(bx)$ horizontal compression by 1/b

- $-f(x)$ reflects in the x-axis · $f(-x)$ reflects in the y-axis

- The parent point $(x, y)$ goes to $\left(\tfrac{x}{b} + h,\ a y + k\right)$

- Even: $f(-x) = f(x)$, y-axis symmetry · odd: $f(-x) = -f(x)$, origin symmetry

- Parallel: $m_1 = m_2$ · perpendicular: $m_1 m_2 = -1$

## Reading a graph completely

One graph answers many questions at once. The domain is the shadow of the graph on the x-axis and the range is its shadow on the y-axis. The x-intercepts solve $f(x) = 0$ and the y-intercept is $f(0)$. Where the graph climbs as you read left to right the function is increasing, and local maxima and minima are where it turns. This skill matters more than calculation: in calculus you will use derivatives to find these features, and you need to know what you are looking for on the graph.

G1 Reading a graph

$$x\text{-int}: f(x) = 0,\quad y\text{-int}: (0, f(0)),\quad x_1

## Lines, slope and circles

Slope is rise over run, $m = \Delta y/\Delta x$, the average rate of change that stays the same along a whole line. A line has several equation forms and each suits different information: with a slope and a point use point–slope form; to read the y-intercept use $y = mx + c$. The circle is a graph that is not a function, but it is used constantly in analytic geometry and as the unit circle of trigonometry.

G2 Lines

$$m = \frac{y_2 - y_1}{x_2 - x_1},\quad y - y_1 = m(x - x_1),\quad y = mx + c,\quad Ax + By = C$$

G3 Parallel & perpendicular

$$\ell_1 \parallel \ell_2 \iff m_1 = m_2,\qquad \ell_1 \perp \ell_2 \iff m_1 m_2 = -1$$

G4 Distance & midpoint

$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2},\quad M = \left(\tfrac{x_1 + x_2}{2},\ \tfrac{y_1 + y_2}{2}\right)$$

G5 Circle

$$(x - h)^2 + (y - k)^2 = r^2$$

From $x^2 + y^2 + Dx + Ey + F = 0$, complete the square in x and in y

Example G-1 · A perpendicular line

### Find the line through $(2, -1)$ perpendicular to $3x - 4y = 12$

- Rewrite the given line as $y = \tfrac34 x - 3$: slope $m_1 = \tfrac34$

- Perpendicular slope $m_2 = -\tfrac43$ (G3)

- Point–slope form: $y + 1 = -\tfrac43(x - 2) \Rightarrow y = -\tfrac43 x + \tfrac53$

$y = -\tfrac43x + \tfrac53$, or $4x + 3y = 5$ (check: $4(2) + 3(-1) = 5$)

Example G-2 · Circle from general form

### Find the centre and radius of $x^2 + y^2 - 6x + 4y - 12 = 0$

- Group: $(x^2 - 6x) + (y^2 + 4y) = 12$

- Complete the squares: $(x^2 - 6x + 9) + (y^2 + 4y + 4) = 12 + 9 + 4$

- So $(x - 3)^2 + (y + 2)^2 = 25$

Centre $(3, -2)$, radius 5

## Parent functions to know by sight

Parent functions are the basic shapes that get shifted, stretched and reflected. For each, remember three things: the shape, two or three key points, and the domain and range. Each one can be selected in the lab below; the table puts them side by side.

| Function | Key points | Domain | Range | Symmetry |

| $x$ | (0, 0), (1, 1) | $\mathbb R$ | $\mathbb R$ | odd |

| $x^2$ | (0, 0), (±1, 1), (±2, 4) | $\mathbb R$ | $[0, \infty)$ | even |

| $x^3$ | (0, 0), (±1, ±1) | $\mathbb R$ | $\mathbb R$ | odd |

| $|x|$ | (0, 0), (±1, 1) | $\mathbb R$ | $[0, \infty)$ | even |

| $\sqrt{x}$ | (0, 0), (1, 1), (4, 2) | $[0, \infty)$ | $[0, \infty)$ | — |

| $\sqrt[3]{x}$ | (0, 0), (±1, ±1), (8, 2) | $\mathbb R$ | $\mathbb R$ | odd |

| $\tfrac1x$ | (1, 1), (−1, −1) | $x \ne 0$ | $y \ne 0$ | odd |

| $2^x$ | (0, 1), (1, 2), (−1, ½) | $\mathbb R$ | $(0, \infty)$ | — |

| $\log_2 x$ | (1, 0), (2, 1), (½, −1) | $(0, \infty)$ | $\mathbb R$ | — |

| $\sin x$ | (0, 0), (π/2, 1), (π, 0) | $\mathbb R$ | $[-1, 1]$ | odd |

## Shifts, stretches and reflections

Transformations come in two kinds. Those applied outside the function, a and k, act on the y-value directly, so the graph moves vertically just as you would expect. Those applied inside, b and h, act on x before it enters f, so the graph moves horizontally the opposite way: subtracting h moves it right, multiplying by b squeezes it. The reason is that the new graph has to wait until $b(x - h)$ equals the old x to produce the old y.

G6 Shifts

$$y = f(x) + k\ \ (\uparrow k),\qquad y = f(x - h)\ \ (\rightarrow h)$$

G7 Stretches

$$y = a f(x):\ \text{vertical stretch by } |a|,\qquad y = f(bx):\ \text{horizontal compression by } \tfrac{1}{|b|}$$

G8 Reflections

$$y = -f(x):\ \text{reflect in the } x\text{-axis},\qquad y = f(-x):\ \text{reflect in the } y\text{-axis}$$

G9 Combined

$$y = a\,f\big(b(x - h)\big) + k:\qquad (x,\ y) \ \longmapsto\ \left(\frac{x}{b} + h,\ \ a y + k\right)$$

For $f(bx - c)$ factor out b first: $f\big(b(x - \tfrac{c}{b})\big)$, so the shift is $\tfrac{c}{b}$, not c

Example G-3 · Describing a transformation

### Describe how $y = -2\sqrt{x + 3} + 1$ is obtained from $y = \sqrt x$ and give key points, domain and range

- Compare with G9: $a = -2,\ b = 1,\ h = -3,\ k = 1$

- Steps: shift left 3 → stretch vertically by 2 → reflect in the x-axis → shift up 1

- Move points $(x, y) \mapsto (x - 3,\ -2y + 1)$: $(0, 0) \mapsto (-3, 1)$, $(1, 1) \mapsto (-2, -1)$, $(4, 2) \mapsto (1, -3)$

- The domain starts at −3; the range is flipped below the starting height $y = 1$

Domain $[-3, \infty)$, range $(-\infty, 1]$

Example G-4 · The horizontal-compression trap

### How is $y = |2x - 4|$ obtained from $y = |x|$, and where is the vertex?

- Factor out 2: $|2x - 4| = |2(x - 2)|$, so $b = 2,\ h = 2$

- Compress horizontally by ½, then shift right 2 (not 4)

- Vertex $(0, 0) \mapsto (0/2 + 2,\ 0) = (2, 0)$; check: $|2(2) - 4| = 0$

Vertex $(2, 0)$, and the V is twice as steep (since $|2(x - 2)| = 2|x - 2|$)

Example G-5 · Moving one point

### The point $(4, 1)$ lies on $y = f(x)$. Which point must lie on $y = f(2x) - 3$?

- $b = 2,\ k = -3$: $(x, y) \mapsto (x/2,\ y - 3)$

- Check: at $x = 2$, $f(2\cdot2) - 3 = f(4) - 3 = 1 - 3 = -2$

$(2, -2)$

## Transformation lab: drag and watch the points move

Grey open circles are key points of the parent graph and orange dots are where those same points end up. The table under the graph lists both coordinates. Make b negative to see a reflection in the y-axis, and choose 1/x, 2ˣ or log₂x to watch the asymptotes move with h and k.

JavaScript is needed for the lab

Common traps(1) Reading $f(x + 3)$ as a shift right by 3 · (2) reading $f(2x - 4)$ as a shift by 4 instead of factoring out 2 and shifting by 2 · (3) doing the vertical shift before the stretch in $2f(x) + 1$: shifting first gives $2(f(x) + 1) = 2f(x) + 2$, a different graph.

## Symmetry, even and odd functions

Knowing that a graph is symmetric halves the work, since you can draw the right half and reflect it. In calculus, symmetry also gives integrals over symmetric intervals for free; the integral of an odd function from −a to a is zero. To test, replace x by −x and compare with the original formula.

G10 Even & odd

$$\text{even: } f(-x) = f(x)\ \ (y\text{-axis}),\qquad \text{odd: } f(-x) = -f(x)\ \ (\text{origin})$$

even × even = even · odd × odd = even · even × odd = odd · an odd function defined at 0 passes through (0, 0)

G11 Symmetry tests

$$y \to -y:\ x\text{-axis},\quad x \to -x:\ y\text{-axis},\quad (x, y) \to (-x, -y):\ \text{origin}$$

Example G-6 · Even, odd or neither

### Test $f(x) = x^4 - 3x^2$, $g(x) = x^3 + x$, $h(x) = x^2 + x$

- $f(-x) = x^4 - 3x^2 = f(x)$: even

- $g(-x) = -x^3 - x = -g(x)$: odd

- $h(-x) = x^2 - x$, which equals neither $h(x)$ nor $-h(x) = -x^2 - x$

f even · g odd · h neither

## Practice (with answers)

1Line through (−1, 4) and (3, −4)
$m = \tfrac{-8}{4} = -2$ · $y - 4 = -2(x + 1)$
$y = -2x + 2$

2Vertex of $y = 3(x + 1)^2 - 5$ and which way it opens
$h = -1,\ k = -5,\ a = 3 > 0$
$(-1, -5)$, opens up, narrower than $x^2$

3Asymptotes of $y = \tfrac{1}{x - 2} + 3$
$\tfrac1x$ shifted right 2 and up 3
$x = 2$ and $y = 3$

4Is $f(x) = \dfrac{x}{x^2 + 1}$ even or odd?
$f(-x) = \dfrac{-x}{x^2 + 1} = -f(x)$
Odd

5Reflect $y = x^2$ in the x-axis, shift right 1 and up 4
$a = -1,\ h = 1,\ k = 4$
$y = -(x - 1)^2 + 4$

6Distance between (1, −2) and (7, 6)
$\sqrt{36 + 64}$
10

## Read next

- 27.4 Polynomial functions — graphs read from zeros and end behavior

- 27.5 Rational functions — transformations of $1/x$ and asymptotes

## Frequently asked questions

Why does f(x − 2) shift the graph right and not left?
y = f(x − 2) reproduces the old value f(0) only when x − 2 = 0, that is at x = 2. Every point of the original graph therefore appears 2 units later, which is 2 units to the right. Changes made to x inside the function always act in the opposite direction to what you might expect, for shifts and for stretches.

In what order should I apply several transformations?
For y = a·f(b(x − h)) + k, do the horizontal changes from the inside out (stretch or compress by b, then shift by h) and the vertical changes in the usual order (stretch or reflect by a, then shift by k). The method that never fails is to move each key point (x, y) of the parent graph to (x/b + h, a·y + k).

How do I recognise even and odd functions?
An even function satisfies f(−x) = f(x) and is symmetric about the y-axis, like x² and cos x. An odd function satisfies f(−x) = −f(x) and is symmetric about the origin, like x³ and sin x. If replacing x by −x gives neither, the function is neither even nor odd, which is the case for most functions.

When are two lines perpendicular?
When the product of their slopes is −1, so one slope is the negative reciprocal of the other: 3/4 is perpendicular to −4/3. The exception is a horizontal line and a vertical line, which are perpendicular although a vertical line has no slope.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why does f(x − 2) shift the graph right and not left?**
y = f(x − 2) reproduces the old value f(0) only when x − 2 = 0, that is at x = 2. Every point of the original graph therefore appears 2 units later, which is 2 units to the right. Changes made to x inside the function always act in the opposite direction to what you might expect, for shifts and for stretches.

**In what order should I apply several transformations?**
For y = a·f(b(x − h)) + k, do the horizontal changes from the inside out (stretch or compress by b, then shift by h) and the vertical changes in the usual order (stretch or reflect by a, then shift by k). The method that never fails is to move each key point (x, y) of the parent graph to (x/b + h, a·y + k).

**How do I recognise even and odd functions?**
An even function satisfies f(−x) = f(x) and is symmetric about the y-axis, like x² and cos x. An odd function satisfies f(−x) = −f(x) and is symmetric about the origin, like x³ and sin x. If replacing x by −x gives neither, the function is neither even nor odd, which is the case for most functions.

**When are two lines perpendicular?**
When the product of their slopes is −1, so one slope is the negative reciprocal of the other: 3/4 is perpendicular to −4/3. The exception is a horizontal line and a vertical line, which are perpendicular although a vertical line has no slope.
