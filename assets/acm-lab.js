/* AC induction motor guide — /learn/ac-induction-motor/. Plain JS, needs assets/ee-kit.js (EEKit.chart, EEKit.calcs).
   1) <div class="acm-lab" [data-rotor="dc|a|d|wr"] [data-start="dol|yd|soft|auto|vfd"] [data-load="quad|const|fan|lin|power"]
        [data-k="0.8"] [data-v="100"] [data-j="0.06"] [data-ty="3"] [data-ilim="3"] [data-tap="65"] [data-tacc="5"] [data-rext="1.2"]></div>
      Torque–speed operating-point lab: motor curve vs load curve, accelerating torque, run-up in time (J dω/dt = Tm − TL, 2 ms steps).
      <button data-acm-set='{"start":"yd","load":"const","k":1}' [data-acm-target="labId"]> loads a scenario.
   2) Calculators <div class="fg-calc acm-calc" data-acm="branch|feeder|accel"> (EEKit), refill with <button data-acm-fill="branch" data-vals='{…}'>.
   Motor model = scripts/acm_model.py (7.5 kW 4-pole 400 V Δ, double cage: In ≈ 14 A, Is/In 6.5, Ts/Tn 2.15, Tk/Tn 3.0, 1471 rpm).
   module.exports = { motor, loadT, opPoint, runup } for Node checks. */
(function (root) {
  "use strict";
  var S3 = Math.sqrt(3), TAU = 2 * Math.PI, VP = 400 / S3;
  var MP = { R1: 0.414, X1: 1.599, Xm: 34.33 };
  var ROT = {
    dc: { kind: "double", Ro: 1.306, Xo: 0.585, Ri: 0.463, Xi: 2.199 },
    a: { kind: "single", R2: 0.3425, X2: 1.2 },
    d: { kind: "single", R2: 2.0, X2: 1.2 },
    wr: { kind: "single", R2: 0.3425, X2: 1.2 }
  };
  function C(re, im) { return { re: re, im: im || 0 }; }
  function add(a, b) { return C(a.re + b.re, a.im + b.im); }
  function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function abs(a) { return Math.hypot(a.re, a.im); }
  function par(a, b) { return div(mul(a, b), add(a, b)); }

  /* steady state: s slip, V per-phase (Y-equivalent) volts, f Hz → {I line A, T N·m, pf} */
  function motor(s, V, f, rotor, rext) {
    var r = ROT[rotor || "dc"], k = (f || 50) / 50;
    if (V == null) V = VP;
    if (Math.abs(s) < 1e-6) s = s < 0 ? -1e-6 : 1e-6;
    var Z2;
    if (r.kind === "double") Z2 = par(C(r.Ro / s, r.Xo * k), C(r.Ri / s, r.Xi * k));
    else Z2 = C((r.R2 + (rext || 0)) / s, r.X2 * k);
    var Z1 = C(MP.R1, MP.X1 * k), Zm = C(0, MP.Xm * k);
    var I1 = div(C(V, 0), add(Z1, par(Zm, Z2))), E = sub(C(V, 0), mul(I1, Z1)), I2 = div(E, Z2);
    var ws = TAU * 1500 * k / 60, I2a = abs(I2);
    return { I: abs(I1), T: 3 * I2a * I2a * Z2.re / ws, pf: I1.re / abs(I1) };
  }
  var SR = 0.0194, RATED = motor(SR), IN = RATED.I, TN = RATED.T, NN = 1500 * (1 - SR);
  var JM = 0.045;

  var LOADS = {
    quad: { n: "ปั๊มหอยโข่ง / พัดลม (T ∝ n²)", J: 0.06 },
    fan: { n: "พัดลมใหญ่ ความเฉื่อยสูง (T ∝ n²)", J: 2.2 },
    const: { n: "สายพาน / รอก (แรงบิดคงที่)", J: 0.35 },
    lin: { n: "เครื่องรีด / แรงหนืด (T ∝ n)", J: 0.2 },
    power: { n: "ม้วนเก็บ / แกนกลึง (กำลังคงที่)", J: 0.4 }
  };
  function loadT(kind, n, k) {
    var r = Math.abs(n) / NN;
    if (kind === "const") return k * TN * (r < 0.01 ? 1.2 : 1);
    if (kind === "quad") return k * TN * (0.12 + 0.88 * r * r);
    if (kind === "fan") return k * TN * (0.05 + 0.95 * r * r);
    if (kind === "lin") return k * TN * (0.05 + 0.95 * r);
    if (kind === "power") return k * TN * Math.min(1 / Math.max(r, 1e-6), 2);
    return 0;
  }
  /* highest speed where motor torque (×scale) falls through the load torque — the stable operating point */
  function opPoint(TL, V, rotor, rext, scale) {
    scale = scale || 1;
    var prev = null, best = null;
    for (var i = 0; i <= 3000; i++) {
      var n = 1 + i * (1498.99 / 3000), d = motor(1 - n / 1500, V, 50, rotor, rext).T * scale - TL(n);
      if (prev && prev.d > 0 && d <= 0) {
        var a = prev.n, b = n;
        for (var j = 0; j < 50; j++) { var m = (a + b) / 2; if (motor(1 - m / 1500, V, 50, rotor, rext).T * scale - TL(m) > 0) a = m; else b = m; }
        best = (a + b) / 2;
      }
      prev = { n: n, d: d };
    }
    return best;
  }

  /* run-up simulation. o: {rotor, rext, start, v (pu), load, k, J, ty, ilim, tap, tacc} → {pts:[{t,n,I,T,TL,f}], res} */
  function runup(o) {
    var Vn = VP * o.v, TL = function (n) { return loadT(o.load, n, o.k); }, J = JM + o.J;
    var dt = 0.002, t = 0, w = 0, Er = 0, pts = [], peak = 0, nsw = null, Isw = null, tsw = null, dead = 0.05;
    var fset = 0.5, final = opPoint(TL, Vn, o.rotor, o.rext, 1), tEnd = 40, stuck = 0, phase = "start", Vsoft = 0.3;
    var t95 = null;
    while (t < tEnd) {
      var n = w * 60 / TAU, s = 1 - n / 1500, m, I, T, f = 50;
      if (o.start === "dol") { m = motor(s, Vn, 50, o.rotor, o.rext); I = m.I; T = m.T; phase = "run"; }
      else if (o.start === "yd") {
        if (t < o.ty) { m = motor(s, Vn, 50, o.rotor, o.rext); I = m.I / 3; T = m.T / 3; phase = "Y"; }
        else if (t < o.ty + dead) { I = 0; T = 0; phase = "O"; if (nsw === null) { nsw = n; tsw = t; } }
        else { m = motor(s, Vn, 50, o.rotor, o.rext); I = m.I; T = m.T; phase = "D"; if (Isw === null) Isw = I; }
      } else if (o.start === "soft") {
        var m1 = motor(s, Vn, 50, o.rotor, o.rext), vr = Math.min(1, Vsoft);
        if (m1.I * vr > o.ilim * IN) vr = o.ilim * IN / m1.I; else Vsoft = Math.min(1, Vsoft + dt / Math.max(o.tacc, 0.5));
        I = m1.I * vr; T = m1.T * vr * vr; phase = vr >= 0.999 ? "run" : "ramp";
      } else if (o.start === "auto") {
        var kt = o.tap / 100;
        if (t < o.ty) { m = motor(s, Vn * kt, 50, o.rotor, o.rext); I = m.I * kt; T = m.T; phase = "tap"; }
        else { m = motor(s, Vn, 50, o.rotor, o.rext); I = m.I; T = m.T; phase = "run"; if (Isw === null) { Isw = I; nsw = n; tsw = t; } }
      } else { // VFD: frequency ramp with V/f + 3.5 % boost, stall prevention at 1.5·In
        f = fset;
        var V = Vn * Math.min(f, 50) / 50 + 0.035 * Vn * Math.max(0, 1 - f / 50), ns = 30 * f;
        m = motor(1 - n / ns, V, f, o.rotor, o.rext); I = m.I; T = m.T;
        if (I < 1.5 * IN) fset = Math.min(50, fset + 50 * dt / Math.max(o.tacc, 0.2));
        phase = f >= 49.99 ? "run" : "ramp";
      }
      var tl = TL(n);
      if (t > 0.03 || o.start !== "dol") peak = Math.max(peak, I);
      var lp = pts[pts.length - 1];
      if (!lp || t - lp.t >= 0.02 || Math.abs(n - lp.n) >= 6 || Math.abs(I - lp.I) >= 0.08 * IN || (o.start === "yd" && Math.abs(t - o.ty) < 0.06)) pts.push({ t: t, n: n, I: I, T: T, TL: tl, f: f });
      if (t95 === null && final && n >= 0.95 * final && (phase === "run" || phase === "D")) t95 = t;
      var a = (T - tl) / J;
      if (n <= 0.05 && a <= 0) a = 0;
      Er += Math.max(0, (o.start === "vfd" ? (1 - n / (30 * f)) : s)) * T * TAU * (o.start === "vfd" ? f / 2 : 25) * dt;
      w = Math.max(0, w + a * dt);
      t += dt;
      if (Math.abs(a) < 0.05 && (phase === "run" || phase === "D") && t > 0.3) { stuck += dt; if (stuck > 0.6) break; } else stuck = 0;
      if (phase === "start" && n < 0.5 && t > 2) break;
    }
    var nEnd = w * 60 / TAU, res = { final: final, t95: t95, peak: peak, Er: Er, nEnd: nEnd, nsw: nsw, Isw: Isw, tsw: tsw, tEnd: t };
    return { pts: pts, res: res };
  }

  var api = { motor: motor, loadT: loadT, opPoint: opPoint, runup: runup, IN: IN, TN: TN, NN: NN, VP: VP };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ACM = api;
  if (typeof document === "undefined") return;

  var K = root.EEKit, nf = function (v, d) { return K ? K.n(v, d) : (isFinite(v) ? v.toFixed(d) : "—"); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var ROT_N = { dc: "กรงคู่ / แท่งลึก (IE3 มาตรฐาน)", a: "กรงเดี่ยว R ต่ำ", d: "กรงเดี่ยว R สูง (Design D)", wr: "โรเตอร์พันขดลวด + R ภายนอก" };
  var START_N = { dol: "สตาร์ทตรง DOL", yd: "สตาร์-เดลต้า", soft: "ซอฟต์สตาร์ท (จำกัดกระแส)", auto: "ออโต้ทรานส์ฟอร์เมอร์", vfd: "อินเวอร์เตอร์ VFD" };

  function Lab(host) {
    var g = function (k, d) { var v = host.getAttribute("data-" + k); return v == null ? d : v; };
    var st = { rotor: g("rotor", "dc"), start: g("start", "dol"), load: g("load", "quad"), k: +g("k", 1), v: +g("v", 100), J: +g("j", NaN),
      ty: +g("ty", 3), ilim: +g("ilim", 3), tap: +g("tap", 65), tacc: +g("tacc", 5), rext: +g("rext", 1.2) };
    if (!isFinite(st.J)) st.J = LOADS[st.load].J;
    host.innerHTML = "";
    var wrap = el("div", "acm-wrap"); host.appendChild(wrap);
    var ctl = el("div", "acm-ctl"); wrap.appendChild(ctl);
    var out = el("div", "acm-out"); wrap.appendChild(out);
    var cv1 = el("div", "acm-ch"), cv2 = el("div", "acm-ch"), meters = el("dl", "fc-out acm-met"), verdict = el("p", "acm-verdict");
    out.appendChild(cv1); out.appendChild(verdict); out.appendChild(meters); out.appendChild(cv2);
    var inputs = {};
    function row(label, node, outEl) { var w = el("label", "acm-r"); w.appendChild(el("span", "", label)); w.appendChild(node); if (outEl) w.appendChild(outEl); ctl.appendChild(w); return w; }
    function sel(key, label, opts) {
      var s = el("select"); Object.keys(opts).forEach(function (k) { var o = el("option", "", opts[k]); o.value = k; s.appendChild(o); });
      s.value = st[key]; s.addEventListener("change", function () { st[key] = s.value; if (key === "load") { st.J = LOADS[st.load].J; inputs.J.set(st.J); } sync(); run(); });
      inputs[key] = { set: function (v) { s.value = v; } }; return row(label, s);
    }
    function rng(key, label, min, max, step, fmt) {
      var s = el("input"), o = el("output"); s.type = "range"; s.min = min; s.max = max; s.step = step; s.value = st[key];
      var upd = function () { o.textContent = fmt(+s.value); };
      s.addEventListener("input", function () { st[key] = +s.value; upd(); run(); }); upd();
      inputs[key] = { set: function (v) { s.value = v; upd(); } }; return row(label, s, o);
    }
    sel("rotor", "โรเตอร์", ROT_N);
    var rRext = rng("rext", "R ภายนอก (อ้างอิงสเตเตอร์)", 0, 4, 0.05, function (v) { return v.toFixed(2) + " Ω"; });
    sel("start", "วิธีสตาร์ท", START_N);
    var rTy = rng("ty", "ไทเมอร์เปลี่ยนจังหวะ", 0.2, 20, 0.1, function (v) { return v.toFixed(1) + " s"; });
    var rIl = rng("ilim", "จำกัดกระแส", 2, 5, 0.1, function (v) { return v.toFixed(1) + " × In"; });
    var rTap = rng("tap", "แทปหม้อแปลง", 50, 85, 5, function (v) { return v + " %"; });
    var rTa = rng("tacc", "เวลา ramp 0 → 50 Hz / 30 → 100 %", 0.5, 30, 0.5, function (v) { return v.toFixed(1) + " s"; });
    rng("v", "แรงดันไฟเข้า", 70, 110, 1, function (v) { return v + " % ของ 400 V"; });
    var ln = {}; Object.keys(LOADS).forEach(function (k) { ln[k] = LOADS[k].n; });
    sel("load", "ชนิดโหลด", ln);
    rng("k", "ขนาดโหลดที่ความเร็วพิกัด", 0, 1.5, 0.05, function (v) { return v.toFixed(2) + " × Tn"; });
    rng("J", "ความเฉื่อยโหลด J (อ้างถึงเพลามอเตอร์)", 0.01, 6, 0.01, function (v) { return v.toFixed(2) + " kg·m²"; });
    var note = el("p", "pv-note", "มอเตอร์ 7.5 kW 4 ขั้ว 400 V Δ · In = " + nf(IN, 1) + " A · Tn = " + nf(TN, 1) + " N·m · J มอเตอร์ 0.045 kg·m² · คำนวณทีละ 2 ms แบบ quasi-static (ไม่รวมทรานเซียนต์ไซเคิลแรก)");
    ctl.appendChild(note);
    function sync() {
      rRext.hidden = st.rotor !== "wr";
      rTy.hidden = !(st.start === "yd" || st.start === "auto");
      rIl.hidden = st.start !== "soft";
      rTap.hidden = st.start !== "auto";
      rTa.hidden = !(st.start === "soft" || st.start === "vfd");
    }
    function run() {
      var o = { rotor: st.rotor, rext: st.rotor === "wr" ? st.rext : 0, start: st.start, v: st.v / 100, load: st.load, k: st.k, J: st.J, ty: st.ty, ilim: st.ilim, tap: st.tap, tacc: st.tacc };
      var Vn = VP * o.v, sim = runup(o), r = sim.res, TL = function (n) { return loadT(o.load, n, o.k); };
      // chart 1: torque–speed
      var mot = [], ld = [], Ycur = [], tap = [], area = [], base = [], rx = o.rext;
      for (var n = 0; n <= 1500; n += 7.5) {
        var nn = Math.min(n, 1499.7), m = motor(1 - nn / 1500, Vn, 50, o.rotor, rx), tl = TL(nn);
        mot.push([nn, m.T / TN]); ld.push([nn, tl / TN]);
        if (o.start === "yd") Ycur.push([nn, m.T / TN / 3]);
        if (o.start === "auto") tap.push([nn, motor(1 - nn / 1500, Vn * o.tap / 100, 50, o.rotor, rx).T / TN]);
      }
      var traj = sim.pts.map(function (p) { return [p.n, p.T / TN]; });
      var ser = [];
      if (r.final) {
        if (o.start === "dol") mot.forEach(function (p, i) { if (p[0] <= r.final) { area.push(p); base.push(ld[i]); } });
        else sim.pts.forEach(function (p) { if (p.T >= p.TL && p.n <= r.final) { area.push([p.n, p.T / TN]); base.push([p.n, p.TL / TN]); } });
        if (area.length > 2) ser.push({ pts: area, base: base, cls: "acm-area", area: true });
      }
      ser.push({ pts: mot, cls: "s2" + (o.start === "dol" ? " thick" : " dsh") });
      if (Ycur.length) ser.push({ pts: Ycur, cls: "s1" });
      if (tap.length) ser.push({ pts: tap, cls: "s5" });
      ser.push({ pts: ld, cls: "s3 thick" });
      ser.push({ pts: traj, cls: "s7" });
      var marks = [];
      if (r.final) marks.push({ x: r.final, y: TL(r.final) / TN, cls: "dot", label: nf(r.final, 0) + " rpm", dx: -8, anchor: "end" });
      var ymax = Math.max(3.4, Math.ceil(Math.max.apply(null, ld.map(function (p) { return p[1]; })) * 2) / 2 + 0.2);
      cv1.innerHTML = K.chart({ w: 640, h: 300, xs: [0, 1500], ys: [0, ymax], xl: "ความเร็วรอบ n (rpm)", yl: "แรงบิด T/Tn", label: "กราฟแรงบิด-ความเร็วของมอเตอร์กับโหลด",
        xt: [0, 250, 500, 750, 1000, 1250, 1500], yt: K.niceTicks(ymax, 6).ticks.filter(function (t) { return t <= ymax; }), yf: function (t) { return t.toFixed(1); },
        series: ser, marks: marks,
        legend: [["f2", "มอเตอร์ (" + (o.start === "yd" ? "Δ" : "100 %") + ")"], ["f3", "โหลด"], ["f7", "เส้นทางสตาร์ทจริง"]].concat(o.start === "yd" ? [["f1", "Y = 1/3"]] : o.start === "auto" ? [["f5", "แทป " + o.tap + " %"]] : []) });
      // chart 2: time
      var tmax = Math.max(1, Math.min(40, (r.t95 || sim.pts[sim.pts.length - 1].t) * 1.4 + 0.3));
      var sp = [], ip = [];
      sim.pts.forEach(function (p) { if (p.t <= tmax) { sp.push([p.t, p.n]); ip.push([p.t, p.I / IN]); } });
      var imax = Math.max(7, Math.ceil(r.peak / IN + 0.5));
      cv2.innerHTML = K.chart({ w: 640, h: 230, xs: [0, tmax], ys: [0, 1600], y2s: [0, imax], xl: "เวลา (s)", yl: "n (rpm)", y2l: "I/In", label: "ความเร็วและกระแสเทียบเวลา",
        xt: K.niceTicks(tmax, 6).ticks.filter(function (t) { return t <= tmax; }), yt: [0, 500, 1000, 1500], y2t: K.niceTicks(imax, 4).ticks.filter(function (t) { return t <= imax; }),
        xf: function (t) { return (+t.toFixed(2)).toString(); }, series: [{ pts: sp, cls: "s3 thick" }, { pts: ip, cls: "s1", axis: 2 }],
        legend: [["f3", "ความเร็ว"], ["f1", "กระแสสาย (แกนขวา)"]] });
      // readouts
      var m0, rows = [];
      if (o.start === "yd") m0 = { I: motor(1, Vn, 50, o.rotor, rx).I / 3, T: motor(1, Vn, 50, o.rotor, rx).T / 3 };
      else if (o.start === "auto") { var mm = motor(1, Vn * o.tap / 100, 50, o.rotor, rx); m0 = { I: mm.I * o.tap / 100, T: mm.T }; }
      else if (o.start === "soft") { var ms = motor(1, Vn, 50, o.rotor, rx), vr = Math.min(0.3, o.ilim * IN / ms.I); vr = Math.min(1, Math.max(vr, Math.min(1, o.ilim * IN / ms.I))); m0 = { I: Math.min(ms.I, o.ilim * IN), T: ms.T * Math.pow(Math.min(1, o.ilim * IN / ms.I), 2) }; }
      else if (o.start === "vfd") m0 = { I: 1.5 * IN, T: NaN };
      else m0 = motor(1, Vn, 50, o.rotor, rx);
      rows.push(["กระแสเริ่ม (n = 0)", nf(m0.I, 0) + " A = " + nf(m0.I / IN, 2) + " × In"]);
      rows.push(["แรงบิดเริ่มที่ได้", isFinite(m0.T) ? nf(m0.T / TN, 2) + " × Tn · โหลดต้องการ " + nf(TL(0) / TN, 2) + " × Tn" : "ปรับตาม slip ≈ 1.5 × Tn"]);
      rows.push(["กระแสสูงสุดช่วงสตาร์ท (rms)", nf(r.peak, 0) + " A = " + nf(r.peak / IN, 2) + " × In"]);
      if (o.start === "yd" && r.nsw != null) rows.push(["ความเร็วตอนเปลี่ยน Y→Δ · กระแสกระโดด", nf(r.nsw, 0) + " rpm · " + nf(r.Isw || 0, 0) + " A (" + nf((r.Isw || 0) / IN, 1) + " × In)"]);
      if (o.start === "auto" && r.nsw != null) rows.push(["ความเร็วตอนต่อเต็มแรงดัน · กระแส", nf(r.nsw, 0) + " rpm · " + nf(r.Isw || 0, 0) + " A"]);
      if (r.final) {
        var mf = motor(1 - r.final / 1500, Vn, 50, o.rotor, rx);
        rows.push(["จุดทำงาน", nf(r.final, 0) + " rpm · สลิป " + nf((1 - r.final / 1500) * 100, 2) + " %"]);
        rows.push(["กระแสที่จุดทำงาน", nf(mf.I, 1) + " A = " + nf(mf.I / IN, 2) + " × In"]);
        rows.push(["เวลาถึง 95 % ของจุดทำงาน", r.t95 != null ? nf(r.t95, 2) + " s" : "—"]);
        rows.push(["พลังงานความร้อนในโรเตอร์ช่วงสตาร์ท", nf(r.Er / 1000, 1) + " kJ"]);
      } else rows.push(["จุดทำงาน", "ไม่มี — โหลดเกินแรงบิดสูงสุดของมอเตอร์"]);
      meters.innerHTML = rows.map(function (q) { return "<dt>" + q[0] + "</dt><dd>" + q[1] + "</dd>"; }).join("");
      var v;
      if (o.start === "yd" && r.nsw != null && r.nsw < 0.05 * (r.final || 1500)) v = ["bad", "✗ ช่วงสตาร์มอเตอร์ไม่หมุนเลย: แรงบิด Y " + nf(m0.T / TN, 2) + " × Tn น้อยกว่าแรงบิดเริ่มของโหลด " + nf(TL(0) / TN, 2) + " × Tn — ตอนเปลี่ยนเป็น Δ จึงเท่ากับสตาร์ทตรง (แต่เสียเวลาและร้อนเพิ่ม)"];
      else if (!r.final) v = ["bad", "✗ โหลดสูงกว่าแรงบิดสูงสุด Tk ที่แรงดันนี้ — มอเตอร์ไม่มีจุดทำงาน จะชะลอจนหยุดและโอเวอร์โหลดต้องตัด"];
      else if (r.nEnd < 0.6 * r.final) v = ["bad", "✗ สตาร์ทไม่สำเร็จ: แรงบิดช่วงสตาร์ทต่ำกว่าแรงบิดโหลด มอเตอร์ค้างที่ " + nf(r.nEnd, 0) + " rpm กระแสสูงค้าง → ร้อนจนโอเวอร์โหลดตัด"];
      else if (o.start === "yd" && r.nsw != null && r.nsw < 0.85 * r.final) v = ["warn", "⚠ เปลี่ยนเป็น Δ ที่ความเร็วเพียง " + nf(r.nsw / r.final * 100, 0) + " % ของจุดทำงาน — กระแสกระโดดเกือบเท่า DOL · เพิ่มเวลาไทเมอร์ หรือโหลดหนักเกินสำหรับ Y-Δ"];
      else if (r.t95 != null && r.t95 > 10) v = ["warn", "⚠ สตาร์ทได้แต่ใช้เวลานาน " + nf(r.t95, 1) + " s — ตรวจคลาสโอเวอร์โหลด (คลาส 20/30) และเวลาทนล็อกโรเตอร์ของมอเตอร์"];
      else v = ["ok", "✓ สตาร์ทสำเร็จ: เส้นแรงบิดมอเตอร์อยู่เหนือเส้นโหลดตลอดช่วงเร่ง"];
      verdict.className = "acm-verdict " + v[0]; verdict.textContent = v[1];
    }
    host._set = function (vals) {
      Object.keys(vals).forEach(function (k) { if (k in st) { st[k] = isNaN(+vals[k]) ? vals[k] : +vals[k]; if (inputs[k]) inputs[k].set(st[k]); } });
      if (vals.load && vals.J == null) { st.J = LOADS[st.load].J; inputs.J.set(st.J); }
      sync(); run();
    };
    sync(); run();
  }

  // ------------------------------------------------------------------------------------------- calculators
  var STD_CB = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800];
  var AC3 = [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265, 330, 400, 500];
  var CABLE = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
  var IZ3 = [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239, 262, 296, 346];   // IEC 60364-5-52 B1, PVC Cu, 3 loaded, 30 °C
  var IZ2 = [17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269, 300, 341, 400];  // 2 loaded (single-phase)
  var KT = { "30": 1.0, "35": 0.94, "40": 0.87, "45": 0.79, "50": 0.71 };
  var MPCB = [[1, 1.6], [1.6, 2.5], [2.5, 4], [4, 6.3], [6.3, 10], [10, 16], [13, 18], [17, 23], [20, 25], [24, 32], [30, 40], [37, 50], [48, 65], [62, 73], [70, 80], [80, 100]];
  function mpcb(I) {
    var r = MPCB.filter(function (q) { return I >= q[0] && I <= q[1]; }).map(function (q) { return q[0] + "–" + q[1] + " A"; });
    return r.length ? "ช่วงปรับ " + r.join(" หรือ ") + " ตั้ง " + nf(I, 1) + " A" : "เกินช่วง MPCB ทั่วไป ใช้ MCCB + โอเวอร์โหลด";
  }
  function pick(list, v, below) { var r = null; for (var i = 0; i < list.length; i++) { if (below) { if (list[i] <= v + 1e-9) r = list[i]; } else if (list[i] >= v - 1e-9) return list[i]; } return r; }
  var CALC = {
    branch: {
      t: "ออกแบบวงจรย่อยมอเตอร์: กระแส สาย แรงดันตก เบรกเกอร์ คอนแทกเตอร์ โอเวอร์โหลด และกระแสลัดวงจร", ref: "D1–D8",
      ins: [["ph", "ระบบ", "sel", "3 เฟส 400 V", ["3 เฟส 400 V", "1 เฟส 230 V"]], ["kw", "กำลังที่เพลา", "kW", "7.5"], ["inp", "กระแสแผ่นป้าย (0 = คำนวณ)", "A", "14.6"],
        ["eff", "ประสิทธิภาพ η", "", "0.904"], ["pf", "cos φ", "", "0.82"], ["kis", "Is/In", "", "6.5"],
        ["st", "วิธีสตาร์ท", "sel", "DOL", ["DOL", "สตาร์-เดลต้า", "ซอฟต์สตาร์ท", "VFD"]], ["len", "ความยาวสาย", "m", "40"], ["amb", "อุณหภูมิแวดล้อม", "sel", "40", ["30", "35", "40", "45", "50"]],
        ["kva", "หม้อแปลง (0 = ไม่คิด)", "kVA", "500"], ["uk", "uk หม้อแปลง", "%", "4"]],
      f: function (x) {
        var one = x.ph.indexOf("1") === 0, V = one ? 230 : 400;
        var In = x.inp > 0 ? x.inp : (one ? x.kw * 1e3 / (V * x.eff * x.pf) : x.kw * 1e3 / (S3 * V * x.eff * x.pf));
        var yd = x.st === "สตาร์-เดลต้า", Ic = yd ? In / S3 : In;                 // conductor current (six wires for Y-Δ)
        var need = 1.25 * Ic, kt = KT[x.amb] || 1, tab = one ? IZ2 : IZ3, idx = -1;
        for (var i = 0; i < CABLE.length; i++) if (tab[i] * kt >= need) { idx = i; break; }
        if (idx < 0) idx = CABLE.length - 1;
        var A = CABLE[idx], Iz = tab[idx] * kt, R = 0.0225 / A, X = 0.00008, sinp = Math.sqrt(1 - x.pf * x.pf);
        var kist = x.st === "DOL" ? x.kis : x.st === "สตาร์-เดลต้า" ? x.kis / 3 : x.st === "ซอฟต์สตาร์ท" ? 3 : 1.5;
        var Ist = kist * In, Ist_c = yd ? Ist / S3 : Ist;
        var dvr, dvs;
        if (one) { dvr = 2 * In * x.len * (R * x.pf + X * sinp) / V * 100; dvs = 2 * Ist * x.len * (R * 0.35 + X * 0.94) / V * 100; }
        else if (yd) {   // six wires: each winding is fed through two cables carrying the winding current
          dvr = 2 * (In / S3) * x.len * (R * x.pf + X * sinp) / 400 * 100;
          dvs = 2 * Ist * x.len * (R * 0.3 + X * 0.95) / VP * 100;
        } else { dvr = S3 * In * x.len * (R * x.pf + X * sinp) / V * 100; dvs = S3 * Ist * x.len * (R * 0.3 + X * 0.95) / V * 100; }
        var dvt = 0, Zt = 0, Ik = NaN;
        if (x.kva > 0) { var Ssc = x.kva / (x.uk / 100); dvt = (one ? V * Ist : S3 * V * Ist) / (Ssc * 1e3) * 100; Zt = (x.uk / 100) * 400 * 400 / (x.kva * 1e3); Ik = 400 / (S3 * Zt) / 1000; }
        var U0 = 230, Zph = Math.hypot(R * x.len, X * x.len), Zl = Zt + 2 * Zph, Ie = U0 / Zl;
        var cbMax = 2.5 * In, cb = pick(STD_CB, cbMax, true), inst = 8 * In;
        var kmI = yd ? 0.58 * In : In, km = pick(AC3, kmI, false);
        var olr = yd ? 0.58 * In : In;
        var rows = [
          ["In ที่ใช้", "<b>" + nf(In, 1) + " A</b>" + (x.inp > 0 ? " (แผ่นป้าย)" : " = P/(" + (one ? "V" : "√3·V") + "·η·cos φ)")],
          ["กระแสสตาร์ท (" + x.st + ")", nf(Ist, 0) + " A = " + nf(kist, 2) + " × In"],
          ["—", "สาย (ทองแดง PVC ในท่อ " + (one ? "2" : "3") + " เส้นมีกระแส · ตารางสอน IEC B1)"],
          [(yd ? "กระแสต่อเส้น (สาย 6 เส้น) 0.58·In × 1.25" : "ต้องการ ≥ 1.25 × In"), nf(need, 1) + " A"],
          ["ขนาดสาย · Iz × k(" + x.amb + " °C)", "<b>" + A + " mm²</b> · " + nf(tab[idx], 1) + " × " + nf(kt, 2) + " = " + nf(Iz, 1) + " A" + (Iz < 1.05 * need && idx < CABLE.length - 1 ? ' <span class="ee-warn">เฉียดฉิว → พิจารณา ' + CABLE[idx + 1] + " mm²</span>" : "")],
          ["แรงดันตกขณะเดิน", nf(dvr, 2) + " % " + K.ok(dvr <= 3, dvr <= 3 ? "≤ 3 %" : "เกิน 3 %")],
          ["แรงดันตกขณะสตาร์ท (สาย" + (x.kva > 0 ? " + หม้อแปลง" : "") + ")", nf(dvs + dvt, 1) + " % " + K.ok(dvs + dvt <= 10, dvs + dvt <= 10 ? "≤ 10 %" : "สูง")],
          ["—", "อุปกรณ์ป้องกันและควบคุม"],
          ["เบรกเกอร์เวลาผกผัน ≤ 250 % In", nf(cbMax, 1) + " A → พิกัดมาตรฐาน ≤ " + (cb || "—") + " A"],
          ["MPCB (ความร้อน + แม่เหล็กในตัว)", mpcb(olr)],
          ["เบรกเกอร์ชนิดปลดทันทีอย่างเดียว (MCP) ≤ 800 % In", nf(inst, 0) + " A"],
          ["คอนแทกเตอร์ AC-3 ≥ " + (yd ? "0.58 In (KM1, KM3)" : "In"), (km || "—") + " A" + (yd ? " · KM2 (สตาร์) ≥ 0.33 In = " + nf(0.33 * In, 1) + " A" : "")],
          ["ค่าตั้งโอเวอร์โหลด", nf(olr, 1) + " A" + (yd ? " (ติดหลัง KM1 วัดกระแสขดลวด)" : "") + " · คลาส 10 (สตาร์ทหนัก > 10 s ใช้ 20/30)"]
        ];
        if (x.kva > 0) {
          rows.push(["—", "กระแสลัดวงจร"]);
          rows.push(["Ik3 ที่บัสหม้อแปลง = S/(√3·V·uk)", nf(Ik, 1) + " kA → Icu เบรกเกอร์ต้องสูงกว่า"]);
          rows.push(["Ik ลงดินปลายสาย (TN, PE ขนาดเท่าสายเฟส)", nf(Ie, 0) + " A " + K.ok(Ie > 10 * In, Ie > 10 * In ? "> 10·In ตัดทันที" : "ต่ำ ตรวจเวลาตัด")]);
        }
        return { rows: rows, note: "ค่าพิกัดกระแสสายเป็นค่าสอนจาก IEC 60364-5-52 (วิธี B1 30 °C) คูณตัวคูณอุณหภูมิ · เกณฑ์ 125 % และ 250 %/800 % ตามแนวมาตรฐานการติดตั้งทางไฟฟ้า (ว.ส.ท.) — งานจริงใช้ตารางและข้อกำหนดฉบับที่บังคับใช้" };
      }
    },
    feeder: {
      t: "สายป้อนและเบรกเกอร์สายป้อนสำหรับมอเตอร์หลายตัว", ref: "D3–D4",
      ins: [["list", "กระแสพิกัดมอเตอร์แต่ละตัว (คั่นด้วย /)", "sel", "55 / 28 / 14.6", ["55 / 28 / 14.6", "14.6 / 14.6 / 7.8", "116 / 63 / 41", "30 / 30 / 30 / 15"]],
        ["pct", "อุปกรณ์ป้องกันวงจรย่อยตัวใหญ่สุด (% In)", "", "250"], ["other", "โหลดอื่นบนสายป้อน", "A", "0"]],
      f: function (x) {
        var a = x.list.split("/").map(function (s) { return parseFloat(s); }).filter(isFinite).sort(function (p, q) { return q - p; });
        var mx = a[0], rest = a.slice(1).reduce(function (s, v) { return s + v; }, 0) + x.other;
        var cond = 1.25 * mx + rest, br = pick(STD_CB, x.pct / 100 * mx, true) || x.pct / 100 * mx, fcb = br + rest;
        return { rows: [["มอเตอร์ตัวใหญ่สุด · ตัวอื่นรวม", nf(mx, 1) + " A · " + nf(rest, 1) + " A"],
          ["สายป้อน ≥ 1.25·In(ใหญ่สุด) + ΣIn(อื่น)", "<b>" + nf(cond, 1) + " A</b>"],
          ["เบรกเกอร์วงจรย่อยตัวใหญ่สุด", nf(br, 0) + " A (≤ " + x.pct + " % × " + nf(mx, 1) + ")"],
          ["เบรกเกอร์สายป้อน ≤ ตัวใหญ่สุด + ΣIn(อื่น)", "<b>" + nf(fcb, 1) + " A</b> → พิกัดมาตรฐาน ≤ " + (pick(STD_CB, fcb, true) || "—") + " A"]],
          note: "เบรกเกอร์สายป้อนต้องไม่ใหญ่กว่าผลรวมนี้ เพื่อให้ยังป้องกันสายป้อนได้ และตอนมอเตอร์ตัวใหญ่สุดสตาร์ทขณะตัวอื่นเดินเต็มที่ก็ไม่ทริป" };
      }
    },
    accel: {
      t: "เวลาเร่งความเร็วจากข้อมูลแคตตาล็อก (แรงบิดเริ่ม แรงบิดสูงสุด) และความเฉื่อย", ref: "L1–L2, L7",
      ins: [["kw", "กำลังมอเตอร์", "kW", "7.5"], ["nn", "ความเร็วพิกัด", "rpm", "1471"], ["ns", "ความเร็วซิงโครนัส", "rpm", "1500"],
        ["kts", "Ts/Tn", "", "2.2"], ["ktk", "Tk/Tn", "", "3.0"], ["jm", "J มอเตอร์", "kg·m²", "0.045"], ["jl", "J โหลด (อ้างถึงเพลามอเตอร์)", "kg·m²", "2.2"],
        ["load", "ชนิดโหลด", "sel", "T ∝ n² (พัดลม ปั๊ม)", ["T ∝ n² (พัดลม ปั๊ม)", "แรงบิดคงที่", "T ∝ n"]], ["kl", "แรงบิดโหลดที่ความเร็วพิกัด", "× Tn", "1.0"], ["vv", "แรงดันขณะสตาร์ท", "%", "100"]],
      f: function (x) {
        var Tn = 9550 * x.kw / x.nn, sn = 1 - x.nn / x.ns, ws = TAU * x.ns / 60, J = x.jm + x.jl, v2 = Math.pow(x.vv / 100, 2);
        // Kloss curve through (sn, Tn) with peak ktk; below the breakdown speed blend linearly to Ts at standstill
        var q = x.ktk + Math.sqrt(x.ktk * x.ktk - 1), sk = sn * q;
        var kl = function (s) { return 2 * x.ktk * Tn / (s / sk + sk / s); };
        var Tm = function (n) { var s = Math.max(1e-6, 1 - n / x.ns); return s >= sk ? x.kts * Tn + (x.ktk * Tn - x.kts * Tn) * (1 - s) / (1 - sk) : kl(s); };
        var TL = function (n) { var r = n / x.nn; return x.load.indexOf("²") > 0 ? x.kl * Tn * (0.1 + 0.9 * r * r) : x.load.indexOf("คงที่") >= 0 ? x.kl * Tn : x.kl * Tn * (0.05 + 0.95 * r); };
        var t = 0, w = 0, dt = 1e-3, E = 0, ok = true, nend = 0.95 * x.nn;
        while (w * 60 / TAU < nend) {
          var n = w * 60 / TAU, a = (Tm(n) * v2 - TL(n)) / J;
          if (a <= 0) { ok = false; break; }
          E += (1 - n / x.ns) * Tm(n) * v2 * ws * dt; w += a * dt; t += dt;
          if (t > 120) { ok = false; break; }
        }
        var KE = 0.5 * J * Math.pow(TAU * x.nn / 60, 2);
        return { rows: [["Tn = 9550·P/n", nf(Tn, 1) + " N·m"], ["J รวม", nf(J, 3) + " kg·m²"],
          ["แรงบิดเริ่มที่ได้ (× V²) · โหลดต้องการ", nf(x.kts * v2, 2) + " · " + nf(TL(0) / Tn, 2) + " × Tn"],
          ["เวลาถึง 95 % ความเร็ว", ok ? "<b>" + nf(t, 2) + " s</b>" : '<span class="ee-warn">เร่งไม่ถึง — แรงบิดมอเตอร์ต่ำกว่าโหลด ที่ ' + nf(w * 60 / TAU, 0) + " rpm</span>"],
          ["พลังงานจลน์ ½Jω²", nf(KE / 1000, 1) + " kJ"], ["ความร้อนในโรเตอร์ช่วงสตาร์ท ≈", ok ? nf(E / 1000, 1) + " kJ" : "—"]],
          note: "กราฟมอเตอร์ประมาณด้วยสูตรของคลอสส์ (Kloss) ใกล้ความเร็วพิกัด และเส้นตรงจาก Ts ถึง Tk ช่วงความเร็วต่ำ · แรงดันลดลง แรงบิดลดตาม V² · ถ้าเวลาเกิน ~10 s ใช้โอเวอร์โหลดคลาส 20/30 และตรวจเวลาทนล็อกโรเตอร์" };
      }
    }
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".acm-lab"), function (h) { if (!h._set) Lab(h); });
    Array.prototype.forEach.call(document.querySelectorAll("button[data-acm-set]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-acm-target"), host = id ? document.getElementById(id) : document.querySelector(".acm-lab");
        if (!host || !host._set) return;
        host._set(JSON.parse(b.getAttribute("data-acm-set")));
        host.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  if (K) K.calcs("data-acm", CALC, "acm");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
