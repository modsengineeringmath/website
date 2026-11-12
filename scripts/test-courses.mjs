// Checks the generated course pages (/courses/…). Run after `node build.mjs`:  node scripts/test-courses.mjs
import fs from "node:fs";
import path from "node:path";
let fails = 0;
const bad = (m) => { fails++; console.error("✗ " + m); };
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");
const sitemap = read("sitemap.xml"), llms = read("llms.txt"), redirects = read("_redirects");
if (/^\/courses\/?\s/m.test(redirects)) bad("_redirects still redirects /courses away (it would hide the hub)");
const dir = "content/courses";
let n = 0;
// Thai edition: content/courses/<c>/*.md → /courses/<c>/…   English edition: content/courses/<c>/en/*.md → /en/courses/<c>/…
const slugOf = (f) => f.replace(/^\d+[-_.]/, "").replace(/\.md$/, "");
const liveSlugs = (d) => (fs.existsSync(path.join(d, "course.md")) ? fs.readdirSync(d).filter((f) => f.endsWith(".md") && f !== "course.md" && !f.startsWith("_") && !/^draft:\s*true\s*$/m.test(read(path.join(d, f)).split(/^---\s*$/m)[1] || "")).map(slugOf) : null);
for (const c of fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "course.md")))) for (const lang of ["th", "en"]) {
  const sdir = lang === "en" ? path.join(dir, c, "en") : path.join(dir, c);
  if (!fs.existsSync(path.join(sdir, "course.md"))) continue;
  const pre = lang === "en" ? "/en" : "", opre = lang === "en" ? "" : "/en";
  const twins = liveSlugs(lang === "en" ? path.join(dir, c) : path.join(dir, c, "en"));
  const srcs = fs.readdirSync(sdir).filter((f) => f.endsWith(".md") && f !== "course.md" && !f.startsWith("_"));
  const routes = [`${pre}/courses/${c}/`];
  for (const f of srcs) {
    const draft = /^draft:\s*true\s*$/m.test(read(path.join(sdir, f)).split(/^---\s*$/m)[1] || "");
    const slug = slugOf(f);
    if (!draft) routes.push(`${pre}/courses/${c}/${slug}/`);
    else if (sitemap.includes(`${pre}/courses/${c}/${slug}/<`)) bad(`${f}: draft is in the sitemap`);
  }
  const hub = read(`.${pre}/courses/${c}/index.html`);
  for (const r of routes) {
    n++;
    const html = read(path.join("." + r, "index.html"));
    if (!html) { bad(`${r}: page not built`); continue; }
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    if (!new RegExp(`<html[^>]* lang="${lang}"`).test(html)) bad(`${r}: <html lang> should be ${lang}`);
    const slug = r === routes[0] ? "" : r.split("/").slice(-2)[0];
    if (twins && (slug === "" || twins.includes(slug))) {
      const tw = `https://modsengineeringmath.com${opre}/courses/${c}/${slug ? slug + "/" : ""}`;
      if (!html.includes(`hreflang="${lang === "en" ? "th" : "en"}" href="${tw}"`)) bad(`${r}: hreflang link to the ${lang === "en" ? "Thai" : "English"} edition is missing`);
    }
    if (lang === "en") {
      const thai = main.replace(/<annotation[\s\S]*?<\/annotation>/g, "").replace(/<a [^>]*lang="th"[^>]*>[\s\S]*?<\/a>/g, "").replace(/<[^>]+>/g, "").match(/.{0,20}[\u0E00-\u0E7F]+.{0,20}/);
      if (thai) bad(`${r}: Thai text in the English edition (${thai[0].trim()})`);
    }
    if ((main.match(/<h1[ >]/g) || []).length !== 1) bad(`${r}: needs exactly one h1`);
    if (!html.includes(`<link rel="canonical" href="https://modsengineeringmath.com${r}">`)) bad(`${r}: canonical`);
    if (/<meta name="robots" content="noindex">/.test(html)) bad(`${r}: noindex on a published page`);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    if (desc.length < 50) bad(`${r}: description is too short (${desc.length})`);
    if (desc.length > (lang === "en" ? 300 : 260)) console.warn(`! ${r}: description is long (${desc.length} characters; Google shows about 160)`);
    const text = main.replace(/<annotation[\s\S]*?<\/annotation>/g, "").replace(/<pre[\s\S]*?<\/pre>/g, "").replace(/<[^>]+>/g, "");
    if (/\$\$|\*\*|:::|[\u0002-\u0005]|\{#/.test(text)) bad(`${r}: Markdown or math markup left unrendered (${(text.match(/.{0,30}(\$\$|\*\*|:::|\{#).{0,30}/) || [""])[0].trim()})`);
    if (/(^|[\s(])\$[^$\n]{1,60}\$/.test(text)) bad(`${r}: inline math left unrendered (${(text.match(/.{0,20}\$[^$\n]{1,60}\$.{0,10}/) || [""])[0].trim()})`);
    if (/katex-error/.test(main)) bad(`${r}: KaTeX error`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { bad(`${r}: JSON-LD does not parse`); } }
    const types = [...html.matchAll(/"@type":"?\[?"?([\w",]+)/g)].map((m) => m[1]).join(" ");
    if (r === routes[0] ? !/Course/.test(types) : !/LearningResource/.test(types)) bad(`${r}: structured data missing`);
    if (!/BreadcrumbList/.test(types)) bad(`${r}: BreadcrumbList missing`);
    if (!sitemap.includes(`<loc>https://modsengineeringmath.com${r}</loc>`)) bad(`${r}: not in sitemap.xml`);
    if (!llms.includes(`https://modsengineeringmath.com${r})`)) bad(`${r}: not in llms.txt`);
    if (!fs.existsSync(path.join("." + r, "index.html.md"))) bad(`${r}: Markdown copy missing`);
    if (r !== routes[0] && !hub.includes(`href="${r}"`)) bad(`${r}: not linked from the course hub`);
    for (const m of main.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const p = decodeURI(m[1]);
      if (!fs.existsSync("." + p) && !fs.existsSync(path.join("." + p, "index.html")) && !new RegExp("^" + p.replace(/\/$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s", "m").test(redirects)) bad(`${r}: broken link ${p}`);
    }
  }
}
if (fs.existsSync("content/courses/control-engineering/en/course.md") && !read("en/courses/index.html")) bad("/en/courses/ not built");
if (!read("courses/index.html")) bad("/courses/ not built");
console.log(fails ? `${fails} problem(s)` : `courses OK (${n} pages)`);
process.exit(fails ? 1 : 0);
