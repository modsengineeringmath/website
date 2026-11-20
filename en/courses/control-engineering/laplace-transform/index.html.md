---
title: "The Laplace Transform"
url: https://modsengineeringmath.com/en/courses/control-engineering/laplace-transform/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-18
---

> The definition of the Laplace transform, existence and the region of convergence, basic pairs proved from the definition, every key property, the initial and final value theorems and solving differential equations, with a lab and exercises.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/laplace-transform/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# The Laplace Transform

// Unit 3 · Control Engineering · The Laplace Transform


The definition of the Laplace transform, existence and the region of convergence, basic pairs proved from the definition, every key property, the initial and final value theorems and solving differential equations, with a lab and exercises.

## What you can do after this unit

- Write the definition of the Laplace transform and state the existence condition and region of convergence (ROC)
- Prove the basic pairs (step, exponential, sine, cosine, ramp) from the definition
- Use the properties (linearity, differentiation, integration, s-shift, t-shift, convolution) to transform more complex functions
- Apply the initial and final value theorems and check when they are valid
- Solve linear differential equations with initial conditions by Laplace, and link the result to the transfer function

## Why transform

The differential equation of a plant can be solved directly, but every time you must guess a solution, fit constants and handle the initial conditions.

The Laplace transform makes differentiation into multiplication by $s$. A differential equation becomes an algebraic one, and the initial conditions enter the equation from the start.

More important, it gives the transfer function, the common language of this course, and it ties time to the $s$-plane we built in Unit 2.

## Definition

The (one-sided) Laplace transform of $f(t)$ for $t \ge 0$ is

$$F(s) = \mathcal{L}\{f(t)\} = \int_{0^-}^{\infty} f(t)\,e^{-st}\,dt, \qquad s = \sigma + j\omega$$

We use the lower limit $0^-$ so that an impulse at $t = 0$ and the initial conditions before a switch closes are included.

Since $e^{-st} = e^{-\sigma t}e^{-j\omega t}$, the factor $e^{-\sigma t}$ tames functions that grow exponentially, so the integral can converge if $\sigma$ is large enough.

### Existence and the region of convergence (ROC)

If there are constants $M$ and $\alpha$ such that $\lvert f(t)\rvert \le M e^{\alpha t}$ for $t \ge 0$ (called exponential order), the integral converges for

$$\operatorname{Re}\,s > \alpha$$

This is the region of convergence (ROC), a half-plane to the right of a vertical line.

The function $e^{t^2}$ grows faster than any exponential, so it has no Laplace transform.

ROC and poles

For a signal that starts at $t=0$, the ROC is always to the right of the rightmost pole of $F(s)$. In control work we usually quote $F(s)$ without the ROC because we know it is a right-sided one.

## Basic pairs from the definition

Step, $f = 1$

$$F(s) = \int_0^\infty e^{-st}dt = \left[-\frac{e^{-st}}{s}\right]_0^\infty = \frac{1}{s}, \qquad \operatorname{Re}\,s > 0$$

Exponential, $f = e^{-at}$

$$F(s) = \int_0^\infty e^{-(s+a)t}dt = \frac{1}{s + a}, \qquad \operatorname{Re}\,s > -a$$

Impulse, $\delta(t)$. The sifting property of the impulse gives $\mathcal{L}\{\delta\} = 1$.

Ramp, $f = t$. Integration by parts gives $\dfrac{1}{s^2}$ (checked later with a property).

Sine and cosine. Write $\sin\omega t = \dfrac{e^{j\omega t} - e^{-j\omega t}}{2j}$ and use the exponential with $a = \mp j\omega$.

$$\mathcal{L}\{\sin\omega t\} = \frac{1}{2j}\left(\frac{1}{s - j\omega} - \frac{1}{s + j\omega}\right) = \frac{\omega}{s^2 + \omega^2}$$

$$\mathcal{L}\{\cos\omega t\} = \frac{1}{2}\left(\frac{1}{s - j\omega} + \frac{1}{s + j\omega}\right) = \frac{s}{s^2 + \omega^2}$$

|
$f(t)$ |
$F(s)$ |

|
$\delta(t)$ |
$1$ |

|
$1$ |
$\dfrac{1}{s}$ |

|
$t$ |
$\dfrac{1}{s^2}$ |

|
$t^n$ |
$\dfrac{n!}{s^{n+1}}$ |

|
$e^{-at}$ |
$\dfrac{1}{s + a}$ |

|
$\sin\omega t$ |
$\dfrac{\omega}{s^2 + \omega^2}$ |

|
$\cos\omega t$ |
$\dfrac{s}{s^2 + \omega^2}$ |

Notice that the poles of $F(s)$ in the table are the forms of $f(t)$ from Unit 2. A pole at $-a$ gives $e^{-at}$ and poles at $\pm j\omega$ give a sustained oscillation.

## Properties used throughout the course

Let $\mathcal{L}\{f\} = F(s)$ and $\mathcal{L}\{g\} = G(s)$.

|
Property |
Formula |

|
Linearity |
$\mathcal{L}\{af + bg\} = aF + bG$ |

|
Derivative |
$\mathcal{L}\{f'\} = sF(s) - f(0^-)$ |

|
Second derivative |
$\mathcal{L}\{f''\} = s^2F(s) - sf(0^-) - f'(0^-)$ |

|
Integral |
$\mathcal{L}\left\{\int_0^t f\,d\tau\right\} = \dfrac{F(s)}{s}$ |

|
Shift in $s$ |
$\mathcal{L}\{e^{-at}f(t)\} = F(s + a)$ |

|
Shift in $t$ |
$\mathcal{L}\{f(t - T)\,1(t - T)\} = e^{-sT}F(s)$ |

|
Multiply by $t$ |
$\mathcal{L}\{t f(t)\} = -\dfrac{dF}{ds}$ |

|
Convolution |
$\mathcal{L}\{f * g\} = F(s)\,G(s)$ |

Where the derivative property comes from. Integrate by parts.

$$\int_0^\infty f'(t)e^{-st}dt = \left[f e^{-st}\right]_0^\infty + s\int_0^\infty f e^{-st}dt = -f(0) + sF(s)$$

Inside the ROC the term at $t \to \infty$ is zero.

Example 3.1: using the s-shift

Find $\mathcal{L}\{e^{-2t}\cos 3t\}$.

Start from $\mathcal{L}\{\cos 3t\} = \dfrac{s}{s^2 + 9}$ and replace $s \to s + 2$.

$$\mathcal{L}\{e^{-2t}\cos 3t\} = \frac{s + 2}{(s + 2)^2 + 9}$$

The poles are at $s = -2 \pm j3$, matching an oscillation that decays at rate 2.

Example 3.2: using the t-shift

Find the transform of a ramp that starts at $t = 2$, that is $f(t) = (t - 2)\,1(t - 2)$.

By the property, $e^{-2s}\cdot\mathcal{L}\{t\} = \dfrac{e^{-2s}}{s^2}$.

A delay of $T$ seconds in time is a factor $e^{-sT}$ in the $s$-domain, which is not a rational function. This is where $e^{-sT}$ comes from in systems with transport delay.

## The initial and final value theorems

These two theorems give the value of $f(t)$ at both ends without inverting.

$$\textbf{Initial value:}\quad f(0^+) = \lim_{s\to\infty} sF(s)$$

$$\textbf{Final value:}\quad \lim_{t\to\infty} f(t) = \lim_{s\to 0} sF(s)$$

Where they come from. Use the derivative property, $sF(s) - f(0) = \int_0^\infty f'(t)e^{-st}dt$, then let $s \to \infty$ (the right side goes to zero) or $s \to 0$ (the right side becomes $f(\infty) - f(0)$).

The final value theorem has a condition

It holds only if all poles of $sF(s)$ lie strictly to the left of the $j\omega$ axis (the pole at $s = 0$ having already been cancelled). With poles on the $j\omega$ axis or to its right, the formula can return a meaningless value.

For example, $f = \sin t$ gives $F = \dfrac{1}{s^2 + 1}$ and $\lim_{s\to 0} sF = 0$, but $\sin t$ does not converge to anything.

## Solving differential equations with Laplace

There are three steps: transform the equation, solve the algebra for $Y(s)$, and invert.

Example 3.3

Solve $\ddot y + 3\dot y + 2y = u(t)$ where $u$ is a unit step, with $y(0) = 1,\ \dot y(0) = 0$.

Transform both sides.

$$\left(s^2 Y - s\cdot 1 - 0\right) + 3\left(sY - 1\right) + 2Y = \frac{1}{s}$$

Solve for $Y$.

$$Y(s)\,(s^2 + 3s + 2) = s + 3 + \frac{1}{s} = \frac{s^2 + 3s + 1}{s}$$

$$Y(s) = \frac{s^2 + 3s + 1}{s(s+1)(s+2)}$$

Partial fractions. $Y = \dfrac{1/2}{s} + \dfrac{1}{s + 1} - \dfrac{1/2}{s + 2}$

Invert.

$$y(t) = \tfrac12 + e^{-t} - \tfrac12 e^{-2t}$$

Check: $y(0) = 0.5 + 1 - 0.5 = 1$ ✓ and $\dot y(0) = -1 + 1 = 0$ ✓.

Check with the theorems. $\lim_{s\to\infty} sY = 1 = y(0)$ ✓ and $\lim_{s\to 0}sY = \tfrac12 = y(\infty)$ ✓. The poles $0,-1,-2$ satisfy the condition.

Notice the two sources of terms. The part driven by the initial conditions, $(s+3)/(s^2+3s+2)$, is the zero-input response. The part driven by the input, $\dfrac{1}{s(s^2+3s+2)}$, is the zero-state response. A linear system simply adds them.

## From Laplace to the transfer function

If all initial conditions are zero, Example 3.3 gives

$$\frac{Y(s)}{U(s)} = \frac{1}{s^2 + 3s + 2}$$

This is the transfer function: the ratio of the Laplace transform of the output to that of the input, with zero initial conditions.

It depends only on the system, not on the input. The roots of the denominator are the poles and they set the form of the whole response. Later units take this further.

Example 3.4: an RC circuit

A series RC circuit has input voltage $v_i$ and output voltage $v_o$ across the capacitor. Kirchhoff's law gives $RC\,\dot v_o + v_o = v_i$.

Transform with $v_o(0) = 0$.

$$RC\,s V_o + V_o = V_i \;\Longrightarrow\; \frac{V_o}{V_i} = \frac{1}{RCs + 1}$$

It is a first-order system with a pole at $s = -1/(RC)$ and a time constant $\tau = RC$.

## Lab: the differential-equation solver

The step-by-step solver for Example 3.3 lives in the library. You can change the initial conditions and the input and see the zero-input and zero-state responses separately. Its interface is in Thai, but the equations and every step are shown in standard notation.

Open the solver in the library

## Exercises

Exercise 3.1 Using properties

Find (a) $\mathcal{L}\{t e^{-3t}\}$ (b) $\mathcal{L}\{5 - 2e^{-4t} + \sin 2t\}$ (c) $\mathcal{L}\{e^{-t}\sin 2t\}$

Show answer

(a) $\mathcal{L}\{t\} = 1/s^2$, then shift $s \to s+3$ to get $\dfrac{1}{(s+3)^2}$

(b) By linearity: $\dfrac{5}{s} - \dfrac{2}{s + 4} + \dfrac{2}{s^2 + 4}$

(c) $\dfrac{2}{(s+1)^2 + 4}$

Exercise 3.2 A first-order equation

Solve $\dot y + 4y = 8$ (a step of size 8) with $y(0) = 1$.

Show answer

$sY - 1 + 4Y = 8/s$ gives $Y = \dfrac{s + 8}{s(s+4)} = \dfrac{2}{s} - \dfrac{1}{s + 4}$

$$y(t) = 2 - e^{-4t}$$

Check: $y(0) = 1$ ✓. The final value is 2 and the time constant is $1/4$ s.

Exercise 3.3 Initial and final value

$F(s) = \dfrac{10}{s(s+2)}$. Find $f(0^+)$ and $f(\infty)$ without inverting, and check the condition.

Show answer

$f(0^+) = \lim_{s\to\infty} \dfrac{10}{s+2} = 0$

$f(\infty) = \lim_{s\to 0}\dfrac{10}{s+2} = 5$

$sF(s) = \dfrac{10}{s+2}$ has a single pole at $-2$, strictly in the left half-plane, so the theorem applies. Check: $f(t) = 5(1 - e^{-2t})$ ✓

Exercise 3.4 A rectangular pulse

A signal is a pulse of height 1 starting at $t=1$ and ending at $t=3$. Write it as a difference of two steps and find $F(s)$.

Show answer

$f(t) = 1(t-1) - 1(t-3)$

$$F(s) = \frac{e^{-s} - e^{-3s}}{s}$$

Exercise 3.5 Multiplying by t (advanced)

Show that $\mathcal{L}\{t\sin\omega t\} = \dfrac{2\omega s}{(s^2 + \omega^2)^2}$.

Show answer

Use $\mathcal{L}\{tf\} = -F'(s)$ with $F = \dfrac{\omega}{s^2 + \omega^2}$.

$$-\frac{d}{ds}\frac{\omega}{s^2 + \omega^2} = \frac{\omega\cdot 2s}{(s^2 + \omega^2)^2}$$

Exercise 3.6 Convolution (advanced)

Find $e^{-t} * e^{-2t}$ from the definition of convolution, then check it with the Laplace transform.

Show answer

$$\int_0^t e^{-\tau}e^{-2(t-\tau)}d\tau = e^{-2t}\int_0^t e^{\tau}d\tau = e^{-2t}(e^{t} - 1) = e^{-t} - e^{-2t}$$

Laplace: $\dfrac{1}{s+1} - \dfrac{1}{s+2} = \dfrac{1}{(s+1)(s+2)}$, which equals the product $\dfrac{1}{s+1}\cdot\dfrac{1}{s+2}$ ✓

Exercise 3.7 Existence (advanced)

Does $e^{t^2}$ have a Laplace transform? What is the ROC of $e^{5t}$?

Show answer

$e^{t^2}$ does not, because $e^{t^2}e^{-\sigma t}$ does not converge however large $\sigma$ is (it grows faster than any exponential).

$e^{5t}$ gives $\dfrac{1}{s - 5}$ for $\operatorname{Re}\,s > 5$. The pole is on the right, so a system with this pole is unstable.

## Summary

- The Laplace transform turns derivatives into multiplication by $s$ and differential equations into algebra

- For a signal starting at $t = 0$ the ROC is to the right of the rightmost pole

- The main properties are linearity, differentiation, shift in $s$, shift in $t$ and convolution

- The final value theorem holds only when the poles of $sF(s)$ are strictly in the left half-plane

- The transfer function is the ratio $Y/U$ with zero initial conditions

Next unit. The inverse Laplace transform, by partial fractions and residues.
