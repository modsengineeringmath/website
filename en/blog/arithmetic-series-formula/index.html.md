---
title: "Arithmetic Series: Sum of n Terms, General Term, Derivation and Examples"
url: https://modsengineeringmath.com/en/blog/arithmetic-series-formula/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-14
---

> Arithmetic series formula Sₙ = n/2 (a₁ + aₙ) = n/2 [2a₁ + (n − 1)d] and general term aₙ = a₁ + (n − 1)d, with Gauss's pairing derivation, five worked examples, common mistakes and engineering uses.

Markdown copy of https://modsengineeringmath.com/en/blog/arithmetic-series-formula/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Arithmetic Series: Sum of n Terms, General Term, Derivation and Examples

THภาษาไทยENEnglish
// Article · Sequences & series


An arithmetic series adds numbers that grow by the same amount each time, such as $3 + 7 + 11 + 15$. There is one formula to remember, and its derivation fits on one line using the trick young Gauss used to add 1 to 100. This article covers the formula, where it comes from, the examples that appear most often in exams, and the key terms.

In 30 seconds

- General term: $a_n = a_1 + (n-1)d$, where $d$ is the common difference $= a_{n+1} - a_n$

- Sum of n terms: $S_n = \dfrac{n}{2}(a_1 + a_n) = \dfrac{n}{2}\big[2a_1 + (n-1)d\big]$

- Number of terms: $n = \dfrac{a_n - a_1}{d} + 1$ (do not forget the +1)

- An infinite arithmetic series always diverges unless every term is zero

## What is an arithmetic series?

An arithmetic sequence (also called an arithmetic progression, AP) is a sequence in which each term is obtained by adding a constant $d$ to the previous one, for example $3, 7, 11, 15, \dots$ with $d = 4$. An arithmetic series is the sum of those terms, $3 + 7 + 11 + 15 + \cdots$

To find $d$, subtract any term from the next one. If every pair gives the same value, the sequence is arithmetic. $d$ can be negative (the terms decrease) or zero (all terms are equal).

$$a_n = a_1 + (n-1)d$$

Why $(n-1)$? Going from the 1st term to the nth term takes $n-1$ steps of size $d$, just as 10 fence posts have 9 gaps between them.

## The sum of n terms and Gauss's derivation

$$S_n = a_1 + a_2 + \cdots + a_n = \frac{n}{2}\,(a_1 + a_n) = \frac{n}{2}\big[2a_1 + (n-1)d\big]$$

Derivation: write the sum twice, once forwards and once backwards, then add the two lines column by column.

$$\begin{array}{rcl} S_n &=& a_1 + (a_1 + d) + \cdots + (a_n - d) + a_n \\ S_n &=& a_n + (a_n - d) + \cdots + (a_1 + d) + a_1 \\ \hline 2S_n &=& \underbrace{(a_1 + a_n) + (a_1 + a_n) + \cdots + (a_1 + a_n)}_{n\ \text{pairs}} \end{array}$$

Every pair has the same sum $a_1 + a_n$, because moving one column to the right adds $d$ to the top term and takes $d$ from the bottom term. So $2S_n = n(a_1 + a_n)$. The easiest way to remember it: sum = number of terms × average of the first and last terms.

Example 1 · Gauss's problem

### Find $1 + 2 + 3 + \cdots + 100$

- $a_1 = 1,\ a_n = 100,\ n = 100$. Pairing front and back gives 50 pairs, each summing to 101.

$$S_{100} = \frac{100}{2}(1 + 100) = 50 \times 101$$

$5050$. The general result $1 + 2 + \cdots + n = \dfrac{n(n+1)}{2}$ is a special case of this formula.

Example 2 · Find the number of terms first

### Find $7 + 11 + 15 + \cdots + 203$

- $a_1 = 7,\ d = 4$. Number of terms $n = \dfrac{203 - 7}{4} + 1 = 49 + 1 = 50$

- $S_{50} = \dfrac{50}{2}(7 + 203) = 25 \times 210$

$5250$. The most common mistake is forgetting the +1 and using n = 49.

## Examples that often appear in exams

Example 3 · Given Sₙ, find aₙ

### The sum of the first n terms of a sequence is $S_n = 3n^2 + 2n$. Find $a_n$.

- The nth term is the sum of n terms minus the sum of n − 1 terms.

$$a_n = S_n - S_{n-1} = (3n^2 + 2n) - \big[3(n-1)^2 + 2(n-1)\big] = 6n - 1$$

- Check the first term separately: $a_1 = S_1 = 5$, which matches $6(1) - 1 = 5$ ✓

$a_n = 6n - 1$, an arithmetic sequence with $d = 6$. Note: if $S_n$ is a quadratic in n with no constant term, the sequence is always arithmetic.

Example 4 · Three consecutive terms

### Three numbers form an arithmetic sequence. Their sum is 27 and their product is 585. Find them.

- Call the middle term $x$ so the terms are symmetric: $x - d,\ x,\ x + d$. The sum is $3x = 27 \Rightarrow x = 9$.

- Product: $(9 - d)\cdot 9 \cdot (9 + d) = 9(81 - d^2) = 585 \Rightarrow d^2 = 16 \Rightarrow d = \pm 4$

$5, 9, 13$ (or $13, 9, 5$). Centring the terms on $x$ makes $d$ cancel from the sum straight away.

Example 5 · Word problem

### A hall has 25 rows. The first row has 20 seats and each row has 2 more than the one in front. How many seats are there?

- Last row: $a_{25} = 20 + 24(2) = 68$

- $S_{25} = \dfrac{25}{2}(20 + 68) = 12.5 \times 88$

$1{,}100$ seats

## Arithmetic series vs geometric series

| | Arithmetic | Geometric |

| Next term | add $d$ | multiply by $r$ |

| General term | $a_1 + (n-1)d$ | $a_1r^{n-1}$ |

| Sum of n terms | $\tfrac{n}{2}(a_1 + a_n)$ | $a_1\tfrac{1 - r^n}{1 - r}$ |

| Infinite sum | always diverges (unless all terms are 0) | converges to $\tfrac{a_1}{1 - r}$ when $|r| < 1$ |

| Graph of $a_n$ | points on a straight line | points on an exponential curve |

For the geometric side, with its derivation and examples, read Geometric Series Formula with Examples.

## Key terms

- Arithmetic sequence / arithmetic progression (AP): the list $a_1, a_2, a_3, \dots$ with a constant difference

- Arithmetic series: the sum of the terms, $S_n$

- Common difference $d$: $a_{n+1} - a_n$

- General term (nth term) $a_n$ and partial sum $S_n$

- Arithmetic mean of a and b: $\tfrac{a + b}{2}$, the middle term of three consecutive terms

## Uses in engineering

- Pipes or cable drums stacked in a triangle: 10 on the bottom layer, one fewer on each layer above, gives $\tfrac{10}{2}(10 + 1) = 55$ items, used to estimate floor loads in a warehouse.

- Straight-line depreciation: a machine bought for 500,000 baht that loses 40,000 baht a year is worth $500{,}000 - 40{,}000n$ after n years, an arithmetic sequence with $d = -40{,}000$.

- Motion with constant acceleration: the distance covered in the 1st, 2nd, 3rd … second is $u + a(n - \tfrac12)$, an arithmetic sequence whose common difference is the acceleration $a$. Adding the first t seconds gives exactly $s = ut + \tfrac12at^2$.

## Common mistakes

- Counting terms with $\tfrac{a_n - a_1}{d}$ and forgetting the +1

- Using $a_n = a_1 + nd$ instead of $a_1 + (n-1)d$, which lands one term too far

- Mixing up “the nth term” ($a_n$) with “the sum of n terms” ($S_n$)

- Finding $a_n$ from $S_n$ without checking the first term separately: if $S_n$ has a constant term, $a_1$ will not fit the formula $S_n - S_{n-1}$

## Keep learning

The full lessons are in Thai, with English technical terms and the same formulas.

- Arithmetic, geometric and recursive sequences in full (in Thai)

- Sum formulas Σk, Σk², Σk³ and arithmetic–geometric series (in Thai)

- Sequence and series calculators with worked steps (in Thai)

- Sequences and series exam practice, set A (in Thai)

- Next article: geometric series formula

## Frequently asked questions

What is the formula for the sum of an arithmetic series?
$S_n = \tfrac{n}{2}(a_1 + a_n)$ when the first and last terms are known, or $S_n = \tfrac{n}{2}\big[2a_1 + (n-1)d\big]$ when the common difference d is known.

Does an infinite arithmetic series have a sum?
No, it diverges unless every term is zero. If $d \ne 0$ the terms grow without bound, and if $d = 0$ with $a_1 \ne 0$ the partial sums $na_1$ grow without bound. A geometric series, by contrast, converges when $|r|
How do I find the number of terms?
Use $n = \dfrac{a_n - a_1}{d} + 1$. The +1 is the step most often forgotten: from the 1st term to the nth term there are $n - 1$ steps of size d.

How do I find aₙ when Sₙ is given?
Use $a_n = S_n - S_{n-1}$ for $n \ge 2$ and $a_1 = S_1$. For example $S_n = 3n^2 + 2n$ gives $a_n = 6n - 1$.

## More articles worth reading

Sequences & series
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

Sequences & series
How to Choose a Convergence Test: an 8-Step Flowchart with an Example at Every Step
Pick the right convergence test the first time: an 8-step flowchart (n-th term, geometric, p-series, telescoping, limit comparison, ratio, root,…
24 Oct 2026Read the article →

Sequences & series
What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)
Laurent series vs Taylor series: negative powers, the principal part, the annulus of convergence, types of singularity, residues and the link to…
24 Oct 2026Read the article →

All 8 articles in Sequences & Series → · All articles

## Frequently asked questions

**What is the formula for the sum of an arithmetic series?**
$S_n = \tfrac{n}{2}(a_1 + a_n)$ when the first and last terms are known, or $S_n = \tfrac{n}{2}\big[2a_1 + (n-1)d\big]$ when the common difference d is known.

**Does an infinite arithmetic series have a sum?**
No, it diverges unless every term is zero. If $d \ne 0$ the terms grow without bound, and if $d = 0$ with $a_1 \ne 0$ the partial sums $na_1$ grow without bound. A geometric series, by contrast, converges when $|r| < 1$.

**How do I find the number of terms?**
Use $n = \dfrac{a_n - a_1}{d} + 1$. The +1 is the step most often forgotten: from the 1st term to the nth term there are $n - 1$ steps of size d.

**How do I find aₙ when Sₙ is given?**
Use $a_n = S_n - S_{n-1}$ for $n \ge 2$ and $a_1 = S_1$. For example $S_n = 3n^2 + 2n$ gives $a_n = 6n - 1$.
