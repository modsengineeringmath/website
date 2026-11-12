---
title: "PID Control, Tuning and Use in PLCs, Drives and DCS"
url: https://modsengineeringmath.com/en/courses/control-engineering/pid-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> What the P, I and D terms do, the parallel and ISA standard forms, tuning by pole cancellation and by Ziegler–Nichols, integral windup and derivative noise, and real implementations in op-amp circuits, PLC PID blocks, inverters and DCS.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/pid-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PID Control, Tuning and Use in PLCs, Drives and DCS

// Unit 13 · Control Engineering


What the P, I and D terms do, the parallel and ISA standard forms, tuning by pole cancellation and by Ziegler–Nichols, integral windup and derivative noise, and real implementations in op-amp circuits, PLC PID blocks, inverters and DCS.

## What you can do after this unit

- Explain what the P, I and D terms do and how each affects the response
- Convert parameters between the parallel form (Kp, Ki, Kd) and the standard form (Kp, Ti, Td)
- Tune a PI controller by pole cancellation and a PID by the Ziegler–Nichols method
- Explain integral windup and derivative noise and the remedies used in real equipment

## The picture to keep in mind: present, past and future

A driver holding 90 km/h uses three pieces of information without thinking about it.

- How far below the target am I now? The further off, the harder the accelerator is pressed. This is the P (proportional) term: it looks at the present.

- How long have I been below the target? If the car is still slow on a hill, press a little more and a little more until the target is reached. This is the I (integral) term: it accumulates the past.

- How fast is the speed changing? If the needle is racing towards 90, ease off in advance. This is the D (derivative) term: it anticipates the future.

A PID controller combines the three, and it runs most industrial loops, from furnace temperature to motor current.

## The PID equation

Parallel form:

$$u(t) = K_p\,e(t) + K_i\int_0^t e(\tau)\,d\tau + K_d\,\frac{de(t)}{dt}, \qquad C(s) = K_p + \frac{K_i}{s} + K_ds$$

Standard (ISA) form, used in most PLCs and DCS:

$$C(s) = K_p\left(1 + \frac{1}{T_is} + T_ds\right), \qquad K_i = \frac{K_p}{T_i}, \quad K_d = K_pT_d$$

$T_i$ is the integral time (reset time) and $T_d$ the derivative time, in seconds or minutes.

Check the form and units of the equipment before entering values

Manufacturers differ. Some use $K_i$, some $T_i$ in seconds, some in minutes, and some use the proportional band $PB = 100/K_p$ in percent instead of a gain. Well-tuned values entered in the wrong form can make a loop unstable.

## What each term does

|
Term |
Action |
Strength |
Weakness |

|
P |
Acts on the size of the present error |
Fast, easy to understand |
Leaves a steady-state error (Unit 7); high gain causes ringing |

|
I |
Accumulates the error over time |
Removes the error for constant inputs and disturbances |
Adds 90° of lag, increases overshoot, can wind up |

|
D |
Acts on the rate of change of the error |
Adds phase lead, reduces overshoot |
Amplifies high-frequency noise |

Compare with Unit 10: PI is a lag compensator with its pole exactly at the origin, PD is a lead compensator with its pole very far away, and PID is a lead-lag.

The plot shows the usual sequence. P alone rests at $\dfrac{K_pG(0)}{1 + K_pG(0)} = \dfrac{5}{6} = 0.83$. Adding I removes the error but overshoots 29 %. Adding D cuts the overshoot to 7 %.

## Tuning by pole cancellation

When the plant is first order, $G(s) = \dfrac{K}{\tau s + 1}$, write the PI controller as $C(s) = K_p\,\dfrac{T_is + 1}{T_is}$. Choosing $T_i = \tau$ makes the controller zero cancel the plant pole.

$$L(s) = \frac{K_pK}{\tau s} \quad\Longrightarrow\quad T(s) = \frac{1}{\tau_cs + 1}, \qquad \tau_c = \frac{\tau}{K_pK}$$

The closed loop is first order with no overshoot, and the designer chooses its speed $\tau_c$ directly.

Example 13.1 PI controller for a motor speed loop

The motor of Example 3.3 has $G(s) = \dfrac{18.5}{0.074s + 1}$. We want a closed-loop time constant of 20 ms and no steady-state error.

Step 1. Choose $T_i = \tau = 0.074$ s.

Step 2. From $\tau_c = \dfrac{\tau}{K_pK}$:

$$K_p = \frac{\tau}{K\tau_c} = \frac{0.074}{(18.5)(0.02)} = 0.20\ \text{V per rad/s}, \qquad K_i = \frac{K_p}{T_i} = 2.70$$

Step 3. Check the control signal. For a sudden speed change of 100 rad/s the P term asks for $0.20 \times 100 = 20$ V at the first instant, above the 12 V supply. The controller output saturates. Anti-windup is needed, or the reference must be ramped, which every inverter offers as acceleration and deceleration times.

This method is the basis of tuning current and speed loops in drives, and of IMC (lambda) tuning in the process industries.

## The Ziegler–Nichols method

With no model, the Ziegler–Nichols ultimate gain method uses an experiment on the real system.

- Switch off I and D, leaving only P.

- Raise $K_p$ in small steps until the output oscillates at constant amplitude. Record the ultimate gain $K_u$ and the period $T_u$.

- Set the values from the table.

|
Controller |
$K_p$ |
$T_i$ |
$T_d$ |

|
P |
$0.5K_u$ |
|
|

|
PI |
$0.45K_u$ |
$T_u/1.2$ |
|

|
PID |
$0.6K_u$ |
$T_u/2$ |
$T_u/8$ |

Example 13.2 Ziegler–Nichols PID for the servo

The plant $G(s) = \dfrac{1}{s(s + 1)(s + 5)}$ of Example 8.1 has $K_u = 30$ and $T_u = 2.81$ s. Find the PID values.

$$K_p = 0.6 \times 30 = 18, \qquad T_i = \frac{2.81}{2} = 1.40\ \text{s}, \qquad T_d = \frac{2.81}{8} = 0.351\ \text{s}$$

In parallel form: $K_i = 18/1.40 = 12.8$ and $K_d = 18 \times 0.351 = 6.32$

Closed-loop simulation with these values gives about 62 % overshoot, too much for most work.

Ziegler–Nichols is a starting point, not the final setting

The table was designed for quarter-amplitude decay, to reject disturbances quickly, so it gives an oscillatory result. In practice use it as a first guess, then reduce $K_p$ by 30–50 % and increase $T_i$ until the damping is acceptable. Driving a system to the edge of stability is also unsafe for many machines, so modern equipment uses relay autotuning, which finds $K_u$ and $T_u$ from a small, controlled oscillation.

## Practical problems

Integral windup. Every actuator has a limit: supply voltage, a fully open valve, 100 % duty cycle. While the output is saturated the error is not yet zero, so the integrator keeps accumulating to a huge value. Once the output reaches the target, that stored value has to unwind, causing a large, long overshoot. The remedies (anti-windup) are to stop integrating while the output is saturated (clamping), or to feed the difference between the computed and the actual output back to reduce the integrator (back-calculation).

Noise in the D term. A pure derivative $K_ds$ has gain that rises with frequency without limit, so it amplifies sensor noise. Real equipment always adds a first-order filter.

$$D(s) = \frac{K_ds}{\dfrac{T_d}{N}s + 1}, \qquad N \approx 5\text{–}20$$

Derivative kick. When the reference steps, the derivative of the error is momentarily enormous. The D term is therefore usually taken from the measurement, $-K_d\,dy/dt$, instead of from the error.

## PID in real equipment

|
Equipment |
Where the PID is |
Character |

|
Op-amp circuit |
$Z_2 = R_2 + \dfrac{1}{sC_2}$ with $Z_1 = R_1$ gives PI: $-\dfrac{R_2}{R_1}\left(1 + \dfrac{1}{R_2C_2s}\right)$ |
Continuous and very fast; used in power supplies and analog current loops |

|
PLC |
A PID function block called at a fixed interval |
Suits slow loops (temperature, level, pressure); must be called at a constant period; output is 4–20 mA analog or time-proportioned PWM to an SSR |

|
Inverters and servo drives |
PI current and speed loops in the drive processor |
Cascaded loops, computation period of 50–250 µs, plus an external PID function for pump pressure or flow |

|
DCS |
Hundreds to thousands of PID blocks in controllers distributed by process unit |
Manual/auto/cascade modes, bumpless transfer and redundancy |

|
Packaged temperature controllers |
PID with autotuning |
Used with thermocouples and SSRs in control panels |

On-off control and PID

A thermostat driving a contactor is on-off control, with hysteresis so that the contacts do not switch too often. The temperature therefore cycles around the setting all the time. Replacing it with a PID that drives an SSR by PWM makes the average power continuously adjustable, so the temperature holds steady. The price is that it must be tuned. If the job tolerates a 2–3 °C swing, on-off control remains the cheaper and more rugged choice.

Cascade loops

When a disturbance enters an inner part of a process, use two PIDs in cascade. The output of the outer loop (say temperature) is the reference of the inner loop (say steam flow). The inner loop rejects the disturbance before it reaches the outer one. The inner loop must be at least 3–5 times faster than the outer loop, and is always tuned first. Motor drives use the same principle for the current, speed and position loops.

## Exercises

Exercise 13.1

A temperature controller is set to $PB = 50\ \%$, $T_i = 2$ min, $T_d = 0.5$ min. Convert to $K_p$, $K_i$ and $K_d$ in seconds.

Show answer

$K_p = 100/50 = 2$, $T_i = 120$ s, $T_d = 30$ s

$K_i = K_p/T_i = 0.0167$ s⁻¹ and $K_d = K_pT_d = 60$ s

Exercise 13.2

A heating process has $G(s) = \dfrac{2}{60s + 1}$ (°C per % power). Design a PI for a closed-loop time constant of 20 s.

Show answer

$T_i = 60$ s and $K_p = \dfrac{\tau}{K\tau_c} = \dfrac{60}{(2)(20)} = 1.5$ % per °C

Exercise 13.3

A pressure loop is found to oscillate at constant amplitude with $K_p = 8$ and a period of 12 s. Find the Ziegler–Nichols PI values and suggest values to start with in practice.

Show answer

$K_p = 0.45 \times 8 = 3.6$ and $T_i = 12/1.2 = 10$ s

Since the table gives an oscillatory result, start with the gain reduced by about 30–50 %, say $K_p \approx 2$–$2.5$, and adjust from the observed response.

## Summary of Unit 13

- P looks at the present error, I accumulates the past to remove steady-state error, and D uses the trend to reduce overshoot.

- The standard form uses $K_p$, $T_i$, $T_d$, with $K_i = K_p/T_i$ and $K_d = K_pT_d$. Check the form used by the equipment before entering values.

- A first-order plant is tuned with $T_i = \tau$ and $K_p = \tau/(K\tau_c)$.

- Ziegler–Nichols uses $K_u$ and $T_u$ from an experiment and gives starting values to be detuned.

- Real equipment needs anti-windup and a filter on the D term.

The next unit opens Part 4 with another way of writing a model: state space.
