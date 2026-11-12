---
title: "Frequency Response and Bode Plots"
url: https://modsengineeringmath.com/en/courses/control-engineering/bode-plots/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> What frequency response is, finding magnitude and phase from G(jω), decibels, drawing Bode plots from the asymptotes of basic factors, bandwidth, and examples of an RC filter, an op-amp circuit and a converter LC filter.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/bode-plots/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Frequency Response and Bode Plots

// Unit 11 · Control Engineering


What frequency response is, finding magnitude and phase from G(jω), decibels, drawing Bode plots from the asymptotes of basic factors, bandwidth, and examples of an RC filter, an op-amp circuit and a converter LC filter.

## What you can do after this unit

- Explain what frequency response is and how it is measured on a real system
- Calculate the magnitude and phase of G(jω) at a given frequency
- Draw a Bode plot from the asymptotes of the basic factors
- Read DC gain, corner frequencies, bandwidth and resonant peak from a Bode plot

## The picture to keep in mind: electrical students already do this

In AC circuit analysis we apply a sinusoidal voltage and find the output with phasors. The answer is a sinusoid of the same frequency with a changed magnitude and a shifted phase. That is the frequency response at one frequency. This unit simply repeats it at every frequency and plots the result.

Why every frequency matters: any real signal can be written as a sum of sinusoids of many frequencies (Fourier series). A fast-changing signal has high-frequency components, and most noise is at high frequency. A system that passes only low frequencies therefore responds slowly but filters noise well. One plot tells both stories.

## Definition

Apply $u(t) = A\sin\omega t$ to a stable linear system and wait for steady state. The output is

$$y(t) = A\,\lvert G(j\omega)\rvert\,\sin\bigl(\omega t + \angle G(j\omega)\bigr)$$

The magnitude and phase come from substituting $s = j\omega$ in the transfer function, just as $sL$ becomes $j\omega L$ in a circuit.

Example 11.1 An RC filter at its corner frequency

An RC filter has $G(s) = \dfrac{1}{\tau s + 1}$. Find the magnitude and phase at $\omega = 1/\tau$.

$$G(j\omega) = \frac{1}{1 + j\omega\tau}, \qquad \lvert G\rvert = \frac{1}{\sqrt{1 + (\omega\tau)^2}}, \qquad \angle G = -\tan^{-1}(\omega\tau)$$

At $\omega\tau = 1$: $\lvert G\rvert = \dfrac{1}{\sqrt2} = 0.707$ and $\angle G = -45°$

The output is 70.7 % of the input and the power is halved, hence the names half-power point and −3 dB point.

## Decibels and the logarithmic axis

A Bode plot is two graphs sharing a logarithmic frequency axis.

- Magnitude plot: $20\log_{10}\lvert G(j\omega)\rvert$ in decibels (dB)

- Phase plot: $\angle G(j\omega)$ in degrees

|
Magnitude ratio |
0.01 |
0.1 |
0.707 |
1 |
2 |
10 |
100 |

|
dB |
−40 |
−20 |
−3 |
0 |
6 |
20 |
40 |

Why logarithms

Logarithms turn multiplication into addition. A transfer function is a product of factors, so the dB magnitude plot of the whole system is the sum of the plots of its factors, and the phase plot is already a sum. Drawing a Bode plot means drawing simple pieces and adding them.

A tenfold range of frequency is a decade, so the slope of the magnitude plot is in dB/decade.

## Basic factors

|
Factor |
Magnitude plot (asymptotes) |
Phase plot |

|
Gain $K$ |
Horizontal line at $20\log K$ |
$0°$ |

|
Integrator $\dfrac{1}{s}$ |
Straight line of slope −20 dB/dec through 0 dB at $\omega = 1$ |
Constant $-90°$ |

|
Differentiator $s$ |
Straight line of slope +20 dB/dec through 0 dB at $\omega = 1$ |
Constant $+90°$ |

|
Real pole $\dfrac{1}{s/\omega_c + 1}$ |
0 dB up to $\omega_c$, then −20 dB/dec |
From $0°$ to $-90°$, through $-45°$ at $\omega_c$ |

|
Real zero $s/\omega_c + 1$ |
0 dB up to $\omega_c$, then +20 dB/dec |
From $0°$ to $+90°$, through $+45°$ at $\omega_c$ |

|
Complex poles $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_ns + \omega_n^2}$ |
0 dB up to $\omega_n$, then −40 dB/dec, with a resonant peak when $\zeta < 0.707$ |
From $0°$ to $-180°$, through $-90°$ at $\omega_n$ |

$\omega_c$ is the corner frequency. For a real pole the true curve is 3 dB below the asymptotes at $\omega_c$, and almost all of the phase change happens between $0.1\omega_c$ and $10\omega_c$.

## Drawing procedure

- Write every factor in the form $(s/\omega_c + 1)$ to separate out the DC gain.

- List the corner frequencies in increasing order.

- Start the magnitude plot at low frequency with the DC gain (or with a slope of −20 dB/dec per integrator).

- At each corner frequency change the slope: −20 dB/dec for a pole, +20 dB/dec for a zero.

- Draw the phase plot by adding the phase of each factor.

Example 11.2 Bode plot of a two-pole system

Draw the Bode plot of $G(s) = \dfrac{100}{(s + 1)(s + 10)}$.

Step 1. Rearrange.

$$G(s) = \frac{10}{(s + 1)(s/10 + 1)}$$

The DC gain is 10, or 20 dB. The corner frequencies are 1 and 10 rad/s.

Step 2. Asymptotes of the magnitude plot.

|
Frequency range |
Slope |
Value at the end of the range |

|
$\omega < 1$ |
0 dB/dec |
20 dB |

|
$1 < \omega < 10$ |
−20 dB/dec |
0 dB at $\omega = 10$ |

|
$\omega > 10$ |
−40 dB/dec |
−40 dB at $\omega = 100$ |

Step 3. Check the true value at $\omega = 10$.

$$\lvert G(j10)\rvert = \frac{100}{\sqrt{1 + 100}\,\sqrt{100 + 100}} = \frac{100}{(10.05)(14.14)} = 0.704 \;\Rightarrow\; -3.05\ \text{dB}$$

This is 3 dB below the asymptote (0 dB), as expected at the corner frequency of a real pole.

Step 4. Phase: $\angle G = -\tan^{-1}\omega - \tan^{-1}(\omega/10)$

|
$\omega$ (rad/s) |
0.1 |
1 |
3.16 |
10 |
100 |

|
Phase |
$-6.3°$ |
$-50.7°$ |
$-90.0°$ |
$-129.3°$ |
$-173.7°$ |

## Reading a Bode plot

|
What you can read |
Where |
Meaning in the time domain |

|
DC gain |
Level of the magnitude plot at low frequency |
Final value of the step response |

|
Low-frequency slope |
0, −20, −40 dB/dec |
System type 0, 1, 2 (Unit 7) |

|
Bandwidth $\omega_{BW}$ |
Frequency where the magnitude is 3 dB below its DC value |
Speed: $t_r \approx 2.2/\omega_{BW}$ for a first-order system |

|
Resonant peak $M_r$ |
Height of the peak above the DC level |
Overshoot: a high peak means low $\zeta$ |

|
High-frequency slope |
−20 dB/dec per excess pole |
Ability to filter noise |

For a second-order system the resonant peak is $M_r = \dfrac{1}{2\zeta\sqrt{1 - \zeta^2}}$, at $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$.

Example 11.3 Resonant peak of an LC filter

The buck converter LC filter of Example 6.2 has $\omega_n = 10^4$ rad/s and $\zeta = 0.1$. Find the resonant peak.

$$M_r = \frac{1}{2(0.1)\sqrt{1 - 0.01}} = 5.03 \;\Rightarrow\; 20\log 5.03 = 14.0\ \text{dB}$$

Near 1.59 kHz the filter amplifies by 5 instead of attenuating, and the phase falls quickly from $0°$ to $-180°$ around that frequency. The voltage loop has to cope with this lost phase, which is why a compensator with two zeros is used.

Measuring frequency response on real hardware

A major strength of frequency methods is that the response can be measured without a model. Apply a sine wave from a signal generator, measure the magnitude ratio and phase with an oscilloscope at several frequencies, and plot. A frequency response analyser (FRA) automates this. Power electronics engineers measure power supply loops this way as routine, and from the slopes and corner frequencies of the measured plot a transfer function can be estimated.

## Exercises

Exercise 11.1

An RC anti-aliasing filter in front of an ADC uses $R = 1.6\ \text{k}\Omega$ and $C = 0.1\ \mu\text{F}$. Find the corner frequency in Hz and the attenuation at 10 kHz.

Show answer

$\omega_c = \dfrac{1}{RC} = \dfrac{1}{1.6 \times 10^{-4}} = 6{,}250$ rad/s, or $f_c = \omega_c/(2\pi) = 995$ Hz

At 10 kHz: $f/f_c = 10.05$, so $\lvert G\rvert = \dfrac{1}{\sqrt{1 + 10.05^2}} = 0.099$, or $-20.1$ dB (the asymptote gives −20 dB).

Exercise 11.2

Find the low-frequency gain, the corner frequencies and the slope in each range for $G(s) = \dfrac{50(s + 2)}{s(s + 10)}$.

Show answer

Rearranged: $G(s) = \dfrac{10(s/2 + 1)}{s(s/10 + 1)}$

There is an integrator, so the plot starts with a slope of −20 dB/dec, and the first asymptote passes through $20\log 10 = 20$ dB at $\omega = 1$. At $\omega = 2$ (zero) the slope becomes 0 dB/dec, at the level $20 - 20\log 2 = 14$ dB. At $\omega = 10$ (pole) the slope returns to −20 dB/dec.

Exercise 11.3

A second-order system has $\zeta = 0.5$ and $\omega_n = 1000$ rad/s (the RLC circuit of Example 6.1). Find $M_r$ and $\omega_r$.

Show answer

$M_r = \dfrac{1}{2(0.5)\sqrt{0.75}} = 1.155$, or 1.25 dB

$\omega_r = 1000\sqrt{1 - 0.5} = 707$ rad/s. The peak is very low, consistent with an overshoot of only 16 %.

## Summary of Unit 11

- Frequency response is the magnitude and phase of $G(j\omega)$: how much each sinusoid is amplified and shifted.

- A Bode plot uses dB and a logarithmic frequency axis, so the plot of a system is the sum of the plots of its factors.

- A real pole breaks the slope down by 20 dB/dec and adds up to 90° of lag; a real zero does the opposite.

- Bandwidth indicates speed, the resonant peak indicates damping, and the low-frequency slope gives the system type.

The next unit uses the open-loop Bode plot to decide closed-loop stability and to measure the distance from the stability limit.
