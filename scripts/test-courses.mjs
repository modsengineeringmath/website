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
for (const c of fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "course.md")))) {
  const srcs = fs.readdirSync(path.join(dir, c)).filter((f) => f.endsWith(".md") && f !== "course.md" && !f.startsWith("_"));
  const routes = [`/courses/${c}/`];
  for (const f of srcs) {
    const draft = /^draft:\s*true\s*$/m.test(read(path.join(dir, c, f)).split(/^---\s*$/m)[1] || "");
    const slug = f.replace(/^\d+[-_.]/, "").replace(/\.md$/, "");
    if (!draft) routes.push(`/courses/${c}/${slug}/`);
    else if (sitemap.includes(`/courses/${c}/${slug}/<`)) bad(`${f}: draft is in the sitemap`);
  }
  const hub = read(`courses/${c}/index.html`);
  for (const r of routes) {
    n++;
    const html = read(path.join("." + r, "index.html"));
    if (!html) { bad(`${r}: page not built`); continue; }
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    if ((main.match(/<h1[ >]/g) || []).length !== 1) bad(`${r}: needs exactly one h1`);
    if (!html.includes(`<link rel="canonical" href="https://modsengineeringmath.com${r}">`)) bad(`${r}: canonical`);
    if (/<meta name="robots" content="noindex">/.test(html)) bad(`${r}: noindex on a published page`);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    if (desc.length < 50) bad(`${r}: description is too short (${desc.length})`);
    if (desc.length > 220) console.warn(`! ${r}: description is long (${desc.length} characters; Google shows about 160)`);
    const text = main.replace(/<annotation[\s\S]*?<\/annotation>/g, "").replace(/<[^>]+>/g, "");
    if (/\$\$|\*\*|:::|[\u0002-\u0005]|\{#/.test(text)) bad(`${r}: Markdown or math markup left unrendered (${(text.match(/.{0,30}(\$\$|\*\*|:::|\{#).{0,30}/) || [""])[0].trim()})`);
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
if (!read("courses/index.html")) bad("/courses/ not built");
console.log(fails ? `${fails} problem(s)` : `courses OK (${n} pages)`);
process.exit(fails ? 1 : 0);
