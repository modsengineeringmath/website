---
title: "Block Diagrams and Signal-Flow Graphs"
url: https://modsengineeringmath.com/en/courses/control-engineering/block-diagrams/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The rules for reducing series, parallel and feedback blocks, the transfer function from a disturbance, and Mason's gain formula, with worked examples of a motor speed loop with a tachometer and a system with nested loops.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/block-diagrams/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Block Diagrams and Signal-Flow Graphs

// Unit 4 · Control Engineering


The rules for reducing series, parallel and feedback blocks, the transfer function from a disturbance, and Mason's gain formula, with worked examples of a motor speed loop with a tachometer and a system with nested loops.

## What you can do after this unit

- Reduce series, parallel and feedback blocks to a single transfer function
- Find the transfer function from a disturbance to the output
- Apply Mason's gain formula to a system with several loops
- Explain how feedback changes the gain and time constant of a first-order system

## The picture to keep in mind: a block diagram is a wiring diagram for signals

An electrician reads a motor control circuit from the single-line and control drawings. A control engineer reads a system from its block diagram. The difference is that the lines are not wires but signals flowing one way, along the arrow. Each block multiplies its incoming signal by its transfer function.

There are only three symbols.

|
Symbol |
Function |

|
Block |
Output = transfer function × input |

|
Summing point |
Adds or subtracts signals according to the signs marked |

|
Pickoff point |
Sends the same signal several ways; its value is not reduced |

## Three basic rules

|
Connection |
Overall transfer function |
Circuit analogy |

|
Series (cascade) |
$G_1G_2$ |
Gain of two amplifier stages that do not load each other |

|
Parallel |
$G_1 + G_2$ |
Summing amplifier |

|
Negative feedback |
$\dfrac{G}{1 + GH}$ |
Feedback amplifier |

Series blocks multiply only when they do not load each other

Two RC sections connected directly do not have a transfer function equal to the product of the two, because the second draws current from the first. A buffer (voltage follower) must separate them before they multiply. In real control systems power amplifiers and op-amps already provide this isolation.

For more complicated structures, move a summing or pickoff point to reach a basic form, keeping to the principle that every signal must keep its original value.

|
Move |
What must be added |

|
Pickoff point from after block $G$ to before it |
A block $G$ in the branch |

|
Pickoff point from before block $G$ to after it |
A block $1/G$ in the branch |

|
Summing point from after block $G$ to before it |
A block $1/G$ in the incoming line |

|
Summing point from before block $G$ to after it |
A block $G$ in the incoming line |

## How feedback changes a first-order system

Example 4.1 Motor speed loop with a tachometer

A motor with its load has $G(s) = \dfrac{20}{0.1s + 1}$ (rad/s per V). It is driven by an amplifier of gain $K = 5$, and the speed is fed back by a tachometer with $H = 0.05$ V per rad/s. Find the closed-loop transfer function.

Step 1. The forward path is $KG = \dfrac{100}{0.1s + 1}$ and the loop product is $KGH = \dfrac{5}{0.1s + 1}$.

Step 2. Feedback formula.

$$T(s) = \frac{KG}{1 + KGH} = \frac{100}{0.1s + 1 + 5} = \frac{100}{0.1s + 6}$$

Step 3. Divide by 6 to reach standard form.

$$T(s) = \frac{16.67}{0.0167s + 1}$$

The time constant falls from 100 ms to 16.7 ms, 6 times faster, which is exactly $1 + KGH(0) = 6$.

Effect of feedback on a first-order system

Closing a loop of DC loop gain $L_0$ around $\dfrac{K_0}{\tau s + 1}$ divides both the gain and the time constant by $1 + L_0$. The system responds faster in exchange for less gain, just as an op-amp circuit gives up gain to gain bandwidth.

## The transfer function from a disturbance

A real motor is disturbed by load torque. In the block diagram the disturbance $D(s)$ enters at a summing point between the controller $C(s)$ and the plant $G(s)$. Because the system is linear, superposition applies: find the effect of $R$ and of $D$ separately and add them.

$$Y(s) = \underbrace{\frac{CG}{1 + CGH}}_{\text{reference tracking}} R(s) + \underbrace{\frac{G}{1 + CGH}}_{\text{from the disturbance}} D(s)$$

Both terms have the same denominator, $1 + L(s)$. They differ in the numerator, which is the product of the blocks on the forward path from where the signal enters to the output. When the controller gain $C$ is high, the first term approaches $1/H$ and the second approaches zero, so the system tracks the reference and rejects the disturbance at the same time.

## Mason's gain formula

With several nested loops, moving blocks one step at a time is slow. Mason's gain formula gives the answer in one step.

$$T = \frac{1}{\Delta}\sum_k P_k\,\Delta_k$$

- $P_k$ is the gain of the $k$-th forward path

- $\Delta = 1 - \sum(\text{individual loop gains}) + \sum(\text{products of gains of two non-touching loops}) - \cdots$

- $\Delta_k$ is $\Delta$ evaluated with only the loops that do not touch the $k$-th forward path

Loops are "non-touching" when they share no signal or block at all.

Example 4.2 A three-loop system

A system has the forward path $G_1G_2G_3$ with $G_1 = 2$, $G_2 = \dfrac{1}{s + 1}$, $G_3 = \dfrac{1}{s}$, and three negative feedback loops: around $G_2$ with gain 1, around $G_2G_3$ with gain $H_2 = 0.5$, and an outer loop around $G_1G_2G_3$ with gain 1. Find $T(s)$.

Step 1. There is one forward path: $P_1 = G_1G_2G_3 = \dfrac{2}{s(s + 1)}$

Step 2. Loop gains (negative, since the feedback is negative).

$$L_1 = -G_2 = -\frac{1}{s + 1}, \qquad L_2 = -G_2G_3H_2 = -\frac{0.5}{s(s + 1)}, \qquad L_3 = -G_1G_2G_3 = -\frac{2}{s(s + 1)}$$

Step 3. Every loop passes through $G_2$, so all loops touch each other and the forward path. Hence $\Delta = 1 - (L_1 + L_2 + L_3)$ and $\Delta_1 = 1$.

$$T(s) = \frac{\dfrac{2}{s(s + 1)}}{1 + \dfrac{1}{s + 1} + \dfrac{0.5}{s(s + 1)} + \dfrac{2}{s(s + 1)}}$$

Step 4. Multiply top and bottom by $s(s + 1)$.

$$T(s) = \frac{2}{s(s + 1) + s + 0.5 + 2} = \frac{2}{s^2 + 2s + 2.5}$$

Check: the DC gain is $2/2.5 = 0.8$.

Nested loops in motor drives

Industrial drives use a cascade structure: the current (torque) loop is innermost and fastest, the speed loop is in the middle and the position loop is outermost. When each inner loop is about 5–10 times faster than the loop outside it, the outer loop can treat the inner one as a constant gain, so the loops are designed one layer at a time without applying Mason's formula to the whole system.

## Exercises

Exercise 4.1

A plant $G(s) = \dfrac{4}{2s + 1}$ has a controller of gain $K = 6$ and unity feedback ($H = 1$). Find the closed-loop transfer function in standard form, with its DC gain and time constant.

Show answer

$$T(s) = \frac{24}{2s + 1 + 24} = \frac{24}{2s + 25} = \frac{0.96}{0.08s + 1}$$

The DC gain is 0.96 and the time constant is 0.08 s, which is $2/25$: reduced by the factor $1 + KG(0) = 25$.

Exercise 4.2

In Example 4.1 suppose a disturbance $D$ (in equivalent volts) enters at the motor input. Find $Y/D$ and the steady-state change in speed for $D = -1$ V.

Show answer

$$\frac{Y(s)}{D(s)} = \frac{G}{1 + KGH} = \frac{20}{0.1s + 6}$$

The DC gain is $20/6 = 3.33$ rad/s per V, so the speed falls by 3.33 rad/s. In open loop it would fall by 20 rad/s. Feedback reduces the effect of the disturbance 6 times.

Exercise 4.3

A unity-feedback system has an inner loop: $G_2 = \dfrac{10}{s}$ with negative feedback of gain 1, and $G_1 = 5$ ahead of the inner loop. Find $T(s)$.

Show answer

Reduce the inner loop first: $\dfrac{10/s}{1 + 10/s} = \dfrac{10}{s + 10}$. The forward path of the outer loop is $\dfrac{50}{s + 10}$.

$$T(s) = \frac{50}{s + 10 + 50} = \frac{50}{s + 60}$$

## Summary of Unit 4

- Series blocks multiply, parallel blocks add, negative feedback gives $\dfrac{G}{1 + GH}$.

- Every input-output pair of one loop shares the denominator $1 + L(s)$.

- Feedback around a first-order system divides both gain and time constant by $1 + L_0$.

- Mason's formula $T = \dfrac{1}{\Delta}\sum P_k\Delta_k$ handles multi-loop systems in one step.

The next unit opens Part 2 with a detailed study of the time response of first-order systems.
