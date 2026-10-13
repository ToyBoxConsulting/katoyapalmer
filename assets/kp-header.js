/* katoyapalmer.com shared header (2026-10-12): pillar dropdowns on desktop, full-screen menu sheet on phones.
   Without JS the dropdown buttons stay inert, and the Menu button links to /links/ (every destination is there). */
(function () {
  var h = document.querySelector('.kp-h');
  if (!h) return;

  // Desktop dropdowns: click/tap or keyboard to open; hover opens on mouse devices.
  var tops = [].slice.call(h.querySelectorAll('.kp-top[aria-controls]'));
  function closeAll(except) {
    tops.forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.classList.remove('open');
    });
  }
  function setOpen(b, open) {
    closeAll(open ? b : null);
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    var p = document.getElementById(b.getAttribute('aria-controls'));
    if (p) p.classList.toggle('open', open);
  }
  var canHover = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  tops.forEach(function (b) {
    var li = b.parentNode, timer;
    b.addEventListener('click', function () { setOpen(b, b.getAttribute('aria-expanded') !== 'true'); });
    if (canHover) {
      li.addEventListener('mouseenter', function () { clearTimeout(timer); setOpen(b, true); });
      li.addEventListener('mouseleave', function () { timer = setTimeout(function () { setOpen(b, false); }, 160); });
    }
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) setOpen(b, false); });
  });
  document.addEventListener('click', function (e) { if (!h.contains(e.target)) closeAll(); });

  // Mobile sheet
  var btn = h.querySelector('.kp-menu-btn'), sheet = document.getElementById('kp-sheet');
  if (btn && sheet) {
    btn.addEventListener('click', function (e) { e.preventDefault(); openSheet(); });
    btn.addEventListener('keydown', function (e) { if (e.key === ' ') { e.preventDefault(); openSheet(); } }); // it's a link styled as a button
    var closeBtn = sheet.querySelector('.kp-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a && a.getAttribute('href').charAt(0) === '#') closeSheet(); // same-page jumps
    });
    sheet.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return; // keep focus inside the open sheet
      var f = sheet.querySelectorAll('a,button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    matchMedia('(min-width:1100px)').addEventListener('change', function (m) { if (m.matches) closeSheet(); });
  }
  function openSheet() {
    sheet.hidden = false;
    sheet.offsetHeight; // let the transition run
    sheet.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('kp-lock');
    var c = sheet.querySelector('.kp-close'); if (c) c.focus();
  }
  function closeSheet() {
    if (!sheet || !sheet.classList.contains('open')) return;
    sheet.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('kp-lock');
    setTimeout(function () { if (!sheet.classList.contains('open')) sheet.hidden = true; }, 220);
    btn.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = tops.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    if (open) { setOpen(open, false); open.focus(); }
    closeSheet();
  });
})();
