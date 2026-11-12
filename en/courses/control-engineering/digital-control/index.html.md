---
title: "Digital Control: Microcontrollers, Sampling and Digital PID"
url: https://modsengineeringmath.com/en/courses/control-engineering/digital-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The structure of a digital control loop, ADC, zero-order hold and PWM, choosing the sampling period, aliasing, a first look at the z-transform, stability inside the unit circle, and writing PID as a difference equation for microcontrollers and PLCs.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/digital-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Digital Control: Microcontrollers, Sampling and Digital PID

// Unit 15 · Control Engineering


The structure of a digital control loop, ADC, zero-order hold and PWM, choosing the sampling period, aliasing, a first look at the z-transform, stability inside the unit circle, and writing PID as a difference equation for microcontrollers and PLCs.

## What you can do after this unit

- Explain the role of the ADC, the processor and the PWM or DAC in a digital control loop
- Choose a sampling period and an anti-aliasing filter to suit the loop bandwidth
- Convert a first-order system to a discrete-time model and test stability with the unit circle
- Write a PI or PID controller as a difference equation ready to program

## The picture to keep in mind: control in beats

The op-amp controllers of Units 10 and 13 work continuously. A microcontroller cannot. It works in a cycle: measure, compute, command, then wait, and repeat. Between cycles the controller does not know what the plant is doing, and the command stays at its last value.

If the cycle is very short compared with the speed of the plant, the result hardly differs from a continuous controller. If the cycle is too long, the loop rings or goes unstable. This unit answers how short is "short enough", and how to write the controller as a program.

## Parts of a digital loop

|
Part |
Function |
What to watch |

|
Anti-aliasing filter |
Analog low-pass filter in front of the ADC |
Must remove frequencies above half the sampling frequency |

|
ADC |
Converts voltage to a number every period $T$ |
Resolution (number of bits) and conversion time |

|
Processor |
Computes the difference equation of the controller |
Computation time is time delay (Unit 12) |

|
DAC or PWM |
Converts the number back to a command and holds it for the whole period |
Acts as a zero-order hold (ZOH) |

|
Timer interrupt |
Keeps the period $T$ constant |
A varying period (jitter) makes the I and D gains wrong |

Example 15.1 ADC resolution

A 12-bit ADC with a 0–3.3 V input range reads a current sensor with a gain of 66 mV/A. Find the size of 1 LSB in volts and in amperes.

$$1\ \text{LSB} = \frac{3.3}{2^{12}} = \frac{3.3}{4096} = 0.806\ \text{mV} \quad\Rightarrow\quad \frac{0.806}{66} = 12.2\ \text{mA}$$

The controller cannot see a current change smaller than 12 mA. With a high controller gain the output jumps in steps as 1 LSB changes, giving a small oscillation that never dies away (a limit cycle). Using the full range of the ADC with signal conditioning therefore matters.

## Choosing the sampling period

The sampling theorem sets the minimum: the sampling frequency $f_s = 1/T$ must be more than twice the highest frequency in the signal. Otherwise high-frequency components appear as false low frequencies, called aliasing, and cannot be filtered out afterwards.

For control that minimum is not enough, because the zero-order hold delays the command by $T/2$ on average, which eats phase margin.

$$\Delta\phi \approx \omega_{gc}\,\frac{T}{2} \times \frac{180°}{\pi}$$

Rule of practice

Choose a sampling frequency of about 10–30 times the closed-loop bandwidth. At 20 times, the phase lost to the ZOH is $\dfrac{2\pi}{20} \times \dfrac12 \times \dfrac{180°}{\pi} = 9°$, which is acceptable.

|
Loop |
Approximate bandwidth |
Typical sampling period |
Equipment |

|
Temperature, level |
Below 0.1 Hz |
0.1–1 s |
PLC, DCS |

|
Pressure, flow |
0.1–1 Hz |
10–100 ms |
PLC, DCS |

|
Motor speed |
10–100 Hz |
0.25–1 ms |
Drive, microcontroller |

|
Motor current, converter voltage |
0.5–5 kHz |
20–100 µs (often the PWM period) |
Microcontroller, DSP |

## Discrete-time models

A sampled signal is a sequence of numbers $y[k] = y(kT)$. The z-transform takes the place of the Laplace transform, and the variable $z^{-1}$ means a delay of one period.

$$\mathcal{Z}\{y[k-1]\} = z^{-1}Y(z)$$

The link with the $s$-plane is $z = e^{sT}$. The left half of the $s$-plane maps to the inside of the unit circle in the $z$-plane.

|
|
Continuous time |
Discrete time |

|
Model |
Differential equation, $G(s)$ |
Difference equation, $G(z)$ |

|
Stability condition |
Poles in the left half-plane |
Poles inside the unit circle, $\lvert z\rvert < 1$ |

|
Pole giving a constant (integrator) |
$s = 0$ |
$z = 1$ |

|
Fast poles |
Far to the left |
Near the origin |

A first-order plant $G(s) = \dfrac{K}{\tau s + 1}$ driven through a zero-order hold has the exact discrete-time model

$$G(z) = \frac{K(1 - a)}{z - a}, \qquad a = e^{-T/\tau} \quad\Longleftrightarrow\quad y[k+1] = a\,y[k] + K(1 - a)\,u[k]$$

Example 15.2 Sampling puts a limit on the gain

The plant $G(s) = \dfrac{1}{s + 1}$ ($K = 1$, $\tau = 1$ s) is controlled by a digital P controller of gain $K_p$ with period $T = 0.1$ s and unity feedback. Find the stable range of $K_p$.

Step 1. $a = e^{-0.1} = 0.9048$, so $G(z) = \dfrac{0.0952}{z - 0.9048}$

Step 2. Characteristic equation $1 + K_pG(z) = 0$:

$$z - 0.9048 + 0.0952K_p = 0 \quad\Longrightarrow\quad z = 0.9048 - 0.0952K_p$$

Step 3. We need $\lvert z\rvert < 1$. The binding side is $z > -1$.

$$0.9048 - 0.0952K_p > -1 \quad\Longrightarrow\quad K_p < \frac{1.9048}{0.0952} = 20.0$$

The same continuous system ($s + 1 + K_p = 0$) is stable for every $K_p > 0$. The limit of 20 comes from sampling alone. With the period cut to $T = 0.01$ s the limit widens to about 200. Faster sampling opens the way to higher gain.

## Digital PID

Replace the integral by a sum and the derivative by a backward difference.

$$\int e\,dt \approx T\sum_{i=0}^{k} e[i], \qquad \frac{de}{dt} \approx \frac{e[k] - e[k-1]}{T}$$

This gives the position form

$$u[k] = K_pe[k] + K_iT\sum_{i=0}^{k}e[i] + \frac{K_d}{T}\bigl(e[k] - e[k-1]\bigr)$$

Subtracting $u[k-1]$ from $u[k]$ gives the velocity form, which computes only the change.

$$u[k] = u[k-1] + K_p\bigl(e[k] - e[k-1]\bigr) + K_iT\,e[k] + \frac{K_d}{T}\bigl(e[k] - 2e[k-1] + e[k-2]\bigr)$$

The velocity form is popular in PLCs and drives because $u[k]$ can be limited directly, which prevents windup as a side effect, and because switching between manual and auto does not bump the output.

Example 15.3 The motor speed PI in a microcontroller

Program the PI controller of Example 13.1 ($K_p = 0.20$, $K_i = 2.70$) with a period $T = 1$ ms. Find the coefficients of the velocity form and check that the period is suitable.

Step 1. $K_iT = 2.70 \times 0.001 = 0.0027$

$$u[k] = u[k-1] + 0.20\bigl(e[k] - e[k-1]\bigr) + 0.0027\,e[k]$$

Step 2. Check the period: the closed loop has $\tau_c = 20$ ms, a bandwidth of $1/\tau_c = 50$ rad/s or 8 Hz. A 1 kHz sampling frequency is 125 times higher, more than enough.

Step 3. The program in the timer interrupt routine.

// called every 1 ms from the timer interrupt
void speed_loop(void) {
float e = speed_ref - speed_meas; // rad/s
u += 0.20f * (e - e_prev) + 0.0027f * e; // velocity form
if (u > 12.0f) u = 12.0f; // limiting = anti-windup
if (u < 0.0f) u = 0.0f;
e_prev = e;
set_pwm_duty(u / 12.0f); // 0–12 V → duty 0–1
}

The limiting lines stop u from accumulating beyond the supply rating, so the windup problem found in Step 3 of Example 13.1 is solved with no extra code.

PID in a PLC

A PLC PID block uses the same difference equation. The user is responsible for calling the block at a constant period, for example in a cyclic interrupt task and not in the main scan, whose time varies. The block multiplies $K_i$ and divides $K_d$ by the configured $T$. If the real period differs from the configured one, the I and D gains are wrong in proportion.

## Exercises

Exercise 15.1

A voltage loop has a closed-loop bandwidth of 500 Hz. Suggest a sampling frequency and a corner frequency for the anti-aliasing filter.

Show answer

By the 10–30 times rule choose $f_s$ of about 10 kHz (20 times), a period of 100 µs.

The filter must attenuate components above $f_s/2 = 5$ kHz without adding much lag at 500 Hz. A corner frequency of 2–3 kHz is the usual compromise.

Exercise 15.2

The plant $G(s) = \dfrac{2}{0.5s + 1}$ is sampled with $T = 0.05$ s through a zero-order hold. Find $G(z)$ and the difference equation.

Show answer

$a = e^{-0.05/0.5} = e^{-0.1} = 0.9048$ and $K(1 - a) = 2 \times 0.0952 = 0.1903$

$$G(z) = \frac{0.1903}{z - 0.9048}, \qquad y[k+1] = 0.9048\,y[k] + 0.1903\,u[k]$$

DC gain check: with $z = 1$, $0.1903/0.0952 = 2$.

Exercise 15.3

A 10-bit ADC measures temperature over 0–200 °C. What is the resolution, and how many bits are needed for a resolution of 0.05 °C?

Show answer

$200/2^{10} = 200/1024 = 0.195$ °C per LSB

We need $2^n \ge 200/0.05 = 4000$, so $n = 12$ bits ($2^{12} = 4096$).

## Summary of Unit 15

- A digital loop works in periods: sample with the ADC, compute, then hold the output with a DAC or PWM.

- Sample at 10–30 times the closed-loop bandwidth and put an anti-aliasing filter in front of the ADC.

- $z^{-1}$ is a delay of one period. The system is stable when its poles are inside the unit circle.

- Sampling adds delay and so limits the usable gain.

- A velocity-form digital PID takes a few lines of code, and limiting its output prevents windup.

The last part of the course leaves the frame of linear systems for control based on expert rules and on data.
