---
title: RLC Circuit Mathematical Model
description: สร้างสมการเชิงอนุพันธ์และ transfer function ของวงจร RLC อนุกรม
slug: /electrical/rlc-circuit
keywords: [RLC circuit, circuit model, transfer function]
---

# RLC Circuit Mathematical Model

วงจร RLC อนุกรมเป็นตัวอย่างระบบอันดับสอง จากกฎแรงดันของ Kirchhoff

$$
v(t)=Ri(t)+L\frac{di(t)}{dt}+v_C(t)
$$

และ

$$
i(t)=C\frac{dv_C(t)}{dt}
$$

แทนค่าแล้วได้

$$
LC\frac{d^2v_C(t)}{dt^2}
+
RC\frac{dv_C(t)}{dt}
+
v_C(t)
=
v(t)
$$

เมื่อ initial conditions เป็นศูนย์

$$
(LCs^2+RCs+1)V_C(s)=V(s)
$$

ดังนั้น

$$
\boxed{
\frac{V_C(s)}{V(s)}
=
\frac{1}{LCs^2+RCs+1}
}
$$

## สะพานสู่ Control Systems

ตัวส่วนของ transfer function กำหนด natural frequency และ damping ratio จึงเชื่อมวงจร RLC เข้ากับการวิเคราะห์ transient response และ stability
