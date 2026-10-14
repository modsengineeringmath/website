/* Shared toolkit for the calculators of /learn/ev-charging/, /learn/power-systems/ and /learn/power-factor/ — plain JS, no dependencies.
   Load before ev-calc.js, ps-calc.js or pf-lab.js. A calculator set is a map { key: { t, ref, ins:[[key,label,unit,default,options?]], f(x) → {rows, svg?, note?} } }
   registered with EEKit.calcs("data-ev", CALC): every <div class="fg-calc …" data-ev="key"> on the page becomes that calculator.
   Unit "sel" makes a <select> (options in the 5th field). Any input can be preset with data-<key>="value" on the host.
   Inputs accept SI prefixes (5k, 2.2M, 47u, 10m). window.EEKit (module.exports in Node). */
(function (root) {
  "use strict";
  var PFX = { G: 1e9, M: 1e6, k: 1e3, K: 1e3, m: 1e-3, u: 1e-6, "µ": 1e-6, "μ": 1e-6, n: 1e-9 };
  function parse(s) {
    s = String(s).trim().replace(/−/g, "-").replace(/,/g, "").replace(/\s+/g, "");
    var m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([GMkKmuµμn]?)$/.exec(s);
    return m ? parseFloat(m[1]) * (PFX[m[2]] || 1) : NaN;
  }
  function n(v, d) {
    if (!isFinite(v)) return "—";
    d = d == null ? 2 : d;
    return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
  }
  // significant-figure format for values that span decades (fault currents, impedances)
  function sig(v, s) {
    if (!isFinite(v)) return "—";
    if (v === 0) return "0";
    var d = Math.max(0, (s || 3) - 1 - Math.floor(Math.log10(Math.abs(v))));
    return n(v, Math.min(d, 6));
  }
  var baht = function (v) { return (v < 0 ? "−฿" : "฿") + n(Math.abs(v), 0); };
  var ok = function (c, t) { return '<span class="pv-chk ' + (c ? "ok" : "bad") + '">' + (c ? "✓ " : "✗ ") + t + "</span>"; };
  var warn = function (t) { return '<span class="ee-warn">⚠ ' + t + "</span>"; };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
  var EN = function () { return typeof document !== "undefined" && document.documentElement.lang === "en"; };
  var uid = function (p) { return (p || "ee") + Math.random().toString(36).slice(2, 8); };

  function niceTicks(max, count) {
    if (!(max > 0)) max = 1;
    var raw = max / (count || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p, out = [];
    for (var t = 0; t <= max * 1.0001; t += step) out.push(+t.toPrecision(10));
    if (out[out.length - 1] < max) out.push(+(out[out.length - 1] + step).toPrecision(10));
    return { ticks: out, top: out[out.length - 1], step: step };
  }
  function rangeTicks(lo, hi, count) {
    var t = niceTicks(Math.max(Math.abs(lo), Math.abs(hi), 1e-9), count || 4), s = t.step, out = [];
    var a = Math.floor(lo / s) * s, b = Math.ceil(hi / s) * s;
    for (var v = a; v <= b + s * 1e-6; v += s) out.push(+v.toPrecision(10));
    return { ticks: out, lo: a, hi: b };
  }

  /* Linear chart. o: {w,h, xs:[min,max], ys:[min,max], y2s?, xl, yl, y2l, label,
       series:[{pts:[[x,y]], cls, axis:2?, bars?, area?:true (filled to base or to pts0), base?:[[x,y]] }],
       marks:[{x,y,cls,label,axis,dx,anchor}], vlines:[{x,cls,label}], hlines:[{y,cls,label,axis}], xt, yt, y2t, xf, yf, y2f, legend:[[cls,text]] } */
  function chart(o) {
    var W = o.w || 640, H = o.h || 300, L = o.L || 54, R = o.y2s ? 56 : 16, T = o.legend ? 30 : 14, B = 40;
    var X = function (x) { return L + ((x - o.xs[0]) / (o.xs[1] - o.xs[0])) * (W - L - R); };
    var Y = function (y, ax) { var s = ax === 2 ? o.y2s : o.ys; return H - B - ((y - s[0]) / (s[1] - s[0])) * (H - T - B); };
    var f1 = function (v) { return v.toFixed(1); };
    var s = '<svg class="ee-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "กราฟ") + '">';
    (o.yt || []).forEach(function (t) { s += '<line class="gr" x1="' + L + '" x2="' + (W - R) + '" y1="' + f1(Y(t)) + '" y2="' + f1(Y(t)) + '"/><text class="tk" x="' + (L - 6) + '" y="' + f1(Y(t) + 4) + '" text-anchor="end">' + (o.yf ? o.yf(t) : t) + "</text>"; });
    (o.y2t || []).forEach(function (t) { s += '<text class="tk t2" x="' + (W - R + 6) + '" y="' + f1(Y(t, 2) + 4) + '">' + (o.y2f ? o.y2f(t) : t) + "</text>"; });
    (o.xt || []).forEach(function (t, i) { s += '<line class="gr gx" x1="' + f1(X(t)) + '" x2="' + f1(X(t)) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="tk" x="' + f1(X(t)) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + (o.xf ? o.xf(t, i) : t) + "</text>"; });
    var y0 = o.ys[0] < 0 && o.ys[1] > 0 ? 0 : o.ys[0];
    o.series.forEach(function (se) {
      if (se.bars) {
        var bw = ((W - L - R) / (o.xs[1] - o.xs[0])) * (se.bw || 0.7);
        se.pts.forEach(function (p) { var a = Y(se.b0 || 0, se.axis), b = Y(p[1], se.axis); s += '<rect class="' + se.cls + '" x="' + f1(X(p[0]) - bw / 2) + '" y="' + f1(Math.min(a, b)) + '" width="' + f1(bw) + '" height="' + f1(Math.abs(a - b)) + '"/>'; });
      } else if (se.area) {
        var base = se.base || se.pts.map(function (p) { return [p[0], y0]; });
        var d = se.pts.map(function (p, i) { return (i ? "L" : "M") + f1(X(p[0])) + "," + f1(Y(p[1], se.axis)); }).join("") +
          base.slice().reverse().map(function (p) { return "L" + f1(X(p[0])) + "," + f1(Y(p[1], se.axis)); }).join("") + "Z";
        s += '<path class="' + se.cls + '" d="' + d + '"/>';
      } else {
        s += '<polyline class="' + se.cls + '" points="' + se.pts.map(function (p) { return f1(X(p[0])) + "," + f1(Y(p[1], se.axis)); }).join(" ") + '"/>';
      }
    });
    (o.hlines || []).forEach(function (h) { s += '<line class="' + (h.cls || "hl") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + f1(Y(h.y, h.axis)) + '" y2="' + f1(Y(h.y, h.axis)) + '"/>' + (h.label ? '<text class="ml sm" x="' + (W - R - 4) + '" y="' + f1(Y(h.y, h.axis) - 5) + '" text-anchor="end">' + h.label + "</text>" : ""); });
    (o.vlines || []).forEach(function (v) { s += '<line class="' + (v.cls || "hl") + '" x1="' + f1(X(v.x)) + '" x2="' + f1(X(v.x)) + '" y1="' + T + '" y2="' + (H - B) + '"/>' + (v.label ? '<text class="ml sm" x="' + f1(X(v.x) + 4) + '" y="' + (T + 12) + '">' + v.label + "</text>" : ""); });
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + f1(Y(y0)) + '" y2="' + f1(Y(y0)) + '"/>';
    s += '<line class="ax" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    if (o.xl) s += '<text class="al" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + o.xl + "</text>";
    var my = T + (H - T - B) / 2;
    if (o.yl) s += '<text class="al" x="12" y="' + my + '" transform="rotate(-90 12 ' + my + ')" text-anchor="middle">' + o.yl + "</text>";
    if (o.y2l) s += '<text class="al" x="' + (W - 10) + '" y="' + my + '" transform="rotate(90 ' + (W - 10) + " " + my + ')" text-anchor="middle">' + o.y2l + "</text>";
    (o.marks || []).forEach(function (m) {
      s += '<circle class="' + (m.cls || "dot") + '" cx="' + f1(X(m.x)) + '" cy="' + f1(Y(m.y, m.axis)) + '" r="' + (m.r || 5) + '"/>';
      if (m.label) s += '<text class="ml" x="' + f1(X(m.x) + (m.dx == null ? 8 : m.dx)) + '" y="' + f1(Y(m.y, m.axis) + (m.dy == null ? -8 : m.dy)) + '"' + (m.anchor ? ' text-anchor="' + m.anchor + '"' : "") + ">" + m.label + "</text>";
    });
    if (o.legend) {
      var lx = L;
      o.legend.forEach(function (g) { s += '<rect class="' + g[0] + ' lg" x="' + lx + '" y="8" width="14" height="10" rx="2"/><text class="tk lgt" x="' + (lx + 18) + '" y="17">' + g[1] + "</text>"; lx += 26 + g[1].length * 6.4; });
    }
    return s + "</svg>";
  }

  function buildCalc(host, c, prefix) {
    host.innerHTML = "";
    var h = document.createElement("p"); h.className = "fc-t"; h.innerHTML = "<b>" + c.t + "</b>" + (c.ref ? ' <span class="mono">' + (EN() ? "Ref. " : "สูตร ") + c.ref + "</span>" : ""); host.appendChild(h);
    if (c.intro) { var ip = document.createElement("p"); ip.className = "pv-note ee-intro"; ip.innerHTML = c.intro; host.appendChild(ip); }
    var form = document.createElement("div"); form.className = "fc-in"; host.appendChild(form);
    var out = document.createElement("dl"); out.className = "fc-out"; out.setAttribute("aria-live", "polite"); host.appendChild(out);
    var fig = document.createElement("div"); fig.className = "pv-fig"; host.appendChild(fig);
    var note = document.createElement("p"); note.className = "pv-note"; host.appendChild(note);
    var inputs = {};
    c.ins.forEach(function (d) {
      var id = uid(prefix), w = document.createElement("label"); w.setAttribute("for", id);
      w.innerHTML = "<span>" + d[1] + "</span>";
      var el;
      if (d[2] === "sel") { el = document.createElement("select"); d[4].forEach(function (o) { var op = document.createElement("option"); op.textContent = o; el.appendChild(op); }); el.value = d[3]; }
      else { el = document.createElement("input"); el.type = "text"; el.inputMode = "decimal"; el.value = d[3]; el.spellcheck = false; el.autocomplete = "off"; }
      var pre = host.getAttribute("data-" + d[0]); if (pre != null) el.value = pre;
      el.id = id; w.appendChild(el);
      if (d[2] && d[2] !== "sel") { var u = document.createElement("i"); u.textContent = d[2]; w.appendChild(u); }
      form.appendChild(w); inputs[d[0]] = el;
      el.addEventListener("input", run); el.addEventListener("change", run);
    });
    function run() {
      var x = {}, bad = false;
      c.ins.forEach(function (d) { var v = inputs[d[0]].value; if (d[2] === "sel") x[d[0]] = v; else { x[d[0]] = parse(v); if (!isFinite(x[d[0]])) bad = true; } });
      if (bad) { out.innerHTML = "<dt>" + (EN() ? "Enter all numbers" : "ใส่ตัวเลขให้ครบ") + "</dt><dd>—</dd>"; fig.innerHTML = ""; return; }
      var r;
      try { r = c.f(x); } catch (e) { out.innerHTML = "<dt>" + (EN() ? "Cannot compute with these values" : "คำนวณไม่ได้กับค่านี้") + "</dt><dd>—</dd>"; fig.innerHTML = ""; return; }
      out.innerHTML = r.rows.map(function (q) { return q[0] === "—" ? '<dt class="fc-sep">' + q[1] + "</dt><dd></dd>" : "<dt>" + q[0] + "</dt><dd>" + q[1] + "</dd>"; }).join("");
      fig.innerHTML = r.svg || "";
      note.innerHTML = r.note || ""; note.hidden = !r.note;
    }
    host._set = function (vals) { Object.keys(vals).forEach(function (k) { if (inputs[k]) inputs[k].value = vals[k]; }); run(); };
    run();
  }

  // build every [attr] host from a calculator set; buttons <button data-fill="key" data-vals='{"k":"v"}'> refill one on the page
  function calcs(attr, CALC, prefix) {
    if (typeof document === "undefined") return;
    var init = function () {
      Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (h) {
        var c = CALC[h.getAttribute(attr)]; if (c && h.tagName !== "BUTTON") buildCalc(h, c, prefix);
      });
      Array.prototype.forEach.call(document.querySelectorAll("button[" + attr + "-fill]"), function (b) {
        b.addEventListener("click", function () {
          var key = b.getAttribute(attr + "-fill"), host = document.querySelector("[" + attr + '="' + key + '"]');
          if (!host || !host._set) return;
          host._set(JSON.parse(b.getAttribute("data-vals") || "{}"));
          host.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
  function onReady(fn) {
    if (typeof document === "undefined") return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn();
  }

  var api = { EN: EN, parse: parse, n: n, sig: sig, baht: baht, ok: ok, warn: warn, esc: esc, uid: uid, niceTicks: niceTicks, rangeTicks: rangeTicks, chart: chart, buildCalc: buildCalc, calcs: calcs, onReady: onReady };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EEKit = api;
})(typeof window !== "undefined" ? window : globalThis);
