/* Buck converter analysis labs (needs buck-core.js → BuckCore, buck-ui.js → BuckUI).
   <div class="bk-wave"  data-preset="ccm|boundary|dcm|real|sync|lowfs" data-presets="ccm,boundary,dcm">   CCM/DCM waveform explorer (duty-cycle derivation)
   <div class="bk-duty"  data-view="duty-load|m-vs-d">                                                       duty needed vs load / M(D,K) family
   <div class="bk-ss"    data-preset="ideal|real">                                                           state-space builder (ON/OFF → averaged → small-signal)
   <div class="bk-avg"   data-preset="small|large|sine|lowfs">                                               switching vs averaged vs linear small-signal
   <div class="bk-tf"    data-preset="…" data-in="d" data-out="vo">                                          transfer-function explorer + virtual network analyzer */
(function () {
  "use strict";
  var B = window.BuckCore, U = window.BuckUI;
  if (!B || !U) return;
  var num = U.num, eng = U.eng, esc = U.esc;

  // ------------------------------------------------------------------------------------------------ shared field specs
  var F = {
    Vg: { k: "Vg", label: "แรงดันอินพุต Vin", unit: "V", min: 5, max: 60, step: 0.5 },
    D: { k: "D", label: "ดิวตี้ D", unit: "", min: 0.05, max: 0.95, step: 0.005 },
    Vo: { k: "Vo", label: "แรงดันเป้าหมาย Vo", unit: "V", min: 1, max: 40, step: 0.5 },
    R: { k: "R", label: "โหลด R", unit: "Ω", min: 1, max: 1000, log: true },
    L: { k: "L", label: "ตัวเหนี่ยวนำ L", unit: "µH", scale: 1e-6, min: 10, max: 3000, log: true },
    C: { k: "C", label: "ตัวเก็บประจุ C", unit: "µF", scale: 1e-6, min: 10, max: 3000, log: true },
    fs: { k: "fs", label: "ความถี่สวิตช์ fs", unit: "kHz", scale: 1e3, min: 5, max: 500, log: true },
    rL: { k: "rL", label: "DCR ของ L", unit: "mΩ", scale: 1e-3, min: 0, max: 500, step: 5 },
    rC: { k: "rC", label: "ESR ของ C", unit: "mΩ", scale: 1e-3, min: 0, max: 500, step: 5 },
    Ron: { k: "Ron", label: "Rds(on)", unit: "mΩ", scale: 1e-3, min: 0, max: 500, step: 5 },
    Vf: { k: "Vf", label: "Vf ไดโอด", unit: "V", min: 0, max: 1.2, step: 0.05 },
    Rd: { k: "Rd", label: "Rd ไดโอด", unit: "mΩ", scale: 1e-3, min: 0, max: 500, step: 5 }
  };
  var REAL = { rL: 0.1, rC: 0.05, Ron: 0.05, Vf: 0.4, Rd: 0 };
  var IDEAL = { rL: 0, rC: 0, Ron: 0, Vf: 0, Rd: 0 };
  function pOf(st) { return { Vg: st.Vg, R: st.R, L: st.L, C: st.C, fs: st.fs, rL: st.rL, rC: st.rC, Ron: st.Ron, Rd: st.sync ? 0 : st.Rd, Vf: st.sync ? 0 : st.Vf, sync: !!st.sync, RonLs: st.Ron }; }
  function badge(mode) { return '<span class="bk-badge ' + (mode === "CCM" ? "ccm" : "dcm") + '">' + mode + "</span>"; }
  function html(el, s) { el.innerHTML = s; }
  function mount(el, cls, ready) { el.classList.add(cls || "bk-lab", "bk-ready"); if (ready) ready(); }
  function btn(act, label, extra) { return '<button type="button" class="btn btn-ghost btn-sm" data-act="' + act + '"' + (extra || "") + ">" + label + "</button>"; }

  // ================================================================================================ 1. waveform explorer
  var WAVE_PRESETS = {
    ccm: { name: "CCM มาตรฐาน 24→12 V", st: { Vg: 24, mode: "D", D: 0.5, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, para: false },
    boundary: { name: "ขอบเขต CCM/DCM (R = 60 Ω)", st: { Vg: 24, mode: "D", D: 0.5, R: 60, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, para: false },
    dcm: { name: "DCM โหลดเบา (R = 100 Ω)", st: { Vg: 24, mode: "D", D: 0.5, R: 100, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, para: false },
    dcmvo: { name: "DCM: หา D ให้ได้ 12 V", st: { Vg: 24, mode: "Vo", Vo: 12, R: 100, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, para: false },
    real: { name: "ค่าแฝงจริง: หา D ให้ได้ 12 V", st: { Vg: 24, mode: "Vo", Vo: 12, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, para: true },
    sync: { name: "Synchronous: ไม่มี DCM (R = 100 Ω)", st: { Vg: 24, mode: "D", D: 0.5, R: 100, L: 300e-6, C: 100e-6, fs: 50e3, sync: true }, para: false },
    lowfs: { name: "L เล็ก fs ต่ำ: ripple สูง", st: { Vg: 24, mode: "D", D: 0.5, R: 10, L: 47e-6, C: 100e-6, fs: 20e3, sync: false }, para: false },
    highvin: { name: "Vin 48 V → D ต่ำ", st: { Vg: 48, mode: "Vo", Vo: 12, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, para: false }
  };
  function initWave(el) {
    var key = el.dataset.preset || "ccm", st = {}, fields = {}, show = (el.dataset.presets || "ccm,boundary,dcm").split(",");
    Object.keys(F).forEach(function (k) { fields[k] = F[k]; });
    function load(name) {
      var P = WAVE_PRESETS[name]; if (!P) return;
      Object.keys(st).forEach(function (k) { delete st[k]; });
      Object.assign(st, { Vg: 24, mode: "D", D: 0.5, Vo: 12, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, sync: false }, P.st, P.para ? REAL : IDEAL);
      key = name;
    }
    load(key);
    function build() {
      var pk = ["Vg", st.mode === "D" ? "D" : "Vo", "R", "L", "C", "fs"], f = pk.map(function (k) { return U.field(F[k], st); }).join("");
      var par = ["rL", "rC", "Ron", "Vf", "Rd"].map(function (k) { return U.field(F[k], st); }).join("");
      html(el,
        '<div class="bk-top"><div class="bk-presets" role="group" aria-label="ตัวอย่างพร้อมใช้">' + show.map(function (n) { return WAVE_PRESETS[n] ? '<button type="button" class="btn btn-ghost btn-sm' + (n === key ? " on" : "") + '" data-preset="' + n + '">' + WAVE_PRESETS[n].name + "</button>" : ""; }).join("") + "</div></div>" +
        '<div class="bk-grid"><div class="bk-ctl"><div class="bk-sw"><span>กำหนด</span>' +
        '<label><input type="radio" name="bkm' + (build.n = (build.n || 0) + 1) + '" value="D"' + (st.mode === "D" ? " checked" : "") + "> ตั้งดิวตี้ D เอง</label>" +
        '<label><input type="radio" name="bkm' + build.n + '" value="Vo"' + (st.mode === "Vo" ? " checked" : "") + "> ให้คำนวณ D จาก Vo เป้าหมาย</label></div>" + f +
        '<label class="bk-chk"><input type="checkbox" data-k="sync"' + (st.sync ? " checked" : "") + "> Synchronous (MOSFET ตัวล่างแทนไดโอด)</label>" +
        '<details class="bk-more"><summary>ค่าความต้านทานแฝง (parasitics)</summary><div class="bk-quick">' + btn("ideal", "อุดมคติทั้งหมด") + btn("real", "ค่าจริงทั่วไป") + "</div>" + par + "</details></div>" +
        '<div class="bk-out"><div class="bk-status" aria-live="polite"></div><div class="bk-figs"><div class="bk-fig f-il"></div><div class="bk-fig f-vsw"></div><div class="bk-fig f-vo"></div></div><div class="bk-tbl"></div></div></div>');
      update();
    }
    U.bind(el, st, fields, function () { update(); });
    var update = U.debounce(function () { compute(); }, 40);
    function compute() {
      var p = pOf(st), Ts = 1 / p.fs, dd = B.dutyForVo(p, st.Vo), D = st.mode === "Vo" ? dd.D : st.D;
      D = Math.min(Math.max(D, 0.01), 0.99);
      var o = B.openLoop(p, D), th = B.theoryWave(p, D, 500), nP = 120, k0 = nP - 3;
      var run = B.simulate({ p: p, D: D, nPer: nP, init: B.steadyInit(p, D), nsub: 60, capture: { t0: k0 * Ts, t1: nP * Ts } });
      var w = run.wave, t0 = w.t[0], tt = w.t.map(function (t) { return (t - t0) * 1e6; });
      var vL = w.vsw.map(function (v, i) { return v - p.rL * w.iL[i] - w.v[i]; });
      var vm = 0, n = w.v.length, i; for (i = 0; i < n; i++) vm += w.v[i]; vm /= n;
      var vr = w.v.map(function (v) { return (v - vm) * 1e3; });
      var imin = Infinity, imax = -Infinity, vmn = Infinity, vmx = -Infinity;
      for (i = 0; i < n; i++) { imin = Math.min(imin, w.iL[i]); imax = Math.max(imax, w.iL[i]); vmn = Math.min(vmn, w.v[i]); vmx = Math.max(vmx, w.v[i]); }
      var kk = nP - 1, Vs = B.avg(run.vMean, kk - 2, nP), ILs = B.avg(run.iLMean, kk - 2, nP), idle = B.avg(run.idle, kk - 2, nP);
      var pin = B.avg(run.pin, kk - 2, nP), pout = B.avg(run.pout, kk - 2, nP), ig = B.avg(run.igMean, kk - 2, nP);
      // theory curves tiled over the 3 captured periods
      var thT = [], thI = [], thR = [], thV = [], thVL = [];
      for (var q = 0; q < 3; q++) for (i = 0; i < th.t.length; i++) { thT.push((q * Ts + th.t[i]) * 1e6); thI.push(th.iL[i]); thR.push(th.vr[i] * 1e3); thV.push(th.vsw[i]); thVL.push(th.vL[i]); }
      var bands = [];
      for (q = 0; q < 3; q++) {
        bands.push({ x0: (q * Ts) * 1e6, x1: (q * Ts + th.t1) * 1e6, cls: "on", label: q === 0 ? "D₁ ON" : "" });
        bands.push({ x0: (q * Ts + th.t1) * 1e6, x1: (q * Ts + th.t1 + th.t2) * 1e6, cls: "off", label: q === 0 ? (th.mode === "DCM" ? "D₂ OFF" : "D′ OFF") : "" });
        if (th.t3 > 1e-12) bands.push({ x0: (q * Ts + th.t1 + th.t2) * 1e6, x1: ((q + 1) * Ts) * 1e6, cls: "idle", label: q === 0 ? "D₃ ว่าง" : "" });
      }
      var xr = { xmin: 0, xmax: 3 * Ts * 1e6, xlabel: "เวลา (µs) — แสดง 3 คาบ", xname: "t", xfmt: function (x) { return num(x, 4) + " µs"; } };
      U.draw(el.querySelector(".f-il"), Object.assign({ title: "กระแสตัวเหนี่ยวนำ iL (A)", ylabel: "A", bands: bands,
        series: [{ x: tt, y: w.iL, cls: "s1", name: "iL จำลอง", w: 2 }, { x: thT, y: thI, cls: "s2", dash: true, name: "iL ทฤษฎี" }],
        hlines: [{ y: ILs, cls: "ref", label: "ค่าเฉลี่ย " + num(ILs, 4) + " A" }], yfmt: function (y) { return num(y, 4) + " A"; } }, xr));
      U.draw(el.querySelector(".f-vsw"), Object.assign({ title: "แรงดันโหนดสวิตช์ vsw และแรงดันคร่อม L (V)", ylabel: "V", bands: bands,
        series: [{ x: tt, y: w.vsw, cls: "s1", name: "vsw", step: true }, { x: tt, y: vL, cls: "s3", name: "vL = vsw − Vo", step: true }],
        hlines: [{ y: 0, cls: "ref" }], yfmt: function (y) { return num(y, 4) + " V"; } }, xr));
      U.draw(el.querySelector(".f-vo"), Object.assign({ title: "ripple แรงดันขาออก Vo − ค่าเฉลี่ย (mV)", ylabel: "mV", bands: bands,
        series: [{ x: tt, y: vr, cls: "s1", name: "Vo จำลอง", w: 2 }, { x: thT, y: thR, cls: "s2", dash: true, name: "ทฤษฎี" }], yfmt: function (y) { return num(y, 4) + " mV"; } }, xr));
      var dI = imax - imin, mode = o.mode, ccmTxt = "";
      if (mode === "CCM") ccmTxt = "K = 2L/(R·Ts) = " + num(o.K, 4) + " &gt; 1 − D = " + num(1 - D, 4) + " ⇒ กระแส iL ไม่ลงถึงศูนย์ → <b>CCM</b>" + (p.sync ? " (synchronous จึงเป็น CCM เสมอ ถึง iL ติดลบ)" : "");
      else ccmTxt = "K = " + num(o.K, 4) + " &lt; 1 − D = " + num(1 - D, 4) + " ⇒ iL ถึงศูนย์ก่อนสิ้นคาบ → <b>DCM</b> มีช่วงว่าง D₃ = " + num(o.D3, 4);
      var Dtxt = st.mode === "Vo" ? "ต้องใช้ D = " + num(D, 5) + " (ตัวเลขนี้คือ D ที่คำนวณได้: D = Vo/Vin ในอุดมคติ = " + num(dd.Dideal, 5) + ", CCM+ค่าแฝง = " + num(dd.Dccm, 5) + ", สูตร DCM = " + (isFinite(dd.Ddcm) ? num(dd.Ddcm, 5) : "–") + ")" : "ใช้ D = " + num(D, 5);
      el.querySelector(".bk-status").innerHTML = badge(mode) + " " + ccmTxt + "<br>" + Dtxt;
      var rows = [
        ["ดิวตี้ D ที่ใช้", num(D, 5), num(run.dEff[nP - 1], 5)],
        ["แรงดันขาออก Vo (V)", num(o.V, 5), num(Vs, 5)],
        ["กระแสโหลด Io = ⟨iL⟩ (A)", num(o.IL, 5), num(ILs, 5)],
        [mode === "CCM" ? "ripple กระแส ΔiL (A p-p)" : "กระแสพีก ipk (A)", num(mode === "CCM" ? o.dI : o.ipk, 4), num(dI, 4)],
        ["iL ต่ำสุด (A)", num(mode === "CCM" ? o.ILmin : 0, 4), num(imin, 4)],
        ["iL สูงสุด (A)", num(mode === "CCM" ? o.ILmax : o.ipk, 4), num(imax, 4)],
        ["ripple Vo p-p (mV)", num(th.vpp * 1e3, 4), num((vmx - vmn) * 1e3, 4)],
        ["กระแสอินพุตเฉลี่ย Ig (A)", num(mode === "CCM" ? D * o.IL : 0.5 * D * o.ipk, 4) + (mode === "CCM" ? " (= D·Io)" : " (= ½·D₁·ipk)"), num(ig, 4)],
        ["ช่วงเวลา: D₁ / D₂ / D₃ (%)", num(th.t1 / Ts * 100, 4) + " / " + num(th.t2 / Ts * 100, 4) + " / " + num(th.t3 / Ts * 100, 4), num(run.dEff[nP - 1] * 100, 4) + " / – / " + num(idle * 100, 4)],
        ["ประสิทธิภาพ (จำลอง)", "–", num(pout / pin * 100, 4) + " %"]
      ];
      el.querySelector(".bk-tbl").innerHTML = '<table class="bk-t"><thead><tr><th>ปริมาณ</th><th>ทฤษฎี (สูตรบนหน้านี้)</th><th>จำลองสวิตชิ่ง</th></tr></thead><tbody>' + rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</tbody></table>" +
        '<p class="bk-note">ทฤษฎี = สูตรปิด (CCM รวมค่าแฝง / DCM แบบอุดมคติ) · จำลอง = แก้สมการวงจรทุกช่วงเวลาสวิตช์ด้วย RK4 ไม่ใช้สูตรใดๆ จากหน้านี้ จึงเป็นการตรวจสอบอิสระ</p>';
    }
    el.bkApi = { preset: function (name, ds) { load(name); U.applySet(st, ds && ds.bkSet); if (ds && ds.bkSet && /(^|;)\s*Vo=/.test(ds.bkSet)) st.mode = "Vo"; build(); } };
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.preset) { load(b.dataset.preset); build(); }
      else if (b.dataset.act === "ideal") { Object.assign(st, IDEAL); build(); el.querySelector(".bk-more").open = true; }
      else if (b.dataset.act === "real") { Object.assign(st, REAL); build(); el.querySelector(".bk-more").open = true; }
    });
    el.addEventListener("change", function (e) {
      var t = e.target;
      if (t.type === "radio") { st.mode = t.value; build(); }
      else if (t.type === "checkbox" && t.dataset.k === "sync") { st.sync = t.checked; update(); }
    });
    build();
  }

  // ================================================================================================ 2. duty vs load / M(D,K)
  function initDuty(el) {
    var view = el.dataset.view || "duty-load", fields = {}, st;
    if (view === "duty-load") {
      st = { Vg: 24, Vo: 12, L: 300e-6, fs: 50e3, Io: 0.6, para: false, Imax: 2 };
      var ks = [F.Vg, F.Vo, F.L, F.fs, { k: "Io", label: "กระแสโหลด Io (จุดอ่านค่า)", unit: "A", min: 0.01, max: 3, log: true }];
      ks.forEach(function (s) { fields[s.k] = s; });
      html(el, '<div class="bk-grid"><div class="bk-ctl">' + ks.map(function (s) { return U.field(s, st); }).join("") +
        '<label class="bk-chk"><input type="checkbox" data-k="para"> รวมค่าแฝงจริง (DCR 0.1 Ω, Rds 50 mΩ, Vf 0.4 V)</label></div>' +
        '<div class="bk-out"><div class="bk-status" aria-live="polite"></div><div class="bk-fig"></div><div class="bk-note">แกนนอน = กระแสโหลดที่ต้องการ (ยิ่งขวา ยิ่งหนัก) · เส้นฟ้า = ดิวตี้ที่ <b>ต้องใช้</b> เพื่อให้ได้ Vo เป้าหมายพอดี</div></div></div>');
      var upd = U.debounce(function () {
        var Ts = 1 / st.fs, Ioc = st.Vo * (1 - st.Vo / st.Vg) * Ts / (2 * st.L), I0 = 0.005, I1 = Math.max(st.Imax, Ioc * 3), N = 400, xs = [], yI = [], yP = [], i;
        var base = { Vg: st.Vg, L: st.L, fs: st.fs, C: 100e-6 };
        var para = st.para ? { rL: 0.1, rC: 0.05, Ron: 0.05, Vf: 0.4, Rd: 0 } : { rL: 0, rC: 0, Ron: 0, Vf: 0, Rd: 0 };
        for (i = 0; i <= N; i++) {
          var Io = I0 + (I1 - I0) * i / N, p = Object.assign({ R: st.Vo / Io }, base, para), d = B.dutyForVo(p, st.Vo);
          xs.push(Io); yI.push(d.D); yP.push(d.Dideal);
        }
        var p0 = Object.assign({ R: st.Vo / st.Io }, base, para), d0 = B.dutyForVo(p0, st.Vo), K = 2 * st.L / ((st.Vo / st.Io) * Ts);
        var fig = el.querySelector(".bk-fig");
        U.draw(fig, { title: "ดิวตี้ที่ต้องใช้ให้ได้ Vo = " + num(st.Vo) + " V เมื่อโหลดเปลี่ยน", xlabel: "กระแสโหลด Io (A)", ylabel: "D", xmin: I0, xmax: I1, ymin: 0, ymax: Math.min(1, Math.max.apply(null, yI) * 1.15 + 0.02),
          series: [{ x: xs, y: yI, cls: "s1", w: 2.6, name: "D ที่ต้องใช้" }, { x: xs, y: yP, cls: "s4", dash: true, name: "D = Vo/Vin (อุดมคติ)" }],
          vlines: [{ x: Ioc, cls: "s2", label: "Io,crit = " + num(Ioc, 3) + " A" }], points: [{ x: st.Io, y: d0.D, cls: "s2", r: 5.5 }],
          bands: [{ x0: I0, x1: Ioc, cls: "idle", label: "DCM" }, { x0: Ioc, x1: I1, cls: "on", label: "CCM" }], xname: "Io", yfmt: function (y) { return num(y, 4); }, xfmt: function (x) { return num(x, 3) + " A"; } });
        el.querySelector(".bk-status").innerHTML = "ที่ Io = " + num(st.Io, 3) + " A (R = " + num(st.Vo / st.Io, 4) + " Ω): " + badge(d0.mode) + " K = " + num(K, 4) + ", 1−D = " + num(1 - st.Vo / st.Vg, 4) + " ⇒ ต้องใช้ <b>D = " + num(d0.D, 5) + "</b>" + (d0.mode === "DCM" ? " (น้อยกว่า Vo/Vin = " + num(d0.Dideal, 5) + " เพราะ DCM ให้ Vo สูงกว่า)" : " (≈ Vo/Vin" + (st.para ? " + ชดเชยความสูญเสีย" : "") + ")") + "<br>จุดแบ่ง CCM/DCM: Io,crit = Vo(1−Vo/Vin)Ts/(2L) = " + num(Ioc, 4) + " A ⇔ R,crit = " + num(st.Vo / Ioc, 4) + " Ω";
      }, 30);
      U.bind(el, st, fields, upd);
      el.addEventListener("change", function (e) { if (e.target.dataset.k === "para") { st.para = e.target.checked; upd(); } });
      upd();
    } else { // m-vs-d
      st = { K: 0.3, D: 0.5 };
      fields.K = { k: "K", label: "ค่า K = 2L/(R·Ts)", unit: "", min: 0.02, max: 5, log: true };
      fields.D = { k: "D", label: "ดิวตี้ D", unit: "", min: 0.02, max: 0.98, step: 0.005 };
      html(el, '<div class="bk-grid"><div class="bk-ctl">' + U.field(fields.K, st) + U.field(fields.D, st) + '<p class="bk-note">K ใหญ่ = L ใหญ่ / โหลดหนัก / fs สูง (CCM) · K เล็ก = โหลดเบา (DCM)</p></div>' +
        '<div class="bk-out"><div class="bk-status" aria-live="polite"></div><div class="bk-fig"></div></div></div>');
      var upd2 = U.debounce(function () {
        var Ks = [0.05, 0.1, 0.2, 0.5, 1], xs = [], series = [], i, N = 300;
        function Mof(K, D) { return K > 1 - D ? D : 2 / (1 + Math.sqrt(1 + 4 * K / (D * D))); }
        for (i = 0; i <= N; i++) xs.push(0.01 + 0.98 * i / N);
        series.push({ x: xs, y: xs.map(function (d) { return d; }), cls: "s4", dash: true, name: "CCM: M = D" });
        Ks.forEach(function (K) { series.push({ x: xs, y: xs.map(function (d) { return Mof(K, d); }), cls: "s5", w: 1.4, name: K === 0.05 ? "K = 0.05 … 1" : "" }); });
        series.push({ x: xs, y: xs.map(function (d) { return Mof(st.K, d); }), cls: "s1", w: 2.8, name: "K = " + num(st.K, 3) });
        var Mx = Mof(st.K, st.D), mode = st.K > 1 - st.D ? "CCM" : "DCM", Dc = 1 - st.K;
        U.draw(el.querySelector(".bk-fig"), { title: "อัตราส่วนแปลงผัน M = Vo/Vin เทียบกับ D", xlabel: "ดิวตี้ D", ylabel: "M", xmin: 0, xmax: 1, ymin: 0, ymax: 1.02, series: series,
          points: [{ x: st.D, y: Mx, cls: "s2", r: 5.5 }], vlines: Dc > 0 && Dc < 1 ? [{ x: Dc, cls: "s2", label: "ขอบ D = 1−K" }] : [], bands: Dc > 0 ? [{ x0: 0, x1: Math.min(1, Dc), cls: "idle", label: "DCM" }, { x0: Math.min(1, Dc), x1: 1, cls: "on", label: "CCM" }] : [{ x0: 0, x1: 1, cls: "on", label: "CCM" }],
          xname: "D", yfmt: function (y) { return num(y, 4); }, xfmt: function (x) { return num(x, 3); } });
        el.querySelector(".bk-status").innerHTML = "K = " + num(st.K, 4) + ", D = " + num(st.D, 4) + ": " + badge(mode) + " ⇒ <b>M = " + num(Mx, 5) + "</b> (Vo = " + num(Mx * 24, 4) + " V ถ้า Vin = 24 V)" + (mode === "DCM" ? " · สูตร M = 2/(1+√(1+4K/D²))" : " · สูตร M = D");
      }, 30);
      U.bind(el, st, fields, upd2);
      upd2();
    }
  }

  // ================================================================================================ 3. state-space builder
  function initSS(el) {
    var st = Object.assign({ Vg: 24, D: 0.5, R: 10, L: 300e-6, C: 100e-6, fs: 50e3 }, el.dataset.preset === "real" ? REAL : IDEAL), fields = {};
    ["Vg", "D", "R", "L", "C", "rL", "rC", "Ron", "Vf", "Rd"].forEach(function (k) { fields[k] = F[k]; });
    var cell = U.mat;
    function render() {
      var keys = ["Vg", "D", "R", "L", "C"], par = ["rL", "rC", "Ron", "Vf", "Rd"];
      html(el, '<div class="bk-top"><div class="bk-presets">' + btn("ideal", "อุดมคติ (ไม่มีค่าแฝง)", el.dataset.preset !== "real" ? "" : "") + btn("real", "มีค่าแฝงจริง (DCR, ESR, Rds, Vf)") + btn("light", "โหลดเบา R = 100 Ω") + "</div></div>" +
        '<div class="bk-grid"><div class="bk-ctl">' + keys.map(function (k) { return U.field(F[k], st); }).join("") + '<details class="bk-more" open><summary>ค่าความต้านทานแฝง</summary>' + par.map(function (k) { return U.field(F[k], st); }).join("") + "</details>" +
        '<p class="bk-note">เปลี่ยนค่าแล้วเมทริกซ์ทุกตัวคำนวณใหม่ทันที ใช้ตรวจคำตอบที่คำนวณมือ</p></div><div class="bk-out"><div class="bk-eqs"></div></div></div>');
      calc();
    }
    var calc = U.debounce(function () {
      var p = pOf(st), D = st.D, m = B.ssModel(p, D), Dp = 1 - D, n4 = function (x) { return num(x, 4); };
      var eq = function (h, body, note) { return '<div class="bk-eq"><h5>' + h + "</h5>" + body + (note ? '<span class="ex">' + note + "</span>" : "") + "</div>"; };
      var row = function (lbl, M) { return '<div class="row"><span>' + lbl + " =</span>" + cell(M, 4) + "</div>"; };
      var out = [];
      out.push(eq("① ช่วง ON — สวิตช์ปิดวงจร (0 → D·Ts)",
        '<div class="row">L·diL/dt = Vg − (Ron + rL)·iL − v &nbsp;,&nbsp; C·dvC/dt = iL − v/R &nbsp;,&nbsp; v = a·vC + b·iL</div>' +
        '<div class="row">a = R/(R+rC) = ' + n4(m.a) + " &nbsp; b = R·rC/(R+rC) = " + n4(m.b) + " Ω</div>" + row("A₁", m.A1) + row("B₁ (คูณ Vg)", [[m.B1[0]], [m.B1[1]]])));
      out.push(eq("② ช่วง OFF — ไดโอดนำ (D·Ts → Ts)",
        '<div class="row">L·diL/dt = −Vf − (Rd + rL)·iL − v &nbsp;,&nbsp; C·dvC/dt = iL − v/R</div>' + row("A₂", m.A2) + row("B₂ (คูณ Vg)", [[0], [0]]) + row("e₂ (แหล่งคงที่ Vf)", [[m.e2[0]], [m.e2[1]]]),
        "ใน OFF แรงดันอินพุตไม่ต่อกับ L จึง B₂ = 0 · ถ้า Rd = Ron ค่า A₂ จะเท่ากับ A₁"));
      out.push(eq("③ เฉลี่ยตามเวลา — D = " + n4(D) + ", D′ = " + n4(Dp),
        '<div class="row">A = D·A₁ + D′·A₂</div>' + row("A", m.A) + '<div class="row">B = D·B₁ + D′·B₂</div>' + row("B", [[m.Bg[0]], [m.Bg[1]]]) + '<div class="row">e = D′·e₂</div>' + row("e", [[-Dp * p.Vf / p.L], [0]]),
        "นี่คือ \"แบบจำลองเฉลี่ย\": x′ = A·x + B·Vg + e โดย x = [⟨iL⟩, ⟨vC⟩] คือค่าเฉลี่ยรายคาบ"));
      var chk = B.steadyCheck(p, D, 400), th = B.ccmSteady(p, D);
      out.push(eq("④ จุดทำงาน DC: X = −A⁻¹(B·Vg + e)", row("X = [IL ; VC]", [[m.IL], [m.VC]]) + '<div class="row">Vo = a·VC + b·IL = <b>' + n4(m.V) + " V</b> &nbsp;(สูตรปิด: " + n4(th.V) + " V)</div>" + '<div class="row">จำลองสวิตชิ่งจริง: Vo = ' + n4(chk.V) + " V · IL = " + n4(chk.IL) + " A</div>",
        th.ccm ? "ตรงกับ Vo = D·Vin ในกรณีอุดมคติ" : "⚠ วงจรนี้เข้า DCM — แบบจำลอง CCM ใช้ไม่ได้ (ดูหน้า DCM)"));
      out.push(eq("⑤ รบกวนสัญญาณเล็ก: d = D + d̂, vg = Vg + v̂g, x = X + x̂",
        '<div class="row">B<sub>d</sub> = (A₁−A₂)X + (B₁−B₂)Vg + (e₁−e₂)</div>' + row("B_d", [[m.Bd[0]], [m.Bd[1]]]) + row("B_g = D·B₁", [[m.Bg[0]], [m.Bg[1]]]) + row("B_x (กระแสโหลด)", [[m.Bx[0]], [m.Bx[1]]]) + row("C (เอาต์พุต v̂o)", [[m.b, m.a]]),
        "x̂′ = A·x̂ + B_g·v̂g + B_d·d̂ + B_x·îx ,  v̂o = C·x̂ − b·îx"));
      var so = B.secondOrder([1, -m.tr, m.det]), ev = m.eig;
      out.push(eq("⑥ ขั้วของระบบ = ค่าไอเกนของ A",
        '<div class="row">λ = ' + ev.map(function (r) { return n4(r.re) + (r.im ? (r.im > 0 ? " + j" : " − j") + n4(Math.abs(r.im)) : ""); }).join(" , ") + " rad/s</div>" +
        (so ? '<div class="row">ω₀ = ' + n4(so.w0) + " rad/s (f₀ = " + n4(so.f0) + " Hz) · ζ = " + n4(so.zeta) + " · Q = " + n4(so.Q) + "</div>" : "") + '<div class="row">tr(A) = ' + n4(m.tr) + " , det(A) = " + n4(m.det) + "</div>",
        "ขั้วอยู่ซีกซ้ายเสมอ (เสถียร) · Q สูง = ขั้วคู่ใกล้แกน jω = กระโดดแรงเมื่อ d เปลี่ยน"));
      el.querySelector(".bk-eqs").innerHTML = out.join("");
    }, 50);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !b.dataset.act) return;
      if (b.dataset.act === "ideal") Object.assign(st, IDEAL, { R: 10 });
      else if (b.dataset.act === "real") Object.assign(st, REAL, { R: 10 });
      else if (b.dataset.act === "light") st.R = 100;
      render();
    });
    el.bkApi = { preset: function (name, ds) { Object.assign(st, { Vg: 24, D: 0.5, R: 10, L: 300e-6, C: 100e-6, fs: 50e3 }, name === "real" ? REAL : IDEAL); U.applySet(st, ds && ds.bkSet); render(); } };
    U.bind(el, st, fields, function () { calc(); });
    render();
  }

  // ================================================================================================ 4. switching vs averaged vs linear
  var AVG_PRESETS = {
    small: { name: "สเต็ปเล็ก ΔD = +0.02", st: { dD: 0.02, stim: "step" } },
    large: { name: "สเต็ปใหญ่ ΔD = +0.25", st: { dD: 0.25, stim: "step" } },
    sine: { name: "ไซน์ 400 Hz ±0.03", st: { dD: 0.03, stim: "sine", fm: 400 } },
    lowfs: { name: "fs ต่ำ 8 kHz (ละเมิดข้อสมมติ)", st: { dD: 0.05, stim: "step", fs: 8e3 } },
    para: { name: "มีค่าแฝงจริง", st: { dD: 0.05, stim: "step", para: true } }
  };
  function initAvg(el) {
    var st = { Vg: 24, D: 0.5, dD: 0.05, stim: "step", fm: 400, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, para: false }, fields = {};
    var avF = { dD: { k: "dD", label: "ขนาดการเปลี่ยน ΔD (หรือแอมพลิจูดไซน์)", unit: "", min: 0.005, max: 0.4, log: true }, fm: { k: "fm", label: "ความถี่ไซน์ของ d", unit: "Hz", min: 20, max: 5000, log: true } };
    ["Vg", "D", "R", "L", "C", "fs"].forEach(function (k) { fields[k] = F[k]; }); fields.dD = avF.dD; fields.fm = avF.fm;
    var pre = AVG_PRESETS[el.dataset.preset]; if (pre) Object.assign(st, pre.st);
    function render() {
      html(el, '<div class="bk-top"><div class="bk-presets">' + Object.keys(AVG_PRESETS).map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm" data-preset="' + k + '">' + AVG_PRESETS[k].name + "</button>"; }).join("") + "</div></div>" +
        '<div class="bk-grid"><div class="bk-ctl"><div class="bk-sw"><span>การกระตุ้น d(t)</span><label><input type="radio" name="bkav' + (render.n = (render.n || 0) + 1) + '" value="step"' + (st.stim === "step" ? " checked" : "") + '> สเต็ป D → D+ΔD</label><label><input type="radio" name="bkav' + render.n + '" value="sine"' + (st.stim === "sine" ? " checked" : "") + "> ไซน์ D + ΔD·sin(2πft)</label></div>" +
        ["Vg", "D"].map(function (k) { return U.field(F[k], st); }).join("") + U.field(avF.dD, st) + (st.stim === "sine" ? U.field(avF.fm, st) : "") + ["R", "L", "C", "fs"].map(function (k) { return U.field(F[k], st); }).join("") +
        '<label class="bk-chk"><input type="checkbox" data-k="para"' + (st.para ? " checked" : "") + "> ใช้ค่าแฝงจริง (DCR 0.1 Ω, ESR 50 mΩ, Rds 50 mΩ, Vf 0.4 V)</label></div>" +
        '<div class="bk-out"><div class="bk-status" aria-live="polite"></div><div class="bk-figs"><div class="bk-fig f-v"></div><div class="bk-fig f-i"></div></div><div class="bk-tbl"></div></div></div>');
      calc();
    }
    var calc = U.debounce(function () {
      var par = st.para ? REAL : IDEAL, p = { Vg: st.Vg, R: st.R, L: st.L, C: st.C, fs: st.fs, rL: par.rL, rC: par.rC, Ron: par.Ron, Rd: par.Rd, Vf: par.Vf }, Ts = 1 / p.fs;
      var D = st.D, o = B.openLoop(p, D), m = B.ssModel(p, D), ev = m.eig, alpha = Math.max(5, -Math.max(ev[0].re, ev[1] ? ev[1].re : ev[0].re));
      var T = st.stim === "step" ? Math.min(0.06, Math.max(3e-3, 9 / alpha)) : Math.min(0.06, Math.max(4e-3, 7 / st.fm)), tstep = 0.15 * T, nP = Math.max(20, Math.round(T / Ts)); T = nP * Ts;
      var dfun, ufun, ctrl;
      if (st.stim === "step") { dfun = function (t) { return t >= tstep ? D + st.dD : D; }; ufun = function (t) { return t >= tstep ? st.dD : 0; }; ctrl = { type: "open", D: D, D2: D + st.dD, stepAt: tstep }; }
      else { dfun = function (t) { return D + st.dD * Math.sin(2 * Math.PI * st.fm * t); }; ufun = function (t) { return st.dD * Math.sin(2 * Math.PI * st.fm * t); }; ctrl = { type: "open", D: D }; }
      var per = st.stim === "sine" ? { d: { amp: st.dD, f: st.fm } } : null;
      var init = B.steadyInit(p, D);
      var sw = B.simulate({ p: p, ctrl: ctrl, perturb: per, nPer: nP, init: init, nsub: 12, capture: { t0: 0, t1: T } });
      // with perturb.d the simulator samples sin at period centres, exactly like the staircase d(t) → use the same for models
      var dt = Ts / 4, av = B.simAveraged(p, dfun, T, dt, { iL: o.IL, vC: o.V }), lin = B.simLinear(m, "d", ufun, T, dt);
      var w = sw.wave, tms = w.t.map(function (t) { return t * 1e3; });
      var ctr = [], vsm = [], ism = [], k;
      for (k = 0; k < nP; k++) { ctr.push((k + 0.5) * Ts * 1e3); vsm.push(sw.vMean[k]); ism.push(sw.iLMean[k]); }
      var tav = av.t.map(function (t) { return t * 1e3; }), vlin = lin.v.map(function (x) { return o.V + x; }), ilin = lin.iL.map(function (x) { return o.IL + x; });
      var e = { a: [0, 0, 0], l: [0, 0, 0], ai: [0, 0], li: [0, 0] }, n = 0, vsw = Math.max.apply(null, vsm) - Math.min.apply(null, vsm);
      for (k = 0; k < nP; k++) {
        var idx = Math.min(av.t.length - 1, Math.round((k + 0.5) * Ts / dt)), ea = av.v[idx] - vsm[k], el_ = vlin[idx] - vsm[k], eia = av.iL[idx] - ism[k], eil = ilin[idx] - ism[k];
        e.a[0] += ea * ea; e.l[0] += el_ * el_; e.a[1] = Math.max(e.a[1], Math.abs(ea)); e.l[1] = Math.max(e.l[1], Math.abs(el_)); e.ai[0] += eia * eia; e.li[0] += eil * eil; e.ai[1] = Math.max(e.ai[1], Math.abs(eia)); e.li[1] = Math.max(e.li[1], Math.abs(eil)); n++;
      }
      var rms = function (x) { return Math.sqrt(x / n); };
      var ex = { title: "", xlabel: "เวลา (ms)", xmin: 0, xmax: T * 1e3, xname: "t", xfmt: function (x) { return num(x, 4) + " ms"; }, vlines: st.stim === "step" ? [{ x: tstep * 1e3, cls: "s2", label: "d เปลี่ยน" }] : [] };
      U.draw(el.querySelector(".f-v"), Object.assign({}, ex, { title: "แรงดันขาออก vo (V)", ylabel: "V", yfmt: function (y) { return num(y, 5) + " V" }, series: [
        { x: tms, y: w.v, cls: "s4", w: 1, name: "สวิตชิ่งจริง (ทุกจังหวะ)" }, { x: ctr, y: vsm, cls: "s1", w: 2.4, name: "ค่าเฉลี่ยรายคาบของสวิตชิ่ง" },
        { x: tav, y: av.v, cls: "s2", dash: true, w: 2.2, name: "แบบจำลองเฉลี่ย (ไม่เชิงเส้น)" }, { x: tav, y: vlin, cls: "s5", dash: true, w: 2.2, name: "สัญญาณเล็ก (เชิงเส้น)" }] }));
      U.draw(el.querySelector(".f-i"), Object.assign({}, ex, { title: "กระแสตัวเหนี่ยวนำ iL (A)", ylabel: "A", yfmt: function (y) { return num(y, 5) + " A" }, series: [
        { x: tms, y: w.iL, cls: "s4", w: 1, name: "สวิตชิ่งจริง" }, { x: ctr, y: ism, cls: "s1", w: 2.4, name: "ค่าเฉลี่ยรายคาบ" },
        { x: tav, y: av.iL, cls: "s2", dash: true, w: 2.2, name: "แบบจำลองเฉลี่ย" }, { x: tav, y: ilin, cls: "s5", dash: true, w: 2.2, name: "สัญญาณเล็ก" }] }));
      var dV = Math.abs(av.v[av.v.length - 1] - o.V) + 1e-9;
      el.querySelector(".bk-status").innerHTML = (o.mode === "DCM" ? badge("DCM") + " ⚠ วงจรนี้อยู่ DCM — แบบจำลองเฉลี่ย CCM ไม่ถูกต้อง (ลองเพิ่มโหลดหรือ L) · " : badge("CCM") + " ") +
        "จุดทำงาน Vo = " + num(o.V, 5) + " V, IL = " + num(o.IL, 4) + " A · ขั้ว f₀ = " + num(B.secondOrder([1, -m.tr, m.det]).f0, 4) + " Hz, Q = " + num(B.secondOrder([1, -m.tr, m.det]).Q, 3) + " · ความถี่สวิตช์ / f₀ = " + num(st.fs / B.secondOrder([1, -m.tr, m.det]).f0, 3) + " เท่า" + (st.fs / B.secondOrder([1, -m.tr, m.det]).f0 < 20 ? " ⚠ ใกล้เกินไป การเฉลี่ยเริ่มไม่แม่น" : "");
      var pct = function (x) { return num(x / Math.max(vsw, 1e-6) * 100, 3) + " %"; };
      el.querySelector(".bk-tbl").innerHTML = '<table class="bk-t"><thead><tr><th>เทียบกับค่าเฉลี่ยรายคาบของสวิตชิ่งจริง</th><th>RMS ของ vo</th><th>สูงสุดของ vo</th><th>สูงสุดของ iL</th></tr></thead><tbody>' +
        "<tr><td>แบบจำลองเฉลี่ย (ไม่เชิงเส้น)</td><td>" + num(rms(e.a[0]) * 1e3, 3) + " mV (" + pct(rms(e.a[0])) + " ของการแกว่ง)</td><td>" + num(e.a[1] * 1e3, 3) + " mV</td><td>" + num(e.ai[1] * 1e3, 3) + " mA</td></tr>" +
        "<tr><td>สัญญาณเล็ก (เชิงเส้น)</td><td>" + num(rms(e.l[0]) * 1e3, 3) + " mV (" + pct(rms(e.l[0])) + " ของการแกว่ง)</td><td>" + num(e.l[1] * 1e3, 3) + " mV</td><td>" + num(e.li[1] * 1e3, 3) + " mA</td></tr></tbody></table>" +
        '<p class="bk-note">การแกว่งของ vo ในรอบนี้ = ' + num(vsw, 4) + " V p-p · เลื่อน ΔD ให้ใหญ่ขึ้นแล้วดูว่าเส้นประม่วง (เชิงเส้น) เริ่มคลาดจากเส้นฟ้า (ค่าเฉลี่ยจริง) ขณะที่เส้นประส้ม (เฉลี่ยไม่เชิงเส้น) ยังตามได้</p>";
    }, 80);
    el.addEventListener("click", function (e) { var b = e.target.closest("button[data-preset]"); if (b) { Object.assign(st, { Vg: 24, D: 0.5, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, para: false, stim: "step", fm: 400 }, AVG_PRESETS[b.dataset.preset].st); render(); } });
    el.addEventListener("change", function (e) { var t = e.target; if (t.type === "radio") { st.stim = t.value; render(); } else if (t.dataset && t.dataset.k === "para") { st.para = t.checked; calc(); } });
    el.bkApi = { preset: function (name, ds) { Object.assign(st, { Vg: 24, D: 0.5, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, para: false, stim: "step", fm: 400 }, (AVG_PRESETS[name] || AVG_PRESETS.small).st); U.applySet(st, ds && ds.bkSet); render(); } };
    U.bind(el, st, fields, function () { calc(); });
    render();
  }

  // ================================================================================================ 5. transfer-function explorer + virtual network analyzer
  var INPUTS = [["d", "d̂ — ดิวตี้ (control)"], ["vg", "v̂g — แรงดันอินพุต (line)"], ["ix", "îx — กระแสโหลดที่เปลี่ยน (load)"]];
  var OUTPUTS = [["vo", "v̂o — แรงดันขาออก"], ["iL", "îL — กระแสตัวเหนี่ยวนำ"], ["iC", "îC — กระแสตัวเก็บประจุ"], ["ig", "îg — กระแสอินพุตเฉลี่ย"]];
  var UNIT = { "d>vo": "V", "vg>vo": "V/V", "ix>vo": "Ω", "d>iL": "A", "vg>iL": "A/V", "ix>iL": "A/A", "d>iC": "A", "vg>iC": "A/V", "ix>iC": "A/A", "d>ig": "A", "vg>ig": "A/V", "ix>ig": "A/A" };
  var NAME = { "d>vo": "Gvd", "vg>vo": "Gvg", "ix>vo": "Zout", "d>iL": "GiLd", "vg>iL": "GiLg", "ix>iL": "GiLx", "d>iC": "GiCd", "vg>iC": "GiCg", "ix>iC": "GiCx", "d>ig": "Gigd", "vg>ig": "Yin", "ix>ig": "Gigx" };
  var TF_PRESETS = {
    ideal: { name: "อุดมคติ (R = 10 Ω)", st: { R: 10 }, para: false }, esr: { name: "มี ESR เท่านั้น", st: { R: 10 }, para: "esr" }, real: { name: "ค่าแฝงจริง", st: { R: 10 }, para: true },
    light: { name: "โหลดเบา → DCM (R = 100 Ω)", st: { R: 100 }, para: false }, heavy: { name: "โหลดหนัก R = 2 Ω", st: { R: 2 }, para: true }
  };
  function initTF(el) {
    var st = { Vg: 24, D: 0.5, R: 10, L: 300e-6, C: 100e-6, fs: 50e3, rL: 0, rC: 0, Ron: 0, Vf: 0, Rd: 0, inp: el.dataset.in || "d", out: el.dataset.out || "vo", sc: 1, np: 12, showStep: true }, fields = {}, meas = null, models = null;
    ["Vg", "D", "R", "L", "C", "fs", "rL", "rC", "Ron", "Vf", "Rd"].forEach(function (k) { fields[k] = F[k]; });
    function applyPreset(n) { var P = TF_PRESETS[n]; if (!P) return; Object.assign(st, { R: 10, D: 0.5 }, IDEAL, P.st); if (P.para === true) Object.assign(st, REAL); else if (P.para === "esr") st.rC = 0.05; meas = null; }
    if (el.dataset.preset) applyPreset(el.dataset.preset);
    function render() {
      html(el, '<div class="bk-top"><div class="bk-presets">' + Object.keys(TF_PRESETS).map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm" data-preset="' + k + '">' + TF_PRESETS[k].name + "</button>"; }).join("") + "</div></div>" +
        '<div class="bk-grid"><div class="bk-ctl"><div class="bk-sel"><label>อินพุต (สิ่งที่เปลี่ยน)</label><select data-sel="inp">' + INPUTS.map(function (o) { return '<option value="' + o[0] + '"' + (st.inp === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div>" +
        '<div class="bk-sel"><label>เอาต์พุต (สิ่งที่วัด)</label><select data-sel="out">' + OUTPUTS.map(function (o) { return '<option value="' + o[0] + '"' + (st.out === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div>" +
        ["Vg", "D", "R", "L", "C", "fs"].map(function (k) { return U.field(F[k], st); }).join("") + '<details class="bk-more"><summary>ค่าความต้านทานแฝง</summary>' + ["rL", "rC", "Ron", "Vf", "Rd"].map(function (k) { return U.field(F[k], st); }).join("") + "</details></div>" +
        '<div class="bk-out"><div class="bk-status" aria-live="polite"></div><div class="bk-eqs tfinfo"></div><div class="bk-figs"><div class="bk-fig f-mag"></div><div class="bk-fig f-ph"></div><div class="bk-fig f-step"></div></div>' +
        '<div class="bk-eq vna"><h5>เครื่องวัดสัญญาณเล็กเสมือน (virtual network analyzer)</h5><div class="bk-run"><label>ขนาดสัญญาณรบกวน <select data-sel="sc"><option value="0.25">¼×</option><option value="1" selected>1× (เล็ก · ปรับอัตโนมัติ)</option><option value="4">4×</option><option value="16">16× (ใหญ่)</option></select></label>' +
        '<label>จำนวนจุด <select data-sel="np"><option value="8">8</option><option value="12" selected>12</option><option value="18">18</option></select></label>' + btn("vna", "▶ วัดด้วยสวิตชิ่งจริง") + btn("clr", "ล้างจุดวัด") + '<span class="bk-busy"></span></div>' +
        '<p class="bk-note">ฉีดไซน์เล็กๆ เข้าอินพุตที่เลือกของ <b>วงจรสวิตชิ่งจริง</b> (ไม่ใช่แบบจำลอง) ที่หลายความถี่ แล้ววัดแอมพลิจูดและเฟสของเอาต์พุตด้วยการสหสัมพันธ์ (correlation) — จุดควรตกบนเส้นทฤษฎี</p></div>' +
        '<div class="bk-tbl tftable"></div></div></div>');
      calc();
    }
    var calc = U.debounce(function () { models = compute(); draw(); }, 50);
    function params() { return { Vg: st.Vg, R: st.R, L: st.L, C: st.C, fs: st.fs, rL: st.rL, rC: st.rC, Ron: st.Ron, Rd: st.Rd, Vf: st.Vf }; }
    function epsFor(out) { return B.autoEps(models.p, models.D, st.inp, out) * st.sc; }
    function compute() {
      var p = params(), D = st.D, o = B.openLoop(p, D), m = B.ssModel(p, D), ccm = o.mode === "CCM", dm = !ccm ? B.dcmModel(p, D) : null, key = st.inp + ">" + st.out, th, note = "";
      var G = key === "ix>vo" ? B.zout(m) : B.tf(m, st.inp, st.out); th = G;
      if (!ccm) {
        if (key === "d>vo") th = dm.Gvd; else if (key === "vg>vo") th = dm.Gvg; else if (key === "ix>vo") th = dm.Zout;
        else { th = null; note = "DCM: แล็บนี้มีแบบจำลองอันดับหนึ่งเฉพาะ v̂o ← d̂, v̂g, îx · คู่ที่เลือกไม่มีเส้นทฤษฎี (ดูเส้นประ CCM เพื่อเทียบ)"; }
      }
      return { p: p, D: D, o: o, m: m, ccm: ccm, dm: dm, G: G, th: th, note: note, key: key };
    }
    function draw() {
      var M = models, p = M.p, so = B.secondOrder(M.G.den), fmax = Math.min(p.fs / 2, 60e3), g = M.th || M.G, key = M.key;
      var bd = B.bode(g, 5, fmax, 260), bdC = !M.ccm ? B.bode(M.G, 5, fmax, 260) : null;
      var f0 = so ? so.f0 : NaN;
      var st1 = el.querySelector(".bk-status");
      st1.innerHTML = badge(M.o.mode) + " จุดทำงาน: D = " + num(M.D, 4) + " → Vo = " + num(M.o.V, 5) + " V, Io = " + num(M.o.IL, 4) + " A" + (M.ccm ? "" : " (ใช้แบบจำลอง DCM อันดับหนึ่ง: ขั้วเดียวที่ f<sub>p</sub> = " + num(M.dm.fp, 4) + " Hz)") + (M.note ? "<br>" + M.note : "") + (so && so.Q > 100 ? "<br>⚠ Q สูงมาก (" + num(so.Q, 3) + ") ระบบแทบไม่มีการหน่วง การวัดด้วยสวิตชิ่งใช้เวลานานจึงจะนิ่งและอาจคลาดเคลื่อน" : "") + (p.fs > 2e5 ? "<br>fs สูงกว่า 200 kHz: เครื่องวัดจะใช้ 8 จุดเพื่อไม่ให้ใช้เวลานาน" : "");
      // numbers + named form
      var G = M.G, nz = B.pRoots(B.trim(G.num)), dc = B.dcGain(G), un = UNIT[key];
      var polesTxt = so && isFinite(so.w0) ? "ω₀ = " + num(so.w0, 4) + " rad/s (f₀ = " + num(so.f0, 4) + " Hz), ζ = " + num(so.zeta, 3) + ", Q = " + num(so.Q, 3) : "–";
      var zerosTxt = nz.length ? nz.map(function (r) { return "s = " + (r.im ? num(r.re, 4) + " ± j" + num(Math.abs(r.im), 4) : num(r.re, 4)) + " rad/s" + (r.re > 0 ? " (ขวา! RHP)" : r.im === 0 ? " (f = " + num(Math.abs(r.re) / 2 / Math.PI, 4) + " Hz)" : ""); }).join(" ; ") : "ไม่มีศูนย์";
      el.querySelector(".tfinfo").innerHTML =
        '<div class="bk-eq"><h5>' + NAME[key] + "(s) = " + (st.out === "vo" ? "v̂o" : st.out === "iL" ? "îL" : st.out === "iC" ? "îC" : "îg") + " / " + (st.inp === "d" ? "d̂" : st.inp === "vg" ? "v̂g" : "îx") + (key === "ix>vo" ? " &nbsp; (Zout = −v̂o/îx: แรงดันตกต่อกระแสโหลดที่เพิ่มขึ้น)" : "") + '</h5>' +
        '<div class="row">ตัวเศษ N(s) = ' + B.polyStr(G.num, "s", 4) + "</div>" + '<div class="row">ตัวส่วน D(s) = ' + B.polyStr(G.den, "s", 4) + "</div>" +
        '<div class="row">อัตราขยาย DC = <b>' + num(dc, 5) + " " + un + "</b>" + (dc === 0 ? " (ไม่มีอัตราขยายที่ DC — ศูนย์ที่ s = 0)" : " (" + num(20 * Math.log10(Math.abs(dc)), 4) + " dB)") + "</div>" + '<div class="row">ขั้ว: ' + polesTxt + "</div>" + '<div class="row">ศูนย์: ' + zerosTxt + "</div></div>";
      // charts
      var pts = meas ? meas.pts : [];
      var vl = [{ x: p.fs / 10, cls: "s2", label: "fs/10" }], series = [{ x: bd.f, y: bd.mag, cls: "s1", w: 2.6, name: M.th ? (M.ccm ? "ทฤษฎี (สูตรเมทริกซ์)" : "ทฤษฎี DCM") : "CCM (อ้างอิง)" }];
      if (bdC && M.th) series.push({ x: bdC.f, y: bdC.mag, cls: "s4", dash: true, name: "ถ้าเป็น CCM" });
      var mp = pts.map(function (q) { return { x: q.f, y: q.res.db, cls: "s2", r: 4.5, name: "วัดจากสวิตชิ่งจริง" }; });
      var mph = pts.map(function (q) { return { x: q.f, y: q.res.ph, cls: "s2", r: 4.5, name: "วัดจากสวิตชิ่งจริง" }; });
      var dbfmt = function (y) { return num(y, 4) + " dB"; };
      U.draw(el.querySelector(".f-mag"), { title: "ขนาด |" + NAME[key] + "(jω)| (dB " + (un || "") + ")", xlabel: "ความถี่ (Hz)", ylabel: "dB", xlog: true, xmin: 5, xmax: fmax, series: series, vlines: vl, points: mp, xname: "f", xfmt: function (x) { return num(x, 4) + " Hz"; }, yfmt: dbfmt });
      var sph = [{ x: bd.f, y: bd.ph, cls: "s1", w: 2.6, name: "ทฤษฎี" }]; if (bdC && M.th) sph.push({ x: bdC.f, y: bdC.ph, cls: "s4", dash: true, name: "ถ้าเป็น CCM" });
      U.draw(el.querySelector(".f-ph"), { title: "เฟส ∠" + NAME[key] + "(jω) (องศา)", xlabel: "ความถี่ (Hz)", ylabel: "องศา", xlog: true, xmin: 5, xmax: fmax, series: sph, vlines: vl, points: mph, xname: "f", xfmt: function (x) { return num(x, 4) + " Hz"; }, yfmt: function (y) { return num(y, 4) + "°"; } });
      // step response of the selected transfer function
      var alpha = so && so.zeta > 0 ? so.zeta * so.w0 : 1 / (M.p.R * M.p.C), Te = Math.min(0.1, Math.max(2e-3, 6 / alpha)), amp = st.inp === "d" ? 0.05 : st.inp === "vg" ? 2 : Math.max(0.2 * M.o.IL, 0.05);
      var sr = B.stepResp(key === "ix>vo" ? { num: g.num.map(function (c) { return -c; }), den: g.den } : g, Te, 400), unitIn = st.inp === "d" ? "" : st.inp === "vg" ? " V" : " A", unitOut = st.out === "vo" ? " V" : " A";
      U.draw(el.querySelector(".f-step"), { title: "การตอบสนองต่อสเต็ป: " + (st.inp === "d" ? "d̂" : st.inp === "vg" ? "v̂g" : "îx") + " = " + num(amp) + unitIn + " (สัญญาณเล็ก)", xlabel: "เวลา (ms)", ylabel: "ค่าเปลี่ยนของเอาต์พุต", xmin: 0, xmax: Te * 1e3,
        series: [{ x: sr.t.map(function (t) { return t * 1e3; }), y: sr.y.map(function (y) { return y * amp; }), cls: "s1", w: 2.6, name: "ŷ(t)" }], xname: "t", xfmt: function (x) { return num(x, 4) + " ms"; }, yfmt: function (y) { return num(y, 4) + unitOut; } });
      // table of all 12 TFs
      var rows = [];
      INPUTS.forEach(function (I) { OUTPUTS.forEach(function (O) {
        var k = I[0] + ">" + O[0], T = B.tf(M.m, I[0], O[0]), d0 = B.dcGain(T), z = B.pRoots(B.trim(T.num));
        if (k === "ix>vo") { T = B.zout(M.m); d0 = B.dcGain(T); z = B.pRoots(B.trim(T.num)); }
        rows.push('<tr' + (k === key ? ' class="warn"' : "") + "><td><b>" + NAME[k] + "</b> = " + (k === "ix>vo" ? "−v̂o/îx" : O[1].split(" —")[0] + "/" + I[1].split(" —")[0]) + "</td><td>" + num(d0, 4) + " " + UNIT[k] + "</td><td>" + z.map(function (r) { return r.im ? "±j" + num(Math.abs(r.im) / 2 / Math.PI, 3) : num(Math.abs(r.re) / 2 / Math.PI, 3) + (r.re > 0 ? " (RHP)" : ""); }).join(", ") + "</td></tr>");
      }); });
      el.querySelector(".tftable").innerHTML = '<table class="bk-t"><thead><tr><th>ฟังก์ชันถ่ายโอน (CCM)</th><th>อัตราขยาย DC</th><th>ศูนย์ (Hz)</th></tr></thead><tbody>' + rows.join("") + "</tbody></table>" +
        '<p class="bk-note">ทั้ง 12 ฟังก์ชันใช้ตัวส่วนเดียวกัน D(s) (ขั้วชุดเดียวกัน: f₀ = ' + num(f0, 4) + " Hz) ต่างกันที่ตัวเศษ — แถวที่ไฮไลต์คือคู่ที่เลือกอยู่</p>";
    }
    function runVNA(btnEl) {
      var busy = el.querySelector(".bk-busy"); busy.textContent = "กำลังวัด…"; btnEl.disabled = true;
      setTimeout(function () {
        var M = models, p = M.p, out = st.out === "iC" ? null : st.out === "vo" ? "vo" : st.out === "iL" ? "iL" : "ig";
        if (!out) { busy.textContent = "îC เฉลี่ยรายคาบ = 0 เสมอ จึงวัดแบบนี้ไม่ได้ — เลือกเอาต์พุตอื่น"; btnEl.disabled = false; return; }
        var t0 = performance.now(), eps = epsFor(out), res = B.freqSweep(p, M.D, st.inp, [out], 20, Math.min(p.fs / 6, 12000), p.fs > 2e5 ? Math.min(st.np, 8) : st.np, eps);
        var flip = M.key === "ix>vo";
        meas = { pts: res.map(function (r) { var q = r[out], ph = flip ? q.ph + 180 : q.ph; while (ph > 180) ph -= 360; return { f: r.f, res: { db: q.db, ph: ph, gain: q.gain } }; }), eps: eps };
        busy.textContent = "วัด " + res.length + " จุด ใน " + Math.round(performance.now() - t0) + " ms · ε = " + num(eps, 3) + (st.inp === "d" ? "" : st.inp === "vg" ? " V" : " A");
        btnEl.disabled = false; draw();
        // error table
        var g = M.th || M.G, rows = meas.pts.map(function (q) { var r = B.freqResp(g, 2 * Math.PI * q.f), dph = q.res.ph - r.ph * 180 / Math.PI; while (dph > 180) dph -= 360; while (dph < -180) dph += 360; return "<tr><td>" + num(q.f, 4) + " Hz</td><td>" + num(q.res.db, 4) + " dB / " + num(q.res.ph, 4) + "°</td><td>" + num(20 * Math.log10(r.mag), 4) + " dB / " + num(r.ph * 180 / Math.PI, 4) + "°</td><td>" + num(q.res.db - 20 * Math.log10(r.mag), 3) + " dB / " + num(dph, 3) + "°</td></tr>"; });
        var host = el.querySelector(".vna .vt"); if (!host) { host = document.createElement("div"); host.className = "vt bk-tbl"; el.querySelector(".vna").appendChild(host); }
        host.innerHTML = '<table class="bk-t"><thead><tr><th>f</th><th>วัดจริง (ขนาด / เฟส)</th><th>ทฤษฎี</th><th>ต่าง</th></tr></thead><tbody>' + rows.join("") + "</tbody></table>";
      }, 30);
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.preset) { applyPreset(b.dataset.preset); render(); }
      else if (b.dataset.act === "vna") runVNA(b);
      else if (b.dataset.act === "clr") { meas = null; var v = el.querySelector(".vna .vt"); if (v) v.remove(); el.querySelector(".bk-busy").textContent = ""; draw(); }
    });
    el.addEventListener("change", function (e) {
      var t = e.target, sel = t.dataset && t.dataset.sel; if (!sel) return;
      if (sel === "inp" || sel === "out") { st[sel] = t.value; meas = null; var v = el.querySelector(".vna .vt"); if (v) v.remove(); calc(); }
      else st[sel] = parseFloat(t.value);
    });
    el.bkApi = { preset: function (name, ds) { applyPreset(name); if (ds && ds.bkIn) st.inp = ds.bkIn; if (ds && ds.bkOut) st.out = ds.bkOut; U.applySet(st, ds && ds.bkSet); render(); } };
    U.bind(el, st, fields, function () { meas = null; calc(); });
    render();
  }

  // ---------------------------------------------------------------------------------------------- boot
  var REG = { "bk-wave": initWave, "bk-duty": initDuty, "bk-ss": initSS, "bk-avg": initAvg, "bk-tf": initTF };
  window.BuckLabRegistry = REG;
  function boot() {
    Object.keys(REG).forEach(function (cls) {
      Array.prototype.forEach.call(document.querySelectorAll("." + cls), function (el) { if (el.bkInit) return; el.bkInit = 1; el.classList.add("bk-lab", "bk-ready"); try { REG[cls](el); } catch (e) { el.textContent = "แล็บโหลดไม่สำเร็จ: " + e.message; console.error(e); } });
    });
  }
  window.BuckLabBoot = boot;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
