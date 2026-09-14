---
title: Introduction to Differential Equations
description: สมการเชิงอนุพันธ์คือแบบจำลองความสัมพันธ์ระหว่างตัวแปรและอัตราการเปลี่ยนแปลง
slug: /differential-equations/introduction
keywords: [differential equations, สมการเชิงอนุพันธ์, engineering model]
---

# Introduction to Differential Equations

สมการเชิงอนุพันธ์เชื่อมปริมาณทางกายภาพเข้ากับอัตราการเปลี่ยนแปลง ตัวอย่างระบบอันดับหนึ่งคือ

$$
\tau\frac{dy(t)}{dt}+y(t)=Ku(t)
$$

- $\tau$ คือ time constant
- $K$ คือ system gain
- $u(t)$ คือ input
- $y(t)$ คือ output

## ทำไมวิศวกรต้องเรียน

กฎของ Kirchhoff, Newton และสมดุลพลังงานมักนำไปสู่สมการเชิงอนุพันธ์ การแก้สมการจึงทำให้เราทำนายการตอบสนองของวงจร มอเตอร์ ระบบกล และกระบวนการควบคุมได้

## Initial condition

สมการอย่างเดียวอธิบายครอบครัวของคำตอบ ต้องมีค่าเริ่มต้น เช่น $y(0)=y_0$ เพื่อเลือกคำตอบที่ตรงกับสถานะจริงของระบบ

## เรียนต่อ

[Introduction to Laplace Transform](../laplace/introduction) ช่วยเปลี่ยนสมการเชิงอนุพันธ์ให้เป็นสมการพีชคณิต
