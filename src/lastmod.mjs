// lastmod — the date a page's *content* last changed, for sitemap.xml <lastmod>, JSON-LD dateModified,
// the "อัปเดต / Updated" date on the page, the Markdown copy and video-sitemap.xml.
//
// Why: before 2026-11-20 these dates came from the hand-written "updated" in each page's meta block (forgotten on
// most edits, so 228 of 502 pages showed an older date than their last change) or, when missing, from the build day
// (so the page looked "changed" on every build). Google ignores <lastmod> that is not consistently accurate.
//
// How: data/lastmod.json is a ledger { "/route/": ["YYYY-MM-DD", "fingerprint"] }. Each build computes a fingerprint
// of what a reader actually gets — title, meta description, and the text and images inside <main>, without the
// share bar / prev-next / related-links block at the end, the breadcrumbs, the sub-page menu, the TH/EN switch and any <time> dates.
// Same fingerprint → keep the stored date. Different → the content changed today (Asia/Bangkok). New page → today.
// Layout, CSS, scripts, header/footer, menu and markup-only changes therefore do not move the date.
// A newer hand-written "updated" in the meta block still wins (to mark a change by hand); it is clamped to today.
// The ledger was seeded from the git history of the generated pages (scripts/lastmod-seed.mjs).
import fs from "node:fs";
import crypto from "node:crypto";

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function contentFingerprint(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  let main = (html.match(/<main id="main">([\s\S]*)<\/main>/) || html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, html])[1];
  const cut = main.indexOf('<div class="share"'); // share bar + pager + related links: navigation, not content
  if (cut >= 0) main = main.slice(0, cut);
  main = main
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<nav class="(?:series-nav|lang-sw)[\s\S]*?<\/nav>/g, " ")
    .replace(/<ol class="crumbs">[\s\S]*?<\/ol>/g, " ")
    .replace(/<time[^>]*>[\s\S]*?<\/time>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<img\b[^>]*>/g, (t) => ` [img ${((t.match(/\ssrc="([^"?#]*)/) || [])[1] || "")} ${((t.match(/\salt="([^"]*)"/) || [])[1] || "")}] `)
    .replace(/<[^>]+>/g, " ")
    .replace(/[·•→←↑↓]/g, " ") // separators and arrows: layout, not content
    .replace(/\s+/g, " ")
    .trim();
  return crypto.createHash("sha1").update(`${title.trim()}\n${desc.trim()}\n${main}`).digest("hex").slice(0, 16);
}

export function openLedger(file, today) {
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const next = {};
  return {
    // route: "/learn/x/"; html: page head + <main> (see contentFingerprint); floor: hand-written "updated", if any
    resolve(route, html, floor) {
      const fp = contentFingerprint(html);
      const [date, prev] = old[route] || [];
      let d = !isDate(date) ? today : !prev || prev === fp ? date : today; // no stored fingerprint (fresh seed): adopt it
      if (isDate(floor) && floor > d) d = floor;
      if (d > today) d = today;
      next[route] = [d, fp];
      return d;
    },
    // write only the pages built this time (deleted pages drop out), one line per page for readable diffs
    save() {
      const keys = Object.keys(next).sort();
      fs.writeFileSync(file, "{\n" + keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(next[k])}`).join(",\n") + "\n}\n");
    },
  };
}
