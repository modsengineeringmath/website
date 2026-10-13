/* AC phasor lab for /learn/vector-algebra/ — plain JS + SVG, no dependencies. Uses .v3-* control/readout styles.
   <div class="ph-lab" data-mode="rotate|sum|circuit|calc" [data-p='{"R":10}'] [data-topo="series|parallel|rl|rc|rlc-pf"]></div>
     rotate  — rotating phasor and its projections: v(t) = Vm sin(ωt + φ) is the imaginary part, cos is the real part; optional current phasor (lead/lag)
     sum     — adding two sinusoids of the same frequency = adding phasors (parallelogram, law of cosines); different frequencies cannot be added as phasors
     circuit — series/parallel RLC (and RL ∥ C power-factor correction): impedance, phasor diagram (KVL/KCL polygons), waveforms, power triangle, frequency sweep
     calc    — complex-number calculator (rectangular ↔ polar, + − × ÷ ∥) with the complex plane
   window.ACPhasor.cx / .solve for Node checks. */
(function (root) {
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  // ---------------------------------------------------------------- complex numbers [re, im]
  var cx = {
    c: function (a, b) { return [a, b || 0]; },
    pol: function (r, deg) { return [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)]; },
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1]]; },
    mul: function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; },
    div: function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    inv: function (a) { return cx.div([1, 0], a); },
    par: function (a, b) { return cx.div(cx.mul(a, b), cx.add(a, b)); },
    conj: function (a) { return [a[0], -a[1]]; },
    abs: function (a) { return Math.hypot(a[0], a[1]); },
    arg: function (a) { return Math.atan2(a[1], a[0]) * R2D; }
  };
  function num(v, s) {
    if (v === null || v === undefined || !isFinite(v)) return "—";
    if (Math.abs(v) < 1e-9) return "0";
    s = s || 4; var a = Math.abs(v);
    if (a >= 1e6 || a < 1e-3) { var e = Math.floor(Math.log10(a)); return (+(v / Math.pow(10, e)).toPrecision(s)).toString().replace("-", "−") + "e" + e; }
    var d = Math.max(0, s - 1 - Math.floor(Math.log10(a)));
    return (+v.toFixed(Math.min(d, 6))).toString().replace("-", "−");
  }
  function deg(v) { return num(v, 4) + "°"; }
  function rect(z, u) { return num(z[0]) + (z[1] < 0 ? " − j" : " + j") + num(Math.abs(z[1])) + (u ? " " + u : ""); }
  function polar(z, u) { return num(cx.abs(z)) + "∠" + deg(cx.arg(z)) + (u ? " " + u : ""); }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function row(label, value, cls) { return '<div class="v3-r' + (cls ? " " + cls : "") + '"><b>' + label + "</b><span>" + value + "</span></div>"; }
  var f1 = function (v) { return (+v).toFixed(1); };
  function arrow(x1, y1, x2, y2, cls, label, opt) {
    opt = opt || {};
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 1) return "";
    var ux = dx / L, uy = dy / L, h = Math.min(opt.h || 11, L * 0.45), hw = h * 0.42, bx = x2 - ux * h, by = y2 - uy * h;
    var s = '<g class="mx-a ' + cls + (opt.dash ? " mx-dash" : "") + '"><line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2 - ux * h * 0.6) + '" y2="' + f1(y2 - uy * h * 0.6) + '"' + (opt.w ? ' style="stroke-width:' + opt.w + 'px"' : "") + '/><polygon points="' + f1(x2) + "," + f1(y2) + " " + f1(bx - uy * hw) + "," + f1(by + ux * hw) + " " + f1(bx + uy * hw) + "," + f1(by - ux * hw) + '"/></g>';
    if (label) { var t = opt.lt == null ? 1 : opt.lt, px = x1 + dx * t, py = y1 + dy * t; if (t >= 1) { px += ux * 13; py += uy * 13 + 4; } else { px += -uy * 13; py += ux * 13 + 4; } s += '<text class="mx-lb ' + cls + '" x="' + f1(px) + '" y="' + f1(py) + '" text-anchor="middle">' + esc(label) + "</text>"; }
    return s;
  }
  function txt(x, y, t, cls, anchor) { return '<text class="' + (cls || "mx-lb") + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + esc(t) + "</text>"; }
  function niceMax(v) { if (!(v > 0)) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }

  // ---------------------------------------------------------------- circuit solver
  function solve(t, V, f, R, Lm, Cu) {
    var w = 2 * Math.PI * f, L = Lm * 1e-3, Cf = Cu * 1e-6, XL = w * L, XC = Cf > 0 ? 1 / (w * Cf) : Infinity;
    var Vs = [V, 0], r = { w: w, XL: XL, XC: XC, Vs: Vs, t: t };
    if (t === "series" || t === "rl" || t === "rc") {
      var X = (t === "rc" ? 0 : XL) - (t === "rl" ? 0 : XC);
      r.Z = [R, X]; r.I = cx.div(Vs, r.Z);
      r.parts = [["V_R", cx.mul(r.I, [R, 0]), "c5"]];
      if (t !== "rc") r.parts.push(["V_L", cx.mul(r.I, [0, XL]), "c3"]);
      if (t !== "rl") r.parts.push(["V_C", cx.mul(r.I, [0, -XC]), "c4"]);
      r.kind = "V";
    } else if (t === "parallel") {
      r.Y = [1 / R, w * Cf - 1 / XL]; r.Z = cx.inv(r.Y); r.I = cx.mul(Vs, r.Y);
      r.parts = [["I_R", [V / R, 0], "c5"], ["I_L", [0, -V / XL], "c3"], ["I_C", [0, V * w * Cf], "c4"]];
      r.kind = "I";
    } else { // rlc-pf: (R + jXL) ∥ C
      var Z1 = [R, XL], I1 = cx.div(Vs, Z1), IC = [0, V * w * Cf];
      r.I = cx.add(I1, IC); r.Z = cx.div(Vs, r.I); r.Y = cx.inv(r.Z);
      r.parts = [["I_RL", I1, "c5"], ["I_C", IC, "c4"]]; r.I1 = I1; r.kind = "I";
    }
    r.S = cx.mul(Vs, cx.conj(r.I)); r.P = r.S[0]; r.Q = r.S[1]; r.Sa = cx.abs(r.S); r.pf = r.Sa > 0 ? r.P / r.Sa : 1;
    r.f0 = (Lm > 0 && Cu > 0) ? 1 / (2 * Math.PI * Math.sqrt(L * Cf)) : null;
    return r;
  }

  // ---------------------------------------------------------------- labs
  var C = function (k, l, min, max, step, v, u, g) { return { k: k, l: l, min: min, max: max, step: step, v: v, u: u || "", g: g }; };
  var LABS = {};
  LABS.rotate = {
    t: "เฟสเซอร์หมุนกับคลื่นไซน์: sin และ cos เป็นเงาของลูกศรเดียวกัน", anim: true,
    ctl: [C("Vm", "แอมพลิจูด Vm", 10, 340, 1, 311, "V"), C("pv", "มุมเฟส φ_v", -180, 180, 5, 0, "°"),
      { k: "ref", l: "ฟังก์ชันอ้างอิง", type: "sel", v: "sin", o: [["sin", "v(t) = Vm sin(ωt + φ) → อ่านแกนจินตภาพ"], ["cos", "v(t) = Vm cos(ωt + φ) → อ่านแกนจริง"]] },
      { k: "showI", l: "แสดงกระแส i(t)", type: "chk", v: true }, C("Im", "Im", 1, 20, 0.5, 10, "A"), C("pi", "มุมเฟส φ_i", -180, 180, 5, -30, "°"),
      C("spd", "ความเร็วภาพเคลื่อนไหว", 0, 2, 0.1, 0.5, "รอบ/วินาที")],
    f: function (p, t) {
      var W = 680, H = 300, cxp = 150, cyp = 150, R = 115, x0 = 300, x1 = 666, th = t * 360 % 360, s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="เฟสเซอร์หมุนและรูปคลื่นที่เกิดจากการฉาย">';
      var useSin = p.ref === "sin", kI = R / Math.max(p.Im, 1e-9) * 0.62;
      s += '<circle class="ph-circ" cx="' + cxp + '" cy="' + cyp + '" r="' + R + '"/><line class="ph-ax" x1="' + (cxp - R - 14) + '" x2="' + (cxp + R + 14) + '" y1="' + cyp + '" y2="' + cyp + '"/><line class="ph-ax" x1="' + cxp + '" x2="' + cxp + '" y1="' + (cyp - R - 14) + '" y2="' + (cyp + R + 14) + '"/>';
      s += txt(cxp + R + 10, cyp - 6, "Re", "mx-tk") + txt(cxp + 6, cyp - R - 6, "Im", "mx-tk");
      s += '<line class="ph-ax" x1="' + x0 + '" x2="' + x1 + '" y1="' + cyp + '" y2="' + cyp + '"/>' + txt(x1 - 4, cyp + 16, "ωt", "mx-tk", "end");
      for (var k = 0; k <= 4; k++) { var xx = x0 + (x1 - x0) * k / 4; s += '<line class="mx-tick" x1="' + f1(xx) + '" x2="' + f1(xx) + '" y1="' + (cyp - 4) + '" y2="' + (cyp + 4) + '"/>' + txt(xx, cyp + 18, (k * 180) + "°", "mx-tk", "middle"); }
      var kV = R / p.Vm;
      // waveform window shows ωt from 0..720°; the dot marks the current ωt = th
      var curve = function (A, ph, k2, fn) { var pts = []; for (var a = 0; a <= 720; a += 5) pts.push(f1(x0 + (x1 - x0) * a / 720) + "," + f1(cyp - k2 * A * fn((a + ph) * D2R))); return pts.join(" "); };
      var main = useSin ? Math.sin : Math.cos, other = useSin ? Math.cos : Math.sin;
      s += '<polyline class="ph-w c7 ph-faint" points="' + curve(p.Vm, +p.pv, kV, other) + '"/>';
      s += '<polyline class="ph-w c2" points="' + curve(p.Vm, +p.pv, kV, main) + '"/>';
      if (p.showI) s += '<polyline class="ph-w c1" points="' + curve(p.Im, +p.pi, kI, main) + '"/>';
      var aV = th + +p.pv, V = [p.Vm * Math.cos(aV * D2R), p.Vm * Math.sin(aV * D2R)], tipV = [cxp + kV * V[0], cyp - kV * V[1]];
      var xt = x0 + (x1 - x0) * th / 720, yv = useSin ? tipV[1] : cyp - kV * V[0];
      if (useSin) s += '<line class="mx-guide" x1="' + f1(tipV[0]) + '" y1="' + f1(tipV[1]) + '" x2="' + f1(xt) + '" y2="' + f1(yv) + '"/>';
      else s += '<line class="mx-guide" x1="' + f1(tipV[0]) + '" y1="' + f1(tipV[1]) + '" x2="' + f1(tipV[0]) + '" y2="' + cyp + '"/><line class="mx-guide" x1="' + f1(tipV[0]) + '" y1="' + cyp + '" x2="' + f1(xt) + '" y2="' + f1(yv) + '"/>';
      s += '<line class="ph-proj ' + (useSin ? "im" : "re") + '" x1="' + (useSin ? cxp : cxp) + '" y1="' + (useSin ? cyp : cyp) + '" x2="' + f1(useSin ? cxp : tipV[0]) + '" y2="' + f1(useSin ? tipV[1] : cyp) + '"/>';
      s += arrow(cxp, cyp, tipV[0], tipV[1], "c2", "V", { w: 3 });
      if (p.showI) { var aI = th + +p.pi, I = [p.Im * Math.cos(aI * D2R), p.Im * Math.sin(aI * D2R)]; s += arrow(cxp, cyp, cxp + kI * I[0], cyp - kI * I[1], "c1", "I", { w: 2.6 }); s += '<circle class="ph-dot c1" cx="' + f1(xt) + '" cy="' + f1(cyp - kI * p.Im * main(aI * D2R)) + '" r="4.5"/>'; }
      s += '<circle class="ph-dot c2" cx="' + f1(xt) + '" cy="' + f1(yv) + '" r="5"/>';
      s += '<polyline class="mx-arc c4" points="' + (function () { var pts = []; for (var a = 0; a <= aV - 0 && pts.length < 100; a += Math.max(3, aV / 40)) pts.push(f1(cxp + 26 * Math.cos(a * D2R)) + "," + f1(cyp - 26 * Math.sin(a * D2R))); return pts.join(" "); })() + '"/>';
      s += txt(8, 18, "ωt = " + Math.round(th) + "°", "mx-cap") + "</svg>";
      var dphi = ((p.pv - p.pi) % 360 + 540) % 360 - 180;
      var out = row("เฟสเซอร์ (ค่าที่ t = 0)", "V = " + num(p.Vm) + "∠" + deg(+p.pv) + " = " + rect([p.Vm * Math.cos(p.pv * D2R), p.Vm * Math.sin(p.pv * D2R)]) + " V (แอมพลิจูด) · RMS = " + num(p.Vm / Math.SQRT2) + " V", "v3-key") +
        row("ความสัมพันธ์ sin–cos", "sin(ωt + φ) = cos(ωt + φ − 90°) · cos(ωt + φ) = sin(ωt + φ + 90°): sin ตามหลัง cos อยู่ 90°") +
        row("ออยเลอร์", "Vm e^{j(ωt+φ)} = Vm cos(ωt+φ) + j Vm sin(ωt+φ) → " + (useSin ? "v(t) = Im{·}" : "v(t) = Re{·}"));
      if (p.showI) out += row("ความต่างเฟส φ_v − φ_i", deg(dphi) + " → " + (Math.abs(dphi) < 0.5 ? "ร่วมเฟส (เหมือนตัวต้านทาน)" : dphi > 0 ? "กระแสตามหลังแรงดัน (lagging · โหลดแบบเหนี่ยวนำ)" : "กระแสนำหน้าแรงดัน (leading · โหลดแบบตัวเก็บประจุ)") + " · PF = cos(φ_v − φ_i) = " + num(Math.cos(dphi * D2R), 4), "v3-ok");
      return { svg: s, out: out };
    }
  };
  LABS.sum = {
    t: "บวกคลื่นไซน์ความถี่เดียวกัน = บวกเฟสเซอร์แบบเวกเตอร์", anim: true,
    ctl: [C("A1", "A₁", 0, 200, 1, 100, "V"), C("p1", "φ₁", -180, 180, 5, 0, "°"), C("A2", "A₂", 0, 200, 1, 80, "V"), C("p2", "φ₂", -180, 180, 5, 60, "°"),
      { k: "f2", l: "ความถี่ของ v₂", type: "sel", v: "1", o: [["1", "เท่ากับ v₁ (ใช้เฟสเซอร์ได้)"], ["2", "2 เท่าของ v₁ (ใช้เฟสเซอร์ไม่ได้)"]] }, C("spd", "ความเร็วภาพเคลื่อนไหว", 0, 2, 0.1, 0.3, "รอบ/วินาที")],
    f: function (p, t) {
      var W = 680, H = 320, cxp = 160, cyp = 160, x0 = 330, x1 = 666, th = t * 360 % 360, s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="การบวกเฟสเซอร์และการบวกรูปคลื่น">';
      var V1 = cx.pol(+p.A1, th + +p.p1), V2 = cx.pol(+p.A2, (p.f2 === "2" ? 2 * th : th) + +p.p2), Vr = cx.add(V1, V2);
      var big = Math.max(cx.abs(Vr), +p.A1 + +p.A2, 1), k = 125 / big, P = function (z) { return [cxp + k * z[0], cyp - k * z[1]]; };
      s += '<line class="ph-ax" x1="' + (cxp - 140) + '" x2="' + (cxp + 140) + '" y1="' + cyp + '" y2="' + cyp + '"/><line class="ph-ax" x1="' + cxp + '" x2="' + cxp + '" y1="' + (cyp - 140) + '" y2="' + (cyp + 140) + '"/>';
      var a = P(V1), b = P(V2), r = P(Vr);
      s += '<line class="mx-guide" x1="' + f1(b[0]) + '" y1="' + f1(b[1]) + '" x2="' + f1(r[0]) + '" y2="' + f1(r[1]) + '"/>';
      s += arrow(cxp, cyp, a[0], a[1], "c1", "V₁", { w: 2.6 }) + arrow(cxp, cyp, b[0], b[1], "c3", "V₂", { w: 2.2, dash: true }) + arrow(a[0], a[1], r[0], r[1], "c3", "", { w: 2.6 }) + arrow(cxp, cyp, r[0], r[1], "c2", "V₁+V₂", { w: 3.2 });
      var ky = 135 / (+p.A1 + +p.A2 || 1), curve = function (fn) { var pts = []; for (var aa = 0; aa <= 720; aa += 4) pts.push(f1(x0 + (x1 - x0) * aa / 720) + "," + f1(cyp - ky * fn(aa))); return pts.join(" "); };
      var m2 = p.f2 === "2" ? 2 : 1, f1w = function (aa) { return p.A1 * Math.sin((aa + +p.p1) * D2R); }, f2w = function (aa) { return p.A2 * Math.sin((m2 * aa + +p.p2) * D2R); };
      s += '<line class="ph-ax" x1="' + x0 + '" x2="' + x1 + '" y1="' + cyp + '" y2="' + cyp + '"/>';
      s += '<polyline class="ph-w c1 ph-faint2" points="' + curve(f1w) + '"/><polyline class="ph-w c3 ph-faint2" points="' + curve(f2w) + '"/><polyline class="ph-w c2" points="' + curve(function (aa) { return f1w(aa) + f2w(aa); }) + '"/>';
      var xt = x0 + (x1 - x0) * th / 720; s += '<line class="mx-guide" x1="' + f1(xt) + '" x2="' + f1(xt) + '" y1="20" y2="' + (H - 20) + '"/>';
      s += txt(x0, 22, "v₁ + v₂ (เส้นหนา)", "mx-cap") + "</svg>";
      var out;
      if (p.f2 === "2") {
        var mx = 0; for (var aa = 0; aa < 360; aa += 0.5) mx = Math.max(mx, Math.abs(f1w(aa) + f2w(aa)));
        out = row("⚠ ความถี่ต่างกัน", "ลูกศร V₂ หมุนเร็วกว่า V₁ มุมระหว่างกันเปลี่ยนตลอดเวลา จึงไม่มีเฟสเซอร์ผลรวมคงที่ ผลรวมไม่ใช่ไซน์ (ค่ายอดในหนึ่งคาบ ≈ " + num(mx) + " V) ต้องวิเคราะห์ทีละความถี่ (superposition) เหมือนอนุกรมฟูเรียร์", "v3-bad");
      } else {
        var Z1 = cx.pol(+p.A1, +p.p1), Z2 = cx.pol(+p.A2, +p.p2), Zr = cx.add(Z1, Z2), dp = +p.p2 - +p.p1;
        out = row("① เขียนเป็นเฟสเซอร์", "V₁ = " + num(p.A1) + "∠" + deg(+p.p1) + " = " + rect(Z1) + " · V₂ = " + num(p.A2) + "∠" + deg(+p.p2) + " = " + rect(Z2)) +
          row("② บวกแบบสี่เหลี่ยมมุมฉาก", "V = (" + num(Z1[0]) + " + " + num(Z2[0]) + ") + j(" + num(Z1[1]) + " + " + num(Z2[1]) + ") = " + rect(Zr)) +
          row("③ ขนาดด้วยกฎของโคไซน์", "|V| = √(A₁² + A₂² + 2A₁A₂cos(φ₂ − φ₁)) = √(" + num(p.A1) + "² + " + num(p.A2) + "² + 2·" + num(p.A1) + "·" + num(p.A2) + "·cos " + deg(dp) + ") = <b>" + num(cx.abs(Zr)) + " V</b>", "v3-key") +
          row("④ ผลลัพธ์", "v₁ + v₂ = <b>" + num(cx.abs(Zr)) + " sin(ωt " + (cx.arg(Zr) < 0 ? "− " : "+ ") + deg(Math.abs(cx.arg(Zr))) + ")</b> V", "v3-key") +
          row("ข้อสังเกต", "|V| ≤ A₁ + A₂ = " + num(+p.A1 + +p.A2) + " V เท่ากันเมื่อร่วมเฟส และ = |A₁ − A₂| เมื่อต่างเฟส 180° เหมือนแรงลัพธ์สองแรงทุกประการ", "v3-ok");
      }
      return { svg: s, out: out };
    }
  };
  LABS.circuit = {
    t: "วิเคราะห์วงจร RLC ด้วยเฟสเซอร์",
    ctl: [{ k: "topo", l: "วงจร", type: "sel", v: "series", o: [["series", "RLC อนุกรม"], ["parallel", "RLC ขนาน"], ["rl", "RL อนุกรม"], ["rc", "RC อนุกรม"], ["rlc-pf", "RL ขนาน C (แก้เพาเวอร์แฟกเตอร์)"]] },
      C("V", "แรงดันแหล่งจ่าย (RMS)", 1, 400, 1, 220, "V"), C("f", "ความถี่ f", 1, 2000, 1, 50, "Hz"), C("R", "R", 0.1, 500, 0.1, 30, "Ω"), C("L", "L", 0, 1000, 1, 127, "mH"), C("Cu", "C", 0, 1000, 1, 53, "μF")],
    f: function (p) {
      var r = solve(p.topo, +p.V, +p.f, +p.R, +p.L, +p.Cu), W = 680, H = 360, s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="แผนภาพเฟสเซอร์ของวงจร">';
      // phasor diagram (left 360 px)
      var cxp = 120, cyp = 190, ser = r.kind === "V";
      var vecs = ser ? r.parts.map(function (q) { return q[1]; }).concat([r.Vs]) : r.parts.map(function (q) { return q[1]; }).concat([r.I]);
      var sumPts = [[0, 0]]; r.parts.forEach(function (q) { var l = sumPts[sumPts.length - 1]; sumPts.push(cx.add(l, q[1])); });
      var allPts = vecs.concat(sumPts), mx = Math.max.apply(null, allPts.map(function (z) { return Math.max(Math.abs(z[0]), Math.abs(z[1])); }).concat([1e-9]));
      var k = 150 / mx, P = function (z) { return [cxp + k * z[0], cyp - k * z[1]]; };
      s += '<line class="ph-ax" x1="' + (cxp - 110) + '" x2="' + (cxp + 220) + '" y1="' + cyp + '" y2="' + cyp + '"/><line class="ph-ax" x1="' + cxp + '" x2="' + cxp + '" y1="' + (cyp - 170) + '" y2="' + (cyp + 160) + '"/>' + txt(cxp + 222, cyp + 4, "Re", "mx-tk") + txt(cxp + 4, 16, "Im", "mx-tk");
      // KVL / KCL polygon
      for (var i = 0; i < r.parts.length; i++) { var a = P(sumPts[i]), b = P(sumPts[i + 1]); s += arrow(a[0], a[1], b[0], b[1], r.parts[i][2], r.parts[i][0], { w: 2.6, lt: 0.55 }); }
      var tip = P(ser ? r.Vs : r.I); s += arrow(cxp, cyp, tip[0], tip[1], ser ? "c2" : "c1", ser ? "V_s" : "I", { w: 3.2, lt: 0.6 });
      // the other quantity (current for series, voltage for parallel) on its own scale
      var o = ser ? r.I : r.Vs, ko = 90 / Math.max(cx.abs(o), 1e-9), po = [cxp + ko * o[0], cyp - ko * o[1]];
      s += arrow(cxp, cyp, po[0], po[1], ser ? "c1" : "c2", ser ? "I" : "V_s", { w: 2.2, dash: true });
      s += txt(8, H - 10, ser ? "เส้นทึบ: แรงดัน (KVL ต่อหัวต่อหาง) · เส้นประ: กระแส (สเกลต่างกัน)" : "เส้นทึบ: กระแส (KCL ต่อหัวต่อหาง) · เส้นประ: แรงดันอ้างอิง", "mx-cap");
      // waveforms (right)
      var x0 = 380, x1 = 670, y0 = 100, amp = 70, Vm = Math.SQRT2 * r.Vs[0], Imx = Math.SQRT2 * cx.abs(r.I), phI = cx.arg(r.I);
      s += '<line class="ph-ax" x1="' + x0 + '" x2="' + x1 + '" y1="' + y0 + '" y2="' + y0 + '"/>' + txt(x0, 22, "v(t) และ i(t) สองคาบ", "mx-cap");
      var curve = function (A, ph, kk) { var pts = []; for (var aa = 0; aa <= 720; aa += 6) pts.push(f1(x0 + (x1 - x0) * aa / 720) + "," + f1(y0 - kk * A * Math.sin((aa + ph) * D2R))); return pts.join(" "); };
      s += '<polyline class="ph-w c2" points="' + curve(Vm, 0, amp / Math.max(Vm, 1e-9)) + '"/><polyline class="ph-w c1" points="' + curve(Imx, phI, amp * 0.75 / Math.max(Imx, 1e-9)) + '"/>';
      s += txt(x1, y0 - amp - 4, "v", "mx-lb c2", "end") + txt(x1, y0 + amp + 14, "i", "mx-lb c1", "end");
      // impedance / power triangle (bottom right)
      var bx = 420, by = 262, P2 = r.P, Q2 = r.Q, kk2 = 78 / Math.max(Math.abs(P2), Math.abs(Q2), 1e-9);
      s += arrow(bx, by, bx + kk2 * P2, by, "c1", "P", { w: 2.4, lt: 0.5 }) + arrow(bx + kk2 * P2, by, bx + kk2 * P2, by - kk2 * Q2, Q2 >= 0 ? "c3" : "c4", "Q", { w: 2.4, lt: 0.5 }) + arrow(bx, by, bx + kk2 * P2, by - kk2 * Q2, "c2", "S", { w: 2.6, lt: 0.5 });
      s += txt(bx + 170, by + 4, "สามเหลี่ยมกำลัง", "mx-cap");
      s += "</svg>";
      var out = row("ω = 2πf · X_L = ωL · X_C = 1/(ωC)", "ω = " + num(r.w) + " rad/s · X_L = " + num(r.XL) + " Ω · X_C = " + (isFinite(r.XC) ? num(r.XC) + " Ω" : "∞ (ไม่มี C)"));
      if (ser) {
        out += row("Z = R + j(X_L − X_C)", rect(r.Z, "Ω") + " = <b>" + polar(r.Z, "Ω") + "</b>", "v3-key") +
          row("I = V_s / Z", num(p.V) + "∠0° / " + polar(r.Z) + " = <b>" + polar(r.I, "A") + "</b> (RMS)", "v3-key") +
          r.parts.map(function (q) { return row(q[0] + " = I × Z_" + q[0].slice(2), polar(q[1], "V") + " = " + rect(q[1], "V")); }).join("") +
          row("ตรวจ KVL เชิงเวกเตอร์", r.parts.map(function (q) { return q[0]; }).join(" + ") + " = " + rect(sumPts[sumPts.length - 1], "V") + " = V_s ✓ · ผลรวมขนาด " + num(r.parts.reduce(function (t, q) { return t + cx.abs(q[1]); }, 0)) + " V ≠ " + num(p.V) + " V", "v3-ok");
      } else {
        out += (r.Y ? row("Y = 1/Z", rect(r.Y, "S")) : "") + row("Z รวม", rect(r.Z, "Ω") + " = <b>" + polar(r.Z, "Ω") + "</b>", "v3-key") +
          r.parts.map(function (q) { return row(q[0], polar(q[1], "A") + " = " + rect(q[1], "A")); }).join("") +
          row("I = ΣI (KCL เชิงเวกเตอร์)", "<b>" + polar(r.I, "A") + "</b>", "v3-key");
        if (p.topo === "rlc-pf") out += row("ผลของตัวเก็บประจุ", "กระแสสายลดจาก " + num(cx.abs(r.I1)) + " A เหลือ " + num(cx.abs(r.I)) + " A · PF จาก " + num(Math.cos(cx.arg(r.I1) * D2R), 3) + " เป็น " + num(r.pf, 3), "v3-ok");
      }
      out += row("กำลัง S = V I*", "P = " + num(r.P) + " W · Q = " + num(r.Q) + " var · |S| = " + num(r.Sa) + " VA · PF = " + num(r.pf, 3) + " " + (Math.abs(r.Q) < 1e-6 * r.Sa ? "(หนึ่ง)" : r.Q > 0 ? "ตามหลัง (lagging)" : "นำหน้า (leading)"));
      if (r.f0) out += row("เรโซแนนซ์ f₀ = 1/(2π√(LC))", num(r.f0) + " Hz" + (p.topo === "series" ? " · Q = ω₀L/R = " + num(2 * Math.PI * r.f0 * p.L * 1e-3 / p.R) + " · BW = f₀/Q = " + num(p.R / (2 * Math.PI * p.L * 1e-3)) + " Hz" : ""));
      return { svg: s, out: out, sweep: r };
    }
  };
  LABS.calc = {
    t: "เครื่องคิดเลขจำนวนเชิงซ้อน: เวกเตอร์บนระนาบเชิงซ้อน",
    ctl: [{ k: "f1", l: "Z₁ รูปแบบ", type: "sel", v: "pol", o: [["rect", "a + jb"], ["pol", "r∠θ"]] }, C("a1", "Z₁: a หรือ r", -500, 500, 0.5, 10), C("b1", "Z₁: b หรือ θ°", -500, 500, 0.5, 30),
      { k: "f2", l: "Z₂ รูปแบบ", type: "sel", v: "rect", o: [["rect", "a + jb"], ["pol", "r∠θ"]] }, C("a2", "Z₂: a หรือ r", -500, 500, 0.5, 4), C("b2", "Z₂: b หรือ θ°", -500, 500, 0.5, -3),
      { k: "op", l: "การดำเนินการ", type: "sel", v: "mul", o: [["add", "Z₁ + Z₂"], ["sub", "Z₁ − Z₂"], ["mul", "Z₁ × Z₂"], ["div", "Z₁ ÷ Z₂"], ["par", "Z₁ ∥ Z₂ = Z₁Z₂/(Z₁+Z₂)"]] }],
    f: function (p) {
      var Z1 = p.f1 === "pol" ? cx.pol(+p.a1, +p.b1) : [+p.a1, +p.b1], Z2 = p.f2 === "pol" ? cx.pol(+p.a2, +p.b2) : [+p.a2, +p.b2];
      var R = cx[p.op](Z1, Z2), W = 680, H = 340, cxp = 340, cyp = 170;
      var mx = Math.max.apply(null, [Z1, Z2, R].map(function (z) { return Math.max(Math.abs(z[0]), Math.abs(z[1])); }).concat([1e-9])), k = 140 / mx, P = function (z) { return [cxp + k * z[0], cyp - k * z[1]]; };
      var s = '<svg class="mx-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="จำนวนเชิงซ้อนบนระนาบ">';
      s += '<line class="ph-ax" x1="40" x2="' + (W - 40) + '" y1="' + cyp + '" y2="' + cyp + '"/><line class="ph-ax" x1="' + cxp + '" x2="' + cxp + '" y1="10" y2="' + (H - 10) + '"/>' + txt(W - 40, cyp - 6, "Re", "mx-tk") + txt(cxp + 6, 18, "Im", "mx-tk");
      var a = P(Z1), b = P(Z2), r = P(R);
      if (p.op === "add") s += arrow(a[0], a[1], r[0], r[1], "c3", "", { w: 1.8, dash: true });
      if (p.op === "sub") s += arrow(b[0], b[1], a[0], a[1], "c2", "", { w: 1.8, dash: true });
      s += arrow(cxp, cyp, a[0], a[1], "c1", "Z₁", { w: 2.6 }) + arrow(cxp, cyp, b[0], b[1], "c3", "Z₂", { w: 2.6 }) + arrow(cxp, cyp, r[0], r[1], "c2", "ผลลัพธ์", { w: 3.2 }) + "</svg>";
      var step = {
        add: "บวกส่วนจริงกับส่วนจริง ส่วนจินตภาพกับส่วนจินตภาพ (เหมือนบวกเวกเตอร์ 2 มิติ)",
        sub: "ลบทีละส่วน (เหมือนลบเวกเตอร์)",
        mul: "รูปเชิงขั้วสะดวกกว่า: ขนาดคูณกัน มุมบวกกัน " + num(cx.abs(Z1)) + "×" + num(cx.abs(Z2)) + " ∠ (" + deg(cx.arg(Z1)) + " + " + deg(cx.arg(Z2)) + ")",
        div: "ขนาดหารกัน มุมลบกัน " + num(cx.abs(Z1)) + "/" + num(cx.abs(Z2)) + " ∠ (" + deg(cx.arg(Z1)) + " − " + deg(cx.arg(Z2)) + ")",
        par: "คูณด้วยรูปเชิงขั้ว แล้วหารด้วยผลบวกที่ได้จากรูปสี่เหลี่ยมมุมฉาก"
      }[p.op];
      var out = row("Z₁", rect(Z1) + " = " + polar(Z1)) + row("Z₂", rect(Z2) + " = " + polar(Z2)) + row("วิธีคิด", step) +
        row("ผลลัพธ์", "<b>" + rect(R) + " = " + polar(R) + "</b>", "v3-key") +
        row("แปลงรูป", "r = √(a² + b²), θ = atan2(b, a) (ระวังควอดแรนต์) · a = r cos θ, b = r sin θ", "v3-ok");
      return { svg: s, out: out };
    }
  };

  // ---------------------------------------------------------------- frequency sweep for the circuit lab
  function sweepSvg(p, r) {
    var W = 680, H = 210, L = 56, Rr = 16, T = 18, B = 34, fmin = 1, fmax = Math.max(2000, (r.f0 || 0) * 4);
    var xs = function (f) { return L + (Math.log10(f) - Math.log10(fmin)) / (Math.log10(fmax) - Math.log10(fmin)) * (W - L - Rr); };
    var ser = r.kind === "V", data = [], mx = 0;
    for (var i = 0; i <= 240; i++) { var f = fmin * Math.pow(fmax / fmin, i / 240), q = solve(p.topo, +p.V, f, +p.R, +p.L, +p.Cu), v = ser ? cx.abs(q.I) : cx.abs(q.Z); if (isFinite(v)) { data.push([f, v]); mx = Math.max(mx, v); } }
    var top = niceMax(Math.min(mx, ser ? mx : (+p.R) * 4 || mx)), ys = function (v) { return H - B - Math.min(1.05, v / top) * (H - T - B); };
    var s = '<svg class="mx-svg ph-sweep" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="ผลตอบสนองเชิงความถี่">';
    [1, 10, 100, 1000, 10000].forEach(function (f) { if (f < fmin || f > fmax) return; s += '<line class="mx-guide" x1="' + f1(xs(f)) + '" x2="' + f1(xs(f)) + '" y1="' + T + '" y2="' + (H - B) + '"/>' + txt(xs(f), H - B + 16, f >= 1000 ? f / 1000 + " kHz" : f + " Hz", "mx-tk", "middle"); });
    [0, 0.5, 1].forEach(function (t) { s += txt(L - 6, ys(top * t) + 4, num(top * t, 3), "mx-tk", "end"); });
    s += '<polyline class="ph-w c2" points="' + data.map(function (d) { return f1(xs(d[0])) + "," + f1(ys(d[1])); }).join(" ") + '"/>';
    var cur = ser ? cx.abs(r.I) : cx.abs(r.Z);
    s += '<circle class="ph-dot c6" cx="' + f1(xs(+p.f)) + '" cy="' + f1(ys(cur)) + '" r="5"/>' + txt(L, 13, ser ? "|I| (A) เทียบความถี่ — ยอดที่ f₀ คือเรโซแนนซ์อนุกรม" : "|Z| (Ω) เทียบความถี่", "mx-cap");
    if (r.f0 && r.f0 > fmin && r.f0 < fmax) s += '<line class="ph-f0" x1="' + f1(xs(r.f0)) + '" x2="' + f1(xs(r.f0)) + '" y1="' + T + '" y2="' + (H - B) + '"/>' + txt(xs(r.f0) + 4, T + 12, "f₀ = " + num(r.f0, 3) + " Hz", "mx-cap");
    return s + "</svg>";
  }

  // ---------------------------------------------------------------- mount
  function ctl(c, val) {
    var lab = document.createElement("label");
    lab.className = "v3-c" + (c.type === "chk" ? " v3-chk" : c.type === "sel" ? " v3-sel" : ""); lab.dataset.k = c.k;
    if (c.type === "chk") lab.innerHTML = '<input type="checkbox"' + (val ? " checked" : "") + "><span>" + esc(c.l) + "</span>";
    else if (c.type === "sel") lab.innerHTML = "<span>" + esc(c.l) + "</span><select>" + c.o.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
    else lab.innerHTML = "<span>" + esc(c.l) + (c.u ? " <i>" + esc(c.u) + "</i>" : "") + '</span><input type="range" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + val + '" aria-label="' + esc(c.l) + '"><input type="number" step="any" value="' + val + '" aria-label="' + esc(c.l) + ' (พิมพ์ค่า)">';
    return lab;
  }
  function mount(el) {
    var key = el.getAttribute("data-mode") || "rotate", S = LABS[key];
    if (!S) return;
    var p = {}, init = {};
    try { init = JSON.parse(el.getAttribute("data-p") || "{}"); } catch (_) {}
    S.ctl.forEach(function (c) { p[c.k] = init[c.k] != null ? init[c.k] : c.v; });
    if (el.getAttribute("data-topo")) p.topo = el.getAttribute("data-topo");
    el.classList.add("ph-ready");
    el.innerHTML = '<p class="v3-t"><b>' + esc(el.getAttribute("data-title") || S.t) + '</b><span class="mono">แล็บไฟฟ้ากระแสสลับ · เฟสเซอร์</span></p><div class="v3-body"><div class="v3-fig ph-fig"></div><div class="v3-side"><div class="v3-ctls"></div><div class="v3-out" aria-live="polite"></div></div></div>' + (key === "circuit" ? '<div class="ph-sw"></div>' : "");
    var fig = el.querySelector(".ph-fig"), ctls = el.querySelector(".v3-ctls"), out = el.querySelector(".v3-out"), sw = el.querySelector(".ph-sw");
    S.ctl.forEach(function (c) { ctls.appendChild(ctl(c, p[c.k])); });
    if (key === "circuit") {
      var pre = document.createElement("div"); pre.className = "ph-pre";
      pre.innerHTML = [["มอเตอร์ไฟบ้าน 220 V 50 Hz", { topo: "series", V: 220, f: 50, R: 30, L: 127, Cu: 0 }, "rl"], ["RLC อนุกรมที่เรโซแนนซ์", { topo: "series", V: 10, f: 159, R: 10, L: 100, Cu: 10 }], ["วงจรถังขนาน", { topo: "parallel", V: 10, f: 159, R: 200, L: 100, Cu: 10 }], ["แก้ PF ด้วย C", { topo: "rlc-pf", V: 220, f: 50, R: 30, L: 127, Cu: 40 }]]
        .map(function (x, i) { return '<button type="button" data-i="' + i + '">' + x[0] + "</button>"; }).join("");
      var PRE = [{ topo: "rl", V: 220, f: 50, R: 30, L: 127, Cu: 0 }, { topo: "series", V: 10, f: 159, R: 10, L: 100, Cu: 10 }, { topo: "parallel", V: 10, f: 159, R: 200, L: 100, Cu: 10 }, { topo: "rlc-pf", V: 220, f: 50, R: 30, L: 127, Cu: 40 }];
      pre.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; var q = PRE[+b.dataset.i]; Object.keys(q).forEach(function (k) { p[k] = q[k]; var lab = ctls.querySelector('.v3-c[data-k="' + k + '"]'); if (lab) lab.querySelectorAll("input,select").forEach(function (x) { x.value = q[k]; }); }); run(0); });
      ctls.parentNode.insertBefore(pre, ctls);
    }
    var t0 = performance.now(), phase = 0, last = t0, raf = null, paused = false;
    function run(tt) {
      var r = S.f(p, tt || phase);
      fig.innerHTML = r.svg; if (out._h !== r.out) { out.innerHTML = r.out; out._h = r.out; }
      if (sw && r.sweep) sw.innerHTML = sweepSvg(p, r.sweep);
    }
    ctls.addEventListener("input", function (e) {
      var lab = e.target.closest(".v3-c"); if (!lab) return;
      var k = lab.dataset.k, t = e.target;
      if (t.type === "checkbox") p[k] = t.checked; else if (t.tagName === "SELECT") p[k] = t.value;
      else { var v = parseFloat(t.value); if (!isFinite(v)) return; p[k] = v; var o = lab.querySelector(t.type === "range" ? 'input[type="number"]' : 'input[type="range"]'); if (o) o.value = v; }
      run(phase);
    });
    if (S.anim) {
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "ph-play"; btn.textContent = "⏸ หยุดภาพ"; ctls.parentNode.insertBefore(btn, ctls);
      btn.addEventListener("click", function () { paused = !paused; btn.textContent = paused ? "▶ เล่นภาพ" : "⏸ หยุดภาพ"; });
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { paused = true; btn.textContent = "▶ เล่นภาพ"; phase = 0.08; }
      var loop = function (now) { if (!paused) phase += (now - last) / 1000 * (+p.spd || 0); last = now; run(phase); raf = requestAnimationFrame(loop); };
      var io = "IntersectionObserver" in window ? new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } } else if (raf) { cancelAnimationFrame(raf); raf = null; } }); }) : null;
      if (io) io.observe(el); else raf = requestAnimationFrame(loop);
    }
    run(phase);
  }
  root.ACPhasor = { cx: cx, solve: solve };
  if (typeof module === "object" && module.exports) module.exports = root.ACPhasor;
  if (typeof document === "undefined") return;
  function init() { document.querySelectorAll(".ph-lab").forEach(function (el) { if (!el.classList.contains("ph-ready")) mount(el); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
