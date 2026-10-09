#!/usr/bin/env python3
"""Build /search-index.json and /llms-full.txt for katoyapalmer.com.

Run from anywhere:   python tools/build_search_index.py
Re-run it whenever a page is added or its words change, then commit the two outputs.

Reads every public .html page in the repo (skips redirect stubs, noindex pages, 404).
For essays, recipes, reviews and letters it stores the full plain text; for section
pages it stores a short excerpt. Standard library only.
"""
import datetime as _dt
import html
import json
import math
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.katoyapalmer.com"
SKIP_DIRS = {"tools", "assets", ".git", ".github", "node_modules"}
SKIP_FILES = {"404.html"}
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]
BLOCK = {"p", "div", "li", "h1", "h2", "h3", "h4", "h5", "blockquote", "figcaption", "tr", "br", "section", "article", "header", "ol", "ul"}


class TextGrab(HTMLParser):
    """Plain text with paragraph breaks. Skips script/style/nav/footer/noscript/svg/form."""
    SKIP = {"script", "style", "nav", "footer", "noscript", "svg", "form", "button", "template", "aside"}

    def __init__(self, skip_aside=True):
        super().__init__(convert_charrefs=True)
        self.out, self.depth = [], 0
        self.skip = set(self.SKIP) if skip_aside else set(self.SKIP) - {"aside"}

    def handle_starttag(self, tag, attrs):
        if tag in self.skip:
            self.depth += 1
        elif tag in BLOCK and not self.depth:
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in self.skip:
            self.depth = max(0, self.depth - 1)
        elif tag in BLOCK and not self.depth:
            self.out.append("\n")

    def handle_data(self, data):
        if not self.depth:
            self.out.append(data)

    def text(self):
        t = "".join(self.out).replace("\xa0", " ")
        t = re.sub(r"[ \t\r\f\v]+", " ", t)
        t = re.sub(r" *\n *", "\n", t)
        return re.sub(r"\n{2,}", "\n\n", t).strip()


def plain(fragment, skip_aside=True):
    p = TextGrab(skip_aside)
    p.feed(fragment)
    return p.text()


def first(pat, s):
    m = re.search(pat, s, re.S)
    return html.unescape(m.group(1)).strip() if m else ""


def div_block(s, cls):
    m = re.search(r'<div class="%s">' % re.escape(cls), s)
    if not m:
        return ""
    depth = 0
    for t in re.finditer(r"<div\b|</div>", s[m.start():]):
        depth += -1 if t.group(0) == "</div>" else 1
        if depth == 0:
            return s[m.start():m.start() + t.end()]
    return ""


def kind_and_section(rel):
    parts = rel.split("/")
    if parts[0] == "five-windows":
        return ("section" if parts[-1] == "index.html" else "essay"), "Five Windows"
    if parts[0] == "mindfulness" or rel == "mindfulness.html":
        return ("essay" if len(parts) > 1 else "section"), "Mindfulness in the Middle"
    if parts[0] == "journal":
        return ("section" if parts[-1] == "index.html" else "essay"), "Journal"
    if parts[0] == "sznd" or rel == "sznd.html":
        return ("recipe" if len(parts) > 1 else "section"), "SZND by Katoya"
    if parts[0] == "lipstick" or rel == "lipstick.html":
        return ("review" if len(parts) > 1 else "section"), "Lipstick on My Fork"
    if parts[0] == "letters":
        return ("section" if parts[-1] == "index.html" else "letter"), "Letters"
    if parts[0] == "read":
        return "section", "Read"
    return "page", "Katoya Palmer"


def date_label(d):
    if not d:
        return ""
    if len(d) == 7:
        y, m = d.split("-")
        return "%s %s" % (MONTHS[int(m) - 1], y)
    y, m, dd = d[:10].split("-")
    return "%s %d, %s" % (MONTHS[int(m) - 1][:3], int(dd), y)


def url_for(rel):
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def page_title(s, kind):
    h1 = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", first(r"<h1[^>]*>(.*?)</h1>", s)))).strip()
    t = first(r"<title>(.*?)</title>", s)
    if kind in ("essay", "recipe", "review", "letter") and h1:
        return h1.rstrip(".") if kind == "recipe" else h1
    return re.split(r"\s+[—·|-]\s+Katoya Palmer$", t)[0] if t else h1


def collect():
    docs = []
    for fp in sorted(ROOT.rglob("*.html")):
        rel = fp.relative_to(ROOT).as_posix()
        if rel.split("/")[0] in SKIP_DIRS or rel in SKIP_FILES:
            continue
        s = fp.read_text(encoding="utf-8")
        if re.search(r'http-equiv="refresh"', s, re.I) or re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I):
            continue
        kind, section = kind_and_section(rel)
        date = (first(r'article:published_time" content="([^"]+)"', s)
                or first(r'"datePublished":\s*"([^"]+)"', s)
                or first(r'<time datetime="([^"]+)"', s))
        if kind == "essay":
            cat = re.sub(r"<[^>]+>", "", first(r'<div class="cat">(.*?)</div>', s))
            if section == "Journal" and " · " in cat:
                section = "Journal · " + cat.split(" · ", 1)[1]
            elif section == "Five Windows" and " · " in cat:
                section = "Five Windows · " + cat.split(" · ", 1)[1]
            body = div_block(s, "body")
            body = re.sub(r'<nav class="kp-next".*?</nav>', " ", body, flags=re.S)
            body = re.sub(r'<div class="back-to-media">.*?</div>', " ", body, flags=re.S)
            text = plain(body)
        else:
            m = re.search(r"<main\b.*?</main>", s, re.S) or re.search(r"<body\b.*?</body>", s, re.S)
            text = plain(m.group(0) if m else s, skip_aside=(kind not in ("recipe", "review", "letter")))
            if kind in ("section", "page"):
                text = text[:700].rsplit(" ", 1)[0]
        words = len(re.findall(r"[A-Za-z0-9'’-]+", text))
        d = {
            "url": url_for(rel),
            "title": page_title(s, kind),
            "section": section,
            "kind": kind,
            "date": date[:10] if date else "",
            "dateLabel": date_label(date[:10] if len(date) >= 10 else date) if date and kind != "section" else "",
            "summary": first(r'<meta name="description" content="([^"]*)"', s),
            "body": re.sub(r"\s+", " ", text),
            "_text": text,
        }
        if kind in ("essay", "letter", "review"):
            d["minutes"] = max(1, math.ceil(words / 230))
        docs.append(d)
    return docs


def write_llms_full(docs):
    order = {"essay": 0, "letter": 1, "recipe": 2, "review": 3}
    long = [d for d in docs if d["kind"] in order]
    long.sort(key=lambda d: (order[d["kind"]], d["section"], d["date"]))
    out = ["# Katoya Raquell Palmer: full text of the writing on katoyapalmer.com",
           "",
           "> Every essay, letter, recipe and review on https://www.katoyapalmer.com, as plain text. "
           "Written by Katoya Raquell Palmer. When quoting, cite the title and the page URL, and credit "
           "Katoya Raquell Palmer. Generated by tools/build_search_index.py.",
           ""]
    for d in long:
        out += ["---", "", "## " + d["title"], "",
                "- URL: " + SITE + d["url"],
                "- Section: " + d["section"],
                "- Published: " + (d["dateLabel"] or "n/a"),
                "- Author: Katoya Raquell Palmer", "", d["_text"], ""]
    (ROOT / "llms-full.txt").write_text("\n".join(out).rstrip() + "\n", encoding="utf-8", newline="\n")
    return len(long)


def main():
    docs = collect()
    full = write_llms_full(docs)
    for d in docs:
        d.pop("_text", None)
        if d["kind"] in ("section", "page"):
            d["body"] = d["body"][:700]
    payload = {"generated": _dt.date.today().isoformat(), "count": len(docs), "docs": docs}
    (ROOT / "search-index.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                                            encoding="utf-8", newline="\n")
    print("search-index.json: %d pages, llms-full.txt: %d long pieces" % (len(docs), full))


if __name__ == "__main__":
    main()
