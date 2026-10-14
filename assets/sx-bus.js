/* Standard-signal and industrial-network widgets for /learn/sensors-transducers/ — needs ee-kit.js and sx-calc.js first.
   <div class="sx-loop" [data-wires="2"] [data-fault="none"] [data-pv="50"] [data-lrv="0" data-urv="10" data-u="bar"]></div>  4–20 mA loop simulator
   <div class="sx-hart" [data-text="PV"]></div>          HART FSK modem: bits, phase-continuous 1200/2200 Hz on the loop current
   <div class="sx-modbus" [data-fc="3"] [data-addr="0"] [data-qty="2"]></div>  Modbus RTU/TCP request + response with a virtual transmitter
   <div class="sx-crc"></div>                            CRC-16 (Modbus) for any hex frame
   <div class="sx-f32" [data-v="23.75"]></div>           float32 ↔ two registers, four byte orders
   <div class="sx-tagdec" [data-tag="LIC-101"]></div>    ISA-5.1 instrument tag decoder
   <div class="sx-cal" [data-lrv="0" data-urv="100" data-u="°C" data-tol="0.5"]></div>  5-point calibration worksheet (as-found / as-left)
   <button data-sx-loop="fault" data-v="open" [data-target="id"]> sets a fault on the loop simulator of the page. */
(function (root) {
  "use strict";
  var K = root.EEKit, X = root.SXCalc;
  var n = K.n, sig = K.sig, ok = K.ok, warn = K.warn, esc = K.esc;
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var h = function (tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (k === "cls") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  };
  function field(label, el, unit) {
    var w = h("label"); w.appendChild(h("span", null, label)); w.appendChild(el);
    if (unit) w.appendChild(h("i", null, unit));
    return w;
  }
  function sel(opts, val) {
    var s = h("select"); opts.forEach(function (o) { var op = h("option", { value: o[0] }, o[1]); s.appendChild(op); }); s.value = val; return s;
  }
  function inp(val, type) { var i = h("input", { type: type || "text", value: val, spellcheck: "false", autocomplete: "off" }); return i; }
  function shell(host, cap, title) {
    host.classList.add("sx-lab");
    host.innerHTML = "";
    host.appendChild(h("div", { cls: "sx-cap" }, cap));
    host.appendChild(h("h3", null, title));
    return host;
  }

  // =========================================================== 4–20 mA loop simulator
  var FAULTS = [
    ["none", "ปกติ"], ["open", "สายขาด"], ["short", "สายลัดวงจร"], ["burnup", "เซนเซอร์เสีย → แจ้งด้านสูง"], ["burndn", "เซนเซอร์เสีย → แจ้งด้านต่ำ"],
    ["lowv", "แหล่งจ่ายตก 15 V"], ["longw", "สายยาว 2 km + แบเรียร์ 300 Ω"], ["ground", "กราวด์ลูป (+0.6 mA)"]
  ];
  function loopSim(host) {
    var st = {
      wires: host.getAttribute("data-wires") || "2", fault: host.getAttribute("data-fault") || "none", pv: +(host.getAttribute("data-pv") || 50),
      lrv: +(host.getAttribute("data-lrv") || 0), urv: +(host.getAttribute("data-urv") || 10), u: host.getAttribute("data-u") || "bar", hart: false
    };
    shell(host, "// แล็บ · ลูปกระแส 4–20 mA", "เลื่อนค่ากระบวนการ ใส่ความผิดพลาด แล้วดูว่ากระแส แรงดัน และค่าที่ PLC อ่านเปลี่ยนอย่างไร");
    var row = h("div", { cls: "sx-row" }), pv = inp(st.pv, "range"); pv.min = 0; pv.max = 110; pv.step = 0.5;
    var wires = sel([["2", "2 สาย (loop powered)"], ["3", "3 สาย"], ["4", "4 สาย (ไฟเลี้ยงแยก)"]], st.wires), fault = sel(FAULTS, st.fault);
    var hart = h("button", { type: "button", cls: "sx-ghost", "aria-pressed": "false" }, "HART: ปิด");
    row.appendChild(field("ค่ากระบวนการ (% ของช่วง)", pv)); row.appendChild(field("ชนิดการต่อ", wires)); row.appendChild(field("ความผิดพลาด", fault)); row.appendChild(hart);
    host.appendChild(row);
    var fig = h("div"), out = h("div", { cls: "sx-out", "aria-live": "polite" }), scope = h("div");
    host.appendChild(fig); host.appendChild(out); host.appendChild(scope);

    function model() {
      var Vs = st.fault === "lowv" ? 15 : 24, Rs = 250, Rw = st.fault === "longw" ? 0.0175 * 2 * 2000 / 0.5 + 300 : 2 * 0.0175 * 200 / 0.75;
      var p = st.pv / 100, ireq = 4 + 16 * p;
      ireq = Math.min(Math.max(ireq, 3.8), 20.5); // NE 43 saturation of the measuring range
      var vmin = 10.5, flag = "";
      if (st.fault === "burnup") ireq = 21.5;
      if (st.fault === "burndn") ireq = 3.6;
      var I = ireq / 1000;
      if (st.fault === "open") I = 0;
      if (st.wires === "2" && st.fault !== "open" && st.fault !== "short") {
        var Imax = (Vs - vmin) / (Rs + Rw); // transmitter needs vmin to regulate
        if (I > Imax) { I = Math.max(Imax, 0); flag = "แรงดันไม่พอ: ทรานสมิตเตอร์ควบคุมกระแสไม่ได้ กระแสถูกตัดที่ " + n(I * 1000, 2) + " mA"; }
      }
      if (st.fault === "short") I = Math.min(Vs / (Rs + Rw), 0.025);
      if (st.fault === "ground") I += 0.0006;
      var Vcard = I * Rs, Vtx = st.fault === "short" ? 0 : Vs - I * (Rs + Rw);
      var mA = I * 1000, frac = (mA - 4) / 16, eu = st.lrv + frac * (st.urv - st.lrv);
      return { Vs: Vs, Rs: Rs, Rw: Rw, I: I, mA: mA, Vcard: Vcard, Vtx: Vtx, eu: eu, flag: flag, ireq: ireq };
    }
    function ne43(mA) {
      if (mA <= 3.6) return warn("≤ 3.6 mA → แจ้งเตือนด้านต่ำ / สายขาด");
      if (mA < 3.8) return warn("3.6–3.8 mA → ไม่กำหนด ถือว่าผิดปกติ");
      if (mA < 4) return "3.8–4 mA → ต่ำกว่าช่วง (ยังเชื่อได้)";
      if (mA <= 20) return ok(true, "ช่วงวัดปกติ");
      if (mA <= 20.5) return "20–20.5 mA → เกินช่วง (ยังเชื่อได้)";
      if (mA < 21) return warn("20.5–21 mA → ไม่กำหนด ถือว่าผิดปกติ");
      return warn("≥ 21 mA → แจ้งเตือนด้านสูง");
    }
    function draw(m) {
      var W = 680, H = 250, open = st.fault === "open", short = st.fault === "short";
      var s = '<svg class="ee-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="วงจรลูปกระแส ' + st.wires + ' สาย">';
      var wcls = open ? "s6 dsh" : "s1";
      // supply
      s += '<rect x="20" y="70" width="90" height="110" rx="10" fill="none" class="s7" stroke-width="2"/><text class="ml" x="65" y="96" text-anchor="middle">แหล่งจ่าย</text><text class="tk" x="65" y="118" text-anchor="middle">' + m.Vs + ' V DC</text>';
      s += '<text class="tk" x="65" y="160" text-anchor="middle">+ ‒</text>';
      // AI card
      s += '<rect x="20" y="190" width="200" height="50" rx="8" fill="none" class="s5" stroke-width="2"/><text class="ml" x="120" y="211" text-anchor="middle">การ์ด AI ของ PLC · 250 Ω</text><text class="tk" x="120" y="230" text-anchor="middle">' + n(m.Vcard, 3) + " V → " + n(m.mA, 2) + " mA</text>";
      // field device
      var txLabel = st.wires === "2" ? "ทรานสมิตเตอร์ 2 สาย" : st.wires === "3" ? "ทรานสมิตเตอร์ 3 สาย" : "ทรานสมิตเตอร์ 4 สาย";
      s += '<rect x="500" y="60" width="160" height="120" rx="12" fill="none" class="s2" stroke-width="2.4"/><text class="ml" x="580" y="86" text-anchor="middle">' + txLabel + "</text>";
      s += '<text class="tk" x="580" y="108" text-anchor="middle">PV = ' + n(st.pv, 1) + ' %</text><text class="tk" x="580" y="128" text-anchor="middle">V ขั้ว = ' + (st.wires === "2" ? n(m.Vtx, 2) + " V" : "—") + "</text>";
      s += '<text class="tk" x="580" y="148" text-anchor="middle">' + (m.flag ? "⚠ แรงดันไม่พอ" : st.fault === "burnup" || st.fault === "burndn" ? "⚠ แจ้งความผิดพลาด" : "ส่ง " + n(m.ireq, 2) + " mA") + "</text>";
      // wires
      s += '<polyline class="' + wcls + '" points="110,90 300,90 300,70 500,70"/>';
      s += '<polyline class="s1" points="500,170 400,170 400,215 220,215"/>';
      s += '<polyline class="s1" points="20,215 10,215 10,160 20,160"/>';
      if (open) s += '<text class="ml c2" x="300" y="60" text-anchor="middle">✂ ขาด</text>';
      if (short) s += '<line class="s6 thick" x1="470" y1="70" x2="470" y2="170"/><text class="ml" x="440" y="125" text-anchor="end">ลัดวงจร</text>';
      if (st.wires !== "2") s += '<polyline class="s7" points="110,130 480,130 480,120 500,120"/><text class="tk" x="300" y="124" text-anchor="middle">ไฟเลี้ยงแยก (สายที่ ' + (st.wires === "3" ? "3 ใช้ลบร่วม" : "3–4") + ")</text>";
      // current arrow
      if (m.I > 0) s += '<text class="ml" x="300" y="112" text-anchor="middle">I = ' + n(m.mA, 2) + " mA →</text>";
      s += '<text class="tk" x="300" y="245" text-anchor="middle">R สาย + อุปกรณ์ในลูป ≈ ' + n(m.Rw, 1) + " Ω</text>";
      return s + "</svg>";
    }
    function scopeSvg(m) {
      // 10 ms of loop current with optional HART FSK (±0.5 mA)
      var pts = [], ph = 0, bit = 1, T = 0.01, N = 500;
      for (var i = 0; i <= N; i++) {
        var t = i / N * T;
        if (i % 40 === 0) bit = Math.random() < 0.5 ? 1 : 0;
        ph += 2 * Math.PI * (bit ? 1200 : 2200) * (T / N);
        pts.push([t * 1000, m.mA + (st.hart && m.I > 0 ? 0.5 * Math.sin(ph) : 0)]);
      }
      var lo = Math.floor(Math.min(m.mA - 1, 2)), hi = Math.ceil(Math.max(m.mA + 1, 22));
      var r = K.rangeTicks(lo, hi, 5);
      return K.chart({ w: 680, h: 200, xs: [0, 10], ys: [r.lo, r.hi], xt: [0, 2, 4, 6, 8, 10], yt: r.ticks, series: [{ pts: pts, cls: "s2" }],
        hlines: [{ y: 4, cls: "hl dsh", label: "4 mA" }, { y: 20, cls: "hl dsh", label: "20 mA" }, { y: 3.6, cls: "hl red", label: "3.6" }, { y: 21, cls: "hl red", label: "21" }],
        xl: "เวลา (ms)", yl: "กระแสลูป (mA)", label: "กระแสในลูปเมื่อมองด้วยออสซิลโลสโคป" });
    }
    function run() {
      var m = model();
      fig.innerHTML = draw(m);
      out.innerHTML = "กระแสลูป      : <b>" + n(m.mA, 3) + " mA</b>\nสถานะ NE 43   : " + ne43(m.mA) +
        "\nแรงดันที่การ์ด : " + n(m.Vcard, 3) + " V (ช่วงปกติ 1–5 V)" +
        "\nค่าที่ PLC แสดง : <b>" + sig(m.eu, 4) + " " + esc(st.u) + "</b>  (ช่วง " + st.lrv + "–" + st.urv + " " + esc(st.u) + ")" +
        (m.flag ? "\n" + warn(m.flag) : "") +
        (st.fault === "ground" ? "\n" + warn("กระแสรั่วจากกราวด์ลูปเพิ่ม 0.6 mA ค่าที่อ่านคลาด " + sig(0.6 / 16 * (st.urv - st.lrv), 3) + " " + esc(st.u) + " โดยไม่มีสัญญาณเตือน — แก้ด้วยการแยกโดดเดี่ยว (isolator)") : "") +
        (st.fault === "open" ? "\nสายขาดให้ 0 mA ซึ่งแยกได้ทันทีจากค่า 0 % ของกระบวนการ (4 mA) — นี่คือเหตุผลของ live zero" : "");
      scope.innerHTML = scopeSvg(m);
    }
    pv.addEventListener("input", function () { st.pv = +pv.value; run(); });
    wires.addEventListener("change", function () { st.wires = wires.value; run(); });
    fault.addEventListener("change", function () { st.fault = fault.value; run(); });
    hart.addEventListener("click", function () { st.hart = !st.hart; hart.setAttribute("aria-pressed", st.hart); hart.textContent = "HART: " + (st.hart ? "เปิด" : "ปิด"); run(); });
    host._fault = function (v) { st.fault = v; fault.value = v; run(); };
    run();
  }

  // =========================================================== HART FSK
  function hartLab(host) {
    shell(host, "// แล็บ · โมเด็ม HART (Bell 202 FSK)", "พิมพ์ข้อความหรือไบต์ แล้วดูบิตกลายเป็นคลื่น 1200/2200 Hz ที่ซ้อนบนกระแส");
    var row = h("div", { cls: "sx-row" }), txt = inp(host.getAttribute("data-text") || "PV"), dc = inp("12", "text");
    row.appendChild(field("ข้อมูล (ข้อความ หรือฐานสิบหก เช่น 0x82 0x01)", txt)); row.appendChild(field("กระแส DC", dc, "mA"));
    host.appendChild(row);
    var bitsOut = h("div", { cls: "sx-out" }), fig = h("div"), res = h("div", { cls: "sx-out", "aria-live": "polite" });
    host.appendChild(bitsOut); host.appendChild(fig); host.appendChild(res);
    function bytesOf(s) {
      s = s.trim();
      if (/^(0x)?[0-9a-f]{2}(\s+(0x)?[0-9a-f]{2})*$/i.test(s) && /0x|\s/i.test(s)) return s.split(/\s+/).map(function (b) { return parseInt(b.replace(/0x/i, ""), 16); });
      return Array.prototype.map.call(s.slice(0, 6), function (c) { return c.charCodeAt(0) & 0xff; });
    }
    function run() {
      var by = bytesOf(txt.value), I0 = K.parse(dc.value);
      if (!isFinite(I0)) I0 = 12;
      var frames = [], bits = [];
      by.forEach(function (b) {
        var d = [], ones = 0; for (var i = 0; i < 8; i++) { var v = (b >> i) & 1; d.push(v); ones += v; }
        var par = ones % 2 === 0 ? 1 : 0; // odd parity
        var fr = [0].concat(d, [par, 1]);
        frames.push("0x" + X.hex(b) + " → start 0 | " + d.join("") + " (LSB ก่อน) | parity " + par + " | stop 1");
        bits = bits.concat(fr);
      });
      bitsOut.innerHTML = frames.join("\n") || "—";
      var spb = 64, pts = [], ph = 0, sum = 0, dt = 1 / 1200 / spb, nb = Math.min(bits.length, 33);
      for (var i = 0; i < nb * spb; i++) {
        var b = bits[Math.floor(i / spb)], f = b ? 1200 : 2200;
        ph += 2 * Math.PI * f * dt;
        var y = I0 + 0.5 * Math.sin(ph); sum += y;
        pts.push([i * dt * 1000, y]);
      }
      var avg = pts.length ? sum / pts.length : I0, tms = nb / 1200 * 1000;
      var xt = K.niceTicks(tms, 6);
      var marks = [];
      for (var k = 0; k < nb; k++) marks.push({ x: (k + 0.5) / 1200 * 1000, y: I0 + 0.75, r: 0.1, label: String(bits[k]), dx: -3, dy: 0 });
      fig.innerHTML = K.chart({ w: 680, h: 220, xs: [0, tms], ys: [I0 - 1, I0 + 1], xt: xt.ticks.filter(function (t) { return t <= tms; }), yt: [I0 - 1, I0 - 0.5, I0, I0 + 0.5, I0 + 1],
        series: [{ pts: pts, cls: "s2" }], hlines: [{ y: avg, cls: "hl dsh", label: "ค่าเฉลี่ย " + n(avg, 3) + " mA" }], marks: marks,
        xl: "เวลา (ms) · แสดง " + nb + " บิตแรก", yl: "mA", label: "สัญญาณ HART ซ้อนบนกระแส" });
      res.innerHTML = "บิตทั้งหมด " + bits.length + " บิต ที่ 1200 bit/s ใช้เวลา " + n(bits.length / 1200 * 1000, 2) + " ms\nค่าเฉลี่ยของกระแสยังเป็น " + n(avg, 3) +
        " mA — ฟิลเตอร์ของการ์ด AI (และ PLC รุ่นเก่า) จึงไม่เห็น HART เลย\n'1' = 1200 Hz (mark) · '0' = 2200 Hz (space) · เฟสต่อเนื่อง (continuous phase)";
    }
    txt.addEventListener("input", run); dc.addEventListener("input", run);
    run();
  }

  // =========================================================== Modbus frame builder with a virtual transmitter
  // virtual slave 1: input/holding registers (0-based addresses)
  function slaveMap() {
    var pv = 23.75, ma = 4 + 16 * pv / 100, regs = {};
    var put = function (a, v) { var b = X.f32bytes(v); regs[a] = (b[0] << 8) | b[1]; regs[a + 1] = (b[2] << 8) | b[3]; };
    put(0, pv); put(2, ma); put(4, 31.2);
    regs[6] = 0; regs[7] = 2375; regs[8] = 0x0001; regs[9] = 100;
    return regs;
  }
  var MAPDOC = [["0–1", "PV (°C) float32 ABCD", "23.75"], ["2–3", "กระแสเอาต์พุต (mA) float32", "7.80"], ["4–5", "อุณหภูมิอิเล็กทรอนิกส์ (°C) float32", "31.2"],
    ["6", "สำรอง", "0"], ["7", "PV × 100 (int16)", "2375"], ["8", "สถานะ (บิต 0 = พร้อม)", "0x0001"], ["9", "URV (°C)", "100"]];
  function modbusLab(host) {
    shell(host, "// แล็บ · เครื่องสร้างเฟรม Modbus", "สร้างคำขอ RTU/TCP แล้วดูคำตอบจากทรานสมิตเตอร์อุณหภูมิเสมือน (slave ID 1)");
    var row = h("div", { cls: "sx-row" });
    var id = inp(host.getAttribute("data-id") || "1"), fc = sel([["3", "03 อ่าน Holding Registers"], ["4", "04 อ่าน Input Registers"], ["6", "06 เขียนรีจิสเตอร์เดียว"], ["16", "16 เขียนหลายรีจิสเตอร์"], ["1", "01 อ่าน Coils"]], host.getAttribute("data-fc") || "3");
    var addr = inp(host.getAttribute("data-addr") || "0"), qty = inp(host.getAttribute("data-qty") || "2"), val = inp("1234");
    var tid = inp("1");
    row.appendChild(field("Slave ID", id)); row.appendChild(field("ฟังก์ชัน", fc)); row.appendChild(field("แอดเดรสเริ่ม (0-based)", addr)); row.appendChild(field("จำนวน", qty)); row.appendChild(field("ค่าที่เขียน (FC06/16, คั่นด้วย ,)", val)); row.appendChild(field("Transaction ID (TCP)", tid));
    host.appendChild(row);
    var out = h("div", { cls: "sx-out", "aria-live": "polite" });
    host.appendChild(out);
    var tbl = "<table><tr><th>รีจิสเตอร์</th><th>ความหมาย</th><th>ค่า</th></tr>" + MAPDOC.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</table>";
    host.appendChild(h("details", null, "<summary>แผนผังรีจิสเตอร์ของทรานสมิตเตอร์เสมือน</summary>" + tbl + '<p class="sx-src">สมมติให้ FC03 และ FC04 อ่านตารางเดียวกัน (อุปกรณ์จริงหลายรุ่นแยกกัน) แอดเดรส 0 ในเฟรมตรงกับ "40001" ในเอกสารแบบเก่า</p>'));
    function hx(arr) { return arr.map(function (b) { return X.hex(b); }).join(" "); }
    function seg(cls, arr, label) { return '<span class="sx-seg ' + cls + '" title="' + label + '">' + hx(arr) + "</span>"; }
    function run() {
      var sid = parseInt(id.value, 10) & 0xff, f = +fc.value, a = parseInt(addr.value, 10), q = parseInt(qty.value, 10), t = parseInt(tid.value, 10) & 0xffff;
      if (!(a >= 0 && a <= 65535) || !(q >= 1 && q <= 125)) { out.innerHTML = warn("แอดเดรส 0–65535 และจำนวน 1–125"); return; }
      var vals = val.value.split(",").map(function (s) { return parseInt(s.trim(), 10) & 0xffff; }).filter(function (v) { return isFinite(v); });
      var pdu = [f];
      if (f === 3 || f === 4 || f === 1) pdu = pdu.concat([a >> 8, a & 255, q >> 8, q & 255]);
      else if (f === 6) pdu = pdu.concat([a >> 8, a & 255, vals[0] >> 8, vals[0] & 255]);
      else { q = vals.length; pdu = pdu.concat([a >> 8, a & 255, q >> 8, q & 255, 2 * q]); vals.forEach(function (v) { pdu.push(v >> 8, v & 255); }); }
      var adu = [sid].concat(pdu), crc = X.crc16(adu), crcb = [crc & 255, crc >> 8];
      var mbap = [t >> 8, t & 255, 0, 0, (pdu.length + 1) >> 8, (pdu.length + 1) & 255, sid];
      // response
      var regs = slaveMap(), rp, exc = null;
      if (f === 3 || f === 4) {
        rp = [f, 2 * q];
        for (var i = 0; i < q; i++) { var r = regs[a + i]; if (r === undefined) { exc = 2; break; } rp.push(r >> 8, r & 255); }
      } else if (f === 1) { exc = 1; }
      else if (f === 6 || f === 16) { if (a < 6 || a > 9) exc = 2; else rp = f === 6 ? pdu.slice() : [f, a >> 8, a & 255, q >> 8, q & 255]; }
      if (exc) rp = [f | 0x80, exc];
      var radu = [sid].concat(rp), rcrc = X.crc16(radu);
      var s = "<b>คำขอ RTU</b>  " + seg("a", [sid], "Slave ID") + " " + seg("f", [f], "Function") + " " + seg("d", pdu.slice(1), "Data") + " " + seg("c", crcb, "CRC (low byte ก่อน)") +
        "\n<b>คำขอ TCP</b>  " + seg("m", mbap.slice(0, 6), "MBAP: transaction, protocol 0, length") + " " + seg("a", [sid], "Unit ID") + " " + seg("f", [f], "Function") + " " + seg("d", pdu.slice(1), "Data") + "  (ไม่มี CRC — TCP ตรวจเอง)" +
        "\n<b>คำตอบ RTU</b>  " + seg("a", [sid], "Slave ID") + " " + seg("f", [rp[0]], "Function") + " " + seg("d", rp.slice(1), "Data") + " " + seg("c", [rcrc & 255, rcrc >> 8], "CRC");
      if (exc) s += "\n" + warn("Exception " + X.hex(exc) + (exc === 1 ? " ILLEGAL FUNCTION — อุปกรณ์นี้ไม่มี coils" : " ILLEGAL DATA ADDRESS — แอดเดรสนอกแผนผัง หรือเขียนรีจิสเตอร์อ่านอย่างเดียว"));
      else if (f === 3 || f === 4) {
        var words = []; for (var j = 0; j < q; j++) words.push(regs[a + j]);
        s += "\nรีจิสเตอร์ที่ได้: " + words.map(function (w, j) { return (a + j) + "=" + w; }).join(", ");
        if (q >= 2) {
          var b4 = [words[0] >> 8, words[0] & 255, words[1] >> 8, words[1] & 255];
          s += "\nอ่านสองคำแรกเป็น float32: ABCD = " + sig(X.bytesf32(b4), 6) + " · CDAB = " + sig(X.bytesf32(X.reorder(b4, "CDAB")), 6) + " · BADC = " + sig(X.bytesf32(X.reorder(b4, "BADC")), 6);
        }
      } else s += "\n" + ok(true, "สเลฟสะท้อนคำขอกลับเพื่อยืนยันการเขียน");
      var bitsPerChar = 11, tReq = (adu.length + 2) * bitsPerChar / 19200 * 1000, tRes = (radu.length + 2) * bitsPerChar / 19200 * 1000;
      s += "\nเวลาบนสายที่ 19200 8E1: คำขอ " + n(tReq, 2) + " ms + คำตอบ " + n(tRes, 2) + " ms + ช่องว่าง t3.5 ≥ 2.0 ms";
      out.innerHTML = s;
    }
    [id, fc, addr, qty, val, tid].forEach(function (e) { e.addEventListener("input", run); e.addEventListener("change", run); });
    run();
  }

  function crcLab(host) {
    shell(host, "// เครื่องมือ · CRC-16 Modbus", "วางเฟรมฐานสิบหก ระบบจะคำนวณ CRC หรือตรวจเฟรมที่มี CRC อยู่แล้ว");
    var t = h("textarea", { rows: "2", spellcheck: "false" }); t.value = host.getAttribute("data-hex") || "01 03 00 00 00 02";
    host.appendChild(field("ไบต์ (ฐานสิบหก)", t));
    var out = h("div", { cls: "sx-out", "aria-live": "polite" }); host.appendChild(out);
    function run() {
      var by = (t.value.match(/[0-9a-f]{2}/gi) || []).map(function (b) { return parseInt(b, 16); });
      if (!by.length) { out.textContent = "—"; return; }
      var c = X.crc16(by), whole = by.length > 2 ? X.crc16(by.slice(0, -2)) : -1, given = by.length > 2 ? by[by.length - 2] | (by[by.length - 1] << 8) : -2;
      out.innerHTML = "CRC ของไบต์ทั้งหมด = 0x" + X.hex(c, 4) + " → ส่งเป็น <b>" + X.hex(c & 255) + " " + X.hex(c >> 8) + "</b> (ไบต์ต่ำก่อน)" +
        (whole === given ? "\n" + ok(true, "สองไบต์ท้ายคือ CRC ที่ถูกต้องของเฟรมนี้") : "") + (c === 0 && by.length > 2 ? "\n" + ok(true, "CRC ของทั้งเฟรมรวม CRC = 0 → เฟรมสมบูรณ์") : "");
    }
    t.addEventListener("input", run); run();
  }

  function f32Lab(host) {
    shell(host, "// เครื่องมือ · float32 ↔ สองรีจิสเตอร์", "ใส่ค่าทศนิยม หรือใส่สองรีจิสเตอร์ที่อ่านได้ แล้วดูทุกลำดับไบต์");
    var row = h("div", { cls: "sx-row" }), v = inp(host.getAttribute("data-v") || "23.75"), r1 = inp(""), r2 = inp("");
    row.appendChild(field("ค่า float", v)); row.appendChild(field("หรือ รีจิสเตอร์ N (ฐานสิบหก)", r1)); row.appendChild(field("รีจิสเตอร์ N+1", r2));
    host.appendChild(row);
    var out = h("div", { cls: "sx-out", "aria-live": "polite" }); host.appendChild(out);
    function run(from) {
      var b;
      if (from === "r" && /^[0-9a-f]{1,4}$/i.test(r1.value) && /^[0-9a-f]{1,4}$/i.test(r2.value)) {
        var a1 = parseInt(r1.value, 16), a2 = parseInt(r2.value, 16); b = [a1 >> 8, a1 & 255, a2 >> 8, a2 & 255];
        out.innerHTML = "ตีความสองคำนี้เป็น float32:\n" + Object.keys(X.ORDERS).map(function (o) { return o + " → " + sig(X.bytesf32(X.reorder(b, o)), 7); }).join("\n") +
          "\nค่าที่ดูสมเหตุสมผลกับกระบวนการคือลำดับที่ถูก";
        return;
      }
      var f = K.parse(v.value); if (!isFinite(f)) { out.textContent = "—"; return; }
      b = X.f32bytes(f);
      var bits = b.map(function (x) { var s = x.toString(2); while (s.length < 8) s = "0" + s; return s; }).join("");
      out.innerHTML = "IEEE 754: sign " + bits[0] + " | exponent " + bits.slice(1, 9) + " (" + (parseInt(bits.slice(1, 9), 2) - 127) + ") | mantissa " + bits.slice(9) +
        "\nค่าที่เก็บได้จริง = " + sig(X.bytesf32(b), 9) + "\n" + Object.keys(X.ORDERS).map(function (o) {
          var q = X.reorder(b, o); return o + " → รีจิสเตอร์ N = 0x" + X.hex(q[0]) + X.hex(q[1]) + " , N+1 = 0x" + X.hex(q[2]) + X.hex(q[3]);
        }).join("\n");
    }
    v.addEventListener("input", function () { run("v"); }); r1.addEventListener("input", function () { run("r"); }); r2.addEventListener("input", function () { run("r"); });
    run("v");
  }

  // =========================================================== ISA-5.1 tag decoder
  var FIRST = { A: "การวิเคราะห์ (analysis: pH, O₂, ความนำไฟฟ้า ฯลฯ)", B: "หัวเผา / การเผาไหม้", C: "ผู้ใช้กำหนด (มักใช้ความนำไฟฟ้า)", D: "ผู้ใช้กำหนด (มักใช้ความหนาแน่น)", E: "แรงดันไฟฟ้า", F: "อัตราการไหล",
    G: "ผู้ใช้กำหนด", H: "มือ (hand)", I: "กระแสไฟฟ้า", J: "กำลังไฟฟ้า", K: "เวลา / ตารางเวลา", L: "ระดับ", M: "ผู้ใช้กำหนด (มักใช้ความชื้น)", N: "ผู้ใช้กำหนด", O: "ผู้ใช้กำหนด",
    P: "ความดัน", Q: "ปริมาณ (quantity)", R: "รังสี", S: "ความเร็ว / ความถี่", T: "อุณหภูมิ", U: "หลายตัวแปร", V: "การสั่นสะเทือน / วิเคราะห์เครื่องจักร", W: "น้ำหนัก / แรง",
    X: "ไม่จัดประเภท", Y: "เหตุการณ์ / สถานะ / การมีอยู่", Z: "ตำแหน่ง / ระยะ" };
  var VMOD = { D: "ผลต่าง (differential)", F: "อัตราส่วน (ratio)", J: "สแกน", K: "อัตราการเปลี่ยนตามเวลา", M: "ชั่วขณะ (momentary)", Q: "รวมสะสม (totalize)", S: "ความปลอดภัย (safety)" };
  var FUNC = { A: "สัญญาณเตือน (alarm)", B: "ผู้ใช้กำหนด", C: "ควบคุม (controller)", E: "อุปกรณ์ปฐมภูมิ / ตัวรับรู้ (element)", G: "เกจ / ช่องมอง (glass)", I: "แสดงค่า (indicate)", K: "สถานีควบคุม",
    L: "ไฟแสดงสถานะ (light)", O: "ออริฟิซ / ตัวจำกัดการไหล", P: "จุดทดสอบ (point)", R: "บันทึก (record)", S: "สวิตช์ (switch)", T: "ส่งสัญญาณ (transmitter)", U: "หลายหน้าที่",
    V: "วาล์ว / แดมเปอร์", W: "ปลอก / thermowell", X: "ไม่จัดประเภท", Y: "อุปกรณ์เสริม (รีเลย์ คำนวณ แปลงสัญญาณ เช่น I/P)", Z: "ตัวขับ / อุปกรณ์ควบคุมขั้นสุดท้าย" };
  var FMOD = { H: "สูง", L: "ต่ำ", M: "กลาง" };
  var EN1 = { A: "Analysis", F: "Flow", L: "Level", P: "Pressure", T: "Temperature", W: "Weight", S: "Speed", Z: "Position", E: "Voltage", I: "Current", J: "Power", H: "Hand", Y: "Event", V: "Vibration", Q: "Quantity", K: "Time", R: "Radiation", U: "Multivariable", B: "Burner", X: "Unclassified" };
  var ENF = { A: "Alarm", C: "Controller", E: "Element", G: "Gauge", I: "Indicator", K: "Control Station", L: "Light", O: "Orifice", P: "Point", R: "Recorder", S: "Switch", T: "Transmitter", U: "Multifunction", V: "Valve", W: "Well", Y: "Relay/Compute", Z: "Final Element" };
  function decodeTag(tag) {
    var m = /^\s*([A-Z]{1,6})\s*[-–]?\s*([0-9A-Z]*)\s*$/i.exec(tag || "");
    if (!m) return null;
    var L = m[1].toUpperCase(), loop = m[2], i = 0, parts = [], en = [];
    var v = L[0]; if (!FIRST[v]) return null;
    parts.push(["ตัวแรก " + v, FIRST[v]]); en.push(EN1[v] || "");
    i = 1;
    if (L[1] && VMOD[L[1]] && (L[1] !== "S" || /[VE]/.test(L[2] || "")) && !(L[1] === "S" && !L[2])) {
      if (!(L[1] === "D" && L.length === 2)) { parts.push(["ตัวขยาย " + L[1], VMOD[L[1]]]); en[0] = (L[1] === "D" ? "Differential " : L[1] === "Q" ? "" : "") + en[0] + (L[1] === "Q" ? " Totalizing" : L[1] === "S" ? " Safety" : ""); i = 2; }
    }
    var rest = L.slice(i), funcs = [];
    for (var k = 0; k < rest.length; k++) {
      var c = rest[k];
      if (FMOD[c] && k > 0) { parts.push(["ขยายหน้าที่ " + c, FMOD[c]]); funcs[funcs.length - 1] += (c === "H" ? " High" : c === "L" ? " Low" : " Middle"); continue; }
      if (!FUNC[c]) return { err: "ตัวอักษร " + c + " ไม่อยู่ในตารางหน้าที่" };
      parts.push(["หน้าที่ " + c, FUNC[c]]); funcs.push(ENF[c] || c);
    }
    var name = en[0] + " " + funcs.map(function (f, j) { return j < funcs.length - 1 && /^(Indicator|Recorder|Transmitter)$/.test(f) ? f.replace(/or$|er$/, "ing").replace("Indicating", "Indicating").replace("Transmitting", "Transmitting") : f; }).join(" ");
    return { parts: parts, loop: loop, name: name.replace(/\s+/g, " ").trim(), first: v };
  }
  function tagLab(host) {
    shell(host, "// เครื่องมือ · ถอดรหัสแท็ก ISA-5.1", "พิมพ์แท็กจาก P&ID เช่น LIC-101, PDT-205, TSHH-12, FQI-7, PSV-3");
    var t = inp(host.getAttribute("data-tag") || "LIC-101");
    host.appendChild(field("แท็ก", t));
    var chips = h("div", { cls: "sx-flt" });
    ["FT-101", "FIC-101", "FV-101", "LT-201", "LAHH-201", "PDT-305", "TE-401", "TT-401", "TIC-401", "TY-401", "PSV-501", "FQI-601", "AIT-701", "ZT-801"].forEach(function (c) {
      var b = h("button", { type: "button", cls: "sx-chip", "aria-pressed": "false" }, c); b.addEventListener("click", function () { t.value = c; run(); }); chips.appendChild(b);
    });
    host.appendChild(chips);
    var out = h("div", { cls: "sx-out", "aria-live": "polite" }); host.appendChild(out);
    function run() {
      $$("button", chips).forEach(function (x) { x.setAttribute("aria-pressed", String(x.textContent === t.value.trim().toUpperCase())); });
      var r = decodeTag(t.value);
      if (!r) { out.innerHTML = warn("รูปแบบแท็กไม่ถูกต้อง: ตัวอักษร (1–6 ตัว) ตามด้วยเลขลูป"); return; }
      if (r.err) { out.innerHTML = warn(r.err); return; }
      out.innerHTML = "<b>" + esc(t.value.toUpperCase()) + "</b> ≈ " + esc(r.name) + (r.loop ? " · ลูปหมายเลข " + esc(r.loop) : "") + "\n" +
        r.parts.map(function (p) { return "  " + p[0] + " → " + p[1]; }).join("\n") +
        "\nทุกอุปกรณ์ที่มีเลขลูปเดียวกัน (เช่น " + r.first + "T-" + (r.loop || "101") + ", " + r.first + "IC-" + (r.loop || "101") + ", " + r.first + "V-" + (r.loop || "101") + ") อยู่ในลูปควบคุมเดียวกัน";
    }
    t.addEventListener("input", run); run();
  }

  // =========================================================== 5-point calibration worksheet
  function calLab(host) {
    var lrv = +(host.getAttribute("data-lrv") || 0), urv = +(host.getAttribute("data-urv") || 100), u = host.getAttribute("data-u") || "°C", tol = +(host.getAttribute("data-tol") || 0.5);
    shell(host, "// แล็บ · ใบบันทึกการสอบเทียบ 5 จุด", "กรอกกระแสที่อ่านได้ขาขึ้นและขาลง ระบบคำนวณความคลาด ฮิสเทอรีซิส และตัดสินผ่าน/ไม่ผ่าน");
    var top = h("div", { cls: "sx-row" }), fl = inp(lrv), fu = inp(urv), ft = inp(tol), fun = inp(u);
    top.appendChild(field("LRV", fl)); top.appendChild(field("URV", fu)); top.appendChild(field("หน่วย", fun)); top.appendChild(field("เกณฑ์ยอมรับ", ft, "% span"));
    host.appendChild(top);
    var pts = [0, 25, 50, 75, 100], up = ["4.02", "8.05", "12.07", "16.06", "20.04"], dn = ["4.06", "8.10", "12.12", "16.09", "20.04"];
    var grid = h("div", { cls: "table-wrap" }), t = "<table><tr><th>%</th><th>ค่าอ้างอิงที่ป้อน</th><th>ควรได้ (mA)</th><th>ขาขึ้น (mA)</th><th>ขาลง (mA)</th></tr>";
    pts.forEach(function (p, i) { t += "<tr><td>" + p + "</td><td class=\"cref\"></td><td>" + n(4 + 0.16 * p, 2) + '</td><td><input data-k="u' + i + '" value="' + up[i] + '" size="6"></td><td><input data-k="d' + i + '" value="' + dn[i] + '" size="6"></td></tr>'; });
    grid.innerHTML = t + "</table>";
    host.appendChild(grid);
    var btns = h("div", { cls: "sx-row" }), b1 = h("button", { type: "button", cls: "sx-ghost" }, "ตัวอย่าง: เลื่อนศูนย์ (zero shift)"), b2 = h("button", { type: "button", cls: "sx-ghost" }, "ตัวอย่าง: ช่วงผิด (span error)"), b3 = h("button", { type: "button", cls: "sx-ghost" }, "ตัวอย่าง: หลังปรับ (as-left)");
    btns.appendChild(b1); btns.appendChild(b2); btns.appendChild(b3); host.appendChild(btns);
    var out = h("div", { cls: "sx-out", "aria-live": "polite" }), fig = h("div"); host.appendChild(out); host.appendChild(fig);
    var ins = $$("input[data-k]", grid);
    function setAll(a, b) { ins.forEach(function (e) { var k = e.getAttribute("data-k"), i = +k[1]; e.value = (k[0] === "u" ? a : b)[i]; }); run(); }
    b1.addEventListener("click", function () { setAll(["4.20", "8.19", "12.21", "16.20", "20.19"], ["4.22", "8.21", "12.23", "16.21", "20.19"]); });
    b2.addEventListener("click", function () { setAll(["4.01", "8.06", "12.12", "16.17", "20.22"], ["4.01", "8.07", "12.13", "16.18", "20.22"]); });
    b3.addEventListener("click", function () { setAll(["4.00", "8.01", "12.01", "16.00", "20.00"], ["4.01", "8.02", "12.02", "16.01", "20.00"]); });
    function run() {
      var L = K.parse(fl.value), U = K.parse(fu.value), T = K.parse(ft.value), unit = fun.value;
      $$(".cref", grid).forEach(function (c, i) { c.textContent = sig(L + (U - L) * pts[i] / 100, 4) + " " + unit; });
      var e = { u: [], d: [] }, worst = 0, hys = 0;
      ins.forEach(function (el) { var k = el.getAttribute("data-k"), i = +k[1], v = K.parse(el.value), err = (v - (4 + 0.16 * pts[i])) / 16 * 100; e[k[0]][i] = err; if (isFinite(err)) worst = Math.max(worst, Math.abs(err)); });
      for (var i = 0; i < 5; i++) hys = Math.max(hys, Math.abs(e.u[i] - e.d[i]));
      var zero = (e.u[0] + e.d[0]) / 2, span = ((e.u[4] + e.d[4]) / 2) - zero, pass = worst <= T;
      out.innerHTML = "ความคลาดสูงสุด = <b>" + n(worst, 3) + " % span</b> → " + ok(pass, pass ? "ผ่านเกณฑ์ ± " + T + " %" : "ไม่ผ่าน ต้องปรับแล้วบันทึก as-left") +
        "\nฮิสเทอรีซิสสูงสุด = " + n(hys, 3) + " % span" + "\nความคลาดที่ 0 % (zero) = " + n(zero, 3) + " % · ความลาดเปลี่ยน (span) = " + n(span, 3) + " %" +
        "\nคำแนะนำ: " + (Math.abs(zero) > T / 2 && Math.abs(span) < T / 2 ? "ปรับศูนย์ (zero trim) — ทุกจุดเลื่อนเท่ากัน" : Math.abs(span) > T / 2 ? "ปรับช่วง (span / upper trim) — ความคลาดโตตามสเกล" : hys > T / 2 ? "ฮิสเทอรีซิสสูง ตรวจกลไก/ไดอะแฟรม ปรับไม่ได้ด้วย trim" : "ไม่ต้องปรับ");
      var mk = function (arr) { return pts.map(function (p, i) { return [p, arr[i]]; }); };
      fig.innerHTML = K.chart({ w: 640, h: 230, xs: [0, 100], ys: [-1, 1], xt: pts, yt: [-1, -0.5, 0, 0.5, 1], series: [{ pts: mk(e.u), cls: "s1" }, { pts: mk(e.d), cls: "s2 dsh" }],
        hlines: [{ y: T, cls: "hl red", label: "+" + T + " %" }, { y: -T, cls: "hl red", label: "−" + T + " %" }], marks: mk(e.u).map(function (p) { return { x: p[0], y: Math.max(-1, Math.min(1, p[1])), r: 4 }; }),
        legend: [["f1", "ขาขึ้น"], ["f2", "ขาลง"]], xl: "จุดทดสอบ (% ของช่วง)", yl: "ความคลาด (% span)", label: "กราฟความคลาดจากการสอบเทียบ" });
    }
    [fl, fu, ft, fun].concat(ins).forEach(function (e2) { e2.addEventListener("input", run); });
    run();
  }

  K.onReady(function () {
    $$(".sx-loop").forEach(loopSim); $$(".sx-hart").forEach(hartLab); $$(".sx-modbus").forEach(modbusLab); $$(".sx-crc").forEach(crcLab);
    $$(".sx-f32").forEach(f32Lab); $$(".sx-tagdec").forEach(tagLab); $$(".sx-cal").forEach(calLab);
    $$("button[data-sx-loop]").forEach(function (b) {
      b.addEventListener("click", function () {
        var tgt = b.getAttribute("data-target") ? document.getElementById(b.getAttribute("data-target")) : document.querySelector(".sx-loop");
        if (tgt && tgt._fault) { tgt._fault(b.getAttribute("data-v")); tgt.scrollIntoView({ behavior: "smooth", block: "center" }); }
      });
    });
  });
  root.SXBus = { decodeTag: decodeTag };
})(typeof window !== "undefined" ? window : globalThis);
