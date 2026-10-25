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

// "category" holds the generated category pages (/blog/category/<key>/), checked separately below
const postDirs = (base) => fs.readdirSync(path.join(ROOT, base), { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "category").map((d) => d.name);
const thDirs = postDirs("blog"), enDirs = postDirs("en/blog");
// every Thai post has an English twin of the same slug and vice versa
for (const slug of thDirs) if (!enDirs.includes(slug)) bad(`${slug}: no English edition`);
for (const slug of enDirs) if (!thDirs.includes(slug)) bad(`${slug}: English edition without a Thai original`);
const thai = /[\u0E00-\u0E7F]/;
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const llms = fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8");
for (const [lang, base, dirs] of [["th", "blog", thDirs], ["en", "en/blog", enDirs]]) {
console.log(`\n== ${lang}: ${dirs.length} posts`);
const titles = new Set(), descs = new Set();

for (const slug of dirs) {
  const file = path.join(ROOT, base, slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const url = `${SITE}/${base}/${slug}/`;
  const twinUrl = `${SITE}/${lang === "th" ? "en/blog" : "blog"}/${slug}/`;
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
  // language pair: html lang, og:locale, canonical, reciprocal hreflang, visible TH/EN switch
  if (!html.includes(`<html lang="${lang}">`)) bad("html lang");
  if (!html.includes(`<meta property="og:locale" content="${lang === "en" ? "en_US" : "th_TH"}">`)) bad("og:locale");
  if (!html.includes(`<meta property="og:url" content="${url}">`)) bad("og:url");
  for (const [h, u] of [[lang, url], [lang === "th" ? "en" : "th", twinUrl], ["x-default", `${SITE}/blog/${slug}/`]])
    if (!html.includes(`<link rel="alternate" hreflang="${h}" href="${u}">`)) bad(`hreflang ${h}`);
  if (!html.includes(`class="lang-sw"`) || !html.includes(`href="${twinUrl.replace(SITE, "")}" hreflang="${lang === "th" ? "en" : "th"}"`)) bad("language switch");
  if (!sitemap.includes(`<loc>${twinUrl}</loc>`)) bad("twin not in sitemap");
  // meta keywords + Open Graph twin locale + twitter card
  if (!/<meta name="keywords" content="[^"]{10,}">/.test(html)) bad("meta keywords");
  if (!html.includes(`<meta property="og:locale:alternate" content="${lang === "en" ? "th_TH" : "en_US"}">`)) bad("og:locale:alternate");
  for (const t of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) if (!html.includes(`<meta name="${t}"`)) bad(t);
  if (lang === "en") {
    const head = html.slice(0, html.indexOf("</head>"));
    if (thai.test(head.replace(/<link rel="alternate" type="application\/rss\+xml"[^>]*>/, "").replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ""))) bad("Thai text in <head> of an English page");
    const art = html.slice(html.indexOf("<article"), html.indexOf("</article>")).replace(/<small>ภาษาไทย<\/small>/, "");
    if (thai.test(art)) bad("Thai text in the article body");
    if (!html.includes(`<meta property="og:image" content="${SITE}/images/og/en-blog-${slug}.jpg">`)) bad("own og:image");
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) if (thai.test(m[1])) bad("Thai text in JSON-LD");
  } else if (!html.includes(`/images/og/blog-${slug}.jpg`)) bad("own og:image");
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
  const hrefs = [...main.replace(/<nav class="lang-sw"[\s\S]*?<\/nav>/, "").matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  const lessonLinks = hrefs.filter((h) => h.startsWith("/learn/")).length;
  const twinCheck = lang === "en" ? hrefs.filter((h) => h.startsWith("/blog/")) : [];
  if (twinCheck.length) bad("English post links to a Thai article: " + twinCheck[0]);
  if (lessonLinks < 3) bad(`only ${lessonLinks} links into /learn/`);
  // category: breadcrumb link (visible + JSON-LD), articleSection, link under "more articles", listed on the category page
  const catHref = (main.match(/<ol class="crumbs">[\s\S]*?<\/ol>/)?.[0].match(/href="(\/(?:en\/)?blog\/category\/[a-z0-9-]+\/)"/) || [])[1];
  if (!catHref) bad("no category in the breadcrumbs");
  else {
    if (!catHref.startsWith(`/${base}/category/`)) bad("category link in the other language: " + catHref);
    if (!exists(catHref)) bad("category page missing: " + catHref);
    else if (!fs.readFileSync(path.join(ROOT, catHref, "index.html"), "utf8").includes(`href="/${base}/${slug}/"`)) bad("not listed on its category page " + catHref);
    if (!html.includes(`"item":"${SITE}${catHref}"`)) bad("category missing from BreadcrumbList");
    if (!/"articleSection":"[^"]+"/.test(html)) bad("no articleSection");
    if (!html.includes(`<p class="post-cat-link"><a href="${catHref}">`)) bad("no category link under more articles");
  }
  for (const h of new Set(hrefs)) if (!exists(h) && !redirects.has(h.split("#")[0])) bad("broken link " + h);
  const words = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").length;
  console.log(`  ok · ${lessonLinks} lesson links · ${words} chars of text`);
}

}

// hubs + reverse links
for (const [lang, base, dirs] of [["th", "blog", thDirs], ["en", "en/blog", enDirs]]) {
  const hub = fs.readFileSync(path.join(ROOT, base, "index.html"), "utf8");
  for (const slug of dirs) if (!hub.includes(`href="/${base}/${slug}/"`)) bad(`${lang} hub missing ${slug}`);
  const twinHub = `${SITE}/${lang === "th" ? "en/blog" : "blog"}/`;
  if (!hub.includes(`<link rel="alternate" hreflang="${lang === "th" ? "en" : "th"}" href="${twinHub}">`)) bad(`${lang} hub hreflang`);
  if (!hub.includes(`<link rel="canonical" href="${SITE}/${base}/">`)) bad(`${lang} hub canonical`);
  if (!sitemap.includes(`<loc>${SITE}/${base}/</loc>`)) bad(`${lang} hub not in sitemap`);
}
// category pages: TH ⇄ EN pairs, canonical, sitemap, JSON-LD, chips on the hubs, every post of the category listed
for (const [lang, base] of [["th", "blog"], ["en", "en/blog"]]) {
  const other = lang === "th" ? "en/blog" : "blog";
  const dir = path.join(ROOT, base, "category");
  const cats = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  console.log(`\n== ${lang}: ${cats.length} category pages`);
  if (cats.length < 2) bad(`${lang}: expected category pages under /${base}/category/`);
  const hub = fs.readFileSync(path.join(ROOT, base, "index.html"), "utf8");
  for (const key of cats) {
    const route = `/${base}/category/${key}/`, url = SITE + route;
    const html = fs.readFileSync(path.join(dir, key, "index.html"), "utf8");
    console.log(key);
    if (!html.includes(`<link rel="canonical" href="${url}">`)) bad(`${route} canonical`);
    if (!html.includes(`<html lang="${lang}">`)) bad(`${route} html lang`);
    if (!html.includes(`<link rel="alternate" hreflang="${lang === "th" ? "en" : "th"}" href="${SITE}/${other}/category/${key}/">`)) bad(`${route} hreflang twin`);
    if (!html.includes('class="lang-sw"')) bad(`${route} language switch`);
    if (!sitemap.includes(`<loc>${url}</loc>`)) bad(`${route} not in sitemap`);
    if (!llms.includes(url)) bad(`${route} not in llms.txt`);
    if ((html.match(/<h1[ >]/g) || []).length !== 1) bad(`${route} h1 count != 1`);
    if (!/"@type":"CollectionPage"/.test(html) || !/"@type":"BreadcrumbList"/.test(html)) bad(`${route} JSON-LD`);
    if (!hub.includes(`href="${route}"`)) bad(`${lang} hub has no link to ${route}`);
    if (lang === "en" && thai.test(html.slice(html.indexOf("<main"), html.indexOf("</main>")).replace(/<small>ภาษาไทย<\/small>/, ""))) bad(`${route} Thai text on an English category page`);
    const listed = [...html.matchAll(/<a class="blog-card" href="([^"]+)"/g)].map((m) => m[1]);
    if (!listed.length) bad(`${route} lists no articles`);
    for (const h of listed) {
      const post = fs.readFileSync(path.join(ROOT, h, "index.html"), "utf8");
      if (!post.includes(`<li><a href="${route}">`)) bad(`${h} listed on ${route} but its breadcrumbs point elsewhere`);
    }
  }
}
for (const [page, slug] of [["learn/dc-circuits/index.html", "learn-programming-ai-era-python"], ["learn/plc/iec-languages/index.html", "learn-programming-ai-era-python"], ["learn/laplace-transform/index.html", "what-is-laplace-transform"], ["learn/power-factor/pf-basics/index.html", "power-factor-explained"], ["learn/vector-algebra/dot-product/index.html", "dot-product-cross-product"], ["learn/control-systems/pid/index.html", "what-is-pid-controller"], ["learn/control-systems/pid-tuning/index.html", "pid-tuning-guide"], ["learn/control-systems/pid/index.html", "pid-tuning-guide"], ["learn/linear-algebra/inverse/index.html", "determinant-and-inverse-matrix"]]) {
  if (!fs.readFileSync(path.join(ROOT, page), "utf8").includes(`href="/blog/${slug}/"`)) bad(`${page} has no link back to ${slug}`);
}
if (!fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes('href="/blog/"')) bad("home has no link to /blog/");
console.log(fails ? `\n${fails} problem(s)` : "\nall checks passed");
process.exit(fails ? 1 : 0);
