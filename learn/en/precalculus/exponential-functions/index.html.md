---
title: "Exponential Functions: Graphs, Growth and Decay, Compound Interest, the Number e, Half-Life and Exponential Equations"
url: https://modsengineeringmath.com/learn/en/precalculus/exponential-functions/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Exponential functions f(x) = bˣ on one page: graphs for b > 1 and 0 < b < 1, the horizontal asymptote, transformations, growth and decay models, annual, monthly and continuous compound interest, where the number e comes from, half-life, doubling time, exponential equations and inequalities, with a lab for interest and radioactive decay.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/exponential-functions/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Exponential Functions: Graphs, Growth and Decay, Compound Interest, the Number e, Half-Life and Exponential Equations

THภาษาไทยENEnglish

// Chapter 27.7 · Precalculus · Exponential Functions


A linear function grows by adding the same amount again and again, while an exponential function grows by multiplying by the same factor again and again. At first the two can look close, but before long the multiplying one leaves the adding one far behind. This is the mathematics of compound interest, the spread of an infection, population growth and the discharge of a capacitor in an RC circuit. The page starts with the two shapes of the graph of $b^x$, explains where the number e comes from, and then uses it to compute interest and half-lives and to solve equations in which the unknown sits in the exponent.

In 30 seconds

- $f(x) = b^x$, $b > 0,\ b \ne 1$ · domain $\mathbb R$ · range $(0, \infty)$ · passes through (0, 1) and (1, b)

- $b > 1$ growth · $0

- Compound interest $A = P(1 + r/n)^{nt}$ · continuous $A = Pe^{rt}$

- Half-life $N = N_0(1/2)^{t/T}$ · doubling time $t_2 = \ln 2 / \ln(1 + r)$

- $b^u = b^v \iff u = v$ · inequalities: a base below 1 flips the sign

## Definition and graphs of bˣ

Each time x increases by one unit, $b^x$ is multiplied by b, and that property is what separates exponential functions from polynomials. When b is greater than 1 the graph hugs the x-axis on the left and shoots up on the right; when b is between 0 and 1 the picture is reversed. Both kinds pass through (0, 1) because $b^0 = 1$, and neither ever touches the x-axis, since a power of a positive base is always positive. Note that $\left(\tfrac12\right)^x = 2^{-x}$, so the graph for base ½ is the reflection of the graph for base 2 in the y-axis.

E1 Exponential function

$$f(x) = b^x,\ b > 0,\ b \ne 1:\quad D = \mathbb R,\ \ R = (0, \infty),\ \ \text{HA } y = 0$$

E2 Growth vs decay

$$b > 1:\ \text{increasing},\qquad 0
E3 Transformed

$$y = a\,b^{\,x - h} + k:\quad \text{HA } y = k,\ \ R = (k, \infty) \text{ if } a > 0$$

Example E-1 · Reading the graph from the equation

### Give the asymptote, y-intercept and range of $y = 3\cdot2^{x+1} - 4$

- Compare with E3: $a = 3,\ b = 2,\ h = -1,\ k = -4$

- Asymptote $y = -4$, and because $a > 0$ the graph lies above it

- y-intercept: $3\cdot2^{1} - 4 = 2$

HA $y = -4$ · passes through (0, 2) · range $(-4, \infty)$

## Growth, compound interest and the number e

If a quantity grows by r percent per period, after t periods it equals $A_0(1 + r)^t$. Compound interest is the special case in which the annual rate is split into n periods a year. The more often interest is compounded, the sooner interest starts earning interest of its own, but the result does not grow without limit: it approaches $Pe^{rt}$, and that is where the number e turns up in everyday life.

E4 Growth model

$$A(t) = A_0(1 + r)^t\ \ (\text{growth}),\qquad A(t) = A_0(1 - r)^t\ \ (\text{decay})$$

E5 Compound interest

$$A = P\left(1 + \frac{r}{n}\right)^{nt}$$

P principal · r annual rate (as a decimal) · n periods per year · t years

E6 The number e

$$e = \lim_{n\to\infty}\left(1 + \frac1n\right)^n \approx 2.71828,\qquad A = Pe^{rt}$$

Example E-2 · Three ways to compound

### Deposit 10,000 at 5% a year for 10 years and compare annual, monthly and continuous compounding

- Annual: $10000(1.05)^{10} \approx 16{,}288.95$

- Monthly: $10000\left(1 + \tfrac{0.05}{12}\right)^{120} \approx 16{,}470.09$

- Continuous: $10000e^{0.05\times10} = 10000e^{0.5} \approx 16{,}487.21$

16,288.95 · 16,470.09 · 16,487.21: more frequent compounding pays more, but it approaches the ceiling $Pe^{rt}$

Example E-3 · Doubling time

### A city of 1.2 million grows 3% a year. When will its population double?

- $1.2(1.03)^t = 2.4 \Rightarrow 1.03^t = 2$

- Use logarithms (page 27.8): $t = \dfrac{\ln 2}{\ln 1.03} \approx 23.45$ years

- Compare with the rule of 72: $72/3 = 24$ years, very close

About 23.4 years (the answer does not depend on the starting population)

## Decay and half-life

Exponential decay happens when the rate of decrease is proportional to the amount that remains: a radioactive isotope, a drug in the bloodstream, or the voltage of a capacitor discharging through a resistor. The half-life is the time needed to fall by half, and it is the same every time, whatever amount you start from. In electric circuits the time constant τ is used instead, and the half-life equals $\tau\ln 2 \approx 0.693\tau$.

E7 Half-life

$$N(t) = N_0\left(\tfrac12\right)^{t/T_{1/2}} = N_0 e^{-kt},\qquad k = \frac{\ln 2}{T_{1/2}}$$

E8 RC discharge

$$v(t) = V_0 e^{-t/\tau},\quad \tau = RC,\quad v(\tau) \approx 0.368\,V_0$$

Example E-4 · Carbon-14

### Carbon-14 has a half-life of about 5,730 years. (a) What percentage is left after 10,000 years? (b) How old is a sample with 25% left?

- (a) $\left(\tfrac12\right)^{10000/5730} = 0.5^{1.7452} \approx 0.2983$

- (b) $25\% = \left(\tfrac12\right)^2$, so two half-lives have passed: $2 \times 5730$

(a) about 29.8% · (b) about 11,460 years

## Exponential equations and inequalities

If both sides can be written with the same base, compare the exponents directly, because $b^x$ is one-to-one. If they cannot, take logarithms of both sides as on page 27.8. Equations that mix $b^{2x}$ and $b^x$ become quadratics after the substitution $u = b^x$. For inequalities, look at the base: a base greater than 1 keeps the direction, a base between 0 and 1 reverses it.

E9 Same base

$$b^u = b^v \iff u = v$$

E10 Inequalities

$$b > 1:\ b^u > b^v \iff u > v,\qquad 0 b^v \iff u
Example E-5 · Matching the bases

### Solve $4^{x+1} = 8^{2x-1}$

- Write both in base 2: $2^{2(x+1)} = 2^{3(2x-1)}$

- $2x + 2 = 6x - 3 \Rightarrow 4x = 5$

$x = \tfrac54$

Example E-6 · Substitution

### Solve $9^x - 4\cdot3^x + 3 = 0$

- $9^x = (3^x)^2$; let $u = 3^x > 0$: $u^2 - 4u + 3 = 0 \Rightarrow (u - 1)(u - 3) = 0$

- $3^x = 1 \Rightarrow x = 0$ · $3^x = 3 \Rightarrow x = 1$

$x = 0$ or $x = 1$

Example E-7 · An inequality with base below 1

### Solve $\left(\tfrac12\right)^{x-1} > 8$

- $8 = \left(\tfrac12\right)^{-3}$, so $\left(\tfrac12\right)^{x-1} > \left(\tfrac12\right)^{-3}$

- The base ½ is less than 1, so the direction flips: $x - 1

$x

## Exponential lab: graph · interest · half-life

In graph mode, drag a, b and k and compare with $e^x$, drawn dashed; watch the graph switch from decay to growth as b crosses 1. Interest mode puts simple interest, compound interest for the period you choose and continuous compounding on one graph, together with the effective annual rate (EAR) and the doubling time. Half-life mode marks the points where ½, ¼, ⅛ and 1/16 remain.

JavaScript is needed for the lab

Common trapsEntering r = 5 instead of 0.05 in the interest formula · thinking $2^{x+3} = 2^x + 2^3$ (it is $2^x \cdot 2^3$) · forgetting to flip an inequality when the base is below 1 · and keeping a negative value of $u = 3^x$, which is impossible.

## Practice (with answers)

1Solve $27^{x} = 9^{x + 2}$
$3^{3x} = 3^{2x + 4}$
$x = 4$

2Solve $2^{2x} - 6\cdot2^x + 8 = 0$
$u^2 - 6u + 8 = 0 \Rightarrow u = 2, 4$
$x = 1,\ 2$

3A car costs 800,000 and depreciates 15% a year. What is it worth after 4 years?
$800000(0.85)^4$
About 417,605

4Solve $3^{x^2 - 2x} \le 27$
$x^2 - 2x \le 3 \Rightarrow (x - 3)(x + 1) \le 0$
$-1 \le x \le 3$

5A substance falls to 1/8 of its amount in 30 days. What is its half-life?
$1/8 = (1/2)^3$, so three half-lives have passed
10 days

## Read next

- 27.8 Logarithmic functions — the tool for equations whose bases cannot be matched

- Savings plans and loan payments — compound interest combined with a geometric series

- Laplace transform table — where $e^{-at}$ becomes $1/(s + a)$ in circuit analysis

## Frequently asked questions

Why must the base of an exponential function be positive and not 1?
With a negative base, values such as (−2)^(1/2) are not real numbers, so the graph would break into scattered points. With base 1 you get 1^x = 1 for every x, a constant function with no inverse. The conditions b > 0 and b ≠ 1 make the graph continuous and one-to-one.

Where does the number e come from?
e ≈ 2.718 is the limit of (1 + 1/n)^n as n grows. You can read it as the value of 1 dollar at 100% annual interest compounded more and more often until it is continuous. e is also the only base for which the slope of the graph of e^x equals the value of the function, which is why it is the standard base in calculus and engineering.

How much difference does monthly versus annual compounding make?
Not much at low rates, but it adds up over time. 10,000 at 5% a year for 10 years grows to 16,288.95 with annual compounding, 16,470.09 with monthly compounding and 16,487.21 with continuous compounding. Compounding more often always helps, but it has a ceiling given by Pe^(rt).

What is half-life and how is it calculated?
Half-life is the time it takes for a quantity to fall to half, whatever amount you start with. The amount left is N = N₀(1/2)^(t/T), where T is the half-life. Carbon-14 has a half-life of about 5,730 years, so after 10,000 years about 29.8% of the original remains.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why must the base of an exponential function be positive and not 1?**
With a negative base, values such as (−2)^(1/2) are not real numbers, so the graph would break into scattered points. With base 1 you get 1^x = 1 for every x, a constant function with no inverse. The conditions b > 0 and b ≠ 1 make the graph continuous and one-to-one.

**Where does the number e come from?**
e ≈ 2.718 is the limit of (1 + 1/n)^n as n grows. You can read it as the value of 1 dollar at 100% annual interest compounded more and more often until it is continuous. e is also the only base for which the slope of the graph of e^x equals the value of the function, which is why it is the standard base in calculus and engineering.

**How much difference does monthly versus annual compounding make?**
Not much at low rates, but it adds up over time. 10,000 at 5% a year for 10 years grows to 16,288.95 with annual compounding, 16,470.09 with monthly compounding and 16,487.21 with continuous compounding. Compounding more often always helps, but it has a ceiling given by Pe^(rt).

**What is half-life and how is it calculated?**
Half-life is the time it takes for a quantity to fall to half, whatever amount you start with. The amount left is N = N₀(1/2)^(t/T), where T is the half-life. Carbon-14 has a half-life of about 5,730 years, so after 10,000 years about 29.8% of the original remains.
