---
title: Inverse Laplace Transform
description: หาอินเวอร์สลาปลาซด้วย partial fractions พร้อมตัวอย่างมาตรฐานสำหรับระบบอันดับหนึ่ง
slug: /laplace/inverse-laplace-transform
keywords: [inverse laplace transform, partial fractions, อินเวอร์สลาปลาซ]
---

# Inverse Laplace Transform

Inverse Laplace Transform นำ $F(s)$ กลับสู่ $f(t)$

$$
f(t)=\mathcal{L}^{-1}\{F(s)\}
$$

## Canonical problem

หา

$$
\mathcal{L}^{-1}
\left\{
\frac{1}{s(s+2)}
\right\}
$$

แยกเศษส่วนย่อย

$$
\frac{1}{s(s+2)}
=
\frac{A}{s}+\frac{B}{s+2}
$$

จาก

$$
1=A(s+2)+Bs
$$

แทน $s=0$ ได้ $A=\frac{1}{2}$ และแทน $s=-2$ ได้ $B=-\frac{1}{2}$ ดังนั้น

$$
F(s)=\frac{1}{2s}-\frac{1}{2(s+2)}
$$

แปลงกลับ

$$
\boxed{
f(t)=\frac{1}{2}\left(1-e^{-2t}\right)
}
$$

## Engineering meaning

รูป $1-e^{-at}$ ปรากฏบ่อยในการตอบสนองขั้นบันไดของระบบอันดับหนึ่ง เช่น วงจร RC, RL และระบบอุณหภูมิ

## เรียนต่อ

[First-Order System](../control/first-order-system)
