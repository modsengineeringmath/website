---
title: "Solving Linear Systems Numerically: Gauss, LU, Jacobi or Gauss–Seidel — Which Should You Use?"
url: https://modsengineeringmath.com/en/blog/jacobi-vs-gauss-seidel/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> Numerical methods for linear systems compared: Gaussian elimination with pivoting, LU, Cholesky, Jacobi, Gauss–Seidel, SOR, convergence and the condition number, plus a decision table.

Markdown copy of https://modsengineeringmath.com/en/blog/jacobi-vs-gauss-seidel/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Solving Linear Systems Numerically: Gauss, LU, Jacobi or Gauss–Seidel — Which Should You Use?

THภาษาไทยENEnglish
// Article · Numerical methods


Circuit simulators, structural software and heat models must solve $A\mathbf x = \mathbf b$ with thousands to millions of unknowns, where classroom methods are not enough. This article compares all the main methods at a glance: how each works, how fast it is, and when to choose it.

The 30-second summary

- Direct methods (Gauss, LU, Cholesky, Thomas) finish in a fixed number of steps; best for dense, moderate-size systems; always pivot

- Iterative methods (Jacobi, Gauss–Seidel, SOR) refine a guess each sweep; best for large sparse systems

- Gauss–Seidel is usually about twice as fast as Jacobi; SOR with a good $\omega$ is several times faster still

- Before trusting an answer, check the condition number $\kappa(A)$: about $\log_{10}\kappa$ digits may be lost

## The big picture: direct versus iterative

Two families of methods; choose by size, sparsity and the structure of the matrix.

Cramer's rule is not on this map because its cost grows factorially: a 20-unknown system needs about $5\times10^{19}$ multiplications against about 2,700 for Gaussian elimination (see the Cramer's rule article).

## Direct methods: Gauss, LU, Cholesky and Thomas

Gaussian elimination zeroes everything below the diagonal and then back-substitutes, using about $\tfrac23n^3$ flops. The crucial detail is partial pivoting: use the largest entry in the column as the pivot. On a machine keeping 3 significant digits:

$$\begin{aligned} 0.0001x + y &= 1 \\ x + y &= 2 \end{aligned} \qquad \text{no pivoting: } x = 0\ (\text{wrong}),\qquad \text{pivoting: } x = 1.00\ (\text{right})$$

The multiplier $1/0.0001 = 10^4$ makes $1 - 10^4$ round to $-1.00\times10^4$, wiping out the information in the first equation. Try other digit counts in the pivoting lab (in Thai).

- LU factorisation is Gaussian elimination that keeps the multipliers in $L$. Factor once, then each new $\mathbf b$ costs only $\approx 2n^2$ — ideal for a circuit whose sources change but whose structure does not.

- Cholesky $A = LL^T$ is for symmetric positive definite matrices such as the conductance matrix of a resistor network: twice as fast as LU and no pivoting.

- Thomas handles tridiagonal matrices (heat rods, ladder networks) in $O(n)$; a rod held at 100 °C and 0 °C with 4 interior nodes gives $T = (80, 60, 40, 20)$ °C.

## Iterative methods: Jacobi versus Gauss–Seidel

Both solve equation $i$ for $x_i$ using current estimates of the other unknowns; the only difference is whether they use the “old” or the “new” values.

$$\text{Jacobi: } x_i^{(k+1)} = \frac{b_i - \sum_{j\ne i}a_{ij}x_j^{(k)}}{a_{ii}},\qquad \text{Gauss–Seidel: use } x_j^{(k+1)} \text{ at once for } j \lt i$$

The system $4x - y + z = 7,\ 4x - 8y + z = -21,\ -2x + y + 5z = 15$ has solution $(2, 4, 3)$; start from $(1, 2, 2)$:

| Sweep | Jacobi | Gauss–Seidel |

| 1 | (1.750, 3.375, 3.000) | (1.750, 3.750, 2.950) |

| 2 | (1.844, 3.875, 3.025) | (1.950, 3.969, 2.986) |

| 3 | (1.963, 3.925, 2.963) | (1.996, 3.996, 2.999) |

Gauss–Seidel's error shrinks about 8× per sweep ($\rho = 0.125$), Jacobi's about 3× ($\rho \approx 0.335$).

## When they converge, and how SOR speeds things up

- Strict diagonal dominance $|a_{ii}| \gt \sum_{j\ne i}|a_{ij}|$ in every row → guaranteed convergence. If it fails, try reordering the equations first.

- The exact condition is a spectral radius $\rho(T) \lt 1$, and about $d/(-\log_{10}\rho)$ sweeps are needed to gain $d$ digits.

- SOR overshoots the Gauss–Seidel value by a factor $1 \lt \omega \lt 2$. A 10-unknown heat rod needs about 334 sweeps (Jacobi) and 167 (Gauss–Seidel), but SOR with $\omega \approx 1.56$ needs only about 24.

Compare all three side by side in the Jacobi · Gauss–Seidel · SOR simulator and watch heat spread through a plate sweep by sweep in the heat-plate lab (both in Thai).

## The condition number: how far can you trust the answer?

When equations are nearly parallel, a tiny change in the data moves the answer a lot. $x + y = 2,\ x + 1.0001y = 2.0001$ has solution $(1, 1)$, but changing the right-hand side to $2.0002$ gives $(0, 2)$. Its condition number $\kappa_\infty \approx 4\times10^4$ means 4–5 digits may be lost.

$$\frac{\lVert\delta\mathbf x\rVert}{\lVert\mathbf x\rVert} \le \kappa(A)\,\frac{\lVert\delta\mathbf b\rVert}{\lVert\mathbf b\rVert}$$

## Decision table

| Your system | Use |

| 2–3 unknowns by hand | Cramer's rule or row reduction |

| Dense, moderate size, several $\mathbf b$ | LU with pivoting (numpy.linalg.solve, MATLAB A\b) |

| Symmetric positive definite | Cholesky |

| Tridiagonal | Thomas |

| Large, sparse, diagonally dominant | Gauss–Seidel or SOR |

| Very large, symmetric positive definite | Conjugate gradient + preconditioner |

## Continue in the library (in Thai)

- Numerical solution of linear systems in full: formulas N1–N26, examples and five simulators

- Systems of linear equations and Gaussian elimination by hand

- Eigenvalues: where the spectral radius comes from

- Numerical-methods exam problems with solutions

- Article: the rank of a matrix and the existence of solutions

## Frequently asked questions

What is the difference between Jacobi and Gauss–Seidel?
Jacobi computes every unknown of the new sweep from the previous sweep's values, while Gauss–Seidel uses each newly computed value immediately within the same sweep. Gauss–Seidel therefore usually converges about twice as fast and needs less memory, while Jacobi is easier to parallelise.

When should an iterative method be used instead of LU?
When the system is very large and the matrix is mostly zeros (sparse), as in heat, electric-field or finite-element simulations with tens of thousands to millions of unknowns. Iterative methods need no full matrix storage and cause no fill-in. For dense systems of moderate size, use LU with partial pivoting.

Why pivot in Gaussian elimination?
Choosing the largest entry in the column as the pivot keeps every multiplier at most 1, so round-off errors are not amplified. With a tiny pivot such as 0.0001, a machine that keeps 3 significant digits returns a completely wrong answer.

When does an iterative method converge?
If the matrix is strictly diagonally dominant, Jacobi and Gauss–Seidel are guaranteed to converge. The exact condition is that the spectral radius of the iteration matrix is less than 1, and the number of sweeps needed is roughly the number of digits wanted divided by −log₁₀ of the spectral radius.

## More articles worth reading

Linear algebra
Cramer's Rule: How to Use It, Why It Works, and When Not to Use It
Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0…
25 Oct 2026Read the article →

Linear algebra
12 Determinant Properties That Appear on Every Exam: det(kA), det(A⁻¹), det(adj A) and the Traps
The 12 determinant properties used in entrance exams and engineering mathematics: row operations, det(kA) = kⁿ det A, products, inverses and the…
25 Oct 2026Read the article →

Linear algebra
Learning Matrices and Determinants: A 7-Step Roadmap from High School and Entrance Exams to Engineering Mathematics
A roadmap for matrices, determinants, rank, Cramer's rule and numerical methods: what to learn first, how far entrance exams go, what university…
25 Oct 2026Read the article →

All 7 articles in Vectors & Linear Algebra → · All articles

## Frequently asked questions

**What is the difference between Jacobi and Gauss–Seidel?**
Jacobi computes every unknown of the new sweep from the previous sweep's values, while Gauss–Seidel uses each newly computed value immediately within the same sweep. Gauss–Seidel therefore usually converges about twice as fast and needs less memory, while Jacobi is easier to parallelise.

**When should an iterative method be used instead of LU?**
When the system is very large and the matrix is mostly zeros (sparse), as in heat, electric-field or finite-element simulations with tens of thousands to millions of unknowns. Iterative methods need no full matrix storage and cause no fill-in. For dense systems of moderate size, use LU with partial pivoting.

**Why pivot in Gaussian elimination?**
Choosing the largest entry in the column as the pivot keeps every multiplier at most 1, so round-off errors are not amplified. With a tiny pivot such as 0.0001, a machine that keeps 3 significant digits returns a completely wrong answer.

**When does an iterative method converge?**
If the matrix is strictly diagonally dominant, Jacobi and Gauss–Seidel are guaranteed to converge. The exact condition is that the spectral radius of the iteration matrix is less than 1, and the number of sweeps needed is roughly the number of digits wanted divided by −log₁₀ of the spectral radius.
