---
title: "What Is a PID Controller? How Kp, Ki and Kd Work and How to Tune Them"
url: https://modsengineeringmath.com/en/blog/what-is-pid-controller/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> A PID controller adds proportional, integral and derivative action on the error. See what Kp, Ki and Kd do, the step-response table, a Ziegler–Nichols example and field problems.

Markdown copy of https://modsengineeringmath.com/en/blog/what-is-pid-controller/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is a PID Controller? How Kp, Ki and Kd Work and How to Tune Them

THภาษาไทยENEnglish
// Article · Control systems


PID is the most widely used controller in industry because the idea is simple: look at the error between the desired value and the measured value, then adjust the control signal from three viewpoints: the present, the past and the future of the error.

30-second summary

- $u(t)=K_pe(t)+K_i\int e\,dt+K_d\dfrac{de}{dt}$ where $e=r-y$

- P = present · I = past (removes steady-state error) · D = trend (reduces overshoot)

- Start with Ziegler–Nichols, then fine-tune from the real response

## The PID formula and transfer function

Let $r(t)$ be the desired value, $y(t)$ the measured value, and the error $e(t)=r(t)-y(t)$.

$$u(t)=K_p\,e(t)+K_i\int_0^t e(\tau)\,d\tau+K_d\,\frac{de(t)}{dt}$$

In the $s$ domain the controller can be written in two equivalent forms.

$$C(s)=K_p+\frac{K_i}{s}+K_d s \;=\; K_p\left(1+\frac{1}{T_i s}+T_d s\right),\qquad K_i=\frac{K_p}{T_i},\; K_d=K_pT_d$$

The first form is used in many software manuals; the second appears in textbooks and industrial controllers. Check which form your device uses before entering values.

## What each term does

- P (proportional): a large error gives a strong command, a small error a gentle one. Raising $K_p$ makes the response faster, but too much causes oscillation or instability, and most systems still keep a steady-state error with P alone.

- I (integral): as long as some error remains, it keeps accumulating until the command is strong enough to remove it. This drives the steady-state error to a constant reference to zero, but it slows the response and can cause overshoot.

- D (derivative): looks at the rate of change of the error and brakes in advance, reducing overshoot, but it amplifies high-frequency noise.

### Effect of increasing each gain on the step response

| Increase | Rise time | Overshoot | Settling time | Steady-state error |

| $K_p$ | Decreases | Increases | Small change | Decreases |

| $K_i$ | Decreases | Increases | Increases | Eliminated |

| $K_d$ | Small change | Decreases | Decreases | No change |

This table shows general trends for low-order systems. The three gains interact, so tune them together rather than finishing one at a time.

## Starting values with Ziegler–Nichols (closed-loop method)

Set $K_i=K_d=0$ and raise $K_p$ a little at a time until the system oscillates steadily. Record that $K_p$ as $K_u$ (the ultimate gain) and the oscillation period as $P_u$, then read the values from the table.

| Type | $K_p$ | $T_i$ | $T_d$ |

| P | $0.5K_u$ | – | – |

| PI | $0.45K_u$ | $P_u/1.2$ | – |

| PID | $0.6K_u$ | $P_u/2$ | $P_u/8$ |

Example

### You find $K_u=8$ and $P_u=2$ seconds

-
$$K_p=0.6\times8=4.8,\qquad T_i=\frac{2}{2}=1\ \text{s},\qquad T_d=\frac{2}{8}=0.25\ \text{s}$$

-
$$K_i=\frac{K_p}{T_i}=4.8,\qquad K_d=K_pT_d=4.8\times0.25=1.2$$

Starting values: $K_p=4.8$, $K_i=4.8\ \text{s}^{-1}$, $K_d=1.2\ \text{s}$. This method often gives high overshoot, so use it as a starting point and then reduce $K_p$ or $K_i$ according to the real response.

## Problems you meet in practice

- Integral windup: the actuator saturates but the I term keeps accumulating, causing large overshoot when the error changes sign. Fix it with anti-windup, for example stop integrating while saturated.

- Noise in the D term: add a low-pass filter on the derivative, and take the derivative of the measurement $y$ instead of the error $e$ so a sudden setpoint change does not cause a kick.

- Dead time: the larger it is, the more you must reduce $K_p$, and the D term helps little.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The PID controller: structure, effects and a browser simulation lab (in Thai)

- PID tuning: Ziegler–Nichols, Cohen–Coon and other methods (in Thai)

- Stability of control systems (in Thai)

- The whole control systems series: feedback, root locus, Bode (in Thai)

## Frequently asked questions

What do Kp, Ki and Kd each do?
Kp reacts to the present error: raising it speeds up the response but risks overshoot. Ki accumulates past error and removes steady-state error. Kd looks at the trend of the error: it reduces overshoot but is sensitive to noise.

Why do some systems use only PI instead of PID?
Because the derivative term amplifies sensor noise. Loops with noisy measurements, such as flow and liquid level, usually use PI, which is simple and good enough. Slow processes with clean measurements may benefit from the D term.

What is integral windup?
When the actuator (valve, motor, heater) saturates but the error is still not zero, the integral term keeps accumulating. When the error finally changes sign it takes a long time to unwind, causing large overshoot. Anti-windup, such as stopping integration while saturated, fixes it.

Does Ziegler–Nichols work for every kind of system?
No. The closed-loop method requires letting the system oscillate continuously at $K_u$, which can be dangerous on a real process, and the result is usually an aggressive, oscillatory response. Use it as a starting point and then fine-tune.

## More articles worth reading

Control systems
PID Tuning: The Complete Guide from Step Test to Ziegler–Nichols, SIMC and Anti-Windup
A full PID tuning course in one article: identify the process with a step test, tune with Ziegler–Nichols, Cohen–Coon, SIMC or relay, compare the…
16 Oct 2026Read the article →

Python · AI
Learning to Program in the AI Era: Why Start with Python
AI writes code in any language, but if you cannot read code you cannot tell whether it is right. Why Python is the best first language, six core…
25 Oct 2026Read the article →

Linear algebra
Cramer's Rule: How to Use It, Why It Works, and When Not to Use It
Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0…
25 Oct 2026Read the article →

All 2 articles in Control Systems & PID → · All articles

## Frequently asked questions

**What do Kp, Ki and Kd each do?**
Kp reacts to the present error: raising it speeds up the response but risks overshoot. Ki accumulates past error and removes steady-state error. Kd looks at the trend of the error: it reduces overshoot but is sensitive to noise.

**Why do some systems use only PI instead of PID?**
Because the derivative term amplifies sensor noise. Loops with noisy measurements, such as flow and liquid level, usually use PI, which is simple and good enough. Slow processes with clean measurements may benefit from the D term.

**What is integral windup?**
When the actuator (valve, motor, heater) saturates but the error is still not zero, the integral term keeps accumulating. When the error finally changes sign it takes a long time to unwind, causing large overshoot. Anti-windup, such as stopping integration while saturated, fixes it.

**Does Ziegler–Nichols work for every kind of system?**
No. The closed-loop method requires letting the system oscillate continuously at $K_u$, which can be dangerous on a real process, and the result is usually an aggressive, oscillatory response. Use it as a starting point and then fine-tune.
