/* Shared helpers for the buck-converter labs (window.BuckUI): number formatting, SVG charts with hover read-out, slider+number fields,
   matrix tables. Used by buck-lab.js (analysis labs) and buck-design.js (design lab). Charts are plain SVG styled by CSS variables,
   so they follow the light/dark theme without any JS. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------------------------------------- formatting
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function num(x, d) { // significant-digit format used in read-outs
    if (x == null || !isFinite(x)) return x === Infinity ? "∞" : x === -Infinity ? "−∞" : "–";
    if (x === 0) return "0";
    var a = Math.abs(x), dd = d || 4;
    if (a >= 1e6 || a < 1e-3) { var e = x.toExponential(dd - 1).split("e"); return e[0].replace(/\.?0+$/, "") + "×10" + sup(parseInt(e[1], 10)); }
    var s = x.toPrecision(dd); if (s.indexOf("e") >= 0) s = String(+s);
    if (s.indexOf(".") >= 0) s = s.replace(/\.?0+$/, "");
    return s.replace("-", "−");
  }
  function sup(n) { var m = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }; return String(n).split("").map(function (c) { return m[c] || c; }).join(""); }
  function eng(x, unit, d) { // 0.00033 → "330 µ"
    if (x == null || !isFinite(x)) return "–" + (unit || "");
    if (x === 0) return "0 " + (unit || "");
    var P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]], a = Math.abs(x), i;
    for (i = 0; i < P.length; i++) if (a >= P[i][0] * 0.9995) break;
    if (i === P.length) i = P.length - 1;
    return num(x / P[i][0], d || 3) + " " + P[i][1] + (unit || "");
  }
  function sgn(x, d) { return (x >= 0 ? "+" : "") + num(x, d); }

  // ---------------------------------------------------------------------------------------------- ticks
  function niceTicks(lo, hi, n) {
    var span = hi - lo; if (!(span > 0)) return [lo];
    var raw = span / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag, step = (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * mag;
    var out = [], v = Math.ceil(lo / step - 1e-9) * step;
    for (; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
    return out;
  }
  function logTicks(lo, hi) {
    var out = [], e0 = Math.floor(Math.log10(lo)), e1 = Math.ceil(Math.log10(hi)), e, m;
    for (e = e0; e <= e1; e++) for (m = 1; m < 10; m++) { var v = m * Math.pow(10, e); if (v >= lo * 0.9999 && v <= hi * 1.0001) out.push([v, m === 1]); }
    return out;
  }
  function tickLabel(v, log) {
    var a = Math.abs(v);
    if (log) return a >= 1e6 ? num(v / 1e6) + "M" : a >= 1e3 ? num(v / 1e3) + "k" : num(v);
    if (a !== 0 && (a >= 1e5 || a < 1e-3)) return num(v, 2);
    return num(v, 4);
  }

  // ---------------------------------------------------------------------------------------------- chart
  // o: {w,h, xmin,xmax,ymin,ymax, xlog,ylog, xlabel,ylabel, title, series:[{x,y,cls,dash,w,name,step,fill}], bands:[{x0,x1,cls,label}],
  //     vlines:[{x,label,cls}], hlines:[{y,label,cls}], points:[{x,y,cls,r,label}], legend:true, xfmt, yfmt, hover:true, pad:true}
  // y/x auto-range from the series when min/max are omitted.
  function chart(o) {
    var W = o.w || 720, H = o.h || 240, hasLg = o.legend !== false && ((o.series || []).some(function (s) { return s && s.name && s.x && s.x.length; }) || (o.points || []).some(function (q) { return q.name; }));
    var m = { l: 62, r: 16, t: (o.title ? 26 : 12) + (hasLg ? 18 : 0), b: o.xlabel ? 40 : 26 };
    if (o.ylabel) m.l = 70;
    var S = (o.series || []).filter(function (s) { return s && s.x && s.x.length; });
    var xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax, i, j;
    if (xmin == null || xmax == null || ymin == null || ymax == null) {
      var a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
      S.forEach(function (s) { for (i = 0; i < s.x.length; i++) { var xv = s.x[i], yv = s.y[i]; if (!isFinite(xv) || !isFinite(yv)) continue; if (xv < a) a = xv; if (xv > b) b = xv; if (yv < c) c = yv; if (yv > d) d = yv; } });
      (o.points || []).forEach(function (p) { if (isFinite(p.y)) { if (p.y < c) c = p.y; if (p.y > d) d = p.y; } });
      if (xmin == null) xmin = a; if (xmax == null) xmax = b;
      if (ymin == null || ymax == null) {
        if (!isFinite(c)) { c = 0; d = 1; }
        if (d - c < 1e-12) { c -= 0.5 * (Math.abs(c) || 1); d += 0.5 * (Math.abs(d) || 1); }
        var pad = (d - c) * 0.08;
        if (ymin == null) ymin = o.ylog ? c / 1.2 : c - pad; if (ymax == null) ymax = o.ylog ? d * 1.2 : d + pad;
      }
    }
    if (!(xmax > xmin)) xmax = xmin + 1;
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    var fx = o.xlog ? function (x) { return m.l + (Math.log10(x) - Math.log10(xmin)) / (Math.log10(xmax) - Math.log10(xmin)) * pw; } : function (x) { return m.l + (x - xmin) / (xmax - xmin) * pw; };
    var fy = o.ylog ? function (y) { return m.t + ph - (Math.log10(Math.max(y, 1e-300)) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin)) * ph; } : function (y) { return m.t + ph - (y - ymin) / (ymax - ymin) * ph; };
    var out = '<svg class="bk-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.title || o.ylabel || "กราฟ") + '" preserveAspectRatio="xMidYMid meet">';
    if (o.title) out += '<text class="bk-title" x="' + m.l + '" y="16">' + esc(o.title) + "</text>";
    // bands
    (o.bands || []).forEach(function (bd) {
      var x0 = Math.max(m.l, fx(bd.x0)), x1 = Math.min(m.l + pw, fx(bd.x1));
      if (x1 > x0) out += '<rect class="bk-band ' + (bd.cls || "") + '" x="' + x0.toFixed(1) + '" y="' + m.t + '" width="' + (x1 - x0).toFixed(1) + '" height="' + ph + '"/>' + (bd.label && x1 - x0 > bd.label.length * 6.8 + 10 ? '<text class="bk-bl" x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (m.t + 12) + '" text-anchor="middle">' + esc(bd.label) + "</text>" : "");
    });
    // grid + ticks
    var xt, yt;
    if (o.xlog) { xt = logTicks(xmin, xmax); xt.forEach(function (t) { var x = fx(t[0]); out += '<line class="bk-gr' + (t[1] ? " maj" : "") + '" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + m.t + '" y2="' + (m.t + ph) + '"/>' + (t[1] ? '<text class="bk-tk" x="' + x.toFixed(1) + '" y="' + (m.t + ph + 15) + '" text-anchor="middle">' + tickLabel(t[0], true) + "</text>" : ""); }); }
    else { xt = niceTicks(xmin, xmax, W < 480 ? 4 : 6); xt.forEach(function (t) { var x = fx(t); out += '<line class="bk-gr maj" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + m.t + '" y2="' + (m.t + ph) + '"/><text class="bk-tk" x="' + x.toFixed(1) + '" y="' + (m.t + ph + 15) + '" text-anchor="middle">' + (o.xfmt ? o.xfmt(t) : tickLabel(t)) + "</text>"; }); }
    if (o.ylog) { logTicks(ymin, ymax).forEach(function (t) { var y = fy(t[0]); out += '<line class="bk-gr' + (t[1] ? " maj" : "") + '" x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' + (t[1] ? '<text class="bk-tk" x="' + (m.l - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + tickLabel(t[0], true) + "</text>" : ""); }); }
    else { niceTicks(ymin, ymax, ph < 160 ? 4 : 5).forEach(function (t) { var y = fy(t); out += '<line class="bk-gr maj" x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="bk-tk" x="' + (m.l - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + (o.yfmt ? o.yfmt(t) : tickLabel(t)) + "</text>"; }); }
    out += '<rect class="bk-frame" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';
    if (o.xlabel) out += '<text class="bk-al" x="' + (m.l + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.xlabel) + "</text>";
    if (o.ylabel) out += '<text class="bk-al" transform="translate(14 ' + (m.t + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc(o.ylabel) + "</text>";
    // reference lines
    (o.hlines || []).forEach(function (h) { if (h.y < ymin || h.y > ymax) return; var y = fy(h.y); out += '<line class="bk-ref ' + (h.cls || "") + '" x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' + (h.label ? '<text class="bk-rl ' + (h.cls || "") + '" x="' + (m.l + pw - 4) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="end">' + esc(h.label) + "</text>" : ""); });
    (o.vlines || []).forEach(function (v) { if (v.x < xmin || v.x > xmax) return; var x = fx(v.x); out += '<line class="bk-ref ' + (v.cls || "") + '" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + m.t + '" y2="' + (m.t + ph) + '"/>' + (v.label ? '<text class="bk-rl ' + (v.cls || "") + '" x="' + (x + 4).toFixed(1) + '" y="' + (m.t + ph - 8) + '">' + esc(v.label) + "</text>" : ""); });
    // series (clipped to plot area)
    out += '<clipPath id="bkc' + (chart.n = (chart.n || 0) + 1) + '"><rect x="' + m.l + '" y="' + (m.t - 2) + '" width="' + pw + '" height="' + (ph + 4) + '"/></clipPath><g clip-path="url(#bkc' + chart.n + ')">';
    S.forEach(function (s) {
      var d = "", n = s.x.length, step = Math.max(1, Math.floor(n / (pw * 1.5))), pen = false, k;
      if (step > 1 && !s.step) { // decimate with min/max per bucket
        for (k = 0; k < n; k += step) {
          var lo = Infinity, hi = -Infinity, xi = s.x[k], iLo = k, iHi = k;
          for (j = k; j < Math.min(n, k + step); j++) { if (s.y[j] < lo) { lo = s.y[j]; iLo = j; } if (s.y[j] > hi) { hi = s.y[j]; iHi = j; } }
          var first = iLo < iHi ? [iLo, iHi] : [iHi, iLo];
          first.forEach(function (q) { d += (pen ? "L" : "M") + fx(s.x[q]).toFixed(1) + " " + fy(s.y[q]).toFixed(1); pen = true; });
        }
      } else {
        var prevY = 0;
        for (k = 0; k < n; k++) {
          var xv = s.x[k], yv = s.y[k];
          if (!isFinite(xv) || !isFinite(yv)) { pen = false; continue; }
          var px = fx(xv), py = fy(yv);
          if (s.step && pen) d += "L" + px.toFixed(1) + " " + prevY + "L" + px.toFixed(1) + " " + py.toFixed(1);
          else d += (pen ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1);
          prevY = py.toFixed(1); pen = true;
        }
      }
      if (s.fill) d += "L" + fx(s.x[n - 1]).toFixed(1) + " " + fy(Math.max(ymin, 0)).toFixed(1) + "L" + fx(s.x[0]).toFixed(1) + " " + fy(Math.max(ymin, 0)).toFixed(1) + "Z";
      out += '<path class="bk-line ' + (s.cls || "s1") + (s.dash ? " dash" : "") + (s.fill ? " fill" : "") + '"' + (s.w ? ' style="stroke-width:' + s.w + '"' : "") + ' d="' + d + '"/>';
    });
    out += "</g>";
    (o.points || []).forEach(function (p) { if (!isFinite(p.x) || !isFinite(p.y)) return; out += '<circle class="bk-pt ' + (p.cls || "s2") + '" cx="' + fx(p.x).toFixed(1) + '" cy="' + fy(p.y).toFixed(1) + '" r="' + (p.r || 4) + '"/>' + (p.label ? '<text class="bk-pl" x="' + (fx(p.x) + 7).toFixed(1) + '" y="' + (fy(p.y) - 7).toFixed(1) + '">' + esc(p.label) + "</text>" : ""); });
    if (o.legend !== false) {
      var lg = S.filter(function (s) { return s.name; }), lx = m.l + 8, ly = (o.title ? 34 : 14);
      lg.forEach(function (s) {
        out += '<g class="bk-lg"><line class="bk-line ' + (s.cls || "s1") + (s.dash ? " dash" : "") + '" x1="' + lx + '" x2="' + (lx + 18) + '" y1="' + (ly) + '" y2="' + (ly) + '"/><text x="' + (lx + 23) + '" y="' + (ly + 4) + '">' + esc(s.name) + "</text></g>";
        lx += 34 + s.name.length * 6.4; if (lx > W - 120) { lx = m.l + 8; ly += 15; }
      });
      var pl = (o.points || []).filter(function (p) { return p.name; }), seen = {};
      pl.forEach(function (p) { if (seen[p.name]) return; seen[p.name] = 1; out += '<g class="bk-lg"><circle class="bk-pt ' + (p.cls || "s2") + '" cx="' + (lx + 6) + '" cy="' + ly + '" r="4"/><text x="' + (lx + 15) + '" y="' + (ly + 4) + '">' + esc(p.name) + "</text></g>"; lx += 30 + p.name.length * 6.4; });
    }
    if (o.hover !== false && S.length) out += '<line class="bk-cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ph) + '" visibility="hidden"/><rect class="bk-hit" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';
    out += "</svg>";
    return { html: out, meta: { m: m, W: W, H: H, pw: pw, ph: ph, xmin: xmin, xmax: xmax, xlog: !!o.xlog, series: S, xfmt: o.xfmt, xname: o.xname || "x", yfmt: o.yfmt, fx: fx } };
  }
  // hover read-out: finds the nearest sample of the first series and prints every series' value at that x
  function hover(box, meta, readout) {
    var svg = box.querySelector("svg"); if (!svg || !meta) return;
    var hit = svg.querySelector(".bk-hit"), cross = svg.querySelector(".bk-cross"); if (!hit) return;
    function at(e) {
      var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * meta.W;
      if (px < meta.m.l || px > meta.m.l + meta.pw) return;
      var frac = (px - meta.m.l) / meta.pw, x = meta.xlog ? Math.pow(10, Math.log10(meta.xmin) + frac * (Math.log10(meta.xmax) - Math.log10(meta.xmin))) : meta.xmin + frac * (meta.xmax - meta.xmin);
      var parts = [(meta.xname) + " = " + (meta.xfmt ? meta.xfmt(x) : num(x, 4))];
      meta.series.forEach(function (s) {
        if (!s.name) return;
        var lo = 0, hi = s.x.length - 1; while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (s.x[mid] < x) lo = mid; else hi = mid; }
        var k = Math.abs(s.x[lo] - x) < Math.abs(s.x[hi] - x) ? lo : hi;
        parts.push(s.name + " = " + (meta.yfmt ? meta.yfmt(s.y[k]) : num(s.y[k], 4)));
      });
      cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
      if (readout) readout.textContent = parts.join("   ·   ");
    }
    hit.addEventListener("pointermove", at); hit.addEventListener("pointerdown", at);
    hit.addEventListener("pointerleave", function () { cross.setAttribute("visibility", "hidden"); });
  }
  // put a chart into a container <div class="bk-fig"> with its read-out line
  var drawn = [];
  function draw(box, o) {
    var w = box.clientWidth || (box.parentNode && box.parentNode.clientWidth) || 640;
    o = Object.assign({}, o, { w: Math.max(300, Math.round(w)) });
    if (!o.h) o.h = w < 460 ? 250 : 240;
    box._bk = o;
    if (drawn.indexOf(box) < 0) drawn.push(box);
    var c = chart(o);
    box.innerHTML = c.html + '<div class="bk-ro" aria-live="off">แตะหรือเลื่อนเมาส์บนกราฟเพื่ออ่านค่า</div>';
    hover(box, c.meta, box.querySelector(".bk-ro"));
    return c;
  }
  var rsT;
  window.addEventListener("resize", function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () { drawn = drawn.filter(function (b) { return document.body.contains(b); }); drawn.forEach(function (b) { if (b._bk && Math.abs((b.clientWidth || 0) - b._bk.w) > 12) draw(b, b._bk); }); }, 150);
  });

  // ---------------------------------------------------------------------------------------------- fields (slider + number)
  // spec: {k, label, unit, scale (state = shown × scale), min, max (shown units), log, step, dp}
  function field(spec, state) {
    var shown = state[spec.k] / (spec.scale || 1), t = spec.log ? Math.round(1000 * Math.log(shown / spec.min) / Math.log(spec.max / spec.min)) : shown;
    var id = "bkf" + (field.n = (field.n || 0) + 1);
    return '<div class="bk-f"><label for="' + id + 'n"><span>' + spec.label + '</span><em>' + (spec.unit || "") + "</em></label>" +
      '<input type="range" data-k="' + spec.k + '" data-r="1" aria-label="' + esc(spec.label) + '" min="' + (spec.log ? 0 : spec.min) + '" max="' + (spec.log ? 1000 : spec.max) + '" step="' + (spec.log ? 1 : spec.step || "any") + '" value="' + t + '">' +
      '<input id="' + id + 'n" type="number" data-k="' + spec.k + '" step="any" value="' + +shown.toPrecision(5) + '"></div>';
  }
  // wire all [data-k] inputs inside root to state; fields: map k → spec; cb(k) after each change
  function bind(root, state, fields, cb) {
    root.addEventListener("input", function (e) {
      var t = e.target, k = t.getAttribute && t.getAttribute("data-k"); if (!k || !fields[k]) return;
      var sp = fields[k], v;
      if (t.type === "range") v = sp.log ? sp.min * Math.pow(sp.max / sp.min, t.value / 1000) : parseFloat(t.value);
      else { v = parseFloat(t.value); if (!isFinite(v)) return; }
      if (sp.round) v = sp.round(v); else if (t.type === "range" && sp.log) v = +v.toPrecision(3);
      state[k] = v * (sp.scale || 1);
      var shown = state[k] / (sp.scale || 1);
      Array.prototype.forEach.call(root.querySelectorAll('[data-k="' + k + '"]'), function (el) {
        if (el === t) return;
        if (el.type === "range") el.value = sp.log ? Math.round(1000 * Math.log(Math.min(Math.max(shown, sp.min), sp.max) / sp.min) / Math.log(sp.max / sp.min)) : shown;
        else el.value = +shown.toPrecision(5);
      });
      cb(k);
    });
  }
  function setField(root, k, sp, state) { // refresh both inputs of a field after state[k] changed in code
    var shown = state[k] / (sp.scale || 1);
    Array.prototype.forEach.call(root.querySelectorAll('[data-k="' + k + '"]'), function (el) {
      if (el.type === "range") el.value = sp.log ? Math.round(1000 * Math.log(Math.min(Math.max(shown, sp.min), sp.max) / sp.min) / Math.log(sp.max / sp.min)) : Math.min(Math.max(shown, sp.min), sp.max);
      else if (el.type === "number") el.value = +shown.toPrecision(5);
      else if (el.type === "checkbox") el.checked = !!state[k];
      else el.value = state[k];
    });
  }

  // ---------------------------------------------------------------------------------------------- matrix table
  function mat(M, d, cls) {
    var rows = M.map(function (r) { return "<tr>" + (Array.isArray(r) ? r : [r]).map(function (v) { return "<td>" + (typeof v === "string" ? v : num(v, d || 4)) + "</td>"; }).join("") + "</tr>"; }).join("");
    return '<table class="bk-mat ' + (cls || "") + '" role="presentation"><tbody>' + rows + "</tbody></table>";
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }

  // "D=0.3;R=60" → state (SI units); used by worksheet buttons: <button data-bk-preset="ccm" data-bk-target="wave1" data-bk-set="D=0.3;R=60">
  function applySet(st, str) {
    if (!str) return;
    str.split(";").forEach(function (kv) { var p = kv.split("="); if (p.length === 2 && isFinite(parseFloat(p[1]))) st[p[0].trim()] = parseFloat(p[1]); else if (p.length === 2) st[p[0].trim()] = p[1].trim(); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-bk-preset]"); if (!b) return;
    var el = b.dataset.bkTarget ? document.getElementById(b.dataset.bkTarget) : null;
    if (el && el.bkApi) { e.preventDefault(); el.bkApi.preset(b.dataset.bkPreset, b.dataset); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });

  window.BuckUI = { applySet: applySet, esc: esc, num: num, eng: eng, sgn: sgn, sup: sup, chart: chart, hover: hover, draw: draw, field: field, bind: bind, setField: setField, mat: mat, debounce: debounce, niceTicks: niceTicks };
})();
