---
title: "What Is the Rank of a Matrix? How to Find It and What It Tells You About a Linear System"
url: https://modsengineeringmath.com/en/blog/matrix-rank/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> The rank of a matrix explained visually: finding it by row reduction and by minors, using rank to decide whether Ax = b has one, infinitely many or no solutions, parameter-k problems and circuit uses.

Markdown copy of https://modsengineeringmath.com/en/blog/matrix-rank/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is the Rank of a Matrix? How to Find It and What It Tells You About a Linear System

THภาษาไทยENEnglish
// Article · Linear algebra


The rank is a single number that tells you how many rows of a matrix carry genuinely new information. Once you know it, you know immediately whether a system of equations has one solution, infinitely many, or none, without solving it to the end. This article explains the meaning, two ways to compute it, and where it is used in practice.

The 30-second summary

- Rank = number of linearly independent rows (or columns) = number of pivots after row reduction to echelon form

- Two methods: row-reduce and count the non-zero rows, or find the largest non-zero minor (sub-determinant)

- $\operatorname{rank}A \lt \operatorname{rank}[A\mid\mathbf b]$: no solution · equal $= n$: unique · equal $\lt n$: infinitely many

## Rank counts non-redundant information

Look at the system $x + 2y - z = 4,\ 2x + 3y + z = 9,\ 3x + 5y = 13$. The third equation is exactly the sum of the first two, so it adds nothing new. The system has three equations but only two pieces of real information. That number, 2, is the rank of the coefficient matrix.

There is also a geometric picture. Each column of the matrix is a vector, and the rank is the number of independent directions those vectors span. If they all lie on one line the rank is 1; if they all lie in one plane the rank is 2.

Columns lying on one line, in one plane, or filling 3-D space give rank 1, 2 and 3.

A fact that looks surprising but is always true: the number of independent rows equals the number of independent columns. The rank therefore can exceed neither the number of rows nor the number of columns: $\operatorname{rank}A \le \min(m, n)$.

## Method 1: row-reduce and count

Elementary row operations (swapping rows, scaling a row, adding a multiple of another row) do not change the rank, so reduce the matrix to row echelon form and count the non-zero rows.

Example

### $A = \begin{pmatrix} 1 & 2 & -1 \\ 2 & 3 & 1 \\ 3 & 5 & 0 \end{pmatrix}$

-
$$R_2 - 2R_1,\ R_3 - 3R_1:\quad \begin{pmatrix} 1 & 2 & -1 \\ 0 & -1 & 3 \\ 0 & -1 & 3 \end{pmatrix}$$

-
$$R_3 - R_2:\quad \begin{pmatrix} 1 & 2 & -1 \\ 0 & -1 & 3 \\ 0 & 0 & 0 \end{pmatrix}$$

Two non-zero rows, so $\operatorname{rank}A = 2$

This works for every size, including non-square matrices. Type your own matrix into the step-by-step rank lab (in Thai), which shows every step with exact fractions.

## Method 2: minors (sub-determinants)

The rank is the order of the largest non-zero minor. For a square $n\times n$ matrix this gives a short rule: $\det A \ne 0 \iff \operatorname{rank}A = n$.

In the classic example $\begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{pmatrix}$ the determinant is $225 - 225 = 0$, so the rank is below 3, but the top-left minor $\begin{vmatrix} 1 & 2 \\ 4 & 5 \end{vmatrix} = -3 \ne 0$, so the rank is 2.

Trap $\det A = 0$ only says the rank is not full; it does not say how far it drops. The 3×3 matrix of all ones has $\det = 0$ and rank 1.

## What rank tells you about a system of equations

This is the main reason to learn rank. Compare the rank of the coefficient matrix $A$ with that of the augmented matrix $[A\mid\mathbf b]$ (the Rouché–Capelli theorem):

$$\begin{cases} \operatorname{rank}A \lt \operatorname{rank}[A\mid\mathbf b] & \text{no solution} \\ \operatorname{rank}A = \operatorname{rank}[A\mid\mathbf b] = n & \text{unique solution} \\ \operatorname{rank}A = \operatorname{rank}[A\mid\mathbf b] = r \lt n & \text{infinitely many, } n - r \text{ free variables} \end{cases}$$

Three equations in three unknowns are three planes; the two ranks tell you how they meet (rotate them in the 3-D three-planes lab, in Thai).

Example

### The system $x + y + z = 1,\ x + 2y + 3z = 2,\ x + 3y + az = b$

- Row-reduce the augmented matrix until the last row is

$$\left(\begin{array}{ccc|c} 0 & 0 & a - 5 & b - 3 \end{array}\right)$$

- $a \ne 5$: both ranks are 3, unique solution · $a = 5,\ b = 3$: a zero row, ranks 2 = 2, infinitely many · $a = 5,\ b \ne 3$: ranks 2 and 3, no solution

In the infinite case $(x, y, z) = (t,\ 1 - 2t,\ t)$ with $3 - 2 = 1$ free variable

## Rank problems with a parameter k

Exams love “find the rank of $A$ for every value of $k$”. Compute $\det A(k)$ and factor it; values of $k$ that keep $\det \ne 0$ give full rank, and each value that makes $\det = 0$ must be substituted and row-reduced to find the actual rank. For example

$$A = \begin{pmatrix} 1 & 1 & k \\ 1 & k & 1 \\ k & 1 & 1 \end{pmatrix},\quad \det A = -(k - 1)^2(k + 2)$$

gives rank 3 for $k \ne 1, -2$, rank 1 for $k = 1$ (all rows equal) and rank 2 for $k = -2$. Slide $k$ yourself in the rank-versus-k lab (in Thai).

## Rank in engineering

- Circuits: the incidence matrix of an $n$-node circuit always has rank $n - 1$, so there are $n - 1$ independent KCL equations and $b - n + 1$ independent KVL equations (the number of meshes) — the reason nodal analysis picks one reference node.

- Control systems: a system is controllable exactly when $[B\ AB\ \cdots\ A^{n-1}B]$ has full rank $n$ (Kalman's test).

- Measured data: real data contain errors, so the numerical rank from the singular values (SVD) counts only the values above the noise level.

## Continue in the library (in Thai)

- Rank of a matrix in full: minors, null space, rank–nullity and the 3-D lab

- Systems of linear equations and Gaussian elimination

- Cramer's rule: when Δ = 0, rank decides

- Rank and linear-system exam problems with solutions

- Article: a roadmap for matrices and determinants

## Frequently asked questions

What is the rank of a matrix in simple terms?
It is the number of linearly independent rows of the matrix, which always equals the number of independent columns. After row reduction to echelon form it is simply the number of non-zero rows (the number of pivots). For a system of equations it counts the equations that are not redundant.

What is the largest possible rank of a 3×4 matrix?
3, because the rank can exceed neither the number of rows nor the number of columns: rank A ≤ min(m, n). A 3×4 matrix can have rank 0, 1, 2 or 3.

Does det A = 0 mean the rank is n − 1?
Not necessarily. det A = 0 only says the rank is less than n; it may be n − 1 or smaller. The 3×3 matrix of all ones has det = 0 and rank 1. Row-reduce to find the actual rank.

How does rank decide whether a system has solutions?
Compare rank A with rank [A|b]. If rank A is smaller, there is no solution. If they are equal and equal the number of unknowns, the solution is unique. If they are equal but smaller than the number of unknowns, there are infinitely many solutions with (unknowns − rank) free variables.

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

**What is the rank of a matrix in simple terms?**
It is the number of linearly independent rows of the matrix, which always equals the number of independent columns. After row reduction to echelon form it is simply the number of non-zero rows (the number of pivots). For a system of equations it counts the equations that are not redundant.

**What is the largest possible rank of a 3×4 matrix?**
3, because the rank can exceed neither the number of rows nor the number of columns: rank A ≤ min(m, n). A 3×4 matrix can have rank 0, 1, 2 or 3.

**Does det A = 0 mean the rank is n − 1?**
Not necessarily. det A = 0 only says the rank is less than n; it may be n − 1 or smaller. The 3×3 matrix of all ones has det = 0 and rank 1. Row-reduce to find the actual rank.

**How does rank decide whether a system has solutions?**
Compare rank A with rank [A|b]. If rank A is smaller, there is no solution. If they are equal and equal the number of unknowns, the solution is unique. If they are equal but smaller than the number of unknowns, there are infinitely many solutions with (unknowns − rank) free variables.
