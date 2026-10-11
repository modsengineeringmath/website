/* FG / oscilloscope lab: the full bench (<div class="fgs-bench">), small embedded scopes (<div class="fgs-mini">),
   presets, shareable links and the refresh loop. Needs fgs-core.js, fgs-scope.js and fgs-ui.js. */
(function () {
  "use strict";
  var FGS = window.FGS, U = FGS.util, fmt = U.fmtSI, clamp = U.clamp, UI = FGS.ui, el = UI.el, esc = UI.esc, seg = UI.seg, knob = UI.knob;
  var LAB_URL = "/learn/function-generator/simulator/";

  // ======================================================================= presets (used by worksheets and lesson pages)
  var P = {
    "sine-basic": { t: "ไซน์ 1 kHz 2 Vpp ต่อตรง", fg: { wave: "sine", freq: 1000, amp: 2 }, auto: 1 },
    "square-duty": { t: "สี่เหลี่ยม 0–4 V ดิวตี้ 25 %", fg: { wave: "square", freq: 1000, amp: 4, offset: 2, duty: 25 }, auto: 1 },
    "offset-dc": { t: "ไซน์มีออฟเซต DC", fg: { wave: "sine", freq: 500, amp: 2, offset: 1 }, auto: 1 },
    "ramp-sym": { t: "แรมป์และสามเหลี่ยม", fg: { wave: "ramp", freq: 1000, amp: 4, sym: 100 }, auto: 1 },
    "load-mismatch": { t: "ตั้ง Load 50 Ω แต่ต่อสโคปตรง", fg: { wave: "sine", freq: 1000, amp: 2, load: "50" }, auto: 1, sc: { ch: [{ vdiv: 0.5 }, { vdiv: 0.5 }] } },
    "load-term": { t: "ตั้ง High-Z แต่ต่อโหลด 50 Ω", fg: { wave: "sine", freq: 1000, amp: 2, load: "highz" }, dut: { term: true }, auto: 1, sc: { ch: [{ vdiv: 0.5 }, { vdiv: 0.5 }] } },
    "trigger-lost": { t: "ภาพวิ่ง: ระดับทริกเกอร์เกินสัญญาณ", fg: { wave: "sine", freq: 1000, amp: 2 }, auto: 1, after: { trig: { level: 2.5, mode: "auto" } } },
    "trigger-normal": { t: "ทริกเกอร์ Normal + ขอบลง", fg: { wave: "square", freq: 2000, amp: 3, duty: 30 }, auto: 1, after: { trig: { slope: "fall", mode: "normal" } } },
    "probe-comp": { t: "ปรับชดเชยโพรบ (probe compensation)", dut: { type: "cal" }, sc: { probes: [{ x: 10, comp: 0.6 }, { x: 10, comp: -0.6 }], ch: [{ vdiv: 1, pos: -1.5 }, { vdiv: 1, pos: -1.5 }], tdiv: 2e-4, trig: { src: 0, level: 1.5 } } },
    "probe-1x": { t: "โพรบ 1× จำกัดแบนด์วิดท์", fg: { wave: "square", freq: 1e6, amp: 2 }, sc: { probes: [{ x: 10 }, { x: 1 }], ch: [{ vdiv: 0.5, probe: 10 }, { vdiv: 0.5, probe: 1 }], tdiv: 50e-9, trig: { level: 0 } } },
    "rise-time": { t: "วัดเวลาขาขึ้นของคลื่นสี่เหลี่ยม", fg: { wave: "square", freq: 1e6, amp: 2 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 5e-9, trig: { level: 0 } } },
    "aliasing": { t: "อเลียสซิง: 1 MHz ที่ 5 ms/div", fg: { wave: "sine", freq: 1000020, amp: 2 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 5e-3, trig: { level: 0 } } },
    "ac-tilt": { t: "คัปปลิง AC ทำให้ยอดเอียง", fg: { wave: "square", freq: 20, amp: 2, offset: 1 }, sc: { probes: [{ x: 1 }, { x: 1 }], ch: [{ vdiv: 1, probe: 1, pos: -1, coup: "DC" }, { vdiv: 1, probe: 1, pos: 0, coup: "AC" }], tdiv: 0.01, trig: { level: 1 } } },
    "rc-square": { t: "RC ต่ำผ่าน + คลื่นสี่เหลี่ยม", fg: { wave: "square", freq: 1000, amp: 2 }, dut: { type: "rc", out: "C", R: 10000, C: 10e-9 }, auto: 1 },
    "rc-tau": { t: "หา τ จากกราฟ (T ≫ τ)", fg: { wave: "square", freq: 500, amp: 4, offset: 2 }, dut: { type: "rc", out: "C", R: 10000, C: 10e-9 }, sc: { ch: [{ vdiv: 1, pos: -2 }, { vdiv: 1, pos: -2 }], tdiv: 50e-6, hpos: 200e-6, trig: { level: 2 } } },
    "rc-hp-square": { t: "RC สูงผ่าน + คลื่นสี่เหลี่ยม", fg: { wave: "square", freq: 1000, amp: 2 }, dut: { type: "rc", out: "R", R: 10000, C: 10e-9 }, auto: 1 },
    "rc-sine-fc": { t: "RC ที่ความถี่ตัด", fg: { wave: "sine", freq: 1583, amp: 2 }, dut: { type: "rc", out: "C", R: 10000, C: 10e-9 }, auto: 1 },
    "lissajous": { t: "ลิสซาจู: วัดเฟสด้วยโหมด XY", fg: { wave: "sine", freq: 1583, amp: 4 }, dut: { type: "rc", out: "C", R: 10000, C: 10e-9 }, auto: 1, after: { xy: true, ch: [{ vdiv: 0.5, pos: 0 }, { vdiv: 0.5, pos: 0 }] } },
    "rlc-ring": { t: "RLC: คลื่นสี่เหลี่ยมทำให้เกิดการแกว่ง", fg: { wave: "square", freq: 300, amp: 2 }, dut: { type: "rlc", out: "C", R: 10, L: 10e-3, C: 100e-9 }, sc: { ch: [{ vdiv: 0.5 }, { vdiv: 0.5 }], tdiv: 2e-4, hpos: 6e-4, trig: { level: 0 } } },
    "rlc-res": { t: "RLC แบนด์พาสที่เรโซแนนซ์", fg: { wave: "sine", freq: 5033, amp: 2 }, dut: { type: "rlc", out: "R", R: 100, L: 10e-3, C: 100e-9 }, auto: 1 },
    "rlc-sweep": { t: "กวาดความถี่หาเรโซแนนซ์", fg: { wave: "sine", amp: 2, mod: "sweep", swF1: 1000, swF2: 10000, swTime: 0.1, swType: "lin" }, dut: { type: "rlc", out: "R", R: 100, L: 10e-3, C: 100e-9 }, sc: { ch: [{ vdiv: 1 }, { vdiv: 0.5 }], tdiv: 0.01, hpos: 0.05, trig: { src: 2 } } },
    "hwr": { t: "เรกติไฟเออร์ครึ่งคลื่น + C กรอง", fg: { wave: "sine", freq: 1000, amp: 10 }, dut: { type: "hwr", RL: 10000, Cf: 1e-6 }, auto: 1, after: { ch: [{}, { vdiv: 0.5, pos: -7.5 }] } },
    "hwr-noc": { t: "เรกติไฟเออร์ครึ่งคลื่น ไม่มี C", fg: { wave: "sine", freq: 1000, amp: 10 }, dut: { type: "hwr", RL: 10000, Cf: 0 }, auto: 1 },
    "fwr": { t: "เรกติไฟเออร์บริดจ์", fg: { wave: "sine", freq: 1000, amp: 16 }, dut: { type: "fwr", RL: 10000, Cf: 1e-6 }, auto: 1, after: { ch: [{}, { vdiv: 1, pos: -6 }] } },
    "clip": { t: "วงจรตัดยอดด้วยไดโอด", fg: { wave: "sine", freq: 1000, amp: 6 }, dut: { type: "clip", R: 1000 }, auto: 1, after: { ch: [{ vdiv: 1, pos: 0 }, { vdiv: 1, pos: 0 }] } },
    "clamp": { t: "วงจรยกระดับ (clamper)", fg: { wave: "sine", freq: 1000, amp: 6 }, dut: { type: "clamp", Cf: 1e-6, RL: 100000 }, auto: 1, after: { ch: [{ vdiv: 2, pos: 0 }, { vdiv: 2, pos: -1 }] } },
    "opamp-inv": { t: "ขยายกลับเฟส เกน −4.7", fg: { wave: "sine", freq: 1000, amp: 1 }, dut: { type: "inv", Ri: 10000, Rf: 47000, op: "tl081" }, auto: 1 },
    "opamp-clip": { t: "ขยายจนอิ่มตัว (clipping)", fg: { wave: "sine", freq: 1000, amp: 8 }, dut: { type: "inv", Ri: 10000, Rf: 47000, op: "tl081" }, auto: 1 },
    "opamp-slew": { t: "LM741 สลูว์เรตจำกัด", fg: { wave: "sine", freq: 20000, amp: 2 }, dut: { type: "noninv", Ri: 10000, Rf: 90000, op: "lm741" }, auto: 1, after: { ch: [{ vdiv: 1 }, { vdiv: 5, pos: 0 }] } },
    "opamp-gbw": { t: "เกน 100 ที่ 50 kHz: แบนด์วิดท์ไม่พอ", fg: { wave: "sine", freq: 50000, amp: 0.05 }, dut: { type: "noninv", Ri: 1000, Rf: 99000, op: "lm741" }, auto: 1 },
    "integ": { t: "อินทิเกรเตอร์: สี่เหลี่ยม → สามเหลี่ยม", fg: { wave: "square", freq: 1000, amp: 2 }, dut: { type: "integ", R: 10000, C: 10e-9, Rp: 1e6, op: "tl081" }, auto: 1 },
    "diff": { t: "ดิฟเฟอเรนชิเอเตอร์: สามเหลี่ยม → สี่เหลี่ยม", fg: { wave: "ramp", sym: 50, freq: 1000, amp: 2 }, dut: { type: "diff", R1: 100, C: 10e-9, Rf: 10000, op: "tl081" }, auto: 1 },
    "comp-noise": { t: "คอมพาเรเตอร์กับสัญญาณมีนอยส์", fg: { wave: "sine", freq: 100, amp: 2, noise: 20 }, dut: { type: "comp", Vref: 0, op: "tl081" }, sc: { ch: [{ vdiv: 1 }, { vdiv: 10 }], tdiv: 2e-3, trig: { src: 0, level: 0 } } },
    "schmitt": { t: "ชมิตต์ทริกเกอร์กำจัดการสั่น", fg: { wave: "sine", freq: 100, amp: 4, noise: 20 }, dut: { type: "schmitt", R1: 10000, R2: 1000, op: "tl081" }, sc: { ch: [{ vdiv: 1 }, { vdiv: 10 }], tdiv: 2e-3, trig: { src: 1, level: 0 } } },
    "am": { t: "AM: วัดดัชนีมอดูเลชัน", fg: { wave: "sine", freq: 5000, amp: 2, mod: "am", amDepth: 50, amF: 200 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 1e-3, trig: { src: 2 } } },
    "fm": { t: "FM", fg: { wave: "sine", freq: 5000, amp: 2, mod: "fm", fmDev: 3000, fmF: 200 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 5e-4, trig: { src: 2 } } },
    "sweep": { t: "กวาดความถี่ (sweep)", fg: { wave: "sine", amp: 2, mod: "sweep", swF1: 100, swF2: 2000, swTime: 0.01, swType: "lin" }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 1e-3, hpos: 5e-3, trig: { src: 2 } } },
    "burst": { t: "เบิสต์ 3 รอบ", fg: { wave: "sine", freq: 10000, amp: 2, mod: "burst", bN: 3, bPer: 1e-3 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 2e-4, trig: { src: 2 } } },
    "fft-square": { t: "FFT ของคลื่นสี่เหลี่ยม", fg: { wave: "square", freq: 1000, amp: 2 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 1e-3, trig: { level: 0 }, math: "fft" } },
    "pwm-avg": { t: "PWM + RC = แรงดันเฉลี่ย", fg: { wave: "square", freq: 1000, amp: 5, offset: 2.5, duty: 30 }, dut: { type: "rc", out: "C", R: 10000, C: 1e-6 }, sc: { ch: [{ vdiv: 1, pos: -3 }, { vdiv: 1, pos: -3 }], tdiv: 5e-4, trig: { level: 2.5 } } },
    "noise-avg": { t: "เฉลี่ยสัญญาณเพื่อลดนอยส์", fg: { wave: "sine", freq: 1000, amp: 0.05, noise: 20 }, sc: { ch: [{ vdiv: 0.01 }, { on: false }], tdiv: 2e-4, trig: { src: 2 }, acq: "avg" } },
    "rc-impulse": { t: "ผลตอบสนองอิมพัลส์: พัลส์แคบเข้า RC", fg: { wave: "pulse", freq: 100, amp: 5, offset: 2.5, duty: 0.5 }, dut: { type: "rc", out: "C", R: 10000, C: 100e-9 }, sc: { ch: [{ vdiv: 2, pos: -2 }, { vdiv: 0.05, pos: -3 }], tdiv: 5e-4, hpos: 2e-3, trig: { src: 0, level: 2.5 } } },
    "rl-square": { t: "RL + คลื่นสี่เหลี่ยม", fg: { wave: "square", freq: 10000, amp: 2 }, dut: { type: "rl", out: "R", R: 1000, L: 10e-3 }, auto: 1 },
    "us-burst": { t: "เบิสต์ 40 kHz 8 รอบ (อัลตราโซนิก)", fg: { wave: "sine", freq: 40000, amp: 2, mod: "burst", bN: 8, bPer: 2e-3 }, sc: { ch: [{ vdiv: 0.5 }, { on: false }], tdiv: 5e-5, hpos: 2e-4, trig: { src: 2 } } },
    "amp-tilt": { t: "ทดสอบเครื่องขยายด้วยคลื่นสี่เหลี่ยม: ยอดเอียง", fg: { wave: "square", freq: 100, amp: 2 }, dut: { type: "rc", out: "R", R: 100000, C: 1e-6 }, auto: 1 },
    "opamp-noninv": { t: "ขยายไม่กลับเฟส เกน 2", fg: { wave: "sine", freq: 1000, amp: 1 }, dut: { type: "noninv", Ri: 10000, Rf: 10000, op: "tl081" }, auto: 1 }
  };
  FGS.presets = P;

  function deepMerge(dst, src) {
    if (!src) return dst;
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (Array.isArray(v) && Array.isArray(dst[k])) v.forEach(function (x, i) { if (x && typeof x === "object") deepMerge(dst[k][i], x); else dst[k][i] = x; });
      else if (v && typeof v === "object" && dst[k] && typeof dst[k] === "object") deepMerge(dst[k], v);
      else dst[k] = v;
    });
    return dst;
  }
  function diff(a, b) { // keys of a that differ from defaults b
    var o = Array.isArray(a) ? [] : {}, any = false;
    Object.keys(a).forEach(function (k) {
      if (k[0] === "_") return;
      if (a[k] && typeof a[k] === "object") { var d = diff(a[k], b[k]); if (d) { o[k] = d; any = true; } else if (Array.isArray(a)) o[k] = {}; }
      else if (a[k] !== b[k]) { o[k] = a[k]; any = true; }
    });
    return any ? o : null;
  }
  function freshState() { return { fg: FGS.FG.defaults(), dut: FGS.defaultsDUT(), scope: FGS.scope.defaults() }; }

  // ======================================================================= Lab: state + engine + scope + screen
  function Lab(canvas) {
    this.st = freshState();
    this.scope = new FGS.Scope(this.st.scope);
    this.screen = new FGS.scope.Screen(canvas);
    this.eng = null; this.engDirty = true; this.dirty = true; this.res = null; this.lastAcq = 0; this.listeners = [];
    this.visible = true;
  }
  Lab.prototype.changed = function (part) {
    if (part === "fg" || part === "dut" || part === "all") this.engDirty = true;
    this.dirty = true; this._key = null;
    this.listeners.forEach(function (f) { f(part); });
  };
  Lab.prototype.engine = function () {
    if (!this.eng || this.engDirty) { this.eng = new FGS.Engine(this.st.fg, this.st.dut); this.engDirty = false; }
    return this.eng;
  };
  Lab.prototype.key = function () { if (!this._key) { var s = this.st; this._key = JSON.stringify([s.fg, s.dut, s.scope.ch, s.scope.probes, s.scope.tdiv, s.scope.hpos, s.scope.trig]); } return this._key; };
  Lab.prototype.load = function (name, raw) {
    var pr = raw || P[name]; if (!pr) return;
    var fresh = freshState();
    deepMerge(fresh.fg, pr.fg); deepMerge(fresh.dut, pr.dut); deepMerge(fresh.scope, pr.sc);
    if (pr.state) { deepMerge(fresh.fg, pr.state.fg); deepMerge(fresh.dut, pr.state.dut); deepMerge(fresh.scope, pr.state.scope); }
    // copy into the existing objects (panels keep references)
    var st = this.st;
    Object.keys(fresh.fg).forEach(function (k) { st.fg[k] = fresh.fg[k]; });
    Object.keys(fresh.dut).forEach(function (k) { st.dut[k] = fresh.dut[k]; });
    Object.keys(fresh.scope).forEach(function (k) { st.scope[k] = fresh.scope[k]; });
    FGS.FG.limit(st.fg);
    this.engDirty = true;
    if (pr.auto) FGS.scope.autoset(this.engine(), st.scope, st.fg);
    if (pr.after) deepMerge(st.scope, pr.after);
    this.scope.avg = null; this.res = null;
    this.changed("all");
  };
  Lab.prototype.share = function () {
    var d = diff(this.st, freshState()) || {};
    var json = JSON.stringify(d), b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.origin + LAB_URL + "#lab=" + b64;
  };
  Lab.prototype.fromHash = function (h) {
    var m = /preset=([\w-]+)/.exec(h);
    if (m && P[m[1]]) { this.load(m[1]); return true; }
    m = /lab=([\w-]+)/.exec(h);
    if (m) {
      try {
        var s = m[1].replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
        this.load(null, { state: JSON.parse(decodeURIComponent(escape(atob(s)))) });
        return true;
      } catch (e) { return false; }
    }
    return false;
  };
  Lab.prototype.tick = function (now) {
    var sc = this.st.scope, win = sc.tdiv * 10, interval = Math.max(85, Math.min(win * 1000, 2000));
    if (sc.run && (this.dirty || now - this.lastAcq >= interval)) {
      var eng = this.engine(), r = this.scope.acquire(eng, this.st.fg, now / 1000 + 1000, this.key());
      this.lastAcq = now;
      if (r.status === "WAIT") { if (this.res) this.res.status = "WAIT"; else this.res = r; }
      else {
        this.res = r;
        if (sc.single || sc.trig.mode === "single") { if (r.status === "T'D") { sc.run = false; sc.single = false; this.onStop && this.onStop(); } else if (this.res.status === "AUTO") this.res.status = "WAIT"; }
      }
      this.dirty = false; this.fresh = true;
      this.info = {};
      this.screen.draw(sc, this.res && this.res.ch ? this.res : null, this.info);
      if (this.afterDraw) this.afterDraw();
      return true;
    }
    if (this.dirty) { this.screen.draw(sc, this.res && this.res.ch ? this.res : null, this.info || {}); if (this.afterDraw) this.afterDraw(); this.dirty = false; }
    return false;
  };

  // ======================================================================= measurement table
  var MEAS = [
    ["vpp", "Vpp", "V"], ["vmax", "Vmax", "V"], ["vmin", "Vmin", "V"], ["vamp", "Vamp (top−base)", "V"], ["avg", "Vavg (เฉลี่ย)", "V"],
    ["rms", "Vrms", "V"], ["acrms", "Vrms (AC)", "V"], ["freq", "ความถี่", "Hz"], ["period", "คาบ", "s"], ["pwidth", "ความกว้าง +", "s"],
    ["duty", "ดิวตี้", "%"], ["rise", "เวลาขาขึ้น 10–90%", "s"], ["fall", "เวลาขาลง 90–10%", "s"]
  ];
  function measHtml(lab, keys) {
    var r = lab.res, sc = lab.st.scope;
    if (!r || !r.ch) return "";
    var ms = [0, 1].map(function (i) { return sc.ch[i].on || sc.xy ? FGS.scope.measure(r.ch[i].v, r.dt) : null; });
    lab.meas = ms;
    var rows = MEAS.filter(function (m) { return !keys || keys.indexOf(m[0]) >= 0; });
    var cell = function (m, i, k) {
      if (!m) return "<td>—</td>";
      var v = m[k[0]], clip = r.ch[i].clip && /vpp|vmax|vmin|vamp|rms|acrms|avg/.test(k[0]);
      if (v == null || !isFinite(v) || (/freq|period|pwidth|duty/.test(k[0]) && !m.period)) return "<td>—</td>";
      var s = k[2] === "%" ? v.toFixed(1) + " %" : fmt(v, k[2], 4);
      return '<td class="' + (clip ? "clip" : "") + '"' + (clip ? ' title="สัญญาณล้นจอ ค่าอาจผิด ลองเพิ่ม V/div"' : "") + ">" + (clip ? "? " : "") + esc(s) + "</td>";
    };
    var on = [0, 1].filter(function (i) { return !!ms[i]; });
    if (!on.length) return "";
    var h = '<table class="meas"><thead><tr><th scope="col">ค่าที่วัด</th>' + on.map(function (i) { return '<th scope="col" class="c' + (i + 1) + '">CH' + (i + 1) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (k) { h += '<tr><th scope="row">' + k[1] + "</th>" + on.map(function (i) { return cell(ms[i], i, k); }).join("") + "</tr>"; });
    if (on.length === 2 && (!keys || keys.indexOf("phase") >= 0)) {
      var ph = ms[0] && ms[1] ? FGS.scope.phase(ms[0], ms[1]) : null;
      h += '<tr class="ph"><th scope="row">เฟส CH2 เทียบ CH1</th><td colspan="2">' + (ph ? esc(ph.deg.toFixed(1) + "°  ·  หน่วง Δt = " + fmt(ph.delay, "s", 4)) : "—") + "</td></tr>";
      if (ms[0] && ms[1] && ms[0].vpp > 0 && !r.ch[0].clip && !r.ch[1].clip) {
        var g = ms[1].vpp / ms[0].vpp;
        h += '<tr class="ph"><th scope="row">อัตราส่วน Vpp₂/Vpp₁</th><td colspan="2">' + g.toFixed(4) + " = " + (20 * Math.log10(g)).toFixed(2) + " dB</td></tr>";
      }
    }
    h += "</tbody></table>";
    return h;
  }
  function cursorHtml(lab) {
    var sc = lab.st.scope, cu = sc.cursor;
    if (cu.mode === "off" || sc.xy) return "";
    if (cu.mode === "time") {
      var t1 = (cu.x1 - 5) * sc.tdiv + sc.hpos, t2 = (cu.x2 - 5) * sc.tdiv + sc.hpos, dt = t2 - t1;
      return '<p class="cur mono">X1 ' + fmt(t1, "s", 4) + " · X2 " + fmt(t2, "s", 4) + " · <b>ΔX " + fmt(dt, "s", 4) + "</b> · 1/ΔX " + (Math.abs(dt) > 0 ? fmt(1 / Math.abs(dt), "Hz", 4) : "—") + "</p>";
    }
    var c = sc.ch[cu.src], v1 = (cu.y1 - c.pos) * c.vdiv, v2 = (cu.y2 - c.pos) * c.vdiv;
    return '<p class="cur mono">CH' + (cu.src + 1) + " · Y1 " + fmt(v1, "V", 4) + " · Y2 " + fmt(v2, "V", 4) + " · <b>ΔY " + fmt(v1 - v2, "V", 4) + "</b></p>";
  }
  function fftHtml(lab) {
    var F = lab.info && lab.info.fft;
    if (lab.st.scope.math !== "fft" || !F) return "";
    return '<p class="cur mono">ยอดสเปกตรัม: ' + F.peaks.map(function (p) { return fmt(p.f, "Hz", 4) + " " + p.db.toFixed(1) + " dBV"; }).join(" · ") + "</p>";
  }

  // ======================================================================= scope front panel (bench)
  function vdivKnob(lab, i) {
    var c = lab.st.scope.ch[i];
    return knob({ label: "V/div", color: FGS.scope.COLORS[i], get: function () { return fmt(c.vdiv, "V", 3); },
      step: function (d, fine) {
        if (fine) c.vdiv = clamp(c.vdiv * (1 + 0.05 * d), 1e-3 * c.probe, 10 * c.probe);
        else { var j = U.idx125(c.vdiv) + d; c.vdiv = clamp(U.seq125(j), 1e-3 * c.probe, 10 * c.probe); }
        lab.changed("scope");
      } });
  }
  function posKnob(lab, i) {
    var c = lab.st.scope.ch[i];
    return knob({ label: "Position", color: FGS.scope.COLORS[i], get: function () { return Math.abs(c.pos) < 0.005 ? "0.00 div" : (c.pos > 0 ? "+" : "−") + Math.abs(c.pos).toFixed(2) + " div"; },
      step: function (d, fine) { c.pos = clamp(Math.round((c.pos + d * (fine ? 0.02 : 0.1)) * 100) / 100, -8, 8); lab.changed("scope"); },
      reset: function () { c.pos = 0; lab.changed("scope"); } });
  }
  function ScopePanel(lab, mount) {
    var sc = lab.st.scope, self = this;
    this.lab = lab;
    var root = (this.root = mount);
    root.classList.add("inst", "scope-inst");
    root.setAttribute("aria-label", "ออสซิลโลสโคป");
    var head = el("header", "inst-head", "<b>OSCILLOSCOPE</b><span class=\"mono\">DSO-1102 · 100 MHz · 1 GSa/s · 10 kpts</span>");
    root.insertBefore(head, root.firstChild);
    var bar = el("div", "sc-run");
    var bRun = el("button", "sc-btn run", "RUN/STOP"), bSingle = el("button", "sc-btn", "SINGLE"), bAuto = el("button", "sc-btn auto", "AUTO"), bClr = el("button", "sc-btn", "CLEAR");
    [bRun, bSingle, bAuto, bClr].forEach(function (b) { b.type = "button"; bar.appendChild(b); });
    bRun.addEventListener("click", function () { sc.run = !sc.run; sc.single = false; lab.changed("scope"); self.sync(); });
    bSingle.addEventListener("click", function () { sc.run = true; sc.single = true; lab.res = null; lab.changed("scope"); self.sync(); });
    bAuto.addEventListener("click", function () { FGS.scope.autoset(lab.engine(), sc, lab.st.fg); sc.xy = false; sc.math = sc.math === "fft" ? "fft" : "off"; lab.scope.avg = null; lab.changed("scope"); self.rebuild(); });
    bClr.addEventListener("click", function () { lab.res = null; lab.scope.avg = null; lab.screen.lctx.clearRect(0, 0, 4000, 4000); lab.changed("scope"); });
    this.bRun = bRun;
    var acq = seg([["normal", "Normal"], ["avg", "Average 16"]], sc.acq, function (v) { sc.acq = v; lab.scope.avg = null; lab.changed("scope"); }, null, "โหมดเก็บข้อมูล");
    var per = seg([["0", "ปกติ"], ["1", "ค้างภาพ"]], sc.persist ? "1" : "0", function (v) { sc.persist = v === "1"; lab.changed("scope"); }, null, "Persistence");
    var g1 = el("span", "sc-inl"); g1.appendChild(el("span", "mono", "ACQ")); g1.appendChild(acq);
    var g2 = el("span", "sc-inl"); g2.appendChild(el("span", "mono", "DISPLAY")); g2.appendChild(per);
    bar.appendChild(g1); bar.appendChild(g2);
    root.appendChild(bar);
    this.pan = el("div", "sc-panels"); root.appendChild(this.pan);
    this.meas = el("div", "sc-meas"); this.meas.setAttribute("aria-live", "off"); root.appendChild(this.meas);
    this.rebuild();
  }
  ScopePanel.prototype.sync = function () {
    var sc = this.lab.st.scope;
    this.bRun.textContent = sc.run ? "RUN ▶" : "STOP ■"; this.bRun.classList.toggle("stopped", !sc.run);
  };
  ScopePanel.prototype.rebuild = function () {
    var lab = this.lab, sc = lab.st.scope, pan = this.pan, self = this;
    pan.innerHTML = ""; this.knobs = [];
    var box = function (title, cls) { var b = el("div", "sc-p " + (cls || "")); b.appendChild(el("h4", "mono", title)); pan.appendChild(b); return b; };
    var add = function (b, node) { b.appendChild(node); if (node.update) self.knobs.push(node); return node; };
    [0, 1].forEach(function (i) {
      var c = sc.ch[i], b = box("CH" + (i + 1), "sc-ch c" + (i + 1));
      var on = el("button", "sc-btn chbtn", "CH" + (i + 1) + (c.on ? " ON" : " OFF")); on.type = "button"; on.setAttribute("aria-pressed", c.on ? "true" : "false");
      on.addEventListener("click", function () { c.on = !c.on; lab.changed("scope"); self.rebuild(); });
      b.appendChild(on);
      var kr = el("div", "kn-pair"); add(kr, vdivKnob(lab, i)); add(kr, posKnob(lab, i)); b.appendChild(kr);
      b.appendChild(seg([["DC", "DC"], ["AC", "AC"], ["GND", "GND"]], c.coup, function (v) { c.coup = v; lab.changed("scope"); }, null, "คัปปลิง CH" + (i + 1)));
      var row = el("div", "sc-row");
      row.appendChild(el("span", "mono", "Probe"));
      row.appendChild(seg([["1", "1×"], ["10", "10×"]], String(c.probe), function (v) { var k = +v / c.probe; c.probe = +v; c.vdiv *= k; lab.changed("scope"); self.rebuild(); }, null, "ตั้งค่าอัตราส่วนโพรบในเมนูสโคป CH" + (i + 1)));
      b.appendChild(row);
      var row2 = el("div", "sc-row");
      row2.appendChild(seg([["0", "BW เต็ม"], ["1", "BW 20M"]], c.bwl ? "1" : "0", function (v) { c.bwl = v === "1"; lab.changed("scope"); }, null, "จำกัดแบนด์วิดท์"));
      row2.appendChild(seg([["0", "ปกติ"], ["1", "Invert"]], c.inv ? "1" : "0", function (v) { c.inv = v === "1"; lab.changed("scope"); }, null, "กลับขั้ว"));
      b.appendChild(row2);
    });
    var h = box("HORIZONTAL", "sc-h");
    var hk = el("div", "kn-pair");
    add(hk, knob({ label: "Time/div", get: function () { return fmt(sc.tdiv, "s", 3); }, step: function (d) { sc.tdiv = clamp(U.seq125(U.idx125(sc.tdiv) + d), 5e-9, 50); lab.changed("scope"); } }));
    add(hk, knob({ label: "Position", get: function () { return fmt(sc.hpos, "s", 3); }, step: function (d, fine) { sc.hpos = Math.round((sc.hpos + d * sc.tdiv * (fine ? 0.04 : 0.2)) / (sc.tdiv * 0.01)) * sc.tdiv * 0.01; lab.changed("scope"); }, reset: function () { sc.hpos = 0; lab.changed("scope"); } }));
    h.appendChild(hk);
    h.appendChild(seg([["yt", "Y–T"], ["xy", "X–Y"]], sc.xy ? "xy" : "yt", function (v) { sc.xy = v === "xy"; lab.changed("scope"); }, null, "โหมดแสดงผล"));
    var t = box("TRIGGER", "sc-t");
    var tk = el("div", "kn-pair");
    add(tk, knob({ label: "Level", color: "#ff8a3d", get: function () { return sc.trig.src === 2 ? "EXT (TTL)" : fmt(sc.trig.level, "V", 3); },
      step: function (d, fine) { if (sc.trig.src === 2) return; var c = sc.ch[sc.trig.src]; sc.trig.level = Math.round((sc.trig.level + d * c.vdiv * (fine ? 0.04 : 0.2)) / (c.vdiv * 0.04)) * c.vdiv * 0.04; sc._showLevel = Date.now(); lab.changed("scope"); },
      reset: function () { self.half(); } }));
    var b50 = el("button", "sc-btn", "50%"); b50.type = "button"; b50.title = "ตั้งระดับทริกเกอร์ไว้กึ่งกลางสัญญาณ";
    b50.addEventListener("click", function () { self.half(); });
    tk.appendChild(b50);
    t.appendChild(tk);
    t.appendChild(seg([["0", "CH1"], ["1", "CH2"], ["2", "EXT"]], String(sc.trig.src), function (v) { sc.trig.src = +v; lab.changed("scope"); self.rebuild(); }, null, "แหล่งทริกเกอร์"));
    t.appendChild(seg([["rise", "ขอบขึ้น ↑"], ["fall", "ขอบลง ↓"]], sc.trig.slope, function (v) { sc.trig.slope = v; lab.changed("scope"); }, null, "ขอบทริกเกอร์"));
    t.appendChild(seg([["auto", "Auto"], ["normal", "Normal"], ["single", "Single"]], sc.trig.mode, function (v) { sc.trig.mode = v; sc.run = true; lab.changed("scope"); self.sync(); }, null, "โหมดทริกเกอร์"));
    var m = box("MATH · CURSOR", "sc-m");
    m.appendChild(seg([["off", "ปิด"], ["add", "1+2"], ["sub", "1−2"], ["mul", "1×2"], ["fft", "FFT"]], sc.math, function (v) { sc.math = v; lab.changed("scope"); self.rebuild(); }, null, "Math"));
    if (sc.math === "fft") {
      var fr = el("div", "sc-row"); fr.appendChild(el("span", "mono", "FFT ของ"));
      fr.appendChild(seg([["0", "CH1"], ["1", "CH2"]], String(sc.fftSrc), function (v) { sc.fftSrc = +v; lab.changed("scope"); }, null, "แหล่ง FFT"));
      fr.appendChild(seg([["10", "10 dB"], ["20", "20 dB"]], String(sc.fftDb), function (v) { sc.fftDb = +v; lab.changed("scope"); }, null, "สเกล FFT"));
      m.appendChild(fr);
    }
    m.appendChild(seg([["off", "ไม่มีเคอร์เซอร์"], ["time", "เวลา (X)"], ["volt", "แรงดัน (Y)"]], sc.cursor.mode, function (v) { sc.cursor.mode = v; lab.changed("scope"); self.rebuild(); }, null, "เคอร์เซอร์"));
    if (sc.cursor.mode === "volt") m.appendChild(seg([["0", "อ่านจาก CH1"], ["1", "อ่านจาก CH2"]], String(sc.cursor.src), function (v) { sc.cursor.src = +v; lab.changed("scope"); }, null, "ช่องของเคอร์เซอร์"));
    if (sc.cursor.mode !== "off") m.appendChild(el("p", "hint", "ลากเส้นเคอร์เซอร์บนจอได้โดยตรง"));
    var p = box("PROBE (ตัวโพรบจริง)", "sc-pr");
    [0, 1].forEach(function (i) {
      var pr = sc.probes[i], r = el("div", "sc-row");
      r.appendChild(el("span", "mono c" + (i + 1), "โพรบ " + (i + 1)));
      r.appendChild(seg([["1", "สวิตช์ 1×"], ["10", "สวิตช์ 10×"]], String(pr.x), function (v) { pr.x = +v; lab.changed("scope"); self.rebuild(); }, null, "สวิตช์บนตัวโพรบ " + (i + 1)));
      p.appendChild(r);
      if (pr.x === 10) add(p, knob({ label: "ทริมเมอร์ชดเชย " + (i + 1), color: FGS.scope.COLORS[i], get: function () { return pr.comp === 0 ? "พอดี" : (pr.comp > 0 ? "เกิน +" : "ขาด ") + Math.round(pr.comp * 100) + "%"; }, step: function (d) { pr.comp = clamp(Math.round((pr.comp + d * 0.05) * 100) / 100, -1, 1); lab.changed("scope"); }, reset: function () { pr.comp = 0; lab.changed("scope"); } }));
    });
    var warn = [0, 1].filter(function (i) { return sc.probes[i].x !== sc.ch[i].probe; });
    if (warn.length) p.appendChild(el("p", "hint warn", "⚠ สวิตช์โพรบ " + warn.map(function (i) { return i + 1; }).join(", ") + " ไม่ตรงกับที่ตั้งในเมนูสโคป ค่าบนจอจะผิดไป 10 เท่า"));
    this.sync();
  };
  ScopePanel.prototype.half = function () {
    var lab = this.lab, sc = lab.st.scope;
    if (sc.trig.src === 2) return;
    var y = FGS.scope.process(lab.engine(), sc, 3.21, (lab.engine().T || sc.tdiv * 10) * 2 / 2048, 2048)[sc.trig.src], a = -1e99, b = 1e99;
    for (var k = 0; k < y.length; k++) { a = Math.max(a, y[k]); b = Math.min(b, y[k]); }
    var g = sc.ch[sc.trig.src].vdiv * 0.04; sc.trig.level = Math.round((a + b) / 2 / g) * g; sc._showLevel = Date.now(); lab.changed("scope"); this.update();
  };
  ScopePanel.prototype.update = function () { this.knobs.forEach(function (k) { k.update(); }); this.sync(); };
  ScopePanel.prototype.showMeas = function () {
    this.meas.innerHTML = measHtml(this.lab) + cursorHtml(this.lab) + fftHtml(this.lab);
  };

  // cursor dragging on the screen
  function cursorDrag(lab, canvas) {
    var drag = null;
    function at(e) { var r = canvas.getBoundingClientRect(), g = lab.screen.g; return { x: ((e.clientX - r.left - g.x) / g.w) * 10, y: 4 - ((e.clientY - r.top - g.y) / (lab.st.scope.math === "fft" ? g.h * 0.55 : g.h)) * 8 }; }
    canvas.addEventListener("pointerdown", function (e) {
      var cu = lab.st.scope.cursor; if (cu.mode === "off" || lab.st.scope.xy) return;
      var p = at(e), keys = cu.mode === "time" ? ["x1", "x2"] : ["y1", "y2"], v = cu.mode === "time" ? p.x : p.y;
      var k = Math.abs(cu[keys[0]] - v) <= Math.abs(cu[keys[1]] - v) ? keys[0] : keys[1];
      drag = k; canvas.setPointerCapture(e.pointerId); move(e); e.preventDefault();
    });
    function move(e) {
      if (!drag) return; var p = at(e), cu = lab.st.scope.cursor;
      cu[drag] = drag[0] === "x" ? clamp(Math.round(p.x * 50) / 50, 0, 10) : clamp(Math.round(p.y * 50) / 50, -4, 4);
      lab.dirty = true; if (lab.onCursor) lab.onCursor();
    }
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("pointercancel", function () { drag = null; });
    lab.listeners.push(function () { canvas.style.touchAction = lab.st.scope.cursor.mode === "off" ? "" : "none"; });
  }

  // ======================================================================= the full bench
  function Bench(host) {
    var self = this;
    host.innerHTML = "";
    host.classList.add("fgs-ready");
    var top = el("div", "fgs-bar");
    top.innerHTML = '<label class="mono" for="fgsPre">โหลดการทดลอง</label>';
    var pre = el("select", "pre"); pre.id = "fgsPre";
    pre.appendChild(el("option", null, "— เลือกการตั้งค่าตัวอย่าง —"));
    Object.keys(P).forEach(function (k) { var o = el("option", null, esc(P[k].t)); o.value = k; pre.appendChild(o); });
    top.appendChild(pre);
    var bShare = el("button", "btn btn-ghost btn-sm", "คัดลอกลิงก์การตั้งค่านี้"), bReset = el("button", "btn btn-ghost btn-sm", "เริ่มใหม่");
    bShare.type = bReset.type = "button";
    top.appendChild(bShare); top.appendChild(bReset);
    host.appendChild(top);
    var grid = el("div", "fgs-grid"); host.appendChild(grid);
    var scopeBox = el("section"); var screenWrap = el("div", "sc-screen"); var canvas = el("canvas");
    canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "จอออสซิลโลสโคป");
    screenWrap.appendChild(canvas); scopeBox.appendChild(screenWrap);
    var lab = (this.lab = new Lab(canvas));
    var side = el("div", "fgs-side");
    this.fgp = new UI.FGPanel(lab); this.dut = new UI.DUTPanel(lab);
    side.appendChild(this.fgp.root); side.appendChild(this.dut.root);
    grid.appendChild(scopeBox); grid.appendChild(side);
    this.sp = new ScopePanel(lab, scopeBox);
    cursorDrag(lab, canvas);
    var tm = 0;
    lab.afterDraw = function () {
      var now = Date.now();
      if (now - tm > 280 || lab.st.scope.cursor.mode !== "off") { tm = now; self.sp.showMeas(); }
      canvas.setAttribute("aria-label", "จอออสซิลโลสโคป " + describe(lab));
    };
    lab.onStop = function () { self.sp.sync(); };
    lab.onCursor = function () { self.sp.showMeas(); };
    lab.listeners.push(function (part) {
      if (part === "all") { self.fgp.update(); self.dut.build(); self.sp.rebuild(); return; }
      if (part === "fg") self.dut.refresh();
      if (part === "scope") self.sp.update();
    });
    pre.addEventListener("change", function () { if (P[pre.value]) { lab.load(pre.value); history.replaceState(null, "", "#preset=" + pre.value); } });
    bShare.addEventListener("click", function () {
      var u = lab.share();
      var done = function () { bShare.textContent = "คัดลอกแล้ว ✓"; setTimeout(function () { bShare.textContent = "คัดลอกลิงก์การตั้งค่านี้"; }, 1800); };
      history.replaceState(null, "", u.slice(u.indexOf("#")));
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, done); else done();
    });
    bReset.addEventListener("click", function () { lab.load("sine-basic"); history.replaceState(null, "", location.pathname); });
    if (!lab.fromHash(location.hash)) lab.load(host.getAttribute("data-preset") || "sine-basic");
    window.addEventListener("hashchange", function () { lab.fromHash(location.hash); });
    // worksheet buttons: <button data-fgs-preset="name">
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fgs-preset]"); if (!b) return;
      e.preventDefault(); lab.load(b.getAttribute("data-fgs-preset"));
      history.replaceState(null, "", "#preset=" + b.getAttribute("data-fgs-preset"));
      host.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    register(lab, host);
  }
  function describe(lab) {
    var fg = lab.st.fg, s = FGS.FG.WAVES[fg.wave].th + " " + fmt(fg.freq, "Hz", 4) + " " + fmt(fg.amp, "Vpp", 3) + " ผ่าน " + FGS.DUTS[lab.st.dut.type].th;
    var m = lab.meas;
    if (m && m[0] && m[0].vpp != null) s += " · CH1 วัดได้ " + fmt(m[0].vpp, "Vpp", 3) + (m[0].freq ? " " + fmt(m[0].freq, "Hz", 4) : "");
    if (m && m[1] && m[1].vpp != null) s += " · CH2 " + fmt(m[1].vpp, "Vpp", 3);
    return s;
  }

  // ======================================================================= small embedded scope
  function slider(label, min, max, stepv, get, set, show, log) {
    var id = "fm" + Math.random().toString(36).slice(2, 8), w = el("div", "row");
    w.innerHTML = '<label for="' + id + '">' + label + ' <output></output></label><input type="range" id="' + id + '" min="0" max="1000" step="1">';
    var inp = w.querySelector("input"), out = w.querySelector("output");
    var toS = function (v) { return log ? (1000 * Math.log(v / min)) / Math.log(max / min) : (1000 * (v - min)) / (max - min); };
    var fromS = function (s) { var v = log ? min * Math.pow(max / min, s / 1000) : min + ((max - min) * s) / 1000; if (stepv) v = log ? +v.toPrecision(3) : Math.round(v / stepv) * stepv; return v; };
    w.update = function () { inp.value = toS(get()); out.textContent = show(get()); };
    inp.addEventListener("input", function () { set(fromS(+inp.value)); out.textContent = show(get()); });
    w.update();
    return w;
  }
  function Mini(host) {
    var self = this, name = host.getAttribute("data-preset") || "sine-basic";
    var ctl = (host.getAttribute("data-ctl") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var keys = host.getAttribute("data-meas"); keys = keys ? keys.split(",").map(function (s) { return s.trim(); }) : ["vpp", "rms", "freq", "phase"];
    host.innerHTML = ""; host.classList.add("fgs-ready");
    var scr = el("div", "sc-screen"), canvas = el("canvas"); canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "จอออสซิลโลสโคปจำลอง");
    scr.appendChild(canvas); host.appendChild(scr);
    var lab = (this.lab = new Lab(canvas));
    lab.load(name);
    if (host.getAttribute("data-ch") === "1") { lab.st.scope.ch[1].on = false; if (lab.st.scope.trig.src === 1) lab.st.scope.trig.src = 0; }
    if (host.getAttribute("data-ch") === "2") lab.st.scope.ch[0].on = false;
    var body = el("div", "mini-body"); host.appendChild(body);
    var ctlBox = el("div", "mini-ctl"); body.appendChild(ctlBox);
    var mBox = el("div", "mini-meas"); body.appendChild(mBox);
    var foot = el("div", "mini-foot");
    var bAuto = el("button", "sc-btn auto", "AUTO"), bRun = el("button", "sc-btn run", "RUN ▶"), a = el("a", "mini-open", "เปิดในแล็บเต็มรูปแบบ ↗");
    bAuto.type = bRun.type = "button";
    bAuto.addEventListener("click", function () { FGS.scope.autoset(lab.engine(), lab.st.scope, lab.st.fg); lab.changed("scope"); refresh(); });
    bRun.addEventListener("click", function () { var sc = lab.st.scope; sc.run = !sc.run; bRun.textContent = sc.run ? "RUN ▶" : "STOP ■"; bRun.classList.toggle("stopped", !sc.run); lab.changed("scope"); });
    foot.appendChild(bAuto); foot.appendChild(bRun); foot.appendChild(a); body.appendChild(foot);
    var annot = host.getAttribute("data-annot");
    var parts = [];
    var fg = lab.st.fg, sc = lab.st.scope, d = lab.st.dut;
    var fmin = +(host.getAttribute("data-fmin") || 10), fmax = +(host.getAttribute("data-fmax") || 100000);
    var C = {
      wave: function () { return labeled("รูปคลื่น", seg([["sine", "ไซน์"], ["square", "สี่เหลี่ยม"], ["ramp", "สามเหลี่ยม"], ["pulse", "พัลส์"]], fg.wave, function (v) { fg.wave = v; if (v === "ramp") fg.sym = 50; lab.changed("fg"); refresh(); })); },
      freq: function () { return slider("ความถี่", fmin, fmax, 0, function () { return fg.freq; }, function (v) { fg.freq = v; lab.changed("fg"); }, function (v) { return fmt(v, "Hz", 3); }, true); },
      amp: function () { return slider("แอมพลิจูด", 0.1, 10, 0.1, function () { return fg.amp; }, function (v) { fg.amp = v; FGS.FG.limit(fg); lab.changed("fg"); }, function (v) { return fmt(v, "Vpp", 3); }); },
      offset: function () { return slider("ออฟเซต DC", -4, 4, 0.1, function () { return fg.offset; }, function (v) { fg.offset = v; FGS.FG.limit(fg); lab.changed("fg"); }, function (v) { return fmt(v, "V", 3); }); },
      duty: function () { return slider("ดิวตี้", 5, 95, 1, function () { return fg.duty; }, function (v) { fg.duty = v; lab.changed("fg"); }, function (v) { return v.toFixed(0) + " %"; }); },
      sym: function () { return slider("สมมาตร (ramp)", 0, 100, 1, function () { return fg.sym; }, function (v) { fg.sym = v; lab.changed("fg"); }, function (v) { return v.toFixed(0) + " %"; }); },
      phase: function () { return slider("เฟสของ FG", -180, 180, 5, function () { return fg.phase; }, function (v) { fg.phase = v; lab.changed("fg"); }, function (v) { return v.toFixed(0) + "°"; }); },
      load: function () { return labeled("Load ที่ตั้งใน FG", seg([["highz", "High-Z"], ["50", "50 Ω"]], fg.load, function (v) { fg.load = v; FGS.FG.limit(fg); lab.changed("fg"); })); },
      term: function () { return labeled("โหลดจริงที่ต่อ", seg([["0", "สโคป 1 MΩ"], ["1", "50 Ω terminator"]], d.term ? "1" : "0", function (v) { d.term = v === "1"; lab.changed("dut"); })); },
      noise: function () { return labeled("เพิ่มนอยส์", seg([["0", "ปิด"], ["5", "5%"], ["20", "20%"]], String(fg.noise), function (v) { fg.noise = +v; lab.changed("fg"); })); },
      tdiv: function () { return knob({ label: "Time/div", get: function () { return fmt(sc.tdiv, "s", 3); }, step: function (dd) { sc.tdiv = clamp(U.seq125(U.idx125(sc.tdiv) + dd), 5e-9, 50); lab.changed("scope"); } }); },
      vdiv1: function () { return vdivKnob(lab, 0); },
      vdiv2: function () { return vdivKnob(lab, 1); },
      pos1: function () { return posKnob(lab, 0); },
      level: function () { return knob({ label: "Trigger level", color: "#ff8a3d", get: function () { return fmt(sc.trig.level, "V", 3); }, step: function (dd) { var c = sc.ch[Math.min(sc.trig.src, 1)]; sc.trig.level = Math.round((sc.trig.level + dd * c.vdiv * 0.2) / (c.vdiv * 0.04)) * c.vdiv * 0.04; sc._showLevel = Date.now(); lab.changed("scope"); } }); },
      slope: function () { return labeled("ขอบทริกเกอร์", seg([["rise", "ขึ้น ↑"], ["fall", "ลง ↓"]], sc.trig.slope, function (v) { sc.trig.slope = v; lab.changed("scope"); })); },
      tmode: function () { return labeled("โหมดทริกเกอร์", seg([["auto", "Auto"], ["normal", "Normal"]], sc.trig.mode, function (v) { sc.trig.mode = v; lab.changed("scope"); })); },
      tsrc: function () { return labeled("แหล่งทริกเกอร์", seg([["0", "CH1"], ["1", "CH2"], ["2", "EXT"]], String(sc.trig.src), function (v) { sc.trig.src = +v; lab.changed("scope"); })); },
      coup2: function () { return labeled("คัปปลิง CH2", seg([["DC", "DC"], ["AC", "AC"], ["GND", "GND"]], sc.ch[1].coup, function (v) { sc.ch[1].coup = v; lab.changed("scope"); })); },
      coup1: function () { return labeled("คัปปลิง CH1", seg([["DC", "DC"], ["AC", "AC"], ["GND", "GND"]], sc.ch[0].coup, function (v) { sc.ch[0].coup = v; lab.changed("scope"); })); },
      comp1: function () { return slider("ทริมเมอร์ชดเชยโพรบ 1", -1, 1, 0.05, function () { return sc.probes[0].comp; }, function (v) { sc.probes[0].comp = v; lab.changed("scope"); }, function (v) { return Math.abs(v) < 0.01 ? "พอดี" : (v > 0 ? "เกิน +" : "ขาด ") + Math.round(v * 100) + "%"; }); },
      probe2: function () { return labeled("โพรบ CH2", seg([["1", "1×"], ["10", "10×"]], String(sc.probes[1].x), function (v) { sc.probes[1].x = +v; var k = +v / sc.ch[1].probe; sc.ch[1].probe = +v; sc.ch[1].vdiv *= k; lab.changed("scope"); })); },
      xy: function () { return labeled("โหมดจอ", seg([["yt", "Y–T"], ["xy", "X–Y (ลิสซาจู)"]], sc.xy ? "xy" : "yt", function (v) { sc.xy = v === "xy"; lab.changed("scope"); })); },
      math: function () { return labeled("Math", seg([["off", "ปิด"], ["fft", "FFT"]], sc.math, function (v) { sc.math = v; lab.changed("scope"); })); },
      avg: function () { return labeled("เก็บข้อมูล", seg([["normal", "Normal"], ["avg", "Average 16"]], sc.acq, function (v) { sc.acq = v; lab.scope.avg = null; lab.changed("scope"); })); },
      R: function () { return slider("R", +(host.dataset.rmin || 100), +(host.dataset.rmax || 100000), 0, function () { return d.R; }, function (v) { d.R = v; lab.changed("dut"); }, function (v) { return fmt(v, "Ω", 3); }, true); },
      C: function () { return slider("C", +(host.dataset.cmin || 1e-9), +(host.dataset.cmax || 1e-6), 0, function () { return d.C; }, function (v) { d.C = v; lab.changed("dut"); }, function (v) { return fmt(v, "F", 3); }, true); },
      L: function () { return slider("L", 1e-3, 100e-3, 0, function () { return d.L; }, function (v) { d.L = v; lab.changed("dut"); }, function (v) { return fmt(v, "H", 3); }, true); },
      Cf: function () { return slider("C กรอง", 0.1e-6, 100e-6, 0, function () { return d.Cf; }, function (v) { d.Cf = v; lab.changed("dut"); }, function (v) { return fmt(v, "F", 3); }, true); },
      RL: function () { return slider("R_L", 1000, 100000, 0, function () { return d.RL; }, function (v) { d.RL = v; lab.changed("dut"); }, function (v) { return fmt(v, "Ω", 3); }, true); },
      Rf: function () { return slider("R_f", 1000, 1e6, 0, function () { return d.Rf; }, function (v) { d.Rf = v; lab.changed("dut"); }, function (v) { return fmt(v, "Ω", 3); }, true); },
      op: function () { return labeled("ออปแอมป์", seg(Object.keys(FGS.OPAMPS).map(function (o) { return [o, FGS.OPAMPS[o].th]; }), d.op, function (v) { d.op = v; lab.changed("dut"); })); },
      out: function () { return labeled("เอาต์พุตคร่อม", seg(d.type === "rc" ? [["C", "C"], ["R", "R"]] : d.type === "rl" ? [["R", "R"], ["L", "L"]] : [["R", "R"], ["C", "C"], ["L", "L"], ["LC", "L+C"]], d.out, function (v) { d.out = v; lab.changed("dut"); })); }
    };
    function labeled(t, node) { var w = el("div", "row"); w.appendChild(el("span", "mini-l", t)); w.appendChild(node); return w; }
    ctl.forEach(function (k) { if (C[k]) { var n = C[k](); parts.push(n); ctlBox.appendChild(n); } });
    if (host.hasAttribute("data-theory")) { var th = el("ul", "dut-th"); body.insertBefore(th, foot); self.th = th; }
    function refresh() { parts.forEach(function (p) { if (p.update) p.update(); }); }
    lab.listeners.push(function () { refresh(); a.href = lab.share().replace(location.origin, ""); if (self.th) self.th.innerHTML = UI.theory(lab.st); });
    a.href = LAB_URL + "#preset=" + name;
    if (self.th) self.th.innerHTML = UI.theory(lab.st);
    var tm = 0;
    lab.afterDraw = function () {
      if (annot) drawAnnot(lab, annot);
      var now = Date.now();
      if (now - tm > 300) { tm = now; mBox.innerHTML = measHtml(lab, keys) + fftHtml(lab); canvas.setAttribute("aria-label", "จอออสซิลโลสโคปจำลอง " + describe(lab)); }
    };
    register(lab, host);
  }
  // guide lines for the waveform lesson: Vmax, Vmin, Vavg, Vrms
  function drawAnnot(lab, kind) {
    var r = lab.res, sc = lab.st.scope; if (!r || !r.ch || sc.xy) return;
    var m = FGS.scope.measure(r.ch[0].v, r.dt), g = lab.screen.g, ctx = lab.screen.ctx, c = sc.ch[0];
    var Y = function (v) { return g.y + g.h / 2 - (v / c.vdiv + c.pos) * (g.h / 8); };
    ctx.save(); ctx.font = "600 " + Math.round(g.fs * 0.85) + "px 'IBM Plex Mono',monospace"; ctx.textBaseline = "bottom";
    var line = function (v, col, lab2, dash) { var y = Y(v); if (y < g.y || y > g.y + g.h) return; ctx.strokeStyle = col; ctx.setLineDash(dash || [6, 4]); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke(); ctx.fillStyle = col; ctx.fillText(lab2, g.x + 16, y - 2); };
    if (kind === "levels") {
      line(m.vmax, "#ff7b72", "Vmax " + fmt(m.vmax, "V", 3));
      line(m.vmin, "#ff7b72", "Vmin " + fmt(m.vmin, "V", 3));
      line(m.avg, "#7ee787", "Vavg " + fmt(m.avg, "V", 3), [2, 3]);
      line(m.rms, "#a5d6ff", "Vrms " + fmt(m.rms, "V", 3), [10, 4]);
      if (m.rises && m.rises.length >= 2) {
        var x1 = g.x + (m.rises[0] / (sc.tdiv * 10)) * g.w, x2 = g.x + (m.rises[1] / (sc.tdiv * 10)) * g.w, yy = g.y + g.h - 14;
        ctx.setLineDash([]); ctx.strokeStyle = "#e6edf3"; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.moveTo(x1, yy - 5); ctx.lineTo(x1, yy + 5); ctx.moveTo(x2, yy - 5); ctx.lineTo(x2, yy + 5); ctx.stroke();
        ctx.fillStyle = "#e6edf3"; ctx.textAlign = "center"; ctx.fillText("T = " + fmt(m.period, "s", 3), (x1 + x2) / 2, yy - 4);
      }
    }
    ctx.restore();
  }

  // ======================================================================= refresh loop (only visible instruments run)
  var labs = [], running = false;
  function register(lab, host) {
    labs.push(lab);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { lab.visible = e.isIntersecting; if (e.isIntersecting) lab.dirty = true; }); }, { rootMargin: "100px" }).observe(host);
    var ro = "ResizeObserver" in window ? new ResizeObserver(function () { lab.dirty = true; }) : null;
    if (ro) ro.observe(host);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function loop(now) {
    if (!document.hidden) labs.forEach(function (lab) { if (lab.visible) { try { lab.tick(now); } catch (e) { if (window.console) console.error(e); } } });
    requestAnimationFrame(loop);
  }

  function boot() {
    document.querySelectorAll(".fgs-bench").forEach(function (h) { new Bench(h); });
    document.querySelectorAll(".fgs-mini").forEach(function (h) { new Mini(h); });
    document.querySelectorAll("[data-fgs-open]").forEach(function (a) { a.href = LAB_URL + "#preset=" + a.getAttribute("data-fgs-open"); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  FGS.Lab = Lab;
})();
