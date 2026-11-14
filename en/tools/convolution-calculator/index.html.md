---
title: "Discrete Convolution Calculator: Multiplication Table, Exact Fractions and Plots"
url: https://modsengineeringmath.com/en/tools/convolution-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-14
---

> Free discrete convolution calculator for y[n] = x[n] * h[n]. Exact fractions, the multiplication table summed along diagonals, start index and length, the z⁻¹ polynomial product, stem plots and a floating-point re-check. For signals and systems, FIR filters and polynomials.

Markdown copy of https://modsengineeringmath.com/en/tools/convolution-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Discrete Convolution Calculator: Multiplication Table, Exact Fractions and Plots

THภาษาไทยENEnglish
// Tools · Convolution Calculator


Enter two sequences x[n] and h[n]. The tool computes y[n] = x[n] * h[n] with exact fractions, shows the multiplication table summed along its diagonals, gives the start index and length of the result, writes it as a product of polynomials in $z^{-1}$, and draws stem plots of all three signals. Use it to check signals-and-systems homework, FIR filters and polynomial products.

## Calculator

JavaScript is required for this tool.

## How to use it

- Type the values of x[n] separated by commas and set the index of the first value.

- Do the same for h[n]. Fractions such as 1/3 and decimals such as -0.25 are fine.

- Press Compute, or try a preset (moving average, first difference, polynomial product, time shift). The page URL keeps your inputs so you can share the result.

## Formula and rules

$$y[n] = \sum_{k=-\infty}^{\infty} x[k]\,h[n - k]$$

- If x has N values starting at $n_x$ and h has M values starting at $n_h$, the result has N + M − 1 values starting at $n_x + n_h$.

- Convolution commutes, $x * h = h * x$, and $x * \delta[n - k] = x[n - k]$ (a time shift).

- The sum of y equals the sum of x times the sum of h, a quick check on any answer.

## Worked example

$\{1, 2, 3\} * \{1, 1\}$, both starting at n = 0. The first row of the table is 1, 2, 3; the second row is 1, 2, 3 shifted one place. Adding along the diagonals gives

$y = \{1, 3, 5, 3\}$ · sum 12 = 6 × 2 · the same as $(1 + 2x + 3x^2)(1 + x) = 1 + 3x + 5x^2 + 3x^3$

The system $h = \{1, 1\}$ adds each sample to the previous one. Its frequency response is $1 + e^{-j\Omega} = 2e^{-j\Omega/2}\cos\tfrac\Omega2$ (Euler's formula, factoring out half the angle), so its magnitude $2|\cos\tfrac\Omega2|$ makes it a low-pass filter.

## Frequently asked questions

How is discrete convolution computed?
y[n] = Σ x[k]h[n − k]. The quickest hand method is a multiplication table: x across the top, h down the side, multiply every cell and add along the diagonals. The result starts at the start of x plus the start of h and has N + M − 1 values.

Can I enter fractions or negative values?
Yes. Type 1/3, -2, 0.25 separated by commas. The tool works with exact fractions throughout, gives the answer in lowest terms, then re-checks it in floating point.

What if a sequence does not start at n = 0?
Set the starting index of its first value. For h[−1] = 1, h[0] = 3, enter 1, 3 and start at −1. The result marks n = 0 with an arrow.

How is convolution related to polynomial multiplication?
They are the same operation. Read each sequence as the coefficients of a polynomial in z⁻¹; the convolution is the coefficient list of the product. That is why the z-transform turns convolution into multiplication.

What is a quick check on a convolution?
The sum of y equals the sum of x times the sum of h. For example {1, 2, 3} * {1, 1} = {1, 3, 5, 3}: 12 = 6 × 2.

## More tools

Differential equation solver
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
All tools →

## Frequently asked questions

**How is discrete convolution computed?**
y[n] = Σ x[k]h[n − k]. The quickest hand method is a multiplication table: x across the top, h down the side, multiply every cell and add along the diagonals. The result starts at the start of x plus the start of h and has N + M − 1 values.

**Can I enter fractions or negative values?**
Yes. Type 1/3, -2, 0.25 separated by commas. The tool works with exact fractions throughout, gives the answer in lowest terms, then re-checks it in floating point.

**What if a sequence does not start at n = 0?**
Set the starting index of its first value. For h[−1] = 1, h[0] = 3, enter 1, 3 and start at −1. The result marks n = 0 with an arrow.

**How is convolution related to polynomial multiplication?**
They are the same operation. Read each sequence as the coefficients of a polynomial in z⁻¹; the convolution is the coefficient list of the product. That is why the z-transform turns convolution into multiplication.

**What is a quick check on a convolution?**
The sum of y equals the sum of x times the sum of h. For example {1, 2, 3} * {1, 1} = {1, 3, 5, 3}: 12 = 6 × 2.
