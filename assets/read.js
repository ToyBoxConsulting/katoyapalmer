/* read.js: the /read/ hub (2026-10-09). Carousel, section filters and live search.
   Without JS the page still works: the carousel is a stacked list, every piece shows,
   and the search box submits to /search/. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Start here carousel ---------- */
  var car = document.querySelector("[data-carousel]");
  if (car) {
    var track = car.querySelector(".rd-track");
    var slides = Array.prototype.slice.call(track.children);
    var prev = car.querySelector("[data-prev]");
    var next = car.querySelector("[data-next]");
    var status = car.querySelector(".rd-status");
    var controls = car.querySelector(".rd-controls");
    car.classList.add("is-carousel");
    controls.hidden = false;
    track.setAttribute("tabindex", "0");

    var index = function () {
      var x = track.scrollLeft, best = 0, bestD = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.offsetLeft - x);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    };
    var update = function () {
      var i = index();
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
      status.textContent = (i + 1) + " of " + slides.length;
    };
    var go = function (i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    };
    prev.addEventListener("click", function () { go(index() - 1); });
    next.addEventListener("click", function () { go(index() + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.target !== track) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(index() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index() - 1); }
    });
    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Section filters ---------- */
  var chips = document.querySelector(".rd-chips");
  var list = document.querySelector(".rd-list");
  var countEl = document.querySelector(".rd-count");
  if (chips && list) {
    chips.hidden = false;
    var items = Array.prototype.slice.call(list.querySelectorAll(".rd-item"));
    var buttons = Array.prototype.slice.call(chips.querySelectorAll("button"));
    var apply = function (f) {
      var n = 0;
      items.forEach(function (li) {
        var show = f === "all" || (" " + li.getAttribute("data-chip") + " ").indexOf(" " + f + " ") > -1;
        li.hidden = !show;
        if (show) n++;
      });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === f)); });
      if (countEl) countEl.textContent = n === 1 ? "1 piece" : n + " pieces";
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); });
    });
  }

  /* ---------- Live search ---------- */
  var form = document.querySelector(".rd-search");
  var out = document.getElementById("rd-results");
  if (form && out && window.KPSearch) {
    var input = form.querySelector("input[name=q]");
    var timer = null;
    var run = function () {
      var q = input.value.trim();
      if (q.length < 2) { out.hidden = true; out.innerHTML = ""; return; }
      window.KPSearch.load().then(function () {
        var res = window.KPSearch.search(q);
        var top = res.slice(0, 6);
        var head = '<p class="sr-count" role="status">' + (res.length ? res.length + (res.length === 1 ? " result" : " results") : "No results") +
          " for “" + window.KPSearch.esc(q) + "”</p>";
        var more = res.length > top.length
          ? '<p class="sr-more"><a href="/search/?q=' + encodeURIComponent(q) + '">See all ' + res.length + " results →</a></p>" : "";
        out.innerHTML = head + (top.length ? '<ol class="sr-list">' + window.KPSearch.renderList(top, q) + "</ol>" : "") + more;
        out.hidden = false;
      }).catch(function () { out.hidden = true; });
    };
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 160); });
  }
})();
