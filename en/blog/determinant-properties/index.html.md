---
title: "12 Determinant Properties That Appear on Every Exam: det(kA), det(A⁻¹), det(adj A) and the Traps"
url: https://modsengineeringmath.com/en/blog/determinant-properties/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> The 12 determinant properties used in entrance exams and engineering mathematics: row operations, det(kA) = kⁿ det A, products, inverses and the adjugate, with examples and traps.

Markdown copy of https://modsengineeringmath.com/en/blog/determinant-properties/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# 12 Determinant Properties That Appear on Every Exam: det(kA), det(A⁻¹), det(adj A) and the Traps

THภาษาไทยENEnglish
// Article · Linear algebra


Most determinant exam questions do not ask you to compute from numbers. They give a single value of $\det A$ and ask for the determinant of a matrix built from $A$. Every such question is a one-liner once you know these 12 properties. Throughout, $A$ and $B$ are $n\times n$ and $k$ is a constant.

Three formulas to know by heart

- $\det(kA) = k^n\det A$ — the exponent is the size $n$

- $\det(AB) = \det A\det B$, hence $\det A^{-1} = 1/\det A$ and $\det A^m = (\det A)^m$

- $\det(\operatorname{adj}A) = (\det A)^{n-1}$

## Why the properties hold: the determinant is an area factor

A 2×2 matrix turns the unit square into a parallelogram, and $|\det A|$ is its area (for 3×3, a volume). Seen this way most properties are obvious: stretch every side by 2 and the area grows by $2^2$, the volume by $2^3$.

Left: $\det A = 5$ is the area the unit square becomes · right: scaling every row by 2 multiplies the area by $2^2$.

## Properties 1–6: row operations and special matrices

- Transpose: $\det A^T = \det A$ — so every row rule also works for columns

- Swap two rows: the sign changes

- Multiply one row by $k$: the determinant is multiplied by $k$ (factors come out one row at a time)

- Add a multiple of another row $R_i \leftarrow R_i + kR_j$: no change — the main tool of row reduction

- A zero row, two equal rows or proportional rows: $\det = 0$

- Triangular or diagonal matrix: $\det$ = product of the diagonal entries

Example

### If $\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix} = 5$, find $\begin{vmatrix} 2a & 2b & 2c \\ g & h & i \\ d + 3a & e + 3b & f + 3c \end{vmatrix}$

- Take 2 out of row 1 (property 3) · subtract a multiple of row 1 from row 3 to get $(d, e, f)$ without changing the value (property 4)

- The rows are now $(a, b, c), (g, h, i), (d, e, f)$; swapping rows 2 and 3 flips the sign (property 2)

$2\times(-5) = -10$

## Properties 7–10: constants, products, inverses and powers

- $\det(kA) = k^n\det A$ — because $k$ sits in all $n$ rows

- $\det(AB) = \det A\det B = \det(BA)$, even though $AB \ne BA$

- $\det(A^{-1}) = \dfrac{1}{\det A}$ — and $A$ is invertible exactly when $\det A \ne 0$

- $\det(A^m) = (\det A)^m$

Example

### $A$ is $3\times3$ with $\det A = 4$. Find $\det(2A^{-1}A^T)$

-
$$\det(2A^{-1}A^T) = 2^3\cdot\frac14\cdot4 = 8$$

8

## Property 11: the adjugate, where students slip most

Taking determinants of $A\operatorname{adj}A = (\det A)I$ gives $\det A\cdot\det(\operatorname{adj}A) = (\det A)^n$:

$$\det(\operatorname{adj}A) = (\det A)^{n-1},\qquad \operatorname{adj}(kA) = k^{n-1}\operatorname{adj}A,\qquad \operatorname{adj}(\operatorname{adj}A) = (\det A)^{n-2}A$$

Example

### $A$ is $3\times3$ with $\det A = 3$. Find $\det(2\operatorname{adj}A)$ and $\det(\operatorname{adj}(\operatorname{adj}A))$

-
$$\det(2\operatorname{adj}A) = 2^3\cdot3^{2} = 72$$

-
$$\det(\operatorname{adj}(\operatorname{adj}A)) = \det(3A) = 3^3\cdot3 = 81$$

72 and 81

## Property 12: what has no formula

Traps that appear every year

- $\det(A + B) \ne \det A + \det B$ — add the matrices first (only row-by-row linearity exists)

- $\det(kA) \ne k\det A$ and $\det(\operatorname{adj}A) \ne \det A$ — the exponent depends on $n$

- $\det(-A) = (-1)^n\det A$ — unchanged for 2×2 but sign-flipped for 3×3

- $|A|$ is not an absolute value; determinants can be negative

A bonus trick: if every row has the same sum, add all columns into the first column and take that sum out as a factor. For example, the matrix with $a$ on the diagonal and $b$ elsewhere has $\det = (a - b)^{n-1}(a + (n - 1)b)$.

## Continue in the library (in Thai)

- Determinants in full: exam shortcuts D22–D25 with proofs

- The inverse of a matrix and the adjugate

- Exam set A: 18 determinant and matrix problems

- Article: how to find a determinant and an inverse (2×2, 3×3)

- Article: how to use Cramer's rule

## Frequently asked questions

Is det(2A) equal to 2 det A?
No. Multiplying a matrix by 2 multiplies every row by 2, and a factor 2 can be taken out of each row once. For an n×n matrix det(2A) = 2ⁿ det A, so a 3×3 matrix gives 8 det A.

How do you find det(adj A)?
Use det(adj A) = (det A)ⁿ⁻¹, which follows from A adj A = (det A)I: taking determinants of both sides gives det A · det(adj A) = (det A)ⁿ. For a 3×3 matrix with det A = −2, det(adj A) = 4.

Is det(A + B) equal to det A + det B?
No. Determinants are not additive over whole matrices; add the matrices first and then take the determinant. Linearity only holds one row at a time.

Which row operation leaves the determinant unchanged?
Adding a multiple of one row to another (R_i ← R_i + kR_j) leaves it unchanged. Swapping two rows changes the sign, and multiplying one row by k multiplies the determinant by k.

## More articles worth reading

Linear algebra
Cramer's Rule: How to Use It, Why It Works, and When Not to Use It
Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0…
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

**Is det(2A) equal to 2 det A?**
No. Multiplying a matrix by 2 multiplies every row by 2, and a factor 2 can be taken out of each row once. For an n×n matrix det(2A) = 2ⁿ det A, so a 3×3 matrix gives 8 det A.

**How do you find det(adj A)?**
Use det(adj A) = (det A)ⁿ⁻¹, which follows from A adj A = (det A)I: taking determinants of both sides gives det A · det(adj A) = (det A)ⁿ. For a 3×3 matrix with det A = −2, det(adj A) = 4.

**Is det(A + B) equal to det A + det B?**
No. Determinants are not additive over whole matrices; add the matrices first and then take the determinant. Linearity only holds one row at a time.

**Which row operation leaves the determinant unchanged?**
Adding a multiple of one row to another (R_i ← R_i + kR_j) leaves it unchanged. Swapping two rows changes the sign, and multiplying one row by k multiplies the determinant by k.
