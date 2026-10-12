/* Control systems lab (UI): root locus, Bode, Nyquist and step response for a typed loop transfer function.
   Markup:  <div class="cs-lab" data-tf="1/(s(s+1)(s+2))" data-views="rl,bode,nyq,step" data-k="2" data-kmax="40" data-rules data-neg></div>
   Needs assets/cs-core.js first. */
(function () {
  "use strict";
  var CS = window.CS;
  if (!CS) return;
  var NS = "http://www.w3.org/2000/svg", R2D = 180 / Math.PI;

  /* ------------------------------------------------------------ small helpers */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function f2(v) { return (Math.round(v * 100) / 100).toString(); }
  var fmt = CS.fmt;
  function niceStep(range, target) {
    var raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function ticks(a, b, target) {
    var st = niceStep(b - a, target || 6), t = [], v = Math.ceil(a / st - 1e-9) * st;
    for (; v <= b + 1e-9; v += st) t.push(Math.round(v / st) * st);
    return { t: t, st: st };
  }
  function tickLabel(v, st) {
    var d = Math.max(0, -Math.floor(Math.log10(st) + 1e-9));
    var s = v.toFixed(d);
    if (parseFloat(s) === 0) s = "0";
    return s.replace("-", "−");
  }
  function Frame(W, H, m, x0, x1, y0, y1, logx) {
    this.W = W; this.H = H; this.m = m; this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1; this.logx = !!logx;
    this.pw = W - m.l - m.r; this.ph = H - m.t - m.b;
    this.lx0 = logx ? Math.log10(x0) : x0; this.lx1 = logx ? Math.log10(x1) : x1;
  }
  Frame.prototype.X = function (x) { var v = this.logx ? Math.log10(x) : x; return this.m.l + (v - this.lx0) / (this.lx1 - this.lx0) * this.pw; };
  Frame.prototype.Y = function (y) { return this.m.t + this.ph - (y - this.y0) / (this.y1 - this.y0) * this.ph; };
  Frame.prototype.ix = function (px) { var v = this.lx0 + (px - this.m.l) / this.pw * (this.lx1 - this.lx0); return this.logx ? Math.pow(10, v) : v; };
  Frame.prototype.iy = function (py) { return this.y0 + (this.m.t + this.ph - py) / this.ph * (this.y1 - this.y0); };
  Frame.prototype.clip = function (id) { return '<clipPath id="' + id + '"><rect x="' + this.m.l + '" y="' + this.m.t + '" width="' + this.pw + '" height="' + this.ph + '"/></clipPath>'; };
  Frame.prototype.box = function () { return '<rect class="cs-box" x="' + this.m.l + '" y="' + this.m.t + '" width="' + this.pw + '" height="' + this.ph + '"/>'; };

  function pathFrom(F, pts, clipY) {
    var d = "", pen = false, lx = null, ly = null;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!isFinite(p[0]) || !isFinite(p[1])) { pen = false; continue; }
      var X = F.X(p[0]), Y = F.Y(p[1]);
      if (lx !== null && Math.abs(X - lx) < 0.6 && Math.abs(Y - ly) < 0.6) continue;
      if (clipY) { Y = Math.max(F.m.t - 40, Math.min(F.m.t + F.ph + 40, Y)); }
      d += (pen ? "L" : "M") + f1(X) + " " + f1(Y);
      pen = true; lx = X; ly = Y;
    }
    return d;
  }

  /* ----------------------------------------------- pole/zero state <-> transfer function */
  // item: {t:"r", re} or {t:"c", re, im} (im > 0, the conjugate is implied)
  function itemsFromRoots(rs) {
    var out = [], used = new Array(rs.length).fill(false);
    rs.forEach(function (r, i) {
      if (used[i]) return;
      used[i] = true;
      if (Math.abs(r.im) < 1e-9 * (1 + Math.abs(r.re))) out.push({ t: "r", re: r.re });
      else {
        var bj = -1, bd = Infinity;
        rs.forEach(function (q, j) { if (!used[j]) { var d = Math.hypot(q.re - r.re, q.im + r.im); if (d < bd) { bd = d; bj = j; } } });
        if (bj >= 0) used[bj] = true;
        out.push({ t: "c", re: r.re, im: Math.abs(r.im) });
      }
    });
    return out;
  }
  function rootsFromItems(items) {
    var out = [];
    items.forEach(function (it) { if (it.t === "r") out.push({ re: it.re, im: 0 }); else { out.push({ re: it.re, im: it.im }); out.push({ re: it.re, im: -it.im }); } });
    return out;
  }
  function rnd(v) { return Math.abs(v) < 5e-4 ? 0 : Math.round(v * 1000) / 1000; }
  function factorString(items, k) {
    var parts = [];
    var sh = function (re) { re = rnd(re); return re === 0 ? "s" : re > 0 ? "(s − " + fmt(re, 3).replace("−", "") + ")" : "(s + " + fmt(-re, 3) + ")"; };
    items.forEach(function (it) {
      if (it.t === "r") parts.push(sh(it.re));
      else {
        var a = -2 * it.re, b = it.re * it.re + it.im * it.im;
        parts.push("(s^2" + (rnd(a) === 0 ? "" : (a > 0 ? " + " : " − ") + fmt(Math.abs(a), 3) + "s") + " + " + fmt(b, 3) + ")");
      }
    });
    return parts.join("");
  }
  function stateToText(st) {
    var num = factorString(st.zs, 1), den = factorString(st.ps, 1), k = st.k0, ks = "";
    if (Math.abs(k - 1) > 1e-9) ks = fmt(k, 4);
    var n = num ? (st.zs.length > 1 || ks ? ks + (ks && num ? "" : "") + num : num) : (ks || "1");
    if (num && ks) n = ks + num;
    if (!num) n = ks || "1";
    var d = den || "1";
    var dd = st.ps.length > 1 || den.indexOf("(") === 0 && st.ps.length > 1 ? "(" + d + ")" : d;
    if (st.ps.length === 1 && st.ps[0].t === "r") dd = d;
    var text = n + "/" + dd;
    if (st.delay) text = "e^(−" + fmt(st.delay, 4) + "s)" + "*" + text.replace(/^(.*)\/(.*)$/, "$1/$2");
    return text.replace(/^1\/(\(s\))$/, "1/s");
  }
  function stateToTF(st) {
    var z = rootsFromItems(st.zs), p = rootsFromItems(st.ps);
    return { N: CS.pscale(CS.fromRoots(z), st.k0), D: CS.fromRoots(p), delay: st.delay || 0 };
  }
  function tfToState(tf) {
    var pz = CS.pzk(tf);
    return { zs: itemsFromRoots(pz.z), ps: itemsFromRoots(pz.p), k0: pz.k, delay: tf.delay || 0 };
  }

  /* --------------------------------------------------------- Bode asymptotes */
  function bodeAsym(tf, K) {
    var lf = CS.lowFreq(tf), Kb = lf.Kb * (K == null ? 1 : K), q = lf.q, pz = CS.pzk(tf), cs = [];
    var add = function (rs, kind) {
      rs.forEach(function (r) {
        var m = CS.cabs(r);
        if (m < 1e-9) return;
        if (Math.abs(r.im) < 1e-9 * (1 + m)) cs.push({ w: m, kind: kind, order: 1, rhp: r.re > 0, zeta: 1 });
        else if (r.im > 0) cs.push({ w: m, kind: kind, order: 2, rhp: r.re > 0, zeta: Math.abs(r.re) / m });
      });
    };
    add(pz.z, "z"); add(pz.p, "p");
    cs.sort(function (a, b) { return a.w - b.w; });
    var phase0 = (Kb < 0 ? -180 : 0) - 90 * q;
    return {
      Kb: Kb, q: q, corners: cs,
      mag: function (w) {
        var db = 20 * Math.log10(Math.abs(Kb)) - 20 * q * Math.log10(w);
        cs.forEach(function (c) { if (w > c.w) db += (c.kind === "z" ? 1 : -1) * 20 * c.order * Math.log10(w / c.w); });
        return db;
      },
      phase: function (w) {
        var ph = phase0;
        cs.forEach(function (c) {
          var sgn = (c.kind === "z" ? 1 : -1) * (c.rhp ? -1 : 1);
          if (c.order === 1) ph += sgn * 90 * Math.max(0, Math.min(1, (Math.log10(w / c.w) + 1) / 2));
          else { var half = Math.max(0.04, Math.min(1, c.zeta)); ph += sgn * 180 * Math.max(0, Math.min(1, (Math.log10(w / c.w) + half) / (2 * half))); }
        });
        return ph;
      }
    };
  }

  /* ------------------------------------------------------------------- the lab */
  function Lab(root) {
    this.root = root;
    var d = root.dataset;
    this.views = (d.views || "rl,bode,nyq,step").split(",").map(function (s) { return s.trim(); });
    this.rules = d.rules !== undefined;
    this.allowNeg = d.neg !== undefined;
    this.editable = d.edit !== "false";
    this.sgn = 1;
    this.K = parseFloat(d.k || "1");
    this.kmin = parseFloat(d.kmin || "0");
    this.kmax = parseFloat(d.kmax || "0");
    this.zeta = d.zeta ? d.zeta.split(",").map(parseFloat) : [];
    this.presets = [];
    try { if (d.presets) this.presets = JSON.parse(d.presets); } catch (e) {}
    this.tfText = d.tf || "1/(s(s+1)(s+2))";
    this.nyqR = 3;
    this.build();
    this.setText(this.tfText, true);
  }
  var LABN = 0;
  Lab.prototype.build = function () {
    var r = this.root, id = "cs" + (++LABN), self = this;
    this.id = id;
    var html = '<div class="cs-bar">';
    html += '<label class="cs-f cs-f-tf"><span class="mono">L(s) =</span><input class="cs-tf" type="text" spellcheck="false" autocomplete="off" aria-label="ฟังก์ชันถ่ายโอนวงเปิด L(s)"' + (this.editable ? "" : " readonly") + '></label>';
    if (this.presets.length) html += '<label class="cs-f"><span class="mono">ตัวอย่าง</span><select class="cs-pre" aria-label="เลือกตัวอย่าง">' + this.presets.map(function (p, i) { return '<option value="' + i + '">' + esc(p.n) + "</option>"; }).join("") + "</select></label>";
    html += '<label class="cs-f cs-f-k"><span class="mono">K</span><input class="cs-kr" type="range" min="0" max="1000" step="1" aria-label="เกน K (สเกลลอการิทึม)"><input class="cs-kn" type="number" step="any" aria-label="ค่า K"></label>';
    if (this.allowNeg) html += '<button type="button" class="cs-btn cs-neg" aria-pressed="false">K &lt; 0</button>';
    html += "</div>";
    if (this.views.indexOf("rl") >= 0 && this.editable) {
      html += '<div class="cs-bar cs-bar2"><span class="mono cs-hint">ลากขั้ว × และศูนย์ ○ ได้ · เพิ่ม:</span>' +
        '<button type="button" class="cs-btn" data-add="pr">+ ขั้วจริง</button><button type="button" class="cs-btn" data-add="pc">+ ขั้วเชิงซ้อน</button>' +
        '<button type="button" class="cs-btn" data-add="zr">+ ศูนย์จริง</button><button type="button" class="cs-btn" data-add="zc">+ ศูนย์เชิงซ้อน</button>' +
        '<button type="button" class="cs-btn" data-act="del" aria-pressed="false">ลบทีละตัว</button>' +
        (this.rules ? '<button type="button" class="cs-btn" data-act="hide" aria-pressed="false">ซ่อนเฉลย (โหมดฝึกวาด)</button>' : "") + "</div>";
    }
    html += '<div class="cs-err" role="alert" hidden></div><div class="cs-views">';
    var T = { rl: "รูทโลคัส (ระนาบ s)", bode: "โบดไดอะแกรม", nyq: "ไนควิสต์", step: "ผลตอบสนองขั้นบันไดวงปิด" };
    this.views.forEach(function (v) {
      if (v === "bode") html += '<figure class="cs-plot cs-p-bode"><figcaption class="mono">' + T.bode + '</figcaption><svg class="cs-svg" data-v="bodeM" viewBox="0 0 560 250" role="img" aria-label="โบดไดอะแกรมขนาด"></svg><svg class="cs-svg" data-v="bodeP" viewBox="0 0 560 230" role="img" aria-label="โบดไดอะแกรมเฟส"></svg><div class="cs-hover mono" aria-live="off"></div></figure>';
      else if (T[v]) html += '<figure class="cs-plot cs-p-' + v + '"><figcaption class="mono">' + T[v] + (v === "nyq" ? ' <span class="cs-zoom"><button type="button" class="cs-btn cs-sm" data-zoom="-1" aria-label="ซูมออก">−</button><button type="button" class="cs-btn cs-sm" data-zoom="1" aria-label="ซูมเข้า">+</button></span>' : "") + '</figcaption><svg class="cs-svg" data-v="' + v + '" viewBox="0 0 560 ' + (v === "rl" ? 420 : v === "nyq" ? 400 : 300) + '" role="img" aria-label="' + T[v] + '"></svg></figure>';
    });
    html += '</div><div class="cs-read"></div>';
    if (this.rules) html += '<div class="cs-rules"></div>';
    html += '<noscript><p class="hint">ต้องเปิด JavaScript เพื่อใช้แล็บนี้</p></noscript>';
    r.innerHTML = html;
    r.classList.add("cs-ready");
    this.q = function (s) { return r.querySelector(s); };
    this.tfIn = this.q(".cs-tf"); this.kr = this.q(".cs-kr"); this.kn = this.q(".cs-kn"); this.err = this.q(".cs-err"); this.read = this.q(".cs-read"); this.rulesEl = this.q(".cs-rules");
    // events
    this.tfIn.addEventListener("change", function () { self.setText(self.tfIn.value); });
    this.tfIn.addEventListener("keydown", function (e) { if (e.key === "Enter") self.setText(self.tfIn.value); });
    var pre = this.q(".cs-pre");
    if (pre) pre.addEventListener("change", function () { var p = self.presets[+pre.value]; if (p.k != null) self.K = p.k; if (p.kmax) self.kmax = p.kmax; self.setText(p.tf, true); });
    this.kr.addEventListener("input", function () { self.K = self.fromSlider(+self.kr.value); self.kn.value = fmt(self.K, 4); self.updateK(); });
    this.kn.addEventListener("change", function () { var v = parseFloat(self.kn.value); if (isFinite(v) && v >= 0) { self.K = v; self.syncSlider(); self.updateK(); } });
    r.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !r.contains(b)) return;
      if (b.classList.contains("cs-neg")) { self.sgn = -self.sgn; b.setAttribute("aria-pressed", self.sgn < 0); self.recompute(); }
      else if (b.dataset.add) self.addItem(b.dataset.add);
      else if (b.dataset.act === "del") { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); self.delMode = on; r.classList.toggle("cs-delmode", on); }
      else if (b.dataset.act === "hide") { var h = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", h); r.classList.toggle("cs-hide-ans", h); b.textContent = h ? "แสดงเฉลย" : "ซ่อนเฉลย (โหมดฝึกวาด)"; }
      else if (b.dataset.zoom) { self.nyqR *= b.dataset.zoom === "1" ? 0.6 : 1 / 0.6; self.drawNyq(); }
    });
    var svgRL = this.q('svg[data-v="rl"]');
    if (svgRL) this.bindRL(svgRL);
    var bm = this.q('svg[data-v="bodeM"]'), bp = this.q('svg[data-v="bodeP"]');
    if (bm) { var mv = function (e) { self.bodeHover(e); }; bm.addEventListener("pointermove", mv); bp.addEventListener("pointermove", mv); bm.addEventListener("pointerleave", function () { self.bodeHover(null); }); bp.addEventListener("pointerleave", function () { self.bodeHover(null); }); }
  };

  Lab.prototype.fromSlider = function (v) { return this.kLo * Math.pow(this.kHi / this.kLo, v / 1000); };
  Lab.prototype.syncSlider = function () {
    var v = Math.log(Math.max(this.K, this.kLo) / this.kLo) / Math.log(this.kHi / this.kLo) * 1000;
    this.kr.value = Math.max(0, Math.min(1000, v));
  };
  Lab.prototype.showErr = function (m) { this.err.hidden = !m; this.err.textContent = m || ""; };

  Lab.prototype.setText = function (text, keepK) {
    var tf;
    try { tf = CS.parseTF(text, { K: 1 }); } catch (e) { this.showErr("อ่านสมการไม่ได้: " + e.message); return; }
    if (tf.D.length - 1 < tf.N.length - 1) { this.showErr("L(s) ต้องมีดีกรีตัวส่วนไม่น้อยกว่าตัวเศษ (proper)"); return; }
    if (tf.D.length - 1 > 9) { this.showErr("รองรับตัวส่วนดีกรีไม่เกิน 9"); return; }
    this.showErr(tf.cancelled ? "ตัดขั้วและศูนย์ที่เหมือนกันออกแล้ว" : "");
    this.state = tfToState(tf);
    this.tfIn.value = this.editable && !/e\^|exp/.test(text) && text.length < 2 ? text : text;
    this.recompute(true);
  };
  Lab.prototype.pushState = function () { this.tfIn.value = stateToText(this.state); this.recompute(); };

  Lab.prototype.recompute = function (fresh) {
    var self = this, st = this.state;
    this.tf = stateToTF(st);
    if (!this.tf.D.length || this.tf.D.length < 2 && this.tf.N.length > 1) return;
    this.pz = CS.pzk(this.tf);
    this.rl = CS.lociRules(this.tf, this.sgn);
    // gain range for the slider
    var crit = [];
    this.rl.cross.forEach(function (c) { crit.push(c.K); });
    this.rl.breaks.forEach(function (b) { crit.push(b.K); });
    var kref = Math.max.apply(null, crit.concat([1e-9]));
    var d = this.root.dataset;
    this.kHi = this.kmax > 0 ? this.kmax : Math.max(kref * 6, 1);
    this.kLo = this.kmin > 0 ? this.kmin : this.kHi / 1e4;
    if (fresh && this.kmax <= 0) this.K = Math.min(this.K, this.kHi);
    this.syncSlider(); this.kn.value = fmt(this.K, 4);
    // the locus is only needed for the root-locus view / hit-testing
    this.loc = null;
    if (this.views.indexOf("rl") >= 0) {
      var t0 = performance.now();
      try {
        this.loc = CS.locus(this.tf.N, this.tf.D, { sgn: this.sgn, scale: this.rlScale() });
        if (this.sgn > 0 && this.allowNeg === false) this.locNeg = null;
      } catch (e) { this.loc = null; }
      this.locMs = performance.now() - t0;
    }
    this.draw();
  };
  Lab.prototype.rlScale = function () {
    var sc = 0;
    this.pz.p.concat(this.pz.z).forEach(function (r) { sc = Math.max(sc, CS.cabs(r)); });
    this.rl.cross.forEach(function (c) { sc = Math.max(sc, c.w); });
    return sc || 1;
  };
  Lab.prototype.updateK = function () { this.drawRLMarks(); this.drawBode(); this.drawNyq(); this.drawStep(); this.drawRead(); };
  Lab.prototype.draw = function () { this.drawRL(); this.drawBode(); this.drawNyq(); this.drawStep(); this.drawRead(); this.drawRules(); };

  Lab.prototype.Keff = function () { return this.sgn * this.K; };
  Lab.prototype.cpoles = function () {
    var tfc = CS.closedLoop(this.tf, this.Keff());
    return CS.roots(tfc.D);
  };

  /* --------------------------------------------------------------- root locus */
  Lab.prototype.rlFrame = function () {
    var W = 560, H = 420, pts = [], rl = this.rl, self = this;
    this.pz.p.concat(this.pz.z).forEach(function (r) { pts.push([r.re, r.im], [r.re, -r.im]); });
    rl.breaks.forEach(function (b) { pts.push([b.s.re, b.s.im], [b.s.re, -b.s.im]); });
    rl.cross.forEach(function (c) { pts.push([0, c.w], [0, -c.w]); });
    if (rl.centroid != null && isFinite(rl.centroid)) pts.push([rl.centroid, 0]);
    pts.push([0, 0]);
    var x0 = Infinity, x1 = -Infinity, y1 = 0;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, Math.abs(p[1])); });
    var span = Math.max(x1 - x0, 2 * y1, 1e-6), padv = span * 0.3;
    x0 -= padv; x1 += padv; y1 = Math.max(y1 + padv, span * 0.45);
    var m = { l: 34, t: 14, r: 14, b: 26 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    var cxm = (x0 + x1) / 2, w = x1 - x0, h = 2 * y1;
    var u = Math.max(w / pw, h / ph);
    w = u * pw; h = u * ph;
    return new Frame(W, H, m, cxm - w / 2, cxm + w / 2, -h / 2, h / 2, false);
  };
  Lab.prototype.drawRL = function () {
    var svg = this.q('svg[data-v="rl"]');
    if (!svg) return;
    var F = this.rlFrame(); this.F = F;
    var id = this.id + "rl", o = "";
    o += "<defs>" + F.clip(id) + "</defs>" + F.box();
    var tx = ticks(F.x0, F.x1, 8), ty = ticks(F.y0, F.y1, 6), g = "", lab = "";
    tx.t.forEach(function (v) { g += "M" + f1(F.X(v)) + " " + F.m.t + "V" + (F.m.t + F.ph); lab += '<text class="cs-tk" x="' + f1(F.X(v)) + '" y="' + (F.m.t + F.ph + 16) + '" text-anchor="middle">' + tickLabel(v, tx.st) + "</text>"; });
    ty.t.forEach(function (v) { g += "M" + F.m.l + " " + f1(F.Y(v)) + "H" + (F.m.l + F.pw); if (Math.abs(v) > ty.st / 2) lab += '<text class="cs-tk" x="' + (F.m.l - 5) + '" y="' + f1(F.Y(v) + 4) + '" text-anchor="end">' + tickLabel(v, ty.st) + "j</text>"; });
    o += '<path class="cs-gr" d="' + g + '"/>' + lab;
    o += '<g clip-path="url(#' + id + ')">';
    o += '<path class="cs-axl" d="M' + F.m.l + " " + f1(F.Y(0)) + "H" + (F.m.l + F.pw) + "M" + f1(F.X(0)) + " " + F.m.t + "V" + (F.m.t + F.ph) + '"/>';
    // zeta lines
    this.zeta.forEach(function (z) {
      var th = Math.acos(z), L = Math.max(F.x1 - F.x0, F.y1 - F.y0) * 2;
      var xx = -L * Math.cos(th), yy = L * Math.sin(th);
      o += '<path class="cs-zl" d="M' + f1(F.X(0)) + " " + f1(F.Y(0)) + "L" + f1(F.X(xx)) + " " + f1(F.Y(yy)) + "M" + f1(F.X(0)) + " " + f1(F.Y(0)) + "L" + f1(F.X(xx)) + " " + f1(F.Y(-yy)) + '"/>';
      o += '<text class="cs-zt" x="' + f1(F.X(-0.82 * (F.x1 - F.x0) * 0.35 * Math.cos(th))) + '" y="' + f1(F.Y(0.82 * (F.x1 - F.x0) * 0.35 * Math.sin(th)) - 4) + '">ζ=' + z + "</text>";
    });
    o += '<g class="cs-ans">';
    // asymptotes
    var rl = this.rl;
    if (rl.angles && isFinite(rl.centroid)) {
      var L2 = Math.max(F.x1 - F.x0, F.y1 - F.y0) * 3;
      var d = "";
      rl.angles.forEach(function (a) { var r = a * Math.PI / 180; d += "M" + f1(F.X(rl.centroid)) + " " + f1(F.Y(0)) + "L" + f1(F.X(rl.centroid + L2 * Math.cos(r))) + " " + f1(F.Y(L2 * Math.sin(r))); });
      o += '<path class="cs-asy" d="' + d + '"/><circle class="cs-cen" cx="' + f1(F.X(rl.centroid)) + '" cy="' + f1(F.Y(0)) + '" r="3.5"/>';
    }
    // locus
    if (this.loc) {
      var sgn = this.sgn;
      this.loc.branches.forEach(function (b, i) {
        var pts = b.map(function (p) { return [p.re, p.im]; });
        o += '<path class="cs-br' + (sgn < 0 ? " neg" : "") + '" style="stroke:var(--b' + (i % 6 + 1) + ')" d="' + pathFrom(F, pts, true) + '"/>';
      });
    }
    // break points and crossings
    rl.breaks.forEach(function (b) { o += '<rect class="cs-brk" x="' + f1(F.X(b.s.re) - 4) + '" y="' + f1(F.Y(b.s.im) - 4) + '" width="8" height="8"><title>จุดแยก/จุดเข้า s=' + fmt(b.s.re, 3) + " K=" + fmt(b.K, 3) + "</title></rect>"; });
    rl.cross.forEach(function (c) { [1, -1].forEach(function (sg) { o += '<path class="cs-crs" d="M' + f1(F.X(0)) + " " + f1(F.Y(sg * c.w) - 5) + "l5 5l-5 5l-5-5z\"><title>ตัดแกน jω ที่ ω=" + fmt(c.w, 3) + " K=" + fmt(c.K, 3) + "</title></path>"; }); });
    o += "</g>";
    // poles / zeros (draggable)
    var st = this.state, sel = this;
    st.ps.forEach(function (it, i) { o += pzMark(F, it, "p", i); });
    st.zs.forEach(function (it, i) { o += pzMark(F, it, "z", i); });
    o += '<g class="cs-cl"></g>';
    o += "</g>";
    o += '<text class="cs-ax-t" x="' + (F.m.l + F.pw) + '" y="' + (F.m.t + F.ph - 6) + '" text-anchor="end">σ</text><text class="cs-ax-t" x="' + (F.m.l + 6) + '" y="' + (F.m.t + 13) + '">jω</text>';
    o += '<text class="cs-hv-t" x="' + (F.m.l + F.pw - 4) + '" y="' + (F.m.t + 14) + '" text-anchor="end"></text>';
    svg.innerHTML = o;
    this.drawRLMarks();
  };
  function pzMark(F, it, kind, i) {
    var o = "", ys = it.t === "c" ? [it.im, -it.im] : [0];
    ys.forEach(function (y, k) {
      var X = f1(F.X(it.re)), Y = f1(F.Y(y)), grab = k === 0 ? ' data-pz="' + kind + i + '"' : ' data-pz="' + kind + i + '"';
      if (kind === "p") o += '<g class="cs-pz cs-p"' + grab + '><circle class="cs-hit" cx="' + X + '" cy="' + Y + '" r="14"/><path d="M' + (X - 6) + " " + (Y - 6) + "l12 12m0-12l-12 12\"/></g>";
      else o += '<g class="cs-pz cs-z"' + grab + '><circle class="cs-hit" cx="' + X + '" cy="' + Y + '" r="14"/><circle cx="' + X + '" cy="' + Y + '" r="6"/></g>';
    });
    return o;
  }
  Lab.prototype.drawRLMarks = function () {
    var svg = this.q('svg[data-v="rl"]');
    if (!svg || !this.F) return;
    var g = svg.querySelector(".cs-cl"), F = this.F, poles = this.cpoles(), o = "";
    poles.forEach(function (p, i) { o += '<circle class="cs-clp" cx="' + f1(F.X(p.re)) + '" cy="' + f1(F.Y(p.im)) + '" r="5.5"/>'; });
    if (g) g.innerHTML = o;
  };
  Lab.prototype.bindRL = function (svg) {
    var self = this, drag = null;
    function pos(e) { var r = svg.getBoundingClientRect(), k = 560 / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; }
    svg.addEventListener("pointerdown", function (e) {
      if (!self.F) return;
      var g = e.target.closest("[data-pz]"), p = pos(e);
      if (g) {
        var kind = g.dataset.pz[0], i = +g.dataset.pz.slice(1);
        if (self.delMode) { (kind === "p" ? self.state.ps : self.state.zs).splice(i, 1); self.pushState(); return; }
        if (!self.editable) return;
        drag = { kind: kind, i: i };
        svg.setPointerCapture(e.pointerId); e.preventDefault();
      } else { drag = { pick: true }; svg.setPointerCapture(e.pointerId); self.pickK(p); e.preventDefault(); }
    });
    svg.addEventListener("pointermove", function (e) {
      if (!self.F) return;
      var p = pos(e), F = self.F, hv = svg.querySelector(".cs-hv-t");
      if (hv) hv.textContent = "s = " + fmt(F.ix(p.x), 3) + (F.iy(p.y) >= 0 ? " + " : " − ") + fmt(Math.abs(F.iy(p.y)), 3) + "j";
      if (!drag) return;
      if (drag.pick) { self.pickK(p); return; }
      var list = drag.kind === "p" ? self.state.ps : self.state.zs, it = list[drag.i];
      if (!it) return;
      var re = F.ix(p.x), im = F.iy(p.y), step = (F.x1 - F.x0) / 200;
      it.re = Math.round(re / step) * step;
      if (it.t === "c") it.im = Math.max(step, Math.abs(Math.round(im / step) * step));
      if (self.raf) return;
      self.raf = requestAnimationFrame(function () { self.raf = 0; self.tfIn.value = stateToText(self.state); self.recompute(); });
    });
    var end = function () { drag = null; };
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  };
  Lab.prototype.pickK = function (p) {
    if (!this.loc || !this.F) return;
    var F = this.F, best = Infinity, bk = this.K;
    this.loc.branches.forEach(function (b) {
      for (var i = 0; i < b.length; i++) { var d = Math.hypot(F.X(b[i].re) - p.x, F.Y(b[i].im) - p.y); if (d < best) { best = d; bk = b[i].k; } }
    });
    if (bk <= 0) bk = this.kLo;
    this.K = bk; this.kn.value = fmt(bk, 4); this.syncSlider(); this.updateK();
  };
  Lab.prototype.addItem = function (what) {
    var st = this.state, sc = this.rlScale();
    if (what === "pr") st.ps.push({ t: "r", re: -sc * 1.2 });
    else if (what === "pc") st.ps.push({ t: "c", re: -sc * 0.5, im: sc * 0.8 });
    else if (what === "zr") st.zs.push({ t: "r", re: -sc * 0.6 });
    else if (what === "zc") st.zs.push({ t: "c", re: -sc * 0.5, im: sc * 0.6 });
    if (CS.deg(CS.fromRoots(rootsFromItems(st.ps))) < CS.deg(CS.fromRoots(rootsFromItems(st.zs)))) { this.showErr("จำนวนขั้วต้องไม่น้อยกว่าจำนวนศูนย์"); if (what[0] === "z") st.zs.pop(); return; }
    this.showErr("");
    this.pushState();
  };

  /* ------------------------------------------------------------------- Bode */
  Lab.prototype.bodeRange = function () {
    var cs = CS.corners(this.tf), lo = 0.01, hi = 100;
    if (cs.length) { lo = Math.min.apply(null, cs) / 100; hi = Math.max.apply(null, cs) * 100; }
    else if (this.tf.delay) { hi = 30 / this.tf.delay; }
    if (hi / lo < 1e3) { var c = Math.sqrt(lo * hi); lo = c / 40; hi = c * 40; }
    lo = Math.pow(10, Math.floor(Math.log10(lo))); hi = Math.pow(10, Math.ceil(Math.log10(hi)));
    var Kf = this.Keff();
    var mg = CS.margins(this.tf, Kf, lo / 10, hi * 10);
    [mg.wgc, mg.wpc].forEach(function (w) { if (w) { lo = Math.min(lo, Math.pow(10, Math.floor(Math.log10(w)) - 1)); hi = Math.max(hi, Math.pow(10, Math.ceil(Math.log10(w)) + 1)); } });
    this.mg = mg;
    return [lo, hi];
  };
  Lab.prototype.drawBode = function () {
    var sm = this.q('svg[data-v="bodeM"]'), sp = this.q('svg[data-v="bodeP"]');
    if (!sm) return;
    var K = this.Keff(), r = this.bodeRange(), lo = r[0], hi = r[1], n = 500;
    var b = CS.bode(this.tf, lo, hi, n, K), A = bodeAsym(this.tf, K), mg = this.mg;
    var dmin = Math.min.apply(null, b.db), dmax = Math.max.apply(null, b.db);
    dmin = Math.max(dmin, -200); dmax = Math.min(dmax, 200);
    var y0 = Math.floor((dmin - 5) / 20) * 20, y1 = Math.ceil((dmax + 5) / 20) * 20;
    if (y1 - y0 < 60) { var c = (y0 + y1) / 2; y0 = Math.floor((c - 30) / 20) * 20; y1 = y0 + 60; }
    var phmin = Math.min.apply(null, b.ph), phmax = Math.max.apply(null, b.ph);
    var p0 = Math.floor((Math.min(phmin, -180) - 5) / 45) * 45, p1 = Math.ceil((Math.max(phmax, 0) + 5) / 45) * 45;
    if (p1 - p0 < 180) p1 = p0 + 180;
    var m = { l: 46, t: 10, r: 14, b: 26 };
    var FM = new Frame(560, 250, m, lo, hi, y0, y1, true), FP = new Frame(560, 230, { l: 46, t: 8, r: 14, b: 30 }, lo, hi, p0, p1, true);
    this.FM = FM; this.FP = FP; this.bdat = b;
    var self = this;
    function frameSvg(F, id, yst, yfmt, zeroLine, extra) {
      var o = "<defs>" + F.clip(id) + "</defs>" + F.box(), g = "", mn = "", lab = "";
      for (var e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
        for (var k = 1; k < 10; k++) { var w = k * Math.pow(10, e); if (w < lo * 0.9999 || w > hi * 1.0001) continue; var x = f1(F.X(w)); if (k === 1) { g += "M" + x + " " + F.m.t + "V" + (F.m.t + F.ph); lab += '<text class="cs-tk" x="' + x + '" y="' + (F.m.t + F.ph + 16) + '" text-anchor="middle">' + (e >= -2 && e <= 3 ? Math.pow(10, e) : "10^" + e) + "</text>"; } else mn += "M" + x + " " + F.m.t + "V" + (F.m.t + F.ph); }
      }
      var yt = ticks(F.y0, F.y1, 1); yt = { t: [], st: yst }; for (var v = Math.ceil(F.y0 / yst) * yst; v <= F.y1 + 1e-9; v += yst) yt.t.push(v);
      yt.t.forEach(function (v) { g += "M" + F.m.l + " " + f1(F.Y(v)) + "H" + (F.m.l + F.pw); lab += '<text class="cs-tk" x="' + (F.m.l - 5) + '" y="' + f1(F.Y(v) + 4) + '" text-anchor="end">' + String(v).replace("-", "−") + "</text>"; });
      o += '<path class="cs-gr minor" d="' + mn + '"/><path class="cs-gr" d="' + g + '"/>' + lab;
      return o;
    }
    var o = frameSvg(FM, this.id + "bm", 20);
    o += '<g clip-path="url(#' + this.id + 'bm)">';
    o += '<path class="cs-zero" d="M' + FM.m.l + " " + f1(FM.Y(0)) + "H" + (FM.m.l + FM.pw) + '"/>';
    // asymptotes
    var ap = [], ws = [lo].concat(A.corners.map(function (c) { return c.w; })).concat([hi]);
    ws.forEach(function (w) { ap.push([w, A.mag(w)]); });
    o += '<g class="cs-ans"><path class="cs-asy" d="' + pathFrom(FM, ap, true) + '"/>';
    A.corners.forEach(function (c) { o += '<path class="cs-cor" d="M' + f1(FM.X(c.w)) + " " + FM.m.t + "V" + (FM.m.t + FM.ph) + '"/>'; });
    o += "</g>";
    o += '<path class="cs-cv" d="' + pathFrom(FM, b.w.map(function (w, i) { return [w, b.db[i]]; }), true) + '"/>';
    if (mg.wgc) o += '<path class="cs-mk" d="M' + f1(FM.X(mg.wgc)) + " " + f1(FM.Y(0)) + "V" + (FM.m.t + FM.ph) + '"/>';
    if (mg.wpc) { var dbp = 20 * Math.log10(CS.cabs(CS.freqAt(this.tf, mg.wpc, K))); o += '<path class="cs-mk2" d="M' + f1(FM.X(mg.wpc)) + " " + f1(FM.Y(dbp)) + "V" + f1(FM.Y(0)) + '"/>'; }
    o += '<g class="cs-hvM"></g></g>';
    o += '<text class="cs-ax-t" x="' + (FM.m.l + 6) + '" y="' + (FM.m.t + 13) + '">|L(jω)| (dB)</text>';
    sm.innerHTML = o;
    var o2 = frameSvg(FP, this.id + "bp", 45);
    o2 += '<g clip-path="url(#' + this.id + 'bp)">';
    o2 += '<path class="cs-zero cs-m180" d="M' + FP.m.l + " " + f1(FP.Y(-180)) + "H" + (FP.m.l + FP.pw) + '"/>';
    var pp = [];
    ws.forEach(function (w) { pp.push([w, A.phase(w)]); });
    var pa = []; for (var i = 0; i <= 120; i++) { var w = lo * Math.pow(hi / lo, i / 120); pa.push([w, A.phase(w)]); }
    o2 += '<g class="cs-ans"><path class="cs-asy" d="' + pathFrom(FP, pa, true) + '"/></g>';
    o2 += '<path class="cs-cv" d="' + pathFrom(FP, b.w.map(function (w, i) { return [w, b.ph[i]]; }), true) + '"/>';
    if (mg.wgc) { var pgc = mg.gc[mg.gc.length - 1].ph; o2 += '<path class="cs-mk" d="M' + f1(FP.X(mg.wgc)) + " " + FP.m.t + "V" + (FP.m.t + FP.ph) + '"/>'; o2 += '<path class="cs-pm" d="M' + f1(FP.X(mg.wgc)) + " " + f1(FP.Y(pgc)) + "V" + f1(FP.Y(-180)) + '"/>'; }
    if (mg.wpc) o2 += '<path class="cs-mk2" d="M' + f1(FP.X(mg.wpc)) + " " + FP.m.t + "V" + (FP.m.t + FP.ph) + '"/>';
    o2 += '<g class="cs-hvP"></g></g>';
    o2 += '<text class="cs-ax-t" x="' + (FP.m.l + 6) + '" y="' + (FP.m.t + 13) + '">∠L(jω) (°)</text><text class="cs-ax-t" x="' + (FP.m.l + FP.pw) + '" y="' + (FP.m.t + FP.ph - 6) + '" text-anchor="end">ω (rad/s)</text>';
    sp.innerHTML = o2;
  };
  Lab.prototype.bodeHover = function (e) {
    var sm = this.q('svg[data-v="bodeM"]'), sp = this.q('svg[data-v="bodeP"]'), hv = this.q(".cs-hover");
    if (!sm || !this.FM) return;
    var gM = sm.querySelector(".cs-hvM"), gP = sp.querySelector(".cs-hvP");
    if (!e) { gM.innerHTML = ""; gP.innerHTML = ""; hv.textContent = ""; return; }
    var svg = e.currentTarget, r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * 560 / r.width, FM = this.FM, FP = this.FP;
    var w = FM.ix(x);
    if (w < FM.x0 || w > FM.x1) return;
    var i = Math.round(Math.log(w / this.bdat.w[0]) / Math.log(this.bdat.w[this.bdat.w.length - 1] / this.bdat.w[0]) * (this.bdat.w.length - 1));
    i = Math.max(0, Math.min(this.bdat.w.length - 1, i));
    var wv = this.bdat.w[i];
    gM.innerHTML = '<path class="cs-hv" d="M' + f1(FM.X(wv)) + " " + FM.m.t + "V" + (FM.m.t + FM.ph) + '"/><circle class="cs-hd" cx="' + f1(FM.X(wv)) + '" cy="' + f1(FM.Y(this.bdat.db[i])) + '" r="4"/>';
    gP.innerHTML = '<path class="cs-hv" d="M' + f1(FP.X(wv)) + " " + FP.m.t + "V" + (FP.m.t + FP.ph) + '"/><circle class="cs-hd" cx="' + f1(FP.X(wv)) + '" cy="' + f1(FP.Y(this.bdat.ph[i])) + '" r="4"/>';
    hv.textContent = "ω = " + fmt(wv, 4) + " rad/s · |L| = " + fmt(this.bdat.db[i], 2) + " dB (" + fmt(this.bdat.mag[i], 3) + " เท่า) · ∠L = " + fmt(this.bdat.ph[i], 1) + "°";
  };

  /* ---------------------------------------------------------------- Nyquist */
  Lab.prototype.drawNyq = function () {
    var svg = this.q('svg[data-v="nyq"]');
    if (!svg) return;
    var K = this.Keff(), ny = CS.nyquist(this.tf, K), R = this.nyqR, m = { l: 44, t: 14, r: 14, b: 26 }, W = 560, H = 400;
    var pw = W - m.l - m.r, ph = H - m.t - m.b, ry = R * ph / pw;
    var F = new Frame(W, H, m, -R * 0.55 - 0.0, R * 1.45 - 0.0, -ry, ry, false);
    // shift window so that -1 and the unit circle are centred-left
    F = new Frame(W, H, m, -R * 1.1, R * 0.9, -ry, ry, false);
    this.NF = F;
    var id = this.id + "ny", o = "<defs>" + F.clip(id) + '<marker id="' + id + 'a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="cs-arh" d="M0 0L10 5L0 10z"/></marker></defs>' + F.box();
    var tx = ticks(F.x0, F.x1, 8), ty = ticks(F.y0, F.y1, 6), g = "", lab = "";
    tx.t.forEach(function (v) { g += "M" + f1(F.X(v)) + " " + F.m.t + "V" + (F.m.t + F.ph); lab += '<text class="cs-tk" x="' + f1(F.X(v)) + '" y="' + (F.m.t + F.ph + 16) + '" text-anchor="middle">' + tickLabel(v, tx.st) + "</text>"; });
    ty.t.forEach(function (v) { g += "M" + F.m.l + " " + f1(F.Y(v)) + "H" + (F.m.l + F.pw); if (Math.abs(v) > ty.st / 2) lab += '<text class="cs-tk" x="' + (F.m.l - 5) + '" y="' + f1(F.Y(v) + 4) + '" text-anchor="end">' + tickLabel(v, ty.st) + "j</text>"; });
    o += '<path class="cs-gr" d="' + g + '"/>' + lab + '<g clip-path="url(#' + id + ')">';
    o += '<path class="cs-axl" d="M' + F.m.l + " " + f1(F.Y(0)) + "H" + (F.m.l + F.pw) + "M" + f1(F.X(0)) + " " + F.m.t + "V" + (F.m.t + F.ph) + '"/>';
    o += '<circle class="cs-uc" cx="' + f1(F.X(0)) + '" cy="' + f1(F.Y(0)) + '" r="' + f1(F.X(1) - F.X(0)) + '"/>';
    var pos = ny.pts.map(function (p) { return [p.re, p.im]; }), neg = ny.pts.map(function (p) { return [p.re, -p.im]; });
    // draw only the part inside the window (plus margin) to keep huge excursions off the figure
    var lim = R * 6, clipPts = function (a) { return a.map(function (p) { return Math.abs(p[0]) > lim || Math.abs(p[1]) > lim ? [NaN, NaN] : p; }); };
    o += '<path class="cs-cv neg" d="' + pathFrom(F, clipPts(neg), true) + '"/>';
    o += '<path class="cs-cv" d="' + pathFrom(F, clipPts(pos), true) + '"/>';
    // direction arrows at a few points on the positive branch
    var arr = "";
    for (var q = 0.25; q < 0.95; q += 0.25) {
      var i = Math.floor(q * (ny.pts.length - 2)), a = ny.pts[i], b = ny.pts[i + 1];
      if (Math.abs(a.re) < lim && Math.abs(a.im) < lim && Math.hypot(F.X(b.re) - F.X(a.re), F.Y(b.im) - F.Y(a.im)) > 0.01) {
        var ang = Math.atan2(F.Y(b.im) - F.Y(a.im), F.X(b.re) - F.X(a.re));
        arr += '<path class="cs-arr" d="M' + f1(F.X(a.re) - 5 * Math.cos(ang)) + " " + f1(F.Y(a.im) - 5 * Math.sin(ang)) + "L" + f1(F.X(a.re) + 5 * Math.cos(ang)) + " " + f1(F.Y(a.im) + 5 * Math.sin(ang)) + '" marker-end="url(#' + id + 'a)"/>';
      }
    }
    o += arr;
    o += '<path class="cs-m1" d="M' + (f1(F.X(-1)) - 6) + " " + (f1(F.Y(0)) - 6) + "l12 12m0-12l-12 12\"/>";
    o += "</g>";
    o += '<text class="cs-ax-t" x="' + (F.m.l + 6) + '" y="' + (F.m.t + 13) + '">Im</text><text class="cs-ax-t" x="' + (F.m.l + F.pw) + '" y="' + (F.m.t + F.ph - 6) + '" text-anchor="end">Re</text>';
    o += '<text class="cs-nytxt" x="' + (F.m.l + F.pw - 6) + '" y="' + (F.m.t + 16) + '" text-anchor="end">P = ' + ny.P + " · N = " + ny.N + " → Z = N + P = " + ny.Z + "</text>";
    svg.innerHTML = o;
    this.nyq = ny;
  };

  /* ------------------------------------------------------------------- step */
  Lab.prototype.drawStep = function () {
    var svg = this.q('svg[data-v="step"]');
    if (!svg) return;
    var K = this.Keff(), cl = CS.closedLoop(this.tf, K), sr;
    try { sr = CS.stepResponse(cl.N, cl.D, this.root.dataset.tend ? parseFloat(this.root.dataset.tend) : 0, 500); } catch (e) { svg.innerHTML = '<text class="cs-tk" x="20" y="40">คำนวณผลตอบสนองไม่ได้ (ฟังก์ชันไม่ proper)</text>'; return; }
    this.sr = sr;
    var ymin = Math.min.apply(null, sr.y.concat([0])), ymax = Math.max.apply(null, sr.y.concat([1]));
    var lim = 6; ymax = Math.min(ymax, lim); ymin = Math.max(ymin, -lim);
    var ya = ymin - 0.05 * (ymax - ymin), yb = ymax + 0.08 * (ymax - ymin), yt = ticks(ya, yb, 5);
    var m = { l: 40, t: 14, r: 14, b: 28 }, W = 560, H = 300;
    var F = new Frame(W, H, m, 0, sr.t[sr.t.length - 1], ya, yb, false);
    var id = this.id + "st", o = "<defs>" + F.clip(id) + "</defs>" + F.box(), g = "", lab = "";
    var tx = ticks(F.x0, F.x1, 8);
    tx.t.forEach(function (v) { g += "M" + f1(F.X(v)) + " " + F.m.t + "V" + (F.m.t + F.ph); lab += '<text class="cs-tk" x="' + f1(F.X(v)) + '" y="' + (F.m.t + F.ph + 16) + '" text-anchor="middle">' + tickLabel(v, tx.st) + "</text>"; });
    yt.t.forEach(function (v) { g += "M" + F.m.l + " " + f1(F.Y(v)) + "H" + (F.m.l + F.pw); lab += '<text class="cs-tk" x="' + (F.m.l - 5) + '" y="' + f1(F.Y(v) + 4) + '" text-anchor="end">' + tickLabel(v, yt.st) + "</text>"; });
    o += '<path class="cs-gr" d="' + g + '"/>' + lab + '<g clip-path="url(#' + id + ')">';
    o += '<path class="cs-zero" d="M' + F.m.l + " " + f1(F.Y(1)) + "H" + (F.m.l + F.pw) + '"/>';
    var info = sr.info;
    if (isFinite(info.yss) && info.stable) {
      var b2 = 0.02 * Math.abs(info.yss);
      o += '<path class="cs-band" d="M' + F.m.l + " " + f1(F.Y(info.yss + b2)) + "H" + (F.m.l + F.pw) + "V" + f1(F.Y(info.yss - b2)) + "H" + F.m.l + 'z"/>';
      if (isFinite(info.ts)) o += '<path class="cs-mk" d="M' + f1(F.X(info.ts)) + " " + F.m.t + "V" + (F.m.t + F.ph) + '"/><text class="cs-tk" x="' + f1(F.X(info.ts) + 3) + '" y="' + (F.m.t + F.ph - 5) + '">ts</text>';
      if (isFinite(info.tp) && info.Mp > 0.5) o += '<path class="cs-mk2" d="M' + f1(F.X(info.tp)) + " " + F.m.t + "V" + (F.m.t + F.ph) + '"/><text class="cs-tk" x="' + f1(F.X(info.tp) + 3) + '" y="' + (F.m.t + 12) + '">tp</text>';
    }
    o += '<path class="cs-cv" d="' + pathFrom(F, sr.t.map(function (t, i) { return [t, sr.y[i]]; }), true) + '"/></g>';
    o += '<text class="cs-ax-t" x="' + (F.m.l + F.pw) + '" y="' + (F.m.t + F.ph - 6) + '" text-anchor="end">t (s)</text><text class="cs-ax-t" x="' + (F.m.l + 6) + '" y="' + (F.m.t + 13) + '">y(t)</text>';
    svg.innerHTML = o;
  };

  /* ---------------------------------------------------------------- readout */
  Lab.prototype.drawRead = function () {
    var cp = this.cpoles(), K = this.K, o = '<div class="cs-rd"><span class="mono">K' + (this.sgn < 0 ? " (ลบ)" : "") + "</span><b>" + fmt(K, 4) + "</b></div>";
    var rhp = cp.filter(function (p) { return p.re > 1e-7; }).length, marg = cp.some(function (p) { return Math.abs(p.re) <= 1e-7; });
    var verdict = rhp ? '<b class="cs-bad">ไม่เสถียร (' + rhp + " ขั้วฝั่งขวา)</b>" : marg ? '<b class="cs-warn">เสถียรวิกฤต</b>' : '<b class="cs-ok">เสถียร</b>';
    o += '<div class="cs-rd"><span class="mono">วงปิด</span>' + verdict + "</div>";
    var seen = [];
    cp.sort(function (a, b) { return b.re - a.re; }).forEach(function (p) {
      if (p.im < -1e-9) return;
      var wn = CS.cabs(p), s = p.im > 1e-9 ? fmt(p.re, 3) + " ± j" + fmt(p.im, 3) : fmt(p.re, 4);
      seen.push('<span class="cs-pol">' + s + (p.im > 1e-9 ? ' <i>ζ=' + fmt(wn > 0 ? -p.re / wn : 0, 3) + " ωn=" + fmt(wn, 3) + "</i>" : "") + "</span>");
    });
    o += '<div class="cs-rd cs-rd-w"><span class="mono">ขั้ววงปิด</span><span>' + seen.join(" ") + "</span></div>";
    if (this.views.indexOf("bode") >= 0 && this.mg) {
      var mg = this.mg;
      o += '<div class="cs-rd"><span class="mono">GM</span><b>' + (isFinite(mg.gm) ? fmt(mg.gm, 2) + " dB @ " + fmt(mg.wpc, 3) : "∞") + '</b></div><div class="cs-rd"><span class="mono">PM</span><b>' + (isFinite(mg.pm) ? fmt(mg.pm, 1) + "° @ " + fmt(mg.wgc, 3) : "∞") + "</b></div>";
    }
    if (this.sr && this.sr.info.stable && isFinite(this.sr.info.Mp)) {
      var i = this.sr.info;
      o += '<div class="cs-rd"><span class="mono">Mp</span><b>' + fmt(i.Mp, 1) + '%</b></div><div class="cs-rd"><span class="mono">tr</span><b>' + fmt(i.tr, 3) + '</b></div><div class="cs-rd"><span class="mono">ts (2%)</span><b>' + fmt(i.ts, 3) + "</b></div>";
      if (isFinite(i.yss)) o += '<div class="cs-rd"><span class="mono">y∞</span><b>' + fmt(i.yss, 4) + "</b></div>";
    }
    this.read.innerHTML = o;
  };

  /* ------------------------------------------------------------ rules panel */
  Lab.prototype.drawRules = function () {
    if (!this.rulesEl) return;
    var rl = this.rl, sg = this.sgn, rows = [], fm = function (c) { return c.im > 1e-9 || c.im < -1e-9 ? fmt(c.re, 3) + (c.im >= 0 ? " + j" : " − j") + fmt(Math.abs(c.im), 3) : fmt(c.re, 4); };
    var segs = rl.segments.map(function (s) { return (s.to === Infinity ? "[" + fmt(s.from, 3) + ", ∞)" : s.from === -Infinity ? "(−∞, " + fmt(s.to, 3) + "]" : "[" + fmt(s.from, 3) + ", " + fmt(s.to, 3) + "]"); });
    rows.push(["1 · จุดเริ่มและจุดจบ", "n = " + rl.n + " ขั้ว (K = 0) · m = " + rl.m + " ศูนย์ (K → ∞) · " + rl.n + " กิ่ง · กิ่งที่ไปอนันต์ " + (rl.n - rl.m)]);
    rows.push(["2 · บนแกนจริง" + (sg < 0 ? " (K<0: จำนวนคู่)" : ""), segs.length ? segs.join(" , ") : "ไม่มีช่วงบนแกนจริง"]);
    if (rl.angles) rows.push(["3 · เส้นกำกับ", rl.angles.length + " เส้น มุม " + rl.angles.map(function (a) { return fmt(a, 1) + "°"; }).join(", ") + " ตัดแกนจริงที่ σa = " + fmt(rl.centroid, 4)]);
    else rows.push(["3 · เส้นกำกับ", "ไม่มี (n = m)"]);
    rows.push(["4 · จุดแยก / จุดเข้า", rl.breaks.length ? rl.breaks.map(function (b) { return "s = " + fm(b.s) + " (K = " + fmt(b.K, 4) + ")"; }).join(" · ") : "ไม่มีจุดที่ dK/ds = 0 บนโลคัส"]);
    rows.push(["5 · ตัดแกน jω", rl.cross.length ? rl.cross.map(function (c) { return "ω = ±" + fmt(c.w, 4) + " ที่ K = " + fmt(c.K, 4); }).join(" · ") : "ไม่ตัดแกน jω (ที่ K เป็นบวก)"]);
    if (rl.departure.length || rl.arrival.length)
      rows.push(["6 · มุมออก / เข้า", rl.departure.map(function (d) { return "ออกจากขั้ว " + fm(d.p) + " ที่ " + fmt(d.angle, 1) + "°"; }).concat(rl.arrival.map(function (a) { return "เข้าศูนย์ " + fm(a.z) + " ที่ " + fmt(a.angle, 1) + "°"; })).join(" · ")]);
    var gmax = rl.cross.length ? rl.cross[0].K : null;
    if (gmax != null && sg > 0) rows.push(["7 · ช่วง K ที่เสถียร (จากรูทโลคัส)", "0 < K < " + fmt(gmax, 4) + (rl.cross.length > 1 ? " (และมีจุดตัดอื่นอีก ดูจากโลคัส)" : "")]);
    this.rulesEl.innerHTML = '<div class="cs-rules-h"><b>ผลของกฎวาดรูทโลคัสสำหรับ L(s) นี้</b><span class="mono">ใช้ตรวจกับที่วาดด้วยมือ</span></div><dl class="cs-ans">' + rows.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>";
  };

  /* ------------------------------------------------------------ bootstrap */
  function init() {
    var labs = document.querySelectorAll(".cs-lab");
    for (var i = 0; i < labs.length; i++) { try { new Lab(labs[i]); } catch (e) { labs[i].textContent = "โหลดแล็บไม่สำเร็จ: " + e.message; if (window.console) console.error(e); } }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  CS.Lab = Lab; CS.ui = { Frame: Frame, ticks: ticks, tickLabel: tickLabel, pathFrom: pathFrom, esc: esc, f1: f1, bodeAsym: bodeAsym };
})();
