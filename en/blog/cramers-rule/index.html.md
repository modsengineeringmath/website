---
title: "Cramer's Rule: How to Use It, Why It Works, and When Not to Use It"
url: https://modsengineeringmath.com/en/blog/cramers-rule/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0 case and why computers avoid it.

Markdown copy of https://modsengineeringmath.com/en/blog/cramers-rule/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Cramer's Rule: How to Use It, Why It Works, and When Not to Use It

THภาษาไทยENEnglish
// Article · Linear algebra


Cramer's rule gives a direct formula for each unknown of a linear system — no row reduction and no inverse. It is perfect for exam questions that ask for a single unknown, but it has limits you must know. This article collects how to use it, where it comes from, the special cases and its practical range in one place.

The 30-second summary

- $x_i = \dfrac{\Delta_i}{\Delta}$, where $\Delta = \det A$ and $\Delta_i$ is the determinant of $A$ with column $i$ replaced by the constants $\mathbf b$

- Valid when $A$ is square and $\Delta \ne 0$ · one unknown needs only two determinants

- For systems larger than 3×3, or in software, use Gaussian elimination or LU instead

## The rule in one sentence

Compute the determinant $\Delta$ of the coefficient matrix, put the right-hand constants in place of the column of the unknown you want, compute the new determinant $\Delta_i$, and divide.

A 2×2 example: replacing the first column by $\mathbf b$ gives $\Delta_x$; replacing the second gives $\Delta_y$.

$$\begin{aligned} 3x + 2y &= 7 \\ x - y &= -1 \end{aligned} \quad\Rightarrow\quad \Delta = \begin{vmatrix} 3 & 2 \\ 1 & -1 \end{vmatrix} = -5,\quad x = \frac{\begin{vmatrix} 7 & 2 \\ -1 & -1 \end{vmatrix}}{-5} = \frac{-5}{-5} = 1,\quad y = \frac{\begin{vmatrix} 3 & 7 \\ 1 & -1 \end{vmatrix}}{-5} = \frac{-10}{-5} = 2$$

## 3×3 systems: solve only for what is asked

Example

### Find $y$ from $2x + y - z = 3,\ x + 3y + 2z = 14,\ 3x - y + z = 2$

-
$$\Delta = \begin{vmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ 3 & -1 & 1 \end{vmatrix} = 2(3 + 2) - 1(1 - 6) + (-1)(-1 - 9) = 25$$

-
$$\Delta_y = \begin{vmatrix} 2 & 3 & -1 \\ 1 & 14 & 2 \\ 3 & 2 & 1 \end{vmatrix} = 2(14 - 4) - 3(1 - 6) + (-1)(2 - 42) = 75$$

$y = 75/25 = 3$ — no need to find $x$ and $z$ at all

All three unknowns of a 3×3 system need four determinants. Always check by substituting back, or use the step-by-step Cramer calculator (in Thai).

## Why the rule works (a two-line proof)

Let $X_i$ be the identity matrix with column $i$ replaced by the solution vector $\mathbf x$. Multiplying by $A$, column $i$ becomes $A\mathbf x = \mathbf b$ while the other columns stay those of $A$, so $AX_i = A_i$. Now use $\det(AB) = \det A\det B$:

$$\det A\cdot\det X_i = \det A_i,\qquad \det X_i = x_i \ \Rightarrow\ x_i = \frac{\det A_i}{\det A}$$

Seen another way, Cramer's rule is $\mathbf x = A^{-1}\mathbf b = \dfrac{\operatorname{adj}A\,\mathbf b}{\det A}$ written one unknown at a time, so it always agrees with the inverse method.

## When Δ = 0, and parameter-k problems

If $\Delta = 0$ the formula fails, and the system has either no solution or infinitely many. A favourite exam example:

$$\begin{aligned} kx + y &= 1 \\ x + ky &= 1 \end{aligned}\qquad \Delta = k^2 - 1,\quad \Delta_x = \Delta_y = k - 1$$

- $k \ne \pm1$: $x = y = \dfrac{1}{k + 1}$

- $k = 1$: $\Delta = \Delta_x = \Delta_y = 0$; both equations are the same line → infinitely many solutions

- $k = -1$: $\Delta = 0$ but $\Delta_x = -2 \ne 0$ → parallel lines → no solution

Trap Never cancel the factor $(k - 1)$ before checking $k = 1$. And for 3×3 systems, even if $\Delta$ and every $\Delta_i$ are zero the system can still have no solution — use rank to decide (in Thai).

## When to use it, and when not to

| Use it for | Avoid it for |

| 2–3 unknowns by hand | 4 or more unknowns |

| A single unknown, e.g. one mesh current | $\Delta = 0$ or very close to zero |

| Symbolic coefficients ($R$, $k$, $s$) when you want a general formula | Different numbers of equations and unknowns |

| 2×2 AC circuits with complex impedances | Software that needs speed and numerical accuracy |

Cost is the main reason. With determinants by cofactor expansion, Cramer's rule needs about $(n + 1)!$ multiplications, so a 20-unknown system needs about $5\times10^{19}$ of them (roughly 1,600 years at a billion per second), while Gaussian elimination needs about $n^3/3 \approx 2{,}700$. Details are in numerical solution of linear systems (in Thai).

## Continue in the library (in Thai)

- Cramer's rule in full: three-mesh circuits, AC circuits and transfer functions

- Determinants: Sarrus, cofactors and properties

- The numerical methods used instead of Cramer for large systems

- Cramer's rule and linear-system exam problems with solutions

- Article: 12 determinant properties for exams

## Frequently asked questions

When can Cramer's rule be used?
When the number of equations equals the number of unknowns (a square coefficient matrix) and the determinant of the coefficient matrix is non-zero. If Δ = 0 the system has either no solution or infinitely many, and row reduction is needed to tell which.

Why is Cramer's rule fast in exams?
If the question asks for only one unknown you need just two determinants, Δ and the determinant for that unknown, instead of solving for everything or inverting the whole matrix. It is ideal for 2–3 unknowns by hand.

Why don't computer programs use Cramer's rule?
The cost explodes. With cofactor expansion a 20-unknown system needs about 5 × 10¹⁹ multiplications, while Gaussian elimination needs about 2,700, and Gaussian elimination with partial pivoting is also more stable numerically.

Can Cramer's rule be used for AC circuits?
Yes. It uses only addition, subtraction, multiplication and division, so it works directly with complex impedances, and also with the Laplace variable s, where Δ(s) = 0 is the characteristic equation of the circuit.

## More articles worth reading

Linear algebra
12 Determinant Properties That Appear on Every Exam: det(kA), det(A⁻¹), det(adj A) and the Traps
The 12 determinant properties used in entrance exams and engineering mathematics: row operations, det(kA) = kⁿ det A, products, inverses and the…
25 Oct 2026Read the article →

Linear algebra
Learning Matrices and Determinants: A 7-Step Roadmap from High School and Entrance Exams to Engineering Mathematics
A roadmap for matrices, determinants, rank, Cramer's rule and numerical methods: what to learn first, how far entrance exams go, what university…
25 Oct 2026Read the article →

Linear algebra
What Is the Rank of a Matrix? How to Find It and What It Tells You About a Linear System
The rank of a matrix explained visually: finding it by row reduction and by minors, using rank to decide whether Ax = b has one, infinitely many or…
25 Oct 2026Read the article →

All 7 articles in Vectors & Linear Algebra → · All articles

## Frequently asked questions

**When can Cramer's rule be used?**
When the number of equations equals the number of unknowns (a square coefficient matrix) and the determinant of the coefficient matrix is non-zero. If Δ = 0 the system has either no solution or infinitely many, and row reduction is needed to tell which.

**Why is Cramer's rule fast in exams?**
If the question asks for only one unknown you need just two determinants, Δ and the determinant for that unknown, instead of solving for everything or inverting the whole matrix. It is ideal for 2–3 unknowns by hand.

**Why don't computer programs use Cramer's rule?**
The cost explodes. With cofactor expansion a 20-unknown system needs about 5 × 10¹⁹ multiplications, while Gaussian elimination needs about 2,700, and Gaussian elimination with partial pivoting is also more stable numerically.

**Can Cramer's rule be used for AC circuits?**
Yes. It uses only addition, subtraction, multiplication and division, so it works directly with complex impedances, and also with the Laplace variable s, where Δ(s) = 0 is the characteristic equation of the circuit.
