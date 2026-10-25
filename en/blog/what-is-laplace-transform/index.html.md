---
title: "What Is the Laplace Transform and What Is It Used For?"
url: https://modsengineeringmath.com/en/blog/what-is-laplace-transform/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> The Laplace transform turns differential equations into algebraic equations. See the definition, the 3-step method, a worked y′ + 3y = 6 example and an RC circuit calculated line by line.

Markdown copy of https://modsengineeringmath.com/en/blog/what-is-laplace-transform/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is the Laplace Transform and What Is It Used For?

THภาษาไทยENEnglish
// Article · Laplace Transform


The Laplace transform is a tool that turns a hard differential equation into an easy algebraic equation, then converts the answer back into a function of time. This article explains the idea, the definition and an RC circuit example you can follow line by line.

30-second summary

- Definition: $F(s)=\mathcal{L}\{f(t)\}=\int_0^{\infty} f(t)e^{-st}\,dt$

- Differentiation in the time domain becomes multiplication by $s$ in the $s$ domain

- Method: transform → solve the algebraic equation → inverse transform

- The pole locations of $F(s)$ tell you the stability of the system without solving the equation

## The idea: why transform at all

Suppose a circuit or mechanical system is described by a differential equation such as $y' + 3y = 6$. Solving it directly needs an integrating factor or a guessed solution. But if we move the equation into the $s$ domain, the derivatives disappear and only multiplication and addition remain. Solve there, then move back.

Compare this with using logarithms to multiply large numbers in the old days: turn multiplication into addition, finish the calculation, then convert back. Laplace does the same for derivatives and integrals.

## Definition of the Laplace transform

For a function $f(t)$ defined for $t \ge 0$, the unilateral Laplace transform is

$$F(s) = \mathcal{L}\{f(t)\} = \int_0^{\infty} f(t)\,e^{-st}\,dt, \qquad s = \sigma + j\omega$$

The factor $e^{-st}$ acts like a filter: an $f(t)$ that grows more slowly than an exponential makes the integral converge. The most basic example is

$$\mathcal{L}\{e^{-at}\} = \int_0^{\infty} e^{-(s+a)t}\,dt = \frac{1}{s+a}, \qquad \operatorname{Re}(s) > -a$$

From this, $a=0$ gives $\mathcal{L}\{u(t)\}=1/s$. Other commonly used formulas are collected in the Laplace transform table.

## The key: derivatives become multiplication

Integrating by parts gives the property that makes Laplace most useful.

$$\mathcal{L}\{y'(t)\} = sY(s) - y(0), \qquad \mathcal{L}\{y''(t)\} = s^2Y(s) - s\,y(0) - y'(0)$$

Notice that the initial conditions $y(0)$, $y'(0)$ go into the equation from the start. You do not have to find constants afterwards, as in the traditional method for differential equations.

## Solving an equation with Laplace in 3 steps

- Transform both sides of the differential equation into the $s$ domain, including the initial conditions.

- Solve for $Y(s)$ with algebra.

- Invert to $y(t)$ using partial fractions and a table (see Inverse Laplace by partial fractions).

## Example 1: solve y′ + 3y = 6 with y(0) = 0

- Transform the equation

$$sY(s) - 0 + 3Y(s) = \frac{6}{s}$$

- Solve for $Y(s)$

$$Y(s)\,(s+3) = \frac{6}{s} \;\Rightarrow\; Y(s) = \frac{6}{s(s+3)}$$

- Split into partial fractions

$$\frac{6}{s(s+3)} = \frac{2}{s} - \frac{2}{s+3}$$

- Invert using $\mathcal{L}^{-1}\{1/s\}=1$ and $\mathcal{L}^{-1}\{1/(s+3)\}=e^{-3t}$

$$y(t) = 2 - 2e^{-3t}, \quad t \ge 0$$

Check: $y' = 6e^{-3t}$, so $y' + 3y = 6e^{-3t} + 6 - 6e^{-3t} = 6$ ✓ and $y(0)=2-2=0$ ✓

## Example 2: an RC circuit with a 5 V step input

A resistor $R = 1\,\text{k}\Omega$ in series with a capacitor $C = 100\,\mu\text{F}$ is driven by $v_{in}(t) = 5\,u(t)$ volts. The capacitor starts empty. The time constant is $\tau = RC = 1000 \times 100\times10^{-6} = 0.1$ seconds.

- The circuit equation $RC\,\dfrac{dv_c}{dt} + v_c = v_{in}$ transforms to the $s$ domain with $v_c(0)=0$

$$(RCs + 1)V_c(s) = \frac{5}{s} \;\Rightarrow\; V_c(s) = \frac{5}{s(0.1s+1)} = \frac{50}{s(s+10)}$$

- Partial fractions

$$\frac{50}{s(s+10)} = \frac{5}{s} - \frac{5}{s+10}$$

- Invert

$$v_c(t) = 5\left(1 - e^{-10t}\right)\ \text{V}$$

At $t = \tau = 0.1$ s the capacitor voltage is $5(1 - e^{-1}) \approx 3.16$ V (about 63.2 % of 5 V), matching the definition of the time constant. The pole is at $s=-10 = -1/\tau$.

## What Laplace is used for in engineering

- Electric circuit analysis: RC, RL and RLC circuits with switches or step sources, giving both the transient response and the steady state.

- Transfer functions: $G(s)=Y(s)/U(s)$ describes every linear time-invariant system, from motors to filters.

- Stability: if all poles lie in the left half of the $s$ plane, the system is stable (continued in the Routh–Hurwitz criterion and root locus).

- Control systems: designing PID controllers and compensators, and analysing the frequency response.

## Common mistakes

- Forgetting the initial conditions when transforming a derivative, which makes the whole answer wrong.

- Forgetting that the unilateral transform only covers $t \ge 0$, so the answer must be written with $t \ge 0$ or multiplied by $u(t)$.

- Confusing $s$ with $\omega$: in the time domain there is no $j$, but in the $s$ domain the oscillation frequency is the imaginary part of the pole.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The Laplace transform: definition and transform-pair table with ROC (in Thai)

- All the properties of the Laplace transform (in Thai)

- Solving first- and second-order differential equations with Laplace, with an interactive solver (in Thai)

- First-order system lab: the time constant of RC and RL circuits (in Thai)

## Frequently asked questions

How does the Laplace transform differ from the Fourier transform?
Laplace uses the complex variable $s = \sigma + j\omega$, so it can handle signals that grow or decay exponentially, and initial conditions. Fourier uses only $j\omega$. If the region of convergence (ROC) includes the $j\omega$ axis, the Fourier transform is the Laplace transform with $s = j\omega$.

What is the unilateral Laplace transform, and why integrate from 0?
In circuits and control we usually care about events from $t = 0$ onward, and the effect of earlier conditions is captured in the initial conditions. The unilateral transform therefore integrates from 0 to infinity. The bilateral transform integrates from $-\infty$ and is used in signals and systems when the ROC must be analysed in full.

Do I always have to transform back to a function of time?
Not always. If you only want stability or the shape of the response, the pole locations of $F(s)$ tell you directly. But to get $y(t)$ at a specific time you must invert the transform, usually with partial fractions and a table.

What are the units and meaning of the variable s?
$s$ has units of frequency (1/second). The real part $\sigma$ gives the exponential growth or decay rate, and the imaginary part $\omega$ is the oscillation frequency. For example, a pole at $s = -10$ means a signal decaying as $e^{-10t}$.

## More articles worth reading

Laplace
How to Find the Inverse Laplace Transform: 3 Partial-Fraction Cases with Examples
Invert the Laplace transform with partial fractions for distinct, repeated and complex poles, with checked examples and what to do when the…
16 Oct 2026Read the article →

Laplace
Laplace Transform Table: The Most Commonly Used Pairs
The 15 most common Laplace transform pairs and a table of properties (time shift, frequency shift, derivative, integral, convolution, initial and…
16 Oct 2026Read the article →

Sequences & series
What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)
Laurent series vs Taylor series: negative powers, the principal part, the annulus of convergence, types of singularity, residues and the link to…
24 Oct 2026Read the article →

All 3 articles in Laplace Transform → · All articles

## Frequently asked questions

**How does the Laplace transform differ from the Fourier transform?**
Laplace uses the complex variable $s = \sigma + j\omega$, so it can handle signals that grow or decay exponentially, and initial conditions. Fourier uses only $j\omega$. If the region of convergence (ROC) includes the $j\omega$ axis, the Fourier transform is the Laplace transform with $s = j\omega$.

**What is the unilateral Laplace transform, and why integrate from 0?**
In circuits and control we usually care about events from $t = 0$ onward, and the effect of earlier conditions is captured in the initial conditions. The unilateral transform therefore integrates from 0 to infinity. The bilateral transform integrates from $-\infty$ and is used in signals and systems when the ROC must be analysed in full.

**Do I always have to transform back to a function of time?**
Not always. If you only want stability or the shape of the response, the pole locations of $F(s)$ tell you directly. But to get $y(t)$ at a specific time you must invert the transform, usually with partial fractions and a table.

**What are the units and meaning of the variable s?**
$s$ has units of frequency (1/second). The real part $\sigma$ gives the exponential growth or decay rate, and the imaginary part $\omega$ is the oscillation frequency. For example, a pole at $s = -10$ means a signal decaying as $e^{-10t}$.
