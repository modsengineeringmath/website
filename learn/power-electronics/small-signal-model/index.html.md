---
title: "แบบจำลองสัญญาณเล็กของคอนเวอร์เตอร์ DC-DC: State-Space Averaging และฟังก์ชันถ่ายโอน"
url: https://modsengineeringmath.com/learn/power-electronics/small-signal-model/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> หาฟังก์ชันถ่ายโอนของคอนเวอร์เตอร์ DC-DC ด้วย state-space averaging และ linearization: Gvd Gvg Zout Zin ตารางของบั๊ก บูสต์ บั๊ก-บูสต์ PWM modulator gain ลูปเกน T(s) ดีเลย์ของการควบคุมดิจิทัล เกณฑ์ตัวกรองขาเข้า Middlebrook averaged switch model และสคริปต์ Python วาด Bode

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/small-signal-model/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# แบบจำลองสัญญาณเล็กของคอนเวอร์เตอร์ DC-DC: State-Space Averaging และฟังก์ชันถ่ายโอน

// บทที่ 13.5 · อิเล็กทรอนิกส์กำลัง · Small-Signal Modeling


เฉลี่ยสถานะตลอดคาบแล้ว linearize ได้ Gvd G_vg Z_out ตารางฟังก์ชันถ่ายโอนของบั๊ก บูสต์ บั๊ก-บูสต์ PWM gain ลูปเกน และเกณฑ์ฟิลเตอร์ขาเข้าของ Middlebrook

สรุปใน 30 วินาที

- เฉลี่ย $A = DA_1 + D'A_2$ แล้วรบกวนรอบจุดทำงาน

- $G_{vd}$ มีขั้วคู่ $\omega_0$ และ (บูสต์ บั๊ก-บูสต์) RHP zero

- ลูปเกน $T = G_c\,G_{vd}\,H/V_M$

- ขาเข้าเป็นความต้านทานลบ $-V_{in}^2/P$ → ระวังฟิลเตอร์ขาเข้า

คอนเวอร์เตอร์เป็นระบบ ไม่เชิงเส้นและแปรตามเวลา (สวิตช์เปิด/ปิด) แต่ถ้าสนใจความถี่ต่ำกว่า $f_s/2$ มาก เราเฉลี่ยตลอดคาบแล้ว linearize รอบจุดทำงานได้

## State-space averaging (Middlebrook & Ćuk, 1976)

สถานะ $\mathbf x = [i_L\; v_C]^T$ แต่ละช่วงสวิตช์:

S1 Switched state equations สมการสถานะแต่ละช่วง

$$\dot{\mathbf x} = A_1\mathbf x + B_1 v_{in}\;(\text{ON}),\qquad \dot{\mathbf x} = A_2\mathbf x + B_2 v_{in}\;(\text{OFF})$$

เฉลี่ยถ่วงน้ำหนักด้วย $d$ และ $d' = 1-d$:

S2 Averaged state equation สมการสถานะเฉลี่ย

$$\dot{\mathbf x} = (dA_1 + d'A_2)\mathbf x + (dB_1+d'B_2)v_{in}$$

แทน $d = D + \hat d$, $\mathbf x = X + \hat{\mathbf x}$ ตัดพจน์อันดับสอง:

S3 DC operating point and AC model จุดทำงานและแบบจำลอง AC

$$\text{DC: } X = -A^{-1}BV_{in},\qquad
\text{AC: } \dot{\hat{\mathbf x}} = A\hat{\mathbf x} + B\hat v_{in} + \big[(A_1-A_2)X + (B_1-B_2)V_{in}\big]\hat d$$

โดย $A = DA_1 + D'A_2$ จากนั้น $G_{vd}(s) = C(sI-A)^{-1}B_d$

## ตารางฟังก์ชันถ่ายโอน (CCM, ไม่คิด ESR)

รูปทั่วไป: $G_{vd}(s) = G_{d0}\dfrac{1 - s/\omega_z}{1 + s/(Q\omega_0) + (s/\omega_0)^2}$

|
วงจร |
$G_{d0}$ |
$\omega_0$ |
$Q$ |
$\omega_z$ (RHP) |

|
Buck |
$V_o/D$ |
$1/\sqrt{LC}$ |
$R\sqrt{C/L}$ |
$\infty$ |

|
Boost |
$V_o/D'$ |
$D'/\sqrt{LC}$ |
$D'R\sqrt{C/L}$ |
$D'^2R/L$ |

|
Buck-boost |
$\lvert V_o\rvert/(DD') = V_{in}/D'^2$ |
$D'/\sqrt{LC}$ |
$D'R\sqrt{C/L}$ |
$D'^2R/(DL)$ |

## PWM modulator และ loop gain

ตัวเปรียบเทียบกับ ramp สูง $V_M$: $\hat d = \hat v_c / V_M$ ดังนั้น

S4 Loop gain ลูปเกน

$$T(s) = G_c(s)\cdot \frac{1}{V_M}\cdot G_{vd}(s)\cdot H(s),\qquad H = \frac{R_2}{R_1+R_2}$$

ในตัวควบคุมดิจิทัล $V_M$ เทียบเท่าค่า count เต็มของ PWM และต้องรวม delay $e^{-sT_d}$ ($T_d\approx 1.5T_s$ สำหรับ update ครั้งเดียวต่อคาบ) — ดู การควบคุมดิจิทัล

## ฟังก์ชันอื่นที่ต้องรู้

- $G_{vg} = \hat v_o/\hat v_{in}$ (audio susceptibility) — buck: $D\cdot\dfrac{1}{1+s/(Q\omega_0)+(s/\omega_0)^2}$

- $Z_{out}$ — ใช้ประเมิน load-step: $\Delta V \approx \Delta I \cdot |Z_{out,cl}|$, กับวงปิด $Z_{out,cl}=Z_{out,ol}/(1+T)$

- $Z_{in}$ — ที่ความถี่ต่ำ คอนเวอร์เตอร์คุมแรงดันเป็น ความต้านทานเชิงลบ $-V_{in}^2/P$

## เกณฑ์ตัวกรองอินพุตของ Middlebrook

ถ้าใส่ LC filter หน้า converter ต้องให้ $|Z_{o,filter}| \ll |Z_{in,conv}|$ ทุกความถี่ มิฉะนั้นวงจรจะแกว่ง (เพราะความต้านทานลบ) → ต้องหน่วงฟิลเตอร์ด้วย $R_d$–$C_d$ เป็นสาเหตุจริงของอาการ "ต่อสายยาว/เปลี่ยนแหล่งจ่ายแล้วแกว่ง" ดู วิเคราะห์อาการเสีย

## แบบจำลองเชิงวงจร: Averaged switch (PWM switch ของ Vorpérian)

แทนคู่สวิตช์-ไดโอดด้วยหม้อแปลงอุดมคติอัตรา $1:D$ + แหล่งพึ่งพา — ใช้ใน SPICE (.ac analysis) ได้ทันที เร็วกว่าซิมสวิตชิ่งมาก และรวม DCM ได้

## ตรวจสอบด้วยการวัด

ฉีดสัญญาณผ่านตัวต้านทาน 10–50 Ω ในลูปป้อนกลับ (ดู เทคนิคเชิงช่าง) หรือในซิมูเลเตอร์ของเว็บนี้: ตั้ง Open loop, ฟังก์ชันเจนฯ ฉีดที่ Duty แบบ sine ขนาด 0.01 แล้ววัดอัตราส่วน p-p ของ Vout ต่อ 0.02 ที่หลายความถี่ → ได้ $|G_{vd}|$ เทียบกับสูตรข้างบน

## Python: วาด Bode ของ Buck

Vin, L, C, R, ESR = 24, 100e-6, 100e-6, 10, 0.02
s = ct.tf('s')
Gvd = Vin*(1 + s*ESR*C)/(L*C*s**2 + (L/R + ESR*C)*s + 1)
ct.bode_plot(Gvd, omega_limits=(2*np.pi*10, 2*np.pi*1e5), Hz=True)

## คำถามที่พบบ่อย

ทำไมคอนเวอร์เตอร์ที่ปกติดีถึงแกว่งเมื่อใส่ฟิลเตอร์ LC ขาเข้า?
คอนเวอร์เตอร์ที่คุมแรงดันมีอิมพีแดนซ์ขาเข้าเป็นความต้านทานลบที่ความถี่ต่ำ ถ้าอิมพีแดนซ์ขาออกของฟิลเตอร์ไม่น้อยกว่ามากที่ทุกความถี่ ระบบรวมจะไม่เสถียร ต้องหน่วงฟิลเตอร์ตามเกณฑ์ Middlebrook

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**ทำไมคอนเวอร์เตอร์ที่ปกติดีถึงแกว่งเมื่อใส่ฟิลเตอร์ LC ขาเข้า?**
คอนเวอร์เตอร์ที่คุมแรงดันมีอิมพีแดนซ์ขาเข้าเป็นความต้านทานลบที่ความถี่ต่ำ ถ้าอิมพีแดนซ์ขาออกของฟิลเตอร์ไม่น้อยกว่ามากที่ทุกความถี่ ระบบรวมจะไม่เสถียร ต้องหน่วงฟิลเตอร์ตามเกณฑ์ Middlebrook
