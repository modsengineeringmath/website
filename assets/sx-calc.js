/* Sensors & transducers — engineering engine + calculators for /learn/sensors-transducers/ — plain JS, needs assets/ee-kit.js first.
   Engine (window.SXCalc, module.exports in Node — copy to .cjs and set globalThis.EEKit first):
     cvd(t,R0) / cvdInv(R,R0)            IEC 60751 Callendar–Van Dusen (A, B, C of the standard)
     rtdTol(cls,t)                        IEC 60751 tolerance classes AA, A, B, C
     tcEmf(type,t) / tcTemp(type,mV)      NIST ITS-90 reference functions (SRD 60) for B E J K N R S T, reference junction 0 °C
     tcTol(type,cls,t)                    IEC 60584-1 tolerance class 1 / 2 (types J K N T E)
     ntcBeta / steinhart                  NTC thermistor models
     orifice(o)                           ISO 5167-2 orifice plate, Reader-Harris/Gallagher C, expansibility, pressure loss
     crc16(bytes)                         Modbus RTU CRC (poly 0xA001 reflected, init 0xFFFF)
     f32(…)                               float32 ↔ registers with the four byte orders
   Calculators: <div class="fg-calc sx-calc" data-sx="rtd|tc|cjc|ntc|ptx|orifice|reynolds|mag|ultra|vortex|hydro|dplevel|radar|usonic|tankvol|bridge|loadcell|encoder|shunt|ct|adc|loop|scale|fbseg|rs485|battery"></div>
   Any input can be preset with data-<key>; <button data-sx-fill="key" data-vals='{"k":"v"}'> refills one. */
(function (root) {
  "use strict";
  var K = root.EEKit;
  var n = K.n, sig = K.sig, ok = K.ok, warn = K.warn;
  var G = 9.80665, PI = Math.PI;

  // ------------------------------------------------------------------ RTD (IEC 60751)
  var A = 3.9083e-3, B = -5.775e-7, Cc = -4.183e-12;
  function cvd(t, R0) {
    R0 = R0 || 100;
    return R0 * (1 + A * t + B * t * t + (t < 0 ? Cc * (t - 100) * t * t * t : 0));
  }
  function cvdInv(R, R0) {
    R0 = R0 || 100;
    var t = (-A + Math.sqrt(A * A - 4 * B * (1 - R / R0))) / (2 * B);
    if (R >= R0) return t;
    for (var i = 0; i < 30; i++) { // Newton below 0 °C
      var f = cvd(t, R0) - R, h = 1e-4, d = (cvd(t + h, R0) - cvd(t - h, R0)) / (2 * h);
      t -= f / d; if (Math.abs(f) < 1e-10) break;
    }
    return t;
  }
  var RTD_CLS = { AA: [0.1, 0.0017], A: [0.15, 0.002], B: [0.3, 0.005], C: [0.6, 0.01] };
  function rtdTol(cls, t) { var c = RTD_CLS[cls] || RTD_CLS.B; return c[0] + c[1] * Math.abs(t); }

  // ------------------------------------------------------------------ thermocouples (NIST ITS-90, mV, °C)
  var TC = {B:[[0.0,630.615,[0.0,-0.00024650818346,5.9040421171e-6,-1.3257931636e-9,1.5668291901e-12,-1.694452924e-15,6.2990347094e-19],null],[630.615,1820.0,[-3.8938168621,0.02857174747,-8.4885104785e-5,1.5785280164e-7,-1.6835344864e-10,1.1109794013e-13,-4.4515431033e-17,9.8975640821e-21,-9.3791330289e-25],null]],E:[[-270.0,0.0,[0.0,0.058665508708,4.5410977124e-5,-7.7998048686e-7,-2.5800160843e-8,-5.9452583057e-10,-9.3214058667e-12,-1.0287605534e-13,-8.0370123621e-16,-4.3979497391e-18,-1.6414776355e-20,-3.9673619516e-23,-5.5827328721e-26,-3.4657842013e-29],null],[0.0,1000.0,[0.0,0.05866550871,4.5032275582e-5,2.8908407212e-8,-3.3056896652e-10,6.502440327e-13,-1.9197495504e-16,-1.2536600497e-18,2.1489217569e-21,-1.4388041782e-24,3.5960899481e-28],null]],J:[[-210.0,760.0,[0.0,0.050381187815,3.047583693e-5,-8.568106572e-8,1.3228195295e-10,-1.7052958337e-13,2.0948090697e-16,-1.2538395336e-19,1.5631725697e-23],null],[760.0,1200.0,[296.45625681,-1.4976127786,0.0031787103924,-3.1847686701e-6,1.5720819004e-9,-3.0691369056e-13],null]],K:[[-270.0,0.0,[0.0,0.039450128025,2.3622373598e-5,-3.2858906784e-7,-4.9904828777e-9,-6.7509059173e-11,-5.7410327428e-13,-3.1088872894e-15,-1.0451609365e-17,-1.9889266878e-20,-1.6322697486e-23],null],[0.0,1372.0,[-0.017600413686,0.038921204975,1.8558770032e-5,-9.9457592874e-8,3.1840945719e-10,-5.6072844889e-13,5.6075059059e-16,-3.2020720003e-19,9.7151147152e-23,-1.2104721275e-26],[0.1185976,-0.0001183432,126.9686]]],N:[[-270.0,0.0,[0.0,0.026159105962,1.0957484228e-5,-9.3841111554e-8,-4.6412039759e-11,-2.6303357716e-12,-2.2653438003e-14,-7.6089300791e-17,-9.3419667835e-20],null],[0.0,1300.0,[0.0,0.025929394601,1.571014188e-5,4.3825627237e-8,-2.5261169794e-10,6.4311819339e-13,-1.0063471519e-15,9.9745338992e-19,-6.0863245607e-22,2.0849229339e-25,-3.0682196151e-29],null]],R:[[-50.0,1064.18,[0.0,0.00528961729765,1.39166589782e-5,-2.38855693017e-8,3.56916001063e-11,-4.62347666298e-14,5.00777441034e-17,-3.73105886191e-20,1.57716482367e-23,-2.81038625251e-27],null],[1064.18,1664.5,[2.95157925316,-0.00252061251332,1.59564501865e-5,-7.64085947576e-9,2.05305291024e-12,-2.93359668173e-16],null],[1664.5,1768.1,[152.232118209,-0.268819888545,0.000171280280471,-3.45895706453e-8,-9.34633971046e-15],null]],S:[[-50.0,1064.18,[0.0,0.00540313308631,1.2593428974e-5,-2.32477968689e-8,3.22028823036e-11,-3.31465196389e-14,2.55744251786e-17,-1.25068871393e-20,2.71443176145e-24],null],[1064.18,1664.5,[1.32900444085,0.00334509311344,6.54805192818e-6,-1.64856259209e-9,1.29989605174e-14],null],[1664.5,1768.1,[146.628232636,-0.258430516752,0.000163693574641,-3.30439046987e-8,-9.43223690612e-15],null]],T:[[-270.0,0.0,[0.0,0.038748106364,4.4194434347e-5,1.1844323105e-7,2.0032973554e-8,9.0138019559e-10,2.2651156593e-11,3.6071154205e-13,3.8493939883e-15,2.8213521925e-17,1.4251594779e-19,4.8768662286e-22,1.079553927e-24,1.3945027062e-27,7.9795153927e-31],null],[0.0,400.0,[0.0,0.038748106364,3.329222788e-5,2.0618243404e-7,-2.1882256846e-9,1.0996880928e-11,-3.0815758772e-14,4.547913529e-17,-2.7512901673e-20],null]]};
  function poly(c, x) { var s = 0; for (var i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; }
  function tcRange(type) { var s = TC[type]; return [s[0][0], s[s.length - 1][1]]; }
  function tcEmf(type, t) {
    var segs = TC[type];
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i];
      if (t >= g[0] - 1e-9 && t <= g[1] + 1e-9) {
        var v = poly(g[2], t);
        if (g[3]) v += g[3][0] * Math.exp(g[3][1] * (t - g[3][2]) * (t - g[3][2]));
        return v;
      }
    }
    return NaN;
  }
  function tcTemp(type, mV) {
    var r = tcRange(type), lo = type === "B" ? 50 : r[0], hi = r[1];
    if (!(mV >= tcEmf(type, lo) && mV <= tcEmf(type, hi))) return NaN;
    for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (tcEmf(type, m) < mV) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  // IEC 60584-1:2013 tolerance (°C) — [range lo, hi, fixed, k·|t|] for class 1 and 2
  var TC_TOL = {
    K: { 1: [-40, 1000, 1.5, 0.004], 2: [-40, 1200, 2.5, 0.0075] },
    N: { 1: [-40, 1000, 1.5, 0.004], 2: [-40, 1200, 2.5, 0.0075] },
    J: { 1: [-40, 750, 1.5, 0.004], 2: [-40, 750, 2.5, 0.0075] },
    T: { 1: [-40, 350, 0.5, 0.004], 2: [-40, 350, 1.0, 0.0075] },
    E: { 1: [-40, 800, 1.5, 0.004], 2: [-40, 900, 2.5, 0.0075] }
  };
  function tcTol(type, cls, t) {
    var r = TC_TOL[type] && TC_TOL[type][cls];
    if (!r || t < r[0] || t > r[1]) return NaN;
    return Math.max(r[2], r[3] * Math.abs(t));
  }
  var TC_INFO = {
    K: "NiCr–NiAl · ใช้มากที่สุด −200…1260 °C", J: "Fe–CuNi · บรรยากาศรีดิวซ์ ≤ 750 °C", T: "Cu–CuNi · อุณหภูมิต่ำ −200…350 °C",
    N: "NiCrSi–NiSi · เสถียรกว่า K ที่อุณหภูมิสูง", E: "NiCr–CuNi · ความไวสูงสุด ~68 µV/°C", R: "Pt13Rh–Pt · โลหะมีค่า ≤ 1480 °C",
    S: "Pt10Rh–Pt · โลหะมีค่า ≤ 1480 °C", B: "Pt30Rh–Pt6Rh · สูงถึง 1700 °C emf ใกล้ศูนย์ต่ำกว่า 50 °C"
  };

  // ------------------------------------------------------------------ thermistor
  function ntcBeta(R25, beta, tC) { var T = tC + 273.15; return R25 * Math.exp(beta * (1 / T - 1 / 298.15)); }
  function ntcBetaInv(R25, beta, R) { return 1 / (1 / 298.15 + Math.log(R / R25) / beta) - 273.15; }
  function steinhart(a, b, c, R) { var L = Math.log(R); return 1 / (a + b * L + c * L * L * L) - 273.15; }

  // ------------------------------------------------------------------ ISO 5167-2 orifice plate
  function orificeC(beta, Dmm, Re, tap) {
    var L1 = 0, L2 = 0;
    if (tap === "flange") { L1 = L2 = 25.4 / Dmm; } else if (tap === "D-D/2") { L1 = 1; L2 = 0.47; }
    var M2 = 2 * L2 / (1 - beta), Aa = Math.pow(19000 * beta / Re, 0.8), b4 = Math.pow(beta, 4);
    var C = 0.5961 + 0.0261 * beta * beta - 0.216 * Math.pow(beta, 8) + 0.000521 * Math.pow(1e6 * beta / Re, 0.7) +
      (0.0188 + 0.0063 * Aa) * Math.pow(beta, 3.5) * Math.pow(1e6 / Re, 0.3) +
      (0.043 + 0.080 * Math.exp(-10 * L1) - 0.123 * Math.exp(-7 * L1)) * (1 - 0.11 * Aa) * b4 / (1 - b4) -
      0.031 * (M2 - 0.8 * Math.pow(M2, 1.1)) * Math.pow(beta, 1.3);
    if (Dmm < 71.12) C += 0.011 * (0.75 - beta) * (2.8 - Dmm / 25.4);
    return C;
  }
  // o: {D,d (m), dp (Pa), rho, mu (Pa·s), tap, gas:bool, p1 (Pa abs), kappa}
  function orifice(o) {
    var beta = o.d / o.D, b4 = Math.pow(beta, 4), E = 1 / Math.sqrt(1 - b4);
    var eps = 1;
    if (o.gas) eps = 1 - (0.351 + 0.256 * b4 + 0.93 * Math.pow(beta, 8)) * (1 - Math.pow((o.p1 - o.dp) / o.p1, 1 / o.kappa));
    var Ad = PI / 4 * o.d * o.d, C = 0.6, qm = 0, Re = 1e5;
    for (var i = 0; i < 60; i++) {
      qm = C * E * eps * Ad * Math.sqrt(2 * o.dp * o.rho);
      Re = 4 * qm / (PI * o.mu * o.D);
      var Cn = orificeC(beta, o.D * 1000, Re, o.tap);
      if (Math.abs(Cn - C) < 1e-12) { C = Cn; break; }
      C = Cn;
    }
    qm = C * E * eps * Ad * Math.sqrt(2 * o.dp * o.rho);
    var s = Math.sqrt(1 - b4 * (1 - C * C)), loss = (s - C * beta * beta) / (s + C * beta * beta) * o.dp;
    return { beta: beta, C: C, E: E, eps: eps, qm: qm, qv: qm / o.rho, Re: Re, v: qm / o.rho / (PI / 4 * o.D * o.D), loss: loss };
  }

  // ------------------------------------------------------------------ Modbus helpers
  function crc16(bytes) {
    var crc = 0xffff;
    for (var i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] & 0xff;
      for (var j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
    }
    return crc; // low byte is sent first
  }
  function hex(b, w) { var s = b.toString(16).toUpperCase(); while (s.length < (w || 2)) s = "0" + s; return s; }
  // float32 → bytes ABCD (big-endian IEEE 754)
  function f32bytes(v) { var b = new ArrayBuffer(4), dv = new DataView(b); dv.setFloat32(0, v, false); return [dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)]; }
  function bytesf32(a) { var b = new ArrayBuffer(4), dv = new DataView(b); for (var i = 0; i < 4; i++) dv.setUint8(i, a[i]); return dv.getFloat32(0, false); }
  var ORDERS = { ABCD: [0, 1, 2, 3], CDAB: [2, 3, 0, 1], BADC: [1, 0, 3, 2], DCBA: [3, 2, 1, 0] };
  function reorder(a, ord) { var p = ORDERS[ord]; return [a[p[0]], a[p[1]], a[p[2]], a[p[3]]]; }

  // ------------------------------------------------------------------ chart helpers
  function lin(lo, hi, N) { var a = []; for (var i = 0; i <= N; i++) a.push(lo + (hi - lo) * i / N); return a; }
  function autoChart(o) {
    var xr = K.rangeTicks(o.xs[0], o.xs[1], o.nx || 6), yr = K.rangeTicks(o.ys[0], o.ys[1], o.ny || 5);
    o.xs = [xr.lo, xr.hi]; o.ys = [yr.lo, yr.hi]; o.xt = xr.ticks; o.yt = yr.ticks;
    return K.chart(o);
  }
  var pct = function (v, d) { return n(v, d == null ? 2 : d) + " %"; };

  // ------------------------------------------------------------------ calculators
  var CALC = {
    rtd: {
      t: "RTD Pt100 / Pt1000: อุณหภูมิ ↔ ความต้านทาน การต่อสาย และเกรดความคลาด", ref: "T1–T4",
      ins: [["t", "อุณหภูมิ", "°C", "100"], ["r0", "R₀ (ที่ 0 °C)", "Ω", "100"], ["wire", "การต่อสาย", "sel", "2 สาย", ["2 สาย", "3 สาย", "4 สาย"]],
        ["rl", "ความต้านทานสายต่อเส้น", "Ω", "0.5"], ["cls", "เกรด IEC 60751", "sel", "A", ["AA", "A", "B", "C"]], ["i", "กระแสกระตุ้น", "mA", "1"]],
      f: function (x) {
        var R = cvd(x.t, x.r0), alpha = (cvd(100, x.r0) - x.r0) / (100 * x.r0), add = x.wire === "2 สาย" ? 2 * x.rl : 0;
        var Rm = R + add, tm = cvdInv(Rm, x.r0), sens = (cvd(x.t + 0.5, x.r0) - cvd(x.t - 0.5, x.r0));
        var tol = rtdTol(x.cls, x.t), P = Math.pow(x.i / 1000, 2) * R * 1000;
        var pts = lin(-200, 850, 105).map(function (t) { return [t, cvd(t, x.r0)]; });
        var svg = autoChart({ w: 640, h: 260, xs: [-200, 850], ys: [0, cvd(850, x.r0)], series: [{ pts: pts, cls: "s1" }],
          marks: [{ x: x.t, y: R, label: n(R, 2) + " Ω" }], xl: "อุณหภูมิ (°C)", yl: "R (Ω)", label: "กราฟ R–T ของ RTD ตาม IEC 60751" });
        return {
          rows: [["R(t) ตาม Callendar–Van Dusen", n(R, 3) + " Ω"], ["α (0–100 °C)", n(alpha, 6) + " /°C"],
            ["ความไว ณ จุดนี้", n(sens, 4) + " Ω/°C"], ["ค่าที่เครื่องอ่านเห็น", n(Rm, 3) + " Ω"],
            ["อุณหภูมิที่อ่านได้", n(tm, 2) + " °C"], ["ความคลาดจากสายต่อ", (add ? warn(n(tm - x.t, 2) + " °C") : ok(true, "ตัดผลสายได้"))],
            ["พิกัดความคลาดเกรด " + x.cls, "± " + n(tol, 2) + " °C"], ["กำลังทำให้ร้อนตัวเอง (I²R)", n(P, 3) + " mW"]],
          svg: svg,
          note: x.wire === "3 สาย" ? "3 สายชดเชยได้เมื่อสายทั้งสามเส้นมีความต้านทานเท่ากัน — ถ้าต่างกัน 0.1 Ω จะคลาด ≈ " + n(0.1 / sens, 2) + " °C" :
            x.wire === "4 สาย" ? "4 สาย: กระแสไหลในคู่หนึ่ง วัดแรงดันด้วยอีกคู่ที่แทบไม่มีกระแส จึงไม่มีแรงดันตกในสายวัด" :
            "2 สาย: ความต้านทานสายทั้งไปและกลับบวกเข้าไปตรง ๆ ใช้ได้เฉพาะสายสั้นหรือ Pt1000"
        };
      }
    },
    tc: {
      t: "เทอร์โมคัปเปิล: อุณหภูมิ ↔ แรงเคลื่อนไฟฟ้า (NIST ITS-90, จุดอ้างอิง 0 °C)", ref: "T5–T7",
      ins: [["type", "ชนิด", "sel", "K", ["K", "J", "T", "N", "E", "R", "S", "B"]], ["t", "อุณหภูมิปลายร้อน", "°C", "500"], ["cls", "คลาส IEC 60584-1", "sel", "1", ["1", "2"]]],
      f: function (x) {
        var r = tcRange(x.type);
        if (x.t < r[0] || x.t > r[1]) return { rows: [["ช่วงของชนิด " + x.type, r[0] + " … " + r[1] + " °C"], ["ผล", warn("อุณหภูมินอกช่วงตาราง")]] };
        var E = tcEmf(x.type, x.t), S = (tcEmf(x.type, Math.min(x.t + 0.5, r[1])) - tcEmf(x.type, Math.max(x.t - 0.5, r[0]))) * 1000, tol = tcTol(x.type, +x.cls, x.t);
        var series = ["K", "J", "T", "E", "S"].map(function (ty, i) {
          var rr = tcRange(ty), hi = Math.min(rr[1], 1400), lo = Math.max(rr[0], -200);
          return { pts: lin(lo, hi, 80).map(function (t) { return [t, tcEmf(ty, t)]; }), cls: "s" + (i + 1) + (ty === x.type ? " thick" : "") };
        });
        var svg = autoChart({ w: 640, h: 280, xs: [-200, 1400], ys: [-10, 80], series: series, marks: [{ x: x.t, y: E, label: n(E, 3) + " mV" }],
          xl: "อุณหภูมิ (°C)", yl: "emf (mV)", label: "แรงเคลื่อนไฟฟ้าของเทอร์โมคัปเปิล K J T E S", legend: [["f1", "K"], ["f2", "J"], ["f3", "T"], ["f4", "E"], ["f5", "S"]] });
        return {
          rows: [["emf (จุดอ้างอิง 0 °C)", n(E, 4) + " mV"], ["Seebeck coefficient ณ จุดนี้", n(S, 2) + " µV/°C"], ["ช่วงตาราง", r[0] + " … " + r[1] + " °C"],
            ["พิกัดความคลาดคลาส " + x.cls, isFinite(tol) ? "± " + n(tol, 2) + " °C" : "นอกช่วงที่ระบุ/ไม่มีคลาสนี้"], ["ข้อมูลชนิด", TC_INFO[x.type]]],
          svg: svg
        };
      }
    },
    cjc: {
      t: "ชดเชยจุดเย็น (cold-junction compensation)", ref: "T6",
      ins: [["type", "ชนิด", "sel", "K", ["K", "J", "T", "N", "E", "R", "S"]], ["mv", "แรงดันที่วัดได้ที่ขั้ว", "mV", "18.516"], ["tcj", "อุณหภูมิที่ขั้วต่อ (จุดเย็น)", "°C", "30"]],
      f: function (x) {
        var Ecj = tcEmf(x.type, x.tcj), Et = x.mv + Ecj, th = tcTemp(x.type, Et), naive = tcTemp(x.type, x.mv);
        return {
          rows: [["E(T_cj) จากตาราง", n(Ecj, 4) + " mV"], ["E(T_h) = E_วัด + E(T_cj)", n(Et, 4) + " mV"], ["อุณหภูมิปลายร้อนที่ถูกต้อง", "<b>" + n(th, 2) + " °C</b>"],
            ["ถ้าลืมชดเชย (อ่านเป็น E จากตาราง)", warn(n(naive, 2) + " °C")], ["ถ้าแค่บวก T_cj (ผิดวิธี)", n(naive + x.tcj, 2) + " °C"]],
          note: "ต้องบวกกันในโดเมน <b>แรงดัน</b> แล้วจึงแปลงเป็นอุณหภูมิ เพราะ emf–อุณหภูมิไม่เป็นเชิงเส้น การบวกอุณหภูมิตรง ๆ คลาดเคลื่อนเล็กน้อยและคลาดมากกับชนิดที่โค้งมาก"
        };
      }
    },
    ntc: {
      t: "เทอร์มิสเตอร์ NTC: สมการ β และวงจรแบ่งแรงดัน", ref: "T8–T9",
      ins: [["r25", "R₂₅", "Ω", "10k"], ["beta", "β (25/85)", "K", "3950"], ["t", "อุณหภูมิ", "°C", "60"], ["rf", "ตัวต้านทานคงที่ (ต่อขึ้น Vcc)", "Ω", "10k"], ["vcc", "Vcc = Vref ADC", "V", "3.3"], ["bits", "ADC", "bit", "12"]],
      f: function (x) {
        var R = ntcBeta(x.r25, x.beta, x.t), V = x.vcc * R / (R + x.rf), code = Math.round(V / x.vcc * (Math.pow(2, x.bits) - 1));
        var R2 = ntcBeta(x.r25, x.beta, x.t + 0.1), V2 = x.vcc * R2 / (R2 + x.rf), dVdT = (V2 - V) / 0.1;
        var lsb = x.vcc / Math.pow(2, x.bits), alpha = -x.beta / Math.pow(x.t + 273.15, 2) * 100;
        var pts = lin(-20, 120, 70).map(function (t) { var r = ntcBeta(x.r25, x.beta, t); return [t, x.vcc * r / (r + x.rf)]; });
        var svg = autoChart({ w: 640, h: 240, xs: [-20, 120], ys: [0, x.vcc], series: [{ pts: pts, cls: "s2" }], marks: [{ x: x.t, y: V, label: n(V, 3) + " V" }],
          xl: "อุณหภูมิ (°C)", yl: "V_out (V)", label: "แรงดันออกของวงจรแบ่งแรงดัน NTC" });
        return {
          rows: [["R(T)", sig(R, 4) + " Ω"], ["สัมประสิทธิ์อุณหภูมิ α", n(alpha, 2) + " %/°C"], ["V_out", n(V, 4) + " V"], ["รหัส ADC", code], ["ความไวของวงจร", n(dVdT * 1000, 2) + " mV/°C"],
            ["ความละเอียดอุณหภูมิ ≈", n(Math.abs(lsb / dVdT), 3) + " °C ต่อ LSB"]],
          svg: svg, note: "ความไวสูงสุดเมื่อ R_fixed ≈ R ที่อุณหภูมิกลางช่วง — ลองเปลี่ยน R_fixed แล้วดูความละเอียด"
        };
      }
    },
    ptx: {
      t: "เลือกช่วงทรานสมิตเตอร์ความดัน: turndown และงบความคลาดเคลื่อน", ref: "P5–P7",
      ins: [["url", "ช่วงสูงสุดของรุ่น (URL)", "bar", "40"], ["lrv", "LRV", "bar", "0"], ["urv", "URV", "bar", "10"], ["acc", "ความแม่นอ้างอิง", "% span", "0.075"],
        ["tz", "ผลอุณหภูมิ (ต่อ 28 °C)", "% URL", "0.05"], ["dt", "อุณหภูมิเปลี่ยน", "°C", "20"], ["stab", "เสถียรภาพ", "% URL/ปี", "0.1"], ["yr", "ระยะสอบเทียบ", "ปี", "1"]],
      f: function (x) {
        var span = x.urv - x.lrv, td = x.url / span;
        var e1 = x.acc / 100 * span, e2 = x.tz / 100 * x.url * x.dt / 28, e3 = x.stab / 100 * x.url * x.yr, tot = Math.sqrt(e1 * e1 + e2 * e2 + e3 * e3);
        return {
          rows: [["span", n(span, 3) + " bar"], ["turndown = URL/span", n(td, 1) + " : 1" + (td > 10 ? " " + warn("สูง ค่าคลาดเทียบ span โต") : "")], ["ความแม่นอ้างอิง", "± " + sig(e1, 3) + " bar"],
            ["ผลอุณหภูมิ", "± " + sig(e2, 3) + " bar"], ["เสถียรภาพ", "± " + sig(e3, 3) + " bar"], ["รวมแบบ RSS", "<b>± " + sig(tot, 3) + " bar = " + pct(tot / span * 100, 3) + " ของ span</b>"],
            ["รวมแบบบวกตรง (กรณีเลวสุด)", "± " + sig(e1 + e2 + e3, 3) + " bar"]],
          note: "ผลอุณหภูมิและเสถียรภาพมักกำหนดเป็น % ของ URL จึงไม่ลดลงตาม span — ยิ่ง turndown มาก ส่วนนี้ยิ่งเด่นเมื่อคิดเป็น % ของ span"
        };
      }
    },
    reynolds: {
      t: "เลขเรย์โนลด์สในท่อ", ref: "Q1",
      ins: [["v", "ความเร็วเฉลี่ย", "m/s", "2"], ["d", "เส้นผ่านศูนย์กลางใน", "mm", "100"], ["rho", "ความหนาแน่น", "kg/m³", "998"], ["mu", "ความหนืดพลวัต", "mPa·s", "1.0"]],
      f: function (x) {
        var Re = x.rho * x.v * x.d / 1000 / (x.mu / 1000), Q = x.v * PI / 4 * Math.pow(x.d / 1000, 2);
        return { rows: [["Re = ρvD/μ", sig(Re, 4)], ["ระบอบการไหล", Re < 2300 ? "ราบเรียบ (laminar)" : Re < 4000 ? warn("ช่วงเปลี่ยนผ่าน") : "ปั่นป่วน (turbulent)"],
          ["อัตราไหลเชิงปริมาตร", n(Q * 3600, 2) + " m³/h"]], note: "มิเตอร์ส่วนใหญ่ (ออริฟิซ วอร์เท็กซ์ เทอร์ไบน์) ถูกสอบเทียบในช่วงปั่นป่วน ควรตรวจ Re ที่อัตราไหลต่ำสุดเสมอ" };
      }
    },
    orifice: {
      t: "แผ่นออริฟิซตาม ISO 5167-2 (สมการ Reader-Harris/Gallagher)", ref: "Q2–Q4",
      ins: [["D", "เส้นผ่านศูนย์กลางท่อ D", "mm", "100"], ["d", "รูออริฟิซ d", "mm", "50"], ["dp", "ความดันผลต่าง ΔP", "kPa", "25"], ["rho", "ความหนาแน่นด้านต้นน้ำ", "kg/m³", "998"],
        ["mu", "ความหนืด", "mPa·s", "1.0"], ["tap", "ตำแหน่งรูวัด", "sel", "flange", ["flange", "corner", "D-D/2"]], ["fl", "ของไหล", "sel", "ของเหลว", ["ของเหลว", "แก๊ส"]],
        ["p1", "ความดันสัมบูรณ์ต้นน้ำ (แก๊ส)", "kPa", "500"], ["k", "κ (แก๊ส)", "", "1.4"]],
      f: function (x) {
        var r = orifice({ D: x.D / 1000, d: x.d / 1000, dp: x.dp * 1000, rho: x.rho, mu: x.mu / 1000, tap: x.tap, gas: x.fl === "แก๊ส", p1: x.p1 * 1000, kappa: x.k });
        var okb = r.beta >= 0.1 && r.beta <= 0.75, okD = x.D >= 50 && x.D <= 1000, okd = x.d >= 12.5;
        var pts = lin(0, 100, 50).map(function (p) { return [p, Math.sqrt(p / 100) * 100]; });
        var svg = autoChart({ w: 640, h: 230, xs: [0, 100], ys: [0, 100], series: [{ pts: pts, cls: "s1" }, { pts: [[0, 0], [100, 100]], cls: "s4 dsh" }],
          marks: [{ x: 25, y: 50, label: "ΔP 25 % = อัตราไหล 50 %" }], xl: "ΔP (% ของ span)", yl: "อัตราไหล (%)", label: "ความสัมพันธ์รากที่สองระหว่าง ΔP และอัตราไหล" });
        return {
          rows: [["β = d/D", n(r.beta, 4) + " " + ok(okb, "0.1–0.75")], ["C (Reader-Harris/Gallagher)", n(r.C, 5)], ["ε (expansibility)", n(r.eps, 5)], ["Re_D", sig(r.Re, 4)],
            ["อัตราไหลเชิงมวล q_m", "<b>" + n(r.qm, 3) + " kg/s = " + n(r.qm * 3.6, 2) + " t/h</b>"], ["อัตราไหลเชิงปริมาตร (ต้นน้ำ)", n(r.qv * 3600, 2) + " m³/h"],
            ["ความเร็วในท่อ", n(r.v, 2) + " m/s"], ["ความดันสูญเสียถาวร", n(r.loss / 1000, 2) + " kPa (" + pct(r.loss / (x.dp * 1000) * 100, 0) + " ของ ΔP)"],
            ["ขอบเขต ISO 5167-2", ok(okD, "50 ≤ D ≤ 1000 mm") + " " + ok(okd, "d ≥ 12.5 mm")]],
          svg: svg, note: "เครื่องคำนวณนี้สำหรับการศึกษา การออกแบบจริงต้องตรวจเงื่อนไขท่อตรงต้นน้ำ/ท้ายน้ำ ความหยาบท่อ และความไม่แน่นอนตามมาตรฐานฉบับเต็ม"
        };
      }
    },
    mag: {
      t: "มิเตอร์แม่เหล็กไฟฟ้า (magmeter): กฎของฟาราเดย์", ref: "Q6",
      ins: [["q", "อัตราไหล", "m³/h", "50"], ["d", "ขนาดท่อมิเตอร์", "mm", "100"], ["b", "ความหนาแน่นฟลักซ์", "mT", "5"]],
      f: function (x) {
        var A2 = PI / 4 * Math.pow(x.d / 1000, 2), v = x.q / 3600 / A2, U = x.b / 1000 * x.d / 1000 * v;
        return { rows: [["ความเร็วเฉลี่ย", n(v, 3) + " m/s " + (v < 0.3 ? warn("ต่ำเกินไป ความแม่นลด") : v > 10 ? warn("สูงเกิน สึกกร่อน") : ok(true, "อยู่ใน 0.3–10 m/s"))],
          ["แรงดันที่อิเล็กโทรด U = BDv", n(U * 1e6, 1) + " µV"]], note: "สัญญาณระดับไมโครโวลต์ ของเหลวต้องนำไฟฟ้า (โดยทั่วไป ≥ 5 µS/cm) ขนาดมิเตอร์มักเลือกให้ความเร็ว 1–5 m/s ซึ่งอาจเล็กกว่าท่อ" };
      }
    },
    ultra: {
      t: "อัลตราโซนิกแบบเวลาเดินทาง (transit time)", ref: "Q7",
      ins: [["v", "ความเร็วของไหล", "m/s", "2"], ["d", "เส้นผ่านศูนย์กลางท่อ", "mm", "200"], ["th", "มุมเส้นทางคลื่นกับแกนท่อ", "°", "45"], ["c", "ความเร็วเสียงในของไหล", "m/s", "1482"]],
      f: function (x) {
        var th = x.th * PI / 180, L = x.d / 1000 / Math.sin(th), tu = L / (x.c - x.v * Math.cos(th)), td = L / (x.c + x.v * Math.cos(th)), dt = tu - td;
        var vb = L * dt / (2 * Math.cos(th) * tu * td);
        return { rows: [["ความยาวเส้นทาง L", n(L * 1000, 1) + " mm"], ["t ทวนกระแส", n(tu * 1e6, 3) + " µs"], ["t ตามกระแส", n(td * 1e6, 3) + " µs"],
          ["Δt", "<b>" + n(dt * 1e9, 2) + " ns</b>"], ["v คำนวณกลับ (ไม่ขึ้นกับ c)", n(vb, 4) + " m/s"]],
          note: "Δt ระดับนาโนวินาที วงจรจับเวลาต้องละเอียดระดับพิโควินาที สูตร v = L(t↑−t↓)/(2cosθ·t↑t↓) ตัด c ออก จึงไม่ไวต่ออุณหภูมิของของไหล" };
      }
    },
    vortex: {
      t: "วอร์เท็กซ์มิเตอร์: ความถี่การหลุดของกระแสวน", ref: "Q8",
      ins: [["v", "ความเร็ว", "m/s", "3"], ["w", "ความกว้าง bluff body", "mm", "28"], ["st", "Strouhal number", "", "0.2"], ["D", "ท่อ", "mm", "100"]],
      f: function (x) {
        var f = x.st * x.v / (x.w / 1000), Q = x.v * PI / 4 * Math.pow(x.D / 1000, 2), Kf = f / Q;
        return { rows: [["f = St·v/d", n(f, 1) + " Hz"], ["อัตราไหล", n(Q * 3600, 2) + " m³/h"], ["K-factor", n(Kf / 1000, 2) + " พัลส์/ลิตร"]], note: "Strouhal ≈ คงที่ในช่วง Re ประมาณ 2×10⁴–10⁷ ความถี่จึงเป็นเชิงเส้นกับความเร็ว ไม่ต้องถอดรากที่สอง ต่ำกว่าช่วงนี้จะเกิด low-flow cut-off" };
      }
    },
    hydro: {
      t: "ระดับจากความดันไฮโดรสแตติก (ถังเปิด)", ref: "L1",
      ins: [["h", "ระดับของเหลว", "m", "3.2"], ["rho", "ความหนาแน่น", "kg/m³", "998"], ["hmax", "ระดับสูงสุดที่ต้องวัด", "m", "5"], ["off", "ทรานสมิตเตอร์ต่ำกว่าจุดต่อ", "m", "0"]],
      f: function (x) {
        var P = x.rho * G * (x.h + x.off), lrv = x.rho * G * x.off, urv = x.rho * G * (x.hmax + x.off), mA = 4 + 16 * (P - lrv) / (urv - lrv);
        return { rows: [["P = ρg(h + d)", n(P / 1000, 3) + " kPa = " + n(P / 100000, 4) + " bar"], ["LRV", n(lrv / 1000, 3) + " kPa"], ["URV", n(urv / 1000, 3) + " kPa"], ["กระแสเอาต์พุต", n(mA, 2) + " mA"],
          ["ถ้าความหนาแน่นจริงสูงขึ้น 5 %", warn("อ่านระดับเป็น " + n(x.h * 1.05 + x.off * 0.05, 3) + " m")]], note: "การวัดระดับด้วยความดันวัด 'มวลต่อพื้นที่' จึงไวต่อความหนาแน่น ถ้าความหนาแน่นเปลี่ยนตามอุณหภูมิหรือส่วนผสม ต้องชดเชย" };
      }
    },
    dplevel: {
      t: "ระดับในถังปิดด้วย DP: ขาแห้ง ขาเปียก การยกและกดศูนย์", ref: "L2–L3",
      ins: [["hmax", "ช่วงระดับ (ระหว่างรูวัดล่างถึงระดับสูงสุด)", "m", "4"], ["rho", "ความหนาแน่นของเหลวในถัง", "kg/m³", "998"], ["leg", "ขา LP", "sel", "ขาเปียก", ["ขาแห้ง", "ขาเปียก"]],
        ["H", "ระยะดิ่งรูวัดล่าง → รูวัดบน", "m", "5"], ["rhow", "ความหนาแน่นของเหลวในขาเปียก", "kg/m³", "1000"], ["d", "ทรานสมิตเตอร์ต่ำกว่ารูวัดล่าง", "m", "0.5"], ["h", "ระดับปัจจุบัน", "m", "2"]],
      f: function (x) {
        var wet = x.leg === "ขาเปียก";
        var dp = function (h) { return x.rho * G * (h + x.d) - (wet ? x.rhow * G * (x.H + x.d) : 0); };
        var lrv = dp(0), urv = dp(x.hmax), now = dp(x.h), mA = 4 + 16 * (now - lrv) / (urv - lrv);
        return { rows: [["LRV (ระดับ 0)", n(lrv / 1000, 3) + " kPa"], ["URV (ระดับสูงสุด)", n(urv / 1000, 3) + " kPa"], ["span", n((urv - lrv) / 1000, 3) + " kPa"],
          ["ชนิดการตั้งศูนย์", lrv < 0 ? "ยกศูนย์ลง (zero elevation) — LRV ติดลบ" : lrv > 0 ? "กดศูนย์ (zero suppression) — LRV เป็นบวก" : "ศูนย์ตรง"],
          ["ΔP ที่ระดับปัจจุบัน", n(now / 1000, 3) + " kPa"], ["กระแสเอาต์พุต", n(mA, 2) + " mA"]],
          note: "ขาเปียกเติมของเหลวจนเต็มเพื่อให้ความดันอ้างอิงคงที่เมื่อไอระเหยควบแน่นในท่อ ผลคือ LRV ติดลบ — ค่าที่ต้องตั้งในทรานสมิตเตอร์" };
      }
    },
    radar: {
      t: "เรดาร์ FMCW: ความถี่บีต → ระยะทาง", ref: "L4–L5",
      ins: [["f0", "ความถี่กลาง", "GHz", "80"], ["bw", "แบนด์วิดท์การกวาด B", "GHz", "4"], ["ts", "เวลากวาด T", "ms", "1"], ["r", "ระยะถึงผิวของเหลว", "m", "6"], ["tank", "ความสูงถังจากหน้าแปลน", "m", "10"]],
      f: function (x) {
        var c = 299792458, S = x.bw * 1e9 / (x.ts / 1000), fb = 2 * x.r * S / c, res = c / (2 * x.bw * 1e9), lam = c / (x.f0 * 1e9);
        return { rows: [["ความชันการกวาด S = B/T", sig(S / 1e12, 4) + " GHz/ms"], ["ความถี่บีต f_b = 2RS/c", "<b>" + n(fb / 1000, 2) + " kHz</b>"], ["ความละเอียดแยกเป้า ΔR = c/2B", n(res * 100, 2) + " cm"],
          ["ความยาวคลื่น", n(lam * 1000, 2) + " mm"], ["ระดับ = ความสูงถัง − R", n(x.tank - x.r, 3) + " m"]], note: "ความถี่ยิ่งสูง ลำคลื่นยิ่งแคบด้วยเสาอากาศเท่าเดิม และกวาดแบนด์กว้างได้ ทำให้แยกเป้าได้ละเอียด — เหตุที่เรดาร์ระดับรุ่นใหม่ย้ายไป 80 GHz" };
      }
    },
    usonic: {
      t: "อัลตราโซนิกวัดระดับ: ผลของอุณหภูมิอากาศ", ref: "L6",
      ins: [["d", "ระยะจริงถึงผิว", "m", "4"], ["tc", "อุณหภูมิอากาศจริง", "°C", "40"], ["tcal", "อุณหภูมิที่เครื่องสมมติ", "°C", "20"]],
      f: function (x) {
        var c = function (t) { return 331.3 * Math.sqrt(1 + t / 273.15); }, tof = 2 * x.d / c(x.tc), dm = c(x.tcal) * tof / 2;
        return { rows: [["c(T) จริง", n(c(x.tc), 1) + " m/s"], ["เวลาเดินทางไป–กลับ", n(tof * 1000, 3) + " ms"], ["ระยะที่อ่านได้ถ้าไม่ชดเชย", n(dm, 3) + " m"], ["ความคลาดเคลื่อน", warn(n((dm - x.d) * 1000, 0) + " mm")]],
          note: "ความเร็วเสียงเปลี่ยน ≈ 0.17 %/°C เซนเซอร์อัลตราโซนิกจึงมีเซนเซอร์อุณหภูมิในตัว แต่ชดเชยไอระเหยหรือชั้นอุณหภูมิในถังไม่ได้" };
      }
    },
    tankvol: {
      t: "ปริมาตรในถังทรงกระบอกนอน (strapping)", ref: "L7",
      ins: [["dia", "เส้นผ่านศูนย์กลางถัง", "m", "2.5"], ["len", "ความยาวส่วนทรงกระบอก", "m", "6"], ["h", "ระดับของเหลว", "m", "0.8"]],
      f: function (x) {
        var r = x.dia / 2, h = Math.min(Math.max(x.h, 0), x.dia), Aseg = r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - h * h), V = Aseg * x.len, Vf = PI * r * r * x.len;
        var pts = lin(0, x.dia, 60).map(function (hh) { var a = r * r * Math.acos((r - hh) / r) - (r - hh) * Math.sqrt(Math.max(0, 2 * r * hh - hh * hh)); return [hh / x.dia * 100, a * x.len / Vf * 100]; });
        var svg = autoChart({ w: 640, h: 230, xs: [0, 100], ys: [0, 100], series: [{ pts: pts, cls: "s3" }, { pts: [[0, 0], [100, 100]], cls: "s4 dsh" }], marks: [{ x: h / x.dia * 100, y: V / Vf * 100 }],
          xl: "ระดับ (% ของเส้นผ่านศูนย์กลาง)", yl: "ปริมาตร (%)", label: "ตารางปริมาตรของถังนอน" });
        return { rows: [["ปริมาตรของเหลว", "<b>" + n(V, 3) + " m³ = " + n(V * 1000, 0) + " L</b>"], ["ปริมาตรเต็มถัง (ไม่รวมฝาโค้ง)", n(Vf, 3) + " m³"], ["% ปริมาตร", pct(V / Vf * 100, 1) + " ที่ระดับ " + pct(h / x.dia * 100, 1)]],
          svg: svg, note: "ระดับ 50 % ไม่เท่ากับปริมาตร 50 % ยกเว้นตรงกลางพอดี — PLC/DCS ใช้ตารางนี้ (strapping table) แปลงระดับเป็นปริมาตร" };
      }
    },
    bridge: {
      t: "สเตรนเกจในสะพานวีตสโตน: quarter / half / full bridge", ref: "R1–R3",
      ins: [["eps", "ความเครียด", "µε", "500"], ["gf", "Gauge factor", "", "2.0"], ["vex", "แรงดันกระตุ้น", "V", "5"], ["cfg", "รูปแบบ", "sel", "quarter", ["quarter", "half", "full"]], ["gain", "อัตราขยาย INA", "V/V", "200"]],
      f: function (x) {
        var e = x.eps * 1e-6, k = { quarter: 0.25, half: 0.5, full: 1 }[x.cfg], approx = x.vex * x.gf * e * k;
        var exact = x.cfg === "quarter" ? x.vex * (x.gf * e) / (4 + 2 * x.gf * e) : approx;
        return { rows: [["ΔR/R = GF·ε", n(x.gf * e * 1e6, 1) + " ppm"], ["V_out (ประมาณเชิงเส้น)", n(approx * 1000, 4) + " mV"], ["V_out (สูตรเต็ม)", n(exact * 1000, 4) + " mV"],
          ["ความไม่เป็นเชิงเส้นของ quarter bridge", x.cfg === "quarter" ? pct((approx - exact) / exact * 100, 3) : "≈ 0 (ทั้งสองแขนเปลี่ยนสวนกัน)"], ["หลังขยาย", n(exact * x.gain, 4) + " V"]],
          note: "full bridge ให้สัญญาณ 4 เท่าของ quarter และชดเชยอุณหภูมิได้ในตัวเมื่อสเตรนเกจทุกตัวอยู่บนวัสดุเดียวกัน" };
      }
    },
    loadcell: {
      t: "โหลดเซลล์: mV/V → น้ำหนัก และความละเอียด ADC", ref: "R4",
      ins: [["cap", "พิกัด", "kg", "500"], ["s", "Rated output", "mV/V", "2"], ["vex", "แรงดันกระตุ้น", "V", "5"], ["w", "น้ำหนักบนเซลล์", "kg", "120"], ["bits", "ADC", "bit", "24"], ["enob", "บิตใช้ได้จริง (noise-free)", "bit", "18"], ["fs", "ช่วงอินพุต ADC (±)", "mV", "20"]],
      f: function (x) {
        var vfs = x.s * x.vex, v = vfs * x.w / x.cap, cnt = Math.pow(2, x.enob), lsb = 2 * x.fs / cnt, kgcount = lsb / vfs * x.cap;
        return { rows: [["สัญญาณเต็มพิกัด", n(vfs, 2) + " mV"], ["สัญญาณที่น้ำหนักนี้", n(v, 4) + " mV"], ["ใช้ช่วง ADC", pct(vfs / x.fs * 100, 0)], ["ความละเอียดที่ได้จริง", "<b>" + sig(kgcount * 1000, 3) + " g ต่อหลัก</b>"],
          ["จำนวนหลักที่แยกได้เต็มพิกัด", n(x.cap / kgcount, 0)]], note: "เครื่องชั่งเชิงพาณิชย์ตาม OIML R 76 คลาส III มักใช้ 3,000–10,000 ขั้น (e) ตัวเลข ADC 24 บิตบนกระดาษจึงต้องดูสัญญาณรบกวนจริง (noise-free bits)" };
      }
    },
    encoder: {
      t: "เอนโค้ดเดอร์: ความเร็วรอบและความละเอียดมุม", ref: "R6–R7",
      ins: [["ppr", "พัลส์ต่อรอบ (PPR)", "", "1024"], ["f", "ความถี่สัญญาณ A", "kHz", "20"], ["mode", "การนับ", "sel", "x4", ["x1", "x2", "x4"]], ["gate", "เวลานับ (gate)", "ms", "10"]],
      f: function (x) {
        var m = +x.mode.slice(1), rpm = x.f * 1000 / x.ppr * 60, res = 360 / (x.ppr * m), counts = x.f * 1000 * m * x.gate / 1000, rpmres = 60 / (x.ppr * m * x.gate / 1000);
        return { rows: [["ความเร็วรอบ n = 60f/PPR", n(rpm, 1) + " rpm"], ["ความละเอียดมุม", n(res, 4) + "°"], ["จำนวนนับต่อ gate", n(counts, 0)], ["ความละเอียดความเร็ว (วิธีนับความถี่)", n(rpmres, 2) + " rpm"]],
          note: "ที่ความเร็วต่ำ วิธีนับความถี่ละเอียดน้อย จึงเปลี่ยนเป็นวัดคาบ (period) ระหว่างขอบสัญญาณ ไดรฟ์หลายรุ่นสลับสองวิธีอัตโนมัติ" };
      }
    },
    shunt: {
      t: "ตัวต้านทานชันต์วัดกระแส", ref: "V1–V2",
      ins: [["i", "กระแสสูงสุด", "A", "50"], ["v", "แรงดันตกที่ต้องการ", "mV", "75"], ["tcr", "TCR ของชันต์", "ppm/°C", "20"], ["dt", "อุณหภูมิขึ้น", "°C", "40"]],
      f: function (x) {
        var R = x.v / 1000 / x.i, P = x.i * x.v / 1000, dr = x.tcr * x.dt / 1e4;
        return { rows: [["R = V/I", sig(R * 1000, 4) + " mΩ"], ["กำลังสูญเสีย", n(P, 2) + " W"], ["ความคลาดจากอุณหภูมิ", pct(dr, 3)]], note: "ชันต์ 50/60/75/100 mV เป็นค่ามาตรฐานของแผงมิเตอร์ ต้องต่อแบบ Kelvin (4 ขั้ว) และเลือกพิกัดกำลังเผื่อ 2–3 เท่า" };
      }
    },
    ct: {
      t: "หม้อแปลงกระแส (CT): ภาระและแรงดันด้านทุติยภูมิ", ref: "V3–V5",
      ins: [["ip", "กระแสพิกัดปฐมภูมิ", "A", "400"], ["is", "กระแสพิกัดทุติยภูมิ", "sel", "5", ["5", "1"]], ["va", "ภาระพิกัด", "VA", "10"], ["rct", "ความต้านทานขดทุติยภูมิ", "Ω", "0.2"],
        ["len", "ระยะสาย (ทางเดียว)", "m", "30"], ["mm2", "ขนาดสาย", "mm²", "2.5"], ["rdev", "ภาระของมิเตอร์/รีเลย์", "VA", "1.5"], ["iact", "กระแสใช้งาน", "A", "320"]],
      f: function (x) {
        var Is = +x.is, rl = 0.0175 * 2 * x.len / x.mm2, rdev = x.rdev / (Is * Is), burden = (rl + rdev) * Is * Is, isNow = x.iact / x.ip * Is;
        var vk = isNow * (x.rct + rl + rdev);
        return { rows: [["อัตราส่วน", x.ip + "/" + x.is + " A"], ["กระแสทุติยภูมิขณะนี้", n(isNow, 3) + " A"], ["ความต้านทานสาย (ไป–กลับ)", n(rl, 3) + " Ω"],
          ["ภาระรวมที่พิกัดกระแส", n(burden, 2) + " VA " + ok(burden <= x.va, "≤ " + x.va + " VA")], ["แรงดันขั้วทุติยภูมิขณะนี้", n(vk, 3) + " V"],
          ["ถ้าใช้ CT 1 A แทน (สายเดิม)", n(rl * 1 + x.rdev, 2) + " VA"]],
          note: "ภาระของสายแปรตาม I² — CT 1 A ทำให้ภาระสายลดลง 25 เท่าเทียบกับ 5 A จึงนิยมใช้เมื่อสายยาว และห้ามเปิดวงจรทุติยภูมิขณะมีกระแส" };
      }
    },
    adc: {
      t: "ADC: LSB ความละเอียด ENOB และหน่วยวิศวกรรม", ref: "A5–A7",
      ins: [["bits", "ความละเอียด", "bit", "16"], ["vref", "ช่วงเต็มสเกล FSR", "V", "10"], ["sinad", "SINAD (ถ้ามี)", "dB", "88"], ["eu", "ช่วงวิศวกรรมที่แทนด้วย FSR", "", "250"], ["euu", "หน่วย", "sel", "°C", ["°C", "bar", "m", "m³/h", "kg"]]],
      f: function (x) {
        var lsb = x.vref / Math.pow(2, x.bits), enob = (x.sinad - 1.76) / 6.02, snrId = 6.02 * x.bits + 1.76, lsbE = x.vref / Math.pow(2, enob);
        return { rows: [["1 LSB", sig(lsb * 1e6, 4) + " µV"], ["SNR ในอุดมคติ 6.02N + 1.76", n(snrId, 1) + " dB"], ["ENOB = (SINAD − 1.76)/6.02", n(enob, 2) + " bit"],
          ["ความละเอียดที่ได้จริง", sig(x.eu / Math.pow(2, enob), 3) + " " + x.euu], ["ความละเอียดตามจำนวนบิต", sig(x.eu / Math.pow(2, x.bits), 3) + " " + x.euu]] };
      }
    },
    loop: {
      t: "งบแรงดันลูป 4–20 mA (loop power budget)", ref: "I3–I4",
      ins: [["vs", "แหล่งจ่าย", "V", "24"], ["vmin", "แรงดันต่ำสุดของทรานสมิตเตอร์", "V", "10.5"], ["imax", "กระแสสูงสุดที่ต้องรองรับ", "mA", "22"], ["rsense", "ตัวต้านทานรับสัญญาณ (การ์ด AI)", "Ω", "250"],
        ["len", "ความยาวสาย (ทางเดียว)", "m", "800"], ["mm2", "ขนาดสาย", "mm²", "0.75"], ["ext", "อุปกรณ์อื่นในลูป (แบเรียร์ จอ)", "Ω", "0"], ["hart", "ต้องการ HART", "sel", "ใช่", ["ใช่", "ไม่"]]],
      f: function (x) {
        var rw = 0.0175 * 2 * x.len / x.mm2, rl = x.rsense + rw + x.ext, rmax = (x.vs - x.vmin) / (x.imax / 1000);
        var vtx = x.vs - x.imax / 1000 * rl, hartOk = x.hart === "ไม่" || (x.rsense + x.ext >= 230 && x.rsense + x.ext <= 1100);
        var pts = [[x.vmin, 0], [Math.max(x.vs * 1.4, 42), (Math.max(x.vs * 1.4, 42) - x.vmin) / (x.imax / 1000)]];
        var svg = autoChart({ w: 640, h: 240, xs: [0, Math.max(x.vs * 1.4, 42)], ys: [0, pts[1][1] * 1.05], series: [{ pts: pts, cls: "s1" }, { pts: [[x.vmin, 0], pts[1]], cls: "ee-a3", area: true }],
          marks: [{ x: x.vs, y: rl, label: "จุดใช้งาน", cls: rl <= rmax ? "dot ok" : "dot red" }], xl: "แรงดันแหล่งจ่าย (V)", yl: "ความต้านทานลูปรวม (Ω)", label: "พื้นที่ใช้งานของลูป 4–20 mA" });
        return { rows: [["ความต้านทานสาย (ไป–กลับ)", n(rw, 1) + " Ω"], ["ความต้านทานลูปรวม", n(rl, 1) + " Ω"], ["R สูงสุดที่ยอมได้", n(rmax, 0) + " Ω"],
          ["แรงดันที่ขั้วทรานสมิตเตอร์ที่ " + x.imax + " mA", n(vtx, 2) + " V " + ok(vtx >= x.vmin, "≥ " + x.vmin + " V")], ["HART (230–1100 Ω)", ok(hartOk, x.hart === "ไม่" ? "ไม่ใช้" : "ความต้านทานเหมาะสม")],
          ["สัญญาณที่การ์ดเห็น", n(4 * x.rsense / 1000, 2) + " – " + n(20 * x.rsense / 1000, 2) + " V"]],
          svg: svg, note: "ใช้กระแสสูงสุดที่ทรานสมิตเตอร์อาจส่ง (ระดับเตือนตาม NE 43 ≥ 21 mA) ไม่ใช่ 20 mA มิฉะนั้นเมื่อแจ้งความผิดพลาด แรงดันอาจไม่พอและสัญญาณถูกตัด" };
      }
    },
    scale: {
      t: "สเกล 4–20 mA ↔ หน่วยวิศวกรรม พร้อมสถานะ NAMUR NE 43", ref: "I1–I2",
      ins: [["ma", "กระแสที่วัดได้", "mA", "12"], ["lrv", "LRV", "", "0"], ["urv", "URV", "", "250"], ["u", "หน่วย", "sel", "°C", ["°C", "bar", "kPa", "m", "m³/h", "%"]], ["sq", "ถอดรากที่สอง (DP flow)", "sel", "ไม่", ["ไม่", "ใช่"]]],
      f: function (x) {
        var p = (x.ma - 4) / 16, st;
        if (x.ma <= 3.6) st = warn("≤ 3.6 mA: แจ้งความผิดพลาดด้านต่ำ / สายขาด");
        else if (x.ma < 3.8) st = warn("3.6–3.8 mA: ไม่กำหนด ควรถือว่าผิดปกติ");
        else if (x.ma < 4) st = "3.8–4 mA: ต่ำกว่าช่วงแต่ยังวัดได้ (under-range)";
        else if (x.ma <= 20) st = ok(true, "ในช่วงวัดปกติ");
        else if (x.ma <= 20.5) st = "20–20.5 mA: เกินช่วงแต่ยังวัดได้ (over-range)";
        else if (x.ma < 21) st = warn("20.5–21 mA: ไม่กำหนด ควรถือว่าผิดปกติ");
        else st = warn("≥ 21 mA: แจ้งความผิดพลาดด้านสูง");
        var pe = x.sq === "ใช่" ? Math.sqrt(Math.max(p, 0)) : p, eu = x.lrv + pe * (x.urv - x.lrv);
        return { rows: [["% ของช่วงสัญญาณ", pct(p * 100, 2)], [x.sq === "ใช่" ? "% อัตราไหล (√)" : "% ของช่วงวัด", pct(pe * 100, 2)], ["ค่าวิศวกรรม", "<b>" + sig(eu, 5) + " " + x.u + "</b>"], ["สถานะ NE 43", st]] };
      }
    },
    fbseg: {
      t: "งบเซกเมนต์ FOUNDATION Fieldbus H1 / PROFIBUS PA", ref: "B2–B3",
      ins: [["vps", "แรงดันจากแหล่งจ่ายเซกเมนต์", "V", "28"], ["nd", "จำนวนอุปกรณ์", "", "12"], ["id", "กระแสต่ออุปกรณ์", "mA", "20"], ["trunk", "ความยาว trunk", "m", "600"], ["rk", "ความต้านทานลูปสาย", "Ω/km", "44"], ["vmin", "แรงดันต่ำสุดที่อุปกรณ์", "V", "9"], ["spare", "เผื่อกระแส", "%", "20"]],
      f: function (x) {
        var I = x.nd * x.id / 1000 * (1 + x.spare / 100), Rt = x.rk * x.trunk / 1000, vend = x.vps - I * Rt, lmax = (x.vps - x.vmin) / I / x.rk * 1000;
        return { rows: [["กระแสรวม (รวมเผื่อ)", n(I * 1000, 0) + " mA"], ["ความต้านทาน trunk (ไป–กลับ)", n(Rt, 1) + " Ω"], ["แรงดันที่ปลายสาย", n(vend, 2) + " V " + ok(vend >= x.vmin, "≥ " + x.vmin + " V")],
          ["ความยาว trunk สูงสุดตามแรงดัน", n(lmax, 0) + " m"], ["ความยาวรวมสูงสุดตามมาตรฐาน (สาย Type A)", "1900 m รวม spur"]],
          note: "44 Ω/km คือความต้านทานลูปของสาย Type A ตาม IEC 61158-2 (≈ 18 AWG) ในงานจริงยังต้องตรวจจำนวนอุปกรณ์ต่อเซกเมนต์ ความยาว spur และข้อจำกัด Ex ของแหล่งจ่าย" };
      }
    },
    rs485: {
      t: "เวลาเฟรม Modbus RTU บน RS-485", ref: "D4–D5",
      ins: [["baud", "Baud rate", "bit/s", "19200"], ["parity", "พาริตี", "sel", "Even", ["Even", "Odd", "None (2 stop)", "None (1 stop)"]], ["nreg", "จำนวนรีจิสเตอร์ที่อ่าน (FC03)", "", "10"], ["nslave", "จำนวนสเลฟที่ต้องโพล", "", "8"], ["proc", "เวลาประมวลผลของสเลฟ", "ms", "5"]],
      f: function (x) {
        var bits = x.parity === "None (1 stop)" ? 10 : 11, tch = bits / x.baud, t35 = x.baud > 19200 ? 1.75e-3 : 3.5 * tch, t15 = x.baud > 19200 ? 0.75e-3 : 1.5 * tch;
        var req = 8, resp = 5 + 2 * x.nreg, cycle = (req + resp) * tch + 2 * t35 + x.proc / 1000, all = cycle * x.nslave;
        return { rows: [["บิตต่ออักขระ", bits], ["เวลาต่ออักขระ", n(tch * 1e6, 1) + " µs"], ["t1.5 / t3.5", n(t15 * 1000, 3) + " / " + n(t35 * 1000, 3) + " ms"], ["คำขอ / คำตอบ", req + " / " + resp + " ไบต์"],
          ["เวลาต่อหนึ่งสเลฟ", n(cycle * 1000, 2) + " ms"], ["รอบโพลทั้งบัส", "<b>" + n(all * 1000, 1) + " ms</b>"]],
          note: "ที่ baud > 19200 มาตรฐานกำหนด t1.5 = 750 µs และ t3.5 = 1.75 ms คงที่ ค่าเริ่มต้นของ Modbus over serial line คือพาริตีคู่ (Even)" };
      }
    },
    battery: {
      t: "อายุแบตเตอรี่ของเซนเซอร์ไร้สาย", ref: "N2–N3",
      ins: [["cap", "ความจุแบตเตอรี่", "mAh", "2600"], ["isl", "กระแสขณะหลับ", "µA", "5"], ["ion", "กระแสขณะวัด+ส่ง", "mA", "30"], ["ton", "เวลาตื่นต่อครั้ง", "ms", "150"], ["per", "ส่งทุก ๆ", "s", "60"], ["derate", "เผื่อการเสื่อม/อุณหภูมิ", "%", "30"]],
      f: function (x) {
        var duty = x.ton / 1000 / x.per, iavg = x.ion * duty + x.isl / 1000 * (1 - duty), h = x.cap * (1 - x.derate / 100) / iavg;
        return { rows: [["duty cycle", pct(duty * 100, 4)], ["กระแสเฉลี่ย", sig(iavg * 1000, 4) + " µA"], ["อายุโดยประมาณ", "<b>" + n(h / 24 / 365, 2) + " ปี</b> (" + n(h / 24, 0) + " วัน)"],
          ["สัดส่วนพลังงานขณะหลับ", pct(x.isl / 1000 * (1 - duty) / iavg * 100, 1)]], note: "ลดรอบการส่งคือคันโยกที่แรงที่สุด รองลงมาคือเวลาตื่น — เหตุที่ WirelessHART และ LoRaWAN ออกแบบให้อุปกรณ์หลับเกือบตลอดเวลา" };
      }
    }
  };

  var api = { cvd: cvd, cvdInv: cvdInv, rtdTol: rtdTol, tcEmf: tcEmf, tcTemp: tcTemp, tcRange: tcRange, tcTol: tcTol, ntcBeta: ntcBeta, ntcBetaInv: ntcBetaInv, steinhart: steinhart,
    orificeC: orificeC, orifice: orifice, crc16: crc16, hex: hex, f32bytes: f32bytes, bytesf32: bytesf32, reorder: reorder, ORDERS: ORDERS, CALC: CALC };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SXCalc = api;
  K.calcs("data-sx", CALC, "sx");
})(typeof window !== "undefined" ? window : globalThis);
