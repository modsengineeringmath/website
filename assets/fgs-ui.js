/* UI parts for the FG / oscilloscope lab: rotary knob, function-generator front panel,
   circuit board panel (schematics + expected values). Used by fgs-app.js. */
(function () {
  "use strict";
  var FGS = (window.FGS = window.FGS || {});
  var U = FGS.util, fmt = U.fmtSI, clamp = U.clamp, TAU = U.TAU;
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var uid = 0;

  // ======================================================================= rotary knob
  // opt: {label, sub, step(dir, fine), get() → text, reset(), color}
  function knob(opt) {
    var w = el("div", "kn" + (opt.cls ? " " + opt.cls : ""));
    var id = "kn" + ++uid;
    w.innerHTML = '<span class="kn-l" id="' + id + 'l">' + esc(opt.label) + '</span>' +
      '<div class="kn-row"><button type="button" class="kn-b" data-d="-1" aria-label="ลด ' + esc(opt.label) + '">−</button>' +
      '<div class="kn-dial" role="slider" tabindex="0" aria-labelledby="' + id + 'l"' + (opt.color ? ' style="--kc:' + opt.color + '"' : "") + '><i></i></div>' +
      '<button type="button" class="kn-b" data-d="1" aria-label="เพิ่ม ' + esc(opt.label) + '">+</button></div>' +
      '<output class="kn-v" for="' + id + '"></output>';
    var dial = w.querySelector(".kn-dial"), out = w.querySelector(".kn-v"), ang = 0;
    function show() { var t = opt.get(); out.textContent = t; dial.setAttribute("aria-valuetext", t); dial.style.setProperty("--a", ang + "deg"); }
    function go(d, fine) { ang += d * 24; opt.step(d, fine); show(); }
    w.querySelectorAll(".kn-b").forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.d, false); }); });
    dial.addEventListener("keydown", function (e) {
      var k = e.key, d = k === "ArrowUp" || k === "ArrowRight" ? 1 : k === "ArrowDown" || k === "ArrowLeft" ? -1 : k === "PageUp" ? 5 : k === "PageDown" ? -5 : 0;
      if (d) { e.preventDefault(); var n = Math.abs(d); for (var i = 0; i < n; i++) go(Math.sign(d), e.shiftKey); }
      else if ((k === "Home" || k === "Enter") && opt.reset) { e.preventDefault(); opt.reset(); show(); }
    });
    dial.addEventListener("wheel", function (e) { e.preventDefault(); go(e.deltaY < 0 ? 1 : -1, e.shiftKey); }, { passive: false });
    var drag = null;
    dial.addEventListener("pointerdown", function (e) { drag = { y: e.clientY, x: e.clientX, acc: 0 }; dial.setPointerCapture(e.pointerId); dial.focus(); });
    dial.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var d = (drag.y - e.clientY) + (e.clientX - drag.x) * 0.6; drag.y = e.clientY; drag.x = e.clientX; drag.acc += d;
      while (drag.acc > 14) { drag.acc -= 14; go(1, e.shiftKey); }
      while (drag.acc < -14) { drag.acc += 14; go(-1, e.shiftKey); }
    });
    var end = function () { drag = null; };
    dial.addEventListener("pointerup", end); dial.addEventListener("pointercancel", end);
    dial.addEventListener("dblclick", function () { if (opt.reset) { opt.reset(); show(); } });
    w.update = show;
    show();
    return w;
  }
  function seg(opts, cur, onPick, cls, label) {
    var g = el("div", "seg seg-sm" + (cls ? " " + cls : ""));
    g.setAttribute("role", "group"); if (label) g.setAttribute("aria-label", label);
    opts.forEach(function (o) {
      var b = el("button", null, o[1]); b.type = "button"; b.dataset.v = o[0];
      b.addEventListener("click", function () { onPick(o[0]); g.set(o[0]); });
      g.appendChild(b);
    });
    g.set = function (v) { g.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v) === String(v) ? "true" : "false"); }); };
    g.set(cur);
    return g;
  }

  // ======================================================================= function generator panel
  var PARAMS = {
    freq: { th: "ความถี่", en: "Freq", unit: "Hz", min: 1e-3, max: 25e6, si: true },
    amp: { th: "แอมพลิจูด", en: "Ampl", unit: "Vpp", min: 1e-3, max: 20, si: true },
    offset: { th: "ออฟเซต", en: "Offset", unit: "Vdc", min: -10, max: 10, si: true },
    phase: { th: "เฟส", en: "Phase", unit: "°", min: -360, max: 360 },
    duty: { th: "ดิวตี้", en: "Duty", unit: "%", min: 0.1, max: 99.9 },
    sym: { th: "สมมาตร", en: "Symm", unit: "%", min: 0, max: 100 },
    edge: { th: "เวลาขอบ", en: "Edge", unit: "s", min: 8e-9, max: 1e-3, si: true }
  };
  function paramsFor(w) {
    if (w === "dc") return ["offset"];
    if (w === "noise") return ["amp", "offset"];
    var p = ["freq", "amp", "offset", "phase"];
    if (w === "square") p.push("duty");
    if (w === "pulse") p.push("duty", "edge");
    if (w === "ramp") p.push("sym");
    return p;
  }
  // digit-cursor display: value with the digit of weight 10^e underlined
  function digitHtml(v, unit, e, si) {
    var neg = v < 0, a = Math.abs(v), k = 0;
    if (si) { if (a >= 1e6) k = 2; else if (a >= 1e3) k = 1; else if (a >= 1 || a === 0) k = 0; else if (a >= 1e-3) k = -1; else if (a >= 1e-6) k = -2; else k = -3; }
    var m = a / Math.pow(10, 3 * k), we = e - 3 * k, dec = Math.max(si ? 3 : 1, -we);
    if (!si && unit === "%") dec = Math.max(1, -we);
    var s = m.toFixed(Math.min(dec, 9)), dot = s.indexOf("."), ip = dot < 0 ? s : s.slice(0, dot);
    while (ip.length < we + 1) { ip = "0" + ip; s = "0" + s; }
    dot = s.indexOf(".");
    var idx = we >= 0 ? (dot < 0 ? s.length : dot) - 1 - we : dot + (-we);
    var pre = { 2: "M", 1: "k", 0: "", "-1": "m", "-2": "µ", "-3": "n" }[k];
    var html = idx >= 0 && idx < s.length ? esc(s.slice(0, idx)) + "<u>" + s[idx] + "</u>" + esc(s.slice(idx + 1)) : esc(s);
    return (neg ? "−" : "") + html + '<small> ' + pre + esc(unit) + "</small>";
  }

  function FGPanel(lab) {
    this.lab = lab; var fg = lab.st.fg, self = this;
    this.sel = "freq"; this.exp = { freq: 2, amp: -1, offset: -1, phase: 0, duty: 0, sym: 0, edge: -9 };
    var root = (this.root = el("section", "inst fg-inst"));
    root.setAttribute("aria-label", "เครื่องกำเนิดสัญญาณ (function generator)");
    root.innerHTML = '<header class="inst-head"><b>FUNCTION GENERATOR</b><span class="mono">FG-25 · 25 MHz · 1 ช่อง</span></header>' +
      '<div class="fg-lcd" aria-live="polite"><div class="fg-top mono"></div><div class="fg-main"></div><div class="fg-list mono"></div><div class="fg-msg"></div></div>' +
      '<div class="fg-sec"><span class="fg-h mono">WAVEFORM</span><div class="fg-waves"></div></div>' +
      '<div class="fg-sec"><span class="fg-h mono">PARAMETER</span><div class="fg-params"></div></div>' +
      '<div class="fg-sec fg-entry"><label class="fg-h mono" for="">ใส่ค่า / หมุนปุ่ม</label><div class="fg-in"><input type="text" inputmode="decimal" spellcheck="false" autocomplete="off"><button type="button" class="btn btn-ghost btn-sm" data-act="enter">ตั้งค่า</button></div>' +
      '<div class="fg-dig"><button type="button" class="kn-b" data-act="left" aria-label="เลื่อนตำแหน่งหลักไปทางซ้าย">◀</button><span class="fg-knob"></span><button type="button" class="kn-b" data-act="right" aria-label="เลื่อนตำแหน่งหลักไปทางขวา">▶</button></div>' +
      '<p class="hint">พิมพ์พร้อมหน่วยย่อได้ เช่น <code>1k</code> <code>2.5M</code> <code>200m</code> · ปุ่มหมุนเพิ่มลดหลักที่ขีดเส้นใต้ · ◀ ▶ เลือกหลัก</p></div>' +
      '<div class="fg-sec"><span class="fg-h mono">MOD / SWEEP / BURST</span><div class="fg-mod"></div><div class="fg-modp"></div></div>' +
      '<div class="fg-sec fg-outrow"><div><span class="fg-h mono">LOAD (ค่าที่ตั้งอ้างอิงโหลด)</span><div class="fg-load"></div></div>' +
      '<div><span class="fg-h mono">NOISE ADD</span><div class="fg-noise"></div></div>' +
      '<button type="button" class="fg-outbtn" aria-pressed="true">OUTPUT</button></div>';
    var input = (this.input = root.querySelector(".fg-in input"));
    input.id = "fgin" + ++uid; root.querySelector(".fg-entry label").setAttribute("for", input.id);
    // waveform keys
    var wv = root.querySelector(".fg-waves");
    [["sine", "∿ Sine"], ["square", "⎍ Square"], ["ramp", "⋀ Ramp"], ["pulse", "⊓ Pulse"], ["noise", "≋ Noise"], ["sinc", "Arb sinc"], ["exprise", "Arb exp"], ["stair", "Arb stair"], ["dc", "DC"]].forEach(function (w) {
      var b = el("button", "fg-key", w[1]); b.type = "button"; b.dataset.w = w[0];
      b.addEventListener("click", function () {
        fg.wave = w[0];
        if (w[0] === "ramp" && fg.sym === 50 && self._rampDefault !== false) fg.sym = 50;
        if (paramsFor(fg.wave).indexOf(self.sel) < 0) self.sel = paramsFor(fg.wave)[0];
        lab.changed("fg"); self.update();
      });
      wv.appendChild(b);
    });
    this.pbox = root.querySelector(".fg-params");
    // knob
    this.knob = knob({ label: "ปุ่มหมุน", get: function () { return ""; }, step: function (d) { self.bump(d); } , cls: "kn-big" });
    root.querySelector(".fg-knob").appendChild(this.knob);
    root.querySelector('[data-act="left"]').addEventListener("click", function () { self.exp[self.sel]++; self.update(); });
    root.querySelector('[data-act="right"]').addEventListener("click", function () { self.exp[self.sel]--; self.update(); });
    var apply = function () { self.typeIn(input.value); };
    root.querySelector('[data-act="enter"]').addEventListener("click", apply);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
    // modulation
    this.modSeg = seg([["none", "ปิด"], ["am", "AM"], ["fm", "FM"], ["pwm", "PWM"], ["sweep", "Sweep"], ["burst", "Burst"]], fg.mod, function (v) { fg.mod = v; lab.changed("fg"); self.update(); }, null, "มอดูเลชัน");
    root.querySelector(".fg-mod").appendChild(this.modSeg);
    this.loadSeg = seg([["highz", "High-Z"], ["50", "50 Ω"]], fg.load, function (v) { fg.load = v; lab.changed("fg"); self.update(); }, null, "โหลดที่ตั้งไว้");
    root.querySelector(".fg-load").appendChild(this.loadSeg);
    this.noiseSeg = seg([["0", "ปิด"], ["5", "5%"], ["20", "20%"]], String(fg.noise), function (v) { fg.noise = +v; lab.changed("fg"); self.update(); }, null, "เพิ่มนอยส์");
    root.querySelector(".fg-noise").appendChild(this.noiseSeg);
    var ob = (this.outBtn = root.querySelector(".fg-outbtn"));
    ob.addEventListener("click", function () { fg.out = !fg.out; lab.changed("fg"); self.update(); });
    this.update();
  }
  FGPanel.prototype.val = function (p) { return this.lab.st.fg[p]; };
  FGPanel.prototype.set = function (p, v) {
    var fg = this.lab.st.fg, P = PARAMS[p];
    if (!isFinite(v)) { this.msg = "ค่าไม่ถูกต้อง"; this.update(); return; }
    fg[p] = clamp(v, P.min, P.max);
    this.msg = FGS.FG.limit(fg);
    this.lab.changed("fg"); this.update();
  };
  FGPanel.prototype.bump = function (d) {
    var p = this.sel, v = this.val(p), stp = Math.pow(10, this.exp[p]);
    if (p === "freq" && v + d * stp <= 0) stp = v / 10;
    this.set(p, Math.round((v + d * stp) / stp) * stp);
  };
  FGPanel.prototype.typeIn = function (s) {
    var p = this.sel, v = U.parseSI(s);
    if (p === "amp" && /rms/i.test(s) && this.lab.st.fg.wave === "sine") v = v * 2 * Math.SQRT2; // "1Vrms" → Vpp for sine
    this.set(p, v);
  };
  FGPanel.prototype.update = function () {
    var fg = this.lab.st.fg, self = this, ps = paramsFor(fg.wave);
    if (ps.indexOf(this.sel) < 0) this.sel = ps[0];
    var P = PARAMS[this.sel], k = FGS.FG.loadK(fg);
    var e = this.exp[this.sel], v = fg[this.sel];
    // keep the digit cursor in a sensible range
    var top = v !== 0 ? Math.floor(Math.log10(Math.abs(v))) : 0;
    if (P.si) this.exp[this.sel] = e = clamp(e, top - 6, Math.max(top, 0) + 1);
    this.root.querySelector(".fg-top").innerHTML = '<b>' + esc(FGS.FG.WAVES[fg.wave].th) + "</b> · " + (fg.mod === "none" ? "Continuous" : fg.mod.toUpperCase()) + " · Load " + (fg.load === "50" ? "50 Ω" : "High-Z") + ' · <span class="' + (fg.out ? "on" : "off") + '">' + (fg.out ? "OUTPUT ON" : "OUTPUT OFF") + "</span>";
    this.root.querySelector(".fg-main").innerHTML = '<span class="fg-pn">' + P.en + " · " + P.th + "</span>" + digitHtml(v, P.unit, e, !!P.si);
    var list = ps.filter(function (p) { return p !== self.sel; }).map(function (p) { var Q = PARAMS[p]; return "<span>" + Q.en + " <b>" + esc(fmt(fg[p], Q.unit === "°" || Q.unit === "%" ? "" : Q.unit, 5)) + (Q.unit === "°" ? "°" : Q.unit === "%" ? " %" : "") + "</b></span>"; });
    if (fg.wave === "sine" && fg.wave !== "dc") list.push("<span>≈ <b>" + esc(fmt(fg.amp / (2 * Math.SQRT2), "Vrms", 4)) + "</b></span>");
    if (k === 2) list.push('<span class="warn">emf ภายใน = 2 × ค่าที่ตั้ง</span>');
    this.root.querySelector(".fg-list").innerHTML = list.join("");
    var m = this.root.querySelector(".fg-msg"); m.textContent = this.msg || ""; m.hidden = !this.msg; this.msg = "";
    this.root.querySelectorAll(".fg-key").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.w === fg.wave ? "true" : "false"); });
    this.pbox.innerHTML = "";
    ps.forEach(function (p) {
      var b = el("button", "fg-soft", PARAMS[p].en + "<small>" + PARAMS[p].th + "</small>"); b.type = "button";
      b.setAttribute("aria-pressed", p === self.sel ? "true" : "false");
      b.addEventListener("click", function () { self.sel = p; self.update(); self.input.focus(); });
      self.pbox.appendChild(b);
    });
    this.input.value = P.si ? fmt(v, "", 6).replace(/ /g, "") : String(+v.toFixed(3));
    this.input.setAttribute("aria-label", P.th + " (" + P.unit + ")");
    this.modSeg.set(fg.mod); this.loadSeg.set(fg.load); this.noiseSeg.set(String(fg.noise));
    this.outBtn.setAttribute("aria-pressed", fg.out ? "true" : "false"); this.outBtn.textContent = fg.out ? "OUTPUT ON" : "OUTPUT OFF";
    this.modParams();
  };
  var MODP = {
    am: [["amDepth", "ความลึก m (%)", ""], ["amF", "ความถี่มอดูเลต f_m", "Hz"]],
    fm: [["fmDev", "ค่าเบี่ยงเบน Δf", "Hz"], ["fmF", "ความถี่มอดูเลต f_m", "Hz"]],
    pwm: [["pwmDev", "เบี่ยงดิวตี้ (%)", ""], ["pwmF", "ความถี่มอดูเลต", "Hz"]],
    sweep: [["swF1", "เริ่ม f₁", "Hz"], ["swF2", "หยุด f₂", "Hz"], ["swTime", "เวลากวาด", "s"]],
    burst: [["bN", "จำนวนรอบ N", ""], ["bPer", "คาบเบิสต์", "s"]]
  };
  FGPanel.prototype.modParams = function () {
    var fg = this.lab.st.fg, box = this.root.querySelector(".fg-modp"), self = this, list = MODP[fg.mod];
    if (box._mod === fg.mod && box._wave === fg.wave) { box.querySelectorAll("input").forEach(function (i) { if (document.activeElement !== i) i.value = fmt(fg[i.dataset.k], "", 5).replace(/ /g, ""); }); return; }
    box._mod = fg.mod; box._wave = fg.wave; box.innerHTML = "";
    if (!list) return;
    list.forEach(function (q) {
      var id = "fgm" + ++uid, r = el("div", "fg-mp", '<label for="' + id + '">' + q[1] + '</label><input id="' + id + '" type="text" inputmode="decimal" data-k="' + q[0] + '">' + (q[2] ? '<span class="mono">' + q[2] + "</span>" : ""));
      var inp = r.querySelector("input"); inp.value = fmt(fg[q[0]], "", 5).replace(/ /g, "");
      inp.addEventListener("change", function () {
        var v = U.parseSI(inp.value);
        if (isFinite(v) && v > 0 || (q[0] === "amDepth" && v >= 0)) {
          if (q[0] === "amDepth") v = clamp(v, 0, 120); if (q[0] === "pwmDev") v = clamp(v, 0, 49); if (q[0] === "bN") v = clamp(Math.round(v), 1, 1000);
          fg[q[0]] = v; self.lab.changed("fg");
        }
        inp.value = fmt(fg[q[0]], "", 5).replace(/ /g, "");
      });
      box.appendChild(r);
    });
    if (fg.mod === "sweep") {
      var s = seg([["lin", "เชิงเส้น"], ["log", "ลอการิทึม"]], fg.swType, function (v) { fg.swType = v; self.lab.changed("fg"); }, null, "ชนิดการกวาด");
      box.appendChild(s);
    }
    if (fg.mod === "pwm" && fg.wave !== "pulse" && fg.wave !== "square") box.appendChild(el("p", "hint", "PWM ใช้กับคลื่นสี่เหลี่ยมหรือพัลส์เท่านั้น"));
    box.appendChild(el("p", "hint", fg.mod === "sweep" || fg.mod === "burst" ? "ภาพนิ่งเมื่อทริกเกอร์จาก EXT (สัญญาณ Sync ของเครื่องกำเนิด)" : "AM/FM/PWM: ทริกเกอร์ EXT จะล็อกกับคลื่นมอดูเลต"));
  };

  // ======================================================================= circuit board: schematics
  var W = "sw";
  function hR(x, y) { return "M" + x + " " + y + " l5 -7 l8 14 l8 -14 l8 14 l8 -14 l8 14 l5 -7"; }
  function vR(x, y) { return "M" + x + " " + y + " l7 5 l-14 8 l14 8 l-14 8 l14 8 l-14 8 l7 5"; }
  function hC(x, y) { return "M" + x + " " + y + " h16 M" + (x + 16) + " " + (y - 11) + " v22 M" + (x + 24) + " " + (y - 11) + " v22 M" + (x + 24) + " " + y + " h16"; }
  function vC(x, y) { return "M" + x + " " + y + " v16 M" + (x - 11) + " " + (y + 16) + " h22 M" + (x - 11) + " " + (y + 24) + " h22 M" + x + " " + (y + 24) + " v16"; }
  function hL(x, y) { return "M" + x + " " + y + " h1 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 h-1"; }
  function vL(x, y) { return "M" + x + " " + y + " v1 a6 6 0 0 1 0 12 a6 6 0 0 1 0 12 a6 6 0 0 1 0 12 a6 6 0 0 1 0 12 v-1"; }
  function hD(x, y) { return "M" + x + " " + y + " h12 M" + (x + 12) + " " + (y - 8) + " L" + (x + 26) + " " + y + " L" + (x + 12) + " " + (y + 8) + " Z M" + (x + 26) + " " + (y - 8) + " v16 M" + (x + 26) + " " + y + " h14"; }
  function vD(x, y, up) { // 40 tall; up = cathode at top
    return up ? "M" + x + " " + y + " v12 M" + (x - 8) + " " + (y + 12) + " h16 M" + (x - 8) + " " + (y + 28) + " L" + x + " " + (y + 12) + " L" + (x + 8) + " " + (y + 28) + " Z M" + x + " " + (y + 28) + " v12"
      : "M" + x + " " + y + " v12 M" + (x - 8) + " " + (y + 12) + " L" + x + " " + (y + 28) + " L" + (x + 8) + " " + (y + 12) + " Z M" + (x - 8) + " " + (y + 28) + " h16 M" + x + " " + (y + 28) + " v12";
  }
  function gnd(x, y) { return "M" + x + " " + y + " v6 M" + (x - 10) + " " + (y + 6) + " h20 M" + (x - 6) + " " + (y + 10) + " h12 M" + (x - 2) + " " + (y + 14) + " h4"; }
  function oa(x, y, minusTop) {
    return { d: "M" + x + " " + (y - 32) + " L" + (x + 58) + " " + y + " L" + x + " " + (y + 32) + " Z", t: '<text x="' + (x + 5) + '" y="' + (y - 11) + '" class="s-pm">' + (minusTop ? "−" : "+") + '</text><text x="' + (x + 5) + '" y="' + (y + 21) + '" class="s-pm">' + (minusTop ? "+" : "−") + "</text>" };
  }
  function probe(x, y, n, dx, dy) { return '<circle cx="' + x + '" cy="' + y + '" r="5" class="s-ch' + n + '"/><text x="' + (x + (dx == null ? (n === 1 ? -12 : 8) : dx)) + '" y="' + (y + (dy == null ? (n === 1 ? 20 : -8) : dy)) + '" class="s-cht' + n + '">CH' + n + "</text>"; }
  function txt(x, y, s, cls) { return '<text x="' + x + '" y="' + y + '"' + (cls ? ' class="' + cls + '"' : "") + ">" + esc(s) + "</text>"; }
  var FGBOX = '<rect x="6" y="38" width="46" height="70" rx="6" class="s-box"/><text x="29" y="66" class="s-fg">FG</text><text x="29" y="84" class="s-sm" text-anchor="middle">50 Ω</text>';

  function schematic(d) {
    var p = [], t = [FGBOX], y = 55, b = 132;
    p.push("M52 " + y + " H80 M29 108 V" + b);
    var Rs = fmt(d.R, "Ω", 3), Cs = fmt(d.C, "F", 3), Ls = fmt(d.L, "H", 3);
    t.push(probe(80, y, 1));
    switch (d.type) {
      case "direct":
        p.push("M80 " + y + " H230 M29 " + b + " H230");
        t.push(probe(230, y, 2, -14), txt(96, 30, "สาย BNC + ข้อต่อ T", "s-sm"));
        if (d.term) { p.push("M200 " + y + " V72", vR(200, 72), "M200 122 V" + b); t.push(txt(210, 102, "50 Ω (terminator)", "s-sm")); }
        else t.push(txt(110, 100, "อินพุตสโคป 1 MΩ ∥ 1 MΩ", "s-sm"));
        break;
      case "cal":
        return '<svg viewBox="0 0 330 150" class="sch" role="img" aria-label="โพรบทั้งสองต่อเข้ากับขั้วสอบเทียบโพรบของออสซิลโลสโคป"><rect x="20" y="40" width="120" height="70" rx="8" class="s-box"/><text x="80" y="70" class="s-fg">PROBE COMP</text><text x="80" y="90" class="s-sm" text-anchor="middle">1 kHz · 0 → 3 V</text><path class="sw" d="M140 60 H240 M140 90 H200"/>' + probe(240, 60, 1) + probe(200, 90, 2) + txt(150, 128, "คลิปกราวด์ทั้งสองโพรบต่อขั้ว ⏚", "s-sm") + "</svg>";
      case "rc": case "rl": {
        var rl = d.type === "rl", sh = d.out === (rl ? "L" : "R") ? (rl ? "L" : "R") : (rl ? "R" : "C"), se = rl ? (sh === "L" ? "R" : "L") : (sh === "R" ? "C" : "R");
        var part = function (k, x, yy, hz) { return k === "R" ? (hz ? hR(x, yy) : vR(x, yy)) : k === "C" ? (hz ? hC(x, yy) : vC(x, yy)) : (hz ? hL(x, yy) : vL(x, yy)); };
        var len = se === "C" ? 40 : 48;
        p.push("M80 " + y + " H100", part(se, 100, y, true), "M" + (100 + len) + " " + y + " H220", "M220 " + y + " V70", part(sh, 220, 70, false), "M220 " + (70 + (sh === "C" ? 40 : 48)) + " V" + b, "M29 " + b + " H220");
        var lab = { R: "R = " + Rs, C: "C = " + Cs, L: "L = " + Ls };
        t.push(txt(100, 38, lab[se]), txt(236, 104, lab[sh]), probe(220, y, 2, 10));
        break;
      }
      case "rlc": {
        var order = { C: ["R", "L", "C"], R: ["C", "L", "R"], L: ["R", "C", "L"], LC: ["R", "L", "C"] }[d.out] || ["R", "L", "C"];
        var x = 92, pieces = [], lab2 = { R: "R " + Rs, C: "C " + Cs, L: "L " + Ls };
        p.push("M80 " + y + " H" + x);
        [order[0], order[1]].forEach(function (k, i) {
          if (d.out === "LC" && i === 1) return;
          var L2 = k === "C" ? 40 : k === "L" ? 48 : 50;
          pieces.push(k === "R" ? hR(x, y) : k === "C" ? hC(x, y) : hL(x, y)); t.push(txt(x, i ? 84 : 36, lab2[k], "s-sm")); x += L2 + 8; p.push("M" + (x - 8) + " " + y + " H" + x);
        });
        p.push("M" + x + " " + y + " H250");
        p = p.concat(pieces);
        if (d.out === "LC") { p.push("M250 " + y + " V62", vL(250, 62), "M250 110 V112", vC(250, 112 - 22), "M29 " + b + " H250"); t.push(txt(262, 88, "L " + Ls, "s-sm"), txt(262, 118, "C " + Cs, "s-sm")); }
        else {
          var k3 = order[2], L3 = k3 === "C" ? 40 : k3 === "L" ? 48 : 50;
          p.push("M250 " + y + " V70", k3 === "R" ? vR(250, 70) : k3 === "C" ? vC(250, 70) : vL(250, 70), "M250 " + (70 + L3) + " V" + b, "M29 " + b + " H250");
          t.push(txt(264, 100, lab2[k3], "s-sm"));
        }
        t.push(probe(250, y, 2, 10));
        break;
      }
      case "hwr": case "fwr": {
        if (d.type === "hwr") { p.push("M80 " + y + " H96", hD(96, y), "M136 " + y + " H260"); t.push(txt(98, 38, "D (Vf " + fmt(d.Vf, "V", 2) + ")", "s-sm")); }
        else { p.push("M80 " + y + " H96 M96 " + y + " V80 M29 " + b + " H96 V110", "M96 80 h10 M96 110 h10"); t.push('<rect x="106" y="70" width="54" height="50" rx="4" class="s-box"/>', txt(133, 92, "บริดจ์", "s-sm s-c"), txt(133, 108, "4 ไดโอด", "s-sm s-c")); p.push("M160 80 H200 V" + y + " H260 M160 110 H200 V" + b); }
        if (d.Cf > 0) { p.push("M200 " + y + " V72", vC(200, 72), "M200 112 V" + b); t.push(txt(206, 126, "C " + fmt(d.Cf, "F", 3), "s-sm")); }
        p.push("M260 " + y + " V70", vR(260, 70), "M260 120 V" + b, "M" + (d.type === "hwr" ? 29 : 200) + " " + b + " H260");
        t.push(txt(274, 100, "RL " + fmt(d.RL, "Ω", 3), "s-sm"), probe(260, y, 2, -46));
        if (d.type === "fwr") t.push(txt(96, 156, "⚠ วัดอินพุตกับเอาต์พุตพร้อมกันต้องใช้โพรบดิฟเฟอเรนเชียล", "s-sm s-warn"));
        break;
      }
      case "clip":
        p.push("M80 " + y + " H96", hR(96, y), "M146 " + y + " H250", "M190 " + y + " V72", vD(190, 72, true), "M190 112 V" + b, "M29 " + b + " H230");
        if (d.clipMode !== "pos") { p.push("M230 " + y + " V72", vD(230, 72, false), "M230 112 V" + b); }
        t.push(txt(98, 38, "R " + Rs, "s-sm"), probe(250, y, 2, -10));
        break;
      case "clamp":
        p.push("M80 " + y + " H96", hC(96, y), "M136 " + y + " H260", "M200 " + y + " V72", vD(200, 72, true), "M200 112 V" + b, "M260 " + y + " V70", vR(260, 70), "M260 120 V" + b, "M29 " + b + " H260");
        t.push(txt(98, 34, "C " + fmt(d.Cf, "F", 3), "s-sm"), txt(274, 100, "RL " + fmt(d.RL, "Ω", 3), "s-sm"), probe(260, y, 2, -46));
        break;
      default: { // op-amp circuits (taller drawing: viewBox starts at y = −16)
        var mt = d.type === "inv" || d.type === "integ" || d.type === "diff" || d.type === "schmitt";
        var o = oa(176, 110, mt), top = 95, bot = 125, xo = 234, fy = 34;
        p.push(o.d); t.push(o.t);
        var fb = function (x0, y0) { p.push("M" + x0 + " " + y0 + " V" + fy + " H182", "M232 " + fy + " H256 V110"); };
        if (d.type === "inv" || d.type === "integ") {
          p.push("M80 " + y + " H100", hR(100, y), "M150 " + y + " H160 V" + top + " H176");
          t.push(txt(100, 42, (d.type === "inv" ? "Rᵢ " + fmt(d.Ri, "Ω", 3) : "R " + Rs), "s-sm"));
          if (d.type === "inv") { fb(160, y); p.push(hR(182, fy)); t.push(txt(184, 22, "R_f " + fmt(d.Rf, "Ω", 3), "s-sm")); }
          else {
            p.push("M160 " + y + " V" + fy + " H186", hC(186, fy), "M226 " + fy + " H256 V110", "M160 " + fy + " V4 H182", hR(182, 4), "M232 4 H256 V" + fy);
            t.push(txt(186, 64, "C " + Cs, "s-sm"), txt(184, -6, "R_p " + fmt(d.Rp, "Ω", 3), "s-sm"));
          }
          p.push("M176 " + bot + " H160 V140", gnd(160, 140));
        } else if (d.type === "diff") {
          p.push("M80 " + y + " H84", hC(84, y), "M124 " + y + " H124", hR(124, y), "M174 " + y + " V" + top + " H176");
          fb(174, y); p.push(hR(182, fy));
          t.push(txt(92, 90, "C " + Cs, "s-sm"), txt(122, 40, "R₁ " + fmt(d.R1, "Ω", 3), "s-sm"), txt(192, 22, "R_f " + fmt(d.Rf, "Ω", 3), "s-sm"));
          p.push("M176 " + bot + " H160 V140", gnd(160, 140));
        } else if (d.type === "noninv") {
          p.push("M80 " + y + " H88 V150 H166 V" + bot + " H176", "M176 " + top + " H160", hR(110, top), "M110 " + top + " V104", gnd(110, 104));
          fb(160, top); p.push(hR(182, fy));
          t.push(txt(184, 22, "R_f " + fmt(d.Rf, "Ω", 3), "s-sm"), txt(112, 82, "Rᵢ " + fmt(d.Ri, "Ω", 3), "s-sm"));
        } else if (d.type === "comp") {
          p.push("M80 " + y + " H140 V" + top + " H176", "M176 " + bot + " H150 V150");
          t.push('<circle cx="150" cy="154" r="4" class="s-box"/>', txt(112, 174, "V_ref = " + fmt(d.Vref, "V", 3), "s-sm"));
        } else { // schmitt: input to −, divider R₁ (from output) / R₂ (to ground) on +
          p.push("M80 " + y + " H120 V" + top + " H176", "M176 " + bot + " H140", "M140 " + bot + " V" + (bot + 4), vR(140, bot + 4), "M140 " + (bot + 54) + " V" + (bot + 56), gnd(140, bot + 56),
            "M166 " + bot + " V164 H182", hR(182, 164), "M232 164 H256 V110");
          t.push(txt(186, 186, "R₁ " + fmt(d.R1, "Ω", 3), "s-sm"), txt(84, 154, "R₂", "s-sm"), txt(84, 168, fmt(d.R2, "Ω", 3), "s-sm"));
        }
        p.push("M" + xo + " 110 H282", gnd(29, b));
        t.push(probe(282, 110, 2, -18, -10), txt(250, 196, FGS.OPAMPS[d.op].th + " ±" + d.Vcc + " V", "s-sm"));
        return '<svg viewBox="0 -16 330 220" class="sch" role="img" aria-label="' + esc(FGS.DUTS[d.type].th) + '"><path class="sw" d="' + p.join(" ") + '"/>' + t.join("") + "</svg>";
      }
    }
    if (b) p.push(gnd(29, b));
    return '<svg viewBox="0 0 330 160" class="sch" role="img" aria-label="' + esc((FGS.DUTS[d.type] || {}).th || "") + '"><path class="sw" d="' + p.join(" ") + '"/>' + t.join("") + "</svg>";
  }

  // expected values from formulas (shown next to the board)
  function theory(st) {
    var d = st.dut, fg = st.fg, Rs = U.RS, out = [], Vp = (fg.amp / 2) * FGS.FG.loadK(fg), f = fg.freq;
    var opm = FGS.OPAMPS[d.op], swing = Math.max(0.5, d.Vcc - opm.drop);
    var li = function (k, v, id) { out.push('<li><span>' + k + '</span><b>' + esc(v) + "</b>" + (id ? ' <a class="fid" href="' + id + '">' + id.split("#")[1] + "</a>" : "") + "</li>"); };
    switch (d.type) {
      case "direct": {
        var RL = d.term ? 50 : 5e5;
        li("แรงดันที่ขั้ว = emf × R_L/(R_L+50)", fmt(2 * Vp * (RL / (RL + Rs)), "Vpp", 4), "/learn/function-generator/generator/#V4");
        if (d.term !== (fg.load === "50")) out.push('<li class="warn">โหลดจริงไม่ตรงกับที่ตั้งใน FG ค่าบนจอจะไม่ตรงกับค่าที่ตั้ง</li>');
        break;
      }
      case "rc": {
        var tau = (d.R + Rs) * d.C;
        li("τ = (R + 50 Ω)C", fmt(tau, "s", 4), "/learn/function-generator/rc-rlc/#R1");
        li("f_c = 1/(2πτ)", fmt(1 / (TAU * tau), "Hz", 4), "/learn/function-generator/rc-rlc/#R5");
        var H = 1 / Math.sqrt(1 + Math.pow(TAU * f * tau, 2)), ph = -Math.atan(TAU * f * tau) * 180 / Math.PI;
        if (d.out === "R") { H = (TAU * f * tau) / Math.sqrt(1 + Math.pow(TAU * f * tau, 2)); ph = 90 + ph; }
        li("|H| ที่ f นี้ (ไซน์)", H.toFixed(4) + " = " + (20 * Math.log10(H)).toFixed(2) + " dB");
        li("มุมเฟสของ H", ph.toFixed(2) + "°");
        break;
      }
      case "rl": {
        var t2 = d.L / (d.R + Rs);
        li("τ = L/(R + 50 Ω)", fmt(t2, "s", 4), "/learn/function-generator/rc-rlc/#R1");
        li("f_c = 1/(2πτ)", fmt(1 / (TAU * t2), "Hz", 4));
        break;
      }
      case "rlc": {
        var Rt = d.R + Rs, w0 = 1 / Math.sqrt(d.L * d.C), Q = Math.sqrt(d.L / d.C) / Rt;
        li("f₀ = 1/(2π√LC)", fmt(w0 / TAU, "Hz", 4), "/learn/function-generator/rc-rlc/#R9");
        li("Q = √(L/C)/(R + 50 Ω)", Q.toFixed(3), "/learn/function-generator/rc-rlc/#R10");
        li("แบนด์วิดท์ f₀/Q", fmt(w0 / TAU / Q, "Hz", 4));
        li("ζ = 1/(2Q)", (1 / (2 * Q)).toFixed(3));
        if (d.out === "R") li("V_R/V_emf ที่ f₀", (d.R / Rt).toFixed(4));
        break;
      }
      case "hwr": case "fwr": {
        var vpk = Vp - (d.type === "fwr" ? 2 : 1) * d.Vf, fr = d.type === "fwr" ? 2 * f : f;
        li("V_peak ≈ V_p − " + (d.type === "fwr" ? "2V_f" : "V_f"), fmt(vpk, "V", 4), "/learn/function-generator/applications/#X1");
        if (d.Cf > 0) li("ริปเปิล V_r ≈ V_peak/(f_r R_L C)", fmt(vpk / (fr * d.RL * d.Cf), "Vpp", 3), "/learn/function-generator/applications/#X2");
        break;
      }
      case "clip": li("ระดับตัด", d.clipMode === "pos" ? "+" + fmt(d.Vf, "V", 3) : "±" + fmt(d.Vf, "V", 3), "/learn/function-generator/applications/#X6"); break;
      case "clamp": li("ช่วงเอาต์พุต ≈ −V_f ถึง 2V_p − V_f", fmt(-d.Vf, "V", 3) + " … " + fmt(2 * Vp - d.Vf, "V", 3), "/learn/function-generator/applications/#X7"); break;
      case "inv": {
        var A = -d.Rf / (d.Ri + Rs), NG = 1 + d.Rf / (d.Ri + Rs);
        li("A_v = −R_f/R_i", A.toFixed(3), "/learn/function-generator/op-amp/#U1");
        li("f₋₃dB = GBW/(1 + R_f/R_i)", fmt(opm.gbw / NG, "Hz", 3), "/learn/function-generator/op-amp/#U5");
        li("แรงดันอิ่มตัว ±", fmt(swing, "V", 3));
        li("FPBW = SR/(2πV_op)", fmt(opm.sr / (TAU * Math.min(swing, Math.abs(A) * Vp)), "Hz", 3), "/learn/function-generator/op-amp/#U6");
        break;
      }
      case "noninv": {
        var G = 1 + d.Rf / d.Ri;
        li("A_v = 1 + R_f/R_i", G.toFixed(3), "/learn/function-generator/op-amp/#U2");
        li("f₋₃dB = GBW/A_v", fmt(opm.gbw / G, "Hz", 3), "/learn/function-generator/op-amp/#U5");
        li("FPBW = SR/(2πV_op)", fmt(opm.sr / (TAU * Math.min(swing, G * Vp)), "Hz", 3), "/learn/function-generator/op-amp/#U6");
        break;
      }
      case "integ": {
        li("v_o = −(1/RC)∫v_i dt · RC", fmt(d.R * d.C, "s", 3), "/learn/function-generator/op-amp/#U7");
        if (fg.wave === "square") li("Vpp ของสามเหลี่ยม = V_p T/(2RC)", fmt((Vp * (1 / f)) / (2 * (d.R + Rs) * d.C), "Vpp", 3), "/learn/function-generator/op-amp/#U8");
        li("ไม่ขยาย DC เกิน R_p/R", (d.Rp / d.R).toFixed(1) + " เท่า");
        break;
      }
      case "diff": {
        li("v_o = −R_f C dv_i/dt · R_fC", fmt(d.Rf * d.C, "s", 3), "/learn/function-generator/op-amp/#U9");
        if (fg.wave === "ramp" && Math.abs(fg.sym - 50) < 1) li("สามเหลี่ยม → สี่เหลี่ยมสูง ±R_f C·4V_p f", fmt(d.Rf * d.C * 4 * Vp * f, "V", 3));
        li("จำกัดเกนความถี่สูงที่ f = 1/(2πR₁C)", fmt(1 / (TAU * (d.R1 + Rs) * d.C), "Hz", 3));
        break;
      }
      case "comp": li("เอาต์พุต = +V_sat เมื่อ v_i > V_ref", "±" + fmt(swing, "V", 3), "/learn/function-generator/op-amp/#U10"); break;
      case "schmitt": {
        var b2 = d.R2 / (d.R1 + d.R2);
        li("V_TH = +V_sat R₂/(R₁+R₂)", fmt(swing * b2, "V", 4), "/learn/function-generator/op-amp/#U11");
        li("V_TL = −V_sat R₂/(R₁+R₂)", fmt(-swing * b2, "V", 4));
        li("ฮิสเทอรีซิส", fmt(2 * swing * b2, "V", 4));
        break;
      }
      case "cal": li("สัญญาณสอบเทียบ", "1 kHz · 3 Vpp"); break;
    }
    return out.join("");
  }

  // ======================================================================= circuit board panel
  var FIELDS = {
    direct: [["term", "check", "ต่อเทอร์มิเนเตอร์ 50 Ω"]],
    cal: [],
    rc: [["out", "seg", "เอาต์พุตคร่อม", [["C", "C (low-pass)"], ["R", "R (high-pass)"]]], ["R", "num", "R", "Ω"], ["C", "num", "C", "F"]],
    rl: [["out", "seg", "เอาต์พุตคร่อม", [["R", "R (low-pass)"], ["L", "L (high-pass)"]]], ["R", "num", "R", "Ω"], ["L", "num", "L", "H"]],
    rlc: [["out", "seg", "เอาต์พุตคร่อม", [["R", "R (band-pass)"], ["C", "C (low-pass)"], ["L", "L (high-pass)"], ["LC", "L+C (notch)"]]], ["R", "num", "R", "Ω"], ["L", "num", "L", "H"], ["C", "num", "C", "F"]],
    hwr: [["RL", "num", "R_L", "Ω"], ["Cf", "num", "C กรอง (0 = ไม่มี)", "F"], ["Vf", "num", "V_f ไดโอด", "V"]],
    fwr: [["RL", "num", "R_L", "Ω"], ["Cf", "num", "C กรอง (0 = ไม่มี)", "F"], ["Vf", "num", "V_f ไดโอด", "V"]],
    clip: [["clipMode", "seg", "ไดโอด", [["both", "สองตัว (±)"], ["pos", "ตัวเดียว (+)"]]], ["R", "num", "R อนุกรม", "Ω"], ["Vf", "num", "V_f", "V"]],
    clamp: [["Cf", "num", "C", "F"], ["RL", "num", "R_L", "Ω"], ["Vf", "num", "V_f", "V"]],
    inv: [["op", "op"], ["Ri", "num", "R_i", "Ω"], ["Rf", "num", "R_f", "Ω"], ["Vcc", "num", "แหล่งจ่าย ±V_CC", "V"]],
    noninv: [["op", "op"], ["Ri", "num", "R_i (ลงกราวด์)", "Ω"], ["Rf", "num", "R_f (0 = ตามแรงดัน)", "Ω"], ["Vcc", "num", "±V_CC", "V"]],
    integ: [["op", "op"], ["R", "num", "R", "Ω"], ["C", "num", "C", "F"], ["Rp", "num", "R_p ขนาน C", "Ω"], ["Vcc", "num", "±V_CC", "V"]],
    diff: [["op", "op"], ["R1", "num", "R₁ อนุกรม C", "Ω"], ["C", "num", "C", "F"], ["Rf", "num", "R_f", "Ω"], ["Vcc", "num", "±V_CC", "V"]],
    comp: [["op", "op"], ["Vref", "num", "V_ref", "V"], ["Vcc", "num", "±V_CC", "V"]],
    schmitt: [["op", "op"], ["R1", "num", "R₁ (ป้อนกลับ)", "Ω"], ["R2", "num", "R₂ (ลงกราวด์)", "Ω"], ["Vcc", "num", "±V_CC", "V"]]
  };
  function DUTPanel(lab) {
    this.lab = lab; var self = this, d = lab.st.dut;
    var root = (this.root = el("section", "inst dut-inst"));
    root.setAttribute("aria-label", "บอร์ดทดลอง วงจรระหว่างเครื่องกำเนิดกับสโคป");
    var id = "dut" + ++uid;
    root.innerHTML = '<header class="inst-head"><b>บอร์ดทดลอง</b><span class="mono">CH1 = ขาเข้า · CH2 = ขาออก</span></header>' +
      '<label class="dut-l" for="' + id + '">วงจรที่ต่อ</label><select id="' + id + '" class="pre dut-sel"></select>' +
      '<div class="dut-sch"></div><div class="dut-f"></div><ul class="dut-th"></ul>';
    var sel = root.querySelector("select"), groups = [["พื้นฐาน", ["direct", "cal"]], ["RC · RL · RLC", ["rc", "rl", "rlc"]], ["ไดโอด", ["hwr", "fwr", "clip", "clamp"]], ["ออปแอมป์", ["inv", "noninv", "integ", "diff", "comp", "schmitt"]]];
    groups.forEach(function (g) { var og = el("optgroup"); og.label = g[0]; g[1].forEach(function (k) { var o = el("option", null, esc(FGS.DUTS[k].th)); o.value = k; og.appendChild(o); }); sel.appendChild(og); });
    sel.addEventListener("change", function () {
      d.type = sel.value;
      if (d.type === "rl" && d.out !== "R" && d.out !== "L") d.out = "R";
      if (d.type === "rc" && d.out !== "R" && d.out !== "C") d.out = "C";
      if (d.type === "rlc" && ["R", "C", "L", "LC"].indexOf(d.out) < 0) d.out = "R";
      self.lab.changed("dut"); self.build();
    });
    this.sel = sel;
    this.build();
  }
  DUTPanel.prototype.build = function () {
    var d = this.lab.st.dut, self = this, box = this.root.querySelector(".dut-f");
    this.sel.value = d.type; box.innerHTML = "";
    (FIELDS[d.type] || []).forEach(function (f) {
      var k = f[0], row = el("div", "dut-row");
      if (f[1] === "check") {
        var cid = "dc" + ++uid; row.innerHTML = '<label class="dut-ck" for="' + cid + '"><input type="checkbox" id="' + cid + '"> ' + f[2] + "</label>";
        var cb = row.querySelector("input"); cb.checked = !!d[k]; cb.addEventListener("change", function () { d[k] = cb.checked; self.lab.changed("dut"); self.refresh(); });
      } else if (f[1] === "seg") {
        row.appendChild(el("span", "dut-l", f[2])); row.appendChild(seg(f[3], d[k], function (v) { d[k] = v; self.lab.changed("dut"); self.refresh(); }, null, f[2]));
      } else if (f[1] === "op") {
        row.appendChild(el("span", "dut-l", "ออปแอมป์"));
        row.appendChild(seg(Object.keys(FGS.OPAMPS).map(function (o) { return [o, FGS.OPAMPS[o].th]; }), d.op, function (v) { d.op = v; self.lab.changed("dut"); self.refresh(); }, null, "รุ่นออปแอมป์"));
        var o = FGS.OPAMPS[d.op]; row.appendChild(el("p", "hint", "GBW " + fmt(o.gbw, "Hz", 3) + " · SR " + fmt(o.sr / 1e6, "V/µs", 3).replace(" V/µs", " V/µs") + " · แกว่งได้ถึง ±(V_CC − " + o.drop + " V)"));
      } else {
        var nid = "dn" + ++uid;
        row.innerHTML = '<label class="dut-l" for="' + nid + '">' + f[2] + '</label><span class="dut-num"><input id="' + nid + '" type="text" inputmode="decimal" spellcheck="false"><span class="mono">' + f[3] + "</span></span>";
        var inp = row.querySelector("input"); inp.value = fmt(d[k], "", 4).replace(/ /g, "");
        inp.addEventListener("change", function () {
          var v = U.parseSI(inp.value), ok = isFinite(v) && (v > 0 || (v === 0 && (k === "Cf" || k === "Rf" || k === "Vref" || k === "Vf")) || (k === "Vref"));
          if (ok) {
            if (k === "Vcc") v = clamp(v, 3, 18); if (k === "Vf") v = clamp(v, 0, 5); if (k === "Vref") v = clamp(v, -15, 15);
            if (k === "Cf" && v > 0) v = clamp(v, 1e-12, 0.1); if (k === "R" || k === "Ri" || k === "R1" || k === "R2" || k === "RL" || k === "Rp") v = clamp(v, 1, 1e8);
            if (k === "C") v = clamp(v, 1e-12, 0.01); if (k === "L") v = clamp(v, 1e-9, 100);
            d[k] = v; self.lab.changed("dut");
          }
          inp.value = fmt(d[k], "", 4).replace(/ /g, "");
          self.refresh();
        });
      }
      box.appendChild(row);
    });
    this.refresh();
  };
  DUTPanel.prototype.refresh = function () {
    var st = this.lab.st;
    this.root.querySelector(".dut-sch").innerHTML = schematic(st.dut);
    this.root.querySelector(".dut-th").innerHTML = theory(st);
    if (st.dut.type === "noninv" || st.dut.type === "inv") { /* rebuild op hint */ }
  };

  FGS.ui = { knob: knob, seg: seg, el: el, esc: esc, FGPanel: FGPanel, DUTPanel: DUTPanel, schematic: schematic, theory: theory, digitHtml: digitHtml, paramsFor: paramsFor };
})();
