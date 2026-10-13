/* Solar PV design calculators for /learn/solar-pv/ — plain JS, no dependencies.
   Markup: <div class="fg-calc pv-calc" data-pv="string|yield|battery|ac|cable|econ|size"></div>
           <div class="pv-iv" [data-shade="100,100,100"] [data-g="1000"] [data-ta="30"]></div>   (I-V / P-V lab with partial shading)
   Any input can be preset with data-<key>="value" on the host. Inputs accept SI prefixes (5k, 2.2M).
   Exposed for Node checks: window.PVCalc = { ivModule, fitModule, CALC } (module.exports when required). */
(function (root) {
  "use strict";
  var PFX = { M: 1e6, k: 1e3, K: 1e3, m: 1e-3 };
  function parse(s) {
    s = String(s).trim().replace(/−/g, "-").replace(/,/g, "").replace(/\s+/g, "");
    var m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([MkKm]?)$/.exec(s);
    return m ? parseFloat(m[1]) * (PFX[m[2]] || 1) : NaN;
  }
  function n(v, d) {
    if (!isFinite(v)) return "—";
    d = d == null ? 2 : d;
    return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
  }
  var baht = function (v) { return "฿" + n(v, 0); };
  var ok = function (c, t) { return '<span class="pv-chk ' + (c ? "ok" : "bad") + '">' + (c ? "✓ " : "✗ ") + t + "</span>"; };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };

  // ---------------------------------------------------------------- data (approximate, for teaching)
  // Annual mean global horizontal irradiation, kWh/m²/day (≈ peak sun hours). Rounded long-term values in the range
  // published by DEDE's solar map / PVGIS / NASA POWER — check your own site with PVGIS before a real design.
  var SITES = [
    ["ค่าเฉลี่ยประเทศไทย", 5.0], ["กรุงเทพฯ และปริมณฑล", 4.8], ["เชียงใหม่", 5.0], ["นครสวรรค์", 5.1], ["ลพบุรี / สระบุรี", 5.2],
    ["ขอนแก่น / อุดรธานี", 5.1], ["นครราชสีมา", 5.1], ["อุบลราชธานี", 5.2], ["ชลบุรี / ระยอง", 4.9], ["สุราษฎร์ธานี", 4.7],
    ["สงขลา / หาดใหญ่", 4.7], ["ภูเก็ต", 4.6]
  ];
  // relative monthly shape for central Thailand (mean = 1): dry-season peak in Mar–Apr, monsoon dip Aug–Sep
  var MONTH_SHAPE = [0.97, 1.06, 1.13, 1.16, 1.06, 0.98, 0.95, 0.93, 0.92, 0.94, 0.96, 0.94];
  var MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // plane-of-array / horizontal gain at latitude 13–18° N (annual, approximate)
  var ORIENT = [["ทิศใต้ เอียง 10–20°", 1.04], ["แนวราบ 0–5°", 1.0], ["ทิศใต้ เอียง 30°", 1.02], ["ตะวันออก/ตะวันตก เอียง 15°", 0.95], ["ทิศเหนือ เอียง 15°", 0.88], ["ผนังแนวตั้งทิศใต้", 0.62]];
  // cell temperature rise above ambient, energy-weighted (°C)
  var MOUNT = [["ยกลอยบนหลังคา มีช่องลม", 25], ["ฟาร์มพื้นดิน โครงเปิด", 22], ["ติดชิดหลังคา ช่องลมน้อย", 32], ["ลอยน้ำ (floating)", 18]];
  var sel = function (list) { return list.map(function (x) { return x[0]; }); };
  var pick = function (list, name) { for (var i = 0; i < list.length; i++) if (list[i][0] === name) return list[i][1]; return list[0][1]; };

  // ---------------------------------------------------------------- tiny SVG plotting
  function svgChart(o) {
    // o: {w,h, xs:[min,max], ys:[min,max], y2s?, xl, yl, y2l, series:[{pts:[[x,y]], cls, axis:2?, bars?}], marks:[{x,y,cls,label,axis}], xt:[ticks], yt, y2t, xlab:fn}
    var W = o.w || 640, H = o.h || 300, L = 54, R = o.y2s ? 56 : 16, T = 14, B = 40;
    var X = function (x) { return L + ((x - o.xs[0]) / (o.xs[1] - o.xs[0])) * (W - L - R); };
    var Y = function (y, ax) { var s = ax === 2 ? o.y2s : o.ys; return H - B - ((y - s[0]) / (s[1] - s[0])) * (H - T - B); };
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "กราฟ") + '">';
    (o.yt || []).forEach(function (t) { s += '<line class="gr" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text class="tk" x="' + (L - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + (o.yf ? o.yf(t) : t) + "</text>"; });
    (o.y2t || []).forEach(function (t) { s += '<text class="tk t2" x="' + (W - R + 6) + '" y="' + (Y(t, 2) + 4) + '">' + (o.y2f ? o.y2f(t) : t) + "</text>"; });
    (o.xt || []).forEach(function (t, i) { var lab = o.xlab ? o.xlab(t, i) : t; s += '<text class="tk" x="' + X(t) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + lab + "</text>"; });
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(o.ys[0] < 0 && o.ys[1] > 0 ? 0 : o.ys[0]) + '" y2="' + Y(o.ys[0] < 0 && o.ys[1] > 0 ? 0 : o.ys[0]) + '"/>';
    s += '<line class="ax" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    if (o.xl) s += '<text class="al" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + o.xl + "</text>";
    if (o.yl) s += '<text class="al c1" x="12" y="' + (T + (H - T - B) / 2) + '" transform="rotate(-90 12 ' + (T + (H - T - B) / 2) + ')" text-anchor="middle">' + o.yl + "</text>";
    if (o.y2l) s += '<text class="al c2" x="' + (W - 10) + '" y="' + (T + (H - T - B) / 2) + '" transform="rotate(90 ' + (W - 10) + " " + (T + (H - T - B) / 2) + ')" text-anchor="middle">' + o.y2l + "</text>";
    o.series.forEach(function (se) {
      if (se.bars) {
        var bw = ((W - L - R) / (o.xs[1] - o.xs[0])) * (se.bw || 0.7);
        se.pts.forEach(function (p) { var y0 = Y(0, se.axis), y1 = Y(p[1], se.axis); s += '<rect class="' + se.cls + '" x="' + (X(p[0]) - bw / 2) + '" y="' + Math.min(y0, y1) + '" width="' + bw + '" height="' + Math.abs(y0 - y1) + '"/>'; });
      } else {
        s += '<polyline class="' + se.cls + '" points="' + se.pts.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1], se.axis).toFixed(1); }).join(" ") + '"/>';
      }
    });
    (o.marks || []).forEach(function (m) {
      s += '<circle class="' + (m.cls || "dot") + '" cx="' + X(m.x) + '" cy="' + Y(m.y, m.axis) + '" r="5"/>';
      if (m.label) s += '<text class="ml" x="' + (X(m.x) + (m.dx || 8)) + '" y="' + (Y(m.y, m.axis) - 8) + '"' + (m.anchor ? ' text-anchor="' + m.anchor + '"' : "") + ">" + m.label + "</text>";
    });
    return s + "</svg>";
  }
  function niceTicks(max, count) {
    var raw = max / (count || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p, out = [];
    for (var t = 0; t <= max * 1.0001; t += step) out.push(+t.toPrecision(10));
    return { ticks: out, top: out[out.length - 1] < max ? out[out.length - 1] + step : out[out.length - 1] };
  }

  // ---------------------------------------------------------------- PV module model (single diode, Rs, no Rsh)
  var KQ = 1.380649e-23 / 1.602176634e-19;
  // fit I0 and Rs so that the curve passes through Voc, Isc and (Vmp, Imp) at STC
  function fitModule(m) {
    var nId = m.n || 1.2, a = nId * m.cells * KQ * 298.15, I0 = m.isc / (Math.exp(m.voc / a) - 1);
    var Rs = (a * Math.log((m.isc - m.imp) / I0 + 1) - m.vmp) / m.imp;
    for (var k = 0; k < 20 && Rs < 0; k++) { nId -= 0.05; a = nId * m.cells * KQ * 298.15; I0 = m.isc / (Math.exp(m.voc / a) - 1); Rs = (a * Math.log((m.isc - m.imp) / I0 + 1) - m.vmp) / m.imp; }
    return { nId: nId, Rs: Math.max(Rs, 0) };
  }
  // module I-V at irradiance g (W/m²), cell temperature tc (°C), per-substring irradiance fractions shade[] (0..1)
  function ivModule(m, g, tc, shade, bypass) {
    var fit = fitModule(m), subs = shade.length, cs = m.cells / subs;
    var isc = m.isc * (1 + (m.alpha / 100) * (tc - 25)), voc = m.voc * (1 + (m.beta / 100) * (tc - 25));
    var a = fit.nId * m.cells * KQ * (tc + 273.15), I0 = isc / (Math.exp(voc / a) - 1);
    var as = a / subs, rs = fit.Rs / subs, vbp = 0.45;
    var iph = shade.map(function (f) { return isc * (g / 1000) * f; });
    var imax = Math.max.apply(null, iph), imin = Math.min.apply(null, iph);
    var top = bypass === false ? imin : imax;
    var pts = [], N = 700;
    for (var k = 0; k <= N; k++) {
      // denser sampling near each knee: map k through a smooth curve
      var I = top * (k / N) * (k < N ? 1 : 0.999999);
      var V = 0, valid = true;
      for (var j = 0; j < subs; j++) {
        if (I < iph[j]) V += Math.max(as * Math.log((iph[j] - I) / I0 + 1) - I * rs, bypass === false ? -1e9 : -vbp);
        else if (bypass === false) { valid = false; break; }
        else V -= vbp;
      }
      if (valid) pts.push([V, I]);
    }
    // extra points close to every substring knee
    iph.forEach(function (ip) { for (var e = 1; e <= 6; e++) { var I = ip * (1 - Math.pow(10, -e)); if (I > top) continue; var V = 0; for (var j = 0; j < subs; j++) V += I < iph[j] ? Math.max(as * Math.log((iph[j] - I) / I0 + 1) - I * rs, -vbp) : -vbp; pts.push([V, I]); } });
    pts = pts.filter(function (p) { return p[0] >= 0; }).sort(function (x, y) { return x[0] - y[0]; });
    if (!pts.length || pts[0][0] > 1e-6) {
      // short-circuit current: solve V(I) = 0 by bisection
      var lo = 0, hi = top;
      var Vf = function (I) { var V = 0; for (var j = 0; j < subs; j++) V += I < iph[j] ? Math.max(as * Math.log((iph[j] - I) / I0 + 1) - I * rs, -vbp) : -vbp; return V; };
      for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (Vf(mid) > 0) lo = mid; else hi = mid; }
      pts.unshift([0, lo]);
    }
    var best = { p: -1 };
    pts.forEach(function (p) { var P = p[0] * p[1]; if (P > best.p) best = { v: p[0], i: p[1], p: P }; });
    // P&O started at the open-circuit end climbs down in voltage and stops at the first local maximum
    var po = null, last = -1, run = 0;
    for (var q = pts.length - 1; q >= 0; q--) {
      var P = pts[q][0] * pts[q][1];
      if (P >= last) { last = P; po = { v: pts[q][0], i: pts[q][1], p: P }; run = 0; }
      else if (++run > 8 && P < last * 0.985) break;
    }
    return { pts: pts, mpp: best, po: po, voc: pts[pts.length - 1][0], isc: pts[0][1] };
  }

  // ---------------------------------------------------------------- calculators
  // input: [key, label, unit | "sel", default, options?]
  var CALC = {
    string: {
      t: "ออกแบบสตริง: จำนวนแผงต่ออนุกรมและจับคู่อินเวอร์เตอร์", ref: "D1–D8",
      ins: [["pmax", "แผง P_max (STC)", "Wp", "580"], ["voc", "V_oc", "V", "52.2"], ["vmp", "V_mp", "V", "43.4"], ["isc", "I_sc", "A", "14.1"], ["imp", "I_mp", "A", "13.37"],
        ["beta", "β V_oc", "%/°C", "-0.25"], ["gamma", "γ P_max", "%/°C", "-0.29"], ["alpha", "α I_sc", "%/°C", "0.045"],
        ["tmin", "อุณหภูมิต่ำสุดของพื้นที่", "°C", "10"], ["tmax", "อุณหภูมิเซลล์สูงสุด", "°C", "70"],
        ["vdc", "อินเวอร์เตอร์ V_dc,max", "V", "600"], ["mpmin", "ช่วง MPPT ต่ำสุด", "V", "120"], ["mpmax", "ช่วง MPPT สูงสุด", "V", "550"],
        ["imppt", "กระแสเข้าสูงสุด/MPPT", "A", "16"], ["iscmax", "I_sc สูงสุด/MPPT", "A", "22"], ["nmppt", "จำนวน MPPT", "", "2"], ["pac", "พิกัด AC อินเวอร์เตอร์", "kW", "5"],
        ["ns", "เลือก: แผง/สตริง", "", "5"], ["np", "เลือก: จำนวนสตริงทั้งหมด", "", "2"]],
      f: function (x) {
        var bv = x.beta / 100, bmp = (x.gamma - x.alpha) / 100;
        var vocC = x.voc * (1 + bv * (x.tmin - 25)), vmpH = x.vmp * (1 + bmp * (x.tmax - 25)), vmpC = x.vmp * (1 + bmp * (x.tmin - 25));
        var nmax = Math.floor(x.vdc / vocC), nmin = Math.ceil(x.mpmin / vmpH), nmp = Math.floor(x.mpmax / vmpC);
        var npm = Math.max(1, Math.floor(x.imppt / x.imp + 1e-9)), iscOK = x.isc * 1.25 <= x.iscmax;
        var ns = Math.round(x.ns), np = Math.round(x.np), perM = Math.ceil(np / Math.max(1, x.nmppt));
        var kwp = (ns * np * x.pmax) / 1000, ratio = kwp / x.pac;
        return {
          rows: [
            ["V_oc ที่ " + x.tmin + " °C (หนาวสุด)", n(vocC) + " V"],
            ["V_mp ที่เซลล์ " + x.tmax + " °C (ร้อนสุด)", n(vmpH) + " V"],
            ["V_mp ที่ " + x.tmin + " °C", n(vmpC) + " V"],
            ["แผง/สตริง สูงสุด (ไม่เกิน V_dc,max)", nmax + " แผง"],
            ["แผง/สตริง ต่ำสุด (ยังอยู่ในช่วง MPPT ตอนร้อน)", nmin + " แผง"],
            ["แผง/สตริง สูงสุดที่ V_mp ยังไม่เกินช่วง MPPT", nmp + " แผง"],
            ["ช่วงที่ใช้ได้", nmin <= Math.min(nmax, nmp) ? nmin + "–" + Math.min(nmax, nmp) + " แผง" : "ไม่มี — เปลี่ยนอินเวอร์เตอร์"],
            ["สตริงขนานต่อ MPPT (ตามกระแส)", npm + " สตริง"],
            ["ตรวจ 1.25 × I_sc ≤ I_sc,max", ok(iscOK, n(1.25 * x.isc * Math.min(perM, npm)) + " A")],
            ["— แบบที่เลือก —", ns + " แผง × " + np + " สตริง"],
            ["ขนาดแผงรวม", n(kwp, 2) + " kWp"],
            ["V_oc สตริงตอนหนาว", ok(ns * vocC <= x.vdc, n(ns * vocC, 1) + " V ≤ " + x.vdc)],
            ["V_mp สตริงตอนร้อน", ok(ns * vmpH >= x.mpmin, n(ns * vmpH, 1) + " V ≥ " + x.mpmin)],
            ["V_mp สตริงตอนหนาว", ok(ns * vmpC <= x.mpmax, n(ns * vmpC, 1) + " V ≤ " + x.mpmax)],
            ["สตริงต่อ MPPT", ok(perM <= npm, perM + " (กระแส " + n(perM * x.imp, 1) + " A ≤ " + x.imppt + ")")],
            ["DC/AC ratio", ok(ratio >= 0.9 && ratio <= 1.5, n(ratio, 2) + " (แนะนำ 1.1–1.3)")]
          ]
        };
      }
    },
    yield: {
      t: "คาดการณ์พลังงานที่ผลิตได้และ Performance Ratio", ref: "E1–E7",
      ins: [["kwp", "ขนาดระบบ", "kWp", "5"], ["site", "พื้นที่", "sel", "กรุงเทพฯ และปริมณฑล", sel(SITES)], ["orient", "ทิศและมุมเอียง", "sel", "ทิศใต้ เอียง 10–20°", sel(ORIENT)],
        ["mount", "การติดตั้ง", "sel", "ยกลอยบนหลังคา มีช่องลม", sel(MOUNT)], ["ta", "อุณหภูมิอากาศเฉลี่ยกลางวัน", "°C", "33"], ["gamma", "γ P_max", "%/°C", "-0.29"],
        ["soil", "ฝุ่น/สิ่งสกปรก", "%", "3"], ["shade", "เงาบัง", "%", "0"], ["mis", "mismatch + LID", "%", "2"], ["dcw", "สาย DC", "%", "1.5"],
        ["inv", "ประสิทธิภาพอินเวอร์เตอร์", "%", "97.5"], ["acw", "สาย AC", "%", "0.5"], ["lowg", "แสงน้อย + มุมตกกระทบ", "%", "3"], ["avail", "หยุดทำงาน/ตัดไฟ", "%", "1"]],
      f: function (x) {
        var ghi = pick(SITES, x.site), poa = ghi * pick(ORIENT, x.orient);
        var tl = Math.max(0, (-x.gamma / 100) * (x.ta + pick(MOUNT, x.mount) - 25));
        var chain = [["อุณหภูมิ", tl], ["ฝุ่น", x.soil / 100], ["เงา", x.shade / 100], ["mismatch/LID", x.mis / 100], ["สาย DC", x.dcw / 100], ["อินเวอร์เตอร์", 1 - x.inv / 100], ["สาย AC", x.acw / 100], ["แสงน้อย/IAM", x.lowg / 100], ["หยุดทำงาน", x.avail / 100]];
        var pr = chain.reduce(function (a, c) { return a * (1 - c[1]); }, 1);
        var yr = x.kwp * poa * 365 * pr;
        var months = MONTH_SHAPE.map(function (s, i) { return x.kwp * poa * s * DAYS[i] * pr; });
        var tk = niceTicks(Math.max.apply(null, months) * 1.1, 4);
        var svg = svgChart({ w: 640, h: 230, xs: [0.4, 12.6], ys: [0, tk.top], yt: tk.ticks, xt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], xlab: function (t) { return MONTHS[t - 1]; }, yl: "kWh/เดือน", label: "พลังงานรายเดือนโดยประมาณ",
          series: [{ bars: true, cls: "bar", pts: months.map(function (v, i) { return [i + 1, v]; }) }] });
        return {
          rows: [["GHI เฉลี่ย (= ชั่วโมงแดดสูงสุด PSH)", n(ghi, 1) + " kWh/m²/วัน"], ["บนระนาบแผง (POA)", n(poa, 2) + " kWh/m²/วัน"]]
            .concat(chain.map(function (c) { return ["  สูญเสีย: " + c[0], n(c[1] * 100, 1) + " %"]; }))
            .concat([["Performance Ratio (PR)", n(pr * 100, 1) + " %"], ["ผลผลิตจำเพาะ", n(poa * 365 * pr, 0) + " kWh/kWp/ปี"], ["ต่อวันเฉลี่ย", n(yr / 365, 1) + " kWh/วัน"], ["ต่อเดือนเฉลี่ย", n(yr / 12, 0) + " kWh/เดือน"], ["ต่อปี (ปีแรก)", n(yr, 0) + " kWh/ปี"], ["Capacity factor (เทียบ kWp)", n((yr / (x.kwp * 8760)) * 100, 1) + " %"]]),
          svg: svg, note: "ค่าแสงอาทิตย์เป็นค่าประมาณระยะยาวเพื่อการเรียน งานจริงให้ดึงข้อมูลรายชั่วโมงของพิกัดจริงจาก PVGIS หรือ แผนที่ศักยภาพพลังงานแสงอาทิตย์ของ พพ."
        };
      }
    },
    size: {
      t: "เลือกขนาดระบบจากบิลค่าไฟ (On-grid ใช้เองกลางวัน)", ref: "L1–L5",
      ins: [["kwh", "หน่วยไฟต่อเดือน (จากบิล)", "kWh", "600"], ["day", "สัดส่วนที่ใช้ช่วงมีแดด 08–17 น.", "%", "45"], ["yld", "ผลผลิตจำเพาะ", "kWh/kWp/ปี", "1350"], ["self", "เป้าหมายใช้เองได้", "%", "90"], ["wp", "แผงที่ใช้", "Wp", "580"], ["tariff", "ค่าไฟเฉลี่ยรวม Ft + VAT", "฿/kWh", "4.2"]],
      f: function (x) {
        var dayE = (x.kwh * x.day) / 100 / 30, kwpD = (dayE * 365) / x.yld / (x.self / 100);
        var panels = Math.ceil((kwpD * 1000) / x.wp), kwp = (panels * x.wp) / 1000, gen = (kwp * x.yld) / 12;
        var used = Math.min(gen * (x.self / 100), (x.kwh * x.day) / 100);
        return { rows: [["ใช้ไฟช่วงกลางวัน", n(dayE, 1) + " kWh/วัน"], ["ขนาดที่พอดีกับโหลดกลางวัน", n(kwpD, 2) + " kWp"], ["จำนวนแผง", panels + " แผง = " + n(kwp, 2) + " kWp"], ["ผลิตได้เฉลี่ย", n(gen, 0) + " kWh/เดือน"], ["ใช้เองได้ประมาณ", n(used, 0) + " kWh/เดือน"], ["ประหยัดค่าไฟประมาณ", baht(used * x.tariff) + "/เดือน"], ["ลดบิลได้", n((used / x.kwh) * 100, 0) + " %"]],
          note: "ถ้าไม่มีแบตเตอรี่ ขนาดที่ใหญ่กว่าโหลดกลางวันจะส่งไฟคืนกริดในราคารับซื้อที่ต่ำกว่าค่าไฟ ระยะคืนทุนจึงยาวขึ้น" };
      }
    },
    battery: {
      t: "ขนาดแบตเตอรี่และอินเวอร์เตอร์ (Hybrid / Off-grid)", ref: "B1–B7",
      ins: [["e", "พลังงานที่ต้องใช้จากแบต/วัน", "kWh", "6"], ["days", "จำนวนวันสำรอง (autonomy)", "วัน", "1"], ["dod", "ความลึกการคายประจุ DoD", "%", "90"], ["eff", "ประสิทธิภาพแบต + อินเวอร์เตอร์", "%", "90"],
        ["v", "แรงดันระบบ", "V", "51.2"], ["mod", "ขนาดแบตต่อลูก", "kWh", "5.12"], ["pk", "โหลดสูงสุดพร้อมกัน", "kW", "3.5"], ["surge", "กระแสกระชาก/พิกัด (มอเตอร์/คอมเพรสเซอร์)", "เท่า", "3"],
        ["load", "พลังงานโหลดทั้งวัน (ใช้ประเมินแผงสำหรับ off-grid)", "kWh", "10"], ["psh", "ชั่วโมงแดดเดือนแย่สุด", "h", "4.2"]],
      f: function (x) {
        var need = (x.e * x.days) / (x.eff / 100), nom = need / (x.dod / 100), ah = (nom * 1000) / x.v, mods = Math.ceil(nom / x.mod - 1e-9);
        var inv = x.pk * 1.25, idc = (x.pk * 1000) / (x.v * 0.94), c = idc / ((mods * x.mod * 1000) / x.v);
        var pv = x.load / (x.psh * 0.65);
        return { rows: [["พลังงานที่แบตต้องจ่ายจริง", n(need, 2) + " kWh"], ["ความจุพิกัดที่ต้องการ", n(nom, 2) + " kWh"], ["= ที่แรงดัน " + x.v + " V", n(ah, 0) + " Ah"], ["จำนวนลูก " + x.mod + " kWh", mods + " ลูก = " + n(mods * x.mod, 2) + " kWh"],
          ["อินเวอร์เตอร์ต่อเนื่อง ≥ 1.25 × โหลดสูงสุด", n(inv, 2) + " kW"], ["ต้องรับกำลังกระชากได้", n(x.pk * x.surge, 1) + " kW (ไม่กี่วินาที)"], ["กระแส DC จากแบตที่โหลดสูงสุด", n(idc, 0) + " A"],
          ["C-rate ที่โหลดสูงสุด", ok(c <= 0.5, n(c, 2) + " C (LiFePO4 ทั่วไป ≤ 0.5C ต่อเนื่อง)")], ["Off-grid: แผงขั้นต่ำ (PR off-grid ≈ 0.65)", n(pv, 2) + " kWp"]] };
      }
    },
    ac: {
      t: "โซลาร์เซลล์สำหรับแอร์: ขนาดแผงและค่าไฟที่ประหยัด", ref: "H1–H6",
      ins: [["btu", "ขนาดแอร์", "BTU/h", "12000"], ["seer", "SEER (ฉลากเบอร์ 5)", "BTU/h/W", "20"], ["eer", "EER ที่พิกัด", "BTU/h/W", "12"], ["lf", "ภาระเฉลี่ยเทียบพิกัด", "%", "80"],
        ["hours", "เปิดต่อวัน", "ชม.", "8"], ["dayh", "ในนั้นเป็นช่วงมีแดด 09–16 น.", "ชม.", "6"], ["units", "จำนวนเครื่อง", "", "1"], ["psh", "ชั่วโมงแดดสูงสุด", "h", "4.8"], ["pr", "PR", "%", "78"], ["wp", "แผง", "Wp", "580"], ["tariff", "ค่าไฟ", "฿/kWh", "4.2"]],
      f: function (x) {
        var qkw = x.btu * 0.29307e-3, prated = x.btu / x.eer / 1000, pavg = (x.btu * (x.lf / 100)) / x.seer / 1000;
        var eDay = pavg * x.hours * x.units, eSun = pavg * x.dayh * x.units;
        var kwpE = eSun / (x.psh * (x.pr / 100)), kwpP = (pavg * x.units) / 0.55, kwp = Math.max(kwpE, kwpP), panels = Math.ceil((kwp * 1000) / x.wp);
        return { rows: [["ความเย็น", n(qkw, 2) + " kW (ความร้อนที่ดึงออก)"], ["กำลังไฟฟ้าที่พิกัด", n(prated, 2) + " kW/เครื่อง"], ["กำลังเฉลี่ยขณะเปิด", n(pavg, 2) + " kW/เครื่อง"], ["COP เฉลี่ย", n((x.seer * 0.29307), 2)],
          ["พลังงานต่อวัน (ทุกเครื่อง)", n(eDay, 1) + " kWh"], ["ช่วงมีแดด", n(eSun, 1) + " kWh"], ["แผงตามพลังงานกลางวัน", n(kwpE, 2) + " kWp"], ["แผงตามกำลังช่วงเช้า–บ่าย (55 %)", n(kwpP, 2) + " kWp"],
          ["แนะนำ", panels + " แผง ≈ " + n((panels * x.wp) / 1000, 2) + " kWp"], ["ค่าไฟแอร์ทั้งเดือน (ไม่มีโซลาร์)", baht(eDay * 30 * x.tariff)], ["ประหยัดได้ประมาณ", baht(Math.min(eSun, (panels * x.wp / 1000) * x.psh * x.pr / 100) * 30 * x.tariff) + "/เดือน"]] };
      }
    },
    cable: {
      t: "แรงดันตกและขนาดสาย", ref: "W1–W4",
      ins: [["sys", "ระบบ", "sel", "DC (สตริง/แบต)", ["DC (สตริง/แบต)", "AC 1 เฟส", "AC 3 เฟส"]], ["l", "ความยาวทางเดียว", "m", "25"], ["i", "กระแส", "A", "13.4"], ["v", "แรงดัน", "V", "350"],
        ["a", "ขนาดสายที่เลือก", "mm²", "4"], ["t", "อุณหภูมิตัวนำ", "°C", "70"], ["lim", "เป้าหมายแรงดันตก", "%", "1.5"]],
      f: function (x) {
        var rho = 0.017241 * (1 + 0.00393 * (x.t - 20)), k = x.sys === "AC 3 เฟส" ? Math.sqrt(3) : 2;
        var dv = (k * x.l * x.i * rho) / x.a, pct = (dv / x.v) * 100, loss = x.sys === "AC 3 เฟส" ? 3 * x.i * x.i * (x.l * rho / x.a) : 2 * x.i * x.i * (x.l * rho / x.a);
        var sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240], need = (k * x.l * x.i * rho) / ((x.lim / 100) * x.v), pickA = sizes.filter(function (s) { return s >= need; })[0];
        return { rows: [["ρ ทองแดงที่ " + x.t + " °C", n(rho, 5) + " Ω·mm²/m"], ["แรงดันตก", n(dv, 2) + " V"], ["คิดเป็น", ok(pct <= x.lim, n(pct, 2) + " %")], ["กำลังสูญเสียในสาย", n(loss, 1) + " W"], ["ขนาดขั้นต่ำตามแรงดันตก", n(need, 2) + " mm² → ใช้ " + (pickA || ">240") + " mm²"]],
          note: "ขนาดสายต้องผ่านทั้งเงื่อนไขกระแส (ampacity ตามวิธีเดินสายและอุณหภูมิ) และแรงดันตก เลือกค่าที่ใหญ่กว่า สาย DC ของโซลาร์ใช้สาย PV1-F / H1Z2Z2-K ตาม EN 50618" };
      }
    },
    pump: {
      t: "ปั๊มน้ำโซลาร์เพื่อการเกษตร: น้ำที่ต้องการ หัวสูบ และขนาดแผง", ref: "K1–K6",
      ins: [["rai", "พื้นที่เพาะปลูก", "ไร่", "5"], ["et0", "ET₀ (ฤดูแล้ง)", "mm/วัน", "5"], ["kc", "ค่าสัมประสิทธิ์พืช K_c", "", "1.0"], ["eff", "ประสิทธิภาพการให้น้ำ (หยด ≈ 90)", "%", "90"],
        ["hs", "ระดับน้ำนิ่งถึงปากบ่อ/ผิวน้ำ", "m", "20"], ["hd", "ระดับน้ำลดขณะสูบ", "m", "5"], ["hf", "สูญเสียในท่อ + ข้อต่อ", "m", "3"], ["ho", "แรงดันที่หัวจ่าย/ยกสูงถังพัก", "m", "10"],
        ["hrs", "ชั่วโมงสูบต่อวัน (ช่วงแดดดี)", "h", "6"], ["eta", "ประสิทธิภาพสาย-ถึง-น้ำ (wire-to-water)", "%", "50"], ["psh", "ชั่วโมงแดดสูงสุด", "h", "5"], ["pr", "PR ระบบปั๊ม", "%", "75"], ["wp", "แผง", "Wp", "580"]],
      f: function (x) {
        var v = (x.rai * 1600 * x.et0 * x.kc) / 1000 / (x.eff / 100), H = x.hs + x.hd + x.hf + x.ho, q = v / x.hrs;
        var ph = (q * H) / 367, pel = ph / (x.eta / 100), e = (v * H) / 367 / (x.eta / 100), kwp = e / (x.psh * (x.pr / 100)), panels = Math.ceil((kwp * 1000) / x.wp);
        return { rows: [["น้ำที่ต้องการ", n(v, 1) + " m³/วัน"], ["อัตราไหลเฉลี่ย", n(q, 2) + " m³/h"], ["หัวสูบรวม (TDH)", n(H, 1) + " m"], ["กำลังไฮดรอลิก", n(ph, 2) + " kW"],
          ["กำลังไฟฟ้าขาเข้าปั๊ม (ขณะสูบ)", n(pel, 2) + " kW"], ["พลังงานไฟฟ้าต่อวัน", n(e, 2) + " kWh"], ["แผงที่ต้องใช้", n(kwp, 2) + " kWp"], ["จำนวนแผง", panels + " แผง = " + n((panels * x.wp) / 1000, 2) + " kWp"],
          ["น้ำต่อ 1 kWp ที่หัวสูบนี้", n((x.psh * (x.pr / 100) * (x.eta / 100) * 367) / H, 1) + " m³/วัน"]],
          note: "ค่า ET₀ และ K_c ขึ้นกับพืช ฤดู และพื้นที่ ใช้ข้อมูลของกรมชลประทานหรือกรมพัฒนาที่ดินเมื่อออกแบบจริง เลือกปั๊มจากกราฟ Q-H ของผู้ผลิตที่จุดทำงานนี้" };
      }
    },
    econ: {
      t: "ความคุ้มค่า: ระยะคืนทุน NPV IRR และ LCOE", ref: "F1–F8",
      ins: [["kwp", "ขนาดระบบ", "kWp", "5"], ["cost", "ราคาติดตั้ง", "฿/kWp", "30000"], ["yld", "ผลผลิตจำเพาะ", "kWh/kWp/ปี", "1350"], ["self", "สัดส่วนใช้เอง", "%", "80"],
        ["tariff", "ค่าไฟที่ประหยัดได้", "฿/kWh", "4.2"], ["exp", "ราคารับซื้อไฟส่วนเกิน", "฿/kWh", "2.2"], ["esc", "ค่าไฟขึ้นปีละ", "%", "1.5"], ["deg", "แผงเสื่อมปีละ", "%", "0.5"],
        ["om", "ค่าดูแลต่อปี (% ของเงินลงทุน)", "%", "1"], ["invr", "เปลี่ยนอินเวอร์เตอร์ปีที่ 12 (% ของเงินลงทุน)", "%", "12"], ["disc", "อัตราคิดลด", "%", "5"], ["life", "อายุโครงการ", "ปี", "25"]],
      f: function (x) {
        var capex = x.kwp * x.cost, life = Math.round(x.life), cf = [-capex], cum = [[0, -capex]], c = -capex, pb = null, dpb = null, dc = -capex, pvE = 0, pvC = capex, y1 = 0;
        for (var y = 1; y <= life; y++) {
          var e = x.kwp * x.yld * Math.pow(1 - x.deg / 100, y - 1), t = x.tariff * Math.pow(1 + x.esc / 100, y - 1);
          var save = e * (x.self / 100) * t + e * (1 - x.self / 100) * x.exp, cost = capex * (x.om / 100) + (y === 12 ? capex * (x.invr / 100) : 0), net = save - cost;
          if (y === 1) y1 = net;
          cf.push(net); var prev = c; c += net; cum.push([y, c]);
          if (pb === null && c >= 0) pb = y - 1 + -prev / net;
          var df = Math.pow(1 + x.disc / 100, y), pdc = dc; dc += net / df; if (dpb === null && dc >= 0) dpb = y - 1 + -pdc / (net / df);
          pvE += e / df; pvC += cost / df;
        }
        var npv = cf.reduce(function (a, v, i) { return a + v / Math.pow(1 + x.disc / 100, i); }, 0);
        var irr = NaN, lo = -0.9, hi = 1.5, f = function (r) { return cf.reduce(function (a, v, i) { return a + v / Math.pow(1 + r, i); }, 0); };
        if (f(lo) * f(hi) < 0) { for (var it = 0; it < 100; it++) { var mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } irr = (lo + hi) / 2; }
        var mx = Math.max.apply(null, cum.map(function (p) { return p[1]; })), mn = Math.min.apply(null, cum.map(function (p) { return p[1]; }));
        var span = mx - mn, tk = niceTicks(span, 5), step = tk.ticks[1] || span, lo2 = Math.floor(mn / step) * step, hi2 = Math.ceil(mx / step) * step, yt = [];
        for (var v = lo2; v <= hi2 + 1e-6; v += step) yt.push(v);
        var svg = svgChart({ w: 640, h: 240, xs: [0, life], ys: [lo2, hi2], yt: yt, yf: function (t) { return Math.abs(t) >= 1e6 ? (t / 1e6).toFixed(1) + "M" : Math.round(t / 1000) + "k"; }, xt: [0, 5, 10, 15, 20, 25].filter(function (t) { return t <= life; }), xl: "ปี", yl: "เงินสดสะสม (฿)", label: "กระแสเงินสดสะสม",
          series: [{ cls: "w1", pts: cum }], marks: pb !== null ? [{ x: pb, y: 0, label: "คืนทุน " + n(pb, 1) + " ปี" }] : [] });
        return { rows: [["เงินลงทุน", baht(capex)], ["ผลประหยัดสุทธิปีแรก", baht(y1)], ["ระยะคืนทุนอย่างง่าย", pb === null ? "เกินอายุโครงการ" : n(pb, 1) + " ปี"], ["ระยะคืนทุนคิดลด", dpb === null ? "เกินอายุโครงการ" : n(dpb, 1) + " ปี"],
          ["NPV ที่ " + x.disc + " %", baht(npv)], ["IRR", isFinite(irr) ? n(irr * 100, 1) + " %" : "—"], ["LCOE", n(pvC / pvE, 2) + " ฿/kWh"], ["เงินสดสะสมสิ้นปีที่ " + life, baht(c)]], svg: svg };
      }
    }
  };

  function buildCalc(host) {
    var c = CALC[host.getAttribute("data-pv")];
    if (!c) return;
    host.innerHTML = "";
    var h = document.createElement("p"); h.className = "fc-t"; h.innerHTML = "<b>" + c.t + "</b>" + (c.ref ? ' <span class="mono">สูตร ' + c.ref + "</span>" : ""); host.appendChild(h);
    var form = document.createElement("div"); form.className = "fc-in"; host.appendChild(form);
    var out = document.createElement("dl"); out.className = "fc-out"; out.setAttribute("aria-live", "polite"); host.appendChild(out);
    var fig = document.createElement("div"); fig.className = "pv-fig"; host.appendChild(fig);
    var note = document.createElement("p"); note.className = "pv-note"; host.appendChild(note);
    var inputs = {};
    c.ins.forEach(function (d) {
      var id = "pv" + Math.random().toString(36).slice(2, 8), w = document.createElement("label"); w.setAttribute("for", id);
      w.innerHTML = "<span>" + d[1] + "</span>";
      var el;
      if (d[2] === "sel") { el = document.createElement("select"); d[4].forEach(function (o) { var op = document.createElement("option"); op.textContent = o; el.appendChild(op); }); el.value = d[3]; }
      else { el = document.createElement("input"); el.type = "text"; el.inputMode = "decimal"; el.value = d[3]; el.spellcheck = false; }
      var pre = host.getAttribute("data-" + d[0]); if (pre != null) el.value = pre;
      el.id = id; w.appendChild(el);
      if (d[2] && d[2] !== "sel") { var u = document.createElement("i"); u.textContent = d[2]; w.appendChild(u); }
      form.appendChild(w); inputs[d[0]] = el;
      el.addEventListener("input", run); el.addEventListener("change", run);
    });
    function run() {
      var x = {}, bad = false;
      c.ins.forEach(function (d) { var v = inputs[d[0]].value; if (d[2] === "sel") x[d[0]] = v; else { x[d[0]] = parse(v); if (!isFinite(x[d[0]])) bad = true; } });
      if (bad) { out.innerHTML = "<dt>ใส่ตัวเลขให้ครบ</dt><dd>—</dd>"; fig.innerHTML = ""; return; }
      var r = c.f(x);
      out.innerHTML = r.rows.map(function (q) { return "<dt>" + q[0] + "</dt><dd>" + q[1] + "</dd>"; }).join("");
      fig.innerHTML = r.svg || "";
      note.textContent = r.note || ""; note.hidden = !r.note;
    }
    run();
  }

  // ---------------------------------------------------------------- I-V lab with partial shading
  var MODULE = { pmax: 580, voc: 52.2, vmp: 43.4, isc: 14.1, imp: 13.37, cells: 72, alpha: 0.045, beta: -0.25, noct: 43 };
  function buildIV(host) {
    var sh = (host.getAttribute("data-shade") || "100,100,100").split(",").map(Number);
    var st = { g: +(host.getAttribute("data-g") || 1000), ta: +(host.getAttribute("data-ta") || 25), cellT: host.hasAttribute("data-stc"), s: sh, bypass: true };
    host.innerHTML =
      '<p class="fc-t"><b>แล็บเส้นโค้ง I-V และ P-V ของแผง 580 Wp (3 สตริงย่อย + บายพาสไดโอด)</b> <span class="mono">สูตร P1–P8, T6</span></p>' +
      '<div class="pv-ctl">' +
      '<label>แสง G <output data-o="g"></output><input type="range" min="100" max="1100" step="10" data-k="g"></label>' +
      '<label>อุณหภูมิอากาศ <output data-o="ta"></output><input type="range" min="0" max="45" step="1" data-k="ta"></label>' +
      '<label>สตริงย่อย 1 <output data-o="s0"></output><input type="range" min="0" max="100" step="5" data-k="s0"></label>' +
      '<label>สตริงย่อย 2 <output data-o="s1"></output><input type="range" min="0" max="100" step="5" data-k="s1"></label>' +
      '<label>สตริงย่อย 3 <output data-o="s2"></output><input type="range" min="0" max="100" step="5" data-k="s2"></label>' +
      '<label class="pv-cb"><input type="checkbox" data-k="cellT"> ใช้อุณหภูมิเป็นอุณหภูมิเซลล์ (ไม่บวก NOCT)</label>' +
      '<label class="pv-cb"><input type="checkbox" data-k="bypass" checked> มีบายพาสไดโอด</label>' +
      '<div class="pv-btns"><button type="button" class="btn btn-ghost btn-sm" data-p="stc">STC</button><button type="button" class="btn btn-ghost btn-sm" data-p="hot">เที่ยงร้อน</button><button type="button" class="btn btn-ghost btn-sm" data-p="morning">เช้ามืดครึ้ม</button><button type="button" class="btn btn-ghost btn-sm" data-p="leaf">ใบไม้บัง 1 ช่อง</button><button type="button" class="btn btn-ghost btn-sm" data-p="pole">เงาเสาไล่ระดับ</button></div>' +
      "</div>" +
      '<div class="pv-fig" aria-live="polite"></div><dl class="fc-out"></dl>';
    var q = function (s) { return host.querySelector(s); };
    var setUI = function () {
      q('[data-k="g"]').value = st.g; q('[data-k="ta"]').value = st.ta; q('[data-k="cellT"]').checked = st.cellT; q('[data-k="bypass"]').checked = st.bypass;
      for (var i = 0; i < 3; i++) q('[data-k="s' + i + '"]').value = st.s[i];
    };
    var PRE = { stc: { g: 1000, ta: 25, cellT: true, s: [100, 100, 100] }, hot: { g: 1000, ta: 35, cellT: false, s: [100, 100, 100] }, morning: { g: 200, ta: 24, cellT: false, s: [100, 100, 100] },
      leaf: { g: 1000, ta: 30, cellT: false, s: [100, 100, 25] }, pole: { g: 900, ta: 32, cellT: false, s: [100, 60, 30] } };
    host.addEventListener("input", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      if (k === "cellT" || k === "bypass") st[k] = e.target.checked;
      else if (k[0] === "s" && k.length === 2) st.s[+k[1]] = +e.target.value; else st[k] = +e.target.value;
      draw();
    });
    host.addEventListener("click", function (e) { var p = e.target.getAttribute("data-p"); if (!p) return; var P = PRE[p]; st.g = P.g; st.ta = P.ta; st.cellT = P.cellT; st.s = P.s.slice(); setUI(); draw(); });
    function draw() {
      var tc = st.cellT ? st.ta : st.ta + ((MODULE.noct - 20) / 800) * st.g;
      var r = ivModule(MODULE, st.g, tc, st.s.map(function (v) { return v / 100; }), st.bypass);
      q('[data-o="g"]').textContent = st.g + " W/m²"; q('[data-o="ta"]').textContent = st.ta + " °C";
      for (var i = 0; i < 3; i++) q('[data-o="s' + i + '"]').textContent = st.s[i] + " %";
      var vmax = 60, imax = 16, pmax = 700;
      var marks = [{ x: r.mpp.v, y: r.mpp.p, axis: 2, cls: "dot", label: "Global MPP " + Math.round(r.mpp.p) + " W", anchor: r.mpp.v > 40 ? "end" : null, dx: r.mpp.v > 40 ? -8 : 8 }];
      if (r.po && Math.abs(r.po.p - r.mpp.p) > 2) marks.push({ x: r.po.v, y: r.po.p, axis: 2, cls: "dot2", label: "P&O ติดที่ " + Math.round(r.po.p) + " W", anchor: r.po.v > 40 ? "end" : null, dx: r.po.v > 40 ? -8 : 8 });
      q(".pv-fig").innerHTML = svgChart({ w: 640, h: 300, xs: [0, vmax], ys: [0, imax], y2s: [0, pmax], xt: [0, 10, 20, 30, 40, 50, 60], yt: [0, 4, 8, 12, 16], y2t: [0, 175, 350, 525, 700], xl: "แรงดัน V (V)", yl: "กระแส I (A)", y2l: "กำลัง P (W)", label: "เส้นโค้ง I-V และ P-V",
        series: [{ cls: "w1", pts: r.pts }, { cls: "w2", axis: 2, pts: r.pts.map(function (p) { return [p[0], p[0] * p[1]]; }) }], marks: marks });
      var stcP = MODULE.pmax;
      q(".fc-out").innerHTML = [["อุณหภูมิเซลล์", n(tc, 1) + " °C"], ["V_oc", n(r.voc, 1) + " V"], ["I_sc", n(r.isc, 2) + " A"], ["MPP", n(r.mpp.v, 1) + " V × " + n(r.mpp.i, 2) + " A = " + n(r.mpp.p, 0) + " W"],
        ["เทียบพิกัด STC", n((r.mpp.p / stcP) * 100, 1) + " %"], ["P&O ที่เริ่มจากฝั่ง V_oc", r.po ? n(r.po.p, 0) + " W" + (Math.abs(r.po.p - r.mpp.p) > 2 ? " (ติด local MPP เสีย " + n((1 - r.po.p / r.mpp.p) * 100, 0) + " %)" : " = global") : "—"]]
        .map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
    }
    setUI(); draw();
  }

  var api = { CALC: CALC, ivModule: ivModule, fitModule: fitModule, MODULE: MODULE, SITES: SITES, MONTH_SHAPE: MONTH_SHAPE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PVCalc = api;
  if (typeof document !== "undefined") {
    var init = function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-pv]"), buildCalc);
      Array.prototype.forEach.call(document.querySelectorAll(".pv-iv"), buildIV);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
