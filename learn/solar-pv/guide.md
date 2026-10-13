---
title: "ออกแบบระบบโซลาร์เซลล์ — คู่มือฉบับสมบูรณ์ (Solar PV System Design: complete guide, Thai)"
url: https://modsengineeringmath.com/learn/solar-pv/
markdown_url: https://modsengineeringmath.com/learn/solar-pv/guide.md
tools_url: https://modsengineeringmath.com/learn/solar-pv/design-lab/
author: "ธีรวุฒิ แสวงบุญ (อาจารย์มด, Teerawut Savangboon) — อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ"
site: "Mod's Engineering Mathematics"
language: th
audience: ["Homeowners and technicians", "Vocational students", "Undergraduate (electrical engineering)", "Graduate and researchers", "PV designers and installers in Thailand"]
license: "อ่าน ลิงก์ และอ้างอิงได้ฟรี โปรดระบุ Mod's Engineering Mathematics (อาจารย์มด) และลิงก์หน้าเว็บ"
published: 2026-10-13
updated: 2026-10-13
keywords: [โซลาร์เซลล์, โซล่าเซลล์, แผงโซลาร์, ระบบโซลาร์รูฟท็อป, solar rooftop Thailand, ออกแบบระบบโซลาร์, PV system design, on-grid, off-grid, hybrid inverter, ขนานไฟ กฟภ. กฟน., ออกแบบสตริง, string sizing, Voc, MPPT, อินเวอร์เตอร์, แบตเตอรี่ LiFePO4, Performance Ratio, ชั่วโมงแดดสูงสุด, peak sun hours, ระยะคืนทุน, LCOE, พยากรณ์กำลังผลิต, solar forecasting, โซลาร์จ่ายแอร์, โซลาร์ฟาร์ม, ปั๊มน้ำโซลาร์, agrivoltaics, IEC 62446]
---

# ออกแบบระบบโซลาร์เซลล์ — คู่มือฉบับสมบูรณ์

> ชุดบทเรียนภาษาไทย 20 หน้า (หน้าหลัก + 19 บท) และเครื่องคำนวณ 9 ตัว สำหรับออกแบบและใช้งานระบบผลิตไฟฟ้าจากแสงอาทิตย์ในประเทศไทย ตั้งแต่ฟิสิกส์ของเซลล์และเส้นโค้ง I-V การเลือกแผง แสงอาทิตย์ มุมเอียงและเงา ชนิดระบบและการขนานไฟ ออกแบบสตริง สายไฟและอุปกรณ์ป้องกัน แบตเตอรี่ คาดการณ์พลังงานและความคุ้มค่า การพยากรณ์ล่วงหน้าและเฝ้าติดตาม อิเล็กทรอนิกส์กำลัง (MPPT อินเวอร์เตอร์เชื่อมกริด การเลือกตัวควบคุม ชิป และ MCU) จนถึงงานประยุกต์: โซลาร์จ่ายแอร์ โซลาร์ฟาร์ม ปั๊มน้ำเพื่อการเกษตร และงานติดตั้ง ทดสอบ บำรุงรักษา

ไฟล์นี้เขียนไว้ให้ผู้ช่วย AI เครื่องมือค้นหา และนักพัฒนา อ่านโครงสร้าง สูตรหลัก และตัวเลขสำคัญของชุดนี้ได้ในไฟล์เดียว เนื้อหาเต็มรายหน้าอยู่ที่ `index.html.md` ท้าย URL ของแต่ละหน้า และใน [llms-full.txt](https://modsengineeringmath.com/llms-full.txt)

---

## 1. สรุปในหนึ่งนาที

- พลังงานต่อปี \(E = P_{STC} \times H_{POA} \times PR\) ในประเทศไทย 1 kWp ผลิตได้ประมาณ 1,300–1,450 kWh/ปี (3.6–4.0 kWh/วัน) PSH เฉลี่ยประเทศ ≈ 5 ชั่วโมง (18.2 MJ/m²/วัน = 5.06 kWh/m²/วัน)
- PR ของระบบหลังคาในไทย 0.75–0.82 การสูญเสียใหญ่สุดคืออุณหภูมิ 8–12 % (เซลล์ทำงาน 50–70 °C)
- สตริง: \(N_s V_{oc}(T_{min}) \le V_{dc,max}\) และ \(N_s V_{mp}(T_{c,max}) \ge V_{MPPT,min}\) กระแส \(N_p I_{mp} \le I_{MPPT,max}\) และ \(1.25 N_p I_{sc} \le I_{sc,max}\) DC/AC 1.1–1.3
- On-grid คุ้มที่สุดเมื่อขนาดพอดีโหลดกลางวัน (หน่วยที่ใช้เองมีค่าเกือบสองเท่าของหน่วยที่ขายภายใต้ net billing) แบตเตอรี่คุ้มเมื่อมีโหลดกลางคืน ไฟดับบ่อย TOU หรือ peak shaving
- เงาบังบางส่วนทำให้ P-V มีหลายยอด MPPT แบบไต่เขาอาจติดยอดผิด ต้องมี global scan หรือ MPPT ระดับแผง
- ฝั่ง DC อันตราย: สาย PV1-F/H1Z2Z2-K ขั้วต่อยี่ห้อเดียวกัน สวิตช์ DC-PV2 ฟิวส์ gPV เมื่อขนาน ≥ 3 สตริง SPD ทั้ง DC และ AC
- ระบบบ้าน 5 kWp ตัวอย่าง: คืนทุน ≈ 6 ปี IRR ≈ 16 % LCOE ≈ 2 บาท/kWh

## 2. โครงสร้างชุดบทเรียน

หน้าหลัก: https://modsengineeringmath.com/learn/solar-pv/ — ขั้นตอนออกแบบ 10 ขั้น สมการหลัก เส้นทางตามเป้าหมาย การ์ดทุกบท แล็บ I-V ดัชนีสูตรที่ค้นหาได้ มาตรฐานอ้างอิง

| บท | หน้า | URL | รหัสสูตร | เนื้อหาหลัก |
|---|---|---|---|---|
| 14.1 | เซลล์และเส้นโค้ง I-V | /learn/solar-pv/pv-cell/ | P1–P8 | โฟตอนและ bandgap แบบจำลองไดโอดเดี่ยว Isc Voc MPP FF ประสิทธิภาพ แสงและอุณหภูมิ NOCT อนุกรม/ขนาน บายพาสไดโอด hot spot แล็บ I-V |
| 14.2 | แสงอาทิตย์ มุมเอียง เงา | /learn/solar-pv/solar-resource/ | R1–R7 | GHI DNI DHI POA PSH ข้อมูลของไทย ตำแหน่งดวงอาทิตย์ เวลาสุริยะ มุมเอียงและทิศ ระยะห่างแถวกันเงา |
| 14.3 | เลือกแผง | /learn/solar-pv/panel-selection/ | M1–M3 | PERC TOPCon HJT BC พื้นที่ต่อ kWp อ่านดาต้าชีต การเสื่อมและประกัน bifacial IEC 61215 61730 61701 62716 เช็กลิสต์ |
| 14.4 | ชนิดระบบและการขนานไฟ | /learn/solar-pv/system-types/ | S1–S4 | on-grid off-grid hybrid DC ตรง micro/optimizer zero export สมดุลพลังงาน SCR SSR net billing DC/AC-coupling anti-islanding ขั้นตอน กฟภ. กฟน. กกพ. |
| 14.5 | ออกแบบสตริง | /learn/solar-pv/string-sizing/ | D1–D8 | Voc ตอนหนาว Vmp ตอนร้อน ช่วง MPPT สตริงขนานต่อ MPPT DC/AC clipping full-load MPPT ตัวอย่าง 5 kW 10 kW 100 kW |
| 14.6 | สายไฟและการป้องกัน | /learn/solar-pv/wiring-protection/ | W1–W6 | SLD สาย PV ขั้วต่อ MC4 แรงดันตก ฟิวส์สตริง gPV DC isolator SPD กราวด์ เบรกเกอร์ AC RCD AFCI rapid shutdown |
| 14.7 | แบตเตอรี่ | /learn/solar-pv/battery-storage/ | B1–B6 | เคมี LFP NMC ตะกั่วกรด โซเดียมไอออน ขนาด kWh Ah C-rate off-grid BMS 48 V vs HV การตั้งค่าชาร์จ LCOS ความปลอดภัย |
| 14.8 | คาดการณ์พลังงาน | /learn/solar-pv/energy-yield/ | E1–E7 | Yf Yr PR (IEC 61724) ห่วงโซ่การสูญเสีย อุณหภูมิ รายเดือน การเสื่อม capacity factor P50/P90 โค้ดรายชั่วโมง PVGIS SAM PVsyst pvlib |
| 14.9 | ขนาดจากบิลค่าไฟ | /learn/solar-pv/load-sizing/ | L1–L3 | อ่านบิล อัตราก้าวหน้าและ TOU โปรไฟล์โหลด สำรวจเครื่องใช้ไฟฟ้า กรณีบ้านและโรงงาน zero export วันหยุด EV |
| 14.10 | ความคุ้มค่า | /learn/solar-pv/economics/ | F1–F8 | กระแสเงินสด คืนทุน NPV IRR LCOE คิดลด ความไว สินเชื่อ PPA ข้อผิดพลาดที่ทำให้ตัวเลขสวยเกินจริง |
| 14.11 | พยากรณ์และเฝ้าติดตาม | /learn/solar-pv/forecasting-monitoring/ | A1–A7 | ระยะพยากรณ์ clear-sky index Haurwitz persistence NWP ดาวเทียม ML quantile MAE RMSE skill score monitoring PI ค่าเบี่ยงเบนสตริง |
| 14.12 | MPPT | /learn/solar-pv/mppt/ | T1–T8 | R_mpp คอนเวอร์เตอร์เปลี่ยนความต้านทาน PWM vs MPPT dP/dV P&O InC ขนาดก้าว คาบ EN 50530 global MPPT โค้ด C ซิมูเลเตอร์ |
| 14.13 | อินเวอร์เตอร์ | /learn/solar-pv/pv-inverter/ | V1–V7 | boost + H-bridge H5/HERIC DC-link ตัวเก็บประจุ 100 Hz SPWM ฟิลเตอร์ LCL PLL PR dq Volt-VAR anti-islanding ride-through มาตรฐาน |
| 14.14 | เลือกตัวควบคุม ชิป MCU | /learn/solar-pv/controller-selection/ | C1–C2 | PWM vs MPPT ชาร์จคอนโทรลเลอร์ เกณฑ์อินเวอร์เตอร์ ชิป MPPT gate driver เซนเซอร์กระแส MCU (C2000 STM32G4 dsPIC33 ESP32) สถาปัตยกรรม ไม่ตกยุค |
| 14.15 | โซลาร์จ่ายแอร์ | /learn/solar-pv/solar-air-conditioner/ | H1–H6 | BTU→kW COP EER SEER ขนาดห้อง กำลังเฉลี่ย ขนาดแผง กระแสกระชาก วิธีต่อ แอร์ DC/AC ไฮบริด ตัวอย่างบ้าน/สำนักงาน/กลางคืน |
| 14.16 | โซลาร์ฟาร์ม | /learn/solar-pv/solar-farm/ | G1–G5 | พัฒนาโครงการ ไร่ต่อ MW GCR fixed vs tracker string vs central MV 22/33 kV SCADA availability ลอยน้ำ O&M |
| 14.17 | ปั๊มน้ำและเกษตร | /learn/solar-pv/solar-agriculture/ | K1–K7 | ET₀ Kc TDH Hazen-Williams ρgQH/367 wire-to-water ขนาดแผง ชนิดปั๊ม solar VFD บ่อปลา โรงเรือน agrivoltaics LER สมาร์ตฟาร์ม |
| 14.18 | ติดตั้งและบำรุงรักษา | /learn/solar-pv/installation-maintenance/ | I1–I3 | ความปลอดภัย ขั้นตอนติดตั้ง IEC 62446-1 ตีความ Voc/Isc รูปร่าง I-V เอกสารส่งมอบ ตารางบำรุงรักษา รอบล้างแผง ตารางอาการเสีย 20 แบบ |
| 14.19 | เครื่องมือออกแบบ | /learn/solar-pv/design-lab/ | — | เครื่องคำนวณ 9 ตัวตามลำดับออกแบบ ใบงาน 7 ชุดพร้อมแนวคำตอบ ขอบเขตและข้อจำกัด |

## 3. ขั้นตอนออกแบบ 10 ขั้น

1. ข้อมูลการใช้ไฟ (บิล 12 เดือน โหลดกลางวัน/กลางคืน) → [ขนาดจากบิล](https://modsengineeringmath.com/learn/solar-pv/load-sizing/)
2. ชนิดระบบ → [ชนิดระบบ](https://modsengineeringmath.com/learn/solar-pv/system-types/)
3. พื้นที่ ทิศ มุมเอียง เงา โครงสร้าง → [แสงอาทิตย์](https://modsengineeringmath.com/learn/solar-pv/solar-resource/)
4. แผง → [เลือกแผง](https://modsengineeringmath.com/learn/solar-pv/panel-selection/)
5. อินเวอร์เตอร์และสตริง → [ออกแบบสตริง](https://modsengineeringmath.com/learn/solar-pv/string-sizing/)
6. แบตเตอรี่ (ถ้ามี) → [แบตเตอรี่](https://modsengineeringmath.com/learn/solar-pv/battery-storage/)
7. สายไฟ อุปกรณ์ป้องกัน กราวด์ จุดต่อ → [สายไฟ · ป้องกัน](https://modsengineeringmath.com/learn/solar-pv/wiring-protection/)
8. คาดการณ์พลังงาน → [คาดการณ์พลังงาน](https://modsengineeringmath.com/learn/solar-pv/energy-yield/)
9. ความคุ้มค่า → [ความคุ้มค่า](https://modsengineeringmath.com/learn/solar-pv/economics/)
10. ขออนุญาต ติดตั้ง ทดสอบ เฝ้าติดตาม บำรุงรักษา → [ติดตั้ง · O&M](https://modsengineeringmath.com/learn/solar-pv/installation-maintenance/)

## 4. สูตรหลักพร้อมรหัส

- **P2** แบบจำลองไดโอดเดี่ยว: \(I = I_{ph} - I_0[\exp((V+IR_s)/(nN_sV_T)) - 1] - (V+IR_s)/R_{sh}\)
- **P3** \(FF = V_{mp}I_{mp}/(V_{oc}I_{sc})\) · **P4** \(\eta = P_{mp}/(GA)\)
- **P6** \(P(T_c) = P_{STC}[1+\gamma(T_c-25)]\) · **P7** \(T_c \approx T_a + (NOCT-20)G/800\)
- **R3** \(PSH = H/(1\ \text{kW/m}^2)\), 1 kWh = 3.6 MJ · **R7** ระยะเงา \(d_{NS} = h\cos\gamma_s/\tan\alpha\)
- **M2** \(P_y/P_0 = 1 - d_1 - d(y-1)\) · **M3** \(P \approx P_{front}(1+\varphi G_{rear}/G_{front})\)
- **S2** \(SCR = E_{self}/E_{PV}\), \(SSR = E_{self}/E_{load}\) · **S3** saving \(= E_{self}c_{buy} + E_{export}c_{sell}\)
- **D1** \(V_{oc,max} = V_{oc}[1+\beta(T_{min}-25)]\) · **D2** \(N_{s,max} = \lfloor V_{dc,max}/V_{oc,max}\rfloor\) · **D3** \(\beta_{V_{mp}} \approx \gamma-\alpha\) · **D4** \(N_{s,min} = \lceil V_{MPPT,min}/V_{mp,min}\rceil\) · **D6** \(N_p \le \lfloor I_{MPPT,max}/I_{mp}\rfloor\), \(1.25N_pI_{sc}\le I_{sc,max}\) · **D7** DC/AC ratio
- **W1** \(\Delta V_{DC} = 2LI\rho_T/A\) · **W2** \(\rho_T = 0.01724[1+0.00393(T-20)]\) · **W5** ฟิวส์เมื่อ \((N_p-1)1.25I_{sc} > I_{MOD,OCPR}\), \(1.5I_{sc} < I_n \le \min(2.4I_{sc}, I_{MOD,OCPR})\)
- **B1** \(C_{nom} = E\,N_{auto}/(DoD\,\eta)\) · **B3** \(I_{bat} = P/(V\eta_{inv})\) · **B4** \(P_{PV,off} = E/(PSH\times 0.65)\) · **B5** LCOS
- **E1** \(E = P_{STC}H_{POA}PR\) · **E2** \(PR = Y_f/Y_r\) · **E3** \(PR = \prod(1-L_i)\) · **E4** \(L_T = |\gamma|(\bar T_c-25)\) · **E7** \(P_{90} = P_{50}(1-1.282\sigma)\)
- **F4** NPV · **F5** LCOE · **F6** IRR · **F8** ค่างวด \(A = Pi(1+i)^n/((1+i)^n-1)\)
- **A1** \(k^* = G/G_{cs}\) · **A2** Haurwitz \(GHI_{cs} = 1098\cos\theta_z e^{-0.057/\cos\theta_z}\) · **A5** \(SS = 1 - RMSE/RMSE_{pers}\) · **A6** \(PI = P_{meas}/P_{exp}\)
- **T2** buck \(R_{in} = R_L/D^2\), boost \(R_{in} = R_L(1-D)^2\) · **T3** \(dI/dV = -I/V\) ที่ MPP · **T4** P&O · **T7** \(\eta_{MPPT}\) EN 50530
- **V1** \(V_{dc} > \sqrt2V_{g,max}\) (1φ) · **V2** \(C_{dc} = P/(\omega V_{dc}\Delta V_{pp})\) · **V3** unipolar \(\Delta I_{max} = V_{dc}/(8Lf_{sw})\) · **V4** \(f_{res}\) ของ LCL · **V5** PR controller · **V6** \(P = \tfrac32 v_di_d\)
- **H1** 12,000 BTU/h = 3.52 kW · **H3** \(\bar P_{el} = \text{BTU}\times LF/SEER\) · **H5** ขนาดแผงสำหรับแอร์
- **G1** ที่ดิน ≈ 5 ไร่/MWp (fixed, GCR 0.7) · **G3** \(I_{MV} = S/(\sqrt3V_{LL})\)
- **K1** \(ET_c = K_cET_0\), 1 mm/ไร่ = 1.6 m³ · **K2** TDH · **K3** Hazen-Williams · **K4** \(P_{hyd}[\text{kW}] = Q[\text{m}^3/\text{h}]H/367\) · **K7** LER
- **I1** ค่าคาดหมาย \(V_{oc}\), \(I_{sc}\) ขณะทดสอบ · **I3** รอบล้างแผง \(n^* = \sqrt{2C/(sEc)}\)

## 5. ตัวเลขอ้างอิงที่ใช้ในชุดนี้

- แผงตัวอย่าง: TOPCon 144 half-cut 580 Wp, Voc 52.2 V, Vmp 43.4 V, Isc 14.10 A, Imp 13.37 A, β −0.25, γ −0.29, α +0.045 %/°C, NOCT 43 °C, 2.583 m², η 22.5 %
- GHI ประมาณ (kWh/m²/วัน): ประเทศ 5.0 · กรุงเทพฯ 4.8 · เชียงใหม่ 5.0 · ลพบุรี/สระบุรี 5.2 · ขอนแก่น 5.1 · อุบลฯ 5.2 · ชลบุรี 4.9 · สงขลา 4.7 · ภูเก็ต 4.6 (ค่าประมาณระยะยาวเพื่อการเรียน)
- รูปแบบรายเดือนภาคกลาง (สัมพัทธ์): ม.ค. 0.97 ก.พ. 1.06 มี.ค. 1.13 เม.ย. 1.16 พ.ค. 1.06 มิ.ย. 0.98 ก.ค. 0.95 ส.ค. 0.93 ก.ย. 0.92 ต.ค. 0.94 พ.ย. 0.96 ธ.ค. 0.94
- ตัวอย่างระบบ 5.8 kWp กรุงเทพฯ ทิศใต้ 15°: PR ≈ 0.79, ≈ 1,437 kWh/kWp, ≈ 8,340 kWh/ปี
- ตัวอย่างความคุ้มค่า 5 kWp, 30,000 บาท/kWp, ใช้เอง 80 %, ค่าไฟ 4.2, ขายไฟ 2.2: คืนทุน 6.1 ปี, IRR 16.2 %, NPV(5 %) ≈ 210,800 บาท, LCOE 2.00 บาท/kWh
- กรุงเทพฯ (13.75° N): 21 ธ.ค. เที่ยงมุมเงย 52.8° · 21 มิ.ย. 80.3° ทางทิศเหนือ · เที่ยงสุริยะ ≈ 12:18 น.

## 6. เครื่องคำนวณ (หน้า design-lab และฝังในบทที่เกี่ยวข้อง)

แล็บ I-V/P-V (แสง อุณหภูมิ เงา 3 สตริงย่อย บายพาสไดโอด เทียบ global MPP กับจุดที่ P&O ติด) · ขนาดจากบิล · ออกแบบสตริง (ตรวจ ✓/✗) · คาดการณ์พลังงานรายเดือนและ PR · แบตเตอรี่ · แอร์ · ปั๊มน้ำโซลาร์ · แรงดันตก · คืนทุน NPV IRR LCOE พร้อมกราฟเงินสดสะสม — ทั้งหมดคำนวณในเบราว์เซอร์ ไม่ส่งข้อมูลออก ซิมูเลเตอร์ระดับการสวิตช์ของ MPPT: https://modsengineeringmath.com/learn/power-electronics/converter-lab/#preset=solar-mppt

## 7. มาตรฐานที่อ้างถึง

IEC 61215, IEC 61730, IEC 61701, IEC 62716, IEC TS 62804, IEC 61853 (แผง) · IEC 60364-7-712, IEC 62548 (ติดตั้ง) · EN 50618/IEC 62930 (สาย), IEC 62852 (ขั้วต่อ), IEC 60269-6 (ฟิวส์ gPV), IEC 60947-3 DC-PV2, IEC 61643-31 (SPD), IEC 62305 (ฟ้าผ่า) · IEC 62109, IEC 62116, IEC 61727, IEEE 1547-2018, EN 50530 (อินเวอร์เตอร์/MPPT) · IEC 62619, UL 9540A (แบตเตอรี่) · IEC 61724 (สมรรถนะ), IEC 62446-1/-3 (ทดสอบ ภาพความร้อน) · ระเบียบการเชื่อมต่อของ กฟภ./กฟน. มาตรฐานการติดตั้งทางไฟฟ้า วสท. มยผ. 1311 (แรงลม)

## 8. คำถามที่พบบ่อย

**ติดโซลาร์บ้านควรเริ่มคำนวณจากอะไร?** จากบิล 12 เดือนและสัดส่วนการใช้ไฟช่วงกลางวัน ขนาด on-grid ที่คุ้มที่สุดคือพอดีโหลดกลางวัน (L2)

**แอร์ 12,000 BTU ใช้แผงกี่แผง?** แอร์อินเวอร์เตอร์เบอร์ 5 ใช้ไฟเฉลี่ย ≈ 0.4–0.6 kW แผง ≈ 1–1.5 kWp (2–3 แผง 580 W) ผ่าน on-grid สำหรับการใช้งานกลางวัน (H5)

**ต่อแผงอนุกรมได้กี่แผง?** \(\lfloor V_{dc,max}/V_{oc}(T_{min})\rfloor\) เช่น 600 V กับแผง Voc 52.2 V ที่ 10 °C ได้ 11 แผง (D2)

**PR ที่ดีเป็นเท่าไร?** หลังคาไทย 0.75–0.82 ฟาร์ม 0.80–0.85 ต่ำกว่า 0.7 ให้ตรวจหาปัญหา

**อ้างอิง:** Mod's Engineering Mathematics (อาจารย์มด), "ออกแบบระบบโซลาร์เซลล์", https://modsengineeringmath.com/learn/solar-pv/
