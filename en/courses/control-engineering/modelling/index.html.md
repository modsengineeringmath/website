---
title: "Modelling Electrical, Op-Amp, Mechanical and DC Motor Systems"
url: https://modsengineeringmath.com/en/courses/control-engineering/modelling/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> Derive the transfer functions of RLC circuits, op-amp circuits, rotating mechanical systems, the DC motor and sensors using s-domain impedance, with a table of electrical-mechanical analogies and examples computed from realistic values.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/modelling/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Modelling Electrical, Op-Amp, Mechanical and DC Motor Systems

// Unit 3 · Control Engineering


Derive the transfer functions of RLC circuits, op-amp circuits, rotating mechanical systems, the DC motor and sensors using s-domain impedance, with a table of electrical-mechanical analogies and examples computed from realistic values.

## What you can do after this unit

- Use the impedances R, sL and 1/(sC) to find the transfer function of a circuit without writing a differential equation
- Find the transfer function of an inverting op-amp circuit from a ratio of impedances
- Write the model of an armature-controlled DC motor and reduce it to a first-order system
- Represent sensors and transmitters as a gain or a first-order system in a block diagram

## The picture to keep in mind: a model is a map

A map is not the city, but it is detailed enough to get you there. A mathematical model is the same: an equation detailed enough to predict how the output changes when an input is applied. Engineers choose the level of detail to suit the job. The same motor may be modelled as first order when designing the speed loop and second order when designing the current loop.

Unit 2 built $G(s)$ from differential equations. This unit uses a shortcut that electrical students already own: impedance.

## Impedance in the s-domain

In AC circuit analysis we use $j\omega L$ and $1/(j\omega C)$ for sinusoids in steady state. Replacing $j\omega$ by $s$ gives impedances that work for signals of any shape (with zero initial conditions).

|
Component |
Time-domain relation |
Impedance $Z(s)$ |

|
Resistor |
$v = Ri$ |
$R$ |

|
Inductor |
$v = L\,\dfrac{di}{dt}$ |
$sL$ |

|
Capacitor |
$i = C\,\dfrac{dv}{dt}$ |
$\dfrac{1}{sC}$ |

Ohm's law, Kirchhoff's laws and the voltage divider then apply exactly as in DC circuits.

Example 3.1 Series RLC circuit

A series RLC circuit has $R = 10\ \Omega$, $L = 10$ mH, $C = 100\ \mu\text{F}$, with the output taken across the capacitor. Find $G(s) = V_o/V_i$, the natural frequency and the damping ratio.

Step 1. Voltage divider.

$$G(s) = \frac{1/(sC)}{R + sL + 1/(sC)} = \frac{1}{LCs^2 + RCs + 1}$$

Step 2. Substitute $LC = (10 \times 10^{-3})(100 \times 10^{-6}) = 10^{-6}$ and $RC = 10^{-3}$.

$$G(s) = \frac{1}{10^{-6}s^2 + 10^{-3}s + 1} = \frac{10^{6}}{s^2 + 1000s + 10^{6}}$$

Step 3. Compare with the standard form $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$: $\omega_n = 1000$ rad/s and $2\zeta\omega_n = 1000$, so $\zeta = 0.5$.

The poles are at $s = -500 \pm j866$. They are complex, so the output voltage oscillates before settling. Unit 6 gives the details.

Formulas worth remembering for the series RLC circuit

$$\omega_n = \frac{1}{\sqrt{LC}}, \qquad \zeta = \frac{R}{2}\sqrt{\frac{C}{L}}$$

The resistor is the damper. With $R = 0$ the circuit would oscillate for ever at $\omega_n$, which is the resonant frequency met in AC circuit analysis.

## Op-amp circuits

An inverting op-amp circuit with input impedance $Z_1(s)$ and feedback impedance $Z_2(s)$ has the transfer function

$$G(s) = \frac{V_o(s)}{V_i(s)} = -\frac{Z_2(s)}{Z_1(s)}$$

This one formula produces the whole family of analog controllers, simply by changing the kind of $Z_1$ and $Z_2$.

|
$Z_1$ |
$Z_2$ |
$G(s)$ |
Function |

|
$R_1$ |
$R_2$ |
$-\dfrac{R_2}{R_1}$ |
Gain (P controller) |

|
$R$ |
$\dfrac{1}{sC}$ |
$-\dfrac{1}{RCs}$ |
Integrator (the I part) |

|
$\dfrac{1}{sC}$ |
$R$ |
$-RCs$ |
Differentiator (the D part) |

|
$R_1$ |
$R_2 \parallel \dfrac{1}{sC}$ |
$-\dfrac{R_2/R_1}{R_2Cs + 1}$ |
Low-pass filter with gain |

Example 3.2 Active low-pass filter

An inverting op-amp circuit has $R_1 = 10\ \text{k}\Omega$, with $R_2 = 100\ \text{k}\Omega$ in parallel with $C = 0.1\ \mu\text{F}$ in the feedback path. Find the DC gain, the time constant and the pole.

The feedback impedance is $Z_2 = \dfrac{R_2}{R_2Cs + 1}$, so

$$G(s) = -\frac{R_2/R_1}{R_2Cs + 1} = -\frac{10}{0.01s + 1}$$

The DC gain is $-10$ (inverting), the time constant is $\tau = R_2C = (100 \times 10^{3})(0.1 \times 10^{-6}) = 0.01$ s and the pole is at $s = -100$ rad/s. This circuit is used to filter sensor noise before the ADC of a microcontroller or PLC.

## Rotating mechanical systems and the electrical analogy

A shaft with moment of inertia $J$ and viscous friction $b$ is driven by a torque $T(t)$ and turns at angular speed $\omega(t)$. Newton's second law for rotation gives

$$J\,\frac{d\omega}{dt} + b\,\omega = T(t) \quad\Longrightarrow\quad \frac{\Omega(s)}{T(s)} = \frac{1}{Js + b}$$

This has exactly the form of the RL circuit ($L\,di/dt + Ri = v$). Anyone who understands circuits can understand mechanical systems by matching quantities.

|
Electrical |
Translational mechanical |
Rotational mechanical |

|
Voltage $v$ |
Force $f$ |
Torque $T$ |

|
Current $i$ |
Velocity $v$ |
Angular speed $\omega$ |

|
Inductance $L$ |
Mass $m$ |
Moment of inertia $J$ |

|
Resistance $R$ |
Damper $b$ |
Viscous friction $b$ |

|
$1/C$ |
Spring constant $k$ |
Torsional spring constant $k$ |

Inertia resists a change of speed as an inductor resists a change of current. A motor driving a heavy load accelerates slowly for the same reason that the current in a coil rises slowly.

## The DC motor

The armature-controlled permanent-magnet DC motor is the plant most often used to teach control, because it joins an electrical circuit to a mechanical system in one device. There are four equations.

|
Part |
Equation |
Meaning |

|
Armature circuit |
$v_a = R_a i_a + L_a\dfrac{di_a}{dt} + e_b$ |
Kirchhoff's voltage law |

|
Back EMF |
$e_b = K_b\,\omega$ |
The faster it turns, the larger the opposing voltage |

|
Torque |
$T = K_t\,i_a$ |
Torque is proportional to current |

|
Mechanical part |
$J\dfrac{d\omega}{dt} + b\,\omega = T$ |
Newton's law |

In SI units $K_t$ (N·m/A) and $K_b$ (V·s/rad) are equal, so we write a single $K$. Transforming and eliminating $I_a(s)$ gives

$$\frac{\Omega(s)}{V_a(s)} = \frac{K}{(L_as + R_a)(Js + b) + K^2}$$

Back EMF is feedback that nature provides

The $K^2$ term in the denominator comes from $e_b = K\omega$, which feeds the speed back and subtracts it from the input voltage. A DC motor therefore has a feedback loop inside it, and this is why it settles at a definite speed for a constant voltage instead of accelerating for ever.

The electrical time constant $L_a/R_a$ is usually much smaller than the mechanical one. Dropping $L_a$ reduces the model to first order.

$$\frac{\Omega(s)}{V_a(s)} \approx \frac{K}{R_aJs + R_ab + K^2} = \frac{K_m}{\tau_m s + 1}, \qquad K_m = \frac{K}{R_ab + K^2}, \quad \tau_m = \frac{R_aJ}{R_ab + K^2}$$

Example 3.3 A small 12 V DC motor

A motor has $R_a = 2\ \Omega$, $K = 0.05$ V·s/rad, $J = 1 \times 10^{-4}$ kg·m², $b = 1 \times 10^{-4}$ N·m·s/rad, and $L_a$ is negligible. Find the first-order model and the steady-state speed at 12 V.

Step 1. Common denominator: $R_ab + K^2 = (2)(10^{-4}) + (0.05)^2 = 2.7 \times 10^{-3}$

Step 2. Gain and time constant.

$$K_m = \frac{0.05}{2.7 \times 10^{-3}} = 18.5\ \text{rad/s per V}, \qquad \tau_m = \frac{(2)(10^{-4})}{2.7 \times 10^{-3}} = 0.074\ \text{s}$$

$$G(s) = \frac{18.5}{0.074s + 1}$$

Step 3. At 12 V the final speed is $12 \times 18.5 = 222$ rad/s, or $222 \times \dfrac{60}{2\pi} = 2{,}122$ rpm, and the motor reaches 63.2 % of this in 74 ms.

Induction motors with inverters

The full model of a three-phase induction motor is far more complicated. But under vector control the drive separates flux control from torque control, so the speed loop sees the motor as $\dfrac{1}{Js + b}$, like a DC motor. What you learn in this unit carries straight over to AC drives.

## Sensors and transmitters

In a block diagram the sensor is the block $H(s)$. Most can be represented in one of two ways.

- A constant gain, when the sensor is much faster than the plant: encoders, voltage dividers, current transformers.

- A first-order system $\dfrac{K_s}{\tau_s s + 1}$, when the sensor lags: a thermocouple in a thermowell.

Example 3.4 Gain of a 4–20 mA transmitter

A PT100 temperature transmitter is ranged 0–100 °C for a 4–20 mA signal. Find the gain and the current at 65 °C.

$$K_s = \frac{20 - 4}{100 - 0} = 0.16\ \text{mA/°C}, \qquad i = 4 + 0.16 \times 65 = 14.4\ \text{mA}$$

The 4 mA live zero has an engineering purpose. If the wire breaks the current is 0 mA, which differs from the bottom of the range, so a PLC or DCS can detect the broken wire.

## Exercises

Exercise 3.1

A coil has $L = 0.1$ H and $R = 10\ \Omega$. With voltage as input and current as output, find the transfer function in the form $\dfrac{K}{\tau s + 1}$.

Show answer

$$\frac{I(s)}{V(s)} = \frac{1}{Ls + R} = \frac{1/R}{(L/R)s + 1} = \frac{0.1}{0.01s + 1}$$

The DC gain is $1/R = 0.1$ A/V and $\tau = L/R = 10$ ms.

Exercise 3.2

An op-amp integrator with $G(s) = -\dfrac{10}{s}$ is required. With $C = 1\ \mu\text{F}$, what $R$ is needed?

Show answer

From $G(s) = -\dfrac{1}{RCs}$ we need $\dfrac{1}{RC} = 10$, so $R = \dfrac{1}{10 \times 10^{-6}} = 100\ \text{k}\Omega$.

Exercise 3.3

The motor of Example 3.3 is coupled to a load that triples the total moment of inertia. How do the gain and the time constant change?

Show answer

$K_m$ does not depend on $J$, so it stays at 18.5 rad/s per V and the final speed is unchanged. $\tau_m$ is proportional to $J$, so it rises to $3 \times 0.074 = 0.222$ s. The motor accelerates three times more slowly.

## Summary of Unit 3

- Replace $R$, $L$, $C$ by the impedances $R$, $sL$, $1/(sC)$ and analyse as a DC circuit to get the transfer function directly.

- An inverting op-amp circuit has $G(s) = -Z_2/Z_1$, which gives gains, integrators, differentiators and filters.

- Mechanical quantities map onto electrical ones: inertia pairs with inductance, friction with resistance.

- A DC motor reduces to $\dfrac{K_m}{\tau_m s + 1}$ and has built-in feedback from its back EMF.

- A sensor is represented by a gain or a first-order system.

The next unit connects these blocks into a system and reduces it to a single transfer function.
