# Deploy katoyapalmer.com on GitHub Pages

This folder is a complete, self-contained website. No build step.

```
katoyapalmer-site/
├── index.html        ← the site
├── CNAME             ← tells GitHub your custom domain (katoyapalmer.com)
└── assets/           ← photos + brand logos
```

## 1. Put these files in a GitHub repo
- Create a new repository (any name, e.g. `katoyapalmer`). Make it **Public**.
- Upload **the contents of this folder** to the repo root — so `index.html` and `CNAME`
  sit at the top level of the repo (not inside a subfolder), with `assets/` beside them.
  (On github.com: "Add file → Upload files" → drag everything in, Commit.)

## 2. Turn on GitHub Pages
- Repo **Settings → Pages**.
- **Source:** "Deploy from a branch" → Branch: `main` → Folder: `/ (root)` → Save.
- Wait ~1 minute. It goes live at `https://YOURUSERNAME.github.io/REPONAME/`.
- Under **Custom domain**, `katoyapalmer.com` should already be filled in (from the CNAME file).
  Tick **Enforce HTTPS** once it's available.

## 3. Point your domain at GitHub (DNS)
At whatever provider holds katoyapalmer.com after you transfer it, set these records:

**Apex domain (katoyapalmer.com) — four A records:**
```
A   @   185.199.108.153
A   @   185.199.109.153
A   @   185.199.110.153
A   @   185.199.111.153
```
**(Optional, IPv6) — four AAAA records:**
```
AAAA  @  2606:50c0:8000::153
AAAA  @  2606:50c0:8001::153
AAAA  @  2606:50c0:8002::153
AAAA  @  2606:50c0:8003::153
```
**www subdomain — one CNAME:**
```
CNAME   www   YOURUSERNAME.github.io
```

DNS can take a few minutes to 24 hours. GitHub issues the HTTPS certificate automatically.

## Updating the site later
Edit `index.html` in the repo (or re-upload) — GitHub Pages redeploys on every commit.

---
Built for Katoya Raquell Palmer · katoyapalmer.com

## Music on the site (added 2026-10-08)

A small tap-to-play pill (bottom-left) plays one instrumental per section. It stays off until a visitor taps it,
remembers their on/off choice (localStorage `kp-music`), fades in over 1.5s to volume 0.35, loops, and pauses
while the tab is hidden. Code: `assets/kp-music.js` + `assets/kp-music.css`. Each page picks its track with
`<body data-track="...">`. Audio is served from `/media/music/` (CSP: `media-src 'self'`).

| data-track | Pages | Track | File |
|---|---|---|---|
| `home` | home, journal/, links/, playbook/, media/, letters/, 404, privacy, terms, cookies | Build a Foundation (Instrumental Version), Nyck Caution | `media/music/build-a-foundation.mp3` |
| `lipstick` | lipstick.html, reviews/ | MOJO (Instrumental Version), Nic Hanson | `media/music/mojo.mp3` |
| `sznd` | sznd.html, recipes/ | Randle (Instrumental Version), Nyck Caution | `media/music/randle.mp3` |
| `mindfulness` | mindfulness.html | Dreamlike, Megan Wofford (solo piano) | `media/music/dreamlike.mp3` |

Web copies: 128 kbps stereo MP3, loudness-normalized to about -18 LUFS, 2s fade-in and 3s fade-out, full length.

**License:** Music: Epidemic Sound. Katoya's Epidemic Sound Creator plan covers websites, and katoyapalmer.com is a
safelisted channel. **The plan (trial) ends Nov 7, 2026.** Decide before then whether to keep the plan or take the
music down; new uses can't be added after the plan ends. Instrumentals only. Any track with lyrics needs Katoya's
listen before it goes on the site.
