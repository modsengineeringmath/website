/* Typical component data for the buck design lab (window.BuckParts). Values are rounded "typical datasheet class" numbers for teaching —
   a part number with "class" means a family with similar ratings, not a specific product. Always read the real datasheet before building.
   Diode: Vf0 + Rd·i is a straight-line fit of the forward curve in the working range; Qrr in coulombs (Schottky ≈ 0, junction capacitance only).
   Inductor: Isat = current where L has dropped 30 %, sat = "hard" (ferrite, falls off a cliff) | "soft" (powder core, slides down) | "none" (air).
   Capacitor: C is the effective value at working bias; rC is ESR at ~100 kHz; Irms is the ripple rating. */
(function (root) {
  "use strict";
  var diodes = [
    { id: "sch1a40", name: "Schottky 1 A / 40 V (คลาส 1N5819)", If: 1, Vrrm: 40, Vf: 0.28, Rd: 0.22, Qrr: 0, kind: "schottky" },
    { id: "sch3a40", name: "Schottky 3 A / 40 V (คลาส SS34)", If: 3, Vrrm: 40, Vf: 0.30, Rd: 0.07, Qrr: 0, kind: "schottky" },
    { id: "sch5a60", name: "Schottky 5 A / 60 V (คลาส SB560)", If: 5, Vrrm: 60, Vf: 0.35, Rd: 0.05, Qrr: 0, kind: "schottky" },
    { id: "sch10a45", name: "Schottky 10 A / 45 V (คลาส MBR1045)", If: 10, Vrrm: 45, Vf: 0.35, Rd: 0.025, Qrr: 0, kind: "schottky" },
    { id: "sch10a100", name: "Schottky 10 A / 100 V (คลาส MBR10100)", If: 10, Vrrm: 100, Vf: 0.50, Rd: 0.03, Qrr: 0, kind: "schottky" },
    { id: "uf1a1000", name: "Ultrafast 1 A / 1000 V (คลาส UF4007)", If: 1, Vrrm: 1000, Vf: 0.85, Rd: 0.40, Qrr: 25e-9, kind: "fast" },
    { id: "uf4a600", name: "Ultrafast 4 A / 600 V (คลาส MUR460)", If: 4, Vrrm: 600, Vf: 0.70, Rd: 0.14, Qrr: 40e-9, kind: "fast" },
    { id: "sic4a650", name: "SiC Schottky 4 A / 650 V", If: 4, Vrrm: 650, Vf: 0.95, Rd: 0.18, Qrr: 8e-9, kind: "sic" },
    { id: "si1n4007", name: "ซิลิคอนทั่วไป 1 A / 1000 V (คลาส 1N4007) — ช้าเกินไป", If: 1, Vrrm: 1000, Vf: 0.70, Rd: 0.10, Qrr: 1.5e-6, kind: "slow" },
    { id: "sync", name: "ไม่ใช้ไดโอด: MOSFET ตัวล่าง (synchronous)", If: 99, Vrrm: 999, Vf: 0, Rd: 0, Qrr: 0, kind: "sync" }
  ];
  var inductors = [
    { id: "fd10", name: "ฟอร์ไรต์ drum 10 µH · 4.5 A", L: 10e-6, rL: 0.025, Isat: 4.5, Irms: 4.0, sat: "hard" },
    { id: "fd22", name: "ฟอร์ไรต์ drum 22 µH · 3.2 A", L: 22e-6, rL: 0.045, Isat: 3.2, Irms: 3.0, sat: "hard" },
    { id: "fd47", name: "ฟอร์ไรต์ drum 47 µH · 2.2 A", L: 47e-6, rL: 0.095, Isat: 2.2, Irms: 2.0, sat: "hard" },
    { id: "fd100", name: "ฟอร์ไรต์ drum 100 µH · 1.6 A", L: 100e-6, rL: 0.19, Isat: 1.6, Irms: 1.5, sat: "hard" },
    { id: "fd220", name: "ฟอร์ไรต์ drum 220 µH · 1.0 A", L: 220e-6, rL: 0.42, Isat: 1.0, Irms: 0.9, sat: "hard" },
    { id: "fd470", name: "ฟอร์ไรต์ drum 470 µH · 0.6 A", L: 470e-6, rL: 1.1, Isat: 0.6, Irms: 0.55, sat: "hard" },
    { id: "mp4u7", name: "Molded powder (shielded) 4.7 µH · 12 A", L: 4.7e-6, rL: 0.007, Isat: 12, Irms: 11, sat: "soft" },
    { id: "mp10", name: "Molded powder (shielded) 10 µH · 9 A", L: 10e-6, rL: 0.012, Isat: 9, Irms: 8, sat: "soft" },
    { id: "mp22", name: "Molded powder (shielded) 22 µH · 6.5 A", L: 22e-6, rL: 0.022, Isat: 6.5, Irms: 6, sat: "soft" },
    { id: "mp47", name: "Molded powder (shielded) 47 µH · 4 A", L: 47e-6, rL: 0.045, Isat: 4, Irms: 3.8, sat: "soft" },
    { id: "mp100", name: "Molded powder (shielded) 100 µH · 2.9 A", L: 100e-6, rL: 0.085, Isat: 2.9, Irms: 2.7, sat: "soft" },
    { id: "tp68", name: "โทรอยด์ผงเหล็ก/Kool Mu พันเอง 68 µH · 6 A", L: 68e-6, rL: 0.020, Isat: 6, Irms: 6, sat: "soft" },
    { id: "tp150", name: "โทรอยด์ผงเหล็ก/Kool Mu พันเอง 150 µH · 4 A", L: 150e-6, rL: 0.035, Isat: 4, Irms: 4, sat: "soft" },
    { id: "mp33", name: "Molded powder (shielded) 33 µH · 8 A", L: 33e-6, rL: 0.018, Isat: 8, Irms: 7.5, sat: "soft" },
    { id: "tp47h", name: "โทรอยด์ผงเหล็ก/Kool Mu พันเอง 47 µH · 10 A", L: 47e-6, rL: 0.012, Isat: 10, Irms: 10, sat: "soft" },
    { id: "tp100h", name: "โทรอยด์ผงเหล็ก/Kool Mu พันเอง 100 µH · 8 A", L: 100e-6, rL: 0.025, Isat: 8, Irms: 8, sat: "soft" },
    { id: "tp220h", name: "โทรอยด์ผงเหล็ก/Kool Mu พันเอง 220 µH · 6 A", L: 220e-6, rL: 0.05, Isat: 6, Irms: 6, sat: "soft" },
    { id: "ec100", name: "ฟอร์ไรต์ E-core มีช่องอากาศ 100 µH · 8 A", L: 100e-6, rL: 0.02, Isat: 8, Irms: 8, sat: "hard" },
    { id: "tp330", name: "โทรอยด์ผงเหล็ก/Kool Mu พันเอง 330 µH · 3 A", L: 330e-6, rL: 0.080, Isat: 3, Irms: 3, sat: "soft" },
    { id: "ec220", name: "ฟอร์ไรต์ E-core มีช่องอากาศ 220 µH · 5 A", L: 220e-6, rL: 0.045, Isat: 5, Irms: 5, sat: "hard" },
    { id: "air5", name: "แกนอากาศ 5 µH · 20 A (ใหญ่)", L: 5e-6, rL: 0.010, Isat: 99, Irms: 20, sat: "none" },
    { id: "bad100", name: "ชอกสัญญาณ 100 µH · 0.3 A (เลือกผิดประเภท)", L: 100e-6, rL: 1.5, Isat: 0.3, Irms: 0.3, sat: "hard" }
  ];
  var caps = [
    { id: "al100", name: "อลูมิเนียมทั่วไป 100 µF / 35 V", C: 100e-6, rC: 0.55, V: 35, Irms: 0.35 },
    { id: "al470", name: "อลูมิเนียมทั่วไป 470 µF / 25 V", C: 470e-6, rC: 0.22, V: 25, Irms: 0.8 },
    { id: "le220", name: "Low-ESR อลูมิเนียม 220 µF / 25 V", C: 220e-6, rC: 0.08, V: 25, Irms: 1.2 },
    { id: "le470", name: "Low-ESR อลูมิเนียม 470 µF / 25 V", C: 470e-6, rC: 0.045, V: 25, Irms: 1.9 },
    { id: "le1000", name: "Low-ESR อลูมิเนียม 1000 µF / 25 V", C: 1000e-6, rC: 0.025, V: 25, Irms: 2.9 },
    { id: "po100", name: "โพลิเมอร์ 100 µF / 25 V", C: 100e-6, rC: 0.020, V: 25, Irms: 3.5 },
    { id: "po330", name: "โพลิเมอร์ 330 µF / 16 V", C: 330e-6, rC: 0.015, V: 16, Irms: 4.0 },
    { id: "ta100", name: "แทนทาลัมโพลิเมอร์ 100 µF / 16 V", C: 100e-6, rC: 0.10, V: 16, Irms: 1.5 },
    { id: "mlcc22", name: "MLCC X7R 22 µF / 25 V (ค่าจริงที่ไบแอส ≈ 12 µF)", C: 12e-6, rC: 0.004, V: 25, Irms: 5 },
    { id: "mlcc10", name: "MLCC X7R 10 µF / 50 V (ค่าจริงที่ไบแอส ≈ 6 µF)", C: 6e-6, rC: 0.005, V: 50, Irms: 4 }
  ];
  var fets = [
    { id: "n30", name: "N-MOSFET 30 V / 6 A (คลาส AO3400)", Vds: 30, Id: 6, Ron: 0.05, Qg: 6e-9, tsw: 15e-9, Coss: 70e-12 },
    { id: "n55", name: "N-MOSFET 55 V / 47 A logic-level (คลาส IRLZ44N)", Vds: 55, Id: 47, Ron: 0.035, Qg: 48e-9, tsw: 60e-9, Coss: 400e-12 },
    { id: "n100", name: "N-MOSFET 100 V / 33 A (คลาส IRF540N)", Vds: 100, Id: 33, Ron: 0.07, Qg: 71e-9, tsw: 60e-9, Coss: 250e-12 },
    { id: "n100lo", name: "N-MOSFET 100 V / 100 A Ron ต่ำ", Vds: 100, Id: 100, Ron: 0.012, Qg: 90e-9, tsw: 50e-9, Coss: 500e-12 },
    { id: "p40", name: "P-MOSFET 40 V / 10 A (high-side ไม่ต้องบูตสแตรป)", Vds: 40, Id: 10, Ron: 0.10, Qg: 25e-9, tsw: 40e-9, Coss: 200e-12 },
    { id: "gan100", name: "GaN HEMT 100 V / 20 A", Vds: 100, Id: 20, Ron: 0.006, Qg: 5e-9, tsw: 5e-9, Coss: 300e-12 }
  ];
  var byId = function (arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; };
  var api = { diodes: diodes, inductors: inductors, caps: caps, fets: fets, byId: byId };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.BuckParts = api;
})(typeof window !== "undefined" ? window : null);
