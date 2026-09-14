---
title: Introduction to Laplace Transform
description: ความหมาย นิยาม และตัวอย่างพื้นฐานของการแปลงลาปลาซสำหรับนักศึกษาวิศวกรรม
slug: /laplace/introduction
keywords:
  - laplace transform
  - การแปลงลาปลาซ
  - engineering mathematics
tags: [laplace, differential-equations]
---

# Introduction to Laplace Transform

## Step 1 — Meaning

Laplace Transform เปลี่ยนฟังก์ชันในโดเมนเวลา $f(t)$ เป็นฟังก์ชันในโดเมนเชิงซ้อน $F(s)$ จุดสำคัญคือการเปลี่ยน **อนุพันธ์** ให้เป็นพีชคณิตที่จัดการง่ายขึ้น

## Step 2 — Definition

$$
F(s)=\mathcal{L}\{f(t)\}
=
\int_0^\infty f(t)e^{-st}\,dt
$$

## Step 3 — Canonical examples

$$
\mathcal{L}\{1\}=\frac{1}{s}
$$

$$
\mathcal{L}\{t^n\}=\frac{n!}{s^{n+1}}
$$

ดังนั้น

$$
\mathcal{L}\{t^2\}=\frac{2}{s^3}
$$

สมบัติสำคัญสำหรับอนุพันธ์คือ

$$
\mathcal{L}\left\{\frac{df}{dt}\right\}
=sF(s)-f(0)
$$

## Step 4 — Engineering

วงจร RL มีสมการ

$$
L\frac{di(t)}{dt}+Ri(t)=v(t)
$$

เมื่อ initial condition เป็นศูนย์

$$
(Ls+R)I(s)=V(s)
$$

จึงได้ transfer function

$$
\frac{I(s)}{V(s)}=\frac{1}{Ls+R}
$$

นี่คือเส้นทางจากกฎวงจร → differential equation → Laplace transform → transfer function

## เรียนต่อ

[Inverse Laplace Transform](./inverse-laplace-transform) → [First-Order System](../control/first-order-system)
