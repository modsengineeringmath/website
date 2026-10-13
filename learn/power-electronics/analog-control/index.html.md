---
title: "ควบคุมคอนเวอร์เตอร์แบบอนาล็อกด้วยออปแอมป์: PWM, Error Amplifier, วัดกระแส, TL494, UC3843"
url: https://modsengineeringmath.com/learn/power-electronics/analog-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> สร้างตัวควบคุมคอนเวอร์เตอร์ DC-DC แบบอนาล็อก: วงจรสร้างคลื่นสามเหลี่ยมด้วยออปแอมป์ comparator PWM error amplifier Type II/III การเลือกออปแอมป์ตาม GBW การวัดกระแสด้วย shunt DCR Hall CT leading-edge blanking และการใช้ TL494 UC3843 TL431 กับ optocoupler

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/analog-control/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# ควบคุมคอนเวอร์เตอร์แบบอนาล็อกด้วยออปแอมป์: PWM, Error Amplifier, วัดกระแส, TL494, UC3843

// บทที่ 13.7 · อิเล็กทรอนิกส์กำลัง · Analog Control with Op-Amps


สร้าง PWM ด้วยออปแอมป์ล้วน error amplifier การเลือกออปแอมป์ วิธีวัดกระแส 4 แบบ ชิปคลาสสิก TL494 UC384x TL431 + optocoupler และเช็กลิสต์

สรุปใน 30 วินาที

- $d = v_c/V_M$ — feedforward $V_M \propto V_{in}$ ตัดผลของแรงดันขาเข้า

- สามเหลี่ยม $f = R_B/(4R_ARC)$

- GBW ของออปแอมป์ ≥ 10 เท่าของที่ต้องการ

- PCMC ต้องมี leading-edge blanking

@@H2 voltage-mode|สถาปัตยกรรม Voltage mode@@
@@CODE0@@
duty: $d = v_c/V_M$ เมื่อ ramp สูง $V_M$ (ใส่ฟีดฟอร์เวิร์ด $V_M \propto V_{in}$ ทำให้ลูป gain ไม่ขึ้นกับ $V_{in}$ และตัด $G_{vg}$ ได้)

@@H2 opamp-pwm|สร้าง PWM ด้วย op-amp ล้วน (เหมาะกับแลปการสอน)@@
ตัวสร้างคลื่นสามเหลี่ยม: Schmitt trigger (comparator + $R_A$, $R_B$) ต่อกับ integrator ($R$, $C$)

A1 Op-amp triangle generator วงจรสร้างคลื่นสามเหลี่ยม

$$f = \frac{R_B}{4R_A R C},\qquad V_{tri,pp} = 2V_{sat}\frac{R_A}{R_B}$$

ตัวอย่าง: $R=10$ kΩ, $C=1$ nF, $R_A=10$ kΩ, $R_B=20$ kΩ → $f = 50$ kHz ใช้ op-amp ที่ slew rate ≥ $4 V_{pp} f$ (เช่น ≥ 2 V/µs ที่ 50 kHz, 10 Vpp) และ comparator แยก (LM393 ช้าแต่ใช้ได้ถึง ~100 kHz; TLV3501/LT1016 สำหรับเร็ว)

## Error amplifier

- ใช้สูตร Type II/III จาก การออกแบบตัวชดเชย

- ต้องเลือก op-amp ให้ GBW ≥ 10× ของ gain ที่ต้องการ ณ ความถี่ขั้วสูงสุด ไม่งั้นขั้วของ op-amp จะกินเฟส

- ตัวต้านทาน $R_1$ (บนของตัวแบ่ง) เป็นส่วนของตัวชดเชย; $R_{bottom}$ ไม่มีผลกับ AC (ขา inverting เป็น virtual ground) จึงตั้ง DC ได้อิสระ

|
ระดับ |
Op-amp แนะนำ |
หมายเหตุ |

|
ราคาถูก/สอน |
LM358, TL072 |
GBW 1–3 MHz, ใช้ได้ถึง $f_c$ ~ 5 kHz |

|
ทั่วไป ทนทาน |
OPA2171, TLV9062, MCP6022 |
rail-to-rail, GBW 3–10 MHz |

|
ความเร็วสูง |
OPA2350, AD8065 |
ลูปกระแสเร็ว |

## การวัดกระแส

|
วิธี |
ข้อดี |
ข้อควรระวัง |

|
Shunt + amp (INA240, INA181) |
แม่น ราคาถูก |
สูญเสีย $I^2R$, common-mode สูงต้องใช้ amp ที่ทน PWM |

|
DCR sensing ($R_sC_s = L/r_L$) |
ไม่มีการสูญเสียเพิ่ม |
DCR เปลี่ยนตามอุณหภูมิ ~0.39%/°C |

|
Hall/magnetic (ACS7xx, TMCS) |
มีฉนวน |
แบนด์วิดท์/offset |

|
Current transformer |
ใช้ใน off-line SMPS |
วัดได้เฉพาะ AC/พัลส์ ต้อง reset แกน |

สำหรับ PCMC ต้องมี leading-edge blanking (100–300 ns) หรือ RC กรองหนามจากการคืนตัวของไดโอด

## ชิปควบคุมคลาสสิกที่ยังไม่ตกยุค

- TL494 / KA7500 — voltage mode, มี error amp 2 ตัว (แรงดัน+กระแสจำกัด), dead-time ปรับได้, push-pull output ใช้สอนได้ดีมาก

- UC3842/3/4/5 (UC384x) — peak current mode, มี error amp + LEB ภายใน, ทนทาน ใช้แพร่หลายใน flyback/forward

- TL431 + optocoupler (PC817) — error amp แบบแยกฉนวนมาตรฐาน: ลูปมีสองเส้นทาง (fast lane ผ่านตัวต้านทาน LED) ต้องคิด CTR และขั้วของ opto (~5–20 kHz)

- ชิปรุ่นปัจจุบันดู การเลือกตัวควบคุม

## Checklist วงจรอนาล็อก

- Soft-start: ค่อยๆ ยก $V_{ref}$ (RC บน ref หรือ SS pin) ป้องกันกระแสพุ่งและ overshoot

- Anti-windup: clamp เอาต์พุต error amp (Zener/diode) ตอนจำกัดกระแส

- ต่อ $V_{ref}$ ด้วย 100 nF ใกล้ขา; กราวด์สัญญาณแยกจากกราวด์กำลังแล้วรวมจุดเดียว

- ตรวจด้วยการฉีดสัญญาณวัด Bode จริง — ดู เทคนิคเชิงช่าง

## คำถามที่พบบ่อย

ใช้ LM358 ทำ error amplifier ได้ไหม?
ได้สำหรับลูปช้า GBW ราว 1 MHz พอสำหรับครอสโอเวอร์ไม่กี่กิโลเฮิรตซ์ ถ้าต้องการลูปเร็วหรือ Type III ที่มีขั้วที่ความถี่สูง ควรใช้ออปแอมป์ GBW 3–10 MHz ขึ้นไป ไม่งั้นขั้วของออปแอมป์จะกินเฟสมาร์จิน

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**ใช้ LM358 ทำ error amplifier ได้ไหม?**
ได้สำหรับลูปช้า GBW ราว 1 MHz พอสำหรับครอสโอเวอร์ไม่กี่กิโลเฮิรตซ์ ถ้าต้องการลูปเร็วหรือ Type III ที่มีขั้วที่ความถี่สูง ควรใช้ออปแอมป์ GBW 3–10 MHz ขึ้นไป ไม่งั้นขั้วของออปแอมป์จะกินเฟสมาร์จิน
