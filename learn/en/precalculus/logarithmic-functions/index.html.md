---
title: "Logarithmic Functions: Definition, Laws of Logarithms, Change of Base, Graphs, Equations, Inequalities and Logarithmic Scales"
url: https://modsengineeringmath.com/learn/en/precalculus/logarithmic-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Logarithms on one page: a log is an exponent, the graph of y = log_b x as the reflection of bˣ, the domain x > 0, the product, quotient and power rules, change of base, common log and ln, solving exponential equations with logs, rejecting extraneous solutions, log inequalities, and the pH, decibel and Richter scales, with a calculator that shows the working.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/logarithmic-functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Logarithmic Functions: Definition, Laws of Logarithms, Change of Base, Graphs, Equations, Inequalities and Logarithmic Scales

THภาษาไทยENEnglish

// Chapter 27.8 · Precalculus · Logarithmic Functions


A logarithm answers one question: which power? For example, $\log_2 8 = 3$ because 2 must be raised to the power 3 to give 8. Seen this way, every law of logarithms is just a law of exponents written backwards, and the graph of a logarithm is the graph of an exponential reflected in the line $y = x$. This page uses that idea to explain the laws, change of base, how to solve equations with the unknown in the exponent, how to spot extraneous solutions, and the scales used to measure sound, acidity and earthquakes.

In 30 seconds

- $\log_b x = y \iff b^y = x$ · requires $b > 0,\ b \ne 1,\ x > 0$

- $\log(MN) = \log M + \log N$ · $\log\tfrac MN = \log M - \log N$ · $\log M^p = p\log M$

- Change of base $\log_b x = \dfrac{\ln x}{\ln b} = \dfrac{\log x}{\log b}$

- After solving, check that every log in the original equation is still defined

- Inequalities: base > 1 keeps the direction · base between 0 and 1 flips it

## Definition and graph of a logarithm

Because $b^x$ is one-to-one, it has an inverse, and that inverse is $\log_b x$. Every feature of the graph therefore comes from swapping x and y in the exponential: the domain becomes $(0, \infty)$, the range becomes all real numbers, the point (0, 1) becomes (1, 0), and the horizontal asymptote $y = 0$ becomes the vertical asymptote $x = 0$. Logarithms grow very slowly: even when x reaches a million, $\log_{10} x$ is only 6, which is exactly why they are used to build scales for quantities with a huge range.

L1 Definition

$$\log_b x = y \iff b^y = x,\qquad b > 0,\ b \ne 1,\ x > 0$$

$\log x = \log_{10} x$ · $\ln x = \log_e x$ · $\log_2$ is common in computer science

L2 Basic values

$$\log_b 1 = 0,\quad \log_b b = 1,\quad \log_b b^x = x,\quad b^{\log_b x} = x$$

L3 Graph

$$y = \log_b x:\ D = (0, \infty),\ R = \mathbb R,\ \text{VA } x = 0,\ (1, 0),\ (b, 1)$$

## Laws of logarithms

The three laws translate the laws of exponents into the language of logs: multiplying powers of the same base adds the exponents, so the log of a product is the sum of the logs. Before calculators, engineers multiplied long numbers by adding logs from printed tables. The change-of-base formula lets you evaluate a log to any base with the log or ln key on a calculator.

L4 Laws

$$\log_b(MN) = \log_b M + \log_b N,\quad \log_b\tfrac{M}{N} = \log_b M - \log_b N,\quad \log_b M^p = p\log_b M$$

L5 Change of base

$$\log_b x = \frac{\log_a x}{\log_a b} = \frac{\ln x}{\ln b}$$

L6 Useful identities

$$\log_b a \cdot \log_a b = 1,\qquad \log_{b^n} a^m = \frac{m}{n}\log_b a,\qquad a^{\log_b c} = c^{\log_b a}$$

Example L-1 · Evaluating logs

### Find (a) $\log_8 32$ (b) $\log_{1/3} 27$ (c) $\log_3 7$ as a decimal

- (a) Write both in base 2: $\log_{2^3} 2^5 = \tfrac53$ (L6)

- (b) $\left(\tfrac13\right)^y = 27 = 3^3 = \left(\tfrac13\right)^{-3}$, so −3

- (c) Change of base: $\dfrac{\ln 7}{\ln 3} = \dfrac{1.94591}{1.09861}$

(a) $\tfrac53$ · (b) $-3$ · (c) $\approx 1.7712$

Example L-2 · Expanding and condensing

### (a) Expand $\log\dfrac{100x^3}{\sqrt y}$ (b) Write $2\ln x - \ln(x + 1) + 3\ln 2$ as a single ln

- (a) $\log 100 + \log x^3 - \log y^{1/2} = 2 + 3\log x - \tfrac12\log y$

- (b) $\ln x^2 - \ln(x + 1) + \ln 2^3 = \ln\dfrac{8x^2}{x + 1}$

(a) $2 + 3\log x - \tfrac12\log y$ · (b) $\ln\dfrac{8x^2}{x + 1}$

## Exponential and logarithmic equations

When x sits in an exponent, take logs of both sides and use the power law to bring x down. When x sits inside a log, combine the logs into a single one and rewrite it as a power using the definition. Every time you combine logs, go back to the original equation and check that each log is defined at your answer, because combining quietly widens the domain.

L7 Solving with logs

$$A\,b^{kx} = C \ \Rightarrow\ x = \frac{\ln(C/A)}{k\ln b},\qquad \frac{C}{A} > 0$$

L8 Log equations

$$\log_b u = \log_b v \iff u = v\ \ (u, v > 0),\qquad \log_b u = c \iff u = b^c$$

Example L-3 · Rejecting an extraneous solution

### Solve $\log_2 x + \log_2(x - 2) = 3$

- Domain: $x > 0$ and $x > 2$, so $x > 2$

- Combine: $\log_2\big(x(x - 2)\big) = 3 \Rightarrow x^2 - 2x = 8$

- $(x - 4)(x + 2) = 0 \Rightarrow x = 4$ or $-2$ · reject −2, which is outside the domain

$x = 4$ (check: $\log_2 4 + \log_2 2 = 2 + 1 = 3$)

Example L-4 · When the bases cannot be matched

### Solve (a) $3^{2x} = 7$ (b) $3\cdot2^x = 48$

- (a) $2x\ln 3 = \ln 7 \Rightarrow x = \dfrac{\ln 7}{2\ln 3} \approx 0.8856$

- (b) Divide by 3 first: $2^x = 16 = 2^4$

(a) $\approx 0.8856$ · (b) $x = 4$

## Logarithmic inequalities

Log inequalities have two traps. The first is the domain: every log must be defined. The second is the base: if the base is less than 1 the function is decreasing, and the direction of the inequality flips when you remove the log. The final answer is the intersection of these two conditions.

L9 Log inequalities

$$b > 1:\ \log_b u > \log_b v \iff u > v > 0,\qquad 0
Example L-5 · A base below 1

### Solve $\log_{1/2}(x - 1) > -2$

- Domain: $x - 1 > 0 \Rightarrow x > 1$

- $-2 = \log_{1/2} 4$ because $\left(\tfrac12\right)^{-2} = 4$ · base ½ flips the sign: $x - 1

- Combine the conditions: $1

$(1,\ 5)$

## Logarithmic scales: pH, decibels and Richter

When a quantity ranges over many powers of ten, a log turns multiplication into addition, so one step on the scale means multiplying by a fixed factor. In electrical engineering decibels are used every day for gain, noise and the Bode plots of control systems.

L10 Log scales

$$\text{pH} = -\log[\text{H}^+],\qquad L_{\text{dB}} = 10\log\frac{P}{P_0} = 20\log\frac{V}{V_0},\qquad M = \log\frac{A}{A_0}$$

Example L-6 · pH and decibels

### (a) A solution has $[\text{H}^+] = 3.2\times10^{-4}$ mol/L. What is its pH? (b) By how many dB does the level rise when sound power doubles, and when it grows 1,000 times?

- (a) $-\log(3.2\times10^{-4}) = -(\log 3.2 - 4) = 4 - 0.505$

- (b) $10\log 2 \approx 3.01$ dB · $10\log 1000 = 30$ dB

(a) pH ≈ 3.49 · (b) ≈ 3 dB and 30 dB

## Log lab: graph · calculate · solve

Graph mode draws $\log_b x$ together with $b^x$ so you can see the reflection in $y = x$; try b between 0 and 1 to get a decreasing graph. Calculate mode accepts inputs like 1/9, sqrt(2) or e^3 and gives an exact answer when the result is a fraction. Solve mode shows the three steps of formula L7.

JavaScript is needed for the lab

Common traps$\log(a + b) \ne \log a + \log b$ · $\dfrac{\log a}{\log b} \ne \log\dfrac ab$ · $(\log x)^2 \ne 2\log x$ · and forgetting that the answer must make every log in the original problem defined.

## Practice (with answers)

1$\log_4 8 + \log_9 27$
$\tfrac32 + \tfrac32$
3

2If $\log 2 = a$ and $\log 3 = b$, write $\log 72$ in terms of a and b
$72 = 2^3\cdot3^2$
$3a + 2b$

3Solve $\ln(x + 3) - \ln x = \ln 4$
$\tfrac{x + 3}{x} = 4 \Rightarrow x = 1$, which is in the domain
$x = 1$

4Solve $5^{x} = 2^{x+1}$
$x\ln5 = (x + 1)\ln 2 \Rightarrow x(\ln5 - \ln2) = \ln2$
$x = \dfrac{\ln 2}{\ln 2.5} \approx 0.7565$

5Solve $\log_3(2x - 1) \le 2$
Domain $x > \tfrac12$ · $2x - 1 \le 9$
$\tfrac12
6An amplifier has a voltage gain of 50. What is that in dB?
$20\log 50$
≈ 33.98 dB

## Read next

- 27.9 Trigonometric functions — the family of periodic functions

- What is the Laplace transform? — exponentials and logs at work in circuit and control analysis

## Frequently asked questions

What is the difference between log and ln?
In high-school books and on calculators, log x with no base written means base 10, while ln x is the logarithm to base e ≈ 2.718. Calculus uses ln because the derivative of ln x is exactly 1/x. The two are related by change of base: ln x = log x / log e ≈ 2.3026 log x.

Why do solutions of log equations need checking?
Combining several logs into one widens the domain. For example, log₂x + log₂(x − 2) = 3 becomes x(x − 2) = 8, giving x = 4 and x = −2, but x = −2 makes log₂x undefined and must be rejected. A value produced by the algebra that lies outside the domain is called an extraneous solution.

Is log(a + b) equal to log a + log b?
No. The correct law is log(ab) = log a + log b: a product becomes a sum. There is no rule for splitting log(a + b). For example, log(1 + 1) = log 2 ≈ 0.301, but log 1 + log 1 = 0.

Why are logarithmic scales used?
For quantities with an enormous range, such as sound intensities that differ by factors of a trillion, or hydrogen ion concentrations that span many powers of ten. Logs bring the numbers into a readable range and turn multiplication into addition: increasing power ten times means adding 10 dB.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between log and ln?**
In high-school books and on calculators, log x with no base written means base 10, while ln x is the logarithm to base e ≈ 2.718. Calculus uses ln because the derivative of ln x is exactly 1/x. The two are related by change of base: ln x = log x / log e ≈ 2.3026 log x.

**Why do solutions of log equations need checking?**
Combining several logs into one widens the domain. For example, log₂x + log₂(x − 2) = 3 becomes x(x − 2) = 8, giving x = 4 and x = −2, but x = −2 makes log₂x undefined and must be rejected. A value produced by the algebra that lies outside the domain is called an extraneous solution.

**Is log(a + b) equal to log a + log b?**
No. The correct law is log(ab) = log a + log b: a product becomes a sum. There is no rule for splitting log(a + b). For example, log(1 + 1) = log 2 ≈ 0.301, but log 1 + log 1 = 0.

**Why are logarithmic scales used?**
For quantities with an enormous range, such as sound intensities that differ by factors of a trillion, or hydrogen ion concentrations that span many powers of ten. Logs bring the numbers into a readable range and turn multiplication into addition: increasing power ten times means adding 10 dB.
