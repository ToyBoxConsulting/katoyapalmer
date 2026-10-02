/*
 * katoyapalmer.com cookie consent: one shared file for every page (2026-10-02).
 * Replaces the per-page inline copies, which had drifted: three pages carried a
 * placeholder GA4 ID, and "Customize" threw on a missing tb-cat-b2b checkbox.
 *
 * Posture (unchanged from the inline version):
 *  - Cloudflare Web Analytics, GA4 (Consent Mode v2, default denied) and Clarity
 *    (cookieless mode) load on every visit.
 *  - Analytics consent upgrades GA4 + Clarity and loads the Metricool tracker.
 *  - Global Privacy Control is honored.
 * Footer link: <a href="#" onclick="tbReopenConsent(); return false;">Cookie settings</a>
 */
(function () {
  var CONFIG = {
    ga4MeasurementId: 'G-CMWS1E09J7',
    clarityProjectId: 'wzujhv34kc',
    cloudflareAnalyticsToken: '9566326c26dc4f728f2136efbd6a8d38',
    metricoolHash: 'bd8130d8f1ec32c4e0ea80fbe6448362',
    cookieName: 'toybox_consent',
    cookieDays: 365
  };

  // ===== Cookie helpers =====
  function readCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : null;
  }
  function writeCookie(name, value, days) {
    var d = new Date(); d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
  }
  function readConsent() {
    var raw = readCookie(CONFIG.cookieName);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function saveConsent(c) {
    c.ts = new Date().toISOString();
    c.v = 2;
    writeCookie(CONFIG.cookieName, JSON.stringify(c), CONFIG.cookieDays);
  }
  function gpcOn() { return navigator.globalPrivacyControl === true; }

  // ===== Tracker loaders =====
  function loadGA4() {
    if (window.__tbGA4Loaded) return;
    window.__tbGA4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4MeasurementId;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', CONFIG.ga4MeasurementId, { anonymize_ip: true });
  }
  function loadClarity() {
    if (window.__tbClarityLoaded) return;
    window.__tbClarityLoaded = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CONFIG.clarityProjectId);
  }
  function loadCloudflare() {
    if (window.__tbCFLoaded) return;
    window.__tbCFLoaded = true;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', '{"token": "' + CONFIG.cloudflareAnalyticsToken + '"}');
    document.body.appendChild(s);
  }
  function loadMetricool() {
    if (window.__tbMetricoolLoaded) return;
    window.__tbMetricoolLoaded = true;
    var s = document.createElement('script');
    s.src = 'https://tracker.metricool.com/resources/be.js';
    s.onload = function () { if (window.beTracker) window.beTracker.t({ hash: CONFIG.metricoolHash }); };
    document.head.appendChild(s);
  }
  function applyConsent(c) {
    if (c && c.analytics) {
      loadMetricool();
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
      if (window.clarity) window.clarity('consent');
    }
  }

  // ===== UI =====
  var CSS =
    '#tb-cookie-banner,#tb-cookie-modal{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a1a;line-height:1.5;box-sizing:border-box}' +
    '#tb-cookie-banner *,#tb-cookie-modal *{box-sizing:border-box}' +
    '#tb-cookie-banner{position:fixed;bottom:16px;left:16px;right:16px;max-width:720px;margin:0 auto;background:#fff;border:1px solid #e3dbcd;border-radius:10px;padding:18px 22px;box-shadow:0 18px 40px rgba(0,0,0,.18);z-index:9999;display:none}' +
    '#tb-cookie-banner.visible{display:block}' +
    '#tb-cookie-banner p{margin:0 0 14px;font-size:14.5px;color:#333}' +
    '#tb-cookie-banner a,#tb-cookie-modal a{color:#A81F1A;text-decoration:underline}' +
    '.tb-cookie-actions,.tb-modal-actions{display:flex;gap:10px;flex-wrap:wrap}' +
    '.tb-modal-actions{justify-content:flex-end;margin-top:18px}' +
    '#tb-cookie-banner button,#tb-cookie-modal button{font:inherit;font-size:13.5px;font-weight:600;padding:10px 18px;border-radius:40px;cursor:pointer;border:1px solid #c4b9a8;background:#fff;color:#1a1a1a}' +
    '#tb-cookie-banner button:hover,#tb-cookie-modal button:hover{border-color:#1a1a1a}' +
    '#tb-cookie-banner .tb-btn-primary,#tb-cookie-modal .tb-btn-primary{background:#161210;color:#fff;border-color:#161210}' +
    '#tb-cookie-banner button:focus-visible,#tb-cookie-modal button:focus-visible,#tb-cookie-modal input:focus-visible{outline:2px solid #C6A24C;outline-offset:2px}' +
    '#tb-cookie-modal{position:fixed;inset:0;background:rgba(22,18,16,.6);display:none;align-items:center;justify-content:center;z-index:10000;padding:16px}' +
    '#tb-cookie-modal.visible{display:flex}' +
    '#tb-cookie-modal .tb-modal-inner{background:#fff;border-radius:10px;max-width:540px;width:100%;padding:26px;max-height:90vh;overflow-y:auto}' +
    '#tb-cookie-modal h2{margin:0 0 10px;font-size:20px}' +
    '#tb-cookie-modal p{margin:0 0 16px;font-size:14px;color:#333}' +
    '#tb-cookie-modal .tb-cat{border:1px solid #e3dbcd;border-radius:8px;padding:14px 16px;margin-bottom:12px;display:flex;gap:14px;align-items:flex-start}' +
    '#tb-cookie-modal .tb-cat strong{display:block;margin-bottom:4px;font-size:14.5px}' +
    '#tb-cookie-modal .tb-cat span span{font-size:13px;color:#555}' +
    '#tb-cookie-modal input[type=checkbox]{width:18px;height:18px;margin-top:3px;flex:none}' +
    '@media (max-width:520px){.tb-cookie-actions button{flex:1 1 auto}}';

  var HTML =
    '<div id="tb-cookie-banner" role="region" aria-label="Cookie consent">' +
      '<p>I use cookies to run this site and, with your OK, to see how people use it. See the <a href="/cookies.html">Cookie Notice</a> and <a href="/privacy.html">Privacy Policy</a>.</p>' +
      '<div class="tb-cookie-actions">' +
        '<button type="button" class="tb-btn-primary" id="tb-accept-all">Accept all</button>' +
        '<button type="button" id="tb-reject-all">Reject non-essential</button>' +
        '<button type="button" id="tb-customize">Customize</button>' +
      '</div>' +
    '</div>' +
    '<div id="tb-cookie-modal" role="dialog" aria-modal="true" aria-labelledby="tb-modal-title">' +
      '<div class="tb-modal-inner">' +
        '<h2 id="tb-modal-title">Cookie settings</h2>' +
        '<p>Choose what to allow. You can change this anytime from "Cookie settings" in the footer.</p>' +
        '<label class="tb-cat"><input type="checkbox" checked disabled /><span><strong>Strictly necessary (always on)</strong><span>Runs the site and remembers this choice.</span></span></label>' +
        '<label class="tb-cat"><input type="checkbox" id="tb-cat-analytics" /><span><strong>Analytics</strong><span>Google Analytics 4, Microsoft Clarity, Cloudflare Web Analytics and Metricool, to understand how the site is used.</span></span></label>' +
        '<div class="tb-modal-actions">' +
          '<button type="button" id="tb-modal-cancel">Cancel</button>' +
          '<button type="button" class="tb-btn-primary" id="tb-modal-save">Save preferences</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var lastFocus = null;
  function $(id) { return document.getElementById(id); }
  function showModal(c) {
    $('tb-cat-analytics').checked = !!(c && c.analytics);
    lastFocus = document.activeElement;
    $('tb-cookie-modal').classList.add('visible');
    $('tb-cat-analytics').focus();
  }
  function hideModal() {
    $('tb-cookie-modal').classList.remove('visible');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function hideBanner() { $('tb-cookie-banner').classList.remove('visible'); }

  function init() {
    // Remove any leftover inline banner from an older page copy.
    ['tb-cookie-banner', 'tb-cookie-modal'].forEach(function (id) { var el = $(id); if (el) el.parentNode.removeChild(el); });
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var wrap = document.createElement('div'); wrap.innerHTML = HTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    loadCloudflare();
    loadGA4();
    loadClarity();

    var existing = readConsent();
    if (existing) applyConsent(existing);
    else $('tb-cookie-banner').classList.add('visible');

    $('tb-accept-all').addEventListener('click', function () {
      var c = { analytics: true }; saveConsent(c); applyConsent(c); hideBanner();
    });
    $('tb-reject-all').addEventListener('click', function () {
      saveConsent({ analytics: false }); hideBanner();
    });
    $('tb-customize').addEventListener('click', function () { showModal(readConsent()); });
    $('tb-modal-cancel').addEventListener('click', hideModal);
    $('tb-modal-save').addEventListener('click', function () {
      var c = { analytics: $('tb-cat-analytics').checked };
      saveConsent(c); applyConsent(c); hideModal(); hideBanner();
    });
    $('tb-cookie-modal').addEventListener('keydown', function (e) { if (e.key === 'Escape') hideModal(); });

    window.tbReopenConsent = function () { showModal(readConsent()); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
