---
title: Compensator Design by Root Locus
description: Design a lead compensator to move the dominant poles to a required location and a lag compensator to reduce steady-state error, using the angle and magnitude conditions, with the op-amp circuit that realises the compensator.
keywords: compensator design, lead compensator design root locus, lag compensator, angle deficiency, PD controller, PI controller, op-amp lead lag circuit, Type II Type III compensator
published: 2026-11-12
updated: 2026-11-12
time: 45
outcomes:
  - Convert performance specifications into a required dominant pole location
  - Design a lead compensator with the angle and magnitude conditions
  - Design a lag compensator that raises the error constant without moving the dominant poles
  - Choose R and C values for an op-amp circuit that realises the compensator
deeper:
  - Root locus design, in-depth version (Thai) | /learn/control-systems/root-locus-design/
  - Lead and lag compensators (Thai) | /learn/control-systems/compensators/
---

## The picture to keep in mind: if the road does not go there, build a new one {#idea}

Unit 9 ended with a problem: the root locus of the plant does not pass through the pole location we want. Changing the gain only slides the poles along the same path. It does not move the path.

A **compensator** is a transfer function added to the loop so that its own poles and zeros reshape the root locus. From Unit 9:

- **A zero pulls the locus to the left**: faster and better damped.
- **A pole pushes the locus to the right**, but a pole at the origin removes steady-state error.

| Compensator | $C(s)$ | Fixes | PID relative |
|---|---|---|---|
| Lead | $K_c\dfrac{s + z}{s + p}$, $z < p$ | Transient response: too slow, too oscillatory | PD with a filter |
| Lag | $K_c\dfrac{s + z}{s + p}$, $z > p$, both near the origin | Steady-state error too large | PI |
| Lead-lag | The product of the two | Both | PID |

## Steps for designing a lead compensator {#lead}

1. Convert the specifications (%OS, $t_s$) to $\zeta$ and $\omega_n$, and write the required dominant pole $s_d = -\zeta\omega_n + j\omega_d$.
2. Compute the angle of the plant at $s_d$. The shortfall from $-180°$ is the **angle the compensator must add**, $\phi$.
3. Choose the compensator zero, then find the pole location that gives $\angle(s_d + z) - \angle(s_d + p) = \phi$.
4. Find $K_c$ from the magnitude condition.
5. Check the remaining closed-loop poles and simulate the response.

:::example Example 10.1 A lead compensator for a servo
The plant is $G(s) = \dfrac{1}{s(s + 1)}$ with unity feedback. We want $\zeta = 0.5$ and a settling time of 2 s.

**Step 1.** From $t_s = 4/(\zeta\omega_n) = 2$: $\zeta\omega_n = 2$, so $\omega_n = 4$ rad/s and $\omega_d = 4\sqrt{0.75} = 3.464$.

$$s_d = -2 + j3.464$$

With gain alone the locus of the plant is the vertical line $s = -0.5$, which does not pass through $s_d$. A compensator is needed.

**Step 2.** The angle of the plant at $s_d$.

- From the pole at $0$: $\angle s_d = 180° - \tan^{-1}(3.464/2) = 120°$
- From the pole at $-1$: $\angle(s_d + 1) = 180° - \tan^{-1}(3.464/1) = 106.1°$

$\angle G(s_d) = -(120° + 106.1°) = -226.1°$. We need $-180°$, so the compensator must add $\phi = 46.1°$.

**Step 3.** Put the zero at $s = -2$, directly below the required pole. Its angle is $90°$, so the compensator pole must contribute $90° - 46.1° = 43.9°$.

$$p = 2 + \frac{3.464}{\tan 43.9°} = 2 + 3.60 = 5.60$$

**Step 4.** Magnitude condition.

$$K_c = \frac{\lvert s_d\rvert\,\lvert s_d + 1\rvert\,\lvert s_d + 5.6\rvert}{\lvert s_d + 2\rvert} = \frac{(4)(3.606)(4.996)}{3.464} = 20.8$$

$$C(s) = 20.8\,\frac{s + 2}{s + 5.6}$$

**Step 5.** The characteristic equation $s(s + 1)(s + 5.6) + 20.8(s + 2) = 0$ has roots at $-2 \pm j3.464$, as designed, and a third root at $s = -2.6$.

The third pole lies near the zero at $-2$, so they cancel only partly. Simulation gives 27 % overshoot, above the 16 % of a pure second-order system. The closed-loop zero is the cause. For less overshoot, redesign with a higher $\zeta$ or move the zero further left.
:::

:::warn Second-order formulas are a starting point, not the final answer
The %OS and $t_s$ formulas of Unit 6 are exact only for a second-order system with no zeros. A compensated system has extra poles and zeros, so always check by simulation and iterate. Real design is a loop, not a single calculation.
:::

## The lag compensator {#lag}

After the lead compensator, the error constant of Example 10.1 is

$$K_v = \lim_{s \to 0} s\,C(s)G(s) = \frac{20.8 \times 2}{5.6 \times 1} = 7.43\ \text{s}^{-1}$$

To raise $K_v$ ten times without disturbing the dominant poles, add a lag compensator

$$C_{lag}(s) = \frac{s + z_l}{s + p_l}, \qquad \frac{z_l}{p_l} = 10$$

with both close to the origin, for example $z_l = 0.1$ and $p_l = 0.01$.

- As $s \to 0$ the compensator has gain $z_l/p_l = 10$, so $K_v = 74.3$ s⁻¹ and the ramp error falls ten times.
- At $s = s_d$, far from the origin, the vectors from $z_l$ and $p_l$ almost coincide: $C_{lag}(s_d) \approx 1\angle{-1.2°}$. The locus near $s_d$ hardly changes.

The price is one more closed-loop pole near $s = -0.1$, which makes the last part of the error decay slowly (a long tail on the plot). Moving $p_l$ exactly to the origin turns the lag compensator into a PI controller.

## Building a compensator with an op-amp {#opamp}

From Unit 3, an inverting op-amp circuit has $G(s) = -Z_2/Z_1$. With $Z_1$ as $R_1$ in parallel with $C_1$ and $Z_2$ as $R_2$ in parallel with $C_2$,

$$\frac{V_o(s)}{V_i(s)} = -\frac{C_1}{C_2}\cdot\frac{s + \dfrac{1}{R_1C_1}}{s + \dfrac{1}{R_2C_2}}$$

The zero is at $1/(R_1C_1)$ and the pole at $1/(R_2C_2)$. The same circuit is a lead when $R_1C_1 > R_2C_2$ and a lag when the inequality is reversed. A second inverting stage removes the minus sign.

:::example Example 10.2 Component values for the lead compensator
Choose components for $C(s) = 20.8\,\dfrac{s + 2}{s + 5.6}$ with $C_1 = 10\ \mu\text{F}$.

- Gain: $C_1/C_2 = 20.8$, so $C_2 = 0.48\ \mu\text{F}$ (use 0.47 µF)
- Zero: $R_1 = \dfrac{1}{2 \times 10 \times 10^{-6}} = 50\ \text{k}\Omega$
- Pole: $R_2 = \dfrac{1}{5.6 \times 0.48 \times 10^{-6}} = 372\ \text{k}\Omega$

Check the DC gain: $R_2/R_1 = 7.43$, equal to $20.8 \times 2/5.6$. Real capacitors have 5–10 % tolerance, so the pole and zero shift with them, one reason why modern designs move the compensator into a microcontroller (Unit 15).
:::

:::note Compensators in switching power supplies
The Type II and Type III networks around the error amplifier of a buck converter are lead-lag compensators with an integrator. A Type III network has two zeros to restore the phase lost in the LC filter, which has a low $\zeta$ (Example 6.2). The design principle is the same as in this unit, although in that field it is usually done on the Bode plot, the subject of Units 11 and 12.
:::

## Exercises {#exercises}

:::exercise Exercise 10.1
The overshoot must not exceed 4.3 % and the settling time is to be 1 s. Find the required dominant poles.

:::answer Show answer
%OS = 4.3 % corresponds to $\zeta = 0.707$, and $\zeta\omega_n = 4/t_s = 4$, so $\omega_n = 5.66$ rad/s and $\omega_d = \omega_n\sqrt{1 - 0.5} = 4$.

$$s_d = -4 \pm j4$$
:::
:::

:::exercise Exercise 10.2
The plant is $G(s) = \dfrac{1}{s^2}$ (a pure mass, such as a frictionless linear axis). The dominant poles are to be at $s_d = -1 + j1$, with the lead compensator zero at $s = -1$. Find the pole and gain of the compensator.

:::answer Show answer
Angle of the plant: $-2 \times 135° = -270°$, so $\phi = 90°$ must be added.

The zero at $-1$ gives $90°$, so the compensator pole must give $0°$, which is possible only with the pole at $-\infty$. The compensator needed is a pure PD, $C(s) = K_c(s + 1)$.

Magnitude condition: $K_c = \dfrac{\lvert s_d\rvert^2}{\lvert s_d + 1\rvert} = \dfrac{2}{1} = 2$. Check: $s^2 + 2s + 2 = 0$ has roots $-1 \pm j1$.

In practice a pure PD amplifies high-frequency noise, so the zero is chosen closer to the origin (say $-0.5$) to bring the compensator pole to a finite position.
:::
:::

:::exercise Exercise 10.3
A system has $K_v = 5$ s⁻¹. The error for a unit ramp must not exceed 0.02. Design a lag compensator.

:::answer Show answer
We need $K_v \ge 1/0.02 = 50$ s⁻¹, a tenfold increase. Choose $z_l/p_l = 10$, placed close to the origin compared with the dominant poles, for example

$$C_{lag}(s) = \frac{s + 0.1}{s + 0.01}$$
:::
:::

## Summary of Unit 10 {#summary}

- A compensator reshapes the root locus by adding poles and zeros.
- A lead adds positive angle at $s_d$ to pull the locus to the left; design it with the angle condition, then the magnitude condition.
- A lag raises the low-frequency gain by $z_l/p_l$ while hardly moving the dominant poles.
- Always check by simulation, because the added poles and zeros make the second-order formulas inexact.
- One op-amp stage can realise either a lead or a lag.
