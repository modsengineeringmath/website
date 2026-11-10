---
title: "Integral Calculator: Indefinite and Definite Integrals, Checked by Differentiation"
url: https://modsengineeringmath.com/en/tools/integral-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Integrate a function online, free: antiderivatives and definite integrals. Handles substitution, integration by parts, partial fractions and trigonometric integrals, and gives the exact value, a decimal and a shaded graph. Every answer is checked by differentiating it back.

Markdown copy of https://modsengineeringmath.com/en/tools/integral-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Integral Calculator: Indefinite and Definite Integrals, Checked by Differentiation

THภาษาไทยENEnglish
// Tool · Integral Calculator


Type the integrand $f(x)$ and get the antiderivative $F(x) + C$. Add limits $a$ and $b$ for the definite integral in exact and decimal form with a shaded graph. An answer is shown only if differentiating it gives back the original function.

## Calculator

This calculator needs JavaScript.

## How to use it

- Type functions as in the derivative calculator: x^2*e^(3x), 1/(x^2+4), sin(x)^2.

- Leave $a$ and $b$ empty for the indefinite integral only.

- Limits can be expressions: pi/2, sqrt(2), e.

- If there is no closed form (for example $\dfrac{\sin x}{x}$), enter limits to get an accurate numerical value.

## Integration techniques covered

| Technique | Example | Result |

| Basic formulas and linear substitution | $\int (3x+1)^{4}dx$ | $\frac{1}{15}(3x+1)^{5} + C$ |

| Substitution $u = g(x)$ | $\int x e^{x^{2}}dx$ | $\frac{1}{2}e^{x^{2}} + C$ |

| Integration by parts | $\int x\cos x\,dx$ | $x\sin x + \cos x + C$ |

| Partial fractions | $\int \dfrac{dx}{x^{2}-1}$ | $\frac{1}{2}\ln\left|\dfrac{x-1}{x+1}\right| + C$ |

| Powers of trig functions | $\int \sin^{2}x\,dx$ | $\frac{x}{2} - \frac{1}{4}\sin 2x + C$ |

| Quadratics under a root | $\int \sqrt{1-x^{2}}\,dx$ | $\frac{1}{2}x\sqrt{1-x^{2}} + \frac{1}{2}\arcsin x + C$ |

| Exponential times trig | $\int e^{x}\sin x\,dx$ | $\frac{1}{2}e^{x}(\sin x - \cos x) + C$ |

When these rules are not enough, the open-source computer algebra library nerdamer is called, and its result goes through the same check before it is shown.

## The fundamental theorem of calculus

If $F'(x) = f(x)$ and $f$ is continuous on $[a, b]$, then

$$\int_{a}^{b} f(x)\,dx = F(b) - F(a)$$

Example: $\displaystyle\int_{0}^{\pi}\sin x\,dx = \left[-\cos x\right]_{0}^{\pi} = 1 - (-1) = 2$. A definite integral is a signed area: parts below the $x$-axis count as negative. For the true area use the area calculator.

## Checks and caveats

The derivative of the $F(x)$ found is compared numerically with $f(x)$ at 10 points; if they differ, no answer is shown. For a definite integral both $F(b) - F(a)$ and a Gauss–Kronrod numerical value are computed. If they disagree (the antiderivative is discontinuous on the interval, or the function is undefined somewhere), the numerical value is shown with a warning. Divergent improper integrals are flagged as unreliable.

## Learn the theory

- Derivative calculator

- Area calculator

- Fourier series calculator

- Integration formulas and methods (in Thai)

## Frequently asked questions

Why is there a + C?
The derivative of a constant is zero, so functions that differ by a constant share a derivative. The general antiderivative therefore carries an arbitrary constant C.

My answer differs from the book. Is it wrong?
Two antiderivatives can differ by a constant: −¼cos 2x and ½sin²x are both right. The sure test is to differentiate the answer and see the integrand come back, which this calculator does for you.

Which functions have no closed form?
sin(x)/x, e^(x²), 1/ln(x) and √(1 + x³), among others, have no antiderivative in elementary functions. Their definite integrals can still be computed numerically.

How accurate is the numerical value?
Adaptive 15-point Gauss–Kronrod quadrature is typically correct to 10 or more digits for smooth functions, and an error estimate is shown.

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Area calculator
Power factor calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**Why is there a + C?**
The derivative of a constant is zero, so functions that differ by a constant share a derivative. The general antiderivative therefore carries an arbitrary constant C.

**My answer differs from the book. Is it wrong?**
Two antiderivatives can differ by a constant: −¼cos 2x and ½sin²x are both right. The sure test is to differentiate the answer and see the integrand come back, which this calculator does for you.

**Which functions have no closed form?**
sin(x)/x, e^(x²), 1/ln(x) and √(1 + x³), among others, have no antiderivative in elementary functions. Their definite integrals can still be computed numerically.

**How accurate is the numerical value?**
Adaptive 15-point Gauss–Kronrod quadrature is typically correct to 10 or more digits for smooth functions, and an error estimate is shown.
