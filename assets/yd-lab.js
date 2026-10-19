/* Star–delta labs — /learn/motor-control/star-delta-analysis/, /learn/en/motor-control/star-delta-analysis/ and the article
   /blog/star-delta-timer-setting/ (+ /en/blog/…). Plain JS; needs assets/ee-kit.js (EEKit.chart, EEKit.calcs) and assets/yd-core.js (YDCore).
   1) <div class="yd-lab" [data-preset="pump|fan|conv|mix"] [data-kw="7.5"] [data-poles="4"] [data-load] [data-k] [data-j] [data-v]
        [data-trig="time|current|speed"] [data-ty] [data-ith] [data-nth] [data-td] [data-order="good|bad"] [data-trans="open|closed"] [data-rt] [data-tr]></div>
      Dynamic start on the αβ model: whole start + zoom on the changeover, metrics against DOL, verdict and the recommended timer.
      <button data-yd-set='{"preset":"fan","ty":8}' [data-yd-target="labId"]> loads a scenario into a lab.
   2) <div class="yd-sweep" [data-preset] [data-param="ty|td|rt"]></div> — numerical experiment: sweeps one setting, plots and exports CSV.
   3) <div class="yd-run" [data-x="25"] [data-kw="7.5"]></div> — running permanently in Y vs Δ at part load (losses, η, cos φ, energy, money).
   4) <div class="fg-calc yd-calc" data-yd="timer"></div> — timer calculator (quasi-static, 100 % and minimum voltage).
   Model: 7.5 kW 4-pole 400 V Δ double-cage motor (scripts/acm_model.py), scaled per unit to the chosen kW and pole number:
   currents ∝ kW, the run-up is matched through the mechanical time constant τm = J·ωs/Tn (J_model = J·(7.5/kW)·(ns/1500)²). */
(function (root) {
  "use strict";
  var K = root.EEKit, Y = root.YDCore;
  if (!Y || typeof document === "undefined") return;
  var EN = function () { return document.documentElement.lang === "en"; };
  var T = function (th, en) { return EN() ? en : th; };
  var IN = Y.IN, TN = Y.TN, NN = Y.NN, S3 = Math.sqrt(3);
  var nf = function (v, d) { if (v == null || !isFinite(v)) return "—"; return (+v).toLocaleString(EN() ? "en-US" : "th-TH", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var PRESETS = {
    pump: { load: "quad", k: 0.8, j: 0.105, ty: 2, th: "ปั๊มหอยโข่ง (T ∝ n², 80 %)", en: "Centrifugal pump (T ∝ n², 80 %)" },
    fan: { load: "fan", k: 1, j: 2.245, ty: 20, th: "พัดลมใหญ่ ความเฉื่อยสูง (T ∝ n²)", en: "Large high-inertia fan (T ∝ n²)" },
    conv: { load: "const", k: 0.5, j: 0.395, ty: 5, th: "สายพาน 50 % (แรงบิดคงที่)", en: "Conveyor at 50 % (constant torque)" },
    mix: { load: "lin", k: 0.6, j: 0.25, ty: 3, th: "เครื่องผสม / แรงหนืด (T ∝ n, 60 %)", en: "Mixer / viscous load (T ∝ n, 60 %)" }
  };
  var LOADN = function () { return { quad: T("ปั๊มหอยโข่ง T ∝ n²", "Centrifugal pump T ∝ n²"), fan: T("พัดลม T ∝ n²", "Fan T ∝ n²"), const: T("แรงบิดคงที่ (สายพาน คอมเพรสเซอร์ลูกสูบ)", "Constant torque (conveyor, piston compressor)"), lin: T("T ∝ n (เครื่องผสม แรงหนืด)", "T ∝ n (mixer, viscous)") }; };

  /* per-unit scaling between the user's motor and the 7.5 kW 4-pole model */
  function scale(st) {
    var ns = 6000 / st.poles, kp = st.kw / 7.5;
    return { ns: ns, kp: kp, In: IN * kp, Tn: TN * kp * 1500 / ns, Jm: st.j * (7.5 / st.kw) * Math.pow(ns / 1500, 2), n: ns / 1500 };
  }
  function readState(host, defs) {
    var st = {}, d = host.dataset, pre = PRESETS[d.preset] || PRESETS[defs.preset || "pump"];
    Object.keys(defs).forEach(function (k) { st[k] = defs[k]; });
    st.preset = d.preset || defs.preset || "pump";
    ["load", "k", "j", "ty"].forEach(function (k) { if (pre[k] != null) st[k] = pre[k]; });
    Object.keys(defs).forEach(function (k) { if (d[k] != null) st[k] = isNaN(+d[k]) ? d[k] : +d[k]; });
    return st;
  }
  function decim(pts, maxN, idxMax) { // keep at most maxN points, bucket max of column idxMax (keeps the peaks)
    if (pts.length <= maxN) return pts;
    var step = Math.ceil(pts.length / maxN), out = [];
    for (var i = 0; i < pts.length; i += step) {
      var b = pts[i];
      for (var j = i + 1; j < Math.min(i + step, pts.length); j++) if (pts[j][idxMax] > b[idxMax]) b = pts[j];
      out.push(b);
    }
    return out;
  }
  function ticks(max, n) { return K.niceTicks(max, n || 5).ticks.filter(function (t) { return t <= max + 1e-9; }); }
  function rticks(lo, hi, n) { // ticks inside [lo, hi] with a nice step from the span (not from the magnitude)
    var raw = (hi - lo) / (n || 6), mag = Math.pow(10, Math.floor(Math.log10(raw))), step = mag;
    [1, 2, 2.5, 5, 10].some(function (k) { step = k * mag; return step >= raw; });
    var out = [];
    for (var v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }
  function controls(host, st, onChange) {
    var ctl = el("div", "acm-ctl"), inputs = {};
    function row(label, node, outEl) { var w = el("label", "acm-r"); w.appendChild(el("span", "", label)); w.appendChild(node); if (outEl) w.appendChild(outEl); ctl.appendChild(w); return w; }
    return {
      el: ctl, inputs: inputs,
      sel: function (key, label, opts) {
        var s = el("select"); Object.keys(opts).forEach(function (k) { var o = el("option", "", opts[k]); o.value = k; s.appendChild(o); });
        s.value = st[key]; s.addEventListener("change", function () { st[key] = isNaN(+s.value) ? s.value : +s.value; onChange(key); });
        inputs[key] = { set: function (v) { s.value = v; } }; return row(label, s);
      },
      rng: function (key, label, min, max, step, fmt) {
        var s = el("input"), o = el("output"); s.type = "range"; s.min = min; s.max = max; s.step = step; s.value = st[key];
        var upd = function () { o.textContent = fmt(+s.value); };
        var tm = null;
        s.addEventListener("input", function () { st[key] = +s.value; upd(); clearTimeout(tm); tm = setTimeout(function () { onChange(key); }, 60); }); upd();
        inputs[key] = { set: function (v) { s.value = v; upd(); } }; return row(label, s, o);
      },
      note: function (html) { var p = el("p", "pv-note", html); ctl.appendChild(p); return p; },
      btns: function (list) { var w = el("div", "yd-btns"); list.forEach(function (b) { var x = el("button", "", b[0]); x.type = "button"; x.addEventListener("click", b[1]); w.appendChild(x); }); ctl.appendChild(w); return w; }
    };
  }

  /* ---------------------------------------------------------------------------------------------- 1) dynamic lab */
  var DOL_CACHE = {};
  function dolRef(o) {
    var key = [o.load, o.k, o.J.toFixed(5), o.v].join("|");
    if (!DOL_CACHE[key]) DOL_CACHE[key] = Y.run({ start: "dol", load: o.load, k: o.k, J: o.J, v: o.v, dt: 2e-4, rec: 0.005 });
    return DOL_CACHE[key];
  }
  function Lab(host) {
    var st = readState(host, { preset: "pump", kw: 7.5, poles: 4, load: "quad", k: 0.8, j: 0.105, v: 100, trig: "time", ty: 2, ith: 1.25, nth: 90, td: 50, order: "good", trans: "open", rt: 0.15, tr: 60, dol: 1 });
    host.innerHTML = "";
    var wrap = el("div", "acm-wrap"); host.appendChild(wrap);
    var C = controls(host, st, function (key) { if (key === "preset") applyPreset(); if (key === "kw") { st.j = +(PRESETS[st.preset].j * st.kw / 7.5).toFixed(3); C.inputs.j.set(st.j); } sync(); run(); });
    wrap.appendChild(C.el);
    var out = el("div", "acm-out"); wrap.appendChild(out);
    var verdict = el("p", "acm-verdict"), cv1 = el("div", "acm-ch"), cv2 = el("div", "acm-ch"), met = el("dl", "fc-out acm-met"), rec = el("p", "yd-rec");
    out.appendChild(verdict); out.appendChild(cv1); out.appendChild(cv2); out.appendChild(rec); out.appendChild(met);
    var pn = {}; Object.keys(PRESETS).forEach(function (k) { pn[k] = PRESETS[k][EN() ? "en" : "th"]; });
    C.sel("preset", T("ตัวอย่างโหลด", "Load preset"), pn);
    C.rng("kw", T("กำลังมอเตอร์", "Motor rating"), 4, 110, 0.5, function (v) { return nf(v, 1) + " kW"; });
    C.sel("poles", T("จำนวนขั้ว", "Poles"), { 2: "2 (3000 rpm)", 4: "4 (1500 rpm)", 6: "6 (1000 rpm)" });
    C.sel("load", T("ชนิดโหลด", "Load type"), LOADN());
    C.rng("k", T("แรงบิดโหลดที่ความเร็วพิกัด", "Load torque at rated speed"), 0.1, 1.3, 0.05, function (v) { return nf(v, 2) + " × Tn"; });
    C.rng("j", T("J รวม (มอเตอร์ + โหลด) ที่เพลามอเตอร์", "Total J (motor + load) at the motor shaft"), 0.02, 40, 0.005, function (v) { return nf(v, 3) + " kg·m²"; });
    C.rng("v", T("แรงดันไฟขณะสตาร์ท", "Supply voltage during the start"), 80, 105, 1, function (v) { return v + " % " + T("ของ 400 V", "of 400 V"); });
    C.sel("trig", T("สั่งเปลี่ยน Y → Δ ด้วย", "Changeover trigger"), { time: T("ไทเมอร์ (เวลาคงที่)", "Timer (fixed time)"), current: T("รีเลย์กระแส (กระแสลดต่ำกว่าค่าตั้ง)", "Current relay (current falls below setting)"), speed: T("สวิตช์ความเร็ว / เอนโค้ดเดอร์", "Speed switch / encoder") });
    var rTy = C.rng("ty", T("ตั้งไทเมอร์ Y", "Star timer"), 0.2, 60, 0.1, function (v) { return nf(v, 1) + " s"; });
    var rIth = C.rng("ith", T("ค่าตั้งรีเลย์กระแส", "Current relay setting"), 0.8, 2.5, 0.05, function (v) { return nf(v, 2) + " × In"; });
    var rNth = C.rng("nth", T("ค่าตั้งความเร็ว", "Speed setting"), 60, 98, 1, function (v) { return v + " % n_N"; });
    C.sel("trans", T("การเปลี่ยนจังหวะ", "Transition"), { open: T("แบบเปิดวงจร (มาตรฐาน 3 คอนแทกเตอร์)", "Open transition (standard 3 contactors)"), closed: T("แบบปิดวงจร (มีตัวต้านทานเปลี่ยนจังหวะ)", "Closed transition (transition resistors)") });
    var rTd = C.rng("td", T("ช่วงตาย (KM2 หลุด → KM3 ต่อ)", "Dead time (KM2 off → KM3 on)"), 5, 300, 1, function (v) { return v + " ms"; });
    var rRt = C.rng("rt", T("ตัวต้านทานเปลี่ยนจังหวะ Rt", "Transition resistor Rt"), 0.05, 1.5, 0.05, function (v) { return nf(v, 2) + " × Zb"; });
    var rTr = C.rng("tr", T("เวลาผ่านตัวต้านทาน", "Time on the resistors"), 20, 200, 5, function (v) { return v + " ms"; });
    C.sel("order", T("ลำดับเฟส KM3 (ด้านเดลต้า)", "KM3 phase order (delta side)"), { good: T("ตามหลัง (แนะนำ): L1→V2 L2→W2 L3→U2 ล้าหลัง 30°", "Lagging (recommended): L1→V2 L2→W2 L3→U2, lags 30°"), bad: T("มาตรฐาน (เหมือนแผ่นเชื่อม): L1→W2 L2→U2 L3→V2 นำหน้า 30°", "Standard (as the terminal links): L1→W2 L2→U2 L3→V2, leads 30°") });
    C.btns([[T("ใช้เวลาที่แนะนำ", "Use the recommended time"), function () { if (lastRec && lastRec.ok) { st.trig = "time"; C.inputs.trig.set("time"); st.ty = lastRec.tset; C.inputs.ty.set(st.ty); sync(); run(); } }],
      [T("ไทเมอร์สั้นเกิน", "Timer too short"), function () { st.trig = "time"; C.inputs.trig.set("time"); st.ty = +Math.max(0.2, (lastRec && lastRec.ok ? lastRec.t95 : 2) * 0.45).toFixed(1); C.inputs.ty.set(st.ty); sync(); run(); }]]);
    var noteEl = C.note("");
    function applyPreset() {
      var p = PRESETS[st.preset]; st.load = p.load; st.k = p.k; st.j = +(p.j * st.kw / 7.5).toFixed(3); st.ty = p.ty;
      ["load", "k", "j", "ty"].forEach(function (k) { C.inputs[k].set(st[k]); });
    }
    function sync() {
      rTy.hidden = st.trig !== "time"; rIth.hidden = st.trig !== "current"; rNth.hidden = st.trig !== "speed";
      rTd.hidden = st.trans !== "open"; rRt.hidden = rTr.hidden = st.trans !== "closed";
    }
    var lastRec = null;
    function run() {
      var sc = scale(st), Zb = 400 / (IN / S3);
      var o = { start: st.trans === "closed" ? "ydc" : "yd", load: st.load, k: st.k, J: sc.Jm, v: st.v / 100, trig: st.trig, ty: st.ty, ith: st.ith, nth: st.nth / 100,
        tmin: 0.3, tmax: 90, td: st.td / 1000, order: st.order, rt: st.rt * Zb, tr: st.tr / 1000, dt: 2e-4, rec: 0.005, winAuto: [0.04, 0.24] };
      var r = Y.run(o), m = r.m, d = dolRef(o), dm = d.m;
      lastRec = Y.recommend(st.load, st.k, sc.Jm);
      var A = function (pu) { return pu * sc.In; };
      noteEl.innerHTML = T("แบบจำลองพลวัต αβ ของมอเตอร์กรงคู่ 400 V Δ ปรับสเกลเป็น ", "αβ dynamic model of a 400 V Δ double-cage motor scaled to ") + nf(st.kw, 1) + " kW · In ≈ " + nf(sc.In, 1) + " A · Tn ≈ " + nf(sc.Tn, 0) + " N·m · τm = J·ωs/Tn = " + nf(sc.Jm * 2 * Math.PI * 25 / TN, 2) + " s · RK4 0.2 ms";
      // ---------------- chart 1: whole start
      var tEnd = Math.max(m.tEnd, dm.tEnd), ymax = Math.max(7, Math.ceil(Math.max(m.pkEnv, st.dol ? dm.pkEnv : 0) / IN + 0.5));
      var env = decim(r.tr, 1400, 2).map(function (p) { return [p[0], p[2] / IN]; }), sp = decim(r.tr, 700, 1).map(function (p) { return [p[0], p[1] * sc.n]; });
      var ser = [];
      if (st.dol) ser.push({ pts: decim(d.tr, 900, 2).map(function (p) { return [p[0], p[2] / IN]; }), cls: "s4 dsh" });
      ser.push({ pts: env, cls: "s1" }, { pts: sp, cls: "s3 thick", axis: 2 });
      var vl = [];
      if (m.tSw != null) vl.push({ x: m.tSw, cls: "hl dsh", label: "Y→Δ " + nf(m.tSw, 2) + " s" });
      cv1.innerHTML = K.chart({ w: 680, h: 270, xs: [0, tEnd], ys: [0, ymax], y2s: [0, 1600 * sc.n], xl: T("เวลา (s)", "Time (s)"), yl: T("กระแสสาย I/In (rms)", "Line current I/In (rms)"), y2l: T("ความเร็ว (rpm)", "Speed (rpm)"),
        label: T("กระแสสายและความเร็วตลอดการสตาร์ทสตาร์-เดลต้า เทียบสตาร์ทตรง", "Line current and speed through the star–delta start compared with DOL"),
        xt: ticks(tEnd, 6), yt: ticks(ymax, 5), y2t: [0, 500, 1000, 1500].map(function (v) { return v * sc.n; }).filter(function (v) { return v <= 1600 * sc.n; }), xf: function (t) { return (+t.toFixed(2)).toString(); }, y2f: function (t) { return nf(t, 0); },
        series: ser, vlines: vl, hlines: [{ y: 3, cls: "hl dsh", label: "3 × In" }],
        legend: [["f1", T("Y-Δ (กระแส)", "Y-Δ (current)")], ["f3", T("ความเร็ว", "Speed")]].concat(st.dol ? [["f4", T("สตาร์ทตรง DOL", "DOL")]] : []) });
      // ---------------- chart 2: zoom on the changeover (instantaneous)
      if (r.dense.length > 10) {
        var z0 = r.dense[0][0], z1 = r.dense[r.dense.length - 1][0], dz = decim(r.dense, 1200, 1);
        var ipk = 0; r.dense.forEach(function (p) { ipk = Math.max(ipk, Math.abs(p[1]), Math.abs(p[2]), Math.abs(p[3])); });
        var ia = Math.max(4, Math.ceil(ipk / IN / 2) * 2), tmx = 0;
        r.dense.forEach(function (p) { tmx = Math.max(tmx, Math.abs(p[4]) / TN); });
        var ta = Math.max(3, Math.ceil(tmx));
        var mk = function (c) { return dz.map(function (p) { return [p[0], p[c] / IN]; }); };
        var v2 = [{ x: m.tSw, cls: "hl dsh", label: T("KM2 หลุด", "KM2 off") }];
        if (m.tClose != null) v2.push({ x: m.tClose, cls: "hl dsh", label: T("KM3 ต่อ", "KM3 on") });
        cv2.innerHTML = K.chart({ w: 680, h: 250, xs: [z0, z1], ys: [-ia, ia], y2s: [-ta, ta], xl: T("เวลา (s) — ขยายช่วงเปลี่ยนจังหวะ", "Time (s) — zoom on the changeover"), yl: T("i_L / In (ค่าขณะหนึ่ง)", "i_L / In (instantaneous)"), y2l: "T_e / Tn",
          label: T("กระแสสาย L1 L2 L3 ค่าขณะหนึ่งและแรงบิดช่วงเปลี่ยนจากสตาร์เป็นเดลต้า", "Instantaneous line currents L1 L2 L3 and torque at the star-to-delta changeover"),
          xt: rticks(z0, z1, 6), yt: [-ia, -ia / 2, 0, ia / 2, ia], y2t: [-ta, 0, ta], xf: function (t) { return (+t.toFixed(3)).toString(); },
          series: [{ pts: mk(1), cls: "s1" }, { pts: mk(2), cls: "s2" }, { pts: mk(3), cls: "s5" }, { pts: dz.map(function (p) { return [p[0], p[4] / TN]; }), cls: "s7", axis: 2 }],
          vlines: v2, legend: [["f1", "L1"], ["f2", "L2"], ["f5", "L3"], ["f7", T("แรงบิด (ขวา)", "torque (right)")]] });
      } else cv2.innerHTML = "";
      // ---------------- metrics
      var rows = [], nY = Y.opPoint(function (n) { return Y.loadT(st.load, n, st.k); }, Y.VP * st.v / 100, 1 / 3);
      if (nY != null && Y.motor(1, Y.VP * st.v / 100).T / 3 <= Y.loadT(st.load, 0, st.k)) nY = null;
      rows.push([T("เปลี่ยน Y → Δ ที่", "Changeover at"), m.tSw != null ? nf(m.tSw, 2) + " s · " + nf(m.nSw * sc.n, 0) + " rpm (" + nf(m.nSw / NN * 100, 1) + " % n_N)" : "—"]);
      rows.push([T("ความเร็วสมดุลในสตาร์ · กระแสสตาร์ขณะนั้น", "Star equilibrium speed · star current there"), nY ? nf(nY * sc.n, 0) + " rpm (" + nf(nY / NN * 100, 1) + " %) · " + nf(Y.motor(1 - nY / 1500, Y.VP * st.v / 100).I / 3 / IN, 2) + " × In" : T("ไม่มี — สตาร์เร่งไม่ขึ้น", "none — the star stage cannot accelerate")]);
      rows.push([T("ยอดกระแสหลังเปลี่ยน (rms) · DOL", "Peak current after changeover (rms) · DOL"), "<b>" + nf(m.pkEnvSw / IN, 2) + " × In = " + nf(A(m.pkEnvSw / IN), 0) + " A</b> · " + nf(dm.pkEnv / IN, 2) + " × In"]);
      rows.push([T("ยอดกระแสขณะหนึ่งสูงสุด (เฟสใดก็ได้)", "Highest instantaneous current (any phase)"), nf(A(m.pkInstSw / IN), 0) + " A · DOL " + nf(A(dm.pkInst / IN), 0) + " A"]);
      rows.push([T("เวลาที่กระแส > 3·In หลังเปลี่ยน", "Time above 3·In after changeover"), nf(m.tHigh, 2) + " s · DOL " + nf(dm.tHigh, 2) + " s"]);
      rows.push([T("แรงบิดช่วงเปลี่ยน (ต่ำสุด…สูงสุด)", "Torque at the changeover (min…max)"), nf(m.mnTSw / TN, 2) + " … " + nf(m.pkTSw / TN, 2) + " × Tn · DOL " + nf(dm.mnT / TN, 2) + " … " + nf(dm.pkT / TN, 2)]);
      if (st.trans === "open" && m.eRes != null) {
        var dv = Math.sqrt(400 * 400 + m.eRes * m.eRes - 2 * 400 * m.eRes * Math.cos(m.phRes * Math.PI / 180));
        rows.push([T("แรงดันค้าง e ตอน KM3 ต่อ · มุมเทียบแรงดัน Δ", "Residual voltage e when KM3 closes · angle to the Δ voltage"), nf(m.eRes, 0) + " V (" + nf(m.eRes / 400 * 100, 0) + " %) · " + nf(m.phRes, 0) + "°"]);
        rows.push([T("แรงดันขับทรานเซียนต์ |V_Δ − e| (DOL = 400 V)", "Transient driving voltage |V_Δ − e| (DOL = 400 V)"), nf(dv, 0) + " V = " + nf(dv / 400, 2) + " × DOL"]);
        rows.push([T("ความเร็วลดลงในช่วงตาย", "Speed lost in the dead time"), nf(m.dnDead * sc.n, 0) + " rpm (" + nf(m.dnDead / NN * 100, 1) + " %)"]);
      }
      rows.push([T("เวลาสตาร์ทถึง 98 % ความเร็ว", "Start time to 98 % speed"), nf(m.tReach, 2) + " s · DOL " + nf(dm.tReach, 2) + " s"]);
      rows.push([T("I²t ของสายจ่าย (ความร้อนสาย/หม้อแปลง)", "Supply I²t (cable / transformer heating)"), nf(m.I2t / dm.I2t * 100, 0) + " % " + T("ของ DOL", "of DOL")]);
      rows.push([T("ความร้อนในโรเตอร์ช่วงสตาร์ท", "Rotor heat during the start"), nf(m.Ecu2 / 1000 * sc.kp, 2) + " kJ = " + nf(m.Ecu2 / dm.Ecu2 * 100, 0) + " % " + T("ของ DOL", "of DOL")]);
      if (st.trans === "closed") rows.push([T("พลังงานในตัวต้านทานเปลี่ยนจังหวะ", "Energy in the transition resistors"), nf(m.Ert / 1000 * sc.kp, 2) + " kJ · Rt = " + nf(st.rt * Zb / sc.kp, 1) + " Ω " + T("ต่อขด", "per winding")]);
      met.innerHTML = rows.map(function (q) { return "<dt>" + q[0] + "</dt><dd>" + q[1] + "</dd>"; }).join("");
      // ---------------- recommendation and verdict
      if (lastRec.ok) rec.innerHTML = "⏱ " + T("เวลาที่แนะนำ: ", "Recommended timer: ") + "<b>" + nf(lastRec.tset, 1) + " s</b> " + T("(ถึง 98 % ของความเร็วสมดุลสตาร์ใน ", "(98 % of the star equilibrium speed in ") + nf(lastRec.t98, 2) + " s × 1.2" + (lastRec.t95v90 ? T(" และ 95 % ที่แรงดัน 90 % ใน ", "; 95 % at 90 % voltage in ") + nf(lastRec.t95v90, 2) + " s" : T(" · ที่แรงดัน 90 % สตาร์เร่งไม่ถึง 80 %", " · at 90 % voltage the star stage stays below 80 %")) + ")";
      else rec.innerHTML = "⏱ " + T("ไม่แนะนำสตาร์-เดลต้า: ", "Star–delta not recommended: ") + (lastRec.why === "stall" ? T("แรงบิดสตาร์ไม่พอให้โหลดออกตัว", "the star torque cannot break the load away") : T("ความเร็วสมดุลในสตาร์ต่ำกว่า 80 % — กระแสตอนเปลี่ยนจะเกือบเท่า DOL", "the star equilibrium speed is below 80 % — the changeover current will be close to DOL"));
      var v;
      if (m.nSw != null && m.nSw < 0.05 * NN) v = ["bad", T("✗ มอเตอร์แทบไม่หมุนในช่วงสตาร์ — แรงบิด Y = 1/3 ของ DOL น้อยกว่าแรงบิดออกตัวของโหลด การเปลี่ยนเป็น Δ จึงเท่ากับสตาร์ทตรง", "✗ The motor hardly turned in star — the Y torque (1/3 of DOL) is below the breakaway torque, so the changeover is effectively a DOL start")];
      else if (!m.ok) v = ["bad", T("✗ สตาร์ทไม่สำเร็จ — โหลดเกินแรงบิดของมอเตอร์ที่แรงดันนี้", "✗ The start fails — the load exceeds the motor torque at this voltage")];
      else if (nY && m.nSw < 0.9 * nY) v = ["warn", T("⚠ เปลี่ยนเร็วเกินไป: ความเร็วเพียง ", "⚠ Changeover too early: only ") + nf(m.nSw / nY * 100, 0) + T(" % ของความเร็วสมดุลสตาร์ กระแสสูงเกิน 3·In ค้างอีก ", " % of the star equilibrium speed, current stays above 3·In for ") + nf(m.tHigh, 2) + T(" s — เพิ่มเวลาไทเมอร์ หรือใช้รีเลย์กระแส/ความเร็ว", " s — lengthen the timer or use a current/speed relay")];
      else if (m.pkEnvSw > 1.03 * dm.pkEnv) v = ["warn", T("⚠ ยอดกระแสตอนเปลี่ยนสูงกว่า DOL (", "⚠ The changeover peak exceeds DOL (") + nf(m.pkEnvSw / dm.pkEnv, 2) + T("×) เพราะแรงดันค้างกลับเฟส — ลองลดช่วงตาย ต่อ KM3 แบบตามหลัง หรือใช้แบบปิดวงจร", "×) because the residual voltage is out of phase — try a shorter dead time, wire KM3 in the lagging order or use closed transition")];
      else if (lastRec.ok && st.trig === "time" && st.ty > 2 * lastRec.tset + 2) v = ["warn", T("⚠ เวลาไทเมอร์นานเกินจำเป็น: มอเตอร์เดินสตาร์ที่สลิปสูง ร้อนโรเตอร์และกินงบความร้อนของโอเวอร์โหลด", "⚠ The timer is much longer than needed: the motor runs in star at high slip, heating the rotor and using up the overload's thermal budget")];
      else v = ["ok", T("✓ เปลี่ยนจังหวะที่ความเร็วสูงพอ กระแสสูงสั้นเพียง ", "✓ Changeover at a high enough speed: high current for only ") + nf(m.tHigh, 2) + T(" s (DOL ", " s (DOL ") + nf(dm.tHigh, 2) + " s)"];
      verdict.className = "acm-verdict " + v[0]; verdict.textContent = v[1];
    }
    host._set = function (vals) {
      if (vals.preset) { st.preset = vals.preset; C.inputs.preset.set(st.preset); applyPreset(); }
      Object.keys(vals).forEach(function (k) { if (k !== "preset" && k in st) { st[k] = isNaN(+vals[k]) ? vals[k] : +vals[k]; if (C.inputs[k]) C.inputs[k].set(st[k]); } });
      sync(); run();
    };
    sync(); run();
  }

  /* ---------------------------------------------------------------------------------------------- 2) sweep = your own experiment */
  function Sweep(host) {
    var st = readState(host, { preset: "fan", param: "ty", n: 14, order: "good", v: 100 });
    host.innerHTML = "";
    var wrap = el("div", "acm-wrap"); host.appendChild(wrap);
    var C = controls(host, st, function () { });
    wrap.appendChild(C.el);
    var out = el("div", "acm-out"); wrap.appendChild(out);
    var cv = el("div", "acm-ch"), tab = el("div", "yd-tab"), status = el("p", "pv-note");
    out.appendChild(status); out.appendChild(cv); out.appendChild(tab);
    var pn = {}; Object.keys(PRESETS).forEach(function (k) { pn[k] = PRESETS[k][EN() ? "en" : "th"]; });
    C.sel("preset", T("กรณีทดลอง (มอเตอร์ 7.5 kW)", "Test case (7.5 kW motor)"), pn);
    C.sel("param", T("ตัวแปรต้นที่กวาด", "Swept variable"), { ty: T("เวลาไทเมอร์ t_Y", "Star timer t_Y"), td: T("ช่วงตาย t_d (ไทเมอร์ที่แนะนำ)", "Dead time t_d (recommended timer)"), rt: T("ตัวต้านทานปิดวงจร Rt/Zb", "Closed-transition resistor Rt/Zb") });
    C.sel("order", T("ลำดับเฟส KM3", "KM3 phase order"), { good: T("ตามหลัง (ล้าหลัง 30°)", "Lagging (lags 30°)"), bad: T("มาตรฐาน (นำหน้า 30°)", "Standard (leads 30°)") });
    C.rng("v", T("แรงดันไฟ", "Supply voltage"), 85, 105, 1, function (v) { return v + " %"; });
    C.rng("n", T("จำนวนจุดทดลอง", "Number of runs"), 6, 30, 1, function (v) { return v + T(" ครั้ง", " runs"); });
    var csv = "";
    C.btns([[T("▶ เริ่มทดลอง", "▶ Run the experiment"), go], [T("⬇ CSV", "⬇ CSV"), function () {
      if (!csv) return;
      var a = el("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "star-delta-" + st.preset + "-" + st.param + ".csv"; document.body.appendChild(a); a.click(); a.remove();
    }]]);
    C.note(T("แต่ละจุดคือการจำลองพลวัตเต็มรูปหนึ่งครั้ง (RK4 0.2 ms) ช่วงตาย 50 ms เมื่อไม่ได้กวาด ผลเป็นของแบบจำลอง ใช้ดูแนวโน้มและเปรียบเทียบ", "Each point is one full dynamic simulation (RK4 0.2 ms); dead time 50 ms when not swept. Results belong to the model — use them for trends and comparisons."));
    var busy = false;
    function go() {
      if (busy) return; busy = true;
      var p = PRESETS[st.preset], J = p.j, rc = Y.recommend(p.load, p.k, J), xs = [], i, res = [];
      var base = { load: p.load, k: p.k, J: J, v: st.v / 100, order: st.order, dt: 2e-4, rec: 0.01, td: 0.05, ty: rc.ok ? rc.tset : p.ty };
      var d = Y.run({ start: "dol", load: p.load, k: p.k, J: J, v: st.v / 100, dt: 2e-4, rec: 0.01 }).m;
      if (st.param === "ty") { var tmax = Math.max(2, (rc.ok ? rc.tset : p.ty) * 1.8); for (i = 0; i < st.n; i++) xs.push(+(tmax * (i + 1) / st.n).toFixed(2)); }
      else if (st.param === "td") { for (i = 0; i < st.n; i++) xs.push(Math.round(5 + i * 295 / (st.n - 1))); }
      else { for (i = 0; i < st.n; i++) xs.push(+(0.05 + i * 1.45 / (st.n - 1)).toFixed(3)); }
      var Zb = 400 / (IN / S3);
      csv = (st.param === "ty" ? "t_Y_s" : st.param === "td" ? "t_d_ms" : "Rt_per_Zb") + ",n_changeover_pct,peak_rms_xIn,time_above_3In_s,Tmin_xTn,Tmax_xTn,I2t_pct_DOL,rotor_heat_pct_DOL,start_time_s\n";
      (function step(j) {
        if (j >= xs.length) { busy = false; status.textContent = T("เสร็จ ", "Done: ") + xs.length + T(" ครั้ง · DOL: ยอด ", " runs · DOL: peak ") + nf(d.pkEnv / IN, 2) + " × In · > 3·In " + nf(d.tHigh, 2) + " s"; return; }
        var o = Object.assign({}, base, { start: "yd" });
        if (st.param === "ty") o.ty = xs[j]; else if (st.param === "td") o.td = xs[j] / 1000; else { o.start = "ydc"; o.rt = xs[j] * Zb; o.tr = 0.06; }
        var m = Y.run(o).m;
        res.push({ x: xs[j], n: m.nSw / NN * 100, pk: m.pkEnvSw / IN, hi: m.tHigh, mn: m.mnTSw / TN, mx: m.pkTSw / TN, i2t: m.I2t / d.I2t * 100, er: m.Ecu2 / d.Ecu2 * 100, t: m.tReach });
        var q = res[res.length - 1];
        csv += [q.x, q.n.toFixed(2), q.pk.toFixed(3), q.hi.toFixed(3), q.mn.toFixed(3), q.mx.toFixed(3), q.i2t.toFixed(1), q.er.toFixed(1), (q.t || 0).toFixed(3)].join(",") + "\n";
        status.textContent = T("กำลังจำลอง ", "Simulating ") + (j + 1) + "/" + xs.length + " …";
        draw(res, d, xs[xs.length - 1]);
        setTimeout(function () { step(j + 1); }, 0);
      })(0);
    }
    function draw(res, d, xmax) {
      var lab = st.param === "ty" ? T("เวลาไทเมอร์ t_Y (s)", "Star timer t_Y (s)") : st.param === "td" ? T("ช่วงตาย t_d (ms)", "Dead time t_d (ms)") : "Rt / Zb";
      var x0 = st.param === "td" ? 0 : 0, ym = Math.max(6, Math.ceil(Math.max.apply(null, res.map(function (q) { return q.pk; }).concat([d.pkEnv / IN])) + 0.5));
      var hm = Math.max(0.5, Math.ceil(Math.max.apply(null, res.map(function (q) { return q.hi; }).concat([0.4])) * 4) / 4);
      cv.innerHTML = K.chart({ w: 680, h: 280, xs: [x0, xmax], ys: [0, ym], y2s: [0, hm], xl: lab, yl: T("ยอดกระแสหลังเปลี่ยน I/In", "Peak after changeover I/In"), y2l: T("เวลา > 3·In (s)", "Time > 3·In (s)"),
        label: T("ผลการทดลองเชิงตัวเลข: ยอดกระแสและเวลากระแสสูงหลังเปลี่ยนจังหวะ", "Numerical experiment: changeover peak and high-current time"),
        xt: ticks(xmax, 6), yt: ticks(ym, 5), y2t: ticks(hm, 4), xf: function (t) { return (+t.toFixed(2)).toString(); }, y2f: function (t) { return (+t.toFixed(2)).toString(); },
        series: [{ pts: res.map(function (q) { return [q.x, q.pk]; }), cls: "s1 thick" }, { pts: res.map(function (q) { return [q.x, q.hi]; }), cls: "s3", axis: 2 }],
        hlines: [{ y: d.pkEnv / IN, cls: "hl red", label: "DOL " + nf(d.pkEnv / IN, 2) }],
        marks: res.map(function (q) { return { x: q.x, y: q.pk, r: 3, cls: "dot" }; }),
        legend: [["f1", T("ยอดกระแส (ซ้าย)", "peak (left)")], ["f3", T("เวลา > 3·In (ขวา)", "time > 3·In (right)")]] });
      var h = "<table class=\"acm-t yd-t\"><thead><tr><th>" + lab + "</th><th>n_sw %</th><th>I_pk/In</th><th>&gt;3·In s</th><th>T min…max</th><th>I²t %DOL</th><th>" + T("ร้อนโรเตอร์ %DOL", "rotor heat %DOL") + "</th></tr></thead><tbody>";
      res.forEach(function (q) { h += "<tr><td>" + q.x + "</td><td>" + nf(q.n, 1) + "</td><td>" + nf(q.pk, 2) + "</td><td>" + nf(q.hi, 2) + "</td><td>" + nf(q.mn, 1) + "…" + nf(q.mx, 1) + "</td><td>" + nf(q.i2t, 0) + "</td><td>" + nf(q.er, 0) + "</td></tr>"; });
      tab.innerHTML = h + "</tbody></table>";
    }
    host._set = function (vals) { Object.keys(vals).forEach(function (k) { if (k in st) { st[k] = isNaN(+vals[k]) ? vals[k] : +vals[k]; if (C.inputs[k]) C.inputs[k].set(st[k]); } }); go(); };
    status.textContent = T("กด ▶ เริ่มทดลอง", "Press ▶ Run the experiment");
  }

  /* ---------------------------------------------------------------------------------------------- 3) running in Y vs Δ */
  function Run(host) {
    var st = readState(host, { x: 25, kw: 7.5, v: 100, h: 6000, price: 4.5 });
    host.innerHTML = "";
    var wrap = el("div", "acm-wrap"); host.appendChild(wrap);
    var C = controls(host, st, function () { draw(); });
    wrap.appendChild(C.el);
    var out = el("div", "acm-out"); wrap.appendChild(out);
    var verdict = el("p", "acm-verdict"), cv = el("div", "acm-ch"), met = el("div", "yd-tab");
    out.appendChild(verdict); out.appendChild(cv); out.appendChild(met);
    C.rng("x", T("โหลดที่เพลา", "Shaft load"), 5, 100, 1, function (v) { return v + " % Pn"; });
    C.rng("kw", T("กำลังพิกัดมอเตอร์", "Motor rating"), 4, 110, 0.5, function (v) { return nf(v, 1) + " kW"; });
    C.rng("v", T("แรงดันไฟ", "Supply voltage"), 90, 106, 1, function (v) { return v + " %"; });
    C.rng("h", T("ชั่วโมงทำงานต่อปี", "Operating hours per year"), 500, 8760, 100, function (v) { return nf(v, 0) + " h"; });
    C.rng("price", T("ค่าไฟต่อหน่วย", "Energy price"), 2, 8, 0.1, function (v) { return nf(v, 2) + T(" บาท/kWh", " THB/kWh"); });
    C.note(T("มอเตอร์ 7.5 kW 400 V Δ ปรับสเกลตามกำลัง · การสูญเสียแกนเหล็ก ∝ V² (300 W ที่ 400 V) · แบบจำลองแม่เหล็กเชิงเส้น (มอเตอร์จริงที่อิ่มตัวมักประหยัดในสตาร์ได้มากกว่านี้เล็กน้อย)", "7.5 kW 400 V Δ motor scaled by rating · core loss ∝ V² (300 W at 400 V) · linear magnetic model (a real, saturating motor usually saves slightly more in star)"));
    function draw() {
      var kp = st.kw / 7.5, P = st.x / 100 * Y.PN, d = Y.state("D", P, st.v / 100), y = Y.state("Y", P, st.v / 100), be = Y.breakEven(st.v / 100);
      var curve = { D: [], Y: [], pD: [], pY: [] };
      for (var x = 4; x <= 100; x += 2) {
        var a = Y.state("D", x / 100 * Y.PN, st.v / 100), b = Y.state("Y", x / 100 * Y.PN, st.v / 100);
        curve.D.push([x, a.eta * 100]); curve.pD.push([x, a.pf * 100]);
        if (b.ok) { curve.Y.push([x, b.eta * 100]); curve.pY.push([x, b.pf * 100]); }
      }
      cv.innerHTML = K.chart({ w: 680, h: 260, xs: [0, 100], ys: [0, 100], xl: T("โหลดที่เพลา (% ของกำลังพิกัด)", "Shaft load (% of rating)"), yl: T("η และ cos φ (%)", "η and cos φ (%)"),
        label: T("ประสิทธิภาพและตัวประกอบกำลังเมื่อเดินแบบสตาร์และเดลต้าที่โหลดต่างๆ", "Efficiency and power factor running in star and in delta versus load"),
        xt: [0, 20, 40, 60, 80, 100], yt: [0, 20, 40, 60, 80, 100],
        series: [{ pts: curve.D, cls: "s2 thick" }, { pts: curve.Y, cls: "s1 thick" }, { pts: curve.pD, cls: "s2 dsh" }, { pts: curve.pY, cls: "s1 dsh" }],
        vlines: [{ x: st.x, cls: "hl", label: st.x + " %" }].concat(be ? [{ x: be * 100, cls: "hl red", label: T("จุดคุ้มทุน ", "break-even ") + nf(be * 100, 0) + " %" }] : []),
        legend: [["f2", "η Δ"], ["f1", "η Y"], ["f2", "cos φ Δ (- -)"], ["f1", "cos φ Y (- -)"]] });
      var W = function (v) { return nf(v * kp, 0) + " W"; };
      var h = "<table class=\"acm-t yd-t\"><thead><tr><th></th><th>" + T("เดลต้า Δ (ปกติ)", "Delta Δ (normal)") + "</th><th>" + T("สตาร์ Y (400 V)", "Star Y (400 V)") + "</th></tr></thead><tbody>";
      var rowsT = [[T("ความเร็ว · สลิป", "Speed · slip"), function (s) { return nf(s.n, 0) + " rpm · " + nf(s.s * 100, 2) + " %"; }],
        [T("กระแสสาย", "Line current"), function (s) { return nf(s.I * kp, 1) + " A"; }], ["cos φ", function (s) { return nf(s.pf, 3); }], ["η", function (s) { return nf(s.eta * 100, 1) + " %"; }],
        [T("กำลังไฟฟ้าเข้า", "Input power"), function (s) { return W(s.Pin); }], [T("ทองแดงสเตเตอร์ · โรเตอร์", "Stator · rotor copper"), function (s) { return W(s.Pcu1) + " · " + W(s.Pcu2); }],
        [T("แกนเหล็ก · แรงเสียดทานลม", "Core · friction & windage"), function (s) { return W(s.Pfe) + " · " + W(s.Pfw); }], [T("กำลังรีแอกทีฟ", "Reactive power"), function (s) { return nf(s.Q * kp / 1000, 2) + " kvar"; }],
        [T("แรงบิดสูงสุด / แรงบิดโหลด", "Breakdown torque / load torque"), function (s) { return nf(s.margin, 2) + " ×"; }]];
      rowsT.forEach(function (r) { h += "<tr><th>" + r[0] + "</th><td>" + r[1](d) + "</td><td>" + (y.ok ? r[1](y) : T("หยุด (stall)", "stalls")) + "</td></tr>"; });
      h += "</tbody></table>";
      var save = y.ok ? (d.Pin - y.Pin) * kp : null;
      if (save != null) h += "<p class=\"yd-rec\">" + T("ประหยัด ", "Saving ") + "<b>" + nf(save, 0) + " W</b> → " + nf(save * st.h / 1000, 0) + T(" kWh/ปี ≈ ", " kWh/year ≈ ") + "<b>" + nf(save * st.h / 1000 * st.price, 0) + T(" บาท/ปี", " THB/year") + "</b>" + T(" · รีแอกทีฟลดลง ", " · reactive power down by ") + nf((d.Q - y.Q) * kp / 1000, 2) + " kvar</p>";
      met.innerHTML = h;
      var v;
      if (!y.ok) v = ["bad", T("✗ ในสตาร์แรงบิดสูงสุดเหลือ 1/3 — รับโหลดนี้ไม่ได้ ต้องเดินเดลต้า", "✗ In star the breakdown torque falls to 1/3 — it cannot carry this load; run in delta")];
      else if (y.margin < 2.5) v = ["warn", T("⚠ ประหยัด ", "⚠ Saves ") + nf(save, 0) + T(" W แต่เผื่อแรงบิดเหลือ ", " W but the torque margin is only ") + nf(y.margin, 2) + T("× (ควร ≥ 2.5×) — โหลดกระชากหรือแรงดันตกอาจทำให้หยุดหมุน ต้องมีรีเลย์กระแสสลับกลับเป็น Δ", "× (keep ≥ 2.5×) — a load step or voltage dip could stall it; a current relay must switch back to Δ")];
      else if (save <= 0) v = ["warn", T("⚠ ที่โหลดนี้สตาร์สูญเสียมากกว่าเดลต้า (เกินจุดคุ้มทุน ", "⚠ At this load star loses more than delta (above the break-even of ") + nf(be * 100, 0) + " %)"];
      else v = ["ok", T("✓ เดินสตาร์ที่โหลดนี้ประหยัด ", "✓ Running in star at this load saves ") + nf(save, 0) + " W (" + nf((d.Pin - y.Pin) / d.Pin * 100, 1) + T(" % ของกำลังเข้า) cos φ ดีขึ้นจาก ", " % of input), cos φ rises from ") + nf(d.pf, 2) + T(" เป็น ", " to ") + nf(y.pf, 2)];
      verdict.className = "acm-verdict " + v[0]; verdict.textContent = v[1];
    }
    host._set = function (vals) { Object.keys(vals).forEach(function (k) { if (k in st) { st[k] = +vals[k]; if (C.inputs[k]) C.inputs[k].set(st[k]); } }); draw(); };
    draw();
  }

  /* ---------------------------------------------------------------------------------------------- 4) timer calculator */
  var CALC = {
    timer: {
      t: T("คำนวณเวลาตั้งไทเมอร์สตาร์-เดลต้าจากความเฉื่อยและชนิดโหลด", "Star–delta timer from inertia and load type"), ref: "E8–E12",
      ins: [["kw", T("กำลังมอเตอร์", "Motor rating"), "kW", "7.5"], ["poles", T("จำนวนขั้ว", "Poles"), "sel", "4", ["2", "4", "6"]],
        ["jm", T("J มอเตอร์ (แคตตาล็อก)", "Motor J (catalogue)"), "kg·m²", "0.045"], ["jl", T("J โหลด อ้างถึงเพลามอเตอร์", "Load J referred to the motor shaft"), "kg·m²", "2.2"],
        ["load", T("ชนิดโหลด", "Load type"), "sel", T("พัดลม T ∝ n² (ฐาน 5 %)", "Fan T ∝ n² (5 % base)"), [T("พัดลม T ∝ n² (ฐาน 5 %)", "Fan T ∝ n² (5 % base)"), T("ปั๊มหอยโข่ง T ∝ n² (ฐาน 12 %)", "Centrifugal pump T ∝ n² (12 % base)"), T("เครื่องผสม T ∝ n", "Mixer T ∝ n"), T("แรงบิดคงที่ (สายพาน)", "Constant torque (conveyor)")]],
        ["k", T("แรงบิดโหลดที่ความเร็วพิกัด", "Load torque at rated speed"), "× Tn", "1.0"], ["vmin", T("แรงดันต่ำสุดที่คาดว่าจะเจอ", "Lowest expected voltage"), "%", "90"]],
      f: function (x) {
        var ns = 6000 / (+x.poles), J = x.jm + x.jl, Jm = J * (7.5 / x.kw) * Math.pow(ns / 1500, 2);
        var load = x.load.indexOf("5 %") >= 0 ? "fan" : x.load.indexOf("12 %") >= 0 ? "quad" : x.load.indexOf("∝ n") >= 0 ? "lin" : "const";
        var a = Y.runupQS({ conn: "Y", load: load, k: x.k, J: Jm }), b = Y.runupQS({ conn: "Y", load: load, k: x.k, J: Jm, v: x.vmin / 100 }), d = Y.runupQS({ conn: "D", load: load, k: x.k, J: Jm });
        var Tn = TN * (x.kw / 7.5) * (1500 / ns), tau = Jm * 2 * Math.PI * 25 / TN, rows = []; // per-unit: same τm as the model
        rows.push(["Tn · τm = J·ωs/Tn", nf(Tn, 1) + " N·m · " + nf(tau, 2) + " s"]);
        rows.push([T("แรงบิดสตาร์ตอนเริ่ม · โหลดต้องการ", "Star torque at standstill · load needs"), nf(Y.motor(1).T / 3 / TN, 2) + " · " + nf(Y.loadT(load, 0, x.k) / TN, 2) + " × Tn"]);
        if (!a.ok || a.nEq < 0.8 * NN) {
          rows.push([T("ผล", "Result"), '<span class="ee-warn">' + (a.ok ? T("ความเร็วสมดุลสตาร์ ", "Star equilibrium only ") + nf(a.nEq / NN * 100, 0) + T(" % — ไม่เหมาะกับสตาร์-เดลต้า", " % — not suitable for star–delta") : T("สตาร์ออกตัวไม่ได้ — ใช้ DOL ซอฟต์สตาร์ท หรือ VFD", "the star stage cannot break away — use DOL, a soft starter or a VFD")) + "</span>"]);
          return { rows: rows, note: T("สตาร์-เดลต้าต้องการให้แรงบิดสตาร์ (1/3 ของ DOL) สูงกว่าโหลดตลอดช่วงเร่งจนถึง ≥ 85–90 % ของความเร็ว", "Star–delta needs the star torque (1/3 of DOL) above the load all the way to ≥ 85–90 % speed") };
        }
        rows.push([T("ความเร็วสมดุลในสตาร์", "Star equilibrium speed"), nf(a.nEq / NN * 100, 1) + " % n_N · " + T("กระแสสตาร์ ", "star current ") + nf(Y.motor(1 - a.nEq / 1500).I / 3 / IN, 2) + " × In"]);
        rows.push([T("เวลาถึง 95 % · 98 % ของความเร็วสมดุล", "Time to 95 % · 98 % of that speed"), nf(a.t95, 2) + " · " + nf(a.t98, 2) + " s"]);
        var weak = !(b.ok && b.nEq > 0.8 * NN);
        rows.push([T("ที่แรงดัน ", "At ") + x.vmin + T(" %: เวลาถึง 95 %", " % voltage: time to 95 %"), weak ? '<span class="ee-warn">' + T("เร่งไม่ถึง 80 %", "does not reach 80 %") + "</span>" : nf(b.t95, 2) + " s"]);
        var tset = Math.max(1, Math.ceil((Math.max(1.2 * a.t98, weak ? 0 : b.t95) - 0.05) * 2) / 2);
        rows.push([T("ตั้งไทเมอร์", "Set the timer to"), "<b>" + nf(tset, 1) + " s</b> = " + nf(tset / tau, 2) + " τm"]);
        rows.push([T("กระแสกระโดดคงตัวตอนเปลี่ยน (ไม่รวมทรานเซียนต์)", "Steady current jump at the changeover (without transient)"), nf(Y.motor(1 - a.nEq / 1500).I / IN, 2) + " × In"]);
        rows.push([T("เทียบ DOL: เวลาเร่ง", "DOL run-up time for comparison"), nf(d.t98, 2) + " s"]);
        if (tset > 10) rows.push([T("โอเวอร์โหลด", "Overload relay"), '<span class="ee-warn">' + T("สตาร์ทนาน > 10 s — พิจารณาคลาส 20 และตรวจเวลาทนล็อกโรเตอร์", "start > 10 s — consider class 20 and check the locked-rotor time") + "</span>"]);
        return { rows: rows, note: T("แบบจำลอง quasi-static ของมอเตอร์กรงคู่ 400 V Δ ปรับสเกลผ่าน τm · ค่าตั้ง = max(1.2·t98 ที่แรงดันปกติ, t95 ที่แรงดันต่ำสุด) ปัดขึ้นทีละ 0.5 s · ยืนยันหน้างานด้วยแคลมป์มิเตอร์: กระแสช่วงสตาร์ต้องนิ่งก่อนเปลี่ยน", "Quasi-static model of the 400 V Δ double-cage motor scaled through τm · setting = max(1.2·t98 at nominal voltage, t95 at the lowest voltage), rounded up to 0.5 s · confirm on site with a clamp meter: the star current must have settled before the changeover") };
      }
    }
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".yd-lab"), function (h) { if (!h._set) Lab(h); });
    Array.prototype.forEach.call(document.querySelectorAll(".yd-sweep"), function (h) { if (!h._set) Sweep(h); });
    Array.prototype.forEach.call(document.querySelectorAll(".yd-run"), function (h) { if (!h._set) Run(h); });
    Array.prototype.forEach.call(document.querySelectorAll("button[data-yd-set]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-yd-target"), host = id ? document.getElementById(id) : document.querySelector(".yd-lab");
        if (!host || !host._set) return;
        host._set(JSON.parse(b.getAttribute("data-yd-set")));
        host.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  if (K) K.calcs("data-yd", CALC, "yd");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
