---
title: "Sequences in Precalculus: Arithmetic Sequences, Geometric Sequences, the nth Term Formula, Recursive Sequences and the Graph of a Sequence"
url: https://modsengineeringmath.com/learn/en/precalculus/sequences/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Sequences for precalculus seen as functions and graphs: a sequence is a function on the counting numbers, arithmetic sequences lie on a line, geometric sequences lie on an exponential curve, nth term formulas, finding terms from two known terms, arithmetic and geometric means, recursive sequences, Fibonacci and a first look at limits, with a lab that plots the points (n, aₙ).

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/sequences/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Sequences in Precalculus: Arithmetic Sequences, Geometric Sequences, the nth Term Formula, Recursive Sequences and the Graph of a Sequence

THภาษาไทยENEnglish

// Chapter 27.12 · Precalculus · Sequences


A sequence is a special kind of function whose inputs are only the counting numbers 1, 2, 3 and so on, so its graph is a row of separate dots rather than a continuous curve. Seen this way, an arithmetic sequence is a linear function sampled at whole numbers, and a geometric sequence is an exponential function sampled the same way. This page uses that point of view to explain nth term formulas, how to find terms from partial information, means, recursive sequences and what happens when n becomes very large, which is the groundwork for series on the next page and for limits in calculus.

In 30 seconds

- Arithmetic $a_n = a_1 + (n - 1)d$ · the points $(n, a_n)$ lie on a line of slope d

- Geometric $a_n = a_1 r^{n-1}$ · the points lie on an exponential curve (when r > 0)

- $a_n = a_m + (n - m)d$ · $a_n = a_m r^{n - m}$ find terms from two known terms

- a, b, c arithmetic ⇔ $2b = a + c$ · geometric ⇔ $b^2 = ac$

- $|r|

## A sequence is a function on the counting numbers

A sequence $a_1, a_2, a_3, \dots$ can be given in two ways. An explicit formula gives $a_n$ directly from n, such as $a_n = n^2$. A recursive rule gives the first term and a way to build the next one, such as $a_1 = 1,\ a_{n+1} = a_n + 2n + 1$, which is in fact the same sequence. To find an explicit formula from the first few terms, look at the differences or ratios of neighbouring terms: constant differences mean arithmetic, constant ratios mean geometric, and constant second differences mean a quadratic.

Q1 Sequence

$$a: \{1, 2, 3, \dots\} \to \mathbb R,\quad n \mapsto a_n$$

A finite sequence has a last term · an infinite sequence does not

## Arithmetic sequences

An arithmetic sequence rises or falls by the same amount d at every step, like a salary that goes up by the same sum each year, or theatre rows in which each row has two more seats than the one in front. The formula $a_n = a_1 + (n - 1)d$ can be rewritten as $a_n = dn + (a_1 - d)$, which is the equation of a line of slope d. That is why the points of an arithmetic sequence line up in the lab.

Q2 Arithmetic sequence

$$a_n = a_1 + (n - 1)d,\qquad d = a_{n+1} - a_n,\qquad a_n = a_m + (n - m)d$$

Q3 Arithmetic mean

$$a, b, c \text{ arithmetic} \iff b = \frac{a + c}{2}$$

Inserting k numbers between a and b: $d = \tfrac{b - a}{k + 1}$

Example Q-1 · Terms from two known terms

### An arithmetic sequence has $a_3 = 11$ and $a_{10} = 39$. Find $a_1,\ d$ and $a_{25}$

- From $a_{10} = a_3 + 7d$: $39 = 11 + 7d \Rightarrow d = 4$

- $a_1 = a_3 - 2d = 11 - 8 = 3$

- $a_{25} = 3 + 24(4) = 99$

$a_1 = 3,\ d = 4,\ a_{25} = 99$

Example Q-2 · Counting terms

### How many terms does 7, 11, 15, …, 403 have?

- $a_1 = 7,\ d = 4$; set $a_n = 403$: $7 + (n - 1)4 = 403$

- $n - 1 = 99 \Rightarrow n = 100$

100 terms

## Geometric sequences

A geometric sequence multiplies by the same factor r at every step; a population growing 3% a year is multiplied by 1.03 each year. If r lies between −1 and 1 the terms shrink toward zero, and if r is negative the signs alternate. Seeing these behaviours on a dot plot helps a lot in deciding whether the infinite series on the next page converges.

Q4 Geometric sequence

$$a_n = a_1 r^{n-1},\qquad r = \frac{a_{n+1}}{a_n},\qquad a_n = a_m r^{n - m}$$

Q5 Geometric mean

$$a, b, c \text{ geometric} \iff b^2 = ac,\qquad \frac{a + c}{2} \ge \sqrt{ac}\ \ (a, c > 0)$$

Example Q-3 · Geometric from two terms

### A geometric sequence has $a_2 = 6$ and $a_5 = 162$. Find $a_1,\ r$ and $a_8$

- $a_5 = a_2 r^3 \Rightarrow r^3 = 27 \Rightarrow r = 3$

- $a_1 = 6/3 = 2$ · $a_8 = 2\cdot3^7 = 2\cdot2187$

$a_1 = 2,\ r = 3,\ a_8 = 4{,}374$

Example Q-4 · Inserting geometric means

### Insert three geometric means between 2 and 162

- The sequence has 5 terms $2, \_, \_, \_, 162$, so $162 = 2r^4 \Rightarrow r^4 = 81 \Rightarrow r = \pm3$

6, 18, 54 or −6, 18, −54 (both are correct)

## Recursive sequences and Fibonacci

The linear recurrence $a_{n+1} = pa_n + q$ turns up constantly: a loan balance that is charged interest and then reduced by a payment every month, or the amount of a drug in the body when part of it is cleared and a new dose is added every day. Such a sequence has a fixed point L with $L = pL + q$, and if $|p|

Q6 Linear recurrence

$$a_{n+1} = pa_n + q\ (p \ne 1):\quad L = \frac{q}{1 - p},\qquad a_n = L + (a_1 - L)p^{\,n-1}$$

Q7 Fibonacci

$$F_1 = F_2 = 1,\ F_{n+2} = F_{n+1} + F_n,\qquad \frac{F_{n+1}}{F_n} \to \varphi = \frac{1 + \sqrt5}{2}$$

Example Q-5 · Closed form of a recurrence

### $a_1 = 2,\ a_{n+1} = 3a_n - 2$. Find an explicit formula

- Fixed point: $L = 3L - 2 \Rightarrow L = 1$

- $a_n = 1 + (2 - 1)3^{n-1} = 1 + 3^{n-1}$

- Check: $a_2 = 3(2) - 2 = 4 = 1 + 3$ ✓ · $a_3 = 3(4) - 2 = 10 = 1 + 9$ ✓

$a_n = 1 + 3^{n-1}$ (|p| = 3 > 1, so the sequence runs away from its fixed point)

## A first look at limits of sequences

Asking which value a sequence approaches as n gets very large is where calculus begins. If it approaches a single value L, the sequence converges; otherwise it diverges. For a ratio of polynomials, divide by the highest power of n, just as you would to find the horizontal asymptote of a rational function, because a sequence is a function looked at only at whole numbers.

Q8 Basic limits

$$\lim_{n\to\infty}\frac1n = 0,\qquad \lim_{n\to\infty} r^n = 0\ \ (|r|
Example Q-6 · Dividing by the highest power

### Find $\lim\limits_{n\to\infty}\dfrac{3n^2 + 1}{2n^2 - n}$

- Divide top and bottom by $n^2$: $\dfrac{3 + 1/n^2}{2 - 1/n}$

- As $n \to \infty$, every term with n in the denominator goes to 0

$\tfrac32$ (the sequence converges)

## Sequence lab: the points (n, aₙ)

Choose a type of sequence, drag a₁ and d or r, and watch how the points line up. The dashed curve is the continuous function the points sit on (a line for arithmetic, an exponential for geometric when r > 0). Try r = −0.8 to see alternating signs shrinking toward zero, and recursive mode to see the fixed-point line L that the points flow toward when |p| < 1.

JavaScript is needed for the lab

Common trapsUsing $a_n = a_1 + nd$ (forgetting the −1) · computing r as $a_1/a_2$ upside down · and giving a single value of r when $r^4 = 81$ or $r^2 = 9$, where both the positive and the negative value must be considered.

## Practice (with answers)

1Explicit formula for 5, 2, −1, −4, …
$d = -3$
$a_n = 8 - 3n$

2Explicit formula for 3, −6, 12, −24, …
$r = -2$
$a_n = 3(-2)^{n-1}$

3x, x + 4, 3x is arithmetic. Find x
$2(x + 4) = x + 3x$
$x = 4$

4x, x + 3, x + 9 is geometric. Find x
$(x + 3)^2 = x(x + 9) \Rightarrow 6x + 9 = 9x$
$x = 3$ (the sequence 3, 6, 12)

5A starting salary of 15,000 a month rises by 500 each year. What is the monthly salary in year 10?
$15000 + 9(500)$
19,500

6$a_1 = 0,\ a_{n+1} = 0.5a_n + 100$. What does it converge to?
$L = \tfrac{100}{1 - 0.5}$
200

## Read next

- 27.13 Series — adding up the terms of a sequence

- Sequences and series roadmap — ε–N limits, the squeeze theorem, monotone sequences and beyond

- Mathematical induction examples — proving the explicit formula of a recursive sequence

## Frequently asked questions

What is the difference between an arithmetic and a geometric sequence?
An arithmetic sequence gets each next term by adding a constant d, for example 3, 7, 11, 15. A geometric sequence gets it by multiplying by a constant r, for example 2, 6, 18, 54. Plotting the points (n, aₙ), an arithmetic sequence lies on a line of slope d and a geometric sequence lies on an exponential curve.

How can I tell whether three numbers form an arithmetic or a geometric sequence?
a, b, c are arithmetic when 2b = a + c (the middle term is the arithmetic mean of its neighbours) and geometric when b² = ac (the middle term is the geometric mean). These tests are quicker than finding d or r.

What is a recursive sequence?
A recursive sequence gives the first term and a rule that builds each term from the previous ones, for example a₁ = 2, aₙ₊₁ = 3aₙ − 2. Arithmetic and geometric sequences can also be written recursively. The linear recurrence aₙ₊₁ = p·aₙ + q has the closed form aₙ = L + (a₁ − L)pⁿ⁻¹ with L = q/(1 − p).

Where can I go deeper into sequences?
The sequences and series roadmap on this site continues from here to the ε–N definition of a limit, the squeeze theorem, bounded monotone sequences and second-order recurrences, and proofs by mathematical induction.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between an arithmetic and a geometric sequence?**
An arithmetic sequence gets each next term by adding a constant d, for example 3, 7, 11, 15. A geometric sequence gets it by multiplying by a constant r, for example 2, 6, 18, 54. Plotting the points (n, aₙ), an arithmetic sequence lies on a line of slope d and a geometric sequence lies on an exponential curve.

**How can I tell whether three numbers form an arithmetic or a geometric sequence?**
a, b, c are arithmetic when 2b = a + c (the middle term is the arithmetic mean of its neighbours) and geometric when b² = ac (the middle term is the geometric mean). These tests are quicker than finding d or r.

**What is a recursive sequence?**
A recursive sequence gives the first term and a rule that builds each term from the previous ones, for example a₁ = 2, aₙ₊₁ = 3aₙ − 2. Arithmetic and geometric sequences can also be written recursively. The linear recurrence aₙ₊₁ = p·aₙ + q has the closed form aₙ = L + (a₁ − L)pⁿ⁻¹ with L = q/(1 − p).

**Where can I go deeper into sequences?**
The sequences and series roadmap on this site continues from here to the ε–N definition of a limit, the squeeze theorem, bounded monotone sequences and second-order recurrences, and proofs by mathematical induction.
