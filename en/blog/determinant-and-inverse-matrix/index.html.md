---
title: "How to Find the Determinant and Inverse Matrix (2×2 and 3×3) with Examples"
url: https://modsengineeringmath.com/en/blog/determinant-and-inverse-matrix/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> Learn to find 2×2 and 3×3 determinants by cofactors and the inverse matrix with the adjugate formula, with numeric examples checked by multiplying back, and the condition for a singular matrix.

Markdown copy of https://modsengineeringmath.com/en/blog/determinant-and-inverse-matrix/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# How to Find the Determinant and Inverse Matrix (2×2 and 3×3) with Examples

THภาษาไทยENEnglish
// Article · Linear algebra


The determinant tells you whether a matrix is invertible, and the inverse is used to solve systems of equations such as the currents in a multi-loop circuit. This article walks through the hand calculations with examples checked by multiplying back.

30-second summary

- 2×2: $\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$

- 3×3: expand along the first row with cofactors (alternating signs $+\,-\,+$)

- Inverse: $A^{-1}=\dfrac{1}{\det A}\operatorname{adj}(A)$, which exists only when $\det A\ne0$

## The 2×2 determinant

$$\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$$

Example: $\det\begin{pmatrix}4&7\\2&6\end{pmatrix}=4\cdot6-7\cdot2=24-14=10$

## The 3×3 determinant by cofactors

Expand along the first row: multiply each entry by the 2×2 determinant that remains when its row and column are removed, with alternating signs $+,-,+$.

$$\det A=a_{11}M_{11}-a_{12}M_{12}+a_{13}M_{13}$$

Example

### $A=\begin{pmatrix}2&1&3\\0&-1&4\\1&2&5\end{pmatrix}$

-
$$\det A=2\begin{vmatrix}-1&4\\2&5\end{vmatrix}-1\begin{vmatrix}0&4\\1&5\end{vmatrix}+3\begin{vmatrix}0&-1\\1&2\end{vmatrix}$$

-
$$=2(-5-8)-1(0-4)+3(0+1)=-26+4+3$$

$\det A=-19$ (not zero, so the inverse exists)

For 3×3 you can also use the Sarrus rule: copy the first two columns to the right, add the products along the three downward diagonals and subtract the products along the three upward diagonals. The result is the same.

## The 2×2 inverse (shortcut formula)

$$\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$$

Swap $a$ and $d$, change the signs of $b$ and $c$, then divide by the determinant.

Example

### $N=\begin{pmatrix}4&7\\2&6\end{pmatrix}$

-
$$N^{-1}=\frac{1}{10}\begin{pmatrix}6&-7\\-2&4\end{pmatrix}=\begin{pmatrix}0.6&-0.7\\-0.2&0.4\end{pmatrix}$$

- Check: the first row of $N$ times the first column of $N^{-1}$

$$4(0.6)+7(-0.2)=2.4-1.4=1$$

And $4(-0.7)+7(0.4)=0$, $2(0.6)+6(-0.2)=0$, $2(-0.7)+6(0.4)=1$, so $NN^{-1}=I$ ✓

## The 3×3 inverse with the adjugate

Steps: (1) find the cofactor matrix $C$; (2) swap rows and columns (transpose) to get $\operatorname{adj}(A)=C^{T}$; (3) divide by $\det A$.

Continuing the example $A$ above

### Find $A^{-1}$

- Cofactors $C_{ij}=(-1)^{i+j}M_{ij}$

$$C=\begin{pmatrix}-13&4&1\\1&7&-3\\7&-8&-2\end{pmatrix}$$

- Transpose

$$\operatorname{adj}(A)=C^{T}=\begin{pmatrix}-13&1&7\\4&7&-8\\1&-3&-2\end{pmatrix}$$

- Divide by $\det A=-19$

$$A^{-1}=\frac{1}{19}\begin{pmatrix}13&-1&-7\\-4&-7&8\\-1&3&2\end{pmatrix}$$

Check: the first row of $A$ times the first column of $A^{-1}$: $\dfrac{1}{19}\big(2(13)+1(-4)+3(-1)\big)=\dfrac{19}{19}=1$ ✓ and the first row times the second column: $\dfrac{1}{19}\big(2(-1)+1(-7)+3(3)\big)=0$ ✓

## What it is used for

- Solving systems of equations: $A\mathbf{x}=\mathbf{b}\Rightarrow\mathbf{x}=A^{-1}\mathbf{b}$, for example the loop currents in a multi-loop electric circuit.

- Checking for a unique solution: if $\det A\ne0$ the system has exactly one solution.

- Eigenvalues: found from $\det(A-\lambda I)=0$, used in the stability analysis of state-space systems.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- Determinants: properties, cofactors and row operations (in Thai)

- The inverse matrix, by both the adjugate and Gauss–Jordan (in Thai)

- Matrix lab: a calculator that shows the working step by step (in Thai)

- Applications in electric circuits and power systems (in Thai)

## Frequently asked questions

What does a zero determinant mean?
The matrix is singular and has no inverse, and the system $A\mathbf{x}=\mathbf{b}$ does not have a unique solution: it has either no solution or infinitely many. The rows or columns of the matrix are linearly dependent.

Can the Sarrus rule be used for a 4×4 matrix?
No. The Sarrus rule (drawing diagonals) works only for 3×3. Larger matrices use cofactor expansion or row operations down to a triangular matrix.

Why do we divide by the determinant when finding the inverse?
Because $A\,\operatorname{adj}(A)=\det(A)\,I$, so we must divide by $\det(A)$ to get the identity matrix. That is impossible when $\det(A)=0$.

Which method is preferred for finding an inverse in practice?
By hand, use the shortcut formula for 2×2, and the adjugate or row operations (Gauss–Jordan) for 3×3. In computer programs one usually solves $A\mathbf{x}=\mathbf{b}$ by factorisation without forming the inverse explicitly, for better accuracy.

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

**What does a zero determinant mean?**
The matrix is singular and has no inverse, and the system $A\mathbf{x}=\mathbf{b}$ does not have a unique solution: it has either no solution or infinitely many. The rows or columns of the matrix are linearly dependent.

**Can the Sarrus rule be used for a 4×4 matrix?**
No. The Sarrus rule (drawing diagonals) works only for 3×3. Larger matrices use cofactor expansion or row operations down to a triangular matrix.

**Why do we divide by the determinant when finding the inverse?**
Because $A\,\operatorname{adj}(A)=\det(A)\,I$, so we must divide by $\det(A)$ to get the identity matrix. That is impossible when $\det(A)=0$.

**Which method is preferred for finding an inverse in practice?**
By hand, use the shortcut formula for 2×2, and the adjugate or row operations (Gauss–Jordan) for 3×3. In computer programs one usually solves $A\mathbf{x}=\mathbf{b}$ by factorisation without forming the inverse explicitly, for better accuracy.
