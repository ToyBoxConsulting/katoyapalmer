#!/usr/bin/env python3
"""Rebuild /sitemap.xml for katoyapalmer.com.

Run:  python tools/build_sitemap.py   (from anywhere, after content changes)

Lists every public page: skips redirect stubs (meta refresh, e.g. /recipes/*, /reviews/*),
noindex pages (e.g. /search/) and 404.html. lastmod is the date of the last git commit
that touched the file, or today if the file has uncommitted changes. Never a future date.
"""
import datetime as _dt
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.katoyapalmer.com"
SKIP_DIRS = {"tools", "assets", ".git", ".github"}


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout


def url_for(rel):
    if rel == "index.html":
        return SITE + "/"
    if rel.endswith("/index.html"):
        return SITE + "/" + rel[: -len("index.html")]
    return SITE + "/" + rel


def priority(rel):
    if rel == "index.html":
        return "1.0"
    if rel.endswith("index.html") or rel.count("/") == 0:
        return "0.5" if rel in ("privacy.html", "terms.html", "cookies.html") else "0.8"
    return "0.6"


def main():
    today = _dt.date.today().isoformat()
    dirty = {line[3:].strip().strip('"') for line in git("status", "--porcelain", "--untracked-files=all").splitlines()}
    rows = []
    for fp in sorted(ROOT.rglob("*.html")):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.split("/")[0] in SKIP_DIRS or rel == "404.html":
            continue
        s = fp.read_text(encoding="utf-8")
        if re.search(r'http-equiv="refresh"', s, re.I) or re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I):
            continue
        if rel in dirty or any(rel.startswith(d.rstrip("/") + "/") for d in dirty if d.endswith("/")):
            last = today
        else:
            last = (git("log", "-1", "--format=%as", "--", rel).strip() or today)
        rows.append((url_for(rel), min(last, today), priority(rel)))
    rows.sort(key=lambda r: (r[2] != "1.0", r[0]))
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, last, pr in rows:
        out += ["  <url>", "    <loc>%s</loc>" % loc, "    <lastmod>%s</lastmod>" % last,
                "    <priority>%s</priority>" % pr, "  </url>"]
    out.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print("sitemap.xml: %d URLs" % len(rows))


if __name__ == "__main__":
    main()
