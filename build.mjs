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
    sym: "∫",
    summary: "ลิมิต อนุพันธ์ และปริพันธ์ พร้อมตัวอย่างกระแสในตัวเก็บประจุและค่า RMS",
  },
  {
    slug: "vector-algebra",
    title: "พีชคณิตของเวกเตอร์",
    en: "Vector Algebra",
    sym: "→",
    summary: "ผลคูณจุด ผลคูณไขว้ และแรงที่กระทำต่อตัวนำในสนามแม่เหล็ก",
  },
  {
    slug: "matrix-determinant",
    title: "เมทริกซ์และดีเทอร์มิแนนต์",
    en: "Matrix & Determinant",
    sym: "⊞",
    summary: "แก้ระบบสมการเชิงเส้นด้วยกฎของคราเมอร์ พร้อมตัวอย่างวงจรสองเมช",
    playlist: "PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO",
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

function renderMath(html, file) {
  const render = (tex, displayMode) => {
    try {
      return katex.renderToString(decode(tex.trim()), { displayMode, throwOnError: true, strict: "ignore" });
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
    <span class="tc-foot"><span class="tc-go">อ่านบทเรียน →</span>${t.playlist ? '<span class="tc-vid">▶ มีวิดีโอ</span>' : ""}</span>
  </a>`
    ).join("") +
    "\n</div>"
  );
}

function toc(html) {
  const items = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)];
  if (!items.length) return "";
  return (
    '<nav class="toc" aria-label="สารบัญ"><details open><summary>สารบัญ</summary><ol>' +
    items.map(([, id, t]) => `<li><a href="#${id}">${stripTags(t)}</a></li>`).join("") +
    "</ol></details></nav>"
  );
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
    .sort((a, b) => (a.date < b.date ? 1 : -1))
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
function lessonSchema(meta, url, topic) {
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
      about: meta.about || [topic.en],
      isPartOf: { "@id": `${SITE}/learn/#library` },
      ...(topic.playlist ? { video: { "@type": "VideoObject", name: topic.en + " — เพลย์ลิสต์", embedUrl: `https://www.youtube.com/embed/videoseries?list=${topic.playlist}` } } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "คลังความรู้", item: SITE + "/learn/" },
        { "@type": "ListItem", position: 3, name: topic.title, item: url },
      ],
    },
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
// Build
// ---------------------------------------------------------------------------
const layout = fs.readFileSync(path.join(ROOT, "src/layout.html"), "utf8");
const pagesDir = path.join(ROOT, "src/pages");
const sitemap = [];
const updates = updatesData();

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

  const fragments = {
    "<!--topic-cards-->": () => topicCards(),
    "<!--trig-table-->": () => trigTable(),
    "<!--faq-->": () => faqHtml(meta.faq),
    "<!--video-->": () => videoFacade(topic),
    "<!--pager-->": () => (topic ? pager(topic.slug) : ""),
    "<!--now-->": () => nowHtml(updates),
    "<!--feed-->": () => feedHtml(updates),
    "<!--updated-->": () => (meta.updated ? `<time datetime="${meta.updated}">${thaiDate(meta.updated)}</time>` : ""),
  };
  for (const [marker, fn] of Object.entries(fragments)) body = body.split(marker).join(fn());
  const tocHtml = toc(body);
  body = body.split("<!--toc-->").join(tocHtml);
  body = renderMath(body, rel);

  let graph = [...(meta.jsonld || [])];
  if (topic) graph = graph.concat(lessonSchema(meta, url, topic));
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
    ogImage: SITE + (meta.ogImage || "/images/cover.jpg"),
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

  const outPath = route === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, route, "index.html");
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

// llms.txt
fs.writeFileSync(
  path.join(ROOT, "llms.txt"),
  `# Mod's Engineering Mathematics

Thai-language engineering mathematics lessons by Teerawut Savangboon (อาจารย์มด), lecturer in Electrical Engineering, Faculty of Science and Technology, Dhonburi Rajabhat University, Samut Prakan campus.

## Pages
- Home: ${SITE}/
- About / profile (bio, projects, current status): ${SITE}/about/
- Knowledge library (hub): ${SITE}/learn/
- First-order system lab (interactive time-constant simulator: step/impulse/ramp/sine, RC/RL, log view, s-plane, Bode): ${SITE}/learn/first-order-system/
- Second-order system lab (interactive ζ and ωn explorer: draggable poles, envelope, %OS, Bode, phase portrait, RLC mode): ${SITE}/learn/second-order-system/
- Signals lab (type any signal x(t) or x[n]; derivative, integral, even/odd, energy, spectrum, time shift/scale/reversal, add/multiply/convolution with flip-and-slide): ${SITE}/learn/signals/
- Trigonometry reference (interactive unit circle, every identity with English names, sin/cos/tan table every 0.05° from 0° to 90° in degrees and radians): ${SITE}/learn/trigonometry/
- Lesson editor (online tool: write Markdown + LaTeX lessons, export .md / HTML / PDF): ${SITE}/tools/lesson-editor/

## Lessons (reading order)
${TOPICS.map((t, i) => `${i + 1}. ${t.en} (${t.title}) — ${t.summary}: ${SITE}/learn/${t.slug}/`).join("\n")}

## Video playlists
- Matrix and Determinant: https://www.youtube.com/playlist?list=PLAJhR5azwWpJkUHNvACZSpBG2C7l7VJTO
- Laplace Transforms: https://www.youtube.com/playlist?list=PLAJhR5azwWpLgWalcHsCEE8q_bPJv0Eaa
- Feedback Control: https://www.youtube.com/playlist?list=PLAJhR5azwWpK04F2C2Vp6h3v82Wvqn9ka
- Power Electronics: Buck Converter: https://www.youtube.com/playlist?list=PLAJhR5azwWpJEprWclikULegqCgddv0PF

Language: Thai
YouTube: https://www.youtube.com/@modsengineeringmath
Facebook: https://www.facebook.com/modsengineeringmath
University profile: https://sci.dru.ac.th/electrical-engineering/teerawutsavangboon.html
`
);
console.log("built sitemap.xml, llms.txt");
