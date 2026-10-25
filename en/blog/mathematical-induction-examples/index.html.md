---
title: "Mathematical Induction Examples with Step-by-Step Solutions"
url: https://modsengineeringmath.com/en/blog/mathematical-induction-examples/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-17
---

> Worked examples of proof by induction: summation formulas, divisibility and inequalities, using a four-step template with the base case, the inductive step and the mistakes that cost marks.

Markdown copy of https://modsengineeringmath.com/en/blog/mathematical-induction-examples/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Mathematical Induction Examples with Step-by-Step Solutions

THภาษาไทยENEnglish
// Article · Sequences & series


Mathematical induction proves statements that must hold for every natural number n. This article collects the three kinds of example that appear most often in exams: summation formulas, divisibility and inequalities. Every one follows the same template, so you can see that only the algebra trick in the inductive step changes.

30-second summary

- Base case: show $P(n_0)$ is true by evaluating the two sides separately

- Inductive step: assume $P(k)$ is true, then show $P(k+1)$ is true, visibly using the assumption

- Both steps ⇒ $P(n)$ is true for all $n \ge n_0$, like dominoes where the first one is pushed and each one knocks over the next

## A four-step template that works every time

- Define Let $P(n)$ be the statement … (write it out clearly)

- Base case Put $n = n_0$, evaluate the left and right sides separately, and show the statement holds

- Inductive hypothesis Assume $P(k)$ is true for some integer $k \ge n_0$ (write P(k) out in full, and write the target P(k+1))

- Inductive step Start from the left side of P(k+1), rearrange it to expose the part that appears in P(k), apply the hypothesis, and rearrange until you reach the right side. Conclude by the principle of mathematical induction.

## Type 1: summation formulas

Technique: split off the last term; what remains is exactly the left side of P(k).

Example 1

### Prove that $1 + 3 + 5 + \cdots + (2n - 1) = n^2$ for every natural number $n$.

- Let $P(n)$: $1 + 3 + \cdots + (2n - 1) = n^2$

- Base case $n = 1$: left side $= 1$, right side $= 1^2 = 1$. True.

- Assume $1 + 3 + \cdots + (2k - 1) = k^2$. We must show $1 + 3 + \cdots + (2k + 1) = (k+1)^2$.

- $\underbrace{1 + 3 + \cdots + (2k - 1)}_{= k^2\ \text{(hypothesis)}} + (2k + 1) = k^2 + 2k + 1 = (k+1)^2$ ✓

By the principle of mathematical induction, $P(n)$ is true for all $n \ge 1$. ∎

Example 2

### Prove that $1\cdot2 + 2\cdot3 + \cdots + n(n+1) = \dfrac{n(n+1)(n+2)}{3}$.

- Base case $n = 1$: left side $= 1\cdot 2 = 2$, right side $= \dfrac{1\cdot2\cdot3}{3} = 2$. True.

- Assume it holds for $n = k$. We must show the sum up to the term $(k+1)(k+2)$ equals $\dfrac{(k+1)(k+2)(k+3)}{3}$.

- $\dfrac{k(k+1)(k+2)}{3} + (k+1)(k+2) = \dfrac{(k+1)(k+2)\,(k + 3)}{3}$ (factor out $(k+1)(k+2)$ instead of expanding) ✓

True for all $n \ge 1$. Tip: always write the target first, so you know which common factor to pull out.

## Type 2: divisibility

Technique: write “3 divides b” as the equation $b = 3m$, then split $f(k+1)$ to expose $f(k)$.

Example 3

### Prove that $4^n - 1$ is divisible by 3 for every natural number $n$.

- Base case $n = 1$: $4 - 1 = 3 = 3\cdot1$, divisible.

- Assume $4^k - 1 = 3m$ for some integer $m$.

- $4^{k+1} - 1 = 4\cdot 4^k - 1 = 4(4^k - 1) + 3 = 4(3m) + 3 = 3(4m + 1)$, divisible by 3 ✓

True for all $n \ge 1$. The key trick: add and subtract to create $4(4^k - 1)$, which is the hypothesis.

## Type 3: inequalities

Technique: use the hypothesis to produce the > sign, then finish with a helper inequality that needs a condition on k. That condition tells you where the base case must start.

Example 4

### Prove that $2^n > n^2$ for all $n \ge 5$.

- Why start at 5: $n = 2, 3, 4$ give $4 = 4,\ 8 < 9,\ 16 = 16$, which are false.

- Base case $n = 5$: $2^5 = 32 > 25$. True.

- Assume $2^k > k^2$ ($k \ge 5$): $2^{k+1} = 2\cdot 2^k > 2k^2$

- $2k^2 - (k+1)^2 = (k-1)^2 - 2 > 0$ for $k \ge 3$, so $2^{k+1} > 2k^2 > (k+1)^2$ ✓

True for all $n \ge 5$.

## Mistakes that cost marks

- Forgetting the base case: the false formula $1 + 2 + \cdots + n = \dfrac{n^2 + n + 2}{2}$ passes the inductive step, but at $n = 1$ it gives $2 \ne 1$.

- Generalising from examples: $n^2 + n + 41$ is prime up to $n = 39$, but $n = 40$ gives $41^2$.

- Writing the equation P(k+1) and simplifying both sides to 0 = 0: that assumes what you want to prove. Start from the left side only.

- An inductive step that fails for small k: the “all horses are the same colour” puzzle breaks at the step from 1 to 2.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The full mathematical induction lesson: strong induction, calculus, Laplace and engineering (in Thai)

- Induction checker: plug numbers into the inductive step and test your own summation formula (in Thai)

- Find the wrong line in five flawed proofs (in Thai)

- Sigma notation and the summation formulas proved by induction (in Thai)

## Frequently asked questions

How many steps does mathematical induction have?
Two main steps: the base case (show $P(n_0)$ is true) and the inductive step (assume $P(k)$ is true and show $P(k+1)$ is true). In written answers it is usually laid out in four parts: define P(n), base case, inductive hypothesis, and inductive step with the conclusion.

Must the base case always be n = 1?
No. Start at the first value where the statement is true and the inductive step keeps working. For example $2^n > n^2$ must start at $n = 5$, because it fails for $n = 2, 3, 4$.

Why does checking many values not count as a proof?
Because there are infinitely many natural numbers. For example $n^2 + n + 41$ is prime for every $n$ from 0 to 39, but at $n = 40$ it equals $1681 = 41^2$. You need an inductive step that works for every k.

Is it wrong if I prove the inductive step without using the hypothesis?
It is not logically wrong, but it means the statement could be proved directly without induction. In most exam questions, not using the hypothesis is a sign that something has gone wrong, so mark clearly the line where you use it.

## More articles worth reading

Sequences & series
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

Sequences & series
Geometric Series: Formula, Examples and How to Find the Sum
Geometric series formula for the sum of n terms and the infinite sum a₁/(1 − r) when |r| < 1, with the derivation, step-by-step examples, common…
17 Oct 2026Read the article →

Sequences & series
What Is a Taylor Series, What Is It Used For, with Examples
What a Taylor series is: Maclaurin series of eˣ, sin, cos and ln, how to find the coefficients, approximation examples with error bounds, and…
17 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**How many steps does mathematical induction have?**
Two main steps: the base case (show $P(n_0)$ is true) and the inductive step (assume $P(k)$ is true and show $P(k+1)$ is true). In written answers it is usually laid out in four parts: define P(n), base case, inductive hypothesis, and inductive step with the conclusion.

**Must the base case always be n = 1?**
No. Start at the first value where the statement is true and the inductive step keeps working. For example $2^n > n^2$ must start at $n = 5$, because it fails for $n = 2, 3, 4$.

**Why does checking many values not count as a proof?**
Because there are infinitely many natural numbers. For example $n^2 + n + 41$ is prime for every $n$ from 0 to 39, but at $n = 40$ it equals $1681 = 41^2$. You need an inductive step that works for every k.

**Is it wrong if I prove the inductive step without using the hypothesis?**
It is not logically wrong, but it means the statement could be proved directly without induction. In most exam questions, not using the hypothesis is a sign that something has gone wrong, so mark clearly the line where you use it.
