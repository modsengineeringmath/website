/* Virtual instrumentation & control lab for /learn/sensors-transducers/instrumentation-lab/ — needs ee-kit.js first.
   <div class="sx-plant" [data-preset="level-pid"] [data-compact]></div>
   Process (teaching model, integrated with a fixed 0.1 s step × speed):
     open vertical tank A = 0.5 m², height 3 m; inflow from a VFD pump Q_in = 20 m³/h × speed (VFD ramp τ = 5 s); outlet control valve Q_out = Kv·u·√h (Kv = 9.8);
     heater 0–150 kW, inlet water 30 °C, ρ = 998 kg/m³ (process density can be changed by a fault), cp = 4186 J/(kg·K), losses UA = 250 W/K to 30 °C.
   Instruments: LT-101 DP level 0–3 m, FT-102 magmeter 0–15 m³/h on the outlet, PT-103 pump discharge 0–6 bar, TT-104 Pt100 + transmitter 0–100 °C (τ = 15 s).
   Every transmitter sends 4–20 mA with NAMUR NE 43 limits (3.8–20.5 mA saturation, ≤ 3.6 / ≥ 21 mA alarm). The PLC scales, alarms and runs two PID loops:
     LIC-101 → pump speed (SC-101), TIC-104 → heater. LAHH-101 trips the pump. Bad quality (NE 43) puts a loop in manual with the last output.
   <button data-plant-preset="name"> loads a preset; <button data-plant-fault="name"> injects a fault. Presets in PRESETS below. */
(function (root) {
  "use strict";
  var K = root.EEKit;
  var n = K.n, ok = K.ok, warn = K.warn;
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var AREA = 0.5, HMAX = 3, QMAX = 20, TAU_VFD = 5, KV = 9.8, CP = 4186, UA = 250, TIN = 30, PHMAX = 150e3;
  var TX = {
    LT: { tag: "LT-101", name: "ระดับ (DP)", lrv: 0, urv: 3, u: "m", tau: 1 },
    FT: { tag: "FT-102", name: "อัตราไหลขาออก (แม่เหล็กไฟฟ้า)", lrv: 0, urv: 15, u: "m³/h", tau: 0.5 },
    PT: { tag: "PT-103", name: "ความดันขาออกปั๊ม", lrv: 0, urv: 6, u: "bar", tau: 0.3 },
    TT: { tag: "TT-104", name: "อุณหภูมิ (Pt100)", lrv: 0, urv: 100, u: "°C", tau: 15 }
  };
  var FAULTS = [
    ["none", "ไม่มีความผิดพลาด"], ["lt-drift", "LT-101 ค่าศูนย์เลื่อน +6 %"], ["lt-open", "LT-101 สายขาด"], ["lt-density", "ของเหลวหนักขึ้น SG 1.10"],
    ["lt-noise", "LT-101 สัญญาณสั่น (คลื่นผิวน้ำ)"], ["ft-air", "FT-102 ฟองอากาศในท่อ"], ["tt-burnout", "TT-104 เซนเซอร์ขาด (แจ้งด้านสูง)"],
    ["valve-stuck", "วาล์ว FV-102 ค้าง"], ["pump-trip", "ปั๊มทริป (โอเวอร์โหลด)"]
  ];
  var PRESETS = {
    "level-pid": { t: "ควบคุมระดับด้วย PID", sp: 50, kp: 8, ti: 300, td: 0, auto: true, valve: 50, h: 0.9, tsp: 40, tauto: false, heat: 0, fault: "none", speed: 10 },
    "manual": { t: "เริ่มแบบ manual", sp: 50, kp: 8, ti: 300, td: 0, auto: false, mv: 25, valve: 50, h: 1.2, tsp: 40, tauto: false, heat: 0, fault: "none", speed: 10 },
    "aggressive": { t: "จูนแรงเกิน (แกว่ง)", sp: 60, kp: 12, ti: 8, td: 0, auto: true, valve: 50, h: 0.9, tsp: 40, tauto: false, heat: 0, fault: "none", speed: 10 },
    "heat": { t: "ควบคุมระดับ + อุณหภูมิ", sp: 50, kp: 8, ti: 300, td: 0, auto: true, valve: 40, h: 1.5, tsp: 45, tauto: true, heat: 0, fault: "none", speed: 10 },
    "density": { t: "ความหนาแน่นเปลี่ยน", sp: 50, kp: 8, ti: 300, td: 0, auto: true, valve: 50, h: 1.5, tsp: 40, tauto: false, heat: 0, fault: "lt-density", speed: 10 },
    "open-wire": { t: "สายขาดขณะควบคุม", sp: 50, kp: 8, ti: 300, td: 0, auto: true, valve: 50, h: 1.5, tsp: 40, tauto: false, heat: 0, fault: "none", speed: 10, later: "lt-open" }
  };

  function nemA(frac) { return Math.min(Math.max(4 + 16 * frac, 3.8), 20.5); }
  function quality(mA) { return mA <= 3.6 || mA >= 21 ? "BAD" : mA < 3.8 || mA > 20.5 ? "UNCERTAIN" : "GOOD"; }

  function PID(o) { this.kp = o.kp; this.ti = o.ti; this.td = o.td; this.i = o.mv || 0; this.prev = null; this.out = o.mv || 0; }
  PID.prototype.step = function (sp, pv, dt) {
    var e = sp - pv, p = this.kp * e, d = 0;
    if (this.prev != null && this.td > 0) d = -this.kp * this.td * (pv - this.prev) / dt; // derivative on PV
    this.prev = pv;
    var ii = this.ti > 0 ? this.i + this.kp * e * dt / this.ti : this.i, u = p + ii + d;
    if (u > 100) { u = 100; if (e < 0) this.i = ii; } else if (u < 0) { u = 0; if (e > 0) this.i = ii; } else this.i = ii; // conditional integration (anti-windup)
    this.out = u; return u;
  };
  PID.prototype.track = function (mv, pv, sp) { this.i = sp != null ? mv - this.kp * (sp - pv) : mv; this.out = mv; this.prev = pv; }; // bumpless: integral absorbs the manual output

  function build(host) {
    var compact = host.hasAttribute("data-compact");
    host.classList.add("sx-plant-wrap");
    host.innerHTML = '<div class="sx-plant-top"><div class="sx-plant-fig"></div><div class="sx-plant-face"></div></div><div class="sx-plant-trend"></div>' +
      '<div class="sx-plant-alarm" aria-live="polite"></div>' + (compact ? "" : '<details class="sx-plant-mb"><summary>รีจิสเตอร์ Modbus TCP ของ PLC (อัปเดตสด)</summary><div class="sx-plant-reg table-wrap"></div></details>');
    var fig = host.querySelector(".sx-plant-fig"), face = host.querySelector(".sx-plant-face"), trend = host.querySelector(".sx-plant-trend"), alarm = host.querySelector(".sx-plant-alarm"), reg = host.querySelector(".sx-plant-reg");

    var S = {};
    function reset(pname) {
      var P = PRESETS[pname] || PRESETS["level-pid"];
      S = { t: 0, h: P.h, T: 32, valve: P.valve, vEff: P.valve, heat: P.heat, sg: 1.0, fault: P.fault, later: P.later, laterAt: 60, speed: P.speed, run: true,
        sp: P.sp, auto: P.auto, mv: P.mv != null ? P.mv : 40, tsp: P.tsp, tauto: P.tauto, trip: false, spd: (P.mv != null ? P.mv : 40) / 100, hist: [], f: { LT: 0, FT: 0, PT: 0, TT: 32 }, mA: {}, pv: {}, q: {}, damp: 1, acc: 0, last: null, preset: pname };
      S.lic = new PID({ kp: P.kp, ti: P.ti, td: P.td, mv: S.mv }); S.tic = new PID({ kp: 4, ti: 120, td: 0, mv: 0 });
      S.f.LT = S.h; S.f.TT = S.T;
      if (face._sync) face._sync();
    }

    // ------------------------------------------------ physics + instruments (dt = 0.1 s simulated)
    function step(dt) {
      var pumpOn = !S.trip && S.fault !== "pump-trip";
      S.spd += ((pumpOn ? S.mv / 100 : 0) - S.spd) * Math.min(1, dt / TAU_VFD);
      var speed = S.spd;
      var qin = QMAX * speed, rho = 998 * S.sg;
      if (S.fault !== "valve-stuck") S.vEff += (S.valve - S.vEff) * Math.min(1, dt / 2); // valve stroke ~2 s
      var qout = KV * (S.vEff / 100) * Math.sqrt(Math.max(S.h, 0));
      S.h = Math.min(Math.max(S.h + (qin - qout) / 3600 * dt / AREA, 0), HMAX);
      if (S.h >= HMAX) qout = Math.max(qout, qin); // overflow
      var V = Math.max(S.h * AREA, 0.05), mdot = qin / 3600 * rho, Ph = S.heat / 100 * PHMAX * (S.h > 0.2 ? 1 : 0);
      S.T += (mdot * CP * (TIN - S.T) + Ph - UA * (S.T - 30)) / (rho * CP * V) * dt;
      var pdis = pumpOn ? Math.max(0, 4.5 * speed * speed - qin * qin / 300 + 0.03 * (Math.random() - 0.5)) : 0;
      // true values seen by each sensor
      var meas = {
        LT: S.h * S.sg + (S.fault === "lt-noise" ? 0.06 * Math.sin(S.t * 2.1) + 0.04 * (Math.random() - 0.5) : 0) + (S.fault === "lt-drift" ? 0.06 * HMAX : 0),
        FT: qout * (S.fault === "ft-air" ? 0.9 + 0.3 * (Math.random() - 0.5) : 1) + 0.05 * (Math.random() - 0.5),
        PT: pdis, TT: S.T
      };
      Object.keys(TX).forEach(function (k) {
        var tau = k === "LT" ? S.damp : TX[k].tau;
        S.f[k] += (meas[k] - S.f[k]) * (tau > 0 ? Math.min(1, dt / tau) : 1);
        var c = TX[k], mA = nemA((S.f[k] - c.lrv) / (c.urv - c.lrv));
        if (k === "LT" && S.fault === "lt-open") mA = 0;
        if (k === "TT" && S.fault === "tt-burnout") mA = 21.5;
        S.mA[k] = mA; S.q[k] = quality(mA); S.pv[k] = c.lrv + (mA - 4) / 16 * (c.urv - c.lrv);
      });
      S.qin = qin; S.qout = qout; S.pdis = pdis;
      // PLC
      var lpct = (S.pv.LT - TX.LT.lrv) / (TX.LT.urv - TX.LT.lrv) * 100;
      S.lpct = lpct;
      if (S.q.LT === "BAD") { if (S.auto) { S.auto = false; S.badSwitch = true; } }
      if (S.auto) S.mv = S.lic.step(S.sp, lpct, dt); else S.lic.track(S.mv, lpct, S.sp);
      if (lpct >= 95 && S.q.LT !== "BAD") S.trip = true;
      if (S.trip && lpct < 80) S.trip = false;
      if (S.tauto && S.q.TT !== "BAD") S.heat = S.tic.step(S.tsp, S.pv.TT, dt);
      else { if (S.q.TT === "BAD") S.heat = 0; S.tic.track(S.heat, S.pv.TT, S.tsp); }
      if (S.later && S.t > S.laterAt) { S.fault = S.later; S.later = null; if (face._sync) face._sync(); }
      S.t += dt;
      if (!S.hist.length || S.t - S.hist[S.hist.length - 1].t >= 1) {
        S.hist.push({ t: S.t, sp: S.sp, pv: lpct, mv: S.mv, real: S.h / HMAX * 100, T: S.pv.TT, heat: S.heat });
        if (S.hist.length > 600) S.hist.shift();
      }
    }

    // ------------------------------------------------ drawing
    function bubble(x, y, tag, k) {
      return '<g class="pl-inst" data-k="' + k + '"><circle cx="' + x + '" cy="' + y + '" r="23"/><line x1="' + (x - 23) + '" x2="' + (x + 23) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text x="' + x + '" y="' + (y - 5) + '" text-anchor="middle" class="pl-tg">' + tag.split("-")[0] + '</text><text x="' + x + '" y="' + (y + 14) + '" text-anchor="middle" class="pl-tg">' + tag.split("-")[1] + "</text>" +
        '<text x="' + x + '" y="' + (y + 40) + '" text-anchor="middle" class="pl-ma" id="' + host._id + k + '">—</text></g>';
    }
    host._id = "pl" + Math.random().toString(36).slice(2, 7);
    var id = host._id;
    fig.innerHTML = '<svg class="pl-svg" viewBox="0 0 520 380" role="img" aria-label="แผนผังโรงงานจำลอง: ถัง ปั๊ม วาล์ว ฮีตเตอร์ และทรานสมิตเตอร์">' +
      // tank
      '<rect class="pl-tank" x="200" y="60" width="140" height="240" rx="8"/><rect class="pl-liq" id="' + id + 'liq" x="202" y="298" width="136" height="0"/>' +
      '<line class="pl-sp" id="' + id + 'spl" x1="196" x2="344" y1="180" y2="180"/>' +
      '<text class="pl-t" x="270" y="52" text-anchor="middle">TK-101 · 3 m · A 0.5 m²</text>' +
      '<text class="pl-big" id="' + id + 'lv" x="270" y="200" text-anchor="middle">—</text>' +
      // inlet pump line
      '<polyline class="pl-pipe" points="10,330 80,330"/><circle class="pl-pump" id="' + id + 'pump" cx="100" cy="330" r="18"/><path class="pl-pumpv" d="M92 320 L112 330 L92 340Z"/>' +
      '<polyline class="pl-pipe" points="118,330 150,330 150,40 270,40 270,62"/><text class="pl-t" x="100" y="368" text-anchor="middle">P-101 + VFD</text>' +
      '<text class="pl-t" id="' + id + 'qin" x="160" y="30">—</text>' +
      // outlet with valve
      '<polyline class="pl-pipe" points="270,300 270,345 360,345"/><path class="pl-valve" id="' + id + 'vlv" d="M360 335 L380 345 L360 355Z M400 335 L380 345 L400 355Z"/><line class="pl-pipe2" x1="380" y1="345" x2="380" y2="325"/><rect class="pl-act" x="370" y="313" width="20" height="12" rx="3"/>' +
      '<polyline class="pl-pipe" points="400,345 515,345"/><text class="pl-t" x="380" y="372" text-anchor="middle">FV-102</text>' +
      // heater
      '<path class="pl-heat" id="' + id + 'heat" d="M225 270 q8 -14 16 0 q8 14 16 0 q8 -14 16 0 q8 14 16 0 q8 -14 16 0 q8 14 16 0"/><text class="pl-t" x="270" y="292" text-anchor="middle">E-104 ฮีตเตอร์</text>' +
      // instrument bubbles + impulse lines
      '<line class="pl-sig" x1="340" y1="285" x2="410" y2="285"/>' + bubble(433, 285, "LT-101", "LT") +
      '<line class="pl-sig" x1="455" y1="345" x2="455" y2="215"/>' + bubble(455, 192, "FT-102", "FT") +
      '<line class="pl-sig" x1="150" y1="250" x2="100" y2="250"/>' + bubble(77, 250, "PT-103", "PT") +
      '<line class="pl-sig" x1="340" y1="230" x2="410" y2="150"/>' + bubble(433, 130, "TT-104", "TT") +
      '<g class="pl-plc"><rect x="10" y="80" width="120" height="96" rx="8"/><text x="70" y="100" text-anchor="middle" class="pl-tg">PLC / DCS</text><text x="70" y="120" text-anchor="middle" class="pl-t">LIC-101 → SC-101</text>' +
      '<text x="70" y="138" text-anchor="middle" class="pl-t">TIC-104 → E-104</text><text x="70" y="160" text-anchor="middle" class="pl-ma" id="' + id + 'mode">—</text></g>' +
      "</svg>";

    // faceplate
    face.innerHTML =
      '<div class="pl-fp"><b>LIC-101 ระดับ</b><div class="pl-pv"><span id="' + id + 'pvL">—</span> %</div>' +
      '<label>SP <input type="range" min="5" max="90" step="1" data-k="sp"> <output data-o="sp"></output> %</label>' +
      '<div class="pl-btns"><button type="button" data-k="auto">AUTO</button><button type="button" data-k="man">MAN</button></div>' +
      '<label>MV ปั๊ม <input type="range" min="0" max="100" step="1" data-k="mv"> <output data-o="mv"></output> %</label>' +
      '<div class="pl-tune"><label>Kp <input data-k="kp" size="4"></label><label>Ti (s) <input data-k="ti" size="4"></label><label>Td (s) <input data-k="td" size="4"></label><label>damping LT (s) <input data-k="damp" size="4"></label></div></div>' +
      '<div class="pl-fp"><b>TIC-104 อุณหภูมิ</b><div class="pl-pv"><span id="' + id + 'pvT">—</span> °C</div>' +
      '<label>SP <input type="range" min="30" max="70" step="0.5" data-k="tsp"> <output data-o="tsp"></output> °C</label>' +
      '<div class="pl-btns"><button type="button" data-k="tauto">AUTO</button><button type="button" data-k="tman">MAN</button></div>' +
      '<label>ฮีตเตอร์ <input type="range" min="0" max="100" step="1" data-k="heat"> <output data-o="heat"></output> %</label></div>' +
      '<div class="pl-fp"><b>กระบวนการ</b><label>วาล์วขาออก FV-102 (ภาระรบกวน) <input type="range" min="0" max="100" step="1" data-k="valve"> <output data-o="valve"></output> %</label>' +
      '<label>ความผิดพลาด <select data-k="fault">' + FAULTS.map(function (f) { return '<option value="' + f[0] + '">' + f[1] + "</option>"; }).join("") + "</select></label>" +
      '<label>สถานการณ์ <select data-k="preset">' + Object.keys(PRESETS).map(function (p) { return '<option value="' + p + '">' + PRESETS[p].t + "</option>"; }).join("") + "</select></label>" +
      '<div class="pl-btns"><button type="button" data-k="run">⏸ หยุด</button><select data-k="speed" aria-label="ความเร็วจำลอง"><option value="1">×1</option><option value="5">×5</option><option value="10">×10</option><option value="30">×30</option></select><button type="button" data-k="reset">รีเซ็ต</button></div></div>';
    var q = function (k) { return face.querySelector('[data-k="' + k + '"]'); }, o = function (k) { return face.querySelector('[data-o="' + k + '"]'); };
    face._sync = function () {
      ["sp", "mv", "tsp", "heat", "valve"].forEach(function (k) { q(k).value = Math.round(S[k] * 10) / 10; o(k).textContent = n(S[k], 0); });
      q("kp").value = S.lic.kp; q("ti").value = S.lic.ti; q("td").value = S.lic.td; q("damp").value = S.damp; q("fault").value = S.fault; q("speed").value = String(S.speed); q("preset").value = S.preset;
      q("auto").setAttribute("aria-pressed", S.auto); q("man").setAttribute("aria-pressed", !S.auto); q("tauto").setAttribute("aria-pressed", S.tauto); q("tman").setAttribute("aria-pressed", !S.tauto);
      q("mv").disabled = S.auto; q("heat").disabled = S.tauto;
    };
    ["sp", "mv", "tsp", "heat", "valve"].forEach(function (k) { q(k).addEventListener("input", function () { S[k] = +q(k).value; o(k).textContent = n(S[k], 0); }); });
    ["kp", "ti", "td"].forEach(function (k) { q(k).addEventListener("change", function () { var v = K.parse(q(k).value); if (isFinite(v) && v >= 0) S.lic[k] = v; }); });
    q("damp").addEventListener("change", function () { var v = K.parse(q("damp").value); if (isFinite(v) && v >= 0) S.damp = v; });
    q("auto").addEventListener("click", function () { if (S.q.LT === "BAD") return; S.lic.track(S.mv, S.lpct, S.sp); S.auto = true; S.badSwitch = false; face._sync(); });
    q("man").addEventListener("click", function () { S.auto = false; face._sync(); });
    q("tauto").addEventListener("click", function () { S.tic.track(S.heat, S.pv.TT, S.tsp); S.tauto = true; face._sync(); });
    q("tman").addEventListener("click", function () { S.tauto = false; face._sync(); });
    q("fault").addEventListener("change", function () { S.fault = q("fault").value; S.sg = S.fault === "lt-density" ? 1.1 : 1.0; });
    q("preset").addEventListener("change", function () { reset(q("preset").value); });
    q("speed").addEventListener("change", function () { S.speed = +q("speed").value; });
    q("run").addEventListener("click", function () { S.run = !S.run; q("run").textContent = S.run ? "⏸ หยุด" : "▶ เดินต่อ"; });
    q("reset").addEventListener("click", function () { reset(S.preset); });

    function render() {
      var lv = document.getElementById(id + "liq"), hpx = S.h / HMAX * 236;
      lv.setAttribute("y", 298 - hpx); lv.setAttribute("height", hpx);
      document.getElementById(id + "spl").setAttribute("y1", 298 - S.sp / 100 * 236); document.getElementById(id + "spl").setAttribute("y2", 298 - S.sp / 100 * 236);
      document.getElementById(id + "lv").textContent = n(S.h, 2) + " m จริง";
      document.getElementById(id + "qin").textContent = "Q_in " + n(S.qin, 2) + " m³/h";
      document.getElementById(id + "pump").setAttribute("class", "pl-pump" + (S.qin > 0.05 ? " on" : ""));
      document.getElementById(id + "heat").setAttribute("class", "pl-heat" + (S.heat > 1 ? " on" : ""));
      document.getElementById(id + "mode").textContent = (S.auto ? "LIC AUTO" : "LIC MAN") + (S.trip ? " · TRIP" : "");
      Object.keys(TX).forEach(function (k) {
        var e = document.getElementById(id + k); e.textContent = n(S.mA[k], 2) + " mA";
        e.setAttribute("class", "pl-ma" + (S.q[k] !== "GOOD" ? " bad" : ""));
      });
      document.getElementById(id + "pvL").textContent = S.q.LT === "BAD" ? "BAD" : n(S.lpct, 1);
      document.getElementById(id + "pvT").textContent = S.q.TT === "BAD" ? "BAD" : n(S.pv.TT, 1);
      if (!S.auto) { q("mv").value = S.mv; o("mv").textContent = n(S.mv, 0); }
      if (S.tauto) { q("heat").value = S.heat; o("heat").textContent = n(S.heat, 0); }
      q("auto").setAttribute("aria-pressed", S.auto); q("man").setAttribute("aria-pressed", !S.auto); q("mv").disabled = S.auto;
      if (S.auto) { q("mv").value = S.mv; o("mv").textContent = n(S.mv, 0); }
      // alarms
      var al = [];
      if (S.q.LT === "BAD") al.push(warn("LT-101 BAD (" + n(S.mA.LT, 2) + " mA ≤ 3.6) → LIC-101 สลับเป็น MAN ค้างเอาต์พุตเดิม"));
      if (S.q.TT === "BAD") al.push(warn("TT-104 BAD (" + n(S.mA.TT, 2) + " mA ≥ 21) → อินเตอร์ล็อกปิดฮีตเตอร์"));
      if (S.trip) al.push(warn("LAHH-101 ระดับ ≥ 95 % → ทริปปั๊ม (รีเซ็ตเองเมื่อ < 80 %)"));
      else if (S.lpct > 85 && S.q.LT !== "BAD") al.push(warn("LAH-101 ระดับสูง"));
      if (S.lpct < 15 && S.q.LT !== "BAD") al.push(warn("LAL-101 ระดับต่ำ"));
      if (S.pv.TT > 80 && S.q.TT !== "BAD") al.push(warn("TAH-104 อุณหภูมิสูง"));
      var diff = S.lpct - S.h / HMAX * 100;
      if (Math.abs(diff) > 3 && S.q.LT !== "BAD") al.push("ℹ ค่าที่ PLC เห็นต่างจากระดับจริง " + (diff > 0 ? "+" : "") + n(diff, 1) + " % — PID ควบคุม 'ค่าที่วัด' ไม่ใช่ระดับจริง");
      alarm.innerHTML = al.length ? al.join("<br>") : ok(true, "ไม่มีสัญญาณเตือน");
      // trend
      var H = S.hist, t1 = H.length ? H[H.length - 1].t : 0, t0 = Math.max(0, t1 - 300);
      var pick = function (key) { return H.filter(function (r) { return r.t >= t0; }).map(function (r) { return [(r.t - t1) / 60, Math.max(-5, Math.min(110, r[key]))]; }); };
      trend.innerHTML = K.chart({ w: 760, h: 230, xs: [-5, 0], ys: [0, 110], xt: [-5, -4, -3, -2, -1, 0], yt: [0, 25, 50, 75, 100], y2s: [0, 110], y2t: [], series: [
        { pts: pick("sp"), cls: "s4 dsh" }, { pts: pick("pv"), cls: "s1" }, { pts: pick("real"), cls: "s7 dsh" }, { pts: pick("mv"), cls: "s2" }, { pts: pick("T"), cls: "s6" }],
        legend: [["f4", "SP"], ["f1", "PV ที่วัด %"], ["f7", "ระดับจริง %"], ["f2", "MV ปั๊ม %"], ["f6", "อุณหภูมิ °C"]], xl: "เวลาจำลอง (นาที)", yl: "%  ·  °C", label: "เทรนด์ของลูปควบคุมระดับ" });
      // modbus map
      if (reg) {
        var rows = [["0–1", "LT-101 ระดับ (m) float32", S.pv.LT], ["2–3", "FT-102 อัตราไหล (m³/h) float32", S.pv.FT], ["4–5", "PT-103 ความดัน (bar) float32", S.pv.PT], ["6–7", "TT-104 อุณหภูมิ (°C) float32", S.pv.TT],
          ["8", "LIC-101 SP × 10 (%)", Math.round(S.sp * 10)], ["9", "LIC-101 MV × 10 (%)", Math.round(S.mv * 10)], ["10", "สถานะ บิต0 AUTO บิต1 TRIP บิต2 LT BAD บิต3 TT BAD", (S.auto ? 1 : 0) | (S.trip ? 2 : 0) | (S.q.LT === "BAD" ? 4 : 0) | (S.q.TT === "BAD" ? 8 : 0)]];
        reg.innerHTML = "<table><tr><th>รีจิสเตอร์ (0-based)</th><th>ข้อมูล</th><th>ค่า</th><th>ไบต์บนสาย</th></tr>" + rows.map(function (r) {
          var raw;
          if (/float/.test(r[1])) { var b = root.SXCalc ? root.SXCalc.f32bytes(r[2]) : [0, 0, 0, 0]; raw = b.map(function (x) { return (x < 16 ? "0" : "") + x.toString(16).toUpperCase(); }).join(" "); }
          else { var v = r[2] & 0xffff; raw = ((v >> 8) < 16 ? "0" : "") + (v >> 8).toString(16).toUpperCase() + " " + ((v & 255) < 16 ? "0" : "") + (v & 255).toString(16).toUpperCase(); }
          return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + (/float/.test(r[1]) ? n(r[2], 3) : r[2]) + '</td><td class="mono">' + raw + "</td></tr>";
        }).join("") + "</table>";
      }
    }

    var visible = true;
    if (root.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(host);
    function loop(ts) {
      if (S.last == null) S.last = ts;
      var real = Math.min((ts - S.last) / 1000, 0.25); S.last = ts;
      if (S.run && visible) {
        S.acc += real * S.speed;
        var k = 0; while (S.acc >= 0.1 && k < 400) { step(0.1); S.acc -= 0.1; k++; }
        if (!host._f || ts - host._f > 120) { render(); host._f = ts; }
      }
      requestAnimationFrame(loop);
    }
    reset(host.getAttribute("data-preset") || "level-pid");
    for (var i = 0; i < 20; i++) step(0.1);
    render();
    requestAnimationFrame(loop);
    host._preset = function (p) { reset(p); host.scrollIntoView({ behavior: "smooth", block: "start" }); };
    host._fault = function (f) { S.fault = f; S.sg = f === "lt-density" ? 1.1 : 1.0; face._sync(); };
  }

  K.onReady(function () {
    $$(".sx-plant").forEach(build);
    $$("button[data-plant-preset]").forEach(function (b) { b.addEventListener("click", function () { var p = document.querySelector(".sx-plant"); if (p && p._preset) p._preset(b.getAttribute("data-plant-preset")); }); });
    $$("button[data-plant-fault]").forEach(function (b) { b.addEventListener("click", function () { var p = document.querySelector(".sx-plant"); if (p && p._fault) { p._fault(b.getAttribute("data-plant-fault")); p.scrollIntoView({ behavior: "smooth", block: "start" }); } }); });
  });
  root.SXPlant = { PRESETS: PRESETS };
})(typeof window !== "undefined" ? window : globalThis);
