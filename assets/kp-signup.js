/* katoyapalmer.com inline sign-up (2026-10-12).
   Posts to the same Brevo form into a hidden frame, so the visitor stays on the page.
   Without JS the form posts normally and Brevo shows its own confirmation page. */
(function () {
  var forms = document.querySelectorAll('form.kp-signup');
  if (!forms.length) return;
  var frame = document.createElement('iframe');
  frame.name = 'kp-signup-frame';
  frame.title = 'Sign-up';
  frame.hidden = true;
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  document.body.appendChild(frame);

  [].forEach.call(forms, function (f) {
    f.target = 'kp-signup-frame';
    var msg = f.querySelector('.kp-signup-msg'), btn = f.querySelector('button'), email = f.querySelector('input[type=email]');
    f.addEventListener('submit', function (e) {
      if (!email.value || !email.checkValidity()) { e.preventDefault(); msg.textContent = 'Please enter a valid email address.'; email.focus(); return; }
      btn.disabled = true;
      msg.textContent = 'Signing you up…';
      var done = false;
      function finish() {
        if (done) return; done = true;
        f.classList.add('done');
        msg.textContent = 'Thank you! Check your inbox. The letter arrives Monday mornings.';
        if (window.gtag) gtag('event', 'newsletter_signup', { method: 'inline', placement: f.getAttribute('data-kp-signup') || '' });
      }
      frame.addEventListener('load', finish, { once: true });
      setTimeout(function () { // no response from Brevo: offer its own page instead of claiming success
        if (done) return; done = true; btn.disabled = false;
        msg.innerHTML = 'That’s taking a while. <a href="' + f.action + '" target="_blank" rel="noopener">Sign up on this page instead</a>.';
      }, 8000);
    });
  });
})();
