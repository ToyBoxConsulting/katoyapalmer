/* katoyapalmer.com motion helpers (2026-10-02): the bamboo-O draw (study 05)
   and the timeline count-up (study 03). Does nothing when reduced motion is on. */
(function () {
  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 05: the nav's gold cane ring draws itself once per visit.
  function drawRing() {
    var seen = false;
    try { seen = sessionStorage.getItem('kp_ring_drawn') === '1'; sessionStorage.setItem('kp_ring_drawn', '1'); } catch (e) {}
    if (seen) return;
    var svg = document.querySelector('nav .bo svg');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg', id = 'kpm' + Math.floor(Math.random() * 1e6);
    var defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    var mask = document.createElementNS(NS, 'mask');
    mask.setAttribute('id', id); mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '-10'); mask.setAttribute('y', '-10'); mask.setAttribute('width', '120'); mask.setAttribute('height', '120');
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', '40'); c.setAttribute('fill', 'none');
    c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '12'); c.setAttribute('pathLength', '252');
    c.setAttribute('transform', 'rotate(-90 50 50)');
    c.style.strokeDasharray = '252';
    c.style.animation = 'kpDraw 1.5s cubic-bezier(.6,.05,.25,1) .2s both';
    mask.appendChild(c); defs.appendChild(mask);
    var g = document.createElementNS(NS, 'g'); g.setAttribute('mask', 'url(#' + id + ')');
    [].slice.call(svg.querySelectorAll('path')).forEach(function (p) { g.appendChild(p); });
    svg.insertBefore(g, defs.nextSibling);
    [].slice.call(svg.querySelectorAll('line')).forEach(function (l) { l.style.animation = 'kpFade .5s 1.5s both'; });
  }

  // 03: the gold thread fills and the numbers count up when the timeline scrolls into view.
  function thread() {
    var el = document.querySelector('.thread');
    if (!el || !('IntersectionObserver' in window)) return;
    el.classList.add('armed');
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      el.classList.add('go');
      [].slice.call(el.querySelectorAll('.n[data-to]')).forEach(function (n) {
        var to = +n.getAttribute('data-to'), from = to > 1900 ? 1990 : 0, t0 = performance.now();
        (function step(now) {
          var p = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
          n.textContent = Math.round(from + (to - from) * e);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    io.observe(el);
  }

  function start() { drawRing(); thread(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
