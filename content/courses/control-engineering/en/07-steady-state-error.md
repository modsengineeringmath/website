---
title: Steady-State Error and System Type
description: Use the final value theorem to find steady-state error, define system type and the error constants Kp, Kv, Ka, and summarise the errors for step, ramp and parabolic inputs, with examples of an AVR, droop frequency control and a position servo.
keywords: steady-state error, system type, static error constants, final value theorem, position constant velocity constant, AVR gain, governor droop steady-state frequency deviation, following error servo
published: 2026-11-12
updated: 2026-11-12
time: 35
outcomes:
  - Use the final value theorem to find the steady-state error of a unity-feedback system
  - State the system type from the number of integrators in the loop
  - Calculate the error constants and the errors for step, ramp and parabolic inputs
  - Explain why the integral part of a controller removes the error from constant inputs and constant disturbances
deeper:
  - Steady-state error, in-depth version (Thai) | /learn/control-systems/steady-state-error/
  - Power systems (Thai) | /learn/power-systems/
---

## The picture to keep in mind: no error, no drive {#idea}

A proportional controller drives the plant in proportion to the error. If the error is zero, the command is zero. But a motor that is turning needs some voltage to keep turning. The system therefore has to tolerate a small remaining error to produce that voltage. That remainder is the **steady-state error**.

The way out is to give the controller a **memory**. An integrator accumulates the error. When the error has become zero, the integrator output stays at exactly the value needed. This unit turns that idea into numbers.

## The final value theorem {#fvt}

For a unity-feedback system with loop transfer function $L(s) = C(s)G(s)$, the error is

$$E(s) = R(s) - Y(s) = \frac{R(s)}{1 + L(s)}$$

The **final value theorem** gives its value after a long time without inverting the transform.

$$e_{ss} = \lim_{t \to \infty} e(t) = \lim_{s \to 0} sE(s) = \lim_{s \to 0} \frac{sR(s)}{1 + L(s)}$$

:::warn Valid only when the closed loop is stable
If the system is unstable the error grows without bound, yet the formula may still return a number, which is meaningless. Always check stability first. Unit 8 shows how.
:::

## System type {#type}

Write $L(s)$ as

$$L(s) = \frac{K(s + z_1)(s + z_2)\cdots}{s^N(s + p_1)(s + p_2)\cdots}$$

The number $N$ of factors $s$ in the denominator, the number of **integrators in the loop**, is the **system type**.

| Type | Examples in electrical work |
|---|---|
| 0 | A motor speed loop or AVR voltage loop with a P controller |
| 1 | A position servo (position is the integral of speed), or any loop with a PI controller |
| 2 | A position servo with a PI controller; the phase-locked loop (PLL) of a grid-connected inverter |

## Error constants {#constants}

| Input | $R(s)$ | Constant | $e_{ss}$ |
|---|---|---|---|
| Step $A$ | $\dfrac{A}{s}$ | $K_p = \lim\limits_{s \to 0} L(s)$ | $\dfrac{A}{1 + K_p}$ |
| Ramp $At$ | $\dfrac{A}{s^2}$ | $K_v = \lim\limits_{s \to 0} sL(s)$ | $\dfrac{A}{K_v}$ |
| Parabola $\tfrac12At^2$ | $\dfrac{A}{s^3}$ | $K_a = \lim\limits_{s \to 0} s^2L(s)$ | $\dfrac{A}{K_a}$ |

Combined with the system type this gives a table used throughout the course.

| System type | Step | Ramp | Parabola |
|---|---|---|---|
| 0 | $\dfrac{A}{1 + K_p}$ | $\infty$ | $\infty$ |
| 1 | 0 | $\dfrac{A}{K_v}$ | $\infty$ |
| 2 | 0 | 0 | $\dfrac{A}{K_a}$ |

:::key The table in one sentence
Each integrator in the loop lets the system follow an input that is "one step harder" with no error. But each integrator also adds 90° of phase lag and makes the loop harder to stabilise, so use only as many as are needed.
:::

:::example Example 7.1 AVR gain
A generator voltage loop has an amplifier $K_A$, an exciter $\dfrac{1}{0.4s + 1}$ and a generator $\dfrac{1}{s + 1}$, with unity feedback. The voltage must be within 1 % of the setting. What $K_A$ is needed?

$L(s) = \dfrac{K_A}{(0.4s + 1)(s + 1)}$ has no integrator, so it is type 0 and $K_p = L(0) = K_A$.

$$e_{ss} = \frac{1}{1 + K_A} \le 0.01 \quad\Longrightarrow\quad K_A \ge 99$$

A gain this high makes the response very oscillatory, and once the other time constants in the loop are counted the system is unstable (see Example 8.2). A real AVR therefore uses integral action or a compensator instead of raising the gain alone.
:::

:::example Example 7.2 A position servo following a ramp
A servo has $L(s) = \dfrac{8.4}{s(s + 4)}$ (from Example 6.3). Find the error for a constant position command and for a command moving at a constant 2 rad/s.

The loop has one integrator: type 1.

- Constant position (step): $e_{ss} = 0$
- Constant speed (ramp, $A = 2$): $K_v = \lim\limits_{s \to 0} s\,\dfrac{8.4}{s(s + 4)} = 2.1$ s⁻¹, so $e_{ss} = \dfrac{2}{2.1} = 0.95$ rad

The machine axis lags the commanded position by 0.95 rad throughout the move. Servo drive manuals call this the following error.
:::

## Error caused by a disturbance {#disturbance}

When a constant disturbance $D_0$ enters between the controller $C(s)$ and the plant $G(s)$, the resulting error is

$$e_{ss} = -\lim_{s \to 0}\frac{G(s)}{1 + C(s)G(s)}\,D_0$$

If $C(s)$ contains an integrator, the denominator grows without bound as $s \to 0$ and $e_{ss} = 0$. The important point is that **the integrator must come before the point where the disturbance enters**. An integrator in the plant after that point does not reject the disturbance.

:::example Example 7.3 Governor droop and frequency control
In a power system, when the load rises by $\Delta P_L$ the frequency falls. A governor with regulation (droop) $R$ and a load with damping $D$ give the steady-state frequency deviation

$$\Delta f_{ss} = -\frac{\Delta P_L}{D + 1/R}$$

Take $R = 0.05$ pu (5 % droop), $D = 1$ pu and a load rise of 0.1 pu on a 50 Hz system.

$$\Delta f_{ss} = -\frac{0.1}{1 + 20} = -0.00476\ \text{pu} = -0.238\ \text{Hz}$$

The frequency rests at 49.76 Hz. A droop governor is a proportional controller, so an error remains. That is intended, because it lets several generators share load in proportion. Secondary control (AGC), which is an integral controller, then slowly adjusts generation until the frequency is back at 50 Hz.
:::

## Exercises {#exercises}

:::exercise Exercise 7.1
A motor speed loop has $L(s) = \dfrac{K}{0.074s + 1}$. The step error must not exceed 2 %. What $K$ is needed, and what would the error be with a PI controller?

:::answer Show answer
Type 0: $\dfrac{1}{1 + K} \le 0.02$ gives $K \ge 49$.

A PI controller adds one integrator, making the loop type 1. The step error is zero at any gain (as long as the loop is stable).
:::
:::

:::exercise Exercise 7.2
A unity-feedback system has $L(s) = \dfrac{50(s + 2)}{s(s + 5)(s + 10)}$. Find $K_p$, $K_v$, $K_a$ and the error for the ramp $r(t) = 3t$.

:::answer Show answer
Type 1: $K_p = \infty$, $K_v = \dfrac{50 \times 2}{5 \times 10} = 2$ s⁻¹, $K_a = 0$

$e_{ss} = \dfrac{3}{2} = 1.5$
:::
:::

:::exercise Exercise 7.3
In Example 7.3, if the frequency deviation must not exceed 0.1 Hz for a load rise of 0.1 pu, what droop $R$ is needed (take $D = 1$)?

:::answer Show answer
$0.1\ \text{Hz} = 0.002$ pu. We need $\dfrac{0.1}{1 + 1/R} \le 0.002$, so $1 + 1/R \ge 50$ and $R \le \dfrac{1}{49} = 0.0204$ pu, a droop of about 2 %.
:::
:::

## Summary of Unit 7 {#summary}

- $e_{ss} = \lim\limits_{s \to 0}\dfrac{sR(s)}{1 + L(s)}$, valid when the closed loop is stable.
- System type is the number of integrators in the loop. Type 0 leaves a step error; type 1 does not.
- The larger $K_p$, $K_v$, $K_a$, the smaller the error.
- An integrator in the controller removes the effect of a constant disturbance. Governor droop is a P controller that leaves an error on purpose.

The next unit answers the question left open: how far can the gain be raised before the system goes unstable?
