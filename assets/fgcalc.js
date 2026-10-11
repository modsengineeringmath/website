/* Small calculators for the FG / oscilloscope lessons: <div class="fg-calc" data-calc="vconv|load|dds|rc|rlc|opamp|555|wien|ripple|schmitt|relax|scope">.
   Inputs accept SI prefixes (1k, 10n, 2.5M). Results update as you type. */
(function () {
  "use strict";
  var PI = Math.PI, TAU = 2 * PI;
  var PFX = { G: 1e9, M: 1e6, k: 1e3, K: 1e3, m: 1e-3, u: 1e-6, "µ": 1e-6, n: 1e-9, p: 1e-12 };
  function parse(s) {
    s = String(s).trim().replace(/−/g, "-").replace(/,/g, "").replace(/\s+/g, "");
    var m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([GMkKmuµnp]?)/i.exec(s);
    return m ? parseFloat(m[1]) * (PFX[m[2]] || 1) : NaN;
  }
  function si(v, unit, sig) {
    if (!isFinite(v)) return "—";
    sig = sig || 4;
    var a = Math.abs(v), P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
    if (a === 0) return "0 " + unit;
    for (var i = 0; i < P.length; i++) if (a >= P[i][0] * 0.99995 || i === P.length - 1) return (+(v / P[i][0]).toPrecision(sig)).toString().replace("-", "−") + " " + P[i][1] + unit;
  }
  var CALC = {
    vconv: { t: "แปลงหน่วยแรงดันไซน์", ins: [["v", "ค่า", "", "1"], ["u", "หน่วย", "sel", "Vpp", ["Vpp", "Vp", "Vrms", "dBm (50 Ω)", "dBV"]]],
      f: function (x) {
        var vr = x.u === "Vpp" ? x.v / (2 * Math.SQRT2) : x.u === "Vp" ? x.v / Math.SQRT2 : x.u === "Vrms" ? x.v : x.u === "dBV" ? Math.pow(10, x.v / 20) : Math.sqrt(50 * 1e-3 * Math.pow(10, x.v / 10));
        return [["Vpp", si(vr * 2 * Math.SQRT2, "V")], ["Vp", si(vr * Math.SQRT2, "V")], ["Vrms", si(vr, "V")], ["dBV", (20 * Math.log10(vr)).toFixed(2) + " dBV"], ["dBm บน 50 Ω", (10 * Math.log10((vr * vr) / 50 / 1e-3)).toFixed(2) + " dBm"], ["กำลังบน 50 Ω", si((vr * vr) / 50, "W")]];
      }, ref: "W7, W16" },
    load: { t: "แรงดันจริงบนโหลด", ins: [["v", "ค่าที่ตั้ง (Vpp)", "V", "2"], ["mode", "Load ที่ตั้งในเครื่อง", "sel", "High-Z", ["High-Z", "50 Ω"]], ["rl", "โหลดจริง R_L", "Ω", "50"]],
      f: function (x) { var e = x.v * (x.mode === "50 Ω" ? 2 : 1), vl = (e * x.rl) / (x.rl + 50); return [["emf ภายใน e", si(e, "Vpp")], ["แรงดันบนโหลด", si(vl, "Vpp")], ["เทียบกับค่าที่ตั้ง", (vl / x.v).toFixed(3) + " เท่า"], ["กระแสยอด", si(e / 2 / (x.rl + 50), "A")]]; }, ref: "V2, V4" },
    dds: { t: "เครื่องคิดเลข DDS (เช่น AD9833)", ins: [["fclk", "ความถี่นาฬิกา f_clk", "Hz", "25M"], ["n", "จำนวนบิตตัวสะสม N", "", "28"], ["fo", "ความถี่ที่ต้องการ", "Hz", "1k"]],
      f: function (x) {
        var N = Math.round(x.n), M = Math.round((x.fo * Math.pow(2, N)) / x.fclk), fa = (M * x.fclk) / Math.pow(2, N), res = x.fclk / Math.pow(2, N);
        var out = [["เลขปรับความถี่ M", M.toLocaleString("en-US")], ["ความถี่ที่ได้จริง", si(fa, "Hz", 9)], ["คลาดเคลื่อน", si(fa - x.fo, "Hz", 3)], ["ความละเอียด Δf", si(res, "Hz", 4)], ["ความถี่ใช้งานแนะนำ ≤ 0.4 f_clk", si(0.4 * x.fclk, "Hz")]];
        if (N === 28 && M < Math.pow(2, 28)) {
          var lsb = M & 0x3fff, msb = (M >> 14) & 0x3fff, h = function (v) { return "0x" + v.toString(16).toUpperCase().padStart(4, "0"); };
          out.push(["AD9833 FREQ0 (LSB, MSB)", h(0x4000 | lsb) + ", " + h(0x4000 | msb)]);
        }
        return out;
      }, ref: "V15, V16, K12" },
    rc: { t: "วงจร RC อันดับหนึ่ง", ins: [["r", "R", "Ω", "10k"], ["c", "C", "F", "10n"], ["f", "ความถี่ที่สนใจ", "Hz", "1k"]],
      f: function (x) { var tau = x.r * x.c, fc = 1 / (TAU * tau), w = TAU * x.f * tau, H = 1 / Math.sqrt(1 + w * w); return [["τ = RC", si(tau, "s")], ["f_c = 1/(2πRC)", si(fc, "Hz")], ["ต่ำผ่าน |H| ที่ f", H.toFixed(4) + " (" + (20 * Math.log10(H)).toFixed(2) + " dB)"], ["ต่ำผ่าน เฟส", (-Math.atan(w) * 180 / PI).toFixed(2) + "°"], ["สูงผ่าน |H| ที่ f", (w * H).toFixed(4) + " (" + (20 * Math.log10(w * H)).toFixed(2) + " dB)"], ["เวลาขาขึ้น 10–90 % = 2.2τ", si(2.2 * tau, "s")]]; }, ref: "R1, R5, R6" },
    rlc: { t: "RLC อนุกรม", ins: [["r", "R รวม (รวม 50 Ω ของเครื่อง)", "Ω", "150"], ["l", "L", "H", "10m"], ["c", "C", "F", "100n"]],
      f: function (x) { var w0 = 1 / Math.sqrt(x.l * x.c), Q = Math.sqrt(x.l / x.c) / x.r, z = 1 / (2 * Q), out = [["f₀", si(w0 / TAU, "Hz")], ["Q", Q.toFixed(3)], ["แบนด์วิดท์ −3 dB", si(w0 / TAU / Q, "Hz")], ["ζ", z.toFixed(4)]]; if (z < 1) { var wd = w0 * Math.sqrt(1 - z * z); out.push(["ความถี่แกว่ง f_d", si(wd / TAU, "Hz")], ["%OS (เอาต์พุตคร่อม C)", (100 * Math.exp((-z * PI) / Math.sqrt(1 - z * z))).toFixed(2) + " %"]); } return out; }, ref: "R9, R10, R11" },
    opamp: { t: "ขีดจำกัดออปแอมป์", ins: [["g", "เกนที่ต้องการ |A_v|", "", "10"], ["cfg", "วงจร", "sel", "ไม่กลับเฟส", ["ไม่กลับเฟส", "กลับเฟส"]], ["gbw", "GBW", "Hz", "1M"], ["sr", "สลูว์เรต (V/µs)", "", "0.5"], ["vo", "แอมพลิจูดขาออกที่ต้องการ (Vp)", "V", "5"]],
      f: function (x) { var ng = x.cfg === "กลับเฟส" ? x.g + 1 : x.g, bw = x.gbw / ng, fp = (x.sr * 1e6) / (TAU * x.vo); return [["Noise gain", ng.toFixed(2)], ["แบนด์วิดท์ −3 dB", si(bw, "Hz")], ["FPBW ที่ V_op นี้", si(fp, "Hz")], ["ใช้ได้ถึง (ค่าน้อยกว่า)", si(Math.min(bw, fp), "Hz")], ["เวลาขาขึ้นสัญญาณเล็ก 0.35/BW", si(0.35 / bw, "s")]]; }, ref: "U5, U6" },
    "555": { t: "IC 555 แบบ astable", ins: [["r1", "R_A", "Ω", "1k"], ["r2", "R_B", "Ω", "10k"], ["c", "C", "F", "10n"]],
      f: function (x) { var th = 0.693 * (x.r1 + x.r2) * x.c, tl = 0.693 * x.r2 * x.c; return [["t_H = 0.693(R_A+R_B)C", si(th, "s")], ["t_L = 0.693 R_B C", si(tl, "s")], ["f = 1.44/((R_A+2R_B)C)", si(1 / (th + tl), "Hz")], ["ดิวตี้", ((100 * th) / (th + tl)).toFixed(2) + " %"]]; }, ref: "K4, K5" },
    wien: { t: "ออสซิลเลเตอร์ Wien bridge", ins: [["r", "R (ทั้งสองตัว)", "Ω", "10k"], ["c", "C (ทั้งสองตัว)", "F", "16n"]],
      f: function (x) { return [["f₀ = 1/(2πRC)", si(1 / (TAU * x.r * x.c), "Hz")], ["เกนที่ต้องการ", "3 (R_f = 2R_g)"], ["ตัวอย่าง R_g = 10 kΩ", "R_f ≈ 20 kΩ + กลไกคุมแอมพลิจูด"]]; }, ref: "K6, K7" },
    ripple: { t: "แรงดันริปเปิลของวงจรเรียงกระแส", ins: [["vp", "ค่ายอดหลังไดโอด V_peak", "V", "12"], ["f", "ความถี่ไฟเข้า", "Hz", "50"], ["rl", "R_L", "Ω", "100"], ["c", "C", "F", "2200u"], ["t", "ชนิด", "sel", "เต็มคลื่น", ["ครึ่งคลื่น", "เต็มคลื่น"]]],
      f: function (x) { var fr = x.t === "เต็มคลื่น" ? 2 * x.f : x.f, vr = x.vp / (fr * x.rl * x.c); return [["ความถี่ริปเปิล", si(fr, "Hz")], ["V_r(pp) ≈ V_peak/(f_r R_L C)", si(vr, "V")], ["V_DC ≈ V_peak − V_r/2", si(x.vp - vr / 2, "V")], ["V_r(rms) ≈ V_r/(2√3)", si(vr / (2 * Math.sqrt(3)), "V")]]; }, ref: "X2, X3" },
    schmitt: { t: "ชมิตต์ทริกเกอร์กลับเฟส", ins: [["r1", "R₁ (ป้อนกลับ)", "Ω", "10k"], ["r2", "R₂ (ลงกราวด์)", "Ω", "1k"], ["vs", "V_sat", "V", "13.5"]],
      f: function (x) { var b = x.r2 / (x.r1 + x.r2); return [["β = R₂/(R₁+R₂)", b.toFixed(4)], ["V_TH", si(b * x.vs, "V")], ["V_TL", si(-b * x.vs, "V")], ["ฮิสเทอรีซิส", si(2 * b * x.vs, "V")]]; }, ref: "U11" },
    relax: { t: "ออสซิลเลเตอร์ผ่อนคลายด้วยออปแอมป์", ins: [["r", "R (ชาร์จ C)", "Ω", "10k"], ["c", "C", "F", "47n"], ["r1", "R₁ (ป้อนกลับ)", "Ω", "10k"], ["r2", "R₂ (ลงกราวด์)", "Ω", "10k"]],
      f: function (x) { var b = x.r2 / (x.r1 + x.r2), T = 2 * x.r * x.c * Math.log((1 + b) / (1 - b)); return [["β", b.toFixed(4)], ["T = 2RC ln((1+β)/(1−β))", si(T, "s")], ["f", si(1 / T, "Hz")], ["แรงดันบน C แกว่ง", "±β V_sat"]]; }, ref: "K2" },
    scope: { t: "สโคปพอสำหรับงานนี้ไหม", ins: [["tr", "เวลาขาขึ้นของสัญญาณ", "s", "10n"], ["bw", "แบนด์วิดท์สโคป", "Hz", "100M"], ["fs", "อัตราสุ่ม", "Sa/s", "1G"]],
      f: function (x) { var ts = 0.35 / x.bw, tm = Math.sqrt(x.tr * x.tr + ts * ts); return [["เวลาขาขึ้นของสโคป 0.35/BW", si(ts, "s")], ["ค่าที่จะวัดได้", si(tm, "s")], ["คลาดเคลื่อน", ((100 * (tm - x.tr)) / x.tr).toFixed(1) + " %"], ["BW ที่ควรใช้ (คลาดเคลื่อน ≈ 3 %)", si(0.35 / (x.tr / 4), "Hz")], ["จุดสุ่มบนขอบ (10–90 %)", (x.tr * x.fs).toFixed(1) + " จุด"]]; }, ref: "O8, O9" }
  };
  function build(host) {
    var c = CALC[host.getAttribute("data-calc")]; if (!c) return;
    host.innerHTML = "";
    var h = document.createElement("p"); h.className = "fc-t"; h.innerHTML = "<b>" + c.t + "</b>" + (c.ref ? ' <span class="mono">สูตร ' + c.ref + "</span>" : ""); host.appendChild(h);
    var form = document.createElement("div"); form.className = "fc-in"; host.appendChild(form);
    var out = document.createElement("dl"); out.className = "fc-out"; out.setAttribute("aria-live", "polite"); host.appendChild(out);
    var inputs = {};
    c.ins.forEach(function (d) {
      var id = "fc" + Math.random().toString(36).slice(2, 8), w = document.createElement("label"); w.setAttribute("for", id);
      w.innerHTML = "<span>" + d[1] + "</span>";
      var el;
      if (d[2] === "sel") { el = document.createElement("select"); d[4].forEach(function (o) { var op = document.createElement("option"); op.textContent = o; el.appendChild(op); }); el.value = d[3]; }
      else { el = document.createElement("input"); el.type = "text"; el.inputMode = "decimal"; el.value = d[3]; el.spellcheck = false; }
      var pre = host.getAttribute("data-" + d[0]); if (pre != null) el.value = pre;
      el.id = id; w.appendChild(el);
      if (d[2] && d[2] !== "sel") { var u = document.createElement("i"); u.textContent = d[2]; w.appendChild(u); }
      form.appendChild(w); inputs[d[0]] = el;
      el.addEventListener("input", run);
    });
    function run() {
      var x = {}, bad = false;
      c.ins.forEach(function (d) { var v = inputs[d[0]].value; if (d[2] === "sel") x[d[0]] = v; else { x[d[0]] = parse(v); if (!isFinite(x[d[0]])) bad = true; } });
      if (bad) { out.innerHTML = "<dt>ใส่ตัวเลขให้ครบ</dt><dd>ใช้หน่วยย่อได้ เช่น 10k, 4.7n</dd>"; return; }
      out.innerHTML = c.f(x).map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    }
    run();
  }
  function boot() { document.querySelectorAll(".fg-calc").forEach(build); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
