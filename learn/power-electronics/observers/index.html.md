---
title: "ตัวสังเกตกระแสและสถานะ (Observer) ในคอนเวอร์เตอร์ และการเฝ้าสังเกตสภาวะแวดล้อม"
url: https://modsengineeringmath.com/learn/power-electronics/observers/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> ประมาณกระแสตัวเหนี่ยวนำและกระแสโหลดโดยไม่ใช้เซนเซอร์: Luenberger observer ของบั๊ก extended-state/disturbance observer สำหรับ load-current feedforward Kalman filter ข้อจำกัด และการเฝ้าสังเกตเหตุการณ์แวดล้อม เช่น input voltage feedforward อุณหภูมิ ESR ของตัวเก็บประจุ การอิ่มตัวของแกน และ event log

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/observers/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# ตัวสังเกตกระแสและสถานะ (Observer) ในคอนเวอร์เตอร์ และการเฝ้าสังเกตสภาวะแวดล้อม

// บทที่ 13.9 · อิเล็กทรอนิกส์กำลัง · Observers & Condition Monitoring


Luenberger observer ประมาณ iL disturbance observer ประมาณกระแสโหลดเพื่อ feedforward Kalman filter ข้อควรระวัง และการเฝ้าสังเกต Vin อุณหภูมิ ESR และการอิ่มตัว

สรุปใน 30 วินาที

- ขั้วตัวสังเกตเร็วกว่าลูปควบคุม 3–5 เท่า

- เพิ่มสถานะ $i_o$ → feedforward ลด load-step dip

- ห้ามใช้ค่าประมาณทำ OCP

- $\widehat{ESR} = \Delta v_{o,f_s}/\Delta i_L$ ใช้ทำนายอายุตัวเก็บประจุ

@@H2 why-observe|ทำไมต้องสังเกตแทนวัด@@
เซนเซอร์กระแสเพิ่มต้นทุน การสูญเสีย สัญญาณรบกวน และจุดเสีย ถ้าเรารู้แบบจำลองและวัด $v_o$, $v_{in}$, $d$ ได้ เราประมาณ $i_L$ และกระแสโหลดได้

@@H2 luenberger|Luenberger observer สำหรับ Buck@@
แบบจำลองเฉลี่ย ($\mathbf x=[i_L\;v_o]^T$, กระแสโหลด $i_o$ เป็นสัญญาณรบกวน):

O1 Averaged buck state model แบบจำลองสถานะของบั๊ก

$$\dot{\mathbf x} = \underbrace{\begin{bmatrix}-r_L/L & -1/L\\ 1/C & 0\end{bmatrix}}_{A}\mathbf x + \begin{bmatrix}v_{in}/L\\0\end{bmatrix}d + \begin{bmatrix}0\\-1/C\end{bmatrix}i_o,\qquad y = v_o$$

ตัวสังเกต: $\dot{\hat{\mathbf x}} = A\hat{\mathbf x} + B d + L_o(y - \hat y)$ เลือก $L_o$ ให้ขั้วของ $A - L_oC_y$ เร็วกว่าลูปควบคุม 3–5 เท่า แต่ช้ากว่า $f_s/5$

@@H2 load-observer|ประมาณกระแสโหลดด้วย Extended-state / Disturbance observer@@
เพิ่มสถานะ $i_o$ โดยสมมติ $\dot i_o \approx 0$:

O2 Extended-state load observer ตัวสังเกตกระแสโหลด

$$\mathbf z = [i_L\; v_o\; i_o]^T,\quad \dot{\hat i}_o = l_3(v_o - \hat v_o)$$

นำ $\hat i_o$ ไปทำ load-current feedforward → load-step dip ลดลงอย่างมาก (เทคนิคที่ใช้ใน VRM และ EV charger)

@@H2 kalman|Kalman filter@@
เมื่อสัญญาณวัดมีสัญญาณรบกวนมาก (ADC + สวิตชิ่ง) ใช้ Kalman แบบดิสครีต: ทำนาย $\hat x^-=A_d\hat x + B_d u$, $P^-=A_dPA_d^T+Q$ แล้วแก้ไข $K=P^-C^T(CP^-C^T+R)^{-1}$ — ปรับ $Q$ (ความไม่แน่นอนของแบบจำลอง) กับ $R$ (สัญญาณรบกวนวัด) เป็นตัวแลกระหว่างความเร็วกับความเรียบ

## ข้อควรระวังของการสังเกต

- ความผิดพลาดของ $L$, $C$, $r_L$ (±20%) → ค่าประมาณเอนเอียง → ใช้ร่วมกับเซนเซอร์ราคาถูกความเร็วต่ำ (fusion)

- การป้องกันกระแสเกินห้ามพึ่งค่าประมาณ ต้องมีวงจรตรวจจริงเสมอ

## การเฝ้าสังเกตเหตุการณ์แวดล้อม (Condition & Event Monitoring)

|
สิ่งที่สังเกต |
วิธี |
ใช้ทำอะไร |

|
$V_{in}$ เปลี่ยน |
วัด + input voltage feedforward ($d \propto 1/V_{in}$) |
ลด $G_{vg}$, ทนแหล่งจ่ายผันผวน (โซลาร์, แบต) |

|
อุณหภูมิฮีตซิงก์/ขด |
NTC ใกล้ MOSFET |
derating, ชดเชย DCR |

|
ESR ของ $C_{out}$ เพิ่ม |
วัด ripple ที่ $f_s$ เทียบกับ $\Delta i_L$ → $\widehat{ESR} = \Delta v_{o,f_s}/\Delta i_L$ |
ทำนายอายุตัวเก็บประจุ (ESR ×2 = หมดอายุ) |

|
L เข้าใกล้อิ่มตัว |
ความชันกระแสขาขึ้นเพิ่มผิดปกติ |
ลดกระแสพีก |

|
เหตุการณ์ผิดปกติ (OVP, brown-out, ลัดวงจร) |
บันทึก event log + timestamp |
วิเคราะห์ย้อนหลัง/บำรุงรักษาเชิงพยากรณ์ — ดู AI ช่วยควบคุม |

## คำถามที่พบบ่อย

ประมาณกระแสตัวเหนี่ยวนำโดยไม่ใช้เซนเซอร์ได้อย่างไร?
ใช้แบบจำลองเฉลี่ยของวงจรร่วมกับค่าที่วัดได้คือแรงดันขาออก แรงดันขาเข้า และ duty แล้วสร้าง Luenberger observer ที่ป้อนกลับความต่างระหว่างแรงดันที่วัดกับที่ประมาณ ค่าประมาณจะลู่เข้าค่าจริงด้วยความเร็วที่กำหนดจากขั้วของตัวสังเกต

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**ประมาณกระแสตัวเหนี่ยวนำโดยไม่ใช้เซนเซอร์ได้อย่างไร?**
ใช้แบบจำลองเฉลี่ยของวงจรร่วมกับค่าที่วัดได้คือแรงดันขาออก แรงดันขาเข้า และ duty แล้วสร้าง Luenberger observer ที่ป้อนกลับความต่างระหว่างแรงดันที่วัดกับที่ประมาณ ค่าประมาณจะลู่เข้าค่าจริงด้วยความเร็วที่กำหนดจากขั้วของตัวสังเกต
