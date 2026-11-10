---
title: "Area Calculator: Shapes, Area Under and Between Curves, Polygons from Coordinates, Rai–Ngan–Wa"
url: https://modsengineeringmath.com/en/tools/area-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Four area calculators on one page, free: 13 geometric shapes with formulas, the area under a curve or between two curves by integration, the area of a polygon from its coordinates (shoelace formula), and Thai land units (rai, ngan, square wa) to square metres.

Markdown copy of https://modsengineeringmath.com/en/tools/area-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Area Calculator: Shapes, Area Under and Between Curves, Polygons from Coordinates, Rai–Ngan–Wa

THภาษาไทยENEnglish
// Tool · Area Calculator


One tool for every area job: pick a shape and enter its dimensions, find the area under a curve or between two curves by integration (crossings are found for you), get the area of a plot from the coordinates of its corners, and convert between rai, ngan, square wa and square metres.

## Calculator

This calculator needs JavaScript.

## Area formulas for common shapes

| Shape | Area |

| Rectangle | $A = ab$ |

| Triangle | $A = \tfrac{1}{2}bh$ |

| Triangle from three sides (Heron) | $A = \sqrt{s(s-a)(s-b)(s-c)}$, $s = \tfrac{a+b+c}{2}$ |

| Triangle from two sides and the included angle | $A = \tfrac{1}{2}ab\sin C$ |

| Circle | $A = \pi r^{2}$ |

| Sector of angle $\theta$ degrees | $A = \dfrac{\theta}{360^{\circ}}\pi r^{2}$ |

| Ellipse | $A = \pi ab$ |

| Trapezoid | $A = \tfrac{1}{2}(a+b)h$ |

| Parallelogram | $A = bh$ |

| Rhombus | $A = \tfrac{1}{2}pq$ |

| Regular $n$-gon | $A = \dfrac{na^{2}}{4\tan(\pi/n)}$ |

| Annulus | $A = \pi(R^{2} - r^{2})$ |

## Area under a curve and between two curves

The area between $y = f(x)$ and $y = g(x)$ from $x = a$ to $x = b$ is

$$A = \int_{a}^{b}\left|f(x) - g(x)\right|dx$$

If the curves cross inside the interval, each part is integrated separately and the absolute values are added. The calculator finds the crossings and splits the interval for you. Example: $y = x$ and $y = x^{2}$ cross at $x = 0$ and $x = 1$.

$$A = \int_{0}^{1}(x - x^{2})\,dx = \left[\frac{x^{2}}{2} - \frac{x^{3}}{3}\right]_{0}^{1} = \frac{1}{6}$$

## Thai land units

| Unit | Equals | Square metres |

| 1 square wa (talang wa) | 2 m × 2 m | 4 m² |

| 1 ngan | 100 square wa | 400 m² |

| 1 rai | 4 ngan = 400 square wa | 1,600 m² |

| 1 hectare | 6 rai 1 ngan | 10,000 m² |

| 1 acre | about 2 rai 2 ngan 12 square wa | 4,046.86 m² |

Example: a plot of 1 rai 2 ngan 50 square wa is $1{,}600 + 800 + 200 = 2{,}600$ m².

## Polygon area from coordinates

With the corner coordinates $(x_i, y_i)$ listed in order around the outline, the shoelace formula gives the area. Surveyors use the same method to compute a plot's area from boundary-marker coordinates.

$$A = \frac{1}{2}\left|\sum_{i=1}^{n}\left(x_i y_{i+1} - x_{i+1} y_i\right)\right|, \qquad (x_{n+1}, y_{n+1}) = (x_1, y_1)$$

Coordinates can be in metres or wa, and the result is also given in rai, ngan and square wa. Treat it as an estimate: the legal area of a Thai plot is the one on the title deed, as surveyed by the Department of Lands.

## Learn the theory

- Integral calculator

- Derivative calculator

- Precalculus in English

- Applications of integration (in Thai)

## Frequently asked questions

How many square metres is one rai?
1 rai = 4 ngan = 400 square wa = 1,600 m², because one square wa is 2 m × 2 m = 4 m².

How is area under a curve different from a definite integral?
A definite integral counts parts below the x-axis as negative; area counts everything as positive. The integral of sin x from 0 to 2π is 0, but the area is 4.

How do I find the area of an irregular plot?
Measure the coordinates of each corner from one reference point and enter them in order in the “Polygon from coordinates” tab. Or split the plot into triangles and apply Heron's formula to the measured sides.

When is Heron's formula used?
When all three sides of a triangle are known but the height is not, which is common in field measurement because sides are easier to measure than heights.

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
Power factor calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**How many square metres is one rai?**
1 rai = 4 ngan = 400 square wa = 1,600 m², because one square wa is 2 m × 2 m = 4 m².

**How is area under a curve different from a definite integral?**
A definite integral counts parts below the x-axis as negative; area counts everything as positive. The integral of sin x from 0 to 2π is 0, but the area is 4.

**How do I find the area of an irregular plot?**
Measure the coordinates of each corner from one reference point and enter them in order in the “Polygon from coordinates” tab. Or split the plot into triangles and apply Heron's formula to the measured sides.

**When is Heron's formula used?**
When all three sides of a triangle are known but the height is not, which is common in field measurement because sides are easier to measure than heights.
