---
title: "Learning Matrices and Determinants: A 7-Step Roadmap from High School and Entrance Exams to Engineering Mathematics"
url: https://modsengineeringmath.com/en/blog/matrix-determinant-roadmap/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> A roadmap for matrices, determinants, rank, Cramer's rule and numerical methods: what to learn first, how far entrance exams go, what university adds, and a 7-day practice plan.

Markdown copy of https://modsengineeringmath.com/en/blog/matrix-determinant-roadmap/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Learning Matrices and Determinants: A 7-Step Roadmap from High School and Entrance Exams to Engineering Mathematics

THภาษาไทยENEnglish
// Article · Linear algebra


Many students feel that matrices are something they can compute but cannot see, because the topics are taught as separate formulas. This article puts everything on one path, from multiplying matrices at school to the methods circuit simulators use to solve millions of equations, and shows how far each goal needs to go.

The 30-second summary

- Every topic answers one question: how to solve $A\mathbf x = \mathbf b$, whether a solution exists, and how far it can be trusted

- Entrance exams: steps 1–3 (matrices, determinants, inverse, Cramer) · university: add steps 4–5 (row reduction, rank) · engineering: steps 6–7

- Practise with the 45 exam problems and random drill and check homework with the matrix lab (in Thai)

## Why matrices: systems of equations are everywhere

A three-mesh circuit gives three current equations, a steel roof truss gives force-balance equations at every joint, and a heat model gives one equation per point. All of them fit in one short line:

$$A\mathbf x = \mathbf b$$

Here $A$ holds the coefficients, $\mathbf x$ the unknowns and $\mathbf b$ the given values. A matrix is therefore not just a table of numbers but a language that lets you handle hundreds of equations as if they were one.

## The 7-step map

The path from school to engineering; colour shows the level: orange = entrance exam · blue = undergraduate · green = engineering practice.

| Step | Answers | Lesson (in Thai) |

| 1 Matrices | how to write a system as $A\mathbf x = \mathbf b$ and multiply | 7.1 |

| 2 Determinants | is the solution unique ($\det A \ne 0$)? | 7.2 |

| 3 Inverse · Cramer | what is the solution (small systems)? | 7.4 · 7.5 |

| 4 Row reduction | solve every case, even when $\det = 0$ | 7.3 |

| 5 Rank | one, infinitely many or no solutions? | 7.10 |

| 6 Numerical methods | solve large systems fast and accurately | 7.11 |

| 7 Eigenvalues · applications | how does the system respond (poles, modes)? | 7.6 · 7.7 |

## If your goal is a university entrance exam

- Multiply matrices fluently, and remember $AB \ne BA$ but $(AB)^T = B^TA^T$

- 2×2 and 3×3 determinants (Sarrus or cofactors)

- All determinant properties, especially $\det(kA) = k^n\det A$ and $\det(\operatorname{adj}A) = (\det A)^{n-1}$ — summarised in the 12 determinant properties article

- The 2×2 inverse and matrix equations $AX = B$ (multiply by $A^{-1}$ on the left)

- Cramer's rule for one unknown, and systems with a parameter ($\Delta = 0$: no solution versus infinitely many) — see the Cramer's rule article

## If you study engineering mathematics at university

- Gaussian and Gauss–Jordan elimination, used for solutions, inverses and rank

- Rank and the Rouché–Capelli theorem, “rank for every $k$” problems, the null space — see the rank of a matrix article

- Eigenvalues, eigenvectors and diagonalisation, which lead into control systems and differential equations

- Numerical methods: LU, Jacobi, Gauss–Seidel and the condition number — see the numerical methods comparison

## A 7-day practice plan (45–60 minutes a day)

- Day 1: read matrices and use the cell-by-cell product viewer

- Day 2: determinants up to the exam shortcuts; do set A, problems 1–6

- Day 3: inverse and Cramer's rule; set A, problems 7–12

- Day 4: row reduction; set A, problems 13–18

- Day 5: rank and the three-planes lab; set B, problems 1–8

- Day 6: numerical methods; set C

- Day 7: the random drill at every level until you get 10 in a row; revisit the formula codes in the solutions you missed

## Continue in the library (in Thai)

- The full 12-page linear algebra series with formula search

- 45 exam problems on matrices, determinants, rank and Cramer's rule

- Matrices in electric circuits and power systems

- Article: how to find a determinant and an inverse matrix

## Frequently asked questions

Where should I start learning matrices?
Start with size, addition, multiplication and the transpose, then 2×2 and 3×3 determinants and their properties, and only then the inverse, Cramer's rule and row reduction for solving systems. Every later topic relies on matrix multiplication and determinants.

How much matrix work do entrance exams need?
Fluent multiplication and transposes, 2×2 and 3×3 determinants, determinant properties (det(kA), det(AB), det(A⁻¹), det(adj A)), the 2×2 inverse, matrix equations, Cramer's rule and systems with a parameter. Rank and numerical methods belong to university courses.

What do engineers use matrices for?
To solve the equations of electric circuits (nodal and mesh analysis), power systems, structures and vibrations, to find the poles of control systems from eigenvalues, and to run numerical methods such as LU or Gauss–Seidel inside simulators with thousands to millions of unknowns.

Where can I practise matrix problems?
The exam-practice page in the library has 45 problems with step-by-step solutions at three levels (entrance exam, undergraduate and numerical methods) and a random problem generator that checks your answers instantly.

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
What Is the Rank of a Matrix? How to Find It and What It Tells You About a Linear System
The rank of a matrix explained visually: finding it by row reduction and by minors, using rank to decide whether Ax = b has one, infinitely many or…
25 Oct 2026Read the article →

All 7 articles in Vectors & Linear Algebra → · All articles

## Frequently asked questions

**Where should I start learning matrices?**
Start with size, addition, multiplication and the transpose, then 2×2 and 3×3 determinants and their properties, and only then the inverse, Cramer's rule and row reduction for solving systems. Every later topic relies on matrix multiplication and determinants.

**How much matrix work do entrance exams need?**
Fluent multiplication and transposes, 2×2 and 3×3 determinants, determinant properties (det(kA), det(AB), det(A⁻¹), det(adj A)), the 2×2 inverse, matrix equations, Cramer's rule and systems with a parameter. Rank and numerical methods belong to university courses.

**What do engineers use matrices for?**
To solve the equations of electric circuits (nodal and mesh analysis), power systems, structures and vibrations, to find the poles of control systems from eigenvalues, and to run numerical methods such as LU or Gauss–Seidel inside simulators with thousands to millions of unknowns.

**Where can I practise matrix problems?**
The exam-practice page in the library has 45 problems with step-by-step solutions at three levels (entrance exam, undergraduate and numerical methods) and a random problem generator that checks your answers instantly.
