---
title: "Derivative Calculator: f′(x) with the Rules Used, Tangent Line and Graph"
url: https://modsengineeringmath.com/en/tools/derivative-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Differentiate a function online, free, up to the 4th order. See which rule applies to each term (product, quotient, chain), the value at a point, the tangent line, and a graph of f and f′. Handles trigonometric, exponential, logarithmic and inverse functions. Every answer is checked numerically.

Markdown copy of https://modsengineeringmath.com/en/tools/derivative-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Derivative Calculator: f′(x) with the Rules Used, Tangent Line and Graph

THภาษาไทยENEnglish
// Tool · Derivative Calculator


Type $f(x)$ and get a tidy $f'(x)$ with term-by-term working that names each rule. Choose the order up to 4, evaluate at a point for the slope and tangent line, and see $f$ and its derivative on one graph.

## Calculator

This calculator needs JavaScript.

## How to type a function

- Multiplication can be implied: 3x, x sin(x), (x+1)(x-2). Powers: x^3. Division: (x^2+1)/(x-1).

- Functions: sin cos tan sec csc cot, asin acos atan, sinh cosh tanh, exp or e^x, ln, log (base 10), sqrt, abs.

- Letters other than the variable are constants: a*x^2 + b*x gives $2ax + b$.

- To differentiate with respect to another variable, type its name in the “Variable” box.

## The differentiation rules used

| Rule | Formula |

| Power rule | $\dfrac{d}{dx}x^{n} = nx^{n-1}$ |

| Product rule | $(uv)' = u'v + uv'$ |

| Quotient rule | $\left(\dfrac{u}{v}\right)' = \dfrac{u'v - uv'}{v^{2}}$ |

| Chain rule | $\dfrac{d}{dx}f(g(x)) = f'(g(x))\,g'(x)$ |

| Exponential and logarithm | $(e^{x})' = e^{x}$, $(a^{x})' = a^{x}\ln a$, $(\ln x)' = \dfrac{1}{x}$ |

| Trigonometric | $(\sin x)' = \cos x$, $(\cos x)' = -\sin x$, $(\tan x)' = \sec^{2}x$ |

| Inverse trigonometric | $(\arcsin x)' = \dfrac{1}{\sqrt{1-x^{2}}}$, $(\arctan x)' = \dfrac{1}{1+x^{2}}$ |

| Function to the power of a function | $\left(u^{v}\right)' = u^{v}\left(v'\ln u + \dfrac{v\,u'}{u}\right)$ |

## A worked example by hand

Differentiate $f(x) = x^{3}\sin 2x$. It is a product of $u = x^{3}$ and $v = \sin 2x$, with $u' = 3x^{2}$ and $v' = 2\cos 2x$ (chain rule).

$$f'(x) = u'v + uv' = 3x^{2}\sin 2x + 2x^{3}\cos 2x$$

At $x = 1$: $f'(1) = 3\sin 2 + 2\cos 2 \approx 1.8956$, the slope of the tangent line there.

## How answers are checked

The derivative comes from symbolic rules, so it is exact rather than an approximation. It is then checked against a 4th-order finite-difference derivative at 10 test points. The form may differ from a textbook's answer (a common factor may not be pulled out), but the value is the same.

## Learn the theory

- Integral calculator

- Area calculator

- LaTeX equation editor

- Derivative lessons (in Thai)

## Frequently asked questions

My answer looks different from the book. Is it wrong?
Usually not. A derivative can be written in several forms; 2 sin x cos x and sin 2x are equal. Substitute a value of x into both to compare. This calculator checks numerically every time.

Can it do partial derivatives?
Yes. Type a function of several variables, such as x^2*y + sin(y), and name the variable in the “Variable” box. Other letters are held constant, which is exactly a partial derivative.

Which base is log?
log is base 10 and ln is the natural logarithm.

How high can the order go?
Up to the 4th order, and every intermediate derivative is shown.

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Integral calculator
Area calculator
Power factor calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**My answer looks different from the book. Is it wrong?**
Usually not. A derivative can be written in several forms; 2 sin x cos x and sin 2x are equal. Substitute a value of x into both to compare. This calculator checks numerically every time.

**Can it do partial derivatives?**
Yes. Type a function of several variables, such as x^2*y + sin(y), and name the variable in the “Variable” box. Other letters are held constant, which is exactly a partial derivative.

**Which base is log?**
log is base 10 and ln is the natural logarithm.

**How high can the order go?**
Up to the 4th order, and every intermediate derivative is shown.
