---
title: DC Motor Mathematical Model
description: สร้างแบบจำลองมอเตอร์กระแสตรงจากสมการไฟฟ้าและกลศาสตร์สู่ transfer function
slug: /modeling/dc-motor
keywords: [DC motor model, transfer function, mathematical modeling]
---

# DC Motor Mathematical Model

## Electrical subsystem

$$
L\frac{di}{dt}+Ri+K_e\omega=v
$$

## Mechanical subsystem

$$
J\frac{d\omega}{dt}+b\omega=K_t i-T_L
$$

เมื่อพิจารณา $T_L=0$ และ initial conditions เป็นศูนย์ จะได้

$$
(Ls+R)I(s)+K_e\Omega(s)=V(s)
$$

$$
(Js+b)\Omega(s)=K_tI(s)
$$

กำจัด $I(s)$ แล้วได้ transfer function จากแรงดันถึงความเร็ว

$$
\boxed{
\frac{\Omega(s)}{V(s)}
=
\frac{K_t}
{(Ls+R)(Js+b)+K_eK_t}
}
$$

## ความหมายเชิงวิศวกรรม

- $R,L$ กำหนดพฤติกรรมทางไฟฟ้า
- $J,b$ กำหนดพฤติกรรมทางกล
- $K_e,K_t$ เชื่อมสองโดเมนเข้าด้วยกัน

แบบจำลองนี้เป็นฐานสำหรับออกแบบ speed controller และศึกษาการตอบสนองชั่วครู่
