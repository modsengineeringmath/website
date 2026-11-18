---
title: "Feedback Control in Depth"
url: https://modsengineeringmath.com/en/courses/control-engineering/feedback-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-18
---

> The first unit of the control course goes deep on open and closed loops, the closed-loop transfer function, sensitivity, disturbance rejection and the gain-bandwidth trade-off, with an interactive block-diagram lab and exercises.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/feedback-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Feedback Control in Depth

// Unit 1 · Control Engineering · Feedback Control in Depth


The first unit of the control course goes deep on open and closed loops, the closed-loop transfer function, sensitivity, disturbance rejection and the gain-bandwidth trade-off, with an interactive block-diagram lab and exercises.

## What you can do after this unit

- Tell open loop from closed loop and explain what feedback gives and what it costs
- Find the closed-loop transfer function and the sensitivity function from a block diagram
- Calculate how much feedback reduces the effect of plant changes and disturbances
- Reduce a block diagram with nested loops
- Explain why high loop gain raises bandwidth, lowers DC gain and can destabilize the loop
- Classify a system as linear, time-invariant, SISO, continuous and so on

## A control system makes one quantity follow a command

A refrigerator holds a temperature. An inverter holds a motor speed. An aircraft holds an altitude. All of them do the same thing.

They make a quantity take the value we want, even with disturbances, and even when the system is not exactly what we calculated.

This course answers three questions, in order.

- How does the system work? Answer: a mathematical model.

- How does it respond in time? Answer: response analysis.

- How do we design a controller that meets the specification? Answer: design.

This unit lays the ground for all three with a single idea: feedback.

## Basic terms

|
Term |
Symbol |
Meaning |

|
Plant |
$G(s)$ |
The thing being controlled |

|
Controller |
$C(s)$ |
Decides how much to command |

|
Sensor |
$H(s)$ |
Measures the output and sends it back |

|
Reference |
$R(s)$ |
The value we want |

|
Output |
$Y(s)$ |
The controlled quantity |

|
Error |
$E(s)$ |
Reference minus the measured value |

|
Disturbance |
$D(s)$ |
Something that moves the output without our command |

A system is broader than a plant: a set of parts working together for one purpose.

A process is a continuing operation that produces a result, such as a heating process. In control work it often means the plant.

## Open loop and closed loop

An open-loop system computes the command in advance and sends it. It never checks the result.

A closed-loop system measures the actual output, compares it with the reference and uses the error to adjust the command all the time.

Two parts of this diagram are worth remembering.

- The forward path is $C(s)G(s)$

- The feedback path is $H(s)$

The product around the whole loop, $L(s) = C(s)G(s)H(s)$, is the open-loop transfer function, or loop gain. It appears throughout the course.

Why not use open loop everywhere

Open loop works. It is simple and always stable, provided the model is accurate and nothing disturbs the system. A timed toaster is an example.

Closed loop pays off when the plant drifts with age or temperature, or when unpredictable disturbances arrive, such as a motor load.

## The closed-loop transfer function

Write the equation at each point of the diagram, with a disturbance $D$ added at the plant output.

$$E = R - HY$$

$$Y = CG\,E + D$$

Substitute $E$ and solve for $Y$.

$$Y = CG\,(R - HY) + D$$

$$(1 + CGH)\,Y = CG\,R + D$$

$$Y(s) = \underbrace{\frac{CG}{1 + CGH}}_{T_r(s)}\,R(s) + \underbrace{\frac{1}{1 + CGH}}_{S(s)}\,D(s)$$

Because the system is linear, superposition lets us add the effect of the two inputs directly.

The denominator $1 + L(s)$ is the same in both terms. If it is zero at some $s$, the system has a mode that is not held down. Part 3 of the course is entirely about this.

The equation to remember

$$1 + L(s) = 0 \quad\text{is the characteristic equation}$$

Its roots are the closed-loop poles, which set both the shape of the response and the stability.

The function $S(s) = \dfrac{1}{1 + L(s)}$ is the sensitivity function.

The function $T(s) = \dfrac{L(s)}{1 + L(s)}$ is the complementary sensitivity. With $H = 1$ it equals $T_r$.

They are tied by a simple and important relation.

$$S(s) + T(s) = 1$$

This shows up in every design unit, because we cannot make $S$ small (to reject disturbances) and $T$ small (to reject sensor noise) at the same frequency.

## Feedback reduces sensitivity to plant changes

A real plant never matches the model. Resistance drifts with temperature, motors wear, fluids thicken.

We measure the sensitivity of the closed-loop transfer function $T_r$ to $G$ by the ratio of relative changes.

$$S_G^{T_r} = \frac{\partial T_r / T_r}{\partial G / G} = \frac{G}{T_r}\frac{\partial T_r}{\partial G}$$

For $T_r = \dfrac{CG}{1 + CGH}$ we get

$$\frac{\partial T_r}{\partial G} = \frac{C(1 + CGH) - CG\cdot CH}{(1 + CGH)^2} = \frac{C}{(1 + CGH)^2}$$

$$S_G^{T_r} = \frac{G}{T_r}\cdot\frac{C}{(1+CGH)^2} = \frac{1}{1 + CGH} = S(s)$$

So if $\lvert 1 + L \rvert$ is 10, a 10% plant change moves the closed-loop response by only about 1%.

An open loop $T_{ol} = CG$ has a sensitivity of exactly 1. A 10% plant change moves the output by 10%.

## Example 1: a motor speed loop

Example 1.1

A motor speed responds to the command voltage as $G(s) = \dfrac{2}{s + 1}$ (gain 2, time constant 1 s). The controller is proportional, $C = 4$, and the sensor is $H = 1$. Find (a) the closed-loop transfer function, (b) the effect of a 10% rise in plant gain, (c) the effect of a disturbance of size 0.3 at the output.

(a) The loop gain is $L = \dfrac{8}{s+1}$, so

$$T_r = \frac{8/(s+1)}{1 + 8/(s+1)} = \frac{8}{s + 9}$$

The DC gain is $8/9 = 0.889$ and the closed-loop time constant is $1/9 = 0.111$ s, nine times faster than the plant.

(b) Plant gain 2 becomes 2.2, so $K = 4 \times 2.2 = 8.8$.

$$T_r(0) = \frac{8.8}{9.8} = 0.898$$

It moves from 0.889 to 0.898, a rise of 1.02%. This is close to the estimate from sensitivity, $10\% \times S(0) = 10\% \times 1/9 = 1.11\%$.

An open loop tuned to give exactly 1 would move by the full 10%.

(c) A disturbance of size $d$ at the output has a steady-state effect of $S(0)\,d = d/9$.

$$y_{ss} = \frac{0.3}{9} = 0.033$$

The open loop takes the whole 0.3. The closed loop cuts it by a factor of nine.

One thing to note. In this closed loop the final output is 0.889, not 1. A proportional-only controller leaves a constant error. This is the reason for the integral term in PID, which arrives in Part 6.

## Lab: play with feedback

The lab uses the plant of Example 1.1. The open loop has a feed-forward gain set so that the nominal output is exactly 1.

Try these in order.

- Set δ = 0. The open loop gives exactly 1 and the closed loop gives less than 1.

- Move δ to +30%. See which loop changes more.

- Raise the disturbance d to 0.5 and compare the step in the output after t = 4 s.

- Raise Kc to 30 and watch the closed-loop column of the table.

Class activity

Predict before moving the sliders. If Kc = 20 and δ = +30%, what is the closed-loop final value before the disturbance?

Answer: $K = 20 \times 2 \times 1.3 = 52$, so $52/53 = 0.981$. Check it in the lab.

## Reducing block diagrams

Real systems have several loops, sometimes nested. We reduce them one loop at a time, from the inside out.

There are three basic rules.

|
Form |
Result |

|
Series, $G_1$ then $G_2$ |
$G_1 G_2$ |

|
Parallel, $G_1$ and $G_2$ at a summing point |
$G_1 \pm G_2$ |

|
Negative feedback, $G$ with $H$ |
$\dfrac{G}{1 + GH}$ |

For positive feedback use $\dfrac{G}{1 - GH}$ instead.

Example 1.2: nested loops

A system has $G_1 = \dfrac{5}{s+1}$ followed by $G_2 = \dfrac{2}{s+3}$. There is feedback $H_1 = 0.5$ around $G_2$ only (the inner loop) and feedback $H_2 = 1$ around both blocks (the outer loop). Find $Y/R$.

Inner loop

$$G_{in} = \frac{G_2}{1 + G_2 H_1} = \frac{2/(s+3)}{1 + 1/(s+3)} = \frac{2}{s + 4}$$

Outer loop, using $G_1 G_{in}$ as the forward path

$$G_1 G_{in} = \frac{10}{(s+1)(s+4)}$$

$$\frac{Y}{R} = \frac{G_1 G_{in}}{1 + G_1 G_{in}} = \frac{10}{(s+1)(s+4) + 10} = \frac{10}{s^2 + 5s + 14}$$

The closed-loop poles are at $s = -2.5 \pm j\,2.78$. They are in the left half-plane, so the system is stable, and the DC gain is $10/14 = 0.714$.

## The trade-off: high loop gain raises bandwidth and lowers DC gain

Take a first-order loop $L(s) = \dfrac{K}{\tau s + 1}$ with $H = 1$.

$$T(s) = \frac{L}{1 + L} = \frac{K}{\tau s + 1 + K} = \frac{K}{1+K}\cdot\frac{1}{\dfrac{\tau}{1+K}\,s + 1}$$

Three things can be read from this.

- The DC gain drops to $\dfrac{K}{1+K}$, which is still below 1

- The time constant falls to $\dfrac{\tau}{1+K}$, so the system is $(1+K)$ times faster

- The bandwidth (the −3 dB frequency) rises from $1/\tau$ to $(1+K)/\tau$

The product of DC gain and bandwidth is exactly $\dfrac{K}{\tau}$ for any $K$. We can trade gain for speed, but we cannot manufacture more.

No free lunch

Feedback buys speed and low sensitivity, and it pays with stability.

Real plants have higher order, delay and neglected poles. If $K$ is raised too far, the closed-loop poles move right until the system rings or becomes unstable.

Parts 3 to 5 spend their whole length on one question: how much gain can we add before stability is lost?

## Positive feedback and a hidden risk

If a sensor is wired backwards, or a sign is wrong, negative feedback becomes positive feedback.

Example 1.3

A plant $G = \dfrac{2}{s+1}$ is connected with unity positive feedback.

$$\frac{Y}{R} = \frac{G}{1 - G} = \frac{2/(s+1)}{1 - 2/(s+1)} = \frac{2}{s - 1}$$

The pole is at $s = +1$. The response contains a growing $e^{t}$ and the system is unstable, although the plant itself is stable (its pole is at $s = -1$).

Feedback can turn a stable system unstable. It can also turn an unstable one stable, as in a two-wheeled balancing robot. That is why we need a systematic way to test stability.

## Classifying systems

|
Type |
Example that fits |
Example that does not |

|
Linear |
$\dot y + 3y = u$ |
$\dot y + y^2 = u$ |

|
Time-invariant (LTI) |
$\dot y + 3y = u$ |
$\dot y + t\,y = u$ |

|
Continuous |
An RC circuit |
A controller on a microcontroller |

|
SISO |
One motor |
A multi-joint arm (MIMO) |

This course starts with linear time-invariant (LTI) SISO systems, because the theory is complete and transfer functions apply. Nonlinear systems are linearized about an operating point in Unit 10.

By purpose, control systems fall into two groups.

- A regulator holds the output constant against disturbances, such as holding a supply's output voltage

- A servo (tracking system) makes the output follow a changing reference, such as the position of a robot arm

## Specifications that decide whether a system is good

Throughout the course we judge a closed loop in four areas.

- Stability. It must be stable first.

- Transient response. How fast, and how much overshoot (Part 3)

- Steady-state accuracy. How far the final value is from the target (Part 3)

- Robustness. How well it tolerates plant errors and noise

This unit has touched the last one through the sensitivity function. The next unit starts building the mathematical tools we need.

## Exercises

Exercise 1.1 Accuracy and time constant

An oven plant $G(s) = \dfrac{3}{10s + 1}$ is connected to a proportional controller $K$ with unity feedback. The steady-state error to a unit step must be at most 5%. Find the smallest $K$ and the resulting closed-loop time constant.

Show answer

The steady-state error is $e_{ss} = \dfrac{1}{1 + 3K} \le 0.05$, so $3K \ge 19$ and $K \ge 6.33$.

At $K = 19/3$ the closed loop is $\dfrac{3K}{10s + 1 + 3K} = \dfrac{19}{10s + 20}$. The closed-loop time constant is $10/20 = 0.5$ s, twenty times faster than 10 s.

Exercise 1.2 Sensitivity

A unity-feedback loop has DC loop gain $K = 9$, so $T = K/(1+K) = 0.9$. If the plant gain falls by 20%, compute the new $T$ and compare it with the sensitivity estimate using $S = 1/(1+K)$.

Show answer

The new loop gain is $K' = 0.8 \times 9 = 7.2$, so $T' = 7.2/8.2 = 0.878$, a fall of 2.44% from 0.9.

The estimate is $S \times (-20\%) = 0.1 \times (-20\%) = -2\%$, which is close. The difference comes from the derivative approximation, which is good for small changes.

An open loop tuned to give exactly 0.9 would change by the full −20%.

Exercise 1.3 Block diagram reduction

$G_1 = \dfrac{4}{s+2}$ is in series with $G_2 = \dfrac{1}{s+1}$, with feedback $H = 2$ around both blocks. Find $Y/R$ and the pole locations.

Show answer

The forward path is $G_1 G_2 = \dfrac{4}{(s+2)(s+1)}$.

$$\frac{Y}{R} = \frac{4}{(s+2)(s+1) + 8} = \frac{4}{s^2 + 3s + 10}$$

The poles are at $s = -1.5 \pm j\,2.78$, both in the left half-plane, so the system is stable.

Exercise 1.4 Disturbance at the plant input

$C = 10$ and $G = \dfrac{1}{s+1}$ with unity feedback. A disturbance $D$ is added at the input of the plant. Find $Y/D$ and the steady-state output when $D$ is a step of size 1.

Show answer

With $R = 0$ the output comes from the disturbance through the plant and is then fed back.

$$\frac{Y}{D} = \frac{G}{1 + CG} = \frac{1/(s+1)}{1 + 10/(s+1)} = \frac{1}{s + 11}$$

For a unit step the steady state is $1/11 = 0.091$. Without feedback the output would be $G(0) = 1$.

Exercise 1.5 Classification

Are these systems linear, and are they time-invariant? (a) $\dot y = -2y + u$ (b) $\dot y = -t\,y + u$ (c) $\dot y = -y^3 + u$ (d) $y(t) = u(t - 2)$

Show answer

(a) Linear and time-invariant.

(b) Linear but time-varying, because a coefficient depends on $t$.

(c) Nonlinear, because of the $y^3$ term.

(d) Linear and time-invariant. It is a pure delay, with transfer function $e^{-2s}$, which is not rational.

Exercise 1.6 Positive feedback (advanced)

A plant $G = \dfrac{k}{s+1}$ is connected with unity positive feedback. Find the range of $k$ for which the closed loop is stable, and describe the closed-loop time constant as $k$ approaches the limit.

Show answer

$$\frac{Y}{R} = \frac{G}{1 - G} = \frac{k}{s + 1 - k}$$

The pole is at $s = k - 1$, so the loop is stable for $k < 1$. As $k$ approaches 1 from below, the pole approaches 0. The time constant $1/(1-k)$ grows without bound, and so does the DC gain $k/(1-k)$. The system becomes very slow and very sensitive to disturbance, the opposite of negative feedback.

## Summary

- Negative feedback makes the output depend on the error, so the loop is less sensitive to the plant and rejects disturbances

- The closed-loop transfer function is $\dfrac{CG}{1 + CGH}$ and the characteristic equation is $1 + L(s) = 0$

- The sensitivity function $S = \dfrac{1}{1+L}$ tells by what factor plant changes and disturbances are reduced

- High loop gain gives speed and accuracy but risks stability

- A purely proportional controller leaves a constant error, which leads to the integral term

Next unit. We need tools that turn the plant's differential equations into algebra. We begin with complex variables and the $s$-plane.
