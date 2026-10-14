---
title: "เซนเซอร์และทรานส์ดิวเซอร์ — คู่มือเครื่องมือวัดคุมอุตสาหกรรมฉบับสมบูรณ์ (Sensors, Transducers & Industrial Instrumentation: complete guide, Thai)"
url: https://modsengineeringmath.com/learn/sensors-transducers/
markdown_url: https://modsengineeringmath.com/learn/sensors-transducers/guide.md
tools_url: https://modsengineeringmath.com/learn/sensors-transducers/instrumentation-lab/
author: "ธีรวุฒิ แสวงบุญ (อาจารย์มด, Teerawut Savangboon) — อาจารย์สาขาวิชาวิศวกรรมไฟฟ้า มหาวิทยาลัยราชภัฏธนบุรี สมุทรปราการ"
site: "Mod's Engineering Mathematics"
language: th
audience: ["Vocational students (ปวส.) and instrument technicians", "Undergraduate (electrical, control and instrumentation engineering)", "Process, automation and maintenance engineers in Thailand"]
license: "อ่าน ลิงก์ และอ้างอิงได้ฟรี โปรดระบุ Mod's Engineering Mathematics (อาจารย์มด) และลิงก์หน้าเว็บ"
published: 2026-10-14
updated: 2026-10-14
keywords: [เซนเซอร์, เซ็นเซอร์, ทรานส์ดิวเซอร์, ทรานสดิวเซอร์, ทรานสมิตเตอร์, เครื่องมือวัดและควบคุม, วัดคุม, instrumentation, sensor, transducer, transmitter, Pt100, RTD, เทอร์โมคัปเปิล, thermocouple type K, cold junction compensation, ความดันเกจ, DP transmitter, อัตราการไหล, orifice ISO 5167, magmeter, Coriolis, วัดระดับ, wet leg, radar level FMCW, strain gauge, load cell, current transformer, Hall sensor, Rogowski, ADC ENOB, 4-20 mA, NAMUR NE 43, HART, Modbus RTU, Modbus TCP, CRC-16, RS-485, PROFIBUS, FOUNDATION Fieldbus, IO-Link, Ethernet-APL, OPC UA, MQTT, IIoT, P&ID, ISA-5.1, calibration, IP rating, ATEX, IECEx, SIL, IEC 61511]
---

# เซนเซอร์และทรานส์ดิวเซอร์ — คู่มือเครื่องมือวัดคุมอุตสาหกรรมฉบับสมบูรณ์

> ชุดบทเรียนภาษาไทย 21 หน้า (หน้าหลัก + 20 บท) เครื่องคำนวณกว่า 25 ตัว ซิมูเลเตอร์ลูป 4–20 mA โมเด็ม HART เครื่องสร้างเฟรม Modbus และแล็บวัดคุมเสมือนแบบเรียลไทม์ ครอบคลุมตั้งแต่นิยามตาม VIM หน่วย SI มาตรวิทยา มาตรฐานพร้อมประเทศต้นแบบ การวัดอุณหภูมิ ความดัน อัตราการไหล ระดับ แรง ตำแหน่ง กระแส แรงดัน ภาคปรับสภาพสัญญาณและ ADC สัญญาณมาตรฐาน 4–20 mA HART Modbus ฟิลด์บัส Industrial Ethernet IIoT ไปจนถึงงานจริงในโรงงาน: P&ID การติดตั้ง Ex SIL และการสอบเทียบ

ไฟล์นี้เขียนไว้ให้ผู้ช่วย AI เครื่องมือค้นหา และนักพัฒนา อ่านโครงสร้าง สูตรหลัก และตัวเลขสำคัญของชุดนี้ได้ในไฟล์เดียว เนื้อหาเต็มรายหน้าอยู่ที่ `index.html.md` ท้าย URL ของแต่ละหน้า และใน [llms-full.txt](https://modsengineeringmath.com/llms-full.txt)

---

## 1. สรุปในหนึ่งนาที

- **นิยาม (VIM, JCGM 200):** sensor (3.8) คือส่วนที่ได้รับผลโดยตรงจากปริมาณที่วัด · measuring transducer (3.7) ให้เอาต์พุตที่สัมพันธ์กับอินพุตตามที่กำหนด · transmitter คือทรานส์ดิวเซอร์ที่ส่งสัญญาณมาตรฐาน (4–20 mA, HART, ฟิลด์บัส)
- **Pt100 (IEC 60751):** \(R(t) = R_0(1 + At + Bt^2)\) สำหรับ t ≥ 0 °C, A = 3.9083×10⁻³, B = −5.775×10⁻⁷ · R(100 °C) = 138.5055 Ω · 150 °C = 157.325 Ω · ต่อ 2 สายแล้วสายรวม 3.5 Ω อ่านสูงไป ≈ 9.4 °C
- **เทอร์โมคัปเปิล:** วัดผลต่างอุณหภูมิ ต้องชดเชยจุดเย็นในโดเมนแรงดัน \(E(T_h) = E_\text{วัด} + E(T_{cj})\) · ชนิด K วัด 18.516 mV ขั้วต่อ 30 °C → 478.3 °C (ลืมชดเชยได้ 450.0 °C)
- **ความดัน:** \(P_\text{abs} = P_g + P_\text{atm}\) · turndown = URL/span · ความคลาดจากอุณหภูมิและเสถียรภาพมักเป็น % URL จึงไม่ควรเลือกรุ่นช่วงใหญ่เกินงาน
- **อัตราการไหล:** DP (ออริฟิซ ISO 5167) \(q_m \propto \sqrt{\Delta P}\) rangeability ≈ 3–5:1 · magmeter \(U = kBDv\) ต้องเป็นของเหลวนำไฟฟ้า · คอริโอลิสวัดมวลและความหนาแน่นโดยตรง
- **ระดับ:** \(h = P/(\rho g)\) · ถังปิดขาเปียก LRV ติดลบ (zero elevation) · เรดาร์ FMCW \(R = c f_b T/(2B)\) · ระดับ 50 % ≠ ปริมาตร 50 % ในถังนอน
- **4–20 mA:** live zero, ลูปสองสาย · งบลูป \(V_s \ge V_\text{min} + I_\text{max}R_\text{loop}\) ใช้ I_max ≈ 22 mA · NAMUR NE 43: วัด 3.8–20.5 mA, ผิดพลาด ≤ 3.6 หรือ ≥ 21 mA
- **HART:** Bell 202 FSK ±0.5 mA, 1200 Hz = 1, 2200 Hz = 0, 1200 bit/s, ต้องมี R ลูป 230–1100 Ω
- **Modbus RTU:** `01 03 00 00 00 02 C4 0B` อ่าน 2 holding register จากสเลฟ 1 · CRC-16 poly 0xA001 init 0xFFFF ส่งไบต์ต่ำก่อน · float32 ใช้สองรีจิสเตอร์ ลำดับ ABCD/CDAB
- **ฟิลด์บัส:** PROFIBUS (เยอรมนี) DP บน RS-485 ถึง 12 Mbit/s, PA บน MBP 31.25 kbit/s · FOUNDATION Fieldbus H1 (สหรัฐฯ) 31.25 kbit/s · IO-Link IEC 61131-9 · Ethernet-APL บน IEEE 802.3cg 10BASE-T1L
- **งานจริง:** แท็ก ISA-5.1 (LIC-101 = Level Indicating Controller) · IP ตาม IEC 60529 · Ex Zone/กลุ่มแก๊ส/คลาส T · SIL ตาม IEC 61508/61511 · สอบเทียบ 5 จุดขาขึ้นขาลง as-found/as-left, TUR ≥ 4:1

## 2. ข้อกำหนดศัพท์ (spelling decision)

เว็บนี้ใช้ **เซนเซอร์** และ **ทรานส์ดิวเซอร์** ตามหลักเกณฑ์การทับศัพท์ภาษาอังกฤษของราชบัณฑิตยสภา (ไม่ใช้ไม้ไต่คู้ในคำทับศัพท์ทั่วไป · ใส่ทัณฑฆาตบนพยัญชนะท้ายที่ตามตัวสะกด) และ **ทรานสมิตเตอร์** สำหรับ transmitter รูป เซ็นเซอร์ และ ทรานสดิวเซอร์ ถูกใช้แพร่หลายเช่นกันและหมายถึงสิ่งเดียวกัน — ผู้ค้นหาใช้รูปใดก็ได้ ศัพท์อื่น: ภาคปรับสภาพสัญญาณ (signal conditioning), ปริมาณที่ต้องการวัด (measurand), การสอบเทียบ (calibration) แยกจากการปรับแต่ง (adjustment), การสอบกลับ (traceability)

## 3. โครงสร้างชุดบทเรียน

หน้าหลัก: https://modsengineeringmath.com/learn/sensors-transducers/ — นิยาม สูตรภาพรวม S1–S4 เส้นทางเรียนตามบทบาท ซิมูเลเตอร์ลูป ข้อกำหนดศัพท์ ดัชนีสูตรที่ค้นหาได้

| บท | หน้า | URL | รหัสสูตร | เนื้อหาหลัก |
|---|---|---|---|---|
| 20.1 | หลักการเบื้องต้น | /learn/sensors-transducers/fundamentals/ | F | ห่วงโซ่การวัด หลักการแปลงพลังงาน ความไว ฮิสเทอรีซิส ความไม่เชิงเส้น %FS/%RDG ค่าคงตัวเวลา แล็บ 3 ชุด |
| 20.2 | ประวัติและวิวัฒนาการ | /learn/sensors-transducers/history-technology/ | H1 | ปรากฏการณ์ที่ค้นพบ (Seebeck 1821, Faraday 1831, Bourdon 1849, Hall 1879, สเตรนเกจ 1938) ห้ายุคของเครื่องมือวัดคุม ประเทศต้นกำเนิด ทิศทางเทคโนโลยี |
| 20.3 | หน่วยและระบบหน่วย | /learn/sensors-transducers/units/ | U | SI 2019 คำนำหน้า หน่วยนอก SI กฎการเขียน กับดักในดาต้าชีต |
| 20.4 | เครื่องมือแปลงหน่วย | /learn/sensors-transducers/unit-lab/ | C | แปลงหน่วยแบบพิมพ์นิพจน์ สเกล 4–20 mA เดซิเบล |
| 20.5 | มาตรวิทยา | /learn/sensors-transducers/measurement-standards/ | M | การสอบกลับ มาตรฐานไฟฟ้าควอนตัม ITS-90 งบความไม่แน่นอน |
| 20.6 | มาตรฐานและประเทศต้นแบบ | /learn/sensors-transducers/electrical-standards/ | E | ฐานข้อมูล 64 มาตรฐาน กรองตามหมวดและประเทศ ตัวเลือกตามชนิดเซนเซอร์ |
| 20.7 | การวัดอุณหภูมิ | /learn/sensors-transducers/temperature-sensors/ | T1–T14 | Callendar–Van Dusen เกรด AA/A/B/C การต่อ 2/3/4 สาย ร้อนตัวเอง Seebeck ชนิด K J T N E R S B CJC NTC β/Steinhart–Hart PTAT อินฟราเรด emissivity การติดตั้ง |
| 20.8 | การวัดความดัน | /learn/sensors-transducers/pressure-sensors/ | P1–P8 | absolute/gauge/DP เบอร์ดอง สเตรนเกจ MEMS คาปาซิทีฟ เรโซแนนต์ แมนิโฟลด์ 3 วาล์ว turndown งบความคลาด ซีลไดอะแฟรม |
| 20.9 | การวัดอัตราการไหล | /learn/sensors-transducers/flow-measurement/ | Q1–Q10 | Reynolds ISO 5167 Reader-Harris/Gallagher รากที่สอง magmeter อัลตราโซนิก วอร์เท็กซ์ คอริโอลิส ตารางเลือก |
| 20.10 | การวัดระดับ | /learn/sensors-transducers/level-measurement/ | L1–L7 | ไฮโดรสแตติก DP ขาแห้ง/ขาเปียก เรดาร์ FMCW GWR อัลตราโซนิก ลูกลอย สวิตช์ ปริมาตรถังนอน ตารางเลือก |
| 20.11 | แรง น้ำหนัก ตำแหน่ง | /learn/sensors-transducers/force-position/ | R1–R7 | สเตรนเกจ บริดจ์ quarter/half/full โหลดเซลล์ mV/V LVDT เอนโค้ดเดอร์ พร็อกซิมิตี NPN/PNP NAMUR |
| 20.12 | กระแสและแรงดัน | /learn/sensors-transducers/current-voltage-sensing/ | V1–V9 | ชันต์ CT IEC 61869-2 ภาระ คลาส 0.5/5P10 ฮอลล์ลูปปิด โรโกวสกี ตัวแบ่งแรงดัน VT CAT |
| 20.13 | ปรับสภาพสัญญาณ · ADC | /learn/sensors-transducers/signal-conditioning-adc/ | A1–A9 | INA CMRR Nyquist aliasing ฟิลเตอร์ LSB SNR ENOB SAR/sigma-delta สัญญาณรบกวน กราวด์ งบความคลาด |
| 20.14 | 4–20 mA · HART | /learn/sensors-transducers/industrial-signals/ | I1–I6 | ทำไมต้องกระแส ลูป 2/3/4 สาย สเกล งบลูป NE 43 0–10 V HART FSK ซิมูเลเตอร์ลูป |
| 20.15 | Modbus RTU · TCP | /learn/sensors-transducers/modbus/ | D1–D6 | RS-485 แบบจำลองข้อมูล 4 ตาราง ฟังก์ชันโค้ด exception เฟรม CRC MBAP เวลาโพล float32 การแก้ปัญหา |
| 20.16 | ฟิลด์บัส · Industrial Ethernet | /learn/sensors-transducers/fieldbus/ | B1–B3 | PROFIBUS DP/PA FOUNDATION Fieldbus งบเซกเมนต์ IO-Link AS-i PROFINET EtherNet/IP EtherCAT OPC UA Ethernet-APL |
| 20.17 | เซนเซอร์อัจฉริยะ · IIoT | /learn/sensors-transducers/smart-sensors-iiot/ | N1–N3 | NE 107 IEEE 1451 TEDS MEMS WirelessHART ISA100 LoRaWAN ISA-95 NOA OPC UA MQTT บำรุงรักษาเชิงพยากรณ์ IEC 62443 |
| 20.18 | P&ID · แท็ก ISA-5.1 | /learn/sensors-transducers/pid-symbols/ | — | โครงสร้างแท็ก ตารางตัวอักษร สัญลักษณ์ ตัวอย่างลูป เอกสารวัดคุม เครื่องมือถอดรหัสแท็ก |
| 20.19 | เลือก · ติดตั้ง · สอบเทียบ | /learn/sensors-transducers/installation-calibration/ | K1–K4 | เช็กลิสต์ IP Ex (Zone กลุ่มแก๊ส T-class entity check) SIL PFDavg EMC สอบเทียบ 5 จุด TUR ลูปเช็ก |
| 20.20 | แล็บวัดคุมเสมือน | /learn/sensors-transducers/instrumentation-lab/ | — | ถัง ปั๊ม VFD วาล์ว ฮีตเตอร์ LT FT PT TT 4–20 mA NE 43 PID สองลูป อินเตอร์ล็อก Modbus ความผิดพลาด 8 แบบ ใบงาน 4 ชุด |

## 4. ตัวเลขตัวอย่างที่ตรวจแล้ว

ตัวเลขทุกตัวคำนวณด้วยเครื่องยนต์เดียวกับเครื่องคำนวณในหน้าเว็บ และตรวจกับไลบรารีอ้างอิง (ตาราง NIST ITS-90 สำหรับเทอร์โมคัปเปิล, ไลบรารี `fluids` สำหรับ ISO 5167)

| ตัวอย่าง | ผลลัพธ์ |
|---|---|
| Pt100 ที่ 150 °C | 157.325 Ω · ความไว 0.3735 Ω/°C · ต่อ 2 สาย (3.5 Ω) อ่านได้ 159.38 °C · Pt1000 คลาดเพียง 0.94 °C |
| เทอร์โมคัปเปิล K | E(100 °C) = 4.096 mV · E(500 °C) = 20.644 mV · Seebeck ที่ 100 °C ≈ 41.4 µV/°C |
| CJC ชนิด K | 18.516 mV + E(30 °C) 1.2033 mV = 19.7193 mV → 478.3 °C |
| NTC 10 kΩ β 3950 ที่ 60 °C | 2486 Ω · แบ่งแรงดัน 3.3 V กับ 10 kΩ ได้ 0.657 V |
| IR ตั้ง ε ผิด (จริง 0.95 ตั้ง 1.00) วัตถุ 100 °C | อ่าน 95.2 °C (ไม่มีรังสีสะท้อน) · 97.2 °C (รวมห้อง 25 °C) |
| ทรานสมิตเตอร์ความดัน 0–10 bar | URL 40 bar → ความคลาดรวม RSS 0.43 % span · URL 16 bar → 0.19 % span |
| ออริฟิซ D 100 mm d 50 mm น้ำ ΔP 25 kPa flange taps | C = 0.6060 · Re = 1.11×10⁵ · q_m = 8.68 kg/s (31.3 m³/h) · ความดันสูญเสียถาวร 18.3 kPa |
| magmeter 50 m³/h DN100 B 5 mT | v = 1.77 m/s · U ≈ 884 µV |
| อัลตราโซนิก v 2 m/s ท่อ 200 mm 45° | Δt ≈ 364 ns |
| ระดับขาเปียก ช่วง 0–4 m H 5 m d 0.5 m | LRV −49.04 kPa · URV −9.90 kPa · ระดับ 2 m = 12.00 mA |
| เรดาร์ FMCW 4 GHz/1 ms ระยะ 6 m | f_b = 160.1 kHz · ΔR = 3.75 cm |
| อัลตราโซนิกในอากาศ 40 °C ตั้ง 20 °C ระยะ 4 m | อ่าน 3.87 m (ผิด 130 mm) |
| ถังนอน ⌀2.5 m ยาว 6 m | ระดับ 32 % = ปริมาตร 27.6 % · ระดับ 80 % = 85.8 % |
| quarter bridge 500 µε GF 2 กระตุ้น 5 V | 1.2494 mV (full bridge 5 mV) |
| โหลดเซลล์ 500 kg 2 mV/V 5 V ADC ±20 mV 18 บิตสะอาด | 7.6 g ต่อหลัก |
| CT 400/5 A สาย 2.5 mm² 30 m + มิเตอร์ 1.5 VA | ภาระ 12 VA เกินพิกัด 10 VA · CT 1 A เหลือ 1.92 VA |
| ADC 16 บิต 10 V SINAD 88 dB | LSB 152.6 µV · ENOB 14.3 |
| ลูป 4–20 mA 24 V ทรานสมิตเตอร์ 10.5 V | R_max = 614 Ω · สาย 0.75 mm² 800 m + การ์ด 250 Ω = 287 Ω ผ่าน · เพิ่มแบเรียร์ 340 Ω ไม่ผ่าน |
| Modbus อ่านจากสเลฟ 1 | คำขอ `01 03 00 00 00 02 C4 0B` · คำตอบ `01 03 04 41 BE 00 00 8E 2B` = 23.75 (ABCD) |
| Modbus 8 สเลฟ 10 รีจิสเตอร์ 19200 8E1 | รอบโพล ≈ 223 ms (115200 → 93 ms) |
| เซกเมนต์ H1 12 อุปกรณ์ × 20 mA trunk 600 m 28 V | ปลายสาย 20.4 V · L_max ≈ 1.5 km |
| แบตเตอรี่ 2600 mAh ตื่น 30 mA 150 ms ทุก 60 s | กระแสเฉลี่ย 80 µA · อายุ ≈ 2.6 ปี (เผื่อ 30 %) |
| IS entity check แบเรียร์ IIC C_o 83 nF | สาย 180 pF/m ยาวได้ ≈ 433 m |
| PFDavg λ_DU 2×10⁻⁷/h ทดสอบทุกปี | 1oo1 ≈ 8.8×10⁻⁴ · 1oo2 ≈ 1.0×10⁻⁶ (ยังไม่รวม common cause) |

## 5. มาตรฐานสำคัญและประเทศต้นแบบ

| มาตรฐาน | เรื่อง | องค์กร · ประเทศ |
|---|---|---|
| SI Brochure, VIM (JCGM 200), GUM (JCGM 100) | หน่วย ศัพท์ ความไม่แน่นอน | BIPM / JCGM · ฝรั่งเศส (Sèvres) |
| IEC 60751 · IEC 60584 · ITS-90 · NIST SRD 60 | RTD · เทอร์โมคัปเปิล · สเกลอุณหภูมิ | IEC (สวิตเซอร์แลนด์) · BIPM · NIST (สหรัฐฯ) |
| ISO 5167 · ISO 20456 · ISO 10790 · ISO 12242 · ISO 12764 | การวัดอัตราการไหล | ISO · สวิตเซอร์แลนด์ |
| IEC 61298 · IEC 60770 · EN 837 | สมรรถนะทรานสมิตเตอร์ · เกจความดัน | IEC · CEN (เบลเยียม) |
| ANSI/ISA-50.1 · IEC 60381 · IEC 60382 · NAMUR NE 43 | สัญญาณ 4–20 mA และ 3–15 psi | ISA (สหรัฐฯ) · IEC · NAMUR (เยอรมนี) |
| HART · FOUNDATION Fieldbus · IEC 62591 | การสื่อสารภาคสนาม | FieldComm Group · สหรัฐฯ |
| Modbus · TIA/EIA-485 | โปรโตคอลอนุกรม | Modbus Organization · TIA · สหรัฐฯ |
| PROFIBUS · PROFINET · IEC 61158/61784 | ฟิลด์บัส | PI (Karlsruhe, เยอรมนี) · IEC |
| IEC 61131-9 (IO-Link) · IEEE 802.3cg (APL) · IEC 62541 (OPC UA) · ISO/IEC 20922 (MQTT) | เชื่อมต่อยุคใหม่ | IEC · IEEE · OPC Foundation · OASIS |
| ANSI/ISA-5.1 · ISA-5.4 · IEC 62424 | P&ID · loop diagram | ISA · IEC |
| IEC 60529 · IEC 60079 · ATEX 2014/34/EU · IECEx | IP · พื้นที่อันตราย | IEC · สหภาพยุโรป |
| IEC 61508 · IEC 61511 · IEC 61326 · IEC 62443 | ความปลอดภัยเชิงหน้าที่ · EMC · ไซเบอร์ | IEC |
| IEC 61869 · IEC 61010 · OIML R 60/R 76 | หม้อแปลงเครื่องวัด · ความปลอดภัยเครื่องมือวัด · โหลดเซลล์/เครื่องชั่ง | IEC · OIML (ฝรั่งเศส) |
| มว. (NIMT) · สมอ. (มอก.) · วสท. | มาตรฐานการวัดแห่งชาติ · มาตรฐานผลิตภัณฑ์ · การติดตั้งไฟฟ้า | ประเทศไทย |

## 6. เครื่องมือโต้ตอบ

- แล็บวัดคุมเสมือน: ถัง 0.5 m² สูง 3 m · ปั๊ม 20 m³/h + VFD · วาล์วขาออก · ฮีตเตอร์ 150 kW · LT-101/FT-102/PT-103/TT-104 ส่ง 4–20 mA ตาม NE 43 · LIC-101 และ TIC-104 (PID, bumpless, anti-windup) · LAH/LAL/LAHH/TAH · รีจิสเตอร์ Modbus สด · ความผิดพลาด: ศูนย์เลื่อน สายขาด ความหนาแน่นเปลี่ยน คลื่นผิวน้ำ ฟองอากาศ เซนเซอร์ขาด วาล์วค้าง ปั๊มทริป
- ซิมูเลเตอร์ลูป 4–20 mA (2/3/4 สาย, สายขาด, ลัดวงจร, แจ้งด้านสูง/ต่ำ, แหล่งจ่ายตก, สายยาว + แบเรียร์, กราวด์ลูป, HART บนสโคป)
- โมเด็ม HART (บิต start/parity/stop และคลื่น FSK) · เครื่องสร้างเฟรม Modbus RTU/TCP พร้อมทรานสมิตเตอร์เสมือนและ exception · CRC-16 · float32 สี่ลำดับไบต์
- เครื่องคำนวณ: RTD, เทอร์โมคัปเปิล (NIST ทุกชนิด), CJC, NTC, ทรานสมิตเตอร์ความดัน, Reynolds, ออริฟิซ ISO 5167, magmeter, อัลตราโซนิก, วอร์เท็กซ์, ไฮโดรสแตติก, DP ขาเปียก, เรดาร์ FMCW, อัลตราโซนิกระดับ, ถังนอน, บริดจ์สเตรนเกจ, โหลดเซลล์, เอนโค้ดเดอร์, ชันต์, CT, ADC, งบลูป, สเกล NE 43, เซกเมนต์ฟิลด์บัส, เวลา Modbus, อายุแบตเตอรี่
- ถอดรหัสแท็ก ISA-5.1 · ใบบันทึกการสอบเทียบ 5 จุด (as-found/as-left, ฮิสเทอรีซิส, คำแนะนำ zero/span trim)

## 7. คำถามที่พบบ่อย

**เซนเซอร์กับทรานส์ดิวเซอร์ต่างกันอย่างไร?** เซนเซอร์คือส่วนที่ได้รับผลโดยตรงจากปริมาณที่วัด ทรานส์ดิวเซอร์ให้เอาต์พุตที่สัมพันธ์กับอินพุตตามที่กำหนด ในอุตสาหกรรม ทรานส์ดิวเซอร์ที่ส่งสัญญาณมาตรฐานไปไกลเรียกว่าทรานสมิตเตอร์

**ทำไม 4–20 mA ไม่เริ่มที่ 0?** live zero แยก 0 % ออกจากสายขาด และกระแส < 3.6 mA ใช้เลี้ยงวงจรของทรานสมิตเตอร์สองสาย

**Pt100 กับเทอร์โมคัปเปิลเลือกอย่างไร?** ต่ำกว่าราว 400–600 °C และต้องการความแม่นใช้ Pt100 · สูงกว่านั้น ต้องการตอบสนองเร็ว หรือราคาต่ำใช้เทอร์โมคัปเปิล (ต้อง CJC)

**อ่าน float จาก Modbus แล้วค่าแปลก?** ลองลำดับคำ ABCD และ CDAB และตรวจว่าแอดเดรสเลื่อนหนึ่ง (40001 = แอดเดรส 0)

**การสอบเทียบต่างจากการปรับแต่งอย่างไร?** สอบเทียบคือเปรียบเทียบกับมาตรฐานที่สอบกลับได้และบันทึก ปรับแต่งคือแก้เครื่อง บันทึก as-found ก่อนปรับและ as-left หลังปรับ
