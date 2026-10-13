/* Home EV charging tools for /learn/ev-charging/ — needs assets/ee-kit.js first. Plain JS, no dependencies.
   Calculators: <div class="fg-calc ev-calc" data-ev="time|portable|cp|home|cable|cost|solar"></div>  (preset any input with data-<key>)
   Control Pilot lab: <div class="ev-cp" [data-a="16"] [data-state="C"]></div>
   Home energy simulator: <div class="ev-sim" [data-preset="now|offpeak|wfh-solar|battery"]></div>; <button data-ev-preset="name"> loads a preset.
   Numbers are teaching values (Thai tariffs 2025, typical equipment) — check current tariffs and the latest PEA/MEA/EIT rules. */
(function (root) {
  "use strict";
  var K = root.EEKit;
  var n = K.n, ok = K.ok, warn = K.warn, baht = K.baht;

  // ------------------------------------------------------------------ data
  // Thai residential tariffs (PEA/MEA, type 1.2 progressive and 1.3.2 TOU below 22 kV), baht/kWh excl. Ft and VAT
  var TARIFF = {
    tiers: [[150, 3.2484], [250, 4.2218], [Infinity, 4.4217]], service: 24.62,
    touOn: 5.7982, touOff: 2.6369, touService: 24.62, vat: 0.07, ft: 0.1972
  };
  // single-core PVC (THW, 70 °C) in conduit, 2 loaded conductors, 40 °C ambient — rounded values of the kind tabulated in the Thai
  // wiring standard (EIT) for this method; check the current table for your installation method
  var AMPACITY = [[1.5, 13], [2.5, 18], [4, 24], [6, 31], [10, 42], [16, 56], [25, 73], [35, 89], [50, 108], [70, 136], [95, 164]];
  var BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
  var RHO70 = 0.017241 * (1 + 0.00393 * 50); // Ω·mm²/m, copper at 70 °C
  var METERS = [["5(15) A 1 เฟส", 15, 1], ["15(45) A 1 เฟส", 45, 1], ["30(100) A 1 เฟส", 100, 1], ["15(45) A 3 เฟส", 45, 3], ["30(100) A 3 เฟส", 100, 3]];
  var meter = function (name) { for (var i = 0; i < METERS.length; i++) if (METERS[i][0] === name) return METERS[i]; return METERS[1]; };

  // charging power vs SOC: constant power up to the knee, then a linear taper to `tail` × P at 100 % (CC-CV seen from the wall)
  function chargeProfile(o) {
    // o: {cap kWh usable, s0, s1 (%), p (kW at the wall), eta, knee (%), tail}
    var t = 0, s = o.s0, dt = 1 / 60, pts = [[0, s]], pw = [], eGrid = 0, tKnee = null;
    var knee = o.knee == null ? 80 : o.knee, tail = o.tail == null ? 0.3 : o.tail;
    while (s < o.s1 - 1e-9 && t < 200) {
      var f = s <= knee ? 1 : 1 - (1 - tail) * (s - knee) / (100 - knee);
      var p = o.p * f, dE = p * o.eta * dt, ds = (dE / o.cap) * 100;
      if (s + ds > o.s1) { var frac = (o.s1 - s) / ds; t += dt * frac; eGrid += p * dt * frac; s = o.s1; }
      else { s += ds; t += dt; eGrid += p * dt; }
      if (tKnee === null && s >= Math.min(knee, o.s1)) tKnee = t;
      pts.push([t, s]); pw.push([t, p]);
    }
    return { t: t, eGrid: eGrid, eBatt: o.cap * (o.s1 - o.s0) / 100, pts: pts, pw: pw, tKnee: tKnee || t };
  }
  var hm = function (h) { if (!isFinite(h)) return "—"; var H = Math.floor(h), M = Math.round((h - H) * 60); if (M === 60) { H++; M = 0; } return H + " ชม. " + M + " นาที"; };
  var clock = function (h) { h = ((h % 24) + 24) % 24; var H = Math.floor(h), M = Math.round((h - H) * 60); if (M === 60) { H = (H + 1) % 24; M = 0; } return (H < 10 ? "0" : "") + H + ":" + (M < 10 ? "0" : "") + M; };
  function billNormal(kwh, ft) {
    var left = kwh, prev = 0, e = 0;
    TARIFF.tiers.forEach(function (t) { var q = Math.max(0, Math.min(left, t[0])); e += q * t[1]; left -= q; prev += q; });
    return (e + TARIFF.service + kwh * ft) * (1 + TARIFF.vat);
  }
  function billTOU(on, off, ft) { return (on * TARIFF.touOn + off * TARIFF.touOff + TARIFF.touService + (on + off) * ft) * (1 + TARIFF.vat); }
  // Control Pilot duty ↔ current (IEC 61851-1 Annex A)
  function dutyToAmp(d) { return d < 8 ? (d >= 3 && d <= 7 ? "digital" : 0) : d < 10 ? 6 : d <= 85 ? d * 0.6 : d <= 96 ? (d - 64) * 2.5 : d <= 97 ? 80 : 0; }
  function ampToDuty(a) { return a <= 51 ? a / 0.6 : a / 2.5 + 64; }
  var PP = [["13 A (1.5 kΩ)", 13, 1500], ["20 A (680 Ω)", 20, 680], ["32 A (220 Ω)", 32, 220], ["63 A (100 Ω)", 63, 100]];

  // ------------------------------------------------------------------ calculators
  var CALC = {
    time: {
      t: "เวลาชาร์จและพลังงานที่ใช้ (รวมช่วงกำลังลดลงหลัง 80 %)", ref: "B1–B6",
      ins: [["cap", "ความจุแบตเตอรี่ที่ใช้ได้", "kWh", "60"], ["s0", "SOC เริ่มต้น", "%", "20"], ["s1", "SOC เป้าหมาย", "%", "80"],
        ["mode", "วิธีชาร์จ", "sel", "วอลล์บ็อกซ์ 1 เฟส 32 A (7.4 kW)", ["สายชาร์จพกพา 10 A (2.3 kW)", "สายชาร์จพกพา 16 A (3.7 kW)", "วอลล์บ็อกซ์ 1 เฟส 32 A (7.4 kW)", "วอลล์บ็อกซ์ 3 เฟส 16 A (11 kW)", "วอลล์บ็อกซ์ 3 เฟส 32 A (22 kW)", "กำหนดเอง"]],
        ["pcustom", "กำลังที่ผนัง (ถ้ากำหนดเอง)", "kW", "7"], ["obc", "On-board charger ของรถ (AC สูงสุด)", "kW", "11"], ["eta", "ประสิทธิภาพผนัง → แบต", "%", "90"], ["cons", "อัตราสิ้นเปลือง", "kWh/100 km", "15"]],
      f: function (x) {
        var map = { "สายชาร์จพกพา 10 A (2.3 kW)": 2.3, "สายชาร์จพกพา 16 A (3.7 kW)": 3.68, "วอลล์บ็อกซ์ 1 เฟส 32 A (7.4 kW)": 7.36, "วอลล์บ็อกซ์ 3 เฟส 16 A (11 kW)": 11.04, "วอลล์บ็อกซ์ 3 เฟส 32 A (22 kW)": 22.08 };
        var pin = map[x.mode] || x.pcustom, p = Math.min(pin, x.obc), eta = x.eta / 100;
        if (x.s1 <= x.s0) return { rows: [["SOC เป้าหมายต้องมากกว่าค่าเริ่มต้น", "—"]] };
        var r = chargeProfile({ cap: x.cap, s0: x.s0, s1: Math.min(100, x.s1), p: p, eta: eta });
        var simple = r.eBatt / (p * eta), km = r.eBatt / x.cons * 100;
        var tm = Math.max(1, Math.ceil(r.t));
        var svg = K.chart({ w: 640, h: 240, xs: [0, tm], ys: [0, 100], y2s: [0, Math.ceil(p * 1.1)], xt: K.niceTicks(tm, 6).ticks.filter(function (t) { return t <= tm; }), yt: [0, 20, 40, 60, 80, 100], y2t: K.niceTicks(Math.ceil(p * 1.1), 4).ticks.filter(function (t) { return t <= Math.ceil(p * 1.1); }),
          xl: "เวลา (ชั่วโมง)", yl: "SOC (%)", y2l: "กำลังที่ผนัง (kW)", label: "SOC และกำลังชาร์จตามเวลา",
          series: [{ cls: "s1", pts: r.pts }, { cls: "s2", axis: 2, pts: r.pw }], legend: [["f1", "SOC"], ["f2", "กำลังชาร์จ"]] });
        return { rows: [["กำลังที่ใช้จริง (จำกัดโดย OBC)", n(p, 2) + " kW" + (pin > x.obc ? " " + warn("รถรับได้แค่ " + x.obc + " kW") : "")],
          ["พลังงานเข้าแบตเตอรี่", n(r.eBatt, 1) + " kWh"], ["พลังงานจากมิเตอร์", n(r.eGrid, 1) + " kWh"], ["สูญเสียในเครื่องชาร์จและแบต", n(r.eGrid - r.eBatt, 1) + " kWh"],
          ["เวลาแบบง่าย (กำลังคงที่)", hm(simple)], ["เวลาจริงโดยประมาณ", "<b>" + hm(r.t) + "</b>"], ["ระยะทางที่ได้", n(km, 0) + " km"], ["ระยะทางต่อชั่วโมงที่ชาร์จ", n(km / r.t, 0) + " km/ชม."]],
          svg: svg, note: "แบบจำลอง: กำลังคงที่ถึง SOC 80 % แล้วลดลงเป็นเส้นตรงจนเหลือ 30 % ที่ SOC 100 % (การชาร์จ AC ที่บ้านส่วนใหญ่ลดลงช้ากว่านี้ การชาร์จ DC ลดลงเร็วกว่า) ประสิทธิภาพจริงลดลงเมื่อชาร์จกระแสต่ำและเมื่อแบตเย็นหรือร้อนจัด" };
      }
    },
    portable: {
      t: "สายชาร์จพกพาเสียบเต้ารับบ้าน (Mode 2): กระแส ความร้อน แรงดันตก และเวลาชาร์จ", ref: "M1–M6",
      ins: [["i", "กระแสที่ตั้งบนสายชาร์จ", "A", "10"], ["v", "แรงดันที่ตู้ไฟ", "V", "230"], ["sock", "พิกัดเต้ารับ", "A", "16"], ["brk", "เบรกเกอร์วงจรนี้", "A", "16"],
        ["a", "ขนาดสายวงจรเต้ารับ", "mm²", "2.5"], ["l", "ความยาวสายจากตู้ (ทางเดียว)", "m", "20"], ["rc", "ความต้านทานหน้าสัมผัสปลั๊ก (ใหม่ ≈ 3, หลวม/ไหม้ 20–50)", "mΩ", "5"],
        ["need", "พลังงานที่ต้องการเข้าแบต", "kWh", "30"], ["eta", "ประสิทธิภาพ (กระแสต่ำ)", "%", "86"]],
      f: function (x) {
        var R = 2 * x.l * RHO70 / x.a, dv = x.i * R, p = x.v * x.i / 1000, pc = x.i * x.i * x.rc / 1000, lossCable = x.i * x.i * R;
        var amp = AMPACITY.filter(function (r) { return r[0] === x.a; })[0], cap = amp ? amp[1] : NaN;
        var cont = x.i <= 0.8 * x.sock + 1e-9, cbl = x.i * 1.25 <= Math.min(cap, x.brk) + 1e-9 || x.i * 1.25 <= cap, hrs = x.need / (p * x.eta / 100);
        return { rows: [["กำลังชาร์จ", n(p, 2) + " kW"], ["กระแสต่อเนื่อง ≤ 80 % ของเต้ารับ", ok(cont, n(x.i, 1) + " / " + n(0.8 * x.sock, 1) + " A")],
          ["สาย " + x.a + " mm² รับกระแส (ร้อยท่อ)", isFinite(cap) ? ok(x.i * 1.25 <= cap, "ต้องการ 1.25 × I = " + n(1.25 * x.i, 1) + " A · สายรับ " + cap + " A") : "ใส่ 1.5, 2.5, 4, 6 …"],
          ["เบรกเกอร์ไม่เกินความสามารถของสาย", isFinite(cap) ? ok(x.brk <= cap, x.brk + " A ≤ " + cap + " A") : "—"],
          ["ความร้อนที่หน้าสัมผัสปลั๊ก I²R", (pc > 3 ? warn(n(pc, 2) + " W — ร้อนจัด เสี่ยงไหม้") : ok(true, n(pc, 2) + " W"))],
          ["ความร้อนในสายทั้งวงจร", n(lossCable, 1) + " W"], ["แรงดันตกในสาย", n(dv, 1) + " V = " + n(dv / x.v * 100, 2) + " %"],
          ["เวลาชาร์จ " + x.need + " kWh", hm(hrs)], ["ระยะทางต่อชั่วโมง (15 kWh/100 km)", n(p * x.eta / 100 / 0.15, 0) + " km/ชม."]],
          note: "ปลั๊กไหม้เกิดที่หน้าสัมผัสก่อนเสมอ เพราะกำลังความร้อนเป็นสัดส่วนกับ I² — ลดกระแสจาก 16 A เหลือ 10 A ความร้อนลดเหลือ 39 % ห้ามใช้สายพ่วง ปลั๊กแปลง หรือเต้ารับที่หลวม ถ้าชาร์จทุกวันควรเดินวงจรเฉพาะ" };
      }
    },
    cp: {
      t: "Control Pilot: duty cycle ↔ กระแสสูงสุดที่อนุญาต", ref: "W2–W4",
      ins: [["mode", "คำนวณจาก", "sel", "กระแส → duty", ["กระแส → duty", "duty → กระแส"]], ["a", "กระแสที่ต้องการ", "A", "32"], ["d", "duty cycle", "%", "53.3"],
        ["pp", "สาย (ตัวต้านทาน PP)", "sel", "32 A (220 Ω)", PP.map(function (p) { return p[0]; })], ["obc", "OBC ของรถ (ต่อเฟส)", "A", "32"]],
      f: function (x) {
        var d = x.mode === "กระแส → duty" ? ampToDuty(Math.max(6, Math.min(80, x.a))) : x.d, a = dutyToAmp(d);
        var cab = PP.filter(function (p) { return p[0] === x.pp; })[0], lim = typeof a === "number" ? Math.min(a, cab[1], x.obc) : NaN;
        return { rows: [["duty cycle ที่สถานีส่ง", n(d, 1) + " %"], ["กระแสที่อนุญาตจาก PWM", typeof a === "number" ? n(a, 1) + " A" : "สื่อสารแบบดิจิทัล (ISO 15118)"],
          ["ความกว้างพัลส์ที่ 1 kHz", n(d * 10, 0) + " µs"], ["สายรับได้", cab[1] + " A"], ["รถดึงจริง ≤ min(PWM, สาย, OBC)", "<b>" + n(lim, 1) + " A</b>"],
          ["กำลัง 1 เฟส 230 V", n(lim * 0.23, 2) + " kW"], ["กำลัง 3 เฟส 400 V", n(lim * 0.23 * 3, 2) + " kW"]],
          note: "IEC 61851-1: 10–85 % → I = 0.6 × D ; 85–96 % → I = (D − 64) × 2.5 ; 5 % = สื่อสารดิจิทัล ; ต่ำกว่า 8 % หรือสูงกว่า 97 % = ห้ามชาร์จ ค่ากระแสต่ำสุดที่ใช้ได้คือ 6 A" };
      }
    },
    home: {
      t: "ระบบไฟบ้านรับรถ EV ได้ไหม: โหลดรวม มิเตอร์ และเมนเบรกเกอร์", ref: "H1–H5",
      ins: [["meter", "มิเตอร์ปัจจุบัน", "sel", "15(45) A 1 เฟส", METERS.map(function (m) { return m[0]; })], ["main", "เมนเบรกเกอร์", "A", "40"],
        ["ac", "แอร์ทั้งหมด (กำลังพิกัดรวม)", "kW", "3"], ["wh", "เครื่องทำน้ำอุ่น (รวม)", "kW", "4.5"], ["cook", "เตาไฟฟ้า ไมโครเวฟ หม้อหุงข้าว", "kW", "2"],
        ["base", "ไฟแสงสว่าง ปลั๊ก ตู้เย็น อื่น ๆ", "kW", "1.5"], ["df", "ใช้พร้อมกัน (น้ำอุ่น + ครัว + อื่น ๆ)", "%", "50"], ["ev", "เครื่องชาร์จรถ", "kW", "7.4"], ["v", "แรงดัน", "V", "230"]],
      f: function (x) {
        var m = meter(x.meter), ph = m[2], connected = x.ac + x.wh + x.cook + x.base + x.ev;
        var demand = x.ac + x.ev + (x.wh + x.cook + x.base) * x.df / 100, i = demand * 1000 / (x.v * ph), iNoEv = (demand - x.ev) * 1000 / (x.v * ph);
        var evI = x.ev * 1000 / (x.v * (x.ev > 7.5 && ph === 3 ? 3 : 1));
        var rec = i <= 45 ? "15(45) A 1 เฟส" : i <= 100 ? "30(100) A 1 เฟส" : "3 เฟส";
        return { rows: [["โหลดที่ติดตั้งรวม", n(connected, 1) + " kW"], ["ความต้องการสูงสุดโดยประมาณ (มีรถ)", n(demand, 1) + " kW"], ["กระแสสูงสุดต่อเฟส (ไม่มีรถ)", n(iNoEv, 1) + " A"],
          ["กระแสสูงสุดต่อเฟส (มีรถ)", "<b>" + n(i, 1) + " A</b>"], ["กระแสของเครื่องชาร์จ", n(evI, 1) + " A (ต่อเนื่องหลายชั่วโมง)"],
          ["มิเตอร์ " + m[0] + " (สูงสุด " + m[1] + " A)", ok(i <= m[1], n(i / m[1] * 100, 0) + " % ของพิกัดสูงสุด")], ["เมนเบรกเกอร์ " + x.main + " A", ok(i <= x.main * 0.95, i <= x.main * 0.95 ? "พอ" : "อาจทริปเมื่อใช้พร้อมกัน")],
          ["เมนเบรกเกอร์ไม่เกินมิเตอร์", ok(x.main <= m[1], x.main + " A ≤ " + m[1] + " A")], ["มิเตอร์ที่แนะนำ", rec + (ph === 1 && x.ev > 7.4 ? " · เครื่อง > 7.4 kW ต้องใช้ 3 เฟส" : "")]],
          note: "ดีมานด์แฟกเตอร์เป็นค่าประมาณ แอร์และรถคิดเต็มพิกัดเพราะทำงานต่อเนื่องพร้อมกันได้ ถ้ากระแสใกล้พิกัด ให้ตั้งวอลล์บ็อกซ์ที่ 16–24 A หรือใช้ระบบจัดการโหลด (dynamic load balancing) แทนการเพิ่มขนาดมิเตอร์ การเปลี่ยนมิเตอร์ต้องยื่นที่การไฟฟ้าในพื้นที่" };
      }
    },
    cable: {
      t: "ขนาดเบรกเกอร์ สายไฟ และแรงดันตก สำหรับวงจรเครื่องชาร์จ", ref: "H6–H9",
      ins: [["i", "กระแสใช้งานของเครื่องชาร์จ", "A", "32"], ["ph", "ระบบ", "sel", "1 เฟส 230 V", ["1 เฟส 230 V", "3 เฟส 400 V"]], ["l", "ความยาวสายจากตู้ (ทางเดียว)", "m", "25"],
        ["cf", "ตัวคูณปรับลด (อุณหภูมิ/จำนวนวงจร)", "", "1.0"], ["lim", "เป้าหมายแรงดันตก", "%", "3"], ["pre", "แรงดันตกที่มีอยู่แล้วต้นทาง", "%", "1"]],
      f: function (x) {
        var three = x.ph === "3 เฟส 400 V", v = three ? 400 : 230, k = three ? Math.sqrt(3) : 2;
        var design = 1.25 * x.i, brk = BREAKERS.filter(function (b) { return b >= design - 1e-9; })[0] || NaN;
        var byAmp = AMPACITY.filter(function (r) { return r[1] * x.cf >= brk; })[0];
        var byDrop = AMPACITY.filter(function (r) { return (k * x.l * x.i * RHO70 / r[0]) / v * 100 <= x.lim - x.pre; })[0];
        var pick = byAmp && byDrop ? (byAmp[0] >= byDrop[0] ? byAmp : byDrop) : null;
        var dv = pick ? k * x.l * x.i * RHO70 / pick[0] : NaN, loss = pick ? (three ? 3 : 2) * x.i * x.i * x.l * RHO70 / pick[0] : NaN;
        return { rows: [["กระแสออกแบบ 1.25 × I (โหลดต่อเนื่อง)", n(design, 1) + " A"], ["เบรกเกอร์ (ขนาดมาตรฐานถัดไป)", brk + " A"],
          ["สายตามความสามารถกระแส ≥ เบรกเกอร์", byAmp ? byAmp[0] + " mm² (" + n(byAmp[1] * x.cf, 0) + " A)" : "> 95 mm²"],
          ["สายตามแรงดันตก ≤ " + n(x.lim - x.pre, 1) + " %", byDrop ? byDrop[0] + " mm²" : "> 95 mm²"],
          ["เลือกใช้", pick ? "<b>" + pick[0] + " mm²</b> ทองแดง" + (three ? " × 4 เส้น + สายดิน" : " × 2 เส้น + สายดิน") : "—"],
          ["แรงดันตกจริง", pick ? n(dv, 2) + " V = " + n(dv / v * 100, 2) + " %" : "—"], ["ความร้อนในสายขณะชาร์จ", pick ? n(loss, 0) + " W (" + n(loss * 6 / 1000, 2) + " kWh ต่อการชาร์จ 6 ชม.)" : "—"]],
          note: "ตารางกระแส: สาย THW แกนเดียวร้อยท่อ 2 เส้นมีกระแส อุณหภูมิแวดล้อม 40 °C (ค่าปัดเพื่อการสอน) ถ้าเดินแบบอื่นหรือหลายวงจรในท่อเดียวให้ใช้ตารางและตัวคูณปรับลดของมาตรฐาน วสท. ฉบับล่าสุด สายดินให้ขนาดตามมาตรฐาน (มักไม่เล็กกว่า 4–6 mm² สำหรับวงจรนี้)" };
      }
    },
    cost: {
      t: "ค่าชาร์จรถที่บ้าน: อัตราปกติ (ก้าวหน้า) กับ TOU และค่าใช้จ่ายต่อกิโลเมตร", ref: "T1–T6",
      ins: [["km", "ระยะทางต่อเดือน", "km", "1500"], ["cons", "อัตราสิ้นเปลือง", "kWh/100 km", "15"], ["eta", "ประสิทธิภาพการชาร์จ", "%", "90"], ["home", "ไฟบ้านเดิมต่อเดือน", "kWh", "400"],
        ["onpk", "ไฟบ้านเดิมที่ใช้ช่วง On-Peak (จ–ศ 09–22 น.)", "%", "55"], ["evoff", "ชาร์จรถช่วง Off-Peak", "%", "100"], ["ft", "ค่า Ft (ตรวจค่างวดปัจจุบัน)", "฿/kWh", "0.1972"],
        ["fuel", "ราคาน้ำมัน", "฿/ลิตร", "35"], ["kml", "รถน้ำมันวิ่งได้", "km/ลิตร", "14"]],
      f: function (x) {
        var ev = x.km * x.cons / 100 / (x.eta / 100);
        var nb0 = billNormal(x.home, x.ft), nb1 = billNormal(x.home + ev, x.ft);
        var on0 = x.home * x.onpk / 100, off0 = x.home - on0, evOn = ev * (1 - x.evoff / 100);
        var tb0 = billTOU(on0, off0, x.ft), tb1 = billTOU(on0 + evOn, off0 + ev - evOn, x.ft);
        var dN = nb1 - nb0, dT = tb1 - nb0, fuel = x.km / x.kml * x.fuel;
        var best = tb1 < nb1 ? "TOU ถูกกว่า " + baht(nb1 - tb1) + "/เดือน" : "อัตราปกติถูกกว่า " + baht(tb1 - nb1) + "/เดือน";
        return { rows: [["พลังงานชาร์จจากมิเตอร์", n(ev, 0) + " kWh/เดือน"], ["—", "อัตราปกติ (ประเภท 1.2)"], ["ค่าไฟเดิม", baht(nb0)], ["ค่าไฟเมื่อมีรถ", baht(nb1)], ["ค่าชาร์จรถเพิ่มขึ้น", baht(dN) + " = " + n(dN / x.km, 2) + " ฿/km"],
          ["—", "อัตรา TOU (ประเภท 1.3.2)"], ["ค่าไฟ TOU ถ้ายังไม่มีรถ", baht(tb0)], ["ค่าไฟ TOU เมื่อมีรถ", baht(tb1)], ["เทียบกับบิลเดิม (อัตราปกติ)", baht(dT) + " = " + n(dT / x.km, 2) + " ฿/km"],
          ["—", "สรุป"], ["มิเตอร์ที่คุ้มกว่า (เมื่อมีรถ)", "<b>" + best + "</b>"], ["รถน้ำมันระยะเท่ากัน", baht(fuel) + " = " + n(fuel / x.km, 2) + " ฿/km"], ["ประหยัดเทียบรถน้ำมัน", baht(fuel - Math.min(dN, dT)) + "/เดือน"]],
          note: "รวม VAT 7 % และค่าบริการรายเดือน ไม่รวมค่าเปลี่ยนมิเตอร์และค่าธรรมเนียม อัตราค่าไฟปี 2568 ของ กฟภ./กฟน. (ไม่รวม Ft) ค่า Ft เปลี่ยนทุก 4 เดือน ตรวจอัตราปัจจุบันจากเว็บไซต์การไฟฟ้าก่อนตัดสินใจ" };
      }
    },
    solar: {
      t: "โซลาร์เซลล์ช่วยชาร์จรถได้เท่าไร", ref: "S1–S5",
      ins: [["kwp", "ขนาดแผง", "kWp", "5"], ["psh", "ชั่วโมงแดดสูงสุด", "h", "4.8"], ["pr", "PR", "%", "78"], ["day", "โหลดบ้านช่วงมีแดด (รวมแอร์กลางวัน)", "kWh/วัน", "9"],
        ["km", "ระยะทางต่อวัน", "km", "40"], ["cons", "อัตราสิ้นเปลือง", "kWh/100 km", "15"], ["eta", "ประสิทธิภาพการชาร์จ", "%", "90"], ["home", "รถจอดที่บ้านกลางวัน", "sel", "บางวัน (2 วัน/สัปดาห์)", ["ทุกวัน", "บางวัน (2 วัน/สัปดาห์)", "ไม่เลย (มีแบตบ้าน)", "ไม่เลย (ไม่มีแบต)"]],
        ["tariff", "ค่าไฟที่แทนได้", "฿/kWh", "4.4"], ["exp", "ราคาขายไฟคืน", "฿/kWh", "2.2"]],
      f: function (x) {
        var pv = x.kwp * x.psh * x.pr / 100, sur = Math.max(0, pv - x.day), need = x.km * x.cons / 100 / (x.eta / 100);
        var f = { "ทุกวัน": 1, "บางวัน (2 วัน/สัปดาห์)": 2 / 7, "ไม่เลย (มีแบตบ้าน)": 0.9, "ไม่เลย (ไม่มีแบต)": 0 }[x.home];
        var toEv = Math.min(sur, need) * f, share = need > 0 ? toEv / need : 0, gain = toEv * (x.tariff - x.exp) * 30;
        return { rows: [["ไฟจากแผงต่อวัน", n(pv, 1) + " kWh"], ["ส่วนเกินหลังจ่ายโหลดบ้าน", n(sur, 1) + " kWh/วัน"], ["รถต้องการ", n(need, 1) + " kWh/วัน"],
          ["ไฟโซลาร์ที่เข้ารถจริง (เฉลี่ย)", n(toEv, 1) + " kWh/วัน"], ["สัดส่วนที่รถใช้ไฟโซลาร์", "<b>" + n(share * 100, 0) + " %</b>"], ["ระยะทางจากแสงอาทิตย์", n(toEv * x.eta / 100 / x.cons * 100, 0) + " km/วัน"],
          ["มูลค่าเพิ่มเทียบการขายไฟคืน", baht(gain) + "/เดือน"]],
          note: "หัวใจคือเวลา: แผงผลิตไฟกลางวัน แต่รถของคนทำงานมักไม่อยู่บ้าน ถ้ารถจอดบ้านกลางวันน้อย การมีแบตเตอรี่บ้าน (สูญเสียเพิ่ม ≈ 10 %) หรือชาร์จ Off-Peak กลางคืนแล้วใช้โซลาร์กับแอร์กลางวันมักคุ้มกว่า ลองในซิมูเลเตอร์พลังงานบ้าน" };
      }
    }
  };

  // ------------------------------------------------------------------ Control Pilot lab
  function buildCP(host) {
    var st = { a: +(host.getAttribute("data-a") || 16), s: host.getAttribute("data-state") || "C", pp: 2, obc: 32 };
    var states = {
      A: ["A", "ยังไม่เสียบสาย", 12, false, "∞", "สถานีจ่าย +12 V ค้างไว้ ยังไม่มีไฟที่หัวชาร์จ"],
      B: ["B", "เสียบแล้ว ยังไม่พร้อม", 9, true, "2.74 kΩ", "รถต่อ R2 2.74 kΩ ผ่านไดโอด แรงดันตกเหลือ 9 V สถานีเริ่มส่ง PWM บอกกระแสสูงสุด"],
      C: ["C", "กำลังชาร์จ", 6, true, "882 Ω (2.74k ∥ 1.3k)", "รถสับ R3 1.3 kΩ ขนานเข้าไป แรงดันเหลือ 6 V สถานีสั่งคอนแทกเตอร์ต่อไฟ"],
      D: ["D", "ชาร์จ + ต้องระบายอากาศ", 3, true, "246 Ω (2.74k ∥ 270)", "สำหรับแบตที่ปล่อยแก๊ส ปัจจุบันแทบไม่ใช้ ที่บ้านมักไม่อนุญาต"],
      E: ["E", "ไฟสถานีดับ / CP ลัดลงดิน", 0, false, "0 Ω", "ผิดพลาด ตัดไฟทันที"],
      F: ["F", "สถานีขัดข้อง", -12, false, "—", "สถานีจ่าย −12 V ค้าง แจ้งความผิดพร่อง"]
    };
    host.innerHTML = '<p class="fc-t"><b>แล็บสัญญาณ Control Pilot (CP) และ Proximity (PP)</b> <span class="mono">สูตร W2–W5</span></p>' +
      '<div class="pv-ctl"><label>กระแสที่สถานีอนุญาต <output data-o="a"></output><input type="range" min="6" max="80" step="1" data-k="a"></label>' +
      '<label>สายชาร์จ (PP) <select data-k="pp">' + PP.map(function (p, i) { return '<option value="' + i + '">' + p[0] + "</option>"; }).join("") + "</select></label>" +
      '<label>OBC ของรถ (ต่อเฟส) <select data-k="obc"><option value="16">16 A</option><option value="32" selected>32 A</option><option value="63">63 A</option></select></label>' +
      '<div class="pv-btns" role="group" aria-label="สถานะ">' + "ABCDEF".split("").map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm" data-s="' + k + '">' + k + " · " + states[k][1] + "</button>"; }).join("") + "</div></div>" +
      '<div class="pv-fig"></div><dl class="fc-out"></dl><p class="pv-note"></p>';
    var q = function (s) { return host.querySelector(s); };
    q('[data-k="a"]').value = st.a; q('[data-k="pp"]').value = st.pp;
    q('[data-k="a"]').addEventListener("input", function () { st.a = +this.value; draw(); });
    q('[data-k="pp"]').addEventListener("change", function () { st.pp = +this.value; draw(); });
    q('[data-k="obc"]').addEventListener("change", function () { st.obc = +this.value; draw(); });
    Array.prototype.forEach.call(host.querySelectorAll("[data-s]"), function (b) { b.addEventListener("click", function () { st.s = b.getAttribute("data-s"); draw(); }); });
    function draw() {
      var S = states[st.s], d = ampToDuty(st.a), hi = S[2], pwm = S[3], pts = [], per = 1, T = 2.5;
      q('[data-o="a"]').textContent = st.a + " A";
      Array.prototype.forEach.call(host.querySelectorAll("[data-s]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-s") === st.s); });
      if (!pwm) pts = [[0, hi], [T, hi]];
      else for (var k = 0; k * per < T; k++) { var t0 = k * per, t1 = Math.min(T, t0 + per * d / 100); pts.push([t0, -12], [t0, hi], [t1, hi]); if (t1 < T) pts.push([t1, -12], [Math.min(T, t0 + per), -12]); }
      var svg = K.chart({ w: 640, h: 230, xs: [0, T], ys: [-14, 14], xt: [0, 0.5, 1, 1.5, 2, 2.5], yt: [-12, -6, 0, 3, 6, 9, 12], xf: function (t) { return t + " ms"; }, xl: "เวลา (ms) · PWM 1 kHz", yl: "แรงดัน CP (V)", label: "สัญญาณ Control Pilot",
        hlines: [{ y: 9, cls: "hl dsh", label: "B 9 V" }, { y: 6, cls: "hl dsh", label: "C 6 V" }, { y: 3, cls: "hl dsh", label: "D 3 V" }],
        series: [{ cls: "s1 thick", pts: pts }] });
      q(".pv-fig").innerHTML = svg;
      var lim = Math.min(st.a, PP[st.pp][1], st.obc), on = st.s === "C" || st.s === "D";
      q(".fc-out").innerHTML = [["สถานะ", S[0] + " · " + S[1]], ["แรงดันยอดบวก", (hi > 0 ? "+" : "") + hi + " V"], ["ตัวต้านทานฝั่งรถ", S[4]], ["duty cycle", pwm ? n(d, 1) + " % (" + n(d * 10, 0) + " µs)" : "ไม่มี PWM"],
        ["กระแสที่อนุญาตจาก PWM", pwm ? n(st.a, 0) + " A" : "—"], ["สายรับได้ (PP " + PP[st.pp][2] + " Ω)", PP[st.pp][1] + " A"], ["กระแสที่รถดึงจริง", on ? "<b>" + lim + " A ≈ " + n(lim * 0.23, 1) + " kW/เฟส</b>" : "0 A (คอนแทกเตอร์เปิด)"]]
        .map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
      q(".pv-note").textContent = S[5] + " · แรงดันวัดได้ = V_d + (12 − V_d)·R/(R + 1 kΩ) โดย V_d ≈ 0.7 V ของไดโอดในรถ";
    }
    draw();
  }

  // ------------------------------------------------------------------ home energy simulator (24 h, 15-min steps)
  var STRATS = ["เสียบทันทีเมื่อถึงบ้าน", "ตั้งเวลา Off-Peak 22:00", "ชาร์จจากโซลาร์ส่วนเกินเท่านั้น", "โซลาร์ก่อน เติม Off-Peak ส่วนที่ขาด"];
  var WEATHER = [["แดดดี", 1], ["มีเมฆบางส่วน", 0.65], ["ฝนตก/ครึ้มทั้งวัน", 0.3]];
  var PRESETS = {
    now: { pv: 0, batt: 0, strat: STRATS[0], home: false, tariff: "TOU", km: 50, kw: 7.4 },
    offpeak: { pv: 0, batt: 0, strat: STRATS[1], home: false, tariff: "TOU", km: 50, kw: 7.4 },
    "solar-commuter": { pv: 5, batt: 0, strat: STRATS[2], home: false, tariff: "TOU", km: 50, kw: 7.4 },
    "wfh-solar": { pv: 5, batt: 0, strat: STRATS[3], home: true, tariff: "TOU", km: 40, kw: 7.4 },
    battery: { pv: 6, batt: 10, strat: STRATS[1], home: false, tariff: "TOU", km: 50, kw: 7.4 },
    "small-meter": { pv: 0, batt: 0, strat: STRATS[0], home: false, tariff: "อัตราปกติ", km: 50, kw: 7.4, brk: 40, acd: 2.0, acdS: 13, acdE: 21 }
  };
  // clear-sky-like PV shape (sin^1.5 between 06:00 and 18:00), normalised to 1 kWh per kWp per peak-sun-hour
  var PVN = (function () { var s = 0; for (var i = 0; i < 96; i++) { var h = (i + 0.5) / 4; if (h > 6 && h < 18) s += Math.pow(Math.sin(Math.PI * (h - 6) / 12), 1.5) * 0.25; } return s; })();
  var pvShape = function (h) { return h > 6 && h < 18 ? Math.pow(Math.sin(Math.PI * (h - 6) / 12), 1.5) / PVN : 0; };
  var inWin = function (h, a, b) { return a <= b ? h >= a && h < b : h >= a || h < b; };

  function simulate(p) {
    var dt = 0.25, N = 96, w = 1;
    WEATHER.forEach(function (x) { if (x[0] === p.weather) w = x[1]; });
    var needDay = p.km * p.cons / 100, eta = p.eta / 100, pmin = 1.38;
    // house load without EV (kW) and PV per step
    var base = [], ac = [], pv = [], sur = [];
    for (var i = 0; i < N; i++) {
      var h = (i + 0.5) / 4, b = p.base + (inWin(h, 6, 8) ? p.morning : 0) + (inWin(h, 18, 22) ? p.evening : 0);
      var sun = pvShape(h);
      var a = (inWin(h, p.acdS, p.acdE) ? p.acd * (0.75 + 0.5 * Math.min(1, sun * PVN)) : 0) + (inWin(h, p.acnS, p.acnE) ? p.acn : 0);
      base.push(b); ac.push(a); pv.push(p.pv * p.psh * (p.pr / 100) * w * sun); sur.push(pv[i] - b - a);
    }
    var homeAt = function (h) { return p.home || !inWin(h, p.dep, p.arr); };
    var expSolar = 0;
    for (i = 0; i < N; i++) { var hh = (i + 0.5) / 4; if (homeAt(hh) && sur[i] >= pmin) expSolar += Math.min(p.kw, sur[i]) * eta * dt; }
    var need = needDay * 0.5, soc = p.batt * 0.5, out = null, arrIdx = Math.round(p.arr * 4) % N;
    for (var day = 0; day < 3; day++) {
      var r = { ev: [], grid: [], bch: [], bdis: [], soc: [], exp: [], imp: [], evE: 0, evNeed: 0, impOn: 0, impOff: 0, expE: 0, pvE: 0, loadE: 0, peak: 0, peakT: 0, unmet: 0, battIn: 0, battOut: 0 };
      for (i = 0; i < N; i++) {
        h = (i + 0.5) / 4;
        if (i === arrIdx) { r.unmet = Math.min(needDay, Math.max(0, need)); need += needDay; r.evNeed += needDay; }
        var home = homeAt(h), off = h >= 22 || h < 9, wd = p.weekend ? false : !off, pe = 0, s = sur[i];
        if (home && need > 1e-6) {
          var cap = Math.min(p.kw, need / (eta * dt));
          if (p.strat === STRATS[0]) pe = cap;
          else if (p.strat === STRATS[1]) pe = off ? cap : 0;
          else {
            if (s >= Math.min(pmin, cap) && !(off && h < 6)) pe = Math.min(cap, Math.max(s, 0));
            if (p.strat === STRATS[3] && off && (h >= 22 || h < p.dep || p.home) && pe === 0) {
              var reserve = p.home ? expSolar : 0;
              if (need > reserve + 1e-6 && !(p.home && h >= 6 && h < 9)) pe = Math.min(cap, (need - reserve) / (eta * dt));
            }
          }
          if (pe > 0 && pe < pmin) pe = need / (eta * dt) < pmin ? pe : pmin;
        }
        need -= pe * eta * dt; r.evE += pe * dt;
        var net = pv[i] - base[i] - ac[i] - pe, bch = 0, bdis = 0; // >0 surplus
        if (p.batt > 0) {
          if (net > 0) { bch = Math.min(net, p.bkw, (p.batt * 0.95 - soc) / (0.95 * dt)); bch = Math.max(0, bch); soc += bch * 0.95 * dt; net -= bch; }
          else {
            var houseDef = Math.min(-net, base[i] + ac[i] - Math.min(pv[i], base[i] + ac[i]));
            if (!(p.tariff === "TOU" && off && !p.dischOff)) { bdis = Math.min(houseDef, p.bkw, (soc - p.batt * 0.1) * 0.95 / dt); bdis = Math.max(0, bdis); soc -= bdis / 0.95 * dt; net += bdis; }
          }
        }
        var imp = Math.max(0, -net), ex = Math.max(0, net);
        r.ev.push(pe); r.bch.push(bch); r.bdis.push(bdis); r.soc.push(p.batt > 0 ? soc / p.batt * 100 : 0); r.imp.push(imp); r.exp.push(ex); r.grid.push(imp - ex);
        if (p.tariff === "TOU" && !wd) r.impOff += imp * dt; else if (p.tariff === "TOU") r.impOn += imp * dt; else r.impOn += imp * dt;
        r.expE += ex * dt; r.pvE += pv[i] * dt; r.loadE += (base[i] + ac[i] + pe) * dt; r.battIn += bch * dt; r.battOut += bdis * dt;
        if (imp > r.peak) { r.peak = imp; r.peakT = h; }
      }
      out = r;
    }
    out.base = base; out.ac = ac; out.pv = pv; out.baseE = base.reduce(function (a, v) { return a + v * dt; }, 0); out.acE = ac.reduce(function (a, v) { return a + v * dt; }, 0);
    var rate = p.tariff === "TOU" ? null : p.flat;
    out.costImp = rate ? (out.impOn + out.impOff) * rate : out.impOn * TARIFF.touOn * 1.07 + out.impOff * TARIFF.touOff * 1.07 + (out.impOn + out.impOff) * TARIFF.ft * 1.07;
    out.credit = out.expE * p.expPrice; out.cost = out.costImp - out.credit;
    out.selfUse = out.pvE > 0 ? (out.pvE - out.expE) / out.pvE : 0;
    out.selfSuff = out.loadE > 0 ? Math.max(0, 1 - (out.impOn + out.impOff) / out.loadE) : 0;
    return out;
  }

  function buildSim(host) {
    var F = [
      ["pv", "แผงโซลาร์", "kWp", 5], ["psh", "ชั่วโมงแดดสูงสุด", "h", 4.8], ["pr", "PR", "%", 78], ["weather", "อากาศวันนี้", "sel", "แดดดี", WEATHER.map(function (w) { return w[0]; })],
      ["base", "โหลดพื้นฐาน (ตู้เย็น ไฟ ปั๊มน้ำ)", "kW", 0.35], ["morning", "เพิ่มช่วงเช้า 06–08 (น้ำอุ่น ครัว)", "kW", 1.2], ["evening", "เพิ่มช่วงเย็น 18–22 (ครัว ทีวี น้ำอุ่น)", "kW", 1.0],
      ["acd", "แอร์กลางวัน กำลังเฉลี่ย", "kW", 1.0], ["acdS", "แอร์กลางวัน เปิด", "น.", 12], ["acdE", "แอร์กลางวัน ปิด", "น.", 17],
      ["acn", "แอร์ห้องนอน กำลังเฉลี่ย", "kW", 0.5], ["acnS", "แอร์ห้องนอน เปิด", "น.", 21], ["acnE", "แอร์ห้องนอน ปิด", "น.", 6],
      ["km", "รถวิ่งต่อวัน", "km", 50], ["cons", "อัตราสิ้นเปลือง", "kWh/100 km", 15], ["kw", "เครื่องชาร์จ", "kW", 7.4], ["eta", "ประสิทธิภาพชาร์จ", "%", 90],
      ["dep", "รถออกจากบ้าน", "น.", 7.5], ["arr", "รถกลับถึงบ้าน", "น.", 18], ["home", "รถจอดบ้านทั้งวัน (WFH/วันหยุด)", "chk", false], ["strat", "วิธีชาร์จ", "sel", STRATS[0], STRATS],
      ["batt", "แบตเตอรี่บ้าน", "kWh", 0], ["bkw", "กำลังแบตเตอรี่", "kW", 5], ["dischOff", "ให้แบตจ่ายช่วง Off-Peak ด้วย", "chk", false],
      ["tariff", "อัตราค่าไฟ", "sel", "TOU", ["อัตราปกติ", "TOU"]], ["flat", "อัตราปกติเฉลี่ย (รวม Ft VAT)", "฿/kWh", 4.4], ["expPrice", "ขายไฟคืน", "฿/kWh", 2.2],
      ["weekend", "เป็นวันหยุด (TOU ทั้งวันเป็น Off-Peak)", "chk", false], ["brk", "เมนเบรกเกอร์ (1 เฟส)", "A", 50]
    ];
    var groups = [["☀ โซลาร์", 0, 4], ["🏠 โหลดบ้าน", 4, 7], ["❄ แอร์", 7, 13], ["🔌 รถ EV", 13, 21], ["🔋 แบตเตอรี่บ้าน", 21, 24], ["฿ ค่าไฟ · ไฟบ้าน", 24, 29]];
    var html = '<p class="fc-t"><b>ซิมูเลเตอร์พลังงานบ้าน 24 ชั่วโมง: โซลาร์ + แอร์ + รถ EV + แบตเตอรี่</b> <span class="mono">สูตร S1–S8 · ทุก 15 นาที</span></p>' +
      '<div class="pv-btns ev-pre" role="group" aria-label="สถานการณ์ตัวอย่าง"><span class="mono">สถานการณ์:</span>' +
      [["now", "ชาร์จทันทีเมื่อกลับบ้าน"], ["offpeak", "ตั้งเวลา Off-Peak"], ["solar-commuter", "โซลาร์ แต่รถไม่อยู่บ้าน"], ["wfh-solar", "WFH ชาร์จจากโซลาร์"], ["battery", "โซลาร์ + แบตบ้าน"], ["small-meter", "มิเตอร์เล็ก แอร์เยอะ"]]
        .map(function (b) { return '<button type="button" class="btn btn-ghost btn-sm" data-p="' + b[0] + '">' + b[1] + "</button>"; }).join("") + "</div>" +
      '<div class="ev-sim-body"><div class="ev-sim-in">' + groups.map(function (g) {
        return '<details class="ev-grp"' + (g[1] < 4 || (g[1] >= 13 && g[1] < 21) ? " open" : "") + "><summary>" + g[0] + '</summary><div class="fc-in">' + F.slice(g[1], g[2]).map(function (d) {
          var id = K.uid("evs");
          if (d[2] === "chk") return '<label class="ev-cb" for="' + id + '"><input type="checkbox" id="' + id + '" data-k="' + d[0] + '"' + (d[3] ? " checked" : "") + "><span>" + d[1] + "</span></label>";
          if (d[2] === "sel") return '<label for="' + id + '"><span>' + d[1] + '</span><select id="' + id + '" data-k="' + d[0] + '">' + d[4].map(function (o) { return "<option" + (o === d[3] ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select></label>";
          return '<label for="' + id + '"><span>' + d[1] + '</span><input id="' + id + '" type="text" inputmode="decimal" data-k="' + d[0] + '" value="' + d[3] + '"><i>' + d[2] + "</i></label>";
        }).join("") + "</div></details>";
      }).join("") + '</div><div class="ev-sim-out"><div class="pv-fig"></div><dl class="fc-out"></dl><p class="pv-note"></p></div></div>';
    host.innerHTML = html;
    var q = function (s) { return host.querySelector(s); }, els = {};
    F.forEach(function (d) { els[d[0]] = q('[data-k="' + d[0] + '"]'); els[d[0]].addEventListener(d[2] === "chk" || d[2] === "sel" ? "change" : "input", run); });
    function setVals(v) { Object.keys(v).forEach(function (k) { if (!els[k]) return; if (els[k].type === "checkbox") els[k].checked = !!v[k]; else els[k].value = v[k]; }); run(); }
    function reset() { F.forEach(function (d) { if (d[2] === "chk") els[d[0]].checked = d[3]; else els[d[0]].value = d[3]; }); }
    Array.prototype.forEach.call(host.querySelectorAll("[data-p]"), function (b) { b.addEventListener("click", function () { reset(); setVals(PRESETS[b.getAttribute("data-p")]); }); });
    host._preset = function (name) { if (PRESETS[name]) { reset(); setVals(PRESETS[name]); } };
    function run() {
      var p = {}, bad = false;
      F.forEach(function (d) { var e = els[d[0]]; if (d[2] === "chk") p[d[0]] = e.checked; else if (d[2] === "sel") p[d[0]] = e.value; else { p[d[0]] = K.parse(e.value); if (!isFinite(p[d[0]])) bad = true; } });
      if (bad) { q(".fc-out").innerHTML = "<dt>ใส่ตัวเลขให้ครบ</dt><dd>—</dd>"; return; }
      var r = simulate(p), xs = [], i;
      for (i = 0; i < 96; i++) xs.push(i / 4);
      var stack = function (arrs) { var acc = xs.map(function () { return 0; }), out = []; arrs.forEach(function (a) { var prev = acc.slice(); acc = acc.map(function (v, k) { return v + a[k]; }); out.push({ top: acc.slice(), bot: prev }); }); return out; };
      var st = stack([r.base, r.ac, r.ev, r.bch]);
      var step = function (arr) { var o = []; arr.forEach(function (v, k) { o.push([xs[k], v], [xs[k] + 0.25, v]); }); return o; };
      var ymax = 0; for (i = 0; i < 96; i++) ymax = Math.max(ymax, st[3].top[i], r.pv[i], r.imp[i]);
      var tk = K.niceTicks(Math.max(1, ymax * 1.05), 5);
      var series = [["ee-a1", 0], ["ee-a2", 1], ["ee-a3", 2], ["ee-a4", 3]].map(function (c) { return { area: true, cls: c[0], pts: step(st[c[1]].top), base: step(st[c[1]].bot) }; });
      series.push({ cls: "s5 thick", pts: step(r.pv) }, { cls: "s6 dsh2", pts: step(r.imp) });
      var opts = { w: 680, h: 320, xs: [0, 24], ys: [0, tk.top], xt: [0, 3, 6, 9, 12, 15, 18, 21, 24], yt: tk.ticks, xf: function (t) { return (t < 10 ? "0" : "") + t + ":00"; }, xl: "เวลา", yl: "กำลัง (kW)", label: "กำลังไฟฟ้าในบ้านตลอดวัน",
        series: series, legend: [["ee-a1", "โหลดพื้นฐาน"], ["ee-a2", "แอร์"], ["ee-a3", "ชาร์จรถ"], ["ee-a4", "ชาร์จแบตบ้าน"], ["f5", "โซลาร์"], ["f6", "ซื้อจากกริด"]],
        hlines: [{ y: p.brk * 0.23, cls: "hl red", label: "เมนเบรกเกอร์ " + p.brk + " A" }].filter(function (h) { return h.y <= tk.top; }) };
      if (p.tariff === "TOU" && !p.weekend) opts.vlines = [{ x: 9, cls: "hl dsh", label: "On-Peak" }, { x: 22, cls: "hl dsh", label: "Off-Peak" }];
      if (p.batt > 0) { opts.y2s = [0, 100]; opts.y2t = [0, 50, 100]; opts.y2l = "SOC แบตบ้าน (%)"; opts.series.push({ cls: "s7", axis: 2, pts: r.soc.map(function (v, k) { return [xs[k] + 0.25, v]; }) }); opts.legend.push(["f7", "SOC"]); }
      q(".pv-fig").innerHTML = K.chart(opts);
      var imp = r.impOn + r.impOff, peakA = r.peak * 1000 / 230;
      var rows = [["ไฟจากโซลาร์", n(r.pvE, 1) + " kWh"], ["โหลดพื้นฐาน + แอร์", n(r.baseE, 1) + " + " + n(r.acE, 1) + " kWh"], ["ชาร์จรถ (จากผนัง)", n(r.evE, 1) + " kWh"],
        ["ซื้อจากกริด", n(imp, 1) + " kWh" + (p.tariff === "TOU" ? " (On " + n(r.impOn, 1) + " · Off " + n(r.impOff, 1) + ")" : "")], ["ขายคืนกริด", n(r.expE, 1) + " kWh"],
        ["ใช้ไฟโซลาร์เอง (self-consumption)", r.pvE > 0 ? n(r.selfUse * 100, 0) + " %" : "—"], ["พึ่งตนเองได้ (self-sufficiency)", n(r.selfSuff * 100, 0) + " %"],
        ["ค่าไฟสุทธิวันนี้", baht(r.cost) + " ≈ " + baht(r.cost * 30) + "/เดือน"], ["รถได้รับพลังงานครบ", r.unmet > 0.05 ? warn("ขาด " + n(r.unmet, 1) + " kWh — วิ่งได้น้อยลง " + n(r.unmet / p.cons * 100, 0) + " km") : ok(true, "ครบ " + n(p.km * p.cons / 100, 1) + " kWh")],
        ["กระแสซื้อสูงสุด", (peakA > p.brk ? warn(n(peakA, 0) + " A เวลา " + clock(r.peakT) + " — เกินเมนเบรกเกอร์") : ok(true, n(peakA, 0) + " A เวลา " + clock(r.peakT)))]];
      if (p.batt > 0) rows.splice(5, 0, ["แบตบ้าน ชาร์จ/จ่าย", n(r.battIn, 1) + " / " + n(r.battOut, 1) + " kWh"]);
      q(".fc-out").innerHTML = rows.map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
      var tip = [];
      if (r.unmet > 0.05 && p.strat === STRATS[2]) tip.push("รถไม่อยู่บ้านตอนมีแดด จึงชาร์จจากโซลาร์ไม่ได้ เลือก “โซลาร์ก่อน เติม Off-Peak” หรือเพิ่มวันที่จอดบ้าน");
      if (peakA > p.brk) tip.push("ลดกระแสวอลล์บ็อกซ์ ตั้งเวลาให้ไม่ชนกับแอร์และน้ำอุ่น หรือใช้ dynamic load balancing");
      if (r.pvE > 0 && r.selfUse < 0.6) tip.push("ไฟโซลาร์ถูกขายคืนมาก ลองย้ายโหลด (แอร์ pre-cooling ซักผ้า ชาร์จรถ) มาไว้ช่วงกลางวัน");
      q(".pv-note").textContent = tip.length ? "ข้อสังเกต: " + tip.join(" · ") : "จำลองวันที่สามหลังเริ่ม (สภาวะคงตัว) รถรับพลังงานเท่ากับที่วิ่งไปแต่ละวัน ค่าไฟ TOU คิด VAT และ Ft แล้ว ไม่รวมค่าบริการรายเดือน";
    }
    var pre = host.getAttribute("data-preset");
    if (pre && PRESETS[pre]) setVals(PRESETS[pre]); else run();
  }

  K.calcs("data-ev", CALC, "ev");
  K.onReady(function () {
    Array.prototype.forEach.call(document.querySelectorAll(".ev-cp"), buildCP);
    Array.prototype.forEach.call(document.querySelectorAll(".ev-sim"), buildSim);
    Array.prototype.forEach.call(document.querySelectorAll("button[data-ev-preset]"), function (b) {
      b.addEventListener("click", function () { var s = document.querySelector(".ev-sim"); if (s && s._preset) { s._preset(b.getAttribute("data-ev-preset")); s.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    });
  });
  var api = { CALC: CALC, TARIFF: TARIFF, AMPACITY: AMPACITY, chargeProfile: chargeProfile, billNormal: billNormal, billTOU: billTOU, dutyToAmp: dutyToAmp, ampToDuty: ampToDuty, simulate: simulate, STRATS: STRATS, PRESETS: PRESETS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EVCalc = api;
})(typeof window !== "undefined" ? window : globalThis);
