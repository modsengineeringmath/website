/* Calculators for the motor-control and PLC series (/learn/motor-control/, /learn/plc/ and /learn/en/…). Needs ee-kit.js.
   <div class="fg-calc mc-calc" data-mc="current|speed|stardelta|starting|cable|dip|vf|energy|scale|scan"> — any input can be preset with data-<key>.
   <button data-mc-fill="key" data-vals='{"k":"v"}'> refills a calculator on the page. Labels follow <html lang> (th / en).
   Teaching values: copper PVC cable ampacity ≈ IEC 60364-5-52 method B2 (3 loaded conductors, 30 °C) — use your national table for design. */
(function () {
  "use strict";
  var K = window.EEKit, n = K.n, ok = K.ok, warn = K.warn, EN = K.EN();
  var L = function (th, en) { return EN ? en : th; };
  var S3 = Math.sqrt(3);
  var CABLE = [[1.5, 15.5], [2.5, 21], [4, 28], [6, 36], [10, 50], [16, 68], [25, 89], [35, 110], [50, 134], [70, 171], [95, 207], [120, 239], [150, 275], [185, 314], [240, 370]];
  var MPCB = [[0.1, 0.16], [0.16, 0.25], [0.25, 0.4], [0.4, 0.63], [0.63, 1], [1, 1.6], [1.6, 2.5], [2.5, 4], [4, 6.3], [6, 10], [9, 14], [13, 18], [17, 23], [20, 25], [24, 32], [30, 40], [37, 50], [48, 65], [63, 80]];
  var AC3 = [9, 12, 18, 25, 32, 38, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265, 330, 400];
  var pick = function (arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] >= v) return arr[i]; return null; };
  var mpcb = function (I) { for (var i = 0; i < MPCB.length; i++) if (MPCB[i][0] <= I && I <= MPCB[i][1]) return MPCB[i]; return null; };
  // typical IE3 4-pole 400 V data (rounded catalogue averages) used when the user chooses "typical"
  var TYP = [[0.75, 0.80, 0.73], [1.1, 0.83, 0.76], [1.5, 0.85, 0.78], [2.2, 0.865, 0.81], [3, 0.875, 0.81], [4, 0.885, 0.82], [5.5, 0.896, 0.82], [7.5, 0.904, 0.82],
    [11, 0.914, 0.84], [15, 0.921, 0.84], [18.5, 0.926, 0.85], [22, 0.93, 0.85], [30, 0.936, 0.85], [37, 0.939, 0.86], [45, 0.942, 0.86], [55, 0.946, 0.86], [75, 0.95, 0.86], [90, 0.952, 0.87], [110, 0.954, 0.87]];
  var typ = function (kw) { var b = TYP[0]; TYP.forEach(function (r) { if (Math.abs(r[0] - kw) < Math.abs(b[0] - kw)) b = r; }); return b; };

  var CALC = {
    current: {
      t: L("กระแสพิกัดมอเตอร์สามเฟสจากกำลัง kW", "Three-phase motor rated current from kW"), ref: "M6–M8",
      ins: [["kw", L("กำลังที่เพลา P", "Shaft power P"), "kW", "7.5"], ["v", L("แรงดันสาย V_L", "Line voltage V_L"), "V", "400"],
        ["eff", L("ประสิทธิภาพ η (0 = ค่าทั่วไป IE3)", "Efficiency η (0 = typical IE3)"), "", "0"], ["pf", L("cos φ (0 = ค่าทั่วไป)", "cos φ (0 = typical)"), "", "0"], ["kis", L("Is/In จากแผ่นป้าย", "Is/In from the plate"), "", "7"]],
      f: function (x) {
        var t = typ(x.kw), eff = x.eff > 0 ? x.eff : t[1], pf = x.pf > 0 ? x.pf : t[2];
        var pin = x.kw / eff, I = x.kw * 1e3 / (S3 * x.v * eff * pf), kva = S3 * x.v * I / 1e3;
        return { rows: [[L("ประสิทธิภาพ · cos φ ที่ใช้", "Efficiency · cos φ used"), n(eff, 3) + " · " + n(pf, 2) + (x.eff > 0 && x.pf > 0 ? "" : L(" (ค่าทั่วไป)", " (typical)"))],
          [L("กำลังไฟฟ้าที่ดึง P_in = P/η", "Electrical input P_in = P/η"), n(pin, 2) + " kW"], [L("กำลังปรากฏ S", "Apparent power S"), n(kva, 2) + " kVA"],
          ["I_n = P / (√3·V·η·cos φ)", "<b>" + n(I, 1) + " A</b>"], [L("กระแสสตาร์ท DOL ≈", "DOL starting current ≈"), n(I * x.kis, 0) + " A"],
          [L("กฎหยาบที่ 400 V", "Rule of thumb at 400 V"), "≈ 2 A/kW → " + n(2 * x.kw, 1) + " A"]],
          note: L("ใช้กระแสจากแผ่นป้ายเสมอเมื่อมี ค่าทั่วไปเป็นค่าเฉลี่ยมอเตอร์ IE3 4 ขั้ว มอเตอร์ 2 ขั้วและ 6–8 ขั้วมี cos φ ต่างกัน",
            "Always use the nameplate current when you have it; the typical values are averages for 4-pole IE3 motors — 2-pole and 6–8-pole motors differ.") };
      }
    },
    speed: {
      t: L("ความเร็วซิงโครนัส สลิป และแรงบิดพิกัด", "Synchronous speed, slip and rated torque"), ref: "M1–M4",
      ins: [["f", L("ความถี่", "Frequency"), "Hz", "50"], ["p", L("จำนวนขั้ว p", "Poles p"), "sel", "4", ["2", "4", "6", "8"]], ["n", L("ความเร็วจากแผ่นป้าย", "Nameplate speed"), "rpm", "1470"], ["kw", L("กำลัง", "Power"), "kW", "7.5"]],
      f: function (x) {
        var p = +x.p, ns = 120 * x.f / p, s = (ns - x.n) / ns, T = 9550 * x.kw / x.n, fr = s * x.f;
        return { rows: [["n_s = 120 f / p", "<b>" + n(ns, 0) + " rpm</b>"], [L("สลิป s = (n_s − n)/n_s", "Slip s = (n_s − n)/n_s"), n(s * 100, 2) + " %"], [L("ความถี่กระแสโรเตอร์ f_r = s·f", "Rotor frequency f_r = s·f"), n(fr, 2) + " Hz"],
          [L("แรงบิดพิกัด T = 9550·P/n", "Rated torque T = 9550·P/n"), "<b>" + n(T, 1) + " N·m</b>"], [L("ความเร็วเชิงมุม ω", "Angular speed ω"), n(x.n * 2 * Math.PI / 60, 1) + " rad/s"]],
          note: s < 0 || s > 0.15 ? warn(L("สลิปผิดปกติ ตรวจจำนวนขั้วหรือความเร็ว", "Unusual slip — check poles or speed")) : "" };
      }
    },
    stardelta: {
      t: L("ออกแบบชุดสตาร์-เดลต้า: ขนาดคอนแทกเตอร์ ค่าตั้งโอเวอร์โหลด และไทเมอร์", "Star–delta starter design: contactor sizes, overload setting and timer"), ref: "Y1–Y8",
      ins: [["in", L("กระแสพิกัดมอเตอร์ In", "Motor rated current In"), "A", "14.6"], ["kis", L("Is/In (DOL)", "Is/In (DOL)"), "", "6.5"], ["kts", L("Ts/Tn (DOL)", "Ts/Tn (DOL)"), "", "2.2"],
        ["load", L("แรงบิดโหลดตอนเริ่ม (% Tn)", "Load breakaway torque (% Tn)"), "%", "20"], ["plate", L("แผ่นป้ายมอเตอร์", "Motor nameplate"), "sel", "400/690 V Δ/Y", ["400/690 V Δ/Y", "230/400 V Δ/Y"]]],
      f: function (x) {
        if (x.plate.indexOf("230/400") === 0) return { rows: [[L("ใช้สตาร์-เดลต้าไม่ได้", "Star–delta not possible"), "✗"]],
          note: warn(L("มอเตอร์ 230/400 V ที่ระบบ 400 V ต้องต่อสตาร์ตลอดเวลา ถ้าต่อเดลต้าขดลวดได้ 400 V เกินพิกัด √3 เท่า → ไหม้ ใช้ DOL ซอฟต์สตาร์ท หรือ VFD แทน",
            "A 230/400 V motor on 400 V must stay in star. Delta would put 400 V on 230 V windings (√3 too high) → burnout. Use DOL, a soft starter or a VFD.")) };
        var iph = x.in / S3, ty = x.kts / 3 * 100;
        var km1 = pick(AC3, 0.58 * x.in), km3 = pick(AC3, 0.58 * x.in), km2 = pick(AC3, 0.33 * x.in);
        return { rows: [[L("กระแสเฟส (ในขดลวด) เมื่อเดิน Δ", "Phase (winding) current in Δ"), n(iph, 1) + " A = 0.58·In"],
          [L("ค่าตั้งโอเวอร์โหลด (อยู่ในทางกระแสเฟส)", "Overload setting (in the phase-current path)"), "<b>" + n(iph, 1) + " A</b>"],
          ["KM1 " + L("หลัก", "main") + " ≥ 0.58·In (AC-3)", n(0.58 * x.in, 1) + " A → " + (km1 || "—") + " A"], ["KM3 Δ ≥ 0.58·In (AC-3)", n(0.58 * x.in, 1) + " A → " + (km3 || "—") + " A"],
          ["KM2 Y ≥ 0.33·In (AC-3)", n(0.33 * x.in, 1) + " A → " + (km2 || "—") + " A"],
          [L("กระแสสตาร์ทสาย DOL → Y", "Starting line current DOL → Y"), n(x.in * x.kis, 0) + " → <b>" + n(x.in * x.kis / 3, 0) + " A</b>"],
          [L("แรงบิดเริ่มที่ Y", "Starting torque in Y"), n(ty, 0) + " % Tn"],
          [L("เร่งได้ไหม", "Can it accelerate?"), ty > x.load * 1.3 ? ok(true, L("ได้ (Ty > 1.3 × โหลด)", "Yes (Ty > 1.3 × load)")) : ok(false, L("เสี่ยง: แรงบิด Y ไม่พอ", "Risky: not enough Y torque"))],
          [L("ไทเมอร์เริ่มต้น", "Timer start value"), L("5–10 s แล้วปรับให้เปลี่ยนที่ ~ 85–90 % ความเร็ว", "5–10 s, then adjust to change at ~85–90 % speed")]],
          note: L("ขนาดคอนแทกเตอร์เป็นขนาดมาตรฐานที่ใกล้ที่สุด (ตาม AC-3 ที่ 400 V) — ตรวจตารางผู้ผลิตชุดสตาร์-เดลต้าที่ประสานแล้ว (Type 2) เสมอ",
            "Contactor sizes are the next standard AC-3 rating at 400 V — always check the manufacturer's coordinated (Type 2) star–delta tables.") };
      }
    },
    starting: {
      t: L("เปรียบเทียบวิธีสตาร์ท: กระแส แรงบิด และแรงดันตกที่หม้อแปลง", "Compare starting methods: current, torque and transformer voltage dip"), ref: "T1–T5",
      ins: [["kw", L("มอเตอร์", "Motor"), "kW", "37"], ["in", "In", "A", "66"], ["kis", "Is/In", "", "7"], ["kts", "Ts/Tn", "", "2.3"],
        ["str", L("หม้อแปลง", "Transformer"), "kVA", "500"], ["uk", L("อิมพีแดนซ์ uk", "Impedance uk"), "%", "4"], ["load", L("แรงบิดโหลดตอนเริ่ม", "Load starting torque"), "% Tn", "30"]],
      f: function (x) {
        var Ssc = x.str / (x.uk / 100), ms = [["DOL", 1], [L("สตาร์-เดลต้า", "Star–delta"), 1 / 3], [L("ออโต้ทรานส์ 65 %", "Autotransf. 65 %"), 0.4225], [L("ซอฟต์สตาร์ท 3·In", "Soft starter 3·In"), 3 / x.kis]];
        var rows = [];
        ms.forEach(function (m) {
          var I = x.in * x.kis * m[1], T = x.kts * m[1] * 100, dip = 100 * (S3 * 400 * I / 1e3) / (Ssc + S3 * 400 * I / 1e3);
          rows.push([m[0], n(I, 0) + " A · " + n(T, 0) + " % Tn · " + L("ตก ", "dip ") + n(dip, 1) + " % " + (T > x.load * 1.3 ? ok(true, "") : ok(false, ""))]);
        });
        rows.push(["VFD", n(x.in * 1.5, 0) + " A · 150 % Tn · " + L("ตก ", "dip ") + n(100 * (S3 * 400 * x.in * 0.6 / 1e3) / (Ssc), 1) + " % " + ok(true, "")]);
        rows.unshift([L("กำลังลัดวงจรที่ขั้วหม้อแปลง S_sc = S/uk", "Short-circuit power S_sc = S/uk"), n(Ssc / 1000, 1) + " MVA"]);
        return { rows: rows, note: L("แรงดันตก ≈ S_start/(S_sc + S_start) ไม่รวมสาย เป้าหมายทั่วไป ≤ 10–15 % ขณะสตาร์ท ✓ = แรงบิดสตาร์ท > 1.3 × แรงบิดโหลด",
          "Dip ≈ S_start/(S_sc + S_start), cable not included; a common limit is ≤ 10–15 % while starting. ✓ = starting torque > 1.3 × load torque.") };
      }
    },
    cable: {
      t: L("ขนาดสายมอเตอร์และแรงดันตก (ทองแดง PVC)", "Motor cable size and voltage drop (copper PVC)"), ref: "K3–K6",
      ins: [["in", L("กระแสพิกัด In", "Rated current In"), "A", "14.6"], ["len", L("ความยาวสาย", "Cable length"), "m", "60"], ["pf", "cos φ", "", "0.82"], ["kis", "Is/In", "", "6.5"],
        ["kt", L("ตัวคูณลดพิกัด (อุณหภูมิ/กลุ่มสาย)", "Derating factor (temperature/grouping)"), "", "0.87"], ["lim", L("แรงดันตกยอมให้ขณะเดิน", "Allowed running drop"), "%", "3"]],
      f: function (x) {
        var res = null, rows = [];
        for (var i = 0; i < CABLE.length; i++) {
          var A = CABLE[i][0], Iz = CABLE[i][1] * x.kt, R = 0.0225 / A, X = 0.08e-3;
          var dv = S3 * x.in * x.len * (R * x.pf + X * Math.sin(Math.acos(x.pf))), pct = dv / 400 * 100;
          if (Iz >= x.in * 1.0 && pct <= x.lim) { res = { A: A, Iz: Iz, pct: pct, R: R, X: X }; break; }
        }
        if (!res) return { rows: [[L("ไม่พบขนาดในตาราง (≤ 240 mm²)", "No size found (≤ 240 mm²)"), "—"]] };
        var dvs = S3 * x.in * x.kis * x.len * (res.R * 0.3 + res.X * Math.sin(Math.acos(0.3))) / 400 * 100;
        return { rows: [[L("ขนาดสายที่เลือก", "Selected size"), "<b>" + res.A + " mm²</b>"], [L("พิกัดกระแสหลังลดพิกัด Iz", "Derated ampacity Iz"), n(res.Iz, 1) + " A ≥ " + n(x.in, 1) + " A"],
          [L("แรงดันตกขณะเดิน", "Running voltage drop"), n(res.pct, 2) + " %"], [L("แรงดันตกขณะสตาร์ท DOL (cos φ ≈ 0.3)", "Drop during DOL start (cos φ ≈ 0.3)"), n(dvs, 1) + " % " + (dvs <= 10 ? ok(true, "≤ 10 %") : ok(false, "> 10 %"))],
          ["ΔV = √3·I·L·(R cos φ + X sin φ)", "R = " + n(res.R * 1000, 3) + " mΩ/m · X ≈ 0.08 mΩ/m"]],
          note: L("ค่าพิกัดสายเป็นค่าสอนโดยประมาณตาม IEC 60364-5-52 วิธี B2 ที่ 30 °C — การออกแบบจริงในไทยใช้ตารางมาตรฐานการติดตั้งทางไฟฟ้า วสท. (ฐาน 40 °C) และวิธีเดินสายจริง",
            "Ampacities are approximate teaching values (IEC 60364-5-52 method B2, 30 °C) — real designs use your national wiring code tables (Thailand: EIT, 40 °C base) and the actual installation method.") };
      }
    },
    vf: {
      t: L("อินเวอร์เตอร์ V/f: แรงดันออก ความเร็ว และแรงบิดที่ได้", "VFD V/f: output voltage, speed and available torque"), ref: "V2–V5",
      ins: [["vb", L("แรงดันฐาน (แผ่นป้าย)", "Base voltage (plate)"), "V", "400"], ["fb", L("ความถี่ฐาน", "Base frequency"), "Hz", "50"], ["f", L("ความถี่สั่ง", "Commanded frequency"), "Hz", "35"],
        ["boost", L("บูสต์ที่ 0 Hz", "Boost at 0 Hz"), "%", "3"], ["p", L("จำนวนขั้ว", "Poles"), "sel", "4", ["2", "4", "6", "8"]], ["s", L("สลิปพิกัด", "Rated slip"), "%", "2"]],
      f: function (x) {
        var V = x.f <= x.fb ? x.vb * (x.boost / 100 + (1 - x.boost / 100) * x.f / x.fb) : x.vb, ns = 120 * x.f / +x.p, nr = ns * (1 - x.s / 100 * (x.fb / Math.max(x.f, 1)) * (x.f / x.fb));
        var tq = x.f <= x.fb ? 1 : x.fb / x.f;
        return { rows: [[L("แรงดันออก", "Output voltage"), "<b>" + n(V, 0) + " V</b>"], ["V/f", n(V / Math.max(x.f, 0.1), 2) + " V/Hz"], [L("ความเร็วซิงโครนัส", "Synchronous speed"), n(ns, 0) + " rpm"],
          [L("ความเร็วโดยประมาณที่โหลดพิกัด", "Approx. speed at rated load"), n(nr, 0) + " rpm"], [L("แรงบิดต่อเนื่องสูงสุด (ทางไฟฟ้า)", "Max continuous torque (electrical)"), n(tq * 100, 0) + " % Tn" + (x.f > x.fb ? L(" — ย่านฟลักซ์ลด", " — field weakening") : "")],
          [L("ระบายความร้อนพัดลมบนเพลา", "Shaft-fan cooling"), x.f < 25 ? warn(L("ต่ำกว่า 25 Hz: ลดโหลดหรือเพิ่มพัดลมแยก", "below 25 Hz: derate or add a separate fan")) : ok(true, L("เพียงพอ", "adequate"))]],
          note: L("ที่ความถี่สลิปคงที่ (Hz) ความเร็วตก ณ โหลดพิกัดเกือบเท่าเดิมทุกความถี่ จึงตั้งค่าชดเชยสลิปใน VFD ได้", "At constant slip frequency the speed drop at rated load is nearly the same at every frequency — set slip compensation in the drive.") };
      }
    },
    energy: {
      t: L("การประหยัดพลังงานปั๊ม/พัดลมด้วย VFD เทียบการหรี่วาล์ว", "Pump/fan energy savings with a VFD vs throttling"), ref: "P3–P8",
      ins: [["kw", L("กำลังไฟฟ้าที่ 100 % อัตราไหล", "Input power at 100 % flow"), "kW", "30"], ["q", L("อัตราไหลเฉลี่ยที่ต้องการ", "Average required flow"), "%", "75"], ["h0", L("หัวสถิตเทียบหัวที่พิกัด", "Static head share at rated point"), "%", "0"],
        ["hr", L("ชั่วโมงเดินต่อปี", "Running hours per year"), "h", "6000"], ["tar", L("ค่าไฟเฉลี่ย", "Energy price"), L("฿/kWh", "per kWh"), "4.5"], ["cost", L("ราคา VFD ติดตั้ง", "Installed VFD cost"), "", "180000"]],
      f: function (x) {
        var q = x.q / 100, h0 = x.h0 / 100;
        var pThr = x.kw * (0.55 + 0.45 * q);
        var nsp = Math.sqrt(h0 + (1 - h0) * q * q), pV = x.kw * (q * (h0 + (1 - h0) * q * q)) / 0.97 + x.kw * 0.02;
        var save = Math.max(0, pThr - pV), kwh = save * x.hr, money = kwh * x.tar;
        return { rows: [[L("ความเร็วที่ต้องใช้ (ตามกราฟระบบ)", "Speed needed (system curve)"), n(nsp * 100, 1) + " %"], [L("กำลังเมื่อหรี่วาล์ว", "Power with throttling"), n(pThr, 1) + " kW"],
          [L("กำลังเมื่อใช้ VFD (รวมสูญเสียไดรฟ์ ~3 %)", "Power with VFD (incl. ~3 % drive loss)"), n(pV, 1) + " kW"], [L("ลดลง", "Reduction"), "<b>" + n(save, 1) + " kW</b> (" + n(save / pThr * 100, 0) + " %)"],
          [L("พลังงานที่ประหยัดต่อปี", "Energy saved per year"), n(kwh, 0) + " kWh"], [L("เงินที่ประหยัดต่อปี", "Money saved per year"), n(money, 0)], [L("ระยะคืนทุน", "Payback"), money > 0 ? n(x.cost / money, 1) + L(" ปี", " years") : "—"]],
          note: L("กฎแอฟฟินิตี P ∝ n³ ใช้ได้ตรงเมื่อไม่มีหัวสถิต ระบบที่ต้องยกน้ำขึ้นที่สูงต้องใช้ความเร็วสูงกว่า จึงประหยัดน้อยลง — ใส่สัดส่วนหัวสถิตเพื่อดูผล",
            "The affinity law P ∝ n³ holds only without static head. Lifting systems need more speed and save less — enter the static-head share to see the effect.") };
      }
    },
    scale: {
      t: L("สเกลค่าแอนะล็อก PLC เป็นหน่วยวิศวกรรม", "Scale a PLC analog value to engineering units"), ref: "P1–P3",
      ins: [["raw", L("ค่าดิบที่อ่านได้", "Raw value read"), "", "13824"], ["rmin", L("ค่าดิบต่ำสุด (4 mA)", "Raw min (4 mA)"), "", "0"], ["rmax", L("ค่าดิบสูงสุด (20 mA)", "Raw max (20 mA)"), "", "27648"],
        ["emin", L("หน่วยวิศวกรรมต่ำสุด", "Eng. min"), "", "0"], ["emax", L("หน่วยวิศวกรรมสูงสุด", "Eng. max"), "", "10"]],
      f: function (x) {
        var y = x.emin + (x.raw - x.rmin) * (x.emax - x.emin) / (x.rmax - x.rmin), ma = 4 + 16 * (x.raw - x.rmin) / (x.rmax - x.rmin);
        return { rows: [[L("ค่าทางวิศวกรรม", "Engineering value"), "<b>" + n(y, 3) + "</b>"], [L("เทียบเป็นกระแส", "Equivalent current"), n(ma, 2) + " mA"], [L("เปอร์เซ็นต์ช่วง", "Percent of span"), n((x.raw - x.rmin) / (x.rmax - x.rmin) * 100, 1) + " %"],
          [L("สถานะสาย", "Wire status"), ma < 3.6 ? ok(false, L("ต่ำกว่า 3.6 mA: สายขาด/ทรานสมิตเตอร์เสีย (NE 43)", "below 3.6 mA: wire break / failed transmitter (NE 43)")) : ma > 21 ? ok(false, L("เกิน 21 mA: ผิดปกติ", "above 21 mA: fault")) : ok(true, L("ปกติ", "normal"))]] };
      }
    },
    scan: {
      t: L("เวลาตอบสนองของ PLC และความยาวพัลส์ที่จับได้", "PLC response time and the shortest pulse it can catch"), ref: "F3–F5",
      ins: [["scan", L("เวลาสแกน", "Scan time"), "ms", "10"], ["filt", L("ตัวกรองอินพุต", "Input filter"), "ms", "3"], ["out", L("หน่วงเอาต์พุต (รีเลย์ ~10, ทรานซิสเตอร์ ~0.1)", "Output delay (relay ~10, transistor ~0.1)"), "ms", "10"], ["pulse", L("ความยาวพัลส์จากเซนเซอร์", "Sensor pulse length"), "ms", "15"]],
      f: function (x) {
        var best = x.filt + x.scan * 0 + x.out, worst = x.filt + 2 * x.scan + x.out, minp = x.scan + x.filt;
        return { rows: [[L("ตอบสนองเร็วสุด", "Best-case response"), n(best, 1) + " ms"], [L("ตอบสนองช้าสุด ≈ filter + 2·scan + output", "Worst case ≈ filter + 2·scan + output"), "<b>" + n(worst, 1) + " ms</b>"],
          [L("พัลส์สั้นสุดที่รับประกันว่าเห็น", "Shortest pulse guaranteed to be seen"), n(minp, 1) + " ms"], [L("พัลส์ของคุณ", "Your pulse"), x.pulse >= minp ? ok(true, L("จับได้แน่นอน", "always caught")) : ok(false, L("อาจหลุด → ใช้อินพุตความเร็วสูง/อินเตอร์รัปต์", "may be missed → use a high-speed/interrupt input"))]] };
      }
    },
  };
  K.calcs("data-mc", CALC, "mc");
})();
