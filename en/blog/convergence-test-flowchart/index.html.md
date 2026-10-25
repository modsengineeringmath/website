---
title: "How to Choose a Convergence Test: an 8-Step Flowchart with an Example at Every Step"
url: https://modsengineeringmath.com/en/blog/convergence-test-flowchart/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-24
---

> Pick the right convergence test the first time: an 8-step flowchart (n-th term, geometric, p-series, telescoping, limit comparison, ratio, root, integral, alternating) with examples and traps.

Markdown copy of https://modsengineeringmath.com/en/blog/convergence-test-flowchart/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# How to Choose a Convergence Test: an 8-Step Flowchart with an Example at Every Step

THภาษาไทยENEnglish
// Article · Sequences & series


In a Calculus 2 exam, the students who finish the series questions quickly are not the ones who memorised the most theorems; they are the ones who look at a term and know at once which tool to use. This article turns that experience into an 8-step flowchart, ordered from the fastest check to the one that takes the most work, with one example per step.

In 30 seconds

- Always check the n-th term first (5 seconds), then ask whether it is geometric or a p-series

- Ratio of polynomials → limit comparison · factorials/exponentials → ratio · whole term to the n-th power → root · contains ln → integral

- Alternating signs: test Σ|aₙ| first, then use Leibniz

## The flowchart

Read from top to bottom, stop at the first “yes” and use the test on the right.

## The 8 steps with examples

### Step 1 · Do the terms go to zero?

$\sum\dfrac{n}{n+1}$: the terms → 1 ≠ 0, so the series diverges at once. This test works in one direction only; if the terms → 0, go to the next step.

### Step 2 · Is it geometric or a p-series?

$\sum\dfrac{5}{4^n}$ is geometric with $r = \tfrac14$ and converges · $\sum\dfrac{1}{\sqrt n}$ is a p-series with $p = \tfrac12 \le 1$ and diverges — remember the result, no computation needed.

### Step 3 · Can you split it into partial fractions?

$\sum\dfrac{1}{n(n+1)} = \sum\left(\dfrac1n - \dfrac{1}{n+1}\right) = 1$. Telescoping gives both the verdict and the value of the sum.

### Step 4 · Is it a ratio of polynomials or roots?

$\sum\dfrac{3n+5}{n^3-2}$: the dominant part is $\tfrac{3n}{n^3} = \tfrac{3}{n^2}$; the limit comparison with $\tfrac{1}{n^2}$ gives 3 (positive and finite), so it converges · Shortcut: it converges ⇔ (degree of denominator − degree of numerator) > 1.

### Step 5 · Does it contain factorials or exponentials?

$\sum\dfrac{n!}{n^n}$: $\dfrac{a_{n+1}}{a_n} = \left(\dfrac{n}{n+1}\right)^n \to \dfrac1e < 1$, so it converges · If the limit is exactly 1, the ratio test is inconclusive.

### Step 6 · Is the whole term raised to the n-th power?

$\sum\left(\dfrac{n}{2n+1}\right)^n$: $\sqrt[n]{a_n} = \dfrac{n}{2n+1} \to \tfrac12$, so it converges; the root removes the exponent immediately.

### Step 7 · Does it contain ln, or is it easy to integrate?

$\sum\dfrac{1}{n\ln n}$: $\int_2^\infty\dfrac{dx}{x\ln x} = [\ln\ln x]_2^\infty = \infty$, so it diverges (even though computer sums look as if they settle) · $\sum\dfrac{1}{n(\ln n)^2}$, on the other hand, converges.

### Step 8 · Do the signs alternate?

$\sum\dfrac{(-1)^n}{\sqrt n}$: the absolute values $\sum\tfrac{1}{\sqrt n}$ diverge, but $\tfrac{1}{\sqrt n}$ decreases to 0, so Leibniz says the series converges — it converges conditionally.

## Summary table for exam revision

| Test | Use when | Inconclusive when |

| n-th term | Every question (first check) | Terms → 0 |

| Limit comparison | Ratios of polynomials, roots, sin(1/n) | The limit is 0 or ∞ in the wrong direction |

| Ratio | n!, cⁿ, nⁿ | ρ = 1 |

| Root | The whole term to the n-th power | ρ = 1 |

| Integral | ln n, functions you can integrate | f is not decreasing |

| Alternating series | (−1)ⁿ bₙ | bₙ is not decreasing |

## Three traps that cost marks

- $\sum\dfrac{1}{n^{1 + 1/n}}$ looks like a p-series with p > 1, but the exponent tends to 1; the limit comparison with $\tfrac1n$ gives 1, so it diverges.

- $\sum\left(1 + \tfrac1n\right)^n$ does not need the root test: the terms → e ≠ 0, so it diverges by the n-th term test.

- $\sum\dfrac{1}{3^n - n}$: direct comparison with $\tfrac{1}{3^n}$ fails because the terms are larger; use the limit comparison test instead.

Build the reflex with the 40-question test-choice game (in Thai), which checks both the test you choose and your verdict.

## Continue in the library (in Thai)

- Convergence tests in full: theorems, examples, Raabe and Stirling

- Alternating series: Leibniz, error bound, rearrangement

- Interactive series tester

- Calculus 2 practice set B

## Frequently asked questions

Why not use the ratio test for everything?
Because series built from ratios of polynomials or roots, such as $\sum 1/n^2$ and $\sum 1/n$, always give a ratio limit of 1, which is inconclusive. The ratio test is the right tool only when the terms contain factorials or exponentials.

Can the n-th term test prove convergence?
No. It works in one direction only: if the terms do not tend to zero, the series diverges. If the terms do tend to zero, you must keep testing.

How do I choose b(n) for the limit comparison test?
Keep only the dominant (highest-power) part of the numerator and denominator. For $\dfrac{3n+5}{n^3-2}$ keep $\dfrac{3n}{n^3} = \dfrac{3}{n^2}$, so choose $b_n = 1/n^2$.

Where do I start with an alternating series?
Test the absolute values $\sum|a_n|$ first. If that converges, the series converges absolutely. If it diverges, apply the alternating series (Leibniz) test; if that passes, the series converges conditionally.

## More articles worth reading

Sequences & series
What Is a Laurent Series and How Is It Different from a Taylor Series? (Explained with Pictures)
Laurent series vs Taylor series: negative powers, the principal part, the annulus of convergence, types of singularity, residues and the link to…
24 Oct 2026Read the article →

Sequences & series
How to Find the Radius of Convergence: 3 Methods, Endpoint Checks and the Complex-Plane Reason
Three ways to find the radius of convergence of a power series (ratio test, root test, nearest complex singularity), plus the endpoint checks for…
24 Oct 2026Read the article →

Sequences & series
What Do You Learn in Sequences and Series? A Roadmap from Sequences to Laurent Series
The whole sequences and series chapter on one page: what each topic answers, its key formula and typical exam questions, from sequences and…
24 Oct 2026Read the article →

All 7 articles in Sequences & Series → · All articles

## Frequently asked questions

**Why not use the ratio test for everything?**
Because series built from ratios of polynomials or roots, such as $\sum 1/n^2$ and $\sum 1/n$, always give a ratio limit of 1, which is inconclusive. The ratio test is the right tool only when the terms contain factorials or exponentials.

**Can the n-th term test prove convergence?**
No. It works in one direction only: if the terms do not tend to zero, the series diverges. If the terms do tend to zero, you must keep testing.

**How do I choose b(n) for the limit comparison test?**
Keep only the dominant (highest-power) part of the numerator and denominator. For $\dfrac{3n+5}{n^3-2}$ keep $\dfrac{3n}{n^3} = \dfrac{3}{n^2}$, so choose $b_n = 1/n^2$.

**Where do I start with an alternating series?**
Test the absolute values $\sum|a_n|$ first. If that converges, the series converges absolutely. If it diverges, apply the alternating series (Leibniz) test; if that passes, the series converges conditionally.
