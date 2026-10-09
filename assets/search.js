/* search.js: on-site search for katoyapalmer.com (2026-10-09).
   Vanilla JS, no libraries. Loads /search-index.json (built by tools/build_search_index.py)
   and ranks pages by title, summary, section and body matches. Exposes window.KPSearch. */
(function () {
  "use strict";
  var docs = null, loading = null;

  // Lowercase and straighten curly quotes. Keeps string length so snippet offsets line up.
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function load() {
    if (docs) return Promise.resolve(docs);
    if (!loading) {
      loading = fetch("/search-index.json", { credentials: "same-origin" })
        .then(function (r) { if (!r.ok) throw new Error("index " + r.status); return r.json(); })
        .then(function (data) {
          docs = (data.docs || []).map(function (d) {
            d._t = norm(d.title); d._s = norm(d.summary); d._c = norm(d.section); d._b = norm(d.body);
            return d;
          });
          return docs;
        });
    }
    return loading;
  }

  function terms(q) {
    return norm(q).split(/[^a-z0-9'à-ɏ]+/).map(function (t) { return t.replace(/^'+|'+$/g, ""); })
      .filter(function (t) { return t.length > 1 || /\d/.test(t); });
  }
  function count(hay, t) {
    var n = 0, i = hay.indexOf(t);
    while (i > -1 && n < 40) { n++; i = hay.indexOf(t, i + t.length); }
    return n;
  }

  // Every term must appear somewhere in the page. Title hits weigh most.
  function search(q) {
    var ts = terms(q);
    if (!ts.length || !docs) return [];
    var phrase = norm(q).trim(), out = [];
    docs.forEach(function (d) {
      var score = 0;
      for (var i = 0; i < ts.length; i++) {
        var t = ts[i], a = count(d._t, t), b = count(d._s, t), c = count(d._c, t), e = count(d._b, t);
        if (!(a || b || c || e)) return;
        score += a * 12 + b * 5 + c * 3 + Math.min(e, 15);
      }
      if (ts.length > 1 && (d._t.indexOf(phrase) > -1 || d._b.indexOf(phrase) > -1)) score += 15;
      if (d.kind === "section") score -= 2;
      out.push({ d: d, s: score });
    });
    out.sort(function (x, y) { return y.s - x.s || String(y.d.date || "").localeCompare(String(x.d.date || "")); });
    return out.map(function (o) { return o.d; });
  }

  function highlight(text, ts) {
    var h = esc(text);
    if (!ts.length) return h;
    var re = new RegExp("(" + ts.map(function (t) { return reEsc(esc(t)); }).join("|") + ")", "gi");
    return h.replace(re, "<mark>$1</mark>");
  }

  // ~200 characters of body text around the first match, trimmed to word edges.
  function snippet(d, q) {
    var ts = terms(q), src = d.body || d.summary || "", low = d._b || norm(src), pos = -1;
    ts.forEach(function (t) { var i = low.indexOf(t); if (i > -1 && (pos < 0 || i < pos)) pos = i; });
    if (pos < 0) return highlight(d.summary || src.slice(0, 200), ts);
    var start = Math.max(0, pos - 80), end = Math.min(src.length, pos + 140);
    if (start > 0) { var sp = src.indexOf(" ", start); if (sp > -1 && sp < pos) start = sp + 1; }
    if (end < src.length) { var ep = src.lastIndexOf(" ", end); if (ep > pos) end = ep; }
    return (start > 0 ? "…" : "") + highlight(src.slice(start, end), ts) + (end < src.length ? "…" : "");
  }

  function meta(d) {
    var bits = [d.section];
    if (d.dateLabel) bits.push(d.dateLabel);
    if (d.minutes) bits.push(d.minutes + " min read");
    return bits.filter(Boolean).map(esc).join(" · ");
  }

  function renderList(list, q) {
    return list.map(function (d) {
      return '<li class="sr-item"><a class="sr-link" href="' + esc(d.url) + '">' +
        '<span class="sr-meta">' + meta(d) + "</span>" +
        '<span class="sr-title">' + highlight(d.title, terms(q)) + "</span></a>" +
        '<p class="sr-snip">' + snippet(d, q) + "</p></li>";
    }).join("");
  }

  window.KPSearch = { load: load, search: search, snippet: snippet, renderList: renderList, esc: esc };
})();
