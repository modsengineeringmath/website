---
title: "แหล่งจ่ายไฟสวิตชิ่ง (SMPS): Flyback Forward Bridge LLC PFC และมาตรฐานความปลอดภัย"
url: https://modsengineeringmath.com/learn/power-electronics/switching-power-supply/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> ภาพรวมแหล่งจ่ายไฟสวิตชิ่งที่ต่อไฟบ้าน: EMI filter PFC boost ตัวแปลงแยกฉนวน flyback forward push-pull half/full-bridge LLC พร้อมอัตราส่วนแปลงผัน ขั้นตอนออกแบบ flyback แรงดันสะท้อน RCD clamp และมาตรฐาน IEC 62368-1 CISPR 32 IEC 61000-3-2

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/switching-power-supply/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# แหล่งจ่ายไฟสวิตชิ่ง (SMPS): Flyback Forward Bridge LLC PFC และมาตรฐานความปลอดภัย

// บทที่ 15.19 · อิเล็กทรอนิกส์กำลัง · Switching Power Supply (SMPS)


โครงสร้างแหล่งจ่ายต่อไฟบ้าน EMI filter PFC ตระกูลวงจรแยกฉนวน ขั้นตอนออกแบบ flyback 7 ขั้น มาตรฐาน IEC 62368-1 และ CISPR 32

สรุปใน 30 วินาที

- Flyback = buck-boost + หม้อแปลง: $\frac{N_s}{N_p}\frac{D}{1-D}$

- Forward = buck + หม้อแปลง ต้อง reset แกน

- เกิน ~75 W ต้องมี PFC

- ทดลอง off-line ต้องมีหม้อแปลงแยกขดและ differential probe

## โครงสร้างแหล่งจ่ายต่อไฟบ้าน (off-line)

AC 220 V → ฟิวส์/MOV → EMI filter (CM choke, X/Y cap) → บริดจ์ → [PFC boost ~400 V] → bulk C
→ DC-DC แยกฉนวน (flyback / forward / LLC) → rectifier + filter → Vout
↑ ป้อนกลับผ่าน TL431 + optocoupler
PFC บังคับตามมาตรฐานฮาร์มอนิก (IEC 61000-3-2) เมื่อกำลังเกิน ~75 W

## ตระกูลวงจรแยกฉนวน

|
วงจร |
ได้มาจาก |
$V_o/V_{in}$ |
กำลังเหมาะสม |
ข้อสังเกต |

|
Flyback |
Buck-boost |
$\dfrac{N_s}{N_p}\dfrac{D}{1-D}$ |
≤ 100–150 W |
ชิ้นส่วนน้อย, หม้อแปลงเก็บพลังงาน (มี gap), leakage → ต้อง clamp/snubber |

|
Forward |
Buck |
$\dfrac{N_s}{N_p}D$ |
100–500 W |
ต้อง reset แกน, $D \le 0.5$ (ขด reset 1:1) |

|
Push-pull |
Buck ×2 |
$2\dfrac{N_s}{N_p}D$ |
แรงดันต่ำ กระแสสูง |
ระวัง flux walking |

|
Half/Full-bridge |
Buck |
$\dfrac{N_s}{N_p}D$ (HB: ×½) |
300 W – หลาย kW |
ใช้แกนเต็ม 2 ทิศ |

|
LLC resonant |
Bridge + tank |
ขึ้นกับ $f_s/f_r$ |
100 W – หลาย kW |
ZVS ฝั่งปฐม, ZCS ฝั่งทุติย, ประสิทธิภาพ 95%+ |

## ขั้นตอนออกแบบ Flyback (CCM/DCM)

- กำหนด $V_{in,min}$ (bulk ต่ำสุด), $V_o$, $P_o$, $f_s$, $D_{max}$ ≈ 0.45

- แรงดันสะท้อน $V_{OR} = \dfrac{N_p}{N_s}(V_o+V_F)$ เลือกให้ $V_{in,max}+V_{OR}+V_{spike} \lt$ 0.8 × $V_{DS,max}$

- อัตราส่วนรอบ $n = N_p/N_s$ จาก $D_{max} = \dfrac{V_{OR}}{V_{OR}+V_{in,min}}$

- $L_p$ จากโหมดที่ต้องการ (DCM: $L_p \le \dfrac{(V_{in,min}D_{max})^2}{2P_{in}f_s}$)

- เลือกแกน/ช่องอากาศ/จำนวนรอบ (เหมือน ออกแบบตัวเหนี่ยวนำ) + ฉนวนตามมาตรฐาน (creepage/clearance, ลวด triple-insulated)

- Clamp RCD: $V_{clamp} \approx 1.5V_{OR}$, $P = \tfrac12 L_{lk}I_{pk}^2f_s\dfrac{V_{clamp}}{V_{clamp}-V_{OR}}$

- ลูปป้อนกลับ: current mode (UC384x หรือ IC รุ่นใหม่) + TL431/opto — ระวัง RHP zero ใน CCM flyback

## ความปลอดภัยและมาตรฐาน

- IEC 62368-1 (ความปลอดภัยอุปกรณ์ ICT/AV), ฉนวนแบบ reinforced ระหว่างปฐม-ทุติย

- EMI: CISPR 32 (conducted 150 kHz–30 MHz, radiated)

- กระแสรั่วผ่าน Y-cap จำกัด (สำคัญกับเครื่องมือแพทย์)

- ทดลอง off-line ต้องใช้ isolation transformer + variac + differential probe — ดู แหล่งจ่ายทดสอบ

## หัวข้อที่จะเพิ่ม (ระดับ ป.โท)

PFC แบบ totem-pole (GaN/SiC), LLC: First Harmonic Approximation และการออกแบบ tank, Active clamp flyback, Phase-shift full-bridge, DAB สำหรับ EV/ESS, synchronous rectification ฝั่งทุติยภูมิ

## คำถามที่พบบ่อย

flyback เหมาะกับกำลังเท่าไร?
เหมาะประมาณไม่เกิน 100–150 W เพราะหม้อแปลงต้องเก็บพลังงานทั้งหมดในช่องอากาศและ leakage inductance สร้างแรงดันกระชากที่ต้องดูดซับ กำลังสูงกว่านี้นิยม forward, half/full-bridge หรือ LLC

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**flyback เหมาะกับกำลังเท่าไร?**
เหมาะประมาณไม่เกิน 100–150 W เพราะหม้อแปลงต้องเก็บพลังงานทั้งหมดในช่องอากาศและ leakage inductance สร้างแรงดันกระชากที่ต้องดูดซับ กำลังสูงกว่านี้นิยม forward, half/full-bridge หรือ LLC
