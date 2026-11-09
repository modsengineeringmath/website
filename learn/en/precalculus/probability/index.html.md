---
title: "Counting and Probability: Permutations, Combinations, the Binomial Theorem, Conditional Probability and the Binomial Distribution"
url: https://modsengineeringmath.com/learn/en/precalculus/probability/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Counting and probability for precalculus: the addition and multiplication principles, factorials, linear, circular and repeated permutations, combinations, the binomial theorem and Pascal's triangle, sample spaces, conditional probability, independent events, Bayes' theorem, expected value and the binomial distribution, with a counting calculator, a simulator and a binomial graph.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/probability/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Counting and Probability: Permutations, Combinations, the Binomial Theorem, Conditional Probability and the Binomial Distribution

THภาษาไทยENEnglish

// Chapter 27.14 · Precalculus · Counting & Probability


Most high-school probability is counting done twice: counting how many outcomes there are in total, and counting how many of them you want. The hard part is counting everything exactly once, which is difficult without the right tools. This page starts with the multiplication principle, moves on to permutations and combinations together with a way to decide which one to use, and then covers the binomial theorem, conditional probability, Bayes' theorem, which explains why a positive medical test may not mean you are ill, and the binomial distribution, which leads into statistics on the next page.

In 30 seconds

- Order matters → $P(n, r) = \tfrac{n!}{(n - r)!}$ · order doesn't → $\binom nr = \tfrac{n!}{r!(n - r)!}$

- Around a circle $(n - 1)!$ · with repeated items $\tfrac{n!}{n_1!n_2!\cdots}$

- $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ · $P(A^c) = 1 - P(A)$

- $P(A \mid B) = \tfrac{P(A \cap B)}{P(B)}$ · independent ⇔ $P(A \cap B) = P(A)P(B)$

- Binomial $P(X = k) = \binom nk p^k(1 - p)^{n-k}$, $\mu = np$, $\sigma^2 = np(1 - p)$

## The addition and multiplication principles and factorials

The multiplication principle says that if a task is done in stages, the first with m ways and the next with n ways whatever was chosen first, the whole task can be done in m × n ways. The addition principle applies when you pick exactly one of several routes that do not overlap. Arranging all n objects uses the multiplication principle repeatedly, $n \times (n - 1) \times \cdots \times 1 = n!$, which grows very fast: 10! is already more than three million.

C1 Counting principles

$$n(A \text{ then } B) = n(A)\cdot n(B),\qquad n! = n(n - 1)\cdots 2\cdot 1,\quad 0! = 1$$

Example C-1 · A 4-digit code

### How many 4-digit codes can be made from the digits 0–9 if (a) digits may repeat (b) digits may not repeat?

- (a) Each digit has 10 choices: $10^4$

- (b) First digit 10, second 9, …: $10\cdot9\cdot8\cdot7 = P(10, 4)$

(a) 10,000 · (b) 5,040

## Permutations and combinations

Permutations count arrangements in which order matters; combinations count selections in which it does not. Every group of r items can be arranged in r! ways, so the number of combinations is the number of permutations divided by r!. Arrangements around a round table are divided by n, because rotating everyone together creates no new arrangement, and arrangements with repeated items are divided by the number of ways to swap identical items.

C2 Permutations

$$P(n, r) = {}_nP_r = \frac{n!}{(n - r)!}$$

C3 Circular & repeated

$$\text{circle: } (n - 1)!,\qquad \text{repeated items: } \frac{n!}{n_1!\,n_2!\cdots n_k!}$$

C4 Combinations

$$\binom{n}{r} = {}_nC_r = \frac{n!}{r!\,(n - r)!},\qquad \binom nr = \binom n{n - r}$$

Example C-2 · Repeated letters

### How many arrangements of the letters of BANANA are there?

- 6 letters, with A repeated 3 times and N repeated 2 times

- $\dfrac{6!}{3!\,2!} = \dfrac{720}{12}$

60 arrangements

Example C-3 · A committee

### Choose 3 men from 6 and 2 women from 5. How many committees are possible?

- Order does not matter: $\binom63 = 20$, $\binom52 = 10$

- Multiplication principle: $20 \times 10$

200 committees

Example C-4 · A round table

### In how many ways can 7 people sit around a round table? In how many if two particular people must sit together?

- In total $(7 - 1)! = 720$

- Tie the two together as one block, leaving 6 units around the circle: $(6 - 1)! = 120$, and the pair can swap in 2 ways

720 ways · 240 with the two together

## The binomial theorem and Pascal's triangle

When you expand $(a + b)^n$, each term comes from choosing b from k of the brackets and a from the rest, and there are $\binom nk$ ways to choose. So the binomial coefficients are the same numbers as in Pascal's triangle, where each entry is the sum of the two above it. The standard exam question asks for the coefficient of a particular term, found with the general term $T_{k+1}$.

C5 Binomial theorem

$$(a + b)^n = \sum_{k=0}^{n}\binom nk a^{n-k}b^k,\qquad T_{k+1} = \binom nk a^{n-k}b^k,\qquad \binom nk = \binom{n-1}{k-1} + \binom{n-1}{k}$$

Example C-5 · The coefficient of a term

### Find the coefficient of $x^4$ in the expansion of $(2x - 3)^6$

- $T_{k+1} = \binom6k(2x)^{6-k}(-3)^k$; we need $6 - k = 4 \Rightarrow k = 2$

- $\binom62\cdot2^4\cdot(-3)^2 = 15\cdot16\cdot9$

2,160

JavaScript is needed for the counting calculator

## Basic probability

When all outcomes are equally likely, the probability of an event is the number of favourable outcomes divided by the total number of outcomes, which is where the counting of the previous sections is used. Complicated events are often easier through the complement: “at least once” is 1 minus “never”. The addition rule subtracts the overlap once so that it is not counted twice.

C6 Classical probability

$$P(E) = \frac{n(E)}{n(S)},\quad 0 \le P(E) \le 1,\quad P(E^c) = 1 - P(E)$$

C7 Addition rule

$$P(A \cup B) = P(A) + P(B) - P(A \cap B)$$

Example C-6 · Dice and cards

### (a) Two dice are rolled. Find the probability that the sum is 7, and that the sum is at least 10 (b) One card is drawn from 52. Find the probability of a king or a heart

- (a) 36 outcomes in all · a sum of 7 in 6 ways · sums of 10, 11, 12 in 3 + 2 + 1 = 6 ways

- (b) $\tfrac{4}{52} + \tfrac{13}{52} - \tfrac{1}{52}$ (the king of hearts would be counted twice)

(a) $\tfrac16$ and $\tfrac16$ · (b) $\tfrac{16}{52} = \tfrac{4}{13}$

JavaScript is needed for the simulator

## Conditional probability, independence and Bayes' theorem

$P(A \mid B)$ is the probability of A once you know that B has happened: cut the sample space down to B and see what part of it is also A. Bayes' theorem reverses a condition. For example, you may know the probability of a positive test given illness, but want the probability of illness given a positive test, and when the illness is rare the answer is usually much lower than people expect.

C8 Conditional

$$P(A \mid B) = \frac{P(A \cap B)}{P(B)},\qquad A, B \text{ independent} \iff P(A \cap B) = P(A)P(B)$$

C9 Bayes' theorem

$$P(A \mid B) = \frac{P(B \mid A)P(A)}{P(B \mid A)P(A) + P(B \mid A^c)P(A^c)}$$

Example C-7 · Positive but not ill

### A disease affects 1% of a population. A test is positive 95% of the time for people who have it and gives false positives 5% of the time for people who don't. If a test is positive, what is the probability that the person is ill?

- Positive and ill: $0.95 \times 0.01 = 0.0095$ · positive but well: $0.05 \times 0.99 = 0.0495$

- $P(\text{ill} \mid +) = \dfrac{0.0095}{0.0095 + 0.0495} = \dfrac{0.0095}{0.059}$

≈ 0.161, about 16% — most positives come from the large number of healthy people who test wrongly

## Random variables, expected value and the binomial distribution

A random variable turns the outcome of an experiment into a number, such as the number of questions answered correctly. The expected value is the long-run average over many repetitions and tells you whether a game or an investment is worth it. The binomial distribution is the most common random variable at this level, and when n is large its shape approaches the normal curve; tick the box in the graph below to see the two overlap.

C10 Expected value

$$E(X) = \sum x\,P(X = x),\qquad \operatorname{Var}(X) = E(X^2) - \big(E(X)\big)^2$$

C11 Binomial distribution

$$P(X = k) = \binom nk p^k(1 - p)^{n-k},\qquad \mu = np,\quad \sigma^2 = np(1 - p)$$

Example C-8 · Guessing on a test

### A test has 10 multiple-choice questions with 4 options each, and every answer is a guess. What is the probability of getting at least 6 right, and how many are expected to be right?

- $X \sim B(10, 0.25)$ · $P(X \ge 6) = \sum_{k=6}^{10}\binom{10}{k}(0.25)^k(0.75)^{10-k}$

- The largest term is k = 6: $210(0.25)^6(0.75)^4 \approx 0.0162$; all terms together ≈ 0.0197

- $E(X) = np = 10(0.25)$

$P(X \ge 6) \approx 0.0197$ (about 2%) · expected 2.5 correct

Example C-9 · Is the game worth it?

### You pay 20 to roll a die and receive 100 if it shows 6. What is the expected profit?

- $E(\text{payout}) = 100\cdot\tfrac16 + 0\cdot\tfrac56 \approx 16.67$

- Expected profit $16.67 - 20$

≈ −3.33 per game; play long enough and you lose

JavaScript is needed for the graph

Common trapsUsing combinations when order matters (president versus secretary, for instance) · adding the probabilities of events that can happen together without subtracting the overlap · and confusing $P(A \mid B)$ with $P(B \mid A)$, which the Bayes example shows can be very different.

## Practice (with answers)

1Choose a president, vice-president and secretary from 10 people. How many ways?
Order matters: $P(10, 3)$
720

2How many diagonals does a 10-sided polygon have?
Choose 2 vertices $\binom{10}{2} = 45$, minus the 10 sides
35

3Three coins are tossed. Probability of at least one head
$1 - \left(\tfrac12\right)^3$
$\tfrac78$

4The constant term in the expansion of $\left(x + \tfrac1x\right)^6$
$x^{6-k}x^{-k} = x^0 \Rightarrow k = 3$
$\binom63 = 20$

5P(A) = 0.5, P(B) = 0.4, P(A ∩ B) = 0.2. Are A and B independent? Find P(A | B)
$0.5 \times 0.4 = 0.2$, equal
Independent · $P(A \mid B) = 0.5$

65% of items are defective. In a random sample of 20, what is the probability of none defective?
$0.95^{20}$
≈ 0.3585

## Read next

- 27.15 Statistics — center, spread and the normal distribution

- 27.16 Statistical tables — the z table approximates the binomial distribution when n is large

- Mathematical induction examples — proving formulas such as the binomial theorem

## Frequently asked questions

What is the difference between a permutation and a combination?
Ask whether order matters. If swapping the order gives a different outcome, as when choosing a president and a secretary or setting a password, use permutations P(n, r). If swapping leaves the same group, as when choosing a committee of 3 or a hand of 5 cards, use combinations C(n, r), which equal P(n, r) divided by r!.

Why is 0! = 1?
Because there is exactly one way to arrange zero objects (do nothing), and because it makes the formulas work in every case: C(n, n) = n!/(n! 0!) = 1, and n! = n·(n − 1)! with n = 1 gives 1! = 1·0!.

What is the difference between independent and mutually exclusive events?
Mutually exclusive events cannot happen together: P(A ∩ B) = 0. Independent events do not affect each other's chances: P(A ∩ B) = P(A)P(B). The two ideas are almost opposites: if A and B both have positive probability and are mutually exclusive, knowing that A happened tells you B did not, so they are not independent.

When is the binomial distribution used?
When an experiment is repeated n times independently, each trial has two outcomes (success or failure), and the success probability p is the same every time, for example guessing on a multiple-choice test, tossing coins or counting defective items in a batch. The probability of k successes is C(n, k)pᵏ(1 − p)ⁿ⁻ᵏ and the expected value is np.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between a permutation and a combination?**
Ask whether order matters. If swapping the order gives a different outcome, as when choosing a president and a secretary or setting a password, use permutations P(n, r). If swapping leaves the same group, as when choosing a committee of 3 or a hand of 5 cards, use combinations C(n, r), which equal P(n, r) divided by r!.

**Why is 0! = 1?**
Because there is exactly one way to arrange zero objects (do nothing), and because it makes the formulas work in every case: C(n, n) = n!/(n! 0!) = 1, and n! = n·(n − 1)! with n = 1 gives 1! = 1·0!.

**What is the difference between independent and mutually exclusive events?**
Mutually exclusive events cannot happen together: P(A ∩ B) = 0. Independent events do not affect each other's chances: P(A ∩ B) = P(A)P(B). The two ideas are almost opposites: if A and B both have positive probability and are mutually exclusive, knowing that A happened tells you B did not, so they are not independent.

**When is the binomial distribution used?**
When an experiment is repeated n times independently, each trial has two outcomes (success or failure), and the success probability p is the same every time, for example guessing on a multiple-choice test, tossing coins or counting defective items in a batch. The probability of k successes is C(n, k)pᵏ(1 − p)ⁿ⁻ᵏ and the expected value is np.
