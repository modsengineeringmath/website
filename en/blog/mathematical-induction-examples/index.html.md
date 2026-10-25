---
title: "Mathematical Induction Examples with Step-by-Step Solutions, Including Strong Induction"
url: https://modsengineeringmath.com/en/blog/mathematical-induction-examples/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> 14 worked proof-by-induction examples: writing the induction statement P(n), sums, divisibility, inequalities, recurrences and strong induction, with a four-step template and common mistakes.

Markdown copy of https://modsengineeringmath.com/en/blog/mathematical-induction-examples/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Mathematical Induction Examples with Step-by-Step Solutions, Including Strong Induction

THภาษาไทยENEnglish
// Article · Sequences & series


Mathematical induction proves statements that must hold for every natural number n. This article starts with how to write the induction statement P(n), then works through 14 examples of the kinds that appear most often in exams: summation formulas, divisibility, inequalities, recurrences and derivatives, and strong induction. Every one follows the same template, so you can see that only the algebra trick in the inductive step changes.

30-second summary

- Induction statement: write $P(n)$ as a sentence that is true or false for each n

- Base case: show $P(n_0)$ is true by evaluating the two sides separately

- Inductive step: assume $P(k)$ is true, then show $P(k+1)$ is true, visibly using the assumption

- Strong induction: assume every case up to $P(k)$ when the step needs an earlier case, and check one base case for each step you reach back

## The induction statement P(n): what to write first

Every proof by induction starts by naming the statement to be proved. $P(n)$ is a sentence about $n$ that becomes true or false once a number is put in. Writing it out in full is not a formality: you substitute $k$ and $k+1$ into it in the next steps, and most algebra mistakes come from a careless P(k+1).

| The question says | Induction statement P(n) | Starts at |

| The sum of the first n odd numbers is n² | $1 + 3 + \cdots + (2n - 1) = n^2$ | $n = 1$ |

| $4^n - 1$ is a multiple of 3 | there is an integer $m$ with $4^n - 1 = 3m$ | $n = 1$ |

| $2^n$ eventually beats $n^2$ | $2^n > n^2$ | $n = 5$ |

| The sequence $a_1 = 1,\ a_{n+1} = 2a_n + 1$ has a closed form | $a_n = 2^n - 1$ | $n = 1$ |

- A statement, not an expression. “Let $P(n) = n^2 + n$” is not an induction statement because it has no truth value. Write “$P(n)$: $n^2 + n$ is even”.

- Build P(k+1) by replacing every n with k+1, including the last term of a sum: the last term of $1 + 3 + \cdots + (2n - 1)$ becomes $2(k+1) - 1 = 2k + 1$, and the right side becomes $(k+1)^2$.

- Write the target P(k+1) before you start the algebra. Knowing where you must end up tells you which factor to pull out or which term to add and subtract.

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

Example 3

### Prove that $1^2 + 2^2 + \cdots + n^2 = \dfrac{n(n+1)(2n+1)}{6}$.

- Base case $n = 1$: left side $= 1$, right side $= \dfrac{1\cdot2\cdot3}{6} = 1$. True.

- Assume $1^2 + \cdots + k^2 = \dfrac{k(k+1)(2k+1)}{6}$. Target: $1^2 + \cdots + (k+1)^2 = \dfrac{(k+1)(k+2)(2k+3)}{6}$.

- $\dfrac{k(k+1)(2k+1)}{6} + (k+1)^2 = \dfrac{(k+1)\big[k(2k+1) + 6(k+1)\big]}{6} = \dfrac{(k+1)(2k^2 + 7k + 6)}{6}$

- $2k^2 + 7k + 6 = (k+2)(2k+3)$, so the sum equals $\dfrac{(k+1)(k+2)(2k+3)}{6}$ ✓

True for all $n \ge 1$. The target told us to look for the factors $(k+2)$ and $(2k+3)$ in the bracket.

## Type 2: divisibility

Technique: write “3 divides b” as the equation $b = 3m$, then split $f(k+1)$ to expose $f(k)$.

Example 4

### Prove that $4^n - 1$ is divisible by 3 for every natural number $n$.

- Base case $n = 1$: $4 - 1 = 3 = 3\cdot1$, divisible.

- Assume $4^k - 1 = 3m$ for some integer $m$.

- $4^{k+1} - 1 = 4\cdot 4^k - 1 = 4(4^k - 1) + 3 = 4(3m) + 3 = 3(4m + 1)$, divisible by 3 ✓

True for all $n \ge 1$. The key trick: add and subtract to create $4(4^k - 1)$, which is the hypothesis.

Example 5

### Prove that $7^n - 2^n$ is divisible by 5 for every natural number $n$.

- Base case $n = 1$: $7 - 2 = 5$, divisible.

- Assume $7^k - 2^k = 5m$ for some integer $m$.

- $7^{k+1} - 2^{k+1} = 7\cdot7^k - 2\cdot2^k = 7(7^k - 2^k) + 7\cdot2^k - 2\cdot2^k = 7(5m) + 5\cdot2^k = 5(7m + 2^k)$ ✓

True for all $n \ge 1$. With two different bases, add and subtract $7\cdot2^k$ so that one bracket is exactly $f(k)$.

Example 6

### Prove that $n^3 - n$ is divisible by 6 for every natural number $n$.

- Base case $n = 1$: $1 - 1 = 0 = 6\cdot0$, divisible.

- Assume $k^3 - k = 6m$.

- $(k+1)^3 - (k+1) = k^3 + 3k^2 + 3k + 1 - k - 1 = (k^3 - k) + 3k(k+1) = 6m + 3k(k+1)$

- $k(k+1)$ is a product of two consecutive integers, so it is even: $k(k+1) = 2j$. Then $3k(k+1) = 6j$ and the total is $6(m + j)$ ✓

True for all $n \ge 1$. The step needs one extra fact (consecutive integers include an even number); state it clearly instead of hiding it.

## Type 3: inequalities

Technique: use the hypothesis to produce the > sign, then finish with a helper inequality that needs a condition on k. That condition tells you where the base case must start.

Example 7

### Prove that $2^n > n^2$ for all $n \ge 5$.

- Why start at 5: $n = 2, 3, 4$ give $4 = 4,\ 8 < 9,\ 16 = 16$, which are false.

- Base case $n = 5$: $2^5 = 32 > 25$. True.

- Assume $2^k > k^2$ ($k \ge 5$): $2^{k+1} = 2\cdot 2^k > 2k^2$

- $2k^2 - (k+1)^2 = (k-1)^2 - 2 > 0$ for $k \ge 3$, so $2^{k+1} > 2k^2 > (k+1)^2$ ✓

True for all $n \ge 5$.

Example 8

### Prove that $n! > 2^n$ for all $n \ge 4$.

- Why start at 4: $1! = 1 < 2,\ 2! = 2 < 4,\ 3! = 6 < 8$, but $4! = 24 > 16$.

- Base case $n = 4$: $24 > 16$. True.

- Assume $k! > 2^k$ ($k \ge 4$): $(k+1)! = (k+1)\cdot k! > (k+1)\cdot 2^k$

- Since $k + 1 \ge 5 > 2$: $(k+1)\cdot2^k > 2\cdot 2^k = 2^{k+1}$ ✓

True for all $n \ge 4$. This is why the terms $x^n/n!$ of the exponential series shrink so fast.

Example 9 · Bernoulli's inequality

### Prove that $(1 + x)^n \ge 1 + nx$ for every natural number $n$ and every real $x \ge -1$.

- Base case $n = 1$: $1 + x \ge 1 + x$. True.

- Assume $(1 + x)^k \ge 1 + kx$.

- Multiply both sides by $1 + x$, which is allowed without flipping the sign because $1 + x \ge 0$: $(1 + x)^{k+1} \ge (1 + x)(1 + kx) = 1 + (k+1)x + kx^2$

- $kx^2 \ge 0$, so $(1 + x)^{k+1} \ge 1 + (k+1)x$ ✓

True for all $n \ge 1$, $x \ge -1$. The condition $x \ge -1$ is used in exactly one line: multiplying an inequality by $1 + x$.

## Type 4: recurrences and nth derivatives

Technique: the definition of the sequence (or of the derivative) is the bridge from k to k+1. Guess the pattern from the first few terms, then prove it by induction.

Example 10

### $a_1 = 1,\ a_{n+1} = 2a_n + 1$. Prove that $a_n = 2^n - 1$.

- First terms: $1, 3, 7, 15, \dots$, one less than $2, 4, 8, 16$, which suggests $2^n - 1$.

- Base case $n = 1$: $a_1 = 1 = 2^1 - 1$. True.

- Assume $a_k = 2^k - 1$: $a_{k+1} = 2a_k + 1 = 2(2^k - 1) + 1 = 2^{k+1} - 1$ ✓

$a_n = 2^n - 1$ for all $n \ge 1$. This is the number of moves in the Tower of Hanoi with n discs.

Example 11 · Calculus

### Prove that $\dfrac{d^n}{dx^n}\big(xe^x\big) = (x + n)e^x$ for every natural number $n$.

- Base case $n = 1$: product rule, $\dfrac{d}{dx}(xe^x) = e^x + xe^x = (x + 1)e^x$. True.

- Assume $\dfrac{d^k}{dx^k}(xe^x) = (x + k)e^x$.

- $\dfrac{d^{k+1}}{dx^{k+1}}(xe^x) = \dfrac{d}{dx}\big[(x + k)e^x\big] = e^x + (x + k)e^x = (x + k + 1)e^x$ ✓

True for all $n \ge 1$. At $x = 0$ the nth derivative is $n$, which gives the Maclaurin series $xe^x = \sum_{n\ge1} \dfrac{x^n}{(n-1)!}$; see what the Taylor series is.

## Strong induction examples

In strong induction (also called complete induction) the hypothesis is that every case $P(n_0), P(n_0 + 1), \dots, P(k)$ is true, not only $P(k)$. It proves exactly the same kind of result; it simply lets the step use an earlier case. Use it when getting to $k+1$ needs $P(k-1)$, $P(k-3)$ or some smaller case you cannot name in advance.

Example 12 · Strong induction

### Prove that every integer $n \ge 2$ is a prime or a product of primes.

- Base case $n = 2$: 2 is prime. True.

- Strong hypothesis: assume every integer $j$ with $2 \le j \le k$ is a prime or a product of primes.

- Consider $k + 1$. If it is prime, we are done. If not, $k + 1 = ab$ with $2 \le a \le k$ and $2 \le b \le k$.

- By the hypothesis, $a$ and $b$ are each a prime or a product of primes, so $ab = k + 1$ is a product of primes ✓

True for all $n \ge 2$. Ordinary induction fails here: knowing about $k$ tells you nothing about the factors of $k + 1$, which can be any smaller numbers.

Example 13 · Strong induction

### Using only 3-cent and 5-cent stamps, show that every postage of $n \ge 8$ cents can be made exactly.

- Base cases (three of them): $8 = 3 + 5,\ 9 = 3 + 3 + 3,\ 10 = 5 + 5$

- Strong hypothesis: let $k \ge 10$ and assume every amount from 8 to $k$ cents can be made.

- $k + 1 = (k - 2) + 3$, and $8 \le k - 2 \le k$, so $k - 2$ can be made by the hypothesis. Add one 3-cent stamp ✓

Every amount from 8 cents up can be made (7 cents cannot). The step reaches back 3 places, so it needs 3 base cases; with only $n = 8$ checked, the step from 8 to 9 would rely on $9 - 3 = 6$, which was never shown.

Example 14 · Strong induction on a recurrence

### $a_1 = 1,\ a_2 = 5,\ a_n = a_{n-1} + 2a_{n-2}$ for $n \ge 3$. Prove that $a_n = 2^n + (-1)^n$.

- Base cases (two, because the recurrence uses two previous terms): $a_1 = 2 - 1 = 1$ and $a_2 = 4 + 1 = 5$. True.

- Strong hypothesis: let $k \ge 2$ and assume $a_j = 2^j + (-1)^j$ for every $j \le k$.

- $a_{k+1} = a_k + 2a_{k-1} = 2^k + (-1)^k + 2\big(2^{k-1} + (-1)^{k-1}\big) = 2^{k+1} + (-1)^{k-1}\big(-1 + 2\big)$

- $= 2^{k+1} + (-1)^{k-1} = 2^{k+1} + (-1)^{k+1}$ ✓ (check: $a_3 = 7,\ a_4 = 17,\ a_5 = 31$)

True for all $n \ge 1$. The same idea proves bounds on Fibonacci numbers and the closed forms of second-order difference equations used in digital control.

## Ordinary vs strong induction at a glance

| | Ordinary (weak) induction | Strong induction |

| Hypothesis | $P(k)$ is true | $P(n_0), \dots, P(k)$ are all true |

| Use when the step needs | only the previous case | $P(k-1)$, $P(k-2)$ or an unknown smaller case |

| Base cases | usually one | one for each step reached back (2 for $a_{k-1}$ and $a_k$, 3 for “$k - 2$ plus a 3-cent stamp”) |

| Typical questions | sums, divisibility, inequalities, simple recurrences | prime factorisation, stamps and coins, Fibonacci, two-term recurrences |

The two are equally powerful: anything provable by strong induction can be rewritten as ordinary induction on the statement “$P(n_0), \dots, P(n)$ are all true”. Choose whichever makes the step easier to write.

## Mistakes that cost marks

- Forgetting the base case: the false formula $1 + 2 + \cdots + n = \dfrac{n^2 + n + 2}{2}$ passes the inductive step, but at $n = 1$ it gives $2 \ne 1$.

- Generalising from examples: $n^2 + n + 41$ is prime up to $n = 39$, but $n = 40$ gives $41^2$.

- Writing the equation P(k+1) and simplifying both sides to 0 = 0: that assumes what you want to prove. Start from the left side only.

- An inductive step that fails for small k: the “all horses are the same colour” puzzle breaks at the step from 1 to 2.

- Strong induction with too few base cases: if the step uses $P(k-2)$, the cases it cannot reach from below must all be checked directly, as in Example 13.

## Try these yourself

- Prove $1 + 2 + 4 + \cdots + 2^{n-1} = 2^n - 1$.
Hint
Split off $2^k$: $(2^k - 1) + 2^k = 2^{k+1} - 1$.

- Prove that $5^n - 1$ is divisible by 4.
Hint
$5^{k+1} - 1 = 5(5^k - 1) + 4$.

- Prove that $3^n > 2n + 1$ for all $n \ge 2$.
Hint
Base case $9 > 5$. Then $3^{k+1} > 3(2k + 1) = 6k + 3 > 2k + 3$.

- With 4-cent and 7-cent stamps, find the smallest $N$ such that every amount $n \ge N$ can be made, then prove it by strong induction.
Answer
$N = 18$ (17 cannot be made). Base cases 18 to 21 (four of them, because the step is $k + 1 = (k - 3) + 4$).

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- The full mathematical induction lesson: strong induction, calculus, Laplace and engineering (in Thai)

- More strong induction: 4- and 5-cent stamps, a Fibonacci bound and a bounded recurrence (in Thai)

- Induction checker: plug numbers into the inductive step and test your own summation formula (in Thai)

- Find the wrong line in five flawed proofs (in Thai)

- Sigma notation and the summation formulas proved by induction (in Thai)

- Read next: the geometric series formula and when it converges

## Frequently asked questions

How many steps does mathematical induction have?
Two main steps: the base case (show $P(n_0)$ is true) and the inductive step (assume $P(k)$ is true and show $P(k+1)$ is true). In written answers it is usually laid out in four parts: define P(n), base case, inductive hypothesis, and inductive step with the conclusion.

What is the induction statement P(n)?
It is the sentence you want to prove, written so that it becomes true or false once a value of n is put in, for example $P(n)$: $1 + 3 + \cdots + (2n - 1) = n^2$. It must be a statement, not an expression: “let $P(n) = n^2 + n$” is not an induction statement because it has no truth value.

What is the difference between ordinary (weak) induction and strong induction?
Ordinary induction assumes only $P(k)$ to prove $P(k+1)$. Strong induction assumes every case from $P(n_0)$ up to $P(k)$. Use strong induction when the step needs an earlier case such as $P(k-1)$ or an unknown smaller case, for example recurrences with two previous terms, prime factorisation and coin or stamp problems. Strong induction needs as many base cases as the number of steps the argument reaches back.

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
What a Taylor series is, the Maclaurin series table to memorise, and 8 worked examples: approximation, expanding about other points, how many…
17 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**How many steps does mathematical induction have?**
Two main steps: the base case (show $P(n_0)$ is true) and the inductive step (assume $P(k)$ is true and show $P(k+1)$ is true). In written answers it is usually laid out in four parts: define P(n), base case, inductive hypothesis, and inductive step with the conclusion.

**What is the induction statement P(n)?**
It is the sentence you want to prove, written so that it becomes true or false once a value of n is put in, for example $P(n)$: $1 + 3 + \cdots + (2n - 1) = n^2$. It must be a statement, not an expression: “let $P(n) = n^2 + n$” is not an induction statement because it has no truth value.

**What is the difference between ordinary (weak) induction and strong induction?**
Ordinary induction assumes only $P(k)$ to prove $P(k+1)$. Strong induction assumes every case from $P(n_0)$ up to $P(k)$. Use strong induction when the step needs an earlier case such as $P(k-1)$ or an unknown smaller case, for example recurrences with two previous terms, prime factorisation and coin or stamp problems. Strong induction needs as many base cases as the number of steps the argument reaches back.

**Must the base case always be n = 1?**
No. Start at the first value where the statement is true and the inductive step keeps working. For example $2^n > n^2$ must start at $n = 5$, because it fails for $n = 2, 3, 4$.

**Why does checking many values not count as a proof?**
Because there are infinitely many natural numbers. For example $n^2 + n + 41$ is prime for every $n$ from 0 to 39, but at $n = 40$ it equals $1681 = 41^2$. You need an inductive step that works for every k.

**Is it wrong if I prove the inductive step without using the hypothesis?**
It is not logically wrong, but it means the statement could be proved directly without induction. In most exam questions, not using the hypothesis is a sign that something has gone wrong, so mark clearly the line where you use it.
