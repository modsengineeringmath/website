/* Accessible, dependency-free vector laboratory.
   <div class="vec-lab" data-dim="2" data-operation="projection"
        data-a="3,4,0" data-b="2,1,0"></div>
   data-dim: 2|3; data-operation: add|subtract|scale|dot|projection|cross.
   window.VectorMath.compute is also usable without a DOM for numerical checks. */
(function (root) {
  "use strict";
  var LIMIT = 10000, NS = "http://www.w3.org/2000/svg", sequence = 0;
  var OPERATIONS = {
    add: "บวก A + B", subtract: "ลบ A − B", scale: "คูณสเกลาร์ kA",
    dot: "Dot product A · B", projection: "Projection ของ A บน B", cross: "Cross product A × B"
  };
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function plus(a, b) { return a.map(function (v, i) { return v + b[i]; }); }
  function minus(a, b) { return a.map(function (v, i) { return v - b[i]; }); }
  function times(a, k) { return a.map(function (v) { return v * k; }); }
  function norm(a) { return Math.hypot(a[0], a[1], a[2]); }
  function clean(v) { return Object.is(v, -0) ? 0 : v; }
  function compute(a, b, k, dim, operation) {
    dim = Number(dim);
    if (dim !== 2 && dim !== 3) throw new Error("เลือกจำนวนมิติเป็น 2 หรือ 3");
    if (!Object.prototype.hasOwnProperty.call(OPERATIONS, operation)) throw new Error("เลือกการดำเนินการที่มีในรายการ");
    function validate(v, name) {
      if (!Array.isArray(v) || v.length < dim) throw new Error("กรอกองค์ประกอบของ " + name + " ให้ครบ");
      var result = [0, 0, 0];
      for (var i = 0; i < dim; i++) {
        if (typeof v[i] !== "number" || !Number.isFinite(v[i]) || Math.abs(v[i]) > LIMIT)
          throw new Error(name + " ต้องเป็นตัวเลขระหว่าง −10,000 ถึง 10,000");
        result[i] = clean(v[i]);
      }
      return result;
    }
    a = validate(a, "A"); b = validate(b, "B");
    if (typeof k !== "number" || !Number.isFinite(k) || Math.abs(k) > LIMIT)
      throw new Error("k ต้องเป็นตัวเลขระหว่าง −10,000 ถึง 10,000");
    var magnitudeA = norm(a), magnitudeB = norm(b), product = dot(a, b);
    // Normalize first: this avoids underflow/overflow in |A||B| and B·B.
    // Divide each component directly; taking 1 / |A| first could overflow for tiny A.
    var unitA = magnitudeA === 0 ? null : a.map(function (v) { return v / magnitudeA; });
    var unitB = magnitudeB === 0 ? null : b.map(function (v) { return v / magnitudeB; });
    var cosine = unitA && unitB ? Math.max(-1, Math.min(1, dot(unitA, unitB))) : null;
    var angle = cosine === null ? null : Math.acos(cosine) * 180 / Math.PI;
    var scalarComponent = unitB ? dot(a, unitB) : null;
    var projection = unitB ? times(unitB, scalarComponent) : null;
    var perpendicular = projection ? minus(a, projection) : null;
    var crossProduct = cross(a, b), result;
    if (operation === "add") result = plus(a, b);
    if (operation === "subtract") result = minus(a, b);
    if (operation === "scale") result = times(a, k);
    if (operation === "dot") result = product;
    if (operation === "projection") result = projection;
    if (operation === "cross") result = crossProduct;
    var relation = cosine === null ? "undefined" : Math.abs(cosine) < 1e-10 ? "perpendicular"
      : norm(cross(unitA, unitB)) < 1e-10 ? "parallel" : "oblique";
    var out = { a: a, b: b, k: k, dim: dim, operation: operation, magnitudeA: magnitudeA,
      magnitudeB: magnitudeB, dot: product, cross: crossProduct, angle: angle,
      scalarComponent: scalarComponent, projection: projection, perpendicular: perpendicular,
      result: result, relation: relation };
    Object.keys(out).forEach(function (key) {
      var value = out[key];
      if ((typeof value === "number" && !Number.isFinite(value)) ||
          (Array.isArray(value) && value.some(function (n) { return !Number.isFinite(n); })))
        throw new Error("ผลคำนวณอยู่นอกช่วงที่แสดงได้ กรุณาลดขนาดตัวเลข");
    });
    return out;
  }
  root.VectorMath = Object.freeze({ compute: compute, limit: LIMIT });
  if (typeof document === "undefined") return;

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function svgEl(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { e.setAttribute(key, attrs[key]); });
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function number(n) {
    if (n === null) return "ไม่กำหนด";
    n = clean(n);
    if (n === 0) return "0";
    return Math.abs(n) < 0.00001 || Math.abs(n) >= 1000000 ? n.toExponential(5).replace(/\.?(0+)(e)/, "$2") : String(Number(n.toPrecision(7)));
  }
  function tuple(a, dim) { return a ? "(" + a.slice(0, dim).map(number).join(", ") + ")" : "ไม่กำหนด"; }
  function products(a, b, dim) { return a.slice(0, dim).map(function (v, i) { return "(" + number(v) + ")(" + number(b[i]) + ")"; }).join(" + "); }
  function squares(a, dim) { return a.slice(0, dim).map(function (v) { return "(" + number(v) + ")²"; }).join(" + "); }
  function readout(state, parent) {
    parent.replaceChildren();
    var a = state.a, b = state.b, dim = state.dim, op = state.operation;
    function line(title, text, strong) {
      var row = el("div", "vecl-reading" + (strong ? " vecl-answer" : ""));
      row.append(el("b", "", title), el("span", "", text)); parent.appendChild(row);
    }
    line("เวกเตอร์ที่ใช้", "A = " + tuple(a, dim) + "   B = " + tuple(b, dim) + "   k = " + number(state.k));
    if (op === "add" || op === "subtract") {
      var symbol = op === "add" ? "+" : "−";
      line("คำนวณทีละองค์ประกอบ", "A " + symbol + " B = (" + a.slice(0, dim).map(function (v, i) {
        return number(v) + " " + symbol + " (" + number(b[i]) + ")";
      }).join(", ") + ") = " + tuple(state.result, dim), true);
      line("อ่านภาพ", op === "add" ? "เลื่อน B โดยรักษาขนาดและทิศ แล้วต่อหาง B ที่หัว A: ลูกศรจากจุดกำเนิดถึงหัวสุดท้ายคือ A + B"
        : "A − B = A + (−B): กลับทิศ B แล้วต่อที่หัว A");
    } else if (op === "scale") {
      line("คูณทุกองค์ประกอบ", number(state.k) + "A = (" + a.slice(0, dim).map(function (v) {
        return "(" + number(state.k) + ")(" + number(v) + ")";
      }).join(", ") + ") = " + tuple(state.result, dim), true);
      line("ขนาดและทิศ", "|kA| = |" + number(state.k) + "| × " + number(state.magnitudeA) + " = " + number(norm(state.result)) + "; " +
        (state.k === 0 || state.magnitudeA === 0 ? "ผลเป็นเวกเตอร์ศูนย์ จึงไม่มีทิศ" : state.k < 0 ? "ทิศตรงข้าม A" : "ทิศเดียวกับ A"));
    } else if (op === "dot") {
      line("คูณคู่แล้วบวก", "A · B = " + products(a, b, dim) + " = " + number(state.dot) + " (สเกลาร์)", true);
      line("หามุม", state.angle === null ? "เวกเตอร์ศูนย์ไม่มีทิศ จึงหามุมระหว่าง A กับ B ไม่ได้ แม้ dot product จะเท่ากับ 0"
        : "cos θ = (A · B)/(|A||B|) = " + number(state.dot) + "/(" + number(state.magnitudeA) + " × " + number(state.magnitudeB) + "); θ ≈ " + number(state.angle) + "°");
    } else if (op === "projection") {
      if (!state.projection) {
        line("Projection ไม่กำหนด", "B = 0 ไม่มีทิศให้ฉายลงไป กรุณาแก้ B ให้มีอย่างน้อยหนึ่งองค์ประกอบไม่เป็นศูนย์", true);
      } else {
        line("Scalar component (มีเครื่องหมาย)", "comp_B A = (A · B)/|B| = (" + products(a, b, dim) + ")/" + number(state.magnitudeB) + " = " + number(state.scalarComponent), true);
        line("องค์ประกอบขนาน", "A∥ = proj_B A = [(A · B)/(B · B)]B = [" + number(state.dot) + "/(" + squares(b, dim) + ")]" + tuple(b, dim) + " = " + tuple(state.projection, dim), true);
        line("องค์ประกอบตั้งฉาก", "A⊥ = A − A∥ = " + tuple(a, dim) + " − " + tuple(state.projection, dim) + " = " + tuple(state.perpendicular, dim));
        line("ตรวจสอบ", "A∥ + A⊥ = A; A⊥ · B ≈ " + number(dot(state.perpendicular, b)) + "; |A∥| = |comp_B A| = " + number(norm(state.projection)));
        line("อ่านเครื่องหมาย", state.scalarComponent < 0 ? "comp_B A เป็นลบ: A∥ ชี้สวนทาง B ส่วนความยาว |A∥| เป็นค่าที่ไม่ติดลบ"
          : state.scalarComponent === 0 ? "comp_B A = 0: ไม่มีส่วนของ A ตามแนว B" : "comp_B A เป็นบวก: A∥ ชี้ไปทางเดียวกับ B");
      }
    } else if (op === "cross") {
      line("คูณไขว้ตามลำดับ", "A × B = (AyBz − AzBy, AzBx − AxBz, AxBy − AyBx)");
      line("แทนค่าจริง", "= ((" + number(a[1]) + ")(" + number(b[2]) + ") − (" + number(a[2]) + ")(" + number(b[1]) + "), (" + number(a[2]) + ")(" + number(b[0]) + ") − (" + number(a[0]) + ")(" + number(b[2]) + "), (" + number(a[0]) + ")(" + number(b[1]) + ") − (" + number(a[1]) + ")(" + number(b[0]) + ")) = " + tuple(state.cross, 3), true);
      line("พื้นที่และทิศ", "|A × B| = " + number(norm(state.cross)) + " คือพื้นที่สี่เหลี่ยมด้านขนาน; B × A = −(A × B). ใช้กฎมือขวาจาก A ไป B");
      line("ตรวจสอบตั้งฉาก", "(A × B) · A ≈ " + number(dot(state.cross, a)) + "; (A × B) · B ≈ " + number(dot(state.cross, b)));
      if (dim === 2) line("เวกเตอร์ 2D ในระนาบ xy", "ใส่ Az = Bz = 0 จึงได้ผลตามแกน z; ⊙ คือ +z ออกจากหน้า และ ⊗ คือ −z เข้าหน้า เลือก 3D เพื่อดูแกน z");
    }
    line("ขนาดเวกเตอร์", "|A| = √[" + squares(a, dim) + "] ≈ " + number(state.magnitudeA) + "; |B| = √[" + squares(b, dim) + "] ≈ " + number(state.magnitudeB));
    var relations = { parallel: "ขนานกัน", perpendicular: "ตั้งฉากกัน", oblique: "ทำมุมกัน", undefined: "มีเวกเตอร์ศูนย์: ทิศและมุมไม่กำหนด" };
    line("ความสัมพันธ์ A กับ B", relations[state.relation] + (state.angle === null ? "" : "; θ ≈ " + number(state.angle) + "° (ตรวจด้วยความคลาดเคลื่อนเชิงตัวเลข 10⁻¹⁰)"));
    if (state.magnitudeA === 0 || state.magnitudeB === 0) line("เวกเตอร์ศูนย์", "0 มีขนาด 0 แต่ไม่มีทิศ: dot และ cross กับ 0 ได้ 0; proj_B 0 = 0 เมื่อ B ≠ 0; proj_0 A ไม่กำหนด");
    line("ความแม่นยำ", "ผลแสดงสูงสุด 7 หลักนัยสำคัญ; ตัวเลขเล็กมากอาจเกิดการปัดเศษระดับเครื่องคอมพิวเตอร์");
  }

  function draw(state, svg, components) {
    var W = 640, H = 420, pad = 55, zero = [0, 0, 0], is3D = state.dim === 3;
    svg.replaceChildren();
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var title = svgEl("title", {}, svg, "ภาพเวกเตอร์ " + state.dim + " มิติ: " + OPERATIONS[state.operation]);
    var description = svgEl("desc", {}, svg, "A สีส้ม " + tuple(state.a, state.dim) + "; B สีน้ำเงิน " + tuple(state.b, state.dim) + "; ผลลัพธ์สีเขียว. " + (is3D ? "ภาพฉายไอโซเมตริก มุมในภาพไม่ใช่มุมจริง อ่านค่ามุมจากผลคำนวณ" : "แกน x และ y ใช้มาตราส่วนเดียวกัน"));
    title.id = "vecl-title-" + (++sequence); description.id = title.id + "-desc";
    svg.setAttribute("aria-labelledby", title.id + " " + description.id);
    var op = state.operation, vectors = [state.a, state.b];
    if (Array.isArray(state.result) && !(op === "cross" && !is3D)) vectors.push(state.result);
    if (op === "projection" && state.projection) vectors.push(state.projection);
    if (op === "subtract") vectors.push(times(state.b, -1));
    var axisSize = Math.max.apply(null, vectors.reduce(function (all, v) { return all.concat(v.map(Math.abs)); }, [1])) * 1.12;
    function raw(v) { return is3D ? [0.8660254 * (v[0] - v[1]), 0.5 * (v[0] + v[1]) - v[2]] : [v[0], -v[1]]; }
    var points = vectors.concat([zero]);
    if (components) points.push([state.a[0], 0, 0], [state.a[0], state.a[1], 0]);
    var axes = is3D ? [[axisSize, 0, 0], [0, axisSize, 0], [0, 0, axisSize]] : [[axisSize, 0, 0], [0, axisSize, 0]];
    axes.forEach(function (v) { points.push(v, times(v, -0.2)); });
    var projected = points.map(raw), xs = projected.map(function (p) { return p[0]; }), ys = projected.map(function (p) { return p[1]; });
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs), ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
    var scale = Math.min((W - 2 * pad) / Math.max(1, xmax - xmin), (H - 2 * pad) / Math.max(1, ymax - ymin));
    function map(v) { var p = raw(v); return [W / 2 + (p[0] - (xmin + xmax) / 2) * scale, H / 2 + (p[1] - (ymin + ymax) / 2) * scale]; }
    function line(a, b, cls) { var u = map(a), v = map(b); return svgEl("line", { x1: u[0], y1: u[1], x2: v[0], y2: v[1], "class": cls }, svg); }
    function text(v, label, cls, offset) {
      var p = map(v);
      return svgEl("text", { x: Math.max(12, Math.min(W - 12, p[0] + (offset ? offset[0] : 10))),
        y: Math.max(18, Math.min(H - 12, p[1] + (offset ? offset[1] : -10))),
        "text-anchor": p[0] > W * 0.62 ? "end" : "start", "class": cls || "vecl-label" }, svg, label);
    }
    function arrow(a, b, cls, label, offset) {
      var u = map(a), v = map(b), dx = v[0] - u[0], dy = v[1] - u[1], length = Math.hypot(dx, dy);
      line(a, b, "vecl-arrow " + cls);
      if (length > 1) {
        var size = Math.min(10, length * 0.4), half = size * 0.43, ux = dx / length, uy = dy / length;
        svgEl("polygon", { points: v[0] + "," + v[1] + " " + (v[0] - size * ux - half * uy) + "," + (v[1] - size * uy + half * ux) + " " + (v[0] - size * ux + half * uy) + "," + (v[1] - size * uy - half * ux), "class": "vecl-head " + cls }, svg);
      } else svgEl("circle", { cx: v[0], cy: v[1], r: 3.5, "class": "vecl-head " + cls }, svg);
      if (label) text(b, label, "vecl-label " + cls, offset);
    }
    var origin = map(zero);
    if (!is3D) {
      var span = Math.max(xmax - xmin, ymax - ymin), rough = span / 8;
      var power = Math.pow(10, Math.floor(Math.log10(rough))), ratio = rough / power;
      // Round up to a readable tick interval instead of crowding labels on mobile.
      var step = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * power;
      var xlo = (pad - origin[0]) / scale, xhi = (W - pad - origin[0]) / scale;
      var ylo = (origin[1] - H + pad) / scale, yhi = (origin[1] - pad) / scale;
      for (var x = Math.ceil(xlo / step) * step, count = 0; x <= xhi && count < 30; x += step, count++) {
        line([x, ylo, 0], [x, yhi, 0], "vecl-grid");
        if (Math.abs(x) > step * 1e-6) text([x, 0, 0], number(x), "vecl-tick", [-8, 20]);
      }
      for (var y = Math.ceil(ylo / step) * step, c = 0; y <= yhi && c < 30; y += step, c++) {
        line([xlo, y, 0], [xhi, y, 0], "vecl-grid");
        if (Math.abs(y) > step * 1e-6) text([0, y, 0], number(y), "vecl-tick", [-36, 4]);
      }
      line([xlo, 0, 0], [xhi, 0, 0], "vecl-axis"); line([0, ylo, 0], [0, yhi, 0], "vecl-axis");
      text([xhi, 0, 0], "x", "vecl-label", [5, -8]); text([0, yhi, 0], "y", "vecl-label", [9, 0]);
    } else {
      axes.forEach(function (v, i) {
        line(times(v, -0.2), zero, "vecl-axis vecl-dash"); arrow(zero, v, "vecl-axis", ["x", "y", "z"][i]);
        text(times(v, 0.6), number(axisSize * 0.6), "vecl-tick", [7, 14]);
      });
    }
    text(zero, "0", "vecl-tick", [-14, 17]);
    if (components) {
      var xpart = [state.a[0], 0, 0], xypart = [state.a[0], state.a[1], 0];
      line(zero, xpart, "vecl-component"); line(xpart, xypart, "vecl-component");
      if (is3D) line(xypart, state.a, "vecl-component");
      text(times(xpart, 0.5), "Ax=" + number(state.a[0]), "vecl-tick vecl-a", [4, 18]);
      text(plus(xpart, [0, state.a[1] / 2, 0]), "Ay=" + number(state.a[1]), "vecl-tick vecl-a", [8, 4]);
      if (is3D) text(plus(xypart, [0, 0, state.a[2] / 2]), "Az=" + number(state.a[2]), "vecl-tick vecl-a", [8, 4]);
    }
    if (op === "add") {
      arrow(state.a, state.result, "vecl-b vecl-dash", "B (เลื่อน)", [10, 28]);
      arrow(state.b, state.result, "vecl-a vecl-dash");
    } else if (op === "subtract") {
      arrow(state.a, state.result, "vecl-b vecl-dash", "−B (เลื่อน)", [10, 28]);
    } else if (op === "projection" && state.projection) {
      arrow(state.projection, state.a, "vecl-perp vecl-dash", "A⊥", [10, 25]);
      if (!is3D && norm(state.projection) > 0 && norm(state.perpendicular) > 0) {
        var p = map(state.projection), o = map(zero), tip = map(state.a);
        var up = [o[0] - p[0], o[1] - p[1]], vp = [tip[0] - p[0], tip[1] - p[1]];
        var ul = Math.hypot(up[0], up[1]), vl = Math.hypot(vp[0], vp[1]), sz = Math.min(13, ul * 0.25, vl * 0.25);
        if (ul > 0.5 && vl > 0.5) {
          var u = [up[0] / ul * sz, up[1] / ul * sz], v = [vp[0] / vl * sz, vp[1] / vl * sz];
          svgEl("polyline", { points: (p[0] + u[0]) + "," + (p[1] + u[1]) + " " + (p[0] + u[0] + v[0]) + "," + (p[1] + u[1] + v[1]) + " " + (p[0] + v[0]) + "," + (p[1] + v[1]), "class": "vecl-right-angle" }, svg);
        }
      }
    }
    arrow(zero, state.a, "vecl-a", "A", [10, -12]); arrow(zero, state.b, "vecl-b", "B", [-28, -10]);
    if (Array.isArray(state.result) && !(op === "cross" && !is3D)) arrow(zero, state.result, "vecl-result", op === "projection" ? "A∥" : op === "cross" ? "A×B" : op === "scale" ? "kA" : op === "subtract" ? "A−B" : "A+B", [10, 13]);
    if (op === "dot" && !is3D && state.angle !== null) {
      var alpha = Math.atan2(-state.a[1], state.a[0]), beta = Math.atan2(-state.b[1], state.b[0]);
      var delta = Math.atan2(Math.sin(beta - alpha), Math.cos(beta - alpha)), radius = 33;
      var ax = origin[0] + radius * Math.cos(alpha), ay = origin[1] + radius * Math.sin(alpha);
      var bx = origin[0] + radius * Math.cos(alpha + delta), by = origin[1] + radius * Math.sin(alpha + delta);
      svgEl("path", { d: "M" + ax + " " + ay + " A" + radius + " " + radius + " 0 0 " + (delta > 0 ? 1 : 0) + " " + bx + " " + by, "class": "vecl-angle" }, svg);
      svgEl("text", { x: origin[0] + 48 * Math.cos(alpha + delta / 2), y: origin[1] + 48 * Math.sin(alpha + delta / 2), "class": "vecl-tick" }, svg, "θ");
    }
    if (op === "cross" && !is3D) text(zero, state.cross[2] === 0 ? "A×B = 0" : (state.cross[2] > 0 ? "⊙ +z" : "⊗ −z") + " : " + number(state.cross[2]), "vecl-label vecl-result", [12, 40]);
    svgEl("text", { x: 16, y: H - 10, "class": "vecl-tick" }, svg, is3D ? "ภาพฉายไอโซเมตริก • อ่านมุมจริงจากผลคำนวณ" : "แกน x, y มาตราส่วนเท่ากัน • ปรับช่วงแกนอัตโนมัติ");
  }

  var PRESETS = [
    { label: "แรง 2D / แยกองค์ประกอบ", dim: 2, a: [3, 4, 0], b: [1, 0, 0], k: 2, op: "projection" },
    { label: "ฉายสวนทิศ (ค่าติดลบ)", dim: 2, a: [-3, 4, 0], b: [2, 0, 0], k: -1, op: "projection" },
    { label: "ตั้งฉาก: dot = 0", dim: 2, a: [3, 4, 0], b: [-4, 3, 0], k: 1, op: "dot" },
    { label: "แรงบิด 3D: r × F", dim: 3, a: [0.4, 0.2, 0], b: [0, 50, 0], k: 1, op: "cross" },
    { label: "ฉายบนแนวสายเคเบิล 3D", dim: 3, a: [4, 2, -1], b: [2, 1, 2], k: 1, op: "projection" },
    { label: "ทดลองเวกเตอร์ศูนย์", dim: 2, a: [3, 4, 0], b: [0, 0, 0], k: 0, op: "projection" }
  ];
  function parseInitial(value, fallback) {
    if (!value) return fallback.slice();
    var parts = value.split(",").map(function (v) { return v.trim() === "" ? NaN : Number(v); });
    // Invalid supplied attributes are visible in the fields and validated; never silently clipped.
    return [parts[0], parts[1], parts.length > 2 ? parts[2] : 0];
  }
  function mount(host) {
    if (host.dataset.veclReady) return;
    var uid = "vecl-" + (++sequence), fields = {}, a = parseInitial(host.dataset.a, [3, 4, 0]), b = parseInitial(host.dataset.b, [2, 1, 0]);
    host.replaceChildren(); host.dataset.veclReady = "true";
    var heading = el("p", "vecl-heading", "Vector Lab · ทดลองเวกเตอร์ 2D / 3D"); heading.id = uid + "-heading";
    host.setAttribute("role", "region"); host.setAttribute("aria-labelledby", heading.id); host.appendChild(heading);
    var controls = el("div", "vecl-controls"); host.appendChild(controls);
    function select(label, key, entries) {
      var wrap = el("label", "vecl-field"), select = el("select");
      wrap.appendChild(el("span", "", label));
      entries.forEach(function (item) { var option = el("option", "", item[1]); option.value = item[0]; select.appendChild(option); });
      wrap.appendChild(select); controls.appendChild(wrap); fields[key] = select; return select;
    }
    select("จำนวนมิติ", "dim", [["2", "2 มิติ (xy)"], ["3", "3 มิติ (xyz)"]]).value = host.dataset.dim === "3" ? "3" : "2";
    select("การดำเนินการ", "operation", Object.keys(OPERATIONS).map(function (key) { return [key, OPERATIONS[key]]; })).value = Object.prototype.hasOwnProperty.call(OPERATIONS, host.dataset.operation) ? host.dataset.operation : "add";
    var vectors = el("div", "vecl-vectors"); host.appendChild(vectors);
    function numeric(parent, label, key, value) {
      var wrap = el("label", "vecl-number"), input = el("input");
      input.type = "number"; input.min = -LIMIT; input.max = LIMIT; input.step = "any";
      input.setAttribute("inputmode", "decimal"); input.setAttribute("aria-label", label);
      input.value = Number.isFinite(value) ? value : "";
      wrap.append(el("span", "", label), input); parent.appendChild(wrap); fields[key] = input;
      return wrap;
    }
    var zFields = [];
    [["A", a], ["B", b]].forEach(function (pair) {
      var set = el("fieldset", "vecl-vector vecl-vector-" + pair[0].toLowerCase());
      set.appendChild(el("legend", "", "เวกเตอร์ " + pair[0])); vectors.appendChild(set);
      ["x", "y", "z"].forEach(function (axis, i) {
        var wrap = numeric(set, pair[0] + axis, pair[0] + i, pair[1][i]); if (i === 2) zFields.push(wrap);
      });
    });
    var scalar = numeric(controls, "สเกลาร์ k", "k", 2);
    var hint = el("p", "vecl-note", "แก้ตัวเลขเพื่อดูผลทันที · รับค่าตั้งแต่ −10,000 ถึง 10,000 รวมทศนิยม · ใน 2D ใช้ Az = Bz = 0"); hint.id = uid + "-hint"; host.appendChild(hint);
    Object.keys(fields).forEach(function (key) { if (fields[key].type === "number") fields[key].setAttribute("aria-describedby", hint.id); });
    var presets = el("div", "vecl-presets"); presets.setAttribute("role", "group"); presets.setAttribute("aria-label", "ตัวอย่างเวกเตอร์");
    PRESETS.forEach(function (preset) {
      var button = el("button", "", preset.label); button.type = "button";
      button.addEventListener("click", function () {
        fields.dim.value = preset.dim; fields.operation.value = preset.op; fields.k.value = preset.k;
        ["A", "B"].forEach(function (name) { preset[name.toLowerCase()].forEach(function (value, i) { fields[name + i].value = value; }); }); update();
      }); presets.appendChild(button);
    }); host.appendChild(presets);
    var checkLabel = el("label", "vecl-checkbox"), componentCheckbox = el("input"); componentCheckbox.type = "checkbox"; componentCheckbox.checked = true;
    checkLabel.append(componentCheckbox, document.createTextNode(" แสดงองค์ประกอบ A ตามแกน")); host.appendChild(checkLabel);
    var error = el("p", "vecl-error"); error.id = uid + "-error"; error.setAttribute("role", "alert"); error.hidden = true; host.appendChild(error);
    var figure = el("figure", "vecl-figure"), plot = svgEl("svg", { "class": "vecl-plot", role: "img" });
    var caption = el("figcaption", "vecl-caption");
    figure.append(plot, caption); host.appendChild(figure);
    var legend = el("p", "vecl-legend"); legend.append(el("span", "vecl-a", "━━ A สีส้ม"), el("span", "vecl-b", "━━ B สีน้ำเงิน"), el("span", "vecl-result", "━━ ผล สีเขียว"), el("span", "vecl-perp", "┄┄ ส่วนตั้งฉาก / เวกเตอร์ที่เลื่อน")); host.appendChild(legend);
    var output = el("div", "vecl-output"); output.setAttribute("role", "status"); output.setAttribute("aria-live", "polite"); output.setAttribute("aria-atomic", "true"); host.appendChild(output);
    function update() {
      var dim = Number(fields.dim.value), operation = fields.operation.value;
      zFields.forEach(function (wrap) { wrap.hidden = dim === 2; wrap.querySelector("input").disabled = dim === 2; });
      scalar.hidden = operation !== "scale";
      var numbers = {}, invalid = [];
      Object.keys(fields).forEach(function (key) {
        var input = fields[key]; if (input.type !== "number") return;
        input.removeAttribute("aria-invalid"); input.removeAttribute("aria-errormessage");
        if (input.disabled || (key === "k" && operation !== "scale")) return;
        var value = input.value.trim(), parsed = value === "" ? NaN : Number(value);
        if (!Number.isFinite(parsed) || Math.abs(parsed) > LIMIT || input.validity.badInput) {
          input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-errormessage", error.id);
          invalid.push(input.getAttribute("aria-label"));
        } else numbers[key] = parsed;
      });
      if (invalid.length) {
        error.textContent = "กรุณากรอก " + invalid.join(", ") + " เป็นตัวเลขระหว่าง −10,000 ถึง 10,000; ยังไม่คำนวณจนกว่าค่าจะถูกต้อง";
        error.hidden = false; output.replaceChildren(); plot.replaceChildren(); figure.hidden = true; return;
      }
      try {
        var state = compute([numbers.A0, numbers.A1, dim === 3 ? numbers.A2 : 0], [numbers.B0, numbers.B1, dim === 3 ? numbers.B2 : 0], operation === "scale" ? numbers.k : 1, dim, operation);
        error.hidden = true; error.textContent = ""; figure.hidden = false;
        draw(state, plot, componentCheckbox.checked); readout(state, output);
        caption.textContent = dim === 3 ? "ภาพ 3D เป็นการฉายไอโซเมตริกลงจอ 2D: มุมและความยาวที่เห็นอาจต่างจากค่าจริง เวกเตอร์ตามแนวสายตาอาจฉายเป็นจุด โปรดอ่านค่าจากผลคำนวณ"
          : "ลูกศรแสดงทิศและขนาดตามสัดส่วนเดียวกันทั้งสองแกน เส้นประใช้แสดงองค์ประกอบหรือการเลื่อนเวกเตอร์โดยไม่เปลี่ยนขนาดและทิศ";
      } catch (err) {
        error.textContent = err.message; error.hidden = false; output.replaceChildren(); figure.hidden = true;
      }
    }
    controls.addEventListener("input", update); controls.addEventListener("change", update);
    vectors.addEventListener("input", update); componentCheckbox.addEventListener("change", update);
    update();
  }
  function initialize() { document.querySelectorAll(".vec-lab").forEach(mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true }); else initialize();
})(typeof window !== "undefined" ? window : globalThis);
