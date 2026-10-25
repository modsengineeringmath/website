---
title: "Dot Product vs Cross Product: Formulas, Meaning and Examples"
url: https://modsengineeringmath.com/en/blog/dot-product-cross-product/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> Compare the dot product (scalar product) and cross product (vector product): formulas, geometric meaning, calculation from components, and how they are used for work, torque and angles.

Markdown copy of https://modsengineeringmath.com/en/blog/dot-product-cross-product/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Dot Product vs Cross Product: Formulas, Meaning and Examples

THภาษาไทยENEnglish
// Article · Vectors


Two vectors can be multiplied in two ways. The first gives a number; the second gives a new vector. Both have clear physical meanings: the dot product is used for work and angles, while the cross product is used for torque and area.

30-second summary

- Dot: $\mathbf{a}\cdot\mathbf{b}=|\mathbf{a}||\mathbf{b}|\cos\theta=a_xb_x+a_yb_y+a_zb_z$ → scalar

- Cross: $|\mathbf{a}\times\mathbf{b}|=|\mathbf{a}||\mathbf{b}|\sin\theta$ → vector perpendicular to both, direction by the right-hand rule

- Dot = 0 ⇒ perpendicular · Cross = 0 ⇒ parallel

## A short comparison

| | Dot product $\mathbf{a}\cdot\mathbf{b}$ | Cross product $\mathbf{a}\times\mathbf{b}$ |

| Result | Scalar | Vector (3D) |

| Formula with the angle | $|\mathbf{a}||\mathbf{b}|\cos\theta$ | Magnitude $|\mathbf{a}||\mathbf{b}|\sin\theta$ |

| Formula with components | $a_xb_x+a_yb_y+a_zb_z$ | Determinant with $\mathbf{i},\mathbf{j},\mathbf{k}$ |

| Geometric meaning | Projection of one vector onto the other × length | Area of the parallelogram the two vectors span |

| Swapping the order | Unchanged | Sign reverses |

| Equals zero when | Perpendicular | Parallel |

| Used to find | Work, angle, projection, real power | Torque, magnetic force, a perpendicular direction |

## Dot product (scalar product)

For $\mathbf{a}=(a_x,a_y,a_z)$ and $\mathbf{b}=(b_x,b_y,b_z)$, multiply the components along the same axis and add them.

$$\mathbf{a}\cdot\mathbf{b}=a_xb_x+a_yb_y+a_zb_z=|\mathbf{a}||\mathbf{b}|\cos\theta$$

So the angle between the vectors follows from $\cos\theta=\dfrac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{a}||\mathbf{b}|}$. A positive value means an acute angle, a negative value an obtuse angle.

Work example

### A 50 N force at 30° to a 4 m displacement

-
$$W=\mathbf{F}\cdot\mathbf{d}=|\mathbf{F}||\mathbf{d}|\cos\theta=50\times4\times\cos30^\circ$$

$W = 200\times0.866 \approx 173.2$ J (only the component of the force parallel to the displacement does work)

## Cross product (vector product)

The result is perpendicular to both $\mathbf{a}$ and $\mathbf{b}$, with direction given by the right-hand rule: point your fingers along $\mathbf{a}$ and curl them toward $\mathbf{b}$; your thumb points in the direction of $\mathbf{a}\times\mathbf{b}$. With components it is calculated as follows.

$$\mathbf{a}\times\mathbf{b}=\begin{vmatrix}\mathbf{i}&\mathbf{j}&\mathbf{k}\\a_x&a_y&a_z\\b_x&b_y&b_z\end{vmatrix}=(a_yb_z-a_zb_y)\,\mathbf{i}-(a_xb_z-a_zb_x)\,\mathbf{j}+(a_xb_y-a_yb_x)\,\mathbf{k}$$

Torque example

### A 0.3 m wrench with a 100 N force perpendicular to the handle

-
$$\boldsymbol{\tau}=\mathbf{r}\times\mathbf{F},\quad |\boldsymbol{\tau}|=rF\sin90^\circ=0.3\times100\times1$$

$|\boldsymbol{\tau}|=30$ N·m, with the torque direction along the axis of rotation of the nut. If the force is applied at a slant, the torque falls in proportion to $\sin\theta$.

## The same example, computed both ways

Let $\mathbf{a}=(2,3,1)$ and $\mathbf{b}=(1,-1,4)$.

- Dot product

$$\mathbf{a}\cdot\mathbf{b}=2(1)+3(-1)+1(4)=3$$

- Cross product

$$\mathbf{a}\times\mathbf{b}=\big(3\cdot4-1\cdot(-1),\; 1\cdot1-2\cdot4,\; 2\cdot(-1)-3\cdot1\big)=(13,\,-7,\,-5)$$

- The angle between the vectors, with $|\mathbf{a}|=\sqrt{14}$, $|\mathbf{b}|=\sqrt{18}$

$$\cos\theta=\frac{3}{\sqrt{14}\sqrt{18}}\approx0.189\;\Rightarrow\;\theta\approx79.1^\circ$$

- Check with the magnitude of the cross product, which must equal $|\mathbf{a}||\mathbf{b}|\sin\theta$

$$|\mathbf{a}\times\mathbf{b}|=\sqrt{13^2+7^2+5^2}=\sqrt{243}\approx15.59$$

$\sqrt{14\times18}\,\sin79.1^\circ\approx15.87\times0.982\approx15.59$ ✓ and $\mathbf{a}\cdot(\mathbf{a}\times\mathbf{b})=2(13)+3(-7)+1(-5)=0$ ✓ (the cross product is perpendicular to $\mathbf{a}$)

## How it is used in electrical engineering

- Real power: treating the voltage and current phasors (RMS values) as vectors in a 2D plane, the real power $P=VI\cos\varphi$ is their dot product.

- Force on a conductor: $\mathbf{F}=I\,\mathbf{L}\times\mathbf{B}$ and the Lorentz force $\mathbf{F}=q\,\mathbf{v}\times\mathbf{B}$ are cross products.

- Motor torque: $\boldsymbol{\tau}=\mathbf{r}\times\mathbf{F}$.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- Dot product: angle, work and projection (in Thai)

- Cross product: right-hand rule, torque and area (in Thai)

- 3D vector studio: drag vectors and see the dot and cross products instantly (in Thai)

- Phasors and AC circuit analysis (in Thai)

## Frequently asked questions

How do the results of the dot product and cross product differ?
The dot product gives a scalar (a single number). The cross product gives a vector perpendicular to both vectors, with its direction given by the right-hand rule. The cross product is defined only for 3D vectors.

What does it mean if the dot product is zero?
The two vectors are perpendicular (when neither is the zero vector). For example, a force perpendicular to the motion does zero work.

What does it mean if the cross product is the zero vector?
The two vectors are parallel or lie along the same line, because $\sin\theta = 0$.

Why does the sign change when you swap the order of a cross product?
Because the direction of the result is set by the right-hand rule. Swapping the order, $\mathbf{b}\times\mathbf{a}$, reverses the direction, so $\mathbf{b}\times\mathbf{a}=-\,\mathbf{a}\times\mathbf{b}$. The dot product is commutative.

## More articles worth reading

Linear algebra
Cramer's Rule: How to Use It, Why It Works, and When Not to Use It
Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0…
25 Oct 2026Read the article →

Linear algebra
12 Determinant Properties That Appear on Every Exam: det(kA), det(A⁻¹), det(adj A) and the Traps
The 12 determinant properties used in entrance exams and engineering mathematics: row operations, det(kA) = kⁿ det A, products, inverses and the…
25 Oct 2026Read the article →

Numerical methods
Solving Linear Systems Numerically: Gauss, LU, Jacobi or Gauss–Seidel — Which Should You Use?
Numerical methods for linear systems compared: Gaussian elimination with pivoting, LU, Cholesky, Jacobi, Gauss–Seidel, SOR, convergence and the…
25 Oct 2026Read the article →

All 7 articles in Vectors & Linear Algebra → · All articles

## Frequently asked questions

**How do the results of the dot product and cross product differ?**
The dot product gives a scalar (a single number). The cross product gives a vector perpendicular to both vectors, with its direction given by the right-hand rule. The cross product is defined only for 3D vectors.

**What does it mean if the dot product is zero?**
The two vectors are perpendicular (when neither is the zero vector). For example, a force perpendicular to the motion does zero work.

**What does it mean if the cross product is the zero vector?**
The two vectors are parallel or lie along the same line, because $\sin\theta = 0$.

**Why does the sign change when you swap the order of a cross product?**
Because the direction of the result is set by the right-hand rule. Swapping the order, $\mathbf{b}\times\mathbf{a}$, reverses the direction, so $\mathbf{b}\times\mathbf{a}=-\,\mathbf{a}\times\mathbf{b}$. The dot product is commutative.
