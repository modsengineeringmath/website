// Rebuild data/lastmod.json from git history: for every generated page (…/index.html in the repo), the date of the
// last commit in which its content fingerprint (src/lastmod.mjs) changed. Needs the full history (git fetch --unshallow).
// Usage: node scripts/lastmod-seed.mjs   then   node build.mjs   (the build fills in the fingerprints, dates stay)
// Normally never needed again: build.mjs keeps the ledger up to date by itself.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { contentFingerprint } from "../src/lastmod.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 30 });
if (git("rev-parse", "--is-shallow-repository").trim() === "true") throw new Error("shallow clone: run git fetch --unshallow first");
const day = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(t * 1000));
const isPage = (f) => f.endsWith("index.html") && !/^(src|content|node_modules|scripts|functions|data)\//.test(f);
const routeOf = (f) => "/" + f.replace(/index\.html$/, "");

// commits oldest first, with the generated pages each one added or modified
const jobs = [];
let cur = null;
for (const line of git("log", "--reverse", "--format=@%H %ct", "--name-status", "--no-renames", "--diff-filter=AM", "--", "*index.html").split("\n")) {
  if (line.startsWith("@")) { const [h, t] = line.slice(1).split(" "); cur = { h, date: day(+t) }; continue; }
  const f = line.split("\t")[1];
  if (cur && f && isPage(f)) jobs.push({ spec: `${cur.h}:${f}`, route: routeOf(f), date: cur.date });
}

// read the blobs through one `git cat-file --batch`, streamed (the pages are large: hold one at a time)
const last = {}; // route -> [date, fingerprint]
const cat = spawn("git", ["cat-file", "--batch"], { cwd: ROOT });
let buf = Buffer.alloc(0), i = 0;
cat.stdout.on("data", (c) => {
  buf = Buffer.concat([buf, c]);
  for (;;) {
    const nl = buf.indexOf(10);
    if (nl < 0) return;
    const size = +buf.toString("utf8", 0, nl).split(" ")[2];
    if (buf.length < nl + 2 + size) return;
    const j = jobs[i++], fp = contentFingerprint(buf.toString("utf8", nl + 1, nl + 1 + size));
    buf = buf.subarray(nl + 2 + size);
    if (!last[j.route] || last[j.route][1] !== fp) last[j.route] = [j.date, fp];
  }
});
const done = new Promise((r) => cat.on("close", r));
for (const j of jobs) if (!cat.stdin.write(j.spec + "\n")) await new Promise((r) => cat.stdin.once("drain", r));
cat.stdin.end();
await done;
if (i !== jobs.length) throw new Error(`read ${i} of ${jobs.length} pages`);
const keys = Object.keys(last).sort();
fs.writeFileSync(path.join(ROOT, "data/lastmod.json"), "{\n" + keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify([last[k][0], ""])}`).join(",\n") + "\n}\n");
console.log(`seeded data/lastmod.json: ${keys.length} pages from ${jobs.length} page versions`);
