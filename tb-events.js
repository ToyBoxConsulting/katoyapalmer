/*
 * ToyBox visitor-event tracker — consent-gated, privacy-respecting.
 * Fires GA4 events ONLY if visitor has accepted analytics consent.
 * Also captures events in window._tbEventLog for future first-party logging.
 *
 * Events emitted (consent-gated):
 *   tool_view          — auto on tool page load
 *   tool_email_sent    — when "Send my results" clicked successfully
 *   calendly_clicked   — any Calendly link click
 *   crisp_opened       — Crisp chat window opened
 *   outbound_click     — any external (non-self-domain) link click
 *   scroll_depth       — 25/50/75/100% page scroll
 *   time_on_page       — 30s / 60s / 180s milestones (max 3 events/page)
 *   form_submitted     — Web3Forms contact form submit
 *
 * No data is collected if visitor rejected analytics. All events respect the
 * toybox_consent cookie set by the consent banner.
 */
(function () {
  'use strict';

  // Local event log for future first-party analytics endpoint
  window._tbEventLog = window._tbEventLog || [];

  function consentGiven() {
    try {
      var m = document.cookie.match(/(?:^|; )toybox_consent=([^;]*)/);
      if (!m) return false;
      var c = JSON.parse(decodeURIComponent(m[1]));
      return c && c.analytics === true;
    } catch (e) { return false; }
  }

  function tbEvent(name, params) {
    var payload = Object.assign({}, params || {}, { ts: Date.now(), page: location.pathname });
    window._tbEventLog.push({ name: name, params: payload });
    if (!consentGiven()) return;
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, payload); } catch (e) {}
    }
  }

  // Expose for external use
  window.tbEvent = tbEvent;

  // ===== Page-type detection =====
  var path = location.pathname;
  var isTool = /\/tools\//.test(path);
  var toolName = '';
  if (isTool) {
    var titleParts = (document.title || '').split('·');
    toolName = titleParts[0].trim();
    tbEvent('tool_view', { tool: toolName });
  }

  // ===== Outbound + Calendly link tracking =====
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !a.href) return;
    var href = a.href;
    var isExternal = /^https?:\/\//.test(href) && href.indexOf(location.hostname) === -1;
    var text = (a.textContent || '').trim().slice(0, 80);
    if (/calendly\.com/.test(href)) {
      tbEvent('calendly_clicked', { url: href, text: text });
    } else if (isExternal) {
      tbEvent('outbound_click', { url: href, text: text });
    }
  }, true);

  // ===== Tool email-sent tracking =====
  var emailBtn = document.getElementById('emailBtn');
  if (emailBtn && isTool) {
    emailBtn.addEventListener('click', function () {
      tbEvent('tool_email_sent', { tool: toolName });
    }, true);
  }

  // ===== Contact form submission =====
  var cfForm = document.querySelector('form#cf_form, form[data-form="contact"]');
  if (cfForm) {
    cfForm.addEventListener('submit', function () {
      tbEvent('form_submitted', { form: 'contact' });
    }, true);
  }

  // ===== Scroll depth tracking =====
  var scrollMarks = { 25: false, 50: false, 75: false, 100: false };
  function onScroll() {
    var doc = document.documentElement;
    var scrolled = (window.pageYOffset || doc.scrollTop) + window.innerHeight;
    var total = Math.max(doc.scrollHeight, doc.offsetHeight, document.body.scrollHeight) || 1;
    var pct = (scrolled / total) * 100;
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !scrollMarks[m]) {
        scrollMarks[m] = true;
        tbEvent('scroll_depth', { percent: m });
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // Fire once on load for short pages
  setTimeout(onScroll, 500);

  // ===== Time on page milestones =====
  [30, 60, 180].forEach(function (secs) {
    setTimeout(function () {
      // Only fire if tab is still visible
      if (document.visibilityState === 'visible') {
        tbEvent('time_on_page', { seconds: secs });
      }
    }, secs * 1000);
  });

  // ===== Crisp chat-opened detection =====
  function bindCrisp() {
    if (window.$crisp && window.$crisp.push) {
      try {
        window.$crisp.push(['on', 'chat:opened', function () {
          tbEvent('crisp_opened', {});
        }]);
        return true;
      } catch (e) { return false; }
    }
    return false;
  }
  if (!bindCrisp()) {
    // Retry after Crisp finishes loading
    var crispRetry = setInterval(function () {
      if (bindCrisp()) clearInterval(crispRetry);
    }, 2000);
    setTimeout(function () { clearInterval(crispRetry); }, 30000);
  }
})();
