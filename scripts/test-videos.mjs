// Checks the video watch pages against Google's video indexing rules (run after `node build.mjs`):
//   node scripts/test-videos.mjs
// One video per watch page, a real <iframe> in the HTML (no click needed) before the body text, a VideoObject with
// name/description/thumbnailUrl/uploadDate/embedUrl, the same thumbnail and title in video-sitemap.xml, no noindex,
// a canonical to itself, listed in sitemap.xml, robots.txt and the hub, and linked from every page in "pages".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://modsengineeringmath.com";
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log("  ✗ " + msg); } };

const srcDir = path.join(ROOT, "src/pages/videos");
const slugs = fs.readdirSync(srcDir).filter((f) => f.endsWith(".html") && f !== "index.html").map((f) => f.replace(/\.html$/, ""));
const vsm = read("video-sitemap.xml");
const sm = read("sitemap.xml");
const hub = read("videos/index.html");
ok(/^Sitemap: https:\/\/modsengineeringmath\.com\/video-sitemap\.xml$/m.test(read("robots.txt")), "robots.txt lists video-sitemap.xml");
ok(sm.includes(`<loc>${SITE}/videos/</loc>`), "hub in sitemap.xml");
ok(/"@type":"CollectionPage"/.test(hub) && !/<iframe/.test(hub), "hub has CollectionPage and no player");

for (const slug of slugs) {
  const meta = JSON.parse(read(`src/pages/videos/${slug}.html`).match(/^<!--meta\s*([\s\S]*?)-->/)[1]);
  if (meta.draft) continue;
  const v = meta.video, url = `${SITE}/videos/${slug}/`;
  console.log(`/videos/${slug}/`);
  const h = read(`videos/${slug}/index.html`);
  const iframes = h.match(/<iframe[^>]*>/g) || [];
  ok(iframes.length === 1, `exactly one iframe (found ${iframes.length})`);
  ok(iframes[0]?.includes(`/embed/${v.id}`), "iframe plays this video id");
  ok(!/loading="lazy"/.test(iframes[0] || "") && !/data-yt-id/.test(h), "player loads with the page (no lazy/facade)");
  ok(h.indexOf("<iframe") < h.indexOf('class="lede"') && h.indexOf("<h1") < h.indexOf("<iframe"), "player sits right under the h1, before the text");
  ok(!/name="robots" content="[^"]*noindex/.test(h), "not noindex");
  ok(h.includes(`<link rel="canonical" href="${url}">`), "canonical to itself");
  ok((h.match(/<h1/g) || []).length === 1, "one h1");
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1])["@graph"] || []);
  const vos = ld.filter((n) => n["@type"] === "VideoObject");
  ok(vos.length === 1, `one VideoObject (found ${vos.length})`);
  const vo = vos[0] || {};
  for (const k of ["name", "description", "thumbnailUrl", "uploadDate", "embedUrl"]) ok(vo[k], `VideoObject.${k}`);
  ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(vo.uploadDate || ""), "uploadDate has a time zone");
  ok(vo.embedUrl === `https://www.youtube.com/embed/${v.id}`, "embedUrl matches the id");
  const thumb = [].concat(vo.thumbnailUrl)[0];
  ok(ld.some((n) => n["@type"] === "WebPage" && n.mainEntity?.["@id"] === vo["@id"]), "WebPage.mainEntity is the video");
  ok(ld.some((n) => n["@type"] === "BreadcrumbList"), "BreadcrumbList");
  const h1 = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
  ok(h1 === vo.name, "h1 equals the video name");
  const entry = vsm.split("<url>").find((u) => u.includes(`<loc>${url}</loc>`)) || "";
  ok(entry, "in video-sitemap.xml");
  ok(entry.includes(`<video:thumbnail_loc>${thumb}</video:thumbnail_loc>`), "sitemap thumbnail = VideoObject thumbnail");
  ok(entry.includes(`<video:player_loc>${vo.embedUrl}</video:player_loc>`), "sitemap player_loc = embedUrl");
  ok(entry.includes(`<video:title>${vo.name.replace(/&/g, "&amp;")}</video:title>`), "sitemap title = VideoObject name");
  ok(sm.includes(`<loc>${url}</loc>`), "in sitemap.xml");
  ok(hub.includes(`href="/videos/${slug}/"`), "linked from the hub");
  for (const p of v.pages || []) {
    const f = path.join(ROOT, p.replace(/^\//, ""), "index.html");
    ok(fs.existsSync(f) && fs.readFileSync(f, "utf8").includes(`href="/videos/${slug}/"`), `linked from ${p}`);
  }
}
console.log(fails ? `\n${fails} problem(s)` : "\nAll video checks passed");
process.exit(fails ? 1 : 0);
