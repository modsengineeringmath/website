// Checks the built /blog/ pages: SEO basics, JSON-LD, math rendering, internal links, and reverse links from lessons.
// Usage: node build.mjs && node scripts/test-blog.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://modsengineeringmath.com";
let fails = 0;
const bad = (m) => { fails++; console.log("  ✗ " + m); };

const exists = (href) => {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return true;
  const p = path.join(ROOT, clean);
  return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, "index.html")));
};
// redirects count as valid targets
const redirects = new Set(fs.readFileSync(path.join(ROOT, "_redirects"), "utf8").split("\n").map((l) => l.trim().split(/\s+/)[0]).filter((x) => x && !x.startsWith("#")));

const dirs = fs.readdirSync(path.join(ROOT, "blog"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
console.log(`${dirs.length} posts`);
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const llms = fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8");
const titles = new Set(), descs = new Set();

for (const slug of dirs) {
  const file = path.join(ROOT, "blog", slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const url = `${SITE}/blog/${slug}/`;
  console.log(slug);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  if (!title) bad("no <title>");
  if ([...title].length > 100) bad(`title long (${[...title].length} chars)`);
  if (titles.has(title)) bad("duplicate title"); titles.add(title);
  if ([...desc].length < 70 || [...desc].length > 200) bad(`description length ${[...desc].length}`);
  if (descs.has(desc)) bad("duplicate description"); descs.add(desc);
  if ((html.match(/<h1[ >]/g) || []).length !== 1) bad("h1 count != 1");
  if (!html.includes(`<link rel="canonical" href="${url}">`)) bad("canonical");
  if (!sitemap.includes(`<loc>${url}</loc>`)) bad("not in sitemap");
  if (!llms.includes(url)) bad("not in llms.txt");
  if (/katex-error/.test(html)) bad("KaTeX error");
  const body = html.slice(html.indexOf('<main'), html.indexOf("</main>"));
  if (/\\\(|\\\[|\\\)|\\\]/.test(body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<annotation[\s\S]*?<\/annotation>/g, ""))) bad("unrendered math delimiters");
  if (/<!--(toc|faq|pager|updated)-->/.test(html)) bad("unreplaced marker");
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) bad("no JSON-LD");
  for (const m of ld) {
    try {
      const g = JSON.parse(m[1])["@graph"].map((x) => x["@type"]);
      for (const t of ["BlogPosting", "BreadcrumbList", "FAQPage"]) if (!g.includes(t)) bad("JSON-LD missing " + t);
    } catch (e) { bad("JSON-LD parse: " + e.message); }
  }
  const main = html.slice(html.indexOf('<article'), html.indexOf("</article>"));
  const hrefs = [...main.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  const lessonLinks = hrefs.filter((h) => h.startsWith("/learn/")).length;
  if (lessonLinks < 3) bad(`only ${lessonLinks} links into /learn/`);
  for (const h of new Set(hrefs)) if (!exists(h) && !redirects.has(h.split("#")[0])) bad("broken link " + h);
  const words = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").length;
  console.log(`  ok · ${lessonLinks} lesson links · ${words} chars of text`);
}

// hub + reverse links
const hub = fs.readFileSync(path.join(ROOT, "blog/index.html"), "utf8");
for (const slug of dirs) if (!hub.includes(`href="/blog/${slug}/"`)) bad(`hub missing ${slug}`);
for (const [page, slug] of [["learn/laplace-transform/index.html", "what-is-laplace-transform"], ["learn/power-factor/pf-basics/index.html", "power-factor-explained"], ["learn/vector-algebra/dot-product/index.html", "dot-product-cross-product"], ["learn/control-systems/pid/index.html", "what-is-pid-controller"], ["learn/linear-algebra/inverse/index.html", "determinant-and-inverse-matrix"]]) {
  if (!fs.readFileSync(path.join(ROOT, page), "utf8").includes(`href="/blog/${slug}/"`)) bad(`${page} has no link back to ${slug}`);
}
if (!fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes('href="/blog/"')) bad("home has no link to /blog/");
console.log(fails ? `\n${fails} problem(s)` : "\nall checks passed");
process.exit(fails ? 1 : 0);
