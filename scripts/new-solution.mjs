// Start a new solution page from src/templates/solution.html with the next free number in its topic.
// Usage: node scripts/new-solution.mjs <topic> <slug>
//   e.g. node scripts/new-solution.mjs integral integral-by-parts-x-ex
// Creates src/pages/solutions/<slug>.html as a draft ("draft": true) with topic, number, short link and today's date filled in.
// Topics are the keys of SOLUTION_TOPICS in build.mjs (integral, derivative, limit, series, ode, laplace, multivariable,
// vector, matrix, trig, circuit). Write the page, remove "draft": true, then build and render the share images.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const [topic, slug] = process.argv.slice(2);
const SHORT = { integral: "int", derivative: "diff", limit: "lim", series: "ser", ode: "ode", laplace: "lap", multivariable: "mv", vector: "vec", matrix: "mat", trig: "trig", circuit: "cir" };
if (!topic || !slug) { console.log("Usage: node scripts/new-solution.mjs <topic> <slug>"); process.exit(1); }
if (!fs.readFileSync(path.join(ROOT, "build.mjs"), "utf8").includes(`{ key: "${topic}"`)) {
  console.log(`Unknown topic "${topic}". Use one of: ${Object.keys(SHORT).join(", ")} (or add it to SOLUTION_TOPICS in build.mjs).`);
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { console.log("Slug: lowercase English words joined by '-', e.g. integral-by-parts-x-ex"); process.exit(1); }
const dir = path.join(ROOT, "src/pages/solutions");
const out = path.join(dir, slug + ".html");
if (fs.existsSync(out)) { console.log(`${path.relative(ROOT, out)} already exists`); process.exit(1); }

const metas = fs.readdirSync(dir).filter((f) => f.endsWith(".html") && f !== "index.html")
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8").match(/^<!--meta\s*([\s\S]*?)-->/)[1]));
const no = Math.max(0, ...metas.filter((m) => m.topic === topic).map((m) => m.no)) + 1;
let short = (SHORT[topic] || topic) + no;
while (metas.some((m) => m.short === short)) short += "x";
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

const page = fs.readFileSync(path.join(ROOT, "src/templates/solution.html"), "utf8")
  .replace('"solution": true,', '"solution": true,\n  "draft": true,')
  .replaceAll("__TOPIC__", topic)
  .replaceAll("__NO__", String(no))
  .replaceAll("__NNN__", String(no).padStart(3, "0"))
  .replaceAll("__SHORT__", short)
  .replaceAll("__DATE__", today);
fs.writeFileSync(out, page);
console.log(`created ${path.relative(ROOT, out)}  (${topic} #${String(no).padStart(3, "0")}, short link /s/${short}, draft)`);
console.log("next: write the page, remove \"draft\": true, then\n  node build.mjs && python3 scripts/og.py --prefix solutions- && node build.mjs && node scripts/test-solutions.mjs");
