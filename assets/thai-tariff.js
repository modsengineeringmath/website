/* Thai retail electricity tariff — the ONLY file to edit when rates change (used by /tools/electricity-bill-calculator/).

   HOW TO UPDATE (every 4 months when the ERC announces a new Ft, and whenever the tariff schedule changes)
   1. Ft: change `ft` (baht per unit = satang ÷ 100) and the two `ftPeriod` texts. Source: https://www.erc.or.th/th/automatic/
   2. Rates: change the numbers below. Sources: PEA "อัตราค่าไฟฟ้า" PDF (pea.co.th) and MEA "อัตราค่าไฟฟ้าประเภทต่าง ๆ" (mea.or.th).
   3. Change `checked` to the date you compared the numbers with the official tables, then `node build.mjs`, `node scripts/test-tools.mjs`, commit, push.

   Numbers below: PEA tariff schedule for bills from September 2026 (residential blocks restructured: first 200 units at 3.0000 baht)
   and MEA service-rate pages, compared on 2026-11-10. All rates exclude VAT. MEA and PEA charge the same rates; only the
   category numbering (MEA 1.1/1.2/1.3 = PEA 1.1.1/1.1.2/1.2) and the voltage bands (MEA 12–24 kV / PEA 22–33 kV) differ.

   Voltage keys: hv = 69 kV and above · mv = 12–24 kV (MEA) or 22–33 kV (PEA) · lv = below 12 kV (MEA) or below 22 kV (PEA)
   Category kinds:
     block  energy in blocks [[upTo, rate], …]                      flat   one energy rate
     tou    On-Peak / Off-Peak energy                               dem    demand (baht/kW) + one energy rate
     toud   demand at On-Peak + On-Peak / Off-Peak energy           tod    Peak / Partial demand + one energy rate */
(function (root) {
  "use strict";
  var INF = Infinity;
  var TOUD = { hv: { d: 74.14, on: 4.1025, off: 2.5849, service: 312.24 }, mv: { d: 132.93, on: 4.1839, off: 2.6037, service: 312.24 }, lv: { d: 210.00, on: 4.3297, off: 2.6369, service: 312.24 } };
  var T = {
    checked: "2026-11-10",
    effective: { th: "ค่าไฟฟ้าประจำเดือนกันยายน 2569 เป็นต้นไป", en: "bills from September 2026" },
    ft: 0.1623,
    ftPeriod: { th: "ก.ย.–ธ.ค. 2569", en: "Sep–Dec 2026" },
    vat: 0.07,
    pfRate: 56.07,        // baht per kvar above the limit
    pfLimit: 0.6197,      // kvar allowed = 61.97 % of the maximum kW demand (power factor 0.85)
    minDemandShare: 0.70, // minimum charge = 70 % of the highest demand charge in the last 12 months
    transformerLoss: 0.02,
    freeUnits: 50,
    volt: {
      mea: { hv: "69 kV ขึ้นไป|69 kV and above", mv: "12–24 kV", lv: "ต่ำกว่า 12 kV|below 12 kV" },
      pea: { hv: "69 kV ขึ้นไป|69 kV and above", mv: "22–33 kV", lv: "ต่ำกว่า 22 kV|below 22 kV" }
    },
    cats: [
      { id: "1.1", pea: "1.1.1", group: 1, kind: "block", th: "บ้านอยู่อาศัย ใช้ไม่เกิน 150 หน่วย/เดือน (มิเตอร์ไม่เกิน 5 A)", en: "Residential, up to 150 units/month (meter up to 5 A)",
        lv: { blocks: [[15, 2.3488], [25, 2.9882], [200, 3.0000], [400, 4.1584], [INF, 4.3583]], service: 8.19 }, free: true },
      { id: "1.2", pea: "1.1.2", group: 1, kind: "block", th: "บ้านอยู่อาศัย ใช้เกิน 150 หน่วย/เดือน (มิเตอร์เกิน 5 A)", en: "Residential, over 150 units/month (meter above 5 A)",
        lv: { blocks: [[200, 3.0000], [400, 4.1584], [INF, 4.3583]], service: 24.62 } },
      { id: "1.3", pea: "1.2", group: 1, kind: "tou", th: "บ้านอยู่อาศัย อัตรา TOU", en: "Residential, Time of Use (TOU)",
        mv: { on: 5.1135, off: 2.6037, service: 312.24 }, lv: { on: 5.7982, off: 2.6369, service: 24.62 } },
      { id: "2.1", group: 2, kind: "block", th: "กิจการขนาดเล็ก อัตราปกติ (ต่ำกว่า 30 kW)", en: "Small general service, normal rate (below 30 kW)",
        mv: { blocks: [[INF, 3.9086]], service: 312.24 }, lv: { blocks: [[150, 3.2484], [400, 4.2218], [INF, 4.4217]], service: 33.29 } },
      { id: "2.2", group: 2, kind: "tou", th: "กิจการขนาดเล็ก อัตรา TOU", en: "Small general service, TOU",
        mv: { on: 5.1135, off: 2.6037, service: 312.24 }, lv: { on: 5.7982, off: 2.6369, service: 33.29 } },
      { id: "3.1", group: 3, kind: "dem", th: "กิจการขนาดกลาง อัตราปกติ (30–999 kW)", en: "Medium general service, normal rate (30–999 kW)",
        hv: { d: 175.70, e: 3.1097, service: 312.24 }, mv: { d: 196.26, e: 3.1471, service: 312.24 }, lv: { d: 221.50, e: 3.1751, service: 312.24 } },
      { id: "3.2", group: 3, kind: "toud", th: "กิจการขนาดกลาง อัตรา TOU", en: "Medium general service, TOU", hv: TOUD.hv, mv: TOUD.mv, lv: TOUD.lv },
      { id: "4.1", group: 4, kind: "tod", th: "กิจการขนาดใหญ่ อัตรา TOD (ตั้งแต่ 1,000 kW)", en: "Large general service, Time of Day (TOD, 1,000 kW and above)",
        hv: { dp: 224.30, dpp: 29.91, e: 3.1097, service: 312.24 }, mv: { dp: 285.05, dpp: 58.88, e: 3.1471, service: 312.24 }, lv: { dp: 332.71, dpp: 68.22, e: 3.1751, service: 312.24 } },
      { id: "4.2", group: 4, kind: "toud", th: "กิจการขนาดใหญ่ อัตรา TOU", en: "Large general service, TOU", hv: TOUD.hv, mv: TOUD.mv, lv: TOUD.lv },
      { id: "5.1", group: 5, kind: "toud", th: "กิจการเฉพาะอย่าง (โรงแรม ที่พักให้เช่า) อัตรา TOU", en: "Specific business (hotels, rental accommodation), TOU", hv: TOUD.hv, mv: TOUD.mv, lv: TOUD.lv },
      { id: "5.2", group: 5, kind: "dem", th: "กิจการเฉพาะอย่าง อัตราสำหรับผู้ที่ยังไม่ติดมิเตอร์ TOU", en: "Specific business, rate for customers without a TOU meter",
        hv: { d: 220.56, e: 3.1097, service: 312.24 }, mv: { d: 256.07, e: 3.1471, service: 312.24 }, lv: { d: 276.64, e: 3.1751, service: 312.24 } },
      { id: "6.1", group: 6, kind: "block", th: "องค์กรที่ไม่แสวงหากำไร อัตราปกติ", en: "Non-profit organisation, normal rate",
        hv: { blocks: [[INF, 3.4149]], service: 312.24 }, mv: { blocks: [[INF, 3.5849]], service: 312.24 }, lv: { blocks: [[10, 2.8013], [INF, 3.8919]], service: 20.00 } },
      { id: "6.2", group: 6, kind: "toud", th: "องค์กรที่ไม่แสวงหากำไร อัตรา TOU", en: "Non-profit organisation, TOU", hv: TOUD.hv, mv: TOUD.mv, lv: TOUD.lv },
      { id: "7.1", group: 7, kind: "block", th: "สูบน้ำเพื่อการเกษตร อัตราปกติ", en: "Agricultural pumping, normal rate",
        lv: { blocks: [[100, 2.0889], [INF, 3.2405]], service: 115.16 } },
      { id: "7.2", group: 7, kind: "toud", th: "สูบน้ำเพื่อการเกษตร อัตรา TOU", en: "Agricultural pumping, TOU",
        mv: { d: 132.93, on: 4.1839, off: 2.6037, service: 204.07 }, lv: { d: 210.00, on: 4.3297, off: 2.6369, service: 204.07 } },
      { id: "8", group: 8, kind: "block", th: "ไฟฟ้าชั่วคราว (งานก่อสร้าง งานชั่วคราว)", en: "Temporary supply (construction sites, temporary events)",
        lv: { blocks: [[INF, 6.8025]], service: 0 } }
    ]
  };

  /* bill(o) → { lines: [{ key, label parts, amount }], base, ft, vat, total, units, perUnit }
     o: { cat, volt, units | on + off, kw, kwPeak, kwPartial, kvar, ft, loss, free, minDemand } */
  T.bill = function (o) {
    var c = T.cats.find(function (x) { return x.id === o.cat; });
    if (!c) throw new Error("category");
    var r = c[o.volt] || c.lv || c.mv || c.hv, lines = [], loss = o.loss ? 1 + T.transformerLoss : 1;
    var num = function (x) { x = +x; return isFinite(x) && x > 0 ? x : 0; };
    var units = 0, energy = 0, demand = 0, pf = 0, kwBill = 0;
    if (c.kind === "block") {
      units = num(o.units);
      if (c.free && o.free && units <= T.freeUnits) return { lines: [{ key: "free", amount: 0 }], base: 0, ftAmount: 0, vat: 0, total: 0, units: units, perUnit: 0, free: true, cat: c, rate: r };
      var prev = 0, left = units;
      r.blocks.forEach(function (b) {
        var size = Math.min(left, b[0] - prev);
        if (size > 0) { lines.push({ key: "block", from: prev + 1, to: b[0], units: size, rate: b[1], amount: size * b[1], single: r.blocks.length === 1 }); energy += size * b[1]; left -= size; }
        prev = b[0];
      });
    } else if (c.kind === "tou" || c.kind === "toud") {
      var on = num(o.on) * loss, off = num(o.off) * loss;
      units = on + off;
      lines.push({ key: "on", units: on, rate: r.on, amount: on * r.on });
      lines.push({ key: "off", units: off, rate: r.off, amount: off * r.off });
      energy = on * r.on + off * r.off;
      if (c.kind === "toud") { kwBill = num(o.kw) * loss; demand = kwBill * r.d; lines.push({ key: "demand", kw: kwBill, rate: r.d, amount: demand }); }
    } else if (c.kind === "dem") {
      units = num(o.units) * loss; energy = units * r.e; kwBill = num(o.kw) * loss; demand = kwBill * r.d;
      lines.push({ key: "demand", kw: kwBill, rate: r.d, amount: demand });
      lines.push({ key: "energy", units: units, rate: r.e, amount: energy });
    } else if (c.kind === "tod") {
      units = num(o.units) * loss; energy = units * r.e;
      var kp = num(o.kwPeak) * loss, kpp = Math.max(0, num(o.kwPartial) * loss - kp);
      kwBill = Math.max(kp, num(o.kwPartial) * loss);
      lines.push({ key: "dpeak", kw: kp, rate: r.dp, amount: kp * r.dp });
      lines.push({ key: "dpartial", kw: kpp, rate: r.dpp, amount: kpp * r.dpp });
      demand = kp * r.dp + kpp * r.dpp;
      lines.push({ key: "energy", units: units, rate: r.e, amount: energy });
    }
    var hasDemand = c.kind === "dem" || c.kind === "toud" || c.kind === "tod";
    if (hasDemand && num(o.minDemand) > 0) {
      var floor = T.minDemandShare * num(o.minDemand);
      if (demand < floor) { lines.push({ key: "mindemand", amount: floor - demand, floor: floor }); demand = floor; }
    }
    if (hasDemand && num(o.kvar) > 0) {
      var kwMax = c.kind === "tod" ? Math.max(num(o.kwPeak), num(o.kwPartial), num(o.kwOff)) : Math.max(num(o.kw), num(o.kwMax));
      var excess = num(o.kvar) - T.pfLimit * kwMax, billed = excess > 0 ? Math.floor(excess + 0.5) : 0;
      pf = billed * T.pfRate;
      lines.push({ key: "pf", kvar: billed, allowed: T.pfLimit * kwMax, rate: T.pfRate, amount: pf });
    }
    lines.push({ key: "service", amount: r.service });
    var base = energy + demand + pf + r.service, ftRate = o.ft == null || o.ft === "" || !isFinite(+o.ft) ? T.ft : +o.ft, ftAmount = units * ftRate;
    var vat = (base + ftAmount) * T.vat, total = base + ftAmount + vat;
    return { lines: lines, energy: energy, demand: demand, pf: pf, service: r.service, base: base, ftRate: ftRate, ftAmount: ftAmount, vat: vat, total: total, units: units, perUnit: units > 0 ? total / units : 0, cat: c, rate: r };
  };

  if (typeof module !== "undefined" && module.exports) module.exports = T; else root.THAI_TARIFF = T;
})(typeof self !== "undefined" ? self : this);
