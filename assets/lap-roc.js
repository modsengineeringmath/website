/* lap-roc.js — "why Re{s} > 0" labs for /learn/laplace-transform/why-re-s-positive/ (2026-11-25).
   No dependencies (uses window.katex when the page loads it). window.LapROC in the browser, module.exports in Node.
   Widgets (state from data-* attributes; a page button <button data-roc-set='{"sig":0.3,"om":2}' data-roc-target="id"> reloads one):
     <div class="roc-real" data-s="1" data-c="1" data-t="4">            real s only: area under c·e^(−st), A(T) and its limit
     <div class="roc-euler" data-sig="0.3" data-om="2" data-c="1" data-a="0" data-tmax="8">
          f(t) = c·e^(at) (a = 0: constant c or unit step); four linked panels: s-plane picker, Euler spiral of the integrand,
          time plot (integrand or running integral), path of the partial integral I(T) towards c/(s − a)
   Engine (pure functions): partial(c, a, sig, om, T) → [re, im] of ∫0^T c·e^(at)·e^(−st) dt; limit(c, a, sig, om) → c/(s − a) or null. */
(function (root) {
  "use strict";
  var R = {};
  var EN = typeof document !== "undefined" && /^en/i.test(document.documentElement.lang || "");
  function L(th, en) { return EN ? en : th; }

  /* ---------------------------------------------------------------- engine */
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  // e^(−(p + jq)t) = e^(−pt)(cos qt − j sin qt)
  function eneg(p, q, t) { var m = Math.exp(-p * t); return [m * Math.cos(q * t), -m * Math.sin(q * t)]; }
  R.integrand = function (c, a, sig, om, t) { var e = eneg(sig - a, om, t); return [c * e[0], c * e[1]]; };
  R.partial = function (c, a, sig, om, T) {
    var p = sig - a, q = om;
    if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) return [c * T, 0];
    var e = eneg(p, q, T);
    var r = cdiv([1 - e[0], -e[1]], [p, q]);
    return [c * r[0], c * r[1]];
  };
  R.limit = function (c, a, sig, om) {
    if (sig - a <= 1e-12) return null;
    var r = cdiv([1, 0], [sig - a, om]);
    return [c * r[0], c * r[1]];
  };
  // numerical check of the closed form (Simpson), used by the Node test
  R.simpson = function (c, a, sig, om, T, n) {
    n = n || 4000; if (n % 2) n++;
    var h = T / n, sr = 0, si = 0;
    for (var i = 0; i <= n; i++) {
      var w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2, v = R.integrand(c, a, sig, om, i * h);
      sr += w * v[0]; si += w * v[1];
    }
    return [sr * h / 3, si * h / 3];
  };
  R.state = function (sig, a, om) {
    var p = sig - a;
    if (Math.abs(p) < 1e-9) return Math.abs(om) < 1e-9 ? "zero" : "axis";
    return p > 0 ? "conv" : "div";
  };

  /* ---------------------------------------------------------------- helpers */
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function fmt(x, s) {
    if (!isFinite(x)) return x > 0 ? "∞" : "−∞";
    if (x === 0 || Math.abs(x) < 1e-300) return "0";
    var a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) { var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e); return (+m.toFixed(2)) + "×10^" + e; }
    var d = Math.max(0, (s || 4) - 1 - Math.floor(Math.log10(a)));
    return (+x.toFixed(Math.min(d, 6))).toString();
  }
  function sup(t) { return String(t).replace(/×10\^(-?\d+)/g, "×10<sup>$1</sup>"); }
  function fmtTex(x, s) {
    var t = fmt(x, s);
    return t.replace(/×10\^(-?\d+)/, "\\times10^{$1}").replace("∞", "\\infty");
  }
  function cTex(z, s) {
    var re = z[0], im = z[1];
    if (Math.abs(im) < 5e-13) return fmtTex(re, s);
    var ims = fmtTex(Math.abs(im), s);
    if (Math.abs(re) < 5e-13) return (im < 0 ? "-" : "") + (ims === "1" ? "" : ims) + "j";
    return fmtTex(re, s) + (im < 0 ? " - " : " + ") + (ims === "1" ? "" : ims) + "j";
  }
  function sTex(sig, om) { return cTex([sig, om], 3); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function tex(el, src, disp) {
    if (root.katex) { try { root.katex.render(src, el, { throwOnError: false, displayMode: !!disp }); return; } catch (e) { /* fall through */ } }
    el.textContent = src;
  }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function svgPt(svg, e) {
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    var m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    p = p.matrixTransform(m.inverse()); return { x: p.x, y: p.y };
  }
  function ticks(lo, hi, n) {
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
    return out;
  }
  function pathD(pts, sx, sy, clip) {
    var d = "", pen = false;
    for (var i = 0; i < pts.length; i++) {
      var X = sx(pts[i][0]), Y = sy(pts[i][1]);
      if (!isFinite(X) || !isFinite(Y) || (clip && (Math.abs(X) > 1e4 || Math.abs(Y) > 1e4))) { pen = false; continue; }
      d += (pen ? "L" : "M") + f1(X) + " " + f1(Y); pen = true;
    }
    return d;
  }
  // equal-aspect complex plane frame: returns {sx, sy, svg-prefix}
  function cframe(W, H, pad, pts, extra) {
    var xs = [0], ys = [0];
    pts.forEach(function (p) { if (isFinite(p[0]) && isFinite(p[1])) { xs.push(p[0]); ys.push(p[1]); } });
    (extra || []).forEach(function (p) { if (p) { xs.push(p[0]); ys.push(p[1]); } });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var span = Math.max(x1 - x0, y1 - y0, 1e-6) * 1.18, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var k = Math.min(W - 2 * pad, H - 2 * pad) / span;
    var sx = function (v) { return W / 2 + (v - cx) * k; }, sy = function (v) { return H / 2 - (v - cy) * k; };
    var g = "", tk = ticks(cx - (W / 2 - 4) / k, cx + (W / 2 - 4) / k, 5), tky = ticks(cy - (H / 2 - 4) / k, cy + (H / 2 - 4) / k, 5);
    tk.forEach(function (v) { var X = sx(v); g += '<line class="mf-g" x1="' + f1(X) + '" y1="0" x2="' + f1(X) + '" y2="' + H + '"/>' + (v ? '<text class="roc-k" x="' + f1(X) + '" y="' + f1(Math.min(H - 4, Math.max(12, sy(0) + 13))) + '" text-anchor="middle">' + fmt(v, 2) + "</text>" : ""); });
    tky.forEach(function (v) { var Y = sy(v); g += '<line class="mf-g" x1="0" y1="' + f1(Y) + '" x2="' + W + '" y2="' + f1(Y) + '"/>' + (v ? '<text class="roc-k" x="' + f1(Math.min(W - 30, Math.max(3, sx(0) + 4))) + '" y="' + f1(Y - 3) + '">' + fmt(v, 2) + "j</text>" : ""); });
    g += '<line class="mf-ax" x1="0" y1="' + f1(sy(0)) + '" x2="' + W + '" y2="' + f1(sy(0)) + '"/><line class="mf-ax" x1="' + f1(sx(0)) + '" y1="0" x2="' + f1(sx(0)) + '" y2="' + H + '"/>';
    return { sx: sx, sy: sy, k: k, grid: g };
  }
  function star(X, Y, r, cls) {
    var d = "";
    for (var i = 0; i < 10; i++) { var ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + f1(X + rr * Math.cos(ang)) + " " + f1(Y + rr * Math.sin(ang)); }
    return '<path class="' + cls + '" d="' + d + 'Z"/>';
  }
  function slider(key, label, min, max, step, val, unit) {
    return '<label class="roc-sl"><span class="roc-lbl">' + label + '</span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><input class="roc-num" type="number" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' + (unit ? '<span class="roc-u">' + unit + "</span>" : "") + "</label>";
  }
  function bindSliders(box, st, redraw) {
    Array.prototype.forEach.call(box.querySelectorAll("input[data-k]"), function (inp) {
      inp.addEventListener("input", function () {
        var v = parseFloat(inp.value); if (!isFinite(v)) return;
        var k = inp.getAttribute("data-k"); st[k] = v;
        Array.prototype.forEach.call(box.querySelectorAll('input[data-k="' + k + '"]'), function (o) { if (o !== inp) o.value = v; });
        redraw(k);
      });
    });
  }
  function syncSliders(box, st) {
    Array.prototype.forEach.call(box.querySelectorAll("input[data-k]"), function (o) { var k = o.getAttribute("data-k"); if (k in st) o.value = +(+st[k]).toFixed(4); });
  }
  var VERDICT = {
    conv: ["ok", L("ลู่เข้า", "Converges")],
    axis: ["warn", L("แกว่งค้าง ไม่ลู่เข้า", "Oscillates, no limit")],
    zero: ["bad", L("โตเป็นเส้นตรง → ∞", "Grows linearly → ∞")],
    div: ["bad", L("ลู่ออก → ∞", "Diverges → ∞")]
  };

  /* ============================================================ widget 1: real s */
  function initReal(box) {
    var st = { s: +(box.dataset.s || 1), c: +(box.dataset.c || 1), T: +(box.dataset.t || 4) };
    box.innerHTML =
      '<p class="roc-title">' + L("แล็บ 1 · ให้ s เป็นจำนวนจริงก่อน: พื้นที่ใต้ c·e<sup>−st</sup>", "Lab 1 · Real s first: the area under c·e<sup>−st</sup>") + "</p>" +
      '<div class="roc-ctl">' + slider("s", "s =", -1, 2, 0.05, st.s) + slider("c", "c =", 0.5, 4, 0.5, st.c) + slider("T", "T =", 0.5, 40, 0.5, st.T) + "</div>" +
      '<div class="lap-chips roc-chips">' + [[1, "s = 1"], [0.3, "s = 0.3"], [0.05, "s = 0.05"], [0, "s = 0"], [-0.3, "s = −0.3"]].map(function (p) { return '<button type="button" class="lap-chip" data-s="' + p[0] + '">' + p[1] + "</button>"; }).join("") + "</div>" +
      '<div class="roc-grid2"><figure class="roc-fig"><figcaption>' + L("ฟังก์ชันใต้อินทิกรัล c·e<sup>−st</sup> และพื้นที่ 0 ถึง T", "Integrand c·e<sup>−st</sup> and the area from 0 to T") + '</figcaption><svg class="roc-svg roc-r1" viewBox="0 0 360 230" role="img" aria-label="' + L("กราฟ c e^(−st)", "plot of c e^(−st)") + '"></svg></figure>' +
      '<figure class="roc-fig"><figcaption>' + L("พื้นที่สะสม A(T) เมื่อ T โตขึ้น", "Accumulated area A(T) as T grows") + '</figcaption><svg class="roc-svg roc-r2" viewBox="0 0 360 230" role="img" aria-label="' + L("กราฟ A(T)", "plot of A(T)") + '"></svg></figure></div>' +
      '<div class="roc-out"></div>';
    var g1 = $(".roc-r1", box), g2 = $(".roc-r2", box), out = $(".roc-out", box);
    function draw() {
      var s = st.s, c = st.c, T = st.T, W = 360, H = 230, Lm = 36, Rm = 10, Tm = 12, Bm = 26;
      // panel 1: integrand on [0, 10] (or T if larger, up to 40)
      var t1 = Math.max(6, Math.min(40, T * 1.25)), ymax = c * 2.6;
      var sx = function (t) { return Lm + t / t1 * (W - Lm - Rm); }, sy = function (v) { return Tm + (ymax - v) / ymax * (H - Tm - Bm); };
      var n = 300, pts = [], area = [];
      for (var i = 0; i <= n; i++) { var t = t1 * i / n; pts.push([t, c * Math.exp(-s * t)]); if (t <= T) area.push([t, Math.min(c * Math.exp(-s * t), ymax * 1.05)]); }
      area.push([T, Math.min(c * Math.exp(-s * T), ymax * 1.05)]);
      var A = "M" + f1(sx(0)) + " " + f1(sy(0)) + area.map(function (p) { return "L" + f1(sx(p[0])) + " " + f1(sy(p[1])); }).join("") + "L" + f1(sx(T)) + " " + f1(sy(0)) + "Z";
      var gr = "";
      ticks(0, t1, 6).forEach(function (v) { gr += '<line class="mf-g" x1="' + f1(sx(v)) + '" y1="' + Tm + '" x2="' + f1(sx(v)) + '" y2="' + (H - Bm) + '"/><text class="roc-k" x="' + f1(sx(v)) + '" y="' + (H - Bm + 14) + '" text-anchor="middle">' + fmt(v, 3) + "</text>"; });
      ticks(0, ymax, 4).forEach(function (v) { gr += '<line class="mf-g" x1="' + Lm + '" y1="' + f1(sy(v)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy(v)) + '"/><text class="roc-k" x="' + (Lm - 4) + '" y="' + f1(sy(v) + 3) + '" text-anchor="end">' + fmt(v, 2) + "</text>"; });
      g1.innerHTML = '<defs><clipPath id="' + box.id + 'c1"><rect x="' + Lm + '" y="' + Tm + '" width="' + (W - Lm - Rm) + '" height="' + (H - Tm - Bm) + '"/></clipPath></defs>' + gr +
        '<line class="mf-ax" x1="' + Lm + '" y1="' + f1(sy(0)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy(0)) + '"/><line class="mf-ax" x1="' + Lm + '" y1="' + Tm + '" x2="' + Lm + '" y2="' + (H - Bm) + '"/>' +
        '<g clip-path="url(#' + box.id + 'c1)"><path class="roc-area' + (s > 0 ? "" : " bad") + '" d="' + A + '"/><path class="mf-sig" d="' + pathD(pts, sx, sy, true) + '"/></g>' +
        '<line class="mf-dash" x1="' + f1(sx(T)) + '" y1="' + Tm + '" x2="' + f1(sx(T)) + '" y2="' + (H - Bm) + '"/><text class="roc-k" x="' + f1(sx(T) + 3) + '" y="' + (Tm + 10) + '">T</text><text class="roc-k" x="' + (W - Rm) + '" y="' + (H - 3) + '" text-anchor="end">t</text>' +
        (c * Math.exp(-s * t1) > ymax ? '<text class="roc-warn-t" x="' + (W - Rm - 4) + '" y="' + (Tm + 12) + '" text-anchor="end">' + L("กราฟพุ่งทะลุกรอบ ↑", "curve leaves the frame ↑") + "</text>" : "");
      // panel 2: A(T) on [0, max(T*1.2, 10)]
      var tA = Math.max(10, Math.min(60, T * 1.3)), Aend = R.partial(c, 0, s, 0, tA)[0], lim = s > 0 ? c / s : null;
      var amax = Math.max(lim ? lim * 1.25 : 0, Math.min(Aend, lim ? lim * 3 : Infinity), c * 1.5);
      if (!lim) amax = Math.max(amax, Math.min(Aend, c * 30));
      var sx2 = function (t) { return Lm + t / tA * (W - Lm - Rm); }, sy2 = function (v) { return Tm + (amax - v) / amax * (H - Tm - Bm); };
      var p2 = []; for (i = 0; i <= n; i++) { t = tA * i / n; p2.push([t, R.partial(c, 0, s, 0, t)[0]]); }
      var AT = R.partial(c, 0, s, 0, T)[0];
      gr = "";
      ticks(0, tA, 6).forEach(function (v) { gr += '<line class="mf-g" x1="' + f1(sx2(v)) + '" y1="' + Tm + '" x2="' + f1(sx2(v)) + '" y2="' + (H - Bm) + '"/><text class="roc-k" x="' + f1(sx2(v)) + '" y="' + (H - Bm + 14) + '" text-anchor="middle">' + fmt(v, 3) + "</text>"; });
      ticks(0, amax, 4).forEach(function (v) { gr += '<line class="mf-g" x1="' + Lm + '" y1="' + f1(sy2(v)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy2(v)) + '"/><text class="roc-k" x="' + (Lm - 4) + '" y="' + f1(sy2(v) + 3) + '" text-anchor="end">' + fmt(v, 3) + "</text>"; });
      g2.innerHTML = '<defs><clipPath id="' + box.id + 'c2"><rect x="' + Lm + '" y="' + Tm + '" width="' + (W - Lm - Rm) + '" height="' + (H - Tm - Bm) + '"/></clipPath></defs>' + gr +
        '<line class="mf-ax" x1="' + Lm + '" y1="' + f1(sy2(0)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy2(0)) + '"/><line class="mf-ax" x1="' + Lm + '" y1="' + Tm + '" x2="' + Lm + '" y2="' + (H - Bm) + '"/>' +
        (lim ? '<line class="mf-dash" x1="' + Lm + '" y1="' + f1(sy2(lim)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy2(lim)) + '"/><text class="roc-k" x="' + (W - Rm - 2) + '" y="' + f1(sy2(lim) - 4) + '" text-anchor="end">c/s = ' + fmt(lim, 4) + "</text>" : "") +
        '<g clip-path="url(#' + box.id + 'c2)"><path class="mf-sig2" d="' + pathD(p2, sx2, sy2, true) + '"/></g>' +
        (AT <= amax ? '<circle class="mf-dot" cx="' + f1(sx2(T)) + '" cy="' + f1(sy2(AT)) + '" r="4.5"/>' : "") +
        '<text class="roc-k" x="' + (W - Rm) + '" y="' + (H - 3) + '" text-anchor="end">T</text>';
      var stt = R.state(s, 0, 0), v = VERDICT[stt];
      var rows = [1, 5, 10, 50, 100].map(function (TT) { return "<tr><td>" + TT + "</td><td>" + sup(fmt(Math.exp(-s * TT), 4)) + "</td><td>" + sup(fmt(R.partial(c, 0, s, 0, TT)[0], 5)) + "</td></tr>"; }).join("");
      out.innerHTML = '<div class="roc-verdict ' + v[0] + '"><b>' + v[1] + '</b> <span class="roc-m1"></span></div><div class="roc-m roc-m2"></div>' +
        '<div class="roc-tablewrap"><table class="roc-tab"><thead><tr><th>T</th><th>e<sup>−sT</sup></th><th>A(T)</th></tr></thead><tbody>' + rows + '<tr class="lim"><td>∞</td><td>' + (s > 0 ? "0" : s === 0 ? "1" : "∞") + "</td><td>" + (s > 0 ? fmt(c / s, 5) : "∞") + "</td></tr></tbody></table></div>";
      var m1 = $(".roc-m1", out), m2 = $(".roc-m2", out);
      if (stt === "conv") tex(m1, "e^{-sT}\\to 0,\\quad A(T)\\to \\dfrac{c}{s} = " + fmtTex(c / s, 4));
      else if (stt === "zero") tex(m1, "s=0:\\ A(T)=\\int_0^T c\\,dt = cT\\to\\infty");
      else tex(m1, "s<0:\\ e^{-sT}=e^{" + fmtTex(-s, 3) + "T}\\to\\infty");
      tex(m2, "A(T)=\\int_0^{T} c\\,e^{-st}\\,dt=\\frac{c\\,(1-e^{-sT})}{s}" + (s !== 0 ? "=\\frac{" + fmtTex(c) + "\\,(1-e^{" + fmtTex(-s * T, 3) + "})}{" + fmtTex(s) + "}" : "") + "=" + fmtTex(AT, 5), true);
    }
    bindSliders(box, st, draw);
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-s]"); if (b && b.tagName === "BUTTON") { st.s = +b.getAttribute("data-s"); syncSliders(box, st); draw(); } });
    box._set = function (o) { Object.keys(o).forEach(function (k) { st[k] = +o[k]; }); syncSliders(box, st); draw(); };
    draw();
  }

  /* ============================================================ widget 2: complex s, Euler */
  var PRESETS = [
    { n: "s = 1", sig: 1, om: 0, a: 0 },
    { n: "s = 0.3 + 2j", sig: 0.3, om: 2, a: 0 },
    { n: L("s = 0.08 + 3j (ใกล้ขอบ)", "s = 0.08 + 3j (near the edge)"), sig: 0.08, om: 3, a: 0 },
    { n: L("s = 2j (บนแกน jω)", "s = 2j (on the jω axis)"), sig: 0, om: 2, a: 0 },
    { n: "s = 0", sig: 0, om: 0, a: 0 },
    { n: "s = −0.15 + 2j", sig: -0.15, om: 2, a: 0 },
    { n: L("f = eᵗ, s = 2 + j", "f = eᵗ, s = 2 + j"), sig: 2, om: 1, a: 1 }
  ];
  function initEuler(box) {
    var st = { sig: +(box.dataset.sig || 0.3), om: +(box.dataset.om || 2), c: +(box.dataset.c || 1), a: +(box.dataset.a || 0), T: +(box.dataset.tmax || 8), t: 0, view: box.dataset.view || "f", play: false };
    st.t = +(box.dataset.t || st.T * 0.6);
    var showA = box.hasAttribute("data-show-a") || st.a !== 0;
    box.innerHTML =
      '<p class="roc-title">' + L("แล็บ 2 · s เป็นจำนวนเชิงซ้อน: เอกลักษณ์ออยเลอร์ทำงานอย่างไรในอินทิกรัลลาปลาซ", "Lab 2 · Complex s: Euler's identity inside the Laplace integral") + "</p>" +
      '<div class="roc-ctl">' + slider("sig", "σ = Re s", -1, 2.5, 0.01, st.sig) + slider("om", "ω = Im s", -8, 8, 0.05, st.om) + slider("c", "c =", 0.5, 4, 0.5, st.c) +
      '<span class="roc-adv"' + (showA ? "" : " hidden") + ">" + slider("a", "a (f = c·e<sup>at</sup>)", -1, 1.5, 0.05, st.a) + "</span>" + slider("T", L("ดูถึง t =", "show up to t ="), 1, 30, 0.5, st.T) + "</div>" +
      '<div class="lap-chips roc-chips">' + PRESETS.map(function (p, i) { return '<button type="button" class="lap-chip" data-pre="' + i + '">' + esc(p.n) + "</button>"; }).join("") +
      '<button type="button" class="lap-chip roc-advbtn" aria-pressed="' + showA + '">' + L("ขั้นสูง: f(t) = c·e<sup>at</sup>", "Advanced: f(t) = c·e<sup>at</sup>") + "</button></div>" +
      '<div class="roc-play"><button type="button" class="btn btn-primary btn-sm roc-go">▶ ' + L("เล่น", "Play") + '</button><label class="roc-sl roc-tsl"><span class="roc-lbl">t =</span><input type="range" class="roc-t" min="0" max="1" step="0.001" value="0.6"><output class="roc-tv mono"></output></label></div>' +
      '<div class="roc-grid4">' +
      '<figure class="roc-fig"><figcaption>' + L("① ระนาบ s — ลากจุด s ได้ (แถบสี = ROC)", "① s-plane — drag s (shaded = ROC)") + '</figcaption><svg class="roc-svg roc-sp" viewBox="0 0 300 300" role="img" aria-label="' + L("ระนาบ s เลือกค่า s", "s-plane picker") + '"></svg></figure>' +
      '<figure class="roc-fig"><figcaption>' + L("② ออยเลอร์: c·e<sup>−st</sup> = c·e<sup>−σt</sup>·e<sup>−jωt</sup> หมุนพร้อมหด/ขยาย", "② Euler: c·e<sup>−st</sup> = c·e<sup>−σt</sup>·e<sup>−jωt</sup> rotates while shrinking/growing") + '</figcaption><svg class="roc-svg roc-eu" viewBox="0 0 300 300" role="img" aria-label="' + L("เกลียวของ e^(−st) บนระนาบเชิงซ้อน", "spiral of e^(−st) in the complex plane") + '"></svg></figure>' +
      '<figure class="roc-fig roc-wide"><figcaption><span class="roc-tabs"><button type="button" class="lap-chip" data-view="f">' + L("③ ส่วนจริง/จินตภาพของฟังก์ชันใต้อินทิกรัล", "③ Real/imaginary parts of the integrand") + '</button><button type="button" class="lap-chip" data-view="i">' + L("③ อินทิกรัลสะสมแยกส่วนจริง/จินตภาพ", "③ Running integral, real and imaginary parts") + '</button></span></figcaption><svg class="roc-svg roc-tp" viewBox="0 0 640 220" role="img" aria-label="' + L("กราฟเทียบเวลา", "time plot") + '"></svg></figure>' +
      '<figure class="roc-fig"><figcaption>' + L("④ เส้นทางของ I(T) = ∫<sub>0</sub><sup>T</sup> บนระนาบเชิงซ้อน → ★ = c/s", "④ Path of I(T) = ∫<sub>0</sub><sup>T</sup> in the complex plane → ★ = c/s") + '</figcaption><svg class="roc-svg roc-ip" viewBox="0 0 300 300" role="img" aria-label="' + L("เส้นทางของอินทิกรัลบางส่วน", "path of the partial integral") + '"></svg></figure>' +
      '<div class="roc-out roc-side"></div>' +
      "</div>";
    var sp = $(".roc-sp", box), eu = $(".roc-eu", box), tp = $(".roc-tp", box), ip = $(".roc-ip", box), out = $(".roc-side", box);
    var tIn = $(".roc-t", box), tOut = $(".roc-tv", box), go = $(".roc-go", box);
    // s-plane map
    var SX = [-1, 2.5], SY = [-8, 8], P = 22, WW = 300;
    function sx(v) { return P + (v - SX[0]) / (SX[1] - SX[0]) * (WW - 2 * P); }
    function sy(v) { return P + (SY[1] - v) / (SY[1] - SY[0]) * (WW - 2 * P); }
    function ix(X) { return SX[0] + (X - P) / (WW - 2 * P) * (SX[1] - SX[0]); }
    function iy(Y) { return SY[1] - (Y - P) / (WW - 2 * P) * (SY[1] - SY[0]); }
    function tEff() { var p = st.sig - st.a; return p < 0 ? Math.min(st.T, Math.log(40) / -p) : st.T; }

    function drawPlane() {
      var g = "", a = Math.max(SX[0], Math.min(SX[1], st.a));
      g += '<rect class="mf-bg" x="' + P + '" y="' + P + '" width="' + (WW - 2 * P) + '" height="' + (WW - 2 * P) + '" rx="6"/>';
      g += '<rect class="mf-roc" x="' + f1(sx(a)) + '" y="' + P + '" width="' + f1(sx(SX[1]) - sx(a)) + '" height="' + (WW - 2 * P) + '"/>';
      for (var k = Math.ceil(SX[0] * 2) / 2; k <= SX[1]; k += 0.5) g += '<line class="mf-g" x1="' + f1(sx(k)) + '" y1="' + P + '" x2="' + f1(sx(k)) + '" y2="' + (WW - P) + '"/>' + (k % 1 === 0 && k ? '<text class="roc-k" x="' + f1(sx(k)) + '" y="' + f1(sy(0) + 12) + '" text-anchor="middle">' + k + "</text>" : "");
      for (k = SY[0]; k <= SY[1]; k += 2) g += '<line class="mf-g" x1="' + P + '" y1="' + f1(sy(k)) + '" x2="' + (WW - P) + '" y2="' + f1(sy(k)) + '"/>' + (k ? '<text class="roc-k" x="' + f1(sx(0) - 3) + '" y="' + f1(sy(k) + 3) + '" text-anchor="end">' + k + "j</text>" : "");
      g += '<line class="mf-ax" x1="' + P + '" y1="' + f1(sy(0)) + '" x2="' + (WW - P) + '" y2="' + f1(sy(0)) + '"/><line class="mf-jw" x1="' + f1(sx(0)) + '" y1="' + P + '" x2="' + f1(sx(0)) + '" y2="' + (WW - P) + '"/>';
      g += '<line class="mf-rocb" x1="' + f1(sx(a)) + '" y1="' + P + '" x2="' + f1(sx(a)) + '" y2="' + (WW - P) + '"/>';
      var X = sx(a), Y = sy(0), r = 6;
      g += '<path class="mf-pole" d="M' + f1(X - r) + " " + f1(Y - r) + "L" + f1(X + r) + " " + f1(Y + r) + "M" + f1(X - r) + " " + f1(Y + r) + "L" + f1(X + r) + " " + f1(Y - r) + '"/>';
      g += '<text class="roc-k" x="' + (WW - P - 3) + '" y="' + (P + 12) + '" text-anchor="end">ROC: σ &gt; ' + fmt(st.a, 3) + "</text>";
      g += '<text class="roc-k" x="' + (WW - P - 3) + '" y="' + f1(sy(0) - 5) + '" text-anchor="end">σ</text><text class="roc-k" x="' + f1(sx(0) + 4) + '" y="' + (P + 12) + '">jω</text>';
      var cx = sx(Math.max(SX[0], Math.min(SX[1], st.sig))), cy = sy(Math.max(SY[0], Math.min(SY[1], st.om)));
      g += '<line class="mf-dash" x1="' + f1(cx) + '" y1="' + f1(sy(0)) + '" x2="' + f1(cx) + '" y2="' + f1(cy) + '"/><line class="mf-dash" x1="' + f1(sx(0)) + '" y1="' + f1(cy) + '" x2="' + f1(cx) + '" y2="' + f1(cy) + '"/>';
      g += '<circle class="roc-s ' + R.state(st.sig, st.a, st.om) + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="8"/><text class="roc-slab" x="' + f1(cx + (cx > WW - 80 ? -11 : 11)) + '" y="' + f1(cy - 9) + '" text-anchor="' + (cx > WW - 80 ? "end" : "start") + '">s</text>';
      sp.innerHTML = g;
    }

    function drawEuler(t, T) {
      var n = Math.min(4000, Math.max(400, Math.ceil(Math.abs(st.om) * T / 0.05))), pts = [];
      for (var i = 0; i <= n; i++) pts.push(R.integrand(st.c, st.a, st.sig, st.om, T * i / n));
      var F = cframe(300, 300, 16, pts, [[st.c, 0], [-st.c, 0], [0, st.c], [0, -st.c]]);
      var cur = R.integrand(st.c, st.a, st.sig, st.om, t), r0 = st.c, rt = Math.hypot(cur[0], cur[1]);
      var g = F.grid;
      g += '<circle class="roc-ring0" cx="' + f1(F.sx(0)) + '" cy="' + f1(F.sy(0)) + '" r="' + f1(r0 * F.k) + '"/>';
      g += '<circle class="roc-ring" cx="' + f1(F.sx(0)) + '" cy="' + f1(F.sy(0)) + '" r="' + f1(rt * F.k) + '"/>';
      g += '<path class="mf-sig" d="' + pathD(pts, F.sx, F.sy) + '"/>';
      // projections (Euler): real part on the real axis, imaginary on the imaginary axis
      g += '<line class="roc-proj re" x1="' + f1(F.sx(cur[0])) + '" y1="' + f1(F.sy(cur[1])) + '" x2="' + f1(F.sx(cur[0])) + '" y2="' + f1(F.sy(0)) + '"/>';
      g += '<line class="roc-proj im" x1="' + f1(F.sx(cur[0])) + '" y1="' + f1(F.sy(cur[1])) + '" x2="' + f1(F.sx(0)) + '" y2="' + f1(F.sy(cur[1])) + '"/>';
      g += '<line class="roc-vec" x1="' + f1(F.sx(0)) + '" y1="' + f1(F.sy(0)) + '" x2="' + f1(F.sx(cur[0])) + '" y2="' + f1(F.sy(cur[1])) + '"/>';
      g += '<circle class="mf-dot" cx="' + f1(F.sx(cur[0])) + '" cy="' + f1(F.sy(cur[1])) + '" r="5"/>';
      g += '<circle class="roc-start" cx="' + f1(F.sx(st.c)) + '" cy="' + f1(F.sy(0)) + '" r="3.5"/>';
      g += '<text class="roc-k" x="6" y="14">' + L("วงประ = รัศมี c (t = 0) · วงทึบ = c·e", "dashed = radius c (t = 0) · solid = c·e") + "<tspan baseline-shift=\"super\" font-size=\"8\">−(σ−a)t</tspan></text>";
      g += '<text class="roc-k" x="6" y="278">|c·e<tspan baseline-shift="super" font-size="8">−st</tspan>| = ' + fmt(rt, 4) + '</text><text class="roc-k" x="6" y="292">' + L("มุม", "angle") + " = −ωt = " + fmt(-st.om * t * 180 / Math.PI, 4) + "°" + (Math.abs(st.om * t) > 2 * Math.PI ? " (" + L("หมุนไป ", "") + fmt(Math.abs(st.om * t) / (2 * Math.PI), 3) + L(" รอบ)", " turns)") : "") + "</text>";
      eu.innerHTML = g;
    }

    function drawTime(t, T) {
      var narrow = (tp.parentNode.getBoundingClientRect().width || 640) < 520, W = narrow ? 380 : 640, H = narrow ? 270 : 220, Lm = 40, Rm = 10, Tm = narrow ? 48 : 34, Bm = 24;
      tp.setAttribute("viewBox", "0 0 " + W + " " + H);
      var n = Math.min(4000, Math.max(500, Math.ceil(Math.abs(st.om) * T / 0.04)));
      var re = [], im = [], env = [], lo = 0, hi = 0, tgt = R.limit(st.c, st.a, st.sig, st.om);
      for (var i = 0; i <= n; i++) {
        var tt = T * i / n, v = st.view === "f" ? R.integrand(st.c, st.a, st.sig, st.om, tt) : R.partial(st.c, st.a, st.sig, st.om, tt);
        re.push([tt, v[0]]); im.push([tt, v[1]]);
        if (st.view === "f") env.push([tt, st.c * Math.exp(-(st.sig - st.a) * tt)]);
        lo = Math.min(lo, v[0], v[1]); hi = Math.max(hi, v[0], v[1]);
      }
      if (st.view === "f") { hi = Math.max(hi, st.c); lo = Math.min(lo, -st.c); env.forEach(function (p) { hi = Math.max(hi, p[1]); lo = Math.min(lo, -p[1]); }); }
      if (tgt) { hi = Math.max(hi, tgt[0], tgt[1]); lo = Math.min(lo, tgt[0], tgt[1]); }
      var pad = (hi - lo) * 0.08 || 1; hi += pad; lo -= pad;
      var sx = function (v) { return Lm + v / T * (W - Lm - Rm); }, sy = function (v) { return Tm + (hi - v) / (hi - lo) * (H - Tm - Bm); };
      var g = "";
      ticks(0, T, 8).forEach(function (v) { g += '<line class="mf-g" x1="' + f1(sx(v)) + '" y1="' + Tm + '" x2="' + f1(sx(v)) + '" y2="' + (H - Bm) + '"/><text class="roc-k" x="' + f1(sx(v)) + '" y="' + (H - Bm + 14) + '" text-anchor="middle">' + fmt(v, 3) + "</text>"; });
      ticks(lo, hi, 5).forEach(function (v) { g += '<line class="mf-g" x1="' + Lm + '" y1="' + f1(sy(v)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy(v)) + '"/><text class="roc-k" x="' + (Lm - 4) + '" y="' + f1(sy(v) + 3) + '" text-anchor="end">' + fmt(v, 3) + "</text>"; });
      g += '<line class="mf-ax" x1="' + Lm + '" y1="' + f1(sy(0)) + '" x2="' + (W - Rm) + '" y2="' + f1(sy(0)) + '"/>';
      if (st.view === "f") {
        g += '<path class="mf-dash" d="' + pathD(env, sx, sy) + '"/><path class="mf-dash" d="' + pathD(env.map(function (p) { return [p[0], -p[1]]; }), sx, sy) + '"/>';
      } else if (tgt) {
        g += '<line class="roc-tgt re" x1="' + Lm + '" y1="' + f1(sy(tgt[0])) + '" x2="' + (W - Rm) + '" y2="' + f1(sy(tgt[0])) + '"/><line class="roc-tgt im" x1="' + Lm + '" y1="' + f1(sy(tgt[1])) + '" x2="' + (W - Rm) + '" y2="' + f1(sy(tgt[1])) + '"/>';
      }
      g += '<path class="roc-re" d="' + pathD(re, sx, sy) + '"/><path class="roc-im" d="' + pathD(im, sx, sy) + '"/>';
      g += '<line class="roc-cur" x1="' + f1(sx(t)) + '" y1="' + Tm + '" x2="' + f1(sx(t)) + '" y2="' + (H - Bm) + '"/>';
      var lab = st.view === "f" ? [L("ส่วนจริง c·e^(−σt)cos ωt", "real c·e^(−σt)cos ωt"), L("ส่วนจินตภาพ −c·e^(−σt)sin ωt", "imag −c·e^(−σt)sin ωt"), L("เส้นประ ±c·e^(−σt) = ขอบเขต (envelope)", "dashed ±c·e^(−σt) = envelope")]
        : [L("Re I(t) = c∫e^(−στ)cos ωτ dτ", "Re I(t) = c∫e^(−στ)cos ωτ dτ"), L("Im I(t) = −c∫e^(−στ)sin ωτ dτ", "Im I(t) = −c∫e^(−στ)sin ωτ dτ"), tgt ? L("เส้นประ = ค่าลิมิต c/(s−a)", "dashed = the limit c/(s−a)") : L("ไม่มีค่าลิมิต", "no limit")];
      var lx2 = narrow ? 8 : 300, ly2 = narrow ? 24 : 10, ly3 = narrow ? 38 : 24;
      g += '<g class="roc-leg"><rect x="8" y="5" width="10" height="3" class="roc-sw re"/><text x="22" y="10">' + lab[0] + '</text><rect x="' + lx2 + '" y="' + (ly2 - 5) + '" width="10" height="3" class="roc-sw im"/><text x="' + (lx2 + 14) + '" y="' + ly2 + '">' + lab[1] + '</text><text x="8" y="' + ly3 + '">' + lab[2] + "</text></g>";
      g += '<text class="roc-k" x="' + (W - Rm) + '" y="' + (H - 3) + '" text-anchor="end">t</text>';
      tp.innerHTML = g;
    }

    function drawPath(t, T) {
      var n = Math.min(4000, Math.max(400, Math.ceil(Math.abs(st.om) * T / 0.05))), pts = [], tgt = R.limit(st.c, st.a, st.sig, st.om);
      for (var i = 0; i <= n; i++) pts.push(R.partial(st.c, st.a, st.sig, st.om, T * i / n));
      var axis = R.state(st.sig, st.a, st.om) === "axis", ctr = axis ? [0, -st.c / st.om] : null; // c/(jω) = −jc/ω
      var F = cframe(300, 300, 18, pts, [tgt, ctr]);
      var cur = R.partial(st.c, st.a, st.sig, st.om, t), g = F.grid;
      g += '<path class="mf-sig2" d="' + pathD(pts, F.sx, F.sy) + '"/>';
      if (tgt) {
        g += '<line class="mf-dash" x1="' + f1(F.sx(cur[0])) + '" y1="' + f1(F.sy(cur[1])) + '" x2="' + f1(F.sx(tgt[0])) + '" y2="' + f1(F.sy(tgt[1])) + '"/>';
        g += star(F.sx(tgt[0]), F.sy(tgt[1]), 9, "roc-star");
      }
      if (ctr) { g += '<circle class="roc-ctr" cx="' + f1(F.sx(ctr[0])) + '" cy="' + f1(F.sy(ctr[1])) + '" r="4"/><text class="roc-k" x="' + f1(F.sx(ctr[0]) + 7) + '" y="' + f1(F.sy(ctr[1]) + 4) + '">c/(jω)</text>'; }
      g += '<circle class="mf-dot" cx="' + f1(F.sx(cur[0])) + '" cy="' + f1(F.sy(cur[1])) + '" r="5"/>';
      g += '<text class="roc-k" x="6" y="292">' + (tgt ? L("ระยะถึง ★ = ", "distance to ★ = ") + fmt(Math.hypot(cur[0] - tgt[0], cur[1] - tgt[1]), 4) : axis ? L("วนบนวงกลมรัศมี c/|ω| ไม่หยุด", "keeps circling, radius c/|ω|") : L("ไม่มีจุดหมาย: |I(T)| → ∞", "no target: |I(T)| → ∞")) + "</text>";
      ip.innerHTML = g;
    }

    function drawOut(t, T) {
      var stt = R.state(st.sig, st.a, st.om), v = VERDICT[stt], p = st.sig - st.a, tgt = R.limit(st.c, st.a, st.sig, st.om), cur = R.partial(st.c, st.a, st.sig, st.om, t);
      var sh = st.a ? "(s-" + fmtTex(st.a) + ")" : "s", sig = st.a ? "(\\sigma-" + fmtTex(st.a) + ")" : "\\sigma ";
      var rows = [1, 5, 10, 20, 50].map(function (TT) { var I = R.partial(st.c, st.a, st.sig, st.om, TT), m = Math.exp(-p * TT); return "<tr><td>" + TT + "</td><td>" + sup(fmt(m, 3)) + '</td><td class="mono">' + sup(esc(cTex(I, 4).replace(/\\times10\^\{(-?\d+)\}/g, "×10^$1"))) + "</td></tr>"; }).join("");
      out.innerHTML = '<div class="roc-verdict ' + v[0] + '"><b>' + v[1] + "</b></div>" +
        '<div class="roc-m" data-m="1"></div><div class="roc-m" data-m="2"></div><div class="roc-m" data-m="3"></div><div class="roc-m" data-m="4"></div>' +
        '<div class="roc-tablewrap"><table class="roc-tab"><thead><tr><th>T</th><th>|e<sup>−' + (st.a ? "(s−a)" : "s") + "T</sup>|</th><th>I(T)</th></tr></thead><tbody>" + rows +
        '<tr class="lim"><td>∞</td><td>' + (stt === "conv" ? "0" : stt === "div" ? "∞" : "1") + '</td><td class="mono">' + (tgt ? esc(cTex(tgt, 4)) : stt === "axis" ? L("ไม่มีลิมิต", "no limit") : "∞") + "</td></tr></tbody></table></div>";
      var m = function (k) { return out.querySelector('[data-m="' + k + '"]'); };
      tex(m(1), "s = " + sTex(st.sig, st.om) + ",\\qquad \\operatorname{Re}s = " + fmtTex(st.sig, 3) + (st.a ? ",\\ a = " + fmtTex(st.a, 3) : ""));
      tex(m(2), "|e^{-" + sh + "t}| = e^{-" + sig + "t} = e^{" + fmtTex(-p, 3) + "\\times" + fmtTex(t, 3) + "} = " + fmtTex(Math.exp(-p * t), 4));
      tex(m(3), "I(t) = \\int_0^{t} c\\," + (st.a ? "e^{at}" : "") + "e^{-st}\\,d\\tau = " + cTex(cur, 4));
      if (tgt) tex(m(4), "\\lim_{T\\to\\infty} I(T) = \\frac{c}{" + sh + "} = \\frac{" + fmtTex(st.c) + "}{" + sTex(p, st.om) + "} = " + cTex(tgt, 4));
      else if (stt === "axis") tex(m(4), "\\sigma " + (st.a ? "= a" : "= 0") + ":\\ |e^{-j\\omega t}| = 1\\ \\text{" + L("ไม่หด", "does not shrink") + "}\\Rightarrow\\ \\nexists\\lim");
      else if (stt === "zero") tex(m(4), "s " + (st.a ? "= a" : "= 0") + ":\\ \\int_0^T c\\,d\\tau = cT \\to \\infty");
      else tex(m(4), "\\sigma " + (st.a ? "< a" : "< 0") + ":\\ e^{-" + sig + "T} \\to \\infty");
      tOut.textContent = fmt(t, 3) + (T < st.T ? L(" (ตัดที่ " + fmt(T, 3) + " เพราะค่าโตเร็ว)", " (cut at " + fmt(T, 3) + ": values blow up)") : "");
    }

    function draw(changed) {
      var T = tEff();
      if (st.t > T) st.t = T;
      if (changed !== "t") tIn.value = (st.t / T).toFixed(3);
      drawPlane(); drawEuler(st.t, T); drawTime(st.t, T); drawPath(st.t, T); drawOut(st.t, T);
      Array.prototype.forEach.call(box.querySelectorAll("[data-view]"), function (b) { b.classList.toggle("on", b.getAttribute("data-view") === st.view); });
    }

    // drag on the s-plane
    var dragging = false;
    function setFromEvent(e) {
      var p = svgPt(sp, e), sg = Math.max(SX[0], Math.min(SX[1], ix(p.x))), om = Math.max(SY[0], Math.min(SY[1], iy(p.y)));
      if (Math.abs(sg - st.a) < 0.05) sg = st.a;           // snap onto the ROC boundary
      if (Math.abs(om) < 0.25) om = 0;                      // snap onto the real axis
      st.sig = Math.round(sg * 100) / 100; st.om = Math.round(om * 20) / 20;
      syncSliders(box, st); draw();
    }
    sp.addEventListener("pointerdown", function (e) { dragging = true; try { sp.setPointerCapture(e.pointerId); } catch (x) { /* old browsers */ } setFromEvent(e); e.preventDefault(); });
    sp.addEventListener("pointermove", function (e) { if (dragging) setFromEvent(e); });
    sp.addEventListener("pointerup", function () { dragging = false; });
    sp.addEventListener("pointercancel", function () { dragging = false; });

    bindSliders(box, st, function () { draw(); });
    tIn.addEventListener("input", function () { st.t = +tIn.value * tEff(); draw("t"); });
    var raf = null, last = 0;
    function step(ts) {
      if (!st.play) return;
      var T = tEff(), dt = last ? (ts - last) / 1000 : 0; last = ts;
      st.t += dt * T / 7;
      if (st.t >= T) { st.t = T; st.play = false; go.textContent = "▶ " + L("เล่นอีกครั้ง", "Replay"); }
      draw(); if (st.play) raf = requestAnimationFrame(step);
    }
    go.addEventListener("click", function () {
      if (st.play) { st.play = false; go.textContent = "▶ " + L("เล่น", "Play"); return; }
      if (st.t >= tEff() - 1e-9) st.t = 0;
      st.play = true; last = 0; go.textContent = "❚❚ " + L("หยุด", "Pause"); raf = requestAnimationFrame(step);
    });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pre]");
      if (b) { var p = PRESETS[+b.getAttribute("data-pre")]; st.sig = p.sig; st.om = p.om; st.a = p.a; if (p.a) { showA = true; $(".roc-adv", box).hidden = false; $(".roc-advbtn", box).setAttribute("aria-pressed", "true"); } st.t = tEff() * 0.6; syncSliders(box, st); draw(); return; }
      var v = e.target.closest("[data-view]"); if (v) { st.view = v.getAttribute("data-view"); draw(); return; }
      if (e.target.closest(".roc-advbtn")) { showA = !showA; $(".roc-adv", box).hidden = !showA; e.target.closest(".roc-advbtn").setAttribute("aria-pressed", String(showA)); if (!showA && st.a) { st.a = 0; syncSliders(box, st); draw(); } }
    });
    box._set = function (o) {
      Object.keys(o).forEach(function (k) { st[k] = k === "view" ? o[k] : +o[k]; });
      if (st.a) { showA = true; $(".roc-adv", box).hidden = false; }
      if (!("t" in o)) st.t = tEff() * 0.6;
      syncSliders(box, st); draw();
    };
    var rw = null; if (root.addEventListener) root.addEventListener("resize", function () { clearTimeout(rw); rw = setTimeout(function () { draw(); }, 150); });
    draw();
  }

  /* ---------------------------------------------------------------- boot */
  var INIT = { "roc-real": initReal, "roc-euler": initEuler };
  function boot() {
    Object.keys(INIT).forEach(function (cls) {
      Array.prototype.forEach.call(document.querySelectorAll("div." + cls), function (box, i) {
        if (box.__roc) return; box.__roc = true;
        if (!box.id) box.id = cls + "-" + i;
        box.classList.add("lap-lab", "roc-lab");
        try { INIT[cls](box); } catch (e) { box.innerHTML = '<p class="lap-err">' + L("แล็บโหลดไม่สำเร็จ: ", "Lab failed to load: ") + esc(e.message) + "</p>"; if (root.console) console.error(e); }
      });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-roc-set]"); if (!b) return;
      var box = document.getElementById(b.getAttribute("data-roc-target") || "");
      if (!box || !box._set) return;
      try { box._set(JSON.parse(b.getAttribute("data-roc-set"))); } catch (x) { return; }
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  R.boot = boot;
  if (typeof module !== "undefined" && module.exports) module.exports = R;
  else {
    root.LapROC = R;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
