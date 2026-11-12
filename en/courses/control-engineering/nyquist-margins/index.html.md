---
title: "The Nyquist Criterion, Gain Margin and Phase Margin"
url: https://modsengineeringmath.com/en/courses/control-engineering/nyquist-margins/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> Decide closed-loop stability from the open-loop frequency response. The Nyquist criterion, the definition and calculation of gain margin and phase margin, their link to damping ratio, and the effect of time delay from PLC scan time and digital computation.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/nyquist-margins/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# The Nyquist Criterion, Gain Margin and Phase Margin

// Unit 12 · Control Engineering


Decide closed-loop stability from the open-loop frequency response. The Nyquist criterion, the definition and calculation of gain margin and phase margin, their link to damping ratio, and the effect of time delay from PLC scan time and digital computation.

## What you can do after this unit

- Explain why the point −1 is the critical point for stability
- Use the Nyquist criterion to decide closed-loop stability
- Find gain margin and phase margin by calculation and from a Bode plot
- Estimate damping ratio from phase margin and calculate the phase lost to a time delay

## The picture to keep in mind: a signal that returns to reinforce itself

Follow a sinusoid once round the loop. It is multiplied by $L(j\omega)$ and then inverted at the summing point (negative feedback). If at some frequency the loop shifts the phase by exactly $-180°$, the inversion brings the signal back in phase with itself. If the loop magnitude at that frequency is also 1, the signal circulates with no input. If it is more than 1, the signal grows on every pass.

"Magnitude 1 and phase $-180°$" as a complex number is $L(j\omega) = -1$, which is the characteristic equation $1 + L(s) = 0$ at $s = j\omega$. The point $-1$ is therefore the critical point. The question of this unit is how far the plot of $L(j\omega)$ stays from it.

## The Nyquist criterion

The Nyquist plot is the graph of $L(j\omega)$ in the complex plane as $\omega$ goes from $-\infty$ to $+\infty$. The negative-frequency part is the mirror image of the positive-frequency part in the real axis.

The Nyquist criterion

$$Z = N + P$$

- $P$ = number of poles of the open loop $L(s)$ in the right half of the $s$-plane

- $N$ = number of clockwise encirclements of the point $-1$ by the Nyquist plot (anticlockwise counts negative)

- $Z$ = number of closed-loop poles in the right half-plane

The closed loop is stable if and only if $Z = 0$.

Most plants in electrical work are open-loop stable ($P = 0$), so the criterion reduces to: the closed loop is stable when the Nyquist plot does not encircle $-1$.

It has three advantages over the Routh criterion: it works with data measured on the real system with no equation, it handles time delay, and it shows how stable the system is.

## Gain margin and phase margin

A system that is stable on paper but close to the limit rings badly and may be unstable in reality when component values drift. The distance from $-1$ is therefore measured by two numbers.

|
Quantity |
Definition |
Meaning |

|
Phase crossover frequency $\omega_{pc}$ |
Frequency where $\angle L = -180°$ |
|

|
Gain margin (GM) |
$\dfrac{1}{\lvert L(j\omega_{pc})\rvert}$, or $-20\log\lvert L(j\omega_{pc})\rvert$ dB |
How many times the gain can rise before instability |

|
Gain crossover frequency $\omega_{gc}$ |
Frequency where $\lvert L\rvert = 1$ (0 dB) |
Close to the closed-loop bandwidth |

|
Phase margin (PM) |
$180° + \angle L(j\omega_{gc})$ |
How many degrees of phase the loop can lose before instability |

On a Bode plot, GM is the distance of the magnitude curve below 0 dB at the frequency where the phase passes $-180°$, and PM is the distance of the phase curve above $-180°$ at the frequency where the magnitude passes 0 dB.

Example 12.1 Margins of the servo

Find the GM and PM of $L(s) = \dfrac{5}{s(s + 1)(s + 5)}$.

Gain margin. From Example 8.1 the system reaches the stability limit at a gain of 30, at $\omega = 2.24$ rad/s. The present gain is 5.

$$\text{GM} = \frac{30}{5} = 6 \;\Rightarrow\; 20\log 6 = 15.6\ \text{dB}, \qquad \omega_{pc} = 2.24\ \text{rad/s}$$

Direct check: $\lvert L(j2.24)\rvert = \dfrac{5}{(2.24)(2.45)(5.48)} = \dfrac{1}{6}$

Phase margin. Find $\omega_{gc}$ from $\lvert L\rvert = 1$.

$$\omega\sqrt{\omega^2 + 1}\sqrt{\omega^2 + 25} = 5$$

By trial: at $\omega = 0.78$, $(0.78)(1.268)(5.06) = 5.00$, so $\omega_{gc} = 0.78$ rad/s.

$$\angle L(j0.78) = -90° - \tan^{-1}(0.78) - \tan^{-1}(0.78/5) = -90° - 37.9° - 8.9° = -136.8°$$

$$\text{PM} = 180° - 136.8° = 43.2°$$

## Phase margin and damping

For a system with one dominant pair of poles there is a widely used rule of thumb.

$$\zeta \approx \frac{\text{PM (degrees)}}{100} \qquad (\text{valid for PM} < 70°)$$

|
PM |
Approximate $\zeta$ |
Approximate overshoot |
Character |

|
$30°$ |
0.3 |
37 % |
Very oscillatory |

|
$45°$ |
0.45 |
20 % |
The usual minimum acceptable |

|
$60°$ |
0.6 |
10 % |
A common design target |

In Example 12.1, PM = 43.2° predicts $\zeta \approx 0.43$ and about 22 % overshoot. Simulation of the actual system gives 25 % (the dominant poles are at $-0.39 \pm j0.90$, with $\zeta = 0.40$). The rule is a good guide for the direction of a design.

Requirements met in practice

A common requirement for industrial loops is a GM of at least 6 dB (the gain can double) and a PM of at least 45°. Switching power supplies usually specify a PM of 45°–60° over the whole range of load and input voltage, because capacitor ESR and inductance change with temperature and age.

## Time delay

A time delay $T_d$ (dead time) has the transfer function $e^{-sT_d}$. At $s = j\omega$ its magnitude is 1 at every frequency, but it adds phase lag.

$$\angle e^{-j\omega T_d} = -\omega T_d\ \text{rad} = -\omega T_d \times \frac{180°}{\pi}$$

So a delay eats phase margin directly without changing $\omega_{gc}$. Sources of delay are everywhere in practice: PLC scan time, fieldbus communication, the computation and PWM update time of a microcontroller, and the distance a fluid travels in a pipe to reach the sensor.

Example 12.2 How much phase margin does a PLC scan cost?

The loop of Example 12.1 is controlled by a PLC with a total delay (scan time, input filtering and output update) of 0.2 s. Find the new phase margin and the largest delay before instability.

Phase lost at $\omega_{gc} = 0.78$ rad/s:

$$\Delta\phi = 0.78 \times 0.2 \times \frac{180°}{\pi} = 8.9°$$

The phase margin is left at $43.2° - 8.9° = 34.3°$. The loop rings noticeably more.

The delay that brings the PM to zero:

$$T_{d,\max} = \frac{\text{PM (rad)}}{\omega_{gc}} = \frac{43.2° \times \pi/180°}{0.78} = 0.97\ \text{s}$$

A loop this slow tolerates a 10–20 ms scan easily. But in a drive current loop, with $\omega_{gc}$ of several thousand rad/s, a delay of only 100 µs costs tens of degrees. Fast loops must therefore be computed in a microcontroller or DSP, not in a PLC.

## Exercises

Exercise 12.1

If the gain of the loop in Example 12.1 is raised from 5 to 15, what is the gain margin and how is the response expected to change?

Show answer

$\text{GM} = 30/15 = 2$, or 6 dB, at the lower edge of what is acceptable. $\omega_{gc}$ rises and the loop is faster, but the phase margin falls (to about 16°), so overshoot and ringing increase clearly.

Exercise 12.2

A loop has $L(s) = \dfrac{10}{s(0.1s + 1)}$. Find $\omega_{gc}$ and the PM.

Show answer

$\lvert L\rvert = \dfrac{10}{\omega\sqrt{1 + 0.01\omega^2}} = 1$. With $x = \omega^2$: $x(1 + 0.01x) = 100$, so $0.01x^2 + x - 100 = 0$, $x = 61.8$, $\omega_{gc} = 7.86$ rad/s.

$\angle L = -90° - \tan^{-1}(0.786) = -128.2°$, so PM = 51.8°.

The phase of this loop never reaches $-180°$ at any frequency, so the GM is infinite.

Exercise 12.3

A converter voltage loop has $\omega_{gc} = 2\pi \times 5$ kHz and PM = 60°. If digital computation adds a 15 µs delay, what phase margin remains?

Show answer

$\omega_{gc} = 31{,}416$ rad/s. Phase lost $= 31{,}416 \times 15 \times 10^{-6} \times \dfrac{180°}{\pi} = 27°$

The PM falls from 60° to 33°. A delay that looks tiny matters a great deal in a fast loop.

## Summary of Unit 12

- The point $-1$ in the plane of $L(j\omega)$ is critical because it corresponds to $1 + L = 0$.

- Nyquist criterion: $Z = N + P$. With a stable open loop, the closed loop is stable when the plot does not encircle $-1$.

- GM is the gain still available at the frequency where the phase is $-180°$; PM is the phase still available where the magnitude is 1.

- $\zeta \approx \text{PM}/100$ estimates overshoot from phase margin.

- A delay $T_d$ reduces the phase margin by $\omega_{gc}T_d$ radians.

The next unit brings all these tools to the controller most used in industry: PID.
