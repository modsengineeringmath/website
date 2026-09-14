---
title: First-Order System
description: ระบบอันดับหนึ่ง time constant, gain และ step response สำหรับวงจรและระบบควบคุม
slug: /control/first-order-system
keywords: [first order system, time constant, step response, ระบบอันดับหนึ่ง]
---

# First-Order System

รูปมาตรฐานของ transfer function ระบบอันดับหนึ่งคือ

$$
G(s)=\frac{K}{\tau s+1}
$$

เมื่ออินพุตเป็น unit step $R(s)=1/s$

$$
Y(s)=\frac{K}{s(\tau s+1)}
$$

แปลงกลับได้

$$
y(t)=K\left(1-e^{-t/\tau}\right)
$$

## Time constant

เมื่อ $t=\tau$

$$
y(\tau)=K(1-e^{-1})\approx0.632K
$$

ดังนั้น time constant คือเวลาที่การตอบสนองขึ้นถึงประมาณ **63.2%** ของค่าสุดท้าย

## Engineering examples

- วงจร RC: $\tau=RC$
- วงจร RL: $\tau=L/R$
- ระบบอุณหภูมิแบบ lumped model
- ระบบของไหลที่มี storage หนึ่งตัว

## เรียนต่อ

Stability → Root Locus → Bode Plot
