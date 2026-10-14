/* Motor starter simulator for /learn/motor-control/ (and /learn/en/motor-control/). Plain JS, no dependencies.
   <div class="mc-lab" data-mode="dol|fr|yd|soft|vfd" [data-modes="dol,fr,yd,soft,vfd"] [data-load="pump|conv|fan"] [data-compact]></div>
   <button data-mc-lab="yd" [data-mc-target="labId"]> switches a lab on the page to a mode.
   Motor: 7.5 kW 4-pole 400 V 50 Hz IE3, double-cage per-phase equivalent circuit (same parameters as scripts/mc_figs.py):
   In ≈ 14 A, Is/In ≈ 6.5, Ts/Tn ≈ 2.15, Tmax/Tn ≈ 3.0, 1471 rpm. Mechanics J·dω/dt = Tm − TL, 1 ms steps.
   Overload: thermal image dθ/dt = ((I/Ir)² − θ)/τ, trips at θ ≥ 1.44 (1.2·Ir), class 10 (τ ≈ 320 s). Labels follow <html lang>. */
(function () {
  "use strict";
  var EN = document.documentElement.lang === "en";
  var L = function (th, en) { return EN ? en : th; };
  var S3 = Math.sqrt(3), TAU = 2 * Math.PI;
  var MP = { V: 400 / S3, R1: 0.414, X1: 1.599, Xm: 34.33, Ro: 1.306, Xo: 0.585, Ri: 0.463, Xi: 2.199, ns: 1500 };
  // complex helpers
  function C(re, im) { return { re: re, im: im || 0 }; }
  function add(a, b) { return C(a.re + b.re, a.im + b.im); }
  function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function abs(a) { return Math.hypot(a.re, a.im); }
  function par(a, b) { return div(mul(a, b), add(a, b)); }
  // per-phase Y-equivalent motor at phase voltage V (V) and frequency f (Hz); slip s may be > 1 (plugging) or < 0 (generating)
  function motor(s, V, f) {
    var k = f / 50;
    if (Math.abs(s) < 1e-5) s = s < 0 ? -1e-5 : 1e-5;
    var Zo = C(MP.Ro / s, MP.Xo * k), Zi = C(MP.Ri / s, MP.Xi * k), Z2 = par(Zo, Zi), Zm = C(0, MP.Xm * k);
    var Z = add(C(MP.R1, MP.X1 * k), par(Zm, Z2)), I1 = div(C(V, 0), Z), E = sub(C(V, 0), mul(I1, C(MP.R1, MP.X1 * k))), I2 = div(E, Z2);
    var ws = TAU * MP.ns * k / 60, I2a = abs(I2);
    return { I: abs(I1), T: 3 * I2a * I2a * Z2.re / ws, pf: I1.re / abs(I1), P: 3 * V * I1.re };
  }
  var RATED = motor(0.0194, MP.V, 50), IN = RATED.I, TN = RATED.T, NN = 1500 * (1 - 0.0194);

  var LOADS = {
    pump: { n: L("ปั๊มหอยโข่ง (T ∝ n²)", "Centrifugal pump (T ∝ n²)"), J: 0.06, f: function (w, k) { var r = Math.abs(w) / (TAU * NN / 60); return k * TN * (0.12 + 0.88 * r * r); } },
    conv: { n: L("สายพานลำเลียง (แรงบิดคงที่)", "Conveyor (constant torque)"), J: 0.35, f: function (w, k) { return k * TN * (Math.abs(w) < 0.5 ? 1.25 : 1); } },
    fan: { n: L("พัดลมใหญ่ ความเฉื่อยสูง (T ∝ n²)", "Large fan, high inertia (T ∝ n²)"), J: 2.2, f: function (w, k) { var r = Math.abs(w) / (TAU * NN / 60); return k * TN * (0.05 + 0.95 * r * r); } },
  };
  var JM = 0.045;
  var MODES = {
    dol: L("สตาร์ทตรง DOL", "Direct-on-line"), fr: L("กลับทางหมุน", "Forward–reverse"), yd: L("สตาร์-เดลต้า", "Star–delta"), soft: L("ซอฟต์สตาร์ทเตอร์", "Soft starter"), vfd: L("อินเวอร์เตอร์ VFD", "VFD"),
  };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(v, d) { return isFinite(v) ? v.toFixed(d) : "—"; }

  function Lab(host) {
    var st = {
      mode: host.getAttribute("data-mode") || "dol", load: host.getAttribute("data-load") || "pump", lk: +(host.getAttribute("data-lk") || 0.7),
      tY: 6, dead: 0.06, ramp: 8, ilim: 3.0, v0: 35, acc: 5, fset: 50, ir: IN, ph: false, plug: false,
      w: 0, t: 0, K1: false, K2: false, K3: false, KR: false, timer: 0, timing: false, deadT: 0, trip: false, theta: 0, latched: false, dir: 1,
      soft: 0, softDone: false, f: 0, tr: 0, hist: [], run: false, lastSw: -1, peak: 0, msg: "",
    };
    var modes = (host.getAttribute("data-modes") || "dol,fr,yd,soft,vfd").split(",");
    host.innerHTML = "";
    var top = el("div", "mcl-top"); host.appendChild(top);
    var tabs = el("div", "mcl-tabs"); top.appendChild(tabs);
    modes.forEach(function (m) {
      var b = el("button", "", MODES[m]); b.type = "button"; b.setAttribute("data-m", m);
      b.addEventListener("click", function () { setMode(m); }); tabs.appendChild(b);
    });
    var body = el("div", "mcl-body"); host.appendChild(body);
    var left = el("div", "mcl-left"); body.appendChild(left);
    var right = el("div", "mcl-right"); body.appendChild(right);
    var svgBox = el("div", "mcl-svg"); left.appendChild(svgBox);
    var btns = el("div", "mcl-btns"); left.appendChild(btns);
    var logic = el("ol", "mcl-logic"); left.appendChild(logic);
    var meters = el("div", "mcl-meters"); right.appendChild(meters);
    var cv = el("canvas", "mcl-chart"); cv.width = 640; cv.height = 260; right.appendChild(cv);
    var leg = el("div", "mcl-leg", '<span class="a">' + L("กระแสสาย (A)", "Line current (A)") + '</span><span class="b">' + L("ความเร็ว (rpm/100)", "Speed (rpm/100)") + '</span><span class="c">' + L("แรงบิดมอเตอร์ (N·m)", "Motor torque (N·m)") + "</span>");
    right.appendChild(leg);
    var set = el("div", "mcl-set"); right.appendChild(set);
    var msg = el("p", "mcl-msg"); right.appendChild(msg);

    function button(label, cls, down, up) {
      var b = el("button", "mcl-pb " + cls, label); b.type = "button";
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); down(); b.classList.add("on"); });
      var rel = function () { b.classList.remove("on"); if (up) up(); };
      b.addEventListener("pointerup", rel); b.addEventListener("pointerleave", rel);
      b.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); down(); } });
      b.addEventListener("keyup", function (e) { if (e.key === " " || e.key === "Enter") rel(); });
      btns.appendChild(b); return b;
    }
    function rng(key, label, min, max, step, unit, fmtv) {
      var w = el("label", "mcl-r"), s = el("input"), o = el("output");
      s.type = "range"; s.min = min; s.max = max; s.step = step; s.value = st[key];
      w.appendChild(el("span", "", label)); w.appendChild(s); w.appendChild(o);
      var upd = function () { st[key] = +s.value; o.textContent = (fmtv ? fmtv(st[key]) : st[key]) + (unit || ""); };
      s.addEventListener("input", upd); upd(); set.appendChild(w); return s;
    }
    function sel(key, label, opts) {
      var w = el("label", "mcl-r"), s = el("select");
      Object.keys(opts).forEach(function (k) { var o = el("option", "", opts[k]); o.value = k; s.appendChild(o); });
      s.value = st[key]; s.addEventListener("change", function () { st[key] = s.value; });
      w.appendChild(el("span", "", label)); w.appendChild(s); set.appendChild(w);
    }
    function chk(key, label) {
      var w = el("label", "mcl-c"), s = el("input"); s.type = "checkbox"; s.checked = st[key];
      s.addEventListener("change", function () { st[key] = s.checked; }); w.appendChild(s); w.appendChild(el("span", "", label)); set.appendChild(w);
    }

    function setMode(m) {
      st.ir = m === "yd" ? +(IN / S3).toFixed(1) : +IN.toFixed(1);
      st.mode = m; stopAll(); st.f = 0; st.w = 0; st.hist = []; st.t = 0; st.theta = 0; st.trip = false; st.peak = 0;
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-m") === m ? "true" : "false"); });
      btns.innerHTML = ""; set.innerHTML = "";
      if (m === "fr") {
        button(L("▶ เดินหน้า (S1)", "▶ Forward (S1)"), "g", function () { press("F"); });
        button(L("◀ ถอยหลัง (S2)", "◀ Reverse (S2)"), "g", function () { press("R"); });
      } else {
        button(L("START (S1)", "START (S1)"), "g", function () { press("F"); });
      }
      button(L("STOP (S0)", "STOP (S0)"), "r", function () { stopAll(); });
      button(L("รีเซ็ตโอเวอร์โหลด", "Reset overload"), "y", function () { if (st.theta < 1.2) { st.trip = false; st.msg = ""; } else st.msg = L("ยังร้อนอยู่ รอให้เย็นก่อนรีเซ็ต", "Still hot — wait for it to cool before resetting"); });
      sel("load", L("โหลด", "Load"), { pump: LOADS.pump.n, conv: LOADS.conv.n, fan: LOADS.fan.n });
      rng("lk", L("ขนาดโหลด", "Load level"), 0, 1.3, 0.05, " Tn", function (v) { return v.toFixed(2); });
      rng("ir", L("ค่าตั้งโอเวอร์โหลด Ir", "Overload setting Ir"), 4, 20, 0.1, " A", function (v) { return v.toFixed(1); });
      if (m === "yd") {
        rng("tY", L("ไทเมอร์ Y→Δ", "Y→Δ timer"), 0.5, 20, 0.5, " s");
        rng("dead", L("ช่วงตาย", "Dead time"), 0.02, 0.3, 0.01, " s");
      }
      if (m === "soft") {
        rng("ramp", L("เวลา ramp", "Ramp time"), 2, 30, 1, " s");
        rng("v0", L("แรงดันเริ่ม", "Initial voltage"), 20, 80, 5, " %");
        rng("ilim", L("จำกัดกระแส", "Current limit"), 2, 6, 0.5, " ×In");
      }
      if (m === "vfd") {
        rng("acc", L("เวลาเร่ง 0→50 Hz", "Accel time 0→50 Hz"), 0.5, 30, 0.5, " s");
        rng("fset", L("ความถี่สั่ง", "Frequency command"), 5, 60, 1, " Hz");
      }
      if (m === "fr") chk("plug", L("ไม่มีอินเตอร์ล็อกผ่าน STOP (กลับทางทันที = plugging)", "No stop-before-reverse (instant reversal = plugging)"));
      chk("ph", L("ความผิดพลาด: เฟสขาด 1 เฟส", "Fault: one phase lost"));
      draw();
    }
    function stopAll() {
      st.K1 = st.K2 = st.K3 = st.KR = false; st.latched = false; st.timing = false; st.timer = 0; st.deadT = 0; st.soft = 0; st.softDone = false; st.lastSw = -1;
    }
    function press(d) {
      if (st.trip) { st.msg = L("โอเวอร์โหลดทริปอยู่ (95-96 เปิด) — กดรีเซ็ตก่อน", "Overload tripped (95-96 open) — reset first"); return; }
      var m = st.mode;
      if (m === "fr") {
        if (d === "F") { if (st.KR) { if (!st.plug) { st.msg = L("อินเตอร์ล็อก: ต้องกด STOP ก่อนกลับทาง", "Interlock: press STOP before reversing"); return; } st.KR = false; } st.K1 = true; st.dir = 1; }
        else { if (st.K1) { if (!st.plug) { st.msg = L("อินเตอร์ล็อก: ต้องกด STOP ก่อนกลับทาง", "Interlock: press STOP before reversing"); return; } st.K1 = false; } st.KR = true; st.dir = -1; }
        st.msg = ""; return;
      }
      if (st.latched) return;
      st.latched = true; st.msg = ""; st.peak = 0;
      if (m === "yd") { st.K2 = true; st.K1 = true; st.timing = true; st.timer = 0; }
      else st.K1 = true;
      st.dir = 1;
    }

    // ---------------------------------------------------------------- physics step
    function step(dt) {
      var m = st.mode, Vph = 0, f = 50, conn = "off", wind = 0, k = 1;
      if (m === "yd" && st.latched) {
        if (st.timing) { st.timer += dt; if (st.timer >= st.tY) { st.timing = false; st.K2 = false; st.deadT = st.dead; } }
        else if (st.deadT > 0) { st.deadT -= dt; if (st.deadT <= 0) { st.K3 = true; st.lastSw = st.t; } }
      }
      var energized = (m === "fr") ? (st.K1 || st.KR) : (m === "vfd") ? (st.K1 || st.f > 0.3) : st.K1;
      var dir = m === "fr" ? (st.KR ? -1 : 1) : 1;
      if (energized) {
        if (m === "yd") {
          if (st.K2) { conn = "Y"; Vph = 400 / S3; wind = 230; }
          else if (st.K3) { conn = "D"; Vph = 400 / S3; wind = 400; }
          else { conn = "open"; Vph = 0; }
        } else if (m === "soft") {
          conn = "D";
          if (!st.softDone) {
            st.soft += dt / st.ramp;
            var vf = Math.min(1, st.v0 / 100 + (1 - st.v0 / 100) * st.soft);
            var sl0 = 1 - st.w / (TAU * MP.ns / 60), full = motor(sl0, 400 / S3, 50).I;
            var vl = st.ilim * IN / full; vf = Math.min(vf, Math.max(vl, 0.2));
            st.vfrac = vf; Vph = 400 / S3 * vf;
            if (st.soft >= 1 && st.w > 0.95 * TAU * NN / 60) { st.softDone = true; st.lastSw = st.t; }
          } else { st.vfrac = 1; Vph = 400 / S3; }
          wind = 400 * (st.vfrac || 1);
        } else if (m === "vfd") {
          conn = "D";
          var target = st.K1 ? st.fset : 0;
          if (st.f < target) st.f = Math.min(target, st.f + 50 / st.acc * dt); else st.f = Math.max(target, st.f - 50 / st.acc * dt);
          f = Math.max(st.f, 0.3);
          Vph = 400 / S3 * Math.min(1, 0.03 + 0.97 * f / 50);
          wind = Vph * S3;
        } else { conn = "D"; Vph = 400 / S3; wind = 400; }
      } else {
        if (m === "vfd") st.f = 0;
      }
      var ws = TAU * MP.ns / 60 * (f / 50) * dir, s = Vph > 0 ? (ws - st.w) / ws : 0;
      var r = Vph > 0 ? motor(s, Vph, f) : { I: 0, T: 0, pf: 0, P: 0 };
      var I = r.I, Tm = r.T * dir;
      if (conn === "Y") { I /= 3; Tm /= 3; }  // star: winding voltage ÷√3 → winding current ÷√3, line current and torque ÷3
      if (st.ph && Vph > 0) {
        var sp = Math.min(1, Math.abs(st.w) / (TAU * MP.ns / 60) / 0.3);
        Tm *= 0.45 * sp; I *= 1.73;
      }
      // transient after the Y→Δ change (residual-flux mismatch) and after soft-starter bypass
      if (m === "yd" && st.lastSw >= 0 && st.t - st.lastSw < 0.25) { var e = Math.exp(-(st.t - st.lastSw) / 0.035); I *= 1 + 0.9 * e; Tm *= 1 + 0.6 * e; }
      var line = I;
      if (m === "vfd") line = Math.max(0, r.P) / (S3 * 400 * 0.95) + (Vph > 0 ? 0.6 : 0);
      var TL = LOADS[st.load].f(st.w, st.lk), J = JM + LOADS[st.load].J * (st.load === "fan" ? 1 : 1);
      var sgn = st.w > 0.05 ? 1 : st.w < -0.05 ? -1 : 0, Tnet;
      if (sgn === 0) { Tnet = Math.abs(Tm) > TL ? Tm - Math.sign(Tm) * TL : 0; } else Tnet = Tm - sgn * TL;
      st.w += Tnet / J * dt;
      if (!energized && Math.abs(st.w) < 0.05) st.w = 0;
      // overload thermal image (on line current; for star–delta the relay sits in the phase current → I/√3 when in Δ)
      var irel = (m === "yd" && conn === "D") ? I / S3 : (m === "yd" && conn === "Y") ? I : (m === "vfd" ? I : I);
      var setI = (m === "yd") ? st.ir * (conn === "Y" ? 1 : 1) : st.ir;
      st.theta += ((irel / setI) * (irel / setI) - st.theta) / 320 * dt;
      if (st.theta < 0) st.theta = 0;
      if (st.theta >= 1.44 && !st.trip) { st.trip = true; stopAll(); st.msg = L("โอเวอร์โหลดทริป! หน้าสัมผัส 95-96 เปิด คอนแทกเตอร์ปล่อย", "Overload tripped! 95-96 opened and the contactors dropped out"); }
      st.t += dt;
      st.now = { I: line, Im: I, n: st.w * 60 / TAU, T: Tm, TL: TL * (sgn || 1), conn: conn, wind: wind, f: m === "vfd" ? st.f : (Vph > 0 ? 50 : 0), pf: r.pf, s: s };
      if (Math.abs(line) > st.peak) st.peak = Math.abs(line);
    }

    // ---------------------------------------------------------------- drawing
    function onOff(b) { return b ? "on" : ""; }
    function svgPower() {
      var m = st.mode, n = st.now || { conn: "off" };
      var c = function (on) { return on ? "mcl-hot" : "mcl-cold"; };
      var s = '<svg viewBox="0 0 360 250" class="mcl-sv" role="img" aria-label="' + L("สถานะวงจรกำลัง", "Power circuit state") + '">';
      s += '<text x="10" y="18" class="mcl-t">L1 L2 L3 · 400 V 50 Hz</text><line x1="10" y1="26" x2="350" y2="26" class="mcl-rail"/>';
      var box = function (x, y, w, h, on, t, sub) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" class="mcl-box ' + (on ? "on" : "") + '"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 1) + '" class="mcl-bt">' + t + '</text>' + (sub ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 15) + '" class="mcl-bs">' + sub + "</text>" : ""); };
      var k1 = (m === "fr") ? st.K1 : st.K1;
      s += '<line x1="70" y1="26" x2="70" y2="44" class="' + c(true) + '"/>' + box(30, 44, 80, 34, !st.trip, "-Q1", "MPCB");
      s += '<line x1="70" y1="78" x2="70" y2="96" class="' + c(true) + '"/>';
      if (m === "fr") {
        s += '<line x1="70" y1="96" x2="200" y2="96" class="' + c(true) + '"/>' + box(30, 96, 80, 40, st.K1, "-K1", L("เดินหน้า", "FWD")) + box(160, 96, 80, 40, st.KR, "-K2", L("ถอยหลัง", "REV"));
        s += '<line x1="70" y1="136" x2="70" y2="160" class="' + c(st.K1 || st.KR) + '"/><line x1="200" y1="136" x2="200" y2="150" class="' + c(st.KR) + '"/><line x1="200" y1="150" x2="70" y2="150" class="' + c(st.KR) + '"/>';
        s += '<text x="250" y="122" class="mcl-bs" text-anchor="start">L1⇄L3</text>';
      } else if (m === "soft" || m === "vfd") {
        var on = st.K1;
        s += box(30, 96, 80, 40, on, "-K1", L("ไฟเข้า", "Line"));
        s += '<line x1="70" y1="136" x2="70" y2="146" class="' + c(on) + '"/>' + box(20, 146, 100, 34, on, m === "soft" ? L("ซอฟต์สตาร์ท", "Soft starter") : "VFD", m === "soft" ? (st.softDone ? L("บายพาส", "bypassed") : "α " + Math.round((1 - (st.vfrac || 0)) * 150) + "°") : fmt(st.f, 1) + " Hz");
      } else {
        s += box(30, 96, 80, 40, st.K1, "-K1", L("หลัก", "Main"));
      }
      var yO = m === "soft" || m === "vfd" ? 180 : 160;
      s += '<line x1="70" y1="' + yO + '" x2="70" y2="' + (yO + 8) + '" class="' + c(n.conn !== "off" && n.conn !== "open") + '"/>' + box(30, yO + 8, 80, 26, st.trip, "-F2", st.trip ? L("ทริป!", "TRIP!") : "OL " + Math.round(st.theta / 1.44 * 100) + "%");
      // motor
      var cx = 70, cy = yO + 34 + 40;
      if (m === "yd") {
        s += box(160, 96, 70, 36, st.K3, "-K3", "Δ") + box(250, 96, 70, 36, st.K2, "-K2", "Y");
        s += '<line x1="110" y1="113" x2="160" y2="113" class="' + c(st.K1) + '"/>';
      }
      s += '<circle cx="' + cx + '" cy="' + Math.min(cy, 215) + '" r="26" class="mcl-motor ' + (Math.abs(st.w) > 1 ? "spin" : "") + '"/><text x="' + cx + '" y="' + (Math.min(cy, 215) + 5) + '" class="mcl-bt">M 3~</text>';
      // winding indicator
      var wx = 270, wy = 200;
      if (n.conn === "Y") s += '<g class="mcl-hot"><line x1="' + wx + '" y1="' + wy + '" x2="' + wx + '" y2="' + (wy - 30) + '"/><line x1="' + wx + '" y1="' + wy + '" x2="' + (wx - 26) + '" y2="' + (wy + 15) + '"/><line x1="' + wx + '" y1="' + wy + '" x2="' + (wx + 26) + '" y2="' + (wy + 15) + '"/></g>';
      else if (n.conn === "D") s += '<polygon points="' + wx + "," + (wy - 30) + " " + (wx - 28) + "," + (wy + 18) + " " + (wx + 28) + "," + (wy + 18) + '" class="mcl-hot" fill="none"/>';
      else s += '<text x="' + wx + '" y="' + wy + '" class="mcl-bs">' + (n.conn === "open" ? L("ช่วงตาย", "dead time") : L("ไม่มีไฟ", "de-energised")) + "</text>";
      s += '<text x="' + wx + '" y="' + (wy + 38) + '" class="mcl-bs">' + (n.conn === "Y" ? L("สตาร์ · ขดลวด 230 V", "Star · 230 V/winding") : n.conn === "D" ? L("เดลต้า · ขดลวด ", "Delta · ") + Math.round(n.wind || 400) + " V" : "") + "</text>";
      return s + "</svg>";
    }
    function logicList() {
      var m = st.mode, items = [];
      var li = function (on, t) { items.push('<li class="' + (on ? "on" : "") + '">' + t + "</li>"); };
      li(!st.trip, "-F2 95-96 " + (st.trip ? L("เปิด (ทริป)", "open (tripped)") : L("ปิด", "closed")));
      if (m === "fr") {
        li(st.K1, "-K1 " + L("ดูด · 13-14 ล็อกตัวเอง · 21-22 ตัดวงจร K2", "on · 13-14 holds · 21-22 blocks K2"));
        li(st.KR, "-K2 " + L("ดูด · 13-14 ล็อกตัวเอง · 21-22 ตัดวงจร K1", "on · 13-14 holds · 21-22 blocks K1"));
      } else if (m === "yd") {
        li(st.timing, "-K4T " + L("จับเวลา ", "timing ") + fmt(Math.min(st.timer, st.tY), 1) + " / " + st.tY + " s");
        li(st.K2, "-K2 (Y) " + L("ดูดผ่าน K4T 15-16 และ K3 21-22", "fed via K4T 15-16 and K3 21-22"));
        li(st.K1, "-K1 " + L("ดูดผ่าน K2 13-14 แล้วล็อกด้วย 43-44", "fed via K2 13-14, then held by 43-44"));
        li(st.deadT > 0, L("ช่วงตาย (K2 ปล่อย → K3 ยังไม่ดูด)", "dead time (K2 off → K3 not yet on)"));
        li(st.K3, "-K3 (Δ) " + L("ดูดผ่าน K4T 17-18 และ K2 21-22", "fed via K4T 17-18 and K2 21-22"));
      } else if (m === "soft") {
        li(st.K1, "-K1 " + L("ดูด", "on"));
        li(st.K1 && !st.softDone, L("ramp แรงดัน ", "voltage ramp ") + Math.round((st.vfrac || 0) * 100) + " %");
        li(st.softDone, L("บายพาสคอนแทกเตอร์ปิด (ไทริสเตอร์หยุดนำ)", "bypass contactor closed (thyristors idle)"));
      } else if (m === "vfd") {
        li(st.K1, L("RUN · ความถี่ ", "RUN · frequency ") + fmt(st.f, 1) + " Hz");
        li(st.K1 && Math.abs(st.f - st.fset) > 0.1, L("กำลังเร่ง/ลดตามเวลาที่ตั้ง", "ramping at the set rate"));
      } else {
        li(st.K1, "-K1 " + L("ดูด · 13-14 ล็อกตัวเอง", "on · 13-14 holding"));
      }
      logic.innerHTML = items.join("");
    }
    var css = function (name) { return getComputedStyle(host).getPropertyValue(name).trim() || "#888"; };
    function chart() {
      var g = cv.getContext("2d"), W = cv.width, H = cv.height, h = st.hist, span = 20;
      g.clearRect(0, 0, W, H);
      var L0 = 44, R0 = 10, T0 = 10, B0 = 26, pw = W - L0 - R0, ph = H - T0 - B0;
      var ymax = 120;
      g.strokeStyle = css("--rule"); g.fillStyle = css("--ink-3"); g.font = "11px monospace"; g.lineWidth = 1;
      for (var v = 0; v <= ymax; v += 20) { var y = T0 + ph - v / ymax * ph; g.beginPath(); g.moveTo(L0, y); g.lineTo(W - R0, y); g.stroke(); g.fillText(String(v), 8, y + 4); }
      var t1 = Math.max(span, st.t), t0 = t1 - span;
      for (var t = Math.ceil(t0); t <= t1; t += 2) { var x = L0 + (t - t0) / span * pw; g.fillText(t.toFixed(0) + "s", x - 8, H - 8); }
      var line = function (key, color, sc) {
        g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
        var first = true;
        for (var i = 0; i < h.length; i++) { var p = h[i]; if (p.t < t0) continue; var x = L0 + (p.t - t0) / span * pw, y = T0 + ph - Math.max(-10, Math.min(ymax + 5, p[key] * sc)) / ymax * ph; if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); }
        g.stroke();
      };
      line("I", css("--signal"), 1); line("n", css("--ok"), 0.01 * 1); line("T", css("--accent"), 1);
      g.fillStyle = css("--ink-2"); g.fillText("In = " + IN.toFixed(1) + " A · Tn = " + TN.toFixed(0) + " N·m", L0 + 6, T0 + 12);
    }
    function draw() {
      svgBox.innerHTML = svgPower(); logicList();
      var n = st.now || { I: 0, n: 0, T: 0, wind: 0, f: 0 };
      var tile = function (k, v, u, cls) { return '<div class="mcl-m ' + (cls || "") + '"><span>' + k + "</span><b>" + v + "</b><i>" + u + "</i></div>"; };
      meters.innerHTML = tile(L("กระแสสาย", "Line current"), fmt(n.I, 1), "A · " + fmt(n.I / IN, 2) + "·In", "a") + tile(L("ความเร็ว", "Speed"), fmt(n.n, 0), "rpm", "b") +
        tile(L("แรงบิด", "Torque"), fmt(n.T, 0), "N·m · " + fmt(n.T / TN, 2) + "·Tn", "c") + tile(L("กระแสสูงสุดรอบนี้", "Peak this start"), fmt(st.peak, 0), "A · " + fmt(st.peak / IN, 1) + "·In") +
        tile(L("แรงดันขดลวด", "Winding voltage"), fmt(n.wind || 0, 0), "V") + tile(L("ความถี่", "Frequency"), fmt(n.f || 0, 1), "Hz");
      msg.textContent = st.msg || "";
      chart();
    }

    var last = null, acc = 0, visible = true;
    function loop(ts) {
      if (last == null) last = ts;
      var dt = Math.min(0.1, (ts - last) / 1000); last = ts;
      if (visible) {
        var n = Math.round(dt / 0.001);
        for (var i = 0; i < n; i++) step(0.001);
        acc += dt;
        if (st.hist.length === 0 || st.t - st.hist[st.hist.length - 1].t > 0.02) st.hist.push({ t: st.t, I: st.now.I, n: st.now.n, T: st.now.T });
        if (st.hist.length > 2000) st.hist.splice(0, st.hist.length - 2000);
        draw();
      }
      requestAnimationFrame(loop);
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(host);
    host._setMode = setMode;
    setMode(st.mode); step(0.001); draw();
    requestAnimationFrame(loop);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".mc-lab"), function (h) { Lab(h); });
    Array.prototype.forEach.call(document.querySelectorAll("button[data-mc-lab]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-mc-target"), h = id ? document.getElementById(id) : document.querySelector(".mc-lab");
        if (h && h._setMode) { h._setMode(b.getAttribute("data-mc-lab")); h.scrollIntoView({ behavior: "smooth", block: "center" }); }
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
