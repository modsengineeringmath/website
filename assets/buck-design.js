/* Buck design lab (needs buck-core.js, buck-parts.js, buck-ui.js).  <div class="bk-design" data-preset="24-12|12-5|48-12|wide">
   Specification → part selection (MOSFET, diode, inductor, capacitor bank) → stress/loss checks → load program (R or I per time slot, optional Vin
   per slot) simulated at switching level with open-loop duty or peak current mode + cycle-by-cycle limit → per-slot table → capability (load-line) sweep. */
(function () {
  "use strict";
  var B = window.BuckCore, U = window.BuckUI, P = window.BuckParts;
  if (!B || !U || !P) return;
  var num = U.num, eng = U.eng, esc = U.esc;
  var SPECS = {
    "24-12": { name: "24 V → 12 V · 3 A", s: { Vinmin: 18, Vinnom: 24, Vinmax: 30, Vo: 12, Iomax: 3, Iomin: 0.3, fs: 100e3, rip: 0.3, dVo: 0.12 }, prog: "std" },
    "12-5": { name: "12 V → 5 V · 2 A", s: { Vinmin: 10.5, Vinnom: 12, Vinmax: 14.5, Vo: 5, Iomax: 2, Iomin: 0.2, fs: 100e3, rip: 0.3, dVo: 0.05 }, prog: "5v" },
    "48-12": { name: "48 V → 12 V · 5 A", s: { Vinmin: 36, Vinnom: 48, Vinmax: 60, Vo: 12, Iomax: 5, Iomin: 0.5, fs: 100e3, rip: 0.3, dVo: 0.12 }, prog: "48v" },
    wide: { name: "ช่วง Vin กว้าง 9–36 V → 5 V · 1 A", s: { Vinmin: 9, Vinnom: 24, Vinmax: 36, Vo: 5, Iomax: 1, Iomin: 0.1, fs: 150e3, rip: 0.4, dVo: 0.05 }, prog: "wide" }
  };
  function mkProg(kind, s) {
    var Rn = s.Vo / s.Iomax;

    return [{ dur: 10, kind: "R", val: r3(Rn * 2), vin: "" }, { dur: 8, kind: "R", val: r3(Rn), vin: "" }, { dur: 8, kind: "R", val: r3(Rn * 12), vin: "" }, { dur: 8, kind: "R", val: r3(Rn), vin: s.Vinmin }, { dur: 8, kind: "R", val: r3(Rn), vin: s.Vinmax }];
  }
  function r3(x) { return +x.toPrecision(3); }
  function ck(level, text) { return '<span class="' + (level === "ok" ? "bk-pass" : level === "warn" ? "bk-warnc" : "bk-fail") + '">' + (level === "ok" ? "✓ " : level === "warn" ? "⚠ " : "✗ ") + "</span>" + text; }

  function init(el) {
    var st = { spec: {}, fet: "n55", dio: "sch3a40", ind: "tp150", cap: "le470", ncap: 1, ctrl: "pcmc", Ilim: 0, ilimAuto: true, Dmax: 0.92, simVin: "nom", prog: [], cin: 100e-6 };
    var res = {}, specKey = el.dataset.preset || "24-12";
    function loadSpec(k) { specKey = k; st.spec = Object.assign({}, SPECS[k].s); st.prog = mkProg(SPECS[k].prog, st.spec); st.ilimAuto = true; autoPick(); }

    // ---------------------------------------------------------------- parts
    function parts(s) {
      var f = P.byId(P.fets, st.fet), d = P.byId(P.diodes, st.dio), l = P.byId(P.inductors, st.ind), c = P.byId(P.caps, st.cap), n = st.ncap;
      return { f: f, d: d, l: l, c: c, n: n,
        L: { L: l.L, rL: l.rL, Isat: l.Isat, Irms: l.Irms, sat: l.sat }, C: { C: c.C * n, rC: c.rC / n, Irms: c.Irms * n, V: c.V },
        Q: { Ron: f.Ron, RonLs: f.Ron, Qg: f.Qg, tsw: f.tsw, Coss: f.Coss, Vds: f.Vds, Id: f.Id }, Dd: { Vf: d.Vf, Rd: d.Rd, Qrr: d.Qrr, If: d.If, Vrrm: d.Vrrm, kind: d.kind } };
    }
    function pFor(Vin, R) { var q = parts(), s = st.spec; return { Vg: Vin, R: R || s.Vo / s.Iomax, L: q.L.L, rL: q.L.rL, Isat: q.L.Isat, satType: q.L.sat, C: q.C.C, rC: q.C.rC, Ron: q.Q.Ron, RonLs: q.Q.Ron, Rd: q.Dd.kind === "sync" ? 0 : q.Dd.Rd, Vf: q.Dd.kind === "sync" ? 0 : q.Dd.Vf, sync: q.Dd.kind === "sync", fs: s.fs }; }
    function specCalc() { var q = parts(), s = st.spec; return B.designCalc({ Vinmin: s.Vinmin, Vinmax: s.Vinmax, Vo: s.Vo, Iomax: s.Iomax, Iomin: s.Iomin, fs: s.fs, rip: s.rip, dVo: s.dVo, sync: q.Dd.kind === "sync" }, { L: q.L, C: q.C, Q: q.Q, Dd: q.Dd }); }

    function ilimFor(L) { // peak-current limit that still lets Io,max through: 15 % over the worst peak + the slope-compensation drop
      var s = st.spec, Dmin = s.Vo / s.Vinmax, Dhi = Math.min(s.Vo / s.Vinmin, 0.95), di = s.Vo * (1 - Dmin) / (L * s.fs);
      return r3(1.15 * (s.Iomax + di / 2) + 0.6 * s.Vo * Dhi / (L * s.fs));
    }
    function autoIlim() { var q = parts(); st.Ilim = r3(Math.min(ilimFor(q.L.L), 0.95 * q.L.Isat)); }
    function autoPick() {
      var s = st.spec, Dmin = s.Vo / s.Vinmax, best, i, q = parts();
      var dIof = function (L) { return s.Vo * (1 - Dmin) / (L * s.fs); };
      // inductor: lowest copper loss among those with Isat ≥ 1.25·Ipk, Irms ≥ ILrms, ripple ≤ 70 % of Iomax
      best = null;
      P.inductors.forEach(function (l) {
        var di = dIof(l.L), ipk = s.Iomax + di / 2, irms = Math.sqrt(s.Iomax * s.Iomax + di * di / 12);
        if (l.Isat < (l.sat === "hard" ? 1.15 : 1.05) * ilimFor(l.L) || l.Irms < irms || di > 0.7 * s.Iomax) return;
        var loss = l.rL * irms * irms + (di > 0.5 * s.Iomax ? 0.2 : 0);
        if (!best || loss < best.loss) best = { id: l.id, loss: loss };
      });
      if (best) st.ind = best.id;
      q = parts(); var di0 = dIof(q.L.L);
      // diode: Schottky with lowest Vf that meets voltage/current margins, else ultrafast
      var Iavg = (1 - Dmin) * s.Iomax; best = null;
      P.diodes.forEach(function (d) {
        if (d.kind === "sync" || d.kind === "slow") return;
        if (d.Vrrm < 1.4 * s.Vinmax || d.If < 1.3 * Iavg) return;
        var loss = d.Vf * Iavg + d.Rd * Iavg * Iavg + (d.Qrr || 0) * s.Vinmax * s.fs;
        if (!best || loss < best.loss) best = { id: d.id, loss: loss };
      });
      if (best) st.dio = best.id;
      // MOSFET: lowest conduction + switching loss with Vds ≥ 1.4·Vin,max, Id ≥ 2·Ipk
      best = null; var ipk0 = s.Iomax + di0 / 2;
      P.fets.forEach(function (f) {
        if (f.Vds < 1.4 * s.Vinmax || f.Id < 2 * ipk0) return;
        var loss = f.Ron * Dmin * (s.Iomax * s.Iomax) + 0.5 * s.Vinmax * s.Iomax * f.tsw * s.fs + f.Qg * 5 * s.fs + (f.id === "gan100" ? 0.4 : 0) + (f.Vds > 2.6 * s.Vinmax ? 0.15 : 0);
        if (!best || loss < best.loss) best = { id: f.id, loss: loss };
      });
      if (best) st.fet = best.id;
      // capacitor bank: fewest parts meeting C, ESR and ripple-current needs, voltage ≥ 1.25·Vo
      var Cmin = di0 / (8 * s.fs * s.dVo * 0.5), ESRmax = s.dVo * 0.5 / di0, ICr = di0 / Math.sqrt(12); best = null;
      P.caps.forEach(function (c) {
        if (c.V < 1.25 * s.Vo) return;
        for (var n = 1; n <= 6; n++) {
          if (c.C * n < Cmin || c.rC / n > ESRmax || c.Irms * n < ICr) continue;
          var score = n * 10 + c.rC / n * 100 - Math.min(c.C * n, 2e-3) * 100; // few parts, low ESR
          if (!best || score < best.score) best = { id: c.id, n: n, score: score };
          break;
        }
      });
      if (best) { st.cap = best.id; st.ncap = best.n; }
      autoIlim();
    }

    // ---------------------------------------------------------------- UI skeleton
    function n(k, label, unit, scale, val, step) { return '<label class="bk-n"><span>' + label + '</span><input type="number" step="' + (step || "any") + '" data-sk="' + k + '" data-s="' + scale + '" value="' + +(val / scale).toPrecision(5) + '"><em>' + unit + "</em></label>"; }
    function nt(k, label, unit, val) { return '<label class="bk-n"><span>' + label + '</span><input type="number" step="any" data-tk="' + k + '" value="' + val + '"><em>' + unit + "</em></label>"; }
    function sel(k, arr, cur) { return '<select data-pk="' + k + '">' + arr.map(function (a) { return '<option value="' + a.id + '"' + (a.id === cur ? " selected" : "") + ">" + esc(a.name) + "</option>"; }).join("") + "</select>"; }
    function render() {
      var s = st.spec, ptxt = function (k) { return '<div class="bk-note pinfo" data-info="' + k + '"></div>'; };
      el.innerHTML =
        '<div class="bk-top"><div class="bk-presets">' + Object.keys(SPECS).map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm' + (k === specKey ? " on" : "") + '" data-spec="' + k + '">' + SPECS[k].name + "</button>"; }).join("") + "</div></div>" +
        '<div class="bk-two"><div class="bk-ctl"><h4>① ข้อกำหนด (spec)</h4>' +
        n("Vinmin", "Vin ต่ำสุด", "V", 1, s.Vinmin) + n("Vinnom", "Vin ปกติ", "V", 1, s.Vinnom) + n("Vinmax", "Vin สูงสุด", "V", 1, s.Vinmax) + n("Vo", "แรงดันขาออก Vo", "V", 1, s.Vo) + n("Iomax", "กระแสโหลดสูงสุด", "A", 1, s.Iomax) + n("Iomin", "กระแสโหลดต่ำสุดที่ต้องการ CCM", "A", 1, s.Iomin) +
        n("fs", "ความถี่สวิตช์", "kHz", 1e3, s.fs) + n("rip", "ripple กระแส ΔiL/Io,max", "%", 0.01, s.rip) + n("dVo", "ripple ขาออก ΔVo (p-p)", "mV", 1e-3, s.dVo) +
        '<div class="bk-quick">' + btn("pick", "⚙ แนะนำชิ้นส่วนให้อัตโนมัติ") + "</div></div>" +
        '<div class="bk-ctl"><h4>② เลือกชิ้นส่วน</h4><div class="bk-sel"><label>MOSFET สวิตช์ (Q)</label>' + sel("fet", P.fets, st.fet) + "</div>" + ptxt("fet") +
        '<div class="bk-sel"><label>ไดโอด / ตัวแก้กระแส</label>' + sel("dio", P.diodes, st.dio) + "</div>" + ptxt("dio") +
        '<div class="bk-sel"><label>ตัวเหนี่ยวนำ L</label>' + sel("ind", P.inductors, st.ind) + "</div>" + ptxt("ind") +
        '<div class="bk-sel"><label>ตัวเก็บประจุขาออก</label>' + sel("cap", P.caps, st.cap) + "</div>" +
        '<label class="bk-n"><span>จำนวนตัวต่อขนาน</span><input type="number" min="1" max="8" step="1" data-pk="ncap" value="' + st.ncap + '"><em>ตัว</em></label>' + ptxt("cap") + "</div></div>" +
        '<div class="bk-eq"><h5>③ ผลออกแบบและการตรวจความเค้น</h5><div class="dz-calc"></div></div>' +
        '<div class="bk-ctl"><h4>④ โปรแกรมโหลด — แต่ละช่วงเวลากี่โอห์ม (หรือกี่แอมป์) และ Vin เท่าไร</h4><div class="bk-tbl"><table class="bk-prog"><thead><tr><th>#</th><th>นาน (ms)</th><th>ชนิดโหลด</th><th>ค่า</th><th>Vin (V) ว่าง = ใช้ค่าปกติ</th><th></th></tr></thead><tbody class="dz-rows"></tbody></table></div>' +
        '<div class="bk-quick">' + btn("addrow", "+ เพิ่มช่วง") + btn("prog-std", "ชุดมาตรฐาน") + btn("prog-light", "โหลดเบา ↔ หนัก") + btn("prog-over", "ทดสอบโอเวอร์โหลด") + btn("prog-line", "Vin ตก/ขึ้น") + "</div>" +
        '<div class="bk-two"><div class="bk-sel"><label>การควบคุม</label><select data-ck="ctrl"><option value="pcmc"' + (st.ctrl === "pcmc" ? " selected" : "") + '>Peak current mode (ป้อนกลับแรงดัน + จำกัดกระแสทุกคาบ)</option><option value="open"' + (st.ctrl === "open" ? " selected" : "") + '>Open loop — ตั้ง D คงที่ (ไม่มีป้อนกลับ)</option></select></div>' +
        nt("Ilim", "จำกัดกระแสพีก Ilim", "A", st.Ilim) + "</div>" + nt("Dmax", "ดิวตี้สูงสุดของชิป Dmax", "", st.Dmax) +
        '<div class="bk-sel"><label>Vin ที่ใช้ในช่วงที่ไม่ระบุ</label><select data-ck="simVin"><option value="min"' + (st.simVin === "min" ? " selected" : "") + '>Vin ต่ำสุด</option><option value="nom"' + (st.simVin === "nom" ? " selected" : "") + '>Vin ปกติ</option><option value="max"' + (st.simVin === "max" ? " selected" : "") + ">Vin สูงสุด</option></select></div></div>" +
        '<div class="bk-run">' + btn("run", "▶ จำลองโปรแกรมโหลด") + '<span class="bk-busy run-busy"></span></div>' +
        '<div class="bk-status dz-status" aria-live="polite"></div><div class="bk-figs"><div class="bk-fig f-vo"></div><div class="bk-fig f-il"></div><div class="bk-fig f-io"></div></div><div class="bk-tbl dz-seg"></div>' +
        '<div class="bk-eq"><h5>⑤ ศักยภาพการจ่ายกระแส (load line) — ไล่โหลดจากเบาไปหนักแล้ววัดสภาวะคงตัว</h5><div class="bk-run">' + btn("cap", "▶ วัดศักยภาพการจ่ายกระแส") + '<span class="bk-busy cap-busy"></span></div><div class="bk-status dz-capstat" hidden></div><div class="bk-figs"><div class="bk-fig f-cv"></div><div class="bk-fig f-ci"></div><div class="bk-fig f-ce"></div></div></div>';
      renderRows(); infoLines(); calc(); scheduleRun();
    }
    function renderRows() {
      el.querySelector(".dz-rows").innerHTML = st.prog.map(function (r, i) {
        return "<tr data-i=\"" + i + '"><td>' + (i + 1) + '</td><td><input type="number" step="any" min="0.5" data-r="dur" value="' + r.dur + '"></td><td><select data-r="kind"><option value="R"' + (r.kind === "R" ? " selected" : "") + '>ตัวต้านทาน (Ω)</option><option value="I"' + (r.kind === "I" ? " selected" : "") + '>กระแสคงที่ (A)</option></select></td><td><input type="number" step="any" data-r="val" value="' + r3(r.val) + '"></td><td><input type="number" step="any" data-r="vin" placeholder="—" value="' + (r.vin === "" ? "" : r.vin) + '"></td><td><button type="button" class="btn btn-ghost btn-sm" data-act="del" aria-label="ลบช่วงที่ ' + (i + 1) + '">✕</button></td></tr>';
      }).join("");
    }
    function infoLines() {
      var q = parts(), g = function (k) { return el.querySelector('[data-info="' + k + '"]'); };
      g("fet").textContent = "Vds " + q.f.Vds + " V · Id " + q.f.Id + " A · Rds(on) " + eng(q.f.Ron, "Ω") + " · Qg " + eng(q.f.Qg, "C") + " · tr+tf ≈ " + eng(q.f.tsw, "s");
      g("dio").textContent = q.d.kind === "sync" ? "MOSFET ตัวล่างใช้ Rds(on) เดียวกับตัวบน · ไม่มี Vf · iL ติดลบได้ (ไม่มี DCM) · ต้องมี dead-time" : "Vrrm " + q.d.Vrrm + " V · If " + q.d.If + " A · Vf ≈ " + q.d.Vf + " V + " + eng(q.d.Rd, "Ω") + "·i · Qrr " + (q.d.Qrr ? eng(q.d.Qrr, "C") : "≈ 0");
      g("ind").textContent = "L " + eng(q.l.L, "H") + " · DCR " + eng(q.l.rL, "Ω") + " · Isat " + q.l.Isat + " A (L ลด 30 %) · Irms " + q.l.Irms + " A · อิ่มตัวแบบ " + (q.l.sat === "hard" ? "ฉับพลัน (ferrite)" : q.l.sat === "soft" ? "ค่อยเป็นค่อยไป (ผงเหล็ก)" : "ไม่อิ่มตัว (แกนอากาศ)");
      g("cap").textContent = "รวม C = " + eng(q.C.C, "F") + " · ESR = " + eng(q.C.rC, "Ω") + " · ทนกระแสริปเปิล " + num(q.C.Irms, 3) + " A · แรงดันพิกัด " + q.C.V + " V";
    }

    // ---------------------------------------------------------------- design calc + checks
    function calc() {
      var s = st.spec, q = parts(), o = specCalc(), w = o.worst, rows = o.rows, out = [], lev = function (r, ok, wr) { return r >= ok ? "ok" : r >= wr ? "warn" : "bad"; };
      var hi = w.hi, Cmin = o.Cmin, Iocrit = s.Vo * (1 - o.Dmin) / (s.fs * 2 * q.L.L);
      // inductor ratio checks use the highest-peak case (Vin max)
      out.push(["ตัวเหนี่ยวนำ: Isat เทียบกับกระแสพีก", ck(lev(q.L.Isat / hi.Ipk, 1.2, 1.0), "Isat = " + num(q.L.Isat) + " A เทียบ Ipk = " + num(hi.Ipk, 3) + " A (ที่ Vin สูงสุด) → อัตรา " + num(q.L.Isat / hi.Ipk, 3) + "× (ควร ≥ 1.2×; Ilim ของชิปต้องอยู่ต่ำกว่า Isat)")]);
      out.push(["ตัวเหนี่ยวนำ: กระแส RMS / ความร้อน", ck(lev(q.L.Irms / hi.ILrms, 1.0, 0.9), "Irms พิกัด " + num(q.L.Irms) + " A เทียบ IL,rms = " + num(hi.ILrms, 3) + " A · สูญเสียทองแดง " + num(hi.pcL, 3) + " W")]);
      out.push(["ripple กระแส ΔiL", ck(hi.dI / s.Iomax <= 0.5 ? "ok" : hi.dI / s.Iomax <= 0.8 ? "warn" : "bad", "ΔiL = " + num(hi.dI, 3) + " A p-p = " + num(hi.dI / s.Iomax * 100, 3) + " % ของ Io,max (เป้า " + num(s.rip * 100) + " %) · L ขั้นต่ำตามเป้า = " + eng(o.Lmin, "H"))]);
      out.push(["โหมดที่โหลดต่ำสุด", Iocrit < s.Iomin ? ck("ok", "CCM ทั้งช่วง: Io,crit = " + num(Iocrit, 3) + " A < Io,min = " + num(s.Iomin) + " A") : ck(q.Dd.kind === "sync" ? "ok" : "warn", (q.Dd.kind === "sync" ? "Synchronous: กระแสติดลบได้ ไม่มี DCM (แต่มีกระแสวน)" : "เข้า DCM เมื่อ Io < " + num(Iocrit, 3) + " A (ที่ Vin สูงสุด) — ตัวควบคุมต้องรองรับ DCM / ใช้ L ใหญ่ขึ้น / synchronous"))]);
      out.push(["ไดโอด: แรงดันย้อนกลับ", ck(lev(q.Dd.Vrrm / s.Vinmax, 1.4, 1.1), q.Dd.kind === "sync" ? "ใช้ MOSFET ตัวล่าง Vds " + q.f.Vds + " V เทียบ Vin,max " + s.Vinmax + " V" : "Vrrm " + q.Dd.Vrrm + " V เทียบ Vin,max " + s.Vinmax + " V → " + num(q.Dd.Vrrm / s.Vinmax, 3) + "× (เผื่อ ringing ≥ 1.4×)")]);
      out.push(["ไดโอด: กระแสเฉลี่ย / ชนิด", q.Dd.kind === "slow" ? ck("bad", "ไดโอดซิลิคอนทั่วไปมี Qrr สูง (trr หลายสิบ µs) ใช้ที่ " + num(s.fs / 1e3) + " kHz ไม่ได้ → ร้อนจัด/สวิตช์พัง ใช้ Schottky หรือ ultrafast") : ck(lev(q.Dd.If / hi.IDavg, 1.3, 1.0), (q.Dd.kind === "sync" ? "" : "If " + q.Dd.If + " A เทียบ ID,avg = ") + num(hi.IDavg, 3) + " A · สูญเสียตัวแก้กระแส " + num(hi.pcD, 3) + " W")]);
      out.push(["MOSFET: แรงดันและกระแส", ck(lev(Math.min(q.f.Vds / s.Vinmax / 1.5, q.f.Id / hi.Ipk / 2), 1, 0.7), "Vds " + q.f.Vds + " V (" + num(q.f.Vds / s.Vinmax, 3) + "× Vin,max), Id " + q.f.Id + " A (" + num(q.f.Id / hi.Ipk, 3) + "× Ipk) · IQ,rms = " + num(hi.IQrms, 3) + " A · P(Rds) = " + num(hi.pcQ, 3) + " W · P(sw) = " + num(hi.psw, 3) + " W")]);
      out.push(["ตัวเก็บประจุขาออก", ck(hi.dVo <= s.dVo ? "ok" : hi.dVo <= 1.5 * s.dVo ? "warn" : "bad", "ΔVo ≈ ΔiL/(8·C·fs) + ΔiL·ESR = " + num(hi.dI / (8 * q.C.C * s.fs) * 1e3, 3) + " + " + num(hi.dI * q.C.rC * 1e3, 3) + " = " + num(hi.dVo * 1e3, 3) + " mV (เป้า ≤ " + num(s.dVo * 1e3, 3) + " mV) · C ≥ " + eng(Cmin, "F") + ", ESR ≤ " + eng(o.ESRmax, "Ω"))]);
      out.push(["ตัวเก็บประจุ: กระแสริปเปิล/แรงดัน", ck(lev(Math.min(q.C.Irms / hi.ICrms, q.C.V / s.Vo / 1.25), 1, 0.8), "ICout,rms = ΔiL/√12 = " + num(hi.ICrms, 3) + " A เทียบพิกัด " + num(q.C.Irms, 3) + " A · พิกัดแรงดัน " + q.C.V + " V เทียบ Vo " + s.Vo + " V (เผื่อ ≥ 1.25×)")]);
      var Cin = 0.25 * s.Iomax / (s.fs * 0.02 * s.Vinmin);
      out.push(["ตัวเก็บประจุขาเข้า (ข้อเสนอแนะ)", ck("ok", "ICin,rms สูงสุด ≈ Io·√(D(1−D)) = " + num(w.hi.ICinrms, 3) + " A (สูงสุด " + num(0.5 * s.Iomax, 3) + " A ที่ D = 0.5) · Cin ≥ " + eng(Cin, "F") + " (ripple ขาเข้า ≈ 2 % ที่ Vin ต่ำสุด) แบบ low-ESR + เซรามิกชิดสวิตช์")]);
      var Dmaxreq = s.Vo / s.Vinmin; out.push(["ช่วงดิวตี้", ck(Dmaxreq < st.Dmax * 0.95 ? "ok" : Dmaxreq < st.Dmax ? "warn" : "bad", "D = " + num(o.Dmin, 3) + " (Vin สูงสุด) … " + num(Dmaxreq, 3) + " (Vin ต่ำสุด) เทียบ Dmax ของชิป " + st.Dmax)]);
      el.querySelector(".dz-calc").innerHTML =
        '<table class="bk-t"><tbody>' + out.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + "</tbody></table>" +
        '<div class="bk-tbl"><table class="bk-t"><thead><tr><th>Vin</th><th>D</th><th>ΔiL (A)</th><th>Ipk (A)</th><th>P Rds</th><th>P ตัวแก้กระแส</th><th>P ทองแดง</th><th>P ESR</th><th>P สวิตช์</th><th>รวม (W)</th><th>η</th></tr></thead><tbody>' +
        rows.map(function (r) { return "<tr><td>" + num(r.Vin, 3) + " V</td><td>" + num(r.D, 3) + "</td><td>" + num(r.dI, 3) + "</td><td>" + num(r.Ipk, 3) + "</td><td>" + num(r.pcQ, 3) + "</td><td>" + num(r.pcD, 3) + "</td><td>" + num(r.pcL, 3) + "</td><td>" + num(r.pcC, 3) + "</td><td>" + num(r.psw, 3) + "</td><td><b>" + num(r.ploss, 3) + "</b></td><td><b>" + num(r.eff * 100, 3) + " %</b></td></tr>"; }).join("") + "</tbody></table></div>" +
        '<p class="bk-note">ที่ Io = ' + num(s.Iomax) + " A เต็มพิกัด · สูญเสียสวิตช์รวม ½·Vin·Io·(tr+tf)·fs + Qg·Vdrive·fs + Qrr·Vin·fs + ½·Coss·Vin²·fs · ไม่รวมสูญเสียแกนและวงจรขับ</p>";
      el._calc = o;
    }

    // ---------------------------------------------------------------- simulation of the load program
    var runTimer;
    function scheduleRun() { clearTimeout(runTimer); runTimer = setTimeout(run, 350); }
    function simCfg(p, prog, extra) {
      var s = st.spec, cfg = { p: p, program: prog, nsub: 14 }, D0 = B.dutyForVo(Object.assign({}, p, { R: s.Vo / s.Iomax, Vg: s.Vinnom }), s.Vo).D;
      if (st.ctrl === "pcmc") { var g = B.pcmcAuto(p, s.Vo); cfg.ctrl = { type: "pcmc", Vref: s.Vo, Kp: g.Kp, Ki: g.Ki, ma: g.ma, Ilim: st.Ilim, Dmax: st.Dmax, soft: 1.5e-3 }; }
      else { cfg.ctrl = { type: "open", D: D0, Dmax: st.Dmax }; cfg.Ilim = 0; cfg.init = B.steadyInit(p, Math.min(D0, 0.99)); }
      cfg.D0 = D0; return Object.assign(cfg, extra || {});
    }
    function vinOf(r) { var s = st.spec; return r.vin !== "" && isFinite(parseFloat(r.vin)) ? parseFloat(r.vin) : st.simVin === "min" ? s.Vinmin : st.simVin === "max" ? s.Vinmax : s.Vinnom; }
    function run() {
      var busy = el.querySelector(".run-busy"); if (!busy) return; busy.textContent = "กำลังจำลอง…";
      setTimeout(function () {
        var s = st.spec, q = parts(), Ts = 1 / s.fs, prog = st.prog.map(function (r) { return { dur: Math.max(r.dur, 0.5) * 1e-3, R: r.kind === "R" ? Math.max(r.val, 0.01) : 0, I: r.kind === "I" ? r.val : 0, Vg: vinOf(r) }; });
        var total = prog.reduce(function (a, r) { return a + r.dur; }, 0), nPer = Math.round(total / Ts), note = "";
        if (nPer > 90000) { note = "โปรแกรมยาวเกินไปสำหรับ fs นี้ — ตัดที่ " + Math.round(90000 * Ts * 1e3) + " ms"; nPer = 90000; }
        var p0 = pFor(prog[0].Vg, prog[0].R || s.Vo / s.Iomax), cfg = simCfg(p0, prog, { nPer: nPer });
        var t0 = performance.now(), r = B.simulate(cfg); res.run = r; res.prog = prog; res.cfg = cfg;
        busy.textContent = nPer + " คาบสวิตช์ ใน " + Math.round(performance.now() - t0) + " ms" + (note ? " · " + note : "");
        drawRun();
      }, 20);
    }
    function drawRun() {
      var r = res.run, prog = res.prog, s = st.spec, q = parts(), Ts = r.Ts, nP = r.nPer, k, t = new Array(nP);
      for (k = 0; k < nP; k++) t[k] = (k + 0.5) * Ts * 1e3;
      var bands = [], acc = 0; prog.forEach(function (p, i) { var x0 = acc * 1e3; acc += p.dur; bands.push({ x0: x0, x1: acc * 1e3, cls: i % 2 ? "idle" : "on", label: (p.R ? num(p.R, 3) + " Ω" : num(p.I, 3) + " A") + " · " + num(p.Vg, 3) + " V" }); });
      var arr = function (a) { return Array.prototype.slice.call(a); };
      var ex = { xlabel: "เวลา (ms)", xmin: 0, xmax: nP * Ts * 1e3, bands: bands, xname: "t", xfmt: function (x) { return num(x, 4) + " ms"; } };
      U.draw(el.querySelector(".f-vo"), Object.assign({}, ex, { title: "แรงดันขาออก Vo (V)", ylabel: "V", ymin: 0, ymax: s.Vo * 1.25, yfmt: function (y) { return num(y, 4) + " V"; },
        series: [{ x: t, y: arr(r.vMax), cls: "s4", w: 1, name: "ค่าสูงสุดรายคาบ" }, { x: t, y: arr(r.vMin), cls: "s4", w: 1 }, { x: t, y: arr(r.vMean), cls: "s1", w: 2.4, name: "Vo เฉลี่ยรายคาบ" }], hlines: [{ y: s.Vo, cls: "s2", label: "เป้า " + s.Vo + " V" }] }));
      var hl = [{ y: q.L.Isat, cls: "s2", label: "Isat = " + q.L.Isat + " A" }]; if (st.ctrl === "pcmc") hl.push({ y: st.Ilim, cls: "s1", label: "Ilim = " + st.Ilim + " A" });
      U.draw(el.querySelector(".f-il"), Object.assign({}, ex, { title: "กระแสตัวเหนี่ยวนำ iL (A) — สูงสุด / เฉลี่ย / ต่ำสุดรายคาบ", ylabel: "A", ymin: Math.min(0, Math.min.apply(null, arr(r.iLMin)) * 1.1), yfmt: function (y) { return num(y, 4) + " A"; },
        series: [{ x: t, y: arr(r.iLMax), cls: "s2", w: 1.6, name: "iL สูงสุด" }, { x: t, y: arr(r.iLMean), cls: "s3", w: 2.2, name: "iL เฉลี่ย" }, { x: t, y: arr(r.iLMin), cls: "s1", w: 1.6, name: "iL ต่ำสุด" }], hlines: hl }));
      U.draw(el.querySelector(".f-io"), Object.assign({}, ex, { title: "กระแสโหลด Io และกระแสอินพุตเฉลี่ย Ig (A)", ylabel: "A", ymin: 0, yfmt: function (y) { return num(y, 4) + " A"; },
        series: [{ x: t, y: arr(r.ioMean), cls: "s1", w: 2.2, name: "Io (โหลด)" }, { x: t, y: arr(r.igMean), cls: "s5", w: 1.8, name: "Ig (จากแหล่งจ่าย)" }, { x: t, y: arr(r.dEff), cls: "s3", w: 1.4, dash: true, name: "ดิวตี้จริง (×1 A)" }] }));
      // per-slot stats
      var segs = [], i;
      for (i = 0; i < prog.length; i++) segs.push({ k0: Infinity, k1: -1 });
      for (k = 0; k < nP; k++) { var sg = segs[r.seg[k]]; if (sg) { if (k < sg.k0) sg.k0 = k; if (k > sg.k1) sg.k1 = k; } }
      var rows = [], bad = 0, warn = 0;
      segs.forEach(function (sg, i2) {
        if (sg.k1 < 0) return;
        var k0 = sg.k0, k1 = sg.k1 + 1, ks = Math.max(k0, Math.floor(k1 - 0.4 * (k1 - k0)) - 0), p = prog[i2], A = function (a) { return B.avg(a, ks, k1); };
        var Vo = A(r.vMean), Io = A(r.ioMean), Pout = A(r.pout), Pin = A(r.pin), idle = A(r.idle), lim = A(r.limited), ilMin = Infinity, ilMax = -Infinity, vpp, vmx = -Infinity, vmn = Infinity, tpk = 0, vlo = Infinity, vhi = -Infinity, j;
        for (j = ks; j < k1; j++) { ilMax = Math.max(ilMax, r.iLMax[j]); ilMin = Math.min(ilMin, r.iLMin[j]); vmx = Math.max(vmx, r.vMax[j]); vmn = Math.min(vmn, r.vMin[j]); }
        for (j = k0; j < k1; j++) { tpk = Math.max(tpk, r.iLMax[j]); vlo = Math.min(vlo, r.vMean[j]); vhi = Math.max(vhi, r.vMean[j]); }
        var pp = p.Vg, Psw = 0.5 * pp * Io * q.Q.tsw * s.fs + q.Q.Qg * 5 * s.fs + (q.Dd.kind === "sync" ? 0 : q.Dd.Qrr * pp * s.fs) + 0.5 * q.Q.Coss * pp * pp * s.fs;
        var half = Math.max(ks + 1, Math.floor((ks + k1) / 2)), vA = B.avg(r.vMean, ks, half), vB = B.avg(r.vMean, half, k1), settled = Math.abs(vB - vA) <= 0.01 * Math.max(Vo, 1e-6);
        var eta = settled ? Pout / (Pin + Psw) : NaN, L = A(r.pRon), D_ = A(r.pDio), Cu = A(r.pCu), Es = A(r.pEsr);
        var mode = q.Dd.kind === "sync" ? (ilMin < 0 ? "FCCM (iL ติดลบ)" : "CCM") : idle > 0.01 ? "DCM (" + num(idle * 100, 2) + " % ว่าง)" : "CCM";
        var flags = [], level = "ok";
        if (Vo < 0.97 * s.Vo) { flags.push("แรงดันตก " + num((1 - Vo / s.Vo) * 100, 3) + " %"); level = "bad"; }
        if (st.ctrl === "open" && Math.abs(Vo / s.Vo - 1) > 0.03) { flags.push("Vo เบี่ยง " + num((Vo / s.Vo - 1) * 100, 3) + " % (ไม่มีป้อนกลับ)"); if (level === "ok") level = "warn"; }
        if (lim > 0.3) { flags.push("ชนขีดจำกัดกระแส"); level = "bad"; }
        if (ilMax > q.L.Isat) { flags.push("L อิ่มตัว (iL " + num(ilMax, 3) + " > Isat " + q.L.Isat + " A)"); level = "bad"; }
        else if (tpk > q.L.Isat) { flags.push("พีกชั่วขณะเกิน Isat"); if (level === "ok") level = "warn"; }
        if (Io > q.f.Id * 0.5 || ilMax > q.f.Id * 0.5) { flags.push("กระแสเกินครึ่งพิกัด MOSFET"); if (level === "ok") level = "warn"; }
        if (Io > q.Dd.If && q.Dd.kind !== "sync") { flags.push("เกินพิกัดไดโอด"); level = "bad"; }
        if (!settled) { flags.push("แรงดันยังไม่นิ่งในช่วงนี้ (ยืดเวลาช่วงนี้ให้ยาวขึ้น)"); if (level === "ok") level = "warn"; }
        if (level === "bad") bad++; else if (level === "warn") warn++;
        rows.push('<tr class="' + (level === "ok" ? "" : level) + '"><td>' + (i2 + 1) + "</td><td>" + (p.R ? num(p.R, 3) + " Ω" : num(p.I, 3) + " A") + "<br>" + num(p.Vg, 3) + " V</td><td>" + num(Vo, 4) + " V<br>pp " + num((vmx - vmn) * 1e3, 3) + " mV</td><td>" + num(Io, 3) + " A<br>" + num(Pout, 3) + " W</td><td>" + mode + "</td><td>" + num(ilMax, 3) + " A<br>ชั่วขณะ " + num(tpk, 3) + "</td><td>" + num(vlo, 4) + " – " + num(vhi, 4) + " V</td><td>" + (isFinite(eta) ? num(eta * 100, 3) + " %" : "–") + "<br>" + num(L + D_ + Cu + Es + Psw, 3) + " W</td><td>" + (flags.length ? flags.join("<br>") : "✓ ปกติ") + "</td></tr>");
      });
      el.querySelector(".dz-seg").innerHTML = '<table class="bk-t"><thead><tr><th>ช่วง</th><th>โหลด · Vin</th><th>Vo (สภาวะคงตัว)</th><th>Io · Pout</th><th>โหมด</th><th>iL สูงสุด</th><th>ช่วง Vo ตลอดช่วง</th><th>η · P สูญเสีย</th><th>ผลตรวจ</th></tr></thead><tbody>' + rows.join("") + "</tbody></table>" +
        '<p class="bk-note">สภาวะคงตัววัดจาก 40 % ท้ายของแต่ละช่วง · η รวมสูญเสียสวิตช์ (คำนวณ) · ช่วงที่ 1 มีการสตาร์ทแบบ soft-start (' + (st.ctrl === "pcmc" ? "1.5 ms" : "open loop สตาร์ทจากสภาวะคงตัวทฤษฎี") + ")</p>";
      var verdict = bad ? '<span class="bk-fail">✗ มี ' + bad + " ช่วงที่ไม่ผ่าน</span>" : warn ? '<span class="bk-warnc">⚠ ผ่านแต่มี ' + warn + " ช่วงที่ควรระวัง</span>" : '<span class="bk-pass">✓ ผ่านทุกช่วง</span>';
      el.querySelector(".dz-status").innerHTML = verdict + " · " + (st.ctrl === "pcmc" ? "Peak current mode: Kp = " + num(res.cfg.ctrl.Kp, 3) + " A/V, Ki = " + num(res.cfg.ctrl.Ki, 3) + " A/(V·s), slope comp = " + num(res.cfg.ctrl.ma / 1e3, 3) + " A/ms" : "Open loop: ตั้ง D = " + num(res.cfg.D0, 4) + " (คำนวณให้ได้ " + s.Vo + " V ที่ Vin ปกติและโหลด " + s.Iomax + " A)");
    }

    // ---------------------------------------------------------------- capability sweep
    function capSweep(button) {
      var busy = el.querySelector(".cap-busy"); busy.textContent = "กำลังวัด…"; button.disabled = true;
      setTimeout(function () {
        var s = st.spec, q = parts(), Vin = st.simVin === "min" ? s.Vinmin : st.simVin === "max" ? s.Vinmax : s.Vinnom, Ts = 1 / s.fs, N = 22, pts = [], i, t0 = performance.now();
        for (i = 0; i < N; i++) {
          var Io = s.Iomax * (0.04 + (2.2 - 0.04) * i / (N - 1)), R = s.Vo / Io, p = pFor(Vin, R), dur = 7e-3, nPer = Math.round(dur / Ts);
          var cfg = simCfg(p, [{ dur: dur, R: R, Vg: Vin }], { nPer: nPer }); if (st.ctrl === "open") cfg.init = B.steadyInit(p, cfg.D0 > 0.99 ? 0.99 : cfg.D0);
          var r = B.simulate(cfg), k0 = Math.floor(nPer * 0.6), A = function (a) { return B.avg(a, k0, nPer); }, Vo = A(r.vMean), Ioo = A(r.ioMean), pk = 0, k;
          for (k = k0; k < nPer; k++) pk = Math.max(pk, r.iLMax[k]);
          var Psw = 0.5 * Vin * Ioo * q.Q.tsw * s.fs + q.Q.Qg * 5 * s.fs + (q.Dd.kind === "sync" ? 0 : q.Dd.Qrr * Vin * s.fs) + 0.5 * q.Q.Coss * Vin * Vin * s.fs;
          pts.push({ Io: Ioo, Vo: Vo, pk: pk, eta: A(r.pout) / (A(r.pin) + Psw), lim: A(r.limited), d: A(r.dEff), idle: A(r.idle) });
        }
        busy.textContent = N + " จุด ใน " + Math.round(performance.now() - t0) + " ms · Vin = " + num(Vin, 3) + " V";
        button.disabled = false;
        var lost = null; pts.forEach(function (p, i2) { if (!lost && p.Vo < 0.98 * s.Vo && p.Io > 0.1) lost = i2; });
        var why = "", Ilost = null;
        if (lost != null) {
          var pt = pts[lost]; Ilost = lost > 0 ? pts[lost - 1].Io : pt.Io;
          why = pt.lim > 0.5 ? "ชนขีดจำกัดกระแส Ilim = " + st.Ilim + " A (ตัวควบคุมไม่อนุญาตให้จ่ายมากกว่านี้)" : pt.d > st.Dmax * 0.97 ? "ดิวตี้เต็ม Dmax = " + st.Dmax + " (Vin ต่ำเกินไปสำหรับโหลดนี้)" : pt.pk > q.L.Isat ? "ตัวเหนี่ยวนำอิ่มตัว (iL สูงสุด " + num(pt.pk, 3) + " A > Isat " + q.L.Isat + " A)" : st.ctrl === "open" ? "ไม่มีป้อนกลับ ค่าความต้านทานแฝงทำให้แรงดันตกตามโหลด (load regulation)" : "ความต้านทานรวมของวงจรทำให้ดิวตี้ไม่พอ";
        }
        var hiV = null; pts.forEach(function (p) { if (p.Vo > 1.03 * s.Vo && (hiV == null || p.Io > hiV)) hiV = p.Io; });
        var st2 = el.querySelector(".dz-capstat"); st2.hidden = false;
        st2.innerHTML = lost == null ? '<span class="bk-pass">✓ แรงดันคงที่ (≥ 98 %) ตลอดช่วงที่ไล่ถึง ' + num(pts[pts.length - 1].Io, 3) + " A</span> — กระแสโหลดสูงสุดที่ทดสอบ " + num(pts[pts.length - 1].Io / s.Iomax, 3) + "× ของที่ออกแบบ" : '<span class="bk-fail">แรงดันเริ่มตกต่ำกว่า 98 % หลังกระแส ≈ ' + num(Ilost, 3) + " A</span> (" + num(Ilost / s.Iomax, 3) + "× ของ Io,max) · สาเหตุ: " + why;
        if (hiV != null) st2.innerHTML += '<br><span class="bk-warnc">⚠ แรงดันสูงกว่าเป้า 3 % เมื่อโหลดเบากว่า ' + num(hiV, 3) + " A — เข้า DCM แล้วดิวตี้คงที่ให้แรงดันสูงขึ้น (open loop)</span>";
        var xs = pts.map(function (p) { return p.Io; }), base = { xlabel: "กระแสโหลด Io (A)", xmin: 0, xmax: xs[xs.length - 1], xname: "Io", xfmt: function (x) { return num(x, 3) + " A"; } };
        var band = lost != null ? [{ x0: 0, x1: Ilost, cls: "ok" }, { x0: Ilost, x1: xs[xs.length - 1], cls: "bad", label: "เสียการควบคุม" }] : [{ x0: 0, x1: xs[xs.length - 1], cls: "ok" }];
        U.draw(el.querySelector(".f-cv"), Object.assign({}, base, { title: "แรงดันขาออกเทียบกระแสโหลด (load line)", ylabel: "Vo (V)", ymin: 0, ymax: s.Vo * 1.3, bands: band, yfmt: function (y) { return num(y, 4) + " V"; },
          series: [{ x: xs, y: pts.map(function (p) { return p.Vo; }), cls: "s1", w: 2.6, name: "Vo" }], hlines: [{ y: s.Vo * 0.98, cls: "s2", label: "98 %" }], vlines: [{ x: s.Iomax, cls: "s1", label: "Io,max" }], points: pts.map(function (p) { return { x: p.Io, y: p.Vo, cls: "s1", r: 3 }; }) }));
        var hl2 = [{ y: q.L.Isat, cls: "s2", label: "Isat" }]; if (st.ctrl === "pcmc") hl2.push({ y: st.Ilim, cls: "s1", label: "Ilim" });
        U.draw(el.querySelector(".f-ci"), Object.assign({}, base, { title: "กระแสตัวเหนี่ยวนำสูงสุด iL,pk เทียบกระแสโหลด", ylabel: "A", ymin: 0, yfmt: function (y) { return num(y, 4) + " A"; }, series: [{ x: xs, y: pts.map(function (p) { return p.pk; }), cls: "s2", w: 2.4, name: "iL,pk" }], hlines: hl2, vlines: [{ x: s.Iomax, cls: "s1", label: "Io,max" }] }));
        U.draw(el.querySelector(".f-ce"), Object.assign({}, base, { title: "ประสิทธิภาพ η (รวมสูญเสียสวิตช์) และสัดส่วนเวลาที่ว่าง (DCM)", ylabel: "%", ymin: 0, ymax: 100, yfmt: function (y) { return num(y, 3) + " %"; },
          series: [{ x: xs, y: pts.map(function (p) { return p.eta * 100; }), cls: "s3", w: 2.4, name: "η" }, { x: xs, y: pts.map(function (p) { return p.idle * 100; }), cls: "s4", dash: true, w: 1.8, name: "เวลาว่าง D₃ (DCM)" }], vlines: [{ x: s.Iomax, cls: "s1", label: "Io,max" }] }));
      }, 30);
    }

    // ---------------------------------------------------------------- events
    el.addEventListener("input", function (e) {
      var t = e.target, sk = t.dataset.sk, pk = t.dataset.pk, rk = t.dataset.r, tk = t.dataset.tk;
      if (tk) { var vt = parseFloat(t.value); if (isFinite(vt) && vt > 0) { st[tk] = vt; if (tk === "Ilim") st.ilimAuto = false; calc(); scheduleRun(); } }
      else if (sk) { var v = parseFloat(t.value); if (!isFinite(v) || v <= 0) return; st.spec[sk] = v * parseFloat(t.dataset.s); if (st.ilimAuto) { autoIlim(); var il = el.querySelector('[data-tk="Ilim"]'); if (il) il.value = st.Ilim; } calc(); scheduleRun(); }
      else if (t.dataset.pk === "ncap") { var nn = Math.min(8, Math.max(1, Math.round(parseFloat(t.value) || 1))); st.ncap = nn; infoLines(); calc(); scheduleRun(); }
      else if (rk) { var row = st.prog[+t.closest("tr").dataset.i], v2 = parseFloat(t.value); if (rk === "vin") row.vin = t.value === "" ? "" : v2; else if (isFinite(v2) && v2 > 0) row[rk] = v2; scheduleRun(); }
    });
    el.addEventListener("change", function (e) {
      var t = e.target;
      if (t.dataset.pk && t.dataset.pk !== "ncap") { st[t.dataset.pk] = t.value; if (t.dataset.pk === "ind" && st.ilimAuto) { autoIlim(); var il = el.querySelector('[data-tk="Ilim"]'); if (il) il.value = st.Ilim; } infoLines(); calc(); scheduleRun(); }
      else if (t.dataset.ck) { st[t.dataset.ck] = t.value; scheduleRun(); }
      else if (t.dataset.r === "kind") { st.prog[+t.closest("tr").dataset.i].kind = t.value; scheduleRun(); }
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var s = st.spec;
      if (b.dataset.spec) { loadSpec(b.dataset.spec); render(); }
      else if (b.dataset.act === "pick") { autoPick(); render(); }
      else if (b.dataset.act === "run") run();
      else if (b.dataset.act === "cap") capSweep(b);
      else if (b.dataset.act === "addrow") { st.prog.push({ dur: 8, kind: "R", val: s.Vo / s.Iomax, vin: "" }); renderRows(); scheduleRun(); }
      else if (b.dataset.act === "del") { st.prog.splice(+b.closest("tr").dataset.i, 1); if (!st.prog.length) st.prog.push({ dur: 10, kind: "R", val: s.Vo / s.Iomax, vin: "" }); renderRows(); scheduleRun(); }
      else if (b.dataset.act && b.dataset.act.indexOf("prog-") === 0) {
        var Rn = s.Vo / s.Iomax, k = b.dataset.act.slice(5), mk = function (d, R, v) { return { dur: d, kind: "R", val: r3(R), vin: v == null ? "" : v }; };
        st.prog = k === "std" ? mkProg(SPECS[specKey].prog, s) : k === "light" ? [mk(10, Rn), mk(8, Rn * 20), mk(8, Rn), mk(8, Rn * 50), mk(8, Rn), mk(8, Rn * 8)] : k === "over" ? [mk(10, Rn), mk(8, Rn / 1.5), mk(8, Rn / 2.5), mk(8, Rn / 5), mk(10, Rn)] : [mk(8, Rn), mk(8, Rn, s.Vinmin), mk(8, Rn, s.Vinmax), mk(8, Rn, s.Vinmin), mk(8, Rn)];
        renderRows(); scheduleRun();
      }
    });
    el.bkApi = { preset: function (name, ds) {
      if (SPECS[name]) { loadSpec(name); }
      var sp = st.spec, Rn = sp.Vo / sp.Iomax, mk = function (d, R, v) { return { dur: d, kind: "R", val: r3(R), vin: v == null ? "" : v }; };
      if (ds && ds.bkProg) { var k = ds.bkProg; st.prog = k === "std" ? mkProg(SPECS[specKey].prog, sp) : k === "light" ? [mk(10, Rn), mk(8, Rn * 20), mk(8, Rn), mk(8, Rn * 50), mk(8, Rn), mk(8, Rn * 8)] : k === "over" ? [mk(10, Rn), mk(8, Rn / 1.5), mk(8, Rn / 2.5), mk(8, Rn / 5), mk(10, Rn)] : [mk(8, Rn), mk(8, Rn, sp.Vinmin), mk(8, Rn, sp.Vinmax), mk(8, Rn, sp.Vinmin), mk(8, Rn)]; }
      if (ds && ds.bkCtrl) st.ctrl = ds.bkCtrl;
      if (ds && ds.bkInd) st.ind = ds.bkInd; if (ds && ds.bkDio) st.dio = ds.bkDio; if (ds && ds.bkCap) { st.cap = ds.bkCap; if (ds.bkN) st.ncap = +ds.bkN; } if (ds && ds.bkFet) st.fet = ds.bkFet;
      if (ds && ds.bkInd && st.ilimAuto) autoIlim();
      render();
    } };
    loadSpec(specKey); render();
  }
  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".bk-design"), function (el) { if (el.bkInit) return; el.bkInit = 1; el.classList.add("bk-lab", "bk-ready"); try { init(el); } catch (e) { el.textContent = "แล็บโหลดไม่สำเร็จ: " + e.message; console.error(e); } }); }
  function btn(act, label) { return '<button type="button" class="btn btn-ghost btn-sm" data-act="' + act + '">' + label + "</button>"; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
