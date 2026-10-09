# Site tools

Small Python scripts (standard library only) that rebuild generated files. Run them from
the repo root with Python 3.

## When content changes, re-run both

Any time you add a page, or change the words, title, date or description of an essay,
recipe, review, letter or section page:

```
python tools/build_search_index.py
python tools/build_sitemap.py
```

Then commit the outputs along with the page.

| Script | Writes | What it is for |
|---|---|---|
| `build_search_index.py` | `search-index.json`, `llms-full.txt` | The on-site search (`/search/` and the box on `/read/`) and the full-text file for AI assistants |
| `build_sitemap.py` | `sitemap.xml` | Every public page with its last-modified date. Skips redirect stubs (`/recipes/*`, `/reviews/*`), `noindex` pages (`/search/`) and `404.html` |

If you skip the index step, search still works but will not find the new or changed page.

## Hand-kept files (not generated)

- `/read/index.html`: the Read hub. A new essay needs a row added to the list (newest first,
  with its section chip, date, reading time and blurb). The "Start here" carousel is three
  fixed picks.
- `/llms.txt`: the overview for AI assistants. Add a line for each new essay.
- `/robots.txt`: allows every crawler, including AI crawlers, and points to the sitemap.

## Reading time

Reading time is the essay's word count divided by 230, rounded up.
