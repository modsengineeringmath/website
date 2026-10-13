---
title: "ออกแบบตัวชดเชย Type I II III ด้วยวิธี k-factor และ Peak Current Mode กับ Slope Compensation"
url: https://modsengineeringmath.com/learn/power-electronics/compensator-design/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> ออกแบบตัวชดเชย (compensator) ของคอนเวอร์เตอร์ DC-DC ด้วยออปแอมป์: เป้าหมายลูป phase margin gain margin ข้อจำกัดความถี่ครอสโอเวอร์ วิธี k-factor ของ Venable สูตรค่า R C ของ Type II และ Type III ตัวอย่างบั๊ก 24 V ได้ fc 5.4 kHz PM 62° ตรวจด้วย python-control และ peak current mode กับ slope compensation

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/compensator-design/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# ออกแบบตัวชดเชย Type I II III ด้วยวิธี k-factor และ Peak Current Mode กับ Slope Compensation

// บทที่ 13.6 · อิเล็กทรอนิกส์กำลัง · Compensator Design


เป้าหมายลูป เฟสมาร์จิน ขีดจำกัดความถี่ครอสโอเวอร์ สูตรค่า R C ของ Type II/III ด้วย k-factor ตัวอย่างบั๊กที่ตรวจด้วย python-control และ peak current mode

สรุปใน 30 วินาที

- $f_c \le f_s/10$ และ $\le f_{RHPZ}/5$, PM 45–70°

- Boost เฟส = PM − P − 90° แล้วเลือก Type ตามที่ต้องการ

- Type III: $k = \tan^2(\text{Boost}/4 + 45^\circ)$

- PCMC ที่ D มากกว่า 0.5 ต้อง slope comp $m_a \ge m_2/2$

## เป้าหมายของลูป

$T(s) = G_c(s)\,F_m\,G_{vd}(s)\,H$ ต้องให้

- ความถี่ตัดข้าม $f_c$: สูงพอให้ตอบสนองเร็ว แต่ต่ำกว่าขีดจำกัดทางกายภาพ

- Phase margin 45–70° (60° ≈ overshoot ต่ำ, ไม่ช้าเกิน), Gain margin ≥ 10 dB

- อินทิเกรเตอร์ที่ DC → ความผิดพลาดสถานะคงตัวเป็นศูนย์

|
ข้อจำกัดของ $f_c$ |
เหตุผล |

|
$f_c \le f_s/10$ (อนาล็อก), $\le f_s/20$ (ดิจิทัล) |
สมมติฐานการเฉลี่ย + delay ของการสุ่ม |

|
$f_c \le f_{RHPZ}/5$ |
boost / buck-boost (ประเมินที่ $V_{in,min}$, $I_{max}$) |

|
$f_c$ ต่ำกว่าเรโซแนนซ์ของ input filter |
เกณฑ์ Middlebrook |

## ชนิดตัวชดเชย (Op-amp, ป้อนจาก $R_1$ เข้าขา inverting)

|
ชนิด |
ฟังก์ชันถ่ายโอน |
ให้เฟสเพิ่ม |
ใช้กับ |

|
Type I |
$\dfrac{1}{sR_1C_1}$ |
0° |
ระบบขั้วเดียวช้าๆ |

|
Type II |
$\dfrac{1+sR_2C_1}{sR_1(C_1+C_2)\left(1+sR_2\frac{C_1C_2}{C_1+C_2}\right)}$ |
สูงสุด 90° |
Current mode, DCM, buck ที่ ESR zero ต่ำ |

|
Type III |
Type II × $\dfrac{1+s(R_1+R_3)C_3}{1+sR_3C_3}$ |
สูงสุด 180° |
Voltage mode CCM (ขั้วคู่ LC) |

## วิธี k-factor (Venable)

- เลือก $f_c$ และ PM; อ่านเฟสพืช $P$ (องศา, ติดลบ) และขนาด $|F_mG_{vd}H|$ ที่ $f_c$ → $G = 1/|F_mG_{vd}H|$

- เฟสที่ต้องเพิ่ม: $\text{Boost} = PM - P - 90^\circ$

- Type II: $k=\tan(\text{Boost}/2+45^\circ)$ แล้ว

C1 Type II component values (k-factor) ค่า R C ของ Type II

$$C_2=\frac{1}{2\pi f_c G R_1 k},\quad C_1=C_2(k^2-1),\quad R_2=\frac{k}{2\pi f_c C_1}$$

- Type III: $k=\tan^2(\text{Boost}/4+45^\circ)$ แล้ว

C2 Type III component values (k-factor) ค่า R C ของ Type III

$$C_2=\frac{1}{2\pi f_c G R_1},\; C_1=C_2(k-1),\; R_2=\frac{\sqrt k}{2\pi f_cC_1},\; R_3=\frac{R_1}{k-1},\; C_3=\frac{1}{2\pi f_c\sqrt k R_3}$$

ศูนย์คู่อยู่ที่ $f_c/\sqrt k$, ขั้วคู่ที่ $f_c\sqrt k$

## ตัวอย่าง: Buck voltage mode (ค่าเดียวกับซิมูเลเตอร์)

$V_{in}=24$ V, $L=C=100\ \mu$, ESR 20 mΩ, $R=10\ \Omega$, $f_s=50$ kHz, $V_M=1$ V, ตัวแบ่ง $H = 2.5/12 = 0.208$

- $f_0 = 1.59$ kHz, $Q = 10$, $f_{esr}=79.6$ kHz → เลือก $f_c = 5$ kHz

- $|G_{vd}(f_c)| \approx V_{in}(f_0/f_c)^2 = 2.43$ → $|F_mG_{vd}H| = 0.506$ → $G = 1.98$

- $P\approx -176^\circ$ → Boost $= 60+176-90=146^\circ$ → Type III, $k = \tan^2(81.5^\circ)=44.8$

- $R_1 = 10\text{ k}\Omega$: $C_2=1.6$ nF, $C_1=70$ nF, $R_2=3.0$ kΩ, $R_3=228\ \Omega$, $C_3=21$ nF

- ศูนย์ที่ 747 Hz (ต่ำกว่า $f_0$ — ดี), ขั้วที่ 33 kHz (ต่ำกว่า $f_s$)

Q สูง $Q=10$ แปลว่ายอดเรโซแนนซ์ +20 dB — ถ้าโหลดเบาลง Q สูงขึ้นอีก ตรวจ gain margin ที่โหลดน้อยสุดเสมอ และตรวจทุกมุมของ $V_{in}$, $I_o$, อุณหภูมิ, tolerance ของ L/C (±20–30%)

### สคริปต์ตรวจลูป

s=ct.tf('s'); Vin,L,C,R,ESR,H,VM=24,100e-6,100e-6,10,0.02,0.208,1
Gvd=Vin*(1+s*ESR*C)/(L*C*s**2+(L/R+ESR*C)*s+1)
R1,R2,R3,C1,C2,C3=10e3,3.0e3,228,70e-9,1.6e-9,21e-9
Gc=(1+s*R2*C1)*(1+s*(R1+R3)*C3)/(s*R1*(C1+C2)*(1+s*R2*C1*C2/(C1+C2))*(1+s*R3*C3))
T=Gc*Gvd*H/VM
gm,pm,wg,wc=ct.margin(T); print(f"fc={wc/2/np.pi:.0f} Hz PM={pm:.1f} deg GM={20*np.log10(gm):.1f} dB")

## Peak current mode (PCMC)

ลูปในวัดกระแสพีกของ L/สวิตช์ ลูปนอกสร้างค่าอ้างอิงกระแส $i_c$ ผลคือ L "หายไป" จากลูปนอก:

C3 PCMC control-to-output (buck) ฟังก์ชันถ่ายโอนโหมดกระแส

$$G_{vc}(s)\approx \frac{R}{R_i}\cdot\frac{1+s\,ESR\,C}{1+sRC}\cdot F_h(s)\quad(\text{buck})$$

โดย $R_i$ คือ gain ของการวัดกระแส (V/A), $F_h$ คือผลของการสุ่ม (ขั้วคู่ที่ $f_s/2$)

Slope compensation: เมื่อ $D>0.5$ การรบกวนกระแสจะขยายทุกคาบ (subharmonic oscillation) เงื่อนไขเสถียร:

C4 Slope compensation condition เงื่อนไขความชันชดเชย

$$m_a \ge \tfrac12 m_2,\qquad Q_{f_s/2}=\frac{1}{\pi\left(m_cD'-0.5\right)},\; m_c = 1+\frac{m_a}{m_1}$$

เลือก $m_a \approx 0.5$–$1\times m_2$ ให้ $Q \approx 1$ ($m_2$ = ความชันขาลงของกระแส; buck: $V_o/L$)

ตัวชดเชย Type II สำหรับ PCMC: วางศูนย์ที่ขั้วโหลด $1/(2\pi RC)$ (ที่โหลดเต็ม), ขั้วที่ $f_{esr}$ หรือ $f_s/2$ ตัวเลือกใด ต่ำกว่า, $f_c \approx f_s/10$

ทดลองในซิม: ตั้ง Boost, PCMC, slope k = 0 → สังเกตกระแสแกว่งที่ $f_s/2$ (คาบคู่-คาบคี่ไม่เท่ากัน) → เพิ่ม k = 0.5 แล้วหายไป

## ทางเลือกอื่นระดับปริญญาโท

Average current mode (PFC, charger), V² / COT, Sliding-mode, Model predictive control (MPC), Robust $H_\infty$ — จะเพิ่มในบทถัดไป

## คำถามที่พบบ่อย

เลือก Type II หรือ Type III อย่างไร?
ดูเฟสที่ต้องเพิ่ม ถ้าน้อยกว่า 90° ใช้ Type II ได้ ซึ่งมักเป็นกรณี current mode หรือ DCM ถ้าพืชมีขั้วคู่ LC ที่ทำให้เฟสตกเกือบ 180° อย่าง voltage mode ใน CCM ต้องใช้ Type III ที่ให้เฟสได้ถึง 180°

subharmonic oscillation คืออะไร?
ใน peak current mode เมื่อ duty เกิน 0.5 การรบกวนของกระแสตัวเหนี่ยวนำจะขยายขึ้นทุกคาบ เห็นเป็นกระแสคาบคู่คาบคี่ไม่เท่ากันที่ความถี่ fs/2 แก้ด้วยการเพิ่มความชันชดเชยอย่างน้อยครึ่งหนึ่งของความชันขาลงของกระแส

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**เลือก Type II หรือ Type III อย่างไร?**
ดูเฟสที่ต้องเพิ่ม ถ้าน้อยกว่า 90° ใช้ Type II ได้ ซึ่งมักเป็นกรณี current mode หรือ DCM ถ้าพืชมีขั้วคู่ LC ที่ทำให้เฟสตกเกือบ 180° อย่าง voltage mode ใน CCM ต้องใช้ Type III ที่ให้เฟสได้ถึง 180°

**subharmonic oscillation คืออะไร?**
ใน peak current mode เมื่อ duty เกิน 0.5 การรบกวนของกระแสตัวเหนี่ยวนำจะขยายขึ้นทุกคาบ เห็นเป็นกระแสคาบคู่คาบคี่ไม่เท่ากันที่ความถี่ fs/2 แก้ด้วยการเพิ่มความชันชดเชยอย่างน้อยครึ่งหนึ่งของความชันขาลงของกระแส
