---
title: "Why s > 0 and Re{s} > 0? The Laplace Transform of a Constant (c/s) and of the Unit Step (1/s)"
url: https://modsengineeringmath.com/en/learn/laplace-transform/why-re-s-positive/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-25
---

> Why do L{c} = c/s and L{u(t)} = 1/s only hold for s > 0, and why does it become Re{s} > 0 once s is complex? A step-by-step proof with Euler's formula |e^(−st)| = e^(−σt), what goes wrong on the jω axis, the half-plane ROC, 1/s as a complex function, the two-sided transform, the Bromwich line and the final value theorem, with interactive labs.

Markdown copy of https://modsengineeringmath.com/en/learn/laplace-transform/why-re-s-positive/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Why s > 0 and Re{s} > 0? The Laplace Transform of a Constant (c/s) and of the Unit Step (1/s)

THภาษาไทยENEnglish
// Lesson 8.6 · Laplace transform · Why Re s > 0


The first pair everyone learns is $\mathcal{L}\{c\} = c/s$ and $\mathcal{L}\{u(t)\} = 1/s$, usually followed by a small condition: $s > 0$, or $\operatorname{Re}\{s\} > 0$. This page explains where that condition comes from, why it is the real part that matters, why ω has nothing to do with it, why the inequality has to be strict, and how this small condition leads straight to the ROC, complex functions, the Bromwich integral and the final value theorem in control. Euler's formula does most of the work. There are labs where you can drag $s$ around and watch the integral either home in on the answer or run away.

The 30-second version

- $\int_0^{\infty} c\,e^{-st}dt$ is $\lim_{T\to\infty}$ of $\dfrac{c\,(1 - e^{-sT})}{s}$. You get $c/s$ only if $e^{-sT} \to 0$.

- Euler: $e^{-st} = e^{-\sigma t}\,(\cos\omega t - j\sin\omega t)$. The factor $e^{-j\omega t}$ always has size 1, which leaves $|e^{-st}| = e^{-\sigma t}$. That goes to zero exactly when $\sigma = \operatorname{Re}s > 0$.

- ω only rotates; it never shrinks or stretches. So the ROC is the right half-plane, with its edge the vertical line through the pole at $s = 0$.

- On the edge $\sigma = 0$: $s = 0$ gives $cT \to \infty$, and $s = j\omega$ goes round a circle for ever. Hence “greater than”, not “greater than or equal to”.

- “s > 0” only makes sense while s is real. Complex numbers have no order. The condition that is always right is $\operatorname{Re}s > 0$.

LevelBasic years 1–2Intermediate engineering BScAdvanced MSc

## The question: where does the condition after the formula come from? Basic

Every Laplace table starts with these two lines. Some books write the condition as $s > 0$, some as $\operatorname{Re}\{s\} > 0$ or $\sigma > 0$, and plenty leave it out altogether. Yet the condition is part of the answer, not a footnote.

U1 Constant function

$$\mathcal{L}\{c\} = \int_0^{\infty} c\,e^{-st}\,dt = \frac{c}{s},\qquad \operatorname{Re}s > 0$$

U2 Unit step

$$u(t) = \begin{cases} 0, & t < 0 \\ 1, & t > 0 \end{cases}\qquad \mathcal{L}\{u(t)\} = \frac{1}{s},\quad \operatorname{Re}s > 0$$

Whether you define $u(0)$ as 0, ½ or 1 makes no difference: a single point has no area.

Before the details, here are the three things this page answers:

- Why there is a condition at all. The definition is an integral to infinity, and such an integral may not have a value (section 2, section 3).

- Why it is the real part. $s$ is complex, and Euler's formula shows that the imaginary part only causes rotation (sections 4–6).

- Why strictly greater than zero. On the line $\operatorname{Re}s = 0$ the integral does not converge (section 7).

The constant $c$ and $c\,u(t)$ give the same result in the one-sided transform, because they only differ for $t < 0$, outside the range of integration. The difference shows up in the two-sided transform (section 11). In control, $c\,u(t)$ is “flipping a switch” at $t = 0$: connecting a DC supply of $V$ volts to a circuit, or giving a controller a new set-point. That is why it is the test input we use most.

## The definition is an improper integral: it has to converge before it has a value Basic

The upper limit of the Laplace integral is $\infty$, which is not a number. So we integrate up to $T$ first, then ask whether the result settles down to some value as $T$ grows without bound.

U3 Improper integral

$$\int_0^{\infty} f(t)\,e^{-st}\,dt \;=\; \lim_{T\to\infty} I(T),\qquad I(T) = \int_0^{T} f(t)\,e^{-st}\,dt$$

If the limit is finite, the integral converges and that value is $F(s)$. If the limit is infinite, or does not exist (it keeps oscillating), the integral diverges and $F(s)$ has no value at that $s$. The set of $s$ where it converges is the region of convergence (ROC).

A useful picture is to think of $I(T)$ as an “accumulated area” that keeps growing as $T$ moves to the right. Asking whether the integral converges is then the same as asking whether that area stops growing at some value. When $s$ is real, all of this can be drawn as area under a curve, so that is where we start.

## Start with real s: why s > 0 Basic

Example U-1 · From the definition (real s)

### Find $\mathcal{L}\{c\}$ and say when it is valid

- Write it as the limit of a partial integral, as in U3 (for $s \ne 0$):

$$I(T) = \int_0^{T} c\,e^{-st}\,dt = c\left[\frac{e^{-st}}{-s}\right]_0^{T} = \frac{c}{-s}\left(e^{-sT} - 1\right) = \frac{c\,(1 - e^{-sT})}{s}$$

- Only one piece depends on $T$: $e^{-sT}$. The whole question comes down to what $e^{-sT}$ does as $T \to \infty$.

$$\lim_{T\to\infty} e^{-sT} = \begin{cases} 0, & s > 0 \\ \infty, & s < 0 \end{cases}$$

- If $s > 0$: $I(T) \to \dfrac{c\,(1 - 0)}{s} = \dfrac{c}{s}$. If $s < 0$: $e^{-sT} = e^{|s|T} \to \infty$ and the integral diverges.

- $s = 0$ needs its own look, because the formula above divides by zero: $\displaystyle I(T) = \int_0^T c\,dt = cT \to \infty$. That diverges too.

$\mathcal{L}\{c\} = \dfrac{c}{s}$ only for $s > 0$. For $s \le 0$ the integral has no value. $\mathcal{L}\{u(t)\}$ is the case $c = 1$: $1/s$ for $s > 0$.

s > 0 · converges$e^{-st}$ decays exponentially and the total area is finite, $c/s$. The smaller $s$, the longer the tail and the bigger the area.

s = 0 · diverges$e^{0} = 1$: a flat line. The area $cT$ grows linearly for ever.

s < 0 · diverges$e^{-st} = e^{|s|t}$ grows exponentially, so the area runs away even faster than at $s = 0$.

The area under $e^{-st}$ from 0 to infinity is finite only for $s > 0$. At $s = 0$ and $s < 0$ the accumulated area never stops growing.

In the lab below, bring $s$ down towards zero from above, say $s = 0.05$. The area still converges, but you have to wait a very long $T$ (watch the $A(T)$ column). The moment you touch $s = 0$ the area turns into a straight line that keeps climbing.

U4 How fast it converges

$$\left|\frac{I(T) - c/s}{c/s}\right| = e^{-\sigma T}\quad\Rightarrow\quad T > \frac{\ln(1/\varepsilon)}{\sigma}\ \text{ keeps the error below } \varepsilon$$

This holds for complex $s$ too (proved in section 5). With $\sigma = 0.1$ and a 1 % error you need $T > \ln 100/0.1 \approx 46.05$.

The method in the video Laplace transform of a constant function (in Thai) substitutes $u = -st$ and gets the same answer. The limits change from $t: 0 \to \infty$ to $u: 0 \to -\infty$, and that step only works because $s > 0$. If $s < 0$ the upper limit would become $u \to +\infty$ and $e^{u}$ would not vanish. The same condition is hiding in the change of limits.

## When s is complex: splitting e−st with Euler's formula Basic

In the real Laplace transform, $s$ is not a real number but a complex frequency $s = \sigma + j\omega$. Once $s$ is complex, the statement “$s > 0$” stops meaning anything, because complex numbers have no ordering (you cannot ask whether $2 + 3j$ is bigger than zero). We need to find which part of $s$ controls whether $e^{-st}$ shrinks. Euler's formula answers that most directly.

U5 Euler's formula

$$e^{j\theta} = \cos\theta + j\sin\theta,\qquad e^{-j\theta} = \cos\theta - j\sin\theta$$

It comes from the Taylor series of $e^x$ with $x = j\theta$: the even terms collect into $\cos\theta$ and the odd terms into $j\sin\theta$. See Euler's formula in the trigonometry lesson (in Thai).

U6 Unit modulus

$$|e^{-j\theta}| = \sqrt{\cos^2\theta + \sin^2\theta} = 1 \quad\text{for every real } \theta$$

This is the Pythagorean identity $\sin^2\theta + \cos^2\theta = 1$. The point $e^{-j\theta}$ always sits on the unit circle and moves clockwise as θ increases.

U7 Splitting the kernel

$$e^{-st} = e^{-(\sigma + j\omega)t} = \underbrace{e^{-\sigma t}}_{\text{size: shrink/grow}}\;\cdot\;\underbrace{e^{-j\omega t}}_{\text{angle: rotate}} = e^{-\sigma t}\cos\omega t \;-\; j\,e^{-\sigma t}\sin\omega t$$

The first step uses $e^{a+b} = e^a e^b$, which still holds for complex exponents. The second is Euler's formula U5 with $\theta = \omega t$.

U8 Magnitude depends on σ only

$$|e^{-st}| = |e^{-\sigma t}|\cdot|e^{-j\omega t}| = e^{-\sigma t}\cdot 1 = e^{-\operatorname{Re}(s)\,t}$$

This is the key line of the whole page: ω drops out of the size completely. Whatever ω is, the function shrinks or grows at the rate σ and nothing else.

Picture the point $e^{-st}$ in the complex plane as time runs. ω spins it round the origin at ω radians per second, while σ pulls its distance from the origin down to $e^{-\sigma t}$. Put the two together and you get a spiral. With $\sigma > 0$ it winds in to zero; with $\sigma = 0$ it goes round the unit circle for ever; with $\sigma < 0$ it winds outwards. Project it onto the real and imaginary axes and you get cos and −sin squeezed by the envelope $\pm e^{-\sigma t}$, the same picture electrical engineers see on an oscilloscope every day.

Left: $e^{-st}$ with $s = 0.25 + 2j$ in the complex plane, a spiral winding inwards. Right: its shadows on the real and imaginary axes against time, sinusoids squeezed by $e^{-0.25t}$.

## ℒ{c} with complex s, step by step: Re{s} > 0 Intermediate

Integrating $e^{-st}$ with complex $s$ follows the same rule as for real $s$, because $\frac{d}{dt}e^{-st} = -s\,e^{-st}$ still holds (check it by splitting into cos and sin with U7 and differentiating each part). The only difference is in what happens when you put in the upper limit.

Example U-2 · From the definition (complex s)

### Prove $\mathcal{L}\{c\} = c/s$ for $\operatorname{Re}s > 0$

- The partial integral ($s \ne 0$) looks exactly as before:

$$I(T) = \int_0^{T} c\,e^{-st}\,dt = \frac{c\,(1 - e^{-sT})}{s} = \frac{c}{s} - \frac{c}{s}\,e^{-sT}$$

- The first term does not depend on $T$. The second is the “error”. Measure its size with U8:

$$\left|I(T) - \frac{c}{s}\right| = \frac{|c|}{|s|}\,|e^{-sT}| = \frac{|c|}{|s|}\,e^{-\sigma T}$$

- If $\sigma > 0$ the right-hand side goes to 0 as $T \to \infty$, which means the point $I(T)$ in the complex plane really does run into the point $c/s$.

- The relative distance $|I(T) - c/s|\,/\,|c/s| = e^{-\sigma T}$ does not involve ω or $c$ at all. That is formula U4.

$\mathcal{L}\{c\} = \dfrac{c}{s}$ for every $s$ with $\operatorname{Re}s > 0$, whatever ω is. When $s$ is real this reduces to $s > 0$.

The sentence that makes all of this work deserves to be pulled out as a lemma. Keep it in mind for the whole Laplace chapter: every line of the ROC table comes from it.

0">
U9 Key lemma

$$\lim_{T\to\infty} e^{-sT} = 0 \iff \operatorname{Re}s > 0$$

(⇐) $|e^{-sT}| = e^{-\sigma T} \to 0$ when $\sigma > 0$. (⇒) If $\sigma < 0$ the size $e^{-\sigma T} \to \infty$. If $\sigma = 0$ the size stays at 1, so it cannot go to zero (and for $\omega \ne 0$ there is no limit at all, since the point keeps going round the circle; at $T = k\pi/\omega$ it alternates between $+1$ and $-1$).

Example U-3 · With actual numbers

### Find $\mathcal{L}\{5\}$ at $s = 2 + 3j$, then check it by splitting into real and imaginary parts

- $\operatorname{Re}s = 2 > 0$, so we are inside the ROC and the formula applies. Multiply by the conjugate to separate the parts:

$$\frac{5}{2 + 3j} = \frac{5\,(2 - 3j)}{(2 + 3j)(2 - 3j)} = \frac{10 - 15j}{4 + 9} = \frac{10}{13} - \frac{15}{13}j \approx 0.7692 - 1.1538j$$

- Check with U7: $5e^{-st} = 5e^{-2t}\cos 3t - j\,5e^{-2t}\sin 3t$, then use the results of section 6 (U10, U11) with $\sigma = 2,\ \omega = 3$, $\sigma^2 + \omega^2 = 13$:

$$5\int_0^{\infty} e^{-2t}\cos 3t\,dt = 5\cdot\frac{2}{13} = \frac{10}{13},\qquad -5\int_0^{\infty} e^{-2t}\sin 3t\,dt = -5\cdot\frac{3}{13} = -\frac{15}{13}$$

- How far do you have to integrate for a 0.1 % error? U4 gives $e^{-2T} < 10^{-3}$, so $T > \ln 1000/2 \approx 3.45$.

$\mathcal{L}\{5\}\big|_{s = 2+3j} = \dfrac{10}{13} - \dfrac{15}{13}j$. Both methods agree (and so does numerical integration).

## Two real integrals: seeing what 1/s is made of Intermediate

If integrating complex exponentials still feels uncomfortable, use U7 to turn everything into real integrals you already know from calculus, then put the pieces back together. It is longer, but you can see exactly where the condition $\sigma > 0$ appears.

U10 Damped cosine

$$I_c = \int_0^{\infty} e^{-\sigma t}\cos\omega t\,dt = \frac{\sigma}{\sigma^2 + \omega^2},\quad \sigma > 0$$

U11 Damped sine

$$I_s = \int_0^{\infty} e^{-\sigma t}\sin\omega t\,dt = \frac{\omega}{\sigma^2 + \omega^2},\quad \sigma > 0$$

Example U-4 · Integration by parts, twice

### Prove U10 and U11, then rebuild $1/s$

- By parts on $I_c$ with $u = \cos\omega t,\ dv = e^{-\sigma t}dt$:

$$I_c = \left[-\frac{e^{-\sigma t}\cos\omega t}{\sigma}\right]_0^{\infty} - \frac{\omega}{\sigma}\int_0^{\infty} e^{-\sigma t}\sin\omega t\,dt = \frac{1}{\sigma} - \frac{\omega}{\sigma}I_s$$

The upper limit gives zero because $|e^{-\sigma t}\cos\omega t| \le e^{-\sigma t} \to 0$, and that needs $\sigma > 0$ right here.

- Same again for $I_s$ (both boundary terms vanish, since $\sin 0 = 0$):

$$I_s = \left[-\frac{e^{-\sigma t}\sin\omega t}{\sigma}\right]_0^{\infty} + \frac{\omega}{\sigma}I_c = \frac{\omega}{\sigma}I_c$$

- Substitute back: $I_c = \dfrac{1}{\sigma} - \dfrac{\omega^2}{\sigma^2}I_c$, so $I_c\left(1 + \dfrac{\omega^2}{\sigma^2}\right) = \dfrac{1}{\sigma}$:

$$I_c = \frac{\sigma}{\sigma^2 + \omega^2},\qquad I_s = \frac{\omega}{\sigma}\,I_c = \frac{\omega}{\sigma^2 + \omega^2}$$

- Rebuild with U7: $\displaystyle\int_0^{\infty} e^{-st}dt = I_c - jI_s$:

$$I_c - jI_s = \frac{\sigma - j\omega}{\sigma^2 + \omega^2} = \frac{\overline{s}}{|s|^2} = \frac{\overline{s}}{s\,\overline{s}} = \frac{1}{s}$$

The same $1/s$ as the direct method. The real part of $1/s$ is the area under a damped cosine, the imaginary part is minus the area under a damped sine, and the condition $\sigma > 0$ turns up every time we put in the upper limit.

A side note: take the table entry $\mathcal{L}\{\cos\omega t\} = s/(s^2+\omega^2)$ and set $s \to \sigma$ (keeping the same ω) and you get U10 straight away. In other words U10 and U11 are just the Laplace transforms of cos and sin evaluated at the real point $s = \sigma$. It all hangs together.

## On the edge Re{s} = 0: why “greater than” and not “greater than or equal to” Intermediate

The line $\sigma = 0$ is the whole imaginary axis (the jω axis). Two quite different things happen there.

U12 At s = 0

$$I(T) = \int_0^T c\,dt = cT \to \infty$$

This is exactly where the pole of $c/s$ is: the function blows up at the same place the integral does.

U13 At s = jω, ω ≠ 0

$$I(T) = \frac{1 - e^{-j\omega T}}{j\omega} = \frac{\sin\omega T}{\omega} - j\,\frac{1 - \cos\omega T}{\omega}$$

$|I(T) - \tfrac{1}{j\omega}| = \tfrac{1}{|\omega|}$ is constant, so $I(T)$ keeps going round a circle of radius $1/|\omega|$ about $1/(j\omega)$. Bounded, but no limit.

Example U-5 · On the jω axis

### With $s = 3j$, compute $I(T) = \int_0^T e^{-3jt}dt$ at $T = \pi/6,\ \pi/3,\ 2\pi/3$

- From U13 with $\omega = 3$: $I(T) = \dfrac{\sin 3T}{3} - j\,\dfrac{1 - \cos 3T}{3}$

- $T = \pi/6$: $3T = \pi/2$, so $I = \tfrac13 - \tfrac13 j$. $T = \pi/3$: $3T = \pi$, so $I = 0 - \tfrac23 j$. $T = 2\pi/3$: $3T = 2\pi$, so $I = 0$, back where it started.

- All three points lie on the circle with centre $1/(3j) = -\tfrac13 j$ and radius $\tfrac13$, and every $2\pi/3$ the values repeat.

$I(T)$ never approaches anything, so the Laplace integral at $s = 3j$ has no value, even though $|I(T)| \le \tfrac23$ the whole time.

The path of $I(T)$ as $T$ grows from 0: for σ > 0 it spirals in to ★ = 1/s; for σ = 0 it goes round a circle about 1/(jω); for σ < 0 it spirals out for ever.

There is something nice hiding here. The centre of the circle in U13 is $1/(j\omega)$, which is what you get by plugging $s = j\omega$ straight into $1/s$. And if you slide σ down from positive values towards zero, the limit point $1/(\sigma + j\omega)$ lands exactly on that centre. In mathematical terms the integral has an “average” value (a Cesàro or Abel sum) of $1/(j\omega)$, but no value in the ordinary sense. That is why the Fourier transform of $u(t)$ contains a $1/(j\omega)$ term but needs something extra added (see section 13).

σ > 0 · inside the ROC$|e^{-st}| = e^{-\sigma t} \to 0$. Spirals in; the integral equals $c/s$.

σ = 0, ω ≠ 0 · on the edge$|e^{-st}| = 1$, no shrinking. The integral circles, no limit.

s = 0 · the poleThe integrand is constant; the area $cT \to \infty$.

σ < 0 · outside the ROC$|e^{-st}| = e^{|\sigma| t} \to \infty$. Spirals out.

## s-plane lab: drag s and watch Euler at work

The lab links four views: ① the point $s$ in the s-plane (drag it; the shaded band is the ROC); ② the kernel $c\,e^{-st}$ in the complex plane, following Euler's formula, with dashed orange and blue lines for its shadows on the real and imaginary axes; ③ a time plot, which can show either the integrand or the running integral; ④ the path of $I(T)$ heading for ★ $= c/s$, or failing to. Press ▶ to let time run.

Try these one at a time:

- , then raise ω a little. View ② turns from a straight line into a spiral, but the solid circle (size $e^{-\sigma t}$) does not move, and neither does the $|e^{-sT}|$ column. That is U8, seen with your own eyes.

- , very close to the edge. In ④ the spiral winds in very slowly and needs a long $T$ (U4).

- , right on the edge. ④ becomes a circle with centre c/(jω), and there is no ★ (U13).

- has left the ROC. The spiral winds outwards; the lab cuts the time short for you because the numbers blow up.

- Drag $s$ straight up and down (changing ω only) and watch the verdict. It either converges or fails along the whole vertical line, which is why the ROC has a vertical edge.

- Press “Advanced” and set . The edge of the ROC moves to σ = 1 (see section 9).

## Why the ROC is a vertical half-plane, and the general case eat Intermediate

U8 works for any function, not just constants. If the size of the integrand has a finite integral, the integral itself certainly converges (absolute convergence), and that size contains no ω at all.

U14 Absolute convergence

$$\left|\int_0^{\infty} f(t)\,e^{-st}\,dt\right| \;\le\; \int_0^{\infty} |f(t)|\,e^{-\sigma t}\,dt$$

The right-hand side depends on $\sigma = \operatorname{Re}s$ only. If it is finite at $\sigma_0$ it is finite for every $\sigma > \sigma_0$ (since $e^{-\sigma t}$ only gets smaller). So the ROC of the one-sided transform is always a right half-plane with a vertical edge.

a">
U15 Exponential order

$$|f(t)| \le M e^{\alpha t}\ \Rightarrow\ \operatorname{Re}s > \alpha\ \text{ is in the ROC},\qquad \mathcal{L}\{e^{at}\} = \frac{1}{s - a},\ \operatorname{Re}s > a$$

A constant and $u(t)$ are the case $\alpha = 0$, which gives $\operatorname{Re}s > 0$. This is the existence condition L4 (in Thai).

| $f(t),\ t \ge 0$ | $F(s)$ | ROC | Why, briefly |

| $c$, $c\,u(t)$ | $c/s$ | $\operatorname{Re}s > 0$ | $|f| = |c|$, order 0 |

| $u(t - t_0),\ t_0 > 0$ | $e^{-st_0}/s$ | $\operatorname{Re}s > 0$ | a time shift does not change the ROC |

| $t^n$ | $n!/s^{n+1}$ | $\operatorname{Re}s > 0$ | $t^n \le M_\varepsilon e^{\varepsilon t}$ for every $\varepsilon > 0$ |

| $\cos\omega_0 t,\ \sin\omega_0 t$ | $\dfrac{s}{s^2+\omega_0^2},\ \dfrac{\omega_0}{s^2+\omega_0^2}$ | $\operatorname{Re}s > 0$ | $|\cos|, |\sin| \le 1$; poles on the jω axis |

| $e^{at}$ | $1/(s-a)$ | $\operatorname{Re}s > \operatorname{Re}a$ | U15 (works for complex $a$ too) |

| $e^{-2t}\cos 5t$ | $\dfrac{s+2}{(s+2)^2+25}$ | $\operatorname{Re}s > -2$ | already decaying, so the ROC is wider than the right half-plane |

| $e^{t^2}$ | none | empty | grows faster than any $e^{\alpha t}$ |

Example U-6 · The ROC moves with the growth rate

### Find $\mathcal{L}\{4e^{2t}\}$ and check whether it is valid at $s = 1 + j$

-
$$\int_0^{T} 4e^{2t}e^{-st}\,dt = 4\int_0^{T} e^{-(s-2)t}\,dt = \frac{4\,(1 - e^{-(s-2)T})}{s - 2}$$

- Apply the lemma U9 to $s - 2$ instead of $s$: we need $\operatorname{Re}(s - 2) > 0$, i.e. $\operatorname{Re}s > 2$.

- At $s = 1 + j$: $\operatorname{Re}s = 1 < 2$ and $|e^{-(s-2)T}| = e^{T} \to \infty$. The integral diverges, even though the formula $4/(s-2)$ happily gives $4/(-1+j) = -2 - 2j$.

$\mathcal{L}\{4e^{2t}\} = \dfrac{4}{s-2}$, ROC $\operatorname{Re}s > 2$. At $s = 1 + j$ the integral has no value; $-2 - 2j$ is a value of the formula, not of the integral (more on this in section 10).

## 1/s as a complex function: analytic everywhere except the pole Advanced

With $F(s) = 1/s$ in hand we have the first complex function of the course. It is worth looking at it as an analytic function, because everything that follows (poles, the ROC, inversion by residues) uses this point of view.

U16 1/s as u + jv

$$\frac{1}{\sigma + j\omega} = \underbrace{\frac{\sigma}{\sigma^2 + \omega^2}}_{u(\sigma,\omega)} + j\,\underbrace{\frac{-\omega}{\sigma^2 + \omega^2}}_{v(\sigma,\omega)},\qquad \left|\frac1s\right| = \frac{1}{|s|},\quad \arg\frac1s = -\arg s$$

Cauchy–Riemann check: $u_\sigma = v_\omega = \dfrac{\omega^2 - \sigma^2}{(\sigma^2+\omega^2)^2}$ and $u_\omega = -v_\sigma = \dfrac{-2\sigma\omega}{(\sigma^2+\omega^2)^2}$. They hold everywhere except $s = 0$, so the function is analytic on $\mathbb{C}\setminus\{0\}$, with a simple pole at $s = 0$ of residue 1.

U17 Analytic continuation the formula outlives the integral

$$\underbrace{\int_0^\infty e^{-st}dt}_{\text{exists only for } \operatorname{Re}s > 0} \;=\; \frac1s \;\xrightarrow{\ \text{extend}\ }\; \underbrace{\frac1s}_{\text{exists for all } s \ne 0}$$

Analytic functions that agree on an open set (the right half-plane) have only one possible extension (the identity theorem). That is why engineers can use $1/s$ over the whole plane to find poles or draw Bode plots and root loci. Just remember that a value like $F(-1) = -1$ is not a value of the integral.

The edge of the ROC always passes through a pole. The ROC of $1/s$ stops at $\sigma = 0$ not by accident but because the pole $s = 0$ sits there. If the ROC could reach further left, the integral would be finite near $s = 0$, which contradicts $|1/s| \to \infty$. The general rule for the one-sided transform is that the ROC lies to the right of the rightmost pole (in Thai). For $1/s$ the rightmost pole is 0, so we get $\operatorname{Re}s > 0$, exactly what Euler's formula told us.

The map w = 1/s. A vertical line $\operatorname{Re}s = \sigma_0$ is sent to a circle through the origin, with centre $1/(2\sigma_0)$ and radius $1/(2\sigma_0)$. Since $\operatorname{Re}(1/s) = \sigma/|s|^2$ has the same sign as σ, the right half-plane is sent to the right half-plane: the whole ROC becomes the right half of the w-plane.

w = 1/s sends the vertical lines Re s = σ₀ in the ROC (left) to circles through the origin with centre 1/(2σ₀) (right, same colours). The smaller σ₀, the bigger the circle, and because Re(1/s) = σ/(σ² + ω²) > 0 whenever σ > 0, the right half-plane maps to the right half-plane.

To play with this, the Thai edition of this page has a mapping lab for $w = 1/z$ and the $|1/s|$ landscape over the s-plane: complex-function labs (in Thai). The controls are simple enough to use without reading the labels.

## Constant vs step in the two-sided transform: a clear difference Advanced

Signals and systems courses use the two-sided transform, which integrates from $-\infty$. The part $t < 0$ now counts too, and its condition points the other way: as $t \to -\infty$, the factor $e^{-\sigma t}$ only shrinks if $\sigma < 0$.

U18 Right vs left step

$$u(t) \leftrightarrow \frac1s,\ \operatorname{Re}s > 0 \qquad -u(-t) \leftrightarrow \frac1s,\ \operatorname{Re}s < 0$$

Same $X(s)$, different ROC, different signal. The ROC is part of the answer.

U19 Constant for all t

$$x(t) = c\ \ (-\infty < t < \infty):\quad \underbrace{\operatorname{Re}s > 0}_{t>0}\ \cap\ \underbrace{\operatorname{Re}s < 0}_{t<0} = \varnothing$$

No two-sided Laplace transform. The same goes for $\operatorname{sgn}(t) = u(t) - u(-t)$.

So the condition $\operatorname{Re}s > 0$ on $u(t)$ means more than “the integral exists”. It says the signal is right-sided: it starts at some moment and carries on into the future. The pole–zero lab (in Thai) lets you put a single pole at $s = 0$, switch to a two-sided signal, and flip the ROC between right and left to get $u(t)$ and $-u(-t)$.

## Going back: the Bromwich line must lie in the ROC Advanced

The Bromwich inversion integral (in Thai) integrates along a vertical line $\operatorname{Re}s = \gamma$, and that line has to be inside the ROC. For $1/s$ we must take $\gamma > 0$. This is where the condition $\operatorname{Re}s > 0$ comes back to do real work.

Example U-7 · Inverting with residues

### Find $f(t)$ from $\displaystyle f(t) = \frac{1}{2\pi j}\int_{\gamma - j\infty}^{\gamma + j\infty} \frac{e^{st}}{s}\,ds,\ \gamma > 0$

- $t > 0$: close the path with a large semicircle on the left (there $\operatorname{Re}s < 0$, so $e^{st}$ is small, and by Jordan's lemma the arc contributes nothing in the limit). The closed path encloses the pole $s = 0$:

$$f(t) = \operatorname{Res}_{s=0}\frac{e^{st}}{s} = \lim_{s\to 0} s\cdot\frac{e^{st}}{s} = e^{0} = 1$$

- $t < 0$: now we have to close on the right (where $e^{st}$ is small for $t < 0$). There are no poles to the right of γ, so $f(t) = 0$.

- Pick the wrong side, $\gamma < 0$ (outside the ROC of the one-sided transform), and the result flips: 0 for $t > 0$ and $-1$ for $t < 0$, which is $-u(-t)$ from U18.

$\gamma > 0$ gives $f(t) = u(t)$. Where the Bromwich line sits relative to the poles picks the signal, which is the same thing as picking the ROC.

The Bromwich line $\operatorname{Re}s = \gamma$ must lie in the ROC (to the right of the pole at 0). For t > 0 it is closed with a semicircle on the left around the pole, giving residue 1.

## Why you can't just put s = jω into 1/s to get the Fourier transform Advanced

The Fourier transform is the two-sided Laplace transform on the jω axis, provided the jω axis is inside the ROC. For $u(t)$ the jω axis is the edge of the ROC, not inside it (U13), so the Fourier integral of $u(t)$ does not converge in the ordinary sense. Using distributions (generalised functions) you get

$$\mathcal{F}\{u(t)\} = \pi\,\delta(\omega) + \frac{1}{j\omega}$$

The $1/(j\omega)$ term is the centre of the circle from section 7. The $\pi\delta(\omega)$ has to be added because $u(t)$ has a non-zero average (a DC part); it is the price of working on the edge of the ROC. For signals whose ROC already contains the jω axis, such as $e^{-2t}u(t)$ (ROC $\operatorname{Re}s > -2$), you can substitute $s = j\omega$ directly: $\mathcal{F} = 1/(j\omega + 2)$. More in the Fourier transform (in Thai).

## Re{s} > 0 in control systems: step inputs and the final value theorem Intermediate

In control, $s$ is not a frequency you read off an instrument; it is the complex variable that stands for signals of the form $e^{st}$. Feed a step input $r(t) = R_0\,u(t)$ into a transfer function $G(s)$ and you get $Y(s) = G(s)\,R_0/s$. The poles of $Y$ are the poles of $G$ plus the pole at $s = 0$ from the input, and the ROC of $Y$ lies to the right of the rightmost one.

- Stable system (poles of $G$ in the left half-plane): the rightmost pole of $Y$ is the 0 from the input, so the ROC of $Y$ is exactly $\operatorname{Re}s > 0$. The condition on $1/s$ is passed straight through.

- Final value theorem $\lim_{t\to\infty}y(t) = \lim_{s\to 0}sY(s)$ means letting $s$ approach zero from inside the ROC (along the real axis, from the positive side). It is valid when all poles of $sY(s)$ are in the left half-plane. See steady-state error (in Thai).

- Unstable system: a pole of $G$ in the right half-plane pushes the ROC of $Y$ to the right of that pole. $s \to 0$ is no longer inside the ROC, and the final value theorem gives a number that means nothing.

Example U-8 · An RC circuit on a DC supply

### $G(s) = \dfrac{5}{2s + 1}$ receives a 3 V step. Find the final output and the ROC of $Y(s)$

-
$$Y(s) = \frac{5}{2s+1}\cdot\frac{3}{s} = \frac{15}{s\,(2s + 1)},\qquad \text{poles } s = 0,\ s = -\tfrac12$$

- The rightmost pole is 0, so the ROC of $Y$ is $\operatorname{Re}s > 0$. The pole of $sY(s) = 15/(2s+1)$ is at $-\tfrac12$, in the left half-plane, so the final value theorem applies:

$$y(\infty) = \lim_{s\to 0^+} \frac{15}{2s + 1} = 15$$

- Check with partial fractions: $Y = \dfrac{15}{s} - \dfrac{15}{s + 1/2}$, so $y(t) = 15\,(1 - e^{-t/2})$, which does head to 15.

$y(\infty) = 15$ V; ROC of $Y(s)$: $\operatorname{Re}s > 0$. Change it to $G = 5/(2s - 1)$ (unstable) and the ROC becomes $\operatorname{Re}s > \tfrac12$, while $\lim_{s\to0}sY = -15$ is simply wrong, because $y(t)$ grows without bound.

Carry on in the first-order system lab (in Thai), or see how pole positions in the s-plane shape the response in time response (in Thai).

## Common mistakes

- Writing $s > 0$ when $s$ is complex. That is fine only while you are treating $s$ as real. Once $j\omega$ is involved, write $\operatorname{Re}s > 0$.

- Thinking $e^{-j\omega T} \to 0$. It doesn't: its size is always 1 (U6). Only $e^{-\sigma T}$ does the shrinking.

- Using $\ge$ instead of $>$. At $\sigma = 0$ the integral does not converge (U12, U13).

- Taking a value of the formula outside the ROC as a value of the integral. Saying $\int_0^\infty e^{-st}dt = -1$ at $s = -1$ is wrong; there the integral is infinite (U17).

- Forgetting the ROC in the two-sided transform. $1/s$ could mean $u(t)$ or $-u(-t)$ (U18).

- Applying the final value theorem to an unstable system. Check the poles of $sY(s)$ first, every time (Example U-8).

## 10 practice questions (tap to see the answer)

1. Find $\mathcal{L}\{7\}$ and its ROC
$7/s$, $\operatorname{Re}s > 0$

2. Evaluate $\mathcal{L}\{3u(t)\}$ at $s = 1 - j$
$\operatorname{Re}s = 1 > 0$, so it is valid: $\dfrac{3}{1 - j} = \dfrac{3(1 + j)}{2} = 1.5 + 1.5j$

3. Does $\int_0^\infty 4e^{-st}dt$ have a value at $s = -2 + 5j$?
No. $\operatorname{Re}s = -2 < 0$ and $|e^{-sT}| = e^{2T} \to \infty$. The $5j$ has no bearing on that.

4. Find $|e^{-sT}|$ for $s = 0.5 + 10j,\ T = 4$
$e^{-0.5\cdot 4} = e^{-2} \approx 0.1353$ (the $10j$ is irrelevant)

5. With $\sigma = 0.2$, how far must you integrate for $I(T)$ to be within 0.1 % of $c/s$?
U4: $e^{-0.2T} < 10^{-3}$, so $T > \ln 1000 / 0.2 \approx 34.54$

6. Find $\mathcal{L}\{e^{3t}\}$ and its value at $s = 4$
$\dfrac{1}{s - 3}$, $\operatorname{Re}s > 3$. At $s = 4$ it equals $1$.

7. Find $\mathcal{L}\{u(t - 2)\}$ and its ROC
$\displaystyle\int_2^\infty e^{-st}dt = \frac{e^{-2s}}{s}$, $\operatorname{Re}s > 0$ (a time shift leaves the ROC alone)

8. Does $\operatorname{sgn}(t)$ have a two-sided Laplace transform?
No. The $t > 0$ part needs $\operatorname{Re}s > 0$ and the $t < 0$ part needs $\operatorname{Re}s < 0$; the overlap is empty (U19).

9. Find the real and imaginary parts of $1/s$ at $s = 3 + 4j$
U16: $\dfrac{3}{25} - \dfrac{4}{25}j = 0.12 - 0.16j$. The real part is positive because σ is.

10. Why does $\mathcal{L}\{\cos 2t\}$ have ROC $\operatorname{Re}s > 0$ when cos doesn't grow at all?
$|\cos 2t| \le 1$ is of exponential order 0 (U15), and the poles of $s/(s^2+4)$ are at $\pm 2j$, on the jω axis. The edge of the ROC has to pass through the rightmost pole, so it is $\operatorname{Re}s > 0$. On the jω axis itself the integral oscillates without converging, just like U13.

## Further reading and references

- K. Ogata, Modern Control Engineering (5th ed.), chapter 2: definition of the Laplace transform, existence and exponential order.

- A. V. Oppenheim, A. S. Willsky, S. H. Nawab, Signals and Systems (2nd ed.), chapter 9: the ROC of the two-sided transform.

- E. Kreyszig, Advanced Engineering Mathematics: the Laplace transform and complex functions (Cauchy–Riemann equations, residue theorem).

- R. V. Churchill, J. W. Brown, Complex Variables and Applications: Euler's formula, the map 1/z and analytic continuation.

- On this site: the short article version of this page · Laplace transform calculator · inverse Laplace calculator · the full Laplace transform series (in Thai)

## Frequently asked questions

Why is the Laplace transform of a constant c equal to c/s only when s > 0?
Because the definition is an integral out to infinity: $\int_0^\infty c\,e^{-st}dt = \lim_{T\to\infty} c(1-e^{-sT})/s$. That limit is finite only when $e^{-sT}\to 0$. For real s this happens only when s > 0. At s = 0 the area is cT, which never stops growing, and for s
Why do some books write s > 0 and others Re{s} > 0?
Introductory books treat s as a real number, so s > 0 makes sense there. In the real Laplace transform $s = \sigma + j\omega$ is complex, and complex numbers cannot be ordered. The correct condition is $\operatorname{Re}s = \sigma > 0$, which reduces to s > 0 when s happens to be real.

Does the imaginary part ω play no role in convergence at all?
None, as far as absolute convergence goes. By Euler's formula $e^{-st} = e^{-\sigma t}(\cos\omega t - j\sin\omega t)$ and $|e^{-j\omega t}| = \sqrt{\cos^2\omega t + \sin^2\omega t} = 1$, so $|e^{-st}| = e^{-\sigma t}$. The size depends on σ only; ω just turns the point round. That is why the ROC is a half-plane bounded by a vertical line.

If s lies exactly on the imaginary axis, say s = jω, why doesn't the integral converge?
Because $\int_0^T e^{-j\omega t}dt = (1 - e^{-j\omega T})/(j\omega)$ keeps going round a circle of radius $1/|\omega|$ centred at $1/(j\omega)$. It stays bounded but never settles on a value. At s = 0 the area is cT, which grows without bound. So the condition has to be strictly greater than zero, not greater than or equal to.

How do a constant c and the step c·u(t) differ in the Laplace transform?
In the one-sided transform (integrating from 0) both give c/s, since they only differ for t 0, while a constant c for all time would need Re s > 0 (for the right half) and Re s
What does Re{s} > 0 have to do with control systems?
A step input R(s) = 1/s is valid in the ROC Re s > 0. Multiplying by G(s) gives a Y(s) whose ROC lies to the right of its rightmost pole. The Bromwich line used to invert it must lie in that ROC, and the final value theorem $\lim_{s\to0} sY(s)$ means letting s approach 0 from inside the ROC. It gives the right answer when all poles of sY(s) are in the left half-plane.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan, Thailand · Profile

## Frequently asked questions

**Why is the Laplace transform of a constant c equal to c/s only when s > 0?**
Because the definition is an integral out to infinity: $\int_0^\infty c\,e^{-st}dt = \lim_{T\to\infty} c(1-e^{-sT})/s$. That limit is finite only when $e^{-sT}\to 0$. For real s this happens only when s > 0. At s = 0 the area is cT, which never stops growing, and for s < 0 the function $e^{-st}$ grows exponentially.

**Why do some books write s > 0 and others Re{s} > 0?**
Introductory books treat s as a real number, so s > 0 makes sense there. In the real Laplace transform $s = \sigma + j\omega$ is complex, and complex numbers cannot be ordered. The correct condition is $\operatorname{Re}s = \sigma > 0$, which reduces to s > 0 when s happens to be real.

**Does the imaginary part ω play no role in convergence at all?**
None, as far as absolute convergence goes. By Euler's formula $e^{-st} = e^{-\sigma t}(\cos\omega t - j\sin\omega t)$ and $|e^{-j\omega t}| = \sqrt{\cos^2\omega t + \sin^2\omega t} = 1$, so $|e^{-st}| = e^{-\sigma t}$. The size depends on σ only; ω just turns the point round. That is why the ROC is a half-plane bounded by a vertical line.

**If s lies exactly on the imaginary axis, say s = jω, why doesn't the integral converge?**
Because $\int_0^T e^{-j\omega t}dt = (1 - e^{-j\omega T})/(j\omega)$ keeps going round a circle of radius $1/|\omega|$ centred at $1/(j\omega)$. It stays bounded but never settles on a value. At s = 0 the area is cT, which grows without bound. So the condition has to be strictly greater than zero, not greater than or equal to.

**How do a constant c and the step c·u(t) differ in the Laplace transform?**
In the one-sided transform (integrating from 0) both give c/s, since they only differ for t  0, while a constant c for all time would need Re s > 0 (for the right half) and Re s < 0 (for the left half) at the same time. That ROC is empty, so it has no two-sided Laplace transform.

**What does Re{s} > 0 have to do with control systems?**
A step input R(s) = 1/s is valid in the ROC Re s > 0. Multiplying by G(s) gives a Y(s) whose ROC lies to the right of its rightmost pole. The Bromwich line used to invert it must lie in that ROC, and the final value theorem $\lim_{s\to0} sY(s)$ means letting s approach 0 from inside the ROC. It gives the right answer when all poles of sY(s) are in the left half-plane.
