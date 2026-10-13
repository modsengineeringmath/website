---
title: "บั๊กคอนเวอร์เตอร์ (Buck Converter): หลักการ สูตร ริปเปิล CCM/DCM การออกแบบ และฟังก์ชันถ่ายโอน"
url: https://modsengineeringmath.com/learn/power-electronics/buck-converter/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: th
updated: 2026-10-13
---

> บั๊กคอนเวอร์เตอร์ละเอียดถึงระดับปริญญาโท: หลักการทำงาน volt-second balance Vo = D·Vin ผลของ Rds(on) DCR และ Vf ริปเปิลกระแสตัวเหนี่ยวนำและแรงดันขาออกรวม ESR ขอบเขต CCM/DCM ความเค้นของสวิตช์ ไดโอด ตัวเก็บประจุ การสูญเสียการนำและการสวิตช์ ฟังก์ชันถ่ายโอน Gvd(s) ตัวอย่างออกแบบ 24 V → 12 V 1.2 A 50 kHz และซิมูเลชันวงจรออนไลน์

ฉบับ Markdown ของ https://modsengineeringmath.com/learn/power-electronics/buck-converter/ สำหรับผู้ช่วย AI และเครื่องมือค้นหา สูตรเขียนเป็น LaTeX ($…$ และ $$…$$) แล็บโต้ตอบและรูปมีเฉพาะในหน้าเว็บ

# บั๊กคอนเวอร์เตอร์ (Buck Converter): หลักการ สูตร ริปเปิล CCM/DCM การออกแบบ และฟังก์ชันถ่ายโอน

// บทที่ 13.1 · อิเล็กทรอนิกส์กำลัง · Buck Converter


วงจรลดแรงดัน: volt-second balance Vo = DVin ริปเปิลกระแสและแรงดัน ขอบ CCM/DCM ความเค้นของอุปกรณ์ การสูญเสีย Gvd(s) และตัวอย่างออกแบบ 24 V → 12 V

สรุปใน 30 วินาที

- $V_o = DV_{in}$ จาก volt-second balance บนตัวเหนี่ยวนำ

- $\Delta i_L = V_o(1-D)/(Lf_s)$ ออกแบบ L ที่ $V_{in,max}$ เสมอ

- ตัวเก็บประจุขาเข้ารับ RMS $I_o\sqrt{D(1-D)}$ หนักกว่าขาออก

- $G_{vd}$ มีขั้วคู่ LC → voltage mode ใช้ Type III

@@H2 operation|โครงสร้างและการทำงาน@@
ประกอบด้วยสวิตช์ $Q$ ไดโอด $D$ (หรือสวิตช์ตัวล่างในแบบ synchronous) ตัวเหนี่ยวนำ $L$ และตัวเก็บประจุ $C$ สวิตช์ทำงานด้วยคาบ $T_s = 1/f_s$ และ duty ratio $D$

- ช่วง ON ($0 \le t \le DT_s$): $v_L = V_{in} - V_o$ กระแส $i_L$ เพิ่มขึ้นเชิงเส้น

- ช่วง OFF ($DT_s \le t \le T_s$): ไดโอดนำ $v_L = -V_o$ กระแสลดลง

## อัตราส่วนแปลงผัน (Volt-second balance)

B1 Volt-second balance (buck) อัตราส่วนแปลงผัน

$$(V_{in}-V_o)\,DT_s + (-V_o)(1-D)T_s = 0 \;\Rightarrow\; \boxed{V_o = D\,V_{in}}$$

รวมผลของ $R_{ds(on)}$, DCR ของขด $r_L$ และ $V_F$ ของไดโอด (ใช้ประเมินค่าจริง):

B2 Conversion ratio with parasitics อัตราส่วนเมื่อมีค่าแฝง

$$V_o \approx \frac{D V_{in} - (1-D)V_F}{1 + (r_L + D R_{ds(on)})/R}$$

## Ripple ของกระแสและแรงดัน

B3 Inductor & output ripple ริปเปิลกระแสและแรงดัน

$$\Delta i_L = \frac{(V_{in}-V_o)D}{L f_s} = \frac{V_o(1-D)}{L f_s},
\qquad
\Delta v_o \approx \underbrace{\frac{\Delta i_L}{8 C f_s}}_{\text{charge}} + \underbrace{\Delta i_L \cdot ESR}_{\text{ESR}}$$

ข้อสังเกตเชิงวิศวกรรม: $\Delta i_L$ สูงสุดที่ $D=0.5$ เมื่อ $V_o$ คงที่แต่ $V_{in}$ เปลี่ยน ripple จะสูงสุดที่ $V_{in,max}$ — ออกแบบ L ที่ $V_{in,max}$ เสมอ

@@H2 ccm-dcm|ขอบเขต CCM/DCM@@
นิยาม $K = 2L/(R T_s)$ วงจรอยู่ใน CCM เมื่อ $K > K_{crit}(D) = 1-D$ หรือเทียบเท่า $I_o > \Delta i_L/2$ ใน DCM:

B4 DCM conversion ratio อัตราส่วนใน DCM

$$M = \frac{V_o}{V_{in}} = \frac{2}{1+\sqrt{1+4K/D^2}}$$

DCM ทำให้แรงดันขาออกขึ้นกับโหลด, ฟังก์ชันถ่ายโอนลดเหลือขั้วเด่นเดียว — ตัวชดเชยที่ออกแบบสำหรับ CCM อาจช้าเกินไปใน DCM

## ความเค้นของอุปกรณ์ (Stress)

|
อุปกรณ์ |
แรงดันสูงสุด |
กระแสที่ต้องรองรับ |

|
สวิตช์ $Q$ |
$V_{in}$ (+ ringing) |
$I_{rms}=\sqrt{D}\sqrt{I_o^2+\Delta i_L^2/12}$ |

|
ไดโอด |
$V_{in}$ |
$I_{avg}=(1-D)I_o$ |

|
$C_{out}$ |
$V_o$ |
$I_{C,rms}=\Delta i_L/\sqrt{12}$ |

|
$C_{in}$ |
$V_{in}$ |
$I_{Cin,rms}\approx I_o\sqrt{D(1-D)}$ (สูงสุดที่ $D=0.5$) |

ตัวเก็บประจุ ขาเข้า ของ Buck รับ ripple หนักกว่าขาออก — สาเหตุเสียอันดับต้นๆ ในงานจริง

## การสูญเสียและประสิทธิภาพ

B5 Conduction & switching losses การสูญเสีย

$$P_{cond}=I_{Q,rms}^2R_{ds(on)} + V_F I_{D,avg} + I_{L,rms}^2 r_L,\quad
P_{sw}\approx \tfrac12 V_{in} I_o (t_r+t_f) f_s + Q_{rr}V_{in}f_s + Q_g V_{GS} f_s + \tfrac12 C_{oss}V_{in}^2 f_s$$

การเพิ่ม $f_s$ ลดขนาด L, C แต่เพิ่ม $P_{sw}$ — นี่คือ trade-off หลักของงานออกแบบ ใน synchronous buck แทนไดโอดด้วย MOSFET ตัวล่าง ลด $V_F I$ เหลือ $I^2R$ แต่ต้องมี dead-time ป้องกัน shoot-through

@@H2 transfer-function|แบบจำลองสัญญาณเล็ก@@
จาก state-space averaging (ดู บทแบบจำลอง):

B6 Control-to-output transfer function ฟังก์ชันถ่ายโอน Gvd

$$G_{vd}(s)=\frac{\hat v_o}{\hat d}= V_{in}\,\frac{1+s\,ESR\cdot C}{LC\,s^2 + \left(\frac{L}{R}+ESR\cdot C\right)s + 1},
\quad \omega_0=\frac{1}{\sqrt{LC}},\; Q = R\sqrt{C/L}$$

$G_{vd}$ มีขั้วคู่ที่ $f_0$ (เฟสตก 180°) และศูนย์ ESR ที่ $f_{esr}=1/(2\pi\, ESR\, C)$ → ใช้ Type III สำหรับ voltage mode หรือ Type II สำหรับ current mode — ดู การออกแบบตัวชดเชย

## ตัวอย่างออกแบบ: 24 V → 12 V, 1.2 A, 50 kHz

ตัวอย่าง B-1

### 24 V → 12 V, 1.2 A, 50 kHz

- $D = 12/24 = 0.5$

- เลือก $\Delta i_L = 30\%$ ของ $I_o = 0.36$ A → $L = \dfrac{(24-12)(0.5)}{(0.36)(50\text{k})} = 333\ \mu\text{H}$ → เลือก 330–390 µH, $I_{sat} \ge 1.5$ A

- $\Delta v_o = 1\% = 0.12$ V → $C \ge \dfrac{0.36}{8(50\text{k})(0.12)} = 7.5\ \mu\text{F}$ แต่ ESR ต้อง $\le 0.12/0.36 = 0.33\ \Omega$ → ใช้ 47 µF low-ESR + 1 µF เซรามิก

- $C_{in}$: $I_{rms}\approx 1.2\sqrt{0.25}=0.6$ A → อิเล็กโตรไลต์ ripple-rated ≥ 1 A + เซรามิก 1–4.7 µF ชิดสวิตช์

- MOSFET ≥ 40 V (margin 1.5×), ไดโอด Schottky ≥ 40 V 3 A

- เข็คขอบ DCM: $I_{o,min} = \Delta i_L/2 = 0.18$ A — ต่ำกว่านี้เข้า DCM

## ทดลองในซิมูเลเตอร์

- ตั้ง Open loop, D = 0.5 → สังเกต iL เป็นสามเหลี่ยม, Vout ≈ 12 V

- เพิ่ม R เป็น 100 Ω → เข้า DCM (iL แตะศูนย์, switch node ringing ไม่มีในซิมแต่มีในของจริง)

- เปลี่ยนเป็น Peak current mode + Step load → ดู transient

ต้องเปิด JavaScript เพื่อใช้แล็บ

## ประเด็นระดับปริญญาโท

- Multiphase/Interleaved buck สำหรับ CPU/VRM: ripple หักล้างกัน, $f_{ripple} = N f_s$

- Constant on-time (COT)/hysteretic control: ตอบสนองเร็ว ต้องการ ripple บน ESR หรือ ripple injection

- Adaptive voltage positioning (AVP) ใน VRM: ตั้ง output impedance เป็นค่าคงที่ $R_{LL}$

- Pre-bias startup, OCP แบบ hiccup, load-line — ดู เทคนิคเชิงช่าง

## คำถามที่พบบ่อย

ทำไมแรงดันขาออกของบั๊กเท่ากับ D คูณแรงดันขาเข้า?
ในสถานะคงตัวแรงดันเฉลี่ยบนตัวเหนี่ยวนำต้องเป็นศูนย์ ช่วงสวิตช์นำ L รับ Vin − Vo นาน DTs ช่วงไดโอดนำรับ −Vo นาน (1−D)Ts รวมกันเป็นศูนย์จะได้ Vo = D·Vin

ควรออกแบบริปเปิลกระแสตัวเหนี่ยวนำเท่าไร?
นิยมเลือก 20–40 % ของกระแสโหลด ค่าน้อยทำให้ L ใหญ่และตอบสนองช้า ค่ามากทำให้กระแสพีก ริปเปิลขาออก และการสูญเสียแกนสูง และต้องคำนวณที่แรงดันขาเข้าสูงสุด

มด

อาจารย์มด · ธีรวุฒิ แสวงบุญ
อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ · ดูโปรไฟล์

## คำถามที่พบบ่อย (FAQ)

**ทำไมแรงดันขาออกของบั๊กเท่ากับ D คูณแรงดันขาเข้า?**
ในสถานะคงตัวแรงดันเฉลี่ยบนตัวเหนี่ยวนำต้องเป็นศูนย์ ช่วงสวิตช์นำ L รับ Vin − Vo นาน DTs ช่วงไดโอดนำรับ −Vo นาน (1−D)Ts รวมกันเป็นศูนย์จะได้ Vo = D·Vin

**ควรออกแบบริปเปิลกระแสตัวเหนี่ยวนำเท่าไร?**
นิยมเลือก 20–40 % ของกระแสโหลด ค่าน้อยทำให้ L ใหญ่และตอบสนองช้า ค่ามากทำให้กระแสพีก ริปเปิลขาออก และการสูญเสียแกนสูง และต้องคำนวณที่แรงดันขาเข้าสูงสุด
