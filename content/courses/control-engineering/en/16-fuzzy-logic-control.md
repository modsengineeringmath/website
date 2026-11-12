---
title: Fuzzy Logic Control
description: The principles of fuzzy logic for beginners: fuzzy sets and membership functions, fuzzification, the rule base, inference and defuzzification, examples worked by hand step by step, a fuzzy PD controller and a comparison with PID.
keywords: fuzzy logic control, fuzzy logic for beginners, membership function, fuzzification, defuzzification, fuzzy rule base, Mamdani, Sugeno, fuzzy PD controller, fuzzy vs PID, fuzzy controller worked example
published: 2026-11-12
updated: 2026-11-12
time: 45
outcomes:
  - Explain the difference between a classical set and a fuzzy set, and calculate a degree of membership from a triangular function
  - Describe the four steps of a fuzzy controller: fuzzification, rule base, inference and defuzzification
  - Calculate by hand the output of a fuzzy controller with one and with two inputs
  - Say which jobs suit fuzzy control and which are better done with PID
deeper:
  - Nonlinear systems and robust control (Thai) | /learn/control-systems/nonlinear-robust/
  - PID controllers, in-depth version (Thai) | /learn/control-systems/pid/
  - PLC (Thai) | /learn/plc/
---

## The picture to keep in mind: a skilled operator does not solve equations {#idea}

An experienced furnace operator holds the temperature well without ever writing a transfer function. He uses rules in his head: "if the temperature is **far** below the target, fire **hard**"; "if it is **close** and **rising fast**, **ease off**". Far, close, fast, hard have no sharp boundaries, yet they work.

**Fuzzy logic**, proposed by Lotfi Zadeh in 1965, is the mathematics that makes such vague words computable. A **fuzzy controller** is therefore a way of putting an expert's knowledge straight into a controller. It suits plants that are nonlinear or hard to model.

Compare with what electrical students know: contactor control circuits and ladder programs use Boolean logic, where a contact has two states, open or closed. Fuzzy logic extends the same idea so that "true" can have a degree anywhere from 0 to 1.

## Fuzzy sets and membership functions {#membership}

In a classical set with the boundary at 60, 59.9 °C is "not hot" and 60.0 °C is "hot". In a fuzzy set each element has a **degree of membership** $\mu$ between 0 and 1. A temperature of 55 °C may be "hot" to degree 0.5 and "warm" to degree 0.5 at the same time.

A **membership function** assigns that degree. The most common shape is a triangle with base from $a$ to $c$ and peak at $b$.

$$\mu(x) = \begin{cases} \dfrac{x - a}{b - a} & a \le x \le b \\[2mm] \dfrac{c - x}{c - b} & b < x \le c \\[2mm] 0 & \text{otherwise} \end{cases}$$

A variable whose values are words, such as "error" taking the values negative, zero, positive, is a **linguistic variable**.

![Three membership functions for temperature error: N (negative) falls from 1 at −10 degrees to 0 at 0 degrees, Z (zero) is a triangle peaking at 0, P (positive) rises from 0 at 0 degrees to 1 at 10 degrees; the dashed line at e = 4 cuts Z at 0.6 and P at 0.4](/images/courses/control-engineering/fuzzy-mf.svg)

The logical operations on fuzzy sets used in controllers:

| Logic | Usual calculation |
|---|---|
| A **and** B (AND) | $\min(\mu_A, \mu_B)$ |
| A **or** B (OR) | $\max(\mu_A, \mu_B)$ |
| **not** A (NOT) | $1 - \mu_A$ |

When $\mu$ takes only the values 0 and 1, this table gives exactly Boolean logic.

## The four steps of a fuzzy controller {#steps}

| Step | Name | What it does |
|---|---|---|
| 1 | Fuzzification | Converts measured values to degrees of membership in each set |
| 2 | Rule base | "If … then …" rules obtained from an expert |
| 3 | Inference | Finds the weight with which each rule fires |
| 4 | Defuzzification | Combines the results of all rules into one number for the actuator |

There are two main kinds of controller. In the **Mamdani** type each rule's output is a fuzzy set and the centroid of the combined area is taken. In the **Sugeno** type each rule's output is a constant or a linear function and a weighted average is taken.

$$u = \frac{\sum_i w_i\,u_i}{\sum_i w_i}$$

Here $w_i$ is the weight of rule $i$ and $u_i$ its output. The Sugeno type is quick to compute, so it is popular in microcontrollers and PLCs. The examples in this unit use the zero-order Sugeno type.

:::example Example 16.1 A single-input heater controller
A temperature controller uses the error $e$ = setpoint − measurement (°C), with the membership functions N, Z, P of the figure and three rules.

- If $e$ is N (above target) then heater power = 0 %
- If $e$ is Z (on target) then heater power = 50 %
- If $e$ is P (below target) then heater power = 100 %

Find the heater power when $e = 4$ °C.

**Step 1, fuzzification.** From the equation of each straight side:

$$\mu_N(4) = 0, \qquad \mu_Z(4) = 1 - \frac{4}{10} = 0.6, \qquad \mu_P(4) = \frac{4}{10} = 0.4$$

**Steps 2–3, inference.** Each rule has one condition, so its weight equals the degree of membership: $w_N = 0$, $w_Z = 0.6$, $w_P = 0.4$

**Step 4, defuzzification.**

$$u = \frac{(0)(0) + (0.6)(50) + (0.4)(100)}{0 + 0.6 + 0.4} = 70\ \%$$

Repeating the calculation at other values of $e$ shows that $u = 50 + 5e$ for $-10 \le e \le 10$, saturating at 0 % and 100 % outside. This simplest fuzzy controller is therefore a **P controller with saturation**. Abilities beyond PID appear when the shapes of the membership functions or the rules are made asymmetric, for instance a high gain far from the target and a low gain near it.
:::

## A fuzzy PD controller {#fuzzy-pd}

Practical fuzzy controllers usually have two inputs: the error $e$ and the rate of change of error $\Delta e$, the same information a PD controller uses. The rule base can be written as a table, with outputs N, Z, P standing for $-1$, $0$, $+1$.

| $e$ \ $\Delta e$ | N | Z | P |
|---|---|---|---|
| **N** | N | N | Z |
| **Z** | N | Z | P |
| **P** | Z | P | P |

Read the table with common sense. Top left: the error is negative and still falling, so command fully negative. Top right: the error is negative but already coming back by itself, so no extra command is needed. Rules of this kind do what the D term of a PID does, but in language an operator understands and can change one cell at a time.

:::example Example 16.2 A two-input fuzzy controller by hand
Use the rule table above. The error $e$ keeps the ±10 membership functions, and $\Delta e$ uses the same shapes over ±5. Find the output for $e = 4$ and $\Delta e = -1$.

**Step 1, fuzzification.**

- $e = 4$: $\mu_Z = 0.6$, $\mu_P = 0.4$
- $\Delta e = -1$: $\mu_N = \dfrac{1}{5} = 0.2$, $\mu_Z = 1 - \dfrac{1}{5} = 0.8$

**Steps 2–3, inference.** Four rules fire. Use $\min$ for "and".

| Rule | Weight $w = \min$ | Output $u_i$ |
|---|---|---|
| $e$ is Z and $\Delta e$ is N | $\min(0.6, 0.2) = 0.2$ | N = $-1$ |
| $e$ is Z and $\Delta e$ is Z | $\min(0.6, 0.8) = 0.6$ | Z = $0$ |
| $e$ is P and $\Delta e$ is N | $\min(0.4, 0.2) = 0.2$ | Z = $0$ |
| $e$ is P and $\Delta e$ is Z | $\min(0.4, 0.8) = 0.4$ | P = $+1$ |

**Step 4, defuzzification.**

$$u = \frac{(0.2)(-1) + (0.6)(0) + (0.2)(0) + (0.4)(1)}{0.2 + 0.6 + 0.2 + 0.4} = \frac{0.2}{1.4} = 0.143$$

The output is slightly positive: still below target, so command more, but because the error is already shrinking ($\Delta e < 0$) the command is smaller than with $\Delta e = 0$, which would give $u = 0.4$.
:::

## Fuzzy versus PID {#vs-pid}

| Aspect | PID | Fuzzy |
|---|---|---|
| What must be known about the plant | A model or test results for tuning | Qualitative expert knowledge |
| Nonlinear plant | Several tunings by operating point (gain scheduling) | Handled within one rule base |
| Number of values to adjust | 3 | Many: the shape and position of every membership function and every rule |
| Proof of stability | A full set of tools (Units 8–12) | Much harder; usually relies on simulation and testing |
| Understanding by operators | Must understand P, I, D | Rules read as language |

Uses met in practice: washing machines and inverter air conditioners; maximum power point tracking (MPPT) for solar cells, whose characteristic is nonlinear; cement kiln control, one of the first industrial uses of fuzzy logic; and fuzzy logic as an upper layer adjusting the $K_p$, $K_i$, $K_d$ of a PID according to operating conditions (fuzzy gain scheduling). Several PLC brands offer fuzzy function blocks following IEC 61131-7.

:::warn Fuzzy logic does not replace understanding the system
Fuzzy logic does not make a hard plant easy. Good rules come from someone who understands the plant, and a badly designed fuzzy controller can destabilise a loop like any other controller. If the plant is close to linear and a PID meets the specification, PID is the simpler answer, easier to verify and easier to maintain.
:::

## Exercises {#exercises}

:::exercise Exercise 16.1
A triangular membership function "warm" has $a = 30$, $b = 50$, $c = 70$ °C. Find $\mu$ at 35, 50 and 62 °C.

:::answer Show answer
$\mu(35) = \dfrac{35 - 30}{50 - 30} = 0.25$, $\mu(50) = 1$, $\mu(62) = \dfrac{70 - 62}{70 - 50} = 0.4$
:::
:::

:::exercise Exercise 16.2
With the controller of Example 16.1, find the heater power for $e = -3$ °C.

:::answer Show answer
$\mu_N = 0.3$, $\mu_Z = 0.7$, $\mu_P = 0$

$u = \dfrac{(0.3)(0) + (0.7)(50)}{1.0} = 35\ \%$, in agreement with $50 + 5(-3)$.
:::
:::

:::exercise Exercise 16.3
With the controller of Example 16.2, find the output for $e = -2$ and $\Delta e = 3$.

:::answer Show answer
$e = -2$: $\mu_N = 0.2$, $\mu_Z = 0.8$; and $\Delta e = 3$: $\mu_Z = 0.4$, $\mu_P = 0.6$

Rule (N, Z) → N: $w = \min(0.2, 0.4) = 0.2$; rule (N, P) → Z: $w = 0.2$; rule (Z, Z) → Z: $w = 0.4$; rule (Z, P) → P: $w = 0.6$

$u = \dfrac{(0.2)(-1) + 0 + 0 + (0.6)(1)}{0.2 + 0.2 + 0.4 + 0.6} = \dfrac{0.4}{1.4} = 0.286$
:::
:::

## Summary of Unit 16 {#summary}

- A fuzzy set gives its elements a degree of membership between 0 and 1, so that words like "far" or "close" can be computed.
- A fuzzy controller works in four steps: fuzzification, rule base, inference, defuzzification.
- The zero-order Sugeno type gives the output as a weighted average, $u = \sum w_iu_i / \sum w_i$.
- A fuzzy controller using $e$ and $\Delta e$ acts like a nonlinear PD.
- Fuzzy control suits nonlinear plants with expert knowledge available; plants close to linear are better served by PID.
