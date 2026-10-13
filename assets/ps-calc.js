/* Power systems & protection tools for /learn/power-systems/ — needs assets/ee-kit.js first. Plain JS, no dependencies.
   Calculators: <div class="fg-calc ps-calc" data-ps="pu|base|fault|ufault|seq|reg|pd|earth|diff|relay"></div>  (preset any input with data-<key>)
   Overcurrent coordination (log-log TCC): <div class="ps-tcc" [data-if="10000"]></div>
   Curves: IEC 60255-151 t = TMS·k/((I/Is)^α − 1). Short circuit: IEC 60909 style c-factor and κ = 1.02 + 0.98 e^(−3R/X). */
(function (root) {
  "use strict";
  var K = root.EEKit;
  var n = K.n, sig = K.sig, ok = K.ok, warn = K.warn;
  var R3 = Math.sqrt(3), D2R = Math.PI / 180;

  // complex helpers [re, im]
  var C = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; }, sub: function (a, b) { return [a[0] - b[0], a[1] - b[1]]; },
    mul: function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; },
    div: function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    abs: function (a) { return Math.hypot(a[0], a[1]); }, ang: function (a) { return Math.atan2(a[1], a[0]) / D2R; },
    pol: function (m, deg) { return [m * Math.cos(deg * D2R), m * Math.sin(deg * D2R)]; }, sc: function (a, k) { return [a[0] * k, a[1] * k]; }
  };
  var A = C.pol(1, 120), A2 = C.pol(1, 240);
  var fmtC = function (z, d) { return n(C.abs(z), d == null ? 3 : d) + " ∠ " + n(C.ang(z), 1) + "°"; };

  var CURVES = { "IEC Standard Inverse (SI)": [0.14, 0.02], "IEC Very Inverse (VI)": [13.5, 1], "IEC Extremely Inverse (EI)": [80, 2], "IEC Long-Time Inverse (LTI)": [120, 1], "Definite Time (DT)": null };
  var CURVE_NAMES = Object.keys(CURVES);
  function relayTime(curve, I, Is, tms, inst, tinst) {
    if (inst > 0 && I >= inst) return tinst;
    var M = I / Is;
    if (M <= 1.0) return Infinity;
    var c = CURVES[curve];
    if (!c) return tms; // definite time: TMS field holds the delay in seconds
    return tms * c[0] / (Math.pow(M, c[1]) - 1);
  }
  var kappa = function (rx) { return 1.02 + 0.98 * Math.exp(-3 * rx); };

  function phasorSvg(sets, opt) {
    // sets: [{title, ph:[{z:[re,im], cls, l}]}] drawn side by side
    var W = 160, H = 170, s = '<svg class="ee-svg ps-ph" viewBox="0 0 ' + W * sets.length + " " + H + '" role="img" aria-label="แผนภาพเฟสเซอร์">';
    var mx = 1e-9; sets.forEach(function (st) { st.ph.forEach(function (p) { mx = Math.max(mx, C.abs(p.z)); }); });
    sets.forEach(function (st, i) {
      var cx = W * i + W / 2, cy = 92, R = 58, k = R / mx;
      s += '<circle class="gr" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none"/><line class="gr" x1="' + (cx - R - 6) + '" x2="' + (cx + R + 6) + '" y1="' + cy + '" y2="' + cy + '"/><line class="gr" x1="' + cx + '" x2="' + cx + '" y1="' + (cy - R - 6) + '" y2="' + (cy + R + 6) + '"/>';
      s += '<text class="al" x="' + cx + '" y="16" text-anchor="middle">' + st.title + "</text>";
      st.ph.forEach(function (p) {
        var x = cx + p.z[0] * k, y = cy - p.z[1] * k, L = C.abs(p.z) * k;
        if (L < 0.5) { s += '<circle class="dot" cx="' + cx + '" cy="' + cy + '" r="2.5"/>'; return; }
        var ang = Math.atan2(cy - y, x - cx), ah = Math.min(8, L * 0.4);
        var hx1 = x - ah * Math.cos(ang - 0.4), hy1 = y + ah * Math.sin(ang - 0.4), hx2 = x - ah * Math.cos(ang + 0.4), hy2 = y + ah * Math.sin(ang + 0.4);
        s += '<line class="' + p.cls + ' thick" x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><path class="' + p.cls.replace("s", "f") + '" d="M' + x.toFixed(1) + "," + y.toFixed(1) + "L" + hx1.toFixed(1) + "," + hy1.toFixed(1) + "L" + hx2.toFixed(1) + "," + hy2.toFixed(1) + 'Z"/>';
        s += '<text class="ml sm" x="' + (x + 8 * Math.cos(ang)).toFixed(1) + '" y="' + (y - 8 * Math.sin(ang) + 4).toFixed(1) + '" text-anchor="middle">' + p.l + "</text>";
      });
    });
    return s + "</svg>";
  }

  var CALC = {
    pu: {
      t: "ค่าฐานและค่าต่อหน่วย (per-unit)", ref: "U1–U4",
      ins: [["sb", "กำลังฐาน S_base (3 เฟส)", "MVA", "100"], ["vb", "แรงดันฐาน V_base (line-line)", "kV", "22"], ["z", "อิมพีแดนซ์จริง (ต่อเฟส)", "Ω", "4.84"], ["i", "กระแสจริง", "A", "1000"], ["v", "แรงดันจริง", "kV", "21.5"], ["s", "กำลังจริง", "MVA", "8"]],
      f: function (x) {
        var zb = x.vb * x.vb / x.sb, ib = x.sb * 1e6 / (R3 * x.vb * 1e3);
        return { rows: [["Z_base = V_base² / S_base", sig(zb, 4) + " Ω"], ["I_base = S_base / (√3 V_base)", sig(ib, 4) + " A"], ["Z (pu)", sig(x.z / zb, 4) + " pu"], ["I (pu)", sig(x.i / ib, 4) + " pu"],
          ["V (pu)", sig(x.v / x.vb, 4) + " pu"], ["S (pu)", sig(x.s / x.sb, 4) + " pu"]], note: "ค่าฐานเลือกได้อิสระสองตัว (นิยม S_base และ V_base) อีกสองตัวคำนวณตาม ทุกโซนแรงดันใช้ S_base เดียวกัน V_base เปลี่ยนตามอัตราส่วนหม้อแปลง" };
      }
    },
    base: {
      t: "เปลี่ยนฐานอิมพีแดนซ์ (change of base)", ref: "U5",
      ins: [["z", "อิมพีแดนซ์บนฐานเดิม (เช่น %Z ÷ 100)", "pu", "0.06"], ["so", "S ฐานเดิม (พิกัดอุปกรณ์)", "MVA", "1"], ["vo", "V ฐานเดิม", "kV", "22"], ["sn", "S ฐานใหม่", "MVA", "100"], ["vn", "V ฐานใหม่", "kV", "22"]],
      f: function (x) {
        var zn = x.z * (x.sn / x.so) * Math.pow(x.vo / x.vn, 2);
        return { rows: [["Z_new = Z_old (S_new/S_old)(V_old/V_new)²", "<b>" + sig(zn, 4) + " pu</b>"], ["ตรวจเป็นโอห์มที่ฐานเดิม", sig(x.z * x.vo * x.vo / x.so, 4) + " Ω"], ["ตรวจเป็นโอห์มที่ฐานใหม่", sig(zn * x.vn * x.vn / x.sn, 4) + " Ω"]] };
      }
    },
    fault: {
      t: "กระแสลัดวงจรระบบแรงต่ำ: แหล่งจ่าย + หม้อแปลง + สายเคเบิล", ref: "F1–F9",
      ins: [["ssc", "กำลังลัดวงจรของระบบ MV ต้นทาง", "MVA", "500"], ["xrs", "X/R ของต้นทาง", "", "10"], ["kva", "หม้อแปลง", "kVA", "1000"], ["zt", "%Z หม้อแปลง", "%", "6"], ["xrt", "X/R หม้อแปลง", "", "6"],
        ["un", "แรงดันแรงต่ำ (line-line)", "V", "400"], ["l", "ความยาวสายถึงจุดลัดวงจร", "m", "30"], ["a", "ขนาดสายต่อเฟส", "mm²", "240"], ["np", "จำนวนสายขนานต่อเฟส", "", "2"], ["xl", "รีแอกแตนซ์สาย", "mΩ/m", "0.08"], ["c", "ตัวคูณแรงดัน c", "", "1.05"]],
      f: function (x) {
        var u2 = x.un * x.un;
        var zs = x.c * u2 / (x.ssc * 1e6), rs = zs / Math.sqrt(1 + x.xrs * x.xrs), Xs = rs * x.xrs;
        var zt = (x.zt / 100) * u2 / (x.kva * 1e3), rt = zt / Math.sqrt(1 + x.xrt * x.xrt), Xt = rt * x.xrt;
        var rc = 0.018 * x.l / x.a / x.np, Xc = x.xl * 1e-3 * x.l / x.np;
        var Rtr = rs + rt, Xtr = Xs + Xt, Rall = Rtr + rc, Xall = Xtr + Xc;
        var ik = function (r, X) { return x.c * x.un / (R3 * Math.hypot(r, X)); };
        var ik0 = ik(Rtr, Xtr), ik1 = ik(Rall, Xall), rx0 = Rtr / Xtr, rx1 = Rall / Xall;
        var ip0 = kappa(rx0) * Math.SQRT2 * ik0, ip1 = kappa(rx1) * Math.SQRT2 * ik1;
        var iE = x.c * x.un / R3 / Math.hypot(Rtr + 2 * rc, Xtr + 2 * Xc);
        var mva = 1 / (1 / x.ssc + 1 / (x.kva / 1000 / (x.zt / 100)));
        var itx = x.kva * 1e3 / (R3 * x.un);
        return { rows: [["Z ต้นทาง (อ้างอิงฝั่งแรงต่ำ)", sig(zs * 1e3, 3) + " mΩ"], ["Z หม้อแปลง", sig(zt * 1e3, 3) + " mΩ (R " + sig(rt * 1e3, 3) + ", X " + sig(Xt * 1e3, 3) + ")"],
          ["Z สาย (R, X)", sig(rc * 1e3, 3) + " + j" + sig(Xc * 1e3, 3) + " mΩ"], ["กระแสพิกัดหม้อแปลง", n(itx, 0) + " A"],
          ["—", "ที่ขั้วแรงต่ำหม้อแปลง (ตู้ MDB)"], ["I″k3 สมมาตร", "<b>" + n(ik0 / 1e3, 1) + " kA</b>"], ["X/R · κ", n(1 / rx0, 2) + " · " + n(kappa(rx0), 2)], ["ค่ายอด i_p", n(ip0 / 1e3, 1) + " kA"], ["วิธี MVA (ไม่คิด c)", n(mva, 2) + " MVA → " + n(mva * 1e6 / (R3 * x.un) / 1e3, 1) + " kA"],
          ["—", "ที่ปลายสาย " + x.l + " m"], ["I″k3 สมมาตร", "<b>" + n(ik1 / 1e3, 1) + " kA</b>"], ["ค่ายอด i_p", n(ip1 / 1e3, 1) + " kA"], ["ลัดลงดิน 1 เฟส (วงรอบ L-PE โดยประมาณ)", n(iE / 1e3, 1) + " kA"],
          ["เบรกเกอร์ต้องมี Icu/Ics ≥", n(Math.ceil(ik0 / 1e3 / 5) * 5, 0) + " kA ที่ MDB"]],
          note: "สายทองแดง ρ = 0.018 Ω·mm²/m (20 °C ให้กระแสสูงสุด) ลัดลงดินคิด PE ขนาดเท่าสายเฟสและหม้อแปลง Dyn (Z0 ≈ Z1) การคำนวณเพื่อเลือกพิกัดตัดกระแสใช้ค่าสูงสุด ส่วนการตรวจว่าอุปกรณ์ตัดทันใช้ค่าต่ำสุด (c = 0.95 สายร้อน)" };
      }
    },
    ufault: {
      t: "กระแสลัดวงจรสมมาตรและไม่สมมาตรด้วยองค์ประกอบสมมาตร", ref: "S5–S9",
      ins: [["e", "แรงดันก่อนเกิดเหตุ E", "pu", "1.0"], ["x1", "X1 (ลำดับบวก)", "pu", "0.25"], ["x2", "X2 (ลำดับลบ)", "pu", "0.25"], ["x0", "X0 (ลำดับศูนย์)", "pu", "0.15"], ["zf", "อิมพีแดนซ์ฟอลต์ R_f", "pu", "0"],
        ["sb", "S_base", "MVA", "100"], ["vb", "V_base ที่จุดเกิดเหตุ", "kV", "22"]],
      f: function (x) {
        var ib = x.sb * 1e6 / (R3 * x.vb * 1e3), Z1 = [0, x.x1], Z2 = [0, x.x2], Z0 = [0, x.x0], Zf = [x.zf, 0], E = [x.e, 0];
        var i3 = C.abs(C.div(E, C.add(Z1, Zf)));
        var ia1 = C.div(E, C.add(C.add(Z1, Z2), C.add(Z0, C.sc(Zf, 3)))), slg = 3 * C.abs(ia1);
        var ll1 = C.div(E, C.add(C.add(Z1, Z2), Zf)), ll = R3 * C.abs(ll1);
        var z0f = C.add(Z0, C.sc(Zf, 3)), par = C.div(C.mul(Z2, z0f), C.add(Z2, z0f)), d1 = C.div(E, C.add(Z1, par));
        var d2 = C.sc(C.div(C.mul(d1, z0f), C.add(Z2, z0f)), -1), d0 = C.sc(C.div(C.mul(d1, Z2), C.add(Z2, z0f)), -1);
        var ibD = C.add(C.add(d0, C.mul(A2, d1)), C.mul(A, d2)), icD = C.add(C.add(d0, C.mul(A, d1)), C.mul(A2, d2)), ig = 3 * C.abs(d0);
        var kA = function (pu) { return n(pu, 3) + " pu = " + n(pu * ib / 1e3, 2) + " kA"; };
        return { rows: [["I_base", n(ib, 0) + " A"], ["สามเฟสสมดุล (3φ) I = E/Z1", kA(i3)], ["ลงดินหนึ่งเฟส (SLG) I = 3E/(Z1+Z2+Z0+3Zf)", kA(slg)], ["ระหว่างสายสองเฟส (LL) I = √3E/(Z1+Z2)", kA(ll)],
          ["สองเฟสลงดิน (DLG) I_b, I_c", kA(C.abs(ibD)) + " , " + n(C.abs(icD), 3) + " pu"], ["DLG กระแสลงดิน 3I0", kA(ig)], ["SLG ÷ 3φ", n(slg / i3, 2) + (slg > i3 ? " — ลงดินรุนแรงกว่าสามเฟส" : "")]],
          note: "สมมติอิมพีแดนซ์เป็นรีแอกแตนซ์ล้วน (ระบบแรงสูงมี X/R สูง) กระแส LL ของระบบที่ Z1 = Z2 เท่ากับ √3/2 ≈ 0.866 ของ 3φ เสมอ ถ้า X0 < X1 การลัดลงดินหนึ่งเฟสจะรุนแรงกว่าสามเฟส" };
      }
    },
    seq: {
      t: "แยกองค์ประกอบสมมาตร: I_a I_b I_c → I_0 I_1 I_2", ref: "S1–S4",
      ins: [["am", "|I_a|", "A", "100"], ["aa", "∠I_a", "°", "0"], ["bm", "|I_b|", "A", "80"], ["ba", "∠I_b", "°", "-110"], ["cm", "|I_c|", "A", "60"], ["ca", "∠I_c", "°", "130"]],
      f: function (x) {
        var a = C.pol(x.am, x.aa), b = C.pol(x.bm, x.ba), c = C.pol(x.cm, x.ca);
        var i0 = C.sc(C.add(C.add(a, b), c), 1 / 3), i1 = C.sc(C.add(C.add(a, C.mul(A, b)), C.mul(A2, c)), 1 / 3), i2 = C.sc(C.add(C.add(a, C.mul(A2, b)), C.mul(A, c)), 1 / 3);
        var svg = phasorSvg([{ title: "เดิม I_a I_b I_c", ph: [{ z: a, cls: "s1", l: "a" }, { z: b, cls: "s2", l: "b" }, { z: c, cls: "s3", l: "c" }] },
          { title: "ลำดับบวก", ph: [{ z: i1, cls: "s1", l: "a1" }, { z: C.mul(A2, i1), cls: "s2", l: "b1" }, { z: C.mul(A, i1), cls: "s3", l: "c1" }] },
          { title: "ลำดับลบ", ph: [{ z: i2, cls: "s1", l: "a2" }, { z: C.mul(A, i2), cls: "s2", l: "b2" }, { z: C.mul(A2, i2), cls: "s3", l: "c2" }] },
          { title: "ลำดับศูนย์", ph: [{ z: i0, cls: "s1", l: "0" }] }]);
        return { rows: [["I_0 = (I_a + I_b + I_c)/3", fmtC(i0, 2) + " A"], ["I_1 = (I_a + aI_b + a²I_c)/3", fmtC(i1, 2) + " A"], ["I_2 = (I_a + a²I_b + aI_c)/3", fmtC(i2, 2) + " A"],
          ["กระแสนิวทรัล/ลงดิน 3I_0", n(3 * C.abs(i0), 2) + " A"], ["ความไม่สมดุล |I_2|/|I_1|", n(C.abs(i2) / C.abs(i1) * 100, 1) + " %"]], svg: svg };
      }
    },
    reg: {
      t: "หม้อแปลง: แรงดันตก (regulation) และแรงดันด้านโหลด", ref: "L2–L4",
      ins: [["kva", "พิกัดหม้อแปลง", "kVA", "1000"], ["zt", "%Z", "%", "6"], ["xrt", "X/R", "", "6"], ["p", "โหลด", "kW", "700"], ["pf", "เพาเวอร์แฟกเตอร์ (ตามหลัง)", "", "0.8"], ["vn", "แรงดันไร้โหลด", "V", "416"]],
      f: function (x) {
        var r = x.zt / Math.sqrt(1 + x.xrt * x.xrt), X = r * x.xrt, s = x.p / x.pf, ld = s / x.kva, phi = Math.acos(Math.min(1, x.pf));
        var reg = ld * (r * x.pf + X * Math.sin(phi)) + Math.pow(ld * (X * x.pf - r * Math.sin(phi)), 2) / 200;
        var cu = Math.pow(ld, 2) * r / 100 * x.kva;
        return { rows: [["%R · %X", n(r, 2) + " % · " + n(X, 2) + " %"], ["ภาระ", n(s, 0) + " kVA = " + n(ld * 100, 0) + " % ของพิกัด"], ["Regulation ≈ %R cos φ + %X sin φ", "<b>" + n(reg, 2) + " %</b>"],
          ["แรงดันด้านโหลด", n(x.vn * (1 - reg / 100), 1) + " V"], ["การสูญเสียในขดลวด (copper loss)", n(cu, 1) + " kW"], ["ถ้า PF = 1 regulation", n(ld * x.pf * r + Math.pow(ld * x.pf * X, 2) / 200, 2) + " %"]],
          note: "PF ต่ำทำให้แรงดันตกมากขึ้นเพราะพจน์ %X sin φ ใหญ่ — นี่คือเหตุผลหนึ่งที่การไฟฟ้าต้องการให้ผู้ใช้ไฟปรับปรุงเพาเวอร์แฟกเตอร์" };
      }
    },
    pd: {
      t: "การส่งกำลังระหว่างสองบัส: กราฟ P-δ", ref: "L6–L8",
      ins: [["v1", "แรงดันต้นทาง V_s", "pu", "1.0"], ["v2", "แรงดันปลายทาง V_r", "pu", "1.0"], ["x", "รีแอกแตนซ์รวม X", "pu", "0.5"], ["p", "กำลังที่ต้องส่ง P", "pu", "1.0"]],
      f: function (x) {
        var pm = x.v1 * x.v2 / x.x, sd = x.p / pm;
        var pts = []; for (var d = 0; d <= 180; d += 2) pts.push([d, pm * Math.sin(d * D2R)]);
        var top = K.niceTicks(pm * 1.1, 4);
        if (sd > 1) return { rows: [["P_max = V_sV_r / X", n(pm, 3) + " pu"], ["ผล", warn("ส่งไม่ได้ — P เกิน P_max ระบบจะสูญเสียเสถียรภาพ")]],
          svg: K.chart({ w: 640, h: 250, xs: [0, 180], ys: [0, top.top], xt: [0, 30, 60, 90, 120, 150, 180], yt: top.ticks, xl: "มุมกำลัง δ (องศา)", yl: "P (pu)", series: [{ cls: "s1 thick", pts: pts }], hlines: [{ y: x.p, cls: "hl red", label: "P ที่ต้องการ" }] }) };
        var del = Math.asin(sd) / D2R, q1 = (x.v1 * x.v1 - x.v1 * x.v2 * Math.cos(del * D2R)) / x.x, q2 = (x.v1 * x.v2 * Math.cos(del * D2R) - x.v2 * x.v2) / x.x;
        var svg = K.chart({ w: 640, h: 250, xs: [0, 180], ys: [0, top.top], xt: [0, 30, 60, 90, 120, 150, 180], yt: top.ticks, xl: "มุมกำลัง δ (องศา)", yl: "P (pu)", label: "กราฟกำลังกับมุม",
          series: [{ cls: "s1 thick", pts: pts }], hlines: [{ y: x.p, cls: "hl dsh", label: "P = " + x.p }],
          marks: [{ x: del, y: x.p, label: "จุดทำงานเสถียร δ = " + n(del, 1) + "°" }, { x: 180 - del, y: x.p, cls: "dot2", label: "ไม่เสถียร", anchor: "end", dx: -8 }, { x: 90, y: pm, cls: "dot2", label: "P_max", dy: 16 }] });
        return { rows: [["P_max = V_sV_r / X", n(pm, 3) + " pu"], ["มุมกำลัง δ = sin⁻¹(PX / V_sV_r)", "<b>" + n(del, 1) + "°</b>"], ["ส่วนเผื่อเสถียรภาพสถิต (P_max − P)/P_max", n((1 - sd) * 100, 0) + " %"],
          ["Q ที่ต้นทางส่งออก", n(q1, 3) + " pu"], ["Q ที่ปลายทางได้รับ", n(q2, 3) + " pu"], ["รีแอกทีฟที่สายกินเอง I²X", n(q1 - q2, 3) + " pu"]], svg: svg,
          note: "P ขึ้นกับมุม δ ส่วน Q ขึ้นกับผลต่างขนาดแรงดันเป็นหลัก — หลักการแยก P-f และ Q-V ในการควบคุมระบบไฟฟ้า" };
      }
    },
    earth: {
      t: "การตัดวงจรอัตโนมัติเมื่อลัดลงดิน: อิมพีแดนซ์วงรอบ Z_s และแรงดันสัมผัส", ref: "E3–E8",
      ins: [["sys", "ระบบการต่อลงดิน", "sel", "TN-C-S", ["TN-C-S", "TT"]], ["u0", "แรงดันเฟส U0", "V", "230"], ["ze", "Z_e ภายนอก (TN) ", "Ω", "0.35"], ["ra", "R_A หลักดินผู้ใช้ไฟ (TT)", "Ω", "5"], ["rb", "R_B หลักดินหม้อแปลง (TT)", "Ω", "2"],
        ["dev", "อุปกรณ์ป้องกัน", "sel", "MCB C", ["MCB B", "MCB C", "MCB D", "RCD 30 mA"]], ["in", "พิกัด I_n", "A", "32"], ["a1", "สายเฟส", "mm²", "6"], ["a2", "สายดิน (PE)", "mm²", "4"], ["l", "ความยาวสาย", "m", "30"]],
      f: function (x) {
        var rho = 0.0206, r1 = rho * x.l / x.a1, r2 = rho * x.l / x.a2, k = { "MCB B": 5, "MCB C": 10, "MCB D": 20 }[x.dev], rcd = x.dev === "RCD 30 mA";
        var ia = rcd ? 0.03 * 5 : k * x.in, zs, ifault, ut;
        if (x.sys === "TT") { zs = x.ra + x.rb + r1 + r2; ifault = x.u0 / zs; ut = ifault * (x.ra + r2); }
        else { zs = x.ze + r1 + r2; ifault = x.u0 / zs; ut = ifault * r2; }
        var trip = ifault >= ia, lmax = x.sys === "TT" ? NaN : (x.u0 / ia - x.ze) / (rho / x.a1 + rho / x.a2);
        var rows = [["R1 + R2 ของสาย (70 °C)", n((r1 + r2) * 1e3, 0) + " mΩ"], ["Z_s ทั้งวงรอบ", n(zs, 3) + " Ω"], ["กระแสลัดลงดิน I_f = U0/Z_s", n(ifault, 0) + " A"],
          ["กระแสที่ทำให้ตัดทันที I_a", n(ia, rcd ? 2 : 0) + " A" + (rcd ? " (5 × IΔn)" : " (" + k + " × I_n)")], ["ตัดวงจรภายใน 0.4 s", ok(trip, trip ? "ได้" : "ไม่ได้ — ต้องเพิ่มขนาดสาย/ใช้ RCD")],
          ["แรงดันสัมผัสขณะเกิดเหตุ", ut > 50 ? warn(n(ut, 0) + " V > 50 V ต้องตัดเร็ว") : ok(true, n(ut, 0) + " V")]];
        if (x.sys === "TT") rows.push(["เงื่อนไข TT: R_A × IΔn ≤ 50 V", rcd ? ok(x.ra * 0.03 <= 50, n(x.ra * 0.03, 2) + " V") : warn("ระบบ TT ต้องมี RCD")]);
        else rows.push(["ความยาวสายสูงสุดที่ยังตัดทัน", isFinite(lmax) && lmax > 0 ? n(lmax, 0) + " m" : "—"]);
        return { rows: rows, note: "ค่า Z_e ของระบบ TN-C-S ในเขตเมืองมักอยู่ราว 0.2–0.8 Ω วัดจริงด้วยเครื่องวัด loop impedance ระบบ TT กระแสลัดลงดินมีแค่หลักสิบแอมป์ เบรกเกอร์ธรรมดาไม่ตัด จึงต้องพึ่ง RCD" };
      }
    },
    diff: {
      t: "รีเลย์ผลต่าง 87 แบบเปอร์เซ็นต์ไบแอส (dual slope)", ref: "D1–D4",
      ins: [["i1", "กระแสเข้าโซน (pu ของแทป)", "pu", "1.0"], ["i2", "กระแสออกจากโซน", "pu", "0.92"], ["is1", "Is1 กระแสตั้งขั้นต่ำ", "pu", "0.2"], ["k1", "ความชัน k1", "%", "30"], ["is2", "จุดหักเปลี่ยนความชัน Is2", "pu", "2"], ["k2", "ความชัน k2", "%", "80"]],
      f: function (x) {
        var k1 = x.k1 / 100, k2 = x.k2 / 100, thr = function (ir) { return ir <= x.is2 ? Math.max(x.is1, k1 * ir) : Math.max(x.is1, k1 * x.is2 + k2 * (ir - x.is2)); };
        var id = Math.abs(x.i1 - x.i2), ir = (Math.abs(x.i1) + Math.abs(x.i2)) / 2, tr = id > thr(ir);
        var mx = Math.max(6, ir * 1.3), pts = []; for (var r = 0; r <= mx; r += mx / 120) pts.push([r, thr(r)]);
        var yt = K.niceTicks(Math.max(thr(mx), id) * 1.1, 5);
        var svg = K.chart({ w: 640, h: 260, xs: [0, mx], ys: [0, yt.top], xt: K.niceTicks(mx, 6).ticks.filter(function (t) { return t <= mx; }), yt: yt.ticks, xl: "กระแสไบแอส I_r = (|I1| + |I2|)/2 (pu)", yl: "กระแสผลต่าง I_d (pu)", label: "คุณลักษณะรีเลย์ผลต่าง",
          series: [{ area: true, cls: "ee-trip", pts: pts.concat([[mx, yt.top], [0, yt.top]]), base: [] }, { cls: "s1 thick", pts: pts }],
          marks: [{ x: ir, y: id, cls: tr ? "dot red" : "dot ok", label: tr ? "ทริป" : "ไม่ทริป" }] });
        return { rows: [["I_d = |I1 − I2|", n(id, 3) + " pu"], ["I_r", n(ir, 3) + " pu"], ["ค่าที่ต้องเกิน", n(thr(ir), 3) + " pu"], ["ผล", tr ? warn("ทริป — ความผิดพร่องภายในโซน") : ok(true, "ไม่ทริป — ผลต่างอยู่ในพื้นที่ยอมรับ")]], svg: svg,
          note: "ผลต่างเล็กน้อยเกิดได้แม้ไม่มีฟอลต์ จาก CT ไม่ตรงกัน แทปเปลี่ยนแรงดัน และกระแสกระตุ้น ความชันจึงต้องเพิ่มตามกระแสผ่าน ลองลัดวงจรภายใน: I2 = 0 หรือ I2 ติดลบ (กระแสไหลเข้าจากสองฝั่ง)" };
      }
    },
    relay: {
      t: "เวลาทำงานของรีเลย์กระแสเกิน IDMT หนึ่งตัว", ref: "R2–R4",
      ins: [["curve", "กราฟ", "sel", CURVE_NAMES[0], CURVE_NAMES], ["ct", "อัตราส่วน CT (ปฐมภูมิ)", "A", "400"], ["ps", "Plug setting (สัดส่วนของ 1 A/5 A)", "×I_n", "1.0"], ["tms", "TMS (หรือเวลาหน่วงถ้า DT)", "", "0.1"], ["if", "กระแสฟอลต์ปฐมภูมิ", "A", "6000"]],
      f: function (x) {
        var is = x.ct * x.ps, M = x.if / is, t = relayTime(x.curve, x.if, is, x.tms, 0, 0), c = CURVES[x.curve];
        return { rows: [["กระแสตั้ง I_s (ปฐมภูมิ)", n(is, 0) + " A"], ["PSM = I_f / I_s", n(M, 2)], ["สมการ", c ? "t = TMS × " + c[0] + " / (PSM^" + c[1] + " − 1)" : "t = ค่าที่ตั้ง"], ["เวลาทำงาน", "<b>" + (isFinite(t) ? n(t, 3) + " s" : "ไม่ทำงาน (ต่ำกว่า pickup)") + "</b>"]] };
      }
    }
  };

  // ------------------------------------------------------------------ TCC coordination lab (log-log)
  function buildTCC(host) {
    var st = { If: +(host.getAttribute("data-if") || 10000), cti: 0.3, R: [
      { name: "R1 ป้อนโหลด (ปลายทาง)", curve: CURVE_NAMES[0], is: 200, tms: 0.1, inst: 0, ti: 0.05 },
      { name: "R2 เมนแรงต่ำ", curve: CURVE_NAMES[0], is: 600, tms: 0.2, inst: 0, ti: 0.05 },
      { name: "R3 ต้นทาง (อ้างอิงฝั่งแรงต่ำ)", curve: CURVE_NAMES[0], is: 1200, tms: 0.25, inst: 0, ti: 0.05 }] };
    var cls = ["s1", "s2", "s3"];
    host.innerHTML = '<p class="fc-t"><b>แล็บประสานรีเลย์กระแสเกิน 3 ระดับ (กราฟ TCC log-log)</b> <span class="mono">สูตร R1–R8</span></p>' +
      '<div class="ps-tcc-t table-wrap"><table><thead><tr><th>รีเลย์</th><th>กราฟ</th><th>I_s (A)</th><th>TMS / DT (s)</th><th>I&gt;&gt; ทันที (A, 0 = ปิด)</th></tr></thead><tbody>' +
      st.R.map(function (r, i) {
        return '<tr><th scope="row"><span class="ps-sw ' + cls[i] + '"></span>' + r.name + '</th><td><select data-i="' + i + '" data-k="curve">' + CURVE_NAMES.map(function (c) { return "<option" + (c === r.curve ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></td>" +
          '<td><input data-i="' + i + '" data-k="is" value="' + r.is + '" inputmode="decimal"></td><td><input data-i="' + i + '" data-k="tms" value="' + r.tms + '" inputmode="decimal"></td><td><input data-i="' + i + '" data-k="inst" value="' + r.inst + '" inputmode="decimal"></td></tr>';
      }).join("") + "</tbody></table></div>" +
      '<div class="fc-in"><label><span>กระแสลัดวงจรที่บัสปลายทาง (สูงสุด)</span><input data-g="If" value="' + st.If + '" inputmode="decimal"><i>A</i></label><label><span>ช่วงเวลาประสาน CTI ที่ต้องการ</span><input data-g="cti" value="' + st.cti + '" inputmode="decimal"><i>s</i></label></div>' +
      '<div class="pv-btns"><button type="button" class="btn btn-primary btn-sm" data-auto>คำนวณ TMS ของ R2 R3 ให้ได้ CTI อัตโนมัติ</button></div>' +
      '<div class="pv-fig"></div><dl class="fc-out"></dl><p class="pv-note">ทุกกระแสอ้างอิงที่ระดับแรงดันเดียวกัน (ฝั่งแรงต่ำ) รีเลย์ต้นทางต้องช้ากว่ารีเลย์ปลายทางอย่างน้อย CTI ที่ทุกค่ากระแสที่ทั้งคู่มองเห็น โดยเฉพาะที่กระแสลัดวงจรสูงสุด</p>';
    var q = function (s) { return host.querySelector(s); };
    Array.prototype.forEach.call(host.querySelectorAll("[data-i]"), function (el) {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () { var r = st.R[+el.getAttribute("data-i")], k = el.getAttribute("data-k"); r[k] = k === "curve" ? el.value : K.parse(el.value); draw(); });
    });
    Array.prototype.forEach.call(host.querySelectorAll("[data-g]"), function (el) { el.addEventListener("input", function () { st[el.getAttribute("data-g")] = K.parse(el.value); draw(); }); });
    q("[data-auto]").addEventListener("click", function () {
      for (var i = 1; i < 3; i++) {
        var r = st.R[i], tPrev = relayTime(st.R[i - 1].curve, st.If, st.R[i - 1].is, st.R[i - 1].tms, st.R[i - 1].inst, st.R[i - 1].ti), need = tPrev + st.cti;
        var unit = relayTime(r.curve, st.If, r.is, 1, 0, 0);
        if (isFinite(unit) && isFinite(need)) { r.tms = Math.ceil((CURVES[r.curve] ? need / unit : need) * 100) / 100; r.inst = 0; host.querySelector('[data-i="' + i + '"][data-k="tms"]').value = r.tms; host.querySelector('[data-i="' + i + '"][data-k="inst"]').value = 0; }
      }
      draw();
    });
    function draw() {
      var W = 680, H = 400, L = 60, Rm = 16, T = 30, B = 44, x0 = 1, x1 = 5, y0 = -2, y1 = 2; // log10 A 10..100k, log10 s 0.01..100
      var bad = st.R.some(function (r) { return !(r.is > 0) || !(r.tms > 0) || !isFinite(r.inst); }) || !(st.If > 0);
      if (bad) { q(".fc-out").innerHTML = "<dt>ใส่ตัวเลขให้ครบ</dt><dd>—</dd>"; return; }
      var X = function (a) { return L + (Math.log10(a) - x0) / (x1 - x0) * (W - L - Rm); }, Y = function (t) { return H - B - (Math.log10(t) - y0) / (y1 - y0) * (H - T - B); };
      var s = '<svg class="ee-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="กราฟเวลา-กระแสของรีเลย์">';
      for (var d = x0; d <= x1; d++) for (var m = 1; m < 10; m++) { var a = m * Math.pow(10, d); if (a > Math.pow(10, x1)) break; s += '<line class="gr' + (m === 1 ? "" : " gx") + '" x1="' + X(a).toFixed(1) + '" x2="' + X(a).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/>'; if (m === 1) s += '<text class="tk" x="' + X(a).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + (a >= 1000 ? a / 1000 + "k" : a) + "</text>"; }
      for (d = y0; d <= y1; d++) for (m = 1; m < 10; m++) { var tt = m * Math.pow(10, d); if (tt > Math.pow(10, y1)) break; s += '<line class="gr' + (m === 1 ? "" : " gx") + '" x1="' + L + '" x2="' + (W - Rm) + '" y1="' + Y(tt).toFixed(1) + '" y2="' + Y(tt).toFixed(1) + '"/>'; if (m === 1) s += '<text class="tk" x="' + (L - 6) + '" y="' + (Y(tt) + 4).toFixed(1) + '" text-anchor="end">' + tt + "</text>"; }
      s += '<text class="al" x="' + ((L + W - Rm) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">กระแส (A) สเกล log</text><text class="al" x="14" y="' + (H / 2) + '" transform="rotate(-90 14 ' + H / 2 + ')" text-anchor="middle">เวลาทำงาน (s) สเกล log</text>';
      var times = [];
      st.R.forEach(function (r, i) {
        var pts = [];
        for (var k = 0; k <= 300; k++) { var I = Math.pow(10, x0 + (x1 - x0) * k / 300), t = relayTime(r.curve, I, r.is, r.tms, r.inst, r.ti); if (isFinite(t) && t <= 100 && t >= 0.01) pts.push(X(I).toFixed(1) + "," + Y(t).toFixed(1)); }
        s += '<polyline class="' + cls[i] + ' thick" points="' + pts.join(" ") + '"/>';
        var tf = relayTime(r.curve, st.If, r.is, r.tms, r.inst, r.ti); times.push(tf);
        if (isFinite(tf) && tf >= 0.01 && tf <= 100) s += '<circle class="dot" cx="' + X(st.If).toFixed(1) + '" cy="' + Y(tf).toFixed(1) + '" r="4.5"/><text class="ml sm" x="' + (X(st.If) + 7).toFixed(1) + '" y="' + (Y(tf) + 4).toFixed(1) + '">' + n(tf, 2) + " s</text>";
      });
      if (st.If >= 10 && st.If <= 1e5) s += '<line class="hl red" x1="' + X(st.If).toFixed(1) + '" x2="' + X(st.If).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="ml sm" x="' + (X(st.If) - 4).toFixed(1) + '" y="' + (T + 12) + '" text-anchor="end">I_f = ' + n(st.If / 1000, 1) + " kA</text>";
      var lx = L; ["R1", "R2", "R3"].forEach(function (nm, i) { s += '<rect class="' + cls[i].replace("s", "f") + ' lg" x="' + lx + '" y="8" width="14" height="10" rx="2"/><text class="tk lgt" x="' + (lx + 18) + '" y="17">' + st.R[i].name + "</text>"; lx += 30 + st.R[i].name.length * 6.6; });
      q(".pv-fig").innerHTML = s + "</svg>";
      var c1 = times[1] - times[0], c2 = times[2] - times[1];
      q(".fc-out").innerHTML = [["เวลา R1 / R2 / R3 ที่ I_f", times.map(function (t) { return isFinite(t) ? n(t, 3) : "∞"; }).join(" / ") + " s"],
        ["CTI ระหว่าง R1 → R2", isFinite(c1) ? ok(c1 >= st.cti - 1e-9, n(c1, 3) + " s") : "—"], ["CTI ระหว่าง R2 → R3", isFinite(c2) ? ok(c2 >= st.cti - 1e-9, n(c2, 3) + " s") : "—"],
        ["PSM ของ R1 / R2 / R3", st.R.map(function (r) { return n(st.If / r.is, 1); }).join(" / ")], ["เวลากำจัดฟอลต์ถ้า R1 ไม่ทำงาน (สำรอง)", isFinite(times[1]) ? n(times[1], 2) + " s โดย R2" : "—"]]
        .map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    }
    draw();
  }

  K.calcs("data-ps", CALC, "ps");
  K.onReady(function () { Array.prototype.forEach.call(document.querySelectorAll(".ps-tcc"), buildTCC); });
  var api = { CALC: CALC, C: C, relayTime: relayTime, CURVES: CURVES, kappa: kappa };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PSCalc = api;
})(typeof window !== "undefined" ? window : globalThis);
