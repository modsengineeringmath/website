/* Power electronics converter lab UI (needs assets/pe-sim.js → window.PESim).
   Markup: <div class="pe-lab" data-topo="buck|boost|buckboost|cuk" [data-preset="<name>"] [data-compact] [data-full-link] [data-hash]>
   - data-compact hides the L/C design calculator, data-full-link adds a link to the full lab page,
     data-hash lets #preset=<name> in the URL pick a preset (full lab page).
   - <button data-pe-preset="<name>" [data-pe-target="<lab id>"]> loads a preset into a lab on the page.
   Presets are in PRESETS below; every worksheet on /learn/power-electronics/converter-lab/ uses one. */
(function () {
  "use strict";
  var S = window.PESim;
  if (!S) return;
  var FULL = "/learn/power-electronics/converter-lab/";
  var TOPO = { buck: "Buck (ลดแรงดัน)", boost: "Boost (เพิ่มแรงดัน)", buckboost: "Buck-Boost (กลับขั้ว)", cuk: "Ćuk (กลับขั้ว · กระแสต่อเนื่อง)" };
  var DEF_VO = { buck: 12, boost: 48, buckboost: 15, cuk: 15 };
  var GAIN = { buck: [0.01, 20], boost: [0.002, 4], buckboost: [0.004, 8], cuk: [0.002, 5] };
  var TDIV = [2e-6, 5e-6, 10e-6, 20e-6, 50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3];

  function base(topo) {
    return {
      topo: topo, src: "battery", vbat: 24, rbat: 0.05,
      vmainsRms: 220, fline: 50, vsecRms: 24, vfBridge: 0.9, rTx: 0.5,
      pvVoc: 22, pvIsc: 5.5, pvNs: 36, pvG: 1000, cin: 470e-6,
      fs: 50e3, L: 100e-6, L2: 100e-6, rL: 0.05, C: 100e-6, C1: 10e-6, rC: 0.02, ron: 0.03, vf: 0.5,
      loadT: "R", R: 10, Rstep: 5, Icc: 1,
      ctrl: "open", D: S.idealDuty(topo, 24, DEF_VO[topo]), vref: DEF_VO[topo],
      kp: GAIN[topo][0], ki: GAIN[topo][1], dmax: 0.9, slopeK: 0.5, softStart: true,
      fgTarget: "ref", fgWave: "off", fgAmp: 0.5, fgFreq: 200, fgOffset: 0,
      tsim: 20e-3, window: 100e-6, stepsPerPeriod: 120,
    };
  }
  // name: [label, topology, overrides, ch1, ch2]
  var PRESETS = {
    "buck-basic": ["Buck 24→12 V open loop", "buck", { D: 0.5, tsim: 10e-3 }, "vo", "iL"],
    "buck-dcm": ["Buck เข้า DCM (โหลดเบา)", "buck", { D: 0.5, R: 150, tsim: 30e-3 }, "iL", "vsw"],
    "buck-vmc-step": ["Buck PI + step load", "buck", { ctrl: "vmc", loadT: "step", R: 10, Rstep: 5, tsim: 40e-3, window: 10e-3 }, "vo", "iL"],
    "buck-pcmc": ["Buck peak current mode", "buck", { ctrl: "pcmc", kp: 0.3, ki: 300, loadT: "step", tsim: 30e-3, window: 5e-3 }, "vo", "iL"],
    "buck-gvd": ["วัด Gvd: ฉีด sine ที่ duty", "buck", { D: 0.5, fgTarget: "duty", fgWave: "sine", fgAmp: 0.01, fgFreq: 1000, tsim: 30e-3, window: 5e-3 }, "vo", "d"],
    "boost-basic": ["Boost 24→48 V open loop", "boost", { tsim: 20e-3 }, "vo", "iL"],
    "boost-gain-limit": ["Boost: D สูง + DCR 0.2 Ω", "boost", { D: 0.9, rL: 0.2, tsim: 30e-3 }, "vo", "iL"],
    "boost-subharmonic": ["Boost PCMC ไม่มี slope comp", "boost", { ctrl: "pcmc", kp: 0.3, ki: 200, slopeK: 0, vref: 60, tsim: 30e-3, window: 200e-6 }, "iL", "gate"],
    "boost-vmc": ["Boost PI (RHP zero → ต้องช้า)", "boost", { ctrl: "vmc", loadT: "step", R: 20, Rstep: 10, tsim: 80e-3, window: 20e-3 }, "vo", "iL"],
    "buckboost-basic": ["Buck-Boost กลับขั้ว", "buckboost", { tsim: 20e-3 }, "vo", "iL"],
    "cuk-basic": ["Ćuk open loop", "cuk", { tsim: 20e-3 }, "vo", "vc1"],
    "cuk-ripple": ["Ćuk vs ripple กระแสเข้า", "cuk", { tsim: 20e-3 }, "iin", "iL2"],
    "cuk-damping": ["Ćuk C1 เล็ก + PI → แกว่ง", "cuk", { C1: 2e-6, ctrl: "vmc", tsim: 60e-3, window: 20e-3 }, "vo", "vc1"],
    "mains": ["ไฟบ้าน 220 V → 24 Vrms → บริดจ์", "buck", { src: "rectifier", cin: 1000e-6, ctrl: "vmc", tsim: 80e-3, window: 40e-3, stepsPerPeriod: 60 }, "vin", "vo"],
    "solar-mppt": ["โซลาร์ 36 เซลล์ + MPPT", "buck", { src: "solar", ctrl: "mppt", D: 0.4, R: 2, tsim: 160e-3, window: 40e-3, stepsPerPeriod: 60 }, "vin", "iin"],
  };

  var CHS = S.CHANNELS;
  var f3 = function (x) { var a = Math.abs(x); return !isFinite(x) ? "–" : a >= 100 ? x.toFixed(1) : a >= 10 ? x.toFixed(2) : x.toFixed(3); };
  var fmtT = function (s) { return s >= 1e-3 ? +(s * 1e3).toPrecision(3) + " ms" : Math.round(s * 1e6) + " µs"; };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };

  // field: [key, label, unit, scale, showIf(p)]
  var F = {
    src: [
      ["vbat", "V แบตเตอรี่", "V", 1, function (p) { return p.src === "battery"; }],
      ["rbat", "R ภายใน", "Ω", 1, function (p) { return p.src === "battery"; }],
      ["vmainsRms", "V ไฟบ้าน", "Vrms", 1, function (p) { return p.src === "rectifier"; }],
      ["fline", "ความถี่ไลน์", "Hz", 1, function (p) { return p.src === "rectifier"; }],
      ["vsecRms", "V ทุติยภูมิ", "Vrms", 1, function (p) { return p.src === "rectifier"; }],
      ["vfBridge", "Vf บริดจ์ (ต่อตัว)", "V", 1, function (p) { return p.src === "rectifier"; }],
      ["rTx", "R ขดลวด", "Ω", 1, function (p) { return p.src === "rectifier"; }],
      ["pvVoc", "Voc แผง", "V", 1, function (p) { return p.src === "solar"; }],
      ["pvIsc", "Isc แผง", "A", 1, function (p) { return p.src === "solar"; }],
      ["pvNs", "เซลล์อนุกรม", "", 1, function (p) { return p.src === "solar"; }],
      ["pvG", "แสง G", "W/m²", 1, function (p) { return p.src === "solar"; }],
      ["cin", "Cin", "µF", 1e-6],
    ],
    stage: [
      ["fs", "fsw", "kHz", 1e3], ["L", "L (L1)", "µH", 1e-6],
      ["L2", "L2", "µH", 1e-6, function (p) { return p.topo === "cuk"; }],
      ["C1", "C1 คัปปลิ้ง", "µF", 1e-6, function (p) { return p.topo === "cuk"; }],
      ["C", "Cout", "µF", 1e-6], ["rL", "DCR ขด", "Ω", 1], ["rC", "ESR Cout", "Ω", 1],
      ["ron", "Rds(on)", "Ω", 1], ["vf", "Vf ไดโอด", "V", 1],
    ],
    load: [
      ["R", "R", "Ω", 1], ["Rstep", "R หลัง step", "Ω", 1, function (p) { return p.loadT === "step"; }],
      ["Icc", "I โหลด", "A", 1, function (p) { return p.loadT === "CC"; }],
    ],
    ctrl: [
      ["D", "Duty D", "", 1, function (p) { return p.ctrl === "open"; }],
      ["vref", "Vref (|Vo| เป้าหมาย)", "V", 1],
      ["kp", "Kp", "", 1, function (p) { return p.ctrl === "vmc" || p.ctrl === "pcmc"; }],
      ["ki", "Ki", "1/s", 1, function (p) { return p.ctrl === "vmc" || p.ctrl === "pcmc"; }],
      ["slopeK", "slope comp ×m₂", "", 1, function (p) { return p.ctrl === "pcmc"; }],
      ["dmax", "Dmax", "", 1],
    ],
    fg: [["fgAmp", "แอมพลิจูด", "", 1], ["fgFreq", "ความถี่", "Hz", 1], ["fgOffset", "ออฟเซ็ต", "", 1]],
  };
  var SEL = {
    src: [["battery", "แบตเตอรี่ DC"], ["rectifier", "ไฟบ้าน 220 V 50 Hz → หม้อแปลง → บริดจ์"], ["solar", "แผงโซลาร์เซลล์ (PV)"]],
    loadT: [["R", "ตัวต้านทาน"], ["CC", "กระแสคงที่ (e-load)"], ["step", "Step load R → R หลัง step"]],
    ctrl: [["open", "Open loop (ตั้ง D เอง)"], ["vmc", "Voltage mode PI (ดิจิทัล)"], ["pcmc", "Peak current mode + slope comp"], ["mppt", "MPPT P&O (โซลาร์)"]],
    fgWave: [["off", "ปิด"], ["square", "Square"], ["sine", "Sine"], ["triangle", "Triangle"]],
    fgTarget: [["ref", "Vref (ทดสอบวงปิด)"], ["duty", "Duty (open loop: หา Gvd)"]],
  };

  function num(p, f) {
    if (f[4] && !f[4](p)) return "";
    var v = p[f[0]] / f[3];
    return '<label class="pe-f"><span>' + f[1] + '</span><input type="number" step="any" data-k="' + f[0] + '" data-s="' + f[3] + '" value="' + +v.toPrecision(6) + '"><em>' + f[2] + "</em></label>";
  }
  function sel(p, k, label) {
    return '<label class="pe-f"><span>' + label + '</span><select data-k="' + k + '">' +
      SEL[k].map(function (o) { return '<option value="' + o[0] + '"' + (p[k] === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>";
  }

  function schematic(topo) {
    var coil = function (x, y) { return "M" + x + " " + y + " q5 -10 10 0 q5 -10 10 0 q5 -10 10 0 q5 -10 10 0"; };
    var t = function (x, y, s) { return '<text x="' + x + '" y="' + y + '">' + s + "</text>"; };
    var p = "M20 58 V20 H60 M20 82 V100 H340 ";
    var g = "";
    if (topo === "buck") { p += "M60 20 l20 -8 M80 20 H110 M110 20 V60 M102 60 h16 l-8 14 z M110 74 V100 " + coil(110, 20) + " M150 20 H250"; g = t(60, 10, "Q") + t(118, 70, "D") + t(122, 40, "L"); }
    if (topo === "boost") { p += coil(60, 20) + " M100 20 H130 M130 20 V45 l10 10 M130 70 V100 M130 55 v15 M130 20 H150 l0 -8 l14 8 l-14 8 z M164 12 v16 M164 20 H250"; g = t(72, 40, "L") + t(142, 65, "Q") + t(150, 8, "D"); }
    if (topo === "buckboost") { p += "M60 20 l20 -8 M80 20 H120 M120 20 V40 q-10 5 0 10 q-10 5 0 10 q-10 5 0 10 q-10 5 0 10 V100 M120 20 H150 l0 -8 l-14 8 l14 8 z M136 12 v16 M150 20 H250"; g = t(60, 10, "Q") + t(96, 70, "L") + t(140, 8, "D"); }
    if (topo === "cuk") { p += coil(60, 20) + " M100 20 H120 V45 l10 10 M120 55 v45 M120 20 H150 M150 8 v24 M158 8 v24 M158 20 H180 M180 20 V55 M172 70 h16 l-8 -14 z M180 70 V100 " + coil(180, 20) + " M220 20 H250"; g = t(72, 40, "L1") + t(126, 70, "Q") + t(146, 46, "C1") + t(188, 70, "D") + t(192, 40, "L2"); }
    p += " M250 20 V52 M238 52 h24 M238 60 h24 M250 60 V100 M250 20 H310 V45 M302 45 h16 v30 h-16 z M310 75 V100";
    g += t(4, 112, "Vin") + t(266, 60, "C") + t(322, 64, "R") + (topo === "buckboost" || topo === "cuk" ? t(262, 14, "Vo < 0") : "");
    return '<svg class="pe-schem" viewBox="0 0 360 120" role="img" aria-label="วงจร ' + esc(TOPO[topo]) + '"><circle cx="20" cy="70" r="12"/><path d="' + p + '"/>' + g + "</svg>";
  }

  function Lab(el) {
    this.el = el;
    var pr = el.dataset.preset;
    if (el.hasAttribute("data-hash")) { var m = location.hash.match(/preset=([\w-]+)/); if (m && PRESETS[m[1]]) pr = m[1]; }
    this.ch1 = "vo"; this.ch2 = "iL";
    this.des = { io: 1.2, ripI: 0.3, ripV: 0.01, AL: 100, Ae: 50, Bsat: 0.3, J: 5 };
    this.p = base(el.dataset.topo || "buck");
    if (pr) this.preset(pr, true); else this.render();
  }
  Lab.prototype.preset = function (name, quiet) {
    var d = PRESETS[name]; if (!d) return;
    this.p = Object.assign(base(d[1]), d[2]);
    if (!("D" in d[2]) && this.p.ctrl === "open") this.p.D = S.idealDuty(d[1], this.p.vbat, this.p.vref);
    this.ch1 = d[3]; this.ch2 = d[4]; this.presetName = name;
    this.render();
    if (!quiet) this.el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  Lab.prototype.render = function () {
    var p = this.p, el = this.el, self = this;
    var compact = el.hasAttribute("data-compact");
    var chOpt = function (cur) { return Object.keys(CHS).map(function (c) { return '<option value="' + c + '"' + (c === cur ? " selected" : "") + ">" + CHS[c] + "</option>"; }).join(""); };
    var presetOpt = '<option value="">— preset ใบงาน —</option>' + Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '"' + (k === self.presetName ? " selected" : "") + ">" + PRESETS[k][0] + "</option>"; }).join("");
    el.innerHTML =
      '<div class="pe-top"><label class="pe-f"><span>วงจร</span><select data-a="topo">' +
      Object.keys(TOPO).map(function (t) { return '<option value="' + t + '"' + (t === p.topo ? " selected" : "") + ">" + TOPO[t] + "</option>"; }).join("") +
      '</select></label><label class="pe-f"><span>Preset</span><select data-a="preset">' + presetOpt + "</select></label>" +
      '<button type="button" class="btn btn-primary btn-sm" data-a="run">▶ Run</button><button type="button" class="btn btn-ghost btn-sm" data-a="reset">Reset</button>' +
      (el.hasAttribute("data-full-link") ? '<a class="btn btn-ghost btn-sm" href="' + FULL + (this.presetName ? "#preset=" + this.presetName : "") + '">เปิดแล็บเต็ม →</a>' : "") + "</div>" +
      schematic(p.topo) +
      '<div class="pe-scope-wrap"><canvas class="pe-scope" width="900" height="360" aria-label="ออสซิลโลสโคปจำลอง"></canvas><span class="pe-busy" hidden>กำลังจำลอง…</span></div>' +
      '<div class="pe-row"><label class="pe-f"><span class="pe-c1">CH1</span><select data-a="ch1">' + chOpt(this.ch1) + '</select></label>' +
      '<label class="pe-f"><span class="pe-c2">CH2</span><select data-a="ch2">' + chOpt(this.ch2) + "</select></label>" +
      '<label class="pe-f"><span>Time/div</span><select data-a="tdiv">' + TDIV.map(function (v) { return '<option value="' + v + '"' + (Math.abs(v * 10 - p.window) < 1e-12 ? " selected" : "") + ">" + fmtT(v) + "</option>"; }).join("") + "</select></label>" +
      num(p, ["tsim", "เวลาจำลองรวม", "ms", 1e-3]) + "</div>" +
      '<div class="pe-meas" aria-live="polite"></div>' +
      '<div class="pe-grid">' +
      "<fieldset><legend>① แหล่งจ่าย</legend>" + sel(p, "src", "ชนิด") + F.src.map(function (f) { return num(p, f); }).join("") + "</fieldset>" +
      "<fieldset><legend>② ภาคกำลัง</legend>" + F.stage.map(function (f) { return num(p, f); }).join("") + "</fieldset>" +
      "<fieldset><legend>③ โหลด</legend>" + sel(p, "loadT", "ชนิด") + F.load.map(function (f) { return num(p, f); }).join("") + '<p class="pe-note">step load เกิดที่ 40 % ของจอสโคป</p></fieldset>' +
      "<fieldset><legend>④ ตัวควบคุม</legend>" + sel(p, "ctrl", "โหมด") + F.ctrl.map(function (f) { return num(p, f); }).join("") +
      '<label class="pe-f"><span>Soft-start</span><input type="checkbox" data-k="softStart"' + (p.softStart ? " checked" : "") + "></label>" +
      (p.ctrl === "open" ? '<button type="button" class="btn btn-ghost btn-sm" data-a="ideal">D อุดมคติจาก Vref</button>' : "") + "</fieldset>" +
      "<fieldset><legend>⑤ ฟังก์ชันเจนเนอเรเตอร์</legend>" + sel(p, "fgWave", "รูปคลื่น") + sel(p, "fgTarget", "ฉีดที่") + F.fg.map(function (f) { return num(p, f); }).join("") + "</fieldset>" +
      (compact ? "" : '<fieldset class="pe-des"><legend>⑥ คำนวณ L, C และพันตัวเหนี่ยวนำ</legend>' +
        [["io", "Io", "A"], ["ripI", "ΔiL / IL", ""], ["ripV", "ΔVo / Vo", ""], ["AL", "AL แกน", "nH/N²"], ["Ae", "Ae", "mm²"], ["Bsat", "Bsat", "T"], ["J", "J ลวด", "A/mm²"]]
          .map(function (d) { return '<label class="pe-f"><span>' + d[1] + '</span><input type="number" step="any" data-d="' + d[0] + '" value="' + self.des[d[0]] + '"><em>' + d[2] + "</em></label>"; }).join("") +
        '<div class="pe-calc"></div><button type="button" class="btn btn-ghost btn-sm" data-a="apply">ใช้ค่านี้ในซิม (+ margin)</button></fieldset>') +
      "</div>";
    this.canvas = el.querySelector("canvas");
    this.design();
    this.schedule();
  };
  Lab.prototype.vinNom = function () {
    var p = this.p;
    return p.src === "battery" ? p.vbat : p.src === "rectifier" ? p.vsecRms * Math.SQRT2 - 2 * p.vfBridge : p.pvVoc * 0.8;
  };
  Lab.prototype.design = function () {
    var box = this.el.querySelector(".pe-calc"); if (!box) return;
    var p = this.p, d = this.des;
    var z = S.designCalc(p.topo, this.vinNom(), p.vref, d.io, p.fs, d.ripI, d.ripV);
    var N = Math.ceil(Math.sqrt((z.L * 1e9) / d.AL)), B = (z.L * z.ipk) / (N * d.Ae * 1e-6), wd = 2 * Math.sqrt(z.irms / d.J / Math.PI);
    this.z = z;
    box.innerHTML = "D = " + f3(z.D) + " · IL = " + f3(z.IL) + " A · <b>L ≥ " + f3(z.L * 1e6) + " µH</b>" + (z.L2 ? " · <b>L2 ≥ " + f3(z.L2 * 1e6) + " µH</b>" : "") +
      " · <b>C ≥ " + f3(z.C * 1e6) + " µF</b>" + (z.C1 ? " · C1 ≥ " + f3(z.C1 * 1e6) + " µF" : "") +
      "<br>Ipk = " + f3(z.ipk) + " A · Irms = " + f3(z.irms) + " A · <b>N = " + N + " รอบ</b> · Bpk = " + f3(B) + " T " +
      (B > 0.8 * d.Bsat ? '<span class="pe-warn">ใกล้อิ่มตัว: แกนใหญ่ขึ้นหรือเพิ่มช่องอากาศ</span>' : "✓") +
      " · ลวด Ø ≥ " + f3(wd) + " mm · ½LI² = " + f3(0.5 * z.L * z.ipk * z.ipk * 1e3) + " mJ";
  };
  Lab.prototype.schedule = function () {
    var self = this;
    clearTimeout(this.t);
    this.t = setTimeout(function () { self.run(); }, 300);
  };
  Lab.prototype.run = function () {
    var self = this, busy = this.el.querySelector(".pe-busy");
    if (busy) busy.hidden = false;
    setTimeout(function () {
      try { self.res = S.simulate(self.p); } catch (e) { self.res = null; }
      if (busy) busy.hidden = true;
      self.draw(); self.meas();
    }, 20);
  };
  Lab.prototype.meas = function () {
    var r = this.res, box = this.el.querySelector(".pe-meas"); if (!box) return;
    if (!r) { box.textContent = "จำลองไม่สำเร็จ ตรวจค่าพารามิเตอร์"; return; }
    var s = r.stats;
    box.innerHTML = "<b>Vout</b> " + f3(s.vo.mean) + " V · <b>ΔVo</b> " + f3((s.vo.max - s.vo.min) * 1e3) + " mV<sub>pp</sub> · <b>iL</b> " + f3(s.iL.mean) +
      " A · <b>ΔiL</b> " + f3(s.iL.max - s.iL.min) + " A · <b>iL,pk</b> " + f3(s.iL.max) + " A · <b>Vin</b> " + f3(s.vin.mean) + " V · <b>Pin</b> " + f3(r.pin) +
      " W · <b>Pout</b> " + f3(r.pout) + " W · <b>η</b> " + (r.eff * 100).toFixed(1) + " % · <b>โหมด</b> " + (r.dcm ? "DCM" : "CCM") +
      r.warn.map(function (w) { return '<div class="pe-warn">⚠ ' + esc(w) + "</div>"; }).join("");
  };
  Lab.prototype.draw = function () {
    var r = this.res, cv = this.canvas; if (!r || !cv) return;
    var g = cv.getContext("2d"); if (!g) return;
    var W = cv.width, H = cv.height, i;
    g.fillStyle = "#0c1b24"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#1e3a48"; g.lineWidth = 1;
    for (i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * W / 10, 0); g.lineTo(i * W / 10, H); g.stroke(); }
    for (i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * H / 8); g.lineTo(W, i * H / 8); g.stroke(); }
    var tr = function (c, col, row) {
      var st = r.stats[c], lo = st.min, hi = st.max;
      if (hi - lo < 1e-6) { lo -= 0.5; hi += 0.5; }
      var pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
      var y = function (v) { return H - ((v - lo) / (hi - lo)) * H; };
      g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath();
      for (var b = 0; b < r.n; b++) {
        var x = b / r.n * W;
        if (b === 0) g.moveTo(x, y(r.mn[c][b]));
        g.lineTo(x, y(r.mn[c][b])); g.lineTo(x, y(r.mx[c][b]));
      }
      g.stroke();
      g.fillStyle = col; g.font = "13px 'IBM Plex Mono', monospace";
      g.fillText((row ? "CH2 " : "CH1 ") + CHS[c] + "  " + f3((hi - lo) / 8) + "/div  avg " + f3(st.mean) + "  p-p " + f3(st.max - st.min), 8, 18 + row * 18);
    };
    tr(this.ch1, "#f6d32d", 0);
    if (this.ch2 !== this.ch1) tr(this.ch2, "#2ed3e6", 1);
    g.fillStyle = "#9fc"; g.fillText(fmtT(r.window / 10) + "/div", W - 110, H - 10);
  };

  function init(el) {
    if (el.peLab) return;
    var lab = (el.peLab = new Lab(el));
    el.classList.add("pel-ready");
    el.addEventListener("input", function (e) {
      var t = e.target, k = t.dataset.k, d = t.dataset.d;
      if (k) {
        if (t.type === "checkbox") lab.p[k] = t.checked;
        else if (t.tagName === "SELECT") return; // handled on "change"
        else { var v = parseFloat(t.value); if (!isNaN(v)) lab.p[k] = v * parseFloat(t.dataset.s); }
        lab.design(); lab.schedule();
      } else if (d) { var w = parseFloat(t.value); if (!isNaN(w)) { lab.des[d] = w; lab.design(); } }
    });
    el.addEventListener("change", function (e) {
      var a = e.target.dataset.a, v = e.target.value;
      if (a === "topo") { var o = lab.p; lab.p = base(v); lab.p.src = o.src; lab.p.vbat = o.vbat; lab.p.vsecRms = o.vsecRms; lab.presetName = ""; lab.render(); }
      else if (a === "preset" && v) lab.preset(v, true);
      else if (a === "ch1") { lab.ch1 = v; lab.draw(); }
      else if (a === "ch2") { lab.ch2 = v; lab.draw(); }
      else if (a === "tdiv") { lab.p.window = parseFloat(v) * 10; lab.schedule(); }
      else if (e.target.tagName === "SELECT" && e.target.dataset.k) {
        var k = e.target.dataset.k; lab.p[k] = v;
        if (k === "src") { lab.p.cin = v === "rectifier" ? 1000e-6 : 470e-6; if (v !== "battery") { lab.p.tsim = Math.max(lab.p.tsim, 80e-3); lab.p.stepsPerPeriod = 60; } }
        lab.render();
      }
    });
    el.addEventListener("click", function (e) {
      var a = e.target.dataset && e.target.dataset.a;
      if (a === "run") lab.run();
      else if (a === "reset") { lab.p = base(lab.p.topo); lab.presetName = ""; lab.render(); }
      else if (a === "ideal") { lab.p.D = S.idealDuty(lab.p.topo, lab.vinNom(), lab.p.vref); lab.render(); }
      else if (a === "apply" && lab.z) {
        var z = lab.z;
        lab.p.L = z.L * 1.2; if (z.L2) lab.p.L2 = z.L2 * 1.2; lab.p.C = z.C * 1.5; if (z.C1) lab.p.C1 = z.C1 * 1.5;
        lab.p.loadT = "R"; lab.p.R = lab.p.vref / lab.des.io; lab.render();
      }
    });
  }
  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".pe-lab"), init);
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-pe-preset]"); if (!b) return;
      var tid = b.dataset.peTarget, el = tid ? document.getElementById(tid) : document.querySelector(".pe-lab");
      if (el && el.peLab) { e.preventDefault(); el.peLab.preset(b.dataset.pePreset); }
      else location.href = FULL + "#preset=" + b.dataset.pePreset;
    });
    window.addEventListener("hashchange", function () {
      var m = location.hash.match(/preset=([\w-]+)/), el = document.querySelector(".pe-lab[data-hash]");
      if (m && el && el.peLab) el.peLab.preset(m[1]);
    });
  }
  window.PELab = { PRESETS: PRESETS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
