/* Trigonometry page: interactive unit circle + wave, angle/inverse lookup into the 0–90° table,
   copy cells, CSV export, formula filter. Self-contained; uses window.katex when present. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var D2R = Math.PI / 180;
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function tex(s) {
    try { return window.katex ? window.katex.renderToString(s, { throwOnError: false }) : s; } catch (e) { return s; }
  }
  function fmt(v, d) { var s = v.toFixed(d); if (/^-0\.?0*$/.test(s)) s = s.slice(1); return s; }
  function fmtTan(v) { var a = Math.abs(v); return fmt(v, a < 10 ? 6 : a < 100 ? 5 : a < 1000 ? 4 : 3); }
  function degId(i) { return "deg-" + (i % 20 === 0 ? String(i / 20) : (i / 20).toFixed(2)); }
  function clean(d) { return Math.round(d * 1e9) / 1e9; }
  function norm(d) { d = clean(d) % 360; if (d < 0) d += 360; d = clean(d); return d === 360 ? 0 : d; }
  function degStr(d, n) { return fmt(d, n == null ? 2 : n) + "°"; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  // ---------------------------------------------------------------- exact values
  var EX = {
    "0": ["0", "1", "0", null, "1", null],
    "15": ["\\frac{\\sqrt6-\\sqrt2}{4}", "\\frac{\\sqrt6+\\sqrt2}{4}", "2-\\sqrt3", "\\sqrt6+\\sqrt2", "\\sqrt6-\\sqrt2", "2+\\sqrt3"],
    "18": ["\\frac{\\sqrt5-1}{4}", "\\frac{\\sqrt{10+2\\sqrt5}}{4}", "\\frac{\\sqrt{25-10\\sqrt5}}{5}", "\\sqrt5+1", "\\frac{\\sqrt{50-10\\sqrt5}}{5}", "\\sqrt{5+2\\sqrt5}"],
    "22.5": ["\\frac{\\sqrt{2-\\sqrt2}}{2}", "\\frac{\\sqrt{2+\\sqrt2}}{2}", "\\sqrt2-1", "\\sqrt{4+2\\sqrt2}", "\\sqrt{4-2\\sqrt2}", "\\sqrt2+1"],
    "30": ["\\frac12", "\\frac{\\sqrt3}{2}", "\\frac{\\sqrt3}{3}", "2", "\\frac{2\\sqrt3}{3}", "\\sqrt3"],
    "36": ["\\frac{\\sqrt{10-2\\sqrt5}}{4}", "\\frac{1+\\sqrt5}{4}", "\\sqrt{5-2\\sqrt5}", "\\frac{\\sqrt{50+10\\sqrt5}}{5}", "\\sqrt5-1", "\\frac{\\sqrt{25+10\\sqrt5}}{5}"],
    "45": ["\\frac{\\sqrt2}{2}", "\\frac{\\sqrt2}{2}", "1", "\\sqrt2", "\\sqrt2", "1"],
    "54": ["\\frac{1+\\sqrt5}{4}", "\\frac{\\sqrt{10-2\\sqrt5}}{4}", "\\frac{\\sqrt{25+10\\sqrt5}}{5}", "\\sqrt5-1", "\\frac{\\sqrt{50+10\\sqrt5}}{5}", "\\sqrt{5-2\\sqrt5}"],
    "60": ["\\frac{\\sqrt3}{2}", "\\frac12", "\\sqrt3", "\\frac{2\\sqrt3}{3}", "2", "\\frac{\\sqrt3}{3}"],
    "67.5": ["\\frac{\\sqrt{2+\\sqrt2}}{2}", "\\frac{\\sqrt{2-\\sqrt2}}{2}", "\\sqrt2+1", "\\sqrt{4-2\\sqrt2}", "\\sqrt{4+2\\sqrt2}", "\\sqrt2-1"],
    "72": ["\\frac{\\sqrt{10+2\\sqrt5}}{4}", "\\frac{\\sqrt5-1}{4}", "\\sqrt{5+2\\sqrt5}", "\\frac{\\sqrt{50-10\\sqrt5}}{5}", "\\sqrt5+1", "\\frac{\\sqrt{25-10\\sqrt5}}{5}"],
    "75": ["\\frac{\\sqrt6+\\sqrt2}{4}", "\\frac{\\sqrt6-\\sqrt2}{4}", "2+\\sqrt3", "\\sqrt6-\\sqrt2", "\\sqrt6+\\sqrt2", "2-\\sqrt3"],
    "90": ["1", "0", null, "1", null, "0"]
  };
  var single = /^(\\frac|\d+$|\\sqrt\d$|\\sqrt\{[^}]*\}$)/;
  function signed(str, s) {
    if (str == null || str === "0" || s >= 0) return str;
    return single.test(str) ? "-" + str : "-\\left(" + str + "\\right)";
  }

  // quadrant, reference angle, signs and the six values of an angle (degrees, any real)
  function analyse(theta) {
    var d = norm(theta), ref;
    if (d <= 90) ref = d; else if (d <= 180) ref = 180 - d; else if (d <= 270) ref = d - 180; else ref = 360 - d;
    ref = clean(ref);
    var axis = d % 90 === 0;
    var q = axis ? 0 : d < 90 ? 1 : d < 180 ? 2 : d < 270 ? 3 : 4;
    var ss = d > 0 && d < 180 ? 1 : d > 180 ? -1 : 0;
    var sc = d < 90 || d > 270 ? 1 : d > 90 && d < 270 ? -1 : 0;
    var r = theta * D2R;
    var s = Math.sin(r), c = Math.cos(r);
    if (axis) { s = ss; c = sc; }
    var cosZero = d === 90 || d === 270, sinZero = d === 0 || d === 180;
    var vals = [s, c, cosZero ? null : s / c, sinZero ? null : 1 / s, cosZero ? null : 1 / c, sinZero ? null : c / s];
    var ex = EX[String(ref)], exact = null;
    if (ex) {
      var sg = [ss, sc, ss * sc, ss, sc, ss * sc];
      exact = ex.map(function (e, k) { return signed(e, sg[k]); });
    }
    return { d: d, ref: ref, q: q, axis: axis, ss: ss, sc: sc, vals: vals, exact: exact };
  }

  function piFrac(deg) {
    var qs = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 36];
    for (var k = 0; k < qs.length; k++) {
      var q = qs[k], p = (deg * q) / 180, pr = Math.round(p);
      if (Math.abs(p - pr) < 1e-9) {
        if (pr === 0) return "0";
        var neg = pr < 0; pr = Math.abs(pr);
        var num = (pr === 1 ? "" : pr) + "\\pi";
        return (neg ? "-" : "") + (q === 1 ? num : "\\frac{" + num + "}{" + q + "}");
      }
    }
    return null;
  }
  function piText(deg) {
    var t = piFrac(deg);
    return t == null ? null : t.replace(/\\frac\{(.*?)\}\{(\d+)\}/, "$1/$2").replace(/\\pi/g, "π");
  }

  // ---------------------------------------------------------------- expression parser (π, √, + − × ÷, implicit ×)
  function parseExpr(input) {
    var s = String(input).trim().toLowerCase()
      .replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/,/g, ".").replace(/\s+/g, "");
    var unit = null;
    var mu = /(°|deg|องศา)$/.exec(s);
    if (mu) { unit = "deg"; s = s.slice(0, -mu[0].length); }
    else if ((mu = /(rad|เรเดียน)$/.exec(s))) { unit = "rad"; s = s.slice(0, -mu[0].length); }
    s = s.replace(/π|pi/g, "p").replace(/sqrt/g, "√");
    if (!s) return null;
    var i = 0, hasPi = false;
    function expr() {
      var v = term();
      while (s[i] === "+" || s[i] === "-") { var op = s[i++]; var w = term(); v = op === "+" ? v + w : v - w; }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var ch = s[i];
        if (ch === "*" || ch === "/") { i++; var w = unary(); v = ch === "*" ? v * w : v / w; }
        else if (ch !== undefined && /[\d.p(√]/.test(ch)) { v *= unary(); }
        else return v;
      }
    }
    function unary() {
      if (s[i] === "-") { i++; return -unary(); }
      if (s[i] === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var b = primary();
      if (s[i] === "^") { i++; return Math.pow(b, unary()); }
      return b;
    }
    function primary() {
      var ch = s[i];
      if (ch === "p") { i++; hasPi = true; return Math.PI; }
      if (ch === "√") { i++; return Math.sqrt(power()); }
      if (ch === "(") { i++; var v = expr(); if (s[i] !== ")") throw 0; i++; return v; }
      var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (!m) throw 0;
      i += m[0].length;
      return parseFloat(m[0]);
    }
    try {
      var v = expr();
      if (i !== s.length || !isFinite(v)) return null;
      return { v: v, unit: unit, hasPi: hasPi };
    } catch (e) { return null; }
  }
  // returns degrees; π in the input means radians unless "°" was typed
  function parseAngle(str, unit) {
    var r = parseExpr(str);
    if (!r) return NaN;
    var u = r.unit || (r.hasPi ? "rad" : unit);
    return u === "rad" ? r.v / D2R : r.v;
  }

  // ---------------------------------------------------------------- toast + table helpers
  var toastEl = $("ttToast"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 1800);
  }
  function copyText(text, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { legacy(text); done(); });
    else { legacy(text); done(); }
  }
  function legacy(text) {
    var t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(t);
  }
  var lastHit = null;
  function jumpRow(i, smooth) {
    var el = $(degId(i));
    if (!el) return;
    if (lastHit) lastHit.classList.remove("hit");
    el.classList.add("hit"); lastHit = el;
    el.scrollIntoView({ block: "center", behavior: smooth === false || reduceMotion ? "auto" : "smooth" });
    try { history.replaceState(null, "", "#" + el.id); } catch (e) {}
  }
  function rowBtn(i, label) {
    return '<button type="button" class="tt-go" data-row="' + i + '">' + (label || "ไปที่แถว " + degStr(i / 20) + " ในตาราง ↓") + "</button>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-row]");
    if (b) { e.preventDefault(); jumpRow(+b.getAttribute("data-row")); }
  });

  // ================================================================= UNIT CIRCLE
  var svg = $("ucSvg");
  var state = { deg: 30, unit: "deg" };
  var CX = 200, CY = 200, R = 130;
  var X = function (x) { return CX + R * x; }, Y = function (y) { return CY - R * y; };
  var PRESETS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

  function angleLabel(a) {
    if (state.unit === "deg") return a + "°";
    return piText(a);
  }

  function drawStatic() {
    var h = [];
    h.push('<defs><clipPath id="ucClip"><rect x="2" y="2" width="396" height="396" rx="8"/></clipPath></defs>');
    h.push('<g class="uc-q" id="ucQ">' +
      '<text x="388" y="22" text-anchor="end" data-q="1">Q I · A</text>' +
      '<text x="12" y="22" data-q="2">Q II · S</text>' +
      '<text x="12" y="390" data-q="3">Q III · T</text>' +
      '<text x="388" y="390" text-anchor="end" data-q="4">Q IV · C</text></g>');
    h.push('<line class="uc-ax" x1="8" x2="392" y1="' + CY + '" y2="' + CY + '"/><line class="uc-ax" y1="8" y2="392" x1="' + CX + '" x2="' + CX + '"/>');
    h.push('<text class="uc-axl" x="390" y="' + (CY - 6) + '" text-anchor="end">x</text><text class="uc-axl" x="' + (CX + 6) + '" y="16">y</text>');
    h.push('<line class="uc-tl" x1="' + X(1) + '" x2="' + X(1) + '" y1="8" y2="392"/>');
    h.push('<circle class="uc-circle" cx="' + CX + '" cy="' + CY + '" r="' + R + '"/>');
    h.push('<circle class="uc-ring" cx="' + CX + '" cy="' + CY + '" r="' + R + '"/>');
    PRESETS.forEach(function (a) {
      var r = a * D2R, lx = CX + (R + 24) * Math.cos(r), ly = CY - (R + 24) * Math.sin(r);
      h.push('<g class="uc-tick" data-a="' + a + '"><circle cx="' + X(Math.cos(r)) + '" cy="' + Y(Math.sin(r)) + '" r="3"/>' +
        '<circle class="uc-hitlab" cx="' + lx + '" cy="' + ly + '" r="15"/>' +
        '<text x="' + lx + '" y="' + (ly + 4) + '" text-anchor="middle">' + angleLabel(a) + "</text></g>");
    });
    h.push('<g id="ucDyn" clip-path="url(#ucClip)"></g>');
    svg.innerHTML = h.join("");
  }

  function line(x1, y1, x2, y2, cls) {
    return '<line class="' + cls + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
  }
  function label(x, y, txt, cls, anchor) {
    return '<text class="uc-lab ' + (cls || "") + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + txt + "</text>";
  }
  var LIM = 1.52; // beyond this the tan / cot points are off the drawing
  function clampY(v) { return Math.max(-LIM, Math.min(LIM, v)); }

  function drawDynamic(A) {
    var g = $("ucDyn"); if (!g) return;
    var r = A.d * D2R, c = A.vals[1], s = A.vals[0], h = [];
    var px = X(c), py = Y(s);
    var recip = $("ucRecip") && $("ucRecip").checked;
    // reference angle arc (Q II–IV)
    if (A.q > 1) {
      var base = A.q === 2 || A.q === 3 ? 180 : 360;
      var a0 = base * D2R, rr = 52;
      var sweep = (A.q === 2 || A.q === 4) ? 1 : 0; // from axis towards terminal side
      var ex = CX + rr * Math.cos(r), ey = CY - rr * Math.sin(r);
      h.push('<path class="uc-refarc" d="M' + (CX + rr * Math.cos(a0)).toFixed(1) + " " + (CY - rr * Math.sin(a0)).toFixed(1) + " A" + rr + " " + rr + " 0 0 " + sweep + " " + ex.toFixed(1) + " " + ey.toFixed(1) + '"/>');
      var mid = (A.q === 2 ? 180 - A.ref / 2 : A.q === 3 ? 180 + A.ref / 2 : 360 - A.ref / 2) * D2R;
      h.push(label(CX + 70 * Math.cos(mid), CY - 70 * Math.sin(mid) + 4, "θref", "acc", "middle"));
    }
    // angle arc θ
    if (A.d > 0) {
      var ra = 26, large = A.d > 180 ? 1 : 0;
      h.push('<path class="uc-arc" d="M' + (CX + ra) + " " + CY + " A" + ra + " " + ra + " 0 " + large + " 0 " + (CX + ra * Math.cos(r)).toFixed(1) + " " + (CY - ra * Math.sin(r)).toFixed(1) + '"/>');
      var hm = (A.d / 2) * D2R;
      if (A.d >= 20) h.push(label(CX + 38 * Math.cos(hm), CY - 38 * Math.sin(hm) + 4, "θ", "th", "middle"));
    }
    // tan on the line x = 1, plus the extended radius (that segment is sec θ)
    if (A.vals[2] != null) {
      var t = A.vals[2], ty = Y(clampY(t));
      h.push(line(CX, CY, X(1), Y(Math.max(-3, Math.min(3, t))), "uc-ext"));
      h.push(line(X(1), CY, X(1), ty, "uc-seg s-p2"));
      if (Math.abs(t) > 0.04) h.push(label(X(1) + 6, (CY + ty) / 2 + 4, "tan θ", "s-p2"));
      if (Math.abs(t) <= LIM) h.push('<circle class="uc-dot s-p2" cx="' + X(1) + '" cy="' + ty.toFixed(1) + '" r="3"/>');
      if (recip) {
        var sx = (CX + X(1)) / 2, sy = (CY + Y(clampY(t))) / 2;
        if (Math.abs(t) <= LIM) h.push(label(sx, sy - 8, "sec θ", "rec", "middle"));
      }
    }
    // cot on the line y = 1 (and the radius extended to it is csc θ)
    if (recip) {
      h.push(line(8, Y(1), 392, Y(1), "uc-tl"));
      if (A.vals[5] != null) {
        var k = A.vals[5], kx = X(Math.max(-LIM, Math.min(LIM, k)));
        h.push(line(CX, CY, X(Math.max(-3, Math.min(3, k))), Y(1), "uc-ext rec"));
        h.push(line(CX, Y(1), kx, Y(1), "uc-seg rec"));
        if (Math.abs(k) > 0.04) h.push(label((CX + kx) / 2, Y(1) - 7, "cot θ", "rec", "middle"));
        if (Math.abs(k) <= LIM) h.push(label((CX + kx) / 2 + 10 * Math.sign(k || 1), (CY + Y(1)) / 2, "csc θ", "rec", Math.sign(k || 1) > 0 ? "start" : "end"));
      }
    }
    // helper: horizontal projection of P to the y-axis
    h.push(line(px, py, CX, py, "uc-help"));
    // cos along x, sin vertical from the foot
    h.push(line(CX, CY, px, CY, "uc-seg s-p1"));
    h.push(line(px, CY, px, py, "uc-seg s-cur"));
    if (Math.abs(c) > 0.12) h.push(label((CX + px) / 2, s >= 0 ? CY + 17 : CY - 8, "cos θ", "s-p1", "middle"));
    // sin label: inside the triangle when there is room, otherwise outside (away from the tan line)
    var inside = Math.abs(c) > 0.55, dir = (c >= 0 ? 1 : -1) * (inside ? -1 : 1);
    if (Math.abs(s) > 0.12) h.push(label(px + 6 * dir, (CY + py) / 2 + 4, "sin θ", "s-cur", dir > 0 ? "start" : "end"));
    // radius OP and the point
    h.push(line(CX, CY, px, py, "uc-radius"));
    var nx = -Math.sin(r), ny = Math.cos(r);
    h.push(label(CX + 0.55 * R * Math.cos(r) + 9 * nx, CY - 0.55 * R * Math.sin(r) - 9 * ny + 4, "1", "muted", "middle"));
    h.push('<circle class="uc-p" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="7"/>');
    h.push('<circle class="uc-phit" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="22"/>');
    h.push(label(CX + (R - 20) * Math.cos(r + 0.16), CY - (R - 20) * Math.sin(r + 0.16) + 4, "P", "pl", "middle"));
    g.innerHTML = h.join("");
    // highlight active preset and quadrant
    svg.querySelectorAll(".uc-tick").forEach(function (el) { el.classList.toggle("on", +el.getAttribute("data-a") === A.d); });
    svg.querySelectorAll("#ucQ text").forEach(function (el) { el.classList.toggle("on", +el.getAttribute("data-q") === A.q); });
  }

  var NAMES = [["sin θ", "sine", "s-cur"], ["cos θ", "cosine", "s-p1"], ["tan θ", "tangent", "s-p2"], ["csc θ", "cosecant", ""], ["sec θ", "secant", ""], ["cot θ", "cotangent", ""]];
  function valStr(v, k) { return v == null ? "ไม่นิยาม" : k === 2 || k > 2 ? fmtTan(v) : fmt(v, 6); }

  function renderValues(A) {
    var box = $("ucVals"); if (!box) return;
    box.innerHTML = NAMES.map(function (n, k) {
      var v = A.vals[k], ex = A.exact ? A.exact[k] : null;
      var exHtml = v == null ? "<span>ตัวส่วนเป็นศูนย์</span>" : ex != null && !/^-?\d+$/.test(ex) ? tex("=" + ex) : "";
      return '<div class="uv ' + n[2] + '"><span class="uv-n">' + n[0] + '<small>' + n[1] + "</small></span><b>" + valStr(v, k) + '</b><span class="uv-x">' + exHtml + "</span></div>";
    }).join("");
    var qName = A.q ? "จตุภาคที่ " + ["", "I", "II", "III", "IV"][A.q] : "อยู่บนแกน";
    var signs = A.q ? " · sin " + (A.ss > 0 ? "บวก" : "ลบ") + ", cos " + (A.sc > 0 ? "บวก" : "ลบ") + ", tan " + (A.ss * A.sc > 0 ? "บวก" : "ลบ") : "";
    var s2 = A.vals[0] * A.vals[0], c2 = A.vals[1] * A.vals[1];
    var refTxt = A.q > 1 ? " · มุมอ้างอิง " + degStr(A.ref) : "";
    var ri = Math.round(A.ref * 20), onRow = Math.abs(A.ref * 20 - ri) < 1e-6;
    $("ucInfo").innerHTML = "<span><b>" + qName + "</b>" + refTxt + signs + "</span>" +
      '<span class="mono">sin²θ + cos²θ = ' + fmt(s2, 6) + " + " + fmt(c2, 6) + " = " + fmt(s2 + c2, 6) + "</span>" +
      (onRow ? rowBtn(ri, "ดูแถว " + degStr(A.ref) + " ในตาราง ↓") : "");
  }

  function renderHeader(A) {
    $("ucDeg").textContent = degStr(A.d);
    var pf = piFrac(A.d);
    $("ucRad").innerHTML = "= " + fmt(A.d * D2R, 6) + " rad" + (pf && pf !== "0" ? " = " + tex(pf) : "");
  }

  // ---------------------------------------------------------------- wave chart
  var wave = $("ucWave"), waveW = 0, waveSvg = null;
  var WM = { l: 34, r: 12, t: 14, b: 26 }, WY = 1.8;
  function wX(d) { return WM.l + (d / 360) * (waveW - WM.l - WM.r); }
  function wH() { return waveW < 520 ? 190 : 220; }
  function wY(v) { var h = wH(); return WM.t + ((WY - v) / (2 * WY)) * (h - WM.t - WM.b); }
  function drawWave() {
    if (!wave) return;
    waveW = Math.max(280, Math.round(wave.clientWidth));
    var h = wH(), out = [];
    var showTan = $("ucTanWave") && $("ucTanWave").checked;
    $("ucTanKey").hidden = !showTan;
    out.push('<svg width="' + waveW + '" height="' + h + '" viewBox="0 0 ' + waveW + " " + h + '" role="img" aria-label="กราฟ sin cos tan ตั้งแต่ 0 ถึง 360 องศา">');
    out.push('<defs><clipPath id="wClip"><rect x="' + WM.l + '" y="' + WM.t + '" width="' + (waveW - WM.l - WM.r) + '" height="' + (h - WM.t - WM.b) + '"/></clipPath></defs>');
    [-1, 0, 1].forEach(function (v) {
      out.push('<line class="' + (v === 0 ? "axis" : "grid") + '" x1="' + WM.l + '" x2="' + (waveW - WM.r) + '" y1="' + wY(v) + '" y2="' + wY(v) + '"/>');
      out.push('<text class="tick" x="' + (WM.l - 6) + '" y="' + (wY(v) + 4) + '" text-anchor="end">' + v + "</text>");
    });
    var xt = waveW < 420 ? [0, 90, 180, 270, 360] : [0, 45, 90, 135, 180, 225, 270, 315, 360];
    xt.forEach(function (d) {
      out.push('<line class="grid" x1="' + wX(d) + '" x2="' + wX(d) + '" y1="' + WM.t + '" y2="' + (h - WM.b) + '"/>');
      out.push('<text class="tick" x="' + wX(d) + '" y="' + (h - 8) + '" text-anchor="middle">' + angleLabel(d) + "</text>");
    });
    function path(fn, isTan) {
      var d = "", pen = false;
      for (var a = 0; a <= 360; a += 1) {
        if (isTan && (a === 90 || a === 270)) { pen = false; continue; }
        var v = fn(a * D2R);
        if (isTan) v = Math.max(-4, Math.min(4, v));
        d += (pen ? "L" : "M") + wX(a).toFixed(1) + " " + wY(v).toFixed(1);
        pen = true;
      }
      return d;
    }
    out.push('<g clip-path="url(#wClip)">');
    if (showTan) {
      [90, 270].forEach(function (a) { out.push('<line class="h-guide" x1="' + wX(a) + '" x2="' + wX(a) + '" y1="' + WM.t + '" y2="' + (h - WM.b) + '"/>'); });
      out.push('<path class="ser s-p2" d="' + path(Math.tan, true) + '"/>');
    }
    out.push('<path class="ser s-p1" d="' + path(Math.cos) + '"/>');
    out.push('<path class="ser s-cur" d="' + path(Math.sin) + '"/>');
    out.push('</g><g id="wDyn"></g></svg>');
    wave.innerHTML = out.join("");
    waveSvg = wave.querySelector("svg");
    bindWave();
  }
  function drawWaveCursor(A) {
    var g = waveSvg && waveSvg.querySelector("#wDyn"); if (!g) return;
    var h = wH(), x = wX(A.d), out = [];
    out.push('<line class="hair" x1="' + x + '" x2="' + x + '" y1="' + WM.t + '" y2="' + (h - WM.b) + '"/>');
    var pts = [[A.vals[0], "s-cur"], [A.vals[1], "s-p1"]];
    if ($("ucTanWave").checked && A.vals[2] != null && Math.abs(A.vals[2]) <= WY) pts.push([A.vals[2], "s-p2"]);
    pts.forEach(function (p) { out.push('<circle class="pt-cur ' + p[1] + '" cx="' + x + '" cy="' + wY(p[0]).toFixed(1) + '" r="5"/>'); });
    var right = x < waveW - 90;
    out.push('<text class="lab" x="' + (x + (right ? 6 : -6)) + '" y="' + (WM.t + 12) + '"' + (right ? "" : ' text-anchor="end"') + ">θ = " + degStr(A.d) + "</text>");
    g.innerHTML = out.join("");
  }
  function bindWave() {
    var dragging = false;
    function at(e) {
      var rect = waveSvg.getBoundingClientRect();
      var d = ((e.clientX - rect.left) - WM.l) / (waveW - WM.l - WM.r) * 360;
      setDeg(snap(Math.max(0, Math.min(360, d))) % 360, "wave");
    }
    waveSvg.addEventListener("pointerdown", function (e) { dragging = true; stopPlay(); try { waveSvg.setPointerCapture(e.pointerId); } catch (x) {} at(e); });
    waveSvg.addEventListener("pointermove", function (e) { if (dragging) at(e); });
    ["pointerup", "pointercancel"].forEach(function (t) { waveSvg.addEventListener(t, function () { dragging = false; }); });
  }

  // ---------------------------------------------------------------- state & controls
  function snap(d) {
    if ($("ucSnap") && $("ucSnap").checked) return Math.round(d / 15) * 15;
    return Math.round(d * 20) / 20;
  }
  function inputText(deg) {
    if (state.unit === "deg") return String(clean(deg));
    var pt = piText(deg);
    return pt != null ? pt : fmt(deg * D2R, 6);
  }
  function setDeg(deg, from) {
    state.deg = deg;
    var A = analyse(deg);
    renderHeader(A);
    drawDynamic(A);
    renderValues(A);
    drawWaveCursor(A);
    if (from !== "range") $("ucRange").value = A.d;
    if (from !== "input") $("ucInput").value = inputText(deg);
  }

  function pointerDeg(e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    var a = Math.atan2(CY - p.y, p.x - CX) / D2R;
    return norm(snap(a < 0 ? a + 360 : a));
  }

  var playing = false, raf = 0, lastT = 0;
  function stopPlay() {
    if (!playing) return;
    playing = false; cancelAnimationFrame(raf);
    $("ucPlay").textContent = "▶ หมุนรอบวง";
  }
  function startPlay() {
    playing = true; lastT = 0;
    $("ucPlay").textContent = "❚❚ หยุด";
    var tick = function (t) {
      if (!playing) return;
      if (lastT) setDeg(norm(Math.round((state.deg + (t - lastT) * 0.04) * 20) / 20), "play");
      lastT = t; raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function initCircle() {
    if (!svg) return;
    drawStatic();
    // presets
    $("ucPresets").innerHTML = PRESETS.map(function (a) { return '<button type="button" data-a="' + a + '">' + angleLabel(a) + "</button>"; }).join("");
    $("ucPresets").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]"); if (!b) return;
      stopPlay(); setDeg(+b.getAttribute("data-a"));
    });
    // drag on the circle: ring / handle for touch, anywhere for mouse
    var drag = false;
    svg.addEventListener("pointerdown", function (e) {
      var tk = e.target.closest(".uc-tick");
      if (tk) { stopPlay(); setDeg(+tk.getAttribute("data-a")); e.preventDefault(); return; }
      var grab = e.target.classList.contains("uc-ring") || e.target.classList.contains("uc-phit");
      if (!grab && e.pointerType !== "mouse") return;
      drag = true; stopPlay();
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      setDeg(pointerDeg(e)); e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) { if (drag) setDeg(pointerDeg(e)); });
    ["pointerup", "pointercancel"].forEach(function (t) { svg.addEventListener(t, function () { drag = false; }); });
    svg.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 15 : e.altKey ? 0.05 : 1, d = null;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") d = state.deg + step;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = state.deg - step;
      else if (e.key === "Home") d = 0;
      if (d == null) return;
      e.preventDefault(); stopPlay();
      setDeg(norm(e.shiftKey ? Math.round(d / 15) * 15 : Math.round(d * 20) / 20));
    });
    $("ucRange").addEventListener("input", function () { stopPlay(); setDeg(snap(+this.value) % 360, "range"); });
    $("ucInput").addEventListener("input", function () {
      var d = parseAngle(this.value, state.unit);
      this.classList.toggle("bad", !isFinite(d));
      if (isFinite(d)) { stopPlay(); setDeg(clean(d), "input"); }
    });
    $("ucInput").addEventListener("change", function () { $("ucInput").classList.remove("bad"); $("ucInput").value = inputText(state.deg); });
    $("ucUnit").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      state.unit = b.getAttribute("data-v");
      this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      drawStatic(); drawWave();
      $("ucPresets").querySelectorAll("button").forEach(function (x) { x.textContent = angleLabel(+x.getAttribute("data-a")); });
      setDeg(state.deg);
    });
    $("ucSnap").addEventListener("change", function () { if (this.checked) setDeg(norm(Math.round(state.deg / 15) * 15)); });
    $("ucRecip").addEventListener("change", function () { setDeg(state.deg); });
    $("ucTanWave").addEventListener("change", function () { drawWave(); setDeg(state.deg); });
    $("ucPlay").addEventListener("click", function () { playing ? stopPlay() : startPlay(); });
    drawWave();
    setDeg(30);
    if (window.ResizeObserver) {
      var lastW = wave.clientWidth;
      new ResizeObserver(function () {
        if (Math.abs(wave.clientWidth - lastW) < 2) return;
        lastW = wave.clientWidth; drawWave(); drawWaveCursor(analyse(state.deg));
      }).observe(wave);
    }
  }

  // ================================================================= TABLE LOOKUP
  var qUnit = "deg", qFn = "sin";
  function segBind(id, cb) {
    var el = $(id); if (!el) return;
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      el.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      cb(b.getAttribute("data-v"));
    });
  }
  function tableVal(i, k) { // value printed in the table at row i for sin/cos/tan (k = 0,1,2)
    var r = (i * Math.PI) / 3600;
    if (k === 0) return fmt(Math.sin(r), 6);
    if (k === 1) return fmt(i === 1800 ? 0 : Math.cos(r), 6);
    return i === 1800 ? "∞" : fmtTan(Math.tan(r));
  }
  function bracket(ref, k) {
    var x = ref * 20, lo = Math.floor(x + 1e-9), hi = Math.ceil(x - 1e-9);
    var name = ["sin", "cos", "tan"][k];
    if (lo === hi || hi > 1800) return { near: Math.min(1800, Math.round(x)), html: "" };
    return {
      near: Math.round(x),
      html: '<p class="tt-br">อยู่ระหว่างแถว <b>' + degStr(lo / 20) + "</b> (" + name + " = " + tableVal(lo, k) + ") กับแถว <b>" + degStr(hi / 20) + "</b> (" + name + " = " + tableVal(hi, k) + ")</p>"
    };
  }

  function angleLookup() {
    var out = $("qAngleOut"), raw = $("qAngle").value;
    if (!raw.trim()) { out.innerHTML = ""; return; }
    var d = parseAngle(raw, qUnit);
    if (!isFinite(d)) { out.innerHTML = '<p class="tt-err">อ่านค่ามุมไม่ได้ ลองพิมพ์เป็นตัวเลข เช่น 37.25 หรือ π/5</p>'; return; }
    d = clean(d);
    var A = analyse(d);
    var cells = [0, 1, 2].map(function (k) {
      var v = A.vals[k], ex = A.exact ? A.exact[k] : null;
      return '<div><span>' + ["sin θ", "cos θ", "tan θ"][k] + "</span><b>" + (v == null ? "ไม่นิยาม" : fmt(v, 8)) + "</b>" +
        (ex != null && v != null && !/^-?\d+$/.test(ex) ? '<i>' + tex("=" + ex) + "</i>" : "") + "</div>";
    }).join("");
    var head = "θ = " + degStr(d, Math.abs(d - Math.round(d * 100) / 100) < 1e-9 ? 2 : 6) + " = " + fmt(d * D2R, 6) + " rad";
    var pf = piFrac(d); if (pf && pf !== "0") head += " = " + tex(pf);
    var note = "";
    if (A.d !== d) note += "<p>มุมร่วมแขนใน 0°–360° คือ " + degStr(A.d) + "</p>";
    if (A.d > 90) {
      var sg = function (s) { return s > 0 ? "+" : "−"; };
      note += "<p>อยู่" + (A.q ? "จตุภาคที่ " + ["", "I", "II", "III", "IV"][A.q] : "บนแกน") + " มุมอ้างอิง " + degStr(A.ref) +
        " → sin θ = " + sg(A.ss || 1) + "sin " + degStr(A.ref) + ", cos θ = " + sg(A.sc || 1) + "cos " + degStr(A.ref) + "</p>";
    }
    var br = bracket(A.ref, 0);
    out.innerHTML = '<p class="tt-head">' + head + "</p><div class=\"tt-cells\">" + cells + "</div>" + note + br.html + rowBtn(br.near, br.html ? "ไปที่แถวใกล้สุด " + degStr(br.near / 20) + " ↓" : null);
  }

  function valueLookup() {
    var out = $("qValOut"), raw = $("qVal").value;
    if (!raw.trim()) { out.innerHTML = ""; return; }
    var r = parseExpr(raw);
    if (!r || r.unit) { out.innerHTML = '<p class="tt-err">พิมพ์ค่าเป็นตัวเลข เช่น 0.6, −0.5 หรือ √3/2</p>'; return; }
    var v = r.v;
    if (qFn !== "tan" && Math.abs(v) > 1 + 1e-12) { out.innerHTML = '<p class="tt-err">ค่า ' + qFn + " อยู่ได้แค่ −1 ถึง 1 เท่านั้น</p>"; return; }
    v = Math.max(qFn === "tan" ? -Infinity : -1, Math.min(qFn === "tan" ? Infinity : 1, v));
    var p, sols, ref, k;
    if (qFn === "sin") { p = Math.asin(v) / D2R; sols = [norm(p), norm(180 - p)]; ref = Math.abs(p); k = 0; }
    else if (qFn === "cos") { p = Math.acos(v) / D2R; sols = [norm(p), norm(360 - p)]; ref = p <= 90 ? p : 180 - p; k = 1; }
    else { p = Math.atan(v) / D2R; sols = [norm(p), norm(p + 180)]; ref = Math.abs(p); k = 2; }
    sols = sols.map(function (x) { return clean(x); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
    ref = clean(ref);
    var fname = { sin: "\\arcsin", cos: "\\arccos", tan: "\\arctan" }[qFn];
    var pf = piFrac(clean(p));
    var html = '<p class="tt-head">' + tex(fname + "(" + fmt(v, 6).replace(/\.?0+$/, "") + ")") + " = " + degStr(clean(p), 6) + " = " + fmt(p * D2R, 6) + " rad" + (pf && pf !== "0" ? " = " + tex(pf) : "") + "</p>";
    html += "<p>ค่าหลัก (principal value) ของ " + qFn + "<sup>−1</sup> · มุมใน 0°–360° ที่ให้ค่านี้: <b>" + sols.map(function (x) { return degStr(x); }).join(", ") + "</b></p>";
    if (v < 0) html += "<p>ค่าติดลบ: เปิดตารางด้วยค่า |" + qFn + "| แล้วใช้มุมอ้างอิง " + degStr(ref) + "</p>";
    var br = bracket(ref, k);
    out.innerHTML = html + br.html + rowBtn(br.near, br.html ? "ไปที่แถวใกล้สุด " + degStr(br.near / 20) + " ↓" : null);
  }

  function initTable() {
    var table = $("trigTable"); if (!table) return;
    segBind("qUnit", function (v) {
      qUnit = v;
      $("qAngle").placeholder = v === "deg" ? "เช่น 37.25 หรือ 150" : "เช่น 0.65 หรือ π/5";
      angleLookup();
    });
    segBind("qFn", function (v) { qFn = v; valueLookup(); });
    $("qAngle").addEventListener("input", angleLookup);
    $("qVal").addEventListener("input", valueLookup);
    [["qAngle", angleLookup], ["qVal", valueLookup]].forEach(function (p) {
      $(p[0]).addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var b = $(p[0]).closest(".tt-box").querySelector("[data-row]");
        if (b) jumpRow(+b.getAttribute("data-row"));
      });
    });

    // copy a cell
    var COL = ["θ", "θ (rad)", "sin", "cos", "tan"];
    table.addEventListener("click", function (e) {
      var cell = e.target.closest("tbody td, tbody th"); if (!cell) return;
      var tr = cell.parentNode, deg = tr.firstChild.textContent;
      var val = (cell.firstChild && cell.firstChild.nodeType === 3 ? cell.firstChild.textContent : cell.textContent).replace("°", "").trim();
      var ci = cell.cellIndex;
      var msg = ci === 0 ? "คัดลอก " + val : ci === 1 ? "คัดลอก " + deg + " = " + val + " rad" : "คัดลอก " + COL[ci] + " " + deg + " = " + val;
      if (lastHit) lastHit.classList.remove("hit");
      tr.classList.add("hit"); lastHit = tr;
      copyText(val, msg);
    });

    // CSV
    $("ttCsv").addEventListener("click", function () {
      var lines = ["deg,rad,sin,cos,tan"];
      for (var i = 0; i <= 1800; i++) {
        var r = (i * Math.PI) / 3600;
        lines.push((i / 20).toFixed(2) + "," + r.toFixed(6) + "," + tableVal(i, 0) + "," + tableVal(i, 1) + "," + (i === 1800 ? "undefined" : tableVal(i, 2)));
      }
      var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "trig-table-0-90-step-0.05.csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      toast("ดาวน์โหลด CSV 1,801 แถวแล้ว");
    });

    // floating "search" button while reading the table
    var fab = $("ttFab"), tools = $("ttTools");
    if (fab && window.IntersectionObserver) {
      var seenTable = false, seenTools = true;
      var upd = function () { fab.hidden = !(seenTable && !seenTools); };
      new IntersectionObserver(function (es) { es.forEach(function (en) { seenTable = en.isIntersecting; }); upd(); }).observe(table.tBodies[0].parentNode);
      new IntersectionObserver(function (es) { es.forEach(function (en) { seenTools = en.isIntersecting; }); upd(); }).observe(tools);
      fab.addEventListener("click", function (e) {
        e.preventDefault();
        tools.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        setTimeout(function () { $("qAngle").focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
      });
    }

    // arriving with #deg-xx in the URL
    var m = /^#deg-(\d+(?:\.\d+)?)$/.exec(location.hash);
    if (m) { var row = $(location.hash.slice(1)); if (row) { row.classList.add("hit"); lastHit = row; } }
    window.addEventListener("hashchange", function () {
      var el = /^#deg-/.test(location.hash) && $(location.hash.slice(1));
      if (el) { if (lastHit) lastHit.classList.remove("hit"); el.classList.add("hit"); lastHit = el; }
    });
  }

  // ================================================================= FORMULA FILTER
  function initFilter() {
    var inp = $("tfFilter"), art = $("trigArticle"); if (!inp || !art) return;
    var secs = Array.prototype.slice.call(art.querySelectorAll(".tsec"));
    var hay = new Map();
    secs.forEach(function (sec) {
      sec.querySelectorAll(".tf").forEach(function (card) {
        var n = card.querySelector(".tf-n"), ann = card.querySelectorAll("annotation");
        var t = (card.getAttribute("data-k") || "") + " " + (n ? n.textContent : "");
        ann.forEach(function (a) { t += " " + a.textContent.replace(/\\[a-z]+/gi, function (w) { return " " + w.slice(1) + " "; }); });
        hay.set(card, t.toLowerCase());
      });
    });
    function run() {
      var q = inp.value.trim().toLowerCase().replace(/θ/g, "");
      var terms = q.split(/\s+/).filter(Boolean);
      if (!terms.length) {
        art.classList.remove("is-filtering");
        secs.forEach(function (s) { s.hidden = false; s.classList.remove("tsec-all"); });
        art.querySelectorAll(".tf-off").forEach(function (c) { c.classList.remove("tf-off"); });
        $("tfCount").textContent = "";
        return;
      }
      art.classList.add("is-filtering");
      var total = 0;
      secs.forEach(function (sec) {
        var h2 = sec.querySelector("h2"), title = h2 ? h2.textContent.toLowerCase() : "";
        var all = terms.every(function (t) { return title.indexOf(t) >= 0; });
        var n = 0;
        sec.querySelectorAll(".tf").forEach(function (card) {
          var ok = all || terms.every(function (t) { return hay.get(card).indexOf(t) >= 0; });
          card.classList.toggle("tf-off", !ok);
          if (ok) n++;
        });
        sec.classList.toggle("tsec-all", all);
        sec.hidden = !all && n === 0;
        total += n;
      });
      $("tfCount").textContent = total ? "พบ " + total + " สูตร" : "ไม่พบสูตรที่ตรงกัน ลองคำอื่น";
    }
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; run(); } });
  }

  initCircle();
  initTable();
  initFilter();
})();
