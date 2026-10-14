/* PLC ladder simulator for /learn/plc/ (and /learn/en/plc/). Plain JS, no dependencies.
   <div class="plc-sim" data-preset="dol|fr|yd|flasher|traffic|tank|counter|setreset" [data-compact] [data-edit="false"]></div>
   <button data-plc-preset="yd" [data-plc-target="id"]> loads a preset into a simulator on the page.
   Program = one rung per line (a Boolean form of Ladder/ST):
     Q0.0 = (I0.1 | Q0.0) & I0.0 & !I0.2      coil         S Q0.0 = expr   set (latch)      R Q0.0 = expr   reset
     T1 = TON(expr, 5s)  TOF(…)  TP(…)        IEC timers (T1 is the Q output, ET shown live)
     C1 = CTU(cu_expr, reset_expr, 6)         IEC up-counter (counts rising edges of CU)
   Operands: I0.0–I1.7 inputs, Q0.0–Q1.7 outputs, M0.0–M9.7 memory, T1…, C1…, P(x)/N(x) rising/falling edge, TRUE, FALSE.
   Operators: ! NOT, & AND, | OR, parentheses (also AND OR NOT). Text after # or // is a comment.
   Each scan: copy physical inputs → input image, solve rungs top to bottom (outputs written by a rung are seen by later rungs in the
   same scan, as in a real PLC), then copy the output image to the outputs. NOT in front of a bracket is pushed down with De Morgan's laws
   so every rung can be drawn with plain NO/NC contacts. Labels follow <html lang>. */
(function () {
  "use strict";
  var EN = typeof document !== "undefined" && document.documentElement.lang === "en";
  var L = function (th, en) { return EN ? en : th; };

  var PRESETS = {
    dol: { t: L("สตาร์ทตรง DOL (ล็อกตัวเอง)", "DOL self-holding"),
      io: { "I0.0": ["STOP S0", "ncpush"], "I0.1": ["START S1", "push"], "I0.2": [L("โอเวอร์โหลด F2 95-96", "Overload F2 95-96"), "nctoggle"],
        "Q0.0": [L("คอนแทกเตอร์ K1", "Contactor K1"), "motor"], "Q0.1": [L("ไฟเดิน", "RUN lamp"), "green"], "Q0.2": [L("ไฟทริป", "TRIP lamp"), "amber"] },
      p: L("# STOP และโอเวอร์โหลดต่อแบบ NC → อ่านได้ 1 ตอนปกติ\nQ0.0 = (I0.1 | Q0.0) & I0.0 & I0.2   # K1 ล็อกตัวเอง\nQ0.1 = Q0.0                           # ไฟเดิน\nQ0.2 = !I0.2                          # ไฟทริป", "# STOP and the overload are wired NC → they read 1 when healthy\nQ0.0 = (I0.1 | Q0.0) & I0.0 & I0.2   # K1 latches itself\nQ0.1 = Q0.0                           # RUN lamp\nQ0.2 = !I0.2                          # TRIP lamp") },
    fr: { t: L("กลับทางหมุน + อินเตอร์ล็อก", "Forward–reverse with interlock"),
      io: { "I0.0": ["STOP S0", "ncpush"], "I0.1": [L("เดินหน้า S1", "FWD S1"), "push"], "I0.2": [L("ถอยหลัง S2", "REV S2"), "push"], "I0.3": [L("โอเวอร์โหลด F2", "Overload F2"), "nctoggle"],
        "Q0.0": [L("K1 เดินหน้า", "K1 forward"), "motor"], "Q0.1": [L("K2 ถอยหลัง", "K2 reverse"), "motor"] },
      p: L("Q0.0 = (I0.1 | Q0.0) & I0.0 & I0.3 & !I0.2 & !Q0.1   # K1 เดินหน้า + อินเตอร์ล็อก\nQ0.1 = (I0.2 | Q0.1) & I0.0 & I0.3 & !I0.1 & !Q0.0   # K2 ถอยหลัง\n# ต้องคงอินเตอร์ล็อก NC K1 21-22 / K2 21-22 ในสายคอยล์ด้วย!", "Q0.0 = (I0.1 | Q0.0) & I0.0 & I0.3 & !I0.2 & !Q0.1   # K1 FWD + interlock\nQ0.1 = (I0.2 | Q0.1) & I0.0 & I0.3 & !I0.1 & !Q0.0   # K2 REV\n# keep the NC auxiliary interlocks K1 21-22 / K2 21-22 in the coil wiring as well!") },
    yd: { t: L("สตาร์-เดลต้าด้วย PLC", "Star–delta with a PLC"), plant: "yd",
      io: { "I0.0": ["STOP S0", "ncpush"], "I0.1": ["START S1", "push"], "I0.2": [L("โอเวอร์โหลด F2", "Overload F2"), "nctoggle"],
        "Q0.0": [L("K1 หลัก", "K1 main"), "motor"], "Q0.1": ["K2 (Y)", "motor"], "Q0.2": ["K3 (Δ)", "motor"], "M0.0": [L("สั่งเดิน", "run command"), "mem"] },
      p: L("M0.0 = (I0.1 | M0.0) & I0.0 & I0.2   # สั่งเดิน (ล็อก)\nT1 = TON(M0.0, 6s)                    # เวลาช่วงสตาร์\nQ0.1 = M0.0 & !T1 & !Q0.2             # K2 สตาร์\nQ0.0 = M0.0 & (Q0.1 | Q0.0)           # K1 หลัก ตามหลังสตาร์\nT2 = TON(T1, 80ms)                    # ช่วงตาย Y→Δ\nQ0.2 = M0.0 & T2 & !Q0.1              # K3 เดลต้า", "M0.0 = (I0.1 | M0.0) & I0.0 & I0.2   # run latch\nT1 = TON(M0.0, 6s)                    # star time\nQ0.1 = M0.0 & !T1 & !Q0.2             # K2 star\nQ0.0 = M0.0 & (Q0.1 | Q0.0)           # K1 main follows star\nT2 = TON(T1, 80ms)                    # dead time Y→Δ\nQ0.2 = M0.0 & T2 & !Q0.1              # K3 delta") },
    flasher: { t: L("ไฟกะพริบด้วยไทเมอร์สองตัว", "Flasher with two timers"),
      io: { "I0.0": [L("สวิตช์เปิด", "Enable switch"), "toggle"], "Q0.0": [L("ไฟกะพริบ", "Flashing lamp"), "amber"] },
      p: L("T1 = TON(I0.0 & !T2, 0.5s)   # เวลาติด\nT2 = TON(T1, 0.5s)          # เวลาดับ แล้วเริ่ม T1 ใหม่\nQ0.0 = I0.0 & !T1", "T1 = TON(I0.0 & !T2, 0.5s)   # ON time\nT2 = TON(T1, 0.5s)          # OFF time, then restarts T1\nQ0.0 = I0.0 & !T1") },
    traffic: { t: L("ไฟจราจรสองทิศ", "Two-way traffic light"), plant: "traffic",
      io: { "I0.0": [L("เปิดระบบ", "Run"), "toggle"], "Q0.0": ["NS " + L("เขียว", "green"), "green"], "Q0.1": ["NS " + L("เหลือง", "amber"), "amber"], "Q0.2": ["NS " + L("แดง", "red"), "red"],
        "Q0.3": ["EW " + L("เขียว", "green"), "green"], "Q0.4": ["EW " + L("เหลือง", "amber"), "amber"], "Q0.5": ["EW " + L("แดง", "red"), "red"] },
      p: "M0.0 = I0.0\nT1 = TON(M0.0 & !T6, 5s)   # NS " + L("เขียว", "green") + "\nT2 = TON(T1, 2s)          # NS " + L("เหลือง", "amber") + "\nT3 = TON(T2, 1s)          # " + L("แดงทุกทิศ", "all red") + "\nT4 = TON(T3, 5s)          # EW " + L("เขียว", "green") + "\nT5 = TON(T4, 2s)          # EW " + L("เหลือง", "amber") + "\nT6 = TON(T5, 1s)          # " + L("แดงทุกทิศ → เริ่มใหม่", "all red → restart") + "\nQ0.0 = M0.0 & !T1\nQ0.1 = T1 & !T2\nQ0.2 = !M0.0 | T2\nQ0.3 = T3 & !T4\nQ0.4 = T4 & !T5\nQ0.5 = !M0.0 | !T3 | T5" },
    tank: { t: L("เติมถังอัตโนมัติด้วยสวิตช์ระดับ", "Automatic tank filling with level switches"), plant: "tank",
      io: { "I0.0": ["STOP", "ncpush"], "I0.1": ["START", "push"], "I0.2": [L("LL ระดับต่ำ", "LL low level"), "plant"], "I0.3": [L("LH ระดับสูง", "LH high level"), "plant"], "I0.4": [L("เปิดก๊อกใช้น้ำ", "Open consumer valve"), "toggle"],
        "Q0.0": [L("ปั๊มเติม", "Fill pump"), "motor"], "Q0.1": [L("วาล์วจ่ายน้ำ", "Outlet valve"), "green"], "Q0.2": [L("ไฟถังเต็ม", "Tank full lamp"), "green"], "M0.0": [L("ระบบทำงาน", "System on"), "mem"] },
      p: L("M0.0 = (I0.1 | M0.0) & I0.0     # ระบบทำงาน\nS Q0.0 = M0.0 & !I0.2            # ต่ำกว่า LL → ปั๊มติด\nR Q0.0 = I0.3 | !M0.0            # ถึง LH หรือปิดระบบ → ปั๊มดับ\nQ0.1 = I0.4                      # วาล์วจ่ายน้ำ\nQ0.2 = I0.3", "M0.0 = (I0.1 | M0.0) & I0.0     # system on\nS Q0.0 = M0.0 & !I0.2            # below LL → pump on\nR Q0.0 = I0.3 | !M0.0            # at LH or system off → pump off\nQ0.1 = I0.4                      # consumer valve\nQ0.2 = I0.3") },
    counter: { t: L("นับชิ้นงานลงกล่อง (CTU)", "Packing counter (CTU)"), plant: "conveyor",
      io: { "I0.0": ["STOP", "ncpush"], "I0.1": ["START", "push"], "I0.2": [L("เซนเซอร์นับชิ้น", "Photo-eye"), "plant"], "I0.3": [L("รีเซ็ตเคาน์เตอร์", "Counter reset"), "push"],
        "Q0.0": [L("สายพาน", "Conveyor"), "motor"], "Q0.1": [L("กล่องเต็ม", "Box full"), "amber"] },
      p: L("Q0.0 = (I0.1 | Q0.0) & I0.0 & !C1   # เดินจนครบ 6 ชิ้น\nC1 = CTU(I0.2, I0.3, 6)\nQ0.1 = C1", "Q0.0 = (I0.1 | Q0.0) & I0.0 & !C1   # run until 6 parts\nC1 = CTU(I0.2, I0.3, 6)\nQ0.1 = C1") },
    setreset: { t: L("SET/RESET และขอบสัญญาณ", "SET/RESET and edges"),
      io: { "I0.0": [L("ปุ่ม A", "Button A"), "push"], "I0.1": [L("ปุ่ม B", "Button B"), "push"], "Q0.0": [L("ไฟ SET/RESET", "SET/RESET lamp"), "green"], "Q0.1": [L("สลับทุกครั้งที่กด A", "Toggles on each A press"), "amber"] },
      p: L("S Q0.0 = I0.0\nR Q0.0 = I0.1\n# สลับสถานะทุกครั้งที่กด (ขอบขาขึ้น)\nM0.1 = P(I0.0)\nS M0.2 = M0.1 & !Q0.1\nR M0.2 = M0.1 & Q0.1\nQ0.1 = M0.2", "S Q0.0 = I0.0\nR Q0.0 = I0.1\n# toggle (flip-flop) with a rising edge\nM0.1 = P(I0.0)\nS M0.2 = M0.1 & !Q0.1\nR M0.2 = M0.1 & Q0.1\nQ0.1 = M0.2") },
  };

  // ------------------------------------------------------------------ parser
  function tokenize(s) {
    var out = [], re = /\s*(\d+(?:\.\d+)?\s*(?:ms|s)\b|\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*(?:\.\d+)?|[()&|!,=+*\/])/y, m, i = 0;
    s = s.replace(/\s+$/, "");
    while (i < s.length) {
      re.lastIndex = i; m = re.exec(s);
      if (!m) throw new Error(L("อ่านไม่ออกที่: ", "Cannot read at: ") + s.slice(i, i + 12));
      out.push(m[1].replace(/\s+/g, "")); i = re.lastIndex;
    }
    return out;
  }
  var VAR = /^(I|Q)[01]\.[0-7]$|^M\d\.[0-7]$|^T\d{1,2}$|^C\d{1,2}$/;
  function parseExpr(tk, pos) {
    var p = { i: pos };
    function peek() { return tk[p.i]; }
    function eat(t) { if (tk[p.i] !== t) throw new Error(L("คาดว่าจะพบ ", "Expected ") + t + L(" แต่พบ ", " but found ") + (tk[p.i] || L("จบบรรทัด", "end of line"))); p.i++; }
    function or() { var a = [and()]; while (peek() === "|" || peek() === "+" || (peek() || "").toUpperCase() === "OR") { p.i++; a.push(and()); } return a.length > 1 ? { op: "or", a: a } : a[0]; }
    function and() { var a = [not()]; while (peek() === "&" || peek() === "*" || (peek() || "").toUpperCase() === "AND") { p.i++; a.push(not()); } return a.length > 1 ? { op: "and", a: a } : a[0]; }
    function not() { var t = peek(); if (t === "!" || t === "/" || (t || "").toUpperCase() === "NOT") { p.i++; return { op: "not", x: not() }; } return atom(); }
    function atom() {
      var t = peek();
      if (t === "(") { p.i++; var e = or(); eat(")"); return e; }
      if (t === "P" || t === "N") { if (tk[p.i + 1] === "(") { p.i += 2; var v = tk[p.i]; if (!VAR.test(v)) throw new Error(L("ขอบสัญญาณต้องใช้ตัวแปร: ", "Edge needs a variable: ") + v); p.i++; eat(")"); return { op: "edge", k: t, n: v }; } }
      if (t && (t.toUpperCase() === "TRUE" || t.toUpperCase() === "FALSE")) { p.i++; return { op: "const", v: t.toUpperCase() === "TRUE" }; }
      if (t && VAR.test(t)) { p.i++; return { op: "var", n: t }; }
      throw new Error(L("ตัวแปรไม่ถูกต้อง: ", "Unknown operand: ") + (t || L("จบบรรทัด", "end of line")));
    }
    var e = or();
    return { e: e, i: p.i };
  }
  function time(t) { var m = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(t || ""); if (!m) throw new Error(L("เวลาไม่ถูกต้อง (เช่น 5s, 500ms): ", "Bad time (e.g. 5s, 500ms): ") + t); return +m[1] * (m[2] === "ms" ? 0.001 : 1); }
  function parseLine(line, no) {
    var src = line.replace(/(#|\/\/).*$/, "").trim(); if (!src) return null;
    var cm = (line.match(/(?:#|\/\/)\s*(.*)$/) || [])[1] || "";
    var tk = tokenize(src), kind = "coil", i = 0;
    if ((tk[0] === "S" || tk[0] === "R") && VAR.test(tk[1] || "")) { kind = tk[0] === "S" ? "set" : "reset"; i = 1; }
    var tgt = tk[i];
    if (!VAR.test(tgt || "") || /^I/.test(tgt)) throw new Error(L("ปลายทางต้องเป็น Q M T หรือ C (ห้ามเขียนลงอินพุต I): ", "Target must be Q, M, T or C (inputs cannot be written): ") + (tgt || ""));
    if (tk[i + 1] !== "=") throw new Error(L("ต้องมีเครื่องหมาย = หลัง ", "Expected = after ") + tgt);
    var f = (tk[i + 2] || "").toUpperCase();
    if (/^T/.test(tgt) && (f === "TON" || f === "TOF" || f === "TP")) {
      if (tk[i + 3] !== "(") throw new Error("TON(…)");
      var r = parseExpr(tk, i + 4); if (tk[r.i] !== ",") throw new Error(L("รูปแบบ TON(เงื่อนไข, เวลา)", "Use TON(condition, time)"));
      var pt = time(tk[r.i + 1]); if (tk[r.i + 2] !== ")") throw new Error(")");
      return { kind: "timer", f: f, n: tgt, e: r.e, pt: pt, no: no, cm: cm };
    }
    if (/^C/.test(tgt) && f === "CTU") {
      var a = parseExpr(tk, i + 4); if (tk[a.i] !== ",") throw new Error(L("รูปแบบ CTU(นับ, รีเซ็ต, PV)", "Use CTU(count, reset, PV)"));
      var b = parseExpr(tk, a.i + 1); if (tk[b.i] !== ",") throw new Error("CTU(…, …, PV)");
      var pv = +tk[b.i + 1]; if (!(pv >= 1)) throw new Error("PV ≥ 1");
      return { kind: "counter", n: tgt, e: a.e, r: b.e, pv: pv, no: no, cm: cm };
    }
    if (/^[TC]/.test(tgt)) throw new Error(L("T ใช้กับ TON/TOF/TP และ C ใช้กับ CTU", "T is for TON/TOF/TP and C for CTU"));
    var x = parseExpr(tk, i + 2); if (x.i !== tk.length) throw new Error(L("มีข้อความเกิน: ", "Unexpected: ") + tk.slice(x.i).join(" "));
    return { kind: kind, n: tgt, e: x.e, no: no, cm: cm };
  }
  // push NOT down to the contacts (De Morgan) so the rung is drawable with NO/NC contacts
  function norm(e, neg) {
    if (e.op === "not") return norm(e.x, !neg);
    if (e.op === "and" || e.op === "or") {
      var op = (e.op === "and") !== !!neg ? "and" : "or", a = [];
      e.a.forEach(function (x) { var y = norm(x, neg); if (y.op === op) a = a.concat(y.a); else a.push(y); });   // flatten A&(B&C)
      return { op: op, a: a };
    }
    if (e.op === "const") return { op: "const", v: neg ? !e.v : e.v };
    return { op: e.op, n: e.n, k: e.k, neg: !!neg, id: Math.random().toString(36).slice(2, 8) };
  }
  function compile(text) {
    var rungs = [], errs = [];
    text.split(/\n/).forEach(function (ln, k) {
      try { var r = parseLine(ln, k + 1); if (r) { r.e = norm(r.e, false); if (r.r) r.r = norm(r.r, false); rungs.push(r); } }
      catch (e) { errs.push(L("บรรทัด ", "Line ") + (k + 1) + ": " + e.message); }
    });
    return { rungs: rungs, errs: errs };
  }

  // ------------------------------------------------------------------ ladder drawing (series = AND, parallel = OR)
  var CW = 96, RH = 60;
  function size(e) {
    if (e.op === "and") return e.a.reduce(function (s, x) { var z = size(x); return { w: s.w + z.w, h: Math.max(s.h, z.h) }; }, { w: 0, h: 1 });
    if (e.op === "or") return e.a.reduce(function (s, x) { var z = size(x); return { w: Math.max(s.w, z.w), h: s.h + z.h }; }, { w: 1, h: 0 });
    return { w: 1, h: 1 };
  }
  function Drawer(mem, label) {
    var out = [];
    var hot = function (b) { return b ? "lh" : "lc"; };
    function wire(x1, y1, x2, y2, on) { out.push('<line class="' + hot(on) + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'); }
    function contact(e, x, y, pin) {
      var v = val(e, mem, false), cy = y + 24, on = pin && v;
      wire(x, cy, x + 24, cy, pin); wire(x + 50, cy, x + CW, cy, on);
      out.push('<g class="ct ' + (v ? "cl" : "op") + '"><line x1="' + (x + 24) + '" y1="' + (cy - 12) + '" x2="' + (x + 24) + '" y2="' + (cy + 12) + '"/><line x1="' + (x + 50) + '" y1="' + (cy - 12) + '" x2="' + (x + 50) + '" y2="' + (cy + 12) + '"/>' +
        (e.op === "const" ? "" : e.neg ? '<line x1="' + (x + 20) + '" y1="' + (cy + 12) + '" x2="' + (x + 54) + '" y2="' + (cy - 12) + '"/>' : "") +
        (e.op === "edge" ? '<text x="' + (x + 37) + '" y="' + (cy + 4) + '" class="ek">' + e.k + "</text>" : "") + "</g>");
      var nm = e.op === "const" ? (e.v ? "TRUE" : "FALSE") : e.n;
      out.push('<text x="' + (x + 37) + '" y="' + (y + 8) + '" class="vn">' + nm + "</text>");
      var lb = label(nm); if (lb) out.push('<text x="' + (x + 37) + '" y="' + (y + 50) + '" class="vl">' + (lb.length > 16 ? lb.slice(0, 15) + "…" : lb) + "</text>");
      return on;
    }
    // draws e with its top wire at row y; returns output power
    function node(e, x, y, pin, W) {
      var z = size(e); W = W || z.w;
      if (e.op === "and") {
        var p = pin, xx = x;
        e.a.forEach(function (c, i) { var zc = size(c); var last = i === e.a.length - 1; p = node(c, xx, y, p, last ? W - (xx - x) / CW : zc.w); xx += (last ? W - (xx - x) / CW : zc.w) * CW; });
        return p;
      }
      if (e.op === "or") {
        var yy = y, res = false, outs = [];
        e.a.forEach(function (c) { var o = node(c, x, yy, pin, W); outs.push([yy, o]); res = res || o; yy += size(c).h * RH; });
        var yl = outs[outs.length - 1][0];
        wire(x, y + 24, x, yl + 24, pin);
        outs.forEach(function (q, i) { if (i) wire(x + W * CW, q[0] + 24, x + W * CW, outs[i - 1][0] + 24, q[1] || outs.slice(i).some(function (r) { return r[1]; })); });
        return res;
      }
      var o = contact(e, x, y, pin);
      if (W > 1) wire(x + CW, y + 24, x + W * CW, y + 24, o);
      return o;
    }
    return { out: out, node: node, wire: wire };
  }
  function val(e, mem) {
    if (e.op === "const") return e.v;
    var v;
    if (e.op === "edge") { var cur = !!mem.get(e.n), pr = mem.edge[e.id]; v = e.k === "P" ? cur && pr === false : !cur && pr === true; }
    else v = !!mem.get(e.n);
    return e.neg ? !v : v;
  }
  function evalE(e, mem) {
    if (e.op === "and") { var r = true; e.a.forEach(function (x) { r = evalE(x, mem) && r; }); return r; }
    if (e.op === "or") { var q = false; e.a.forEach(function (x) { q = evalE(x, mem) || q; }); return q; }
    var v = val(e, mem);
    if (e.op === "edge") mem.edgeNext[e.id] = !!mem.get(e.n);
    return v;
  }

  // ------------------------------------------------------------------ simulator widget
  function Sim(host) {
    var st = { preset: host.getAttribute("data-preset") || "dol", run: true, scanMs: 10, scans: 0, prog: null, io: {}, phys: {}, held: {}, plant: { level: 30, conv: 0, pos: 0 } };
    var mem = {
      bits: {}, T: {}, C: {}, edge: {}, edgeNext: {}, img: {},
      get: function (n) { if (/^I/.test(n)) return mem.img[n]; if (/^T/.test(n)) return mem.T[n] ? mem.T[n].q : false; if (/^C/.test(n)) return mem.C[n] ? mem.C[n].q : false; return mem.bits[n]; },
    };
    host.innerHTML = "";
    var bar = el("div", "ps-bar"); host.appendChild(bar);
    var sel = el("select"); Object.keys(PRESETS).forEach(function (k) { var o = el("option", "", PRESETS[k].t); o.value = k; sel.appendChild(o); }); bar.appendChild(sel);
    var runB = el("button", "ps-run", "RUN"); runB.type = "button"; bar.appendChild(runB);
    var scanL = el("label", "ps-scan"); var scanR = el("input"); scanR.type = "range"; scanR.min = 1; scanR.max = 200; scanR.value = 10;
    var scanO = el("output"); scanL.appendChild(el("span", "", L("เวลาสแกน", "Scan time"))); scanL.appendChild(scanR); scanL.appendChild(scanO); bar.appendChild(scanL);
    var cnt = el("span", "ps-cnt mono"); bar.appendChild(cnt);
    var grid = el("div", "ps-grid"); host.appendChild(grid);
    var ioBox = el("div", "ps-io"); grid.appendChild(ioBox);
    var inBox = el("div", "ps-in"), outBox = el("div", "ps-out"), plantBox = el("div", "ps-plant");
    ioBox.appendChild(el("p", "ps-h", L("อินพุต (กด/คลิก)", "Inputs (press/click)"))); ioBox.appendChild(inBox);
    ioBox.appendChild(el("p", "ps-h", L("เอาต์พุต · หน่วยความจำ", "Outputs · memory"))); ioBox.appendChild(outBox); ioBox.appendChild(plantBox);
    var lad = el("div", "ps-lad"); grid.appendChild(lad);
    var edWrap = el("details", "ps-ed"); host.appendChild(edWrap);
    edWrap.appendChild(el("summary", "", L("แก้ไขโปรแกรม (ข้อความ → แลดเดอร์)", "Edit the program (text → ladder)")));
    var ta = el("textarea"); ta.rows = 8; ta.spellcheck = false; edWrap.appendChild(ta);
    var edBtns = el("div", "ps-edb"); edWrap.appendChild(edBtns);
    var load = el("button", "", L("โหลดลง PLC", "Download to PLC")); load.type = "button"; edBtns.appendChild(load);
    var help = el("span", "ps-help", L("ตัวดำเนินการ: ! NOT · & AND · | OR · S/R ตั้ง/รีเซ็ต · TON TOF TP · CTU · P() N() ขอบสัญญาณ", "Operators: ! NOT · & AND · | OR · S/R set/reset · TON TOF TP · CTU · P() N() edges")); edBtns.appendChild(help);
    var errB = el("pre", "ps-err"); edWrap.appendChild(errB);
    if (host.getAttribute("data-edit") === "false") edWrap.hidden = true;

    function labelOf(n) { var d = st.io[n]; return d ? d[0] : ""; }
    function loadPreset(k) {
      st.preset = k; sel.value = k; var P = PRESETS[k]; st.io = P.io; ta.value = P.p; st.plant = { level: 30, conv: 0, pos: 0, t: 0 };
      compileNow(); buildIO();
    }
    function compileNow() {
      var c = compile(ta.value);
      errB.textContent = c.errs.join("\n"); errB.hidden = !c.errs.length;
      if (!c.errs.length) { st.prog = c.rungs; mem.bits = {}; mem.T = {}; mem.C = {}; mem.edge = {}; mem.edgeNext = {}; st.scans = 0; }
      buildIO();
    }
    function used() {
      var set = {};
      var walk = function (e) { if (!e) return; if (e.a) e.a.forEach(walk); else if (e.n) set[e.n] = 1; };
      (st.prog || []).forEach(function (r) { walk(r.e); walk(r.r); set[r.n] = 1; });
      Object.keys(st.io).forEach(function (k) { set[k] = 1; });
      return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, "en", { numeric: true }); });
    }
    function buildIO() {
      inBox.innerHTML = ""; outBox.innerHTML = "";
      used().forEach(function (n) {
        if (/^I/.test(n)) {
          var d = st.io[n] || [n, "push"], ty = d[1];
          st.phys[n] = st.phys[n] || false;
          var b = el("button", "ps-ib " + ty, '<b>' + n + "</b><span>" + d[0] + "</span><i></i>"); b.type = "button"; b.setAttribute("data-n", n);
          if (ty === "plant") b.disabled = true;
          if (/push/.test(ty)) {
            var dn = function (e) { e.preventDefault(); st.phys[n] = true; }, up = function () { st.phys[n] = false; };
            b.addEventListener("pointerdown", dn); b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up);
            b.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); st.phys[n] = true; } });
            b.addEventListener("keyup", up);
          } else if (/toggle/.test(ty)) b.addEventListener("click", function () { st.phys[n] = !st.phys[n]; });
          inBox.appendChild(b);
        } else {
          var dd = st.io[n] || [""], o = el("div", "ps-ob " + (dd[1] || (/^M/.test(n) ? "mem" : /^T/.test(n) ? "tmr" : /^C/.test(n) ? "ctr" : "green")), '<i></i><b>' + n + "</b><span>" + (dd[0] || "") + "</span><em></em>");
          o.setAttribute("data-n", n); outBox.appendChild(o);
        }
      });
    }
    function inputSignal(n) {
      var d = st.io[n] || [n, "push"], ty = d[1], p = st.phys[n];
      if (ty === "plant") return !!st.plant[n];
      return /^nc/.test(ty) ? !p : !!p;   // a physical NC contact gives 1 when NOT actuated
    }
    function scan(dt) {
      if (!st.prog) return;
      Object.keys(st.io).concat(used()).forEach(function (n) { if (/^I/.test(n)) mem.img[n] = inputSignal(n); });
      mem.edgeNext = {};
      st.prog.forEach(function (r) {
        var v = evalE(r.e, mem);
        if (r.kind === "coil") mem.bits[r.n] = v;
        else if (r.kind === "set") { if (v) mem.bits[r.n] = true; }
        else if (r.kind === "reset") { if (v) mem.bits[r.n] = false; }
        else if (r.kind === "timer") {
          var T = mem.T[r.n] || (mem.T[r.n] = { et: 0, q: false, run: false, pin: false });
          T.pt = r.pt; T.f = r.f;
          if (r.f === "TON") { if (v) { T.et = Math.min(r.pt, T.et + dt); T.q = T.et >= r.pt - 1e-9; } else { T.et = 0; T.q = false; } }
          else if (r.f === "TOF") { if (v) { T.q = true; T.et = 0; T.run = false; } else if (T.q) { T.et += dt; if (T.et >= r.pt - 1e-9) { T.q = false; T.et = r.pt; } } }
          else { if (v && !T.pin && !T.run) { T.run = true; T.et = 0; } if (T.run) { T.et = Math.min(r.pt, T.et + dt); T.q = true; if (T.et >= r.pt - 1e-9) { T.run = false; T.q = false; } } else { T.q = false; if (!v) T.et = 0; } }
          T.pin = v;
        } else if (r.kind === "counter") {
          var Cn = mem.C[r.n] || (mem.C[r.n] = { cv: 0, q: false, pin: false });
          var rv = evalE(r.r, mem); Cn.pv = r.pv;
          if (rv) Cn.cv = 0; else if (v && !Cn.pin) Cn.cv++;
          Cn.pin = v; Cn.q = Cn.cv >= r.pv;
        }
      });
      Object.keys(mem.edgeNext).forEach(function (k) { mem.edge[k] = mem.edgeNext[k]; });
      st.scans++;
    }
    function plantStep(dt) {
      var pl = st.plant, P = PRESETS[st.preset];
      if (P.plant === "tank") {
        var q = (mem.bits["Q0.0"] ? 9 : 0) - (mem.bits["Q0.1"] ? 6 : 0) - 0.4;
        pl.level = Math.max(0, Math.min(100, pl.level + q * dt));
        pl["I0.2"] = pl.level > 20; pl["I0.3"] = pl.level > 85;
      } else if (P.plant === "conveyor") {
        if (mem.bits["Q0.0"]) pl.pos += dt * 60;
        var ph = pl.pos % 80; pl["I0.2"] = ph > 52 && ph < 66;
      }
    }
    function plantView() {
      var P = PRESETS[st.preset], pl = st.plant, s = "";
      if (P.plant === "tank") {
        var h = 120 * pl.level / 100;
        s = '<svg viewBox="0 0 220 170" class="ps-sv"><rect x="70" y="20" width="80" height="120" class="tk"/><rect x="71" y="' + (140 - h) + '" width="78" height="' + h + '" class="liq"/>' +
          '<line x1="150" y1="' + (140 - 0.85 * 120) + '" x2="166" y2="' + (140 - 0.85 * 120) + '" class="lsw ' + (pl["I0.3"] ? "on" : "") + '"/><text x="170" y="' + (144 - 0.85 * 120) + '">LH</text>' +
          '<line x1="150" y1="' + (140 - 0.2 * 120) + '" x2="166" y2="' + (140 - 0.2 * 120) + '" class="lsw ' + (pl["I0.2"] ? "on" : "") + '"/><text x="170" y="' + (144 - 0.2 * 120) + '">LL</text>' +
          '<circle cx="35" cy="130" r="16" class="pm ' + (mem.bits["Q0.0"] ? "on" : "") + '"/><text x="35" y="134" text-anchor="middle">P</text><path d="M35 114 L35 10 L110 10 L110 20" class="pp"/>' +
          '<path d="M110 140 L110 158 L200 158" class="pp"/><rect x="150" y="150" width="14" height="16" class="vv ' + (mem.bits["Q0.1"] ? "on" : "") + '"/>' +
          '<text x="110" y="80" text-anchor="middle" class="big">' + pl.level.toFixed(0) + " %</text></svg>";
      } else if (P.plant === "conveyor") {
        s = '<svg viewBox="0 0 260 90" class="ps-sv"><rect x="10" y="50" width="240" height="12" rx="6" class="belt ' + (mem.bits["Q0.0"] ? "on" : "") + '"/>';
        for (var k = -1; k < 4; k++) { var x = ((pl.pos % 80) + k * 80); if (x > 0 && x < 236) s += '<rect x="' + x + '" y="30" width="20" height="20" class="box"/>'; }
        s += '<line x1="190" y1="10" x2="190" y2="48" class="eye ' + (pl["I0.2"] ? "on" : "") + '"/><text x="194" y="18">I0.2</text>';
        var C1 = mem.C["C1"]; s += '<text x="12" y="84">CV = ' + (C1 ? C1.cv : 0) + " / " + (C1 ? C1.pv : "—") + "</text></svg>";
      } else if (P.plant === "traffic") {
        var lamp = function (x, y, c, n) { return '<circle cx="' + x + '" cy="' + y + '" r="11" class="tl ' + c + (mem.bits[n] ? " on" : "") + '"/>'; };
        s = '<svg viewBox="0 0 220 110" class="ps-sv"><rect x="20" y="10" width="34" height="90" rx="8" class="hs"/><rect x="150" y="10" width="34" height="90" rx="8" class="hs"/>' +
          lamp(37, 28, "r", "Q0.2") + lamp(37, 55, "y", "Q0.1") + lamp(37, 82, "g", "Q0.0") + lamp(167, 28, "r", "Q0.5") + lamp(167, 55, "y", "Q0.4") + lamp(167, 82, "g", "Q0.3") +
          '<text x="37" y="108" text-anchor="middle">NS</text><text x="167" y="108" text-anchor="middle">EW</text></svg>';
      } else if (P.plant === "yd") {
        var y = mem.bits["Q0.1"] && mem.bits["Q0.0"], d = mem.bits["Q0.2"] && mem.bits["Q0.0"], bad = mem.bits["Q0.1"] && mem.bits["Q0.2"];
        s = '<svg viewBox="0 0 220 100" class="ps-sv">' + (bad ? '<text x="110" y="50" text-anchor="middle" class="big bad">' + L("ลัดวงจร!", "SHORT!") + "</text>" :
          y ? '<g class="w on"><line x1="110" y1="50" x2="110" y2="15"/><line x1="110" y1="50" x2="80" y2="70"/><line x1="110" y1="50" x2="140" y2="70"/></g><text x="110" y="92" text-anchor="middle">Y · 230 V</text>' :
          d ? '<polygon points="110,12 78,72 142,72" class="w on" fill="none"/><text x="110" y="92" text-anchor="middle">Δ · 400 V</text>' : '<text x="110" y="55" text-anchor="middle">' + L("มอเตอร์หยุด / ช่วงตาย", "motor off / dead time") + "</text>") + "</svg>";
      }
      plantBox.innerHTML = s;
    }
    function render() {
      // io states
      Array.prototype.forEach.call(inBox.children, function (b) { var n = b.getAttribute("data-n"); b.classList.toggle("on", !!mem.img[n]); b.classList.toggle("act", !!st.phys[n]); });
      Array.prototype.forEach.call(outBox.children, function (o) {
        var n = o.getAttribute("data-n"), on = !!mem.get(n), em = o.querySelector("em");
        o.classList.toggle("on", on);
        if (/^T/.test(n) && mem.T[n]) em.innerHTML = mem.T[n].f + " ET " + mem.T[n].et.toFixed(2) + " / " + mem.T[n].pt + " s<span style=\"width:" + (mem.T[n].et / mem.T[n].pt * 100).toFixed(0) + '%"></span>';
        else if (/^C/.test(n) && mem.C[n]) em.textContent = "CV " + mem.C[n].cv + " / PV " + mem.C[n].pv;
        else em.textContent = on ? "1" : "0";
      });
      cnt.textContent = L("สแกน #", "scan #") + st.scans;
      plantView();
      // ladder
      if (!st.prog) { lad.innerHTML = ""; return; }
      var maxW = 3, y = 14, parts = [];
      st.prog.forEach(function (r) { var z = size(r.e); maxW = Math.max(maxW, z.w + (r.r ? Math.max(0, size(r.r).w - z.w) : 0)); });
      var X0 = 46, coilX = X0 + (maxW + 0.4) * CW, W = coilX + 150;
      st.prog.forEach(function (r) {
        var D = Drawer(mem, labelOf), z = size(r.e), zr = r.r ? size(r.r) : { w: 0, h: 0 };
        var pw = D.node(r.e, X0, y, true, Math.max(z.w, zr.w));
        var cy = y + 24, on = !!mem.get(r.n), lab = labelOf(r.n);
        var wOut = Math.max(z.w, zr.w) * CW + X0;
        D.wire(wOut, cy, coilX, cy, pw);
        var g = '<text x="10" y="' + (cy + 4) + '" class="rn">' + r.no + "</text>";
        if (r.kind === "timer" || r.kind === "counter") {
          var hh = (r.kind === "counter" ? (z.h + zr.h) : z.h) * RH - 12, info = r.kind === "timer" ? (mem.T[r.n] ? "ET " + mem.T[r.n].et.toFixed(1) + "s" : "") : (mem.C[r.n] ? "CV " + mem.C[r.n].cv : "");
          g += '<rect x="' + coilX + '" y="' + (y + 4) + '" width="96" height="' + hh + '" rx="4" class="fb ' + (on ? "on" : "") + '"/><text x="' + (coilX + 48) + '" y="' + (y + 20) + '" class="fbt">' + (r.f || "CTU") + " " + r.n + "</text>" +
            '<text x="' + (coilX + 48) + '" y="' + (y + 36) + '" class="fbs">' + (r.kind === "timer" ? "PT " + (r.pt < 1 ? Math.round(r.pt * 1000) + "ms" : r.pt + "s") : "PV " + r.pv) + " · " + info + "</text>" +
            '<text x="' + (coilX + 4) + '" y="' + (cy + 4 + 0) + '" class="pin">' + (r.kind === "timer" ? "IN" : "CU") + "</text>";
          if (r.kind === "counter") {
            var yr = y + z.h * RH, pr = D.node(r.r, X0, yr, true, Math.max(z.w, zr.w));
            D.wire(wOut, yr + 24, coilX, yr + 24, pr); g += '<text x="' + (coilX + 4) + '" y="' + (yr + 28) + '" class="pin">R</text>';
          }
          g += '<line x1="' + (coilX + 96) + '" y1="' + cy + '" x2="' + (coilX + 112) + '" y2="' + cy + '" class="' + (on ? "lh" : "lc") + '"/><text x="' + (coilX + 116) + '" y="' + (cy + 4) + '" class="vn" text-anchor="start">Q</text>';
        } else {
          var sym = r.kind === "set" ? "S" : r.kind === "reset" ? "R" : "";
          g += '<path d="M' + (coilX + 8) + " " + (cy - 13) + " A 16 16 0 0 0 " + (coilX + 8) + " " + (cy + 13) + " M" + (coilX + 30) + " " + (cy - 13) + " A 16 16 0 0 1 " + (coilX + 30) + " " + (cy + 13) + '" class="coil ' + (on ? "on" : "") + '"/>' +
            '<text x="' + (coilX + 19) + '" y="' + (cy + 4) + '" class="ek">' + sym + "</text><text x=\"" + (coilX + 19) + '" y="' + (y + 6) + '" class="vn">' + r.n + "</text>" +
            (lab ? '<text x="' + (coilX + 19) + '" y="' + (y + 52) + '" class="vl">' + lab + "</text>" : "") +
            '<line x1="' + (coilX + 38) + '" y1="' + cy + '" x2="' + (coilX + 60) + '" y2="' + cy + '" class="lc"/>';
        }
        if (r.cm) g += '<text x="' + (coilX + (r.kind === "timer" || r.kind === "counter" ? 132 : 66)) + '" y="' + (cy + 4) + '" class="cm">' + r.cm.replace(/</g, "&lt;").slice(0, 34) + "</text>";
        parts.push(D.out.join("") + g);
        y += Math.max(z.h + (r.kind === "counter" ? zr.h : 0), 1) * RH + 10;
      });
      var Wt = Math.max(W, coilX + 300);
      lad.innerHTML = '<svg viewBox="0 0 ' + Wt + " " + (y + 4) + '" style="min-width:' + Math.min(Wt, 760) + 'px" class="ps-svg" role="img" aria-label="' + L("แลดเดอร์ไดอะแกรม", "Ladder diagram") + '">' +
        '<line x1="' + X0 + '" y1="4" x2="' + X0 + '" y2="' + y + '" class="rail"/><line x1="' + (coilX + 60) + '" y1="4" x2="' + (coilX + 60) + '" y2="' + y + '" class="rail"/>' + parts.join("") + "</svg>";
    }

    sel.addEventListener("change", function () { loadPreset(sel.value); });
    load.addEventListener("click", compileNow);
    runB.addEventListener("click", function () { st.run = !st.run; runB.textContent = st.run ? "RUN" : "STOP"; runB.classList.toggle("off", !st.run); });
    scanR.addEventListener("input", function () { st.scanMs = +scanR.value; scanO.textContent = st.scanMs + " ms"; }); scanO.textContent = "10 ms";
    var last = null, acc = 0, racc = 0, visible = true;
    function loop(ts) {
      if (last == null) last = ts;
      var dt = Math.min(0.2, (ts - last) / 1000); last = ts;
      if (visible) {
        plantStep(dt);
        if (st.run) { acc += dt; var sc = st.scanMs / 1000, k = 0; while (acc >= sc && k < 400) { scan(sc); acc -= sc; k++; } }
        racc += dt; if (racc > 0.06) { racc = 0; render(); }
      }
      requestAnimationFrame(loop);
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(host);
    host._load = loadPreset;
    loadPreset(PRESETS[st.preset] ? st.preset : "dol"); render();
    requestAnimationFrame(loop);
  }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  // expose the compiler for tests in Node
  if (typeof module !== "undefined" && module.exports) { module.exports = { compile: compile, PRESETS: PRESETS }; return; }
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".plc-sim"), function (h) { Sim(h); });
    Array.prototype.forEach.call(document.querySelectorAll("button[data-plc-preset]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-plc-target"), h = id ? document.getElementById(id) : document.querySelector(".plc-sim");
        if (h && h._load) { h._load(b.getAttribute("data-plc-preset")); h.scrollIntoView({ behavior: "smooth", block: "center" }); }
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
