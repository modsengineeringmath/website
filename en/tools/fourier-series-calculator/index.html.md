---
title: "Fourier Series Calculator: Find a₀, aₙ, bₙ and Watch the Partial Sums Converge"
url: https://modsengineeringmath.com/en/tools/fourier-series-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Find the Fourier series coefficients a0, an, bn of a periodic piecewise function online, free. Ready-made square, sawtooth, triangle, rectified-sine and pulse waves; closed forms such as 4/π; a harmonic table, RMS, THD, and a graph with a slider for the number of harmonics.

Markdown copy of https://modsengineeringmath.com/en/tools/fourier-series-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Fourier Series Calculator: Find a₀, aₙ, bₙ and Watch the Partial Sums Converge

THภาษาไทยENEnglish
// Tool · Fourier Series Calculator


Define one period piece by piece, or pick a ready-made waveform, and get $a_0$, $a_n$, $b_n$ in closed form (for example $\frac{4}{\pi}$) with a harmonic table, RMS, THD, and a graph of $f(t)$ against the partial sum with a slider for the number of terms.

## Calculator

This calculator needs JavaScript.

## How to use it

- Pick a ready-made waveform, or type $f(t)$ piece by piece. For example piece 1: 1 from 0 to pi; piece 2: -1 from pi to 2*pi.

- Enter the period $T$, equal to the total length of the pieces. pi is accepted, e.g. 2*pi.

- Choose the number of harmonics $N$ and calculate. Then drag the slider under the graph to see the partial sum approach $f(t)$.

## The coefficient formulas

A periodic function $f(t)$ with period $T$ and fundamental angular frequency $\omega_0 = \dfrac{2\pi}{T}$ has the Fourier series

$$f(t) = a_0 + \sum_{n=1}^{\infty}\left(a_n\cos n\omega_0 t + b_n\sin n\omega_0 t\right)$$

$$a_0 = \frac{1}{T}\int_{T} f(t)\,dt, \qquad a_n = \frac{2}{T}\int_{T} f(t)\cos n\omega_0 t\,dt, \qquad b_n = \frac{2}{T}\int_{T} f(t)\sin n\omega_0 t\,dt$$

Here $a_0$ is the mean value itself. Some textbooks write $\dfrac{a_0}{2}$ instead, which makes their $a_0$ twice the value shown on this page.

## Symmetry saves work

| Symmetry | Condition | Consequence |

| Even | $f(-t) = f(t)$ | $b_n = 0$: cosine terms only |

| Odd | $f(-t) = -f(t)$ | $a_0 = a_n = 0$: sine terms only |

| Half-wave | $f(t + T/2) = -f(t)$ | odd harmonics only |

The calculator detects symmetry from the computed coefficients and reports it, a quick way to check a hand calculation.

## Example: the square wave

The square wave $f(t) = 1$ for $0 \le t The THD of a square wave is 48.34 %, which is what the calculator reports. The overshoot near each jump, about 9 % of the jump, is the Gibbs phenomenon; it does not disappear as harmonics are added.

## Learn the theory

- Laplace transform calculator

- Integral calculator

- Fourier series lessons, 14 pages (in Thai)

- Harmonic analyzer lab (in Thai)

## Frequently asked questions

Is a₀ here the same as in my textbook?
Here a₀ is the mean value (1/T)∫f(t)dt. A textbook that starts the series with a₀/2 has an a₀ twice as large. The sum of the series is the same either way.

How does it produce closed forms such as 4/π?
Coefficients are computed by high-accuracy numerical integration and then compared with simple fractions times π, 1/π, 1/π² and common roots. A closed form is shown only when it matches to nine decimal places; otherwise a decimal is shown.

What is THD?
Total harmonic distortion: the RMS of all harmonics from the second upward divided by the RMS of the fundamental. It measures how far a waveform is from a sine.

Can I use u(t) inside a piece?
Yes, but splitting the period at each discontinuity is more accurate, because numerical integration works best when the function is smooth inside each piece.

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Inverse Laplace transform calculator
Derivative calculator
Integral calculator
Area calculator
Power factor calculator
Thailand electricity bill calculator
All tools →

## Frequently asked questions

**Is a₀ here the same as in my textbook?**
Here a₀ is the mean value (1/T)∫f(t)dt. A textbook that starts the series with a₀/2 has an a₀ twice as large. The sum of the series is the same either way.

**How does it produce closed forms such as 4/π?**
Coefficients are computed by high-accuracy numerical integration and then compared with simple fractions times π, 1/π, 1/π² and common roots. A closed form is shown only when it matches to nine decimal places; otherwise a decimal is shown.

**What is THD?**
Total harmonic distortion: the RMS of all harmonics from the second upward divided by the RMS of the fundamental. It measures how far a waveform is from a sine.

**Can I use u(t) inside a piece?**
Yes, but splitting the period at each discontinuity is more accurate, because numerical integration works best when the function is smooth inside each piece.
