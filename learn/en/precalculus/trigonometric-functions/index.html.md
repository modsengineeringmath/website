---
title: "Trigonometric Functions: the Unit Circle, Radians, Reference Angles, Graphs of Sine, Cosine and Tangent, and the Basic Identities"
url: https://modsengineeringmath.com/learn/en/precalculus/trigonometric-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Trigonometric functions for precalculus: degrees and radians, arc length and sector area, a draggable unit circle, reference angles and the ASTC sign rule, exact values of special angles, graphs of y = A sin(B(x − C)) + D with amplitude, period, phase shift and midline, the graphs of tan, cot, sec and csc, the Pythagorean identities and inverse trigonometric functions, with a sinusoid lab.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/trigonometric-functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Trigonometric Functions: the Unit Circle, Radians, Reference Angles, Graphs of Sine, Cosine and Tangent, and the Basic Identities

THภาษาไทยENEnglish

// Chapter 27.9 · Precalculus · Trigonometric Functions


Trigonometry starts with right triangles, but a right triangle only has angles from 0° to 90°. To handle angles of every size, including negative angles and angles of more than a full turn, the definitions move onto the unit circle, and sine and cosine become periodic functions of a real number. These functions are the language of anything that repeats, from 50 Hz or 60 Hz mains electricity to sound waves and the temperature over a day. This page uses a draggable unit circle to explain the definitions, reference angles and signs, and then moves on to sinusoids whose amplitude, period and phase you can adjust.

In 30 seconds

- $180^\circ = \pi$ rad · arc $s = r\theta$ · sector area $\tfrac12 r^2\theta$

- Point on the unit circle $P(\theta) = (\cos\theta, \sin\theta)$ · $\tan\theta = \sin\theta/\cos\theta$

- Value at any angle = value at the reference angle, with the sign from ASTC

- $y = A\sin\big(B(x - C)\big) + D$: amplitude $|A|$, period $2\pi/B$, phase C, midline D

- $\sin^2\theta + \cos^2\theta = 1$ · sin is odd, cos is even · period of sin, cos = 2π, tan = π

## Angles, degrees and radians

An angle in standard position starts on the positive x-axis; turning counterclockwise gives a positive angle and clockwise a negative one. Angles that differ by a whole number of turns are called coterminal and have the same trigonometric values. Radian measure measures an angle by the arc length it cuts on a circle of radius 1, so every conversion rests on one fact: half a turn is π radians.

T1 Degrees ⇄ radians

$$\theta_{\text{rad}} = \theta_{\text{deg}}\cdot\frac{\pi}{180},\qquad \theta_{\text{deg}} = \theta_{\text{rad}}\cdot\frac{180}{\pi}$$

1 rad ≈ 57.2958° · coterminal angles $\theta + 360^\circ k$ or $\theta + 2\pi k$

T2 Arc & sector

$$s = r\theta,\qquad A = \tfrac12 r^2\theta,\qquad v = r\omega \quad (\theta \text{ in radians})$$

Example T-1 · Converting units and arc length

### (a) Convert 150° to radians and $\tfrac{7\pi}{4}$ to degrees (b) A circle of radius 10 cm has a central angle of 150°. Find the arc length and the sector area

- (a) $150\cdot\tfrac{\pi}{180} = \tfrac{5\pi}{6}$ · $\tfrac{7\pi}{4}\cdot\tfrac{180}{\pi} = 315^\circ$

- (b) $s = 10\cdot\tfrac{5\pi}{6} = \tfrac{25\pi}{3} \approx 26.18$ cm

- $A = \tfrac12(10)^2\cdot\tfrac{5\pi}{6} = \tfrac{125\pi}{3} \approx 130.90\ \text{cm}^2$

$\tfrac{5\pi}{6}$, 315° · arc ≈ 26.18 cm · area ≈ 130.90 cm²

## The unit circle and the six functions

Place an angle θ in standard position; its terminal side meets the circle of radius 1 at a point P. The x-coordinate of P is $\cos\theta$ and the y-coordinate is $\sin\theta$. For an acute angle this agrees with the right-triangle definition, because the opposite side is the height y, the adjacent side is x and the hypotenuse is 1. Drag the point P in the lab below and watch the orange segment (cos) and the blue segment (sin) change length and sign; the dashed purple segment is $\tan\theta$, a length on the tangent line $x = 1$.

T3 Unit circle

$$P(\theta) = (\cos\theta,\ \sin\theta),\quad \tan\theta = \frac{\sin\theta}{\cos\theta},\quad \cot\theta = \frac{\cos\theta}{\sin\theta}$$

T4 Reciprocal functions

$$\csc\theta = \frac{1}{\sin\theta},\qquad \sec\theta = \frac{1}{\cos\theta},\qquad \cot\theta = \frac{1}{\tan\theta}$$

T5 Right triangle

$$\sin\theta = \frac{\text{opp}}{\text{hyp}},\quad \cos\theta = \frac{\text{adj}}{\text{hyp}},\quad \tan\theta = \frac{\text{opp}}{\text{adj}}$$

T6 Pythagorean identities

$$\sin^2\theta + \cos^2\theta = 1,\quad 1 + \tan^2\theta = \sec^2\theta,\quad 1 + \cot^2\theta = \csc^2\theta$$

JavaScript is needed for the unit circle

## Reference angles, signs and special values

The points on the unit circle at 150°, 210° and 330° are reflections of the point at 30° in the x-axis or the y-axis, so their coordinates have the same size and differ only in sign. That is the reason the reference-angle rule works. Remember the signs with ASTC: in quadrant I all functions are positive (All), in quadrant II sine is positive (Students), in quadrant III tangent (Take), and in quadrant IV cosine (Calculus). The values at 0°, 30°, 45°, 60° and 90° should come to mind instantly, and every angle is listed in the exact-value table.

T7 Reference angle

$$\theta' = \begin{cases} \theta & \text{I} \\ 180^\circ - \theta & \text{II} \\ \theta - 180^\circ & \text{III} \\ 360^\circ - \theta & \text{IV} \end{cases}\qquad \text{ASTC}$$

T8 Special angles

$$\sin 0^\circ, 30^\circ, 45^\circ, 60^\circ, 90^\circ = \frac{\sqrt0}{2}, \frac{\sqrt1}{2}, \frac{\sqrt2}{2}, \frac{\sqrt3}{2}, \frac{\sqrt4}{2}$$

cos is the same list in reverse · $\tan 30^\circ = \tfrac{\sqrt3}{3}$, $\tan 45^\circ = 1$, $\tan 60^\circ = \sqrt3$

T9 Symmetry & period

$$\sin(-\theta) = -\sin\theta,\quad \cos(-\theta) = \cos\theta,\quad \sin(\theta + 2\pi) = \sin\theta,\quad \tan(\theta + \pi) = \tan\theta$$

Example T-2 · Using reference angles

### Find $\sin 240^\circ$, $\cos\left(-\tfrac{3\pi}{4}\right)$ and $\tan\tfrac{11\pi}{6}$

- 240° is in quadrant III with reference angle 60°, where sine is negative: $-\tfrac{\sqrt3}{2}$

- $-\tfrac{3\pi}{4} = -135^\circ$ is coterminal with 225° (quadrant III), reference angle 45°, cosine negative: $-\tfrac{\sqrt2}{2}$

- $\tfrac{11\pi}{6} = 330^\circ$ is in quadrant IV, reference angle 30°, tangent negative: $-\tfrac{\sqrt3}{3}$

$-\tfrac{\sqrt3}{2},\ -\tfrac{\sqrt2}{2},\ -\tfrac{\sqrt3}{3}$

Example T-3 · One value gives the rest

### If $\sin\theta = -\tfrac35$ and θ is in quadrant III, find the other five functions

- $\cos^2\theta = 1 - \tfrac{9}{25} = \tfrac{16}{25}$; in quadrant III cosine is negative: $\cos\theta = -\tfrac45$

- $\tan\theta = \dfrac{-3/5}{-4/5} = \tfrac34$ (positive in quadrant III, as ASTC says)

- Reciprocals: $\csc\theta = -\tfrac53,\ \sec\theta = -\tfrac54,\ \cot\theta = \tfrac43$

$\cos = -\tfrac45,\ \tan = \tfrac34,\ \csc = -\tfrac53,\ \sec = -\tfrac54,\ \cot = \tfrac43$

Example T-4 · Proving an identity

### Prove $(1 - \cos^2\theta)(1 + \cot^2\theta) = 1$

- From T6: $1 - \cos^2\theta = \sin^2\theta$ and $1 + \cot^2\theta = \csc^2\theta$

- $\sin^2\theta\cdot\csc^2\theta = \sin^2\theta\cdot\dfrac{1}{\sin^2\theta} = 1$

True for every θ with $\sin\theta \ne 0$

## Graphs of sine and cosine: amplitude, period, phase and midline

As P travels round the circle, sine rises from 0 to 1, falls to −1 and returns to 0 every 2π radians, so the graph of $y = \sin x$ is a repeating wave. The graph of $y = \cos x$ has the same shape shifted π/2 to the left, because $\cos x = \sin\left(x + \tfrac{\pi}{2}\right)$. The four numbers A, B, C and D in the general form are the graph transformations from page 27.3, given special names in the study of waves. In electrical engineering the same idea is written $v(t) = V_m\sin(\omega t + \varphi)$ with $\omega = 2\pi f$.

T10 Sinusoid

$$y = A\sin\big(B(x - C)\big) + D:\quad \text{amplitude } |A|,\ \ \text{period } \frac{2\pi}{B},\ \ \text{phase shift } C,\ \ \text{midline } y = D$$

Maximum $D + |A|$, minimum $D - |A|$ · frequency $f = \tfrac{B}{2\pi}$

T11 Tangent graph

$$y = \tan x:\ \text{period } \pi,\ \ \text{VA } x = \tfrac{\pi}{2} + k\pi,\ \ R = \mathbb R$$

sec and csc have asymptotes where cos and sin are zero, and range $(-\infty, -1] \cup [1, \infty)$

Example T-5 · Reading the equation

### Find the amplitude, period, phase shift, maximum and minimum of $y = 3\sin\left(2x - \tfrac{\pi}{3}\right) + 1$

- Factor out the 2: $2x - \tfrac{\pi}{3} = 2\left(x - \tfrac{\pi}{6}\right)$

- $A = 3,\ B = 2,\ C = \tfrac{\pi}{6},\ D = 1$; period $\tfrac{2\pi}{2} = \pi$

- Maximum $1 + 3 = 4$, minimum $1 - 3 = -2$

Amplitude 3 · period π · shift right $\tfrac{\pi}{6}$ · range $[-2, 4]$

Example T-6 · Modeling data

### One day the temperature peaks at 34 °C at 14:00 and bottoms out at 24 °C at 02:00. Write a sinusoidal model for the temperature T at time t (hours)

- Amplitude $\tfrac{34 - 24}{2} = 5$, midline $\tfrac{34 + 24}{2} = 29$, period 24 hours ⇒ $B = \tfrac{2\pi}{24} = \tfrac{\pi}{12}$

- Use cosine, which starts at its maximum, and shift the maximum to t = 14

$T(t) = 5\cos\left(\tfrac{\pi}{12}(t - 14)\right) + 29$ (check: t = 2 gives $5\cos(-\pi) + 29 = 24$)

Example T-7 · Mains voltage

### Household mains in Thailand is 220 V (RMS) at 50 Hz. Write the voltage as a sinusoid and find its period

- Peak value $V_m = 220\sqrt2 \approx 311$ V · $\omega = 2\pi(50) = 100\pi$ rad/s

- Period $T = \tfrac{1}{f} = 0.02$ s

$v(t) \approx 311\sin(100\pi t)$ V with period 20 ms (for 120 V, 60 Hz mains: $\approx 170\sin(120\pi t)$, period ≈ 16.7 ms)

JavaScript is needed for the lab

## Inverse trigonometric functions

For sin, cos and tan to have inverses, their domains must first be restricted so that they are one-to-one (see page 27.6). The standard intervals are the ones that cover the whole range and sit closest to zero, and the values returned by arcsin, arccos and arctan are called principal values. On a calculator they are the sin⁻¹, cos⁻¹ and tan⁻¹ keys.

T12 Inverse trig

$$\arcsin x \in \left[-\tfrac{\pi}{2}, \tfrac{\pi}{2}\right],\quad \arccos x \in [0, \pi],\quad \arctan x \in \left(-\tfrac{\pi}{2}, \tfrac{\pi}{2}\right)$$

The domain of arcsin and arccos is $[-1, 1]$ · arctan accepts every real number

Example T-8 · Principal values

### Find $\arcsin\left(-\tfrac12\right)$, $\arccos\left(-\tfrac12\right)$ and $\sin\left(\arccos\tfrac35\right)$

- arcsin must lie in $[-\tfrac\pi2, \tfrac\pi2]$: the angle with sine −½ is $-\tfrac{\pi}{6}$

- arccos must lie in $[0, \pi]$: the angle with cosine −½ is $\tfrac{2\pi}{3}$

- Let $\theta = \arccos\tfrac35$, in quadrant I: $\sin\theta = \sqrt{1 - \tfrac{9}{25}} = \tfrac45$

$-\tfrac{\pi}{6},\ \tfrac{2\pi}{3},\ \tfrac45$

Common trapsCalculator in degree mode while entering radians (or the other way round) · reading the period of $\sin 2x$ as 4π instead of π · using $\tfrac{\pi}{3}$ as the phase shift of $\sin(2x - \tfrac{\pi}{3})$ without factoring out the 2 · and thinking $\sin^{-1}x = \tfrac{1}{\sin x}$.

## Practice (with answers)

1Convert 225° and −60° to radians
Multiply by π/180
$\tfrac{5\pi}{4}$ and $-\tfrac{\pi}{3}$

2$\cos 300^\circ + \sin 150^\circ$
$\tfrac12 + \tfrac12$
1

3$\tan\theta = -2$ and $\cos\theta > 0$. Find $\sin\theta$
Quadrant IV · $\sec^2\theta = 1 + 4 = 5 \Rightarrow \cos\theta = \tfrac{1}{\sqrt5}$ · $\sin\theta = \tan\theta\cos\theta$
$-\tfrac{2}{\sqrt5} = -\tfrac{2\sqrt5}{5}$

4Period and amplitude of $y = -4\cos\tfrac{x}{3}$
$B = \tfrac13$, period $2\pi/(1/3)$
Period $6\pi$, amplitude 4

5A wheel of radius 0.3 m turns at 600 rpm. What is the speed at its rim?
$\omega = 600\cdot2\pi/60 = 20\pi$ rad/s · $v = r\omega$
$6\pi \approx 18.85$ m/s

6$\arctan(-\sqrt3)$
The principal value lies in $(-\tfrac\pi2, \tfrac\pi2)$
$-\tfrac{\pi}{3}$

## Read next

- 27.10 Applications of trigonometry — the laws of sines and cosines and trigonometric equations

- 27.11 Trigonometric table 0°–360° — all six functions for every degree, and finding an angle from a value

- Power factor explained — phase angles between voltage and current sinusoids

## Frequently asked questions

What is a radian and why use it?
An angle of 1 radian is the angle whose arc length equals the radius. A full circle has circumference 2πr, so it measures 2π radians, or 360°. Radians make formulas clean: arc length is s = rθ, and d/dx sin x = cos x holds only when x is in radians, which is why calculus always uses them.

What is a reference angle?
The reference angle is the acute angle between the terminal side and the x-axis. The trigonometric values of any angle have the same size as those of its reference angle and differ only in sign, which you read from the quadrant with the ASTC rule. For example, sin 240° has reference angle 60° in quadrant III, where sine is negative, so it equals −√3/2.

How do I read amplitude, period and phase shift from an equation?
Write it as y = A sin(B(x − C)) + D. The amplitude is |A|, the period is 2π/B, the phase shift is C (positive means to the right) and the midline is y = D. Watch out for sin(2x − π/3): factor out the 2 first to get sin(2(x − π/6)), so the phase shift is π/6, not π/3.

Why does arcsin only give answers from −90° to 90°?
Because sin x is not one-to-one on all real numbers, its domain has to be restricted to [−π/2, π/2] before it can be inverted, so arcsin returns a single principal value. To find every angle with the same sine, use the general solution θ = α + 2kπ or θ = π − α + 2kπ.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is a radian and why use it?**
An angle of 1 radian is the angle whose arc length equals the radius. A full circle has circumference 2πr, so it measures 2π radians, or 360°. Radians make formulas clean: arc length is s = rθ, and d/dx sin x = cos x holds only when x is in radians, which is why calculus always uses them.

**What is a reference angle?**
The reference angle is the acute angle between the terminal side and the x-axis. The trigonometric values of any angle have the same size as those of its reference angle and differ only in sign, which you read from the quadrant with the ASTC rule. For example, sin 240° has reference angle 60° in quadrant III, where sine is negative, so it equals −√3/2.

**How do I read amplitude, period and phase shift from an equation?**
Write it as y = A sin(B(x − C)) + D. The amplitude is |A|, the period is 2π/B, the phase shift is C (positive means to the right) and the midline is y = D. Watch out for sin(2x − π/3): factor out the 2 first to get sin(2(x − π/6)), so the phase shift is π/6, not π/3.

**Why does arcsin only give answers from −90° to 90°?**
Because sin x is not one-to-one on all real numbers, its domain has to be restricted to [−π/2, π/2] before it can be inverted, so arcsin returns a single principal value. To find every angle with the same sine, use the general solution θ = α + 2kπ or θ = π − α + 2kπ.
