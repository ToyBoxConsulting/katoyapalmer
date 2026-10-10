/*
 * Share row for katoyapalmer.com essays, recipes, reviews and letters.
 * Placement: inside [data-share] if the page has one, otherwise just before the
 * page's call-to-action band (.more) or the footer.
 * Phones with a native share sheet get one "Share" button (navigator.share);
 * everyone gets Facebook, LinkedIn, X, Email and Copy link.
 * Shared links carry utm_source=<network>&utm_medium=social&utm_campaign=share_button
 * so GA4 can attribute visits. A GA4 "share" event fires only after analytics consent,
 * the same rule as /tb-events.js.
 */
(function () {
  'use strict';

  function meta(sel) {
    var el = document.querySelector(sel);
    return el ? (el.getAttribute('content') || el.getAttribute('href') || '') : '';
  }

  function pageUrl() {
    var u = meta('meta[property="og:url"]') || meta('link[rel="canonical"]') || (location.origin + location.pathname);
    return u.split('#')[0].split('?')[0];
  }

  function pageTitle() {
    var t = meta('meta[property="og:title"]') || document.title || '';
    return t.replace(/\s+[|—–-]\s+Katoya Palmer.*$/i, '').trim();
  }

  function tagged(source) {
    return pageUrl() + '?utm_source=' + encodeURIComponent(source) +
      '&utm_medium=social&utm_campaign=share_button';
  }

  function consentGiven() {
    try {
      var m = document.cookie.match(/(?:^|; )toybox_consent=([^;]*)/);
      if (!m) return false;
      var c = JSON.parse(decodeURIComponent(m[1]));
      return c && c.analytics === true;
    } catch (e) { return false; }
  }

  function track(method) {
    if (consentGiven() && typeof window.gtag === 'function') {
      window.gtag('event', 'share', { method: method, content_type: 'page', item_id: location.pathname });
    }
  }

  var ICONS = {
    share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v7h4v-7h3l1-4h-4V8z"/>',
    linkedin: '<rect x="3" y="9" width="4" height="12"/><circle cx="5" cy="4.5" r="2"/><path d="M10 9h4v2a4 4 0 0 1 7 2.5V21h-4v-7a2 2 0 0 0-4 0v7h-3z"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'
  };

  function icon(name) {
    return '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  }

  function button(name, label, href) {
    var el = document.createElement(href ? 'a' : 'button');
    el.className = 'kp-share-btn kp-share-' + name;
    el.innerHTML = icon(name) + '<span>' + label + '</span>';
    if (href) {
      el.href = href;
      if (name !== 'email') { el.target = '_blank'; el.rel = 'noopener'; }
      el.setAttribute('aria-label', 'Share on ' + label);
      el.addEventListener('click', function () { track(name); });
    } else {
      el.type = 'button';
    }
    return el;
  }

  function build() {
    if (document.querySelector('.kp-share')) return;
    var title = pageTitle();
    var wrap = document.createElement('section');
    wrap.className = 'kp-share no-print';
    wrap.setAttribute('aria-label', 'Share this page');
    var lab = document.createElement('p');
    lab.className = 'kp-share-label';
    lab.textContent = 'Share this';
    var row = document.createElement('div');
    row.className = 'kp-share-row';

    if (navigator.share) {
      var native = button('share', 'Share');
      native.addEventListener('click', function () {
        navigator.share({ title: title, url: tagged('native_share') })
          .then(function () { track('native_share'); }).catch(function () {});
      });
      row.appendChild(native);
    }
    row.appendChild(button('facebook', 'Facebook',
      'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(tagged('facebook'))));
    row.appendChild(button('linkedin', 'LinkedIn',
      'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(tagged('linkedin'))));
    row.appendChild(button('x', 'X',
      'https://x.com/intent/post?url=' + encodeURIComponent(tagged('x')) + '&text=' + encodeURIComponent(title)));
    row.appendChild(button('email', 'Email',
      'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(title + '\n\n' + tagged('email'))));

    var copy = button('copy', 'Copy link');
    copy.addEventListener('click', function () {
      var url = tagged('copy_link');
      var done = function () {
        copy.querySelector('span').textContent = 'Copied';
        track('copy_link');
        setTimeout(function () { copy.querySelector('span').textContent = 'Copy link'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else {
        window.prompt('Copy this link:', url);
      }
    });
    row.appendChild(copy);

    wrap.appendChild(lab);
    wrap.appendChild(row);

    var slot = document.querySelector('[data-share]');
    if (slot) { slot.appendChild(wrap); return; }
    var before = document.querySelector('section.more') || document.querySelector('footer');
    if (before && before.parentNode) {
      var outer = document.createElement('div');
      outer.className = 'kp-share-outer';
      outer.appendChild(wrap);
      before.parentNode.insertBefore(outer, before);
    } else {
      document.body.appendChild(wrap);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
