/* kp-music.js: small site-wide music player for katoyapalmer.com.
   - Off until the visitor taps it (browsers block autoplay with sound).
   - Remembers on/off in localStorage ("kp-music"), wrapped in try/catch.
   - Fades in over 1.5s to volume 0.35, loops, pauses while the tab is hidden.
   - Each page picks its track with <body data-track="home|lipstick|sznd|mindfulness">.
   Music: Epidemic Sound (Creator plan; katoyapalmer.com is safelisted). See README. */
(function () {
  "use strict";
  var TRACKS = {
    home:        { src: "/media/music/build-a-foundation.mp3", title: "Build a Foundation", artist: "Nyck Caution" },
    lipstick:    { src: "/media/music/mojo.mp3",               title: "MOJO",               artist: "Nic Hanson" },
    sznd:        { src: "/media/music/randle.mp3",             title: "Randle",             artist: "Nyck Caution" },
    mindfulness: { src: "/media/music/dreamlike.mp3",          title: "Dreamlike",          artist: "Megan Wofford" }
  };
  var VOLUME = 0.35, FADE_IN = 1500, FADE_OUT = 400, KEY = "kp-music";

  function store(v) { try { if (v === undefined) return window.localStorage.getItem(KEY); window.localStorage.setItem(KEY, v); } catch (e) { return null; } }

  function init() {
    var body = document.body;
    if (!body || document.querySelector(".kp-music")) return;
    var key = body.getAttribute("data-track") || "home";
    var t = TRACKS[key] || TRACKS.home;

    var audio = new Audio();
    audio.preload = "none";
    audio.loop = true;
    audio.volume = 0;
    audio.src = t.src;

    var wrap = document.createElement("div");
    wrap.className = "kp-music kp-music--enter";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Background music");
    wrap.innerHTML =
      '<button type="button" class="kp-music__btn" aria-pressed="false">' +
        '<span class="kp-music__icon" aria-hidden="true"><span class="kp-music__note">♪</span><span class="kp-music__bars"><i></i><i></i><i></i></span></span>' +
        '<span class="kp-music__label">Play the vibe</span>' +
      '</button>' +
      '<span class="kp-music__meta" aria-live="polite">' +
        '<span class="kp-music__track"></span>' +
        '<span class="kp-music__credit">Music: Epidemic Sound</span>' +
      '</span>';
    var btn = wrap.querySelector(".kp-music__btn");
    var label = wrap.querySelector(".kp-music__label");
    wrap.querySelector(".kp-music__track").textContent = t.title + " · " + t.artist;
    body.appendChild(wrap);

    // spacer below the footer on phones, painted to match it, so the pill never covers the last line
    var spacer = document.createElement("div");
    spacer.className = "kp-music-spacer";
    spacer.setAttribute("aria-hidden", "true");
    var foot = document.querySelector("footer");
    if (foot) { var bg = getComputedStyle(foot).backgroundColor; if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") spacer.style.background = bg; }
    body.insertBefore(spacer, wrap);

    var on = false, raf = 0, hiddenPause = false;

    function ramp(to, ms, done) {
      cancelAnimationFrame(raf);
      var from = audio.volume, start = performance.now();
      (function step(now) {
        var k = Math.min(1, (now - start) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
      })(start);
    }
    function render() {
      wrap.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      label.textContent = on ? "Pause" : (store() === "on" ? "Resume the vibe" : "Play the vibe");
      btn.setAttribute("aria-label", on
        ? "Pause background music, " + t.title + " by " + t.artist
        : "Play background music, " + t.title + " by " + t.artist);
    }
    function play(remember) {
      var p = audio.play();
      var ok = function () { on = true; ramp(VOLUME, FADE_IN); if (remember) store("on"); render(); };
      if (p && p.then) { p.then(ok, function () { on = false; render(); }); } else { ok(); }
    }
    function pause(remember) {
      on = false;
      if (remember) store("off");
      render();
      ramp(0, FADE_OUT, function () { audio.pause(); });
    }

    btn.addEventListener("click", function () { if (on) pause(true); else play(true); });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (on) { hiddenPause = true; cancelAnimationFrame(raf); audio.pause(); on = false; render(); } }
      else if (hiddenPause) { hiddenPause = false; audio.volume = 0; play(false); }
    });

    render();
    // Visitor chose "on" earlier: try to carry it over. Most browsers refuse sound without a tap,
    // in which case the pill simply offers "Resume the vibe".
    if (store() === "on") { audio.preload = "auto"; play(false); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
