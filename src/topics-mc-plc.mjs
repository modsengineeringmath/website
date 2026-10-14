// Topics 21–22 (Thai) and their English editions — imported into TOPICS by build.mjs.
// Thai pages: src/pages/learn/<slug>/…  ·  English pages: src/pages/learn/en/<slug>/… (same sub-page slugs, so the
// TH ⇄ EN language switch and hreflang pairs are generated automatically from `enSlug` / `thSlug`).
// Spelling (whole site): แมกเนติกคอนแทกเตอร์ · คอนแทกเตอร์ · โอเวอร์โหลดรีเลย์ · อินเวอร์เตอร์ (Royal Institute transliteration);
// the variants แมกเนติก คอนแทคเตอร์ / แมคเนติกส์ appear only in descriptions and JSON-LD alternateName so search still matches them.

const MC_PARTS = [
  { id: "motors", n: 1, title: "มอเตอร์และระบบไฟฟ้าแรงต่ำ", en: "Motors & Low-Voltage Supply", blurb: "หลักการมอเตอร์เหนี่ยวนำสามเฟส แผ่นป้าย ระบบไฟ 230/400 V 50 Hz ของประเทศในภูมิภาค และการต่อขั้วสตาร์-เดลต้า" },
  { id: "devices", n: 2, title: "อุปกรณ์ควบคุมและการอ่านแบบวงจร", en: "Control Devices & Diagrams", blurb: "คอนแทกเตอร์ AC-3 โอเวอร์โหลดรีเลย์ MPCB เบรกเกอร์ ไทเมอร์ ปุ่มกด สัญลักษณ์ IEC 60617 และรหัสอุปกรณ์ IEC 81346" },
  { id: "starters", n: 3, title: "วงจรสตาร์ทและควบคุมมอเตอร์", en: "Starter & Control Circuits", blurb: "DOL วงจรกลับทางหมุน สตาร์-เดลต้าแบบละเอียด ซอฟต์สตาร์ทเตอร์ และวงจรประยุกต์ในโรงงานจริง" },
  { id: "vfd", n: 4, title: "อินเวอร์เตอร์ปรับความเร็วรอบ (VFD)", en: "Variable Frequency Drives", blurb: "หลักการ V/f PWM การต่อสาย พารามิเตอร์ การประหยัดพลังงานปั๊ม-พัดลม และงานประยุกต์" },
  { id: "practice", n: 5, title: "ออกแบบ ติดตั้ง และแล็บจำลอง", en: "Design, Installation & Lab", blurb: "เลือกอุปกรณ์ ขนาดสาย การประสานการป้องกัน ตู้ควบคุม ทดสอบ แก้ปัญหา และซิมูเลเตอร์วงจรสตาร์ท" },
];
const MC_PARTS_EN = [
  { id: "motors", n: 1, title: "Motors & Low-Voltage Supply", en: "Motors & Low-Voltage Supply", blurb: "Three-phase induction motor principles, nameplates, the 230/400 V 50 Hz systems of the region, and star/delta terminal connections" },
  { id: "devices", n: 2, title: "Control Devices & Diagrams", en: "Control Devices & Diagrams", blurb: "AC-3 contactors, overload relays, MPCBs, breakers, timers, push-buttons, IEC 60617 symbols and IEC 81346 device codes" },
  { id: "starters", n: 3, title: "Starter & Control Circuits", en: "Starter & Control Circuits", blurb: "DOL, reversing, a detailed star-delta starter, soft starters and field-proven applied circuits" },
  { id: "vfd", n: 4, title: "Variable Frequency Drives", en: "Variable Frequency Drives", blurb: "V/f and PWM principles, wiring, parameters, pump and fan energy savings, and applications" },
  { id: "practice", n: 5, title: "Design, Installation & Lab", en: "Design, Installation & Lab", blurb: "Device selection, cable sizing, protection coordination, panels, testing, troubleshooting and the starter simulator" },
];

const MC_SUB = [
  { slug: "induction-motor", part: "motors", sym: "n_s", prefix: "M",
    th: ["มอเตอร์เหนี่ยวนำ", "หลักการมอเตอร์เหนี่ยวนำสามเฟสสำหรับอุตสาหกรรม: สนามแม่เหล็กหมุน สลิป แรงบิด-ความเร็ว กระแสสตาร์ท และแผ่นป้าย", "สนามหมุน n_s = 120f/p สลิป วงจรสมมูล กราฟแรงบิด-ความเร็ว กระแสสตาร์ท 6–8 เท่า ประสิทธิภาพ IE2–IE4 ตาม IEC 60034-30-1 อ่านแผ่นป้าย และคำนวณกระแสพิกัดจาก kW"],
    en: ["Induction motor", "Three-phase induction motors for industry: rotating field, slip, torque–speed curve, starting current and the nameplate", "Rotating field n_s = 120f/p, slip, equivalent circuit, torque–speed curve, 6–8× starting current, IE2–IE4 efficiency (IEC 60034-30-1), reading the nameplate and rated current from kW"] },
  { slug: "supply-systems", part: "motors", sym: "400 V", prefix: "S",
    th: ["ระบบไฟ 230/400 V 50 Hz", "ระบบไฟฟ้าแรงต่ำ 230/400 V 50 Hz ในไทย ลาว กัมพูชา เวียดนาม เมียนมา มาเลเซีย สิงคโปร์: แรงดันสาย แรงดันเฟส ระบบสายดิน และผลต่อมอเตอร์", "IEC 60038 แรงดันใช้งานจริงแต่ละประเทศ 220/380 ถึง 230/400 V ค่าเผื่อ ±10 % ระบบ TN-C-S และ TT ลำดับเฟส แรงดันไม่สมดุล และมอเตอร์ 60 Hz บนไฟ 50 Hz"],
    en: ["230/400 V 50 Hz supply", "Low-voltage 230/400 V 50 Hz supply in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore: line and phase voltage, earthing systems and their effect on motors", "IEC 60038, declared voltages per country from 220/380 to 230/400 V, ±10 % tolerance, TN-C-S and TT earthing, phase sequence, voltage unbalance and 60 Hz motors on 50 Hz"] },
  { slug: "motor-connections", part: "motors", sym: "Y/Δ", prefix: "C",
    th: ["การต่อขั้ว สตาร์ · เดลต้า", "การต่อขั้วมอเตอร์สตาร์และเดลต้า: กล่องขั้ว U1 V1 W1 / W2 U2 V2 มอเตอร์ 230/400 V กับ 400/690 V และการกลับทางหมุน", "แรงดันต่อขดลวด กระแสสายกับกระแสเฟส แผ่นทองแดงเชื่อมในกล่องขั้ว เลือกการต่อจากแผ่นป้าย มอเตอร์ที่สตาร์-เดลต้าได้ การตรวจทางหมุน และข้อผิดพลาดที่ทำให้มอเตอร์ไหม้"],
    en: ["Star & delta connections", "Star and delta motor connections: the U1 V1 W1 / W2 U2 V2 terminal box, 230/400 V vs 400/690 V motors, and reversing", "Voltage per winding, line vs phase current, terminal-box links, choosing the connection from the nameplate, which motors can be star-delta started, checking rotation and the mistakes that burn motors"] },
  { slug: "control-devices", part: "devices", sym: "K", prefix: "D",
    th: ["คอนแทกเตอร์ · โอเวอร์โหลด", "แมกเนติกคอนแทกเตอร์ โอเวอร์โหลดรีเลย์ เบรกเกอร์ป้องกันมอเตอร์ และอุปกรณ์ควบคุม: AC-3 คลาสทริป ไทเมอร์ ปุ่มกด และไฟแสดงสถานะ", "โครงสร้างคอนแทกเตอร์ คอยล์ หน้าสัมผัสหลักและช่วย ประเภทการใช้งาน AC-1 AC-3 AC-4 ตาม IEC 60947-4-1 โอเวอร์โหลดคลาส 10/20 MPCB ฟิวส์ aM การประสาน Type 1/2 ไทเมอร์ และสีปุ่มกดตาม IEC 60204-1"],
    en: ["Contactors & overloads", "Magnetic contactors, overload relays, motor-protection breakers and control devices: AC-3, trip class, timers, push-buttons and pilot lights", "Contactor construction, coil, main and auxiliary contacts, utilization categories AC-1 AC-3 AC-4 (IEC 60947-4-1), class 10/20 overloads, MPCBs, aM fuses, Type 1/2 coordination, timers and IEC 60204-1 colours"] },
  { slug: "diagrams-symbols", part: "devices", sym: "⊣⊢", prefix: "G",
    th: ["สัญลักษณ์ · อ่านแบบวงจร", "อ่านแบบวงจรควบคุมมอเตอร์: สัญลักษณ์ IEC 60617 เทียบ NEMA รหัสอุปกรณ์ IEC 81346 เลขขั้ว เลขสาย และการอ้างอิงข้าม", "วงจรกำลังกับวงจรควบคุม สัญลักษณ์หน้าสัมผัส คอยล์ ไทเมอร์ เลขขั้ว 1/L1–2/T1, A1–A2, 13–14, 21–22 รหัส -Q -K -F -S -H -M การอ้างอิงข้ามหน้า และแบบวงจรระบบยุโรป อเมริกา ญี่ปุ่น"],
    en: ["Symbols & reading diagrams", "Reading motor-control drawings: IEC 60617 vs NEMA symbols, IEC 81346 device codes, terminal markings, wire numbers and cross-references", "Power vs control circuits, contact, coil and timer symbols, terminal markings 1/L1–2/T1, A1–A2, 13–14, 21–22, device letters -Q -K -F -S -H -M, cross-referencing and European, American and Japanese drawing styles"] },
  { slug: "dol-starter", part: "starters", sym: "DOL", prefix: "L",
    th: ["สตาร์ทตรง DOL", "วงจรสตาร์ทมอเตอร์โดยตรง (DOL): วงจรกำลัง วงจรควบคุมแบบล็อกตัวเอง ควบคุมสองจุด จ็อก และการเลือกอุปกรณ์ทีละขั้น", "หลักการล็อกตัวเอง (self-holding) ปุ่ม STOP แบบ NC ทำไมต้องต่อสายอนุกรม ควบคุมหลายจุด จ็อก ไฟแสดงสถานะ ตัวอย่างเลือก MPCB คอนแทกเตอร์ สาย สำหรับมอเตอร์ 7.5 kW 400 V"],
    en: ["Direct-on-line (DOL)", "Direct-on-line starter: power circuit, self-holding control circuit, two-location control, jogging and step-by-step device selection", "Self-holding (latching) contact, why STOP is a normally-closed button in series, multi-location control, jog, pilot lights, and selecting the MPCB, contactor and cable for a 7.5 kW 400 V motor"] },
  { slug: "forward-reverse", part: "starters", sym: "⇄", prefix: "R",
    th: ["กลับทางหมุน", "วงจรกลับทางหมุนมอเตอร์สามเฟส: สลับสองเฟส อินเตอร์ล็อกทางไฟฟ้า ทางกล และปุ่มกด และการกลับทางอัตโนมัติด้วยลิมิตสวิตช์", "ทำไมสลับ L1 กับ L3 แล้วกลับทาง ป้องกันลัดวงจรด้วยอินเตอร์ล็อกสามชั้น กลับทางผ่าน STOP กับกลับทันที ประตูม้วน รอกไฟฟ้า สายพานลำเลียง และลิมิตสวิตช์"],
    en: ["Forward–reverse", "Three-phase motor reversing circuits: swapping two phases, electrical, mechanical and push-button interlocks, and automatic reversing with limit switches", "Why swapping L1 and L3 reverses rotation, three layers of interlock against a phase-to-phase short, reversing via STOP vs direct, roller doors, hoists, conveyors and limit switches"] },
  { slug: "star-delta", part: "starters", sym: "Y→Δ", prefix: "Y",
    th: ["สตาร์-เดลต้า", "วงจรสตาร์ทสตาร์-เดลต้าแบบละเอียด: วงจรกำลัง วงจรควบคุม ขนาดคอนแทกเตอร์ 0.58 In การตั้งโอเวอร์โหลด ไทเมอร์ และเวลาเปลี่ยนจังหวะ", "กระแสและแรงบิดเหลือ 1/3 คอนแทกเตอร์สามตัว KM1 KM2 KM3 ตั้งโอเวอร์โหลด 0.58 In เวลาตั้งไทเมอร์ ช่วงตายระหว่าง Y กับ Δ กระแสกระชากตอนเปลี่ยนจังหวะ ลำดับเฟสด้านเดลต้า สตาร์-เดลต้าแบบปิดวงจร และการเดินสายหกเส้น"],
    en: ["Star–delta starter", "The star–delta starter in detail: power and control circuits, 0.58·In contactor sizing, overload setting, timer and changeover time", "Current and torque reduced to 1/3, contactors KM1 KM2 KM3, overload at 0.58·In, timer setting, Y–Δ dead time, transition current peaks, phase order on the delta side, closed-transition starters and six-wire cabling"] },
  { slug: "soft-starters", part: "starters", sym: "∠α", prefix: "T",
    th: ["ซอฟต์สตาร์ท · ออโต้ทรานส์", "ซอฟต์สตาร์ทเตอร์ ออโต้ทรานส์ฟอร์เมอร์ และการเปรียบเทียบวิธีสตาร์ทมอเตอร์: กระแส แรงบิด แรงดันตก และราคา", "ไทริสเตอร์ควบคุมมุมจุดชนวน ลดแรงดันแบบ ramp จำกัดกระแส ควบคุมแรงบิด บายพาสคอนแทกเตอร์ หยุดนุ่มสำหรับปั๊ม (water hammer) สตาร์ทด้วยออโต้ทรานส์ และตารางเลือกวิธีสตาร์ท"],
    en: ["Soft starters & autotransformers", "Soft starters, autotransformer starters and a comparison of motor starting methods: current, torque, voltage dip and cost", "Thyristor phase-angle control, voltage ramp, current limit, torque control, bypass contactor, soft stop against water hammer, autotransformer starting and a starting-method selection table"] },
  { slug: "applied-circuits", part: "starters", sym: "⚙", prefix: "A",
    th: ["วงจรประยุกต์", "วงจรควบคุมมอเตอร์ประยุกต์ในงานจริง: สตาร์ทเรียงลำดับ ปั๊มน้ำลูกลอย สลับปั๊ม ปั๊มลมสวิตช์ความดัน มอเตอร์สองความเร็ว และรีเลย์ป้องกันเฟส", "สตาร์ทเรียงลำดับด้วยไทเมอร์ สายพานหลายตัว ปั๊มน้ำควบคุมด้วยลูกลอยหรืออิเล็กโทรด สลับปั๊มหลัก-สำรอง Hand-Off-Auto ปั๊มลม มอเตอร์ดาห์ลันเดอร์ และรีเลย์ป้องกันเฟสขาด-กลับเฟส"],
    en: ["Applied circuits", "Applied motor-control circuits from real plants: sequence starting, float-switch pumps, duty/standby alternation, pressure-switch compressors, two-speed motors and phase-failure relays", "Timed sequence starting, conveyor chains, float or electrode pump control, duty/standby alternation, Hand-Off-Auto, compressors, Dahlander two-speed motors and phase-loss/phase-reversal relays"] },
  { slug: "vfd", part: "vfd", sym: "V/f", prefix: "V",
    th: ["หลักการอินเวอร์เตอร์", "อินเวอร์เตอร์ (VFD) สำหรับมอเตอร์: วงจรเรียงกระแส บัส DC IGBT PWM การควบคุม V/f เวกเตอร์ และการต่อสายที่ถูกต้อง", "บัส DC 540–565 V จากไฟ 400 V PWM V/f คงที่และย่าน field weakening sensorless vector ห้ามมีคอนแทกเตอร์หรือคาปาซิเตอร์ด้านออก สายชีลด์ EMC ความยาวสาย dv/dt RCD Type B ตัวต้านทานเบรก และอินเวอร์เตอร์ 1 เฟสเข้า 3 เฟสออก"],
    en: ["VFD principles", "Variable frequency drives for motors: rectifier, DC bus, IGBT PWM, V/f and vector control, and correct wiring", "540–565 V DC bus from 400 V, PWM, constant V/f and field weakening, sensorless vector, no contactor or capacitor on the output, shielded cable and EMC, cable length and dv/dt, RCD Type B, braking resistor, and single-phase-in three-phase-out drives"] },
  { slug: "vfd-applications", part: "vfd", sym: "n³", prefix: "P",
    th: ["ตั้งค่า · งานประยุกต์ VFD", "ตั้งค่าและใช้งานอินเวอร์เตอร์: พารามิเตอร์พื้นฐาน ความเร็วหลายสเต็ป 0–10 V / 4–20 mA ปั๊มแรงดันคงที่ PID และการประหยัดพลังงานตามกฎแอฟฟินิตี", "ขั้นตอนตั้งค่า 12 ข้อ เวลาเร่ง-ลด แหล่งคำสั่ง ความเร็วสเต็ป อินพุตแอนะล็อก ปั๊มน้ำแรงดันคงที่ สายพาน พัดลม กฎกำลัง ∝ n³ คำนวณการประหยัดพลังงานและระยะคืนทุน ลดพิกัดตามอุณหภูมิ และบายพาส"],
    en: ["VFD setup & applications", "Setting up and applying VFDs: basic parameters, multi-speed, 0–10 V / 4–20 mA, constant-pressure PID pumping and energy savings from the affinity laws", "A 12-step commissioning procedure, accel/decel times, command source, preset speeds, analog inputs, constant-pressure pumps, conveyors, fans, P ∝ n³, energy-saving and payback calculation, temperature derating and bypass"] },
  { slug: "design-installation", part: "practice", sym: "✓", prefix: "K",
    th: ["ออกแบบ · ติดตั้ง · แก้ปัญหา", "ออกแบบและติดตั้งวงจรมอเตอร์: เลือกเบรกเกอร์ ขนาดสาย แรงดันตกขณะสตาร์ท ตู้ควบคุม ทดสอบ Megger และตารางแก้ปัญหา", "ขั้นตอนออกแบบ 10 ข้อ ขนาดสายตามกระแสและแรงดันตก มาตรฐานการติดตั้งทางไฟฟ้า วสท. และ IEC 60364 ตู้ IEC 61439 IP ความร้อนในตู้ ทดสอบความเป็นฉนวน ลูปเช็ก และอาการเสียที่พบบ่อยพร้อมสาเหตุ"],
    en: ["Design, installation & troubleshooting", "Designing and installing motor circuits: breaker selection, cable size, starting voltage dip, control panels, megger testing and a troubleshooting table", "A 10-step design procedure, cable sizing for current and voltage drop, Thai EIT wiring code and IEC 60364, IEC 61439 panels, IP rating, panel heat, insulation-resistance testing, loop checks and common faults with causes"] },
  { slug: "motor-lab", part: "practice", sym: "▶",
    th: ["ซิมูเลเตอร์วงจรสตาร์ท", "ซิมูเลเตอร์วงจรสตาร์ทมอเตอร์: DOL กลับทางหมุน สตาร์-เดลต้า ซอฟต์สตาร์ท และอินเวอร์เตอร์ เห็นกระแส แรงบิด ความเร็ว และหน้าสัมผัสทำงานจริง", "กดปุ่ม START STOP เห็นเส้นทางไฟในวงจรควบคุม คอนแทกเตอร์ดูด ไทเมอร์นับ กราฟกระแส แรงบิด ความเร็วรอบแบบเรียลไทม์ ใส่ความผิดพลาด เช่น โอเวอร์โหลด เฟสขาด และเปรียบเทียบวิธีสตาร์ท"],
    en: ["Starter simulator", "Motor starter simulator: DOL, reversing, star–delta, soft starter and VFD with live current, torque, speed and contacts", "Press START and STOP and watch power flow through the control circuit, contactors pull in, the timer run and current, torque and speed plotted in real time; inject faults such as overload and phase loss and compare starting methods"], tag: ["ซิมูเลเตอร์ + ใบงาน", "Simulator + worksheets"] },
];

const PLC_PARTS = [
  { id: "basics", n: 1, title: "พื้นฐาน PLC และฮาร์ดแวร์", en: "PLC Basics & Hardware", blurb: "PLC คืออะไร โครงสร้าง วงรอบการสแกน มาตรฐาน IEC 61131 และการต่อสายอินพุต-เอาต์พุต PNP/NPN" },
  { id: "programming", n: 2, title: "การเขียนโปรแกรม", en: "Programming", blurb: "แลดเดอร์ ไทเมอร์ เคาน์เตอร์ และภาษา IEC 61131-3 ทั้ง 5 แบบ พร้อมตัวอย่างโค้ดเดียวกันหลายภาษา" },
  { id: "applications", n: 3, title: "งานประยุกต์ในโรงงาน", en: "Industrial Applications", blurb: "ควบคุมมอเตอร์ด้วย PLC การควบคุมแบบลำดับขั้น อนาล็อก PID และสั่งงานอินเวอร์เตอร์" },
  { id: "practice", n: 4, title: "ติดตั้ง ความปลอดภัย และแล็บ", en: "Commissioning, Safety & Lab", blurb: "ขั้นตอนทดสอบระบบ ความปลอดภัยเครื่องจักร การแก้ปัญหา และซิมูเลเตอร์แลดเดอร์ในเบราว์เซอร์" },
];
const PLC_PARTS_EN = [
  { id: "basics", n: 1, title: "PLC Basics & Hardware", en: "PLC Basics & Hardware", blurb: "What a PLC is, its architecture, the scan cycle, IEC 61131 and PNP/NPN input-output wiring" },
  { id: "programming", n: 2, title: "Programming", en: "Programming", blurb: "Ladder logic, timers, counters and the five IEC 61131-3 languages, with the same program in several languages" },
  { id: "applications", n: 3, title: "Industrial Applications", en: "Industrial Applications", blurb: "Motor control with a PLC, sequential control, analog and PID, and commanding a VFD" },
  { id: "practice", n: 4, title: "Commissioning, Safety & Lab", en: "Commissioning, Safety & Lab", blurb: "Commissioning procedure, machine safety, troubleshooting and an in-browser ladder simulator" },
];

const PLC_SUB = [
  { slug: "plc-fundamentals", part: "basics", sym: "CPU", prefix: "F",
    th: ["PLC คืออะไร · สแกน", "PLC คืออะไร: โครงสร้าง CPU หน่วยความจำ I/O วงรอบการสแกน เวลาสแกน มาตรฐาน IEC 61131 และการเลือก PLC", "ประวัติจากรีเลย์สู่ PLC สถาปัตยกรรม การสแกนอินพุต-โปรแกรม-เอาต์พุต เวลาสแกนและเวลาตอบสนอง PLC แบบคอมแพกต์ โมดูลาร์ เซฟตี้ เทียบรีเลย์และไมโครคอนโทรลเลอร์ และยี่ห้อที่ใช้ในภูมิภาค"],
    en: ["What is a PLC · scan", "What a PLC is: CPU, memory and I/O architecture, the scan cycle, scan time, IEC 61131 and choosing a PLC", "From relays to PLCs, architecture, the input–program–output scan, scan and response time, compact, modular and safety PLCs, PLC vs relays vs microcontrollers, and brands used in the region"] },
  { slug: "io-wiring", part: "basics", sym: "24V", prefix: "W",
    th: ["ต่อสาย I/O · PNP/NPN", "การต่อสายอินพุต-เอาต์พุต PLC: ซิงก์-ซอร์ส เซนเซอร์ PNP/NPN เอาต์พุตรีเลย์-ทรานซิสเตอร์ โหลดเหนี่ยวนำ และแหล่งจ่าย 24 VDC", "อินพุต 24 VDC ตาม IEC 61131-2 ซิงก์กับซอร์ส เซนเซอร์ 3 สาย PNP NPN และ 2 สาย เอาต์พุตรีเลย์ ทรานซิสเตอร์ ไทรแอก ไดโอดและ RC สนับเบอร์ รีเลย์ต่อกลาง อนาล็อก 4–20 mA และการเลือกแหล่งจ่าย"],
    en: ["I/O wiring · PNP/NPN", "Wiring PLC inputs and outputs: sinking and sourcing, PNP/NPN sensors, relay vs transistor outputs, inductive loads and the 24 VDC supply", "24 VDC inputs per IEC 61131-2, sink vs source, 3-wire PNP/NPN and 2-wire sensors, relay, transistor and triac outputs, diodes and RC snubbers, interposing relays, 4–20 mA analog and power-supply sizing"] },
  { slug: "ladder-basics", part: "programming", sym: "┤├", prefix: "B",
    th: ["แลดเดอร์พื้นฐาน", "แลดเดอร์ไดอะแกรมพื้นฐาน: หน้าสัมผัส NO NC คอยล์ AND OR ล็อกตัวเอง SET RESET ขอบสัญญาณ และพีชคณิตบูลีน", "อ่านแลดเดอร์เหมือนวงจรรีเลย์ ตารางความจริง ปุ่ม STOP ที่ต่อแบบ NC ใช้หน้าสัมผัส NO ในโปรแกรม ทำไม? คอยล์ซ้ำ ขอบขาขึ้น-ขาลง และรูปแบบแอดเดรส Mitsubishi Omron Siemens IEC"],
    en: ["Ladder basics", "Ladder diagram basics: NO and NC contacts, coils, AND, OR, self-holding, SET/RESET, edges and Boolean algebra", "Reading ladder like a relay circuit, truth tables, why a STOP button wired NC is programmed with an NO contact, double coils, rising and falling edges, and Mitsubishi, Omron, Siemens and IEC addressing"] },
  { slug: "timers-counters", part: "programming", sym: "TON", prefix: "T",
    th: ["ไทเมอร์ · เคาน์เตอร์", "ไทเมอร์และเคาน์เตอร์ตาม IEC 61131-3: TON TOF TP CTU CTD CTUD พร้อมไดอะแกรมเวลาและตัวอย่างงานจริง", "หน่วงเวลาเปิด หน่วงเวลาปิด พัลส์ วงจรไฟกะพริบ นับชิ้นงาน รีเซ็ต เคาน์เตอร์ความเร็วสูง และกับดักเวลาสแกน"],
    en: ["Timers & counters", "IEC 61131-3 timers and counters: TON, TOF, TP, CTU, CTD and CTUD with timing diagrams and real examples", "On-delay, off-delay, pulse, flasher circuits, part counting, reset, high-speed counters and scan-time pitfalls"] },
  { slug: "iec-languages", part: "programming", sym: "ST", prefix: "L",
    th: ["ภาษา IEC 61131-3", "ภาษาโปรแกรม PLC ตาม IEC 61131-3: LD FBD ST SFC และ IL โปรแกรมเดียวกันในหลายภาษา ชนิดข้อมูล และการเลือกใช้", "แลดเดอร์ ฟังก์ชันบล็อก Structured Text Sequential Function Chart ชนิดข้อมูล BOOL INT REAL TIME ฟังก์ชันบล็อกที่สร้างเอง และเมื่อไรควรใช้ภาษาไหน"],
    en: ["IEC 61131-3 languages", "PLC programming languages in IEC 61131-3: LD, FBD, ST, SFC and IL — one program in several languages, data types and when to use which", "Ladder, function block diagram, Structured Text and Sequential Function Chart, data types BOOL INT REAL TIME, user function blocks, and choosing a language"] },
  { slug: "plc-motor-control", part: "applications", sym: "M", prefix: "M",
    th: ["ควบคุมมอเตอร์ด้วย PLC", "ควบคุมมอเตอร์ด้วย PLC: DOL กลับทางหมุน สตาร์-เดลต้า รายการ I/O การต่อสาย อินเตอร์ล็อกฮาร์ดไวร์ และการตรวจสอบป้อนกลับคอนแทกเตอร์", "แปลงวงจรคอนแทกเตอร์เป็นแลดเดอร์และ ST สิ่งที่ต้องคงไว้ในฮาร์ดแวร์ อินพุตโอเวอร์โหลด ตรวจคอนแทกเตอร์ค้าง และแบบวงจร PLC ควบคุมสตาร์-เดลต้าครบชุด"],
    en: ["Motor control with a PLC", "Motor control with a PLC: DOL, reversing, star–delta, I/O lists, wiring, hard-wired interlocks and contactor feedback monitoring", "Translating contactor circuits into ladder and ST, what must stay in hardware, overload inputs, detecting welded contactors, and a complete PLC star–delta drawing"] },
  { slug: "sequential-control", part: "applications", sym: "SFC", prefix: "S",
    th: ["ควบคุมแบบลำดับขั้น", "การควบคุมแบบลำดับขั้น: สเตตแมชชีน SFC/GRAFCET สัญญาณไฟจราจร สายพานคัดแยก และถังผสมแบบแบตช์", "ออกแบบด้วยแผนภาพสถานะ ขั้นและเงื่อนไขเปลี่ยนขั้น เขียนเป็นแลดเดอร์แบบ SET/RESET และ ST แบบ CASE โหมดอัตโนมัติ-มือ หยุดฉุกเฉินและการกลับสู่จุดเริ่ม"],
    en: ["Sequential control", "Sequential control: state machines, SFC/GRAFCET, traffic lights, sorting conveyors and batch mixing tanks", "Designing with state diagrams, steps and transitions, implementing in ladder with SET/RESET and in ST with CASE, auto/manual modes, emergency stop and homing"] },
  { slug: "analog-pid-vfd", part: "applications", sym: "PID", prefix: "P",
    th: ["อนาล็อก · PID · สั่ง VFD", "อนาล็อก PID และการสั่งงานอินเวอร์เตอร์ด้วย PLC: สเกล 4–20 mA บล็อก PID ปั๊มแรงดันคงที่ และ Modbus RTU", "สูตรสเกลค่า raw เป็นหน่วยวิศวกรรม ตรวจสายขาด PID แบบ positional ปรับจูน สั่ง VFD ด้วยดิจิทัล อนาล็อก และ Modbus RTU พร้อมแผนที่รีจิสเตอร์ตัวอย่าง"],
    en: ["Analog · PID · VFD", "Analog, PID and commanding VFDs from a PLC: 4–20 mA scaling, the PID block, constant-pressure pumping and Modbus RTU", "Scaling raw counts to engineering units, wire-break detection, positional PID and tuning, commanding a VFD by digital, analog and Modbus RTU, with a sample register map"] },
  { slug: "commissioning-safety", part: "practice", sym: "⚠", prefix: "K",
    th: ["ทดสอบระบบ · ความปลอดภัย", "ทดสอบระบบ PLC ความปลอดภัยเครื่องจักร และการแก้ปัญหา: ลูปเช็ก การ Force หยุดฉุกเฉิน IEC 60204-1 ISO 13849 และเอกสาร", "ขั้นตอนก่อนจ่ายไฟ ทดสอบ I/O ทีละจุด อันตรายของการ Force หมวดหยุด 0/1/2 รีเลย์เซฟตี้ PL และ SIL การสำรองโปรแกรม และผังแก้ปัญหา"],
    en: ["Commissioning & safety", "PLC commissioning, machine safety and troubleshooting: loop checks, forcing, emergency stop, IEC 60204-1, ISO 13849 and documentation", "Pre-power checks, point-by-point I/O tests, the dangers of forcing, stop categories 0/1/2, safety relays, PL and SIL, program backups and a troubleshooting flow"] },
  { slug: "plc-lab", part: "practice", sym: "▶",
    th: ["ซิมูเลเตอร์แลดเดอร์", "ซิมูเลเตอร์ PLC แลดเดอร์ในเบราว์เซอร์: เขียนโปรแกรม เห็นกระแสไหลในแลดเดอร์ ไทเมอร์ เคาน์เตอร์ และตัวอย่างพร้อมใช้", "แก้ไขโปรแกรมแบบข้อความ แสดงเป็นแลดเดอร์อัตโนมัติ กดอินพุตแล้วเห็นการสแกน TON TOF CTU SET RESET ขอบสัญญาณ ตัวอย่าง DOL กลับทาง สตาร์-เดลต้า ไฟจราจร ถังน้ำ และใบงาน"],
    en: ["Ladder simulator", "In-browser PLC ladder simulator: write a program, watch power flow, timers and counters, with ready-made examples", "Edit the program as text, see it drawn as ladder automatically, toggle inputs and watch the scan, TON TOF CTU SET RESET and edges, with DOL, reversing, star–delta, traffic light and tank examples and worksheets"], tag: ["ซิมูเลเตอร์ + ใบงาน", "Simulator + worksheets"] },
];

const mkSub = (list, lang) => list.map((s) => {
  const [short, title, summary] = s[lang];
  const o = { slug: s.slug, part: s.part, short, title, en: s.en[1].split(":")[0], sym: s.sym, summary };
  if (s.prefix) o.prefix = s.prefix;
  if (s.tag) o.tag = s.tag[lang === "th" ? 0 : 1];
  return o;
});

export const MC_PLC_TOPICS = [
  {
    // Topic 21: AC motor control with magnetic contactors, star-delta, soft starters and VFDs (5 parts × 14 pages).
    // Tools: assets/mc-calc.js (EEKit calculators data-mc=…), assets/mc-lab.js (starter simulator .mc-lab), figures from scripts/mc_figs.py.
    slug: "motor-control",
    enSlug: "en/motor-control",
    title: "การควบคุมมอเตอร์ไฟฟ้ากระแสสลับด้วยแมกเนติกคอนแทกเตอร์และอินเวอร์เตอร์",
    en: "AC Motor Control: Contactors, Star–Delta & VFDs",
    sym: "M3~",
    hubFx: true, hubShort: "ภาพรวม", hubPrefix: "H",
    summary: "มอเตอร์เหนี่ยวนำสามเฟสสำหรับอุตสาหกรรมบนระบบ 230/400 V 50 Hz ของไทยและเพื่อนบ้าน การต่อสตาร์-เดลต้า แมกเนติกคอนแทกเตอร์ โอเวอร์โหลด สัญลักษณ์และแบบวงจร IEC วงจร DOL กลับทางหมุน สตาร์-เดลต้าแบบละเอียด ซอฟต์สตาร์ท อินเวอร์เตอร์ VFD การออกแบบติดตั้ง และซิมูเลเตอร์",
    fxHint: "พิมพ์ เช่น slip, rpm, สตาร์, เดลต้า, 0.58, ac-3, overload, กระแสสตาร์ท, v/f, n³, แรงดันตก, สาย",
    parts: MC_PARTS,
    sub: mkSub(MC_SUB, "th"),
  },
  {
    // Topic 22: PLC automation (4 parts × 10 pages). Tool: assets/plc-sim.js (ladder simulator .plc-sim), figures from scripts/mc_figs.py.
    slug: "plc",
    enSlug: "en/plc",
    title: "การควบคุมอัตโนมัติด้วย PLC",
    en: "PLC Automation",
    sym: "PLC",
    hubFx: true, hubShort: "ภาพรวม", hubPrefix: "H",
    summary: "PLC ตั้งแต่โครงสร้างและวงรอบการสแกน การต่อสาย I/O PNP/NPN แลดเดอร์ ไทเมอร์ เคาน์เตอร์ ภาษา IEC 61131-3 ควบคุมมอเตอร์ DOL กลับทาง สตาร์-เดลต้า การควบคุมแบบลำดับขั้น อนาล็อก PID สั่งอินเวอร์เตอร์ ทดสอบระบบและความปลอดภัย พร้อมซิมูเลเตอร์แลดเดอร์ในเบราว์เซอร์",
    fxHint: "พิมพ์ เช่น scan, pnp, npn, ton, ctu, set, edge, scaling, 4-20, pid, modbus, sfc",
    parts: PLC_PARTS,
    sub: mkSub(PLC_SUB, "th"),
  },
  {
    slug: "en/motor-control",
    lang: "en", num: 21, thSlug: "motor-control",
    title: "AC Motor Control with Magnetic Contactors & VFDs",
    en: "AC Motor Control: Contactors, Star–Delta & VFDs",
    sym: "M3~",
    hubFx: true, hubShort: "Overview", hubPrefix: "H",
    summary: "Industrial three-phase induction motors on the 230/400 V 50 Hz systems of Thailand and its neighbours, star and delta connections, magnetic contactors and overloads, IEC symbols and drawings, DOL, reversing, a detailed star–delta starter, soft starters, VFDs, design and installation, and a simulator.",
    fxHint: "Try slip, rpm, star, delta, 0.58, ac-3, overload, starting current, v/f, n³, voltage drop, cable",
    parts: MC_PARTS_EN,
    sub: mkSub(MC_SUB, "en"),
  },
  {
    slug: "en/plc",
    lang: "en", num: 22, thSlug: "plc",
    title: "PLC Automation",
    en: "PLC Automation",
    sym: "PLC",
    hubFx: true, hubShort: "Overview", hubPrefix: "H",
    summary: "PLCs from architecture and the scan cycle to PNP/NPN I/O wiring, ladder logic, timers, counters, the IEC 61131-3 languages, motor control (DOL, reversing, star–delta), sequential control, analog and PID, commanding VFDs, commissioning and safety, with an in-browser ladder simulator.",
    fxHint: "Try scan, pnp, npn, ton, ctu, set, edge, scaling, 4-20, pid, modbus, sfc",
    parts: PLC_PARTS_EN,
    sub: mkSub(PLC_SUB, "en"),
  },
];
