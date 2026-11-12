---
title: Stability and the Routh–Hurwitz Criterion
description: The definition of BIBO stability, its link to pole locations in the s-plane, how to build the Routh array, the special cases, and finding the range of gain for stability, with examples of a servo and a generator AVR loop.
keywords: stability control systems, Routh-Hurwitz criterion, Routh array, BIBO stability, characteristic equation, range of gain for stability, ultimate gain, AVR loop stability
published: 2026-11-12
updated: 2026-11-12
time: 40
outcomes:
  - Decide from the poles whether a system is stable
  - Build the Routh array and count the poles in the right half of the s-plane
  - Find the range of gain for closed-loop stability and the oscillation frequency at the stability limit
  - Handle the special cases of a zero in the first column and a row of zeros
deeper:
  - Stability, in-depth version (Thai) | /learn/control-systems/stability/
  - The Routh–Hurwitz criterion, in-depth version (Thai) | /learn/control-systems/routh-hurwitz/
---

## The picture to keep in mind: a howling microphone {#idea}

Hold a microphone near a loudspeaker. Sound from the speaker enters the microphone, is amplified and comes out again, round and round until it howls. Turn the volume down and the howl stops. Same loop, same equipment; the only difference is the **gain**.

Every feedback control system carries this risk. Unit 7 showed that high gain gives small error. This unit finds the limit on that gain.

## Definition and condition {#definition}

A system is **BIBO stable** (bounded-input bounded-output) when every bounded input gives a bounded output. For a linear time-invariant system this is equivalent to

:::key The condition for stability
A system is stable if and only if **every pole lies in the left half of the $s$-plane**, that is, has a negative real part.
:::

The reason comes from Unit 2: a pole at $s = \sigma + j\omega$ puts a term $e^{\sigma t}$ in the response.

| Pole location | Term in the response | Status |
|---|---|---|
| Left half ($\sigma < 0$) | Decays | Stable |
| On the imaginary axis, not repeated ($\sigma = 0$) | Constant, or oscillation of constant size | Marginally stable |
| Right half ($\sigma > 0$), or repeated on the imaginary axis | Grows without bound | Unstable |

The closed-loop poles are the roots of the **characteristic equation** $1 + L(s) = 0$. The difficulty is that above second order the roots are hard to find by hand. The Routh–Hurwitz criterion gives the number of roots in the right half **without finding the roots**.

## A necessary condition {#necessary}

Let the characteristic equation be

$$a_ns^n + a_{n-1}s^{n-1} + \cdots + a_1s + a_0 = 0, \qquad a_n > 0$$

If any coefficient is zero or negative the system is unstable (or at best marginally stable), and no array is needed. If all coefficients are positive, stability is still not settled and the Routh array must be built, except for first and second order, where positive coefficients are enough.

## The Routh array {#array}

Write the coefficients alternately in the first two rows, then compute each following row.

| | | | |
|---|---|---|---|
| $s^n$ | $a_n$ | $a_{n-2}$ | $a_{n-4}$ |
| $s^{n-1}$ | $a_{n-1}$ | $a_{n-3}$ | $a_{n-5}$ |
| $s^{n-2}$ | $b_1$ | $b_2$ | |
| $s^{n-3}$ | $c_1$ | | |

$$b_1 = \frac{a_{n-1}a_{n-2} - a_na_{n-3}}{a_{n-1}}, \qquad b_2 = \frac{a_{n-1}a_{n-4} - a_na_{n-5}}{a_{n-1}}, \qquad c_1 = \frac{b_1a_{n-3} - a_{n-1}b_2}{b_1}$$

The pattern: cross-multiply the two rows above (lower left times upper right, minus upper left times lower right) and divide by the leftmost entry of the row just above.

:::key The Routh–Hurwitz criterion
The number of roots in the right half of the $s$-plane equals **the number of sign changes in the first column**. The system is stable if and only if the whole first column is positive.
:::

:::example Example 8.1 A third-order servo: the range of gain
A position servo that includes both mechanical and electrical time constants has $L(s) = \dfrac{K}{s(s + 1)(s + 5)}$ with unity feedback. Find the range of $K$ for stability.

**Step 1.** Characteristic equation $s(s + 1)(s + 5) + K = 0$

$$s^3 + 6s^2 + 5s + K = 0$$

**Step 2.** Routh array.

| | | |
|---|---|---|
| $s^3$ | 1 | 5 |
| $s^2$ | 6 | $K$ |
| $s^1$ | $\dfrac{30 - K}{6}$ | |
| $s^0$ | $K$ | |

**Step 3.** The first column must be positive: $30 - K > 0$ and $K > 0$.

$$0 < K < 30$$

**Step 4.** At $K = 30$ the $s^1$ row is all zero. The row above gives the auxiliary equation $6s^2 + 30 = 0$, so $s = \pm j\sqrt{5} = \pm j2.24$. The system oscillates at constant amplitude at 2.24 rad/s, with period $2\pi/2.24 = 2.81$ s.

$K = 30$ is the **ultimate gain** and 2.81 s is the ultimate period. Both return in Unit 13 for Ziegler–Nichols PID tuning.
:::

:::example Example 8.2 A generator AVR loop
An AVR loop consists of an amplifier $\dfrac{K_A}{0.1s + 1}$, an exciter $\dfrac{1}{0.4s + 1}$ and a generator $\dfrac{1}{s + 1}$, with unity feedback. Find the largest gain for stability and compare it with the $K_A = 99$ wanted in Example 7.1.

**Step 1.** Characteristic equation $(0.1s + 1)(0.4s + 1)(s + 1) + K_A = 0$

$$0.04s^3 + 0.54s^2 + 1.5s + (1 + K_A) = 0$$

**Step 2.** Routh array.

| | | |
|---|---|---|
| $s^3$ | 0.04 | 1.5 |
| $s^2$ | 0.54 | $1 + K_A$ |
| $s^1$ | $\dfrac{0.81 - 0.04(1 + K_A)}{0.54}$ | |
| $s^0$ | $1 + K_A$ | |

**Step 3.** We need $0.81 - 0.04(1 + K_A) > 0$, so $1 + K_A < 20.25$.

$$K_A < 19.25$$

The smallest error a P controller can reach is $\dfrac{1}{1 + 19.25} = 4.9\ \%$, and at that gain the system oscillates for ever. So 1 % cannot be reached by gain alone. This conflict between accuracy and stability is the reason for the compensator design of Part 3.
:::

## Special cases {#special}

| Case | What happens | Remedy |
|---|---|---|
| A zero in the first column, but the row is not all zero | Division by zero in the next row | Replace the zero by a small positive $\epsilon$, continue, and take the signs as $\epsilon \to 0^+$ |
| A whole row of zeros | There are roots symmetric about the origin, such as a pair on the imaginary axis | Form the auxiliary polynomial from the row above, differentiate it and use the coefficients of the derivative in place of the zero row |

The roots of the auxiliary polynomial are also roots of the characteristic equation, as used in Step 4 of Example 8.1.

## Exercises {#exercises}

:::exercise Exercise 8.1
How many roots of $s^4 + 2s^3 + 3s^2 + 4s + 5 = 0$ lie in the right half-plane?

:::answer Show answer
| | | | |
|---|---|---|---|
| $s^4$ | 1 | 3 | 5 |
| $s^3$ | 2 | 4 | |
| $s^2$ | $\dfrac{6 - 4}{2} = 1$ | 5 | |
| $s^1$ | $\dfrac{4 - 10}{1} = -6$ | | |
| $s^0$ | 5 | | |

The first column is 1, 2, 1, −6, 5. The sign changes twice (1 to −6, and −6 to 5), so there are 2 roots in the right half-plane. The system is unstable although every coefficient is positive.
:::
:::

:::exercise Exercise 8.2
A unity-feedback system has $L(s) = \dfrac{K}{s(s + 2)(s + 4)}$. Find the stable range of $K$ and the oscillation frequency at the ultimate gain.

:::answer Show answer
Characteristic equation $s^3 + 6s^2 + 8s + K = 0$. The $s^1$ row is $\dfrac{48 - K}{6}$, so $0 < K < 48$.

At $K = 48$: $6s^2 + 48 = 0$ gives $s = \pm j\sqrt{8} = \pm j2.83$ rad/s.
:::
:::

:::exercise Exercise 8.3
For the third-order system $s^3 + a_2s^2 + a_1s + a_0 = 0$ with all coefficients positive, show that the condition for stability is $a_2a_1 > a_0$.

:::answer Show answer
The first column of the Routh array is $1,\ a_2,\ \dfrac{a_2a_1 - a_0}{a_2},\ a_0$. With $a_2 > 0$ and $a_0 > 0$ the remaining condition is $a_2a_1 - a_0 > 0$.

This checks Example 8.1 at once: $6 \times 5 > K$.
:::
:::

## Summary of Unit 8 {#summary}

- A system is stable if and only if every closed-loop pole is in the left half of the $s$-plane.
- A zero or negative coefficient means instability, but all-positive coefficients do not guarantee stability from third order upward.
- The number of sign changes in the first column of the Routh array equals the number of right-half-plane poles.
- A Routh array with the gain $K$ as a variable gives the stable range, the ultimate gain and the oscillation frequency at the limit.

The Routh criterion only says whether a system is stable. The next unit opens Part 3 with the root locus, which shows how the poles move as the gain changes.
