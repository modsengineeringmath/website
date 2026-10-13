/* Power factor simulator, virtual capacitor bank and calculators for /learn/power-factor/ — needs assets/ee-kit.js first.
   Simulator:  <div class="pf-sim" [data-preset="motor"] [data-compact] [data-views="wave,phasor,tri,meter,cable"]></div>
               <button data-pf-preset="name" [data-pf-target="id"]> loads a preset into the simulator on the page.
   Capacitor bank over a working day: <div class="pf-bank" [data-steps="6x25"] [data-target="0.95"]></div>
   Calculators: <div class="fg-calc pf-calc" data-pf="qc|bill|twowatt|truepf|resonance|motor|avg"></div>
   Model: sinusoidal supply V∠0; every load has fundamental P and Q (+ = lagging) and, for non-linear loads, harmonic currents
   in % of its own fundamental current. Thai PF charge 56.07 ฿ per kvar above 61.97 % of the kW demand (PF 0.85). */
(function (root) {
  "use strict";
  var K = root.EEKit;
  var n = K.n, ok = K.ok, warn = K.warn, baht = K.baht, esc = K.esc;
  var D2R = Math.PI / 180, TAU = 2 * Math.PI;
  var PF_RATE = 56.07, PF_LIMIT = 0.6197;

  // ------------------------------------------------------------------ load library (per item, at rated voltage)
  // h: [[order, % of the load's fundamental current, phase of the sine term in degrees]] — peaky rectifier current centred on the voltage peak
  var RECT = [[3, 80, 180], [5, 55, 0], [7, 30, 180], [9, 12, 0], [11, 6, 180], [13, 4, 0]];
  var LIB = [
    { id: "heater", icon: "♨", name: "ฮีตเตอร์ / กาต้มน้ำ", note: "ตัวต้านทานล้วน PF = 1", p: 2.0, q: 0 },
    { id: "motor", icon: "⚙", name: "มอเตอร์ 3 kW (ปั๊ม/คอมเพรสเซอร์)", note: "กระแสแม่เหล็กทำให้ PF ตามหลัง ยิ่งโหลดเบา PF ยิ่งต่ำ", motor: true },
    { id: "fluo", icon: "💡", name: "หลอดฟลูออเรสเซนต์บัลลาสต์แกนเหล็ก ×10", note: "บัลลาสต์เป็นขดลวด PF ≈ 0.5 ตามหลัง", p: 0.46, q: 0.797, h: [[3, 12, 180], [5, 4, 0]] },
    { id: "smps", icon: "🖥", name: "คอมพิวเตอร์ / ไดรเวอร์ LED ไม่มี PFC ×10", note: "cos φ ≈ 1 แต่กระแสเป็นยอดแหลม ฮาร์มอนิกสูง", p: 1.5, q: -0.25, h: RECT },
    { id: "invac", icon: "❄", name: "แอร์อินเวอร์เตอร์ (มี PFC)", note: "วงจร PFC ทำให้กระแสเกือบเป็นไซน์", p: 1.0, q: 0.15, h: [[3, 6, 180], [5, 4, 0]] },
    { id: "fridge", icon: "🧊", name: "ตู้เย็น (คอมเพรสเซอร์เล็ก)", note: "มอเตอร์เล็ก PF ≈ 0.7", p: 0.12, q: 0.122 },
    { id: "custom", icon: "⚗", name: "โหลดทดลอง R–X", note: "ตั้ง P และ Q เอง Q ติดลบ = ตัวเก็บประจุ", custom: true }
  ];
  var motorPQ = function (L) { var P = 0.35 + 3 * L / 0.9, Qfl = (0.35 + 3 / 0.9) * Math.tan(Math.acos(0.84)), Q0 = 0.6 * Qfl; return [P, Q0 + (Qfl - Q0) * L * L]; };

  var PRESETS = {
    heater: { t: "ฮีตเตอร์ล้วน", qty: { heater: 1 }, steps: 0 },
    motor: { t: "มอเตอร์ปั๊มน้ำ 75 %", qty: { motor: 1 }, ml: 75, steps: 0, step: 0.5 },
    "motor-light": { t: "มอเตอร์โหลดเบา 25 %", qty: { motor: 1 }, ml: 25, steps: 0, step: 0.5 },
    "motor-fixed": { t: "มอเตอร์ + คาปาซิเตอร์ 3 ขั้น", qty: { motor: 1 }, ml: 75, steps: 3, step: 0.5 },
    over: { t: "ชดเชยเกิน (นำหน้า)", qty: { motor: 1 }, ml: 25, steps: 6, step: 0.5 },
    fluo: { t: "ร้านค้า: หลอดบัลลาสต์", qty: { fluo: 2 }, steps: 0, step: 0.25 },
    smps: { t: "สำนักงาน: คอมพิวเตอร์ไม่มี PFC", qty: { smps: 1 }, steps: 0, step: 0.25 },
    "smps-cap": { t: "คาปาซิเตอร์ช่วยฮาร์มอนิกไม่ได้", qty: { smps: 1 }, steps: 2, step: 0.25 },
    mixed: { t: "บ้านผสม: แอร์ ตู้เย็น ไฟ ปั๊ม", qty: { invac: 1, fridge: 1, fluo: 1, motor: 1 }, ml: 50, steps: 0, step: 0.25 },
    custom: { t: "R–X อิสระ", qty: { custom: 1 }, cp: 1, cq: 1, steps: 0, step: 0.5 }
  };

  function solve(st) {
    // returns fundamental and harmonic phasors of the total current (A rms), powers, PF numbers
    var V = st.v, P = 0, Q = 0, H = {}, items = [];
    LIB.forEach(function (L) {
      var q = st.qty[L.id] || 0; if (!q) return;
      var pq = L.motor ? motorPQ(st.ml / 100) : L.custom ? [st.cp, st.cq] : [L.p, L.q];
      var p = pq[0] * q, qq = pq[1] * q; P += p; Q += qq;
      var i1 = Math.hypot(p, qq) * 1000 / V;
      (L.h || []).forEach(function (h) { var a = i1 * h[1] / 100; if (!H[h[0]]) H[h[0]] = [0, 0]; H[h[0]][0] += a * Math.cos(h[2] * D2R); H[h[0]][1] += a * Math.sin(h[2] * D2R); });
      items.push({ L: L, p: p, q: qq });
    });
    var qc = st.steps * st.step, Qt = Q - qc;
    var re = P * 1000 / V, im = -Qt * 1000 / V, i1 = Math.hypot(re, im), th = Math.atan2(im, re); // current phasor angle (negative = lagging)
    var hs = Object.keys(H).map(Number).sort(function (a, b) { return a - b; }), ih2 = 0;
    hs.forEach(function (h) { ih2 += H[h][0] * H[h][0] + H[h][1] * H[h][1]; });
    var irms = Math.sqrt(i1 * i1 + ih2), S = V * irms / 1000, S1 = Math.hypot(P, Qt);
    var thd = i1 > 1e-9 ? Math.sqrt(ih2) / i1 : 0, dpf = S1 > 1e-9 ? P / S1 : 1, pf = S > 1e-9 ? P / S : 1;
    var i1nc = Math.hypot(P, Q) * 1000 / V;
    return { V: V, P: P, Q: Q, Qc: qc, Qt: Qt, S: S, S1: S1, D: Math.sqrt(Math.max(0, S * S - S1 * S1)), I1: i1, th: th, H: H, hs: hs, Irms: irms, thd: thd, dpf: dpf, pf: pf, items: items, Inc: Math.sqrt(i1nc * i1nc + ih2), PFnc: P / Math.max(1e-9, V * Math.sqrt(i1nc * i1nc + ih2) / 1000) };
  }
  function iAt(r, wt) {
    var i = Math.SQRT2 * r.I1 * Math.sin(wt + r.th);
    r.hs.forEach(function (h) { var c = r.H[h]; i += Math.SQRT2 * (c[0] * Math.sin(h * wt) + c[1] * Math.cos(h * wt)); });
    return i;
  }
  var lagLead = function (r) { return Math.abs(r.Qt) < 1e-6 ? "" : r.Qt > 0 ? " ตามหลัง (lag)" : " นำหน้า (lead)"; };

  // ------------------------------------------------------------------ simulator UI
  function buildSim(host) {
    var views = (host.getAttribute("data-views") || "wave,phasor,tri,meter,cable").split(",");
    var compact = host.hasAttribute("data-compact");
    var mini = host.hasAttribute("data-mini"), only = (host.getAttribute("data-loads") || "").split(",").filter(Boolean);
    var st = { v: 230, qty: {}, ml: 75, cp: 1, cq: 1, steps: 0, step: 0.5, play: false, t: 0, len: 25, a: 4, hrs: 8 };
    var reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var id = K.uid("pfs");
    var h = '<p class="fc-t"><b>ซิมูเลเตอร์เพาเวอร์แฟกเตอร์: โหลดจริง คลื่น เฟสเซอร์ สามเหลี่ยมกำลัง และมิเตอร์</b> <span class="mono">สูตร B1–B8 · W1–W6 · C1–C5</span></p>';
    if (!mini) h += '<div class="pv-btns pf-pre" role="group" aria-label="สถานการณ์"><span class="mono">สถานการณ์:</span>' + Object.keys(PRESETS).filter(function (k) { return !compact || ["heater", "motor", "motor-fixed", "smps", "over"].indexOf(k) >= 0; }).map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm" data-p="' + k + '">' + PRESETS[k].t + "</button>"; }).join("") + "</div>";
    h += '<div class="pf-body"><div class="pf-ctl">';
    h += '<div class="pf-loads" role="group" aria-label="โหลด">' + LIB.filter(function (L) { return !only.length || only.indexOf(L.id) >= 0; }).map(function (L) {
      return '<div class="pf-load" data-l="' + L.id + '"><span class="pf-ic" aria-hidden="true">' + L.icon + '</span><span class="pf-ln"><b>' + L.name + "</b><small>" + L.note + '</small></span><span class="pf-qty"><button type="button" class="pf-b" data-d="-1" aria-label="ลด ' + esc(L.name) + '">−</button><output>0</output><button type="button" class="pf-b" data-d="1" aria-label="เพิ่ม ' + esc(L.name) + '">+</button></span>' +
        (L.motor ? '<label class="pf-sl">โหลดมอเตอร์ <output data-o="ml"></output><input type="range" min="0" max="110" step="5" data-k="ml"></label>' : "") +
        (L.custom ? '<label class="pf-sl">P <output data-o="cp"></output><input type="range" min="0" max="5" step="0.1" data-k="cp"></label><label class="pf-sl">Q (+ ขดลวด, − คาปาซิเตอร์) <output data-o="cq"></output><input type="range" min="-5" max="5" step="0.1" data-k="cq"></label>' : "") + "</div>";
    }).join("") + "</div>";
    h += '<div class="pf-cap"><p class="pf-h"><b>⚡ ตู้คาปาซิเตอร์ 6 ขั้น</b> <label>ขั้นละ <input type="text" inputmode="decimal" data-k="step" value="0.5"> kvar</label></p><div class="pf-steps">' +
      [1, 2, 3, 4, 5, 6].map(function (k) { return '<button type="button" class="pf-step" data-s="' + k + '" aria-pressed="false">C' + k + "</button>"; }).join("") +
      '</div><div class="pv-btns"><button type="button" class="btn btn-ghost btn-sm" data-auto>ปรับอัตโนมัติให้ PF ≥ 0.95</button><button type="button" class="btn btn-ghost btn-sm" data-off>ปลดทั้งหมด</button></div></div>';
    if (!mini) h += '<div class="fc-in pf-sys"><label><span>แรงดันแหล่งจ่าย</span><input type="text" inputmode="decimal" data-k="v" value="230"><i>V</i></label>' +
      (views.indexOf("cable") >= 0 ? '<label><span>สายไฟจากตู้ (ทางเดียว)</span><input type="text" inputmode="decimal" data-k="len" value="25"><i>m</i></label><label><span>ขนาดสาย</span><input type="text" inputmode="decimal" data-k="a" value="4"><i>mm²</i></label><label><span>ใช้งานต่อวัน</span><input type="text" inputmode="decimal" data-k="hrs" value="8"><i>ชม.</i></label>' : "") + "</div>";
    h += "</div>"; // ctl
    h += '<div class="pf-out">';
    if (views.indexOf("meter") >= 0) h += '<div class="pf-meters" aria-live="polite"></div>';
    if (views.indexOf("wave") >= 0) h += '<div class="pf-wave-h"><b>รูปคลื่น v(t) · i(t) · p(t)</b><span class="pv-btns"><button type="button" class="btn btn-ghost btn-sm" data-play>▶ เล่น</button><label class="pf-cb"><input type="checkbox" data-k="pshow" checked> แสดง p(t)</label></span></div><div class="pf-wave"></div><p class="pf-now mono" aria-live="off"></p>';
    h += '<div class="pf-pair">' + (views.indexOf("phasor") >= 0 ? '<div class="pf-ph"></div>' : "") + (views.indexOf("tri") >= 0 ? '<div class="pf-tri"></div>' : "") + "</div>";
    if (views.indexOf("cable") >= 0) h += '<dl class="fc-out pf-cable"></dl>';
    h += '<p class="pv-note pf-explain"></p></div></div>';
    host.innerHTML = h;
    var q = function (s) { return host.querySelector(s); }, qa = function (s) { return Array.prototype.slice.call(host.querySelectorAll(s)); };
    var pshow = true, raf = 0, last = 0, R = null;

    qa(".pf-load").forEach(function (el) {
      var lid = el.getAttribute("data-l");
      el.querySelectorAll(".pf-b").forEach(function (b) { b.addEventListener("click", function () { st.qty[lid] = Math.max(0, Math.min(9, (st.qty[lid] || 0) + +b.getAttribute("data-d"))); update(); }); });
    });
    qa("input[type=range][data-k]").forEach(function (el) { el.addEventListener("input", function () { st[el.getAttribute("data-k")] = +el.value; update(); }); });
    qa('input[type=text][data-k]').forEach(function (el) { el.addEventListener("input", function () { var v = K.parse(el.value); if (isFinite(v) && v >= 0) { st[el.getAttribute("data-k")] = v; update(); } }); });
    qa(".pf-step").forEach(function (b) { b.addEventListener("click", function () { var k = +b.getAttribute("data-s"); st.steps = st.steps >= k ? k - 1 : k; update(); }); });
    q("[data-auto]").addEventListener("click", function () {
      st.steps = 0; for (var k = 0; k <= 6; k++) { st.steps = k; var r = solve(st); if (r.dpf >= 0.95 && r.Qt >= -1e-9) break; if (r.Qt < 0) { st.steps = Math.max(0, k - 1); break; } }
      update();
    });
    q("[data-off]").addEventListener("click", function () { st.steps = 0; update(); });
    qa("[data-p]").forEach(function (b) { b.addEventListener("click", function () { preset(b.getAttribute("data-p")); }); });
    var pb = q("[data-play]");
    if (pb) pb.addEventListener("click", function () { st.play = !st.play; pb.textContent = st.play ? "❚❚ หยุด" : "▶ เล่น"; if (st.play) { last = 0; raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf); });
    var pc = q('[data-k="pshow"]'); if (pc) pc.addEventListener("change", function () { pshow = pc.checked; draw(); });

    function preset(name) {
      var p = PRESETS[name]; if (!p) return;
      st.qty = {}; Object.keys(p.qty).forEach(function (k) { st.qty[k] = p.qty[k]; });
      if (p.ml != null) st.ml = p.ml; if (p.cp != null) st.cp = p.cp; if (p.cq != null) st.cq = p.cq;
      st.steps = p.steps || 0; if (p.step != null) st.step = p.step;
      var se = q('[data-k="step"]'); if (se) se.value = st.step;
      qa("[data-p]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-p") === name); });
      update();
    }
    host._preset = preset;

    function update() {
      qa(".pf-load").forEach(function (el) { var v = st.qty[el.getAttribute("data-l")] || 0; el.querySelector("output").textContent = v; el.classList.toggle("on", v > 0); });
      qa("[data-o]").forEach(function (o) { var k = o.getAttribute("data-o"); o.textContent = k === "ml" ? st.ml + " %" : k === "cp" ? n(st.cp, 1) + " kW" : n(st.cq, 1) + " kvar"; });
      qa("input[type=range][data-k]").forEach(function (el) { el.value = st[el.getAttribute("data-k")]; });
      qa(".pf-step").forEach(function (b) { var on = +b.getAttribute("data-s") <= st.steps; b.setAttribute("aria-pressed", on); b.classList.toggle("on", on); });
      R = solve(st);
      draw(); meters(); tri(); cable(); explain();
    }

    // ---------- waveform
    function draw() {
      var el = q(".pf-wave"); if (!el || !R) return;
      var W = 680, H = 290, L = 46, Rr = 46, T = 30, B = 34, cyc = 2;
      var vpk = Math.SQRT2 * R.V, ipk = 1e-9, ppk = 1e-9, N = 400, pts = { v: [], i: [], p: [] }, k, wt;
      for (k = 0; k <= N; k++) { wt = cyc * TAU * k / N; var v = vpk * Math.sin(wt), i = iAt(R, wt); pts.v.push([k, v]); pts.i.push([k, i]); pts.p.push([k, v * i]); ipk = Math.max(ipk, Math.abs(i)); ppk = Math.max(ppk, Math.abs(v * i)); }
      var X = function (k) { return L + (W - L - Rr) * k / N; };
      var yv = function (v) { return T + (H - T - B) / 2 * (1 - v / (vpk * 1.08)); }, yi = function (i) { return T + (H - T - B) / 2 * (1 - i / (ipk * 1.08)); }, yp = function (p) { return T + (H - T - B) / 2 * (1 - p / (ppk * 1.08)); };
      var mid = T + (H - T - B) / 2, s = '<svg class="ee-svg pf-wsvg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="รูปคลื่นแรงดัน กระแส และกำลัง">';
      for (k = 0; k <= 8; k++) { var gx = X(N * k / 8); s += '<line class="gr gx" x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="tk" x="' + gx.toFixed(1) + '" y="' + (H - B + 15) + '" text-anchor="middle">' + (k * 5) + "</text>"; }
      s += '<text class="al" x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle">เวลา (ms) · 2 รอบที่ 50 Hz</text>';
      if (pshow) {
        var pos = "M" + X(0) + "," + mid, neg = "M" + X(0) + "," + mid;
        pts.p.forEach(function (p) { var y = yp(p[1]); pos += "L" + X(p[0]).toFixed(1) + "," + Math.min(y, mid).toFixed(1); neg += "L" + X(p[0]).toFixed(1) + "," + Math.max(y, mid).toFixed(1); });
        s += '<path class="pf-ppos" d="' + pos + "L" + X(N) + "," + mid + 'Z"/><path class="pf-pneg" d="' + neg + "L" + X(N) + "," + mid + 'Z"/>';
        s += '<polyline class="s4" points="' + pts.p.map(function (p) { return X(p[0]).toFixed(1) + "," + yp(p[1]).toFixed(1); }).join(" ") + '"/>';
        var pav = R.P * 1000; s += '<line class="hl dsh" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + yp(pav).toFixed(1) + '" y2="' + yp(pav).toFixed(1) + '"/><text class="ml sm" x="' + (W - Rr - 4) + '" y="' + (yp(pav) - 5).toFixed(1) + '" text-anchor="end">P เฉลี่ย = ' + n(R.P, 2) + " kW</text>";
      }
      s += '<line class="ax" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + mid + '" y2="' + mid + '"/>';
      s += '<polyline class="s1 thick" points="' + pts.v.map(function (p) { return X(p[0]).toFixed(1) + "," + yv(p[1]).toFixed(1); }).join(" ") + '"/>';
      s += '<polyline class="s2 thick" points="' + pts.i.map(function (p) { return X(p[0]).toFixed(1) + "," + yi(p[1]).toFixed(1); }).join(" ") + '"/>';
      s += '<text class="tk c1" x="' + (L - 4) + '" y="' + (yv(vpk) + 4).toFixed(1) + '" text-anchor="end">' + Math.round(vpk) + " V</text>";
      s += '<text class="tk c2" x="' + (W - Rr + 4) + '" y="' + (yi(ipk) + 4).toFixed(1) + '">' + n(ipk, 1) + " A</text>";
      s += '<line class="pf-cur" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/>';
      var lg = [["f1", "แรงดัน v(t)"], ["f2", "กระแส i(t)"]].concat(pshow ? [["f4", "กำลัง p(t) = v·i"]] : []), lx = L + 6;
      lg.forEach(function (g) { s += '<rect class="' + g[0] + '" x="' + lx + '" y="9" width="12" height="8" rx="2"/><text class="tk lgt" x="' + (lx + 16) + '" y="17">' + g[1] + "</text>"; lx += 30 + g[1].length * 6.2; });
      el.innerHTML = s + "</svg>";
      el._geo = { X: X, N: N, cyc: cyc };
      cursor();
    }
    function cursor() {
      var el = q(".pf-wave"); if (!el || !el._geo || !R) return;
      var g = el._geo, k = (st.t % 1) * g.N, wt = g.cyc * TAU * k / g.N, line = el.querySelector(".pf-cur");
      line.setAttribute("x1", g.X(k).toFixed(1)); line.setAttribute("x2", g.X(k).toFixed(1));
      var z = function (x, e) { return Math.abs(x) < e ? 0 : x; }, v = z(Math.SQRT2 * R.V * Math.sin(wt), 0.5), i = z(iAt(R, wt), 0.005), p = z(v * i, 5);
      var now = q(".pf-now");
      if (now) now.innerHTML = "t = " + n(k / g.N * 40, 1) + " ms · v = " + n(v, 0) + " V · i = " + n(i, 2) + " A · p = " + n(p / 1000, 2) + " kW " + (p >= 0 ? '<span class="pf-in">→ แหล่งจ่ายส่งพลังงานให้โหลด</span>' : '<span class="pf-back">← โหลดคืนพลังงานกลับแหล่งจ่าย</span>');
      phasor(wt);
    }
    function tick(ts) {
      if (!st.play) return;
      if (last) st.t += (ts - last) / 6000; // 2 cycles every 6 s
      last = ts; cursor(); raf = requestAnimationFrame(tick);
    }

    // ---------- rotating phasors
    function phasor(wt) {
      var el = q(".pf-ph"); if (!el || !R) return;
      var W = 300, H = 270, cx = 150, cy = 140, Rv = 100, ri = R.I1 > 0 ? Math.min(100, 100 * R.I1 / Math.max(R.I1, R.Inc, 1e-9)) : 0;
      var ang = st.play ? wt : 0; // stopped: V on the real axis
      var vx = cx + Rv * Math.cos(ang), vy = cy - Rv * Math.sin(ang), ia = ang + R.th, ix = cx + ri * Math.cos(ia), iy = cy - ri * Math.sin(ia);
      var ipx = cx + ri * Math.cos(R.th) * Math.cos(ang), ipy = cy - ri * Math.cos(R.th) * Math.sin(ang);
      var arrow = function (x, y, c) { var a = Math.atan2(cy - y, x - cx), L = Math.hypot(x - cx, y - cy); if (L < 2) return ""; var hl = Math.min(10, L * 0.3); return '<line class="' + c + ' thick" x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><path class="' + c.replace("s", "f") + '" d="M' + x.toFixed(1) + "," + y.toFixed(1) + "L" + (x - hl * Math.cos(a - 0.4)).toFixed(1) + "," + (y + hl * Math.sin(a - 0.4)).toFixed(1) + "L" + (x - hl * Math.cos(a + 0.4)).toFixed(1) + "," + (y + hl * Math.sin(a + 0.4)).toFixed(1) + 'Z"/>'; };
      var s = '<svg class="ee-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="แผนภาพเฟสเซอร์">';
      s += '<text class="al" x="10" y="18"><tspan font-weight="600">เฟสเซอร์</tspan> ' + (st.play ? "(หมุนตาม ωt)" : "(V อยู่บนแกนจริง)") + "</text>";
      s += '<circle class="gr" cx="' + cx + '" cy="' + cy + '" r="' + Rv + '" fill="none"/><line class="gr" x1="' + (cx - 115) + '" x2="' + (cx + 115) + '" y1="' + cy + '" y2="' + cy + '"/><line class="gr" x1="' + cx + '" x2="' + cx + '" y1="' + (cy - 115) + '" y2="' + (cy + 115) + '"/>';
      if (ri > 2 && Math.abs(R.th) > 0.01) {
        var r0 = 34, a0 = -ang, a1 = -(ang + R.th);
        s += '<path class="pf-arc" d="M' + (cx + r0 * Math.cos(a0)).toFixed(1) + "," + (cy + r0 * Math.sin(a0)).toFixed(1) + "A" + r0 + "," + r0 + " 0 0 " + (R.th < 0 ? 1 : 0) + " " + (cx + r0 * Math.cos(a1)).toFixed(1) + "," + (cy + r0 * Math.sin(a1)).toFixed(1) + '"/>';
        s += '<text class="ml sm" x="' + (cx + 44 * Math.cos(ang + R.th / 2)).toFixed(1) + '" y="' + (cy - 44 * Math.sin(ang + R.th / 2) + 4).toFixed(1) + '">φ = ' + n(Math.abs(R.th) / D2R, 1) + "°</text>";
        s += '<line class="pf-dash" x1="' + ix.toFixed(1) + '" y1="' + iy.toFixed(1) + '" x2="' + ipx.toFixed(1) + '" y2="' + ipy.toFixed(1) + '"/>' + arrow(ipx, ipy, "s5");
      }
      s += arrow(vx, vy, "s1") + arrow(ix, iy, "s2");
      s += '<text class="ml sm c1" x="' + (vx + 6).toFixed(1) + '" y="' + (vy - 6).toFixed(1) + '">V</text><text class="ml sm c2" x="' + (ix + 6).toFixed(1) + '" y="' + (iy + 14).toFixed(1) + '">I₁</text>';
      s += '<text class="tk" x="10" y="' + (H - 26) + '">I₁ = ' + n(R.I1, 2) + " A ∠" + n(R.th / D2R, 1) + "°</text><text class=\"tk\" x=\"10\" y=\"" + (H - 10) + '">I_P = ' + n(R.I1 * Math.cos(R.th), 2) + " A (ทำงาน) · I_Q = " + n(Math.abs(R.I1 * Math.sin(R.th)), 2) + " A</text>";
      el.innerHTML = s + "</svg>";
    }
    // ---------- power triangle
    function tri() {
      var el = q(".pf-tri"); if (!el || !R) return;
      var W = 300, H = 270, ox = 30, oy = 150, mx = Math.max(R.P, Math.abs(R.Q), Math.abs(R.Qt), 0.1), k = 220 / mx;
      if (Math.abs(R.Q) * k > 115) k = 115 / Math.abs(R.Q); if (Math.abs(R.Qt) * k > 115) k = 115 / Math.abs(R.Qt);
      var px = ox + R.P * k, qy0 = oy - R.Q * k, qy1 = oy - R.Qt * k;
      var s = '<svg class="ee-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="สามเหลี่ยมกำลัง"><text class="al" x="10" y="18"><tspan font-weight="600">สามเหลี่ยมกำลัง</tspan> (ขึ้น = ตามหลัง)</text>';
      s += '<line class="ax" x1="' + ox + '" x2="' + (W - 10) + '" y1="' + oy + '" y2="' + oy + '"/>';
      if (R.Qc > 0) s += '<polyline class="s3 dsh2" points="' + ox + "," + oy + " " + px.toFixed(1) + "," + qy0.toFixed(1) + " " + px.toFixed(1) + "," + oy + '"/><line class="s6 thick" x1="' + (px + 10).toFixed(1) + '" y1="' + qy0.toFixed(1) + '" x2="' + (px + 10).toFixed(1) + '" y2="' + qy1.toFixed(1) + '"/><text class="ml sm" x="' + (px + 14).toFixed(1) + '" y="' + ((qy0 + qy1) / 2).toFixed(1) + '">Q_c = ' + n(R.Qc, 2) + "</text>";
      s += '<line class="s1 thick" x1="' + ox + '" y1="' + oy + '" x2="' + px.toFixed(1) + '" y2="' + oy + '"/><line class="s5 thick" x1="' + px.toFixed(1) + '" y1="' + oy + '" x2="' + px.toFixed(1) + '" y2="' + qy1.toFixed(1) + '"/><line class="s2 thick" x1="' + ox + '" y1="' + oy + '" x2="' + px.toFixed(1) + '" y2="' + qy1.toFixed(1) + '"/>';
      s += '<text class="ml sm c1" x="' + ((ox + px) / 2).toFixed(1) + '" y="' + (oy + (R.Qt >= 0 ? 16 : -6)) + '" text-anchor="middle">P = ' + n(R.P, 2) + " kW</text>";
      s += '<text class="ml sm" x="' + (px - 6).toFixed(1) + '" y="' + ((oy + qy1) / 2 + 4).toFixed(1) + '" text-anchor="end">Q = ' + n(R.Qt, 2) + " kvar</text>";
      s += '<text class="ml sm c2" x="' + ((ox + px) / 2 - 8).toFixed(1) + '" y="' + ((oy + qy1) / 2 - 8).toFixed(1) + '" text-anchor="end">S₁ = ' + n(R.S1, 2) + " kVA</text>";
      s += '<text class="tk" x="10" y="' + (H - 26) + '">cos φ = P/S₁ = ' + n(R.dpf, 3) + lagLead(R) + '</text><text class="tk" x="10" y="' + (H - 10) + '">' + (R.thd > 0.05 ? "S รวมฮาร์มอนิก = " + n(R.S, 2) + " kVA → PF จริง " + n(R.pf, 3) : "ไม่มีฮาร์มอนิกมาก: PF ≈ cos φ") + "</text>";
      el.innerHTML = s + "</svg>";
    }
    // ---------- meters
    function dial(pf, th) {
      var a = Math.max(-60, Math.min(60, th / D2R)), cx = 70, cy = 72, r = 56, rad = (-90 - a) * D2R; // lagging (th<0) swings right
      var s = '<svg class="ee-svg pf-dial" viewBox="0 0 140 90" role="img" aria-label="หน้าปัดเพาเวอร์แฟกเตอร์"><path class="gr" fill="none" d="M' + (cx + r * Math.cos(-150 * D2R)).toFixed(1) + "," + (cy + r * Math.sin(-150 * D2R)).toFixed(1) + "A" + r + "," + r + " 0 0 1 " + (cx + r * Math.cos(-30 * D2R)).toFixed(1) + "," + (cy + r * Math.sin(-30 * D2R)).toFixed(1) + '"/>';
      [[-60, "0.5"], [-45.6, ".7"], [-25.8, ".9"], [0, "1"], [25.8, ".9"], [45.6, ".7"], [60, "0.5"]].forEach(function (t) { var b = (-90 + t[0]) * D2R; s += '<line class="ax" x1="' + (cx + (r - 6) * Math.cos(b)).toFixed(1) + '" y1="' + (cy + (r - 6) * Math.sin(b)).toFixed(1) + '" x2="' + (cx + r * Math.cos(b)).toFixed(1) + '" y2="' + (cy + r * Math.sin(b)).toFixed(1) + '"/><text class="tk xs" x="' + (cx + (r + 8) * Math.cos(b)).toFixed(1) + '" y="' + (cy + (r + 8) * Math.sin(b) + 3).toFixed(1) + '" text-anchor="middle">' + t[1] + "</text>"; });
      s += '<text class="tk xs" x="12" y="86">LEAD</text><text class="tk xs" x="128" y="86" text-anchor="end">LAG</text>';
      s += '<line class="pf-needle" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + (r - 10) * Math.cos(rad)).toFixed(1) + '" y2="' + (cy + (r - 10) * Math.sin(rad)).toFixed(1) + '"/><circle class="dot" cx="' + cx + '" cy="' + cy + '" r="4"/>';
      return s + "</svg>";
    }
    function meters() {
      var el = q(".pf-meters"); if (!el || !R) return;
      var m = function (l, v, u, cls) { return '<div class="pf-m' + (cls ? " " + cls : "") + '"><span>' + l + "</span><b>" + v + "</b><i>" + u + "</i></div>"; };
      var bad = R.pf < 0.85;
      el.innerHTML = '<div class="pf-dialbox">' + dial(R.dpf, R.th) + '<span class="mono">cos φ ' + n(R.dpf, 3) + "</span></div>" +
        m("แรงดัน", n(R.V, 0), "V") + m("กระแส rms", n(R.Irms, 2), "A") + m("กำลังจริง P", n(R.P, 2), "kW", "pm-p") + m("รีแอกทีฟ Q", n(R.Qt, 2), "kvar", "pm-q") + m("ปรากฏ S", n(R.S, 2), "kVA", "pm-s") +
        m("PF จริง", n(R.pf, 3), (R.Qt > 1e-6 ? "lag" : R.Qt < -1e-6 ? "lead" : ""), bad ? "pm-bad" : "pm-ok") + m("THD-I", n(R.thd * 100, 0), "%", R.thd > 0.2 ? "pm-bad" : "") + m("คาปาซิเตอร์", n(R.Qc, 2), "kvar");
    }
    function cable() {
      var el = q(".pf-cable"); if (!el || !R) return;
      var rl = 2 * st.len * 0.0206 / Math.max(0.5, st.a), loss = R.Irms * R.Irms * rl, i1 = R.P * 1000 / R.V, loss1 = i1 * i1 * rl, ldNo = R.Inc * R.Inc * rl;
      el.innerHTML = [["กระแสในสายตอนนี้", n(R.Irms, 2) + " A"], ["ถ้า PF = 1 พอดี กระแสจะเหลือ", n(i1, 2) + " A (" + (R.Irms > 0 ? n(i1 / R.Irms * 100, 0) : "—") + " %)"],
        ["ความร้อนในสาย I²R", n(loss, 0) + " W" + (R.Qc > 0 ? " (ก่อนใส่คาปาซิเตอร์ " + n(ldNo, 0) + " W)" : "")], ["สูญเสียเกินจำเป็นเพราะ PF", n(loss - loss1, 0) + " W ≈ " + n((loss - loss1) * st.hrs * 30 / 1000, 1) + " kWh/เดือน"],
        ["แรงดันตกในสาย (โดยประมาณ)", n(R.Irms * rl, 1) + " V"], ["ขนาดมิเตอร์/หม้อแปลงต้องรับ", n(R.S, 2) + " kVA"]].map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    }
    function explain() {
      var el = q(".pf-explain"); if (!el || !R) return;
      var t;
      if (R.P < 1e-6 && Math.abs(R.Qt) < 1e-6) t = "ยังไม่มีโหลด กด + ที่โหลดด้านซ้าย หรือเลือกสถานการณ์ด้านบน";
      else if (R.thd > 0.4) t = "กระแสเป็นยอดแหลมเฉพาะช่วงยอดแรงดัน (ฮาร์มอนิก " + n(R.thd * 100, 0) + " %) แม้ cos φ = " + n(R.dpf, 2) + " แต่ PF จริงเพียง " + n(R.pf, 2) + " — คาปาซิเตอร์แก้ไม่ได้ ต้องใช้วงจร PFC ฟิลเตอร์ หรือตัวเหนี่ยวนำ";
      else if (R.Qt < -0.05 * Math.max(R.P, 0.1)) t = "ชดเชยเกิน: คาปาซิเตอร์จ่ายรีแอกทีฟมากกว่าที่โหลดต้องการ กระแสนำหน้าแรงดันและกลับมาเพิ่มขึ้น แรงดันอาจสูงขึ้น ปลดคาปาซิเตอร์ออกบางขั้น";
      else if (R.dpf < 0.85) t = "กระแสตามหลังแรงดัน " + n(Math.abs(R.th) / D2R, 0) + "° ดูพื้นที่สีแดงของ p(t): ทุกครึ่งรอบโหลดคืนพลังงานที่เก็บในสนามแม่เหล็กกลับไป กระแสส่วน I_Q วิ่งไปกลับโดยไม่ทำงาน แต่ทำให้สายร้อน ลองเปิดคาปาซิเตอร์ทีละขั้น";
      else if (R.Qc > 0) t = "คาปาซิเตอร์จ่ายรีแอกทีฟให้มอเตอร์ในพื้นที่ แหล่งจ่ายจึงส่งแค่ส่วนที่ทำงานจริง กระแสลดจาก " + n(R.Inc, 2) + " เหลือ " + n(R.Irms, 2) + " A ขณะที่ P เท่าเดิม";
      else t = "กระแสเกือบตรงเฟสกับแรงดัน p(t) เป็นบวกเกือบตลอด พลังงานไหลทางเดียวไปยังโหลด — นี่คือ PF ที่ดี";
      el.textContent = t;
    }
    var p0 = host.getAttribute("data-preset") || "motor";
    preset(PRESETS[p0] ? p0 : "motor");
    if (!reduce && host.hasAttribute("data-autoplay") && pb) pb.click();
  }

  // ------------------------------------------------------------------ automatic capacitor bank over a working day
  var BANKS = { "6 × 25 kvar": [25, 25, 25, 25, 25, 25], "1:1:2:2 (20 20 40 40)": [20, 20, 40, 40], "1:2:4 (25 50 100)": [25, 50, 100], "4 × 50 kvar": [50, 50, 50, 50], "ไม่มีตู้คาปาซิเตอร์": [] };
  function factoryDay(seed) {
    // 5-min steps over 24 h: kW and kvar of a small factory (motors, compressor cycling, lighting/office)
    var out = [], s = seed || 7, rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (var k = 0; k < 288; k++) {
      var h = k / 12, work = h >= 8 && h < 17 && !(h >= 12 && h < 13), shift = h >= 7.5 && h < 17.5;
      var P = 8, Q = 4; // security lights, fridges, night loads
      if (shift) { P += 18; Q += 8; } // lighting + office
      if (work) { P += 55 + 10 * Math.sin(k / 7); Q += 50 + 8 * Math.sin(k / 7); } // conveyor + machine motors (PF ≈ 0.74)
      if (h >= 6 && h < 20) { var on = Math.floor(k / 4) % 3 !== 2 || work; if (on) { P += 30; Q += 22; } } // compressor cycling
      if (work && rnd() < 0.25) { P += 25; Q += 26; } // big machine starts/runs intermittently
      out.push([P, Q]);
    }
    return out;
  }
  function bankSim(o) {
    // o: {steps:[kvar], target, ck, load:[[P,Q]]}
    var steps = o.steps, on = steps.map(function () { return false; }), ops = 0, res = [], small = steps.length ? Math.min.apply(null, steps) : 0, tphi = Math.tan(Math.acos(o.target));
    var order = steps.map(function (_, i) { return i; });
    o.load.forEach(function (L) {
      for (var guard = 0; guard < 12; guard++) {
        var qc = steps.reduce(function (a, v, i) { return a + (on[i] ? v : 0); }, 0), need = L[1] - qc - L[0] * tphi; // + means more capacitance needed
        if (need > o.ck * small) {
          // switch in the step that brings us closest without overshooting the band; equal steps rotate (first-in first-out)
          var best = -1; order.forEach(function (i) { if (!on[i] && steps[i] <= need + o.ck * small && (best < 0 || steps[i] > steps[best])) best = i; });
          if (best < 0) order.forEach(function (i) { if (!on[i] && (best < 0 || steps[i] < steps[best])) best = i; });
          if (best < 0) break; on[best] = true; ops++; order.push(order.splice(order.indexOf(best), 1)[0]);
        } else if (need < -o.ck * small) {
          var w = -1; order.forEach(function (i) { if (on[i] && steps[i] <= -need + o.ck * small && (w < 0 || steps[i] > steps[w])) w = i; });
          if (w < 0) break; on[w] = false; ops++;
        } else break;
      }
      var qcf = steps.reduce(function (a, v, i) { return a + (on[i] ? v : 0); }, 0);
      res.push({ P: L[0], Q: L[1], Qc: qcf, on: on.slice() });
    });
    return { res: res, ops: ops };
  }
  function demand15(arr) { var mx = 0, at = 0; for (var k = 0; k + 3 <= arr.length; k += 3) { var a = (arr[k] + arr[k + 1] + arr[k + 2]) / 3; if (a > mx) { mx = a; at = k; } } return [mx, at]; }

  function buildBank(host) {
    var st = { bank: host.getAttribute("data-steps") || "6 × 25 kvar", target: +(host.getAttribute("data-target") || 0.95), ck: 0.65, t: 120, seed: 7 };
    if (!BANKS[st.bank]) st.bank = "6 × 25 kvar";
    host.innerHTML = '<p class="fc-t"><b>ตู้คาปาซิเตอร์อัตโนมัติจำลอง: โรงงานขนาดเล็กตลอดวันทำงาน</b> <span class="mono">สูตร K1–K6 · T1–T4</span></p>' +
      '<div class="fc-in"><label><span>การแบ่งขั้น</span><select data-k="bank">' + Object.keys(BANKS).map(function (b) { return "<option" + (b === st.bank ? " selected" : "") + ">" + b + "</option>"; }).join("") + "</select></label>" +
      '<label><span>PF เป้าหมาย</span><input data-k="target" value="' + st.target + '" inputmode="decimal"></label><label><span>ค่า C/k (สัดส่วนของขั้นเล็กสุด)</span><input data-k="ck" value="0.65" inputmode="decimal"></label>' +
      '<label><span>รูปแบบโหลด (เปลี่ยนวัน)</span><select data-k="seed"><option value="7">วันที่ 1</option><option value="99">วันที่ 2</option><option value="1234">วันที่ 3</option></select></label></div>' +
      '<div class="pf-panel"><div class="pf-ctrl" aria-live="off"></div><label class="pf-time">เวลาบนหน้าจอคอนโทรลเลอร์ <output></output><input type="range" min="0" max="287" step="1" data-k="t"></label></div>' +
      '<div class="pv-fig"></div><dl class="fc-out"></dl><p class="pv-note">โหลด: ไฟและสำนักงาน มอเตอร์สายพานและเครื่องจักร (PF ≈ 0.74) ปั๊มลมที่ตัดต่อเป็นรอบ และเครื่องจักรใหญ่ที่เดินเป็นช่วง ๆ คอนโทรลเลอร์วัด P Q ทุกช่วงแล้วสับขั้นทีละขั้นจนอยู่ในแถบ C/k รอบเป้าหมาย</p>';
    var q = function (s) { return host.querySelector(s); };
    Array.prototype.forEach.call(host.querySelectorAll("[data-k]"), function (el) {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () { var k = el.getAttribute("data-k"); st[k] = k === "bank" ? el.value : K.parse(el.value); if (k === "t") panel(); else run(); });
    });
    q('[data-k="t"]').value = st.t;
    var R = null, base = null;
    function run() {
      if (!(st.target > 0.5 && st.target <= 1) || !(st.ck > 0)) return;
      var load = factoryDay(st.seed);
      R = bankSim({ steps: BANKS[st.bank], target: st.target, ck: st.ck, load: load });
      var hrs = load.map(function (_, k) { return k / 12; });
      var pfNo = load.map(function (L, k) { return [hrs[k], L[0] / Math.hypot(L[0], L[1])]; }), pfW = R.res.map(function (r, k) { return [hrs[k], r.P / Math.hypot(r.P, r.Q - r.Qc)]; });
      var qd = R.res.map(function (r, k) { return [hrs[k], r.Q]; }), qs = [];
      R.res.forEach(function (r, k) { qs.push([hrs[k], r.Qc], [hrs[k] + 1 / 12, r.Qc]); });
      var qmax = K.niceTicks(Math.max.apply(null, load.map(function (L) { return L[1]; })) * 1.1, 4);
      q(".pv-fig").innerHTML = K.chart({ w: 680, h: 300, xs: [0, 24], ys: [0.4, 1.0], y2s: [0, qmax.top], xt: [0, 3, 6, 9, 12, 15, 18, 21, 24], yt: [0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 1.0], y2t: qmax.ticks,
        xf: function (t) { return (t < 10 ? "0" : "") + t + ":00"; }, yf: function (t) { return t.toFixed(2); }, xl: "เวลา", yl: "เพาเวอร์แฟกเตอร์", y2l: "kvar", label: "PF และ kvar ตลอดวัน",
        series: [{ cls: "ee-a2", area: true, axis: 2, pts: qs }, { cls: "s3", axis: 2, pts: qd }, { cls: "s7", pts: pfNo }, { cls: "s1 thick", pts: pfW }],
        hlines: [{ y: 0.85, cls: "hl red", label: "0.85 เกณฑ์ค่าปรับ" }, { y: st.target, cls: "hl dsh", label: "เป้าหมาย " + st.target }],
        legend: [["f7", "PF ไม่มีตู้"], ["f1", "PF มีตู้"], ["f3", "kvar ที่โหลดต้องการ"], ["ee-a2", "kvar ที่ตู้จ่าย"]] });
      // monthly demand-based PF charge (22 working days, the worst 15-min demand of the day taken as the month's)
      var Pd = demand15(load.map(function (L) { return L[0]; })), Qno = demand15(load.map(function (L) { return L[1]; }))[0], Qw = demand15(R.res.map(function (r) { return Math.max(0, r.Q - r.Qc); }))[0];
      var chNo = Math.max(0, Qno - PF_LIMIT * Pd[0]) * PF_RATE, chW = Math.max(0, Qw - PF_LIMIT * Pd[0]) * PF_RATE;
      var kwh = load.reduce(function (a, L) { return a + L[0] / 12; }, 0), kvarhNo = load.reduce(function (a, L) { return a + L[1] / 12; }, 0), kvarhW = R.res.reduce(function (a, r) { return a + Math.max(0, r.Q - r.Qc) / 12; }, 0);
      var pfa = function (e, q2) { return e / Math.hypot(e, q2); }, tot = BANKS[st.bank].reduce(function (a, v) { return a + v; }, 0);
      var under = R.res.filter(function (r) { return r.P / Math.hypot(r.P, r.Q - r.Qc) < 0.85; }).length / 12;
      q(".fc-out").innerHTML = [["ขนาดตู้รวม", tot + " kvar (" + BANKS[st.bank].length + " ขั้น)"], ["kW ความต้องการสูงสุด (15 นาที)", n(Pd[0], 1) + " kW"],
        ["kvar สูงสุด ไม่มีตู้ / มีตู้", n(Qno, 1) + " / " + n(Qw, 1) + " kvar"], ["kvar ที่ยอมให้ฟรี 61.97 % × kW", n(PF_LIMIT * Pd[0], 1) + " kvar"],
        ["ค่าเพาเวอร์แฟกเตอร์ต่อเดือน ไม่มีตู้", baht(chNo)], ["ค่าเพาเวอร์แฟกเตอร์ต่อเดือน มีตู้", chW > 0 ? warn(baht(chW)) : ok(true, baht(0))],
        ["PF เฉลี่ยทั้งวัน ไม่มีตู้ → มีตู้", n(pfa(kwh, kvarhNo), 3) + " → " + n(pfa(kwh, kvarhW), 3)], ["เวลาที่ PF ต่ำกว่า 0.85 (มีตู้)", n(under, 1) + " ชม./วัน"],
        ["จำนวนครั้งสับ/ปลดคอนแทกเตอร์", R.ops + " ครั้ง/วัน" + (R.ops > 120 ? " " + warn("บ่อยเกิน คอนแทกเตอร์สึกเร็ว — เพิ่ม C/k หรือหน่วงเวลา") : "")]]
        .map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
      base = load; panel();
    }
    function panel() {
      if (!R) return;
      var k = Math.max(0, Math.min(287, Math.round(st.t))), r = R.res[k], qn = r.Q - r.Qc, pf = r.P / Math.hypot(r.P, qn), h = k / 12;
      q(".pf-time output").textContent = String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.round((h % 1) * 60)).padStart(2, "0") + " น.";
      q(".pf-ctrl").innerHTML = '<div class="pf-lcd"><span class="mono">cos φ</span><b>' + n(pf, 2) + "</b><small>" + (qn >= 0 ? "IND" : "CAP") + '</small></div><div class="pf-lcd2 mono">P ' + n(r.P, 1) + " kW · Q " + n(qn, 1) + " kvar · Qc " + n(r.Qc, 0) + ' kvar</div><div class="pf-leds" aria-label="ขั้นคาปาซิเตอร์">' +
        BANKS[st.bank].map(function (v, i) { return '<span class="pf-led' + (r.on[i] ? " on" : "") + '" title="ขั้น ' + (i + 1) + " " + v + ' kvar">' + (i + 1) + "<small>" + v + "</small></span>"; }).join("") + "</div>";
    }
    run();
  }

  // ------------------------------------------------------------------ calculators
  var CALC = {
    qc: {
      t: "ขนาดคาปาซิเตอร์ปรับปรุงเพาเวอร์แฟกเตอร์", ref: "C1–C6",
      ins: [["p", "กำลังจริงของโหลด P", "kW", "100"], ["pf1", "PF เดิม", "", "0.75"], ["pf2", "PF เป้าหมาย", "", "0.95"], ["sys", "ระบบ", "sel", "3 เฟส 400 V", ["1 เฟส 230 V", "3 เฟส 400 V"]],
        ["con", "การต่อคาปาซิเตอร์ (3 เฟส)", "sel", "Δ (เดลต้า)", ["Δ (เดลต้า)", "Y (สตาร์)"]], ["f", "ความถี่", "Hz", "50"]],
      f: function (x) {
        if (!(x.pf1 > 0 && x.pf1 <= 1 && x.pf2 > 0 && x.pf2 <= 1)) return { rows: [["PF ต้องอยู่ระหว่าง 0 ถึง 1", "—"]] };
        var t1 = Math.tan(Math.acos(x.pf1)), t2 = Math.tan(Math.acos(x.pf2)), qc = x.p * (t1 - t2), three = x.sys !== "1 เฟส 230 V", V = three ? 400 : 230, w = TAU * x.f;
        var vc = three ? (x.con.charAt(0) === "Δ" ? 400 : 400 / Math.sqrt(3)) : 230, cu = (qc * 1e3 / (three ? 3 : 1)) / (w * vc * vc) * 1e6;
        var i1 = x.p * 1e3 / (x.pf1 * V * (three ? Math.sqrt(3) : 1)), i2 = x.p * 1e3 / (x.pf2 * V * (three ? Math.sqrt(3) : 1)), ic = qc * 1e3 / (V * (three ? Math.sqrt(3) : 1));
        return { rows: [["ตัวคูณ tan φ₁ − tan φ₂", n(t1 - t2, 3)], ["Q_c = P(tan φ₁ − tan φ₂)", "<b>" + n(qc, 2) + " kvar</b>"], ["ความจุต่อเฟส" + (three ? " (ต่อแบบ " + x.con.charAt(0) + ")" : ""), n(cu, 1) + " µF ที่ " + n(vc, 0) + " V"],
          ["กระแสคาปาซิเตอร์", n(ic, 1) + " A"], ["กระแสสายก่อน → หลัง", n(i1, 1) + " → " + n(i2, 1) + " A (ลด " + n((1 - i2 / i1) * 100, 1) + " %)"], ["การสูญเสีย I²R ในสายลดลง", n((1 - Math.pow(x.pf1 / x.pf2, 2)) * 100, 1) + " %"],
          ["kVA ก่อน → หลัง", n(x.p / x.pf1, 1) + " → " + n(x.p / x.pf2, 1) + " kVA (ได้คืน " + n(x.p / x.pf1 - x.p / x.pf2, 1) + " kVA)"], ["ถ้าต่อแบบ Y ต้องใช้ความจุ", three ? n(cu * (x.con.charAt(0) === "Δ" ? 3 : 1), 1) + " µF/เฟส" : "—"]],
          note: "ต่อแบบเดลต้าใช้ความจุน้อยกว่าแบบสตาร์ 3 เท่าสำหรับ kvar เท่ากัน เพราะแต่ละตัวได้แรงดันสาย 400 V แทน 230 V (Q ∝ V²) เลือกพิกัดแรงดันคาปาซิเตอร์สูงกว่าแรงดันระบบ (เช่น 440–480 V) เพื่อรับแรงดันเกินและฮาร์มอนิก" };
      }
    },
    bill: {
      t: "ค่าเพาเวอร์แฟกเตอร์ในบิลค่าไฟ และระยะคืนทุนตู้คาปาซิเตอร์", ref: "T1–T5",
      ins: [["kw", "ความต้องการพลังไฟฟ้าสูงสุด", "kW", "250"], ["kvar", "ความต้องการพลังไฟฟ้ารีแอกทีฟสูงสุด", "kvar", "230"], ["rate", "อัตราค่าเพาเวอร์แฟกเตอร์", "฿/kvar", "56.07"],
        ["target", "PF เป้าหมายหลังติดตู้", "", "0.95"], ["cost", "ราคาตู้คาปาซิเตอร์ติดตั้ง", "฿/kvar", "1200"]],
      f: function (x) {
        var free = PF_LIMIT * x.kw, over = Math.max(0, x.kvar - free), ch = over * x.rate, pf = x.kw / Math.hypot(x.kw, x.kvar);
        var need = Math.max(0, x.kvar - x.kw * Math.tan(Math.acos(x.target))), size = Math.ceil(need / 25) * 25, inv = size * x.cost;
        return { rows: [["PF ที่ความต้องการสูงสุด", n(pf, 3)], ["kvar ที่ไม่คิดเงิน = 61.97 % × kW", n(free, 1) + " kvar"], ["kvar ที่ถูกเรียกเก็บ", n(over, 1) + " kvar"], ["ค่าเพาเวอร์แฟกเตอร์ต่อเดือน", "<b>" + baht(ch) + "</b> (" + baht(ch * 12) + "/ปี)"],
          ["kvar ที่ต้องชดเชยให้ได้ PF " + x.target, n(need, 1) + " kvar → ตู้ " + size + " kvar"], ["ราคาตู้โดยประมาณ", baht(inv)], ["ระยะคืนทุนจากค่าปรับอย่างเดียว", ch > 0 ? n(inv / ch, 1) + " เดือน" : "ไม่เสียค่าปรับอยู่แล้ว"]],
          note: "เกณฑ์ 61.97 % มาจาก tan(cos⁻¹ 0.85) — ผู้ใช้ไฟที่มี PF ≥ 0.85 ที่ช่วงความต้องการสูงสุดจึงไม่เสียค่านี้ ใช้กับผู้ใช้ไฟประเภทที่คิดค่าความต้องการพลังไฟฟ้า (กิจการขนาดกลางขึ้นไป) ตรวจอัตราปัจจุบันจากการไฟฟ้า ราคาตู้เป็นค่าตั้งต้น ใช้ใบเสนอราคาจริง" };
      }
    },
    twowatt: {
      t: "วิธีวัตต์มิเตอร์สองตัว (สามเฟส สามสาย)", ref: "M3–M5",
      ins: [["w1", "วัตต์มิเตอร์ W₁", "kW", "30"], ["w2", "วัตต์มิเตอร์ W₂", "kW", "12"]],
      f: function (x) {
        var P = x.w1 + x.w2, Q = Math.sqrt(3) * (x.w1 - x.w2), pf = P / Math.hypot(P, Q);
        return { rows: [["P = W₁ + W₂", n(P, 2) + " kW"], ["Q = √3 (W₁ − W₂)", n(Q, 2) + " kvar"], ["tan φ = √3 (W₁ − W₂)/(W₁ + W₂)", n(Q / P, 3)], ["φ", n(Math.atan2(Q, P) / D2R, 1) + "°"], ["PF", "<b>" + n(pf, 3) + "</b>"],
          ["ข้อสังเกต", x.w2 < 0 ? "W₂ ติดลบ → PF < 0.5" : x.w1 === x.w2 ? "W₁ = W₂ → PF = 1" : "W₂ บวก → PF > 0.5"]], note: "ใช้ได้กับโหลดสมดุลที่เป็นไซน์ ถ้าเข็มวัตต์มิเตอร์ตัวหนึ่งตีกลับ ให้กลับขั้วขดแรงดันแล้วอ่านค่าเป็นลบ" };
      }
    },
    truepf: {
      t: "PF จริงเมื่อมีฮาร์มอนิก: DPF × Distortion factor", ref: "H1–H4",
      ins: [["dpf", "Displacement PF (cos φ₁)", "", "0.97"], ["thd", "THD ของกระแส", "%", "100"], ["v", "แรงดัน", "V", "230"], ["p", "กำลังจริง", "kW", "1.5"]],
      f: function (x) {
        var df = 1 / Math.sqrt(1 + Math.pow(x.thd / 100, 2)), pf = x.dpf * df, i1 = x.p * 1e3 / (x.v * x.dpf), irms = i1 * Math.sqrt(1 + Math.pow(x.thd / 100, 2));
        return { rows: [["Distortion factor = 1/√(1 + THD²)", n(df, 3)], ["PF จริง = DPF × DF", "<b>" + n(pf, 3) + "</b>"], ["กระแสพื้นฐาน I₁", n(i1, 2) + " A"], ["กระแส rms รวม", n(irms, 2) + " A"],
          ["ถ้าใส่คาปาซิเตอร์จน DPF = 1 PF จริงสูงสุด", n(df, 3)]], note: "ส่วนที่หายไปเพราะฮาร์มอนิกแก้ด้วยคาปาซิเตอร์ไม่ได้ ต้องใช้โหลดที่มี PFC ตัวเหนี่ยวนำ AC/DC choke หรือแอกทีฟฟิลเตอร์" };
      }
    },
    resonance: {
      t: "เรโซแนนซ์ระหว่างหม้อแปลงกับตู้คาปาซิเตอร์ และตู้ detuned", ref: "H5–H8",
      ins: [["kva", "หม้อแปลง", "kVA", "1000"], ["zt", "%Z หม้อแปลง", "%", "6"], ["qc", "คาปาซิเตอร์ที่สับอยู่", "kvar", "300"], ["p", "เปอร์เซ็นต์ detuning p (0 = ไม่มีรีแอกเตอร์)", "%", "7"], ["f", "ความถี่ระบบ", "Hz", "50"]],
      f: function (x) {
        var ssc = x.kva / (x.zt / 100), hr = Math.sqrt(ssc / x.qc), danger = [3, 5, 7, 11, 13].filter(function (h) { return Math.abs(hr - h) < 0.6; });
        var rows = [["กำลังลัดวงจรที่บัสแรงต่ำ S_sc ≈ S/Z", n(ssc, 0) + " kVA"], ["อันดับเรโซแนนซ์ h_r = √(S_sc / Q_c)", "<b>" + n(hr, 2) + "</b> = " + n(hr * x.f, 0) + " Hz"],
          ["ความเสี่ยง (ไม่มีรีแอกเตอร์)", danger.length ? warn("ใกล้ฮาร์มอนิกที่ " + danger.join(", ") + " — กระแสฮาร์มอนิกถูกขยาย") : ok(true, "ไม่ตรงฮาร์มอนิกหลัก แต่จะเลื่อนเมื่อสับขั้นต่างกัน")]];
        if (x.p > 0) { var ht = 1 / Math.sqrt(x.p / 100); rows.push(["ตู้ detuned: ความถี่จูน = f/√p", n(ht * x.f, 0) + " Hz (h = " + n(ht, 2) + ")"], ["แรงดันคร่อมคาปาซิเตอร์เพิ่มเป็น 1/(1 − p)", n(100 / (1 - x.p / 100), 1) + " % ของแรงดันระบบ"], ["ฮาร์มอนิกที่ 5 ขึ้นไปเห็นตู้เป็น", "ตัวเหนี่ยวนำ ไม่เกิดเรโซแนนซ์ขนาน"]); }
        return { rows: rows, note: "สูตรประมาณ ใช้ S_sc ของหม้อแปลงอย่างเดียว (ต้นทางแข็งแรงมาก) ระบบที่มีโหลดอิเล็กทรอนิกส์มากควรใช้ตู้ detuned 7 % (189 Hz) หรือ 14 % (134 Hz ถ้ามีฮาร์มอนิกที่ 3) และวัดฮาร์มอนิกจริงก่อนออกแบบ" };
      }
    },
    motor: {
      t: "คาปาซิเตอร์ต่อตรงที่มอเตอร์ (individual compensation)", ref: "C7–C8",
      ins: [["kw", "มอเตอร์", "kW", "15"], ["v", "แรงดัน", "V", "400"], ["i0", "กระแสไร้โหลด I₀ (ไม่ทราบ ≈ 30–40 % ของ I_n)", "A", "10"], ["pf", "PF ที่โหลดเต็ม", "", "0.85"], ["eff", "ประสิทธิภาพ", "%", "90"]],
      f: function (x) {
        var q0 = Math.sqrt(3) * x.v * x.i0 / 1000, qmax = 0.9 * q0, pin = x.kw / (x.eff / 100), qfl = pin * Math.tan(Math.acos(x.pf));
        return { rows: [["รีแอกทีฟตอนไร้โหลด √3 V I₀", n(q0, 2) + " kvar"], ["คาปาซิเตอร์สูงสุดที่ต่อตรงได้ 0.9 √3 V I₀", "<b>" + n(qmax, 2) + " kvar</b>"], ["รีแอกทีฟที่โหลดเต็ม", n(qfl, 2) + " kvar"],
          ["PF โหลดเต็มหลังติด", n(pin / Math.hypot(pin, qfl - qmax), 3)]], note: "ถ้าคาปาซิเตอร์ใหญ่เกินกระแสแม่เหล็ก เมื่อตัดไฟมอเตอร์ที่ยังหมุนจะกลายเป็นเครื่องกำเนิดกระตุ้นตัวเอง แรงดันขั้วสูงเกินอันตราย ห้ามใช้กับมอเตอร์ที่ใช้ซอฟต์สตาร์ตเตอร์/อินเวอร์เตอร์ (VFD) หรือกลับทางหมุน" };
      }
    },
    avg: {
      t: "PF เฉลี่ยจากมิเตอร์ kWh และ kvarh", ref: "M6",
      ins: [["kwh", "พลังงานจริงในเดือน", "kWh", "42000"], ["kvarh", "พลังงานรีแอกทีฟในเดือน", "kvarh", "33000"]],
      f: function (x) { var pf = x.kwh / Math.hypot(x.kwh, x.kvarh); return { rows: [["PF เฉลี่ย = kWh / √(kWh² + kvarh²)", "<b>" + n(pf, 3) + "</b>"], ["kvarh ที่ควรลดเพื่อให้ได้ 0.95", n(Math.max(0, x.kvarh - x.kwh * Math.tan(Math.acos(0.95))), 0) + " kvarh"]], note: "PF เฉลี่ยรายเดือนอาจดูดี แต่ค่าปรับคิดจาก kvar ในช่วงความต้องการสูงสุด ต้องดูค่ารายช่วง 15 นาทีด้วย" }; }
    }
  };

  K.calcs("data-pf", CALC, "pf");
  K.onReady(function () {
    Array.prototype.forEach.call(document.querySelectorAll(".pf-sim"), buildSim);
    Array.prototype.forEach.call(document.querySelectorAll(".pf-bank"), buildBank);
    Array.prototype.forEach.call(document.querySelectorAll("button[data-pf-preset]"), function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-pf-target"), s = t ? document.getElementById(t) : document.querySelector(".pf-sim");
        if (s && s._preset) { s._preset(b.getAttribute("data-pf-preset")); s.scrollIntoView({ behavior: "smooth", block: "start" }); }
        else location.href = "/learn/power-factor/pf-lab/#preset=" + b.getAttribute("data-pf-preset");
      });
    });
    var m = /preset=([\w-]+)/.exec(location.hash), s = document.querySelector(".pf-sim");
    if (m && s && s._preset) s._preset(m[1]);
  });
  var api = { CALC: CALC, LIB: LIB, PRESETS: PRESETS, solve: solve, iAt: iAt, motorPQ: motorPQ, factoryDay: factoryDay, bankSim: bankSim, BANKS: BANKS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PFLab = api;
})(typeof window !== "undefined" ? window : globalThis);
