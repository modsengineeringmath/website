// Checks the built /solutions/ pages: SEO basics, share images, JSON-LD, math rendering, internal links,
// hub listing, reverse links from lessons and short links.
// Usage: node build.mjs && node scripts/test-solutions.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://modsengineeringmath.com";
let fails = 0;
const bad = (m) => { fails++; console.log("  ✗ " + m); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const redirects = new Map(read("_redirects").split("\n").map((l) => l.trim().split(/\s+/)).filter((x) => x[0] && !x[0].startsWith("#")).map((x) => [x[0], x[1]]));
const exists = (href) => {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return true;
  if (redirects.has(clean)) return true;
  const p = path.join(ROOT, clean);
  return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, "index.html")));
};
// JPEG size from the SOF marker
const jpegSize = (file) => {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length;) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return null;
};

const sitemap = read("sitemap.xml"), llms = read("llms.txt"), hub = read("solutions/index.html");
const search = JSON.parse(read("search-index.json"));
const srcDir = path.join(ROOT, "src/pages/solutions");
const sources = fs.readdirSync(srcDir).filter((f) => f.endsWith(".html") && f !== "index.html")
  .map((f) => ({ slug: f.replace(/\.html$/, ""), meta: JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8").match(/^<!--meta\s*([\s\S]*?)-->/)[1]) }))
  .filter((s) => !s.meta.draft);
console.log(`== ${sources.length} solution page(s)`);
const titles = new Set(), descs = new Set();

for (const { slug, meta } of sources) {
  console.log(slug);
  const route = `/solutions/${slug}/`, url = SITE + route;
  const html = read(`solutions/${slug}/index.html`);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  if (!title || [...title].length > 100) bad(`title length ${[...title].length}`);
  if (titles.has(title)) bad("duplicate title"); titles.add(title);
  if ([...desc].length < 70 || [...desc].length > 200) bad(`description length ${[...desc].length} (keep 70–200)`);
  if (descs.has(desc)) bad("duplicate description"); descs.add(desc);
  if ((html.match(/<h1[ >]/g) || []).length !== 1) bad("h1 count != 1");
  if (!html.includes(`<link rel="canonical" href="${url}">`)) bad("canonical");
  if (!html.includes(`<meta property="og:url" content="${url}">`)) bad("og:url");
  if (!html.includes('<meta property="og:type" content="article">')) bad("og:type");
  if (!html.includes('<meta name="twitter:card" content="summary_large_image">')) bad("twitter card");
  const ogTitle = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || "";
  if ([...ogTitle].length > 90) bad(`og:title long (${[...ogTitle].length}) — Facebook/LINE cut it`);
  // share images: 1200×630 link preview and 1080×1350 post card, both rendered by scripts/og.py
  const og = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || "";
  const ogFile = path.join(ROOT, og.replace(SITE, "").split("?")[0]);
  if (!og.includes(`/images/og/solutions-${slug}.jpg?v=`)) bad(`og:image is not the solution card (${og}) — run python3 scripts/og.py --prefix solutions- && node build.mjs`);
  else if (String(jpegSize(ogFile)) !== "1200,630") bad("og image is not 1200×630");
  const post = path.join(ROOT, `images/solutions/${slug}.jpg`);
  if (!fs.existsSync(post)) bad("no post image images/solutions/<slug>.jpg");
  else if (String(jpegSize(post)) !== "1080,1350") bad("post image is not 1080×1350");
  // JSON-LD
  const ld = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  try {
    const g = JSON.parse(ld)["@graph"];
    const art = g.find((x) => [].concat(x["@type"]).includes("LearningResource"));
    if (!art || !art.datePublished || !art.image?.length) bad("Article/LearningResource JSON-LD incomplete");
    if (!g.some((x) => x["@type"] === "BreadcrumbList")) bad("no BreadcrumbList");
    if (meta.faq?.length && !g.some((x) => x["@type"] === "FAQPage")) bad("no FAQPage");
  } catch (e) { bad("JSON-LD does not parse: " + e.message); }
  // content
  if (html.includes("katex-error")) bad("KaTeX error in page");
  if (!html.includes('id="problem"') || !html.includes('class="sp-ans"')) bad("problem box missing (<!--solution-head-->)");
  if (!/<div class="wx"[\s\S]*?<ol class="steps">/.test(html)) bad("no worked example (.wx with ol.steps)");
  if (!html.includes('id="solution"')) bad('no <h2 id="solution"> (the "ไปที่วิธีทำ" button links to it)');
  if (!html.includes("/assets/lesson.js")) bad("lesson.js not loaded");
  for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) if (!href.startsWith("//") && !exists(href)) bad(`broken link ${href}`);
  const learnLinks = new Set([...html.matchAll(/href="(\/learn\/[^"#]*)/g)].map((m) => m[1]));
  if (learnLinks.size < 2) bad("fewer than 2 links into /learn/");
  // listings
  if (!sitemap.includes(`<loc>${url}</loc>`)) bad("not in sitemap");
  if (!llms.includes(url)) bad("not in llms.txt");
  if (!search.some((e) => e.u === route)) bad("not in search-index.json");
  if (!hub.includes(`href="${route}"`)) bad("not listed on /solutions/");
  if (meta.short && redirects.get(`/s/${meta.short}`) !== route) bad(`short link /s/${meta.short} missing in _redirects`);
  for (const s of [].concat(meta.series || [])) {
    const lesson = path.join(ROOT, "learn", s, "index.html");
    if (!fs.existsSync(lesson)) bad(`series "${s}" is not a lesson`);
    else if (!fs.readFileSync(lesson, "utf8").includes(`href="${route}"`)) bad(`no reverse link on /learn/${s}/`);
  }
}
if (!sitemap.includes(`<loc>${SITE}/solutions/</loc>`)) bad("hub not in sitemap");
console.log(fails ? `\n${fails} problem(s)` : "\nall solution checks passed");
process.exit(fails ? 1 : 0);
