"""Render 1200x630 social-share images (Open Graph) for every indexable page.

Usage (after `npm install` and `node build.mjs`, which writes src/og-manifest.json):
    python3 scripts/og.py && node build.mjs
Needs Python Playwright with Chromium. Fonts come from node_modules/@fontsource (no network).
Output: images/og/<key>.jpg — build.mjs picks these up automatically.
"""
import argparse
import html
import functools
import http.server
import threading
import json
import pathlib
import shutil

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FS = (ROOT / "node_modules/@fontsource").as_uri()
OUT = ROOT / "images/og"
OUT.mkdir(parents=True, exist_ok=True)

FONTS = f"""
@font-face{{font-family:Trirong;font-weight:700;src:url({FS}/trirong/files/trirong-thai-700-normal.woff2) format('woff2');unicode-range:U+0E01-0E5B}}
@font-face{{font-family:Trirong;font-weight:700;src:url({FS}/trirong/files/trirong-latin-700-normal.woff2) format('woff2')}}
@font-face{{font-family:Plex;font-weight:400;src:url({FS}/ibm-plex-sans-thai/files/ibm-plex-sans-thai-thai-400-normal.woff2) format('woff2');unicode-range:U+0E01-0E5B}}
@font-face{{font-family:Plex;font-weight:400;src:url({FS}/ibm-plex-sans-thai/files/ibm-plex-sans-thai-latin-400-normal.woff2) format('woff2')}}
@font-face{{font-family:Plex;font-weight:600;src:url({FS}/ibm-plex-sans-thai/files/ibm-plex-sans-thai-thai-600-normal.woff2) format('woff2');unicode-range:U+0E01-0E5B}}
@font-face{{font-family:Plex;font-weight:600;src:url({FS}/ibm-plex-sans-thai/files/ibm-plex-sans-thai-latin-600-normal.woff2) format('woff2')}}
@font-face{{font-family:Mono;font-weight:500;src:url({FS}/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2) format('woff2')}}
"""

TEMPLATE = """<!doctype html><html lang="th"><head><meta charset="utf-8"><style>
{fonts}
*{{box-sizing:border-box;margin:0}}
html,body{{width:1200px;height:630px}}
body{{background:#172029;color:#ece8df;font-family:Plex,sans-serif;position:relative;overflow:hidden;
  background-image:linear-gradient(rgba(236,232,223,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(236,232,223,.05) 1px,transparent 1px);background-size:30px 30px}}
.bar{{position:absolute;left:0;top:0;bottom:0;width:14px;background:#e8692c}}
.wave{{position:absolute;right:-40px;bottom:-30px;width:760px;opacity:.9}}
.sym{{position:absolute;right:70px;top:70px;font:700 230px/1 Trirong,serif;color:#f07a3e;opacity:.95}}
.wrap{{position:absolute;left:84px;top:66px;right:340px;bottom:60px;display:flex;flex-direction:column}}
.brand{{display:flex;align-items:center;gap:14px;font:600 26px Plex}}
.mark{{width:46px;height:46px;border-radius:10px;background:#0d1318;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12)}}
.eyebrow{{margin-top:44px;font:500 24px Mono,monospace;color:#f07a3e;letter-spacing:.02em}}
h1{{margin-top:14px;font:700 {size}px/1.22 Trirong,serif;color:#fff}}
.sub{{margin-top:20px;font:400 27px/1.5 Plex;color:#b4bcc3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.foot{{margin-top:auto;display:flex;gap:26px;font:500 23px Mono,monospace;color:#8a949c}}
.foot b{{color:#ece8df;font-weight:500}}
</style></head><body>
<div class="bar"></div>
<svg class="wave" viewBox="0 0 760 260"><path d="M0 200 C90 200 110 40 210 40 S330 170 420 130 S560 90 760 90" fill="none" stroke="#e8692c" stroke-opacity=".28" stroke-width="10" stroke-linecap="round"/></svg>
<div class="sym">{sym}</div>
<div class="wrap">
  <div class="brand"><span class="mark"><svg width="32" height="32" viewBox="0 0 64 64"><path d="M8 46 C16 46 18 14 27 14 S35 40 42 34 S50 30 56 30" fill="none" stroke="#e8692c" stroke-width="6" stroke-linecap="round"/></svg></span>Mod's Engineering Mathematics</div>
  <div class="eyebrow">{eyebrow}</div>
  <h1>{title}</h1>
  <div class="sub">{sub}</div>
  <div class="foot"><b>modsengineeringmath.com</b><span>{foot}</span></div>
</div>
</body></html>"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prefix", default="", help="Render only manifest keys starting with this prefix")
    parser.add_argument("--chromium", help="Path to an installed Chromium executable")
    args = parser.parse_args()
    pages = json.loads((ROOT / "src/og-manifest.json").read_text("utf-8"))
    pages = [e for e in pages if e["key"].startswith(args.prefix)]
    if not pages:
        parser.error("No manifest entries matched --prefix")

    # A loopback server also works in managed Chromium where file:// is blocked.
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    origin = f"http://127.0.0.1:{server.server_port}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    tmp = OUT / "_tmp.html"
    try:
        with sync_playwright() as p:
            executable = args.chromium or shutil.which("chromium")
            b = p.chromium.launch(**({"executable_path": executable} if executable else {}))
            pg = b.new_page(viewport={"width": 1200, "height": 630})
            fonts = FONTS.replace(FS, origin + "/node_modules/@fontsource")
            for e in pages:
                t = e["title"]
                size = 66 if len(t) <= 22 else 56 if len(t) <= 40 else 48
                doc = TEMPLATE.format(fonts=fonts, sym=html.escape(e["sym"]), eyebrow=html.escape(e["eyebrow"]),
                                      title=html.escape(t), sub=html.escape(e["sub"]), size=size,
                                      foot="Ajarn Mod · English edition" if e["key"].startswith("en-") else "สอนโดยอาจารย์มด · ภาษาไทย · ฟรี")
                if e["key"].startswith("learn-vector-algebra"):
                    slug = e["key"].removeprefix("learn-vector-algebra").lstrip("-") or "overview"
                    artwork = ROOT / "images/vector-algebra" / f"{slug}.svg"
                    if not artwork.is_file():
                        raise FileNotFoundError(f"Missing vector illustration: {artwork}")
                    doc = doc.replace('<div class="sym">', '<div class="sym" style="display:none">')
                    doc = doc.replace('</head>', '<style>.wrap{right:570px}.eyebrow{font-size:20px;margin-top:34px}h1{font-size:52px}.sub{font-size:24px}.foot{font-size:20px;flex-wrap:wrap;gap:6px}.art{position:absolute;right:28px;top:158px;width:540px;height:330px;object-fit:contain}</style></head>')
                    doc = doc.replace('<div class="bar">', f'<img class="art" src="{origin}/images/vector-algebra/{slug}.svg" alt=""><div class="bar">')
                tmp.write_text(doc, "utf-8")
                # Each key needs a distinct URL: Last-Modified has one-second
                # resolution, so reusing a URL can return the preceding card.
                pg.goto(origin + "/images/og/_tmp.html?key=" + e["key"])
                if pg.locator("h1").text_content() != t:
                    raise RuntimeError(f"Rendered title does not match {e['key']}")
                pg.evaluate("document.fonts.ready")
                pg.wait_for_function("Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)")
                pg.screenshot(path=str(OUT / f"{e['key']}.jpg"), type="jpeg", quality=86)
                print("og", e["key"])
            b.close()
    finally:
        tmp.unlink(missing_ok=True)
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == "__main__":
    main()
