/* MathKit — shared helpers for the calculus and Laplace labs (assets/calc-lab.js, lap-lab.js, la-eng.js).
   No dependencies (uses window.katex when the page loads /assets/vendor/katex.min.js, and window.SigExpr when present).
   window.MK in the browser, module.exports in Node.
   - MK.nice(x)        → TeX for a real number: integers, fractions p/q, a√b/q, otherwise 4 significant figures
   - MK.niceC(re, im)  → TeX for a complex number a ± jb
   - MK.plot(o)        → SVG string: o = { w, h, xmin, xmax, ymin, ymax, series:[{pts, color, dash, width, fill}], marks, vlines, hlines, xlabel, ylabel, grid }
   - MK.tex(el, src, display) renders TeX into an element (falls back to text)
   - MK.fn(src, v)     → compiled real function x ↦ f(x) (SigExpr), throws a Thai error message on bad input
   - MK.svgPoint(svg, evt) → user-space coordinates of a pointer event */
(function (root) {
  "use strict";
  var MK = {};

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  // best rational p/q with q ≤ qmax, or null
  function rational(x, qmax, tol) {
    qmax = qmax || 1000; tol = tol == null ? 1e-9 : tol;
    if (!isFinite(x)) return null;
    for (var q = 1; q <= qmax; q++) {
      var p = Math.round(x * q);
      if (Math.abs(x - p / q) <= tol * Math.max(1, Math.abs(x))) { var g = gcd(p, q) || 1; return [p / g, q / g]; }
    }
    return null;
  }
  MK.rational = rational;
  function sigfig(x, s) {
    if (x === 0) return "0";
    var a = Math.abs(x), d = Math.max(0, (s || 4) - 1 - Math.floor(Math.log10(a)));
    if (a >= 1e6 || a < 1e-4) {
      var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
      return (+m.toFixed((s || 4) - 1)).toString() + "\\times10^{" + e + "}";
    }
    return (+x.toFixed(Math.min(d, 8))).toString();
  }
  MK.sig = sigfig;
  // plain-text number for labels (no TeX)
  MK.fmt = function (x, s) {
    if (!isFinite(x)) return isNaN(x) ? "—" : x > 0 ? "∞" : "−∞";
    if (Math.abs(x) < 1e-12) return "0";
    var a = Math.abs(x), d = Math.max(0, (s || 4) - 1 - Math.floor(Math.log10(a)));
    var t = a >= 1e6 || a < 1e-4 ? x.toExponential((s || 4) - 1) : String(+x.toFixed(Math.min(d, 8)));
    return t.replace("-", "−");
  };
  // TeX of a real number: exact-looking where possible
  MK.nice = function (x, opt) {
    opt = opt || {};
    if (!isFinite(x)) return isNaN(x) ? "\\text{—}" : (x > 0 ? "\\infty" : "-\\infty");
    if (Math.abs(x) < 1e-11) return "0";
    var neg = x < 0, a = Math.abs(x), r = rational(a, opt.qmax || 200, 1e-9);
    var out;
    if (r) out = r[1] === 1 ? String(r[0]) : (opt.inline ? r[0] + "/" + r[1] : "\\tfrac{" + r[0] + "}{" + r[1] + "}");
    else {
      var r2 = rational(a * a, 200, 1e-9);
      if (r2) { // a = sqrt(p/q) = sqrt(p q)/q = k sqrt(m) / q
        var pq = r2[0] * r2[1], k = 1, m = pq;
        for (var f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
        var g = gcd(k, r2[1]); k /= g; var q = r2[1] / g;
        if (m === 1) out = q === 1 ? String(k) : "\\tfrac{" + k + "}{" + q + "}";
        else {
          var num = (k === 1 ? "" : k) + "\\sqrt{" + m + "}";
          out = q === 1 ? num : "\\tfrac{" + num + "}{" + q + "}";
        }
      } else out = sigfig(a, opt.sig || 4);
    }
    return (neg ? "-" : "") + out;
  };
  MK.niceC = function (re, im, opt) {
    var j = (opt && opt.i) ? "i" : "j";
    if (Math.abs(im) < 1e-11) return MK.nice(re, opt);
    var ims = Math.abs(Math.abs(im) - 1) < 1e-12 ? "" : MK.nice(Math.abs(im), opt);
    var imPart = j + (ims ? (/[a-z\\]/.test(ims) && ims.indexOf("sqrt") < 0 && ims.indexOf("frac") < 0 ? "" : "") + ims : "");
    if (Math.abs(re) < 1e-11) return (im < 0 ? "-" : "") + imPart;
    return MK.nice(re, opt) + (im < 0 ? " - " : " + ") + imPart;
  };
  // coefficient in front of a symbol: 1 → "", −1 → "-", else nice(x)
  MK.coef = function (x) {
    if (Math.abs(x - 1) < 1e-11) return "";
    if (Math.abs(x + 1) < 1e-11) return "-";
    return MK.nice(x);
  };
  // TeX polynomial from real coefficients (highest first) in variable v
  MK.polyTex = function (p, v) {
    v = v || "s";
    var out = "", n = p.length - 1;
    for (var i = 0; i < p.length; i++) {
      var c = p[i], pw = n - i;
      if (Math.abs(c) < 1e-11) continue;
      var a = Math.abs(c), cs = (Math.abs(a - 1) < 1e-11 && pw > 0) ? "" : MK.nice(a);
      var term = cs + (pw > 0 ? v + (pw > 1 ? "^{" + pw + "}" : "") : "");
      out += (c < 0 ? (out ? " - " : "-") : (out ? " + " : "")) + term;
    }
    return out || "0";
  };

  MK.tex = function (el, src, display) {
    if (!el) return;
    if (root.katex) {
      try { root.katex.render(src, el, { displayMode: !!display, throwOnError: false, strict: "ignore" }); return; } catch (e) { /* fall through */ }
    }
    el.textContent = src;
  };
  MK.texStr = function (src, display) {
    if (root.katex) { try { return root.katex.renderToString(src, { displayMode: !!display, throwOnError: false, strict: "ignore" }); } catch (e) { /* ignore */ } }
    return '<code>' + String(src).replace(/</g, "&lt;") + '</code>';
  };

  MK.fn = function (src, v) {
    if (!root.SigExpr) throw new Error("ต้องโหลด sigexpr.js");
    var c = root.SigExpr.compile(src, v || "x");
    var ctx = { t: 0, dt: 0, on: false };
    var f = function (x) { ctx.t = x; return c.fn(ctx); };
    f.tex = c.tex;
    return f;
  };

  MK.niceTicks = function (lo, hi, n) {
    if (!(hi > lo)) { hi = lo + 1; }
    var raw = (hi - lo) / (n || 6), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p, out = [];
    for (var t = Math.ceil(lo / step - 1e-9) * step; t <= hi + 1e-9 * step; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : +t.toPrecision(10));
    return out;
  };

  var COLORS = { a: "var(--accent)", b: "var(--signal)", c: "var(--ok)", d: "#9b59b6", e: "#d4a017", ink: "var(--ink)", mute: "var(--ink-3)" };
  MK.COLORS = COLORS;
  MK.plot = function (o) {
    var W = o.w || 640, H = o.h || 300, L = o.left || 46, R = 14, T = 14, B = o.xlabel ? 36 : 26;
    var xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax;
    if (ymin == null || ymax == null) {
      var lo = Infinity, hi = -Infinity;
      (o.series || []).forEach(function (s) { s.pts.forEach(function (p) { if (isFinite(p[1]) && p[0] >= xmin && p[0] <= xmax) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); } }); });
      if (!isFinite(lo)) { lo = -1; hi = 1; }
      if (o.clip) { lo = Math.max(lo, -o.clip); hi = Math.min(hi, o.clip); }
      if (o.zero !== false) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
      if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
      var pad = (hi - lo) * 0.08;
      if (ymin == null) ymin = lo - pad;
      if (ymax == null) ymax = hi + pad;
    }
    var sx = function (x) { return L + (x - xmin) / (xmax - xmin) * (W - L - R); };
    var sy = function (y) { return T + (ymax - y) / (ymax - ymin) * (H - T - B); };
    var s = '<svg class="mk-plot" viewBox="0 0 ' + W + " " + H + '" role="img"' + (o.label ? ' aria-label="' + o.label.replace(/"/g, "") + '"' : "") + ">";
    var xt = MK.niceTicks(xmin, xmax, o.xticks || 8), yt = MK.niceTicks(ymin, ymax, o.yticks || 5);
    s += '<g class="mk-grid">';
    xt.forEach(function (t) { s += '<line x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/>'; });
    yt.forEach(function (t) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t).toFixed(1) + '" y2="' + sy(t).toFixed(1) + '"/>'; });
    s += "</g>";
    if (ymin < 0 && ymax > 0) s += '<line class="mk-axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(0).toFixed(1) + '" y2="' + sy(0).toFixed(1) + '"/>';
    if (xmin < 0 && xmax > 0) s += '<line class="mk-axis" x1="' + sx(0).toFixed(1) + '" x2="' + sx(0).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    s += '<g class="mk-tick">';
    xt.forEach(function (t) { s += '<text x="' + sx(t).toFixed(1) + '" y="' + (H - B + 14) + '" text-anchor="middle">' + MK.fmt(t, 3) + "</text>"; });
    yt.forEach(function (t) { s += '<text x="' + (L - 6) + '" y="' + (sy(t) + 4).toFixed(1) + '" text-anchor="end">' + MK.fmt(t, 3) + "</text>"; });
    s += "</g>";
    if (o.xlabel) s += '<text class="mk-lab" x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end">' + o.xlabel + "</text>";
    if (o.ylabel) s += '<text class="mk-lab" x="' + (L + 4) + '" y="' + (T + 11) + '">' + o.ylabel + "</text>";
    s += '<clipPath id="' + (o.id || "mkc") + '"><rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '"/></clipPath><g clip-path="url(#' + (o.id || "mkc") + ')">';
    (o.bands || []).forEach(function (b) { // shaded x-intervals
      s += '<rect x="' + sx(Math.max(b.x0, xmin)).toFixed(1) + '" y="' + T + '" width="' + Math.max(0, sx(Math.min(b.x1, xmax)) - sx(Math.max(b.x0, xmin))).toFixed(1) + '" height="' + (H - T - B) + '" fill="' + (b.color || "var(--signal)") + '" opacity="' + (b.op || 0.1) + '"/>';
    });
    (o.series || []).forEach(function (se) {
      var d = "", pen = false, lim = (ymax - ymin) * 50;
      se.pts.forEach(function (p) {
        if (!isFinite(p[1]) || Math.abs(p[1] - (ymin + ymax) / 2) > lim) { pen = false; return; }
        d += (pen ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1);
        pen = true;
      });
      if (se.fill && se.pts.length) {
        var f = "M" + sx(se.pts[0][0]).toFixed(1) + " " + sy(se.base || 0).toFixed(1);
        se.pts.forEach(function (p) { if (isFinite(p[1])) f += "L" + sx(p[0]).toFixed(1) + " " + sy(Math.max(ymin - 1, Math.min(ymax + 1, p[1]))).toFixed(1); });
        f += "L" + sx(se.pts[se.pts.length - 1][0]).toFixed(1) + " " + sy(se.base || 0).toFixed(1) + "Z";
        s += '<path d="' + f + '" fill="' + (se.color || COLORS.a) + '" opacity="' + (se.fill === true ? 0.15 : se.fill) + '" stroke="none"/>';
      }
      s += '<path d="' + d + '" fill="none" stroke="' + (se.color || COLORS.a) + '" stroke-width="' + (se.width || 2.2) + '"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : "") + ' stroke-linejoin="round" stroke-linecap="round"/>';
    });
    (o.vlines || []).forEach(function (v) { s += '<line x1="' + sx(v.x).toFixed(1) + '" x2="' + sx(v.x).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + (v.color || COLORS.mute) + '" stroke-dasharray="4 4" stroke-width="1.2"/>' + (v.label ? '<text class="mk-ann" x="' + (sx(v.x) + 4).toFixed(1) + '" y="' + (T + 12) + '" fill="' + (v.color || "var(--ink-3)") + '">' + v.label + "</text>" : ""); });
    (o.hlines || []).forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(v.y).toFixed(1) + '" y2="' + sy(v.y).toFixed(1) + '" stroke="' + (v.color || COLORS.mute) + '" stroke-dasharray="4 4" stroke-width="1.2"/>' + (v.label ? '<text class="mk-ann" x="' + (W - R - 4) + '" y="' + (sy(v.y) - 5).toFixed(1) + '" text-anchor="end" fill="' + (v.color || "var(--ink-3)") + '">' + v.label + "</text>" : ""); });
    (o.segs || []).forEach(function (g) { s += '<line x1="' + sx(g.x1).toFixed(1) + '" y1="' + sy(g.y1).toFixed(1) + '" x2="' + sx(g.x2).toFixed(1) + '" y2="' + sy(g.y2).toFixed(1) + '" stroke="' + (g.color || COLORS.b) + '" stroke-width="' + (g.width || 1.8) + '"' + (g.dash ? ' stroke-dasharray="' + g.dash + '"' : "") + "/>"; });
    s += "</g>";
    (o.marks || []).forEach(function (m) {
      if (!isFinite(m.y) || m.y < ymin || m.y > ymax || m.x < xmin || m.x > xmax) return;
      s += '<circle cx="' + sx(m.x).toFixed(1) + '" cy="' + sy(m.y).toFixed(1) + '" r="' + (m.r || 4.5) + '" fill="' + (m.open ? "var(--card)" : (m.color || COLORS.a)) + '" stroke="' + (m.color || COLORS.a) + '" stroke-width="2"' + (m.drag ? ' class="mk-drag" data-drag="' + m.drag + '"' : "") + "/>";
      if (m.label) s += '<text class="mk-ann" x="' + (sx(m.x) + 7).toFixed(1) + '" y="' + (sy(m.y) - 7).toFixed(1) + '">' + m.label + "</text>";
    });
    s += "</svg>";
    MK._last = { sx: sx, sy: sy, ix: function (px) { return xmin + (px - L) / (W - L - R) * (xmax - xmin); }, iy: function (py) { return ymax - (py - T) / (H - T - B) * (ymax - ymin); } };
    return s;
  };
  // the inverse mapping of the last plot drawn (for dragging); keep it with the host element
  MK.lastMap = function () { return MK._last; };

  MK.svgPoint = function (svg, e) {
    var pt = svg.createSVGPoint(), t = e.touches ? e.touches[0] : e;
    pt.x = t.clientX; pt.y = t.clientY;
    var m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };
  MK.esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
  MK.uid = function (p) { return (p || "mk") + Math.random().toString(36).slice(2, 8); };
  // linspace helper
  MK.sample = function (f, a, b, n) {
    var out = [], i, x;
    n = n || 400;
    for (i = 0; i <= n; i++) { x = a + (b - a) * i / n; var y; try { y = f(x); } catch (e) { y = NaN; } out.push([x, y]); }
    return out;
  };

  root.MK = MK;
  if (typeof module !== "undefined" && module.exports) module.exports = MK;
})(typeof window !== "undefined" ? window : globalThis);
