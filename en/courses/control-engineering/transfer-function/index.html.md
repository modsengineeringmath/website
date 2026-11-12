---
title: "The Laplace Transform and Transfer Functions"
url: https://modsengineeringmath.com/en/courses/control-engineering/transfer-function/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> Build the mathematical model of a system from its differential equation, convert it to a transfer function G(s), find the poles and DC gain, and calculate the step response of an RC circuit and a mass-spring-damper system, with plots.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/transfer-function/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# The Laplace Transform and Transfer Functions

// Unit 2 · Control Engineering


Build the mathematical model of a system from its differential equation, convert it to a transfer function G(s), find the poles and DC gain, and calculate the step response of an RC circuit and a mass-spring-damper system, with plots.

## What you can do after this unit

- Write the differential equations of an RC circuit and a mass-spring-damper system
- Convert a differential equation to a transfer function with the Laplace transform
- Find the poles, zeros and DC gain of a transfer function
- Calculate and sketch the step response of first-order systems and of second-order systems with real poles

## From a real system to an equation

In Unit 1 we drew the plant as a box $G(s)$ without asking what is inside. This unit builds $G(s)$ from physical laws. The steps are the same for every system.

- Write the differential equation from the laws of the system, such as Kirchhoff's laws or Newton's second law.

- Take the Laplace transform of the whole equation with zero initial conditions.

- Rearrange as the ratio of output to input.

The result of step 3 is the transfer function.

Definition

The transfer function of a linear time-invariant system is the ratio of the Laplace transform of the output to the Laplace transform of the input, with all initial conditions zero.

$$G(s) = \frac{Y(s)}{U(s)}$$

Only one property of the Laplace transform is needed in this unit: differentiation in time becomes multiplication by $s$ when the initial conditions are zero.

$$\mathcal{L}\left\{\frac{dy}{dt}\right\} = sY(s), \qquad \mathcal{L}\left\{\frac{d^2y}{dt^2}\right\} = s^2Y(s)$$

## A first-order system: the RC circuit

A series RC circuit has input voltage $v_i(t)$, and the output $v_o(t)$ is measured across the capacitor. The loop current is $i = C\,\dfrac{dv_o}{dt}$, and Kirchhoff's voltage law gives $v_i = Ri + v_o$, so

$$RC\,\frac{dv_o}{dt} + v_o = v_i$$

Transforming: $RCs\,V_o(s) + V_o(s) = V_i(s)$, hence

$$G(s) = \frac{V_o(s)}{V_i(s)} = \frac{1}{RCs + 1} = \frac{1}{\tau s + 1}, \qquad \tau = RC$$

$\tau$ is the time constant. The system has one pole at $s = -1/\tau$ and a DC gain of $G(0) = 1$.

Example 2.1 Step response of an RC circuit

Let $R = 10\ \text{k}\Omega$ and $C = 100\ \mu\text{F}$. A 1 V step is applied at $t = 0$. Find $v_o(t)$.

Step 1. Time constant: $\tau = RC = (10 \times 10^{3})(100 \times 10^{-6}) = 1$ s, so $G(s) = \dfrac{1}{s + 1}$.

Step 2. The step input is $V_i(s) = \dfrac{1}{s}$, so

$$V_o(s) = \frac{1}{s(s + 1)} = \frac{1}{s} - \frac{1}{s + 1}$$

Step 3. Inverse transform.

$$v_o(t) = 1 - e^{-t} \quad \text{V}, \qquad t \ge 0$$

Step 4. Read the key values: at $t = \tau = 1$ s, $v_o = 1 - e^{-1} = 0.632$ V, or 63.2 % of the final value; the output is within 2 % of the final value at $t \approx 4\tau = 4$ s (0.982 V at $t = 4$ s).

This is the shape of every first-order system, whether it is the temperature of an oven, the level in a tank or the speed of a motor with negligible inductance. Only $\tau$ and the gain differ.

## A second-order system: mass, spring and damper

A mass $m$ is attached to a wall by a spring of constant $k$ and a damper $b$, and an external force $f(t)$ acts on it. With $x(t)$ the displacement, Newton's second law gives

$$m\,\frac{d^2x}{dt^2} + b\,\frac{dx}{dt} + kx = f(t)$$

Transform and rearrange.

$$G(s) = \frac{X(s)}{F(s)} = \frac{1}{ms^2 + bs + k}$$

The denominator is a quadratic, so the system has two poles, and the DC gain is $G(0) = 1/k$, in agreement with Hooke's law: once the system has come to rest, the extension equals the force divided by the spring constant.

Example 2.2 Step response with real poles

Let $m = 1$ kg, $b = 3$ N·s/m, $k = 2$ N/m. A constant force of 1 N is applied from $t = 0$. Find $x(t)$.

Step 1. Transfer function and poles.

$$G(s) = \frac{1}{s^2 + 3s + 2} = \frac{1}{(s + 1)(s + 2)}$$

The poles are at $s = -1$ and $s = -2$, both real and negative, so the response does not oscillate.

Step 2. Multiply by the step input $F(s) = 1/s$ and expand in partial fractions.

$$X(s) = \frac{1}{s(s + 1)(s + 2)} = \frac{A}{s} + \frac{B}{s + 1} + \frac{C}{s + 2}$$

By the cover-up method

$$A = \frac{1}{(1)(2)} = \frac{1}{2}, \qquad B = \frac{1}{(-1)(1)} = -1, \qquad C = \frac{1}{(-2)(-1)} = \frac{1}{2}$$

Step 3. Inverse transform.

$$x(t) = \frac{1}{2} - e^{-t} + \frac{1}{2}e^{-2t} \quad \text{m}, \qquad t \ge 0$$

Step 4. Check: at $t = 0$, $x = \tfrac12 - 1 + \tfrac12 = 0$, as the initial condition requires, and as $t \to \infty$, $x = 0.5$ m, equal to the DC gain $1/k$.

Compare with the RC plot and note the difference at the start. A second-order system sets off with zero slope because the mass has inertia, while a first-order system sets off at its steepest slope.

Poles give the shape of the response

Each pole at $s = -p$ contributes a term $e^{-pt}$ to the response. The pole nearer the imaginary axis (here $s = -1$) decays more slowly, so it decides how fast the system settles. It is called the dominant pole. If the poles are complex the response oscillates, which is the subject of Unit 6.

## The same forms in electrical equipment

The two equations of this unit appear again and again in electrical equipment. Once you know the form, you can read the behaviour of a new device without solving a new equation.

|
Device |
Input → output |
Transfer function |
Time constant or natural frequency |

|
RC circuit (low-pass filter, delay circuit) |
$v_i \to v_C$ |
$\dfrac{1}{RCs + 1}$ |
$\tau = RC$ |

|
RL circuit (contactor coil, motor field winding) |
$v \to i$ |
$\dfrac{1/R}{(L/R)s + 1}$ |
$\tau = L/R$ |

|
Temperature sensor (thermocouple, RTD) |
true temperature → reading |
$\dfrac{1}{\tau s + 1}$ |
$\tau$ of the probe |

|
Series RLC circuit (converter LC filter) |
$v_i \to v_C$ |
$\dfrac{1}{LCs^2 + RCs + 1}$ |
$\omega_n = 1/\sqrt{LC}$ |

|
DC motor |
armature voltage → speed |
$\dfrac{K_m}{\tau_m s + 1}$ (approximately) |
mechanical $\tau_m$ |

Unit 3 derives each of these transfer functions.

## Exercises

Exercise 2.1

An RC circuit has $R = 4.7\ \text{k}\Omega$ and $C = 10\ \mu\text{F}$. Find the transfer function, the pole and the time at which the output reaches 63.2 % of its final value for a step input.

Show answer

$\tau = RC = (4.7 \times 10^{3})(10 \times 10^{-6}) = 0.047$ s, so

$$G(s) = \frac{1}{0.047s + 1}$$

The pole is at $s = -1/0.047 = -21.3$ rad/s and the output reaches 63.2 % at $t = \tau = 47$ ms.

Exercise 2.2

A mass-spring-damper system has $m = 1$ kg, $b = 5$ N·s/m, $k = 4$ N/m. A constant force of 2 N is applied from $t = 0$. Find $x(t)$ and the final value.

Show answer

$$G(s) = \frac{1}{s^2 + 5s + 4} = \frac{1}{(s + 1)(s + 4)}, \qquad X(s) = \frac{2}{s(s + 1)(s + 4)}$$

Partial fractions: $A = \dfrac{2}{(1)(4)} = \dfrac12$, $B = \dfrac{2}{(-1)(3)} = -\dfrac23$, $C = \dfrac{2}{(-4)(-3)} = \dfrac16$

$$x(t) = \frac12 - \frac23 e^{-t} + \frac16 e^{-4t} \quad \text{m}$$

The final value is 0.5 m, equal to $F/k = 2/4$, and at $t = 0$, $\tfrac12 - \tfrac23 + \tfrac16 = 0$.

## Summary of Unit 2

- A model starts from a differential equation; transforming with zero initial conditions gives $G(s) = Y(s)/U(s)$.

- RC circuit: $G(s) = \dfrac{1}{\tau s + 1}$, step response $1 - e^{-t/\tau}$, reaching 63.2 % at $t = \tau$.

- Mass-spring-damper: $G(s) = \dfrac{1}{ms^2 + bs + k}$, DC gain $1/k$.

- The poles of $G(s)$ give the shape of the response. Real negative poles give decaying exponentials.

The next unit applies the same method to electrical systems, rotating mechanical systems and the DC motor, the most common plant in control work.
