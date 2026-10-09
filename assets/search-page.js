/* search-page.js: drives /search/?q= (2026-10-09). Needs assets/search.js first. */
(function () {
  "use strict";
  var input = document.getElementById("sq");
  var out = document.getElementById("search-results");
  if (!input || !out || !window.KPSearch) return;
  var q = "";
  try { q = new URLSearchParams(window.location.search).get("q") || ""; } catch (e) { q = ""; }
  q = q.trim();
  if (q) input.value = q;
  if (!q) { out.innerHTML = '<p class="sr-count">Type a word or two above: a topic, a place, a recipe, a person.</p>'; return; }
  out.innerHTML = '<p class="sr-count" role="status">Searching…</p>';
  window.KPSearch.load().then(function () {
    var res = window.KPSearch.search(q);
    var esc = window.KPSearch.esc;
    document.title = "“" + q + "” · Search · Katoya Palmer";
    out.innerHTML = '<p class="sr-count" role="status">' +
      (res.length ? res.length + (res.length === 1 ? " result" : " results") : "No results") +
      " for “" + esc(q) + "”</p>" +
      (res.length ? '<ol class="sr-list">' + window.KPSearch.renderList(res, q) + "</ol>"
        : '<p class="sr-empty">Try a shorter word, or <a href="/read/">browse everything on the Read page</a>.</p>');
  }).catch(function () {
    out.innerHTML = '<p class="sr-count">Search is not available right now. <a href="/read/">Browse everything on the Read page</a>.</p>';
  });
})();
