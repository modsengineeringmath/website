---
title: "ควบคุมคอนเวอร์เตอร์ DC-DC แบบดิจิทัล: ADC, DPWM, Limit Cycle, Tustin และโค้ด PI"
url: https://modsengineeringmath.com/learn/power-electronics/digital-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> ควบคุมคอนเวอร์เตอร์ DC-DC ด้วยไมโครคอนโทรลเลอร์: สุ่ม ADC ให้ตรงจังหวะ PWM ดีเลย์และเฟสที่เสีย ความละเอียด DPWM และ limit cycle high-resolution PWM แปลงตัวชดเชยด้วย Tustin เป็น 2P2Z/3P3Z โค้ด PI ภาษา C พร้อม anti-windup และขั้นตอน bring-up

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/digital-control/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# ควบคุมคอนเวอร์เตอร์ DC-DC แบบดิจิทัล: ADC, DPWM, Limit Cycle, Tustin และโค้ด PI

// บทที่ 13.8 · อิเล็กทรอนิกส์กำลัง · Digital Control


จังหวะสุ่มสัญญาณ ดีเลย์ ความละเอียด DPWM กับ limit cycle แปลงตัวชดเชยด้วย Tustin โค้ด PI พร้อม anti-windup การป้องกันในฮาร์ดแวร์ และขั้นตอน bring-up

สรุปใน 30 วินาที

- สุ่มกลางช่วง ON/OFF ได้ค่าเฉลี่ย iL โดยไม่ต้องกรอง

- ดีเลย์ $\approx 1.5T_s$ กินเฟส $360^\circ f_cT_d$

- ไม่เกิด limit cycle: DPWM ต้องละเอียดกว่า ADC

- OCP ต้องอยู่ในฮาร์ดแวร์ ไม่ผ่าน CPU

@@H2 structure|โครงสร้าง@@
ADC สุ่ม $v_o$ (และ $i_L$) → ตัวชดเชยดิจิทัล $G_c(z)$ → DPWM (ตัวนับ) → gate driver

สิ่งที่ต่างจากอนาล็อก: (1) delay จากการสุ่ม-คำนวณ-อัปเดต (2) quantization ทั้ง ADC และ PWM (3) aliasing

@@H2 sampling|จังหวะการสุ่ม@@
สุ่ม ตรงกลางช่วง ON หรือ OFF (ใช้ trigger จาก timer PWM) จะได้ค่าเฉลี่ยของ $i_L$ โดยไม่ต้องกรอง และหลบหนามจากการสวิตช์ — เป็นเทคนิคมาตรฐานของ C2000/STM32 HRTIM/dsPIC

Delay รวมโดยประมาณ $T_d \approx T_{conv} + T_{calc} + T_s/2$ (ZOH) → เฟสหาย $\phi = -360^\circ f_c T_d$ เช่น $f_s = 100$ kHz, $T_d = 1.5T_s$, $f_c = 5$ kHz → เสียเฟส 27°

@@H2 dpwm-limit-cycle|ความละเอียดและ limit cycle@@
ความละเอียดแรงดันขาออกจาก DPWM (buck): $\Delta V_o = V_{in}/2^{N_{PWM}}$ โดย $2^{N_{PWM}} = f_{clk}/f_s$
เงื่อนไขไม่เกิด limit cycle: $\Delta V_{o,DPWM} \lt \Delta V_{o,ADC}$ (PWM ละเอียดกว่า ADC) + ตัวควบคุมต้องมีอินทิเกรเตอร์ และ gain ของอินทิเกรเตอร์ไม่สูงเกิน

ตัวอย่าง: clock 170 MHz, $f_s = 200$ kHz → 850 count (≈9.7 บิต) → $24/850 = 28$ mV ขณะที่ ADC 12 บิตกับตัวแบ่ง 3.3/15 V → 3.7 mV ⇒ เกิด limit cycle! ต้องใช้ High-resolution PWM (HRTIM 184 ps ใน STM32G4, HRPWM ใน C2000 ~150 ps) หรือ dithering

@@H2 discretization|แปลงตัวชดเชยต่อเนื่อง → ดิจิทัล@@
Tustin (bilinear) พร้อม prewarp ที่ $f_c$:

Z1 Tustin (bilinear) transform การแปลงบิลิเนียร์

$$s \leftarrow \frac{2}{T}\frac{1-z^{-1}}{1+z^{-1}}$$

ได้รูปทั่วไป (2P2Z / 3P3Z):

Z2 2P2Z / 3P3Z difference equation สมการผลต่างของตัวชดเชย

$$u[n] = \sum_{k=0}^{3} b_k\, e[n-k] - \sum_{k=1}^{3} a_k u[n-k]$$

หรือออกแบบโดยตรงใน z-domain (direct digital design) เมื่อ $f_c$ ใกล้ $f_s/10$

@@H2 pi-code|โค้ด PI ภาษา C (จุดลอยตัว, เรียกใน ISR ของ ADC)@@
@@CODE0@@
ซิมูเลเตอร์ของเว็บนี้ใช้อัลกอริทึมเดียวกัน (โหมด Voltage-mode PI) — ลองเพิ่ม Ki จนแกว่ง แล้วสังเกตผลของ soft-start

@@H2 hardware-protection|การป้องกันที่ต้องทำในฮาร์ดแวร์ ไม่ใช่ซอฟต์แวร์@@
OCP แบบ cycle-by-cycle ต้องใช้ comparator ภายใน MCU ต่อเข้าตัว PWM โดยตรง (fault input / blanking window) ไม่ผ่าน CPU — ซอฟต์แวร์ค้าง/รีเซ็ตต้องไม่ทำให้สวิตช์ค้าง ON

@@H2 mcu|MCU ที่แนะนำ@@
ดูตารางเต็มที่ การเลือกตัวควบคุม — โดยสรุป: TI C2000 (F28003x/F28P55x/F28P65x), STM32G474 (HRTIM), Microchip dsPIC33CK/CH และ dsPIC33A เป็นสายที่ออกแบบมาเพื่อ power conversion โดยตรง; ESP32/Arduino เหมาะกับลูปช้า (MPPT, ชาร์จแบต, การสื่อสาร) แต่ไม่ควรใช้กับลูปกระแสเร็ว

## ขั้นตอน bring-up

- รันลูปเปิด: ตรวจ ADC scaling, ทิศทาง, offset

- ปิดลูปด้วย gain ต่ำ, $V_{in}$ ต่ำ ผ่านแหล่งจ่ายจำกัดกระแส

- วัด Bode โดยฉีดสัญญาณในซอฟต์แวร์ (เพิ่ม sine ที่ค่าอ้างอิงหรือ duty — เหมือนฟังก์ชันเจนฯ ในซิม) แล้วอ่านกลับผ่าน DAC/UART

- ทดสอบ step load, $V_{in}$ ต่ำ-สูง, อุณหภูมิ

## คำถามที่พบบ่อย

limit cycle ในคอนเวอร์เตอร์ดิจิทัลคืออะไร?
เมื่อ DPWM หยาบกว่า ADC แรงดันขาออกไม่มีระดับ duty ที่ตรงค่าอ้างอิงพอดี อินทิเกรเตอร์จึงกระโดดไปมาระหว่างสองระดับ เกิดการแกว่งความถี่ต่ำ แก้ด้วย high-resolution PWM หรือ dithering

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**limit cycle ในคอนเวอร์เตอร์ดิจิทัลคืออะไร?**
เมื่อ DPWM หยาบกว่า ADC แรงดันขาออกไม่มีระดับ duty ที่ตรงค่าอ้างอิงพอดี อินทิเกรเตอร์จึงกระโดดไปมาระหว่างสองระดับ เกิดการแกว่งความถี่ต่ำ แก้ด้วย high-resolution PWM หรือ dithering
