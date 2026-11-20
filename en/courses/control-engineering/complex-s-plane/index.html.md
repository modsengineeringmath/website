---
title: "Complex Variables, Complex Functions, Mapping and the s-Plane"
url: https://modsengineeringmath.com/en/courses/control-engineering/complex-s-plane/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-18
---

> The complex-variable foundation for control engineering: analytic functions, the Cauchy-Riemann conditions, conformal mapping, the s-plane, poles and zeros and the argument principle, with an interactive mapping lab and exercises.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/complex-s-plane/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Complex Variables, Complex Functions, Mapping and the s-Plane

// Unit 2 · Control Engineering · Complex Variables, Complex Functions, Mapping and the s-Plane


The complex-variable foundation for control engineering: analytic functions, the Cauchy-Riemann conditions, conformal mapping, the s-plane, poles and zeros and the argument principle, with an interactive mapping lab and exercises.

## What you can do after this unit

- Compute with complex numbers in rectangular and polar form, and evaluate F(s) at a complex point
- Decide whether a complex function is analytic using the Cauchy-Riemann conditions
- Explain the conformal property and find the image of a line under simple functions
- Read pole locations on the s-plane to predict the response and find ζ and ωn
- Recognize that the frequency response F(jω) is the image of the imaginary axis, and see where the argument principle comes from

## Why control engineering needs complex numbers

Every linear time-invariant system has solutions of the form $e^{st}$, where $s$ is a constant.

Substitute $y = e^{st}$ into $\dot y + 3y = 0$.

$$s e^{st} + 3 e^{st} = 0 \;\Longrightarrow\; s = -3$$

Here $s$ is real. But the second-order equation $\ddot y + 2\dot y + 5y = 0$ gives

$$s^2 + 2s + 5 = 0 \;\Longrightarrow\; s = -1 \pm j2$$

Now $s$ is complex, and $e^{(-1+j2)t} = e^{-t}(\cos 2t + j\sin 2t)$ is an oscillation that dies away.

So a single number $s$ carries both the decay rate (its real part) and the oscillation frequency (its imaginary part). This unit builds the language we use for the rest of the course.

## Complex numbers

Write $s = \sigma + j\omega$, with $\sigma = \operatorname{Re}\,s$ and $\omega = \operatorname{Im}\,s$. Engineers use $j$ rather than $i$ so it does not clash with current.

In polar form we use magnitude and angle.

$$s = \lvert s\rvert\, e^{j\theta}, \qquad \lvert s \rvert = \sqrt{\sigma^2 + \omega^2}, \qquad \theta = \arg s = \operatorname{atan2}(\omega,\sigma)$$

Euler's formula links the two forms.

$$e^{j\theta} = \cos\theta + j\sin\theta$$

The conjugate of $s$ is $\bar s = \sigma - j\omega$, and $s\bar s = \lvert s\rvert^2$.

Common operations

- Multiply. Magnitudes multiply and angles add: $\lvert s_1 s_2\rvert = \lvert s_1\rvert\lvert s_2\rvert,\ \arg(s_1 s_2) = \arg s_1 + \arg s_2$

- Divide. Magnitudes divide and angles subtract

- Divide in rectangular form. Multiply numerator and denominator by the conjugate of the denominator

Example 2.1

Write $s = -3 + j4$ in polar form.

The magnitude is $\lvert s \rvert = \sqrt{9 + 16} = 5$.

The angle is $\theta = \operatorname{atan2}(4, -3) = 126.87^\circ$. It lies in the second quadrant, so using $\tan^{-1}(4/(-3)) = -53.13^\circ$ directly would put it in the wrong quadrant.

$$s = 5\,e^{j\,126.87^\circ}$$

## Complex functions

A complex function $F(s)$ takes a complex number and returns a complex number. It splits into real and imaginary parts.

$$F(s) = u(\sigma,\omega) + j\,v(\sigma,\omega)$$

A transfer function is a direct example. Evaluating at a complex point means substituting and doing the algebra.

Example 2.2

Evaluate $F(s) = \dfrac{s + 1}{s^2 + 2s + 5}$ at $s = j2$.

Numerator: $1 + j2$

Denominator: $(j2)^2 + 2(j2) + 5 = -4 + j4 + 5 = 1 + j4$

$$F(j2) = \frac{1 + j2}{1 + j4}\cdot\frac{1 - j4}{1 - j4} = \frac{1 - j4 + j2 + 8}{17} = \frac{9 - j2}{17} = 0.529 - j\,0.118$$

The magnitude is $\lvert F\rvert = 0.542$ and the angle is $\arg F = -12.5^\circ$.

The values $F(j\omega)$ as $\omega$ varies are the frequency response. We return to this at the end of the unit.

## Mapping

Input and output are both complex, so we cannot plot $F$ the usual way. That would need four dimensions.

Instead we draw two planes. The $s$-plane is the domain and the $w$-plane, with $w = F(s)$, is the range. We ask where the image of points and curves of the $s$-plane lands in the $w$-plane.

Example 2.3

Find the image of the vertical line $\operatorname{Re}\,s = 1$ under $w = s^2$.

The line is $s = 1 + j\omega$, so

$$w = (1 + j\omega)^2 = (1 - \omega^2) + j\,2\omega$$

Let $u = 1 - \omega^2$ and $v = 2\omega$. Eliminate $\omega = v/2$.

$$u = 1 - \frac{v^2}{4}$$

The image is a parabola opening to the left, with its vertex at $w = 1$.

## Analytic functions and the Cauchy-Riemann conditions

The complex derivative is defined just like the real one.

$$F'(s_0) = \lim_{\Delta s \to 0}\frac{F(s_0 + \Delta s) - F(s_0)}{\Delta s}$$

The key difference is that $\Delta s$ is complex, so it can approach zero from any direction in the plane, and the limit must be the same for every direction.

A function that has a derivative throughout a region is called an analytic function.

Approach along the horizontal, $\Delta s = \Delta\sigma$, and along the vertical, $\Delta s = j\Delta\omega$, and force the two results to agree. This gives

$$\frac{\partial u}{\partial \sigma} = \frac{\partial v}{\partial \omega}, \qquad \frac{\partial u}{\partial \omega} = -\frac{\partial v}{\partial \sigma}$$

These are the Cauchy-Riemann conditions. For an analytic function the derivative is

$$F'(s) = \frac{\partial u}{\partial \sigma} + j\,\frac{\partial v}{\partial \sigma}$$

Example 2.4

(a) Is $F = s^2 + s$ analytic, and what is $F'(1+j)$?

Split it: $u = \sigma^2 - \omega^2 + \sigma$ and $v = 2\sigma\omega + \omega$.

$u_\sigma = 2\sigma + 1 = v_\omega$ ✓ and $u_\omega = -2\omega = -v_\sigma$ ✓, so it is analytic.

$F' = u_\sigma + j v_\sigma = (2\sigma+1) + j\,2\omega$. At $\sigma = 1,\ \omega = 1$ this is $3 + j2$, which matches the formula $F' = 2s + 1 = 3 + j2$.

(b) $F = \bar s$ (the conjugate) gives $u = \sigma,\ v = -\omega$.

$u_\sigma = 1$ but $v_\omega = -1$. They differ, so $F$ is analytic at no point.

A rational function $F = N(s)/D(s)$ is analytic everywhere except at the roots of the denominator.

- A zero is a point where $F(s) = 0$, a root of the numerator

- A pole is a point where $F(s) \to \infty$, a root of the denominator (not cancelled by the numerator)

In control systems the poles and zeros of a transfer function have direct physical meaning and set the whole response.

## Conformal mapping

If $F$ is analytic at $s_0$, a small step around $s_0$ gives

$$F(s_0 + \Delta s) \approx F(s_0) + F'(s_0)\,\Delta s$$

Because $F'(s_0)$ is one complex number for every direction, we can write $F'(s_0) = \lvert F'\rvert e^{j\varphi}$.

The result is that every small displacement is rotated by the same angle $\varphi$ and stretched by the same factor $\lvert F' \rvert$.

So two curves crossing at $s_0$ are rotated together, and the angle between them does not change. This is the conformal property.

The conformal property

If $F'(s_0) \ne 0$, the map $w = F(s)$ preserves angles (both size and sense) at $s_0$. The image of an orthogonal grid is still orthogonal.

Lengths are scaled by $\lvert F'\rvert$ and areas by $\lvert F'\rvert^2$.

At a critical point, where $F'(s_0) = 0$, the property fails. If $F(s) - F(s_0)$ has a zero of order $m$ at $s_0$, angles are multiplied by $m$.

An example is $w = s^2$ at $s = 0$, where $F' = 2s = 0$. A ray at angle $\alpha$ to the real axis maps to a ray at angle $2\alpha$. The first quadrant is opened into the whole upper half-plane.

## Classic mappings to know

1) Shift and rotate-scale. $w = s + a$ shifts every point by the same amount. $w = bs$ rotates by $\arg b$ and scales by $\lvert b\rvert$.

2) Inversion $w = 1/s$. It maps vertical lines to circles.

Example 2.5

Show that $w = 1/s$ maps the line $\operatorname{Re}\,s = c$ (with $c > 0$) to a circle.

For $s = c + j\omega$,

$$w = \frac{c - j\omega}{c^2 + \omega^2}, \qquad u = \frac{c}{c^2 + \omega^2},\quad v = \frac{-\omega}{c^2 + \omega^2}$$

Compute $u^2 + v^2 = \dfrac{c^2 + \omega^2}{(c^2+\omega^2)^2} = \dfrac{1}{c^2 + \omega^2} = \dfrac{u}{c}$

Rearranging gives $\left(u - \dfrac{1}{2c}\right)^2 + v^2 = \left(\dfrac{1}{2c}\right)^2$

It is a circle of radius $\dfrac{1}{2c}$ centred at $\dfrac{1}{2c}$. It passes through the origin of the $w$-plane, which is the image of $s = \infty$.

3) The bilinear map $w = \dfrac{1 + s}{1 - s}$

On $s = j\omega$ we have $\lvert 1 + j\omega\rvert = \lvert 1 - j\omega\rvert$, so $\lvert w\rvert = 1$. The imaginary axis maps to the unit circle.

In the left half of the $s$-plane, $\lvert 1 + s\rvert < \lvert 1 - s\rvert$ (the point is closer to $-1$ than to $+1$), so $\lvert w\rvert < 1$, inside the circle.

The link to digital systems

The Tustin transform used to turn a continuous controller into a digital one is $z = \dfrac{1 + sT/2}{1 - sT/2}$, which is this same bilinear map.

It sends the left half of the $s$-plane inside the unit circle of the $z$-plane and so preserves stability. We come back to it when we study digital control.

4) The exponential $w = e^s$. It maps the vertical line $\operatorname{Re}\,s = c$ to a circle of radius $e^c$, and the horizontal line $\operatorname{Im}\,s = y$ to a ray at angle $y$. It is the map behind sampling, $z = e^{sT}$.

## Lab: map the s-plane

The blue and grey grid lines are lines of constant $\sigma$ and constant $\omega$ in the $s$-plane. On the right is their image. The thick orange curve is the $j\omega$ axis and its image. The green cross is a small cross at the point $s_0$ and its image.

Try these.

- Pick $s^2$ and drag $s_0$ close to 0. See how the cross twists and when the critical-point message appears.

- Pick $1/s$ and see the vertical lines become circles, as in Example 2.5.

- Pick the bilinear map and see whether the left half-plane lands inside or outside the unit circle.

- Pick $e^s$ and see the grid turn into circles and rays.

- For every function, check that the angle between the images of the horizontal and vertical lines is 90°, except at a critical point.

## The s-plane and pole locations

A pole at $p = \sigma_p + j\omega_p$ gives a term $e^{pt} = e^{\sigma_p t}(\cos\omega_p t + j\sin\omega_p t)$ in the response. Its position on the $s$-plane tells the behaviour directly.

|
Pole location |
Term in the response |
Behaviour |

|
$s = -a,\ a>0$ |
$e^{-at}$ |
Exponential decay |

|
$s = +a$ |
$e^{at}$ |
Exponential growth |

|
$s = 0$ |
Constant |
Neither decays nor grows |

|
$s = -\sigma \pm j\omega$ |
$e^{-\sigma t}\cos(\omega t + \phi)$ |
Decaying oscillation |

|
$s = \pm j\omega$ |
$\cos(\omega t + \phi)$ |
Sustained oscillation |

|
$s = \sigma \pm j\omega,\ \sigma>0$ |
$e^{\sigma t}\cos(\omega t + \phi)$ |
Growing oscillation |

So the left half-plane is the stable region, the right half-plane is the unstable region and the $j\omega$ axis is the boundary.

### Lines of constant parameter on the s-plane

Write a complex pole pair in the standard second-order form.

$$p = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$$

Here $\omega_n$ is the natural frequency and $\zeta$ is the damping ratio. From this form:

- Vertical lines $\sigma = \zeta\omega_n$ constant mean constant settling time ($t_s \approx 4/\sigma$)

- Horizontal lines $\omega_d = \omega_n\sqrt{1-\zeta^2}$ constant mean constant oscillation frequency

- Circles about the origin $\lvert p\rvert = \omega_n$ constant, because $\lvert p \rvert^2 = \zeta^2\omega_n^2 + \omega_n^2(1-\zeta^2) = \omega_n^2$

- Rays from the origin $\zeta$ constant, because the angle from the negative real axis is $\theta = \cos^{-1}\zeta$ (from $\cos\theta = \sigma/\lvert p\rvert = \zeta$)

Example 2.6

A pole pair is at $s = -3 \pm j4$. Find its parameters.

$\omega_n = \lvert p\rvert = \sqrt{9+16} = 5$ rad/s

$\zeta = \sigma/\omega_n = 3/5 = 0.6$

The angle from the negative real axis is $\theta = \cos^{-1}0.6 = 53.13^\circ$.

The settling time is $t_s \approx 4/\sigma = 4/3 = 1.33$ s.

The percent overshoot is $M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}} = e^{-0.6\pi/0.8} = 9.48\%$.

We read almost the whole transient response from one position on the plane. That is why root locus and pole-based design are so powerful.

## The frequency response is the image of the jω axis

Feed a sinusoid $e^{j\omega t}$ into a linear system. The steady-state output is $F(j\omega)\,e^{j\omega t}$. It is multiplied by the complex number $F(j\omega)$, which changes the magnitude by $\lvert F(j\omega)\rvert$ and shifts the phase by $\arg F(j\omega)$.

So the whole frequency response is the image of the imaginary axis $s = j\omega$ under $F$. That is the orange curve in the lab.

Use the second-order transfer function in this lab and drag $s_0$ along the $j\omega$ axis (set σ = 0). Watch the image run along the thick curve, which is the frequency response drawn in the complex plane.

A Bode plot splits this curve into two graphs (magnitude and angle). A Nyquist plot draws it in one plane. Both have their root in this mapping.

## The argument principle

We need this in the Nyquist unit, and it is a direct consequence of mapping, so it goes here.

Let $F$ be analytic in a region with finitely many poles and zeros. Draw a simple closed curve $\Gamma$ through no pole or zero, traversed counter-clockwise. Its image is a closed curve in the $w$-plane.

If $\Gamma$ encloses $Z$ zeros and $P$ poles (counted with order), then

$$N = \text{number of counter-clockwise turns of the image around the origin} = Z - P$$

Why, briefly. Near a zero of order $m$ at $z_0$, write $F \approx a(s - z_0)^m$. The angle of $F$ changes $m$ times as fast as the angle of $(s - z_0)$. As $s$ goes once around $z_0$, the angle of $(s-z_0)$ grows by $2\pi$, so the angle of $F$ grows by $2\pi m$. A pole does the opposite and removes $2\pi m$. A zero or pole outside $\Gamma$ gives no net change.

Said another way, $\oint_\Gamma \dfrac{F'(s)}{F(s)}\,ds = j\,\Delta_\Gamma \arg F = 2\pi j\,(Z - P)$.

Example 2.7

Let $F(s) = \dfrac{s+1}{(s+2)(s-1)(s+5)}$ and let $\Gamma$ be the circle $\lvert s\rvert = 3$, counter-clockwise. How many times does the image $F(\Gamma)$ encircle the origin?

The zero at $s = -1$ is inside $(Z = 1)$.

The poles at $s = -2$ and $s = +1$ are inside, and $s = -5$ is outside $(P = 2)$.

$N = Z - P = -1$. The image encircles the origin once clockwise. A numerical check gives $-1.00$, in agreement.

When $\Gamma$ is chosen as the boundary of the whole right half of the $s$-plane, the principle counts unstable poles. That is the Nyquist criterion, which comes in a later unit.

The same idea underlies the residue theorem, $\oint F\,ds = 2\pi j\sum \text{Res}$, which is how the inverse Laplace transform is computed in a coming unit.

## Exercises

Exercise 2.1 Frequency response at one frequency

$F(s) = \dfrac{10}{s + 5}$. Find $\lvert F(j5)\rvert$ and $\arg F(j5)$.

Show answer

$$F(j5) = \frac{10}{5 + j5} = \frac{10(5 - j5)}{50} = 1 - j1$$

$\lvert F\rvert = \sqrt{2} = 1.414$ and $\arg F = -45^\circ$.

At the corner frequency ($\omega = 5$ rad/s) a first-order system always has a phase of $-45^\circ$.

Exercise 2.2 Image of a horizontal line

Find the image of the horizontal line $\operatorname{Im}\,s = 1$ under $w = s^2$.

Show answer

With $s = \sigma + j$ we get $w = \sigma^2 - 1 + j\,2\sigma$, so $u = \sigma^2 - 1,\ v = 2\sigma$.

$$u = \frac{v^2}{4} - 1$$

It is a parabola opening to the right with its vertex at $w = -1$. It crosses the parabola of Example 2.3 at right angles, as the conformal property requires.

Exercise 2.3 The jω axis and the left half-plane

Where does $F(s) = \dfrac{s - 2}{s + 2}$ send the $j\omega$ axis? Does it send the left half of the $s$-plane inside or outside that curve?

Show answer

$\lvert F(j\omega)\rvert = \dfrac{\lvert j\omega - 2\rvert}{\lvert j\omega + 2\rvert} = 1$, so the $j\omega$ axis goes to the unit circle.

If $\operatorname{Re}\,s < 0$, the point $s$ is closer to $-2$ than to $+2$, so $\lvert s + 2\rvert < \lvert s - 2\rvert$ and $\lvert F\rvert > 1$. The image is outside the circle. Check at $s = -3$: $F = 5$ ✓.

Exercise 2.4 Reading poles

A pole pair is at $s = -1 \pm j\sqrt3$. Find $\omega_n,\ \zeta$, the angle from the negative real axis, the settling time $4/\sigma$ and $M_p$.

Show answer

$\omega_n = \sqrt{1 + 3} = 2$ rad/s and $\zeta = 1/2 = 0.5$.

The angle is $\cos^{-1}0.5 = 60^\circ$.

$t_s \approx 4/1 = 4$ s.

$M_p = e^{-\pi \cdot 0.5/\sqrt{0.75}} = 16.3\%$.

Exercise 2.5 Cauchy-Riemann

Check that $F(s) = s^3$ is analytic and find $F'(s)$ at $s = j$ from the Cauchy-Riemann conditions.

Show answer

$s^3 = (\sigma + j\omega)^3 = (\sigma^3 - 3\sigma\omega^2) + j(3\sigma^2\omega - \omega^3)$

$u_\sigma = 3\sigma^2 - 3\omega^2 = v_\omega$ ✓ and $u_\omega = -6\sigma\omega = -v_\sigma$ ✓, so it is analytic.

$F' = u_\sigma + j v_\sigma = (3\sigma^2 - 3\omega^2) + j\,6\sigma\omega$. At $s = j$ ($\sigma=0,\omega=1$) this gives $-3$, which matches $3s^2 = 3j^2 = -3$.

Exercise 2.6 Mapping of 1/s (advanced)

Show that $w = 1/s$ maps the line $\operatorname{Re}\,s = 1$ to the circle $\lvert w - \tfrac12\rvert = \tfrac12$. Then find the image of $s = 1 + j$ and show it lies on that circle.

Show answer

From Example 2.5 with $c = 1$ we get the circle of radius $\tfrac12$ centred at $\tfrac12$.

$w(1+j) = \dfrac{1}{1+j} = \dfrac{1 - j}{2} = 0.5 - j0.5$

$\lvert w - 0.5\rvert = \lvert -j0.5\rvert = 0.5$ ✓, so it lies on the circle.

Exercise 2.7 Argument principle (advanced)

$F(s) = \dfrac{(s+1)(s+3)}{s(s-2)}$ and $\Gamma$ is the circle $\lvert s\rvert = 1.5$, counter-clockwise. How many times, and in which direction, does the image encircle the origin?

Show answer

Inside the circle of radius 1.5, the zero $s=-1$ is inside and $s=-3$ is outside ($Z = 1$). The pole $s = 0$ is inside and $s = 2$ is outside ($P = 1$).

$N = Z - P = 0$. The image has no net encirclement of the origin.

Exercise 2.8 Tustin transform (advanced)

$z = \dfrac{1 + sT/2}{1 - sT/2}$ with $T = 0.5$ s. Find $z$ for $s = j4$ and say where it lies in the $z$-plane. Then find the image of $s = -2$.

Show answer

$sT/2 = j4 \times 0.25 = j1$, so $z = \dfrac{1 + j}{1 - j} = j$. Its magnitude is $\lvert z\rvert = 1$ and its angle is $90^\circ$, so it lies on the unit circle (the $j\omega$ axis maps to the unit circle).

For $s = -2$: $sT/2 = -0.5$, so $z = \dfrac{0.5}{1.5} = 0.333$. It is inside the circle, as expected since the left half-plane maps inside.

## Summary

- $s = \sigma + j\omega$ packs a decay rate and a frequency into one number

- An analytic function satisfies the Cauchy-Riemann conditions, and its complex derivative does not depend on direction

- The map $w = F(s)$ is conformal (angle-preserving) wherever $F' \ne 0$

- Pole positions on the $s$-plane give the response and the stability. Lines of constant $\sigma$, $\omega_d$, $\zeta$ and $\omega_n$ are vertical lines, horizontal lines, rays and circles

- The frequency response is the image of the $j\omega$ axis, and the argument principle is the base of the Nyquist criterion

Next unit. The Laplace transform uses the $s$-plane we have just built to turn differential equations into algebra.
