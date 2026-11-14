---
title: "Differential Equation Solver (ODE Solver): First and Second Order, With Every Step"
url: https://modsengineeringmath.com/en/tools/ode-solver/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-14
---

> Free online solver for ay″ + by′ + cy = f(t) and ay′ + by = f(t). Shows the characteristic equation, roots, particular solution, initial conditions, damping ratio and a graph, re-checked with RK4 every time. Works for RC, RLC, springs and resonance.

Markdown copy of https://modsengineeringmath.com/en/tools/ode-solver/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Differential Equation Solver (ODE Solver): First and Second Order, With Every Step

THภาษาไทยENEnglish
// Tools · Differential Equation Solver


Enter a, b and c, pick the forcing f(t), set the initial conditions and press Solve. The tool writes the characteristic equation, finds its roots, picks the form of the solution, finds the particular solution, applies the initial conditions and plots the result. Every answer is re-checked against a fourth-order Runge–Kutta integration before it is shown. It covers RC, RL and RLC circuits, springs and resonance.

## Solver

JavaScript is required for this tool.

## How to use it

- Pick the order, or press a preset button to start from a ready-made problem.

- Enter a, b and c. Fractions and constants work: 1/2, pi, sqrt(2).

- Choose f(t) and fill in A and ω (or k for an exponential).

- Enter y(0) and y′(0) and press Solve. The page URL updates with your inputs, so you can copy it and share the result.

## How the solver works

- Homogeneous part: substitute $y = e^{rt}$ to get the characteristic equation $ar^2 + br + c = 0$. Real, repeated or complex roots fix the form of $y_h$.

- Particular solution: guess a form that matches f(t) (undetermined coefficients). If the guess duplicates a term of $y_h$, multiply by t (resonance).

- Initial conditions: substitute y(0) and y′(0) into $y = y_h + y_p$ and solve for C₁ and C₂.

| Roots of $ar^2 + br + c = 0$ | Form of $y_h$ | Physical behaviour |

| two real $r_1, r_2$ | $C_1e^{r_1t} + C_2e^{r_2t}$ | overdamped, no oscillation |

| repeated $r$ | $(C_1 + C_2t)e^{rt}$ | critically damped, fastest without overshoot |

| complex $\alpha \pm j\beta$ | $e^{\alpha t}(C_1\cos\beta t + C_2\sin\beta t)$ | underdamped, rings and decays |

The complex case comes from Euler's formula $e^{j\beta t} = \cos\beta t + j\sin\beta t$: with real coefficients, the real and imaginary parts are separate solutions.

| f(t) | Guess for $y_p$ | If it duplicates $y_h$ |

| constant K | $A$ | multiply by t |

| $Ae^{kt}$ | $Be^{kt}$ | multiply by t, or t² if k is a repeated root |

| $A\cos\omega t$ or $A\sin\omega t$ | $P\cos\omega t + Q\sin\omega t$ | multiply by t (resonance) |

## Worked example: an underdamped spring

$y'' + 2y' + 5y = 0$, $y(0) = 1$, $y'(0) = 0$ is the default problem.

- $r^2 + 2r + 5 = 0 \Rightarrow r = -1 \pm 2j$, so $y = e^{-t}(C_1\cos2t + C_2\sin2t)$.

- $y(0) = C_1 = 1$ and $y'(0) = -C_1 + 2C_2 = 0 \Rightarrow C_2 = \tfrac12$.

- Combine into one wave with $a\cos\theta + b\sin\theta = R\cos(\theta - \varphi)$: $R = \tfrac{\sqrt5}{2} \approx 1.118$, $\tan\varphi = \tfrac12 \Rightarrow \varphi \approx 26.57^\circ$.

$y = e^{-t}\big(\cos2t + \tfrac12\sin2t\big) = 1.118\,e^{-t}\cos(2t - 26.57^\circ)$ · ζ = 1/√5 ≈ 0.447, ωₙ = √5

Second example, the "RLC with a DC source" preset: $y'' + 4y' + 3y = 3$ from rest gives $y_p = 1$, roots −1 and −3, and $y = 1 - \tfrac32e^{-t} + \tfrac12e^{-3t}$, which settles at 1 without overshoot (overdamped, ζ ≈ 1.155).

## Frequently asked questions

Which differential equations does this solver handle?
Constant-coefficient linear equations: first order ay′ + by = f(t) and second order ay″ + by′ + cy = f(t), where f(t) is zero, a constant, an exponential Ae^{kt}, or a sinusoid A cos ωt or A sin ωt, with initial conditions. That covers RC, RL and RLC circuits, mass–spring–damper problems and resonance.

How reliable are the answers?
Every time you solve, the tool integrates the same equation numerically with fourth-order Runge–Kutta and compares it with the closed form over the whole time window. If they disagree, the formula is withheld and only the numerical curve is shown. The open circles on the graph are the RK4 values.

Why do complex roots give cosines and sines?
A complex root α ± jβ gives e^{(α+jβ)t} = e^{αt}(cos βt + j sin βt) by Euler's formula. Because the coefficients are real, the real and imaginary parts are separate solutions, so y = e^{αt}(C₁ cos βt + C₂ sin βt).

What does resonance look like here?
If the forcing frequency equals the natural frequency and there is no damping (b = 0), the particular solution picks up a factor t and the amplitude grows linearly. Press the resonance preset to see it.

Can I share a result?
Yes. Each time you solve, the inputs are written into the page URL. Copy the address bar and send it; the link opens with the same equation and the same steps.

## More tools

Convolution calculator
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
All tools →

## Frequently asked questions

**Which differential equations does this solver handle?**
Constant-coefficient linear equations: first order ay′ + by = f(t) and second order ay″ + by′ + cy = f(t), where f(t) is zero, a constant, an exponential Ae^{kt}, or a sinusoid A cos ωt or A sin ωt, with initial conditions. That covers RC, RL and RLC circuits, mass–spring–damper problems and resonance.

**How reliable are the answers?**
Every time you solve, the tool integrates the same equation numerically with fourth-order Runge–Kutta and compares it with the closed form over the whole time window. If they disagree, the formula is withheld and only the numerical curve is shown. The open circles on the graph are the RK4 values.

**Why do complex roots give cosines and sines?**
A complex root α ± jβ gives e^{(α+jβ)t} = e^{αt}(cos βt + j sin βt) by Euler's formula. Because the coefficients are real, the real and imaginary parts are separate solutions, so y = e^{αt}(C₁ cos βt + C₂ sin βt).

**What does resonance look like here?**
If the forcing frequency equals the natural frequency and there is no damping (b = 0), the particular solution picks up a factor t and the amplitude grows linearly. Press the resonance preset to see it.

**Can I share a result?**
Yes. Each time you solve, the inputs are written into the page URL. Copy the address bar and send it; the link opens with the same equation and the same steps.
