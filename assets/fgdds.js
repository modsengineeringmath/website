/* DDS phase-accumulator visualiser for /learn/function-generator/build/:
   <div class="dds-lab" data-n="5" data-m="3" data-b="4"></div>
   N-bit phase accumulator (wheel), tuning word M, sine look-up table, B-bit DAC staircase vs the ideal sine,
   plus the formulas f_out = M f_clk / 2^N, samples per cycle and the alias above Nyquist. */
(function () {
  "use strict";
  var TAU = 2 * Math.PI;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function si(v, u) {
    var P = [[1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"]], a = Math.abs(v);
    for (var i = 0; i < P.length; i++) if (a >= P[i][0] * 0.9999 || i === P.length - 1) return (+(v / P[i][0]).toPrecision(5)).toString() + " " + P[i][1] + u;
  }

  function build(host) {
    var st = { n: +host.getAttribute("data-n") || 5, m: +host.getAttribute("data-m") || 3, b: +host.getAttribute("data-b") || 4, k: 0, play: false, fclk: 1e6 };
    host.innerHTML = "";
    var ctl = el("div", "dds-ctl");
    function slider(label, min, max, get, set) {
      var id = "dds" + Math.random().toString(36).slice(2, 7), w = el("div", "row");
      w.innerHTML = '<label for="' + id + '">' + label + " <output></output></label>" + '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="1">';
      var inp = w.querySelector("input"), out = w.querySelector("output");
      w.sync = function (mx) { if (mx != null) inp.max = mx; inp.value = get(); out.textContent = get(); };
      inp.addEventListener("input", function () { set(+inp.value); w.sync(); draw(); });
      return w;
    }
    var sN = slider("จำนวนบิตตัวสะสมเฟส N", 3, 10, function () { return st.n; }, function (v) { st.n = v; st.m = Math.min(st.m, Math.pow(2, v) - 1); st.k = 0; sM.sync(Math.pow(2, v) - 1); });
    var sM = slider("เลขปรับความถี่ M", 1, Math.pow(2, st.n) - 1, function () { return st.m; }, function (v) { st.m = v; st.k = 0; });
    var sB = slider("ความละเอียด DAC (บิต)", 2, 8, function () { return st.b; }, function (v) { st.b = v; });
    ctl.appendChild(sN); ctl.appendChild(sM); ctl.appendChild(sB);
    var btns = el("div", "dds-btns");
    var bPlay = el("button", "btn btn-primary btn-sm", "▶ เล่น"), bStep = el("button", "btn btn-ghost btn-sm", "+1 สัญญาณนาฬิกา"), bReset = el("button", "btn btn-ghost btn-sm", "เริ่มใหม่");
    [bPlay, bStep, bReset].forEach(function (b) { b.type = "button"; btns.appendChild(b); });
    ctl.appendChild(btns);
    var out = el("dl", "fc-out dds-out"); out.setAttribute("aria-live", "polite");
    ctl.appendChild(out);
    var fig = el("div", "fgfig dds-fig");
    host.appendChild(fig); host.appendChild(ctl);
    sN.sync(); sM.sync(); sB.sync();

    function draw() {
      var L = Math.pow(2, st.n), M = st.m, Q = Math.pow(2, st.b), acc = (st.k * M) % L;
      var spc = L / M; // samples per output cycle
      var S = Math.max(24, Math.min(96, Math.ceil(2.2 * spc))), k0 = Math.max(0, st.k - S + 1);
      // ---- wheel
      var cx = 150, cy = 150, R = 110, h = [];
      h.push('<svg viewBox="0 0 660 300" role="img" aria-label="วงล้อเฟส ' + L + ' ช่อง ตำแหน่งปัจจุบัน ' + acc + ' เดินทีละ ' + M + ' ช่องต่อสัญญาณนาฬิกา และกราฟขาออก DAC แบบขั้นบันไดเทียบกับไซน์อุดมคติ">');
      h.push('<circle class="bx" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>');
      var nt = Math.min(L, 128);
      for (var i = 0; i < nt; i++) {
        var a = (i / nt) * TAU - Math.PI / 2, r1 = R - (i % (nt / 4) === 0 ? 14 : 7);
        h.push('<line class="ax" x1="' + f1(cx + R * Math.cos(a)) + '" y1="' + f1(cy + R * Math.sin(a)) + '" x2="' + f1(cx + r1 * Math.cos(a)) + '" y2="' + f1(cy + r1 * Math.sin(a)) + '"/>');
      }
      // visited positions during the last few clocks
      for (var j = Math.max(0, st.k - 12); j <= st.k; j++) {
        var p = (j * M) % L, aa = (p / L) * TAU - Math.PI / 2, op = 0.25 + 0.75 * (1 - (st.k - j) / 13);
        h.push('<circle cx="' + f1(cx + (R - 22) * Math.cos(aa)) + '" cy="' + f1(cy + (R - 22) * Math.sin(aa)) + '" r="5" style="fill:var(--accent);opacity:' + op.toFixed(2) + '"/>');
      }
      var ac = (acc / L) * TAU - Math.PI / 2;
      h.push('<line class="w3" x1="' + cx + '" y1="' + cy + '" x2="' + f1(cx + (R - 22) * Math.cos(ac)) + '" y2="' + f1(cy + (R - 22) * Math.sin(ac)) + '"/>');
      h.push('<circle class="ar-h" cx="' + cx + '" cy="' + cy + '" r="4"/>');
      h.push('<text x="' + cx + '" y="' + (cy - R - 12) + '" text-anchor="middle" class="s">0 (เฟส 0°)</text>');
      h.push('<text x="' + cx + '" y="' + (cy + 30) + '" text-anchor="middle" class="t">' + acc + " / " + L + "</text>");
      h.push('<text x="' + cx + '" y="' + (cy + 48) + '" text-anchor="middle" class="s">ค่าในตัวสะสมเฟส</text>');
      // ---- output plot
      var X0 = 310, W = 330, Y0 = 40, H = 220, X = function (t) { return X0 + (t / (S - 1)) * W; }, Y = function (v) { return Y0 + H / 2 - v * (H / 2 - 10); };
      h.push('<line class="ax" x1="' + X0 + '" y1="' + f1(Y(0)) + '" x2="' + (X0 + W + 8) + '" y2="' + f1(Y(0)) + '"/>');
      h.push('<line class="ax" x1="' + X0 + '" y1="' + (Y0 + H) + '" x2="' + X0 + '" y2="' + (Y0 - 4) + '"/>');
      var ideal = [];
      for (var q = 0; q <= 400; q++) { var t = (q / 400) * (S - 1); ideal.push(f1(X(t)) + " " + f1(Y(Math.sin(TAU * (((k0 + t) * M) % L) / L)))); }
      h.push('<path class="dsh" d="M' + ideal.join(" L") + '"/>');
      var stair = [], lv = function (kk) { var s = Math.sin(TAU * ((kk * M) % L) / L); return (Math.round(((s + 1) / 2) * (Q - 1)) / (Q - 1)) * 2 - 1; };
      for (var kk = 0; kk < S; kk++) {
        var v = lv(k0 + kk);
        stair.push(f1(X(kk)) + " " + f1(Y(v)));
        stair.push(f1(X(Math.min(kk + 1, S - 1))) + " " + f1(Y(v)));
      }
      h.push('<path class="w2" d="M' + stair.join(" L") + '"/>');
      var cur = st.k - k0;
      h.push('<circle cx="' + f1(X(cur)) + '" cy="' + f1(Y(lv(st.k))) + '" r="5" style="fill:var(--accent)"/>');
      h.push('<text x="' + X0 + '" y="' + (Y0 - 12) + '" class="s">ขาออก DAC ' + st.b + " บิต (ฟ้า) · ไซน์ที่ควรได้หลังกรอง (ประ)</text>");
      h.push('<text x="' + (X0 + W) + '" y="' + (Y0 + H + 18) + '" text-anchor="end" class="s">สัญญาณนาฬิกาที่ ' + k0 + "–" + (k0 + S - 1) + "</text>");
      h.push("</svg>");
      fig.innerHTML = h.join("");
      var ratio = M / L, alias = M > L / 2, fo = ratio * st.fclk;
      var rows = [["f_out / f_clk = M/2ᴺ", M + "/" + L + " = " + ratio.toFixed(4)],
        ["ถ้า f_clk = 1 MHz → f_out", si(fo, "Hz")],
        ["จุดต่อหนึ่งคาบ 2ᴺ/M", spc.toFixed(2)],
        ["ความละเอียด Δf = f_clk/2ᴺ", si(st.fclk / L, "Hz")],
        ["ภาพสะท้อนแรก f_clk − f_out", si(st.fclk - fo, "Hz")]];
      if (alias) rows.push(["⚠ เกินไนควิสต์ (M > 2ᴺ⁻¹)", "หลังกรองจะเห็น " + si(st.fclk - fo, "Hz") + " แทน"]);
      else if (spc < 2.5) rows.push(["⚠ จุดต่อคาบน้อย", "ตัวกรองแยกภาพสะท้อนยาก ใช้ ≤ 0.4 f_clk"]);
      out.innerHTML = rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    }
    var timer = null;
    function setPlay(p) {
      st.play = p; bPlay.textContent = p ? "■ หยุด" : "▶ เล่น";
      if (timer) { clearInterval(timer); timer = null; }
      if (p) timer = setInterval(function () { if (!document.hidden) { st.k++; draw(); } }, 420);
    }
    bPlay.addEventListener("click", function () { setPlay(!st.play); });
    bStep.addEventListener("click", function () { setPlay(false); st.k++; draw(); });
    bReset.addEventListener("click", function () { setPlay(false); st.k = 0; draw(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting && st.play) setPlay(false); }); }).observe(host);
    draw();
  }
  function boot() { document.querySelectorAll(".dds-lab").forEach(build); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
