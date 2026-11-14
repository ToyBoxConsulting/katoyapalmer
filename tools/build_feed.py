#!/usr/bin/env python3
"""Rebuild the RSS feeds for katoyapalmer.com.

Run:  python tools/build_feed.py   (from anywhere, after content changes)

Writes two RSS 2.0 feeds:
  /feed.xml          every published piece, newest first (essays, letters, recipes, reviews)
  /letters/feed.xml  Thought, Taste & Presence only

A page is included when it carries an <meta property="article:published_time"> or a
JSON-LD "datePublished". Hub pages, redirect stubs, noindex pages and 404 are skipped.

It also adds the feed autodiscovery <link> to every public page, so browsers and readers
find the feed on their own. The insert is idempotent: running twice changes nothing.
"""
import datetime as _dt
import html
import re
import subprocess
from email.utils import format_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.katoyapalmer.com"
SKIP_DIRS = {"tools", "assets", ".git", ".github"}
TITLE = "Katoya Palmer"
DESC = ("Essays, recipes, reviews and the weekly letter Thought, Taste & Presence, "
        "from Katoya Palmer.")
LETTERS_TITLE = "Thought, Taste & Presence"
LETTERS_DESC = ("Katoya Palmer's weekly letter: one Monday letter with everything she "
                "shared that week, across her consulting work, her writing and her kitchen.")
MAX_ITEMS = 40

SECTIONS = {
    "letters": "Thought, Taste & Presence",
    "five-windows": "Five Windows",
    "mindfulness": "Mindfulness in the Middle",
    "journal": "Journal",
    "sznd": "SZND by Katoya",
    "lipstick": "Lipstick on My Fork",
    "playbook": "Playbooks",
    "parents": "For parents",
}

AUTODISCOVERY = (
    '<link rel="alternate" type="application/rss+xml" title="%s" href="%s/feed.xml" />'
    % (html.escape(TITLE, quote=True), SITE)
)


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout


def meta(s, *patterns):
    for p in patterns:
        m = re.search(p, s, re.I | re.S)
        if m:
            return html.unescape(m.group(1)).strip()
    return ""


SITE_SUFFIXES = ("Katoya Palmer", "Thought, Taste & Presence", "SZND by Katoya",
                 "Lipstick on My Fork", "Mindfulness in the Middle", "Five Windows")


def clean_title(t):
    """Drop the trailing " | <site or brand>" a page title carries for search results."""
    while " | " in t:
        head, _, tail = t.rpartition(" | ")
        if not tail.startswith(SITE_SUFFIXES):
            break
        t = head
    return t.strip()


def public_pages():
    for fp in sorted(ROOT.rglob("*.html")):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.split("/")[0] in SKIP_DIRS or rel == "404.html":
            continue
        s = fp.read_text(encoding="utf-8")
        if re.search(r'http-equiv="refresh"', s, re.I):
            continue
        if re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I):
            continue
        yield fp, rel, s


def url_for(rel):
    if rel == "index.html":
        return SITE + "/"
    if rel.endswith("/index.html"):
        return SITE + "/" + rel[: -len("index.html")]
    return SITE + "/" + rel


def rfc822(datestr):
    d = _dt.date.fromisoformat(datestr)
    # Noon Pacific, so a date never reads as the day before in another timezone.
    return format_datetime(_dt.datetime(d.year, d.month, d.day, 12, 0, 0,
                                        tzinfo=_dt.timezone(_dt.timedelta(hours=-8))))


def collect():
    items = []
    for fp, rel, s in public_pages():
        date = meta(s,
                    r'<meta property="article:published_time" content="(\d{4}-\d{2}-\d{2})',
                    r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})')
        if not date:
            continue
        # The <title> reads better in a reader ("Issue 5: A lip print...") than og:title.
        title = clean_title(meta(s,
                                 r"<title>(.*?)</title>",
                                 r'<meta property="og:title" content="([^"]+)"'))
        desc = meta(s,
                    r'<meta name="description" content="([^"]+)"',
                    r'<meta property="og:description" content="([^"]+)"')
        if not title:
            continue
        section = SECTIONS.get(rel.split("/")[0], "")
        items.append({"rel": rel, "url": url_for(rel), "title": title,
                      "desc": desc, "date": date, "section": section})
    items.sort(key=lambda i: (i["date"], i["rel"]), reverse=True)
    return items


def write_feed(path, feed_url, title, desc, items):
    now = format_datetime(_dt.datetime.now(_dt.timezone.utc))
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
           "  <channel>",
           "    <title>%s</title>" % html.escape(title),
           "    <link>%s</link>" % SITE,
           "    <description>%s</description>" % html.escape(desc),
           "    <language>en-us</language>",
           "    <lastBuildDate>%s</lastBuildDate>" % now,
           '    <atom:link href="%s" rel="self" type="application/rss+xml" />' % feed_url,
           "    <copyright>Copyright %d Katoya Raquell Palmer</copyright>" % _dt.date.today().year]
    for it in items[:MAX_ITEMS]:
        out += ["    <item>",
                "      <title>%s</title>" % html.escape(it["title"]),
                "      <link>%s</link>" % it["url"],
                '      <guid isPermaLink="true">%s</guid>' % it["url"],
                "      <pubDate>%s</pubDate>" % rfc822(it["date"])]
        if it["section"]:
            out.append("      <category>%s</category>" % html.escape(it["section"]))
        if it["desc"]:
            out.append("      <description>%s</description>" % html.escape(it["desc"]))
        out.append("    </item>")
    out += ["  </channel>", "</rss>"]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")


def add_autodiscovery():
    touched = 0
    for fp, rel, s in public_pages():
        if 'type="application/rss+xml"' in s:
            continue
        m = re.search(r'[ \t]*<link rel="canonical"[^>]*>\n', s)
        if m:
            new = s[: m.end()] + "<link rel=\"alternate\" type=\"application/rss+xml\" title=\"%s\" href=\"%s/feed.xml\" />\n" % (
                html.escape(TITLE, quote=True), SITE)
            new += s[m.end():]
        else:
            m = re.search(r"</title>\n", s)
            if not m:
                continue
            new = s[: m.end()] + AUTODISCOVERY + "\n" + s[m.end():]
        fp.write_text(new, encoding="utf-8", newline="\n")
        touched += 1
    return touched


def main():
    items = collect()
    write_feed(ROOT / "feed.xml", SITE + "/feed.xml", TITLE, DESC, items)
    letters = [i for i in items if i["rel"].startswith("letters/")]
    write_feed(ROOT / "letters" / "feed.xml", SITE + "/letters/feed.xml",
               LETTERS_TITLE, LETTERS_DESC, letters)
    touched = add_autodiscovery()
    print("feed.xml: %d items (of %d) | letters/feed.xml: %d items | autodiscovery added to %d pages"
          % (min(len(items), MAX_ITEMS), len(items), min(len(letters), MAX_ITEMS), touched))


if __name__ == "__main__":
    main()
