// Tell search engines which pages changed, through IndexNow (Bing, Yandex, Naver, Seznam, Yep share one endpoint).
// Google does not take IndexNow: it reads the sitemap listed in robots.txt and Search Console.
//
// Usage (Node 18+, no packages):
//   node scripts/indexnow.mjs --from <git rev> --to <git rev> [--wait] [--dry-run]   changed / new / removed pages between two commits
//   node scripts/indexnow.mjs --all [--wait] [--dry-run]                             every URL in the sitemap
//   node scripts/indexnow.mjs https://modsengineeringmath.com/a/ …                  just these URLs
//
// "Changed" means: a URL that is new in the sitemap, a URL whose <lastmod> changed, or a URL that left the sitemap
// (moved or deleted pages, so the engines recrawl them and see the redirect or the 404). The first time the key file
// appears (no key at --from), every URL is sent once. --wait polls the live site until the deployed sitemap matches the
// commit, so the engines never fetch the old version. Run by .github/workflows/indexnow.yml after every push to main.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const SITE = "https://modsengineeringmath.com";
const KEY = "b8dd506014d1a0e9decb6b4e56fe3748";    // the key file /<KEY>.txt sits in the repository root; keep both
const SITEMAP = "sitemap.xml";                      // built by build.mjs, served from the root
const KEYFILE = `${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : ""; };
const urlsArg = args.filter((a) => /^https?:\/\//.test(a));
const dry = flag("--dry-run");

const git = (...a) => { try { return execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
const parse = (xml) => {
  const m = new Map();
  for (const [, u] of String(xml || "").matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (u.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (loc) m.set(loc.trim(), ((u.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || "").trim());
  }
  return m;
};
const valid = (rev) => rev && !/^0+$/.test(rev) && git("cat-file", "-e", rev + "^{commit}") !== null;

let to = opt("--to") || "HEAD";
let from = opt("--from");
if (!valid(from)) from = valid(to + "~1") ? to + "~1" : "";
const now = parse(git("show", `${to}:${SITEMAP}`) ?? fs.readFileSync(SITEMAP, "utf8"));

let urls;
if (urlsArg.length) urls = urlsArg;
else if (flag("--all") || !from || git("cat-file", "-e", `${from}:${KEYFILE}`) === null) {
  // every URL in the sitemap, plus any that left it in this range (moved or deleted pages)
  const gone = from ? [...parse(git("show", `${from}:${SITEMAP}`)).keys()].filter((u) => !now.has(u)) : [];
  urls = [...now.keys(), ...gone];
  console.log(`${flag("--all") ? "Submitting every URL in the sitemap" : "First run with this key: submitting every URL in the sitemap once"}${gone.length ? `, plus ${gone.length} removed from it` : ""}.`);
  for (const u of gone) console.log("  removed:", u);
} else {
  const before = parse(git("show", `${from}:${SITEMAP}`));
  const changed = [...now].filter(([u, d]) => !before.has(u) || before.get(u) !== d).map(([u]) => u);
  const removed = [...before.keys()].filter((u) => !now.has(u));
  urls = [...changed, ...removed];
  console.log(`${from.slice(0, 10)} → ${to.slice(0, 10)}: ${changed.length} new or updated, ${removed.length} removed from the sitemap.`);
  for (const u of removed) console.log("  removed:", u);
}
urls = [...new Set(urls)].filter((u) => u.startsWith(SITE + "/"));
if (!urls.length) { console.log("Nothing to submit."); process.exit(0); }
for (const u of urls.slice(0, 40)) console.log("  ", u);
if (urls.length > 40) console.log(`   … and ${urls.length - 40} more`);
if (dry) { console.log(`Dry run: ${urls.length} URL(s) not sent.`); process.exit(0); }

// wait until Cloudflare serves this commit (the sitemap and the key file), at most ~15 minutes
if (flag("--wait")) {
  const want = git("show", `${to}:${SITEMAP}`);
  for (let i = 0; ; i++) {
    let live = "", key = "";
    try { live = await (await fetch(`${SITE}/sitemap.xml?indexnow=${Date.now()}`, { cache: "no-store" })).text(); } catch {}
    try { key = (await (await fetch(`${SITE}/${KEY}.txt?indexnow=${Date.now()}`, { cache: "no-store" })).text()).trim(); } catch {}
    if (key === KEY && (!want || live.trim() === want.trim())) { console.log("Live site matches this commit."); break; }
    if (i >= 45) { console.log("The live site did not match within 15 minutes; submitting anyway."); break; }
    await new Promise((r) => setTimeout(r, 20000));
  }
}

const host = new URL(SITE).host;
let failed = false;
for (let i = 0; i < urls.length; i += 10000) {
  const urlList = urls.slice(i, i + 10000);
  // 200 = accepted, 202 = accepted while the key is being verified; 4xx = rejected (bad key, wrong host, too many requests).
  // A new key answers 403 SiteVerificationNotCompleted until the engine has fetched the key file: wait and try again.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
    });
    const ok = res.status === 200 || res.status === 202;
    const body = ok ? "" : (await res.text()).slice(0, 300);
    console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URL(s)${ok ? "" : " — " + body}`);
    if (ok) break;
    if (!/SiteVerificationNotCompleted/.test(body) || attempt >= 10) { failed = true; break; }
    console.log(`Key not verified yet; trying again in ${attempt} minute(s).`);
    await new Promise((r) => setTimeout(r, attempt * 60000));
  }
}
process.exit(failed ? 1 : 0);
