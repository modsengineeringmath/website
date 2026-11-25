---
title: "Why Does ℒ{1} = 1/s Come With the Condition Re(s) > 0?"
url: https://modsengineeringmath.com/en/blog/why-laplace-transform-needs-re-s-greater-than-zero/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-25
---

> Why do the Laplace transforms c/s and 1/s only hold for Re(s) > 0? Why ω doesn't matter and why the jω axis fails, explained briefly with Euler's formula.

Markdown copy of https://modsengineeringmath.com/en/blog/why-laplace-transform-needs-re-s-greater-than-zero/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Why Does ℒ{1} = 1/s Come With the Condition Re(s) > 0?

THภาษาไทยENEnglish
// Article · Laplace Transform


I get asked this almost every semester. Students have $\mathcal{L}\{1\} = 1/s$ memorised by the end of week one, but ask where the little $\operatorname{Re}(s) > 0$ after it comes from and the room goes quiet for a while. Here is the shortest honest answer I can give. If you want every step, with labs you can drag around, the full lesson is the place to go.

The 30-second version

- The definition is an integral to infinity. You only get $1/s$ if $e^{-sT}$ dies away as $T$ gets large.

- Euler's formula splits $e^{-st}$ into a shrinking part $e^{-\sigma t}$ and a rotating part $e^{-j\omega t}$, whose size is always 1.

- So σ alone decides: you need $\sigma = \operatorname{Re}(s) > 0$, and ω can be anything.

## Start from the definition

An integral with infinity as its upper limit really means: integrate up to $T$, then see whether the answer settles down as $T$ keeps growing. Do that for a constant $c$ (or $c\,u(t)$, which gives the same thing in the one-sided transform):

$$\int_0^{T} c\,e^{-st}\,dt = \frac{c}{s} - \frac{c}{s}\,e^{-sT}$$

The first term is the answer we all remember. The second is left over, and it has to disappear. If it doesn't, we have no right to say the result is $c/s$. So everything comes down to one question: when does $e^{-sT}$ go to zero?

For real $s$ that is easy. With $s > 0$ it decays, with $s = 0$ it stays at 1 (and the area $cT$ never stops growing), and with $s < 0$ it grows exponentially. That is why plenty of first-year books write $s > 0$ and leave it there.

## Once s is complex, Euler does the work

The catch is that in the real Laplace transform $s = \sigma + j\omega$, and you can't ask whether a complex number is bigger than zero. Is $2 + 3j > 0$? The question doesn't mean anything. So we pull $e^{-st}$ apart instead, using Euler's formula $e^{-j\theta} = \cos\theta - j\sin\theta$:

$$e^{-st} = e^{-\sigma t}\,e^{-j\omega t},\qquad |e^{-j\omega t}| = \sqrt{\cos^2\omega t + \sin^2\omega t} = 1$$

That line is the whole story. The $e^{-j\omega t}$ part just goes round the unit circle; it never shrinks and never grows. The size of $e^{-sT}$ is therefore $e^{-\sigma T}$ and nothing else, which goes to zero exactly when $\sigma > 0$. That is where $\operatorname{Re}(s) > 0$ comes from, and it is also why the ROC is a right half-plane with a vertical edge: moving ω up or down changes nothing.

A quick numerical check: at $s = 2 + 3j$, $\mathcal{L}\{5\} = 5/(2+3j) = \tfrac{10}{13} - \tfrac{15}{13}j$. Split it into the integrals of $e^{-2t}\cos 3t$ and $e^{-2t}\sin 3t$, integrate each by parts, and you land on exactly the same numbers.

## What about the line Re(s) = 0?

This is where people slip, because at $s = j\omega$ nothing blows up. The integral up to $T$ is $(1 - e^{-j\omega T})/(j\omega)$, which keeps going round a circle of radius $1/|\omega|$ and never stops anywhere. Bounded, but no limit. At $s = 0$ it grows in a straight line. So the condition has to be “greater than”, not “greater than or equal to”. The pictures below show the path of the partial integral $I(T)$ in the complex plane for all three cases.

σ > 0 spirals in to 1/s · σ = 0 goes round a circle · σ < 0 spirals out

## Why bother, if the exam only wants the formula?

Because the condition keeps coming back. When you invert with the Bromwich integral, the line you integrate along has to sit inside the ROC. When you use the final value theorem (in Thai) in control, letting $s \to 0$ means approaching zero from inside the ROC; if the system is unstable, the ROC gets pushed to the right and the theorem hands you a wrong number. And in signals and systems, the same $1/s$ can mean $u(t)$ or $-u(-t)$, depending on the ROC.

If you want to drag $s$ around the plane and watch the Euler spiral turn, the lab is in lesson 8.6. And if complex numbers still feel shaky, complex variables and analytic functions (in Thai) is a good place to shore them up first.

## Keep learning

- Why s > 0 and Re{s} > 0: the full lesson with proofs and labs

- The Laplace transform: definition and table of pairs with ROC (in Thai)

- Pole–zero diagrams and the region of convergence (in Thai)

- Laplace transform calculator

## Frequently asked questions

What is the difference between s > 0 and Re(s) > 0?
If s is real they say the same thing. In the Laplace transform, though, s = σ + jω is complex, and a complex number cannot be compared with zero. The condition that can be written correctly is Re(s) = σ > 0.

Why doesn't ω affect convergence?
Because $e^{-st} = e^{-\sigma t}e^{-j\omega t}$ and $|e^{-j\omega t}| = 1$ always, so the size of $e^{-st}$ is just $e^{-\sigma t}$. ω makes it rotate, never shrink.

Why is Re(s) = 0 not allowed when nothing actually blows up there?
At s = jω the integral up to T keeps going round a circle and never settles on a value, so there is no limit. At s = 0 the area is cT, which grows without bound. That is why the condition has to be strictly greater than zero.

## More articles worth reading

Laplace
How to Find the Inverse Laplace Transform: 3 Partial-Fraction Cases with Examples
Invert the Laplace transform with partial fractions for distinct, repeated and complex poles, with checked examples and what to do when the…
16 Oct 2026Read the article →

Laplace
Laplace Transform Table: The Most Commonly Used Pairs
The 15 most common Laplace transform pairs and a table of properties (time shift, frequency shift, derivative, integral, convolution, initial and…
16 Oct 2026Read the article →

Laplace
What Is the Laplace Transform and What Is It Used For?
The Laplace transform turns differential equations into algebraic equations. See the definition, the 3-step method, a worked y′ + 3y = 6 example…
16 Oct 2026Read the article →

All 4 articles in Laplace Transform → · All articles

## Frequently asked questions

**What is the difference between s > 0 and Re(s) > 0?**
If s is real they say the same thing. In the Laplace transform, though, s = σ + jω is complex, and a complex number cannot be compared with zero. The condition that can be written correctly is Re(s) = σ > 0.

**Why doesn't ω affect convergence?**
Because $e^{-st} = e^{-\sigma t}e^{-j\omega t}$ and $|e^{-j\omega t}| = 1$ always, so the size of $e^{-st}$ is just $e^{-\sigma t}$. ω makes it rotate, never shrink.

**Why is Re(s) = 0 not allowed when nothing actually blows up there?**
At s = jω the integral up to T keeps going round a circle and never settles on a value, so there is no limit. At s = 0 the area is cT, which grows without bound. That is why the condition has to be strictly greater than zero.
