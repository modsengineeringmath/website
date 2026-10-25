// /mcp — read-only Model Context Protocol server for Mod's Engineering Mathematics (Cloudflare Pages Function).
//
// Transport: MCP "Streamable HTTP", stateless. Clients POST JSON-RPC messages and get a JSON reply; no SSE stream and no
// session id. Add https://modsengineeringmath.com/mcp to Claude as a custom connector. A browser GET shows a help page.
//
// Data comes from the static files that build.mjs already writes, read through the ASSETS binding (no database, no AI
// model, no secrets): mcp-index.json, the Markdown copy of every page (<route>index.html.md), llms.txt and
// data/updates.json. Only /mcp runs this code (_routes.json), so the rest of the site stays plain static hosting.

const SITE = "https://modsengineeringmath.com";
const SERVER = { name: "modsengineeringmath", title: "Mod's Engineering Mathematics (อาจารย์มด)", version: "1.0.0" };
const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]; // newest first
const PAGE_CHARS = 40000; // get_page returns long pages in parts of about this size

const INSTRUCTIONS = `Mod's Engineering Mathematics (modsengineeringmath.com) is a free Thai-language site by Teerawut Savangboon (อาจารย์มด), lecturer in Electrical Engineering at Dhonburi Rajabhat University, Thailand. It covers engineering mathematics (functions, trigonometry, limits, sequences and series, derivatives, integrals, vectors, multivariable calculus, linear algebra, Laplace transform, Fourier series) and electrical engineering (DC circuits, first/second-order systems, signals, oscilloscope and function generator, control systems, power electronics, solar PV, home EV charging, power systems and protection, power factor, sensors and instrumentation, AC motor control, PLC), plus short articles (Thai and English) and step-by-step worked solutions.
Pages are mostly Thai with English technical terms; math is LaTeX. Formulas carry reference IDs (for example F2, P1) that are stable anchors on the page.
How to use: call search_site with Thai or English keywords, then get_page for the text (pass a section to read only one part of a long page). list_topics shows the lesson map in reading order; get_updates shows what was added recently.
When you use this content, cite the page URL and name the source as "Mod's Engineering Mathematics (อาจารย์มด)". Interactive labs and figures exist only on the web page, so send the reader to the URL for those.`;

const TOOLS = [
  {
    name: "search_site",
    title: "Search the site",
    description: "Search every lesson, article, worked solution and lab on modsengineeringmath.com. Accepts Thai or English keywords (Thai has no spaces between words, so use the key term itself, e.g. 'ลาปลาซผกผัน'). Returns page titles, URLs, a short description and links to the matching sections.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords, e.g. 'inverse laplace partial fractions', 'กฎของคราเมอร์', 'gain margin', 'Pt100', 'star delta timer'" },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 8, description: "Maximum number of pages to return" },
        language: { type: "string", enum: ["any", "th", "en"], default: "any", description: "Prefer pages in this language (most lessons are Thai; motor control, PLC and the articles also have English editions)" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { title: "Search the site", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_page",
    title: "Read a page",
    description: "Return the text of one page as Markdown (math as LaTeX). Give a full URL or a path such as /learn/laplace-transform/. A URL with #anchor, or the section argument, returns only that section. Long pages come in parts: the reply says which start value gives the next part, and lists the page's headings.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Page URL or path, e.g. https://modsengineeringmath.com/learn/control-systems/bode-plot/ or /blog/cramers-rule/" },
        section: { type: "string", description: "Optional: heading text (Thai or English) or anchor id of the part to return" },
        start: { type: "integer", minimum: 0, default: 0, description: "Optional: character offset for the next part of a long page" },
      },
      required: ["url"],
      additionalProperties: false,
    },
    annotations: { title: "Read a page", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "list_topics",
    title: "List topics",
    description: "Without arguments: the lesson map in reading order (chapters with their URLs and summaries). With topic: the sub-pages of one chapter (slug or name, e.g. 'laplace-transform', 'power-electronics', 'ลาปลาซ'), or one of 'articles', 'articles-en', 'solutions', 'labs'.",
    inputSchema: {
      type: "object",
      properties: { topic: { type: "string", description: "Optional chapter slug or name, or 'articles' | 'articles-en' | 'solutions' | 'labs'" } },
      additionalProperties: false,
    },
    annotations: { title: "List topics", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_updates",
    title: "What is new",
    description: "The most recent additions to the site (new lessons, labs, articles, solutions), newest first, with links.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 20, default: 5 } },
      additionalProperties: false,
    },
    annotations: { title: "What is new", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

// ---------------------------------------------------------------------------------------------------------------------
// Static data (cached for the life of the isolate; a new deployment starts new isolates, so the cache is never stale)
// ---------------------------------------------------------------------------------------------------------------------
const cache = new Map();
async function asset(env, origin, path, kind) {
  const key = kind + ":" + path;
  if (!cache.has(key)) {
    const p = env.ASSETS.fetch(new Request(new URL(path, origin))).then(async (r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return kind === "json" ? r.json() : r.text();
    });
    cache.set(key, p);
    p.catch(() => cache.delete(key)); // retry on the next call instead of caching a failure
  }
  return cache.get(key);
}

const norm = (s) => (s || "").normalize("NFKC").toLowerCase().replace(/[​-‍﻿]/g, "").replace(/\s+/g, " ").trim();
const noNum = (s) => s.replace(/^\d+(\.\d+)*\.?\s+/, "");

// mcp-index.json (written by build.mjs next to search-index.json) is flat on purpose: one array per page, headings joined
// into one string. Parsing it allocates few objects, which keeps a cold request well inside the 10 ms CPU of Workers Free.
// Lower-case copies are made once per isolate; headings are split only for pages that can match.
let indexPromise = null;
function searchIndex(env, origin) {
  if (!indexPromise) {
    indexPromise = asset(env, origin, "/mcp-index.json", "json").then((rows) =>
      rows.map(([u, l, t, d, c, k, w, hs]) => ({
        e: { u, l, t, d, c },
        hs,
        t: t.toLowerCase(),
        d: d.toLowerCase(),
        c: c.toLowerCase(),
        k,
        w,
        hl: hs.toLowerCase(),
        _h: null,
      })),
    );
    indexPromise.catch(() => (indexPromise = null));
  }
  return indexPromise;
}
// [[id, heading, heading lower case], …] — split on first use only
const pageHeads = (x) => x._h || (x._h = x.hs ? x.hs.split("\u0002").map((p) => { const i = p.indexOf("\u0001"); const text = p.slice(i + 1); return [p.slice(0, i), text, text.toLowerCase()]; }) : []);

// ---------------------------------------------------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------------------------------------------------
// Same weights as the header search on the site (assets/site.js), so both find the same pages.
function score(x, toks, phrase, lang, all) {
  let s = 0, matched = 0;
  for (const w of toks) {
    let v = 0;
    const at = x.t.indexOf(w);
    if (at >= 0) v += at === 0 ? 14 : 10;
    const nh = x.hl.includes(w) ? pageHeads(x).reduce((n, h) => n + (h[2].includes(w) ? 1 : 0), 0) : 0;
    if (nh) v += 2 + Math.min(nh, 4);
    if (x.k.includes(w)) v += 3;
    if (x.d.includes(w)) v += 2;
    if (!v && x.w.includes(w)) v = 1;
    if (!v && x.c.includes(w)) v = 1;
    if (!v && all) return 0;
    if (v) matched++;
    s += v;
  }
  if (!all && matched < Math.ceil(toks.length / 2)) return 0;
  if (toks.length > 1 && x.t.includes(phrase)) s += 10;
  else if (toks.length > 1 && (x.k.includes(phrase) || x.d.includes(phrase) || (x.hl.includes(phrase) && pageHeads(x).some((h) => h[2].includes(phrase))))) s += 8;
  s += (lang !== "any" && x.e.l === lang ? 3 : 0) - x.e.u.split("/").length * 0.1;
  // pages that only list other pages (home, library, blog hubs and categories, updates, about) mention every topic;
  // an assistant wants the page that teaches it, so these rank below real content unless nothing else matches
  return LISTING.test(x.e.u) ? s * 0.5 : s;
}
const LISTING = /^\/(|about\/|updates\/|learn\/|learn\/en\/|solutions\/|(en\/)?blog\/(category\/[^/]+\/)?)$/;
// Thai and English editions of the same page (/blog/x/ ⇄ /en/blog/x/, /learn/motor-control/x/ ⇄ /learn/en/motor-control/x/)
const twinKey = (u) => u.replace(/^\/en\//, "/").replace(/^\/learn\/en\//, "/learn/");

async function searchSite(args, env, origin) {
  const q = String(args.query || "").trim();
  if (!q) throw new Error("query is empty");
  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 8, 1), 25);
  const lang = ["th", "en"].includes(args.language) ? args.language : "any";
  const phrase = norm(q), toks = phrase.split(" ").filter(Boolean);
  const pages = await searchIndex(env, origin);
  let partial = false;
  let hits = pages.map((x) => ({ x, s: score(x, toks, phrase, lang, true) })).filter((r) => r.s > 0);
  if (!hits.length && toks.length > 1) {
    partial = true;
    hits = pages.map((x) => ({ x, s: score(x, toks, phrase, lang, false) })).filter((r) => r.s > 0);
  }
  hits.sort((a, b) => b.s - a.s);
  // show each page once: the better-ranked edition, with a link to its other-language twin
  const byKey = new Map();
  hits = hits.filter((h) => {
    const k = twinKey(h.x.e.u), first = byKey.get(k);
    if (first) { first.alt = h.x.e; return false; }
    byKey.set(k, h);
    return true;
  });
  if (!hits.length)
    return `No page matches "${q}". Try fewer or different keywords, the Thai or English name of the topic (for example "ลาปลาซ" or "Laplace"), or list_topics to browse the lesson map.`;
  const lines = [`Results for "${q}": ${hits.length} page${hits.length > 1 ? "s" : ""}${hits.length > limit ? `, showing the top ${limit}` : ""}.` +
    (partial ? " No page contains every word, so these pages match most of them." : "")];
  hits.slice(0, limit).forEach(({ x, alt }, i) => {
    const e = x.e, url = SITE + e.u;
    const secs = pageHeads(x)
      .map(([id, text, low]) => ({ id, text, m: toks.filter((w) => low.includes(w)).length }))
      .filter((h) => h.m)
      .sort((a, b) => b.m - a.m)
      .slice(0, 4)
      .map((h) => `[${noNum(h.text)}](${url}#${h.id})`);
    const d = e.d.length > 260 ? e.d.slice(0, 257).trim() + "…" : e.d;
    lines.push(
      `\n${i + 1}. **${e.t}**${e.c ? ` — ${e.c}` : ""} (${e.l === "en" ? "English" : "Thai"})\n   ${url}` +
        (alt ? `\n   ${alt.l === "en" ? "English" : "Thai"} edition: ${SITE + alt.u}` : "") +
        (secs.length ? `\n   Sections: ${secs.join(" · ")}` : "") +
        (d ? `\n   ${d}` : ""),
    );
  });
  lines.push(`\nRead a page with get_page (url, optional section).`);
  return lines.join("\n");
}

// "https://modsengineeringmath.com/learn/x/#f2" | "/learn/x" | "learn/x/index.html.md" → { path: "/learn/x/", anchor: "f2" }
function parseUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) throw new Error("url is empty");
  let anchor = "";
  const hash = s.indexOf("#");
  if (hash >= 0) { anchor = decodeURIComponent(s.slice(hash + 1)); s = s.slice(0, hash); }
  s = s.replace(/^https?:\/\/(www\.)?modsengineeringmath\.com/i, "");
  if (/^https?:\/\//i.test(s)) throw new Error("only pages on modsengineeringmath.com can be read");
  s = s.split("?")[0];
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/index\.html(\.md)?$/, "");
  if (/\.md$/.test(s)) return { path: s, md: s, anchor };
  if (!s.endsWith("/")) s += "/";
  return { path: s, md: s + "index.html.md", anchor };
}

async function fetchMarkdown(env, origin, target) {
  const r = await env.ASSETS.fetch(new Request(new URL(target.md, origin)));
  if (r.ok) return { text: await r.text(), path: target.path };
  // short URLs and old routes are redirects in _redirects (e.g. /star-delta-timer → /blog/star-delta-timer-setting/)
  const html = await env.ASSETS.fetch(new Request(new URL(target.path.replace(/\/$/, "") || "/", origin), { redirect: "manual" }));
  const loc = html.status >= 300 && html.status < 400 ? html.headers.get("location") : null;
  if (loc) {
    const next = parseUrl(new URL(loc, origin).pathname);
    const r2 = await env.ASSETS.fetch(new Request(new URL(next.md, origin)));
    if (r2.ok) return { text: await r2.text(), path: next.path };
  }
  return null;
}

const headingsOf = (md) =>
  md.split("\n").map((l, i) => ({ i, m: /^(#{1,4})\s+(.*)$/.exec(l) })).filter((x) => x.m).map((x) => ({ line: x.i, level: x.m[1].length, text: x.m[2].trim() }));

async function getPage(args, env, origin) {
  const target = parseUrl(args.url);
  const page = await fetchMarkdown(env, origin, target);
  if (!page) return { error: `No page at ${SITE}${target.path}. Use search_site to find the right URL.` };
  const md = page.text.replace(/\r\n/g, "\n");
  const url = SITE + page.path;
  const heads = headingsOf(md);
  let want = String(args.section || target.anchor || "").trim().replace(/^#/, "");

  if (want) {
    // an anchor id (e.g. "bode-margins" or a formula id) → the heading text it belongs to, from the search index
    const entry = (await searchIndex(env, origin)).find((x) => x.e.u === page.path);
    const byId = entry ? pageHeads(entry).find(([id]) => id.toLowerCase() === want.toLowerCase()) : null;
    const needle = norm(noNum(byId ? byId[1] : want));
    const lines = md.split("\n");
    const h = heads.find((x) => x.level > 1 && norm(noNum(x.text)).includes(needle)) || heads.find((x) => x.level > 1 && needle.includes(norm(noNum(x.text))) && norm(x.text).length > 3);
    if (h) {
      const end = heads.find((x) => x.line > h.line && x.level <= h.level);
      const body = lines.slice(h.line, end ? end.line : lines.length).join("\n").trim();
      const text = body.length > PAGE_CHARS ? body.slice(0, PAGE_CHARS) + `\n\n[Section truncated at ${PAGE_CHARS} characters; read the page with start=… for the rest.]` : body;
      return { text: `Source: ${url}${byId ? "#" + byId[0] : ""} (section of "${heads[0]?.text || url}")\n\n${text}` };
    }
    if (target.anchor && !args.section) want = ""; // formula ids and labs have no heading of their own: fall back to the page
    else return { text: `No section matching "${args.section}" on ${url}. Headings on this page:\n` + outline(heads) };
  }

  const start = Math.max(parseInt(args.start, 10) || 0, 0);
  if (start >= md.length) return { error: `start=${start} is past the end of the page (${md.length} characters).` };
  let end = Math.min(start + PAGE_CHARS, md.length);
  if (end < md.length) {
    const nl = md.lastIndexOf("\n", end);
    if (nl > start + PAGE_CHARS * 0.6) end = nl;
  }
  let text = md.slice(start, end);
  if (start > 0) text = `Source: ${url} (characters ${start}–${end} of ${md.length})\n\n` + text;
  if (end < md.length)
    text += `\n\n[The page continues: characters ${start}–${end} of ${md.length} shown. Call get_page again with start=${end}, or ask for one section. Headings:]\n` + outline(heads);
  return { text };
}

const outline = (heads) => heads.filter((h) => h.level >= 2 && h.level <= 3).map((h) => `${h.level === 3 ? "  " : ""}- ${h.text}`).join("\n") || "(no headings)";

function llmsSection(llms, title) {
  const parts = ("\n" + llms).split("\n## ");
  const p = parts.find((x) => x.toLowerCase().startsWith(title.toLowerCase()));
  return p ? p.split("\n").slice(1).filter((l) => l.trim()) : [];
}

async function listTopics(args, env, origin) {
  const llms = await asset(env, origin, "/llms.txt", "text");
  const lessons = llmsSection(llms, "Lessons");
  const topic = String(args.topic || "").trim();
  const shorten = (l, n) => (l.length > n ? l.slice(0, n - 1).trim() + "…" : l);
  const special = { articles: "Articles (", "articles-en": "Articles in English", solutions: "Worked solutions", labs: "Interactive labs" };
  const key = topic.toLowerCase().replace(/\s+/g, "-");
  if (special[key]) {
    const lines = llmsSection(llms, special[key]);
    return `${special[key].replace(/ \($/, "")} on ${SITE} (${lines.filter((l) => l.startsWith("- [")).length} entries):\n` + lines.map((l) => shorten(l, 300)).join("\n");
  }
  const tops = lessons.map((l, i) => ({ l, i })).filter((x) => x.l.startsWith("- ["));
  if (!topic) {
    return `Lessons on ${SITE} in reading order (${tops.length} chapters). Call list_topics with a chapter slug for its sub-pages, or with 'articles', 'articles-en', 'solutions' or 'labs'.\n\n` +
      tops.map((x) => shorten(x.l, 360)).join("\n");
  }
  const slug = key.replace(/^\/?learn\//, "").replace(/\/$/, "");
  const n = norm(topic);
  const found = tops.filter((x) => x.l.includes(`${SITE}/learn/${slug}/)`) || norm(x.l.slice(0, x.l.indexOf("]("))).includes(n)).slice(0, 3);
  if (!found.length) return `No chapter matches "${topic}". Chapters:\n` + tops.map((x) => shorten(x.l.slice(0, x.l.indexOf(")") + 1), 200)).join("\n");
  return found
    .map((x) => {
      const kids = [];
      for (let j = x.i + 1; j < lessons.length && lessons[j].startsWith("  "); j++) kids.push(shorten(lessons[j].trim(), 320));
      return x.l + (kids.length ? `\n\nSub-pages (${kids.length}):\n` + kids.join("\n") : "\n\n(single page, no sub-pages)");
    })
    .join("\n\n---\n\n");
}

async function getUpdates(args, env, origin) {
  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 5, 1), 20);
  const data = await asset(env, origin, "/data/updates.json", "json");
  const abs = (h) => (/^https?:/.test(h) ? h : SITE + h);
  const list = (data.updates || []).slice(0, limit);
  return `Latest updates on ${SITE} (newest first; full log ${SITE}/updates/):\n` +
    list
      .map((u) =>
        `\n- ${u.date} · ${u.tag}${u.hero ? ` · ${u.hero}` : ""}\n  ${u.text}` +
        (u.link ? `\n  ${abs(u.link)}` : "") +
        (u.links || []).map((l) => `\n  ${l.text}: ${abs(l.href)}`).join(""),
      )
      .join("\n");
}

async function callTool(name, args, env, origin) {
  switch (name) {
    case "search_site": return { text: await searchSite(args, env, origin) };
    case "get_page": return getPage(args, env, origin);
    case "list_topics": return { text: await listTopics(args, env, origin) };
    case "get_updates": return { text: await getUpdates(args, env, origin) };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------------
// JSON-RPC over HTTP
// ---------------------------------------------------------------------------------------------------------------------
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const rpcError = (id, code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function handle(msg, env, origin) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return rpcError(msg?.id, -32600, "Invalid Request");
  const isRequest = typeof msg.method === "string" && "id" in msg && msg.id !== null;
  if (typeof msg.method !== "string") return null; // a response from the client: nothing to do
  if (!isRequest) return null; // notifications (notifications/initialized, notifications/cancelled, …)
  const { id, method } = msg;
  const p = msg.params || {};
  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOLS.includes(p.protocolVersion) ? p.protocolVersion : PROTOCOLS[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo: SERVER,
            instructions: INSTRUCTIONS,
          },
        };
      case "ping":
        return { jsonrpc: "2.0", id, result: {} };
      case "tools/list":
        return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
      case "tools/call": {
        if (!TOOLS.some((t) => t.name === p.name)) return rpcError(id, -32602, `Unknown tool: ${p.name}`);
        let r;
        try {
          r = await callTool(p.name, p.arguments || {}, env, origin);
        } catch (e) {
          r = { error: String(e?.message || e) };
        }
        return { jsonrpc: "2.0", id, result: r.error ? { content: [{ type: "text", text: "Error: " + r.error }], isError: true } : { content: [{ type: "text", text: r.text }] } };
      }
      case "resources/list":
        return { jsonrpc: "2.0", id, result: { resources: [] } };
      case "resources/templates/list":
        return { jsonrpc: "2.0", id, result: { resourceTemplates: [] } };
      case "prompts/list":
        return { jsonrpc: "2.0", id, result: { prompts: [] } };
      default:
        return rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return rpcError(id, -32603, "Internal error: " + String(e?.message || e));
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method === "GET" || request.method === "HEAD") {
    // MCP clients open an SSE stream with GET; this server does not offer one (allowed by the spec: 405)
    if ((request.headers.get("accept") || "").includes("text/event-stream"))
      return new Response("This MCP server does not offer an SSE stream. POST JSON-RPC messages to this URL.", { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
    return new Response(request.method === "HEAD" ? null : helpPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=600", "X-Robots-Tag": "noindex" },
    });
  }
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { ...CORS, Allow: "GET, POST, OPTIONS" } });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }
  if (Array.isArray(body)) {
    if (!body.length) return json(rpcError(null, -32600, "Invalid Request"), 400);
    const out = (await Promise.all(body.map((m) => handle(m, env, origin)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await handle(body, env, origin);
  return out ? json(out) : new Response(null, { status: 202, headers: CORS });
}

function helpPage() {
  const tools = TOOLS.map((t) => `<li><code>${t.name}</code> — ${t.description.split(". ")[0]}.</li>`).join("");
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>MCP · Mod's Engineering Mathematics</title>
<link rel="icon" href="/favicon.ico">
<style>
:root{--bg:#f5f2ea;--fg:#1d1b16;--mute:#5d574a;--line:#d8d1c0;--card:#fffdf7;--acc:#a8461e}
@media (prefers-color-scheme:dark){:root{--bg:#16150f;--fg:#ece7da;--mute:#a59e8d;--line:#3a372c;--card:#1f1d16;--acc:#e58a5c}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 "IBM Plex Sans Thai",system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:40px 16px 64px}h1{font:700 1.7rem/1.3 Trirong,Georgia,serif;margin:.2em 0 .6em}
h2{font:700 1.15rem/1.4 Trirong,Georgia,serif;margin:2em 0 .5em}.eyebrow{font:500 .8rem/1 "IBM Plex Mono",monospace;color:var(--mute);letter-spacing:.04em}
.url{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:1em 0}
.url code{font:500 1rem "IBM Plex Mono",monospace;word-break:break-all;flex:1 1 240px}
button{font:inherit;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:8px;padding:4px 12px;cursor:pointer}
ol,ul{padding-left:1.3em}li{margin:.3em 0}code{font-family:"IBM Plex Mono",monospace;font-size:.92em}a{color:var(--acc)}
.note{color:var(--mute);font-size:.92rem}
</style>
</head>
<body><main>
<div class="eyebrow">// MODEL CONTEXT PROTOCOL</div>
<h1>เชื่อม Claude เข้ากับเว็บอาจารย์มด</h1>
<p>ที่อยู่นี้คือ MCP server ของ <a href="/">Mod's Engineering Mathematics</a> ให้ผู้ช่วย AI เช่น Claude ค้นบทเรียน บทความ และเฉลยโจทย์ แล้วอ่านเนื้อหาพร้อมสูตร LaTeX ได้โดยตรง ใช้ฟรี ไม่ต้องสมัครสมาชิก และอ่านได้อย่างเดียว</p>
<div class="url"><code id="u">${SITE}/mcp</code><button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('u').textContent).then(()=>{this.textContent='คัดลอกแล้ว'})">คัดลอก</button></div>
<h2>วิธีเพิ่มใน Claude</h2>
<ol><li>เปิด <a href="https://claude.ai" rel="noopener">claude.ai</a> แล้วไปที่ Customize › Connectors</li><li>กด + Add แล้วเลือก Add custom connector</li><li>ตั้งชื่อ เช่น “อาจารย์มด” วางที่อยู่ด้านบนในช่อง URL แล้วกด Continue</li><li>ที่ Authentication เลือก No sign in แล้วกด Add</li><li>จากนั้นถามได้เลย เช่น “ค้นเว็บอาจารย์มดเรื่อง Inverse Laplace แล้วสรุปขั้นตอน”</li></ol>
<p class="note">แผน Free เพิ่ม custom connector ได้ 1 ตัว ส่วนแผนแบบเสียเงินเพิ่มได้หลายตัว รายละเอียดดูที่ <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" rel="noopener">Claude Help Center</a></p>
<h2>เครื่องมือที่มี</h2>
<ul>${tools}</ul>
<p class="note">For AI developers: Streamable HTTP transport (stateless JSON responses, no SSE), protocol versions ${PROTOCOLS.join(", ")}. The same content is also at <a href="/llms.txt">/llms.txt</a>, <a href="/llms-full.txt">/llms-full.txt</a> and as a Markdown copy of every page (&lt;page URL&gt;index.html.md).</p>
</main></body></html>`;
}
