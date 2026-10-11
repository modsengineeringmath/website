// Build script for modsengineeringmath.com
// Usage: npm install && node build.mjs
// Reads src/layout.html + src/pages/**.html, writes finished pages into the repo root
// (index.html, about/index.html, learn/index.html, learn/<topic>/index.html),
// plus sitemap.xml and llms.txt. Math written as \( ... \) or \[ ... \] is pre-rendered with KaTeX.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://modsengineeringmath.com";
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
// KaTeX stylesheet + woff2 fonts are self-hosted under /assets/katex/ (copied from node_modules)
const KATEX_SRC = path.join(ROOT, "node_modules/katex/dist");
const KATEX_DST = path.join(ROOT, "assets/katex");
fs.mkdirSync(path.join(KATEX_DST, "fonts"), { recursive: true });
fs.copyFileSync(path.join(KATEX_SRC, "katex.min.css"), path.join(KATEX_DST, "katex.min.css"));
for (const f of fs.readdirSync(path.join(KATEX_SRC, "fonts")).filter((f) => f.endsWith(".woff2")))
  fs.copyFileSync(path.join(KATEX_SRC, "fonts", f), path.join(KATEX_DST, "fonts", f));
const KATEX_CSS = `/assets/katex/katex.min.css?v=${katex.version}`;
// Browser-side libraries for the lesson editor, self-hosted under /assets/vendor/
const VENDOR_DST = path.join(ROOT, "assets/vendor");
fs.mkdirSync(VENDOR_DST, { recursive: true });
for (const [src, name] of [
  ["katex/dist/katex.min.js", "katex.min.js"],
  ["katex/dist/contrib/auto-render.min.js", "katex-auto-render.min.js"],
  ["marked/marked.min.js", "marked.min.js"],
  ["dompurify/dist/purify.min.js", "purify.min.js"],
]) fs.copyFileSync(path.join(ROOT, "node_modules", src), path.join(VENDOR_DST, name));
const PERSON_ID = `${SITE}/#mod`;
import crypto from "node:crypto";
const ASSET_V = crypto.createHash("sha1").update(
  fs.readdirSync(path.join(ROOT, "assets")).filter((f) => fs.statSync(path.join(ROOT, "assets", f)).isFile()).sort().map((f) => fs.readFileSync(path.join(ROOT, "assets", f))).join("")
).digest("hex").slice(0, 8);

// ---------------------------------------------------------------------------
// Topics in the knowledge library, in reading order.
// To add a topic: add an entry here and a page at src/pages/learn/<slug>.html
// ---------------------------------------------------------------------------
export const TOPICS = [
  {
    slug: "trigonometry",
    title: "สูตรตรีโกณมิติและตารางค่า",
    en: "Trigonometric Identities & Table",
    sym: "θ",
    summary: "วงกลมหนึ่งหน่วยแบบโต้ตอบ สูตรครบทุกหมวดพร้อมชื่ออังกฤษ และตาราง sin cos tan ทุก 0.05° ตั้งแต่ 0° ถึง 90° ทั้งองศาและเรเดียน",
  },
  {
    slug: "calculus-basics",
    title: "แคลคูลัสเบื้องต้น",
    en: "Basic Calculus",
    sym: "f′",
    summary: "ลิมิต อนุพันธ์ และปริพันธ์ พร้อมตัวอย่างกระแสในตัวเก็บประจุและค่า RMS",
  },
  {
    slug: "integral-calculus",
    title: "อินทิกรัล: สูตรและวิธีทำ",
    en: "Integral Calculus",
    sym: "∫",
    summary: "สูตรอินทิเกรตพร้อมชื่อสากล คุณสมบัติ สูตรสำเร็จ และวิธีทำทีละขั้น: เปลี่ยนตัวแปร u หารยาว เศษส่วนย่อย ทีละส่วน และอินทิกรัลจำกัดเขต",
  },
  {
    slug: "vector-algebra",
    title: "พีชคณิตของเวกเตอร์",
    en: "Vector Algebra",
    sym: "→",
    summary: "ผลคูณจุด ผลคูณไขว้ และแรงที่กระทำต่อตัวนำในสนามแม่เหล็ก",
  },
  {
    // A series: hub page at src/pages/learn/linear-algebra/index.html, sub-pages at src/pages/learn/linear-algebra/<sub>.html
    slug: "linear-algebra",
    title: "พีชคณิตเชิงเส้น",
    en: "Linear Algebra",
    sym: "⊞",
    summary: "เมทริกซ์ ดีเทอร์มิแนนต์ ระบบสมการ อินเวอร์ส กฎของคราเมอร์ ค่าเฉพาะและเวกเตอร์เฉพาะ พร้อมโจทย์วงจรไฟฟ้า ตั้งแต่ ม.ปลาย ถึง ป.โท",
    playlist: "PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO",
    sub: [
      { slug: "matrices", short: "เมทริกซ์", title: "เมทริกซ์และการดำเนินการ", en: "Matrices & Matrix Operations", sym: "[ ]", prefix: "M",
        summary: "ชนิดของเมทริกซ์ บวก ลบ คูณ ทรานสโพส เทรซ กำลัง และเมทริกซ์บล็อก พร้อมตัวช่วยดูการคูณทีละช่อง" },
      { slug: "determinants", short: "ดีเทอร์มิแนนต์", title: "ดีเทอร์มิแนนต์", en: "Determinants", sym: "|A|", prefix: "D",
        summary: "2×2 ซาร์รัส ไมเนอร์ โคแฟกเตอร์ กระจายลาปลาซ สมบัติตามการดำเนินการแถว ความหมายเชิงพื้นที่ และวิธีลดแถว" },
      { slug: "linear-systems", short: "ระบบสมการ", title: "ระบบสมการเชิงเส้นและการกำจัดแบบเกาส์", en: "Systems of Linear Equations", sym: "Ax=b", prefix: "L",
        summary: "เมทริกซ์แต่งเติม การดำเนินการแถว เกาส์ เกาส์-จอร์แดน ลำดับชั้น (rank) คำตอบเดียว ไม่มีคำตอบ อนันต์ LU และกำลังสองน้อยสุด" },
      { slug: "inverse", short: "อินเวอร์ส", title: "อินเวอร์สของเมทริกซ์", en: "Matrix Inverse", sym: "A⁻¹", prefix: "I",
        summary: "สูตร 2×2 วิธีแอดจอยต์ วิธีเกาส์-จอร์แดน [A | I] สมบัติ ทฤษฎีบทเมทริกซ์หาอินเวอร์สได้ และการแก้ x = A⁻¹b" },
      { slug: "cramers-rule", short: "คราเมอร์", title: "กฎของคราเมอร์", en: "Cramer's Rule", sym: "Δᵢ/Δ", prefix: "C",
        summary: "แก้ระบบสมการทีละตัวแปรด้วยดีเทอร์มิแนนต์ 2×2 และ 3×3 กรณี Δ = 0 จำนวนเชิงซ้อน และตัวแปร s" },
      { slug: "eigenvalues", short: "ค่าเฉพาะ λ", title: "ค่าเฉพาะและเวกเตอร์เฉพาะ", en: "Eigenvalues & Eigenvectors", sym: "λ", prefix: "E",
        summary: "สมการลักษณะเฉพาะ ค่าซ้ำ ค่าเชิงซ้อน การทำให้เป็นเมทริกซ์ทแยงมุม เมทริกซ์สมมาตร เคย์ลีย์-แฮมิลตัน และเมทริกซ์เอกซ์โพเนนเชียล" },
      { slug: "ee-applications", short: "งานไฟฟ้า", title: "ประยุกต์ในวิศวกรรมไฟฟ้า", en: "Applications in Electrical Engineering", sym: "Ω", prefix: "A",
        summary: "เมช โนด แหล่งจ่ายไม่อิสระ เฟเซอร์ AC ฟังก์ชันถ่ายโอน ปริภูมิสถานะ RLC สองพอร์ต องค์ประกอบสมมาตร และ Y-bus" },
    ],
  },
  {
    slug: "laplace-transform",
    title: "การแปลงลาปลาซ",
    en: "Laplace Transform",
    sym: "ℒ",
    summary: "นิยาม ตาราง เศษส่วนย่อย และการแก้วงจร RC ใน s-domain",
    playlist: "PLAJhR5azwWpLgWalcHsCEE8q_bPJv0Eaa",
  },
  {
    slug: "first-order-system",
    title: "ระบบอันดับหนึ่ง",
    en: "First-Order System · Lab",
    sym: "τ",
    summary: "แล็บโต้ตอบ: ปรับค่าคงตัวเวลา τ หรือ R, C, L แล้วดูผลตอบสนอง สเกลลอการิทึม ระนาบ s และ Bode พร้อมเส้นช่วยวิเคราะห์",
  },
  {
    slug: "second-order-system",
    title: "ระบบอันดับสอง",
    en: "Second-Order System · Lab",
    sym: "ζ",
    summary: "แล็บโต้ตอบ: ζ กำหนดรูปร่าง ωn กำหนดความเร็ว ลากขั้วบนระนาบ s แล้วดูผลตอบสนองเวลา เปลือก %OS และ Bode เปลี่ยนพร้อมกัน",
  },
  {
    slug: "signals",
    title: "สัญญาณเบื้องต้น",
    en: "Signals · Lab",
    sym: "∿",
    summary: "แล็บโต้ตอบ: พิมพ์สมการสัญญาณเอง ทั้ง x(t) และ x[n] ดูอนุพันธ์ ส่วนคู่คี่ พลังงาน สเปกตรัม การแปลงเวลา และคอนโวลูชัน",
  },
  {
    // A series with a full virtual bench: hub at src/pages/learn/function-generator/index.html
    slug: "function-generator",
    title: "แล็บเครื่องกำเนิดสัญญาณและออสซิลโลสโคป",
    en: "Function Generator & Oscilloscope Lab",
    sym: "Hz",
    summary: "แล็บจำลองเสมือนจริง: เครื่องกำเนิดสัญญาณคู่กับออสซิลโลสโคป 2 ช่อง ปรับได้ทุกปุ่ม พร้อมทฤษฎี Vpp Vrms ทริกเกอร์ โพรบ การวัดเฟส Bode วงจร RC RLC ไดโอด ออปแอมป์ และการสร้างเครื่องเอง ตั้งแต่ ม.ปลาย ถึง ป.โท",
    fxHint: "พิมพ์ เช่น vrms, duty, 50, trigger, probe, rise, phase, Q, slew, 555",
    sub: [
      { slug: "waveforms", short: "อ่านค่าสัญญาณ", title: "สัญญาณพื้นฐานและการอ่านค่า: Vp Vpp Vrms ความถี่ ดิวตี้ และเฟส", en: "Waveforms & Their Values", sym: "Vpp", prefix: "W",
        summary: "ไซน์ สี่เหลี่ยม สามเหลี่ยม พัลส์ ค่ายอด ยอดถึงยอด RMS ค่าเฉลี่ย ออฟเซต DC คาบ ความถี่ ดิวตี้ เฟส และเดซิเบล พร้อมตารางสูตร RMS ทุกรูปคลื่น" },
      { slug: "generator", short: "เครื่องกำเนิดสัญญาณ", title: "เครื่องกำเนิดสัญญาณ (Function Generator): ปุ่ม เอาต์พุต 50 Ω มอดูเลชัน และ DDS", en: "The Function Generator", sym: "∿", prefix: "V",
        summary: "ทุกปุ่มบนแผงหน้า ความต้านทานขาออก 50 Ω โหลด High-Z กับ 50 Ω ขีดจำกัดแอมพลิจูด AM FM PWM Sweep Burst Sync และหลักการ DDS" },
      { slug: "oscilloscope", short: "ออสซิลโลสโคป", title: "ออสซิลโลสโคป: V/div Time/div ทริกเกอร์ โพรบ และแบนด์วิดท์", en: "The Oscilloscope", sym: "V/t", prefix: "O",
        summary: "อ่านกราติคูล ตั้งทริกเกอร์ให้ภาพนิ่ง โพรบ 1× 10× การชดเชยโพรบ คัปปลิง AC DC แบนด์วิดท์ เวลาขาขึ้น อัตราสุ่ม อเลียสซิง FFT และความปลอดภัยเรื่องกราวด์" },
      { slug: "simulator", short: "แล็บจำลอง", title: "แล็บจำลองเครื่องกำเนิดสัญญาณ + ออสซิลโลสโคป เสมือนจริง", en: "FG + Oscilloscope Simulator", sym: "▶",
        summary: "โต๊ะแล็บเสมือนจริง: เครื่องกำเนิดสัญญาณ บอร์ดวงจร 15 แบบ และสโคป 2 ช่อง ปุ่มหมุนครบ วัดอัตโนมัติ เคอร์เซอร์ XY FFT พร้อมใบงาน 16 การทดลอง" },
      { slug: "measurements", short: "เทคนิคการวัด", title: "เทคนิคการวัด: แอมพลิจูด ความถี่ เฟส ลิสซาจู และผลตอบสนองความถี่ (Bode)", en: "Measurement Techniques", sym: "φ", prefix: "B",
        summary: "วัดจากกราติคูลและเคอร์เซอร์ ความคลาดเคลื่อน วัดเฟสจาก Δt และวงรีลิสซาจู วัด Bode ทีละความถี่ กวาดความถี่ และวัดอิมพีแดนซ์" },
      { slug: "rc-rlc", short: "RC · RLC", title: "วงจร RC RL RLC กับคลื่นสี่เหลี่ยมและไซน์", en: "RC, RL & RLC on the Bench", sym: "τ", prefix: "R",
        summary: "หา τ จากกราฟ ความถี่ตัด −3 dB เฟส −45° อินทิเกรเตอร์และดิฟเฟอเรนชิเอเตอร์แบบพาสซีฟ เรโซแนนซ์ Q แบนด์วิดท์ และการแกว่งเมื่อป้อนคลื่นสี่เหลี่ยม" },
      { slug: "op-amp", short: "ออปแอมป์", title: "ออปแอมป์บนโต๊ะแล็บ: ขยาย อินทิเกรต ดิฟเฟอเรนชิเอต คอมพาเรเตอร์ และชมิตต์ทริกเกอร์", en: "Op-Amp Lab", sym: "▷", prefix: "U",
        summary: "เกนกลับเฟสและไม่กลับเฟส GBW สลูว์เรต แบนด์วิดท์กำลังเต็ม การอิ่มตัว อินทิเกรเตอร์ ดิฟเฟอเรนชิเอเตอร์ คอมพาเรเตอร์ และฮิสเทอรีซิสของชมิตต์ทริกเกอร์" },
      { slug: "build", short: "สร้างเครื่องเอง", title: "สร้างเครื่องกำเนิดสัญญาณเอง: 555 ออสซิลเลเตอร์ Wien และ DDS AD9833", en: "Build Your Own Signal Generator", sym: "555", prefix: "K",
        summary: "ออสซิลเลเตอร์ผ่อนคลายด้วยออปแอมป์ ไอซี 555 วงจร Wien bridge XR2206 DAC R-2R และ DDS AD9833 กับ Arduino/ESP32 พร้อมภาคขาออกและสโคปทำเอง" },
      { slug: "applications", short: "งานประยุกต์", title: "งานประยุกต์และโจทย์ที่เจอเสมอ: เรกติไฟเออร์ PWM คลิปเปอร์ และการวัด L C", en: "Engineering Applications", sym: "Σ", prefix: "X",
        summary: "รูปแบบงานจริงที่เจอบ่อย: แรงดันริปเปิล PWM กับค่าเฉลี่ย คลิปเปอร์ แคลมเปอร์ หา C และ L จากการวัด ความต้านทานขาออก ทดสอบเครื่องขยายเสียง และสัญญาณเซนเซอร์" },
    ],
  },
];

// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : d.name.endsWith(".html") ? [p] : [];
  });
}

function routeFor(rel) {
  // index.html -> /, about.html -> /about/, learn/index.html -> /learn/, learn/x.html -> /learn/x/
  const noExt = rel.replace(/\\/g, "/").replace(/\.html$/, "");
  if (noExt === "index") return "/";
  if (noExt.endsWith("/index")) return "/" + noExt.slice(0, -"index".length);
  return "/" + noExt + "/";
}

// Lecture-note markup inside math: \hlF{} formula used, \hlP{} property used, \hlU{} the u-substitution,
// \hlC{} constant of integration, \rc{} red strike-through (cancel), \carry{} small red value written above a cancel
const KATEX_MACROS = {
  "\\hlF": "\\htmlClass{hl-f}{#1}",
  "\\hlP": "\\htmlClass{hl-p}{#1}",
  "\\hlU": "\\htmlClass{hl-u}{#1}",
  "\\hlC": "\\htmlClass{hl-c}{#1}",
  "\\rc": "\\htmlClass{rc}{\\cancel{#1}}",
  "\\carry": "\\overset{\\htmlClass{carry}{#1}}{\\htmlClass{rc}{\\cancel{#2}}}",
};
function renderMath(html, file) {
  const render = (tex, displayMode) => {
    try {
      return katex.renderToString(decode(tex.trim()), { displayMode, throwOnError: true, strict: "ignore", trust: (c) => c.command === "\\htmlClass", macros: KATEX_MACROS });
    } catch (e) {
      throw new Error(`KaTeX error in ${file}: ${e.message}\n  in: ${tex.trim()}`);
    }
  };
  return html
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => render(t, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => render(t, false));
}

function thaiDate(iso) {
  return new Date(iso + "T00:00:00+07:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

// ---------------------------------------------------------------------------
// Generated fragments
// ---------------------------------------------------------------------------
function topicCards() {
  return (
    '<div class="topic-grid">' +
    TOPICS.map(
      (t, i) => `
  <a class="topic-card" href="/learn/${t.slug}/">
    <span class="tc-top"><span class="tc-sym" aria-hidden="true">${t.sym}</span><span class="tc-num">${String(i + 1).padStart(2, "0")}</span></span>
    <b>${esc(t.title)}</b>
    <span class="tc-en">${esc(t.en)}</span>
    <span class="tc-sum">${esc(t.summary)}</span>
    <span class="tc-foot"><span class="tc-go">${t.sub ? `${t.sub.length} หน้าย่อย →` : "อ่านบทเรียน →"}</span>${t.playlist ? '<span class="tc-vid">▶ มีวิดีโอ</span>' : ""}</span>
  </a>`
    ).join("") +
    "\n</div>"
  );
}

// level badges inside headings: <span class="lv lv-b">…</span> (b = basic, i = intermediate, a = advanced)
const LV_RE = /<span class="lv lv-([bia])"[^>]*>[\s\S]*?<\/span>/g;
function toc(html) {
  const items = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)];
  if (!items.length) return "";
  return (
    '<nav class="toc" aria-label="สารบัญ"><details open><summary>สารบัญ</summary><ol>' +
    items.map(([, id, t]) => {
      const lv = /<span class="lv lv-([bia])"/.exec(t);
      return `<li><a href="#${id}">${stripTags(t.replace(LV_RE, ""))}${lv ? `<i class="toc-lv lv-${lv[1]}" aria-hidden="true"></i>` : ""}</a></li>`;
    }).join("") +
    "</ol></details></nav>"
  );
}

// ---------------------------------------------------------------------------
// Series (a topic with sub-pages, e.g. linear algebra)
// ---------------------------------------------------------------------------
const seriesUrl = (t, s) => `/learn/${t.slug}/${s ? s.slug + "/" : ""}`;

function seriesNav(t, cur) {
  const items = [{ short: "ภาพรวม", slug: null }, ...t.sub];
  return `<nav class="series-nav" aria-label="หน้าย่อยใน${esc(t.title)}"><span class="sn-title mono">${esc(t.en)}</span><div class="sn-list">` +
    items.map((s, i) => `<a href="${seriesUrl(t, s.slug ? s : null)}"${(cur ? cur.slug : null) === s.slug ? ' aria-current="page"' : ""}><span class="sn-n">${i}</span>${esc(s.short)}</a>`).join("") +
    "</div></nav>";
}

function seriesCards(t) {
  return '<div class="la-cards">' + t.sub.map((s, i) => `
  <a class="la-card" href="${seriesUrl(t, s)}">
    <span class="tc-top"><span class="tc-sym" aria-hidden="true">${esc(s.sym)}</span><span class="tc-num">${TOPICS.indexOf(t) + 1}.${i + 1}</span></span>
    <b>${esc(s.title)}</b>
    <span class="tc-en">${esc(s.en)}</span>
    <span class="tc-sum">${esc(s.summary)}</span>
    <span class="tc-foot"><span class="tc-go">เปิดหน้า →</span><span class="mono">${s.prefix ? `สูตร ${s.prefix}1, ${s.prefix}2, …` : "แล็บโต้ตอบ"}</span></span>
  </a>`).join("") + "\n</div>";
}

function seriesPager(t, s) {
  const i = t.sub.indexOf(s), prev = t.sub[i - 1], next = t.sub[i + 1];
  const ti = TOPICS.indexOf(t), nextTopic = TOPICS[ti + 1];
  const a = (href, dir, label, title) => `<a class="pager-${dir}" href="${href}"><span class="mono">${label}</span><b>${esc(title)}</b></a>`;
  return `<nav class="pager" aria-label="หน้าถัดไป">${
    prev ? a(seriesUrl(t, prev), "prev", "← หน้าก่อนหน้า", prev.title) : a(seriesUrl(t), "prev", "← ภาพรวม", t.title)
  }${
    next ? a(seriesUrl(t, next), "next", "หน้าถัดไป →", next.title) : nextTopic ? a(`/learn/${nextTopic.slug}/`, "next", "บทถัดไป →", nextTopic.title) : a("/learn/", "next", "ไปต่อ →", "คลังความรู้ทั้งหมด")
  }</nav>`;
}

// number of formula cards (id="X1") or worked examples (class="wx") across a series' sub-pages
function seriesCount(t, kind) {
  return t.sub.reduce((n, s) => {
    const file = path.join(ROOT, "src/pages/learn", t.slug, s.slug + ".html");
    if (!fs.existsSync(file)) return n;
    const src = fs.readFileSync(file, "utf8");
    return n + (src.match(kind === "formula" ? /<div class="tf[^"]*" id="[A-Z]\d+[a-z]?"/g : /<div class="wx"/g) || []).length;
  }, 0);
}

// Formula index for a series: every <div class="tf…" id="X1" data-k="…"> card on its sub-pages, with its first display formula.
// Card format: <div class="tf" id="M9" data-k="keywords"><p class="tf-n"><b><span class="fid">M9</span> English</b> ไทย</p> \[ … \]
function formulaIndex(t) {
  const out = [];
  t.sub.forEach((s) => {
    const file = path.join(ROOT, "src/pages/learn", t.slug, s.slug + ".html");
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, "utf8");
    const re = /<div class="tf[^"]*" id="([A-Z]\d+[a-z]?)" data-k="([^"]*)">\s*<p class="tf-n"><b><span class="fid">[^<]*<\/span>\s*([\s\S]*?)<\/b>([\s\S]*?)<\/p>\s*(\\\[[\s\S]*?\\\])?/g;
    let m;
    while ((m = re.exec(src))) {
      const [, id, keys, en, th, tex] = m;
      out.push({ id, keys, en: en.trim(), th: stripTags(th), tex: tex || "", s });
    }
  });
  const hay = (f) => (f.id + " " + f.keys + " " + stripTags(f.en) + " " + f.th + " " + f.s.short + " " + f.tex.replace(/\\[[\]()]/g, " ").replace(/\\([a-zA-Z]+)/g, " $1 ")).toLowerCase().replace(/"/g, "").replace(/\s+/g, " ");
  return `<div class="fx-index" id="fxIndex">
  <div class="tf-filter fx-tools" role="search">
    <label for="fxFilter">ค้นหาสูตร</label>
    <input id="fxFilter" type="search" placeholder="${esc(t.fxHint || "พิมพ์ เช่น inverse, det, eigen, คราเมอร์, ทรานสโพส, rank, 2x2")}" autocomplete="off">
    <span class="tf-count mono" id="fxCount" aria-live="polite">ทั้งหมด ${out.length} สูตร</span>
  </div>
  <div class="fx-chips" role="group" aria-label="กรองตามหน้า"><button type="button" aria-pressed="true" data-p="">ทุกหน้า</button>${t.sub.filter((s) => s.prefix).map((s) => `<button type="button" aria-pressed="false" data-p="${s.slug}">${s.prefix} · ${esc(s.short)}</button>`).join("")}</div>
  <ol class="fx-list">
${out.map((f) => `    <li class="fx" data-p="${f.s.slug}" data-k="${esc(hay(f))}"><a class="fx-h" href="${seriesUrl(t, f.s)}#${f.id}"><span class="fid">${f.id}</span><b>${f.en}</b><span class="fx-th">${esc(f.th)}</span></a>${f.tex ? `<div class="fx-f">${f.tex}</div>` : ""}</li>`).join("\n")}
  </ol>
  <p class="fx-empty" id="fxEmpty" hidden>ไม่พบสูตรที่ตรงกัน ลองพิมพ์คำอื่น หรือใช้ภาษาอังกฤษ เช่น inverse, determinant, eigenvalue</p>
</div>`;
}

function faqHtml(faq) {
  if (!faq?.length) return "";
  return (
    '<section class="faq" aria-labelledby="faq"><h2 id="faq">คำถามที่พบบ่อย</h2>' +
    faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join("") +
    "</section>"
  );
}

function pager(slug) {
  const i = TOPICS.findIndex((t) => t.slug === slug);
  const prev = TOPICS[i - 1], next = TOPICS[i + 1];
  const link = (t, dir) =>
    t
      ? `<a class="pager-${dir}" href="/learn/${t.slug}/"><span class="mono">${dir === "prev" ? "← บทก่อนหน้า" : "บทถัดไป →"}</span><b>${esc(t.title)}</b></a>`
      : `<a class="pager-${dir}" href="/learn/"><span class="mono">${dir === "prev" ? "← กลับ" : "ไปต่อ →"}</span><b>คลังความรู้ทั้งหมด</b></a>`;
  return `<nav class="pager" aria-label="บทเรียนถัดไป">${link(prev, "prev")}${link(next, "next")}</nav>`;
}

function videoFacade(t) {
  if (!t?.playlist) return "";
  return `
<section class="lesson-video" aria-labelledby="video">
  <h2 id="video">ดูวิดีโอประกอบ</h2>
  <div class="screen" data-yt-list="${t.playlist}" data-yt-title="${esc(t.en)}">
    <div class="facade"><div class="f-eq">${esc(t.sym)}</div><div><h3>${esc(t.en)}</h3><p>${esc(t.title)} · เพลย์ลิสต์บน YouTube</p></div>
    <button class="play" type="button"><i></i>เล่นเพลย์ลิสต์</button></div>
  </div>
  <p class="below-screen mono"><span>สอนโดยอาจารย์มด · ภาษาไทย</span><a href="https://www.youtube.com/playlist?list=${t.playlist}" target="_blank" rel="noopener">เปิดใน YouTube ↗</a></p>
</section>`;
}

// Trig table: sin, cos, tan every 0.05° from 0° to 90° (1,801 rows), grouped one <tbody> per degree
const TRIG_SPECIAL = { 0: "0", 15: "π/12", 18: "π/10", 22.5: "π/8", 30: "π/6", 36: "π/5", 45: "π/4", 54: "3π/10", 60: "π/3", 67.5: "3π/8", 72: "2π/5", 75: "5π/12", 90: "π/2" };
export const trigDegId = (i) => "deg-" + (i % 20 === 0 ? String(i / 20) : (i / 20).toFixed(2));
export const fmtTan = (v) => { const a = Math.abs(v); return v.toFixed(a < 10 ? 6 : a < 100 ? 5 : a < 1000 ? 4 : 3); };
function trigTable() {
  let rows = "";
  for (let d = 0; d <= 90; d++) {
    rows += "<tbody>";
    for (let k = 0; k < 20; k++) {
      const i = d * 20 + k;
      if (i > 1800) break;
      const deg = i / 20, rad = (i * Math.PI) / 3600;
      const sp = TRIG_SPECIAL[deg];
      const tan = i === 1800 ? '<td class="undef">∞<small>ไม่นิยาม</small></td>' : `<td>${fmtTan(Math.tan(rad))}</td>`;
      rows += `<tr id="${trigDegId(i)}"${sp ? ' class="sp"' : ""}><th scope="row">${deg.toFixed(2)}°</th><td>${rad.toFixed(6)}${sp ? `<small>${sp}</small>` : ""}</td><td>${Math.sin(rad).toFixed(6)}</td><td>${(i === 1800 ? 0 : Math.cos(rad)).toFixed(6)}</td>${tan}</tr>`;
    }
    rows += "</tbody>\n";
  }
  return `<table class="tt" id="trigTable">
<caption>ค่า sin, cos และ tan ของมุม 0° ถึง 90° ทุก 0.05° (1,801 แถว) ค่าปัดเป็นทศนิยม 6 ตำแหน่ง tan มีเลขนัยสำคัญ 7 หลัก</caption>
<thead><tr><th scope="col">องศา<small>θ (°)</small></th><th scope="col">เรเดียน<small>θ (rad)</small></th><th scope="col">sin θ</th><th scope="col">cos θ</th><th scope="col">tan θ</th></tr></thead>
${rows}</table>`;
}

function updatesData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data/updates.json"), "utf8"));
}

function nowHtml(data) {
  return (data.now || [])
    .map((n) => `<li><span class="now-ic" aria-hidden="true">${esc(n.icon || "•")}</span><span>${esc(n.text)}</span></li>`)
    .join("");
}

function feedHtml(data) {
  return [...(data.updates || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (u) => `<li class="post" data-tag="${esc(u.tag || "")}">
  <div class="post-meta">${u.tag ? `<span class="tag">${esc(u.tag)}</span>` : ""}<time datetime="${esc(u.date)}">${thaiDate(u.date)}</time></div>
  <p>${esc(u.text)}</p>${u.link ? `<a class="post-link" href="${esc(u.link)}">${esc(u.linkText || "อ่านต่อ")} →</a>` : ""}
</li>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------
function lessonSchema(meta, url, topic, ogImageUrl, sub) {
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: "คลังความรู้", item: SITE + "/learn/" },
    { "@type": "ListItem", position: 3, name: topic.title, item: SITE + `/learn/${topic.slug}/` },
  ];
  if (sub) crumbs.push({ "@type": "ListItem", position: 4, name: sub.title, item: url });
  const graph = [
    {
      "@type": "Article",
      "@id": url + "#article",
      headline: meta.h1 || meta.title,
      description: meta.description,
      inLanguage: "th",
      url,
      mainEntityOfPage: url,
      datePublished: meta.published || TODAY,
      dateModified: meta.updated || TODAY,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      about: meta.about || [sub ? sub.en : topic.en],
      isPartOf: sub ? { "@id": SITE + `/learn/${topic.slug}/#article` } : { "@id": `${SITE}/learn/#library` },
      ...(!sub && topic.sub ? { hasPart: topic.sub.map((s) => ({ "@id": SITE + seriesUrl(topic, s) + "#article" })) } : {}),
      image: [ogImageUrl],
      educationalLevel: meta.level || "Undergraduate",
      ...(topic.playlist ? { citation: `https://www.youtube.com/playlist?list=${topic.playlist}` } : {}),
    },
    { "@type": "BreadcrumbList", itemListElement: crumbs },
  ];
  if (meta.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: meta.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: stripTags(f.a.replace(/\\\(|\\\)|\\\[|\\\]/g, "").replace(/\\,/g, " ").replace(/\\(\w+)/g, "$1")) },
      })),
    });
  }
  return graph;
}

// ---------------------------------------------------------------------------
// Share bar (lesson pages), plain-text export for llms-full.txt
// ---------------------------------------------------------------------------
function shareHtml(url, title) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  return `<div class="share" aria-label="แชร์หน้านี้">
  <span class="mono">แชร์ให้เพื่อน</span>
  <a href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener">LINE</a>
  <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
  <a href="https://twitter.com/intent/tweet?url=${u}&amp;text=${t}" target="_blank" rel="noopener">X</a>
  <button type="button" data-share-url="${esc(url)}" data-share-title="${esc(title)}">คัดลอกลิงก์</button>
</div>`;
}

// remove one balanced element that starts at the first match of `open` (e.g. /<div class="trig-lab"/)
function removeBlock(html, open) {
  const m = open.exec(html);
  if (!m) return html;
  const tag = /^<(\w+)/.exec(m[0])[1];
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = m.index;
  let depth = 0, x;
  while ((x = re.exec(html))) {
    depth += x[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(0, m.index) + html.slice(re.lastIndex);
  }
  return html;
}

function htmlToText(html) {
  let h = html;
  const theory = h.indexOf('id="theory"');
  if (theory > 0) h = h.slice(h.lastIndexOf("<", theory));
  for (const re of [/<div class="trig-lab"/, /<div class="tt-tools"/, /<table class="tt"/, /<div class="tf-filter"/, /<nav class="toc"/, /<nav class="pager"/, /<div class="share"/, /<div class="fx-index"/, /<div class="mx-calc"/, /<div class="la-lab"/, /<div class="mx-prod"/, /<nav class="series-nav"/, /<div class="int-legend"/, /<div class="fgs-bench"/, /<div class="fgs-mini"/, /<div class="fg-calc"/, /<div class="dds-lab"/])
    for (let i = 0; i < 3; i++) h = removeBlock(h, re);
  h = h
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg|button|select|textarea|aside)\b[\s\S]*?<\/\1>/g, "")
    .replace(/<input[^>]*>/g, "")
    .replace(/\\carry\{([^{}]*)\}\{/g, "\\cancel{")
    .replace(/\\(hlF|hlP|hlU|hlC)\{/g, "{")
    .replace(/\\rc\{/g, "\\cancel{")
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => "$" + t.trim() + "$")
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => "\n$$" + t.trim() + "$$\n")
    .replace(/<h1[^>]*>/g, "\n# ").replace(/<h2[^>]*>/g, "\n\n## ").replace(/<h3[^>]*>/g, "\n\n### ")
    .replace(/<li[^>]*>/g, "\n- ").replace(/<tr[^>]*>/g, "\n| ").replace(/<\/t[dh]>/g, " | ")
    .replace(/<br\s*\/?>/g, "\n").replace(/<summary[^>]*>/g, "\n").replace(/<\/(p|div|figure|details|summary|h\d|ul|ol|table|section|header|figcaption)>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return decode(h).replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const layout = fs.readFileSync(path.join(ROOT, "src/layout.html"), "utf8");
const pagesDir = path.join(ROOT, "src/pages");
const sitemap = [];
const updates = updatesData();
const fullText = []; // for llms-full.txt
const ogManifest = []; // for scripts/og.py (social share images)

for (const file of walk(pagesDir)) {
  const rel = path.relative(pagesDir, file);
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Missing <!--meta {...} --> block in ${rel}`);
  const meta = JSON.parse(m[1]);
  let body = raw.slice(m[0].length);
  const route = routeFor(rel);
  const url = SITE + route;
  const topic = meta.lesson ? TOPICS.find((t) => t.slug === meta.lesson) : null;
  if (meta.lesson && !topic) throw new Error(`Unknown lesson slug "${meta.lesson}" in ${rel}`);
  const sub = meta.sub ? topic?.sub?.find((s) => s.slug === meta.sub) : null;
  if (meta.sub && !sub) throw new Error(`Unknown sub-page "${meta.sub}" in ${rel}`);
  const key = meta.out ? meta.out.replace(/\.html$/, "") : route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "-");
  const ogFile = `/images/og/${key}.jpg`;
  const ogImage = meta.ogImage || (fs.existsSync(path.join(ROOT, ogFile)) ? ogFile : "/images/cover.jpg");
  if (!meta.noindex) {
    const og = meta.og || {};
    const n = topic ? TOPICS.indexOf(topic) + 1 : 0;
    const k = sub ? topic.sub.indexOf(sub) + 1 : 0;
    ogManifest.push({
      key,
      title: og.title || (sub ? sub.title : topic ? topic.title : meta.h1 || meta.title),
      sub: og.sub || (sub ? sub.summary : topic ? topic.summary : meta.description),
      eyebrow: og.eyebrow || (sub ? `บทที่ ${n}.${k} · ${sub.en}` : topic ? `บทที่ ${n} · ${topic.en}` : "Mod's Engineering Mathematics"),
      sym: og.sym || (sub ? sub.sym : topic ? topic.sym : "∿"),
    });
  }

  const fragments = {
    "<!--topic-cards-->": () => topicCards(),
    "<!--trig-table-->": () => trigTable(),
    "<!--faq-->": () => faqHtml(meta.faq),
    "<!--video-->": () => videoFacade(topic),
    "<!--pager-->": () => (topic ? shareHtml(url, meta.h1 || meta.title) + (sub ? seriesPager(topic, sub) : pager(topic.slug)) : ""),
    "<!--series-nav-->": () => (topic?.sub ? seriesNav(topic, sub) : ""),
    "<!--now-->": () => nowHtml(updates),
    "<!--feed-->": () => feedHtml(updates),
    "<!--updated-->": () => (meta.updated ? `<time datetime="${meta.updated}">${thaiDate(meta.updated)}</time>` : ""),
  };
  for (const [marker, fn] of Object.entries(fragments)) body = body.split(marker).join(fn());
  // <!--series-cards:slug--> and <!--formula-index:slug--> can be used on any page (hub, home)
  body = body.replace(/<!--series-cards:([\w-]+)-->/g, (_, s) => seriesCards(TOPICS.find((t) => t.slug === s)));
  body = body.replace(/<!--formula-index:([\w-]+)-->/g, (_, s) => formulaIndex(TOPICS.find((t) => t.slug === s)));
  body = body.replace(/<!--(formula|example)-count:([\w-]+)-->/g, (_, kind, s) => String(seriesCount(TOPICS.find((t) => t.slug === s), kind)));
  if (!meta.noindex && !meta.noLlms)
    fullText.push({ url, title: meta.h1 || meta.title, description: meta.description, updated: meta.updated, text: htmlToText(body), faq: meta.faq || [] });
  const tocHtml = toc(body);
  body = body.split("<!--toc-->").join(tocHtml);
  body = renderMath(body, rel);

  let graph = [...(meta.jsonld || [])];
  if (topic) graph = graph.concat(lessonSchema(meta, url, topic, SITE + ogImage, sub));
  const jsonld = graph.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`
    : "";

  const headExtra = [
    meta.katex || /class="katex/.test(body) ? `<link rel="stylesheet" href="${KATEX_CSS}">` : "",
    meta.noindex ? '<meta name="robots" content="noindex">' : "",
  ].join("\n");

  const scripts = (meta.scripts || []).map((s) => `<script src="${s}?v=${ASSET_V}" defer></script>`).join("\n");

  const vars = {
    title: esc(meta.title),
    description: esc(meta.description),
    canonical: url,
    ogTitle: esc(meta.ogTitle || meta.title),
    ogDescription: esc(meta.ogDescription || meta.description),
    ogType: topic ? "article" : meta.ogType || "website",
    ogImage: SITE + ogImage,
    ogImageAlt: esc(meta.ogTitle || meta.h1 || meta.title),
    headExtra,
    jsonld,
    content: body,
    scripts,
    bodyClass: meta.bodyClass || "",
    v: ASSET_V,
  };
  let out = layout.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
  // Mark the active nav item
  out = out.replace(/data-nav="(\w+)"/g, (_, k) => (k === meta.nav ? 'aria-current="page"' : ""));

  const outPath = meta.out ? path.join(ROOT, meta.out) : route === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, route, "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  if (!meta.noindex) sitemap.push({ loc: url, lastmod: meta.updated || TODAY, priority: route === "/" ? "1.0" : topic ? "0.8" : "0.9" });
  console.log("built", route);
}

// sitemap.xml
sitemap.sort((a, b) => a.loc.localeCompare(b.loc));
fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemap.map((s) => `  <url>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n    <priority>${s.priority}</priority>\n  </url>`).join("\n") +
    "\n</urlset>\n"
);

// llms.txt (https://llmstxt.org format) — a map of the site for AI assistants
const LABS = [
  ["Linear algebra formula index & matrix calculator", "linear-algebra", "every matrix, determinant, linear-system, inverse, Cramer and eigenvalue formula with a citable ID (M1…, D1…, L1…, I1…, C1…, E1…, A1…) in one searchable list; exact-fraction calculator for determinant, inverse, Gauss–Jordan / Cramer solutions and eigenvalues/eigenvectors with step-by-step working"],
  ["2×2 transformation & eigenvector lab", "linear-algebra/eigenvalues", "drag a 2×2 matrix's columns: grid and unit circle transform, determinant as signed area, eigen-directions and Av vs v shown live"],
  ["Integral calculus formulas & worked solutions", "integral-calculus", "every basic and standard integral with international names (power rule, linearity, u-substitution, integration by parts, partial fractions, FTC, definite-integral properties); step-by-step lecture-style solutions with highlighted formulas, red cancellations and polynomial long division; Riemann-sum visualiser"],
  ["Trigonometry formulas & table", "trigonometry", "interactive unit circle; 91 identities with English and Thai names; sin/cos/tan table every 0.05° from 0° to 90° in degrees and radians (1,801 rows) with angle and inverse lookup"],
  ["First-order system lab", "first-order-system", "time-constant simulator: step/impulse/ramp/sine input, RC and RL circuits, log view, s-plane, Bode plot"],
  ["Second-order system lab", "second-order-system", "damping ratio ζ and natural frequency ωn explorer: draggable poles, envelope, %OS, settling time, Bode, RLC mode"],
  ["Signals lab", "signals", "type any x(t) or x[n]; derivative, integral, even/odd parts, energy/power, spectrum, time shift/scale/reversal, convolution with flip-and-slide"],
  ["Function generator + oscilloscope simulator (virtual bench)", "function-generator/simulator", "free browser-based virtual lab bench: 25 MHz function generator (sine, square, ramp, pulse, noise, arbitrary; AM, FM, PWM, sweep, burst; 50 Ω output with High-Z/50 Ω load setting) driving 15 circuits (RC, RL, RLC, half/full-wave rectifier, clipper, clamper, op-amp inverting/non-inverting/integrator/differentiator/comparator/Schmitt with real GBW, slew rate and saturation) into a 2-channel 100 MHz 8-bit digital oscilloscope with edge trigger (auto/normal/single), 1×/10× probes with compensation trimmer, AC/DC coupling, bandwidth limit, aliasing, automatic measurements, cursors, XY Lissajous, math and FFT; 16 guided worksheets; every setup shareable as a link"],
  ["Function generator & oscilloscope formula index", "function-generator", "every waveform, generator, oscilloscope, measurement, RC/RLC, op-amp, oscillator and application formula with a citable ID (W1…, V1…, O1…, B1…, R1…, U1…, K1…, X1…) in one searchable list"],
  ["Op-amp lab", "function-generator/op-amp", "inverting and non-inverting gain, gain-bandwidth product, slew rate and full-power bandwidth, clipping, integrator, differentiator, comparator and Schmitt trigger hysteresis, each with an embedded oscilloscope"],
  ["Build your own signal generator", "function-generator/build", "op-amp relaxation oscillator, 555 astable, Wien-bridge oscillator, XR2206, R-2R DAC and AD9833 DDS with Arduino/ESP32 code, output stage design, DDS phase-accumulator visualiser and calculators"],
];
fs.writeFileSync(
  path.join(ROOT, "llms.txt"),
  `# Mod's Engineering Mathematics

> Free Thai-language engineering mathematics lessons, interactive labs and reference tables for electrical engineering students, written by Teerawut Savangboon (ธีรวุฒิ แสวงบุญ, "อาจารย์มด", Ajarn Mod), lecturer in Electrical Engineering, Faculty of Science and Technology, Dhonburi Rajabhat University, Samut Prakan campus, Thailand.

The site teaches mathematics the way an electrical engineer uses it: every lesson ends in a real circuit or system (RC/RL circuits, mesh analysis, transfer functions, control systems, power electronics). Content is in Thai with English technical terms. All pages are free to read, link to and cite. Math is written in LaTeX notation in the full-text file.

When citing, please name "Mod's Engineering Mathematics (อาจารย์มด)" and link the page URL.

## Lessons (reading order)
${TOPICS.map((t, i) => `- [${t.en} — ${t.title}](${SITE}/learn/${t.slug}/): ${t.summary}` + (t.sub ? "\n" + t.sub.map((s) => `  - [${s.en} — ${s.title}](${SITE}${seriesUrl(t, s)}): ${s.summary}`).join("\n") : "")).join("\n")}

## Interactive labs and references
${LABS.map(([n, slug, d]) => `- [${n}](${SITE}/learn/${slug}/): ${d}`).join("\n")}
- [Lesson editor](${SITE}/tools/lesson-editor/): online Markdown + LaTeX editor for writing math lessons; exports .md, HTML and PDF
- Lab presets can be opened directly, e.g. ${SITE}/learn/function-generator/simulator/#preset=rc-square (RC low-pass with a square wave), #preset=probe-comp, #preset=lissajous, #preset=opamp-slew, #preset=aliasing

## About
- [Home](${SITE}/): overview, learning path from matrices to Laplace transforms, feedback control and buck converters
- [About อาจารย์มด](${SITE}/about/): profile, teaching, current projects and status updates
- [Knowledge library](${SITE}/learn/): index of all lessons, books in progress and video series
- [Updates feed (RSS)](${SITE}/feed.xml)

## Video playlists (YouTube, Thai)
- [Matrix and Determinant](https://www.youtube.com/playlist?list=PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO)
- [Laplace Transforms](https://www.youtube.com/playlist?list=PLAJhR5azwWpLgWalcHsCEE8q_bPJv0Eaa)
- [Feedback Control](https://www.youtube.com/playlist?list=PLAJhR5azwWpK04F2C2Vp6h3v82Wvqn9ka)
- [Power Electronics: Buck Converter](https://www.youtube.com/playlist?list=PLAJhR5azwWpJEprWclikULegqCgddv0PF)

## Optional
- [Full text of every lesson](${SITE}/llms-full.txt): all lesson and lab theory text in one file, math as LaTeX
- [YouTube channel](https://www.youtube.com/@modsengineeringmath)
- [Facebook page](https://www.facebook.com/modsengineeringmath)
- [University profile](https://sci.dru.ac.th/electrical-engineering/teerawutsavangboon.html)
`
);

// llms-full.txt — the readable text of every indexable page
const order = (u) => (u === SITE + "/" ? 0 : u.includes("/learn/") && u !== SITE + "/learn/" ? 2 : 1);
fullText.sort((a, b) => order(a.url) - order(b.url) || a.url.localeCompare(b.url));
fs.writeFileSync(
  path.join(ROOT, "llms-full.txt"),
  `# Mod's Engineering Mathematics — full text\n\n> Thai engineering mathematics lessons by อาจารย์มด (Teerawut Savangboon). Source: ${SITE}/ · Math in LaTeX ($...$ inline, $$...$$ display). Generated ${TODAY}.\n\n` +
    fullText
      .map((p) => {
        let t = p.text.replace(/^#[^#].*\n?/, "");
        if (p.url.endsWith("/trigonometry/")) t += `\n\n(The full 1,801-row sin/cos/tan table, 0°–90° every 0.05°, is on the page: ${p.url}#table — it can also be downloaded there as CSV.)`;
        const faq = p.faq.length ? "\n\n## FAQ\n" + p.faq.map((f) => `\n**${f.q}**\n${f.a.replace(/\\\(([\s\S]+?)\\\)/g, (_, x) => "$" + x.trim() + "$").replace(/<[^>]+>/g, "")}`).join("\n") : "";
        return `---\n\n# ${p.title}\n\nURL: ${p.url}\n${p.updated ? `Updated: ${p.updated}\n` : ""}Summary: ${p.description}\n\n${t}${faq}\n`;
      })
      .join("\n")
);

// feed.xml (RSS 2.0) from data/updates.json
const rfc822 = (d) => new Date(d + "T09:00:00+07:00").toUTCString();
const xmlEsc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const items = [...updates.updates].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
fs.writeFileSync(
  path.join(ROOT, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Mod's Engineering Mathematics — อัปเดตล่าสุด</title>
  <link>${SITE}/</link>
  <description>บทเรียน แล็บโต้ตอบ และความเคลื่อนไหวล่าสุดจากอาจารย์มด คณิตศาสตร์วิศวกรรมภาษาไทย</description>
  <language>th</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map((u) => {
    const link = u.link ? (u.link.startsWith("http") ? u.link : SITE + u.link) : SITE + "/about/#feed";
    const title = u.text.length > 70 ? u.text.slice(0, 68).replace(/\s+\S*$/, "") + "…" : u.text;
    return `  <item>
    <title>${xmlEsc((u.tag ? "[" + u.tag + "] " : "") + title)}</title>
    <link>${xmlEsc(link)}</link>
    <guid isPermaLink="false">${xmlEsc(SITE + "/#update-" + u.date + "-" + crypto.createHash("sha1").update(u.text).digest("hex").slice(0, 8))}</guid>
    <pubDate>${rfc822(u.date)}</pubDate>
    <description>${xmlEsc(u.text)}</description>
  </item>`;
  })
  .join("\n")}
</channel>
</rss>
`
);

// social-card manifest for scripts/og.py
fs.writeFileSync(path.join(ROOT, "src/og-manifest.json"), JSON.stringify(ogManifest, null, 2) + "\n");
console.log("built sitemap.xml, llms.txt, llms-full.txt, feed.xml");
