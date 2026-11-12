// Courses (/courses/): e-learning style classrooms written in plain Markdown, so the owner can post without Claude.
//
//   content/courses/<course>/course.md        the course: front matter (title, parts, plan, files …) + intro text for the hub
//   content/courses/<course>/NN-<slug>.md     unit NN  → /courses/<course>/<slug>/   (NN only sets the order and "หน่วยที่ NN")
//   content/courses/<course>/<slug>.md        extra post (no number) → same URL shape, listed under "เนื้อหาเสริมและประกาศ"
//   content/courses/<course>/_anything.md     ignored (templates, private notes)
//   content/courses/<course>/en/…             the English edition, same file names → /en/courses/<course>/…  (Thai is the source; translate after editing)
//
// loadCourses() turns every file into a { rel, raw } page source with the same <!--meta {...} --> block as src/pages/**.html,
// so build.mjs gives these pages everything the other pages get: layout, KaTeX, sitemap, llms.txt, Markdown copies, search
// index, MCP index and the social-card manifest. The owner's guide (Thai) is content/courses/README.md.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { marked } from "marked";

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

// --- words of the two editions --------------------------------------------------------------------------------------------
// Thai edition: content/courses/<course>/*.md → /courses/<course>/…      English edition: content/courses/<course>/en/*.md → /en/courses/<course>/…
// A unit and its translation share the file name, so they pair up (hreflang + the TH/EN switch) without any setting.
const STR = {
  th: {
    hub: "/courses/", home: "หน้าแรก", room: "ห้องเรียน", unit: (n) => `หน่วยที่ ${n}`, extra: "เนื้อหาเสริม", by: 'สอนโดย <a href="/about/">อาจารย์มด</a>', upd: "อัปเดต", read: (n) => `อ่านประมาณ ${n} นาที`,
    done: "ทำเครื่องหมายว่าเรียนแล้ว", cls: "โหมดสอนในห้อง", clsT: "ขยายตัวอักษรและซ่อนเมนู สำหรับฉายในห้องเรียน (กด Esc เพื่อออก)", print: "พิมพ์ / บันทึกเป็น PDF", toolsL: "เครื่องมือของบทเรียน",
    video: "วิดีโอประกอบบทเรียน", out: "เรียนจบหน่วยนี้แล้วทำอะไรได้", docsU: "เอกสารประกอบการสอน", deeper: "อ่านเชิงลึกในคลังความรู้", pagerL: "หน่วยก่อนหน้าและถัดไป", back: "← กลับหน้ารายวิชา", plan: "ดูแผนการเรียนทั้งหมด →",
    online: "ห้องเรียนออนไลน์", open: (n, all) => `${n} หน่วยที่เปิดแล้ว${all > n ? ` จากแผน ${all} หน่วย` : ""}`, langChip: "ภาษาไทย · ศัพท์เทคนิคอังกฤษ", free: "เรียนฟรี ไม่ต้องสมัครสมาชิก",
    start: (u) => `เริ่มเรียน${u}`, pl: "เพลย์ลิสต์บน YouTube ↗", docsBtn: "ตำราและเอกสาร", reset: "ล้างความคืบหน้า", syl: "แผนการเรียนรายหน่วย", docs: "ตำราและเอกสารประกอบการสอน", soon: "เร็วๆ นี้", learned: "เรียนแล้ว ✓",
    bVideo: "วิดีโอ", bDocs: (n) => `เอกสาร ${n}`, other: "หน่วยอื่น ๆ", extras: "เนื้อหาเสริมและประกาศ", cVideo: "วิดีโอของรายวิชา", plOn: "เพลย์ลิสต์บน YouTube", playPl: "เล่นเพลย์ลิสต์", taught: "สอนโดยอาจารย์มด · ภาษาไทย", openYt: "เปิดใน YouTube ↗",
    empty: "ตำราและไฟล์เอกสารประกอบการสอนของรายวิชานี้อยู่ระหว่างจัดทำ เมื่อเผยแพร่แล้วจะมีปุ่มดาวน์โหลดที่ส่วนนี้และในแต่ละหน่วย ระหว่างนี้ทุกหน่วยมีปุ่ม <b>พิมพ์ / บันทึกเป็น PDF</b> สำหรับทำเอกสารแจกในชั้นเรียน",
    ytSub: "วิดีโอประกอบบทเรียน · สอนโดยอาจารย์มด", play: "เล่นวิดีโอ", ytDef: "วิดีโอประกอบ", titleSuffix: "อาจารย์มด", hubSuffix: "ห้องเรียนออนไลน์ อาจารย์มด", units: (t) => `${t}: หน่วยการเรียน`, twin: "English edition", twinL: "en",
    allTitle: "ห้องเรียนออนไลน์: รายวิชาวิศวกรรมเรียนเป็นหน่วย พร้อมเอกสารประกอบการสอน | อาจารย์มด", allH1: "ห้องเรียนออนไลน์", allOg: "ห้องเรียนออนไลน์ — Mod's Engineering Mathematics",
    allDesc: "ห้องเรียนออนไลน์ของอาจารย์มด: รายวิชาวิศวกรรมที่เรียนเป็นหน่วยตามลำดับ มีวิดีโอ เอกสารประกอบการสอน ตัวอย่าง แบบฝึกหัดพร้อมเฉลย ใช้เรียนเองหรือใช้สอนในชั้นเรียนได้ฟรี",
    allKw: ["เรียนออนไลน์ วิศวกรรม", "e-learning วิศวกรรมไฟฟ้า", "เอกสารประกอบการสอน", "online engineering courses Thai"], allEyebrow: "// Courses · ห้องเรียนออนไลน์",
    allLede: 'รายวิชาที่จัดเป็นหน่วยเรียงตามลำดับการสอนจริงในชั้นเรียน แต่ละหน่วยมีเนื้อหา ตัวอย่างทำทีละขั้น แบบฝึกหัดพร้อมเฉลย วิดีโอจากช่อง YouTube และเอกสารประกอบการสอน เปิดได้ทันทีจากมือถือหรือจอโปรเจกเตอร์ ไม่ต้องสมัครสมาชิก ส่วนเนื้อหาอ้างอิงเชิงลึกทุกหัวข้ออยู่ที่<a href="/learn/">คลังความรู้</a>',
    allOpen: "รายวิชาที่เปิดแล้ว", card: (n, d) => `${n} หน่วย · อัปเดต ${d}`,
    box: { note: "หมายเหตุ", warn: "ข้อควรระวัง", key: "ใจความสำคัญ", example: "ตัวอย่าง", activity: "กิจกรรมในชั้นเรียน", exercise: "แบบฝึกหัด", answer: "ดูเฉลย" },
  },
  en: {
    hub: "/en/courses/", home: "Home", room: "Courses", unit: (n) => `Unit ${n}`, extra: "Supplement", by: 'Taught by <a href="/about/">Ajarn Mod</a>', upd: "Updated", read: (n) => `About ${n} min read`,
    done: "Mark as learned", cls: "Classroom mode", clsT: "Larger text and no menus, for projecting in class (Esc to leave)", print: "Print / save as PDF", toolsL: "Lesson tools",
    video: "Lesson video", out: "What you can do after this unit", docsU: "Handouts", deeper: "Go deeper (Thai reference library)", pagerL: "Previous and next unit", back: "← Back to the course", plan: "See the whole study plan →",
    online: "Online classroom", open: (n, all) => `${n} units open${all > n ? ` of ${all} planned` : ""}`, langChip: "English edition", free: "Free, no sign-up",
    start: (u) => `Start ${u}`, pl: "YouTube playlist (Thai) ↗", docsBtn: "Textbook and handouts", reset: "Clear progress", syl: "Study plan by unit", docs: "Textbook and handouts", soon: "Coming soon", learned: "Learned ✓",
    bVideo: "Video", bDocs: (n) => `Handouts ${n}`, other: "Other units", extras: "Supplements and announcements", cVideo: "Course videos", plOn: "YouTube playlist", playPl: "Play the playlist", taught: "Taught by Ajarn Mod · in Thai", openYt: "Open in YouTube ↗",
    empty: "The textbook and handout files for this course are in preparation. Download buttons will appear here and in each unit. Until then every unit has a <b>Print / save as PDF</b> button for making class handouts.",
    ytSub: "Lesson video · taught by Ajarn Mod (in Thai)", play: "Play video", ytDef: "Lesson video", titleSuffix: "Ajarn Mod", hubSuffix: "Online classroom · Ajarn Mod", units: (t) => `${t}: units`, twin: "ฉบับภาษาไทย", twinL: "th",
    allTitle: "Online Classrooms: Engineering Courses Unit by Unit, with Lecture Notes | Ajarn Mod", allH1: "Online classrooms", allOg: "Online classrooms — Mod's Engineering Mathematics",
    allDesc: "Ajarn Mod's online classrooms: engineering courses taught unit by unit in teaching order, with worked examples, exercises with answers and lecture notes. Free for self-study or classroom use.",
    allKw: ["online engineering course", "control engineering course free", "electrical engineering e-learning", "lecture notes"], allEyebrow: "// Courses · Online classrooms",
    allLede: 'Courses arranged as units in the order they are taught in class. Each unit has the theory, examples worked step by step, exercises with folded answers and printable notes. No sign-up needed. The Thai editions are at <a href="/courses/" lang="th">ห้องเรียนออนไลน์</a>.',
    allOpen: "Open courses", card: (n, d) => `${n} units · updated ${d}`,
    box: { note: "Note", warn: "Caution", key: "Key idea", example: "Example", activity: "Class activity", exercise: "Exercise", answer: "Show answer" },
  },
};

// --- Markdown → HTML -------------------------------------------------------------------------------------------------------
// Math: $…$ and $$…$$ (same as the lesson editor at /tools/lesson-editor/) or \( … \) and \[ … \]. It is lifted out before
// Markdown runs (so _ and \\ survive) and put back as \( … \) / \[ … \] for the KaTeX pass in build.mjs.
const BOX = {
  note: ["div", "note c-box"],
  warn: ["div", "note warn c-box"],
  key: ["div", "tldr c-box"],
  example: ["div", "c-ex c-box"],
  activity: ["div", "c-act c-box"],
  exercise: ["div", "c-exr c-box"],
  answer: ["details", "c-ans"],
};
function youtubeFacade(id, title, S = STR.th) {
  return `<div class="c-video"><div class="screen" data-yt-id="${esc(id)}" data-yt-title="${esc(title)}"><div class="facade"><div class="f-eq">▶</div><div><h3>${esc(title)}</h3><p>${S.ytSub}</p></div><button class="play" type="button"><i></i>${S.play}</button></div></div><p class="below-screen mono"><span>Mod's Engineering Mathematics</span><a href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">${S.openYt}</a></p></div>`;
}
const fileKind = (url) => (/\.pdf($|[?#])/i.test(url) ? "PDF" : /\.pptx?($|[?#])/i.test(url) ? "PowerPoint" : /\.docx?($|[?#])/i.test(url) ? "Word" : /\.xlsx?($|[?#])/i.test(url) ? "Excel" : /\.zip($|[?#])/i.test(url) ? "ZIP" : /youtu/.test(url) ? "วิดีโอ" : /^https?:/.test(url) ? "ลิงก์" : "ไฟล์");
function fileLink(item, ROOT, file) {
  const [label, url, note] = pipe(item);
  if (!url) throw new Error(`${file}: รายการไฟล์ "${item}" ต้องเขียนเป็น ชื่อที่แสดง | ลิงก์ (เช่น สไลด์หน่วยที่ 1 | /files/courses/control-engineering/unit01.pdf)`);
  const local = url.startsWith("/");
  if (local && !fs.existsSync(path.join(ROOT, decodeURI(url.split(/[?#]/)[0])))) throw new Error(`${file}: ไม่พบไฟล์ ${url} ในโปรเจกต์ — อัปโหลดไฟล์ไปที่โฟลเดอร์ ${path.dirname(url).slice(1)}/ ก่อน หรือแก้ชื่อไฟล์ให้ตรง (ตัวพิมพ์เล็ก-ใหญ่ต้องตรงกัน)`);
  return { label, url, note: note || "", kind: fileKind(url), html: `<a class="c-file" href="${esc(url)}"${local ? "" : ' target="_blank" rel="noopener"'}><span class="c-file-k mono">${fileKind(url)}</span><span><b>${esc(label)}</b>${note ? `<small>${esc(note)}</small>` : ""}</span></a>` };
}

function mdToHtml(src, file, ROOT, S = STR.th) {
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
    if ((d = line.match(/^::youtube\s+([\w-]{11})\s*(.*)$/))) { out.push("", keep(youtubeFacade(d[1], d[2].trim() || S.ytDef, S)), ""); continue; }
    if ((d = line.match(/^::file\s+(.+)$/))) { out.push("", keep(`<p class="c-files">${fileLink(d[1], ROOT, file).html}</p>`), ""); continue; }
    if ((d = line.match(/^:::\s*(\w+)\s*(.*)$/))) {
      const kind = d[1].toLowerCase(), b = BOX[kind];
      if (!b) throw new Error(`${file}: ไม่รู้จักกล่อง ":::${d[1]}" — ใช้ได้: ${Object.keys(BOX).join(", ")}`);
      const title = esc(d[2].trim() || S.box[kind]);
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

// read one edition of one course: its course.md and unit files. Returns null when the edition does not exist or is a draft.
function readEdition(ROOT, slug, lang) {
  const crel = `content/courses/${slug}${lang === "en" ? "/en" : ""}`, cdir = path.join(ROOT, crel), cfile = path.join(cdir, "course.md");
  if (!fs.existsSync(cfile)) {
    if (lang === "th") throw new Error(`${crel}: ไม่มีไฟล์ course.md (ข้อมูลรายวิชา)`);
    return null;
  }
  const { data: c, body: cbody } = parseFront(fs.readFileSync(cfile, "utf8"), `${crel}/course.md`);
  for (const k of ["title", "description"]) if (!c[k]) throw new Error(`${crel}/course.md: ขาด "${k}:" ในส่วนหัว`);
  if (c.draft) return null;
  const lessons = [];
  for (const f of fs.readdirSync(cdir).filter((f) => f.endsWith(".md") && f !== "course.md" && !f.startsWith("_") && f.toLowerCase() !== "readme.md").sort()) {
    const file = `${crel}/${f}`;
    const nm = f.match(/^(?:(\d+)[-_.])?([a-z0-9][a-z0-9-]*)\.md$/);
    if (!nm) throw new Error(`${file}: ชื่อไฟล์ต้องเป็นตัวพิมพ์เล็กภาษาอังกฤษ ตัวเลข และ - เท่านั้น เช่น 03-block-diagrams.md (ห้ามเว้นวรรค ห้ามภาษาไทย)`);
    const { data: d, body } = parseFront(fs.readFileSync(path.join(cdir, f), "utf8"), file);
    for (const k of ["title", "description"]) if (!d[k]) throw new Error(`${file}: ขาด "${k}:" ในส่วนหัว`);
    for (const k of ["updated", "published", "video_date"]) if (d[k] && !isDate(d[k])) throw new Error(`${file}: "${k}:" ต้องเป็นวันที่แบบ ปี ค.ศ.-เดือน-วัน เช่น 2026-11-11`);
    if (d.youtube && !/^[\w-]{11}$/.test(d.youtube)) throw new Error(`${file}: "youtube:" ต้องเป็นรหัสวิดีโอ 11 ตัวอักษร (ส่วนหลัง youtu.be/ หรือหลัง v=) ไม่ใช่ลิงก์เต็ม`);
    lessons.push({ ...d, no: nm[1] ? Number(nm[1]) : null, slug: nm[2], file, body });
  }
  const dup = lessons.find((l, i) => lessons.findIndex((x) => x.slug === l.slug) !== i) || lessons.find((l, i) => l.no != null && lessons.findIndex((x) => x.no === l.no) !== i);
  if (dup) throw new Error(`${dup.file}: เลขหน่วยหรือชื่อ (slug) ซ้ำกับไฟล์อื่นในรายวิชาเดียวกัน`);
  return { c, cbody, crel, lessons };
}

export function loadCourses(ROOT, h) {
  const { SITE, PERSON_ID, shareHtml, thaiDate, enDate, TODAY } = h;
  const dir = path.join(ROOT, "content/courses");
  const all = { th: [], en: [] };
  const pages = [];
  if (!fs.existsSync(dir)) return { pages, courses: [], coursesEn: [] };
  const provider = { "@type": "Organization", name: "Mod's Engineering Mathematics", url: SITE + "/", sameAs: ["https://www.youtube.com/@modsengineeringmath", "https://www.facebook.com/modsengineeringmath"] };
  const crumbsLd = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + item })) });
  const page = (rel, meta, body) => {
    const json = JSON.stringify(meta, null, 1);
    if (json.includes("-->")) throw new Error(`${rel}: ห้ามมี "-->" ในส่วนหัวของบทเรียน`);
    pages.push({ rel, raw: `<!--meta\n${json}\n-->\n${body}` });
  };

  for (const slug of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory()).sort()) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`content/courses/${slug}: ชื่อโฟลเดอร์รายวิชาใช้ได้เฉพาะ a-z 0-9 และ -`);
    const eds = { th: readEdition(ROOT, slug, "th"), en: readEdition(ROOT, slug, "en") };
    if (!eds.th) continue;
    // routes of the published pages of each edition, to pair a page with its translation
    const liveSlugs = (e) => new Set(e ? e.lessons.filter((l) => !l.draft).map((l) => l.slug) : []);
    const live = { th: liveSlugs(eds.th), en: liveSlugs(eds.en) };
    for (const lang of ["th", "en"]) {
      const ed = eds[lang];
      if (!ed) continue;
      buildEdition(slug, lang, ed, lang === "th" ? "en" : "th", eds, live);
    }
  }

  function buildEdition(slug, lang, ed, other, eds, liveOf) {
    const S = STR[lang], O = STR[other], HUB = S.hub, en = lang === "en";
    const fmtDate = en ? enDate : thaiDate;
    const pre = en ? "en/" : "";
    const { c, cbody, crel } = ed;
    const person = { "@type": "Person", "@id": PERSON_ID, name: en ? "Teerawut Savangboon (Ajarn Mod)" : "ธีรวุฒิ แสวงบุญ (อาจารย์มด)", alternateName: en ? "ธีรวุฒิ แสวงบุญ" : "Teerawut Savangboon", url: SITE + "/about/" };
    const route = `${HUB}${slug}/`, otherRoute = `${O.hub}${slug}/`;
    const parts = asList(c.parts).map((p) => { const [range, title, note] = pipe(p); const [a, b] = range.split("-").map(Number); return { from: a, to: b || a, title, note: note || "" }; });
    const plan = new Map(asList(c.plan).map((p) => { const [no, title, e2] = pipe(p); return [Number(no), { title, en: e2 || "" }]; }));
    const lessons = ed.lessons.map((d) => {
      const updated = d.updated || gitDate(ROOT, d.file, TODAY);
      return { ...d, route: `${route}${d.slug}/`, updated, published: d.published || updated,
        files: asList(d.files).map((x) => fileLink(x, ROOT, d.file)), outcomes: asList(d.outcomes), keywords: asList(d.keywords),
        deeper: asList(d.deeper).map((x) => { const [a, b] = pipe(x); return b ? { label: a, url: b } : { label: "", url: a }; }) };
    });
    const live = lessons.filter((l) => !l.draft);
    const units = live.filter((l) => l.no != null).sort((a, b) => a.no - b.no);
    const extras = live.filter((l) => l.no == null).sort((a, b) => b.published.localeCompare(a.published));
    const updated = [c.updated, ...live.map((l) => l.updated), gitDate(ROOT, `${crel}/course.md`, TODAY)].filter(isDate).sort().pop();
    const course = { ...c, slug, route, units, extras, updated, keywords: asList(c.keywords), lang };
    all[lang].push(course);
    const unitLabel = (l) => (l.no != null ? S.unit(l.no) : S.extra);
    const twinChip = (href) => `<li><a href="${href}" hreflang="${S.twinL}" lang="${S.twinL}">${S.twin} →</a></li>`;

    // ---- lesson pages ----
    for (const l of lessons) {
      const url = SITE + l.route;
      const alt = !l.draft && liveOf[other].has(l.slug) ? `${otherRoute}${l.slug}/` : null;
      const i = units.indexOf(l), prev = i > 0 ? units[i - 1] : null, next = i >= 0 ? units[i + 1] : null;
      const a = (href, d2, label, title) => `<a class="pager-${d2}" href="${href}"><span class="mono">${label}</span><b>${esc(title)}</b></a>`;
      const pager = `<nav class="pager" aria-label="${S.pagerL}">${prev ? a(prev.route, "prev", `← ${unitLabel(prev)}`, prev.title) : a(route, "prev", S.back, c.title)}${next ? a(next.route, "next", `${unitLabel(next)} →`, next.title) : a(route, "next", S.plan, c.title)}</nav>`;
      const h1 = l.h1 || l.title;
      const html = mdToHtml(l.body, l.file, ROOT, S);
      const words = Math.max(1, Math.round(html.replace(/<[^>]+>/g, "").length / 900));
      const body = `<div class="wrap lesson-wrap lesson-layout">
  <aside class="lesson-side"><!--toc--></aside>
  <article class="lesson course-lesson" data-course="${slug}" data-lesson="${l.slug}">
    <header>
      <ol class="crumbs"><li><a href="/">${S.home}</a></li><li><a href="${HUB}">${S.room}</a></li><li><a href="${route}">${esc(c.short || c.title)}</a></li><li>${esc(unitLabel(l))}</li></ol>
      <p class="eyebrow">// ${esc(unitLabel(l))} · ${esc(c.en || c.title)}${l.en ? ` · ${esc(l.en)}` : ""}</p>
      <h1>${esc(h1)}</h1>
      <p class="lede">${esc(l.lede || l.description)}</p>
      <div class="lesson-meta"><span>${S.by}</span><span>${S.upd} <!--updated--></span><span>${S.read(l.time || words * 2)}</span>${alt ? `<span><a href="${alt}" hreflang="${S.twinL}" lang="${S.twinL}">${S.twin} →</a></span>` : ""}</div>
      <div class="c-tools" role="group" aria-label="${S.toolsL}">
        <button type="button" class="c-btn c-done" aria-pressed="false">${S.done}</button>
        <button type="button" class="c-btn c-class" aria-pressed="false" title="${S.clsT}">${S.cls}</button>
        <button type="button" class="c-btn c-print">${S.print}</button>
      </div>
    </header>
${l.youtube ? `    <section class="c-sec" aria-labelledby="video"><h2 id="video">${S.video}</h2>${youtubeFacade(l.youtube, l.video_title || h1, S)}</section>\n` : ""}${l.outcomes.length ? `    <section class="c-sec c-out" aria-labelledby="outcomes"><h2 id="outcomes">${S.out}</h2><ul>${l.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></section>\n` : ""}${l.files.length ? `    <section class="c-sec" aria-labelledby="downloads"><h2 id="downloads">${S.docsU}</h2><p class="c-files">${l.files.map((f) => f.html).join("")}</p></section>\n` : ""}    <div class="c-body">
${html}
    </div>
${l.deeper.length ? `    <aside class="post-box" aria-label="${S.deeper}"><p class="post-box-h">${S.deeper}</p><ul>${l.deeper.map((x) => `<li><a href="${esc(x.url)}">${esc(x.label || x.url)}</a></li>`).join("")}</ul></aside>\n` : ""}    ${shareHtml(url, h1, lang)}
    ${pager}
  </article>
</div>`;
      const ld = [
        {
          "@type": ["Article", "LearningResource"], "@id": url + "#lesson", headline: h1, name: `${c.title} ${unitLabel(l)}: ${l.title}`, description: l.description,
          inLanguage: lang, url, mainEntityOfPage: url, datePublished: l.published, dateModified: l.updated, author: { "@id": PERSON_ID }, publisher: { "@id": PERSON_ID },
          learningResourceType: "Lecture notes", educationalLevel: c.level || "Undergraduate", isAccessibleForFree: true, isPartOf: { "@id": SITE + route + "#course" },
          ...(l.no != null ? { position: l.no } : {}), ...(l.outcomes.length ? { teaches: l.outcomes } : {}), ...(l.keywords.length ? { keywords: l.keywords.join(", ") } : {}),
          ...(alt ? (en ? { translationOfWork: { "@id": SITE + alt + "#lesson" } } : { workTranslation: { "@id": SITE + alt + "#lesson" } }) : {}),
        },
        crumbsLd([[S.home, "/"], [S.room, HUB], [c.short || c.title, route], [`${unitLabel(l)} ${l.title}`, l.route]]),
      ];
      // Google needs name, thumbnail and upload date for a video; without "video_date:" the player is shown but no VideoObject is claimed
      if (l.youtube && l.video_date)
        ld.push({ "@type": "VideoObject", name: l.video_title || h1, description: l.description, thumbnailUrl: [`https://i.ytimg.com/vi/${l.youtube}/hqdefault.jpg`], uploadDate: `${l.video_date}T00:00:00+07:00`,
          embedUrl: `https://www.youtube.com/embed/${l.youtube}`, contentUrl: `https://www.youtube.com/watch?v=${l.youtube}`, inLanguage: "th", ...(l.duration ? { duration: l.duration } : {}) });
      page(`${pre}courses/${slug}/${l.slug}.html`, {
        title: l.seo_title || `${l.title} | ${c.short || c.title} ${unitLabel(l)} · ${S.titleSuffix}`, h1, description: l.description, ogTitle: `${unitLabel(l)}: ${l.title}`,
        nav: "courses", katex: true, updated: l.updated, css: ["/assets/course.css"], scripts: ["/assets/course.js", ...asList(l.scripts)], ogType: "article",
        ...(en ? { lang: "en" } : {}), ...(alt ? { alt } : {}),
        ...(l.draft ? { draft: true } : {}), ...(l.keywords.length ? { keywords: l.keywords } : {}),
        og: { title: l.title, sub: l.description, eyebrow: `${c.en || c.title} · ${unitLabel(l)}`, sym: c.sym || "G(s)" }, jsonld: ld,
      }, body);
    }

    // ---- course hub ----
    const url = SITE + route;
    const hasTwin = !!eds[other];
    const badge = (l) => `${l.youtube ? `<span class="c-bd">${S.bVideo}</span>` : ""}${l.files.length ? `<span class="c-bd">${S.bDocs(l.files.length)}</span>` : ""}`;
    const nos = [...new Set([...plan.keys(), ...units.map((u) => u.no)])].sort((a, b) => a - b);
    const sub = (t) => (t && !en ? `<small lang="en">${esc(t)}</small>` : "");
    const row = (no) => {
      const u = units.find((x) => x.no === no), p = plan.get(no);
      return u
        ? `<li class="c-unit"><a href="${u.route}" data-lesson="${u.slug}"><span class="c-no mono">${String(no).padStart(2, "0")}</span><span class="c-ut"><b>${esc(u.title)}</b>${sub(u.en)}</span><span class="c-bds">${badge(u)}<span class="c-bd c-bd-done" hidden>${S.learned}</span></span></a></li>`
        : `<li class="c-unit c-soon"><span class="c-row"><span class="c-no mono">${String(no).padStart(2, "0")}</span><span class="c-ut"><b>${esc(p.title)}</b>${sub(p.en)}</span><span class="c-bds"><span class="c-bd">${S.soon}</span></span></span></li>`;
    };
    const groups = parts.length ? parts.map((p) => ({ ...p, nos: nos.filter((n) => n >= p.from && n <= p.to) })).filter((p) => p.nos.length) : [{ title: "", nos }];
    const rest = nos.filter((n) => !groups.some((g) => g.nos.includes(n)));
    if (rest.length) groups.push({ title: S.other, nos: rest });
    const syllabus = groups.map((g) => `${g.title ? `<h3 class="c-part">${esc(g.title)}</h3>${g.note ? `<p class="c-part-n">${esc(g.note)}</p>` : ""}` : ""}<ol class="c-units">${g.nos.map(row).join("")}</ol>`).join("\n");
    const cfiles = asList(c.files).map((x) => fileLink(x, ROOT, `${crel}/course.md`));
    const unitFiles = units.filter((u) => u.files.length);
    const docs = `${cfiles.length ? `<p class="c-files">${cfiles.map((f) => f.html).join("")}</p>` : ""}${unitFiles.length ? `<ul class="c-doclist">${unitFiles.map((u) => `<li><a href="${u.route}#downloads"><b>${unitLabel(u)}</b> ${esc(u.title)}</a> — ${u.files.map((f) => `<a href="${esc(f.url)}">${esc(f.label)} <span class="mono">(${f.kind})</span></a>`).join(" · ")}</li>`).join("")}</ul>` : ""}${!cfiles.length && !unitFiles.length ? `<p class="c-empty">${S.empty}</p>` : ""}`;
    const first = units[0];
    const hubBody = `<div class="wrap lesson-wrap">
  <article class="lesson course-hub" data-course="${slug}">
    <header>
      <ol class="crumbs"><li><a href="/">${S.home}</a></li><li><a href="${HUB}">${S.room}</a></li><li>${esc(c.short || c.title)}</li></ol>
      <p class="eyebrow">// ${S.online} · ${esc(c.en || "Course")}</p>
      <h1>${esc(c.h1 || c.title)}</h1>
      <p class="lede">${esc(c.lede || c.description)}</p>
      <ul class="chips"><li>${S.open(units.length, nos.length)}</li>${c.level_th ? `<li>${esc(c.level_th)}</li>` : ""}<li>${S.langChip}</li><li>${S.free}</li><li>${S.upd} <!--updated--></li>${hasTwin ? twinChip(otherRoute) : ""}</ul>
      <p class="c-cta">${first ? `<a class="btn btn-primary" href="${first.route}">${S.start(en ? unitLabel(first) : unitLabel(first))}</a>` : ""}${c.playlist ? `<a class="btn btn-ghost" href="https://www.youtube.com/playlist?list=${esc(c.playlist)}" target="_blank" rel="noopener">${S.pl}</a>` : ""}<a class="btn btn-ghost" href="#documents">${S.docsBtn}</a></p>
      <div class="c-prog" hidden><div class="c-prog-bar"><i></i></div><p class="mono"><span class="c-prog-t"></span> <button type="button" class="c-prog-reset">${S.reset}</button></p></div>
    </header>
    <section class="c-sec" aria-labelledby="syllabus">
      <h2 id="syllabus">${S.syl}</h2>
      ${syllabus}
    </section>
    <section class="c-sec" aria-labelledby="documents">
      <h2 id="documents">${S.docs}</h2>
      ${docs}
    </section>
${extras.length ? `    <section class="c-sec" aria-labelledby="extras"><h2 id="extras">${S.extras}</h2><ul class="c-doclist">${extras.map((x) => `<li><a href="${x.route}"><b>${esc(x.title)}</b></a> <span class="mono">${fmtDate(x.published)}</span><br>${esc(x.description)}</li>`).join("")}</ul></section>\n` : ""}    <div class="c-body">
${mdToHtml(cbody, `${crel}/course.md`, ROOT, S)}
    </div>
${c.playlist ? `    <section class="lesson-video" aria-labelledby="playlist"><h2 id="playlist">${S.cVideo}</h2><div class="screen" data-yt-list="${esc(c.playlist)}" data-yt-title="${esc(c.en || c.title)}"><div class="facade"><div class="f-eq">${esc(c.sym || "G(s)")}</div><div><h3>${esc(c.en || c.title)}</h3><p>${esc(c.title)} · ${S.plOn}</p></div><button class="play" type="button"><i></i>${S.playPl}</button></div></div><p class="below-screen mono"><span>${S.taught}</span><a href="https://www.youtube.com/playlist?list=${esc(c.playlist)}" target="_blank" rel="noopener">${S.openYt}</a></p></section>\n` : ""}    ${shareHtml(url, c.h1 || c.title, lang)}
  </article>
</div>`;
    page(`${pre}courses/${slug}/index.html`, {
      title: c.seo_title || `${c.title} | ${S.hubSuffix}`, h1: c.h1 || c.title, description: c.description, ogTitle: c.title, nav: "courses", katex: true, updated,
      css: ["/assets/course.css"], scripts: ["/assets/course.js"], ...(course.keywords.length ? { keywords: course.keywords } : {}),
      ...(en ? { lang: "en" } : {}), ...(hasTwin ? { alt: otherRoute } : {}),
      og: { title: c.title, sub: c.description, eyebrow: `${S.online} · ${c.en || ""}`, sym: c.sym || "G(s)" },
      jsonld: [
        {
          "@type": "Course", "@id": url + "#course", name: c.title, ...(c.en ? { alternateName: c.en } : {}), description: c.description, url, inLanguage: lang, provider,
          isAccessibleForFree: true, educationalLevel: c.level || "Undergraduate", ...(course.keywords.length ? { keywords: course.keywords.join(", ") } : {}),
          ...(asList(c.about).length ? { about: asList(c.about) } : {}), dateModified: updated,
          offers: { "@type": "Offer", category: "Free", price: 0, priceCurrency: "THB", availability: "https://schema.org/InStock", url },
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", ...(c.workload ? { courseWorkload: c.workload } : {}), instructor: person, inLanguage: lang },
          ...(groups.some((g) => g.title) ? { syllabusSections: groups.filter((g) => g.title).map((g) => ({ "@type": "Syllabus", name: g.title, description: g.nos.map((n) => (units.find((u) => u.no === n) || plan.get(n)).title).join(" · ") })) } : {}),
          ...(units.length ? { hasPart: units.map((u) => ({ "@id": SITE + u.route + "#lesson" })) } : {}),
        },
        { "@type": "ItemList", name: S.units(c.title), numberOfItems: units.length, itemListElement: units.map((u, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + u.route, name: `${unitLabel(u)} ${u.title}` })) },
        crumbsLd([[S.home, "/"], [S.room, HUB], [c.short || c.title, route]]),
      ],
    }, hubBody);
  }

  // ---- /courses/ and /en/courses/ : every course of the edition ----
  for (const lang of ["th", "en"]) {
    const courses = all[lang], S = STR[lang], HUB = S.hub, en = lang === "en", other = en ? "th" : "en";
    if (!courses.length) continue;
    const fmtDate = en ? enDate : thaiDate;
    const updated = courses.map((c) => c.updated).sort().pop();
    const hasTwin = all[other].length > 0;
    page(`${en ? "en/" : ""}courses/index.html`, {
      title: S.allTitle, h1: S.allH1, description: S.allDesc, ogTitle: S.allOg, nav: "courses", updated,
      css: ["/assets/course.css"], scripts: ["/assets/course.js"], keywords: [...S.allKw, ...courses.map((c) => c.title)],
      ...(en ? { lang: "en" } : {}), ...(hasTwin ? { alt: STR[other].hub } : {}),
      og: { title: S.allH1, sub: S.allDesc, eyebrow: "Courses · Mod's Engineering Mathematics", sym: "∿" },
      jsonld: [
        { "@type": "CollectionPage", "@id": SITE + HUB + "#collection", url: SITE + HUB, name: S.allOg, description: S.allDesc, inLanguage: lang, publisher: { "@id": PERSON_ID },
          mainEntity: { "@type": "ItemList", numberOfItems: courses.length, itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + c.route, name: c.title })) } },
        crumbsLd([[S.home, "/"], [S.room, HUB]]),
      ],
    }, `<div class="wrap lesson-wrap">
  <article class="lesson course-hub">
    <header>
      <ol class="crumbs"><li><a href="/">${S.home}</a></li><li>${S.room}</li></ol>
      <p class="eyebrow">${S.allEyebrow}</p>
      <h1>${S.allH1}</h1>
      <p class="lede">${S.allLede}</p>
    </header>
    <section class="c-sec" aria-labelledby="all-courses">
      <h2 id="all-courses">${S.allOpen}</h2>
      <div class="c-cards">${courses.map((c) => `<a class="c-card" href="${c.route}"><span class="c-card-sym" aria-hidden="true">${esc(c.sym || "∿")}</span><b>${esc(c.title)}</b>${c.en && !en ? `<small lang="en">${esc(c.en)}</small>` : ""}<span>${esc(c.description)}</span><span class="mono">${S.card(c.units.length, fmtDate(c.updated))}</span></a>`).join("")}</div>
    </section>
    ${shareHtml(SITE + HUB, S.allOg, lang)}
  </article>
</div>`);
  }
  return { pages, courses: all.th, coursesEn: all.en };
}
