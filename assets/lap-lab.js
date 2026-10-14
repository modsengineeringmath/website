/* Laplace labs (plain JS). Needs mathkit.js, cs-core.js, lap-core.js and (for live TeX) /assets/vendor/katex.min.js.
   Widgets (any number per page):
   <div class="lap-inv" data-f="(s+3)/((s+1)(s+2)^2)" [data-presets='["…","…"]']>   inverse-Laplace calculator with steps
   <div class="lap-pz" data-p="-1;-2" data-z="-3" [data-k="1"] [data-roc="right|left|<index>"] [data-bilateral]>   pole–zero + ROC lab
       poles/zeros as "re" or "re±im" (a ± pair); drag them, add/remove, pick the ROC strip
   <div class="lap-cplx" data-z1="3+4j" data-z2="1-2j" [data-op="mul"]>   complex-number lab (plane, operations, forms, roots)
   <div class="lap-map" data-fn="sq|inv|exp|mob|conj|abs2|lap" [data-z0="0.8+0.6j"]>   mapping w = f(z) + Cauchy–Riemann check
   <div class="lap-surf" data-f="1/((s+1)(s^2+2s+5))">   |F(s)| landscape over the s-plane + the jω-axis slice
   <div class="lap-res" data-f="(s+2)/((s+1)(s^2+4))" [data-c="0+0j"] [data-r="1.5"]>   residue theorem: circle contour, poles inside, ∮ vs 2πjΣRes
   <div class="lap-prop" [data-base="exp"] [data-prop="shift"]>   property explorer (g(t) by definition vs ℒ⁻¹{G(s)})
   <div class="lap-ode" [data-order="2"] [data-a="1"] [data-b="3"] [data-c="2"] [data-in="step"] [data-y0="0"] [data-dy0="0"]>   ODE solver with steps */
(function () {
  "use strict";
  var MK = window.MK, CS = window.CS, LC = window.LapCore;
  if (!MK || !CS || !LC) return;
  var C = LC.C, cabs = LC.cabs;
  var nice = MK.nice, T = function (s, d) { return MK.texStr(s, d); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function parseC(str) { // "3+4j", "-2", "j", "1-2i", "2∠30"
    var s = String(str).replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/i/g, "j");
    var pol = /^([-+]?[\d.]+)∠([-+]?[\d.]+)(°)?$/.exec(s);
    if (pol) { var r = +pol[1], a = +pol[2] * Math.PI / 180; return C(r * Math.cos(a), r * Math.sin(a)); }
    var m = /^([-+]?[\d.]*(?:e[-+]?\d+)?)?(?:([-+])j?([\d.]*)j?)?$/.exec(s);
    if (/^[-+]?[\d.]*j$/.test(s)) { var v = s.replace("j", ""); return C(0, v === "" || v === "+" ? 1 : v === "-" ? -1 : +v); }
    if (/^[-+]?j[\d.]*$/.test(s)) { var w = s.replace("j", ""); var sg = w.charAt(0) === "-" ? -1 : 1; w = w.replace(/^[-+]/, ""); return C(0, sg * (w === "" ? 1 : +w)); }
    if (!m) return null;
    var re = m[1] === undefined || m[1] === "" ? 0 : +m[1], im = 0;
    if (m[2]) im = (m[2] === "-" ? -1 : 1) * (m[3] === "" ? 1 : +m[3]);
    if (!isFinite(re) || !isFinite(im)) return null;
    return C(re, im);
  }
  var fmtC = function (z, d) {
    var re = MK.fmt(z.re, d || 4), im = MK.fmt(Math.abs(z.im), d || 4);
    if (Math.abs(z.im) < 1e-12) return re;
    if (Math.abs(z.re) < 1e-12) return (z.im < 0 ? "−" : "") + "j" + im;
    return re + (z.im < 0 ? " − j" : " + j") + im;
  };
  var degs = function (a) { return a * 180 / Math.PI; };

  /* ===================================================================== s-plane drawing */
  function splane(o) {
    var W = o.w || 360, H = o.h || 340, xr = o.xr || [-6, 2], yr = o.yr || [-6, 6];
    var sx = function (x) { return (x - xr[0]) / (xr[1] - xr[0]) * W; }, sy = function (y) { return (yr[1] - y) / (yr[1] - yr[0]) * H; };
    var s = '<svg class="lap-sp" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + (o.label || "ระนาบ s") + '">';
    if (o.roc) { // strip σ in (a, b)
      var a = Math.max(o.roc[0], xr[0] - 1), b = Math.min(o.roc[1], xr[1] + 1);
      if (b > a) s += '<rect class="lap-roc" x="' + sx(a).toFixed(1) + '" y="0" width="' + (sx(b) - sx(a)).toFixed(1) + '" height="' + H + '"/>';
      if (isFinite(o.roc[0])) s += '<line class="lap-rocb" x1="' + sx(o.roc[0]).toFixed(1) + '" x2="' + sx(o.roc[0]).toFixed(1) + '" y1="0" y2="' + H + '"/>';
      if (isFinite(o.roc[1])) s += '<line class="lap-rocb" x1="' + sx(o.roc[1]).toFixed(1) + '" x2="' + sx(o.roc[1]).toFixed(1) + '" y1="0" y2="' + H + '"/>';
    }
    if (o.lhp) s += '<rect class="lap-lhp" x="0" y="0" width="' + sx(0).toFixed(1) + '" height="' + H + '"/>';
    for (var x = Math.ceil(xr[0]); x <= xr[1]; x++) s += '<line class="lap-g" x1="' + sx(x) + '" x2="' + sx(x) + '" y1="0" y2="' + H + '"/>' + (x && x % (o.tick || 2) === 0 ? '<text class="lap-tk" x="' + (sx(x) + 2) + '" y="' + (sy(0) + 12) + '">' + x + "</text>" : "");
    for (var y = Math.ceil(yr[0]); y <= yr[1]; y++) s += '<line class="lap-g" x1="0" x2="' + W + '" y1="' + sy(y) + '" y2="' + sy(y) + '"/>' + (y && y % (o.tick || 2) === 0 ? '<text class="lap-tk" x="' + (sx(0) + 3) + '" y="' + (sy(y) - 2) + '">' + y + "j</text>" : "");
    s += '<line class="lap-ax" x1="0" x2="' + W + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/><line class="lap-ax lap-jw" x1="' + sx(0) + '" x2="' + sx(0) + '" y1="0" y2="' + H + '"/>';
    s += '<text class="lap-axl" x="' + (W - 4) + '" y="' + (sy(0) - 6) + '" text-anchor="end">σ</text><text class="lap-axl" x="' + (sx(0) + 6) + '" y="13">jω</text>';
    if (o.circle) s += '<circle class="lap-cont" cx="' + sx(o.circle.c.re) + '" cy="' + sy(o.circle.c.im) + '" r="' + (o.circle.r / (xr[1] - xr[0]) * W) + '"/><circle class="lap-cc mk-drag" data-drag="c" cx="' + sx(o.circle.c.re) + '" cy="' + sy(o.circle.c.im) + '" r="6"/><circle class="lap-cr mk-drag" data-drag="r" cx="' + sx(o.circle.c.re + o.circle.r) + '" cy="' + sy(o.circle.c.im) + '" r="6"/>';
    (o.extra || []).forEach(function (e) { s += e(sx, sy); });
    (o.zeros || []).forEach(function (z, i) { s += '<circle class="lap-zero' + (o.drag ? " mk-drag" : "") + (o.sel === "z" + i ? " sel" : "") + '" data-drag="z' + i + '" cx="' + sx(z.re).toFixed(1) + '" cy="' + sy(z.im).toFixed(1) + '" r="7"/>' + (z.m > 1 ? '<text class="lap-mult" x="' + (sx(z.re) + 8) + '" y="' + (sy(z.im) - 8) + '">' + z.m + "</text>" : ""); });
    (o.poles || []).forEach(function (p, i) {
      var X = sx(p.re), Y = sy(p.im), r = 7;
      s += '<g class="lap-pole' + (o.drag ? " mk-drag" : "") + (o.sel === "p" + i ? " sel" : "") + '" data-drag="p' + i + '"><circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="11" fill="transparent" stroke="none"/><path d="M' + (X - r) + " " + (Y - r) + "L" + (X + r) + " " + (Y + r) + "M" + (X - r) + " " + (Y + r) + "L" + (X + r) + " " + (Y - r) + '"/></g>' + (p.m > 1 ? '<text class="lap-mult" x="' + (X + 9) + '" y="' + (Y - 9) + '">' + p.m + "</text>" : "");
    });
    (o.pts || []).forEach(function (p) { s += '<circle class="lap-pt ' + (p.cls || "") + (p.drag ? " mk-drag" : "") + '"' + (p.drag ? ' data-drag="' + p.drag + '"' : "") + ' cx="' + sx(p.z.re).toFixed(1) + '" cy="' + sy(p.z.im).toFixed(1) + '" r="' + (p.r || 6) + '"/>' + (p.label ? '<text class="lap-ptl" x="' + (sx(p.z.re) + 9).toFixed(1) + '" y="' + (sy(p.z.im) - 8).toFixed(1) + '">' + p.label + "</text>" : ""); });
    s += "</svg>";
    return { svg: s, inv: function (px, py) { return C(xr[0] + px / W * (xr[1] - xr[0]), yr[1] - py / H * (yr[1] - yr[0])); }, sx: sx, sy: sy };
  }
  // pointer dragging on an svg: onMove(key, userX, userY)
  function dragger(host, onMove, onDown) {
    var key = null;
    host.addEventListener("pointerdown", function (e) {
      var t = e.target.closest(".mk-drag");
      if (!t || !host.contains(t)) return;
      key = t.getAttribute("data-drag");
      if (onDown) onDown(key);
      e.preventDefault();
    });
    host.addEventListener("pointermove", function (e) {
      if (!key) return;
      var s = host.querySelector("svg.lap-sp"); // the drawing is re-rendered on every move, so look it up each time
      if (!s) return;
      var p = MK.svgPoint(s, e);
      onMove(key, p.x, p.y, s);
      e.preventDefault();
    });
    var up = function () { key = null; };
    host.addEventListener("pointerup", up); host.addEventListener("pointerleave", up); host.addEventListener("pointercancel", up);
  }
  var r2 = function (x) { return Math.round(x * 4) / 4; }; // snap to 0.25 when dragging

  /* ===================================================================== 1. inverse Laplace calculator */
  var INV_PRESETS = [
    ["(s+5)/((s+1)(s+2))", "โพลเดี่ยวจริง"],
    ["(s+3)/((s+1)(s+2)^2)", "โพลซ้ำ"],
    ["(2s+12)/(s^2+2s+5)", "โพลเชิงซ้อน"],
    ["10/(s(s^2+4s+13))", "ขั้นบันได + เชิงซ้อน"],
    ["(s^3+5s^2+9s+7)/((s+1)(s+2))", "เศษส่วนไม่แท้"],
    ["1/(s^2+1)^2", "เชิงซ้อนซ้ำ (เรโซแนนซ์)"],
    ["e^(-2s)/(s(s+1))", "หน่วงเวลา"],
    ["(1-e^(-s))/s^2", "แรมป์ตัดยอด"]
  ];
  function initInv(box) {
    var presets = INV_PRESETS;
    try { if (box.dataset.presets) presets = JSON.parse(box.dataset.presets).map(function (p) { return Array.isArray(p) ? p : [p, p]; }); } catch (e) { /* default */ }
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl" for="' + (box.id || "") + 'in">F(s) =</label><input class="lap-in" type="text" spellcheck="false" autocomplete="off" value="' + MK.esc(box.dataset.f || presets[0][0]) + '"><button type="button" class="btn btn-primary btn-sm lap-go">แปลงกลับ</button></div>' +
      '<div class="lap-chips" role="group" aria-label="ตัวอย่าง"></div>' +
      '<p class="lap-help">พิมพ์ได้ เช่น <code>(s+3)/((s+1)(s+2)^2)</code> <code>10/(s(s^2+4s+13))</code> <code>e^(-2s)/(s+1)</code> · คูณแบบชิดกันได้ ใช้ ^ แทนยกกำลัง</p>' +
      '<div class="lap-out" aria-live="polite"></div>';
    var inp = box.querySelector(".lap-in"), out = box.querySelector(".lap-out"), chips = box.querySelector(".lap-chips");
    presets.forEach(function (p) { var b = el("button", "lap-chip", MK.esc(p[1])); b.type = "button"; b.title = p[0]; b.addEventListener("click", function () { inp.value = p[0]; run(); }); chips.appendChild(b); });
    function run() {
      var r;
      try { r = LC.solve(inp.value); } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ' + MK.esc(e.message) + "</p>"; return; }
      var h = "";
      var parsed = LC.parse(inp.value);
      h += '<div class="lap-eq">' + T("F(s) = " + parsed.terms.map(function (t, i) { var r0 = LC.ratTex(t.N, t.D); return (t.T ? "e^{-" + nice(t.T) + "s}" : "") + (t.T && r0 !== "1" ? "\\cdot" : "") + (t.T && r0 === "1" ? "" : r0); }).join(" + ").replace(/\+ -/g, "- "), true) + "</div>";
      r.blocks.forEach(function (b, bi) {
        if (r.blocks.length > 1) h += '<h4 class="lap-bh">พจน์ที่ ' + (bi + 1) + (b.T ? " · มีตัวหน่วง " + T("e^{-" + nice(b.T) + "s}") + " แปลงกลับส่วนตรรกยะก่อน แล้วเลื่อนไป " + nice(b.T, { inline: true }) + " หน่วยด้วยสมบัติการเลื่อนเวลา" : "") + "</h4>";
        else if (b.T) h += '<p class="lap-note">มีตัวหน่วง ' + T("e^{-" + nice(b.T) + "s}") + " แปลงกลับเฉพาะส่วนตรรกยะ แล้วเลื่อนผลลัพธ์ไปทางขวา " + MK.fmt(b.T) + " หน่วยด้วยสมบัติการเลื่อนเวลา " + T("\\mathcal L\\{f(t-T)u(t-T)\\} = e^{-sT}F(s)") + "</p>";
        h += '<ol class="lap-steps">';
        b.steps.forEach(function (st) {
          h += "<li><b>" + st.h + "</b>";
          if (st.tex) h += '<div class="lap-eq">' + T(st.tex, true) + "</div>";
          if (st.poles) {
            h += '<table class="lap-pt"><thead><tr><th>โพล</th><th>อันดับ</th><th>ชนิด</th><th>พจน์ในเวลา</th></tr></thead><tbody>' + st.poles.map(function (P) {
              var kind = P.p.im ? "เชิงซ้อน (คู่สังยุค)" : P.p.re === 0 ? "ที่จุดกำเนิด" : "จำนวนจริง";
              var ex = P.p.re ? "e^{" + MK.coef(P.p.re) + "t}" : "", w = Math.abs(Math.abs(P.p.im) - 1) < 1e-12 ? "" : nice(Math.abs(P.p.im));
              var form = P.p.im ? (P.m > 1 ? "t^{k}" : "") + ex + "\\cos " + w + "t,\\ " + (P.m > 1 ? "t^{k}" : "") + ex + "\\sin " + w + "t" : (P.m > 1 ? "t^{k}" : "") + (ex || (P.m > 1 ? "" : "1")) + (P.m > 1 ? ",\\ k = 0.." + (P.m - 1) : "");
              return "<tr><td>" + T("s = " + LC.poleTex(P.p)) + "</td><td>" + P.m + "</td><td>" + kind + "</td><td>" + T(form) + "</td></tr>";
            }).join("") + "</tbody></table>";
          }
          if (st.list) h += st.list.map(function (c) { return '<div class="lap-eq">' + T(c.tex, true) + "</div>"; }).join("");
          h += "</li>";
        });
        h += "</ol>";
      });
      h += '<div class="lap-ans">' + T(r.finalTex, true) + "</div>";
      // plot
      var tmax = Math.max(6, r.maxT + 6);
      var slow = 0;
      r.blocks.forEach(function (b) { b.tt.forEach(function (k) { if (k.kind === "exp" && k.sigma < 0) slow = Math.max(slow, 5 / -k.sigma); }); });
      if (slow) tmax = Math.min(Math.max(tmax, r.maxT + slow), r.maxT + 40);
      var pts = MK.sample(r.f, -0.5, tmax, 500).map(function (p) { return [p[0], p[0] < 0 ? 0 : p[1]]; });
      var segs = r.deltas.map(function (d) { return { x1: d.T, y1: 0, x2: d.T, y2: d.a * 0.6, color: "var(--signal)", width: 3 }; });
      h += '<div class="lap-plot">' + MK.plot({ w: 680, h: 260, xmin: -0.5, xmax: tmax, series: [{ pts: pts, color: "var(--accent)" }], segs: segs, xlabel: "t", ylabel: "f(t)", clip: 1e3, id: MK.uid("ip") }) + "</div>";
      if (r.deltas.length) h += '<p class="lap-note">ลูกศรสีน้ำเงินแทนอิมพัลส์ ' + T("\\delta(t)") + " (และอนุพันธ์) ซึ่งเกิดจากส่วนที่เป็นพหุนามหลังหารยาว</p>";
      out.innerHTML = h;
    }
    box.querySelector(".lap-go").addEventListener("click", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    box._load = function (f) { inp.value = f; run(); };
    run();
  }

  /* ===================================================================== 2. pole–zero + ROC lab */
  function parseRoots(str) {
    var out = [];
    String(str || "").split(";").forEach(function (t) {
      t = t.trim(); if (!t) return;
      var m = /^([-+]?[\d.]+)?±j?([\d.]+)j?$/.exec(t.replace(/\s/g, "").replace(/i/g, "j"));
      if (m) { var re = +(m[1] || 0), im = +m[2]; out.push(C(re, im)); out.push(C(re, -im)); return; }
      var z = parseC(t); if (z) out.push(z);
    });
    return out;
  }
  var PZ_PRESETS = [
    { n: "ระบบอันดับหนึ่ง", p: "-2", z: "" },
    { n: "สองโพลจริง + ซีโร่", p: "-1;-3", z: "-2" },
    { n: "หน่วงน้อย (แกว่ง)", p: "-0.5±3", z: "" },
    { n: "ไม่เสถียร", p: "1;-2", z: "" },
    { n: "สัญญาณสองด้าน", p: "-1;2", z: "", roc: 1 },
    { n: "ออสซิลเลเตอร์ (บนแกน jω)", p: "0±2", z: "" },
    { n: "ซีโร่ครึ่งขวา (non-minimum phase)", p: "-1;-2", z: "1" }
  ];
  function initPZ(box) {
    var st = { p: parseRoots(box.dataset.p || "-1;-2"), z: parseRoots(box.dataset.z || ""), k: +(box.dataset.k || 1), roc: box.dataset.roc || "right", sel: null };
    var bil = box.hasAttribute("data-bilateral");
    box.innerHTML = '<div class="lap-pz-grid"><div class="lap-pz-plane"></div><div class="lap-pz-side">' +
      '<div class="lap-btns"><button type="button" class="wx-btn" data-a="rp">+ โพลจริง</button><button type="button" class="wx-btn" data-a="cp">+ คู่โพลเชิงซ้อน</button><button type="button" class="wx-btn" data-a="rz">+ ซีโร่</button><button type="button" class="wx-btn" data-a="cz">+ คู่ซีโร่</button><button type="button" class="wx-btn" data-a="del">ลบที่เลือก</button></div>' +
      '<div class="lap-roc-pick" role="group" aria-label="เลือก ROC"></div>' +
      '<div class="lap-pz-tf"></div><div class="lap-pz-flags"></div></div></div>' +
      '<div class="lap-chips"></div><div class="lap-pz-time"></div><div class="lap-pz-freq"></div>' +
      '<p class="lap-help">ลาก × (โพล) หรือ ○ (ซีโร่) บนระนาบ s คู่เชิงซ้อนขยับพร้อมกันเสมอ คลิกเพื่อเลือกแล้วกด “ลบที่เลือก” · แถบสีฟ้าคือ ROC</p>';
    var plane = box.querySelector(".lap-pz-plane"), chips = box.querySelector(".lap-chips");
    PZ_PRESETS.forEach(function (P) {
      var b = el("button", "lap-chip", P.n); b.type = "button";
      b.addEventListener("click", function () { st.p = parseRoots(P.p); st.z = parseRoots(P.z); st.roc = P.roc != null ? String(P.roc) : "right"; st.sel = null; draw(); });
      chips.appendChild(b);
    });
    function strips() { // distinct pole real parts → candidate ROC strips
      var xs = st.p.map(function (p) { return Math.round(p.re * 1e6) / 1e6; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      var out = [];
      for (var i = 0; i <= xs.length; i++) out.push([i === 0 ? -Infinity : xs[i - 1], i === xs.length ? Infinity : xs[i]]);
      return out;
    }
    function rocStrip() {
      var S = strips();
      if (st.roc === "right" || !bil) return S[S.length - 1];
      if (st.roc === "left") return S[0];
      var i = Math.max(0, Math.min(S.length - 1, +st.roc));
      return S[i];
    }
    var map;
    function draw() {
      var roc = rocStrip();
      map = splane({ w: 360, h: 340, xr: [-6, 3], yr: [-5, 5], poles: st.p, zeros: st.z, roc: roc, drag: true, sel: st.sel, label: "แผนภาพโพล-ซีโร่และ ROC" });
      plane.innerHTML = map.svg;
      // ROC chooser
      var pick = box.querySelector(".lap-roc-pick");
      if (bil) {
        var S = strips();
        pick.innerHTML = '<span class="mono">เลือก ROC (การแปลงสองด้าน)</span>' + S.map(function (s, i) {
          var cur = (st.roc === "right" && i === S.length - 1) || (st.roc === "left" && i === 0) || String(i) === st.roc;
          var lab = !isFinite(s[0]) ? "σ < " + MK.fmt(s[1]) : !isFinite(s[1]) ? "σ > " + MK.fmt(s[0]) : MK.fmt(s[0]) + " < σ < " + MK.fmt(s[1]);
          return '<button type="button" class="lap-chip' + (cur ? " on" : "") + '" data-roc="' + i + '">' + lab + "</button>";
        }).join("");
      } else pick.innerHTML = '<span class="mono">การแปลงด้านเดียว: ROC อยู่ขวาของโพลขวาสุดเสมอ</span>';
      // transfer function
      var N = CS.pscale(CS.fromRoots(st.z), st.k), D = CS.fromRoots(st.p);
      var zl = st.z.length ? LC.poleList(CS.fromRoots(st.z)) : [], pl = st.p.length ? LC.poleList(D) : [];
      var num = (Math.abs(st.k - 1) > 1e-12 || !zl.length ? nice(st.k) : "") + LC.factorTex(zl, 1);
      var den = LC.factorTex(pl, 1) || "1";
      var rocTex = !isFinite(roc[0]) && !isFinite(roc[1]) ? "\\text{ทั้งระนาบ}" : !isFinite(roc[0]) ? "\\operatorname{Re}\\{s\\} < " + nice(roc[1]) : !isFinite(roc[1]) ? "\\operatorname{Re}\\{s\\} > " + nice(roc[0]) : nice(roc[0]) + " < \\operatorname{Re}\\{s\\} < " + nice(roc[1]);
      box.querySelector(".lap-pz-tf").innerHTML = '<div class="lap-eq">' + T("X(s) = \\dfrac{" + (num || "1") + "}{" + den + "}", true) + '</div><div class="lap-eq">' + T("\\text{ROC: } " + rocTex) + "</div>";
      var causal = !isFinite(roc[1]), stable = roc[0] < 0 && roc[1] > 0;
      var proper = st.z.length <= st.p.length;
      box.querySelector(".lap-pz-flags").innerHTML =
        '<span class="lap-flag ' + (causal ? "ok" : "no") + '">' + (causal ? "✓ เป็นเหตุเป็นผล (ด้านขวา)" : (!isFinite(roc[0]) ? "✗ ด้านซ้าย (ไม่เป็นเหตุเป็นผล)" : "✗ สองด้าน")) + "</span>" +
        '<span class="lap-flag ' + (stable ? "ok" : "no") + '">' + (stable ? "✓ ROC ครอบแกน jω → เสถียร (BIBO)" : "✗ ROC ไม่ครอบแกน jω → ไม่เสถียร") + "</span>" +
        (proper ? "" : '<span class="lap-flag no">ซีโร่มากกว่าโพล: มีอิมพัลส์และอนุพันธ์ของอิมพัลส์</span>');
      // time signal
      var out = box.querySelector(".lap-pz-time");
      if (!st.p.length) { out.innerHTML = ""; return; }
      var pf = LC.pfe(N, D), tt = LC.timeTerms(pf);
      var right = [], left = [];
      tt.forEach(function (k) { if (k.kind !== "exp") return; (k.sigma <= roc[0] + 1e-9 ? right : left).push(k); });
      var f = function (t) {
        if (t >= 0) return LC.evalTerms(right, t);
        return -left.reduce(function (a, k) { var x = Math.pow(t, k.pw) / [1, 1, 2, 6, 24][k.pw] * Math.exp(k.sigma * t); return a + x * (k.omega ? k.A * Math.cos(k.omega * t) + k.B * Math.sin(k.omega * t) : k.A); }, 0);
      };
      var texR = right.map(function (k) { return LC.timeTermTex(k); }), texL = left.map(function (k) { return LC.timeTermTex(Object.assign({}, k, { A: -k.A, B: -k.B })); });
      var ftex = "x(t) = " + (texR.length ? (texR.length > 1 ? "\\left[" + LC.joinTerms(texR) + "\\right]" : texR[0]) + "u(t)" : "") + (texL.length ? (texR.length ? " + " : "") + (texL.length > 1 ? "\\left[" + LC.joinTerms(texL) + "\\right]" : texL[0]) + "u(-t)" : "");
      var deltas = tt.filter(function (k) { return k.kind === "delta"; });
      if (deltas.length) ftex += " + " + deltas.map(function (k) { return LC.timeTermTex(k); }).join(" + ");
      var pts = MK.sample(f, -6, 6, 600);
      out.innerHTML = '<div class="lap-eq">' + T(ftex.replace("= + ", "= "), true) + "</div>" + MK.plot({ w: 680, h: 220, xmin: -6, xmax: 6, series: [{ pts: pts, color: "var(--accent)" }], xlabel: "t", ylabel: "x(t)", clip: 40, id: MK.uid("pz") });
      var fr = box.querySelector(".lap-pz-freq");
      if (stable) {
        var mag = [];
        for (var i = 0; i <= 300; i++) { var w = i / 300 * 8, v = LC.evalRat(N, D, C(0, w)); mag.push([w, cabs(v)]); }
        fr.innerHTML = '<p class="lap-note">ROC ครอบแกน jω จึงหาการแปลงฟูเรียร์ได้ ' + T("X(j\\omega) = X(s)\\big|_{s=j\\omega}") + " ขนาด |X(jω)| เป็นดังนี้ (ยอดเกิดใกล้โพล หุบเกิดใกล้ซีโร่)</p>" + MK.plot({ w: 680, h: 180, xmin: 0, xmax: 8, series: [{ pts: mag, color: "var(--signal)" }], xlabel: "ω (rad/s)", ylabel: "|X(jω)|", clip: 50, id: MK.uid("pf") });
      } else fr.innerHTML = '<p class="lap-note">ROC ไม่ครอบแกน jω จึงไม่มีการแปลงฟูเรียร์ (อินทิกรัลบนแกน jω ไม่ลู่เข้า)</p>';
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]");
      if (b) {
        var a = b.getAttribute("data-a");
        if (a === "rp") st.p.push(C(-1.5, 0)); else if (a === "cp") { st.p.push(C(-1, 2)); st.p.push(C(-1, -2)); }
        else if (a === "rz") st.z.push(C(-0.5, 0)); else if (a === "cz") { st.z.push(C(-0.5, 1.5)); st.z.push(C(-0.5, -1.5)); }
        else if (a === "del" && st.sel) {
          var arr = st.sel[0] === "p" ? st.p : st.z, i = +st.sel.slice(1), z = arr[i];
          if (z.im !== 0) { var j = arr.findIndex(function (w, k) { return k !== i && Math.abs(w.re - z.re) < 1e-9 && Math.abs(w.im + z.im) < 1e-9; }); arr.splice(Math.max(i, j), 1); arr.splice(Math.min(i, j), 1); }
          else arr.splice(i, 1);
          st.sel = null;
        }
        draw(); return;
      }
      var r = e.target.closest("[data-roc]");
      if (r) { st.roc = r.getAttribute("data-roc"); draw(); }
    });
    dragger(box, function (key, x, y) {
      var z = map.inv(x, y), arr = key[0] === "p" ? st.p : st.z, i = +key.slice(1), old = arr[i];
      if (!old) return;
      var nz = C(r2(z.re), old.im === 0 ? 0 : r2(z.im));
      if (old.im !== 0) {
        if (Math.abs(nz.im) < 0.25) nz.im = old.im > 0 ? 0.25 : -0.25;
        if ((old.im > 0) !== (nz.im > 0)) nz.im = -nz.im;
        var j = arr.findIndex(function (w, k) { return k !== i && Math.abs(w.re - old.re) < 1e-9 && Math.abs(w.im + old.im) < 1e-9; });
        if (j >= 0) arr[j] = C(nz.re, -nz.im);
      }
      arr[i] = nz;
      st.sel = key;
      draw();
    }, function (key) { st.sel = key; });
    draw();
  }

  /* ===================================================================== 3. complex-number lab */
  function cpow(z, n) { var r = Math.pow(cabs(z), n), a = Math.atan2(z.im, z.re) * n; return C(r * Math.cos(a), r * Math.sin(a)); }
  function initCplx(box) {
    var st = { z1: parseC(box.dataset.z1 || "3+4j") || C(3, 4), z2: parseC(box.dataset.z2 || "1-2j") || C(1, -2), op: box.dataset.op || "mul", n: 3 };
    var OPS = [["add", "z₁ + z₂"], ["sub", "z₁ − z₂"], ["mul", "z₁ · z₂"], ["div", "z₁ / z₂"], ["conj", "z̄₁ สังยุค"], ["pow", "z₁ⁿ เดอมัวฟวร์"], ["root", "ⁿ√z₁ รากที่ n"], ["exp", "eᶻ¹ เอกซ์โพเนนเชียล"]];
    box.innerHTML = '<div class="lap-cx-grid"><div class="lap-cx-plane"></div><div class="lap-cx-side">' +
      '<div class="lap-row"><label class="lap-lbl">z₁ =</label><input class="lap-in sm" data-k="z1"><label class="lap-lbl">z₂ =</label><input class="lap-in sm" data-k="z2"></div>' +
      '<div class="lap-chips" role="group" aria-label="การดำเนินการ">' + OPS.map(function (o) { return '<button type="button" class="lap-chip" data-op="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
      '<label class="lap-row lap-n" hidden><span class="lap-lbl">n =</span><input type="range" min="2" max="8" step="1" value="3"><output>3</output></label>' +
      '<div class="lap-cx-out"></div></div></div><p class="lap-help">ลากจุด z₁ (ส้ม) และ z₂ (น้ำเงิน) หรือพิมพ์ค่า เช่น <code>3+4j</code>, <code>-2j</code>, <code>5∠53.13</code></p>';
    var plane = box.querySelector(".lap-cx-plane"), outEl = box.querySelector(".lap-cx-out"), ins = $$(".lap-in", box), nrow = box.querySelector(".lap-n");
    var map;
    function forms(z, name) {
      var r = cabs(z), a = Math.atan2(z.im, z.re);
      return '<tr><td>' + T(name) + "</td><td>" + T(MK.niceC(z.re, z.im)) + "</td><td>" + T(MK.nice(r) + "\\angle " + MK.sig(degs(a), 4) + "^\\circ") + "</td><td>" + T(MK.nice(r) + "e^{j" + MK.sig(a, 4) + "}") + "</td></tr>";
    }
    function draw() {
      var z1 = st.z1, z2 = st.z2, res = [], expl = "";
      var useZ2 = ["add", "sub", "mul", "div"].indexOf(st.op) >= 0;
      if (st.op === "add") { res = [LC.cadd(z1, z2)]; expl = "บวกส่วนจริงกับส่วนจริง ส่วนจินตภาพกับส่วนจินตภาพ = บวกเวกเตอร์แบบหัวต่อหาง"; }
      if (st.op === "sub") { res = [LC.csub(z1, z2)]; expl = "ผลต่าง z₁ − z₂ คือเวกเตอร์จากปลาย z₂ ไปปลาย z₁ ขนาด |z₁ − z₂| คือระยะทางระหว่างจุด ซึ่งเป็นหัวใจของการวัดระยะจากโพลในหน้าถัดไป"; }
      if (st.op === "mul") { res = [LC.cmul(z1, z2)]; expl = "คูณ = ขนาดคูณกัน มุมบวกกัน: |z₁z₂| = " + MK.fmt(cabs(z1) * cabs(z2)) + ", ∠ = " + MK.fmt(degs(Math.atan2(z1.im, z1.re))) + "° + " + MK.fmt(degs(Math.atan2(z2.im, z2.re))) + "°"; }
      if (st.op === "div") { res = cabs(z2) ? [LC.cdiv(z1, z2)] : []; expl = "หาร = ขนาดหารกัน มุมลบกัน หรือคูณด้วยสังยุคของตัวส่วนทั้งเศษและส่วน"; }
      if (st.op === "conj") { res = [C(z1.re, -z1.im)]; expl = "สังยุคคือภาพสะท้อนข้ามแกนจริง z·z̄ = |z|² = " + MK.fmt(cabs(z1) * cabs(z1)) + " ซึ่งเป็นจำนวนจริงเสมอ โพลของระบบจริงจึงมาเป็นคู่สังยุคเสมอ"; }
      if (st.op === "pow") { res = [cpow(z1, st.n)]; expl = "เดอมัวฟวร์: zⁿ = rⁿ∠nθ ขนาดยกกำลัง n มุมคูณ n"; }
      if (st.op === "root") { res = []; var r = Math.pow(cabs(z1), 1 / st.n), a = Math.atan2(z1.im, z1.re); for (var k = 0; k < st.n; k++) { var ang = (a + 2 * Math.PI * k) / st.n; res.push(C(r * Math.cos(ang), r * Math.sin(ang))); } expl = "รากที่ n มี n ค่าเสมอ วางอยู่บนวงกลมรัศมี " + MK.fmt(r) + " ห่างกันทุก " + MK.fmt(360 / st.n) + "° เป็นรูป " + st.n + " เหลี่ยมด้านเท่า"; }
      if (st.op === "exp") { var m = Math.exp(z1.re); res = [C(m * Math.cos(z1.im), m * Math.sin(z1.im))]; expl = "e^{σ+jω} = e^{σ}(cos ω + j sin ω): ส่วนจริงคุมขนาด ส่วนจินตภาพคุมการหมุน นี่คือที่มาของคำว่า s = σ + jω เป็น “ความถี่เชิงซ้อน”"; }
      var R = 6;
      res.concat([z1, z2]).forEach(function (z) { R = Math.max(R, Math.ceil(Math.max(Math.abs(z.re), Math.abs(z.im)) + 1)); });
      R = Math.min(R, 40);
      var arrows = function (sx, sy) {
        var s = "";
        var ar = function (z, cls, from) { from = from || C(0, 0); return '<line class="lap-vec ' + cls + '" x1="' + sx(from.re).toFixed(1) + '" y1="' + sy(from.im).toFixed(1) + '" x2="' + sx(z.re).toFixed(1) + '" y2="' + sy(z.im).toFixed(1) + '"/>'; };
        if (st.op === "root") s += '<circle class="lap-rc" cx="' + sx(0) + '" cy="' + sy(0) + '" r="' + (sx(cabs(res[0])) - sx(0)).toFixed(1) + '"/>' + '<polygon class="lap-poly" points="' + res.map(function (z) { return sx(z.re).toFixed(1) + "," + sy(z.im).toFixed(1); }).join(" ") + '"/>';
        s += ar(z1, "a");
        if (useZ2) s += ar(z2, "b");
        if (st.op === "add") s += ar(res[0], "c dash", z1) ;
        res.forEach(function (z) { s += ar(z, "c"); });
        return s;
      };
      var pts = [{ z: z1, cls: "a", drag: "z1", label: "z₁" }];
      if (useZ2) pts.push({ z: z2, cls: "b", drag: "z2", label: "z₂" });
      res.forEach(function (z, i) { pts.push({ z: z, cls: "c", r: 5, label: res.length > 1 ? "w" + "₀₁₂₃₄₅₆₇"[i] : "w" }); });
      map = splane({ w: 360, h: 360, xr: [-R, R], yr: [-R, R], tick: R > 12 ? 5 : 2, extra: [arrows], pts: pts, label: "ระนาบเชิงซ้อน" });
      plane.innerHTML = map.svg.replace(">σ<", ">Re<").replace(">jω<", ">Im<");
      var h = '<table class="lap-pt"><thead><tr><th></th><th>คาร์ทีเซียน</th><th>เชิงขั้ว</th><th>เอกซ์โพเนนเชียล</th></tr></thead><tbody>' + forms(z1, "z_1") + (useZ2 ? forms(z2, "z_2") : "") + res.map(function (z, i) { return forms(z, res.length > 1 ? "w_" + i : "w"); }).join("") + "</tbody></table>";
      outEl.innerHTML = h + '<p class="lap-note">' + MK.esc(expl) + "</p>";
      ins[0].value = fmtC(z1).replace(/ /g, "").replace(/−/g, "-");
      ins[1].value = fmtC(z2).replace(/ /g, "").replace(/−/g, "-");
      ins[1].disabled = !useZ2;
      nrow.hidden = ["pow", "root"].indexOf(st.op) < 0;
      $$("[data-op]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-op") === st.op); });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-op]"); if (b) { st.op = b.getAttribute("data-op"); draw(); } });
    ins.forEach(function (inp) { inp.addEventListener("change", function () { var z = parseC(inp.value); if (z) { st[inp.getAttribute("data-k")] = z; draw(); } }); });
    nrow.querySelector("input").addEventListener("input", function (e) { st.n = +e.target.value; nrow.querySelector("output").textContent = st.n; draw(); });
    dragger(box, function (key, x, y) { var z = map.inv(x, y); st[key] = C(Math.round(z.re * 2) / 2, Math.round(z.im * 2) / 2); draw(); });
    draw();
  }

  /* ===================================================================== 4. mapping w = f(z) + Cauchy–Riemann */
  var MAPS = {
    sq: { n: "w = z²", f: function (z) { return LC.cmul(z, z); }, an: true, note: "วิเคราะห์ทุกจุด f′(z) = 2z มุมระหว่างเส้นกริดยังตั้งฉากกัน (conformal) ยกเว้นที่ z = 0 ซึ่ง f′ = 0" },
    inv: { n: "w = 1/z", f: function (z) { return LC.cdiv(C(1, 0), z); }, an: true, note: "วิเคราะห์ทุกจุดยกเว้น z = 0 ซึ่งเป็นโพลอันดับหนึ่ง เส้นตรงกลายเป็นวงกลม" },
    exp: { n: "w = eᶻ", f: function (z) { var m = Math.exp(z.re); return C(m * Math.cos(z.im), m * Math.sin(z.im)); }, an: true, note: "วิเคราะห์ทั้งระนาบ (entire) เส้นแนวตั้ง σ คงที่ → วงกลมรัศมี e^σ เส้นแนวนอน ω คงที่ → รังสีมุม ω นี่คือการส่งจากระนาบ s ไประนาบ z ของระบบดิจิทัล z = e^{sT}" },
    mob: { n: "w = (z − 1)/(z + 1)", f: function (z) { return LC.cdiv(C(z.re - 1, z.im), C(z.re + 1, z.im)); }, an: true, note: "การแปลงเมอบิอุส วิเคราะห์ยกเว้น z = −1 ส่งแกนจินตภาพไปเป็นวงกลมหนึ่งหน่วย (แผนภูมิสมิธ และการแปลงไบลิเนียร์ใช้แนวคิดนี้)" },
    lap: { n: "w = 1/(z² + 2z + 5)", f: function (z) { return LC.cdiv(C(1, 0), C(z.re * z.re - z.im * z.im + 2 * z.re + 5, 2 * z.re * z.im + 2 * z.im)); }, an: true, note: "ฟังก์ชันตรรกยะแบบที่เจอในลาปลาซ วิเคราะห์ทุกจุดยกเว้นโพล −1 ± j2 ลองลากจุดเข้าใกล้โพล แล้วดู |w| พุ่งขึ้น" },
    conj: { n: "w = z̄", f: function (z) { return C(z.re, -z.im); }, an: false, note: "ไม่วิเคราะห์ที่ใดเลย: u_x = 1 แต่ v_y = −1 สมการโคชี-รีมันน์ไม่เป็นจริง การส่งพลิกทิศมุม (กลับข้าง) จึงไม่คงมุม" },
    abs2: { n: "w = |z|²", f: function (z) { return C(z.re * z.re + z.im * z.im, 0); }, an: false, note: "หาอนุพันธ์เชิงซ้อนได้ที่ z = 0 จุดเดียวแต่ไม่วิเคราะห์ที่ใด (ไม่มีย่านใกล้เคียงที่หาอนุพันธ์ได้) ทั้งระนาบถูกบีบลงบนแกนจริง" }
  };
  function initMap(box) {
    var st = { fn: box.dataset.fn || "sq", z0: parseC(box.dataset.z0 || "0.8+0.6j") || C(0.8, 0.6) };
    box.innerHTML = '<div class="lap-chips" role="group" aria-label="ฟังก์ชัน">' + Object.keys(MAPS).map(function (k) { return '<button type="button" class="lap-chip" data-fn="' + k + '">' + MAPS[k].n + "</button>"; }).join("") + "</div>" +
      '<div class="lap-map-grid"><figure><figcaption class="mono">ระนาบ z = x + jy (ลากจุดได้)</figcaption><div class="lap-mz"></div></figure><figure><figcaption class="mono">ระนาบ w = u + jv</figcaption><div class="lap-mw"></div></figure></div><div class="lap-map-out"></div>';
    var zEl = box.querySelector(".lap-mz"), wEl = box.querySelector(".lap-mw"), out = box.querySelector(".lap-map-out");
    var map;
    function draw() {
      var F = MAPS[st.fn], f = F.f, Rz = 2;
      map = splane({ w: 300, h: 300, xr: [-Rz, Rz], yr: [-Rz, Rz], tick: 1, extra: [function (sx, sy) {
        var s = "";
        for (var k = -4; k <= 4; k++) { var v = k / 2; s += '<line class="lap-gx" x1="' + sx(v) + '" x2="' + sx(v) + '" y1="0" y2="300"/><line class="lap-gy" x1="0" x2="300" y1="' + sy(v) + '" y2="' + sy(v) + '"/>'; }
        var h = 0.25; s += '<rect class="lap-sq" x="' + sx(st.z0.re) + '" y="' + sy(st.z0.im + h) + '" width="' + (sx(h) - sx(0)) + '" height="' + (sy(0) - sy(h)) + '"/>';
        return s;
      }], pts: [{ z: st.z0, cls: "a", drag: "z0", label: "z₀" }], label: "ระนาบ z" });
      zEl.innerHTML = map.svg.replace(">σ<", ">x<").replace(">jω<", ">jy<");
      // image of the grid lines
      var lines = [], k, t;
      for (k = -4; k <= 4; k++) {
        var v = k / 2, a = [], b = [];
        for (t = -200; t <= 200; t++) { var q = t / 100; a.push(f(C(v, q))); b.push(f(C(q, v))); }
        lines.push({ pts: a, cls: "lap-gx" }); lines.push({ pts: b, cls: "lap-gy" });
      }
      var h = 0.25, sq = [C(0, 0), C(h, 0), C(h, h), C(0, h), C(0, 0)].map(function (d) { return f(LC.cadd(st.z0, d)); });
      var sqFine = [];
      [[C(0, 0), C(h, 0)], [C(h, 0), C(h, h)], [C(h, h), C(0, h)], [C(0, h), C(0, 0)]].forEach(function (e) { for (var i = 0; i <= 20; i++) { var z = C(e[0].re + (e[1].re - e[0].re) * i / 20, e[0].im + (e[1].im - e[0].im) * i / 20); sqFine.push(f(LC.cadd(st.z0, z))); } });
      void sq;
      var w0 = f(st.z0), Rw = st.fn === "exp" ? 8 : st.fn === "sq" ? 4.5 : st.fn === "abs2" ? 8.5 : 3;
      var wm = splane({ w: 300, h: 300, xr: [-Rw, Rw], yr: [-Rw, Rw], tick: Rw > 5 ? 2 : 1, extra: [function (sx, sy) {
        var s = "";
        lines.forEach(function (L) {
          var d = "", pen = false;
          L.pts.forEach(function (z) { if (!isFinite(z.re) || !isFinite(z.im) || Math.abs(z.re) > 60 || Math.abs(z.im) > 60) { pen = false; return; } d += (pen ? "L" : "M") + sx(z.re).toFixed(1) + " " + sy(z.im).toFixed(1); pen = true; });
          s += '<path class="' + L.cls + '" d="' + d + '"/>';
        });
        s += '<path class="lap-sq" d="' + sqFine.map(function (z, i) { return (i ? "L" : "M") + sx(z.re).toFixed(1) + " " + sy(z.im).toFixed(1); }).join("") + 'Z"/>';
        return s;
      }], pts: [{ z: w0, cls: "c", label: "w₀" }], label: "ระนาบ w" });
      wEl.innerHTML = wm.svg.replace(">σ<", ">u<").replace(">jω<", ">jv<");
      // Cauchy–Riemann numerically
      var e = 1e-5, fz = f(st.z0), fx = f(C(st.z0.re + e, st.z0.im)), fy = f(C(st.z0.re, st.z0.im + e)), fx2 = f(C(st.z0.re - e, st.z0.im)), fy2 = f(C(st.z0.re, st.z0.im - e));
      var ux = (fx.re - fx2.re) / (2 * e), vx = (fx.im - fx2.im) / (2 * e), uy = (fy.re - fy2.re) / (2 * e), vy = (fy.im - fy2.im) / (2 * e);
      var ok1 = Math.abs(ux - vy) < 1e-4 * (1 + Math.abs(ux)), ok2 = Math.abs(uy + vx) < 1e-4 * (1 + Math.abs(uy));
      var fin = isFinite(fz.re) && isFinite(ux);
      out.innerHTML = '<table class="lap-pt"><tbody><tr><td>' + T("z_0") + "</td><td>" + T(MK.niceC(st.z0.re, st.z0.im)) + "</td><td>" + T("w_0 = f(z_0)") + "</td><td>" + (fin ? T(MK.sig(fz.re, 4) + (fz.im < 0 ? "-" : "+") + "j" + MK.sig(Math.abs(fz.im), 4)) : "ไม่นิยาม (โพล)") + "</td></tr>" +
        "<tr><td>" + T("u_x") + "</td><td>" + MK.fmt(ux) + "</td><td>" + T("v_y") + "</td><td>" + MK.fmt(vy) + ' <span class="lap-flag ' + (ok1 ? "ok" : "no") + '">' + (ok1 ? "u_x = v_y ✓" : "u_x ≠ v_y ✗") + "</span></td></tr>" +
        "<tr><td>" + T("u_y") + "</td><td>" + MK.fmt(uy) + "</td><td>" + T("-v_x") + "</td><td>" + MK.fmt(-vx) + ' <span class="lap-flag ' + (ok2 ? "ok" : "no") + '">' + (ok2 ? "u_y = −v_x ✓" : "u_y ≠ −v_x ✗") + "</span></td></tr>" +
        (ok1 && ok2 && fin ? "<tr><td>" + T("f'(z_0)") + "</td><td colspan=3>" + T("u_x + jv_x = " + MK.sig(ux, 4) + (vx < 0 ? "-" : "+") + "j" + MK.sig(Math.abs(vx), 4)) + " · ขยาย |f′| = " + MK.fmt(Math.hypot(ux, vx)) + " เท่า หมุน " + MK.fmt(degs(Math.atan2(vx, ux))) + "°</td></tr>" : "") +
        '</tbody></table><p class="lap-note">' + MK.esc(F.note) + "</p>";
      $$("[data-fn]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-fn") === st.fn); });
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-fn]"); if (b) { st.fn = b.getAttribute("data-fn"); draw(); } });
    dragger(box, function (key, x, y) { var z = map.inv(x, y); st.z0 = C(Math.max(-1.9, Math.min(1.7, Math.round(z.re * 20) / 20)), Math.max(-1.7, Math.min(1.9, Math.round(z.im * 20) / 20))); draw(); });
    draw();
  }

  /* ===================================================================== 5. |F(s)| landscape */
  function initSurf(box) {
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">F(s) =</label><input class="lap-in" value="' + MK.esc(box.dataset.f || "1/((s+1)(s^2+2s+5))") + '"><button type="button" class="btn btn-primary btn-sm">วาด</button></div>' +
      '<div class="lap-surf-grid"><canvas width="380" height="380" aria-label="แผนที่ความสูง |F(s)| บนระนาบ s"></canvas><div class="lap-surf-side"></div></div>' +
      '<label class="lap-row"><span class="lap-lbl">ตัดตามแนว σ =</span><input type="range" class="lap-sig" min="-3" max="2" step="0.1" value="0"><output>0</output></label><div class="lap-surf-slice"></div>' +
      '<p class="lap-help">สีอ่อน = |F(s)| ใหญ่ (ภูเขาที่โพล ยอดไม่มีที่สิ้นสุด) สีเข้ม = |F(s)| เล็ก (หลุมที่ซีโร่) เส้นแนวตั้งคือเส้นตัด Re s = σ ถ้า σ = 0 คือแกน jω ซึ่งได้ผลตอบสนองเชิงความถี่</p>';
    var cv = box.querySelector("canvas"), side = box.querySelector(".lap-surf-side"), inp = box.querySelector(".lap-in"), sig = box.querySelector(".lap-sig"), slice = box.querySelector(".lap-surf-slice");
    var cur = null;
    var X0 = -5, X1 = 3, Y0 = -5, Y1 = 5;
    function paint() {
      var tf;
      try { var p = LC.parse(inp.value); if (p.terms.length !== 1) throw new Error("ใส่ฟังก์ชันตรรกยะพจน์เดียว"); tf = p.terms[0]; } catch (e) { side.innerHTML = '<p class="lap-err">⚠ ' + MK.esc(e.message) + "</p>"; return; }
      cur = tf;
      var ctx = cv.getContext("2d"), W = cv.width, H = cv.height, img = ctx.createImageData(W, H), d = img.data;
      var dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
      for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
        var s = C(X0 + (i + 0.5) / W * (X1 - X0), Y1 - (j + 0.5) / H * (Y1 - Y0));
        var v = LC.evalRat(tf.N, tf.D, s), m = Math.log10(cabs(v) + 1e-12);
        var x = Math.max(0, Math.min(1, (m + 2) / 3.2)), band = (m * 4) % 1, line = Math.abs(band) < 0.06 || Math.abs(band) > 0.94;
        var k = (j * W + i) * 4;
        var r = dark ? 20 + 230 * x : 23 + 232 * x, g = dark ? 26 + 160 * x * x : 32 + 190 * x * x, b = dark ? 34 + 60 * x : 41 + 60 * x;
        if (line) { r *= 0.75; g *= 0.75; b *= 0.75; }
        d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      var sx = function (x) { return (x - X0) / (X1 - X0) * W; }, sy = function (y) { return (Y1 - y) / (Y1 - Y0) * H; };
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, sy(0)); ctx.lineTo(W, sy(0)); ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), H); ctx.stroke();
      ctx.strokeStyle = "#6aa6e8"; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(sx(+sig.value), 0); ctx.lineTo(sx(+sig.value), H); ctx.stroke(); ctx.setLineDash([]);
      var poles = LC.poleList(tf.D), zeros = CS.trim(tf.N).length > 1 ? LC.poleList(tf.N) : [];
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#ffffff";
      poles.forEach(function (P) { var x = sx(P.p.re), y = sy(P.p.im); ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x + 6, y - 6); ctx.stroke(); });
      zeros.forEach(function (P) { ctx.beginPath(); ctx.arc(sx(P.p.re), sy(P.p.im), 6, 0, 7); ctx.stroke(); });
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "11px IBM Plex Mono, monospace";
      ctx.fillText("σ", W - 12, sy(0) - 5); ctx.fillText("jω", sx(0) + 4, 12);
      side.innerHTML = '<div class="lap-eq">' + T("F(s) = " + LC.ratTex(tf.N, tf.D), true) + '</div><p class="mono">โพล: ' + poles.map(function (P) { return MK.esc(fmtC(P.p)) + (P.m > 1 ? " (×" + P.m + ")" : ""); }).join(", ") + (zeros.length ? "<br>ซีโร่: " + zeros.map(function (P) { return MK.esc(fmtC(P.p)); }).join(", ") : "") + "</p>";
      drawSlice();
    }
    function drawSlice() {
      if (!cur) return;
      var s0 = +sig.value, pts = [];
      box.querySelector("output").textContent = s0;
      for (var i = 0; i <= 400; i++) { var w = Y0 + (Y1 - Y0) * i / 400; pts.push([w, cabs(LC.evalRat(cur.N, cur.D, C(s0, w)))]); }
      slice.innerHTML = MK.plot({ w: 680, h: 200, xmin: Y0, xmax: Y1, series: [{ pts: pts, color: "var(--signal)" }], xlabel: "ω", ylabel: "|F(" + MK.fmt(s0) + " + jω)|", clip: 30, id: MK.uid("sl") });
    }
    box.querySelector("button").addEventListener("click", paint);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") paint(); });
    sig.addEventListener("input", function () { paint(); });
    paint();
  }

  /* ===================================================================== 6. residue theorem lab */
  function initRes(box) {
    var st = { c: parseC(box.dataset.c || "0") || C(0, 0), r: +(box.dataset.r || 1.5) };
    box.innerHTML = '<div class="lap-row"><label class="lap-lbl">F(s) =</label><input class="lap-in" value="' + MK.esc(box.dataset.f || "(s+2)/((s+1)(s^2+4))") + '"><button type="button" class="btn btn-primary btn-sm">คำนวณ</button></div>' +
      '<div class="lap-cx-grid"><div class="lap-res-plane"></div><div class="lap-res-out"></div></div><p class="lap-help">ลากจุดศูนย์กลางของวงกลม หรือจุดบนขอบเพื่อปรับรัศมี เส้นปิดวิ่งทวนเข็มนาฬิกา</p>';
    var inp = box.querySelector(".lap-in"), plane = box.querySelector(".lap-res-plane"), out = box.querySelector(".lap-res-out"), map, tf, pf;
    function compute() {
      try { var p = LC.parse(inp.value); if (p.terms.length !== 1 || p.terms[0].T) throw new Error("ใส่ฟังก์ชันตรรกยะที่ไม่มี e^(−Ts)"); tf = p.terms[0]; pf = LC.pfe(tf.N, tf.D); } catch (e) { out.innerHTML = '<p class="lap-err">⚠ ' + MK.esc(e.message) + "</p>"; return; }
      draw();
    }
    function draw() {
      if (!tf) return;
      var poles = pf.poles;
      map = splane({ w: 360, h: 360, xr: [-5, 5], yr: [-5, 5], poles: poles.map(function (P) { return { re: P.p.re, im: P.p.im, m: P.m }; }), zeros: CS.trim(tf.N).length > 1 ? LC.poleList(tf.N).map(function (P) { return { re: P.p.re, im: P.p.im, m: P.m }; }) : [], circle: { c: st.c, r: st.r }, label: "เส้นโค้งปิดรูปวงกลมรอบโพล" });
      plane.innerHTML = map.svg;
      // numeric contour integral (trapezoid on a circle is spectrally accurate)
      var n = 4096, sum = C(0, 0), onC = false;
      poles.forEach(function (P) { if (Math.abs(cabs(LC.csub(P.p, st.c)) - st.r) < 0.02) onC = true; });
      for (var k = 0; k < n; k++) {
        var th = 2 * Math.PI * k / n, e = C(Math.cos(th), Math.sin(th)), s = LC.cadd(st.c, C(st.r * e.re, st.r * e.im));
        var ds = C(-st.r * e.im * 2 * Math.PI / n, st.r * e.re * 2 * Math.PI / n);
        sum = LC.cadd(sum, LC.cmul(LC.evalRat(tf.N, tf.D, s), ds));
      }
      var inside = poles.filter(function (P) { return cabs(LC.csub(P.p, st.c)) < st.r; });
      var rs = C(0, 0);
      inside.forEach(function (P) { rs = LC.cadd(rs, P.c[0]); });
      var tpj = LC.cmul(C(0, 2 * Math.PI), rs);
      var cl = function (v) { return Math.abs(v) < 1e-9 ? 0 : v; };
      out.innerHTML = '<div class="lap-eq">' + T("F(s) = " + LC.ratTex(tf.N, tf.D), true) + '</div><table class="lap-pt"><thead><tr><th>โพล</th><th>อันดับ</th><th>เรซิดิว</th><th>อยู่ในวง?</th></tr></thead><tbody>' +
        poles.map(function (P) { var ins = cabs(LC.csub(P.p, st.c)) < st.r; return "<tr" + (ins ? ' class="in"' : "") + "><td>" + T(LC.poleTex(P.p)) + "</td><td>" + P.m + "</td><td>" + T(MK.niceC(P.c[0].re, P.c[0].im)) + "</td><td>" + (ins ? "✓ ใน" : "นอก") + "</td></tr>"; }).join("") + "</tbody></table>" +
        (onC ? '<p class="lap-err">⚠ มีโพลอยู่บนเส้นโค้งพอดี อินทิกรัลไม่นิยาม เลื่อนวงกลมออกเล็กน้อย</p>' : "") +
        '<div class="lap-eq">' + T("\\oint_C F(s)\\,ds \\approx " + MK.sig(cl(sum.re), 5) + (sum.im < 0 ? " - " : " + ") + "j" + MK.sig(Math.abs(cl(sum.im)), 5), true) + "</div>" +
        '<div class="lap-eq">' + T("2\\pi j\\sum \\operatorname{Res} = " + MK.sig(cl(tpj.re), 5) + (tpj.im < 0 ? " - " : " + ") + "j" + MK.sig(Math.abs(cl(tpj.im)), 5), true) + "</div>" +
        '<p class="lap-note">' + (inside.length ? "ทั้งสองค่าเท่ากัน: อินทิกรัลรอบเส้นปิดขึ้นกับเรซิดิวของโพลที่ถูกล้อมไว้เท่านั้น ไม่สนรูปร่างของเส้น" : "ไม่มีโพลในวง อินทิกรัลจึงเป็นศูนย์ (ทฤษฎีบทของโคชี) เพราะ F(s) วิเคราะห์ทั่วบริเวณภายใน") + "</p>";
    }
    box.querySelector("button").addEventListener("click", compute);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") compute(); });
    dragger(box, function (key, x, y) {
      var z = map.inv(x, y);
      if (key === "c") st.c = C(Math.round(z.re * 10) / 10, Math.round(z.im * 10) / 10);
      else st.r = Math.max(0.2, Math.round(cabs(LC.csub(z, st.c)) * 10) / 10);
      draw();
    });
    compute();
  }

  /* ===================================================================== 7. property explorer */
  // base signals: f(t) (t ≥ 0) and F(s) = N/D
  var BASES = {
    exp: { n: "e⁻²ᵗ u(t)", f: function (t) { return Math.exp(-2 * t); }, N: [1], D: [1, 2], tex: "e^{-2t}u(t)" },
    step: { n: "u(t)", f: function () { return 1; }, N: [1], D: [1, 0], tex: "u(t)" },
    ramp: { n: "t·u(t)", f: function (t) { return t; }, N: [1], D: [1, 0, 0], tex: "t\\,u(t)" },
    sin: { n: "sin 2t · u(t)", f: function (t) { return Math.sin(2 * t); }, N: [2], D: [1, 0, 4], tex: "\\sin(2t)\\,u(t)" },
    cos: { n: "cos 2t · u(t)", f: function (t) { return Math.cos(2 * t); }, N: [1, 0], D: [1, 0, 4], tex: "\\cos(2t)\\,u(t)" },
    damped: { n: "e⁻ᵗ sin 3t", f: function (t) { return Math.exp(-t) * Math.sin(3 * t); }, N: [3], D: [1, 2, 10], tex: "e^{-t}\\sin(3t)\\,u(t)" }
  };
  var PROPS = {
    lin: { n: "เชิงเส้น 3f(t)", tex: "\\mathcal L\\{a f(t)\\} = aF(s)", par: null },
    shift: { n: "เลื่อนเวลา f(t−T)u(t−T)", tex: "\\mathcal L\\{f(t-T)u(t-T)\\} = e^{-sT}F(s)", par: ["T", 0, 3, 1] },
    sshift: { n: "เลื่อนความถี่ e⁻ᵃᵗ f(t)", tex: "\\mathcal L\\{e^{-at}f(t)\\} = F(s+a)", par: ["a", -1, 3, 1] },
    scale: { n: "สเกลเวลา f(at)", tex: "\\mathcal L\\{f(at)\\} = \\tfrac1a F\\!\\left(\\tfrac sa\\right)", par: ["a", 0.25, 4, 2] },
    mult: { n: "คูณด้วย t", tex: "\\mathcal L\\{t f(t)\\} = -\\dfrac{dF(s)}{ds}", par: null },
    deriv: { n: "อนุพันธ์ f′(t)", tex: "\\mathcal L\\{f'(t)\\} = sF(s) - f(0^-)", par: null },
    integ: { n: "ปริพันธ์ ∫₀ᵗ f", tex: "\\mathcal L\\left\\{\\int_0^t f(\\tau)d\\tau\\right\\} = \\dfrac{F(s)}{s}", par: null },
    conv: { n: "คอนโวลูชัน f ∗ e⁻ᵗ", tex: "\\mathcal L\\{f * g\\} = F(s)G(s),\\ g = e^{-t}u(t)", par: null }
  };
  function polyComp(P, a, b) { // P(a·s + b), highest first
    var out = [0];
    P.forEach(function (c) { out = CS.padd(CS.pmul(out, [a, b]), [c]); });
    return out;
  }
  function initProp(box) {
    var st = { base: box.dataset.base || "exp", prop: box.dataset.prop || "shift", par: null };
    box.innerHTML = '<div class="lap-row"><span class="lap-lbl">สัญญาณตั้งต้น f(t)</span><span class="lap-chips lap-bases">' + Object.keys(BASES).map(function (k) { return '<button type="button" class="lap-chip" data-base="' + k + '">' + BASES[k].n + "</button>"; }).join("") + "</span></div>" +
      '<div class="lap-row"><span class="lap-lbl">คุณสมบัติ</span><span class="lap-chips">' + Object.keys(PROPS).map(function (k) { return '<button type="button" class="lap-chip" data-prop="' + k + '">' + PROPS[k].n + "</button>"; }).join("") + "</span></div>" +
      '<label class="lap-row lap-par"><span class="lap-lbl"></span><input type="range"><output></output></label>' +
      '<div class="lap-prop-out"></div>';
    var out = box.querySelector(".lap-prop-out"), parRow = box.querySelector(".lap-par"), rng = parRow.querySelector("input");
    function draw() {
      var B = BASES[st.base], P = PROPS[st.prop], v = st.par;
      if (P.par) {
        parRow.hidden = false; parRow.querySelector(".lap-lbl").textContent = P.par[0] + " =";
        rng.min = P.par[1]; rng.max = P.par[2]; rng.step = st.prop === "scale" ? 0.25 : 0.5;
        if (v == null || v < P.par[1] || v > P.par[2]) v = st.par = P.par[3];
        rng.value = v; parRow.querySelector("output").textContent = v;
      } else parRow.hidden = true;
      var N = B.N, D = B.D, delay = 0, g, gtex;
      var f = B.f;
      if (st.prop === "lin") { N = CS.pscale(N, 3); g = function (t) { return 3 * f(t); }; gtex = "3" + B.tex; }
      if (st.prop === "shift") { delay = v; g = function (t) { return t >= v ? f(t - v) : 0; }; gtex = B.tex.replace(/t/g, "(t-" + v + ")").replace("u((t-" + v + "))", "u(t-" + v + ")").replace(/\\\\,u\(\(t-[\d.]+\)\)/, ""); gtex = "f(t-" + v + ")u(t-" + v + ")"; }
      if (st.prop === "sshift") { N = polyComp(N, 1, v); D = polyComp(D, 1, v); g = function (t) { return Math.exp(-v * t) * f(t); }; gtex = v ? "e^{" + MK.coef(-v) + "t}f(t)" : "f(t)"; }
      if (st.prop === "scale") { N = polyComp(N, 1 / v, 0); D = CS.pscale(polyComp(D, 1 / v, 0), v); g = function (t) { return f(v * t); }; gtex = "f(" + MK.fmt(v) + "t)"; }
      if (st.prop === "mult") { var dN = CS.pderiv(N), dD = CS.pderiv(D); N = CS.psub(CS.pmul(N, dD), CS.pmul(dN, D)); D = CS.pmul(D, D); g = function (t) { return t * f(t); }; gtex = "t\\,f(t)"; }
      if (st.prop === "deriv") { var f0 = f(0); N = CS.psub(CS.pmul(N, [1, 0]), CS.pscale(D, f0)); g = function (t) { var h = 1e-5; return t < h ? (f(h) - f(0)) / h : (f(t + h) - f(t - h)) / (2 * h); }; gtex = "f'(t)\\ (t > 0)"; }
      if (st.prop === "integ") { D = CS.pmul(D, [1, 0]); g = function (t) { var n = 200, s = 0, h = t / n; for (var i = 0; i < n; i++) s += f((i + 0.5) * h) * h; return s; }; gtex = "\\int_0^t f(\\tau)d\\tau"; }
      if (st.prop === "conv") { D = CS.pmul(D, [1, 1]); g = function (t) { var n = 300, s = 0, h = t / n; for (var i = 0; i < n; i++) { var tau = (i + 0.5) * h; s += f(tau) * Math.exp(-(t - tau)) * h; } return s; }; gtex = "(f*g)(t)"; }
      N = CS.trim(N.map(function (c) { return Math.abs(c) < 1e-12 ? 0 : c; })); D = CS.trim(D);
      // inverse of G(s) through the engine — must match g(t) computed by definition
      var pf = LC.pfe(N, D), tt = LC.timeTerms(pf);
      var gi = function (t) { return LC.evalTerms(tt, t, delay); };
      var tmax = 6;
      var p1 = MK.sample(function (t) { return t < 0 ? 0 : f(t); }, -0.5, tmax, 360), p2 = MK.sample(function (t) { return t < 0 ? 0 : g(t); }, -0.5, tmax, 360), p3 = MK.sample(gi, -0.5, tmax, 90);
      var err = 0; [0.7, 1.9, 3.3, 4.6].forEach(function (t) { err = Math.max(err, Math.abs(g(t) - gi(t))); });
      var Gtex = (delay ? "e^{-" + MK.nice(delay) + "s}" : "") + LC.ratTex(N, D);
      out.innerHTML = '<div class="lap-eq">' + T(P.tex, true) + "</div>" +
        '<div class="lap-prop-cols"><div><span class="mono">ก่อน</span><div class="lap-eq">' + T("f(t) = " + B.tex) + '</div><div class="lap-eq">' + T("F(s) = " + LC.ratTex(B.N, B.D), true) + "</div></div>" +
        '<div><span class="mono">หลัง</span><div class="lap-eq">' + T("g(t) = " + gtex) + '</div><div class="lap-eq">' + T("G(s) = " + Gtex, true) + "</div></div></div>" +
        MK.plot({ w: 680, h: 230, xmin: -0.5, xmax: tmax, series: [{ pts: p1, color: "var(--ink-3)", dash: "5 4", width: 1.6 }, { pts: p2, color: "var(--accent)" }, ], marks: p3.filter(function (p, i) { return i % 6 === 3 && p[0] >= 0; }).map(function (p) { return { x: p[0], y: p[1], r: 3, color: "var(--signal)" }; }), xlabel: "t", id: MK.uid("pp") }) +
        '<p class="lap-note"><span class="lap-key k1"></span> f(t) เดิม · <span class="lap-key k2"></span> g(t) คำนวณจากนิยามในโดเมนเวลา · <span class="lap-key k3"></span> จุดสีน้ำเงิน = ' + T("\\mathcal L^{-1}\\{G(s)\\}") + " จากเศษส่วนย่อย ตรงกันทุกจุด (ต่างกันสูงสุด " + MK.fmt(err, 2) + ") พิสูจน์ด้วยตัวเลขว่าสูตรคุณสมบัติถูกต้อง</p>";
      $$("[data-base]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-base") === st.base); });
      $$("[data-prop]", box).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-prop") === st.prop); });
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-base]"); if (b) { st.base = b.getAttribute("data-base"); draw(); return; }
      var p = e.target.closest("[data-prop]"); if (p) { st.prop = p.getAttribute("data-prop"); st.par = null; draw(); }
    });
    rng.addEventListener("input", function () { st.par = +rng.value; draw(); });
    draw();
  }

  /* ===================================================================== 8. ODE solver */
  var INPUTS = {
    none: { n: "ไม่มีอินพุต (อิสระ)", N: [0], D: [1], tex: "0" },
    step: { n: "ขั้นบันได u(t)", N: [1], D: [1, 0], tex: "u(t)" },
    impulse: { n: "อิมพัลส์ δ(t)", N: [1], D: [1], tex: "\\delta(t)" },
    ramp: { n: "แรมป์ t", N: [1], D: [1, 0, 0], tex: "t" },
    exp: { n: "e⁻³ᵗ", N: [1], D: [1, 3], tex: "e^{-3t}" },
    sin: { n: "sin 2t", N: [2], D: [1, 0, 4], tex: "\\sin 2t" }
  };
  function initOde(box) {
    var d = box.dataset;
    var st = { order: +(d.order || 2), a: +(d.a || 1), b: +(d.b || 3), c: +(d.c || 2), K: +(d.k || 1), u: d.in || "step", y0: +(d.y0 || 0), dy0: +(d.dy0 || 0) };
    var fld = function (k, lab, step) { return '<label class="lap-f"><span>' + lab + '</span><input type="number" step="' + (step || 0.5) + '" data-k="' + k + '" value="' + st[k] + '"></label>'; };
    box.innerHTML = '<div class="lap-row lap-chips"><button type="button" class="lap-chip" data-ord="1">อันดับหนึ่ง</button><button type="button" class="lap-chip" data-ord="2">อันดับสอง</button></div>' +
      '<div class="lap-ode-eq"></div><div class="lap-fields">' + fld("a", "a") + fld("b", "b") + fld("c", "c") + fld("K", "K") + fld("y0", "y(0)") + fld("dy0", "y′(0)") + "</div>" +
      '<div class="lap-row lap-chips lap-ins">' + Object.keys(INPUTS).map(function (k) { return '<button type="button" class="lap-chip" data-u="' + k + '">' + INPUTS[k].n + "</button>"; }).join("") + "</div>" +
      '<div class="lap-ode-out"></div>';
    var out = box.querySelector(".lap-ode-out"), eqEl = box.querySelector(".lap-ode-eq");
    function draw() {
      var o2 = st.order === 2, a = o2 ? st.a : 0, b = st.b, c = st.c, U = INPUTS[st.u];
      if ((o2 && !a) || (!o2 && !b)) { out.innerHTML = '<p class="lap-err">⚠ สัมประสิทธิ์ของอนุพันธ์สูงสุดต้องไม่เป็นศูนย์</p>'; return; }
      $$('[data-k="a"],[data-k="dy0"]', box).forEach(function (i) { i.closest("label").hidden = !o2; });
      var lhs = o2 ? MK.coef(a) + "y'' " + (b ? (b < 0 ? "- " : "+ ") + MK.coef(Math.abs(b)) + "y' " : "") + (c ? (c < 0 ? "- " : "+ ") + MK.nice(Math.abs(c)) + "y" : "") : MK.coef(b) + "y' " + (c ? (c < 0 ? "- " : "+ ") + MK.nice(Math.abs(c)) + "y" : "");
      var rhs = st.u === "none" ? "0" : MK.coef(st.K) + U.tex;
      MK.tex(eqEl, lhs + " = " + rhs + ",\\qquad y(0) = " + MK.nice(st.y0) + (o2 ? ",\\ y'(0) = " + MK.nice(st.dy0) : ""), true);
      // a(s²Y − s y0 − y0') + b(sY − y0) + cY = K·U(s)
      var P = o2 ? [a, b, c] : [b, c];
      var IC = o2 ? [a * st.y0, a * st.dy0 + b * st.y0] : [b * st.y0]; // initial-condition polynomial
      IC = CS.trim(IC);
      var Un = CS.pscale(U.N, st.u === "none" ? 0 : st.K), Ud = U.D;
      // Y = (IC·Ud + Un) / (P·Ud)
      var Nzi = IC, Dzi = P;
      var Ntot = CS.padd(CS.pmul(IC, Ud), Un), Dtot = CS.pmul(P, Ud);
      var h = '<ol class="lap-steps">';
      var sY = o2 ? MK.coef(a) + "\\left[s^2Y(s) - s\\,y(0) - y'(0)\\right]" + (b ? (b < 0 ? " - " : " + ") + MK.coef(Math.abs(b)) + "\\left[sY(s) - y(0)\\right]" : "") + (c ? (c < 0 ? " - " : " + ") + MK.nice(Math.abs(c)) + "Y(s)" : "") : MK.coef(b) + "\\left[sY(s) - y(0)\\right]" + (c ? (c < 0 ? " - " : " + ") + MK.nice(Math.abs(c)) + "Y(s)" : "");
      var Utex = st.u === "none" ? "0" : LC.ratTex(CS.pscale(U.N, st.K), U.D);
      h += "<li><b>แปลงลาปลาซทั้งสองข้าง ใช้สมบัติอนุพันธ์</b>" + '<div class="lap-eq">' + T(sY + " = " + Utex, true) + "</div></li>";
      h += "<li><b>แทนค่าเริ่มต้น แล้วจัด Y(s) ไว้ข้างเดียว</b>" + '<div class="lap-eq">' + T("(" + MK.polyTex(P) + ")Y(s) = " + (IC.some(function (x) { return Math.abs(x) > 1e-12; }) ? MK.polyTex(IC) + (st.u === "none" ? "" : " + ") : "") + (st.u === "none" ? (IC.some(function (x) { return Math.abs(x) > 1e-12; }) ? "" : "0") : Utex), true) + "</div></li>";
      h += "<li><b>Y(s) = ผลจากค่าเริ่มต้น (zero-input) + ผลจากอินพุต (zero-state)</b>" + '<div class="lap-eq">' + T("Y(s) = " + (IC.some(function (x) { return Math.abs(x) > 1e-12; }) ? LC.ratTex(IC, P) : "0") + " + " + (st.u === "none" ? "0" : LC.ratTex(Un, CS.pmul(P, Ud))), true) + "</div></li>";
      var ok = Ntot.some(function (x) { return Math.abs(x) > 1e-12; });
      if (!ok) { out.innerHTML = h + "</ol><p class=\"lap-note\">ไม่มีทั้งอินพุตและค่าเริ่มต้น คำตอบคือ y(t) = 0</p>"; return; }
      var r;
      try { r = LC.pfe(Ntot, Dtot); } catch (e) { out.innerHTML = h + "</ol>"; return; }
      var tt = LC.timeTerms(r);
      var poles = LC.poleList(P);
      h += "<li><b>สมการลักษณะเฉพาะ " + T(MK.polyTex(P) + " = 0") + "</b> ได้รากของระบบ " + poles.map(function (Q) { return T("s = " + LC.poleTex(Q.p)) + (Q.m > 1 ? " (ซ้ำ " + Q.m + ")" : ""); }).join(", ") + (o2 ? " → " + charKind(a, b, c) : "") + "</li>";
      var exp = [];
      if (r.k.some(function (x) { return Math.abs(x) > 1e-12; })) exp.push(MK.polyTex(r.k));
      r.poles.forEach(function (Q) { Q.c.forEach(function (cc, j) { if (cabs(cc) > 1e-12) exp.push(LC.pfeTermTex(cc, Q.p, j + 1)); }); });
      h += "<li><b>แยกเศษส่วนย่อยของ Y(s) รวม</b>" + '<div class="lap-eq">' + T("Y(s) = " + LC.ratTex(Ntot, Dtot) + " = " + LC.joinTerms(exp), true) + "</div></li>";
      var ytex = LC.joinTerms(tt.map(function (k) { return LC.timeTermTex(k); }));
      h += "<li><b>แปลงกลับ</b>" + '<div class="lap-ans">' + T("y(t) = " + ytex + ",\\quad t \\ge 0", true) + "</div></li></ol>";
      // split zero-input / zero-state for the plot
      var fzi = IC.some(function (x) { return Math.abs(x) > 1e-12; }) ? (function () { var q = LC.timeTerms(LC.pfe(Nzi, Dzi)); return function (t) { return LC.evalTerms(q, t); }; })() : function () { return 0; };
      var fall = function (t) { return LC.evalTerms(tt, t); };
      var slow = 1;
      poles.forEach(function (Q) { if (Q.p.re < 0) slow = Math.max(slow, 5 / -Q.p.re); });
      var tmax = Math.min(Math.max(6, slow * 1.1), 40);
      var series = [{ pts: MK.sample(fall, 0, tmax, 400), color: "var(--accent)" }];
      if (IC.some(function (x) { return Math.abs(x) > 1e-12; }) && st.u !== "none") { series.push({ pts: MK.sample(fzi, 0, tmax, 400), color: "var(--ink-3)", dash: "5 4", width: 1.5 }); series.push({ pts: MK.sample(function (t) { return fall(t) - fzi(t); }, 0, tmax, 400), color: "var(--signal)", dash: "2 4", width: 1.5 }); }
      h += MK.plot({ w: 680, h: 240, xmin: 0, xmax: tmax, series: series, xlabel: "t", ylabel: "y(t)", clip: 1e3, id: MK.uid("od") });
      if (series.length > 1) h += '<p class="lap-note"><span class="lap-key k2"></span> คำตอบรวม · <span class="lap-key k1"></span> ผลจากค่าเริ่มต้น (zero-input) · <span class="lap-key k3"></span> ผลจากอินพุต (zero-state) ผลรวมของสองเส้นประคือเส้นทึบ</p>';
      if (st.u === "impulse" && o2 && Math.abs(st.y0) < 1e-12 && Math.abs(st.dy0) < 1e-12) h += '<p class="lap-note">ผลตอบสนองต่ออิมพัลส์ = ' + T("\\mathcal L^{-1}\\{H(s)\\}") + " โดยตรง เพราะ " + T("\\mathcal L\\{\\delta(t)\\} = 1") + "</p>";
      out.innerHTML = h;
      $$("[data-ord]", box).forEach(function (x) { x.classList.toggle("on", +x.getAttribute("data-ord") === st.order); });
      $$("[data-u]", box).forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-u") === st.u); });
    }
    function charKind(a, b, c) {
      var disc = b * b - 4 * a * c, z = b / (2 * Math.sqrt(Math.abs(a * c)));
      if (a * c <= 0) return "มีรากบวกหรือรากศูนย์ ระบบไม่เสถียรหรือก้ำกึ่ง";
      if (Math.abs(disc) < 1e-12) return "หน่วงวิกฤต (critically damped) ζ = 1";
      if (disc > 0) return b > 0 ? "หน่วงเกิน (overdamped) ζ = " + MK.fmt(z, 3) : "รากจริงบวก ไม่เสถียร";
      return b > 0 ? "หน่วงน้อย (underdamped) ζ = " + MK.fmt(z, 3) + " แกว่งที่ ωd = " + MK.fmt(Math.sqrt(-disc) / (2 * a), 3) + " rad/s" : b === 0 ? "ไม่มีการหน่วง แกว่งค้างที่ ωn = " + MK.fmt(Math.sqrt(c / a), 3) : "แกว่งโตขึ้น ไม่เสถียร";
    }
    box.addEventListener("click", function (e) {
      var o = e.target.closest("[data-ord]"); if (o) { st.order = +o.getAttribute("data-ord"); draw(); return; }
      var u = e.target.closest("[data-u]"); if (u) { st.u = u.getAttribute("data-u"); draw(); }
    });
    $$(".lap-fields input", box).forEach(function (i) { i.addEventListener("input", function () { var v = parseFloat(i.value); if (isFinite(v)) { st[i.getAttribute("data-k")] = v; draw(); } }); });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = o[k]; var i = box.querySelector('[data-k="' + k + '"]'); if (i) i.value = o[k]; }); draw(); };
    draw();
  }

  /* ===================================================================== boot */
  var INIT = { "lap-inv": initInv, "lap-pz": initPZ, "lap-cplx": initCplx, "lap-map": initMap, "lap-surf": initSurf, "lap-res": initRes, "lap-prop": initProp, "lap-ode": initOde };
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      $$("div." + cls, document).forEach(function (box) {
        if (box.__lap) return; box.__lap = true;
        box.classList.add("lap-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">แล็บโหลดไม่สำเร็จ: ' + MK.esc(e.message) + "</p>"; if (window.console) console.error(e); }
      });
    });
    // buttons that load an example into a calculator on the page: <button data-lap-f="…" [data-lap-target="id"]>
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lap-f]"); if (!b) return;
      var box = b.getAttribute("data-lap-target") ? document.getElementById(b.getAttribute("data-lap-target")) : document.querySelector(".lap-inv");
      if (box && box._load) { box._load(b.getAttribute("data-lap-f")); box.scrollIntoView({ behavior: "smooth", block: "start" }); }
      else location.href = "/learn/laplace-transform/inverse-laplace-transform/#f=" + encodeURIComponent(b.getAttribute("data-lap-f"));
      e.preventDefault();
    });
    var m = /#f=(.+)$/.exec(location.hash), inv = document.querySelector(".lap-inv");
    if (m && inv && inv._load) { try { inv._load(decodeURIComponent(m[1])); setTimeout(function () { inv.scrollIntoView({ block: "start" }); }, 80); } catch (e) { /* ignore */ } }
    // ODE presets: <button data-lap-ode='{"order":2,"a":1,…}'>
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lap-ode]"); if (!b) return;
      var box = document.querySelector(".lap-ode"); if (!box || !box._set) return;
      try { box._set(JSON.parse(b.getAttribute("data-lap-ode"))); box.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (x) { /* ignore */ }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
