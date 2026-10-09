/* Mathematics Lesson Editor — Markdown + LaTeX with live preview.
   Runs entirely in the browser. Libraries (self-hosted): marked, DOMPurify, KaTeX auto-render. */
(function () {
  var DRAFT_KEY = "mem-lesson-draft";

  var SAMPLE = String.raw`# การหาปริพันธ์เบื้องต้น

> คณิตศาสตร์วิศวกรรม 1 — เอกสารประกอบการสอน

## จุดประสงค์การเรียนรู้

เมื่อศึกษาจบบทเรียน นักศึกษาสามารถหาปริพันธ์ของฟังก์ชันพหุนามได้

## 1. แนวคิดสำคัญ

การหาปริพันธ์ไม่จำกัดเขตเป็นกระบวนการหาฟังก์ชันต้นกำเนิด (Antiderivative) ซึ่งสัมพันธ์กับการหาอนุพันธ์

$$
\int x^n\,dx=\frac{x^{n+1}}{n+1}+C,\qquad n\ne -1
$$

โดยที่ $C$ คือค่าคงตัวของการอินทิเกรต

## 2. ตัวอย่างพร้อมวิธีทำ

**โจทย์** จงหาปริพันธ์ต่อไปนี้

$$
\int (3x^2+4x-5)\,dx
$$

**วิธีทำ** แยกอินทิกรัลเป็นแต่ละพจน์

$$
\begin{aligned}
\int (3x^2+4x-5)\,dx
&=3\int x^2\,dx+4\int x\,dx-5\int 1\,dx \\
&=3\left(\frac{x^3}{3}\right)+4\left(\frac{x^2}{2}\right)-5x+C \\
&=\boxed{x^3+2x^2-5x+C}
\end{aligned}
$$

## 3. แบบฝึกหัด

จงหาปริพันธ์และแสดงวิธีทำทีละขั้นตอน

$$
\int 5x^4\,dx
$$

## 4. เชื่อมโยงกับวิศวกรรมไฟฟ้า

เมื่อทราบกระแสไฟฟ้า $i(t)$ ปริมาณประจุที่เปลี่ยนแปลงระหว่างเวลา $t_1$ ถึง $t_2$ คือ

$$
\Delta q=\int_{t_1}^{t_2} i(t)\,dt
$$

---

*หมายเหตุผู้สอน: เพิ่มคำอธิบายและตัวอย่างที่เหมาะกับผู้เรียนได้ที่ช่องต้นฉบับ*`;

  var MATH_DELIMS = [
    { left: "$$", right: "$$", display: true },
    { left: "$", right: "$", display: false },
    { left: "\\[", right: "\\]", display: true },
    { left: "\\(", right: "\\)", display: false }
  ];

  var input = document.getElementById("source"),
      preview = document.getElementById("preview"),
      status = document.getElementById("status"),
      app = document.getElementById("editorApp");
  if (!input || !preview) return;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Protect math from Markdown: marked would turn \\ into \ and _x_ into <em>.
  // Math blocks are swapped for placeholders, Markdown is parsed, then the math is put back for KaTeX.
  function toHtml(md) {
    if (!window.marked) return "<pre>" + esc(md) + "</pre>";
    var store = [];
    var keep = function (m) { store.push(m); return "\uE000" + (store.length - 1) + "\uE001"; };
    var guarded = md
      .replace(/\$\$[\s\S]+?\$\$/g, keep)
      .replace(/\\\[[\s\S]+?\\\]/g, keep)
      .replace(/\\\([\s\S]+?\\\)/g, keep)
      .replace(/(^|[^\\$])\$(?!\s)([^\n$]+?)\$/g, function (m, pre, body) { return pre + keep("$" + body + "$"); });
    var html = window.marked.parse(guarded, { gfm: true, breaks: false });
    html = html.replace(/\uE000(\d+)\uE001/g, function (_, i) { return esc(store[+i]); });
    return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
  }

  function typeset(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, { delimiters: MATH_DELIMS, throwOnError: false, strict: "ignore" });
    }
  }

  var saveTimer, lastSaved = "";
  function render() {
    preview.innerHTML = toHtml(input.value);
    typeset(preview);
    var n = input.value.length.toLocaleString("th-TH");
    status.textContent = n + " ตัวอักษร · " + (lastSaved ? "บันทึกร่างในเบราว์เซอร์นี้แล้ว " + lastSaved : "ร่างจะถูกบันทึกในเบราว์เซอร์นี้อัตโนมัติ");
  }
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, input.value);
      lastSaved = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { lastSaved = ""; }
  }

  function title() {
    var m = input.value.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : "บทเรียนคณิตศาสตร์";
  }
  function fileBase() {
    var t = title().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60);
    return t || "mathematics-lesson";
  }
  function download(name, body, mime) {
    var blob = new Blob([body], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // Standalone HTML file: math is rendered by KaTeX from a CDN when the file is opened anywhere.
  function documentHtml() {
    var end = "</" + "script>";
    var k = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/";
    return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      "<title>" + esc(title()) + "</title>" +
      '<link rel="stylesheet" href="' + k + 'katex.min.css">' +
      "<style>body{max-width:820px;margin:35px auto;padding:0 18px;font:18px/1.9 system-ui,sans-serif;color:#172033}h1,h2{line-height:1.45}h2{margin-top:1.6em}" +
      ".katex-display{overflow-x:auto;overflow-y:hidden;padding:12px 0}blockquote{border-left:4px solid #b3c3db;padding:5px 16px;background:#f7f9fd;margin:16px 0}" +
      "table{border-collapse:collapse}td,th{border:1px solid #ccd;padding:6px 10px}footer{margin-top:48px;font-size:13px;color:#667}</style></head><body><article>" +
      toHtml(input.value) +
      '</article><footer>สร้างด้วยเครื่องมือเขียนบทเรียนจาก <a href="https://modsengineeringmath.com/tools/lesson-editor/">modsengineeringmath.com</a></footer>' +
      '<script defer src="' + k + 'katex.min.js">' + end +
      '<script defer src="' + k + "contrib/auto-render.min.js\" onload=\"renderMathInElement(document.body,{delimiters:" +
      esc(JSON.stringify(MATH_DELIMS)) + ',throwOnError:false})">' + end + "</body></html>";
  }

  // ----- events -----
  var pending;
  input.addEventListener("input", function () {
    clearTimeout(pending); pending = setTimeout(render, 180);
    clearTimeout(saveTimer); saveTimer = setTimeout(function () { saveDraft(); render(); }, 800);
  });

  var saveMd = function () { download(fileBase() + ".md", input.value, "text/markdown;charset=utf-8"); };
  document.getElementById("saveMd").addEventListener("click", saveMd);
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveMd(); }
  });
  document.getElementById("exportHtml").addEventListener("click", function () {
    download(fileBase() + ".html", documentHtml(), "text/html;charset=utf-8");
  });
  document.getElementById("printPdf").addEventListener("click", function () { window.print(); });

  var mobileBtn = document.getElementById("mobileBtn");
  mobileBtn.addEventListener("click", function () {
    var on = app.classList.toggle("is-mobile");
    mobileBtn.setAttribute("aria-pressed", on ? "true" : "false");
    mobileBtn.textContent = on ? "กลับมุมมองปกติ" : "ดูแบบมือถือ";
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    if (input.value === SAMPLE || confirm("แทนที่เนื้อหาปัจจุบันด้วยตัวอย่างเริ่มต้น?")) {
      input.value = SAMPLE; saveDraft(); render();
    }
  });

  document.getElementById("openMd").addEventListener("change", function (e) {
    var f = e.target.files[0];
    if (!f) return;
    if (input.value !== SAMPLE && input.value.trim() && !confirm("เปิดไฟล์ “" + f.name + "” แทนเนื้อหาปัจจุบัน?")) { e.target.value = ""; return; }
    f.text().then(function (t) { input.value = t; saveDraft(); render(); e.target.value = ""; });
  });

  // ----- start: restore the last draft from this browser, otherwise show the sample -----
  var draft = null;
  try { draft = localStorage.getItem(DRAFT_KEY); } catch (e) {}
  input.value = draft && draft.trim() ? draft : SAMPLE;
  if (draft && draft.trim() && draft !== SAMPLE) lastSaved = "(ร่างล่าสุด)";
  render();
})();
