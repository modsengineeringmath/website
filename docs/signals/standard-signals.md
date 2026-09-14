---
title: Standard Continuous-Time Signals
description: สัญญาณมาตรฐานที่ใช้ใน Signals and Systems และ Control Systems
slug: /signals/standard-signals
keywords: [standard signals, unit step, impulse, ramp]
---

# Standard Continuous-Time Signals

## Unit step

$$
u(t)=
\begin{cases}
0,&t<0\\
1,&t\ge0
\end{cases}
$$

และ

$$
\mathcal{L}\{u(t)\}=\frac{1}{s}
$$

## Ramp

$$
r(t)=tu(t)
$$

$$
\mathcal{L}\{tu(t)\}=\frac{1}{s^2}
$$

## Exponential

$$
x(t)=e^{-at}u(t)
$$

$$
X(s)=\frac{1}{s+a}
$$

สัญญาณมาตรฐานทำหน้าที่เป็น test inputs สำหรับศึกษาการตอบสนองของระบบ LTI และระบบควบคุม
