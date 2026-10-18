/* Thought, Taste & Presence issue pages (2026-10-17): reading progress, the contents
   sheet on phones, and highlighting the section you're in. Works without it: the
   contents box still opens and every jump link still works. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function () {
    var root = document.documentElement;

    // Keep the TT&P bar just under the shared sticky site header.
    var head = document.querySelector('.kp-h');
    function setTop() { root.style.setProperty('--tp-top', (head ? head.offsetHeight : 0) + 'px'); }
    setTop();
    addEventListener('resize', setTop);

    // Reading progress across the story.
    var bar = document.querySelector('.tp-progress i'), story = document.querySelector('.tp-story');
    if (bar && story) {
      var tick = false;
      var paint = function () {
        tick = false;
        var r = story.getBoundingClientRect(), total = r.height - innerHeight;
        var done = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
        bar.style.transform = 'scaleX(' + done + ')';
      };
      addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(paint); } }, { passive: true });
      paint();
    }

    // Contents: open on desktop rail, closed on phones; the bar button opens a sheet.
    var box = document.querySelector('.tp-rail details');
    if (box && matchMedia('(min-width:1040px)').matches) box.open = true;
    var sheet = document.querySelector('.tp-sheet'), btn = document.querySelector('.tp-bar-btn');
    if (sheet && btn && box) {
      var list = box.querySelector('ol');
      if (list) sheet.appendChild(list.cloneNode(true));
      var setSheet = function (open) {
        sheet.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { var a = sheet.querySelector('a'); if (a) a.focus({ preventScroll: true }); }
      };
      btn.addEventListener('click', function (e) { e.preventDefault(); setSheet(!sheet.classList.contains('open')); });
      sheet.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('.tp-sheet-close')) setSheet(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSheet(false); });
    }

    // Highlight the section in view.
    if ('IntersectionObserver' in window) {
      var links = document.querySelectorAll('.tp-contents a[href^="#"], .tp-sheet a[href^="#"]');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('here', a.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-30% 0px -65% 0px' });
      document.querySelectorAll('.tp-sec[id]').forEach(function (s) { io.observe(s); });
    }
  });
})();
