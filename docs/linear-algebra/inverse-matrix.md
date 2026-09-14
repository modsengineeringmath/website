---
title: Inverse Matrix
description: ความหมาย วิธีหา และการใช้เมทริกซ์ผกผันแก้ระบบสมการเชิงเส้นสำหรับงานวิศวกรรม
slug: /linear-algebra/inverse-matrix
keywords:
  - inverse matrix
  - เมทริกซ์ผกผัน
  - linear algebra
tags: [linear-algebra, matrix]
---

# Inverse Matrix — เมทริกซ์ผกผัน

## Step 1 — Meaning

เมทริกซ์ผกผันทำหน้าที่คล้ายส่วนกลับของจำนวน ถ้า $a^{-1}a=1$ สำหรับเมทริกซ์จะเป็น

$$
A^{-1}A=AA^{-1}=I
$$

## Step 2 — Definition

เมทริกซ์จัตุรัส $A$ จะมีอินเวอร์สก็ต่อเมื่อ $\det(A)\ne0$

สำหรับเมทริกซ์ขนาด $2\times2$

$$
A=
\begin{bmatrix}
a&b\\
c&d
\end{bmatrix}
$$

จะได้

$$
A^{-1}
=
\frac{1}{ad-bc}
\begin{bmatrix}
d&-b\\
-c&a
\end{bmatrix}
$$

## Step 3 — Technique

ให้

$$
A=
\begin{bmatrix}
2&1\\
1&1
\end{bmatrix}
$$

เนื่องจาก $\det(A)=2(1)-1(1)=1$ จึงมีอินเวอร์ส

$$
A^{-1}
=
\begin{bmatrix}
1&-1\\
-1&2
\end{bmatrix}
$$

ตรวจสอบได้จาก $AA^{-1}=I$

## Step 4 — Engineering

ระบบสมการเชิงเส้นเขียนได้เป็น

$$
A\mathbf{x}=\mathbf{b}
$$

ถ้า $A^{-1}$ มีอยู่ คำตอบคือ

$$
\mathbf{x}=A^{-1}\mathbf{b}
$$

แนวคิดนี้เชื่อมไปสู่ nodal analysis, parameter estimation, state-space models และ numerical methods

## เรียนต่อ

Eigenvalues → Differential Equations → State-Space Control
