// Courses (/courses/): e-learning style classrooms written in plain Markdown, so the owner can post without Claude.
//
//   content/courses/<course>/course.md        the course: front matter (title, parts, plan, files …) + intro text for the hub
//   content/courses/<course>/NN-<slug>.md     unit NN  → /courses/<course>/<slug>/   (NN only sets the order and "หน่วยที่ NN")
//   content/courses/<course>/<slug>.md        extra post (no number) → same URL shape, listed under "เนื้อหาเสริมและประกาศ"
//   content/courses/<course>/_anything.md     ignored (templates, private notes)
//
// loadCourses() turns every file into a { rel, raw } page source with the same <!--meta {...} --> block as src/pages/**.html,
// so build.mjs gives these pages everything the other pages get: layout, KaTeX, sitemap, llms.txt, Markdown copies, search
// index, MCP index and the social-card manifest. The owner's guide (Thai) is content/courses/README.md.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { marked } from "marked";

const HUB = "/courses/";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// --- front matter: "key: value" lines; a key with no value starts a list of "- item" lines ---------------------------------
function parseFront(src, file) {
  const text = src.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) throw new Error(`${file}: ต้องขึ้นต้นไฟล์ด้วยส่วนหัวระหว่างบรรทัด --- สองบรรทัด (front matter). ดูตัวอย่างใน content/courses/control-engineering/_template.md`);
  const data = {};
  let list = null;
  m[1].split("\n").forEach((line, i) => {
    if (!line.trim() || /^\s*#/.test(line)) return;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item) {
      if (!list) throw new Error(`${file}: ส่วนหัวบรรทัดที่ ${i + 2} ขึ้นต้นด้วย "-" แต่ไม่มีชื่อหัวข้อ (เช่น files:) อยู่บรรทัดก่อนหน้า`);
      list.push(unquote(item[1]));
      return;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`${file}: ส่วนหัวบรรทัดที่ ${i + 2} อ่านไม่ได้: "${line.trim()}" — รูปแบบที่ถูกคือ ชื่อ: ค่า`);
    const key = kv[1].toLowerCase(), val = kv[2].trim();
    if (val === "") { list = data[key] = []; return; }
    list = null;
    data[key] = val === "true" ? true : val === "false" ? false : unquote(val);
  });
  return { data, body: text.slice(m[0].length) };
}
const unquote = (s) => { s = s.trim(); return /^(".*"|'.*')$/.test(s) ? s.slice(1, -1) : s; };
const asList = (v) => (Array.isArray(v) ? v : v ? String(v).split(",") : []).map((x) => String(x).trim()).filter(Boolean);
// "label | url | note" items
const pipe = (s) => String(s).split("|").map((x) => x.trim());
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");

// --- Markdown → HTML -------------------------------------------------------------------------------------------------------
// Math: $…$ and $$…$$ (same as the lesson editor at /tools/lesson-editor/) or \( … \) and \[ … \]. It is lifted out before
// Markdown runs (so _ and \\ survive) and put back as \( … \) / \[ … \] for the KaTeX pass in build.mjs.
const BOX = {
  note: ["div", "note c-box", "หมายเหตุ"],
  warn: ["div", "note warn c-box", "ข้อควรระวัง"],
  key: ["div", "tldr c-box", "ใจความสำคัญ"],
  example: ["div", "c-ex c-box", "ตัวอย่าง"],
  activity: ["div", "c-act c-box", "กิจกรรมในชั้นเรียน"],
  exercise: ["div", "c-exr c-box", "แบบฝึกหัด"],
  answer: ["details", "c-ans", "ดูเฉลย"],
};
function youtubeFacade(id, title) {
  return `<div class="c-video"><div class="screen" data-yt-id="${esc(id)}" data-yt-title="${esc(title)}"><div class="facade"><div class="f-eq">▶</div><div><h3>${esc(title)}</h3><p>วิดีโอประกอบบทเรียน · สอนโดยอาจารย์มด</p></div><button class="play" type="button"><i></i>เล่นวิดีโอ</button></div></div><p class="below-screen mono"><span>Mod's Engineering Mathematics</span><a href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">เปิดใน YouTube ↗</a></p></div>`;
}
const fileKind = (url) => (/\.pdf($|[?#])/i.test(url) ? "PDF" : /\.pptx?($|[?#])/i.test(url) ? "PowerPoint" : /\.docx?($|[?#])/i.test(url) ? "Word" : /\.xlsx?($|[?#])/i.test(url) ? "Excel" : /\.zip($|[?#])/i.test(url) ? "ZIP" : /youtu/.test(url) ? "วิดีโอ" : /^https?:/.test(url) ? "ลิงก์" : "ไฟล์");
function fileLink(item, ROOT, file) {
  const [label, url, note] = pipe(item);
  if (!url) throw new Error(`${file}: รายการไฟล์ "${item}" ต้องเขียนเป็น ชื่อที่แสดง | ลิงก์ (เช่น สไลด์หน่วยที่ 1 | /files/courses/control-engineering/unit01.pdf)`);
  const local = url.startsWith("/");
  if (local && !fs.existsSync(path.join(ROOT, decodeURI(url.split(/[?#]/)[0])))) throw new Error(`${file}: ไม่พบไฟล์ ${url} ในโปรเจกต์ — อัปโหลดไฟล์ไปที่โฟลเดอร์ ${path.dirname(url).slice(1)}/ ก่อน หรือแก้ชื่อไฟล์ให้ตรง (ตัวพิมพ์เล็ก-ใหญ่ต้องตรงกัน)`);
  return { label, url, note: note || "", kind: fileKind(url), html: `<a class="c-file" href="${esc(url)}"${local ? "" : ' target="_blank" rel="noopener"'}><span class="c-file-k mono">${fileKind(url)}</span><span><b>${esc(label)}</b>${note ? `<small>${esc(note)}</small>` : ""}</span></a>` };
}

function mdToHtml(src, file, ROOT) {
  const stash = [];
  const keep = (html) => `\u0002${stash.push(html) - 1}\u0003`;
  // 1) directives, line by line (fenced code is left alone)
  const out = [];
  const open = [];
  let fence = null;
  for (const line of src.split("\n")) {
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) { fence = fence ? (line.trim().startsWith(fence) ? null : fence) : f[1]; out.push(line); continue; }
    if (fence) { out.push(line); continue; }
    let d;
    if ((d = line.match(/^::youtube\s+([\w-]{11})\s*(.*)$/))) { out.push("", keep(youtubeFacade(d[1], d[2].trim() || "วิดีโอประกอบ")), ""); continue; }
    if ((d = line.match(/^::file\s+(.+)$/))) { out.push("", keep(`<p class="c-files">${fileLink(d[1], ROOT, file).html}</p>`), ""); continue; }
    if ((d = line.match(/^:::\s*(\w+)\s*(.*)$/))) {
      const b = BOX[d[1].toLowerCase()];
      if (!b) throw new Error(`${file}: ไม่รู้จักกล่อง ":::${d[1]}" — ใช้ได้: ${Object.keys(BOX).join(", ")}`);
      const title = esc(d[2].trim() || b[2]);
      open.push(b[0]);
      out.push("", keep(b[0] === "details" ? `<details class="${b[1]}"><summary>${title}</summary><div class="c-ans-b">` : `<div class="${b[1]}"><p class="c-box-h">${title}</p>`), "");
      continue;
    }
    if (/^:::\s*$/.test(line)) {
      if (!open.length) throw new Error(`${file}: มีบรรทัดปิดกล่อง ":::" เกินมา (ไม่มีกล่องที่เปิดอยู่)`);
      out.push("", keep(open.pop() === "details" ? "</div></details>" : "</div>"), "");
      continue;
    }
    out.push(line);
  }
  if (open.length) throw new Error(`${file}: เปิดกล่อง ":::" ไว้ ${open.length} กล่องแต่ยังไม่ได้ปิดด้วยบรรทัด ":::"`);
  let text = out.join("\n");
  // 2) code, then math, out of Markdown's way
  const code = [];
  text = text.replace(/(^|\n)(```+|~~~+)[^\n]*\n[\s\S]*?\n\2[ \t]*(?=\n|$)|`[^`\n]+`/g, (x) => `\u0004${code.push(x) - 1}\u0005`);
  const math = (tex, display) => keep(display ? `\\[${esc(tex.trim())}\\]` : `\\(${esc(tex.trim())}\\)`);
  text = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => math(t, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => math(t, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => math(t, false))
    .replace(/(^|[^\\$\w])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\w$])/g, (_, pre, t) => pre + math(t, false))
    .replace(/\\\$/g, "$");
  text = text.replace(/\u0004(\d+)\u0005/g, (_, i) => code[+i]);
  // 3) Markdown (GitHub flavour: tables, lists, links, images, raw HTML passes through)
  let html = marked.parse(text, { gfm: true, breaks: false, async: false });
  // a stashed block alone in a paragraph should not stay wrapped in <p>
  html = html.replace(/<p>\s*(\u0002\d+\u0003)\s*<\/p>/g, (x, k) => (/^<(div|details|\/div|p)/.test(stash[+k.slice(1, -1)]) ? k : x));
  html = html.replace(/\u0002(\d+)\u0003/g, (_, i) => stash[+i]);
  // 4) headings get ids (for the table of contents, the search index and #links): "## Title {#my-id}" or automatic
  const used = new Set();
  let n = 0;
  html = html.replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (_, lv, inner) => {
    let id = (inner.match(/\s*\{#([\w-]+)\}\s*$/) || [])[1];
    inner = inner.replace(/\s*\{#[\w-]+\}\s*$/, "");
    if (!id) {
      n++;
      const ascii = inner.replace(/<[^>]+>/g, "").replace(/\\\(.*?\\\)/g, "").toLowerCase().match(/[a-z][a-z0-9]+/g);
      id = ascii && ascii.join("-").length >= 4 ? ascii.slice(0, 5).join("-") : `sec-${n}`;
    }
    while (used.has(id)) id += "-2";
    used.add(id);
    return `<h${lv} id="${id}">${inner}</h${lv}>`;
  });
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  html = html.replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ');
  html = html.replace(/<a href="(https?:\/\/[^"]+)"(?![^>]*target=)/g, '<a href="$1" target="_blank" rel="noopener"');
  for (const m of html.matchAll(/<(?:a href|img [^>]*src)="(\/(?:files|images)\/[^"#?]+)"/g))
    if (!fs.existsSync(path.join(ROOT, decodeURI(m[1])))) throw new Error(`${file}: ไม่พบไฟล์ ${m[1]} ที่บทเรียนอ้างถึง — อัปโหลดไฟล์ก่อน หรือแก้ชื่อให้ตรง`);
  return html;
}

// last change of a source file: "updated:" in the front matter wins; else the date of its last commit; else today
function gitDate(ROOT, rel, today) {
  try {
    if (execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: ROOT, encoding: "utf8" }).trim()) return today;
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", rel], { cwd: ROOT, encoding: "utf8" }).trim() || today;
  } catch { return today; }
}

export function loadCourses(ROOT, h) {
  const { SITE, PERSON_ID, shareHtml, thaiDate, TODAY } = h;
  const dir = path.join(ROOT, "content/courses");
  const courses = [];
  const pages = [];
  if (!fs.existsSync(dir)) return { pages, courses };
  const person = { "@type": "Person", "@id": PERSON_ID, name: "ธีรวุฒิ แสวงบุญ (อาจารย์มด)", alternateName: "Teerawut Savangboon", url: SITE + "/about/" };
  const provider = { "@type": "Organization", name: "Mod's Engineering Mathematics", url: SITE + "/", sameAs: ["https://www.youtube.com/@modsengineeringmath", "https://www.facebook.com/modsengineeringmath"] };
  const crumbsLd = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + item })) });
  const page = (rel, meta, body) => {
    const json = JSON.stringify(meta, null, 1);
    if (json.includes("-->")) throw new Error(`${rel}: ห้ามมี "-->" ในส่วนหัวของบทเรียน`);
    pages.push({ rel, raw: `<!--meta\n${json}\n-->\n${body}` });
  };

  for (const slug of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory()).sort()) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`content/courses/${slug}: ชื่อโฟลเดอร์รายวิชาใช้ได้เฉพาะ a-z 0-9 และ -`);
    const cdir = path.join(dir, slug), crel = `content/courses/${slug}`;
    const cfile = path.join(cdir, "course.md");
    if (!fs.existsSync(cfile)) throw new Error(`${crel}: ไม่มีไฟล์ course.md (ข้อมูลรายวิชา)`);
    const { data: c, body: cbody } = parseFront(fs.readFileSync(cfile, "utf8"), `${crel}/course.md`);
    for (const k of ["title", "description"]) if (!c[k]) throw new Error(`${crel}/course.md: ขาด "${k}:" ในส่วนหัว`);
    if (c.draft) continue;
    const route = `${HUB}${slug}/`;
    const parts = asList(c.parts).map((p) => { const [range, title, note] = pipe(p); const [a, b] = range.split("-").map(Number); return { from: a, to: b || a, title, note: note || "" }; });
    const plan = new Map(asList(c.plan).map((p) => { const [no, title, en] = pipe(p); return [Number(no), { title, en: en || "" }]; }));

    // lessons
    const lessons = [];
    for (const f of fs.readdirSync(cdir).filter((f) => f.endsWith(".md") && f !== "course.md" && !f.startsWith("_") && f.toLowerCase() !== "readme.md").sort()) {
      const file = `${crel}/${f}`;
      const nm = f.match(/^(?:(\d+)[-_.])?([a-z0-9][a-z0-9-]*)\.md$/);
      if (!nm) throw new Error(`${file}: ชื่อไฟล์ต้องเป็นตัวพิมพ์เล็กภาษาอังกฤษ ตัวเลข และ - เท่านั้น เช่น 03-block-diagrams.md (ห้ามเว้นวรรค ห้ามภาษาไทย)`);
      const { data: d, body } = parseFront(fs.readFileSync(path.join(cdir, f), "utf8"), file);
      for (const k of ["title", "description"]) if (!d[k]) throw new Error(`${file}: ขาด "${k}:" ในส่วนหัว`);
      for (const k of ["updated", "published", "video_date"]) if (d[k] && !isDate(d[k])) throw new Error(`${file}: "${k}:" ต้องเป็นวันที่แบบ ปี ค.ศ.-เดือน-วัน เช่น 2026-11-11`);
      if (d.youtube && !/^[\w-]{11}$/.test(d.youtube)) throw new Error(`${file}: "youtube:" ต้องเป็นรหัสวิดีโอ 11 ตัวอักษร (ส่วนหลัง youtu.be/ หรือหลัง v=) ไม่ใช่ลิงก์เต็ม`);
      const no = nm[1] ? Number(nm[1]) : null;
      const updated = d.updated || gitDate(ROOT, file, TODAY);
      lessons.push({ ...d, no, slug: nm[2], file, body, route: `${route}${nm[2]}/`, updated, published: d.published || updated,
        files: asList(d.files).map((x) => fileLink(x, ROOT, file)), outcomes: asList(d.outcomes), keywords: asList(d.keywords),
        deeper: asList(d.deeper).map((x) => { const [a, b] = pipe(x); return b ? { label: a, url: b } : { label: "", url: a }; }) });
    }
    const dup = lessons.find((l, i) => lessons.findIndex((x) => x.slug === l.slug) !== i) || lessons.find((l, i) => l.no != null && lessons.findIndex((x) => x.no === l.no) !== i);
    if (dup) throw new Error(`${dup.file}: เลขหน่วยหรือชื่อ (slug) ซ้ำกับไฟล์อื่นในรายวิชาเดียวกัน`);
    const live = lessons.filter((l) => !l.draft);
    const units = live.filter((l) => l.no != null).sort((a, b) => a.no - b.no);
    const extras = live.filter((l) => l.no == null).sort((a, b) => b.published.localeCompare(a.published));
    const updated = [c.updated, ...live.map((l) => l.updated), gitDate(ROOT, `${crel}/course.md`, TODAY)].filter(isDate).sort().pop();
    const course = { ...c, slug, route, units, extras, updated, keywords: asList(c.keywords) };
    courses.push(course);
    const unitLabel = (l) => (l.no != null ? `หน่วยที่ ${l.no}` : "เนื้อหาเสริม");

    // ---- lesson pages ----
    for (const l of lessons) {
      const url = SITE + l.route;
      const i = units.indexOf(l), prev = i > 0 ? units[i - 1] : null, next = i >= 0 ? units[i + 1] : null;
      const a = (href, dir, label, title) => `<a class="pager-${dir}" href="${href}"><span class="mono">${label}</span><b>${esc(title)}</b></a>`;
      const pager = `<nav class="pager" aria-label="หน่วยก่อนหน้าและถัดไป">${prev ? a(prev.route, "prev", `← ${unitLabel(prev)}`, prev.title) : a(route, "prev", "← กลับหน้ารายวิชา", c.title)}${next ? a(next.route, "next", `${unitLabel(next)} →`, next.title) : a(route, "next", "ดูแผนการเรียนทั้งหมด →", c.title)}</nav>`;
      const h1 = l.h1 || l.title;
      const html = mdToHtml(l.body, l.file, ROOT);
      const words = Math.max(1, Math.round(html.replace(/<[^>]+>/g, "").length / 900));
      const body = `<div class="wrap lesson-wrap lesson-layout">
  <aside class="lesson-side"><!--toc--></aside>
  <article class="lesson course-lesson" data-course="${slug}" data-lesson="${l.slug}">
    <header>
      <ol class="crumbs"><li><a href="/">หน้าแรก</a></li><li><a href="${HUB}">ห้องเรียน</a></li><li><a href="${route}">${esc(c.short || c.title)}</a></li><li>${esc(unitLabel(l))}</li></ol>
      <p class="eyebrow">// ${esc(unitLabel(l))} · ${esc(c.en || c.title)}${l.en ? ` · ${esc(l.en)}` : ""}</p>
      <h1>${esc(h1)}</h1>
      <p class="lede">${esc(l.lede || l.description)}</p>
      <div class="lesson-meta"><span>สอนโดย <a href="/about/">อาจารย์มด</a></span><span>อัปเดต <!--updated--></span><span>อ่านประมาณ ${l.time || words * 2} นาที</span></div>
      <div class="c-tools" role="group" aria-label="เครื่องมือของบทเรียน">
        <button type="button" class="c-btn c-done" aria-pressed="false">ทำเครื่องหมายว่าเรียนแล้ว</button>
        <button type="button" class="c-btn c-class" aria-pressed="false" title="ขยายตัวอักษรและซ่อนเมนู สำหรับฉายในห้องเรียน (กด Esc เพื่อออก)">โหมดสอนในห้อง</button>
        <button type="button" class="c-btn c-print">พิมพ์ / บันทึกเป็น PDF</button>
      </div>
    </header>
${l.youtube ? `    <section class="c-sec" aria-labelledby="video"><h2 id="video">วิดีโอประกอบบทเรียน</h2>${youtubeFacade(l.youtube, l.video_title || h1)}</section>\n` : ""}${l.outcomes.length ? `    <section class="c-sec c-out" aria-labelledby="outcomes"><h2 id="outcomes">เรียนจบหน่วยนี้แล้วทำอะไรได้</h2><ul>${l.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></section>\n` : ""}${l.files.length ? `    <section class="c-sec" aria-labelledby="downloads"><h2 id="downloads">เอกสารประกอบการสอน</h2><p class="c-files">${l.files.map((f) => f.html).join("")}</p></section>\n` : ""}    <div class="c-body">
${html}
    </div>
${l.deeper.length ? `    <aside class="post-box" aria-label="อ่านเชิงลึก"><p class="post-box-h">อ่านเชิงลึกในคลังความรู้</p><ul>${l.deeper.map((x) => `<li><a href="${esc(x.url)}">${esc(x.label || x.url)}</a></li>`).join("")}</ul></aside>\n` : ""}    ${shareHtml(url, h1)}
    ${pager}
  </article>
</div>`;
      const ld = [
        {
          "@type": ["Article", "LearningResource"], "@id": url + "#lesson", headline: h1, name: `${c.title} ${unitLabel(l)}: ${l.title}`, description: l.description,
          inLanguage: "th", url, mainEntityOfPage: url, datePublished: l.published, dateModified: l.updated, author: { "@id": PERSON_ID }, publisher: { "@id": PERSON_ID },
          learningResourceType: "Lecture notes", educationalLevel: c.level || "Undergraduate", isAccessibleForFree: true, isPartOf: { "@id": SITE + route + "#course" },
          ...(l.no != null ? { position: l.no } : {}), ...(l.outcomes.length ? { teaches: l.outcomes } : {}), ...(l.keywords.length ? { keywords: l.keywords.join(", ") } : {}),
        },
        crumbsLd([["หน้าแรก", "/"], ["ห้องเรียน", HUB], [c.short || c.title, route], [`${unitLabel(l)} ${l.title}`, l.route]]),
      ];
      // Google needs name, thumbnail and upload date for a video; without "video_date:" the player is shown but no VideoObject is claimed
      if (l.youtube && l.video_date)
        ld.push({ "@type": "VideoObject", name: l.video_title || h1, description: l.description, thumbnailUrl: [`https://i.ytimg.com/vi/${l.youtube}/hqdefault.jpg`], uploadDate: `${l.video_date}T00:00:00+07:00`,
          embedUrl: `https://www.youtube.com/embed/${l.youtube}`, contentUrl: `https://www.youtube.com/watch?v=${l.youtube}`, inLanguage: "th", ...(l.duration ? { duration: l.duration } : {}) });
      page(`courses/${slug}/${l.slug}.html`, {
        title: l.seo_title || `${l.title} | ${c.short || c.title} ${unitLabel(l)} · อาจารย์มด`, h1, description: l.description, ogTitle: `${unitLabel(l)}: ${l.title}`,
        nav: "courses", katex: true, updated: l.updated, css: ["/assets/course.css"], scripts: ["/assets/course.js", ...asList(l.scripts)], ogType: "article",
        ...(l.draft ? { draft: true } : {}), ...(l.keywords.length ? { keywords: l.keywords } : {}),
        og: { title: l.title, sub: l.description, eyebrow: `${c.en || c.title} · ${unitLabel(l)}`, sym: c.sym || "G(s)" }, jsonld: ld,
      }, body);
    }

    // ---- course hub ----
    const url = SITE + route;
    const badge = (l) => `${l.youtube ? '<span class="c-bd">วิดีโอ</span>' : ""}${l.files.length ? `<span class="c-bd">เอกสาร ${l.files.length}</span>` : ""}`;
    const nos = [...new Set([...plan.keys(), ...units.map((u) => u.no)])].sort((a, b) => a - b);
    const row = (no) => {
      const u = units.find((x) => x.no === no), p = plan.get(no);
      return u
        ? `<li class="c-unit"><a href="${u.route}" data-lesson="${u.slug}"><span class="c-no mono">${String(no).padStart(2, "0")}</span><span class="c-ut"><b>${esc(u.title)}</b>${u.en ? `<small lang="en">${esc(u.en)}</small>` : ""}</span><span class="c-bds">${badge(u)}<span class="c-bd c-bd-done" hidden>เรียนแล้ว ✓</span></span></a></li>`
        : `<li class="c-unit c-soon"><span class="c-row"><span class="c-no mono">${String(no).padStart(2, "0")}</span><span class="c-ut"><b>${esc(p.title)}</b>${p.en ? `<small lang="en">${esc(p.en)}</small>` : ""}</span><span class="c-bds"><span class="c-bd">เร็วๆ นี้</span></span></span></li>`;
    };
    const groups = parts.length ? parts.map((p) => ({ ...p, nos: nos.filter((n) => n >= p.from && n <= p.to) })).filter((p) => p.nos.length) : [{ title: "", nos }];
    const rest = nos.filter((n) => !groups.some((g) => g.nos.includes(n)));
    if (rest.length) groups.push({ title: "หน่วยอื่น ๆ", nos: rest });
    const syllabus = groups.map((g) => `${g.title ? `<h3 class="c-part">${esc(g.title)}</h3>${g.note ? `<p class="c-part-n">${esc(g.note)}</p>` : ""}` : ""}<ol class="c-units">${g.nos.map(row).join("")}</ol>`).join("\n");
    const cfiles = asList(c.files).map((x) => fileLink(x, ROOT, `${crel}/course.md`));
    const unitFiles = units.filter((u) => u.files.length);
    const docs = `${cfiles.length ? `<p class="c-files">${cfiles.map((f) => f.html).join("")}</p>` : ""}${unitFiles.length ? `<ul class="c-doclist">${unitFiles.map((u) => `<li><a href="${u.route}#downloads"><b>${unitLabel(u)}</b> ${esc(u.title)}</a> — ${u.files.map((f) => `<a href="${esc(f.url)}">${esc(f.label)} <span class="mono">(${f.kind})</span></a>`).join(" · ")}</li>`).join("")}</ul>` : ""}${!cfiles.length && !unitFiles.length ? `<p class="c-empty">ตำราและไฟล์เอกสารประกอบการสอนของรายวิชานี้อยู่ระหว่างจัดทำ เมื่อเผยแพร่แล้วจะมีปุ่มดาวน์โหลดที่ส่วนนี้และในแต่ละหน่วย ระหว่างนี้ทุกหน่วยมีปุ่ม <b>พิมพ์ / บันทึกเป็น PDF</b> สำหรับทำเอกสารแจกในชั้นเรียน</p>` : ""}`;
    const first = units[0];
    const hubBody = `<div class="wrap lesson-wrap">
  <article class="lesson course-hub" data-course="${slug}">
    <header>
      <ol class="crumbs"><li><a href="/">หน้าแรก</a></li><li><a href="${HUB}">ห้องเรียน</a></li><li>${esc(c.short || c.title)}</li></ol>
      <p class="eyebrow">// ห้องเรียนออนไลน์ · ${esc(c.en || "Course")}</p>
      <h1>${esc(c.h1 || c.title)}</h1>
      <p class="lede">${esc(c.lede || c.description)}</p>
      <ul class="chips"><li>${units.length} หน่วยที่เปิดแล้ว${nos.length > units.length ? ` จากแผน ${nos.length} หน่วย` : ""}</li>${c.level_th ? `<li>${esc(c.level_th)}</li>` : ""}<li>ภาษาไทย · ศัพท์เทคนิคอังกฤษ</li><li>เรียนฟรี ไม่ต้องสมัครสมาชิก</li><li>อัปเดต <!--updated--></li></ul>
      <p class="c-cta">${first ? `<a class="btn btn-primary" href="${first.route}">เริ่มเรียน${unitLabel(first)}</a>` : ""}${c.playlist ? `<a class="btn btn-ghost" href="https://www.youtube.com/playlist?list=${esc(c.playlist)}" target="_blank" rel="noopener">เพลย์ลิสต์บน YouTube ↗</a>` : ""}<a class="btn btn-ghost" href="#documents">ตำราและเอกสาร</a></p>
      <div class="c-prog" hidden><div class="c-prog-bar"><i></i></div><p class="mono"><span class="c-prog-t"></span> <button type="button" class="c-prog-reset">ล้างความคืบหน้า</button></p></div>
    </header>
    <section class="c-sec" aria-labelledby="syllabus">
      <h2 id="syllabus">แผนการเรียนรายหน่วย</h2>
      ${syllabus}
    </section>
    <section class="c-sec" aria-labelledby="documents">
      <h2 id="documents">ตำราและเอกสารประกอบการสอน</h2>
      ${docs}
    </section>
${extras.length ? `    <section class="c-sec" aria-labelledby="extras"><h2 id="extras">เนื้อหาเสริมและประกาศ</h2><ul class="c-doclist">${extras.map((x) => `<li><a href="${x.route}"><b>${esc(x.title)}</b></a> <span class="mono">${thaiDate(x.published)}</span><br>${esc(x.description)}</li>`).join("")}</ul></section>\n` : ""}    <div class="c-body">
${mdToHtml(cbody, `${crel}/course.md`, ROOT)}
    </div>
${c.playlist ? `    <section class="lesson-video" aria-labelledby="playlist"><h2 id="playlist">วิดีโอของรายวิชา</h2><div class="screen" data-yt-list="${esc(c.playlist)}" data-yt-title="${esc(c.en || c.title)}"><div class="facade"><div class="f-eq">${esc(c.sym || "G(s)")}</div><div><h3>${esc(c.en || c.title)}</h3><p>${esc(c.title)} · เพลย์ลิสต์บน YouTube</p></div><button class="play" type="button"><i></i>เล่นเพลย์ลิสต์</button></div></div><p class="below-screen mono"><span>สอนโดยอาจารย์มด · ภาษาไทย</span><a href="https://www.youtube.com/playlist?list=${esc(c.playlist)}" target="_blank" rel="noopener">เปิดใน YouTube ↗</a></p></section>\n` : ""}    ${shareHtml(url, c.h1 || c.title)}
  </article>
</div>`;
    page(`courses/${slug}/index.html`, {
      title: c.seo_title || `${c.title} | ห้องเรียนออนไลน์ อาจารย์มด`, h1: c.h1 || c.title, description: c.description, ogTitle: c.title, nav: "courses", katex: true, updated,
      css: ["/assets/course.css"], scripts: ["/assets/course.js"], ...(course.keywords.length ? { keywords: course.keywords } : {}),
      og: { title: c.title, sub: c.description, eyebrow: `ห้องเรียนออนไลน์ · ${c.en || ""}`, sym: c.sym || "G(s)" },
      jsonld: [
        {
          "@type": "Course", "@id": url + "#course", name: c.title, ...(c.en ? { alternateName: c.en } : {}), description: c.description, url, inLanguage: "th", provider,
          isAccessibleForFree: true, educationalLevel: c.level || "Undergraduate", ...(course.keywords.length ? { keywords: course.keywords.join(", ") } : {}),
          ...(asList(c.about).length ? { about: asList(c.about) } : {}), dateModified: updated,
          offers: { "@type": "Offer", category: "Free", price: 0, priceCurrency: "THB", availability: "https://schema.org/InStock", url },
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", ...(c.workload ? { courseWorkload: c.workload } : {}), instructor: person, inLanguage: "th" },
          ...(groups.some((g) => g.title) ? { syllabusSections: groups.filter((g) => g.title).map((g) => ({ "@type": "Syllabus", name: g.title, description: g.nos.map((n) => (units.find((u) => u.no === n) || plan.get(n)).title).join(" · ") })) } : {}),
          ...(units.length ? { hasPart: units.map((u) => ({ "@id": SITE + u.route + "#lesson" })) } : {}),
        },
        { "@type": "ItemList", name: `${c.title}: หน่วยการเรียน`, numberOfItems: units.length, itemListElement: units.map((u, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + u.route, name: `${unitLabel(u)} ${u.title}` })) },
        crumbsLd([["หน้าแรก", "/"], ["ห้องเรียน", HUB], [c.short || c.title, route]]),
      ],
    }, hubBody);
  }

  // ---- /courses/ : every course ----
  if (courses.length) {
    const updated = courses.map((c) => c.updated).sort().pop();
    const desc = "ห้องเรียนออนไลน์ของอาจารย์มด: รายวิชาวิศวกรรมที่เรียนเป็นหน่วยตามลำดับ มีวิดีโอ เอกสารประกอบการสอน ตัวอย่าง แบบฝึกหัดพร้อมเฉลย ใช้เรียนเองหรือใช้สอนในชั้นเรียนได้ฟรี";
    page("courses/index.html", {
      title: "ห้องเรียนออนไลน์: รายวิชาวิศวกรรมเรียนเป็นหน่วย พร้อมเอกสารประกอบการสอน | อาจารย์มด", h1: "ห้องเรียนออนไลน์", description: desc, ogTitle: "ห้องเรียนออนไลน์ — Mod's Engineering Mathematics", nav: "courses", updated,
      css: ["/assets/course.css"], scripts: ["/assets/course.js"], keywords: ["เรียนออนไลน์ วิศวกรรม", "e-learning วิศวกรรมไฟฟ้า", "เอกสารประกอบการสอน", "online engineering courses Thai", ...courses.map((c) => c.title)],
      og: { title: "ห้องเรียนออนไลน์", sub: desc, eyebrow: "Courses · Mod's Engineering Mathematics", sym: "∿" },
      jsonld: [
        { "@type": "CollectionPage", "@id": SITE + HUB + "#collection", url: SITE + HUB, name: "ห้องเรียนออนไลน์ — Mod's Engineering Mathematics", description: desc, inLanguage: "th", publisher: { "@id": PERSON_ID },
          mainEntity: { "@type": "ItemList", numberOfItems: courses.length, itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + c.route, name: c.title })) } },
        crumbsLd([["หน้าแรก", "/"], ["ห้องเรียน", HUB]]),
      ],
    }, `<div class="wrap lesson-wrap">
  <article class="lesson course-hub">
    <header>
      <ol class="crumbs"><li><a href="/">หน้าแรก</a></li><li>ห้องเรียน</li></ol>
      <p class="eyebrow">// Courses · ห้องเรียนออนไลน์</p>
      <h1>ห้องเรียนออนไลน์</h1>
      <p class="lede">รายวิชาที่จัดเป็นหน่วยเรียงตามลำดับการสอนจริงในชั้นเรียน แต่ละหน่วยมีเนื้อหา ตัวอย่างทำทีละขั้น แบบฝึกหัดพร้อมเฉลย วิดีโอจากช่อง YouTube และเอกสารประกอบการสอน เปิดได้ทันทีจากมือถือหรือจอโปรเจกเตอร์ ไม่ต้องสมัครสมาชิก ส่วนเนื้อหาอ้างอิงเชิงลึกทุกหัวข้ออยู่ที่<a href="/learn/">คลังความรู้</a></p>
    </header>
    <section class="c-sec" aria-labelledby="all-courses">
      <h2 id="all-courses">รายวิชาที่เปิดแล้ว</h2>
      <div class="c-cards">${courses.map((c) => `<a class="c-card" href="${c.route}"><span class="c-card-sym" aria-hidden="true">${esc(c.sym || "∿")}</span><b>${esc(c.title)}</b>${c.en ? `<small lang="en">${esc(c.en)}</small>` : ""}<span>${esc(c.description)}</span><span class="mono">${c.units.length} หน่วย · อัปเดต ${thaiDate(c.updated)}</span></a>`).join("")}</div>
    </section>
    ${shareHtml(SITE + HUB, "ห้องเรียนออนไลน์ — Mod's Engineering Mathematics")}
  </article>
</div>`);
  }
  return { pages, courses };
}
