---
title: Root Locus: Principles and Hand Sketching
description: The root locus is the path of the closed-loop poles as the gain goes from zero to infinity. The angle and magnitude conditions, six rules for sketching by hand, and a worked third-order servo example including the choice of gain for a required damping ratio.
keywords: root locus, angle condition, magnitude condition, root locus asymptotes, breakaway point, sketching root locus by hand, gain for damping ratio, imaginary axis crossing
published: 2026-11-12
updated: 2026-11-12
time: 45
outcomes:
  - Explain what the root locus is and which design question it answers
  - Test with the angle condition whether a point is on the locus, and find the gain there with the magnitude condition
  - Sketch a root locus by hand using the rules for real-axis segments, asymptotes, breakaway points and imaginary-axis crossings
  - Choose the gain from the root locus for a specified damping ratio
deeper:
  - Root locus, in-depth version (Thai) | /learn/control-systems/root-locus/
  - Steps for sketching a root locus (Thai) | /learn/control-systems/root-locus-sketching/
---

## The picture to keep in mind: turn the knob and watch the poles walk {#idea}

Suppose the controller has one gain knob. As the knob turns, the closed-loop poles move in the $s$-plane. Trace their path from zero gain to infinite gain and you have the **root locus**.

Unit 6 showed that pole positions set the overshoot and settling time. Unit 8 showed when the poles cross into the right half-plane. The root locus puts both in one picture: you see at once which gain gives which response, and if no gain gives what is wanted, you also see which way the path must be bent.

## The angle and magnitude conditions {#conditions}

Write the loop transfer function as $KL(s)$, with $K > 0$ the adjustable gain. The closed-loop poles are the roots of

$$1 + KL(s) = 0 \quad\Longleftrightarrow\quad L(s) = -\frac{1}{K}$$

The right-hand side is a negative real number, so this complex equation splits into two conditions.

| Condition | Equation | Used to |
|---|---|---|
| Angle condition | $\angle L(s) = \pm 180°(2k + 1)$ | Decide whether a point $s$ is on the locus |
| Magnitude condition | $K = \dfrac{1}{\lvert L(s)\rvert}$ | Find the gain that puts a pole at that point |

The angle of $L(s)$ at a test point is the sum of the angles of the vectors from every zero to the point, minus the sum of the angles of the vectors from every pole. The magnitude gives

$$K = \frac{\text{product of distances from the poles of } L(s) \text{ to the point}}{\text{product of distances from the zeros of } L(s) \text{ to the point}}$$

:::key The shape comes from the angle; the numbers come from the magnitude
The shape of the root locus depends only on the poles and zeros of the **open loop**, not on $K$. $K$ only says how far along the path the poles have travelled.
:::

## Rules for sketching by hand {#rules}

Let $L(s)$ have $n$ poles and $m$ zeros.

| No. | Rule |
|---|---|
| 1 | There are $n$ branches. Each starts ($K = 0$) at a pole of $L(s)$ and ends ($K \to \infty$) at a zero of $L(s)$ or at infinity. The plot is symmetric about the real axis. |
| 2 | A point on the real axis is on the locus when the number of real-axis poles and zeros to its **right** is odd. |
| 3 | $n - m$ branches go to infinity along asymptotes that leave the centroid $\sigma_a = \dfrac{\sum \text{poles} - \sum \text{zeros}}{n - m}$ at angles $\theta_a = \dfrac{(2k + 1)180°}{n - m}$. |
| 4 | Breakaway and break-in points on the real axis come from $\dfrac{dK}{ds} = 0$ with $K = -\dfrac{1}{L(s)}$. |
| 5 | Imaginary-axis crossings come from the Routh array (Unit 8). |
| 6 | The angle of departure from a complex pole comes from the angle condition at a point close to that pole. |

:::example Example 9.1 Sketching the root locus of a third-order servo
Sketch the root locus of $KL(s) = \dfrac{K}{s(s + 1)(s + 5)}$ (the system of Example 8.1).

**Rule 1.** Poles at $0, -1, -5$ and no zeros: 3 branches, all going to infinity.

**Rule 2.** Real-axis segments: between $0$ and $-1$ (1 pole to the right) and left of $-5$ (3 poles to the right).

**Rule 3.** Three asymptotes.

$$\sigma_a = \frac{0 + (-1) + (-5)}{3} = -2, \qquad \theta_a = 60°,\ 180°,\ 300°$$

**Rule 4.** Breakaway point: $K = -(s^3 + 6s^2 + 5s)$

$$\frac{dK}{ds} = -(3s^2 + 12s + 5) = 0 \quad\Longrightarrow\quad s = -0.472,\ -3.53$$

$-3.53$ is not on the locus (by Rule 2), so the breakaway point is $s = -0.472$. The gain there is the product of the distances from the three poles: $K = (0.472)(0.528)(4.528) = 1.13$.

**Rule 5.** From Example 8.1 the locus crosses the imaginary axis at $s = \pm j2.24$ when $K = 30$.
:::

![Root locus of K/(s(s+1)(s+5)): two branches leave the poles at 0 and −1, meet at the breakaway point −0.472 (K = 1.13), then curve up and down along the 60 degree asymptotes and cross the imaginary axis at ±j2.24 when K = 30; the third branch leaves the pole at −5 to the left along the real axis](/images/courses/control-engineering/root-locus.svg)

The whole behaviour of the system can be read from the picture.

| Gain range | Dominant poles | Step response |
|---|---|---|
| $0 < K < 1.13$ | Two negative real | No overshoot, slow |
| $K = 1.13$ | Repeated real at $-0.472$ | Critically damped |
| $1.13 < K < 30$ | Complex | Overshoot; more ringing as $K$ rises |
| $K = 30$ | On the imaginary axis | Oscillates for ever |
| $K > 30$ | Right half-plane | Unstable |

## Choosing the gain from the root locus {#gain}

:::example Example 9.2 The gain for ζ = 0.5
For the system of Example 9.1 find $K$ so that the dominant poles have $\zeta = 0.5$.

**Step 1.** The line $\zeta = 0.5$ makes an angle $\cos^{-1}0.5 = 60°$ with the negative real axis. A point on it is $s = -a + j\sqrt{3}\,a$.

**Step 2.** Substitute in $s^3 + 6s^2 + 5s + K = 0$ using $s^2 = -2a^2 - j2\sqrt{3}\,a^2$ and $s^3 = 8a^3$, and take the imaginary part.

$$-12\sqrt{3}\,a^2 + 5\sqrt{3}\,a = 0 \quad\Longrightarrow\quad a = \frac{5}{12} = 0.417$$

The dominant poles are $s = -0.417 \pm j0.722$, with $\omega_n = 2a = 0.833$ rad/s.

**Step 3.** Real part: $8a^3 - 12a^2 - 5a + K = 0$

$$K = 5(0.417) + 12(0.417)^2 - 8(0.417)^3 = 2.083 + 2.083 - 0.579 = 3.59$$

**Step 4.** Check the third pole: the roots sum to $-6$, so $s_3 = -6 + 2(0.417) = -5.17$, more than 12 times further out than the dominant poles. The second-order approximation is good: expect about 16 % overshoot and $t_s \approx 4/0.417 = 9.6$ s.
:::

The result exposes a limit: at $\zeta = 0.5$ the system takes almost 10 seconds to settle. Raising the gain to speed it up walks the poles towards the imaginary axis and increases the ringing. This locus does not pass through the region that is both fast and well damped, so **the shape of the locus must be changed** with a compensator, the subject of the next unit.

:::note Compare with tuning a drive
Raise the speed-loop gain of a servo drive step by step and the machine first responds faster, then begins to vibrate and finally howls. That sequence is a walk along the root locus from the breakaway point to the imaginary axis. The frequency of the howl is $\omega$ at the crossing.
:::

## Exercises {#exercises}

:::exercise Exercise 9.1
For $KL(s) = \dfrac{K}{s(s + 2)(s + 4)}$ find the asymptotes, the breakaway point and the imaginary-axis crossing.

:::answer Show answer
$\sigma_a = \dfrac{0 - 2 - 4}{3} = -2$, angles $60°, 180°, 300°$

Breakaway: $3s^2 + 12s + 8 = 0$ gives $s = -0.845$ and $-3.15$. The one on the locus (between 0 and −2) is $s = -0.845$.

Imaginary-axis crossing (from Exercise 8.2): $s = \pm j2.83$ at $K = 48$
:::
:::

:::exercise Exercise 9.2
Is the point $s = -1 + j1$ on the root locus of $KL(s) = \dfrac{K}{s(s + 2)}$? If so, find $K$.

:::answer Show answer
Angle from the pole at 0: $135°$. Angle from the pole at $-2$: $45°$. So $\angle L(s) = -(135° + 45°) = -180°$: the angle condition holds and the point is on the locus.

$K = \lvert s\rvert\,\lvert s + 2\rvert = (\sqrt2)(\sqrt2) = 2$. Check: $s^2 + 2s + 2 = 0$ has roots $-1 \pm j1$.
:::
:::

:::exercise Exercise 9.3
If a zero at $s = -2$ is added to the system of Example 9.1, how do the asymptotes change and what is the effect on stability?

:::answer Show answer
Now $n - m = 2$, so there are 2 asymptotes at $\pm 90°$ from $\sigma_a = \dfrac{(0 - 1 - 5) - (-2)}{2} = -2$.

The asymptotes are the vertical line $s = -2$, in the left half-plane, so the branches never cross to the right. The system is stable for every $K > 0$. A zero pulls the locus to the left, which is the principle of the lead compensator of Unit 10.
:::
:::

## Summary of Unit 9 {#summary}

- The root locus is the path of the closed-loop poles as $K$ goes from 0 to $\infty$.
- A point is on the locus when $\angle L(s) = \pm 180°(2k + 1)$, and the gain there is $1/\lvert L(s)\rvert$.
- Branches start at open-loop poles and end at zeros or at infinity along asymptotes.
- An added pole pushes the locus to the right; an added zero pulls it to the left.
