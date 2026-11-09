---
title: "Series in Precalculus: Sigma Notation, Arithmetic Series, Geometric Series, Infinite Geometric Series, and Savings and Loan Payments"
url: https://modsengineeringmath.com/learn/en/precalculus/series/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Series for precalculus: reading and writing sigma notation, properties of sigma, the formulas for Σk, Σk² and Σk³, the sum of n terms of arithmetic and geometric series, infinite geometric series and the condition |r| < 1, repeating decimals, telescoping series, the bouncing ball, savings plans and loan payments, with a partial-sum lab and a sigma calculator.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/series/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Series in Precalculus: Sigma Notation, Arithmetic Series, Geometric Series, Infinite Geometric Series, and Savings and Loan Payments

THภาษาไทยENEnglish

// Chapter 27.13 · Precalculus · Series


A series is what you get when you add up the terms of a sequence. The favourite story is of the young Gauss adding 1 to 100 in seconds by pairing the first number with the last, and that same idea gives the sum of every arithmetic series. Geometric series have their own trick, multiplying by r and subtracting, which makes almost all the middle terms cancel. This page practises sigma notation and the standard sum formulas, explains how an infinite geometric series can add forever and still give a finite value, and then uses series to compute savings plans and car or mortgage payments, the place where most people meet series in real life.

In 30 seconds

- $\sum k = \tfrac{n(n+1)}{2}$ · $\sum k^2 = \tfrac{n(n+1)(2n+1)}{6}$ · $\sum k^3 = \left[\tfrac{n(n+1)}{2}\right]^2$

- Arithmetic $S_n = \tfrac n2(a_1 + a_n)$ · geometric $S_n = a_1\tfrac{1 - r^n}{1 - r}$

- Infinite geometric $S_\infty = \tfrac{a_1}{1 - r}$ only when $|r|

- Savings $FV = R\tfrac{(1 + i)^N - 1}{i}$ · payment $R = \tfrac{PV\cdot i}{1 - (1 + i)^{-N}}$

## Sigma notation and its properties

$\sum\limits_{k=1}^{n} f(k)$ is read “the sum of f(k) for k from 1 to n”. The variable k is only a counter, and using i or j instead gives the same result. The properties of sigma let you break a complicated sum into pieces that the standard formulas handle; for example $\sum(3k - 2)$ splits into $3\sum k - \sum 2$. The one thing to watch is that the sum of a product is not the product of the sums.

S1 Sigma properties

$$\sum_{k=1}^{n} c = nc,\quad \sum (a_k \pm b_k) = \sum a_k \pm \sum b_k,\quad \sum c\,a_k = c\sum a_k$$

$\sum a_k b_k \ne \left(\sum a_k\right)\left(\sum b_k\right)$

S2 Power sums

$$\sum_{k=1}^{n} k = \frac{n(n+1)}{2},\quad \sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6},\quad \sum_{k=1}^{n} k^3 = \left[\frac{n(n+1)}{2}\right]^2$$

Example S-1 · Using sigma properties

### Find (a) $\sum\limits_{k=1}^{20}(3k - 2)$ (b) $\sum\limits_{k=1}^{10}k(k + 1)$

- (a) $3\sum k - 2\cdot20 = 3\cdot\dfrac{20\cdot21}{2} - 40 = 630 - 40$

- (b) $\sum(k^2 + k) = \dfrac{10\cdot11\cdot21}{6} + \dfrac{10\cdot11}{2} = 385 + 55$

(a) 590 · (b) 440

## Arithmetic series

Write the sum twice, once from first to last and once from last to first, and add the two lines column by column. Every column gives the same total $a_1 + a_n$, and there are n columns, so twice the sum is $n(a_1 + a_n)$. That is where the formula comes from, and it reads as “the number of terms times the average of the first and last terms”.

S3 Arithmetic series

$$S_n = \frac{n}{2}\left(a_1 + a_n\right) = \frac{n}{2}\big(2a_1 + (n - 1)d\big)$$

Example S-2 · Theatre seats

### A theatre has 20 seats in the first row, and each row has 2 more than the row in front. With 25 rows, how many seats are there?

- $a_1 = 20,\ d = 2,\ n = 25$ · $a_{25} = 20 + 24(2) = 68$

- $S_{25} = \tfrac{25}{2}(20 + 68) = \tfrac{25}{2}\cdot88$

1,100 seats

## Geometric series and infinite series

Let $S_n = a_1 + a_1r + \cdots + a_1r^{n-1}$. Multiplying both sides by r gives $rS_n = a_1r + \cdots + a_1r^n$, and subtracting cancels every middle term, leaving $S_n - rS_n = a_1 - a_1r^n$, which gives the formula. When $|r|

S4 Geometric series

$$S_n = a_1\frac{1 - r^n}{1 - r} = a_1\frac{r^n - 1}{r - 1}\quad (r \ne 1)$$

S5 Infinite geometric

$$\sum_{n=1}^{\infty} a_1 r^{n-1} = \frac{a_1}{1 - r}\quad \iff\ |r|
S6 Telescoping

$$\sum_{k=1}^{n}\frac{1}{k(k+1)} = \sum_{k=1}^{n}\left(\frac1k - \frac{1}{k+1}\right) = 1 - \frac{1}{n+1}$$

Example S-3 · Finite and infinite geometric

### (a) $3 + 6 + 12 + \cdots + 3\cdot2^9$ (b) $8 + 4 + 2 + 1 + \cdots$

- (a) $a_1 = 3,\ r = 2,\ n = 10$: $S_{10} = 3\cdot\dfrac{2^{10} - 1}{2 - 1} = 3\cdot1023$

- (b) $a_1 = 8,\ r = \tfrac12$: $S_\infty = \dfrac{8}{1 - 1/2}$

(a) 3,069 · (b) 16

Example S-4 · Repeating decimals

### Write $0.\overline{45}$ and $0.1\overline{2}$ as fractions

- $0.\overline{45} = \tfrac{45}{100} + \tfrac{45}{100^2} + \cdots = \dfrac{45/100}{1 - 1/100} = \dfrac{45}{99}$

- $0.1\overline{2} = \tfrac{1}{10} + \left(\tfrac{2}{100} + \tfrac{2}{1000} + \cdots\right) = \tfrac{1}{10} + \dfrac{2/100}{1 - 1/10} = \tfrac{1}{10} + \tfrac{2}{90}$

$\tfrac{5}{11}$ and $\tfrac{11}{90}$

Example S-5 · A bouncing ball

### A ball is dropped from 10 m, and each time it hits the floor it bounces back to ¾ of its previous height. How far does it travel in total before it stops?

- The first drop is 10 m; after that every bounce has an equal up and down

- Bounce heights: $7.5 + 5.625 + \cdots = \dfrac{7.5}{1 - 3/4} = 30$

- Total distance $10 + 2(30)$

70 m

## Savings plans and loan payments

If you deposit the same amount every period, the first deposit earns compound interest for the longest time and the last one earns none, so the total is a geometric series with ratio $1 + i$, where i is the interest rate per period. A loan works the other way round: the amount borrowed must equal the present value of all the payments added together. These two formulas cover mortgages, car loans and retirement plans.

S7 Savings (future value)

$$FV = R\left[1 + (1+i) + \cdots + (1+i)^{N-1}\right] = R\,\frac{(1 + i)^N - 1}{i}$$

S8 Loan payment

$$PV = R\,\frac{1 - (1 + i)^{-N}}{i}\quad\Rightarrow\quad R = \frac{PV\cdot i}{1 - (1 + i)^{-N}}$$

i = annual rate ÷ periods per year · N = total number of payments

Example S-6 · Saving every month

### You deposit 1,000 a month at 3% a year compounded monthly for 5 years. How much do you have at the end?

- $i = 0.03/12 = 0.0025,\ N = 60$

- $FV = 1000\cdot\dfrac{1.0025^{60} - 1}{0.0025}$

≈ 64,646.71 (you paid in 60,000, so interest ≈ 4,646.71)

Example S-7 · A car loan

### You borrow 500,000 at 6% a year, repaid monthly over 5 years. What is the monthly payment?

- $i = 0.005,\ N = 60$

- $R = \dfrac{500000\cdot0.005}{1 - 1.005^{-60}}$

≈ 9,666.40 a month (total paid ≈ 579,984)

## Series lab: terms, partial sums, sigma and loans

The blue bars are the individual terms and the orange line is the partial sum $S_k$. In geometric mode, try r = 0.5 and then 1.05 to see the difference between a series that converges and one that diverges. Sigma mode lets you type any f(k), such as 1/(k(k+1)) or 2^k, and gives the sum as an exact fraction whenever it can.

JavaScript is needed for the lab

Common trapsApplying $S_\infty = \tfrac{a_1}{1 - r}$ with r = 2 and getting −a₁, which means nothing · miscounting terms when the sum does not start at 1 (from k = m to n there are n − m + 1 terms) · and using the annual rate instead of the rate per period in the loan formula.

## Practice (with answers)

1Sum of the even numbers from 2 to 200
100 terms · $\tfrac{100}{2}(2 + 200)$
10,100

2$\sum\limits_{k=1}^{6} 2^k$
$2\cdot\tfrac{2^6 - 1}{2 - 1}$
126

3$\sum\limits_{n=1}^{\infty}\left(\tfrac23\right)^n$
$a_1 = \tfrac23,\ r = \tfrac23$
2

4$\sum\limits_{k=1}^{99}\dfrac{1}{k(k+1)}$
Telescoping: $1 - \tfrac{1}{100}$
$\tfrac{99}{100}$

5An infinite geometric series has sum 12 and first term 4. Find r
$\tfrac{4}{1 - r} = 12$
$r = \tfrac23$

6$\sum\limits_{k=1}^{10}k^3$
$\left(\tfrac{10\cdot11}{2}\right)^2 = 55^2$
3,025

## Read next

- 27.14 Counting and probability

- Geometric series formula → Convergence test flowchart

- Radius of convergence — when the ratio r becomes a power of x

## Frequently asked questions

When does an infinite geometric series have a sum?
Only when |r|
How do series turn a repeating decimal into a fraction?
Write the repeating decimal as an infinite geometric series. For example 0.454545… = 45/100 + 45/10000 + …, with a₁ = 45/100 and r = 1/100, so the sum is (45/100)/(99/100) = 45/99 = 5/11.

How can I remember the formulas for Σk² and Σk³?
Σk = n(n + 1)/2 is the sum from 1 to n, and Σk³ = [n(n + 1)/2]² is exactly the square of Σk. For Σk² = n(n + 1)(2n + 1)/6, remember three factors n, n + 1, 2n + 1 divided by 6, and check that n = 1 gives 1.

Where does the monthly loan payment formula come from?
From a geometric series. The present values of all the payments R must add up to the loan: PV = R[(1 + i)⁻¹ + (1 + i)⁻² + … + (1 + i)⁻ᴺ], which sums to R(1 − (1 + i)⁻ᴺ)/i. Solving for R gives the payment.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**When does an infinite geometric series have a sum?**
Only when |r| < 1. Then rⁿ approaches zero, so the partial sum a₁(1 − rⁿ)/(1 − r) approaches a₁/(1 − r). If |r| ≥ 1 the terms do not shrink to zero and the sum approaches no value: the series diverges.

**How do series turn a repeating decimal into a fraction?**
Write the repeating decimal as an infinite geometric series. For example 0.454545… = 45/100 + 45/10000 + …, with a₁ = 45/100 and r = 1/100, so the sum is (45/100)/(99/100) = 45/99 = 5/11.

**How can I remember the formulas for Σk² and Σk³?**
Σk = n(n + 1)/2 is the sum from 1 to n, and Σk³ = [n(n + 1)/2]² is exactly the square of Σk. For Σk² = n(n + 1)(2n + 1)/6, remember three factors n, n + 1, 2n + 1 divided by 6, and check that n = 1 gives 1.

**Where does the monthly loan payment formula come from?**
From a geometric series. The present values of all the payments R must add up to the loan: PV = R[(1 + i)⁻¹ + (1 + i)⁻² + … + (1 + i)⁻ᴺ], which sums to R(1 − (1 + i)⁻ᴺ)/i. Solving for R gives the payment.
